/**
 * global store（@repo/pinia）—— 全局布局 / 主题 / 交互状态
 *
 * 迁移自 koi/stores/modules/global.ts，通用化供任何主题复用。
 *
 * 持久化 key 由 @repo/config.getStorageKey("global") 统一加前缀，
 * 避免不同 app 在同域名下串数据。
 */
import { defineStore } from "pinia";
import { DEFAULT_THEME } from "@repo/config";
import { getFrameworkStorage } from "@repo/utils";

/** 一次性迁移标记：历史默认布局为 group，系统默认导航应为垂直(vertical) */
const LAYOUT_DEFAULT_MIGRATION_KEY = "layout-default-vertical-v1";

const globalStore = defineStore("global", {
  persist: {
    key: "global",
    afterHydrate: (ctx) => {
      // 首启动时把旧的默认值 group 纠正为 vertical（用户后续手动切换仍会持久化生效）
      try {
        const storage = getFrameworkStorage();
        if (!storage.get(LAYOUT_DEFAULT_MIGRATION_KEY)) {
          ctx.store.layout = "vertical";
          storage.set(LAYOUT_DEFAULT_MIGRATION_KEY, true);
        }
      } catch {
        // 迁移失败忽略：保留已存布局值，不影响功能
      }
    },
  },
  state: () => {
    return {
      isFullScreen: false,
      isCollapse: false,
      isColumnFirstCollapse: false,
      menuWidth: 220,
      isDark: false,
      /** 主题模式：light=明亮 / dark=黑暗 / auto=跟随系统 */
      themeMode: "light",
      dimension: "default",
      maximize: false,
      language: "zh",
      themeColor: DEFAULT_THEME,
      layout: "vertical",
      tabsStyle: "google",
      transition: "none",
      /** 登录页样式，取值见 themes/koi/views/login/loginStyles.ts 的 loginStyleOptions */
      loginStyle: "default",
      uniqueOpened: true,
      isGrey: false,
      isWeak: false,
      asideInverted: false,
      headerInverted: false,
      isHeaderShown: true,
      isTabsShown: true,
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
    },
  },
  getters: {},
});

export default globalStore;
