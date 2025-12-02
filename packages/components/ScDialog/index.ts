/**
 * ScDialog 对话框组件
 * @author CH
 * @version 4.0.0
 * @since 2025-12-01
 * @updated 2025-12-02 简化架构
 */
import { App } from "vue";
import ScDialog from "./src/index.vue";

// 导出组件
export { ScDialog };

// 导出 Composables
export { useInteract } from "./src/useInteract";
export type { InteractOptions, InteractReturn, EdgeType } from "./src/useInteract";

// 默认导出，用于全局注册
export default {
  install(app: App): void {
    app.component("ScDialog", ScDialog);
  }
};
