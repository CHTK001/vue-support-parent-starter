/**
 * 路由配置模块
 * 提供路由初始化、导航守卫、动态路由加载等功能
 * @author CH
 * @version 2.0.0
 * @since 2025-12-03
 */
import { isAllEmpty, isUrl, openLink } from "@pureadmin/utils";
import {
  getConfig,
  multipleTabsKey,
  transformI18n,
  userKey,
} from "@repo/config";
import { buildHierarchyTree, localStorageProxy, NProgress } from "@repo/utils";
import Cookies from "js-cookie";
import {
  createRouter,
  type RouteComponent,
  type Router,
  type RouteRecordRaw,
} from "vue-router";
import type { UserResult } from "../api/common/user";
import { usePermissionStoreHook } from "../store/modules/PermissionStore";
import { useMultiTagsStoreHook } from "../store/modules/MultiTagsStore";
import { removeToken } from "../utils/auth";
import {
  ascending,
  findRouteByPath,
  formatFlatteningRoutes,
  formatTwoStageRoutes,
  getHistoryMode,
  getTopMenu,
  handleAliveRoute,
  initRouter,
  isOneOfArray,
} from "./utils";
import { resolveRouteSourceMode } from "./route-mode";
import coreRemainingRoutes from "./modules/remaining";

/** 默认菜单图标 */
const DEFAULT_MENU_ICON = "ri:menu-line";
const ROOT_LAYOUT_ROUTE_NAME = "RootLayout";

/** 路由白名单 */
const whiteList = ["/login"];
//@ts-ignore
const { VITE_HIDE_HOME } = import.meta.env;

/** 不参与菜单显示的路由集合 */
const remainingRouter: RouteRecordRaw[] = [];

const appendRouteRecord = (
  container: RouteRecordRaw[],
  route: RouteRecordRaw
): void => {
  if (!route) return;

  ensureRouteIcon(route);

  const duplicatedIndex = container.findIndex((item) => {
    if (!item) return false;
    return (
      (route.name && item.name === route.name) ||
      (!!route.path && item.path === route.path)
    );
  });

  if (duplicatedIndex !== -1) {
    const current = container[duplicatedIndex];
    const mergedChildren = [...(current.children || [])];
    (route.children || []).forEach((child) => {
      appendRouteRecord(mergedChildren, child);
    });
    const mergedRoute = {
      ...current,
      ...route,
      children: mergedChildren,
    } as RouteRecordRaw;
    if (
      current.path === "/" &&
      String(current.name || "") === ROOT_LAYOUT_ROUTE_NAME
    ) {
      mergedRoute.name = ROOT_LAYOUT_ROUTE_NAME;
    }
    container[duplicatedIndex] = mergedRoute;
    return;
  }

  container.push(route);
};

/** @deprecated 不再使用，保留以兼容外部引用 */
const _resolveModuleRoutes = (_module: any): RouteRecordRaw[] => [];

const isRemainingLikeRoute = (route?: RouteRecordRaw): boolean => {
  return Boolean(route?.meta?.remaining);
};

const splitRouteByRemainingFlag = (
  route: RouteRecordRaw
): RouteRecordRaw | null => {
  if (!route) {
    return null;
  }

  if (isRemainingLikeRoute(route)) {
    appendRouteRecord(remainingRouter, route);
    return null;
  }

  if (!Array.isArray(route.children) || route.children.length === 0) {
    return route;
  }

  const keptChildren: RouteRecordRaw[] = [];
  route.children.forEach((child) => {
    const normalizedChild = splitRouteByRemainingFlag(child as RouteRecordRaw);
    if (normalizedChild) {
      keptChildren.push(normalizedChild);
    }
  });

  route.children = keptChildren;
  return route;
};

/**
 * 确保路由具有图标，若无则设置默认图标
 * @param route - 路由配置对象
 */
const ensureRouteIcon = (route: any): void => {
  if (!route) return;
  if (!route.meta) route.meta = {};
  if (!route.meta.icon) route.meta.icon = DEFAULT_MENU_ICON;
  if (route.children?.length) {
    route.children.forEach(ensureRouteIcon);
  }
};

// 直接引入核心不参与菜单的路由（login、redirect 等），替代 glob 自动发现
coreRemainingRoutes.forEach((route) => {
  if (route) appendRouteRecord(remainingRouter, route);
});

/** 原始静态路由（未做任何处理），由应用通过 addAppRoutes() 显式传入 */
const routes: RouteRecordRaw[] = [];

/**
 * 显式注册应用路由
 * 替代 glob 自动发现机制，应用在自己的入口中导入路由并注册。
 * 需在 await routerReady 之前调用。
 */
export function addAppRoutes(extraRoutes: RouteRecordRaw[]): void {
  extraRoutes.forEach((route) => {
    const normalRoute = splitRouteByRemainingFlag(route);
    if (normalRoute) {
      appendRouteRecord(routes, normalRoute);
    }
  });
}

// 始终加载的错误页面（不受 LocalRouteModulePaths / router 配置控制）
// 这些路由会通过 meta.remaining 被 splitRouteByRemainingFlag 放入 remainingRouter
const ALWAYS_ERROR_ROUTES: RouteRecordRaw[] = [
  {
    path: "/error/403",
    name: "Error403",
    component: () => import("@pages/common/error/403.vue"),
    meta: { title: "403", showLink: false, remaining: true },
  },
  {
    path: "/error/404",
    name: "Error404",
    component: () => import("@pages/common/error/404.vue"),
    meta: { title: "404", showLink: false, remaining: true },
  },
  {
    path: "/error/500",
    name: "Error500",
    component: () => import("@pages/common/error/500.vue"),
    meta: { title: "500", showLink: false, remaining: true },
  },
];

const ensureRootLayoutRoute = (): void => {
  if (routes.some((route) => route?.path === "/" || route?.path === "/home")) {
    return;
  }

  const layoutImport = () => {
    try {
      const cfg = getConfig();
      // 支持 LayoutPackage 和 SystemTheme 两种配置方式
      const layoutPackage = cfg?.LayoutPackage;
      const systemTheme = cfg?.SystemTheme;
      if (layoutPackage === "koi" || systemTheme === "koi") {
        return import("@layout/koi").then((m) => m.default);
      }
    } catch {
      // fallback to default layout if config not available
    }
    return import("@layout/default").then((m) => m.default);
  };

  routes.unshift(
    {
      path: "/",
      name: ROOT_LAYOUT_ROUTE_NAME,
      component: layoutImport,
    meta: {
      title: "主页",
      showLink: false,
      hiddenTag: true,
      rank: 0,
    },
    children: [],
  } as RouteRecordRaw);
};

const replaceRouteArray = <T>(target: T[], source: T[]): void => {
  target.splice(0, target.length, ...source);
};

const buildConstantRouteList = (): Array<RouteRecordRaw> =>
  formatTwoStageRoutes(
    formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity))))
  );

const buildConstantMenuList = (): Array<RouteComponent> =>
  ascending(routes.flat(Infinity)).concat(...remainingRouter);

const buildRemainingPathList = (): string[] =>
  remainingRouter
    .map((route) => {
      if (!route) {
        return;
      }
      return route.path;
    })
    .filter(Boolean);

/** 导出处理后的静态路由（会在 routerReady 中刷新） */
export const constantRoutes: Array<RouteRecordRaw> = [];

/** 用于渲染菜单，保持原始层级（会在 routerReady 中刷新） */
export const constantMenus: Array<RouteComponent> = [];

/** 不参与菜单的路由（会在 routerReady 中刷新） */
export const remainingPaths: string[] = [];

const refreshStaticRouteState = (): void => {
  replaceRouteArray(constantRoutes, buildConstantRouteList());
  replaceRouteArray(constantMenus, buildConstantMenuList());
  replaceRouteArray(remainingPaths, buildRemainingPathList());
};

/**
 * 确保首页路由：
 * - 在根路由下添加 /home 子路由
 * - 根路由 / 始终重定向到 /home
 * - /home 自身不设 redirect，避免循环
 */
const ensureHomeRoute = (): void => {
  const rootRoute = routes.find((r) => r?.path === "/");
  if (!rootRoute) return;

  const children = Array.isArray(rootRoute.children) ? rootRoute.children : [];

  // 1. 确保 /home 子路由始终存在
  const hasHome = children.some((child) => child?.path === "/home");
  if (!hasHome) {
    children.unshift({
      path: "/home",
      name: "Home",
      component: () => import("@pages/common/home/default/index.vue"),
      meta: { title: "首页", showLink: true, rank: 0 },
    });
    rootRoute.children = children;
  }

  // 2. 始终将根路径重定向到 /home（覆盖其他模块设置的 redirect）
  rootRoute.redirect = "/home";
};

/**
 * 路由初始化：
 * - 始终加载错误页面（403/404/500）
 * - 应用路由由 addAppRoutes() 显式传入
 * - ensureHomeRoute 在 finalizeRoutes 阶段执行（等 addAppRoutes 调用后）
 */
const initRouterMode = (): void => {
  ALWAYS_ERROR_ROUTES.forEach((route) => {
    if (route) appendRouteRecord(remainingRouter, route);
  });
};

initRouterMode();
ensureRootLayoutRoute();
refreshStaticRouteState();

/** routerReady 的延迟解析器 */
let resolveRouterReady: (() => void) | null = null;
const routerReadyPromise: Promise<void> = new Promise((resolve) => {
  resolveRouterReady = resolve;
});

/**
 * 完成路由初始化
 * 应用调用 addAppRoutes() 后调用此函数，触发首页路由添加、状态刷新和路由注册。
 */
export function finalizeRoutes(): void {
  ensureHomeRoute();
  ensureRootLayoutRoute();
  refreshStaticRouteState();
  refreshRouterStaticRoutes();
  resolveRouterReady?.();
}

export const routerReady: Promise<void> = routerReadyPromise;

/** 创建路由实例 */
export const router: Router = createRouter({
  //@ts-ignore
  history: getHistoryMode(import.meta.env.VITE_ROUTER_HISTORY),
  routes: constantRoutes.concat(...remainingRouter),
  strict: true,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    if (from.meta.saveSrollTop) {
      //@ts-ignore
      const top: number =
        //@ts-ignore
        document.documentElement.scrollTop || document.body.scrollTop;
      return { left: 0, top };
    }

    return { left: 0, top: 0 };
  },
});

const hasRegisteredStaticRoute = (route: RouteRecordRaw): boolean => {
  return router
    .getRoutes()
    .some(
      (item) =>
        (!!route.name && item.name === route.name) || item.path === route.path
    );
};

const refreshRouterStaticRoutes = (): void => {
  const rootRoute = constantRoutes.find((route) => route.path === "/");
  const rootChildren = Array.isArray(rootRoute?.children)
    ? rootRoute.children
    : [];

  // 检测根路由 component 是否变化或尚未注册
  // 注意：路由创建时 constantRoutes 可能为空（appRoutes 尚未调用），
  // 所以根路由需要在此处注册到路由树中，否则 LayoutKoi 等自定义布局不会生效。
  const hasRootInTree = router.hasRoute(ROOT_LAYOUT_ROUTE_NAME);
  const registeredRoot = router
    .getRoutes()
    .find((r) => r.path === "/");

  if (rootRoute?.component) {
    if (hasRootInTree && registeredRoot && registeredRoot.components?.default !== rootRoute.component) {
      // 组件变化：先移除再重新添加
      router.removeRoute(ROOT_LAYOUT_ROUTE_NAME);
      router.addRoute({
        path: "/",
        name: ROOT_LAYOUT_ROUTE_NAME,
        component: rootRoute.component,
        redirect: rootRoute.redirect,
        meta: rootRoute.meta,
      } as RouteRecordRaw);
    } else if (!hasRootInTree) {
      // 根路由尚未注册到路由树（首次运行时 appRoutes 在路由创建后才调用）
      router.addRoute({
        path: "/",
        name: ROOT_LAYOUT_ROUTE_NAME,
        component: rootRoute.component,
        redirect: rootRoute.redirect,
        meta: rootRoute.meta,
      } as RouteRecordRaw);
    }
  }

  rootChildren.forEach((child) => {
    if (!child || hasRegisteredStaticRoute(child)) {
      return;
    }
    router.addRoute(ROOT_LAYOUT_ROUTE_NAME, child);
  });

  remainingRouter.forEach((route) => {
    if (!route || hasRegisteredStaticRoute(route)) {
      return;
    }
    router.addRoute(route);
  });

  router.options.routes = constantRoutes.concat(...remainingRouter);
};

/** 重置路由 */
export function resetRouter() {
  router.getRoutes().forEach((route) => {
    const { name, meta } = route;
    if (name && router.hasRoute(name) && meta?.backstage) {
      router.removeRoute(name);
      router.options.routes = constantRoutes.concat(...remainingRouter);
    }
  });
  usePermissionStoreHook().clearAllCachePage();
}

const resolveConfiguredPostLoginPath = (): string => {
  return String(
    getConfig().PostLoginRedirect || getConfig().LoginSuccessRedirect || ""
  ).trim();
};

const isNavigableTargetPath = (path?: string): boolean => {
  if (!path || path === "/" || whiteList.includes(path)) {
    return false;
  }

  if (path.startsWith("/error")) {
    return false;
  }

  const matchedRoute = router.getRoutes().find((route) => route.path === path);
  if (!matchedRoute) {
    return false;
  }

  return !matchedRoute.meta?.routeComponentMissing;
};

const isMeaningfulHistoryPath = (path?: string): boolean => {
  return isNavigableTargetPath(path);
};

const resolveAuthenticatedTargetPath = (
  fromFullPath?: string
): string | null => {
  if (isMeaningfulHistoryPath(fromFullPath)) {
    return fromFullPath;
  }

  const topMenuPath = getTopMenu()?.path;
  if (topMenuPath && topMenuPath !== "/") {
    return topMenuPath;
  }

  const configuredPath = resolveConfiguredPostLoginPath();
  if (configuredPath && configuredPath !== "/") {
    return configuredPath;
  }

  const rootChildren =
    router.options.routes.find(
      (route) => route.path === "/" && Array.isArray(route.children)
    )?.children || [];
  const firstAvailableChild = rootChildren.find(
    (route) =>
      route?.path &&
      route.path !== "/" &&
      !whiteList.includes(route.path) &&
      !String(route.path).startsWith("/error")
  )?.path;

  return firstAvailableChild || null;
};

const syncMultiTagsByRoute = (to: ToRouteType): void => {
  if (!to?.path || to.path === "/" || to.path.startsWith("/redirect")) {
    return;
  }

  const registeredRoute = router
    .getRoutes()
    .find((route) => route.path === to.path);
  const routeSearchSpace = [
    ...(router.options.routes.find(
      (route) => route.path === "/" && Array.isArray(route.children)
    )?.children || router.options.routes),
  ];
  const matchedRoute = findRouteByPath(to.path, routeSearchSpace);
  const targetRoute =
    registeredRoute ||
    matchedRoute ||
    (to.matched?.[to.matched.length - 1] as RouteRecordRaw);

  if (!targetRoute?.meta?.title) {
    return;
  }

  const targetMeta = {
    ...targetRoute.meta,
    ...(to.meta?.activePath ? { activePath: to.meta.activePath } : {}),
  };

  useMultiTagsStoreHook().handleTags("push", {
    path: targetRoute.path || to.path,
    name: targetRoute.name || to.name,
    meta: targetMeta,
    query: !isAllEmpty(to.query) ? to.query : undefined,
    params: !isAllEmpty(to.params) ? to.params : undefined,
  });
};

router.beforeEach((to: ToRouteType, _from, next) => {
  if (to.meta?.keepAlive) {
    handleAliveRoute(to, "add");
    // 页面整体刷新和点击标签页刷新
    if (_from.name === undefined || _from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }
  NProgress.start();
  const externalLink = isUrl(to?.name as string);
  if (!externalLink) {
    to.matched.some((item) => {
      if (!item.meta.title) return "";
      const Title = getConfig().Title;
      if (Title) {
        //@ts-ignore
        document.title = `${transformI18n(item.meta.i18nKey || item.meta.title)} | ${Title}`;
      } else {
        //@ts-ignore
        document.title = transformI18n(item.meta.i18nKey || item.meta.title);
      }
    });
  }
  if (!getConfig().OpenAuth) {
    console.log("[router] OpenAuth is false, to.path:", to.path, "menusReady:", usePermissionStoreHook().menusReady);
    if (!usePermissionStoreHook().menusReady) {
      if (resolveRouteSourceMode(getConfig()) !== "local-only") {
        console.log("[router] initRouter because not local-only");
        initRouter(to.path)
          .then(() => {
            const targetPath =
              to.path === "/" ? getTopMenu()?.path || to.path : to.path;
            next({
              path: targetPath,
              query: to.query,
              hash: to.hash,
              replace: true,
            });
          })
          .catch(() => {
            usePermissionStoreHook().handleWholeMenus([]);
            next();
          });
        return;
      }

      usePermissionStoreHook().handleWholeMenus([]);
    }
    console.log("[router] next() because OpenAuth is false");
    next();
    return;
  }

  const userInfo = localStorageProxy().getItem<UserResult>(userKey);
  const userRoles = userInfo?.userInfo?.roles || (userInfo as any)?.roles || [];
  /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
  function toCorrectRoute() {
    if (!whiteList.includes(to.path) && to.path !== "/") {
      next();
      return;
    }

    const targetPath = resolveAuthenticatedTargetPath(_from?.fullPath);
    if (!targetPath || targetPath === to.fullPath) {
      next();
      return;
    }

    next({ path: targetPath, replace: true });
  }
  if (Cookies.get(multipleTabsKey) && userInfo) {
    // 无权限跳转403页面
    if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userRoles)) {
      next({ path: "/error/403" });
    }
    // 开启隐藏首页后在浏览器地址栏手动输入首页welcome路由则跳转到404页面
    if (VITE_HIDE_HOME === "true" && to.fullPath === "/home") {
      next({ path: "/error/404" });
    }
    if (_from?.name) {
      // name为超链接
      if (externalLink) {
        openLink(to?.name as string);
        NProgress.done();
      } else {
        toCorrectRoute();
      }
    } else {
      // 刷新
      if (!usePermissionStoreHook().menusReady) {
        initRouter(to.path)
          .then((router: Router) => {
            const shouldRedirectToAuthorizedTarget =
              to.path === "/" || whiteList.includes(to.path);

            if (!useMultiTagsStoreHook().getMultiTagsCache) {
              const { path } = to;
              const routeSearchSpace = [
                ...(router.options.routes.find(
                  (route) => route.path === "/" && Array.isArray(route.children)
                )?.children || router.options.routes),
              ];
              const route = findRouteByPath(path, routeSearchSpace);
              getTopMenu(true);
              // query、params模式路由传参数的标签页不在此处处理
              if (route && route.meta?.title) {
                if (isAllEmpty(route.parentId) && route.meta?.backstage) {
                  // 此处为动态顶级路由（目录）
                  const { path, name, meta } = route.children[0];
                  useMultiTagsStoreHook().handleTags("push", {
                    path,
                    name,
                    meta,
                  });
                } else {
                  const { path, name, meta } = route;
                  useMultiTagsStoreHook().handleTags("push", {
                    path,
                    name,
                    meta,
                  });
                }
              }
            }
            if (shouldRedirectToAuthorizedTarget) {
              const targetPath = resolveAuthenticatedTargetPath(
                _from?.fullPath
              );
              if (targetPath && targetPath !== to.fullPath) {
                next({ path: targetPath, replace: true });
                return;
              }
            }
            // 刷新或地址栏直达时，必须等待动态路由挂载完成后再继续导航，
            // 否则会先命中 pathMatch 导致页面直接跳转到 404。
            next({
              path: to.path,
              query: to.query,
              hash: to.hash,
              replace: true,
            });
          })
          .catch((error) => {
            if (error.status === 403) {
              removeToken();
              next({ path: "/login" });
              return;
            }
            next({ path: "/error/404", replace: true });
          });
        return;
      }
      toCorrectRoute();
    }
  } else {
    if (to.path !== "/login") {
      if (whiteList.indexOf(to.path) !== -1) {
        next();
      } else {
        // removeToken();
        // next({ path: "/login" });
        next();
      }
    } else {
      next();
    }
  }
});

router.afterEach((to) => {
  syncMultiTagsByRoute(to as ToRouteType);
  NProgress.done();
});
export default router;
