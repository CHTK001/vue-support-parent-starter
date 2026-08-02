/**
 * ReSeamlessScroll —— 无缝滚动组件
 *
 * 支持上下左右四向无缝滚动、单击步进、hover 暂停、touch 拖动、滚轮滚动。
 * 来源：整合自 pureadmin ReSeamlessScroll，已按本仓库规范重写：
 *   - 全部替换为 TypeScript + withDefaults
 *   - utils.ts 移除老旧环境兼容代码
 *   - index.ts 不依赖 @pureadmin/utils，沿用本仓库 Plugin 模式
 */
import type { App, Plugin } from "vue";
import ReSeamlessScroll from "./ReSeamlessScroll.vue";

export type { ReSeamlessDirection, ReSeamlessScrollOptions } from "./types";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReSeamlessScroll", ReSeamlessScroll);
  },
};

export { plugin as install };
export default ReSeamlessScroll;