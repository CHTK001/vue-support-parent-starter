/**
 * 路由守卫 —— 三模式 + 权限校验 + 登录拦截 + 标题设置
 *
 * 守卫逻辑（与 getConfig() 联动，路径均来自 config.route）：
 *  1. hooks.onBeforeEach（nprogress 开始等）
 *  2. 设置 document.title（hooks.resolveTitle 自定义，默认 meta.title - app.title）
 *  3. openAuth=false 时直接放行
 *  4. hooks.beforeEach 自定义校验（登录页处理等，返回非 undefined 即采用）
 *  5. 白名单路由直接放行（config.route.whiteList）
 *  6. 访问登录页：已登录重定向首页，未登录放行
 *  7. 无 token 重定向 config.route.loginPath
 *  8. 远程模式：目标路由未注册时调用 loadRemoteRoutes 并重放导航
 *  9. 校验 meta.roles / meta.perms（基于 syncUserPerm 的内存权限）
 *  10. 未通过跳 config.route.forbiddenPath
 */
import type { Router, RouteLocationNormalized, NavigationGuardReturn } from "vue-router";
import { getConfig } from "@repo/config";
import { getMenuLanguage } from "@repo/languages";
import { getAppStorage } from "../storage";
import type { RouteConfigsTable } from "./types";
import { checkRouteAccess, ROUTER_WHITE_LIST, type RouteAccessContext } from "./access";

/** 登录页路径（默认，可由 config.route.loginPath 覆盖） */
export const LOGIN_PATH = "/login";

/** 无权限页（默认，可由 config.route.forbiddenPath 覆盖） */
export const FORBIDDEN_PATH = "/403";

/** 令牌提供函数（由 createApp 注入，避免循环依赖） */
export type TokenProvider = () => string;

/** 远程路由加载器：返回待注册的路由表；返回 void 视为已自行注册（如 addRoute） */
export type RemoteRoutesLoader = (
  router: Router
) => Promise<RouteConfigsTable[] | void>;

/** 守卫扩展钩子（主题层注入 UI 相关逻辑，如进度条、i18n 标题） */
export interface RouterGuardHooks {
  /** 导航开始（如 nprogress.start） */
  onBeforeEach?: (to: RouteLocationNormalized, from: RouteLocationNormalized) => void;
  /** 标题解析（返回标题文本，不返回则用默认 title - app.title） */
  resolveTitle?: (to: RouteLocationNormalized) => string | undefined;
  /** 自定义校验（在默认守卫通过后执行；返回 false/路由对象可拦截，返回 true/undefined 放行） */
  beforeEach?: (to: RouteLocationNormalized, from: RouteLocationNormalized) => NavigationGuardReturn | Promise<NavigationGuardReturn>;
  /** 导航成功（如 nprogress.done） */
  onAfterEach?: (to: RouteLocationNormalized, from: RouteLocationNormalized) => void;
  /** 路由错误 */
  onError?: (error: unknown) => void;
}

/** 守卫安装选项 */
export interface RouterGuardOptions {
  /** 获取 accessToken */
  getAccessToken: TokenProvider;
  /** 动态路由挂载的父路由名（默认 layout） */
  layoutName?: string;
  /** 远程模式：目标路由未注册时调用 */
  loadRemoteRoutes?: RemoteRoutesLoader;
  /** 守卫扩展钩子 */
  hooks?: RouterGuardHooks;
}

/** 安装路由守卫 */
export function setupRouterGuard(
  router: Router,
  options: RouterGuardOptions
): void {
  const { getAccessToken, loadRemoteRoutes, hooks } = options;
  const layoutName = options.layoutName ?? "layout";

  router.beforeEach(async (to, from) => {
    const config = getConfig();
    const route = config.route;
    const whiteList = route.whiteList?.length ? route.whiteList : ROUTER_WHITE_LIST;

    // 1. 导航开始钩子
    hooks?.onBeforeEach?.(to, from);

    // 2. 标题
    const customTitle = hooks?.resolveTitle?.(to);
    const rawTitle = getMenuLanguage((to.meta?.title as string) || "") || config.app.title;
    const title = customTitle ?? (rawTitle === "home" ? "" : rawTitle);
    document.title = title && title !== config.app.title ? `${title} - ${config.app.title}` : config.app.title;

    // 3. 未开启鉴权：直接放行
    if (!config.app.openAuth) return true;

    // 4. 自定义校验（主题层登录页处理等，先于白名单/token，返回非 undefined 即采用）
    const custom = hooks?.beforeEach?.(to, from);
    if (custom !== undefined) {
      return custom;
    }

    // 5. 登录页：刷新时始终清理用户存储
    if (to.path === route.loginPath) {
      try { getAppStorage().clearUserStorage(); } catch { /* ignore */ }
      if (getAccessToken()) {
        return { path: route.homePath, replace: true };
      }
      return true;
    }

    // 6. 无 token → 登录页
    const token = getAccessToken();
    if (!token) {
      return { path: route.loginPath, replace: true };
    }

    // 8. 远程模式：加载远程路由（幂等，内部按需注册并重播导航）
    // 目标路由缺失（404 兜底）时需要先注册再重放；目标已注册（如静态路由 /home 刷新）
    // 时也需确保菜单已初始化，否则侧边栏菜单为空。loadRemoteRoutes 内部防并发（initPromise）
    // 且注册幂等（已存在路由跳过），重复调用开销可忽略。
    const isRemote = route.mode === "remote" || route.mode === "all";
    const originalPath = to.redirectedFrom?.path || to.path;
    if (isRemote && loadRemoteRoutes && originalPath !== route.loginPath) {
      await loadRemoteRoutes!(router);
      if (!getAccessToken()) {
        return { path: route.loginPath, replace: true };
      }
      const wasRedirectedTo404 = to.path === "/404" && to.redirectedFrom && to.redirectedFrom.path !== "/404";
      const isFallbackOnly = wasRedirectedTo404 || (to.matched.length > 0 && to.matched[to.matched.length - 1]?.path?.includes("pathMatch"));
      if (isFallbackOnly) {
        return { path: originalPath, replace: true };
      }
    }

    // 9. 角色 / 权限校验（与 React 版共用 checkRouteAccess 决策）
    const decision = checkRouteAccess(
      {
        path: to.path,
        title: (to.meta?.title as string) || "",
        roles: to.meta?.roles as string[] | undefined,
        perms: to.meta?.perms as string[] | undefined,
      },
      { getAccessToken } satisfies RouteAccessContext
    );
    if (decision.type === "redirect-login") {
      return { path: route.loginPath, replace: true };
    }
    if (decision.type === "redirect-home") {
      return { path: route.homePath, replace: true };
    }
    if (decision.type === "redirect-forbidden") {
      return { path: route.forbiddenPath, replace: true };
    }

    return true;
  });

  router.afterEach((to, from) => {
    hooks?.onAfterEach?.(to, from);
  });

  router.onError((error) => {
    hooks?.onError?.(error);
  });

  void layoutName;
}



