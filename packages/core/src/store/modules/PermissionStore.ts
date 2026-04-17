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

const resolveMenuId = (item: any): number | string | null => {
  return (
    item?.id ??
    item?.sysMenuId ??
    item?.sys_menu_id ??
    item?.menuId ??
    null
  );
};

const resolveMenuParentId = (item: any): number | string | null => {
  return (
    item?.parentId ??
    item?.sysMenuPid ??
    item?.sys_menu_pid ??
    item?.menuPid ??
    null
  );
};

const buildMenuHierarchy = (routes: any[] = []) => {
  if (!Array.isArray(routes) || routes.length === 0) {
    return [];
  }

  const hasNestedChildren = routes.some(
    (item) => Array.isArray(item?.children) && item.children.length > 0,
  );
  const hasParentRefs = routes.some((item) => resolveMenuParentId(item) !== null);

  if (hasNestedChildren || !hasParentRefs) {
    return routes;
  }

  const nodeMap = new Map<any, any>();
  const clonedRoutes = routes.map((item) => {
    const cloned = { ...item, children: [] };
    nodeMap.set(resolveMenuId(item), cloned);
    return cloned;
  });

  const roots: any[] = [];

  clonedRoutes.forEach((item) => {
    const parentId = resolveMenuParentId(item);
    if (parentId === null || !nodeMap.has(parentId)) {
      roots.push(item);
      return;
    }

    nodeMap.get(parentId)?.children?.push(item);
  });

  const cleanupChildren = (nodes: any[]) => {
    nodes.forEach((node) => {
      if (Array.isArray(node.children) && node.children.length > 0) {
        cleanupChildren(node.children);
        return;
      }
      delete node.children;
    });
  };

  cleanupChildren(roots);
  return roots;
};

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
      const normalizedRemoteMenus = buildMenuHierarchy(routes);
      const menuRoutes =
        sourceMode === "remote-only"
          ? preservedStaticMenus.concat(normalizedRemoteMenus)
          : this.constantMenus.concat(normalizedRemoteMenus);
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
