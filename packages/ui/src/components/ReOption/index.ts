/**
 * ReOption —— 选项组件（el-option 封装）
 */
import type { App, Plugin } from "vue";
import ReOption from "./ReOption.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReOption", ReOption);
  },
};

export { plugin as install };
export default ReOption;
