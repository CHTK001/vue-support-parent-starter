/**
 * ReDrawer 主题注册表
 */
import type { Component } from "vue";

export const ReDrawerThemes: Record<string, () => Promise<{ default: Component }>> = {
  default: () => import("./default/ReDrawer.vue"),
  koi: () => import("./koi/ReDrawer.vue"),
};
