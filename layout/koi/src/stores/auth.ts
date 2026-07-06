import { defineStore } from "pinia";
import { useUserStoreHook } from "@repo/core/src/store/modules/UserStore";
import { usePermissionStoreHook } from "@repo/core/src/store/modules/PermissionStore";

/**
 * Koi auth store — delegates to @repo/core
 *
 * Keeps a compatible interface for layout components; all actual
 * auth/menu/permission logic lives in @repo/core.
 */

/** Standalone breadcrumb builder (extracted to avoid circular store ref in getter) */
function buildBreadcrumbList(menuList: any[], parent: any[] = [], result: Record<string, any[]> = {}): Record<string, any[]> {
  for (const item of menuList) {
    result[item.path] = [...parent, item];
    if (item.children) {
      buildBreadcrumbList(item.children, result[item.path], result);
    }
  }
  return result;
}
export const useKoiAuthStore = defineStore("koi-auth", {
  state: () => ({
    menuList: [] as any[],
    recursiveMenuList: [] as any[],
    breadcrumbList: [] as any[],
    roleList: [] as string[],
    buttonList: [] as string[],
    loginUser: {
      userId: "",
      loginName: "",
      sex: "",
      avatar: "",
    },
  }),
  actions: {
    /** Delegate to @repo/core: PermissionStore.handleWholeMenus */
    setMenuList(menus: any[]) {
      usePermissionStoreHook().handleWholeMenus(menus);
    },
    /** Adapt menu format (keeps compatibility) */
    adaptMenuList(menus: any[]): any[] {
      return menus.map((m) => ({
        menuId: String(m.menuId || m.id || ""),
        menuName: m.menuName || m.title || m.name || "",
        parentId: String(m.parentId || m.parent_id || "0"),
        menuType: String(m.menuType || m.type || ""),
        path: m.path || "",
        name: m.name || "",
        component: m.component || "",
        icon: m.icon || "",
        isVisible: String(m.isVisible ?? m.visible ?? "1"),
        linkUrl: m.linkUrl || m.link_url || "",
        isKeepAlive: String(m.isKeepAlive ?? m.keepAlive ?? "1"),
        isTag: String(m.isTag ?? "0"),
        isAffix: String(m.isAffix ?? "0"),
        redirect: m.redirect || "",
        activeMenu: m.activeMenu || "",
        tagType: m.tagType || "primary",
        tagName: m.tagName || "",
        children: m.children || [],
      }));
    },
    /** Build recursive menu tree */
    buildRecursiveMenu(menus: any[], parentId = "0"): any[] {
      return menus
        .filter((m) => String(m.parentId || "0") === String(parentId) && m.isVisible !== "0")
        .map((m) => ({
          ...m,
          children: this.buildRecursiveMenu(menus, String(m.menuId)),
        }));
    },
    /** Get all breadcrumb data as a map keyed by path */
    getAllBreadcrumbList(menuList: any[], parent: any[] = [], result: Record<string, any[]> = {}): Record<string, any[]> {
      return buildBreadcrumbList(menuList, parent, result);
    },
  },
  getters: {
    getButtonList: () => useUserStoreHook().perms,
    getMenuList: () => usePermissionStoreHook().wholeMenus,
    showMenuList: () => usePermissionStoreHook().wholeMenus,
    getBreadcrumbList(): Record<string, any[]> {
      const menus = usePermissionStoreHook().wholeMenus;
      return buildBreadcrumbList(menus);
    },
  },
});
