/**
 * ReSwitch —— 卡片式开关组件（el-switch 封装，支持卡片布局 + tip + 小标题）
 */
import type { App, Plugin } from "vue";
import ReSwitch from "./ReSwitch.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReSwitch", ReSwitch);
  },
};

export { plugin as install };
export default ReSwitch;
