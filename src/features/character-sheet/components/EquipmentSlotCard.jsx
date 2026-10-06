import React from 'react';
import { GiHazardSign, GiPencil } from 'react-icons/gi';
import GameIcon from '../../../components/ui/GameIcon';
import JRPGBadge from '../../../components/ui/JRPGBadge';

/**
 * 裝備槽位卡 (EquipmentSlotCard)
 *
 * 只負責「目前這一格裝了什麼、對這個角色造成什麼結果」。
 * 選裝流程在 `EquipmentPickerModal`，本元件刻意不持有任何選項清單，
 * 以免兩個地方各有一份裝備資料。
 */
export default function EquipmentSlotCard({
  theme,
  slotDef,
  itemName,
  itemIcon = null,
  itemMissing = false,
  badges = [],
  metrics = [],
  note = null,
  warning = null,
  onOpen
}) {
  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-2 transition-colors"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: warning ? '#fca5a5' : theme.border
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0"
            style={{ backgroundColor: theme.panelBg, borderColor: theme.border, color: theme.accent }}
          >
            <GameIcon name={slotDef.icon} size={14} />
          </span>
          <span className="text-[11px] font-bold tracking-wide truncate" style={{ color: theme.textMuted }}>
            {slotDef.label}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="text-[11px] px-2 py-1 rounded-lg border font-bold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-all"
          style={{ backgroundColor: theme.panelBg, borderColor: theme.border, color: theme.textDark }}
        >
          <GiPencil size={11} />
          更換
        </button>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <GameIcon
            name={itemIcon || slotDef.icon}
            size={16}
            style={{ color: theme.accent }}
          />
          <span
            className="font-serif font-black text-sm truncate"
            style={{ color: itemMissing ? '#b91c1c' : theme.textDark }}
          >
            {itemName}
          </span>
          {badges.map((b) => (
            <JRPGBadge key={b.label} variant={b.variant || theme.badgeVariant} size="xs">
              {b.label}
            </JRPGBadge>
          ))}
        </div>
        {itemMissing && (
          <p className="text-[10px] text-rose-700 font-bold mt-0.5">資料表中查無此名稱</p>
        )}
      </div>

      {metrics.length > 0 && (
        <div className="flex items-stretch gap-1.5 flex-wrap">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border px-2 py-1 flex flex-col items-center justify-center min-w-[58px]"
              style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
            >
              <span className="text-[9px] leading-tight text-center" style={{ color: theme.textMuted }}>
                {m.label}
              </span>
              <span className="font-mono font-black text-xs leading-tight mt-0.5" style={{ color: theme.textDark }}>
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {note && (
        <p className="text-[10px] leading-relaxed" style={{ color: theme.textMuted }}>
          {note}
        </p>
      )}

      {warning && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700">
          <GiHazardSign size={12} className="shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}
