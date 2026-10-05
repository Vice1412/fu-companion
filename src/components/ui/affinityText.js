/**
 * 九相屬性關鍵字比對器（純函式，不含 React／JSX）。
 *
 * ── 為什麼獨立成一個模組 ──────────────────────────────────────────
 * 1. `FUIcon.jsx` 需要它來內聯渲染官方符號；測試需要它來掃描整個資料層。
 *    兩者共用同一份實作，才不會出現「測試過的不是實際在跑的那份」。
 * 2. 舊版（2026-10-05 之前）是一條巨型正則，靠「負向後顧」逐一排除例外詞：
 *    `(?<![曲暴疾])風`、`(?<![中劇])毒(?![素液])`、`(?<!微)光`、`(?<!黑)暗(?![影])`、
 *    `物理(?![防])`、`電(?![壓])`、`火(?![器焰])`。
 *    這種**黑名單式**寫法永遠追不上語言：2026-10-05 就漏了「魔能發電模組」的「發電」，
 *    速查手冊當場在「發電」的「電」前面插了一個閃電屬性圖示。同類漏網還有風格／光環／
 *    暗黑之刃／火砲模組／靈光一閃／交叉火力／劍刃風暴／墓土之子／放電形態／月光玉蘭…
 *    （稽核全資料層後共 317 處誤標）。
 *
 * ── 現行策略：寧漏不誤 ────────────────────────────────────────────
 * 屬性圖示只在高信度情境出現，其餘一律當一般文字。少一個圖示只是少一點裝飾；
 * 多一個圖示則是把「發電」讀成「閃電」，屬於內容錯誤。
 *
 *   R1  括號       【火】、（火）、(火)
 *   R2  明確後綴   火屬性／暗屬性傷害／物理抗性／毒系傷害／電傷／物理類型
 *   R3  列舉       風、電、土、火或冰 ／ 風／電／暗／土 ／ 風土火電或冰 ／ 風弱電、電弱土
 *   R4  整串即屬性詞（含 Markdown 粗體切塊 `**暗**`、下拉選單值 `'火'`）
 *   R5  傷害式尾綴 (HR + 8) 物理 ／【HR + 5】物理
 *   R6  繫詞後     變為土、則為暗、類型為光
 *   R7  編號列舉   1.風 2.電 3.暗 4.土 5.火 6.毒
 *
 * 再加一道**夾字否決**：屬性字的右側若緊接一個漢字（且該漢字不是另一個屬性字、也不是
 * 列舉連接詞），代表它只是某個詞的一部分 → 一律不標。「發電」「風格」「光環」「暗黑之刃」
 * 「火砲」「毒蛇」「陽光」全在此攔下。
 *
 * ※ 已知殘留（刻意接受）：詞尾剛好是屬性字、且後面緊接分隔符再接另一個屬性詞時仍會誤標，
 *    例：「貿易之風、電屬性傷害」的「風」。這在中文裡無法用字元規則與「受到風、電」區分。
 *    `tests/affinityText.test.mjs` 的誤標表已收錄實際踩到的案例，新增者會被擋下。
 */

/** 九相屬性（順序即官方順序；兩字詞必須排在單字之前，`baseAt` 才會先命中「物理」） */
export const AFFINITY_BASES = ['物理', '風', '電', '暗', '土', '火', '冰', '光', '毒'];

/** 明確屬性後綴（長者優先） */
const AFFINITY_SUFFIXES = ['屬性傷害', '屬性抗性', '屬性', '傷害', '抗性', '系傷害', '系', '傷', '類型'];

/** 列舉連接詞。`弱` 是相性表的官方記法（「風弱電」＝風弱於電），故視為列舉連接。 */
const LIST_JOINERS = '、，,／/·・或與及和弱';

/** 黏著字元：不算「夾字」的字元（分隔、括號、空白、數字、句讀） */
const GLUE_CHARS =
  `${LIST_JOINERS}；;：:|｜-－—～~＋+＝=*　 \t\n\r（）()【】「」『』〈〉《》〔〕。！？!?0123456789０１２３４５６７８９`;

/** 漢字（僅表意文字；全形標點 U+FFxx、CJK 標點 U+30xx 不算，才不會把「，」「。」當夾字） */
const HAN_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

/** 繫詞：其後緊接屬性字時視為屬性用法（變為土、則為暗、類型為光） */
const COPULAS = new Set(['為', '是', '成']);

const isGlue = (ch) => ch !== undefined && GLUE_CHARS.includes(ch);

/** 回傳在位置 i 起始的屬性詞（兩字詞優先） */
const baseAt = (text, i) => AFFINITY_BASES.find((b) => text.startsWith(b, i)) || null;

const suffixAt = (text, i) => AFFINITY_SUFFIXES.find((s) => text.startsWith(s, i)) || null;

/** 掃出所有屬性詞出現位置（不看情境，只看字面） */
const collectOccurrences = (text) => {
  const list = [];
  for (let i = 0; i < text.length; i += 1) {
    const base = baseAt(text, i);
    if (!base) continue;
    list.push({ index: i, base, end: i + base.length });
    i += base.length - 1;
  }
  return list;
};

/** 兩次出現之間只隔著列舉連接詞或空白 → 同一串列舉 */
const isChained = (text, prev, next) => {
  const between = text.slice(prev.end, next.index);
  if (!between) return true; // 直接相鄰：風土火電
  return [...between].every((ch) => LIST_JOINERS.includes(ch) || /\s/.test(ch));
};

/** 夾字：右側緊接漢字，且該漢字不是屬性詞開頭、也不是黏著字元 */
const isWedged = (text, occ) => {
  const right = text[occ.end];
  return right !== undefined && HAN_RE.test(right) && !isGlue(right) && !baseAt(text, occ.end);
};

/**
 * 為每個出現位置算出「所屬列舉串」的長度，以及串中未被夾字的成員數。
 * 夾字成員要在長串舉中被救回（例：「在電、暗、火、冰、光中選擇」的「光」被「中」夾住），
 * 但整串都是被夾住的詞時不得救（例：「風格、光環、暗影」）。
 */
const buildChains = (text, occurrences) => {
  const wedged = occurrences.map((occ) => isWedged(text, occ));
  const chains = occurrences.map(() => null);
  let start = 0;
  while (start < occurrences.length) {
    let end = start;
    while (end + 1 < occurrences.length && isChained(text, occurrences[end], occurrences[end + 1])) end += 1;
    const members = [];
    for (let k = start; k <= end; k += 1) members.push(k);
    const cleanCount = members.filter((k) => !wedged[k]).length;
    for (const k of members) {
      chains[k] = {
        size: members.length,
        cleanSiblings: cleanCount - (wedged[k] ? 0 : 1),
      };
    }
    start = end + 1;
  }
  return { wedged, chains };
};

/** 傷害式尾綴：(HR + 8) 物理、【HR + 5】物理 */
const isDamageTail = (text, index, end) =>
  /[】)）]\s*$/.test(text.slice(0, index)) && /^[\s。；;，,、]*$/.test(text.slice(end));

/**
 * 編號列舉（1.風 2.電 3.暗…）：回傳各項目的起始位置。
 * 必須成串（≥ 2 項）才算列舉，否則「(HR + 8) 物理」的「8)」會被誤認成編號。
 */
const numberedItemStarts = (text) => {
  const starts = new Set();
  const re = /\d+\s*[.．)]\s*/g;
  let m;
  while ((m = re.exec(text)) !== null) starts.add(m.index + m[0].length);
  return starts.size >= 2 ? starts : null;
};

const classify = (text, occ, wedged, chain, numberedStarts) => {
  const { index, base, end } = occ;
  const left = index > 0 ? text[index - 1] : '';
  const right = text[end];
  const token = (raw, kind, at = index) => ({ index: at, length: raw.length, base, raw, kind });

  // R1 括號（【火】／（火）／(火)）
  if (left === '【' && right === '】') return token(`【${base}】`, 'bracket', index - 1);
  if ((left === '（' || left === '(') && (right === '）' || right === ')')) return token(base, 'bracket');

  // R2 明確後綴
  const suffix = suffixAt(text, end);
  if (suffix) return token(base + suffix, 'suffix');

  // R4 整串就是屬性詞（粗體切塊、選單值）
  if (text.trim() === base) return token(base, 'standalone');

  // 夾字否決：只有當它屬於「成員夠多、且多數成員未被夾字」的列舉串時才救回
  if (wedged && !(chain.size >= 3 && chain.cleanSiblings >= 2)) return null;

  // R3 列舉
  if (chain.size >= 2) return token(base, 'list');

  // R7 編號列舉（1.風 2.電）
  if (numberedStarts && numberedStarts.has(index)) return token(base, 'numbered');

  // R6 繫詞
  if (COPULAS.has(left)) return token(base, 'copula');

  // R5 傷害式尾綴
  if (isDamageTail(text, index, end)) return token(base, 'damage-tail');

  return null;
};

/**
 * 找出字串中所有該被標為屬性的片段（依位置排序）。
 *
 * @param {string} text
 * @returns {{index:number,length:number,base:string,raw:string,kind:string}[]}
 */
export function findAffinityTokens(text) {
  if (!text || typeof text !== 'string') return [];
  const occurrences = collectOccurrences(text);
  if (occurrences.length === 0) return [];
  const { wedged, chains } = buildChains(text, occurrences);
  const numberedStarts = numberedItemStarts(text);
  const tokens = [];
  occurrences.forEach((occ, k) => {
    const token = classify(text, occ, wedged[k], chains[k], numberedStarts);
    if (token) tokens.push(token);
  });
  return tokens;
}
