/**
 * 「這個職業精通之後能解鎖哪些英雄技能」——附條件與效果全文。
 *
 * 使用者要求：「要在『職業與技能』界面實裝選擇的職業可以在下面看到相對應的英雄規則的
 * 學習條件和效果」。所以這裡**直接印條件與效果全文**，不是只給名字——
 * 與 `ClassPickerModal` 裡那排小標籤不同：那裡是挑職業時的掃視用（文字塞多了會淹掉面板），
 * 這裡是已經選定之後的查閱用，看得到全文才有意義。
 *
 * 預設**展開**：使用者抱怨過「這個功能怎麼我沒有看見」，預設收合等於再一次看不見。
 * 覺得吵可以自己收起來（狀態只存在這個元件裡，不進存檔）。
 *
 * 條件與效果的來源見 `heroicSkillsForClass`（與 `checkHeroicSkillRequirement` 共用判定）。
 */
import React, { useState } from 'react';
import { GiLaurelCrown } from 'react-icons/gi';
import { heroicSkillsForClass, HEROIC_SKILL_SOURCE_LABELS } from '../utils/characterEngine';

export default function ClassHeroicSkillsBlock({ className, theme = {}, mastered = false }) {
  const [open, setOpen] = useState(true);
  const list = heroicSkillsForClass(className);
  if (list.length === 0) return null;

  return (
    <div
      className="rounded-xl border shadow-2xs overflow-hidden"
      style={{ backgroundColor: theme.panelBg || '#fbf7ee', borderColor: theme.border || '#d6c7ab' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer hover:bg-black/[0.02] transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <GiLaurelCrown className="w-4 h-4 shrink-0" style={{ color: theme.accent || '#b45309' }} />
          <span className="text-xs font-bold truncate" style={{ color: theme.textDark || '#3c2415' }}>
            精通後可解鎖的英雄技能
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold shrink-0"
            style={{
              backgroundColor: theme.cardBg || '#fffdf9',
              borderColor: theme.border || '#d6c7ab',
              color: mastered ? (theme.accent || '#b45309') : (theme.textMuted || '#78716c')
            }}
          >
            {list.length}
          </span>
          {mastered && (
            <span className="text-[10px] shrink-0" style={{ color: theme.accent || '#b45309' }}>
              已精通
            </span>
          )}
        </span>
        <span className="text-[11px] shrink-0" style={{ color: theme.textMuted || '#78716c' }}>
          {open ? '收起' : '展開'}
        </span>
      </button>

      {open && (
        <div className="border-t divide-y" style={{ borderColor: theme.border || '#d6c7ab' }}>
          <p className="px-3 py-1.5 text-[10px] leading-snug" style={{ color: theme.textMuted || '#78716c' }}>
            把這個職業練到 10 級（精通）可獲得一個英雄技能（原書 p.232）。以下每一條都必須先精通
            {className}，其他條件列在各自的「條件」欄。
          </p>
          {list.map((h) => (
            <div key={h.name} className="px-3 py-2 space-y-1" style={{ borderColor: theme.border || '#d6c7ab' }}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-bold" style={{ color: theme.textDark || '#3c2415' }}>
                  {h.name}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded border font-bold"
                  style={{
                    backgroundColor: theme.subpanelBg || '#f5efdf',
                    borderColor: theme.border || '#d6c7ab',
                    color: theme.textMuted || '#78716c'
                  }}
                >
                  {HEROIC_SKILL_SOURCE_LABELS[h.source] || h.source}
                </span>
              </div>
              <p className="text-[11px] leading-snug" style={{ color: theme.textMuted || '#78716c' }}>
                <strong>條件：</strong>{h.requirement}
              </p>
              <p className="text-[11px] leading-relaxed whitespace-pre-line" style={{ color: theme.textDark || '#3c2415' }}>
                {h.effect}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
