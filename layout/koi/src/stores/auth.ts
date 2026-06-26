import { defineStore } from "pinia";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";

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
    /** 从 vue-parent 的 user store 同步登录用户信息 */
    syncFromParent() {
      try {
        const { $storage } = useGlobal<GlobalPropertiesApi>();
        if (!$storage?.user) return;
        const user = $storage.user as Record<string, any>;
        this.loginUser = {
          userId: String(user.userId || user.id || ""),
          loginName: String(user.username || user.loginName || ""),
          sex: String(user.sex || ""),
          avatar: String(user.avatar || ""),
        };
      } catch { /* ignore */ }
    },
    /** 设置菜单列表（适配 vue-parent 的菜单格式 → koi-ui 格式） */
    setMenuList(menus: any[]) {
      this.menuList = this.adaptMenuList(menus);
      this.recursiveMenuList = this.buildRecursiveMenu(menus);
      this.breadcrumbList = menus;
    },
    /** 适配菜单格式 */
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
    /** 构建递归菜单树 */
    buildRecursiveMenu(menus: any[], parentId = "0"): any[] {
      return menus
        .filter((m) => String(m.parentId || "0") === String(parentId) && m.isVisible !== "0")
        .map((m) => ({
          ...m,
          children: this.buildRecursiveMenu(menus, String(m.menuId)),
        }));
    },
    /** 获取所有面包屑数据 */
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
    getButtonList: (state) => state.buttonList,
    getMenuList: (state) => state.menuList,
    showMenuList: (state) => state.recursiveMenuList,
    getBreadcrumbList: (state) => {
      const auth = useKoiAuthStore();
      return auth.getAllBreadcrumbList(state.breadcrumbList);
    },
  },
});