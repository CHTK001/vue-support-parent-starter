import { defineStore } from "pinia";
import { useMultiTagsStoreHook } from "@repo/core";
import type { KoiTabItem } from "../types";

/**
 * koi tabs store — 委托到 @repo/core
 *
 * koi 只负责布局/主题样式，标签页逻辑由 @repo/core 的 useMultiTagsStoreHook 管理。
 * tabList 实时同步 @repo/core 的多标签状态，保证组件兼容。
 */
export const useKoiTabsStore = defineStore("koi-tabs", {
  state: () => ({
    /** 与 @repo/core useMultiTagsStoreHook().multiTags 同步 */
    tabList: [...useMultiTagsStoreHook().multiTags] as KoiTabItem[],
  }),
  actions: {
    /** 从 @repo/core 刷新 tabList */
    _syncFromCore() {
      this.tabList = [...useMultiTagsStoreHook().multiTags] as KoiTabItem[];
    },
    async addTab(tab: KoiTabItem) {
      useMultiTagsStoreHook().handleTags("push", tab as any);
      this._syncFromCore();
    },
    async removeTab(tabPath: string) {
      useMultiTagsStoreHook().handleTags("splice", tabPath);
      this._syncFromCore();
    },
    async setTab(tabList: KoiTabItem[]) {
      useMultiTagsStoreHook().handleTags("equal", tabList);
      this._syncFromCore();
    },
    async setTabTitle(title: string) {
      const tags = useMultiTagsStoreHook().multiTags;
      const currentPath =
        window.location.hash.replace("#", "") || window.location.pathname;
      const target = tags.find((item: any) => item.path === currentPath);
      if (target) {
        target.meta = { ...target.meta, title };
        useMultiTagsStoreHook().handleTags("equal", tags);
      }
      this._syncFromCore();
    },
    async closeSideTabs(path: string, type: "left" | "right") {
      const tags = [...useMultiTagsStoreHook().multiTags];
      const idx = tags.findIndex((item: any) => item.path === path);
      if (idx === -1) return;
      const filtered =
        type === "left"
          ? tags.filter((_: any, i: number) => i >= idx)
          : tags.filter((_: any, i: number) => i <= idx);
      useMultiTagsStoreHook().handleTags("equal", filtered);
      this._syncFromCore();
    },
    async closeManyTabs(tabValue?: string) {
      const tags = [...useMultiTagsStoreHook().multiTags];
      const filtered = tags.filter(
        (item: any) => item.path === tabValue || item?.meta?.affix,
      );
      useMultiTagsStoreHook().handleTags("equal", filtered);
      this._syncFromCore();
    },
    async replaceIsAffix(tabPath?: string, isAffix?: string) {
      const tags = [...useMultiTagsStoreHook().multiTags];
      tags.forEach((item: any) => {
        if (item.path === tabPath && isAffix !== undefined) {
          item.meta = { ...item.meta, fixedTag: isAffix === "1" };
        }
      });
      useMultiTagsStoreHook().handleTags("equal", tags);
      this._syncFromCore();
    },
  },
  getters: {
    getTabs: (state) => state.tabList,
  },
});