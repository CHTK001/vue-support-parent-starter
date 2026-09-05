/**
 * ReRadio —— 单选组件（el-radio 封装）
 */
import type { App, Plugin } from "vue";
import ReRadio from "./ReRadio.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRadio", ReRadio);
  },
};

export { plugin as install };
export default ReRadio;