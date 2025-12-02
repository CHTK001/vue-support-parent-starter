/**
 * ScPanelTitle 面板标题组件
 * @author CH
 * @since 2025-12-03
 * @version 1.0.0
 */
import { App } from "vue";
import ScPanelTitle from "./index.vue";

export { ScPanelTitle };

export default {
  install(app: App): void {
    app.component("ScPanelTitle", ScPanelTitle);
  }
};
