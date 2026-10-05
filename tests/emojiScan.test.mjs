/**
 * 規則五.1：零 Emoji 掃描（自動化）
 *
 * 執行：npm run test:emoji
 *
 * ## 為什麼要有這支測試
 *
 * `GEMINI.md` 規則五.1 原本是「每次改動後手動跑一次掃描」。但本專案在 2026-10-04 一天內
 * **三次**把 `⚠️` 寫進自己的註解（`properNouns.js`、`tinkererProjects.js`、`classResources.js`）——
 * 每次都是靠手動掃描才抓到。手動關卡會漏，所以改成自動。
 *
 * ## 判定範圍（依 `AGENTS.md` §3 修正版正則）
 *
 * - **禁止**：彩色圖像化 Emoji（含代理對 U+1F000 以上，以及 `GEMINI.md` 原版正則漏掉的 BMP emoji）
 * - **允許**：排版字符 dingbat（`★ ❖ ✦ ✕ ※ △ ◈ ▽ ▼ ◆ ● ◷ ✎ ✓ ✗ ➔`）——不在本正則範圍內
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');
// `shared/` 是前端與未來的 Worker 共用的原始碼，同樣受零 Emoji 鐵律約束。
// 未納入掃描的話，寫在 shared/ 的 emoji 會完全逃過關卡。
const SHARED = path.resolve(process.cwd(), 'shared');
const EXTS = new Set(['.js', '.jsx', '.json', '.css']);

/**
 * 修正版正則（`AGENTS.md` §3）。
 * 第一個分支涵蓋代理對（astral plane），第二個補上 `GEMINI.md` 原版漏掉的 BMP emoji。
 */
const EMOJI = /[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u26A1\u26A0\u2705\u274C\u26D3\u2620\u2744\u2600\u23F3\u270F\u2728\u2694\u2714\u2716]/;

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
};

const files = [...walk(SRC), ...(fs.existsSync(SHARED) ? walk(SHARED) : [])];
const hits = [];

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const m = line.match(EMOJI);
    if (m) {
      const ch = m[0];
      const cp = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
      hits.push({
        rel: path.relative(process.cwd(), file).replace(/\\/g, '/'),
        line: i + 1,
        cp: `U+${cp}`,
        snippet: line.trim().slice(0, 90)
      });
    }
  });
}

console.log(`\n=== 規則五.1：零 Emoji 掃描 ===`);
console.log(`  掃描檔案數 = ${files.length}（src/ 與 shared/ 內 .js/.jsx/.json/.css）`);

if (hits.length === 0) {
  console.log(`  ✅ 命中 0 行（全部通過）`);
  console.log(`\n${'='.repeat(56)}`);
  console.log(`  通過 1 / 1　（全部通過）`);
  console.log(`${'='.repeat(56)}`);
  process.exit(0);
}

console.log(`  ❌ 命中 ${hits.length} 行：\n`);
for (const h of hits) {
  console.log(`  ${h.rel}:${h.line}  ${h.cp}`);
  console.log(`      ${h.snippet}`);
}
console.log(`\n${'='.repeat(56)}`);
console.log(`  通過 0 / 1　失敗 1`);
console.log(`  Emoji 為規則一軌道 3 的硬性禁止項，且不允許出現在註解中。`);
console.log(`${'='.repeat(56)}`);
process.exit(1);
