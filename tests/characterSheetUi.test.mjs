/**
 * 角色卡 UI 契約測試。
 *
 * 執行：npm run test:ui
 *
 * 這裡放的是「使用者回報過的介面問題」的護欄——每一條都對應一次真實的抱怨：
 * - 「跑團卡和角色卡的到底是什麼？兩個按鈕寫的根本沒有差別」→ 標籤必須說明「你來這裡做什麼」
 * - 「一個短列而已根本不知道那些技能是什麼」→ 升級流程必須顯示技能效果全文
 * - 「所有數值要可以自己填寫」→ 六項資源都必須是可輸入的步進器
 *
 * 護欄刻意用「原始碼掃描 + 純函式」而不是渲染測試：
 * 這些問題都是「某個地方少寫了什麼」，掃描原始碼最直接，而且不會因為版面微調就失效。
 */
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NumberStepper, { parseStepperInput } from '../src/components/ui/NumberStepper.jsx';
import {
  buildSheetModel,
  OfficialSheetPage1,
  OfficialSheetPage2,
  OfficialSheetPage3,
  SHEET_PAGE_WIDTH,
  SHEET_PAGE_HEIGHT,
  FABULA_POINT_RULES,
  EXPERIENCE_POINT_RULES,
  SHEET_DISCIPLINES
} from '../src/features/character-sheet/components/CharacterSheetExport.jsx';
import { createNewCharacter, getProficiencies } from '../src/features/character-sheet/utils/characterEngine.js';
import { LOG_KINDS } from '../src/features/character-sheet/utils/characterLog.js';
import { EQUIPMENT_ICONS } from '../src/features/character-sheet/utils/equipmentRules.js';
import { GAME_ICONS_MAP } from '../src/components/ui/GameIcon.jsx';
import { readIconMapKeys, findDuplicateIconKeys } from './helpers/gameIconMap.mjs';

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

const read = (rel) => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
/** 掃描使用者可見文案時要先去掉註解——否則「解釋舊標籤為什麼不好」的註解會自己被判成違規 */
const stripComments = (src) => src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

const hud = read('../src/features/character-sheet/components/CharacterPlayHUD.jsx');
const editor = read('../src/features/character-sheet/components/CharacterEditor.jsx');
const sheet = read('../src/features/character-sheet/CharacterSheet.jsx');
const editorCode = stripComments(editor);
const hudCode = stripComments(hud);
const sheetCode = stripComments(sheet);

// ─────────────────────────────────────────────────────────── A
section('A. 數值步進器：可自己填寫、也可用 ± 增減');

check('空字串 → 不套用', parseStepperInput('', 10), null);
check('只有空白 → 不套用', parseStepperInput('   ', 10), null);
check('非數字 → 不套用', parseStepperInput('abc', 10), null);
check('填絕對值 25（現值 10）→ 增減 +15', parseStepperInput('25', 10), { delta: 15 });
check('填絕對值 4（現值 10）→ 增減 -6', parseStepperInput('4', 10), { delta: -6 });
check('填與現值相同 → 不套用', parseStepperInput('10', 10), null);
check('輸入 +12 → 增減 +12（不是設成 12）', parseStepperInput('+12', 10), { delta: 12 });
check('輸入 -12 → 增減 -12', parseStepperInput('-12', 10), { delta: -12 });
check('+ 與絕對值語意不同：+10 是「再加 10」', parseStepperInput('+10', 10), { delta: 10 });
check('帶小數 → 取原值（由呼叫端夾制）', parseStepperInput('12.5', 10), { delta: 2.5 });
check('前後空白會被修剪', parseStepperInput('  +7  ', 10), { delta: 7 });
check('null / undefined → 不套用',
  [parseStepperInput(null, 10), parseStepperInput(undefined, 10)], [null, null]);
check('0 是合法輸入（現值 10 → 增減 -10）', parseStepperInput('0', 10), { delta: -10 });

const stepperHtml = renderToStaticMarkup(React.createElement(NumberStepper, {
  value: 12,
  onDelta: () => {}
}));
check('步進器渲染出目前值', stepperHtml.includes('value="12"'), true);
check('步進器有 − 與 + 兩顆按鈕',
  [stepperHtml.includes('−'), stepperHtml.includes('>+<')], [true, true]);
check('步進器帶輸入提示', stepperHtml.includes('可直接輸入數值'), true);
check('disabled 時輸入框與按鈕都停用',
  (renderToStaticMarkup(React.createElement(NumberStepper, { value: 1, onDelta: () => {}, disabled: true })).match(/disabled=""/g) || []).length,
  3);

// ─────────────────────────────────────────────────────────── B
section('B. 六項資源都必須是可自己填寫的步進器（使用者回報）');

const resourceCalls = [
  ['HP', /<NumberStepper\s+value=\{curHp\}/],
  ['MP', /<NumberStepper\s+value=\{curMp\}/],
  ['IP', /<NumberStepper\s+value=\{curIp\}/],
  ['EXP', /<NumberStepper\s+value=\{character\.exp \|\| 0\}/],
  ['資金', /<NumberStepper\s+value=\{character\.zenit \|\| 0\}/],
  ['物語點', /<NumberStepper\s+value=\{character\.fabulaPoints \|\| 3\}/]
];
check('六項資源都改用 NumberStepper',
  resourceCalls.filter(([, re]) => !re.test(hud)).map(([name]) => name), []);
check('舊的固定 ±1／±5 按鈕已移除',
  ['adjustHp(-5)', 'adjustMp(5)', 'adjustExp(5)', 'adjustZenit(100)', 'adjustIp(-1)'].filter((s) => hud.includes(s)),
  []);
check('夾制後沒有變化時不寫入（避免 0 → 0 的空記錄）',
  (hud.match(/if \(next === cur/g) || []).length >= 5, true);
check('跑團卡有引入步進器', hud.includes("from '../../../components/ui/NumberStepper'"), true);

// ─────────────────────────────────────────────────────────── C
section('C. 升級流程要看得到技能在做什麼（使用者回報）');

check('升級模態不再用下拉選單挑技能', hud.includes('-- 選擇特技 --'), false);
check('升級模態逐項顯示技能效果全文',
  [hud.includes('SkillDescription'), hud.includes('sl={isSel && !maxed ? curSL + 1 : curSL}')],
  [true, true]);
check('選取中的技能以「升級後」的 SL 顯示',
  hud.includes('以上數值以升級後的 SL'), true);
check('升級模態提供連到構築工坊「職業與技能」的入口',
  [hud.includes('onOpenEditor(3)'), hud.includes('想比較其他職業的技能？')], [true, true]);
check('編輯器支援指定初始分頁', editor.includes('initialTab = 1') && editor.includes('useState(initialTab)'), true);
check('名冊開啟編輯器時固定回到第 1 分頁', sheet.includes('setEditorTab(1)'), true);
check('跑團卡傳分頁給編輯器', sheet.includes('onOpenEditor={(tab) => { setEditorTab(tab || 1);'), true);

// ─────────────────────────────────────────────────────────── D
section('D. 兩個入口按鈕必須說明「你來這裡做什麼」（使用者回報）');

check('編輯器不再出現「查看角色卡」', editorCode.includes('查看角色卡'), false);
check('編輯器不再出現「進入跑團卡」', editorCode.includes('進入跑團卡'), false);
check('編輯器不再出現「查看卡片」', editorCode.includes('查看卡片'), false);
check('改名為「卡片預覽」並標示唯讀',
  [editorCode.includes('卡片預覽'), editorCode.includes('唯讀')], [true, true]);
check('改名為「跑團面板」並附一行說明',
  [editorCode.includes('跑團面板'), editorCode.includes('HP／MP／狀態、攻擊與咒語、命刻')], [true, true]);
check('預覽按鈕說明它做什麼', editorCode.includes('看整張卡目前填得怎樣、列印或截圖存檔'), true);
check('名冊卡片也用同一套詞彙',
  [sheetCode.includes('構築與成長'), sheetCode.includes('跑團面板')], [true, true]);
check('跑團面板標頭也用同一套詞彙', hudCode.includes('構築與成長'), true);
check('麵包屑不再用「構建／實戰」',
  [sheetCode.includes('`構建：'), sheetCode.includes('`實戰：')], [false, false]);
check('全站使用者可見文案不再出現「跑團卡」',
  [editorCode, hudCode, sheetCode].filter((src) => src.includes('跑團卡')).length, 0);

// ─────────────────────────────────────────────────────────── E
section('E. 官方三頁匯出：欄位對應');

const sheetChar = createNewCharacter({
  name: '測試勇者',
  identity: '流浪劍士',
  theme: '希望',
  origin: '邊境村落',
  zenit: 320,
  exp: 7,
  fabulaPoints: 2,
  currentHp: 12,
  currentMp: null,
  backpackNotes: '乾糧三份',
  quirk: '倖存者',
  attributes: { dex: 10, ins: 8, mig: 6, wlp: 8 },
  statusAfflictions: { dazed: true, weak: true },
  bonds: [
    { id: 'b1', target: '同行夥伴', feelings: ['admiration', 'loyalty'] },
    { id: 'b2', target: '宿敵', feelings: ['hatred'] }
  ],
  equipment: { mainHand: '青銅劍', offHand: '青銅圓盾', armor: '旅行皮甲', accessory: '守護護符' },
  classes: [
    { className: '守護者', level: 3, chosenBenefit: 'hp', skills: [{ name: '鐵壁', sl: 2 }] },
    { className: '元素師', level: 2, skills: [{ name: '元素學派儀式', sl: 1 }] },
    { className: '博學士', level: 1, skills: [] },
    { className: '靈師', level: 1, skills: [{ name: '靈魂學派儀式', sl: 1 }] },
    { className: '熵師', level: 1, skills: [] }
  ],
  heroicSkills: ['英雄的覺悟'],
  spells: [
    { name: '火球', mp: 10, target: '一個生物', duration: '瞬發', desc: '造成【HR + 5】火屬性傷害。' },
    { name: '治療', mp: 8, target: '一個生物', duration: '瞬發', desc: '回復【SL × 5】HP。' },
    { name: '冰錐', mp: 10, target: '一個生物', duration: '瞬發', desc: '造成冰屬性傷害。' },
    { name: '雷擊', mp: 12, target: '一個生物', duration: '瞬發', desc: '造成電屬性傷害。' },
    { name: '護盾', mp: 6, target: '自身', duration: '場景', desc: '物防 +2。' },
    { name: '淨化', mp: 5, target: '一個生物', duration: '瞬發', desc: '解除一個異常狀態。' },
    { name: '疾風', mp: 9, target: '一個生物', duration: '瞬發', desc: '造成風屬性傷害。' },
    { name: '暗影', mp: 11, target: '一個生物', duration: '瞬發', desc: '造成暗屬性傷害。' }
  ]
});
const model = buildSheetModel(sheetChar);

check('身世三欄', [model.identity, model.theme, model.origin], ['流浪劍士', '希望', '邊境村落']);
check('姓名', model.name, '測試勇者');
check('物語點／經驗值／資金',
  [model.fabulaPoints, model.exp, model.zenit], [2, 7, 320]);
check('羈絆固定 6 格', model.bonds.length, 6);
check('羈絆帶目標與感情勾選',
  [model.bonds[0].target, model.bonds[0].feelings.admiration, model.bonds[0].feelings.hatred, model.bonds[1].feelings.hatred],
  ['同行夥伴', true, false, true]);
check('空的羈絆格是空白的', model.bonds[5].target, '');
check('HP 當前值取自角色', model.pools.hp.current, 12);
check('MP 當前值 null 代表滿值', model.pools.mp.current, model.pools.mp.max);
check('IP 當前值 null 代表滿值', model.pools.ip.current, model.pools.ip.max);
check('HP 上限與危機值來自引擎', [model.pools.hp.max > 0, model.crisisThreshold > 0], [true, true]);
check('四維基礎值', model.attributes.base.map((a) => a.value), [10, 8, 6, 8]);
check('四維當前值（眩暈降 INS 一階；虛弱時 MIG 已在 d6 下限）',
  model.attributes.current.map((a) => a.value), [10, 6, 6, 8]);
check('狀態勾選', model.statuses.filter((s) => s.on).map((s) => s.cn), ['眩暈', '虛弱']);
check('裝備四列（配件／防具／主手／副手）',
  model.equipmentRows.map((r) => r.label), ['配件', '防具', '主手', '副手']);
check('裝備列帶規則書上的說明（武器為命中／傷害式）',
  model.equipmentRows.find((r) => r.slot === 'mainHand').desc.includes('HR'), true);
check('防具列帶說明', model.equipmentRows.find((r) => r.slot === 'armor').desc.length > 0, true);
// 熟練度不另寫一份判定：直接取自引擎，測試只驗「有接上去」而不是「哪個職業給什麼」
check('熟練度直接取自引擎', model.proficiencies, getProficiencies(sheetChar));
check('熟練度不是全空（確實有讀到職業）',
  Object.values(model.proficiencies).some(Boolean), true);
check('P1 職業欄只放前 3 個', model.page1Classes.map((c) => c.className), ['守護者', '元素師', '博學士']);
check('其他職業從第 4 個開始，最多 4 個', model.otherClasses.map((c) => c.className), ['靈師', '熵師']);
check('免費增益翻成中文', model.page1Classes[0].freeBenefit, '最大 HP +5');
check('技能資訊帶 SL', model.page1Classes[0].skills, ['鐵壁　SL 2']);
check('咒語 P2 放前 7 條', model.page2Spells.map((s) => s.name),
  ['火球', '治療', '冰錐', '雷擊', '護盾', '淨化', '疾風']);
check('咒語 P3 接續（第 8 條起）', model.page3Spells.map((s) => s.name), ['暗影']);
check('咒語列帶 MP／目標／持續時間',
  [model.page2Spells[0].mp, model.page2Spells[0].targets, model.page2Spells[0].duration], [10, '一個生物', '瞬發']);
check('儀式學派由技能名稱推導（元素師＋靈師 → 兩個學派）',
  model.disciplines.filter((d) => d.on).map((d) => d.name), ['元素學派', '靈魂學派']);
check('六個學派都在表上', model.disciplines.length, 6);
check('英雄技能', model.heroicSkills, ['英雄的覺悟']);
check('金手指「無」不顯示', buildSheetModel(createNewCharacter({ quirk: '無' })).quirk, '');
check('金手指有值時顯示', model.quirk, '倖存者');
check('行囊筆記', model.backpackNotes, '乾糧三份');

check('空角色也能算出模型（不會炸）', (() => {
  const m = buildSheetModel({});
  return [m.name, m.bonds.length, m.equipmentRows.length, m.attributes.base.length];
})(), ['', 6, 4, 4]);

// ─────────────────────────────────────────────────────────── F
section('F. 官方三頁匯出：版面與 SSR');

check('頁面尺寸為 A4 橫向 @96dpi（官方 842×595 pt 等比）',
  [SHEET_PAGE_WIDTH, SHEET_PAGE_HEIGHT], [1123, 794]);
check('物語點規則文字（官方原表印的那段）有 7 條', FABULA_POINT_RULES.length, 7);
check('經驗點規則文字有 4 條', EXPERIENCE_POINT_RULES.length, 4);
check('規則文字不是空的', [...FABULA_POINT_RULES, ...EXPERIENCE_POINT_RULES].every((t) => t.length > 6), true);
check('六個儀式學派名都在詞彙內', SHEET_DISCIPLINES.length, 6);

const page1Html = renderToStaticMarkup(React.createElement(OfficialSheetPage1, { model }));
const page2Html = renderToStaticMarkup(React.createElement(OfficialSheetPage2, { model }));
const page3Html = renderToStaticMarkup(React.createElement(OfficialSheetPage3, { model }));

check('P1 畫出姓名與特質', [page1Html.includes('測試勇者'), page1Html.includes('流浪劍士')], [true, true]);
check('P1 畫出羈絆目標', page1Html.includes('同行夥伴'), true);
check('P1 畫出物語點與經驗點的規則框',
  [page1Html.includes('場景開始時若你沒有任何物語點'), page1Html.includes('每次聚會結束時')], [true, true]);
check('P1 畫出先攻／物防／魔防', ['先攻修正', '物防', '魔防'].every((t) => page1Html.includes(t)), true);
check('P1 畫出裝備四列', ['配件', '防具', '主手', '副手'].every((t) => page1Html.includes(t)), true);
check('P1 畫出四維與狀態', ['d10', '眩暈'].every((t) => page1Html.includes(t)), true);
check('P1 畫出職業與免費增益', [page1Html.includes('守護者'), page1Html.includes('最大 HP +5')], [true, true]);
check('P1 只放前三個職業', page1Html.includes('靈師'), false);
check('P2 放其他職業與咒語', [page2Html.includes('靈師'), page2Html.includes('火球')], [true, true]);
check('P2 不放前三職業的欄位', page2Html.includes('守護者'), false);
check('P3 放續頁咒語', [page3Html.includes('暗影'), page3Html.includes('奧祕與咒語（續）')], [true, true]);
check('三頁都標了自己的頁碼', [
  page1Html.includes('data-sheet-page="1"'),
  page2Html.includes('data-sheet-page="2"'),
  page3Html.includes('data-sheet-page="3"')
], [true, true, true]);
check('三頁都是固定尺寸的版面', page1Html.includes(`width:${SHEET_PAGE_WIDTH}px`), true);

// ─────────────────────────────────────────────────────────── G
section('G. 官方三頁匯出：匯出管線與原始碼護欄');

const exportSrc = read('../src/features/character-sheet/components/CharacterSheetExport.jsx');
check('用 toPng 而不是 toJpeg（表格線條需要無損）', [exportSrc.includes('toPng'), exportSrc.includes('toJpeg')], [true, false]);
check('輸出以 pixelRatio 2 提高解析度', exportSrc.includes('pixelRatio: 2'), true);
check('白底輸出（不是羊皮紙底色）', exportSrc.includes("backgroundColor: '#ffffff'"), true);
check('逐頁匯出成三個檔案', exportSrc.includes('SHEET_PAGE_COMPONENTS.length'), true);
check('檔名帶角色名與頁碼', exportSrc.includes('_角色卡_p'), true);
check('預覽縮放與光柵化分離（ref 掛在未縮放的內層）',
  [exportSrc.includes('transform: `scale(${PREVIEW_SCALE})`'), exportSrc.includes('pageRefs.current[i] = el')],
  [true, true]);
check('編輯器有兩個檢視分頁', [editorCode.includes('官方三頁（可匯出 PNG）'), editorCode.includes("previewTab === 'official'")], [true, true]);
check('卡片檢視仍保留', editorCode.includes('<CharacterCard'), true);
check('匯出面板有載入中狀態（避免重複點擊）', exportSrc.includes("exporting ? '匯出中…'"), true);

// ─────────────────────────────────────────────────────────── H
section('H. 圖示表本身的護欄（這一段是被自己的失誤逼出來的）');

const iconKeys = readIconMapKeys();
check('圖示表沒有重複的鍵（重複鍵會靜默蓋掉前者）', findDuplicateIconKeys(iconKeys), []);
check('圖示表讀得到內容（解析沒有壞掉）', iconKeys.length > 150, true);
check('成長履歷的 13 個圖示都登記在圖示表裡',
  Object.values(LOG_KINDS).filter((m) => !GAME_ICONS_MAP[m.icon]).map((m) => m.icon), []);
check('裝備圖示對照表也都登記在圖示表裡',
  Object.values(EQUIPMENT_ICONS).filter((k) => !GAME_ICONS_MAP[k]), []);

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
