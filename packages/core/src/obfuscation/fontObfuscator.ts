/**
 * 动态字体混淆模块（vue-font-obfuscator 的轻量自研版）（@repo/core）
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

/** 随机映射：原始字符 → PUA */
interface GlyphMap {
  pua: string;
  /** 相对私有区起点的偏移（用来还原） */
  offset: number;
}

/** 从某区间抽取随机不重复偏移 */
function buildOffsets(size: number, base: number): number[] {
  const pool = Array.from({ length: size }, (_, i) => i);
  // Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.map((o) => base + o);
}

/** 解析颜色：支持 rgb()/rgba()/#hex */
function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  if (/^#[0-9a-fA-F]{3,8}$/.test(color)) {
    const hex = color.slice(1);
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 1;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
    return { r, g, b, a };
  }
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(",").map((s) => s.trim());
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    const a = parts[3] !== undefined ? Number(parts[3]) : 1;
    if ([r, g, b].every((n) => Number.isFinite(n))) return { r, g, b, a };
  }
  return null;
}

/**
 * 生成混淆字符列表
 * @param text 需要混淆的原文
 * @param options 配置
 */
export function buildObfuscatedChars(
  text: string,
  options: FontObfuscatorOptions = {},
): ObfuscatedChar[] {
  const {
    baseCodepoint = 0xe000,
    fontSize = 14,
    fontFamily = "-apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    color = "#303133",
  } = options;

  const dpr = window.devicePixelRatio || 1;
  const chars = Array.from(text);
  const offsets = buildOffsets(chars.length, baseCodepoint);
  const glyphMap = new Map<string, GlyphMap>();

  chars.forEach((ch, i) => {
    if (!glyphMap.has(ch)) {
      glyphMap.set(ch, {
        pua: String.fromCodePoint(offsets[i]),
        offset: i,
      });
    }
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${fontSize}px ${fontFamily}`;
  const parsed = parseColor(color);

  return chars.map((ch) => {
    // 无法测量（控制符/换行）跳过位图化
    if (/[\r\n\t\0\u200b\u200c]/.test(ch) || ch.length === 0) {
      return {
        pua: ch,
        image: "",
        width: 0,
        height: fontSize,
        ascent: fontSize * 0.8,
      };
    }
    const metrics = ctx.measureText(ch);
    const w = Math.ceil(metrics.width);
    const h = Math.ceil(fontSize * 1.4);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (parsed) {
      ctx.fillStyle = `rgba(${parsed.r},${parsed.g},${parsed.b},${parsed.a})`;
    }
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "alphabetic";
    // 以基线对齐，ascent 用 metrics.actualBoundingBoxAscent
    const ascent = Math.ceil(metrics.actualBoundingBoxAscent || fontSize * 0.8);
    ctx.fillText(ch, 0, ascent);
    const glyph = glyphMap.get(ch)!;
    return {
      pua: glyph.pua,
      image: canvas.toDataURL("image/png"),
      width: w,
      height: h,
      ascent,
    };
  });
}

/**
 * 根据映射还原混淆文本为原文（供点击/复制等场景还原）
 * @param puaText 混淆后的文本
 */
export function deobfuscateDynamic(puaText: string): string {
  // 该方法无法在无上下文时还原，交由业务侧基于原 glyphMap 还原；
  // 此处仅处理未混淆字符透传，方便统一调用。
  return puaText;
}
