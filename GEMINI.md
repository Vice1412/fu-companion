# Fabula Ultima Companion (FU Companion) - Agent Guidelines & System Rules

本文件是專案的最高持久規範文件（Persistent Workspace Rules）。
**無論對話歷史經歷多少次 Context Compaction（上下文壓縮）或在新 Session 中啟動，本文件皆會由 Antigravity 系統自動加載至每次互動的最優先提示中。**

---

## 📌 核心規則一：圖示三軌鐵律 (Icon System Three-Track Policy)

本專案在圖示運用上嚴格實行「**官方特有符號**」、「**Game-Icons.net 敘事標誌**」與「**功能性控件豁免**」的三軌體系，並**嚴格禁絕所有彩色圖像化 Emoji**。

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

### 軌道 2：敘事性遊戲圖示（必須使用 https://game-icons.net/）
凡**具敘事、世界觀或遊戲機制意涵**的圖示，**一律預設自 [Game-Icons.net](https://game-icons.net/)（透過 `react-icons/gi` 函式庫或 `<GameIcon />` 組件）**：
- **職業與範本頭像**：20 大官方經典範本（鍊金術士 `GiRoundBottomFlask`、暗黑騎士 `GiBlackKnightHelm` 等）、核心 15 職與拓展職業圖標。
- **冒險資源與儀表板**：HP (`GiHealthNormal`)、MP (`GiLightningTear`)、IP (`GiBackpack`)、Zenit 金幣錢包 (`GiCoins`)、EXP 升級經驗 (`GiUpgrade`)、物語點 (`GiSparkles`)。
- **角色特質與記錄**：個人命刻時鐘 (`GiPocketWatch`)、三維六向情感羈絆 (`GiBrokenHeart`, `GiEyeball`, `GiHeartShield` 等)、消耗品捷徑 (`GiRoundBottomFlask`, `GiCrystalBall`)。
- **物種、定位與裝備類別**：野獸／構造體／惡魔／元素／類人／怪物／植物／不死等物種圖標；暴徒／獵人／法師／破壞者／衛士／輔助等定位圖標；近戰／遠程／防具／盾牌等裝備類別圖標。

#### 軌道 2 豁免：一般功能性 UI 控件 (Functional UI Control Exemption)
**純功能性操作控件不受本軌道約束**，無須改用 Game-Icons.net，可直接使用純 Unicode 排版字符或既有圖示庫：

- **適用範圍**：返回／上一頁、關閉／打叉、搜尋、新增、折疊展開箭頭、前後切換、排序、篩選、複製、刪除等**純操作意涵、不承載世界觀敘事**的控件。
- **允許字符**：`←` `→` `↑` `↓` `✕` `×` `＋` `－` `✓` `✗` `➔` `⇄` `⌄` `⌃` 等純排版字符。
- **判定準則**：若將該圖示換成純文字（如「返回」「關閉」）後，**語意完全不變且不損失沉浸感**，即屬功能性控件，適用本豁免。
- **邊界**：同一控件若同時承載敘事意涵（例如「翻開魔導書」而非單純「返回」），則回歸本軌道主體，須使用 Game-Icons.net。
- **`lucide-react` 之適用範圍（2026-10-04 裁定，硬性）**：`lucide-react` 為**現代極簡扁平圖標庫**（均勻描邊、幾何網格），與本專案羊皮紙＋襯線＋Game-Icons 實心剪影的視覺語彙**互斥**。故：
  - **僅允許**用於上述功能性控件（返回、關閉、搜尋、新增、折疊、排序、篩選、複製、刪除、上傳下載、顯示切換、Toast 狀態等）。
  - **嚴禁**用於任何敘事槽位——物種、職業範本、定位、冒險資源（HP/MP/IP/物語點）、裝備類別、屬性、反派階級、區塊標題、徽章、空狀態插圖。此類一律 `react-icons/gi`。
  - **反例（2026-10-04 已修正）**：曾以 `PawPrint`／`Cpu`／`Flame`／`Zap`／`Dna`／`Leaf`／`Ghost`／`User` 當 8 物種頭像、以 `Copy`／`Trash2`／`Edit3` 當步驟導航圖示、以 `Heart`／`Sparkles` 當 HP／MP——皆屬敘事槽位誤用。
  - 稽核工具：`scripts/audit_lucide_usage.py`（列全部使用點）、`scripts/apply_stage3_icon_swap.py`（精確字面值替換＋匯入自動修剪）。

### 軌道 3：零 Emoji 鐵律 (Zero Emoji Policy)
- **整站嚴禁使用任何 Unicode Emoji**（嚴禁 ⚔️、🛡️、🔮、🧪、⚠️、✨、❌、✅、📜、👑、🩸、🏹 等）。
- **Emoji 與排版字符之區分（重要）**：本鐵律所禁者為**彩色圖像化 Emoji（Emoji Presentation）**；軌道 2 豁免條款所列之純幾何／排版字符（`←` `✕` `✓` `✗` `➔` `⇄` `✦` `❖` `★` `◆` `①`~`⑤` 等）**不在此限**。前者為圖像，後者為字體排印符號。
- 警示請使用 `GiHazardSign`，成功請使用 `GiCheckMark`，武器請使用 `GiBroadsword` 或 `GiCrossedSwords`，書籍請使用 `GiSpellBook`，英雄等級請使用 `GiLaurelCrown`。
- **⚠️ 語意哨兵例外（極重要）**：`⚡`（U+26A1）雖屬 BMP 平面字符，仍為 Emoji。該字元曾在本專案中另具**語意哨兵**用途（附加於攻擊性咒語名稱末尾，供程式以 `.includes('⚡')` 判定攻擊性咒語）。
  - ✅ **2026-10-04 已完成結構化遷移**：判定改由 `SPELLS_DATA[...].isOffensive` 欄位承載，舊存檔由 `migrateSpellSentinel()` 正規化；判定路徑（`spells.js`／`npcEngine.js`／`skillFormulaEvaluator.jsx`）一律以跳脫序列 `'\u26A1'` 表示，並由 `npm run test:sentinel` 的 H 區段守護。
  - **故「嚴禁刪除」之限制已解除**：殘留的 `⚡` 僅存於顯示與匯出字串，可依軌道 3 一併清除。詳見 `AGENTS.md` §3.1。

### 軌道 3 附錄：符號詞彙表（2026-10-04 裁定）

凡「需要一眼辨識、但不承載身份圖像」的標記，一律採用下表**封閉詞彙**，不得自行發明新符號。此表所選皆為**排版字符（dingbat）**——由字體自身字形繪製、單色、繼承文字顏色、隨字級縮放，與羊皮紙內文同調；嚴禁以彩色 Emoji 替代。

| 符號 | 語意 | 取代之 Emoji |
|---|---|---|
| `★` | Boss／冠位／反派階級 | `👑` `🔥` |
| `❖` | 定位技能 | `🛡️`（定位語境） |
| `✦` | 特殊規則／種族特質／咒語容量 | `📜` `🔮`（規則語境） |
| `✕` | 負面技能／負面效果 | `⛓️` `💀` |
| `※` | 提示／備註（非警告） | `💡` `📍` `🔗` `⏳` |
| `△` | 警告／注意 | `⚠️` |
| `◈` | 陣營／勢力標籤 | `🏷️` |
| `▽` `▼` `◆` | 弱點／抗性／免疫 | `⚡`（相性摘要語境） |
| `●` | 資源滿值指示 | `🔵` |
| `◷` | 命刻／時鐘 | `⏳` |
| `✎` | 編輯（功能性控件） | `✏️` |

**優先序鐵律**：凡官方機制符號（九相屬性、射程、動作分類、危機）**一律 `.fu-icon`（軌道 1）**，不得以本表 dingbat 替代；本表僅適用於軌道 1 未涵蓋的敘事／狀態錨點。承載**身份辨識**（物種、範本、職業、定位）者仍歸軌道 2 的 `react-icons/gi`，不屬本表範圍。

---

## 📌 核心規則二：規則手冊依據標準 (Official Rules Baseline)

1. **官方英文與民間漢化雙軌權威基準 (Dual-Standard Rule Baseline)**：
   - **官方英文最新勘誤版 (`Fabula_Ultima_Core.pdf` Core Rulebook v1.1 Errata)**：代表最新官方平衡調整與絕對權威機制標準。所有職業技能機制、數值公式、技能等級上限 (maxSL)、觸發時點與判定限制，**一律嚴格以此為準**。
   - **民間漢化版**：代表繁簡在地化中文翻譯標準。所有中文技能名稱、機制術語、身世背景與名詞翻譯體系，**一律依據民間漢化規範**。
   - **衝突裁決原則**：一旦民間漢化版與官方英文最新勘誤版存在機制差異、數值遺漏、舊版殘留或條款衝突，**無條件以官方英文為最高優先**，並在保持民間漢化譯名風格的前提下補全校準。
2. **手冊與拓展開關控制 (Sourcebook Toggle System)**：
   - 包含核心規則書在內的所有手冊與拓展（核心、高等奇幻、科技奇幻、自然奇幻、特典合輯、公測修訂）皆提供自由打勾開關，讓玩家依跑團團務需求自由啟閉（核心亦可自由取消打勾）。
3. **官方創角合規檢驗 (Character Creation Rules)**：
   - 起始 5 級必須分配在 2~3 個職業中（單職最高 4 級，特技總點數 SL 必須等於等級）。
   - 起始 4 項屬性基礎值分配總和必須嚴格等於 32（提供 4 組 d8、專精、均衡、特化配置）。
   - 初始裝備預算固定 500z，剩餘預算加上擲骰 2d6 × 10 結算為開局儲蓄。
4. **專有機制與子系統零臆測規範 (Zero-Hallucination on TRPG Subsystems)**：
   - 凡涉及《Fabula Ultima》專有子系統（如造物專案 Projects、修補匠小工具 Gadgets、儀式魔法 Rituals、忠實夥伴 Faithful Companion、營地休整等），**嚴禁憑記憶或泛用 RPG 慣例自行編造等級階級、不存在的屬性檢定或簡化數值**。
   - 實裝前必須使用工具直接閱讀官方 PDF 原書（`Fabula_Ultima_Core.pdf` 與民間漢化版）對應章節，逐條核對官方原始公式、流程步驟與表格倍率（例如造物成本公式 `效力 × 範圍 × 使用次數`、缺陷減免 25%、進度公式 `成本 / 100` 等），確保機制 100% 忠於原著。
5. **官方裝備類別名詞定譯鐵律 (Equipment Terminology Policy)**：
   - 凡涉及官方英文中所有 Martial 相關裝備與特長（Martial melee weapons, Martial ranged weapons, Martial armor, Martial shields），在中文體系中**一律嚴格固定翻譯為『職業』**（即『職業近戰武器』、『職業遠程武器』、『職業防具』、『職業盾牌』）。
   - **絕對嚴禁翻譯為『軍用』**。此為民間漢化與中文 TRPG 社群之絕對統一標準。

---

## 📌 核心規則三：純中文顯示鐵律 (Pure Chinese Display Policy)

為確保使用者介面與規則文本的閱讀沉浸感與視覺純淨度，全站面向使用者的規則描述、機制說明、職業技能、阿爾卡納、咒語法術、道具與系統文案，**一律嚴格禁絕以「括號附帶英文原名/譯名」的格式呈現（例如嚴禁 `(Sword)`、`(Arcanum of the Forge)`、`(fire, heat, metal)`、`(Merge)`、`(Dismiss)`、`(Basic)`、`(Elementalist)` 等）**：
1. **名詞與標題純粹化**：全部直接採用民間漢化標準中文名稱，不附加任何英文原名註記。**此禁令涵蓋介面區塊標題與步驟標籤**（例如 `IDENTITY`／`ATTRIBUTES`／`BASIC ATTACKS`／`Enemies & Bosses` 一律刪除，只留中文）。
2. **唯一允許之縮寫**：僅允許系統必備的官方核心數值縮寫標識（例如：【DEX/INS/MIG/WLP】、【HP/MP/IP】、【HR】、【SL】、【DEF/M.DEF】、金幣【z】、骰子規格【d6/d8/d10/d12/d20】）。其餘所有名詞皆為純中文。
3. **規則概念速查 (Rule Codex)**：標題、分類、各階發明、阿爾卡納領域與效果、法術名稱與說明等，一律保持純粹中文，徹底去除任何中英夾雜或括號英文。
4. **專有名詞例外（2026-10-04 裁定，硬性格式）**：**職業、範本、物種**三類專有名詞，**一律以「中文 · ENGLISH」呈現**，英文置於中文之後、以半形空格＋間隔號 `·`＋半形空格分隔。
   - **唯一正確格式**：`暴徒 · BRUTE`、`吟唱者 · ORATOR`、`野獸 · BEAST`
   - **嚴禁格式**：`BRUTE（暴徒）`（英文在前）、`暴徒（BRUTE）`（括號夾註，即本規則第 1 點所禁之形）、`暴徒 (BRUTE)`、`暴徒 - BRUTE`
   - **適用範圍僅限上述三類**。**英雄技能、裝備、咒語、狀態、規則條文、介面區塊標題一律不適用**，仍為純中文。
   - **英文名必須取自官方英文原書，嚴禁憑記憶編造**（依規則二.4）。若某專有名詞查無官方英文（例如 NPC 定位分類「暴徒／獵人／法師／破壞者／衛士／輔助」在官方 Core 書中並不存在），**則不標英文**，寧缺勿造。

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
   `Get-ChildItem -Path "src" -Recurse -File | Where-Object { $_.Extension -in '.js','.jsx','.json','.css' } | Select-String -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF\u26A1\u26A0\u2705\u274C\u26D3\u2620\u2744\u2600\u23F3\u270F\u2728\u2694\u2714\u2716]"`
   確保全站源碼中無任何 Emoji 字符。
   **此正則同時涵蓋代理對（U+1F000+）與 BMP 平面 Emoji**；原始版本僅能命中代理對，檢出率不足四成，已修正。
   **不包含**軌道 2 豁免之純排版字符（`←` `✕` `✓` `✗` `➔` `⇄` `✦` `❖` `★` `◆` `①`~`⑤`）。
2. **構建驗證**：
   執行 `npm run build`，確保無任何編譯報錯與未解析的依賴。

---

## 📌 核心規則六：源碼審查與事實唯一基準 (Single Source of Truth Audit Protocol)

當使用者要求進行任何規格核對、技能稽核（Audit）、代碼巡檢或規則概念比對時：
1. **嚴禁以歷史報告或對話記憶為依據**：絕對禁止調閱、引用過往對話產生的舊分析報告、歷史 Session 草稿或暫存文件作為現況結論。過往草稿極可能已被修復或已過時。
2. **以當前工作區實際源代碼為唯一事實基準（Git HEAD & Active Source Code）**：必須以當前項目實際檔案（如 `src/features/...`、`rulesData.json`）的最新即時內容進行檢索與核驗，確保審查結論 100% 精確反映此時此刻系統的真實代碼狀態。

---

## 📌 核心規則七：效果文本九相屬性內聯渲染鐵律 (Inline Attribute Icon & Color Invariant)

為強化沉浸感與視覺辨識度，全站面向使用者的機制說明、技能效果、咒語描述、阿爾卡納、發明與規則條文中，凡提及官方九相傷害屬性時，必須遵循以下鐵律：

1. **九相屬性內聯排版規範**：
   - 凡文本中出現官方九相屬性（物理 `p`、風 `a`、電 `b`、暗 `d`、土 `e`、火 `f`、冰 `i`、光 `l`、毒 `t`）或其衍生詞彙（如「火屬性」、「暗屬性傷害」、「物理抗性」、「毒傷」、「傷害【火】」等）：
   - **一律必須透過 `renderTextWithAffinities` 函數動態渲染**，自動為該詞彙附帶官方字型圖示（`.fu-icon`）與對應的官方 Tailwind 色彩（如火 `text-red-700 font-bold`、風 `text-cyan-700 font-bold`、冰 `text-blue-700 font-bold` 等）。
   - 括號屬性格式（如【火】、【物理】）自動渲染為包含符號與文字的高亮組合【<span class="fu-icon">f</span>火】。

2. **嚴格防誤傷邊界規則 (False-Positive Prevention)**：
   - 嚴格避開非傷害屬性之日常或機制詞彙，嚴禁誤加圖標：
     - **異常狀態**：「中毒」（狀態效果，非毒屬性傷害）。
     - **感官與風格**：「微光視覺」（非光屬性）、「曲風」（音樂型態，非風屬性）、「暴風」（天氣描述）。
     - **防禦數值**：「物理防禦」、「物防」（DEF 數值，非物理傷害）。
     - **武器分類**：「火器」（武器類別，非火屬性傷害）。

3. **無冗餘標籤原則 (Badge Deduplication Policy)**：
   - 當卡片或條目的效果文本已內聯呈現屬性圖示與色彩時，標題旁的重複屬性小標籤（如舞步與魔奏音調的屬性小徽章）應予隱藏或移除，避免視覺繁複，維持介面精簡純粹。

4. **字體基線零下沉對齊鐵律 (Zero Baseline Drift Invariant / Typographic Baseline Alignment)**：
   - **嚴禁外層使用 `inline-flex`**：在連續文本流中，任何內聯解析的屬性字眼（包括 `renderTextWithAffinities` 等函數動態渲染之 DOM）**外層容器嚴格禁絕使用 `inline-flex`**。因為 `inline-flex` 會建立獨立的彈性格式化上下文（Flexbox Formatting Context），瀏覽器會依據中線或子項目邊框盒合成基線，導致包含中文文字在內的整個區塊相對於周圍自然文字產生 2px~5px 的「向下沉陷（Baseline Drop）」。
   - **純 `inline` 文字流直接承襲基線**：外層包裹容器一律使用原生純內聯元素（`<span>` / `inline`），確保內部的中文屬性文字直接依附於父層段落的排印基線，實現 **0px 基線偏差（0 Baseline Drift）**。
   - **圖標獨立光學對齊**：官方字型圖標（`.fu-icon`）自身設為 `display: inline-block; vertical-align: -0.08em; line-height: 1;`，利用微小光學負位移補償中文字符（方塊字無降筆部首）與圖標幾何中心的視覺高度差，並以微量水平邊距（`mx-0.5` 或 `mr-0.5`）保持間隔，徹底根絕字體下沉與基線階梯感。


