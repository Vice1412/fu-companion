/**
 * 修補匠造物專案（Projects）成本公式測試。
 *
 * 執行：npm run test:projects
 *
 * 這組測試的存在理由（見 AGENTS.md §4 E）：造物成本是**純函式 + 官方明確公式**，
 * 算錯會直接讓玩家多付或少付 zenit，而在此之前完全沒有測試保護。
 *
 * 全部期望值皆取自 **Core Rulebook printed p.134–139**，
 * 尤其是 p.138–139 的官方「SAMPLE PROJECTS」表——**不得修改**。
 */
import {
  PROJECT_POTENCY_OPTIONS,
  PROJECT_AREA_OPTIONS,
  PROJECT_USES_OPTIONS,
  OFFICIAL_SAMPLE_PROJECTS,
  calcProjectCost
} from '../src/features/character-sheet/data/tinkererProjects.js';
import { RULE_CODEX } from '../src/features/character-sheet/data/ruleCodexData.js';

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

const opt = (arr, key) => arr.find((x) => x.key === key);
const cost = (potency, area, uses, hasFlaw = false, visionarySL = 0) => {
  const p = opt(PROJECT_POTENCY_OPTIONS, potency);
  const a = opt(PROJECT_AREA_OPTIONS, area);
  const u = opt(PROJECT_USES_OPTIONS, uses);
  if (!p || !a || !u) throw new Error(`未知選項 ${potency}/${area}/${uses}`);
  return calcProjectCost({ potencyCost: p.cost, areaMult: a.mult, usesMult: u.mult, hasFlaw, visionarySL });
};

// ─────────────────────────────────────────────────────────── A
section('A. 三張表的數值（Core printed p.135）');
check('效力基礎價', PROJECT_POTENCY_OPTIONS.map((p) => p.cost), [100, 200, 400, 800]);
check('範圍倍率', PROJECT_AREA_OPTIONS.map((a) => a.mult), [1, 2, 3, 4]);
check('使用次數倍率', PROJECT_USES_OPTIONS.map((u) => u.mult), [1, 5]);
check('中等以上需特殊材料', PROJECT_POTENCY_OPTIONS.map((p) => p.needsSpecial), [false, true, true, true]);

// ─────────────────────────────────────────────────────────── B
section('B. 原書官方範例逐筆核對（Core printed p.138–139）');
for (const s of OFFICIAL_SAMPLE_PROJECTS) {
  const r = cost(s.potency, s.area, s.uses, s.hasFlaw);
  check(`${s.name}：成本 ${s.cost}z`, r.discountedCost, s.cost);
  check(`${s.name}：進度 ${s.progress}`, r.requiredProgress, s.progress);
}

// ─────────────────────────────────────────────────────────── C
section('C. 進度換算是無條件捨去（floor），非進位');
// 官方 Magitech Suit = 兩個中效力專案（各 1000z），其中一個加缺陷：
//   1000 + (1000 − 25%) = 1750z；官方標示 Progress Required: 17
const suitArmor = cost('中', '個體', '永久', false);      // 1000z -> 10
const suitCannon = cost('中', '個體', '永久', true);      // 750z  -> 7（floor(7.5)）
check('Magitech Suit 裝甲 1000z', suitArmor.discountedCost, 1000);
check('Magitech Suit 裝甲 10 格', suitArmor.requiredProgress, 10);
check('Magitech Suit 熱能炮 750z', suitCannon.discountedCost, 750);
check('Magitech Suit 熱能炮 7 格（floor 7.5，非 8）', suitCannon.requiredProgress, 7);
check('Magitech Suit 合計成本 1750z', suitArmor.discountedCost + suitCannon.discountedCost, 1750);
check('Magitech Suit 合計 17 格（官方值）', suitArmor.requiredProgress + suitCannon.requiredProgress, 17);

// ─────────────────────────────────────────────────────────── D
section('D. 進度下限：最少 1 格（minimum one progress required）');
const tiny = cost('小', '個體', '消耗品', true); // 100 - 25 = 75z
check('75z 成本', tiny.discountedCost, 75);
check('75z -> 最少 1 格', tiny.requiredProgress, 1);

// ─────────────────────────────────────────────────────────── E
section('E. 高瞻遠矚：只代付 zenit，不改變進度需求');
const v0 = cost('大', '個體', '永久', false, 0);
const v5 = cost('大', '個體', '永久', false, 5);
check('SL0 應付 2000z', v0.finalPay, 2000);
check('SL5 應付 1500z（代付 500）', v5.finalPay, 1500);
check('SL5 進度需求不變（仍 20）', v5.requiredProgress, 20);
check('SL5 每日額外進度 = 5', v5.extraProgressPerDay, 5);
const vBig = cost('小', '個體', '消耗品', false, 5);
check('代付超過成本時應付為 0（不為負）', vBig.finalPay, 0);

// ─────────────────────────────────────────────────────────── F
section('F. 缺陷減免為 25%');
const noFlaw = cost('大', '大型', '永久', false);
const withFlaw = cost('大', '大型', '永久', true);
check('無缺陷 400×3×5', noFlaw.rawCost, 6000);
check('無缺陷減免 0', noFlaw.flawDiscount, 0);
check('有缺陷減免 1500', withFlaw.flawDiscount, 1500);
check('有缺陷折後 4500', withFlaw.discountedCost, 4500);

// ─────────────────────────────────────────────────────────── G
section('G. 規則速查表的顯示資料必須與公式一致（回歸：曾誤植效力等級）');
const codexSamples = (RULE_CODEX.projects?.samples) || [];
check('速查表範例數 = 9', codexSamples.length, 9);

const POTENCY_ZH = { 小效力: '小', 中效力: '中', 大效力: '大', 強效力: '強' };
let parsed = 0;
for (const s of codexSamples) {
  // 形如：大效力 (400z) × 小型 (×2) × 消耗品 (×1)
  const m = s.formula.match(/^(\S+?)\s*\((\d+)z\)\s*×\s*(\S+?)\s*\(×(\d+)\)\s*×\s*(\S+?)\s*\(×(\d+)\)$/);
  if (!m) {
    lines.push(`  SKIP  ${s.name}（複合專案，無單一公式：${s.formula}）`);
    continue;
  }
  parsed += 1;
  const [, potZh, potZ, , areaM, , usesM] = m;
  const expectCost = Number(potZ) * Number(areaM) * Number(usesM);
  const hasFlaw = s.flaw.includes('有');
  const expectFinal = hasFlaw ? expectCost - Math.floor(expectCost * 0.25) : expectCost;
  const statedCost = Number(String(s.cost).replace(/[^\d]/g, ''));
  const statedProgress = Number(String(s.progress).replace(/[^\d]/g, ''));

  check(`${s.name}：成本 ${s.cost}`, statedCost, expectFinal);
  check(`${s.name}：進度 ${s.progress}`, statedProgress, Math.max(1, Math.floor(expectFinal / 100)));
  // 效力中文名必須與公式裡的 z 值相符
  check(`${s.name}：效力名「${potZh}」對應 ${potZ}z`, POTENCY_ZH[potZh] && opt(PROJECT_POTENCY_OPTIONS, POTENCY_ZH[potZh]).cost, Number(potZ));
}
check('可解析的單一公式範例數 = 8（1 筆為複合專案）', parsed, 8);

// ─────────────────────────────────────────────────────────── H
section('H. 邊界：所有可能組合皆為 100 的倍數（缺陷前），故 25% 必為整數');
const combos = [];
const raws = new Set();
for (const p of PROJECT_POTENCY_OPTIONS)
  for (const a of PROJECT_AREA_OPTIONS)
    for (const u of PROJECT_USES_OPTIONS) {
      combos.push(p.cost * a.mult * u.mult);
      raws.add(p.cost * a.mult * u.mult);
    }
check('組合數 = 4 × 4 × 2 = 32', combos.length, 32);
check('所有原始成本皆為 100 的倍數', combos.every((r) => r % 100 === 0), true);
// 32 種組合會因數值碰撞而收斂成 20 個唯一成本（例：100×4 與 200×2 同為 400）
check('唯一成本值 = 20', raws.size, 20);

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
