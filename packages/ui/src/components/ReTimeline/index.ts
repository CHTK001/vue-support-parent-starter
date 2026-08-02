import type { App, Plugin } from "vue";
import ReTimeline from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTimeline", ReTimeline);
  },
};

export { plugin as install };
export default ReTimeline;
