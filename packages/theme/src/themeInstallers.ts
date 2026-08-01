/**
 * 主题框架安装器注册表
 *
 * 每个主题框架（如 koi）在加载时注册自己的安装器（installKoi），
 * @repo/app 的 createApp 在启动时根据 getConfig().other.themeId 自动找到
 * 对应安装器并调用，应用无需手动引入 / 传递安装器。
 *
 * 设计约束：本注册表不静态 import 任何主题框架，避免把 element-plus /
 * router / axios 等整套框架拉入 @repo/theme 主包；主题框架通过
 * loadThemeFramework 动态 import 加载并触发注册。
 */
import type { App } from "vue";

/** 主题安装器：注册 element-plus / 组件 / 指令 / UI 上下文 */
export type ThemeInstaller = (
  app: App,
  context: unknown
) => void | Promise<void>;

/** themeId → 安装器 */
const installers = new Map<string, ThemeInstaller>();

/** 注册主题安装器（主题框架模块顶层调用） */
export function registerThemeInstaller(
  themeId: string,
  installer: ThemeInstaller
): void {
  installers.set(themeId, installer);
}

/** 按 themeId 获取安装器；未注册返回 undefined */
export function getThemeInstaller(
  themeId: string
): ThemeInstaller | undefined {
  return installers.get(themeId);
}
