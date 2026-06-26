// koi-ui 全局状态适配器
// 使用 vue-parent 的 $storage (localforage) 作为持久化后端
import { defineStore } from "pinia";
import { reactive, toRefs } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { DEFAULT_THEME } from "../config/index";
import type { KoiLayoutType, TabsStyle, KoiGlobalState } from "../types";

function createDefaultState(): KoiGlobalState {
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
}

const KOI_STORAGE_KEY = "koi-global";

export const useKoiGlobalStore = defineStore("koi-global", {
  state: (): KoiGlobalState => {
    try {
      const raw = localStorage.getItem(KOI_STORAGE_KEY);
      if (raw) {
        return { ...createDefaultState(), ...JSON.parse(raw) };
      }
    } catch { /* ignore */ }
    return createDefaultState();
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(KOI_STORAGE_KEY, JSON.stringify(this.$state));
      } catch { /* ignore */ }
    },
    setGlobalState(key: keyof KoiGlobalState, value: any) {
      (this as any)[key] = value;
      this.persist();
    },
    setCollapse(value: boolean) {
      this.isCollapse = value;
      this.persist();
      return this.isCollapse;
    },
    setColumnFirstCollapse(value: boolean) {
      this.isColumnFirstCollapse = value;
      this.persist();
      return this.isColumnFirstCollapse;
    },
    setMenuWidth(value: number) {
      this.menuWidth = value;
      this.persist();
      return this.menuWidth;
    },
    setDimension(value: string) {
      this.dimension = value;
      this.persist();
    },
    /** 同步到 vue-parent $storage（实现与 default layout 配置互通） */
    syncToParent() {
      const { $storage } = useGlobal<GlobalPropertiesApi>();
      if (!$storage) return;
      // koi 的 global state 同步到父工程的 configure / layout 命名空间
      const parentConfigure = ($storage.configure ?? {}) as Record<string, unknown>;
      $storage.configure = {
        ...parentConfigure,
        koiLayout: this.layout,
        koiTabsStyle: this.tabsStyle,
        koiThemeColor: this.themeColor,
        koiIsDark: this.isDark,
      } as any;
    },
    /** 从父工程 $storage 读取配置 */
    loadFromParent() {
      const { $storage } = useGlobal<GlobalPropertiesApi>();
      if (!$storage) return;
      const cfg = ($storage.configure ?? {}) as Record<string, unknown>;
      if (cfg.koiLayout) this.layout = cfg.koiLayout as KoiLayoutType;
      if (cfg.koiTabsStyle) this.tabsStyle = cfg.koiTabsStyle as TabsStyle;
      if (cfg.koiThemeColor) this.themeColor = cfg.koiThemeColor as string;
      if (typeof cfg.koiIsDark === "boolean") this.isDark = cfg.koiIsDark as boolean;
      this.persist();
    },
  },
  getters: {},
});