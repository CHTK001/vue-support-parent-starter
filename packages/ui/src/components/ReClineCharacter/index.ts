import type { App, Plugin } from "vue";
import ReClineCharacter from "./ReClineCharacter.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReClineCharacter", ReClineCharacter);
  },
};

export { plugin as install };
export default ReClineCharacter;
