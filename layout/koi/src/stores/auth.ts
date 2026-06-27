import { defineStore } from "pinia";
import { useUserStoreHook } from "@repo/core/src/store/modules/UserStore";
import { usePermissionStoreHook } from "@repo/core/src/store/modules/PermissionStore";

/**
 * koi auth store — 委托到 @repo/core
 *
 * 保持与 koi 组件兼容的接口，内部全部委托到 @repo/core 的 UserStore/PermissionStore。
 * koi 只负责布局/主题样式，所有认证、菜单、权限逻辑由 @repo/core 管理。
 */
export const useKoiAuthStore = defineStore("koi-auth", {
  state: () => ({
    // 以下 state 保留给旧的 getter 兼容层，实际数据从 @repo/core 读取
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
    /** 委托到 @repo/core: PermissionStore.handleWholeMenus */
    setMenuList(menus: any[]) {
      usePermissionStoreHook().handleWholeMenus(menus);
    },
    /** 适配菜单格式（保留兼容性，不再设置内部 state） */
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
    /** 构建递归菜单树（保留兼容性） */
    buildRecursiveMenu(menus: any[], parentId = "0"): any[] {
      return menus
        .filter((m) => String(m.parentId || "0") === String(parentId) && m.isVisible !== "0")
        .map((m) => ({
          ...m,
          children: this.buildRecursiveMenu(menus, String(m.menuId)),
        }));
    },
    /** 获取所有面包屑数据（保留兼容性） */
    getAllBreadcrumbList(menuList: any[], parent: any[] = []): any[] {
      const result: any[] = [];
      for (const menu of menuList) {
        const item = { ...menu, parent: [...parent] };
        if (menu.children?.length) {
          result.push(...this.getAllBreadcrumbList(menu.children, [...parent, menu]));
        } else {
          result.push(item);
        }
      }
      return result;
    },
  },
  getters: {
    getButtonList: () => useUserStoreHook().perms,
    getMenuList: () => usePermissionStoreHook().wholeMenus,
    showMenuList: () => usePermissionStoreHook().wholeMenus,
    getBreadcrumbList: () => {
      const menus = usePermissionStoreHook().wholeMenus;
      const auth = useKoiAuthStore();
      return auth.getAllBreadcrumbList(menus);
    },
  },
});