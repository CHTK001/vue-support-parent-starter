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
 * 品牌色阶变量名。
 *
 * <p>自绘面板（ReChart 的 topology / atlas / orbit / matrix / race）与大量视图层样式
 * 读的是 `--brand-*`，不是 `--el-color-*`。这两套此前是分裂的：`--el-color-primary`
 * 跟着用户选的主题色走，`--brand-*` 却在 tokens.css 里写死成 koi 紫 #6d5dfc ——
 * 于是换任何主题色（含卡其色），图表和自绘面板都停在紫色上。</p>
 *
 * <p>修法是把品牌色阶也交给同一处注入：主题色一处改，组件层与图表层同时跟随。</p>
 */
const BRAND_VARS = [
  "--brand-50",
  "--brand-100",
  "--brand-200",
  "--brand-300",
  "--brand-400",
  "--brand-500",
  "--brand-600",
  "--brand-gradient",
  "--shadow-brand",
  "--badge-glow",
  "--focus-ring",
  "--selection-bg",
  "--selection-bg-fade",
] as const;

/** 清理品牌色阶变量的正则（与 BRAND_VARS 同源，避免两处各写一份） */
const BRAND_VAR_RE = new RegExp(`(?:${BRAND_VARS.join("|")}):[^;]*;?`, "g");

/**
 * 剔除已写入的主题色变量，避免跨次调用在 cssText 里重复堆积
 * 同一次调用内，重复组由后续组覆盖（CSS 层叠）
 */
function stripPrimaryVars(str: string): string {
  return str.replace(PRIMARY_VAR_RE, "").replace(BRAND_VAR_RE, "").trim();
}

/**
 * 由主题色派生品牌色阶（`--brand-*`）。
 *
 * <p>色阶与 Element 的 light-1~9 走同一套 mix 算法，保证「组件色」与「图表色」
 * 是同一条色带的两个刻度，不会出现按钮偏暖、曲线偏冷。</p>
 *
 * <p>暗色下 50/100 改用半透明（与 tokens.css 的 dark 段一致）：深底上不透明的浅色块
 * 会糊成一片白，半透明才能透出层级。</p>
 */
function buildBrandVars(color: string, isDark: boolean): string {
  const rgb = hexToRgb(color);
  const rgbVar = rgb ? `${rgb[0]},${rgb[1]},${rgb[2]}` : "0,0,0";
  const soft = (alpha: number) => `rgba(${rgbVar},${alpha})`;
  const tint = (weight: number) => mixColor(color, "#ffffff", weight);
  /* 暗色下基准色向白提一档：深底上直接用基础色画 1px 曲线会太沉 */
  const base = isDark ? tint(0.12) : color;
  /* 注意 getDarkColor 的第二参是「档位」不是权重（内部再 ×0.1），
     想压深 20% 要传 2 档，传 0.2 只会黑化 2%，brand-600 会和 500 几乎同色。 */
  const deep = isDark ? tint(0.02) : getDarkColor(color, 2);
  const tiers = isDark
    ? {
        "brand-50": soft(0.15),
        "brand-100": soft(0.25),
        "brand-200": soft(0.38),
        "brand-300": tint(0.42),
        "brand-400": tint(0.26),
        "brand-500": base,
        "brand-600": tint(0.16),
      }
    : {
        "brand-50": soft(0.06),
        "brand-100": soft(0.12),
        "brand-200": soft(0.22),
        "brand-300": tint(0.45),
        "brand-400": tint(0.28),
        "brand-500": base,
        "brand-600": deep,
      };
  const gradient = `linear-gradient(135deg, ${tiers["brand-500"]} 0%, ${tiers["brand-400"]} 100%)`;
  const shadowBrand = `0 2px 8px ${soft(isDark ? 0.4 : 0.25)}`;
  const badgeGlow = `0 0 6px ${soft(isDark ? 0.6 : 0.5)}`;
  const focusRing = `0 0 0 3px ${soft(isDark ? 0.25 : 0.18)}`;
  return [
    ...(Object.keys(tiers) as Array<keyof typeof tiers>).map((k) => `--${k}: ${tiers[k]}`),
    `--brand-gradient: ${gradient}`,
    `--shadow-brand: ${shadowBrand}`,
    `--badge-glow: ${badgeGlow}`,
    `--focus-ring: ${focusRing}`,
    `--selection-bg: ${soft(isDark ? 0.3 : 0.18)}`,
    `--selection-bg-fade: ${soft(0.035)}`,
  ].join("; ");
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
    ${lights};\
    ${buildBrandVars(safeColor, isDark)};`;
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
