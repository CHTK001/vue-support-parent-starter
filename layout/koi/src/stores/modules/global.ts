// 定义是否折叠小仓库[选择式Api写法]
import { defineStore } from "pinia";
import { CACHE_PREFIX, DEFAULT_THEME } from "../../config/index.ts";
import { getConfig } from "@repo/config";
import settings from "../../settings";

const cfg = (getConfig() || {}) as Record<string, any>;

/**
 * 通用解析器：优先读取 $storage.configure（用户改过），
 * 再读 getConfig()（app.yaml/setting 合并值），
 * 最后回退到 settings 默认值。
 *
 * 默认全部走 settings 默认值，避免 onConfigLoaded 之前渲染空白。
 * settings 默认值在 settings.ts 中集中维护。
 */
const pickCfg = <T>(key: string, fallback: T): T => {
  const v = (cfg as any)[key];
  return v === undefined ? fallback : (v as T);
};

// defineStore方法执行会返回一个函数，函数的作用就是让组件可以获取到仓库数据
const globalStore = defineStore("global", {
  // 开启数据持久化
  persist: {
    key: CACHE_PREFIX + "global",
    storage: localStorage
  },
  state: () => {
    return {
      // ===== 布局模式 =====
      layout: pickCfg("Layout", settings.layout) as "vertical" | "classic" | "horizontal" | "columns" | "optimum" | "mobile",
      sidebarStatus: pickCfg("SidebarStatus", settings.sidebarStatus) as "expanded" | "collapsed" | "hidden",

      // ===== 菜单 =====
      isCollapse: settings.isCollapse,
      isColumnFirstCollapse: false,
      menuWidth: pickCfg("menuWidth", settings.menuWidth) as number,
      uniqueOpened: pickCfg("uniqueOpened", settings.uniqueOpened) as boolean,

      // ===== 主题/外观 =====
      isDark: pickCfg("Theme", settings.theme) === "dark",
      dimension: pickCfg("Dimension", settings.dimension) as string,
      themeColor: pickCfg("EpThemeColor", settings.themeColor) as string,
      overallStyle: pickCfg("OverallStyle", settings.overallStyle) as "light" | "dark" | "system",

      // ===== 头部/侧栏反转 =====
      asideInverted: false,
      headerInverted: false,

      // ===== 工具栏：运行时态 =====
      isGrey: false,
      isWeak: false,

      // ===== 多页签 =====
      showModel: pickCfg("ShowModel", settings.showModel) as string,
      multiTagsCache: pickCfg("MultiTagsCache", settings.tabsCache) as boolean,
      transition: pickCfg("Transition", settings.transition) as string,
      tabsStyle: pickCfg("TabsStyle", settings.tabsStyle) as string,

      // ===== 全屏/最大化 =====
      isFullScreen: false,
      maximize: false,

      // ===== 语言 =====
      language: pickCfg("Locale", settings.language) as string,

      // ===== 项目信息（参考 default useSettingStore） =====
      title: pickCfg("Title", settings.title) as string,
      fixedHeader: pickCfg("FixedHeader", settings.fixedHeader) as boolean,
      hiddenSideBar: pickCfg("HiddenSideBar", settings.hiddenSideBar) as boolean,
      ShowBarSetting: pickCfg("ShowBarSetting", settings.showHeaderToolbar) as boolean,
      ShowBarSearch: pickCfg("ShowBarSearch", settings.showSearchMenu) as boolean,
      ShowLanguage: pickCfg("ShowLanguage", settings.showLanguage) as boolean
    };
  },
  actions: {
    setGlobalState(...args: any) {
      this.$patch({ [args[0]]: args[1] });
    },
    setCollapse(value: boolean) {
      this.isCollapse = value;
      return this.isCollapse;
    },
    setColumnFirstCollapse(value: boolean) {
      this.isColumnFirstCollapse = value;
      return this.isColumnFirstCollapse;
    },
    setMenuWidth(value: number) {
      this.menuWidth = value;
      return this.menuWidth;
    },
    setDimension(value: string) {
      this.dimension = value;
    }
  },
  getters: {}
});

export default globalStore;
