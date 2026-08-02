/**
 * Theme 上下文（运行时注入，theme 主包不再静态依赖 @repo/pinia）
 *
 * 通过 registerThemeContext 在主题框架（koi framework）启动时注入，
 * useTheme 等运行时工具按需获取，避免：
 *   - @repo/theme 主包强依赖 @repo/pinia（允许未来用其它 store 方案替换）
 *   - 多实例或测试场景下替换 store 实现
 */

import type { InjectionKey } from "vue";
import type { Store } from "pinia";

/** Global store 接口（与 @repo/pinia/modules/global 兼容的最小子集） */
export interface GlobalStoreShape {
  layout: string;
  isDark: boolean;
  themeColor: string;
  isGrey: boolean;
  isWeak: boolean;
  asideInverted: boolean;
  headerInverted: boolean;
  setGlobalState: <K extends keyof GlobalStoreShape>(
    key: K,
    value: GlobalStoreShape[K]
  ) => void;
}

/** useGlobalStore 返回值类型（兼容 Pinia Store） */
export type GlobalStoreFactory = () => Store | (GlobalStoreShape & Record<string, unknown>);

interface ThemeContext {
  /** 全局 store（layout / themeColor / isDark 等） */
  useGlobalStore?: GlobalStoreFactory;
}

let ctx: ThemeContext = {};

/** 注册主题上下文（主题框架启动时调用） */
export function registerThemeContext(next: ThemeContext): void {
  ctx = { ...ctx, ...next };
}

/** 读取主题上下文（未注册返回空对象，不抛错以避免冷启动顺序问题） */
export function getThemeContext(): ThemeContext {
  return ctx;
}

/** 清空上下文（仅测试使用） */
export function __resetThemeContext(): void {
  ctx = {};
}

/**
 * UI 上下文 provide/inject 键
 *
 * koi 框架 install 时 provide 当前的 language / dimension 等，
 * 子组件 inject 此键即可拿到（避免每个组件都读 store）。
 */
import { inject } from "vue";

export interface AppUiContext {
  language: import("vue").Ref<string>;
  dimension: import("vue").Ref<string>;
}

export const AppUiContextKey: InjectionKey<AppUiContext> = Symbol("AppUiContext");

/**
 * 读取 UI 上下文（composable）。
 * 未 provide 时返回 undefined，调用方需自行 fallback 到 i18n / 默认值。
 */
export function useAppUiContext(): AppUiContext | undefined {
  return inject(AppUiContextKey, undefined);
}
