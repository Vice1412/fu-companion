# Fabula Ultima Companion (FU Companion) - Agent Guidelines & System Rules

本文件是專案的最高持久規範文件（Persistent Workspace Rules）。
**無論對話歷史經歷多少次 Context Compaction（上下文壓縮）或在新 Session 中啟動，本文件皆會由 Antigravity 系統自動加載至每次互動的最優先提示中。**

---

## 📌 核心規則一：圖示雙軌鐵律 (Icon System Dual-Track Policy)

本專案在圖示運用上嚴格實行「**官方特有符號**」與「**Game-Icons.net 通用標誌**」的雙軌體系，並**嚴格禁絕所有 Unicode Emoji**。

### 軌道 1：官方專屬符號（必須使用官方字型 `.fu-icon` 或 `<FUIcon />`）
凡屬於《Fabula Ultima》官方出版物與 Style Guide 規範之專屬遊戲機制符號，**一律嚴格使用官方字型 `FabulaUltimaIcons-Regular.otf`（CSS 類名 `.fu-icon` 或引入 `<FUIcon />` 組件）**，嚴禁使用通用圖標替代：

1. **屬性傷害九相 (Damage Types / Affinities)** - 嚴格遵循官方標準九相排列順序：
   - 物理 (Physical): `p`
   - 風 (Air): `a`
   - 電 (Bolt): `b`
   - 暗 (Dark): `d`
   - 土 (Earth): `e`
   - 火 (Fire): `f`
   - 冰 (Ice): `i`
   - 光 (Light): `l`
   - 毒 (Poison): `t`
2. **攻擊射程 (Attack Range)**：
   - 近戰攻擊 (Melee Attack): `m`
   - 遠程攻擊 (Ranged Attack): `r`
3. **動作與技能分類 (Action Categories)**：
   - 咒語 (Spell): `c`
   - 攻擊性咒語 (Offensive Spell): `o`
   - 其餘行動 (Other Action): `s`
4. **危機狀態指示符 (Crisis Indicator - Style Guide p.11 `HP X w X`)**：
   - 危機標誌 (Crisis): `w`

### 軌道 2：通用 RPG 標誌與 UI 圖示（必須使用 https://game-icons.net/）
凡不屬於官方字型範疇的其餘遊戲圖示與 UI 元素，**一律預設自 [Game-Icons.net](https://game-icons.net/)（透過 `react-icons/gi` 函式庫或 `<GameIcon />` 組件）**：
- **職業與範本頭像**：20 大官方經典範本（鍊金術士 `GiRoundBottomFlask`、暗黑騎士 `GiBlackKnightHelm` 等）、核心 15 職與拓展職業圖標。
- **冒險資源與儀表板**：HP (`GiHealthNormal`)、MP (`GiLightningTear`)、IP (`GiBackpack`)、Zenit 金幣錢包 (`GiCoins`)、EXP 升級經驗 (`GiUpgrade`)、物語點 (`GiSparkles`)。
- **角色特質與記錄**：個人命刻時鐘 (`GiPocketWatch`)、三維六向情感羈絆 (`GiBrokenHeart`, `GiEyeball`, `GiHeartShield` 等)、消耗品捷徑 (`GiRoundBottomFlask`, `GiCrystalBall`)。

### 軌道 3：零 Emoji 鐵律 (Zero Emoji Policy)
- **整站嚴禁使用任何 Unicode Emoji**（嚴禁 ⚔️、🛡️、🔮、🧪、⚠️、✨、❌、✅、📜、👑、🩸、🏹 等）。
- 警示請使用 `GiHazardSign`，成功請使用 `GiCheckMark`，武器請使用 `GiBroadsword` 或 `GiCrossedSwords`，書籍請使用 `GiSpellBook`，英雄等級請使用 `GiLaurelCrown`。

---

## 📌 核心規則二：規則手冊依據標準 (Official Rules Baseline)

1. **官方英文與民間漢化雙軌權威基準 (Dual-Standard Rule Baseline)**：
   - **官方英文最新勘誤版 (`Fabula_Ultima_Core.pdf` Core Rulebook v1.1 Errata)**：代表最新官方平衡調整與絕對權威機制標準。所有職業技能機制、數值公式、技能等級上限 (maxSL)、觸發時點與判定限制，**一律嚴格以此為準**。
   - **民間漢化版**：代表繁簡在地化中文翻譯標準。所有中文技能名稱、機制術語、身世背景與名詞翻譯體系，**一律依據民間漢化規範**。
   - **衝突裁決原則**：一旦民間漢化版與官方英文最新勘誤版存在機制差異、數值遺漏、舊版殘留或條款衝突，**無條件以官方英文為最高優先**，並在保持民間漢化譯名風格的前提下補全校準。
2. **手冊與拓展開關控制 (Sourcebook Toggle System)**：
   - 核心 15 職永遠啟用。
   - 高等奇幻 (High Fantasy)、科技奇幻 (Techno Fantasy)、自然奇幻 (Natural Fantasy) 與公測修訂 (Playtest) 必須保留打勾開關，讓玩家依跑團團務需求自由解鎖。
3. **官方創角合規檢驗 (Character Creation Rules)**：
   - 起始 5 級必須分配在 2~3 個職業中（單職最高 4 級，特技總點數 SL 必須等於等級）。
   - 起始 4 項屬性基礎值分配總和必須嚴格等於 32（提供 4 組 d8、專精、均衡、特化配置）。
   - 初始裝備預算固定 500z，剩餘預算加上擲骰 2d6 × 10 結算為開局儲蓄。

---

## 📌 核心規則三：純中文顯示鐵律 (Pure Chinese Display Policy)

為確保使用者介面與規則文本的閱讀沉浸感與視覺純淨度，全站面向使用者的規則描述、機制說明、職業技能、阿爾卡納、咒語法術、道具與系統文案，**一律嚴格禁絕以「括號附帶英文原名/譯名」的格式呈現（例如嚴禁 `(Sword)`、`(Arcanum of the Forge)`、`(fire, heat, metal)`、`(Merge)`、`(Dismiss)`、`(Basic)`、`(Elementalist)` 等）**：
1. **名詞與標題純粹化**：全部直接採用民間漢化標準中文名稱，不附加任何英文原名註記。
2. **唯一允許之縮寫**：僅允許系統必備的官方核心數值縮寫標識（例如：【DEX/INS/MIG/WLP】、【HP/MP/IP】、【HR】、【SL】、【DEF/M.DEF】、金幣【z】、骰子規格【d6/d8/d10/d12/d20】）。其餘所有名詞皆為純中文。
3. **規則概念速查 (Rule Codex)**：標題、分類、各階發明、阿爾卡納領域與效果、法術名稱與說明等，一律保持純粹中文，徹底去除任何中英夾雜或括號英文。

## 📌 核心規則四：文案與顯示文本預審協議 (Copywriting Pre-approval Protocol)

在專案開發過程中，嚴格區分「**文案內容審查**」與「**代碼自主實裝**」的責任邊界：

1. **使用者唯一審查範疇：面向使用者的文字與文案內容**：
   - 凡任務涉及新增或修改**介面文案、提示訊息、警告彈窗、身世背景說明、規則描述、空狀態文案、按鈕標籤**等任何會直接呈現給使用者的中文文字內容時：
   - **實作前必須先向使用者提交簡潔明確的「文本規劃草案（Text Plan / Implementation Plan）」**，列出預計撰寫的完整文案與關鍵用語。
   - **格式要求**：必須一律以 Antigravity Artifact 建立專屬的 `implementation_plan.md`（啟用 `RequestFeedback: true`），讓使用者能直接在文件介面上反白選取文字（Highlight）並提出精準修訂意見。對話回覆中僅需提示使用者前往檢視，不向使用者展示代碼細節。
   - **待使用者確認或調整文案後，方可放手進行代碼實裝。**

2. **AI 代碼自主處理（無需使用者 Code Review）**：
   - 組件架構設計、狀態管理、事件綁定、Tailwind / CSS 樣式、防退化測試與 Build 驗證等所有 Coding 工作，由 AI 自動化獨立解決並確保品質，**無需請使用者審查代碼細節**。

---

## 📌 核心規則五：防退化自檢流程 (Anti-Regression Protocol)

任何代碼生成或修改完成後，在回覆用戶前必須進行以下確認：
1. **靜態正則檢測**：
   執行 PowerShell 掃描：
   `Get-ChildItem -Path "src" -Recurse -File | Select-String -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF]"`
   確保全站源碼中無任何 Emoji 字符。
2. **構建驗證**：
   執行 `npm run build`，確保無任何編譯報錯與未解析的依賴。

