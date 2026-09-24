import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { GiPalette } from 'react-icons/gi';
import { CHARACTER_THEMES, getCharacterTheme } from '../utils/characterThemes';

export default function CharacterThemePicker({
  currentThemeId = 'emerald',
  onSelectTheme,
  className = '',
  buttonClassName = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const theme = getCharacterTheme(currentThemeId);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white shadow-sm transition-all hover:scale-102 text-xs font-bold ${buttonClassName}`}
        style={{
          borderColor: theme.border,
          color: theme.textDark
        }}
        title="切換角色卡色彩風格"
      >
        <GiPalette className="w-4 h-4 shrink-0" style={{ color: theme.accent }} />
        <span className="hidden sm:inline text-slate-600 font-normal">卡片風格：</span>
        <span>{theme.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: theme.accent }}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 sm:left-0 top-full mt-1.5 bg-white border-2 rounded-xl shadow-2xl p-2.5 z-50 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ borderColor: theme.border }}
          >
            <div className="text-[11px] font-bold text-slate-600 mb-2 px-1 flex items-center justify-between border-b pb-1.5" style={{ borderColor: theme.border }}>
              <span className="flex items-center gap-1 text-slate-800">
                <GiPalette className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                <span>選擇角色卡風格</span>
              </span>
              <span className="text-[10px] font-mono" style={{ color: theme.accentHover }}>
                6 種經典主題
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(CHARACTER_THEMES).map(t => {
                const isSelected = (currentThemeId || 'emerald') === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onSelectTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all text-xs font-bold ${
                      isSelected
                        ? 'shadow-sm ring-1'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                    style={{
                      borderColor: isSelected ? t.accent : '#e2e8f0',
                      backgroundColor: isSelected ? t.subpanelBg : '#ffffff',
                      color: isSelected ? t.textDark : '#475569'
                    }}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 border shadow-xs"
                      style={{
                        backgroundColor: t.accent,
                        borderColor: t.accentDark
                      }}
                    />
                    <span className="truncate">{t.name}</span>
                    {isSelected && (
                      <Check
                        className="w-3.5 h-3.5 ml-auto shrink-0"
                        style={{ color: t.accent }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
