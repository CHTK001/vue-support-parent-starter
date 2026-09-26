/**
 * ReCron —— Cron 表达式选择组件（可视化生成 + 表达式输入 + 触发时间预览）
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