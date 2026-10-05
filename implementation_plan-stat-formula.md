# 實作計畫：跑團卡「數值構成公式」點擊展開（＋研究發現的缺陷修復）

> **依 `GEMINI.md` 規則四 / `AGENTS.md` §2：本計畫的**所有面向使用者的文字**須經你確認後方可實裝。**
> 建立：2026-10-05　｜　基準 HEAD：`e0a36c5`（工作樹另有未提交改動，本計畫不觸及）
> 對應你的三個要求：① 職業技能改數值是否真的反映　② 免費增益是否真的有影響　③ 跑團卡數值可點開看公式

---

## 第一部分：研究結論（已逐項實測，非推論）

### 1.1 會改變數值的職業技能 —— 全 35 個職業中只有 2 個

官方原書（Core v1.1）全文掃描「maximum Hit / Mind / Inventory Points」＋「Permanently increase」，
**只有兩個職業技能會永久改變數值上限**：

| 職業 | 技能 | 官方原文（PDF 頁） | 縮放 | 本專案資料 |
|---|---|---|---|---|
| 守護者 | 不動要塞 | `FORTRESS Permanently increase your maximum Hit Points by (SL × 3).`（p.199） | SL × 3 | ✅ 相符 |
| 博學士 | 集中 | `FOCUSED Permanently increase your maximum Mind Points by (SL × 3).`（p.201） | SL × 3 | ✅ 相符 |

Playtest 版（2024-09-09 / 2025-01-23 / 2024-12-05 三份材料 p.31 逐字相同）：
`The HP increase becomes 【SL × 5】, and this Skill's maximum Skill Level becomes 4.`
→ 本專案的 `不動要塞【Playtest】SL × 5`、`集中【Playtest】SL × 5` ✅ 相符。

三大奇幻手冊（高魔 4 職／自然 4 職／科技 3 職）＋特典（2 職）**沒有任何職業技能會改變 HP / MP / IP 上限**，
只有免費增益會。此結論經四本 PDF 全文正則掃描確認，非抽樣。

**實機驗證（本輪實跑 `calculateCharacterStats`）**：

```
[不動要塞 SL5 守護者]  maxHp 65   （基礎 45 ＋ 免費增益 5 ＋ 技能 15）
[集中 SL5 博學士]      maxMp 65
[守護者 無技能]        maxHp 50
[不動要塞 PT SL4]      maxHp 70
```

→ **點選後確實有反映在角色體質上**。`ClassSkillCard` 儲存 SL → `CharacterEditor.handleUpdateClassSkills`
→ `characterEngine` 以技能名比對加成，整條鏈路是通的。

### 1.2 每個職業的免費增益 —— 有反映，但二選一職業有一半不可達

**有反映的部分**（實測 35 個職業逐一模擬引擎判定）：

- HP +5 / MP +5 / IP +2 三種固定增益 → 全部正確。
- 官方免費增益逐條核對（Core p.177–221、高魔 p.137–149、自然 p.139–161、科技 p.151–161、特典 p.7/p.13）
  **與本專案 `rulesData.json` 的 35 筆完全一致，無一筆數值錯誤**。
- 原書「同種免費增益會疊加」→ 引擎以累加實作 ✅。
- 非數值類免費增益（儀式學派／造物／職業武器防具盾牌）→ 由 `getProficiencies` 承接，
  在構建工坊步驟 4 以 `職業近戰 ✓/✗` 等四格呈現，並驅動 `armorWarning` / `shieldWarning` ✅。

**不可達的部分（缺陷）**：

| 編號 | 位置 | 問題 | 實測 |
|---|---|---|---|
| **D1** | `characterEngine.js:299-325` | 回傳物件**沒有** `bonusHp` / `bonusMp` / `bonusIp`，但 `CharacterCard.jsx:208/221/234` 與 `CharacterPlayHUD.jsx:749/787/826` 的 `title` 都在讀它們 → 畫面顯示「被動加成(**+undefined**)」 | 確認 `bonusHp === undefined` |
| **D2** | `characterEngine.js:165-172` | 二選一職業（秘儀師【Playtest】／死靈術士／舞者／祈喚者／植物學家／卡牌大師）的「HP +5 **或** MP +5」**沒有任何 UI 可選**；`chosenBenefit` 全專案**只被讀、從未被寫入** → 一律落回 HP +5，**MP 選項永遠不可達** | `[舞者 未指定] maxHp 50 / maxMp 45` |
| **D3** | `characterEngine.js:163` | `isChoiceClass = fb.includes('或')` → **暗黑之刃【Playtest】** 的 `'或'` 出現在「近戰**或**遠程武器（二選一）」，被誤判為二選一職業。目前靠「未指定→預設 HP+5」僥倖正確；一旦 D2 修好、玩家選了 MP，就會得到**錯誤的 MP +5** | `[暗黑之刃PT 指定MP] maxHp 45 / maxMp 50`（應為 50 / 45） |
| **D4** | `characterEngine.js:163` | `fb.toLowerCase().includes('or')` 為潛在誤判（任何含 `or` 的英文字串都會命中）。目前資料無拉丁字，屬**潛伏**缺陷 | — |
| **D5** | `characterEngine.js:213-222` | 金手指「倖存者（自奇／科奇）」第三個選項「**IP 永久 +2**」未實作；「墮落天使」選項③「**最大 MP +10**」未實作（原書自然 p.129／科技 p.129／特典 p.18） | 只給 HP+5 / MP+5 |
| **D6** | `rulesData.json` `equipment.accessories` | 官方飾品「**洋蔥戒指**」（Core p.289：每個**不同職業**使最大 HP 與 MP 各 +2）不在資料內，玩家無法選用 | 資料僅 6 筆飾品 |
| **D7** | `characterEngine.js:112-115` | 暗黑之刃【Playtest】的「職業近戰**或**遠程（二選一）」永遠只判定為近戰 → 職業遠程永遠 ✗ | `fb.includes('遠程')` 為 false |

---

## 第二部分：功能設計 —— 跑團卡數值點擊展開公式

### 2.1 目標行為

跑團卡（`CharacterPlayHUD`）與角色卡（`CharacterCard`）上**每一個數值**都可以點，
點開後就地展開一個面板，把「什麼 ＋ 什麼 ＝ 這個總額」逐項列出，
**每一項的小字在上、數值在下**（小字說明這筆數字的來源：等級、哪個職業、哪個技能的第幾級…）。

視覺示意（以 HP 65 為例）：

```
最大生命值                                                      65
─────────────────────────────────────────────────────────────────
 基礎體魄 d8 × 5      角色等級 Lv 5     守護者 免費增益    不動要塞 SL 5 × 3
      +40                 +5                 +5                 +15        = 65
```

### 2.2 掛載點

| 介面 | 檔案 | 可點擊的數值 |
|---|---|---|
| **跑團卡** | `CharacterPlayHUD.jsx` | 最大生命值、最大魔力值、最大道具點、危機門檻、物防、魔防、先攻修正、四屬性當前骰 |
| **角色卡** | `CharacterCard.jsx` | 最大生命值、最大魔力值、最大道具點、物防、魔防、先攻修正 |
| 戰鬥追蹤器角色抽屜 | `CharacterDrawer.jsx` | 共用 `CharacterCard`，自動受益 |

### 2.3 引擎改動（`characterEngine.js`）

1. **補回** `bonusHp` / `bonusMp` / `bonusIp` 到回傳物件（修 D1）。
2. 新增 `breakdown`，每一項為 `{ label, value, kind }`，`kind` 供樣式分色：
   `base`（基礎骰）／`level`（等級）／`class`（職業免費增益）／`skill`（特技 SL）／
   `equip`（裝備飾品）／`heroic`（英雄技能）／`quirk`（金手指）／`status`（狀態異常）。
3. 公式維持不變：`最大HP = 基礎體魄 × 5 ＋ 等級 ＋ Σ加成`（Core p.163 逐字），
   `最大MP = 基礎意志 × 5 ＋ 等級 ＋ Σ加成`，`最大IP = 6 ＋ Σ加成`，
   `危機 = ⌊最大HP ÷ 2⌋`。**只增加可讀性，不改任何既有數值。**

### 2.4 新元件

`src/features/character-sheet/components/StatFormulaPanel.jsx`（純展示、零新依賴、可用鍵盤關閉）。

### 2.5 待你確認的文案（**規則四硬性關卡**）

| 位置 | 文案 |
|---|---|
| 觸發提示（`title`） | `點擊查看公式` |
| 面板標題 | `數值構成` |
| 合計符號 | `=` |
| 收合鈕 | `收起` |
| HP 條目 | `基礎體魄 d8 × 5`、`角色等級 Lv 5`、`{職業} 免費增益`、`{技能} SL 5 × 3`、`飾品 {名稱}`、`英雄技能 額外HP`、`金手指 {名稱}` |
| MP 條目 | `基礎意志 d8 × 5`、`角色等級 Lv 5`、`{職業} 免費增益`、`{技能} SL 5 × 3`、`飾品 {名稱}`、`英雄技能 額外MP`、`金手指 {名稱}` |
| IP 條目 | `基礎值 6`、`{職業} 免費增益`、`飾品 {名稱}`、`英雄技能 額外IP` |
| 危機 | `最大生命值 65` ／ `÷ 2，向下取整` |
| 物防 | `當前敏捷 d8`、`{防具} 敏捷 + 1`、`{盾牌} 物防 +2`（重甲改為 `{防具} 固定值 10`） |
| 魔防 | `當前洞察 d10`、`{防具} 洞察 + 1`、`{盾牌} 魔防 +2` |
| 先攻 | `{防具} 先攻 -1`、`飾品 {名稱} +2` |
| 屬性 | `基礎骰 d8`、`狀態 緩慢 降 1 階` |
| 無加成時 | `無額外加成` |
| 面板底部備註 | `最大生命值與魔力值採用基礎骰，不受狀態異常影響；物防與魔防採用當前骰。` |

> **符號**：只用 `＋ - × ÷ = ⌊ ⌋` 等數學字符與既有 dingbat（`✦ ❖`），**零 emoji**（軌道 3）。
> **純中文**：僅允許縮寫 `DEX/INS/MIG/WLP`、`HP/MP/IP`、`SL`、`Lv`、`d6~d20`（規則三）。

### 2.6 實作順序（取得確認後執行）

1. 引擎：補 `bonusHp/bonusMp/bonusIp`、新增 `breakdown`（**不動任何現有數值**）。
2. 新元件 `StatFormulaPanel.jsx`。
3. 掛載 `CharacterPlayHUD`（HP / MP / IP / 危機 / 物防 / 魔防 / 先攻 / 四屬性）。
4. 掛載 `CharacterCard`（HP / MP / IP / 物防 / 魔防 / 先攻）。
5. 測試：`tests/characterEngine.test.mjs` 新增 breakdown 斷言（既有 268 項須全數保持通過）。
6. 驗證：`npm test` ＋ `npm run build`（exit 0）＋ 修正版 Emoji 正則掃描（0 命中）。

---

## 第三部分：本次明確不在範圍

- **D4 / D5 / D6 / D7** —— 等你另外裁定；本計畫不擅自改動。
- 三個既有待裁定缺陷（`applyLevelUp` 空扣 EXP、`fabulaPoints` 0 → 3、等級夾在 5）——維持 `docs/handoff.md` §4 現狀。
- 連線房間同步（`docs/room-sync-plan.md`）——不相關。
