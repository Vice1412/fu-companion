import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Swords,
  Heart,
  Sparkles,
  Backpack,
  Star,
  Coins,
  Shield,
  Zap,
  TrendingUp,
  AlertTriangle,
  Clock,
  Dices,
  Plus,
  Minus,
  Check,
  RefreshCw,
  Award,
  Crosshair,
  Volume2
} from 'lucide-react';
import JRPGButton from '../../../components/ui/JRPGButton';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import ClockTracker from '../../../components/ui/ClockTracker';
import {
  calculateCharacterStats,
  canLevelUp,
  applyLevelUp
} from '../utils/characterEngine';
import rulesData from '../data/rulesData.json';
import { STATUS_AFFLICTIONS } from '../data/sourcebookConfig';

export default function CharacterPlayHUD({
  character,
  onChange,
  onBackToRoster,
  onOpenEditor,
  onOpenDice = null,
  showToast = () => {}
}) {
  const [activeTab, setActiveTab] = useState('attacks'); // 'attacks' | 'skills' | 'bonds' | 'clocks' | 'notes'
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [selectedClassForLevelUp, setSelectedClassForLevelUp] = useState('');
  const [selectedSkillForLevelUp, setSelectedSkillForLevelUp] = useState('');
  const [isNewClassLevelUp, setIsNewClassLevelUp] = useState(false);

  if (!character) return null;

  const stats = calculateCharacterStats(character);
  const curHp = character.currentHp !== null && character.currentHp !== undefined ? character.currentHp : stats.maxHp;
  const curMp = character.currentMp !== null && character.currentMp !== undefined ? character.currentMp : stats.maxMp;
  const curIp = character.currentIp !== null && character.currentIp !== undefined ? character.currentIp : stats.maxIp;
  const isCrisis = curHp <= stats.crisisThreshold;
  const isReadyToLevelUp = canLevelUp(character);

  const updateField = (field, val) => {
    onChange({
      ...character,
      [field]: val,
      updatedAt: new Date().toISOString()
    });
  };

  // Adjust Vital Resources
  const adjustHp = (delta) => {
    const next = Math.max(0, Math.min(stats.maxHp, curHp + delta));
    updateField('currentHp', next);
  };

  const adjustMp = (delta) => {
    const next = Math.max(0, Math.min(stats.maxMp, curMp + delta));
    updateField('currentMp', next);
  };

  const adjustIp = (delta) => {
    const next = Math.max(0, Math.min(stats.maxIp, curIp + delta));
    updateField('currentIp', next);
  };

  const adjustExp = (delta) => {
    const next = Math.max(0, (character.exp || 0) + delta);
    updateField('exp', next);
  };

  const adjustZenit = (delta) => {
    const next = Math.max(0, (character.zenit || 0) + delta);
    updateField('zenit', next);
  };

  const adjustFp = (delta) => {
    const next = Math.max(0, (character.fabulaPoints || 3) + delta);
    updateField('fabulaPoints', next);
  };

  // Toggle Status Afflictions
  const handleToggleAffliction = (affKey) => {
    const curAff = character.statusAfflictions || {};
    const updated = {
      ...curAff,
      [affKey]: !curAff[affKey]
    };
    updateField('statusAfflictions', updated);
  };

  // Consumable shortcut using IP
  const handleUseConsumable = (type) => {
    if (type === 'potion') {
      if (curIp < 2) { showToast('⚠️ 庫存點 (IP) 不足 2 點'); return; }
      adjustIp(-2);
      adjustHp(40);
      showToast('🧪 使用治療藥水！回復 40 點 HP (消耗 2 IP)');
    } else if (type === 'elixir') {
      if (curIp < 2) { showToast('⚠️ 庫存點 (IP) 不足 2 點'); return; }
      adjustIp(-2);
      adjustMp(40);
      showToast('🔮 使用魔力萬能藥！回復 40 點 MP (消耗 2 IP)');
    } else if (type === 'antidote') {
      if (curIp < 1) { showToast('⚠️ 庫存點 (IP) 不足 1 點'); return; }
      adjustIp(-1);
      updateField('statusAfflictions', { ...(character.statusAfflictions || {}), poisoned: false });
      showToast('🌿 使用解毒劑！解除中毒狀態 (消耗 1 IP)');
    } else if (type === 'tonic') {
      if (curIp < 1) { showToast('⚠️ 庫存點 (IP) 不足 1 點'); return; }
      adjustIp(-1);
      updateField('statusAfflictions', {
        ...(character.statusAfflictions || {}),
        dazed: false,
        shaken: false
      });
      showToast('🍵 使用提神藥！解除眩暈與動搖狀態 (消耗 1 IP)');
    }
  };

  // Send Character to Combat Tracker
  const handleSendToCombat = () => {
    try {
      const activeCombatRaw = localStorage.getItem('fu_companion_active_combat');
      const activeCombat = activeCombatRaw ? JSON.parse(activeCombatRaw) : { combatants: [] };
      const combatants = activeCombat.combatants || [];

      // Check if already in combat
      const existingIdx = combatants.findIndex(c => c.sourceId === character.id);
      const combatantData = {
        instanceId: `comb_${character.id}_${Date.now()}`,
        sourceId: character.id,
        sourceType: 'character',
        name: character.name || '冒險者',
        avatar: character.avatar || null,
        faction: '玩家隊伍',
        level: character.level || 5,
        rank: '玩家',
        role: (character.classes || []).map(c => c.className).join(' / ') || '冒險者',
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
          current: curIp,
          max: stats.maxIp
        },
        fabulaPoints: character.fabulaPoints || 3,
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
        statusEffects: { ...character.statusAfflictions },
        skills: (character.classes || []).flatMap(cl => (cl.skills || []).map(sk => ({
          id: `${cl.className}_${sk.name}`,
          name: `${sk.name} (SL ${sk.sl})`,
          category: 'skill',
          desc: `【${cl.className}】特技`,
          isRevealed: true
        }))),
        rawCharData: character
      };

      if (existingIdx >= 0) {
        combatants[existingIdx] = combatantData;
      } else {
        combatants.push(combatantData);
      }

      activeCombat.combatants = combatants;
      localStorage.setItem('fu_companion_active_combat', JSON.stringify(activeCombat));
      showToast(`⚔️ 已將【${character.name}】推入戰鬥房間！`, 'success');
    } catch (e) {
      console.error(e);
      showToast('❌ 入戰失敗，請確認數據完整。');
    }
  };

  // Perform Level Up
  const handleExecuteLevelUp = () => {
    if (!selectedClassForLevelUp || !selectedSkillForLevelUp) {
      showToast('⚠️ 請先選擇欲提升的職業與特技');
      return;
    }

    const updated = applyLevelUp(character, {
      className: selectedClassForLevelUp,
      skillName: selectedSkillForLevelUp,
      isNewClass: isNewClassLevelUp
    });

    onChange(updated);
    setIsLevelUpModalOpen(false);
    setSelectedClassForLevelUp('');
    setSelectedSkillForLevelUp('');
    setIsNewClassLevelUp(false);
    showToast(`🎉 恭喜！等級提升至 Level ${updated.level}！`);
  };

  // Weapon details
  const weapon = rulesData.equipment.weapons.find(w => w.name === character.equipment?.mainHand) || {
    name: '無手空拳',
    attr: 'DEX + MIG',
    damage: '【HR + 0】物理',
    range: '近戰'
  };

  return (
    <div className="space-y-4 text-[#2c221e]">
      {/* Top Play Mode Header */}
      <div className="bg-[#fffdf9] border border-[#d6c7ab] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#d6c7ab]/60 pb-3">
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

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-[#d6c7ab] flex items-center justify-center font-serif text-lg font-bold text-amber-900 overflow-hidden shadow-inner">
                {character.avatar ? (
                  <img src={character.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  character.name?.[0] || '勇'
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-black text-lg text-[#3c2415]">
                    {character.name || '無名冒險者'}
                  </h3>
                  <JRPGBadge variant="gold" size="xs">
                    Lv {character.level || 5}
                  </JRPGBadge>
                  {isCrisis && (
                    <JRPGBadge variant="rose" size="xs" className="animate-pulse">
                      ⚠️ 危機 CRISIS
                    </JRPGBadge>
                  )}
                </div>
                <div className="text-xs text-[#7c6a58] font-mono mt-0.5">
                  <span>{character.identity || '冒險者'}</span> · <span>{character.theme || '希望'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Level Up Button */}
            {isReadyToLevelUp && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClassForLevelUp((character.classes || [])[0]?.className || '');
                  setIsLevelUpModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-500/30 animate-bounce flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 text-amber-200" />
                <span>⭐ 可升級 (Level Up)!</span>
              </button>
            )}

            {/* Send to combat */}
            <button
              type="button"
              onClick={handleSendToCombat}
              className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
            >
              <Swords className="w-3.5 h-3.5 text-rose-700" />
              <span>推入戰鬥房間</span>
            </button>

            {/* Enter Editor / Builder */}
            <JRPGButton
              variant="secondary"
              size="xs"
              icon={Edit3}
              onClick={onOpenEditor}
            >
              構建器 / 調整
            </JRPGButton>
          </div>
        </div>

        {/* Global Resource HUD (EXP / Zenit / Fabula Points) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* EXP Progression Bar */}
          <div className="bg-[#fbf7ee] rounded-xl p-3 border border-[#d6c7ab] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono font-bold text-amber-900 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                冒險經驗值 (EXP)
              </span>
              <span className="font-mono text-[11px] font-bold text-[#6b5a4b]">
                {character.exp || 0} / 10
              </span>
            </div>

            <div className="w-full bg-[#ebdcc4] h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((character.exp || 0) / 10) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustExp(-1)}
                  disabled={(character.exp || 0) <= 0}
                  className="px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-[#d6c7ab] text-xs font-bold disabled:opacity-30"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => adjustExp(1)}
                  className="px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-[#d6c7ab] text-xs font-bold"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => adjustExp(5)}
                  className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold"
                >
                  +5
                </button>
              </div>
              <span className="text-[10px] text-[#8c7b6c] italic font-mono">10 EXP 升 1 級</span>
            </div>
          </div>

          {/* Zenit Wallet */}
          <div className="bg-[#fbf7ee] rounded-xl p-3 border border-[#d6c7ab] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono font-bold text-amber-900 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-700" />
                金幣錢包 (Zenit)
              </span>
              <span className="font-mono font-black text-sm text-[#3c2415]">
                {character.zenit || 0} z
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-auto pt-2">
              <button
                type="button"
                onClick={() => adjustZenit(-50)}
                disabled={(character.zenit || 0) < 50}
                className="flex-1 py-1 rounded bg-white hover:bg-stone-50 border border-[#d6c7ab] text-xs font-bold disabled:opacity-30"
              >
                -50
              </button>
              <button
                type="button"
                onClick={() => adjustZenit(50)}
                className="flex-1 py-1 rounded bg-white hover:bg-stone-50 border border-[#d6c7ab] text-xs font-bold"
              >
                +50
              </button>
              <button
                type="button"
                onClick={() => adjustZenit(100)}
                className="flex-1 py-1 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold"
              >
                +100
              </button>
            </div>
          </div>

          {/* Fabula Points */}
          <div className="bg-[#fbf7ee] rounded-xl p-3 border border-[#d6c7ab] flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono font-bold text-amber-900 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-700" />
                物語點 (Fabula Points)
              </span>
              <span className="font-mono font-black text-sm text-amber-950">
                {character.fabulaPoints || 3} FP
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-auto pt-2">
              <button
                type="button"
                onClick={() => adjustFp(-1)}
                disabled={(character.fabulaPoints || 3) <= 0}
                className="flex-1 py-1 rounded bg-white hover:bg-stone-50 border border-[#d6c7ab] text-xs font-bold disabled:opacity-30"
              >
                消耗 1 FP
              </button>
              <button
                type="button"
                onClick={() => adjustFp(1)}
                className="flex-1 py-1 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold"
              >
                獲得 1 FP
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vital Resource Gauges (HP / MP / IP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* HP Gauge */}
        <div className={`rounded-2xl p-4 border-2 transition-all shadow-sm ${
          isCrisis
            ? 'bg-red-50 border-red-400 ring-2 ring-red-300/60'
            : 'bg-[#fffdf9] border-[#d6c7ab]'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-red-900">
              <Heart className="w-4 h-4 text-red-600 fill-red-500/20" />
              <span>生命值 (HP)</span>
              {isCrisis && <span className="text-[10px] text-red-600 font-mono font-black">【CRISIS 危機】</span>}
            </div>
            <div className="font-mono font-black text-base text-red-950">
              {curHp} <span className="text-xs text-stone-500 font-normal">/ {stats.maxHp}</span>
            </div>
          </div>

          <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isCrisis ? 'bg-red-600' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, (curHp / stats.maxHp) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button onClick={() => adjustHp(-5)} className="px-2 py-1 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold">-5</button>
              <button onClick={() => adjustHp(-1)} className="px-2 py-1 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold">-1</button>
              <button onClick={() => adjustHp(1)} className="px-2 py-1 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold">+1</button>
              <button onClick={() => adjustHp(5)} className="px-2 py-1 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold">+5</button>
            </div>
            <button
              onClick={() => updateField('currentHp', stats.maxHp)}
              className="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-950 font-bold text-xs"
            >
              全滿
            </button>
          </div>
        </div>

        {/* MP Gauge */}
        <div className="rounded-2xl p-4 border border-[#d6c7ab] bg-[#fffdf9] shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>魔力值 (MP)</span>
            </div>
            <div className="font-mono font-black text-base text-blue-950">
              {curMp} <span className="text-xs text-stone-500 font-normal">/ {stats.maxMp}</span>
            </div>
          </div>

          <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden mb-3">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (curMp / stats.maxMp) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <button onClick={() => adjustMp(-5)} className="px-2 py-1 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold">-5</button>
              <button onClick={() => adjustMp(-1)} className="px-2 py-1 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold">-1</button>
              <button onClick={() => adjustMp(1)} className="px-2 py-1 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold">+1</button>
              <button onClick={() => adjustMp(5)} className="px-2 py-1 rounded bg-white hover:bg-stone-50 border border-stone-300 text-xs font-bold">+5</button>
            </div>
            <button
              onClick={() => updateField('currentMp', stats.maxMp)}
              className="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-950 font-bold text-xs"
            >
              全滿
            </button>
          </div>
        </div>

        {/* IP Gauge */}
        <div className="rounded-2xl p-4 border border-[#d6c7ab] bg-[#fffdf9] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Backpack className="w-4 h-4 text-emerald-600" />
                <span>庫存點 (IP)</span>
              </div>
              <div className="font-mono font-black text-base text-emerald-950">
                {curIp} <span className="text-xs text-stone-500 font-normal">/ {stats.maxIp}</span>
              </div>
            </div>

            <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden mb-2.5">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (curIp / stats.maxIp) * 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => handleUseConsumable('potion')}
              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-bold text-left truncate"
              title="消耗 2 IP：恢復 40 HP"
            >
              🧪 治療劑 (2 IP)
            </button>
            <button
              onClick={() => handleUseConsumable('elixir')}
              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-bold text-left truncate"
              title="消耗 2 IP：恢復 40 MP"
            >
              🔮 萬能藥 (2 IP)
            </button>
          </div>
        </div>
      </div>

      {/* Six Status Afflictions Strip */}
      <div className="bg-[#fbf7ee] rounded-2xl p-3.5 border border-[#d6c7ab] space-y-2 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#3c2415] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
            六大狀態異常 (Status Afflictions - 點擊即時切換，自動降骰):
          </span>
          <button
            onClick={() => updateField('statusAfflictions', {
              dazed: false, enraged: false, poisoned: false, shaken: false, slow: false, weak: false
            })}
            className="text-[11px] text-amber-900 hover:underline font-bold"
          >
            全部清除
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {Object.keys(STATUS_AFFLICTIONS).map(key => {
            const aff = STATUS_AFFLICTIONS[key];
            const isActive = !!character.statusAfflictions?.[key];

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleToggleAffliction(key)}
                className={`py-1.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm ${
                  isActive
                    ? 'bg-red-600 border-red-700 text-white animate-pulse'
                    : 'bg-[#fffdf9] border-[#d6c7ab] text-[#6b5a4b] hover:bg-[#f5efdf]'
                }`}
                title={aff.desc}
              >
                <span>{aff.short}</span>
                {isActive && <span className="text-[10px] opacity-80">(-1階)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Four Attributes & Click-to-Roll */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'dex', name: '敏捷 (DEX)', base: stats.baseDex, cur: stats.currentDex, desc: '物理迴避·精準' },
          { key: 'ins', name: '洞察 (INS)', base: stats.baseIns, cur: stats.currentIns, desc: '魔法防禦·感知' },
          { key: 'mig', name: '體魄 (MIG)', base: stats.baseMig, cur: stats.currentMig, desc: '生命耐力·近戰' },
          { key: 'wlp', name: '意志 (WLP)', base: stats.baseWlp, cur: stats.currentWlp, desc: '心靈剛毅·魔力' }
        ].map(stat => (
          <div
            key={stat.key}
            onClick={() => onOpenDice && onOpenDice()}
            className="bg-[#fffdf9] rounded-2xl p-3.5 border border-[#d6c7ab] flex flex-col items-center gap-1 shadow-sm cursor-pointer hover:border-amber-600 transition-all text-center group"
            title="點擊呼叫全域骰盅"
          >
            <span className="text-xs font-bold text-[#6b5a4b] group-hover:text-amber-900">
              {stat.name}
            </span>
            <div className="text-2xl font-serif font-black text-[#3c2415] flex items-baseline gap-1">
              <span>d{stat.cur}</span>
              {stat.cur < stat.base && (
                <span className="text-xs text-red-600 line-through font-mono">d{stat.base}</span>
              )}
            </div>
            <span className="text-[10px] text-[#8c7b6c]">{stat.desc}</span>
          </div>
        ))}
      </div>

      {/* Sub-Tabs: Attacks, Skills, Bonds, Clocks, Notes */}
      <div className="bg-[#fffdf9] rounded-2xl border border-[#d6c7ab] overflow-hidden shadow-sm">
        <div className="flex items-center gap-1 p-2 bg-[#f5efdf] border-b border-[#d6c7ab] overflow-x-auto">
          {[
            { id: 'attacks', label: '⚔️ 武器與防禦', icon: Swords },
            { id: 'skills', label: '⚡ 職業特技', icon: Zap },
            { id: 'bonds', label: '💖 情感羈絆', icon: Heart },
            { id: 'clocks', label: '⏱️ 個人命刻', icon: Clock },
            { id: 'notes', label: '🎒 行囊日誌', icon: Backpack }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'text-[#6b5a4b] hover:bg-[#ebdcc4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {/* TAB: Attacks & Defenses */}
          {activeTab === 'attacks' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Defense Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#fbf7ee] rounded-xl border border-[#d6c7ab] text-center font-mono">
                <div>
                  <span className="text-[#8c7b6c] block text-[11px]">物理防禦 (DEF)</span>
                  <span className="text-lg font-black text-amber-900">{stats.def}</span>
                </div>
                <div>
                  <span className="text-[#8c7b6c] block text-[11px]">魔法防禦 (M.DEF)</span>
                  <span className="text-lg font-black text-blue-900">{stats.mdef}</span>
                </div>
                <div>
                  <span className="text-[#8c7b6c] block text-[11px]">先攻修正 (INIT)</span>
                  <span className="text-lg font-black text-[#3c2415]">+{stats.init}</span>
                </div>
              </div>

              {/* Weapon attack card */}
              <div className="p-3.5 bg-[#fbf7ee] rounded-xl border border-[#d6c7ab] flex items-center justify-between gap-3 shadow-sm">
                <div>
                  <div className="font-bold text-sm text-[#3c2415] flex items-center gap-1.5">
                    <span>⚔️ {character.equipment?.mainHand || '無手空拳'}</span>
                    <span className="text-[11px] font-mono text-stone-500">[{weapon.range || '近戰'}]</span>
                  </div>
                  <div className="font-mono text-xs text-amber-900 mt-1">
                    命中檢定: <strong>【{weapon.attr || 'DEX + MIG'}】</strong> · 傷害: <strong>{weapon.damage || '【HR + 0】物理'}</strong>
                  </div>
                </div>

                {onOpenDice && (
                  <button
                    onClick={onOpenDice}
                    className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-sm flex items-center gap-1 shrink-0"
                  >
                    <Dices className="w-4 h-4" />
                    <span>擲骰</span>
                  </button>
                )}
              </div>

              {/* Other Gear */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#fbf7ee] border border-[#d6c7ab]">
                  <span className="text-[#8c7b6c] block">副手/盾牌:</span>
                  <strong className="text-[#3c2415]">{character.equipment?.offHand || '無'}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-[#fbf7ee] border border-[#d6c7ab]">
                  <span className="text-[#8c7b6c] block">防具裝甲:</span>
                  <strong className="text-[#3c2415]">{character.equipment?.armor || '無'}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-[#fbf7ee] border border-[#d6c7ab]">
                  <span className="text-[#8c7b6c] block">佩戴飾品:</span>
                  <strong className="text-[#3c2415]">{character.equipment?.accessory || '無'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Class Skills */}
          {activeTab === 'skills' && (
            <div className="space-y-3 animate-fade-in text-xs">
              {(character.classes || []).map((cl, cIdx) => (
                <div key={cIdx} className="space-y-2">
                  <div className="flex items-center gap-2 border-b border-[#d6c7ab]/60 pb-1">
                    <span className="font-serif font-black text-sm text-amber-900">{cl.className}</span>
                    <JRPGBadge variant="gold" size="xs">Lv {cl.level}</JRPGBadge>
                  </div>

                  <div className="space-y-1.5">
                    {(cl.skills || []).map((sk, sIdx) => {
                      const classDef = rulesData.classes[cl.className];
                      const skillDef = classDef?.skills?.find(s => s.name === sk.name);
                      return (
                        <div key={sIdx} className="p-2.5 bg-[#fbf7ee] rounded-lg border border-[#d6c7ab]">
                          <div className="flex items-center justify-between font-bold text-[#3c2415] mb-0.5">
                            <span>✦ {sk.name}</span>
                            <span className="font-mono text-[11px] text-amber-900">SL {sk.sl}</span>
                          </div>
                          <p className="text-[11px] text-[#6b5a4b] leading-relaxed">
                            {skillDef?.desc || '暫無描述'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: Bonds */}
          {activeTab === 'bonds' && (
            <div className="space-y-3 animate-fade-in text-xs">
              {(character.bonds || []).map((bond, bIdx) => (
                <div key={bIdx} className="p-3 bg-[#fbf7ee] rounded-xl border border-[#d6c7ab] flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-[#3c2415]">{bond.target}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {bond.feelings?.map(f => (
                        <span key={f} className="px-2 py-0.5 rounded bg-white border border-[#d6c7ab] text-[11px] text-amber-900 font-bold">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if ((character.fabulaPoints || 3) <= 0) {
                        showToast('⚠️ 物語點 (FP) 不足');
                        return;
                      }
                      adjustFp(-1);
                      showToast(`✨ 消耗 1 FP 激活對【${bond.target}】之羈絆！檢定獲得 +${bond.feelings?.length || 1} 加值！`);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 font-bold text-xs shrink-0"
                  >
                    激勵 (+{bond.feelings?.length || 1})
                  </button>
                </div>
              ))}

              {(character.bonds || []).length === 0 && (
                <p className="text-center text-[#8c7b6c] py-4">尚未建立羈絆。</p>
              )}
            </div>
          )}

          {/* TAB: Clocks */}
          {activeTab === 'clocks' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(character.clocks || []).map(clk => (
                  <ClockTracker
                    key={clk.id}
                    title={clk.title}
                    totalSegments={clk.totalSegments || 6}
                    filledSegments={clk.filledSegments || 0}
                    theme={clk.theme || 'amber'}
                    type={clk.type || 'circle'}
                    size={90}
                    onChange={newVal => {
                      const updated = (character.clocks || []).map(c => c.id === clk.id ? { ...c, filledSegments: newVal } : c);
                      updateField('clocks', updated);
                    }}
                  />
                ))}
              </div>
              {(character.clocks || []).length === 0 && (
                <p className="text-center text-[#8c7b6c] py-4 text-xs">暫無個人命刻。</p>
              )}
            </div>
          )}

          {/* TAB: Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-2 animate-fade-in text-xs">
              <textarea
                value={character.backpackNotes || ''}
                onChange={e => updateField('backpackNotes', e.target.value)}
                placeholder="在此記錄冒險日記、行囊物品、NPC 線索或秘密契約..."
                rows={6}
                className="w-full bg-[#fbf7ee] border border-[#d6c7ab] rounded-xl p-3 text-xs text-[#2c221e] outline-none focus:border-amber-700 leading-relaxed shadow-inner"
              />
            </div>
          )}
        </div>
      </div>

      {/* Level Up Drawer / Modal */}
      {isLevelUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fffdf9] border-2 border-[#d6c7ab] rounded-2xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#d6c7ab] pb-3">
              <h3 className="font-serif font-black text-lg text-amber-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                角色升級 (Level Up: Lv {character.level} ➔ {character.level + 1})
              </h3>
              <button
                onClick={() => setIsLevelUpModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6b5a4b] leading-relaxed">
              升級將消耗 <strong>10 點 EXP</strong>，角色等級提升 1 級，最大 HP +1、最大 MP +1，並可選擇分配 1 點特技！
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-[#3c2415] block mb-1">
                  選擇欲升級的職業:
                </label>
                <select
                  value={selectedClassForLevelUp}
                  onChange={e => {
                    setSelectedClassForLevelUp(e.target.value);
                    setSelectedSkillForLevelUp('');
                  }}
                  className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-2 text-xs text-[#2c221e] outline-none shadow-sm"
                >
                  <option value="" disabled>-- 選擇職業 --</option>
                  {(character.classes || []).map(cl => (
                    <option key={cl.className} value={cl.className}>
                      {cl.className} (目前 Lv {cl.level})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClassForLevelUp && (
                <div>
                  <label className="text-xs font-bold text-[#3c2415] block mb-1">
                    選擇欲升級或習得的技能:
                  </label>
                  <select
                    value={selectedSkillForLevelUp}
                    onChange={e => setSelectedSkillForLevelUp(e.target.value)}
                    className="w-full bg-[#fffdf9] border border-[#d6c7ab] rounded-lg px-3 py-2 text-xs text-[#2c221e] outline-none shadow-sm"
                  >
                    <option value="" disabled>-- 選擇特技 --</option>
                    {rulesData.classes[selectedClassForLevelUp]?.skills?.map(sk => {
                      const curClass = (character.classes || []).find(c => c.className === selectedClassForLevelUp);
                      const curSk = curClass?.skills?.find(s => s.name === sk.name);
                      const curSL = curSk?.sl || 0;
                      return (
                        <option key={sk.name} value={sk.name} disabled={curSL >= sk.maxSL}>
                          {sk.name} (目前 SL {curSL} / {sk.maxSL}) {curSL >= sk.maxSL ? '【已升滿】' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#d6c7ab]">
              <JRPGButton
                variant="ghost"
                size="sm"
                onClick={() => setIsLevelUpModalOpen(false)}
              >
                取消
              </JRPGButton>
              <JRPGButton
                variant="primary"
                size="sm"
                onClick={handleExecuteLevelUp}
                disabled={!selectedClassForLevelUp || !selectedSkillForLevelUp}
              >
                確認升級 (-10 EXP)
              </JRPGButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
