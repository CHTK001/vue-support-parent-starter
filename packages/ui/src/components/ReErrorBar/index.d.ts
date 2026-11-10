/**
 * ReErrorBar 组件默认导出类型声明
 *
 * 实际导出由 ./index.ts 通过 defineThemeComponent 异步加载 default 主题。
 * 此声明用于静态 import 类型推导。
 */
declare const ReErrorBar: import("vue").DefineComponent<{
  /** 错误文案（必传） */
  message: string;
  /** 重试按钮文案，默认「重试」 */
  retryText?: string;
  /** 重试按钮加载中 */
  retryLoading?: boolean;
}>;
export default ReErrorBar;
export const component: () => Promise<typeof ReErrorBar>;
export const install: (app: import("vue").App) => Promise<void>;
