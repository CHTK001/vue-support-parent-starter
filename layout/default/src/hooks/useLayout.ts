import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { routerArrays } from "../types";
import { useGlobal } from "@pureadmin/utils";
import { useMultiTagsStore } from "@repo/core";
import type { LayoutType, StorageLayout } from "../types/theme";

let isStorageInitialized = false;

export const validLayouts: LayoutType[] = [
  "vertical",
  "horizontal",
  "card",
  "double",
  "drawer",
  "hover",
  "mix",
  "mobile",
];

export const isValidLayout = (
  layout: string | undefined,
): layout is LayoutType => {
  return !!layout && validLayouts.includes(layout as LayoutType);
};

export function useLayout() {
  const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

  const initStorage = () => {
    if (isStorageInitialized) return;
    isStorageInitialized = true;
    /** 路由 */
    if (
      useMultiTagsStore().multiTagsCache &&
      (!$storage.tags || $storage.tags.length === 0)
    ) {
      $storage.tags = routerArrays;
    }
    /** 国际化 */
    if (!$storage.locale) {
      $storage.locale = { locale: $config?.Locale ?? "zh-CN" };
      useI18n().locale.value = $config?.Locale ?? "zh-CN";
    }
    /** 导航 */
    if (!$storage.layout) {
      $storage.layout = {
        layout: $config?.Layout ?? "vertical",
        theme: $config?.Theme ?? "light",
        darkMode: $config?.DarkMode ?? false,
        sidebarStatus: $config?.SidebarStatus ?? true,
        epThemeColor: $config?.EpThemeColor ?? "#409EFF",
        themeColor: $config?.Theme ?? "light",
        overallStyle: $config?.OverallStyle ?? "light",
      };
    }
    /** 灰色模式、色弱模式、隐藏标签页 */
    if (!$storage.configure) {
      $storage.configure = {
        grey: $config?.Grey ?? false,
        weak: $config?.Weak ?? false,
        layoutRadius: $config.layoutRadius ?? 10,
        layoutBlur: $config.layoutBlur ?? 10,
        hideTabs: $config?.HideTabs ?? false,
        hideFooter: $config.HideFooter ?? false,
        showLogo: $config?.ShowLogo ?? true,
        showModel: $config?.ShowModel ?? "smart",
        multiTagsCache: $config?.MultiTagsCache ?? true,
        stretch: $config?.Stretch ?? false,
      };
    }
  };

  /** 清空缓存后从Platform-config.json读取默认配置并赋值到storage中 */
  const layout = computed<LayoutType>(() => {
    const fallbackLayout: LayoutType = "vertical";

    const rawLayout = ($storage?.layout?.layout || $config?.Layout) as
      | string
      | undefined;
    if (isValidLayout(rawLayout)) {
      return rawLayout;
    }

    return fallbackLayout;
  });

  const layoutTheme = computed<StorageLayout | undefined>(() => {
    return $storage?.layout as StorageLayout | undefined;
  });

  return {
    layout,
    layoutTheme,
    initStorage,
  };
}
