/**
 * ReRadioGroup —— 单选组组件（el-radio-group 封装）
 */
import type { App, Plugin } from "vue";
import ReRadioGroup from "./ReRadioGroup.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRadioGroup", ReRadioGroup);
  },
};

export { plugin as install };
export default ReRadioGroup;
