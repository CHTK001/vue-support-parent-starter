import type { App, Plugin } from "vue";
import ReDateRangePicker from "./ReDateRangePicker.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReDateRangePicker", ReDateRangePicker);
  },
};

export { plugin as install };
export default ReDateRangePicker;