# -*- coding: utf-8 -*-
"""修補 apply_stage2_emoji_cleanup.py 的三處誤刪：三元式 else 分支被連根移除。

原腳本把 `) : ( <span>…emoji…</span> );` 換成 `);`，導致 `cond ? (X);` 語法錯誤。
正解為 `) : null;`——保留三元式結構，只把死碼的 emoji 分支換成 null。
"""
import re
import sys
import pathlib

APPLY = "--apply" in sys.argv
NW = "src/features/npc-workshop/NPCWorkshop.jsx"

REPAIRS = [
    ('<WatermarkIcon className="w-48 h-48 sm:w-56 sm:h-56 -rotate-12 transform translate-x-8 -translate-y-8" />\n'
     '                            );',
     '<WatermarkIcon className="w-48 h-48 sm:w-56 sm:h-56 -rotate-12 transform translate-x-8 -translate-y-8" />\n'
     '                            ) : null;', 1),
    ('<CardIcon className="w-14 h-14" />\n                              );',
     '<CardIcon className="w-14 h-14" />\n                              ) : null;', 1),
    ('<QuickIcon className="w-6 h-6 sm:w-7 sm:h-7" />\n                      )}',
     '<QuickIcon className="w-6 h-6 sm:w-7 sm:h-7" />\n                      ) : null}', 1),
]


def main():
    src = pathlib.Path(NW).read_text(encoding="utf-8")
    errors = []
    for old, new, expect in REPAIRS:
        n = src.count(old)
        if n != expect:
            errors.append("預期 {} 次，實得 {} 次 -> {}".format(expect, n, old[:70]))
    if errors:
        print("!! 驗證失敗，未寫入：")
        for e in errors:
            print("  ", e)
        sys.exit(1)
    for old, new, expect in REPAIRS:
        src = src.replace(old, new)
    print("修補：{} 筆全部命中".format(len(REPAIRS)))

    # 自查：不得殘留 `? ( ... );` 這種缺 else 的三元式
    bad = re.findall(r"\? \([^)]*\)\s*;", src)
    if bad:
        print("!! 仍有語法可疑處：", bad[:3])
        sys.exit(1)
    print("自查：無殘缺三元式")

    if not APPLY:
        print("(dry-run，未寫入。加 --apply 以實際寫入)")
        return
    pathlib.Path(NW).write_text(src, encoding="utf-8")
    print("已寫入", NW)


main()
