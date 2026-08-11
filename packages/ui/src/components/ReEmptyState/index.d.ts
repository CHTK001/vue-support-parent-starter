/**
 * ReEmptyState 组件默认导出类型声明
 *
 * 实际导出由 ./index.ts 通过 defineThemeComponent 异步加载 default 主题。
 * 此声明用于静态 import 类型推导。
 */
declare const ReEmptyState: import("vue").DefineComponent<{
  title?: string;
  description?: string;
  icon?: import("vue").Component;
  iconSize?: number;
  loading?: boolean;
  size?: "compact" | "default" | "large";
}>;
export default ReEmptyState;
export const component: () => Promise<typeof ReEmptyState>;
export const install: (app: import("vue").App) => Promise<void>;
