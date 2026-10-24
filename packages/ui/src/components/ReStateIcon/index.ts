/**
 * ReStateIcon —— 两态图标切换（带动画）
 *
 * 内置两套以上图标集，激活 / 非激活各一套，切换时做交叉过渡。
 * 用法见 ./StateIcon.vue 顶部注释。
 */
import type { App, Plugin } from "vue";
import StateIcon from "./StateIcon.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReStateIcon", StateIcon);
  },
};

export { plugin as install };
export default StateIcon;
export * from "./presets";
