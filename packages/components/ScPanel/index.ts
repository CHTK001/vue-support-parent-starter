import type { App, Component } from "vue";
import ScPanel from "./index.vue";

export { ScPanel };

export default {
  install: (app: App) => {
    app.component("ScPanel", ScPanel as Component);
  }
};
