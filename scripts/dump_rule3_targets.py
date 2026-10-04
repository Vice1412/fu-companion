# -*- coding: utf-8 -*-
"""列出規則三要刪除的英文 UI 標籤，以及物種標籤的顯示點。"""
import pathlib

TARGETS = {
    "src/features/character-sheet/components/CharacterEditor.jsx": range(283, 296),
    "src/features/npc-workshop/NPCWorkshop.jsx": [128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140,
                                                  3755, 3756, 3757, 3758, 3759,
                                                  3850, 3851, 3852, 3853, 3854,
                                                  3880, 3881, 3882, 3883, 3884,
                                                  3830, 3831, 3832, 3833, 3834, 3835,
                                                  4468, 4469, 4470, 4471,
                                                  4496, 4497, 4498, 4499,
                                                  4704, 4705, 4706, 4707, 4708,
                                                  5026, 5027, 5028, 5029, 5030],
    "src/features/npc-workshop/components/NPCBuilder.jsx": [470, 471, 472, 473, 529, 530, 531, 532,
                                                            534, 535, 536, 537, 610, 611, 612, 613,
                                                            794, 795, 796, 797, 847, 848, 849, 850,
                                                            969, 970, 971, 972, 974, 975, 976, 977],
    "src/features/combat-tracker/CombatTracker.jsx": [407, 408, 409, 410],
    "src/features/combat-tracker/components/CombatantCard.jsx": [303, 304, 305, 306],
    "src/features/character-sheet/components/companions/TinkererWorkshop.jsx": [776, 777, 778, 779,
                                                                                 1673, 1674, 1675, 1676,
                                                                                 1904, 1905, 1906, 1907,
                                                                                 1933, 1934, 1935, 1936,
                                                                                 1959, 1960, 1961, 1962],
    "src/features/character-sheet/components/companions/TinkererGadgetsQuickRef.jsx": [274, 275, 276, 277],
    "src/features/character-sheet/components/companions/WayfarerCompanionModal.jsx": [327, 328, 329, 330],
    "src/features/character-sheet/components/companions/ChimeristManager.jsx": [440, 441, 442, 443, 444, 445],
    "src/components/book/BookCoverHub.jsx": [261, 262, 263, 264],
}

for path, lines in TARGETS.items():
    src = pathlib.Path(path).read_text(encoding="utf-8").split("\n")
    print("###", path)
    for n in lines:
        if 1 <= n <= len(src):
            print("{}|{}".format(n, src[n - 1].rstrip()))
    print()
