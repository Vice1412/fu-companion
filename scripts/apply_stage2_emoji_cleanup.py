# -*- coding: utf-8 -*-
"""階段 2：裝飾性 Emoji 清除（依 emoji-cleanup-decisions.xlsx 裁決表）。

裁決來源：使用者 2026-10-04 於裁決表標注——
  80 列全數「採用建議」；唯一例外為分頁圖示（備註：「用 game-icons 來選適合的」）。

設計原則與階段 3 腳本相同：
1. 所有替換皆為精確字面值，替換前 assert 命中次數，不符即中止。
2. 匯入陳述以「剩餘使用點為 0」自動判定修剪。
3. 預設 dry-run；加 --apply 才寫檔。
"""
import re
import sys
import pathlib

APPLY = "--apply" in sys.argv

NW = "src/features/npc-workshop/NPCWorkshop.jsx"
NB = "src/features/npc-workshop/components/NPCBuilder.jsx"
CP = "src/features/npc-workshop/components/NPCCardPreview.jsx"
CL = "src/features/npc-workshop/components/NPCLibrary.jsx"
FC = "src/features/clocks/FateClockPage.jsx"
CO = "src/features/npc-workshop/data/constants.js"

# --------------------------------------------------------------------------
# (檔案, 舊字串, 新字串, 預期命中次數)
# --------------------------------------------------------------------------
EDITS = [
    # ================= A 組：Toast 訊息（28 筆）=================
    (NW, "🔒 已恢復嚴謹模式", "已恢復嚴謹模式", 1),
    (NW, "✨ 已解除規則限制", "已解除規則限制", 1),
    (NW, "⚔️ 已將【", "已將【", 1),
    (NW, "❌ 入戰失敗", "入戰失敗", 1),
    (NW, "⚠️ 請拖曳 .json", "請拖曳 .json", 1),
    (NW, "✅ 成功備份/匯入", "成功備份/匯入", 1),
    (NW, "✅ 成功讀取「${migrated", "成功讀取「${migrated", 1),
    (NW, "❌ JSON 格式解析失敗", "JSON 格式解析失敗", 1),
    (NW, "⚠️ 檔案庫目前為空", "檔案庫目前為空", 1),
    (NW, "✅ 已成功備份包含", "已成功備份包含", 1),
    (NW, "📍 已反向定位", "已反向定位", 1),
    (NW, "⚠️ 名稱與效果敘述", "名稱與效果敘述", 1),
    (NW, "✨ 成功新增自訂技能", "成功新增自訂技能", 1),
    (NW, "🔗 已切換至", "已切換至", 1),
    (NW, "❌ 請選擇正確的圖片檔案", "請選擇正確的圖片檔案", 1),
    (NW, "❌ 讀取檔案失敗", "讀取檔案失敗", 1),
    (NW, "⚠️ 請輸入有效的圖片網址", "請輸入有效的圖片網址", 1),
    (NW, "⏳ 正在讀取網路圖片", "正在讀取網路圖片", 1),
    (NW, "❌ 無法載入該網址的圖片", "無法載入該網址的圖片", 1),
    (NW, "🖼️ 頭像裁切與調整完成", "頭像裁切與調整完成", 1),
    (NW, "❌ 請拖曳圖片檔案", "請拖曳圖片檔案", 1),
    (NW, "🖼️ 正在處理並匯出高畫質", "正在處理並匯出高畫質", 1),
    (NW, "✅ 角色卡已成功匯出", "角色卡已成功匯出", 1),
    (NW, "❌ 匯出失敗", "匯出失敗", 1),
    (NW, "✅ 成功讀取「${loadedState", "成功讀取「${loadedState", 1),
    (NW, "❌ 無效的 JSON 檔案", "無效的 JSON 檔案", 1),
    (NW, "✨ 成功覺醒為冠位", "成功覺醒為冠位", 1),
    (FC, "'✨ 已新增命刻！'", "'已新增命刻！'", 1),

    # ================= B 組：純文字輸出路徑（8 筆）=================
    # 分類符號常數整行刪除，並同步其唯一消費端
    (NW, "  const icon = skill.category === 'attack' ? '⚔️' : skill.category === 'action' ? '⚡' : "
         "skill.category === 'boss' ? '👑' : skill.category === 'negative' ? '⛓️' : "
         "skill.category === 'spell' ? '🔮' : '📜';\n", "", 1),
    (NW, "`> ${icon} ${displaySkillName}\\n`", "`> ${displaySkillName}\\n`", 1),
    (NW, "`> ${showOffensiveIcon ? '⚡' : '🔮'} ${normalizeSpellName(displaySkillName)}",
         "`> ${normalizeSpellName(displaySkillName)}", 1),
    (NW, "`${TYPE_STYLES[val].emoji}${val}`", "`${val}`", 1),
    (NW, "`${TYPE_STYLES[p1].emoji}${p1}`", "p1", 1),
    (NW, "`**🔮 咒語**\\n`", "`**咒語**\\n`", 1),
    (NW, "`**⚔️ 基本攻擊與行動 (BASIC ATTACKS & ACTIONS)**\\n`", "`**基本攻擊與行動**\\n`", 1),
    (NW, "`#### ⛓️ 負面技能\\n`", "`#### 負面技能\\n`", 1),
    (NW, "`#### 🔮 咒語\\n`", "`#### 咒語\\n`", 1),
    (NW, "`> **${isOffensive ? '⚡' : '✨'} ${normalizeSpellName(effectiveName)}**",
         "`> **${normalizeSpellName(effectiveName)}**", 1),
    (NW, "`#### ⚔️ 基本攻擊與行動 (BASIC ATTACKS & ACTIONS)\\n`", "`#### 基本攻擊與行動\\n`", 1),

    # ================= C 組：資料層退路與消費端 =================
    (CO, "export const CATEGORIES = [{ id: 'attack', name: '基本攻擊', icon: '⚔️', fuIcon: 'm' }, "
         "{ id: 'spell', name: '咒語', icon: '🔮', fuIcon: 'c' }, "
         "{ id: 'action', name: '其餘行動', icon: '⚡', fuIcon: 's' }, "
         "{ id: 'rule', name: '特殊規則', icon: '📜' }, { id: 'boss', name: 'Boss', icon: '👑' }];",
         "export const CATEGORIES = [{ id: 'attack', name: '基本攻擊', fuIcon: 'm' }, "
         "{ id: 'spell', name: '咒語', fuIcon: 'c' }, "
         "{ id: 'action', name: '其餘行動', fuIcon: 's' }, "
         "{ id: 'rule', name: '特殊規則' }, { id: 'boss', name: 'Boss' }];", 1),
    # 消費端：三處 fallback 的 else 分支為死碼（十筆皆具 fuIcon），直接移除三元式
    (NW, "{TYPE_STYLES[val].fuIcon ? <span className=\"fu-icon text-sm leading-none translate-y-[0.5px]\">"
         "{TYPE_STYLES[val].fuIcon}</span> : TYPE_STYLES[val].emoji}",
         "<span className=\"fu-icon text-sm leading-none translate-y-[0.5px]\">{TYPE_STYLES[val].fuIcon}</span>", 1),
    (NW, "{TYPE_STYLES[type].fuIcon ? <span className=\"fu-icon text-sm leading-none translate-y-[0.5px]\">"
         "{TYPE_STYLES[type].fuIcon}</span> : TYPE_STYLES[type].emoji}",
         "<span className=\"fu-icon text-sm leading-none translate-y-[0.5px]\">{TYPE_STYLES[type].fuIcon}</span>", 1),
    (NW, "{typeStyle.fuIcon ? <span className=\"fu-icon\">{typeStyle.fuIcon}</span> : typeStyle.emoji}",
         "<span className=\"fu-icon\">{typeStyle.fuIcon}</span>", 1),
    (NW, "{styleInfo.fuIcon ? (\n"
         "                                      <span className=\"fu-icon text-base leading-none translate-y-[0.5px]\">{styleInfo.fuIcon}</span>\n"
         "                                    ) : (\n"
         "                                      <span>{styleInfo.emoji || ''}</span>\n"
         "                                    )}",
         "<span className=\"fu-icon text-base leading-none translate-y-[0.5px]\">{styleInfo.fuIcon}</span>", 1),

    # ================= D 組：敘事／狀態標記（Unicode 詞彙表）=================
    (NW, "⚠️ 額度溢出警告", "△ 額度溢出警告", 1),
    (NW, "{isMaxMp ? '🔵' : ", "{isMaxMp ? '●' : ", 1),
    (NW, "`🔥 ${VILLAIN_TIERS", "`★ ${VILLAIN_TIERS", 1),
    (NW, "🛡️ 異常免疫：", "◆ 異常免疫：", 1),
    (NW, "📜 種族特質 / 背景說明", "✦ 種族特質 / 背景說明", 1),
    (NW, "<span className=\"text-lg\">📜</span> 特殊規則", "<span className=\"text-lg\">✦</span> 特殊規則", 1),
    (NW, "⚠️ 額外代償選項", "△ 額外代償選項", 1),
    (NW, "🔓 自定義模式已啟動", "自定義模式已啟動", 1),
    (NW, "title=\"✨ 完全自訂技能\"", "title=\"完全自訂技能\"", 1),
    (NW, "💡 規則提醒：", "※ 規則提醒：", 1),
    (NW, "🛡️ 定位技能 {", "❖ 定位技能 {", 1),
    (NW, "🔮 咒語容量 {", "✦ 咒語容量 {", 1),
    (NW, "⚡ 弱 {currentAffinities.vul} | 抗 {currentAffinities.res} | 免 {currentAffinities.imm}",
         "▽ 弱 {currentAffinities.vul} | ▼ 抗 {currentAffinities.res} | ◆ 免 {currentAffinities.imm}", 1),
    # 浮水印（純裝飾）整塊刪除
    (NW, "        <div className=\"absolute top-0 right-0 p-6 opacity-[0.06] text-9xl pointer-events-none "
         "select-none text-fuchsia-900\">\n          🔓\n        </div>\n", "", 1),
    (NW, "              <div className=\"absolute top-0 right-0 p-4 opacity-[0.05] text-8xl pointer-events-none "
         "group-hover:scale-110 transition-transform\">🔥</div>\n", "", 1),
    (NW, "                <div className=\"absolute top-0 right-0 p-4 opacity-[0.05] text-7xl pointer-events-none "
         "group-hover:scale-110 transition-transform text-purple-900\">🔮</div>\n", "", 1),
    # 分頁圖示：依使用者裁定改用 Game-Icons
    (NW, "{ id: 'stats', label: '基礎數值與相性', emoji: '🎲' },",
         "{ id: 'stats', label: '基礎數值與相性', Icon: GiRollingDices },", 1),
    (NW, "{ id: 'skills', label: '攻擊與技能庫', emoji: '⚔️' },",
         "{ id: 'skills', label: '攻擊與技能庫', Icon: GiCrossedSwords },", 1),
    (NW, "{ id: 'spells', label: '咒語與自訂能力', emoji: '🔮' },",
         "{ id: 'spells', label: '咒語與自訂能力', Icon: GiSpellBook },", 1),
    (NW, "<span>{tab.emoji}</span>", "<tab.Icon className=\"w-4 h-4\" />", 1),
    # NPCBuilder
    (NB, "<span>👑 Boss技能:</span>", "<span>★ Boss技能:</span>", 1),
    (NB, "• 💡 條款特別提示：", "• ※ 條款特別提示：", 1),
    (NB, "<span>👑 {subCat}</span>", "<span>★ {subCat}</span>", 1),
    # NPCCardPreview
    (CP, "🏷️ {npc.faction}", "◈ {npc.faction}", 1),
    (CP, "👑 {npc.villainTier ===", "★ {npc.villainTier ===", 1),
    (CP, "            ✏️\n", "            ✎\n", 1),
    (CP, "icon = '🛡️';", "icon = '❖';", 1),
    (CP, "icon = '👑';", "icon = '★';", 1),
    (CP, "icon = '💀';", "icon = '✕';", 1),
    # NPCLibrary
    (CL, "🏷️ {fac} ({count})", "◈ {fac} ({count})", 1),
    (CL, ">🏷️ {npc.faction}</span>", ">◈ {npc.faction}</span>", 1),
    (CL, "✏️ 編輯", "✎ 編輯", 1),
    # FateClockPage
    (FC, "<span className=\"text-amber-700\">⏳</span>", "<span className=\"text-amber-700\">◷</span>", 1),
]

# --------------------------------------------------------------------------
# TYPE_STYLES / ROLE_DESCRIPTIONS 的 emoji 欄位：逐筆移除
# --------------------------------------------------------------------------
TYPE_EMOJI = ["⚔️", "🌪️", "⚡", "🌑", "🏔️", "🔥", "❄️", "☀️", "☠️", "💥"]
for e in TYPE_EMOJI:
    EDITS.append((CO, "{{ emoji: '{}', ".format(e), "{ ", 1))

ROLE_EMOJI = {
    "GiBrute": "🩸", "GiCrossbow": "🏹", "GiWizardStaff": "🔮",
    "GiTimeBomb": "💣", "GiShieldReflect": "🛡️", "GiHealing": "🌿",
}
for icon_name, e in ROLE_EMOJI.items():
    EDITS.append((CO, '{}, icon: "{}"'.format(icon_name, e), icon_name, 1))

# ROLE_DESCRIPTIONS.icon 的三個消費端：fallback 為死碼，直接移除三元式
EDITS += [
    (NW, ") : (\n                              <span className=\"text-[10rem] leading-none transform "
         "translate-x-12 -translate-y-12 block\">{ROLE_DESCRIPTIONS[roleName]?.icon}</span>\n                            );",
         ");", 1),
    (NW, ") : (\n                                <span className=\"text-6xl\">{ROLE_DESCRIPTIONS[roleName]?.icon}</span>\n"
         "                              );", ");", 1),
    (NW, ") : (\n                        <span className=\"text-xl sm:text-3xl\">{ROLE_DESCRIPTIONS[r]?.icon}</span>\n"
         "                      )}", ")}", 1),
]

# --------------------------------------------------------------------------
# 要自 lucide 匯入移除的名稱（僅在剩餘使用點為 0 時才真的移除）
# --------------------------------------------------------------------------
LUCIDE_DROP = {
    NW: ["Sword", "Swords", "Crown", "Star", "Sparkles", "BookOpen", "ShieldAlert", "Trash2", "Edit3"],
    NB: [],
    CP: [],
    CL: [],
    FC: [],
}

LUCIDE_RE = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'lucide-react';?", re.S)
GI_RE = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'react-icons/gi';?", re.S)


def split_names(block):
    out = []
    for n in block.split(","):
        n = n.strip()
        if not n:
            continue
        parts = [p.strip() for p in n.split(" as ")]
        out.append((parts[0], parts[-1]))
    return out


def fmt_import(pairs, module):
    body = ""
    for imp, loc in pairs:
        body += "\n  {},".format(imp if imp == loc else "{} as {}".format(imp, loc))
    return "import {{{}\n}} from '{}';".format(body, module)


def count_usage(src, local):
    return len(re.findall(r"<" + re.escape(local) + r"(?=[\s/>])", src))


def main():
    cache = {}
    errors = []

    for path, old, new, expect in EDITS:
        if path not in cache:
            cache[path] = pathlib.Path(path).read_text(encoding="utf-8")
        n = cache[path].count(old)
        if n != expect:
            errors.append("{}: 預期 {} 次，實得 {} 次 -> {}".format(path, expect, n, old[:80]))
    if errors:
        print("!! 字面值驗證失敗，未寫入任何檔案：")
        for e in errors:
            print("  ", e)
        sys.exit(1)

    for path, old, new, expect in EDITS:
        cache[path] = cache[path].replace(old, new)
    print("字面值替換：{} 筆全部命中".format(len(EDITS)))

    for path, drop in LUCIDE_DROP.items():
        if not drop:
            continue
        src = cache[path]
        m = LUCIDE_RE.search(src)
        if not m:
            print("  !! {} 找不到 lucide 匯入".format(path))
            sys.exit(1)
        kept, dropped, blocked = [], [], []
        for imp, loc in split_names(m.group(1)):
            if imp not in drop:
                kept.append((imp, loc))
                continue
            left = count_usage(src, loc)
            if left == 0:
                dropped.append(loc)
            else:
                kept.append((imp, loc))
                blocked.append("{} 仍有 {} 處使用".format(loc, left))
        src = src[: m.start()] + fmt_import(kept, "lucide-react") + src[m.end():]
        cache[path] = src
        print("  {}：lucide 移除 {} 個 -> {}".format(path, len(dropped), ", ".join(dropped) or "（無）"))
        for b in blocked:
            print("      ⚠ 保留：{}".format(b))

    # 自查：gi 使用到的名稱是否都已匯入
    for path, src in cache.items():
        gm = GI_RE.search(src)
        gnames = {loc for _, loc in split_names(gm.group(1))} if gm else set()
        used = set(re.findall(r"<(Gi[A-Za-z0-9_]+)(?=[\s/>])", src))
        missing = sorted(used - gnames)
        if missing:
            print("  !! {} 使用了未匯入的 gi 圖示：{}".format(path, ", ".join(missing)))
            sys.exit(1)

    if not APPLY:
        print("\n(dry-run，未寫入。加 --apply 以實際寫入)")
        return

    for path, src in cache.items():
        pathlib.Path(path).write_text(src, encoding="utf-8")
    print("\n已寫入 {} 個檔案".format(len(cache)))


main()
