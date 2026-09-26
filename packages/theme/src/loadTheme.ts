/**
 * 按 themeId 动态加载主题框架（触发该主题注册安装器）
 *
 * 主题框架模块（koi/framework.ts）顶层调用 registerThemeInstaller 完成注册。
 * 动态 import 保证未被选中的主题不被打包进主包。
 */
import type { App } from "vue";
import { getThemeInstaller } from "./themeInstallers";

/** 主题安装器 */
export type ResolvedThemeInstaller = (
  app: App,
  context: unknown
) => void | Promise<void>;

/** themeId → 框架模块动态加载器（保持懒加载，避免打包进 @repo/theme 主包） */
const FRAMEWORK_LOADERS: Record<string, () => Promise<unknown>> = {
  // 主题框架由宿主应用提供，theme 主包不把具体主题作为构建依赖。
  // @ts-ignore 运行时由 Vite 解析具体主题子路径
  koi: () => import("@repo/theme/koi/framework"),
};

/**
 * 确保指定主题的框架已加载并完成安装器注册。
 * 未配置 loader 的主题视为无需框架安装器。
 */
export async function loadThemeFramework(themeId: string): Promise<void> {
  const loader = FRAMEWORK_LOADERS[themeId];
  if (loader) {
    await loader();
  }
}

/** 加载框架并返回安装器；未注册返回 undefined */
export async function resolveThemeInstaller(
  themeId: string
): Promise<ResolvedThemeInstaller | undefined> {
  await loadThemeFramework(themeId);
  return getThemeInstaller(themeId);
}
