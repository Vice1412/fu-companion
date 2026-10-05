# 交接簡報（Handoff Brief）

> **本檔的定位**：給「接替上一個 DSH session」的新 session 讀。
>
> **規範不靠本檔傳承。** `AGENTS.md` 會被 harness 自動注入成 workspace instructions，
> `GEMINI.md` 是上位規範——那兩份才是規則本體，會自動生效。
> **本檔只補三件它們沒有的事**：專案剛搬家、目前做到哪、以及幾個踩過會痛的坑。
>
> 建立：2026-10-05　｜　建立時的 HEAD：`e0a36c5`（**2026-10-05 歷史改寫後為 `0454519`**，見 §8）

---

## 0. 先做這三件事

1. **確認實際工作目錄**：harness 會回報，**以它為準**。本檔與 `AGENTS.md` §1 記載的路徑可能是舊的（見 §1）。
2. **跑一次 `npm test` 與 `npm run build`**，確認接手的是一個綠燈的基準。基準數字見 §2。
3. **讀 `docs/decisions.md` 的 §L（資料層）與 §K7／K8（近期兩次裁定）**，那是最新的決策上下文。

---

## 1. 專案剛搬家（最急，先處理這個）

**專案已從 `FU Companion` 更名為《物語手帳》**（套件名 `monogatari-techou`），
且**本機路徑即將變更**。

### 1.1 會被路徑變更影響的地方

| 位置 | 現況 | 新 session 該怎麼做 |
|---|---|---|
| `AGENTS.md:25`「工作目錄」 | 仍寫舊路徑 `E:\MINGWAN\Projects\FU Companion` | **以 harness 回報為準**，並把該行更新成新路徑 |
| `PROJECT_SPEC.md:21`、`:179` | 也寫舊路徑 | 該檔已標記為**過時歷史文件**，不必改（依 `GEMINI.md` 規則六） |
| `.github/workflows/deploy.yml` | 用相對路徑，**不受影響** | 不用動 |
| `vite.config.js` | `base: './'`，**不受影響** | 不用動 |

### 1.2 一個已經過時的記述（順手修掉）

`AGENTS.md` §6.1 寫「GitHub repo 改名 —— 已決定改，指令待執行 —— **待執行**」。
但**實測 `git remote -v` 已經是 `https://github.com/Vice1412/monogatari-techou.git`**——
改名其實已經完成。該列應改為「已結案」。

> 這正是 `GEMINI.md` 規則六存在的理由：**寫下來的狀態會過時，每次都要重新實測。**

### 1.3 刻意不改的東西（改了會壞）

| 項目 | 為什麼不能改 |
|---|---|
| `src/data/keys.js` 的 `fu_companion_*` 鍵名 | **localStorage 鍵名**。改了會讓所有既有使用者的角色卡／NPC 庫／戰鬥存檔**全部讀不到**。它不是「標題」，授權條款也管不到 |
| `fultimatorConverter.js` 的 `uid: 'fu_companion_export'` | 匯出格式識別字，改了可能影響與 Fultimator 的互通 |
| `GEMINI.md` 全文 | 最高規範，DSH **不得改寫其原文**（只能同步 `AGENTS.md` 的對應實作章節） |

---

## 2. 現況快照（實測，非記憶）

| 項目 | 值 |
|---|---|
| 套件名 | `monogatari-techou`　｜　顯示名《物語手帳》 |
| 分支 | `main` |
| 工作樹 | **乾淨**（全部已提交，無未追蹤檔案） |
| `npm run build` | exit 0，約 4.6 秒，**2,023 kB / gzip 574 kB**（chunk-size 警告為既有現象） |
| `npm test` | exit 0，**60 + 33 + 75 + 56 + 235 + 211 + 322 + 86 + 99 + 270 ＋ Emoji 掃描** |
| 測試檔 | `tests/` 共 11 檔（emojiScan／sentinel／properNouns／tinkererProjects／classResources／gourmet／aceOfCards／characterEngine／dataLayer／starterPresets／ruleCodex） |
| 資料層 | `src/data/keys.js`（7 權威鍵 + 3 舊鍵）、`src/data/store.js`、`shared/schema.js` |
| 文件 | `docs/`：`decisions.md`、`agents-changelog.md`、`room-sync-plan.md`、`skill-coverage.md` |
| Git 歷史 | ⚠️ **2026-10-05 改寫過**（`resources/` 徹底清除），所有 SHA 與改寫前不同，見 §8 |

---

## 3. 在途工作：連線房間同步

**這是目前唯一一件「已規劃、未開工」的功能。**

- 計畫文件：**`docs/room-sync-plan.md`**（狀態：**待使用者裁定**）
- 架構已定：**Cloudflare Workers + Durable Objects**（一個房間 = 一個 DO），目標月費 $0
- **前置（階段 0）已完成**：資料層收斂、`shared/schema.js` 契約、角色卡引擎測試

### 3.1 這份計畫裡有一處已過時，開工前先修

`room-sync-plan.md` §1.1 的表格寫「資料層：**純 localStorage，無抽象層**」。
**這已經不成立**——階段 0 就是為了做這件事，`src/data/store.js` 現在是全站唯一入口。
讀該文件時請以 `AGENTS.md` §1 與 `docs/decisions.md` §L 為準。

### 3.2 決定免費或付費的三條設計紀律（計畫的核心，不要弄丟）

1. **事件驅動，非狀態驅動**：只在離散事件送出（HP 由 12 變 8、輪次 +1、發布獎勵）。
2. **提交時送，拖動時不送**：HP 輸入用確認鈕或失焦，**嚴禁 `onChange` 即時廣播**。
3. **連線時快照、之後增量**：`snapshot` 只在 WebSocket 開啟時送一次，其後一律 `patch`。

> 算術：免費方案每日 10 萬請求，WebSocket 訊息雙向各算一次。六人團一次事件 = 1 進 6 出 = 7 請求，
> 四小時團約用掉 17%。但若照既有 `CombatTracker.jsx` 那種「狀態一變就廣播全份」的寫法，
> **拖一次血量轉盤就能破百次請求**。
> 另須啟用 **WebSocket Hibernation**，否則 DO 常駐 24 小時會吃掉 10,800／13,000 GB-s。

### 3.3 既有的 `peerSync.js` 是壞的，不要試著修

`src/features/combat-tracker/utils/peerSync.js`（PeerJS／WebRTC）經實測**無法運作**，
且不是「未完成」而是「連不上」：

1. 房主 Peer ID 帶時間戳後綴、玩家端連的是不帶後綴的 ID，**兩者永不相等**（`:23` vs `:66`）。
2. 全專案僅一處廣播且被 `isHost` 鎖住（`CombatTracker.jsx:96`），**玩家改自己 HP/MP 不會傳出去**。
3. 「同步角色進房間」只寫本機 localStorage 就跳成功提示，`PUSH_CHARACTER` 封包**只有接收端沒有發送端**。

計畫的立場是**移除**它，不是修補。

---

## 4. 四個未修的既有缺陷（等使用者裁定）

`tests/characterEngine.test.mjs` 在驗證官方 Camilla 向量時發現，**已以 `// TODO(bug):` 記錄，未動 `src/`**：

| # | 位置 | 問題 |
|---|---|---|
| 1 | `characterEngine.js:349-358` | `applyLevelUp` 遇到不存在的職業名仍扣 10 EXP 並升級，但 `classes` 完全不變——玩家付出 EXP 卻什麼都沒得到 |
| 2 | `characterEngine.js:524` | `fabulaPoints: char.fabulaPoints \|\| 3`——物語點合法可為 0，導出時卻被還原成 3 |
| 3 | `characterEngine.js:127` | 等級被 `Math.max(5, ...)` 夾住，等級 1~4 的 HP/MP 偏高（等級 1 實測 HP 50，原書公式應為 46）。路徑可達：`fultimatorConverter.js:88` 可匯入 lvl < 5 |
| 4 | `characterEngine.js:232-233` | 防具／盾牌找不到時回退 `armors[0]`／`shields[0]`，語意錯誤。目前因索引 0 恰為中性而無偏差，屬**潛伏**缺陷 |

> **不要自行開修**。使用者尚未裁定；`GEMINI.md` 規則四要求先取得確認。
> 缺陷 1 與 3 有實際數值／資源損失，建議優先提請裁定。

---

## 5. 工作紀律（會反覆踩的坑）

### 5.1 硬性關卡

| 規則 | 內容 |
|---|---|
| 規則四 | ~~**面向使用者的文字**（介面文案、提示、按鈕標籤）**必須先寫計畫再問**，取得明確確認才能實裝~~ —— ⚠️ **2026-10-05 經使用者授權停用**：不再需要 `implementation_plan.md` 預審，**計畫討論定案後直接實裝**（見 `AGENTS.md` §2 規則四） |
| 規則五 | 每次改動後**必須**跑 Emoji 掃描 + `npm run build`（exit 0），兩項未過不得宣稱完成 |
| 規則六 | **嚴禁**引用歷史報告、舊 Session 草稿或 `PROJECT_CHANGELOG.md` 作為現況結論——一律重新實測源碼 |

### 5.2 已踩過五次的地雷

**把 `⚠️` 寫進自己的註解。** 五次分別在 `properNouns.js`、`tinkererProjects.js`、
`classResources.js`、`aceOfCardsData.js`、`AceOfCardsTable.jsx`。
`npm run test:emoji` 會攔下，但那是**事後**攔——寫的時候就別用。
掃描範圍是 `src/` **與 `shared/`**；新增原始碼目錄時記得同步掃描範圍，否則新目錄會成為盲區。

### 5.3 文件分工（別寫錯地方）

| 想寫什麼 | 寫到哪 |
|---|---|
| 規範、規則、環境事實、技術債基準 | `AGENTS.md`（會被注入，有 **65,536 bytes 上限**） |
| 「為什麼這樣決定」的完整紀錄 | `docs/decisions.md` |
| 變更紀錄 | `docs/agents-changelog.md` |
| 最高規範 | `GEMINI.md`（**只能讀，不得改寫原文**） |

> `AGENTS.md` 曾在 68,142 bytes 時**被 harness 截斷**——而截掉的正是最新的變更紀錄。
> 所以細節一律往外放，`AGENTS.md` 只留索引。

### 5.4 其他

- `scratch/` **不在版控內**（`.gitignore`）。放在那裡的測試或 bundle 會與源碼脫鉤——**測試一律放 `tests/`**。
- `resources/`（官方原書節錄與他人漢化）**已移出版控**，但**仍在 git history 裡**，且 repo 是公開的。這是已知的版權曝險，使用者知情。
- 官方原書在**專案目錄之外**（`E:\MINGWAN\TRPG\Fabula ultima\`）。涉及《FU》專有子系統的實作前**必須先抽取原書逐條核對**（規則二.4）。抽取方式與**頁碼偏移**見 `AGENTS.md` §1.1——注意偏移**因書而異**（Core／Atlas 為 +2，特典合輯為 0）。

---

## 6. 建議的下一步（依序）

1. 更新 `AGENTS.md:25` 的工作目錄為新路徑；把 §6.1 的「repo 改名」改為已結案。
2. 跑 `npm test` + `npm run build`，確認基準綠燈。
3. 向使用者提請裁定 §4 的四個缺陷（特別是 1 與 3）。
4. 若使用者要繼續連線功能：進 `room-sync-plan.md` 的**階段 1**（`wrangler dev` 本機雙瀏覽器互驗），
   開工前先修 §3.1 那處過時記述。

---

## 7. 交接範圍的誠實聲明

本檔能完整傳承的是：**已驗證的狀態、已裁定的決策、硬性規則、以及踩過的坑**。

本檔**無法**傳承的是：對話過程中的摸索、我對使用者偏好的直覺、以及未寫下來的判斷。
那些東西沒有被記錄就等於不存在——**所以新 session 該做的不是相信我寫的，而是重新實測**（規則六）。
本檔的每個數字都是建立當下實測的，但**時間會讓它過時**。

---

## 8. ⚠️ Git 歷史已於 2026-10-05 改寫（接手前必讀）

**這一節是為了防止新 session 撞上「查到的 commit 不存在」而寫的。**

### 8.1 發生了什麼

`resources/`（106 檔／92 MB 的官方原書節錄與他人漢化）原本已被 `git rm --cached` 並列入 `.gitignore`，
但**歷史層仍完整**——116 個路徑在 3 個已推上 GitHub 的 commit 裡。使用者裁定徹底清除，做法是改寫歷史 ＋ force push。

- **所有 SHA 與改寫前不同。** 文件裡引用舊 SHA 的地方已同步更正，但**其他地方的舊 SHA 一律失效**。
- commit 數 74 → **73**（`aad5241`「只加了 style guide PDF」因挖掉後成為空 commit 而被 `--prune-empty` 剔除）。
- `.git` 由 **77.49 MB 降至 11.21 MB**。

### 8.2 本機檔案沒有受影響

`resources/` 的 **106 檔／92 MB 仍在磁碟上**，且仍被 `.gitignore:35` 排除——本地照常可用，只是不再進 git。
詳細過程見 `docs/decisions.md` §O。

### 8.3 備份位置（改寫前的完整歷史）

```
scratch/pre-purge-backup.git      # mirror clone，含改寫前的 110 個 ref 與 116 個 resources 物件
```

`scratch/` 已列 `.gitignore`，**這份備份不會被推上去**。要還原舊歷史可以從這裡來。
⚠️ 也因為如此，**不要把 `scratch/` 加進版控**。

### 8.4 尚未完成的一件事

force push 只讓舊 commit 變成「不可達」，**GitHub 不會立刻回收**，知道 SHA 的人短期內仍讀得到 blob。
使用者裁定去信 **GitHub Support 請其清除不可達物件**——這件事需要由使用者在 GitHub 端確認。
若未處理而想更徹底，備案是**刪掉 repo 重建**（`forks_count: 0`、無 star／issue／PR，損失極小）。

### 8.5 給新 session 的教訓

要驗證「公開 repo 有沒有不該公開的檔案」，**三個層都要查**——只查工作樹會得到錯誤的安心：

```powershell
git ls-files <path>                                      # 索引層
git check-ignore -v <path>                               # 忽略規則
git rev-list --objects --all | Select-String "<path>"    # 歷史層（真正會漏的那一層）
```

