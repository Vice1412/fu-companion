/**
 * 規則概念速查（Rule Codex）測試。
 *
 * 執行：npm run test:codex
 *
 * 守三件事：
 * 1. **覆蓋率**——有「額外子系統章節」的職業，其引用技能都必須接得上速查條目
 * 2. **關鍵字唯一性**——同一關鍵字不得指向兩個條目（`findCodexRule` 只回第一個）
 * 3. **授權合規**——不得收錄畫風／敘述文字與具名範例作品
 *
 * 覆蓋率清單的來源：各書**目錄的頁碼間距**（基準 2 頁，多出來的就是額外章節），
 * 再逐頁翻開確認。詳見 `docs/agents-changelog.md`。
 */
import { RULE_CODEX, findCodexRule } from '../src/features/character-sheet/data/ruleCodexData.js';
import rulesData from '../src/features/character-sheet/data/rulesData.json';
import {
  DANCER_DANCES, CHANTER_DATA, ESPER_GIFTS,
  MUTANT_THERIOFORMS, FLORIST_MAGISEEDS, SYMBOLIST_SYMBOLS
} from '../src/features/character-sheet/data/skillSuboptionsData.js';
import {
  PILOT_FRAMES, PILOT_ARMOR_MODULES, PILOT_WEAPON_MODULES, PILOT_SUPPORT_MODULES
} from '../src/features/character-sheet/data/pilotVehicleData.js';

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
const checkTrue = (label, cond) => check(label, !!cond, true);
const section = (t) => lines.push(`\n=== ${t} ===`);

const CLASSES = rulesData.classes || {};

// ─────────────────────────────────────────────────────────── A
section('A. 條目完整性');
const ids = Object.keys(RULE_CODEX);
check('共 16 條（核心 6 + 擴充 10）', ids.length, 16);

const CORE_IDS = ['arcana', 'rituals', 'gadgets', 'projects', 'companion', 'spellbooks'];
const EXPANSION_IDS = [
  'chanter', 'dancer', 'symbolist',
  'floralist', 'gourmet', 'invoker',
  'esper', 'mutant', 'pilot',
  'aceOfCards'
];
check('核心 6 條齊全', CORE_IDS.every((x) => ids.includes(x)), true);
check('擴充 10 條齊全', EXPANSION_IDS.every((x) => ids.includes(x)), true);

for (const id of ids) {
  const e = RULE_CODEX[id];
  checkTrue(`${id}：有 title`, e.title);
  checkTrue(`${id}：有 page`, e.page);
  checkTrue(`${id}：有 summary`, e.summary);
  checkTrue(`${id}：有 keywords`, Array.isArray(e.keywords) && e.keywords.length > 0);
  checkTrue(`${id}：id 與鍵一致`, e.id === id);
}

// ─────────────────────────────────────────────────────────── B
section('B. 關鍵字唯一性（findCodexRule 只回第一個符合者）');
const kwOwner = {};
for (const id of ids) {
  for (const k of RULE_CODEX[id].keywords) {
    (kwOwner[k] = kwOwner[k] || []).push(id);
  }
}
const conflicts = Object.entries(kwOwner).filter(([, v]) => v.length > 1);
check('沒有關鍵字同時指向兩個條目', conflicts.map(([k]) => k), []);
check('每個關鍵字都能查到條目',
  Object.keys(kwOwner).every((k) => findCodexRule(k) !== null), true);
check('查不到的詞回傳 null', findCodexRule('這個詞不存在'), null);
check('空字串回傳 null', findCodexRule(''), null);

// ─────────────────────────────────────────────────────────── C
section('C. 覆蓋率：有額外子系統章節的職業，其引用技能必須接得上');
// 職業 → 對應速查條目（來源：各書目錄頁碼間距 + 逐頁確認）
const CLASS_CODEX = {
  魔奏者: 'chanter',
  舞者: 'dancer',
  徽記師: 'symbolist',
  植物學家: 'floralist',
  美食家: 'gourmet',
  祈喚者: 'invoker',
  靈能者: 'esper',
  突變體: 'mutant',
  機師: 'pilot',
  卡牌大師: 'aceOfCards'
};
check('對應表 10 個職業', Object.keys(CLASS_CODEX).length, 10);

for (const [cls, codexId] of Object.entries(CLASS_CODEX)) {
  const c = CLASSES[cls];
  if (!c) {
    checkTrue(`${cls}：存在於 rulesData`, false);
    continue;
  }
  const kws = RULE_CODEX[codexId].keywords;
  const skills = c.skills || [];
  const linked = skills.filter((s) => kws.some((k) => (s.desc || '').includes(k)));
  checkTrue(`${cls}：至少一個技能接得上（${linked.length}/${skills.length}）`, linked.length > 0);
}

section('C2. 每個子系統都至少被一個技能引用');
for (const codexId of EXPANSION_IDS) {
  const kws = RULE_CODEX[codexId].keywords;
  let hits = 0;
  for (const c of Object.values(CLASSES)) {
    for (const s of c.skills || []) {
      if (kws.some((k) => (s.desc || '').includes(k))) hits += 1;
    }
  }
  checkTrue(`${RULE_CODEX[codexId].title}：被 ${hits} 個技能引用`, hits > 0);
}

// ─────────────────────────────────────────────────────────── D
section('D. 無額外子系統章節的職業，不應有專屬速查條目');
// 基準 2 頁者無額外章節；4 頁者多出來的是「法術列表」而非新機制。
const NO_EXTRA = [
  '嵌合師', '暗黑之刃', '元素師', '熵師', '狂怒鬥士', '守護者', '博學士',
  '吟唱者', '遊蕩者', '神射手', '靈魂術士', '武器大師',
  '指揮官', '商人', '死靈術士'
];
const classTitles = new Set(Object.values(RULE_CODEX).map((e) => e.title));
for (const cls of NO_EXTRA) {
  checkTrue(`${cls}：沒有專屬速查條目`, !classTitles.has(cls));
}

// ─────────────────────────────────────────────────────────── E
section('E. 擴充條目的資料結構');
for (const id of EXPANSION_IDS) {
  const e = RULE_CODEX[id];
  checkTrue(`${id}：使用 sections 陣列`, Array.isArray(e.sections) && e.sections.length > 0);
  const kinds = new Set(e.sections.map((s) => s.kind));
  checkTrue(`${id}：section kind 皆為 rules/table/cards`,
    [...kinds].every((k) => ['rules', 'table', 'cards'].includes(k)));
  for (const sec of e.sections) {
    checkTrue(`${id}／${sec.title}：有 title`, !!sec.title);
    if (sec.kind === 'rules') {
      checkTrue(`${id}／${sec.title}：items 非空`,
        Array.isArray(sec.items) && sec.items.length > 0);
    }
    if (sec.kind === 'table') {
      checkTrue(`${id}／${sec.title}：columns 非空`,
        Array.isArray(sec.columns) && sec.columns.length > 0);
      checkTrue(`${id}／${sec.title}：每列欄數與表頭一致`,
        sec.rows.every((r) => r.length === sec.columns.length));
    }
    if (sec.kind === 'cards') {
      checkTrue(`${id}／${sec.title}：items 非空`,
        Array.isArray(sec.items) && sec.items.length > 0);
      checkTrue(`${id}／${sec.title}：每張卡都有 name 與 body`,
        sec.items.every((i) => i.name && i.body));
    }
  }
}

section('E2. 關鍵數據抽查（逐條對照原書）');
const findSection = (id, titlePart, kind) =>
  RULE_CODEX[id].sections.find(
    (s) => s.title.includes(titlePart) && (!kind || s.kind === kind)
  );

check('魔奏者：音量 3 級', findSection('chanter', '音量', 'table').rows.length, 3);
check('魔奏者：音調 8 種', findSection('chanter', '音調', 'table').rows.length, 8);
check('魔奏者：曲風 7 種', findSection('chanter', '曲風').items.length, 7);
check('舞者：舞步 17 個', findSection('dancer', '舞步', 'table').rows.length, 17);
check('徽記師：徽記 19 個', findSection('symbolist', '徽記一覽', 'table').rows.length, 19);
check('徽記師：特殊規則 10 條', RULE_CODEX.symbolist.sections[0].items.length, 10);
check('植物學家：魔法種子條目 43 列（20 顆 × 各 1~3 個 T 階段）',
  findSection('floralist', '魔法種子一覽', 'table').rows.length, 43);
check('植物學家：20 顆魔法種子',
  new Set(findSection('floralist', '魔法種子一覽', 'table').rows.map((r) => r[0])).size, 20);
check('植物學家：生長命刻 4 格',
  RULE_CODEX.floralist.sections[1].items.some((s) => s.includes('4 格')), true);
check('美食家：口味表 6 面', findSection('gourmet', '食材口味', 'table').rows.length, 6);
check('美食家：效果表 12 條', findSection('gourmet', '美食效果', 'table').rows.length, 12);
check('祈喚者：祈喚 20 個', findSection('invoker', '元素源泉與祈喚', 'table').rows.length, 20);
check('靈能者：天賦 9 個', findSection('esper', '天賦一覽', 'table').rows.length, 9);
check('突變體：混合形態 12 個', findSection('mutant', '混合形態一覽', 'table').rows.length, 12);
check('機師：框架 3 種', findSection('pilot', '框架', 'table').rows.length, 3);
check('機師：防具模組 4 種', findSection('pilot', '防具模組', 'table').rows.length, 4);
check('機師：武裝模組 17 種', findSection('pilot', '武裝模組', 'table').rows.length, 17);
check('機師：支援模組 14 種', findSection('pilot', '支援模組', 'table').rows.length, 14);
check('卡牌大師：效果 8 種', findSection('aceOfCards', '組合效果', 'table').rows.length, 8);

// ─────────────────────────────────────────────────────────── F
section('F. 授權合規：不得收錄畫風／敘述與具名範例作品');
// §1 明定官方原書的美術、文字、素材、商業外觀均為保留材料。
// 依 §3，只有「規則、文字與機制」可被引用；本專案採更保守的作法：只收機制。
check('projects 不含具名範例作品', RULE_CODEX.projects?.samples, undefined);
check('rituals 不含敘事範例', RULE_CODEX.rituals?.examples, undefined);
check('gadgets 的煉金術不含畫風描述', RULE_CODEX.gadgets?.alchemy?.desc, undefined);
check('gadgets 的魔科技不含畫風描述', RULE_CODEX.gadgets?.magitech?.desc, undefined);
check('rituals 的學派不含畫風描述',
  (RULE_CODEX.rituals?.disciplines || []).every((d) => d.desc === undefined), true);
check('機師不含具名範例載具',
  RULE_CODEX.pilot.sections.every((s) =>
    !(s.kind === 'table' && s.rows.some((r) => r[0] === '星際戰機' || r[0] === '懸浮滑板'))), true);

// ─────────────────────────────────────────────────────────── G
section('G. 譯名一致性：速查子項目名稱必須與定譯表逐字相同');
// 定譯表來源：繁中版角色卡 Excel V2.17（`skillSuboptionsData.js`／`pilotVehicleData.js`
// 檔頭已各自註明）。核心 6 條的定譯來源是官方核心規則漢化 PDF。
//
// 這道關卡是為 2026-10-05 的失誤而加：速查當時是從英文原書**自行翻譯**的，
// 約 140 處名稱與定譯表不同（舞步 17/17、徽記 9/19、魔法種子 13/20、混合形態 12/12、
// 心靈天賦 7/9、機師支援模組 14/14…），而既有的 A~F 區段**一項都驗不到**——
// 它們只驗結構、數量、關鍵字唯一性與授權合規，驗不到「名稱對不對」。
const normName = (s) => String(s).replace(/（[^）]*）/g, '').replace(/✦/g, '').trim();
const col0 = (rows) => rows.map((r) => normName(r[0]));
const matchNames = (label, expected, actual) => {
  const missing = expected.filter((n) => !actual.includes(normName(n)));
  check(`${label}：${expected.length} 個名稱全部命中定譯`, missing, []);
};

matchNames('舞者',
  DANCER_DANCES.map((d) => d.name),
  col0(findSection('dancer', '舞步', 'table').rows));
matchNames('魔奏者音調',
  CHANTER_DATA.keys.map((k) => k.name),
  col0(findSection('chanter', '音調', 'table').rows));
matchNames('魔奏者曲風',
  CHANTER_DATA.tones.map((t) => t.name),
  findSection('chanter', '曲風').items.map((i) => i.name));
matchNames('徽記師',
  SYMBOLIST_SYMBOLS.map((s) => s.name),
  col0(findSection('symbolist', '徽記一覽', 'table').rows));
matchNames('植物學家',
  FLORIST_MAGISEEDS.map((s) => s.name),
  col0(findSection('floralist', '魔法種子一覽', 'table').rows));
matchNames('靈能者',
  ESPER_GIFTS.map((g) => g.name),
  col0(findSection('esper', '天賦一覽', 'table').rows));
matchNames('突變體',
  MUTANT_THERIOFORMS.map((f) => f.name),
  col0(findSection('mutant', '混合形態一覽', 'table').rows));
matchNames('機師框架',
  PILOT_FRAMES.map((f) => f.name),
  col0(findSection('pilot', '框架', 'table').rows));
matchNames('機師防具模組',
  PILOT_ARMOR_MODULES.map((m) => m.name),
  col0(findSection('pilot', '防具模組', 'table').rows));
matchNames('機師武裝模組',
  PILOT_WEAPON_MODULES.map((m) => m.name),
  col0(findSection('pilot', '武裝模組', 'table').rows));
matchNames('機師支援模組',
  PILOT_SUPPORT_MODULES.map((m) => m.name),
  col0(findSection('pilot', '支援模組', 'table').rows));

// 徽記同時維持上限＝SL + 1（已對照原書；`skillSuboptionsData` 的 quotaHint 同值）
checkTrue('徽記師：同時維持上限為 SL+1',
  RULE_CODEX.symbolist.sections[0].items.some((s) => s.includes('加 1')));

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
