import type { App, Plugin } from "vue";
import ReAvatar3D from "./ReAvatar3D.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReAvatar3D", ReAvatar3D);
  },
};

export { plugin as install };
export default ReAvatar3D;