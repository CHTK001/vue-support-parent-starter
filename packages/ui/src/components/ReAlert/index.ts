/**
 * ReAlert —— 提示框组件（el-alert 封装）
 */
import type { App, Plugin } from "vue";
import ReAlert from "./ReAlert.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReAlert", ReAlert);
  },
};

export { plugin as install };
export default ReAlert;