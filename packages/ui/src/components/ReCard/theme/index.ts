/**
 * ReCard 主题注册表
 *
 * 每个主题一个独立实现，通过动态 import 按 themeId 局部加载：
 * 只有被选中的主题才会进入产物，其余主题被 tree-shake 掉。
 */
import type { Component } from "vue";

/** 主题实现映射：themeId → 异步组件加载器 */
export const ReCardThemes: Record<string, () => Promise<{ default: Component }>> = {
  default: () => import("./default/ReCard.vue"),
  koi: () => import("./koi/ReCard.vue"),
};

/** 默认主题（themeId 不存在时兜底） */
export const ReCardDefaultTheme = "default";
