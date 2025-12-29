/**
 * ScDrawer Composables
 * 抽屉组件的可复用组合式函数
 */

// 复用 ScDialog 的记忆功能
export {
  useDrawerMemory,
  useComponentMemory,
  clearAllComponentMemory,
  getAllMemoryKeys,
  type DrawerMemoryData,
  type ComponentMemoryData,
  type ComponentMemoryOptions,
  type ComponentMemoryReturn,
} from '../../ScDialog/composables/useDialogMemory';
