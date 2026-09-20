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
- **建置驗證**：
  - 通過 Vite Production Build (`npm run build`)，無任何編譯與語法警告。
