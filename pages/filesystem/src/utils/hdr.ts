/**
 * Radiance HDR（{@code .hdr} / {@code .rgbe}）解码。
 *
 * <p>为什么自研：浏览器不认 Radiance RGBE，file-viewer 也没有 image registry 项。
 * 格式本身不复杂：文本头 + 每扫描线的 RGBE 编码（或 RLE），把共享指数还原成浮点
 * 辐亮度后做一次色调映射即可显示。</p>
 *
 * <p><b>编码要点</b>：每个像素 4 字节 {@code R G B E}，实际值
 * {@code (R+0.5)/256 * 2^(E-128)}；当扫描线前四字节满足
 * {@code 2,2,hi,lo} 且 {@code (hi<<8)|lo == width}（width ∈ [8, 32767]）时为
 * **新式 RLE**：4 个通道各自编码，{@code count>128} 表示游程、否则表示字面量长度。</p>
 *
 * <p><b>色调映射</b>：用 Reinhard {@code c/(1+c)} 压缩高动态范围，再按 gamma 2.2
 * 转 sRGB。这是「看得到内容」的取舍，不做曝光控制。</p>
 */

import type { RasterImage } from "./netpbm";

/** 读取一行 ASCII 头（到换行为止） */
function readLine(b: Uint8Array, pos: number): { line: string; next: number } {
  let i = pos;
  while (i < b.length && b[i] !== 0x0a) i++;
  const line = new TextDecoder("latin1").decode(b.subarray(pos, i)).replace(/\r$/, "");
  return { line, next: Math.min(b.length, i + 1) };
}

/** RGBE → 8 位 sRGB（Reinhard + gamma 2.2） */
function toneMap(r: number, g: number, bl: number): [number, number, number] {
  const f = (c: number): number => {
    const x = c / (1 + c);
    return Math.round(Math.pow(x, 1 / 2.2) * 255);
  };
  return [f(r), f(g), f(bl)];
}

/**
 * 解码 Radiance HDR。
 *
 * @param buf 文件字节
 * @returns 统一 RGBA 位图（已色调映射）
 * @throws 当头非法、分辨率行缺失或数据长度不足时
 */
export function decodeHdr(buf: ArrayBuffer): RasterImage {
  const b = new Uint8Array(buf);
  if (b.length < 10) throw new Error("文件过小，不是有效的 HDR");

  let pos = 0;
  const first = readLine(b, pos);
  if (!/^#\?(RADIANCE|RGBE)/.test(first.line)) {
    throw new Error("不是 Radiance HDR（缺少 #?RADIANCE 头）");
  }
  pos = first.next;

  // 头部键值直到空行
  for (let guard = 0; guard < 64; guard++) {
    const l = readLine(b, pos);
    pos = l.next;
    if (l.line === "") break;
    if (pos >= b.length) throw new Error("HDR 头未结束");
  }

  const resLine = readLine(b, pos);
  pos = resLine.next;
  const m = /^([+-])Y\s+(\d+)\s+([+-])X\s+(\d+)$/.exec(resLine.line.trim());
  if (!m) throw new Error(`HDR 分辨率行非法：${resLine.line}`);
  const height = Number(m[2]);
  const width = Number(m[4]);
  if (!height || !width) throw new Error("HDR 分辨率非法");

  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const rowStart = y * width * 4;
    // 新式 RLE 判定
    if (
      pos + 4 <= b.length &&
      b[pos] === 2 &&
      b[pos + 1] === 2 &&
      (((b[pos + 2] << 8) | b[pos + 3]) === width) &&
      width >= 8 &&
      width < 0x8000
    ) {
      pos += 4;
      const chans: Uint8Array[] = [
        new Uint8Array(width),
        new Uint8Array(width),
        new Uint8Array(width),
        new Uint8Array(width),
      ];
      for (let c = 0; c < 4; c++) {
        let x = 0;
        while (x < width) {
          if (pos >= b.length) throw new Error("HDR RLE 数据截断");
          const count = b[pos++];
          if (count > 128) {
            const run = count - 128;
            if (pos >= b.length) throw new Error("HDR RLE 数据截断");
            const v = b[pos++];
            for (let k = 0; k < run && x < width; k++) chans[c][x++] = v;
          } else {
            for (let k = 0; k < count && x < width; k++) {
              if (pos >= b.length) throw new Error("HDR RLE 数据截断");
              chans[c][x++] = b[pos++];
            }
          }
        }
      }
      for (let x = 0; x < width; x++) {
        const e = chans[3][x];
        const o = rowStart + x * 4;
        if (e) {
          const f = Math.pow(2, e - 136);
          const [r, g, bl] = toneMap(
            (chans[0][x] + 0.5) * f,
            (chans[1][x] + 0.5) * f,
            (chans[2][x] + 0.5) * f,
          );
          data[o] = r;
          data[o + 1] = g;
          data[o + 2] = bl;
        }
        data[o + 3] = 255;
      }
    } else {
      // 平坦 RGBE：每像素 4 字节
      if (pos + width * 4 > b.length) throw new Error("HDR 数据长度不足");
      for (let x = 0; x < width; x++) {
        const e = b[pos + 3];
        const o = rowStart + x * 4;
        if (e) {
          const f = Math.pow(2, e - 136);
          const [r, g, bl] = toneMap(
            (b[pos] + 0.5) * f,
            (b[pos + 1] + 0.5) * f,
            (b[pos + 2] + 0.5) * f,
          );
          data[o] = r;
          data[o + 1] = g;
          data[o + 2] = bl;
        }
        data[o + 3] = 255;
        pos += 4;
      }
    }
  }

  return { width, height, data };
}
