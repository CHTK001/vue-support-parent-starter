import type { App, Plugin } from "vue";
import ReStationMessage from "./ReStationMessage.vue";
import type { StationMessageAdapter, StationMessage } from "@repo/core";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReStationMessage", ReStationMessage);
  },
};

export { plugin as install };
export type { StationMessageAdapter, StationMessage };
export default ReStationMessage;
