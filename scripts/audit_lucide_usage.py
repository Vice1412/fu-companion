# -*- coding: utf-8 -*-
"""盤點 lucide-react 的實際使用點：檔 × 圖示名 × 行號。

只計 JSX 使用（`<Name ...>` 或 `<Name/>`），不計 import 行本身。
"""
import re
import pathlib
from collections import defaultdict

ROOT = pathlib.Path("src")
IMP = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'(lucide-react)'", re.S)

result = defaultdict(lambda: defaultdict(list))
for p in sorted(ROOT.rglob("*")):
    if p.suffix not in (".js", ".jsx"):
        continue
    text = p.read_text(encoding="utf-8", errors="ignore")
    m = IMP.search(text)
    if not m:
        continue
    names = [n.strip().split(" as ")[0] for n in m.group(1).split(",") if n.strip()]
    lines = text.split("\n")
    for name in names:
        use = re.compile(r"<" + re.escape(name) + r"(?=[\s/>])")
        hits = [i + 1 for i, ln in enumerate(lines) if use.search(ln)]
        if hits:
            result[str(p).replace("\\", "/")][name] = hits

total_names = 0
total_sites = 0
for f in sorted(result):
    print(f)
    for name in sorted(result[f]):
        hits = result[f][name]
        total_names += 1
        total_sites += len(hits)
        print("    {:<18} x{:<3} {}".format(name, len(hits), ", ".join(map(str, hits))))
print()
print("檔案數 =", len(result), " 圖示名使用組合 =", total_names, " 總使用點 =", total_sites)
