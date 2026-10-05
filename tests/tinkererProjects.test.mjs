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
  calcProjectCost,
  calcDailyProgress,
  applyDailyProgress,
  helperHireCost,
  DEFAULT_DAILY_INPUT
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
section('G. 授權合規：速查表不得收錄具名範例作品與敘事範例');
// 官方範例作品的名稱與敘述屬 Fabula Ultima Third-Party Tabletop License §1 的保留材料。
// 其數值本身已由 B 區段的 OFFICIAL_SAMPLE_PROJECTS 驗證，速查表無需（也不應）重複收錄。
check('projects 不含具名範例作品', RULE_CODEX.projects?.samples, undefined);
check('rituals 不含敘事範例', RULE_CODEX.rituals?.examples, undefined);

section('G2. 速查表的效力表必須與常數一致（回歸：曾誤植效力等級）');
const codexPotency = RULE_CODEX.projects?.potencyTable || [];
check('效力表 4 級', codexPotency.length, 4);
for (const p of codexPotency) {
  const c = opt(PROJECT_POTENCY_OPTIONS, p.tier);
  check(`效力「${p.tier}」成本 = ${c.cost}z`,
    Number(String(p.cost).replace(/[^\d]/g, '')), c.cost);
}

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

// ─────────────────────────────────────────────────────────── I
section('I. 每日推進公式（Core printed p.134 / p.211 / p.137）');
// 最常見情境：修補匠獨自作業，無高瞻遠矚 -> 1(參與) + 1(修補匠額外) = 2
check('獨自作業、無特技 = 2 格', calcDailyProgress({ workers: 1, tinkererWorkers: 1 }).total, 2);
// 加上高瞻遠矚 SL3 -> 1 + 1 + 3 = 5
check('獨自作業 + 高瞻遠矚 SL3 = 5 格', calcDailyProgress({ workers: 1, tinkererWorkers: 1, visionarySL: 3 }).total, 5);
// 三人參與，其中一位是修補匠 -> 3 + 1 = 4
check('三人參與、一位修補匠 = 4 格', calcDailyProgress({ workers: 3, tinkererWorkers: 1 }).total, 4);
// 三人參與，全部都有修補匠等級 -> 3 + 3 = 6
check('三人全為修補匠 = 6 格', calcDailyProgress({ workers: 3, tinkererWorkers: 3 }).total, 6);
// 幫手：每位 +1
check('兩人參與 + 2 幫手 = 4 格', calcDailyProgress({ workers: 2, tinkererWorkers: 0, helpers: 2 }).total, 4);

section('I-2. 每日推進的語意細節（不得想當然）');
check('修補匠加成是「額外 +1」而非取代（1 人 = 2 格）',
  calcDailyProgress({ workers: 1, tinkererWorkers: 1 }).total, 2);
check('修補匠人數不得超過參與人數（夾住）',
  calcDailyProgress({ workers: 1, tinkererWorkers: 5 }).tinkererBonus, 1);
check('無人參與時高瞻遠矚不生效',
  calcDailyProgress({ workers: 0, tinkererWorkers: 0, visionarySL: 4 }).total, 0);
check('無人參與但仍有幫手時，只算幫手',
  calcDailyProgress({ workers: 0, tinkererWorkers: 0, visionarySL: 4, helpers: 2 }).total, 2);
check('負數輸入視為 0', calcDailyProgress({ workers: -3, tinkererWorkers: -1, helpers: -5 }).total, 0);
check('無參數時：1 名參與者、0 名修補匠 -> 1 格', calcDailyProgress().total, 1);
check('DEFAULT_DAILY_INPUT 為最常見情境（修補匠獨自作業）', DEFAULT_DAILY_INPUT, { workers: 1, tinkererWorkers: 1, helpers: 0 });
check('DEFAULT_DAILY_INPUT 代入後 = 2 格', calcDailyProgress(DEFAULT_DAILY_INPUT).total, 2);

// ─────────────────────────────────────────────────────────── J
section('J. 推進一天後的專案狀態');
const pj = { totalClock: 10, filledClock: 4, daysWorked: 2 };
const d2 = calcDailyProgress({ workers: 1, tinkererWorkers: 1 }); // 2 格
const r1 = applyDailyProgress(pj, d2);
check('4 + 2 = 6 格', r1.filledClock, 6);
check('尚未完工', r1.completed, false);
check('無超額', r1.overflow, 0);
check('工作日數 +1', r1.daysWorked, 3);

const d9 = calcDailyProgress({ workers: 5, tinkererWorkers: 4 }); // 5+4 = 9 格
const r2 = applyDailyProgress(pj, d9);
check('4 + 9 = 13 夾在 10 格', r2.filledClock, 10);
check('已完工', r2.completed, true);
check('超額 3 格（原書：一至兩小時內完成）', r2.overflow, 3);

const done = { totalClock: 10, filledClock: 10, daysWorked: 5 };
const r3 = applyDailyProgress(done, d2);
check('已完工專案再推進仍停在 10', r3.filledClock, 10);
check('已完工專案不重複計算超額', r3.overflow, 0);

check('缺少 daysWorked 時視為 0 再 +1', applyDailyProgress({ totalClock: 5, filledClock: 0 }, d2).daysWorked, 1);
check('totalClock 缺失時至少 1 格', applyDailyProgress({ filledClock: 0 }, d2).filledClock, 1);

// ─────────────────────────────────────────────────────────── K
section('K. 僱用幫手要價（Core printed p.137：總成本的一半）');
check('6000z -> 3000z', helperHireCost(6000), 3000);
check('1750z -> 875z', helperHireCost(1750), 875);
check('75z -> 37z（向下取整）', helperHireCost(75), 37);
check('0z -> 0z', helperHireCost(0), 0);

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
