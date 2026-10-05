/**
 * 卡牌大師（Ace of Cards）—— 牌組、手牌、棄牌堆與組合結算
 *
 * ## 機制本質
 *
 * 這是全專案最複雜的職業：它需要**一整套牌組狀態**（牌庫／手牌／棄牌堆／先鋒卡），
 * 而且「組合效果」是**精確比對**的（4 張同值才算 Jackpot，5 張同值不算）。
 * 用文字描述完全無法在跑團時使用——這是 `docs/skill-coverage.md` 所說「不做就完全玩不了」的職業。
 *
 * ## 資料來源（依 `GEMINI.md` 規則二：CHM 管譯名，原書管機制）
 *
 * 官方特典合輯 **p.7–p.11**（逐條核對）。注意：該書**頁碼偏移為 0**（印刷 = PDF）。
 *
 * ## 牌組規則（p.8）
 *
 * - **恰好 30 張**：2 張鬼牌 + 4 花色 × 7 張（數值 1–7）
 * - 每個花色對應一種傷害類型（風／土／火／冰），由玩家在建立角色時指定
 * - 衝突開始：洗 30 張 → 抽 5 張為起始手牌
 * - 牌庫不足時：盡量抽 → 把棄牌堆洗回牌庫 → 繼續抽
 * - 牌庫／手牌／棄牌堆**僅在衝突場景可用**；衝突結束全部洗回
 *
 * ## 組合結算規則（p.8）
 *
 * - **必須精確符合**：牌數與結構都要對（原書明例：5 張同值**不**符合 Jackpot）
 * - **鬼牌**由玩家指定其花色與數值（1–7）
 * - 同時符合多個效果時，**只能選一個**套用
 */

// ─────────────────────────────────────────────────────────
// 花色
// ─────────────────────────────────────────────────────────

/**
 * 四花色。`defaultType` 為原書 p.9 建議的對應：風(♦)、土(♣)、火(♥)、冰(♠)。
 *
 * `symbol` 是**對照實體撲克牌用的參考資料**，不是顯示字元——UI 一律用
 * Game-Icons 的 `GiSpades`／`GiHearts`／`GiDiamonds`／`GiClubs` 繪製
 * （`♠♥♦♣` 在部分平台會渲染成彩色 emoji，與規則一軌道 3 衝突）。
 */
export const SUITS = [
  { key: 'diamond', name: '方塊', symbol: '♦', defaultType: '風' },
  { key: 'club', name: '梅花', symbol: '♣', defaultType: '土' },
  { key: 'heart', name: '紅心', symbol: '♥', defaultType: '火' },
  { key: 'spade', name: '黑桃', symbol: '♠', defaultType: '冰' }
];

export const SUIT_KEYS = SUITS.map((s) => s.key);
export const suitByKey = (key) => SUITS.find((s) => s.key === key) || null;
export const suitName = (key) => suitByKey(key)?.name || '';

/** 牌組中每個花色的牌數（原書：每個花色 7 張，數值 1–7）。 */
export const CARDS_PER_SUIT = 7;
/** 鬼牌張數（原書：2 張）。 */
export const JOKER_COUNT = 2;
/** 牌組總張數（原書：恰好 30 張）。 */
export const DECK_SIZE = SUIT_KEYS.length * CARDS_PER_SUIT + JOKER_COUNT; // 30
/** 起始手牌張數（原書：衝突開始抽 5 張）。 */
export const STARTING_HAND = 5;
/** 一次最多結算幾張（原書 Magic Cards：to a maximum of 5 cards）。 */
export const MAX_SET_SIZE = 5;
/** 先鋒卡上限（原書 Card Vanguard：two or fewer vanguard cards in play）。 */
export const MAX_VANGUARD = 2;

/** 建立一副全新的 30 張牌組（未洗牌）。 */
export const createDeck = () => {
  const cards = [];
  for (const suit of SUIT_KEYS) {
    for (let v = 1; v <= CARDS_PER_SUIT; v += 1) {
      cards.push({ id: `${suit}_${v}`, suit, value: v, joker: false });
    }
  }
  for (let j = 1; j <= JOKER_COUNT; j += 1) {
    cards.push({ id: `joker_${j}`, suit: null, value: null, joker: true });
  }
  return cards;
};

/** 洗牌（Fisher–Yates）。回傳新陣列，不改動原陣列。 */
export const shuffle = (cards) => {
  const out = [...(cards || [])];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * 抽牌。牌庫不足時，把棄牌堆洗回牌庫再繼續（原書 p.8）。
 * @returns {{deck:Array, discard:Array, drawn:Array}}
 */
export const drawCards = (deck, discard, count) => {
  let d = [...(deck || [])];
  let dp = [...(discard || [])];
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    if (d.length === 0) {
      if (dp.length === 0) break; // 兩邊都空，抽不到
      d = shuffle(dp);
      dp = [];
    }
    drawn.push(d.shift());
  }
  return { deck: d, discard: dp, drawn };
};

/** 顯示用的牌面文字。 */
export const cardLabel = (card) => {
  if (!card) return '';
  if (card.joker) return '鬼牌';
  return `${suitName(card.suit)} ${card.value}`;
};

// ─────────────────────────────────────────────────────────
// 組合結算
// ─────────────────────────────────────────────────────────

/** 是否為連續數值（不含重複）。輸入為已展開鬼牌的具體牌。 */
const isConsecutive = (cards) => {
  const s = cards.map((c) => c.value).sort((a, b) => a - b);
  for (let i = 1; i < s.length; i += 1) {
    if (s[i] !== s[i - 1] + 1) return false;
  }
  return true;
};

/** 值 → 張數。 */
const countByValue = (cards) => {
  const m = {};
  for (const c of cards) m[c.value] = (m[c.value] || 0) + 1;
  return m;
};

/** 是否所有牌同花色。 */
const sameSuit = (cards) => cards.every((c) => c.suit === cards[0].suit);

/**
 * 展開鬼牌的所有可能指定（花色 × 數值）。
 * 原書 p.8：「When you resolve a set that includes jokers, you choose their suit and value (1 to 7).」
 * 故判定時必須問「是否存在一種指定方式讓它符合需求」。
 */
export const expandJokers = (cards) => {
  const jokerIdx = cards.map((c, i) => (c.joker ? i : -1)).filter((i) => i >= 0);
  if (jokerIdx.length === 0) return [cards];

  const assign = (base, idx, acc) => {
    if (idx >= jokerIdx.length) {
      acc.push(base);
      return;
    }
    for (const suit of SUIT_KEYS) {
      for (let v = 1; v <= CARDS_PER_SUIT; v += 1) {
        const next = base.slice();
        next[jokerIdx[idx]] = { ...next[jokerIdx[idx]], suit, value: v };
        assign(next, idx + 1, acc);
      }
    }
  };
  const out = [];
  assign([...cards], 0, out);
  return out;
};

/** 各效果的「結構判定」。全部以「展開鬼牌後的具體牌」為輸入。 */
const STRUCTURE = {
  /** 4 張同值，且都不是鬼牌（原書明示 none of which is a joker）。 */
  jackpot: (cards, raw) =>
    cards.length === 4 && raw.every((c) => !c.joker) && new Set(cards.map((c) => c.value)).size === 1,

  /** 4 張連續數值 + 同花色。 */
  magicFlush: (cards) => cards.length === 4 && isConsecutive(cards) && sameSuit(cards),

  /** 4 張連續數值（不限花色）。 */
  blindingFlush: (cards) => cards.length === 4 && isConsecutive(cards),

  /** 3 張同值 + 2 張同值（兩組數值不同——撲克 full house 的讀法）。 */
  fullStatus: (cards) => {
    if (cards.length !== 5) return false;
    const m = Object.values(countByValue(cards)).sort((a, b) => b - a);
    return m.length === 2 && m[0] === 3 && m[1] === 2;
  },

  /** 3 張同值。 */
  tripleSupport: (cards) => cards.length === 3 && new Set(cards.map((c) => c.value)).size === 1,

  /** 2 張同值 + 2 張同值（兩組數值不同——撲克 two pair 的讀法）。 */
  doubleTrouble: (cards) => {
    if (cards.length !== 4) return false;
    const m = Object.values(countByValue(cards)).sort((a, b) => b - a);
    return m.length === 2 && m[0] === 2 && m[1] === 2;
  },

  /** 2 張同值。 */
  magicPair: (cards) => cards.length === 2 && new Set(cards.map((c) => c.value)).size === 1,

  /** 【英雄技能】4 張同值（非鬼牌）+ 1 張鬼牌。 */
  forbiddenMonarch: (cards, raw) => {
    if (cards.length !== 5) return false;
    if (raw.filter((c) => c.joker).length !== 1) return false;
    // 以 raw 的索引判斷哪些位置原本是鬼牌，只看非鬼牌的值是否一致
    const nonJokerValues = cards.filter((_c, i) => !raw[i].joker).map((c) => c.value);
    return nonJokerValues.length === 4 && new Set(nonJokerValues).size === 1;
  }
};

/**
 * 效果定義。`damage` 為需要計算傷害者；`heroic` 表示需習得對應英雄技能才可用。
 */
export const SET_EFFECTS = [
  {
    id: 'jackpot',
    name: '滿貫',
    requirement: '4 張同值，且都不是鬼牌',
    cards: 4,
    heroic: null,
    describe: () => '任何已投降但仍在場上的玩家角色恢復意識；你與每個可見盟友恢復 777 點 HP 與 777 點 MP。'
  },
  {
    id: 'magicFlush',
    name: '魔法同花',
    requirement: '4 張連續數值且同花色',
    cards: 4,
    heroic: null,
    describe: (ctx) =>
      `對每個可見敵人造成 ${25 + ctx.total + ctx.levelBonus} 點${ctx.suitType}屬性傷害。`
  },
  {
    id: 'blindingFlush',
    name: '炫目同花',
    requirement: '4 張連續數值',
    cards: 4,
    heroic: null,
    describe: (ctx) =>
      `對每個可見敵人造成 ${15 + ctx.total + ctx.levelBonus} 點${ctx.blindType}屬性傷害。`
  },
  {
    id: 'fullStatus',
    name: '滿貫狀態',
    requirement: '3 張同值 + 2 張同值',
    cards: 5,
    heroic: null,
    describe: (ctx) =>
      ctx.highest % 2 === 0
        ? '選擇兩種狀態：你與每個可見盟友從這兩種狀態恢復。'
        : '選擇兩種狀態：每個可見敵人陷入這兩種狀態。'
  },
  {
    id: 'tripleSupport',
    name: '三重支援',
    requirement: '3 張同值',
    cards: 3,
    heroic: null,
    describe: (ctx) => `你與每個可見盟友恢復 ${ctx.total * 3} 點 HP。`
  },
  {
    id: 'doubleTrouble',
    name: '雙重麻煩',
    requirement: '2 張同值 + 2 張同值',
    cards: 4,
    heroic: null,
    describe: (ctx) =>
      `對最多兩個可見敵人各造成 ${10 + ctx.highest + ctx.levelBonus} 點傷害（類型從結算牌的花色中選一）。`
  },
  {
    id: 'magicPair',
    name: '魔法對子',
    requirement: '2 張同值',
    cards: 2,
    heroic: null,
    describe: () =>
      '用裝備的武器執行一次自由攻擊；若造成傷害，選一個花色，該攻擊的所有傷害轉為該花色對應的類型。'
  },
  {
    id: 'forbiddenMonarch',
    name: '禁忌君王',
    requirement: '4 張同值（非鬼牌）+ 1 張鬼牌',
    cards: 5,
    heroic: 'forbiddenRite',
    describe: (ctx) =>
      `對每個可見敵人造成 777 點${ctx.monarchType}屬性傷害。`
  }
];

/** 等級加成：炫目同花／雙重麻煩／魔法同花 在 L20+ 加 10、L40+ 加 20（原書 p.9）。 */
export const levelDamageBonus = (level) => {
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  if (lv >= 40) return 20;
  if (lv >= 20) return 10;
  return 0;
};

/**
 * 找出這組牌符合哪些效果。
 *
 * @param {Array} rawCards 玩家選出的牌（原樣，可能含鬼牌）
 * @param {number} level 角色等級
 * @param {{knownHeroicSkills?:string[]}} opts
 * @returns {Array} 符合的效果（含已算好的描述文字）。可能多於一個——原書要求玩家選一個套用。
 */
export const detectSets = (rawCards, level = 1, opts = {}) => {
  const cards = rawCards || [];
  if (cards.length < 2 || cards.length > MAX_SET_SIZE) return [];

  const known = opts.knownHeroicSkills || [];
  const assignments = expandJokers(cards);
  const bonus = levelDamageBonus(level);

  const found = [];
  for (const def of SET_EFFECTS) {
    if (def.heroic && !known.includes(def.heroic)) continue;
    const matcher = STRUCTURE[def.id];
    if (!matcher) continue;

    // 找出第一個成立的鬼牌指定方式（用於計算數值）
    let hit = null;
    for (const a of assignments) {
      if (matcher(a, cards)) {
        hit = a;
        break;
      }
    }
    if (!hit) continue;

    const total = hit.reduce((n, c) => n + (c.value || 0), 0);
    const highest = Math.max(...hit.map((c) => c.value || 0));
    const suitType = suitByKey(hit[0].suit)?.defaultType || '風';
    const ctx = {
      total,
      highest,
      levelBonus: bonus,
      suitType,
      blindType: highest % 2 === 0 ? '光' : '暗',
      monarchType: highest % 2 === 0 ? '光' : '暗'
    };
    found.push({
      id: def.id,
      name: def.name,
      requirement: def.requirement,
      describe: def.describe(ctx),
      total,
      highest,
      suits: [...new Set(hit.map((c) => c.suit))],
      types: [...new Set(hit.map((c) => suitByKey(c.suit)?.defaultType).filter(Boolean))]
    });
  }
  return found;
};

/** 這組牌是否構成合法的一組（至少符合一個效果）。 */
export const isValidSet = (cards, level = 1, opts = {}) => detectSets(cards, level, opts).length > 0;

/**
 * 【魔力套牌】這次最多能結算幾張。
 *
 * 原書 p.7：「spend up to (10 + (SL x 5)) MP (minimum 10) ...
 * discard and resolve 1 card from your hand for every 5 MP spent this way
 * (to a maximum of 5 cards)」
 *
 * 故 MP 上限 = 10 + SLx5，每 5 MP 換 1 張，且至少 10 MP（= 2 張）、最多 5 張。
 * SL1 -> 3 張、SL2 -> 4 張、SL3 以上 -> 5 張。
 */
export const maxSetSizeForSL = (sl) =>
  Math.min(MAX_SET_SIZE, 2 + Math.max(0, Math.floor(Number(sl) || 0)));

/** 結算 N 張所需花費的 MP（原書：每 5 MP 換 1 張）。 */
export const mpCostForSet = (cardCount) => Math.max(0, Math.floor(Number(cardCount) || 0)) * 5;

/** 這次結算的 MP 上限（原書：10 + SLx5）。 */
export const maxMpForSL = (sl) => 10 + Math.max(0, Math.floor(Number(sl) || 0)) * 5;
