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

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
