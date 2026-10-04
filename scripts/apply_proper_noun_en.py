# -*- coding: utf-8 -*-
"""把專有名詞渲染點接上 withEn()，套用「中文 · ENGLISH」格式。

精確字面值替換 + 匯入自動插入；替換前 assert 命中次數，不符即中止。
"""
import re
import sys
import pathlib

APPLY = "--apply" in sys.argv

CS = "src/features/character-sheet/CharacterSheet.jsx"
CC = "src/features/character-sheet/components/CharacterCard.jsx"
CE = "src/features/character-sheet/components/CharacterEditor.jsx"
CP = "src/features/character-sheet/components/ClassPickerModal.jsx"
CH = "src/features/character-sheet/components/CharacterPlayHUD.jsx"
CK = "src/features/character-sheet/components/ClassSkillCard.jsx"
NL = "src/features/npc-workshop/components/NPCLibrary.jsx"
NV = "src/features/npc-workshop/components/NPCCardPreview.jsx"
NB = "src/features/npc-workshop/components/NPCBuilder.jsx"
AC = "src/features/combat-tracker/components/AddCombatantModal.jsx"
NW = "src/features/npc-workshop/NPCWorkshop.jsx"

EDITS = [
    # ── 職業 ────────────────────────────────────────────────
    (CS, "{c.className} Lv{c.level}", "{withEn(c.className)} Lv{c.level}", 1),
    (CC, "{cl.className} (Lv {cl.level})", "{withEn(cl.className)} (Lv {cl.level})", 1),
    (CE, "{c.className} Lv{c.level}", "{withEn(c.className)} Lv{c.level}", 1),
    (CE, "{c.className}:", "{withEn(c.className)}:", 1),
    (CP, "{activeClassItem.className}", "{withEn(activeClassItem.className)}", 2),
    (CH, ">{cl.className}</span>", ">{withEn(cl.className)}</span>", 1),
    (CH, "{cl.className} (目前 Lv {cl.level})", "{withEn(cl.className)} (目前 Lv {cl.level})", 1),
    (CK, "`移除職業【${className}】`", "`移除職業【${withEn(className)}】`", 1),

    # ── NPC 定位 ────────────────────────────────────────────
    (NL, '<span className="text-amber-800 font-bold">{npc.role}</span>',
         '<span className="text-amber-800 font-bold">{withEn(npc.role)}</span>', 1),
    (NV, '<strong className="text-amber-800 font-sans font-bold">{npc.role}</strong>',
         '<strong className="text-amber-800 font-sans font-bold">{withEn(npc.role)}</strong>', 1),
    (NB, "({npc.role} · Lv.{npc.level} {npc.rank})", "({withEn(npc.role)} · Lv.{npc.level} {npc.rank})", 1),
    (NB, "挑選【{npc.role}】定位的專屬技能與法術。", "挑選【{withEn(npc.role)}】定位的專屬技能與法術。", 1),
    (NB, "<span>【{npc.role}】定位技能庫</span>", "<span>【{withEn(npc.role)}】定位技能庫</span>", 1),
    (AC, "<span>{npc.role}</span>", "<span>{withEn(npc.role)}</span>", 1),
    (NW, 'tracking-[0.15em] mb-1">{roleName}</h2>', 'tracking-[0.15em] mb-1">{withEn(roleName)}</h2>', 1),
    (NW, "}>{r}</div>", ">{withEn(r)}</div>", 1),
    (NW, "Lv. {npc.level} | {npc.role}", "Lv. {npc.level} | {withEn(npc.role)}", 1),
    (NW, "<span>{npc.role}</span>", "<span>{withEn(npc.role)}</span>", 1),
]

IMPORT_PATH = {
    CS: "../../utils/properNouns",
    NW: "../../utils/properNouns",
}
for f in (CC, CE, CP, CH, CK, NL, NV, NB, AC):
    IMPORT_PATH[f] = "../../../utils/properNouns"


def main():
    cache = {}
    errors = []
    for path, old, new, expect in EDITS:
        if path not in cache:
            cache[path] = pathlib.Path(path).read_text(encoding="utf-8")
        n = cache[path].count(old)
        if n != expect:
            errors.append("{}: 預期 {} 次，實得 {} 次 -> {}".format(path, expect, n, old[:70]))
    if errors:
        print("!! 字面值驗證失敗，未寫入：")
        for e in errors:
            print("  ", e)
        sys.exit(1)

    for path, old, new, expect in EDITS:
        cache[path] = cache[path].replace(old, new)
    print("替換：{} 筆全部命中".format(len(EDITS)))

    # 插入匯入（置於最後一條 import 之後）
    for path, mod in IMPORT_PATH.items():
        src = cache[path]
        if "properNouns" in src:
            print("  {} 已有匯入，略過".format(path))
            continue
        lines = src.split("\n")
        last = max(i for i, ln in enumerate(lines) if ln.startswith("import "))
        lines.insert(last + 1, "import {{ withEn }} from '{}';".format(mod))
        cache[path] = "\n".join(lines)
        print("  {} 插入匯入（第 {} 行後）".format(path, last + 1))

    # 例外：ClassPickerModal 的 `{item.className}` 同時出現在 React key 與顯示處，
    # 只改「前面不是 key=」的那一處（負向後顧斷言）。
    rx = re.compile(r"(?<!key=)\{item\.className\}")
    hits = rx.findall(cache[CP])
    if len(hits) != 1:
        print("!! ClassPickerModal 的顯示處 {item.className} 預期 1 次，實得 {}".format(len(hits)))
        sys.exit(1)
    cache[CP] = rx.sub("{withEn(item.className)}", cache[CP])
    print("ClassPickerModal：顯示處 {item.className} 已改（React key 未動）")

    # 自查：每個檔案都必須同時有 import 與呼叫
    for path in IMPORT_PATH:
        src = cache[path]
        if "properNouns" not in src or "withEn(" not in src:
            print("!! {} 匯入或呼叫缺失".format(path))
            sys.exit(1)
    print("自查：{} 個檔案的匯入與呼叫齊備".format(len(IMPORT_PATH)))

    if not APPLY:
        print("(dry-run，未寫入。加 --apply 以實際寫入)")
        return
    for path, src in cache.items():
        pathlib.Path(path).write_text(src, encoding="utf-8")
    print("已寫入 {} 個檔案".format(len(cache)))


main()
