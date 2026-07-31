/**
 * 动态字体混淆模块（vue-font-obfuscator 的轻量自研版）
 *
 * 核心思路：
 *  - 每次调用（页面刷新 / 组件挂载）生成一组随机码点映射：原始字符 → PUA（私有区 U+E000~U+F8FF）
 *  - DOM 渲染的是混淆后的 PUA 乱码文本（爬虫 / OCR 拿到的是乱码）
 *  - 视觉上用每个字符的 canvas 位图（dataURL）覆盖显示，人眼看到的字形是真实的
 *  - 每次刷新映射与位图全部重新生成，破解成本高、无法复用
 *
 * 特性：
 *  - 零运行时依赖，纯浏览器 DOM + Canvas API
 *  - 字符位图按 DPR 放大，清晰度与原始文本一致
 *  - 无法测量的字符（换行/控制符）自动跳过位图化，保留原字符布局
 */

/** 字体混淆配置 */
export interface FontObfuscatorOptions {
  /** 映射的私有区起始码点，默认 U+E000 */
  baseCodepoint?: number;
  /** 字号（px），默认 14，与 el-text 默认一致 */
  fontSize?: number;
  /** 字体族（逗号分隔），默认继承系统 UI 字体 */
  fontFamily?: string;
  /** 混淆字符的颜色，默认取 el-text 主色 */
  color?: string;
}

/** 单个混淆字符的渲染描述 */
export interface ObfuscatedChar {
  /** 混淆后的 PUA 码点（写入 DOM 文本） */
  pua: string;
  /** 真实字形的位图 dataURL */
  image: string;
  /** 显示宽度（px，含字间距） */
  width: number;
  /** 显示高度（px） */
  height: number;
  /** 基线偏移（px，用于 vertical-align） */
  ascent: number;
}

/** PUA 区起始：U+E000 */
const DEFAULT_BASE_CODEPOINT = 0xe000;
/** PUA 区结束：U+F8FF */
const PUA_MAX = 0xf8ff;

/** 当前映射表（原始字符 → PUA），供解码与测试 */
let currentMap = new Map<string, string>();

/** 当前会话已使用的码点，避免同一批次内冲突 */
const usedCodepoints = new Set<string>();

/** 生成互不冲突的随机 PUA 码点 */
function randomCodepoint(base: number): string {
  const count = PUA_MAX - base + 1;
  for (;;) {
    const cp = base + Math.floor(Math.random() * count);
    const key = String.fromCodePoint(cp);
    if (!usedCodepoints.has(key)) {
      usedCodepoints.add(key);
      return key;
    }
  }
}

/** 提取文本的字符序列（按码点切分，正确处理代理对） */
function toChars(text: string): string[] {
  return Array.from(text);
}

/** 生成字符映射表：原始字符 → PUA 码点 */
function createCharMap(text: string, base: number): Map<string, string> {
  usedCodepoints.clear();
  const map = new Map<string, string>();
  for (const ch of toChars(text)) {
    if (map.has(ch)) continue;
    const cp = ch.codePointAt(0)!;
    // 空格、换行、制表符与控制字符保留原样（不混淆，避免布局错乱）
    if (cp <= 0x20 || cp === 0x7f) {
      map.set(ch, ch);
    } else {
      map.set(ch, randomCodepoint(base));
    }
  }
  return map;
}

/** 混淆文本（用映射表把字符替换为 PUA 码点） */
function obfuscateText(text: string, charMap: Map<string, string>): string {
  return toChars(text)
    .map((ch) => charMap.get(ch) ?? ch)
    .join("");
}

/** 解混淆文本（反查映射表还原） */
function deobfuscateText(text: string, charMap: Map<string, string>): string {
  const reverse = new Map<string, string>();
  charMap.forEach((value, key) => reverse.set(value, key));
  return toChars(text)
    .map((ch) => reverse.get(ch) ?? ch)
    .join("");
}

/**
 * 构建一段文本的混淆渲染描述
 *
 * @returns chars 逐字符渲染描述（PUA + 位图 + 尺寸）
 */
export function buildObfuscatedChars(
  text: string,
  options: FontObfuscatorOptions = {},
): ObfuscatedChar[] {
  const base = options.baseCodepoint ?? DEFAULT_BASE_CODEPOINT;
  const fontSize = options.fontSize ?? 14;
  const fontFamily =
    options.fontFamily ??
    `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;
  const color = options.color ?? "var(--el-text-color-primary, #303133)";

  // 生成映射表
  const charMap = createCharMap(text, base);
  currentMap = charMap;

  // 度量用 canvas（隐藏）
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const font = `${fontSize}px ${fontFamily}`;
  ctx.font = font;
  // 字体加载完成后度量更准确
  void document.fonts?.ready.then(() => {
    ctx.font = font;
  });

  const result: ObfuscatedChar[] = [];
  let offset = 0;
  for (const ch of toChars(text)) {
    const cp = ch.codePointAt(0)!;
    // 空白/控制字符：不生成位图，仅推进偏移
    if (cp <= 0x20 || cp === 0x7f) {
      result.push({
        pua: charMap.get(ch) ?? ch,
        image: "",
        width: 0,
        height: 0,
        ascent: 0,
      });
      continue;
    }

    const metrics = ctx.measureText(ch);
    const width = Math.ceil(metrics.width + 2); // +2px 防字体锯齿裁切
    const height = Math.ceil(fontSize * 1.5);

    // 位图化当前字符
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillText(ch, 1, height * 0.8);
    const image = canvas.toDataURL("image/png");

    result.push({
      pua: charMap.get(ch) ?? ch,
      image,
      width: width / dpr,
      height: height / dpr,
      ascent: height * 0.8,
    });
    offset += width / dpr;
  }
  void offset;
  return result;
}

/** 获取当前映射表（供 ReText 解码展示 / 测试） */
export function getCurrentCharMap(): Map<string, string> {
  return new Map(currentMap);
}

/** 解混淆一段已混淆文本（配合 getCurrentCharMap 使用） */
export function deobfuscateDynamic(text: string): string {
  return deobfuscateText(text, currentMap);
}

/** 停止混淆：清空映射表 */
export function stopFontObfuscator(): void {
  currentMap = new Map();
  usedCodepoints.clear();
}

/** 兼容入口：混淆文本，返回 PUA 乱码字符串 */
export function obfuscateTextDynamic(text: string): string {
  const charMap = createCharMap(text, DEFAULT_BASE_CODEPOINT);
  currentMap = charMap;
  return obfuscateText(text, charMap);
}

/** 导出 */
export const fontObfuscator = {
  buildChars: buildObfuscatedChars,
  obfuscate: obfuscateTextDynamic,
  deobfuscate: deobfuscateDynamic,
  getMap: getCurrentCharMap,
  stop: stopFontObfuscator,
};
