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
 * - **恰好 30 張**：2 張小丑牌 + 4 花色 × 7 張（數值 1–7）
 * - 每個花色對應一種傷害類型（風／土／火／冰），由玩家在建立角色時指定
 * - 衝突開始：洗 30 張 → 抽 5 張為起始手牌
 * - 牌庫不足時：盡量抽 → 把棄牌堆洗回牌庫 → 繼續抽
 * - 牌庫／手牌／棄牌堆**僅在衝突場景可用**；衝突結束全部洗回
 *
 * ## 組合結算規則（p.8）
 *
 * - **必須精確符合**：牌數與結構都要對（原書明例：5 張同值**不**符合 Jackpot）
 * - **小丑牌**由玩家指定其花色與數值（1–7）
 * - 同時符合多個效果時，**只能選一個**套用
 *
 * ## 技能互動（p.7）
 *
 * - **魔法卡組**：花 MP 從手牌打出並結算一組牌；結算後補抽等量（含「無對應效果」的組合）
 * - **牌運亨通**：結算的組合含小丑牌／7 → +SL 傷害；含小丑牌／1 → 減傷 SL；三者皆無 → 回復 SL×2 HP
 * - **再調度**：你的回合內以攻擊命中敵人後，棄至多 `SL + 1` 張並補抽等量
 * - **陷阱卡**：敵人結算動作後，棄至多 `SL + 1` 張「小丑牌或花色對應該動作」的牌並補抽，
 *   然後可免費執行咒語動作（總 MP ≤ `SL × 5`，MP 仍自付），直到下個回合開始前只能一次
 *
 * > 英雄技能（黑與白／先鋒卡／決鬥大師／禁忌儀式）尚未實作——它們需要精通職業（Lv 10）
 * > 才能習得，屬後期內容。
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

/** 四種傷害類型（原書 p.8：air, earth, fire, ice）。 */
export const DAMAGE_TYPES = ['風', '土', '火', '冰'];

/** 原書 p.9 建議的花色對應（撲克牌玩家最直覺的一組）。 */
export const DEFAULT_SUIT_TYPES = Object.fromEntries(SUITS.map((s) => [s.key, s.defaultType]));

/**
 * 花色對應是否合法。
 *
 * 原書 p.8：「associate each suit to a **different** damage type」——四個花色必須是
 * 風／土／火／冰的**排列**，不得重複。重複會讓兩個花色打出同一種傷害，
 * 玩家在跑團時會少一種傷害類型可用。
 */
export const isValidSuitAssignment = (suitTypes) => {
  const t = suitTypes || {};
  const used = SUIT_KEYS.map((k) => t[k] ?? suitByKey(k)?.defaultType);
  if (used.some((x) => !DAMAGE_TYPES.includes(x))) return false;
  return new Set(used).size === SUIT_KEYS.length;
};

/** 牌組中每個花色的牌數（原書：每個花色 7 張，數值 1–7）。 */
export const CARDS_PER_SUIT = 7;
/** 小丑牌張數（原書：2 張）。 */
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
  if (card.joker) return '小丑牌';
  return `${suitName(card.suit)} ${card.value}`;
};

// ─────────────────────────────────────────────────────────
// 組合結算
// ─────────────────────────────────────────────────────────

/** 是否為連續數值（不含重複）。輸入為已展開小丑牌的具體牌。 */
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
 * 展開小丑牌的所有可能指定（花色 × 數值）。
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

/**
 * 依玩家的指定，把小丑牌填成具體牌（未指定的維持原樣）。
 *
 * 原書 p.8：「When you resolve a set that includes jokers, **you** choose their suit and value
 * (1 to 7)」——指定權在玩家手上，而且**花色會決定傷害類型**（魔法同花／雙重麻煩），
 * 所以不能只讓程式自己挑第一個成立的組合。
 *
 * @param {Array} cards
 * @param {Object} assignment `{ [cardId]: { suit, value } }`
 */
export const applyJokerAssignment = (cards, assignment) =>
  (cards || []).map((c) => {
    if (!c?.joker) return c;
    const a = assignment?.[c.id];
    return a ? { ...c, suit: a.suit, value: a.value } : c;
  });

/** 這組牌中的小丑牌是否都已由玩家指定花色與數值。 */
export const isFullyAssigned = (cards, assignment) =>
  (cards || []).every((c) => !c.joker || !!assignment?.[c.id]);

/**
 * 建議一組小丑牌指定：找出第一個能成立的效果，回傳它的指定方式。
 *
 * 用於「套用建議」按鈕——玩家若不想自己算，可以一鍵採用程式找到的第一組可行指定，
 * 但**畫面上仍會顯示指定的內容**，玩家看得到自己送出了什麼（而不是黑箱自動判定）。
 *
 * @returns {Object|null} `{ [cardId]: { suit, value } }`；找不到可行組合時為 null
 */
export const suggestJokerAssignment = (cards, level = 1, opts = {}) => {
  const list = cards || [];
  if (!list.some((c) => c.joker)) return null;
  const known = opts.knownHeroicSkills || [];

  for (const def of SET_EFFECTS) {
    if (def.heroic && !known.includes(def.heroic)) continue;
    const matcher = STRUCTURE[def.id];
    if (!matcher) continue;
    for (const a of expandJokers(list)) {
      if (!matcher(a, list)) continue;
      const out = {};
      a.forEach((c, i) => {
        if (list[i].joker) out[list[i].id] = { suit: c.suit, value: c.value };
      });
      return out;
    }
  }
  return null;
};

/** 各效果的「結構判定」。全部以「展開小丑牌後的具體牌」為輸入。 */
const STRUCTURE = {
  /** 4 張同值，且都不是小丑牌（原書明示 none of which is a joker）。 */
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

  /** 【英雄技能】4 張同值（非小丑牌）+ 1 張小丑牌。 */
  forbiddenMonarch: (cards, raw) => {
    if (cards.length !== 5) return false;
    if (raw.filter((c) => c.joker).length !== 1) return false;
    // 以 raw 的索引判斷哪些位置原本是小丑牌，只看非小丑牌的值是否一致
    const nonJokerValues = cards.filter((_c, i) => !raw[i].joker).map((c) => c.value);
    return nonJokerValues.length === 4 && new Set(nonJokerValues).size === 1;
  }
};

/**
 * 效果定義。
 *
 * - `damage` 為需要計算傷害者；`heroic` 表示需習得對應英雄技能才可用。
 * - `reference` 是**與牌值無關的靜態說明**，供牌桌的「組合效果速查」直接列出——
 *   `describe` 會把當次牌值算進句子，不適合當速查表。
 */
export const SET_EFFECTS = [
  {
    id: 'jackpot',
    name: '四條頭獎',
    requirement: '4 張同值，且都不是小丑牌',
    reference: '已投降但仍在場上的玩家角色恢復意識（不取消其投降效果）；然後你與每個可見盟友恢復 777 點 HP 與 777 點 MP。',
    cards: 4,
    heroic: null,
    describe: () => '任何已投降但仍在場上的玩家角色恢復意識；你與每個可見盟友恢復 777 點 HP 與 777 點 MP。'
  },
  {
    id: 'magicFlush',
    name: '魔法同花順',
    requirement: '4 張連續數值且同花色',
    reference: '對每個可見敵人造成【25 + 結算牌值總和】點傷害，類型為結算牌花色對應的傷害類型。',
    cards: 4,
    heroic: null,
    describe: (ctx) =>
      `對每個可見敵人造成 ${25 + ctx.total + ctx.levelBonus} 點${ctx.suitType}屬性傷害。`
  },
  {
    id: 'blindingFlush',
    name: '炫目順子',
    requirement: '4 張連續數值',
    reference: '對每個可見敵人造成【15 + 結算牌值總和】點傷害；結算牌最高值為偶數則為光屬性，奇數則為暗屬性。',
    cards: 4,
    heroic: null,
    describe: (ctx) =>
      `對每個可見敵人造成 ${15 + ctx.total + ctx.levelBonus} 點${ctx.blindType}屬性傷害。`
  },
  {
    id: 'fullStatus',
    name: '狀態滿貫',
    requirement: '3 張同值 + 2 張同值',
    reference: '從眩暈、動搖、緩慢、虛弱中選擇兩種：結算牌最高值為偶數則你與每個可見盟友從這兩種狀態恢復，奇數則每個可見敵人陷入這兩種狀態。',
    cards: 5,
    heroic: null,
    describe: (ctx) =>
      ctx.highest % 2 === 0
        ? '選擇兩種狀態（眩暈、動搖、緩慢、虛弱）：你與每個可見盟友從這兩種狀態恢復。'
        : '選擇兩種狀態（眩暈、動搖、緩慢、虛弱）：每個可見敵人陷入這兩種狀態。'
  },
  {
    id: 'tripleSupport',
    name: '三重支援',
    requirement: '3 張同值',
    reference: '你與每個可見盟友恢復【結算牌值總和 × 3】點 HP。',
    cards: 3,
    heroic: null,
    describe: (ctx) => `你與每個可見盟友恢復 ${ctx.total * 3} 點 HP。`
  },
  {
    id: 'doubleTrouble',
    name: '雙重麻煩',
    requirement: '2 張同值 + 2 張同值',
    reference: '對至多兩個不同的可見敵人各造成【10 + 結算牌最高值】點傷害，類型從結算牌的花色對應類型中選一。',
    cards: 4,
    heroic: null,
    describe: (ctx) =>
      `對最多兩個可見敵人各造成 ${10 + ctx.highest + ctx.levelBonus} 點傷害（類型從結算牌的花色中選一）。`
  },
  {
    id: 'magicPair',
    name: '魔法對子',
    requirement: '2 張同值',
    reference: '以裝備的一把武器執行一次自由攻擊；若造成傷害，從結算牌的花色中選一，該攻擊的所有傷害轉為其對應類型。',
    cards: 2,
    heroic: null,
    describe: () =>
      '用裝備的武器執行一次自由攻擊；若造成傷害，選一個花色，該攻擊的所有傷害轉為該花色對應的類型。'
  },
  {
    id: 'forbiddenMonarch',
    name: '禁忌帝王',
    requirement: '4 張同值（非小丑牌）+ 1 張小丑牌',
    reference: '對每個可見敵人造成 777 點傷害；4 張同值牌的共同值為偶數則為光屬性，奇數則為暗屬性。',
    cards: 5,
    heroic: 'forbiddenRite',
    describe: (ctx) =>
      `對每個可見敵人造成 777 點${ctx.monarchType}屬性傷害。`
  }
];

/** 依 id 取效果定義。 */
export const effectById = (id) => SET_EFFECTS.find((e) => e.id === id) || null;

/** 等級加成：炫目順子／雙重麻煩／魔法同花順 在 L20+ 加 10、L40+ 加 20（原書 p.9）。 */
export const levelDamageBonus = (level) => {
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  if (lv >= 40) return 20;
  if (lv >= 20) return 10;
  return 0;
};

/**
 * 找出這組牌符合哪些效果。
 *
 * @param {Array} rawCards 玩家選出的牌（原樣，可能含小丑牌）
 * @param {number} level 角色等級
 * @param {{knownHeroicSkills?:string[], jokerAssignment?:Object}} opts
 *   `jokerAssignment` 是玩家為小丑牌指定的花色與數值（`{ [cardId]: { suit, value } }`）。
 *   **全部指定完**才用它判定；否則退回「窮舉所有指定、取第一個成立者」的相容行為
 *   （此時畫面上應提示「自動判定」，讓玩家知道這不是他自己選的）。
 * @returns {Array} 符合的效果（含已算好的描述文字）。可能多於一個——原書要求玩家選一個套用。
 */
export const detectSets = (rawCards, level = 1, opts = {}) => {
  const cards = rawCards || [];
  if (cards.length < 2 || cards.length > MAX_SET_SIZE) return [];

  const known = opts.knownHeroicSkills || [];
  const assigned = applyJokerAssignment(cards, opts.jokerAssignment);
  const assignments = isFullyAssigned(cards, opts.jokerAssignment) ? [assigned] : expandJokers(cards);
  const bonus = levelDamageBonus(level);

  const found = [];
  for (const def of SET_EFFECTS) {
    if (def.heroic && !known.includes(def.heroic)) continue;
    const matcher = STRUCTURE[def.id];
    if (!matcher) continue;

    // 找出第一個成立的小丑牌指定方式（用於計算數值）
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
 * 【魔法卡組】這次最多能結算幾張。
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

// ─────────────────────────────────────────────────────────
// 牌運亨通（High or Low，原書 p.7）
// ─────────────────────────────────────────────────────────

/**
 * 結算一組牌後，【牌運亨通】產生的三種回合狀態。
 *
 * 原書：「if it includes a joker and/or a 7, you deal (SL) extra damage until the start of
 * your next turn; if it includes a joker and/or a 1, all damage you suffer is reduced by (SL)
 * until the start of your next turn (before Affinities); if it doesn't include any joker, 1,
 * or 7, you recover (SL × 2) Hit Points.」
 *
 * 注意三條**不是互斥**：一組牌可以同時含 1 與 7（例如狀態滿貫的 3 張 1 + 2 張 7），
 * 此時「+SL 傷害」與「減傷 SL」會同時成立，只有「回復」要求三者皆無。
 *
 * @returns {{extraDamage:number, damageReduction:number, heal:number}}
 */
export const highOrLowState = (setCards, sl) => {
  const s = Math.max(0, Math.floor(Number(sl) || 0));
  const cards = setCards || [];
  if (s <= 0 || cards.length === 0) return { extraDamage: 0, damageReduction: 0, heal: 0 };

  const hasJoker = cards.some((c) => c?.joker);
  const hasSeven = cards.some((c) => c?.value === 7);
  const hasOne = cards.some((c) => c?.value === 1);
  const nothingSpecial = !hasJoker && !hasSeven && !hasOne;

  return {
    extraDamage: hasJoker || hasSeven ? s : 0,
    damageReduction: hasJoker || hasOne ? s : 0,
    heal: nothingSpecial ? s * 2 : 0
  };
};

/** 這組狀態是否有任何內容（三個都是 0 就等於沒有狀態可顯示）。 */
export const hasHighOrLowState = (state) =>
  !!state && (state.extraDamage > 0 || state.damageReduction > 0);

// ─────────────────────────────────────────────────────────
// 再調度（Mulligan，原書 p.7）
// ─────────────────────────────────────────────────────────

/** 一次最多能棄幾張（原書：up to (SL + 1) cards）。 */
export const mulliganLimit = (sl) => Math.max(0, Math.floor(Number(sl) || 0)) + 1;

/**
 * 驗證玩家自選的棄牌。
 *
 * 原書要求玩家**自己選**要棄哪幾張（舊版 UI 直接丟手牌最前面 N 張，等於代替玩家決定），
 * 故這裡把「選牌 → 驗證 → 切分」抽成純函式，UI 只負責畫。
 *
 * @returns {{ok:boolean, reason:string, cards:Array, rest:Array}}
 */
export const pickMulligan = (hand, ids, sl) => {
  const limit = mulliganLimit(sl);
  const list = hand || [];
  const wanted = new Set(ids || []);
  const cards = list.filter((c) => wanted.has(c.id));
  if (cards.length === 0) return { ok: false, reason: '請至少選 1 張要棄的牌', cards: [], rest: list };
  if (cards.length > limit) {
    return { ok: false, reason: `最多只能棄 ${limit} 張（SL ${sl} + 1）`, cards: [], rest: list };
  }
  return { ok: true, reason: '', cards, rest: list.filter((c) => !wanted.has(c.id)) };
};

// ─────────────────────────────────────────────────────────
// 陷阱卡（Trap Card，原書 p.7）
// ─────────────────────────────────────────────────────────

/**
 * 敵人動作 → 對應傷害類型。
 *
 * 原書：「whose suit corresponds to a damage type based on the enemy action:
 * ice (Attack), fire (Objective), earth (Skill), or air (Spell)」
 *
 * 這張對照表是陷阱卡最不容易記住的部分（不是「攻擊＝火」那種直覺配對），必須放進 UI。
 */
export const TRAP_ACTIONS = [
  { key: 'attack', name: '攻擊', type: '冰' },
  { key: 'objective', name: '目標', type: '火' },
  { key: 'skill', name: '技能', type: '土' },
  { key: 'spell', name: '咒語', type: '風' }
];

export const trapActionByKey = (key) => TRAP_ACTIONS.find((a) => a.key === key) || null;

/** 陷阱卡可棄的張數上限（原書：up to (SL + 1) cards）。 */
export const trapDiscardLimit = (sl) => Math.max(0, Math.floor(Number(sl) || 0)) + 1;

/** 免費施放的咒語 MP 上限（原書：total Mind Point cost equal to or lower than (SL × 5)）。 */
export const trapSpellMpCap = (sl) => Math.max(0, Math.floor(Number(sl) || 0)) * 5;

/** 這張牌是否符合陷阱卡的棄牌條件：是小丑牌，或花色對應的傷害類型等於該動作的類型。 */
export const isTrapEligible = (card, actionType, suitTypes) => {
  if (!card) return false;
  if (card.joker) return true;
  const assigned = (suitTypes || DEFAULT_SUIT_TYPES)[card.suit];
  return !!assigned && assigned === actionType;
};

/** 從手牌篩出符合陷阱卡條件的牌。 */
export const eligibleTrapCards = (hand, actionType, suitTypes) =>
  (hand || []).filter((c) => isTrapEligible(c, actionType, suitTypes));

/** 驗證陷阱卡的棄牌選擇（條件必須符合，且不超過 SL + 1 張）。 */
export const pickTrapDiscard = (hand, ids, sl, actionType, suitTypes) => {
  const limit = trapDiscardLimit(sl);
  const list = hand || [];
  const wanted = new Set(ids || []);
  const cards = list.filter((c) => wanted.has(c.id));
  if (cards.length === 0) return { ok: false, reason: '請至少選 1 張要棄的牌', cards: [], rest: list };
  if (cards.length > limit) {
    return { ok: false, reason: `最多只能棄 ${limit} 張（SL ${sl} + 1）`, cards: [], rest: list };
  }
  const bad = cards.find((c) => !isTrapEligible(c, actionType, suitTypes));
  if (bad) {
    return { ok: false, reason: `【${cardLabel(bad)}】不是小丑牌，花色也不對應此動作`, cards: [], rest: list };
  }
  return { ok: true, reason: '', cards, rest: list.filter((c) => !wanted.has(c.id)) };
};

/**
 * 咒語的 MP 消耗。
 *
 * 變動消耗（如「5 × T」）取其基準數字——與角色卡既有的施法邏輯
 * （`CharacterPlayHUD.handleCastSpell`）採同一種讀法，避免同一張咒語在兩處算出不同價。
 */
export const spellMpCost = (spell) => {
  const m = String(spell?.mp ?? '').match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
};

/** 陷阱卡能免費施放的咒語清單（總 MP ≤ SL × 5；MP 仍須自付）。 */
export const castableTrapSpells = (spells, sl) => {
  const cap = trapSpellMpCap(sl);
  return (spells || []).filter((s) => spellMpCost(s) <= cap);
};

// ─────────────────────────────────────────────────────────
// 結算的自身受益
// ─────────────────────────────────────────────────────────

/**
 * 結算某個效果時，「你本人」實際拿到的 HP／MP。
 *
 * 盟友與敵人分別由跑團桌與戰鬥追蹤器處理，這裡只回傳角色卡本身要改的數值——
 * 讓「四條頭獎 777 HP」「三重支援 總和×3 HP」不再只是文字。
 */
export const selfBenefitForEffect = (effectId, ctx = {}) => {
  const total = Math.max(0, Math.floor(Number(ctx.total) || 0));
  switch (effectId) {
    case 'jackpot':
      return { hp: 777, mp: 777 };
    case 'tripleSupport':
      return { hp: total * 3, mp: 0 };
    default:
      return { hp: 0, mp: 0 };
  }
};

/** 【狀態滿貫】可選的兩種狀態（原書：dazed, shaken, slow, weak）。 */
export const FULL_STATUS_CHOICES = ['dazed', 'shaken', 'slow', 'weak'];

/** 結算時寫入的每回合使用記錄（原書：再調度與陷阱卡都各自受限）。 */
/**
 * 每回合使用記錄。
 *
 * ※ 只有【陷阱卡】有每回合一次的限制——原書明文
 * `you cannot use this Skill again until the start of your next turn`。
 * 【再調度】原書**沒有**次數限制（`When you hit one or more enemies with an attack during your
 * turn, you may discard up to (SL + 1) cards.`），舊版把兩者混為一談而多鎖了 `mulligan`，
 * 已移除——欄位沒有讀取端就不該留著。
 */
export const emptyTurnUsage = () => ({ trap: false });

// ─────────────────────────────────────────────────────────
// 牌桌狀態
// ─────────────────────────────────────────────────────────

/**
 * 牌組是否處於「衝突中」。
 *
 * ## 為什麼要抽成純函式（2026-10-05 修正）
 *
 * 舊版 UI 用 `deck.length > 0 || hand.length > 0 || discard.length > 0` 當判準。
 * 但【衝突結束】的規則是「把全部 30 張洗回牌庫並收起來」——收起來之後**牌庫裡有 30 張**，
 * 於是舊判準永遠為 true：牌桌停在「手牌已空」的畫面，而「衝突開始」按鈕是 `!inConflict`
 * 才顯示，**再也回不去**。使用者回報的「點衝突結束之後就再也抽不了卡」就是這個。
 *
 * 正確的判準是 `active` 旗標（衝突開始時設 true、結束時設 false）；
 * 舊存檔沒有這個欄位，故以「牌庫不滿 30 張或手牌／棄牌堆非空」作為相容推斷
 * （衝突中手牌＋棄牌堆＋牌庫恆為 30，牌庫恰好 30 張只可能是收起來的狀態）。
 */
export const isDeckInConflict = (data) => {
  if (data?.active === true) return true;
  if (data?.active === false) return false;
  const deck = data?.deck || [];
  const hand = data?.hand || [];
  const discard = data?.discard || [];
  // 牌庫為 0 是「還沒建立牌組」（全新角色），不是「衝突中」——不能寫成 deck.length < DECK_SIZE。
  return hand.length > 0 || discard.length > 0 || (deck.length > 0 && deck.length < DECK_SIZE);
};

/** 衝突結束後的牌組狀態：30 張收起來、手牌與棄牌堆清空、回合狀態歸零。 */
export const idleDeckState = () => ({
  active: false,
  deck: createDeck(),
  hand: [],
  discard: [],
  vanguard: [],
  highOrLow: null,
  usedThisTurn: emptyTurnUsage()
});
