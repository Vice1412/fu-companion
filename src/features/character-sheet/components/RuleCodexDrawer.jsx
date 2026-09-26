import React, { useState, useEffect } from 'react';
import { GiSpellBook, GiCancel, GiSparkles, GiAnvilImpact, GiCauldron, GiGearHammer, GiPawPrint, GiScrollQuill } from 'react-icons/gi';
import { RULE_CODEX, findCodexRule } from '../data/ruleCodexData';

export default function RuleCodexDrawer({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialRuleId = null
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeRuleId, setActiveRuleId] = useState('arcana');
  const [searchTerm, setSearchTerm] = useState('');

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

  // ESC 鍵關閉
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && internalIsOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [internalIsOpen]);

  const handleClose = () => {
    setInternalIsOpen(false);
    if (propOnClose) propOnClose();
  };

  if (!internalIsOpen) return null;

  const currentRule = RULE_CODEX[activeRuleId] || RULE_CODEX.arcana;

  const navItems = [
    { id: 'arcana', label: '阿爾卡納', icon: GiSparkles },
    { id: 'rituals', label: '儀式學派', icon: GiScrollQuill },
    { id: 'gadgets', label: '小工具', icon: GiCauldron },
    { id: 'projects', label: '造物專案', icon: GiGearHammer },
    { id: 'companion', label: '忠實夥伴', icon: GiPawPrint },
    { id: 'spellbooks', label: '核心法術書', icon: GiSpellBook }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-fadeIn">
      {/* 遮罩背景 */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* 側邊滑出面板 */}
      <div className="relative w-full max-w-xl bg-[#fdfbf7] dark:bg-slate-900 shadow-2xl h-full flex flex-col z-10 border-l border-[#d6c7ab] dark:border-slate-800 animate-slideLeft">
        {/* 頂部 Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-amber-50 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center space-x-2.5">
            <GiSpellBook className="text-2xl text-amber-200" />
            <div>
              <h2 className="text-base font-black tracking-wide flex items-center gap-2">
                <span>規則概念速查手冊</span>
                <span className="text-xs font-normal text-amber-200/90 font-mono bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                  {currentRule.page}
                </span>
              </h2>
              <p className="text-[11px] text-amber-200/80">官方核心規則特殊章節與非通用子系統</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-amber-800/80 transition-colors"
            title="關閉速查手冊 (ESC)"
          >
            <GiCancel className="text-xl" />
          </button>
        </div>

        {/* 類別切換標籤頁 */}
        <div className="flex items-center space-x-1 p-2 bg-[#f4ece1] dark:bg-slate-950 border-b border-[#e2d5c3] dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRuleId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveRuleId(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
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
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-[#2c221e] dark:text-stone-200 text-sm leading-relaxed">
          {/* 當前概念頭銜 */}
          <div className="border-b border-[#e6dbc9] dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                {currentRule.category}
              </span>
              <span className="text-xs font-mono text-stone-500">{currentRule.englishTitle}</span>
            </div>
            <h1 className="text-xl font-black text-[#1a1412] dark:text-amber-100 mt-1">
              {currentRule.title}
            </h1>
            <p className="mt-2 text-stone-700 dark:text-stone-300 text-xs leading-relaxed bg-[#fbf7ee] dark:bg-slate-950/60 p-3 rounded-lg border border-[#e8ddcc] dark:border-slate-800">
              {currentRule.summary}
            </p>
          </div>

          {/* 條列規則 */}
          {currentRule.rules && currentRule.rules.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                核心機制要點
              </h3>
              <ul className="space-y-2 bg-white dark:bg-slate-800/60 p-3.5 rounded-lg border border-[#ded2be] dark:border-slate-700/80 shadow-2xs">
                {currentRule.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start text-xs text-stone-800 dark:text-stone-200">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 mr-2.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 1. 阿爾卡納圖鑑展示 */}
          {activeRuleId === 'arcana' && currentRule.catalog && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  官方核心阿爾卡納圖鑑 ({currentRule.catalog.length} 種)
                </h3>
              </div>
              <div className="space-y-3">
                {currentRule.catalog.map((arcana) => (
                  <div
                    key={arcana.id}
                    className="p-3.5 rounded-lg bg-white dark:bg-slate-800/80 border border-[#e2d7c5] dark:border-slate-700 shadow-2xs hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-[#eee5d8] dark:border-slate-700 pb-1.5 mb-2">
                      <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                        {arcana.name}
                      </h4>
                      <span className="text-[11px] text-stone-500 font-medium">
                        領域：{arcana.domains}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="font-bold text-blue-800 dark:text-blue-300">連攜增益：</span>
                        <span className="text-stone-700 dark:text-stone-300">{arcana.merge}</span>
                      </div>
                      <div>
                        <span className="font-bold text-red-800 dark:text-red-300">解除效果：</span>
                        <span className="text-stone-700 dark:text-stone-300">{arcana.dismiss}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. 儀式學派展示 */}
          {activeRuleId === 'rituals' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                  五大學派與施法檢定
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {currentRule.disciplines.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 flex flex-col space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 dark:text-amber-300">{d.name}</span>
                        <span className="font-mono font-bold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                          {d.formula}
                        </span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-400 text-[11px]">{d.domains}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                  儀式階級與 MP 消耗對照表
                </h3>
                <div className="overflow-x-auto rounded border border-[#ded2be] dark:border-slate-700">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#f0e6d6] dark:bg-slate-800 text-stone-700 dark:text-stone-300">
                      <tr>
                        <th className="p-2">階級</th>
                        <th className="p-2">MP</th>
                        <th className="p-2">難度</th>
                        <th className="p-2">預估時間</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee5d8] dark:divide-slate-700 bg-white dark:bg-slate-900/60">
                      {currentRule.costTable.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-amber-900 dark:text-amber-200">{row.tier}</td>
                          <td className="p-2 font-mono font-bold text-blue-700 dark:text-blue-400">{row.mp}</td>
                          <td className="p-2 font-mono">{row.dl}</td>
                          <td className="p-2 text-stone-600 dark:text-stone-400">{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. 小工具展示 */}
          {activeRuleId === 'gadgets' && (
            <div className="space-y-4">
              {currentRule.branches.map((b, bIdx) => (
                <div key={bIdx} className="p-3.5 rounded-lg bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between border-b border-[#eee5d8] dark:border-slate-700 pb-1.5">
                    <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">{b.name}</h4>
                    <span className="text-xs text-stone-500">{b.desc}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {b.tiers.map((t, tIdx) => (
                      <div key={tIdx} className="flex items-start space-x-2 bg-[#fdfbf7] dark:bg-slate-900/60 p-2 rounded border border-[#eee5d8] dark:border-slate-800">
                        <span className="px-1.5 py-0.5 rounded font-bold text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shrink-0">
                          {t.level} ({t.cost})
                        </span>
                        <span className="text-stone-700 dark:text-stone-300">{t.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. 造物專案展示 */}
          {activeRuleId === 'projects' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                研發階級與成本基準表
              </h3>
              <div className="space-y-2.5">
                {currentRule.tiers.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-[#ded2be] dark:border-slate-700 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 dark:text-amber-300">{t.tier}</span>
                      <span className="font-mono font-bold text-amber-600 bg-amber-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        材料：{t.cost} | 命刻：{t.clock}
                      </span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 text-[11px]">範例：{t.example}</p>
                  </div>
                ))}
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
          <span>Fabula Ultima 官方規則速查</span>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded font-bold transition-colors shadow-2xs"
          >
            返回角色卡
          </button>
        </div>
      </div>
    </div>
  );
}
