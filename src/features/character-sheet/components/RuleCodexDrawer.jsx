import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  GiSpellBook,
  GiSparkles,
  GiCauldron,
  GiGearHammer,
  GiPawPrint,
  GiScrollQuill,
  GiCoins,
  GiShield,
  GiBroadsword
} from 'react-icons/gi';
import { X, Search } from 'lucide-react';
import { RULE_CODEX, findCodexRule } from '../data/ruleCodexData';

export default function RuleCodexDrawer({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialRuleId = null
}) {
  const [mounted, setMounted] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeRuleId, setActiveRuleId] = useState('arcana');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // 支援全域事件 fu:open-rule-codex
  useEffect(() => {
    const handleGlobalOpen = (e) => {
      const { ruleId, keyword } = e.detail || {};
      if (ruleId && RULE_CODEX[ruleId]) {
        setActiveRuleId(ruleId);
      } else if (keyword) {
        const found = findCodexRule(keyword);
        if (found) {
          setActiveRuleId(found.id);
        }
      }
      setInternalIsOpen(true);
    };

    window.addEventListener('fu:open-rule-codex', handleGlobalOpen);
    return () => window.removeEventListener('fu:open-rule-codex', handleGlobalOpen);
  }, []);

  // 監聽 prop 變化
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setInternalIsOpen(propIsOpen);
    }
  }, [propIsOpen]);

  useEffect(() => {
    if (initialRuleId && RULE_CODEX[initialRuleId]) {
      setActiveRuleId(initialRuleId);
    }
  }, [initialRuleId]);

  // ESC 鍵關閉與鎖定背景滾動
  useEffect(() => {
    if (!internalIsOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = originalOverflow;
    };
  }, [internalIsOpen]);

  const handleClose = () => {
    setInternalIsOpen(false);
    setSearchTerm('');
    if (propOnClose) propOnClose();
  };

  if (!internalIsOpen || !mounted || typeof document === 'undefined') return null;

  const currentRule = RULE_CODEX[activeRuleId] || RULE_CODEX.arcana;

  const navItems = [
    { id: 'arcana', label: '阿爾卡納', icon: GiSparkles },
    { id: 'rituals', label: '儀式', icon: GiScrollQuill },
    { id: 'gadgets', label: '小工具', icon: GiCauldron },
    { id: 'projects', label: '造物專案', icon: GiGearHammer },
    { id: 'companion', label: '忠實夥伴', icon: GiPawPrint },
    { id: 'spellbooks', label: '核心法術書', icon: GiSpellBook }
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* 點擊遮罩背景 */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-backdrop-fade"
        onClick={handleClose}
      />

      {/* 居中焦點典籍卡片 */}
      <div
        className="relative w-full max-w-3xl bg-[#fffdf9] dark:bg-slate-900 border-2 border-[#d6c7ab] dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh] text-[#2c221e] dark:text-stone-200 animate-modal-pop z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部裝飾條 */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 shrink-0" />

        {/* 典籍標題 Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-amber-50 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center space-x-2.5">
            <GiSpellBook className="text-2xl text-amber-200" />
            <div>
              <h2 className="text-base font-black tracking-wide flex items-center gap-2">
                <span>規則概念速查</span>
                <span className="text-xs font-normal text-amber-200/90 font-mono bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                  {currentRule.page}
                </span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-800/80 transition-colors"
            title="關閉速查 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 類別切換標籤頁 (Tabs) */}
        <div className="flex items-center space-x-1 p-2 bg-[#f4ece1] dark:bg-slate-950 border-b border-[#e2d5c3] dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRuleId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveRuleId(item.id);
                  setSearchTerm('');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-[#eae0d2] dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="text-sm" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 內容主滾動容器 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-[#2c221e] dark:text-stone-200 text-xs sm:text-sm leading-relaxed">
          {/* 當前概念頭銜 */}
          <div className="border-b border-[#e6dbc9] dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-black text-[#1a1412] dark:text-amber-100">
                {currentRule.title}
              </h1>
              <span className="text-xs font-mono font-bold text-stone-500">{currentRule.englishTitle}</span>
            </div>
            <p className="mt-2 text-stone-700 dark:text-stone-300 text-xs leading-relaxed bg-[#fbf7ee] dark:bg-slate-950/60 p-3 rounded-lg border border-[#e8ddcc] dark:border-slate-800">
              {currentRule.summary}
            </p>
          </div>

          {/* 條列規則 */}
          {currentRule.rules && currentRule.rules.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">核心運作規則：</h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-700 dark:text-stone-300 pl-1">
                {currentRule.rules.map((r, rIdx) => (
                  <li key={rIdx} className="leading-relaxed">
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 1. 阿爾卡納專屬目錄展示 */}
          {activeRuleId === 'arcana' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                  12 大官方阿爾卡納圖鑑目錄
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜尋阿爾卡納或領域..."
                    className="px-2.5 py-1 text-xs rounded-lg border border-[#d6c7ab] dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-800 dark:text-stone-200 pr-7 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentRule.catalog
                  .filter(a => !searchTerm || a.name.includes(searchTerm) || a.domains.includes(searchTerm))
                  .map((arcana) => (
                    <div
                      key={arcana.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-700 pb-1.5">
                        <span className="font-bold text-sm text-amber-950 dark:text-amber-200">
                          {arcana.name}
                        </span>
                        <span className="text-[11px] font-mono text-stone-500">{arcana.domains}</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div>
                          <strong className="text-amber-800 dark:text-amber-400 font-bold">【合體】：</strong>
                          <span className="text-stone-700 dark:text-stone-300">{arcana.merge}</span>
                        </div>
                        <div>
                          <strong className="text-rose-800 dark:text-rose-400 font-bold">【解除】：</strong>
                          <span className="text-stone-700 dark:text-stone-300">{arcana.dismiss}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 2. 儀式展示 */}
          {activeRuleId === 'rituals' && (
            <div className="space-y-5">
              {/* 六大學派表格 */}
              <div className="space-y-2">
                <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                  六大學派與施法檢定
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#ded2be] dark:border-slate-700 shadow-2xs">
                  <table className="w-full text-left text-xs bg-white dark:bg-slate-800">
                    <thead className="bg-[#f5ecdf] dark:bg-slate-950 text-stone-700 dark:text-stone-300 font-bold border-b border-[#ded2be] dark:border-slate-700">
                      <tr>
                        <th className="p-2.5 w-20">學派</th>
                        <th className="p-2.5 w-52">施法檢定</th>
                        <th className="p-2.5">你可以...</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                      {currentRule.disciplines.map((d, dIdx) => (
                        <tr key={dIdx} className="hover:bg-amber-50/40 dark:hover:bg-slate-700/50">
                          <td className="p-2.5 font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">{d.name}</td>
                          <td className="p-2.5 font-mono font-bold text-amber-800 dark:text-amber-400 whitespace-nowrap">{d.formula}</td>
                          <td className="p-2.5 text-stone-600 dark:text-stone-400 leading-relaxed">{d.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 儀式五大禁忌 */}
              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 space-y-2 shadow-2xs">
                <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                  記住，儀式魔法永遠不能完成以下任何一項：
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-700 dark:text-stone-300 pl-1 leading-relaxed">
                  {currentRule.restrictions.map((r, rIdx) => (
                    <li key={rIdx}>{r}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-stone-500 italic pt-1 border-t border-amber-200 dark:border-amber-900/50">
                  除此之外，大多數儀式都是公平的——但你追求的效果越強，如果你的儀式出錯，後果就越悲慘。
                </p>
              </div>

              {/* 施法三步驟與計算表 */}
              <div className="space-y-3">
                <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                  施法流程與費用計算
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-stone-700 dark:text-stone-300 pl-1 leading-relaxed">
                  {currentRule.steps.map((s, sIdx) => (
                    <li key={sIdx}>{s}</li>
                  ))}
                </ol>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
                  {/* 效力表 */}
                  <div className="overflow-x-auto rounded-xl border border-[#ded2be] dark:border-slate-700 shadow-2xs">
                    <table className="w-full text-left text-xs bg-white dark:bg-slate-800">
                      <thead className="bg-[#f5ecdf] dark:bg-slate-950 text-stone-700 dark:text-stone-300 font-bold border-b border-[#ded2be] dark:border-slate-700">
                        <tr>
                          <th className="p-2 w-12 text-center">效力</th>
                          <th className="p-2 w-12 text-center">MP</th>
                          <th className="p-2 w-12 text-center">DL</th>
                          <th className="p-2">例子</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                        {currentRule.potencyTable.map((p, pIdx) => (
                          <tr key={pIdx} className="hover:bg-amber-50/40 dark:hover:bg-slate-700/50">
                            <td className="p-2 font-bold text-stone-900 dark:text-stone-100 text-center">{p.tier}</td>
                            <td className="p-2 font-mono text-amber-800 dark:text-amber-400 font-bold text-center">{p.mp}</td>
                            <td className="p-2 font-mono font-bold text-center">{p.dl}</td>
                            <td className="p-2 text-stone-600 dark:text-stone-400">{p.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 範圍表 */}
                  <div className="overflow-x-auto rounded-xl border border-[#ded2be] dark:border-slate-700 shadow-2xs">
                    <table className="w-full text-left text-xs bg-white dark:bg-slate-800">
                      <thead className="bg-[#f5ecdf] dark:bg-slate-950 text-stone-700 dark:text-stone-300 font-bold border-b border-[#ded2be] dark:border-slate-700">
                        <tr>
                          <th className="p-2 w-14 text-center">範圍</th>
                          <th className="p-2 w-16 text-center">MP 倍率</th>
                          <th className="p-2">例子</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                        {currentRule.areaTable.map((a, aIdx) => (
                          <tr key={aIdx} className="hover:bg-amber-50/40 dark:hover:bg-slate-700/50">
                            <td className="p-2 font-bold text-stone-900 dark:text-stone-100 text-center">{a.area}</td>
                            <td className="p-2 font-mono text-amber-800 dark:text-amber-400 font-bold text-center">{a.multiplier}</td>
                            <td className="p-2 text-stone-600 dark:text-stone-400">{a.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 團隊檢定與減少成本 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 space-y-1.5 shadow-2xs">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 border-b border-stone-100 dark:border-slate-700 pb-1">
                    團隊檢定下的儀式魔法
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    {currentRule.groupCheck}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 space-y-1.5 shadow-2xs">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 border-b border-stone-100 dark:border-slate-700 pb-1">
                    減少儀式的成本
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400 leading-relaxed pl-1">
                    {currentRule.costReduction.map((c, cIdx) => (
                      <li key={cIdx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 衝突期間的儀式 */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-700 pb-1.5">
                  <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                    衝突期間的儀式
                  </h3>
                  <span className="text-xs text-stone-500 font-normal">{currentRule.conflict.intro}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {currentRule.conflict.clocks.map((c, cIdx) => (
                    <div key={cIdx} className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-center">
                      <span className="text-stone-700 dark:text-stone-300 font-bold block">{c.tier}效力</span>
                      <span className="text-amber-900 dark:text-amber-300 font-mono font-bold text-sm">{c.clock}</span>
                    </div>
                  ))}
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed pl-1">
                  {currentRule.conflict.steps.map((s, sIdx) => (
                    <li key={sIdx}>{s}</li>
                  ))}
                </ol>
              </div>

              {/* 官方範例 */}
              <div className="space-y-2">
                <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                  儀式的例子（官方裁定指導）
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {currentRule.examples.map((ex, exIdx) => (
                    <div key={exIdx} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 space-y-1 shadow-2xs">
                      <span className="font-bold text-amber-800 dark:text-amber-400 block border-b border-stone-100 dark:border-slate-700 pb-0.5">
                        {ex.school}學派範例
                      </span>
                      <p className="text-stone-600 dark:text-stone-400 leading-relaxed text-[11px] pt-0.5">
                        {ex.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. 小工具類別與益處展示 */}
          {activeRuleId === 'gadgets' && (
            <div className="space-y-4">
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                三大工藝類型與增益目錄
              </h3>
              <div className="space-y-3">
                {currentRule.branches.map((branch, bIdx) => (
                  <div key={bIdx} className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 space-y-2.5 shadow-2xs">
                    <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center justify-between border-b border-stone-100 dark:border-slate-700 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-800 dark:text-amber-400">{branch.name}</span>
                        <span className="text-xs text-stone-400 font-mono font-normal">({branch.english})</span>
                      </div>
                      <span className="text-xs text-stone-600 dark:text-stone-400 font-normal">{branch.desc}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {(branch.tiers || []).map((tier, tIdx) => (
                        <div
                          key={tIdx}
                          className={`p-2.5 rounded-lg border ${
                            tIdx === 0
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                              : tIdx === 1
                              ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50'
                              : 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <strong
                              className={`font-bold ${
                                tIdx === 0
                                  ? 'text-amber-900 dark:text-amber-300'
                                  : tIdx === 1
                                  ? 'text-teal-900 dark:text-teal-300'
                                  : 'text-purple-900 dark:text-purple-300'
                              }`}
                            >
                              {tier.level}
                            </strong>
                            <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300">
                              {tier.cost}
                            </span>
                          </div>
                          <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                            {tier.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 造物專案規模與成本 */}
          {activeRuleId === 'projects' && (
            <div className="space-y-4">
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                發明規模、資金成本與時鐘格數對照表
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[#ded2be] dark:border-slate-700 shadow-2xs">
                <table className="w-full text-left text-xs bg-white dark:bg-slate-800">
                  <thead className="bg-[#f5ecdf] dark:bg-slate-950 text-stone-700 dark:text-stone-300 font-bold border-b border-[#ded2be] dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">專案規模</th>
                      <th className="p-2.5">基礎材料費</th>
                      <th className="p-2.5">時鐘格數</th>
                      <th className="p-2.5">範例</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                    {currentRule.tiers.map((t, tIdx) => (
                      <tr key={tIdx} className="hover:bg-amber-50/40 dark:hover:bg-slate-700/50">
                        <td className="p-2.5 font-bold text-stone-900 dark:text-stone-100">{t.tier}</td>
                        <td className="p-2.5 font-mono text-amber-800 dark:text-amber-400 font-bold">{t.cost}</td>
                        <td className="p-2.5 font-mono">{t.clock}</td>
                        <td className="p-2.5 text-stone-600 dark:text-stone-400">{t.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                <strong className="text-amber-900 dark:text-amber-300 block">發明進度推進檢定：</strong>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  在休整或旅途中，花費一天全心進行專案發明，執行一次【Dex + Ins】發明檢定。
                  成功推進 1 格時鐘；檢定總值達 10 推進 2 格；總值達 13 推進 3 格！修補匠《高瞻遠矚》可額外獲得進度與材料費折扣。
                </p>
              </div>
            </div>
          )}

          {/* 4. 忠實夥伴詳細規格 */}
          {activeRuleId === 'companion' && (
            <div className="space-y-4">
              <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs sm:text-sm">
                忠實夥伴面板規格與戰鬥機制
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 shadow-2xs space-y-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block border-b pb-1">
                    基礎屬性分配 (起始 d8/d8/d6/d6)
                  </span>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    在 DEX、INS、MIG、WLP 中自選兩項分配為 <strong>d8</strong>，其餘兩項分配為 <strong>d6</strong>。
                    旅人每升級時，夥伴也隨同提升其生命力。
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 shadow-2xs space-y-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block border-b pb-1">
                    最大 HP 動態公式
                  </span>
                  <div className="font-mono text-amber-800 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 p-1.5 rounded">
                    Max HP = (SL × 夥伴基礎 MIG) + ⌊旅人等級 / 2⌋
                  </div>
                  <p className="text-stone-500 text-[11px]">HP 低於一半時自動進入危機狀態，旅人可用技能或道具為其急救。</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. 核心法術書展示 */}
          {activeRuleId === 'spellbooks' && (
            <div className="space-y-5">
              {currentRule.schools.map((school, sIdx) => (
                <div key={sIdx} className="space-y-2">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm border-b border-[#e2d7c5] dark:border-slate-700 pb-1">
                    {school.name}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {school.spells.map((sp, spIdx) => (
                      <div key={spIdx} className="p-2.5 rounded bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                            {sp.offensive && (
                              <span className="fu-icon text-red-600 font-bold" title="攻擊性咒語">
                                o
                              </span>
                            )}
                            <span>{sp.name}</span>
                          </span>
                          <span className="text-[11px] font-mono text-stone-500">
                            MP: {sp.mp} | 目標: {sp.target} | 持續: {sp.duration}
                          </span>
                        </div>
                        <p className="text-stone-600 dark:text-stone-400 text-[11px]">{sp.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 Footer */}
        <div className="p-3 bg-[#f5ecdf] dark:bg-slate-950 border-t border-[#ded2be] dark:border-slate-800 flex justify-between items-center text-xs text-stone-500 shrink-0">
          <span className="text-[11px] text-stone-600 dark:text-stone-400">
            提示：按 ESC 或點擊視窗外空白處即可關閉並返回
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold transition-colors shadow-2xs flex items-center gap-1"
          >
            <span>關閉並返回</span>
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
