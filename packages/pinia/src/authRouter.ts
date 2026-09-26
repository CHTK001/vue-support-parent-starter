/**
 * 认证路由初始化（@repo/pinia）
 *
 * 动态路由 + 强制重登 + 重置路由，基于 core 的通用动态路由能力。
 * auth store 菜单源（远程菜单 + 用户信息）作为数据源注入。
 */
import type { Router } from "vue-router";
import { msgWarning, getRouter, registerDynamicRoutes, initDynamicRoutes, type DynamicRouterContext } from "@repo/core";
import { getConfig } from "@repo/config";
import { clearAuthCache } from "@repo/utils";
import useUserStore from "./modules/user";
import useAuthStore from "./modules/auth";

/** 权限异常：清空 token 与权限缓存，回登录页 */
export const forceRelogin = async (router: Router, message?: string) => {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  userStore.$reset();
  authStore.$reset();
  // 静默清除用户级缓存（远程菜单 / 布局），下次登录重新拉取
  clearAuthCache();
  if (message) {
    msgWarning(message);
  }
  await router.replace("/login");
};

/** 初始化动态路由：拉取菜单 + 注册到 layout（复用 core 通用逻辑） */
export const initAuthRouter = async (router: Router) => {
  const authStore = useAuthStore();
  // static/module 模式：菜单全在本地路由树，authStore.menuList（远程菜单）本就为空，
  // 侧边栏走 recursiveMenuList 照常渲染，故空菜单是预期状态，不该提示「未分配菜单」。
  // 仅 remote/all 模式才有「角色未分配菜单」语义，此时才提示。
  const mode = getConfig().route.mode;
  const useRemoteMenu = mode === "remote" || mode === "all";
  const context: DynamicRouterContext = {
    getMenuList: () => authStore.menuList,
    loadMenus: async () => {
      // 菜单与用户信息并行拉取；用户信息失败不阻塞菜单注册
      const [menu] = await Promise.allSettled([authStore.listRouters(), authStore.getLoginUserInfo()]);
      // 拉取失败（令牌失效 / 接口异常）必须上抛，由 initDynamicRoutes 强制重登；
      // 拉取成功但列表为空是「角色未分配菜单」，属合法状态。
      if (menu.status === "rejected" || menu.value === true) {
        throw new Error("远程菜单拉取失败");
      }
    },
    onForceRelogin: (message) => forceRelogin(router, message),
    notify: (message) => {
      if (useRemoteMenu) {
        msgWarning(message);
      }
    },
  };
  return initDynamicRoutes(router, context);
};

export { registerDynamicRoutes };

/** 重置路由（登出 / 切号时移除动态注册的路由） */
export const resetRouter = () => {
  const authStore = useAuthStore();
  const menuList = authStore.getMenuList;
  if (!menuList.length) {
    return;
  }
  menuList.forEach((route: any) => {
    const { name } = route;
    if (name && getRouter().hasRoute(name)) {
      getRouter().removeRoute(name);
    }
  });
};
