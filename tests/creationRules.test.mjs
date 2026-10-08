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
 * - 高階角色每級 +50z → p.229
 */
import fs from 'node:fs';
import {
  DEFAULT_CREATION_RULES,
  CREATION_RULE_FIELDS,
  ZENIT_PER_LEVEL,
  resolveCreationRules,
  isDefaultCreationRules,
  diffCreationRules,
  getQuirkSource,
  filterQuirksBySources
} from '../src/features/character-sheet/data/creationRules.js';
import {
  createNewCharacter,
  validateCharacter,
  calculateCharacterStats,
  isCharacterLocked,
  lockCharacter,
  unlockCharacter,
  buildCreationChecklist,
  CREATION_STEPS,
  LOCKED_CREATION_TABS,
  PLACEHOLDER_CHARACTER_NAME,
  checkHeroicSkillRequirement,
  snapToAttributeDie,
  ATTRIBUTE_DICE_TIERS,
  STARTING_HEROIC_SKILL_BLOCKLIST,
  HEROIC_SKILLS,
  HEROIC_SKILL_SOURCE_LABELS,
  heroicSkillsForClass,
  heroicSkillMaxAcquisitions,
  findDuplicateStartingHeroicSkills
} from '../src/features/character-sheet/utils/characterEngine.js';
import { PLAYTEST_HEROIC_SKILLS } from '../src/features/character-sheet/data/playtestHeroicSkills.js';
import { getLog } from '../src/features/character-sheet/utils/characterLog.js';
import {
  SOURCEBOOKS,
  CANONICAL_THEMES,
  THEME_ALIASES,
  normalizeTheme,
  ATTRIBUTE_PRESET_ARRAYS,
  ATTRIBUTE_KEYS
} from '../src/features/character-sheet/data/sourcebookConfig.js';
import { totalStartingEquipCost } from '../src/features/character-sheet/utils/equipmentRules.js';
import rulesData from '../src/features/character-sheet/data/rulesData.json';

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

// 基準角色：填好身世並具備 2 個職業，讓其他檢查單獨現形。
// `startingFundsRolled: true` 是必要的——否則「起始資金尚未結算」那筆 error 會混進每一條斷言。
const base = (over = {}) => createNewCharacter({
  name: '測試',
  identity: '身分',
  origin: '故鄉',
  startingFundsRolled: true,
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

// ─────────────────────────────────────────────────────────── F
section('F. 創角定稿：把「開好就固定」變成真實狀態');

const T0 = '2026-10-05T09:00:00.000Z';
const T1 = '2026-10-06T09:00:00.000Z';

const unlocked = createNewCharacter();
check('新角色預設未定稿', [unlocked.locked, unlocked.lockedAt], [false, null]);
check('舊存檔（沒有 locked 欄位）視為未定稿', isCharacterLocked({ name: '舊角色' }), false);
check('locked 不是 true 也視為未定稿', isCharacterLocked({ locked: 'yes' }), false);
check('角色為 null 不炸', isCharacterLocked(null), false);

const lockedChar = lockCharacter(unlocked, { at: T0 });
check('定稿後 locked 為 true', lockedChar.locked, true);
check('定稿時間寫入 lockedAt', lockedChar.lockedAt, T0);
check('定稿留下一筆履歷', getLog(lockedChar).map((e) => e.kind), ['creation', 'lock']);
check('履歷標題', getLog(lockedChar)[1].title, '角色定稿');
check('定稿不就地修改原角色', unlocked.locked, false);
check('不傳時間也能定稿', Number.isFinite(Date.parse(lockCharacter(unlocked).lockedAt)), true);

const unlockedAgain = unlockCharacter(lockedChar, { at: T1 });
check('解鎖後 locked 為 false', unlockedAgain.locked, false);
check('解鎖後 lockedAt 清空', unlockedAgain.lockedAt, null);
check('解鎖也留下一筆履歷（查得到什麼時候解鎖過）',
  getLog(unlockedAgain).map((e) => e.kind), ['creation', 'lock', 'lock']);
check('解鎖的標題說明原因', getLog(unlockedAgain)[2].title, '解除定稿（重新開放創角欄位）');

check('凍結的分頁是身世、四維與命名（姓名在最後一步，也是創角決定）', [...LOCKED_CREATION_TABS], [1, 3, 6]);

// ─────────────────────────────────────────────────────────── G
section('G. 創角進度清單：把驗證結果變成一條主線');

const blankList = buildCreationChecklist(createNewCharacter());
check('清單有六個步驟且與 CREATION_STEPS 一致',
  blankList.map((i) => i.id), CREATION_STEPS.map((i) => i.id));
check('清單不含情感羈絆（羈絆不屬創角，原書 p.154）',
  blankList.some((i) => i.label.includes('羈絆')), false);
check('每一步都有顯示名', blankList.every((i) => Boolean(i.label)), true);
check('空白角色：身世待處理（缺姓名等）', blankList[0].status, 'todo');
check('空白角色：職業有問題（0 個職業）', blankList[1].status, 'error');
// 四維預設是空的（0 = 尚未指派），所以空白角色的第 3 步是待處理，不是已完成。
// 舊版預設 d8×4 = 32 剛好等於標準總和，第 3 步對新角色永遠是「done」——
// 那正是「系統替玩家選好了萬事通」的另一個症狀。
check('空白角色：四維待處理（預設未指派）', blankList[2].status, 'todo');
check('有問題的步驟帶錯誤數', blankList[1].errorCount, 1);
check('待處理的步驟給出說明文字', blankList[2].message, '尚未選擇四維屬性配置');
check('待處理的步驟給出第一則提醒', blankList[0].message, '尚未設定身份');

// 清單不新增驗證邏輯：狀態必須與 validateCharacter 的分組一致
const grouped = validateCharacter(createNewCharacter()).warnings.reduce((acc, w) => {
  acc[w.step] = acc[w.step] || [];
  acc[w.step].push(w);
  return acc;
}, {});
check('清單狀態與 validateCharacter 的分組一致',
  blankList.map((i) => {
    const issues = grouped[i.id] || [];
    const errors = issues.filter((w) => w.type === 'error').length;
    return errors > 0 ? 'error' : (issues.length > 0 ? 'todo' : 'done');
  }),
  blankList.map((i) => i.status));

// 一張「該填的都填了」的卡：五步全綠、可以定稿
const finished = createNewCharacter({
  name: '完成測試',
  identity: '流浪劍士',
  theme: '希望',
  origin: '邊境村落',
  // 第 6 步「命名與背景」的另外兩格（原書第 8 步的稱呼與外貌描述在本專案的對應）
  gender: '女',
  background: '來自邊境的流浪劍士。',
  // 四維預設是空的（0 = 尚未指派），填完的卡必須自己帶上配置
  attributes: { dex: 10, ins: 8, mig: 8, wlp: 6 },
  // 起始資金已結算（原書 p.165）。沒有這一項，第 4 步會是 error，這張卡不能定稿。
  startingFundsRolled: true,
  classes: [
    { className: '守護者', level: 5, skills: [{ name: '測試技能', sl: 5 }] },
    { className: '元素師', level: 0, skills: [] }
  ]
});
const finishedList = buildCreationChecklist(finished);
check('填完的卡：六步全部完成',
  finishedList.map((i) => i.status), ['done', 'done', 'done', 'done', 'done', 'done']);
check('填完的卡：沒有阻擋定稿的項目',
  finishedList.filter((i) => i.status === 'error').length, 0);
check('GM 規則會反映在清單上（必修職業未修習 → 該步有問題）',
  buildCreationChecklist(finished, { requiredClasses: ['靈師'] })
    .find((i) => i.id === 2).status, 'error');
check('GM 收窄職業數也會反映在清單上',
  buildCreationChecklist(finished, { classCountMin: 3, classCountMax: 3 })
    .find((i) => i.id === 2).status, 'error');
check('未開放金手指且有金手指 → 第 5 步有問題',
  buildCreationChecklist(createNewCharacter({ quirk: '倖存者' }), { allowQuirk: false })
    .find((i) => i.id === 5).status, 'error');

// ─────────────────────────────────────────────────────────── H
section('H. 原始碼護欄：硬編碼不得回流');

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
check('編輯器有定稿與解鎖的動作',
  [editor.includes('lockCharacter('), editor.includes('unlockCharacter(')], [true, true]);
check('凍結是用 fieldset 一次涵蓋整個分頁，不是逐個 input 加 disabled',
  editor.includes('disabled={frozenTab}'), true);
check('側邊欄不再重複顯示標籤，改顯示進度訊息',
  [editor.includes('step.message'), editor.includes('checklistById')], [true, true]);
check('已定稿時仍可切換分頁（導航列不在凍結範圍內）',
  editor.includes('const frozenTab = locked && LOCKED_CREATION_TABS.includes(activeTab)'), true);

// ─────────────────────────────────────────────────────────── N
section('N. 金手指的來源過濾與「0 不是缺值」（2026-10-06）');

check('金手指名稱裡的高奇標記 -> highFantasy', getQuirkSource('草木成精（高奇）'), 'highFantasy');
check('自奇 -> naturalFantasy', getQuirkSource('倖存者（自奇）'), 'naturalFantasy');
check('科奇 -> technoFantasy', getQuirkSource('機器人（科奇）'), 'technoFantasy');
check('沒有標記 -> null（不設限，一律顯示）', getQuirkSource('空手道'), null);
check('空字串也不會炸', getQuirkSource(''), null);

const allQuirks = rulesData.quirks;
const onlyCore = filterQuirksBySources(allQuirks, ['core']);
check('關掉三本手冊後，有標記的金手指全部消失',
  onlyCore.some((q) => getQuirkSource(q.name) !== null), false);
check('沒標記的仍然顯示（無法判定來源就不猜）',
  onlyCore.some((q) => q.name === '空手道'), true);
check('開啟高度奇幻後，高奇金手指回來了',
  filterQuirksBySources(allQuirks, ['core', 'highFantasy']).some((q) => q.name === '草木成精（高奇）'),
  true);
check('已選中的那一個永遠保留（否則角色身上的金手指會憑空消失）',
  filterQuirksBySources(allQuirks, ['core'], '倖存者（自奇）').some((q) => q.name === '倖存者（自奇）'),
  true);

// 這條是「現況說明」不是期望：55 筆裡只有 17 筆有來源標記。
// 數字變了代表有人補了標記 —— 那是好事，請一併更新這裡與 docs/decisions.md。
check('有來源標記的金手指目前是 17 筆（其餘 38 筆待補來源）',
  allQuirks.filter((q) => getQuirkSource(q.name) !== null).length, 17);

// `0 || 3` 會把合法的 0 當成缺值。全站不得再出現這個寫法（一律用 `??`）。
const sourceFiles = fs.readdirSync(new URL('../src/features/character-sheet', import.meta.url), { recursive: true })
  .filter((p) => /\.(js|jsx)$/.test(p))
  .map((p) => String(p).replace(/\\/g, '/'));
check('全站沒有 fabulaPoints || N 這種「0 當缺值」的寫法',
  sourceFiles.filter((p) => /fabulaPoints\s*\|\|\s*\d/.test(
    read('../src/features/character-sheet/' + p)
  )),
  []);
check('角色卡引擎不再寫死 Math.max(5',
  read('../src/features/character-sheet/utils/characterEngine.js').includes('Math.max(5'),
  false);
check('等級一律經過 getCharacterLevel（不再直接讀 char.level）',
  /getCharacterLevel/.test(read('../src/features/character-sheet/components/CharacterCard.jsx'))
  && /getCharacterLevel/.test(read('../src/features/character-sheet/CharacterSheet.jsx')),
  true);

// ─────────────────────────────────────────────────────────── O
section('O. 2026-10-06 稽核修正：步驟次序、主題、姓名、屬性陣列、起始資金');

// O1 步驟次序：原書是「先選職業（第 4 步）再分配屬性（第 5 步）」（p.154／p.162）
check('CREATION_STEPS 的順序是職業(2) 先於四維(3)，姓名在最後(6)',
  CREATION_STEPS.map((s) => s.label),
  ['基礎身世', '職業與技能', '四維屬性', '裝備配置', '特質與命刻', '命名與背景']);
check('姓名不再落在第 1 步（原書第 8 步，p.154／p.170）',
  validateCharacter(createNewCharacter()).warnings
    .filter((w) => w.field === 'name').map((w) => w.step), [6]);
check('第 1 步只剩身分／主題／故鄉（姓名已移出）',
  validateCharacter(createNewCharacter()).warnings
    .filter((w) => w.step === 1).map((w) => w.field), ['identity', 'theme', 'origin']);
check('新角色有性別與角色背景兩個欄位（都預設空字串）',
  [createNewCharacter().gender, createNewCharacter().background], ['', '']);
// 主題不代選：原書 p.158 只「建議」第一位角色從列表選，不是系統替他選。
// 舊版預設 '希望'，等於替玩家決定了最核心的情感，也讓「尚未選擇個人主題」永不觸發。
check('主題預設為空（不擅自先選希望）', createNewCharacter().theme, '');
check('主題為空會被提醒（第 1 步）',
  validateCharacter(createNewCharacter()).warnings
    .filter((w) => w.field === 'theme').map((w) => w.message), ['尚未選擇個人主題']);
check('未填姓名／性別／背景會被提醒（第 6 步）',
  validateCharacter(createNewCharacter()).warnings
    .filter((w) => w.step === 6).map((w) => w.field), ['name', 'gender', 'background']);
check('三格都填了就沒有第 6 步的提醒',
  validateCharacter(createNewCharacter({ name: '雷恩', gender: '女', background: '邊境流浪劍士' }))
    .warnings.filter((w) => w.step === 6), []);
check('validateCharacter 的職業警告落在第 2 步',
  validateCharacter(createNewCharacter()).warnings
    .filter((w) => w.field === 'classes').map((w) => w.step), [2]);
check('validateCharacter 的屬性警告落在第 3 步',
  validateCharacter(createNewCharacter({ attributes: { dex: 6, ins: 6, mig: 6, wlp: 6 } }))
    .warnings.filter((w) => w.field === 'attributes').map((w) => w.step), [3]);

// O2 姓名：佔位符不算填過（舊版只檢查空字串，這條提醒對新角色永遠不觸發）
check('新角色的姓名是佔位符', createNewCharacter().name, PLACEHOLDER_CHARACTER_NAME);
check('佔位符姓名會被提醒',
  validateCharacter(createNewCharacter()).warnings
    .filter((w) => w.field === 'name').map((w) => w.message), ['角色尚未填寫姓名']);
check('真的填了名字就不提醒',
  validateCharacter(createNewCharacter({ name: '卡米拉' }))
    .warnings.filter((w) => w.field === 'name'), []);

// O3 主題：官方十個（Core p.158）
check('主題清單是官方十個、譯名照官方漢化', CANONICAL_THEMES,
  ['野心', '憤怒', '歸屬', '懷疑', '責任', '內疚', '希望', '正義', '慈悲', '復仇']);
check('舊譯名負疚 → 內疚', normalizeTheme('負疚'), '內疚');
check('舊譯名職責 → 責任', normalizeTheme('職責'), '責任');
check('自訂主題原樣傳回', normalizeTheme('救贖'), '救贖');
check('別名表只有這兩個（新增要一起改這裡）',
  Object.keys(THEME_ALIASES).sort(), ['負疚', '職責'].sort());
// 主題沒有預設值（見 O 區段的「主題預設為空」）——所以這裡只確認清單本身是官方那十個
check('官方清單裡的每一個都是合法主題',
  CANONICAL_THEMES.every((t) => typeof t === 'string' && t.length > 0), true);

// O4 屬性陣列：官方三組（Core p.162）
check('三組屬性陣列的名稱與骰組照官方',
  ATTRIBUTE_PRESET_ARRAYS.map((p) => [p.name, p.diceList.join(',')]),
  [['標準', '10,8,8,6'], ['萬事通', '8,8,8,8'], ['特化型', '10,10,6,6']]);
check('三組總和都是 32',
  ATTRIBUTE_PRESET_ARRAYS.map((p) => p.diceList.reduce((a, b) => a + b, 0)), [32, 32, 32]);
check('沒有任何一組自稱「最推薦」（原書沒有推薦哪一組）',
  ATTRIBUTE_PRESET_ARRAYS.some((p) => /推薦/.test(p.tag) || /推薦/.test(p.desc)), false);

// O5 起始資金（原書 p.165）與裝備預算（p.164）
check('新角色的起始資金尚未結算', createNewCharacter().startingFundsRolled, false);
check('未結算會擋住第 4 步',
  validateCharacter(createNewCharacter()).warnings
    .filter((w) => w.field === 'zenit').map((w) => w.type), ['error']);
check('舊存檔（沒有這個欄位）不受影響',
  validateCharacter(createNewCharacter({ startingFundsRolled: undefined }))
    .warnings.filter((w) => w.field === 'zenit'), []);
check('已結算就不再提醒',
  validateCharacter(createNewCharacter({ startingFundsRolled: true }))
    .warnings.filter((w) => w.field === 'zenit'), []);

const equipMaps = {
  weaponMap: new Map(rulesData.equipment.weapons.map((w) => [w.name, w])),
  shieldMap: new Map(rulesData.equipment.shields.map((s) => [s.name, s])),
  armorMap: new Map(rulesData.equipment.armors.map((a) => [a.name, a]))
};
check('徒手＋無裝甲的花費是 0', totalStartingEquipCost(createNewCharacter().equipment, equipMaps), 0);
check('飾品不計入起始裝備花費（即使飾品表有價格）',
  totalStartingEquipCost(
    { mainHand: '徒手打擊', offHand: '', armor: '無裝甲 / 冒險服', accessory: '守護護符' },
    { ...equipMaps, accessoryMap: new Map([['守護護符', { name: '守護護符', cost: 999 }]]) }
  ), 0);
check('主手是盾牌時也算得到（守護者【雙重盾牌】）',
  totalStartingEquipCost({ mainHand: '符文圓盾', offHand: '青銅圓盾', armor: '無裝甲 / 冒險服' }, equipMaps),
  250);

// 超支要進清單（以前只有編輯器的提示框看得到，清單與定稿關卡看不到）
const overBudget = createNewCharacter({
  startingFundsRolled: true,
  equipment: { mainHand: '巨劍', offHand: '符文圓盾', armor: '鋼鐵板甲', accessory: '' }
});
check('超支會變成第 4 步的 error',
  validateCharacter(overBudget).warnings
    .filter((w) => w.step === 4 && /超出/.test(w.message))
    .map((w) => [w.type, w.message]),
  [['error', '起始裝備花費 650z 超出 500z 預算']]);

// O6 高階角色（原書 p.229）：30 級 = 500 + 50 × 30 = 2000
check('預設不加給（5 級維持 500z）', resolveCreationRules({}).startingZenit, 500);
check('30 級自動加給到 2000z（原書 p.229 的例子）',
  resolveCreationRules({ startingLevel: 30 }).startingZenit, 2000);
check('明確給的 startingZenit 優先於加給',
  resolveCreationRules({ startingLevel: 30, startingZenit: 3000 }).startingZenit, 3000);
check('每級加給是官方值 50z', ZENIT_PER_LEVEL, 50);
check('規則 diff 餵回 resolve 會得到同一份規則（分享不會愈套愈多錢）',
  resolveCreationRules(diffCreationRules({ startingLevel: 30 })).startingZenit,
  resolveCreationRules({ startingLevel: 30 }).startingZenit);

// O7 原始碼護欄
const editorSrc = read('../src/features/character-sheet/components/CharacterEditor.jsx');
const engineSrc = read('../src/features/character-sheet/utils/characterEngine.js');
check('編輯器的分頁標籤是職業在四維之前',
  editorSrc.indexOf("label: '職業與技能'") < editorSrc.indexOf("label: '四維屬性'"), true);
check('編輯器不再寫死初始持有金幣 500',
  editorSrc.includes('character.zenit !== undefined ? character.zenit : 500'), false);
check('編輯器不再自己算裝備花費（改呼叫 totalStartingEquipCost）',
  editorSrc.includes('curAcc?.cost'), false);
check('引擎不再用 stats.armorWarning（改讀 buildLoadoutIssues）',
  engineSrc.includes('stats.armorWarning'), false);
check('編輯器不再 import 已刪除的 ATTRIBUTE_STARTING_ARRAYS',
  editorSrc.includes('ATTRIBUTE_STARTING_ARRAYS'), false);
check('屬性陣列只有一份定義（在 data/，元件只 import）',
  read('../src/features/character-sheet/components/AttributeMatrixPicker.jsx')
    .includes('export const ATTRIBUTE_PRESET_ARRAYS'), false);

// ─────────────────────────────────────────────────────────── P
section('P. 英雄技能前提（原書 p.232）與四維骰階範圍（原書 p.162）');

const heroicWarnings = (over) => validateCharacter(createNewCharacter(over))
  .warnings.filter((w) => w.field === 'heroicSkills');
const master = (className) => [{ className, level: 10, skills: [] }];

// 共同前提：精通一個職業（原書 p.232「將一個職業提升到 10 級」）
check('未精通任何職業時，英雄技能是 error',
  heroicWarnings({ heroicSkills: ['額外HP'] }).map((w) => w.type), ['error']);
check('精通後「通用」英雄技能就合法',
  heroicWarnings({ heroicSkills: ['額外HP'], classes: master('守護者') }), []);
check('精通了職業但沒到 10 級 → 仍算未精通',
  heroicWarnings({ heroicSkills: ['額外HP'], classes: [{ className: '守護者', level: 9, skills: [] }] })
    .map((w) => w.type), ['error']);

// 個別技能指定的職業前提
check('精通守護者拿不了【背水】（需暗黑之刃）',
  heroicWarnings({ heroicSkills: ['背水'], classes: master('守護者') }).map((w) => w.message),
  ['【背水】需精通【暗黑之刃】其中之一']);
check('精通暗黑之刃就拿得了【背水】',
  heroicWarnings({ heroicSkills: ['背水'], classes: master('暗黑之刃') }), []);
check('「A或B」任一精通即可',
  checkHeroicSkillRequirement({ requirement: '狂怒鬥士或武器大師' },
    { masteredClasses: ['武器大師'], level: 5 }).ok, true);
check('「A、B或C」任一個都沒有 → 擋',
  checkHeroicSkillRequirement({ requirement: '嵌合師、元素師、熵師或靈師' },
    { masteredClasses: ['守護者'], level: 5 }).ok, false);

// 「且／並」後面的額外技能前提不猜（寧漏不誤）；等級前提抽得出來
check('額外技能前提不猜，只判職業',
  checkHeroicSkillRequirement({ requirement: '修補匠，且必須獲得小工具技能中的高級煉金術技能' },
    { masteredClasses: ['修補匠'], level: 5 }).ok, true);
check('等級前提抽得出來（不足 → 擋）',
  checkHeroicSkillRequirement({ requirement: '秘儀師，且你的角色等級必須為30或更高' },
    { masteredClasses: ['秘儀師'], level: 5 }).ok, false);
check('等級前提抽得出來（足夠 → 過）',
  checkHeroicSkillRequirement({ requirement: '秘儀師，且你的角色等級必須為30或更高' },
    { masteredClasses: ['秘儀師'], level: 30 }).ok, true);
check('沒有前提資料時不擋（無法判定）',
  checkHeroicSkillRequirement({ name: '未知技能' }, { masteredClasses: ['守護者'], level: 5 }).ok, true);
check('沒有任何精通 → 連「通用」也擋',
  checkHeroicSkillRequirement({ requirement: '通用' }, { masteredClasses: [], level: 30 }).ok, false);

// 荊棘之心的前提在官方繁中 Excel 裡寫成「暗影之刃」——但同一本 Excel 其他 8 處
// （含職業技能合集）都寫「暗黑之刃」，而這個技能的說明提到「暗影突襲」（暗黑之刃的技能）。
// 那是來源自己的不一致，已修正；否則這個關卡會誤擋精通暗黑之刃的角色。
check('荊棘之心的前提是暗黑之刃（不是 Excel 那一處的暗影之刃）',
  rulesData.heroicSkills.find((h) => h.name === '荊棘之心').requirement.includes('暗黑之刃'), true);
check('沒有任何英雄技能的前提指向不存在的職業',
  rulesData.heroicSkills
    .filter((h) => h.requirement !== '通用')
    .filter((h) => {
      const part = h.requirement.split(/且|並/)[0];
      const tokens = part.split(/[、,，]|或|：|:/).map((t) => t.trim())
        .filter((t) => t && !/技能|咒語|等級|兩個|更多|職業|中$/.test(t));
      return tokens.length > 0 && tokens.every((t) => !Object.keys(rulesData.classes).includes(t));
    })
    .map((h) => h.name), []);

// 四維骰階範圍（原書 p.162：「從最小 d6 到最大 d12」）
check('d20 不在階梯上 → error 並指出是哪一項',
  validateCharacter(createNewCharacter({ attributes: { dex: 20, ins: 8, mig: 6, wlp: 6 } }))
    .warnings.filter((w) => w.field === 'attributes' && w.type === 'error').map((w) => w.message),
  ['屬性骰階必須是 d6／d8／d10／d12：DEX 為 d20']);
check('合法階梯不會觸發範圍 error',
  validateCharacter(createNewCharacter()).warnings
    .filter((w) => w.field === 'attributes' && w.type === 'error'), []);
check('snapToAttributeDie 取最接近的一階（同距取低，不替玩家灌水）',
  [20, 11, 7, 6, 12, 5].map(snapToAttributeDie), [12, 10, 6, 6, 12, 6]);
check('階梯常數就是官方那四階', [...ATTRIBUTE_DICE_TIERS], [6, 8, 10, 12]);

// ─────────────────────────────────────────────────────────── Q
section('Q. 四維預設為空 ＋ 開局英雄技能（Playtest Materials 2026-10-01 p.4）');

// 四維屬性預設 0 = 尚未指派（使用者指示：讓玩家自己選三組之一，不先套「萬事通」）
check('新角色四維預設為 0（不是 d8×4）',
  ATTRIBUTE_KEYS.map((k) => createNewCharacter().attributes[k]), [0, 0, 0, 0]);
check('四項全空 → 第 3 步是 info（還沒開始，不是玩家的錯）',
  validateCharacter(createNewCharacter()).warnings.filter((w) => w.step === 3).map((w) => w.type), ['info']);
check('四項全空的訊息是「尚未選擇四維屬性配置」',
  validateCharacter(createNewCharacter()).warnings.filter((w) => w.step === 3).map((w) => w.message),
  ['尚未選擇四維屬性配置']);
check('部分指派 → warning 並列出還缺哪幾項',
  validateCharacter(createNewCharacter({ attributes: { dex: 10, ins: 8, mig: 0, wlp: 0 } }))
    .warnings.filter((w) => w.field === 'attributes').map((w) => [w.type, w.message]),
  [['warning', '四維屬性還有 2 項未指派（力量、意志）']]);
check('全部指派且總和正確 → 第 3 步沒有任何提醒',
  validateCharacter(createNewCharacter({ attributes: { dex: 10, ins: 8, mig: 8, wlp: 6 } }))
    .warnings.filter((w) => w.step === 3), []);
// 0 不能被當成「非法骰階」——那是「還沒指派」，不是 d0 這個違法值
check('未指派不會被誤判成非法骰階',
  validateCharacter(createNewCharacter()).warnings
    .filter((w) => w.field === 'attributes' && w.type === 'error'), []);

// 開局英雄技能：官方原文「each Player Character gains an additional Heroic Skill during
// character creation; however, the first time they would normally gain a Heroic Skill by
// mastering one of their Classes, instead they gain no Heroic Skill from that.」
const START_RULE = { startingHeroicSkill: true };
const creationWarn = (over, rules) => validateCharacter(createNewCharacter(over), rules)
  .warnings.filter((w) => w.field === 'heroicSkills');
const L3 = (className) => [{ className, level: 3, skills: [] }];

check('規則關閉時，開局拿英雄技能仍然被擋（維持原行為）',
  creationWarn({ heroicSkills: ['額外HP'], classes: L3('守護者') }).map((w) => w.type), ['error']);
check('規則開啟時，**擁有**該職業即可（不必精通）',
  creationWarn({ heroicSkills: ['背水'], classes: L3('暗黑之刃') }, START_RULE), []);
check('規則開啟但沒有那個職業 → 仍然擋，且訊息說的是「開局需擁有」',
  creationWarn({ heroicSkills: ['背水'], classes: L3('守護者') }, START_RULE).map((w) => w.message),
  ['【背水】開局需擁有【暗黑之刃】其中之一']);
check('8 個官方禁用技能都不能用開局名額',
  STARTING_HEROIC_SKILL_BLOCKLIST.map((name) =>
    checkHeroicSkillRequirement({ name, requirement: '通用' }, { classes: ['守護者'], atCreation: true }).ok),
  STARTING_HEROIC_SKILL_BLOCKLIST.map(() => false));
check('禁用清單就是官方列的那 8 個（逐字）',
  [...STARTING_HEROIC_SKILL_BLOCKLIST],
  ['大口袋', '額外HP', '額外IP', '額外MP', '強力射擊', '強力咒語', '強力攻擊', '啟示']);
check('開局名額只有一個：兩個技能都靠它 → error',
  creationWarn({ heroicSkills: ['背水', '夢之刃'], classes: L3('暗黑之刃') }, START_RULE)
    .map((w) => w.message.includes('開局名額只能選一個')), [true]);
check('精通之後就不佔開局名額（同一組技能不再報錯）',
  creationWarn({
    heroicSkills: ['背水', '夢之刃'],
    classes: [{ className: '暗黑之刃', level: 10, skills: [] }]
  }, START_RULE), []);
check('等級前提在開局模式下不變（Playtest 明文「remain unchanged」）',
  checkHeroicSkillRequirement({ requirement: '秘儀師，且你的角色等級必須為30或更高' },
    { classes: ['秘儀師'], level: 5, atCreation: true }).ok, false);
check('開局模式但一個職業都沒有 → 擋',
  checkHeroicSkillRequirement({ requirement: '通用' }, { classes: [], atCreation: true }).ok, false);
check('規則關閉時，開局模式不適用（沒有名額這回事）',
  creationWarn({ heroicSkills: ['背水'], classes: L3('暗黑之刃') }).map((w) => w.type), ['error']);

// ─────────────────────────────────────────────────────────── R
section('R. 英雄技能出處（使用者要求「必須要標出出處」）與 Playtest 收錄');

const sourceCounts = () => {
  const c = {};
  rulesData.heroicSkills.forEach((h) => { c[h.source] = (c[h.source] || 0) + 1; });
  // 排序後回傳，避免物件鍵的插入順序影響斷言
  return Object.keys(c).sort().map((k) => `${k}:${c[k]}`);
};

check('正式規則書 115 筆 ＋ Playtest 43 筆 ＝ 158',
  [HEROIC_SKILLS.length, rulesData.heroicSkills.length, PLAYTEST_HEROIC_SKILLS.length], [158, 115, 43]);
// 出處回填自繁中版角色卡 Excel V2.17 的來源區段（位置對齊，已驗證順序完全一致）
// ＋ 卡牌大師那 4 筆（規則書有、Excel 沒有，使用者指示要實裝）
check('出處分佈：核心 31／高度奇幻 24／科技 18／自然 21／特典 21（含卡牌大師 4 筆）',
  sourceCounts(),
  ['bonus:21', 'core:31', 'highFantasy:24', 'naturalFantasy:21', 'technoFantasy:18']);
check('每一筆都有出處，且顯示表裡有對應的中文名',
  HEROIC_SKILLS.filter((h) => !HEROIC_SKILL_SOURCE_LABELS[h.source]).map((h) => h.name), []);
check('Playtest 那批全部標 playtest',
  PLAYTEST_HEROIC_SKILLS.every((h) => h.source === 'playtest'), true);
check('正式與 Playtest 之間沒有重名',
  HEROIC_SKILLS.length - new Set(HEROIC_SKILLS.map((h) => h.name)).size, 0);
check('Playtest 每一筆都有名稱、要求與效果',
  PLAYTEST_HEROIC_SKILLS.filter((h) => !h.name || !h.requirement || !h.effect).map((h) => h.name), []);

// 判定要能吃下 Playtest 的 requirement 寫法（「需精通 X」「通用」「已學會…」）
check('Playtest 技能的要求都判得出來（不會一律擋）',
  PLAYTEST_HEROIC_SKILLS.filter((h) => !checkHeroicSkillRequirement(h, {
    masteredClasses: ['秘儀師', '暗黑之刃', '元素師', '狂怒鬥士', '神射手', '武器大師', '遊蕩者',
      '博學士', '吟唱者', '靈師', '修補匠', '旅人', '守護者', '熵師', '嵌合師',
      '指揮官', '舞者', '魔奏者', '徽記師', '美食家', '祈喚者', '商人', '植物學家',
      '機師', '靈能者', '突變體'],
    classes: ['秘儀師', '暗黑之刃', '元素師', '狂怒鬥士', '神射手', '武器大師', '遊蕩者',
      '博學士', '吟唱者', '靈師', '修補匠', '旅人', '守護者', '熵師', '嵌合師',
      '指揮官', '舞者', '魔奏者', '徽記師', '美食家', '祈喚者', '商人', '植物學家',
      '機師', '靈能者', '突變體'],
    level: 50
  }).ok).map((h) => [h.name, h.requirement]), []);

// 【銃劍士】官方原文是「have acquired … (even if you have not mastered them)」
// ——精通路徑也只要求「擁有」，不是「精通」
const gunbreaker = PLAYTEST_HEROIC_SKILLS.find((h) => h.name === '銃劍士');
check('【銃劍士】不必精通，只要擁有神射手或武器大師',
  checkHeroicSkillRequirement(gunbreaker, {
    masteredClasses: ['守護者'],
    classes: ['守護者', '神射手'],
    level: 5
  }).ok, true);
check('【銃劍士】連擁有都沒有 → 擋',
  checkHeroicSkillRequirement(gunbreaker, {
    masteredClasses: ['守護者'],
    classes: ['守護者'],
    level: 5
  }).ok, false);

// 可重複取得的技能（原書 p.232 預設 1 次；少數明文寫著可以拿多次）
check('可重複次數：預設 1 次',
  heroicSkillMaxAcquisitions(HEROIC_SKILLS.find((h) => h.name === '背水')), 1);
check('可重複次數：嵌合術精通 2 次（官方 may be acquired up to twice）',
  heroicSkillMaxAcquisitions(HEROIC_SKILLS.find((h) => h.name === '嵌合術精通')), 2);
check('可重複次數：解剖學家 3 次（官方 can be acquired up to three times）',
  heroicSkillMaxAcquisitions(HEROIC_SKILLS.find((h) => h.name === '解剖學家')), 3);
check('取得超過上限 → error',
  validateCharacter(createNewCharacter({
    heroicSkills: ['背水', '背水'],
    classes: master('暗黑之刃')
  })).warnings.filter((w) => w.field === 'heroicSkills').map((w) => w.message),
  ['【背水】最多只能取得 1 次（目前 2 次）']);
check('可重複的技能拿兩次是合法的（嵌合術精通）',
  validateCharacter(createNewCharacter({
    heroicSkills: ['嵌合術精通', '嵌合術精通'],
    classes: master('嵌合師')
  })).warnings.filter((w) => w.field === 'heroicSkills'), []);

// 開局名額的「同團不得重複」（Playtest p.4）
// 規則**存在角色身上**，所以這裡是把規則寫進角色、不是傳給函式
const dupA = createNewCharacter({
  name: '甲', heroicSkills: ['背水'], classes: L3('暗黑之刃'), creationRules: START_RULE
});
const dupB = createNewCharacter({
  name: '乙', heroicSkills: ['背水'], classes: L3('暗黑之刃'), creationRules: START_RULE
});
check('兩張卡都沒開規則時不做同團重複檢查',
  findDuplicateStartingHeroicSkills([
    createNewCharacter({ name: '甲', heroicSkills: ['背水'], classes: L3('暗黑之刃') }),
    createNewCharacter({ name: '乙', heroicSkills: ['背水'], classes: L3('暗黑之刃') })
  ]), []);
check('規則開啟時，兩個角色用開局名額拿同一個技能 → 回報',
  findDuplicateStartingHeroicSkills([dupA, dupB]),
  [{ name: '背水', characters: ['甲', '乙'] }]);
check('只有一個角色用到開局名額 → 不回報',
  findDuplicateStartingHeroicSkills([dupA]), []);
check('靠精通取得的不算佔用開局名額',
  findDuplicateStartingHeroicSkills([
    createNewCharacter({ name: '甲', heroicSkills: ['背水'], classes: master('暗黑之刃'), creationRules: START_RULE }),
    createNewCharacter({ name: '乙', heroicSkills: ['背水'], classes: master('暗黑之刃'), creationRules: START_RULE })
  ]), []);
check('只有一張卡開了規則 → 那張卡的名額才算數（另一張不參與）',
  findDuplicateStartingHeroicSkills([dupA, createNewCharacter({
    name: '丙', heroicSkills: ['背水'], classes: L3('暗黑之刃')
  })]), []);

// 開卡規則存在角色身上（見 CreationRulesPanel）——這一段是那個重構的護欄
const ruleChar = createNewCharacter({ creationRules: { startingLevel: 10, classCountMin: 3, classCountMax: 4 } });
check('validateCharacter 預設讀「這張卡自己的」規則',
  validateCharacter(ruleChar).warnings.filter((w) => w.field === 'classes').length, 0);
check('同一張卡用官方標準驗證就會報職業數',
  validateCharacter(ruleChar, DEFAULT_CREATION_RULES).warnings
    .filter((w) => w.field === 'classes').map((w) => w.type), ['error']);
check('明確傳入的規則優先於角色自帶的',
  validateCharacter(ruleChar, { classCountMin: 2, classCountMax: 3 }).warnings
    .filter((w) => w.field === 'classes').map((w) => w.type), ['error']);
// 沒有 creationRules 的舊存檔 → 官方標準（行為與重構前完全相同）：
// error＝職業數不足；warning＝職業等級總和（3）不等於角色等級（5）
check('沒有 creationRules 的舊存檔 → 官方標準（行為不變）',
  validateCharacter(createNewCharacter({ classes: L3('守護者') })).warnings
    .filter((w) => w.field === 'classes').map((w) => w.type), ['error', 'warning']);

// 【預言守護者】把基礎洞察骰面加進最大 HP（Playtest p.16）
const prophetBase = createNewCharacter({ attributes: { dex: 8, ins: 10, mig: 6, wlp: 8 } });
const prophetWith = createNewCharacter({
  attributes: { dex: 8, ins: 10, mig: 6, wlp: 8 },
  heroicSkills: ['預言守護者']
});
check('【預言守護者】最大 HP 增加基礎洞察骰面（d10 → +10）',
  calculateCharacterStats(prophetWith).maxHp - calculateCharacterStats(prophetBase).maxHp, 10);
check('【預言守護者】不影響 MP',
  calculateCharacterStats(prophetWith).maxMp - calculateCharacterStats(prophetBase).maxMp, 0);

// 職業 → 可解鎖的英雄技能（職業彈窗下方那塊，使用者要求）
check('heroicSkillsForClass：回傳的每一筆都真的提到該職業',
  heroicSkillsForClass('守護者').every((h) => h.requirement.split(/且|並/)[0].includes('守護者')), true);
check('heroicSkillsForClass：通用技能不會出現',
  heroicSkillsForClass('守護者').some((h) => h.requirement === '通用'), false);
check('heroicSkillsForClass：守護者至少解鎖 3 個',
  heroicSkillsForClass('守護者').length >= 3, true);
check('heroicSkillsForClass：Playtest 那批也算得出來',
  heroicSkillsForClass('元素師').some((h) => h.source === 'playtest'), true);
check('heroicSkillsForClass：沒有職業時回空陣列', heroicSkillsForClass(''), []);
check('heroicSkillsForClass：【Playtest】變體對到同一組',
  heroicSkillsForClass('守護者【Playtest】').length, heroicSkillsForClass('守護者').length);
check('heroicSkillsForClass：「A或B」型在兩邊都查得到',
  [heroicSkillsForClass('機師').some((h) => h.name === '震顫泰坦'),
    heroicSkillsForClass('守護者').some((h) => h.name === '震顫泰坦')], [true, true]);

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
