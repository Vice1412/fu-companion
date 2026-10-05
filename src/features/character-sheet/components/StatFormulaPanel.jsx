import React from 'react';

/**
 * 數值構成公式面板 (StatFormulaPanel)
 *
 * 為什麼要做這個：跑團時玩家最常被問的是「這個 65 是怎麼來的」。
 * 原本只有一個 `title` 提示（且因為引擎沒回傳 bonusHp 而顯示成 `+undefined`），
 * 這裡把引擎的 `breakdown` 逐項攤開：每一項的**小字在上、數值在下**，
 * 小字說明這筆數字的身分（基礎骰、角色等級、哪個職業的免費增益、哪個特技的第幾級…）。
 *
 * 純展示元件，零新依賴；資料一律來自 `calculateCharacterStats(char).breakdown`。
 */

// 面板底部備註：只在「基礎骰 / 當前骰」語意相關的數值上出現
export const STAT_FORMULA_NOTE =
  '最大生命值與魔力值採用基礎骰，不受狀態異常影響；物防與魔防採用當前骰。';

// kind -> 樣式（沿用全站羊皮紙暖色調；kind 由引擎的 breakdown 提供）
const KIND_STYLES = {
  base: { chip: 'bg-[#f5efdf] border-[#d6c7ab]', label: 'text-[#7c6a58]', value: 'text-[#3c2415]' },
  level: { chip: 'bg-amber-50 border-amber-300', label: 'text-amber-800', value: 'text-amber-950' },
  class: { chip: 'bg-emerald-50 border-emerald-300', label: 'text-emerald-800', value: 'text-emerald-950' },
  skill: { chip: 'bg-indigo-50 border-indigo-300', label: 'text-indigo-800', value: 'text-indigo-950' },
  equip: { chip: 'bg-stone-100 border-stone-300', label: 'text-stone-600', value: 'text-stone-900' },
  heroic: { chip: 'bg-violet-50 border-violet-300', label: 'text-violet-800', value: 'text-violet-950' },
  quirk: { chip: 'bg-rose-50 border-rose-300', label: 'text-rose-800', value: 'text-rose-950' },
  status: { chip: 'bg-red-50 border-red-300', label: 'text-red-800', value: 'text-red-950' }
};

const formatTermValue = (value) => {
  if (typeof value === 'number') return value > 0 ? `+${value}` : String(value);
  return String(value);
};

export default function StatFormulaPanel({
  isOpen = false,
  title = '',
  breakdown = null,
  note = null,
  onClose = null
}) {
  if (!isOpen || !breakdown) return null;

  const terms = breakdown.terms || [];

  return (
    <div className="mt-2.5 rounded-xl border border-[#d6c7ab] bg-[#fffdf9] p-2.5 shadow-inner animate-fade-in text-left">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-bold tracking-wider text-[#7c6a58]">
          數值構成{title ? ` · ${title}` : ''}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-[10px] font-bold text-[#8c7b6c] hover:text-[#3c2415] transition-colors"
          >
            收起
          </button>
        )}
      </div>

      <div className="flex items-stretch gap-1.5 flex-wrap">
        {terms.length === 0 ? (
          <span className="text-[10px] font-bold text-[#8c7b6c] px-2 py-1 rounded-lg bg-[#f5efdf] border border-dashed border-[#d6c7ab] self-center">
            無額外加成
          </span>
        ) : (
          terms.map((term, idx) => {
            const style = KIND_STYLES[term.kind] || KIND_STYLES.base;
            return (
              <div
                key={`${term.label}_${idx}`}
                className={`rounded-lg border px-2 py-1 flex flex-col items-center justify-center min-w-[54px] ${style.chip}`}
              >
                <span className={`text-[9px] leading-tight text-center ${style.label}`}>
                  {term.label}
                </span>
                <span className={`font-mono font-black text-xs leading-tight mt-0.5 ${style.value}`}>
                  {formatTermValue(term.value)}
                </span>
              </div>
            );
          })
        )}

        <div className="flex items-center px-0.5 font-mono font-black text-sm text-[#3c2415] self-center">=</div>

        <div className="rounded-lg border-2 border-[#3c2415]/25 bg-white px-2.5 py-1 flex flex-col items-center justify-center">
          <span className="text-[9px] leading-tight text-[#7c6a58]">合計</span>
          <span className="font-mono font-black text-sm leading-tight text-[#2c221e]">
            {breakdown.total}
          </span>
        </div>
      </div>

      {note && (
        <p className="text-[9px] leading-relaxed text-[#8c7b6c] mt-2">
          {note}
        </p>
      )}
    </div>
  );
}
