/**
 * ReScrollNav 主题注册表
 */
import type { Component } from "vue";

export const ReScrollNavThemes: Record<string, () => Promise<{ default: Component }>> = {
  default: () => import("./default/ReScrollNav.vue"),
  koi: () => import("./koi/ReScrollNav.vue"),
};
