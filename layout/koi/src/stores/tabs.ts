import { defineStore } from "pinia";
import { CACHE_PREFIX, HOME_URL } from "../config/index";
import type { KoiTabItem } from "../types";

const KEY = CACHE_PREFIX + "tabs";

export const useKoiTabsStore = defineStore("koi-tabs", {
  persist: {
    key: KEY,
    storage: localStorage,
  },
  state: () => ({
    tabList: [] as KoiTabItem[],
  }),
  actions: {
    async addTab(tab: KoiTabItem) {
      const exists = this.tabList.some((item) => item.path === tab.path);
      if (!exists) {
        this.tabList.push(tab);
      }
    },
    async removeTab(tabPath: string) {
      this.tabList = this.tabList.filter((item) => item.path !== tabPath);
    },
    async setTab(tabList: KoiTabItem[]) {
      this.tabList = tabList;
    },
    async setTabTitle(title: string) {
      const currentPath = window.location.hash.replace("#", "") || window.location.pathname;
      this.tabList.forEach((item) => {
        if (item.path === currentPath) item.title = title;
      });
    },
    async closeSideTabs(path: string, type: "left" | "right") {
      const idx = this.tabList.findIndex((item) => item.path === path);
      if (idx === -1) return;
      if (type === "left") {
        this.tabList = this.tabList.filter((_, i) => i >= idx || item.isAffix === "1");
      } else {
        this.tabList = this.tabList.filter((_, i) => i <= idx || item.isAffix === "1");
      }
    },
    async closeManyTabs(tabValue?: string) {
      this.tabList = this.tabList.filter(
        (item) => item.path === tabValue || item.isAffix === "1"
      );
    },
    async replaceIsAffix(tabPath?: string, isAffix?: string) {
      this.tabList.forEach((item) => {
        if (item.path === tabPath && isAffix !== undefined) {
          item.isAffix = isAffix;
        }
      });
    },
  },
  getters: {
    getTabs: (state) => state.tabList,
  },
});