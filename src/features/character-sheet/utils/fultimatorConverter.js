/**
 * Fultimator (fultimator.com) 角色卡數據相容轉換工具
 * 提供雙向相容：
 * 1. 支援無縫匯入 Fultimator 的 JSON 導出檔，自動轉化為 FU Companion 內部標準結構
 * 2. 支援將 FU Companion 角色導出為 Fultimator 標準 JSON 格式
 */

import { createNewCharacter } from './characterEngine.js';

// 官方 28 職業英漢雙向對照字典
export const CLASS_TRANSLATION_MAP = {
  // 核心 15 職 (Core 15)
  'arcanist': '秘儀師',
  'chimerist': '嵌合師',
  'darkblade': '暗黑之刃',
  'elementalist': '元素師',
  'entropist': '熵師',
  'fury': '狂怒鬥士',
  'guardian': '守護者',
  'loremaster': '博學士',
  'orator': '吟唱者',
  'rogue': '遊蕩者',
  'sharpshooter': '神射手',
  'spiritist': '靈師',
  'tinkerer': '修補匠',
  'wayfarer': '旅人',
  'weaponmaster': '武器大師',

  // 高等奇幻 (High Fantasy)
  'commander': '指揮官',
  'dancer': '舞者',
  'chanter': '魔奏者',
  'symbolist': '徽記師',
  'necromancer': '死靈術士',

  // 科技奇幻 (Techno Fantasy)
  'pilot': '機師',
  'esper': '靈能者',
  'mutant': '突變體',

  // 自然奇幻 (Natural Fantasy)
  'gourmet': '美食家',
  'invoker': '祈喚者',
  'merchant': '商人',
  'floralist': '植物學家'
};

// 反向查詢：中文到英文職業
export const REVERSE_CLASS_MAP = Object.entries(CLASS_TRANSLATION_MAP).reduce((acc, [en, zh]) => {
  acc[zh] = en.charAt(0).toUpperCase() + en.slice(1);
  return acc;
}, {});

/**
 * 檢測傳入的 JSON 是否為 Fultimator 導出格式
 */
export const isFultimatorCharacter = (data) => {
  if (!data || typeof data !== 'object') return false;
  
  // Fultimator 特徵：attributes 物件包含 dexterity、insight、might、willpower
  if (data.attributes && (
    'dexterity' in data.attributes ||
    'insight' in data.attributes ||
    'willpower' in data.attributes
  )) {
    return true;
  }

  // Fultimator 特徵：info 物件或 stats 物件包裝
  if (data.info && typeof data.info === 'object' && ('fabulapoints' in data.info || 'zenit' in data.info)) {
    return true;
  }

  if (data.stats && (data.stats.hp || data.stats.mp)) {
    return true;
  }

  return false;
};

/**
 * 將 Fultimator 角色數據轉化為 FU Companion 內部規範格式
 */
export const convertFultimatorToFUCompanion = (fChar) => {
  const base = createNewCharacter();

  const name = fChar.name && fChar.name !== '-' ? fChar.name : (fChar.info?.name || '無名冒險者');
  const level = parseInt(fChar.lvl || fChar.level, 10) || 5;

  // 1. 基礎身份資訊 (info)
  const info = fChar.info || {};
  const identity = info.identity || fChar.identity || '';
  const theme = info.theme || fChar.theme || '希望';
  const origin = info.origin || fChar.origin || '';
  const avatar = info.imgurl || fChar.avatar || null;
  const exp = parseInt(info.exp || fChar.exp, 10) || 0;
  const zenit = parseInt(info.zenit || fChar.zenit, 10) || 0;
  const fabulaPoints = parseInt(info.fabulapoints ?? fChar.fabulaPoints, 10) ?? 3;
  const backpackNotes = info.description || fChar.backpackNotes || '';

  // 2. 屬性骰階 (attributes: dexterity, insight, might, willpower)
  const rawAttrs = fChar.attributes || {};
  const parseAttrVal = (val, fallback = 8) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const match = val.match(/d?(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    if (val && typeof val === 'object' && val.base) return parseAttrVal(val.base);
    return fallback;
  };

  const attributes = {
    dex: parseAttrVal(rawAttrs.dexterity ?? rawAttrs.dex, 8),
    ins: parseAttrVal(rawAttrs.insight ?? rawAttrs.ins, 8),
    mig: parseAttrVal(rawAttrs.might ?? rawAttrs.mig, 8),
    wlp: parseAttrVal(rawAttrs.willpower ?? rawAttrs.wlp, 8)
  };

  // 3. 狀態異常 (statuses)
  const statuses = fChar.statuses || fChar.statusAfflictions || {};
  const statusAfflictions = {
    slow: !!statuses.slow,
    dazed: !!statuses.dazed,
    enraged: !!statuses.enraged,
    weak: !!statuses.weak,
    shaken: !!statuses.shaken,
    poisoned: !!statuses.poisoned
  };

  // 4. 動態資源 (stats: hp, mp, ip)
  const curHp = fChar.stats?.hp?.current !== undefined ? fChar.stats.hp.current : (fChar.currentHp ?? null);
  const curMp = fChar.stats?.mp?.current !== undefined ? fChar.stats.mp.current : (fChar.currentMp ?? null);
  const curIp = fChar.stats?.ip?.current !== undefined ? fChar.stats.ip.current : (fChar.currentIp ?? null);

  // 5. 職業與特技 (classes)
  const classes = (fChar.classes || []).map(cl => {
    const rawName = cl.name || cl.className || '未知職業';
    const lower = rawName.toLowerCase().trim();
    const translatedName = CLASS_TRANSLATION_MAP[lower] || rawName;
    const clLvl = parseInt(cl.lvl || cl.level, 10) || 1;

    const skills = (cl.skills || []).map(sk => ({
      name: sk.name || sk.skillName || '特技',
      sl: parseInt(sk.sl || sk.level || sk.rank, 10) || 1
    }));

    return {
      className: translatedName,
      level: clLvl,
      skills
    };
  });

  // 6. 情感羈絆 (bonds)
  const rawBonds = info.bonds || fChar.bonds || [];
  const bonds = rawBonds.map((b, idx) => {
    if (typeof b === 'string') {
      return {
        id: `bond_${Date.now()}_${idx}`,
        target: b,
        feelings: ['admiration']
      };
    }

    const target = b.target || b.name || `羈絆對象 ${idx + 1}`;
    let feelings = [];
    if (Array.isArray(b.feelings)) {
      feelings = b.feelings;
    } else {
      if (b.admiration) feelings.push('admiration');
      if (b.inferiority) feelings.push('inferiority');
      if (b.loyalty) feelings.push('loyalty');
      if (b.mistrust) feelings.push('mistrust');
      if (b.affection) feelings.push('affection');
      if (b.hatred) feelings.push('hatred');
    }

    return {
      id: b.id || `bond_${Date.now()}_${idx}`,
      target,
      feelings: feelings.length > 0 ? feelings : ['admiration']
    };
  });

  // 7. 裝備武裝 (equipment: mainHand, offHand, armor, accessory)
  const equipment = {
    mainHand: base.equipment.mainHand,
    offHand: base.equipment.offHand,
    armor: base.equipment.armor,
    accessory: base.equipment.accessory
  };

  if (Array.isArray(fChar.weapons) && fChar.weapons.length > 0) {
    const w0 = fChar.weapons[0];
    equipment.mainHand = w0.name || w0.base?.name || equipment.mainHand;
    if (fChar.weapons.length > 1) {
      const w1 = fChar.weapons[1];
      equipment.offHand = w1.name || w1.base?.name || equipment.offHand;
    }
  }

  if (Array.isArray(fChar.shields) && fChar.shields.length > 0) {
    equipment.offHand = fChar.shields[0].name || fChar.shields[0].base?.name || equipment.offHand;
  }

  if (Array.isArray(fChar.armor) && fChar.armor.length > 0) {
    equipment.armor = fChar.armor[0].name || fChar.armor[0].base?.name || equipment.armor;
  }

  if (Array.isArray(fChar.accessories) && fChar.accessories.length > 0) {
    equipment.accessory = fChar.accessories[0].name || fChar.accessories[0].base?.name || equipment.accessory;
  }

  // 8. 咒語 (spells)
  const spells = (fChar.spells || []).map(sp => ({
    name: sp.name || '法術',
    school: sp.school || '通用',
    mp: sp.mp || '10',
    target: sp.target || '單體',
    duration: sp.duration || '瞬發',
    isOffensive: !!(sp.isOffensive || sp.offensive),
    effect: sp.effect || sp.description || ''
  }));

  // 9. 啟用的手冊拓展配置
  const enabledSourcebooks = ['core'];
  classes.forEach(c => {
    if (['指揮官', '舞者', '魔奏者', '徽記師', '死靈術士'].includes(c.className)) {
      if (!enabledSourcebooks.includes('highFantasy')) enabledSourcebooks.push('highFantasy');
    }
    if (['機師', '靈能者', '突變體'].includes(c.className)) {
      if (!enabledSourcebooks.includes('technoFantasy')) enabledSourcebooks.push('technoFantasy');
    }
    if (['美食家', '祈喚者', '商人', '植物學家'].includes(c.className)) {
      if (!enabledSourcebooks.includes('naturalFantasy')) enabledSourcebooks.push('naturalFantasy');
    }
    if (c.className.includes('Playtest')) {
      if (!enabledSourcebooks.includes('playtest')) enabledSourcebooks.push('playtest');
    }
  });

  return {
    ...base,
    id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    level,
    identity,
    theme,
    origin,
    avatar,
    exp,
    zenit,
    fabulaPoints,
    attributes,
    statusAfflictions,
    classes: classes.length > 0 ? classes : base.classes,
    bonds,
    equipment,
    spells,
    backpackNotes,
    enabledSourcebooks,
    currentHp: curHp,
    currentMp: curMp,
    currentIp: curIp,
    clocks: fChar.clocks || base.clocks,
    updatedAt: new Date().toISOString()
  };
};

/**
 * 將 FU Companion 角色導出為 Fultimator 規範之 JSON 結構
 */
export const convertFUCompanionToFultimator = (char) => {
  return {
    uid: 'fu_companion_export',
    name: char.name || '冒險者',
    lvl: char.level || 5,
    info: {
      pronouns: '',
      identity: char.identity || '',
      theme: char.theme || '希望',
      origin: char.origin || '',
      bonds: (char.bonds || []).map(b => ({
        name: b.target,
        admiration: b.feelings?.includes('admiration') || false,
        inferiority: b.feelings?.includes('inferiority') || false,
        loyalty: b.feelings?.includes('loyalty') || false,
        mistrust: b.feelings?.includes('mistrust') || false,
        affection: b.feelings?.includes('affection') || false,
        hatred: b.feelings?.includes('hatred') || false
      })),
      description: char.backpackNotes || '',
      fabulapoints: char.fabulaPoints || 3,
      exp: char.exp || 0,
      zenit: char.zenit || 0,
      imgurl: char.avatar || ''
    },
    attributes: {
      dexterity: char.attributes?.dex || 8,
      insight: char.attributes?.ins || 8,
      might: char.attributes?.mig || 8,
      willpower: char.attributes?.wlp || 8
    },
    stats: {
      hp: {
        max: 45,
        current: char.currentHp ?? 45
      },
      mp: {
        max: 45,
        current: char.currentMp ?? 45
      },
      ip: {
        max: 6,
        current: char.currentIp ?? 6
      }
    },
    statuses: {
      slow: !!char.statusAfflictions?.slow,
      dazed: !!char.statusAfflictions?.dazed,
      enraged: !!char.statusAfflictions?.enraged,
      weak: !!char.statusAfflictions?.weak,
      shaken: !!char.statusAfflictions?.shaken,
      poisoned: !!char.statusAfflictions?.poisoned,
      dexUp: false,
      insUp: false,
      migUp: false,
      wlpUp: false
    },
    classes: (char.classes || []).map(c => ({
      name: REVERSE_CLASS_MAP[c.className] || c.className,
      lvl: c.level,
      skills: (c.skills || []).map(s => ({
        name: s.name,
        sl: s.sl
      }))
    })),
    weapons: char.equipment?.mainHand ? [{
      name: char.equipment.mainHand,
      base: {
        name: char.equipment.mainHand,
        category: 'Melee',
        cost: 100,
        att1: 'dexterity',
        att2: 'might',
        prec: 0,
        damage: 6
      }
    }] : [],
    shields: char.equipment?.offHand && char.equipment.offHand.includes('盾') ? [{
      name: char.equipment.offHand,
      base: {
        name: char.equipment.offHand,
        def: 2,
        mdef: 0
      }
    }] : [],
    armor: char.equipment?.armor ? [{
      name: char.equipment.armor,
      base: {
        name: char.equipment.armor,
        defFormula: 'dex',
        mdefFormula: 'ins'
      }
    }] : [],
    accessories: char.equipment?.accessory ? [{
      name: char.equipment.accessory
    }] : [],
    spells: (char.spells || []).map(sp => ({
      name: sp.name,
      school: sp.school,
      mp: sp.mp,
      target: sp.target,
      duration: sp.duration,
      effect: sp.effect
    }))
  };
};
