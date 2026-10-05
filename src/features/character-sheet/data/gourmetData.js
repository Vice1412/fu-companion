/**
 * 美食家（Gourmet）—— 食材、口味與食譜書
 *
 * ## 機制本質（為什麼需要專屬 UI）
 *
 * 美食家是「**程序化生成**」的職業：食譜書上 15 格效果，是在戰役過程中一格格骰出來的，
 * 而且**每格一旦決定就永久固定**。玩家若不記錄，整組技能等於無法使用——
 * 這是 `docs/skill-coverage.md` 分類中的 **T3（動態狀態）**，且是 T3 裡最複雜的一個。
 *
 * ## 資料來源（依 `GEMINI.md` 規則二：CHM 管譯名，原書管機制）
 *
 * - **機制與數值** ← 官方英文原書 Natural Fantasy Atlas **p.149–153**（逐條核對）
 * - **中文譯名** ← CHM 漢化《美食家》（`resources/角色卡/.../02_职业_美食家_Gourmet.md`）
 *
 * **CHM 是測試版，機制已過時——本檔一律採原書，不採 CHM 的數字**：
 *
 * | 項目 | CHM（測試版） | 官方正式版（本檔採用） |
 * |---|---|---|
 * | 骰 | d10 | **d12** |
 * | 效果總數 | 10 | **12** |
 * | 恢復 HP/MP | 30（L20→40、L40→50） | **40（L30→50）** |
 * | 傷害 | 20（L20→30、L40→40） | **20（L30→30）** |
 * | 無法執行動作 | 合併為 1 個效果 | **拆成 7／8／9 三個獨立效果** |
 * | 舞刀弄叉條件 | 「除非武器是匕首」 | **「組合不超過 2 份食材」** |
 * | 加點愛 | 花 10 MP → 額外 SL 位 | **花至多 SL×10 MP → 每 10 MP 額外 1 位** |
 *
 * > 這是「CHM 只管譯名、不管機制」這條規則**第一次真正派上用場**——
 * > 若照 CHM 實作，整個食譜書會少 2 格、骰子種類錯、三個效果被錯誤合併。
 */

/** 五種口味（CHM 定譯：苦味／鹹味／酸味／甜味／鮮味）。 */
export const TASTES = ['苦味', '鹹味', '酸味', '甜味', '鮮味'];

/** 取得食材時骰 d6 決定口味（原書 p.150）。 */
export const TASTE_ROLL = {
  1: '苦味',
  2: '鹹味',
  3: '酸味',
  4: '甜味',
  5: '鮮味',
  6: null // 6 = 由你決定
};

/** 上限：`10 + (SL × 5)` 份（原書 p.149）。 */
export const ingredientCapacity = (sl) => 10 + Math.max(0, Math.floor(Number(sl) || 0)) * 5;

/** 食材價格（原書 p.150）：隨機口味 10z、自選口味 20z。 */
export const INGREDIENT_PRICE = { random: 10, chosen: 20 };

/** 口味在官方表中的順序（苦→鹹→酸→甜→鮮），用於排序而非 JS 字串碼位。 */
const tasteIndex = (t) => {
  const i = TASTES.indexOf(t);
  return i < 0 ? 999 : i;
};

/**
 * 組合口味時用的鍵。
 *
 * **刻意不用 `Array.sort()` 預設的字串排序**——那會依 UTF-16 碼位排
 * （甜 < 苦 < 酸 < 鮮 < 鹹），既反直覺，顯示時也與官方口味表順序不符。
 * 本函式一律**依官方口味順序**（苦→鹹→酸→甜→鮮）排列，故 `苦味+鹹味` 而非 `鹹味+苦味`。
 */
export const tastePairKey = (a, b) =>
  tasteIndex(a) <= tasteIndex(b) ? `${a}+${b}` : `${b}+${a}`;

/** 由鍵還原成 `[口味A, 口味B]`（已依官方順序）。 */
export const parseTastePairKey = (key) => key.split('+');

/** 比較兩個組合鍵的官方順序，供排序使用。 */
export const comparePairKeys = (a, b) => {
  const [a1, a2] = parseTastePairKey(a);
  const [b1, b2] = parseTastePairKey(b);
  return tasteIndex(a1) * 10 + tasteIndex(a2) - (tasteIndex(b1) * 10 + tasteIndex(b2));
};

/**
 * 全部 15 種口味組合（5 種口味可重複取 2 的組合數 = 5×6/2 = 15）。
 * 原書 p.153：「When completed, your cookbook sheet will feature a total of 15 effects,
 * one for each possible pair of tastes.」
 */
export const ALL_TASTE_PAIRS = (() => {
  const out = [];
  for (let i = 0; i < TASTES.length; i += 1) {
    for (let j = i; j < TASTES.length; j += 1) {
      out.push(tastePairKey(TASTES[i], TASTES[j]));
    }
  }
  return out;
})();

/**
 * 由 2～3 份食材的口味算出**實際會產生的口味組合**。
 *
 * 原書 p.153 例：組合「鹹、苦、苦」→ 只有 2 種組合（苦+苦、苦+鹹），不是 3 種，
 * 因為兩個苦味之間只算一組。
 *
 * @param {string[]} tastes 2～3 個口味
 * @returns {string[]} 去重後的組合鍵（2 份→1、3 份全異→3、3 份有重複→2、3 份全同→1）
 */
export const pairsFromTastes = (tastes) => {
  const list = (tastes || []).filter((t) => TASTES.includes(t));
  const set = new Set();
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      set.add(tastePairKey(list[i], list[j]));
    }
  }
  return [...set].sort(comparePairKeys);
};

/** 傷害／抗性可選的屬性（原書 d12 表中 5／6／10／12 的選項）。 */
export const DAMAGE_CHOICES = ['風', '電', '土', '火', '冰', '毒'];

/** 可提升骰階的四維屬性（原書 d12 表效果 11）。 */
export const ATTRIBUTE_CHOICES = ['DEX', 'INS', 'MIG', 'WLP'];

/**
 * 狀態選項。**沿用 App 既有詞彙**（`sourcebookConfig.js` 的 `STATUS_AFFLICTIONS`），
 * 以確保美食效果與狀態面板指向同一組詞。
 *
 * 已知差異：CHM 用「緩慢」，本專案全站用「緩速」。此為既有不一致，待使用者裁定。
 */
export const STATUS_CHOICES = ['眩暈', '憤怒', '中毒', '動搖', '緩速', '虛弱'];

/**
 * d12 效果表（原書 p.152，逐條核對）。
 *
 * `choice` 為需要玩家選擇的維度；`build` 產生顯示文字。
 * `conflictOnly`：原書 p.153「Effects 5 to 12 can only be applied during conflict scenes.」
 */
export const DELICACY_EFFECTS = {
  1: {
    roll: 1,
    label: '解除狀態',
    choice: { label: '狀態', options: STATUS_CHOICES },
    build: (c) => `從【${c}】狀態恢復`
  },
  2: {
    roll: 2,
    label: '施加狀態',
    choice: { label: '狀態', options: ['眩暈', '動搖', '緩速', '虛弱'] },
    build: (c) => `陷入【${c}】狀態`
  },
  3: {
    roll: 3,
    label: '恢復 HP',
    choice: null,
    build: (_c, lv) => `恢復 ${lv >= 30 ? 50 : 40} 點 HP`
  },
  4: {
    roll: 4,
    label: '恢復 MP',
    choice: null,
    build: (_c, lv) => `恢復 ${lv >= 30 ? 50 : 40} 點 MP`
  },
  5: {
    roll: 5,
    label: '造成傷害',
    choice: { label: '屬性', options: DAMAGE_CHOICES },
    build: (c, lv) => `受到 ${lv >= 30 ? 30 : 20} 點【${c}】屬性傷害`
  },
  6: {
    roll: 6,
    label: '增傷',
    choice: { label: '屬性', options: DAMAGE_CHOICES },
    build: (c) => `到你的下回合結束前，所有【${c}】屬性傷害來源額外造成 5 點傷害`
  },
  7: {
    roll: 7,
    label: '封鎖防禦',
    choice: null,
    build: () => '下回合無法執行【防禦】動作'
  },
  8: {
    roll: 8,
    label: '封鎖咒語',
    choice: null,
    build: () => '下回合無法執行【咒語】動作'
  },
  9: {
    roll: 9,
    label: '封鎖技能',
    choice: null,
    build: () => '下回合無法執行【技能】動作'
  },
  10: {
    roll: 10,
    label: '獲得抗性',
    choice: { label: '屬性', options: DAMAGE_CHOICES },
    build: (c) => `獲得【${c}】屬性傷害抗性直到你的下回合結束`
  },
  11: {
    roll: 11,
    label: '提升屬性骰',
    choice: { label: '屬性', options: ATTRIBUTE_CHOICES },
    build: (c) => `【${c}】視為高 1 階骰（上限 d12）直到你的下回合結束`
  },
  12: {
    roll: 12,
    label: '轉換傷害類型',
    choice: { label: '屬性', options: DAMAGE_CHOICES },
    build: (c) => `下回合造成的所有傷害轉為【${c}】屬性且無法改變`
  }
};

/** 該效果是否僅能在衝突場景生效（原書：效果 5～12）。 */
export const isConflictOnly = (roll) => Number(roll) >= 5;

/**
 * 產生一個效果條目的顯示文字。
 * @param {number} roll 1～12
 * @param {string|null} choice 該效果所選的維度值
 * @param {number} level 角色等級（影響 3／4／5 的數值）
 * @returns {string}
 */
export const formatEffect = (roll, choice, level = 1) => {
  const def = DELICACY_EFFECTS[roll];
  if (!def) return '';
  return def.build(choice || (def.choice ? def.choice.options[0] : null), level);
};

/**
 * 效果的「身分簽章」——用於原書的**不得重複**規則。
 * 原書 p.153：「No two combinations of tastes in your cookbook sheet can have identical effects.」
 * 同一骰值但選擇不同維度（例如效果 5 選火 vs 選冰）視為**不同**效果。
 */
export const effectSignature = (roll, choice) => `${roll}:${choice || ''}`;

/**
 * 檢查食譜書是否有兩個組合產生相同效果。
 * @param {Object} cookbook `{ '苦味+鹹味': { roll, choice }, ... }`
 * @returns {string[][]} 每組重複的組合鍵（空陣列代表合規）
 */
export const findDuplicateEffects = (cookbook) => {
  const bySig = {};
  for (const [key, entry] of Object.entries(cookbook || {})) {
    if (!entry || !entry.roll) continue;
    const sig = effectSignature(entry.roll, entry.choice);
    (bySig[sig] = bySig[sig] || []).push(key);
  }
  return Object.values(bySig).filter((keys) => keys.length > 1);
};

/** 已決定的組合數（食譜書進度）。 */
export const cookbookProgress = (cookbook) =>
  ALL_TASTE_PAIRS.filter((k) => cookbook?.[k]?.roll).length;

/**
 * 為一份食材產生可讀名稱。原書要求玩家自行命名，故未命名時給一個中性預設。
 */
export const defaultIngredientName = (taste, index) => `${taste}食材 ${index + 1}`;
