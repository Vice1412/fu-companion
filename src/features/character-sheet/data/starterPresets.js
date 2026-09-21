/**
 * 官方經典創角範本 (Core Rulebook Starter Archetypes)
 * 供新手玩家一鍵套用，亦可作為進階構建靈感。
 */

export const STARTER_PRESETS = [
  {
    id: 'spellblade',
    title: '元素魔劍士 (Spellblade)',
    subtitle: '近戰劍術與元素爆發的先鋒戰士',
    tagline: '「將烈焰與寒霜纏繞於鋒刃，一劍破開魔導防線！」',
    avatar: '⚔️',
    identity: '融合劍術與元素之道的戰鬥魔導士',
    theme: '希望 (Hope)',
    origin: '浮空要塞之都',
    attributes: { dex: 8, ins: 8, mig: 8, wlp: 8 },
    classes: [
      {
        className: '元素師',
        level: 2,
        skills: [
          { name: '元素魔法', sl: 1 },
          { name: '咒語之刃', sl: 1 }
        ]
      },
      {
        className: '武器大師',
        level: 3,
        skills: [
          { name: '近戰武器掌握', sl: 2 },
          { name: '劍刃風暴', sl: 1 }
        ]
      }
    ],
    equipment: {
      mainHand: '闊劍 (Broadsword)',
      offHand: '青銅圓盾 (Bronze Shield)',
      armor: '旅行皮甲 (Travel Garb)',
      accessory: '守護護符'
    },
    bonds: [
      { target: '同行的同行學者', feelings: ['admiration', 'loyalty'] }
    ],
    zenit: 100
  },
  {
    id: 'holy_knight',
    title: '神聖護衛 (Holy Knight)',
    subtitle: '堅不可摧的鋼鐵之壁與虔誠守護者',
    tagline: '「只要我尚有一口氣在，任何人都休想傷害我的同伴！」',
    avatar: '🛡️',
    identity: '發誓守護無辜者的退役聖殿騎士',
    theme: '正義 (Justice)',
    origin: '神聖大教堂領地',
    attributes: { dex: 6, ins: 8, mig: 10, wlp: 8 },
    classes: [
      {
        className: '守護者',
        level: 3,
        skills: [
          { name: '保護', sl: 2 },
          { name: '不動要塞', sl: 1 }
        ]
      },
      {
        className: '靈師',
        level: 2,
        skills: [
          { name: '療癒能力', sl: 1 },
          { name: '靈魂魔法', sl: 1 }
        ]
      }
    ],
    equipment: {
      mainHand: '青銅劍 (Bronze Sword)',
      offHand: '重型塔盾 (Heavy Shield)',
      armor: '青銅胸甲 (Bronze Plate)',
      accessory: '守護護符'
    },
    bonds: [
      { target: '曾拯救自己的神父', feelings: ['loyalty', 'affection'] }
    ],
    zenit: 50
  },
  {
    id: 'ranger_hunter',
    title: '荒野神射手 (Verdant Ranger)',
    subtitle: '與巨鷹為伴、百步穿楊的荒野獵人',
    tagline: '「風會告訴我箭鏃的軌跡，荒野絕不背叛虔誠的追尋者。」',
    avatar: '🏹',
    identity: '漫遊於迷霧森林的邊境獵手',
    theme: '歸屬 (Belonging)',
    origin: '千年翡翠古林',
    attributes: { dex: 10, ins: 8, mig: 8, wlp: 6 },
    classes: [
      {
        className: '神射手',
        level: 3,
        skills: [
          { name: '遠程武器掌握', sl: 2 },
          { name: '警告射擊', sl: 1 }
        ]
      },
      {
        className: '旅人',
        level: 2,
        skills: [
          { name: '忠實夥伴', sl: 1 },
          { name: '通曉道路', sl: 1 }
        ]
      }
    ],
    equipment: {
      mainHand: '短弓 (Shortbow)',
      offHand: '無盾牌',
      armor: '戰鬥輕甲 (Combat Tunic)',
      accessory: '風行長靴'
    },
    bonds: [
      { target: '失散的幼年玩伴', feelings: ['affection'] }
    ],
    zenit: 150
  },
  {
    id: 'arcane_scholar',
    title: '奧術博學者 (Arcane Scholar)',
    subtitle: '洞悉萬物弱點、掌控宏大元素的博學導師',
    tagline: '「知識不僅是力量，更是指引命運擺脫混沌的唯一真理。」',
    avatar: '📜',
    identity: '尋求失落古代科技的皇家學會研究員',
    theme: '野心 (Ambition)',
    origin: '古代圖書館沉沒群島',
    attributes: { dex: 6, ins: 10, mig: 6, wlp: 10 },
    classes: [
      {
        className: '元素師',
        level: 3,
        skills: [
          { name: '元素魔法', sl: 2 },
          { name: '魔法砲擊', sl: 1 }
        ]
      },
      {
        className: '博學士',
        level: 2,
        skills: [
          { name: '快速評估', sl: 1 },
          { name: '博聞強記', sl: 1 }
        ]
      }
    ],
    equipment: {
      mainHand: '戰鬥魔杖 (War Staff)',
      offHand: '無盾牌',
      armor: '絲綢外衣 (Silk Shirt)',
      accessory: '魔力寶戒'
    },
    bonds: [
      { target: '嚴格但睿智的導師', feelings: ['admiration'] }
    ],
    zenit: 120
  },
  {
    id: 'shadow_assassin',
    title: '暗夜殺手 (Shadow Assassin)',
    subtitle: '隱於暗影伺機而動的致命刺客',
    tagline: '「光芒越刺眼，所投下的陰影就越致命。」',
    avatar: '🗡️',
    identity: '逃脫暗殺組織追捕的原王牌刺客',
    theme: '復仇 (Vengeance)',
    origin: '地下罪惡黑市',
    attributes: { dex: 10, ins: 8, mig: 8, wlp: 6 },
    classes: [
      {
        className: '暗黑之刃',
        level: 2,
        skills: [
          { name: '暗影突襲', sl: 1 },
          { name: '疼痛', sl: 1 }
        ]
      },
      {
        className: '遊蕩者',
        level: 3,
        skills: [
          { name: '偷襲', sl: 2 },
          { name: '閃避', sl: 1 }
        ]
      }
    ],
    equipment: {
      mainHand: '短匕首 (Steel Dagger)',
      offHand: '無盾牌',
      armor: '戰鬥輕甲 (Combat Tunic)',
      accessory: '風行長靴'
    },
    bonds: [
      { target: '背叛自己的原刺客組織首領', feelings: ['hatred', 'mistrust'] }
    ],
    zenit: 130
  },
  {
    id: 'tinkerer_inventor',
    title: '魔導機巧技師 (Arcane Tinkerer)',
    subtitle: '煉金藥水、緊急工具與混沌熵力大師',
    tagline: '「如果齒輪卡住了，就用扳手敲一下；如果世界壞了，就換個齒輪。」',
    avatar: '⚙️',
    identity: '發明了無數奇妙古怪裝置的瘋狂技工',
    theme: '懷疑 (Doubt)',
    origin: '蒸汽煙囪工業重鎮',
    attributes: { dex: 8, ins: 10, mig: 6, wlp: 8 },
    classes: [
      {
        className: '修補匠',
        level: 3,
        skills: [
          { name: '緊急道具', sl: 1 },
          { name: '秘密配方', sl: 2 }
        ]
      },
      {
        className: '熵師',
        level: 2,
        skills: [
          { name: '熵係魔法', sl: 1 },
          { name: '幸運七', sl: 1 }
        ]
      }
    ],
    equipment: {
      mainHand: '短匕首 (Steel Dagger)',
      offHand: '無盾牌',
      armor: '旅行皮甲 (Travel Garb)',
      accessory: '工匠工具帶'
    },
    bonds: [
      { target: '投資自己實驗的好心商人', feelings: ['loyalty'] }
    ],
    zenit: 180
  },
  {
    id: 'battle_orator',
    title: '戰意演說家 (Battle Orator)',
    subtitle: '以雄辯演說振奮士氣、以神聖祝禱逆轉戰局的領袖',
    tagline: '「不要害怕黑暗，英雄的意志比任何烈陽更加熾熱！」',
    avatar: '📯',
    identity: '周遊列國鼓舞抵抗軍的吟遊雄辯使',
    theme: '職責 (Duty)',
    origin: '戰火纷飛的邊陲聯邦',
    attributes: { dex: 6, ins: 8, mig: 8, wlp: 10 },
    classes: [
      {
        className: '吟唱者',
        level: 3,
        skills: [
          { name: '激勵', sl: 2 },
          { name: '能言善辯', sl: 1 }
        ]
      },
      {
        className: '靈師',
        level: 2,
        skills: [
          { name: '支援魔法', sl: 1 },
          { name: '療癒能力', sl: 1 }
        ]
      }
    ],
    equipment: {
      mainHand: '短劍 (Shortsword)',
      offHand: '青銅圓盾 (Bronze Shield)',
      armor: '旅行皮甲 (Travel Garb)',
      accessory: '魔力寶戒'
    },
    bonds: [
      { target: '在戰火中守護的平民少年', feelings: ['affection', 'loyalty'] }
    ],
    zenit: 100
  },
  {
    id: 'beast_chimerist',
    title: '魔獸擬態薩滿 (Chimeric Shaman)',
    subtitle: '溝通萬物生靈、汲取魔物天賦特異的野性之子',
    tagline: '「我傾聽野獸的呼吸，爪牙即是我的咒語。」',
    avatar: '🐺',
    identity: '與魔獸群一同長大的荒野通靈者',
    theme: '慈悲 (Mercy)',
    origin: '原始無人之境',
    attributes: { dex: 8, ins: 8, mig: 10, wlp: 6 },
    classes: [
      {
        className: '嵌合師',
        level: 3,
        skills: [
          { name: '咒語模仿', sl: 1 },
          { name: '野性交談', sl: 1 },
          { name: '吞噬', sl: 1 }
        ]
      },
      {
        className: '旅人',
        level: 2,
        skills: [
          { name: '忠實夥伴', sl: 1 },
          { name: '通曉道路', sl: 1 }
        ]
      }
    ],
    equipment: {
      mainHand: '長槍 (Spear)',
      offHand: '無盾牌',
      armor: '旅行皮甲 (Travel Garb)',
      accessory: '野獸牙符'
    },
    bonds: [
      { target: '撫養自己長大的古老白狼', feelings: ['loyalty', 'admiration'] }
    ],
    zenit: 120
  }
];
