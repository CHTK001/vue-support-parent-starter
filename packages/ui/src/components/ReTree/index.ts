import type { App, Plugin } from "vue";
import ReTree from "./ReTree.vue";
import type { ReTreeItem, ReTreeEmitParams, ReTreeDragEvent } from "./types";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTree", ReTree);
  },
};

export { plugin as install };
export default ReTree;
export type { ReTreeItem, ReTreeEmitParams, ReTreeDragEvent } from "./types";
