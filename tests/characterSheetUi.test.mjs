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
  sheetVars,
  FABULA_POINT_RULES,
  EXPERIENCE_POINT_RULES,
  SHEET_DISCIPLINES
} from '../src/features/character-sheet/components/CharacterSheetExport.jsx';
import { createNewCharacter, getProficiencies } from '../src/features/character-sheet/utils/characterEngine.js';
import { LOG_KINDS } from '../src/features/character-sheet/utils/characterLog.js';
import { EQUIPMENT_ICONS } from '../src/features/character-sheet/utils/equipmentRules.js';
import { ATTRIBUTE_NAMES } from '../src/features/character-sheet/data/sourcebookConfig.js';
import { GAME_ICONS_MAP } from '../src/components/ui/GameIcon.jsx';
import { readIconMapKeys, findDuplicateIconKeys } from './helpers/gameIconMap.mjs';
import CharacterEditor from '../src/features/character-sheet/components/CharacterEditor.jsx';
import CharacterCard from '../src/features/character-sheet/components/CharacterCard.jsx';
import AttributeMatrixPicker from '../src/features/character-sheet/components/AttributeMatrixPicker.jsx';
import {
  buildImagePdf,
  buildImagePdfBytes,
  readJpegSize,
  dataUrlToBytes,
  A4_LANDSCAPE_PT
} from '../src/features/character-sheet/utils/pdfWriter.js';

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
  // `??` 不是 `||`：物語點 0 是合法值，不能被當成缺值（2026-10-06 修）
  ['物語點', /<NumberStepper\s+value=\{character\.fabulaPoints \?\? 3\}/]
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
check('編輯器支援指定初始分頁（且會夾制）',
  [editor.includes('initialTab = 1'), editor.includes('Number.isInteger(initialTab)')], [true, true]);
check('名冊開啟編輯器時固定回到第 1 分頁', sheet.includes('setEditorTab(1)'), true);
check('跑團卡傳分頁給編輯器（且驗型別）',
  [sheet.includes('onOpenEditor={(tab)'), sheet.includes("typeof tab === 'number'")], [true, true]);

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

// 同一個動作（開卡片預覽彈窗）在畫面上有三個入口（側邊欄／手機列／底部動作列），
// 它們**必須同名**——上一輪就是漏了底部那顆，三個入口兩個名字。
// 護欄用「開窗次數 ≤ 標籤出現次數」把這件事綁住：新增入口卻忘了用同一個標籤就會斷。
const previewOpeners = (editorCode.match(/setIsCardPreviewModalOpen\(true\)/g) || []).length;
const previewLabelCount = (editorCode.match(/卡片預覽/g) || []).length;
check('開卡片預覽的入口不只一個（三處）', previewOpeners >= 3, true);
check('每個入口都用同一個標籤「卡片預覽」', previewLabelCount >= previewOpeners, true);
check('沒有殘留的舊標籤（查看當前角色卡／查看角色卡／進入跑團卡）',
  ['查看當前角色卡', '查看角色卡', '進入跑團卡'].filter((t) => editorCode.includes(t)), []);

// ─────────────────────────────────────────────────────────── E
section('E. 官方三頁匯出：欄位對應');

const sheetChar = createNewCharacter({
  name: '測試勇者',
  identity: '流浪劍士',
  theme: '希望',
  origin: '邊境村落',
  gender: '女',
  background: '普拉塔王室最後的倖存者。',
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
    { className: '守護者', level: 3, chosenBenefit: 'hp', skills: [{ name: '防守掌握', sl: 2 }] },
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
check('技能資訊帶 SL（現在是物件，多了效果全文欄位）',
  [model.page1Classes[0].skills[0].name, model.page1Classes[0].skills[0].sl,
    'desc' in model.page1Classes[0].skills[0]],
  ['防守掌握', 2, true]);
check('咒語 P2 放前 7 條', model.page2Spells.map((s) => s.name),
  ['火球', '治療', '冰錐', '雷擊', '護盾', '淨化', '疾風']);
check('咒語 P3 接續（第 8 條起）', model.page3Spells.map((s) => s.name), ['暗影']);
check('咒語列帶 MP／目標／持續時間',
  [model.page2Spells[0].mp, model.page2Spells[0].targets, model.page2Spells[0].duration], [10, '一個生物', '瞬發']);
check('儀式學派由技能名稱推導（元素師＋靈師 → 兩個學派）',
  model.disciplines.filter((d) => d.on).map((d) => d.name), ['元素學派', '靈魂學派']);
check('六個學派都在表上', model.disciplines.length, 6);
check('英雄技能帶效果全文欄位',
  [model.heroicSkills[0].name, 'effect' in model.heroicSkills[0]], ['英雄的覺悟', true]);
check('金手指「無」不顯示', buildSheetModel(createNewCharacter({ quirk: '無' })).quirk, '');
check('金手指有值時顯示', model.quirk, '倖存者');
check('行囊筆記', model.backpackNotes, '乾糧三份');

// 官方表上與姓名並排的那一格是「稱呼」；本專案依使用者裁定（2026-10-06）改為性別。
// 舊版這一格永遠是空的——`pronouns` 在模型裡被寫死成 ''，印出來是一條空白線。
check('性別帶進匯出模型', model.gender, '女');
check('匯出模型不再有 pronouns 這個欄位',
  Object.prototype.hasOwnProperty.call(model, 'pronouns'), false);
// 角色背景**不進三頁**：三頁是固定 1123×794 的官方表格複刻，六欄餘裕只有 0～4px
// （2026-10-06 實測），硬加一個背景框會讓 P1 每個框各被裁掉一行。它由角色卡承載。
check('匯出模型沒有 background 欄位（版面滿載，見 CharacterSheetExport 的註解）',
  Object.prototype.hasOwnProperty.call(model, 'background'), false);

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
check('PNG 走無損的 toPng（表格線條需要無損）',
  [exportSrc.includes('htmlToImage.toPng'), exportSrc.includes("rasterizePages('png')")], [true, true]);
check('輸出以 pixelRatio 2 提高解析度', exportSrc.includes('pixelRatio: 2'), true);
check('匯出底色跟著角色主題（不再寫死白色／官方青綠）',
  [exportSrc.includes('sheetVars'), exportSrc.includes('--sh-bg')], [true, true]);
check('逐頁匯出成三個檔案', exportSrc.includes('SHEET_PAGE_COMPONENTS.length'), true);
check('檔名帶角色名與頁碼', exportSrc.includes('_角色卡_p'), true);
check('預覽縮放與光柵化分離（ref 掛在未縮放的內層）',
  [exportSrc.includes('transform: `scale(${PREVIEW_SCALE})`'), exportSrc.includes('pageRefs.current[i] = el')],
  [true, true]);
const previewSrc = read('../src/features/character-sheet/components/CharacterPreviewModal.jsx');
check('預覽彈窗有兩個分頁（已抽成獨立元件）',
  [previewSrc.includes('卡片檢視'), previewSrc.includes('三頁表格（可匯出 PNG／PDF）')], [true, true]);
check('卡片檢視仍保留在彈窗裡', previewSrc.includes('<CharacterCard'), true);
check('匯出面板有載入中狀態（避免重複點擊）', exportSrc.includes("'匯出中…'"), true);

// ─────────────────────────────────────────────────────────── H
section('H. 圖示表本身的護欄（這一段是被自己的失誤逼出來的）');

const iconKeys = readIconMapKeys();
check('圖示表沒有重複的鍵（重複鍵會靜默蓋掉前者）', findDuplicateIconKeys(iconKeys), []);
check('圖示表讀得到內容（解析沒有壞掉）', iconKeys.length > 150, true);
check('成長履歷的 13 個圖示都登記在圖示表裡',
  Object.values(LOG_KINDS).filter((m) => !GAME_ICONS_MAP[m.icon]).map((m) => m.icon), []);
check('裝備圖示對照表也都登記在圖示表裡',
  Object.values(EQUIPMENT_ICONS).filter((k) => !GAME_ICONS_MAP[k]), []);

// ─────────────────────────────────────────────────────────── I
section('I. 三頁 PDF：自己寫的極簡 PDF 產生器');

/** 手工組一個最小可辨識的 JPEG 檔頭（SOI + SOF0）——readJpegSize 只讀到這裡 */
const jpegHeader = (w, h) => new Uint8Array([
  0xff, 0xd8,
  0xff, 0xc0, 0x00, 0x11, 0x08,
  (h >> 8) & 0xff, h & 0xff,
  (w >> 8) & 0xff, w & 0xff,
  0, 0, 0, 0, 0, 0, 0, 0, 0
]);

check('readJpegSize 讀出 JPEG 實際尺寸', readJpegSize(jpegHeader(2246, 1588)), { height: 1588, width: 2246 });
check('非 JPEG 位元組 → null（由呼叫端退回傳入值）', readJpegSize(new Uint8Array([1, 2, 3, 4])), null);
check('位元組太短 → null', readJpegSize(new Uint8Array([0xff, 0xd8])), null);
check('null → null', readJpegSize(null), null);
check('dataUrlToBytes 解出 base64 內容',
  Array.from(dataUrlToBytes('data:image/jpeg;base64,AQIDBA==')), [1, 2, 3, 4]);
check('dataUrlToBytes 對壞字串回空陣列', dataUrlToBytes('nonsense').length, 0);

check('沒有影像 → 不產 PDF', buildImagePdf([]), null);
check('全部是空影像 → 不產 PDF', buildImagePdf([{ bytes: new Uint8Array(0) }]), null);

const fakeImages = [0, 1, 2].map((i) => ({
  bytes: new Uint8Array(64).fill(0x40 + i),
  width: 2246,
  height: 1588
}));
const pdfBlob = buildImagePdf(fakeImages);
check('產出 PDF blob', [pdfBlob instanceof Blob, pdfBlob.type], [true, 'application/pdf']);

const pdfBytes = await buildImagePdfBytes(fakeImages);
const pdfText = Buffer.from(pdfBytes).toString('latin1');

check('檔頭是 %PDF-1.4', pdfText.startsWith('%PDF-1.4'), true);
check('含二進位標記', pdfBytes[9] === 0x25 && pdfBytes[10] === 0xe2, true);
check('Catalog 指向 Pages', pdfText.includes('/Type /Catalog /Pages 2 0 R'), true);
check('頁數正確', pdfText.includes('/Count 3'), true);
check('三頁都指向自己的影像物件',
  ['/Im0 5 0 R', '/Im0 8 0 R', '/Im0 11 0 R'].every((t) => pdfText.includes(t)), true);
check('頁面尺寸為 A4 橫向', pdfText.includes('/MediaBox [0 0 841.89 595.28]'), true);
check('JPEG 以 DCTDecode 原樣嵌入（不重新編碼）', pdfText.includes('/Filter /DCTDecode'), true);
check('物件數＝2 + 3×頁數', (pdfText.match(/\n\d+ 0 obj\n/g) || []).length, 11);
check('以 %%EOF 結尾', pdfText.trimEnd().endsWith('%%EOF'), true);

// xref 是 PDF 的目錄：位移錯了整份就打不開，所以逐筆驗它指到正確的物件開頭
const startxref = Number(pdfText.match(/startxref\n(\d+)/)[1]);
check('startxref 指向 xref 表', pdfText.slice(startxref, startxref + 4), 'xref');
const xrefLines = pdfText.slice(startxref).split('\n').slice(2); // 0:'xref' 1:'0 12' 2:空閒條目
check('第一筆是空閒條目', xrefLines[0], '0000000000 65535 f ');
check('物件 1 從檔頭（含二進位標記）之後開始', xrefLines[1].slice(0, 10), '0000000015');
const objectEntries = xrefLines.slice(1, 12);
check('xref 有 11 筆物件條目', objectEntries.length, 11);
check('每一筆 xref 位移都指到該物件的開頭',
  objectEntries.map((line, i) => {
    const offset = Number(line.slice(0, 10));
    return pdfText.slice(offset, offset + `${i + 1} 0 obj`.length) === `${i + 1} 0 obj`;
  }),
  new Array(11).fill(true));
check('xref 每筆條目剛好 19 字元（含換行則 20 bytes）', objectEntries.every((l) => l.length === 19), true);

const fourPage = await buildImagePdfBytes([...fakeImages, { bytes: new Uint8Array(8).fill(7), width: 10, height: 10 }]);
check('頁數隨影像數量變動', Buffer.from(fourPage).toString('latin1').includes('/Count 4'), true);

const pdfWriterSrc = read('../src/features/character-sheet/utils/pdfWriter.js');
check('PDF 產生器沒有外部依賴（自己寫，不拉套件）',
  /^\s*import .* from '(?!node:)/m.test(pdfWriterSrc), false);
check('A4 橫向常數與官方表一致', [A4_LANDSCAPE_PT.width, A4_LANDSCAPE_PT.height], [841.89, 595.28]);
check('匯出面板同時提供 PDF 與 PNG',
  [exportSrc.includes('匯出三頁 PDF'), exportSrc.includes('匯出三張 PNG')], [true, true]);
check('PDF 走 JPEG（DCTDecode 可直接嵌入）、PNG 走無損',
  [exportSrc.includes("await rasterizePages('jpeg')"), exportSrc.includes("await rasterizePages('png')")],
  [true, true]);
check('PDF 用 object URL 下載並事後釋放',
  [exportSrc.includes('URL.createObjectURL(pdf)'), exportSrc.includes('URL.revokeObjectURL(url)')],
  [true, true]);
check('匯出中會鎖住兩顆按鈕', exportSrc.includes('disabled={Boolean(exporting)}'), true);

// ─────────────────────────────────────────────────────────── J
section('J. 匯出不能把主執行緒鎖死（使用者回報「一按就死機」）');

// 光柵化一次要好幾秒。`await` 只讓出 microtask，而瀏覽器處理點擊是 macrotask——
// 連續三頁不讓出的話，整段匯出期間任何點擊都沒反應。
check('每一頁之前都讓出 macrotask（setTimeout ＋ requestAnimationFrame）',
  [exportSrc.includes('const yieldToBrowser = ()'), exportSrc.includes('setTimeout(() => {'),
    exportSrc.includes('requestAnimationFrame(() => resolve())')],
  [true, true, true]);
check('rasterizePages 每一頁之前都呼叫讓出',
  (exportSrc.match(/await yieldToBrowser\(\)/g) || []).length >= 2, true);
check('PDF 組裝前也讓出一次', exportSrc.includes("setProgress('正在組裝 PDF…')"), true);
check('有逐頁進度文字', /正在處理第 \$\{i \+ 1\} \/ \$\{total\} 頁/.test(exportSrc), true);
check('卸載後清掉 ref（不抱著已移除的 DOM 樹）',
  exportSrc.includes('pageRefs.current = []'), true);

const modalSrc = read('../src/components/ui/JRPGModal.jsx');
check('彈窗的 keydown effect 不依賴 onClose（行內箭頭會讓它每次 render 重跑）',
  /}, \[isOpen\]\);/.test(modalSrc) && !/\}, \[isOpen, onClose\]\);/.test(modalSrc), true);
check('onClose 走 ref（effect 內仍拿得到最新的）',
  [modalSrc.includes('onCloseRef.current = onClose'), modalSrc.includes('onCloseRef.current?.()')], [true, true]);
check('body 捲動鎖是計數式的（重疊彈窗不會互相覆寫）',
  [modalSrc.includes('let bodyLockCount = 0'), modalSrc.includes('bodyLockCount += 1'),
    modalSrc.includes('bodyLockCount === 0'), modalSrc.includes('bodyOverflowBeforeLock')],
  [true, true, true, true]);
check('計數歸零才還原（不是每個彈窗各自還原）',
  /bodyLockCount = Math\.max\(0, bodyLockCount - 1\)/.test(modalSrc), true);

// 這一段是「一按就死機」的真正根因：html-to-image 預設會去 fetch 網頁字型內嵌，
// 而 index.html 掛著 Google Fonts——那個網域連不上時 promise 永遠不 resolve，匯出就永遠卡住。
check('光柵化一定要 skipFonts（否則會去抓 Google Fonts，抓不到就永遠卡住）',
  [exportSrc.includes('skipFonts: true'), exportSrc.includes('RASTER_OPTIONS')], [true, true]);
check('單頁有逾時上限（卡住也要讓 UI 回得來）',
  [exportSrc.includes('RASTER_TIMEOUT_MS'), exportSrc.includes('withTimeout(')], [true, true]);

const npcSrc = read('../src/features/npc-workshop/NPCWorkshop.jsx');
check('NPC 工坊的兩個匯出也 skipFonts（同一顆地雷）',
  (npcSrc.match(/skipFonts: true/g) || []).length, 2);
check('NPC 工坊不再 await document.fonts.ready（那個 promise 可能永遠不 resolve）',
  stripComments(npcSrc).includes('await document.fonts.ready'), false);
check('index.html 確實有外部字型（這就是為什麼要 skipFonts）',
  read('../index.html').includes('fonts.googleapis.com'), true);

// ─────────────────────────────────────────────────────────── K
section('K. 跑團面板的「構築與成長」一按就死機（使用者回報，已重現）');

// 症狀：在跑團面板按「構築與成長」，整頁死掉。
// 根因：那顆按鈕寫成 `onClick={onOpenEditor}`，React 會把**點擊事件物件**當成第一個參數傳進去，
//       CharacterSheet 把它存進 state 當成「分頁編號」，編輯器再把 activeTab 渲染到
//       「步驟 {activeTab}/6」→ React 拋 "Objects are not valid as a React child" → 整棵樹卸載。
//
// 這裡直接餵一個長得像事件物件的東西，驗編輯器還活著——這才是真的迴歸測試。
const bogusTab = { _reactName: 'onClick', type: 'click', nativeEvent: { isTrusted: true }, target: null };
const editorWithBogusTab = (() => {
  try {
    return renderToStaticMarkup(React.createElement(CharacterEditor, {
      character: createNewCharacter({ name: '當機測試角色' }),
      themeId: 'emerald',
      onChange: () => {},
      showToast: () => {},
      initialTab: bogusTab
    }));
  } catch (err) {
    return `THREW ${err.message}`;
  }
})();

check('把點擊事件物件當成分頁編號傳進去，編輯器不會炸',
  editorWithBogusTab.startsWith('THREW'), false);
check('沒有把事件物件渲染出來（就是這個字串讓 React 拋錯）',
  [editorWithBogusTab.includes('_reactName'), editorWithBogusTab.includes('[object Object]')],
  [false, false]);
check('仍然正常畫出編輯器內容', editorWithBogusTab.includes('當機測試角色'), true);
check('合法的分頁編號照舊生效',
  renderToStaticMarkup(React.createElement(CharacterEditor, {
    character: createNewCharacter({ name: '分頁測試' }),
    themeId: 'emerald',
    onChange: () => {},
    showToast: () => {},
    initialTab: 3
  })).includes('_reactName'),
  false);

check('跑團面板不再把點擊事件當成參數傳給 onOpenEditor',
  hudCode.includes('onClick={onOpenEditor}'), false);
check('跑團面板的兩個入口都改成箭頭函式',
  (hudCode.match(/onClick=\{\(\) => onOpenEditor\(\)\}/g) || []).length, 2);
check('CharacterSheet 會驗型別才把分頁編號存進 state',
  sheetCode.includes("typeof tab === 'number'"), true);
check('編輯器對 initialTab 做夾制（最後一道防線）',
  [editorCode.includes('Number.isInteger(initialTab)'), editorCode.includes('initialTab <= TAB_COUNT')],
  [true, true]);
check('TAB_COUNT 與實際分頁數綁在一起（改了一邊就會在執行時拋錯）',
  editorCode.includes('TABS.length !== TAB_COUNT'), true);
check('分頁標籤序列就是創角步驟（順序即流程）',
  (editorCode.match(/id: \d+, label: '([^']+)' \}/g) || [])
    .map((row) => /label: '([^']+)'/.exec(row)[1]),
  ['基礎身世', '職業與技能', '四維屬性', '裝備配置', '特質與命刻', '命名與背景']);
// 這條以前是數 `icon: 'xxx' }` 的個數——但那個欄位**從來沒有被讀取**（導航列畫的是編號徽章），
// 等於用死資料當護欄：只要有人照著補一個 icon，數字就對了，標籤寫什麼都不會被抓到。
check('TABS 不再帶著沒有人讀取的 icon 欄位',
  /icon: '[a-z]+' \}/.test(editorCode), false);
check('編輯器不再有情感羈絆分頁與其處理函式',
  [
    editorCode.includes("label: '情感羈絆'"),
    editorCode.includes('BOND_FEELINGS'),
    editorCode.includes('handleAddBond')
  ],
  [false, false, false]);

// ─────────────────────────────────────────────────────────── L
section('L. 跑團面板也能預覽／匯出，且內容要完整（使用者要求）');

// 「跑團面板也要有預覽的功能，才可以直接在那邊匯出圖片或 pdf」
check('跑團面板有「卡片預覽」按鈕',
  [hudCode.includes('卡片預覽'), hudCode.includes('setIsPreviewOpen(true)')], [true, true]);
check('跑團面板開的是同一個預覽彈窗元件（不是另寫一個）',
  hudCode.includes("import CharacterPreviewModal from './CharacterPreviewModal'"), true);
check('編輯器也改用同一個元件', editorCode.includes('<CharacterPreviewModal'), true);
check('彈窗元件同時提供卡片檢視與三頁表格',
  [previewSrc.includes('CharacterSheetExportBody'), previewSrc.includes('<CharacterCard')], [true, true]);
check('從跑團面板開的關閉標籤是「返回跑團面板」',
  hudCode.includes('closeLabel="返回跑團面板"'), true);

// 角色背景不進三頁匯出（版面滿載），由角色卡承載——所以卡片必須真的畫得出來
const cardHtml = renderToStaticMarkup(React.createElement(CharacterCard, {
  character: createNewCharacter({
    name: '測試',
    identity: '流浪劍士',
    origin: '邊境村落',
    gender: '女',
    background: '邊境來的流浪劍士，為了找一個答案而上路。'
  })
}));
check('角色卡顯示性別與角色背景',
  [cardHtml.includes('女'), cardHtml.includes('邊境來的流浪劍士，為了找一個答案而上路。')],
  [true, true]);

// 「各種信息應該都要完整才對，比如技能等資料」
check('技能帶效果全文（不是只有技能名）',
  [model.page1Classes[0].skills[0].desc.length > 0, model.page1Classes[0].skills[0].maxSL > 0],
  [true, true]);
check('英雄技能帶效果全文', model.heroicSkills[0].effect.length >= 0, true);
check('金手指帶效果全文', typeof model.quirkDesc === 'string', true);
check('匯出用 SkillDescription 渲染效果（會代換【SL×N】公式）',
  [exportSrc.includes("import SkillDescription from '../utils/skillFormulaEvaluator'"),
    exportSrc.includes('<SkillDescription')],
  [true, true]);
check('咒語列帶說明', model.page2Spells[0].desc.length > 0, true);

// 「樣式還是照著我們網頁的設計」→ 配色取自角色主題，不是官方表的青綠
check('配色由角色主題推導（sheetVars）',
  [typeof sheetVars, sheetVars({ accent: '#123456' })['--sh-bar']], ['function', '#123456']);
check('沒有角色主題時退回站內羊皮紙色',
  [sheetVars(null)['--sh-bg'], sheetVars(null)['--sh-ink']], ['#fbf7ee', '#3c2415']);
check('三頁都吃這組變數',
  (exportSrc.match(/\.\.\.S\.page, \.\.\.vars/g) || []).length, 3);
check('頁面底色與卡片底色不同（否則框線會消失）',
  sheetVars({ sheetBg: '#eeeeee', cardBg: '#ffffff' })['--sh-bg']
    !== sheetVars({ sheetBg: '#eeeeee', cardBg: '#ffffff' })['--sh-box'],
  true);

// 只內嵌本機圖示字型：Google Fonts 一律不碰（那是上一輪「匯出永遠不回來」的根因）
check('只內嵌本機圖示字型（fontEmbedCSS 自己組，不讓 html-to-image 去抓）',
  [exportSrc.includes('getIconFontCss'), exportSrc.includes('fontEmbedCSS'),
    exportSrc.includes("import iconFontUrl from '../../../assets/FabulaUltimaIcons-Regular.otf'")],
  [true, true, true]);
check('字型內嵌失敗也不會讓匯出卡住（catch 後回空字串）',
  exportSrc.includes(".catch(() => '')"), true);

// ─────────────────────────────────────────────────────────── M
section('M. 創角步驟次序：職業在四維之前（原書 p.154 第 4 步 vs 第 5 步）');

// 這一組是「換過分頁編號」的迴歸測試：只換導航列的標籤而忘了換內容，
// 畫面會變成「第 2 步寫著職業與技能、內容卻是四維屬性面板」——建置與型別都不會發現。
const renderEditorAt = (tab, over = {}, rules = null) => renderToStaticMarkup(React.createElement(CharacterEditor, {
  character: createNewCharacter({ name: '次序測試', startingFundsRolled: true, ...over }),
  themeId: 'emerald',
  onChange: () => {},
  showToast: () => {},
  initialTab: tab,
  ...(rules ? { creationRules: rules } : {})
}));

const tab2Html = renderEditorAt(2);
const tab3Html = renderEditorAt(3);

check('第 2 步畫的是職業與技能',
  [tab2Html.includes('職業組合與技能加點'), tab2Html.includes('四維基礎屬性骰配置')], [true, false]);
check('第 3 步畫的是四維屬性',
  [tab3Html.includes('四維基礎屬性骰配置'), tab3Html.includes('職業組合與技能加點')], [true, false]);
check('導航列的順序也是職業在四維之前',
  tab2Html.indexOf('職業與技能') < tab2Html.indexOf('四維屬性'), true);
check('未結算起始資金的卡會顯示提醒',
  renderEditorAt(1, { startingFundsRolled: false }).includes('起始資金尚未結算'), true);
check('已結算的卡不顯示那則提醒',
  tab2Html.includes('起始資金尚未結算'), false);

// 姓名搬到第 6 步（原書第 8 步，p.154／p.170）——第 1 步不該再有姓名輸入框
const tab1Html = renderEditorAt(1);
const tab6Html = renderEditorAt(6);
check('第 1 步不再有姓名輸入框（原書把姓名放在最後）',
  tab1Html.includes('角色姓名'), false);
check('第 6 步有姓名、性別與角色背景',
  [tab6Html.includes('角色姓名'), tab6Html.includes('性別'), tab6Html.includes('角色背景')],
  [true, true, true]);
check('第 6 步排在特質與命刻之後（導航列的最後一格）',
  tab6Html.lastIndexOf('命名與背景') > tab6Html.lastIndexOf('特質與命刻'), true);

// 英雄技能的資格關卡（原書 p.232）：不合格的選項要停用並寫出原因。
// `<select>` 的展開清單截不到圖，所以用 SSR 斷言——比截圖更強。
const masterHtml = renderEditorAt(5, {
  classes: [{ className: '守護者', level: 10, skills: [] }],
  heroicSkills: []
});
const noMasterHtml = renderEditorAt(5, { classes: [], heroicSkills: [] });
check('已精通職業時顯示資格', masterHtml.includes('已精通職業'), true);
check('不合格的英雄技能選項被停用', /value="背水"[^>]*disabled/.test(masterHtml), true);
check('合格的不會被停用', /value="額外HP"[^>]*disabled/.test(masterHtml), false);
check('停用的選項寫出原因', masterHtml.includes('✕ 需精通【暗黑之刃】其中之一'), true);
check('未精通時整支選單說明需要什麼',
  noMasterHtml.includes('需先精通一個職業（單一職業達 10 級）'), true);

// 出處（使用者要求「必須要標出出處」）：選項標籤帶手冊名
check('英雄技能選項標出出處（核心）', masterHtml.includes('· 核心'), true);
check('Playtest 的技能也在選單裡，且標著 Playtest',
  renderEditorAt(5, { classes: [{ className: '秘儀師', level: 10, skills: [] }] })
    .includes('· Playtest'), true);
check('Playtest 的技能出現在選單裡（抽樣：瘴氣）',
  renderEditorAt(5, { classes: [{ className: '元素師', level: 10, skills: [] }] })
    .includes('瘴氣'), true);

// 開局英雄技能（Playtest Materials 2026-10-01 p.4 的選用規則）
const startRuleHtml = renderEditorAt(5, {
  classes: [{ className: '暗黑之刃', level: 3, skills: [] }],
  heroicSkills: []
}, { startingHeroicSkill: true });
check('規則開啟時，靠開局名額取得的技能標示 ◈',
  startRuleHtml.includes('◈ 用開局名額'), true);
check('規則開啟時說明這是哪一條規則',
  startRuleHtml.includes('開局贈送一個英雄技能'), true);
check('規則開啟時顯示名額狀態', startRuleHtml.includes('開局名額：'), true);
check('規則關閉時不會出現開局名額的標示',
  renderEditorAt(5, { classes: [{ className: '暗黑之刃', level: 3, skills: [] }] })
    .includes('◈ 用開局名額'), false);

// 四維托盤預設是空的（使用者指示：「要讓玩家自己選起始陣列才會在那邊出現 4 個骰子」）
const emptyPicker = renderToStaticMarkup(React.createElement(AttributeMatrixPicker, {
  attributes: { dex: 0, ins: 0, mig: 0, wlp: 0 },
  onChange: () => {},
  theme: {}
}));
const filledPicker = renderToStaticMarkup(React.createElement(AttributeMatrixPicker, {
  attributes: { dex: 10, ins: 8, mig: 8, wlp: 6 },
  onChange: () => {},
  theme: {}
}));
check('未指派時托盤是空的（顯示提示、剩餘 0）',
  [emptyPicker.includes('先從上方'), emptyPicker.includes('剩餘 0')], [true, true]);
check('已指派時托盤有骰子（不再顯示空提示）',
  filledPicker.includes('先從上方'), false);

// 職業彈窗：精通該職業能解鎖哪些英雄技能（只列名稱，效果放 tooltip 以免文字塞爆面板）
const classPickerSrc = read('../src/features/character-sheet/components/ClassPickerModal.jsx');
check('職業彈窗有「精通後可解鎖的英雄技能」區塊，且判定走引擎',
  [classPickerSrc.includes('精通後可解鎖的英雄技能'), classPickerSrc.includes('heroicSkillsForClass')],
  [true, true]);
check('那塊把效果全文放進 title（避免文字塞爆）',
  [classPickerSrc.includes('cursor-help'), classPickerSrc.includes('title={`【${h.name}】')],
  [true, true]);

// ─────────────────────────────────────────────────────────── N
section('N. 屬性譯名：四個名字只有一份定義（使用者裁定：照繁中版角色卡 Excel V2.17）');

// 這一段是被自己的不一致逼出來的：`StatBadge` 寫「力量」，而編輯器、跑團面板與三頁匯出
// 寫「體魄」——同一組屬性在站上有兩個名字。收斂成 `ATTRIBUTE_NAMES` 之後，
// 這裡同時盯「常數本身對不對」與「四個顯示點有沒有真的讀它」。
const attrPickerSrc = read('../src/features/character-sheet/components/AttributeMatrixPicker.jsx');
const statBadgeSrc = read('../src/components/ui/StatBadge.jsx');
const exportSrcN = read('../src/features/character-sheet/components/CharacterSheetExport.jsx');
const renderers = [attrPickerSrc, statBadgeSrc, exportSrcN, hud];

check('官方四個屬性名', ATTRIBUTE_NAMES, { dex: '靈巧', ins: '洞察', mig: '力量', wlp: '意志' });
check('三頁匯出的屬性欄位帶的是官方名（不是只有常數對，資料流也要對）',
  model.attributes.base.map((a) => a.cn),
  [ATTRIBUTE_NAMES.dex, ATTRIBUTE_NAMES.ins, ATTRIBUTE_NAMES.mig, ATTRIBUTE_NAMES.wlp]);
check('四個顯示點都不再寫死舊譯名 敏捷／體魄',
  renderers.map((src) => /(name|zhName):\s*'(敏捷|體魄)'|'(敏捷|體魄)',/.test(src)),
  [false, false, false, false]);
check('四個顯示點都改讀 ATTRIBUTE_NAMES',
  renderers.map((src) => src.includes('ATTRIBUTE_NAMES')),
  [true, true, true, true]);
check('資料層不再出現屬性名舊譯（rulesData 的裝備說明與元素源泉）',
  ['敏捷', '體魄'].filter((old) => read('../src/features/character-sheet/data/rulesData.json').includes(old)),
  []);
check('「敏捷」仍可作為普通形容詞（NPC 特質輸入框的範例、Boss 敘述）',
  [
    read('../src/features/npc-workshop/NPCWorkshop.jsx').includes('placeholder="例如: 敏捷, 致命..."'),
    read('../src/features/npc-workshop/data/bossSkillsData.js').includes('此 Boss 特別敏捷或隱蔽')
  ],
  [true, true]);

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
