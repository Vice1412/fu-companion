import {
  DAMAGE_TYPES,
  ROLES_DATA,
  syncLevelPassives,
  SPECIES_DATA
} from '../data';

export const getDynamicValues = (npcLevel, partyLevel = 5) => {
  const pl = parseInt(partyLevel) || 5;
  const nl = parseInt(npcLevel) || 5;

  let tier = 0;
  if (pl >= 40) tier = 2;
  else if (pl >= 20) tier = 1;

  let small, large, massive;
  if (tier === 0) { small = 10; large = 30; massive = 40; }
  else if (tier === 1) { small = 20; large = 40; massive = 60; }
  else { small = 30; large = 50; massive = 80; }

  const conditionLarge = nl >= 30 ? large : small;
  const attritionHp = nl >= 30 ? 10 : 5;
  const attritionMp = nl >= 30 ? 20 : 10;
  const tempDef = 12 + Math.floor(nl / 20);

  return {
    '[少量]': small,
    '[大量]': large,
    '[巨量]': massive,
    '[條件大量]': conditionLarge,
    '[消耗戰HP]': attritionHp,
    '[消耗戰MP]': attritionMp,
    '[臨時防禦]': tempDef,
    '[碾壓傷害]': nl >= 30 ? 30 : 20
  };
};

export const getInitialAffinities = () => {
  const init = {};
  DAMAGE_TYPES.forEach(type => { init[type] = 'normal'; });
  return init;
};

export const getSpeciesAffinities = (sid, sCfg) => {
  const affs = {};
  if (!sid || !sCfg) return affs;
  const sBenefits = sCfg.selectedBenefits || [];

  if (sid === 'sp_construct') {
    affs['土'] = 'res';
    affs['毒'] = 'imm';
    if (sCfg.sp_construct_extra_vul && sCfg.sp_construct_extra_vul !== '無') {
      affs[sCfg.sp_construct_extra_vul] = 'vul';
    }
  }

  if (sid === 'sp_demon') {
    const res = Array.isArray(sCfg.sp_demon_resists) ? sCfg.sp_demon_resists : (sCfg.sp_demon_resists ? [sCfg.sp_demon_resists] : []);
    res.forEach(t => { affs[t] = 'res'; });
    if (sBenefits.includes('b1') && sCfg.sp_demon_abs_choice) {
      affs[sCfg.sp_demon_abs_choice] = 'abs';
    }
  }

  if (sid === 'sp_element') {
    affs['毒'] = 'imm';
    if (sCfg.sp_element_immune) affs[sCfg.sp_element_immune] = 'imm';
    if (sCfg.sp_element_extra_vul && sCfg.sp_element_extra_vul !== '無') {
      affs[sCfg.sp_element_extra_vul] = 'vul';
    }
    if (sBenefits.includes('b1') && sCfg.sp_element_abs_choice) {
      if (sCfg.sp_element_abs_choice === '連結於免疫') {
        if (sCfg.sp_element_immune) affs[sCfg.sp_element_immune] = 'abs';
      } else {
        affs[sCfg.sp_element_abs_choice] = 'abs';
      }
    }
  }

  if (sid === 'sp_humanoid') {
    if (sCfg.sp_humanoid_weakness) affs[sCfg.sp_humanoid_weakness] = 'vul';
    if (sBenefits.includes('b1')) {
      const res = sCfg.sp_humanoid_resists || [];
      res.forEach(t => { affs[t] = 'res'; });
    }
  }

  if (sid === 'sp_monster') {
    if (sBenefits.includes('b1')) {
      const res = sCfg.sp_monster_resists || [];
      res.forEach(t => { affs[t] = 'res'; });
    }
  }

  if (sid === 'sp_plant') {
    if (sCfg.sp_plant_weakness) affs[sCfg.sp_plant_weakness] = 'vul';
    if (sBenefits.includes('b2')) {
      const res = sCfg.sp_plant_resists || [];
      res.forEach(t => { affs[t] = 'res'; });
    }
  }

  if (sid === 'sp_undead') {
    affs['暗'] = 'imm';
    affs['毒'] = 'imm';
    affs['光'] = 'vul';
    if (sBenefits.includes('b1') && sCfg.sp_undead_abs_choice) {
      affs[sCfg.sp_undead_abs_choice] = 'abs';
    }
  }

  return affs;
};

export const resolveTemplateVariables = (text, selections, options = {}) => {
  if (!text) return "";
  const { recursionLimit = 3, npcLevel = 5, partyLevel = 5 } = options;

  let resolved = text;

  // Replace dynamic bracket values first (e.g. [少量], [大量], [巨量], [碾壓傷害])
  const dyn = getDynamicValues(npcLevel, partyLevel);
  Object.keys(dyn).forEach(k => {
    resolved = resolved.replaceAll(k, `${dyn[k]}`);
  });

  let loopCount = 0;
  while (resolved.includes('{') && loopCount < recursionLimit) {
    resolved = resolved.replace(/\{([^}]+)\}/g, (match, key) => {
      let val = selections?.[key];
      if (val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) return `[ ___ ]`;
      if (Array.isArray(val)) {
        return val.join(' / ');
      }
      return val;
    });
    loopCount++;
  }
  return resolved;
};

export const calculateNpcBudgets = (npc) => {
  if (!npc) return {
    roleSkills: { max: 0, used: 0 },
    customization: { max: 1, used: 0 },
    bossSkills: { max: 0, used: 0 },
    resistances: { max: 0, used: 0 },
    immunities: { max: 0, used: 0 },
    weaknesses: { min: 1, current: 0 }
  };

  const lvl = parseInt(npc.level) || 5;
  const rank = npc.rank || '士兵';

  // 1. Rank Bonus
  let rankBonus = 0;
  if (rank === '精英') rankBonus = 1;
  else if (rank === '冠位') rankBonus = Math.max(1, parseInt(npc.championMultiplier) || 1);

  // 2. Level Bonus
  let levelBonus = 0;
  if (lvl >= 20) levelBonus += 1;
  if (lvl >= 40) levelBonus += 1;
  if (lvl >= 60) levelBonus += 1;

  // 3. Negative Skill Bonus
  const skills = npc.skills || [];
  const hasNegativeSkill = skills.some(s => s.source === 'negativeSkill' || s.category === 'negative');
  const negBonus = hasNegativeSkill ? 1 : 0;

  // 4. Species Bonus
  let speciesBonus = 0;
  const sid = npc.selectedSpeciesId;
  const sBenefits = npc.speciesConfig?.selectedBenefits || [];
  if (sid === 'sp_humanoid') {
    speciesBonus += 1; // Humanoid inherent bonus
  }
  if (sid === 'sp_beast' && sBenefits.includes('b5')) speciesBonus += sBenefits.filter(b => b === 'b5').length;
  if (sid === 'sp_construct' && sBenefits.includes('b4')) speciesBonus += 1;
  if (sid === 'sp_demon' && sBenefits.includes('b4')) speciesBonus += 1;
  if (sid === 'sp_element' && sBenefits.includes('b4')) speciesBonus += 1;
  if (sid === 'sp_humanoid' && sBenefits.includes('b5')) speciesBonus += sBenefits.filter(b => b === 'b5').length;
  if (sid === 'sp_monster' && sBenefits.includes('b4')) speciesBonus += 1;
  if (sid === 'sp_plant' && sBenefits.includes('b4')) speciesBonus += 1;
  if (sid === 'sp_undead' && sBenefits.includes('b4')) speciesBonus += 1;

  // 5. Weakness Bonus (Physical vulnerability gives +1 skill)
  const weaknessBonus = (npc.affinities && npc.affinities['物理'] === 'vul') ? 1 : 0;

  const totalRoleSkills = rankBonus + levelBonus + negBonus + speciesBonus + weaknessBonus;

  // Used role skills count
  const usedRoleSkills = skills.filter(s =>
    s.source === 'roleSkill' ||
    s.isRoleSkill ||
    (s.category === 'rule' && s.source !== 'customization' && s.source !== 'negativeSkill' && s.source !== 'levelPassive' && s.source !== 'bossSkill')
  ).length;

  // Customization
  const usedCustomization = skills.filter(s => s.source === 'customization').length;

  // Boss Skills
  const maxBossSkills = rank === '冠位' ? (1 + (hasNegativeSkill ? 1 : 0)) : 0;
  const usedBossSkills = skills.filter(s => s.category === 'boss' || s.source === 'bossSkill').length;

  // Resistances and Immunities
  let maxRes = 0;
  let maxImm = 0;
  if (npc.role === '獵人') {
    if (lvl >= 50) maxRes = 2;
  } else {
    if (lvl >= 10) maxRes = 2;
    if (lvl >= 30) maxImm = 1;
  }

  const speciesAffs = getSpeciesAffinities(sid, npc.speciesConfig);
  let usedRes = 0;
  let usedImm = 0;
  let currentVul = 0;

  DAMAGE_TYPES.forEach(type => {
    const userAff = npc.affinities?.[type] || 'normal';
    const specAff = speciesAffs[type];

    if (userAff === 'res' && specAff !== 'res') usedRes++;
    if (userAff === 'imm' && specAff !== 'imm') usedImm++;
    if (userAff === 'vul') currentVul++;
  });

  const requiredVul = npc.role === '暴徒' ? 2 : 1;

  return {
    roleSkills: { max: totalRoleSkills, used: usedRoleSkills },
    customization: { max: 1, used: usedCustomization },
    bossSkills: { max: maxBossSkills, used: usedBossSkills },
    resistances: { max: maxRes, used: usedRes },
    immunities: { max: maxImm, used: usedImm },
    weaknesses: { min: requiredVul, current: currentVul }
  };
};

export const calculateNpcStats = (npc) => {
  if (!npc || !npc.role || !ROLES_DATA[npc.role]) return {};
  const roleData = ROLES_DATA[npc.role];
  const lvlData = roleData.levels[npc.level] || roleData.levels[5];

  const defaultDEX = lvlData.dex || roleData.base.DEX;
  const defaultINS = lvlData.ins || roleData.base.INS;
  const defaultMIG = lvlData.mig || roleData.base.MIG;
  const defaultWLP = lvlData.wlp || roleData.base.WLP;

  const customDice = npc.customDice || {};
  const isFree = npc.isFreeModeEnabled;

  const finalDEX = (isFree && customDice.DEX) ? customDice.DEX : defaultDEX;
  const finalINS = (isFree && customDice.INS) ? customDice.INS : defaultINS;
  const finalMIG = (isFree && customDice.MIG) ? customDice.MIG : defaultMIG;
  const finalWLP = (isFree && customDice.WLP) ? customDice.WLP : defaultWLP;

  const parseDice = d => parseInt(String(d).replace('d', ''), 10) || 8;
  const defMIGVal = parseDice(defaultMIG);
  const effMIGVal = parseDice(finalMIG);
  const defWLPVal = parseDice(defaultWLP);
  const effWLPVal = parseDice(finalWLP);
  const effDEXVal = parseDice(finalDEX);
  const effINSVal = parseDice(finalINS);

  let baseHP = lvlData.hp + (effMIGVal - defMIGVal) * 5;
  let baseMP = lvlData.mp + (effWLPVal - defWLPVal) * 5;

  let stats = {
    DEX: finalDEX,
    INS: finalINS,
    MIG: finalMIG,
    WLP: finalWLP,
    HP: baseHP,
    MP: baseMP,
    Init: roleData.base.initBase,
    Def: effDEXVal + roleData.base.def,
    MDef: effINSVal + roleData.base.mdef,
    Acc: lvlData.acc,
    Dmg: lvlData.dmg,
    MagicAccModifier: 0,
    statusImmunities: [],
    spellList: []
  };

  if (npc.rank === "精英") {
    stats.HP *= 2;
    stats.Init += 2;
  } else if (npc.rank === "冠位") {
    const mult = Math.max(1, parseInt(npc.championMultiplier) || 1);
    stats.HP *= mult;
    stats.MP *= 2;
    stats.Init += mult;
  }

  // Species adjustments
  if (npc.selectedSpeciesId) {
    const sid = npc.selectedSpeciesId;
    const sCfg = npc.speciesConfig || {};
    const sBenefits = sCfg.selectedBenefits || [];

    if (sid === 'sp_beast' && sBenefits.includes('b1')) stats.HP += 10;
    if (sid === 'sp_monster' && sBenefits.includes('b5')) stats.HP += 10;
    if (sid === 'sp_plant' && sBenefits.includes('b1')) stats.HP += 10;

    const mpBenefitIds = {
      sp_beast: ['b2'], sp_demon: ['b2'], sp_element: ['b2'],
      sp_humanoid: ['b2'], sp_monster: ['b2'], sp_plant: ['b3'], sp_undead: ['b2']
    };
    if (mpBenefitIds[sid]?.some(id => sBenefits.includes(id))) stats.MP += 10;

    if (sid === 'sp_plant') stats.statusImmunities.push('眩暈', '動搖', '憤怒');
    if (['sp_construct', 'sp_element', 'sp_undead'].includes(sid)) stats.statusImmunities.push('中毒');

    if (sid === 'sp_construct' && sBenefits.includes('b1')) {
      const chosen = sCfg.sp_construct_imm_status || [];
      chosen.forEach(s => {
        if (s && !stats.statusImmunities.includes(s)) stats.statusImmunities.push(s);
      });
    }
  }

  // Skills passive modifiers
  const skills = npc.skills || [];
  skills.forEach(skill => {
    if (skill.source === 'levelPassive') {
      if (skill.libId === "sab_p10" && skill.selections) {
        if (skill.selections.bonus === "命中檢定") stats.Acc += 3;
        if (skill.selections.bonus === "施法檢定") stats.MagicAccModifier += 3;
      }
      if (skill.libId === "hun_p10") stats.Acc += 3;
    }
    if (skill.modifiers) {
      if (skill.modifiers.hp) stats.HP += skill.modifiers.hp;
      if (skill.modifiers.mp) stats.MP += skill.modifiers.mp;
      if (skill.modifiers.def) stats.Def += skill.modifiers.def;
      if (skill.modifiers.mdef) stats.MDef += skill.modifiers.mdef;
      if (skill.modifiers.init) stats.Init += skill.modifiers.init;
      if (skill.modifiers.magicAcc) stats.MagicAccModifier += skill.modifiers.magicAcc;
    }
    if (skill.selectionsConfig && skill.selections) {
      skill.selectionsConfig.forEach(cfg => {
        const val = skill.selections[cfg.key];
        if (val && cfg.key.startsWith('imm') && !stats.statusImmunities.includes(val) && val !== "無") {
          stats.statusImmunities.push(val);
        }
      });
    }
  });

  if (npc.overrideEnabled && npc.overrides) {
    if (npc.overrides.hp) stats.HP = npc.overrides.hp;
    if (npc.overrides.mp) stats.MP = npc.overrides.mp;
    if (npc.overrides.init) stats.Init = npc.overrides.init;
    if (npc.overrides.def) stats.Def = npc.overrides.def;
    if (npc.overrides.mdef) stats.MDef = npc.overrides.mdef;
  }

  return stats;
};

export const createNewNPC = () => {
  let initialSkills = ROLES_DATA["暴徒"].defaultSkills.map(s => ({
    ...s,
    id: `${s.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    libId: s.id,
    isDefault: true
  }));
  initialSkills = syncLevelPassives("暴徒", 5, initialSkills);

  return {
    id: `npc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: "新創魔獸 / NPC",
    faction: "未分類",
    tags: ["野生魔獸"],
    traits: "兇猛、野性、敏銳",
    story: "",
    tactics: "優先攻擊落單或脆弱的敵人。",
    role: "暴徒",
    level: 5,
    rank: "士兵",
    championMultiplier: 1,
    partyLevel: 5,
    villainTier: "none",
    avatarBase64: null,
    avatarScale: 1,
    avatarFit: 'cover',
    avatarOffsetX: 0,
    avatarOffsetY: 0,
    skills: initialSkills,
    selectedSpeciesId: 'sp_beast',
    speciesConfig: { selectedBenefits: [] },
    overrideEnabled: false,
    overrides: { hp: 0, mp: 0, init: 0, def: 0, mdef: 0 },
    affinities: getInitialAffinities(),
    customDice: {},
    isFreeModeEnabled: false,
    updatedAt: new Date().toISOString()
  };
};

export const migrateNpcState = (npc) => {
  if (!npc) return createNewNPC();
  const migrated = { ...npc };
  if (!migrated.id) migrated.id = `npc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  if (!migrated.faction) migrated.faction = "未分類";
  if (!migrated.tags || !Array.isArray(migrated.tags)) migrated.tags = [];
  if (!migrated.affinities) migrated.affinities = getInitialAffinities();
  if (!migrated.customDice) migrated.customDice = {};
  if (!migrated.villainTier) migrated.villainTier = "none";

  if (migrated.role && migrated.skills && ROLES_DATA[migrated.role]) {
    migrated.skills = syncLevelPassives(migrated.role, migrated.level || 5, migrated.skills);
  }

  return migrated;
};

// Convert NPC to Combatant specification for Combat Room
export const exportNpcToCombatant = (npc) => {
  const stats = calculateNpcStats(npc);
  const maxHp = stats.HP || 50;
  const maxMp = stats.MP || 30;

  // Species-derived affinities merge
  const speciesAffs = getSpeciesAffinities(npc.selectedSpeciesId, npc.speciesConfig);
  const finalAffs = { ...npc.affinities, ...speciesAffs };

  return {
    instanceId: `comb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sourceId: npc.id,
    sourceType: 'npc',
    name: npc.name || 'NPC',
    avatar: npc.avatarBase64 || null,
    faction: npc.faction || '敵方',
    level: npc.level || 5,
    rank: npc.rank || '士兵',
    role: npc.role || '暴徒',
    species: npc.selectedSpeciesId ? (SPECIES_DATA.find(s => s.id === npc.selectedSpeciesId)?.name || '未知') : '無',
    hp: {
      current: maxHp,
      max: maxHp,
      crisisThreshold: Math.floor(maxHp / 2)
    },
    mp: {
      current: maxMp,
      max: maxMp
    },
    attributes: {
      dex: parseInt(String(stats.DEX).replace('d', '')) || 8,
      ins: parseInt(String(stats.INS).replace('d', '')) || 8,
      mig: parseInt(String(stats.MIG).replace('d', '')) || 8,
      wlp: parseInt(String(stats.WLP).replace('d', '')) || 8
    },
    defense: stats.Def || 8,
    magicDefense: stats.MDef || 8,
    initiative: stats.Init || 0,
    hasActed: false,
    statusEffects: {
      slow: false,
      dazed: false,
      weak: false,
      shaken: false,
      enraged: false,
      poisoned: false
    },
    statusImmunities: stats.statusImmunities || [],
    affinities: finalAffs,
    skills: (npc.skills || []).map(sk => ({
      id: sk.id,
      name: sk.name || sk.skillName || '招式',
      category: sk.category || 'attack',
      desc: sk.desc || sk.customDesc || '',
      isRevealed: false // GM can reveal skills step by step to players in combat!
    })),
    rawNpcData: npc
  };
};
