import type { App, Plugin } from "vue";
import ReEmpty from "./ReEmpty.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReEmpty", ReEmpty);
  },
};

export { plugin as install };
export default ReEmpty;
