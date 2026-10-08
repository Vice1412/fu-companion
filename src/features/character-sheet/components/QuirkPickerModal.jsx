import React, { useMemo, useState } from 'react';
import { GiMagnifyingGlass, GiCheckMark, GiSparkles, GiHazardSign } from 'react-icons/gi';
import JRPGModal from '../../../components/ui/JRPGModal';
import JRPGBadge from '../../../components/ui/JRPGBadge';
import JRPGButton from '../../../components/ui/JRPGButton';
import SkillDescription from '../utils/skillFormulaEvaluator';
import rulesData from '../data/rulesData.json';

/**
 * 金手指（Quirk）選擇器。
 *
 * ## 為什麼是「只列題目」而不是英雄技能那種大表
 *
 * 使用者的原話：
 *
 * > 我要把它做成彈出的視窗顯示表，像英雄技能的處理一樣。但畢竟金手指沒有先決條件，
 * > 所以不必做成這麼麻煩的表。我的提議是全部都寫題目而已，玩家有感興趣的才點進去看
 * > 金手指的詳細效果內容，確定了就選擇。
 *
 * 英雄技能那張表之所以要四欄（名稱／出處／條件／效果），是因為**條件**要能一眼掃過去；
 * 金手指沒有任何先決條件，所以只需要「名稱清單 ＋ 點開看細節」。
 *
 * ## 為什麼不顯示出處
 *
 * 使用者的原話：
 *
 * > 檢查一下三大擴展的金手指是否有重複，如果沒有就把金手指的出處也列出來；
 * > 有的話就不列，直接寫出所有的金手指就可以。
 *
 * 實測**有重複**——`FLIGHT` 與 `CURSED` 同時收錄於高度奇幻與自然奇幻手冊，
 * `ROBOT` 同時收錄於高度奇幻與科技奇幻手冊——所以依裁定**不列出處**。
 *
 * ## 兩個導出
 *
 * - `QuirkPickerBody`：純內容，SSR 測得到（`JRPGModal` 用 portal，SSR 會渲染成空的）。
 * - 預設 `QuirkPickerModal`：把 body 包進 `JRPGModal`。
 */
export function QuirkPickerBody({
  theme,
  selectedName = '',
  onPick,
  onClear,
  onClose
}) {
  const [search, setSearch] = useState('');
  const [openName, setOpenName] = useState(selectedName || null);

  const quirks = useMemo(() => rulesData.quirks || [], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quirks;
    return quirks.filter((x) => x.name.toLowerCase().includes(q));
  }, [quirks, search]);

  const opened = useMemo(
    () => quirks.find((x) => x.name === openName) || null,
    [quirks, openName]
  );

  return (
    <div className="flex flex-col h-[80vh] md:h-[72vh] max-h-[700px] overflow-hidden -m-1">
      {/* 搜尋列 */}
      <div className="relative mb-3 shrink-0">
        <GiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`搜尋金手指名稱（共 ${quirks.length} 個）...`}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none font-sans shadow-inner"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-4 flex-1 min-h-0 overflow-hidden">
        {/* 左：全部金手指的**題目**。沒有先決條件，所以不需要任何額外欄位。 */}
        <div
          className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col border-b md:border-b-0 md:border-r pb-2 md:pb-0 md:pr-3 overflow-hidden"
          style={{ borderColor: theme.border }}
        >
          <span className="text-[11px] font-bold mb-2 shrink-0" style={{ color: theme.textMuted }}>
            點名稱看詳細內容（{filtered.length} 個）
          </span>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
            {filtered.length === 0 ? (
              <p className="text-[11px] py-4 text-center" style={{ color: theme.textMuted }}>
                沒有符合「{search}」的金手指
              </p>
            ) : (
              filtered.map((q) => {
                const isOpen = openName === q.name;
                const isPicked = selectedName === q.name;
                return (
                  <button
                    key={q.name}
                    type="button"
                    onClick={() => setOpenName(q.name)}
                    className="w-full text-left px-2.5 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer active:scale-98 flex items-center justify-between gap-1.5"
                    style={
                      isOpen
                        ? { backgroundColor: theme.accent, borderColor: theme.accentDark, color: '#ffffff' }
                        : isPicked
                          ? { backgroundColor: theme.subpanelBg, borderColor: theme.accent, color: theme.textDark }
                          : { backgroundColor: theme.cardBg, borderColor: theme.border, color: theme.textDark }
                    }
                  >
                    <span className="truncate">{q.name}</span>
                    {isPicked ? <GiCheckMark className="w-3 h-3 shrink-0" /> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 右：詳細內容。沒點任何一個之前是空狀態。 */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {opened ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 min-h-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <GiSparkles className="w-4 h-4 shrink-0" style={{ color: theme.accent }} />
                  <h3 className="font-serif font-black text-base" style={{ color: theme.textDark }}>
                    {opened.name}
                  </h3>
                  {selectedName === opened.name && (
                    <JRPGBadge variant="emerald" size="xs">目前已選</JRPGBadge>
                  )}
                </div>

                {/* 風味文（原書用一串提問帶出角色的處境）與效果分開呈現——
                    使用者要求「適當的情況下，讓效果內容分段方便閱讀」。 */}
                {opened.flavor && (
                  <p
                    className="text-[11px] italic leading-relaxed p-2.5 rounded-lg border"
                    style={{ backgroundColor: theme.subpanelBg, borderColor: theme.border, color: theme.textMuted }}
                  >
                    <SkillDescription desc={opened.flavor} />
                  </p>
                )}
                <div className="text-xs sm:text-[13px] leading-relaxed space-y-2" style={{ color: theme.textDark }}>
                  {(opened.desc || '').split('\n').map((para, i) => (
                    <p key={i}><SkillDescription desc={para} /></p>
                  ))}
                </div>
              </div>

              {/* 底部：確定選擇 */}
              <div
                className="pt-3 mt-3 border-t flex items-center justify-between gap-3 shrink-0"
                style={{ borderColor: theme.border }}
              >
                <span className="text-[11px]" style={{ color: theme.textMuted }}>
                  一個角色只能擁有一個金手指；同一團不得有兩人選同一個。
                </span>
                <div className="flex items-center gap-2">
                  {selectedName && (
                    <button
                      type="button"
                      onClick={() => { onClear && onClear(); onClose && onClose(); }}
                      className="text-[11px] text-slate-500 hover:text-red-700 px-2 py-1 cursor-pointer"
                    >
                      移除目前的金手指
                    </button>
                  )}
                  <JRPGButton
                    variant={theme.buttonVariant || 'primary'}
                    size="sm"
                    icon={GiCheckMark}
                    onClick={() => { onPick && onPick(opened); onClose && onClose(); }}
                  >
                    {selectedName === opened.name ? '維持這個' : '選擇這個金手指'}
                  </JRPGButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2" style={{ color: theme.textMuted }}>
              <GiHazardSign className="w-8 h-8 opacity-40" />
              <p className="text-xs">從左邊點一個金手指，這裡會顯示它的完整內容。</p>
              <p className="text-[11px] opacity-80">
                金手指是**選用規則**——原書只建議「想玩就用、而且開局一人一個」，不強制。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuirkPickerModal({
  isOpen,
  onClose,
  theme,
  selectedName = '',
  onPick,
  onClear
}) {
  return (
    <JRPGModal isOpen={isOpen} onClose={onClose} title="選擇金手指" maxWidth="max-w-4xl">
      <QuirkPickerBody
        theme={theme}
        selectedName={selectedName}
        onPick={onPick}
        onClear={onClear}
        onClose={onClose}
      />
    </JRPGModal>
  );
}
