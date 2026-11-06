/**
 * APM 图形的主题取色。
 *
 * <p>为什么需要它：ECharts / SVG 画在 canvas 上，`fillStyle = "var(--x)"`
 * 是无效值 —— 浏览器会静默忽略，最后全部退回默认色（浅色主题下刚好能看，
 * 一切深色主题就变成一堆看不清的暗灰）。所以图形颜色必须在运行时从
 * 计算样式里读出来，并跟着 `html` 的 class 变化重新取值。</p>
 *
 * <p><b>Signal 深空遥测</b>：颜色本体全部取自系统 koi 令牌
 * （{@code @repo/theme/styles/tokens.css}），主强调是 koi 的
 * {@code --metric-net} 网络青，跟随 {@code html.dark} 自动切深浅主题。
 * 只暴露图里真正用到的九个颜色，不做一个通用的 var() 求值器。</p>
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
  /** 主色（Signal 青） */
  primary: string;
  /** 成功 */
  ok: string;
  /** 警告 */
  warn: string;
  /** 危险 */
  bad: string;
}

/**
 * 读一个 CSS 变量，取不到时用兜底值（SSR / koi 令牌尚未注入的首帧都走这里）。
 *
 * <p>`color-mix()` 这类计算值在 canvas 里同样无效，因此这里读的是 koi 的
 * 实色令牌；派生透明度统一在组件里用 {@link withAlpha} 处理。</p>
 */
function readVar(name: string, fallback: string): string {
  if (typeof document === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** 当前主题下的一份取值（真源 = koi 令牌） */
function snapshot(): ApmPalette {
  return {
    text: readVar("--text-primary", "#e4e6ef"),
    dim: readVar("--text-secondary", "#9ca0b0"),
    faint: readVar("--text-tertiary", "#6b7080"),
    line: readVar("--border-subtle", "rgba(255,255,255,.06)"),
    surface: readVar("--bg-container", "#1a1d27"),
    primary: readVar("--metric-net", "#06b6d4"),
    ok: readVar("--status-success", "#4ade80"),
    warn: readVar("--status-warning", "#fbbf24"),
    bad: readVar("--status-error", "#ff6b6b"),
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
