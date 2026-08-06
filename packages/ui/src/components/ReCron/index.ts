/**
 * ReCron —— Cron 表达式选择组件（el 封装 + 现代卡片布局）
 */
import type { App, Plugin } from "vue";
import ReCron from "./ReCron.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReCron", ReCron);
  },
};

export { plugin as install };
export default ReCron;