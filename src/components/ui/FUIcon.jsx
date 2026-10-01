import React from 'react';

/**
 * Fabula Ultima Official Font Icon Mapping (FabulaUltimaIcons-Regular.otf)
 * 嚴格對齊官方風格手冊 (Third-Party License Style Guide Page 11 & Core Rulebook)
 */
export const FU_ICON_MAP = {
  // 屬性九相 (Affinities & Damage Types - 官方標準順序: p a b d e f i l t)
  '物理': { char: 'p', color: 'text-stone-700 dark:text-stone-300 font-bold', label: '物理' },
  physical: { char: 'p', color: 'text-stone-700 dark:text-stone-300 font-bold', label: '物理' },
  p: { char: 'p', color: 'text-stone-700 dark:text-stone-300 font-bold', label: '物理' },

  '風': { char: 'a', color: 'text-cyan-700 dark:text-cyan-400 font-bold', label: '風' },
  air: { char: 'a', color: 'text-cyan-700 dark:text-cyan-400 font-bold', label: '風' },
  wind: { char: 'a', color: 'text-cyan-700 dark:text-cyan-400 font-bold', label: '風' },
  a: { char: 'a', color: 'text-cyan-700 dark:text-cyan-400 font-bold', label: '風' },

  '電': { char: 'b', color: 'text-amber-600 dark:text-amber-400 font-bold', label: '電' },
  bolt: { char: 'b', color: 'text-amber-600 dark:text-amber-400 font-bold', label: '電' },
  lightning: { char: 'b', color: 'text-amber-600 dark:text-amber-400 font-bold', label: '電' },
  b: { char: 'b', color: 'text-amber-600 dark:text-amber-400 font-bold', label: '電' },

  '暗': { char: 'd', color: 'text-indigo-950 dark:text-indigo-300 font-bold', label: '暗' },
  dark: { char: 'd', color: 'text-indigo-950 dark:text-indigo-300 font-bold', label: '暗' },
  d: { char: 'd', color: 'text-indigo-950 dark:text-indigo-300 font-bold', label: '暗' },

  '土': { char: 'e', color: 'text-amber-800 dark:text-amber-500 font-bold', label: '土' },
  earth: { char: 'e', color: 'text-amber-800 dark:text-amber-500 font-bold', label: '土' },
  e: { char: 'e', color: 'text-amber-800 dark:text-amber-500 font-bold', label: '土' },

  '火': { char: 'f', color: 'text-red-700 dark:text-red-400 font-bold', label: '火' },
  fire: { char: 'f', color: 'text-red-700 dark:text-red-400 font-bold', label: '火' },
  f: { char: 'f', color: 'text-red-700 dark:text-red-400 font-bold', label: '火' },

  '冰': { char: 'i', color: 'text-blue-700 dark:text-blue-400 font-bold', label: '冰' },
  ice: { char: 'i', color: 'text-blue-700 dark:text-blue-400 font-bold', label: '冰' },
  i: { char: 'i', color: 'text-blue-700 dark:text-blue-400 font-bold', label: '冰' },

  '光': { char: 'l', color: 'text-amber-600 dark:text-amber-300 font-bold', label: '光' },
  light: { char: 'l', color: 'text-amber-600 dark:text-amber-300 font-bold', label: '光' },
  l: { char: 'l', color: 'text-amber-600 dark:text-amber-300 font-bold', label: '光' },

  '毒': { char: 't', color: 'text-fuchsia-800 dark:text-fuchsia-400 font-bold', label: '毒' },
  poison: { char: 't', color: 'text-fuchsia-800 dark:text-fuchsia-400 font-bold', label: '毒' },
  t: { char: 't', color: 'text-fuchsia-800 dark:text-fuchsia-400 font-bold', label: '毒' },

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

/**
 * 將文本中的九大屬性傷害關鍵字動態解析並渲染為官方字型圖標與專屬色彩
 *
 * 支援樣式：
 * 1. 括號屬性：如【火】、【物理】等，替換為帶官方符號與色彩的【f火】、【p物理】
 * 2. 屬性詞綴：如「火屬性」、「暗屬性傷害」、「物理抗性」、「毒傷」等，附帶符號與顏色
 * 3. 屬性並列：如「風、電、冰傷害」、「土或火」、「暗、光或毒」等
 */
export function renderTextWithAffinities(text) {
  if (!text || typeof text !== 'string') return text;

  // 嚴格匹配九相，避免誤傷「中毒」(狀態)、「微光視覺」、「曲風」、「暴風」、「物理防禦」(數值)、「火器」(武器) 等非傷害屬性詞彙
  const regex = /(【(?:物理|風|電|暗|土|火|冰|光|毒)】|(?<![曲暴])風(?:屬性傷害|屬性抗性|屬性|傷害|抗性)?|(?<![中劇])毒(?:屬性傷害|屬性抗性|屬性|傷害|抗性|傷)?(?![素液])|(?<!微)光(?:屬性傷害|屬性抗性|屬性|傷害|抗性)?|(?<!黑)暗(?:屬性傷害|屬性抗性|屬性|傷害|抗性)?|(?:物理(?![防])|電|土|火(?![器])|冰)(?:屬性傷害|屬性抗性|屬性|傷害|抗性)?)/g;

  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchStr = match[0];

    if (matchIndex > lastIndex) {
      elements.push(text.slice(lastIndex, matchIndex));
    }

    const cleanAff = matchStr.replace(/[【】]/g, '');
    let matchedBaseAff = null;
    for (const aff of ['物理', '風', '電', '暗', '土', '火', '冰', '光', '毒']) {
      if (cleanAff.startsWith(aff)) {
        matchedBaseAff = aff;
        break;
      }
    }

    const iconDef = matchedBaseAff ? FU_ICON_MAP[matchedBaseAff] : null;

    if (iconDef) {
      if (matchStr.startsWith('【') && matchStr.endsWith('】')) {
        elements.push(
          <span key={`aff_${matchIndex}`} className={`inline ${iconDef.color}`}>
            【<span className="fu-icon text-xs leading-none mx-0.5">{iconDef.char}</span>
            {matchedBaseAff}】
          </span>
        );
      } else {
        elements.push(
          <span key={`aff_${matchIndex}`} className={`inline ${iconDef.color}`}>
            <span className="fu-icon text-xs leading-none mr-0.5">{iconDef.char}</span>
            {matchStr}
          </span>
        );
      }
    } else {
      elements.push(matchStr);
    }

    lastIndex = matchIndex + matchStr.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}
