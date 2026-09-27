/**
 * 认证路由初始化（@repo/pinia）
 *
 * 动态路由 + 强制重登 + 重置路由，基于 core 的通用动态路由能力。
 * auth store 菜单源（远程菜单 + 用户信息）作为数据源注入。
 */
import type { Router } from "vue-router";
import { msgWarning, getRouter, registerDynamicRoutes, initDynamicRoutes, type DynamicRouterContext } from "@repo/core";
import { getConfig } from "@repo/config";
import { clearAllAuthData } from "@repo/utils";
import useUserStore from "./modules/user";
import useAuthStore from "./modules/auth";

/** 权限异常：清空 token 与权限缓存，回登录页 */
export const forceRelogin = async (router: Router, message?: string) => {
  const userStore = useUserStore();
  const authStore = useAuthStore();
  userStore.$reset();
  authStore.$reset();
  // 必须清空令牌 + 用户信息 + 用户级缓存（远程菜单 / 布局），下次登录重新拉取。
  // 只清缓存不清令牌时，守卫会凭残留 token 命中「已登录访问登录页」分支把 /login 弹回首页，
  // 用户看到「请重新登录」提示却永远到不了登录页。
  clearAllAuthData();
  if (message) {
    msgWarning(message);
  }
  const loginPath = getConfig().route.loginPath || "/login";
  // 已在登录页时跳过重复 replace，避免重复导航与潜在的跳转死循环
  if (router.currentRoute.value.path !== loginPath) {
    await router.replace(loginPath);
  }
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
    // 只有 remote / all 模式才需要拉远程菜单。
    // static / module 模式下菜单全在本地路由树，authStore.menuList 本就为空，
    // 若仍注入 loadMenus，doInitDynamicRoutes 会因为「菜单为空」去调它；
    // 而这类应用的后端（如 spring-support-monitor-starter 打的 ngx-console）
    // 根本没有 /v2/user/menu 接口，请求 404 会让菜单加载失败。
    // 更糟的是旧实现在失败时会强制重登，把刚登录的 token 清掉，
    // 表现为「登录成功后立刻被弹回登录页」的死循环。
    loadMenus: useRemoteMenu
      ? async () => {
          // 菜单与用户信息并行拉取；用户信息失败不阻塞菜单注册
          const [menu] = await Promise.allSettled([authStore.listRouters(), authStore.getLoginUserInfo()]);
          // 拉取失败上抛，由 initDynamicRoutes 记录并降级（不再强制重登：
          // 会话失效由 http 拦截器按 401 / RELOGIN_CODES 判定，那才有服务端依据）
          if (menu.status === "rejected" || menu.value === true) {
            throw new Error("远程菜单拉取失败");
          }
        }
      : undefined,
    onForceRelogin: (message) => forceRelogin(router, message),
    notify: (message) => {
      if (useRemoteMenu) {
        msgWarning(message);
      }
    },
  };
  // 用户信息（昵称 / 头像 / 角色 / 权限）任何模式都要拉。
  // 原来它只在 loadMenus 里被顺带调用；static 模式下 loadMenus 为空，
  // 不在这里补一次的话，登录后右上角用户信息与角色权限会一直是空的。
  if (!useRemoteMenu) {
    void authStore.getLoginUserInfo().catch(() => {
      // 拉不到不阻断：布局用兜底信息渲染，会话失效由 http 拦截器处理
    });
  }
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
