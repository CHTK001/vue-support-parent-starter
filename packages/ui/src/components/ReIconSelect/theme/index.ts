/**
 * ReIconSelect 主题注册表
 *
 * 每个主题一个独立实现，通过动态 import 按 themeId 局部加载。
 */
import type { Component } from "vue";

/** 主题实现映射：themeId → 异步组件加载器 */
export const ReIconSelectThemes: Record<string, () => Promise<{ default: Component }>> = {
  default: () => import("./default/ReIconSelect.vue"),
  koi: () => import("./koi/ReIconSelect.vue"),
};
