/**
 * 主题组件 Hook
 * @description 提供主题组件动态加载功能，基于全局 themeStore 实现
 * @version 2.0.0 - 重构版本，移除重复监听逻辑
 */
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useThemeStore } from "../stores/themeStore";
import { useDataThemeChange } from "./useDataThemeChange";
import type { ThemeKey, ThemeComponentMap } from "../types/theme";
import type { Component } from "vue";

/**
 * 主题组件 Hook
 * @param themeComponents 主题组件映射表
 * @param defaultComponent 默认组件
 * @returns 当前主题和对应组件
 * 
 * @example
 * ```ts
 * const themeComponents = {
 *   'default': DefaultNavbar,
 *   'spring-festival': SpringFestivalNavbar,
 * };
 * const { currentTheme, CurrentComponent } = useThemeComponent(themeComponents, DefaultNavbar);
 * ```
 */
export function useThemeComponent<T extends Component>(
  themeComponents: ThemeComponentMap<T>,
  defaultComponent: T
) {
  const themeStore = useThemeStore();
  const { currentTheme } = storeToRefs(themeStore);

  // 初始化主题监听（只在首次调用时执行）
  onMounted(() => {
    themeStore.initThemeListener();
  });

  // 动态选择当前主题组件
  const CurrentComponent = computed<T>(() => {
    const themeKey = currentTheme.value as ThemeKey;
    return themeComponents[themeKey] ?? defaultComponent;
  });

  return {
    /** 当前主题键值 */
    currentTheme,
    /** 当前主题对应的组件 */
    CurrentComponent,
    /** 主题配置信息 */
    themeConfig: themeStore.themeConfig,
    /** 是否为默认主题 */
    isDefaultTheme: themeStore.isDefaultTheme,
    /** 切换主题方法 */
    setTheme: themeStore.setTheme,
  };
}

/**
 * 简化版：仅获取主题状态，不涉及组件切换
 */
export function useTheme() {
  const themeStore = useThemeStore();
  const { currentTheme } = storeToRefs(themeStore);
  const {
    dataTheme,
    overallStyle,
    layoutTheme,
    themeColors,
    dataThemeChange,
    setLayoutThemeColor,
    toggleClass,
  } = useDataThemeChange();

  onMounted(() => {
    themeStore.initThemeListener();
  });

  return {
    // 主题皮肤层（节日/高级主题）
    currentTheme,
    themeConfig: themeStore.themeConfig,
    isDefaultTheme: themeStore.isDefaultTheme,
    isFestivalTheme: themeStore.isFestivalTheme,
    availableThemes: themeStore.availableThemes,
    setTheme: themeStore.setTheme,
    // 全局暗黑 & 整体风格（统一出口）
    isDark: dataTheme,
    dataTheme,
    overallStyle,
    layoutTheme,
    themeColors,
    applyOverallStyle: dataThemeChange,
    setLayoutThemeColor,
    toggleClass,
    // 性能监控等扩展配置透出，避免各处单独依赖 themeStore
    fpsMonitorEnabled: themeStore.fpsMonitorEnabled,
    memoryMonitorEnabled: themeStore.memoryMonitorEnabled,
    cpuMonitorEnabled: themeStore.cpuMonitorEnabled,
    bandwidthMonitorEnabled: themeStore.bandwidthMonitorEnabled,
    batteryMonitorEnabled: themeStore.batteryMonitorEnabled,
    bluetoothMonitorEnabled: themeStore.bluetoothMonitorEnabled,
    screenMonitorEnabled: themeStore.screenMonitorEnabled,
    performanceMonitorPosition: themeStore.performanceMonitorPosition,
    performanceMonitorMode: themeStore.performanceMonitorMode,
    performanceMonitorLayout: themeStore.performanceMonitorLayout,
    performanceMonitorDirection: themeStore.performanceMonitorDirection,
    isPerformanceMonitorVisible: themeStore.isPerformanceMonitorVisible,
  };
}
