import React, { useState, useMemo } from 'react';
import {
  GiSparkles,
  GiCheckMark,
  GiMagnifyingGlass,
  GiBroadsword,
  GiShield
} from 'react-icons/gi';
import GameIcon from '../../../components/ui/GameIcon';
import JRPGModal from '../../../components/ui/JRPGModal';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import JRPGButton from '../../../components/ui/JRPGButton';
import { SOURCEBOOKS, getClassInfo } from '../data/sourcebookConfig';
import rulesData from '../data/rulesData.json';

/**
 * 職業選擇器彈窗 (ClassPickerModal)
 * 滿足需求 1：
 * - 中英文名、專屬圖標並存，一目了然看懂職業畫風。
 * - 點擊後展示一小句戰鬥風格敘述（杜絕小作文）。
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

  const activeClassItem = useMemo(() => {
    if (!selectedClassName) return null;
    return availableClasses.find(c => c.className === selectedClassName);
  }, [availableClasses, selectedClassName]);

  const handleConfirmAdd = () => {
    if (!selectedClassName) return;
    onSelectClass(selectedClassName);
    setSelectedClassName(null);
    onClose();
  };

  return (
    <JRPGModal
      isOpen={isOpen}
      onClose={onClose}
      title="修習新職業 (Choose Class)"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {/* 搜尋欄位 */}
        <div className="relative">
          <GiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋職業名稱（中文 / 英文 / 特性關鍵字）..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none font-sans shadow-inner transition-colors"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
              color: theme.textDark
            }}
          />
        </div>

        {/* 職業清單網格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto p-1 pr-2">
          {filteredClasses.map((item) => {
            const isSelected = selectedClassName === item.className;
            const isAlreadyAdded = existingClassNames.includes(item.className);

            return (
              <div
                key={item.className}
                onClick={() => {
                  if (!isAlreadyAdded) {
                    setSelectedClassName(item.className);
                  }
                }}
                className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between gap-2 cursor-pointer select-none ${
                  isAlreadyAdded
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
                <div className="space-y-1.5">
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

                  {/* 一小句畫風簡述 */}
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {item.info.tagline}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 font-mono">
                  <span className="text-slate-500 truncate" title={item.def.freeBonus}>
                    {item.def.freeBonus || '5 個專屬特技'}
                  </span>
                  {isAlreadyAdded ? (
                    <span className="text-slate-400 font-bold">已修習</span>
                  ) : isSelected ? (
                    <span className="font-bold flex items-center gap-0.5" style={{ color: theme.accent }}>
                      <GiCheckMark className="w-3 h-3" /> 已選定
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* 選中後的預覽卡片與確認按鈕 */}
        {activeClassItem && (
          <div
            className="p-3.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200"
            style={{
              backgroundColor: theme.subpanelBg,
              borderColor: theme.accent
            }}
          >
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div
                className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                  color: theme.accent
                }}
              >
                <GameIcon name={activeClassItem.info.icon || activeClassItem.className} size={26} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-black text-sm" style={{ color: theme.textDark }}>
                    {activeClassItem.className}
                  </h4>
                  <span className="font-mono text-xs font-bold text-slate-500 uppercase">
                    / {activeClassItem.info.en}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded">
                    {activeClassItem.def.freeBonus}
                  </span>
                </div>
                <p className="text-xs text-slate-600 italic mt-0.5 leading-relaxed">
                  {activeClassItem.info.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <JRPGButton
                variant={theme.buttonVariant || 'primary'}
                size="sm"
                icon={GiSparkles}
                onClick={handleConfirmAdd}
              >
                修習【{activeClassItem.className}】並配置技能
              </JRPGButton>
            </div>
          </div>
        )}
      </div>
    </JRPGModal>
  );
}
