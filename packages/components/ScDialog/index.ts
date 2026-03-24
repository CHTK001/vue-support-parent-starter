/**
 * ScDialog 对话框组件
 * @author CH
 * @version 4.0.0
 * @since 2025-12-01
 * @updated 2025-12-02 简化架构
 * @updated 2025-12-04 添加任务栏功能
 * @updated 2025-12-29 添加 composables 模块
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

// 导出新的 Composables 模块
export {
  // Z-Index 管理
  useDialogZIndex,
  dialogZIndexManager,
  // Interact.js 拖拽/调整大小
  useDialogInteract,
  // 最小化/最大化/边缘吸附
  useDialogMinimize,
  // 记忆/持久化
  useComponentMemory,
  useDialogMemory,
  useDrawerMemory,
  clearAllComponentMemory,
  getAllMemoryKeys,
} from "./composables";

export type {
  DialogZIndexOptions,
  DialogZIndexReturn,
  DialogInteractOptions,
  DialogInteractReturn,
  SnapConfig,
  DockPosition,
  DialogState,
  DialogMinimizeOptions,
  DialogMinimizeReturn,
  DialogMemoryData,
  DrawerMemoryData,
  ComponentMemoryData,
  ComponentMemoryOptions,
  ComponentMemoryReturn,
} from "./composables";

// 默认导出，用于全局注册
export default {
  install(app: App): void {
    app.component("ScDialog", ScDialog);
    app.component("ScDialogTaskbar", ScDialogTaskbar);
  }
};
