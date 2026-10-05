import React, { useMemo, useState } from 'react';
import {
  GiCookingPot,
  GiKnifeFork,
  GiMushroom,
  GiBookCover,
  GiDiceTwentyFacesTwenty,
  GiSaltShaker,
  GiPerspectiveDiceSixFacesRandom,
  GiTrashCan
} from 'react-icons/gi';
import { renderTextWithAffinities } from '../../../../components/ui/FUIcon';
import {
  TASTES,
  TASTE_ROLL,
  ALL_TASTE_PAIRS,
  parseTastePairKey,
  pairsFromTastes,
  ingredientCapacity,
  INGREDIENT_PRICE,
  DELICACY_EFFECTS,
  isConflictOnly,
  formatEffect,
  findDuplicateEffects,
  cookbookProgress
} from '../../data/gourmetData';

/**
 * 美食家工坊（Gourmet Cookbook）
 *
 * ## 為什麼是專屬 UI，而不是像墳墓點那樣的一行計數器
 *
 * 墳墓點／貿易點數／幸運數字是**單一數字**，記得住就好。
 * 美食家不同——它的食譜書是 **15 格程序化生成的效果**，每一格在戰役中骰出來後**永久固定**，
 * 而且**兩格不得有相同效果**。這種資料用文字描述根本無法在跑團時使用。
 * 這與修補匠工坊、植物學家花園盤同級，故放在「職業特技」分頁。
 *
 * 資料與規則見 `data/gourmetData.js`（機制逐條核對原書 p.149–153）。
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

export default function GourmetCookbook({ character, onChange, showToast = () => {} }) {
  const [subTab, setSubTab] = useState('ingredients');
  const [newName, setNewName] = useState('');
  const [newTaste, setNewTaste] = useState(TASTES[0]);
  const [picked, setPicked] = useState([]); // 烹飪時選中的食材 id

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

  const write = (patch) => {
    onChange({
      ...character,
      gourmetData: { ...data, ...patch },
      updatedAt: new Date().toISOString()
    });
  };

  // 沒有【烹飪】技能就完全不渲染（未習得時整組機制不存在）
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
          name: (name || '').trim() || `${finalTaste}食材`,
          taste: finalTaste
        }
      ]
    });
  };

  const removeIngredient = (id) => {
    write({ ingredients: ingredients.filter((i) => i.id !== id) });
    setPicked((p) => p.filter((x) => x !== id));
  };

  const rollIngredient = () => {
    const d6 = Math.floor(Math.random() * 6) + 1;
    const taste = TASTE_ROLL[d6];
    if (taste === null) {
      showToast('骰出 6：由你決定口味', 'info');
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

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* 標題列 */}
      <div className="px-3.5 py-2.5 bg-[#f5efdf] border-b border-[#d6c7ab] flex items-center justify-between flex-wrap gap-2">
        <span className="font-bold text-sm text-[#3c2415] flex items-center gap-1.5">
          <GiCookingPot className="w-4 h-4 text-amber-700" />
          <span>美食家工坊</span>
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[#6b5a4b]">
          <span>
            食材 <b className="text-[#3c2415]">{ingredients.length}</b> / {capacity}
          </span>
          <span>
            食譜 <b className="text-[#3c2415]">{progress}</b> / 15
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
              subTab === id
                ? 'bg-[#ebdcc4] text-[#3c2415]'
                : 'bg-white text-[#6b5a4b] hover:bg-[#f5efdf]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="p-3.5 space-y-3">
        {/* ────────── 食材 ────────── */}
        {subTab === 'ingredients' && (
          <>
            <div className="flex items-end gap-2 flex-wrap p-2.5 rounded-xl bg-[#f5efdf] border border-[#d6c7ab]">
              <label className="flex flex-col gap-1 text-[11px] font-bold text-[#6b5a4b]">
                <span>名稱（可留空）</span>
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
                title="骰 d6 決定口味（1苦 2鹹 3酸 4甜 5鮮 6由你決定）"
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
                    <span className="font-bold truncate flex-1">{ing.name}</span>
                    <span className="text-[10px] font-mono shrink-0">{ing.taste}</span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(ing.id)}
                      title="丟棄"
                      className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      <GiTrashCan className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ────────── 食譜書 ────────── */}
        {subTab === 'cookbook' && (
          <>
            {duplicates.length > 0 && (
              <div className="px-2.5 py-2 rounded-lg bg-red-50 border border-red-300 text-[11px] text-red-900 font-bold">
                規則衝突：以下組合產生了相同效果，原書要求每個組合效果皆不相同，請改選其他選項或重骰。
                {duplicates.map((keys, i) => (
                  <span key={i} className="block font-mono">{keys.join('　／　')}</span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 gap-1.5">
              {ALL_TASTE_PAIRS.map((key) => {
                const entry = cookbook[key];
                const [a, b] = parseTastePairKey(key);
                const def = entry?.roll ? DELICACY_EFFECTS[entry.roll] : null;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[#d6c7ab] bg-[#f5efdf] flex-wrap"
                  >
                    <span className="text-[11px] font-bold text-[#3c2415] shrink-0 w-28">
                      {a}＋{b}
                    </span>
                    {def ? (
                      <>
                        <span className="text-[11px] text-[#3c2415] flex-1 min-w-[10rem]">
                          <b className="font-mono mr-1">{entry.roll}</b>
                          {renderTextWithAffinities(formatEffect(entry.roll, entry.choice, level))}
                        </span>
                        {def.choice && (
                          <select
                            value={entry.choice || ''}
                            onChange={(e) => setPairChoice(key, e.target.value)}
                            className="px-1.5 py-0.5 rounded border border-[#d6c7ab] bg-white text-[11px] text-[#3c2415] cursor-pointer"
                          >
                            {def.choice.options.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        )}
                        {isConflictOnly(entry.roll) && (
                          <span className="text-[9px] font-mono text-[#6b5a4b] shrink-0">僅衝突</span>
                        )}
                        <button
                          type="button"
                          onClick={() => clearPair(key)}
                          title="重骰（清除記錄）"
                          className="shrink-0 text-[10px] font-mono text-[#6b5a4b] hover:text-red-700 cursor-pointer"
                        >
                          重設
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] text-slate-400 flex-1">未決定</span>
                        <button
                          type="button"
                          onClick={() => rollPair(key)}
                          className="px-2 py-0.5 rounded border border-amber-400 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-900 flex items-center gap-1 cursor-pointer"
                        >
                          <GiDiceTwentyFacesTwenty className="w-3 h-3" />
                          <span>骰 d12</span>
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-[#6b5a4b] font-mono">
              原書 p.153：每組首次使用時骰 d12 決定效果，之後永久固定；15 格全滿即完成食譜。
            </p>
          </>
        )}

        {/* ────────── 烹飪 ────────── */}
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
                        on ? 'ring-2 ring-amber-500 ' + (TASTE_COLOR[ing.taste] || '') : TASTE_COLOR[ing.taste] || 'bg-slate-50 border-slate-200'
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
              <div className="p-2.5 rounded-xl bg-[#f5efdf] border border-[#d6c7ab] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3c2415]">
                  <GiSaltShaker className="w-3.5 h-3.5 text-amber-700" />
                  <span>這份美食的效果（{cookPairs.length} 項）</span>
                </div>
                {cookPairs.map((key) => {
                  const entry = cookbook[key];
                  const [a, b] = parseTastePairKey(key);
                  return (
                    <div key={key} className="flex items-center gap-2 text-[11px] flex-wrap">
                      <span className="font-bold text-[#3c2415] w-28 shrink-0">{a}＋{b}</span>
                      {entry?.roll ? (
                        <span className="text-[#3c2415] flex-1">
                          {renderTextWithAffinities(formatEffect(entry.roll, entry.choice, level))}
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
