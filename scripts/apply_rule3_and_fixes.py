# -*- coding: utf-8 -*-
"""規則三清理 + 魔加農 IP 修正 + ErrorBoundary 破壞性操作補確認。

精確字面值替換，替換前 assert 命中次數，不符即中止。
"""
import sys
import pathlib

APPLY = "--apply" in sys.argv

CE = "src/features/character-sheet/components/CharacterEditor.jsx"
NW = "src/features/npc-workshop/NPCWorkshop.jsx"
NB = "src/features/npc-workshop/components/NPCBuilder.jsx"
CT = "src/features/combat-tracker/CombatTracker.jsx"
TW = "src/features/character-sheet/components/companions/TinkererWorkshop.jsx"
WC = "src/features/character-sheet/components/companions/WayfarerCompanionModal.jsx"
CM = "src/features/character-sheet/components/companions/ChimeristManager.jsx"
BH = "src/components/book/BookCoverHub.jsx"
EB = "src/components/ui/ErrorBoundary.jsx"
RC = "src/features/character-sheet/data/ruleCodexData.js"

EDITS = [
    # ============ 1. 魔加農：3 IP → 2 IP（原書 Core p.?? MAGICANNON (Advanced) 實測）============
    (RC, "name: '高級【魔加農】',\n        cost: '3 IP',",
         "name: '高級【魔加農】',\n        cost: '2 IP',", 1),
    (RC, "desc: '你可以執行使用庫存動作並花費 3 點庫存點數（3 IP）",
         "desc: '你可以執行使用庫存動作並花費 2 點庫存點數（2 IP）", 1),

    # ============ 2. 刪除 UI 英文標籤 ============
    # 角色卡編輯器六步驟
    (CE, "    { id: 1, label: '基礎身世', en: 'IDENTITY', icon: 'edit' },\n"
         "    { id: 2, label: '四維屬性', en: 'ATTRIBUTES', icon: 'dice' },\n"
         "    { id: 3, label: '職業與技能', en: 'CLASSES', icon: 'swords' },\n"
         "    { id: 4, label: '裝備配置', en: 'EQUIPMENT', icon: 'shield' },\n"
         "    { id: 5, label: '情感羈絆', en: 'BONDS', icon: 'hp' },\n"
         "    { id: 6, label: '特質與命刻', en: 'HEROIC & CLOCKS', icon: 'clock' }\n",
         "    { id: 1, label: '基礎身世', icon: 'edit' },\n"
         "    { id: 2, label: '四維屬性', icon: 'dice' },\n"
         "    { id: 3, label: '職業與技能', icon: 'swords' },\n"
         "    { id: 4, label: '裝備配置', icon: 'shield' },\n"
         "    { id: 5, label: '情感羈絆', icon: 'hp' },\n"
         "    { id: 6, label: '特質與命刻', icon: 'clock' }\n", 1),
    (CE, "{t.en}", "{t.label}", 1),

    # NPC 工坊：複製文本與註解中的英文
    (NW, "text += `[ 基本攻擊與行動 (BASIC ATTACKS & ACTIONS) ]\\n`;",
         "text += `[ 基本攻擊與行動 ]\\n`;", 1),
    (NW, "cmdLines.push(`// ===== 基本攻擊 (BASIC ATTACKS) =====`);",
         "cmdLines.push(`// ===== 基本攻擊 =====`);", 1),
    (NW, "cmdLines.push(`// ===== 咒語 (SPELLS) =====`);",
         "cmdLines.push(`// ===== 咒語 =====`);", 1),
    # 物種 fallback 標籤（死碼路徑，順手改為中文）
    (NW, "label: 'UNKNOWN' }", "label: '未知' }", 2),

    # NPC 建構器：兩個面向使用者的步驟標題
    (NB, "<span className=\"text-amber-800\">2.</span> 等級、階級與反派地位 (Level & Rank)",
         "<span className=\"text-amber-800\">2.</span> 等級、階級與反派地位", 1),
    (NB, "<span className=\"text-amber-800\">6.</span> Boss 絕技與負面技能 (Boss & Negative Skills)",
         "<span className=\"text-amber-800\">6.</span> Boss 絕技與負面技能", 1),

    # 戰鬥輪次：敵方欄標題
    (CT, "敵方怪物與 Boss (Enemies & Bosses)", "敵方怪物與 Boss", 1),

    # 修補匠造物專案：三個公式標籤
    (TW, "1. 基礎效力 (Base Potency)：", "1. 基礎效力：", 1),
    (TW, "2. 範圍倍率 (Area Multiplier)：", "2. 範圍倍率：", 1),
    (TW, "3. 使用次數倍率 (Uses Multiplier)：", "3. 使用次數倍率：", 1),

    # 旅人夥伴
    (WC, "1. 夥伴物種（Species）", "1. 夥伴物種", 1),

    # 嵌合師：改為「中文 · ENGLISH」（物種專有名詞，依 2026-10-04 裁定保留英文）
    (CM, "<option value=\"野獸\">野獸 (Beast)</option>", "<option value=\"野獸\">野獸 · BEAST</option>", 1),
    (CM, "<option value=\"魔獸\">魔獸 (Monster)</option>", "<option value=\"魔獸\">魔獸 · MONSTER</option>", 1),
    (CM, "<option value=\"植物\">植物 (Plant)</option>", "<option value=\"植物\">植物 · PLANT</option>", 1),

    # 封面：狀態標籤
    (BH, "<span>{chap.status === 'complete' ? 'CLICK TO OPEN' : 'WIP · 點擊確認'}</span>",
         "<span>{chap.status === 'complete' ? '點擊翻開' : '開發中 · 點擊確認'}</span>", 1),

    # ============ 3. ErrorBoundary：破壞性操作補上確認 ============
    (EB, "  handleResetCache = () => {\n    try {\n      localStorage.removeItem('fu_companion_active_combat');",
         "  handleResetCache = () => {\n"
         "    const ok = window.confirm(\n"
         "      '此操作會清除「目前進行中的戰鬥」（輪次、參戰者、場景時鐘），'\n"
         "      + '角色卡與 NPC 檔案庫不受影響。\\n\\n建議先確認已完成匯出備份。要繼續嗎？'\n"
         "    );\n"
         "    if (!ok) return;\n"
         "    try {\n      localStorage.removeItem('fu_companion_active_combat');", 1),
]


def main():
    cache = {}
    errors = []
    for path, old, new, expect in EDITS:
        if path not in cache:
            cache[path] = pathlib.Path(path).read_text(encoding="utf-8")
        n = cache[path].count(old)
        if n != expect:
            errors.append("{}: 預期 {} 次，實得 {} 次 -> {}".format(path, expect, n, old[:70].replace("\n", "\\n")))
    if errors:
        print("!! 字面值驗證失敗，未寫入：")
        for e in errors:
            print("  ", e)
        sys.exit(1)
    for path, old, new, expect in EDITS:
        cache[path] = cache[path].replace(old, new)
    print("替換：{} 筆全部命中".format(len(EDITS)))

    # 自查：不得殘留 t.en 這種已移除的欄位存取
    if "{t.en}" in cache[CE] or "en: '" in cache[CE]:
        print("!! CharacterEditor 仍有 en 欄位殘留")
        sys.exit(1)
    print("自查：CharacterEditor 無 en 殘留")

    if not APPLY:
        print("(dry-run，未寫入。加 --apply 以實際寫入)")
        return
    for path, src in cache.items():
        pathlib.Path(path).write_text(src, encoding="utf-8")
    print("已寫入 {} 個檔案".format(len(cache)))


main()
