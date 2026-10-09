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

/**
 * 判断路径是否命中白名单（无需登录即可访问）。
 *
 * <p>支持两种写法，以覆盖默认清单与常见的通配需求：</p>
 * <ul>
 *   <li>精确路径：{@code /login}</li>
 *   <li>前缀通配：{@code /edu/**}（匹配 {@code /edu} 与其全部子路径）</li>
 * </ul>
 *
 * <p>为何需要这个函数：守卫此前把 {@code whiteList} 取出来后从未消费，
 * 白名单机制等于失效（见 {@code beforeEach} 内的说明）。</p>
 *
 * @param whiteList 白名单规则
 * @param path      目标路径（{@code to.path}，不含 query）
 * @returns 命中返回 true
 */
export function isWhitelisted(whiteList: string[], path: string): boolean {
  return whiteList.some((pattern) => {
    if (!pattern) return false;
    if (pattern === path) return true;
    if (pattern.endsWith("/**")) {
      const prefix = pattern.slice(0, -3);
      return path === prefix || path.startsWith(prefix + "/");
    }
    return false;
  });
}

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
  /**
   * 已回放过一次的深链路径（每个 Router 实例一份）。
   *
   * <p>冷启动深链在远程模式下会被 NotFound 兜底重定向到 /404，需回放到原路径；
   * 但**真** 404（路径在菜单注册后依旧不存在）若也无限回放会形成重定向环。
   * 每条路径只回放一次：第二次仍落 /404 时按白名单正常放行、渲染 404 页。</p>
   */
  const replayedPaths = new Set<string>();

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

    // 白名单判定（命中即放行）与 token 检查 → 登录页
    // 白名单：无需登录即可访问。
    // 此前这里直接判 token 跳转，而上面取到的 whiteList **从未被消费** ——
    // route.whiteList 与 ROUTER_WHITE_LIST 都只赋值不使用，白名单机制实际是死的
    // （文件头注释「白名单路由直接放行」描述的行为并不存在）。
    // 后果：任何不在 loginPath 上的免登录页（如学生登录页 /edu/student-login）
    // 在未登录时都会被推回 loginPath，学生用自己的学号根本进不去。
    //
    // 例外 —— 「冷启动深链未注册」不能在白名单处结案（2026-10-10）：
    // 远程模式下首次访问某深链（如文件管理「预览（新窗口）」新开的
    // /system/manage/filestorage?preview=<完整key>）时业务路由还没注册，
    // NotFound 兜底会把它重定向到 /404；而 /404 恰在白名单里 —— 若这里直接
    // 放行，404 页就地提交，第 8 步「先注册再回放」永远轮不到，深链上的
    // 入口参数（?preview= 等）全部作废，表现为「打开一个空 404 页」。
    // 例外条件收紧到「远程模式 + 已登录 + 该路径尚未回放过」：
    //   - 未登录访客乱输网址仍直接落 404 页（不会被弹去登录）
    //   - 真 404 第二次落 /404 时放行渲染，不会无限重定向
    const rfPath = to.redirectedFrom?.path;
    const unresolvedDeepLink =
      to.path === "/404" &&
      !!rfPath &&
      rfPath !== "/404" &&
      (route.mode === "remote" || route.mode === "all") &&
      !!loadRemoteRoutes &&
      !!getAccessToken() &&
      !replayedPaths.has(rfPath);
    if (isWhitelisted(whiteList, to.path) && !unresolvedDeepLink) {
      return true;
    }

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
        // 回放必须带上原深链的 query/hash，只回 path 会把入口参数整体丢掉：
        // 首次导航时业务路由尚未注册 → NotFound 重定向，query 只存在于 redirectedFrom；
        // 文件管理「预览（新窗口）」正是靠 /filestorage?preview=<完整key> 在目标页
        // onMounted 自动弹出预览弹框，丢掉 query 就退化成「打开一个空列表页」。
        const back = to.redirectedFrom;
        if (back) {
          replayedPaths.add(back.path);
          return { path: back.path, query: back.query, hash: back.hash, replace: true };
        }
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



