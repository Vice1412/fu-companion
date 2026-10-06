/**
 * GameIcon 圖示表的共用檢查工具（測試用）。
 *
 * 為什麼需要「解析原始碼」而不是查 `GAME_ICONS_MAP`：
 * 物件字面量裡**重複的鍵是合法的**，後者會靜默蓋掉前者，而 `Object.keys()`
 * 只看得到去重後的結果——所以重複鍵只能用文字解析抓。
 *
 * 而「這個圖示有沒有登記」則相反：要查**執行期的物件**，不要用正則掃檔案。
 * 2026-10-05 就真的踩過：`GameIcon.jsx` 的圖示名同時出現在檔頭 import 與圖示表，
 * 只掃檔案的正則會被 import 行滿足，於是「一次清掉 5 個只有 import 的鍵」
 * 讓 5 個圖示當場畫不出來，護欄卻是綠的。
 */
import fs from 'node:fs';

const GAME_ICON_PATH = '../src/components/ui/GameIcon.jsx';

export const readGameIconSource = () =>
  fs.readFileSync(new URL(GAME_ICON_PATH, import.meta.url), 'utf8');

/** 取出 `GAME_ICONS_MAP` 的鍵（支援 `key: Comp` 與 `Comp` 兩種寫法） */
export const parseIconMapKeys = (source) => {
  const m = source.match(/export const GAME_ICONS_MAP = \{([\s\S]*?)\n\};/);
  if (!m) throw new Error('GameIcon.jsx 找不到 GAME_ICONS_MAP');
  const keys = [];
  m[1].split('\n').forEach((line) => {
    const s = line.trim().replace(/,$/, '');
    if (!s || s.startsWith('//')) return;
    keys.push(s.includes(':') ? s.split(':')[0].trim().replace(/^['"]|['"]$/g, '') : s);
  });
  return keys;
};

export const readIconMapKeys = () => parseIconMapKeys(readGameIconSource());

/** 重複的鍵：後者會靜默蓋掉前者，所以這種事要靠測試擋 */
export const findDuplicateIconKeys = (keys) => {
  const seen = new Set();
  const dup = new Set();
  keys.forEach((k) => {
    if (seen.has(k)) dup.add(k);
    seen.add(k);
  });
  return [...dup];
};
