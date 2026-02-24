/**
 * 统一布局配置 Hook
 * @description 集中管理布局和主题配置的访问和更新
 * @version 1.0.0
 */
import { computed, ref, watch } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import type {
  StorageConfig,
  StorageLayout,
  ThemeKey,
} from "../types/theme";

/**
 * 统一布局配置 Hook
 * @returns 配置状态和方法
 *
 * @example
 * ```ts
 * const { config, layout, updateConfig, updateLayout } = useLayoutConfig();
 * // 读取配置
 * const showLogo = config.value.showLogo;
 * // 更新配置
 * updateConfig('showLogo', false);
 * ```
 */
export function useLayoutConfig() {
  const { $storage } = useGlobal<GlobalPropertiesApi>();

  // ===== 响应式配置 =====
  const config = computed<StorageConfig>(() => {
    return $storage?.configure || {};
  });

  const layout = computed<StorageLayout>(() => {
    return $storage?.layout || {};
  });

  // ===== 常用配置的便捷访问 =====
  const showLogo = computed(() => config.value.showLogo ?? true);
  const hideTabs = computed(() => config.value.hideTabs ?? false);
  const hideFooter = computed(() => config.value.hideFooter ?? false);
  const showBreadcrumb = computed(() => config.value.showBreadcrumb ?? true);
  const showTagIcon = computed(() => config.value.showTagIcon ?? true);
  const keepAlive = computed(() => config.value.keepAlive ?? true);
  const debugMode = computed(() => config.value.debugMode ?? false);
  const menuTransition = computed(() => config.value.menuTransition ?? true);

  // 主题相关
  const systemTheme = computed<ThemeKey>(() => {
    return (config.value.systemTheme as ThemeKey) || "default";
  });

  const layoutMode = computed(() => {
    return layout.value.layout || "vertical";
  });

  const overallStyle = computed(() => {
    return layout.value.overallStyle || "light";
  });

  const isDarkMode = computed(() => {
    return layout.value.darkMode || overallStyle.value === "dark";
  });

  // 双栏导航配置
  const doubleNavConfig = computed(() => ({
    expandMode: config.value.doubleNavExpandMode ?? "auto",
    autoExpandAll: config.value.doubleNavAutoExpandAll ?? true,
  }));

  // 新菜单标识配置
  const newMenuConfig = computed(() => ({
    enabled: config.value.showNewMenu ?? true,
    text: config.value.newMenuText ?? "new",
    timeLimit: config.value.newMenuTimeLimit ?? 168,
    animation: config.value.newMenuAnimation ?? "bounce",
  }));

  // ===== 配置更新方法 =====
  /**
   * 更新配置项
   * @param key 配置键
   * @param value 配置值
   */
  function updateConfig<K extends keyof StorageConfig>(
    key: K,
    value: StorageConfig[K]
  ): void {
    if (!$storage) {
      return;
    }
    const oldConfigure = ($storage.configure ?? {}) as Record<string, unknown>;
    $storage.configure = { ...oldConfigure, [key]: value } as typeof $storage.configure;

    // 发送相应的事件通知
    emitConfigChange(key, value);
  }

  /**
   * 批量更新配置
   * @param updates 配置更新对象
   */
  function batchUpdateConfig(updates: Partial<StorageConfig>): void {
    if (!$storage) {
      return;
    }
    const oldConfigure = ($storage.configure ?? {}) as Record<string, unknown>;
    $storage.configure = { ...oldConfigure, ...updates } as typeof $storage.configure;

    // 发送事件通知
    Object.keys(updates).forEach((key) => {
      emitConfigChange(key as keyof StorageConfig, updates[key as keyof StorageConfig]);
    });
  }

  /**
   * 更新布局配置
   * @param key 布局键
   * @param value 布局值
   */
  function updateLayout<K extends keyof StorageLayout>(
    key: K,
    value: StorageLayout[K]
  ): void {
    if (!$storage?.layout) return;

    $storage.layout = {
      ...$storage.layout,
      [key]: value,
    };
  }

  /**
   * 发送配置变更事件
   */
  function emitConfigChange<K extends keyof StorageConfig>(
    key: K,
    value: StorageConfig[K]
  ): void {
    // 根据配置键发送对应的事件
    const eventMap: Partial<Record<keyof StorageConfig, string>> = {
      systemTheme: "systemThemeChange",
      hideTabs: "tagViewsChange",
      showModel: "tagViewsShowModel",
      showTagIcon: "showTagIconChange",
      showLogo: "logoChange",
      hideFooter: "hideFooterChange",
      keepAlive: "keepAliveChange",
      debugMode: "debugModeChange",
      menuTransition: "menuTransitionChange",
      showBreadcrumb: "breadcrumbChange",
      aiChatTheme: "aiChatThemeChange",
    };

    const eventName = eventMap[key];
    if (eventName) {
      emitter.emit(eventName as any, value as any);
    }
  }

  /**
   * 重置配置为默认值
   */
  function resetConfig(): void {
    const defaults: Partial<StorageConfig> = {
      grey: false,
      weak: false,
      invert: false,
      monochrome: false,
      hideTabs: false,
      hideFooter: false,
      showLogo: true,
      showModel: "chrome",
      multiTagsCache: true,
      stretch: false,
      keepAlive: true,
      debugMode: false,
      menuTransition: true,
      contentMargin: 16,
      layoutRadius: 8,
      layoutBlur: 0,
      showBreadcrumb: true,
      breadcrumbIconOnly: false,
      showTagIcon: true,
      cardBody: true,
      cardColorMode: "all",
      enableFestivalTheme: true,
      showNewMenu: true,
      newMenuText: "new",
      newMenuTimeLimit: 168,
      newMenuAnimation: "bounce",
      doubleNavExpandMode: "auto",
      doubleNavAutoExpandAll: true,
    };

    batchUpdateConfig(defaults);
  }

  return {
    // 原始配置对象
    config,
    layout,

    // 便捷访问
    showLogo,
    hideTabs,
    hideFooter,
    showBreadcrumb,
    showTagIcon,
    keepAlive,
    debugMode,
    menuTransition,
    systemTheme,
    layoutMode,
    overallStyle,
    isDarkMode,
    doubleNavConfig,
    newMenuConfig,

    // 更新方法
    updateConfig,
    batchUpdateConfig,
    updateLayout,
    resetConfig,
  };
}

/**
 * 在 setup 外部使用
 */
export function useLayoutConfigHook() {
  return useLayoutConfig();
}
