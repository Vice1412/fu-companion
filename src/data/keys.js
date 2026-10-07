/**
 * localStorage 鍵註冊表 —— 全站唯一事實來源。
 *
 * 為什麼要有這張表（2026-10-04 建立）：
 * 在此之前，全站有 9 個鍵散落在 7 個檔案裡直接呼叫 localStorage，而且
 * NPC 檔案庫同時存在三個互不相通的鍵：
 *
 *   - `fabula-npc-library-v2`      NPC 工坊實際讀寫（真正的資料在這裡）
 *   - `fu_companion_npc_library`   App 全站備份與戰鬥追蹤器讀取（永遠讀不到東西）
 *   - `fu_npc_library`             匯入時寫入，但沒有任何地方讀取（死鍵）
 *
 * 直接後果：戰鬥追蹤器的「從怪物庫派兵」看不到 NPC 工坊的產出，
 * 而全站備份也備不到真正的 NPC 檔案庫。
 *
 * 本表確立單一權威鍵。舊鍵降級為 LEGACY_KEYS，僅供一次性遷移讀取，不得再寫入。
 */

/**
 * 現行權威鍵。
 * 讀寫一律走 `src/data/store.js`，不得再直接呼叫 localStorage。
 */
export const STORAGE_KEYS = Object.freeze({
  /** NPC 檔案庫（NPC 工坊的產出） */
  npcLibrary: 'fu_companion_npc_library',
  /** 角色名冊（角色卡的集合） */
  characterRoster: 'fu_companion_character_roster',
  /** 進行中的戰鬥（輪次、參戰者、場景命刻） */
  activeCombat: 'fu_companion_active_combat',
  /** 命刻記錄頁的獨立命刻 */
  fateClocks: 'fu_companion_fate_clocks',
  /** 音效開關 */
  soundEnabled: 'fu_companion_sound_enabled',
  /** NPC 卡片配色 */
  npcCardTheme: 'fabula-npc-card-theme',
  /** 角色卡配色 */
  characterTheme: 'fu_companion_character_theme',
  /**
   * 團務開卡規則（GM 自訂開局）。
   *
   * 這本機名冊就是「這一團」——規則存在這裡而不是每個角色身上，因為它是團務層級的
   * （例如「開局贈送一個英雄技能」是全團一起用的選用規則）。
   * 內容是 `data/creationRules.js` 的覆寫物件，經 `resolveCreationRules` 補齊預設值。
   */
  creationRules: 'fu_companion_creation_rules',
});

/**
 * 舊鍵 —— 只讀不寫。
 *
 * 遷移時機：`store.migrateLegacyStorage()`，於 `main.jsx` 首次渲染前執行。
 * 遷移採「權威鍵為空才複製」策略，且**永不刪除舊鍵**，因此完全可逆。
 */
export const LEGACY_KEYS = Object.freeze({
  /** NPC 工坊在 2026-10-04 之前實際使用的鍵 */
  npcLibraryV2: 'fabula-npc-library-v2',
  /** 匯入備份時誤寫的鍵，從未有讀取端 */
  npcLibraryStray: 'fu_npc_library',
  /** NPC 卡片配色的舊版鍵 */
  npcCardThemeV1: 'fabula-npc-theme',
});

/** 全部鍵的聯集，供測試與稽核使用。 */
export const ALL_STORAGE_KEYS = Object.freeze([
  ...Object.values(STORAGE_KEYS),
  ...Object.values(LEGACY_KEYS),
]);
