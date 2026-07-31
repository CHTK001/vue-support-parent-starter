/**
 * 主题色计算（唯一需要 JS 写入 CSS 变量的部分）
 *
 * 为什么单独拆出来？
 * - Element Plus 的 --el-color-primary / -light-1~9 / -dark-2 必须是 #RRGGBB 十六进制
 * - 用户可在运行时切换任意主题色，色阶需根据 themeColor 动态计算，CSS 无法预知用户选色
 * - 布局色（header/menu/aside）与 themeColor 无关，已迁移到 theme-vars.scss 纯 CSS 切换
 *
 * 算法与 Element Plus 官方一致：mix(primary, white|black, level * 0.1)
 */
import { DEFAULT_THEME } from "@repo/theme/koi/config/index.ts";

/** hex 转 rgb 数组，供混色与 --el-color-primary-rgb 使用 */
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

/** 展开 #RGB 为 #RRGGBB，兼容用户输入短格式 */
export function expandShortHex(hex: string): string {
  if (/^#([0-9A-Fa-f]{3})$/.test(hex)) {
    const s = hex.slice(1);
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  }
  return hex;
}

/** 校验并规范化主题色，非法值回退 DEFAULT_THEME */
export function normalizeThemeColor(color: string | null | undefined, fallback = DEFAULT_THEME): string {
  const expanded = expandShortHex((color || "").trim());
  return /^#([0-9A-Fa-f]{6})$/.test(expanded) ? expanded : fallback;
}

/**
 * 两色线性混合，weight 为 color2 的权重（0~1）
 * 例：mixColor("#2992FF", "#FFFFFF", 0.9) → 90% 白 + 10% 主色
 */
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

/** 亮色模式色阶：primary 向白色靠拢，level 1~9 对应 10%~90% 白色 */
export function getLightColor(color: string, level: number): string {
  return mixColor(color, "#ffffff", level * 0.1);
}

/** 暗色模式色阶：primary 向黑色靠拢 */
export function getDarkColor(color: string, level: number): string {
  return mixColor(color, "#000000", level * 0.1);
}

/**
 * 写入 Element Plus 主题色及 9 级色阶
 *
 * 亮色 isDark=false：light-N 混白，dark-2 混黑 20%
 * 暗色 isDark=true：light-N 混黑（EP 暗色下 light 变量实际偏深），dark-2 混白 20%
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
