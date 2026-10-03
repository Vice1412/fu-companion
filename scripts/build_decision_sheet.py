# -*- coding: utf-8 -*-
"""產生階段 2 Emoji 清除的裁決表（供使用者逐列標注方針後回讀）。

輸出：emoji-cleanup-decisions.xlsx
- Sheet「裁決表」：76 筆 Emoji 命中 + 9 筆連帶消費端，含「裁決」下拉與「你的備註」欄。
- Sheet「符號詞彙表」：建議的 dingbat 語意詞彙，供逐列裁定。
- Sheet「使用說明」：回讀流程。
"""
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

# (類型, 檔案:行, 情境, 現值, 建議, 預設裁決)
HIT = "Emoji 命中"
DEP = "連帶修改"
KEEP = "採用建議"

ROWS = [
    # ---------------- A 組：Toast（28 筆）----------------
    (HIT, "NPCWorkshop.jsx:1732", "Toast · 嚴謹模式", "'🔒 已恢復嚴謹模式：重新計算技能額度與規則限制。'", "刪除前綴 → '已恢復嚴謹模式：重新計算技能額度與規則限制。'", KEEP),
    (HIT, "NPCWorkshop.jsx:1740", "Toast · 自由模式", "'✨ 已解除規則限制：現在可以自由編輯體質骰子與技能額度！'", "刪除前綴 → '已解除規則限制：現在可以自由編輯體質骰子與技能額度！'", KEEP),
    (HIT, "NPCWorkshop.jsx:1752", "Toast · 推入戰鬥", "`⚔️ 已將【${npc.name}】推入戰鬥房間！`", "刪除前綴 → `已將【…】推入戰鬥房間！`", KEEP),
    (HIT, "NPCWorkshop.jsx:1755", "Toast · 入戰失敗", "'❌ 入戰失敗，請確認怪物數據完整。'", "刪除前綴 → '入戰失敗，請確認怪物數據完整。'", KEEP),
    (HIT, "NPCWorkshop.jsx:1947", "Toast · 拖曳提示", '"⚠️ 請拖曳 .json 格式的 NPC 檔案"', '刪除前綴 → "請拖曳 .json 格式的 NPC 檔案"', KEEP),
    (HIT, "NPCWorkshop.jsx:1966", "Toast · 匯入成功", "`✅ 成功備份/匯入 ${parsed.length} 個 NPC 至檔案庫！`", "刪除前綴 → `成功備份/匯入 N 個 NPC 至檔案庫！`", KEEP),
    (HIT, "NPCWorkshop.jsx:1972", "Toast · 讀取成功", "`✅ 成功讀取「${migrated.name}」的檔案！`", "刪除前綴 → `成功讀取「…」的檔案！`", KEEP),
    (HIT, "NPCWorkshop.jsx:1975", "Toast · JSON 解析失敗", '"❌ JSON 格式解析失敗，請確認檔案內容是否正確！"', '刪除前綴 → "JSON 格式解析失敗，請確認檔案內容是否正確！"', KEEP),
    (HIT, "NPCWorkshop.jsx:1995", "Toast · 檔案庫為空", '"⚠️ 檔案庫目前為空，無可備份的 NPC"', '刪除前綴 → "檔案庫目前為空，無可備份的 NPC"', KEEP),
    (HIT, "NPCWorkshop.jsx:2006", "Toast · 全庫備份", "`✅ 已成功備份包含 ${library.length} 個 NPC 的全庫檔案！`", "刪除前綴 → `已成功備份包含 N 個 NPC 的全庫檔案！`", KEEP),
    (HIT, "NPCWorkshop.jsx:2022", "Toast · 反向定位（語意標記）", '"📍 已反向定位至該技能配置卡片"', '刪除；若你要保留標記 → "➔ 已反向定位至該技能配置卡片"', KEEP),
    (HIT, "NPCWorkshop.jsx:2050", "Toast · 欄位驗證", "'⚠️ 名稱與效果敘述不可為空！'", "刪除前綴 → '名稱與效果敘述不可為空！'", KEEP),
    (HIT, "NPCWorkshop.jsx:2101", "Toast · 新增技能", "`✨ 成功新增自訂技能：「${finalName}」`", "刪除前綴 → `成功新增自訂技能：「…」`", KEEP),
    (HIT, "NPCWorkshop.jsx:2229", "Toast · 切換實體（語意標記）", "`🔗 已切換至「${targetNPC.name}」`", '刪除；若你要保留標記 → `➔ 已切換至「…」`', KEEP),
    (HIT, "NPCWorkshop.jsx:2906", "Toast · 圖片格式", '"❌ 請選擇正確的圖片檔案 (JPG, PNG, GIF, WebP)"', '刪除前綴 → "請選擇正確的圖片檔案 (JPG, PNG, GIF, WebP)"', KEEP),
    (HIT, "NPCWorkshop.jsx:2947", "Toast · 讀檔失敗", '"❌ 讀取檔案失敗"', '刪除前綴 → "讀取檔案失敗"', KEEP),
    (HIT, "NPCWorkshop.jsx:2962", "Toast · 網址無效", '"⚠️ 請輸入有效的圖片網址"', '刪除前綴 → "請輸入有效的圖片網址"', KEEP),
    (HIT, "NPCWorkshop.jsx:2966", "Toast · 讀取中（語意標記）", '"⏳ 正在讀取網路圖片..."', '刪除；若你要保留標記 → "※ 正在讀取網路圖片..."', KEEP),
    (HIT, "NPCWorkshop.jsx:3018", "Toast · 載圖失敗", '"❌ 無法載入該網址的圖片，請確認連結正確或下載後拖曳上傳"', '刪除前綴 → "無法載入該網址的圖片，請確認連結正確或下載後拖曳上傳"', KEEP),
    (HIT, "NPCWorkshop.jsx:3043", "Toast · 裁切完成", '"🖼️ 頭像裁切與調整完成！"', '刪除前綴 → "頭像裁切與調整完成！"', KEEP),
    (HIT, "NPCWorkshop.jsx:3081", "Toast · 拖曳圖片", '"❌ 請拖曳圖片檔案 (JPG, PNG, GIF, WebP)"', '刪除前綴 → "請拖曳圖片檔案 (JPG, PNG, GIF, WebP)"', KEEP),
    (HIT, "NPCWorkshop.jsx:3097", "Toast · 匯出中（語意標記）", '"🖼️ 正在處理並匯出高畫質 JPG，請稍候..."', '刪除；若你要保留標記 → "※ 正在處理並匯出高畫質 JPG，請稍候..."', KEEP),
    (HIT, "NPCWorkshop.jsx:3130", "Toast · 匯出成功", '"✅ 角色卡已成功匯出！"', '刪除前綴 → "角色卡已成功匯出！"', KEEP),
    (HIT, "NPCWorkshop.jsx:3133", "Toast · 匯出失敗", '"❌ 匯出失敗，請重試或更換瀏覽器。"', '刪除前綴 → "匯出失敗，請重試或更換瀏覽器。"', KEEP),
    (HIT, "NPCWorkshop.jsx:3199", "Toast · 讀檔成功", "`✅ 成功讀取「${loadedState.name}」的檔案！`", "刪除前綴 → `成功讀取「…」的檔案！`", KEEP),
    (HIT, "NPCWorkshop.jsx:3201", "Toast · 無效 JSON", '"❌ 無效的 JSON 檔案！請確認格式是否正確。"', '刪除前綴 → "無效的 JSON 檔案！請確認格式是否正確。"', KEEP),
    (HIT, "NPCWorkshop.jsx:5407", "Toast · 冠位覺醒", "`✨ 成功覺醒為冠位 (倍率 x${mult})！`", "刪除前綴 → `成功覺醒為冠位 (倍率 xN)！`", KEEP),
    (HIT, "FateClockPage.jsx:45", "Toast · 新增命刻", "showToast('✨ 已新增命刻！')", "刪除前綴 → showToast('已新增命刻！')", KEEP),

    # ---------------- B 組：純文字輸出路徑（10 筆）----------------
    (HIT, "NPCWorkshop.jsx:958", "純文字複製 · 分類符號", "const icon = … '⚔️' / '⚡' / '👑' / '⛓️' / '🔮' / '📜'", "整行刪除（純文字不帶符號）", KEEP),
    (HIT, "NPCWorkshop.jsx:968", "純文字複製 · 咒語前綴", "`> ${showOffensiveIcon ? '⚡' : '🔮'} ${…}`", "移除前綴 → `> ${normalizeSpellName(…)}`", KEEP),
    (HIT, "NPCWorkshop.jsx:3630", "Markdown 匯出標題", "`**🔮 咒語**`", "→ `**咒語**`", KEEP),
    (HIT, "NPCWorkshop.jsx:3652", "Markdown 匯出標題（含英文）", "`**⚔️ 基本攻擊與行動 (BASIC ATTACKS & ACTIONS)**`", "→ `**基本攻擊與行動**`（英文一併洗掉）", KEEP),
    (HIT, "NPCWorkshop.jsx:3921", "Markdown 匯出標題", "`#### ⛓️ 負面技能`", "→ `#### 負面技能`", KEEP),
    (HIT, "NPCWorkshop.jsx:3935", "Markdown 匯出標題", "`#### 🔮 咒語`", "→ `#### 咒語`", KEEP),
    (HIT, "NPCWorkshop.jsx:3960", "Markdown 匯出條目", "`> **${isOffensive ? '⚡' : '✨'} ${…}**`", "移除前綴 → `> **${normalizeSpellName(…)}**`", KEEP),
    (HIT, "NPCWorkshop.jsx:3976", "Markdown 匯出標題（含英文）", "`#### ⚔️ 基本攻擊與行動 (BASIC ATTACKS & ACTIONS)`", "→ `#### 基本攻擊與行動`（英文一併洗掉）", KEEP),
    (DEP, "NPCWorkshop.jsx:176", "純文字 · 屬性詞綴（消費端）", "`${TYPE_STYLES[val].emoji}${val}`", "→ `${val}`", KEEP),
    (DEP, "NPCWorkshop.jsx:213", "純文字 · 屬性詞綴（消費端）", "`${TYPE_STYLES[p1].emoji}${p1}`", "→ `${p1}`", KEEP),

    # ---------------- C 組：資料層退路與消費端（5 筆）----------------
    (HIT, "constants.js:23", "資料層 · TYPE_STYLES.emoji", "十筆 emoji 欄位（⚔️🌪️⚡🌑🏔️🔥❄️☀️☠️💥）", "整欄刪除（十筆皆已有 fuIcon）", KEEP),
    (HIT, "constants.js:22", "資料層 · CATEGORIES.icon", "五筆 icon 欄位（⚔️🔮⚡📜👑）", "整欄刪除（attack/spell/action 已有 fuIcon；rule/boss 見 D 組）", KEEP),
    (DEP, "NPCWorkshop.jsx:285", "UI fallback（消費端）", "`fuIcon ? <span className=\"fu-icon\">{fuIcon}</span> : TYPE_STYLES[val].emoji`", "只留 fuIcon 分支", KEEP),
    (DEP, "NPCWorkshop.jsx:291", "UI fallback（消費端）", "同上（`type`）", "只留 fuIcon 分支", KEEP),
    (DEP, "NPCWorkshop.jsx:4930", "UI fallback（消費端）", "`typeStyle.fuIcon ? … : typeStyle.emoji`", "只留 fuIcon 分支", KEEP),

    # ---------------- D 組：敘事／狀態標記（31 筆）----------------
    (HIT, "NPCWorkshop.jsx:326", "UI · 額度溢出警告標題", "`⚠️ 額度溢出警告`", "→ `△ 額度溢出警告`（同區塊已有 AlertCircle）", KEEP),
    (HIT, "NPCWorkshop.jsx:591", "UI · MP 滿值指示", "`{isMaxMp ? '🔵' : <span className=\"fu-icon\">c</span>}`", "→ `●`（藍色）；或一律顯示官方字型 `c`", KEEP),
    (HIT, "NPCWorkshop.jsx:1311", "浮水印 · 6% 透明度", "`🔓`", "刪除（純裝飾；同區塊已有 lucide Unlock）", KEEP),
    (HIT, "NPCWorkshop.jsx:3258", "UI · 反派階級前綴", "`🔥 ${VILLAIN_TIERS[…].label}`", "→ `★ ${…label}`", KEEP),
    (HIT, "NPCWorkshop.jsx:3410", "UI · 異常免疫標題", "`🛡️ 異常免疫：`", "→ `◆ 異常免疫：`", KEEP),
    (HIT, "NPCWorkshop.jsx:3451", "UI · 種族特質標題", "`📜 種族特質 / 背景說明`", "→ `✦ 種族特質 / 背景說明`", KEEP),
    (HIT, "NPCWorkshop.jsx:3574", "UI · 特殊規則標題", "`📜 特殊規則`", "→ `✦ 特殊規則`", KEEP),
    (HIT, "NPCWorkshop.jsx:4511", "UI · 代償選項標題", "`⚠️ 額外代償選項`", "→ `△ 額外代償選項`", KEEP),
    (HIT, "NPCWorkshop.jsx:4711", "分頁定義 · 基礎數值", "`{ id: 'stats', …, emoji: '🎲' }`", "→ dingbat 或官方字型（**符號待你指定**）", KEEP),
    (HIT, "NPCWorkshop.jsx:4712", "分頁定義 · 攻擊與技能庫", "`{ id: 'skills', …, emoji: '⚔️' }`", "→ dingbat 或官方字型（**符號待你指定**）", KEEP),
    (HIT, "NPCWorkshop.jsx:4713", "分頁定義 · 咒語與自訂能力", "`{ id: 'spells', …, emoji: '🔮' }`", "→ 官方字型 `c`（咒語）為首選", KEEP),
    (DEP, "NPCWorkshop.jsx:4725", "分頁渲染（消費端）", "`<span>{tab.emoji}</span>`", "依 4711–4713 裁定同步調整", KEEP),
    (HIT, "NPCWorkshop.jsx:4746", "UI · 自由模式說明", "`🔓 自定義模式已啟動：可自由調整 DEX, INS, MIG, WLP …`", "刪除前綴 → `自定義模式已啟動：…`", KEEP),
    (HIT, "NPCWorkshop.jsx:4850", "浮水印 · 5% 透明度", "`🔥`", "刪除（純裝飾）", KEEP),
    (HIT, "NPCWorkshop.jsx:4943", "浮水印 · 5% 透明度", "`🔮`", "刪除（純裝飾）", KEEP),
    (HIT, "NPCWorkshop.jsx:5153", "UI · 區塊標題", 'title="✨ 完全自訂技能"', '→ title="完全自訂技能"（已傳 lucide Sparkles）', KEEP),
    (HIT, "NPCWorkshop.jsx:5319", "UI · 規則提醒", "`💡 規則提醒：您可以透過替換…`", "→ `※ 規則提醒：…`", KEEP),
    (HIT, "NPCWorkshop.jsx:6061", "UI · 定位技能額度", "`🛡️ 定位技能 {used}/{max}`", "→ `❖ 定位技能 {used}/{max}`", KEEP),
    (HIT, "NPCWorkshop.jsx:6080", "UI · 咒語容量", "`🔮 咒語容量 {used}/{max}`", "→ `✦ 咒語容量 {used}/{max}`（或官方字型 `c`）", KEEP),
    (HIT, "NPCWorkshop.jsx:6090", "UI · 相性摘要", "`⚡ 弱 {vul} | 抗 {res} | 免 {imm}`", "→ `▽ 弱 … | ▼ 抗 … | ◆ 免 …`", KEEP),
    (HIT, "NPCBuilder.jsx:441", "UI · Boss 技能標籤", "`👑 Boss技能:`", "→ `★ Boss技能:`", KEEP),
    (HIT, "NPCBuilder.jsx:818", "UI · 條款提示", "`• 💡 條款特別提示：…`", "→ `• ※ 條款特別提示：…`", KEEP),
    (HIT, "NPCBuilder.jsx:1076", "UI · 子分類標籤", "`👑 {subCat}`", "→ `★ {subCat}`", KEEP),
    (HIT, "NPCCardPreview.jsx:94", "UI · 陣營標籤", "`🏷️ {npc.faction}`", "→ `◈ {npc.faction}`", KEEP),
    (HIT, "NPCCardPreview.jsx:104", "UI · 反派階級", "`👑 次要／主要／最終反派`", "→ `★ …`", KEEP),
    (HIT, "NPCCardPreview.jsx:336", "徽章圖示 · 定位技能", "`icon = '🛡️'`", "→ `icon = '❖'`", KEEP),
    (HIT, "NPCCardPreview.jsx:340", "徽章圖示 · Boss 技能", "`icon = '👑'`", "→ `icon = '★'`", KEEP),
    (HIT, "NPCCardPreview.jsx:344", "徽章圖示 · 負面技能", "`icon = '💀'`", "→ `icon = '✕'`", KEEP),
    (HIT, "NPCLibrary.jsx:121", "UI · 陣營篩選", "`🏷️ {fac} ({count})`", "→ `◈ {fac} ({count})`", KEEP),
    (HIT, "NPCLibrary.jsx:206", "UI · 陣營標籤", "`🏷️ {npc.faction}`", "→ `◈ {npc.faction}`", KEEP),
    (HIT, "constants.js:36-41", "資料層 · ROLE_DESCRIPTIONS.icon", "六筆 emoji（🩸🏹🔮💣🛡️🌿）", "整欄刪除（`Icon: GiXxx` 已存在）", KEEP),
    (DEP, "NPCWorkshop.jsx:4162", "角色水印渲染（消費端）", "`{ROLE_DESCRIPTIONS[roleName]?.icon}`", "改用既有 `Icon`（比照 `:4158` 寫法）", KEEP),
    (DEP, "NPCWorkshop.jsx:4174", "角色卡面圖示（消費端）", "`{ROLE_DESCRIPTIONS[roleName]?.icon}`", "同上", KEEP),
    (DEP, "NPCWorkshop.jsx:4229", "快速選單圖示（消費端）", "`{ROLE_DESCRIPTIONS[r]?.icon}`", "同上（`QuickIcon`）", KEEP),
    (HIT, "FateClockPage.jsx:63", "UI · 頁面標題", "`<span>⏳</span> 命刻編織者`", "→ `<span>◷</span> 命刻編織者`（圓形刻度，與命刻盤同構）", KEEP),

    # ---------------- E 組：功能性控件（2 筆）----------------
    (HIT, "NPCCardPreview.jsx:121", "編輯鈕（功能性控件）", "`✏️`", "→ `✎`（純 dingbat）或 lucide `Pencil`", KEEP),
    (HIT, "NPCLibrary.jsx:274", "編輯鈕（功能性控件）", "`✏️ 編輯`", "→ `✎ 編輯`，或直接純文字「編輯」", KEEP),
]

VOCAB = [
    ("★", "Boss／冠位／反派階級", "👑 🔥", "★ Boss技能 / ★ 最終反派", KEEP),
    ("❖", "定位技能（職業定位賦予）", "🛡️（定位技能語境）", "❖ 定位技能 3/5", KEEP),
    ("✦", "特殊規則／種族特質／咒語容量", "📜 🔮（規則性語境）", "✦ 特殊規則", KEEP),
    ("✕", "負面技能／負面效果", "⛓️ 💀", "✕ 負面技能", KEEP),
    ("※", "提示／備註（非警告）", "💡 📍 🔗 ⏳", "※ 規則提醒：…", KEEP),
    ("△", "警告／注意", "⚠️", "△ 額度溢出警告", KEEP),
    ("◈", "陣營／勢力標籤", "🏷️", "◈ 王國軍", KEEP),
    ("▽", "弱點（Vulnerability）", "⚡（相性摘要語境）", "▽ 弱 2", KEEP),
    ("▼", "抗性（Resistance）", "—", "▼ 抗 3", KEEP),
    ("◆", "免疫（Immunity）／異常免疫", "🛡️（免疫語境）", "◆ 免 1 / ◆ 異常免疫：", KEEP),
    ("●", "資源滿值指示", "🔵", "● 藍色圓點", KEEP),
    ("◷", "命刻／時鐘", "⏳", "◷ 命刻編織者", KEEP),
    ("✎", "編輯（功能性控件）", "✏️", "✎ 編輯", KEEP),
    ("（待指定）", "分頁圖示：基礎數值 / 攻擊與技能庫", "🎲 ⚔️", "請填入你要的符號，或寫「用官方字型」", "待議"),
]

HEADERS = ["類型", "檔案:行", "情境", "現值", "建議（v2）", "裁決", "你的備註"]
VHEADERS = ["符號", "語意", "取代對象", "範例", "裁決", "你的備註"]

CHOICES = '"採用建議,保留現狀,改用（見備註）,刪除,待議"'

wb = Workbook()
thin = Side(style="thin", color="D6C7AB")
border = Border(left=thin, right=thin, top=thin, bottom=thin)
head_fill = PatternFill("solid", fgColor="F4EBD9")
hit_fill = PatternFill("solid", fgColor="FFFDF9")
dep_fill = PatternFill("solid", fgColor="F0F9FF")

# ---------------- Sheet 1 ----------------
ws = wb.active
ws.title = "裁決表"
ws.append(HEADERS)
for c in ws[1]:
    c.font = Font(bold=True)
    c.fill = head_fill
    c.border = border
    c.alignment = Alignment(vertical="center", horizontal="center")

for r in ROWS:
    ws.append(list(r))

for row in ws.iter_rows(min_row=2, max_row=ws.max_row, max_col=len(HEADERS)):
    fill = dep_fill if row[0].value == DEP else hit_fill
    for c in row:
        c.border = border
        c.fill = fill
        c.alignment = Alignment(vertical="top", wrap_text=True)
    row[5].alignment = Alignment(vertical="center", horizontal="center")

dv = DataValidation(type="list", formula1=CHOICES, allow_blank=False, showDropDown=False)
dv.error = "請從下拉選單中選擇"
dv.errorTitle = "無效的裁決值"
ws.add_data_validation(dv)
dv.add(f"F2:F{ws.max_row}")

for col, w in zip("ABCDEFG", [12, 26, 26, 46, 46, 14, 34]):
    ws.column_dimensions[col].width = w
ws.freeze_panes = "A2"
ws.auto_filter.ref = f"A1:G{ws.max_row}"

# ---------------- Sheet 2 ----------------
ws2 = wb.create_sheet("符號詞彙表")
ws2.append(VHEADERS)
for c in ws2[1]:
    c.font = Font(bold=True)
    c.fill = head_fill
    c.border = border
    c.alignment = Alignment(vertical="center", horizontal="center")
for r in VOCAB:
    ws2.append(list(r))
for row in ws2.iter_rows(min_row=2, max_row=ws2.max_row, max_col=len(VHEADERS)):
    for c in row:
        c.border = border
        c.alignment = Alignment(vertical="top", wrap_text=True)
    row[0].font = Font(bold=True, size=14)
    row[0].alignment = Alignment(vertical="center", horizontal="center")
    row[4].alignment = Alignment(vertical="center", horizontal="center")

dv2 = DataValidation(type="list", formula1=CHOICES, allow_blank=False, showDropDown=False)
ws2.add_data_validation(dv2)
dv2.add(f"E2:E{ws2.max_row}")
for col, w in zip("ABCDEF", [10, 34, 24, 40, 14, 34]):
    ws2.column_dimensions[col].width = w
ws2.freeze_panes = "A2"

# ---------------- Sheet 3 ----------------
ws3 = wb.create_sheet("使用說明")
GUIDE = [
    ["階段 2 Emoji 清除 — 裁決表使用說明"],
    [""],
    ["為什麼用試算表", "Antigravity 的 Artifact 有 GUI 回饋通道；DSH 沒有，但我們共用同一個檔案系統。"],
    ["", "所以替代方案就是：把裁決表做成一個你能自由編輯的檔案，你標完我回讀並照做。"],
    [""],
    ["怎麼用", "1. 在 Excel／LibreOffice 開啟本檔，於「裁決」欄用下拉選單逐列標注。"],
    ["", "2. 想改我方針的列，選「改用（見備註）」並在「你的備註」欄寫明你要什麼。"],
    ["", "3. 整組要推翻時，不必逐列改——在備註寫「整組改成 X」我也會照辦。"],
    ["", "4. 存檔後回覆我「好了」即可，我會重新讀取本檔並只套用差異。"],
    [""],
    ["欄位說明", "類型：Emoji 命中 = 目前違規行；連帶修改 = 因刪除資料欄位而必須同步改的消費端。"],
    ["", "現值：實際源碼內容（變數以 … 省略）。"],
    ["", "建議（v2）：本輪依你的裁定改寫過的建議，已全面改用 Unicode 排版字符。"],
    ["", "裁決：預設「採用建議」。你只需改不同意的列。"],
    [""],
    ["已確認的方針", "A：能用 Unicode（dingbat）表達語意者，一律用 dingbat，不叫 react-icons/gi 出場。"],
    ["", "B：沒有語意貢獻的裝飾一律刪除；匯出標題的英文 (BASIC ATTACKS & ACTIONS) 一併洗掉。"],
    ["", "1/2/3：6090 相性摘要改 ▽▼◆；2022 定位標記去符號；退路欄位整欄刪除（非留 null）。"],
    [""],
    ["注意", "「符號詞彙表」的分頁圖示一列仍是待指定——那三個是任意性選擇，我不替你決定。"],
    ["", "本檔本身不在 src/ 內，不影響 Emoji 掃描結果。"],
]
for r in GUIDE:
    ws3.append(r)
ws3["A1"].font = Font(bold=True, size=13)
ws3.column_dimensions["A"].width = 20
ws3.column_dimensions["B"].width = 96
for row in ws3.iter_rows(min_row=2, max_row=ws3.max_row, max_col=2):
    for c in row:
        c.alignment = Alignment(vertical="top", wrap_text=True)
    row[0].font = Font(bold=True)

out = "emoji-cleanup-decisions.xlsx"
wb.save(out)
print("saved", out)
print("裁決表列數 =", ws.max_row - 1)
print("符號詞彙表列數 =", ws2.max_row - 1)
