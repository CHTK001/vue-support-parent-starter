/**
 * TGA（Truevision Targa）图像解码器 —— 纯 TypeScript，零依赖。
 *
 * <p>浏览器至今不原生解码 TGA（{@code <img>} 只认 PNG/JPEG/WebP/GIF/SVG 等），
 * TGA 落到原生图片通道只会得到一张「图片加载失败」。这里在浏览器里直接解像素，
 * 输出 {@link ImageData}，由面板画到 canvas 上，不经后端、不新增依赖。</p>
 *
 * <p><b>覆盖 TGA 2.0 的常见子集</b>（覆盖绝大多数实际文件）：</p>
 * <ul>
 *   <li>图像类型：1（调色板）、2（未压缩真彩）、3（未压缩灰度）、
 *       9（RLE 调色板）、10（RLE 真彩）、11（RLE 灰度）；</li>
 *   <li>像素位深：16 / 24 / 32（真彩），8（调色板 / 灰度）；</li>
 *   <li>调色板表项位深：15 / 16 / 24 / 32；</li>
 *   <li>来源标志：bit5 顶/底来源（底来源竖直翻转）、bit4 右/左来源（水平翻转）；</li>
 *   <li>16 位真彩按 5551（X1R5G5B5）展开为 RGBA。</li>
 * </ul>
 *
 * <p>头 18 字节与像素数据均为小端（TGA 规范固定小端，与机器字节序无关）。</p>
 *
 * @author CH
 * @since 2026/10/08
 */

/** TGA 文件头固定长度（字节） */
const HEADER_SIZE = 18;

/** 本解码器支持的图像类型：1/2/3 未压缩，9/10/11 为对应类型的 RLE */
const SUPPORTED_TYPES = new Set<number>([1, 2, 3, 9, 10, 11]);

/** 基类型（去掉 RLE +8 的偏移）：1 调色板 / 2 真彩 / 3 灰度 */
type TgaBaseType = 1 | 2 | 3;

/** TGA 解码元信息（供统计条展示） */
export interface TgaInfo {
  /** 图像宽度（像素） */
  width: number;
  /** 图像高度（像素） */
  height: number;
  /** 原始图像类型字段（1/2/3/9/10/11） */
  imageType: number;
  /** 是否为 RLE 压缩 */
  compressed: boolean;
  /** 像素位深（8 / 16 / 24 / 32） */
  pixelDepth: number;
  /** 色彩模型：调色板 / 真彩 / 灰度 */
  colorModel: "colormap" | "truecolor" | "grayscale";
  /** 是否带调色板表 */
  hasColormap: boolean;
  /** 调色板表项位深（无调色板时为 0） */
  colormapDepth: number;
  /** 是否为顶来源（false 表示底来源，已做竖直翻转） */
  topOrigin: boolean;
}

/** TGA 解码结果 */
export interface TgaDecodeResult {
  /** 解码后的 RGBA 像素，可直接 putImageData */
  imageData: ImageData;
  /** 元信息 */
  info: TgaInfo;
}

/**
 * 抛出统一前缀的解码错误。
 *
 * <p>文案口径与其它预览面板一致：{@code 不是有效的 TGA 图像（具体原因）}。</p>
 *
 * @param detail 具体原因
 */
function invalid(detail: string): never {
  throw new Error(`不是有效的 TGA 图像（${detail}）`);
}

/**
 * 5 位分量扩到 8 位（高位复制到低位，保证 0x1F → 255）。
 *
 * @param v 5 位分量（0~31）
 * @returns 8 位分量（0~255）
 */
function expand5(v: number): number {
  return (v << 3) | (v >> 2);
}

/**
 * 解码一段 TGA 字节。
 *
 * <p>同步执行：TGA 通常不大，配合面板的像素上限即可；解出的
 * {@link ImageData} 由面板负责在 canvas 上绘制与旋转。</p>
 *
 * @param buffer TGA 文件字节（ArrayBuffer 或已就位的视图）
 * @returns 解码结果（RGBA 像素 + 元信息）
 * @throws Error 头/像素数据非法时抛出中文错误（前缀「不是有效的 TGA 图像」）
 */
export function decodeTga(buffer: ArrayBuffer | Uint8Array): TgaDecodeResult {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < HEADER_SIZE) {
    invalid("文件头不完整");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  /* ---------- 头字段（均为小端） ---------- */
  const idLength = bytes[0];
  const colormapType = bytes[1];
  const imageType = bytes[2];
  const colormapOrigin = view.getUint16(3, true);
  const colormapLength = view.getUint16(5, true);
  const colormapDepth = bytes[7];
  const width = view.getUint16(12, true);
  const height = view.getUint16(14, true);
  const pixelDepth = bytes[16];
  const descriptor = bytes[17];

  /* ---------- 头校验 ---------- */
  if (!SUPPORTED_TYPES.has(imageType)) {
    invalid(`不支持的图像类型 ${imageType}`);
  }
  if (width === 0 || height === 0) {
    invalid("图像宽或高为 0");
  }
  const compressed = imageType >= 9;
  const baseType = (compressed ? imageType - 8 : imageType) as TgaBaseType;

  if (baseType === 2 && pixelDepth !== 16 && pixelDepth !== 24 && pixelDepth !== 32) {
    invalid(`真彩图不支持 ${pixelDepth} 位色深`);
  }
  if (baseType === 1 && pixelDepth !== 8) {
    invalid(`调色板图不支持 ${pixelDepth} 位色深`);
  }
  if (baseType === 3 && pixelDepth !== 8) {
    invalid(`灰度图不支持 ${pixelDepth} 位色深`);
  }
  const hasColormap = baseType === 1;
  if (hasColormap && colormapType !== 1) {
    invalid("使用调色板但文件未标注调色板数据");
  }
  if (hasColormap && colormapLength === 0) {
    invalid("调色板长度为 0");
  }
  // descriptor 低 4 位 = 像素 alpha 位数：为 0 表示第 4/最高位是保留位，按不透明处理
  const alphaBits = descriptor & 0x0f;

  /* ---------- 数据区定位 ---------- */
  const bytesPerPixel = Math.ceil(pixelDepth / 8);
  const colormapEntrySize = hasColormap || colormapType === 1 ? Math.ceil(colormapDepth / 8) : 0;
  const colormapStart = HEADER_SIZE + idLength;
  const pixelStart =
    colormapStart + (colormapType === 1 ? colormapLength * colormapEntrySize : 0);
  if (pixelStart > bytes.length) {
    invalid("文件头声明的数据长度超出文件大小");
  }

  /* ---------- 调色板（按绝对索引存放，支持 origin 偏移） ---------- */
  let palette: Uint8ClampedArray | null = null;
  if (hasColormap) {
    palette = new Uint8ClampedArray((colormapOrigin + colormapLength) * 4);
    if (colormapStart + colormapLength * colormapEntrySize > bytes.length) {
      invalid("调色板数据不完整");
    }
    for (let i = 0; i < colormapLength; i++) {
      const p = colormapStart + i * colormapEntrySize;
      const o = (colormapOrigin + i) * 4;
      if (colormapDepth === 24 || colormapDepth === 32) {
        palette[o] = bytes[p + 2];
        palette[o + 1] = bytes[p + 1];
        palette[o + 2] = bytes[p];
        palette[o + 3] = colormapDepth === 32 && alphaBits > 0 ? bytes[p + 3] : 255;
      } else if (colormapDepth === 15 || colormapDepth === 16) {
        const v = bytes[p] | (bytes[p + 1] << 8);
        palette[o] = expand5((v >> 10) & 0x1f);
        palette[o + 1] = expand5((v >> 5) & 0x1f);
        palette[o + 2] = expand5(v & 0x1f);
        palette[o + 3] = colormapDepth === 16 && alphaBits > 0 && (v & 0x8000) === 0 ? 0 : 255;
      } else {
        invalid(`不支持的调色板位深 ${colormapDepth}`);
      }
    }
  }

  /* ---------- 取出原始像素（未压缩直接拷，RLE 逐包展开） ---------- */
  const totalPixels = width * height;
  const raw = new Uint8Array(totalPixels * bytesPerPixel);
  if (!compressed) {
    if (pixelStart + raw.length > bytes.length) {
      invalid("像素数据不完整");
    }
    raw.set(bytes.subarray(pixelStart, pixelStart + raw.length));
  } else {
    let src = pixelStart;
    let dst = 0;
    while (dst < raw.length) {
      if (src >= bytes.length) {
        invalid("像素数据不完整（RLE 流提前结束）");
      }
      const packet = bytes[src++];
      const count = (packet & 0x7f) + 1;
      if ((packet & 0x80) !== 0) {
        // 游程包：后跟 1 个像素值，重复 count 次
        if (src + bytesPerPixel > bytes.length) {
          invalid("像素数据不完整（RLE 游程越界）");
        }
        for (let i = 0; i < count && dst < raw.length; i++) {
          for (let b = 0; b < bytesPerPixel; b++) {
            raw[dst + b] = bytes[src + b];
          }
          dst += bytesPerPixel;
        }
        src += bytesPerPixel;
      } else {
        // 原始包：后跟 count 个像素值
        const need = count * bytesPerPixel;
        if (src + need > bytes.length) {
          invalid("像素数据不完整（RLE 原始块越界）");
        }
        const copy = Math.min(need, raw.length - dst);
        raw.set(bytes.subarray(src, src + copy), dst);
        dst += need;
        src += need;
      }
    }
  }

  /* ---------- 原始像素 → RGBA，并按来源标志纠正方向 ---------- */
  const out = new Uint8ClampedArray(totalPixels * 4);
  const topOrigin = (descriptor & 0x20) !== 0;
  const rightOrigin = (descriptor & 0x10) !== 0;
  const paletteEntries = palette ? palette.length / 4 : 0;

  for (let y = 0; y < height; y++) {
    // 底来源（bit5=0，最常见的默认）需竖直翻转，保证画面正立
    const fileRow = topOrigin ? y : height - 1 - y;
    const rowBase = fileRow * width * bytesPerPixel;
    const outRow = y * width;
    for (let x = 0; x < width; x++) {
      // 右来源（bit4=1）为右到左存储，需水平翻转
      const fileCol = rightOrigin ? width - 1 - x : x;
      const p = rowBase + fileCol * bytesPerPixel;
      const o = (outRow + x) * 4;

      if (baseType === 1) {
        const idx = raw[p];
        if (idx >= paletteEntries) {
          out[o + 3] = 255;
          continue;
        }
        const po = idx * 4;
        out[o] = palette![po];
        out[o + 1] = palette![po + 1];
        out[o + 2] = palette![po + 2];
        out[o + 3] = palette![po + 3];
      } else if (baseType === 3) {
        const g = raw[p];
        out[o] = g;
        out[o + 1] = g;
        out[o + 2] = g;
        out[o + 3] = 255;
      } else if (pixelDepth === 24) {
        out[o] = raw[p + 2];
        out[o + 1] = raw[p + 1];
        out[o + 2] = raw[p];
        out[o + 3] = 255;
      } else if (pixelDepth === 32) {
        out[o] = raw[p + 2];
        out[o + 1] = raw[p + 1];
        out[o + 2] = raw[p];
        // alpha 位数为 0 时第 4 字节为保留位，按不透明处理，避免整图透出
        out[o + 3] = alphaBits > 0 ? raw[p + 3] : 255;
      } else {
        // 16 位：X1R5G5B5（5551）
        const v = raw[p] | (raw[p + 1] << 8);
        out[o] = expand5((v >> 10) & 0x1f);
        out[o + 1] = expand5((v >> 5) & 0x1f);
        out[o + 2] = expand5(v & 0x1f);
        out[o + 3] = alphaBits > 0 && (v & 0x8000) === 0 ? 0 : 255;
      }
    }
  }

  const info: TgaInfo = {
    width,
    height,
    imageType,
    compressed,
    pixelDepth,
    colorModel: baseType === 1 ? "colormap" : baseType === 2 ? "truecolor" : "grayscale",
    hasColormap,
    colormapDepth: hasColormap ? colormapDepth : 0,
    topOrigin,
  };
  return { imageData: new ImageData(out, width, height), info };
}
