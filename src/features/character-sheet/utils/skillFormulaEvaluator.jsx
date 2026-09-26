import React from 'react';

/**
 * 技能公式動態解析與求值器 (Skill Formula Evaluator)
 * 嚴格遵循官方核心與拓展開發手冊之【SL】動態數值公式。
 * 
 * 體驗保證：
 * 1. 在點亮特技前 (SL = 0)：明確標註公式本身（例如【SL × 5】），讓玩家瞭解點數成長率與計算方式。
 * 2. 在點亮特技後 (SL >= 1)：自動計算精確數值（例如【10】），並附帶懸浮公式提示 (SL 2 × 5 = 10)。
 * 3. 支援 Markdown **粗體** 樣式高亮渲染，1:1 對照官方規則書重點。
 * 4. 支援點擊非通用專屬規則關鍵詞（阿爾卡納、儀式學派、小工具、造物專案、忠實夥伴等），平滑開啟規則速查手冊。
 */

// 支援的專有規則速查關鍵詞（依字元長度降序排列，避免短詞覆蓋長詞）
const CODEX_KEYWORDS = [
  '造物專案',
  '秘儀學派儀式',
  '嵌合學派儀式',
  '元素學派儀式',
  '熵系學派儀式',
  '靈魂學派儀式',
  '阿爾卡納',
  '儀式學派',
  '小工具',
  '造物',
  '忠實夥伴',
  '元素魔法',
  '熵系魔法',
  '靈魂魔法'
];

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

    const rawFormula = match[1].replace(/\*\*/g, '');
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
 * 觸發開啟規則速查手冊全域事件
 */
export function openRuleCodex(keyword) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fu:open-rule-codex', { detail: { keyword } }));
  }
}

/**
 * 渲染單一純字串片段中的關鍵詞與攻擊性咒語圖標
 */
function renderWordsAndKeywords(text, keyPrefix = '') {
  if (!text || typeof text !== 'string') return text;

  // 組合正則：攻擊性咒語 (（o）/ (o) / (⚡)) 以及非通用規則關鍵字
  const escapedKeywords = CODEX_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const combinedRegex = new RegExp(`(（[oO⚡]）|\\([oO⚡]\\)|${escapedKeywords})`, 'g');

  const parts = text.split(combinedRegex);
  if (parts.length === 1) return text;

  return parts.map((part, pIdx) => {
    if (!part) return null;
    const k = `${keyPrefix}-${pIdx}`;

    // 1. 攻擊性咒語官方紅色閃電圖標
    if (/^(（[oO⚡]）|\([oO⚡]\))$/.test(part)) {
      return (
        <span key={k} className="inline-flex items-center text-red-600 font-bold select-none mx-0.5">
          <span>（</span>
          <span className="fu-icon text-sm leading-none inline-block drop-shadow-2xs translate-y-[-0.5px]" title="攻擊性咒語">
            o
          </span>
          <span>）</span>
        </span>
      );
    }

    // 2. 規則速查關鍵詞
    if (CODEX_KEYWORDS.includes(part)) {
      return (
        <span
          key={k}
          onClick={(e) => {
            e.stopPropagation();
            openRuleCodex(part);
          }}
          className="inline cursor-pointer border-b border-dashed border-amber-600/70 text-amber-900 dark:text-amber-300 font-bold hover:text-amber-600 hover:border-amber-500 transition-colors mx-0.5"
          title={`點擊速查「${part}」官方規則`}
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

/**
 * 渲染行內富文字（解析 **粗體** 與其中的關鍵詞）
 */
function renderInlineRichText(line, linePrefix = '') {
  if (!line) return null;

  // 匹配 **粗體內容**
  const boldRegex = /(\*\*.*?\*\*)/g;
  const parts = line.split(boldRegex);

  return parts.map((chunk, cIdx) => {
    if (!chunk) return null;
    const k = `${linePrefix}-chunk-${cIdx}`;

    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      const innerText = chunk.slice(2, -2);
      return (
        <strong key={k} className="font-bold text-stone-900 dark:text-amber-100">
          {renderWordsAndKeywords(innerText, `${k}-bold`)}
        </strong>
      );
    }

    return (
      <React.Fragment key={k}>
        {renderWordsAndKeywords(chunk, `${k}-plain`)}
      </React.Fragment>
    );
  });
}

/**
 * 完整渲染富文本區塊（解析 \n 換行、**粗體**、關鍵詞、公式）
 */
export function renderRichTextContent(content, prefix = '') {
  if (!content || typeof content !== 'string') return content;

  const lines = content.split('\n');
  if (lines.length === 1) {
    return renderInlineRichText(content, prefix);
  }

  return lines.map((line, lIdx) => (
    <React.Fragment key={`${prefix}-line-${lIdx}`}>
      {renderInlineRichText(line, `${prefix}-line-${lIdx}`)}
      {lIdx < lines.length - 1 && <br className="my-1" />}
    </React.Fragment>
  ));
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
          return (
            <React.Fragment key={idx}>
              {renderRichTextContent(seg.content, `seg-${idx}`)}
            </React.Fragment>
          );
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
