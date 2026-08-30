/**
 * 路由访问决策 —— 框架无关的鉴权纯函数
 *
 * 从 guard.ts 剥离出的核心判定逻辑：输入当前路由目标 + 鉴权上下文，
 * 输出「放行 / 跳登录 / 跳首页 / 跳403」的决策。Vue（vue-router guard）
 * 与 React（react-router loader / 守卫）共用同一份，保证两套框架的
 * 鉴权与跳转逻辑完全一致。
 *
 * 不 import 任何框架类型（vue-router / react-router），只依赖 @repo/config 的
 * 纯配置与 @repo/core 的 permission 内存权限。
 */
import { getConfig } from "@repo/config";
import { getMenuLanguage } from "@repo/languages";
import { hasPerm, hasRole } from "../permission";

/** 无需登录即可访问的路由白名单（默认，可由 config.route.whiteList 覆盖） */
export const ROUTER_WHITE_LIST = ["/login", "/403", "/404", "/500"];

/** 目标路由的框架无关描述（Vue/React 各自适配为自身路由对象） */
export interface RouteTarget {
  /** 完整路径（如 /home） */
  path: string;
  /** 菜单标题（用于 document.title） */
  title?: string;
  /** 需要的角色 */
  roles?: string[];
  /** 需要的权限码 */
  perms?: string[];
}

/** 鉴权上下文 */
export interface RouteAccessContext {
  /** 获取 accessToken（未登录返回空串） */
  getAccessToken: () => string;
}

/** 访问决策 */
export type RouteAccessDecision =
  | { type: "allow"; title?: string }
  | { type: "redirect-login"; title?: string }
  | { type: "redirect-home"; title?: string }
  | { type: "redirect-forbidden"; title?: string };

/**
 * 计算对目标路由的访问决策。
 *
 * 判定顺序（与 guard.ts 保持一致）：
 *   1. 未开启鉴权 → 放行
 *   2. 登录页：已登录 → 跳首页；未登录 → 放行
 *   3. 无 token → 跳登录页
 *   4. meta.roles / meta.perms 校验 → 未通过跳 403
 *   5. 其余放行
 *
 * @param target 目标路由（框架无关描述）
 * @param context 鉴权上下文
 * @param resolveTitle 标题解析（可选；默认取 meta.title，menu. 前缀走 i18n）
 */
export function checkRouteAccess(
  target: RouteTarget,
  context: RouteAccessContext
): RouteAccessDecision {
  const config = getConfig();
  const route = config.route;

  const baseTitle = resolveTitleText(target.title);
  const title = baseTitle === "home" ? "" : baseTitle;

  // 1. 未开启鉴权：直接放行
  if (!config.app.openAuth) {
    return { type: "allow", title };
  }

  const loginPath = route.loginPath || "/login";

  // 2. 登录页：已登录 → 首页；未登录 → 放行
  if (target.path === loginPath) {
    if (context.getAccessToken()) {
      return { type: "redirect-home", title };
    }
    return { type: "allow", title };
  }

  // 3. 无 token → 登录页
  if (!context.getAccessToken()) {
    return { type: "redirect-login", title };
  }

  // 4. 角色 / 权限校验
  if (target.roles?.length && !hasRole(target.roles)) {
    return { type: "redirect-forbidden", title };
  }
  if (target.perms?.length && !hasPerm(target.perms)) {
    return { type: "redirect-forbidden", title };
  }

  return { type: "allow", title };
}

/** 标题解析：menu. 前缀走 i18n 翻译 */
function resolveTitleText(title?: string): string {
  if (!title) return "";
  return getMenuLanguage(title);
}

/** 计算并应用 document.title（Vue/React 共用） */
export function applyDocumentTitle(title: string | undefined, appTitle: string): void {
  if (typeof document === "undefined") return;
  const finalTitle = title && title !== appTitle ? `${title} - ${appTitle}` : appTitle;
  document.title = finalTitle;
}
