/**
 * 官方經典創角範本 (Core Rulebook Classic Characters)
 * 嚴格遵循官方核心規則書 (Core Rulebook v1.1 Errata 校正版 p.172-175) 之 20 大官方經典角色配置。
 * 所有角色專屬標誌一律對齊 Game-Icons.net (react-icons/gi)。
 */

export const STARTER_PRESETS = [
  {
    "id": "alchemist",
    "title": "鍊金術士",
    "subtitle": "調配藥劑與萬用道具的戰地研究者",
    "tagline": "「科學與秘術的交會點，就是最完美的解方。」",
    "avatar": "alchemist",
    "identity": "精通藥理與魔導造物的探求者",
    "theme": "發現",
    "origin": "學術之都拉達姆",
    "attributes": {
      "dex": 8,
      "ins": 10,
      "mig": 6,
      "wlp": 8
    },
    "classes": [
      {
        "className": "修補匠",
        "level": 3,
        "skills": [
          {
            "name": "小工具",
            "sl": 1
          },
          {
            "name": "藥水雨",
            "sl": 1
          },
          {
            "name": "秘密配方",
            "sl": 1
          }
        ]
      },
      {
        "className": "旅人",
        "level": 2,
        "skills": [
          {
            "name": "有備無患",
            "sl": 1
          },
          {
            "name": "酒館閒聊",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "短匕首",
      "offHand": "戰弓",
      "armor": "旅行皮甲",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "委託研究的贊助商",
        "feelings": [
          "admiration"
        ]
      },
      {
        "target": "提供稀有材料的流浪商人",
        "feelings": [
          "trust"
        ]
      },
      {
        "target": "理念不合的學院導師",
        "feelings": [
          "inferiority"
        ]
      }
    ],
    "zenit": 170
  },
  {
    "id": "black_knight",
    "title": "黑騎士",
    "subtitle": "燃燒生命與暗黑之力的狂暴重裝劍士",
    "tagline": "「為了守護真正的光明，我甘願墮入最深沉的黑暗。」",
    "avatar": "black_knight",
    "identity": "揹負罪孽而戰的黑暗武裝騎士",
    "theme": "復仇",
    "origin": "淪陷的黑曜石王國",
    "attributes": {
      "dex": 8,
      "ins": 6,
      "mig": 10,
      "wlp": 8
    },
    "classes": [
      {
        "className": "暗黑之刃",
        "level": 2,
        "skills": [
          {
            "name": "暗影突襲",
            "sl": 2
          }
        ]
      },
      {
        "className": "熵師",
        "level": 1,
        "skills": [
          {
            "name": "熵系魔法",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 2,
        "skills": [
          {
            "name": "劍刃風暴",
            "sl": 1
          },
          {
            "name": "近戰武器掌握",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "巨劍",
      "offHand": "無盾牌",
      "armor": "符文甲冑",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "毀滅故鄉的帝國將軍",
        "feelings": [
          "hatred"
        ]
      },
      {
        "target": "唯一信任的同行戰友",
        "feelings": [
          "trust",
          "loyalty"
        ]
      },
      {
        "target": "因自身力量而受牽連的無辜者",
        "feelings": [
          "guilt"
        ]
      }
    ],
    "zenit": 120
  },
  {
    "id": "gambler",
    "title": "賭徒",
    "subtitle": "將性命壓在命運天秤上的優雅冒險家",
    "tagline": "「運氣也是實力的一部分，而我向來百賭百贏。」",
    "avatar": "gambler",
    "identity": "縱橫賭場與生死邊緣的命運博弈者",
    "theme": "自由",
    "origin": "娛樂之都黃金海岸",
    "attributes": {
      "dex": 10,
      "ins": 8,
      "mig": 6,
      "wlp": 8
    },
    "classes": [
      {
        "className": "熵師",
        "level": 2,
        "skills": [
          {
            "name": "熵系魔法",
            "sl": 1
          },
          {
            "name": "幸運七",
            "sl": 1
          }
        ]
      },
      {
        "className": "遊蕩者",
        "level": 2,
        "skills": [
          {
            "name": "閃避",
            "sl": 1
          },
          {
            "name": "迅捷",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 1,
        "skills": [
          {
            "name": "近戰武器掌握",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "刺劍",
      "offHand": "手裡劍",
      "armor": "絲綢外衣",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "追討賭債的地下錢莊老闆",
        "feelings": [
          "mistrust"
        ]
      },
      {
        "target": "看穿自己千術的神秘貴族",
        "feelings": [
          "admiration"
        ]
      },
      {
        "target": "總是在危機時拉一把的舊友",
        "feelings": [
          "loyalty"
        ]
      }
    ],
    "zenit": 120
  },
  {
    "id": "gunslinger",
    "title": "槍手",
    "subtitle": "雙手持槍、彈無虛發的速射神槍手",
    "tagline": "「我的子彈比思考更快，在眨眼間終結戰局。」",
    "avatar": "gunslinger",
    "identity": "縱橫荒野與戰場的冷靜狙擊射手",
    "theme": "正義",
    "origin": "機械工業邊境荒原",
    "attributes": {
      "dex": 10,
      "ins": 8,
      "mig": 8,
      "wlp": 6
    },
    "classes": [
      {
        "className": "神射手",
        "level": 3,
        "skills": [
          {
            "name": "連續射擊",
            "sl": 1
          },
          {
            "name": "交叉火力",
            "sl": 1
          },
          {
            "name": "遠程武器掌握",
            "sl": 1
          }
        ]
      },
      {
        "className": "修補匠",
        "level": 2,
        "skills": [
          {
            "name": "小工具",
            "sl": 2
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "手槍",
      "offHand": "符文圓盾",
      "armor": "旅行皮甲",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "被奪走心愛火槍的宿敵",
        "feelings": [
          "hatred"
        ]
      },
      {
        "target": "一同出生入死的拓荒隊友",
        "feelings": [
          "trust"
        ]
      },
      {
        "target": "提供特殊彈藥材料的發明家",
        "feelings": [
          "loyalty"
        ]
      }
    ],
    "zenit": 70
  },
  {
    "id": "healer",
    "title": "治癒師",
    "subtitle": "以溫柔言語與神聖光芒撫平創傷的虔誠祈禱者",
    "tagline": "「只要心懷希望，光芒就永遠不會熄滅。」",
    "avatar": "healer",
    "identity": "走遍大地撫慰苦難的慈悲醫者",
    "theme": "仁慈",
    "origin": "白銀修道院聖所",
    "attributes": {
      "dex": 6,
      "ins": 8,
      "mig": 8,
      "wlp": 10
    },
    "classes": [
      {
        "className": "吟唱者",
        "level": 2,
        "skills": [
          {
            "name": "激勵",
            "sl": 1
          },
          {
            "name": "我相信你",
            "sl": 1
          }
        ]
      },
      {
        "className": "靈師",
        "level": 3,
        "skills": [
          {
            "name": "靈魂魔法",
            "sl": 3
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "法杖",
      "offHand": "無盾牌",
      "armor": "賢者長袍",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "受自己拯救而重獲新生的病人",
        "feelings": [
          "affection"
        ]
      },
      {
        "target": "傳授治癒之道的尊長導師",
        "feelings": [
          "admiration",
          "loyalty"
        ]
      },
      {
        "target": "冷酷忽視平民安危的執政官",
        "feelings": [
          "mistrust"
        ]
      }
    ],
    "zenit": 270
  },
  {
    "id": "magitechnician",
    "title": "魔導技師",
    "subtitle": "運用魔導核心與精密儀器的全能學者",
    "tagline": "「每一道魔力波動，都遵循著精密的齒輪運轉規律。」",
    "avatar": "magitechnician",
    "identity": "融合古代以太科技與現代工程的學者",
    "theme": "抱負",
    "origin": "帝國皇家技術研究院",
    "attributes": {
      "dex": 8,
      "ins": 10,
      "mig": 6,
      "wlp": 8
    },
    "classes": [
      {
        "className": "博學士",
        "level": 2,
        "skills": [
          {
            "name": "快速評估",
            "sl": 2
          }
        ]
      },
      {
        "className": "修補匠",
        "level": 3,
        "skills": [
          {
            "name": "小工具",
            "sl": 3
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "短匕首",
      "offHand": "青銅圓盾",
      "armor": "賢者長袍",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "競爭激烈的學院同儕對手",
        "feelings": [
          "inferiority",
          "admiration"
        ]
      },
      {
        "target": "贊助魔導研究的開明貴族",
        "feelings": [
          "loyalty"
        ]
      },
      {
        "target": "破壞古代遺跡的盜墓者",
        "feelings": [
          "hatred"
        ]
      }
    ],
    "zenit": 120
  },
  {
    "id": "monster_mage",
    "title": "魔獸法師",
    "subtitle": "驅策野性夥伴、汲取狂獸之力的荒野薩滿",
    "tagline": "「傾聽大地的嘶吼，爪牙與獠牙將成為我的利刃。」",
    "avatar": "monster_mage",
    "identity": "與荒野野獸共生並掌握獸性法術的奇術師",
    "theme": "忠誠",
    "origin": "原始蒼翠巨樹森林",
    "attributes": {
      "dex": 8,
      "ins": 6,
      "mig": 10,
      "wlp": 8
    },
    "classes": [
      {
        "className": "嵌合師",
        "level": 2,
        "skills": [
          {
            "name": "野性交談",
            "sl": 1
          },
          {
            "name": "咒語模仿",
            "sl": 1
          }
        ]
      },
      {
        "className": "旅人",
        "level": 2,
        "skills": [
          {
            "name": "忠實夥伴",
            "sl": 2
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 1,
        "skills": [
          {
            "name": "破甲擊",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "闊斧",
      "offHand": "符文圓盾",
      "armor": "旅行皮甲",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "相依為命的野獸夥伴",
        "feelings": [
          "affection",
          "loyalty"
        ]
      },
      {
        "target": "侵犯森林聖域的伐木兵團長",
        "feelings": [
          "hatred"
        ]
      },
      {
        "target": "曾向自己示好的迷途旅行者",
        "feelings": [
          "trust"
        ]
      }
    ],
    "zenit": 70
  },
  {
    "id": "ninja",
    "title": "忍者",
    "subtitle": "隱匿於陰影之中、招招致命的暗殺行者",
    "tagline": "「如風無形，如影隨行。當你察覺時，刃已在喉。」",
    "avatar": "ninja",
    "identity": "執行秘密密令的暗夜密探與刺客",
    "theme": "榮譽",
    "origin": "隱秘的霧隱山里",
    "attributes": {
      "dex": 10,
      "ins": 8,
      "mig": 6,
      "wlp": 8
    },
    "classes": [
      {
        "className": "遊蕩者",
        "level": 3,
        "skills": [
          {
            "name": "偷襲",
            "sl": 1
          },
          {
            "name": "閃避",
            "sl": 2
          }
        ]
      },
      {
        "className": "神射手",
        "level": 1,
        "skills": [
          {
            "name": "警告射擊",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 1,
        "skills": [
          {
            "name": "碎骨擊",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "短匕首",
      "offHand": "手裡劍",
      "armor": "戰鬥輕甲",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "發佈最後密令並失蹤的首領",
        "feelings": [
          "loyalty",
          "doubt"
        ]
      },
      {
        "target": "追殺叛忍身份的同門師兄",
        "feelings": [
          "hatred",
          "inferiority"
        ]
      },
      {
        "target": "曾為自己療傷的民間少女",
        "feelings": [
          "affection"
        ]
      }
    ],
    "zenit": 120
  },
  {
    "id": "pirate",
    "title": "海盜",
    "subtitle": "乘風破浪、引動雷霆與狂怒的七海霸者",
    "tagline": "「暴風雨就是我的號角，大海容不下懦夫！」",
    "avatar": "pirate",
    "identity": "追尋無限財寶與自由的豪爽船長",
    "theme": "自由",
    "origin": "珊瑚群島自由港",
    "attributes": {
      "dex": 8,
      "ins": 6,
      "mig": 10,
      "wlp": 8
    },
    "classes": [
      {
        "className": "元素師",
        "level": 2,
        "skills": [
          {
            "name": "元素魔法",
            "sl": 1
          },
          {
            "name": "咒語之刃",
            "sl": 1
          }
        ]
      },
      {
        "className": "狂怒鬥士",
        "level": 2,
        "skills": [
          {
            "name": "腎上腺素",
            "sl": 1
          },
          {
            "name": "挑釁",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 1,
        "skills": [
          {
            "name": "破甲擊",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "闊斧",
      "offHand": "符文圓盾",
      "armor": "絲綢外衣",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "奪走自己海盜船的宿敵艦長",
        "feelings": [
          "hatred"
        ]
      },
      {
        "target": "共患難的忠誠大副",
        "feelings": [
          "trust",
          "loyalty"
        ]
      },
      {
        "target": "岸上港口深愛之人",
        "feelings": [
          "affection"
        ]
      }
    ],
    "zenit": 70
  },
  {
    "id": "pugilist",
    "title": "拳鬥士",
    "subtitle": "以肉身鐵拳硬撼強敵的狂怒格鬥狂",
    "tagline": "「沒有什麼是一記重拳解決不了的；如果有，就兩拳！」",
    "avatar": "pugilist",
    "identity": "追求極致肉體力量的格鬥擂台冠軍",
    "theme": "抱負",
    "origin": "喧囂的地下黑市格鬥場",
    "attributes": {
      "dex": 8,
      "ins": 6,
      "mig": 10,
      "wlp": 8
    },
    "classes": [
      {
        "className": "狂怒鬥士",
        "level": 3,
        "skills": [
          {
            "name": "腎上腺素",
            "sl": 1
          },
          {
            "name": "暴怒",
            "sl": 1
          },
          {
            "name": "忍耐",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 2,
        "skills": [
          {
            "name": "碎骨擊",
            "sl": 1
          },
          {
            "name": "招架反擊",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "鐵指虎",
      "offHand": "鐵指虎",
      "armor": "戰鬥輕甲",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "曾將自己擊倒在地的拳術宗師",
        "feelings": [
          "admiration",
          "inferiority"
        ]
      },
      {
        "target": "負責打點賽事的經紀人老友",
        "feelings": [
          "trust"
        ]
      },
      {
        "target": "操控假賽的黑道巨頭",
        "feelings": [
          "hatred"
        ]
      }
    ],
    "zenit": 120
  },
  {
    "id": "ranger",
    "title": "遊俠",
    "subtitle": "穿梭荒野密林、百步穿楊的荒野斥候",
    "tagline": "「每片樹葉的飄落，都訴說著荒野的低語與危險。」",
    "avatar": "ranger",
    "identity": "引導旅人、捍衛自然平衡的荒原巡邏隊員",
    "theme": "責任",
    "origin": "迷霧繚繞的邊陲苔原地帶",
    "attributes": {
      "dex": 10,
      "ins": 8,
      "mig": 8,
      "wlp": 6
    },
    "classes": [
      {
        "className": "神射手",
        "level": 3,
        "skills": [
          {
            "name": "連續射擊",
            "sl": 1
          },
          {
            "name": "遠程武器掌握",
            "sl": 1
          },
          {
            "name": "警告射擊",
            "sl": 1
          }
        ]
      },
      {
        "className": "旅人",
        "level": 2,
        "skills": [
          {
            "name": "有備無患",
            "sl": 1
          },
          {
            "name": "通曉道路",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "短弓",
      "offHand": "短匕首",
      "armor": "絲綢外衣",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "委託引路的重要貴族保護對象",
        "feelings": [
          "loyalty"
        ]
      },
      {
        "target": "失蹤於禁忌密林的巡邏隊同袍",
        "feelings": [
          "affection"
        ]
      },
      {
        "target": "破壞邊境封印的狂暴魔獸",
        "feelings": [
          "hatred"
        ]
      }
    ],
    "zenit": 120
  },
  {
    "id": "red_sorcerer",
    "title": "紅魔法師",
    "subtitle": "兼通黑白魔法與優雅劍技的魔劍全才",
    "tagline": "「劍鋒開拓道路，魔導支配戰場，此乃終極優雅。」",
    "avatar": "red_sorcerer",
    "identity": "融匯破壞魔導、治癒術與西洋劍術的貴族決鬥家",
    "theme": "榮譽",
    "origin": "繁華的王都高等魔導學院",
    "attributes": {
      "dex": 8,
      "ins": 10,
      "mig": 8,
      "wlp": 6
    },
    "classes": [
      {
        "className": "元素師",
        "level": 3,
        "skills": [
          {
            "name": "元素魔法",
            "sl": 2
          },
          {
            "name": "咒語之刃",
            "sl": 1
          }
        ]
      },
      {
        "className": "靈師",
        "level": 1,
        "skills": [
          {
            "name": "靈魂魔法",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 1,
        "skills": [
          {
            "name": "近戰武器掌握",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "刺劍",
      "offHand": "符文圓盾",
      "armor": "戰鬥輕甲",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "傳授多重魔法之道的傳奇魔劍士",
        "feelings": [
          "admiration"
        ]
      },
      {
        "target": "在社交舞會上結識的神秘密探",
        "feelings": [
          "mistrust"
        ]
      },
      {
        "target": "在決鬥中敗給自己的豪門貴冑",
        "feelings": [
          "inferiority"
        ]
      }
    ],
    "zenit": 70
  },
  {
    "id": "sage",
    "title": "賢者",
    "subtitle": "操縱三相元素之怒、洞悉真理的古典大法師",
    "tagline": "「火焰、寒霜、雷霆——皆在真理的宏大篇章中流轉。」",
    "avatar": "sage",
    "identity": "沉浸於古老魔典與元素奧秘的大學者",
    "theme": "發現",
    "origin": "懸空圖書館亞歷山大",
    "attributes": {
      "dex": 6,
      "ins": 10,
      "mig": 6,
      "wlp": 10
    },
    "classes": [
      {
        "className": "元素師",
        "level": 3,
        "skills": [
          {
            "name": "元素魔法",
            "sl": 3
          }
        ]
      },
      {
        "className": "博學士",
        "level": 2,
        "skills": [
          {
            "name": "靈光一閃",
            "sl": 1
          },
          {
            "name": "集中",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "魔導書",
      "offHand": "無盾牌",
      "armor": "賢者長袍",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "一同解讀失落石碑的學者同伴",
        "feelings": [
          "admiration",
          "trust"
        ]
      },
      {
        "target": "企圖用禁忌魔術毀滅世界的舊友",
        "feelings": [
          "hatred",
          "guilt"
        ]
      },
      {
        "target": "指引自己踏上求知之旅的導師",
        "feelings": [
          "loyalty"
        ]
      }
    ],
    "zenit": 270
  },
  {
    "id": "samurai",
    "title": "武士",
    "subtitle": "拔刀即斬、鐵壁防禦與靈刃合一的東方劍聖",
    "tagline": "「刀即是心，心如止水。一刀流轉，生死立判。」",
    "avatar": "samurai",
    "identity": "遵循嚴格武士道道義的孤傲流浪劍客",
    "theme": "榮譽",
    "origin": "櫻花飄落的東方島國",
    "attributes": {
      "dex": 8,
      "ins": 8,
      "mig": 8,
      "wlp": 8
    },
    "classes": [
      {
        "className": "守護者",
        "level": 2,
        "skills": [
          {
            "name": "防守掌握",
            "sl": 2
          }
        ]
      },
      {
        "className": "靈師",
        "level": 1,
        "skills": [
          {
            "name": "靈魂魔法",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 2,
        "skills": [
          {
            "name": "招架反擊",
            "sl": 1
          },
          {
            "name": "近戰武器掌握",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "武士刀",
      "offHand": "無盾牌",
      "armor": "符文甲冑",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "已故的主君",
        "feelings": [
          "loyalty",
          "affection"
        ]
      },
      {
        "target": "同門出走並墮入修羅道的師兄",
        "feelings": [
          "hatred"
        ]
      },
      {
        "target": "見證自己武士之誓的盟友",
        "feelings": [
          "trust"
        ]
      }
    ],
    "zenit": 120
  },
  {
    "id": "soldier",
    "title": "士兵",
    "subtitle": "衝鋒陷陣、以盾護衛同袍的鋼鐵前線精兵",
    "tagline": "「陣線不破，希望不滅！人在陣地在！」",
    "avatar": "soldier",
    "identity": "經歷無數血戰洗禮的正規軍前線重步兵",
    "theme": "責任",
    "origin": "要塞衛城加里森",
    "attributes": {
      "dex": 8,
      "ins": 6,
      "mig": 10,
      "wlp": 8
    },
    "classes": [
      {
        "className": "守護者",
        "level": 2,
        "skills": [
          {
            "name": "護衛",
            "sl": 1
          },
          {
            "name": "保護",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 3,
        "skills": [
          {
            "name": "碎骨擊",
            "sl": 2
          },
          {
            "name": "破甲擊",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "青銅劍",
      "offHand": "符文圓盾",
      "armor": "板條甲",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "生死與共的班長與老長官",
        "feelings": [
          "loyalty",
          "admiration"
        ]
      },
      {
        "target": "戰火中倖存的家鄉親人",
        "feelings": [
          "affection"
        ]
      },
      {
        "target": "在撤退時拋棄步兵的指揮官",
        "feelings": [
          "hatred"
        ]
      }
    ],
    "zenit": 70
  },
  {
    "id": "spell_fencer",
    "title": "咒劍士",
    "subtitle": "靈巧游刃於敵陣、以光輝與元素護佑雙刃的魔力劍術士",
    "tagline": "「魔力化為我的屏障，劍尖詠唱著終末之詩。」",
    "avatar": "spell_fencer",
    "identity": "結合古代元素附魔與極速西洋劍步法的特務劍士",
    "theme": "抱負",
    "origin": "浮空艇空中要塞",
    "attributes": {
      "dex": 10,
      "ins": 8,
      "mig": 8,
      "wlp": 6
    },
    "classes": [
      {
        "className": "元素師",
        "level": 2,
        "skills": [
          {
            "name": "元素魔法",
            "sl": 2
          }
        ]
      },
      {
        "className": "靈師",
        "level": 1,
        "skills": [
          {
            "name": "靈魂魔法",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 2,
        "skills": [
          {
            "name": "劍刃風暴",
            "sl": 1
          },
          {
            "name": "招架反擊",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "刺劍",
      "offHand": "符文圓盾",
      "armor": "絲綢外衣",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "指點自己劍藝的隱世長者",
        "feelings": [
          "admiration"
        ]
      },
      {
        "target": "刺殺目標但暗中同情的敵國將領",
        "feelings": [
          "mistrust",
          "affection"
        ]
      },
      {
        "target": "共同執行特務的密探夥伴",
        "feelings": [
          "trust"
        ]
      }
    ],
    "zenit": 120
  },
  {
    "id": "summoner",
    "title": "召喚師",
    "subtitle": "與遠古神話幻獸立下誓約的至高召喚者",
    "tagline": "「傾聽亙古的呢喃，遠古的守護巨獸啊，響應我的召喚！」",
    "avatar": "summoner",
    "identity": "能夠與世界創世幻獸心靈感應的聖女 / 神子",
    "theme": "希望",
    "origin": "沉睡於浮雲之上的神殿",
    "attributes": {
      "dex": 8,
      "ins": 8,
      "mig": 6,
      "wlp": 10
    },
    "classes": [
      {
        "className": "秘儀師",
        "level": 3,
        "skills": [
          {
            "name": "阿爾卡納再生",
            "sl": 2
          },
          {
            "name": "綁定和召喚",
            "sl": 1
          }
        ]
      },
      {
        "className": "靈師",
        "level": 2,
        "skills": [
          {
            "name": "靈魂魔法",
            "sl": 2
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "法杖",
      "offHand": "無盾牌",
      "armor": "賢者長袍",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "第一個與自己共鳴的古代幻獸",
        "feelings": [
          "affection",
          "trust"
        ]
      },
      {
        "target": "妄圖抽乾召喚獸以太的邪惡法皇",
        "feelings": [
          "hatred"
        ]
      },
      {
        "target": "守護在自己身邊的聖堂誓約者",
        "feelings": [
          "loyalty"
        ]
      }
    ],
    "zenit": 270
  },
  {
    "id": "thief",
    "title": "竊賊",
    "subtitle": "雙匕首速攻、奪取靈魂與寶物的陰影幽靈",
    "tagline": "「不管是金幣、秘密還是靈魂，只要我盯上了就是我的。」",
    "avatar": "thief",
    "identity": "穿梭於屋頂與下水道、無人能捉摸的怪盜",
    "theme": "自由",
    "origin": "迷宮般的水上貿易之都",
    "attributes": {
      "dex": 10,
      "ins": 8,
      "mig": 6,
      "wlp": 8
    },
    "classes": [
      {
        "className": "遊蕩者",
        "level": 3,
        "skills": [
          {
            "name": "偷襲",
            "sl": 1
          },
          {
            "name": "迅捷",
            "sl": 1
          },
          {
            "name": "靈魂竊取",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 2,
        "skills": [
          {
            "name": "碎骨擊",
            "sl": 2
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "短匕首",
      "offHand": "短匕首",
      "armor": "旅行皮甲",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "收養並傳授偷盜技巧的盜賊公會長",
        "feelings": [
          "affection",
          "loyalty"
        ]
      },
      {
        "target": "窮追不捨的頑固警備隊長",
        "feelings": [
          "admiration"
        ]
      },
      {
        "target": "出賣夥伴的黑市銷贓商",
        "feelings": [
          "hatred"
        ]
      }
    ],
    "zenit": 170
  },
  {
    "id": "troubadour",
    "title": "吟遊詩人",
    "subtitle": "撥動琴弦、以言靈激盪士氣與挑動心弦的行者",
    "tagline": "「歷史由勝利者書寫，但傳奇由吟遊詩人歌唱。」",
    "avatar": "troubadour",
    "identity": "記載世間悲歡離合並以言靈操控人心的流浪詩人",
    "theme": "疑問",
    "origin": "流浪馬戲團與劇團大篷車",
    "attributes": {
      "dex": 10,
      "ins": 8,
      "mig": 6,
      "wlp": 8
    },
    "classes": [
      {
        "className": "吟唱者",
        "level": 2,
        "skills": [
          {
            "name": "譴責",
            "sl": 1
          },
          {
            "name": "意外盟友",
            "sl": 1
          }
        ]
      },
      {
        "className": "靈師",
        "level": 2,
        "skills": [
          {
            "name": "靈魂魔法",
            "sl": 2
          }
        ]
      },
      {
        "className": "旅人",
        "level": 1,
        "skills": [
          {
            "name": "通曉道路",
            "sl": 1
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "短匕首",
      "offHand": "青銅圓盾",
      "armor": "絲綢外衣",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "詩歌中讚頌的失落王室後裔",
        "feelings": [
          "affection",
          "loyalty"
        ]
      },
      {
        "target": "曾給予自己掌聲的帝國暴君",
        "feelings": [
          "mistrust"
        ]
      },
      {
        "target": "同行流浪的樂手夥伴",
        "feelings": [
          "trust"
        ]
      }
    ],
    "zenit": 220
  },
  {
    "id": "valkyrie",
    "title": "女武神",
    "subtitle": "騰空躍擊、槍法超群的鋼鐵戰場支配者",
    "tagline": "「以雷霆萬鈞之勢自九天降臨，引導英靈邁向勝利！」",
    "avatar": "valkyrie",
    "identity": "揹負戰神神諭、執長槍傲立戰場的前線英傑",
    "theme": "榮譽",
    "origin": "雲端天界之城",
    "attributes": {
      "dex": 8,
      "ins": 8,
      "mig": 8,
      "wlp": 8
    },
    "classes": [
      {
        "className": "元素師",
        "level": 1,
        "skills": [
          {
            "name": "元素魔法",
            "sl": 1
          }
        ]
      },
      {
        "className": "守護者",
        "level": 1,
        "skills": [
          {
            "name": "不動要塞",
            "sl": 1
          }
        ]
      },
      {
        "className": "武器大師",
        "level": 3,
        "skills": [
          {
            "name": "劍刃風暴",
            "sl": 1
          },
          {
            "name": "近戰武器掌握",
            "sl": 2
          }
        ]
      }
    ],
    "equipment": {
      "mainHand": "輕長矛",
      "offHand": "符文圓盾",
      "armor": "板條甲",
      "accessory": ""
    },
    "bonds": [
      {
        "target": "賜予神聖長矛的天界神祇",
        "feelings": [
          "loyalty",
          "admiration"
        ]
      },
      {
        "target": "在戰場上立誓同生共死的戰士",
        "feelings": [
          "trust"
        ]
      },
      {
        "target": "玷污戰場榮譽的亡靈術士",
        "feelings": [
          "hatred"
        ]
      }
    ],
    "zenit": 70
  }
];
