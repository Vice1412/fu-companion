import React from 'react';

/**
 * 技能公式動態解析與求值器 (Skill Formula Evaluator)
 * 嚴格遵循官方核心與拓展開發手冊之【SL】動態數值公式。
 * 
 * 體驗保證：
 * 1. 在點亮特技前 (SL = 0)：明確標註公式本身（例如【SL × 5】），讓玩家瞭解點數成長率與計算方式。
 * 2. 在點亮特技後 (SL >= 1)：自動計算精確數值（例如【10】），並附帶懸浮公式提示 (SL 2 × 5 = 10)。
 */

export function parseSkillFormulaSegments(text, sl = 0) {
  if (!text) return [];

  // 匹配所有【...SL...】或【SL】公式區塊
  const regex = /【([^】]*SL[^】]*)】/gi;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 匹配前文字
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index)
      });
    }

    const rawFormula = match[1];
    const evaluated = evaluateFormulaString(rawFormula, sl);

    segments.push({
      type: 'formula',
      raw: match[0],
      formula: rawFormula,
      evaluatedText: evaluated.text,
      computedValue: evaluated.value,
      formulaNote: evaluated.note,
      isCalculated: sl > 0 && evaluated.isCalculated
    });

    lastIndex = regex.lastIndex;
  }

  // 剩餘文字
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return segments;
}

function evaluateFormulaString(formulaStr, sl) {
  const trimmed = formulaStr.trim();

  // 若 SL 為 0，不計算直接展示公式
  if (sl <= 0) {
    return {
      text: `【${trimmed}】`,
      value: null,
      note: `公式基準：${trimmed}（尚未分配特技點數）`,
      isCalculated: false
    };
  }

  // 1. 複合乘加：如 10 + (SL × 5) 或 10 + SL × 5
  const compoundMatch = trimmed.match(/^(\d+)\s*\+\s*\(?SL\s*[×*]\s*(\d+)\)?$/i);
  if (compoundMatch) {
    const base = Number(compoundMatch[1]);
    const mult = Number(compoundMatch[2]);
    const res = base + (sl * mult);
    return {
      text: `【${res}】`,
      value: res,
      note: `公式：${base} + (SL ${sl} × ${mult}) = ${res}`,
      isCalculated: true
    };
  }

  // 2. 乘法：如 SL × 5, SL × 10, SL × 2, SL × 20, SL × 100, SL× 5
  const multMatch = trimmed.match(/^SL\s*[×*]\s*(\d+)$/i);
  if (multMatch) {
    const mult = Number(multMatch[1]);
    const res = sl * mult;
    return {
      text: `【${res}】`,
      value: res,
      note: `公式：SL ${sl} × ${mult} = ${res}`,
      isCalculated: true
    };
  }

  // 3. 乘法反向：如 10 × SL
  const revMultMatch = trimmed.match(/^(\d+)\s*[×*]\s*SL$/i);
  if (revMultMatch) {
    const mult = Number(revMultMatch[1]);
    const res = sl * mult;
    return {
      text: `【${res}】`,
      value: res,
      note: `公式：${mult} × SL ${sl} = ${res}`,
      isCalculated: true
    };
  }

  // 4. 加法：如 SL + 1, SL + 2, SL＋1
  const addMatch = trimmed.match(/^SL\s*[+＋]\s*(\d+)$/i);
  if (addMatch) {
    const add = Number(addMatch[1]);
    const res = sl + add;
    return {
      text: `【${res}】`,
      value: res,
      note: `公式：SL ${sl} + ${add} = ${res}`,
      isCalculated: true
    };
  }

  // 5. 純 SL：如 【SL】
  if (/^SL$/i.test(trimmed)) {
    return {
      text: `【${sl}】`,
      value: sl,
      note: `特技等級 SL = ${sl}`,
      isCalculated: true
    };
  }

  // 6. 帶變數的加法：如 SL + 體魄骰數值、SL + 目標身上狀態效果數量
  const varAddMatch = trimmed.match(/^SL\s*[+＋]\s*(.+)$/i);
  if (varAddMatch) {
    const varName = varAddMatch[1];
    return {
      text: `【${sl} + ${varName}】`,
      value: null,
      note: `公式：SL(${sl}) + ${varName}`,
      isCalculated: true
    };
  }

  // 7. 帶變數的乘法：如 SL × 夥伴基礎體魄骰尺寸
  const varMultMatch = trimmed.match(/^SL\s*[×*]\s*(.+)$/i);
  if (varMultMatch) {
    const varName = varMultMatch[1];
    return {
      text: `【${sl} × ${varName}】`,
      value: null,
      note: `公式：SL(${sl}) × ${varName}`,
      isCalculated: true
    };
  }

  // 預設替換所有的單獨 SL 詞彙
  const dynamicSubbed = trimmed.replace(/\bSL\b/g, String(sl));
  return {
    text: `【${dynamicSubbed}】`,
    value: null,
    note: `公式計算替換：${trimmed} -> ${dynamicSubbed}`,
    isCalculated: true
  };
}

/**
 * 技能動態敘述渲染組件
 */
export default function SkillDescription({ desc, sl = 0, className = '' }) {
  if (!desc) return null;

  const segments = parseSkillFormulaSegments(desc, sl);

  return (
    <span className={`inline leading-relaxed ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <span key={idx}>{seg.content}</span>;
        }

        if (seg.isCalculated) {
          // 已點亮並已計算出精確數值
          return (
            <span
              key={idx}
              className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded font-mono font-black text-amber-900 bg-amber-200/90 border border-amber-400 shadow-2xs cursor-help transition-all hover:bg-amber-300"
              title={seg.formulaNote}
            >
              {seg.evaluatedText}
            </span>
          );
        }

        // 未點亮 (SL = 0) 或純公式展示
        return (
          <span
            key={idx}
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded font-mono font-bold text-amber-800 bg-amber-50 border border-amber-300/80 cursor-help"
            title={seg.formulaNote}
          >
            {seg.evaluatedText}
          </span>
        );
      })}
    </span>
  );
}
