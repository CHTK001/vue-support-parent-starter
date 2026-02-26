import { withInstall } from "@repo/utils";
import ScRateVue from "./src/index.vue";

export const ScRateComponent = withInstall(ScRateVue);
export { ScRateComponent as ScRate };

export default ScRateComponent;
