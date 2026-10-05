/**
 * 單一儲存存取層。
 *
 * 目的：全站所有持久化狀態只經過這裡。呼叫端不再直接碰 localStorage。
 *
 * 為什麼要收斂（2026-10-04 建立）：
 * 連線房間同步的作用是「攔截所有狀態變更並轉發給其他玩家」。
 * 若狀態仍由 5 個檔案各自直接寫入 localStorage（`activeCombat` 就是如此），
 * 同步層必須與這 5 個寫入點逐一打架。收斂成單一入口後，未來只要在
 * `writeJSON` 加一個轉發鉤子，就能接上遠端同步，不必改動任何呼叫端。
 *
 * 設計取捨：
 * - 提供 `subscribe`：目前供跨分頁與 UI 使用，未來供遠端快照套用。
 * - 儲存後端可抽換：Node 測試環境沒有 localStorage，故內建記憶體後備。
 */

import { STORAGE_KEYS, LEGACY_KEYS } from './keys.js';

// ── 儲存後端 ────────────────────────────────────────────────

/** 記憶體後備：Node 測試與無 localStorage 環境使用。 */
const createMemoryBackend = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    key: (i) => Array.from(map.keys())[i] ?? null,
    get length() { return map.size; },
  };
};

const pickDefaultBackend = () => {
  try {
    const ls = globalThis.localStorage;
    if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') return ls;
  } catch (e) {
    // 無 localStorage（Node／SSR／隱私模式），改用記憶體後備
  }
  return createMemoryBackend();
};

let backend = pickDefaultBackend();

/** 測試用：替換儲存後端。傳入 null 可還原為預設後端。 */
export const __setStorageBackend = (next) => { backend = next || pickDefaultBackend(); };

// ── 變更訂閱 ────────────────────────────────────────────────

const listeners = new Map(); // key -> Set<listener>

const emit = (key, value) => {
  const set = listeners.get(key);
  if (!set || set.size === 0) return;
  // 複製一份再走訪，避免 listener 在回呼中退訂造成走訪中變動
  Array.from(set).forEach((fn) => {
    try { fn(value, key); } catch (e) { console.error(`store 訂閱者發生例外（${key}）:`, e); }
  });
};

/**
 * 訂閱某個鍵的變更。回傳退訂函式。
 * 注意：目前只涵蓋「同一個分頁內」的寫入。跨分頁需另接 storage 事件。
 */
export const subscribe = (key, fn) => {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(fn);
  return () => { listeners.get(key)?.delete(fn); };
};

// ── 基本讀寫 ────────────────────────────────────────────────

/** 讀取原始字串。讀不到或後端拋錯時一律回傳 null。 */
export const readRaw = (key) => {
  try { return backend.getItem(key); } catch (e) { return null; }
};

/**
 * 讀取並解析 JSON。
 * 空值、解析失敗、null 都回傳 `fallback`，讓呼叫端不必再包 try/catch。
 */
export const readJSON = (key, fallback = null) => {
  const raw = readRaw(key);
  if (raw === null || raw === undefined || raw === '') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (e) {
    console.error(`store 解析失敗（${key}）:`, e);
    return fallback;
  }
};

/** 寫入 JSON 並通知訂閱者。回傳是否成功。 */
export const writeJSON = (key, value) => {
  try {
    backend.setItem(key, JSON.stringify(value));
    emit(key, value);
    return true;
  } catch (e) {
    // 配額爆掉（QuotaExceededError）最常見，例如角色頭像存成 base64
    console.error(`store 寫入失敗（${key}）:`, e);
    return false;
  }
};

/**
 * 寫入原始字串（不經 JSON 編碼）。
 *
 * 供「本來就存純字串」的鍵使用 —— 例如卡片配色（`'amber'`）與音效開關（`'true'`）。
 * 這些鍵若改用 `writeJSON` 會被包成 `'"amber"'`，而讀取端若用 `readJSON` 對
 * 既有資料解析則會直接失敗。兩種格式必須涇渭分明，故本層同時提供兩組 API。
 */
export const writeRaw = (key, value) => {
  try {
    backend.setItem(key, String(value));
    emit(key, value);
    return true;
  } catch (e) {
    console.error(`store 寫入失敗（${key}）:`, e);
    return false;
  }
};

/** 移除單一鍵。 */
export const removeKey = (key) => {
  try {
    backend.removeItem(key);
    emit(key, null);
    return true;
  } catch (e) {
    console.error(`store 移除失敗（${key}）:`, e);
    return false;
  }
};

/** 清空全部鍵。語意等同原本的 localStorage.clear()。 */
export const clearAll = () => {
  try {
    const keys = [];
    for (let i = 0; i < backend.length; i += 1) {
      const k = backend.key(i);
      if (k !== null && k !== undefined) keys.push(k);
    }
    keys.forEach((k) => backend.removeItem(k));
    return true;
  } catch (e) {
    console.error('store 清空失敗:', e);
    return false;
  }
};

// ── 一次性舊鍵遷移 ──────────────────────────────────────────

/**
 * 把舊鍵的內容搬到權威鍵。
 *
 * 策略（刻意保守，因為這是使用者資料）：
 *   1. 權威鍵**已有內容**時一律跳過，絕不覆寫。
 *   2. 只在權威鍵為空時，才從舊鍵複製。
 *   3. 舊鍵**永不刪除** —— 因此本操作完全可逆。
 *   4. 內容必須能通過 JSON.parse 才會搬移，避免把壞資料升級成權威資料。
 *
 * 可重複執行（idempotent）：跑第二次不會有任何副作用。
 *
 * @returns {{migrated: Array<{canonical:string, from:string}>, skipped: string[], empty: string[]}}
 *   回傳報告而非只做事，是為了讓它能在 Node 中被測試。
 */
export const migrateLegacyStorage = () => {
  const report = { migrated: [], skipped: [], empty: [] };

  const isBlank = (v) => v === null || v === undefined || v === '';

  const migrateKey = (canonical, legacyKeys) => {
    if (!isBlank(readRaw(canonical))) {
      report.skipped.push(canonical);
      return;
    }
    const source = legacyKeys.find((k) => !isBlank(readRaw(k)));
    if (!source) {
      report.empty.push(canonical);
      return;
    }
    const raw = readRaw(source);
    try {
      JSON.parse(raw);
    } catch (e) {
      report.skipped.push(`${canonical}（來源 ${source} 無法解析）`);
      return;
    }
    try {
      backend.setItem(canonical, raw);
      report.migrated.push({ canonical, from: source });
    } catch (e) {
      report.skipped.push(`${canonical}（寫入失敗）`);
    }
  };

  migrateKey(STORAGE_KEYS.npcLibrary, [LEGACY_KEYS.npcLibraryV2, LEGACY_KEYS.npcLibraryStray]);

  return report;
};
