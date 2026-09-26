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
 * 職業選擇與技能分配彈窗 (ClassPickerModal)
 * 響應式雙模態架構：
 * 1. 手機端 (< md)：雙步驟分步導航 (步驟 1 選職 ⇄ 步驟 2 加點確認)，吸底操作列，單一全域順滑捲軸，絕不卡死。
 * 2. 電腦端 (≥ md)：左右雙欄並排 (Master-Detail)，左側名冊即時聯動右側詳情，保持大螢幕最高操作效率。
 * 3. 官方四方星芒：Max SL 採用官方字型 'w' 四角銳星指示器。
 * 4. 創角規則因果正確：起始 5 級必須分配於 2~3 個不同職業，不可全數投入單一職業。
 * 5. 全面呈現免費增益：完整對齊官方規則與繁中 Excel 角色卡名詞（職業近戰、職業防具等）。
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
  // 手機端導航步驟：'list' (挑選名冊) | 'detail' (技能加點與確認)
  const [mobileStep, setMobileStep] = useState('list');

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

  // 彈窗開啟或關閉時的狀態管理
  useEffect(() => {
    if (isOpen) {
      setMobileStep('list');
      if (!selectedClassName || !availableClasses.some(c => c.className === selectedClassName)) {
        const firstAvailable = availableClasses.find(c => !existingClassNames.includes(c.className));
        if (firstAvailable) {
          handleInitClassDraft(firstAvailable.className);
        }
      }
    } else {
      setSelectedClassName(null);
      setDraftSkills({});
      setSearch('');
      setMobileStep('list');
    }
  }, [isOpen]);

  const activeClassItem = useMemo(() => {
    if (!selectedClassName) return null;
    return availableClasses.find(c => c.className === selectedClassName);
  }, [availableClasses, selectedClassName]);

  // 初始化職業技能草稿（全為 0 級空白）
  const handleInitClassDraft = (cName) => {
    setSelectedClassName(cName);
    const cDef = rulesData.classes[cName] || {};
    const initialMap = {};
    (cDef.skills || []).forEach(sk => {
      initialMap[sk.name] = 0;
    });
    setDraftSkills(initialMap);
  };

  // 點擊名冊卡片：在手機端自動平滑切換至步驟 2，電腦端即時聯動右側
  const handleSelectClassItem = (cName) => {
    handleInitClassDraft(cName);
    setMobileStep('detail');
  };

  // 調整技能等級
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
    if (totalAllocatedSL < 1 || totalAllocatedSL >= 5) return;

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
      title="選擇職業與技能分配"
      maxWidth="max-w-5xl"
    >
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 h-[80vh] md:h-[75vh] max-h-[720px] overflow-hidden -m-1">
        {/* ================= 左側欄：職業名冊與搜尋 (手機端步驟 1) ================= */}
        <div
          className={`w-full md:w-72 lg:w-80 shrink-0 flex-col border-b md:border-b-0 md:border-r pr-0 md:pr-3 pb-2 md:pb-0 h-full overflow-hidden ${
            mobileStep === 'list' ? 'flex' : 'hidden md:flex'
          }`}
          style={{ borderColor: theme.border }}
        >
          {/* 手機端步驟引導 */}
          <div className="flex md:hidden items-center justify-between pb-1.5 mb-1 text-slate-600">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <GiSparkles className="w-3.5 h-3.5 text-amber-600" />
              步驟 1/2：請點選欲修習的職業
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              共 {filteredClasses.length} 職
            </span>
          </div>

          {/* 搜尋欄位 */}
          <div className="relative mb-2.5 shrink-0">
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

          {/* 職業清單（單一滾動容器，絕不卡死） */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
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
                        : 'hover:border-amber-400 hover:shadow-2xs active:scale-98'
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
                    <span className="text-amber-900 font-bold truncate bg-amber-100/80 px-1.5 py-0.5 rounded" title={item.def.freeBonus}>
                      {item.def.freeBonus || ''}
                    </span>
                    {isAdded ? (
                      <span className="text-slate-400 font-bold">已修習</span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-0.5">
                        <span className="text-[11px]">配點</span> →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= 右側欄：職業詳情、技能分配與確認操作 (手機端步驟 2) ================= */}
        <div
          className={`flex-1 min-w-0 flex-col justify-between pl-0 md:pl-2 h-full overflow-hidden ${
            mobileStep === 'detail' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeClassItem ? (
            <div className="flex-1 flex flex-col overflow-hidden space-y-2.5 sm:space-y-3 min-h-0">
              {/* 手機端專屬頂部返回按鈕 */}
              <div className="flex md:hidden items-center justify-between pb-1.5 border-b shrink-0" style={{ borderColor: theme.border }}>
                <button
                  type="button"
                  onClick={() => setMobileStep('list')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 hover:bg-amber-200 active:scale-95 px-3 py-1.5 rounded-lg border border-amber-300 transition-all shadow-2xs cursor-pointer"
                >
                  <span>← 選擇其它職業</span>
                </button>
                <span className="text-xs font-bold text-slate-500 font-mono">步驟 2/2：技能分配</span>
              </div>

              {/* 頂部職業標題與風格敘述 */}
              <div
                className="p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 shrink-0 shadow-2xs"
                style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs"
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      color: theme.accent
                    }}
                  >
                    <GameIcon name={activeClassItem.info.icon || activeClassItem.className} size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
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

              {/* 滾動內容容器：包含職業免費增益、技能指引與 5 項技能（隨頁面一同平滑滾動） */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 min-h-0">
                {/* 職業免費增益區塊 */}
                <div
                  className="p-2.5 sm:p-3 rounded-xl border space-y-1 shadow-2xs"
                  style={{ backgroundColor: theme.subpanelBg, borderColor: theme.accent }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs flex items-center gap-1.5" style={{ color: theme.textDark }}>
                      <GiSparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                      職業免費增益
                    </span>
                    {activeClassItem.def.freeBonus && (
                      <span className="text-xs font-mono font-bold text-amber-950 bg-amber-200/90 border border-amber-300 px-2 py-0.5 rounded shadow-2xs">
                        <SkillDescription desc={activeClassItem.def.freeBonus} />
                      </span>
                    )}
                  </div>
                  {activeClassItem.def.freeBenefits && (
                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans">
                      <SkillDescription desc={activeClassItem.def.freeBenefits} />
                    </p>
                  )}
                </div>

                {/* 職業技能清單指示標題 */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 px-0.5">
                  <span className="font-bold">
                    職業技能清單（點擊星星或加號分配等級）：
                  </span>
                  <span className="font-mono font-bold text-slate-500">
                    5 項技能任選
                  </span>
                </div>

                {/* 5 項技能卡片 */}
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

                      {/* 需求：技能規則說明字體放大 */}
                      <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans pl-3 border-l-2 border-slate-200">
                        <SkillDescription desc={sk.desc} sl={currentSL} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ================= 底部確認操作列（手機端吸底，大拇指單手操作） ================= */}
              <div
                className="pt-2.5 sm:pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0 bg-[#fffdf9]"
                style={{ borderColor: theme.border }}
              >
                {/* 投入等級統計與正確認知規則引導 */}
                <div className="text-xs space-y-0.5 text-center sm:text-left w-full sm:w-auto">
                  <div className="font-bold flex items-center justify-center sm:justify-start gap-1.5" style={{ color: theme.textDark }}>
                    <span>目前投入：</span>
                    <strong className={`font-mono text-sm px-1.5 py-0.2 rounded ${
                      totalAllocatedSL === 0
                        ? 'text-slate-500 bg-slate-100'
                        : totalAllocatedSL >= 5
                          ? 'text-rose-700 bg-rose-100'
                          : 'text-amber-800 bg-amber-100'
                    }`}>
                      {totalAllocatedSL} 級
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {totalAllocatedSL === 0 ? (
                      <span className="text-amber-700">請至少為此職業分配 1 級技能</span>
                    ) : totalAllocatedSL >= 5 ? (
                      <span className="text-rose-600 font-bold flex items-center justify-center sm:justify-start gap-1">
                        <GiHazardSign className="w-3.5 h-3.5 shrink-0" />
                        開局必須修習 2~3 個職業，請至少保留等級給其他職業
                      </span>
                    ) : (
                      <span>起始 5 級必須分配於 2~3 個不同職業</span>
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
                    icon={totalAllocatedSL >= 1 && totalAllocatedSL <= 4 ? GiCheckMark : GiSparkles}
                    onClick={handleConfirm}
                    disabled={isClassAlreadyAdded || totalAllocatedSL < 1 || totalAllocatedSL >= 5}
                    className="w-full sm:w-auto min-h-[38px]"
                  >
                    {isClassAlreadyAdded
                      ? '該職業已修習'
                      : totalAllocatedSL === 0
                        ? '請先分配技能等級'
                        : totalAllocatedSL >= 5
                          ? '開局需兼修 2~3 個職業'
                          : `確認修習【${activeClassItem.className}】（投入 ${totalAllocatedSL} 級）`}
                  </JRPGButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <GiSparkles className="w-8 h-8 opacity-40" />
              <p className="text-xs">請從左側名冊中選擇一個職業以查看其技能與免費增益。</p>
            </div>
          )}
        </div>
      </div>
    </JRPGModal>
  );
}
