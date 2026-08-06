/**
 * ReInputNumber —— 数字输入框组件（el 封装 + 现代卡片布局）
 */
import type { App, Plugin } from "vue";
import ReInputNumber from "./ReInputNumber.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReInputNumber", ReInputNumber);
  },
};

export { plugin as install };
export default ReInputNumber;