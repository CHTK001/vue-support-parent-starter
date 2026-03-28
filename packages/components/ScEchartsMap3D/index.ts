import type { App } from "vue";
import ScEchartsMap3D from "./index.vue";

export { ScEchartsMap3D };

export default ScEchartsMap3D;

export function install(app: App): void {
  app.component("ScEchartsMap3D", ScEchartsMap3D);
}
