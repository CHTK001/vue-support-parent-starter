/**
 * ReDatePicker —— 日期选择组件（el-date-picker 封装）
 */
import type { App, Plugin } from "vue";
import ReDatePicker from "./ReDatePicker.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReDatePicker", ReDatePicker);
  },
};

export { plugin as install };
export default ReDatePicker;
