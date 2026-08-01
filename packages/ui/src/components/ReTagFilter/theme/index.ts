/**
 * ReTagFilter 主题注册表
 */
import type { Component } from "vue";

export const ReTagFilterThemes: Record<string, () => Promise<{ default: Component }>> = {
  default: () => import("./default/ReTagFilter.vue"),
  koi: () => import("./koi/ReTagFilter.vue"),
};
