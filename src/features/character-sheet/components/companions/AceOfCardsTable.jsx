import React, { useMemo, useState } from 'react';
import {
  GiCardPlay,
  GiCardRandom,
  GiCardPickup,
  GiCardDiscard,
  GiScrollUnfurled,
  GiHazardSign,
  GiCheckMark,
  GiDiceTwentyFacesTwenty
} from 'react-icons/gi';
import { renderTextWithAffinities } from '../../../../components/ui/FUIcon';
import {
  SUITS,
  SUIT_KEYS,
  DECK_SIZE,
  STARTING_HAND,
  MAX_VANGUARD,
  createDeck,
  shuffle,
  drawCards,
  cardLabel,
  suitByKey,
  detectSets,
  maxSetSizeForSL,
  mpCostForSet,
  maxMpForSL
} from '../../data/aceOfCardsData';

/**
 * 卡牌大師牌桌（Ace of Cards Table）
 *
 * ## 為什麼需要這個元件
 *
 * 這是全專案最複雜的職業：需要一整套**牌組狀態**（牌庫／手牌／棄牌堆／先鋒卡），
 * 而組合效果是**精確比對**的（4 張同值才算滿貫，5 張不算）。用文字描述完全無法在跑團時使用。
 *
 * ## 規則要點（原書特典合輯 p.7–p.11）
 *
 * - 牌組恰好 30 張；衝突開始洗牌抽 5 張；衝突結束全部洗回
 * - 4 個花色各對應一種傷害類型（玩家建立角色時指定）
 * - 結算：花 `張數 × 5` MP（上限 `10 + SL×5`）→ 從手牌打出該張數構成一組 → 結算後補抽等量
 * - 同時符合多個效果時**只能選一個**
 * - 牌庫不足時把棄牌堆洗回（`drawCards` 已處理）
 */

const T = {
  bg: 'bg-[#f5efdf]',
  border: 'border-[#d6c7ab]',
  text: 'text-[#3c2415]',
  sub: 'text-[#6b5a4b]'
};

/** 傷害類型選項（原書 p.9 建議：風(♦)、土(♣)、火(♥)、冰(♠)）。 */
const DAMAGE_TYPES = ['風', '土', '火', '冰'];

/** 花色 → 顏色（用於牌面辨識，非裝飾）。 */
const SUIT_STYLE = {
  diamond: 'bg-red-50 border-red-300 text-red-900',
  heart: 'bg-red-50 border-red-300 text-red-900',
  club: 'bg-slate-100 border-slate-400 text-slate-900',
  spade: 'bg-slate-100 border-slate-400 text-slate-900'
};

export default function AceOfCardsTable({ character, onChange, onConsumeMp = () => {}, showToast = () => {} }) {
  const data = character?.aceOfCards || {};
  const suitTypes = data.suitTypes || Object.fromEntries(SUITS.map((s) => [s.key, s.defaultType]));
  const deck = data.deck || [];
  const hand = data.hand || [];
  const discard = data.discard || [];
  const vanguard = data.vanguard || [];

  const [picked, setPicked] = useState([]);
  const [chosenEffect, setChosenEffect] = useState(null);

  const aceClass = (character?.classes || []).find((c) => c.className === '卡牌大師');
  const magicCardsSL = Math.max(
    0,
    Math.floor(Number((aceClass?.skills || []).find((s) => s.name === '魔力套牌')?.sl) || 0)
  );
  const level = Math.max(1, Math.floor(Number(character?.level) || 1));
  const knownHeroicSkills = useMemo(
    () => (character?.heroicSkills || []).map((h) => (typeof h === 'string' ? h : h?.name)).filter(Boolean),
    [character?.heroicSkills]
  );

  const write = (patch) => {
    onChange({
      ...character,
      aceOfCards: { ...data, ...patch },
      updatedAt: new Date().toISOString()
    });
  };

  // 未習得【魔力套牌】就完全不渲染
  if (magicCardsSL <= 0) return null;

  const inConflict = deck.length > 0 || hand.length > 0 || discard.length > 0;
  const maxCards = maxSetSizeForSL(magicCardsSL);
  const mpCap = maxMpForSL(magicCardsSL);

  const pickedCards = picked.map((id) => hand.find((c) => c.id === id)).filter(Boolean);
  const matches = detectSets(pickedCards, level, { knownHeroicSkills });
  const effective = matches.find((m) => m.id === chosenEffect) || matches[0] || null;
  const mpCost = mpCostForSet(pickedCards.length);
  const canResolve =
    pickedCards.length >= 2 && pickedCards.length <= maxCards && !!effective && mpCost <= (character?.currentMp ?? 0);

  // ── 動作 ────────────────────────────────────────────────
  const startConflict = () => {
    const fresh = shuffle(createDeck());
    const r = drawCards(fresh, [], STARTING_HAND);
    write({ deck: r.deck, hand: r.drawn, discard: [], vanguard: [] });
    setPicked([]);
    setChosenEffect(null);
    showToast(`衝突開始：洗牌 30 張，抽 ${STARTING_HAND} 張`, 'success');
  };

  const endConflict = () => {
    write({ deck: createDeck(), hand: [], discard: [], vanguard: [] });
    setPicked([]);
    setChosenEffect(null);
    showToast('衝突結束：30 張全部洗回牌庫', 'info');
  };

  const togglePick = (id) => {
    setChosenEffect(null);
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxCards) {
        showToast(`目前最多只能結算 ${maxCards} 張（SL ${magicCardsSL}）`, 'warning');
        return prev;
      }
      return [...prev, id];
    });
  };

  /** 結算一組：付出 MP → 打出選取的牌 → 補抽等量。 */
  const resolveSet = () => {
    if (!canResolve) return;
    const ids = new Set(picked.map((x) => x));
    const played = hand.filter((c) => ids.has(c.id));
    const rest = hand.filter((c) => !ids.has(c.id));
    const r = drawCards(deck, [...discard, ...played], played.length);
    write({ deck: r.deck, discard: r.discard, hand: [...rest, ...r.drawn] });
    onConsumeMp(mpCost);
    showToast(`結算【${effective.name}】——花費 ${mpCost} MP，補抽 ${r.drawn.length} 張`, 'success');
    setPicked([]);
    setChosenEffect(null);
  };

  /** 再調度：命中敵人後棄 N 抽 N。 */
  const doMulligan = (n) => {
    const mulliganSL = Math.max(
      0,
      Math.floor(Number((aceClass?.skills || []).find((s) => s.name === '再調度')?.sl) || 0)
    );
    const limit = Math.min(mulliganSL + 1, hand.length);
    if (limit <= 0) {
      showToast('沒有【再調度】技能或手牌不足', 'warning');
      return;
    }
    const take = Math.min(n, limit);
    const removed = hand.slice(0, take);
    const rest = hand.slice(take);
    const r = drawCards(deck, [...discard, ...removed], take);
    write({ deck: r.deck, discard: r.discard, hand: [...rest, ...r.drawn] });
    showToast(`再調度：棄 ${take} 張、抽 ${take} 張`, 'success');
  };

  // ── 顯示 ────────────────────────────────────────────────
  const renderCard = (card, selectable = true) => {
    const on = picked.includes(card.id);
    const base = card.joker
      ? 'bg-amber-100 border-amber-400 text-amber-900'
      : SUIT_STYLE[card.suit] || 'bg-white border-slate-300';
    const type = !card.joker && suitTypes[card.suit] ? suitTypes[card.suit] : null;
    return (
      <button
        key={card.id}
        type="button"
        disabled={!selectable}
        onClick={() => selectable && togglePick(card.id)}
        title={type ? `${cardLabel(card)}（${type}）` : cardLabel(card)}
        className={`px-1.5 py-2 rounded-lg border-2 text-[11px] font-bold leading-tight transition-all ${
          selectable ? 'cursor-pointer' : 'cursor-default'
        } ${base} ${on ? 'ring-2 ring-amber-500 -translate-y-1' : ''}`}
      >
        <span className="block text-[13px] font-black">{card.joker ? '鬼' : card.value}</span>
        <span className="block text-[10px] font-mono opacity-80">
          {card.joker ? '牌' : suitByKey(card.suit)?.symbol}
        </span>
        {type && <span className="block text-[9px] opacity-70">{type}</span>}
      </button>
    );
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* 標題列 */}
      <div className={`px-3.5 py-2.5 ${T.bg} border-b ${T.border} flex items-center justify-between flex-wrap gap-2`}>
        <span className={`font-bold text-sm ${T.text} flex items-center gap-1.5`}>
          <GiCardPlay className="w-4 h-4 text-amber-700" />
          <span>卡牌大師牌桌</span>
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-1 rounded-lg bg-white border ${T.border} text-xs font-bold ${T.text}`}>
            牌庫 <span className="text-base font-black">{deck.length}</span>
            <span className={T.sub}> / {DECK_SIZE}</span>
          </span>
          <span className={`px-2 py-1 rounded-lg bg-white border ${T.border} text-xs font-bold ${T.text}`}>
            手牌 <span className="text-base font-black">{hand.length}</span>
          </span>
          <span className={`px-2 py-1 rounded-lg bg-white border ${T.border} text-xs font-bold ${T.text}`}>
            棄牌 <span className="text-base font-black">{discard.length}</span>
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* 花色對應 */}
        <div className={`p-2.5 rounded-xl ${T.bg} border ${T.border}`}>
          <div className={`text-[11px] font-bold ${T.text} mb-1.5`}>
            花色對應傷害類型（建立角色時指定，之後固定）
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {SUITS.map((s) => (
              <label key={s.key} className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className={T.text}>{s.name}</span>
                <span className={`font-mono ${T.sub}`}>{s.symbol}</span>
                <select
                  value={suitTypes[s.key] || s.defaultType}
                  onChange={(e) => write({ suitTypes: { ...suitTypes, [s.key]: e.target.value } })}
                  className={`flex-1 px-1 py-0.5 rounded border ${T.border} bg-white text-[11px] ${T.text} cursor-pointer`}
                >
                  {DAMAGE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>

        {/* 衝突控制 */}
        {!inConflict ? (
          <button
            type="button"
            onClick={startConflict}
            className="w-full px-3 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <GiCardRandom className="w-4 h-4" />
            <span>衝突開始：洗牌 30 張並抽 {STARTING_HAND} 張</span>
          </button>
        ) : (
          <>
            {/* 手牌 */}
            <div>
              <div className={`flex items-center justify-between gap-2 mb-1.5`}>
                <span className={`text-[11px] font-bold ${T.text} flex items-center gap-1.5`}>
                  <GiCardPickup className="w-3.5 h-3.5 text-amber-700" />
                  <span>手牌（點擊選取，最多 {maxCards} 張）</span>
                </span>
                <span className={`text-[10px] font-mono ${T.sub}`}>
                  已選 {pickedCards.length} 張 / 需 {mpCost} MP（上限 {mpCap}）
                </span>
              </div>
              {hand.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-3">手牌已空</p>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                  {hand.map((c) => renderCard(c))}
                </div>
              )}
            </div>

            {/* 符合的效果 */}
            {pickedCards.length >= 2 && (
              <div className={`p-2.5 rounded-xl border ${matches.length > 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
                <div className="flex items-center gap-1.5 text-[11px] font-bold mb-1.5">
                  {matches.length > 0 ? (
                    <GiCheckMark className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <GiHazardSign className="w-3.5 h-3.5 text-red-700" />
                  )}
                  <span className={matches.length > 0 ? 'text-emerald-900' : 'text-red-900'}>
                    {matches.length === 0
                      ? '這組牌不符合任何效果'
                      : matches.length === 1
                        ? '符合一個效果'
                        : `符合 ${matches.length} 個效果——只能選一個套用`}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {matches.map((m) => {
                    const on = (chosenEffect || matches[0]?.id) === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setChosenEffect(m.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                          on ? 'bg-white border-emerald-500 ring-2 ring-emerald-400' : 'bg-white/60 border-emerald-200'
                        }`}
                      >
                        <span className="font-bold text-[#3c2415]">{m.name}</span>
                        <span className={`font-mono text-[10px] ${T.sub} ml-1`}>（{m.requirement}）</span>
                        <span className="block text-[#3c2415] mt-0.5">
                          {renderTextWithAffinities(m.describe)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 結算 */}
            <button
              type="button"
              disabled={!canResolve}
              onClick={resolveSet}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 ${
                canResolve
                  ? 'bg-amber-700 hover:bg-amber-800 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <GiDiceTwentyFacesTwenty className="w-4 h-4" />
              <span>
                {canResolve
                  ? `結算【${effective.name}】——花費 ${mpCost} MP`
                  : pickedCards.length < 2
                    ? '請至少選 2 張牌'
                    : !effective
                      ? '這組牌不符合任何效果'
                      : mpCost > (character?.currentMp ?? 0)
                        ? `MP 不足（需 ${mpCost}，現有 ${character?.currentMp ?? 0}）`
                        : '無法結算'}
              </span>
            </button>

            {/* 其他動作 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => doMulligan(1)}
                className={`px-2.5 py-1.5 rounded-lg border ${T.border} bg-white hover:bg-[#ebdcc4] text-[11px] font-bold ${T.sub} cursor-pointer`}
              >
                再調度（棄 1 抽 1）
              </button>
              <button
                type="button"
                onClick={endConflict}
                className={`px-2.5 py-1.5 rounded-lg border ${T.border} bg-white hover:bg-[#ebdcc4] text-[11px] font-bold ${T.sub} cursor-pointer`}
              >
                衝突結束（全部洗回）
              </button>
            </div>

            {/* 棄牌堆 */}
            {discard.length > 0 && (
              <div>
                <div className={`text-[11px] font-bold ${T.text} mb-1 flex items-center gap-1.5`}>
                  <GiCardDiscard className="w-3.5 h-3.5 text-amber-700" />
                  <span>棄牌堆（{discard.length} 張，順序不可改，任何人可查看）</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {discard.map((c) => (
                    <span
                      key={c.id}
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                        c.joker ? 'bg-amber-100 border-amber-400 text-amber-900' : SUIT_STYLE[c.suit] || 'bg-white border-slate-300'
                      }`}
                    >
                      {c.joker ? '鬼牌' : `${suitByKey(c.suit)?.symbol}${c.value}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {vanguard.length > 0 && (
              <div className={`text-[10px] font-mono ${T.sub}`}>
                先鋒卡 {vanguard.length} / {MAX_VANGUARD} 張
              </div>
            )}
          </>
        )}

        {/* 效果速查 */}
        <details className={`p-2.5 rounded-xl bg-white border ${T.border}`}>
          <summary className={`text-[11px] font-bold ${T.text} cursor-pointer flex items-center gap-1.5`}>
            <GiScrollUnfurled className="w-3.5 h-3.5 text-amber-700" />
            <span>組合效果速查（8 種）</span>
          </summary>
          <div className="mt-2 space-y-1">
            {SUIT_KEYS.length > 0 && (
              <p className={`text-[10px] font-mono ${T.sub}`}>
                推薦花色對應：風(♦)、土(♣)、火(♥)、冰(♠)
              </p>
            )}
            <div className={`text-[10px] font-mono ${T.sub}`}>
              炫目同花／雙重麻煩／魔法同花：L20+ 額外 10 傷害、L40+ 額外 20 傷害
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
