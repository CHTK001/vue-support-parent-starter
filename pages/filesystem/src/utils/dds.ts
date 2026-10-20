/**
 * DirectDraw Surface（{@code .dds}）解码。
 *
 * <p>为什么自研：DDS 是 DXT/BC 压缩纹理的标准容器（3D 贴图、游戏资源、部分 CAD
 * 贴图），浏览器与 file-viewer 都不认；引入完整 BC 解码器体积过大，而实际预览
 * 只需要「看清贴图内容」，把 BC1/BC2/BC3 解成 RGBA 即可。</p>
 *
 * <p><b>支持范围</b>：</p>
 * <ul>
 *   <li>未压缩 RGB/RGBA（按 dwR/G/B/A BitMask 取位）；</li>
 *   <li>DXT1（BC1，含 1 位透明）、DXT3（BC2 显式 4 位 alpha）、DXT5（BC3 插值 alpha）；</li>
 *   <li>DX10 扩展头里的 BC1/BC2/BC3 与常见 RGBA8 格式。</li>
 * </ul>
 *
 * <p>只解**首级 mipmap**（预览足够），其余层级跳过。</p>
 */

import type { RasterImage } from "./netpbm";

/** 565 展开到 888 */
function rgb565(v: number): [number, number, number] {
  const r = (v >> 11) & 0x1f;
  const g = (v >> 5) & 0x3f;
  const b = v & 0x1f;
  return [(r << 3) | (r >> 2), (g << 2) | (g >> 4), (b << 3) | (b >> 2)];
}

/**
 * 解一个 4x4 颜色块（BC1/BC2/BC3 的颜色部分）。
 *
 * @param fourColor 是否强制四色模式（BC2/BC3 恒为四色）
 */
function decodeColorBlock(
  dv: DataView,
  off: number,
  out: Uint8ClampedArray,
  w: number,
  h: number,
  x0: number,
  y0: number,
  fourColor: boolean,
): void {
  const c0 = dv.getUint16(off, true);
  const c1 = dv.getUint16(off + 2, true);
  const bits = dv.getUint32(off + 4, true);

  const p0 = rgb565(c0);
  const p1 = rgb565(c1);
  const colors: Array<[number, number, number, number]> = [
    [p0[0], p0[1], p0[2], 255],
    [p1[0], p1[1], p1[2], 255],
    [0, 0, 0, 255],
    [0, 0, 0, 255],
  ];

  if (fourColor || c0 > c1) {
    colors[2] = [
      Math.round((2 * p0[0] + p1[0]) / 3),
      Math.round((2 * p0[1] + p1[1]) / 3),
      Math.round((2 * p0[2] + p1[2]) / 3),
      255,
    ];
    colors[3] = [
      Math.round((p0[0] + 2 * p1[0]) / 3),
      Math.round((p0[1] + 2 * p1[1]) / 3),
      Math.round((p0[2] + 2 * p1[2]) / 3),
      255,
    ];
  } else {
    colors[2] = [
      Math.round((p0[0] + p1[0]) / 2),
      Math.round((p0[1] + p1[1]) / 2),
      Math.round((p0[2] + p1[2]) / 2),
      255,
    ];
    // BC1 的三色模式：索引 3 = 全透明
    colors[3] = [0, 0, 0, 0];
  }

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const px = x0 + x;
      const py = y0 + y;
      if (px >= w || py >= h) continue;
      const idx = (bits >> (2 * (y * 4 + x))) & 0x3;
      const c = colors[idx];
      const o = (py * w + px) * 4;
      out[o] = c[0];
      out[o + 1] = c[1];
      out[o + 2] = c[2];
      out[o + 3] = c[3];
    }
  }
}

/** BC2：每像素 4 位显式 alpha */
function decodeAlphaExplicit(
  dv: DataView,
  off: number,
  out: Uint8ClampedArray,
  w: number,
  h: number,
  x0: number,
  y0: number,
): void {
  for (let y = 0; y < 4; y++) {
    const row = dv.getUint16(off + y * 2, true);
    for (let x = 0; x < 4; x++) {
      const px = x0 + x;
      const py = y0 + y;
      if (px >= w || py >= h) continue;
      const a = (row >> (4 * x)) & 0xf;
      out[(py * w + px) * 4 + 3] = a * 17;
    }
  }
}

/** BC3：两个端点 + 每像素 3 位索引 */
function decodeAlphaInterpolated(
  dv: DataView,
  off: number,
  out: Uint8ClampedArray,
  w: number,
  h: number,
  x0: number,
  y0: number,
): void {
  const a0 = dv.getUint8(off);
  const a1 = dv.getUint8(off + 1);
  const alphas = new Array<number>(8);
  alphas[0] = a0;
  alphas[1] = a1;
  if (a0 > a1) {
    for (let i = 1; i <= 6; i++) alphas[i + 1] = Math.round(((7 - i) * a0 + i * a1) / 7);
  } else {
    for (let i = 1; i <= 4; i++) alphas[i + 1] = Math.round(((5 - i) * a0 + i * a1) / 5);
    alphas[6] = 0;
    alphas[7] = 255;
  }

  // 48 位索引：小端跨 6 字节
  let bits = 0n;
  for (let i = 0; i < 6; i++) bits |= BigInt(dv.getUint8(off + 2 + i)) << BigInt(8 * i);

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const px = x0 + x;
      const py = y0 + y;
      if (px >= w || py >= h) continue;
      const idx = Number((bits >> BigInt(3 * (y * 4 + x))) & 0x7n);
      out[(py * w + px) * 4 + 3] = alphas[idx];
    }
  }
}

/** 按位掩码取通道 */
function extract(v: number, mask: number): number {
  if (!mask) return 255;
  let shift = 0;
  let m = mask;
  while ((m & 1) === 0) {
    m >>>= 1;
    shift++;
  }
  const raw = (v >>> shift) & m;
  if (m === 255) return raw;
  return Math.round((raw * 255) / m);
}

/**
 * 解码 DDS。
 *
 * @param buf 文件字节
 * @returns 统一 RGBA 位图
 * @throws 当魔数不符、格式不支持或数据不足时
 */
export function decodeDds(buf: ArrayBuffer): RasterImage {
  const dv = new DataView(buf);
  if (dv.byteLength < 128 || dv.getUint32(0, true) !== 0x20534444) {
    throw new Error("不是 DDS 文件（缺少 DDS 魔数）");
  }
  const height = dv.getInt32(12, true);
  const width = dv.getInt32(16, true);
  if (width <= 0 || height <= 0) throw new Error("DDS 头里的宽高非法");

  const fourCCRaw = dv.getUint32(84, true);
  const bitCount = dv.getUint32(88, true);
  const rMask = dv.getUint32(92, true);
  const gMask = dv.getUint32(96, true);
  const bMask = dv.getUint32(100, true);
  const aMask = dv.getUint32(104, true);

  let off = 128;
  let format = "";

  const chars = String.fromCharCode(
    fourCCRaw & 0xff,
    (fourCCRaw >> 8) & 0xff,
    (fourCCRaw >> 16) & 0xff,
    (fourCCRaw >> 24) & 0xff,
  );

  if (chars === "DX10") {
    if (dv.byteLength < 148) throw new Error("DDS DX10 头不完整");
    const dxgi = dv.getUint32(128, true);
    off = 148;
    // 71/72=BC1, 74/75=BC2, 77/78=BC3, 28=RGBA8, 87=BGRA8
    if (dxgi === 71 || dxgi === 72) format = "DXT1";
    else if (dxgi === 74 || dxgi === 75) format = "DXT3";
    else if (dxgi === 77 || dxgi === 78) format = "DXT5";
    else if (dxgi === 28 || dxgi === 87) format = "RGBA8";
    else throw new Error(`不支持的 DDS DXGI 格式：${dxgi}`);
  } else if (chars === "DXT1" || chars === "DXT3" || chars === "DXT5") {
    format = chars;
  } else if (bitCount === 32 || bitCount === 24) {
    format = "RAW";
  } else {
    throw new Error(`不支持的 DDS 像素格式：${chars || bitCount + "bpp"}`);
  }

  const out = new Uint8ClampedArray(width * height * 4);
  const blockBytes = format === "DXT1" ? 8 : 16;

  if (format === "RAW") {
    const bpp = bitCount / 8;
    if (dv.byteLength < off + width * height * bpp) throw new Error("DDS 像素数据不足");
    for (let i = 0; i < width * height; i++) {
      const p = off + i * bpp;
      const v =
        bpp === 4 ? dv.getUint32(p, true) : dv.getUint8(p) | (dv.getUint8(p + 1) << 8) | (dv.getUint8(p + 2) << 16);
      const o = i * 4;
      out[o] = extract(v, rMask || 0x00ff0000);
      out[o + 1] = extract(v, gMask || 0x0000ff00);
      out[o + 2] = extract(v, bMask || 0x000000ff);
      out[o + 3] = aMask ? extract(v, aMask) : 255;
    }
    return { width, height, data: out };
  }

  const blocksX = Math.ceil(width / 4);
  const blocksY = Math.ceil(height / 4);
  if (dv.byteLength < off + blocksX * blocksY * blockBytes) {
    throw new Error("DDS 压缩数据不足");
  }

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const p = off + (by * blocksX + bx) * blockBytes;
      const x0 = bx * 4;
      const y0 = by * 4;
      if (format === "DXT1") {
        decodeColorBlock(dv, p, out, width, height, x0, y0, false);
      } else if (format === "DXT3") {
        decodeAlphaExplicit(dv, p, out, width, height, x0, y0);
        decodeColorBlock(dv, p + 8, out, width, height, x0, y0, true);
      } else {
        decodeAlphaInterpolated(dv, p, out, width, height, x0, y0);
        decodeColorBlock(dv, p + 8, out, width, height, x0, y0, true);
      }
    }
  }

  return { width, height, data: out };
}
