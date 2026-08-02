import type { App, Plugin } from "vue";
import ReAlbum from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReAlbum", ReAlbum);
  },
};

export { plugin as install };
export default ReAlbum;
