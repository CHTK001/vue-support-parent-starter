import type { App, Component } from "vue";
import CardSelector from "./index.vue";

export { CardSelector };

export default {
  install: (app: App) => {
    app.component("CardSelector", CardSelector as Component);
  }
};