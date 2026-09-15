/**
 * 路由创建器 —— 三模式（静态 / 模块 / 远程）统一装配
 *
 * 路由来源由 config.route.mode 决定：
 *   - static：业务路由全部由代码提供（routes 参数），无远程加载
 *   - module：按 config.route.modulePaths 装配本地页面模块路由（路由表由业务侧传入）
 *   - remote：布局/基础路由静态注册，业务路由由 loadRemoteRoutes 动态注册到 layout 下
 *
 * 用法：
 *   const router = createAppRouter({
 *     layoutRoutes: [...登录页/布局/错误页],
 *     routes: [...业务路由],
 *     getAccessToken: () => token.getAccessToken(),
 *     loadRemoteRoutes: async (router) => { ...addRoute 到 layout },
 *     hooks: { onBeforeEach: () => startLoading(), onAfterEach: () => doneLoading() },
 *   });
 *
 * 注意：进度条请用 @repo/core 的引用计数版本 startLoading/doneLoading（见 progress.ts），
 * 勿直接用 nprogress.start/done，避免并发请求下进度条提前隐藏或悬挂。
 */
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
  type RouteRecordRaw,
} from "vue-router";
import { getConfig } from "@repo/config";
import {
  setupRouterGuard,
  type TokenProvider,
  type RemoteRoutesLoader,
  type RouterGuardHooks,
} from "./guard";
import type { RouteConfigsTable } from "./types";
import { log } from "@repo/utils";
import {
  hasBaseRoutes,
  buildBaseRoutes,
  resolveThemeBaseRoutes,
  type ThemeBaseComponents,
} from "./themeBridge";

/** 创建路由选项 */
export interface CreateAppRouterOptions {
  /** 布局/基础路由（登录页、Layout、错误页等），始终注册 */
  layoutRoutes?: RouteConfigsTable[];
  /** 本地业务静态路由（static / module 模式使用；remote+mergeLocalMenu 时也注册） */
  routes?: RouteConfigsTable[];
  /** 默认路由（fallback 404 等） */
  fallback?: RouteConfigsTable[];
  /** 路由模式（history / hash），默认 history */
  mode?: "history" | "hash";
  /** 获取 accessToken 的函数（守卫用） */
  getAccessToken?: TokenProvider;
  /** 动态路由挂载的父路由名（默认 layout） */
  layoutName?: string;
  /** 远程路由加载器（remote 模式：守卫发现目标路由缺失时调用） */
  loadRemoteRoutes?: RemoteRoutesLoader;
  /** 守卫扩展钩子（进度条 / 标题 / 自定义校验） */
  hooks?: RouterGuardHooks;
  /** 路由创建后的额外配置钩子 */
  setup?: (router: ReturnType<typeof createAppRouter>) => void | Promise<void>;
  /**
   * 布局路由解析器：layoutRoutes 未提供时按 themeId 收敛 home/login 骨架。
   * 缺省按 getConfig().other.themeId 从 @repo/theme 动态解析。
   */
  resolveBaseRoutes?: () => Promise<ThemeBaseComponents | undefined>;
}

/** 全局默认路由（404 兜底） */
const defaultFallback: RouteConfigsTable[] = [
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    redirect: "/404",
  },
];

/** 创建应用路由实例 */
export function createAppRouter(options: CreateAppRouterOptions = {}) {
  const {
    layoutRoutes = [],
    routes = [],
    fallback = defaultFallback,
    mode = "history",
    resolveBaseRoutes,
  } = options;
  const config = getConfig();
  const routeConfig = config.route;

  // 三模式装配（+ all=本地+远程合并）：
  // - remote 且不合并本地菜单时，业务路由交给 loadRemoteRoutes 动态注册
  // all 模式：保留本地业务路由，同时允许远程路由动态注册
  const businessRoutes =
    routeConfig.mode === "remote" && !routeConfig.mergeLocalMenu ? [] : routes;

  // 布局路由：业务已提供则用业务；否则后续按 themeId 收敛（见 ensureBaseRoutes）
  const initialLayoutRoutes = layoutRoutes;

  const router = createRouter({
    history: mode === "hash" ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
    routes: [...initialLayoutRoutes, ...businessRoutes, ...fallback] as RouteRecordRaw[],
    scrollBehavior: () => ({ left: 0, top: 0 }),
  });

  // 基础路由注册就绪标记：业务应用在初始导航前 await（见 waitForBaseRoutes）
  let baseRoutesReady: Promise<void> | undefined = undefined;
  (router as ReturnType<typeof createAppRouter> & { __baseRoutesReady?: Promise<void> }).__baseRoutesReady = undefined;

  // 守卫：鉴权开关来自 getConfig().app.openAuth，路径来自 config.route
  setupRouterGuard(router, {
    getAccessToken: options.getAccessToken ?? (() => ""),
    layoutName: options.layoutName,
    loadRemoteRoutes: options.loadRemoteRoutes,
    hooks: options.hooks,
  });

  if (options.setup) {
    void options.setup(router);
  }

  // 若业务未提供布局路由，按 themeId 收敛 home/login 骨架
  if (!hasBaseRoutes(initialLayoutRoutes) && (resolveBaseRoutes || config.other.themeId)) {
    const resolver = resolveBaseRoutes ?? (() => resolveThemeBaseRoutes(config.other.themeId));
    baseRoutesReady = resolver().then((components) => {
      if (components) {
        const base = buildBaseRoutes(components);
        base.forEach((route) => {
          if (!router.hasRoute(String(route.name))) {
            router.addRoute(route as RouteRecordRaw);
          }
        });
      }
    }).catch((error) => {
      log.warn(`[router] 基础路由注册失败`, error);
    });
    (router as ReturnType<typeof createAppRouter> & { __baseRoutesReady?: Promise<void> }).__baseRoutesReady = baseRoutesReady;
  }

  return router;
}

/**
 * 等待基础路由注册完成。
 * 业务应用在调用 router.use / 初始导航前 await 此方法，避免
 * 基础路由未注册时被 404 兜底命中而陷入重定向循环。
 *
 * 若此前注册未成功（如主题框架尚未加载导致组件缺失），会在此
 * 重新解析并注册（幂等，已注册的路由会被跳过）。
 */
export async function waitForBaseRoutes(
  router: ReturnType<typeof createAppRouter>,
): Promise<void> {
  const r = router as ReturnType<typeof createAppRouter> & { __baseRoutesReady?: Promise<void> };
  if (r.__baseRoutesReady) {
    await r.__baseRoutesReady;
  }
  // 仍未注册（主题框架后来才加载）时兜底补注册
  if (!hasBaseRoutes(router.getRoutes().map((x) => x as unknown as RouteConfigsTable))) {
    const config = getConfig();
    const resolver = () => resolveThemeBaseRoutes(config.other.themeId);
    try {
      const components = await resolver();
      if (components) {
        const base = buildBaseRoutes(components);
        base.forEach((route) => {
          if (!router.hasRoute(String(route.name))) {
            router.addRoute(route as RouteRecordRaw);
          }
        });
      }
    } catch (error) {
      log.warn(`[router] 基础路由补注册失败`, error);
    }
  }
}

/** 类型工具：把业务路由标记为 RouteConfigsTable[] */
export function defineRoutes(routes: RouteConfigsTable[]): RouteConfigsTable[] {
  return routes;
}

export * from "./types";
export * from "./guard";
export * from "./access";
export * from "./dynamic";
export * from "./themeBridge";
export * from "./menu";
export * from "./inject";
