import { withInstall } from "@repo/utils";
import ScTabs from "./src/index.vue";
import ScTabPane from "./src/tab-pane.vue";
import ScTabsRailTabLabel from "./components/ScTabsRailTabLabel.vue";
import type { ScTabsRailItem } from "./types";

export const ScTabsComponent = withInstall(ScTabs);

export type { ScTabsRailItem };
export { ScTabs, ScTabPane, ScTabsRailTabLabel };
export default ScTabsComponent;
