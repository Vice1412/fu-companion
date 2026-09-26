import React, { useState } from 'react';
import { GiPawPrint, GiRollingDices, GiHeartMinus, GiHeartPlus, GiShield, GiBroadsword } from 'react-icons/gi';

export default function WayfarerCompanionSheet({
  character,
  onChange,
  onOpenDice = null,
  showToast = () => {}
}) {
  const wayfarerClass = (character.classes || []).find(c => c.className === '旅人');
  const companionSkill = (wayfarerClass?.skills || []).find(s => s.name === '忠實夥伴');
  const companionSL = companionSkill?.sl || 1;
  const charLevel = character.level || 5;

  // 取得旅人夥伴數據
  const wayfarerData = character.wayfarerData || {
    companion: {
      name: '忠實夥伴',
      species: '野獸',
      dex: 8,
      ins: 6,
      mig: 8,
      wlp: 6,
      currentHp: null,
      attacks: [
        { name: '猛撲撕咬', type: 'melee', attr1: 'MIG', attr2: 'DEX', damage: '【HR + 5】物理' },
        { name: '警覺咆哮', type: 'ranged', attr1: 'DEX', attr2: 'INS', damage: '【HR + 5】物理' }
      ]
    }
  };

  const comp = wayfarerData.companion || {};
  const migDie = comp.mig || 8;
  const dexDie = comp.dex || 8;
  const insDie = comp.ins || 6;
  const wlpDie = comp.wlp || 6;

  // 最大 HP 公式：(SL × 夥伴基礎 MIG 骰尺寸) + 旅人等級的一半（向下取整）
  const maxHp = (companionSL * migDie) + Math.floor(charLevel / 2);
  const crisisHp = Math.floor(maxHp / 2);
  const currentHp = comp.currentHp !== null && comp.currentHp !== undefined ? comp.currentHp : maxHp;
  const isCrisis = currentHp <= crisisHp;

  const updateCompanion = (updates) => {
    onChange({
      ...character,
      wayfarerData: {
        ...wayfarerData,
        companion: {
          ...comp,
          ...updates
        }
      },
      updatedAt: new Date().toISOString()
    });
  };

  const adjustHp = (delta) => {
    const next = Math.max(0, Math.min(maxHp, currentHp + delta));
    updateCompanion({ currentHp: next });
  };

  const handleRollAttack = (atk) => {
    if (!onOpenDice) return;
    const die1 = comp[atk.attr1.toLowerCase()] || 8;
    const die2 = comp[atk.attr2.toLowerCase()] || 8;
    onOpenDice({
      die1,
      die2,
      modifier: companionSL,
      label: `夥伴【${comp.name}】${atk.name} 命中檢定 [${atk.attr1} + ${atk.attr2} + ${companionSL}]`
    });
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-green-50/80 via-white to-emerald-50/60 dark:from-slate-900 dark:via-slate-800 dark:to-green-950/20 border border-green-300/80 dark:border-green-700/60 shadow-sm space-y-4 text-xs">
      {/* 頂部標題與物種標籤 */}
      <div className="flex items-center justify-between border-b border-green-200 dark:border-slate-700 pb-2 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <GiPawPrint className="text-xl text-green-600 dark:text-green-400" />
          <div>
            <h3 className="text-sm font-bold text-green-950 dark:text-green-100 flex items-center gap-2">
              <span>忠實夥伴專屬隨從卡</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-800">
                5 級生物 · SL {companionSL}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={comp.name || ''}
            onChange={e => updateCompanion({ name: e.target.value })}
            placeholder="夥伴名稱"
            className="px-2 py-1 rounded-lg border border-green-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 font-bold outline-none text-xs w-28"
          />
          <select
            value={comp.species || '野獸'}
            onChange={e => updateCompanion({ species: e.target.value })}
            className="px-2 py-1 rounded-lg border border-green-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 font-bold outline-none text-xs"
          >
            <option value="野獸">野獸</option>
            <option value="構造體">構造體</option>
            <option value="元素">元素</option>
            <option value="植物">植物</option>
          </select>
        </div>
      </div>

      {/* 生命值與危機儀表 */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-green-200 dark:border-slate-700 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-700 dark:text-stone-300">夥伴生命值 (HP):</span>
            <span className="font-mono font-black text-sm text-green-700 dark:text-green-400">
              {currentHp} / {maxHp}
            </span>
            {isCrisis && (
              <span className="px-1.5 py-0.2 rounded font-bold text-[10px] bg-red-100 text-red-700 border border-red-300 animate-pulse">
                危機 (≤{crisisHp})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => adjustHp(-5)}
              className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
              title="-5 HP"
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => adjustHp(-1)}
              className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
              title="-1 HP"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => adjustHp(1)}
              className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
              title="+1 HP"
            >
              +1
            </button>
            <button
              type="button"
              onClick={() => adjustHp(5)}
              className="p-1 rounded bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
              title="+5 HP"
            >
              +5
            </button>
          </div>
        </div>

        {/* HP 進度條 */}
        <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCrisis ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (currentHp / maxHp) * 100))}%` }}
          />
        </div>
        <div className="text-[10px] font-mono text-stone-400 flex justify-between">
          <span>公式：(SL {companionSL} × MIG d{migDie}) + 等級({charLevel})/2 = {maxHp}</span>
          <span>防禦：DEF d{dexDie} | M.DEF d{insDie}</span>
        </div>
      </div>

      {/* 四維屬性骰展示與調整 */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-center space-y-0.5">
          <span className="text-[10px] text-stone-400 block font-bold">DEX</span>
          <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-300">d{dexDie}</span>
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-center space-y-0.5">
          <span className="text-[10px] text-stone-400 block font-bold">INS</span>
          <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300">d{insDie}</span>
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-center space-y-0.5">
          <span className="text-[10px] text-stone-400 block font-bold">MIG</span>
          <span className="font-mono font-bold text-sm text-red-700 dark:text-red-300">d{migDie}</span>
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-center space-y-0.5">
          <span className="text-[10px] text-stone-400 block font-bold">WLP</span>
          <span className="font-mono font-bold text-sm text-purple-700 dark:text-purple-300">d{wlpDie}</span>
        </div>
      </div>

      {/* 兩種基礎攻擊欄位與一鍵擲骰 */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-stone-600 dark:text-stone-400">基礎攻擊 (命中檢定獲得 +{companionSL} 加值)</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(comp.attacks || []).map((atk, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-green-200 dark:border-slate-700 shadow-2xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <strong className="text-stone-900 dark:text-stone-100 font-bold">{atk.name}</strong>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-900 text-stone-600">
                  {atk.type === 'melee' ? '近戰' : '遠程'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-[11px] text-stone-600 dark:text-stone-400">
                  [{atk.attr1} + {atk.attr2}] + {companionSL} | {atk.damage}
                </span>
                <button
                  type="button"
                  onClick={() => handleRollAttack(atk)}
                  className="px-2.5 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                >
                  <GiRollingDices className="text-xs" />
                  <span>攻擊</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
