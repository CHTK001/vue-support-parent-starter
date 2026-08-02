/**
 * 主题路由注册表
 *
 * 每个主题（如 koi）只需注册四个「页面组件」：布局（layout）、登录页（login）、首页（home）、错误页（error）。
 * @repo/core 按固定格式生成基础路由骨架：
 *   - /login          → login 组件
 *   - /               → layout 组件（redirect 到 home）
 *   - /home           → home 组件（作为 layout 子路由）
 *   - /403 /404 /500  → error 组件（同一组件复用于三状态）
 *   - /* 兜底         → error 组件
 *
 * 主题可选择性提供 error，未提供时回退到 @repo/pages 的默认错误页。
 */
import type { Component } from "vue";

/** 主题错误页组件（403/404/500 复用同一组件，core 按状态切换文案/图标） */
export interface ThemeErrorComponents {
  /** 403 无权限页 */
  forbidden?: Component;
  /** 404 找不到 */
  notFound?: Component;
  /** 500 服务器错误 */
  serverError?: Component;
}

/** 主题基础路由组件 */
export interface ThemeBaseComponents {
  /** 布局组件（登录后主框架） */
  layout: Component;
  /** 登录页组件 */
  login: Component;
  /** 首页组件（layout 子路由） */
  home: Component;
  /** 错误页组件（可选，不提供时回退 @repo/pages） */
  error?: ThemeErrorComponents;
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

/**
 * 获取主题错误页组件，未注册主题或主题未提供 error 时返回 undefined。
 * 调用方需回退到 @repo/pages 的默认实现。
 */
export function getThemeError(
  themeId: string,
  key: keyof ThemeErrorComponents
): Component | undefined {
  return baseComponents.get(themeId)?.error?.[key];
}
