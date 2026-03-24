/**
 * ScDialog Composables
 * 对话框组件的可复用组合式函数
 */

// Z-Index 管理
export {
  useDialogZIndex,
  dialogZIndexManager,
  type DialogZIndexOptions,
  type DialogZIndexReturn,
} from './useDialogZIndex';

// Interact.js 拖拽/调整大小
export {
  useDialogInteract,
  type DialogInteractOptions,
  type DialogInteractReturn,
  type SnapConfig,
} from './useDialogInteract';

// 最小化/最大化/边缘吸附
export {
  useDialogMinimize,
  type DockPosition,
  type DialogState,
  type DialogMinimizeOptions,
  type DialogMinimizeReturn,
} from './useDialogMinimize';

// 记忆/持久化
export {
  useComponentMemory,
  useDialogMemory,
  useDrawerMemory,
  clearAllComponentMemory,
  getAllMemoryKeys,
  type DialogMemoryData,
  type DrawerMemoryData,
  type ComponentMemoryData,
  type ComponentMemoryOptions,
  type ComponentMemoryReturn,
} from './useDialogMemory';
