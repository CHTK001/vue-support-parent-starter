/**
 * ReLoading 主题注册表
 */
import type { Component } from "vue";

export const ReLoadingThemes: Record<string, () => Promise<{ default: Component }>> = {
  default: () => import("./default/ReLoading.vue"),
  koi: () => import("./koi/ReLoading.vue"),
};
