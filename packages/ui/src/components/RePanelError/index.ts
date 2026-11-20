import type { App, Plugin } from "vue";
import RePanelError from "./RePanelError.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("RePanelError", RePanelError);
  },
};

export { plugin as install };
export * from "./state";
export default RePanelError;
