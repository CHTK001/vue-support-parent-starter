import type { Router } from "vue-router";
import useUserStore from "@repo/theme/koi/stores/modules/user.ts";
import useAuthStore from "@repo/theme/koi/stores/modules/auth.ts";
import { LOGIN_URL } from "@repo/theme/koi/config/index.ts";
import { koiMsgWarning } from "@repo/theme/koi/utils/koi.ts";
import { getConfig } from "@repo/config";

/** 菜单/权限异常：清空 token 与权限缓存，回登录页 */
export const forceRelogin = async (router: Router, message?: string) => {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  userStore.setToken("");
  authStore.$reset();
  if (message) {
    koiMsgWarning(message);
  }
  await router.replace(LOGIN_URL);
};

/** 防止路由守卫并发触发时重复拉取菜单、重复 addRoute */
let initDynamicRouterPromise: Promise<void> | null = null;

/** 将扁平菜单注册到 layout 子路由 */
const registerDynamicRoutes = (router: Router, menuList: any[]) => {
  const allowedPrefixes = getConfig().route.allowPrefixes ?? [];
  const filteredMenuList =
    allowedPrefixes.length > 0
      ? menuList.filter((item: any) => {
          const path = String(item?.path ?? "").trim();
          return allowedPrefixes.some(
            (prefix) => path === prefix || path.startsWith(`${prefix}/`)
          );
        })
      : menuList;

  let addedCount = 0;
  filteredMenuList.forEach((item: any) => {
    if (!item?.name) {
      console.warn("[route] 菜单缺少 name，已跳过", item);
      return;
    }
    if (router.hasRoute(item.name)) {
      return;
    }
    router.addRoute("layout", item);
    addedCount += 1;
  });
  return addedCount;
};

/** 菜单已在 store，但路由表里没有对应 name（如登出/resetRouter 后未重新注册） */
export const isDynamicRoutesMissing = (router: Router, menuList: any[]) => {
  if (!menuList?.length) {
    return true;
  }
  return menuList.some((menu: any) => menu?.name && !router.hasRoute(menu.name));
};

const doInitDynamicRouter = async (router: Router) => {
  const userStore = useUserStore();
  const authStore = useAuthStore();

  try {
    if (!authStore.menuList?.length) {
      await Promise.all([authStore.listRouters(), authStore.getLoginUserInfo()]);
    }

    if (!authStore.menuList?.length) {
      await forceRelogin(router, "未获取到菜单权限，请重新登录");
      throw new Error("当前账号无菜单权限");
    }

    const addedCount = registerDynamicRoutes(router, authStore.menuList);

    if (addedCount === 0 && isDynamicRoutesMissing(router, authStore.menuList)) {
      const conflictOrInvalid = authStore.menuList.filter(
        (menu: any) => menu?.name && !router.hasRoute(menu.name)
      );
      console.error("[route] 动态路由注册失败", conflictOrInvalid);
      await forceRelogin(router, "路由加载失败，请重新登录");
      throw new Error("动态路由注册失败");
    }
  } catch (error) {
    console.error(error);
    if (userStore.token) {
      await forceRelogin(router);
    }
    throw error;
  }
};

/** 初始化动态路由（拉取菜单 + 注册到 layout），router 由调用方传入避免循环依赖 */
export const initDynamicRouter = async (router: Router) => {
  if (initDynamicRouterPromise) {
    return initDynamicRouterPromise;
  }

  initDynamicRouterPromise = doInitDynamicRouter(router).finally(() => {
    initDynamicRouterPromise = null;
  });

  return initDynamicRouterPromise;
};
