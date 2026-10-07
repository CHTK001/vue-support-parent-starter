/**
 * TIFF / HEIC / PSD 前端解码库的类型垫片。
 *
 * <p>三个库都不自带完整 TS 类型（utif 是 UMD 的 UTIF.js、
 * libheif-js 的 wasm-bundle 是 CJS  bundle），面板里用动态
 * {@code import()} 按需加载，这里只声明用到的最小形状，
 * 让 {@code vue-tsc --noEmit} 能过。</p>
 *
 * @author Buffy
 * @since 2026/10/07
 */

/** UTIF.js 的一个 IFD（图像文件目录） */
export interface UtifIfd {
  /** 解码后回填的图像宽度 */
  width?: number;
  /** 解码后回填的图像高度 */
  height?: number;
  /** 解码后回填的原始像素数据 */
  data?: unknown;
  /** TIFF tag（t256 / t257 等），键为 tag 名 */
  [tag: string]: unknown;
}

declare module "utif/UTIF.js" {
  const UTIF: {
    /** 解析 TIFF 容器，返回全部 IFD（不解像素） */
    decode(buf: ArrayBuffer): import("./client-preview-libs").UtifIfd[];
    /** 解码单个 IFD 的像素，回填 width / height / data */
    decodeImage(buf: ArrayBuffer, ifd: import("./client-preview-libs").UtifIfd): void;
    /** 把已解码的 IFD 转成 8 位 RGBA（可直接喂 putImageData） */
    toRGBA8(ifd: import("./client-preview-libs").UtifIfd): Uint8Array;
  };
  export default UTIF;
}

/** libheif 解出的一张图 */
export interface HeifImage {
  /** 图像宽度 */
  get_width(): number;
  /** 图像高度 */
  get_height(): number;
  /**
   * 把解码结果画进 ImageData。
   *
   * @param imageData 目标像素缓冲（需按宽高预建）
   * @param cb 完成回调；首参为空表示解码失败
   */
  display(imageData: ImageData, cb: (displayData?: unknown) => void): void;
}

/** libheif 解码器 */
export interface HeifDecoder {
  /** 解码 HEIC / HEIF 容器，返回全部内置图像 */
  decode(data: Uint8Array): HeifImage[];
}

declare module "libheif-js/wasm-bundle" {
  const libheif: unknown;
  export default libheif;
}
