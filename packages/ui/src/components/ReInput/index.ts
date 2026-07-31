/**
 * ReInput —— 输入框组件（el-input 封装）
 */
import type { App, Plugin } from "vue";
import ReInput from "./ReInput.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReInput", ReInput);
  },
};

export { plugin as install };
export default ReInput;
