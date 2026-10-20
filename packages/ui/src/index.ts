/**
 * @repo/ui —— 组件库
 *
 * 设计目标：按需加载，防止全部组件打入产物。
 * - 主入口只导出类型与安装函数，不自动 import 任何组件
 * - 具体组件通过子路径导入（如 `@repo/ui/re-button`），保证 tree-shaking
 * - 与 theme 一致：每个组件子路径独立，只有被引用才进入产物
 */
export type * from "./types";

export { installUi } from "./install";
export type { UiInstallOptions } from "./install";

/**
 * 组件预设（preset）：把「这个 app 用到哪些 Re* 组件」的知识收回组件库内部，
 * 宿主只需声明预设名（如 {@code .ui({ preset: "monitor" })}）。
 */
export {
  CORE_PRESET,
  MONITOR_PRESET,
  resolveUiPreset,
  preloadUiLayouts,
  type UiPreset,
  type UiPresetName,
} from "./presets";

/** 组件主题加载机制 */
export { defineThemeComponent, loadThemedComponent, resolveThemeId } from "./theme";
export type { ThemeComponentMap } from "./theme";
