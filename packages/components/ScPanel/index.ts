/**
 * ScPanel 面板组件
 * @author CH
 * @since 2025-12-03
 * @version 2.0.0
 */
import { App } from "vue";
import ScPanel from "./src/index.vue";
import ScPanelGroup from "./src/container.vue";

export { ScPanel, ScPanelGroup };

export default {
  install(app: App): void {
    app.component("ScPanel", ScPanel);
    app.component("ScPanelGroup", ScPanelGroup);
  }
};
