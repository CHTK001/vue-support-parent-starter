/**
 * 菜单 → 路由转换（core）
 *
 * 把后端菜单数据（含 component 字段）解析成 vue-router 路由。
 * 组件解析（viewModules glob + layout 组件 + 404 组件）由调用方注入，core 不依赖具体主题页面。
 *
 * 用法：
 *   const resolver = createMenuRouteResolver({
 *     viewModules: import.meta.glob("..\/views\/**\/*.vue"),
 *     layoutComponent: Layout,
 *     notFoundComponent: () => import(".../404.vue"),
 *   });
 *   resolver.generateRoutes(menuData, 0);       // 递归生成树
 *   resolver.generateFlattenRoutes(menuData);    // 扁平一级路由
 */
import { getConfig } from "@repo/config";

/** 视图模块（vue-router 懒加载组件） */
export type ViewModule = () => Promise<unknown>;

/** 菜单 → 路由解析器配置 */
export interface MenuRouteResolverOptions {
  /** 视图模块映射（key 形如 `views/xxx.vue`，value 为懒加载 loader） */
  viewModules: Record<string, ViewModule>;
  /** 无 component 时的默认布局组件 */
  layoutComponent?: unknown;
  /** 页面不存在 / 加载失败时的兜底组件（如 404 页） */
  notFoundComponent?: unknown;
  /** 菜单目录类型（menuType==="1" 时为目录，加 redirect） */
  menuTypeValue?: string;
}

/** 菜单 → 路由解析器 */
export interface MenuRouteResolver {
  /** 递归生成树形路由 */
  generateRoutes: (data: any[], parentId: any) => any[];
  /** 生成扁平一级路由 */
  generateFlattenRoutes: (data: any[]) => any[];
}

/** 动态 import 失败时回退兜底组件 */
function wrapPageLoader(
  loader: ViewModule,
  moduleKey: string,
  notFound: unknown
): ViewModule {
  return () =>
    loader().catch((error: unknown) => {
      console.warn(`[route] 页面加载失败，已使用兜底页: ${moduleKey}`, error);
      return notFound;
    });
}

// ==================== 扩展视图模块注册表 ====================
// 各页面模块（@repo/system / @repo/message 等）把「后端菜单 component → 本地页面」
// 以懒加载（异步组件）形式注册进来，createMenuRouteResolver 解析时合并查找。
// 这样 main.ts 无需手动传路由，路由全部懒加载，不预载全部页面。

/** 已注册的扩展视图模块（key 形如 `views/system/user/index.vue`） */
const extraViewModules = new Map<string, ViewModule>();

/**
 * 注册菜单 → 视图映射（懒加载）。
 *
 * @param modules key 为 `views/{component}.vue`（与后端菜单 component 字段对应），
 * value 为 `() => import(...)` 懒加载 loader。
 * @example
 * registerMenuViewModules({
 *   "views/system/user/index.vue": () => import("./views/UserManage.vue"),
 * });
 */
export function registerMenuViewModules(modules: Record<string, ViewModule>): void {
  Object.entries(modules).forEach(([key, loader]) => {
    if (loader) {
      extraViewModules.set(key, loader);
    }
  });
}

/** 创建菜单 → 路由解析器 */
export function createMenuRouteResolver(
  options: MenuRouteResolverOptions
): MenuRouteResolver {
  const { viewModules, layoutComponent, notFoundComponent, menuTypeValue = "1" } = options;
  const HOME_URL = getConfig().route.homePath || "/home";

  /** 解析后端菜单 component 字段；文件不存在或加载失败时回退兜底组件 */
  function resolveRouteComponent(
    componentTemplate: string | undefined
  ): unknown {
    if (!componentTemplate) {
      return layoutComponent;
    }
    const moduleKey = `views/${componentTemplate}.vue`;
    const loader =
      viewModules[moduleKey] ?? extraViewModules.get(moduleKey);
    if (!loader) {
      console.warn(`[route] 页面不存在，已使用兜底页: ${moduleKey}`);
      return notFoundComponent;
    }
    return wrapPageLoader(loader, moduleKey, notFoundComponent);
  }

  /** 递归生成树形路由 */
  function generateRoutes(data: any[], parentId: any): any[] {
    const routeList: any[] = [];
    for (const item of data) {
      if (item && String(item.parentId) === String(parentId)) {
        const componentTemplate = item?.component;
        const route: any = {
          path: item.path.startsWith("/") ? item.path : `/${item.path}`,
          name: `${item.name}`,
          component: resolveRouteComponent(componentTemplate),
          meta: {
            menuId: String(item.menuId),
            title: String(item?.menuName),
            icon: item?.icon,
            isVisible: item?.isVisible,
            isKeepAlive: item?.isKeepAlive,
            linkUrl: item?.linkUrl,
            isTag: item?.isTag,
            isAffix: item?.isAffix,
            activeMenu: item?.activeMenu,
          },
        };
        if (item.menuType == menuTypeValue) {
          route.redirect = `${item?.redirect}` || HOME_URL;
        }
        const children = generateRoutes(data, item.menuId);
        if (children.length > 0) {
          route.children = children;
        }
        routeList.push(route);
      }
    }
    return routeList;
  }

  /** 生成扁平一级路由 */
  function generateFlattenRoutes(data: any[]): any[] {
    const routes: any[] = [];
    for (const item of data) {
      const componentTemplate = item?.component;
      const route: any = {
        path: item.path.startsWith("/") ? item.path : `/${item.path}`,
        name: `${item.name}`,
        component: resolveRouteComponent(componentTemplate),
        meta: {
          parentId: String(item.parentId),
          menuId: String(item.menuId),
          title: item.menuName,
          icon: item?.icon,
          isVisible: item?.isVisible,
          isKeepAlive: item?.isKeepAlive,
          linkUrl: item?.linkUrl,
          isTag: item?.isTag,
          isAffix: item?.isAffix,
          activeMenu: item?.activeMenu,
        },
      };
      if (item.menuType == menuTypeValue) {
        route.redirect = `${item?.redirect}` || HOME_URL;
      }
      routes.push(route);
    }
    return routes;
  }

  return { generateRoutes, generateFlattenRoutes };
}
