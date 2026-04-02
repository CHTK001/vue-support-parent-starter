// 响应式storage
import { reactive, watch, type App } from "vue";
import type { PlatformConfigs } from "./types/config";
import { responsiveStorageNameSpace } from "./config";
import { $t } from "./i18n";

export const defaultRouterArrays = [
  {
    path: "/home",
    meta: {
      title: $t("menus.pureHome"),
      icon: "ep:home-filled",
    },
  },
];

const readStorageValue = <T>(key: string, fallback: T): T => {
  if (typeof localStorage === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStorageValue = (key: string, value: unknown) => {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    if (value == null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage write failures
  }
};

export const injectResponsiveStorage = (app: App, config: PlatformConfigs) => {
  const nameSpace = responsiveStorageNameSpace();
  const configObj = Object.assign(
    {
      // 国际化 默认中文zh
      locale: readStorageValue(nameSpace + "locale", {
        locale: config.Locale ?? "zh-CN",
      }),
      // layout模式以及主题
      layout: readStorageValue(nameSpace + "layout", {
        layout: config.Layout ?? "vertical",
        theme: config.Theme ?? "light",
        darkMode: config.DarkMode ?? false,
        sidebarStatus: config.SidebarStatus ?? true,
        epThemeColor: config.EpThemeColor ?? "#409EFF",
        themeColor: config.Theme ?? "light", // 主题色（对应系统配置中的主题色，与theme不同的是它不会受到浅色、深色整体风格切换的影响，只会在手动点击主题色时改变）
        overallStyle: config.OverallStyle ?? "light", // 整体风格（浅色：light、深色：dark、自动：system）
      }),
      // 系统配置-界面显示
      configure: readStorageValue(nameSpace + "configure", {
        grey: config.Grey ?? false,
        weak: config.Weak ?? false,
        hideTabs: config.HideTabs ?? false,
        contentMargin: config.contentMargin || 10,
        layoutRadius: config.LayoutRadius || 10,
        layoutBlur: config.LayoutRadius || 10,
        hideFooter: config.HideFooter ?? true,
        showLogo: config.ShowLogo ?? true,
        showModel: config.ShowModel ?? "chrome",
        multiTagsCache: config.MultiTagsCache ?? true,
        stretch: config.Stretch ?? false,
        cardColorMode: config.CardColorMode ?? "all",
      }),
    },
    config.MultiTagsCache
      ? {
          // 默认显示顶级菜单tag
          tags: readStorageValue(nameSpace + "tags", defaultRouterArrays),
        }
      : {},
  );

  const storage = reactive(configObj) as typeof configObj;
  (app.config.globalProperties as typeof app.config.globalProperties & {
    $storage?: typeof storage;
  }).$storage = storage;

  for (const key of Object.keys(configObj)) {
    watch(
      () => storage[key],
      (value) => {
        writeStorageValue(nameSpace + key, value);
      },
      { deep: true },
    );
  }
};
