/**
 * Fabula Ultima Sourcebook & Expansion Configuration
 * 官方手冊與拓展分類定義
 */

export const SOURCEBOOKS = {
  core: {
    id: 'core',
    name: '核心規則書 (Core Rulebook)',
    shortName: '核心 15 職',
    badgeColor: 'amber',
    desc: '《Fabula Ultima》核心 15 大經典職業，TRPG 冒險與創角基石。',
    defaultEnabled: true,
    locked: true, // 核心職業永遠啟用
    classes: [
      '秘儀師',
      '嵌合師',
      '暗黑之刃',
      '元素師',
      '熵師',
      '狂怒鬥士',
      '守護者',
      '博學士',
      '吟唱者',
      '遊蕩者',
      '神射手',
      '靈師',
      '修補匠',
      '旅人',
      '武器大師'
    ]
  },
  highFantasy: {
    id: 'highFantasy',
    name: '高等奇幻手冊 (High Fantasy Atlas)',
    shortName: '🏰 高等奇幻',
    badgeColor: 'purple',
    desc: '史詩般的英雄宿命、誓約與魔法，包含指揮官、舞者、死靈術士等職業。',
    defaultEnabled: false,
    classes: ['指揮官', '舞者', '魔奏者', '徽記師', '死靈術士']
  },
  technoFantasy: {
    id: 'technoFantasy',
    name: '科技奇幻手冊 (Techno Fantasy Atlas)',
    shortName: '⚙️ 科技奇幻',
    badgeColor: 'cyan',
    desc: '魔導機械載具、超能心靈感應與基因突變，包含機師、靈能者、突變體。',
    defaultEnabled: false,
    classes: ['機師', '靈能者', '突變體']
  },
  naturalFantasy: {
    id: 'naturalFantasy',
    name: '自然奇幻手冊 (Natural Fantasy Atlas)',
    shortName: '🌿 自然奇幻',
    badgeColor: 'emerald',
    desc: '大地生態共生、野味烹飪料理與行商契約，包含美食家、祈喚者、商人、植物學家。',
    defaultEnabled: false,
    classes: ['美食家', '祈喚者', '商人', '植物學家']
  },
  playtest: {
    id: 'playtest',
    name: '官方公測修訂 (Playtest Materials)',
    shortName: '🧪 公測修訂',
    badgeColor: 'rose',
    desc: '官方 Patreon 釋出之實驗性規則與最新重製版技能。',
    defaultEnabled: false,
    classes: ['秘儀師【Playtest】']
  }
};

/**
 * 官方標準推薦情感選項（三維六向）
 */
export const BOND_FEELINGS = [
  {
    category: 'pair1',
    label: '欽佩 vs 自卑',
    options: [
      { id: 'admiration', label: '欽佩 (Admiration)', icon: '✨' },
      { id: 'inferiority', label: '自卑 (Inferiority)', icon: '🥀' }
    ]
  },
  {
    category: 'pair2',
    label: '忠誠 vs 疑忌',
    options: [
      { id: 'loyalty', label: '忠誠 (Loyalty)', icon: '🛡️' },
      { id: 'mistrust', label: '疑忌 (Mistrust)', icon: '👁️' }
    ]
  },
  {
    category: 'pair3',
    label: '眷愛 vs 憎恨',
    options: [
      { id: 'affection', label: '眷愛 (Affection)', icon: '💖' },
      { id: 'hatred', label: '憎恨 (Hatred)', icon: '⚡' }
    ]
  }
];

/**
 * 官方六大狀態異常 (Status Afflictions)
 */
export const STATUS_AFFLICTIONS = {
  dazed: {
    id: 'dazed',
    name: '眩暈 (Dazed)',
    short: '眩暈',
    affectedStats: ['ins'],
    desc: '洞察 (INS) 骰階下降 1 級 (最低降至 d6)'
  },
  enraged: {
    id: 'enraged',
    name: '憤怒 (Enraged)',
    short: '憤怒',
    affectedStats: ['dex', 'ins'],
    desc: '敏捷 (DEX) 與 洞察 (INS) 骰階下降 1 級 (最低降至 d6)'
  },
  poisoned: {
    id: 'poisoned',
    name: '中毒 (Poisoned)',
    short: '中毒',
    affectedStats: ['mig', 'wlp'],
    desc: '體魄 (MIG) 與 意志 (WLP) 骰階下降 1 級 (最低降至 d6)'
  },
  shaken: {
    id: 'shaken',
    name: '動搖 (Shaken)',
    short: '動搖',
    affectedStats: ['wlp'],
    desc: '意志 (WLP) 骰階下降 1 級 (最低降至 d6)'
  },
  slow: {
    id: 'slow',
    name: '緩速 (Slow)',
    short: '緩速',
    affectedStats: ['dex'],
    desc: '敏捷 (DEX) 骰階下降 1 級 (最低降至 d6)'
  },
  weak: {
    id: 'weak',
    name: '虛弱 (Weak)',
    short: '虛弱',
    affectedStats: ['mig'],
    desc: '體魄 (MIG) 骰階下降 1 級 (最低降至 d6)'
  }
};

/**
 * 官方身份主題靈感池 (Canonical Themes)
 */
export const CANONICAL_THEMES = [
  '希望 (Hope)',
  '野心 (Ambition)',
  '歸屬 (Belonging)',
  '負疚 (Guilt)',
  '正義 (Justice)',
  '慈悲 (Mercy)',
  '復仇 (Vengeance)',
  '懷疑 (Doubt)',
  '職責 (Duty)'
];

/**
 * 官方三大起始四維屬性陣列 (總點數均為 32)
 */
export const ATTRIBUTE_STARTING_ARRAYS = [
  {
    id: 'specialized',
    name: '專精型 (Specialized)',
    dice: { dex: 10, ins: 8, mig: 8, wlp: 6 },
    desc: 'd10, d8, d8, d6 —— 官方最推薦！一項主專精、兩項均等、一項略低。'
  },
  {
    id: 'standard',
    name: '均衡型 (Standard)',
    dice: { dex: 8, ins: 8, mig: 8, wlp: 8 },
    desc: 'd8, d8, d8, d8 —— 四項全能，無論面對任何檢定都能穩定應對。'
  },
  {
    id: 'focused',
    name: '特化型 (Focused)',
    dice: { dex: 10, ins: 10, mig: 6, wlp: 6 },
    desc: 'd10, d10, d6, d6 —— 極端特化，雙主屬性極強，但在短板領域需要隊友支援。'
  }
];
