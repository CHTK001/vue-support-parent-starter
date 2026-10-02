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
  generateRoutes: (data: any[], parentId: any, opts?: MenuRouteBuildOptions) => any[];
  /** 生成扁平一级路由 */
  generateFlattenRoutes: (data: any[]) => any[];
}

/** 树形路由构建选项 */
export interface MenuRouteBuildOptions {
  /**
   * 仅生成侧边栏可见菜单：各级都过滤隐藏/脱离菜单控制的行，并应用目录显示规则
   * - 目录（menuType=目录）没有任何可见子菜单 → 整个菜单不显示
   * - 目录只有一个可见子菜单且未开启「显示父级」→ 子菜单直接显示
   */
  visibleOnly?: boolean;
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
  // remind = true 表示该行脱离菜单控制：只注册路由，不被 router 当作菜单处理（缺省 false）
  const _remind = (i: any) => {
    const v = i.remind ?? i.meta?.remind;
    return v === true || v === 1 || v === "1";
  };
  // 菜单是否应出现在侧边栏：脱离菜单控制（remind）与隐藏（isVisible）在各级都生效
  const _menuVisible = (i: any) => {
    if (_remind(i)) {
      return false;
    }
    const v = _isVisible(i);
    if (v == null) {
      return true;
    }
    return v == 1 || v === true;
  };
  // 单子菜单时是否显示父级菜单：sys_menu_show_parent=0 表示显示父级；1/未配置表示隐藏父级（子菜单直接显示）
  const _showParent = (i: any) => {
    const v = i.sysMenuShowParent ?? i.showParent ?? i.meta?.showParent;
    return v === 0 || v === "0" ? 1 : 0;
  };
  // 菜单位置：standard（侧边栏）/ top（顶栏按钮）
  const _position = (i: any) => ((i.sysMenuPosition ?? i.position ?? i.meta?.position) === "top" ? "top" : "standard");
  // 节点自身是否是可打开的页面：component 为空或只是布局占位时视为「只有父菜单」
  const _hasPage = (i: any) => {
    const c = i?.component;
    if (typeof c !== "string") {
      return c != null;
    }
    const v = c.trim();
    return v !== "" && v !== "Layout" && v !== "ParentView" && v !== "layout" && v !== "parentView";
  };
  // 菜单徽标：兼容短字段名(isTag) 与 sysMenu* 命名；isTag 仅在明确为 1/true 时开启
  const _isTag = (i: any) => {
    const v = i.isTag ?? i.sysMenuIsTag ?? i.meta?.isTag;
    return v === 1 || v === "1" || v === true ? 1 : 0;
  };
  const _tagType = (i: any) =>
    i.tagType ?? i.sysMenuTagType ?? i.meta?.tagType;
  const _tagName = (i: any) =>
    i.tagName ?? i.sysMenuTagName ?? i.meta?.tagName;

  /**
   * 节点是否具备被渲染的最小条件：必须有可用的 path 与 名称。
   *
   * <p>为什么需要它：下面建路由时有一行
   * `path: item.path.startsWith("/") ? item.path : "/" + item.path`，
   * 一旦后端下发的某个节点 path 为 undefined，这里就会抛 TypeError，
   * <b>整个 generateRoutes 中断</b>——不只是坏节点不显示，
   * 而是同一次返回里的所有正常菜单（实测 26 条进、0 条出）。</p>
   *
   * <p>真实触发路径（2026-10-01）：POST /v2/menu/save 当时没有任何必填校验，
   * 一次空体请求就 INSERT 出标题/路径/组件/名称全为 NULL 的菜单行。
   * admin 是唯一走「全部菜单」分支的角色（SysMenuServiceImpl 里
   * `isSuperAdmin(roles) || isBuiltinAdmin(username)`），
   * 因此只有 admin 会拿到这些脏节点 —— 表现为**最高权限账号侧栏一个菜单都不显示**，
   * 而普通用户因为接口返回空、回落到静态路由反而正常。</p>
   *
   * <p>这里只做「跳过坏节点」：一条脏数据不该让整个系统不可用。
   * 根因（save 缺必填校验）已在服务端补上，此处是前端侧的兜底。</p>
   */
  const _isRenderableNode = (i: any): boolean => {
    if (!i || typeof i !== "object") return false;
    const path = i.path ?? i.sysMenuPath;
    if (typeof path !== "string" || path.trim() === "") return false;
    const name = _menuName(i);
    if (name === undefined || name === null || String(name).trim() === "") return false;
    return true;
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
  function generateRoutes(data: any[], parentId: any, opts?: MenuRouteBuildOptions): any[] {
    // 扁平化：API 可能返回嵌套 children，也可能返回扁平数组，两种都兼容
    const flat = flattenMenu(data);
    // visibleOnly：侧边栏模式，过滤隐藏/脱离菜单控制的行并应用目录显示规则；
    // 面包屑模式（缺省）保持完整层级，便于定位隐藏页面
    const visibleOnly = opts?.visibleOnly === true;
    const routeList: any[] = [];
    for (const item of flat) {
      if (item && String(_parentId(item)) === String(parentId)) {
        if (visibleOnly && !_menuVisible(item)) {
          continue;
        }
        // 缺 path / 名称的脏节点直接跳过：不解引用 item.path，避免抛错拖垮整棵菜单
        if (!_isRenderableNode(item)) {
          log.warn(`[route] 菜单节点缺少 path 或名称，已跳过: ${JSON.stringify(_menuId(item))}`);
          continue;
        }
        const isDirectory = _menuType(item) == menuTypeValue;
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
            remind: _remind(item),
            isKeepAlive: item.isKeepAlive ?? item.meta?.keepAlive,
            linkUrl: item.linkUrl,
            isTag: _isTag(item),
            tagType: _tagType(item),
            tagName: _tagName(item),
            isAffix: item.isAffix,
            activeMenu: item.activeMenu,
            position: _position(item),
            showParent: _showParent(item),
            isDirectory,
          },
        };
        if (_menuType(item) == menuTypeValue) {
          route.redirect = `${item?.redirect || item.meta?.redirect}` || HOME_URL;
        }
        const children = generateRoutes(flat, _menuId(item), opts);
        // 规则 2：没有任何可见子菜单，且自身也没有可用页面组件（纯父菜单/空目录）→ 整个菜单不显示
        if (visibleOnly && children.length === 0 && !_hasPage(item)) {
          continue;
        }
        if (children.length > 0) {
          route.children = children;
        }
        // 规则 2.1：目录只有一个可见子菜单且未开启「显示父级」→ 子菜单直接显示，父级不显示
        if (visibleOnly && isDirectory && children.length === 1 && _showParent(item) !== 1) {
          routeList.push(children[0]);
          continue;
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
      // 同 generateRoutes：脏节点不解引用 item.path
      if (!_isRenderableNode(item)) {
        log.warn(`[route] 菜单节点缺少 path 或名称，已跳过(扁平): ${JSON.stringify(_menuId(item))}`);
        continue;
      }
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
          remind: _remind(item),
          isKeepAlive: item.isKeepAlive ?? item.meta?.keepAlive,
          linkUrl: item.linkUrl,
          isTag: _isTag(item),
          tagType: _tagType(item),
          tagName: _tagName(item),
          isAffix: item.isAffix,
          activeMenu: item.activeMenu,
          position: _position(item),
          showParent: _showParent(item),
          isDirectory: _menuType(item) == menuTypeValue,
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
