/**
 * colorSpace — 将现代 CSS 颜色（oklab / oklch / lab / lch）确定性地转换为
 * ECharts/ZRender 可稳定解析的 sRGB `rgb()` / `rgba()` 字符串。
 *
 * 背景：当调色板主色以 `oklab(...)` 提供时，ECharts 在 emphasis（如 tooltip
 * trigger:'axis' 的 hover）状态下重新解析颜色会失败并得到 undefined，导致整条
 * 折线"消失"。统一在注入主题前归一化为 sRGB 可规避该问题。
 */

const D65_TO_RGB = [
  [3.24096994, -1.53738318, -0.49861076],
  [-0.96924364, 1.8759675, 0.04155506],
  [0.05563008, -0.20397696, 1.05697151],
];

/** linear-light sRGB -> gamma-encoded sRGB channel (0..255) */
function gammaEncode(c: number): number {
  c = Math.min(1, Math.max(0, c));
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(v * 255);
}

function matrix(m: number[][], v: number[]): number[] {
  return m.map((row) => row.reduce((acc, x, i) => acc + x * v[i], 0));
}

/** OKLab (L,a,b) -> [r,g,b] (0..255) */
function oklabToRgb255(L: number, a: number, b: number): number[] {
  let l = L + 0.3963377774 * a + 0.2158037573 * b;
  let m = L - 0.1055613458 * a - 0.0638541728 * b;
  let s = L - 0.0894841775 * a - 1.291485548 * b;
  l **= 3;
  m **= 3;
  s **= 3;
  return matrix(D65_TO_RGB, [l, m, s]).map(gammaEncode);
}

// Bradford chromatic adaptation D50 -> D65
const D50_TO_D65 = [
  [0.9555766, -0.0230393, 0.0631636],
  [-0.0282895, 1.0099416, 0.0210077],
  [0.0122982, -0.020483, 1.3299098],
];
const D50_XN = 0.96422;
const D50_ZN = 0.82521;

/** CIE Lab (D50) (L,a,b) -> [r,g,b] (0..255) */
function labToRgb255(L: number, a: number, b: number): number[] {
  const e = 0.008856;
  const k = 903.3;
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const fx3 = fx ** 3;
  const fy3 = fy ** 3;
  const fz3 = fz ** 3;
  const x = fx3 > e ? fx3 : (116 * fx - 16) / k;
  const y = fy3 > e ? fy3 : L / k;
  const z = fz3 > e ? fz3 : (116 * fz - 16) / k;
  const [X, Y, Z] = matrix(D50_TO_D65, [x * D50_XN, y, z * D50_ZN]);
  return matrix(D65_TO_RGB, [X, Y, Z]).map(gammaEncode);
}

/** Parse an angle token (deg/rad/grad/turn) to degrees */
function parseAngle(token: string | undefined, fallback: number): number {
  if (token === undefined || token === '') return fallback;
  const m = token.match(/(-?[\d.]+)(deg|rad|grad|turn)?/);
  if (!m) return fallback;
  const v = parseFloat(m[1]);
  switch (m[2]) {
    case 'rad':
      return (v * 180) / Math.PI;
    case 'grad':
      return v * 0.9;
    case 'turn':
      return v * 360;
    default:
      return v;
  }
}

function parseAlpha(token?: string): number {
  if (token === undefined) return 1;
  token = token.trim();
  if (token.endsWith('%')) return Math.min(1, Math.max(0, parseFloat(token) / 100));
  return Math.min(1, Math.max(0, parseFloat(token)));
}

function formatRgb(rgb: number[], alpha: number): string {
  if (alpha >= 1) return `rgb(${rgb.join(',')})`;
  return `rgba(${rgb.join(',')},${Number(alpha.toFixed(3))})`;
}

/**
 * Normalize a CSS color string to sRGB rgb()/rgba().
 * Already-compatible values (hex / rgb / rgba / hsl / named) are returned as-is.
 */
export function normalizeColor(input: string | null | undefined): string {
  if (!input) return '';
  const c = String(input).trim();
  if (/^(#[a-f0-9]|rgb|rgba|hsl|hsla)/i.test(c)) return c;

  const fn = c.match(/^(oklab|oklch|lab|lch)\(/i);
  if (!fn) return c;
  const func = fn[1].toLowerCase();
  const inner = c.slice(c.indexOf('(') + 1, c.lastIndexOf(')'));
  const parts = inner.split('/').map((s) => s.trim());
  const tokens = parts[0].trim().split(/\s+/);
  const alpha = parseAlpha(parts[1]);

  if (func === 'oklab' || func === 'oklch') {
    let L = parseFloat(tokens[0]);
    if (tokens[0].includes('%')) L /= 100;
    let a: number;
    let b: number;
    if (func === 'oklab') {
      a = tokens[1] === undefined ? 0 : parseFloat(tokens[1]);
      b = tokens[2] === undefined ? 0 : parseFloat(tokens[2]);
      if (tokens[1] && tokens[1].includes('%')) a = (parseFloat(tokens[1]) / 100) * 0.4;
      if (tokens[2] && tokens[2].includes('%')) b = (parseFloat(tokens[2]) / 100) * 0.4;
    } else {
      const C = tokens[1] === undefined ? 0 : parseFloat(tokens[1]);
      const h = (parseAngle(tokens[2], 0) * Math.PI) / 180;
      a = C * Math.cos(h);
      b = C * Math.sin(h);
    }
    return formatRgb(oklabToRgb255(L, a, b), alpha);
  }

  // CIE lab / lch (D50)
  let L = parseFloat(tokens[0]);
  if (tokens[0].includes('%')) L = (L / 100) * 100;
  let a: number;
  let b: number;
  if (func === 'lab') {
    a = tokens[1] === undefined ? 0 : parseFloat(tokens[1]);
    b = tokens[2] === undefined ? 0 : parseFloat(tokens[2]);
  } else {
    const C = tokens[1] === undefined ? 0 : parseFloat(tokens[1]);
    const h = (parseAngle(tokens[2], 0) * Math.PI) / 180;
    a = C * Math.cos(h);
    b = C * Math.sin(h);
  }
  return formatRgb(labToRgb255(L, a, b), alpha);
}
