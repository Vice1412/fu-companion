/**
 * 極簡 PDF 產生器：把「每頁一張 JPEG」排成多頁 A4 橫向。
 *
 * 為什麼自己寫而不是加一個 PDF 套件：
 * 需求只有一件事——把已經光柵化好的頁面圖排進 PDF。這件事的 PDF 結構
 * （Catalog → Pages → 每頁一個 Image XObject ＋ 一段內容流 ＋ xref 表）不到 100 行，
 * 而且 **JPEG 可以直接用 `/Filter /DCTDecode` 原樣嵌入，不必重新編碼**。
 * 相對地，引入 `jspdf` 會多約 350 KB 的 bundle，換來的功能我們一個都用不到。
 *
 * 與專案裡其他「自己寫工具」的決定一致（例如比對設計器圖示時自寫的 SVG 光柵器）：
 * **能自己寫的小工具就不要拉依賴**。
 *
 * 這裡是純函式：輸入影像位元組，輸出 Blob，不碰 DOM，所以測得到。
 * 產出的 PDF 由 `pymupdf` 開過驗證（見 `tests/characterSheetUi.test.mjs` 的說明）。
 */

/** A4 橫向（pt）——與官方角色卡表的 842×595 pt 一致 */
export const A4_LANDSCAPE_PT = Object.freeze({ width: 841.89, height: 595.28 });

const encoder = new TextEncoder();

/** PDF 的數字：固定小數、去掉尾端的 0 */
const fmt = (n) => {
  const s = Number(n).toFixed(2).replace(/\.?0+$/, '');
  return s === '' ? '0' : s;
};

/** data URL（`data:image/jpeg;base64,...`）→ 位元組 */
export const dataUrlToBytes = (dataUrl) => {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return new Uint8Array(0);
  const base64 = dataUrl.slice(comma + 1);
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  // Node（測試環境）沒有 atob 時退回 Buffer
  return new Uint8Array(Buffer.from(base64, 'base64'));
};

/**
 * 從 JPEG 位元組讀出實際尺寸。
 *
 * 為什麼不直接相信呼叫端傳進來的寬高：那是一個**假設**（假設光柵化出來的尺寸
 * 就等於節點尺寸 × pixelRatio）。讀檔頭則是把假設變成事實，
 * 而且這個函式是純的、測得到。讀不到就回 null，由呼叫端退回傳入值。
 */
export const readJpegSize = (bytes) => {
  if (!bytes || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) { i += 1; continue; }
    const marker = bytes[i + 1];
    // SOF0–SOF15，但 C4(DHT)／C8(JPG)／CC(DAC) 不是尺寸標記
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (isSof) {
      return { height: (bytes[i + 5] << 8) | bytes[i + 6], width: (bytes[i + 7] << 8) | bytes[i + 8] };
    }
    if (length <= 0) return null;
    i += 2 + length;
  }
  return null;
};

/**
 * 組出多頁 PDF。
 *
 * @param {Array<{bytes: Uint8Array, width: number, height: number}>} images 每頁一張 JPEG
 * @param {{widthPt?: number, heightPt?: number}} [options] 頁面尺寸（pt），預設 A4 橫向
 * @returns {Blob|null}
 */
export const buildImagePdf = (images, options = {}) => {
  const list = Array.isArray(images) ? images.filter((im) => im && im.bytes && im.bytes.length > 0) : [];
  if (list.length === 0) return null;

  const widthPt = options.widthPt ?? A4_LANDSCAPE_PT.width;
  const heightPt = options.heightPt ?? A4_LANDSCAPE_PT.height;

  const parts = [];
  let cursor = 0;
  const pushBytes = (bytes) => {
    parts.push(bytes);
    cursor += bytes.length;
  };
  const pushText = (text) => pushBytes(encoder.encode(text));

  // 物件編號：1 Catalog、2 Pages、之後每頁三個（Page／內容流／影像）
  const totalObjects = 2 + list.length * 3;
  const objectOffsets = new Array(totalObjects).fill(0);
  const beginObject = (num) => {
    objectOffsets[num - 1] = cursor;
    pushText(`${num} 0 obj\n`);
  };
  const endObject = () => pushText('endobj\n');

  pushText('%PDF-1.4\n');
  // 二進位標記：告訴工具這不是純文字檔（必須是原始位元組，不能走 TextEncoder）
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const kids = list.map((_, i) => `${3 + i * 3} 0 R`).join(' ');

  beginObject(1);
  pushText('<< /Type /Catalog /Pages 2 0 R >>\n');
  endObject();

  beginObject(2);
  pushText(`<< /Type /Pages /Kids [${kids}] /Count ${list.length} >>\n`);
  endObject();

  list.forEach((img, i) => {
    const pageNum = 3 + i * 3;
    const contentNum = pageNum + 1;
    const imageNum = pageNum + 2;

    // 內容流：把單位正方形縮放到整頁，再把影像畫上去
    const stream = `q ${fmt(widthPt)} 0 0 ${fmt(heightPt)} 0 0 cm /Im0 Do Q`;

    beginObject(pageNum);
    pushText(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(widthPt)} ${fmt(heightPt)}] `
      + `/Resources << /XObject << /Im0 ${imageNum} 0 R >> >> /Contents ${contentNum} 0 R >>\n`
    );
    endObject();

    beginObject(contentNum);
    pushText(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\n`);
    endObject();

    beginObject(imageNum);
    const size = readJpegSize(img.bytes) || { width: img.width, height: img.height };
    pushText(
      `<< /Type /XObject /Subtype /Image /Width ${size.width} /Height ${size.height} `
      + `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`
    );
    pushBytes(img.bytes);
    pushText('\nendstream\n');
    endObject();
  });

  const xrefOffset = cursor;
  pushText(`xref\n0 ${totalObjects + 1}\n`);
  pushText('0000000000 65535 f \n');
  for (let i = 0; i < totalObjects; i += 1) {
    // 每一筆必須剛好 20 bytes：10 位位移 + 空白 + 5 位世代 + 空白 + 類型 + 空白 + 換行
    pushText(`${String(objectOffsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return new Blob(parts, { type: 'application/pdf' });
};

/** 供測試檢查：回傳整份 PDF 的位元組（瀏覽器下載用不到，但驗結構時需要） */
export const buildImagePdfBytes = async (images, options) => {
  const blob = buildImagePdf(images, options);
  if (!blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
};
