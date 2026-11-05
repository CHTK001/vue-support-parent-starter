/**
 * APM 图形的主题取色。
 *
 * <p>为什么需要它：ECharts 画在 canvas 上，`fillStyle = "var(--el-color-primary)"`
 * 是无效值 —— 浏览器会静默忽略，最后全部退回默认色（浅色主题下刚好能看，
 * 一切深色主题就变成一堆看不清的暗灰）。所以图形颜色必须在运行时从
 * 计算样式里读出来，并跟着 `html` 的 class 变化重新取值。</p>
 *
 * <p>只暴露图里真正用到的九个颜色，不做一个通用的 var() 求值器：
 * 颜色越多，两个主题之间越容易有一处忘了对齐。</p>
 *
 * @since 4.0.0.51
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";

/** 图形调色板 */
export interface ApmPalette {
  /** 主文字 */
  text: string;
  /** 次级文字 */
  dim: string;
  /** 更淡的文字（轴标签） */
  faint: string;
  /** 分割线 */
  line: string;
  /** 块底色 */
  surface: string;
  /** 主色 */
  primary: string;
  /** 成功 */
  ok: string;
  /** 警告 */
  warn: string;
  /** 危险 */
  bad: string;
}

/** 读一个 CSS 变量，取不到时用兜底值（SSR / 首帧竞态都走这里） */
function readVar(name: string, fallback: string): string {
  if (typeof document === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** 当前主题下的一份取值 */
function snapshot(): ApmPalette {
  return {
    text: readVar("--el-text-color-primary", "#0f1b24"),
    dim: readVar("--el-text-color-secondary", "#6a7c8a"),
    faint: readVar("--el-text-color-placeholder", "#8b9aa6"),
    line: readVar("--el-border-color-lighter", "#e3e9ee"),
    surface: readVar("--el-bg-color", "#ffffff"),
    primary: readVar("--el-color-primary", "#1f7ae0"),
    ok: readVar("--el-color-success", "#12a06a"),
    warn: readVar("--el-color-warning", "#d98b00"),
    bad: readVar("--el-color-danger", "#d93a3a"),
  };
}

/**
 * 响应式的主题调色板。
 *
 * <p>监听 `<html>` 的 class：宿主切深浅色、换主题色都只改这个属性，
 * 因此不需要任何跨模块事件总线。</p>
 */
export function useApmPalette(): Ref<ApmPalette> {
  const palette = ref<ApmPalette>(snapshot());
  let observer: MutationObserver | null = null;

  onMounted(() => {
    palette.value = snapshot();
    if (typeof MutationObserver === "undefined") {
      return;
    }
    observer = new MutationObserver(() => {
      palette.value = snapshot();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
  });

  onBeforeUnmount(() => {
    observer?.disconnect();
    observer = null;
  });

  return palette;
}
