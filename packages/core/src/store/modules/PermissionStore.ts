import { defineStore, Store } from "pinia";
import {
  type cacheType,
  store,
  debounce,
  ascending,
  getKeyList,
  filterTree,
  constantMenus,
  filterNoPermissionTree,
  formatFlatteningRoutes,
  getConfig,
} from "../utils";
import { useMultiTagsStoreHook } from "./MultiTagsStore";
import {
  isAlwaysAvailableStaticRoute,
  resolveRouteSourceMode,
} from "../../router/route-mode";

export const usePermissionStore = defineStore({
  id: "pure-permission",
  state: () => ({
    // 静态路由生成的菜单
    constantMenus,
    // 整体路由生成的菜单（静态、动态）
    wholeMenus: [],
    // 菜单是否已完成初始化
    menusReady: false,
    // 整体路由（一维数组格式）
    flatteningRoutes: [],
    // 缓存页面keepAlive
    cachePageList: [],
  }),
  actions: {
    /** 组装整体路由生成的菜单 */
    handleWholeMenus(routes: any[]) {
      const sourceMode = resolveRouteSourceMode(getConfig());
      const preservedStaticMenus = this.constantMenus.filter((item) =>
        isAlwaysAvailableStaticRoute(item),
      );
      const menuRoutes =
        sourceMode === "remote-only"
          ? preservedStaticMenus.concat(routes)
          : this.constantMenus.concat(routes);
      this.wholeMenus = filterNoPermissionTree(
        filterTree(ascending(menuRoutes)),
      );
      this.flatteningRoutes = formatFlatteningRoutes(menuRoutes);
      this.menusReady = true;
    },
    cacheOperate({ mode, name }: cacheType) {
      const delIndex = this.cachePageList.findIndex((v) => v === name);
      switch (mode) {
        case "refresh":
          this.cachePageList = this.cachePageList.filter((v) => v !== name);
          break;
        case "add":
          this.cachePageList.push(name);
          break;
        case "delete":
          delIndex !== -1 && this.cachePageList.splice(delIndex, 1);
          break;
      }
      /** 监听缓存页面是否存在于标签页，不存在则删除 */
      debounce(() => {
        let cacheLength = this.cachePageList.length;
        const nameList = getKeyList(useMultiTagsStoreHook().multiTags, "name");
        while (cacheLength > 0) {
          nameList.findIndex(
            (v) => v === this.cachePageList[cacheLength - 1],
          ) === -1 &&
            this.cachePageList.splice(
              this.cachePageList.indexOf(this.cachePageList[cacheLength - 1]),
              1,
            );
          cacheLength--;
        }
      })();
    },
    /** 清空缓存页面 */
    clearAllCachePage() {
      this.wholeMenus = [];
      this.flatteningRoutes = [];
      this.menusReady = false;
      this.cachePageList = [];
    },
  },
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
