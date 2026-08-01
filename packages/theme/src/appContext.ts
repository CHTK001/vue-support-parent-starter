/**
 * 应用 UI 上下文 —— 公共 App.vue 与主题之间的契约
 *
 * 公共根组件（@repo/app 的 App.vue）不依赖任何具体主题，
 * 它通过 inject 读取由主题适配器（如 koi 的 installKoi）provide 的：
 *   - language   当前语言（决定 element-plus locale）
 *   - dimension  element-plus 尺寸
 *
 * 主题没有 provide 时，公共 App.vue 走默认值（zh / default），保证框架可独立运行。
 * 此契约位于 @repo/theme（主题层），避免 @repo/theme → @repo/app 的循环依赖。
 */
import { inject, provide, type InjectionKey, type Ref } from "vue";

/** 公共 App 需要的主题 UI 上下文 */
export interface AppUiContext {
  /** 当前语言（"zh" | "en" 等） */
  language: Ref<string>;
  /** element-plus 尺寸（default / small / large） */
  dimension: Ref<string>;
}

/** 注入 key */
export const AppUiContextKey: InjectionKey<AppUiContext> = Symbol("app-ui-context");

/** 主题适配器调用：注册公共 App 需要的 UI 上下文 */
export function provideAppUiContext(context: AppUiContext): void {
  provide(AppUiContextKey, context);
}

/** 公共 App.vue 调用：读取主题提供的 UI 上下文（无则返回 undefined，走默认值） */
export function useAppUiContext(): AppUiContext | undefined {
  return inject(AppUiContextKey, undefined);
}
