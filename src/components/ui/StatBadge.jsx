import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const STAT_CONFIG = {
  dex: { name: '敏捷', en: 'DEX', color: 'text-amber-800', border: 'border-amber-400', bg: 'bg-amber-50' },
  ins: { name: '洞察', en: 'INS', color: 'text-blue-800', border: 'border-blue-400', bg: 'bg-blue-50' },
  mig: { name: '力量', en: 'MIG', color: 'text-red-800', border: 'border-red-400', bg: 'bg-red-50' },
  wlp: { name: '意志', en: 'WLP', color: 'text-emerald-800', border: 'border-emerald-400', bg: 'bg-emerald-50' }
};

const VALID_TIERS = [6, 8, 10, 12];

export default function StatBadge({
  stat = 'dex',
  value = 8,
  onChange = null,
  size = 'md',
  showName = true,
  className = ''
}) {
  const cfg = STAT_CONFIG[stat.toLowerCase()] || STAT_CONFIG.dex;
  const isInteractive = typeof onChange === 'function';

  // Parse raw value to numeric tier for stepping
  const numValue = typeof value === 'string'
    ? (parseInt(value.replace('d', ''), 10) || 8)
    : (parseInt(value, 10) || 8);

  const displayVal = typeof value === 'string'
    ? (value.startsWith('d') ? value : `d${value}`)
    : `d${value}`;

  const handleStep = (step) => {
    if (!isInteractive) return;
    const currentIdx = VALID_TIERS.indexOf(numValue);
    const newIdx = currentIdx + step;
    if (newIdx >= 0 && newIdx < VALID_TIERS.length) {
      onChange(VALID_TIERS[newIdx]);
    }
  };

  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-lg border px-2.5 py-1 select-none transition-all shadow-sm",
          cfg.bg,
          cfg.border,
          size === 'sm' && "text-xs py-0.5 px-2",
          size === 'lg' && "text-base py-1.5 px-3",
          className
        )
      )}
    >
      {showName && (
        <span className={clsx("font-bold tracking-wider mr-2 font-mono text-xs flex items-center", cfg.color)}>
          {cfg.en}
          <span className="text-[10px] text-[#6b5a4b] ml-1 font-sans hidden sm:inline">{cfg.name}</span>
        </span>
      )}

      {isInteractive && (
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={numValue <= 6}
          className="text-[#8c7b6c] hover:text-amber-800 disabled:opacity-30 px-1 font-mono font-bold"
        >
          -
        </button>
      )}

      <span className="font-mono font-black text-[#2c221e] px-1.5">
        {displayVal}
      </span>

      {isInteractive && (
        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={numValue >= 12}
          className="text-[#8c7b6c] hover:text-amber-800 disabled:opacity-30 px-1 font-mono font-bold"
        >
          +
        </button>
      )}
    </div>
  );
}
