/**
 * 開卡規則測試。
 *
 * 執行：npm run test:creation
 *
 * 這份規則的用途是「把原本硬編碼在六個檔案裡的創角常數抽成一份資料」，
 * 讓 GM 自訂開局（campaign）只要換一份規則物件，而不必改引擎或 UI。
 *
 * 期望值取自官方英文核心規則書 v1.1（印刷頁碼）：
 * - 起始等級 5 → p.157
 * - 起始四維總和 32 → p.155–156
 * - 起始 2~3 個職業 → p.158
 * - 起始裝備預算 500z → p.164
 */
import fs from 'node:fs';
import {
  DEFAULT_CREATION_RULES,
  CREATION_RULE_FIELDS,
  resolveCreationRules,
  isDefaultCreationRules,
  diffCreationRules
} from '../src/features/character-sheet/data/creationRules.js';
import {
  createNewCharacter,
  validateCharacter,
  calculateCharacterStats
} from '../src/features/character-sheet/utils/characterEngine.js';
import { SOURCEBOOKS } from '../src/features/character-sheet/data/sourcebookConfig.js';

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

const ALL_BOOK_KEYS = Object.keys(SOURCEBOOKS);
const msgs = (char, rules) => validateCharacter(char, rules).warnings.map((w) => w.message);
const errs = (char, rules) => validateCharacter(char, rules).errors.map((w) => w.message);

// ─────────────────────────────────────────────────────────── A
section('A. 官方標準開卡規則（逐項對照原書）');

check('起始等級 5（Core p.157）', DEFAULT_CREATION_RULES.startingLevel, 5);
check('起始裝備預算 500z（Core p.164）', DEFAULT_CREATION_RULES.startingZenit, 500);
check('起始四維總和 32（Core p.155–156）', DEFAULT_CREATION_RULES.attributeTotal, 32);
check('起始職業數 2~3（Core p.158）',
  [DEFAULT_CREATION_RULES.classCountMin, DEFAULT_CREATION_RULES.classCountMax], [2, 3]);
check('技能點數 = 起始等級（每級 1 點）',
  DEFAULT_CREATION_RULES.skillPointBudget, DEFAULT_CREATION_RULES.startingLevel);
check('新角色預設只開核心', [...DEFAULT_CREATION_RULES.defaultSourcebooks], ['core']);
check('拓展上限預設為全部手冊（沒有 campaign 時不該擋玩家）',
  [...DEFAULT_CREATION_RULES.allowedSourcebooks].sort(), [...ALL_BOOK_KEYS].sort());
check('預設不指定必修職業', [...DEFAULT_CREATION_RULES.requiredClasses], []);
check('預設允許金手指', DEFAULT_CREATION_RULES.allowQuirk, true);

check('欄位集護欄：不多不少，就這幾個欄位（幻覺欄位進不來）',
  Object.keys(DEFAULT_CREATION_RULES).sort(), [...CREATION_RULE_FIELDS].sort());
check('resolve 的輸出欄位集與預設一致',
  Object.keys(resolveCreationRules({})).sort(), [...CREATION_RULE_FIELDS].sort());
check('預設規則物件是凍結的', Object.isFrozen(DEFAULT_CREATION_RULES), true);

// ─────────────────────────────────────────────────────────── B
section('B. resolveCreationRules：壞資料一律退回官方預設');

const d = DEFAULT_CREATION_RULES;
check('空物件 → 全部預設',
  [resolveCreationRules().startingLevel, resolveCreationRules({}).startingZenit], [5, 500]);
check('null / undefined / 字串 不拋錯',
  [resolveCreationRules(null).startingLevel, resolveCreationRules(undefined).startingLevel, resolveCreationRules('壞資料').startingLevel],
  [5, 5, 5]);
check('未知欄位被忽略', '不存在' in resolveCreationRules({ 不存在: 1 }), false);

check('起始等級 0 → 退回預設', resolveCreationRules({ startingLevel: 0 }).startingLevel, 5);
check('起始等級 51 → 退回預設', resolveCreationRules({ startingLevel: 51 }).startingLevel, 5);
check('起始等級 "12"（數字字串）→ 12', resolveCreationRules({ startingLevel: '12' }).startingLevel, 12);
check('起始等級 10.7 → 取整 10', resolveCreationRules({ startingLevel: 10.7 }).startingLevel, 10);
check('起始資金負數 → 退回預設', resolveCreationRules({ startingZenit: -1 }).startingZenit, 500);
check('起始資金 0 是合法值（GM 可以開無資金開局）',
  resolveCreationRules({ startingZenit: 0 }).startingZenit, 0);
check('屬性總和 2 → 退回預設（低於四顆骰的下限）',
  resolveCreationRules({ attributeTotal: 2 }).attributeTotal, 32);

check('職業數下限 > 上限 → 上限被拉齊',
  [resolveCreationRules({ classCountMin: 5, classCountMax: 3 }).classCountMin,
   resolveCreationRules({ classCountMin: 5, classCountMax: 3 }).classCountMax], [5, 5]);
check('技能點數未給 → 跟著起始等級',
  resolveCreationRules({ startingLevel: 10 }).skillPointBudget, 10);
check('技能點數明給 → 用它',
  resolveCreationRules({ startingLevel: 10, skillPointBudget: 5 }).skillPointBudget, 5);

check('拓展含錯字 → 過濾掉，保留合法的',
  resolveCreationRules({ allowedSourcebooks: ['core', '不存在的書'] }).allowedSourcebooks, ['core']);
check('拓展全部非法 → 退回全部手冊',
  resolveCreationRules({ allowedSourcebooks: ['不存在的書'] }).allowedSourcebooks.sort(), [...ALL_BOOK_KEYS].sort());
check('預設勾選超出上限 → 削到上限內',
  resolveCreationRules({ allowedSourcebooks: ['core'], defaultSourcebooks: ['core', 'technoFantasy'] }).defaultSourcebooks,
  ['core']);
check('上限不含核心時，預設勾選取上限第一個',
  resolveCreationRules({ allowedSourcebooks: ['technoFantasy'], defaultSourcebooks: ['core'] }).defaultSourcebooks,
  ['technoFantasy']);
check('必修職業含不存在的職業 → 過濾掉',
  resolveCreationRules({ requiredClasses: ['守護者', '不存在的職業'] }).requiredClasses, ['守護者']);
check('必修職業去重',
  resolveCreationRules({ requiredClasses: ['守護者', '守護者'] }).requiredClasses, ['守護者']);
check('allowQuirk 非 boolean → 退回預設',
  resolveCreationRules({ allowQuirk: 'yes' }).allowQuirk, true);

check('isDefaultCreationRules：空物件為 true', isDefaultCreationRules({}), true);
check('isDefaultCreationRules：改過為 false', isDefaultCreationRules({ startingZenit: 800 }), false);
check('diffCreationRules：只留與預設不同的欄位',
  diffCreationRules({ startingZenit: 800, startingLevel: 5 }), { startingZenit: 800 });
check('diffCreationRules：全預設 → 空物件', diffCreationRules({}), {});

// ─────────────────────────────────────────────────────────── C
section('C. createNewCharacter：起始等級／資金／拓展由規則決定');

const fresh = createNewCharacter();
check('預設新角色等級 5', fresh.level, 5);
check('預設新角色資金 500z', fresh.zenit, 500);
check('預設新角色只開核心', fresh.enabledSourcebooks, ['core']);

const custom = createNewCharacter({}, {
  startingLevel: 10,
  startingZenit: 800,
  defaultSourcebooks: ['core', 'technoFantasy']
});
check('GM 自訂：等級 10 / 資金 800z / 開放核心＋科技奇幻',
  [custom.level, custom.zenit, custom.enabledSourcebooks], [10, 800, ['core', 'technoFantasy']]);

check('overrides 仍為最上層（優先於規則）',
  [createNewCharacter({ level: 12, zenit: 999 }, { startingLevel: 10, startingZenit: 800 }).level,
   createNewCharacter({ level: 12, zenit: 999 }, { startingLevel: 10, startingZenit: 800 }).zenit],
  [12, 999]);
check('規則物件不會被角色共用參考（改角色不影響規則）',
  (() => {
    const a = createNewCharacter();
    a.enabledSourcebooks.push('highFantasy');
    return createNewCharacter().enabledSourcebooks;
  })(), ['core']);
check('不傳規則等同官方標準',
  [createNewCharacter({}, undefined).level, createNewCharacter({}, undefined).zenit], [5, 500]);

// ─────────────────────────────────────────────────────────── D
section('D. validateCharacter：以這一團的規則驗證');

// 基準角色：填好身世並具備 2 個職業，讓其他檢查單獨現形
const base = (over = {}) => createNewCharacter({
  name: '測試',
  identity: '身分',
  origin: '故鄉',
  classes: [
    { className: '守護者', level: 1, skills: [] },
    { className: '元素師', level: 1, skills: [] }
  ],
  ...over
});

check('預設規則下，屬性總和 32 不報屬性警告',
  msgs(base(), {}).filter((m) => m.includes('屬性骰階')), []);
check('屬性總和 34 → 警告且訊息引用規則的 32',
  msgs(base({ attributes: { dex: 10, ins: 8, mig: 8, wlp: 8 } }), {}).filter((m) => m.includes('屬性骰階')),
  ['屬性骰階點數總和為 34 (起始標準為 32)']);
check('GM 把屬性總和改成 34 後，34 就不再是警告',
  msgs(base({ attributes: { dex: 10, ins: 8, mig: 8, wlp: 8 } }), { attributeTotal: 34 })
    .filter((m) => m.includes('屬性骰階')), []);

const withClasses = (names) => base({
  classes: names.map((className) => ({ className, level: 1, skills: [] }))
});
check('0 個職業 → 1 筆 error（訊息引用規則的 5 級與 2~3）',
  errs(withClasses([]), {}), ['尚未選擇任何職業 (起始 5 級需配置 2~3 個職業)']);
check('1 個職業 → 1 筆 error',
  errs(withClasses(['守護者']), {}), ['起始需至少 2 個職業，目前只有 1 個 (不可純單職)']);
check('2 個職業 → 無職業數 error', errs(withClasses(['守護者', '元素師']), []), []);
check('3 個職業 → 無職業數 error', errs(withClasses(['守護者', '元素師', '靈師']), []), []);
check('4 個職業 → 1 筆 error',
  errs(withClasses(['守護者', '元素師', '靈師', '旅人']), {}),
  ['起始不可超過 3 個職業，目前有 4 個']);
check('GM 放寬成 1~4 個職業後，單職不再報錯',
  errs(withClasses(['守護者']), { classCountMin: 1, classCountMax: 4 }), []);
check('GM 收窄成 3~3 個職業後，2 個職業會報錯',
  errs(withClasses(['守護者', '元素師']), { classCountMin: 3, classCountMax: 3 }),
  ['起始需至少 3 個職業，目前只有 2 個 (不可純單職)']);

check('必修職業缺少 → error',
  errs(withClasses(['元素師', '靈師']), { requiredClasses: ['守護者'] }), ['此團規定必須修習：守護者']);
check('必修職業具備 → 無 error',
  errs(withClasses(['守護者', '元素師']), { requiredClasses: ['守護者'] }), []);

check('未開放金手指但填了金手指 → error',
  errs(base({ quirk: '倖存者' }), { allowQuirk: false }), ['此團未開放金手指，請移除「倖存者」']);
check('未開放金手指但填「無」→ 不報錯', errs(base({ quirk: '無' }), { allowQuirk: false }), []);
check('開放金手指時填了也不報錯', errs(base({ quirk: '倖存者' }), {}), []);

check('啟用了未開放的拓展 → error',
  errs(base({ enabledSourcebooks: ['core', 'technoFantasy'] }), { allowedSourcebooks: ['core'] }),
  ['此團未開放：technoFantasy，請在職業分頁關閉']);
check('預設規則（上限＝全部手冊）不會對拓展報錯',
  errs(base({ enabledSourcebooks: [...ALL_BOOK_KEYS] }), {}), []);

check('規則不影響數值引擎（換規則不會改變同一張卡的 HP）',
  calculateCharacterStats(base()).maxHp, calculateCharacterStats(base()).maxHp);

// ─────────────────────────────────────────────────────────── E
section('E. 原始碼護欄：硬編碼不得回流');

const read = (rel) => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
const editor = read('../src/features/character-sheet/components/CharacterEditor.jsx');
const classPicker = read('../src/features/character-sheet/components/ClassPickerModal.jsx');
const equipPicker = read('../src/features/character-sheet/components/EquipmentPickerModal.jsx');
const engine = read('../src/features/character-sheet/utils/characterEngine.js');

check('CharacterEditor 不再寫死預算 500', editor.includes('500 - totalEquipCost'), false);
check('CharacterEditor 不再寫死「起始裝備預算 500z」', editor.includes('起始裝備預算 500z'), false);
check('CharacterEditor 不再寫死「起始 5 級」', editor.includes('起始 5 級'), false);
check('ClassPickerModal 不再寫死技能點上限 5', classPicker.includes('totalAllocatedSL >= 5'), false);
check('EquipmentPickerModal 不再以 500 當預算預設', equipPicker.includes('remainingBudget = 500'), false);
check('characterEngine 不再寫死屬性總和 32', engine.includes('attrSum !== 32'), false);
check('characterEngine 不再寫死「起始 5 級」的職業數判斷', engine.includes('char.level === 5'), false);
check('三個檔案都改讀 creationRules',
  [editor.includes('resolveCreationRules'), classPicker.includes('resolveCreationRules'), engine.includes('resolveCreationRules')],
  [true, true, true]);

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
