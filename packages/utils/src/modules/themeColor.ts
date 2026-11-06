/**
 * 主题色计算工具（迁移自 koi/utils/themeColor.ts）
 *
 * 与 Element Plus 官方一致：mix(primary, white|black, level * 0.1)。
 */
import { DEFAULT_THEME } from "@repo/config";
import type { MessageStateType } from "../types";

/** 主题色所有被写入的变量名（只在这里清理，不可扩散到其他类库） */
const PRIMARY_VAR_RE = /--el-color-primary(-dark-2|-rgb|-light-[1-9])?:[^;]*;?/g;

/**
 * 剔除已写入的主题色变量，避免跨次调用在 cssText 里重复堆积
 * 同一次调用内，重复组由后续组覆盖（CSS 层叠）
 */
function stripPrimaryVars(str: string): string {
  return str.replace(PRIMARY_VAR_RE, "").trim();
}

/** 核心推进：只写一次，消除 12 次 setProperty 的视图抖动 */
function writePrimaryVars(
  target: HTMLElement,
  color: string,
  isDark: boolean,
  varPrefix: string,
) {
  const safeColor = normalizeThemeColor(color);
  const rgb = hexToRgb(safeColor);
  const rgbVar = rgb ? `${rgb[0]},${rgb[1]},${rgb[2]}` : "";
  const dark2 = isDark ? getLightColor(safeColor, 2) : getDarkColor(safeColor, 2);
  const lights = Array.from({ length: 9 }, (_, i) => {
    const level = isDark ? getDarkColor(safeColor, i + 1) : getLightColor(safeColor, i + 1);
    return `--el-color-${varPrefix}light-${i + 1}: ${level}`;
  }).join("; ");
  const strip = stripPrimaryVars(target.style.cssText);
  target.style.cssText = `${strip};\
    --el-color-primary: ${safeColor};\
    --el-color-primary-rgb: ${rgbVar};\
    --el-color-primary-dark-2: ${dark2};\
    ${lights};`;
}

/** 写入 Element Plus 主题色及 9 级色阶 */
export function applyPrimaryColorVars(target: HTMLElement, color: string, isDark: boolean) {
  writePrimaryVars(target, color, isDark, "primary-");
}

/** 写入 Element Plus 单个状态色变量及 9 级色阶（success / warning / danger / info） */
function applyStateColorVars(target: HTMLElement, varName: string, color: string, isDark: boolean) {
  const safeColor = normalizeThemeColor(color);
  const rgb = hexToRgb(safeColor);
  const rgbVar = rgb ? `${rgb[0]},${rgb[1]},${rgb[2]}` : "";
  const dark2 = isDark ? getLightColor(safeColor, 2) : getDarkColor(safeColor, 2);
  const lights = Array.from({ length: 9 }, (_, i) => {
    const level = isDark ? getDarkColor(safeColor, i + 1) : getLightColor(safeColor, i + 1);
    return `--el-color-${varName}-light-${i + 1}: ${level}`;
  }).join("; ");
  target.style.cssText = `${target.style.cssText};\
    --el-color-${varName}: ${safeColor};\
    --el-color-${varName}-rgb: ${rgbVar};\
    --el-color-${varName}-dark-2: ${dark2};\
    ${lights};`;
}

/**
 * 实时写入消息状态色 CSS 变量，控制全局 el-message / el-notification 颜色。
 * @param colors type → hex，缺省项不覆盖
 */
export function applyMessageColorVars(
  target: HTMLElement,
  colors: Partial<Record<MessageStateType, string>>,
  isDark: boolean,
) {
  const varMap: Record<MessageStateType, string> = {
    success: "success",
    warning: "warning",
    danger: "error",
    info: "info",
  };
  (Object.keys(colors) as MessageStateType[]).forEach((type) => {
    const color = colors[type];
    if (color) {
      applyStateColorVars(target, varMap[type], color, isDark);
    }
  });
}

/** hex 转 rgb 数组 */
export function hexToRgb(hex: string): number[] | null {
  const normalized = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return null;
  }
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

/** 展开 #RGB 为 #RRGGBB */
export function expandShortHex(hex: string): string {
  if (/^#([0-9A-Fa-f]{3})$/.test(hex)) {
    const s = hex.slice(1);
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  }
  return hex;
}

/** 校验并规范化主题色，非法值回退 fallback */
export function normalizeThemeColor(color: string | null | undefined, fallback = DEFAULT_THEME): string {
  const expanded = expandShortHex((color || "").trim());
  return /^#([0-9A-Fa-f]{6})$/.test(expanded) ? expanded : fallback;
}

/** 两色线性混合，weight 为 color2 权重（0~1） */
export function mixColor(color1: string, color2: string, weight: number): string {
  const w = Math.max(0, Math.min(1, weight));
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  if (!c1 || !c2) {
    return color1;
  }
  const r = Math.round(c1[0] * (1 - w) + c2[0] * w);
  const g = Math.round(c1[1] * (1 - w) + c2[1] * w);
  const b = Math.round(c1[2] * (1 - w) + c2[2] * w);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** 亮色模式色阶：向白色靠拢 */
export function getLightColor(color: string, level: number): string {
  return mixColor(color, "#ffffff", level * 0.1);
}

/** 暗色模式色阶：向黑色靠拢 */
export function getDarkColor(color: string, level: number): string {
  return mixColor(color, "#000000", level * 0.1);
}
