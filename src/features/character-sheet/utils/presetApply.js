/**
 * 官方經典職業搭配：套用邏輯（純函式）。
 *
 * 從 `CharacterEditor.jsx` 抽出的理由：這段邏輯（覆寫官方欄位 → 寫入職業子系統 → 保留玩家自訂欄位）
 * 沒有任何 React 相依，抽成純函式後可被 `tests/starterPresets.test.mjs` 直接覆蓋。
 *
 * **不覆寫**身分／主題／出身／羈絆 —— 官方原書不提供這些欄位，屬玩家自訂（見 `docs/decisions.md` §P3）。
 */

import { createDefaultVehicleData } from '../data/pilotVehicleData';

/**
 * 把一個經典職業搭配套用到角色上，回傳新的角色物件（不修改輸入）。
 *
 * @param {object} character 目前角色
 * @param {object} preset 經典職業搭配
 * @returns {object} 新的角色物件
 */
export const applyPreset = (character, preset) => {
  const base = character || {};
  const book = preset.sourcebook || 'core';

  const enabledBooks = new Set(base.enabledSourcebooks ?? ['core']);
  enabledBooks.add(book);

  const next = {
    ...base,
    name: preset.title,
    attributes: { ...preset.attributes },
    // 深拷貝：`selectedOptions` 等子選擇內嵌在技能上，會一併帶入
    classes: JSON.parse(JSON.stringify(preset.classes)),
    equipment: { ...preset.equipment },
    zenit: preset.zenit,
    enabledSourcebooks: Array.from(enabledBooks),
    updatedAt: new Date().toISOString()
  };

  // 秘儀師【綁定和召喚】：起始自選一個已綁定的阿爾卡納
  if (preset.arcana) {
    next.arcanistData = {
      customArcana: [],
      activeSummonId: null,
      ...(base.arcanistData || {}),
      boundArcana: [...preset.arcana]
    };
  }

  // 修補匠【小工具】：煉金術／灌注術／魔導科技的階級
  if (preset.gadgets) {
    next.tinkererData = {
      ...(base.tinkererData || {}),
      gadgets: {
        ...preset.gadgets,
        magitechSpells: [...(preset.gadgets.magitechSpells || [])]
      }
    };
  }

  // 機師【個人載具】：寫入框架與已掌握模組；啟用狀態交由載具面板（避免與槽位／武器上限衝突）
  if (preset.vehicle) {
    next.pilotVehicle = {
      ...(base.pilotVehicle || createDefaultVehicleData()),
      frameId: preset.vehicle.frameId,
      unlockedModules: [...preset.vehicle.modules],
      activeModules: [],
      isMounted: false
    };
  }

  if (preset.quirk) next.quirk = preset.quirk;

  return next;
};
