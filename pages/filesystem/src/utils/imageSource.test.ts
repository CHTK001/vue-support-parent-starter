/**
 * 图片元信息解析 / 取数参数 / 字节缓存的单元测试
 *
 * <p>这几块决定「图片加载要传多少字节」，算错不会报错、只会悄悄变慢或变丑：
 * 尺寸算错 → 服务端硬拉伸把图压变形；alpha 判错 → JPEG 把透明区写成黑底；
 * 缓存键漏了版本 → 覆盖保存后还显示旧图。所以逐条钉成用例。</p>
 *
 * @author Buffy
 * @since 2026/11/04
 */
import { beforeEach, describe, expect, it } from "vitest";
import { fitSizeExpr, parseImageSize, type ImageMeta } from "./imageMeta";
import {
  RAW_SKIP_BYTES,
  buildScaleParams,
  canServeJpeg,
  clearImageBlobCache,
  dropImageBlob,
  extOf,
  imageBlobCacheBytes,
  imageCacheKey,
  isServerScalable,
  readImageBlob,
  withQuery,
  writeImageBlob,
} from "./imageSource";

/* ==================== 构造文件头 ==================== */

/**
 * 拼一个最小 PNG 头（8 字节签名 + IHDR 前 16 字节）
 *
 * @param width  宽
 * @param height 高
 * @param colorType IHDR 色彩类型（0/2 不透明，3 调色板，4/6 带 alpha）
 * @param trns   是否追加 tRNS 块标记
 * @returns PNG 头字节
 */
function pngHeader(width: number, height: number, colorType: number, trns = false): Uint8Array {
  const buf = new Uint8Array(trns ? 48 : 40);
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  buf.set([0x00, 0x00, 0x00, 0x0d], 8);
  buf.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
  buf.set([(width >>> 24) & 0xff, (width >>> 16) & 0xff, (width >>> 8) & 0xff, width & 0xff], 16);
  buf.set([(height >>> 24) & 0xff, (height >>> 16) & 0xff, (height >>> 8) & 0xff, height & 0xff], 20);
  buf[24] = 8; // bitDepth
  buf[25] = colorType;
  if (trns) {
    buf.set([0x74, 0x52, 0x4e, 0x53], 33); // "tRNS"
  }
  return buf;
}

/**
 * 拼一个最小 JPEG 头（SOI + SOF0）
 *
 * @param width  宽
 * @param height 高
 * @returns JPEG 头字节
 */
function jpegHeader(width: number, height: number): Uint8Array {
  const buf = new Uint8Array(32);
  buf.set([0xff, 0xd8], 0); // SOI
  buf.set([0xff, 0xe0, 0x00, 0x04, 0x00, 0x00], 2); // APP0（长度 4）
  buf.set([0xff, 0xc0, 0x00, 0x0b, 0x08], 8); // SOF0
  buf.set([(height >> 8) & 0xff, height & 0xff], 13);
  buf.set([(width >> 8) & 0xff, width & 0xff], 15);
  return buf;
}

/**
 * 拼一个带 GCE 的 GIF 头
 *
 * @param transparent 是否声明透明色
 * @returns GIF 头字节
 */
function gifHeader(transparent: boolean): Uint8Array {
  const buf = new Uint8Array(40);
  buf.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0); // "GIF89a"
  buf.set([0x40, 0x01, 0xf0, 0x00], 6); // 320 × 240
  buf.set([0x21, 0xf9, 0x04, transparent ? 0x01 : 0x00, 0x00, 0x00, 0x00], 13);
  return buf;
}

/* ==================== 头解析 ==================== */

describe("parseImageSize（头解析宽高与 alpha）", () => {
  it("PNG 从 IHDR 读出宽高，色彩类型 2 视为不透明", () => {
    expect(parseImageSize(pngHeader(1920, 1080, 2))).toEqual({ width: 1920, height: 1080, alpha: false });
  });

  it("PNG 色彩类型 6（RGBA）判定为可能透明", () => {
    expect(parseImageSize(pngHeader(64, 64, 6))?.alpha).toBe(true);
  });

  it("调色板 PNG 只在出现 tRNS 时才判透明", () => {
    expect(parseImageSize(pngHeader(64, 64, 3))?.alpha).toBe(false);
    expect(parseImageSize(pngHeader(64, 64, 3, true))?.alpha).toBe(true);
  });

  it("JPEG 读出 SOF0 尺寸，且永远不透明", () => {
    const parsed = parseImageSize(jpegHeader(4032, 3024));
    expect(parsed).toEqual({ width: 4032, height: 3024, alpha: false });
  });

  it("GIF 按 Graphic Control Extension 判定透明", () => {
    expect(parseImageSize(gifHeader(false))?.alpha).toBe(false);
    expect(parseImageSize(gifHeader(true))?.alpha).toBe(true);
  });

  it("认不出的字节返回 null（调用方退回原图，不猜）", () => {
    expect(parseImageSize(new Uint8Array(32))).toBeNull();
  });
});

/* ==================== 取数参数 ==================== */

/** 一张「不透明的大图」元信息 */
const opaquePhoto: ImageMeta = { width: 4000, height: 3000, bytes: 2_000_000, alpha: false };

/** 一张「带透明通道的大图」元信息 */
const alphaShot: ImageMeta = { width: 4000, height: 3000, bytes: 2_000_000, alpha: true };

describe("buildScaleParams（缩略图/预览要什么参数）", () => {
  it("不透明大图：等比缩放 + JPEG 转码，字节数降一个量级", () => {
    expect(buildScaleParams("photo.jpg", opaquePhoto, 172, 72)).toEqual({
      size: "172x129",
      format: "jpeg",
      quality: "72",
    });
  });

  it("带 alpha 的图：只缩放，不转 JPEG（否则透明区变黑底）", () => {
    const params = buildScaleParams("logo.png", alphaShot, 172, 72);
    expect(params.size).toBe("172x129");
    expect(params.format).toBeUndefined();
  });

  it("GIF 不转 JPEG：可能是动图，转码只剩第一帧", () => {
    expect(canServeJpeg("anim.gif", opaquePhoto)).toBe(false);
    expect(buildScaleParams("anim.gif", opaquePhoto, 172, 72).format).toBeUndefined();
  });

  it("小图（≤160KB）不请求服务端缩放", () => {
    const small: ImageMeta = { width: 800, height: 600, bytes: RAW_SKIP_BYTES, alpha: false };
    expect(buildScaleParams("small.png", small, 172, 72)).toEqual({});
  });

  it("原图长边已经不大于目标时不缩放（没有可缩的）", () => {
    const tiny: ImageMeta = { width: 120, height: 90, bytes: 900_000, alpha: false };
    expect(buildScaleParams("tiny.png", tiny, 172, 72)).toEqual({});
  });

  it("白名单外的格式（svg/tiff/heic）一律不动，交浏览器原样加载", () => {
    for (const name of ["vector.svg", "scan.tiff", "phone.heic", "photo.jxl"]) {
      expect(buildScaleParams(name, opaquePhoto, 172, 72)).toEqual({});
    }
  });

  it("没有元信息就算不出等比尺寸，返回空（不能瞎猜 WxH，会变形）", () => {
    expect(buildScaleParams("photo.jpg", null, 172, 72)).toEqual({});
  });

  it("短边按比例取整，至少 1px（避免 0 高被服务端拒绝）", () => {
    const wide: ImageMeta = { width: 8000, height: 10, bytes: 900_000, alpha: false };
    expect(buildScaleParams("wide.png", wide, 172, 72).size).toBe("172x1");
  });

  it("透明图的 PNG 档：像素缩不到 60% 就不发这一档（省不下字节还抢带宽）", () => {
    // 原图只有 200KB、长边 2000：要 1600px 一档只能省 36% 像素，
    // 而原图本身几秒就能到 —— 这一档不值得发
    const small: ImageMeta = { width: 2000, height: 1500, bytes: 200_000, alpha: true };
    expect(buildScaleParams("logo.png", small, 1600, 82)).toEqual({});
    // 同一张图要 720px 就有意义了（像素剩 13%）
    expect(buildScaleParams("logo.png", small, 720, 82).size).toBe("720x540");
  });

  it("透明图的 PNG 档：按字节预算反算长边，不按调用方要的尺寸硬发", () => {
    // 4.3MB / 2400px 的 RGBA PNG：720px 实测 394KB，压到预算内约 594px
    const big: ImageMeta = { width: 2400, height: 1800, bytes: 4_300_000, alpha: true };
    const draft = buildScaleParams("shot.png", big, 720, 82);
    expect(draft.format).toBeUndefined();
    const [w] = draft.size.split("x").map(Number);
    expect(w).toBeLessThanOrEqual(720);
    expect(w).toBeGreaterThan(300);
    expect(big.bytes * (w / 2400) ** 2).toBeLessThanOrEqual(256 * 1024 + 1024);
  });
});

describe("extOf / isServerScalable", () => {
  it("扩展名小写化，且只认后端白名单", () => {
    expect(extOf("A/B/PIC.JPEG")).toBe("jpeg");
    expect(isServerScalable("a.PNG")).toBe(true);
    expect(isServerScalable("a.webp")).toBe(true);
    expect(isServerScalable("a.svg")).toBe(false);
    expect(isServerScalable("README")).toBe(false);
  });
});

describe("fitSizeExpr（等比长边）", () => {
  it("按长边等比缩放并取整", () => {
    expect(fitSizeExpr({ width: 4000, height: 3000, bytes: 0, alpha: false }, 1600)).toBe("1600x1200");
    expect(fitSizeExpr({ width: 3000, height: 4000, bytes: 0, alpha: false }, 1600)).toBe("1200x1600");
  });
});

describe("withQuery", () => {
  it("按需追加查询串，空值被丢弃", () => {
    expect(withQuery("/ot/t", { preview: "true" })).toBe("/ot/t?preview=true");
    expect(withQuery("/ot/t?x=1", { size: "172x129", format: "" })).toBe("/ot/t?x=1&size=172x129");
    expect(withQuery("/ot/t", { a: undefined })).toBe("/ot/t");
  });

  it("参数值会被 URL 编码", () => {
    expect(withQuery("/ot/t", { s: "a b&c" })).toBe("/ot/t?s=a%20b%26c");
  });
});

/* ==================== 原图字节缓存 ==================== */

/**
 * 造一个指定大小的假字节
 *
 * @param size 字节数
 * @returns Blob
 */
function fakeBlob(size: number): Blob {
  return new Blob([new Uint8Array(size)]);
}

describe("原图字节缓存", () => {
  beforeEach(() => {
    clearImageBlobCache();
  });

  it("写入后可按同一键读出", () => {
    const key = imageCacheKey("local", "a/b.png", 111);
    writeImageBlob(key, fakeBlob(1024));
    expect(readImageBlob(key)?.size).toBe(1024);
    expect(imageBlobCacheBytes()).toBe(1024);
  });

  it("版本号不同即不命中（覆盖保存后不会看到旧图）", () => {
    writeImageBlob(imageCacheKey("local", "a.png", 111), fakeBlob(64));
    expect(readImageBlob(imageCacheKey("local", "a.png", 222))).toBeNull();
  });

  it("按对象丢弃时连带所有版本一起失效", () => {
    writeImageBlob(imageCacheKey("local", "a.png", 1), fakeBlob(64));
    writeImageBlob(imageCacheKey("local", "a.png", 2), fakeBlob(64));
    writeImageBlob(imageCacheKey("local", "b.png", 1), fakeBlob(64));
    dropImageBlob("local", "a.png");
    expect(readImageBlob(imageCacheKey("local", "a.png", 1))).toBeNull();
    expect(readImageBlob(imageCacheKey("local", "a.png", 2))).toBeNull();
    expect(readImageBlob(imageCacheKey("local", "b.png", 1))?.size).toBe(64);
    expect(imageBlobCacheBytes()).toBe(64);
  });

  it("超过单条上限的超大图不入缓存（不拿内存换一次性的图）", () => {
    const key = imageCacheKey("local", "huge.png", 1);
    writeImageBlob(key, fakeBlob(33 * 1024 * 1024));
    expect(readImageBlob(key)).toBeNull();
  });
});
