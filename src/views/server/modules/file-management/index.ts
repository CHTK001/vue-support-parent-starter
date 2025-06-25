/**
 * 文件管理模块入口文件
 */

// 导出组件
export { default as FileManagerDialog } from './components/FileManagerDialog.vue';

// 导出组合式函数
export { useFileManager } from './composables/useFileManager';

// 导出类型定义
export type * from '../../shared/types/file';

// 导出工具函数
export * from './utils/fileUtils';
