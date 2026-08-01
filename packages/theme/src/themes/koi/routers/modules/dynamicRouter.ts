/**
 * koi 动态路由（基于 core 的通用动态路由能力）
 *
 * 通用逻辑（registerDynamicRoutes / forceRelogin / initDynamicRoutes）已下沉 @repo/core，
 * 此处只注入 koi 特有的数据源（auth store 菜单 / token 重置 / koiMsg 提示）。
 */
import type { Router } from "vue-router";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/theme/koi/stores/modules/auth.ts";
import { msgWarning } from "@repo/core";
import { getRouter as getKoiRouter } from "@repo/core";
import {
  registerDynamicRoutes,
  initDynamicRoutes as coreInitDynamicRoutes,
  type DynamicRouterContext,
} from "@repo/core";

/** 权限异常：清空 token 与权限缓存，回登录页 */
export const forceRelogin = async (router: Router, message?: string) => {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  userStore.setToken("");
  authStore.$reset();
  if (message) {
    msgWarning(message);
  }
  await router.replace("/login");
};

/** 初始化动态路由：拉取菜单 + 注册到 layout（复用 core 通用逻辑） */
export const initDynamicRouter = async (router: Router) => {
  const authStore = useAuthStore();
  const context: DynamicRouterContext = {
    getMenuList: () => authStore.menuList,
    loadMenus: async () => {
      await Promise.all([authStore.listRouters(), authStore.getLoginUserInfo()]);
    },
    onForceRelogin: (message) => forceRelogin(router, message),
    notify: (message) => msgWarning(message),
  };
  return coreInitDynamicRoutes(router, context);
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
    if (name && getKoiRouter().hasRoute(name)) {
      getKoiRouter().removeRoute(name);
    }
  });
};
