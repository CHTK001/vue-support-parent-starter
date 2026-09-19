/**
 * 主题路由桥接（core）—— 按 themeId 收敛 home/login/error 基础路由
 *
 * core 不静态依赖 @repo/theme（避免循环依赖），通过运行时 import() 懒加载：
 *  - getConfig().other.themeId 决定主题
 *  - 业务已提供 layoutRoutes → 使用业务的，不追加
 *  - 业务未提供 → 调 @repo/theme 的 getThemeRoutes(themeId) 取主题组件，按固定格式生成
 *
 * error 路由优先级：
 *  - 主题提供了 error 组件 → 使用主题的
 *  - 未提供 → 回退到 @repo/pages 的默认错误页
 */
import { getConfig } from "@repo/config";
import type { Component } from "vue";
import type { RouteConfigsTable } from "./types";
import { log } from "@repo/utils";

/** 主题错误页组件 */
export interface ThemeErrorComponents {
  forbidden?: Component;
  notFound?: Component;
  serverError?: Component;
}

/** 主题基础路由组件（与 @repo/theme 的 ThemeBaseComponents 一致） */
export interface ThemeBaseComponents {
  layout: Component;
  login: Component;
  home: Component;
  /** 个人中心页组件（可选，注册后生成 layout 下的 personagePath 子路由） */
  mine?: Component;
  error?: ThemeErrorComponents;
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
 * 错误页 fallback 组件（懒加载 @repo/pages 默认实现）
 * 通过运行时 import 避免 core 静态依赖 @repo/pages
 */
async function defaultErrorComponent(
  name: "403" | "404" | "500"
): Promise<Component> {
  try {
    // 动态加载：core 不静态依赖 @repo/pages（避免循环）
    // @ts-ignore core 包未声明 @repo/pages 依赖（运行时由 bundler 解析）
    const mod = (await import("@repo/pages")) as unknown as {
      error403?: Component;
      error404?: Component;
      error500?: Component;
    };
    if (name === "403") return (mod.error403 ?? mod.error404) as Component;
    if (name === "500") return (mod.error500 ?? mod.error404) as Component;
    return (mod.error404 ?? mod.error403) as Component;
  } catch {
    // 兜底：渲染一个最小占位组件
    return (() => Promise.resolve({})) as unknown as Component;
  }
}

/**
 * 按固定格式生成基础路由（login + layout 包 home + redirect + error 三件套 + 404 兜底）
 * @param components 主题页面组件
 */
export function buildBaseRoutes(
  components: ThemeBaseComponents
): RouteConfigsTable[] {
  const route = getConfig().route;
  const loginPath = route.loginPath || "/login";
  const homePath = route.homePath || "/home";
  const personagePath = route.personagePath || "/system/personage";

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
        // 个人中心：主题提供 mine 组件时注册（隐藏侧边栏，不出现在菜单树）
        ...(components.mine
          ? [
              {
                path: personagePath,
                name: "personage",
                component: components.mine,
                meta: {
                  title: "menu.system.personage.name",
                  icon: "koi-profile-circle",
                  showLink: false,
                  keepAlive: true,
                },
              },
            ]
          : []),
      ],
    },
    // 错误页：主题组件优先，未提供则回退 @repo/pages
    {
      path: route.forbiddenPath || "/403",
      name: "403",
      component: components.error?.forbidden,
      meta: { title: "403", showLink: false },
    },
    {
      path: "/404",
      name: "404",
      component: components.error?.notFound,
      meta: { title: "404", showLink: false },
    },
    {
      path: "/500",
      name: "500",
      component: components.error?.serverError,
      meta: { title: "500", showLink: false },
    },
    // 找不到 path 将跳转 404
    {
      path: "/:pathMatch(.*)*",
      redirect: "/404",
    },
  ];
}

/** 异步确保错误页组件：主题未提供时懒加载 @repo/pages 回退 */
export async function ensureErrorComponents(
  components: ThemeBaseComponents
): Promise<ThemeBaseComponents> {
  if (components.error?.forbidden && components.error?.notFound && components.error?.serverError) {
    return components;
  }
  return {
    ...components,
    error: {
      forbidden: components.error?.forbidden ?? (await defaultErrorComponent("403")),
      notFound: components.error?.notFound ?? (await defaultErrorComponent("404")),
      serverError: components.error?.serverError ?? (await defaultErrorComponent("500")),
    },
  };
}

/** 按 themeId 从 @repo/theme 解析主题基础路由组件（运行时懒加载） */
export async function resolveThemeBaseRoutes(
  themeId: string
): Promise<ThemeBaseComponents | undefined> {
  try {
    // core 不静态依赖 @repo/theme（避免循环）；运行时动态 import 解析
    // @ts-ignore core 包未声明 @repo/theme 依赖（运行时由 bundler 解析）
    const theme = (await import("@repo/theme")) as {
      getThemeRoutes?: (id: string) => ThemeBaseComponents | undefined;
    };
    const components = theme.getThemeRoutes?.(themeId);
    if (!components) return undefined;
    return ensureErrorComponents(components);
  } catch (error) {
    log.warn(`[router] 主题路由解析失败`, error);
    return undefined;
  }
}
