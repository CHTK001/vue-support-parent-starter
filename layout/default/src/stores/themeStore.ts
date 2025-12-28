/**
 * 全局主题状态管理
 * @description 统一管理主题切换逻辑，避免各组件重复实现
 */
import { defineStore } from "pinia";
import { ref, computed, onScopeDispose, markRaw } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import type { ThemeKey } from "../types/theme";
import { layoutThemes, getLayoutTheme, loadThemeStylesheet } from "../themes";

// 条件日志函数
const isDev = import.meta.env.DEV;
const log = isDev ? console.log.bind(console, "[ThemeStore]") : () => {};

export const useThemeStore = defineStore("theme", () => {
  const { $storage } = useGlobal<GlobalPropertiesApi>();

  // ===== 状态 =====
  const currentTheme = ref<ThemeKey>(
    ($storage?.configure?.systemTheme as ThemeKey) || "default"
  );

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

    log("主题切换:", currentTheme.value, "->", themeKey);
    currentTheme.value = themeKey;

    // 更新 DOM 属性
    document.documentElement.setAttribute("data-skin", themeKey);

    // 更新主题类
    updateThemeClass(themeKey);

    // 加载主题样式表
    loadThemeStylesheet(themeKey);

    // 持久化到 storage
    if ($storage?.configure) {
      $storage.configure.systemTheme = themeKey;
    }

    // 发送主题变更事件
    emitter.emit("systemThemeChange", themeKey);
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
      "theme-cyberpunk",
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
    if (domTheme && domTheme !== currentTheme.value) {
      currentTheme.value = domTheme as ThemeKey;
    }
  }

  /**
   * 处理外部主题变更（避免循环触发）
   */
  function handleExternalThemeChange(themeKey: string): void {
    if (currentTheme.value !== themeKey) {
      log("收到外部主题变更:", themeKey);
      currentTheme.value = themeKey as ThemeKey;
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
    // 方法
    setTheme,
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
