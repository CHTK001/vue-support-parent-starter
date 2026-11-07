/**
 * 字体加密字符映射表（@repo/core）
 *
 * 与 packages/core/scripts/build-obf-font.py 生成的 woff2 字体严格对应：
 *  - 字符集顺序决定码位偏移（space 在最前 → U+E000）
 *  - 字体 cmap 里写入 PUA 码位 → 真实字形
 *
 * 这里只放**映射规则**（不内联 6890 条表），运行时按字符集顺序算码位，
 * 保证与构建脚本的枚举顺序完全一致。
 */

/**
 * 字符集：与 build-obf-font.py 使用的 charset.txt 一致
 *
 * 顺序：
 *  1. ASCII 可打印 0x20–0x7E（95 个，含空格）
 *  2. GB2312 汉字（一级 3755 + 二级 3008，共 6763）
 *  3. 中文标点
 *
 * 码位 = BASE + 字符在字符集中的序号
 */
export const OBF_BASE_CODEPOINT = 0xe000;

/** ASCII 可打印字符（0x20–0x7E） */
function asciiChars(): string[] {
  const out: string[] = [];
  for (let c = 0x20; c <= 0x7e; c++) out.push(String.fromCharCode(c));
  return out;
}

/** GB2312 汉字（按 GB2312 编码顺序枚举，与 Python 侧一致） */
function gb2312Hanzi(): string[] {
  const out: string[] = [];
  // GB2312 汉字区：高字节 0xB0–0xF7，低字节 0xA1–0xFE
  const decoder = new TextDecoder("gbk", { fatal: true });
  for (let hi = 0xb0; hi <= 0xf7; hi++) {
    for (let lo = 0xa1; lo <= 0xfe; lo++) {
      try {
        const ch = decoder.decode(new Uint8Array([hi, lo]));
        if (ch.length === 1) out.push(ch);
      } catch {
        // 非合法 GB2312 组合，跳过
      }
    }
  }
  return out;
}

/** 中文标点 */
const CN_PUNCT = "，。、；：？！“”‘’（）《》【】—…·￥％＃＠＆＊＋－／＝＜＞";

let cachedCharset: string[] | null = null;

/** 获取完整字符集（去重保序） */
export function getObfuscationCharset(): string[] {
  if (cachedCharset) return cachedCharset;
  const parts = [...asciiChars(), ...gb2312Hanzi(), ...Array.from(CN_PUNCT)];
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const ch of parts) {
    if (!seen.has(ch)) {
      seen.add(ch);
      uniq.push(ch);
    }
  }
  cachedCharset = uniq;
  return uniq;
}

let cachedMap: Map<string, string> | null = null;

/** 字符 → PUA 码位 的映射（与字体文件严格对应） */
export function getObfuscationMap(): Map<string, string> {
  if (cachedMap) return cachedMap;
  const map = new Map<string, string>();
  const chars = getObfuscationCharset();
  for (let i = 0; i < chars.length; i++) {
    map.set(chars[i], String.fromCodePoint(OBF_BASE_CODEPOINT + i));
  }
  cachedMap = map;
  return map;
}

/** 原文 → PUA 乱码（字符不在字符集内则原样保留） */
export function obfuscateTextByFont(text: string): string {
  const map = getObfuscationMap();
  let out = "";
  for (const ch of text) out += map.get(ch) ?? ch;
  return out;
}

/** PUA 乱码 → 原文（供复制/导出还原） */
export function deobfuscateTextByFont(text: string): string {
  const map = getObfuscationMap();
  const reverse = new Map<string, string>();
  for (const [src, obf] of map) reverse.set(obf, src);
  let out = "";
  for (const ch of text) out += reverse.get(ch) ?? ch;
  return out;
}
