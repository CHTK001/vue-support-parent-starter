/**
 * ReSearch 主题注册表
 */
import type { Component } from "vue";

export const ReSearchThemes: Record<string, () => Promise<{ default: Component }>> = {
  default: () => import("./default/ReSearch.vue"),
  koi: () => import("./koi/ReSearch.vue"),
};
