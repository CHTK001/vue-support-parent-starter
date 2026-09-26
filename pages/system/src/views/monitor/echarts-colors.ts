/**
 * ECharts 颜色工具：将 CSS 变量解析为 Canvas 可识别的实际颜色值。
 *
 * ECharts 渲染到 <canvas> 时无法解析 var(--el-*)，
 * 必须用 getComputedStyle 获取实际 hex/rgb 值。
 *
 * useElColors() 返回 reactive 对象，主题切换（<html> class 变化）时自动重新读取。
 */
import { reactive, onBeforeUnmount } from "vue";

/** 所有需要解析的 CSS 变量 */
const VARS = [
  ["primary", "--el-color-primary"],
  ["success", "--el-color-success"],
  ["warning", "--el-color-warning"],
  ["danger", "--el-color-danger"],
  ["info", "--el-color-info"],
  ["fill", "--el-fill-color"],
  ["textPrimary", "--el-text-color-primary"],
  ["textSecondary", "--el-text-color-secondary"],
  ["bgColor", "--el-bg-color"],
  ["borderLight", "--el-border-color-light"],
] as const;

/** 解析单个 CSS 变量 */
function readVar(name: string): string {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  } catch {
    return "";
  }
}

/** 将 hex/rgb 颜色转为 rgba 字符串（带透明度） */
export function withAlpha(color: string, alpha: number): string {
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }
  const hex6 = color.match(/^#([0-9a-f]{6})$/i);
  if (hex6) {
    const r = parseInt(hex6[1].slice(0, 2), 16);
    const g = parseInt(hex6[1].slice(2, 4), 16);
    const b = parseInt(hex6[1].slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const hex3 = color.match(/^#([0-9a-f]{3})$/i);
  if (hex3) {
    const r = parseInt(hex3[1][0] + hex3[1][0], 16);
    const g = parseInt(hex3[1][1] + hex3[1][1], 16);
    const b = parseInt(hex3[1][2] + hex3[1][2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

/** 填充 reactive 对象 */
function fillColors(target: Record<string, string>) {
  for (const [key, cssVar] of VARS) {
    target[key] = readVar(cssVar);
  }
}

/**
 * 预解析常用 Element Plus 颜色，供 ECharts option 使用。
 * 返回 reactive 对象；监听 <html> class 变化，主题切换时自动更新。
 */
export function useElColors() {
  const colors = reactive<Record<string, string>>({});
  fillColors(colors);

  // 主题切换（dark class 变化）时重新读取
  const observer = new MutationObserver(() => {
    fillColors(colors);
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });

  // 组件卸载时停止观察（在 setup 中调用，自动清理）
  onBeforeUnmount(() => observer.disconnect());

  return colors as {
    primary: string; success: string; warning: string; danger: string; info: string;
    fill: string; textPrimary: string; textSecondary: string;
    bgColor: string; borderLight: string;
  };
}
