/**
 * 组件配置模块入口文件
 */

// 导出组件
export { default as ComponentConfigDialog } from './components/ComponentConfigDialog.vue';

// 导出组合式函数
export { useComponentConfig } from './composables/useComponentConfig';

// 导出类型定义
export type * from '../../shared/types/component';

// 导出工具函数
export * from '../../shared/utils/chartUtils';
