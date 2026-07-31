/**
 * ReTag —— 标签组件（el-tag 封装）
 */
import type { App, Plugin } from "vue";
import ReTag from "./ReTag.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTag", ReTag);
  },
};

export { plugin as install };
export default ReTag;
