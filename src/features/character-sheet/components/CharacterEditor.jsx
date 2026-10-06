import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  SlidersHorizontal,
  Play,
  Check
} from 'lucide-react';
import {
  GiSparkles,
  GiPadlock,
  GiCrossedSwords,
  GiBroadsword,
  GiShield,
  GiHeartPlus,
  GiPocketWatch,
  GiSpellBook,
  GiHazardSign,
  GiCheckMark,
  GiQuillInk,
  GiCoins,
  GiRollingDices,
  GiLaurelCrown,
  GiScrollUnfurled,
  GiPalette,
  GiRoundShield,
  GiCrystalBall
} from 'react-icons/gi';
import GameIcon from '../../../components/ui/GameIcon';
import JRPGButton from '../../../components/ui/JRPGButton';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import { JRPGInput } from '../../../components/ui/JRPGInput';
import StatBadge from '../../../components/ui/StatBadge';
import JRPGModal from '../../../components/ui/JRPGModal';
import { renderTextWithAffinities } from '../../../components/ui/FUIcon';
import CharacterCard from './CharacterCard';
import IdentityTablesModal from './IdentityTablesModal';
import AttributeMatrixPicker from './AttributeMatrixPicker';
import ClassSkillCard from './ClassSkillCard';
import ClassPickerModal from './ClassPickerModal';
import EquipmentPickerModal from './EquipmentPickerModal';
import EquipmentSlotCard from './EquipmentSlotCard';
import rulesData from '../data/rulesData.json';
import { DEFAULT_CREATION_RULES, resolveCreationRules } from '../data/creationRules';
import { loggableChange, formatLogTime } from '../utils/characterLog';
import CharacterAvatarUploader from './CharacterAvatarUploader';
import { getCharacterTheme, CHARACTER_THEMES } from '../utils/characterThemes';
import {
  SOURCEBOOKS,
  BOND_FEELINGS,
  CANONICAL_THEMES,
  ATTRIBUTE_STARTING_ARRAYS,
  generateRandomIdentity,
  getClassInfo
} from '../data/sourcebookConfig';
import StarterPresetsModal from './StarterPresetsModal';
import { applyPreset } from '../utils/presetApply';
import {
  calculateCharacterStats,
  validateCharacter,
  isCharacterLocked,
  lockCharacter,
  unlockCharacter,
  buildCreationChecklist,
  LOCKED_CREATION_TABS
} from '../utils/characterEngine';
import {
  EQUIPMENT_SLOTS,
  diceFromStats,
  evaluateWeapon,
  computeArmorOutcome,
  computeShieldOutcome,
  checkEquippable,
  buildLoadoutIssues,
  getEquipmentIcon,
  getDualShieldState,
  applyEquipmentChoice,
  isTwoHanded
} from '../utils/equipmentRules';
import ErrorBoundary from '../../../components/ui/ErrorBoundary';
import { withEn } from '../../../utils/properNouns';

export default function CharacterEditor({
  character,
  themeId = null,
  onSelectGlobalTheme = null,
  onChange,
  onBackToRoster,
  onEnterPlayMode = null,
  showToast = null,
  // 開卡規則：預設為官方核心規則；GM 自訂開局時由上游傳入該團的規則
  // （見 data/creationRules.js——起始等級、起始資金、必修職業、開放拓展都由此決定）
  creationRules = DEFAULT_CREATION_RULES
}) {
  const [activeTab, setActiveTab] = useState(1);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isCardPreviewModalOpen, setIsCardPreviewModalOpen] = useState(false);
  const [isCustomTheme, setIsCustomTheme] = useState(() => !CANONICAL_THEMES.includes(character?.theme) && Boolean(character?.theme));
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);
  const [newlyAddedClassName, setNewlyAddedClassName] = useState(null);
  const [selectedHeroicToAdd, setSelectedHeroicToAdd] = useState('');
  // 目前開啟中的裝備選擇欄位（null = 未開啟）
  const [pickerSlot, setPickerSlot] = useState(null);

  if (!character) return null;

  const theme = getCharacterTheme(character.themeColor || themeId);

  // 開卡規則（起始等級／起始資金／必修職業／開放拓展…）
  const rules = resolveCreationRules(creationRules);

  // Validation checklist（以這一團的規則驗證，不是寫死的官方標準）
  const validation = validateCharacter(character, rules);
  const stats = calculateCharacterStats(character);

  // 創角進度：同一份驗證結果按步驟整理成主線（導航列本身就是進度表）
  const checklist = buildCreationChecklist(character, rules);
  const checklistById = new Map(checklist.map((item) => [item.id, item]));
  const blockedCount = checklist.filter((item) => item.status === 'error').length;
  const canLock = blockedCount === 0;

  // 定稿狀態：創角欄位凍結，只留成長相關的欄位可以動
  const locked = isCharacterLocked(character);
  const frozenTab = locked && LOCKED_CREATION_TABS.includes(activeTab);

  const handleLock = () => {
    onChange(lockCharacter(character));
    if (showToast) showToast('已定稿——創角欄位凍結，成長仍可繼續');
  };

  const handleUnlock = () => {
    if (typeof window !== 'undefined' && !window.confirm('解除定稿會重新開放身世與四維屬性，確定嗎？')) return;
    onChange(unlockCharacter(character));
    if (showToast) showToast('已解除定稿——創角欄位重新開放');
  };

  /**
   * 所有欄位變更的唯一出口。
   * `meta` 有值時會留下一筆成長履歷（見 utils/characterLog.js）；
   * `fields: []` 表示「只留標題、不比對欄位」（用於職業／技能這類陣列變更）。
   */
  const updateField = (field, value, meta = null) => {
    const base = {
      ...character,
      [field]: value,
      updatedAt: new Date().toISOString()
    };
    onChange(meta ? loggableChange(character, base, { fields: [field], ...meta }) : base);
  };

  const updateAttribute = (attr, val) => {
    onChange({
      ...character,
      attributes: {
        ...(character.attributes || {}),
        [attr]: val
      },
      updatedAt: new Date().toISOString()
    });
  };

  const toggleSourcebook = (sbKey) => {
    const cur = character.enabledSourcebooks ?? rules.defaultSourcebooks;
    const exists = cur.includes(sbKey);
    // 超出這一團開放的上限時直接拒絕（GM 自訂開局）
    if (!exists && !rules.allowedSourcebooks.includes(sbKey)) {
      if (showToast) showToast(`此團未開放《${SOURCEBOOKS[sbKey]?.name || sbKey}》`);
      return;
    }
    const updated = exists ? cur.filter(k => k !== sbKey) : [...cur, sbKey];
    updateField('enabledSourcebooks', updated);
  };

  // Filter available classes according to enabled sourcebooks
  const enabledBooks = character.enabledSourcebooks ?? rules.defaultSourcebooks;
  const availableClassNames = [
    ...new Set(
      Object.keys(SOURCEBOOKS)
        .filter(sbKey => enabledBooks.includes(sbKey))
        .flatMap(sbKey => SOURCEBOOKS[sbKey].classes)
        .filter(cName => rulesData.classes[cName])
    )
  ];

  // Class & Skill handlers
  const handleSelectClassFromPicker = (cName, selectedSkills = []) => {
    if (!cName || !rulesData.classes[cName]) return;
    const curClasses = character.classes || [];
    if (curClasses.some(c => c.className === cName)) return;

    const activeSkills = (selectedSkills || []).filter(s => s.sl > 0);
    const totalLevel = activeSkills.reduce((sum, s) => sum + s.sl, 0);

    updateField('classes', [
      ...curClasses,
      {
        className: cName,
        level: totalLevel,
        skills: activeSkills
      }
    ], {
      kind: 'skill',
      title: `修習【${cName}】（投入 ${totalLevel} 級${activeSkills.length ? `：${activeSkills.map(s => `${s.name} ${s.sl}`).join('、')}` : ''}）`,
      fields: []
    });
    setNewlyAddedClassName(null);
  };

  // 免費增益二選一（最大 HP 或 最大 MP）：寫入 classes[].chosenBenefit，引擎據此決定 +5 落在 HP 還是 MP
  const handleUpdateClassBenefit = (classIdx, benefit) => {
    const curClasses = JSON.parse(JSON.stringify(character.classes || []));
    if (!curClasses[classIdx]) return;
    curClasses[classIdx].chosenBenefit = benefit;
    updateField('classes', curClasses, {
      kind: 'skill',
      title: `【${curClasses[classIdx].className}】免費增益改為 ${benefit === 'mp' ? '最大 MP +5' : '最大 HP +5'}`,
      fields: []
    });
  };

  const handleUpdateClassSkills = (classIdx, updatedSkills) => {
    const curClasses = JSON.parse(JSON.stringify(character.classes || []));
    if (!curClasses[classIdx]) return;
    const beforeSkills = (character.classes || [])[classIdx]?.skills || [];
    curClasses[classIdx].skills = updatedSkills;
    curClasses[classIdx].level = updatedSkills.reduce((sum, s) => sum + s.sl, 0);

    // 同步特技中所選的咒語至 character.spells
    const allKnownSpellNames = new Set();
    curClasses.forEach(cl => {
      (cl.skills || []).forEach(sk => {
        if (['元素魔法', '靈魂魔法', '熵系魔法'].includes(sk.name) && Array.isArray(sk.selectedOptions)) {
          sk.selectedOptions.forEach(spName => allKnownSpellNames.add(spName));
        }
      });
    });

    const currentSpells = character.spells || [];
    // 保留非三大核心學派的法術（如自訂或其它來源）
    const nonCoreSpells = currentSpells.filter(sp => !['元素', '靈魂', '熵系'].includes(sp.school));
    const newClassSpells = Array.from(allKnownSpellNames).map(spName => {
      const found = (rulesData.spells || []).find(s => s.name === spName);
      return found ? { ...found } : { name: spName };
    });

    const className = curClasses[classIdx].className;
    // 逐技能比對 SL，記錄「升級後把點數加在哪一個技能上」
    const skillChanges = updatedSkills
      .map(sk => ({
        field: `skill:${sk.name}`,
        from: beforeSkills.find(b => b.name === sk.name)?.sl ?? 0,
        to: sk.sl
      }))
      .filter(c => c.from !== c.to);

    onChange(loggableChange(character, {
      ...character,
      classes: curClasses,
      spells: [...nonCoreSpells, ...newClassSpells],
      updatedAt: new Date().toISOString()
    }, {
      kind: 'skill',
      title: `調整【${className}】的技能`,
      changes: skillChanges
    }));
  };

  const handleRemoveClass = (classNameToRemove) => {
    const remainingClasses = (character.classes || []).filter(c => c.className !== classNameToRemove);
    const allKnownSpellNames = new Set();
    remainingClasses.forEach(cl => {
      (cl.skills || []).forEach(sk => {
        if (['元素魔法', '靈魂魔法', '熵系魔法'].includes(sk.name) && Array.isArray(sk.selectedOptions)) {
          sk.selectedOptions.forEach(spName => allKnownSpellNames.add(spName));
        }
      });
    });

    const currentSpells = character.spells || [];
    const nonCoreSpells = currentSpells.filter(sp => !['元素', '靈魂', '熵系'].includes(sp.school));
    const newClassSpells = Array.from(allKnownSpellNames).map(spName => {
      const found = (rulesData.spells || []).find(s => s.name === spName);
      return found ? { ...found } : { name: spName };
    });

    onChange(loggableChange(character, {
      ...character,
      classes: remainingClasses,
      spells: [...nonCoreSpells, ...newClassSpells],
      updatedAt: new Date().toISOString()
    }, {
      kind: 'skill',
      title: `移除職業【${classNameToRemove}】`,
      fields: []
    }));
    if (newlyAddedClassName === classNameToRemove) {
      setNewlyAddedClassName(null);
    }
  };

  // Bond Handlers
  const handleAddBond = () => {
    const curBonds = character.bonds || [];
    if (curBonds.length >= 6) return;
    const newBond = {
      id: `bond_${Date.now()}`,
      target: '未命名的同伴或對象',
      feelings: ['admiration']
    };
    updateField('bonds', [...curBonds, newBond]);
  };

  const handleUpdateBondTarget = (bondIdx, target) => {
    const curBonds = JSON.parse(JSON.stringify(character.bonds || []));
    curBonds[bondIdx].target = target;
    updateField('bonds', curBonds);
  };

  const handleToggleBondFeeling = (bondIdx, feelingId, category) => {
    const curBonds = JSON.parse(JSON.stringify(character.bonds || []));
    const bond = curBonds[bondIdx];
    const pair = BOND_FEELINGS.find(p => p.category === category);
    const pairOptions = pair ? pair.options.map(o => o.id) : [];

    const isCurrentActive = bond.feelings.includes(feelingId);

    if (isCurrentActive) {
      // Toggle off
      bond.feelings = bond.feelings.filter(f => f !== feelingId);
    } else {
      // Toggle on, remove conflicting feeling in same pair
      bond.feelings = bond.feelings.filter(f => !pairOptions.includes(f));
      bond.feelings.push(feelingId);
    }

    updateField('bonds', curBonds);
  };

  const handleRemoveBond = (bondIdx) => {
    const curBonds = (character.bonds || []).filter((_, idx) => idx !== bondIdx);
    updateField('bonds', curBonds);
  };

  // Apply Starter Preset
  // 官方經典職業搭配只提供官方欄位（屬性／職業技能／裝備／資金／金手指）；
  // 身分、主題、出身、羈絆屬玩家自訂，套用時一律保留現值不動。
  // 技能子選擇（咒語／舞步／音調曲風／天賦／混合形態／魔法種子／徽記）內嵌在
  // `classes[].skills[].selectedOptions`，隨 `classes` 深拷貝一併帶入。
  // 純邏輯抽在 `utils/presetApply.js`，以便測試覆蓋。
  const handleApplyPreset = (preset) => {
    onChange(applyPreset(character, preset));
    setIsPresetsModalOpen(false);
  };

  // Clocks
  const handleAddClock = () => {
    const newClock = {
      id: `clk_${Date.now()}`,
      title: '新個人誓約命刻',
      totalSegments: 6,
      filledSegments: 0,
      theme: 'amber',
      type: 'circle'
    };
    updateField('clocks', [...(character.clocks || []), newClock]);
  };

  const handleRemoveClock = (clkId) => {
    updateField('clocks', (character.clocks || []).filter(c => c.id !== clkId));
  };

  const TABS = [
    { id: 1, label: '基礎身世', icon: 'edit' },
    { id: 2, label: '四維屬性', icon: 'dice' },
    { id: 3, label: '職業與技能', icon: 'swords' },
    { id: 4, label: '裝備配置', icon: 'shield' },
    { id: 5, label: '情感羈絆', icon: 'hp' },
    { id: 6, label: '特質與命刻', icon: 'clock' }
  ];

  // Attribute sum
  const attrSum = (character.attributes?.dex || 0) + (character.attributes?.ins || 0) + (character.attributes?.mig || 0) + (character.attributes?.wlp || 0);

  // Equipment costs & 500 Zenit Starting Budget (Rulebook p. 166)
  const curMainHand = rulesData.equipment.weapons.find(w => w.name === character.equipment?.mainHand);
  const curOffHand = rulesData.equipment.shields.find(s => s.name === character.equipment?.offHand)
    || rulesData.equipment.weapons.find(w => w.name === character.equipment?.offHand);
  const curArmor = rulesData.equipment.armors.find(a => a.name === character.equipment?.armor);
  const curAcc = rulesData.equipment.accessories.find(acc => acc.name === character.equipment?.accessory);
  const totalEquipCost = (curMainHand?.cost || 0) + (curOffHand?.cost || 0) + (curArmor?.cost || 0) + (curAcc?.cost || 0);
  const remainingBudget = rules.startingZenit - totalEquipCost;

  const handleRollStartingZenit = () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const rollSum = (d1 + d2) * 10;
    const finalZenit = Math.max(0, remainingBudget) + rollSum;
    updateField('zenit', finalZenit, { kind: 'zenit', title: '擲起始資金 2d6 × 10' });
    alert(`[2d6 擲骰] [${d1}] + [${d2}] = ${d1 + d2} (× 10 = ${rollSum}z)！\n加上剩餘裝備預算 ${Math.max(0, remainingBudget)}z，角色的起始儲蓄已結算為 ${finalZenit} 澤尼特！`);
  };

  // ── 裝備配置：所有顯示數字都以「目前這張卡的四維骰」即時換算。
  // 換算規則集中在 utils/equipmentRules.js，選裝彈窗與這裡共用同一份實作，
  // 避免「選單上算一套、角色卡上算另一套」。
  const equipDice = diceFromStats(stats);
  const weaponByName = new Map(rulesData.equipment.weapons.map(w => [w.name, w]));
  const armorByName = new Map(rulesData.equipment.armors.map(a => [a.name, a]));
  const shieldByName = new Map(rulesData.equipment.shields.map(s => [s.name, s]));
  const accessoryByName = new Map(rulesData.equipment.accessories.map(a => [a.name, a]));

  const mainHandName = character.equipment?.mainHand || '';
  const mainShield = shieldByName.get(mainHandName) || null;
  // 空手＝原書 p.130 的徒手打擊：空格的手部欄位自動視為裝備它
  const mainWeapon = mainShield
    ? null
    : (weaponByName.get(mainHandName) || (mainHandName ? null : weaponByName.get('徒手打擊')));

  const offHandName = character.equipment?.offHand || '';
  const offShield = shieldByName.get(offHandName) || null;
  const offWeapon = offShield ? null : (weaponByName.get(offHandName) || null);
  const offWeaponEval = offWeapon ? evaluateWeapon(offWeapon, equipDice) : null;
  const offShieldOutcome = computeShieldOutcome(offShield);

  // 守護者【雙重盾牌】：兩手皆盾時合併視為格鬥類別雙手近戰武器「雙盾」，
  // 攻擊改用該技能的命中與傷害公式——盾牌本身沒有攻擊資料。
  const dualShield = getDualShieldState(character, {
    mainIsShield: Boolean(mainShield),
    offIsShield: Boolean(offShield)
  });
  const mainAttack = dualShield.active ? dualShield.weapon : mainWeapon;
  const mainWeaponEval = mainAttack ? evaluateWeapon(mainAttack, equipDice) : null;

  const armorName = character.equipment?.armor || '無裝甲 / 冒險服';
  const armor = armorByName.get(armorName) || null;
  const armorOutcome = computeArmorOutcome(armor, equipDice);

  const accessoryName = character.equipment?.accessory || '';
  const accessory = accessoryByName.get(accessoryName) || null;

  const mainProficiency = mainShield
    ? checkEquippable(mainShield, 'mainHand', stats.profs, { isShield: true })
    : checkEquippable(mainWeapon, 'mainHand', stats.profs);
  const offProficiency = offShield
    ? checkEquippable(offShield, 'offHand', stats.profs, { isShield: true })
    : checkEquippable(offWeapon, 'offHand', stats.profs);
  const armorProficiency = checkEquippable(armor, 'armor', stats.profs);

  const offHandOccupied = Boolean(offHandName) && offHandName !== '無盾牌';
  // 雙手武器佔滿兩個手部欄位（Core p.131）：副手格會被主手吃掉
  const mainTakesBothHands = isTwoHanded(mainWeapon);
  const twoHandedConflict = mainTakesBothHands && offHandOccupied;

  const loadoutIssues = buildLoadoutIssues({
    character,
    stats,
    weaponMap: weaponByName,
    armorMap: armorByName,
    shieldMap: shieldByName,
    accessoryMap: accessoryByName
  });

  // 更換某個欄位時，該欄位原本的花費會被釋出，所以可動用預算要把它的成本加回去
  const slotCost = {
    mainHand: (mainWeapon || mainShield)?.cost || 0,
    offHand: (offShield || offWeapon)?.cost || 0,
    armor: armor?.cost || 0,
    accessory: 0
  };
  const pickerBudget = Math.max(0, rules.startingZenit - (totalEquipCost - (slotCost[pickerSlot] || 0)));

  const mainHandMetrics = mainWeaponEval
    ? [
        { label: '命中檢定', value: mainWeaponEval.accuracyLabel },
        { label: '傷害', value: mainWeaponEval.damageFormula },
        { label: '價格', value: `${mainAttack.cost}z` }
      ]
    : [];
  const mainHandNote = dualShield.active
    ? `兩手皆盾，合併視為格鬥類別雙手近戰武器；傷害 ${dualShield.weapon.damage}${dualShield.defenseMasterySL > 0 ? `，額外 +${dualShield.defenseMasterySL}（防守掌握 SL）` : ''}`
    : (mainWeaponEval
        ? `${mainAttack.category} · ${mainAttack.hands === 2 ? '雙手' : '單手'}${mainAttack.range}${mainAttack.note ? ` · ${mainAttack.note}` : ''}`
        : (mainShield ? '單獨一面盾牌不能攻擊；需與副手盾牌合併為「雙盾」' : null));
  const mainHandBadges = [];
  if (dualShield.active) {
    mainHandBadges.push({ label: '雙盾', variant: theme.badgeVariant });
  } else if (mainWeapon?.category) {
    mainHandBadges.push({ label: mainWeapon.category, variant: theme.badgeVariant });
  }
  if (mainTakesBothHands) mainHandBadges.push({ label: '雙手', variant: 'zinc' });
  if (mainWeapon?.martial || mainShield?.martial) mainHandBadges.push({ label: '職業', variant: 'rose' });

  const offHandMetrics = offShield
    ? [
        { label: '物防', value: `+${offShieldOutcome.defBonus}` },
        { label: '魔防', value: `+${offShieldOutcome.mdefBonus}` },
        { label: '先攻', value: offShieldOutcome.initMod === 0 ? '±0' : String(offShieldOutcome.initMod) }
      ]
    : (offWeaponEval
        ? [
            { label: '命中檢定', value: offWeaponEval.accuracyLabel },
            { label: '傷害', value: offWeaponEval.damageFormula },
            { label: '價格', value: `${offWeapon.cost}z` }
          ]
        : []);

  const armorMetrics = [
    { label: '物防', value: String(armorOutcome.def) },
    { label: '魔防', value: String(armorOutcome.mdef) },
    { label: '先攻', value: armorOutcome.initMod === 0 ? '±0' : String(armorOutcome.initMod) }
  ];

  const mainHandWarning = twoHandedConflict
    ? '雙手武器佔滿兩個手部欄位，副手必須空出'
    : (mainShield && !dualShield.learned
        ? '盾牌裝備於主手需要守護者【雙重盾牌】'
        : (mainProficiency.ok ? null : mainProficiency.reason));
  const offHandWarning = offHandOccupied && !offProficiency.ok ? offProficiency.reason : null;
  const armorWarningText = armorProficiency.ok ? null : armorProficiency.reason;

  const mainHandLabel = mainShield?.name || mainWeapon?.name || (mainHandName || '未設定');
  const offHandLabel = offShield?.name || offWeapon?.name || (offHandName || '無盾牌');
  const armorLabel = armor?.name || armorName;
  const accessoryLabel = accessory?.name || (accessoryName || '不佩戴飾品');

  // 裝備圖示一律取自使用者的裝備設計器對照表（見 equipmentRules.js 的 EQUIPMENT_ICONS）
  const mainHandIcon = getEquipmentIcon(
    dualShield.active ? '雙盾' : (mainShield?.name || mainWeapon?.name || ''),
    'slot_mainhand'
  );
  const offHandIcon = offShield
    ? getEquipmentIcon(offShield.name, 'slot_offhand')
    : (offWeapon ? getEquipmentIcon(offWeapon.name, 'slot_offhand') : 'slot_offhand');
  const armorIcon = getEquipmentIcon(armor?.name || '', 'slot_armor');

  const mainHandMissing = Boolean(mainHandName) && !mainWeapon && !mainShield;
  const offHandMissing = Boolean(offHandName) && !offShield && !offWeapon;
  const armorMissing = Boolean(character.equipment?.armor) && !armor;
  const accessoryMissing = Boolean(accessoryName) && !accessory;

  return (
    <div className="space-y-4">
      {/* 桌面與手機自適應架構：仿 NPC 工坊的左側導航清單 */}
      <div className="flex flex-col md:flex-row gap-5 items-start">
        
        {/* ==================== 桌面端左側邊欄 (Left Sidebar - md+ 顯示) ==================== */}
        <div className="hidden md:flex w-60 shrink-0 flex-col gap-3 sticky top-4">
          {/* 角色卡身分小卡 */}
          <div
            className="rounded-xl p-3.5 border shadow-xs transition-colors"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            <div className="flex items-center gap-3">
              <div
                onClick={() => setActiveTab(1)}
                className="w-11 h-11 rounded-xl bg-white border overflow-hidden shrink-0 flex items-center justify-center font-serif shadow-inner cursor-pointer group relative"
                style={{ borderColor: theme.border }}
                title="點擊前往基礎身世設定更換或調整頭像"
              >
                {character.avatar && (character.avatar.startsWith('http') || character.avatar.startsWith('data:')) ? (
                  <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <GameIcon
                    name={character.avatar || character.classes?.[0]?.className || 'sword'}
                    size={26}
                    style={{ color: theme.accent }}
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                  更換
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <h3 className="font-serif font-black text-sm truncate" style={{ color: theme.textDark }}>
                    {character.name || '新冒險者'}
                  </h3>
                  <JRPGBadge variant={theme.badgeVariant} size="xs">
                    Lv {character.level || 5}
                  </JRPGBadge>
                </div>
                <p className="text-[11px] truncate" style={{ color: theme.textMuted }}>
                  {character.identity || '未設定身份'}
                </p>
              </div>
            </div>
          </div>

          {/* 經典職業搭配快捷入口 */}
          <button
            type="button"
            onClick={() => setIsPresetsModalOpen(true)}
            disabled={locked}
            className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border font-bold transition-all shadow-xs hover:scale-102 group text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.subpanelBg,
              color: theme.textDark
            }}
            title={locked ? '已定稿——套用官方配置會重寫屬性與職業，請先解除定稿' : '一鍵套用官方經典職業搭配（職業、特技、屬性骰、裝備配置）'}
          >
            <div className="flex items-center gap-2">
              <GiSparkles className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" style={{ color: theme.accent }} />
              <span className="text-xs font-black">經典職業搭配</span>
            </div>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 transition-colors"
              style={{ borderColor: theme.border, color: theme.accent, backgroundColor: theme.cardBg }}
            >
              一鍵套用
            </span>
          </button>

          {/* 定稿狀態卡：「還在創角」與「已經在跑」的分界 */}
          <div
            className="rounded-xl border shadow-xs p-3 flex flex-col gap-2 transition-colors"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: locked ? theme.accent : theme.border
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <GameIcon name="GiPadlock" size={13} style={{ color: locked ? theme.accent : theme.textMuted }} />
                <span className="text-[11px] font-black" style={{ color: theme.textDark }}>
                  {locked ? '已定稿' : '創角中'}
                </span>
              </div>
              {locked && character.lockedAt && (
                <span className="text-[9px] font-mono shrink-0" style={{ color: theme.textMuted }}>
                  {formatLogTime(character.lockedAt)}
                </span>
              )}
            </div>

            <p className="text-[10px] leading-relaxed" style={{ color: theme.textMuted }}>
              {locked
                ? '身世與四維屬性已凍結；等級、技能、裝備、羈絆、命刻仍可隨時調整。'
                : canLock
                  ? '六個步驟都通過規則檢查，可以定稿了。定稿後創角欄位會凍結。'
                  : `還有 ${blockedCount} 項未符合規則，補完後即可定稿。`}
            </p>

            <button
              type="button"
              onClick={locked ? handleUnlock : handleLock}
              disabled={!locked && !canLock}
              className={`w-full text-[11px] font-bold px-2.5 py-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                locked ? 'hover:bg-rose-50' : 'hover:scale-101'
              }`}
              style={{
                backgroundColor: locked ? theme.cardBg : (canLock ? '#059669' : theme.subpanelBg),
                borderColor: locked ? theme.border : (canLock ? '#047857' : theme.border),
                color: locked ? theme.textDark : (canLock ? '#ffffff' : theme.textMuted)
              }}
              title={locked ? '解除定稿會重新開放身世與四維屬性' : '定稿後創角欄位凍結，只留成長相關欄位'}
            >
              <GiPadlock className="w-3.5 h-3.5" />
              {locked ? '解鎖編輯' : '完成創角'}
            </button>
          </div>

          {/* 5 大步驟縱向清單 */}
          <div
            className="rounded-xl border shadow-xs p-2 flex flex-col gap-1 transition-colors"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              創角流程
            </div>

            {TABS.map(t => {
              const step = checklistById.get(t.id) || { status: 'todo', message: '', issueCount: 0 };
              const isTabActive = activeTab === t.id;
              const isFrozen = locked && LOCKED_CREATION_TABS.includes(t.id);

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                    isTabActive
                      ? 'text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  style={isTabActive ? { backgroundColor: theme.accent, color: '#ffffff' } : {}}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-black shrink-0 transition-colors ${
                        isTabActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {t.id}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold leading-tight flex items-center gap-1">
                        {t.label}
                        {isFrozen && <GameIcon name="GiPadlock" size={10} className="shrink-0" />}
                      </div>
                      {/* 這一行以前是標籤的重複；改成「這一格還缺什麼」，導航列就變成進度表 */}
                      <div className={`text-[10px] leading-tight mt-0.5 truncate ${
                        isTabActive ? 'text-white/80' : 'text-slate-400'
                      }`}>
                        {step.message}
                      </div>
                    </div>
                  </div>

                  {/* 狀態：完成打勾、待處理黃點、有問題紅點 */}
                  {step.status === 'error' ? (
                    <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-200 shrink-0" title="有未符合規則的項目" />
                  ) : step.status === 'todo' ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="還有提醒項目" />
                  ) : (
                    <GiCheckMark className={`w-3.5 h-3.5 shrink-0 ${isTabActive ? 'text-white' : 'text-emerald-600'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* 創角完整度自檢：常駐即時狀態卡 */}
          <button
            type="button"
            onClick={() => setIsValidationModalOpen(true)}
            className={`w-full text-left p-3 rounded-xl border transition-all shadow-xs flex flex-col gap-1.5 hover:scale-101 cursor-pointer ${
              validation.errors.length > 0
                ? 'bg-rose-50/90 border-rose-300 hover:border-rose-400'
                : validation.hasWarnings
                  ? 'bg-amber-50/90 border-amber-300 hover:border-amber-400'
                  : 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-400'
            }`}
            title="點擊查看完整官方創角規則驗證報告"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {validation.errors.length > 0 ? (
                  <GiHazardSign className="w-4 h-4 text-rose-600 shrink-0" />
                ) : validation.hasWarnings ? (
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <GiCheckMark className="w-4 h-4 text-emerald-700 shrink-0" />
                )}
                <span className={
                  validation.errors.length > 0
                    ? 'text-rose-950'
                    : validation.hasWarnings
                      ? 'text-amber-950'
                      : 'text-emerald-950'
                }>
                  規則自檢
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                validation.errors.length > 0
                  ? 'bg-rose-200 text-rose-900'
                  : validation.hasWarnings
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-200 text-emerald-900'
              }`}>
                {validation.errors.length > 0
                  ? `${validation.errors.length} 項待修正`
                  : validation.hasWarnings
                    ? `${validation.warnings.length} 項提醒`
                    : '100% 合規'}
              </span>
            </div>
            <p className={`text-[11px] leading-tight ${
              validation.errors.length > 0
                ? 'text-rose-700'
                : validation.hasWarnings
                  ? 'text-amber-700'
                  : 'text-emerald-700'
            }`}>
              {validation.errors.length > 0
                ? '尚有未符規則項目，點擊查看詳情'
                : validation.hasWarnings
                  ? '基本合規，有可優化提醒'
                  : '已符合官方標準創角規範'}
            </p>
          </button>

          {/* 快捷操作區 (預覽、跑團) */}
          <div
            className="rounded-xl border shadow-xs p-2.5 flex flex-col gap-2 transition-colors"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >

            {/* 查看角色卡按鈕 */}
            <button
              type="button"
              onClick={() => setIsCardPreviewModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs hover:opacity-90 cursor-pointer"
              style={{ borderColor: theme.border, color: theme.textDark, backgroundColor: theme.cardBg }}
              title="隨時預覽或檢查角色卡目前填寫狀態"
            >
              <GiScrollUnfurled className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
              <span>查看角色卡</span>
            </button>

            {/* 進入跑團卡按鈕 */}
            {onEnterPlayMode && (
              <JRPGButton
                variant={theme.buttonVariant || 'primary'}
                size="sm"
                icon={Play}
                onClick={onEnterPlayMode}
                className="w-full justify-center"
              >
                進入跑團卡
              </JRPGButton>
            )}
          </div>
        </div>

        {/* ==================== 手機端頂部步驟條 (Mobile Header - md 以下顯示) ==================== */}
        <div
          className="md:hidden w-full flex flex-col gap-2 rounded-xl p-3 border shadow-xs transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-xs truncate" style={{ color: theme.textDark }}>
                {character.name || '新冒險者'}
              </span>
              <JRPGBadge variant={theme.badgeVariant} size="xs">
                Lv {character.level || 5}
              </JRPGBadge>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => setIsPresetsModalOpen(true)}
                className="px-2 py-1 rounded-md border text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                style={{ borderColor: theme.border, color: theme.textDark, backgroundColor: theme.cardBg }}
                title="經典職業搭配"
              >
                <GiSparkles className="w-3 h-3" style={{ color: theme.accent }} />
                <span>職業搭配</span>
              </button>
              <button
                type="button"
                onClick={() => setIsValidationModalOpen(true)}
                className={`px-2 py-1 rounded-md border text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer ${
                  validation.errors.length > 0
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : validation.hasWarnings
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
                title="創角規則自檢"
              >
                {validation.errors.length > 0 ? (
                  <GiHazardSign className="w-3 h-3 text-rose-600" />
                ) : validation.hasWarnings ? (
                  <Info className="w-3 h-3 text-amber-600" />
                ) : (
                  <GiCheckMark className="w-3 h-3 text-emerald-700" />
                )}
                <span>
                  {validation.errors.length > 0
                    ? `${validation.errors.length}待修正`
                    : validation.hasWarnings
                      ? `${validation.warnings.length}提醒`
                      : '合規'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsCardPreviewModalOpen(true)}
                className="px-2 py-1 rounded-md border text-[11px] font-bold shadow-2xs cursor-pointer"
                style={{ borderColor: theme.border, color: theme.textDark, backgroundColor: theme.cardBg }}
              >
                查看卡片
              </button>
              {onEnterPlayMode && (
                <button
                  type="button"
                  onClick={onEnterPlayMode}
                  className="px-2 py-1 rounded-md text-white text-[11px] font-bold shadow-2xs cursor-pointer"
                  style={{ backgroundColor: theme.accent }}
                >
                  跑團卡
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: theme.border }}>
            <span className="text-[11px] font-bold text-slate-500 shrink-0">步驟 {activeTab}/{TABS.length}:</span>
            <select
              value={activeTab}
              onChange={e => setActiveTab(Number(e.target.value))}
              className="flex-1 text-xs font-bold border rounded-lg px-2.5 py-1 outline-none"
              style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
            >
              {TABS.map(t => {
                const step = checklistById.get(t.id);
                const mark = step?.status === 'done' ? '✓' : step?.status === 'todo' ? '△' : '✕';
                return (
                  <option key={t.id} value={t.id}>{t.id}. {mark} {t.label}</option>
                );
              })}
            </select>
          </div>
        </div>

        {/* ==================== 主編輯區域 (Right Main Canvas) ==================== */}
        <div
          className="flex-1 w-full min-w-0 rounded-xl border p-4 sm:p-7 shadow-xs space-y-6 transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
        >
          <ErrorBoundary inline label={TABS.find(t => t.id === activeTab)?.label || '編輯步驟'}>
          {/* 定稿後凍結創角分頁：`fieldset[disabled]` 會連同內部所有表單控件一起停用，
              所以不必逐個 input 加 disabled（也才不會漏掉任何一個） */}
          <fieldset
            disabled={frozenTab}
            className="border-0 p-0 m-0 min-w-0 disabled:opacity-60"
          >

          {/* ==================== TAB 1: 基礎身世 ==================== */}
          {activeTab === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h4 className="font-serif font-black text-lg flex items-center gap-2" style={{ color: theme.textDark }}>
                  <span style={{ color: theme.accent }}>1.</span> 角色核心身份
                </h4>
                <button
                  type="button"
                  onClick={() => setIsPresetsModalOpen(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shadow-2xs hover:scale-102 cursor-pointer"
                  style={{
                    backgroundColor: theme.subpanelBg,
                    borderColor: theme.border,
                    color: theme.textDark
                  }}
                  title="一鍵套用官方經典職業搭配（職業、特技、屬性骰、裝備配置）"
                >
                  <GiSparkles className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
                  <span>套用經典職業搭配</span>
                </button>
              </div>

              {/* 角色肖像與頭像上傳 (參照 NPC 工坊規格) */}
              <CharacterAvatarUploader
                character={character}
                onChange={onChange}
                theme={theme}
                onToast={showToast}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <JRPGInput
                  label="角色姓名"
                  value={character.name || ''}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="例：雷恩"
                  theme={theme}
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold" style={{ color: theme.textDark }}>
                      角色等級
                    </label>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded border transition-colors"
                      style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark }}
                    >
                      起始 {rules.startingLevel} 級
                    </span>
                  </div>
                  <input
                    type="number"
                    min={rules.startingLevel}
                    max={50}
                    value={character.level || rules.startingLevel}
                    onChange={e => updateField('level', parseInt(e.target.value, 10) || rules.startingLevel, { kind: 'levelup', title: '調整等級' })}
                    className="w-full rounded-lg px-3 py-2 text-xs outline-none shadow-sm border transition-all font-mono font-bold"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold" style={{ color: theme.textDark }}>
                    身份
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsIdentityModalOpen(true)}
                      className="text-[11px] px-2.5 py-1 rounded border font-bold transition-colors flex items-center gap-1.5 shadow-2xs hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark }}
                      title="點開查看官方 60 種身分、40 種特質與 20 種細節對照表 (d6+d20)"
                    >
                      <GiSpellBook className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                      <span>靈感對照表</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = generateRandomIdentity();
                        updateField('identity', newId);
                      }}
                      className="text-[11px] px-2 py-1 rounded border font-bold transition-colors flex items-center gap-1 shadow-2xs hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark }}
                      title="投擲 1d6+1d20 隨機生成身份"
                    >
                      <GiRollingDices className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                      <span>隨機</span>
                    </button>
                  </div>
                </div>
                <JRPGInput
                  value={character.identity || ''}
                  onChange={e => updateField('identity', e.target.value)}
                  placeholder="例：失去記憶的原帝國魔導兵、被神明驅逐的聖樂使"
                  theme={theme}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold" style={{ color: theme.textDark }}>
                        主題
                      </label>
                      <label className="flex items-center gap-1 text-[11px] cursor-pointer font-medium select-none" style={{ color: theme.textMuted }}>
                        <input
                          type="checkbox"
                          checked={isCustomTheme}
                          onChange={e => {
                            const checked = e.target.checked;
                            setIsCustomTheme(checked);
                            if (!checked && !CANONICAL_THEMES.includes(character.theme)) {
                              updateField('theme', CANONICAL_THEMES[0]);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded cursor-pointer"
                          style={{ accentColor: theme.accent }}
                        />
                        <span>自訂</span>
                      </label>
                    </div>
                    {isCustomTheme ? (
                      <JRPGInput
                        value={character.theme || ''}
                        onChange={e => updateField('theme', e.target.value)}
                        placeholder="例：救贖、追尋..."
                        theme={theme}
                      />
                    ) : (
                      <select
                        value={character.theme || '希望'}
                        onChange={e => updateField('theme', e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-xs outline-none shadow-sm border cursor-pointer"
                        style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
                      >
                        {CANONICAL_THEMES.map(tName => (
                          <option key={tName} value={tName}>{tName}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <JRPGInput
                    label="故鄉"
                    value={character.origin || ''}
                    onChange={e => updateField('origin', e.target.value)}
                    placeholder="例：浮空島王國、千年翡翠古林"
                    theme={theme}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <JRPGInput
                    label="初始持有金幣"
                    type="number"
                    value={character.zenit !== undefined ? character.zenit : 500}
                    onChange={e => updateField('zenit', parseInt(e.target.value, 10) || 0, { kind: 'zenit', title: '調整資金' })}
                    theme={theme}
                  />
                  <JRPGInput
                    label="初始物語點"
                    type="number"
                    value={character.fabulaPoints !== undefined ? character.fabulaPoints : 3}
                    onChange={e => updateField('fabulaPoints', parseInt(e.target.value, 10) || 3)}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: 四維屬性 ==================== */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg flex items-center gap-2" style={{ color: theme.textDark }}>
                  <span style={{ color: theme.accent }}>2.</span> 四維基礎屬性骰配置
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  四維屬性代表骰子面數（d6~d12），將骰子分配至各項體質。
                </p>
              </div>

              {/* 2x2 四宮格拖曳分配矩陣 */}
              <AttributeMatrixPicker
                attributes={character.attributes || { dex: 8, ins: 8, mig: 8, wlp: 8 }}
                onChange={(newAttrs) => {
                  onChange({
                    ...character,
                    attributes: newAttrs,
                    updatedAt: new Date().toISOString()
                  });
                }}
                theme={theme}
              />
            </div>
          )}

          {/* ==================== TAB 3: 職業與技能 ==================== */}
          {activeTab === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg flex items-center gap-2" style={{ color: theme.textDark }}>
                  <span style={{ color: theme.accent }}>3.</span> 職業組合與技能加點
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  起始 {rules.startingLevel} 級必須分配在 {rules.classCountMin}~{rules.classCountMax} 個不同職業中，每級獲得 1 點技能。
                </p>
              </div>

              {/* Sourcebook Expansion Toggles */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 transition-colors"
                style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
              >
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: theme.textDark }}>
                  <GiSpellBook className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                  官方拓展職業:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.keys(SOURCEBOOKS).map(sbKey => {
                    const sb = SOURCEBOOKS[sbKey];
                    const isEnabled = (character.enabledSourcebooks ?? ['core']).includes(sbKey);

                    return (
                      <button
                        key={sbKey}
                        type="button"
                        onClick={() => toggleSourcebook(sbKey)}
                        className="text-xs px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                        style={
                          isEnabled
                            ? { backgroundColor: theme.accent, borderColor: theme.accentDark, color: '#ffffff' }
                            : { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }
                        }
                      >
                        {isEnabled ? <GiCheckMark className="w-3 h-3" /> : null}
                        <span>{sb.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level Budget Guard Bar */}
              <div
                className="p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition-colors"
                style={
                  stats.isLevelMatched
                    ? { backgroundColor: theme.panelBg, borderColor: theme.border, color: theme.textDark }
                    : { backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark }
                }
              >
                <span>
                  已分配技能: <strong>{stats.totalSkillLevels}</strong> / {character.level || 5} 級
                </span>
                <span className="flex items-center gap-1">
                  {stats.isLevelMatched ? (
                    <>
                      <GiCheckMark className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                      <span>分配完整</span>
                    </>
                  ) : (
                    <>
                      <GiHazardSign className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                      <span>
                        {stats.totalSkillLevels < (character.level || 5)
                          ? `尚缺 ${(character.level || 5) - stats.totalSkillLevels} 點`
                          : `超出 ${stats.totalSkillLevels - (character.level || 5)} 點`}
                      </span>
                    </>
                  )}
                </span>
              </div>

              {/* Action Bar */}
              <div
                className="flex items-center justify-between p-3.5 rounded-xl border transition-colors flex-wrap gap-2"
                style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    目前已選擇 <strong className="font-mono text-sm" style={{ color: theme.accent }}>{(character.classes || []).length}</strong> 個職業
                    {character.level <= rules.startingLevel && <span className="text-[11px] text-slate-500 ml-1">（創角規定：{rules.classCountMin}~{rules.classCountMax} 個職業）</span>}
                  </span>
                </div>

                <JRPGButton
                  variant={theme.buttonVariant || 'primary'}
                  size="sm"
                  icon={Plus}
                  onClick={() => setIsClassPickerOpen(true)}
                  disabled={locked || ((character.classes || []).length >= rules.classCountMax && (character.level || rules.startingLevel) <= rules.startingLevel)}
                  title={locked ? '已定稿——新增職業屬創角決定，請先解除定稿' : undefined}
                >
                  選擇職業
                </JRPGButton>
              </div>

              {/* Configured Classes & Skills */}
              <div className="space-y-4">
                {(!character.classes || character.classes.length === 0) ? (
                  <div
                    className="p-8 rounded-2xl border border-dashed text-center space-y-3"
                    style={{ borderColor: theme.border, backgroundColor: theme.panelBg }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center border shadow-xs"
                      style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.accent }}
                    >
                      <GiBroadsword size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-serif font-black text-sm text-slate-800">尚未選擇任何職業</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        《Fabula Ultima》開局角色需要在 {rules.classCountMin}~{rules.classCountMax} 個職業中探索分配起始 {rules.startingLevel} 級。
                      </p>
                    </div>
                    <JRPGButton
                      variant={theme.buttonVariant || 'primary'}
                      size="sm"
                      icon={Plus}
                      onClick={() => setIsClassPickerOpen(true)}
                      disabled={locked}
                      title={locked ? '已定稿——新增職業屬創角決定，請先解除定稿' : undefined}
                    >
                      選擇職業
                    </JRPGButton>
                  </div>
                ) : (
                  (character.classes || []).map((cl, cIdx) => (
                    <ClassSkillCard
                      key={cl.className}
                      classItem={cl}
                      classIndex={cIdx}
                      character={character}
                      theme={theme}
                      isInitialEdit={newlyAddedClassName === cl.className}
                      onUpdateSkills={handleUpdateClassSkills}
                      onUpdateClassBenefit={handleUpdateClassBenefit}
                      onRemoveClass={handleRemoveClass}
                      onUpdateCharacter={onChange}
                    />
                  ))
                )}
              </div>

              {/* 職業選擇器彈窗 */}
              <ClassPickerModal
                isOpen={isClassPickerOpen}
                onClose={() => setIsClassPickerOpen(false)}
                theme={theme}
                enabledBooks={enabledBooks}
                onToggleSourcebook={toggleSourcebook}
                existingClassNames={(character.classes || []).map(c => c.className)}
                onSelectClass={handleSelectClassFromPicker}
                creationRules={rules}
              />
            </div>
          )}

          {/* ==================== TAB 4: 裝備配置 ==================== */}
          {activeTab === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg flex items-center gap-2" style={{ color: theme.textDark }}>
                  <span style={{ color: theme.accent }}>4.</span> 裝備配置
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  以目前的四維骰即時換算期望命中、期望傷害與防禦結果；不能裝備的原因直接標在選項上。
                </p>
              </div>

              {/* 即時結算：裝備一改，這三個數字就是玩家最在意的結果 */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'def', label: '物理防禦', value: stats.def, icon: GiRoundShield },
                  { key: 'mdef', label: '魔法防禦', value: stats.mdef, icon: GiCrystalBall },
                  { key: 'init', label: '先攻修正', value: stats.init, icon: GiPocketWatch }
                ].map((tile) => {
                  const TileIcon = tile.icon;
                  return (
                    <div
                      key={tile.key}
                      className="rounded-xl border p-2.5 flex items-center gap-2.5"
                      style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
                    >
                      <span
                        className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                        style={{ backgroundColor: theme.panelBg, borderColor: theme.border, color: theme.accent }}
                      >
                        <TileIcon size={17} />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold truncate" style={{ color: theme.textMuted }}>
                          {tile.label}
                        </div>
                        <div className="font-mono font-black text-lg leading-tight" style={{ color: theme.textDark }}>
                          {tile.key === 'init' && tile.value > 0 ? `+${tile.value}` : tile.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Proficiencies Indicator */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between text-xs flex-wrap gap-2"
                style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
              >
                <span className="font-bold" style={{ color: theme.textDark }}>職業裝備熟練度:</span>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-bold border"
                    style={stats.profs.martialMelee ? { backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark } : { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1', color: '#64748b' }}
                  >
                    職業近戰 {stats.profs.martialMelee ? '✓' : '✗'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-bold border"
                    style={stats.profs.martialRanged ? { backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark } : { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1', color: '#64748b' }}
                  >
                    職業遠程 {stats.profs.martialRanged ? '✓' : '✗'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-bold border"
                    style={stats.profs.martialArmor ? { backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark } : { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1', color: '#64748b' }}
                  >
                    職業防具 {stats.profs.martialArmor ? '✓' : '✗'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-bold border"
                    style={stats.profs.martialShields ? { backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark } : { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1', color: '#64748b' }}
                  >
                    職業盾牌 {stats.profs.martialShields ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              {/* 500 Zenit Starting Budget Tracker */}
              <div
                className="p-3 rounded-xl border space-y-2 shadow-2xs"
                style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
              >
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: theme.textDark }}>
                    <GiCoins className="w-4 h-4" style={{ color: theme.accent }} />
                    <span>起始裝備預算 {rules.startingZenit}z</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span>已花費: <strong style={{ color: theme.accent }}>{totalEquipCost}z</strong> / {rules.startingZenit}z</span>
                    <span className={remainingBudget < 0 ? 'text-red-700 font-bold' : 'font-bold'} style={remainingBudget >= 0 ? { color: theme.accent } : undefined}>
                      剩餘: {remainingBudget}z
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t flex-wrap gap-2 text-xs" style={{ borderColor: `${theme.border}80` }}>
                  <span className="text-xs text-slate-500">
                    剩餘預算 + 2d6 × 10 結算為開局金幣
                  </span>
                  <button
                    type="button"
                    onClick={handleRollStartingZenit}
                    className="px-2.5 py-1 rounded-lg border text-xs font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
                  >
                    <GiRollingDices className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                    <span>擲 2d6 × 10 結算</span>
                  </button>
                </div>
              </div>

              {/* 載入衝突：規則上明確不成立的組合，選完立刻看得到，不用等跑團才被 GM 抓 */}
              {loadoutIssues.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-1">
                  {loadoutIssues.map((issue, idx) => (
                    <div key={`${issue.message}_${idx}`} className="flex items-center gap-1.5">
                      <GiHazardSign className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 四個槽位：每格直接顯示「這一格換算成什麼」，要比較時才開選擇彈窗。
                  主手換成雙手武器時，這張卡會平滑長成滿版、並把副手格吃進來（虛線佔位），
                  讓「這件武器佔了兩隻手」是看得見的事實，而不是一行要自己讀的警告。 */}
              <div className="flex flex-wrap gap-3 items-stretch">
                <div
                  className="min-w-0"
                  style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: mainTakesBothHands ? '100%' : 'calc(50% - 0.375rem)',
                    minWidth: 'min(100%, 250px)',
                    transition: 'flex-basis 340ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <EquipmentSlotCard
                    theme={theme}
                    slotDef={EQUIPMENT_SLOTS.mainHand}
                    itemName={mainHandLabel}
                    itemIcon={mainHandIcon}
                    itemMissing={mainHandMissing}
                    badges={mainHandBadges}
                    metrics={mainHandMetrics}
                    note={mainHandNote}
                    warning={mainHandWarning}
                    mergedNote={mainTakesBothHands ? '被主手佔用（雙手武器）' : null}
                    onOpen={() => setPickerSlot('mainHand')}
                  />
                </div>

                {!mainTakesBothHands && (
                  <div
                    className="min-w-0"
                    style={{
                      flexGrow: 1,
                      flexShrink: 1,
                      flexBasis: 'calc(50% - 0.375rem)',
                      minWidth: 'min(100%, 250px)'
                    }}
                  >
                    <EquipmentSlotCard
                      theme={theme}
                      slotDef={EQUIPMENT_SLOTS.offHand}
                      itemName={offHandLabel}
                      itemIcon={offHandIcon}
                      itemMissing={offHandMissing}
                      badges={offShield?.martial ? [{ label: '職業', variant: 'rose' }] : []}
                      metrics={offHandMetrics}
                      note={offShield?.desc || null}
                      warning={offHandWarning}
                      onOpen={() => setPickerSlot('offHand')}
                    />
                  </div>
                )}

                <div
                  className="min-w-0"
                  style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 'calc(50% - 0.375rem)',
                    minWidth: 'min(100%, 250px)'
                  }}
                >
                  <EquipmentSlotCard
                    theme={theme}
                    slotDef={EQUIPMENT_SLOTS.armor}
                    itemName={armorLabel}
                    itemIcon={armorIcon}
                    itemMissing={armorMissing}
                    badges={armor?.martial ? [{ label: '職業', variant: 'rose' }] : []}
                    metrics={armorMetrics}
                    note={armor?.desc || null}
                    warning={armorWarningText}
                    onOpen={() => setPickerSlot('armor')}
                  />
                </div>

                <div
                  className="min-w-0"
                  style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 'calc(50% - 0.375rem)',
                    minWidth: 'min(100%, 250px)'
                  }}
                >
                  <EquipmentSlotCard
                    theme={theme}
                    slotDef={EQUIPMENT_SLOTS.accessory}
                    itemName={accessoryLabel}
                    itemIcon="slot_accessory"
                    itemMissing={accessoryMissing}
                    badges={accessory ? [{ label: '稀有物品', variant: 'zinc' }] : []}
                    metrics={[]}
                    note={accessory?.desc || '飾品在原書中一律屬稀有物品，需與團員討論後取得。'}
                    onOpen={() => setPickerSlot('accessory')}
                  />
                </div>
              </div>

              {/* 裝備選擇彈窗 */}
              <EquipmentPickerModal
                isOpen={pickerSlot !== null}
                slot={pickerSlot || 'mainHand'}
                onClose={() => setPickerSlot(null)}
                theme={theme}
                character={character}
                stats={stats}
                remainingBudget={pickerBudget}
                onSelect={(name) => {
                  if (!pickerSlot) return;
                  // 換上雙手武器時副手必須空出——由規則層判定，這裡只負責提示與記錄
                  const { equipment: nextEquipment, clearedOffHand } = applyEquipmentChoice(
                    character.equipment,
                    pickerSlot,
                    name,
                    weaponByName
                  );
                  const base = {
                    ...character,
                    equipment: nextEquipment,
                    updatedAt: new Date().toISOString()
                  };
                  const changes = [{
                    field: pickerSlot,
                    from: character.equipment?.[pickerSlot] || '',
                    to: name
                  }];
                  if (clearedOffHand) {
                    changes.push({ field: 'offHand', from: clearedOffHand, to: '無盾牌' });
                  }
                  onChange(loggableChange(character, base, {
                    kind: 'equipment',
                    title: `更換${EQUIPMENT_SLOTS[pickerSlot].label}`,
                    changes
                  }));
                  if (clearedOffHand && showToast) {
                    showToast(`已卸下副手「${clearedOffHand}」——雙手武器佔滿兩個手部欄位`);
                  }
                }}
              />
            </div>
          )}

          {/* ==================== TAB 5: 情感羈絆 ==================== */}
          {activeTab === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-black text-lg flex items-center gap-2" style={{ color: theme.textDark }}>
                    <span style={{ color: theme.accent }}>5.</span> 情感羈絆系統
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    起始最多 3 條羈絆（上限 6 條），每條包含 1~3 種情感維度。
                  </p>
                </div>

                <JRPGButton
                  variant={theme.buttonVariant || 'primary'}
                  size="xs"
                  icon={Plus}
                  onClick={handleAddBond}
                  disabled={(character.bonds || []).length >= 6}
                >
                  新增羈絆 【{(character.bonds || []).length}/6】
                </JRPGButton>
              </div>

              {/* Bonds List */}
              <div className="space-y-3">
                {(character.bonds || []).map((bond, bIdx) => (
                  <div
                    key={bond.id || bIdx}
                    className="rounded-xl p-3.5 border space-y-3 shadow-sm"
                    style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={bond.target || ''}
                          onChange={e => handleUpdateBondTarget(bIdx, e.target.value)}
                          placeholder="羈絆對象 (例：同行法師、王國舊友、死敵首領)..."
                          className="w-full border rounded-lg px-3 py-1.5 text-xs font-bold outline-none shadow-sm"
                          style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <JRPGBadge variant={theme.badgeVariant || 'green'} size="xs">
                          強度 +{bond.feelings?.length || 0}
                        </JRPGBadge>
                        <button
                          type="button"
                          onClick={() => handleRemoveBond(bIdx)}
                          className="p-1 text-slate-400 hover:text-red-700 font-bold cursor-pointer"
                          title="移除羈絆"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Feelings Toggle Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t" style={{ borderColor: `${theme.border}80` }}>
                      {BOND_FEELINGS.map(pair => (
                        <div key={pair.category} className="flex items-center gap-1">
                          {pair.options.map(opt => {
                            const isSelected = (bond.feelings || []).includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleToggleBondFeeling(bIdx, opt.id, pair.category)}
                                className="flex-1 text-[11px] py-1 px-1.5 rounded border transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                                style={
                                  isSelected
                                    ? { backgroundColor: theme.accent, color: '#ffffff', borderColor: theme.accent, fontWeight: 700 }
                                    : { backgroundColor: theme.cardBg, color: theme.textDark, borderColor: theme.border }
                                }
                              >
                                <GameIcon name={opt.iconName} className="w-3.5 h-3.5 shrink-0" />
                                <span>{opt.label.split(' ')[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {(character.bonds || []).length === 0 && (
                  <div
                    className="text-center py-6 border-2 border-dashed rounded-xl text-xs"
                    style={{ borderColor: theme.border, color: '#94a3b8' }}
                  >
                    尚未建立羈絆（點擊右上角「新增羈絆」）
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 6: 特質與命刻 ==================== */}
          {activeTab === 6 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg flex items-center gap-2" style={{ color: theme.textDark }}>
                  <span style={{ color: theme.accent }}>6.</span> 英雄技能、特質與個人命刻
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  精通職業後解鎖英雄技能，並可設定特質與個人誓約命刻。
                </p>
              </div>

              {/* Quirk Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold" style={{ color: theme.textDark }}>
                  金手指特質
                </label>
                <select
                  value={character.quirk || '無'}
                  onChange={e => updateField('quirk', e.target.value)}
                  className="w-full border rounded-lg px-3.5 py-2 text-xs outline-none shadow-sm cursor-pointer"
                  style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
                >
                  <option value="無">無特殊金手指</option>
                  {rulesData.quirks.map(q => (
                    <option key={q.name} value={q.name}>{q.name}</option>
                  ))}
                </select>
                {character.quirk && character.quirk !== '無' && (
                  <p
                    className="text-[11px] italic p-2.5 rounded-lg border"
                    style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark }}
                  >
                    {renderTextWithAffinities(rulesData.quirks.find(q => q.name === character.quirk)?.desc)}
                  </p>
                )}
              </div>

              {/* Heroic Skills */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold" style={{ color: theme.textDark }}>
                    掌握之英雄技能
                  </label>
                  {stats.masteredClasses.length > 0 && (
                    <span className="text-xs font-bold font-mono" style={{ color: theme.textDark }}>
                      已精通職業: {stats.masteredClasses.join('、')} 【具備英雄技能資格】
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedHeroicToAdd}
                    onChange={e => setSelectedHeroicToAdd(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-xs outline-none shadow-sm cursor-pointer"
                    style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
                  >
                    <option value="">-- 選擇英雄技能 --</option>
                    {rulesData.heroicSkills.map(h => (
                      <option key={h.name} value={h.name}>
                        {h.name} [{h.requirement}]
                      </option>
                    ))}
                  </select>
                  <JRPGButton
                    variant={theme.buttonVariant || 'primary'}
                    size="xs"
                    onClick={() => {
                      if (!selectedHeroicToAdd) return;
                      const hObj = rulesData.heroicSkills.find(h => h.name === selectedHeroicToAdd);
                      if (hObj && !(character.heroicSkills || []).some(h => h.name === hObj.name)) {
                        updateField('heroicSkills', [...(character.heroicSkills || []), hObj]);
                      }
                      setSelectedHeroicToAdd('');
                    }}
                    disabled={!selectedHeroicToAdd}
                  >
                    添加
                  </JRPGButton>
                </div>

                <div className="space-y-2">
                  {(character.heroicSkills || []).map((hs, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg p-3 border text-xs flex items-start justify-between gap-3 shadow-sm"
                      style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5" style={{ color: theme.textDark }}>
                          <GiLaurelCrown className="w-4 h-4 shrink-0" style={{ color: theme.accent }} />
                          <span>{hs.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{renderTextWithAffinities(hs.effect)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateField('heroicSkills', character.heroicSkills.filter((_, i) => i !== idx));
                        }}
                        className="text-slate-400 hover:text-red-700 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Clocks */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold" style={{ color: theme.textDark }}>
                    個人誓約命刻
                  </label>
                  <JRPGButton
                    variant={theme.outlineButtonVariant || 'outline'}
                    size="xs"
                    icon={Plus}
                    onClick={handleAddClock}
                  >
                    新增命刻
                  </JRPGButton>
                </div>

                <div className="space-y-2">
                  {(character.clocks || []).map(clk => (
                    <div
                      key={clk.id}
                      className="rounded-xl p-3 border flex items-center justify-between gap-3 shadow-sm"
                      style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          value={clk.title || ''}
                          onChange={e => {
                            const updated = character.clocks.map(c => c.id === clk.id ? { ...c, title: e.target.value } : c);
                            updateField('clocks', updated);
                          }}
                          placeholder="命刻目標..."
                          className="bg-transparent font-bold text-xs outline-none w-full border-b border-transparent focus:border-current"
                          style={{ color: theme.textDark }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={clk.totalSegments || 6}
                          onChange={e => {
                            const updated = character.clocks.map(c => c.id === clk.id ? { ...c, totalSegments: parseInt(e.target.value, 10) } : c);
                            updateField('clocks', updated);
                          }}
                          className="border rounded px-2 py-1 text-xs cursor-pointer"
                          style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
                        >
                          <option value={4}>4 格</option>
                          <option value={6}>6 格</option>
                          <option value={8}>8 格</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveClock(clk.id)}
                          className="p-1 text-slate-400 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </fieldset>
          </ErrorBoundary>

          {/* Wizard Footer Navigation Bar */}
          <div className="pt-5 border-t flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: theme.border }}>
            <button
              type="button"
              disabled={activeTab <= 1}
              onClick={() => setActiveTab(prev => Math.max(1, prev - 1))}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              style={{ borderColor: theme.border, color: theme.textDark }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一步</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCardPreviewModalOpen(true)}
                className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                style={{ borderColor: theme.border, color: theme.textDark }}
                title="隨時預覽目前填寫之角色卡狀態"
              >
                <GiScrollUnfurled className="w-4 h-4" style={{ color: theme.accent }} />
                <span>查看當前角色卡</span>
              </button>

              {activeTab < TABS.length ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(prev => Math.min(TABS.length, prev + 1))}
                  className="px-5 py-2 rounded-lg text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  style={{ backgroundColor: theme.accent }}
                >
                  <span>下一步</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                onEnterPlayMode && (
                  <JRPGButton
                    variant={theme.buttonVariant || 'primary'}
                    size="md"
                    icon={Play}
                    onClick={onEnterPlayMode}
                  >
                    完成創角，進入跑團卡
                  </JRPGButton>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Character Card View Modal (On-demand inspection) */}
      <JRPGModal
        isOpen={isCardPreviewModalOpen}
        onClose={() => setIsCardPreviewModalOpen(false)}
        title="冒險者角色卡檢視"
        maxWidth="max-w-2xl"
        theme={theme}
        actionButtons={
          <div className="flex items-center gap-2">
            {onEnterPlayMode && (
              <JRPGButton
                variant={theme.buttonVariant || 'primary'}
                size="sm"
                icon={Play}
                onClick={() => {
                  setIsCardPreviewModalOpen(false);
                  onEnterPlayMode();
                }}
              >
                進入跑團實戰
              </JRPGButton>
            )}
            <JRPGButton
              variant="ghost"
              size="sm"
              onClick={() => setIsCardPreviewModalOpen(false)}
            >
              返回編輯
            </JRPGButton>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="text-xs text-slate-500 flex items-center justify-between px-1">
            <span>隨時檢視角色卡排版與構築進度</span>
            <span className="font-mono text-[11px]" style={{ color: theme.accent }}>（填寫中未完成欄位均以空格標註）</span>
          </div>

          <CharacterCard
            character={character}
            themeId={character.themeColor || themeId}
            onAvatarClick={() => {
              setIsCardPreviewModalOpen(false);
              setActiveTab(1);
            }}
          />
        </div>
      </JRPGModal>

      {/* Starter Presets Modal */}
      <StarterPresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        theme={theme}
        onApply={handleApplyPreset}
      />

      {/* Validation Checklist Drawer / Modal */}
      <JRPGModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        title="創角完整度自檢清單"
        maxWidth="max-w-lg"
        theme={theme}
        actionButtons={
          <JRPGButton
            variant={theme.buttonVariant || 'primary'}
            size="sm"
            onClick={() => setIsValidationModalOpen(false)}
          >
            我知道了，關閉
          </JRPGButton>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed -mt-1">
            本清單為輔助提醒，未填寫項<strong>不會強制阻擋</strong>您的儲存或跑團，您可以隨時返回修改。
          </p>

          <div className="space-y-2">
            {validation.warnings.map((w, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveTab(w.step);
                  setIsValidationModalOpen(false);
                }}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] shadow-sm ${
                  w.type === 'error'
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-amber-300 bg-amber-50 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {w.type === 'error' ? (
                    <GiHazardSign className="w-4 h-4 text-red-600 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{w.message}</span>
                </div>
                <span className="font-bold underline shrink-0 text-[11px]">跳轉至步驟 {w.step} ➔</span>
              </div>
            ))}

            {validation.warnings.length === 0 && (
              <div
                className="p-4 rounded-xl border text-center text-xs font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.panelBg, borderColor: theme.border, color: theme.textDark }}
              >
                <GiCheckMark className="w-5 h-5" style={{ color: theme.accent }} />
                <span>恭喜！角色卡所有核心規則與內容完全合規！</span>
              </div>
            )}
          </div>
        </div>
      </JRPGModal>

      {/* Official Identity Tables Inspiration Modal */}
      <IdentityTablesModal
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        onSelectIdentity={(idStr) => updateField('identity', idStr)}
        currentIdentity={character.identity || ''}
        theme={theme}
      />
    </div>
  );
}
