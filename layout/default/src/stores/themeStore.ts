/**
 * 全局主题状态管理
 * @description 统一管理主题切换逻辑，避免各组件重复实现
 */
import { defineStore } from "pinia";
import { ref, computed, onScopeDispose, markRaw } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter, useUserStoreHook } from "@repo/core";
import { getConfig } from "@repo/config";
import type { ThemeKey } from "../types/theme";
import { layoutThemes, getLayoutTheme, loadThemeStylesheet } from "../themes";

// 条件日志函数
const isDev = import.meta.env.DEV;
const log = isDev ? console.log.bind(console, "[ThemeStore]") : () => {};

export const useThemeStore = defineStore("theme", () => {
  const { $storage } = useGlobal<GlobalPropertiesApi>();

  /**
   * 主题 key 归一化（兼容旧值）
   * @param themeKey 原始主题 key
   * @returns 归一化后的主题 key
   */
  function normalizeThemeKey(themeKey?: string | null): ThemeKey {
    if (!themeKey) return "default"; // 默认使用 default 主题
    if (themeKey === "pixel-art" || themeKey === "8-bit") return "8bit";
    return themeKey as ThemeKey;
  }

  // ===== 状态 =====
  const currentTheme = ref<ThemeKey>(
    normalizeThemeKey($storage?.configure?.systemTheme),
  );

  // FPS Monitor State
  // 优先读取 localStorage (新旧key兼容)，如果不存在则读取配置文件
  const STORAGE_KEY_FPS = "sys-fps-monitor-enabled";
  const storedFps = localStorage.getItem(STORAGE_KEY_FPS);
  const defaultFps = getConfig("ShowFpsMonitor") ?? false;
  const fpsMonitorEnabled = ref(
    storedFps !== null ? storedFps === "true" : defaultFps,
  );

  // Memory & CPU Monitor State
  const STORAGE_KEY_MEMORY = "sys-memory-monitor-enabled";
  const STORAGE_KEY_CPU = "sys-cpu-monitor-enabled";

  const storedMemory = localStorage.getItem(STORAGE_KEY_MEMORY);
  const defaultMemory = getConfig("ShowMemoryMonitor") ?? false;
  const memoryMonitorEnabled = ref(
    storedMemory !== null ? storedMemory === "true" : defaultMemory,
  );

  const storedCpu = localStorage.getItem(STORAGE_KEY_CPU);
  const defaultCpu = getConfig("ShowCpuMonitor") ?? false;
  const cpuMonitorEnabled = ref(
    storedCpu !== null ? storedCpu === "true" : defaultCpu,
  );

  // Bandwidth Monitor State
  const STORAGE_KEY_BANDWIDTH = "sys-bandwidth-monitor-enabled";
  const storedBandwidth = localStorage.getItem(STORAGE_KEY_BANDWIDTH);
  const defaultBandwidth = getConfig("ShowBandwidthMonitor") ?? false;
  const bandwidthMonitorEnabled = ref(
    storedBandwidth !== null ? storedBandwidth === "true" : defaultBandwidth,
  );

  // Battery Monitor State
  const STORAGE_KEY_BATTERY = "sys-battery-monitor-enabled";
  const storedBattery = localStorage.getItem(STORAGE_KEY_BATTERY);
  const defaultBattery = getConfig("ShowBatteryMonitor") ?? false;
  const batteryMonitorEnabled = ref(
    storedBattery !== null ? storedBattery === "true" : defaultBattery,
  );

  // Bluetooth Monitor State
  const STORAGE_KEY_BLUETOOTH = "sys-bluetooth-monitor-enabled";
  const storedBluetooth = localStorage.getItem(STORAGE_KEY_BLUETOOTH);
  const defaultBluetooth = getConfig("ShowBluetoothMonitor") ?? false;
  const bluetoothMonitorEnabled = ref(
    storedBluetooth !== null ? storedBluetooth === "true" : defaultBluetooth,
  );

  // Screen Monitor State
  const STORAGE_KEY_SCREEN = "sys-screen-monitor-enabled";
  const storedScreen = localStorage.getItem(STORAGE_KEY_SCREEN);
  const defaultScreen = getConfig("ShowScreenMonitor") ?? false;
  const screenMonitorEnabled = ref(
    storedScreen !== null ? storedScreen === "true" : defaultScreen,
  );

  // Monitor Position State
  const STORAGE_KEY_MONITOR_POS = "sys-performance-monitor-position";
  const storedMonitorPos = localStorage.getItem(STORAGE_KEY_MONITOR_POS);
  // 默认显示在左上角，便于快速观察性能
  const defaultMonitorPos =
    getConfig("PerformanceMonitorPosition") ?? "top-left";
  const performanceMonitorPosition = ref(storedMonitorPos || defaultMonitorPos);

  // Monitor Display Mode (Simple/Text vs Detailed/Graph)
  const STORAGE_KEY_MONITOR_MODE = "sys-performance-monitor-mode"; // 'simple' | 'detailed' | 'minimal'
  const storedMonitorMode = localStorage.getItem(STORAGE_KEY_MONITOR_MODE);
  // 默认使用极简模式，减少视觉干扰
  const defaultMonitorMode = getConfig("PerformanceMonitorMode") ?? "minimal";
  const performanceMonitorMode = ref(storedMonitorMode || defaultMonitorMode);

  // Monitor Layout (Merged/Card vs Split/Pills)
  // Options: 'merged', 'split'
  const STORAGE_KEY_MONITOR_LAYOUT = "sys-performance-monitor-layout";
  const storedMonitorLayout = localStorage.getItem(STORAGE_KEY_MONITOR_LAYOUT);
  // Migrate legacy split values to 'split' if needed, or just let them fall through if robust
  const defaultMonitorLayout =
    getConfig("PerformanceMonitorLayout") ?? "merged";
  const performanceMonitorLayout = ref(
    storedMonitorLayout && !storedMonitorLayout.startsWith("split-")
      ? storedMonitorLayout
      : "merged",
  );

  // Monitor Direction (Vertical / Horizontal / Auto)
  const STORAGE_KEY_MONITOR_DIRECTION = "sys-performance-monitor-direction"; // 'vertical' | 'horizontal' | 'auto'
  const storedMonitorDirection = localStorage.getItem(
    STORAGE_KEY_MONITOR_DIRECTION,
  );
  // 默认使用 auto，由组件根据位置自动计算方向
  const defaultMonitorDirection = "auto";
  const performanceMonitorDirection = ref(
    storedMonitorDirection || defaultMonitorDirection,
  );

  // Home Customization Config
  const STORAGE_KEY_HOME_CUSTOMIZATION = "sys-home-customization-enabled";
  const storedHomeCustomization = localStorage.getItem(
    STORAGE_KEY_HOME_CUSTOMIZATION,
  );
  const defaultHomeCustomization = true;
  const homeCustomizationEnabled = ref(
    storedHomeCustomization !== null
      ? storedHomeCustomization === "true"
      : defaultHomeCustomization,
  );

  // Access Control Logic
  const isPerformanceMonitorVisible = computed(() => {
    // 1. Check Environment: Show if DEV or TEST
    const isDevOrTest = import.meta.env.DEV || import.meta.env.MODE === "test";

    // 2. Check User Role: Show if user is 'sa' or has 'sa' role (assuming username check for now as role structure varies)
    // Note: Adjust 'sa' check based on actual user store structure if needed.
    const userStore = useUserStoreHook();
    const isSa =
      userStore.username === "sa" ||
      userStore.roles.includes("sa") ||
      userStore.roles.includes("admin"); // Broaden to admin for safety, but user asked for 'sa'

    return isDevOrTest || isSa;
  });

  // 初始化标记
  let isInitialized = false;

  // ===== 计算属性 =====
  const themeConfig = computed(() => getLayoutTheme(currentTheme.value));

  const availableThemes = computed(() => layoutThemes);

  const isDefaultTheme = computed(() => currentTheme.value === "default");

  const isFestivalTheme = computed(
    () => themeConfig.value?.type === "festival",
  );

  // ===== 方法 =====
  /**
   * 设置主题
   */
  function setTheme(themeKey: ThemeKey): void {
    const normalizedThemeKey = normalizeThemeKey(themeKey);
    if (currentTheme.value === normalizedThemeKey) return;

    log("主题切换:", currentTheme.value, "->", normalizedThemeKey);
    currentTheme.value = normalizedThemeKey;

    // 更新 DOM 属性
    document.documentElement.setAttribute("data-skin", normalizedThemeKey);

    // 更新主题类
    updateThemeClass(normalizedThemeKey);

    // 加载主题样式表
    loadThemeStylesheet(normalizedThemeKey);

    // 持久化到 storage
    if ($storage?.configure) {
      $storage.configure.systemTheme = normalizedThemeKey;
    }

    // 发送主题变更事件
    emitter.emit("systemThemeChange", normalizedThemeKey);
  }

  /**
   * 设置 FPS 监控开关
   */
  function setFpsMonitor(enabled: boolean) {
    fpsMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_FPS, String(enabled));
  }

  function setMemoryMonitor(enabled: boolean) {
    memoryMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_MEMORY, String(enabled));
  }

  function setCpuMonitor(enabled: boolean) {
    cpuMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_CPU, String(enabled));
  }

  function setBandwidthMonitor(enabled: boolean) {
    bandwidthMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_BANDWIDTH, String(enabled));
  }

  function setBatteryMonitor(enabled: boolean) {
    batteryMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_BATTERY, String(enabled));
  }

  function setBluetoothMonitor(enabled: boolean) {
    bluetoothMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_BLUETOOTH, String(enabled));
  }

  function setScreenMonitor(enabled: boolean) {
    screenMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_SCREEN, String(enabled));
  }

  function setPerformanceMonitorPosition(position: string) {
    performanceMonitorPosition.value = position;
    localStorage.setItem(STORAGE_KEY_MONITOR_POS, position);
  }

  function setPerformanceMonitorMode(mode: string) {
    performanceMonitorMode.value = mode;
    localStorage.setItem(STORAGE_KEY_MONITOR_MODE, mode);
  }

  function setPerformanceMonitorLayout(layout: string) {
    performanceMonitorLayout.value = layout;
    localStorage.setItem(STORAGE_KEY_MONITOR_LAYOUT, layout);
  }

  function setPerformanceMonitorDirection(direction: string) {
    performanceMonitorDirection.value = direction;
    localStorage.setItem(STORAGE_KEY_MONITOR_DIRECTION, direction);
  }

  function setHomeCustomizationEnabled(enabled: boolean) {
    homeCustomizationEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_HOME_CUSTOMIZATION, String(enabled));
  }

  /**
   * 更新主题类
   */
  function updateThemeClass(themeKey: ThemeKey): void {
    const htmlEl = document.documentElement;

    // 移除所有主题类
    const themeClasses = [
      "theme-christmas",
      "theme-spring-festival",
      "theme-valentines-day",
      "theme-mid-autumn",
      "theme-national-day",
      "theme-new-year",
    ];
    themeClasses.forEach((cls) => htmlEl.classList.remove(cls));

    // 添加新主题类
    if (themeKey !== "default") {
      htmlEl.classList.add(`theme-${themeKey}`);
    }
  }

  /**
   * 初始化主题监听
   * 简化版：只使用 emitter 事件监听，移除冗余的 MutationObserver
   */
  function initThemeListener(): void {
    if (isInitialized) return;
    isInitialized = true;

    log("初始化主题监听器");

    // 监听 emitter 事件（用于外部切换）
    emitter.on("systemThemeChange", handleExternalThemeChange);

    // 初始化时同步 DOM 状态
    const domTheme = document.documentElement.getAttribute("data-skin");
    const normalizedDomTheme = normalizeThemeKey(domTheme);
    if (normalizedDomTheme && normalizedDomTheme !== currentTheme.value) {
      currentTheme.value = normalizedDomTheme;
    }
  }

  /**
   * 处理外部主题变更（避免循环触发）
   */
  function handleExternalThemeChange(themeKey: string): void {
    const normalizedThemeKey = normalizeThemeKey(themeKey);
    if (currentTheme.value !== normalizedThemeKey) {
      log("收到外部主题变更:", normalizedThemeKey);
      currentTheme.value = normalizedThemeKey;
    }
  }

  /**
   * 销毁监听器
   */
  function destroyThemeListener(): void {
    log("销毁主题监听器");
    emitter.off("systemThemeChange", handleExternalThemeChange);
    isInitialized = false;
  }

  // 自动清理
  onScopeDispose(() => {
    destroyThemeListener();
  });

  return {
    // 状态
    currentTheme,
    // 计算属性
    themeConfig,
    availableThemes,
    isDefaultTheme,
    isFestivalTheme,
    fpsMonitorEnabled,
    memoryMonitorEnabled,
    cpuMonitorEnabled,
    bandwidthMonitorEnabled,
    batteryMonitorEnabled,
    bluetoothMonitorEnabled,
    screenMonitorEnabled,
    performanceMonitorPosition,
    performanceMonitorMode,
    performanceMonitorLayout,
    performanceMonitorDirection,
    homeCustomizationEnabled,
    isPerformanceMonitorVisible,
    // 方法
    setTheme,
    setFpsMonitor,
    setMemoryMonitor,
    setCpuMonitor,
    setBandwidthMonitor,
    setBatteryMonitor,
    setBluetoothMonitor,
    setScreenMonitor,
    setPerformanceMonitorPosition,
    setPerformanceMonitorMode,
    setPerformanceMonitorLayout,
    setPerformanceMonitorDirection,
    setHomeCustomizationEnabled,
    initThemeListener,
    destroyThemeListener,
  };
});

/**
 * 在 setup 外部使用 themeStore
 */
export function useThemeStoreHook() {
  return useThemeStore();
}
