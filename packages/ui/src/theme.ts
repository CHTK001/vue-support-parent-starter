/**
 * 组件主题加载器
 *
 * 根据 getConfig().other.themeId 动态加载对应主题的组件实现。
 * 采用动态 import 保证「局部加载」：未选中的主题不会被打包。
 *
 * 用法（组件 index.ts）：
 *   export default defineThemeComponent("ReCard", {
 *     default: () => import("./theme/default/ReCard.vue"),
 *     koi: () => import("./theme/koi/ReCard.vue"),
 *   });
 */
import { defineAsyncComponent } from "vue";
import type { App, Component, Plugin } from "vue";
import { getConfig } from "@repo/config";

/** 主题实现映射：themeId → 组件异步加载器 */
export type ThemeComponentMap = Record<string, () => Promise<{ default: Component }>>;

/** 兜底 themeId */
export const FALLBACK_THEME = "default";

/**
 * 解析当前 themeId（不存在时回退默认主题）
 */
export function resolveThemeId(): string {
  return getConfig().other.themeId || FALLBACK_THEME;
}

/**
 * 按主题加载组件实例
 * @param map 主题实现映射
 */
export async function loadThemedComponent(
  map: ThemeComponentMap,
): Promise<Component> {
  const themeId = resolveThemeId();
  const loader = map[themeId] ?? map[FALLBACK_THEME];
  if (!loader) {
    throw new Error(`[ui] 组件缺少主题实现：${themeId}`);
  }
  const mod = await loader();
  return mod.default;
}

/**
 * 生成一个带主题的组件插件（懒加载，按 themeId 局部加载）
 *
 * 导出对象同时满足：
 *  - 作为 Plugin：`app.use(install)`
 *  - 直接取组件：`install.component`（异步）
 */
export interface ThemedComponent {
  /** 按当前主题异步解析组件实例 */
  component: () => Promise<Component>;
  /** 注册为全局组件（返回 Promise，便于 installUi 等待完成） */
  install: (app: App) => Promise<void>;
}

export function defineThemeComponent(
  name: string,
  map: ThemeComponentMap,
): ThemedComponent {
  // component 必须是 Vue 可渲染的组件（而非"返回 Promise 的函数"）——
  // 否则模板里 <ReIcon> 会被当作函数式组件调用，渲染出 "[object Promise]"
  const component = defineAsyncComponent(() => loadThemedComponent(map));
  const install = async (app: App) => {
    app.component(name, await loadThemedComponent(map));
  };
  return { install, component };
}
