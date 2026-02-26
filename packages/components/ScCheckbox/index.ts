import { withInstall } from "@repo/utils";
import ScCheckbox from "./src/checkbox.vue";
import ScCheckboxGroup from "./src/group.vue";

export const ScCheckboxComponent = withInstall(ScCheckbox);
export const ScCheckboxGroupComponent = withInstall(ScCheckboxGroup);

export { ScCheckbox, ScCheckboxGroup };
export default ScCheckboxComponent;
