import type { App, Plugin } from "vue";
import ReStationMessage from "./ReStationMessage.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReStationMessage", ReStationMessage);
  },
};

export { plugin as install };
export default ReStationMessage;
