import type { App, Plugin } from "vue";
import ReContextMenu from "./ReContextMenu.vue";
import type { ReContextMenuItem } from "./types";

export type { ReContextMenuItem };

const plugin: Plugin = {
  install(app: App) {
    app.component("ReContextMenu", ReContextMenu);
  },
};

export { plugin as install };
export default ReContextMenu;
