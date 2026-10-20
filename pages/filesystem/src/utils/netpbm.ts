/**
 * Netpbm 家族（{@code .pbm} / {@code .pgm} / {@code .ppm} / {@code .pnm}）解码。
 *
 * <p>为什么自研：浏览器只认 png/jpeg/webp/gif 等，Netpbm 是 Unix 世界最通用的
 * 「无专利、极简」位图格式（扫描件、科研图、图像处理中间产物），file-viewer 也没有
 * 对应 registry。格式本身只有 6 个变体，解析成本远低于引入依赖。</p>
 *
 * <p><b>六个变体</b>：</p>
 * <ul>
 *   <li>{@code P1}/{@code P4}：位图（1 = 黑）；P1 是 ASCII，P4 是每行按字节对齐的位流；</li>
 *   <li>{@code P2}/{@code P5}：灰度；P5 每样本 1 字节（maxval&lt;256）或 2 字节大端；</li>
 *   <li>{@code P3}/{@code P6}：RGB；二进制规则同灰度。</li>
 * </ul>
 *
 * <p>注释以 {@code #} 起、到行尾；字节型变体在 maxval 之后**恰好一个**空白字符，
 * 随后即为裸数据（不能再按通用空白跳，否则会吃掉首字节）。</p>
 */

/** 解码后的位图（统一 RGBA，便于直接 putImageData） */
export interface RasterImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

const WS = new Set([0x20, 0x09, 0x0a, 0x0d, 0x0b, 0x0c]);

/** 跳过空白与注释 */
function skipSpace(bytes: Uint8Array, pos: number): number {
  let i = pos;
  while (i < bytes.length) {
    const c = bytes[i];
    if (WS.has(c)) {
      i++;
      continue;
    }
    if (c === 0x23) {
      // '#'
      while (i < bytes.length && bytes[i] !== 0x0a) i++;
      continue;
    }
    break;
  }
  return i;
}

/** 读一个十进制整数 token */
function readInt(bytes: Uint8Array, pos: number): { value: number; next: number } {
  let i = skipSpace(bytes, pos);
  let v = 0;
  const start = i;
  while (i < bytes.length && bytes[i] >= 0x30 && bytes[i] <= 0x39) {
    v = v * 10 + (bytes[i] - 0x30);
    i++;
  }
  if (i === start) throw new Error("Netpbm 头缺少整数");
  return { value: v, next: i };
}

/**
 * 解码 Netpbm 位图。
 *
 * @param buf 文件字节
 * @returns 统一 RGBA 位图
 * @throws 当 magic 不是 P1–P6，或数据长度不足时
 */
export function decodeNetpbm(buf: ArrayBuffer): RasterImage {
  const b = new Uint8Array(buf);
  if (b.length < 2 || b[0] !== 0x50) throw new Error("不是 Netpbm 文件（缺少 P 魔数）");

  let pos = 1;
  const magic = String.fromCharCode(b[0], b[1]);
  if (magic < "P1" || magic > "P6" || !(magic[1] >= "1" && magic[1] <= "6")) {
    throw new Error(`不支持的 Netpbm 变体：${magic}`);
  }
  pos = 2;

  const wRes = readInt(b, pos);
  const width = wRes.value;
  const hRes = readInt(b, wRes.next);
  const height = hRes.value;
  pos = hRes.next;

  const ascii = magic === "P1" || magic === "P2" || magic === "P3";
  const isBitmap = magic === "P1" || magic === "P4";
  let maxval = 1;
  if (!isBitmap) {
    const m = readInt(b, pos);
    maxval = m.value;
    pos = m.next;
  }
  if (width <= 0 || height <= 0) throw new Error("Netpbm 头里的宽高非法");
  if (maxval <= 0) throw new Error("Netpbm 头里的 maxval 非法");

  const data = new Uint8ClampedArray(width * height * 4);
  const scale = (v: number): number => Math.round((v * 255) / maxval);

  if (ascii) {
    const total = width * height * (isBitmap ? 1 : magic === "P2" ? 1 : 3);
    let p = pos;
    for (let i = 0; i < total; i++) {
      const r = readInt(b, p);
      p = r.next;
      const px = (i / (isBitmap ? 1 : magic === "P2" ? 1 : 3)) | 0;
      const ch = i % (isBitmap ? 1 : magic === "P2" ? 1 : 3);
      const o = px * 4;
      if (isBitmap) {
        const v = r.value ? 0 : 255; // P1：1 表示黑
        data[o] = data[o + 1] = data[o + 2] = v;
      } else if (magic === "P2") {
        data[o] = data[o + 1] = data[o + 2] = scale(r.value);
      } else {
        data[o + ch] = scale(r.value);
      }
      data[o + 3] = 255;
    }
    return { width, height, data };
  }

  // 二进制：maxval 后恰好一个空白字符
  while (pos < b.length && WS.has(b[pos])) {
    pos++;
    break;
  }

  if (magic === "P4") {
    const rowBytes = (width + 7) >> 3;
    if (b.length < pos + rowBytes * height) throw new Error("Netpbm P4 数据长度不足");
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bit = (b[pos + y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
        const v = bit ? 0 : 255; // 1 = 黑
        const o = (y * width + x) * 4;
        data[o] = data[o + 1] = data[o + 2] = v;
        data[o + 3] = 255;
      }
    }
    return { width, height, data };
  }

  const twoBytes = maxval > 255;
  const channels = magic === "P5" ? 1 : 3;
  const need = width * height * channels * (twoBytes ? 2 : 1);
  if (b.length < pos + need) throw new Error("Netpbm 二进制数据长度不足");

  let i = pos;
  const readSample = (): number => {
    const v = twoBytes ? (b[i] << 8) | b[i + 1] : b[i];
    i += twoBytes ? 2 : 1;
    return v;
  };
  for (let px = 0; px < width * height; px++) {
    const o = px * 4;
    if (channels === 1) {
      const v = scale(readSample());
      data[o] = data[o + 1] = data[o + 2] = v;
    } else {
      data[o] = scale(readSample());
      data[o + 1] = scale(readSample());
      data[o + 2] = scale(readSample());
    }
    data[o + 3] = 255;
  }
  return { width, height, data };
}
