/**
 * ScDialog 对话框组件
 * @author CH
 * @version 4.0.0
 * @since 2025-12-01
 * @updated 2025-12-02 简化架构
 * @updated 2025-12-04 添加任务栏功能
 */
import { App } from "vue";
import ScDialog from "./src/index.vue";
import ScDialogTaskbar from "./src/ScDialogTaskbar.vue";

// 导出组件
export { ScDialog, ScDialogTaskbar };

// 导出 Composables
export { useInteract } from "./src/useInteract";
export type { InteractOptions, InteractReturn, EdgeType } from "./src/useInteract";

// 导出任务栏相关
export { useTaskbar, getTaskbarStyle } from "./src/useTaskbar";
export type { TaskbarConfig, TaskbarItem, TaskbarGroupItem, TaskbarPosition } from "./src/useTaskbar";

// 默认导出，用于全局注册
export default {
  install(app: App): void {
    app.component("ScDialog", ScDialog);
    app.component("ScDialogTaskbar", ScDialogTaskbar);
  }
};
