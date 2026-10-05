/**
 * 美食家（Gourmet）食材／食譜書測試。
 *
 * 執行：npm run test:gourmet
 *
 * 全部期望值取自官方英文原書 Natural Fantasy Atlas **p.149–153**（印刷頁碼）。
 * 特別針對 CHM 測試版與正式版的差異設了護欄（見檔尾 H 區段）。
 */
import {
  TASTES,
  TASTE_SHORT,
  TASTE_ROLL,
  ALL_TASTE_PAIRS,
  tastePairKey,
  parseTastePairKey,
  pairsFromTastes,
  ingredientCapacity,
  INGREDIENT_PRICE,
  DELICACY_EFFECTS,
  isConflictOnly,
  formatEffect,
  formatEffectSentence,
  unusedEffects,
  composeDelicacyText,
  effectSignature,
  findDuplicateEffects,
  cookbookProgress,
  DAMAGE_CHOICES,
  ATTRIBUTE_CHOICES,
  STATUS_CHOICES
} from '../src/features/character-sheet/data/gourmetData.js';

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

// ─────────────────────────────────────────────────────────── A
section('A. 口味：5 種，d6 對應（原書 p.150）');
check('口味共 5 種', TASTES.length, 5);
check('口味內容', TASTES, ['苦味', '鹹味', '酸味', '甜味', '鮮味']);
check('d6=1 苦味', TASTE_ROLL[1], '苦味');
check('d6=2 鹹味', TASTE_ROLL[2], '鹹味');
check('d6=3 酸味', TASTE_ROLL[3], '酸味');
check('d6=4 甜味', TASTE_ROLL[4], '甜味');
check('d6=5 鮮味', TASTE_ROLL[5], '鮮味');
check('d6=6 由玩家決定（不是口味）', TASTE_ROLL[6], null);

// ─────────────────────────────────────────────────────────── B
section('B. 食譜書 15 格（原書 p.153「a total of 15 effects」）');
check('組合總數 = 15', ALL_TASTE_PAIRS.length, 15);
check('無重複', new Set(ALL_TASTE_PAIRS).size, 15);
check('每格都是合法口味對', ALL_TASTE_PAIRS.every((k) => parseTastePairKey(k).every((t) => TASTES.includes(t))), true);
check('含同口味自配（苦+苦）', ALL_TASTE_PAIRS.includes('苦味+苦味'), true);
check('含鮮+鮮', ALL_TASTE_PAIRS.includes('鮮味+鮮味'), true);
// 5 種口味可重複取 2 的組合數 = 5*6/2 = 15
check('數學驗證 C(5+2-1,2) = 15', (5 * 6) / 2, 15);

// ─────────────────────────────────────────────────────────── C
section('C. 口味組合無序，且依官方口味順序排列（苦→鹹→酸→甜→鮮）');
check('鍵與順序無關', tastePairKey('苦味', '鹹味'), tastePairKey('鹹味', '苦味'));
check('鍵格式（苦在前）', tastePairKey('鹹味', '苦味'), '苦味+鹹味');
check('鍵格式（酸在鮮前）', tastePairKey('鮮味', '酸味'), '酸味+鮮味');
check('鍵格式（甜在鹹後）', tastePairKey('甜味', '鹹味'), '鹹味+甜味');
check('同口味', tastePairKey('苦味', '苦味'), '苦味+苦味');
check('還原', parseTastePairKey('苦味+鹹味'), ['苦味', '鹹味']);
check('全部 15 鍵皆為官方順序',
  ALL_TASTE_PAIRS.every((k) => { const [a, b] = parseTastePairKey(k); return TASTES.indexOf(a) <= TASTES.indexOf(b); }), true);
check('第一格是 苦味+苦味', ALL_TASTE_PAIRS[0], '苦味+苦味');
check('最後一格是 鮮味+鮮味', ALL_TASTE_PAIRS[14], '鮮味+鮮味');

// ─────────────────────────────────────────────────────────── D
section('D. pairsFromTastes：原書 p.153 的三個實例');
// 原書例：「組合三份食材，其中一份鹹味、兩份苦味 → 產生 2 種組合（苦+苦、苦+鹹）」
check('2 份 → 1 組', pairsFromTastes(['苦味', '鹹味']).length, 1);
check('2 份同口味 → 1 組', pairsFromTastes(['苦味', '苦味']).length, 1);
check('3 份（鹹+苦+苦）→ 2 組', pairsFromTastes(['鹹味', '苦味', '苦味']), ['苦味+苦味', '苦味+鹹味']);
check('3 份全異 → 3 組', pairsFromTastes(['苦味', '鹹味', '酸味']).length, 3);
check('3 份全異的內容（官方順序）', pairsFromTastes(['苦味', '鹹味', '酸味']), ['苦味+鹹味', '苦味+酸味', '鹹味+酸味']);
check('3 份全同 → 1 組', pairsFromTastes(['苦味', '苦味', '苦味']), ['苦味+苦味']);
check('4 份全異 → 6 組（大吃一頓英雄技能，原書 p.153）', pairsFromTastes(['苦味', '鹹味', '酸味', '甜味']).length, 6);
check('4 份全異的內容',
  pairsFromTastes(['苦味', '鹹味', '酸味', '甜味']),
  ['苦味+鹹味', '苦味+酸味', '苦味+甜味', '鹹味+酸味', '鹹味+甜味', '酸味+甜味']);
check('輸入順序不影響輸出', pairsFromTastes(['酸味', '苦味', '鹹味']), pairsFromTastes(['苦味', '鹹味', '酸味']));
check('空陣列 → 0 組', pairsFromTastes([]).length, 0);
check('非法口味被過濾', pairsFromTastes(['苦味', '不存在的口味']).length, 0);

// ─────────────────────────────────────────────────────────── E
section('E. 攜帶上限 10 + SL×5（原書 p.149）');
check('SL 1 → 15', ingredientCapacity(1), 15);
check('SL 2 → 20', ingredientCapacity(2), 20);
check('SL 3 → 25', ingredientCapacity(3), 25);
check('SL 5 → 35', ingredientCapacity(5), 35);
check('SL 0 → 10', ingredientCapacity(0), 10);
check('非數字 → 10', ingredientCapacity(undefined), 10);
check('負數 → 10', ingredientCapacity(-3), 10);

section('E2. 價格（原書 p.150）');
check('隨機口味 10z', INGREDIENT_PRICE.random, 10);
check('自選口味 20z', INGREDIENT_PRICE.chosen, 20);

// ─────────────────────────────────────────────────────────── F
section('F. d12 效果表：12 格（原書 p.152）');
check('效果共 12 種', Object.keys(DELICACY_EFFECTS).length, 12);
check('編號 1~12 連續', Object.keys(DELICACY_EFFECTS).map(Number).sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10,11,12]);
check('每格都有 roll 與 build', Object.values(DELICACY_EFFECTS).every((e) => e.roll && typeof e.build === 'function'), true);
check('每格都有標籤', Object.values(DELICACY_EFFECTS).every((e) => !!e.label), true);

section('F2. 需要選擇的效果（原書：5/6/10/11/12 選屬性；1/2 選狀態）');
const withChoice = Object.values(DELICACY_EFFECTS).filter((e) => e.choice).map((e) => e.roll).sort((a, b) => a - b);
check('需選擇的效果編號', withChoice, [1, 2, 5, 6, 10, 11, 12]);
check('效果 1 可選 6 種狀態', DELICACY_EFFECTS[1].choice.options, STATUS_CHOICES);
check('效果 2 只能選 4 種狀態（不含憤怒與中毒）', DELICACY_EFFECTS[2].choice.options, ['眩暈', '動搖', '緩慢', '虛弱']);
check('效果 5 可選 6 種屬性', DELICACY_EFFECTS[5].choice.options, DAMAGE_CHOICES);
check('效果 11 可選四維', DELICACY_EFFECTS[11].choice.options, ATTRIBUTE_CHOICES);
check('屬性選項 = 風電土火冰毒', DAMAGE_CHOICES, ['風', '電', '土', '火', '冰', '毒']);

section('F3. 不需選擇的效果');
const noChoice = Object.values(DELICACY_EFFECTS).filter((e) => !e.choice).map((e) => e.roll).sort((a, b) => a - b);
check('不需選擇的編號', noChoice, [3, 4, 7, 8, 9]);
// 7/8/9 在正式版是三個獨立效果（CHM 測試版合併成一個）
check('7 = 封鎖防禦', DELICACY_EFFECTS[7].build(), '下回合無法執行【防禦】動作');
check('8 = 封鎖咒語', DELICACY_EFFECTS[8].build(), '下回合無法執行【咒語】動作');
check('9 = 封鎖技能', DELICACY_EFFECTS[9].build(), '下回合無法執行【技能】動作');

// ─────────────────────────────────────────────────────────── G
section('G. 等級縮放（原書 p.152：L30 起 +10）');
check('效果3 L29 → 40', formatEffect(3, null, 29), '恢復 40 點 HP');
check('效果3 L30 → 50', formatEffect(3, null, 30), '恢復 50 點 HP');
check('效果3 L1  → 40', formatEffect(3, null, 1), '恢復 40 點 HP');
check('效果4 L29 → 40', formatEffect(4, null, 29), '恢復 40 點 MP');
check('效果4 L30 → 50', formatEffect(4, null, 30), '恢復 50 點 MP');
check('效果5 L29 → 20 傷', formatEffect(5, '火', 29), '受到 20 點【火】屬性傷害');
check('效果5 L30 → 30 傷', formatEffect(5, '火', 30), '受到 30 點【火】屬性傷害');
check('效果6 無等級縮放', formatEffect(6, '電', 40), DELICACY_EFFECTS[6].build('電', 40));

section('G2. 未選維度時取第一個選項（不產生空白）');
check('效果1 未選 → 眩暈', formatEffect(1, null, 1), '從【眩暈】狀態恢復');
check('效果2 未選 → 眩暈', formatEffect(2, null, 1), '陷入【眩暈】狀態');
check('效果5 未選 → 風', formatEffect(5, null, 1), '受到 20 點【風】屬性傷害');
check('效果11 未選 → DEX', formatEffect(11, null, 1), '【DEX】視為高 1 階骰（上限 d12）直到你的下回合結束');
check('無效編號 → 空字串', formatEffect(99, null, 1), '');

// ─────────────────────────────────────────────────────────── H
section('H. 衝突場景限制（原書 p.153：效果 5~12）');
check('效果1 非衝突限定', isConflictOnly(1), false);
check('效果4 非衝突限定', isConflictOnly(4), false);
check('效果5 為衝突限定', isConflictOnly(5), true);
check('效果12 為衝突限定', isConflictOnly(12), true);
check('全部效果中 8 個為衝突限定', [1,2,3,4,5,6,7,8,9,10,11,12].filter(isConflictOnly).length, 8);

// ─────────────────────────────────────────────────────────── I
section('I. 不得重複效果（原書 p.153）');
check('同骰同選擇 = 同簽章', effectSignature(5, '火'), effectSignature(5, '火'));
check('同骰不同選擇 = 不同簽章（合法）', effectSignature(5, '火') !== effectSignature(5, '冰'), true);
check('不同骰 = 不同簽章', effectSignature(5, '火') !== effectSignature(6, '火'), true);
check('無重複時回傳空', findDuplicateEffects({ '苦味+苦味': { roll: 3 }, '鹹味+鹹味': { roll: 4 } }), []);
check('偵測到重複',
  findDuplicateEffects({ '苦味+苦味': { roll: 3 }, '鹹味+鹹味': { roll: 3 } }).length, 1);
check('同骰不同選擇不算重複',
  findDuplicateEffects({ '苦味+苦味': { roll: 5, choice: '火' }, '鹹味+鹹味': { roll: 5, choice: '冰' } }), []);
check('三格同效果 → 一組含三鍵',
  findDuplicateEffects({ a: { roll: 3 }, b: { roll: 3 }, c: { roll: 3 } })[0].length, 3);
check('未決定的組合不列入重複檢查',
  findDuplicateEffects({ '苦味+苦味': { roll: 3 }, '鹹味+鹹味': {} }), []);

section('I2. 食譜書進度');
check('空食譜 → 0 / 15', cookbookProgress({}), 0);
check('已決定 1 格', cookbookProgress({ '苦味+苦味': { roll: 3 } }), 1);
check('未決定不計', cookbookProgress({ '苦味+苦味': {} }), 0);
check('全滿 → 15 / 15',
  cookbookProgress(Object.fromEntries(ALL_TASTE_PAIRS.map((k) => [k, { roll: 1 }]))), 15);

// ─────────────────────────────────────────────────────────── J
section('J. 護欄：不得回退到 CHM 測試版的過時機制');
// CHM 說 d10 / 10 效果；正式版是 d12 / 12 效果
check('效果數是 12，不是 CHM 的 10', Object.keys(DELICACY_EFFECTS).length, 12);
// CHM 說恢復 30（L20→40、L40→50）；正式版是 40（L30→50）
check('效果3 基準是 40，不是 CHM 的 30', formatEffect(3, null, 1), '恢復 40 點 HP');
check('效果3 在 L20 仍是 40（CHM 說 L20→40）', formatEffect(3, null, 20), '恢復 40 點 HP');
check('效果3 在 L40 仍是 50（不是 CHM 的 L40→50 以外的值）', formatEffect(3, null, 40), '恢復 50 點 HP');
// CHM 把防禦/咒語/技能合併為一個效果；正式版是三個
check('封鎖動作是三個獨立效果（7/8/9）',
  [7, 8, 9].every((r) => DELICACY_EFFECTS[r] && !DELICACY_EFFECTS[r].choice), true);

// ─────────────────────────────────────────────────────────── K
section('K. 口味單字縮寫（供 5×5 表格表頭）');
check('5 個口味都有縮寫', Object.keys(TASTE_SHORT).length, 5);
check('苦味 -> 苦', TASTE_SHORT['苦味'], '苦');
check('鹹味 -> 鹹', TASTE_SHORT['鹹味'], '鹹');
check('酸味 -> 酸', TASTE_SHORT['酸味'], '酸');
check('甜味 -> 甜', TASTE_SHORT['甜味'], '甜');
check('鮮味 -> 鮮', TASTE_SHORT['鮮味'], '鮮');
check('縮寫皆為單字', Object.values(TASTE_SHORT).every((s) => s.length === 1), true);
check('每個口味都有縮寫', TASTES.every((t) => !!TASTE_SHORT[t]), true);

// ─────────────────────────────────────────────────────────── L
section('L. 完整句子（烹飪時複製給 GM／隊友）');
check('每個效果都有 sentence', Object.values(DELICACY_EFFECTS).every((e) => typeof e.sentence === 'function'), true);
check('效果1 句子', formatEffectSentence(1, '眩暈', 1), '目標從【眩暈】狀態恢復。');
check('效果2 句子', formatEffectSentence(2, '動搖', 1), '目標陷入【動搖】狀態。');
check('效果3 句子', formatEffectSentence(3, null, 1), '目標恢復 40 點 HP。');
check('效果3 句子 L30', formatEffectSentence(3, null, 30), '目標恢復 50 點 HP。');
check('效果4 句子', formatEffectSentence(4, null, 1), '目標恢復 40 點 MP。');
check('效果5 句子', formatEffectSentence(5, '火', 1), '目標受到 20 點【火】屬性傷害。');
check('效果5 句子 L30', formatEffectSentence(5, '火', 30), '目標受到 30 點【火】屬性傷害。');
check('效果6 句子', formatEffectSentence(6, '電', 1),
  '直到你的下回合結束前，所有【電】屬性的傷害來源對目標額外造成 5 點傷害。');
check('效果7 句子（下回合句式）', formatEffectSentence(7, null, 1), '目標在其下個回合無法執行【防禦】動作。');
check('效果8 句子', formatEffectSentence(8, null, 1), '目標在其下個回合無法執行【咒語】動作。');
check('效果9 句子', formatEffectSentence(9, null, 1), '目標在其下個回合無法執行【技能】動作。');
check('效果10 句子', formatEffectSentence(10, '冰', 1), '目標獲得【冰】屬性傷害抗性，直到你的下回合結束。');
check('效果11 句子', formatEffectSentence(11, 'WLP', 1),
  '目標的【WLP】視為高 1 階骰（上限 d12），直到你的下回合結束。');
check('效果12 句子', formatEffectSentence(12, '毒', 1),
  '目標在其下個回合造成的所有傷害轉為【毒】屬性，且無法改變。');
check('未選維度時取第一個選項', formatEffectSentence(5, null, 1), '目標受到 20 點【風】屬性傷害。');
check('無效編號 -> 空字串', formatEffectSentence(99, null, 1), '');
check('每個句子都以句號結尾', Object.keys(DELICACY_EFFECTS).every((r) => formatEffectSentence(Number(r), null, 1).endsWith('。')), true);
// 不強制以「目標」開頭——效果 6 以時間子句開頭（「直到你的下回合結束前…」）讀起來更順，
// 但每個句子都必須明確指出作用對象是「目標」。
check('每個句子都提及「目標」', Object.keys(DELICACY_EFFECTS).every((r) => formatEffectSentence(Number(r), null, 1).includes('目標')), true);

// ─────────────────────────────────────────────────────────── M
section('M. 尚未骰出的效果（食譜書進度參考）');
check('空食譜 -> 12 個全未用', unusedEffects({}).length, 12);
check('空食譜的編號', unusedEffects({}).map((e) => e.roll), [1,2,3,4,5,6,7,8,9,10,11,12]);
check('用掉 3 號 -> 剩 11 個', unusedEffects({ a: { roll: 3 } }).length, 11);
check('3 號不在清單中', unusedEffects({ a: { roll: 3 } }).some((e) => e.roll === 3), false);
check('用掉 3 與 7 -> 剩 10 個', unusedEffects({ a: { roll: 3 }, b: { roll: 7 } }).length, 10);
check('未決定的組合不計入', unusedEffects({ a: {} }).length, 12);
check('同骰值重複使用只算一次', unusedEffects({ a: { roll: 5 }, b: { roll: 5 } }).length, 11);
check('全滿 -> 0 個', unusedEffects(Object.fromEntries(ALL_TASTE_PAIRS.map((k, i) => [k, { roll: (i % 12) + 1 }]))).length, 0);
check('每項都有 roll / label / text',
  unusedEffects({}).every((e) => typeof e.roll === 'number' && !!e.label && !!e.text), true);
check('text 與 formatEffect 一致', unusedEffects({})[2].text, formatEffect(3, null, 1));

// ─────────────────────────────────────────────────────────── N
section('N. 美食全文組裝（複製用）');
const cb = {
  '苦味+鹹味': { roll: 7, choice: null },
  '苦味+酸味': { roll: 3, choice: null }
};
const txt = composeDelicacyText('石化蜂蜜燉菇', ['苦味+鹹味', '苦味+酸味'], cb, 1);
check('含美食名', txt.includes('【石化蜂蜜燉菇】'), true);
check('含第一個效果', txt.includes('目標在其下個回合無法執行【防禦】動作。'), true);
check('含第二個效果', txt.includes('目標恢復 40 點 HP。'), true);
check('含組合標示', txt.includes('苦味＋鹹味'), true);
check('未命名時用預設名', composeDelicacyText('', ['苦味+鹹味'], cb, 1).startsWith('【美食】'), true);
check('只有空白也算未命名', composeDelicacyText('   ', ['苦味+鹹味'], cb, 1).startsWith('【美食】'), true);
check('沒有已決定效果時有提示', composeDelicacyText('測試', ['苦味+鹹味'], {}, 1).includes('尚未決定任何效果'), true);
check('衝突限定效果會加註', composeDelicacyText('測試', ['苦味+鹹味'], cb, 1).includes('僅能在衝突場景生效'), true);
check('非衝突限定時不加註', composeDelicacyText('測試', ['苦味+酸味'], cb, 1).includes('僅能在衝突場景生效'), false);
check('空組合清單不炸', composeDelicacyText('測試', [], cb, 1).includes('尚未決定任何效果'), true);
check('null 組合清單不炸', composeDelicacyText('測試', null, cb, 1).includes('尚未決定任何效果'), true);
// 兩個衝突限定效果（5 與 12）要提示只能各留一個
const cb2 = { '苦味+鹹味': { roll: 5, choice: '火' }, '苦味+酸味': { roll: 12, choice: '冰' } };
check('多個衝突限定效果會提示取捨',
  composeDelicacyText('測試', ['苦味+鹹味', '苦味+酸味'], cb2, 1).includes('只能保留一個'), true);

// ─────────────────────────────────────────────────────────── 結果
console.log(lines.join('\n'));
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 ${pass} / ${pass + fail}${fail > 0 ? `　失敗 ${fail}` : '　（全部通過）'}`);
console.log(`${'='.repeat(56)}`);
process.exit(fail > 0 ? 1 : 0);
