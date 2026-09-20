import React from 'react';
import {
  GiSpellBook,
  GiReturnArrow,
  GiRollingDices,
  GiSaveArrow,
  GiOpenChest,
  GiSoundOn,
  GiSoundOff
} from 'react-icons/gi';
import appIcon from '../../assets/app-icon.png';
import { isSoundEnabled, toggleSoundEnabled, playBookCloseSound } from '../../utils/soundEffects';

export default function ChapterHeader({
  chapter,
  onExitToCover,
  onOpenDice,
  onBackup,
  onRestore
}) {
  const soundOn = isSoundEnabled();

  const handleExit = () => {
    playBookCloseSound();
    onExitToCover();
  };

  return (
    <header className="border-b border-sky-200 bg-[#e0f2fe]/90 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors">
      {/* Left: Exit to Book Cover Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={handleExit}
          className="group inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-sky-400 bg-gradient-to-r from-sky-600 to-cyan-700 hover:from-sky-500 hover:to-cyan-600 text-white shadow-md shadow-sky-950/20 text-xs sm:text-sm font-serif font-bold transition-all hover:scale-105 active:scale-95"
          title="合上當前章節，返回典籍封面目錄以選擇其他功能"
        >
          <GiReturnArrow className="w-4 h-4 text-sky-200 group-hover:-translate-x-0.5 transition-transform" />
          <span className="flex items-center gap-1.5">
            <GiSpellBook className="w-4 h-4 text-sky-200" />
            <span>合上書本 · 返回封面</span>
          </span>
        </button>

        {/* Vertical Divider */}
        <div className="hidden sm:block h-6 w-px bg-sky-300" />

        {/* Current Chapter Indicator */}
        <div className="hidden md:flex items-center gap-2">
          <img
            src={appIcon}
            alt="FU Icon"
            className="w-7 h-7 rounded border border-sky-300 object-contain bg-white p-0.5"
          />
          <span className="font-serif font-black text-sm text-slate-800 tracking-wide">
            {chapter.title}
          </span>
        </div>
      </div>

      {/* Center on mobile / small screen */}
      <div className="md:hidden flex items-center text-xs font-serif font-bold text-slate-800">
        <span className="truncate max-w-[150px] sm:max-w-none">{chapter.title}</span>
      </div>

      {/* Right: Quick Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Dice Roller Button in Header */}
        <button
          onClick={onOpenDice}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-sky-300 bg-white hover:bg-sky-50 text-xs text-sky-900 font-bold transition-colors shadow-sm"
          title="開啟雙屬性擲骰器"
        >
          <GiRollingDices className="w-4 h-4 text-sky-700" />
          <span className="hidden sm:inline font-mono">擲骰器</span>
        </button>

        {/* Restore */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={onRestore}
            className="hidden"
          />
          <span className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-sky-300 bg-white hover:bg-sky-50 text-xs text-slate-700 hover:text-sky-900 transition-colors shadow-sm font-medium">
            <GiOpenChest className="w-4 h-4 text-sky-700" />
            <span className="hidden lg:inline">還原</span>
          </span>
        </label>

        {/* Backup */}
        <button
          onClick={onBackup}
          className="inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-sky-300 bg-white hover:bg-sky-50 text-xs text-slate-700 hover:text-sky-900 transition-colors shadow-sm font-medium"
          title="下載全站完整 JSON 備份檔"
        >
          <GiSaveArrow className="w-4 h-4 text-sky-700" />
          <span className="hidden lg:inline">備份</span>
        </button>
      </div>
    </header>
  );
}
