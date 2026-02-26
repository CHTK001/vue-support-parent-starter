import { withInstall } from "@repo/utils";
import ScRadio from "./src/radio.vue";
import ScRadioGroup from "./src/group.vue";

export const ScRadioComponent = withInstall(ScRadio);
export const ScRadioGroupComponent = withInstall(ScRadioGroup);

export { ScRadio, ScRadioGroup };
export default ScRadioComponent;
