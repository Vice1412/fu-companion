/**
 * 階段 1 功能測試：`⚡` 語意哨兵（U+26A1）→ 結構化 `isOffensive` 欄位
 *
 * 執行方式：
 *   npm run test:sentinel
 *
 * 本檔為唯一事實來源；`scratch/` 內的舊 bundle 為歷史產物，已不再使用。
 * 測試需先經 esbuild 打包（見 package.json 的 test:sentinel script），
 * 因為源碼使用 JSX／無擴展名匯入，node 無法直接載入。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  SPELLS_DATA,
  normalizeSpellName,
  isOffensiveSpell,
  hasLegacyOffensiveSentinel
} from '../src/features/npc-workshop/data/spells.js';
import { migrateSpellSentinel } from '../src/features/npc-workshop/utils/npcEngine.js';

const SENTINEL = '\u26A1';
const HERE = dirname(fileURLToPath(import.meta.url));

let pass = 0;
let fail = 0;
const lines = [];

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass += 1;
  else fail += 1;
  lines.push(
    ok
      ? `  PASS  ${label}`
      : `  FAIL  ${label}\n          expected: ${JSON.stringify(expected)}\n          actual:   ${JSON.stringify(actual)}`
  );
}

function section(title) {
  lines.push(`\n=== ${title} ===`);
}

// ---------------------------------------------------------------- A
section('A. normalizeSpellName');
check('去除哨兵', normalizeSpellName('吐息' + SENTINEL), '吐息');
check('去除 Lv 標註', normalizeSpellName('雷霆(Lv30+)'), '雷霆');
check('哨兵與 Lv 並存', normalizeSpellName('雷霆' + SENTINEL + '(Lv30+)'), '雷霆');
check('null 安全', normalizeSpellName(null), '');
check('undefined 安全', normalizeSpellName(undefined), '');
check('無需處理時原樣', normalizeSpellName('驅散'), '驅散');

// ---------------------------------------------------------------- B
section('B. hasLegacyOffensiveSentinel');
check('舊格式字串 = true', hasLegacyOffensiveSentinel('吐息' + SENTINEL), true);
check('新格式字串 = false', hasLegacyOffensiveSentinel('吐息'), false);
check('非字串 = false', hasLegacyOffensiveSentinel(null), false);
check('數字 = false', hasLegacyOffensiveSentinel(123), false);

// ---------------------------------------------------------------- C
section('C. isOffensiveSpell（新舊格式雙軌）');
check('新格式 攻擊性', isOffensiveSpell('吐息'), true);
check('新格式 攻擊性 + Lv', isOffensiveSpell('雷霆(Lv30+)'), true);
check('舊格式 攻擊性（哨兵）', isOffensiveSpell('吐息' + SENTINEL), true);
check('舊格式 攻擊性（哨兵 + Lv）', isOffensiveSpell('雷霆' + SENTINEL + '(Lv30+)'), true);
check('非攻擊性', isOffensiveSpell('驅散'), false);
check('非攻擊性（治療）', isOffensiveSpell('舔舐傷口'), false);
check('空字串', isOffensiveSpell(''), false);
check('undefined', isOffensiveSpell(undefined), false);
check('未知咒語', isOffensiveSpell('不存在的咒語'), false);

// ---------------------------------------------------------------- D
section('D. SPELLS_DATA 資料層完整性');
const keys = Object.keys(SPELLS_DATA);
const offensive = keys.filter((k) => SPELLS_DATA[k].isOffensive === true);
check('攻擊性咒語共 22 個', offensive.length, 22);
check('總咒語數 39', keys.length, 39);
check('鍵值不含哨兵', keys.some((k) => k.includes(SENTINEL)), false);
check('每個咒語皆有 effect', keys.every((k) => typeof SPELLS_DATA[k].effect === 'string'), true);
check('「吐息」為攻擊性', SPELLS_DATA['吐息']?.isOffensive, true);
check('「驅散」非攻擊性', SPELLS_DATA['驅散']?.isOffensive, undefined);
check('「舔舐傷口」非攻擊性', SPELLS_DATA['舔舐傷口']?.isOffensive, undefined);
check('「毀盪」維持非攻擊性（行為不變）', SPELLS_DATA['毀盪']?.isOffensive, undefined);

// ---------------------------------------------------------------- E
section('E. migrateSpellSentinel');
const legacy = {
  id: 'npc_legacy',
  skills: [
    { id: 's1', category: 'spell', originalName: '吐息' + SENTINEL, spellData: { mp: '5' } },
    { id: 's2', category: 'spell', customName: '雷霆' + SENTINEL + '(Lv30+)', spellData: { isOffensive: true } },
    { id: 's3', category: 'spell', originalName: '驅散', spellData: {} },
    {
      id: 's4',
      category: 'spell',
      spellConfig: { capacity: 2, options: ['吐息' + SENTINEL, '舔舐傷口', '毒藥' + SENTINEL] },
      selectedSpells: [{ name: '吐息' + SENTINEL, selections: { spell_breath_type: '火' } }]
    }
  ],
  speciesConfig: {
    spell: '吐息' + SENTINEL,
    spellSelections: { ['吐息' + SENTINEL]: { spell_breath_type: '火' } },
    selectedBenefits: ['b2']
  }
};

const m = migrateSpellSentinel(legacy);

check('不就地修改原物件', legacy.skills[0].originalName.includes(SENTINEL), true);
check('skill1 名稱去哨兵', m.skills[0].originalName, '吐息');
check('skill1 補上 isOffensive', m.skills[0].spellData.isOffensive, true);
check('skill1 保留原 spellData 欄位', m.skills[0].spellData.mp, '5');
check('skill2 customName 去哨兵（保留 Lv）', m.skills[1].customName, '雷霆(Lv30+)');
check('skill2 既有 isOffensive 保留', m.skills[1].spellData.isOffensive, true);
check('skill3 非攻擊性不受污染', m.skills[2].spellData.isOffensive, undefined);
check('skill3 名稱不變', m.skills[2].originalName, '驅散');
check('spellConfig.options 去哨兵', m.skills[3].spellConfig.options, ['吐息', '舔舐傷口', '毒藥']);
check('spellConfig.capacity 保留', m.skills[3].spellConfig.capacity, 2);
check('selectedSpells 名稱去哨兵', m.skills[3].selectedSpells[0].name, '吐息');
check('selectedSpells selections 保留', m.skills[3].selectedSpells[0].selections, { spell_breath_type: '火' });
check('speciesConfig.spell 去哨兵', m.speciesConfig.spell, '吐息');
check('spellSelections 鍵去哨兵', Object.keys(m.speciesConfig.spellSelections), ['吐息']);
check('spellSelections 值保留', m.speciesConfig.spellSelections['吐息'], { spell_breath_type: '火' });
check('speciesConfig 其他欄位不動', m.speciesConfig.selectedBenefits, ['b2']);

// ---------------------------------------------------------------- F
section('F. 端到端一致性（遷移後判定不變）');
check('遷移後 skill1 仍判為攻擊性', isOffensiveSpell(m.skills[0].originalName), true);
check('遷移後 skill2 仍判為攻擊性', isOffensiveSpell(m.skills[1].customName), true);
check('遷移後 skill3 仍判為非攻擊性', isOffensiveSpell(m.skills[2].originalName), false);
check('遷移後查表命中', !!SPELLS_DATA[m.skills[0].originalName], true);
check('遷移後查表取得正確 MP', SPELLS_DATA[m.skills[0].originalName].mp, 5);

// ---------------------------------------------------------------- G
section('G. 邊界與防禦');
check('migrate(null) 安全', migrateSpellSentinel(null), null);
check('migrate(undefined) 安全', migrateSpellSentinel(undefined), undefined);
check('migrate({}) 安全', migrateSpellSentinel({}), {});
check('migrate 無 skills 時安全', migrateSpellSentinel({ id: 'x' }).id, 'x');
check('skills 含 null 元素時安全', migrateSpellSentinel({ skills: [null] }).skills, [null]);
check('spellSelections 為 null 時安全', migrateSpellSentinel({ speciesConfig: { spellSelections: null } }).speciesConfig.spellSelections, null);

// ---------------------------------------------------------------- H
// 回歸護欄：判定路徑（資料層／引擎／文字解析器）不得再出現哨兵「字面量」。
// 依 GEMINI.md 規則一軌道 3，此三檔一律以跳脫序列 '\u26A1' 表示。
// 顯示層（NPCWorkshop.jsx 的 Toast／匯出字串）不在此限，見 AGENTS.md §3.1。
section('H. 原始碼零哨兵字面量（判定路徑）');
const JUDGEMENT_FILES = [
  'src/features/npc-workshop/data/spells.js',
  'src/features/npc-workshop/utils/npcEngine.js',
  'src/features/character-sheet/utils/skillFormulaEvaluator.jsx'
];
JUDGEMENT_FILES.forEach((rel) => {
  const abs = resolve(HERE, '..', rel);
  const src = readFileSync(abs, 'utf8');
  check(`${rel} 無哨兵字面量`, src.includes(SENTINEL), false);
  check(`${rel} 以跳脫序列表示`, src.includes('\\u26A1'), true);
});

// ---------------------------------------------------------------- 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(52)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(52)}`);
process.exit(fail > 0 ? 1 : 0);
