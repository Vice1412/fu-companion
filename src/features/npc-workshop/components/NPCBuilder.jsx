import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  AlertCircle,
  Info,
  Shield,
  Sparkles,
  Swords,
  Skull
} from 'lucide-react';
import {
  GiBrute,
  GiDragonHead,
  GiCrossbow,
  GiWizardStaff,
  GiDaggers,
  GiShieldReflect,
  GiHeartPlus,
  GiUpgrade,
  GiSwordman,
  GiPawPrint,
  GiBookCover,
  GiSparkles,
  GiTrashCan
} from 'react-icons/gi';

import JRPGButton from '../../../components/ui/JRPGButton';
import { JRPGInput, JRPGSelect } from '../../../components/ui/JRPGInput';
import StatBadge from '../../../components/ui/StatBadge';
import NPCCardPreview from './NPCCardPreview';
import {
  SPECIES_DATA,
  ROLES_DATA,
  ROLE_DESCRIPTIONS,
  ROLE_ICONS,
  LEVELS,
  RANKS,
  VILLAIN_TIERS,
  DAMAGE_TYPES,
  AFFINITY_STATES,
  TYPE_STYLES,
  SPELLS_DATA,
  BOSS_SKILLS_DATA,
  NEGATIVE_SKILLS_DATA
} from '../data';
import { syncLevelPassives } from '../data/roles';
import { calculateNpcBudgets, calculateNpcStats } from '../utils/npcEngine';

export default function NPCBuilder({
  npc,
  onChange,
  onBackToLibrary
}) {
  const [activeStep, setActiveStep] = useState(1);
  const [newTagInput, setNewTagInput] = useState('');
  const [bossSearchQuery, setBossSearchQuery] = useState('');
  const [openBossAccordion, setOpenBossAccordion] = useState({
    '戰場技能': true,
    '控制技能': false,
    '防禦技能': false,
    '破壞技能': false,
    '形態技能': false,
    '動作技能': false
  });

  if (!npc) return null;

  const budgets = calculateNpcBudgets(npc);
  const stats = calculateNpcStats(npc);

  const updateField = (field, value) => {
    onChange({
      ...npc,
      [field]: value,
      updatedAt: new Date().toISOString()
    });
  };

  const handleRoleChange = (newRole) => {
    if (!ROLES_DATA[newRole]) return;
    const roleObj = ROLES_DATA[newRole];
    let newSkills = roleObj.defaultSkills.map(s => ({
      ...s,
      id: `${s.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      libId: s.id,
      isDefault: true
    }));
    newSkills = syncLevelPassives(newRole, npc.level || 5, newSkills);

    onChange({
      ...npc,
      role: newRole,
      skills: newSkills,
      updatedAt: new Date().toISOString()
    });
  };

  const handleLevelChange = (newLevel) => {
    const lvlNum = parseInt(newLevel, 10);
    const updatedSkills = syncLevelPassives(npc.role, lvlNum, npc.skills || []);
    onChange({
      ...npc,
      level: lvlNum,
      skills: updatedSkills,
      updatedAt: new Date().toISOString()
    });
  };

  const handleAffinityCycle = (type) => {
    const current = npc.affinities?.[type] || 'normal';
    const cycle = ['normal', 'vul', 'res', 'imm', 'abs'];
    const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
    const nextVal = cycle[nextIdx];

    onChange({
      ...npc,
      affinities: {
        ...(npc.affinities || {}),
        [type]: nextVal
      },
      updatedAt: new Date().toISOString()
    });
  };

  // Skill Add / Remove / Update Helpers
  const handleToggleAvailableSkill = (skillObj) => {
    const skills = npc.skills || [];
    const existingIndex = skills.findIndex(s => s.libId === skillObj.id || s.id === skillObj.id);

    if (existingIndex >= 0) {
      // Remove skill
      const updated = skills.filter((_, idx) => idx !== existingIndex);
      updateField('skills', updated);
    } else {
      // Add skill
      const initialSel = {};
      if (skillObj.selectionsConfig) {
        skillObj.selectionsConfig.forEach(cfg => {
          if (cfg.options && cfg.options.length > 0) {
            initialSel[cfg.key] = cfg.options[0];
          }
        });
      }

      const newSkill = {
        id: `sk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        libId: skillObj.id,
        name: skillObj.originalName || skillObj.name,
        originalName: skillObj.originalName || skillObj.name,
        desc: skillObj.originalDesc || skillObj.desc,
        originalDesc: skillObj.originalDesc || skillObj.desc,
        category: skillObj.category || 'rule',
        source: skillObj.source || 'roleSkill',
        selectionsConfig: skillObj.selectionsConfig || null,
        selections: initialSel,
        modifiers: skillObj.modifiers || null,
        hideInPreview: skillObj.hideInPreview || false,
        reqRank: skillObj.reqRank || null
      };

      updateField('skills', [...skills, newSkill]);
    }
  };

  const handleUpdateSkillSelection = (skillId, key, value) => {
    const skills = (npc.skills || []).map(s => {
      if (s.id === skillId || s.libId === skillId) {
        return {
          ...s,
          selections: {
            ...(s.selections || {}),
            [key]: value
          }
        };
      }
      return s;
    });
    updateField('skills', skills);
  };

  const handleDeleteSkill = (skillId) => {
    updateField('skills', (npc.skills || []).filter(s => s.id !== skillId));
  };

  const handleAddAttack = () => {
    const newAtt = {
      id: `att_${Date.now()}`,
      category: 'attack',
      source: 'defaultAttack',
      name: '自訂物理打擊',
      selections: {
        distance: '近戰',
        formula: 'DEX + MIG',
        type: '物理'
      },
      desc: '造成標準物理傷害。'
    };
    updateField('skills', [...(npc.skills || []), newAtt]);
  };

  const handleAddSpell = (spell) => {
    const newSp = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: 'spell',
      source: 'spell',
      name: spell.name,
      spellName: spell.name,
      selections: {
        mpCost: spell.mp || 10,
        target: spell.target || '單體生物'
      },
      desc: spell.desc || spell.effect || ''
    };
    updateField('skills', [...(npc.skills || []), newSp]);
  };

  const handleToggleNegativeSkill = (negSkill) => {
    const skills = npc.skills || [];
    const existingIndex = skills.findIndex(s => s.libId === negSkill.id || s.source === 'negativeSkill');

    if (existingIndex >= 0) {
      const updated = skills.filter((_, idx) => idx !== existingIndex);
      updateField('skills', updated);
    } else {
      const initialSel = {};
      if (negSkill.selectionsConfig) {
        negSkill.selectionsConfig.forEach(cfg => {
          if (cfg.options && cfg.options.length > 0) {
            initialSel[cfg.key] = cfg.options[0];
          }
        });
      }

      const newNeg = {
        id: `neg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        libId: negSkill.id,
        name: negSkill.originalName,
        originalName: negSkill.originalName,
        desc: negSkill.originalDesc,
        originalDesc: negSkill.originalDesc,
        category: 'negative',
        source: 'negativeSkill',
        selectionsConfig: negSkill.selectionsConfig || null,
        selections: initialSel
      };

      // Filter out any prior negative skill then add new one
      const withoutNeg = skills.filter(s => s.source !== 'negativeSkill');
      updateField('skills', [...withoutNeg, newNeg]);
    }
  };

  const handleToggleBossSkill = (bossSkill) => {
    const skills = npc.skills || [];
    const existingIndex = skills.findIndex(s => s.libId === bossSkill.id);

    if (existingIndex >= 0) {
      const updated = skills.filter((_, idx) => idx !== existingIndex);
      updateField('skills', updated);
    } else {
      const initialSel = {};
      if (bossSkill.selectionsConfig) {
        bossSkill.selectionsConfig.forEach(cfg => {
          if (cfg.options && cfg.options.length > 0) {
            initialSel[cfg.key] = cfg.options[0];
          }
        });
      }

      const newBs = {
        id: `bs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        libId: bossSkill.id,
        name: bossSkill.originalName,
        originalName: bossSkill.originalName,
        desc: bossSkill.originalDesc,
        originalDesc: bossSkill.originalDesc,
        subCategory: bossSkill.subCategory,
        category: 'boss',
        source: 'bossSkill',
        selectionsConfig: bossSkill.selectionsConfig || null,
        selections: initialSel
      };
      updateField('skills', [...skills, newBs]);
    }
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const curTags = npc.tags || [];
    if (!curTags.includes(newTagInput.trim())) {
      updateField('tags', [...curTags, newTagInput.trim()]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    updateField('tags', (npc.tags || []).filter(t => t !== tagToRemove));
  };

  const STEPS = [
    { id: 1, title: '定位選擇', desc: 'Choose Role', icon: GiDragonHead },
    { id: 2, title: '等級與階級', desc: 'Level & Rank', icon: GiUpgrade },
    { id: 3, title: '基礎數值與攻擊', desc: 'Stats & Attacks', icon: GiSwordman },
    { id: 4, title: '屬性相性矩陣', desc: 'Affinities', icon: GiShieldReflect },
    { id: 5, title: '定位技能庫與法術', desc: 'Role Skills & Spells', icon: GiWizardStaff },
    { id: 6, title: 'Boss & 負面技能', desc: 'Boss & Negative', icon: Skull },
    { id: 7, title: '生物物種', desc: 'Species', icon: GiPawPrint },
    { id: 8, title: '命名與戰術慣例', desc: 'Name & Routine', icon: GiBookCover }
  ];

  const currentRoleSkills = ROLES_DATA[npc.role]?.availableSkills || [];
  const customizationOptions = currentRoleSkills.filter(s => s.source === 'customization');
  const roleSkillOptions = currentRoleSkills.filter(s => s.source === 'roleSkill');

  const bossSubCategories = ['戰場技能', '控制技能', '防禦技能', '破壞技能', '形態技能', '動作技能'];

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="bg-[#fffdf9] border border-[#d6c7ab] rounded-xl px-5 py-3 flex items-center justify-between shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <JRPGButton
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={onBackToLibrary}
          >
            返回檔案庫
          </JRPGButton>
          <div className="h-4 w-[1px] bg-[#d6c7ab]" />
          <h3 className="font-serif font-black text-base text-[#3c2415] truncate max-w-xs">
            {npc.name || '未命名實體'}
          </h3>
          <span className="text-xs text-[#6b5a4b] font-mono hidden sm:inline">
            ({npc.role} · Lv.{npc.level} {npc.rank})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <JRPGButton
            variant="secondary"
            size="xs"
            disabled={activeStep <= 1}
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
          >
            上一步
          </JRPGButton>
          <span className="font-mono text-xs text-[#6b5a4b] font-bold">
            {activeStep} / {STEPS.length}
          </span>
          <JRPGButton
            variant="primary"
            size="xs"
            disabled={activeStep >= STEPS.length}
            onClick={() => setActiveStep(prev => Math.min(STEPS.length, prev + 1))}
          >
            下一步
          </JRPGButton>
        </div>
      </div>

      {/* Budget Tracker Bar (配額儀表板) */}
      <div className="bg-[#f4ebd9] border border-[#d6c7ab] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs flex-wrap shadow-sm">
        <div className="font-serif font-bold text-[#3c2415] flex items-center gap-1.5 shrink-0">
          <GiSparkles className="w-4 h-4 text-amber-800" />
          <span>配額儀表板</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap font-mono">
          {/* Role Skills */}
          <div className={`px-2.5 py-1 rounded-md border text-xs font-bold flex items-center gap-1 ${
            budgets.roleSkills.used > budgets.roleSkills.max
              ? 'bg-red-100 text-red-900 border-red-300 animate-pulse'
              : budgets.roleSkills.used === budgets.roleSkills.max
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : 'bg-[#fffdf9] text-[#3c2415] border-[#d6c7ab]'
          }`}>
            <span>定位技能:</span>
            <span>{budgets.roleSkills.used} / {budgets.roleSkills.max}</span>
          </div>

          {/* Customization */}
          <div className={`px-2 py-1 rounded-md border text-xs font-bold flex items-center gap-1 ${
            budgets.customization.used > budgets.customization.max
              ? 'bg-red-100 text-red-900 border-red-300'
              : 'bg-[#fffdf9] text-[#3c2415] border-[#d6c7ab]'
          }`}>
            <span>客製化:</span>
            <span>{budgets.customization.used} / {budgets.customization.max}</span>
          </div>

          {/* Resistances */}
          <div className={`px-2 py-1 rounded-md border text-xs font-bold flex items-center gap-1 ${
            budgets.resistances.used > budgets.resistances.max
              ? 'bg-red-100 text-red-900 border-red-300'
              : 'bg-[#fffdf9] text-amber-950 border-[#d6c7ab]'
          }`}>
            <span>抗性:</span>
            <span>{budgets.resistances.used} / {budgets.resistances.max}</span>
          </div>

          {/* Immunities */}
          <div className={`px-2 py-1 rounded-md border text-xs font-bold flex items-center gap-1 ${
            budgets.immunities.used > budgets.immunities.max
              ? 'bg-red-100 text-red-900 border-red-300'
              : 'bg-[#fffdf9] text-sky-950 border-[#d6c7ab]'
          }`}>
            <span>免疫:</span>
            <span>{budgets.immunities.used} / {budgets.immunities.max}</span>
          </div>

          {/* Physical Weakness hint */}
          <div className={`px-2 py-1 rounded-md border text-xs font-bold flex items-center gap-1 ${
            budgets.weaknesses.current < budgets.weaknesses.min
              ? 'bg-amber-100 text-amber-950 border-amber-300'
              : 'bg-[#fffdf9] text-stone-700 border-[#d6c7ab]'
          }`}>
            <span>弱點:</span>
            <span>{budgets.weaknesses.current} (需≥{budgets.weaknesses.min})</span>
          </div>

          {/* Boss Skills if Champion */}
          {npc.rank === '冠位' && (
            <div className={`px-2.5 py-1 rounded-md border text-xs font-bold flex items-center gap-1 ${
              budgets.bossSkills.used > budgets.bossSkills.max
                ? 'bg-red-100 text-red-900 border-red-300'
                : 'bg-red-50 text-red-950 border-red-200'
            }`}>
              <span>👑 Boss技能:</span>
              <span>{budgets.bossSkills.used} / {budgets.bossSkills.max}</span>
            </div>
          )}
        </div>
      </div>

      {/* Step Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#d6c7ab]">
        {STEPS.map(s => {
          const StepIcon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeStep === s.id
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-[#eee6d3] text-[#3c2f21] hover:bg-[#e4d9c0] border border-[#d6c7ab]'
              }`}
            >
              <StepIcon className="w-3.5 h-3.5 opacity-90" />
              <span className="font-mono text-[10px] opacity-75">{s.id}.</span>
              {s.title}
            </button>
          );
        })}
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step Editor (7 cols) */}
        <div className="lg:col-span-7 bg-[#fffdf9] rounded-xl border border-[#d6c7ab] p-6 shadow-sm space-y-6 text-[#2c221e]">
          {/* STEP 1: 定位選擇 (Role First) */}
          {activeStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">1.</span> 選擇戰術定位
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  《Fabula Ultima》官方規範強調「定位優先」。定位決定 NPC 的戰術天職、四維屬性成長與可學習之專屬技能庫。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(ROLES_DATA).map(rName => {
                  const isSelected = npc.role === rName;
                  const rData = ROLES_DATA[rName];
                  const rDesc = ROLE_DESCRIPTIONS[rName];

                  const RoleIcon = ROLE_ICONS[rName] || rDesc?.Icon || GiBrute;

                  return (
                    <button
                      key={rName}
                      type="button"
                      onClick={() => handleRoleChange(rName)}
                      className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-700 bg-amber-50 text-amber-950 ring-2 ring-amber-600/40 font-bold shadow-md'
                          : 'border-[#d6c7ab] bg-[#fbf7ee] text-[#2c221e] hover:border-amber-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="font-serif font-black text-base flex items-center gap-2 text-amber-900">
                            <RoleIcon className="w-5 h-5 text-amber-800" />
                            <span>{rName}</span>
                          </div>
                          {isSelected && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-800 text-white font-bold">
                              已選擇
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6b5a4b] leading-relaxed mb-3">
                          {rDesc?.subtitle || rDesc?.desc || ''}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#d6c7ab]/60 flex items-center justify-between text-[11px] font-mono text-stone-600">
                        <span>基礎: DEX {rData.base.DEX}, INS {rData.base.INS}, MIG {rData.base.MIG}, WLP {rData.base.WLP}</span>
                        <span>先攻 +{rData.base.initBase}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: 等級與階級 (Level & Rank) */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">2.</span> 等級、階級與反派地位 (Level & Rank)
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  設定怪物的等級規模（5~60 級）與戰鬥階級（士兵 / 精英 / 冠位 Boss），階級將賦予額外的生命值與技能名額。
                </p>
              </div>

              {/* Level & Rank dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <JRPGSelect
                  label="等級 (Level: 5 ~ 60)"
                  value={npc.level || 5}
                  onChange={e => handleLevelChange(e.target.value)}
                  options={LEVELS.map(l => ({ value: l, label: `等級 ${l} (Lv.${l})` }))}
                />

                <JRPGSelect
                  label="階級"
                  value={npc.rank || '士兵'}
                  onChange={e => updateField('rank', e.target.value)}
                  options={RANKS.map(r => ({ value: r, label: r }))}
                />
              </div>

              {/* Champion Multiplier Slider */}
              {npc.rank === '冠位' && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 space-y-2">
                  <label className="text-xs font-mono text-red-900 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Skull className="w-4 h-4 text-red-700" /> 冠位倍率 (Champion Multiplier ×1~×6)</span>
                    <span className="text-sm">×{npc.championMultiplier || 1} (技能配額 +{npc.championMultiplier || 1})</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={npc.championMultiplier || 1}
                    onChange={e => updateField('championMultiplier', parseInt(e.target.value, 10))}
                    className="w-full accent-red-700"
                  />
                  <p className="text-[11px] text-red-800">
                    冠位 Boss 生命值乘以 {npc.championMultiplier || 1}，魔力值 ×2，先攻值 +{npc.championMultiplier || 1}，且解鎖 {npc.championMultiplier || 1} 個定位技能與 1 個 Boss 絕技名額。
                  </p>
                </div>
              )}

              {/* Villain Tier */}
              <div>
                <label className="text-xs font-bold text-[#3c2f21] block mb-2">
                  反派等級 (Villain Tier - 賦予極限點數 UP)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.keys(VILLAIN_TIERS).map(vtKey => {
                    const vt = VILLAIN_TIERS[vtKey];
                    const isSelected = (npc.villainTier || 'none') === vtKey;
                    return (
                      <button
                        key={vtKey}
                        type="button"
                        onClick={() => updateField('villainTier', vtKey)}
                        className={`p-3 rounded-xl border text-center transition-all text-xs font-bold ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm ring-2 ring-purple-400/30'
                            : 'border-[#d6c7ab] bg-[#fbf7ee] text-[#6b5a4b] hover:border-purple-400'
                        }`}
                      >
                        <div>{vt.label}</div>
                        <div className="text-[10px] text-stone-500 font-mono mt-0.5">+{vt.up} UP</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 基礎數值與攻擊 (Stats & Basic Attacks) */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">3.</span> 四維屬性骰、面板與基礎攻擊
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  確認等級自動計算的四維屬性骰與戰鬥面板。在此可選擇 1 項客製化選項或配置基礎攻擊。
                </p>
              </div>

              {/* Free Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f5efdf] border border-[#d6c7ab]">
                <div>
                  <div className="text-sm font-bold text-[#3c2415] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-800" /> 自由調骰模式
                  </div>
                  <div className="text-xs text-[#6b5a4b] mt-0.5">解鎖標準成長限制，允許自訂 DEX/INS/MIG/WLP 骰階 (d6 ~ d12)</div>
                </div>
                <input
                  type="checkbox"
                  checked={npc.isFreeModeEnabled || false}
                  onChange={e => updateField('isFreeModeEnabled', e.target.checked)}
                  className="w-5 h-5 accent-amber-700 cursor-pointer"
                />
              </div>

              {/* Attributes Dices */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['dex', 'ins', 'mig', 'wlp'].map(statKey => {
                  const upperKey = statKey.toUpperCase();
                  const curDice = (npc.customDice && npc.customDice[upperKey])
                    ? parseInt(String(npc.customDice[upperKey]).replace('d', ''), 10)
                    : (stats[upperKey] ? parseInt(String(stats[upperKey]).replace('d', ''), 10) : 8);

                  return (
                    <div key={statKey} className="bg-[#fbf7ee] border border-[#d6c7ab] rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm">
                      <span className="font-mono text-xs text-[#3c2415] uppercase font-bold">{upperKey}</span>
                      <StatBadge
                        stat={statKey}
                        value={curDice}
                        onChange={npc.isFreeModeEnabled ? (newVal => {
                          updateField('customDice', {
                            ...(npc.customDice || {}),
                            [upperKey]: `d${newVal}`
                          });
                        }) : null}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Customization Options (1 Quota) */}
              {customizationOptions.length > 0 && (
                <div className="p-4 rounded-xl bg-[#f5efdf] border border-[#d6c7ab] space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-xs text-amber-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span>✦ 客製化選項 (Customization - 可選 1 項)</span>
                    </h5>
                    <span className="font-mono text-xs text-[#6b5a4b]">
                      已選: {budgets.customization.used} / {budgets.customization.max}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {customizationOptions.map(opt => {
                      const isPicked = (npc.skills || []).some(s => s.libId === opt.id);
                      const currentSkill = (npc.skills || []).find(s => s.libId === opt.id);

                      return (
                        <div key={opt.id} className={`p-3 rounded-lg border transition-all text-xs ${
                          isPicked ? 'bg-amber-100/70 border-amber-600' : 'bg-[#fffdf9] border-[#d6c7ab] hover:border-amber-400'
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isPicked}
                                onChange={() => handleToggleAvailableSkill(opt)}
                                className="mt-0.5 rounded accent-amber-700"
                              />
                              <div>
                                <div className="font-bold text-[#3c2415]">{opt.originalName}</div>
                                <div className="text-stone-600 text-[11px] leading-relaxed mt-0.5">{opt.originalDesc}</div>
                              </div>
                            </label>
                          </div>

                          {/* Selections config parameters if picked */}
                          {isPicked && opt.selectionsConfig && (
                            <div className="mt-3.5 pt-2.5 border-t border-amber-300/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {opt.selectionsConfig.map(cfg => (
                                <JRPGSelect
                                  key={cfg.key}
                                  label={cfg.label}
                                  value={currentSkill?.selections?.[cfg.key] || cfg.options[0]}
                                  onChange={e => handleUpdateSkillSelection(opt.id, cfg.key, e.target.value)}
                                  options={cfg.options.map(o => ({ value: o, label: o }))}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Basic Attacks Config */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#3c2f21]">
                    基礎攻擊列表
                  </label>
                  <JRPGButton
                    variant="secondary"
                    size="xs"
                    icon={Plus}
                    onClick={handleAddAttack}
                  >
                    新增攻擊
                  </JRPGButton>
                </div>

                <div className="space-y-3">
                  {(npc.skills || []).filter(s => s.category === 'attack').map((att, idx) => (
                    <div key={att.id || idx} className="p-3.5 rounded-xl bg-[#fbf7ee] border border-[#d6c7ab] space-y-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={att.name || att.originalName || '普通攻擊'}
                          onChange={e => {
                            const updated = (npc.skills || []).map(s => s.id === att.id ? { ...s, name: e.target.value } : s);
                            updateField('skills', updated);
                          }}
                          className="font-bold text-xs text-[#3c2415] bg-[#fffdf9] border border-[#d6c7ab] rounded px-2 py-1 outline-none focus:border-amber-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(att.id)}
                          className="text-stone-400 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <JRPGSelect
                          label="距離"
                          value={att.selections?.distance || '近戰'}
                          onChange={e => handleUpdateSkillSelection(att.id, 'distance', e.target.value)}
                          options={[{ value: '近戰', label: '近戰' }, { value: '遠程', label: '遠程' }]}
                        />

                        <JRPGSelect
                          label="命中公式"
                          value={att.selections?.formula || 'DEX + MIG'}
                          onChange={e => handleUpdateSkillSelection(att.id, 'formula', e.target.value)}
                          options={[
                            { value: 'DEX + MIG', label: 'DEX + MIG' },
                            { value: 'DEX + INS', label: 'DEX + INS' },
                            { value: 'INS + MIG', label: 'INS + MIG' },
                            { value: 'INS + WLP', label: 'INS + WLP' },
                            { value: 'MIG + WLP', label: 'MIG + WLP' }
                          ]}
                        />

                        <JRPGSelect
                          label="傷害類型"
                          value={att.selections?.type || '物理'}
                          onChange={e => handleUpdateSkillSelection(att.id, 'type', e.target.value)}
                          options={DAMAGE_TYPES.map(t => ({ value: t, label: t }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: 屬性相性矩陣 (Affinities & Budget) */}
          {activeStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">4.</span> 屬性弱點與抗性矩陣
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  點擊屬性方塊依序切換：一般 ➔ 弱點 ➔ 抗性 ➔ 免疫 ➔ 吸收。
                </p>
              </div>

              {/* Hint Box */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1 font-mono">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Info className="w-4 h-4 text-amber-800" />
                  <span>等級與定位抗性規則提示</span>
                </div>
                <p>• 定位要求弱點: <strong>{budgets.weaknesses.min} 個</strong> (暴徒 2 個，其餘定位 1 個)。</p>
                <p>• 等級解鎖額度: 抗性 <strong>{budgets.resistances.max} 個</strong>，免疫 <strong>{budgets.immunities.max} 個</strong>。</p>
                <p>• 💡 條款特別提示：給予 NPC【物理】弱點將額外獲得 <strong>+1 定位技能名額</strong>。</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                {DAMAGE_TYPES.map(type => {
                  const aff = npc.affinities?.[type] || 'normal';
                  const stateCfg = AFFINITY_STATES[aff] || AFFINITY_STATES.normal;

                  let borderStyle = "border-[#d6c7ab] bg-[#fbf7ee] text-stone-700";
                  if (aff === 'vul') borderStyle = "border-red-400 bg-red-100 text-red-900 font-bold ring-2 ring-red-400/30";
                  if (aff === 'res') borderStyle = "border-amber-400 bg-amber-100 text-amber-950 font-bold ring-2 ring-amber-400/30";
                  if (aff === 'imm') borderStyle = "border-sky-400 bg-sky-100 text-sky-900 font-bold ring-2 ring-sky-400/30";
                  if (aff === 'abs') borderStyle = "border-emerald-400 bg-emerald-100 text-emerald-900 font-bold ring-2 ring-emerald-400/30";

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleAffinityCycle(type)}
                      className={`p-3.5 rounded-xl border text-center transition-all select-none hover:shadow-sm ${borderStyle}`}
                    >
                      <div className="font-bold text-sm flex items-center justify-center gap-1.5">
                        <span className={`fu-icon text-sm ${TYPE_STYLES[type]?.color || ''}`}>{TYPE_STYLES[type]?.fuIcon}</span>
                        <span>{type}</span>
                      </div>
                      <div className="text-xs font-mono mt-1 font-bold">{stateCfg.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: 定位技能庫與法術 (Role Skills & Spells) */}
          {activeStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                    <span className="text-amber-800">5.</span> 定位技能庫與法術選用
                  </h4>
                  <p className="text-xs text-[#6b5a4b] mt-1">
                    挑選【{npc.role}】定位的專屬技能與法術。當前配額: {budgets.roleSkills.used} / {budgets.roleSkills.max}
                  </p>
                </div>
              </div>

              {/* Role Skills List */}
              <div className="space-y-3">
                <h5 className="font-bold text-xs text-amber-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  <span>【{npc.role}】定位技能庫</span>
                </h5>

                {roleSkillOptions.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">此定位無額外可選技能。</p>
                ) : (
                  roleSkillOptions.map(opt => {
                    const isPicked = (npc.skills || []).some(s => s.libId === opt.id);
                    const currentSkill = (npc.skills || []).find(s => s.libId === opt.id);
                    const isRankRestricted = opt.reqRank && !opt.reqRank.includes(npc.rank);

                    return (
                      <div key={opt.id} className={`p-3.5 rounded-xl border transition-all text-xs ${
                        isPicked
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                          : isRankRestricted
                          ? 'bg-stone-100 border-stone-300 opacity-60'
                          : 'bg-[#fffdf9] border-[#d6c7ab] hover:border-amber-400'
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isPicked}
                              disabled={isRankRestricted}
                              onChange={() => handleToggleAvailableSkill(opt)}
                              className="mt-0.5 rounded accent-emerald-700"
                            />
                            <div>
                              <div className="font-bold text-[#3c2415] flex items-center gap-2">
                                <span>{opt.originalName}</span>
                                {opt.reqRank && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                    限制: {opt.reqRank.join('/')}
                                  </span>
                                )}
                              </div>
                              <div className="text-stone-600 text-[11px] leading-relaxed mt-1">{opt.originalDesc}</div>
                            </div>
                          </label>
                        </div>

                        {/* Parameter Selections if picked */}
                        {isPicked && opt.selectionsConfig && (
                          <div className="mt-3 pt-3 border-t border-emerald-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {opt.selectionsConfig.map(cfg => (
                              <JRPGSelect
                                key={cfg.key}
                                label={cfg.label}
                                value={currentSkill?.selections?.[cfg.key] || cfg.options[0]}
                                onChange={e => handleUpdateSkillSelection(opt.id, cfg.key, e.target.value)}
                                options={cfg.options.map(o => ({ value: o, label: o }))}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Spells Picker */}
              <div className="p-4 rounded-xl bg-[#f5efdf] border border-[#d6c7ab] space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-amber-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                    <span>通用與專屬咒語書</span>
                  </h5>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {SPELLS_DATA.map((sp, idx) => {
                    const isAdded = (npc.skills || []).some(s => s.name === sp.name || s.spellName === sp.name);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => isAdded ? handleDeleteSkill((npc.skills || []).find(s => s.name === sp.name)?.id) : handleAddSpell(sp)}
                        className={`p-2 rounded-lg border text-left text-xs flex items-center justify-between transition-all ${
                          isAdded
                            ? 'bg-blue-100 border-blue-400 text-blue-950 font-bold'
                            : 'bg-[#fffdf9] border-[#d6c7ab] hover:border-blue-500 text-[#3c2415]'
                        }`}
                      >
                        <span className="truncate">🔮 {sp.name}</span>
                        <span className="text-[10px] font-mono shrink-0 ml-1">
                          {isAdded ? '✓ 已加入' : '+ 加入'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Boss 技能與負面技能 (Boss & Negative Skills) */}
          {activeStep === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">6.</span> Boss 絕技與負面技能 (Boss & Negative Skills)
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  配置強大的 40 個冠位 Boss 絕技或負面技能。選用負面技能可為 NPC 額外獲得 +1 個技能名額。
                </p>
              </div>

              {/* A. Negative Skills Section */}
              <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-300 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-purple-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Skull className="w-4 h-4 text-purple-800" />
                    <span>負面技能 (Negative Skills - 額外獲得 +1 技能名額)</span>
                  </h5>
                </div>

                <div className="space-y-2">
                  {NEGATIVE_SKILLS_DATA.map(neg => {
                    const isPicked = (npc.skills || []).some(s => s.libId === neg.id || s.source === 'negativeSkill' && s.name === neg.originalName);
                    const currentSkill = (npc.skills || []).find(s => s.libId === neg.id);

                    return (
                      <div key={neg.id} className={`p-3 rounded-lg border text-xs transition-all ${
                        isPicked ? 'bg-purple-100 border-purple-500 font-bold' : 'bg-[#fffdf9] border-[#d6c7ab] hover:border-purple-400'
                      }`}>
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPicked}
                            onChange={() => handleToggleNegativeSkill(neg)}
                            className="mt-0.5 rounded accent-purple-700"
                          />
                          <div>
                            <div className="text-purple-950 font-bold">{neg.originalName}</div>
                            <div className="text-stone-600 text-[11px] leading-relaxed mt-0.5 font-normal">{neg.originalDesc}</div>
                          </div>
                        </label>

                        {isPicked && neg.selectionsConfig && (
                          <div className="mt-3 pt-2 border-t border-purple-300/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {neg.selectionsConfig.map(cfg => (
                              <JRPGSelect
                                key={cfg.key}
                                label={cfg.label}
                                value={currentSkill?.selections?.[cfg.key] || cfg.options[0]}
                                onChange={e => handleUpdateSkillSelection(currentSkill.id, cfg.key, e.target.value)}
                                options={cfg.options.map(o => ({ value: o, label: o }))}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* B. Boss Skills 40 Accordions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h5 className="font-bold text-xs text-red-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Skull className="w-4 h-4 text-red-700" />
                    <span>冠位 Boss 絕技庫 (40 個技能分類展示)</span>
                  </h5>

                  {/* Search input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="搜尋 40 個 Boss 絕技..."
                      value={bossSearchQuery}
                      onChange={e => setBossSearchQuery(e.target.value)}
                      className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg pl-8 pr-3 py-1 text-xs text-[#2c221e] outline-none focus:border-red-600 shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {bossSubCategories.map(subCat => {
                    const filteredSkills = BOSS_SKILLS_DATA.filter(bs =>
                      bs.subCategory === subCat &&
                      (!bossSearchQuery.trim() ||
                        bs.originalName.includes(bossSearchQuery.trim()) ||
                        bs.originalDesc.includes(bossSearchQuery.trim()))
                    );

                    if (filteredSkills.length === 0) return null;
                    const isOpen = openBossAccordion[subCat] || bossSearchQuery.trim().length > 0;

                    return (
                      <div key={subCat} className="border border-[#d6c7ab] rounded-xl overflow-hidden bg-[#fffdf9]">
                        <button
                          type="button"
                          onClick={() => setOpenBossAccordion(prev => ({ ...prev, [subCat]: !prev[subCat] }))}
                          className="w-full px-4 py-2.5 bg-[#f5efdf] hover:bg-[#eee6d3] flex items-center justify-between text-xs font-bold text-[#3c2415] transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span>👑 {subCat}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#d6c7ab]">
                              {filteredSkills.length} 個
                            </span>
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isOpen && (
                          <div className="p-3 space-y-2 bg-[#fffdf9]">
                            {filteredSkills.map(bs => {
                              const isPicked = (npc.skills || []).some(s => s.libId === bs.id);
                              const currentSkill = (npc.skills || []).find(s => s.libId === bs.id);

                              return (
                                <div key={bs.id} className={`p-3 rounded-lg border text-xs transition-all ${
                                  isPicked ? 'bg-red-50 border-red-500 font-bold' : 'bg-[#fbf7ee] border-[#d6c7ab] hover:border-red-400'
                                }`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isPicked}
                                        onChange={() => handleToggleBossSkill(bs)}
                                        className="mt-0.5 rounded accent-red-700"
                                      />
                                      <div>
                                        <div className="text-red-950 font-bold flex items-center gap-2">
                                          <span>{bs.originalName}</span>
                                        </div>
                                        {bs.flavorText && (
                                          <div className="text-stone-500 text-[10px] italic mt-0.5">{bs.flavorText}</div>
                                        )}
                                        <div className="text-stone-700 text-[11px] leading-relaxed mt-1 font-normal">{bs.originalDesc}</div>
                                      </div>
                                    </label>
                                  </div>

                                  {isPicked && bs.selectionsConfig && (
                                    <div className="mt-3 pt-2 border-t border-red-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {bs.selectionsConfig.map(cfg => (
                                        <JRPGSelect
                                          key={cfg.key}
                                          label={cfg.label}
                                          value={currentSkill?.selections?.[cfg.key] || cfg.options[0]}
                                          onChange={e => handleUpdateSkillSelection(bs.id, cfg.key, e.target.value)}
                                          options={cfg.options.map(o => ({ value: o, label: o }))}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: 生物物種 */}
          {activeStep === 7 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">7.</span> 選擇生物物種
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  物種提供怪物的先天抗性、狀態免疫與專屬特性加成（例如類人生物享有 +1 額外定位技能）。
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SPECIES_DATA.map(sp => {
                  const isSelected = npc.selectedSpeciesId === sp.id;
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      onClick={() => updateField('selectedSpeciesId', sp.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-700 bg-amber-50 text-amber-900 ring-2 ring-amber-600/40 font-bold shadow-sm'
                          : 'border-[#d6c7ab] bg-[#fbf7ee] text-[#2c221e] hover:border-amber-600'
                      }`}
                    >
                      <div className="font-bold text-sm">{sp.name}</div>
                    </button>
                  );
                })}
              </div>

              {/* Species Details & Benefits */}
              {(() => {
                const currentSpecies = SPECIES_DATA.find(s => s.id === npc.selectedSpeciesId);
                if (!currentSpecies) return null;
                const options = currentSpecies.benefitsConfig?.options || [];

                return (
                  <div className="space-y-4">
                    {/* Fixed Desc & Mandatory selections */}
                    <div className="p-4 rounded-xl bg-[#f5efdf] border border-[#d6c7ab] space-y-3 text-xs">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-amber-800" />
                        <span>物種先天特性: {currentSpecies.name}</span>
                      </div>

                      {currentSpecies.fixedDesc && (
                        <p className="text-stone-700 leading-relaxed font-sans">{currentSpecies.fixedDesc}</p>
                      )}

                      {/* Mandatory selections dropdowns */}
                      {currentSpecies.mandatorySelections && currentSpecies.mandatorySelections.map(m => (
                        <div key={m.key} className="pt-2">
                          <label className="font-bold text-[#3c2f21] block mb-1">{m.label}</label>
                          {m.type === 'multiselect_2' ? (
                            <div className="grid grid-cols-3 gap-2">
                              {m.options.map(opt => {
                                const currentList = Array.isArray(npc.speciesConfig?.[m.key]) ? npc.speciesConfig[m.key] : [];
                                const isChecked = currentList.includes(opt);
                                return (
                                  <label key={opt} className="flex items-center gap-1.5 p-1.5 rounded bg-[#fffdf9] border border-[#d6c7ab] cursor-pointer text-xs">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const updated = isChecked ? currentList.filter(o => o !== opt) : [...currentList, opt].slice(0, 2);
                                        updateField('speciesConfig', { ...(npc.speciesConfig || {}), [m.key]: updated });
                                      }}
                                      className="accent-amber-700"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <JRPGSelect
                              value={npc.speciesConfig?.[m.key] || m.options[0]}
                              onChange={e => updateField('speciesConfig', { ...(npc.speciesConfig || {}), [m.key]: e.target.value })}
                              options={m.options.map(o => ({ value: o, label: o }))}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Benefits Config */}
                    {options.length > 0 && (
                      <div className="p-4 rounded-xl bg-[#f5efdf] border border-[#d6c7ab] space-y-3">
                        <h5 className="font-bold text-xs text-amber-900 uppercase tracking-wider font-mono">
                          ✦ 種族專屬特性與增益選擇 (最多可選 {currentSpecies.benefitsConfig.maxPicks} 項)
                        </h5>
                        <div className="space-y-2">
                          {options.map(b => {
                            const selectedBenefits = npc.speciesConfig?.selectedBenefits || [];
                            const isChecked = selectedBenefits.includes(b.id);
                            return (
                              <div key={b.id} className="p-2 rounded-lg hover:bg-[#eee6d3] transition-colors">
                                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      const next = isChecked
                                        ? selectedBenefits.filter(id => id !== b.id)
                                        : [...selectedBenefits, b.id];
                                      updateField('speciesConfig', { ...(npc.speciesConfig || {}), selectedBenefits: next });
                                    }}
                                    className="mt-0.5 rounded accent-amber-700"
                                  />
                                  <div>
                                    <p className="text-[#2c221e] text-xs leading-relaxed">{b.text || b.name}</p>
                                  </div>
                                </label>
                                {isChecked && b.needsSelection && b.selectionConfig?.type === 'text' && (
                                  <div className="mt-2 pl-6">
                                    {b.selectionConfig.label && (
                                      <div className="text-[11px] font-bold text-amber-900 mb-1">
                                        ✦ {b.selectionConfig.label}：
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      className="w-full bg-[#fffdf9] border border-[#d6c7ab] p-1.5 rounded text-xs text-[#2c221e] focus:border-amber-600 outline-none placeholder-[#8c7b6c] font-bold shadow-inner"
                                      placeholder={b.selectionConfig.placeholder || ''}
                                      value={npc.speciesConfig?.[b.selectionConfig.key] || ''}
                                      onChange={e => updateField('speciesConfig', { ...(npc.speciesConfig || {}), [b.selectionConfig.key]: e.target.value })}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 8: 命名與戰術慣例 (Name, Traits & Routine) */}
          {activeStep === 8 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h4 className="font-serif font-black text-lg text-[#3c2415] flex items-center gap-2">
                  <span className="text-amber-800">8.</span> 命名、特質與戰術行動慣例
                </h4>
                <p className="text-xs text-[#6b5a4b] mt-1">
                  完成 NPC 命名、設定分類標籤、特質描述與清晰的回合戰術慣例。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <JRPGInput
                  label="NPC / 怪物名稱"
                  value={npc.name || ''}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="例：帝國近衛重騎士"
                />

                <JRPGInput
                  label="陣營 / 分類文件夾"
                  value={npc.faction || ''}
                  onChange={e => updateField('faction', e.target.value)}
                  placeholder="例：帝國軍、古老遺跡、Boss"
                />
              </div>

              {/* Tags Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3c2f21]">
                  分類標籤
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    placeholder="新增標籤 (如：近戰、群控、主線)..."
                    className="flex-1 bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-1.5 text-xs text-[#2c221e] outline-none focus:border-amber-700 shadow-inner"
                  />
                  <JRPGButton
                    variant="secondary"
                    size="xs"
                    onClick={handleAddTag}
                  >
                    添加
                  </JRPGButton>
                </div>
                {npc.tags && npc.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {npc.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-[#f4ebd9] border border-[#d6c7ab] text-[#3c2f21] text-xs font-mono flex items-center gap-1">
                        #{t}
                        <button onClick={() => handleRemoveTag(t)} className="text-[#8c7b6c] hover:text-red-700 ml-1">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <JRPGInput
                  label="核心特徵短評"
                  value={npc.traits || ''}
                  onChange={e => updateField('traits', e.target.value)}
                  placeholder="例：沉著、身披重甲、對龍族懷有恨意"
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#3c2f21]">戰術慣例與回合循環</label>
                  <textarea
                    rows={4}
                    value={npc.tactics || ''}
                    onChange={e => updateField('tactics', e.target.value)}
                    placeholder="例：&#10;• 開場：釋放【痛苦光環】降低冒險者恢復能力&#10;• 奇數輪：使用【普通攻擊】進行近戰多重打擊&#10;• 偶數輪 / 危機時：發動【強力攻擊】造成崩塌傷害"
                    className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg p-3 text-xs text-[#2c221e] outline-none focus:border-amber-700 shadow-inner leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Card Preview (5 cols on lg, sticky) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="text-xs font-mono text-[#6b5a4b] mb-2 flex items-center justify-between font-bold">
            <span>即時角色卡預覽</span>
            <span className="text-amber-800">同步響應中</span>
          </div>
          <NPCCardPreview npc={npc} />
        </div>
      </div>
    </div>
  );
}
