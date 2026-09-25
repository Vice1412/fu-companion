import React, { useState, useMemo, useEffect } from 'react';
import {
  GiSparkles,
  GiCheckMark,
  GiMagnifyingGlass,
  GiHazardSign
} from 'react-icons/gi';
import GameIcon from '../../../components/ui/GameIcon';
import JRPGModal from '../../../components/ui/JRPGModal';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import JRPGButton from '../../../components/ui/JRPGButton';
import SkillStarPips from './SkillStarPips';
import SkillDescription from '../utils/skillFormulaEvaluator';
import { SOURCEBOOKS, getClassInfo } from '../data/sourcebookConfig';
import rulesData from '../data/rulesData.json';

/**
 * 職業選擇與特技分配彈窗 (ClassPickerModal)
 * 滿足需求：
 * 1. 一站式精簡流程：打開職業列表 > 呈現職業特技與免費增益，投入等級 > 點擊確認按鈕即可完成。
 * 2. 初始狀態全空：玩家點選職業時，旗下特技預設皆為 SL 0，由玩家自主點擊升級。
 * 3. 官方四方星芒：Max SL 採用官方字型 'w' 四角銳星指示器。
 * 4. 字體放大好讀：特技名稱與描述文字放大且行距舒展，提升閱讀體驗。
 * 5. 全面呈現免費增益：完整對齊官方規則與繁中 Excel 角色卡名詞。
 */
export default function ClassPickerModal({
  isOpen,
  onClose,
  theme,
  enabledBooks = ['core'],
  existingClassNames = [],
  onSelectClass
}) {
  const [search, setSearch] = useState('');
  const [selectedClassName, setSelectedClassName] = useState(null);
  const [draftSkills, setDraftSkills] = useState({});

  // 取得所有可用職業清單
  const availableClasses = useMemo(() => {
    return Object.keys(SOURCEBOOKS)
      .filter(sbKey => enabledBooks.includes(sbKey))
      .flatMap(sbKey => {
        const book = SOURCEBOOKS[sbKey];
        return (book.classes || []).map(cName => ({
          className: cName,
          bookKey: sbKey,
          bookName: book.shortName || book.name,
          badgeColor: book.badgeColor || 'amber',
          info: getClassInfo(cName),
          def: rulesData.classes[cName] || {}
        }));
      })
      .filter(item => item.def && (item.def.skills || item.def.source));
  }, [enabledBooks]);

  // 搜尋過濾
  const filteredClasses = useMemo(() => {
    if (!search.trim()) return availableClasses;
    const q = search.toLowerCase().trim();
    return availableClasses.filter(c => {
      const matchZh = c.className.toLowerCase().includes(q);
      const matchEn = (c.info?.en || '').toLowerCase().includes(q);
      const matchTag = (c.info?.tagline || '').toLowerCase().includes(q);
      const matchBook = c.bookName.toLowerCase().includes(q);
      return matchZh || matchEn || matchTag || matchBook;
    });
  }, [availableClasses, search]);

  // 當彈窗打開且尚未選中任何職業時，預設選取第一個未修習的職業
  useEffect(() => {
    if (isOpen) {
      if (!selectedClassName || !availableClasses.some(c => c.className === selectedClassName)) {
        const firstAvailable = availableClasses.find(c => !existingClassNames.includes(c.className));
        if (firstAvailable) {
          handleSelectClassItem(firstAvailable.className);
        }
      }
    } else {
      setSelectedClassName(null);
      setDraftSkills({});
      setSearch('');
    }
  }, [isOpen]);

  const activeClassItem = useMemo(() => {
    if (!selectedClassName) return null;
    return availableClasses.find(c => c.className === selectedClassName);
  }, [availableClasses, selectedClassName]);

  // 選擇職業時，初始化旗下所有特技為 SL 0（完全空白未分配）
  const handleSelectClassItem = (cName) => {
    setSelectedClassName(cName);
    const cDef = rulesData.classes[cName] || {};
    const initialMap = {};
    (cDef.skills || []).forEach(sk => {
      initialMap[sk.name] = 0;
    });
    setDraftSkills(initialMap);
  };

  // 調整特技等級
  const handleSetSkillSL = (skillName, newSL) => {
    setDraftSkills(prev => ({
      ...prev,
      [skillName]: Math.max(0, newSL)
    }));
  };

  // 當前投入的總等級數
  const totalAllocatedSL = useMemo(() => {
    return Object.values(draftSkills).reduce((sum, sl) => sum + sl, 0);
  }, [draftSkills]);

  const isClassAlreadyAdded = activeClassItem ? existingClassNames.includes(activeClassItem.className) : false;

  // 確認修習此職業
  const handleConfirm = () => {
    if (!activeClassItem || isClassAlreadyAdded) return;
    if (totalAllocatedSL < 1 || totalAllocatedSL > 4) return;

    const allSkills = activeClassItem.def.skills || [];
    const chosenSkills = [];
    allSkills.forEach(sk => {
      const sl = draftSkills[sk.name] || 0;
      if (sl > 0) {
        chosenSkills.push({
          name: sk.name,
          sl: Math.min(sk.maxSL || 5, sl)
        });
      }
    });

    onSelectClass(activeClassItem.className, chosenSkills);
    onClose();
  };

  return (
    <JRPGModal
      isOpen={isOpen}
      onClose={onClose}
      title="選擇職業與特技分配"
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col md:flex-row gap-4 h-[75vh] max-h-[720px] overflow-hidden -m-1">
        {/* ================= 左側欄：職業名冊與搜尋 ================= */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col border-b md:border-b-0 md:border-r pr-0 md:pr-3 pb-3 md:pb-0" style={{ borderColor: theme.border }}>
          {/* 搜尋欄位 */}
          <div className="relative mb-2.5">
            <GiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋職業名稱（中文 / 英文 / 特性關鍵字）..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none font-sans shadow-inner transition-colors"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                color: theme.textDark
              }}
            />
          </div>

          {/* 職業清單 */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredClasses.map((item) => {
              const isSelected = selectedClassName === item.className;
              const isAdded = existingClassNames.includes(item.className);

              return (
                <div
                  key={item.className}
                  onClick={() => {
                    if (!isAdded) {
                      handleSelectClassItem(item.className);
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all text-left flex flex-col gap-1.5 cursor-pointer select-none ${
                    isAdded
                      ? 'opacity-40 bg-slate-100/60 border-slate-200 cursor-not-allowed'
                      : isSelected
                        ? 'ring-2 shadow-sm scale-101'
                        : 'hover:border-amber-400 hover:shadow-2xs'
                  }`}
                  style={{
                    backgroundColor: isSelected ? theme.subpanelBg : theme.cardBg,
                    borderColor: isSelected ? theme.accent : theme.border,
                    '--tw-ring-color': theme.accent
                  }}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: theme.panelBg,
                          borderColor: theme.border,
                          color: theme.accent
                        }}
                      >
                        <GameIcon name={item.info.icon || item.className} size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-serif font-black text-xs text-slate-800 truncate">
                          {item.className}
                        </div>
                        <div className="font-mono text-[10px] font-bold text-slate-400 uppercase truncate">
                          {item.info.en}
                        </div>
                      </div>
                    </div>

                    <JRPGBadge variant={item.badgeColor} size="xs">
                      {item.bookName}
                    </JRPGBadge>
                  </div>

                  {/* 免費增益摘要標籤 */}
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 font-mono">
                    <span className="text-amber-900 font-bold truncate bg-amber-100/80 px-1 rounded" title={item.def.freeBonus}>
                      {item.def.freeBonus || ''}
                    </span>
                    {isAdded ? (
                      <span className="text-slate-400 font-bold">已修習</span>
                    ) : isSelected ? (
                      <span className="font-bold flex items-center gap-0.5" style={{ color: theme.accent }}>
                        <GiCheckMark className="w-3 h-3" /> 選定中
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= 右側欄：職業詳情、特技分配與確認操作 ================= */}
        <div className="flex-1 min-w-0 flex flex-col justify-between overflow-hidden pl-0 md:pl-2">
          {activeClassItem ? (
            <div className="flex-1 flex flex-col overflow-hidden space-y-3">
              {/* 頂部職業標題與風格敘述 */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between gap-3 shrink-0 shadow-2xs"
                style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      color: theme.accent
                    }}
                  >
                    <GameIcon name={activeClassItem.info.icon || activeClassItem.className} size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-black text-base" style={{ color: theme.textDark }}>
                        {activeClassItem.className}
                      </h3>
                      <span className="font-mono text-xs font-bold text-slate-400 uppercase">
                        / {activeClassItem.info.en}
                      </span>
                      <JRPGBadge variant={activeClassItem.badgeColor} size="xs">
                        {activeClassItem.bookName}
                      </JRPGBadge>
                    </div>
                    <p className="text-xs text-slate-600 italic mt-0.5 truncate">
                      {activeClassItem.info.tagline}
                    </p>
                  </div>
                </div>
              </div>

              {/* 職業免費增益區塊 */}
              <div
                className="p-3 rounded-xl border shrink-0 space-y-1.5 shadow-2xs"
                style={{ backgroundColor: theme.subpanelBg, borderColor: theme.accent }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: theme.textDark }}>
                    <GiSparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                    職業免費增益 (Free Benefits)
                  </span>
                  {activeClassItem.def.freeBonus && (
                    <span className="text-xs font-mono font-bold text-amber-950 bg-amber-200/90 border border-amber-300 px-2 py-0.5 rounded shadow-2xs">
                      {activeClassItem.def.freeBonus}
                    </span>
                  )}
                </div>
                {activeClassItem.def.freeBenefits && (
                  <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans">
                    {activeClassItem.def.freeBenefits}
                  </p>
                )}
              </div>

              {/* 職業技能清單（字體加大、官方四方星芒指示器、可直接點擊升級） */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 px-0.5">
                  <span className="font-bold">
                    職業技能清單（點擊四方星芒直接分配等級）：
                  </span>
                  <span className="font-mono font-bold text-slate-500">
                    5 項特技任選
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5">
                  {(activeClassItem.def.skills || []).map((sk) => {
                    const currentSL = draftSkills[sk.name] || 0;
                    const maxSL = sk.maxSL || 5;
                    const isLearned = currentSL > 0;

                    return (
                      <div
                        key={sk.name}
                        onClick={() => {
                          if (currentSL < maxSL) {
                            handleSetSkillSL(sk.name, currentSL + 1);
                          } else {
                            handleSetSkillSL(sk.name, 0);
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs space-y-2 transition-all duration-200 cursor-pointer select-none ${
                          isLearned
                            ? 'bg-amber-50/80 border-amber-400 shadow-xs ring-1 ring-amber-400/40'
                            : 'bg-white/70 border-slate-200/90 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                isLearned ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-slate-300'
                              }`}
                            />
                            {/* 需求：技能字體加大 */}
                            <span
                              className={`text-sm sm:text-base tracking-wide font-black ${
                                isLearned ? 'text-amber-950 font-serif' : 'text-slate-800'
                              }`}
                            >
                              {sk.name}
                            </span>
                            {isLearned && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono">
                                SL {currentSL}
                              </span>
                            )}
                          </div>

                          {/* 官方四方星芒指示器 + 加減快捷鍵 */}
                          <div className="flex items-center gap-2">
                            <SkillStarPips
                              maxSL={maxSL}
                              currentSL={currentSL}
                              onChange={(newSL) => handleSetSkillSL(sk.name, newSL)}
                              size={18}
                            />

                            <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleSetSkillSL(sk.name, currentSL - 1)}
                                disabled={currentSL <= 0}
                                className="w-6 h-6 rounded border flex items-center justify-center font-bold text-xs disabled:opacity-20 hover:bg-white active:scale-95 transition-all cursor-pointer"
                                style={{ borderColor: theme.border, color: theme.textDark }}
                                title="減少 1 級"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetSkillSL(sk.name, currentSL + 1)}
                                disabled={currentSL >= maxSL}
                                className="w-6 h-6 rounded border flex items-center justify-center font-bold text-xs disabled:opacity-20 hover:bg-white active:scale-95 transition-all cursor-pointer"
                                style={{ borderColor: theme.border, color: theme.textDark }}
                                title="增加 1 級"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 需求：特技規則說明字體放大 */}
                        <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans pl-3 border-l-2 border-slate-200">
                          <SkillDescription desc={sk.desc} sl={currentSL} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ================= 底部確認操作列 ================= */}
              <div
                className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
                style={{ borderColor: theme.border }}
              >
                {/* 投入等級統計與提示 */}
                <div className="text-xs space-y-0.5 text-center sm:text-left">
                  <div className="font-bold flex items-center justify-center sm:justify-start gap-1.5" style={{ color: theme.textDark }}>
                    <span>目前投入：</span>
                    <strong className={`font-mono text-sm px-1.5 py-0.2 rounded ${
                      totalAllocatedSL === 0
                        ? 'text-slate-500 bg-slate-100'
                        : totalAllocatedSL > 4
                          ? 'text-rose-700 bg-rose-100'
                          : 'text-amber-800 bg-amber-100'
                    }`}>
                      {totalAllocatedSL} 級
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {totalAllocatedSL === 0 ? (
                      <span className="text-amber-700">請至少為一項特技分配 1 級</span>
                    ) : totalAllocatedSL > 4 ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <GiHazardSign className="w-3.5 h-3.5 shrink-0" />
                        起始創角單一職業最高不可超過 4 級
                      </span>
                    ) : (
                      <span>起始 5 級需分配於 2~3 個職業，單職上限 4 級</span>
                    )}
                  </p>
                </div>

                {/* 確認按鈕 */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 rounded font-medium cursor-pointer"
                  >
                    取消
                  </button>

                  <JRPGButton
                    variant={theme.buttonVariant || 'primary'}
                    size="sm"
                    icon={totalAllocatedSL > 0 && totalAllocatedSL <= 4 ? GiCheckMark : GiSparkles}
                    onClick={handleConfirm}
                    disabled={isClassAlreadyAdded || totalAllocatedSL < 1 || totalAllocatedSL > 4}
                  >
                    {isClassAlreadyAdded
                      ? '該職業已修習'
                      : totalAllocatedSL === 0
                        ? '請先分配特技等級'
                        : totalAllocatedSL > 4
                          ? '等級超出單職上限（最高 4 級）'
                          : `確認修習【${activeClassItem.className}】（投入 ${totalAllocatedSL} 級）`}
                  </JRPGButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <GiSparkles className="w-8 h-8 opacity-40" />
              <p className="text-xs">請從左側名冊中選擇一個職業以查看其特技與免費增益。</p>
            </div>
          )}
        </div>
      </div>
    </JRPGModal>
  );
}
