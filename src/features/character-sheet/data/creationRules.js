/**
 * 開卡規則 (Creation Rules)
 *
 * 為什麼要有這份資料：
 * 原書的創角規則原本**硬編碼在六個檔案裡**——
 * 起始 500z 在 `CharacterEditor`、起始等級 5 在 `characterEngine` 與 `CharacterSheet`、
 * 屬性總和 32 在 `characterEngine`、起始 5 級與 2~3 職業在 `ClassPickerModal` 與 `characterEngine`。
 *
 * 硬編碼的後果不只是「不好改」。它讓「GM 自訂開局」看起來像一個很遙遠的新功能——
 * 其實那不是新功能，而是「把這些常數變成一份資料」：
 * 一份 campaign 只要帶上這份 `creationRules`，玩家端的建卡與驗證就會照著那一團的規矩走。
 *
 * 這份資料同時是「創角」與「編輯」得以分流的基礎：有了規則物件，
 * 「這張卡還缺什麼、哪裡不合這一團的規矩」才是可以計算的，而不是散在各處的 if。
 *
 * 欄位來源（官方英文核心規則書 v1.1，印刷頁碼）：
 * - 起始等級 5 → p.157（Create Your Character 步驟 1）
 * - 起始四維總和 32 → p.155–156（屬性骰階配置）
 * - 起始 2~3 個職業 → p.158（起始 5 級需分配於 2~3 個職業）
 * - 起始裝備預算 500z → p.164（Purchase Starting Equipment）
 *
 * ※ 這份物件**只放真的有東西在讀的欄位**。原書特典的底力技（Zero Power）、
 * 自訂武器（Custom Weapon）等子系統本專案尚未收錄，因此不預先開旗標——
 * 沒有讀取端的設定欄位就是幻覺欄位（見 `docs/decisions.md` §U15 的教訓）。
 */
import { SOURCEBOOKS } from './sourcebookConfig';

/** 全部合法的開卡規則欄位（測試以此為欄位集護欄） */
export const CREATION_RULE_FIELDS = Object.freeze([
  'startingLevel',
  'startingZenit',
  'attributeTotal',
  'classCountMin',
  'classCountMax',
  'skillPointBudget',
  'allowedSourcebooks',
  'defaultSourcebooks',
  'requiredClasses',
  'allowQuirk'
]);

/** 全部手冊的鍵（上限的預設值） */
const ALL_SOURCEBOOK_KEYS = Object.freeze(Object.keys(SOURCEBOOKS));

/**
 * 金手指的名稱裡帶著來源標記（`（高奇）`／`（自奇）`／`（科奇）`）。
 *
 * 只有 55 筆中的 17 筆有標記（實測）。沒標記的 38 筆無法判定來源，
 * 因此**一律顯示**——寧可多顯示，也不要憑印象猜是哪本書（本專案吃過「憑印象編資料」的虧）。
 * 補齊來源需要逐筆核對原書，屬獨立的資料工程。
 */
const QUIRK_SOURCE_MARKS = Object.freeze({
  '高奇': 'highFantasy',
  '自奇': 'naturalFantasy',
  '科奇': 'technoFantasy'
});

/** 從金手指名稱取出它宣告的來源手冊鍵；沒標記則回 null（＝不設限） */
export const getQuirkSource = (name) => {
  const matched = /（(高奇|自奇|科奇)）/.exec(name || '');
  return matched ? QUIRK_SOURCE_MARKS[matched[1]] : null;
};

/**
 * 依「開放哪些手冊」過濾金手指。
 * `keepName` 用來保留目前已經選好的那一個——否則玩家關掉某本手冊時，
 * 他原本的金手指會從清單裡消失，但角色身上還掛著，看起來像壞掉。
 */
export const filterQuirksBySources = (quirks, allowedSourcebooks = ALL_SOURCEBOOK_KEYS, keepName = '') => {
  const allowed = new Set(allowedSourcebooks || []);
  return (quirks || []).filter((q) => {
    if (keepName && q.name === keepName) return true;
    const source = getQuirkSource(q.name);
    return source === null || allowed.has(source);
  });
};

const ALL_CLASS_NAMES = Object.freeze([
  ...new Set(
    Object.keys(SOURCEBOOKS).flatMap((key) => SOURCEBOOKS[key].classes || [])
  )
]);

/** 官方標準開卡規則（核心規則書） */
export const DEFAULT_CREATION_RULES = Object.freeze({
  /** 起始角色等級 */
  startingLevel: 5,
  /** 起始裝備預算（zenit） */
  startingZenit: 500,
  /** 起始四維骰階點數總和 */
  attributeTotal: 32,
  /** 起始必須修習的職業數下限 */
  classCountMin: 2,
  /** 起始必須修習的職業數上限 */
  classCountMax: 3,
  /** 起始可分配的技能等級總數（原書：每級 1 點，故等於起始等級） */
  skillPointBudget: 5,
  /**
   * 此團開放的拓展**上限**。預設為全部手冊——因為在「沒有 campaign」的情況下
   * 玩家就是自己的 GM，不該被擋；GM 自訂開局時把這裡收窄，才成為真正的上限。
   */
  allowedSourcebooks: Object.freeze([...ALL_SOURCEBOOK_KEYS]),
  /** 新角色預設勾選的拓展（預設只開核心，避免 35 個職業一次灌進選單） */
  defaultSourcebooks: Object.freeze(['core']),
  /** GM 指定必須修習的職業（空陣列＝不指定） */
  requiredClasses: Object.freeze([]),
  /** 是否允許金手指 */
  allowQuirk: true
});

const toInt = (value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  if (i < min || i > max) return fallback;
  return i;
};

const pickSourcebooks = (value, fallback) => {
  const list = Array.isArray(value)
    ? [...new Set(value.filter((key) => ALL_SOURCEBOOK_KEYS.includes(key)))]
    : [];
  return list.length > 0 ? list : [...fallback];
};

/**
 * 把（可能不完整的）開卡規則補齊並校正成一份可用的規則。
 *
 * 這是未來 campaign 的入口：`resolveCreationRules(campaign.rules)`。
 * 校正原則是**寧可退回官方預設，也不要讓壞資料流進引擎**——
 * 一條規則寫錯就讓整張卡算不出數值，比忽略那條規則更糟。
 */
export const resolveCreationRules = (overrides = {}) => {
  const given = overrides && typeof overrides === 'object' ? overrides : {};
  const d = DEFAULT_CREATION_RULES;

  const startingLevel = toInt(given.startingLevel, d.startingLevel, { min: 1, max: 50 });
  const startingZenit = toInt(given.startingZenit, d.startingZenit, { min: 0 });
  const attributeTotal = toInt(given.attributeTotal, d.attributeTotal, { min: 4 });

  let classCountMin = toInt(given.classCountMin, d.classCountMin, { min: 1, max: 10 });
  let classCountMax = toInt(given.classCountMax, d.classCountMax, { min: 1, max: 10 });
  if (classCountMin > classCountMax) classCountMax = classCountMin;

  // 技能點數預設跟著起始等級走（原書：每級 1 點）
  const skillPointBudget = toInt(given.skillPointBudget, startingLevel, { min: 1, max: 50 });

  const allowedSourcebooks = pickSourcebooks(given.allowedSourcebooks, d.allowedSourcebooks);
  // 預設勾選必須落在上限之內，否則就退回核心
  const wanted = pickSourcebooks(given.defaultSourcebooks, d.defaultSourcebooks);
  const withinCeiling = wanted.filter((key) => allowedSourcebooks.includes(key));
  const defaultSourcebooks = withinCeiling.length > 0
    ? withinCeiling
    : (allowedSourcebooks.includes('core') ? ['core'] : [allowedSourcebooks[0]]);

  const requiredClasses = Array.isArray(given.requiredClasses)
    ? [...new Set(given.requiredClasses.filter((name) => ALL_CLASS_NAMES.includes(name)))]
    : [...d.requiredClasses];

  const allowQuirk = typeof given.allowQuirk === 'boolean' ? given.allowQuirk : d.allowQuirk;

  return {
    startingLevel,
    startingZenit,
    attributeTotal,
    classCountMin,
    classCountMax,
    skillPointBudget,
    allowedSourcebooks,
    defaultSourcebooks,
    requiredClasses,
    allowQuirk
  };
};

/** 這份規則是否等於官方標準（UI 用來決定要不要顯示「此團自訂規則」提示） */
export const isDefaultCreationRules = (rules) => {
  const r = resolveCreationRules(rules);
  return CREATION_RULE_FIELDS.every((key) => {
    const a = r[key];
    const b = DEFAULT_CREATION_RULES[key];
    return Array.isArray(b) ? JSON.stringify(a) === JSON.stringify([...b]) : a === b;
  });
};

/** 供 GM 端分享用的精簡序列化（只帶與官方預設不同的欄位） */
export const diffCreationRules = (rules) => {
  const r = resolveCreationRules(rules);
  const out = {};
  CREATION_RULE_FIELDS.forEach((key) => {
    const a = r[key];
    const b = DEFAULT_CREATION_RULES[key];
    const same = Array.isArray(b) ? JSON.stringify(a) === JSON.stringify([...b]) : a === b;
    if (!same) out[key] = a;
  });
  return out;
};
