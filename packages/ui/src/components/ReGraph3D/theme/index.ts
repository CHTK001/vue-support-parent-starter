/**
 * ReGraph3D 主题注册表
 */
import type { Component } from "vue";

export const ReGraph3DThemes: Record<string, () => Promise<{ default: Component }>> = {
  default: () => import("./default/ReGraph3D.vue"),
  koi: () => import("./koi/ReGraph3D.vue"),
};

export const ReGraph3DDefaultTheme = "default";
