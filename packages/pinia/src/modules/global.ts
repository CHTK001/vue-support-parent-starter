/**
 * global store（@repo/pinia）—— 全局布局 / 主题 / 交互状态
 *
 * 迁移自 koi/stores/modules/global.ts，通用化供任何主题复用。
 */
import { defineStore } from "pinia";
import { CACHE_PREFIX, DEFAULT_THEME } from "@repo/config";

const globalStore = defineStore("global", {
  persist: {
    key: CACHE_PREFIX + "global",
    storage: localStorage,
  },
  state: () => {
    return {
      isFullScreen: false,
      isCollapse: false,
      isColumnFirstCollapse: false,
      menuWidth: 220,
      isDark: false,
      dimension: "default",
      maximize: false,
      language: "zh",
      themeColor: DEFAULT_THEME,
      layout: "vertical",
      tabsStyle: "google",
      transition: "fade-default",
      uniqueOpened: true,
      isGrey: false,
      isWeak: false,
      asideInverted: false,
      headerInverted: false,
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
