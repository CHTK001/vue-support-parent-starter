/**
 * 图片元信息探测（原始宽高 + 文件总字节数）
 *
 * <p><b>为什么需要它</b>：dev 下 {@code /fs/**} 全部经 Vite 代理转发到<b>远端</b>文件
 * 服务器（见 vite.config.ts 的 fileStorageTarget），实测下行带宽只有 ~40KB/s。
 * 一张 1024×1024 的 PNG 原图 2MB，大图标卡片里的显示框只有 86px —— 直接把原图
 * 当缩略图拉，单张要 50 秒以上，5 张图的首屏就是「一直转圈」。
 *
 * <p>服务端（{@code FileStorageServerFilter#applyFileOperations}）支持
 * {@code ?preview=true&size=WxH} 现场缩放，但 {@code JdkImageOperation.resize}
 * 走的是 {@code BufferedImageUtils.scaleImage(img, w, h)}，是<b>直接拉伸到 W×H</b>，
 * 不保比例。所以要拿到既小又不走形的缩略图，前端必须先知道原图宽高，才能算出
 * 等比的目标尺寸 —— 这就是本模块的职责。
 *
 * <p><b>怎么做到便宜</b>：只发一次 {@code Range: bytes=0-4095} 的请求，从文件头
 * 解析宽高（PNG/GIF/BMP/WebP/JPEG 的 IHDR、逻辑屏、SOF 段都在前几 KB 内），
 * 顺手用 {@code Content-Range} 里的大小拿到文件总字节数。实测同样一张图，
 * 取 2KB 头约 0.9s，而取整张 2MB 要 50s+。
 *
 * @author Buffy
 * @since 2026/11/04
 */

/** 图片原始尺寸与字节数 */
export interface ImageMeta {
  /** 原始宽度（像素） */
  width: number;
  /** 原始高度（像素） */
  height: number;
  /** 文件总字节数；服务端没给 Content-Range 时为 0 */
  bytes: number;
  /**
   * 源图是否可能带透明通道
   *
   * <p>用途只有一个：决定能不能让服务端把这张图**转成 JPEG** 再回传。
   * JPEG 没有 alpha，后端 {@code encode()} 直接把 ARGB 位图交给 JPEG writer，
   * 透明像素会被写成黑色 —— 全是纯色背景的截图无所谓，图标/贴纸直接黑底。</p>
   *
   * <p>所以头解析能确认「一定是 RGB」时才为 {@code false}：PNG 色彩类型 0/2
   * 且窗口内无 {@code tRNS}、JPEG、24 位 BMP；调色板 PNG、GIF、带 alpha 的 WebP
   * 一律按「可能透明」处理，宁可多传几十 KB 也不出黑底。</p>
   */
  alpha: boolean;
}

/** 头解析得到的尺寸信息（{@link ImageMeta} 的子集） */
interface ParsedSize {
  /** 宽度（像素） */
  width: number;
  /** 高度（像素） */
  height: number;
  /** 是否可能带透明通道 */
  alpha: boolean;
}

/** 首次探测的窗口大小：足够覆盖 PNG/GIF/BMP/WebP 的头部与多数 JPEG 的 SOF 段 */
const PROBE_WINDOW = 4096;

/** JPEG 带大 EXIF/ICC 时 SOF 会被推到更后面，命中失败时再取一次更大窗口 */
const PROBE_WINDOW_LARGE = 65536;

/** 探测结果的进程内缓存：key 由调用方给（用对象 Key，票据每次签发都会变） */
const metaCache = new Map<string, ImageMeta>();

/** 缓存条目上限：只是为了避免目录越翻越大，命中率不敏感 */
const META_CACHE_LIMIT = 512;

/** 在途探测（单飞）：同一对象的并发探测共用一次 4KB Range 请求 */
const inFlight = new Map<string, Promise<ImageMeta | null>>();

/**
 * 从图片文件头解析宽高与透明通道标记
 *
 * <p>只认「头里就写着尺寸」的格式；解析不出来返回 null，调用方据此退回原图。</p>
 *
 * @param buf 文件头字节
 * @returns 宽高与 alpha 标记；无法识别返回 null
 */
export function parseImageSize(buf: Uint8Array): ParsedSize | null {
  if (buf.length < 24) {
    return null;
  }
  // PNG：8 字节签名 + IHDR，宽高在固定的 16..24，色彩类型在第 26 字节
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[12] === 0x49 && buf[13] === 0x48 && buf[14] === 0x44 && buf[15] === 0x52
  ) {
    const width = readU32BE(buf, 16);
    const height = readU32BE(buf, 20);
    if (!(width > 0 && height > 0)) {
      return null;
    }
    // IHDR 结构：width(4) height(4) bitDepth(1) colorType(1)
    // colorType 4=灰度+alpha、6=RGBA 一定带 alpha；3=调色板，是否透明取决于 tRNS 块
    const colorType = buf[25];
    const alpha = colorType === 4 || colorType === 6
      || (colorType === 3 && indexOfAscii(buf, "tRNS") >= 0);
    return { width, height, alpha };
  }
  // GIF：逻辑屏宽高是小端 16 位；透明色由一个 Graphic Control Extension 声明
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    const width = buf[6] | (buf[7] << 8);
    const height = buf[8] | (buf[9] << 8);
    if (!(width > 0 && height > 0)) {
      return null;
    }
    return { width, height, alpha: hasGifTransparency(buf) };
  }
  // BMP：BITMAPINFOHEADER 的宽高
  if (buf[0] === 0x42 && buf[1] === 0x4d) {
    const width = readI32LE(buf, 18);
    // 高度为负表示自上而下存储，取绝对值
    const height = Math.abs(readI32LE(buf, 22));
    if (!(width > 0 && height > 0)) {
      return null;
    }
    // 32 位 BMP 的第四个字节常被当 alpha 用（也可能只是填充），按「可能透明」处理
    const bpp = buf[28] | (buf[29] << 8);
    return { width, height, alpha: bpp === 32 };
  }
  // WebP：RIFF....WEBP，再按 VP8 / VP8L / VP8X 三种块分别取
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    const webp = parseWebpSize(buf);
    if (webp) {
      return webp;
    }
  }
  // JPEG：没有统一头部，要顺序跳过各段直到 SOFn；JPEG 本身不带 alpha
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    const size = parseJpegSize(buf);
    return size ? { ...size, alpha: false } : null;
  }
  return null;
}

/**
 * 在字节窗口里找一段 ASCII 标记（用于 PNG 的 {@code tRNS} 块、GIF 的透明标记）
 *
 * @param buf 文件头字节
 * @param text 标记文本
 * @returns 首次出现的下标；找不到返回 -1
 */
function indexOfAscii(buf: Uint8Array, text: string): number {
  const first = text.charCodeAt(0);
  const last = buf.length - text.length;
  outer: for (let i = 0; i <= last; i++) {
    if (buf[i] !== first) {
      continue;
    }
    for (let j = 1; j < text.length; j++) {
      if (buf[i + j] !== text.charCodeAt(j)) {
        continue outer;
      }
    }
    return i;
  }
  return -1;
}

/**
 * GIF 是否声明了透明色
 *
 * <p>只扫文件头窗口里的 Graphic Control Extension（{@code 0x21 0xF9 0x04}），
 * 其 packed 字段最低位为 1 表示「启用透明色索引」。窗口内没有 GCE 时按不透明处理
 * —— 静态 GIF 的 GCE 一定在第一个图像块之前，正常都能命中。</p>
 *
 * @param buf 文件头字节
 * @returns 是否可能带透明
 */
function hasGifTransparency(buf: Uint8Array): boolean {
  for (let i = 0; i + 3 < buf.length; i++) {
    if (buf[i] === 0x21 && buf[i + 1] === 0xf9 && buf[i + 2] === 0x04) {
      return (buf[i + 3] & 0x01) === 1;
    }
  }
  return false;
}

/**
 * 解析 WebP 尺寸
 *
 * @param buf 文件头字节
 * @returns 宽高与 alpha 标记；块类型不认识返回 null
 */
function parseWebpSize(buf: Uint8Array): ParsedSize | null {
  const fourcc = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
  if (fourcc === "VP8X" && buf.length >= 30) {
    // 扩展格式：canvas 宽高各 24 位，存的是「实际值 - 1」；flags 第 4 位是 alpha
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    if (!(width > 0 && height > 0)) {
      return null;
    }
    // flags 在 chunk 头的第 20 字节（VP8X 载荷首字节），bit4 = ALPHA
    return { width, height, alpha: (buf[20] & 0x10) !== 0 };
  }
  if (fourcc === "VP8 " && buf.length >= 30) {
    // 有损格式：帧头 10 字节之后是 14 位宽高（小端，低 14 位有效）
    const width = (buf[26] | (buf[27] << 8)) & 0x3fff;
    const height = (buf[28] | (buf[29] << 8)) & 0x3fff;
    if (!(width > 0 && height > 0)) {
      return null;
    }
    return { width, height, alpha: false };
  }
  if (fourcc === "VP8L" && buf.length >= 25) {
    // 无损格式：签名 0x2f 之后 28 位里塞了 w-1 / h-1（各 14 位）
    const bits = buf[21] | (buf[22] << 8) | (buf[23] << 16) | (buf[24] << 24);
    const width = 1 + (bits & 0x3fff);
    const height = 1 + ((bits >>> 14) & 0x3fff);
    if (!(width > 0 && height > 0)) {
      return null;
    }
    // VP8L 头里 alpha_is_used 在 bit 28
    return { width, height, alpha: ((bits >>> 28) & 0x01) === 1 };
  }
  return null;
}

/**
 * 解析 JPEG 尺寸（顺序扫描段，直到遇到 SOFn）
 *
 * @param buf 文件头字节
 * @returns 宽高；窗口内没有 SOF 段返回 null
 */
function parseJpegSize(buf: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // 填充字节 0xFF 与无长度字段的独立标记（SOI/EOI/RSTn/TEM）
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = (buf[i + 2] << 8) | buf[i + 3];
    if (len < 2) {
      return null;
    }
    // SOF0..SOF15，但 C4(DHT)/C8(JPG)/CC(DAC) 不是帧头
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      const height = (buf[i + 5] << 8) | buf[i + 6];
      const width = (buf[i + 7] << 8) | buf[i + 8];
      return width > 0 && height > 0 ? { width, height } : null;
    }
    i += 2 + len;
  }
  return null;
}

/**
 * 读大端 32 位
 *
 * @param buf 字节
 * @param offset 偏移
 * @returns 无符号整数值
 */
function readU32BE(buf: Uint8Array, offset: number): number {
  return ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0;
}

/**
 * 读小端 32 位
 *
 * @param buf 字节
 * @param offset 偏移
 * @returns 有符号整数值
 */
function readI32LE(buf: Uint8Array, offset: number): number {
  return buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24);
}

/**
 * 探测一张图片的原始宽高与字节数
 *
 * <p>只取文件头（一次 {@code Range} 请求），拿不到 SOF 的 JPEG 会自动扩大窗口再取一次。
 * 任何一步失败都返回 null —— 调用方据此退回「直接拉原图」，缩略图降级但不破图。</p>
 *
 * <p>同一对象的并发探测共用一次请求（单飞）：大图标视图的预热与「打开预览时的探测」
 * 会同时发生，没有单飞就会对同一个 Key 打出两次 4KB Range。</p>
 *
 * @param url      已签名直链（带 {@code ?preview=true} 等参数）
 * @param cacheKey 缓存键（用对象 Key，避免票据轮换导致缓存失效）
 * @returns 元信息；探测失败返回 null
 */
export async function probeImageMeta(url: string, cacheKey: string): Promise<ImageMeta | null> {
  const hit = metaCache.get(cacheKey);
  if (hit) {
    return hit;
  }
  const running = inFlight.get(cacheKey);
  if (running) {
    return running;
  }
  const task = probeUncached(url, cacheKey).finally(() => {
    if (inFlight.get(cacheKey) === task) {
      inFlight.delete(cacheKey);
    }
  });
  inFlight.set(cacheKey, task);
  return task;
}

/**
 * 真正发请求的探测实现（不含缓存与单飞）
 *
 * @param url      已签名直链
 * @param cacheKey 缓存键
 * @returns 元信息；探测失败返回 null
 */
async function probeUncached(url: string, cacheKey: string): Promise<ImageMeta | null> {
  const head = await fetchHead(url, PROBE_WINDOW);
  if (!head) {
    return null;
  }
  let size = parseImageSize(head.buf);
  if (!size && head.bytes > PROBE_WINDOW) {
    // JPEG 的 SOF 段可能被大片 EXIF 缩略图推到窗口之外，扩大一次再试
    const large = await fetchHead(url, PROBE_WINDOW_LARGE);
    if (large) {
      size = parseImageSize(large.buf);
      if (size) {
        return cache(withAlpha(size, large.bytes), cacheKey);
      }
    }
  }
  if (!size) {
    return null;
  }
  return cache(withAlpha(size, head.bytes), cacheKey);
}

/**
 * 头解析结果 + 文件总长 → {@link ImageMeta}
 *
 * @param size  头解析结果
 * @param bytes 文件总字节数（未知为 0）
 * @returns 元信息
 */
function withAlpha(size: ParsedSize, bytes: number): ImageMeta {
  return { width: size.width, height: size.height, bytes, alpha: size.alpha };
}

/**
 * 读探测缓存（不发起任何请求）
 *
 * <p>大图标视图已经为每张图探过一次，打开预览时直接命中，省掉一次 4KB 往返 ——
 * 这一往返在远端带宽下约 0.9s，而它挡在「第一张可看的图」前面。</p>
 *
 * @param cacheKey 缓存键（对象 Key）
 * @returns 已缓存的元信息；未探测过返回 null
 */
export function peekImageMeta(cacheKey: string): ImageMeta | null {
  return metaCache.get(cacheKey) ?? null;
}

/**
 * 取文件头部若干字节
 *
 * @param url    直链
 * @param length 期望字节数
 * @returns 头部字节与文件总长；请求失败返回 null
 */
async function fetchHead(url: string, length: number): Promise<{ buf: Uint8Array; bytes: number } | null> {
  try {
    const res = await fetch(url, { headers: { Range: `bytes=0-${length - 1}` } });
    if (!res.ok) {
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    let bytes = Number(res.headers.get("content-length") ?? 0) || 0;
    // 206 时 content-length 是这一段的长度，总长得从 Content-Range 里取
    const range = res.headers.get("content-range") ?? "";
    const total = /\/(\d+)\s*$/.exec(range);
    if (total) {
      bytes = Number(total[1]);
    }
    return { buf, bytes };
  } catch {
    return null;
  }
}

/**
 * 写缓存（超过上限时丢最早的条目）
 *
 * @param meta  元信息
 * @param key   缓存键
 * @returns 原样返回 meta，便于链式使用
 */
function cache(meta: ImageMeta, key: string): ImageMeta {
  if (metaCache.size >= META_CACHE_LIMIT) {
    const oldest = metaCache.keys().next();
    if (!oldest.done) {
      metaCache.delete(oldest.value);
    }
  }
  metaCache.set(key, meta);
  return meta;
}

/**
 * 清空探测缓存（目录内容变化、文件被覆盖后调用）
 */
export function clearImageMetaCache(): void {
  metaCache.clear();
  inFlight.clear();
}

/**
 * 按「长边不超过 edge」算出等比的目标尺寸
 *
 * <p>服务端 {@code size=WxH} 是硬拉伸，所以这里必须给出<b>原比例</b>的 W 和 H，
 * 否则 4:3 的图会被压成正方形。原图本来就不超过 edge 时返回 null（不必缩）。</p>
 *
 * @param meta 原始尺寸
 * @param edge 目标长边（像素）
 * @returns {@code "WxH"}；无需缩放返回 null
 */
export function fitSizeExpr(meta: ImageMeta, edge: number): string | null {
  const longEdge = Math.max(meta.width, meta.height);
  if (longEdge <= edge) {
    return null;
  }
  const k = edge / longEdge;
  const width = Math.max(1, Math.round(meta.width * k));
  const height = Math.max(1, Math.round(meta.height * k));
  return `${width}x${height}`;
}
