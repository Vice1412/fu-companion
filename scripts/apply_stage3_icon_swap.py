# -*- coding: utf-8 -*-
"""階段 3：把誤用於敘事槽位的 lucide 圖示換成 react-icons/gi。

設計原則：
1. 所有字串替換皆為「精確字面值」，並在替換前 assert 命中次數，不符即中止（絕不靜默亂改）。
2. 匯入陳述以正則改寫，保留 `as` 別名。
3. 預設 dry-run；加 --apply 才寫檔。

用法：
    python scripts/apply_stage3_icon_swap.py            # 只報告
    python scripts/apply_stage3_icon_swap.py --apply    # 實際寫入
"""
import re
import sys
import pathlib

APPLY = "--apply" in sys.argv

# --------------------------------------------------------------------------
# (檔案, 精確舊字串, 新字串, 預期命中次數)
# --------------------------------------------------------------------------
EDITS = [
    # ================= NPCWorkshop.jsx =================
    # --- 物種頭像（SPECIES_THEMES :66-73）---
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <PawPrint size={24} />", "icon: <GiPawPrint size={24} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Cpu size={24} />", "icon: <GiGearHammer size={24} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Flame size={24} />", "icon: <GiDevilMask size={24} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Zap size={24} />", "icon: <GiSparkSpirit size={24} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <User size={24} />", "icon: <GiHumanPyramid size={24} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Dna size={24} />", "icon: <GiTentacleStrike size={24} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Leaf size={24} />", "icon: <GiFern size={24} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Ghost size={24} />", "icon: <GiGhost size={24} />", 1),
    # --- 物種未知 fallback 與空狀態 ---
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Users size={20} />", "icon: <GiMonsterGrasp size={20} />", 2),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<Users size={24} />", "<GiMonsterGrasp size={24} />", 1),
    # --- 八步驟導航（:3211-3213）---
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <UserSquare2 size={18} />", "icon: <GiPositionMarker size={18} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Copy size={18} />", "icon: <GiUpgrade size={18} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <ImageIcon size={18} />", "icon: <GiDna2 size={18} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Sword size={18} />", "icon: <GiBroadsword size={18} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Crown size={18} />", "icon: <GiLaurelCrown size={18} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Trash2 size={18} />", "icon: <GiDeathSkull size={18} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <FileText size={18} />", "icon: <GiScrollUnfurled size={18} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "icon: <Edit3 size={18} />", "icon: <GiBrain size={18} />", 1),
    # --- 技能提示與徽章 ---
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<Sword size={12} />", "<GiBroadsword size={12} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<Sparkles size={12} />", "<GiSparkles size={12} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", '<Sparkles size={12} className="text-amber-700" />', '<GiSparkles size={12} className="text-amber-700" />', 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", '<Sparkles size={18} className="text-amber-700" />', '<GiSparkles size={18} className="text-amber-700" />', 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", '<Sparkles size={20} className="text-fuchsia-700 animate-pulse" />', '<GiSparkles size={20} className="text-fuchsia-700 animate-pulse" />', 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<Sparkles size={16} />", "<GiSparkles size={16} />", 1),
    # --- 星／冠／書／盾 ---
    ("src/features/npc-workshop/NPCWorkshop.jsx", '<Star size={18} className="fill-amber-500/20 text-amber-700" />', '<GiStarSwirl size={18} className="text-amber-700" />', 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<Star size={14} />", "<GiStarSwirl size={14} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", '<Crown size={18} className="text-amber-700" />', '<GiLaurelCrown size={18} className="text-amber-700" />', 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<Crown size={80} />", "<GiLaurelCrown size={80} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", '<Crown size={80} className="text-amber-700/30 mb-6 drop-shadow-sm" />', '<GiLaurelCrown size={80} className="text-amber-700/30 mb-6 drop-shadow-sm" />', 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", '<Crown size={14} className="text-amber-700" />', '<GiLaurelCrown size={14} className="text-amber-700" />', 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<Crown size={14} />", "<GiLaurelCrown size={14} />", 2),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<Swords size={16} />", "<GiCrossedSwords size={16} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<Swords size={14} />", "<GiCrossedSwords size={14} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<ShieldAlert size={16} />", "<GiCheckedShield size={16} />", 1),
    ("src/features/npc-workshop/NPCWorkshop.jsx", "<BookOpen size={16} />", "<GiSpellBook size={16} />", 1),

    # ================= NPCBuilder.jsx =================
    ("src/features/npc-workshop/components/NPCBuilder.jsx", '<Skull className="w-4 h-4 text-red-700" />', '<GiDeathSkull className="w-4 h-4 text-red-700" />', 2),
    ("src/features/npc-workshop/components/NPCBuilder.jsx", '<Skull className="w-4 h-4 text-purple-800" />', '<GiDeathSkull className="w-4 h-4 text-purple-800" />', 1),
    ("src/features/npc-workshop/components/NPCBuilder.jsx", '<Shield className="w-3.5 h-3.5 text-amber-700" />', '<GiShieldReflect className="w-3.5 h-3.5 text-amber-700" />', 1),
    ("src/features/npc-workshop/components/NPCBuilder.jsx", '<Sparkles className="w-3.5 h-3.5 text-blue-700" />', '<GiSparkles className="w-3.5 h-3.5 text-blue-700" />', 1),

    # ================= NPCCardPreview.jsx =================
    ("src/features/npc-workshop/components/NPCCardPreview.jsx", '<Heart className="w-3 h-3 text-red-600 fill-red-500/20" />', '<GiHealthNormal className="w-3 h-3 text-red-600" />', 1),
    ("src/features/npc-workshop/components/NPCCardPreview.jsx", '<Sparkles className="w-3 h-3 text-blue-600" />', '<GiLightningTear className="w-3 h-3 text-blue-600" />', 1),
    ("src/features/npc-workshop/components/NPCCardPreview.jsx", '<Shield className="w-3 h-3 text-amber-700" />', '<GiCheckedShield className="w-3 h-3 text-amber-700" />', 1),
    ("src/features/npc-workshop/components/NPCCardPreview.jsx", '<Zap className="w-3 h-3 text-purple-700" />', '<GiCrystalBall className="w-3 h-3 text-purple-700" />', 1),

    # ================= NPCLibrary.jsx =================
    ("src/features/npc-workshop/components/NPCLibrary.jsx", '<Swords className="w-12 h-12 text-[#8c7b6c] mx-auto mb-3 opacity-40" />', '<GiCrossedSwords className="w-12 h-12 text-[#8c7b6c] mx-auto mb-3 opacity-40" />', 1),

    # ================= CombatTracker.jsx =================
    ("src/features/combat-tracker/CombatTracker.jsx", '<Swords className="w-5 h-5 text-amber-700" />', '<GiCrossedSwords className="w-5 h-5 text-amber-700" />', 1),
    ("src/features/combat-tracker/CombatTracker.jsx", '<Swords className="w-4 h-4 text-rose-700" />', '<GiCrossedSwords className="w-4 h-4 text-rose-700" />', 1),
    ("src/features/combat-tracker/CombatTracker.jsx", '<Clock className="w-4 h-4 text-rose-700" />', '<GiPocketWatch className="w-4 h-4 text-rose-700" />', 1),
    ("src/features/combat-tracker/CombatTracker.jsx", '<Shield className="w-4 h-4 text-sky-700" />', '<GiCheckedShield className="w-4 h-4 text-sky-700" />', 1),

    # ================= AddCombatantModal.jsx =================
    ("src/features/combat-tracker/components/AddCombatantModal.jsx", '<Swords className="w-3.5 h-3.5" />', '<GiDragonHead className="w-3.5 h-3.5" />', 1),
    ("src/features/combat-tracker/components/AddCombatantModal.jsx", '<User className="w-3.5 h-3.5" />', '<GiVisoredHelm className="w-3.5 h-3.5" />', 1),

    # ================= CombatantCard.jsx =================
    ("src/features/combat-tracker/components/CombatantCard.jsx", '<Heart className="w-3.5 h-3.5 text-red-600 fill-red-600/30" />', '<GiHealthNormal className="w-3.5 h-3.5 text-red-600" />', 1),
    ("src/features/combat-tracker/components/CombatantCard.jsx", '<Sparkles className="w-3.5 h-3.5 text-sky-600 fill-sky-600/30" />', '<GiLightningTear className="w-3.5 h-3.5 text-sky-600" />', 1),
]

# --------------------------------------------------------------------------
# 各檔要新增的 gi 名稱，以及要自 lucide 匯入移除的名稱
# --------------------------------------------------------------------------
GI_ADD = {
    "src/features/npc-workshop/NPCWorkshop.jsx": [
        "GiBrain", "GiBroadsword", "GiCheckedShield", "GiCrossedSwords", "GiDeathSkull",
        "GiDevilMask", "GiDna2", "GiFern", "GiGearHammer", "GiGhost", "GiHumanPyramid",
        "GiLaurelCrown", "GiMonsterGrasp", "GiPawPrint", "GiPositionMarker", "GiScrollUnfurled",
        "GiSparkSpirit", "GiSparkles", "GiSpellBook", "GiStarSwirl", "GiTentacleStrike", "GiUpgrade",
    ],
    "src/features/npc-workshop/components/NPCBuilder.jsx": ["GiDeathSkull"],
    "src/features/npc-workshop/components/NPCCardPreview.jsx": [
        "GiCheckedShield", "GiCrystalBall", "GiHealthNormal", "GiLightningTear",
    ],
    "src/features/npc-workshop/components/NPCLibrary.jsx": ["GiCrossedSwords"],
    "src/features/combat-tracker/CombatTracker.jsx": ["GiCheckedShield", "GiCrossedSwords", "GiPocketWatch"],
    "src/features/combat-tracker/components/AddCombatantModal.jsx": ["GiDragonHead", "GiVisoredHelm"],
    "src/features/combat-tracker/components/CombatantCard.jsx": ["GiHealthNormal", "GiLightningTear"],
}

LUCIDE_DROP = {
    "src/features/npc-workshop/NPCWorkshop.jsx": [
        "BookOpen", "Cpu", "Crown", "Dna", "Edit3", "FileText", "Flame", "Ghost", "Image", "Leaf",
        "PawPrint", "ShieldAlert", "Sparkles", "Star", "Sword", "Swords", "Trash2", "User",
        "UserSquare2", "Users", "Zap",
    ],
    "src/features/npc-workshop/components/NPCBuilder.jsx": ["Shield", "Skull", "Sparkles"],
    "src/features/npc-workshop/components/NPCCardPreview.jsx": ["Heart", "Shield", "Sparkles", "Zap"],
    "src/features/npc-workshop/components/NPCLibrary.jsx": ["Swords"],
    "src/features/combat-tracker/CombatTracker.jsx": ["Clock", "Shield", "Swords"],
    "src/features/combat-tracker/components/AddCombatantModal.jsx": ["Swords", "User"],
    "src/features/combat-tracker/components/CombatantCard.jsx": ["Heart", "Sparkles"],
}

LUCIDE_RE = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'lucide-react';?", re.S)
GI_RE = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'react-icons/gi';?", re.S)


def split_names(block):
    """回傳 [(importName, localName), ...]，保留 `X as Y` 別名。"""
    out = []
    for n in block.split(","):
        n = n.strip()
        if not n:
            continue
        parts = [p.strip() for p in n.split(" as ")]
        out.append((parts[0], parts[-1]))
    return out


def count_usage(src, local):
    """計算 JSX 使用點 <Local ...> 的次數。"""
    return len(re.findall(r"<" + re.escape(local) + r"(?=[\s/>])", src))


def fmt_import(pairs, module):
    """pairs 為 [(importName, localName), ...]，重新組出匯入陳述。"""
    body = ""
    for imp, loc in pairs:
        body += "\n  {},".format(imp if imp == loc else "{} as {}".format(imp, loc))
    return "import {{{}\n}} from '{}';".format(body, module)


def main():
    cache = {}
    errors = []

    # ---- pass 1: 字面值替換（先驗證全部命中數）----
    for path, old, new, expect in EDITS:
        if path not in cache:
            cache[path] = pathlib.Path(path).read_text(encoding="utf-8")
        n = cache[path].count(old)
        if n != expect:
            errors.append("{}: 預期 {} 次，實得 {} 次 -> {}".format(path, expect, n, old[:70]))
    if errors:
        print("!! 字面值驗證失敗，未寫入任何檔案：")
        for e in errors:
            print("  ", e)
        sys.exit(1)

    for path, old, new, expect in EDITS:
        cache[path] = cache[path].replace(old, new)
    print("字面值替換：{} 筆全部命中".format(len(EDITS)))

    # ---- pass 2: 匯入陳述改寫 ----
    for path in GI_ADD:
        src = cache[path]

        # 2a. lucide：僅在「剩餘 JSX 使用點為 0」時才移除，避免誤刪仍在用的匯入
        m = LUCIDE_RE.search(src)
        if not m:
            print("  !! {} 找不到 lucide 匯入".format(path))
            sys.exit(1)
        pairs = split_names(m.group(1))
        kept, dropped, blocked = [], [], []
        for imp, loc in pairs:
            if imp not in LUCIDE_DROP[path]:
                kept.append((imp, loc))
                continue
            left = count_usage(src, loc)
            if left == 0:
                dropped.append("{} (was {})".format(imp, loc) if imp != loc else imp)
            else:
                kept.append((imp, loc))
                blocked.append("{} 仍有 {} 處使用".format(loc, left))
        src = src[: m.start()] + fmt_import(kept, "lucide-react") + src[m.end():]
        print("  {}：lucide 移除 {} 個 -> {}".format(path, len(dropped), ", ".join(dropped) or "（無）"))
        for b in blocked:
            print("      ⚠ 保留：{}".format(b))

        # 2b. gi 新增
        add = GI_ADD[path]
        if add:
            gm = GI_RE.search(src)
            if gm:
                have = {loc for _, loc in split_names(gm.group(1))}
                merged = [(n, n) for n in sorted(have | set(add))]
                src = src[: gm.start()] + fmt_import(merged, "react-icons/gi") + src[gm.end():]
            else:
                lm = LUCIDE_RE.search(src)
                insert = fmt_import([(n, n) for n in sorted(add)], "react-icons/gi") + "\n"
                src = src[: lm.end() + 1] + insert + src[lm.end() + 1:]
            print("      gi 新增 {} 個".format(len(add)))

        # 2c. 自查：gi 使用到的名稱是否都已匯入
        gnames = set()
        gm2 = GI_RE.search(src)
        if gm2:
            gnames = {loc for _, loc in split_names(gm2.group(1))}
        used_gi = set(re.findall(r"<(Gi[A-Za-z0-9_]+)(?=[\s/>])", src))
        missing = sorted(used_gi - gnames)
        if missing:
            print("      !! {} 使用了未匯入的 gi 圖示：{}".format(path, ", ".join(missing)))
            sys.exit(1)
        cache[path] = src

    if not APPLY:
        print("\n(dry-run，未寫入。加 --apply 以實際寫入)")
        return

    for path, src in cache.items():
        pathlib.Path(path).write_text(src, encoding="utf-8")
    print("\n已寫入 {} 個檔案".format(len(cache)))


main()
