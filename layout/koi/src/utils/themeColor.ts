/**
 * Theme color calculation (only part needing JS to write CSS variables)
 *
 * Element Plus --el-color-primary / -light-1~9 / -dark-2 must be #RRGGBB hex.
 * User can switch to any theme color at runtime; CSS cannot predict user choice.
 */
import { DEFAULT_THEME } from "../config/index";

/** hex to rgb array */
export function hexToRgb(hex: string): number[] | null {
  const normalized = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return null;
  }
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16)
  ];
}

/** Expand #RGB to #RRGGBB */
export function expandShortHex(hex: string): string {
  if (/^#([0-9A-Fa-f]{3})$/.test(hex)) {
    const s = hex.slice(1);
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  }
  return hex;
}

/** Normalize theme color, fallback to DEFAULT_THEME */
export function normalizeThemeColor(color: string | null | undefined, fallback = DEFAULT_THEME): string {
  const expanded = expandShortHex((color || "").trim());
  return /^#([0-9A-Fa-f]{6})$/.test(expanded) ? expanded : fallback;
}

/** Linear mix two colors, weight is color2's weight (0~1) */
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
  return `#${[r, g, b].map(n => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Light mode: primary towards white */
export function getLightColor(color: string, level: number): string {
  return mixColor(color, "#ffffff", level * 0.1);
}

/** Dark mode: primary towards black */
export function getDarkColor(color: string, level: number): string {
  return mixColor(color, "#000000", level * 0.1);
}

/**
 * Write Element Plus primary color and 9-level color scale
 */
export function applyPrimaryColorVars(target: HTMLElement, color: string, isDark: boolean) {
  const safeColor = normalizeThemeColor(color);
  target.style.setProperty("--el-color-primary", safeColor);
  const rgb = hexToRgb(safeColor);
  if (rgb) {
    target.style.setProperty("--el-color-primary-rgb", `${rgb[0]},${rgb[1]},${rgb[2]}`);
  }

  if (isDark) {
    target.style.setProperty("--el-color-primary-dark-2", getLightColor(safeColor, 2));
    for (let i = 1; i <= 9; i++) {
      target.style.setProperty(`--el-color-primary-light-${i}`, getDarkColor(safeColor, i));
    }
  } else {
    target.style.setProperty("--el-color-primary-dark-2", getDarkColor(safeColor, 2));
    for (let i = 1; i <= 9; i++) {
      target.style.setProperty(`--el-color-primary-light-${i}`, getLightColor(safeColor, i));
    }
  }
}
