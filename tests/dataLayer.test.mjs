/**
 * 資料層測試（階段 0）。
 *
 * 執行：npm run test:datalayer
 *
 * 涵蓋三個模組：
 * - `src/data/keys.js`    鍵註冊表
 * - `src/data/store.js`   單一存取層與舊鍵遷移
 * - `shared/schema.js`    房間同步契約
 *
 * 這裡最重要的是 D 區段（遷移）與 F 區段（同步邊界）。
 * 遷移會動到使用者的 NPC 檔案庫，所以每一條安全保證都必須被斷言；
 * 同步邊界則決定了未來免費額度會不會爆掉。
 */
import { STORAGE_KEYS, LEGACY_KEYS, ALL_STORAGE_KEYS } from '../src/data/keys.js';
import {
  __setStorageBackend,
  readRaw,
  writeRaw,
  readJSON,
  writeJSON,
  removeKey,
  clearAll,
  subscribe,
  migrateLegacyStorage,
} from '../src/data/store.js';
import {
  SCHEMA_VERSION,
  ROOM_MESSAGE_TYPES,
  ROOM_ROLES,
  isGmOnlyType,
  clampResource,
  applyResourceDelta,
  toCombatantSnapshot,
  createEmptyRoomState,
  createReward,
} from '../shared/schema.js';

let pass = 0;
let fail = 0;
const lines = [];

/**
 * 正規化：遞迴排序物件鍵，但**保留陣列順序**。
 *
 * 為什麼不直接用 JSON.stringify 比較：JS 物件的鍵序不具語意，卻會被
 * JSON.stringify 忠實反映。例如 `applyResourceDelta({max:10}, -3)` 回傳的是
 * `{max:10, current:7}`，而 `{current:7, max:10}` 是同一件事。用鍵序比較會
 * 讓測試因為無關緊要的細節而失敗，也會掩蓋真正該抓的差異。
 * 陣列順序**有**語意，故不排序。
 */
const canon = (v) => {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    return Object.keys(v).sort().reduce((acc, k) => { acc[k] = canon(v[k]); return acc; }, {});
  }
  return v;
};

const check = (label, actual, expected) => {
  const ok = JSON.stringify(canon(actual)) === JSON.stringify(canon(expected));
  if (ok) pass += 1;
  else fail += 1;
  lines.push(
    ok
      ? `  PASS  ${label}`
      : `  FAIL  ${label}\n          期望 ${JSON.stringify(expected)}\n          實得 ${JSON.stringify(actual)}`
  );
};
const section = (t) => lines.push(`\n=== ${t} ===`);

/** 建一個乾淨的模擬後端。 */
const mockBackend = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
    dump: () => Object.fromEntries(map),
  };
};

/** 每個區段開頭重設後端，避免互相污染。 */
const reset = (initial = {}) => {
  const b = mockBackend(initial);
  __setStorageBackend(b);
  return b;
};

// ─────────────────────────────────────────────────────────── A
section('A. 鍵註冊表完整性');
{
  const values = Object.values(STORAGE_KEYS);
  check('每個權威鍵都是非空字串', values.every((v) => typeof v === 'string' && v.length > 0), true);
  check('權威鍵之間無重複', new Set(values).size, values.length);

  const legacyValues = Object.values(LEGACY_KEYS);
  check('每個舊鍵都是非空字串', legacyValues.every((v) => typeof v === 'string' && v.length > 0), true);
  check('舊鍵之間無重複', new Set(legacyValues).size, legacyValues.length);

  // 舊鍵與權威鍵不得共用同一個字串，否則遷移邏輯會自我覆寫
  const overlap = values.filter((v) => legacyValues.includes(v));
  check('舊鍵與權威鍵無交集', overlap, []);

  check('ALL_STORAGE_KEYS 為兩者聯集', ALL_STORAGE_KEYS.length, values.length + legacyValues.length);

  // 這三條是本次修 bug 的核心：NPC 檔案庫只能有一個權威鍵
  check('NPC 檔案庫權威鍵', STORAGE_KEYS.npcLibrary, 'fu_companion_npc_library');
  check('NPC 工坊舊鍵仍登記為舊鍵', LEGACY_KEYS.npcLibraryV2, 'fabula-npc-library-v2');
  check('死鍵仍登記為舊鍵', LEGACY_KEYS.npcLibraryStray, 'fu_npc_library');
}

// ─────────────────────────────────────────────────────────── B
section('B. 存取層基本讀寫');
{
  reset();
  check('讀不存在的鍵 -> fallback', readJSON('nothing', 'fb'), 'fb');
  check('讀不存在的原始鍵 -> null', readRaw('nothing'), null);

  writeJSON('k1', { a: 1 });
  check('JSON 往返', readJSON('k1', null), { a: 1 });
  check('原始字串可見 JSON 編碼', readRaw('k1'), '{"a":1}');

  writeRaw('k2', 'amber');
  check('原始字串往返', readRaw('k2'), 'amber');
  check('原始字串以 writeJSON 讀會回退', readJSON('k2', 'fb'), 'fb');

  writeJSON('k3', [1, 2, 3]);
  check('陣列往返', readJSON('k3', null), [1, 2, 3]);

  check('空字串視為無值 -> fallback', (() => { writeRaw('k4', ''); return readJSON('k4', 'fb'); })(), 'fb');

  check('寫入回傳 true', writeJSON('k5', 1), true);
  removeKey('k5');
  check('移除後讀不到', readRaw('k5'), null);
}

// ─────────────────────────────────────────────────────────── C
section('C. 壞資料不得讓程式崩潰');
{
  reset({ broken: '{不是合法 JSON', nullish: 'null', arr: '[]' });
  check('損壞 JSON -> fallback', readJSON('broken', 'fb'), 'fb');
  check('字面 null -> fallback', readJSON('nullish', 'fb'), 'fb');
  check('空陣列是合法值', readJSON('arr', 'fb'), []);

  const b = reset({ a: '1', b: '2', c: '3' });
  check('clearAll 清空全部鍵', (() => { clearAll(); return b.length; })(), 0);

  // 訂閱：寫入要通知、退訂後不再通知
  reset();
  let seen = null;
  const off = subscribe('sub', (v) => { seen = v; });
  writeJSON('sub', { n: 1 });
  check('訂閱者收到寫入', seen, { n: 1 });
  off();
  seen = null;
  writeJSON('sub', { n: 2 });
  check('退訂後不再收到', seen, null);

  // 訂閱者拋錯不得中斷寫入
  reset();
  subscribe('boom', () => { throw new Error('listener 壞了'); });
  check('訂閱者拋錯時寫入仍成功', writeJSON('boom', 1), true);
}

// ─────────────────────────────────────────────────────────── D
section('D. 舊鍵遷移（本次修 bug 的核心，動到使用者資料）');
{
  // D1 舊鍵有資料、權威鍵為空 -> 搬移
  let b = reset({ [LEGACY_KEYS.npcLibraryV2]: '[{"id":"npc1"}]' });
  let rep = migrateLegacyStorage();
  check('D1 回報已遷移', rep.migrated, [{ canonical: STORAGE_KEYS.npcLibrary, from: LEGACY_KEYS.npcLibraryV2 }]);
  check('D1 權威鍵取得內容', readJSON(STORAGE_KEYS.npcLibrary, null), [{ id: 'npc1' }]);
  check('D1 舊鍵未被刪除（可逆）', readRaw(LEGACY_KEYS.npcLibraryV2), '[{"id":"npc1"}]');

  // D2 權威鍵已有資料 -> 絕不覆寫
  b = reset({
    [STORAGE_KEYS.npcLibrary]: '[{"id":"new"}]',
    [LEGACY_KEYS.npcLibraryV2]: '[{"id":"old"}]',
  });
  rep = migrateLegacyStorage();
  check('D2 回報跳過', rep.skipped, [STORAGE_KEYS.npcLibrary]);
  check('D2 權威鍵內容未被覆寫', readJSON(STORAGE_KEYS.npcLibrary, null), [{ id: 'new' }]);
  check('D2 未誤報遷移', rep.migrated.length, 0);

  // D3 兩邊都空 -> 什麼都不做
  reset();
  rep = migrateLegacyStorage();
  check('D3 回報為空', rep.empty, [STORAGE_KEYS.npcLibrary]);
  check('D3 未產生權威鍵', readRaw(STORAGE_KEYS.npcLibrary), null);

  // D4 舊鍵內容損壞 -> 不升級成權威資料
  reset({ [LEGACY_KEYS.npcLibraryV2]: '{壞掉的' });
  rep = migrateLegacyStorage();
  check('D4 未遷移', rep.migrated.length, 0);
  check('D4 權威鍵仍為空', readRaw(STORAGE_KEYS.npcLibrary), null);
  check('D4 有記錄跳過原因', rep.skipped.length, 1);

  // D5 死鍵可作為次要來源
  reset({ [LEGACY_KEYS.npcLibraryStray]: '[{"id":"stray"}]' });
  rep = migrateLegacyStorage();
  check('D5 從死鍵遷移', rep.migrated, [{ canonical: STORAGE_KEYS.npcLibrary, from: LEGACY_KEYS.npcLibraryStray }]);

  // D6 冪等：連跑兩次不得有副作用
  b = reset({ [LEGACY_KEYS.npcLibraryV2]: '[{"id":"npc1"}]' });
  migrateLegacyStorage();
  const afterFirst = readRaw(STORAGE_KEYS.npcLibrary);
  const rep2 = migrateLegacyStorage();
  check('D6 第二次執行回報跳過', rep2.skipped, [STORAGE_KEYS.npcLibrary]);
  check('D6 第二次執行未改變內容', readRaw(STORAGE_KEYS.npcLibrary), afterFirst);

  // D7 遷移優先取較新的舊鍵
  reset({
    [LEGACY_KEYS.npcLibraryV2]: '[{"id":"v2"}]',
    [LEGACY_KEYS.npcLibraryStray]: '[{"id":"stray"}]',
  });
  rep = migrateLegacyStorage();
  check('D7 優先來源為 v2', rep.migrated[0].from, LEGACY_KEYS.npcLibraryV2);
}

// ─────────────────────────────────────────────────────────── E
section('E. 資源夾值（伺服器與前端共用，兩邊必須算出同一結果）');
{
  check('一般夾值', clampResource(7, 10), 7);
  check('超過上限 -> 上限', clampResource(99, 10), 10);
  check('負數 -> 0', clampResource(-5, 10), 0);
  check('非數字 -> 0', clampResource('abc', 10), 0);
  check('max 非數字 -> 0', clampResource(5, 'abc'), 0);
  check('max 為 0 -> 0', clampResource(5, 0), 0);
  check('字串數字可解析', clampResource('8', 10), 8);
  check('小數無條件捨去', clampResource(7.9, 10), 7);

  check('增量：正常', applyResourceDelta({ current: 5, max: 10 }, 3), { current: 8, max: 10 });
  check('增量：夾到上限', applyResourceDelta({ current: 5, max: 10 }, 99), { current: 10, max: 10 });
  check('增量：夾到 0', applyResourceDelta({ current: 5, max: 10 }, -99), { current: 0, max: 10 });
  check('增量：current 缺值時以 max 為起點', applyResourceDelta({ max: 10 }, -3), { current: 7, max: 10 });
  check('增量：非數字視為 0', applyResourceDelta({ current: 5, max: 10 }, 'x'), { current: 5, max: 10 });
}

// ─────────────────────────────────────────────────────────── F
section('F. 同步邊界：哪些欄位可以進廣播');
{
  const character = {
    instanceId: 'comb_1',
    sourceId: 'char_1',
    sourceType: 'character',
    name: '卡蜜拉',
    faction: '玩家隊伍',
    level: 5,
    avatar: 'data:image/png;base64,' + 'A'.repeat(5000),
    hp: { current: 40, max: 40, crisisThreshold: 20 },
    mp: { current: 50, max: 50 },
    ip: { current: 6, max: 6 },
    attributes: { dex: 8, ins: 10, mig: 6, wlp: 8 },
    defense: 8,
    magicDefense: 10,
    initiative: 0,
    hasActed: false,
    statusEffects: { slow: false },
    skills: [{ id: 's1', name: '鐵壁 (SL 3)' }],
    rawCharData: { 大物件: 'A'.repeat(5000) },
  };

  const snap = toCombatantSnapshot(character);
  check('保留 instanceId', snap.instanceId, 'comb_1');
  check('保留 HP', snap.hp, { current: 40, max: 40, crisisThreshold: 20 });
  check('保留 MP', snap.mp, { current: 50, max: 50 });
  check('玩家角色保留 IP', snap.ip, { current: 6, max: 6 });

  // 這是本區段存在的理由：體積最大的欄位必須被剝掉
  check('剝除 skills', 'skills' in snap, false);
  check('剝除 rawCharData', 'rawCharData' in snap, false);
  check('剝除 avatar', 'avatar' in snap, false);

  const npc = {
    instanceId: 'comb_2',
    sourceType: 'npc',
    name: '哥布林',
    hp: { current: 30, max: 30 },
    mp: { current: 10, max: 10 },
    statusEffects: {},
  };
  const npcSnap = toCombatantSnapshot(npc);
  check('NPC 無 IP 時為 null（官方規則中 NPC 不持有 IP）', npcSnap.ip, null);
  check('NPC 危機值自動補算為半血', npcSnap.hp.crisisThreshold, 15);
  check('NPC 預設陣營為敵方', npcSnap.faction, '敵方');
  check('NPC 預設 hasActed 為 false', npcSnap.hasActed, false);

  check('current 超過 max 時夾住', toCombatantSnapshot({ hp: { current: 999, max: 40 }, mp: {} }).hp.current, 40);
  check('空輸入回傳 null', toCombatantSnapshot(null), null);
  check('ownerPeerId 預設為 null', snap.ownerPeerId, null);
}

// ─────────────────────────────────────────────────────────── G
section('G. 房間契約與權限');
{
  check('契約版本為正整數', Number.isInteger(SCHEMA_VERSION) && SCHEMA_VERSION > 0, true);

  check('空房間初始輪次為 1', createEmptyRoomState('FU-1234').round, 1);
  check('空房間帶入房號', createEmptyRoomState('FU-1234').roomCode, 'FU-1234');
  check('空房間 rev 為 0', createEmptyRoomState('FU-1234').rev, 0);
  check('空房間無參戰者', createEmptyRoomState('FU-1234').combatants, []);

  const r = createReward({ text: '全團 +1 物語點' });
  check('獎勵帶入文字', r.text, '全團 +1 物語點');
  check('獎勵 recipients 預設為空陣列', r.recipients, []);
  check('獎勵有建立時間', typeof r.createdAt, 'string');

  // 權限：僅 GM 可改戰場結構
  check('推輪次僅限 GM', isGmOnlyType(ROOM_MESSAGE_TYPES.ROUND_NEXT), true);
  check('發布獎勵僅限 GM', isGmOnlyType(ROOM_MESSAGE_TYPES.REWARD_PUBLISH), true);
  check('新增參戰者僅限 GM', isGmOnlyType(ROOM_MESSAGE_TYPES.COMBATANT_ADD), true);
  check('HP 變動開放給玩家', isGmOnlyType(ROOM_MESSAGE_TYPES.HP_DELTA), false);
  check('MP 變動開放給玩家', isGmOnlyType(ROOM_MESSAGE_TYPES.MP_DELTA), false);
  check('標記已行動開放給玩家', isGmOnlyType(ROOM_MESSAGE_TYPES.ACT_TOGGLE), false);

  // fail closed：未知型別一律視為受限
  check('未知型別視為受限（fail closed）', isGmOnlyType('some:unknown'), true);
  check('空字串視為受限', isGmOnlyType(''), true);

  check('GM 角色常數', ROOM_ROLES.GM, 'gm');
  check('玩家角色常數', ROOM_ROLES.PLAYER, 'player');
}

// ─────────────────────────────────────────────────────────── 結果
__setStorageBackend(null);

console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
