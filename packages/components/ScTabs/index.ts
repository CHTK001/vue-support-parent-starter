import { withInstall } from "@repo/utils";
import ScTabs from "./src/index.vue";
import ScTabPane from "./src/tab-pane.vue";

export const ScTabsComponent = withInstall(ScTabs);

export { ScTabs, ScTabPane };
export default ScTabsComponent;
