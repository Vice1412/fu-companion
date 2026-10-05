# 規則概念速查 —— 入口可發現性修正（文本規劃草案）

> **依 `GEMINI.md` 規則四 / `AGENTS.md` §2，本草案須經使用者確認後方可實裝。**
> 建立：2026-10-05　｜　觸發：使用者回報「網頁上完全找不到規則速查」

> ## ✅ 使用者裁定（2026-10-05）
> 採 **「只加章節標頭」**。§2 的封面按鈕**不實作**，`BookCoverHub.jsx` 不動。
> 已實裝：`App.jsx`（`handleOpenCodex` ＋ 傳 prop）、`ChapterHeader.jsx`（`onOpenCodex` ＋ 按鈕）。

---

## 1. 現況診斷（已以當前源碼驗證）

速查本體**確實存在且資料完整**：

| 項目 | 事實 | 依據 |
|---|---|---|
| 抽屜元件 | `RuleCodexDrawer` 已全域掛載 | `src/App.jsx:18`、`src/App.jsx:368` |
| 資料 | 16 條（核心 6 ＋ 擴充 10） | `ruleCodexData.js` / `ruleCodexExpansion.js` |
| 測試 | `npm run test:codex` 守覆蓋率、關鍵字唯一性、授權合規 | `tests/ruleCodex.test.mjs` |

**問題不在功能，在入口。** 抽屜是**純事件驅動**，唯一開啟途徑是 window 事件
`fu:open-rule-codex`（`RuleCodexDrawer.jsx:53-69`）。全 `src/` 的派送點只有 6 處：

| 檔案 | 行 | 語境 |
|---|---|---|
| `CharacterPlayHUD.jsx` | 1423、1695 | 角色卡 → 修補匠「小工具」技能卡 |
| `TinkererWorkshop.jsx` | 753、870、1364、1524 | 角色卡 → 修補匠工坊 |
| `skillFormulaEvaluator.jsx` | 277 | 技能描述內的**虛線底線關鍵詞**點擊 |

推論（與使用者體感一致）：

- **封面（`BookCoverHub`）**：零入口。
- **NPC 工坊**：零入口（該模組不使用 `SkillDescription`，也不派送事件）。
- **戰鬥輪次／命刻記錄**：零入口。
- **角色卡**：需先有角色、且該角色有修補匠技能，才會看到按鈕；否則只能「猜到」技能描述裡
  有虛線底線的詞可以點。

即：**16 條資料只有修補匠一條路走得進去**，其餘 15 條實質不可達。

---

## 2. 預計新增的介面文案（僅兩處）

| 位置 | 顯示文字 | 滑鼠提示（title） | 圖示 |
|---|---|---|---|
| 封面底部工具列（`雙屬性擲骰盤` 左側） | `規則概念速查` | `開啟規則概念速查：阿爾卡納、儀式、小工具、造物專案等 16 項官方子系統` | `GiSpellBook` |
| 章節標頭（`擲骰器` 左側） | `規則速查` | `開啟規則概念速查（16 項官方子系統）` | `GiSpellBook` |

- 兩者皆為**純中文**，符合規則三。
- 標籤沿用既有字串 `規則概念速查`（程式內已出現 6 次），**不新造詞彙**。
- 圖示沿用既有速查按鈕的 `GiSpellBook`，符合規則一軌道 2。

---

## 3. 預計改動（3 檔，無新增依賴）

1. `src/App.jsx`
   - import `openRuleCodex`，新增 `handleOpenCodex = () => openRuleCodex()`。
   - 傳 `onOpenCodex` 給 `BookCoverHub` 與 `ChapterHeader`。
2. `src/components/book/ChapterHeader.jsx`
   - 新增 prop `onOpenCodex`，在「擲骰器」左側插入速查按鈕（沿用 `theme.toolBtn` 樣式）。
3. `src/components/book/BookCoverHub.jsx`
   - 新增 prop `onOpenCodex`，在底部工具列插入速查按鈕。

**設計取捨**：`book/` 元件只收 prop、不 import feature 模組，維持既有分層；
`RuleCodexDrawer` 與 16 條資料**完全不動**。

---

## 4. 驗證標準

| 指標 | 目標 |
|---|---|
| `npm run build` | exit 0 |
| `npm run test:emoji` | 0 命中 |
| `npm run test:codex` | 16/16 條不受影響 |
| 手動 | 封面與四個章節標頭皆可開啟抽屜；ESC 可關閉 |

---

## 5. 明確不在本次範圍

- NPC 工坊的敘述文字加上關鍵詞超連結（需改 `renderTextWithAffinities` 呼叫鏈，另案評估）。
- 抽屜內的 16 個分頁在窄螢幕的橫向捲動體驗（現況已可捲動）。
