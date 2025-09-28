// import "@/utils/sso";
import { isAllEmpty, isUrl, openLink } from "@pureadmin/utils";
import { getConfig, multipleTabsKey, transformI18n, userKey } from "@repo/config";
import type { UserResult } from "@repo/core";
import { removeToken, useMultiTagsStoreHook } from "@repo/core";
import { buildHierarchyTree, localStorageProxy, NProgress, splitRemainingLeaves } from "@repo/utils";
import Cookies from "js-cookie";
import yaml from "js-yaml";
import { createRouter, type RouteComponent, type Router, type RouteRecordRaw } from "vue-router";
import { usePermissionStoreHook } from "../store/modules/PermissionStore";
import { ascending, findRouteByPath, formatFlatteningRoutes, formatTwoStageRoutes, getHistoryMode, getTopMenu, handleAliveRoute, initRouter, isOneOfArray } from "./utils";

/** 路由白名单 */
const whiteList = ["/login"];
//@ts-ignore
const { VITE_HIDE_HOME } = import.meta.env;

const remainingRouter = [];
//@ts-ignore
const noInModules: Record<string, any> = import.meta.glob(["./modules/**/remaining*.ts", "@/router/**/remaining*.ts"], {
  eager: true,
});
Object.keys(noInModules || {}).forEach((key) => {
  const _value = noInModules[key].default;
  if (!_value) {
    return;
  }
  if (_value instanceof Array) {
    _value.forEach((it) => remainingRouter.push(it));
    return;
  }
  remainingRouter.push(_value);
});

/** 原始静态路由（未做任何处理） */
const routes = [];
const routerNameMapping = new Set();
/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
//@ts-ignore
const _createAutoRouter = () => {
  //@ts-ignore
  const modules: Record<string, any> = import.meta.glob(["@/views/**/index.y(a)?ml"], {
    eager: true,
    query: "raw",
  });
  //  const modulesVue: Record<string, any> = import.meta.glob(["@/views/**/index.vue"], {
  //   eager: true,
  //  });
  const templateRoutes = [];

  Object.entries(modules).map(([key, value]: any) => {
    const _key = key.substring(key.indexOf("views") + 5).replace(/(index.yaml|index.yml)/, "");
    const keys = _key.split("/").filter(Boolean);
    const _itemValue = yaml.load(value.default);
    const _item = {
      path: `/${keys.join("/")}`,
      name: _itemValue?.name || keys.join("")?.toLowerCase(),
      component: () => import(/* @vite-ignore */ `/src/views${_key}index.vue`),
      meta: _itemValue?.meta || _itemValue,
      node: {
        hasParentNode: keys.length > 1,
        parentNodes: keys.slice(0, -1),
      },
    };
    if (_item.meta.title?.startsWith("$t")) {
      _item.meta.title = transformI18n(_item.meta.title.substring(4, _item.meta.title.length - 2));
    }
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
        let _parentNode = templateRoutes.find((item) => item.name === _parentName);
        if (!_parentNode) {
          const keys = _parentNames.slice(0, -1);
          let _newName = getName(keys, 0).join("")?.toLowerCase();
          _parentNode = templateRoutes.find((item) => item.name === _newName);
          if (!_parentNode) {
            for (let i = keys.length; i >= 0; i--) {
              _newName = getName(keys, i).join("")?.toLowerCase();
              _parentNode = templateRoutes.find((item) => item.name === _newName);
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

const _createNormalRouter = () => {
  //@ts-ignore
  const modules: Record<string, any> = import.meta.glob(["./modules/**/*.ts", "!./modules/**/remaining*.ts", "@/router/**/*.ts", "@/router/*.ts", "!@/router/**/remaining*.ts"], {
    eager: true,
  });

  Object.keys(modules).forEach((key) => {
    const route = modules[key].default;
    routes.push(route);
    // const { removed, remaining } = splitRemainingLeaves(route);
    // routes.push(remaining);
    // remainingRouter.push(...removed);
    routerNameMapping.add(route.name?.toLowerCase());
  });
};

if (getConfig().AutoRouter || getConfig().RouterModule == "AUTO" || false) {
  _createAutoRouter();
} else if (getConfig().RouterModule == "MIX") {
  _createAutoRouter();
  _createNormalRouter();
} else {
  _createNormalRouter();
}

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity)))));

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteComponent> = ascending(routes.flat(Infinity)).concat(...remainingRouter);

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
    return new Promise((resolve) => {
      if (savedPosition) {
        return savedPosition;
      } else {
        if (from.meta.saveSrollTop) {
          //@ts-ignore
          const top: number =
            //@ts-ignore
            document.documentElement.scrollTop || document.body.scrollTop;
          resolve({ left: 0, top });
        }
      }
    });
  },
});

/** 重置路由 */
export function resetRouter() {
  router.getRoutes().forEach((route) => {
    const { name, meta } = route;
    if (name && router.hasRoute(name) && meta?.backstage) {
      router.removeRoute(name);
      router.options.routes = formatTwoStageRoutes(formatFlatteningRoutes(buildHierarchyTree(ascending(routes.flat(Infinity)))));
    }
  });
  usePermissionStoreHook().clearAllCachePage();
}

router.beforeEach((to: ToRouteType, _from, next) => {
  // 确保在路由切换时保持深色主题
  try {
    const storage = localStorageProxy().getItem("layout");
    if (storage && storage.darkMode) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    console.warn("Failed to set dark theme from localStorage:", e);
  }
  
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
  /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
  function toCorrectRoute() {
    whiteList.includes(to.fullPath) ? next(_from.fullPath) : next();
  }
  if (Cookies.get(multipleTabsKey) && userInfo) {
    // 无权限跳转403页面
    if (to.meta?.roles && !isOneOfArray(to.meta?.roles, userInfo?.userInfo?.roles)) {
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
      if (usePermissionStoreHook().wholeMenus.length === 0 && to.path !== "/login") {
        initRouter()
          .then((router: Router) => {
            if (!useMultiTagsStoreHook().getMultiTagsCache) {
              const { path } = to;
              const route = findRouteByPath(path, router.options.routes[0].children);
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
            // 确保动态路由完全加入路由列表并且不影响静态路由（注意：动态路由刷新时router.beforeEach可能会触发两次，第一次触发动态路由还未完全添加，第二次动态路由才完全添加到路由列表，如果需要在router.beforeEach做一些判断可以在to.name存在的条件下去判断，这样就只会触发一次）
            if (isAllEmpty(to.name)) router.push(to.fullPath);
          })
          .catch((error) => {
            if (error.status === 403) {
              removeToken();
              next({ path: "/login" });
              return;
            }
          });
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
  // 确保在路由切换完成后保持深色主题
  try {
    const storage = localStorageProxy().getItem("layout");
    if (storage && storage.darkMode) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    console.warn("Failed to set dark theme from localStorage:", e);
  }
  
  NProgress.done();
});
export default router;
