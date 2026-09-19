/**
 * 动态路由（core）—— 把扁平菜单注册到布局 + 强制重登
 *
 * 职责：
 *   - registerDynamicRoutes：把扁平菜单 addRoute 到 layout（带 allowPrefixes 白名单过滤）
 *   - isDynamicRoutesMissing：判断动态路由是否缺失（登出/重置后）
 *   - forceRelogin：清 token / 重置权限，回登录页
 *   - initDynamicRoutes：初始化动态路由（防并发，缓存 Promise）
 *
 * 数据源（菜单列表 / token 重置 / 提示）通过参数注入，core 不依赖任何具体主题。
 */
import type { Router } from "vue-router";
import { getConfig } from "@repo/config";
import { log } from "@repo/utils";

/** 菜单项（兼容 koi 后端菜单字段：name/path 等） */
export interface DynamicMenuItem {
  name?: string | symbol;
  path?: string;
  component?: unknown;
  children?: DynamicMenuItem[];
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

/** 初始化动态路由的上下文（由主题/应用注入数据源） */
export interface DynamicRouterContext {
  /** 获取扁平菜单列表（通常来自 auth store） */
  getMenuList: () => DynamicMenuItem[];
  /** 菜单为空时是否重新拉取（可选，默认 false） */
  loadMenus?: () => Promise<unknown>;
  /** 强制重登：清 token / 重置权限（默认不处理，由主题注入） */
  onForceRelogin?: (message?: string) => Promise<void> | void;
  /** 提示消息（默认 console.warn） */
  notify?: (message: string, type?: "warning" | "error") => void;
}

/**
 * 将扁平菜单注册到 layout 子路由
 * @param router 路由实例
 * @param menuList 扁平菜单
 * @param layoutName 挂载的父路由名（默认 layout）
 * @returns 新增路由数
 */
export function registerDynamicRoutes(
  router: Router,
  menuList: DynamicMenuItem[],
  layoutName = "layout"
): number {
  const allowedPrefixes = getConfig().route.allowPrefixes ?? [];
  const filteredMenuList =
    allowedPrefixes.length > 0
      ? menuList.filter((item) => {
          const path = String(item?.path ?? "").trim();
          return allowedPrefixes.some(
            (prefix) => path === prefix || path.startsWith(`${prefix}/`)
          );
        })
      : menuList;

  let addedCount = 0;
  filteredMenuList.forEach((item) => {
    if (!item?.name) {
      log.warn(`[route] 菜单缺少 name，已跳过`, item);
      return;
    }
    if (router.hasRoute(item.name)) {
      log.warn(
        `[route] 菜单 name 与已有路由重名，已跳过注册（点击会 404）: name=${String(item.name)} path=${String(item.path ?? "")}`
      );
      return;
    }
    router.addRoute(layoutName, item as never);
    addedCount += 1;
  });
  return addedCount;
}

/** 菜单已在 store，但路由表里没有对应 name（如登出/resetRouter 后未重新注册） */
export function isDynamicRoutesMissing(
  router: Router,
  menuList: DynamicMenuItem[]
): boolean {
  if (!menuList?.length) {
    return true;
  }
  return menuList.some((menu) => menu?.name && !router.hasRoute(menu.name));
}

/** 强制重登：清 token / 重置权限，回登录页 */
export async function forceRelogin(
  router: Router,
  context: DynamicRouterContext,
  message?: string
): Promise<void> {
  if (context.onForceRelogin) {
    await context.onForceRelogin(message);
  }
  await router.replace(getConfig().route.loginPath);
}

/** 动态路由初始化 Promise 缓存（防并发） */
let initPromise: Promise<void> | null = null;

/** 初始化动态路由（拉取菜单 + 注册到 layout），router 与数据源由调用方注入 */
export async function initDynamicRoutes(
  router: Router,
  context: DynamicRouterContext
): Promise<void> {
  if (initPromise) {
    return initPromise;
  }
  initPromise = doInitDynamicRoutes(router, context).catch(() => {
    initPromise = null;
  });
  return initPromise;
}

async function doInitDynamicRoutes(router: Router, context: DynamicRouterContext): Promise<void> {
  const { getMenuList, loadMenus, onForceRelogin, notify } = context;
  const warn = notify ?? ((m: string) => log.warn(`logger`, m));
  const err = notify ?? ((m: string) => log.error(`logger`, m));

  try {
    let menuList = getMenuList();
    if (!menuList?.length && loadMenus) {
      await loadMenus();
      menuList = getMenuList();
    }

    if (!menuList?.length) {
      await forceRelogin(router, context, "未获取到菜单权限，请重新登录");
      throw new Error("当前账号无菜单权限");
    }

    const addedCount = registerDynamicRoutes(router, menuList);

    if (addedCount === 0 && isDynamicRoutesMissing(router, menuList)) {
      const conflictOrInvalid = menuList.filter(
        (menu) => menu?.name && !router.hasRoute(menu.name)
      );
      log.error(`[route] 动态路由注册失败`, conflictOrInvalid);
      await forceRelogin(router, context, "路由加载失败，请重新登录");
      throw new Error("动态路由注册失败");
    }
  } catch (error) {
    log.error(`logger`, error);
    if (onForceRelogin) {
      await forceRelogin(router, context);
    }
    throw error;
  }
}
