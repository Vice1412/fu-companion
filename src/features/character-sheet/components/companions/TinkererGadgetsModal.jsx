import React, { useState, useMemo } from 'react';
import {
  GiCancel,
  GiCheckMark,
  GiPotionBall,
  GiBroadsword,
  GiGears,
  GiSparkles,
  GiCog,
  GiHazardSign,
  GiSpellBook,
  GiRoundBottomFlask,
  GiCrystalBall
} from 'react-icons/gi';
import JRPGButton from '../../../../components/ui/JRPGButton';
import { renderTextWithAffinities } from '../../../../components/ui/FUIcon';
import rulesData from '../../data/rulesData.json';

/**
 * 修補匠【小工具】三大派系規則與節點元數據
 */
export const GADGET_TRACKS = [
  {
    id: 'alchemy',
    name: '煉金術',
    subtitle: '調配強效但隨機的即席混合藥劑',
    icon: GiRoundBottomFlask,
    themeColor: 'amber',
    nodes: [
      {
        tier: 1,
        tierName: '基礎益處',
        name: '基礎混合藥劑',
        cost: '3 IP',
        dice: '2d20',
        summary: '消耗 3 IP 擲 2 個 d20：一顆指派為目標，一顆指派為效果。',
        desc: '你可以執行使用庫存動作快速製作藥劑。花費 3 點 IP 擲 2 個 d20，將其中一個骰子指派給目標表，另一個骰子指派給效果表。'
      },
      {
        tier: 2,
        tierName: '進階益處',
        name: '進階混合藥劑',
        cost: '4 IP',
        dice: '3d20',
        summary: '消耗 4 IP 擲 3 個 d20：擇二指派為目標與效果（捨棄其餘 1 顆）。',
        desc: '花費 4 點 IP 擲 3 個 d20，將其中一個骰子指派給目標表，另一個骰子指派給效果表，並捨棄未分配的第 3 顆骰子。'
      },
      {
        tier: 3,
        tierName: '最高益處',
        name: '最高混合藥劑',
        cost: '5 IP',
        dice: '4d20',
        summary: '消耗 5 IP 擲 4 個 d20：擇二指派為目標與效果（捨棄其餘 2 顆）。',
        desc: '花費 5 點 IP 擲 4 個 d20，將其中一個骰子指派給目標表，另一個骰子指派給效果表，並捨棄未分配的其餘 2 顆骰子。'
      }
    ]
  },
  {
    id: 'infusion',
    name: '灌注術',
    subtitle: '為武器攻擊賦予屬性傷害與特殊異常',
    icon: GiBroadsword,
    themeColor: 'cyan',
    nodes: [
      {
        tier: 1,
        tierName: '基礎益處',
        name: '基礎灌注',
        cost: '2 IP',
        dice: '無檢定',
        summary: '解鎖低溫、焦火、電壓三種灌注，傷害額外 +5 且轉變為【冰】、【火】或【電】屬性。',
        desc: '攻擊命中後花費 2 IP 注入元素能量：攻擊傷害額外 +5 點，且傷害類型轉為【冰】、【火】或【電】屬性。'
      },
      {
        tier: 2,
        tierName: '進階益處',
        name: '進階灌注',
        cost: '2 IP',
        dice: '無檢定',
        summary: '追加解鎖疾風、驅邪、地震、暗影，傷害額外 +5 且轉為【風】、【光】、【土】或【暗】屬性。',
        desc: '攻擊命中後花費 2 IP：攻擊傷害額外 +5 點，且傷害類型轉為【風】、【光】、【土】或【暗】屬性。'
      },
      {
        tier: 3,
        tierName: '最高益處',
        name: '最高灌注',
        cost: '2 IP',
        dice: '無檢定',
        summary: '追加解鎖吸血（限單體恢復所失半數 HP 或 MP）與毒液（【毒】屬性 +5 傷害並使目標中毒）。',
        desc: '攻擊命中後花費 2 IP：【吸血】吸取目標所受傷害半數之 HP 或 MP（限單體目標）；【毒液】額外造成 5 點傷害，類型轉為【毒】且令目標陷入中毒狀態。'
      }
    ]
  },
  {
    id: 'magitech',
    name: '魔導科技',
    subtitle: '篡奪構裝體、製造魔加農與開發魔法球原型',
    icon: GiGears,
    themeColor: 'purple',
    nodes: [
      {
        tier: 1,
        tierName: '基礎益處',
        name: '魔科技篡奪',
        cost: '10 MP',
        dice: '【INS + INS】',
        summary: '花費 10 MP 檢定奪取附近無心智士兵階構裝體的控制權至場景結束。',
        desc: '使用一個動作並花費 10 點 MP，對可見無心智的構裝體士兵執行對抗檢定【INS + INS】。成功則奪取其控制權至場景結束或遭受傷害為止。'
      },
      {
        tier: 2,
        tierName: '進階益處',
        name: '魔加農火器',
        cost: '2 IP',
        dice: '【DEX + INS】+1',
        summary: '消耗 2 IP 製造雙手遠程火器，傷害【HR + 10】自選屬性。',
        desc: '花費 2 點 IP 製造一把魔加農火器（摧毀舊有魔加農）。雙手遠程，命中【DEX + INS】+1，傷害【HR + 10】，可自選風/電/土/火/冰/物理屬性。'
      },
      {
        tier: 3,
        tierName: '最高益處',
        name: '魔法球原型',
        cost: '2 IP',
        dice: '咒語檢定',
        summary: '開發 3 個原型咒語（20級 5 個、40級 7 個），花費 2 IP 快捷施放。',
        desc: '自元素、熵系、靈魂學派目錄中自由研發魔法球原型。花費 2 點 IP 執行使用庫存動作並立即免費執行咒語動作施展已開發的原型咒語。'
      }
    ]
  }
];

export function calculateMaxMagitechSpells(characterLevel = 5) {
  if (characterLevel >= 40) return 7;
  if (characterLevel >= 20) return 5;
  return 3;
}

export default function TinkererGadgetsModal({
  isOpen,
  onClose,
  gadgetsData = {},
  tinkererSL = 1,
  characterLevel = 5,
  onSave
}) {
  if (!isOpen) return null;

  // 當前分配狀態 (alchemy: 0~3, infusion: 0~3, magitech: 0~3)
  const [alchemyTier, setAlchemyTier] = useState(gadgetsData?.alchemy || 0);
  const [infusionTier, setInfusionTier] = useState(gadgetsData?.infusion || 0);
  const [magitechTier, setMagitechTier] = useState(gadgetsData?.magitech || 0);
  const [selectedSpells, setSelectedSpells] = useState(gadgetsData?.magitechSpells || []);
  const [spellSchoolFilter, setSpellSchoolFilter] = useState('全部');

  const maxSpells = calculateMaxMagitechSpells(characterLevel);

  // 總分配點數
  const allocatedPoints = alchemyTier + infusionTier + magitechTier;
  const remainingPoints = tinkererSL - allocatedPoints;

  // 38 門核心法術（自元素、熵系、靈魂三大學派）
  const allAvailableSpells = useMemo(() => {
    return (rulesData.spells || []).filter(s => ['元素', '熵系', '靈魂'].includes(s.school));
  }, []);

  const filteredSpells = useMemo(() => {
    if (spellSchoolFilter === '全部') return allAvailableSpells;
    return allAvailableSpells.filter(s => s.school === spellSchoolFilter);
  }, [allAvailableSpells, spellSchoolFilter]);

  // 點擊節點處理函式
  const handleNodeClick = (trackId, clickedTier) => {
    let currentTier = 0;
    if (trackId === 'alchemy') currentTier = alchemyTier;
    if (trackId === 'infusion') currentTier = infusionTier;
    if (trackId === 'magitech') currentTier = magitechTier;

    // 情況 A：點擊當前最高已解鎖節點 -> 降級一階（取消分配）
    if (clickedTier === currentTier) {
      const nextTier = currentTier - 1;
      if (trackId === 'alchemy') setAlchemyTier(nextTier);
      if (trackId === 'infusion') setInfusionTier(nextTier);
      if (trackId === 'magitech') setMagitechTier(nextTier);
      return;
    }

    // 情況 B：點擊下一階節點（必須符合升級條件：clickedTier === currentTier + 1 且尚有點數）
    if (clickedTier === currentTier + 1 && remainingPoints > 0) {
      if (trackId === 'alchemy') setAlchemyTier(clickedTier);
      if (trackId === 'infusion') setInfusionTier(clickedTier);
      if (trackId === 'magitech') setMagitechTier(clickedTier);
      return;
    }

    // 其他情況皆為不可點擊（由 UI 反灰呈現）
  };

  // 切換原型咒語勾選
  const handleToggleSpell = (spellName) => {
    if (selectedSpells.includes(spellName)) {
      setSelectedSpells(selectedSpells.filter(s => s !== spellName));
    } else {
      if (selectedSpells.length >= maxSpells) return;
      setSelectedSpells([...selectedSpells, spellName]);
    }
  };

  const handleSave = () => {
    onSave({
      alchemy: alchemyTier,
      infusion: infusionTier,
      magitech: magitechTier,
      magitechSpells: magitechTier >= 3 ? selectedSpells : []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-700/80 overflow-hidden font-sans text-slate-800 dark:text-slate-100">
        
        {/* 頂部標題列 */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-600 text-white shadow-md">
          <div className="flex items-center gap-2.5">
            <GiCog className="w-6 h-6 animate-spin-slow text-amber-100" />
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                <span>修補匠【小工具】科技樹配置</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono font-normal">
                  技能等級 SL {tinkererSL}
                </span>
              </h2>
              <p className="text-[11px] text-amber-100 opacity-90">
                三橫線進度節點樹 · 總解鎖節點數不可超過當前特技等級 (上限 5 點)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="關閉"
          >
            <GiCancel className="w-5 h-5" />
          </button>
        </div>

        {/* 點數配置進度提示條 */}
        <div className="px-5 py-2.5 bg-amber-50/90 dark:bg-slate-800/80 border-b border-amber-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <GiSparkles className="w-4 h-4 text-amber-600" />
              <span>節點配置進度：</span>
            </span>
            <span className="font-mono text-sm font-bold text-amber-800 dark:text-amber-400">
              {allocatedPoints} / {tinkererSL}
            </span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
              remainingPoints === 0
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
            }`}>
              {remainingPoints === 0 ? '點數已滿額' : `尚有 ${remainingPoints} 點可分配`}
            </span>
          </div>

          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            點擊可解鎖節點，點擊最末端的已解鎖節點可取消
          </span>
        </div>

        {/* 科技樹主體內容區 (可滾動) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* 三大派系科技橫線 */}
          <div className="space-y-5">
            {GADGET_TRACKS.map((track) => {
              const TrackIcon = track.icon;
              let currentTier = 0;
              if (track.id === 'alchemy') currentTier = alchemyTier;
              if (track.id === 'infusion') currentTier = infusionTier;
              if (track.id === 'magitech') currentTier = magitechTier;

              return (
                <div
                  key={track.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-3.5"
                >
                  {/* 分支標頭 */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <TrackIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 font-serif">
                            {track.name}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                            {currentTier === 0 ? '未研發' : currentTier === 1 ? '基礎益處' : currentTier === 2 ? '進階益處' : '最高益處'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {track.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      當前階級：<strong className="text-amber-700 dark:text-amber-400 text-xs">Tier {currentTier} / 3</strong>
                    </div>
                  </div>

                  {/* 三節點橫向進度線 (三條橫線核心設計) */}
                  <div className="relative pt-2 pb-1">
                    {/* 底層水平連接軌道 */}
                    <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700 z-0 rounded-full" />
                    
                    {/* 解鎖進度軌道 */}
                    <div
                      className="absolute top-1/2 left-8 -translate-y-1/2 h-1 bg-amber-500 z-0 rounded-full transition-all duration-300"
                      style={{
                        width: currentTier === 0 ? '0%' : currentTier === 1 ? '25%' : currentTier === 2 ? '65%' : 'calc(100% - 4rem)'
                      }}
                    />

                    {/* 三個節點橫向排列 */}
                    <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4">
                      {track.nodes.map((node) => {
                        const isUnlocked = node.tier <= currentTier;
                        const canUnlock = node.tier === currentTier + 1 && remainingPoints > 0;
                        const canRevoke = node.tier === currentTier;
                        const isInteractive = canUnlock || canRevoke;
                        const isGrayedOut = !isUnlocked && !canUnlock;

                        return (
                          <div
                            key={node.tier}
                            onClick={() => isInteractive && handleNodeClick(track.id, node.tier)}
                            className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between select-none ${
                              isGrayedOut
                                ? 'opacity-35 grayscale cursor-not-allowed bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-400 shadow-none'
                                : isUnlocked
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-sm ring-1 ring-amber-400/50 cursor-pointer'
                                : 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700/80 shadow-xs hover:border-amber-500 hover:scale-[1.02] cursor-pointer ring-2 ring-amber-400/30 animate-pulse'
                            }`}
                          >
                            {/* 節點頂部狀態 */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {node.tierName}
                              </span>

                              <div className="flex items-center gap-1">
                                {isUnlocked ? (
                                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs">
                                    <GiCheckMark className="w-3 h-3" />
                                  </span>
                                ) : canUnlock ? (
                                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                                    可點擊解鎖
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">
                                    未滿足前置
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 節點名稱與消耗 */}
                            <div className="space-y-1 mb-2">
                              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                <span>{node.name}</span>
                                <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                                  {node.cost}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                {renderTextWithAffinities(node.summary)}
                              </p>
                            </div>

                            {/* 操作指示標籤 */}
                            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-500 dark:text-slate-400 font-mono">
                                檢定: {node.dice}
                              </span>
                              {canRevoke && (
                                <span className="text-rose-600 dark:text-rose-400 hover:underline">
                                  點擊取消分配
                                </span>
                              )}
                              {canUnlock && (
                                <span className="text-amber-700 dark:text-amber-400">
                                  投入 1 點解鎖
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 若魔導科技解鎖最高益處（魔法球原型）：顯示原型咒語自選區 */}
          {magitechTier >= 3 && (
            <div className="p-4 rounded-xl border border-purple-300 dark:border-purple-700/80 bg-purple-50/40 dark:bg-purple-950/20 space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-purple-200 dark:border-purple-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <GiCrystalBall className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                      <span>魔法球原型咒語研發</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-bold">
                        已配置 {selectedSpells.length} / {maxSpells} 門
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      自元素、靈魂、熵系學派中任意挑選（5級 3門 · 20級 5門 · 40級 7門），日後戰鬥中可花費 2 IP 快捷施放
                    </p>
                  </div>
                </div>

                {/* 學派篩選器 */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-purple-200 dark:border-purple-800">
                  {['全部', '元素', '熵系', '靈魂'].map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setSpellSchoolFilter(sc)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        spellSchoolFilter === sc
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

              {/* 咒語網格列表 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {filteredSpells.map((sp) => {
                  const isChecked = selectedSpells.includes(sp.name);
                  const isFull = selectedSpells.length >= maxSpells && !isChecked;

                  return (
                    <div
                      key={sp.name}
                      onClick={() => !isFull && handleToggleSpell(sp.name)}
                      className={`p-2.5 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                        isChecked
                          ? 'bg-purple-100/80 dark:bg-purple-900/40 border-purple-500 shadow-2xs ring-1 ring-purple-500'
                          : isFull
                          ? 'opacity-40 grayscale cursor-not-allowed bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-purple-300 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              sp.school === '元素' ? 'bg-red-500' : sp.school === '靈魂' ? 'bg-cyan-500' : 'bg-purple-500'
                            }`} />
                            {sp.name}
                          </span>
                          <span className="font-mono text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                            {sp.mp} MP
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {renderTextWithAffinities(sp.effect || sp.desc)}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{sp.school}魔法 · {sp.duration || '瞬發'}</span>
                        <span className={`font-bold ${isChecked ? 'text-purple-700 dark:text-purple-300' : 'text-slate-400'}`}>
                          {isChecked ? '已收錄原型' : '點擊選取'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* 底部按鈕列 */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {allocatedPoints < tinkererSL ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <GiHazardSign className="w-3.5 h-3.5" />
                尚有未分配的特技點數，您亦可先儲存日後再分配。
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                <GiCheckMark className="w-3.5 h-3.5" />
                科技樹節點配置符合目前特技等級！
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
            >
              取消
            </button>

            <JRPGButton
              variant="primary"
              size="sm"
              icon={GiCheckMark}
              onClick={handleSave}
            >
              儲存科技樹配置
            </JRPGButton>
          </div>
        </div>

      </div>
    </div>
  );
}
