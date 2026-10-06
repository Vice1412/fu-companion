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
  LOCKED_CREATION_TABS
} from '../src/features/character-sheet/utils/characterEngine.js';
import { getLog } from '../src/features/character-sheet/utils/characterLog.js';
import { SOURCEBOOKS } from '../src/features/character-sheet/data/sourcebookConfig.js';
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

check('凍結的分頁是身世與四維', [...LOCKED_CREATION_TABS], [1, 2]);

// ─────────────────────────────────────────────────────────── G
section('G. 創角進度清單：把驗證結果變成一條主線');

const blankList = buildCreationChecklist(createNewCharacter());
check('清單有五個步驟且與 CREATION_STEPS 一致',
  blankList.map((i) => i.id), CREATION_STEPS.map((i) => i.id));
check('清單不含情感羈絆（羈絆不屬創角，原書 p.154）',
  blankList.some((i) => i.label.includes('羈絆')), false);
check('每一步都有顯示名', blankList.every((i) => Boolean(i.label)), true);
check('空白角色：身世待處理（缺姓名等）', blankList[0].status, 'todo');
check('空白角色：四維已完成（預設 8×4 = 32）', blankList[1].status, 'done');
check('空白角色：職業有問題（0 個職業）', blankList[2].status, 'error');
check('有問題的步驟帶錯誤數', blankList[2].errorCount, 1);
check('完成的步驟給出說明文字', blankList[1].message, '骰階點數已分配完成');
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
  origin: '邊境村落',
  classes: [
    { className: '守護者', level: 5, skills: [{ name: '測試技能', sl: 5 }] },
    { className: '元素師', level: 0, skills: [] }
  ]
});
const finishedList = buildCreationChecklist(finished);
check('填完的卡：五步全部完成',
  finishedList.map((i) => i.status), ['done', 'done', 'done', 'done', 'done']);
check('填完的卡：沒有阻擋定稿的項目',
  finishedList.filter((i) => i.status === 'error').length, 0);
check('GM 規則會反映在清單上（必修職業未修習 → 該步有問題）',
  buildCreationChecklist(finished, { requiredClasses: ['靈師'] })
    .find((i) => i.id === 3).status, 'error');
check('GM 收窄職業數也會反映在清單上',
  buildCreationChecklist(finished, { classCountMin: 3, classCountMax: 3 })
    .find((i) => i.id === 3).status, 'error');
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

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
