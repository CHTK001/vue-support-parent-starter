/**
 * TIFF / HEIC 前端解码库的类型形状。
 *
 * <p>两个库都不带可用的 TS 类型（{@code utif} 是 UMD 的 UTIF.js、
 * {@code libheif-js} 只有 CJS/自包含 wasm 的 bundle），因此在
 * {@code src/shims-client-preview-libs.d.ts} 里声明它们的模块类型，
 * 形状本身放在这里，供面板与垫片共用。</p>
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

/** UTIF.js 主体用到的最小 API */
export interface UtifApi {
  /** 解析 TIFF 容器，返回全部 IFD（不解像素） */
  decode(buf: ArrayBuffer): UtifIfd[];
  /** 解码单个 IFD 的像素，回填 width / height / data */
  decodeImage(buf: ArrayBuffer, ifd: UtifIfd): void;
  /** 把已解码的 IFD 转成 8 位 RGBA（可直接喂 putImageData） */
  toRGBA8(ifd: UtifIfd): Uint8Array;
}

/** libheif 解出的一张图 */
export interface HeifImage {
  /** 图像宽度 */
  get_width(): number;
  /** 图像高度 */
  get_height(): number;
  /**
   * 把解码结果写进给定的 ImageData。
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

/** libheif 模块（实例化后暴露解码器） */
export interface LibheifModule {
  /** HEIC / HEIF 解码器构造器 */
  HeifDecoder: new () => HeifDecoder;
}

/**
 * libheif 的 emscripten 工厂（MODULARIZE 形态）。
 *
 * <p>取 {@code libheif-bundle.mjs} 的默认导出后需调用一次才能拿到模块，
 * 而不是像 CJS 入口那样直接是模块对象。</p>
 */
export type LibheifFactory = (options?: Record<string, unknown>) => LibheifModule;