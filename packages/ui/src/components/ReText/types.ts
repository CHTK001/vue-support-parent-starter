/**
 * ReText 类型定义
 */
import type { OcrNoiseOptions } from "@repo/core";
import type { FontObfuscatorOptions } from "@repo/core";

/** ReText 扩展能力配置 */
export interface ReTextSecurityOptions {
  /** 防 OCR 配置 */
  ocr?: OcrNoiseOptions;
  /** 动态字体混淆配置 */
  obfuscate?: FontObfuscatorOptions;
}
