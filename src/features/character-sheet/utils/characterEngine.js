import rulesData from '../data/rulesData.json';

export const createNewCharacter = () => {
  return {
    id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: "新冒險者",
    identity: "漂泊的旅人",
    theme: "希望",
    origin: "邊境村落",
    level: 5,
    zenit: 500,
    attributes: {
      dex: 8,
      ins: 8,
      mig: 8,
      wlp: 8
    },
    // Classes selected: array of { className: string, level: number, skills: [{ name, sl }] }
    classes: [
      {
        className: "守護者",
        level: 3,
        skills: [
          { name: "護衛", sl: 2 },
          { name: "堡壘", sl: 1 }
        ]
      },
      {
        className: "武器大師",
        level: 2,
        skills: [
          { name: "近戰武器專精", sl: 1 },
          { name: "強力打擊", sl: 1 }
        ]
      }
    ],
    // Equipment
    equipment: {
      mainHand: "青銅劍 (Bronze Sword)",
      offHand: "青銅圓盾 (Bronze Shield)",
      armor: "旅行皮甲 (Travel Garb)",
      accessory: "守護護符"
    },
    // Heroic skills, Spells, Quirks
    heroicSkills: [],
    spells: [],
    quirk: "無",
    // Clocks
    clocks: [
      { id: 'c1', title: '個人誓約 / 羈絆', totalSegments: 6, filledSegments: 1, theme: 'amber', type: 'circle' }
    ],
    // Current runtime resources
    currentHp: null,
    currentMp: null,
    currentIp: 6,
    fabulaPoints: 3,
    avatar: null,
    updatedAt: new Date().toISOString()
  };
};

export const calculateCharacterStats = (char) => {
  if (!char) return {};

  const level = Math.max(5, parseInt(char.level, 10) || 5);
  const dex = char.attributes?.dex || 8;
  const ins = char.attributes?.ins || 8;
  const mig = char.attributes?.mig || 8;
  const wlp = char.attributes?.wlp || 8;

  // 1. Calculate class bonuses
  let bonusHp = 0;
  let bonusMp = 0;
  let bonusIp = 0;

  (char.classes || []).forEach(cl => {
    const classDef = rulesData.classes[cl.className];
    if (classDef && classDef.freeBonus) {
      if (classDef.freeBonus.includes('HP +5')) bonusHp += 5;
      if (classDef.freeBonus.includes('MP +5')) bonusMp += 5;
      if (classDef.freeBonus.includes('IP +2')) bonusIp += 2;
    }
  });

  // Check accessory bonus
  if (char.equipment?.accessory === '守護護符') bonusHp += 5;
  if (char.equipment?.accessory === '魔力寶戒') bonusMp += 5;

  const maxHp = mig * 5 + level + bonusHp;
  const maxMp = wlp * 5 + level + bonusMp;
  const maxIp = 6 + bonusIp;
  const crisisThreshold = Math.floor(maxHp / 2);

  // 2. Defenses & Initiative
  const armorDef = rulesData.equipment.armors.find(a => a.name === char.equipment?.armor) || rulesData.equipment.armors[0];
  const shieldDef = rulesData.equipment.shields.find(s => s.name === char.equipment?.offHand) || rulesData.equipment.shields[0];

  let def = dex;
  let mdef = ins;

  // Armor calculation
  if (armorDef.defFormula === 'dex') def = dex;
  else if (armorDef.defFormula === 'dex+1') def = dex + 1;
  else if (!isNaN(parseInt(armorDef.defFormula, 10))) def = parseInt(armorDef.defFormula, 10);

  if (armorDef.mdefFormula === 'ins') mdef = ins;
  else if (armorDef.mdefFormula === 'ins+1') mdef = ins + 1;
  else if (armorDef.mdefFormula === 'ins+2') mdef = ins + 2;

  // Shield bonus
  if (shieldDef) {
    def += shieldDef.defBonus || 0;
    mdef += shieldDef.mdefBonus || 0;
  }

  // Initiative Modifiers
  let init = 0;
  if (armorDef.initMod) init += armorDef.initMod;
  if (shieldDef?.initMod) init += shieldDef.initMod;
  if (char.equipment?.accessory === '風行長靴') init += 2;

  return {
    maxHp,
    maxMp,
    maxIp,
    crisisThreshold,
    def,
    mdef,
    init,
    dex,
    ins,
    mig,
    wlp
  };
};

export const exportCharacterToCombatant = (char) => {
  const stats = calculateCharacterStats(char);
  const curHp = char.currentHp !== null && char.currentHp !== undefined ? char.currentHp : stats.maxHp;
  const curMp = char.currentMp !== null && char.currentMp !== undefined ? char.currentMp : stats.maxMp;

  return {
    instanceId: `comb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sourceId: char.id,
    sourceType: 'character',
    name: char.name || '冒險者',
    avatar: char.avatar || null,
    faction: '玩家隊伍',
    level: char.level || 5,
    rank: '玩家',
    role: (char.classes || []).map(c => c.className).join(' / ') || '冒險者',
    species: '玩家',
    hp: {
      current: curHp,
      max: stats.maxHp,
      crisisThreshold: stats.crisisThreshold
    },
    mp: {
      current: curMp,
      max: stats.maxMp
    },
    ip: {
      current: char.currentIp !== undefined ? char.currentIp : stats.maxIp,
      max: stats.maxIp
    },
    fabulaPoints: char.fabulaPoints || 3,
    attributes: {
      dex: stats.dex,
      ins: stats.ins,
      mig: stats.mig,
      wlp: stats.wlp
    },
    defense: stats.def,
    magicDefense: stats.mdef,
    initiative: stats.init,
    hasActed: false,
    statusEffects: {
      slow: false,
      dazed: false,
      weak: false,
      shaken: false,
      enraged: false,
      poisoned: false
    },
    skills: (char.classes || []).flatMap(cl => (cl.skills || []).map(sk => ({
      id: `${cl.className}_${sk.name}`,
      name: `${sk.name} (SL ${sk.sl})`,
      category: 'skill',
      desc: `【${cl.className}】特技`,
      isRevealed: true
    }))),
    rawCharData: char
  };
};
