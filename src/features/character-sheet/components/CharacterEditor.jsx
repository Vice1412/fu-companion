import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Shield,
  Heart,
  Swords,
  Clock,
  BookOpen,
  Info,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  Play
} from 'lucide-react';
import JRPGButton from '../../../components/ui/JRPGButton';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import { JRPGInput, JRPGSelect } from '../../../components/ui/JRPGInput';
import StatBadge from '../../../components/ui/StatBadge';
import CharacterCard from './CharacterCard';
import rulesData from '../data/rulesData.json';
import {
  SOURCEBOOKS,
  BOND_FEELINGS,
  CANONICAL_THEMES,
  ATTRIBUTE_STARTING_ARRAYS
} from '../data/sourcebookConfig';
import { STARTER_PRESETS } from '../data/starterPresets';
import {
  calculateCharacterStats,
  validateCharacter
} from '../utils/characterEngine';

export default function CharacterEditor({
  character,
  onChange,
  onBackToRoster,
  onEnterPlayMode = null
}) {
  const [activeTab, setActiveTab] = useState(1);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [selectedClassToAdd, setSelectedClassToAdd] = useState('');
  const [selectedHeroicToAdd, setSelectedHeroicToAdd] = useState('');

  if (!character) return null;

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
  const handleAddClass = () => {
    if (!selectedClassToAdd || !rulesData.classes[selectedClassToAdd]) return;
    const curClasses = character.classes || [];
    if (curClasses.some(c => c.className === selectedClassToAdd)) return;

    const classDef = rulesData.classes[selectedClassToAdd];
    const initialSkill = classDef.skills?.[0] ? [{ name: classDef.skills[0].name, sl: 1 }] : [];

    updateField('classes', [
      ...curClasses,
      {
        className: selectedClassToAdd,
        level: 1,
        skills: initialSkill
      }
    ]);
    setSelectedClassToAdd('');
  };

  const handleRemoveClass = (classNameToRemove) => {
    updateField('classes', (character.classes || []).filter(c => c.className !== classNameToRemove));
  };

  const handleAddSkillToClass = (classIdx, skillName) => {
    const curClasses = JSON.parse(JSON.stringify(character.classes || []));
    const targetClass = curClasses[classIdx];
    if (targetClass.skills.some(s => s.name === skillName)) return;

    targetClass.skills.push({ name: skillName, sl: 1 });
    targetClass.level = targetClass.skills.reduce((sum, s) => sum + s.sl, 0);
    updateField('classes', curClasses);
  };

  const handleUpdateSkillSL = (classIdx, skillIdx, delta) => {
    const curClasses = JSON.parse(JSON.stringify(character.classes || []));
    const targetClass = curClasses[classIdx];
    const targetSkill = targetClass.skills[skillIdx];
    const classDef = rulesData.classes[targetClass.className];
    const skillDef = classDef?.skills?.find(s => s.name === targetSkill.name);
    const maxSL = skillDef?.maxSL || 5;

    const newSL = Math.max(1, Math.min(maxSL, targetSkill.sl + delta));
    targetSkill.sl = newSL;
    targetClass.level = targetClass.skills.reduce((sum, s) => sum + s.sl, 0);

    updateField('classes', curClasses);
  };

  const handleRemoveSkillFromClass = (classIdx, skillIdx) => {
    const curClasses = JSON.parse(JSON.stringify(character.classes || []));
    curClasses[classIdx].skills.splice(skillIdx, 1);
    curClasses[classIdx].level = curClasses[classIdx].skills.reduce((sum, s) => sum + s.sl, 0);
    updateField('classes', curClasses);
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
    { id: 1, label: '基礎身世' },
    { id: 2, label: '四維屬性' },
    { id: 3, label: '職業與特技' },
    { id: 4, label: '裝備配置' },
    { id: 5, label: '情感羈絆' },
    { id: 6, label: '特質與命刻' }
  ];

  // Attribute sum
  const attrSum = (character.attributes?.dex || 0) + (character.attributes?.ins || 0) + (character.attributes?.mig || 0) + (character.attributes?.wlp || 0);

  return (
    <div className="space-y-4">
      {/* Top Header & Wizard Controls */}
      <div className="bg-[#fffdf9] border border-[#d6c7ab] rounded-xl px-4 py-3 flex items-center justify-between shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <JRPGButton
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={onBackToRoster}
          >
            返回名冊
          </JRPGButton>

          <div className="h-4 w-[1px] bg-[#d6c7ab]" />

          <div className="flex items-center gap-2">
            <h3 className="font-serif font-black text-base text-[#3c2415] truncate max-w-[160px] sm:max-w-xs">
              {character.name || '新冒險者'}
            </h3>
            <JRPGBadge variant="gold" size="xs">
              Lv {character.level || 5}
            </JRPGBadge>
          </div>

          {/* Preset Starter Button */}
          <button
            onClick={() => setIsPresetsModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-sm"
            title="查看或套用官方 8 大起始經典配置"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>官方經典配置</span>
          </button>
        </div>

        {/* Right Tools: Validation checklist badge + Play mode + Prev/Next */}
        <div className="flex items-center gap-2">
          {/* Validation Checklist Trigger */}
          <button
            onClick={() => setIsValidationModalOpen(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
              validation.errors.length > 0
                ? 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
                : validation.hasWarnings
                ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
            }`}
            title="點擊查看完整創角提醒清單"
          >
            {validation.errors.length > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            ) : validation.hasWarnings ? (
              <Info className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="hidden sm:inline">
              {validation.errors.length > 0
                ? `${validation.errors.length} 項錯誤待修正`
                : validation.hasWarnings
                ? `${validation.warnings.length} 項提醒`
                : '配置完整合規'}
            </span>
          </button>

          {/* Quick Enter Play Mode button */}
          {onEnterPlayMode && (
            <JRPGButton
              variant="primary"
              size="xs"
              icon={Play}
              onClick={onEnterPlayMode}
            >
              進入跑團卡
            </JRPGButton>
          )}

          <div className="h-4 w-[1px] bg-[#d6c7ab]" />

          {/* Step Prev / Next */}
          <div className="flex items-center gap-1.5">
            <button
              disabled={activeTab <= 1}
              onClick={() => setActiveTab(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-[#d6c7ab] bg-[#fffdf9] hover:bg-[#f5efdf] text-[#3c2415] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="上一步"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-[#6b5a4b] font-bold px-1">
              {activeTab} / {TABS.length}
            </span>
            <button
              disabled={activeTab >= TABS.length}
              onClick={() => setActiveTab(prev => Math.min(TABS.length, prev + 1))}
              className="p-1.5 rounded-lg border border-[#d6c7ab] bg-[#fffdf9] hover:bg-[#f5efdf] text-[#3c2415] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="下一步"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#d6c7ab]">
        {TABS.map(t => {
          const tabWarnings = validation.warnings.filter(w => w.step === t.id);
          const hasError = tabWarnings.some(w => w.type === 'error');
          const hasWarn = tabWarnings.some(w => w.type !== 'error');

          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === t.id
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-[#eee6d3] text-[#3c2f21] hover:bg-[#e4d9c0] border border-[#d6c7ab]'
              }`}
            >
              <span className="font-mono text-[10px] opacity-75">{t.id}.</span>
              <span>{t.label}</span>
              {hasError ? (
                <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-200 shrink-0" />
              ) : hasWarn ? (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Split Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Editor Form Wizard */}
        <div className="lg:col-span-7 bg-[#fffdf9] rounded-xl border border-[#d6c7ab] p-5 sm:p-6 shadow-sm space-y-6 text-[#2c221e]">

          {/* ==================== TAB 1: 基礎身世 ==================== */}
          {activeTab === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                    <span className="text-amber-800">1.</span> 角色核心身份 (Identity, Theme & Origin)
                  </h4>
                  <p className="text-xs text-[#6b5a4b] mt-1 leading-relaxed">
                    在《FU》中，身份、主題與故鄉不僅是敘事背景，玩家更可在關鍵擲骰中消耗物語點（FP）將其轉化為骰子加值！
                  </p>
                </div>

                <button
                  onClick={() => setIsPresetsModalOpen(true)}
                  className="sm:hidden px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold shrink-0"
                >
                  ✨ 範本
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <JRPGInput
                  label="角色姓名 (Name)"
                  value={character.name || ''}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="例：雷恩 (Rain)"
                />
                <JRPGInput
                  label="角色等級 (Level: 起始為 5 級，最高 50 級)"
                  type="number"
                  min={5}
                  max={50}
                  value={character.level || 5}
                  onChange={e => updateField('level', parseInt(e.target.value, 10) || 5)}
                />
              </div>

              <div className="space-y-3">
                <JRPGInput
                  label="身份 (Identity - 誰是你？包含頭銜、職業或宿命)"
                  value={character.identity || ''}
                  onChange={e => updateField('identity', e.target.value)}
                  placeholder="例：失去記憶的原帝國魔導兵、被神明驅逐的聖樂使"
                />

                {/* Identity quick pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#8c7b6c] font-medium">範例靈感:</span>
                  {[
                    '前帝國退役魔導兵',
                    '古代遺跡流浪學者',
                    '追尋真理的聖殿騎士',
                    '邊陲古林通靈獵手',
                    '行商公會天才發明家'
                  ].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => updateField('identity', sug)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#f5efdf] hover:bg-[#ebdcc4] text-[#3c2415] border border-[#d6c7ab]"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-[#3c2f21] block mb-1">
                      主題 (Theme - 指引你前行的信念)
                    </label>
                    <select
                      value={character.theme || '希望 (Hope)'}
                      onChange={e => updateField('theme', e.target.value)}
                      className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-2 text-xs text-[#2c221e] outline-none focus:border-amber-700 shadow-sm"
                    >
                      {CANONICAL_THEMES.map(theme => (
                        <option key={theme} value={theme}>{theme}</option>
                      ))}
                    </select>
                  </div>

                  <JRPGInput
                    label="故鄉 (Origin - 你的發源地)"
                    value={character.origin || ''}
                    onChange={e => updateField('origin', e.target.value)}
                    placeholder="例：浮空島王國、千年翡翠古林"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <JRPGInput
                    label="初始持有金幣 (Zenit)"
                    type="number"
                    value={character.zenit !== undefined ? character.zenit : 500}
                    onChange={e => updateField('zenit', parseInt(e.target.value, 10) || 0)}
                  />
                  <JRPGInput
                    label="初始物語點 (Fabula Points)"
                    type="number"
                    value={character.fabulaPoints !== undefined ? character.fabulaPoints : 3}
                    onChange={e => updateField('fabulaPoints', parseInt(e.target.value, 10) || 3)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: 四維屬性 ==================== */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">2.</span> 四維基礎屬性骰 (Attribute Dice)
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  《FU》的四項基礎屬性直接代表你所投擲的骰子面數（d6、d8、d10、d12）。起始總骰階點數應為 <strong className="text-amber-900 font-mono">32</strong>。
                </p>
              </div>

              {/* Canonical Array Selector */}
              <div className="p-3.5 bg-[#f5efdf] rounded-xl border border-[#d6c7ab] space-y-2">
                <span className="text-xs font-bold text-[#3c2415] block">
                  官方三大起始陣列（點擊一鍵套用）:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ATTRIBUTE_STARTING_ARRAYS.map(arr => (
                    <button
                      key={arr.id}
                      type="button"
                      onClick={() => updateField('attributes', { ...arr.dice })}
                      className="text-left p-2.5 rounded-lg bg-[#fffdf9] hover:bg-[#fbf7ee] border border-[#d6c7ab] transition-all hover:scale-[1.01] shadow-sm flex flex-col justify-between"
                    >
                      <div className="font-bold text-xs text-[#3c2415]">{arr.name}</div>
                      <div className="font-mono text-[11px] text-amber-900 font-bold mt-1">
                        d{arr.dice.dex}, d{arr.dice.ins}, d{arr.dice.mig}, d{arr.dice.wlp}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Attributes Stepper */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                  { key: 'dex', name: '敏捷 (DEX)', desc: '精確、速度、物理迴避' },
                  { key: 'ins', name: '洞察 (INS)', desc: '感知、法力、魔法防禦' },
                  { key: 'mig', name: '體魄 (MIG)', desc: '強韌、生命值 (HP)' },
                  { key: 'wlp', name: '意志 (WLP)', desc: '毅力、法力值 (MP)' }
                ].map(stat => (
                  <div key={stat.key} className="bg-[#fbf7ee] border border-[#d6c7ab] rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm text-center">
                    <span className="font-bold text-xs text-[#3c2415]">{stat.name}</span>
                    <StatBadge
                      stat={stat.key}
                      value={character.attributes?.[stat.key] || 8}
                      onChange={newVal => updateAttribute(stat.key, newVal)}
                      size="lg"
                    />
                    <span className="text-[10px] text-[#6b5a4b] leading-tight mt-1">{stat.desc}</span>
                  </div>
                ))}
              </div>

              {/* Point Balance Alert */}
              <div className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
                attrSum === 32
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-amber-300 bg-amber-50 text-amber-900'
              }`}>
                <span>當前骰面總點數: <strong>{attrSum}</strong> / 32</span>
                <span>
                  {attrSum === 32
                    ? '✅ 點數完全平衡'
                    : attrSum < 32
                    ? `⚠️ 尚有 ${32 - attrSum} 點未分配`
                    : `⚠️ 超出 ${attrSum - 32} 點，請適當降低`}
                </span>
              </div>
            </div>
          )}

          {/* ==================== TAB 3: 職業與特技 ==================== */}
          {activeTab === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">3.</span> 職業組合與特技加點 (Classes & Skills)
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  起始 5 級必須在 <strong className="text-amber-900 font-bold">2~3 個職業</strong> 中分配等級（單職最高 4 級）。每升 1 級職業獲得 1 點特技等級 (SL)。
                </p>
              </div>

              {/* Sourcebook Expansion Toggles */}
              <div className="p-3.5 bg-[#f5efdf] rounded-xl border border-[#d6c7ab] space-y-2">
                <span className="text-xs font-bold text-[#3c2415] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                  啟用官方拓展手冊（勾選以解鎖該拓展專屬職業）:
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
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                          isEnabled
                            ? 'bg-amber-700 text-white border-amber-800'
                            : 'bg-white text-stone-600 border-[#d6c7ab] hover:bg-stone-50'
                        } ${sb.locked ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {isEnabled ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>{sb.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level Budget Guard Bar */}
              <div className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
                stats.isLevelMatched
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-amber-300 bg-amber-50 text-amber-900'
              }`}>
                <span>
                  已分配特技點數: <strong>{stats.totalSkillLevels}</strong> / {character.level || 5} 級
                </span>
                <span>
                  {stats.isLevelMatched
                    ? '✅ 職業特技分配完整'
                    : stats.totalSkillLevels < (character.level || 5)
                    ? `⚠️ 尚有 ${(character.level || 5) - stats.totalSkillLevels} 點特技未分配`
                    : `⚠️ 超出 ${stats.totalSkillLevels - (character.level || 5)} 點`}
                </span>
              </div>

              {/* Add Class Picker */}
              <div className="flex items-center gap-2 p-3 bg-[#fffdf9] rounded-xl border border-[#d6c7ab]">
                <select
                  value={selectedClassToAdd}
                  onChange={e => setSelectedClassToAdd(e.target.value)}
                  className="flex-1 bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-2 text-xs text-[#2c221e] outline-none focus:border-amber-700 shadow-sm"
                >
                  <option value="">-- 挑選欲修習的職業 --</option>
                  {availableClassNames.map(cName => {
                    const cl = rulesData.classes[cName];
                    const isAlready = (character.classes || []).some(c => c.className === cName);
                    return (
                      <option key={cName} value={cName} disabled={isAlready}>
                        {cName} {cl?.freeBonus ? `(${cl.freeBonus})` : ''} {isAlready ? '(已修習)' : ''}
                      </option>
                    );
                  })}
                </select>

                <JRPGButton
                  variant="primary"
                  size="xs"
                  icon={Plus}
                  onClick={handleAddClass}
                  disabled={!selectedClassToAdd}
                >
                  修習新職業
                </JRPGButton>
              </div>

              {/* Configured Classes & Skills */}
              <div className="space-y-4">
                {(character.classes || []).map((cl, cIdx) => {
                  const classDef = rulesData.classes[cl.className] || {};
                  return (
                    <div key={cl.className} className="bg-[#fbf7ee] rounded-xl p-4 border border-[#d6c7ab] space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-[#d6c7ab] pb-2">
                        <div className="flex items-center gap-2">
                          <h5 className="font-serif font-black text-base text-[#3c2415]">
                            {cl.className}
                          </h5>
                          <JRPGBadge variant="gold" size="xs">
                            Lv {cl.level}
                          </JRPGBadge>
                          {classDef.freeBonus && (
                            <span className="text-[11px] text-emerald-800 font-mono font-bold">
                              {classDef.freeBonus}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveClass(cl.className)}
                          className="text-[#8c7b6c] hover:text-red-700 p-1 transition-colors"
                          title="移除職業"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Skills in Class */}
                      <div className="space-y-2">
                        {(cl.skills || []).map((sk, sIdx) => {
                          const skillDef = classDef.skills?.find(s => s.name === sk.name);
                          const maxSL = skillDef?.maxSL || 5;

                          return (
                            <div key={sk.name} className="bg-[#fffdf9] rounded-lg p-3 border border-[#d6c7ab] text-xs flex flex-col gap-1.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#3c2415] flex items-center gap-1.5">
                                  <span className="text-amber-700">✦</span> {sk.name}
                                </span>

                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[#6b5a4b] font-bold">
                                    SL {sk.sl} / {maxSL}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSkillSL(cIdx, sIdx, -1)}
                                      disabled={sk.sl <= 1}
                                      className="px-1.5 py-0.5 rounded bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] disabled:opacity-30"
                                    >
                                      -
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSkillSL(cIdx, sIdx, 1)}
                                      disabled={sk.sl >= maxSL}
                                      className="px-1.5 py-0.5 rounded bg-[#eee6d3] hover:bg-[#e4d9c0] text-[#3c2f21] border border-[#d6c7ab] disabled:opacity-30"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkillFromClass(cIdx, sIdx)}
                                    className="text-[#8c7b6c] hover:text-red-700 ml-1 font-bold"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>

                              <p className="text-[11px] text-[#6b5a4b] leading-relaxed">
                                {skillDef?.desc || ''}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add another skill from class */}
                      {classDef.skills && (
                        <div className="pt-1">
                          <select
                            onChange={e => {
                              if (e.target.value) {
                                handleAddSkillToClass(cIdx, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-1.5 text-xs text-[#6b5a4b] focus:outline-none shadow-sm"
                          >
                            <option value="" disabled>+ 添加此職業的其他技能...</option>
                            {classDef.skills.map(sk => (
                              <option key={sk.name} value={sk.name} disabled={(cl.skills || []).some(s => s.name === sk.name)}>
                                {sk.name} (Max SL: {sk.maxSL})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== TAB 4: 裝備配置 ==================== */}
          {activeTab === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">4.</span> 裝備庫與熟練度檢核 (Equipment)
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  裝備會即時自動計算物理防禦（DEF）、魔法防禦（M.DEF）與先攻修正。若穿戴缺乏熟練度的軍用防具或盾牌，下方將給予提示。
                </p>
              </div>

              {/* Proficiencies Indicator */}
              <div className="p-3 bg-[#f5efdf] rounded-xl border border-[#d6c7ab] flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="font-bold text-[#3c2415]">當前角色軍用熟練度:</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${stats.profs.martialMelee ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-500'}`}>
                    軍用近戰 {stats.profs.martialMelee ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${stats.profs.martialRanged ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-500'}`}>
                    軍用遠程 {stats.profs.martialRanged ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${stats.profs.martialArmor ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-500'}`}>
                    軍用重甲 {stats.profs.martialArmor ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${stats.profs.martialShields ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-500'}`}>
                    軍用盾牌 {stats.profs.martialShields ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              {/* Warnings */}
              {(stats.armorWarning || stats.shieldWarning) && (
                <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-1">
                  {stats.armorWarning && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>目前穿戴軍用防具 (重甲)，但當前職業組合並無重甲熟練度。</span>
                    </div>
                  )}
                  {stats.shieldWarning && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>目前裝備軍用盾牌，但當前職業組合並無軍用盾熟練度。</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <JRPGSelect
                  label="主手武器 (Main Hand)"
                  value={character.equipment?.mainHand || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, mainHand: e.target.value })}
                  options={rulesData.equipment.weapons.map(w => ({
                    value: w.name,
                    label: `${w.name} [${w.range}] (${w.damage}) - ${w.cost}z`
                  }))}
                />

                <JRPGSelect
                  label="副手裝備 / 盾牌 (Off Hand)"
                  value={character.equipment?.offHand || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, offHand: e.target.value })}
                  options={rulesData.equipment.shields.map(s => ({
                    value: s.name,
                    label: `${s.name} ${s.desc ? `(${s.desc})` : ''} - ${s.cost}z`
                  }))}
                />

                <JRPGSelect
                  label="身體防具 (Armor)"
                  value={character.equipment?.armor || ''}
                  onChange={e => updateField('equipment', { ...character.equipment, armor: e.target.value })}
                  options={rulesData.equipment.armors.map(a => ({
                    value: a.name,
                    label: `${a.name} (${a.desc}) - ${a.cost}z`
                  }))}
                />

                <JRPGSelect
                  label="佩戴飾品 (Accessory)"
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
                  <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                    <span className="text-amber-800">5.</span> 情感羈絆系統 (Bonds & Feelings)
                  </h4>
                  <p className="text-xs text-[#6b5a4b] mt-1">
                    每位角色最多可維繫 6 個羈絆，每個羈絆包含 1~3 種情感維度。在跑團擲骰時，可消耗 1 FP 將羈絆強度加入檢定！
                  </p>
                </div>

                <JRPGButton
                  variant="primary"
                  size="xs"
                  icon={Plus}
                  onClick={handleAddBond}
                  disabled={(character.bonds || []).length >= 6}
                >
                  新增羈絆 ({(character.bonds || []).length}/6)
                </JRPGButton>
              </div>

              {/* Bonds List */}
              <div className="space-y-3">
                {(character.bonds || []).map((bond, bIdx) => (
                  <div key={bond.id || bIdx} className="bg-[#fbf7ee] rounded-xl p-3.5 border border-[#d6c7ab] space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={bond.target || ''}
                          onChange={e => handleUpdateBondTarget(bIdx, e.target.value)}
                          placeholder="羈絆對象 (例：同行法師、王國舊友、死敵首領)..."
                          className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-1.5 text-xs text-[#2c221e] font-bold outline-none focus:border-amber-700 shadow-sm"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <JRPGBadge variant="gold" size="xs">
                          強度 +{bond.feelings?.length || 0}
                        </JRPGBadge>
                        <button
                          type="button"
                          onClick={() => handleRemoveBond(bIdx)}
                          className="p-1 text-[#8c7b6c] hover:text-red-700 font-bold"
                          title="移除羈絆"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Feelings Toggle Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#d6c7ab]/60">
                      {BOND_FEELINGS.map(pair => (
                        <div key={pair.category} className="flex items-center gap-1">
                          {pair.options.map(opt => {
                            const isSelected = (bond.feelings || []).includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleToggleBondFeeling(bIdx, opt.id, pair.category)}
                                className={`flex-1 text-[11px] py-1 px-1.5 rounded border transition-all text-center flex items-center justify-center gap-1 ${
                                  isSelected
                                    ? 'bg-amber-700 text-white border-amber-800 font-bold shadow-sm'
                                    : 'bg-[#fffdf9] text-[#6b5a4b] border-[#d6c7ab] hover:bg-[#f5efdf]'
                                }`}
                              >
                                <span>{opt.icon}</span>
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
                  <div className="text-center py-6 border-2 border-dashed border-[#d6c7ab] rounded-xl text-xs text-[#8c7b6c]">
                    尚未建立任何羈絆。官方規則強烈建議起始至少建立 1 個羈絆。
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB 6: 特質與命刻 ==================== */}
          {activeTab === 6 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">6.</span> 英雄技能、特質與個人命刻
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  當職業完全精通（達到 10 級）或特殊劇情節點時，可在此解鎖英雄技能（Heroic Skills）。
                </p>
              </div>

              {/* Quirk Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3c2f21]">
                  金手指特質 (Quirk)
                </label>
                <select
                  value={character.quirk || '無'}
                  onChange={e => updateField('quirk', e.target.value)}
                  className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3.5 py-2 text-xs text-[#2c221e] outline-none shadow-sm"
                >
                  <option value="無">無特殊金手指</option>
                  {rulesData.quirks.map(q => (
                    <option key={q.name} value={q.name}>{q.name}</option>
                  ))}
                </select>
                {character.quirk && character.quirk !== '無' && (
                  <p className="text-[11px] text-[#6b5a4b] italic p-2.5 bg-[#f5efdf] rounded-lg border border-[#d6c7ab]">
                    {rulesData.quirks.find(q => q.name === character.quirk)?.desc}
                  </p>
                )}
              </div>

              {/* Heroic Skills */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#3c2f21]">
                    掌握之英雄技能 (Heroic Skills)
                  </label>
                  {stats.masteredClasses.length > 0 && (
                    <span className="text-xs font-bold text-amber-900 font-mono">
                      已精通職業: {stats.masteredClasses.join(', ')} (具備英雄技能資格)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedHeroicToAdd}
                    onChange={e => setSelectedHeroicToAdd(e.target.value)}
                    className="flex-1 bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-1.5 text-xs text-[#2c221e] outline-none shadow-sm"
                  >
                    <option value="">-- 選擇英雄技能 --</option>
                    {rulesData.heroicSkills.map(h => (
                      <option key={h.name} value={h.name}>
                        {h.name} [{h.requirement}]
                      </option>
                    ))}
                  </select>
                  <JRPGButton
                    variant="primary"
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
                    <div key={idx} className="bg-[#fbf7ee] rounded-lg p-3 border border-[#d6c7ab] text-xs flex items-start justify-between gap-3 shadow-sm">
                      <div>
                        <div className="font-bold text-blue-900">👑 {hs.name}</div>
                        <p className="text-[11px] text-[#6b5a4b] mt-0.5">{hs.effect}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateField('heroicSkills', character.heroicSkills.filter((_, i) => i !== idx));
                        }}
                        className="text-[#8c7b6c] hover:text-red-700 font-bold"
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
                  <label className="text-xs font-bold text-[#3c2f21]">
                    個人誓約命刻 (Personal Clocks)
                  </label>
                  <JRPGButton
                    variant="secondary"
                    size="xs"
                    icon={Plus}
                    onClick={handleAddClock}
                  >
                    新增命刻
                  </JRPGButton>
                </div>

                <div className="space-y-2">
                  {(character.clocks || []).map(clk => (
                    <div key={clk.id} className="bg-[#fbf7ee] rounded-xl p-3 border border-[#d6c7ab] flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={clk.title || ''}
                          onChange={e => {
                            const updated = character.clocks.map(c => c.id === clk.id ? { ...c, title: e.target.value } : c);
                            updateField('clocks', updated);
                          }}
                          placeholder="命刻目標..."
                          className="bg-transparent font-bold text-xs text-[#2c221e] outline-none w-full border-b border-transparent focus:border-amber-700"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={clk.totalSegments || 6}
                          onChange={e => {
                            const updated = character.clocks.map(c => c.id === clk.id ? { ...c, totalSegments: parseInt(e.target.value, 10) } : c);
                            updateField('clocks', updated);
                          }}
                          className="bg-[#fffdf9] border border-[#d6c7ab] rounded px-2 py-1 text-xs text-[#2c221e]"
                        >
                          <option value={4}>4 格</option>
                          <option value={6}>6 格</option>
                          <option value={8}>8 格</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveClock(clk.id)}
                          className="p-1 text-[#8c7b6c] hover:text-red-700"
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

        </div>

        {/* Right: Sticky Live Card Preview */}
        <div className="lg:col-span-5 sticky top-24 space-y-3">
          <div className="text-xs font-mono text-[#6b5a4b] flex items-center justify-between font-bold px-1">
            <span>即時角色卡預覽 (Live Card Preview)</span>
            <span className="text-amber-800 font-serif">實時雙向同步</span>
          </div>

          <CharacterCard
            character={character}
          />
        </div>
      </div>

      {/* Starter Presets Modal */}
      {isPresetsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fffdf9] border-2 border-[#d6c7ab] rounded-2xl p-5 sm:p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d6c7ab] pb-3">
              <div>
                <h3 className="font-serif font-black text-xl text-[#3c2415] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-700" />
                  《FU》官方 8 大起始經典配置範本
                </h3>
                <p className="text-xs text-[#6b5a4b] mt-0.5">
                  精選官方核心規則書推薦之經典職業、屬性與特技組合，一鍵套用即可即刻啟程！
                </p>
              </div>
              <button
                onClick={() => setIsPresetsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {STARTER_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  className="bg-[#fbf7ee] rounded-xl border border-[#d6c7ab] p-4 flex flex-col justify-between gap-3 hover:border-amber-600 transition-all shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-black text-base text-[#3c2415]">
                        {preset.avatar} {preset.title}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-amber-900">{preset.subtitle}</div>
                    <p className="text-[11px] text-[#6b5a4b] italic leading-relaxed">{preset.tagline}</p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[11px]">
                      {preset.classes.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#f5efdf] border border-amber-300 text-amber-950 font-bold">
                          {c.className} Lv{c.level}
                        </span>
                      ))}
                      <span className="text-[#8c7b6c]">
                        [d{preset.attributes.dex}, d{preset.attributes.ins}, d{preset.attributes.mig}, d{preset.attributes.wlp}]
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="w-full py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
                  >
                    套用此經典配置
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Validation Checklist Drawer / Modal */}
      {isValidationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fffdf9] border-2 border-[#d6c7ab] rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d6c7ab] pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif font-black text-lg text-[#3c2415]">
                  創角完整度自檢清單 (Checklist)
                </h3>
              </div>
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6b5a4b] leading-relaxed">
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
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{w.message}</span>
                  </div>
                  <span className="font-bold underline shrink-0 text-[11px]">跳轉至步驟 {w.step} ➔</span>
                </div>
              ))}

              {validation.warnings.length === 0 && (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-center text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>恭喜！角色卡所有核心規則與內容完全合規！</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <JRPGButton
                variant="primary"
                size="sm"
                onClick={() => setIsValidationModalOpen(false)}
              >
                我知道了，關閉
              </JRPGButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
