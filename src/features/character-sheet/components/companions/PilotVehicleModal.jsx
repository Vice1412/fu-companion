import React, { useState, useMemo } from 'react';
import {
  GiSteeringWheel,
  GiCrossedSwords,
  GiShield,
  GiWrench,
  GiCheckMark,
  GiHazardSign,
  GiCancel,
  GiCheckeredFlag,
  GiHorseHead,
  GiRobotLeg,
  GiSuitcase
} from 'react-icons/gi';
import {
  PILOT_FRAMES,
  PILOT_ARMOR_MODULES,
  PILOT_WEAPON_MODULES,
  PILOT_SUPPORT_MODULES,
  getUnlockedModuleQuota,
  getActiveModuleCapacity,
  findFrameById,
  createDefaultVehicleData
} from '../../data/pilotVehicleData';
import { renderTextWithAffinities } from '../../../../components/ui/FUIcon';

export default function PilotVehicleModal({
  isOpen,
  onClose,
  vehicleData,
  pilotSl = 1,
  onSave
}) {
  if (!isOpen) return null;

  // 初始化本地編輯狀態
  const [formData, setFormData] = useState(() => {
    const base = vehicleData ? { ...vehicleData } : createDefaultVehicleData();
    return {
      name: base.name || '個人載具',
      frameId: base.frameId || 'exoskeleton',
      unlockedModules: Array.isArray(base.unlockedModules) ? [...base.unlockedModules] : [],
      activeModules: Array.isArray(base.activeModules) ? [...base.activeModules] : [],
      antiElementChoice: base.antiElementChoice || '風',
      secondaryOffensiveWeaponId: base.secondaryOffensiveWeaponId || '',
      isMounted: !!base.isMounted
    };
  });

  const [activeTab, setActiveTab] = useState('weapons'); // 'weapons' | 'armor' | 'support'
  const [errorMessage, setErrorMessage] = useState('');

  const currentFrame = useMemo(() => findFrameById(formData.frameId), [formData.frameId]);
  const unlockedQuota = useMemo(() => getUnlockedModuleQuota(pilotSl), [pilotSl]);
  const activeCapacity = useMemo(() => getActiveModuleCapacity(pilotSl), [pilotSl]);

  // 計算已啟用的槽位開銷
  const { activeSlotsCost, activeWeapons, activeArmor, activeSupport, hasBulkyWeapon } = useMemo(() => {
    let slots = 0;
    const weapons = [];
    const armor = [];
    const support = [];
    let bulky = false;

    formData.activeModules.forEach(modId => {
      const w = PILOT_WEAPON_MODULES.find(m => m.id === modId);
      if (w) {
        weapons.push(w);
        slots += 1;
        if (w.isBulky) bulky = true;
        return;
      }
      const a = PILOT_ARMOR_MODULES.find(m => m.id === modId);
      if (a) {
        armor.push(a);
        slots += 1;
        return;
      }
      const s = PILOT_SUPPORT_MODULES.find(m => m.id === modId);
      if (s) {
        support.push(s);
        slots += (s.slotsCost || 1);
        return;
      }
    });

    return {
      activeSlotsCost: slots,
      activeWeapons: weapons,
      activeArmor: armor,
      activeSupport: support,
      hasBulkyWeapon: bulky
    };
  }, [formData.activeModules]);

  // 切換框架
  const handleSelectFrame = (frameId) => {
    setErrorMessage('');
    const newFrame = findFrameById(frameId);
    // 檢查現有已啟用的武器數量或專屬模組是否超標，必要時給予提示或自動調整
    setFormData(prev => {
      let nextActive = [...prev.activeModules];
      // 戰馬武裝上限為 1
      if (newFrame.maxWeapons === 1 && activeWeapons.length > 1) {
        // 保留第 1 個武裝模組，其餘移出啟用狀態
        const keepWeaponId = activeWeapons[0]?.id;
        nextActive = nextActive.filter(id => {
          const isW = PILOT_WEAPON_MODULES.some(w => w.id === id);
          return !isW || id === keepWeaponId;
        });
      }
      // 移除不符合新框架的模組 (如盾牌、高出力、次要攻擊限外骨骼/機甲)
      nextActive = nextActive.filter(id => {
        const mod = PILOT_SUPPORT_MODULES.find(s => s.id === id) || PILOT_WEAPON_MODULES.find(w => w.id === id);
        if (mod?.frameRestrictions && !mod.frameRestrictions.includes(frameId)) {
          return false;
        }
        return true;
      });

      return {
        ...prev,
        frameId,
        activeModules: nextActive
      };
    });
  };

  // 切換解鎖狀態（加入/移出模組庫）
  const handleToggleUnlock = (moduleId) => {
    setErrorMessage('');
    const isUnlocked = formData.unlockedModules.includes(moduleId);
    if (isUnlocked) {
      // 移出模組庫，同時取消啟用
      setFormData(prev => ({
        ...prev,
        unlockedModules: prev.unlockedModules.filter(id => id !== moduleId),
        activeModules: prev.activeModules.filter(id => id !== moduleId)
      }));
    } else {
      // 檢查是否超過解鎖庫配額
      if (formData.unlockedModules.length >= unlockedQuota) {
        setErrorMessage(`已達到解鎖庫上限（最多 ${unlockedQuota} 種模組），請先取消其他模組。`);
        return;
      }
      setFormData(prev => ({
        ...prev,
        unlockedModules: [...prev.unlockedModules, moduleId]
      }));
    }
  };

  // 切換啟用狀態（裝載/卸下）
  const handleToggleActive = (moduleId) => {
    setErrorMessage('');
    const isActive = formData.activeModules.includes(moduleId);

    if (isActive) {
      // 卸下模組
      setFormData(prev => ({
        ...prev,
        activeModules: prev.activeModules.filter(id => id !== moduleId)
      }));
      return;
    }

    // 尚未解鎖時不可啟用
    if (!formData.unlockedModules.includes(moduleId)) {
      setErrorMessage('請先將此模組勾選「解鎖」加入庫存，方可裝載啟用。');
      return;
    }

    // 檢查模組類型與約束
    const weaponMod = PILOT_WEAPON_MODULES.find(m => m.id === moduleId);
    const armorMod = PILOT_ARMOR_MODULES.find(m => m.id === moduleId);
    const supportMod = PILOT_SUPPORT_MODULES.find(m => m.id === moduleId);

    // 1. 檢查框架限制
    const targetMod = weaponMod || armorMod || supportMod;
    if (targetMod?.frameRestrictions && !targetMod.frameRestrictions.includes(formData.frameId)) {
      setErrorMessage(`此模組無法在【${currentFrame.name}】框架上裝載。`);
      return;
    }

    // 2. 檢查總槽位容量
    const additionalCost = supportMod?.slotsCost || 1;
    if (activeSlotsCost + additionalCost > activeCapacity) {
      setErrorMessage(`超出載具啟用槽位上限（目前可用容量 ${activeCapacity} 槽）。`);
      return;
    }

    // 3. 武裝模組特定約束
    if (weaponMod) {
      if (activeWeapons.length >= currentFrame.maxWeapons) {
        setErrorMessage(`【${currentFrame.name}】框架至多可裝載 ${currentFrame.maxWeapons} 個武裝模組。`);
        return;
      }
      // 雙手笨重武器佔用全部欄位
      if (weaponMod.isBulky && activeWeapons.length > 0) {
        setErrorMessage(`【${weaponMod.name}】佔用全部武裝欄位，無法與其他武裝模組同時裝備。`);
        return;
      }
      if (hasBulkyWeapon) {
        setErrorMessage('載具目前已裝備佔用全部欄位的雙手武裝，無法再裝備其他武器。');
        return;
      }
    }

    // 4. 防具模組特定約束
    if (armorMod) {
      if (activeArmor.length >= 1) {
        setErrorMessage('載具至多只能裝載 1 個防具模組。請先卸下目前的防具鍍層。');
        return;
      }
    }

    // 5. 支援模組同名不可重複（由 ID 唯一保證）

    setFormData(prev => ({
      ...prev,
      activeModules: [...prev.activeModules, moduleId]
    }));
  };

  // 儲存
  const handleSave = () => {
    onSave({
      ...formData,
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  // 一鍵重設
  const handleReset = () => {
    setFormData(createDefaultVehicleData());
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden text-stone-800 dark:text-stone-200">
        
        {/* 頂部 Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex-wrap gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400">
              <GiSteeringWheel className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  個人載具工程機庫
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  機師 SL {pilotSl}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                配置載具框架、解鎖模組總庫與啟用裝備狀態
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="載具自訂名稱"
              className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold outline-none focus:border-cyan-500 w-36"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
              title="關閉"
            >
              <GiCancel className="text-base" />
            </button>
          </div>
        </div>

        {/* 狀態配額指示條 */}
        <div className="px-5 py-2.5 bg-stone-100/70 dark:bg-stone-950/40 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {/* 解鎖庫配額 */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 dark:text-stone-400">解鎖模組庫：</span>
              <span className={`font-mono font-bold ${
                formData.unlockedModules.length > unlockedQuota
                  ? 'text-red-600'
                  : formData.unlockedModules.length === unlockedQuota
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {formData.unlockedModules.length} / {unlockedQuota} 種
              </span>
              <span className="text-[10px] text-stone-400">
                （尚可解鎖 {Math.max(0, unlockedQuota - formData.unlockedModules.length)} 種）
              </span>
            </div>

            {/* 啟用槽位配額 */}
            <div className="flex items-center gap-1.5 border-l border-stone-300 dark:border-stone-700 pl-3">
              <span className="text-stone-500 dark:text-stone-400">啟用槽位：</span>
              <span className={`font-mono font-bold ${
                activeSlotsCost > activeCapacity
                  ? 'text-red-600'
                  : activeSlotsCost === activeCapacity
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-cyan-600 dark:text-cyan-400'
              }`}>
                {activeSlotsCost} / {activeCapacity} 槽
              </span>
              <span className="text-[10px] text-stone-400">
                （剩餘 {Math.max(0, activeCapacity - activeSlotsCost)} 槽）
              </span>
            </div>

            {/* 武器槽位 */}
            <div className="flex items-center gap-1 border-l border-stone-300 dark:border-stone-700 pl-3">
              <span className="text-stone-500 dark:text-stone-400">武裝：</span>
              <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                {activeWeapons.length} / {currentFrame.maxWeapons}
              </span>
            </div>

            {/* 防具槽位 */}
            <div className="flex items-center gap-1 border-l border-stone-300 dark:border-stone-700 pl-3">
              <span className="text-stone-500 dark:text-stone-400">防具：</span>
              <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                {activeArmor.length} / 1
              </span>
            </div>
          </div>

          {/* 駕駛狀態標籤 */}
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isMounted: !prev.isMounted }))}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              formData.isMounted
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300'
            }`}
          >
            <GiSteeringWheel className="text-xs" />
            <span>{formData.isMounted ? '駕駛中' : '步行中'}</span>
          </button>
        </div>

        {/* 錯誤警示條 */}
        {errorMessage && (
          <div className="px-5 py-2 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <GiHazardSign className="text-sm shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 內容主滾動區 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* 一、框架選擇 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <GiRobotLeg className="text-cyan-600" />
                <span>1. 選擇載具框架</span>
              </h3>
              <span className="text-[11px] text-stone-400">框架決定載具移動距離、武裝槽位與專屬機制</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PILOT_FRAMES.map(f => {
                const isSelected = formData.frameId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFrame(f.id)}
                    className={`p-3.5 rounded-xl text-left border transition relative flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/60 dark:bg-cyan-950/30 ring-1 ring-cyan-500'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          {f.name}
                        </strong>
                        {isSelected && (
                          <span className="p-0.5 rounded-full bg-cyan-600 text-white">
                            <GiCheckMark className="text-xs" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 space-x-2">
                        <span>乘客：{f.passengers} 名</span>
                        <span>距離：{f.distanceModifier}</span>
                        <span>武裝：至多 {f.maxWeapons} 個</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 pt-1 border-t border-stone-200/60 dark:border-stone-700/60 leading-relaxed">
                      {renderTextWithAffinities(f.specialRule)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 二、模組庫分類標籤與清單 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <GiWrench className="text-cyan-600" />
                <span>2. 載具模組庫配置（勾選「解鎖」加入庫存，切換「啟用」裝載於載具）</span>
              </h3>

              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('weapons')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === 'weapons'
                      ? 'bg-white dark:bg-stone-700 text-cyan-600 dark:text-cyan-400 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  武裝模組 (17)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('armor')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === 'armor'
                      ? 'bg-white dark:bg-stone-700 text-cyan-600 dark:text-cyan-400 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  防具模組 (4)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('support')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === 'support'
                      ? 'bg-white dark:bg-stone-700 text-cyan-600 dark:text-cyan-400 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                >
                  支援模組 (14)
                </button>
              </div>
            </div>

            {/* TAB 1: 武裝模組清單 */}
            {activeTab === 'weapons' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {PILOT_WEAPON_MODULES.map(w => {
                  const isUnlocked = formData.unlockedModules.includes(w.id);
                  const isActive = formData.activeModules.includes(w.id);
                  const isRestricted = w.frameRestrictions && !w.frameRestrictions.includes(formData.frameId);

                  return (
                    <div
                      key={w.id}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between space-y-2 ${
                        isActive
                          ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 shadow-2xs'
                          : isUnlocked
                          ? 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
                          : 'border-stone-200 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-800/30 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-xs font-bold text-stone-900 dark:text-stone-100">
                              {w.name}
                            </strong>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                              {w.category} · {w.range === 'melee' ? '近戰' : '遠程'}
                            </span>
                            {w.isBulky && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                雙手佔槽
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 mt-1">
                            {w.damage ? (
                              <span>
                                檢定：【{w.attr1} + {w.attr2}】{w.modifier > 0 ? `+${w.modifier}` : ''} | 傷害：{renderTextWithAffinities(w.damage)}
                              </span>
                            ) : (
                              <span>DEF +2 | M.DEF +2（盾牌）</span>
                            )}
                          </div>
                        </div>

                        {/* 操作按鈕組 */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* 解鎖核取方塊 */}
                          <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isUnlocked}
                              onChange={() => handleToggleUnlock(w.id)}
                              className="rounded border-stone-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="text-stone-500">解鎖</span>
                          </label>

                          {/* 啟用切換開關 */}
                          <button
                            type="button"
                            disabled={!isUnlocked || isRestricted}
                            onClick={() => handleToggleActive(w.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                              isActive
                                ? 'bg-cyan-600 text-white'
                                : isUnlocked && !isRestricted
                                ? 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                            }`}
                          >
                            {isActive ? '已啟用' : '啟用'}
                          </button>
                        </div>
                      </div>

                      {/* 特殊規則 */}
                      {w.specialRule !== '無' && (
                        <p className="text-[11px] text-stone-600 dark:text-stone-400 border-t border-stone-200 dark:border-stone-700/60 pt-1 leading-relaxed">
                          {renderTextWithAffinities(w.specialRule)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: 防具模組清單 */}
            {activeTab === 'armor' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PILOT_ARMOR_MODULES.map(a => {
                  const isUnlocked = formData.unlockedModules.includes(a.id);
                  const isActive = formData.activeModules.includes(a.id);

                  return (
                    <div
                      key={a.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isActive
                          ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 shadow-2xs'
                          : isUnlocked
                          ? 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
                          : 'border-stone-200 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-800/30 opacity-75'
                      }`}
                    >
                      <div>
                        <strong className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                          {a.name}
                        </strong>
                        <div className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 mt-1">
                          DEF {a.defFormula} | M.DEF {a.mdefFormula}
                        </div>
                      </div>

                      {/* 操作按鈕組 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isUnlocked}
                            onChange={() => handleToggleUnlock(a.id)}
                            className="rounded border-stone-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className="text-stone-500">解鎖</span>
                        </label>

                        <button
                          type="button"
                          disabled={!isUnlocked}
                          onClick={() => handleToggleActive(a.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                            isActive
                              ? 'bg-cyan-600 text-white'
                              : isUnlocked
                              ? 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          {isActive ? '已啟用' : '啟用'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: 支援模組清單 */}
            {activeTab === 'support' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {PILOT_SUPPORT_MODULES.map(s => {
                  const isUnlocked = formData.unlockedModules.includes(s.id);
                  const isActive = formData.activeModules.includes(s.id);
                  const isRestricted = s.frameRestrictions && !s.frameRestrictions.includes(formData.frameId);

                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between space-y-2 ${
                        isActive
                          ? 'border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 shadow-2xs'
                          : isUnlocked
                          ? 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
                          : 'border-stone-200 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-800/30 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-xs font-bold text-stone-900 dark:text-stone-100">
                              {s.name}
                            </strong>
                            {s.slotsCost > 1 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                佔 {s.slotsCost} 槽
                              </span>
                            )}
                            {s.frameRestrictions && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                                僅限 {s.frameRestrictions.map(fid => findFrameById(fid).name).join('/')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 操作按鈕組 */}
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isUnlocked}
                              onChange={() => handleToggleUnlock(s.id)}
                              className="rounded border-stone-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="text-stone-500">解鎖</span>
                          </label>

                          <button
                            type="button"
                            disabled={!isUnlocked || isRestricted}
                            onClick={() => handleToggleActive(s.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                              isActive
                                ? 'bg-cyan-600 text-white'
                                : isUnlocked && !isRestricted
                                ? 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                            }`}
                          >
                            {isActive ? '已啟用' : '啟用'}
                          </button>
                        </div>
                      </div>

                      {/* 子項目自選（反元素抗性選擇） */}
                      {s.hasSubchoice && isActive && (
                        <div className="p-2 rounded bg-white dark:bg-stone-900 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-stone-700 dark:text-stone-300">
                            抗性屬性選擇（{renderTextWithAffinities(formData.antiElementChoice + '抗性')}）：
                          </span>
                          <select
                            value={formData.antiElementChoice}
                            onChange={e => setFormData(prev => ({ ...prev, antiElementChoice: e.target.value }))}
                            className="px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
                          >
                            {s.choiceOptions.map(opt => (
                              <option key={opt} value={opt}>{opt} 屬性抗性</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* 次要攻擊模組選擇 */}
                      {s.hasWeaponChoice && isActive && (
                        <div className="p-2 rounded bg-white dark:bg-stone-900 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-stone-700 dark:text-stone-300">連動停用武器：</span>
                          <select
                            value={formData.secondaryOffensiveWeaponId}
                            onChange={e => setFormData(prev => ({ ...prev, secondaryOffensiveWeaponId: e.target.value }))}
                            className="px-2 py-0.5 rounded border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-bold"
                          >
                            <option value="">選擇停用武裝...</option>
                            {formData.unlockedModules
                              .filter(id => !formData.activeModules.includes(id))
                              .map(id => {
                                const w = PILOT_WEAPON_MODULES.find(m => m.id === id);
                                if (!w) return null;
                                return <option key={id} value={id}>{w.name}</option>;
                              })}
                          </select>
                        </div>
                      )}

                      <p className="text-[11px] text-stone-600 dark:text-stone-400 border-t border-stone-200 dark:border-stone-700/60 pt-1 leading-relaxed">
                        {renderTextWithAffinities(s.description)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 底部按鈕區 */}
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
          >
            清空已選配置
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-bold border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              取消返回
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs flex items-center gap-1.5 transition"
            >
              <GiCheckMark className="text-xs" />
              <span>確認並儲存載具配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
