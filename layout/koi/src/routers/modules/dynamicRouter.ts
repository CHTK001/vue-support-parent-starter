import useUserStore from "../../stores/modules/user.ts";
import useAuthStore from "../../stores/modules/auth.ts";
import { LOGIN_URL } from "../../config/index.ts";
import { koiMsgWarning } from "../../utils/koi.ts";
import router from "../../routers/index";

/** 菜单/权限异常：清空 token 与权限缓存，回登录页 */
export const forceRelogin = async (message?: string) => {
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
const registerDynamicRoutes = (menuList: any[]) => {
  let addedCount = 0;
  menuList.forEach((item: any) => {
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
export const isDynamicRoutesMissing = (menuList: any[]) => {
  if (!menuList?.length) {
    return true;
  }
  return menuList.some((menu: any) => menu?.name && !router.hasRoute(menu.name));
};

const doInitDynamicRouter = async () => {
  const userStore = useUserStore();
  const authStore = useAuthStore();

  try {
    if (!authStore.menuList?.length) {
      await Promise.all([authStore.listRouters(), authStore.getLoginUserInfo()]);
    }

    if (!authStore.menuList?.length) {
      await forceRelogin("未获取到菜单权限，请重新登录");
      throw new Error("当前账号无菜单权限");
    }

    const addedCount = registerDynamicRoutes(authStore.menuList);

    if (addedCount === 0 && isDynamicRoutesMissing(authStore.menuList)) {
      const conflictOrInvalid = authStore.menuList.filter(
        (menu: any) => menu?.name && !router.hasRoute(menu.name)
      );
      console.error("[route] 动态路由注册失败", conflictOrInvalid);
      await forceRelogin("路由加载失败，请重新登录");
      throw new Error("动态路由注册失败");
    }
  } catch (error) {
    console.error(error);
    if (userStore.token) {
      await forceRelogin();
    }
    throw error;
  }
};

export const initDynamicRouter = async () => {
  if (initDynamicRouterPromise) {
    return initDynamicRouterPromise;
  }

  initDynamicRouterPromise = doInitDynamicRouter().finally(() => {
    initDynamicRouterPromise = null;
  });

  return initDynamicRouterPromise;
};
