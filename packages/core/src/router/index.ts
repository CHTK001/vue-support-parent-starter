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
import yaml from "js-yaml";
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
import { shouldLoadLocalBusinessRoutes } from "./route-mode";

/** 默认菜单图标 */
const DEFAULT_MENU_ICON = "ri:menu-line";

/** 路由白名单 */
const whiteList = ["/login"];
//@ts-ignore
const { VITE_HIDE_HOME } = import.meta.env;

/** 不参与菜单显示的路由集合 */
const remainingRouter: RouteRecordRaw[] = [];

const appendRouteRecord = (
  container: RouteRecordRaw[],
  route: RouteRecordRaw,
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
    container[duplicatedIndex] = route;
    return;
  }

  container.push(route);
};

const resolveModuleRoutes = (module: any): RouteRecordRaw[] => {
  const routes = module?.default;
  if (!routes) return [];
  return Array.isArray(routes) ? routes : [routes];
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

/**
 * 加载不参与菜单的路由模块
 */
const loadRemainingRoutes = (): void => {
  // @ts-ignore
  const noInModules: Record<string, any> = import.meta.glob(
    ["./modules/**/remaining*.ts", "@/router/modules/**/remaining*.ts"],
    { eager: true },
  );

  Object.values(noInModules).forEach((module) => {
    resolveModuleRoutes(module).forEach((route) => {
      appendRouteRecord(remainingRouter, route);
    });
  });
};

loadRemainingRoutes();

/** 原始静态路由（未做任何处理） */
const routes = [];
const routerNameMapping = new Set();
// @ts-ignore
const coreNormalRouteModules: Record<string, any> = import.meta.glob(
  ["./modules/**/*.ts", "!./modules/**/remaining*.ts"],
  { eager: true },
);
// @ts-ignore
const appNormalRouteModules: Record<string, any> = import.meta.glob(
  ["@/router/modules/**/*.ts", "!@/router/modules/**/remaining*.ts"],
  { eager: true },
);
/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
//@ts-ignore
const _createAutoRouter = () => {
  //@ts-ignore
  const modules: Record<string, any> = import.meta.glob(
    ["@/views/**/index.y(a)?ml"],
    {
      eager: true,
      query: "raw",
    },
  );
  //  const modulesVue: Record<string, any> = import.meta.glob(["@/views/**/index.vue"], {
  //   eager: true,
  //  });
  const templateRoutes = [];

  Object.entries(modules).map(([key, value]: any) => {
    const _key = key
      .substring(key.indexOf("views") + 5)
      .replace(/(index.yaml|index.yml)/, "");
    const keys = _key.split("/").filter(Boolean);
    const _itemValue = yaml.load(value.default);
    const meta = _itemValue?.meta || _itemValue || {};
    // 确保有默认图标
    if (!meta.icon) meta.icon = DEFAULT_MENU_ICON;
    // 处理国际化标题
    if (meta.title?.startsWith("$t")) {
      meta.title = transformI18n(
        meta.title.substring(4, meta.title.length - 2),
      );
    }

    const _item = {
      path: `/${keys.join("/")}`,
      name: _itemValue?.name || keys.join("")?.toLowerCase(),
      component: () => import(/* @vite-ignore */ `/src/views${_key}index.vue`),
      meta,
      node: {
        hasParentNode: keys.length > 1,
        parentNodes: keys.slice(0, -1),
      },
    };
    templateRoutes.push(_item);
  });

  //处理临时数组
  const getName = (arr: Array<string>, i: number): Array<string> => {
    const _rs = [];
    for (let j = 0; j <= i; j++) {
      _rs.push(arr[j]);
    }
    return _rs || [];
  };
  templateRoutes.forEach((item) => {
    if (item.node.hasParentNode) {
      for (let i = item.node.parentNodes.length - 1; i >= 0; i--) {
        const _parentNames = getName(item.node.parentNodes, i);
        const _parentName = _parentNames.join("")?.toLowerCase();
        let _parentNode = templateRoutes.find(
          (item) => item.name === _parentName,
        );
        if (!_parentNode) {
          const keys = _parentNames.slice(0, -1);
          let _newName = getName(keys, 0).join("")?.toLowerCase();
          _parentNode = templateRoutes.find((item) => item.name === _newName);
          if (!_parentNode) {
            for (let i = keys.length; i >= 0; i--) {
              _newName = getName(keys, i).join("")?.toLowerCase();
              _parentNode = templateRoutes.find(
                (item) => item.name === _newName,
              );
              if (_parentNode) {
                break;
              }
            }
          }
          if (!_parentNode) {
            return;
          }
          // _parentNode = {
          //   name: _parentName,
          //   path: `/${_parentNames.join('/')}`,
          //   node: {
          //      hasParentNode: keys.length > 0,
          //      parentNodes: keys.slice(0, -1)
          //   },
          //   meta: {
          //     rank: 0,
          //     title: transformI18n(item.meta.title),
          //     icon: item.meta.icon
          //   },
          //   children: []
          // }
          // templateRoutes.push(_parentNode);
        }
        if (routerNameMapping.has(item.name)) {
          return;
        }
        routerNameMapping.add(item.name);
        _parentNode.children = _parentNode.children || [];
        _parentNode.children.push(item);
      }
    }
  });
  templateRoutes.forEach((item) => {
    if (!item.node.hasParentNode) {
      routes.push(item);
    }
  });
};

/**
 * 创建普通路由（基于TS模块）
 */
const appendNormalRoutes = (modules: Record<string, any>) => {
  Object.values(modules).forEach((module) => {
    resolveModuleRoutes(module).forEach((route) => {
      appendRouteRecord(routes, route);
      if (route.name) {
        routerNameMapping.add(String(route.name).toLowerCase());
      }
    });
  });
};

const _createCoreNormalRouter = () => {
  appendNormalRoutes(coreNormalRouteModules);
};

const _createAppNormalRouter = () => {
  appendNormalRoutes(appNormalRouteModules);
};

/**
 * 根据配置初始化路由模式
 */
const initRouterMode = (): void => {
  const config = getConfig();
  const routerModule = config.RouterModule;
  const loadLocalBusinessRoutes = shouldLoadLocalBusinessRoutes(config);

  if (config.AutoRouter || routerModule === "AUTO") {
    if (loadLocalBusinessRoutes) {
      _createAutoRouter();
    }
  } else if (routerModule === "MIX") {
    if (loadLocalBusinessRoutes) {
      _createAutoRouter();
    }
    _createCoreNormalRouter();
    if (loadLocalBusinessRoutes) {
      _createAppNormalRouter();
    }
  } else {
    _createCoreNormalRouter();
    if (loadLocalBusinessRoutes) {
      _createAppNormalRouter();
    }
  }
};

initRouterMode();

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity)))),
);

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteComponent> = ascending(
  routes.flat(Infinity),
).concat(...remainingRouter);

/** 不参与菜单的路由 */
export const remainingPaths = remainingRouter
  .map((route) => {
    if (!route) {
      return;
    }
    return route.path;
  })
  .filter(Boolean);
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

/** 重置路由 */
export function resetRouter() {
  router.getRoutes().forEach((route) => {
    const { name, meta } = route;
    if (name && router.hasRoute(name) && meta?.backstage) {
      router.removeRoute(name);
      router.options.routes = formatTwoStageRoutes(
        formatFlatteningRoutes(
          buildHierarchyTree(ascending(routes.flat(Infinity))),
        ),
      );
    }
  });
  usePermissionStoreHook().clearAllCachePage();
}

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
    next();
    return;
  }

  const userInfo = localStorageProxy().getItem<UserResult>(userKey);
  const userRoles = userInfo?.userInfo?.roles || (userInfo as any)?.roles || [];
  /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
  function toCorrectRoute() {
    whiteList.includes(to.fullPath) ? next(_from.fullPath) : next();
  }
  if (Cookies.get(multipleTabsKey) && userInfo) {
    // 无权限跳转403页面
    if (
      to.meta?.roles &&
      !isOneOfArray(to.meta?.roles, userRoles)
    ) {
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
      if (
        usePermissionStoreHook().wholeMenus.length === 0 &&
        to.path !== "/login"
      ) {
        initRouter(to.path)
          .then((router: Router) => {
            if (!useMultiTagsStoreHook().getMultiTagsCache) {
              const { path } = to;
              const routeSearchSpace =
                router.options.routes.find(
                  route => route.path === "/" && Array.isArray(route.children),
                )?.children || router.options.routes;
              const route = findRouteByPath(
                path,
                routeSearchSpace,
              );
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
        removeToken();
        next({ path: "/login" });
      }
    } else {
      next();
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});
export default router;
