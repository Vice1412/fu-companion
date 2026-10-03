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
- **建置指令**：`npm run build`（Vite 6，實測約 6.8 秒，exit 0）
- **建置產物**：`dist/`，JS 1,831 kB（gzip 519 kB）。chunk-size 警告為**已知既有現象**，非本次改動造成。
- **測試指令**：`npm run test:sentinel`（實測 60/60 通過，exit 0）。
  測試源碼位於受版控的 `tests/`；bundle 產物輸出至 `.test-build/`（已列入 `.gitignore`）。
  ⚠️ `scratch/` 整個目錄**不在版控內**（`.gitignore:27`），凡置於該處的測試或 bundle 都會與源碼脫鉤——
  2026-10-03 的舊 `stage1.bundle.mjs` 即因早於源碼 40 秒打包，執行後產生 1 筆假失敗。**測試一律放 `tests/`。**
- **樣式系統**：Tailwind 3。全站為**羊皮紙暖色調**（`#fbf7ee` / `#3c2415` / `#d6c7ab`），**非**深色石板底。
- **資料層**：純 localStorage，四個 key：
  `fu_companion_npc_library`、`fu_companion_character_roster`、
  `fu_companion_active_combat`、`fu_companion_fate_clocks`

### 1.1 官方 PDF 抽取（規則二.4 的必要工具）

- **原書位置**（**專案目錄之外**）：
  `E:\MINGWAN\TRPG\Fabula ultima\最終幻想1.1\Fabula_Ultima_TTJRPG_Need_Games,_Rooster_Games_Fabula_Ultima_Core.pdf`
- **規格**：11.8 MB、**362 頁**。
- ⚠️ `read` 工具**無法**直讀 PDF；`pdftotext` / `pdftk` **皆未安裝**。
- ✅ **已安裝 `pypdf 6.19.0` + `fontTools 4.66.1`**（裝於 DSH bundled Python）。
- **抽取工具**：`scratch/pdf_text.py`（本次稽核時建立）

```powershell
$py = "C:\Users\Admin2\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe"
$pdf = "E:\MINGWAN\TRPG\Fabula ultima\最終幻想1.1\Fabula_Ultima_TTJRPG_Need_Games,_Rooster_Games_Fabula_Ultima_Core.pdf"
& $py "scratch\pdf_text.py" $pdf <起始頁> <結束頁>
```

> ⚠️ **頁碼偏移**：PDF 實體頁碼 = 書上印刷頁碼 **+2**
> （實測：印刷 p.132 的基本防具表 → PDF 第 134 頁）。引用官方頁碼時務必換算。
>
> ⚠️ **封面頁文字層有重複行**（該頁採 faux-bold 疊印）；其餘內文頁抽取乾淨，
> 表格數值可直接用於機制核對。

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

> ⚠️ 上表為**歷史基準**，用以證明正則修正的必要性；**現行殘留數見 §4 A**（76 行 / 145 次）。

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

**殘留的 `⚡` 僅 6 行，已降級為純顯示字串，不再是任何判定依據**：

| 位置 | 用途 |
|---|---|
| `NPCWorkshop.jsx:958` | 技能分類圖示（複製文本用） |
| `NPCWorkshop.jsx:968` | 複製文本前綴 |
| `NPCWorkshop.jsx:3960` | Markdown 匯出標題 |
| `NPCWorkshop.jsx:6090` | 相性摘要標籤「弱／抗／免」 |
| `constants.js:22` | `CATEGORIES.icon`（已並存 `fuIcon` 官方字型欄位） |
| `constants.js:23` | `TYPE_STYLES.emoji`（已並存 `fuIcon` 官方字型欄位） |

> ✅ **判定邏輯已與哨兵解耦**，故 §6 D 階段 2 執行時**不會**再造成攻擊性咒語判定失效。
> 上述 6 行仍**不得無腦刪除**——它們會在階段 2 依文案預審一併處理（多數需改為官方字型或 Game-Icons）。

---

## 4. 已知技術債基準（截至 2026-10 稽核）

> 本節為**現況快照**，供避免重複申報與誤判「新引入」之用。
> 依 `GEMINI.md` 規則六，每次稽核仍須以即時源碼重新驗證。

### A. Emoji 殘留（違反規則一軌道 3）
以**修正版正則**實測（`src/` 程式碼檔 75 個——`.js`/`.jsx`/`.json`/`.css`——共 38,619 行；含非程式碼檔則 82 檔 / 39,231 行）：

| 時點 | 行（檔案:行） | 次 | 說明 |
|---|---|---|---|
| 2026-10-03（稽核原始基準） | 149 | 282 | 修正版正則首次套用 |
| 2026-10-04（哨兵遷移後） | **76** | **145** | 階段 1 完成後 |

**現行殘留清單（2026-10-04 實測，76 行 / 145 次）**：

| 檔案 | 行 | 次 | 性質 |
|---|---|---|---|
| `src/features/npc-workshop/NPCWorkshop.jsx` | 54 | 86 | 4 行顯示用 `⚡` + 50 行裝飾性 emoji |
| `src/features/npc-workshop/data/constants.js` | 8 | 35 | 6 行裝飾性 + 2 行 `⚡` 退路欄位 |
| `src/features/npc-workshop/components/NPCCardPreview.jsx` | 6 | 11 | 裝飾性 |
| `src/features/npc-workshop/components/NPCBuilder.jsx` | 3 | 6 | 裝飾性 |
| `src/features/npc-workshop/components/NPCLibrary.jsx` | 3 | 5 | 裝飾性 |
| `src/features/clocks/FateClockPage.jsx` | 2 | 2 | 裝飾性（`:45` `✨`、`:63` `⏳`） |

> ✅ **已自清單消失的檔案（階段 1 成果）**：`roles.js`（7/37）、`speciesData.js`（5/32）、
> `spells.js`（22/22）、`ChimeristManager.jsx`（4/5）、`skillFormulaEvaluator.jsx`（3/5）、
> `CharacterPlayHUD.jsx`（3/3）。前三者為哨兵、後三者為哨兵字面量。
>
> ✅ **`src/features/character-sheet/data/rulesData.json` 不在清單內**：
> 其 81 處為 `✦`（U+2726）等排版字符，依 2026-10-03 裁定允許保留。
>
> ⚠️ 殘留的 6 行 `⚡`（見 §3.1）**已不承載判定語意**，可安全清除；
> 其餘約 70 行為裝飾性 emoji，清除時**必須先過規則四文案預審**。

`src/features/npc-workshop/data/constants.js` 為結構性來源：
- `:22` `CATEGORIES` 的 `icon` 欄位（`⚔️ 🔮 ⚡ 📜 👑`）
- `:23` `TYPE_STYLES` 的 `emoji` 欄位（九相 + 攻擊性咒語）
- `:36-41` `ROLE_DESCRIPTIONS` 的 `icon` 欄位（`🩸 🏹 🔮 💣 🛡️ 🌿`）

> **注意**：`CATEGORIES` 與 `TYPE_STYLES` 已同時具備 `fuIcon` 欄位，
> 官方字型遷移**已完成一半**——只差移除 `icon` / `emoji` 退路。

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

### C. 純中文邊界案例（規則三）
- `src/features/npc-workshop/NPCWorkshop.jsx` `SPECIES_THEMES` 的 `label` 為英文：
  `'BEAST'`、`'CONSTRUCT'`、`'DEMON'`、`'ELEMENTAL'`、`'HUMANOID'`、`'MONSTER'`、`'PLANT'`、`'UNDEAD'`
- `src/components/book/BookCoverHub.jsx:104` 顯示 `FU COMPANION 《物語助手》`
- `src/features/character-sheet/data/rulesData.json` 含 `秘儀師【Playtest】` 等英文標籤
- `src/features/character-sheet/components/CharacterEditor.jsx:1020-1038` 使用 `✓` / `✗`

### D. 規則七.4 `inline-flex` — **休眠狀態，非現行違規**
- `src/components/ui/FUIcon.jsx:107` 的 `showLabel` 分支使用 `inline-flex`。
- 經全站檢索，`showLabel` **無任何呼叫點**，屬死碼路徑。
- 同檔 `renderTextWithAffinities`（`:157`、`:164`）正確使用純 `inline`。
- **結論**：目前無實際基線偏移；若未來啟用 `showLabel`，須先改為 `inline`。

### E. 建置與測試
- `npm run build` 通過（exit 0，2026-10-04 實測 6.8 秒）。
- JS bundle 1,831 kB / gzip 519 kB，觸發 Vite chunk-size 警告（>500 kB）。
  較階段 3 前的 1,824 kB 增加約 7 kB，來源為 gi 圖示路徑細節多於 lucide——**屬預期代價，非退化**。
  建議未來以 `manualChunks` 或 `import()` 拆分，但**非當前規範要求**。
- `npm run test:sentinel` 通過（60/60，exit 0）。**本專案目前僅此一組自動化測試**；
  其餘模組（角色卡引擎、戰鬥輪次、造物專案公式）**無任何測試覆蓋**，屬已知缺口。

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

### B. `PROJECT_SPEC.md` 整體已過時
- §4 描述深色石板底（`bg-zinc-950` / `#0c0d0e`）——**實際全站為羊皮紙暖色調**。
- §3 將 `dice-roller` 列為「模塊 4」——**實際第四個章節是 `clocks`（命刻記錄）**，
  骰子為全域浮動模態窗（`DiceRollerModal`）。
- §3 的 `src/types/`、`src/utils/storage.js`、`src/utils/exportImport.js`、`JRPGSelect.jsx`
  **在實際源碼中不存在**。

> **判讀原則**：`PROJECT_SPEC.md` 為**初期願景文件**，僅 §4 的圖示條款仍部分有效。

### C. `PROJECT_CHANGELOG.md` 的合規宣稱不實
- `:51`「修改檔案中零 Unicode Emoji 字符。」
- `:88`「全站 100% 通過零 Emoji 檢測。」
- `:119`「角色卡、名冊、骰盅與時鐘體系通過零 Emoji 檢驗。」

> 實測 98 處代理對 emoji 仍存在，**三處宣稱皆與現況不符**。
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
| 1 | **`⚡` 語意哨兵遷移**：資料層改為結構化 `isOffensive` 欄位 + localStorage 遷移 | 無 | 否（純內部結構） | ✅ **2026-10-04 完成**（commit `280bbb8`，測試 60/60） |
| 2 | **裝飾性 Emoji 清除**：§4 A 現行清單（76 行 / 145 次） | **階段 1 完成** ✅ | **是**（多為面向使用者文字） | ⏳ **待辦——裁決表已備妥** |
| 3 | **敘事性圖示清查**：lucide 誤用於敘事圖示者改 `react-icons/gi` | 無 | 否 | ✅ **2026-10-04 完成**（commit `ce85f55`，52 點） |

> ✅ **階段 1 已完成**：判定邏輯與哨兵解耦（見 §3.1），
> 故階段 2 執行時**不會**再造成攻擊性咒語判定（傷害／MP／預覽標記）失效。
> 原始警告「階段 1 未完成前嚴禁執行階段 2」已解除。
>
> ✅ **階段 3 已完成**：52 個敘事槽位誤用已改 gi（見 §4 B）。
> **原本的排序（1→2→3）經實證應調整為 1→3→2**——因為階段 3 決定了那些位置「鄰居」的視覺語言，
> 階段 2 的符號選擇必須與鄰居同語言，否則會出現 dingbat／lucide／gi 三種語彙同框。
> 此後續已按修正後順序執行。
>
> 階段 2 涉及大量面向使用者的文字改動，**必須先提交文案草案並取得確認**
> （依 `GEMINI.md` 規則四／本檔 §2）。裁決工具：
> `emoji-cleanup-decisions.xlsx`（逐列裁決表）＋ `implementation_plan.md`（方針與符號詞彙表）。

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
