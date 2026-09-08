import type { App, Plugin } from "vue";
import ReImageTo3D from "./ReImageTo3D.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReImageTo3D", ReImageTo3D);
  },
};

export { plugin as install };
export default ReImageTo3D;
