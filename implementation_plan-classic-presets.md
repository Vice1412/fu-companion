# 經典職業搭配擴充（HF／NF／TF／Bonus）— 文本規劃草案

> **依 `GEMINI.md` 規則四 / `AGENTS.md` §2，本草案須經使用者確認後方可實裝。**
> 建立：2026-10-05　｜　觸發：使用者指示「檢查 high fantasy / natural fantasy / techno fantasy / bonus collection，全部實裝」
> 基準：`src/features/character-sheet/data/starterPresets.js` 現有 **Core 20 組**（`STARTER_PRESETS`）

> ## ✅ 使用者裁定（2026-10-05）
> 採 **B 案（官方資料優先）**，並追加指示：
> **「把 core 20 的內容也改成一樣的格式，也就是不需要風味」**。
> 故 Core 20 的 `subtitle`／`tagline`／`avatar`／`identity`／`theme`／`origin`／`bonds` **全部移除**，
> 81 組一律只收官方欄位（四維、職業技能、裝備、資金、金手指／自訂武器／魔晶石註記）。
> 已實裝並以 `test:presets` J 區段設為護欄。細節見 `docs/decisions.md` §P。

> ## ✅ 使用者追加裁定（2026-10-05，第二輪）
> 1. **`魂流靈刃` 的四維是官方筆誤** → 依「技能與武器組合」補一位：**敏捷 d6 → d8**，
>    得 `{ dex: 8, ins: 6, mig: 8, wlp: 10 }` ＝ 正典 `(10,8,8,6)`。
>    判準是全 81 組的陣列形狀分佈（`(10,8,8,6)` 68 組）＋ 武器命中公式 `DEX + MIG` ＋
>    技能組無任何洞察系技能（見 `docs/decisions.md` §P5-2）。
> 2. **`鐵甲大姊` 的【隔音屏障】SL2** → 使用者確認推導正確，實裝時即為此值，**無需改動**。
> 3. **這個功能不顯示職業英文名** → 移除兩處 `withEn()`；資料層 `en` 保留供搜尋用，不渲染。
>    見 `docs/decisions.md` §P6。

> ## ✅ 使用者追加裁定（2026-10-05，第三輪）＋ 規則四授權
> 4. **套用時連咒語一起選好** → 子選擇內嵌在 `classes[].skills[].selectedOptions`（59 個技能），
>    另加小工具／阿爾卡納／個人載具三個職業子系統。見 `docs/decisions.md` §P7。
> 5. **規則四授權停用** → 使用者指示「不需要再輸出 implementation plan 這個規矩，
>    日後有什麼計劃討論完畢後就可以直接實裝」。**本檔自此為歷史紀錄，不再作為流程關卡。**
>    見 `AGENTS.md` §2 規則四 與 `docs/decisions.md` §P10。

---

## 1. 稽核結果：四本手冊確實都有對應章節

**結論：有，而且是與 Core 完全同格式的官方內容。四本合計新增 61 組。**

| 手冊 | 章節標題 | 印刷頁 | PDF 頁 | 個人配置 | 預組隊伍 | 小計 |
|---|---|---|---|---|---|---|
| 高度奇幻 | NEW CLASSIC CHARACTERS | 132–135 | 134–137 | 10 | 2 隊 × 4 | **18** |
| 自然奇幻 | NEW CLASSIC CHARACTERS | 134–137 | 136–139 | 10 | 2 隊 × 4 | **18** |
| 科技奇幻 | NEW CLASSIC CHARACTERS | 146–149 | 148–151 | 10 | 2 隊 × 3＋4 | **17** |
| 特典合輯 | HALLOWEEN CHARACTERS | 24–25 | 24–25 | 8 | — | **8** |
| | | | | | **合計** | **61** |

- 頁碼偏移：三大手冊 **PDF = 印刷 + 2**；特典合輯 **偏移 0**（與 `AGENTS.md` §1.1 記載一致，已實測複驗）。
- 每組的官方欄位為：四維骰階、職業（等級）＋技能（含 SL）、裝備、起始資金。特典合輯的 8 組**另有金手指**。
- 科技奇幻的兩隊預組與部分個人配置使用**魔晶石（Mnemosphere，TF 可選規則）**。

### 1.1 官方中文版現況（已查核）

`resources/角色卡/**/01_经典职业搭配_*.pdf` 四份檔名雖為中文，**內容仍是英文頁面裁切**（只有 Core 的
`082_开始游戏_创建角色_经典职业搭配.pdf` 是真的簡中翻譯）。故本擴充的**角色名、風味文案沒有官方中文可依**，
但**職業名／技能名／裝備名／金手指名一律沿用本專案既有定譯**（見 §2）。

---

## 2. 譯名權威（規則二）

| 類別 | 權威來源 | 說明 |
|---|---|---|
| 職業名 | `sourcebookConfig.js` `CLASS_METADATA` | 沿用 CHM 譯名（依 `docs/decisions.md` §H 裁定）：魔奏者／指揮官／徽記師／植物學家／祈喚者／靈能者／突變體 |
| 技能名 | `rulesData.json` `classes[*].skills[*].name` | **逐字沿用，不新造**。EN→ZH 對照見 §5 附錄 |
| 裝備名 | `rulesData.json` `equipment` | 見 §2.1 |
| 金手指名 | `rulesData.json` `quirks[*].name` | 8 個萬聖節金手指全部已在庫（巫術後裔／束縛你的約定／怪物幫派／地獄差生／(不太)忠誠的僕人／被推翻的王／超級頭目(據說是)／亡者歸來） |

### 2.1 裝備英中對照（官方英文 → 本專案名稱）

| 英文 | 本專案 | 英文 | 本專案 |
|---|---|---|---|
| steel dagger | 短匕首 | sage robe | 賢者長袍 |
| crossbow | 戰弓 | travel garb | 旅行皮甲 |
| shortbow | 短弓 | combat tunic | 戰鬥輕甲 |
| greatsword | 巨劍 | silk shirt | 絲綢外衣 |
| broadaxe | 闊斧 | brigandine | 板條甲 |
| waraxe | 戰斧 | bronze plate | 青銅胸甲 |
| iron hammer | 鐵錘 | runic plate | 符文甲冑 |
| rapier | 刺劍 | bronze shield | 青銅圓盾 |
| katana | 武士刀 | runic shield | 符文圓盾 |
| bronze sword | 青銅劍 | pistol | 手槍 |
| light spear | 輕長矛 | staff | 法杖 |
| tome | 魔導書 | shuriken | 手裡劍 |
| iron knuckle | 鐵指虎 | | |

### 2.2 自訂武器（custom weapon）的處理方式

**問題**：61 組中有 **22 組**的主手是官方「自訂武器」（如「巨型環刃，投擲、遠程、精準、防禦強化、強力」），
但角色卡的裝備欄是**固定清單下拉選單**（`rulesData.equipment`），沒有自訂武器欄位。

**處置（本草案的設計決定）**：

1. `equipment.mainHand` 填入**最接近的同類基礎武器**（例如自訂「匕首類」→ `短匕首`），讓裝備欄與預算計算不會變成空值。
2. 新增 `customWeapon` 欄位，保存官方原文規格的中文翻譯；**經典搭配卡片會顯示這一行**，套用後玩家可依此自行改造。

> 這是**有損的近似**，但優於讓裝備欄留空。若你要的是「連自訂武器都做成可套用的資料」，
> 那是獨立的可選規則子系統（HF p.112–114），**不在本次範圍**（見 §7）。

### 2.3 魔晶石（Technosphere／Mnemosphere）

科技奇幻預組的 **11／12／13** 三組各帶一顆魔晶石（極性／動能／灼熱），效果等同**多一個職業等級的技能**。
全 `src/` **目前沒有任何魔晶石資料或 UI**（已檢索確認）。

**處置**：新增 `mnemosphere` 欄位保存官方規格的中文翻譯，卡片顯示為一行註記；
**不新增職業條目、不動引擎**（避免 `classes` 出現 `rulesData.classes` 不存在的鍵）。

---

## 3. 資料結構變更

新增 `src/features/character-sheet/data/expansionPresets.js`（匯出 `EXPANSION_PRESETS`），
`starterPresets.js` 追加 `ALL_STARTER_PRESETS`（＝ Core 20 ＋ 擴充 61）。

每筆新增欄位（**既有 20 筆完全不動**，缺欄位一律以預設值解讀）：

| 欄位 | 型別 | 說明 |
|---|---|---|
| `sourcebook` | `'core' \| 'highFantasy' \| 'naturalFantasy' \| 'technoFantasy' \| 'bonus'` | 手冊歸屬；**缺欄位視為 `'core'`**，故 Core 20 不需修改 |
| `group` | `{ id, title, en } \| null` | 預組隊伍；非預組者為 `null` |
| `customWeapon` | `string \| null` | 自訂武器規格（中文） |
| `quirk` | `string \| null` | 金手指名（僅特典合輯 8 組） |
| `en` | `string` | 官方英文角色名（僅資料用，**不渲染**，符合規則三） |

---

## 4. 預計新增的介面文案（規則三：純中文）

### 4.1 現況

Modal 標題 `官方經典職業搭配`、說明文字寫「**嚴格遵循官方核心規則書 (v1.1 Errata 校正版 p.172-175) 實裝。包含全套 20 組**」——
實裝 81 組後**這句話會變成錯的**，必須改。

### 4.2 新增／修改文案

| 位置 | 現值 | 新值 |
|---|---|---|
| Modal 說明 | 嚴格遵循官方核心規則書 (v1.1 Errata 校正版 p.172-175) 實裝。包含全套 20 組經典職業搭配、特技分配、起始裝備與資金。 | 嚴格遵循官方五本手冊實裝，共 81 組經典職業搭配：核心 20 組（p.172–175）、高度奇幻 18 組（p.132–135）、自然奇幻 18 組（p.134–137）、科技奇幻 17 組（p.146–149）、特典合輯 8 組（p.24–25）。含特技分配、起始裝備與資金。 |
| 搜尋框 placeholder | 搜尋經典搭配名稱、職業或特技（例如：黑騎士、神射手、修補匠、暗影突襲）... | 搜尋經典搭配名稱、職業或特技（例如：黑騎士、舞者、植物學家、混合變形）... |
| 手冊篩選列 | （無） | `全部` `核心` `高度奇幻` `自然奇幻` `科技奇幻` `特典合輯`（沿用 `SOURCEBOOKS[*].shortName`，**不新造詞**） |
| 卡片新增標籤 | （無） | 自訂武器行前綴 `自訂武器:`；金手指行前綴 `金手指:`；預組隊伍區塊標題用官方隊名（見 §6） |
| 套用按鈕 | 套用此經典配置 | 不變 |

- 手冊名稱一律取自 `SOURCEBOOKS[*].name` / `shortName`，**不新增字串**。
- 新前綴 `自訂武器:`／`金手指:` 為純中文，符合規則三。

### 4.3 必要的行為修正（非文案）

`handleApplyPreset` 現行只寫 `classes`／`equipment` 等，**不更新 `enabledSourcebooks`**。
套用高度奇幻配置後，若該角色的 `enabledSourcebooks` 不含 `highFantasy`，
職業選擇器的可用清單會查不到該職業。故套用時**一併把 `preset.sourcebook` 併入 `enabledSourcebooks`**。

---

## 5. 附錄：英文→中文技能對照（實裝依據，逐字沿用 `rulesData.json`）

**核心 15 職**

`Gadgets`小工具 · `Potion Rain`藥水雨 · `Secret Formula`秘密配方 · `Resourceful`有備無患 · `Tavern Talk`酒館閒聊 ·
`Shadow Strike`暗影突襲 · `Entropic Magic`熵系魔法 · `Bladestorm`劍刃風暴 · `Melee Weapon Mastery`近戰武器掌握 ·
`Lucky Seven`幸運七 · `Dodge`閃避 · `High Speed`迅捷 · `Barrage`連續射擊 · `Crossfire`交叉火力 ·
`Ranged Weapon Mastery`遠程武器掌握 · `Encourage`激勵 · `My Trust in You`我相信你 · `Spiritual Magic`靈魂魔法 ·
`Quick Assessment`快速評估 · `Feral Speech`野性交談 · `Spell Mimic`咒語模仿 · `Faithful Companion`忠實夥伴 ·
`Breach`破甲擊 · `Cheap Shot`偷襲 · `Warning Shot`警告射擊 · `Bone Crusher`碎骨擊 · `Elemental Magic`元素魔法 ·
`Spellblade`咒語之刃 · `Adrenaline`腎上腺素 · `Provoke`挑釁 · `Frenzy`暴怒 · `Withstand`忍耐 ·
`Counterattack`招架反擊 · `Well-traveled`通曉道路 · `Flash of Insight`靈光一閃 · `Focused`集中 ·
`Defensive Mastery`防守掌握 · `Bodyguard`護衛 · `Protect`保護 · `Arcane Regeneration`阿爾卡納再生 ·
`Bind and Summon`綁定和召喚 · `Soul Steal`靈魂竊取 · `Condemn`譴責 · `Unexpected Ally`意外盟友 ·
`Fortress`不動要塞 · `Hawkeye`鷹眼 · `Knowledge is Power`知識就是力量 · `Magical Artillery`魔法砲擊 ·
`Cataclysm`災難 · `Indomitable Spirit`不屈意志 · `Emergency Arcanum`緊急秘儀 · `Ritual Arcanism`秘儀學派儀式 ·
`Treasure Hunter`寶藏獵人 · `Visionary`高瞻遠矚 · `Dual Shieldbearer`雙重盾牌

**高度奇幻**

`Dance`起舞 · `Follow My Lead`隨我引導 · `Frenetic Footwork`狂熱步伐 · `Quick-Change`快速換裝 · `Wardancer`戰舞者 ·
`Bishop's Edict`主教法令 · `Charging Cavalry`騎兵衝鋒 · `Crushing Chariot`戰車碾壓 · `King's Castle`帝王堅壘 ·
`Queen's Gambit`皇后的秘密計劃 · `Magichant`魔法演奏 · `Resonance`迴響 · `Siren's Song`塞壬之歌 ·
`Sound Barrier`隔音屏障 · `Vibrato`顫音 · `Magic Symbols`咒語徽記 · `Mirage`幻影 · `Personal Touch`私人接觸 ·
`Symbolic Connection`徽記連結 · `Symbolism`徽記學

**自然奇幻**

`Battle Gardening`戰地園藝 · `Chloromancy`植生術 · `Graft`嫁接 · `Tree of Life`生命之樹 · `Verdant Sway`青翠之勢 ·
`Cooking`烹飪 · `Knife and Fork`舞刀弄叉 · `Made with Love`加點愛 · `Salt and Pepper`鹽與胡椒 ·
`Traveling Cook`準備食材 · `Elemental Harmony`元素和諧 · `Invocation`元素祈喚 · `Linked Invocation`聯結祈喚 ·
`Ripples`波紋 · `Wellspring Expansion`泉源擴張 · `Expiration Date`過期食品 · `I've Heard of It!`我聽說過 ·
`Private Stock`小金庫 · `Real Treasure`真正的財富 · `Winds of Trade`貿易之風

**科技奇幻**

`Akromorphosis`無拘形態 · `Biophagy`吞噬 · `Ecdysis`蛻皮 · `Genoclepsis`基因分析 · `Theriomorphosis`混合變形 ·
`Compression Tech`壓縮技術 · `Flexible Configuration`靈活配置 · `Heart in the Engine`引擎之心 ·
`Personal Vehicle`個人載具 · `Strong Grip`加大油門 · `Hypercognition`超感認知 · `Cognitive Focus`認知焦點 ·
`Navigator`領航員 · `Psychic Gifts`心靈天賦 · `Psychokinesis`念動力

> 咒語類子選項（`Elemental Magic (Ventus)`、`Entropic Magic (Drain Vigor)` 等）寫入技能的
> `selectedOptions`，名稱取自 `skillSuboptionsData.js`，與既有 Core 範本同機制。

---

## 6. 61 組清單（中文名為**新譯**，其餘欄位為官方原文）

### 6.1 高度奇幻（18）

| # | 中文名 | 英文原名 | 職業搭配 | 資金 |
|---|---|---|---|---|
| 1 | 雜技師 | ACROBAT | 舞者3／狂怒鬥士1／神射手1 | 170 |
| 2 | 舞巫 | DANCING WITCH | 舞者3／元素師1／熵師1 | 270 |
| 3 | 驅魔師 | EXORCIST | 神射手2／靈師1／徽記師2 | 170 |
| 4 | 劍客 | FENCER | 舞者2／遊蕩者1／武器大師2 | 70 |
| 5 | 偶像 | IDOL | 魔奏者3／吟唱者2 | 270 |
| 6 | 重金屬樂手 | METALHEAD | 魔奏者3／狂怒鬥士1／武器大師1 | 120 |
| 7 | 符文工匠 | RUNESMITH | 秘儀師3／徽記師2 | 170 |
| 8 | 中士 | SERGEANT | 指揮官2／狂怒鬥士1／武器大師2 | 70 |
| 9 | 戰略家 | STRATEGIST | 指揮官3／博學士2 | 120 |
| 10 | 旅行畫師 | TRAVELING ARTIST | 徽記師3／旅人2 | 270 |
| 11 | 萬人迷盜賊 | HEARTTHROB THIEF | 遊蕩者3／旅人1／武器大師1 | 120 |
| 12 | 天真的被選者 | NAÏVE CHOSEN | 秘儀師2／魔奏者2／吟唱者1 | 270 |
| 13 | 英勇騎士 | VALIANT KNIGHT | 指揮官2／守護者1／武器大師2 | 120 |
| 14 | 年少賢者 | YOUNG SAGE | 元素師3／熵師1／博學士1 | 270 |
| 15 | 哥德歌姬 | GOTH DIVA | 魔奏者2／舞者1／神射手2 | 120 |
| 16 | 金心賽蓮 | GOLDEN-HEARTED SIREN | 魔奏者4／吟唱者1 | 170 |
| 17 | 鐵甲大姊 | IRONCLAD BIG SIS | 魔奏者3／狂怒鬥士1／守護者1 | 70 |
| 18 | 派對靈魂 | LIFE OF THE PARTY | 魔奏者3／武器大師2 | 170 |

預組隊伍：**11–14＝「英雄小隊：整裝待發！」**（A COMPANY OF HEROES）、**15–18＝「樂團：這節奏將拯救世界！」**（THE BAND）

### 6.2 自然奇幻（18）

| # | 中文名 | 英文原名 | 職業搭配 | 資金 |
|---|---|---|---|---|
| 1 | 元素雜技師 | ELEMENTAL ACROBAT | 狂怒鬥士1／祈喚者3／神射手1 | 120 |
| 2 | 長笛武僧 | FLUTIST MONK | 祈喚者3／靈師2 | 270 |
| 3 | 邊境研究者 | FRONTIER RESEARCHER | 博學士1／商人2／神射手2 | 170 |
| 4 | 笑面老兵 | GRINNING VETERAN | 美食家3／守護者1／武器大師1 | 70 |
| 5 | 聖樹守護者 | KEEPER OF THE SACRED TREE | 秘儀師3／祈喚者2 | 370 |
| 6 | 蓮花決鬥者 | LOTUS DUELIST | 元素師2／植物學家2／武器大師1 | 70 |
| 7 | 靦腆藥劑師 | SHY APOTHECARY | 商人1／修補匠4 | 270 |
| 8 | 小商人 | SMALL MERCHANT | 商人2／旅人3 | 370 |
| 9 | 麻煩精 | TROUBLEMAKER ROGUE | 美食家2／遊蕩者1／神射手2 | 270 |
| 10 | 暮色女巫 | TWILIGHT WITCH | 熵師2／植物學家3 | 270 |
| 11 | 神秘精靈 | MYSTERIOUS ELF | 嵌合師1／博學士2／神射手2 | 170 |
| 12 | 喧鬧礦工 | ROWDY MINER | 狂怒鬥士1／商人1／旅人3 | 120 |
| 13 | 開朗侍從 | UPBEAT SQUIRE | 吟唱者2／武器大師3 | 120 |
| 14 | 年少藥草師 | YOUNG HERBALIST | 元素師2／植物學家3 | 270 |
| 15 | 油炸藝術家 | DEEP-FRY ARTIST | 狂怒鬥士1／美食家2／守護者2 | 70 |
| 16 | 浸萃大師 | INFUSION MASTER | 美食家2／神射手2／修補匠1 | 170 |
| 17 | 醃漬師 | PICKLER | 熵師1／美食家2／商人2 | 70 |
| 18 | 街頭廚師 | STREET COOK | 美食家2／吟唱者2／旅人1 | 270 |

預組隊伍：**11–14＝「童年好友：漫漫長路在前」**（CHILDHOOD FRIENDS）、**15–18＝「廚房兵團：我又想到新食譜了！」**（THE KITCHEN BRIGADE）

### 6.3 科技奇幻（17）

| # | 中文名 | 英文原名 | 職業搭配 | 資金 |
|---|---|---|---|---|
| 1 | 嵌合獵人 | CHIMERIC HUNTER | 突變體3／神射手2 | 70 |
| 2 | 電馭吸血鬼 | CYBERVAMPIRE | 熵師1／突變體3／神射手1 | 70 |
| 3 | 魔導槍姬 | MAGICAL GUN GIRL | 元素師3／機師2 | 270 |
| 4 | 網路巫師 | NET WIZARD | 元素師1／靈能者3／博學士1 | 70 |
| 5 | 靈能復仇者 | PSYCHIC AVENGER | 暗黑之刃2／靈能者2／守護者1 | 70 |
| 6 | 道路騎士 | ROAD KNIGHT | 機師2／遊蕩者1／武器大師2 | 120 |
| 7 | 魂流靈刃 | SOULSTREAM PSYBLADE | 靈能者3／武器大師2 | 120 |
| 8 | 巡迴醫師 | ROVING PHYSICIAN | 靈能者1／修補匠1／旅人3 | 270 |
| 9 | 實驗體 | TEST SUBJECT | 嵌合師1／狂怒鬥士1／突變體3 | 370 |
| 10 | 流浪發明家 | WANDERING INVENTOR | 機師2／修補匠3 | 370 |
| 11 | 勇敢的秘修者 | COURAGEOUS MYSTIC | 靈能者1／吟唱者1／靈師3 ＋魔晶石（元素師1） | 70 |
| 12 | 兇猛打手 | FIERCE BRAWLER | 狂怒鬥士1／遊蕩者2／武器大師2 ＋魔晶石（靈能者1） | 70 |
| 13 | 魔警叛逃者 | MAGSEC DEFECTOR | 狂怒鬥士1／守護者1／武器大師3 ＋魔晶石（元素師1） | 70 |
| 14 | M001：尼莫 | M001: NEMO | 機師3／神射手1／武器大師1 | 70 |
| 15 | M002：五禪 | M002: GOZEN | 守護者1／機師2／武器大師2 | 70 |
| 16 | M003：霍爾科伊 | M003: KHORKOI | 元素師1／機師1／遊蕩者3 | 120 |
| 17 | M005：瓦普吉斯 | M005: WALPURGIS | 熵師2／機師2／靈師1 | 70 |

預組隊伍：**11–13＝「反抗細胞：勇敢的革命者」**（THE REBEL CELL）、**14–17＝「機師們：控制系統，啟動！」**（THE PILOTS）

### 6.4 特典合輯（8，皆帶金手指）

| # | 中文名 | 英文原名 | 職業搭配 | 金手指 | 資金 |
|---|---|---|---|---|---|
| 1 | 沼澤女巫 | BOG WITCH | 元素師2／旅人3 | 巫術後裔 | 270 |
| 2 | 千年吸血鬼 | CENTURIES-OLD VAMPIRE | 靈能者1／突變體2／靈師2 | 束縛你的約定 | 370 |
| 3 | 軟糯幫 | MELLOW GANG | 嵌合師1／舞者2／武器大師2 | 怪物幫派 | 120 |
| 4 | 模範不良 | MODEL PUNK | 狂怒鬥士1／吟唱者2／靈師2 | 地獄差生 | 70 |
| 5 | 木乃伊顧問 | MUMMY ADVISOR | 熵師2／吟唱者2／博學士1 | (不太)忠誠的僕人 | 270 |
| 6 | 馬勒博爾熱親王 | PRINCE OF MALEBOLGE | 元素師3／暗黑之刃1／狂怒鬥士1 | 被推翻的王 | 120 |
| 7 | 機獸原型機 | ROBOKAIJU PROTOTYPE | 修補匠1／守護者2／神射手2 | 超級頭目(據說是) | 70 |
| 8 | 殭屍女僕 | ZOMBIE MAID | 守護者2／修補匠2／旅人1 | 亡者歸來 | 70 |

---

## 7. 需要你裁定的唯一一項：風味文案深度

官方這 61 組**只給機械資料**（屬性／職業／技能／裝備／資金／金手指），
**沒有**身分、主題、出身、格言、羈絆——現有 Core 20 組的這些欄位是**本專案自己撰寫**的。

| 選項 | 內容 | 影響 |
|---|---|---|
| **A（推薦）** | **完整風味**：61 組都補上副標題、格言、身分、主題、出身、3 條羈絆，規格與 Core 20 完全一致 | 介面最一致，套用即可開跑；文案量最大（約 61 × 8 條） |
| **B** | **官方資料優先**：只寫副標題與格言（卡片需要辨識資訊），身分／主題／出身／羈絆留空由玩家自填 | 最忠於官方、最快；但套用後角色卡有 5 個欄位是空的 |
| **C** | **A 減羈絆**：副標題、格言、身分、主題、出身都寫，羈絆留空 | 折衷；羈絆是最個人化的欄位 |

> 我建議 **A**。理由：Core 20 已有完整風味，若新 61 組缺欄位，同一個 Modal 內會出現兩種規格，
> 使用者在混用時會覺得「後面的比較殘」。

---

## 8. 驗證標準

| 指標 | 目標 |
|---|---|
| `npm run test:emoji` | 0 命中（`src/` 與 `shared/`） |
| `npm run build` | exit 0 |
| `npm test` | 既有 9 組全綠（本改動不動引擎／資料層，理論上不受影響） |
| 資料自檢 | 61 組的 `className` 必須全部存在於 `rulesData.classes`；技能名必須存在於該職業的 `skills`；裝備名必須存在於 `equipment` 三表 |
| 手動 | 五個手冊篩選各自可切換；套用擴充配置後 `enabledSourcebooks` 含對應手冊 |

---

## 9. 明確不在本次範圍

- **自訂武器的完整子系統**（HF p.112–114 的創建規則、可選自訂化、稀有進化）：本次只做 `customWeapon` 註記文字。
- **魔晶石（Mnemosphere）子系統**：科技奇幻預組提到的魔晶石以文字註記在技能描述中，不新增 UI。
- **預組隊伍的「整隊套用」**：本次只做分組顯示，不做一次套用 4 名角色。
- **技能子選項（咒語／舞步／混合變形等）的預選**：與 Core 20 同規格（只寫技能與 SL，子選項由玩家於技能面板選擇）。
  > 若你要「套用時連咒語都選好」，那是另一個層級的工作，請另行指示。
