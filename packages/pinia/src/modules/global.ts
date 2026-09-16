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

const globalStore = defineStore("global", {
  persist: {
    key: "global",
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
      /** 登录页样式（default 臻享双栏 / glass 动感玻璃 / slide 滑动登录 / bubble 气泡简约 / split 分屏沉浸 / simple 经典点阵） */
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
