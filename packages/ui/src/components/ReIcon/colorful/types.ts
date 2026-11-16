/**
 * ReIcon 彩色品牌图标类型 —— 由 scripts/sync-colorful-icons.mjs 生成，请勿手改。
 */

/** 彩色品牌图标分组 id（与 bodies.<组>.ts 的文件名一一对应） */
export type ColorfulIconGroup = "os" | "devtool" | "backend" | "frontend" | "database" | "cloud" | "office";

/** 一个彩色品牌图标的原始 SVG */
export interface ColorfulIconBody {
  /** svg 的 viewBox（各集合尺寸不同，logos 是 0 0 256 256） */
  viewBox: string;
  /** svg 内部内容（path/rect/g 等），id 已按图标名加前缀 */
  body: string;
}
