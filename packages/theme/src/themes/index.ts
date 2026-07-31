/**
 * 主题注册表
 *
 * 所有内置主题在此登记。应用启动时根据持久化的 themeId 选取对应主题，
 * 只 import 选中的主题（未被引用的主题会被打包器 tree-shake 掉）。
 */
import type { ThemeDefinition } from "./types";
import { defaultTheme } from "./default";
import { koiTheme } from "./koi";

export * from "./types";
export { defaultTheme } from "./default";
export { koiTheme } from "./koi";

/** 内置主题列表 */
export const themes: ThemeDefinition[] = [defaultTheme, koiTheme];

/** 按 id 查找主题，找不到返回 default */
export function getTheme(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) ?? defaultTheme;
}
