import React from 'react';

/**
 * Fabula Ultima Official Font Icon Mapping (FabulaUltimaIcons-Regular.otf)
 * 嚴格對齊官方風格手冊 (Third-Party License Style Guide Page 11 & Core Rulebook)
 */
export const FU_ICON_MAP = {
  // 屬性九相 (Affinities & Damage Types - 官方標準順序: p a b d e f i l t)
  '物理': { char: 'p', color: 'text-stone-700 font-bold', label: '物理' },
  physical: { char: 'p', color: 'text-stone-700 font-bold', label: '物理' },
  p: { char: 'p', color: 'text-stone-700 font-bold', label: '物理' },

  '風': { char: 'a', color: 'text-cyan-700 font-bold', label: '風' },
  air: { char: 'a', color: 'text-cyan-700 font-bold', label: '風' },
  wind: { char: 'a', color: 'text-cyan-700 font-bold', label: '風' },
  a: { char: 'a', color: 'text-cyan-700 font-bold', label: '風' },

  '電': { char: 'b', color: 'text-amber-600 font-bold', label: '電' },
  bolt: { char: 'b', color: 'text-amber-600 font-bold', label: '電' },
  lightning: { char: 'b', color: 'text-amber-600 font-bold', label: '電' },
  b: { char: 'b', color: 'text-amber-600 font-bold', label: '電' },

  '暗': { char: 'd', color: 'text-indigo-950 font-bold', label: '暗' },
  dark: { char: 'd', color: 'text-indigo-950 font-bold', label: '暗' },
  d: { char: 'd', color: 'text-indigo-950 font-bold', label: '暗' },

  '土': { char: 'e', color: 'text-amber-800 font-bold', label: '土' },
  earth: { char: 'e', color: 'text-amber-800 font-bold', label: '土' },
  e: { char: 'e', color: 'text-amber-800 font-bold', label: '土' },

  '火': { char: 'f', color: 'text-red-700 font-bold', label: '火' },
  fire: { char: 'f', color: 'text-red-700 font-bold', label: '火' },
  f: { char: 'f', color: 'text-red-700 font-bold', label: '火' },

  '冰': { char: 'i', color: 'text-blue-700 font-bold', label: '冰' },
  ice: { char: 'i', color: 'text-blue-700 font-bold', label: '冰' },
  i: { char: 'i', color: 'text-blue-700 font-bold', label: '冰' },

  '光': { char: 'l', color: 'text-amber-600 font-bold', label: '光' },
  light: { char: 'l', color: 'text-amber-600 font-bold', label: '光' },
  l: { char: 'l', color: 'text-amber-600 font-bold', label: '光' },

  '毒': { char: 't', color: 'text-fuchsia-800 font-bold', label: '毒' },
  poison: { char: 't', color: 'text-fuchsia-800 font-bold', label: '毒' },
  t: { char: 't', color: 'text-fuchsia-800 font-bold', label: '毒' },

  // 攻擊射程 (Attack Range)
  '近戰': { char: 'm', color: 'text-[#3c2415]', label: '近戰' },
  melee: { char: 'm', color: 'text-[#3c2415]', label: '近戰' },
  m: { char: 'm', color: 'text-[#3c2415]', label: '近戰' },

  '遠程': { char: 'r', color: 'text-[#3c2415]', label: '遠程' },
  ranged: { char: 'r', color: 'text-[#3c2415]', label: '遠程' },
  r: { char: 'r', color: 'text-[#3c2415]', label: '遠程' },

  // 動作與技能分類 (Action Categories)
  '咒語': { char: 'c', color: 'text-purple-700', label: '咒語' },
  spell: { char: 'c', color: 'text-purple-700', label: '咒語' },
  c: { char: 'c', color: 'text-purple-700', label: '咒語' },

  '攻擊性咒語': { char: 'o', color: 'text-red-700', label: '攻擊性咒語' },
  offensive: { char: 'o', color: 'text-red-700', label: '攻擊性咒語' },
  offensive_spell: { char: 'o', color: 'text-red-700', label: '攻擊性咒語' },
  o: { char: 'o', color: 'text-red-700', label: '攻擊性咒語' },

  '其餘行動': { char: 's', color: 'text-amber-800', label: '其餘行動' },
  action: { char: 's', color: 'text-amber-800', label: '其餘行動' },
  other_action: { char: 's', color: 'text-amber-800', label: '其餘行動' },
  s: { char: 's', color: 'text-amber-800', label: '其餘行動' },

  // 危機指示符 (Crisis Indicator - Style Guide p.11: HP X w X)
  '危機': { char: 'w', color: 'text-red-600', label: '危機' },
  crisis: { char: 'w', color: 'text-red-600', label: '危機' },
  w: { char: 'w', color: 'text-red-600', label: '危機' }
};

/**
 * FUIcon Component
 * 渲染 Fabula Ultima 官方專屬字型圖標 (.fu-icon)
 *
 * @param {string} name - 圖標代號或中文 (如 'melee', '近戰', 'fire', '火', 'crisis', 'w', 'spell', 'c')
 * @param {string} className - 自訂 CSS 類別
 * @param {boolean} showLabel - 是否一併渲染中文標籤
 */
export default function FUIcon({ name, className = '', showLabel = false, ...props }) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  const iconDef = FU_ICON_MAP[name] || FU_ICON_MAP[key];

  if (!iconDef) {
    // 若傳入未收錄字符，直接作為 .fu-icon 字符渲染
    return <span className={`fu-icon inline-block leading-none ${className}`} {...props}>{name}</span>;
  }

  const content = (
    <span
      className={`fu-icon inline-block leading-none ${iconDef.color} ${className}`}
      title={iconDef.label}
      {...props}
    >
      {iconDef.char}
    </span>
  );

  if (showLabel) {
    return (
      <span className="inline-flex items-center gap-1">
        {content}
        <span className={iconDef.color}>{iconDef.label}</span>
      </span>
    );
  }

  return content;
}
