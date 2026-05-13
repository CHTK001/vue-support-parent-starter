import { withInstall } from "@repo/utils";
import ScForm from "./src/index.vue";

export const ScFormComponent = withInstall(ScForm);

export { ScForm };
export default ScFormComponent;

// Re-export for protocol module compatibility
export { ScFormItem } from "../ScFormItem";
