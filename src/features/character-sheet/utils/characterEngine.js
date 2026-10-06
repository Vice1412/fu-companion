import rulesData from '../data/rulesData.json';
import { SOURCEBOOKS, STATUS_AFFLICTIONS } from '../data/sourcebookConfig';
import { getSkillSuboptionConfig, calculateSkillSuboptionMax } from '../data/skillSuboptionsData';
import { PILOT_ARMOR_MODULES } from '../data/pilotVehicleData';
import { DEFAULT_CREATION_RULES, resolveCreationRules } from '../data/creationRules';
import { appendLog, createLogEntry } from './characterLog';

// Dice ladder for step reductions
const DICE_STEPS = [6, 8, 10, 12];

export const reduceDieStep = (baseDie, steps = 1) => {
  const currentIdx = DICE_STEPS.indexOf(baseDie);
  if (currentIdx === -1) return Math.max(6, baseDie - steps * 2);
  const targetIdx = Math.max(0, currentIdx - steps);
  return DICE_STEPS[targetIdx];
};

/**
 * 判定職業免費增益是否為「最大 HP 或最大 MP」二選一。
 *
 * 為什麼不能只看有沒有一個「或」字：暗黑之刃【Playtest】的免費增益是
 * 「…獲得裝備職業近戰或遠程武器（二選一）和職業防具的能力。」——
 * 它的「或」指的是武器類別，HP 本身是固定 +5。只看「或」會把它誤判為 HP/MP 二選一，
 * 一旦玩家選了 MP 就會得到錯誤的數值。
 * 因此必須同時在句中看到 HP 與 MP 兩側（或英文的 maximum Hit/Mind Points 兩側）。
 */
export const isHpMpChoiceBenefit = (freeBenefitText = '') => (
  /最大\s*HP[^。；]{0,40}或[^。；]{0,40}最大\s*MP/.test(freeBenefitText) ||
  /最大\s*MP[^。；]{0,40}或[^。；]{0,40}最大\s*HP/.test(freeBenefitText) ||
  /maximum\s+(?:Hit|Mind)\s+Points[^.]{0,60}\bor\b[^.]{0,60}maximum\s+(?:Hit|Mind)\s+Points/i.test(freeBenefitText)
);

/**
 * 建立全新角色卡預設結構
 *
 * 起始等級、起始資金與開放的拓展都由**開卡規則**決定（見 `data/creationRules.js`），
 * 不再寫死在這裡——GM 自訂開局就是傳一份不同的規則進來。
 * `overrides` 仍為最上層覆寫，優先於規則。
 */
export const createNewCharacter = (overrides = {}, rules = DEFAULT_CREATION_RULES) => {
  const creation = resolveCreationRules(rules);
  const character = {
    id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: "新冒險者",
    identity: "",
    theme: "希望",
    origin: "",
    avatar: null,
    avatarRaw: null,

    // 冒險等級與成長（由開卡規則決定）
    level: creation.startingLevel,
    exp: 0,
    zenit: creation.startingZenit,
    fabulaPoints: 3,

    // 啟用的手冊拓展（由開卡規則決定；上限另由 allowedSourcebooks 把關）
    enabledSourcebooks: [...creation.defaultSourcebooks],

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
      slow: false,     // 緩慢: DEX 降一階
      weak: false      // 虛弱: MIG 降一階
    },

    // 職業與特技配置 (預設為空，起始需配置 2~3 個職業)
    classes: [],

    // 三維六向情感羈絆 (上限 6 個)。
    // 官方創角八步驟**不含羈絆**（原書 p.154），羈絆是在遊戲中的休息場景等時機建立（p.57）；
    // 「起始帶 1 條羈絆」是選用規則（p.220），本專案未開啟 —— 所以新角色從 0 條開始。
    bonds: [],

    // 武裝配置：開卡時兩手皆為徒手打擊、不穿防具 —— 預算 500z 全額留給玩家自己選購
    equipment: {
      mainHand: "徒手打擊",
      offHand: "徒手打擊",
      armor: "無裝甲 / 冒險服",
      accessory: ""
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

    // 創角定稿狀態（見下方 isCharacterLocked／lockCharacter）
    locked: false,
    lockedAt: null,

    updatedAt: new Date().toISOString(),
    ...overrides
  };

  // 成長履歷的第一筆：建卡。之後的每一次變更都由 loggableChange 追加。
  return appendLog(character, createLogEntry({
    kind: 'creation',
    title: `建立角色（${creation.startingLevel} 級起，起始資金 ${creation.startingZenit}z）`
  }));
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
    const fb = (classDef?.freeBenefits || '') + ' ' + (classDef?.freeBonus || '');

    if (fb.includes('近戰') || ['武器大師', '暗黑之刃', '狂怒鬥士', '指揮官'].some(n => cName.includes(n))) profs.martialMelee = true;
    if (fb.includes('遠程') || ['神射手', '指揮官', '機師'].some(n => cName.includes(n))) profs.martialRanged = true;
    if (fb.includes('防具') || ['守護者', '暗黑之刃', '狂怒鬥士'].some(n => cName.includes(n))) profs.martialArmor = true;
    if (fb.includes('盾牌') || ['守護者', '武器大師', '神射手', '指揮官'].some(n => cName.includes(n))) profs.martialShields = true;
  });

  return profs;
};

/**
 * 角色的等級 —— **單一讀取點**。
 *
 * 為什麼要有這個函式：角色資料裡的 `level` 是**玩家可以直接編輯的欄位**
 * （編輯器有一個 5～50 的數字框），所以它才是權威；每個職業另外各有一個等級，
 * 那是「這些等級怎麼分配」的結果。兩者本來應該相等（升級時一起 +1），
 * 但沒有東西在檢查，於是會**漂移**——同一張卡在卡片上顯示 Lv 5、在匯出的三頁表格上顯示 Lv 8。
 *
 * 處理方式是：**以玩家設定的等級為準**，並在 `validateCharacter` 用一則提醒
 * 把「職業等級總和對不上」講出來，而不是偷偷拿另一個數字蓋掉玩家的輸入。
 */
export const getCharacterLevel = (char) => (
  parseInt(char?.level, 10) || DEFAULT_CREATION_RULES.startingLevel
);

/**
 * 完整計算角色各項衍生數值、狀態減值與裝備聯動
 */
export const calculateCharacterStats = (char) => {
  if (!char) return {};

  // 等級最低就是開卡規則的起始等級（核心規則 p.157：角色從 5 級開始）。
  // 讀規則而不是寫死 5，是為了 GM 日後調整起始等級時，這裡會跟著走。
  const level = Math.max(
    DEFAULT_CREATION_RULES.startingLevel,
    getCharacterLevel(char)
  );
  const baseDex = char.attributes?.dex || 8;
  const baseIns = char.attributes?.ins || 8;
  const baseMig = char.attributes?.mig || 8;
  const baseWlp = char.attributes?.wlp || 8;

  // 1. 計算六大異常狀態對屬性骰階的削減
  // 減值一律由 STATUS_AFFLICTIONS.affectedStats 推導（單一資料來源），
  // 同時保留每一項減值的來源名稱，供數值構成公式逐項顯示。
  const aff = char.statusAfflictions || {};
  const affSources = { dex: [], ins: [], mig: [], wlp: [] };

  Object.keys(STATUS_AFFLICTIONS).forEach(key => {
    if (!aff[key]) return;
    (STATUS_AFFLICTIONS[key].affectedStats || []).forEach(attrKey => {
      if (affSources[attrKey]) affSources[attrKey].push(STATUS_AFFLICTIONS[key].name);
    });
  });

  const dexPenalty = affSources.dex.length;
  const insPenalty = affSources.ins.length;
  const migPenalty = affSources.mig.length;
  const wlpPenalty = affSources.wlp.length;

  const currentDex = reduceDieStep(baseDex, dexPenalty);
  const currentIns = reduceDieStep(baseIns, insPenalty);
  const currentMig = reduceDieStep(baseMig, migPenalty);
  const currentWlp = reduceDieStep(baseWlp, wlpPenalty);

  // 2. 計算職業免費加成、技能常駐加成、飾品、英雄技能與金手指 (HP, MP, IP)
  // 每一筆加成同時記錄來源（label / value / kind），供數值構成公式逐項顯示。
  let bonusHp = 0;
  let bonusMp = 0;
  let bonusIp = 0;
  const hpTerms = [];
  const mpTerms = [];
  const ipTerms = [];

  const addHp = (label, value, kind) => { if (value) { bonusHp += value; hpTerms.push({ label, value, kind }); } };
  const addMp = (label, value, kind) => { if (value) { bonusMp += value; mpTerms.push({ label, value, kind }); } };
  const addIp = (label, value, kind) => { if (value) { bonusIp += value; ipTerms.push({ label, value, kind }); } };

  // (1) 職業免費增益 (Free Benefits) 與職業常駐被動技能
  (char.classes || []).forEach(cl => {
    const classDef = rulesData.classes[cl.className];
    const fb = (classDef?.freeBenefits || '') + ' ' + (classDef?.freeBonus || '');
    const clsLabel = cl.className || '未知職業';

    // 二選一職業判定 (秘儀師【Playtest】、死靈術士、舞者、祈喚者、植物學家、卡牌大師)
    if (isHpMpChoiceBenefit(fb)) {
      // 未指定時預設以 HP+5 為主（避免兩者同時加 5 點導致多送點數）
      if (cl.chosenBenefit === 'MP') {
        addMp(`${clsLabel} 免費增益（MP）`, 5, 'class');
      } else {
        addHp(`${clsLabel} 免費增益（HP）`, 5, 'class');
      }
    } else {
      if (fb.includes('HP') && fb.includes('5')) addHp(`${clsLabel} 免費增益`, 5, 'class');
      if (fb.includes('MP') && fb.includes('5')) addMp(`${clsLabel} 免費增益`, 5, 'class');
    }
    if (fb.includes('IP') && fb.includes('2')) addIp(`${clsLabel} 免費增益`, 2, 'class');

    // 職業常駐被動技能衍生加成 (不動要塞, 集中)
    const step = clsLabel.includes('Playtest') ? 5 : 3;
    (cl.skills || []).forEach(sk => {
      const skName = sk.name || '';
      const sl = sk.sl || 0;
      if (skName.includes('不動要塞') || skName.toLowerCase().includes('fortress')) {
        addHp(`${clsLabel} ${skName} SL ${sl} × ${step}`, sl * step, 'skill');
      }
      if (skName.includes('集中') || skName.toLowerCase().includes('concentration')) {
        addMp(`${clsLabel} ${skName} SL ${sl} × ${step}`, sl * step, 'skill');
      }
    });
  });

  // (2) 飾品特殊加成 (支援自訂或括號名稱鬆散匹配)
  const accName = char.equipment?.accessory || '';
  if (accName.includes('守護護符')) addHp(`飾品 ${accName}`, 5, 'equip');
  if (accName.includes('魔力寶戒')) addMp(`飾品 ${accName}`, 5, 'equip');
  if (accName.includes('工匠工具帶')) addIp(`飾品 ${accName}`, 2, 'equip');

  // (3) 英雄技能常駐加成 (額外HP, 額外MP, 額外IP)
  (char.heroicSkills || []).forEach(hs => {
    const hName = typeof hs === 'string' ? hs : (hs?.name || '');
    if (hName.includes('額外HP') || hName.toLowerCase().includes('extra hp')) {
      addHp(`英雄技能 ${hName}`, level >= 40 ? 20 : 10, 'heroic');
    }
    if (hName.includes('額外MP') || hName.toLowerCase().includes('extra mp')) {
      addMp(`英雄技能 ${hName}`, level >= 40 ? 20 : 10, 'heroic');
    }
    if (hName.includes('額外IP') || hName.toLowerCase().includes('extra ip')) {
      addIp(`英雄技能 ${hName}`, 4, 'heroic');
    }
  });

  // (4) 金手指特定加成 (倖存者, 束縛你的約定)
  const quirkName = char.quirk || '';
  if (quirkName.includes('倖存者')) {
    addHp(`金手指 ${quirkName}`, 5, 'quirk');
    addMp(`金手指 ${quirkName}`, 5, 'quirk');
  }
  if (quirkName.includes('束縛你的約定')) {
    addHp(`金手指 ${quirkName}`, 5, 'quirk');
    addMp(`金手指 ${quirkName}`, 5, 'quirk');
  }

  // 官方規則：最大 HP / MP 基礎計算採用 BASE 體魄與意志（不受異常狀態減骰影響）
  const maxHp = baseMig * 5 + level + bonusHp;
  const maxMp = baseWlp * 5 + level + bonusMp;
  const maxIp = 6 + bonusIp;
  const crisisThreshold = Math.floor(maxHp / 2);

  // 3. 裝備防禦與先攻計算
  const normName = (n) => (n || '').replace(/\s*\([^)]*\)/g, '').trim();
  // 回退一律回**具名的中性條目**，不要回「資料表第一筆」——
  // 第一筆剛好是中性值只是運氣，哪天有人把新裝備插到最前面，
  // 所有沒穿防具的角色就會白拿那份加值，而且不會有任何警告。
  const NEUTRAL_ARMOR = '無裝甲 / 冒險服';
  const NEUTRAL_SHIELD = '無盾牌';
  const findByName = (list, name) => list.find((x) => x.name === name) || null;
  const armorDef = rulesData.equipment.armors.find(a => a.name === char.equipment?.armor || a.name === normName(char.equipment?.armor))
    || findByName(rulesData.equipment.armors, NEUTRAL_ARMOR);
  // 雙手武器佔滿兩個手部欄位（Core p.131）→ 副手裝備不生效，回退到中性條目（無盾牌）
  const mainHandDef = rulesData.equipment.weapons.find(w => w.name === char.equipment?.mainHand || w.name === normName(char.equipment?.mainHand));
  const offHandSuppressed = Number(mainHandDef?.hands) === 2;
  const shieldDef = offHandSuppressed
    ? findByName(rulesData.equipment.shields, NEUTRAL_SHIELD)
    : (rulesData.equipment.shields.find(s => s.name === char.equipment?.offHand || s.name === normName(char.equipment?.offHand))
      || findByName(rulesData.equipment.shields, NEUTRAL_SHIELD));

  let def = currentDex;
  let mdef = currentIns;
  const defTerms = [];
  const mdefTerms = [];
  const initTerms = [];

  // 顯示用的裝備名稱：優先採用角色實際填寫的字串，其次才是資料表名稱
  const armorLabel = char.equipment?.armor || armorDef?.name || '';
  const shieldLabel = char.equipment?.offHand || shieldDef?.name || '';

  // 防具防禦公式 (輕甲使用當前敏捷，重甲使用固定數值)
  if (armorDef) {
    if (armorDef.defFormula === 'dex') {
      def = currentDex;
      defTerms.push({ label: `當前敏捷 d${currentDex}`, value: currentDex, kind: 'base' });
    } else if (armorDef.defFormula === 'dex+1') {
      def = currentDex + 1;
      defTerms.push({ label: `當前敏捷 d${currentDex}`, value: currentDex, kind: 'base' });
      defTerms.push({ label: `${armorLabel} 敏捷 + 1`, value: 1, kind: 'equip' });
    } else if (armorDef.defFormula === 'dex+2') {
      def = currentDex + 2;
      defTerms.push({ label: `當前敏捷 d${currentDex}`, value: currentDex, kind: 'base' });
      defTerms.push({ label: `${armorLabel} 敏捷 + 2`, value: 2, kind: 'equip' });
    } else if (!isNaN(parseInt(armorDef.defFormula, 10))) {
      const fixedDef = parseInt(armorDef.defFormula, 10);
      def = fixedDef;
      defTerms.push({ label: `${armorLabel} 固定值 ${fixedDef}`, value: fixedDef, kind: 'equip' });
    }

    if (armorDef.mdefFormula === 'ins') {
      mdef = currentIns;
      mdefTerms.push({ label: `當前洞察 d${currentIns}`, value: currentIns, kind: 'base' });
    } else if (armorDef.mdefFormula === 'ins+1') {
      mdef = currentIns + 1;
      mdefTerms.push({ label: `當前洞察 d${currentIns}`, value: currentIns, kind: 'base' });
      mdefTerms.push({ label: `${armorLabel} 洞察 + 1`, value: 1, kind: 'equip' });
    } else if (armorDef.mdefFormula === 'ins+2') {
      mdef = currentIns + 2;
      mdefTerms.push({ label: `當前洞察 d${currentIns}`, value: currentIns, kind: 'base' });
      mdefTerms.push({ label: `${armorLabel} 洞察 + 2`, value: 2, kind: 'equip' });
    } else if (!isNaN(parseInt(armorDef.mdefFormula, 10))) {
      const fixedMdef = parseInt(armorDef.mdefFormula, 10);
      mdef = fixedMdef;
      mdefTerms.push({ label: `${armorLabel} 固定值 ${fixedMdef}`, value: fixedMdef, kind: 'equip' });
    }
  }

  // 資料缺漏或公式無法辨識時，仍以「當前屬性骰」作為基準項顯示
  if (defTerms.length === 0) defTerms.push({ label: `當前敏捷 d${currentDex}`, value: currentDex, kind: 'base' });
  if (mdefTerms.length === 0) mdefTerms.push({ label: `當前洞察 d${currentIns}`, value: currentIns, kind: 'base' });

  // 盾牌防禦加值
  if (shieldDef) {
    const shieldDefBonus = shieldDef.defBonus || 0;
    const shieldMdefBonus = shieldDef.mdefBonus || 0;
    def += shieldDefBonus;
    mdef += shieldMdefBonus;
    if (shieldDefBonus) defTerms.push({ label: `${shieldLabel} 物防 +${shieldDefBonus}`, value: shieldDefBonus, kind: 'equip' });
    if (shieldMdefBonus) mdefTerms.push({ label: `${shieldLabel} 魔防 +${shieldMdefBonus}`, value: shieldMdefBonus, kind: 'equip' });
  }

  // 機師載具搭乘防禦覆蓋 (Techno Fantasy Atlas p. 161)
  if (char.pilotVehicle?.isMounted) {
    const activeMods = char.pilotVehicle?.activeModules || [];
    const plating = PILOT_ARMOR_MODULES.find(m => activeMods.includes(m.id));
    if (plating) {
      defTerms.length = 0;
      mdefTerms.length = 0;
      if (plating.id === 'flexible_plating') {
        def = currentDex + 2;
        mdef = currentIns + 1;
        defTerms.push({ label: `當前敏捷 d${currentDex}`, value: currentDex, kind: 'base' });
        defTerms.push({ label: `載具 ${plating.name} + 2`, value: 2, kind: 'equip' });
        mdefTerms.push({ label: `當前洞察 d${currentIns}`, value: currentIns, kind: 'base' });
        mdefTerms.push({ label: `載具 ${plating.name} + 1`, value: 1, kind: 'equip' });
      } else {
        def = plating.def;
        mdef = plating.mdef;
        defTerms.push({ label: `載具 ${plating.name} 固定值 ${plating.def}`, value: plating.def, kind: 'equip' });
        mdefTerms.push({ label: `載具 ${plating.name} 固定值 ${plating.mdef}`, value: plating.mdef, kind: 'equip' });
      }
    }
    // 載具盾牌模組加值 (每個提供 DEF+2, M.DEF+2)
    const shieldModuleCount = activeMods.filter(id => id === 'shield_module').length;
    if (shieldModuleCount > 0) {
      def += shieldModuleCount * 2;
      mdef += shieldModuleCount * 2;
      defTerms.push({ label: `載具 盾牌模組 × ${shieldModuleCount}`, value: shieldModuleCount * 2, kind: 'equip' });
      mdefTerms.push({ label: `載具 盾牌模組 × ${shieldModuleCount}`, value: shieldModuleCount * 2, kind: 'equip' });
    }
  }

  // 先攻修正
  let init = 0;
  if (armorDef?.initMod) {
    init += armorDef.initMod;
    initTerms.push({ label: `${armorLabel} 先攻 ${armorDef.initMod > 0 ? '+' : ''}${armorDef.initMod}`, value: armorDef.initMod, kind: 'equip' });
  }
  if (shieldDef?.initMod) {
    init += shieldDef.initMod;
    initTerms.push({ label: `${shieldLabel} 先攻 ${shieldDef.initMod > 0 ? '+' : ''}${shieldDef.initMod}`, value: shieldDef.initMod, kind: 'equip' });
  }
  if (char.equipment?.accessory === '風行長靴') {
    init += 2;
    initTerms.push({ label: '飾品 風行長靴 先攻 +2', value: 2, kind: 'equip' });
  }

  // 4. 熟練度比對
  const profs = getProficiencies(char);
  const isWearingMartialArmor = !isNaN(parseInt(armorDef?.defFormula, 10));
  // 職業盾牌優先用資料表的 martial 旗標；名稱／價格的啟發式只留給自訂或匯入的字串
  const isWearingMartialShield = Boolean(shieldDef) && (
    shieldDef.martial === true || (!('martial' in shieldDef) && shieldDef.cost >= 150)
  );
  
  const armorWarning = isWearingMartialArmor && !profs.martialArmor;
  const shieldWarning = isWearingMartialShield && !profs.martialShields;

  // 5. 職業精通狀況 (Mastery: 單一職業達到 10 級)
  const masteredClasses = (char.classes || []).filter(cl => cl.level >= 10).map(cl => cl.className);
  const totalSkillLevels = (char.classes || []).reduce((sum, cl) => sum + (cl.skills || []).reduce((sSum, sk) => sSum + sk.sl, 0), 0);

  // 6. 數值構成公式（逐項分解，供角色卡／跑團卡點擊展開顯示）
  // 每一項為 { label, value, kind }；kind 供面板分色：
  // base 基礎骰 / level 等級 / class 職業免費增益 / skill 特技 / equip 裝備飾品 / heroic 英雄技能 / quirk 金手指 / status 狀態異常
  const attrBreakdown = (base, current, penalty, sources) => ({
    total: current,
    terms: [
      { label: `基礎骰 d${base}`, value: `d${base}`, kind: 'base' },
      ...(penalty > 0
        ? [{ label: `狀態 ${sources.join('、')} 降 ${penalty} 階`, value: `d${current}`, kind: 'status' }]
        : [])
    ]
  });

  const breakdown = {
    hp: {
      total: maxHp,
      terms: [
        { label: `基礎體魄 d${baseMig} × 5`, value: baseMig * 5, kind: 'base' },
        { label: `角色等級 Lv ${level}`, value: level, kind: 'level' },
        ...hpTerms
      ]
    },
    mp: {
      total: maxMp,
      terms: [
        { label: `基礎意志 d${baseWlp} × 5`, value: baseWlp * 5, kind: 'base' },
        { label: `角色等級 Lv ${level}`, value: level, kind: 'level' },
        ...mpTerms
      ]
    },
    ip: {
      total: maxIp,
      terms: [
        { label: '基礎值 6', value: 6, kind: 'base' },
        ...ipTerms
      ]
    },
    crisis: {
      total: crisisThreshold,
      terms: [
        { label: '最大生命值', value: maxHp, kind: 'base' },
        { label: '除以 2，向下取整', value: '÷ 2', kind: 'base' }
      ]
    },
    def: { total: def, terms: defTerms },
    mdef: { total: mdef, terms: mdefTerms },
    init: { total: init, terms: initTerms },
    attributes: {
      dex: attrBreakdown(baseDex, currentDex, dexPenalty, affSources.dex),
      ins: attrBreakdown(baseIns, currentIns, insPenalty, affSources.ins),
      mig: attrBreakdown(baseMig, currentMig, migPenalty, affSources.mig),
      wlp: attrBreakdown(baseWlp, currentWlp, wlpPenalty, affSources.wlp)
    }
  };

  return {
    maxHp,
    maxMp,
    maxIp,
    crisisThreshold,
    def,
    mdef,
    init,
    bonusHp,
    bonusMp,
    bonusIp,
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
    breakdown,
    isLevelMatched: totalSkillLevels === level
  };
};

/**
 * 經驗值成長與升級邏輯 (10 EXP = 1 Level)
 */
export const canLevelUp = (char) => {
  return (char.exp || 0) >= 10 && getCharacterLevel(char) < 50;
};

export const applyLevelUp = (char, { className, skillName, isNewClass = false }) => {
  if (!canLevelUp(char)) return char;

  let updatedClasses = JSON.parse(JSON.stringify(char.classes || []));

  if (isNewClass) {
    updatedClasses.push({
      className,
      level: 1,
      skills: [{ name: skillName, sl: 1 }]
    });
  } else {
    const targetClass = updatedClasses.find(c => c.className === className);
    // 找不到那個職業就**什麼都不要動**：EXP 不能被扣掉。
    // 原本的寫法是「扣 EXP、角色等級 +1」照樣執行，但職業與技能都沒動——
    // 結果是玩家少了 10 點經驗值、等級數字 +1，卻沒有學到任何東西（實測確認）。
    if (!targetClass) return char;
    targetClass.level += 1;
    const targetSkill = targetClass.skills.find(s => s.name === skillName);
    if (targetSkill) {
      targetSkill.sl += 1;
    } else {
      targetClass.skills.push({ name: skillName, sl: 1 });
    }
  }

  // 升級連帶同步當前 HP 與 MP（若在滿值狀態）
  const oldStats = calculateCharacterStats(char);
  const curHp = char.currentHp ?? oldStats.maxHp;
  const curMp = char.currentMp ?? oldStats.maxMp;

  const leveled = { ...char, classes: updatedClasses };
  return {
    ...leveled,
    // 等級與職業一起 +1（兩者本來就該同步；對不上時由 validateCharacter 提醒）
    level: getCharacterLevel(char) + 1,
    exp: (char.exp || 0) - 10,
    currentHp: curHp + 1,
    currentMp: curMp + 1,
    updatedAt: new Date().toISOString()
  };
};

/**
 * 創角完整度校驗器 (Validation Checklist)
 * 不阻斷操作，提供即時提醒與跳轉定位
 *
 * 驗證的「標準」來自開卡規則（`data/creationRules.js`）——
 * 預設是官方核心規則，GM 自訂開局時傳入不同的規則即可，
 * 不必改這支函式。訊息一律引用規則裡的數值，不寫死。
 */
export const validateCharacter = (char, rules = DEFAULT_CREATION_RULES) => {
  const creation = resolveCreationRules(rules);
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

  // 步驟 3 前置: 手冊拓展不得超出這一團開放的上限（GM 自訂開局）
  const booksOutOfRange = (char.enabledSourcebooks || [])
    .filter((key) => !creation.allowedSourcebooks.includes(key));
  if (booksOutOfRange.length > 0) {
    warnings.push({
      step: 3,
      field: 'enabledSourcebooks',
      type: 'error',
      message: `此團未開放：${booksOutOfRange.join('、')}，請在職業分頁關閉`
    });
  }

  // 步驟 2: 四維屬性（起始總點數由開卡規則決定）
  const attrSum = (char.attributes?.dex || 0) + (char.attributes?.ins || 0) + (char.attributes?.mig || 0) + (char.attributes?.wlp || 0);
  if (attrSum !== creation.attributeTotal) {
    warnings.push({
      step: 2,
      field: 'attributes',
      type: 'warning',
      message: `屬性骰階點數總和為 ${attrSum} (起始標準為 ${creation.attributeTotal})`
    });
  }

  // 步驟 3: 職業與特技（起始等級的職業數限制由開卡規則決定）
  const classCount = (char.classes || []).length;
  if (char.level === creation.startingLevel) {
    if (classCount === 0) {
      warnings.push({
        step: 3,
        field: 'classes',
        type: 'error',
        message: `尚未選擇任何職業 (起始 ${creation.startingLevel} 級需配置 ${creation.classCountMin}~${creation.classCountMax} 個職業)`
      });
    } else if (classCount < creation.classCountMin) {
      warnings.push({
        step: 3,
        field: 'classes',
        type: 'error',
        message: `起始需至少 ${creation.classCountMin} 個職業，目前只有 ${classCount} 個 (不可純單職)`
      });
    } else if (classCount > creation.classCountMax) {
      warnings.push({
        step: 3,
        field: 'classes',
        type: 'error',
        message: `起始不可超過 ${creation.classCountMax} 個職業，目前有 ${classCount} 個`
      });
    }

    // GM 指定的必修職業（開卡規則 requiredClasses）
    const missingRequired = creation.requiredClasses
      .filter((name) => !(char.classes || []).some((cl) => cl.className === name));
    if (missingRequired.length > 0) {
      warnings.push({
        step: 3,
        field: 'classes',
        type: 'error',
        message: `此團規定必須修習：${missingRequired.join('、')}`
      });
    }
  }

  // 職業等級總和應該等於角色等級（升級時兩者一起 +1）。對不上就是**漂移**——
  // 以前沒有任何地方檢查這件事，於是同一張卡在卡片上顯示 Lv 5、在三頁表格上顯示 Lv 8。
  const classLevelSum = (char.classes || []).reduce((sum, cl) => sum + (parseInt(cl.level, 10) || 0), 0);
  if (classCount > 0 && classLevelSum !== getCharacterLevel(char)) {
    warnings.push({
      step: 3,
      field: 'classes',
      type: 'warning',
      message: `職業等級總和為 ${classLevelSum}，與角色等級 ${getCharacterLevel(char)} 不一致`
    });
  }

  if (stats.totalSkillLevels !== char.level) {
    warnings.push({
      step: 3,
      field: 'skills',
      type: 'warning',
      message: `技能點數總和 (${stats.totalSkillLevels}) 與角色等級 (${char.level}) 不符`
    });
  }

  // 步驟 3: 特技子項目配額檢驗 (如舞步、音調曲風、心靈天賦、魔法種子等)
  (char.classes || []).forEach(cl => {
    (cl.skills || []).forEach(sk => {
      if (sk.sl > 0) {
        const subConfig = getSkillSuboptionConfig(cl.className, sk.name);
        if (subConfig) {
          const maxQuota = calculateSkillSuboptionMax(cl.className, sk.name, sk.sl);
          let currentCount = 0;
          if (Array.isArray(sk.selectedOptions)) {
            currentCount = sk.selectedOptions.length;
          } else if (sk.selectedOptions && typeof sk.selectedOptions === 'object') {
            currentCount = (sk.selectedOptions.keys || []).length + (sk.selectedOptions.tones || []).length;
          }
          if (currentCount < maxQuota) {
            warnings.push({
              step: 3,
              field: `skill_suboptions_${cl.className}_${sk.name}`,
              type: 'warning',
              message: `【${cl.className}】的【${sk.name}】名額未滿：目前已配置 ${currentCount} 個，尚有 ${maxQuota - currentCount} 個名額可供選擇。請前往特技分頁完成構築。`
            });
          } else if (currentCount > maxQuota) {
            warnings.push({
              step: 3,
              field: `skill_suboptions_${cl.className}_${sk.name}`,
              type: 'warning',
              message: `【${cl.className}】的【${sk.name}】超出配額：目前已配置 ${currentCount} 個，上限為 ${maxQuota} 個。請刪減 ${currentCount - maxQuota} 個選項。`
            });
          }
        }
      }
    });
  });

  // 步驟 4: 裝備與熟練度
  if (!char.equipment?.mainHand || char.equipment.mainHand === '無') {
    warnings.push({ step: 4, field: 'mainHand', type: 'info', message: '尚未裝備主手武器' });
  }
  if (stats.armorWarning) {
    warnings.push({ step: 4, field: 'armor', type: 'warning', message: '目前穿戴職業防具，但所選職業缺乏熟練度' });
  }
  if (stats.shieldWarning) {
    warnings.push({ step: 4, field: 'offHand', type: 'warning', message: '目前裝備職業盾牌，但所選職業缺乏熟練度' });
  }

  // 步驟 5: 特質與金手指（是否開放由開卡規則決定）
  //
  // 註：羈絆**不在創角驗證範圍內**。原書的創角八步驟沒有羈絆（p.154），
  // 羈絆是遊戲中於休息場景建立的（p.57），「起始帶 1 條羈絆」只是選用規則（p.220）。
  // 以前這裡會產生「建議至少建立 1 個」的警告，那是沒有官方來源的杜撰。
  if (!creation.allowQuirk && char.quirk && char.quirk !== '無') {
    warnings.push({
      step: 5,
      field: 'quirk',
      type: 'error',
      message: `此團未開放金手指，請移除「${char.quirk}」`
    });
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
 * 創角定稿 (Lock)
 *
 * 使用者對這張卡的描述是「開好角色後，就基本是固定好了」——但在這之前，
 * 程式裡沒有任何狀態表達那件事：編輯器任何時候都全開，於是 UI 不敢簡化，
 * 玩家也分不清自己「還在創角」還是「已經在跑」。
 *
 * `locked` 就是那個狀態。定稿後，創角時做的決定（身世、四維）凍結，
 * 只留成長相關的欄位（等級、技能點、裝備、命刻、筆記）可以動。
 * （羈絆也是成長的一部分，但它不屬創角、編輯器也沒有這一格——於跑團面板管理，見 `CREATION_STEPS`。）
 * **舊存檔沒有這個欄位 → 一律視為未定稿**，行為與以前完全相同。
 */
export const isCharacterLocked = (char) => char?.locked === true;

/** 定稿後凍結的分頁（對應 CharacterEditor 的分頁 id：1 基礎身世、2 四維屬性） */
export const LOCKED_CREATION_TABS = Object.freeze([1, 2]);

/** 定稿：留下 `locked` 旗標與一筆履歷 */
export const lockCharacter = (char, { at, note = '' } = {}) => {
  const ts = at || new Date().toISOString();
  return appendLog(
    { ...char, locked: true, lockedAt: ts },
    createLogEntry({ kind: 'lock', title: '角色定稿', note, at: ts })
  );
};

/** 解除定稿：重新開放創角欄位（同樣留下一筆履歷，所以「什麼時候解鎖過」查得到） */
export const unlockCharacter = (char, { at, note = '' } = {}) => {
  const ts = at || new Date().toISOString();
  return appendLog(
    { ...char, locked: false, lockedAt: null },
    createLogEntry({ kind: 'lock', title: '解除定稿（重新開放創角欄位）', note, at: ts })
  );
};

/** 創角步驟（與 validateCharacter 的 step 編號一一對應）
 *
 * 為什麼沒有「情感羈絆」這一格：原書的創角流程是八個步驟（Identity／Theme／Origin／
 * 職業與等級／四維／HP·MP·IP·DEF·M.DEF·先攻／裝備 500z／名字），**沒有羈絆**（p.154）；
 * 羈絆是遊戲中透過休息場景等時機建立的（p.57），而「起始帶 1 條羈絆」是選用規則（p.220）。
 * 舊版把它列為創角第 5 步並在驗證時催填，屬無官方來源的杜撰。
 */
export const CREATION_STEPS = Object.freeze([
  { id: 1, label: '基礎身世', doneHint: '姓名、身分、主題、故鄉都已填寫' },
  { id: 2, label: '四維屬性', doneHint: '骰階點數已分配完成' },
  { id: 3, label: '職業與技能', doneHint: '職業組合與技能點數已配置' },
  { id: 4, label: '裝備配置', doneHint: '武裝與防具已就緒' },
  { id: 5, label: '特質與命刻', doneHint: '特質與命刻已確認' }
]);

/**
 * 創角進度清單：把 `validateCharacter` 的結果整理成一條主線。
 *
 * 以前「還缺什麼」只是一顆小紅點加一個 modal——玩家得自己找。
 * 這裡**不新增任何驗證邏輯**，只把同一份結果按步驟分成
 * 「已完成（done）／待處理（todo）／有問題（error）」，讓導航列本身就是進度表。
 */
export const buildCreationChecklist = (char, rules = DEFAULT_CREATION_RULES) => {
  const validation = validateCharacter(char, rules);
  return CREATION_STEPS.map((step) => {
    const issues = validation.warnings.filter((w) => w.step === step.id);
    const errorCount = issues.filter((w) => w.type === 'error').length;
    return {
      ...step,
      status: errorCount > 0 ? 'error' : (issues.length > 0 ? 'todo' : 'done'),
      errorCount,
      issueCount: issues.length,
      message: issues.length > 0 ? issues[0].message : step.doneHint
    };
  });
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
    level: getCharacterLevel(char),
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
    fabulaPoints: char.fabulaPoints ?? 3,
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
