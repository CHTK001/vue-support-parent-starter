/**
 * ReRadioButton —— 单选按钮组件（el-radio-button 封装）
 */
import type { App, Plugin } from "vue";
import ReRadioButton from "./ReRadioButton.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRadioButton", ReRadioButton);
  },
};

export { plugin as install };
export default ReRadioButton;