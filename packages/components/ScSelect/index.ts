import { withInstall } from "@repo/utils";
import ScSelectVue from "./src/index.vue";

export const ScSelectComponent = withInstall(ScSelectVue);
export const ScSelect = ScSelectComponent;

export default ScSelectVue;
