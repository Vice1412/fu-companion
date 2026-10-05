import React, { useMemo, useState } from 'react';
import {
  GiCookingPot,
  GiKnifeFork,
  GiMushroom,
  GiBookCover,
  GiDiceTwentyFacesTwenty,
  GiSaltShaker,
  GiPerspectiveDiceSixFacesRandom,
  GiTrashCan,
  GiCheckMark,
  GiScrollUnfurled
} from 'react-icons/gi';
import { renderTextWithAffinities } from '../../../../components/ui/FUIcon';
import {
  TASTES,
  TASTE_SHORT,
  TASTE_ROLL,
  ALL_TASTE_PAIRS,
  tastePairKey,
  parseTastePairKey,
  pairsFromTastes,
  ingredientCapacity,
  INGREDIENT_PRICE,
  DELICACY_EFFECTS,
  isConflictOnly,
  formatEffect,
  formatEffectSentence,
  unusedEffects,
  composeDelicacyText,
  findDuplicateEffects,
  cookbookProgress
} from '../../data/gourmetData';

/**
 * 美食家工坊（Gourmet Cookbook）
 *
 * ## 為什麼是專屬 UI
 *
 * 墳墓點／貿易點數／幸運數字是**單一數字**，記得住就好。
 * 美食家的食譜書是 **15 格程序化生成的效果**——每一格在戰役中骰出來後**永久固定**，
 * 而且**兩格不得有相同效果**。這種資料用文字描述根本無法在跑團時使用。
 *
 * ## 呈現設計（2026-10-04 依使用者回饋改版）
 *
 * - **食譜書改用 5×5 三角表格**：只畫上三角（含對角線）共 15 格，下三角是鏡像不重複畫。
 *   表頭用**單字**（苦／鹹／酸／甜／鮮），格子內只放**骰值數字**——因此每列最多 6 欄
 *   （1 個列首 + 5 格），在 360px 手機上每格仍有約 55px，不會擠。
 *   完整效果文字**不塞進格子**，改為「點格子 → 下方顯示」，這是解決小格子的關鍵。
 * - **食材可改名**：原書要求玩家自行命名，且常常是「先知道味道才想到名字」，
 *   故骰出後仍可隨時改。
 * - **烹飪可命名並複製全文**：產出通順的完整句子，直接貼給 GM／隊友。
 */

const TASTE_COLOR = {
  苦味: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  鹹味: 'bg-sky-50 border-sky-300 text-sky-900',
  酸味: 'bg-lime-50 border-lime-300 text-lime-900',
  甜味: 'bg-pink-50 border-pink-300 text-pink-900',
  鮮味: 'bg-amber-50 border-amber-300 text-amber-900'
};

const SUB_TABS = [
  { id: 'ingredients', label: '食材', Icon: GiMushroom },
  { id: 'cookbook', label: '食譜書', Icon: GiBookCover },
  { id: 'cook', label: '烹飪', Icon: GiKnifeFork }
];

/** 通用複製（含舊瀏覽器退路）。 */
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 落到退路 */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

export default function GourmetCookbook({ character, onChange, showToast = () => {} }) {
  const [subTab, setSubTab] = useState('ingredients');
  const [newName, setNewName] = useState('');
  const [newTaste, setNewTaste] = useState(TASTES[0]);
  const [renamingId, setRenamingId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [selectedPair, setSelectedPair] = useState(null);
  const [picked, setPicked] = useState([]);
  const [dishName, setDishName] = useState('');

  const data = character?.gourmetData || {};
  const ingredients = data.ingredients || [];
  const cookbook = data.cookbook || {};

  const gourmetClass = (character?.classes || []).find((c) => c.className === '美食家');
  const cookingSL = Math.max(
    0,
    Math.floor(Number((gourmetClass?.skills || []).find((s) => s.name === '烹飪')?.sl) || 0)
  );
  const capacity = ingredientCapacity(cookingSL);
  const level = Math.max(1, Math.floor(Number(character?.level) || 1));

  const duplicates = useMemo(() => findDuplicateEffects(cookbook), [cookbook]);
  const progress = cookbookProgress(cookbook);
  const remaining = useMemo(() => unusedEffects(cookbook, level), [cookbook, level]);

  const write = (patch) => {
    onChange({
      ...character,
      gourmetData: { ...data, ...patch },
      updatedAt: new Date().toISOString()
    });
  };

  if (cookingSL <= 0) return null;

  // ── 食材 ────────────────────────────────────────────────
  const addIngredient = (taste, name) => {
    if (ingredients.length >= capacity) {
      showToast(`食材已達上限（${capacity} 份），請先使用或丟棄`, 'warning');
      return;
    }
    const finalTaste = taste || TASTES[0];
    write({
      ingredients: [
        ...ingredients,
        {
          id: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: (name || '').trim() || `${TASTE_SHORT[finalTaste]}味食材`,
          taste: finalTaste
        }
      ]
    });
  };

  const removeIngredient = (id) => {
    write({ ingredients: ingredients.filter((i) => i.id !== id) });
    setPicked((p) => p.filter((x) => x !== id));
  };

  const commitRename = (id) => {
    const name = renameDraft.trim();
    if (name) {
      write({ ingredients: ingredients.map((i) => (i.id === id ? { ...i, name } : i)) });
    }
    setRenamingId(null);
    setRenameDraft('');
  };

  const rollIngredient = () => {
    const d6 = Math.floor(Math.random() * 6) + 1;
    const taste = TASTE_ROLL[d6];
    if (taste === null) {
      showToast('骰出 6：由你決定口味（請選口味後按新增）', 'info');
      return;
    }
    addIngredient(taste, newName);
    setNewName('');
    showToast(`骰出 ${d6}：【${taste}】`, 'success');
  };

  // ── 食譜書 ──────────────────────────────────────────────
  const rollPair = (key) => {
    const d12 = Math.floor(Math.random() * 12) + 1;
    const def = DELICACY_EFFECTS[d12];
    write({
      cookbook: { ...cookbook, [key]: { roll: d12, choice: def.choice ? def.choice.options[0] : null } }
    });
    showToast(`【${key}】骰出 ${d12}：${def.label}`, 'success');
  };

  const setPairChoice = (key, choice) => {
    const entry = cookbook[key];
    if (!entry) return;
    write({ cookbook: { ...cookbook, [key]: { ...entry, choice } } });
  };

  const clearPair = (key) => {
    const next = { ...cookbook };
    delete next[key];
    write({ cookbook: next });
  };

  // ── 烹飪 ────────────────────────────────────────────────
  const togglePick = (id) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        showToast('一次最多組合 3 份食材', 'warning');
        return prev;
      }
      return [...prev, id];
    });
  };

  const pickedIngredients = picked.map((id) => ingredients.find((i) => i.id === id)).filter(Boolean);
  const cookPairs = pairsFromTastes(pickedIngredients.map((i) => i.taste));
  const canCook = pickedIngredients.length >= 2;
  const dishText = composeDelicacyText(dishName, cookPairs, cookbook, level);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* 標題列 */}
      <div className="px-3.5 py-2.5 bg-[#f5efdf] border-b border-[#d6c7ab] flex items-center justify-between flex-wrap gap-2">
        <span className="font-bold text-sm text-[#3c2415] flex items-center gap-1.5">
          <GiCookingPot className="w-4 h-4 text-amber-700" />
          <span>美食家工坊</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg bg-white border border-[#d6c7ab] text-xs font-bold text-[#3c2415]">
            食材 <span className="text-base font-black">{ingredients.length}</span>
            <span className="text-[#6b5a4b]"> / {capacity}</span>
          </span>
          <span className="px-2 py-1 rounded-lg bg-white border border-[#d6c7ab] text-xs font-bold text-[#3c2415]">
            食譜 <span className="text-base font-black">{progress}</span>
            <span className="text-[#6b5a4b]"> / 15</span>
          </span>
        </div>
      </div>

      {/* 子分頁 */}
      <div className="flex border-b border-slate-200">
        {SUB_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`flex-1 px-3 py-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
              subTab === id ? 'bg-[#ebdcc4] text-[#3c2415]' : 'bg-white text-[#6b5a4b] hover:bg-[#f5efdf]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="p-3.5 space-y-3">
        {/* ══════════ 食材 ══════════ */}
        {subTab === 'ingredients' && (
          <>
            {/* d6 對照表——讓玩家在助手外也能擲骰 */}
            <div className="p-2.5 rounded-xl bg-[#f5efdf] border border-[#d6c7ab]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3c2415] mb-1.5">
                <GiPerspectiveDiceSixFacesRandom className="w-3.5 h-3.5 text-amber-700" />
                <span>取得食材時骰 d6 決定口味</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                {[1, 2, 3, 4, 5, 6].map((face) => (
                  <div
                    key={face}
                    className="flex items-center justify-center gap-1 px-1.5 py-1 rounded-lg bg-white border border-[#d6c7ab] text-[11px] font-bold text-[#3c2415]"
                  >
                    <span className="font-mono text-amber-700">{face}</span>
                    <span>{TASTE_ROLL[face] || '由你決定'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 新增食材 */}
            <div className="flex items-end gap-2 flex-wrap p-2.5 rounded-xl bg-white border border-[#d6c7ab]">
              <label className="flex flex-col gap-1 text-[11px] font-bold text-[#6b5a4b]">
                <span>名稱（可留空，之後仍可改）</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例：石化蜂蜜"
                  className="w-36 px-2 py-1 rounded-lg border border-[#d6c7ab] bg-white text-xs text-[#3c2415]"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-bold text-[#6b5a4b]">
                <span>口味</span>
                <select
                  value={newTaste}
                  onChange={(e) => setNewTaste(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-[#d6c7ab] bg-white text-xs text-[#3c2415] cursor-pointer"
                >
                  {TASTES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={rollIngredient}
                title="骰 d6 決定口味"
                className="px-2.5 py-1.5 rounded-lg border border-amber-400 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-900 flex items-center gap-1 cursor-pointer"
              >
                <GiPerspectiveDiceSixFacesRandom className="w-3.5 h-3.5" />
                <span>骰 d6 取得</span>
              </button>
              <button
                type="button"
                onClick={() => { addIngredient(newTaste, newName); setNewName(''); }}
                className="px-2.5 py-1.5 rounded-lg border border-[#d6c7ab] bg-white hover:bg-[#ebdcc4] text-[11px] font-bold text-[#6b5a4b] cursor-pointer"
              >
                直接新增
              </button>
            </div>

            <p className="text-[10px] text-[#6b5a4b] font-mono">
              購買：隨機口味 {INGREDIENT_PRICE.random}z／自選口味 {INGREDIENT_PRICE.chosen}z
              ・休息於定居點可獲 {cookingSL} 份
            </p>

            {ingredients.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">尚無食材</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs ${TASTE_COLOR[ing.taste] || 'bg-slate-50 border-slate-200'}`}
                  >
                    <GiMushroom className="w-3.5 h-3.5 shrink-0" />
                    {renamingId === ing.id ? (
                      <>
                        <input
                          type="text"
                          autoFocus
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(ing.id);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="flex-1 min-w-0 px-1.5 py-0.5 rounded border border-current bg-white text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => commitRename(ing.id)}
                          title="確定"
                          className="shrink-0 cursor-pointer"
                        >
                          <GiCheckMark className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => { setRenamingId(ing.id); setRenameDraft(ing.name); }}
                          title="點擊改名"
                          className="font-bold truncate flex-1 text-left cursor-pointer hover:underline"
                        >
                          {ing.name}
                        </button>
                        <span className="text-[10px] font-mono shrink-0 opacity-80">{ing.taste}</span>
                        <button
                          type="button"
                          onClick={() => removeIngredient(ing.id)}
                          title="丟棄"
                          className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
                        >
                          <GiTrashCan className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════ 食譜書 ══════════ */}
        {subTab === 'cookbook' && (
          <>
            {duplicates.length > 0 && (
              <div className="px-2.5 py-2 rounded-lg bg-red-50 border border-red-300 text-[11px] text-red-900 font-bold">
                規則衝突：以下組合產生了相同效果。原書要求每個組合效果皆不相同，請改選其他選項或重骰。
                {duplicates.map((keys, i) => (
                  <span key={i} className="block font-mono">{keys.join('　／　')}</span>
                ))}
              </div>
            )}

            {/* 5×5 三角表格 */}
            <div>
              <div className="text-[11px] font-bold text-[#3c2415] mb-1.5">
                點格子看效果（數字＝該組合骰出的 d12）
              </div>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: 'auto repeat(5, minmax(0, 1fr))' }}
              >
                {/* 表頭列 */}
                <div />
                {TASTES.map((t) => (
                  <div key={`h_${t}`} className="text-center text-[11px] font-bold text-[#6b5a4b] pb-0.5">
                    {TASTE_SHORT[t]}
                  </div>
                ))}

                {/* 三角內容 */}
                {TASTES.map((rowTaste, r) => {
                  const cells = [];
                  cells.push(
                    <div
                      key={`rh_${rowTaste}`}
                      className="flex items-center text-[11px] font-bold text-[#6b5a4b] pr-1"
                    >
                      {TASTE_SHORT[rowTaste]}
                    </div>
                  );
                  // 下三角留空
                  for (let s = 0; s < r; s += 1) {
                    cells.push(<div key={`sp_${rowTaste}_${s}`} />);
                  }
                  // 上三角（含對角線）
                  for (let c = r; c < TASTES.length; c += 1) {
                    const key = tastePairKey(rowTaste, TASTES[c]);
                    const entry = cookbook[key];
                    const on = selectedPair === key;
                    cells.push(
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedPair(on ? null : key)}
                        title={key}
                        className={`h-11 rounded-lg border text-[13px] font-black transition-all cursor-pointer ${
                          on
                            ? 'ring-2 ring-amber-500 '
                            : ''
                        }${
                          entry?.roll
                            ? 'bg-[#ebdcc4] border-[#c9b48f] text-[#3c2415]'
                            : 'bg-slate-50 border-slate-200 text-slate-300'
                        }`}
                      >
                        {entry?.roll ? entry.roll : '·'}
                      </button>
                    );
                  }
                  return cells;
                })}
              </div>
            </div>

            {/* 選中格子的詳情 */}
            {selectedPair && (
              <div className="p-2.5 rounded-xl bg-[#f5efdf] border border-[#d6c7ab] space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#3c2415]">{selectedPair}</span>
                  {cookbook[selectedPair]?.roll ? (
                    <button
                      type="button"
                      onClick={() => clearPair(selectedPair)}
                      className="text-[10px] font-mono text-[#6b5a4b] hover:text-red-700 cursor-pointer"
                    >
                      重設此格
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => rollPair(selectedPair)}
                      className="px-2 py-0.5 rounded border border-amber-400 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-900 flex items-center gap-1 cursor-pointer"
                    >
                      <GiDiceTwentyFacesTwenty className="w-3 h-3" />
                      <span>骰 d12</span>
                    </button>
                  )}
                </div>

                {cookbook[selectedPair]?.roll ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-amber-800">
                        {cookbook[selectedPair].roll}
                      </span>
                      <span className="text-xs text-[#3c2415]">
                        {renderTextWithAffinities(
                          formatEffect(cookbook[selectedPair].roll, cookbook[selectedPair].choice, level)
                        )}
                      </span>
                      {isConflictOnly(cookbook[selectedPair].roll) && (
                        <span className="text-[9px] font-mono text-[#6b5a4b]">僅衝突場景</span>
                      )}
                    </div>
                    {DELICACY_EFFECTS[cookbook[selectedPair].roll]?.choice && (
                      <label className="flex items-center gap-2 text-[11px] font-bold text-[#6b5a4b]">
                        <span>
                          選擇{DELICACY_EFFECTS[cookbook[selectedPair].roll].choice.label}
                        </span>
                        <select
                          value={cookbook[selectedPair].choice || ''}
                          onChange={(e) => setPairChoice(selectedPair, e.target.value)}
                          className="px-1.5 py-0.5 rounded border border-[#d6c7ab] bg-white text-[11px] text-[#3c2415] cursor-pointer"
                        >
                          {DELICACY_EFFECTS[cookbook[selectedPair].roll].choice.options.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    尚未決定。首次使用這個組合時骰 d12，之後永久固定。
                  </p>
                )}
              </div>
            )}

            {/* 尚未骰出的效果 */}
            <div className="p-2.5 rounded-xl bg-white border border-[#d6c7ab]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3c2415] mb-1.5">
                <GiScrollUnfurled className="w-3.5 h-3.5 text-amber-700" />
                <span>尚未骰出的效果（{remaining.length} / 12）</span>
              </div>
              {remaining.length === 0 ? (
                <p className="text-[11px] text-emerald-700 font-bold">12 種效果全部用上了。</p>
              ) : (
                <div className="space-y-1">
                  {remaining.map((e) => (
                    <div key={e.roll} className="flex items-start gap-2 text-[11px]">
                      <span className="font-mono font-black text-amber-800 w-5 shrink-0 text-right">{e.roll}</span>
                      <span className="text-[#3c2415]">
                        {renderTextWithAffinities(e.text)}
                        {isConflictOnly(e.roll) && (
                          <span className="text-[9px] font-mono text-[#6b5a4b] ml-1">僅衝突場景</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[#6b5a4b] font-mono mt-1.5">
                原書要求每個組合效果不得重複，故這份清單即「還能骰出什麼」。
              </p>
            </div>
          </>
        )}

        {/* ══════════ 烹飪 ══════════ */}
        {subTab === 'cook' && (
          <>
            <div className="text-[11px] font-bold text-[#6b5a4b]">
              選擇 2～3 份食材（已選 {pickedIngredients.length} 份）
            </div>
            {ingredients.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">尚無食材可組合</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ingredients.map((ing) => {
                  const on = picked.includes(ing.id);
                  return (
                    <button
                      key={ing.id}
                      type="button"
                      onClick={() => togglePick(ing.id)}
                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-left ${
                        on
                          ? 'ring-2 ring-amber-500 ' + (TASTE_COLOR[ing.taste] || '')
                          : TASTE_COLOR[ing.taste] || 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="block truncate">{ing.name}</span>
                      <span className="block text-[10px] font-mono opacity-80">{ing.taste}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {canCook && (
              <div className="p-2.5 rounded-xl bg-[#f5efdf] border border-[#d6c7ab] space-y-2">
                <label className="flex flex-col gap-1 text-[11px] font-bold text-[#6b5a4b]">
                  <span>這份美食的名字</span>
                  <input
                    type="text"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="例：石化蜂蜜燉菇"
                    className="px-2 py-1 rounded-lg border border-[#d6c7ab] bg-white text-xs text-[#3c2415]"
                  />
                </label>

                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3c2415]">
                  <GiSaltShaker className="w-3.5 h-3.5 text-amber-700" />
                  <span>完整效果（{cookPairs.length} 項）</span>
                </div>

                <div className="space-y-1.5">
                  {cookPairs.map((key) => {
                    const entry = cookbook[key];
                    const [a, b] = parseTastePairKey(key);
                    return (
                      <div key={key} className="flex items-start gap-2 text-[11px] flex-wrap">
                        <span className="font-bold text-[#3c2415] w-24 shrink-0">{a}＋{b}</span>
                        {entry?.roll ? (
                          <span className="text-[#3c2415] flex-1 min-w-[9rem]">
                            {renderTextWithAffinities(
                              formatEffectSentence(entry.roll, entry.choice, level)
                            )}
                            {isConflictOnly(entry.roll) && (
                              <span className="text-[9px] font-mono text-[#6b5a4b] ml-1">（僅衝突場景）</span>
                            )}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => rollPair(key)}
                            className="px-2 py-0.5 rounded border border-amber-400 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-900 flex items-center gap-1 cursor-pointer"
                          >
                            <GiDiceTwentyFacesTwenty className="w-3 h-3" />
                            <span>尚未記錄，骰 d12</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 可複製的全文 */}
                <div className="p-2 rounded-lg bg-white border border-[#d6c7ab]">
                  <pre className="text-[11px] text-[#3c2415] whitespace-pre-wrap font-sans leading-relaxed m-0">
                    {dishText}
                  </pre>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(dishText);
                    showToast(ok ? '已複製美食效果' : '複製失敗，請手動選取', ok ? 'success' : 'warning');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  複製這份美食的完整效果
                </button>

                {cookPairs.length > 1 && (
                  <p className="text-[10px] text-[#6b5a4b] font-mono">
                    效果可自行決定生效順序，也可放棄任意項（對所有目標必須一致）。
                  </p>
                )}
              </div>
            )}
            {!canCook && ingredients.length > 0 && (
              <p className="text-[11px] text-slate-400 text-center">請至少選擇 2 份食材</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
