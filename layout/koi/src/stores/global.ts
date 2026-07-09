// Koi layout global state adapter
// Uses vue-parent's $storage (localforage) as persistence backend
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
    showBreadcrumb: true,
    showTabs: true,
    showFooter: false,
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
    /** Sync to vue-parent $storage */
    syncToParent() {
      const { $storage } = useGlobal<GlobalPropertiesApi>();
      if (!$storage) return;
      const parentConfigure = ($storage.configure ?? {}) as Record<string, unknown>;
      $storage.configure = {
        ...parentConfigure,
        layout: this.layout,
        isDark: this.isDark,
        themeColor: this.themeColor,
        koiLayout: this.layout,
        koiTabsStyle: this.tabsStyle,
        koiThemeColor: this.themeColor,
        koiIsDark: this.isDark,
      } as any;
    },
    /** Load from parent $storage (fallback to default keys) */
    loadFromParent() {
      const { $storage } = useGlobal<GlobalPropertiesApi>();
      if (!$storage) return;
      const cfg = ($storage.configure ?? {}) as Record<string, unknown>;
      if (cfg.layout) this.layout = cfg.layout as KoiLayoutType;
      if (typeof cfg.isDark === 'boolean') this.isDark = cfg.isDark as boolean;
      if (cfg.themeColor) this.themeColor = cfg.themeColor as string;
      if (cfg.koiLayout) this.layout = cfg.koiLayout as KoiLayoutType;
      if (cfg.koiTabsStyle) this.tabsStyle = cfg.koiTabsStyle as TabsStyle;
      if (cfg.koiThemeColor) this.themeColor = cfg.koiThemeColor as string;
      if (typeof cfg.koiIsDark === 'boolean') this.isDark = cfg.koiIsDark as boolean;
      this.persist();
    },
  },
  getters: {},
});
