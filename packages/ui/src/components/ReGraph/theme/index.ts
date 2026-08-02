/**
 * ReGraph 主题注册表
 *
 * 每个主题一个独立实现，通过动态 import 按 themeId 局部加载：
 * 只有被选中的主题才会进入产物，其余主题被 tree-shake 掉。
 */
import type { Component } from "vue";

export const ReGraphThemes: Record<string, () => Promise<{ default: Component }>> = {
  default: () => import("./default/ReGraph.vue"),
  koi: () => import("./koi/ReGraph.vue"),
};

export const ReGraphDefaultTheme = "default";