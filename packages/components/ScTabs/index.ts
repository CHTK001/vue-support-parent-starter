import { withInstall } from "@repo/utils";
import ScTabs from "./src/index.vue";
import ScTabPane from "./src/tab-pane.vue";
import type { ScTabsRailItem } from "./src/index.vue";

export const ScTabsComponent = withInstall(ScTabs);

export type { ScTabsRailItem };
export { ScTabs, ScTabPane };
export default ScTabsComponent;
