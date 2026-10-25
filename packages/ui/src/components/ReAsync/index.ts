import type { App, Plugin } from "vue";
import ReAsync from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReAsync", ReAsync);
  },
};

export { plugin as install };
export default ReAsync;
