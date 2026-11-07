/**
 * 动态字体加密模块（@repo/core）
 *
 * 真正的字体加密：PUA 码位在 woff2 字体里被映射到真实字形。
 *
 * 工作方式：
 *  1. 构建期（packages/core/scripts/build-obf-font.py）生成 obf-font.woff2：
 *     - 字符集（ASCII + GB2312 汉字 + 中文标点）逐字映射到 PUA 私用区 U+E000 起
 *     - 字体 cmap 表写入 PUA 码位 → 该字符的真实字形
 *  2. 运行期把文本转成 PUA 乱码写进 DOM，并套用该字体族
 *  3. 浏览器用字体渲染 PUA 码位 → 视觉呈现真实字形
 *
 * 与位图方案（旧实现）的区别：
 *  - 字形由**字体**渲染，不是 canvas 截图贴背景
 *  - 可正常选中、缩放、适配 DPR，不产生大量 base64 图片
 *  - DOM 里是乱码，但字形来自字体表（Elements 里看到乱码，视觉正常）
 *
 * 安全边界（诚实说明）：
 *  - 这是混淆，不是加密。拿到字体 + 映射规则仍可还原
 *  - 防的是「从 HTML 源码批量抓取文本」，不防截图 OCR
 *  - 截图 OCR 请用 security.ocrObfuscation（canvas + WebGL 动态噪点）
 */

import {
  OBF_BASE_CODEPOINT,
  deobfuscateTextByFont,
  getObfuscationCharset,
  getObfuscationMap,
  obfuscateTextByFont,
} from "./obfuscationMap";

export { OBF_BASE_CODEPOINT, getObfuscationCharset, getObfuscationMap };

/** 字体族名（与 @font-face 声明一致） */
export const OBF_FONT_FAMILY = "ReObfFont";

/** 字体混淆配置 */
export interface FontObfuscatorOptions {
  /** 字体族名，默认 ReObfFont（须与 @font-face 一致） */
  fontFamily?: string;
  /** 字号（px），默认继承外层，不设置则不改 */
  fontSize?: number;
  /** 颜色，默认继承 */
  color?: string;
  /** 私有区起始码点，默认 U+E000（须与字体构建一致） */
  baseCodepoint?: number;
}

/** 单个混淆字符的渲染描述 */
export interface ObfuscatedChar {
  /** 混淆后的 PUA 码点（写入 DOM 文本） */
  pua: string;
  /** 原始字符（供还原/无障碍） */
  origin: string;
  /** 字符在字符集中的序号 */
  offset: number;
}

/**
 * 生成混淆字符列表
 *
 * 每个字符转成对应的 PUA 码位；字符集外的字符（如生僻字、emoji）原样保留，
 * 由字体 fallback 渲染，不会出现方块。
 *
 * @param text 需要混淆的原文
 * @param options 配置
 */
export function buildObfuscatedChars(
  text: string,
  options: FontObfuscatorOptions = {},
): ObfuscatedChar[] {
  const map = getObfuscationMap();
  return Array.from(text).map((ch) => {
    const pua = map.get(ch);
    return {
      pua: pua ?? ch,
      origin: ch,
      offset: pua ? pua.codePointAt(0)! - OBF_BASE_CODEPOINT : -1,
    };
  });
}

/**
 * 把原文转成混淆文本（直接写进 DOM 文本节点）
 *
 * @param text 原文
 */
export function obfuscateDynamic(text: string): string {
  return obfuscateTextByFont(text);
}

/**
 * 把混淆文本还原成原文（复制/导出场景）
 *
 * @param puaText 混淆后的文本
 */
export function deobfuscateDynamic(puaText: string): string {
  return deobfuscateTextByFont(puaText);
}

/**
 * 注入 @font-face 规则（幂等）
 *
 * 字体文件路径由调用方给出（一般由构建产物提供 URL）。
 * 浏览器支持 FontFace API 时优先用它，避免重复插入 style。
 *
 * @param fontUrl woff2 字体 URL
 * @param fontFamily 字体族名，默认 ReObfFont
 * @returns 字体就绪的 Promise（失败时 reject）
 */
export async function loadObfuscationFont(
  fontUrl: string,
  fontFamily: string = OBF_FONT_FAMILY,
): Promise<void> {
  if (typeof document === "undefined") return;

  // 已注入过则直接返回
  const existing = Array.from(document.fonts).find((f) => f.family.replace(/["']/g, "") === fontFamily);
  if (existing) {
    if (existing.status === "loaded") return;
    await existing.loaded;
    return;
  }

  const face = new FontFace(fontFamily, `url(${fontUrl}) format("woff2")`, {
    display: "swap",
  });
  await face.load();
  document.fonts.add(face);
}
