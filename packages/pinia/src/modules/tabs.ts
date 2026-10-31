/**
 * tabs store（@repo/pinia）—— 标签页状态
 *
 * 迁移自 koi/stores/modules/tabs.ts，通用化供任何主题复用。
 */
import { defineStore } from "pinia";
import { HOME_URL } from "@repo/config";
import { getUrlWithParams } from "@repo/env";
import { msgWarning, getRouter } from "@repo/core";
import useKeepAliveStore from "./keepAlive";

const tabsStore = defineStore("tabs", {
  persist: {
    key: "tabs",
  },
  state: () => {
    return {
      tabList: [] as any[],
    };
  },
  actions: {
    async addTab(tab: any) {
      const keepAliveStore = useKeepAliveStore();
      // 修复：meta.isKeepAlive 可能是 boolean/string/undefined（元数据里既写 true 也写 "1"），
      // 用 `== "1"` 判断无法匹配 true，导致菜单点击时 keepAliveName 漏加，页面无法缓存
      // 登记按键：已解析的 SFC 组件名（keepAliveName），解不出时退回路由名（旧口径）
      const keepAliveName = tab.keepAliveName ?? tab.name;
      if (tab.isKeepAlive && keepAliveName && !keepAliveStore.keepAliveName.includes(keepAliveName)) {
        keepAliveStore.addKeepAliveName(keepAliveName);
      }
      const isTab = this.tabList.some((item: any) => item.path === tab.path);
      if (isTab) return;
      this.tabList.push(tab);
    },
    async removeTab(tabPath: string, isCurrent: boolean = true, selectedPath?: string) {
      if (tabPath == HOME_URL) {
        msgWarning("禁止关闭");
        return;
      }
      const keepAliveStore = useKeepAliveStore();
      const tabItem = this.tabList.find((item) => item.path === tabPath);
      if (tabItem?.isKeepAlive) {
        keepAliveStore.removeKeepAliveName(tabItem.keepAliveName ?? tabItem.name);
      }
      const oldTabList = [...this.tabList];
      this.tabList = this.tabList.filter((item) => item.path !== tabPath);
      if (isCurrent) {
        oldTabList.forEach((item, index) => {
          if (item.path !== tabPath) return;
          const nextTab = oldTabList[index + 1] || oldTabList[index - 1];
          if (!nextTab) return;
          getRouter().push(nextTab.path || HOME_URL);
        });
      } else {
        const matchingPathObject = this.tabList.find((item: any) => item.path == selectedPath);
        if (matchingPathObject) {
          getRouter().push(matchingPathObject?.path || HOME_URL);
          return;
        }
      }
    },
    async setTab(tabList: any[]) {
      this.tabList = tabList;
    },
    async setTabTitle(title: string) {
      this.tabList.forEach((item) => {
        if (item.path == getUrlWithParams()) item.title = title;
      });
    },
    async closeSideTabs(path: string, type: "left" | "right") {
      const keepAliveStore = useKeepAliveStore();
      const currentIndex = this.tabList.findIndex((item) => item.path === path);
      if (currentIndex !== -1) {
        const range = type === "left" ? [0, currentIndex] : [currentIndex + 1, this.tabList.length];
        this.tabList = this.tabList.filter((item, index) => {
          return index < range[0] || index >= range[1] || item.isAffix === "1";
        });
        const fixedTabs = this.tabList.filter((item: any) => item.isAffix === "1");
        if (type === "left") {
          const nextTab = this.tabList[fixedTabs.length];
          getRouter().push(nextTab?.path);
        }
        if (type === "right") {
          const nextTab = this.tabList[currentIndex] || this.tabList[currentIndex + 1] || this.tabList[currentIndex - 1];
          getRouter().push(nextTab?.path);
        }
      }
      const keepAliveList = this.tabList.filter((item) => item.isKeepAlive);
      keepAliveStore.setKeepAliveName(keepAliveList.map((item) => item.keepAliveName ?? item.name));
    },
    async closeManyTabs(tabValue?: string) {
      const keepAliveStore = useKeepAliveStore();
      this.tabList = this.tabList.filter((item) => {
        return item.path === tabValue || item.isAffix === "1";
      });
      const keepAliveList = this.tabList.filter((item) => item.isKeepAlive);
      keepAliveStore.setKeepAliveName(keepAliveList.map((item) => item.keepAliveName ?? item.name));
    },
    async replaceIsAffix(tabPath?: string, isAffix?: string) {
      this.tabList.forEach((item) => {
        if (item.path == tabPath && isAffix !== undefined) {
          item.isAffix = isAffix;
        }
      });
    },
  },
  getters: {
    getTabs(state) {
      return state.tabList;
    },
  },
});

export default tabsStore;
