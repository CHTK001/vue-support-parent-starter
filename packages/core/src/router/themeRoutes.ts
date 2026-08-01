/**
 * 主题路由解析（core）—— 按 themeId 收敛 home/login 基础路由
 *
 * core 不静态依赖 @repo/theme（避免循环依赖），通过运行时 import() 懒加载：
 *  - getConfig().other.themeId 决定主题
 *  - 业务已提供 layoutRoutes → 使用业务的，不追加
 *  - 业务未提供 → 调 @repo/theme 的 getThemeRoutes(themeId) 取主题组件，按固定格式生成
 */
import { getConfig } from "@repo/config";
import type { Component } from "vue";
import type { RouteConfigsTable } from "./types";

/** 主题基础路由组件（与 @repo/theme 的 ThemeBaseComponents 一致） */
export interface ThemeBaseComponents {
  layout: Component;
  login: Component;
  home: Component;
}

/** 路由是否已包含 login / layout / home 关键路由 */
export function hasBaseRoutes(routes: RouteConfigsTable[]): boolean {
  const names = new Set(routes.map((r) => r.name));
  return (
    names.has("login") ||
    names.has("layout") ||
    names.has("homePage") ||
    names.has("home")
  );
}

/**
 * 按固定格式生成基础路由（login + layout 包 home + redirect）
 * @param components 主题页面组件
 */
export function buildBaseRoutes(
  components: ThemeBaseComponents
): RouteConfigsTable[] {
  const route = getConfig().route;
  const loginPath = route.loginPath || "/login";
  const homePath = route.homePath || "/home";

  return [
    // 登录页
    {
      path: loginPath,
      name: "login",
      component: components.login,
      meta: { title: "login" },
    },
    // 布局：登录后主框架，redirect 到首页
    {
      path: "/",
      name: "layout",
      component: components.layout,
      redirect: homePath,
      children: [
        {
          path: homePath,
          name: "home",
          component: components.home,
          meta: { title: "home", affix: true },
        },
      ],
    },
  ];
}

/** 按 themeId 从 @repo/theme 解析主题基础路由组件（运行时懒加载） */
export async function resolveThemeBaseRoutes(
  themeId: string
): Promise<ThemeBaseComponents | undefined> {
  try {
    // core 不静态依赖 @repo/theme（避免循环）；运行时动态 import 解析
    // @ts-expect-error 动态加载：core 不声明对 @repo/theme 的依赖
    const theme = (await import("@repo/theme")) as {
      getThemeRoutes?: (id: string) => ThemeBaseComponents | undefined;
    };
    return theme.getThemeRoutes?.(themeId);
  } catch (error) {
    console.warn("[router] 主题路由解析失败", error);
    return undefined;
  }
}
