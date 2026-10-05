/**
 * 官方經典職業搭配：篩選與分組（純函式）。
 *
 * 從 `CharacterEditor.jsx` 抽出的理由：這段邏輯（手冊篩選 → 關鍵字比對 → 預組隊伍收攏）
 * 沒有任何 React 相依，抽成純函式後可被 `tests/starterPresets.test.mjs` 直接覆蓋。
 */

/** 「全部手冊」的篩選值。 */
export const ALL_BOOKS = 'all';

/**
 * 關鍵字比對：涵蓋角色名、英文名、所屬預組隊名、職業名與技能名。
 * @param {object} preset 經典搭配資料
 * @param {string} query 已正規化（trim + toLowerCase）的關鍵字；空字串代表不過濾
 * @returns {boolean}
 */
export const matchesPresetQuery = (preset, query) => {
  if (!query) return true;
  const haystack = [
    preset.title,
    preset.en,
    preset.group ? preset.group.title : '',
    ...preset.classes.flatMap((c) => [c.className, ...c.skills.map((s) => s.name)])
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query);
};

/**
 * 依手冊與關鍵字篩選，並把同一預組隊伍的成員收攏成一個區塊。
 *
 * 回傳值保持原資料順序；`group` 為 `null` 的個人配置各自獨立成一個單成員區塊
 * （`gid` 為 `null`，因此不會互相併吞）。
 *
 * @param {object[]} presets 全部經典搭配
 * @param {{ search?: string, sourcebook?: string }} [options]
 * @returns {{ gid: string|null, title: string|null, items: object[] }[]}
 */
export const buildPresetSections = (presets, { search = '', sourcebook = ALL_BOOKS } = {}) => {
  const query = String(search || '').trim().toLowerCase();

  const matched = (presets || []).filter((preset) => {
    if (!preset) return false;
    if (sourcebook !== ALL_BOOKS && (preset.sourcebook || 'core') !== sourcebook) return false;
    return matchesPresetQuery(preset, query);
  });

  const sections = [];
  matched.forEach((preset) => {
    const gid = preset.group ? preset.group.id : null;
    const last = sections[sections.length - 1];
    if (last && gid !== null && last.gid === gid) last.items.push(preset);
    else sections.push({ gid, title: preset.group ? preset.group.title : null, items: [preset] });
  });

  return sections;
};
