/**
 * 專有名詞「中文 · ENGLISH」格式化（`GEMINI.md` 規則三第 4 點「專有名詞例外」）。
 *
 * 適用範圍僅限**職業、範本、物種**三類；其餘（英雄技能、裝備、咒語、狀態、介面標題）一律純中文。
 *
 * **資料來源不重複造表**：
 * - **職業** → 複用既有的 `CLASS_METADATA`（`sourcebookConfig.js`，含 `getClassInfo`）。
 * - **NPC 定位** → 本檔 `ROLE_EN`（見下方來源註解）。
 * - **物種** → 本檔 `SPECIES_EN`（見下方來源註解）。
 *
 * **寧缺勿造**：查無官方英文者一律原樣回傳中文，不得臆造（規則二.4）。
 */

import { getClassInfo } from '../features/character-sheet/data/sourcebookConfig';

/**
 * NPC 定位（`ROLE_EN`）
 *
 * 來源：**Fabula Ultima Bestiary Vol. 1**，NPC Roles 章節。
 * 原文（p.46）：「This section explores the six NPC roles
 * (brute, hunter, mage, saboteur, sentinel, and support).」
 *
 * 逐條語意核對（Bestiary 描述 ↔ 本專案 `ROLE_DESCRIPTIONS[x].desc`）：
 * - brute    abundant HP, low defenses           ↔ 極高的 HP…但防禦較低且弱點多
 * - hunter   deal damage with melee or ranged    ↔ 極高的命中與先攻，專精單體爆發
 * - mage     wreak havoc with spells and magic   ↔ 最高的群體傷害潛力與 MP 儲備
 * - saboteur adept at weakening enemies          ↔ 不以直接傷害見長，精通 Debuff
 * - sentinel excel at defending others           ↔ 最強的雙防禦加成，擅長保護盟友
 * - support  bolster their allies' potential     ↔ 缺乏直接攻擊力，但能提供增益治癒
 */
const ROLE_EN = {
  '暴徒': 'BRUTE',
  '獵人': 'HUNTER',
  '法師': 'MAGE',
  '破壞者': 'SABOTEUR',
  '衛士': 'SENTINEL',
  '輔助': 'SUPPORT',
};

/**
 * 物種（`SPECIES_EN`）
 *
 * 來源：**Core Rulebook p.302**（Designing NPCs, step 3）：
 * 「Choose the NPC's Species: beast, construct, demon, elemental,
 *   humanoid, monster, plant, or undead.」
 *
 * 註：物種瓷磚另有一套兩行式顯示（中文名／英文標籤並列，見 `SPECIES_THEMES`），
 * 本表供行內 `withEn()` 使用，兩者資料一致。
 */
const SPECIES_EN = {
  '野獸': 'BEAST',
  '構造體': 'CONSTRUCT',
  '惡魔': 'DEMON',
  '元素': 'ELEMENTAL',
  '類人': 'HUMANOID',
  '怪物': 'MONSTER',
  '植物': 'PLANT',
  '不死': 'UNDEAD',
};

/** 尾端的【…】限定標記（如 `【Playtest】`）；查表時剝除，顯示時保留。 */
const SUFFIX_RE = /【[^】]*】\s*$/;

/**
 * 取得專有名詞的官方英文。
 * @param {string} zhName 中文名，可含尾端【…】標記
 * @returns {string|null} 英文名；查無者回傳 null
 */
export const englishOf = (zhName) => {
  if (typeof zhName !== 'string' || !zhName.trim()) return null;
  const raw = zhName.trim();
  const base = raw.replace(SUFFIX_RE, '').trim();

  // 1) 職業：複用既有 CLASS_METADATA。getClassInfo 查無時會把中文名塞進 en，須排除。
  const info = getClassInfo(base);
  if (info?.en && info.en !== base) return info.en;

  // 2) NPC 定位、3) 物種：本檔專用表
  return ROLE_EN[base] || SPECIES_EN[base] || null;
};

/**
 * 格式化為「中文 · ENGLISH」（半形空格＋間隔號＋半形空格）。
 * **查無英文時原樣回傳**（寧缺勿造）。
 * @param {string} zhName 中文名
 * @returns {string}
 */
export const withEn = (zhName) => {
  const en = englishOf(zhName);
  return en ? `${zhName} · ${en.toUpperCase()}` : zhName;
};
