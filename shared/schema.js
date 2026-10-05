/**
 * 房間同步資料契約 —— 前端與 Worker 共用的唯一事實來源。
 *
 * 為什麼要有這份檔案（2026-10-04 建立）：
 * 連線房間的同步邊界必須**刻意收窄**。目前戰鬥參戰者物件（見
 * `characterEngine.js` 的 `exportCharacterToCombatant`）帶著 `skills` 與
 * `rawCharData`（整張角色卡的複本）——這些東西每次廣播都送，會讓訊息膨脹，
 * 直接吃掉 Cloudflare 免費方案的每日請求額度。
 *
 * 因此本檔定義「房間只同步什麼」。角色卡的完整內容永遠留在本機。
 */

/** 契約版本。任何欄位變動都必須遞增，讓舊前端能被辨識並拒絕。 */
export const SCHEMA_VERSION = 1;

/** 房間角色。 */
export const ROOM_ROLES = Object.freeze({
  GM: 'gm',
  PLAYER: 'player',
});

/**
 * 訊息型別。
 *
 * 設計原則：客戶端送「意圖」（我改了什麼），伺服器送「結果」（現在的狀態）。
 * 客戶端**永遠不送完整狀態**——那會造成最後寫入者覆蓋全場，也讓請求數失控。
 */
export const ROOM_MESSAGE_TYPES = Object.freeze({
  // ── 客戶端 → 伺服器：意圖 ──
  JOIN: 'join',
  HP_DELTA: 'hp',
  MP_DELTA: 'mp',
  IP_DELTA: 'ip',
  STATUS_TOGGLE: 'status',
  ACT_TOGGLE: 'act',
  ROUND_NEXT: 'round:next',
  COMBATANT_ADD: 'combatant:add',
  COMBATANT_REMOVE: 'combatant:remove',
  CLOCK_SET: 'clock:set',
  REWARD_PUBLISH: 'reward:publish',

  // ── 伺服器 → 客戶端：結果 ──
  SNAPSHOT: 'snapshot',
  PATCH: 'patch',
  PRESENCE: 'presence',
  ERROR: 'error',
});

/**
 * 僅 GM 可送的訊息型別。
 * 玩家端只允許改自己角色的資源與狀態。
 */
const GM_ONLY_TYPES = Object.freeze([
  ROOM_MESSAGE_TYPES.ROUND_NEXT,
  ROOM_MESSAGE_TYPES.COMBATANT_ADD,
  ROOM_MESSAGE_TYPES.COMBATANT_REMOVE,
  ROOM_MESSAGE_TYPES.CLOCK_SET,
  ROOM_MESSAGE_TYPES.REWARD_PUBLISH,
]);

/** 判斷某訊息型別是否僅限 GM 發送。未知型別一律視為受限（fail closed）。 */
export const isGmOnlyType = (type) => {
  if (!Object.values(ROOM_MESSAGE_TYPES).includes(type)) return true;
  return GM_ONLY_TYPES.includes(type);
};

// ── 資源夾值 ────────────────────────────────────────────────

/**
 * 把資源數值夾到 [0, max] 並轉為整數。
 * 伺服器與前端共用同一份，避免兩邊算出不同結果。
 * max 無效（undefined／NaN）時回傳 0，不猜測。
 */
export const clampResource = (value, max) => {
  const n = Number.parseInt(value, 10);
  const cap = Number.parseInt(max, 10);
  if (!Number.isFinite(cap) || cap < 0) return 0;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(cap, n));
};

/** 對單一資源欄位套用增量，回傳新的 `{current, max}`。 */
export const applyResourceDelta = (resource, delta) => {
  const max = resource?.max ?? 0;
  const current = resource?.current ?? max;
  return { ...resource, max, current: clampResource(current + (Number(delta) || 0), max) };
};

// ── 同步邊界 ────────────────────────────────────────────────

/**
 * 把戰鬥參戰者壓縮成「房間要同步的最小欄位集」。
 *
 * 刻意排除：
 *   - `skills`       特技清單（玩家端從本機角色卡取得）
 *   - `rawCharData`  整張角色卡複本（同上，且體積最大）
 *   - `avatar`       頭像 base64（可達數百 KB，絕不進廣播）
 *
 * `ip`（行囊點數）**只有玩家角色有**——官方規則中 NPC 不持有 IP，
 * 因此 NPC 的 `ip` 為 null 是正確行為，不是缺欄位。
 */
export const toCombatantSnapshot = (combatant) => {
  if (!combatant) return null;

  const hp = combatant.hp || {};
  const mp = combatant.mp || {};
  const ip = combatant.ip || null;

  return {
    instanceId: combatant.instanceId,
    sourceId: combatant.sourceId ?? null,
    sourceType: combatant.sourceType || 'npc',

    name: combatant.name || '未命名',
    faction: combatant.faction || '敵方',
    level: combatant.level ?? 5,
    rank: combatant.rank ?? null,
    role: combatant.role ?? null,
    species: combatant.species ?? null,

    hp: {
      current: clampResource(hp.current ?? hp.max, hp.max),
      max: Number.parseInt(hp.max, 10) || 0,
      crisisThreshold: Number.parseInt(hp.crisisThreshold, 10)
        || Math.floor((Number.parseInt(hp.max, 10) || 0) / 2),
    },
    mp: {
      current: clampResource(mp.current ?? mp.max, mp.max),
      max: Number.parseInt(mp.max, 10) || 0,
    },
    ip: ip === null ? null : {
      current: clampResource(ip.current ?? ip.max, ip.max),
      max: Number.parseInt(ip.max, 10) || 0,
    },

    attributes: { ...(combatant.attributes || {}) },
    defense: combatant.defense ?? 0,
    magicDefense: combatant.magicDefense ?? 0,
    initiative: combatant.initiative ?? 0,

    hasActed: !!combatant.hasActed,
    statusEffects: { ...(combatant.statusEffects || {}) },

    /** 由房間指派：誰有權改這隻。前端不應自行設定。 */
    ownerPeerId: combatant.ownerPeerId ?? null,
  };
};

// ── 房間狀態 ────────────────────────────────────────────────

/** 建立一個空房間。 */
export const createEmptyRoomState = (roomCode) => ({
  schemaVersion: SCHEMA_VERSION,
  rev: 0,
  roomCode: roomCode || '',
  round: 1,
  combatants: [],
  sceneClocks: [],
  rewards: [],
  peers: [],
});

/** 建立一筆獎勵紀錄。 */
export const createReward = ({ id, text, recipients, publishedBy }) => ({
  id: id || `reward_${Date.now()}`,
  text: text || '',
  recipients: Array.isArray(recipients) ? recipients : [],
  publishedBy: publishedBy || null,
  createdAt: new Date().toISOString(),
});
