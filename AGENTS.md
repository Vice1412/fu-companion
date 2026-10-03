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
- **建置指令**：`npm run build`（Vite 6，實測約 9 秒，exit 0）
- **建置產物**：`dist/`，JS 1,823 kB（gzip 515 kB）。chunk-size 警告為**已知既有現象**，非本次改動造成。
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
- **軌道 3（零 Emoji）**：彩色圖像化 Emoji 全站禁止；純排版字符（`✦` `❖` `★` `◆` `①`~`⑤`）不在此限。
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
經實測，本專案實際違規數為：

| 檢測方式 | 命中行數 | 命中次數 |
|---|---|---|
| `GEMINI.md` 原始正則 | **41** | **98** |
| 本檔修正版正則（emoji，含 BMP） | **149** | **282** |

原始正則的**檢出率僅 27.5%（按行）／34.8%（按次數）**——
這是歷次「零 Emoji 檢驗通過」卻仍殘留大量 emoji 的直接原因。

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

### 3.1 ⚡ 是語意哨兵，不是裝飾 — **極重要**

`⚡`（U+26A1）在本專案中**承載資料語意**，並非裝飾性 emoji：

- 攻擊性咒語名稱以 `⚡` 為後綴標記，例如 `src/features/npc-workshop/data/spells.js` 的 `"吐息⚡"`、`"雷霆⚡"`。
- 程式碼以 `.includes('⚡')` 判定 `isOffensive`，例如：
  - `src/features/npc-workshop/NPCWorkshop.jsx`（多處，含 `:543`、`:645`、`:2746`）
  - `src/features/character-sheet/components/CharacterPlayHUD.jsx:418`
  - `src/features/npc-workshop/components/NPCBuilder.jsx:209`
- 渲染時才被剝除並替換為官方字型 `o`（攻擊性咒語）圖示。

> **🚫 嚴禁直接全域刪除或取代 `⚡`。**
> 這樣做會讓全站攻擊性咒語判定失效（咒語傷害／MP 計算／預覽標記連帶錯誤）。
>
> **正確做法**：先在資料層改為結構化欄位（如 `isOffensive: true`），
> 同步撰寫 localStorage 舊存檔遷移（比照 `migrateNpcState` 模式），
> 確認新舊資料皆可正確判定後，才移除 `⚡` 哨兵。

---

## 4. 已知技術債基準（截至 2026-10 稽核）

> 本節為**現況快照**，供避免重複申報與誤判「新引入」之用。
> 依 `GEMINI.md` 規則六，每次稽核仍須以即時源碼重新驗證。

### A. Emoji 殘留（違反規則一軌道 3）
以**修正版正則**實測（`src/` 75 檔）：

- `GEMINI.md` **修正前**正則：**41 行 / 98 次**
- 修正後正則：**149 行 / 282 次**

主要集中於「唯一標示為完整」的 NPC 工坊：

| 檔案 | 行 | 次 |
|---|---|---|
| `src/features/npc-workshop/NPCWorkshop.jsx` | 77 | 112 |
| `src/features/npc-workshop/data/roles.js` | 7 | 37 |
| `src/features/npc-workshop/data/constants.js` | 8 | 35 |
| `src/features/npc-workshop/data/speciesData.js` | 5 | 32 |
| `src/features/npc-workshop/data/spells.js` | 22 | 22 |
| `src/features/npc-workshop/components/NPCCardPreview.jsx` | 8 | 14 |
| `src/features/npc-workshop/components/NPCBuilder.jsx` | 7 | 10 |
| `src/features/npc-workshop/components/NPCLibrary.jsx` | 3 | 5 |
| `src/features/character-sheet/components/companions/ChimeristManager.jsx` | 4 | 5 |
| `src/features/character-sheet/utils/skillFormulaEvaluator.jsx` | 3 | 5 |
| `src/features/character-sheet/components/CharacterPlayHUD.jsx` | 3 | 3 |
| `src/features/clocks/FateClockPage.jsx` | 2 | 2 |

> **`roles.js` / `speciesData.js` / `spells.js` 的命中全部是 `⚡` 語意哨兵**，非裝飾性 emoji，
> 處理方式見 §3.1，**不得逕行刪除**。
>
> ✅ **`src/features/character-sheet/data/rulesData.json` 已自違規清單移除**：
> 其 81 處原為 `✦`（U+2726）等排版字符，依 2026-10-03 裁定屬允許保留，**不再是違規**。

`src/features/npc-workshop/data/constants.js` 為結構性來源：
- `:22` `CATEGORIES` 的 `icon` 欄位（`⚔️ 🔮 ⚡ 📜 👑`）
- `:23` `TYPE_STYLES` 的 `emoji` 欄位（九相 + 攻擊性咒語）
- `:36-41` `ROLE_DESCRIPTIONS` 的 `icon` 欄位（`🩸 🏹 🔮 💣 🛡️ 🌿`）

> **注意**：`CATEGORIES` 與 `TYPE_STYLES` 已同時具備 `fuIcon` 欄位，
> 官方字型遷移**已完成一半**——只差移除 `icon` / `emoji` 退路。

### B. 圖示庫分裂（違反規則一軌道 2）
- 使用 `lucide-react`：**26** 檔
- 使用 `react-icons/gi`：**37** 檔
- **同時使用兩者：18 檔**

> 成因見 §5「文件衝突」。**依 2026-10-03 裁定（§6 A）：功能性 lucide 用法合規，DSH 不主動清理；
> 僅需清查「敘事性圖示誤用 lucide」者。**

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

### E. 建置
- `npm run build` 通過（exit 0）。
- JS bundle 1,823 kB / gzip 515 kB，觸發 Vite chunk-size 警告（>500 kB）。
  建議未來以 `manualChunks` 或 `import()` 拆分，但**非當前規範要求**。

---

## 5. 文件衝突與過時處（DSH 判讀依據）

### A. 圖示政策自相矛盾
- `PROJECT_SPEC.md:26` 列「**圖標庫：`lucide-react`**」
- `PROJECT_SPEC.md:100` 卻寫「全站所有其餘圖標**默認一律從 Game-Icons.net** 選取，
  **嚴禁隨意混用現代極簡扁平圖標**」
- `GEMINI.md` 規則一軌道 2 與 `PROJECT_CHANGELOG.md:10` 皆只認 Game-Icons.net。

> lucide-react 正是「現代極簡扁平圖標」。
> **依 `GEMINI.md` 軌道 2 豁免條款**：功能性控件可使用既有圖示庫，
> 故 18 個混用檔案中的 lucide 用法**若屬功能性控件即為合規**，DSH 不主動清理。
> 惟**敘事性圖示**若誤用 lucide，須改用 `react-icons/gi`——此為後續清查重點。
> `PROJECT_SPEC.md:26` 與 `:100` 的矛盾，一律以 `GEMINI.md` 為準。

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

### A. ~~軌道 2 的適用範圍~~ ✅ 已於 2026-10-03 裁定
使用者裁定：**敘事性圖示 → Game-Icons.net；一般功能性控件（返回、打叉等）→ 純 Unicode 即可。**
已寫入 `GEMINI.md` 軌道 2 豁免條款與軌道 3，並同步本檔 §2。
後續唯一待辦：清查**敘事性圖示誤用 lucide** 的個案。

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

| 階段 | 工作 | 前置條件 | 觸發規則四文案預審 |
|---|---|---|---|
| 1 | **`⚡` 語意哨兵遷移**：資料層改為結構化 `isOffensive` 欄位 + localStorage 遷移 | 無 | 否（純內部結構） |
| 2 | **裝飾性 Emoji 清除**：§4 A 清單中非 `⚡` 者 | **階段 1 完成** | **是**（多為面向使用者文字） |
| 3 | **敘事性圖示清查**：lucide 誤用於敘事圖示者改 `react-icons/gi` | 無 | 否 |

> ⚠️ **階段 1 未完成前，嚴禁執行階段 2。**
> 否則會誤刪 `⚡` 哨兵，導致全站攻擊性咒語判定（傷害／MP／預覽標記）全面失效。
>
> 階段 2 涉及大量面向使用者的文字改動，**必須先提交 `implementation_plan.md` 並取得確認**
> （依 `GEMINI.md` 規則四／本檔 §2）。

---

## 7. 本檔維護

- 本檔由 DSH 維護，**與 `GEMINI.md` 並存不互斥**。
- 若 `GEMINI.md` 新增或修訂規則，本檔僅需同步「DSH 對應實作」章節，**不得改寫 `GEMINI.md` 原文**。
- 每次完成稽核後，更新 §4 基準快照與 §6 待決狀態。

---

*建立於本次 DSH 稽核。稽核範圍：`src/` 75 檔、38,481 行；`npm run build` 通過。*
*2026-10-03：同步使用者裁定之圖示三軌分類（敘事 → Game-Icons；功能性控件 → Unicode 豁免），並修正 `GEMINI.md` 規則五.1 之 Emoji 檢測正則。*
