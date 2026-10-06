/**
 * 成長履歷測試。
 *
 * 執行：npm run test:creation 之外的獨立關卡 —— npm run test:log
 *
 * 這份資料的用途是「角色卡不再只有現在是什麼，還有怎麼變成這樣的」：
 * HP／MP／IP／物語點／EXP／資金的變動、升級、換裝都留下一筆帶前後值的記錄，
 * 供玩家回顧、GM 審卡，以及未來的團務獎勵與同步。
 */
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  LOG_KINDS,
  LOG_FIELD_LABELS,
  LOG_LIMIT,
  getLog,
  createLogEntry,
  appendLog,
  loggableChange,
  diffFields,
  filterLog,
  sortLogDesc,
  summarizeLog,
  formatChange,
  formatLogTime
} from '../src/features/character-sheet/utils/characterLog.js';
import { createNewCharacter } from '../src/features/character-sheet/utils/characterEngine.js';
import { CharacterLogBody } from '../src/features/character-sheet/components/CharacterLogModal.jsx';
import { getCharacterTheme } from '../src/features/character-sheet/utils/characterThemes.js';

let pass = 0;
let fail = 0;
const lines = [];

const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass += 1;
  else fail += 1;
  lines.push(
    ok
      ? `  PASS  ${label}`
      : `  FAIL  ${label}\n          期望 ${JSON.stringify(expected)}\n          實得 ${JSON.stringify(actual)}`
  );
};
const section = (t) => lines.push(`\n=== ${t} ===`);

const T0 = '2026-10-05T10:00:00.000Z';
const at = (ms) => new Date(Date.parse(T0) + ms).toISOString();
const baseChar = (over = {}) => ({ id: 'char_test', name: '測試', ...over });

// ─────────────────────────────────────────────────────────── A
section('A. 種類詞彙：封閉、且每個圖示都畫得出來');

check('每一種 kind 都有 label／icon／coalesce',
  Object.entries(LOG_KINDS).filter(([, v]) =>
    typeof v.label !== 'string' || typeof v.icon !== 'string' || typeof v.coalesce !== 'number'
  ).map(([k]) => k), []);
check('kind 數量（建卡／等級／技能／裝備／HP／MP／IP／物語點／EXP／資金／團務獎勵／記事）',
  Object.keys(LOG_KINDS).length, 12);
check('未登記的 kind 一律拒收',
  createLogEntry({ kind: '不存在的種類', title: 'x' }), null);
check('未登記的 kind 不會寫進角色',
  getLog(appendLog(baseChar(), { kind: '不存在的種類', title: 'x' })).length, 0);

const gameIconSource = fs.readFileSync(
  new URL('../src/components/ui/GameIcon.jsx', import.meta.url), 'utf8'
);
const missingIcons = Object.entries(LOG_KINDS)
  .filter(([, meta]) => !new RegExp(`^\\s+${meta.icon},?\\s*$`, 'm').test(gameIconSource))
  .map(([k, meta]) => `${k}:${meta.icon}`);
check('每個 LOG_KINDS 的圖示都是 GameIcon 認得的元件名（護欄）', missingIcons, []);

// ─────────────────────────────────────────────────────────── B
section('B. createLogEntry：正規化與拒收');

check('只有標題（沒有變更）→ 收', createLogEntry({ kind: 'note', title: '場外協議' }).title, '場外協議');
check('沒有標題也沒有變更 → 拒收', createLogEntry({ kind: 'note' }), null);
check('標題只有空白 → 拒收', createLogEntry({ kind: 'note', title: '   ' }), null);
check('沒有 changes 時 title 由 changes 推導',
  createLogEntry({ kind: 'hp', changes: [{ field: 'currentHp', from: 12, to: 8 }] }).title, 'HP 12 → 8');
check('多筆 changes 以頓號串接',
  createLogEntry({ kind: 'equipment', changes: [{ field: 'mainHand', from: '青銅劍', to: '戰斧' }, { field: 'offHand', from: '青銅圓盾', to: '無盾牌' }] }).title,
  '主手 青銅劍 → 戰斧、副手 青銅圓盾 → 無盾牌');
check('值沒變的 change 會被濾掉',
  createLogEntry({ kind: 'hp', title: 'x', changes: [{ field: 'currentHp', from: 8, to: 8 }] }).changes, []);
check('changes 不是陣列 → 視為沒有變更',
  createLogEntry({ kind: 'hp', title: 'x', changes: '壞資料' }).changes, []);
check('缺 field 的 change 被濾掉',
  createLogEntry({ kind: 'hp', title: 'x', changes: [{ from: 1, to: 2 }] }).changes, []);
check('from/to 未給 → 記為 null（不是 undefined）',
  createLogEntry({ kind: 'equipment', title: 'x', changes: [{ field: 'armor', from: '無裝甲 / 冒險服' }] }).changes[0],
  { field: 'armor', from: '無裝甲 / 冒險服', to: null });
check('at 非法 → 用現在時間',
  Number.isFinite(Date.parse(createLogEntry({ kind: 'note', title: 'x', at: '不是時間' }).at)), true);
check('at 合法 → 正規化成 ISO',
  createLogEntry({ kind: 'note', title: 'x', at: '2026-10-05T10:00:00Z' }).at, T0);
check('note 去頭尾空白',
  createLogEntry({ kind: 'note', title: 'x', note: '  備註  ' }).note, '備註');
check('每筆都有唯一 id',
  createLogEntry({ kind: 'note', title: 'x' }).id === createLogEntry({ kind: 'note', title: 'x' }).id, false);

// ─────────────────────────────────────────────────────────── C
section('C. formatChange：前後值才是有用的資訊');

check('HP 12 → 8', formatChange({ field: 'currentHp', from: 12, to: 8 }), 'HP 12 → 8');
check('主手 青銅劍 → 戰斧', formatChange({ field: 'mainHand', from: '青銅劍', to: '戰斧' }), '主手 青銅劍 → 戰斧');
check('空字串顯示為（空）', formatChange({ field: 'accessory', from: '', to: '守護護符' }), '飾品 （空） → 守護護符');
check('陣列只顯示項數', formatChange({ field: 'classes', from: [1, 2], to: [1, 2, 3] }), '職業 2 項 → 3 項');
check('skill: 前綴寫成【技能名】SL',
  formatChange({ field: 'skill:元素魔法', from: 1, to: 2 }), '【元素魔法】SL 1 → 2');
check('未登記欄位用原文', formatChange({ field: 'customThing', from: 1, to: 2 }), 'customThing 1 → 2');
check('欄位顯示名表涵蓋六項資源',
  ['currentHp', 'currentMp', 'currentIp', 'exp', 'zenit', 'fabulaPoints'].every((k) => LOG_FIELD_LABELS[k]),
  true);

// ─────────────────────────────────────────────────────────── D
section('D. appendLog：append-only、時間正序、可合併');

const noteAt = (t, text) => createLogEntry({ kind: 'note', title: text, at: t });

const c0 = baseChar();
const c1 = appendLog(c0, noteAt(T0, '第一筆'));
check('不就地修改原角色', [Array.isArray(c0.log), getLog(c1).length], [false, 1]);
check('追加於尾（時間正序）',
  getLog(appendLog(c1, noteAt(at(1000), '第二筆'))).map((e) => e.title), ['第一筆', '第二筆']);
check('空陣列 → 原樣回傳', appendLog(c1, []), c1);
check('null 條目 → 原樣回傳', appendLog(c1, null), c1);
check('會更新 updatedAt', getLog(c1).length === 1 && typeof c1.updatedAt === 'string', true);

const many = Array.from({ length: LOG_LIMIT + 5 }, (_, i) => noteAt(at(i * 1000), `第 ${i} 筆`))
  .reduce((acc, e) => appendLog(acc, e), baseChar());
check(`上限裁剪到 ${LOG_LIMIT} 筆`, getLog(many).length, LOG_LIMIT);
check('裁剪時丟掉最舊的', getLog(many)[0].title, '第 5 筆');
check('自訂上限生效',
  getLog([noteAt(at(0), 'a'), noteAt(at(1000), 'b')].reduce((acc, e) => appendLog(acc, e, { limit: 1 }), baseChar())).map((e) => e.title),
  ['b']);

// 合併（HP 宣告 120 秒時窗）
const hp = (t, from, to) => ({ kind: 'hp', changes: [{ field: 'currentHp', from, to }], at: t });
const hpLog = [
  hp(T0, 12, 11),
  hp(at(30000), 11, 10),
  hp(at(60000), 10, 9)
].reduce((acc, e) => appendLog(acc, e), baseChar());
check('同 kind 同欄位在時窗內合併成一筆', getLog(hpLog).length, 1);
check('合併保留最初的 from、取最新的 to', getLog(hpLog)[0].changes[0], { field: 'currentHp', from: 12, to: 9 });
check('合併後時間取最新', getLog(hpLog)[0].at, at(60000));

const hpSplit = [hp(T0, 12, 11), hp(at(180000), 11, 10)].reduce((acc, e) => appendLog(acc, e), baseChar());
check('超出時窗則不合併', getLog(hpSplit).length, 2);

const hpFields = [
  hp(T0, 12, 11),
  { kind: 'hp', changes: [{ field: 'currentMp', from: 5, to: 4 }], at: at(1000) }
].reduce((acc, e) => appendLog(acc, e), baseChar());
check('不同欄位不合併', getLog(hpFields).length, 2);

const equipTwice = [
  { kind: 'equipment', changes: [{ field: 'mainHand', from: '青銅劍', to: '戰斧' }], at: T0 },
  { kind: 'equipment', changes: [{ field: 'mainHand', from: '戰斧', to: '巨劍' }], at: at(1000) }
].reduce((acc, e) => appendLog(acc, e), baseChar());
check('宣告 coalesce 0 的種類永不合併', getLog(equipTwice).length, 2);

const multiChange = [
  { kind: 'hp', changes: [{ field: 'currentHp', from: 12, to: 11 }], at: T0 },
  { kind: 'hp', changes: [{ field: 'currentHp', from: 11, to: 10 }, { field: 'currentMp', from: 5, to: 4 }], at: at(1000) }
].reduce((acc, e) => appendLog(acc, e), baseChar());
check('變更多於一筆時不合併（避免吃掉資訊）', getLog(multiChange).length, 2);

// ─────────────────────────────────────────────────────────── E
section('E. loggableChange：一站式（算差異 → 寫記錄 → 回新角色）');

check('自動比對指定欄位',
  getLog(loggableChange(baseChar({ level: 5 }), baseChar({ level: 6 }), { kind: 'levelup', fields: ['level'] }))[0].changes,
  [{ field: 'level', from: 5, to: 6 }]);
check('值沒變 → 不留下記錄',
  getLog(loggableChange(baseChar({ level: 5 }), baseChar({ level: 5 }), { kind: 'levelup', fields: ['level'] })).length, 0);
check('沒有指定欄位也沒有 changes → 不留下記錄',
  getLog(loggableChange(baseChar({ level: 5 }), baseChar({ level: 6 }), { kind: 'levelup' })).length, 0);
check('明確給 changes 時優先於 fields',
  getLog(loggableChange(baseChar(), baseChar({ level: 9 }), {
    kind: 'levelup',
    fields: ['level'],
    changes: [{ field: 'level', from: 5, to: 7 }]
  }))[0].changes, [{ field: 'level', from: 5, to: 7 }]);
check('fields: [] 且有標題 → 只留標題、不比對欄位',
  getLog(loggableChange(baseChar(), baseChar({ classes: [1, 2] }), {
    kind: 'skill',
    title: '修習【守護者】',
    fields: []
  })).map((e) => ({ kind: e.kind, title: e.title, changes: e.changes })),
  [{ kind: 'skill', title: '修習【守護者】', changes: [] }]);
check('fields: [] 且沒有標題 → 不留下記錄',
  getLog(loggableChange(baseChar(), baseChar({ classes: [1, 2] }), { kind: 'skill', fields: [] })).length, 0);
check('變更後的角色仍帶著原本的欄位',
  loggableChange(baseChar({ zenit: 500 }), baseChar({ zenit: 300 }), { kind: 'zenit', fields: ['zenit'] }).zenit, 300);
check('diffFields 只收真的有變的',
  diffFields({ a: 1, b: 2 }, { a: 1, b: 3 }, ['a', 'b']), [{ field: 'b', from: 2, to: 3 }]);

// ─────────────────────────────────────────────────────────── F
section('F. summarizeLog：摘要全部由 changes 推導');

// 每筆間隔 200 秒，刻意超過各 kind 的合併時窗，讓它們保持獨立
const s0 = (i) => at(i * 200000);
const entries = [
  createLogEntry({ kind: 'creation', title: '建立角色', at: s0(0) }),
  { kind: 'exp', changes: [{ field: 'exp', from: 0, to: 5 }], at: s0(1) },
  { kind: 'exp', changes: [{ field: 'exp', from: 5, to: 12 }], at: s0(2) },
  { kind: 'zenit', changes: [{ field: 'zenit', from: 500, to: 300 }], at: s0(3) },
  { kind: 'zenit', changes: [{ field: 'zenit', from: 300, to: 450 }], at: s0(4) },
  { kind: 'levelup', changes: [{ field: 'level', from: 5, to: 6 }], at: s0(5) },
  { kind: 'equipment', changes: [{ field: 'mainHand', from: '徒手打擊', to: '戰斧' }], at: s0(6) }
].reduce((acc, e) => appendLog(acc, e), baseChar());
const s = summarizeLog(getLog(entries));
check('條目數', s.count, 7);
check('累計 EXP', s.expGained, 12);
check('資金增減（+ 與 - 相加）', s.zenitDelta, -50);
check('等級增減', s.levelGained, 1);
check('升級次數', s.levelUpCount, 1);
check('換裝次數', s.equipmentCount, 1);
check('首次時間', s.firstAt, s0(0));
check('最後時間', s.lastAt, s0(6));
check('空履歷不炸', summarizeLog([]), {
  count: 0, firstAt: null, lastAt: null, expGained: 0, zenitDelta: 0, levelGained: 0,
  levelUpCount: 0, rewardCount: 0, equipmentCount: 0
});
check('非陣列不炸', summarizeLog(null).count, 0);

// ─────────────────────────────────────────────────────────── G
section('G. 讀取與排序：舊存檔與顯示順序');

check('沒有 log 欄位的舊存檔 → 空陣列', getLog({ name: '舊角色' }), []);
check('log 是壞資料 → 空陣列', getLog({ log: '壞資料' }), []);
check('角色為 null → 空陣列', getLog(null), []);
check('依 kind 篩選',
  filterLog(getLog(entries), ['exp']).length, 2);
check('空篩選＝全部', filterLog(getLog(entries), []).length, 7);
check('倒序顯示：最新在前',
  sortLogDesc(getLog(entries)).map((e) => e.kind)[0], 'equipment');
check('倒序不改動原陣列',
  (() => {
    const original = getLog(entries);
    sortLogDesc(original);
    return original[0].kind;
  })(), 'creation');
check('時間格式化成在地字串（含年月日與時分）',
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(formatLogTime(T0)), true);
check('非法時間 → 空字串', formatLogTime('不是時間'), '');

// ─────────────────────────────────────────────────────────── H
section('H. 建卡就留下第一筆記錄');

const fresh = createNewCharacter();
check('新角色有 1 筆記錄', getLog(fresh).length, 1);
check('第一筆的種類是建卡', getLog(fresh)[0].kind, 'creation');
check('標題寫出起始等級與資金', getLog(fresh)[0].title, '建立角色（5 級起，起始資金 500z）');
check('GM 自訂規則時標題跟著變',
  getLog(createNewCharacter({}, { startingLevel: 10, startingZenit: 800 }))[0].title,
  '建立角色（10 級起，起始資金 800z）');

// ─────────────────────────────────────────────────────────── I
section('I. 原始碼護欄：寫入端必須走同一條路');

const read = (rel) => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
const hud = read('../src/features/character-sheet/components/CharacterPlayHUD.jsx');
const editor = read('../src/features/character-sheet/components/CharacterEditor.jsx');
const sheet = read('../src/features/character-sheet/CharacterSheet.jsx');
const engine = read('../src/features/character-sheet/utils/characterEngine.js');

check('跑團卡的六項資源變更都帶記錄種類',
  ["kind: 'hp'", "kind: 'mp'", "kind: 'ip'", "kind: 'exp'", "kind: 'zenit'", "kind: 'fp'"].filter((k) => !hud.includes(k)),
  []);
check('跑團卡的升級會留下記錄', hud.includes("kind: 'levelup'"), true);
check('跑團卡的數值出口支援 meta', /const updateField = \(field, val, meta = null\)/.test(hud), true);
check('編輯器的等級／資金／裝備都會留下記錄',
  ["kind: 'levelup'", "kind: 'zenit'", "kind: 'equipment'"].filter((k) => !editor.includes(k)), []);
check('編輯器的職業與技能變更會留下記錄',
  (editor.match(/kind: 'skill'/g) || []).length >= 3, true);
check('編輯器的欄位出口支援 meta', /const updateField = \(field, value, meta = null\)/.test(editor), true);
check('建卡時寫入第一筆（引擎層，不是 UI 層）', engine.includes("kind: 'creation'"), true);
check('名冊與跑團卡共用同一個履歷彈窗',
  [sheet.includes('CharacterLogModal'), sheet.includes('onOpenLog'), sheet.includes('handleOpenLog')],
  [true, true, true]);

// ─────────────────────────────────────────────────────────── J
section('J. SSR 煙霧測試：履歷畫得出來');

const theme = getCharacterTheme('emerald');
const bodyHtml = renderToStaticMarkup(React.createElement(CharacterLogBody, {
  theme,
  character: entries,
  onChange: () => {},
  showToast: () => {}
}));
check('顯示標題', bodyHtml.includes('建立角色'), true);
check('顯示前後值（換裝與 EXP 各一）',
  [bodyHtml.includes('主手 徒手打擊 → 戰斧'), bodyHtml.includes('EXP 0 → 5')], [true, true]);
check('顯示摘要磚', bodyHtml.includes('累計 EXP') && bodyHtml.includes('升級次數'), true);
check('顯示新增記錄的輸入框', bodyHtml.includes('新增記錄'), true);
check('顯示種類篩選', bodyHtml.includes('全部'), true);

const emptyHtml = renderToStaticMarkup(React.createElement(CharacterLogBody, {
  theme,
  character: baseChar(),
  onChange: () => {},
  showToast: () => {}
}));
check('空履歷顯示空狀態', emptyHtml.includes('還沒有任何記錄'), true);

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
