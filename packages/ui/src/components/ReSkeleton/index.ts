import type { App, Plugin } from "vue";
import ReSkeleton from "./ReSkeleton.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReSkeleton", ReSkeleton);
  },
};

export { plugin as install };
export default ReSkeleton;
