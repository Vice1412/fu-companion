# -*- coding: utf-8 -*-
"""規則三英文殘留：只撈「同一行同時含中文與英文詞」者（面向使用者的混合字串）。

排除註解行與純程式碼行，降低誤報。
"""
import re
import pathlib

CJK = re.compile(r"[\u4e00-\u9fff]")
# 面向使用者的英文詞：2 字以上的拉丁詞（排除單字母、排除純大寫縮寫白名單）
LATIN = re.compile(r"[A-Za-z][A-Za-z'&]{2,}(?:\s+[A-Za-z'&]{2,})*")
ALLOWED = re.compile(
    r"^(DEX|INS|MIG|WLP|HP|MP|IP|HR|SL|DEF|M\.DEF|JPG|PNG|GIF|WebP|JSON|Zenit|"
    r"Fabula|Ultima|z|d[0-9]+)$"
)

hits = []
for p in sorted(pathlib.Path("src").rglob("*.jsx")):
    for i, line in enumerate(p.read_text(encoding="utf-8").split("\n"), 1):
        s = line.strip()
        if s.startswith("//") or s.startswith("*") or s.startswith("/*"):
            continue
        if not CJK.search(line):
            continue
        # 排除 import 與純 className 行
        if s.startswith("import ") or s.startswith("className="):
            continue
        for m in LATIN.finditer(line):
            tok = m.group(0).strip()
            if ALLOWED.match(tok):
                continue
            # 排除 CSS/Tailwind 類名與屬性名
            if re.match(r"^[a-z\-]+$", tok) and ("-" in tok or "className" in line):
                continue
            hits.append((str(p).replace("\\", "/"), i, tok))

print("中文+英文混合行命中 =", len(hits))
cur = None
for f, i, tok in hits:
    if f != cur:
        print("\n###", f.replace("src/", ""))
        cur = f
    print("  :{}  {}".format(i, tok))
