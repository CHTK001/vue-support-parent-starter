/**
 * ReText 类型定义
 */
import type { OcrNoiseOptions } from "../../obfuscation/ocrNoise";
import type { FontObfuscatorOptions } from "../../obfuscation/fontObfuscator";

/** ReText 扩展能力配置 */
export interface ReTextSecurityOptions {
  /** 防 OCR 配置 */
  ocr?: OcrNoiseOptions;
  /** 动态字体混淆配置 */
  obfuscate?: FontObfuscatorOptions;
}
