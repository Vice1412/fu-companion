import React, { useState } from 'react';
import {
  GiGearHammer,
  GiRoundBottomFlask,
  GiBroadsword,
  GiGears,
  GiSparkles,
  GiCoins,
  GiCancel,
  GiCheckMark,
  GiHazardSign,
  GiCrystalBall,
  GiCrossedSwords,
  GiDiceSixFacesFive
} from 'react-icons/gi';
import { Plus } from 'lucide-react';
import ClockTracker from '../../../../components/ui/ClockTracker';
import JRPGButton from '../../../../components/ui/JRPGButton';
import { renderTextWithAffinities } from '../../../../components/ui/FUIcon';
import { calculateCharacterStats } from '../../utils/characterEngine';
import rulesData from '../../data/rulesData.json';

export default function TinkererWorkshop({
  character,
  onChange,
  onOpenDice = () => {},
  showToast = () => {}
}) {
  const stats = calculateCharacterStats(character);
  const curHp = character.currentHp !== null && character.currentHp !== undefined ? character.currentHp : (stats.maxHp || 50);
  const curMp = character.currentMp !== null && character.currentMp !== undefined ? character.currentMp : (stats.maxMp || 40);
  const curIp = character.currentIp !== null && character.currentIp !== undefined ? character.currentIp : (stats.maxIp || 6);
  const maxIp = stats.maxIp || 6;
  const maxMp = stats.maxMp || 40;

  const tinkererClass = (character.classes || []).find(c => c.className === '修補匠');
  const gadgetSkill = (tinkererClass?.skills || []).find(s => s.name === '小工具');
  const gadgetSL = gadgetSkill?.sl || 0;

  const visionarySkill = (tinkererClass?.skills || []).find(s => s.name === '高瞻遠矚');
  const visionarySL = visionarySkill?.sl || 0;
  const freeCostDiscount = visionarySL * 100;
  const extraProgressPerDay = visionarySL;

  const characterLevel = character.level || 5;

  // 修補匠資料
  const tinkererData = character.tinkererData || {};
  const projects = tinkererData.projects || [];
  const gadgets = tinkererData.gadgets || {
    alchemy: 0,
    infusion: 0,
    magitech: 0,
    magitechSpells: []
  };

  const hasGadgets = gadgetSL > 0;

  // 主標籤切換（若有小工具預設為小工具工坊，否則為造物專案）
  const [activeTab, setActiveTab] = useState(hasGadgets ? 'gadgets' : 'projects');

  // 小工具子標籤（煉金術、灌注術、魔導科技）
  const [activeGadgetSubTab, setActiveGadgetSubTab] = useState(
    gadgets.alchemy > 0 ? 'alchemy' : gadgets.infusion > 0 ? 'infusion' : 'magitech'
  );

  // ----------------------------------------------------
  // 造物專案狀態
  // ----------------------------------------------------
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTier, setNewTier] = useState('實用專案');
  const [newZenit, setNewZenit] = useState('500');
  const [newClockSegments, setNewClockSegments] = useState(6);
  const [newNotes, setNewNotes] = useState('');

  // ----------------------------------------------------
  // 煉金術狀態
  // ----------------------------------------------------
  const [rolledDice, setRolledDice] = useState([]); // [d20, d20, ...]
  const [targetDieIndex, setTargetDieIndex] = useState(null);
  const [effectDieIndex, setEffectDieIndex] = useState(null);
  const [useFallbackEffect, setUseFallbackEffect] = useState(null); // 'poison' or 'heal' or null
  const [manualInputMode, setManualInputMode] = useState(false);
  const [manualValues, setManualValues] = useState({ die0: '10', die1: '10', die2: '10', die3: '10' });

  // ----------------------------------------------------
  // 灌注術狀態
  // ----------------------------------------------------
  const [activeInfusion, setActiveInfusion] = useState(null);

  // ----------------------------------------------------
  // 魔導科技狀態
  // ----------------------------------------------------
  const [magcannonAffinity, setMagcannonAffinity] = useState('火');

  const updateCharacterData = (newTinkererData, vitalChanges = {}) => {
    onChange({
      ...character,
      ...vitalChanges,
      tinkererData: {
        ...tinkererData,
        ...newTinkererData
      },
      updatedAt: new Date().toISOString()
    });
  };

  // 道具點 (IP) 與魔力值 (MP) 扣除輔助函式
  const consumeIp = (amount, label = '道具點') => {
    if (curIp < amount) {
      showToast(`【${label}】不足！需要 ${amount} 點，目前僅剩 ${curIp} 點。`, 'warning');
      return null;
    }
    return Math.max(0, curIp - amount);
  };

  const consumeMp = (amount, label = '魔力值') => {
    if (curMp < amount) {
      showToast(`【${label}】不足！需要 ${amount} 點，目前僅剩 ${curMp} 點。`, 'warning');
      return null;
    }
    return Math.max(0, curMp - amount);
  };

  // ----------------------------------------------------
  // 造物專案處理
  // ----------------------------------------------------
  const handleClockChange = (projId, newFilled) => {
    const updated = projects.map(p => {
      if (p.id === projId) {
        const isDone = newFilled >= p.totalClock;
        return { ...p, filledClock: newFilled, completed: isDone };
      }
      return p;
    });
    updateCharacterData({ projects: updated });
    const target = projects.find(p => p.id === projId);
    if (newFilled >= target.totalClock) {
      showToast(`專案【${target.name}】命刻已填滿！可以完工入庫！`, 'success');
    }
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      showToast('請輸入專案名稱', 'warning');
      return;
    }

    const created = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      tier: newTier,
      zenit: parseInt(newZenit, 10) || 500,
      totalClock: parseInt(newClockSegments, 10) || 6,
      filledClock: 0,
      notes: newNotes.trim(),
      completed: false
    };

    updateCharacterData({ projects: [created, ...projects] });
    setNewProjectName('');
    setNewNotes('');
    setIsAddModalOpen(false);
    showToast(`已建立新造物專案【${created.name}】！`, 'success');
  };

  const handleDeleteProject = (projId) => {
    const updated = projects.filter(p => p.id !== projId);
    updateCharacterData({ projects: updated });
    showToast('已移除造物專案');
  };

  // ----------------------------------------------------
  // 煉金術調配計算
  // ----------------------------------------------------
  const alchemyTier = gadgets.alchemy || 0;
  const alchemyDiceCount = alchemyTier === 1 ? 2 : alchemyTier === 2 ? 3 : 4;
  const alchemyIpCost = alchemyTier === 1 ? 3 : alchemyTier === 2 ? 4 : 5;

  const handleRollAlchemy = () => {
    if (alchemyTier <= 0) return;
    const nextIp = consumeIp(alchemyIpCost, '道具點');
    if (nextIp === null) return;

    // 擲指定數量的 d20
    const results = [];
    for (let i = 0; i < alchemyDiceCount; i++) {
      results.push(Math.floor(Math.random() * 20) + 1);
    }
    setRolledDice(results);
    setTargetDieIndex(0);
    setEffectDieIndex(1);
    setUseFallbackEffect(null);

    updateCharacterData(tinkererData, { currentIp: nextIp });
    showToast(`消耗 ${alchemyIpCost} 道具點成功調配！擲出 [${results.join(', ')}]，剩餘 ${nextIp} 道具點。`, 'success');
  };

  const handleApplyManualDice = () => {
    const results = [];
    for (let i = 0; i < alchemyDiceCount; i++) {
      const val = parseInt(manualValues[`die${i}`], 10) || 10;
      results.push(Math.min(20, Math.max(1, val)));
    }
    setRolledDice(results);
    setTargetDieIndex(0);
    setEffectDieIndex(1);
    setUseFallbackEffect(null);
    showToast(`已設定外部骰點 [${results.join(', ')}]！`, 'info');
  };

  // 取得目標解析
  const getAlchemyTargetInfo = (roll) => {
    if (!roll) return { label: '請選擇一顆骰子指派為目標', desc: '' };
    if (roll <= 6) return { label: '你或場景中一名你看得見的盟友', range: '1~6' };
    if (roll <= 11) return { label: '場景中一名你看得見的敵人', range: '7~11' };
    if (roll <= 16) return { label: '你與場景中你看得見的所有盟友', range: '12~16' };
    return { label: '場景中你看得見的每名敵人', range: '17~20' };
  };

  // 取得效果解析
  const getAlchemyEffectInfo = (roll) => {
    if (useFallbackEffect === 'poison') {
      const dmg = characterLevel >= 40 ? 40 : characterLevel >= 20 ? 30 : 20;
      return { label: `受到 ${dmg} 點毒屬性傷害`, isFallback: true };
    }
    if (useFallbackEffect === 'heal') {
      return { label: '恢復 30 點 HP', isFallback: true };
    }
    if (!roll) return { label: '請選擇一顆骰子指派為效果', desc: '' };

    const dmg = characterLevel >= 40 ? 40 : characterLevel >= 20 ? 30 : 20;
    switch (roll) {
      case 1: return { label: 'DEX 與 MIG 骰尺寸提升一階（最高為 d12），持續至你的下個回合結束' };
      case 2: return { label: 'INS 與 WLP 骰尺寸提升一階（最高為 d12），持續至你的下個回合結束' };
      case 3: return { label: `受到 ${dmg} 點風屬性傷害` };
      case 4: return { label: `受到 ${dmg} 點電屬性傷害` };
      case 5: return { label: `受到 ${dmg} 點暗屬性傷害` };
      case 6: return { label: `受到 ${dmg} 點土屬性傷害` };
      case 7: return { label: `受到 ${dmg} 點火屬性傷害` };
      case 8: return { label: `受到 ${dmg} 點冰屬性傷害` };
      case 9: return { label: '獲得對風屬性與火屬性傷害的抗性，持續至場景結束' };
      case 10: return { label: '獲得對電屬性與冰屬性傷害的抗性，持續至場景結束' };
      case 11: return { label: '獲得對暗屬性與土屬性傷害的抗性，持續至場景結束' };
      case 12: return { label: '陷入憤怒狀態' };
      case 13: return { label: '陷入中毒狀態' };
      case 14: return { label: '同時陷入眩暈、動搖、緩慢與虛弱狀態' };
      case 15: return { label: '解除所有狀態效果' };
      case 16:
      case 17: return { label: '恢復 50 點 HP 與 50 點 MP' };
      case 18: return { label: '恢復 100 點 HP' };
      case 19: return { label: '恢復 100 點 MP' };
      case 20: return { label: '恢復 100 點 HP 與 100 點 MP' };
      default: return { label: '未知效果' };
    }
  };

  const targetDieValue = targetDieIndex !== null ? rolledDice[targetDieIndex] : null;
  const effectDieValue = effectDieIndex !== null ? rolledDice[effectDieIndex] : null;
  const currentTargetInfo = getAlchemyTargetInfo(targetDieValue);
  const currentEffectInfo = getAlchemyEffectInfo(effectDieValue);

  // ----------------------------------------------------
  // 灌注術處理
  // ----------------------------------------------------
  const handleApplyInfusion = (inf) => {
    const nextIp = consumeIp(2, '道具點');
    if (nextIp === null) return;

    setActiveInfusion(inf);
    updateCharacterData(tinkererData, { currentIp: nextIp });
    showToast(`已消耗 2 道具點套用灌注【${inf.name}】！剩餘 ${nextIp} 道具點。`, 'success');
  };

  // ----------------------------------------------------
  // 魔導科技處理
  // ----------------------------------------------------
  const handleUsurpConstruct = () => {
    const nextMp = consumeMp(10, '魔力值');
    if (nextMp === null) return;

    updateCharacterData(tinkererData, { currentMp: nextMp });
    showToast(`已消耗 10 點魔力值發起【魔科技篡奪】！剩餘 ${nextMp} MP。請執行【INS + INS】檢定。`, 'info');
    onOpenDice('魔科技篡奪檢定', {
      attr1: character.attributes?.ins || 8,
      attr2: character.attributes?.ins || 8,
      modifier: 0
    });
  };

  const handleBuildMagcannon = () => {
    const nextIp = consumeIp(3, '道具點');
    if (nextIp === null) return;

    const newMagcannonWeapon = {
      id: `magcannon_${Date.now()}`,
      name: `魔加農【${magcannonAffinity}】`,
      category: '火器',
      hands: '雙手',
      range: '遠程',
      attr1: 'dex',
      attr2: 'ins',
      accuracyMod: 1,
      damage: `【HR + 10】${magcannonAffinity}`,
      equipped: true,
      cost: 0,
      quality: '魔科技造物，無法擁有特性'
    };

    // 將角色目前現有的魔加農移除（規則：一旦建立新的，先前的就會碎裂）
    const existingWeapons = (character.weapons || []).filter(w => !w.name.startsWith('魔加農'));

    onChange({
      ...character,
      currentIp: nextIp,
      weapons: [newMagcannonWeapon, ...existingWeapons],
      updatedAt: new Date().toISOString()
    });

    showToast(`消耗 3 道具點成功製造【${newMagcannonWeapon.name}】並已裝備！剩餘 ${nextIp} 道具點。`, 'success');
  };

  const handleCastSpellOrb = (spellName) => {
    const spellDef = (rulesData.spells || []).find(s => s.name === spellName);
    if (!spellDef) return;

    const nextIp = consumeIp(2, '道具點');
    if (nextIp === null) return;

    const spellMp = parseInt(spellDef.mp, 10) || 10;
    const nextMp = consumeMp(spellMp, '魔力值');
    if (nextMp === null) return;

    updateCharacterData(tinkererData, { currentIp: nextIp, currentMp: nextMp });
    showToast(`消耗 2 道具點與 ${spellMp} 點魔力值快捷施放魔法球【${spellName}】！剩餘 ${nextIp} 道具點、${nextMp} MP。`, 'success');

    // 開啟施法檢定
    onOpenDice(`魔法球施法：${spellName}`, {
      attr1: character.attributes?.ins || 8,
      attr2: character.attributes?.wlp || 8,
      modifier: 0
    });
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/70 dark:from-slate-900 dark:via-slate-800 dark:to-amber-950/20 border border-amber-300/80 dark:border-amber-700/60 shadow-sm space-y-4 text-xs font-sans text-slate-800 dark:text-slate-100">
      
      {/* 標頭切換列 */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-amber-200 dark:border-amber-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
            <GiGearHammer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>修補匠工坊</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                道具點：{curIp} / {maxIp}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {hasGadgets ? '小工具科技實裝調配與造物專案追蹤' : '造物專案推進與工藝研發'}
            </p>
          </div>
        </div>

        {/* 標籤按鈕組 */}
        <div className="flex items-center gap-1.5 bg-amber-100/60 dark:bg-slate-800 p-1 rounded-xl border border-amber-200 dark:border-slate-700">
          {hasGadgets && (
            <button
              type="button"
              onClick={() => setActiveTab('gadgets')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'gadgets'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-amber-200/50 dark:hover:bg-slate-700'
              }`}
            >
              <GiGears className="w-4 h-4" />
              <span>小工具工坊</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-amber-200/50 dark:hover:bg-slate-700'
            }`}
          >
            <GiGearHammer className="w-4 h-4" />
            <span>造物專案 ({projects.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 標籤頁 1：小工具工坊 (Gadgets) */}
      {/* ======================================================== */}
      {activeTab === 'gadgets' && hasGadgets && (
        <div className="space-y-4 animate-fade-in">
          
          {/* 小工具三大派系切換按鈕 */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveGadgetSubTab('alchemy')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeGadgetSubTab === 'alchemy'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-300'
              }`}
            >
              <GiRoundBottomFlask className="w-4 h-4" />
              <span>煉金術</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/15 font-mono">
                Tier {gadgets.alchemy || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGadgetSubTab('infusion')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeGadgetSubTab === 'infusion'
                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-300'
              }`}
            >
              <GiBroadsword className="w-4 h-4" />
              <span>灌注術</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/15 font-mono">
                Tier {gadgets.infusion || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveGadgetSubTab('magitech')}
              className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeGadgetSubTab === 'magitech'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-300'
              }`}
            >
              <GiGears className="w-4 h-4" />
              <span>魔導科技</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/15 font-mono">
                Tier {gadgets.magitech || 0}
              </span>
            </button>
          </div>

          {/* ① 煉金術調配台 */}
          {activeGadgetSubTab === 'alchemy' && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-amber-300 dark:border-amber-700 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200 dark:border-slate-700 pb-2.5">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <GiRoundBottomFlask className="w-5 h-5 text-amber-600" />
                    <span>煉金術混合調配台</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 font-bold">
                      {alchemyTier === 0 ? '尚未研發' : alchemyTier === 1 ? '基礎混合 (2d20 · 3 IP)' : alchemyTier === 2 ? '進階混合 (3d20 · 4 IP)' : '最高混合 (4d20 · 5 IP)'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    隨機調配藥劑：擲出 d20 骰組後，選擇一顆指派給【目標】、一顆指派給【效果】
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManualInputMode(!manualInputMode)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    {manualInputMode ? '切換回系統擲骰' : '手動輸入骰點 (相容 CCFOLIA / Discord)'}
                  </button>
                </div>
              </div>

              {alchemyTier === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 space-y-1">
                  <p className="font-bold">尚未解鎖煉金術派系</p>
                  <p className="text-[11px]">請在角色卡技能配置中將【小工具】投入煉金術分支。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 調配按鈕區 */}
                  {!manualInputMode ? (
                    <div className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800 flex-wrap">
                      <div className="text-xs text-amber-900 dark:text-amber-200">
                        點擊調配將自動扣除 <strong className="font-mono text-sm">{alchemyIpCost} IP</strong> 並擲出 <strong className="font-mono">{alchemyDiceCount} 個 d20</strong>：
                      </div>

                      <JRPGButton
                        variant="primary"
                        size="sm"
                        icon={GiRoundBottomFlask}
                        onClick={handleRollAlchemy}
                      >
                        現場調配 ({alchemyIpCost} IP)
                      </JRPGButton>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                        手動填寫在 Discord 或 CCFOLIA 擲出的 {alchemyDiceCount} 個 d20 點數：
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {Array.from({ length: alchemyDiceCount }).map((_, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="font-mono text-[11px] text-slate-500">d20 #{idx + 1}:</span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={manualValues[`die${idx}`] || ''}
                              onChange={(e) => setManualValues({ ...manualValues, [`die${idx}`]: e.target.value })}
                              className="w-14 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 font-mono text-center text-xs"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleApplyManualDice}
                          className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                        >
                          確認點數
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 擲出的骰子選擇條 */}
                  {rolledDice.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-slate-700/30 border border-amber-200 dark:border-slate-600 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                        <span>點擊骰子指派至目標或效果：</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          （未指派之骰子將自動捨棄）
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {rolledDice.map((val, idx) => {
                          const isTarget = targetDieIndex === idx;
                          const isEffect = effectDieIndex === idx;
                          const isDiscarded = !isTarget && !isEffect;

                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 min-w-[76px] transition-all shadow-2xs ${
                                isTarget
                                  ? 'bg-blue-100 dark:bg-blue-900/60 border-blue-500 text-blue-950 dark:text-blue-100 ring-2 ring-blue-400'
                                  : isEffect
                                  ? 'bg-rose-100 dark:bg-rose-900/60 border-rose-500 text-rose-950 dark:text-rose-100 ring-2 ring-rose-400'
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 opacity-60'
                              }`}
                            >
                              <span className="font-mono text-lg font-black">{val}</span>

                              <div className="flex items-center gap-1 mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (effectDieIndex === idx) setEffectDieIndex(targetDieIndex);
                                    setTargetDieIndex(idx);
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                    isTarget ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-100'
                                  }`}
                                >
                                  目標
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (targetDieIndex === idx) setTargetDieIndex(effectDieIndex);
                                    setEffectDieIndex(idx);
                                    setUseFallbackEffect(null);
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                    isEffect ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-100'
                                  }`}
                                >
                                  效果
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 備用效果按鈕 */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="text-slate-500">備選效果（無須符合骰點）：</span>
                        <button
                          type="button"
                          onClick={() => setUseFallbackEffect(useFallbackEffect === 'poison' ? null : 'poison')}
                          className={`px-2 py-0.5 rounded border font-bold cursor-pointer transition-all ${
                            useFallbackEffect === 'poison'
                              ? 'bg-purple-600 text-white border-purple-700'
                              : 'bg-white dark:bg-slate-800 border-slate-300 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          任意：造成毒傷害
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseFallbackEffect(useFallbackEffect === 'heal' ? null : 'heal')}
                          className={`px-2 py-0.5 rounded border font-bold cursor-pointer transition-all ${
                            useFallbackEffect === 'heal'
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white dark:bg-slate-800 border-slate-300 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          任意：恢復 30 點 HP
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 當前調配結果呈現 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 目標解析卡 */}
                    <div className="p-3 rounded-xl border border-blue-300 dark:border-blue-700/80 bg-blue-50/50 dark:bg-blue-950/20 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                        <span>【目標】指派 (骰值 {targetDieValue || '-'})</span>
                        <span className="font-mono text-[10px]">{currentTargetInfo.range || ''}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                        {currentTargetInfo.label}
                      </p>
                    </div>

                    {/* 效果解析卡 */}
                    <div className="p-3 rounded-xl border border-rose-300 dark:border-rose-700/80 bg-rose-50/50 dark:bg-rose-950/20 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-900 dark:text-rose-300">
                        <span>【效果】指派 (骰值 {useFallbackEffect ? '任意' : effectDieValue || '-'})</span>
                        {useFallbackEffect && (
                          <span className="font-bold text-[10px] text-purple-700 dark:text-purple-300">備選生效中</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                        {renderTextWithAffinities(currentEffectInfo.label)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ② 武器灌注選單 */}
          {activeGadgetSubTab === 'infusion' && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-cyan-300 dark:border-cyan-700 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200 dark:border-slate-700 pb-2.5">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <GiBroadsword className="w-5 h-5 text-cyan-600" />
                    <span>武器灌注工藝</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200 font-bold">
                      {gadgets.infusion === 0 ? '尚未研發' : gadgets.infusion === 1 ? '基礎灌注' : gadgets.infusion === 2 ? '進階灌注' : '最高灌注'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    攻擊命中後花費 2 IP 注入特定元素屬性，使傷害轉型並附加特殊異常
                  </p>
                </div>

                {activeInfusion && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 font-bold text-xs border border-cyan-300 dark:border-cyan-800">
                    <GiCheckMark className="w-3.5 h-3.5" />
                    <span>已套用【{activeInfusion.name}】</span>
                    <button
                      type="button"
                      onClick={() => setActiveInfusion(null)}
                      className="ml-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="清除"
                    >
                      <GiCancel className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {gadgets.infusion === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 space-y-1">
                  <p className="font-bold">尚未解鎖灌注術派系</p>
                  <p className="text-[11px]">請在角色卡技能配置中將【小工具】投入灌注術分支。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {/* 基礎灌注 */}
                  {[
                    { name: '低溫', affinity: '冰', desc: '額外造成 5 點傷害，傷害類型轉為【冰】屬性。' },
                    { name: '焦火', affinity: '火', desc: '額外造成 5 點傷害，傷害類型轉為【火】屬性。' },
                    { name: '電壓', affinity: '電', desc: '額外造成 5 點傷害，傷害類型轉為【電】屬性。' }
                  ].map((inf) => (
                    <div
                      key={inf.name}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                          <span className="flex items-center gap-1.5">
                            <GiBroadsword className="w-3.5 h-3.5 text-cyan-600" />
                            {inf.name}
                          </span>
                          <span className="font-mono text-[10px] text-cyan-700 dark:text-cyan-300 font-bold bg-cyan-50 dark:bg-cyan-950 px-1.5 py-0.5 rounded">
                            2 IP
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {renderTextWithAffinities(inf.desc)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyInfusion(inf)}
                        className="w-full mt-2 py-1 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        套用此灌注 (2 IP)
                      </button>
                    </div>
                  ))}

                  {/* 進階灌注 */}
                  {gadgets.infusion >= 2 && [
                    { name: '疾風', affinity: '風', desc: '額外造成 5 點傷害，傷害類型轉為【風】屬性。' },
                    { name: '驅邪', affinity: '光', desc: '額外造成 5 點傷害，傷害類型轉為【光】屬性。' },
                    { name: '地震', affinity: '土', desc: '額外造成 5 點傷害，傷害類型轉為【土】屬性。' },
                    { name: '暗影', affinity: '暗', desc: '額外造成 5 點傷害，傷害類型轉為【暗】屬性。' }
                  ].map((inf) => (
                    <div
                      key={inf.name}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                          <span className="flex items-center gap-1.5">
                            <GiBroadsword className="w-3.5 h-3.5 text-cyan-600" />
                            {inf.name}
                          </span>
                          <span className="font-mono text-[10px] text-cyan-700 dark:text-cyan-300 font-bold bg-cyan-50 dark:bg-cyan-950 px-1.5 py-0.5 rounded">
                            2 IP
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {renderTextWithAffinities(inf.desc)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyInfusion(inf)}
                        className="w-full mt-2 py-1 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        套用此灌注 (2 IP)
                      </button>
                    </div>
                  ))}

                  {/* 最高灌注 */}
                  {gadgets.infusion >= 3 && [
                    { name: '吸血', affinity: '物理', desc: '（限單體目標）恢復攻擊目標所受傷害半數之 HP 或 MP。' },
                    { name: '毒液', affinity: '毒', desc: '額外造成 5 點傷害，傷害類型轉為【毒】且令每個被命中的生物陷入中毒狀態。' }
                  ].map((inf) => (
                    <div
                      key={inf.name}
                      className="p-3 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-950/20 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                          <span className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300">
                            <GiBroadsword className="w-3.5 h-3.5 text-purple-600" />
                            {inf.name} (最高)
                          </span>
                          <span className="font-mono text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-900 px-1.5 py-0.5 rounded">
                            2 IP
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {renderTextWithAffinities(inf.desc)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyInfusion(inf)}
                        className="w-full mt-2 py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        套用此灌注 (2 IP)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ③ 魔導科技工坊 */}
          {activeGadgetSubTab === 'magitech' && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-purple-300 dark:border-purple-700 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200 dark:border-slate-700 pb-2.5">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <GiGears className="w-5 h-5 text-purple-600" />
                    <span>魔導科技工坊</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 font-bold">
                      {gadgets.magitech === 0 ? '尚未研發' : gadgets.magitech === 1 ? '基礎篡奪' : gadgets.magitech === 2 ? '魔加農火器' : '魔法球原型'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    奪取士兵構裝體控制權、製造尖端魔加農火器、快捷施放魔法球原型咒語
                  </p>
                </div>
              </div>

              {gadgets.magitech === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 space-y-1">
                  <p className="font-bold">尚未解鎖魔導科技派系</p>
                  <p className="text-[11px]">請在角色卡技能配置中將【小工具】投入魔導科技分支。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 基礎：魔科技篡奪 */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                      <span className="flex items-center gap-1.5">
                        <GiGears className="w-4 h-4 text-purple-600" />
                        魔科技篡奪（基礎）
                      </span>
                      <span className="font-mono text-xs text-purple-700 dark:text-purple-300 font-bold">
                        10 MP · 動作
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      使用動作花費 10 MP，對附近可見的無心智士兵級構裝體執行對抗檢定【INS + INS】。成功則奪取其控制權至場景結束（受傷解除）。
                    </p>
                    <div className="flex justify-end pt-1">
                      <JRPGButton
                        variant="secondary"
                        size="xs"
                        icon={GiDiceSixFacesFive}
                        onClick={handleUsurpConstruct}
                      >
                        發起篡奪檢定 (10 MP)
                      </JRPGButton>
                    </div>
                  </div>

                  {/* 進階：魔加農火器 */}
                  {gadgets.magitech >= 2 && (
                    <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 space-y-2.5">
                      <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-1.5">
                          <GiCrossedSwords className="w-4 h-4 text-purple-600" />
                          魔加農火器製造（進階）
                        </span>
                        <span className="font-mono text-xs text-purple-700 dark:text-purple-300 font-bold">
                          3 IP · 火器武器
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            魔加農【雙手 · 遠程 · 無特性】
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            命中：【DEX + INS】+1 | 傷害：【HR + 10】{renderTextWithAffinities(magcannonAffinity)}
                          </div>
                        </div>

                        {/* 傷害屬性選擇器 */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500">屬性：</span>
                          {['火', '冰', '電', '風', '土', '物理'].map((aff) => (
                            <button
                              key={aff}
                              type="button"
                              onClick={() => setMagcannonAffinity(aff)}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                                magcannonAffinity === aff
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {aff}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>製造後將自動裝備，並使先前舊有的魔加農碎裂銷毀</span>
                        <JRPGButton
                          variant="primary"
                          size="xs"
                          icon={GiBroadsword}
                          onClick={handleBuildMagcannon}
                        >
                          製造魔加農 (3 IP)
                        </JRPGButton>
                      </div>
                    </div>
                  )}

                  {/* 最高：魔法球原型 */}
                  {gadgets.magitech >= 3 && (
                    <div className="p-3.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 space-y-3">
                      <div className="flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                        <span className="flex items-center gap-1.5">
                          <GiCrystalBall className="w-4 h-4 text-purple-600" />
                          魔法球原型施放（最高）
                        </span>
                        <span className="font-mono text-xs text-purple-700 dark:text-purple-300 font-bold">
                          2 IP · 瞬發咒語
                        </span>
                      </div>

                      {(!gadgets.magitechSpells || gadgets.magitechSpells.length === 0) ? (
                        <div className="p-3 rounded-lg border border-dashed border-purple-300 dark:border-purple-800 text-center text-[11px] text-purple-800 dark:text-purple-300">
                          尚未配置原型咒語，請在角色卡技能頁點擊「配置小工具科技樹」進行挑選。
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {gadgets.magitechSpells.map((spName) => {
                            const spDef = (rulesData.spells || []).find(s => s.name === spName);
                            if (!spDef) return null;

                            return (
                              <div
                                key={spName}
                                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col justify-between space-y-2 shadow-2xs"
                              >
                                <div>
                                  <div className="flex items-center justify-between font-bold text-xs text-slate-800 dark:text-slate-100">
                                    <span className="flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        spDef.school === '元素' ? 'bg-red-500' : spDef.school === '靈魂' ? 'bg-cyan-500' : 'bg-purple-500'
                                      }`} />
                                      {spName}
                                    </span>
                                    <span className="font-mono text-[10px] text-purple-700 dark:text-purple-300 font-bold">
                                      {spDef.mp} MP
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                                    {renderTextWithAffinities(spDef.effect || spDef.desc)}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleCastSpellOrb(spName)}
                                  className="w-full py-1 px-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <GiCrystalBall className="w-3.5 h-3.5" />
                                  <span>施放魔法球 (2 IP + {spDef.mp} MP)</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* 標籤頁 2：造物專案 (Projects) */}
      {/* ======================================================== */}
      {activeTab === 'projects' && (
        <div className="space-y-4 animate-fade-in">
          {/* 特技加成提示列 */}
          {visionarySL > 0 && (
            <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <GiSparkles className="w-4 h-4 text-amber-600" />
                <span>特技【高瞻遠矚】生效中 (SL {visionarySL})</span>
              </span>
              <div className="flex items-center gap-3 font-mono font-bold text-amber-800 dark:text-amber-300 text-[11px]">
                <span>材料抵扣：-{freeCostDiscount} z</span>
                <span>每日額外進度：+{extraProgressPerDay} 點/天</span>
              </div>
            </div>
          )}

          {/* 專案列表操作列 */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <GiGearHammer className="w-4 h-4 text-amber-600" />
              <span>進行中的造物專案 ({projects.filter(p => !p.completed).length} 個未完成)</span>
            </span>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>發起新專案</span>
            </button>
          </div>

          {/* 專案卡片列表 */}
          {projects.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/60 text-center text-slate-500 space-y-2">
              <GiGearHammer className="w-8 h-8 mx-auto text-amber-400/80 animate-pulse" />
              <div className="font-bold">目前沒有進行中的造物專案</div>
              <p className="text-[11px]">點擊「發起新專案」建立您的下一項驚人魔導發明！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((proj) => {
                const isDone = proj.filledClock >= proj.totalClock;

                return (
                  <div
                    key={proj.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isDone
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{proj.name}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                          {proj.tier}
                        </span>
                      </div>

                      {proj.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {proj.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                        <span className="flex items-center gap-1">
                          <GiCoins className="w-3.5 h-3.5 text-amber-500" />
                          總成本：{proj.zenit} z
                        </span>
                        {freeCostDiscount > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            (抵扣 {Math.min(proj.zenit, freeCostDiscount)} z)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 命刻時鐘 */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                      <ClockTracker
                        totalSegments={proj.totalClock}
                        filledSegments={proj.filledClock}
                        onChange={(newFilled) => handleClockChange(proj.id, newFilled)}
                        size={60}
                      />

                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          進度 {proj.filledClock} / {proj.totalClock} 格
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="text-[10px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          移除專案
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 新增專案彈窗 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-amber-300 dark:border-amber-700 p-5 space-y-4 text-xs font-sans text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b pb-2 dark:border-slate-700">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GiGearHammer className="w-4 h-4 text-amber-600" />
                <span>發起新造物專案</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <GiCancel className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  發明專案名稱
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="例如：可折疊滑翔翼、多功能魔導工具箱"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    專案類型 / 階級
                  </label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="實用專案">實用專案 (小效力)</option>
                    <option value="中型發明">中型發明 (中效力)</option>
                    <option value="大型工程">大型工程 (大效力)</option>
                    <option value="傳奇巨構">傳奇巨構 (強效力)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    總材料成本 (z)
                  </label>
                  <input
                    type="number"
                    value={newZenit}
                    onChange={(e) => {
                      setNewZenit(e.target.value);
                      const z = parseInt(e.target.value, 10) || 500;
                      // 每 100z 換算 1 格進度
                      const calcClock = Math.max(4, Math.min(12, Math.round(z / 100)));
                      setNewClockSegments(calcClock);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  進度命刻格數 (依每 100z 約 1 格換算)
                </label>
                <div className="flex items-center gap-2">
                  {[4, 6, 8, 10, 12].map((seg) => (
                    <button
                      key={seg}
                      type="button"
                      onClick={() => setNewClockSegments(seg)}
                      className={`flex-1 py-1 rounded-lg border font-mono font-bold text-xs transition-all cursor-pointer ${
                        newClockSegments === seg
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {seg} 格
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  功能備註 / 致命缺陷協商
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="例如：可承載兩人、續航力三小時；致命缺陷：浸水失靈。"
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
