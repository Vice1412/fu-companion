import rulesData from '../data/rulesData.json';
import { SOURCEBOOKS } from '../data/sourcebookConfig';

// Dice ladder for step reductions
const DICE_STEPS = [6, 8, 10, 12];

export const reduceDieStep = (baseDie, steps = 1) => {
  const currentIdx = DICE_STEPS.indexOf(baseDie);
  if (currentIdx === -1) return Math.max(6, baseDie - steps * 2);
  const targetIdx = Math.max(0, currentIdx - steps);
  return DICE_STEPS[targetIdx];
};

/**
 * 建立全新角色卡預設結構
 */
export const createNewCharacter = (overrides = {}) => {
  return {
    id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: "新冒險者",
    identity: "",
    theme: "希望",
    origin: "",
    avatar: null,

    // 冒險等級與成長
    level: 5,
    exp: 0,
    zenit: 500,
    fabulaPoints: 3,

    // 啟用的手冊拓展 (預設僅核心)
    enabledSourcebooks: ['core'],

    // 四維屬性基礎骰階 (起始總和為 32)
    attributes: {
      dex: 8,
      ins: 8,
      mig: 8,
      wlp: 8
    },

    // 六大狀態異常 (Status Afflictions)
    statusAfflictions: {
      dazed: false,    // 眩暈: INS 降一階
      enraged: false,  // 憤怒: DEX & INS 降一階
      poisoned: false, // 中毒: MIG & WLP 降一階
      shaken: false,   // 動搖: WLP 降一階
      slow: false,     // 緩速: DEX 降一階
      weak: false      // 虛弱: MIG 降一階
    },

    // 職業與特技配置 (5 級起始分配至 2~3 個職業)
    classes: [
      {
        className: "守護者",
        level: 3,
        skills: [
          { name: "保護", sl: 2 },
          { name: "不動要塞", sl: 1 }
        ]
      },
      {
        className: "武器大師",
        level: 2,
        skills: [
          { name: "近戰武器掌握", sl: 1 },
          { name: "劍刃風暴", sl: 1 }
        ]
      }
    ],

    // 三維六向情感羈絆 (最多 6 個)
    bonds: [
      {
        id: `bond_${Date.now()}_1`,
        target: "同行冒險夥伴",
        feelings: ["admiration", "loyalty"]
      }
    ],

    // 武裝配置
    equipment: {
      mainHand: "青銅劍",
      offHand: "青銅圓盾",
      armor: "旅行皮甲",
      accessory: "守護護符"
    },

    // 已學會法術、英雄技能、金手指與個人筆記
    spells: [],
    heroicSkills: [],
    quirk: "無",
    backpackNotes: "",

    // 個人命刻 (Personal Clocks)
    clocks: [
      { id: 'c1', title: '個人誓約與命刻', totalSegments: 6, filledSegments: 0, theme: 'amber', type: 'circle' }
    ],

    // 即時動態資源 (null 代表等於最大值)
    currentHp: null,
    currentMp: null,
    currentIp: null,

    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

/**
 * 檢查角色擁有的軍用武裝熟練度
 */
export const getProficiencies = (char) => {
  const profs = {
    martialMelee: false,
    martialRanged: false,
    martialArmor: false,
    martialShields: false
  };

  (char.classes || []).forEach(cl => {
    const cName = cl.className || '';
    const classDef = rulesData.classes[cName];
    const fb = classDef?.freeBenefits || '';

    if (fb.includes('近戰') || ['武器大師', '暗黑之刃', '狂怒鬥士', '指揮官'].some(n => cName.includes(n))) profs.martialMelee = true;
    if (fb.includes('遠程') || ['神射手'].some(n => cName.includes(n))) profs.martialRanged = true;
    if (fb.includes('防具') || ['守護者', '暗黑之刃', '狂怒鬥士'].some(n => cName.includes(n))) profs.martialArmor = true;
    if (fb.includes('盾牌') || ['守護者', '武器大師', '神射手', '指揮官'].some(n => cName.includes(n))) profs.martialShields = true;
  });

  return profs;
};

/**
 * 完整計算角色各項衍生數值、狀態減值與裝備聯動
 */
export const calculateCharacterStats = (char) => {
  if (!char) return {};

  const level = Math.max(5, parseInt(char.level, 10) || 5);
  const baseDex = char.attributes?.dex || 8;
  const baseIns = char.attributes?.ins || 8;
  const baseMig = char.attributes?.mig || 8;
  const baseWlp = char.attributes?.wlp || 8;

  // 1. 計算六大異常狀態對屬性骰階的削減
  const aff = char.statusAfflictions || {};
  let dexPenalty = 0;
  let insPenalty = 0;
  let migPenalty = 0;
  let wlpPenalty = 0;

  if (aff.slow) dexPenalty += 1;
  if (aff.enraged) { dexPenalty += 1; insPenalty += 1; }
  if (aff.dazed) insPenalty += 1;
  if (aff.weak) migPenalty += 1;
  if (aff.poisoned) { migPenalty += 1; wlpPenalty += 1; }
  if (aff.shaken) wlpPenalty += 1;

  const currentDex = reduceDieStep(baseDex, dexPenalty);
  const currentIns = reduceDieStep(baseIns, insPenalty);
  const currentMig = reduceDieStep(baseMig, migPenalty);
  const currentWlp = reduceDieStep(baseWlp, wlpPenalty);

  // 2. 計算職業免費加成與技能常駐加成 (HP +5, MP +5, IP +2, 不動要塞, 集中)
  let bonusHp = 0;
  let bonusMp = 0;
  let bonusIp = 0;

  (char.classes || []).forEach(cl => {
    const classDef = rulesData.classes[cl.className];
    const fb = classDef?.freeBenefits || '';
    if (fb.includes('HP') && fb.includes('5')) bonusHp += 5;
    if (fb.includes('MP') && fb.includes('5')) bonusMp += 5;
    if (fb.includes('IP') && fb.includes('2')) bonusIp += 2;

    // 特技技能常駐衍生加成
    (cl.skills || []).forEach(sk => {
      if (sk.name === '不動要塞') {
        const isPlaytest = (cl.className || '').includes('Playtest');
        bonusHp += (sk.sl || 0) * (isPlaytest ? 5 : 3);
      }
      if (sk.name === '集中') {
        const isPlaytest = (cl.className || '').includes('Playtest');
        bonusMp += (sk.sl || 0) * (isPlaytest ? 5 : 3);
      }
    });
  });

  // 飾品特殊加成
  if (char.equipment?.accessory === '守護護符') bonusHp += 5;
  if (char.equipment?.accessory === '魔力寶戒') bonusMp += 5;
  if (char.equipment?.accessory === '工匠工具帶') bonusIp += 2;

  // 官方規則：最大 HP / MP 基礎計算採用 BASE 體魄與意志（不受異常狀態減骰影響）
  const maxHp = baseMig * 5 + level + bonusHp;
  const maxMp = baseWlp * 5 + level + bonusMp;
  const maxIp = 6 + bonusIp;
  const crisisThreshold = Math.floor(maxHp / 2);

  // 3. 裝備防禦與先攻計算
  const normName = (n) => (n || '').replace(/\s*\([^)]*\)/g, '').trim();
  const armorDef = rulesData.equipment.armors.find(a => a.name === char.equipment?.armor || a.name === normName(char.equipment?.armor)) || rulesData.equipment.armors[0];
  const shieldDef = rulesData.equipment.shields.find(s => s.name === char.equipment?.offHand || s.name === normName(char.equipment?.offHand)) || rulesData.equipment.shields[0];

  let def = currentDex;
  let mdef = currentIns;

  // 防具防禦公式 (輕甲使用當前敏捷，重甲使用固定數值)
  if (armorDef) {
    if (armorDef.defFormula === 'dex') def = currentDex;
    else if (armorDef.defFormula === 'dex+1') def = currentDex + 1;
    else if (armorDef.defFormula === 'dex+2') def = currentDex + 2;
    else if (!isNaN(parseInt(armorDef.defFormula, 10))) def = parseInt(armorDef.defFormula, 10);

    if (armorDef.mdefFormula === 'ins') mdef = currentIns;
    else if (armorDef.mdefFormula === 'ins+1') mdef = currentIns + 1;
    else if (armorDef.mdefFormula === 'ins+2') mdef = currentIns + 2;
    else if (!isNaN(parseInt(armorDef.mdefFormula, 10))) mdef = parseInt(armorDef.mdefFormula, 10);
  }

  // 盾牌防禦加值
  if (shieldDef) {
    def += shieldDef.defBonus || 0;
    mdef += shieldDef.mdefBonus || 0;
  }

  // 先攻修正
  let init = 0;
  if (armorDef?.initMod) init += armorDef.initMod;
  if (shieldDef?.initMod) init += shieldDef.initMod;
  if (char.equipment?.accessory === '風行長靴') init += 2;

  // 4. 熟練度比對
  const profs = getProficiencies(char);
  const isWearingMartialArmor = !isNaN(parseInt(armorDef?.defFormula, 10));
  const isWearingMartialShield = shieldDef && (shieldDef.cost >= 150 || shieldDef.name.includes('重型') || shieldDef.name.includes('塔盾') || shieldDef.name.includes('符文'));
  
  const armorWarning = isWearingMartialArmor && !profs.martialArmor;
  const shieldWarning = isWearingMartialShield && !profs.martialShields;

  // 5. 職業精通狀況 (Mastery: 單一職業達到 10 級)
  const masteredClasses = (char.classes || []).filter(cl => cl.level >= 10).map(cl => cl.className);
  const totalSkillLevels = (char.classes || []).reduce((sum, cl) => sum + (cl.skills || []).reduce((sSum, sk) => sSum + sk.sl, 0), 0);

  return {
    maxHp,
    maxMp,
    maxIp,
    crisisThreshold,
    def,
    mdef,
    init,
    baseDex,
    baseIns,
    baseMig,
    baseWlp,
    currentDex,
    currentIns,
    currentMig,
    currentWlp,
    dexPenalty,
    insPenalty,
    migPenalty,
    wlpPenalty,
    profs,
    armorWarning,
    shieldWarning,
    masteredClasses,
    totalSkillLevels,
    isLevelMatched: totalSkillLevels === level
  };
};

/**
 * 經驗值成長與升級邏輯 (10 EXP = 1 Level)
 */
export const canLevelUp = (char) => {
  return (char.exp || 0) >= 10 && (char.level || 5) < 50;
};

export const applyLevelUp = (char, { className, skillName, isNewClass = false }) => {
  if (!canLevelUp(char)) return char;

  const newLevel = (char.level || 5) + 1;
  const newExp = (char.exp || 0) - 10;
  let updatedClasses = JSON.parse(JSON.stringify(char.classes || []));

  if (isNewClass) {
    updatedClasses.push({
      className,
      level: 1,
      skills: [{ name: skillName, sl: 1 }]
    });
  } else {
    const targetClass = updatedClasses.find(c => c.className === className);
    if (targetClass) {
      targetClass.level += 1;
      const targetSkill = targetClass.skills.find(s => s.name === skillName);
      if (targetSkill) {
        targetSkill.sl += 1;
      } else {
        targetClass.skills.push({ name: skillName, sl: 1 });
      }
    }
  }

  // 升級連帶同步當前 HP 與 MP（若在滿值狀態）
  const oldStats = calculateCharacterStats(char);
  const curHp = char.currentHp ?? oldStats.maxHp;
  const curMp = char.currentMp ?? oldStats.maxMp;

  return {
    ...char,
    level: newLevel,
    exp: newExp,
    classes: updatedClasses,
    currentHp: curHp + 1,
    currentMp: curMp + 1,
    updatedAt: new Date().toISOString()
  };
};

/**
 * 創角完整度校驗器 (Validation Checklist)
 * 不阻斷操作，提供即時提醒與跳轉定位
 */
export const validateCharacter = (char) => {
  const warnings = [];
  const stats = calculateCharacterStats(char);

  // 步驟 1: 基礎身世
  if (!char.name || !char.name.trim()) {
    warnings.push({ step: 1, field: 'name', type: 'warning', message: '角色尚未填寫姓名' });
  }
  if (!char.identity || !char.identity.trim()) {
    warnings.push({ step: 1, field: 'identity', type: 'info', message: '尚未設定身份' });
  }
  if (!char.theme) {
    warnings.push({ step: 1, field: 'theme', type: 'info', message: '尚未選擇個人主題' });
  }
  if (!char.origin || !char.origin.trim()) {
    warnings.push({ step: 1, field: 'origin', type: 'info', message: '尚未填寫故鄉' });
  }

  // 步驟 2: 四維屬性 (起始總點數應為 32)
  const attrSum = (char.attributes?.dex || 0) + (char.attributes?.ins || 0) + (char.attributes?.mig || 0) + (char.attributes?.wlp || 0);
  if (attrSum !== 32) {
    warnings.push({
      step: 2,
      field: 'attributes',
      type: 'warning',
      message: `屬性骰階點數總和為 ${attrSum} (官方標準起始為 32)`
    });
  }

  // 步驟 3: 職業與特技 (5 級起始限制: 2~3 個職業)
  const classCount = (char.classes || []).length;
  if (char.level === 5) {
    if (classCount < 2) {
      warnings.push({ step: 3, field: 'classes', type: 'error', message: '起始 5 級必須選擇至少 2 個職業 (規則書規定：最少 2 個職業，不可純單職)' });
    } else if (classCount > 3) {
      warnings.push({ step: 3, field: 'classes', type: 'error', message: '起始 5 級不可選擇超過 3 個職業 (規則書規定：最多 3 個職業)' });
    }
  }

  if (stats.totalSkillLevels !== char.level) {
    warnings.push({
      step: 3,
      field: 'skills',
      type: 'warning',
      message: `技能點數總和 (${stats.totalSkillLevels}) 與角色等級 (${char.level}) 不符`
    });
  }

  // 步驟 4: 裝備與熟練度
  if (!char.equipment?.mainHand || char.equipment.mainHand === '無') {
    warnings.push({ step: 4, field: 'mainHand', type: 'info', message: '尚未裝備主手武器' });
  }
  if (stats.armorWarning) {
    warnings.push({ step: 4, field: 'armor', type: 'warning', message: '目前穿戴軍用重甲防具，但所選職業缺乏熟練度' });
  }
  if (stats.shieldWarning) {
    warnings.push({ step: 4, field: 'offHand', type: 'warning', message: '目前裝備軍用盾牌，但所選職業缺乏熟練度' });
  }

  // 步驟 5: 羈絆 (官方強烈建議起始至少 1 個)
  if (!char.bonds || char.bonds.length === 0) {
    warnings.push({ step: 5, field: 'bonds', type: 'warning', message: '尚未建立任何情感羈絆，建議至少建立 1 個' });
  }

  const errors = warnings.filter(w => w.type === 'error');
  const nonErrors = warnings.filter(w => w.type !== 'error');

  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    totalIssues: warnings.length
  };
};

/**
 * 導出至戰鬥輪次追蹤器 (CombatTracker)
 */
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
      current: char.currentIp !== undefined && char.currentIp !== null ? char.currentIp : stats.maxIp,
      max: stats.maxIp
    },
    fabulaPoints: char.fabulaPoints || 3,
    attributes: {
      dex: stats.currentDex,
      ins: stats.currentIns,
      mig: stats.currentMig,
      wlp: stats.currentWlp
    },
    defense: stats.def,
    magicDefense: stats.mdef,
    initiative: stats.init,
    hasActed: false,
    statusEffects: { ...char.statusAfflictions },
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
