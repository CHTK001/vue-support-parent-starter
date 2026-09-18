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
import { getConfig, resolveMenuDefaultIcon } from "@repo/config";
import { log } from "@repo/utils";

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
      log.warn(`[route] 页面加载失败，已使用兜底页: ${moduleKey}`, error);
      return notFound;
    });
}

// ==================== 扩展视图模块注册表 ====================
// 各页面模块（@pages/system / @pages/message 等）把「后端菜单 component → 本地页面」
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

// 字段归一化：兼容两种后端字段命名（menuId/parentId/menuName/menuType/icon/isVisible vs sysMenuId/sysMenuPid/meta.title/sysMenuType/meta.icon/meta.showLink）
  const _menuId = (i: any) => i.menuId ?? i.sysMenuId;
  const _parentId = (i: any) => i.parentId ?? i.sysMenuPid;
  const _menuName = (i: any) => i.menuName ?? i.meta?.title ?? i.name;
  // 菜单缺省图标：后端未配置 icon 时兜底（可在 app.yaml 的 menuConfig.defaultIcon 覆盖）
  const _menuIcon = (i: any) => i.icon || i.meta?.icon || resolveMenuDefaultIcon();
  const _menuType = (i: any) => i.menuType ?? i.sysMenuType;
  const _isVisible = (i: any) => {
    if (i.isVisible !== undefined) return i.isVisible;
    if (i.meta?.isVisible !== undefined) return i.meta.isVisible;
    return i.meta?.showLink ?? true;
  };

  // 扁平化：API 可能返回嵌套 children 树，也可能返回扁平数组，两种都兼容
  function flattenMenu(items: any[]): any[] {
    const result: any[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      if (item) {
        const id = String(_menuId(item));
        if (!seen.has(id)) {
          seen.add(id);
          result.push(item);
        }
      }
      if (Array.isArray(item?.children)) {
        const sub = flattenMenu(item.children);
        for (const child of sub) {
          const id = String(_menuId(child));
          if (!seen.has(id)) {
            seen.add(id);
            result.push(child);
          }
        }
      }
    }
    return result;
  }

  function resolveRouteComponent(
    componentTemplate: string | undefined
  ): unknown {
    if (!componentTemplate) {
      return layoutComponent;
    }
    const normalizedComponent = componentTemplate.startsWith("/")
      ? componentTemplate.slice(1)
      : componentTemplate;
    const moduleKey = `views/${normalizedComponent}.vue`;
    const loader =
      viewModules[moduleKey] ?? extraViewModules.get(moduleKey);
    if (loader) return wrapPageLoader(loader, moduleKey, notFoundComponent);

    // 回退策略：按尾部路径段匹配（如后端 component="/manage/feedback/index" 匹配 "views/system/feedback/index.vue"）
    const parts = normalizedComponent.split("/");
    if (parts.length >= 2) {
      const suffix = parts.slice(-2).join("/");
      for (const [key, mod] of extraViewModules) {
        if (key.endsWith(suffix + ".vue")) {
          log.warn(`[route] 组件路径回退匹配: ${moduleKey} -> ${key}`);
          return wrapPageLoader(mod, key, notFoundComponent);
        }
      }
      for (const key of Object.keys(viewModules)) {
        if (key.endsWith(suffix + ".vue")) {
          log.warn(`[route] 组件路径回退匹配: ${moduleKey} -> ${key}`);
          return wrapPageLoader(viewModules[key], key, notFoundComponent);
        }
      }
    }

    log.warn(`[route] 页面不存在，已使用兜底页: ${moduleKey}`);
    return notFoundComponent;
  }

  /** 递归生成树形路由 */
  function generateRoutes(data: any[], parentId: any): any[] {
    // 扁平化：API 可能返回嵌套 children，也可能返回扁平数组，两种都兼容
    const flat = flattenMenu(data);
    const routeList: any[] = [];
    for (const item of flat) {
      if (item && String(_parentId(item)) === String(parentId)) {
        const componentTemplate = item?.component;
        const route: any = {
          path: item.path.startsWith("/") ? item.path : `/${item.path}`,
          name: `${item.name}`,
          component: resolveRouteComponent(componentTemplate),
          meta: {
            menuId: String(_menuId(item)),
            title: String(_menuName(item)),
            icon: _menuIcon(item),
            isVisible: _isVisible(item),
            isKeepAlive: item.isKeepAlive ?? item.meta?.keepAlive,
            linkUrl: item.linkUrl,
            isTag: item.isTag,
            isAffix: item.isAffix,
            activeMenu: item.activeMenu,
          },
        };
        if (_menuType(item) == menuTypeValue) {
          route.redirect = `${item?.redirect || item.meta?.redirect}` || HOME_URL;
        }
        const children = generateRoutes(flat, _menuId(item));
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
    const flat = flattenMenu(data);
    const routes: any[] = [];
    for (const item of flat) {
      const componentTemplate = item?.component;
      const route: any = {
        path: item.path.startsWith("/") ? item.path : `/${item.path}`,
        name: `${item.name}`,
        component: resolveRouteComponent(componentTemplate),
        meta: {
          parentId: String(_parentId(item)),
          menuId: String(_menuId(item)),
          title: _menuName(item),
          icon: _menuIcon(item),
          isVisible: _isVisible(item),
          isKeepAlive: item.isKeepAlive ?? item.meta?.keepAlive,
          linkUrl: item.linkUrl,
          isTag: item.isTag,
          isAffix: item.isAffix,
          activeMenu: item.activeMenu,
        },
      };
      if (_menuType(item) == menuTypeValue) {
        route.redirect = `${item?.redirect || item.meta?.redirect}` || HOME_URL;
      }
      routes.push(route);
    }
    return routes;
  }

  return { generateRoutes, generateFlattenRoutes };
}
