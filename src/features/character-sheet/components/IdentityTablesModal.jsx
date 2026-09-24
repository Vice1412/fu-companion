import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import {
  GiSpellBook,
  GiRollingDices,
  GiCheckMark,
  GiMagnifyingGlass,
  GiSparkles
} from 'react-icons/gi';
import JRPGModal from '../../../components/ui/JRPGModal';
import JRPGButton from '../../../components/ui/JRPGButton';
import {
  OFFICIAL_IDENTITY_TABLES,
  rollOfficialIdentity,
  formatChineseIdentity
} from '../data/sourcebookConfig';

export default function IdentityTablesModal({
  isOpen,
  onClose,
  onSelectIdentity,
  currentIdentity = '',
  theme = null
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'concept', 'adj', 'detail'
  const [searchTerm, setSearchTerm] = useState('');
  const [rolledResult, setRolledResult] = useState(null);

  // Custom Assembly State
  const [pickedDetail, setPickedDetail] = useState(null);
  const [pickedAdj, setPickedAdj] = useState(null);
  const [pickedConcept, setPickedConcept] = useState(null);

  const handleRoll = () => {
    const result = rollOfficialIdentity();
    setRolledResult(result);
  };

  const handleApplyRolled = () => {
    if (!rolledResult) return;
    onSelectIdentity(rolledResult.fullZh);
    onClose();
  };

  const handleApplyPicked = () => {
    const assembled = formatChineseIdentity(pickedDetail, pickedAdj, pickedConcept);
    if (assembled) {
      onSelectIdentity(assembled);
      onClose();
    }
  };

  const assembledString = useMemo(() => {
    return formatChineseIdentity(pickedDetail, pickedAdj, pickedConcept);
  }, [pickedDetail, pickedAdj, pickedConcept]);

  // Filter items
  const filterList = (items) => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      item => item.zh.toLowerCase().includes(term) || item.en.toLowerCase().includes(term)
    );
  };

  return (
    <JRPGModal
      isOpen={isOpen}
      onClose={onClose}
      title="官方身份創建靈感對照表"
      maxWidth="max-w-4xl"
      theme={theme}
      actionButtons={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-600 font-medium hidden sm:block">
            點擊任一項目可自選組合，或直接擲骰一鍵套用
          </div>
          <div className="flex items-center gap-2">
            <JRPGButton variant="secondary" size="sm" onClick={onClose}>
              關閉
            </JRPGButton>
            {assembledString && (
              <JRPGButton variant={theme?.buttonVariant || 'primary'} size="sm" icon={GiCheckMark} onClick={handleApplyPicked}>
                套用自選身份: {assembledString}
              </JRPGButton>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-slate-800">
        {/* Top Description & Official Rules Explanation */}
        <div
          className="rounded-xl p-3.5 space-y-2 border transition-colors"
          style={{ backgroundColor: theme?.panelBg || '#f5efdf', borderColor: theme?.border || '#d6c7ab' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="font-serif font-bold text-sm flex items-center gap-1.5" style={{ color: theme?.textDark || '#3c2415' }}>
                <GiSpellBook className="w-4 h-4" style={{ color: theme?.accent || '#b45309' }} />
                官方創角機制：核心概念 + 形容特質 + 身世細節
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                依據官方英文最新版手冊，共有 60 種身分、40 種特質與 20 種細節，各組均明確對應骰面。
              </p>
            </div>

            {/* Quick Roll Button */}
            <JRPGButton
              variant={theme?.buttonVariant || 'primary'}
              size="sm"
              icon={GiRollingDices}
              onClick={handleRoll}
            >
              投擲官方 1d6 + 1d20
            </JRPGButton>
          </div>

          {/* Rolled Result Card */}
          {rolledResult && (
            <div
              className="mt-2.5 p-3 rounded-lg border shadow-sm space-y-2 animate-fade-in"
              style={{ backgroundColor: theme?.cardBg || '#ffffff', borderColor: theme?.border || '#d6c7ab' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: theme?.textDark || '#3c2415' }}>
                  <GiSparkles className="w-3.5 h-3.5" style={{ color: theme?.accent || '#b45309' }} />
                  <span>擲骰結算: </span>
                  <span className="font-serif text-sm underline" style={{ color: theme?.textDark || '#3c2415', textDecorationColor: theme?.accent || '#b45309' }}>
                    {rolledResult.fullZh}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    / {rolledResult.fullEn}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyRolled}
                  className="px-2.5 py-1 rounded text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  style={{ backgroundColor: theme?.accent || '#78350f' }}
                >
                  <GiCheckMark className="w-3 h-3" />
                  <span>套用此擲骰身份</span>
                </button>
              </div>

              {/* Dice roll details breakdown (細節 - 特質 - 核心概念) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t" style={{ borderColor: theme?.border || '#ede4d1' }}>
                <div className="p-1.5 rounded border" style={{ backgroundColor: theme?.panelBg || '#f5efdf', borderColor: theme?.border || '#d6c7ab' }}>
                  <span className="text-slate-400 block">1. 身世細節:</span>
                  <span className="font-mono font-bold" style={{ color: theme?.accent || '#78350f' }}>
                    d20=[#{rolledResult.rolls.detail.d20}]
                  </span>
                  <span className="font-bold block" style={{ color: theme?.textDark || '#3c2415' }}>
                    {rolledResult.rolls.detail.item.zh} ({rolledResult.rolls.detail.item.en})
                  </span>
                </div>

                <div className="p-1.5 rounded border" style={{ backgroundColor: theme?.panelBg || '#f5efdf', borderColor: theme?.border || '#d6c7ab' }}>
                  <span className="text-slate-400 block">2. 形容特質:</span>
                  <span className="font-mono font-bold" style={{ color: theme?.accent || '#78350f' }}>
                    d6=[{rolledResult.rolls.adjective.d6}] {rolledResult.rolls.adjective.group.split(' ')[0]} ➔ d20=[#{rolledResult.rolls.adjective.d20}]
                  </span>
                  <span className="font-bold block" style={{ color: theme?.textDark || '#3c2415' }}>
                    {rolledResult.rolls.adjective.item.zh} ({rolledResult.rolls.adjective.item.en})
                  </span>
                </div>

                <div className="p-1.5 rounded border" style={{ backgroundColor: theme?.panelBg || '#f5efdf', borderColor: theme?.border || '#d6c7ab' }}>
                  <span className="text-slate-400 block">3. 核心概念:</span>
                  <span className="font-mono font-bold" style={{ color: theme?.accent || '#78350f' }}>
                    d6=[{rolledResult.rolls.concept.d6}] {rolledResult.rolls.concept.group.split(' ')[0]} ➔ d20=[#{rolledResult.rolls.concept.d20}]
                  </span>
                  <span className="font-bold block" style={{ color: theme?.textDark || '#3c2415' }}>
                    {rolledResult.rolls.concept.item.zh} ({rolledResult.rolls.concept.item.en})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Builder Bar (順序：身世細節 ➔ 形容特質 ➔ 核心身分) */}
        <div
          className="p-3 rounded-xl space-y-2 border transition-colors"
          style={{ backgroundColor: theme?.subpanelBg || '#f4ebd9', borderColor: theme?.border || '#d6c7ab' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1" style={{ color: theme?.textDark || '#3c2415' }}>
              <GiSparkles className="w-3.5 h-3.5" style={{ color: theme?.accent || '#b45309' }} />
              自選組合身份區（依照中文習慣：身世細節 ➔ 形容特質 ➔ 核心概念）:
            </span>
            {(pickedAdj || pickedConcept || pickedDetail) && (
              <button
                type="button"
                onClick={() => {
                  setPickedDetail(null);
                  setPickedAdj(null);
                  setPickedConcept(null);
                }}
                className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                重置清空
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* 1. Picked Detail */}
            <div
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                pickedDetail ? 'font-bold' : 'bg-white/60 border-slate-200 text-slate-400'
              }`}
              style={pickedDetail ? { backgroundColor: theme?.cardBg || '#ffffff', borderColor: theme?.accent || '#b45309', color: theme?.textDark || '#3c2415' } : {}}
            >
              <span>1. 身世細節: {pickedDetail ? `${pickedDetail.zh} (${pickedDetail.en})` : '尚未選取'}</span>
              {pickedDetail && (
                <button onClick={() => setPickedDetail(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <span className="text-slate-400">➔</span>

            {/* 2. Picked Adjective */}
            <div
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                pickedAdj ? 'font-bold' : 'bg-white/60 border-slate-200 text-slate-400'
              }`}
              style={pickedAdj ? { backgroundColor: theme?.cardBg || '#ffffff', borderColor: theme?.accent || '#b45309', color: theme?.textDark || '#3c2415' } : {}}
            >
              <span>2. 形容特質: {pickedAdj ? `${pickedAdj.zh} (${pickedAdj.en})` : '尚未選取'}</span>
              {pickedAdj && (
                <button onClick={() => setPickedAdj(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <span className="text-slate-400">➔</span>

            {/* 3. Picked Concept */}
            <div
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
                pickedConcept ? 'font-bold' : 'bg-white/60 border-slate-200 text-slate-400'
              }`}
              style={pickedConcept ? { backgroundColor: theme?.cardBg || '#ffffff', borderColor: theme?.accent || '#b45309', color: theme?.textDark || '#3c2415' } : {}}
            >
              <span>3. 核心身分: {pickedConcept ? `${pickedConcept.zh} (${pickedConcept.en})` : '尚未選取'}</span>
              {pickedConcept && (
                <button onClick={() => setPickedConcept(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {assembledString && (
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={handleApplyPicked}
                  className="px-3 py-1 rounded text-white font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-all"
                  style={{ backgroundColor: theme?.accent || '#78350f' }}
                >
                  <GiCheckMark className="w-3 h-3" />
                  <span>套用此組合: {assembledString}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter / Search & Tabs Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {[
              { id: 'all', label: '全部總覽' },
              { id: 'concept', label: '1. 核心概念 (60種)' },
              { id: 'adj', label: '2. 形容特質 (40種)' },
              { id: 'detail', label: '3. 身世細節 (20種)' }
            ].map(t => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap border cursor-pointer"
                  style={
                    isActive
                      ? { backgroundColor: theme?.accent || '#78350f', borderColor: theme?.accentDark || '#451a03', color: '#ffffff' }
                      : { backgroundColor: theme?.cardBg || '#ffffff', borderColor: theme?.border || '#d6c7ab', color: theme?.textDark || '#334155' }
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜尋身份、特質、細節或英文..."
              className="w-full border rounded-lg pl-7 pr-3 py-1 text-xs outline-none shadow-2xs placeholder:text-slate-400"
              style={{ backgroundColor: theme?.cardBg || '#ffffff', borderColor: theme?.border || '#d6c7ab', color: theme?.textDark || '#0f172a' }}
            />
            <GiMagnifyingGlass className="w-3.5 h-3.5 absolute left-2 top-2" style={{ color: theme?.accent || '#94a3b8' }} />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* ==================== TABLES DISPLAY ==================== */}
        <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">

          {/* 1. Core Concepts */}
          {(activeTab === 'all' || activeTab === 'concept') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: theme?.border || '#d6c7ab' }}>
                <h5 className="font-serif font-black text-sm flex items-center gap-2" style={{ color: theme?.textDark || '#3c2415' }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme?.accent || '#b45309' }} />
                  {OFFICIAL_IDENTITY_TABLES.coreConcepts.title}
                </h5>
                <span className="text-[11px] text-slate-500 font-mono">
                  {OFFICIAL_IDENTITY_TABLES.coreConcepts.rollDesc}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {OFFICIAL_IDENTITY_TABLES.coreConcepts.groups.map(grp => {
                  const filtered = filterList(grp.items);
                  if (filtered.length === 0) return null;

                  return (
                    <div
                      key={grp.d6Range}
                      className="rounded-xl border p-2.5 space-y-2 transition-colors"
                      style={{ backgroundColor: theme?.panelBg || '#f5efdf', borderColor: theme?.border || '#d6c7ab' }}
                    >
                      <div className="flex items-center justify-between px-1 pb-1 border-b" style={{ borderColor: theme?.border || '#ede4d1' }}>
                        <span className="text-xs font-bold font-mono" style={{ color: theme?.textDark || '#3c2415' }}>
                          {grp.title}
                        </span>
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border"
                          style={{ backgroundColor: theme?.subpanelBg || '#ede4d1', borderColor: theme?.border || '#d6c7ab', color: theme?.accent || '#78350f' }}
                        >
                          d6: {grp.d6Range}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {filtered.map(item => {
                          const isPicked = pickedConcept?.id === item.id && pickedConcept?.d6Range === grp.d6Range;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setPickedConcept({ ...item, d6Range: grp.d6Range })}
                              className="px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer transition-colors"
                              style={
                                isPicked
                                  ? { backgroundColor: theme?.accent || '#78350f', color: '#ffffff', fontWeight: 'bold' }
                                  : { color: theme?.textDark || '#1e293b' }
                              }
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`font-mono text-[10px] w-5 text-right font-bold ${
                                  isPicked ? 'text-white/80' : 'text-slate-400'
                                }`}>
                                  #{item.id}
                                </span>
                                <span className="font-bold truncate">{item.zh}</span>
                              </div>
                              <span className={`text-[10px] truncate ml-1 ${
                                isPicked ? 'text-white/80' : 'text-slate-500'
                              }`}>
                                {item.en}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Adjectives */}
          {(activeTab === 'all' || activeTab === 'adj') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: theme?.border || '#d6c7ab' }}>
                <h5 className="font-serif font-black text-sm flex items-center gap-2" style={{ color: theme?.textDark || '#3c2415' }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme?.accent || '#b45309' }} />
                  {OFFICIAL_IDENTITY_TABLES.adjectives.title}
                </h5>
                <span className="text-[11px] text-slate-500 font-mono">
                  {OFFICIAL_IDENTITY_TABLES.adjectives.rollDesc}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {OFFICIAL_IDENTITY_TABLES.adjectives.groups.map(grp => {
                  const filtered = filterList(grp.items);
                  if (filtered.length === 0) return null;

                  return (
                    <div
                      key={grp.d6Range}
                      className="rounded-xl border p-2.5 space-y-2 transition-colors"
                      style={{ backgroundColor: theme?.panelBg || '#f5efdf', borderColor: theme?.border || '#d6c7ab' }}
                    >
                      <div className="flex items-center justify-between px-1 pb-1 border-b" style={{ borderColor: theme?.border || '#ede4d1' }}>
                        <span className="text-xs font-bold font-mono" style={{ color: theme?.textDark || '#3c2415' }}>
                          {grp.title}
                        </span>
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border"
                          style={{ backgroundColor: theme?.subpanelBg || '#ede4d1', borderColor: theme?.border || '#d6c7ab', color: theme?.accent || '#78350f' }}
                        >
                          d6: {grp.d6Range}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                        {filtered.map(item => {
                          const isPicked = pickedAdj?.id === item.id && pickedAdj?.d6Range === grp.d6Range;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setPickedAdj({ ...item, d6Range: grp.d6Range })}
                              className="px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer transition-colors"
                              style={
                                isPicked
                                  ? { backgroundColor: theme?.accent || '#78350f', color: '#ffffff', fontWeight: 'bold' }
                                  : { color: theme?.textDark || '#1e293b' }
                              }
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`font-mono text-[10px] w-5 text-right font-bold ${
                                  isPicked ? 'text-white/80' : 'text-slate-400'
                                }`}>
                                  #{item.id}
                                </span>
                                <span className="font-bold truncate">{item.zh}</span>
                              </div>
                              <span className={`text-[10px] truncate ml-1 ${
                                isPicked ? 'text-white/80' : 'text-slate-500'
                              }`}>
                                {item.en}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Details */}
          {(activeTab === 'all' || activeTab === 'detail') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: theme?.border || '#d6c7ab' }}>
                <h5 className="font-serif font-black text-sm flex items-center gap-2" style={{ color: theme?.textDark || '#3c2415' }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme?.accent || '#b45309' }} />
                  {OFFICIAL_IDENTITY_TABLES.details.title}
                </h5>
                <span className="text-[11px] text-slate-500 font-mono">
                  {OFFICIAL_IDENTITY_TABLES.details.rollDesc}
                </span>
              </div>

              <div
                className="rounded-xl border p-2.5 transition-colors"
                style={{ backgroundColor: theme?.panelBg || '#f5efdf', borderColor: theme?.border || '#d6c7ab' }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1">
                  {filterList(OFFICIAL_IDENTITY_TABLES.details.items).map(item => {
                    const isPicked = pickedDetail?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setPickedDetail(item)}
                        className="px-2 py-1 rounded text-xs flex items-center justify-between cursor-pointer transition-colors"
                        style={
                          isPicked
                            ? { backgroundColor: theme?.accent || '#78350f', color: '#ffffff', fontWeight: 'bold' }
                            : { color: theme?.textDark || '#1e293b' }
                        }
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`font-mono text-[10px] w-5 text-right font-bold ${
                            isPicked ? 'text-white/80' : 'text-slate-400'
                          }`}>
                            #{item.id}
                          </span>
                          <span className="font-bold truncate">{item.zh}</span>
                        </div>
                        <span className={`text-[10px] truncate ml-1 ${
                          isPicked ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {item.en}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </JRPGModal>
  );
}
