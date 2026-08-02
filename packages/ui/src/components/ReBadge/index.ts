import type { App, Plugin } from "vue";
import ReBadge from "./ReBadge.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReBadge", ReBadge);
  },
};

export { plugin as install };
export default ReBadge;
