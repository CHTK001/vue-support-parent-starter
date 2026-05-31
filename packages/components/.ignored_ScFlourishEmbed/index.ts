import type { App } from "vue";
import ScFlourishEmbed from "./index.vue";

export { ScFlourishEmbed };
export default ScFlourishEmbed;

export function install(app: App): void {
  app.component("ScFlourishEmbed", ScFlourishEmbed);
}
