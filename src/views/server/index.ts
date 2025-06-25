/**
 * 服务器监控模块主入口文件
 */

// 导出服务器管理模块
export * from './modules/server-management';

// 导出组件配置模块
export * from './modules/component-config';

// 导出布局管理模块
export * from './modules/layout-management';

// 导出文件管理模块
export * from './modules/file-management';

// 导出共享模块
export * from './shared';

// 导出主要页面组件（保持向后兼容）
export { default as ServerIndex } from './modules/server-management/index.vue';
export { default as ServerDetail } from './modules/server-management/detail.vue';
export { default as ServerManagement } from './modules/server-management/management.vue';
