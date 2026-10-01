import React, { useState } from 'react';
import {
  GiSteeringWheel,
  GiCrossedSwords,
  GiShield,
  GiRollingDices,
  GiLightningTear,
  GiBackpack,
  GiUpgrade,
  GiRobotLeg,
  GiWingedSword
} from 'react-icons/gi';
import {
  findFrameById,
  PILOT_ARMOR_MODULES,
  PILOT_WEAPON_MODULES,
  PILOT_SUPPORT_MODULES
} from '../../data/pilotVehicleData';
import { renderTextWithAffinities } from '../../../../components/ui/FUIcon';

export default function PilotVehicleCombatSheet({
  character,
  onChange,
  onOpenDice = null,
  showToast = () => {}
}) {
  const pilotClass = (character.classes || []).find(c => c.className === '機師');
  const vehicleSkill = (pilotClass?.skills || []).find(s => s.name === '個人載具');
  const pilotSl = vehicleSkill?.sl || 1;

  // 取得強力握持技能
  const strongGripSkill = (pilotClass?.skills || []).find(s => s.name === '強力握持');
  const hasStrongGrip = !!strongGripSkill;

  // 取得引擎之心技能
  const engineHeartSkill = (pilotClass?.skills || []).find(s => s.name === '引擎之心');
  const engineHeartSl = engineHeartSkill?.sl || 0;

  // 取得壓縮技術技能
  const compressionSkill = (pilotClass?.skills || []).find(s => s.name === '壓縮技術');

  const vehicle = character.pilotVehicle || {
    name: '個人載具',
    frameId: 'exoskeleton',
    unlockedModules: [],
    activeModules: [],
    antiElementChoice: '風',
    secondaryOffensiveWeaponId: '',
    isMounted: false
  };

  const frame = findFrameById(vehicle.frameId);
  const isMounted = !!vehicle.isMounted;

  // 解析啟用的各類模組
  const activeWeapons = (vehicle.activeModules || [])
    .map(id => PILOT_WEAPON_MODULES.find(w => w.id === id))
    .filter(Boolean);

  const activeArmor = (vehicle.activeModules || [])
    .map(id => PILOT_ARMOR_MODULES.find(a => a.id === id))
    .filter(Boolean);

  const activeSupport = (vehicle.activeModules || [])
    .map(id => PILOT_SUPPORT_MODULES.find(s => s.id === id))
    .filter(Boolean);

  const updateVehicle = (updates) => {
    onChange({
      ...character,
      pilotVehicle: {
        ...vehicle,
        ...updates
      },
      updatedAt: new Date().toISOString()
    });
  };

  const toggleMounted = () => {
    const nextMounted = !isMounted;
    updateVehicle({ isMounted: nextMounted });
    showToast(nextMounted ? `搭乘【${vehicle.name}】（已套用載具裝備）` : `離開【${vehicle.name}】（恢復角色常規裝備）`);
  };

  // 一鍵擲骰武器模組
  const handleRollWeapon = (weapon, useStrongGrip = false) => {
    if (!onOpenDice) return;
    const stats = character.attributes || { dex: 8, ins: 8, mig: 8, wlp: 8 };

    let attr1Key = weapon.attr1?.toLowerCase() || 'dex';
    let attr2Key = weapon.attr2?.toLowerCase() || 'ins';

    if (useStrongGrip && hasStrongGrip) {
      // 強力握持：將其中一項屬性替換為 MIG
      attr1Key = 'mig';
    }

    const die1 = stats[attr1Key] || 8;
    const die2 = stats[attr2Key] || 8;

    onOpenDice({
      die1,
      die2,
      modifier: weapon.modifier || 0,
      label: `載具武裝【${weapon.name}】命中檢定 [${attr1Key.toUpperCase()} + ${attr2Key.toUpperCase()}${weapon.modifier > 0 ? ` + ${weapon.modifier}` : ''}]`
    });
  };

  // 發動引擎之心
  const handleTriggerEngineHeart = (optionText) => {
    const cost = frame.mpFreeHeart ? 0 : 10;
    const curMp = character.currentMp !== null && character.currentMp !== undefined ? character.currentMp : 40;
    if (curMp < cost) {
      showToast(`MP 不足！發動引擎之心需要 ${cost} MP`);
      return;
    }
    const nextMp = Math.max(0, curMp - cost);
    onChange({
      ...character,
      currentMp: nextMp,
      updatedAt: new Date().toISOString()
    });
    showToast(`發動【引擎之心】（消耗 ${cost} MP）：${optionText}`);
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/60 dark:from-slate-900 dark:via-slate-800 dark:to-cyan-950/20 border border-cyan-300/80 dark:border-cyan-700/60 shadow-sm space-y-3 text-xs">
      
      {/* 頂部標題列與搭乘切換開關 */}
      <div className="flex items-center justify-between border-b border-cyan-200 dark:border-slate-700 pb-2 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-600/10 text-cyan-600 dark:text-cyan-400">
            <GiSteeringWheel className="text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-cyan-950 dark:text-cyan-100 flex items-center gap-2">
              <span>{vehicle.name || '個人載具'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                {frame.name} · 機師 SL {pilotSl}
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              乘客：{frame.passengers} 名 | 距離：{frame.distanceModifier} | 啟用模組：{(vehicle.activeModules || []).length} 個
            </p>
          </div>
        </div>

        {/* 搭乘開關按鈕 */}
        <button
          type="button"
          onClick={toggleMounted}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
            isMounted
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white ring-2 ring-cyan-400/40'
              : 'bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-slate-600'
          }`}
        >
          <GiSteeringWheel className="text-sm" />
          <span>{isMounted ? '駕駛中（點擊離開）' : '步行中（點擊搭乘）'}</span>
        </button>
      </div>

      {/* 駕駛狀態橫幅提示 */}
      {isMounted ? (
        <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <strong className="text-cyan-950 dark:text-cyan-200">
              載具已就位
            </strong>
            <span className="text-stone-500 dark:text-stone-400">
              {activeArmor.length > 0 ? `防具已切換為【${activeArmor[0].name}】` : '使用角色原防具'}
            </span>
          </div>

          {/* 機師快捷技能按鈕 */}
          <div className="flex items-center gap-1.5">
            {engineHeartSkill && (
              <button
                type="button"
                onClick={() => handleTriggerEngineHeart(`下次造成傷害 +${engineHeartSl * 2}`)}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300 font-bold hover:bg-cyan-50 transition"
                title={`引擎之心：消耗 ${frame.mpFreeHeart ? 0 : 10} MP，下次傷害 +${engineHeartSl * 2}，或減傷 ${engineHeartSl * 2}，或解除緩慢/虛弱`}
              >
                引擎之心 ({frame.mpFreeHeart ? '0' : '10'} MP)
              </button>
            )}

            {compressionSkill && (
              <button
                type="button"
                onClick={() => showToast(frame.ipFreeCompression ? '【壓縮技術】外骨骼免費收納/召喚 (0 IP)' : '【壓縮技術】消耗 2 IP 收納/召喚載具')}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700 text-cyan-800 dark:text-cyan-300 font-bold hover:bg-cyan-50 transition"
              >
                壓縮技術 ({frame.ipFreeCompression ? '0' : '2'} IP)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2 rounded-lg bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
          <span>目前處於步行狀態。戰鬥中可執行「目標」動作搭乘載具。</span>
          <span className="font-mono">{renderTextWithAffinities(frame.specialRule)}</span>
        </div>
      )}

      {/* 啟用的武裝模組清單與一鍵攻擊 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
            <GiCrossedSwords className="text-cyan-600" />
            <span>載具武裝（{activeWeapons.length} / {frame.maxWeapons}）</span>
          </span>
          {hasStrongGrip && (
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">
              ✦ 強力握持：可用體質 (MIG) 替換其中一項命中屬性
            </span>
          )}
        </div>

        {activeWeapons.length === 0 ? (
          <div className="p-3 rounded-lg border border-dashed border-stone-200 dark:border-slate-700 text-center text-stone-400">
            載具目前未裝備任何啟用的武裝模組
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeWeapons.map(w => {
              if (w.isShield) {
                return (
                  <div
                    key={w.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-cyan-200 dark:border-slate-700 shadow-2xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <GiShield className="text-base text-cyan-600" />
                      <div>
                        <strong className="text-stone-900 dark:text-stone-100 font-bold block">{w.name}</strong>
                        <span className="text-[10px] text-stone-400 font-mono">DEF +2 | M.DEF +2（盾牌）</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={w.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-cyan-200 dark:border-slate-700 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-stone-900 dark:text-stone-100 font-bold">{w.name}</strong>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-900 text-stone-600 dark:text-stone-400">
                      {w.category} · {w.range === 'melee' ? '近戰' : '遠程'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-[11px] text-stone-600 dark:text-stone-400">
                      【{w.attr1} + {w.attr2}】{w.modifier > 0 ? `+${w.modifier}` : ''} | {renderTextWithAffinities(w.damage)}
                    </span>

                    <div className="flex items-center gap-1">
                      {hasStrongGrip && (
                        <button
                          type="button"
                          onClick={() => handleRollWeapon(w, true)}
                          className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shadow-2xs"
                          title="使用強力握持：MIG 替換屬性檢定"
                        >
                          MIG檢定
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRollWeapon(w, false)}
                        className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                      >
                        <GiRollingDices className="text-xs" />
                        <span>攻擊</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 支援模組與反元素抗性展示 */}
      {activeSupport.length > 0 && (
        <div className="pt-2 border-t border-cyan-200 dark:border-slate-700 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-stone-400 font-bold">已啟用支援模組：</span>
          {activeSupport.map(s => (
            <span
              key={s.id}
              title={s.description}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-slate-700"
            >
              {s.name}
              {s.id === 'anti_element_module' && (
                <span className="ml-1">（{renderTextWithAffinities((vehicle.antiElementChoice || '風') + '抗性')}）</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
