import type { App, Plugin } from "vue";
import RePagination from "./RePagination.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("RePagination", RePagination);
  },
};

export { plugin as install };
export default RePagination;
