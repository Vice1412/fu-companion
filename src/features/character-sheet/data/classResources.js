/**
 * 職業資源池（Class Resource Pools）
 *
 * 這些是**跨場景累積、有上限、玩家必須記住**的計數器——屬於「動態狀態」類技能
 * （見 `docs/skill-coverage.md` 的 T3 分類）。它們不是「要去操作的工具」，
 * 而是「不能忘記的計數器」，因此渲染在跑團卡的常駐資源區，而非職業分頁。
 *
 * 本檔所有數值皆逐條核對官方英文原書（依 `GEMINI.md` 規則二.4）：
 *
 * | 資源 | 職業 | 上限／初始 | 官方原文出處 |
 * |---|---|---|---|
 * | 墳墓點 | 死靈術士 | `SL + 1` | Bonus Collection **p.13**：「You may never have more than (SL + 1) Grave Points」 |
 * | 貿易點數 | 商人 | `SL + 3` | Natural Fantasy **p.159**：「You may never have more than (SL + 3) Trade Points」 |
 * | 幸運數字 | 熵師 | 起始 `7` | Core **p.191**：「at the start of each session, that number is 7」 |
 *
 * **頁碼偏移因書而異**（Core +2、Bonus 0），上表皆為**印刷頁碼**。
 */

/**
 * 職業資源定義。新增資源時只需在此加一筆——UI 會自動長出來。
 *
 * `kind`：
 * - `pool`  —— `0 ~ max` 的資源池，可增減、可清空
 * - `value` —— 單一數值（非池），可設定、可重置為初始值
 */
export const CLASS_RESOURCES = [
  {
    id: 'gravePoints',
    kind: 'pool',
    className: '死靈術士',
    skillName: '超越死界',
    label: '墳墓點',
    maxFromSL: (sl) => sl + 1,
    // 原書有明確的清空時機（HP 歸零），故按鈕直接對應那個事件，而不是泛用「清空」。
    resetLabel: 'HP 歸零',
    resetTo: 0,
    hint: '上限 SL+1',
    source: 'Bonus Collection p.13',
  },
  {
    id: 'tradePoints',
    kind: 'pool',
    className: '商人',
    skillName: '貿易之風',
    label: '貿易點數',
    maxFromSL: (sl) => sl + 3,
    // 原書沒有「清空貿易點數」的規則——點數只會被花掉，不會被清掉。
    // 故不提供重置按鈕，避免暗示不存在的規則。
    resetLabel: null,
    resetTo: null,
    hint: '上限 SL+3',
    source: 'Natural Fantasy p.159',
  },
  {
    id: 'luckyNumber',
    kind: 'value',
    className: '熵師',
    skillName: '幸運七',
    label: '幸運數字',
    initial: 7,
    // 原書：每次聚會開始時該數字為 7。
    resetLabel: '歸 7',
    resetTo: 7,
    hint: '每次聚會開始時為 7',
    source: 'Core p.191',
  },
];

/** 取得角色某職業某技能的 SL；沒有該職業或該技能時回傳 0。 */
export const getSkillSL = (character, className, skillName) => {
  const cls = (character?.classes || []).find((c) => c.className === className);
  if (!cls) return 0;
  const skill = (cls.skills || []).find((s) => s.name === skillName);
  return Math.max(0, Math.floor(Number(skill?.sl) || 0));
};

/**
 * 取得該角色「實際啟用」的職業資源清單（含各自的 max／初始值）。
 * 沒有對應職業、或該技能 SL 為 0 者不會出現——避免對其他角色造成噪音。
 *
 * @param {object} character
 * @returns {Array<{id:string, kind:string, label:string, hint:string|null,
 *                  max:number|null, initial:number|null, sl:number, source:string}>}
 */
export const getActiveClassResources = (character) => {
  const out = [];
  for (const def of CLASS_RESOURCES) {
    const sl = getSkillSL(character, def.className, def.skillName);
    if (sl <= 0) continue;
    out.push({
      id: def.id,
      kind: def.kind,
      label: def.label,
      hint: def.hint,
      resetLabel: def.resetLabel,
      source: def.source,
      sl,
      max: def.kind === 'pool' ? def.maxFromSL(sl) : null,
      initial: def.kind === 'value' ? def.initial : null,
    });
  }
  return out;
};

/**
 * 讀取某資源目前的值。缺值時回傳合理預設（池為 0、單值為 initial）。
 */
export const readResource = (character, resource) => {
  const raw = character?.classResources?.[resource.id];
  if (resource.kind === 'value') {
    const n = Math.floor(Number(raw));
    return Number.isFinite(n) && n > 0 ? n : resource.initial;
  }
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? Math.min(n, resource.max) : 0;
};

/**
 * 寫入某資源的新值，並依類型夾在合法範圍。
 * - `pool`：夾在 `0 ~ max`
 * - `value`：至少 1（幸運數字不會是 0）
 */
export const clampResource = (resource, nextValue) => {
  const n = Math.floor(Number(nextValue));
  if (!Number.isFinite(n)) return resource.kind === 'value' ? resource.initial : 0;
  if (resource.kind === 'value') return Math.max(1, n);
  return Math.min(resource.max, Math.max(0, n));
};

/**
 * 建立新的 classResources 物件（不可變更新）。
 * @returns {object} 可直接寫回 character.classResources
 */
export const setResourceValue = (character, resource, nextValue) => ({
  ...(character?.classResources || {}),
  [resource.id]: clampResource(resource, nextValue),
});
