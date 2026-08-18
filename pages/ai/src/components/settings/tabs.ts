import type { Component } from 'vue';
import router from '../router';

/**
 * 设置面板 tab 列表（侧边栏抽屉 / 全局入口使用）
 *
 * 从 router 自动生成（按 group='manage' 过滤），保证单一真相源：
 * router 新增 manage 类路由 → SETTINGS_TABS 自动出现该 tab。
 */
export interface SettingsTabItem {
  name: string;
  label: string;
  component: Component;
}

/** router 的 component 是 () => Promise<typeof import>，SETTINGS_TABS 需要 Component */
const importToComponent = (
  loader: () => Promise<{ default: unknown }>,
): Component => () => loader() as unknown as Component;

/** 从 router 提取 manage 分组面板 */
export const SETTINGS_TABS: SettingsTabItem[] = router
  .getRoutes()
  .filter((r) => r.meta?.group === 'manage' && r.name && r.components)
  .map((r) => ({
    name: String(r.name).replace(/^model-/, ''),
    label: String(r.meta?.title ?? r.name ?? ''),
    component: importToComponent(r.components as unknown as () => Promise<{ default: unknown }>),
  }));
