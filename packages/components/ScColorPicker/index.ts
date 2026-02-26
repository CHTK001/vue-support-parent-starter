import { withInstall } from "@repo/utils";
import ScColorPickerVue from "./src/index.vue";

export const ScColorPickerComponent = withInstall(ScColorPickerVue);
export { ScColorPickerComponent as ScColorPicker };

export default ScColorPickerComponent;
