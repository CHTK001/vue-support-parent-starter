/**
 * useResponsiveDialog —— 弹窗响应式尺寸 composable
 *
 * 基于 @vueuse/core 的 mediaQuery 实现：
 *   - 监听预设/自定义断点
 *   - 根据当前断点返回最终 width / top / fullscreen
 *   - 支持手机端自动全屏
 *
 * 用法：
 *   const { width, top, isFullscreen, breakpoint } = useResponsiveDialog(props, {
 *     mobileBreakpoint: 768,
 *     desktopWidth: '640px',
 *     mobileFullscreen: true,
 *   });
 */
import { computed, type CSSProperties } from "vue";
import { useMediaQuery } from "@vueuse/core";

export interface UseResponsiveDialogOptions {
  /** 移动端断点（<= 该值视为移动端） */
  mobileBreakpoint?: number;
  /** 自定义断点对象（覆盖默认 sm/md/lg/xl） */
  breakpoints?: { sm?: number; md?: number; lg?: number; xl?: number };
  /** 移动端是否自动全屏 */
  mobileFullscreen?: boolean;
  /** 容器最大宽度（移动端全屏时仍受此限制） */
  maxWidth?: number;
}

export interface ResolvedDialogSize {
  width: string | number;
  top: string;
  height?: string;
  fullscreen: boolean;
  /** 当前命中的断点 key */
  breakpoint: "xs" | "sm" | "md" | "lg" | "xl";
}

const DEFAULT_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/**
 * 把 width 值在不同断点下统一映射为字符串
 * - 数字: 返回 `${n}px`
 * - 字符串: 原样返回
 * - undefined: 返回 undefined
 */
function normalizeWidth(w: string | number | undefined): string | undefined {
  if (w === undefined || w === null) return undefined;
  return typeof w === "number" ? `${w}px` : w;
}

export function useResponsiveDialog(
  props: {
    width?: string | number;
    top?: string;
    fullscreen?: boolean;
  },
  options: UseResponsiveDialogOptions = {},
) {
  const bp = { ...DEFAULT_BREAKPOINTS, ...(options.breakpoints ?? {}) };
  const mobileBp = options.mobileBreakpoint ?? bp.md;
  const mobileFullscreen = options.mobileFullscreen ?? true;

  // 预先抛几条 media，避免响应延迟
  const isXs = useMediaQuery(`(max-width: ${bp.sm - 1}px)`);
  const isSm = useMediaQuery(`(min-width: ${bp.sm}px) and (max-width: ${bp.md - 1}px)`);
  const isMd = useMediaQuery(`(min-width: ${bp.md}px) and (max-width: ${bp.lg - 1}px)`);
  const isLg = useMediaQuery(`(min-width: ${bp.lg}px) and (max-width: ${bp.xl - 1}px)`);

  const breakpoint = computed<ResolvedDialogSize["breakpoint"]>(() => {
    if (isXs.value) return "xs";
    if (isSm.value) return "sm";
    if (isMd.value) return "md";
    if (isLg.value) return "lg";
    return "xl";
  });

  const isMobile = computed(() => breakpoint.value === "xs" || breakpoint.value === "sm");

  const resolved = computed<ResolvedDialogSize>(() => {
    // 显式全屏优先
    if (props.fullscreen) {
      return {
        width: "100vw",
        top: "0",
        height: "100vh",
        fullscreen: true,
        breakpoint: breakpoint.value,
      };
    }
    // 移动端自动全屏
    if (mobileFullscreen && isMobile.value) {
      return {
        width: "100vw",
        top: "0",
        height: "100vh",
        fullscreen: true,
        breakpoint: breakpoint.value,
      };
    }
    const w = normalizeWidth(props.width) ?? "50%";
    return {
      width: w,
      top: props.top ?? "15vh",
      fullscreen: false,
      breakpoint: breakpoint.value,
    };
  });

  /** 喂给 el-dialog 的样式（含 maxWidth 限制） */
  const elStyle = computed<CSSProperties>(() => {
    if (resolved.value.fullscreen) {
      return {
        margin: "0",
        width: "100vw",
        height: "100vh",
        maxWidth: "100vw",
        maxHeight: "100vh",
        borderRadius: "0",
      };
    }
    // 仅控制水平居中，垂直间距用 marginTop，避免 margin 简写把 ElDialog 的 top 覆盖成 0 导致贴顶
    const style: CSSProperties = {
      marginTop: resolved.value.top,
      marginLeft: "auto",
      marginRight: "auto",
      width: resolved.value.width,
      maxWidth: options.maxWidth ? `${options.maxWidth}px` : undefined,
    };
    return style;
  });

  return {
    width: computed(() => resolved.value.width),
    top: computed(() => resolved.value.top),
    height: computed(() => resolved.value.height),
    fullscreen: computed(() => resolved.value.fullscreen),
    breakpoint,
    isMobile,
    elStyle,
  };
}
