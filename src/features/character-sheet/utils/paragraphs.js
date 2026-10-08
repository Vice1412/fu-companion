/**
 * 把一段文字切成「段落 → 行」。
 *
 * ## 為什麼需要這個
 *
 * 資料裡**同時混用**兩種換行：
 * - `\n` —— 行內換行，通常是一個條列項目的結尾（例：`·覺醒：…` 這種清單）
 * - `\n\n` —— 段落分隔
 *
 * 如果渲染端一律按 `\n` 切，`\n\n` 就會多出一個**空的 `<p>`**，
 * 於是段落間距忽大忽小、清單又被拆成獨立段落——使用者回報的「分段失敗」就是這個。
 * 反過來，如果一律按 `\n\n` 切，清單的每一項就會被擠成同一行。
 *
 * 所以正確做法是**兩層都保留**：先按空行切段落，再按單一換行切行。
 *
 * 回傳 `[[行, 行], [行], ...]`——外層是段落、內層是該段落內的行。
 */
export function splitParagraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/) // 空行＝段落界
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean))
    .filter((block) => block.length > 0);
}

/**
 * 把 `splitParagraphs` 的結果攤平成純字串陣列（給只需要「一行一行」的場合）。
 * 段落界會插入一個空字串，讓呼叫端自己決定要不要加間距。
 */
export function flattenParagraphs(text) {
  const out = [];
  splitParagraphs(text).forEach((block, i) => {
    if (i > 0) out.push('');
    out.push(...block);
  });
  return out;
}
