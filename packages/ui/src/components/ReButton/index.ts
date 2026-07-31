/**
 * ReButton —— 按钮组件（el-button 封装）
 */
import type { App, Plugin } from "vue";
import ReButton from "./ReButton.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReButton", ReButton);
  },
};

export { plugin as install };
export default ReButton;
