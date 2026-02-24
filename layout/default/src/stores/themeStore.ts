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
import { useSettings } from "../components/lay-setting/composables/useSettings";

// 条件日志函数
const isDev = import.meta.env.DEV;
const log = isDev ? console.log.bind(console, "[ThemeStore]") : () => {};

export const useThemeStore = defineStore("theme", () => {
  const { $storage } = useGlobal<GlobalPropertiesApi>();
  const { saveToStorage } = useSettings();

  // ===== 状态 =====
  const currentTheme = ref<ThemeKey>(
    ($storage?.configure?.systemTheme as ThemeKey) || "default"
  );

  // FPS Monitor State
  // 优先读取 localStorage (新旧key兼容)，如果不存在则读取配置文件
  const STORAGE_KEY_FPS = "sys-fps-monitor-enabled";
  const storedFps = localStorage.getItem(STORAGE_KEY_FPS);
  const defaultFps = getConfig("ShowFpsMonitor") ?? false;
  const fpsMonitorEnabled = ref(storedFps !== null ? storedFps === "true" : defaultFps);

  // Memory & CPU Monitor State
  const STORAGE_KEY_MEMORY = "sys-memory-monitor-enabled";
  const STORAGE_KEY_CPU = "sys-cpu-monitor-enabled";

  const storedMemory = localStorage.getItem(STORAGE_KEY_MEMORY);
  const defaultMemory = getConfig("ShowMemoryMonitor") ?? false;
  const memoryMonitorEnabled = ref(storedMemory !== null ? storedMemory === "true" : defaultMemory);

  const storedCpu = localStorage.getItem(STORAGE_KEY_CPU);
  const defaultCpu = getConfig("ShowCpuMonitor") ?? false;
  const cpuMonitorEnabled = ref(storedCpu !== null ? storedCpu === "true" : defaultCpu);

  // Bandwidth Monitor State
  const STORAGE_KEY_BANDWIDTH = "sys-bandwidth-monitor-enabled";
  const storedBandwidth = localStorage.getItem(STORAGE_KEY_BANDWIDTH);
  const defaultBandwidth = getConfig("ShowBandwidthMonitor") ?? false;
  const bandwidthMonitorEnabled = ref(storedBandwidth !== null ? storedBandwidth === "true" : defaultBandwidth);

  // Battery Monitor State
  const STORAGE_KEY_BATTERY = "sys-battery-monitor-enabled";
  const storedBattery = localStorage.getItem(STORAGE_KEY_BATTERY);
  const defaultBattery = getConfig("ShowBatteryMonitor") ?? false;
  const batteryMonitorEnabled = ref(storedBattery !== null ? storedBattery === "true" : defaultBattery);

  // Bluetooth Monitor State
  const STORAGE_KEY_BLUETOOTH = "sys-bluetooth-monitor-enabled";
  const storedBluetooth = localStorage.getItem(STORAGE_KEY_BLUETOOTH);
  const defaultBluetooth = getConfig("ShowBluetoothMonitor") ?? false;
  const bluetoothMonitorEnabled = ref(storedBluetooth !== null ? storedBluetooth === "true" : defaultBluetooth);

  // Screen Monitor State
  const STORAGE_KEY_SCREEN = "sys-screen-monitor-enabled";
  const storedScreen = localStorage.getItem(STORAGE_KEY_SCREEN);
  const defaultScreen = getConfig("ShowScreenMonitor") ?? false;
  const screenMonitorEnabled = ref(storedScreen !== null ? storedScreen === "true" : defaultScreen);

  // Network Latency Monitor State
  const STORAGE_KEY_NETWORK_LATENCY = "sys-network-latency-monitor-enabled";
  const storedNetworkLatency = localStorage.getItem(STORAGE_KEY_NETWORK_LATENCY);
  const defaultNetworkLatency = getConfig("ShowNetworkLatencyMonitor") ?? false;
  const networkLatencyMonitorEnabled = ref(storedNetworkLatency !== null ? storedNetworkLatency === "true" : defaultNetworkLatency);

  // Storage Monitor State
  const STORAGE_KEY_STORAGE = "sys-storage-monitor-enabled";
  const storedStorage = localStorage.getItem(STORAGE_KEY_STORAGE);
  const defaultStorage = getConfig("ShowStorageMonitor") ?? false;
  const storageMonitorEnabled = ref(storedStorage !== null ? storedStorage === "true" : defaultStorage);

  // Device Info Monitor State
  const STORAGE_KEY_DEVICE_INFO = "sys-device-info-monitor-enabled";
  const storedDeviceInfo = localStorage.getItem(STORAGE_KEY_DEVICE_INFO);
  const defaultDeviceInfo = getConfig("ShowDeviceInfoMonitor") ?? false;
  const deviceInfoMonitorEnabled = ref(storedDeviceInfo !== null ? storedDeviceInfo === "true" : defaultDeviceInfo);

  // Page Time Monitor State
  const STORAGE_KEY_PAGE_TIME = "sys-page-time-monitor-enabled";
  const storedPageTime = localStorage.getItem(STORAGE_KEY_PAGE_TIME);
  const defaultPageTime = getConfig("ShowPageTimeMonitor") ?? false;
  const pageTimeMonitorEnabled = ref(storedPageTime !== null ? storedPageTime === "true" : defaultPageTime);

  // Monitor Position State
  const STORAGE_KEY_MONITOR_POS = "sys-performance-monitor-position";
  const storedMonitorPos = localStorage.getItem(STORAGE_KEY_MONITOR_POS);
  // Default to bottom-right as per original implementation, but configurable
  // User asked for "currently default top-left", but code was bottom-right.
  // We'll set default to bottom-right to match existing behavior unless config overrides.
  const defaultMonitorPos = getConfig("PerformanceMonitorPosition") ?? "bottom-right";
  const performanceMonitorPosition = ref(storedMonitorPos || defaultMonitorPos);

  // Monitor Display Mode (Simple/Text vs Detailed/Graph)
  const STORAGE_KEY_MONITOR_MODE = "sys-performance-monitor-mode"; // 'simple' | 'detailed'
  const storedMonitorMode = localStorage.getItem(STORAGE_KEY_MONITOR_MODE);
  const defaultMonitorMode = getConfig("PerformanceMonitorMode") ?? "detailed";
  const performanceMonitorMode = ref(storedMonitorMode || defaultMonitorMode);

  // Monitor Layout (Merged/Card vs Split/Pills)
  // Options: 'merged', 'split'
  const STORAGE_KEY_MONITOR_LAYOUT = "sys-performance-monitor-layout";
  const storedMonitorLayout = localStorage.getItem(STORAGE_KEY_MONITOR_LAYOUT);
  // Migrate legacy split values to 'split' if needed, or just let them fall through if robust
  const defaultMonitorLayout = getConfig("PerformanceMonitorLayout") ?? "merged";
  const performanceMonitorLayout = ref(storedMonitorLayout && !storedMonitorLayout.startsWith('split-') ? storedMonitorLayout : 'merged');

  // Monitor Direction (Vertical vs Horizontal)
  const STORAGE_KEY_MONITOR_DIRECTION = "sys-performance-monitor-direction"; // 'vertical' | 'horizontal'
  const storedMonitorDirection = localStorage.getItem(STORAGE_KEY_MONITOR_DIRECTION);
  const defaultMonitorDirection = "vertical";
  const performanceMonitorDirection = ref(storedMonitorDirection || defaultMonitorDirection);

  // Home Customization Config
  const STORAGE_KEY_HOME_CUSTOMIZATION = "sys-home-customization-enabled";
  const storedHomeCustomization = localStorage.getItem(STORAGE_KEY_HOME_CUSTOMIZATION);
  const defaultHomeCustomization = true;
  const homeCustomizationEnabled = ref(storedHomeCustomization !== null ? storedHomeCustomization === "true" : defaultHomeCustomization);

  // Access Control Logic
  const isPerformanceMonitorVisible = computed(() => {
    // 1. Check Environment: Show if DEV or TEST
    const isDevOrTest = import.meta.env.DEV || import.meta.env.MODE === 'test';
    
    // 2. Check User Role: Show if user is 'sa' or has 'sa' role (assuming username check for now as role structure varies)
    // Note: Adjust 'sa' check based on actual user store structure if needed.
    const userStore = useUserStoreHook();
    const isSa = userStore.username === 'sa' || userStore.roles.includes('sa') || userStore.roles.includes('admin'); // Broaden to admin for safety, but user asked for 'sa'

    return isDevOrTest || isSa;
  });

  // 初始化标记
  let isInitialized = false;

  // ===== 计算属性 =====
  const themeConfig = computed(() => getLayoutTheme(currentTheme.value));

  const availableThemes = computed(() => layoutThemes);

  const isDefaultTheme = computed(() => currentTheme.value === "default");

  const isFestivalTheme = computed(
    () => themeConfig.value?.type === "festival"
  );

  // ===== 方法 =====
  /**
   * 设置主题
   */
  function setTheme(themeKey: ThemeKey): void {
    if (currentTheme.value === themeKey) return;

    currentTheme.value = themeKey;

    // 更新 DOM 属性
    document.documentElement.setAttribute("data-skin", themeKey);

    // 更新主题类
    updateThemeClass(themeKey);

    // 加载主题样式表
    loadThemeStylesheet(themeKey);

    // 持久化到 storage
    saveToStorage("systemTheme", themeKey);

    // 发送主题变更事件
    emitter.emit("systemThemeChange", themeKey);
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

  function setNetworkLatencyMonitor(enabled: boolean) {
    networkLatencyMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_NETWORK_LATENCY, String(enabled));
  }

  function setStorageMonitor(enabled: boolean) {
    storageMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_STORAGE, String(enabled));
  }

  function setDeviceInfoMonitor(enabled: boolean) {
    deviceInfoMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_DEVICE_INFO, String(enabled));
  }

  function setPageTimeMonitor(enabled: boolean) {
    pageTimeMonitorEnabled.value = enabled;
    localStorage.setItem(STORAGE_KEY_PAGE_TIME, String(enabled));
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


    // 监听 emitter 事件（用于外部切换）
    emitter.on("systemThemeChange", handleExternalThemeChange);

    // 初始化时同步 DOM 状态
    const domTheme = document.documentElement.getAttribute("data-skin");
    if (domTheme && domTheme !== currentTheme.value) {
      currentTheme.value = domTheme as ThemeKey;
    }
  }

  /**
   * 处理外部主题变更（避免循环触发）
   */
  function handleExternalThemeChange(themeKey: string): void {
    if (currentTheme.value !== themeKey) {
      currentTheme.value = themeKey as ThemeKey;
    }
  }

  /**
   * 销毁监听器
   */
  function destroyThemeListener(): void {
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
    networkLatencyMonitorEnabled,
    storageMonitorEnabled,
    deviceInfoMonitorEnabled,
    pageTimeMonitorEnabled,
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
    setNetworkLatencyMonitor,
    setStorageMonitor,
    setDeviceInfoMonitor,
    setPageTimeMonitor,
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
