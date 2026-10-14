/**
 * 菜单解析器注册表（@repo/pinia）
 *
 * auth store 的 listRouters 需要「菜单 → 路由」转换（组件解析依赖主题页面 glob）。
 * 各主题（如 koi）注册自己的解析器（注入 views glob + 布局组件 + 404），
 * auth store 无需关心主题实现。
 */
import type { MenuRouteResolver } from "@repo/core";

const MENU_RESOLVER_KEY = "__repo_pinia_menu_resolver";

function getRegistry(): { [MENU_RESOLVER_KEY]?: MenuRouteResolver | null } {
  return globalThis as { [MENU_RESOLVER_KEY]?: MenuRouteResolver | null };
}

/** 注册菜单解析器（主题框架顶层调用） */
export function registerMenuResolver(resolver: MenuRouteResolver): void {
  getRegistry()[MENU_RESOLVER_KEY] = resolver;
}

/** 获取菜单解析器；未注册时抛错 */
export function getMenuResolver(): MenuRouteResolver {
  const resolver = getRegistry()[MENU_RESOLVER_KEY];
  if (!resolver) {
    throw new Error("[auth] 菜单解析器未注册，请调用 registerMenuResolver()");
  }
  return resolver;
}

/** 是否已注册 */
export function hasMenuResolver(): boolean {
  return !!getRegistry()[MENU_RESOLVER_KEY];
}
