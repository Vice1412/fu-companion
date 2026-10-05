import React, { useState } from 'react';
import { GiMagnifyingGlass, GiLaurelCrown } from 'react-icons/gi';
import GameIcon from '../../../components/ui/GameIcon';
import JRPGModal from '../../../components/ui/JRPGModal';
import { SOURCEBOOKS } from '../data/sourcebookConfig';
import { ALL_STARTER_PRESETS } from '../data/starterPresets';
import { ALL_BOOKS, buildPresetSections } from '../utils/presetFilters';

/**
 * 官方經典職業搭配 —— 面板內容。
 *
 * 與 `JRPGModal` 分離的理由：`JRPGModal` 只在掛載後（`useEffect`）才渲染內容，
 * 因此面板必須能獨立渲染，才能在 Node 下做 SSR 煙霧測試。
 *
 * @param {object[]} presets 全部經典搭配（預設為官方五本手冊共 81 組）
 * @param {object} theme 角色卡主題
 * @param {(preset: object) => void} onApply 套用回呼
 */
export function StarterPresetsPanel({ presets = ALL_STARTER_PRESETS, theme, onApply }) {
  const [search, setSearch] = useState('');
  const [sourcebook, setSourcebook] = useState(ALL_BOOKS);

  const sections = buildPresetSections(presets, { search, sourcebook });
  const count = sections.reduce((sum, s) => sum + s.items.length, 0);

  const bookFilters = [
    { id: ALL_BOOKS, shortName: '全部' },
    ...Object.keys(SOURCEBOOKS).map((key) => ({ id: key, shortName: SOURCEBOOKS[key].shortName }))
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 leading-relaxed -mt-1">
        嚴格遵循官方五本手冊實裝，共 81 組經典職業搭配：核心 20 組（p.172-175）、高度奇幻 18 組（p.132-135）、
        自然奇幻 18 組（p.134-137）、科技奇幻 17 組（p.146-149）、特典合輯 8 組（p.24-25）。
        含特技分配、起始裝備與資金。
      </p>

      {/* 手冊篩選 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {bookFilters.map((sb) => {
          const isActive = sourcebook === sb.id;
          return (
            <button
              key={sb.id}
              type="button"
              onClick={() => setSourcebook(sb.id)}
              className="text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              style={
                isActive
                  ? { backgroundColor: theme.accent, borderColor: theme.accentDark, color: '#ffffff' }
                  : { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }
              }
            >
              {sb.shortName}
            </button>
          );
        })}
        <span className="text-[10px] text-slate-400 font-mono ml-auto">{count} 組</span>
      </div>

      {/* 關鍵字搜尋 */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋經典搭配名稱、職業或特技（例如：黑騎士、舞者、植物學家、混合變形）..."
          className="w-full px-3.5 py-2 pl-9 text-xs rounded-xl bg-white border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 shadow-2xs"
          style={{ borderColor: theme.border }}
        />
        <GiMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            清除
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {sections.map((section) => (
          <React.Fragment key={section.gid || `solo_${section.items[0].id}`}>
            {section.title && (
              <div
                className="md:col-span-2 flex items-center gap-2 pt-1 pb-0.5 border-b"
                style={{ borderColor: theme.border }}
              >
                <GiLaurelCrown className="w-4 h-4 shrink-0" style={{ color: theme.accent }} />
                <span className="font-serif font-black text-sm" style={{ color: theme.textDark }}>
                  {section.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{section.items.length} 名成員</span>
              </div>
            )}
            {section.items.map((preset) => (
              <div
                key={preset.id}
                className="rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all shadow-xs hover:shadow-md"
                style={{ backgroundColor: theme.panelBg, borderColor: theme.border }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif font-black text-base" style={{ color: theme.textDark }}>
                      {preset.title}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-2xs"
                        style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.accent }}
                      >
                        {SOURCEBOOKS[preset.sourcebook || 'core'].shortName}
                      </span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded border font-mono shadow-2xs"
                        style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark }}
                      >
                        {preset.zenit}z
                      </span>
                    </span>
                  </div>

                  {/* 職業徽章與四維陣列 */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[11px]">
                    {preset.classes.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded border font-bold flex items-center gap-1"
                        style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textDark }}
                      >
                        <GameIcon name={c.className} size={12} style={{ color: theme.accent }} />
                        {c.className} Lv{c.level}
                      </span>
                    ))}
                    <span className="text-slate-400 text-[10px]">
                      [DEX d{preset.attributes.dex}, INS d{preset.attributes.ins}, MIG d{preset.attributes.mig}, WLP d{preset.attributes.wlp}]
                    </span>
                  </div>

                  {/* 習得技能 */}
                  <div
                    className="text-[11px] text-slate-700 bg-white/90 rounded-lg p-2.5 border space-y-1 shadow-2xs"
                    style={{ borderColor: theme.border }}
                  >
                    <div className="font-bold text-[10px] uppercase tracking-wider" style={{ color: theme.accent }}>
                      習得技能
                    </div>
                    {preset.classes.map((c, i) => (
                      <div key={i} className="text-[11px] leading-tight">
                        <span className="font-bold" style={{ color: theme.textDark }}>{c.className}:</span>{' '}
                        {c.skills.map((s) => `${s.name}${s.sl > 1 ? ` SL${s.sl}` : ''}`).join('、')}
                      </div>
                    ))}
                  </div>

                  {/* 起始裝備 */}
                  <div
                    className="text-[11px] text-slate-600 bg-white/70 rounded-lg px-2.5 py-1.5 border flex items-center gap-1.5 shadow-2xs"
                    style={{ borderColor: theme.border }}
                  >
                    <span className="font-bold text-slate-700">裝備:</span>{' '}
                    {[
                      preset.equipment.mainHand,
                      preset.equipment.offHand && preset.equipment.offHand !== '無盾牌' ? preset.equipment.offHand : null,
                      preset.equipment.armor
                    ].filter(Boolean).join('、')}
                  </div>

                  {/* 自訂武器／魔晶石／金手指註記（僅該配置有此欄位時顯示） */}
                  {preset.customWeapon && (
                    <div
                      className="text-[11px] text-slate-600 bg-white/70 rounded-lg px-2.5 py-1.5 border leading-relaxed shadow-2xs"
                      style={{ borderColor: theme.border }}
                    >
                      <span className="font-bold text-slate-700">自訂武器:</span> {preset.customWeapon}
                    </div>
                  )}
                  {preset.mnemosphere && (
                    <div
                      className="text-[11px] text-slate-600 bg-white/70 rounded-lg px-2.5 py-1.5 border leading-relaxed shadow-2xs"
                      style={{ borderColor: theme.border }}
                    >
                      <span className="font-bold text-slate-700">魔晶石:</span> {preset.mnemosphere}
                    </div>
                  )}
                  {preset.quirk && (
                    <div
                      className="text-[11px] text-slate-600 bg-white/70 rounded-lg px-2.5 py-1.5 border leading-relaxed shadow-2xs"
                      style={{ borderColor: theme.border }}
                    >
                      <span className="font-bold text-slate-700">金手指:</span> {preset.quirk}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onApply(preset)}
                  className="w-full py-2 rounded-lg text-white font-bold text-xs shadow-xs transition-all hover:opacity-90 active:scale-98 cursor-pointer"
                  style={{ backgroundColor: theme.accent }}
                >
                  套用此經典配置
                </button>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * 官方經典職業搭配 Modal。
 */
export default function StarterPresetsModal({ isOpen, onClose, theme, onApply }) {
  return (
    <JRPGModal
      isOpen={isOpen}
      onClose={onClose}
      title="官方經典職業搭配"
      maxWidth="max-w-4xl"
      theme={theme}
    >
      <StarterPresetsPanel theme={theme} onApply={onApply} />
    </JRPGModal>
  );
}
