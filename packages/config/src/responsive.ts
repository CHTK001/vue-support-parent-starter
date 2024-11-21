// 响应式storage
import type { App } from "vue";
import type { PlatformConfigs } from "../index";
import { $t, responsiveStorageNameSpace } from "../index";
import { localStorageProxy } from "@repo/utils";
import Storage from "responsive-storage";

export const defaultRouterArrays = [
  {
    path: "/home",
    meta: {
      title: $t("menus.pureHome"),
      icon: "ep:home-filled",
    },
  },
];
export const injectResponsiveStorage = (app: App, config: PlatformConfigs) => {
  const nameSpace = responsiveStorageNameSpace();
  const configObj = Object.assign(
    {
      // 国际化 默认中文zh
      locale: localStorageProxy().getItem(nameSpace + "locale") ?? {
        locale: config.Locale ?? "zh-CN",
      },
      // layout模式以及主题
      layout: localStorageProxy().getItem(nameSpace + "layout") ?? {
        layout: config.Layout ?? "vertical",
        theme: config.Theme ?? "light",
        darkMode: config.DarkMode ?? false,
        sidebarStatus: config.SidebarStatus ?? true,
        epThemeColor: config.EpThemeColor ?? "#409EFF",
        themeColor: config.Theme ?? "light", // 主题色（对应系统配置中的主题色，与theme不同的是它不会受到浅色、深色整体风格切换的影响，只会在手动点击主题色时改变）
        overallStyle: config.OverallStyle ?? "light", // 整体风格（浅色：light、深色：dark、自动：system）
      },
      // 系统配置-界面显示
      configure: localStorageProxy().getItem(nameSpace + "configure") ?? {
        grey: config.Grey ?? false,
        weak: config.Weak ?? false,
        hideTabs: config.HideTabs ?? false,
        hideFooter: config.HideFooter ?? true,
        showLogo: config.ShowLogo ?? true,
        showModel: config.ShowModel ?? "chrome",
        multiTagsCache: config.MultiTagsCache ?? false,
        stretch: config.Stretch ?? false,
      },
    },
    config.MultiTagsCache
      ? {
          // 默认显示顶级菜单tag
          tags:
            localStorageProxy().getItem(nameSpace + "tags") ??
            defaultRouterArrays,
        }
      : {},
  );
  app.use(Storage, { nameSpace, memory: configObj });
};
