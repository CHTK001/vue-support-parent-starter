/**
 * 主题路由注册表
 *
 * 每个主题（如 koi）只需注册三个「页面组件」：布局（layout）、登录页（login）、首页（home）。
 * @repo/core 按固定格式生成基础路由骨架：
 *   - /login          → login 组件
 *   - /               → layout 组件（redirect 到 home）
 *   - /home           → home 组件（作为 layout 子路由）
 *   - 错误页（403/404/500）→ 由 @repo/pages 提供
 *
 * 业务路由已提供 home/login 时，使用业务的；否则按 getConfig().other.themeId 取主题组件。
 */
import type { Component } from "vue";

/** 主题基础路由组件 */
export interface ThemeBaseComponents {
  /** 布局组件（登录后主框架） */
  layout: Component;
  /** 登录页组件 */
  login: Component;
  /** 首页组件（layout 子路由） */
  home: Component;
}

/** themeId → 基础路由组件 */
const baseComponents = new Map<string, ThemeBaseComponents>();

/** 注册主题基础路由组件（主题框架模块顶层调用） */
export function registerThemeRoutes(
  themeId: string,
  components: ThemeBaseComponents
): void {
  baseComponents.set(themeId, components);
}

/** 按 themeId 获取基础路由组件；未注册返回 undefined */
export function getThemeRoutes(themeId: string): ThemeBaseComponents | undefined {
  return baseComponents.get(themeId);
}
