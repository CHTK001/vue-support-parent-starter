import type { App, Plugin } from "vue";
import ReRibbon from "./ReRibbon.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRibbon", ReRibbon);
  },
};

export { plugin as install };
export default ReRibbon;
