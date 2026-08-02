import type { App, Plugin } from "vue";
import ReCountup from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReCountup", ReCountup);
  },
};

export { plugin as install };
export default ReCountup;
