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
  GiCrossedSwords,
  GiBroadsword,
  GiShield,
  GiHeartPlus,
  GiPocketWatch,
  GiSpellBook,
  GiHazardSign,
  GiCheckMark,
  GiMagnifyingGlass,
  GiQuillInk,
  GiCoins,
  GiRollingDices,
  GiLaurelCrown,
  GiScrollUnfurled,
  GiPalette
} from 'react-icons/gi';
import GameIcon from '../../../components/ui/GameIcon';
import JRPGButton from '../../../components/ui/JRPGButton';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import { JRPGInput, JRPGSelect } from '../../../components/ui/JRPGInput';
import StatBadge from '../../../components/ui/StatBadge';
import JRPGModal from '../../../components/ui/JRPGModal';
import CharacterCard from './CharacterCard';
import IdentityTablesModal from './IdentityTablesModal';
import AttributeMatrixPicker from './AttributeMatrixPicker';
import ClassSkillCard from './ClassSkillCard';
import ClassPickerModal from './ClassPickerModal';
import rulesData from '../data/rulesData.json';
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
import { STARTER_PRESETS } from '../data/starterPresets';
import {
  calculateCharacterStats,
  validateCharacter
} from '../utils/characterEngine';

export default function CharacterEditor({
  character,
  themeId = null,
  onSelectGlobalTheme = null,
  onChange,
  onBackToRoster,
  onEnterPlayMode = null,
  showToast = null
}) {
  const [activeTab, setActiveTab] = useState(1);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [presetSearch, setPresetSearch] = useState('');
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isCardPreviewModalOpen, setIsCardPreviewModalOpen] = useState(false);
  const [isCustomTheme, setIsCustomTheme] = useState(() => !CANONICAL_THEMES.includes(character?.theme) && Boolean(character?.theme));
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);
  const [newlyAddedClassName, setNewlyAddedClassName] = useState(null);
  const [selectedHeroicToAdd, setSelectedHeroicToAdd] = useState('');

  if (!character) return null;

  const theme = getCharacterTheme(character.themeColor || themeId);

  // Validation checklist
  const validation = validateCharacter(character);
  const stats = calculateCharacterStats(character);

  const updateField = (field, value) => {
    onChange({
      ...character,
      [field]: value,
      updatedAt: new Date().toISOString()
    });
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
    if (sbKey === 'core') return; // core is locked
    const cur = character.enabledSourcebooks || ['core'];
    const exists = cur.includes(sbKey);
    const updated = exists ? cur.filter(k => k !== sbKey) : [...cur, sbKey];
    updateField('enabledSourcebooks', updated);
  };

  // Filter available classes according to enabled sourcebooks
  const enabledBooks = character.enabledSourcebooks || ['core'];
  const availableClassNames = Object.keys(SOURCEBOOKS)
    .filter(sbKey => enabledBooks.includes(sbKey))
    .flatMap(sbKey => SOURCEBOOKS[sbKey].classes)
    .filter(cName => rulesData.classes[cName]);

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
    ]);
    setNewlyAddedClassName(null);
  };

  const handleUpdateClassSkills = (classIdx, updatedSkills) => {
    const curClasses = JSON.parse(JSON.stringify(character.classes || []));
    if (!curClasses[classIdx]) return;
    curClasses[classIdx].skills = updatedSkills;
    curClasses[classIdx].level = updatedSkills.reduce((sum, s) => sum + s.sl, 0);
    updateField('classes', curClasses);
  };

  const handleRemoveClass = (classNameToRemove) => {
    updateField('classes', (character.classes || []).filter(c => c.className !== classNameToRemove));
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
  const handleApplyPreset = (preset) => {
    onChange({
      ...character,
      name: `${preset.title.split(' ')[0]}`,
      identity: preset.identity,
      theme: preset.theme,
      origin: preset.origin,
      attributes: { ...preset.attributes },
      classes: JSON.parse(JSON.stringify(preset.classes)),
      equipment: { ...preset.equipment },
      bonds: JSON.parse(JSON.stringify(preset.bonds)),
      zenit: preset.zenit,
      updatedAt: new Date().toISOString()
    });
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
    { id: 1, label: '基礎身世', en: 'IDENTITY', icon: 'edit' },
    { id: 2, label: '四維屬性', en: 'ATTRIBUTES', icon: 'dice' },
    { id: 3, label: '職業與技能', en: 'CLASSES', icon: 'swords' },
    { id: 4, label: '裝備配置', en: 'EQUIPMENT', icon: 'shield' },
    { id: 5, label: '情感羈絆', en: 'BONDS', icon: 'hp' },
    { id: 6, label: '特質與命刻', en: 'HEROIC & CLOCKS', icon: 'clock' }
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
  const remainingBudget = 500 - totalEquipCost;

  const handleRollStartingZenit = () => {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const rollSum = (d1 + d2) * 10;
    const finalZenit = Math.max(0, remainingBudget) + rollSum;
    updateField('zenit', finalZenit);
    alert(`[2d6 擲骰] [${d1}] + [${d2}] = ${d1 + d2} (× 10 = ${rollSum}z)！\n加上剩餘裝備預算 ${Math.max(0, remainingBudget)}z，角色的起始儲蓄已結算為 ${finalZenit} 澤尼特！`);
  };

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
            className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border font-bold transition-all shadow-xs hover:scale-102 group text-left cursor-pointer"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.subpanelBg,
              color: theme.textDark
            }}
            title="一鍵套用官方經典職業搭配（職業、特技、屬性骰、裝備配置）"
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

          {/* 5 大步驟縱向清單 */}
          <div
            className="rounded-xl border shadow-xs p-2 flex flex-col gap-1 transition-colors"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
          >
            <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              創角流程
            </div>

            {TABS.map(t => {
              const tabWarnings = validation.warnings.filter(w => w.step === t.id);
              const hasError = tabWarnings.some(w => w.type === 'error');
              const hasWarn = tabWarnings.some(w => w.type !== 'error');
              const isTabActive = activeTab === t.id;

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
                      <div className="truncate text-xs font-bold leading-tight">
                        {t.label}
                      </div>
                      <div className={`text-[10px] font-mono leading-tight mt-0.5 truncate ${
                        isTabActive ? 'text-white/80' : 'text-slate-400'
                      }`}>
                        {t.en}
                      </div>
                    </div>
                  </div>

                  {/* 狀態徽章 */}
                  {hasError ? (
                    <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-200 shrink-0" />
                  ) : hasWarn ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  ) : null}
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
              {TABS.map(t => (
                <option key={t.id} value={t.id}>{t.id}. {t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ==================== 主編輯區域 (Right Main Canvas) ==================== */}
        <div
          className="flex-1 w-full min-w-0 rounded-xl border p-4 sm:p-7 shadow-xs space-y-6 transition-colors"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
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
                      起始 5 級
                    </span>
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={character.level || 5}
                    onChange={e => updateField('level', parseInt(e.target.value, 10) || 5)}
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
                    onChange={e => updateField('zenit', parseInt(e.target.value, 10) || 0)}
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
                  起始 5 級必須分配在 2~3 個不同職業中，每級獲得 1 點技能。
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
                    const isEnabled = (character.enabledSourcebooks || ['core']).includes(sbKey);

                    return (
                      <button
                        key={sbKey}
                        type="button"
                        onClick={() => toggleSourcebook(sbKey)}
                        disabled={sb.locked}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1.5 shadow-xs ${sb.locked ? 'cursor-default' : 'cursor-pointer'}`}
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
                    {character.level <= 5 && <span className="text-[11px] text-slate-500 ml-1">（創角規定：2~3 個職業）</span>}
                  </span>
                </div>

                <JRPGButton
                  variant={theme.buttonVariant || 'primary'}
                  size="sm"
                  icon={Plus}
                  onClick={() => setIsClassPickerOpen(true)}
                  disabled={(character.classes || []).length >= 3 && (character.level || 5) <= 5}
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
                        《Fabula Ultima》開局角色需要在 2~3 個職業中探索分配起始 5 級。
                      </p>
                    </div>
                    <JRPGButton
                      variant={theme.buttonVariant || 'primary'}
                      size="sm"
                      icon={Plus}
                      onClick={() => setIsClassPickerOpen(true)}
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
                      theme={theme}
                      isInitialEdit={newlyAddedClassName === cl.className}
                      onUpdateSkills={handleUpdateClassSkills}
                      onRemoveClass={handleRemoveClass}
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
                existingClassNames={(character.classes || []).map(c => c.className)}
                onSelectClass={handleSelectClassFromPicker}
              />
            </div>
          )}

          {/* ==================== TAB 4: 裝備配置 ==================== */}
          {activeTab === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg flex items-center gap-2" style={{ color: theme.textDark }}>
                  <span style={{ color: theme.accent }}>4.</span> 裝備庫與熟練度檢核
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  即時計算物理防禦、魔法防禦與先攻修正。
                </p>
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
                    <span>起始裝備預算 500z</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span>已花費: <strong style={{ color: theme.accent }}>{totalEquipCost}z</strong> / 500z</span>
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

              {/* Warnings */}
              {(stats.armorWarning || stats.shieldWarning) && (
                <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-1">
                  {stats.armorWarning && (
                    <div className="flex items-center gap-1.5">
                      <GiHazardSign className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>目前穿戴軍用防具 (重甲)，但當前職業組合並無重甲熟練度。</span>
                    </div>
                  )}
                  {stats.shieldWarning && (
                    <div className="flex items-center gap-1.5">
                      <GiHazardSign className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>目前裝備軍用盾牌，但當前職業組合並無軍用盾熟練度。</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <JRPGSelect
                  label="主手武器"
                  theme={theme}
                  value={character.equipment?.mainHand || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, mainHand: e.target.value })}
                  options={rulesData.equipment.weapons.map(w => ({
                    value: w.name,
                    label: `${w.name} [${w.range}] (${w.damage}) - ${w.cost}z`
                  }))}
                />

                <JRPGSelect
                  label="副手裝備 / 盾牌"
                  theme={theme}
                  value={character.equipment?.offHand || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, offHand: e.target.value })}
                  options={[
                    ...rulesData.equipment.shields.map(s => ({
                      value: s.name,
                      label: `【盾牌】${s.name} ${s.desc ? `(${s.desc})` : ''} - ${s.cost}z`
                    })),
                    ...rulesData.equipment.weapons.filter(w => w.hands === 1 && w.name !== '無手空拳').map(w => ({
                      value: w.name,
                      label: `【副手武器】${w.name} (${w.damage}) - ${w.cost}z`
                    }))
                  ]}
                />

                <JRPGSelect
                  label="身體防具"
                  theme={theme}
                  value={character.equipment?.armor || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, armor: e.target.value })}
                  options={rulesData.equipment.armors.map(a => ({
                    value: a.name,
                    label: `${a.name} (${a.desc}) - ${a.cost}z`
                  }))}
                />

                <JRPGSelect
                  label="佩戴飾品"
                  theme={theme}
                  value={character.equipment?.accessory || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, accessory: e.target.value })}
                  options={rulesData.equipment.accessories.map(acc => ({
                    value: acc.name,
                    label: `${acc.name} (${acc.desc}) - ${acc.cost}z`
                  }))}
                />
              </div>
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
                    {rulesData.quirks.find(q => q.name === character.quirk)?.desc}
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
                        <p className="text-[11px] text-slate-600 mt-0.5">{hs.effect}</p>
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
      <JRPGModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        title="《FU》官方經典職業搭配"
        maxWidth="max-w-4xl"
        theme={theme}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed -mt-1">
            嚴格遵循官方核心規則書 (v1.1 Errata 校正版 p.172-175) 實裝。包含全套 20 組經典職業搭配、特技分配、起始裝備與資金。
          </p>

          {/* Search filter */}
          <div className="relative">
            <input
              type="text"
              value={presetSearch}
              onChange={e => setPresetSearch(e.target.value)}
              placeholder="搜尋經典搭配名稱、職業或特技（例如：黑騎士、神射手、修補匠、暗影突襲）..."
              className="w-full px-3.5 py-2 pl-9 text-xs rounded-xl bg-white border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 shadow-2xs"
              style={{ borderColor: theme.border }}
            />
            <GiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {presetSearch && (
              <button
                type="button"
                onClick={() => setPresetSearch('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                清除
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {STARTER_PRESETS
              .filter(preset => {
                if (!presetSearch.trim()) return true;
                const q = presetSearch.toLowerCase();
                const matchTitle = preset.title.toLowerCase().includes(q);
                const matchSubtitle = preset.subtitle.toLowerCase().includes(q);
                const matchIdentity = preset.identity.toLowerCase().includes(q);
                const matchClasses = preset.classes.some(c => 
                  c.className.toLowerCase().includes(q) || 
                  c.skills.some(s => s.name.toLowerCase().includes(q))
                );
                return matchTitle || matchSubtitle || matchIdentity || matchClasses;
              })
              .map(preset => (
                <div
                  key={preset.id}
                  className="rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all shadow-xs hover:shadow-md"
                  style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-black text-base" style={{ color: theme.textDark }}>
                        {preset.title}
                      </span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded border font-mono shadow-2xs"
                        style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark }}
                      >
                        {preset.zenit}z
                      </span>
                    </div>
                    <div className="text-xs font-bold" style={{ color: theme.accent }}>{preset.subtitle}</div>
                    <p className="text-[11px] text-slate-600 italic leading-relaxed">{preset.tagline}</p>

                    {/* Class badges & Attribute array */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[11px]">
                      {preset.classes.map((c, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded border font-bold flex items-center gap-1"
                          style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark }}
                        >
                          <GameIcon name={c.className} size={12} style={{ color: theme.accent }} />
                          {c.className} Lv{c.level}
                        </span>
                      ))}
                      <span className="text-slate-400 text-[10px]">
                        [DEX d{preset.attributes.dex}, INS d{preset.attributes.ins}, MIG d{preset.attributes.mig}, WLP d{preset.attributes.wlp}]
                      </span>
                    </div>

                    {/* Skills detail */}
                    <div
                      className="text-[11px] text-slate-700 bg-white/90 rounded-lg p-2.5 border space-y-1 shadow-2xs"
                      style={{ borderColor: theme.border }}
                    >
                      <div className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.accent }}>
                        習得技能
                      </div>
                      {preset.classes.map((c, i) => (
                        <div key={i} className="text-[11px] leading-tight">
                          <span className="font-bold" style={{ color: theme.textDark }}>{c.className}:</span>{' '}
                          {c.skills.map(s => `${s.name}${s.sl > 1 ? ` SL${s.sl}` : ''}`).join('、')}
                        </div>
                      ))}
                    </div>

                    {/* Starting Equipment */}
                    <div
                      className="text-[11px] text-slate-600 bg-white/70 rounded-lg px-2.5 py-1.5 border flex items-center gap-1.5 shadow-2xs"
                      style={{ borderColor: theme.border }}
                    >
                      <span className="font-bold text-slate-700">裝備:</span>{' '}
                      {[
                        preset.equipment.mainHand,
                        preset.equipment.offHand && preset.equipment.offHand !== '無盾牌' ? preset.equipment.offHand : null,
                        preset.equipment.armor
                      ].filter(Boolean).join('、')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="w-full py-2 rounded-lg text-white font-bold text-xs shadow-xs transition-all hover:opacity-90 active:scale-98 cursor-pointer"
                    style={{ backgroundColor: theme.accent }}
                  >
                    套用此經典配置
                  </button>
                </div>
            ))}
          </div>
        </div>
      </JRPGModal>

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
