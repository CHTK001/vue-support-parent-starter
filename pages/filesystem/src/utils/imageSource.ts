/**
 * 图片取数参数构建 + 原图字节缓存
 *
 * <p><b>为什么需要单独一层</b>：dev 下文件服务器的字节要经 Vite 代理从远端拉回，
 * 实测下行只有 ~40KB/s。一张 1024×1024 的 PNG 原图 2MB，光传输就是 50 秒——
 * 这段带宽是整条预览链路上唯一的硬瓶颈，服务端算得再快也没用。因此本模块只做两件事：
 * <b>把要传的字节压到最小</b>（等比缩放到目标像素 + 能转 JPEG 就转 JPEG），
 * 以及<b>把传过的字节留住</b>（同一张图再看一次不再走网络）。</p>
 *
 * <p><b>为什么能转 JPEG</b>：后端 {@code ?preview&size=WxH&format=jpeg&quality=Q}
 * 由 {@code FileStorageServerFilter#applyFileOperations} 现场解码→缩放→重编码，
 * 172px 的 PNG 缩略图约 74~83KB，同尺寸 JPEG 只要 6~10KB，差值就是首屏时间。
 * JPEG 没有 alpha，透明图会被后端写成黑底，所以「能不能转」必须由
 * {@link ImageMeta#alpha} 判定，而不是按扩展名猜。</p>
 *
 * @author Buffy
 * @since 2026/11/04
 */
import { fitSizeExpr, type ImageMeta } from "./imageMeta";

/**
 * 服务端能现场解码/缩放/转码的扩展名
 *
 * <p>必须与后端 {@code FileStorageServerFilter#isImageExt} 的白名单一致：
 * 名单外（svg/tiff/heic/ico/jxl/psd…）带了 {@code size=}/{@code format=} 也只会拿到
 * 提示页或原始字节，前端据此直接走原图，不做无用请求。</p>
 */
const SERVER_SCALABLE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp", "wbmp"]);

/** 原图小于这个字节数就不必让服务端缩放：本来就不慢，多一次解码编码反而更慢 */
export const RAW_SKIP_BYTES = 160 * 1024;

/** 缩略图长边（大图标卡片 86px 的 2 倍屏） */
export const THUMB_EDGE = 172;

/** 预览第一档长边：远小于预览区，先出一张能看清内容的图 */
export const PREVIEW_DRAFT_EDGE = 720;

/** 预览第二档长边：贴近预览区实际像素，缩放/平移都还够清楚 */
export const PREVIEW_MID_EDGE = 1600;

/** 预览占位图长边：只用来铺底模糊，越小越快 —— 与网格缩略图同档，通常还能直接用它的缓存 */
export const PREVIEW_GHOST_EDGE = 172;

/**
 * 不能转 JPEG 时（透明图 / 动图），PNG 档位最多占原图多少像素比例才算「值得要」
 *
 * <p>PNG 无损，字节数大致随像素数走：把 2400px 缩到 1600px 只省约 55% 字节，
 * 而这一档还要和正在下载的原图抢同一条 40KB/s 的链路。阈值取 0.6（像素降到 60%
 * 以下才发这一档）—— 真正的收益档（draft、缩略图）远低于这条线。</p>
 */
export const PNG_TIER_MAX_PIXEL_RATIO = 0.6;

/**
 * PNG 档位的字节预算（单档）
 *
 * <p>带透明通道的图没法转 JPEG，缩放到 720px 也还有几百 KB；实测一张 4MB 的
 * RGBA PNG 在 720px 档上仍是 394KB（远端带宽下约 10 秒），首屏收益远不如
 * 「把这一档压到 200KB 上下」来得直接。所以这里按字节预算反算长边，
 * 让每一档都是「几秒内能到」的量级。</p>
 */
export const PNG_TIER_BYTE_BUDGET = 256 * 1024;

/** 缩略图 JPEG 质量：172px 下 72 已经看不出块效应，再高只是白传字节 */
export const THUMB_JPEG_QUALITY = 72;

/** 预览 JPEG 质量：放大观看时不至于糊，1600px 下约 200~400KB */
export const PREVIEW_JPEG_QUALITY = 82;

/**
 * 取小写扩展名
 *
 * @param fileName 文件名或对象 Key
 * @returns 不含点的扩展名；没有扩展名返回空串
 */
export function extOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/**
 * 服务端是否能对这张图做缩放/转码
 *
 * @param fileName 文件名或对象 Key
 * @returns 在白名单内为 true
 */
export function isServerScalable(fileName: string): boolean {
  return SERVER_SCALABLE_EXTS.has(extOf(fileName));
}

/**
 * 能不能让服务端把这张图转成 JPEG 回传
 *
 * <p>三个条件同时满足才行：格式在白名单内、探测确认没有 alpha、不是 GIF
 * （GIF 可能是动图，转成 JPEG 会只剩第一帧）。</p>
 *
 * @param fileName 文件名
 * @param meta     探测到的元信息（可能为 null）
 * @returns 可转 JPEG 为 true
 */
export function canServeJpeg(fileName: string, meta: ImageMeta | null): boolean {
  if (!meta || meta.alpha) {
    return false;
  }
  const ext = extOf(fileName);
  return ext !== "gif" && SERVER_SCALABLE_EXTS.has(ext);
}

/**
 * 构建「服务端缩放/转码」的查询参数
 *
 * <p>返回空对象表示<b>不该发这个请求</b>：格式不支持、没探测到尺寸（算不出等比目标，
 * 硬拉伸会变形）、或者原图本来就比目标还小。</p>
 *
 * @param fileName 文件名（决定能否缩放/转 JPEG）
 * @param meta     探测到的元信息
 * @param edge     目标长边（像素）
 * @param quality  JPEG 质量；不传则用调用方默认
 * @returns 追加到直链上的查询参数
 */
export function buildScaleParams(
  fileName: string,
  meta: ImageMeta | null,
  edge: number,
  quality: number,
): Record<string, string> {
  if (!meta || !isServerScalable(fileName)) {
    return {};
  }
  // 小图不缩放：原图几百 KB 以内，服务端解码+重编码的耗时比省下的字节更贵
  if (meta.bytes > 0 && meta.bytes <= RAW_SKIP_BYTES) {
    return {};
  }
  const size = fitSizeExpr(meta, edge);
  if (!size) {
    // 原图长边已经不超过 edge：没有可缩的，直接看原图
    return {};
  }
  const params: Record<string, string> = { size };
  if (canServeJpeg(fileName, meta)) {
    params.format = "jpeg";
    params.quality = String(quality);
    return params;
  }
  // 转不了 JPEG（带透明通道、动图）：只剩「像素变少」这一条路，
  // 而 PNG 的字节数近似随像素数走，所以这一档要按字节预算反算长边：
  // 否则「2400px 原图要 720px 的稿」会实打实传回 400KB，比原图省不了多少。
  const pngEdge = clampPngEdge(meta, edge, PNG_TIER_BYTE_BUDGET);
  if (pngEdge <= 0 || !worthPngTier(meta, pngEdge)) {
    return {};
  }
  params.size = fitSizeExpr(meta, pngEdge) as string;
  return params;
}

/**
 * 按字节预算反算 PNG 档位能用的最大长边
 *
 * <p>估算式：{@code 目标字节 ≈ 原图字节 × (目标长边 / 原长边)²}。无损格式的字节数
 * 基本随像素数走，所以这个上界是「不会严重低估」的保守估计；实际内容越平坦
 * （截图、UI 稿），缩完只会更小。</p>
 *
 * <p>探测不到原图字节数（服务端没给 Content-Range）时不做限制，按调用方给的 edge。</p>
 *
 * @param meta        元信息
 * @param edge        调用方想要的长边
 * @param budgetBytes 这一档能接受的字节预算
 * @returns 可用的长边；预算内连 1px 都放不下时返回 0
 */
export function clampPngEdge(meta: ImageMeta, edge: number, budgetBytes: number): number {
  const longEdge = Math.max(meta.width, meta.height);
  if (meta.bytes <= 0 || longEdge <= 0) {
    return Math.min(edge, longEdge);
  }
  const k = Math.sqrt(budgetBytes / meta.bytes);
  const fitted = Math.floor(longEdge * k);
  const target = Math.min(edge, longEdge, fitted);
  return target >= 1 ? target : 0;
}

/**
 * 不能转 JPEG 时，这一档 PNG 是否值得发
 *
 * @param meta 元信息
 * @param edge 目标长边
 * @returns 值得发为 true
 */
export function worthPngTier(meta: ImageMeta, edge: number): boolean {
  const longEdge = Math.max(meta.width, meta.height);
  if (longEdge <= edge) {
    return false;
  }
  const ratio = edge / longEdge;
  return ratio * ratio <= PNG_TIER_MAX_PIXEL_RATIO;
}

/**
 * 把查询参数拼到直链上
 *
 * <p>空值（{@code undefined}/{@code ""}）会被丢掉，避免出现 {@code &format=} 这种
 * 让后端按「未知格式」处理的半截参数。</p>
 *
 * @param url    基础直链（可能已带查询串）
 * @param params 追加参数
 * @returns 拼接后的直链
 */
export function withQuery(url: string, params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (entries.length === 0) {
    return url;
  }
  const query = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
    .join("&");
  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
}

/* ==================== 原图字节缓存 ==================== */

/** 缓存条目上限（字节）：超了按 LRU 逐出，避免看几十张图后把内存吃满 */
const BLOB_CACHE_MAX_BYTES = 96 * 1024 * 1024;

/** 单张图最大可缓存字节数：超大图（>32MB）看一次就丢，不值得占着内存 */
const BLOB_CACHE_MAX_ENTRY = 32 * 1024 * 1024;

/** key → { blob, bytes }，Map 的插入序即 LRU 顺序（命中时删了重插） */
const blobCache = new Map<string, { blob: Blob; bytes: number }>();

/** 当前缓存总字节数 */
let blobCacheBytes = 0;

/**
 * 组装缓存键
 *
 * <p>{@code version} 用对象 mtime：文件被覆盖后 mtime 变，旧缓存自然不命中，
 * 不会让用户看到上一版图片。</p>
 *
 * @param bucket  存储桶
 * @param key     对象 Key
 * @param version 版本标记（通常为 lastModified）
 * @returns 缓存键
 */
export function imageCacheKey(bucket: string, key: string, version?: number | string): string {
  return `${bucket}\u0000${key}\u0000${version ?? ""}`;
}

/**
 * 读缓存并刷新 LRU 顺序
 *
 * @param cacheKey 缓存键
 * @returns 原图字节；未缓存返回 null
 */
export function readImageBlob(cacheKey: string): Blob | null {
  const hit = blobCache.get(cacheKey);
  if (!hit) {
    return null;
  }
  blobCache.delete(cacheKey);
  blobCache.set(cacheKey, hit);
  return hit.blob;
}

/**
 * 写缓存（超上限时逐出最久未使用的条目）
 *
 * @param cacheKey 缓存键
 * @param blob     原图字节
 */
export function writeImageBlob(cacheKey: string, blob: Blob): void {
  if (blob.size <= 0 || blob.size > BLOB_CACHE_MAX_ENTRY) {
    return;
  }
  const existing = blobCache.get(cacheKey);
  if (existing) {
    blobCacheBytes -= existing.bytes;
    blobCache.delete(cacheKey);
  }
  blobCache.set(cacheKey, { blob, bytes: blob.size });
  blobCacheBytes += blob.size;
  while (blobCacheBytes > BLOB_CACHE_MAX_BYTES && blobCache.size > 1) {
    const oldest = blobCache.keys().next();
    if (oldest.done) {
      break;
    }
    const evicted = blobCache.get(oldest.value);
    blobCache.delete(oldest.value);
    blobCacheBytes -= evicted?.bytes ?? 0;
  }
}

/**
 * 按对象前缀丢弃缓存（保存覆盖后必须调用，否则会命中旧字节）
 *
 * @param bucket 存储桶
 * @param key    对象 Key
 */
export function dropImageBlob(bucket: string, key: string): void {
  const prefix = `${bucket}\u0000${key}\u0000`;
  for (const cacheKey of [...blobCache.keys()]) {
    if (cacheKey.startsWith(prefix)) {
      const hit = blobCache.get(cacheKey);
      blobCache.delete(cacheKey);
      blobCacheBytes -= hit?.bytes ?? 0;
    }
  }
}

/**
 * 清空原图字节缓存
 */
export function clearImageBlobCache(): void {
  blobCache.clear();
  blobCacheBytes = 0;
}

/**
 * 当前缓存占用（字节）—— 供测试与调试使用
 *
 * @returns 已缓存字节数
 */
export function imageBlobCacheBytes(): number {
  return blobCacheBytes;
}
