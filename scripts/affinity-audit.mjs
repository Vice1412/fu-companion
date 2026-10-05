/**
 * 九相屬性標記稽核工具。
 *
 * 用途：編輯規則文本（尤其是速查手冊）之後，看一遍「哪些字會被畫上屬性圖示」，
 *       免得又出現「魔能發電模組」那種把「發電」讀成閃電的誤標。
 *
 * 用法：
 *   npm run audit:affinity              # 摘要 ＋ 只列情境判定（列舉／繫詞／編號／傷害尾綴）
 *   npm run audit:affinity -- --all     # 連明確後綴（火屬性…）也一起列
 *   npm run audit:affinity -- 電        # 只列內容含指定關鍵字的字串
 *
 * 判定規則本身在 `src/components/ui/affinityText.js`；
 * 回歸關卡在 `tests/affinityText.test.mjs`（`npm run test:affinity`）。
 */
import rulesData from '../src/features/character-sheet/data/rulesData.json';
import { RULE_CODEX } from '../src/features/character-sheet/data/ruleCodexData.js';
import * as ruleCodexExpansion from '../src/features/character-sheet/data/ruleCodexExpansion.js';
import * as expansionPresets from '../src/features/character-sheet/data/expansionPresets.js';
import * as skillSuboptions from '../src/features/character-sheet/data/skillSuboptionsData.js';
import * as sourcebookConfig from '../src/features/character-sheet/data/sourcebookConfig.js';
import * as gourmetData from '../src/features/character-sheet/data/gourmetData.js';
import * as starterPresets from '../src/features/character-sheet/data/starterPresets.js';
import * as aceOfCards from '../src/features/character-sheet/data/aceOfCardsData.js';
import * as pilotVehicle from '../src/features/character-sheet/data/pilotVehicleData.js';
import * as tinkererProjects from '../src/features/character-sheet/data/tinkererProjects.js';
import * as classResources from '../src/features/character-sheet/data/classResources.js';
import * as wayfarerCompanion from '../src/features/character-sheet/data/wayfarerCompanionData.js';
import * as properNouns from '../src/utils/properNouns.js';
import { findAffinityTokens } from '../src/components/ui/affinityText.js';

const argv = process.argv.slice(2);
const showAll = argv.includes('--all');
const keyword = argv.find((a) => !a.startsWith('--')) || null;

const SOURCES = {
  'rulesData.json': rulesData,
  'ruleCodexData.js': RULE_CODEX,
  'ruleCodexExpansion.js': ruleCodexExpansion,
  'expansionPresets.js': expansionPresets,
  'skillSuboptionsData.js': skillSuboptions,
  'sourcebookConfig.js': sourcebookConfig,
  'gourmetData.js': gourmetData,
  'starterPresets.js': starterPresets,
  'aceOfCardsData.js': aceOfCards,
  'pilotVehicleData.js': pilotVehicle,
  'tinkererProjects.js': tinkererProjects,
  'classResources.js': classResources,
  'wayfarerCompanionData.js': wayfarerCompanion,
  'properNouns.js': properNouns,
};

const EXPLICIT_KINDS = new Set(['bracket', 'suffix', 'standalone']);

const walk = (node, keyPath, out) => {
  if (typeof node === 'string') return void out.push({ keyPath, text: node });
  if (Array.isArray(node)) return void node.forEach((v, i) => walk(v, `${keyPath}[${i}]`, out));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, keyPath ? `${keyPath}.${k}` : k, out);
  }
};

const rows = [];
const byKind = {};
const byBase = {};
let fields = 0;
let total = 0;

for (const [label, mod] of Object.entries(SOURCES)) {
  const out = [];
  walk(mod, label, out);
  fields += out.length;
  for (const { keyPath, text } of out) {
    if (keyword && !text.includes(keyword)) continue;
    for (const t of findAffinityTokens(text)) {
      total += 1;
      byKind[t.kind] = (byKind[t.kind] || 0) + 1;
      byBase[t.base] = (byBase[t.base] || 0) + 1;
      rows.push({ keyPath, kind: t.kind, raw: t.raw, context: text.slice(Math.max(0, t.index - 14), t.index + t.raw.length + 14) });
    }
  }
}

console.log(`\n=== 九相屬性標記稽核 ===`);
console.log(`  掃描 ${Object.keys(SOURCES).length} 個資料模組／${fields} 個字串欄位${keyword ? `（關鍵字「${keyword}」）` : ''}`);
console.log(`  命中 ${total} 處`);
console.log(`  判定種類：${Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('　')}`);
console.log(`  屬性分佈：${Object.entries(byBase).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('　')}`);

const shown = showAll ? rows : rows.filter((r) => !EXPLICIT_KINDS.has(r.kind));
console.log(`\n--- ${showAll ? '全部標記' : '情境判定（列舉／繫詞／編號／傷害尾綴）'}：${shown.length} 處 ---`);
for (const r of shown) {
  console.log(`  [${r.kind}] ${r.keyPath}\n      「${r.raw}」　…${r.context}…`);
}
console.log('');
