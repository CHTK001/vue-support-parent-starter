/**
 * 布局管理模块入口文件
 */

// 导出组件
export { default as GridLayoutEditor } from './components/GridLayoutEditor.vue';
export { default as LayoutConfigDialog } from './components/LayoutConfigDialog.vue';

// 导出组合式函数
export { useLayoutManager } from './composables/useLayoutManager';

// 导出类型定义
export type * from '../../shared/types/layout';

// 导出工具函数
export * from '../../shared/utils/layoutUtils';
