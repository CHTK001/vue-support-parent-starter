/**
 * ReImageCompare —— 图片左右对比组件
 *
 * 基于 vue3-compare-image，支持拖拽对比
 *   <ReImageCompare left-image="a.png" right-image="b.png" />
 */
import type { App, Plugin } from "vue";
import ReImageCompare from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReImageCompare", ReImageCompare);
  },
};

export { plugin as install };
export default ReImageCompare;