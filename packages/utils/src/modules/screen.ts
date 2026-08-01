/**
 * 响应式屏幕判断（@repo/utils）
 *
 * 基于 @vueuse/core 的 useBreakpoints，提供移动端 / pad / 桌面 / 屏幕判断。
 */
import { reactive } from "vue";
import { useBreakpoints } from "@vueuse/core";

/** 断点定义 */
export const breakpointsEnum = {
  xl: 1600,
  lg: 1199,
  md: 991,
  sm: 767,
  xs: 575,
};

export const useScreenStore = () => {
  const breakpoints = reactive(useBreakpoints(breakpointsEnum));
  const isMobile = breakpoints.smaller("sm");
  const isPad = breakpoints.between("sm", "md");
  const isDesktop = breakpoints.greater("md");
  const isScreen = breakpoints.smaller("lg");
  return { breakpoints, isMobile, isPad, isDesktop, isScreen };
};
