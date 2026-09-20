# Fabula Ultima Companion (FU Companion) - 專案紀錄與變更日誌

本文件記錄專案的全局架構、核心設計約束、重要決策與每次代碼變更歷史，方便後續直接維護與追蹤。

---

## 📌 核心架構與設計約定 (Core Guidelines)

1. **圖示規範 (Icon Policy)**：
   - 全網站圖示**一律預設自 [Game-Icons.net](https://game-icons.net/)**（使用 `react-icons/gi` 函式庫），除非用戶另有明確指示。
   - 《Fabula Ultima》官方特有屬性符號（如物理、風、雷、光、暗等）採用官方字體與樣式類名（`.fu-icon`）。
2. **UI/UX 核心風格**：
   - 經典 JRPG 魔導書/羊皮紙暖色調風格（`#fbf7ee` 背景底色、`#3c2415` 深褐色主文字、琥珀金與復古黃銅色高亮）。
   - 首頁為書本封面入口（`BookCoverHub`），點選不同模組時伴隨翻書翻頁淡隱動畫（Page Flip Overlay）。
3. **模組架構**：
   - 📖 **書本封面入口 (Book Cover Hub)**：全螢幕進入點，獨立章節切換。
   - 🛠️ **NPC 工坊 (NPC Workshop)**：完整整合自 `fu-npc-builder`，支援嚴謹/自由規則、定位算法、技能樹、頭像裁切、圖片匯出與 JSON 存檔。
   - ⚔️ **戰鬥輪次 (Combat Tracker)**：支援從 NPC 工坊一鍵推入 NPC 入戰，管理先攻輪次與 HP/MP 消耗。
   - 📜 **角色卡助手 (Character Sheet)**：管理玩家角色屬性、職業與裝備。
   - ⏱️ **命刻記錄 (Fate Clocks)**：TRPG 推進時鐘與危機倒數。
   - 🎲 **全域浮動骰盅 (Dice Roller Modal)**：隨時可呼叫的雙骰檢定器。

---

## 📜 變更日誌 (Changelog)

### [2026-09-20] - 倉庫初始化與 NPC 工坊戰術定位圖示升級
- **版本控制初始化**：
  - 本地倉庫建立 Git 版本控制（`git init`），提供 IDE 完整的行級代碼追蹤與 Source Control 面板支援。
  - 建立專案總覽與變更檔案 `PROJECT_CHANGELOG.md`。
- **NPC 工坊定位標誌全面升級 (Game-Icons.net)**：
  - 取代原本各定位的文字 Emoji（🩸、🏹、🔮、💣、🛡️、🌿），改為標準向量 SVG：
    - **暴徒 (Brute)**: `GiBrute`（肌肉剛猛的破陣者）
    - **獵人 (Hunter)**: `GiCrossbow`（致命連發精密弩）
    - **法師 (Mage)**: `GiWizardStaff`（元素奧術法杖）
    - **破壞者 (Saboteur)**: `GiTimeBomb`（戰術定時引信爆彈）
    - **衛士 (Sentinel)**: `GiShieldReflect`（守護與防禦反擊之盾）
    - **輔助 (Support)**: `GiHealing`（雙手生命治癒祝禱之光）
  - 同步更新位置：
    - 步驟 1 輪播卡片中央徽章與 12 度傾斜背景浮水印。
    - 步驟 1 底部 Quick Select 快捷按鈕。
    - NPC 檔案庫存檔卡片角色標籤。
    - `NPCBuilder.jsx` 戰術定位選擇器。
- **翻頁動效升級（GPU 合成層縮放過渡）**：
  - 實現「運鏡式翻開/合上縮放過渡」：
    - **翻開典籍 (Open)**：書本自 `scale(0.94)` 伴隨 3D 翻頁流暢推進放大至 `scale(1.18)`，無縫融會至工作區。
    - **合上典籍 (Close)**：書本自 `scale(1.15)` 翻頁合閉，平滑收縮落回 `scale(1.0)` 封面。
  - **極致效能優化 (0 卡頓保障)**：
    - 徹底移除全螢幕 `backdrop-blur` 與 keyframe `blur` 濾鏡（避免每秒 60 次的 GPU 像素重繪）。
- **典籍深度融合（消除雙重典籍穿崩視覺）**：
  - 解決「翻開書時背景還留著一本大書」的違和感：
    - **點擊進入時**：背景的實體典籍與工具列即時以 `opacity: 1 -> 0` 伴隨輕微縮小淡出，由前景浮動翻開的典籍作為唯一視覺主體，如行雲流水般「拿起典籍並翻開進入」。
    - **合上返回時**：工作區即刻優雅淡出，前景典籍闔上並落回桌面的過程中，背景典籍以 `opacity: 0 -> 1` 平滑顯現歸位，視覺連貫無瑕。
- **建置驗證**：
  - 通過 Vite Production Build (`npm run build`)，無任何編譯與語法警告。

### [2026-09-20] - NPC 工坊背景色鎖定與調色盤移至角色卡預覽
- **模組背景色解耦 (UI/Card Decoupling)**：
  - 各模組維持各自專屬特色背景底色，NPC 工坊介面全面固定為經典羊皮紙米褐色（`#fbf7ee` 背景、`#f4ebd9` 標題/容器條、`#d6c7ab` 邊框）。
  - 移除先前的全域 `:root` `data-codex-theme` 覆寫，避免切換調色盤時污染或變更其他板塊（如角色卡助手、戰鬥輪次等）的視覺風格。
- **調色盤遷移至角色卡預覽工具列**：
  - 頂部導航欄不再顯示全域調色盤懸浮選單，將主題色切換按鈕內嵌於「**角色卡預覽**」頁籤的工具列中（緊鄰研究檢定層級選擇器）。
  - 支援六種經典 JRPG 魔導書配色（琥珀金、深海藍、翡翠綠、緋紅曜石、秘法紫、灰燼黑）。
  - 色彩更換範圍嚴格限制於 NPC 角色卡實體（包含即時預覽、分頁預覽、圖片輸出與 HTML 渲染），工坊編輯框與導航保持沉浸穩定的米褐色。
- **建置驗證**：
  - 通過 `npm run build` 完整打包編譯。

### [2026-09-20] - 構裝體物種技能「獨特設計」加成領域自由填寫功能
- **物種專屬特性擴展 (Construct Domain Input)**：
  - 為構裝體（Construct）的特性技能『在有利於此構造體獨特設計、工具或程式設計的情況下，對抗檢定獲得 +3 加成。』新增 `needsSelection: true` 與自由填寫輸入框（`sp_construct_domain`）。
  - 使用者在步驟 2 勾選該選項後，下方即時展開專屬輸入框（提示範例：破拆作業、水下維護、警衛監控、數據分析等）。
  - 輸入框支援即時雙向綁定與動態插值，未輸入時於預覽中呈現琥珀色待配置虛線槽（`待配置項目：加成領域`），輸入後即時嵌入描述為『在有利於此構造體獨特設計、工具或程式設計【所填領域】的情況下，對抗檢定獲得 +3 加成。』。
- **角色卡與規則導出精確化**：
  - 角色卡規則名稱由原先籠統的「身體能力」自動精確辨識為「**獨特設計**」，確保構裝體特性命名嚴謹。
  - 同步支援於 `NPCWorkshop.jsx` 與 `NPCBuilder.jsx`，並相容 JSON 存檔與導出。
- **建置驗證**：
  - 通過 `npm run build` 完整打包編譯無警告。

### [2026-09-20] - 暫時隱藏作者贊助入口
- **UI 精簡 (Hide Sponsorship Entrance)**：
  - 暫時自 NPC 工坊存檔庫頁面底部移除「贊助支持卡片」（請喝咖啡橫幅與按鈕）。
  - 移除「支持詳情」專屬彈窗（Ko-fi 連結與未來開發計畫彈窗），維持乾淨簡潔的介面體驗，待整體專案功能完善後再行安排。
- **建置驗證**：
  - 通過 `npm run build` 完整打包編譯無警告。

### [2026-09-20] - 第三方授權聲明遷移至首頁封面與聲明內容更新
- **授權聲明外移 (Relocate License Notice to Cover Hub)**：
  - 將原本位於 NPC 工坊存檔庫底部的第三方授權聲明（Third-Party License Notice）自工坊內徹底移除。
  - 將其外移至網站主入口封面（`BookCoverHub.jsx`）底部，作為整站全域的官方授權聲明。
- **聲明內容規範與技術標註更新**：
  - 專案名稱由 `FU NPC Builder` 改為 `FU Companion`。
  - 於 `production` 處新增 Google Antigravity 輔助開發標註：`(developed with assistance from Antigravity)`。
  - 移除原先對 Bestiary vol.1 的引用，調整為僅引用核心規則書：`This tool requires the Fabula Ultima Core Rulebook.`。
  - 動效融合：開書動畫觸發時，該聲明區塊隨封面 UI 平滑淡出（`isOpening` 同步漸隱），維持沉浸式翻頁視覺。
### [2026-09-20] - NPC 工坊全面對齊官方 Style Guide 規範 (Page 11)
- **官方風格指南對齊 (Fabula Ultima Third-Party License Style Guide Alignment)**：
  - 下載並深入對照官方最新發佈之風格手冊（Page 11 "WRITING NPC PROFILES"），針對 NPC 數據區塊（Statblock）與技能類別實施規範化修改。
- **屬性相性順序標準化 (Canonical Affinity Order `p a b d e f i l t`)**：
  - 將原本順序倒置（物理排在倒數第二）的 `DAMAGE_TYPES` 嚴格修訂為官方標準核心九相順序：
    - `物理` (p)、`風` (a)、`電` (b)、`暗` (d)、`土` (e)、`火` (f)、`冰` (i)、`光` (l)、`毒` (t)。
  - 連帶修訂 `NPCWorkshop.jsx` 預覽分類、`NPCCardPreview.jsx` 抗性矩陣、`constants.js` 與 `NPCBuilder.jsx` 步驟 4 的抗性循環排列順序。
- **生命值危機臨界值標準指示符 (`HP X w X`)**：
  - 角色卡核心資源區於 HP 旁增加官方 Crisis 專屬圖標（來自 `FabulaUltimaIcons-Regular.otf` 之 `w` 字符）與數值標記：`w Math.floor(HP / 2)`。
  - 同步更新即時預覽、角色卡預覽（`NPCCardPreview.jsx`）與 Discord / Plain / Markdown 複製格式（`HP X (危機 X)`）。
- **防禦與先攻專用術語規範 (`DEF`, `M.DEF`, `INIT`)**：
  - 依風格指南縮寫規範，防禦與先攻表頭嚴格對齊為 `物防 DEF`、`魔防 M.DEF`、`先攻 INIT`。
- **攻擊射程專用符號與傷害屬性圖示 (`m` Melee / `r` Ranged)**：
  - 基本攻擊欄位前方全面內嵌官方武器射程字型字符：近戰攻擊標註 `m`（近戰標記）、遠程攻擊標註 `r`（遠程標記）。
  - 傷害類型標籤前補齊屬性官方符號（如物理 `p`、火 `f`、冰 `i`、電 `b` 等）。
- **NPC 技能動作分類規範化 (Four Canonical Action Categories)**：
  - 依手冊第 11 頁標準四大分類嚴格統一標題與符號：
    - **基本攻擊 (BASIC ATTACKS)**：配備 `m` 官方近戰圖標。
    - **咒語 (SPELLS)**：配備 `c` 官方咒語圖標與 `o` 攻擊性咒語圖標。
    - **其餘行動 (OTHER ACTIONS)**：配備 `s` 官方行動圖標。
    - **特殊規則 (SPECIAL RULES)**：配備 `📜` 典籍規則圖標。
- **建置驗證**：
  - 通過 Vite Production Build (`npm run build`)，零錯誤、零警告。
