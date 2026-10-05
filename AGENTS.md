# AGENTS.md — DeepSeek Harness 執行準則（FU Companion）

> **本檔不取代、不修改 `GEMINI.md`。**
> `GEMINI.md` 仍是本專案最高持久規範文件；本檔只補足 **DSH（DeepSeek Harness）執行環境**的落差、
> 記錄已知歧義與技術債基準，並同步已裁定的圖示分類基準。
>
> Antigravity / Gemini 讀 `GEMINI.md`；DSH 讀本檔，且**以 `GEMINI.md` 為上位規範**。
> 兩份文件並存，互不覆寫。

---

## 0. 規範優先序

| 順位 | 來源 | 效力 |
|---|---|---|
| 1 | `GEMINI.md` | 最高持久規範，不可被本檔推翻 |
| 2 | 本檔 `AGENTS.md` | DSH 執行細則；補足落差、消解歧義 |
| 3 | `PROJECT_SPEC.md` §4 | 僅在與上述兩者不衝突時適用（**注意：本文件已過時，見 §5**） |
| 4 | `PROJECT_CHANGELOG.md` / 任何歷史報告 | **僅供參考，嚴禁作為事實依據**（依 `GEMINI.md` 規則六） |

---

## 1. 環境事實（DSH 專用）

- **工作目錄**：`E:\MINGWAN\Projects\FU Companion`
- **可用工具**：`pwsh`、`read`、`write`、`edit`、`glob`、`grep`
- **建置指令**：`npm run build`（Vite 6，實測約 4.2 秒，exit 0）
- **建置產物**：`dist/`，JS 1,870 kB（gzip 532 kB）。chunk-size 警告為**已知既有現象**，非本次改動造成。
- **測試指令**：`npm test`（實測 **60/60 + 33/33 + 94/94 + 56/56 + 92/92 ＋ Emoji 掃描** 通過，exit 0）。
  五組測試 ＋ 一道自動關卡：
  - `npm run test:emoji` —— **規則五.1 已自動化**（見 §3.2）
  - `npm run test:sentinel` —— 哨兵遷移與回歸護欄
  - `npm run test:propernouns` —— 專有名詞對照與格式鐵律
  - `npm run test:projects` —— 造物專案成本與每日推進公式（對照原書官方範例）
  - `npm run test:resources` —— 職業資源池（上限公式與重置規則，對照原書）
  - `npm run test:gourmet` —— 美食家食材／食譜書（口味組合、d12 效果表、等級縮放，對照原書）
  測試源碼位於受版控的 `tests/`；bundle 產物輸出至 `.test-build/`（已列入 `.gitignore`）。
  ⚠️ `scratch/` 整個目錄**不在版控內**（`.gitignore:27`），凡置於該處的測試或 bundle 都會與源碼脫鉤——
  2026-10-03 的舊 `stage1.bundle.mjs` 即因早於源碼 40 秒打包，執行後產生 1 筆假失敗。**測試一律放 `tests/`。**
- **樣式系統**：Tailwind 3。全站為**羊皮紙暖色調**（`#fbf7ee` / `#3c2415` / `#d6c7ab`），**非**深色石板底。
- **資料層**：純 localStorage，四個 key：
  `fu_companion_npc_library`、`fu_companion_character_roster`、
  `fu_companion_active_combat`、`fu_companion_fate_clocks`

### 1.1 官方 PDF 抽取（規則二.4 的必要工具）

**工作區可讀的官方原書（皆在專案目錄之外，`E:\MINGWAN\TRPG\Fabula ultima\`）**：

| 書 | 檔名 | 頁數 | 用途 |
|---|---|---|---|
| 核心規則書 v1.1 | `最終幻想1.1\Fabula_Ultima_TTJRPG_Need_Games,_Rooster_Games_Fabula_Ultima_Core.pdf` | 362 | 機制最高權威 |
| 高度奇幻手冊 | `最終幻想1.1\..._High_Fantasy_Atlas.pdf` | 202 | 拓展職業 |
| 自然奇幻手冊 | `最終幻想1.1\..._Natural_Fantasy_Atlas.pdf` | 210 | 拓展職業 |
| 科技奇幻手冊 | `最終幻想1.1\..._Techno_Fantasy_Atlas.pdf` | 218 | 拓展職業 |
| 怪物圖鑑 Vol.1 | `Fabula Ultima Bestiary Vol. 1 KS_preview.pdf` | 366 | **NPC 定位（職業）來源** |
| 官方特典合輯 | `最終幻想1.1\Fabula_Ultima_TTJRPG_Bonus_Collection.pdf` | 48 | 兩筆 bonus 職業＋其餘特典內容 |

- ⚠️ `read` 工具**無法**直讀 PDF；`pdftotext` / `pdftk` **皆未安裝**。
- ✅ **`pypdf 6.19.0` 已安裝**（DSH bundled Python）。
  - 🚨 **2026-10-04 實測發現：本行原先記載的「已安裝」是假的**——`import pypdf` 直接
    `ModuleNotFoundError`，意即 `GEMINI.md` 規則二.4「實作前必須先讀官方原書」
    在該日之前**根本無法執行**。此為本檔第二個被實證推翻的「環境事實」（第一個見 §4 A）。
  - 已以 `python -m pip install pypdf` 補上。**日後新增此類環境事實，必須在同一輪實跑驗證指令**：
    `& $py -c "import pypdf; print(pypdf.__version__)"`
  - `fontTools` 狀態未複驗（文字抽取不需要它）。
- **抽取工具**：`scratch/pdf_text.py`（`scratch/` 不在版控內，重建即可）。
  用法：`python scratch/pdf_text.py <pdf> <起始頁> <結束頁>`，或 `--search "關鍵字" [前後頁數]`。

```powershell
# DSH bundled Python（路徑隨環境而異；以 $env:DSH_* 或 harness 回報的 python 路徑取代）
$py = "<DSH bundled python>\python.exe"
$pdf = "<原書所在目錄>\最終幻想1.1\Fabula_Ultima_TTJRPG_Need_Games,_Rooster_Games_Fabula_Ultima_Core.pdf"
& $py "scratch\pdf_text.py" $pdf <起始頁> <結束頁>
```

> ⚠️ 本節原本記有**本機絕對路徑**（含 Windows 使用者名稱）。本 repo 為**公開**，
> 已於 2026-10-04 改為佔位符。實際路徑請由環境自行取得，**不要把使用者名稱寫回本檔**。

> ⚠️ **頁碼偏移因書而異**（2026-10-04 實測，**不可套用單一規則**）：
>
> | 書 | 偏移 | 實測 |
> |---|---|---|
> | 核心規則書 | **PDF = 印刷 + 2** | 印刷 p.134 → PDF p.136 |
> | 高度／自然／科技奇幻手冊 | **+2** | 印刷 p.159 → PDF p.161 |
> | **官方特典合輯** | **0（無偏移）** | 印刷 p.7 → PDF p.7 |
>
> 引用頁碼前**務必先確認該書的偏移**，不要沿用上一本的。
>
> ⚠️ **封面頁文字層有重複行**（該頁採 faux-bold 疊印）；其餘內文頁抽取乾淨，
> 表格數值可直接用於機制核對。

### 1.2 民間漢化內容（譯名權威，規則二.1）

**用途**：**只管譯名，不管機制**。機制一律以英文原書為準（見 §1.1）。

#### ✅ 內容位置：**repo 內就有**（不必解 CHM）

> 🚨 **2026-10-04 更正**：先前記載「CHM 為 LZX 壓縮、無法解開」——**完全錯誤**。
> 漢化內容**早已解開並收進本 repo**，而且是轉好的 Markdown。

**首選來源（版控內）**：

```
resources/角色卡/
  ├─ README.md                                  ← 28 職業對照總表（正式名 vs 測試版舊譯名）
  ├─ 01_Core_Rulebook/                          官方原書 PDF 節錄（25 檔）
  ├─ 02_High_Fantasy_高魔奇幻/
  │    ├─ 0X_职业_*.pdf                         官方原書 PDF 節錄
  │    └─ CHM_Playtest_中文翻译/                ★ .md + .html（CHM 漢化）
  ├─ 03_Natural_Fantasy_自然奇幻/  （同上結構）
  ├─ 04_Techno_Fantasy_科技奇幻/   （同上結構）
  └─ 05_Bonus_节日与额外扩展/      （同上結構）
```

**規模**：106 檔 / 92 MB（54 PDF、26 MD、25 HTML、1 XLSX）。

**漢化抽出來源（版控外，僅供追溯）**：
`E:\MINGWAN\TRPG\Fabula ultima\DLC\《Fabula Ultima最终物语》全扩展不全书V1.0(1)\`（26 個 HTML）。
CHM 旁的 `.html` 只是 301 bytes 的空殼 frameset，**無用**；真正的內容在那個同名資料夾。

> 🔑 **教訓（兩層）**：
> ① 找不到內容時，**先看 repo 內有沒有已經整理好的資源**，再去解外部檔案。
> ② `hh.exe` 解不開時，**先看檔案旁邊有沒有已經解開的資料夾**——不要急著實作 LZX。

#### 抽取指令（僅在需要重新抽取時）

```powershell
# 用 lxml 把 DLC 資料夾的 26 個 HTML 抽成純文字
# 輸出到 scratch/chm_content/（gitignored）——repo 內已有更好的 .md 版本，通常不需要跑
& $py "scratch\extract_chm_html.py"
```

> ⚠️ **譯名衝突未解**：`README.md` 的「正式中文名」欄位與 CHM 舊譯名**不一致**（7 個職業）。
> 本專案目前採用 **CHM 舊譯名**（依使用者裁定）。詳見 §6 H。

> ⚠️ **本檔為「不全書」**：缺漏的內容**不代表官方沒有**，只代表這份漢化沒收錄。
> 查不到譯名時**不得反推為「官方無此內容」**，只能標記為「CHM 未收錄」。

#### 已知譯名對照（取自檔名與內容）

| 英文 | 漢化 | 本專案 | 狀態 |
|---|---|---|---|
| Quirk | **金手指** | 金手指 | ✅ 相符 |
| High Fantasy | **高度奇幻** | 高度奇幻 | ✅ 已於 2026-10-04 修正 |
| Natural Fantasy | 自然奇幻 | 自然奇幻 | ✅ |
| Techno Fantasy | 科技奇幻 | 科技奇幻 | ✅ |
| Custom Weapon | 自定義武器 | 自訂武器 | ⚠️ 待統一 |
| Zero Power | 底力技 | （未收錄） | — |
| Technospheres | 魔晶石 | （未收錄） | — |
| Camp Activities | 營地活動 | 營地活動 | ✅ |
| Heroic Skills | 英雄技能 | 英雄技能 | ✅ |

---

## 2. `GEMINI.md` 七大規則在 DSH 的對應實作

### 規則一：圖示三軌鐵律（已於 2026-10-03 裁定分流）
- **軌道 1（官方字型）**：完全沿用 `.fu-icon` / `<FUIcon />` / `renderTextWithAffinities`，零變更。
- **軌道 2（敘事性遊戲圖示）**：職業、範本、物種、定位、資源、狀態、裝備類別等**具世界觀敘事意涵**者，一律 `react-icons/gi`。
- **軌道 2 豁免（功能性 UI 控件）**：返回、關閉／打叉、搜尋、新增、折疊箭頭等**純操作控件**，可使用純 Unicode 排版字符（`←` `✕` `✓` `➔` 等）**或既有圖示庫**，不強制改用 Game-Icons.net。
  - 判定準則：換成純文字後語意不變、且不損沉浸感者 → 功能性控件，適用豁免。
  - **`lucide-react` 硬性範圍（2026-10-04 裁定）**：**僅限**功能性控件。敘事槽位（物種、範本、職業、定位、資源、裝備類別、屬性、反派階級、區塊標題、徽章、空狀態）一律 `react-icons/gi`——lucide 的均勻描邊幾何語彙與羊皮紙＋gi 實心剪影互斥。
- **軌道 3（零 Emoji）**：彩色圖像化 Emoji 全站禁止；純排版字符（`✦` `❖` `★` `◆` `①`~`⑤`）不在此限。
  - **符號詞彙表（2026-10-04 裁定）**：需要視覺錨點的敘事／狀態標記，一律採 `GEMINI.md`「軌道 3 附錄」的**封閉詞彙** `★ ❖ ✦ ✕ ※ △ ◈ ▽ ▼ ◆ ● ◷ ✎`，不得自行發明新符號。官方機制符號仍優先走 `.fu-icon`。
- ⚠️ 檢測正則已同步更新至 `GEMINI.md` 規則五.1（與本檔 §3 同版本）。

### 規則二：規則手冊依據標準
- 官方英文 Core v1.1 為機制最高權威；民間漢化為中文譯名標準；衝突時官方英文優先。
- ✅ **官方原書可讀**（位置與抽取方式見 §1.1）。涉及《FU》專有子系統的實作前，
  **必須先抽取對應章節逐條核對**，嚴禁憑記憶編造等級階級、檢定或數值。
- ✅ **譯名權威＝CHM（2026-10-04 使用者裁定）**：中文譯名一律以《Fabula Ultima 最終物語》全擴展不全書 V1.0 為準。
  **只管譯名，不管機制**——CHM 決定「中文怎麼寫」，英文原書決定「規則是什麼」，兩者職責不可互換。抽取方式見 §1.2。
- **「職業」定譯鐵律**：Martial 系列一律譯「職業」（職業近戰武器／職業遠程武器／職業防具／職業盾牌），**嚴禁「軍用」**。

### 規則三：純中文顯示鐵律
- 禁止「中文名（English）」括號附註格式。
- 唯一允許縮寫：`DEX/INS/MIG/WLP`、`HP/MP/IP`、`HR`、`SL`、`DEF/M.DEF`、`z`、`d6~d20`。
- ⚠️ 邊界案例見 §5 技術債 C 項（物種英文標籤、`【Playtest】` 等）。

### 規則四：文案與顯示文本預審協議
`GEMINI.md` 要求以 **Antigravity Artifact** 建立 `implementation_plan.md` 並啟用 `RequestFeedback: true`。
**DSH 無 Artifact 機制**，故採用下列等效流程：

1. 以 `write` 在工作區建立 `implementation_plan.md`（或任務專屬檔名），完整列出預計文案。
2. 以 `ask_user_question` 請使用者確認或修訂。
3. **取得明確確認後，方可進行代碼實裝。**

> **未經確認，不得實作任何面向使用者的文字。** 此為硬性關卡。

### 規則五：防退化自檢流程
每次代碼改動完成後、回覆使用者前，**必須**依序執行：

1. **Emoji 掃描** —— 使用 §3 修正版正則（非 `GEMINI.md` 原始版本）。
2. **建置驗證** —— `npm run build` 必須 `exit 0`。

兩項未通過即不得宣稱完成。

### 規則六：源碼審查與事實唯一基準
- 一律以**當前工作區實際源碼**為唯一事實基準。
- **嚴禁**引用歷史報告、舊 Session 草稿或 `PROJECT_CHANGELOG.md` 作為現況結論。
- ⚠️ 本條已獲實證支持：`PROJECT_CHANGELOG.md` 三處宣稱「零 Emoji 合規」，與實測結果嚴重不符（見 §4）。

### 規則七：效果文本九相屬性內聯渲染鐵律
- 九相屬性詞彙一律經 `renderTextWithAffinities` 渲染（`src/components/ui/FUIcon.jsx`）。
- **防誤傷**：`中毒`／`微光視覺`／`曲風`／`暴風`／`物理防禦`／`物防`／`火器` 等不得加圖示。
- **零冗餘標籤**：已內聯屬性圖示者，移除標題旁重複徽章。
- **基線零下沉**：外層容器**嚴禁 `inline-flex`**，一律純 `inline`；`.fu-icon` 自身為
  `display:inline-block; vertical-align:-0.08em; line-height:1`。

---

## 3. Emoji 檢測：修正版正則（取代 `GEMINI.md` 規則五.1）

### 問題
`GEMINI.md` 規則五.1 提供的正則：

```powershell
Get-ChildItem -Path "src" -Recurse -File | Select-String -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF]"
```

**只能命中代理對（U+1F000 以上）**，會完全漏掉所有 BMP 平面 emoji。
經實測（2026-10-03，哨兵遷移**前**的原始基準），本專案實際違規數為：

| 檢測方式 | 命中行數 | 命中次數 |
|---|---|---|
| `GEMINI.md` 原始正則 | **41** | **98** |
| 本檔修正版正則（emoji，含 BMP） | **149** | **282** |

原始正則的**檢出率僅 27.5%（按行）／34.8%（按次數）**——
這是歷次「零 Emoji 檢驗通過」卻仍殘留大量 emoji 的直接原因。

> ⚠️ 上表為**歷史基準**，用以證明正則修正的必要性；**現行殘留數見 §4 A（已清零 0 行 / 0 次）**。

> ⚠️ **單位陷阱**：`Select-String` 預設**每行只回傳一筆**（行數）；
> 加上 `-AllMatches` 則回傳**每個匹配**（次數）。
> 同一份源碼，行數與次數可相差近兩倍（例：`roles.js` 為 7 行 / 37 次）。
> **引用數字時必須標明單位。**

### 修正版正則（DSH 一律使用此版）

```powershell
Get-ChildItem -Path "src" -Recurse -File |
  Where-Object { $_.Extension -in '.js','.jsx','.json','.css' } |
  Select-String -Pattern '[\uD83C-\uDBFF\uDC00-\uDFFF\u26A1\u26A0\u2705\u274C\u26D3\u2620\u2744\u2600\u23F3\u270F\u2728\u2694]'
```

涵蓋 `GEMINI.md` 原始版本漏掉的高頻 BMP emoji：
`⚡ U+26A1`、`⚠️ U+26A0`、`✅ U+2705`、`❌ U+274C`、`⛓️ U+26D3`、`☠️ U+2620`、
`❄️ U+2744`、`☀️ U+2600`、`⏳ U+23F3`、`✏️ U+270F`、`✨ U+2728`、`⚔️ U+2694`。

> 註：`✦ U+2726`、`✓ U+2713`、`✗ U+2717`、`➔ U+2794`、`❖ U+2756`、`★ U+2605`、`◆ U+25C6`、`①`~`⑤` 屬**排版字符（dingbat）而非 emoji**。
> 依 `GEMINI.md` 軌道 2 豁免條款與軌道 3「Emoji 與排版字符之區分」，**明確允許保留**，且**刻意不納入**上述正則。

### 3.1 ⚡ 語意哨兵 —— ✅ 已於 2026-10-04 完成結構化遷移

**原設計**：攻擊性咒語以 `⚡`（U+26A1）為名稱後綴，程式以 `.includes('⚡')` 判定。
該隱式約定已廢除，改由結構化欄位承載：

- **資料層**：`src/features/npc-workshop/data/spells.js` 的 `SPELLS_DATA[...].isOffensive === true`。
- **判定入口**：同檔 `isOffensiveSpell(name)`——先做舊哨兵相容，再查結構化欄位。
- **舊存檔遷移**：`src/features/npc-workshop/utils/npcEngine.js` 的 `migrateSpellSentinel()`／`migrateNpcState()`，
  正規化技能名稱、咒語書選項、已選咒語與物種咒語鍵，並為「僅以哨兵表達攻擊性」的舊資料補上 `spellData.isOffensive`。
- **原始碼零 Emoji 字面量**：判定路徑一律以跳脫序列 `'\u26A1'` 表示
  （`spells.js:9`、`npcEngine.js:13`、`skillFormulaEvaluator.jsx` 的正則）。
- **回歸護欄**：`npm run test:sentinel` 的 H 區段會檢查上述三檔不含哨兵字面量。

**殘留的 6 行顯示用 `⚡` 已於同日階段 2 一併清除**（原清單：`NPCWorkshop.jsx` 的技能分類圖示、複製文本前綴、Markdown 匯出標題、相性摘要標籤，以及 `constants.js` 的 `CATEGORIES.icon` / `TYPE_STYLES.emoji` 兩個退路欄位）。

> ✅ **`⚡` 現已全站零殘留**（`src/` 內僅存於 `spells.js:9`／`npcEngine.js:13`／`skillFormulaEvaluator.jsx` 的跳脫序列 `'\u26A1'`，屬相容用、不渲染）。
> **判定邏輯與顯示層雙雙與哨兵解耦**，本條目結案。

### 3.2 規則五.1 已自動化 —— ✅ 2026-10-04 起由測試把關

`npm run test:emoji`（`tests/emojiScan.test.mjs`）以**修正版正則**掃描 `src/` 全部
`.js`/`.jsx`/`.json`/`.css`，命中即 `exit 1`，並列出 `檔案:行 U+碼位` 與該行內容。

**為什麼要做成測試**：2026-10-04 一天內，**同一種失誤發生三次**——
把 `⚠️` 寫進自己的註解（`properNouns.js`、`tinkererProjects.js`、`classResources.js`），
每次都是靠手動掃描才在最後關頭抓到。手動關卡會漏，所以改成自動、排進 `npm test` 的第一道。

> ✅ **關卡有效性已驗證**：刻意注入一個 `U+26A0` → `exit 1` 並精準指出位置；
> 還原後 → `exit 0`。**一個不會失敗的測試等於沒有測試。**

---

## 4. 已知技術債基準（截至 2026-10 稽核）

> 本節為**現況快照**，供避免重複申報與誤判「新引入」之用。
> 依 `GEMINI.md` 規則六，每次稽核仍須以即時源碼重新驗證。

### A. Emoji 殘留 —— ✅ 已於 2026-10-04 清零（規則一軌道 3）
以**修正版正則**實測（`src/` 程式碼檔 75 個——`.js`/`.jsx`/`.json`/`.css`——共 38,619 行）：

| 時點 | 行（檔案:行） | 次 | 說明 |
|---|---|---|---|
| 2026-10-03 | 149 | 282 | 修正版正則首次套用（哨兵遷移**前**） |
| 2026-10-04 | 76 | 145 | 階段 1 哨兵遷移後 |
| 2026-10-04 | **0** | **0** | ✅ **階段 2 完成後** |

> ✅ **零 Emoji 鐵律首次真正達成**。`GEMINI.md` 規則五.1 的檢測正則現在能真正通過——
> 有別於 `PROJECT_CHANGELOG.md` 那三次與實測嚴重不符的「宣稱通過」（見 §5 C）。
>
> **執行依據**：`emoji-cleanup-decisions.xlsx` 逐列裁決表，80 列全數「採用建議」。
> 分頁圖示依使用者裁定改用 `react-icons/gi`（`GiRollingDices`／`GiCrossedSwords`／`GiSpellBook`）。
>
> **符號採用**（依 `GEMINI.md` 軌道 3 附錄封閉詞彙，括號為本次新增數）：
> `★`(6) `❖`(3) `✦`(3) `✕`(1) `※`(2) `△`(2) `◈`(3) `▽`(1) `▼`(1) `◆`(2) `●`(1) `◷`(1) `✎`(2)。
>
> **刪除而非替補者**：三處純裝飾浮水印（`opacity-[0.05~0.06]` 的 `🔓`／`🔥`／`🔮`）——
> 它們不承載語意，換符號只會多一個噪音。
>
> **資料層退路欄位已整欄移除**：`TYPE_STYLES.emoji`（十筆）、`CATEGORIES.icon`（五筆）、
> `ROLE_DESCRIPTIONS.icon`（六筆）。三者的 `fuIcon` / `Icon` 欄位早已完整覆蓋，
> 移除後連帶清掉六處「永不觸發的 fallback 三元式」（已改為直接渲染或 `null`）。
>
> **純文字輸出路徑**（複製文本／Markdown 匯出／ccfolia）一律改為純文字，不帶任何圖示——
> 該處渲染不出字型與 SVG。同時清掉匯出標題的英文 `(BASIC ATTACKS & ACTIONS)`（規則三）。

### B. 圖示庫分佈（規則一軌道 2）
清查方法：`scripts/audit_lucide_usage.py`（只計 JSX 使用點，不計匯入本身）。

| 時點 | lucide 檔 | gi 檔 | 同時使用 | lucide 使用點 |
|---|---|---|---|---|
| 2026-10-03（原始基準） | 26 | 37 | 18 | 243 |
| 2026-10-04（階段 3 完成後） | **26** | **42** | **23** | 敘事槽位 52 點已改 gi |

> ✅ **階段 3 已於 2026-10-04 完成**（commit `ce85f55`）：52 個誤用於敘事槽位者改為 gi。
> lucide 檔案數**不變**是正確結果——本階段不動功能性控件，只把敘事槽位換掉；
> gi 檔數上升 5 檔（`NPCCardPreview`／`NPCLibrary`／`CombatTracker`／`AddCombatantModal`／`CombatantCard` 由「純 lucide」轉為混用）。
>
> **判定準則**：功能性控件（返回／關閉／搜尋／新增／折疊／排序／篩選／複製／刪除／上傳下載／顯示切換／Toast 狀態）→ lucide 合規；
> 敘事槽位（物種／範本／職業／定位／資源／裝備類別／屬性／反派階級／區塊標題／徽章／空狀態）→ 一律 gi。
> 此準則已寫入 `GEMINI.md` 軌道 2 豁免條款。
>
> **離群診斷**：`character-sheet` 系列本來就全面使用 gi（`GiHealthNormal`／`GiLightningTear`／`GiSparkles`／`GiPocketWatch`／`GiCrossedSwords`），
> 誤用集中於 `npc-workshop` 與 `combat-tracker`——即歷史上由不同批次實作、未經同一次圖示稽核的兩個模組。

### C. 純中文邊界案例（規則三）—— 2026-10-04 大幅收斂
使用者裁定「**專有名詞例外**」後，規則三改為三段式（已寫入 `GEMINI.md`）：
**介面標題／步驟標籤一律純中文**；**職業／範本／物種用「中文 · ENGLISH」**；其餘照舊。

**本次已清除（面向使用者的英文標籤）**：
- `CharacterEditor.jsx` 六步驟的 `en` 欄位（`IDENTITY`／`ATTRIBUTES`／`CLASSES`／`EQUIPMENT`／`BONDS`／`HEROIC & CLOCKS`）與其渲染點 `{t.en}`
- `NPCWorkshop.jsx` 複製文本的 `(BASIC ATTACKS & ACTIONS)`／`(BASIC ATTACKS)`／`(SPELLS)`
- `NPCBuilder.jsx` 兩處步驟標題 `(Level & Rank)`／`(Boss & Negative Skills)`
- `CombatTracker.jsx` `(Enemies & Bosses)`
- `TinkererWorkshop.jsx` 三個公式標籤 `(Base Potency)`／`(Area Multiplier)`／`(Uses Multiplier)`
- `WayfarerCompanionModal.jsx` `（Species）`
- `BookCoverHub.jsx` `'CLICK TO OPEN'` → `'點擊翻開'`
- `ChimeristManager.jsx` 三個物種選項 `野獸 (Beast)` → `野獸 · BEAST`

**經裁定保留，不再是違規**：
- `SPECIES_THEMES` 的八個物種英文標籤（`'BEAST'`…`'UNDEAD'`）——物種屬專有名詞，
  且物種瓷磚本即中英並列（中文名一行、英文標籤一行）。
  ✅ 英文名已由原書 **Core p.302** 逐字核對：`beast, construct, demon, elemental, humanoid, monster, plant, undead`。

**仍待處理 / 刻意不改**：
- `BookCoverHub.jsx:104` 的 `FU COMPANION 《物語助手》`（品牌雙語並列，待裁定）
- `rulesData.json` 的 `秘儀師【Playtest】` 等英文標籤
- `CharacterEditor.jsx` 的 `✓` / `✗`（dingbat，依 2026-10-03 裁定允許）
- ⚠️ `NPCWorkshop.jsx` 的 ccfolia 參數 `{ label: "INIT", … }`——**這是外部工具（ccfolia）的欄位識別字，
  不是顯示文案，刻意保留**。改掉會破壞使用者既有的 ccfolia 聊天巨集。

### D. 規則七.4 `inline-flex` — **休眠狀態，非現行違規**
- `src/components/ui/FUIcon.jsx:107` 的 `showLabel` 分支使用 `inline-flex`。
- 經全站檢索，`showLabel` **無任何呼叫點**，屬死碼路徑。
- 同檔 `renderTextWithAffinities`（`:157`、`:164`）正確使用純 `inline`。
- **結論**：目前無實際基線偏移；若未來啟用 `showLabel`，須先改為 `inline`。

### E. 建置與測試
- `npm run build` 通過（exit 0，2026-10-04 實測 4.3 秒）。
- JS bundle 1,870 kB / gzip 532 kB，觸發 Vite chunk-size 警告（>500 kB）。
  建議未來以 `manualChunks` 或 `import()` 拆分，但**非當前規範要求**。
- `npm test` 通過（**60/60 + 33/33 + 94/94 + 56/56 + 92/92 ＋ Emoji 掃描**，exit 0）。
  已補上測試的模組：造物專案成本與每日推進（`test:projects`）、職業資源池（`test:resources`）、
  美食家食材／食譜書（`test:gourmet`）、專有名詞對照（`test:propernouns`）、
  哨兵遷移（`test:sentinel`）、零 Emoji（`test:emoji`）。
  **剩餘覆蓋缺口**：角色卡數值引擎（`characterEngine.js`）、戰鬥輪次狀態機、Fultimator 匯入匯出。
  下一個建議補的是**角色卡數值引擎**——它決定 HP/MP/IP 與所有衍生數值，錯了整張卡都是錯的。

---

## 5. 文件衝突與過時處（DSH 判讀依據）

### A. 圖示政策自相矛盾（已由 2026-10-04 裁定消解）
- `PROJECT_SPEC.md:26` 列「**圖標庫：`lucide-react`**」
- `PROJECT_SPEC.md:100` 卻寫「全站所有其餘圖標**默認一律從 Game-Icons.net** 選取，
  **嚴禁隨意混用現代極簡扁平圖標**」
- `GEMINI.md` 規則一軌道 2 與 `PROJECT_CHANGELOG.md:10` 皆只認 Game-Icons.net。

> lucide-react 正是「現代極簡扁平圖標」。
> ✅ **2026-10-04 裁定已把矛盾切乾淨**：lucide **僅限功能性控件**（軌道 2 豁免），
> 敘事槽位一律 `react-icons/gi`。此界線已寫入 `GEMINI.md` 軌道 2 豁免條款，並於同日完成階段 3 清查（§4 B）。
> 故 `PROJECT_SPEC.md:26` 的「圖標庫：lucide-react」應理解為**僅指功能性控件層**，其餘仍以 `GEMINI.md` 為準。
> 建議後續修訂 `PROJECT_SPEC.md` 時一併更正此兩行。

### B. `PROJECT_SPEC.md` 整體已過時 —— ✅ 2026-10-04 已加註並就地更正
- §4 描述深色石板底（`bg-zinc-950` / `#0c0d0e`）——**實際全站為羊皮紙暖色調**。
- §3 將 `dice-roller` 列為「模塊 4」——**實際第四個章節是 `clocks`（命刻記錄）**，
  骰子為全域浮動模態窗（`DiceRollerModal`）。
- §3 的 `src/types/`、`src/utils/storage.js`、`src/utils/exportImport.js`、`JRPGSelect.jsx`
  **在實際源碼中不存在**。

> ✅ **已於 2026-10-04 處理**：文件頂部加上「**已過時（歷史願景文件），不得作為現況事實依據**」狀態區塊，
> 逐條列出六處已知過時點；並就地以刪除線標註 §1 核心原則 2、§2 圖標庫、§3 目錄結構、
> §4 色彩系統，同時補上**實際值**（羊皮紙色票、實際章節順序、不存在的檔案）。
>
> **判讀原則**：本文件現為**專案意圖的歷史記錄**。規範效力以 `GEMINI.md` 為第一順位，
> 事實陳述一律以當前源碼為準。

### C. `PROJECT_CHANGELOG.md` 的合規宣稱不實 —— ✅ 2026-10-04 已加更正註記
- `:51`「修改檔案中零 Unicode Emoji 字符。」
- `:88`「全站 100% 通過零 Emoji 檢測。」
- `:119`「角色卡、名冊、骰盅與時鐘體系通過零 Emoji 檢驗。」

> 實測 98 處代理對 emoji 仍存在，**三處宣稱皆與現況不符**。
>
> ✅ **已於 2026-10-04 處理**：文件頂部加上更正表，逐條列出三處不實宣稱與實測值，
> 並寫明**根因**（當時的檢測正則只命中代理對，檢出率約 27.5%／34.8%）與
> **真正達成時間**（2026-10-04 技術債三階段完成後，非任一歷史宣告的時間點）。
>
> 此為 `GEMINI.md` 規則六存在的實證理由：**歷史報告不可信**。

### D. 路徑引用不精確
- `GEMINI.md` 規則六舉例 `rulesData.json`；實際路徑為
  `src/features/character-sheet/data/rulesData.json`。

---

## 6. 待決事項（需使用者裁定，DSH 不得自行決定）

### A. ~~軌道 2 的適用範圍~~ ✅ 已於 2026-10-03 裁定，2026-10-04 收斂完成
使用者裁定：**敘事性圖示 → Game-Icons.net；一般功能性控件（返回、打叉等）→ 純 Unicode 即可。**
已寫入 `GEMINI.md` 軌道 2 豁免條款與軌道 3，並同步本檔 §2。

> ✅ **後續待辦已於 2026-10-04 結清**：敘事性圖示誤用 lucide 的個案已全數清查並修正（52 點，見 §4 B），
> 且「lucide 僅限功能性控件」已升格為 `GEMINI.md` 硬性條款。

### B. ~~官方 PDF 位置~~ ✅ 已於 2026-10-03 提供
官方英文 Core v1.1 原書位於**專案目錄之外**：

```
E:\MINGWAN\TRPG\Fabula ultima\最終幻想1.1\Fabula_Ultima_TTJRPG_Need_Games,_Rooster_Games_Fabula_Ultima_Core.pdf
```

- 涉及《FU》專有子系統（造物專案、小工具、儀式魔法、忠實夥伴等）的實作前，
  **必須先讀取該 PDF 對應章節逐條核對**（`GEMINI.md` 規則二.4）。
- ⚠️ 該檔為 PDF 二進位格式，**`read` 工具無法直接讀取**；
  須先以文字抽取工具（如 pdftotext / Python pypdf）轉為純文字後再核對。
  抽取能力與指令見 §1 環境事實。

### C. ~~dingbat 是否納入零 Emoji 範圍~~ ✅ 已於 2026-10-03 裁定
裁定：**排版字符（`✦` `✓` `✗` `➔` `❖` `★` `◆` `①`~`⑤`）不屬 Emoji，允許保留。**
零 Emoji 鐵律僅禁彩色圖像化 Emoji，已寫入 `GEMINI.md` 軌道 3。

### D. ~~技術債清理排程~~ ✅ 已於 2026-10-03 裁定：**納入近期工作**
清理範圍與**強制順序**如下（順序不可顛倒）：

| 階段 | 工作 | 前置條件 | 觸發規則四文案預審 | 狀態 |
|---|---|---|---|---|
| 1 | **`⚡` 語意哨兵遷移**：資料層改為結構化 `isOffensive` 欄位 + localStorage 遷移 | 無 | 否（純內部結構） | ✅ **2026-10-04 完成**（`280bbb8`，測試 60/60） |
| 2 | **裝飾性 Emoji 清除**：§4 A 清單（76 行 / 145 次） | **階段 1 完成** ✅ | **是**（多為面向使用者文字） | ✅ **2026-10-04 完成**（**0 行 / 0 次**） |
| 3 | **敘事性圖示清查**：lucide 誤用於敘事圖示者改 `react-icons/gi` | 無 | 否 | ✅ **2026-10-04 完成**（`ce85f55`，52 點） |

> ✅ **三階段全部結案**。`src/` 現已達成零 Emoji、零敘事槽位誤用（見 §4 A、§4 B）。
>
> ⚠️ **原始排序（1→2→3）經實證應為 1→3→2**——因為階段 3 決定了那些位置「鄰居」的視覺語言，
> 階段 2 的符號選擇必須與鄰居同語言，否則會出現 dingbat／lucide／gi 三種語彙同框。
> 後續已按修正後順序執行；**若未來再遇同類清理，一律先做圖示庫分佈清查。**
>
> 階段 2 的執行流程可複用：**逐列裁決表（`emoji-cleanup-decisions.xlsx`）→ 使用者標注 → 回讀套用**。
> 這是 `GEMINI.md` 規則四在 DSH 下對「Antigravity Artifact 標注回饋」的等效替代（本檔 §2）。

### E. 職業／範本／物種的英文註釋 —— ✅ 已於 2026-10-04 完成
使用者裁定格式：**`中文 · ENGLISH`**（半形空格＋間隔號＋半形空格，英文**大寫**）。
實作於 `src/utils/properNouns.js` 的 `withEn()`；已套用於 20 個渲染點、11 個檔案。

**資料來源（全部逐條核對官方英文原書，依規則二.4）**：

| 類別 | 筆數 | 來源與原文 |
|---|---|---|
| NPC 定位 | 6 | **Bestiary Vol. 1 p.46**：「six NPC roles (brute, hunter, mage, saboteur, sentinel, and support)」——並以各定位描述語意逐條交叉驗證（見 `properNouns.js` 註解） |
| 物種 | 8 | **Core p.302**「Choose the NPC's Species: …」 |
| 職業 · 核心 | 15 | **Core** Character Classes（p.182–200） |
| 職業 · 高度奇幻 | 4 | **High Fantasy Atlas**：Chanter, Commander, Dancer, Symbolist |
| 職業 · 自然奇幻 | 4 | **Natural Fantasy Atlas**：Floralist, Gourmet, Invoker, Merchant |
| 職業 · 科技奇幻 | 3 | **Techno Fantasy Atlas**：Esper, Mutant, Pilot |

> 🔑 **關鍵設計決定：不另造表。** 職業英文**早已存在**於 `sourcebookConfig.js` 的
> `CLASS_METADATA.en`（35 筆全備，連 `卡牌大師 = Ace of Cards`、`死靈術士 = Necromancer` 都有）。
> 本次僅補「定位」與「物種」兩張小表，職業一律複用 `getClassInfo()`。
> **差點造出重複的一份對照表**——這是先查源碼再動手的直接價值。
>
> ✅ **本次獨立驗證了既有表的正確性**：26 筆重疊項與原書**完全一致**。
> 且 `withEn` 統一轉大寫——因為既有 `ClassPickerModal` 是用 CSS `uppercase` 顯示職業英文，
> 若行內沿用原表的 Title Case，職業與定位會同框不一致（此不一致由冒煙測試抓到）。
>
> ✅ **35 筆全數核對完畢（含最後兩筆）**：`卡牌大師 = Ace of Cards`、`死靈術士 = Necromancer`
> 已於 **Bonus Collection** 目錄逐條確認——p.6「Ace of Cards」、p.12「Necromancer」，
> 並經內文佐證（該書說明 Ace of Cards 出自 2023 愚人節特典、Necromancer 出自 2022 萬聖節特典）。
> **`CLASS_METADATA` 至此再無未經核實的項目。**
>
> **測試**：`npm run test:propernouns`（33 項）守住「查無英文原樣回傳、不得臆造」與格式鐵律。

### F. Bonus Collection 的其餘內容 —— 未涵蓋（可選實作，需先裁定優先序）
`rulesData.json` 的 `bonus` 來源只涵蓋**兩筆職業**。Bonus Collection 目錄另有七項特典內容：

| 內容 | 頁 |
|---|---|
| New Heroic Skills | 10 |
| Necromancer Heroic Skills | 14 |
| Halloween Quirks | 16 |
| Halloween Characters | 24 |
| Halloween Heroic Skills | 26 |
| Arcane Whispers（秘儀師相關） | 32 |
| Additional Bosses：Carmilla／Typhos／Zuccaborg | 38／40／42／44 |

**實測全部零命中**（`卡蜜拉`／`泰弗斯`／`祖卡堡`／`萬聖`／`Halloween`／`奧術低語`／`Arcane Whispers`
在 `src/` 皆為 0）。**現已有原書可核，屬可實作的缺口**，但這是一整批新內容（非修正），
需先由使用者裁定是否納入與優先序——**DSH 不自行決定**。

### G. 譯名權威改為 CHM —— ✅ 2026-10-04 已套用
使用者裁定：中文譯名一律以民間漢化 CHM 為準（已寫入 `GEMINI.md` 規則二.1），**只管譯名、不管機制**。

**已修正（1 項，4 處）**：`高等奇幻` → **`高度奇幻`**
- `sourcebookConfig.js`：`name`／`shortName`／註解
- `fultimatorConverter.js`：註解
- `GEMINI.md` 規則二.2 的手冊清單同步更正

> 這是**實際的不一致**，不只是用詞偏好：UI 顯示的書名用「高等奇幻」，
> 但 `rulesData.json` 已有 **3 處技能說明**使用「高度奇幻」，而 CHM 標準是「高度奇幻」。
> 也就是說專案內部本來就兩種寫法並存。

**已核對為相符，無需修改**：
- `金手指`＝Quirk ✅ 本專案**本來就正確**（28 處），與 CHM 一致。
- 拓展職業譯名全數相符：機師／靈能者／突變體／徽記師／指揮官／舞者／魔奏者／植物學家／美食家／祈喚者／商人／死靈術士。
- `營地活動` ✅ 相符。

> 🚨 **更正本檔稍早的一項錯誤（同日）**：本檔與回覆中曾稱本專案把 Quirk 譯為「**奇異點**」——
> **實測 `奇異點` 在 `src/` 出現 0 次**。那是敘述者自行套用的詞，**不是專案用語**。
> 錯誤陳述已於本節更正。**教訓：描述專案現況前必須先 grep，不得憑印象。**

**⏸️ 使用者裁定暫緩（2026-10-04）—— 金手指的來源標記問題**：
- 原發現：`（高奇）`／`（自奇）`／`（科奇）` 後綴標記**不完整**——高度奇幻原書有 **16 筆**金手指，App 只標了 **6 筆**；
  `空手道`(EMPTY HANDS)、`光榮的命運`(GLORIOUS FATE)、`傳家寶`(HEIRLOOM)、`亡者歸來`(REVENANT)、
  `天才的宿敵`(RIVAL PRODIGIES)、`應劫之人`(RUINBRINGER)、`交織的靈魂`(SOULS ENTWINED)、
  `被束縛的心`(FETTERED HEART)、`老載具`(OLD TRANSPORT) 等**全部漏標**。自然／科技奇幻同理。
- 且 `rulesData.json` 的 `quirks` **無 `source` 欄位**，導致**手冊開關對金手指完全失效**
  （`CharacterEditor.jsx` 直接 `rulesData.quirks.map(...)`，無任何來源過濾）。
- **裁定：金手指暫時擱置，先專注完善角色卡。** 此項保留為待辦，不得自行動工。

### H. 譯名衝突：README 的「正式中文名」是錯的 —— ✅ 2026-10-04 使用者裁定
`resources/角色卡/README.md` 的 28 職業對照表把某組譯名標為「**正式中文名**」，
但 CHM（使用者裁定的譯名權威）用的是另一組、被 README 標為「測試版/舊譯名」。
**7 個職業不一致**：

| 英文 | CHM（＝**正確**，本專案採用） | README 標為「正式」（**錯誤**） |
|---|---|---|
| Chanter | 魔奏者 | ~~聖歌師~~ |
| Commander | 指揮官 | ~~統帥~~ |
| Symbolist | 徽記師 | ~~符印使~~ |
| Floralist | 植物學家 | ~~園藝師~~ |
| Invoker | 祈喚者 | ~~喚靈師~~ |
| Esper | 靈能者 | ~~超能者~~ |
| Mutant | 突變體 | ~~異變者~~ |

> ✅ **使用者 2026-10-04 裁定：「readme 的都是錯誤的」**——以 CHM 譯名為準（左欄）。
> 本專案目前全部採用左欄，**無需修改**。
> `resources/角色卡/README.md` 本身是**錯誤文件**，不得作為譯名依據；
> 該目錄已於同日移出版控（見 §6 I）。
>
> **判讀原則**：`resources/` 內的 PDF 節錄是**官方原書**（機制權威），
> 但該目錄的 `README.md` 是**他人整理、已證實有誤**的二手文件——兩者不可混為一談。

### I. `resources/` 的版權狀態 —— ⚠️ 需知悉（非技術問題）
`resources/角色卡/` 內含 **54 個官方原書 PDF 節錄（86 MB）** 與 **26 份 CHM 漢化（.md/.html）**，
**全部已提交進本 repo，而本 repo 是公開的**。

- 這些是官方著作（Need Games／Rooster Games）與他人的民間漢化，
  **公開發布可能有版權風險**——這不是技術問題，是法律曝險。
- ⚠️ 本檔 §1.2 先前寫「漢化內容一律留在 `scratch/`、嚴禁提交進 repo」——
  **該敘述與現況不符**：內容早已在 repo 裡，而且是整理過的 Markdown 版。已更正。
- **DSH 不自行刪除**（這是使用者的既有資源與決定，且刪 86 MB 不可逆）。
  若要降低風險，選項是：① repo 改為 private；② 將 `resources/` 移出版控並列入 `.gitignore`。
  **需使用者裁定。**

### J. 狀態名稱「緩速」vs「緩慢」—— ⚠️ 需裁定
CHM 漢化把 `slow` 譯為「**緩慢**」，但本專案全站（`sourcebookConfig.js` 的 `STATUS_AFFLICTIONS`、
狀態異常監控面板、各技能描述）一律用「**緩速**」。

- 美食家工坊（`gourmetData.js`）目前**沿用 App 既有詞彙（緩速）**，以確保美食效果與狀態面板
  指向同一組詞——否則玩家會看到兩個名字指同一件事。
- 但這與「CHM 為譯名權威」（規則二.1）有出入。**需使用者裁定要統一成哪一個。**
- ⚠️ 若裁定改為「緩慢」，會連動狀態面板、狀態圖示、以及所有提及該狀態的技能描述，
  **不是改一個字串就能了事**。

### K. `（見【私房食譜】）` 指向不存在的東西 —— 待清理
`rulesData.json` 的美食家【烹飪】技能描述開頭寫「（見【私房食譜】）」，
但**原書沒有「私房食譜」這個名詞**——這是殘留的懸空引用。
應改為指向本專案實際實作的介面（美食家工坊），或直接移除。**待裁定後清理。**

---

## 7. 本檔維護

- 本檔由 DSH 維護，**與 `GEMINI.md` 並存不互斥**。
- 若 `GEMINI.md` 新增或修訂規則，本檔僅需同步「DSH 對應實作」章節，**不得改寫 `GEMINI.md` 原文**。
- 每次完成稽核後，更新 §4 基準快照與 §6 待決狀態。

---

*建立於 2026-10-03 DSH 稽核。稽核範圍：`src/` 75 檔、38,481 行；`npm run build` 通過。*
*2026-10-03：同步使用者裁定之圖示三軌分類（敘事 → Game-Icons；功能性控件 → Unicode 豁免），並修正 `GEMINI.md` 規則五.1 之 Emoji 檢測正則。*
*2026-10-04：稽核複驗並更新基準——§3.1 哨兵遷移完成、§4 A 殘留數更新為 76 行 / 145 次（`src/` 程式碼檔 75 個 / 38,619 行）、§4 E 補列測試現況、§6 D 階段 1 標記完成。*
*同日完成工作區收尾：10/02 起懸置的 16 個檔案分 6 個 commit 提交；測試自未受版控的 `scratch/` 移入 `tests/` 並加入 `npm run test:sentinel`。*
*2026-10-04（續）：完成階段 3 敘事性圖示清查（52 點，commit `ce85f55`），並將兩項裁定升格為 `GEMINI.md` 硬性條款——「lucide 僅限功能性控件」與「軌道 3 附錄符號詞彙表」。§4 B 改為分佈基準、§6 A 結清、§6 D 標記階段 3 完成並註明實證後的建議順序 1→3→2。*
*2026-10-04（終）：完成階段 2 裝飾性 Emoji 清除——`src/` 命中數由 76 行 / 145 次降至 **0 / 0**，零 Emoji 鐵律首次真正達成。執行方式為「逐列裁決表 → 使用者標注 → 回讀套用」（`emoji-cleanup-decisions.xlsx`，80 列全數採用建議）。資料層三個 emoji 退路欄位整欄移除，三處純裝飾浮水印刪除。技術債三階段全部結案。*
*2026-10-04（規則三裁定）：使用者裁定「專有名詞例外」——職業／範本／物種改用「`中文 · ENGLISH`」（間隔號分隔，英文在後）。已寫入 `GEMINI.md` 規則三第 4 點，並同步清除 8 處介面英文標籤。*
*同日另修正：① 魔加農 IP 由 3 改回 **2**（原書 `MAGICANNON (Advanced)` 逐字核對，前一次 2→3 的提交未經查證即為錯誤）；② `ErrorBoundary` 的「修復暫存並重載」補上確認對話框（原會靜默刪除整場戰鬥存檔）；③ `PROJECT_SPEC.md` 加註已過時狀態並就地更正、`PROJECT_CHANGELOG.md` 加上不實宣稱更正表。*
*同日發現並修正本檔自身的假事實：§1.1 原記載「已安裝 pypdf」為**假**（`ModuleNotFoundError`），意即規則二.4 在此之前無法執行；已補裝並驗證。*
*2026-10-04（英文註釋）：使用者提供四本官方原書（三本 Atlas ＋ Bestiary Vol.1）後，完成職業／定位／物種的「`中文 · ENGLISH`」註釋——**NPC 定位 6 筆 ← Bestiary p.46**、物種 8 筆 ← Core p.302、職業 26 筆 ← 三本 Atlas ＋ Core。新增 `src/utils/properNouns.js` 與 `tests/properNouns.test.mjs`（33 項）。關鍵發現：職業英文**早已存在**於 `sourcebookConfig.js` 的 `CLASS_METADATA.en`，本次僅補兩張小表、**未造重複對照表**，並順帶獨立驗證了既有表的 26 筆全部正確。*
*同日過程失誤（已修）：匯入插入邏輯誤判「最後一條 import」為多行 import 的起始行，把 `withEn` 插進區塊中間（`AddCombatantModal`）；另一處在替換時吃掉 `className={` 的收尾大括號（`NPCWorkshop:4285`）——後者由 `npm run build` 攔下，前者由 `git HEAD` 增量比對定位。兩者皆已修正並加入掃描自查。*
*2026-10-04（Bonus Collection）：使用者提供第五本原書後，`CLASS_METADATA` 的**最後兩筆**（`卡牌大師 = Ace of Cards`、`死靈術士 = Necromancer`）已於該書目錄逐條確認——**35 筆職業英文至此全數經官方原書核實，再無未驗項**。同時實測發現該書其餘七項特典內容（New Heroic Skills、Halloween Quirks／Characters／Heroic Skills、Arcane Whispers、三隻 Additional Bosses）在本專案**完全未涵蓋**，已記入 §6 F 待裁定。*
*2026-10-04（譯名權威＝CHM）：使用者裁定中文譯名一律以民間漢化 CHM 為準，機制仍以英文原書為準，並指定「金手指」為 Quirk 譯名。CHM 的 `hh.exe -decompile` 解不開、7-Zip 與各 PyPI CHM/LZX 套件皆不可用，**但索引字串區未壓縮**（`/#STRINGS`，偏移 0–4410），目錄與全部術語可直接抽出——已建立可重複的抽取流程（§1.2）。比對結果：`金手指` 本專案**本來就正確**；實際不一致的是 **`高等奇幻` 應為 `高度奇幻`**（UI 書名與 `rulesData.json` 技能說明原本兩種寫法並存），已修正 4 處並同步 `GEMINI.md` 規則二.2。*
*同日並更正敘述者自身的一項錯誤陳述：先前稱本專案把 Quirk 譯為「奇異點」——實測該詞在 `src/` 出現 **0 次**，純屬誤稱。*
*2026-10-04（造物專案核對）：依 Core printed p.134-139 逐條核對造物專案。**公式 5 項正確、1 項錯誤**（進度換算誤用 `ceil`，官方範例 Magitech Suit 證明應為 `floor`）；**官方範例 9 筆中 8 筆正確、1 筆資料誤植**（純潔之塵效力等級寫錯）。已修，並抽出 `tinkererProjects.js` 純模組 + `test:projects`（94 項）。*
*同日實作**「推進一天」**（使用者裁定後動工）：原書的專案是「每日結算」引擎，但本專案原本只有手動點時鐘，玩家得自己算每日進度。現已加入參與人數／其中修補匠／幫手三個步進器 + 即時合計 + 確認推進，並依原書語意處理（修補匠為「額外 +1」而非取代、修補匠人數夾在參與人數內、無人參與時高瞻遠矚不生效、超額完工顯示「一至兩小時內完成」）。*
*同日發現死碼：`TinkererProjectTracker.jsx`（281 行）**從未被 import 或渲染**，且其手動填成本／填格數的做法與官方公式衝突（預設 500z 配 6 格，正確為 5 格）。*
*2026-10-04（死碼清理＋漢化內容尋獲）：① **找到 CHM 的完整內容**——CHM 旁邊有一個**已解開的同名資料夾**，內含 26 個 HTML（88,884 字）。先前「LZX 壓縮無法解開」的結論是**錯的**，教訓已寫入 §1.2：先看旁邊有沒有現成解開的資料夾，不要急著實作 LZX。內容含三大風格擴展的全部新職業／新英雄技能／新金手指／新可選規則（底力技 Zero Power、自定義武器 Custom Weapon、營地活動、魔晶石 Technospheres）與兩小節日擴展；條目以「中文名English」緊接排版，**中英對照可直接取得**。抽取結果依版權考量只留在 `scratch/`，**不進公開 repo**。*
*② **刪除 5 個死碼檔（共 2,151 行）**：`JRPGCard.jsx`、`CharacterThemePicker.jsx`、`TinkererProjectTracker.jsx`、`NPCBuilder.jsx`、`NPCLibrary.jsx`。判定方式為**雙重驗證**——(a) 全 src 掃描無任何 import/require；(b) 以「本檔獨有字串常數」當指紋比對建置產物，確認皆**不在 bundle 中**（Vite 會剔除未引用模組）。刪除後 bundle 大小**完全不變**（1,834.87 kB），反證其確實從未被打包。其中 `NPCBuilder` 與 `NPCLibrary` 曾被歷次維護動過 **9 次 / 4 次**（含本輪的 emoji、圖示、譯名清理），全都是在改沒接上的檔案。*
*同日過程失誤（已修）：死碼掃描腳本第一版**邏輯錯誤**——每個檔案都會在自己的 `export default function Xxx(` 裡匹配到自己，導致漏報（回報 0 個死碼）。修正為排除自身後才找出 5 個。另建置產物指紋比對第一版也出現**假陽性**（`'已移除造物專案'` 在 `TinkererWorkshop` 也有），改為只採「本檔獨有」字串後才正確。*
*2026-10-04（resources 移出版控＋職業技能覆蓋分析）：① 使用者裁定 `resources/角色卡/README.md` 的「正式中文名」欄位**全部是錯的**（應以 CHM 譯名為準），且該目錄含官方原書 PDF 節錄與他人漢化、不應放在公開 repo——已 `git rm -r --cached`（106 檔）並加入 `.gitignore`，磁碟檔案完整保留。**注意：這只阻止未來提交，86 MB 仍在 git history 裡**；要真正清除需 history rewrite（破壞性，未經裁定不執行）。*
*② 完成**職業技能覆蓋分析**（`docs/skill-coverage.md`）：140 筆非 Playtest 技能，按機制本質分三層——**T1 純被動／即時（文字即完整實作）**、**T2 選擇清單（通用子選項系統即可）**、**T3 動態狀態（必須有專屬元件）**。現況 14 個職業已覆蓋（7 個專屬元件 + 9 組子選項），14 個未覆蓋——但**只有 5 個真的需要 UI**：卡牌大師（30 張牌組）、死靈術士（墳墓點）、商人（貿易點數）、美食家（食材）、祈喚者（元素源泉）；另熵師已覆蓋但**缺「幸運數字」狀態**。全部數字已逐條核對官方原書。*
*③ 同日發現**頁碼偏移因書而異**：Core 與三本 Atlas 為 **+2**，但**官方特典合輯為 0**（印刷 p.7 = PDF p.7）。已寫入 §1.1——先前只記 Core 的規則，套用到 Bonus 會全錯。*
*④ 另發現祈喚者技能描述**漏了「每場景 2 種元素源泉」**這個關鍵規則（NF p.156），玩家無從得知要記什麼——屬規則三文案問題，已記入分析文件。*
*2026-10-04（職業資源池 1～3 實作）：使用者裁定先做分析報告的順位 1～3（死靈術士墳墓點、商人貿易點數、熵師幸運數字），並要我思考「這些資源該放在跑團卡的什麼地方」。*
*① **擺放決策**：跑團卡分頁（TAB 3 職業特技）放的是**要主動去操作的工具**（魔奏者合成器、植物學家花園盤、修補匠工坊）；但資源池**不是工具，是不能忘記的計數器**——墳墓點在咒語分頁施咒時要花、幸運數字任何時候擲骰都要看，放進分頁等於看不到。故渲染在**常駐資源區**（HP/MP/IP 量表正下方、狀態異常之前），且**只有對應職業的角色才會看到**。同時把後續區塊註解編號順移（3→4、4→5、5→6）保持正確。*
*② **共用元件**：`data/classResources.js`（純模組）＋ `components/ClassResourceStrip.jsx`。三個資源共用同一個渲染邏輯，新增資源只要在設定陣列加一筆。*
*③ **規則忠實度**：重置按鈕**只在原書確有該規則時才出現**——墳墓點有（HP 歸零時失去全部）、幸運數字有（每次聚會開始為 7）、**貿易點數沒有**（原書無「清空貿易點數」規則，點數只會被花掉），故不給按鈕，避免暗示不存在的規則。*
*④ **規則五.1 改為自動化**：同日第三次把 `⚠️` 寫進自己的註解（`classResources.js`），故把 Emoji 掃描從「手動步驟」升格為 `npm run test:emoji`，排在 `npm test` 第一道。**關卡有效性已驗證**（注入 U+26A0 → exit 1、還原 → exit 0）。*
*⑤ 祈喚者元素源泉：使用者裁定**暫緩**——源泉由 GM 決定，建議改為「進入衝突時若有祈喚者才讓 GM 記錄」，現階段不做。*
*驗證：`npm test` 60/60 + 33/33 + 94/94 + 56/56 ＋ Emoji 掃描；`npm run build` exit 0（1,843.70 kB）。*
*2026-10-04（美食家工坊實作，順位 4）：使用者裁定接續做分析報告的順位 4（美食家食材清單）。*
*① **重大發現：CHM 是測試版，機制已過時**。這是「CHM 只管譯名、不管機制」這條規則**第一次真正派上用場**——若照 CHM 實作，整個食譜書會是錯的：CHM 用 **d10／10 個效果**，正式版是 **d12／12 個效果**；CHM 恢復 30 點（L20→40、L40→50），正式版是 **40 點（L30→50）**；CHM 把「無法執行防禦／咒語／技能」**合併成一個效果**，正式版是 **7／8／9 三個獨立效果**；CHM 的【舞刀弄叉】條件是「除非武器是匕首」，正式版是「**組合不超過 2 份食材**」。本實作一律採原書，並在 `test:gourmet` 的 J 區段設了**防回退護欄**。*
*② **規模定位**：美食家不是「單一數字」型的 T3，而是 **15 格程序化生成的食譜書**——每格骰出後永久固定、且**兩格不得有相同效果**。故與修補匠工坊、植物學家花園盤同級，放在「職業特技」分頁的「職業專屬機制互動工具」區。三個子分頁：食材（清單／骰 d6）→ 食譜書（15 格／骰 d12）→ 烹飪（選 2~3 份即時預覽）。*
*③ **實作過程修正的兩個自身錯誤**：⑴ `tastePairKey` 原本用 JS 字串排序，順序取決於 UTF-16 碼位（甜 < 苦 < 酸 < 鮮 < 鹹），既反直覺又與官方口味表不符——改為**依官方口味順序**（苦→鹹→酸→甜→鮮）排列。⑵ 元件匯入路徑少算兩層（`companions/` 需要四層才到 `components/ui/`），由 `npm run build` 攔下，改用 `npx esbuild --bundle` 做**快速匯入／語法檢查**（比整套建置快得多，值得日後沿用）。*
*④ **規則五.1 自動化關卡首次發揮作用**：本次在 `gourmetData.js` 又寫入了 `⚠️` 與 `🔑`，**在宣稱完成之前就被 `npm run test:emoji` 自動攔下**——證明上一輪把它做成測試是對的。另修正一個自身失誤：Python 替換字串時誤用代理對 `\uD83D\uDD11`（Python 3 需用 `\U0001F511`），導致該 emoji 未被移除。*
*⑤ 附帶查核：`rulesData.json` 的美食家**五個技能描述本身已經是正確的**（採原書版本，不是 CHM 版本）。唯二問題是【烹飪】開頭的 `（見【私房食譜】）` 指向不存在的名詞（見 §6 K），以及狀態名稱「緩速／緩慢」的全站不一致（見 §6 J）——兩者皆待裁定。*
*驗證：`npm test` 60/60 + 33/33 + 94/94 + 56/56 + 92/92 ＋ Emoji 掃描；`npm run build` exit 0（1,869.85 kB）。*
