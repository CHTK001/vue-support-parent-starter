/**
 * 服务器管理模块入口文件
 */

// 导出页面组件
export { default as ServerIndex } from './index.vue';
export { default as ServerDetail } from './detail.vue';
export { default as ServerManagement } from './management.vue';

// 导出组件
export { default as ServerList } from './components/ServerList.vue';
export { default as ServerConnectionStatus } from './components/ServerConnectionStatus.vue';
export { default as ServerConnectionStatusList } from './components/ServerConnectionStatusList.vue';
export { default as ServerMonitor } from './components/ServerMonitor.vue';
export { default as ServerLogs } from './components/ServerLogs.vue';
export { default as ServerScripts } from './components/ServerScripts.vue';
export { default as ServerEditDialog } from './components/ServerEditDialog.vue';
export { default as ServerInfoDialog } from './components/ServerInfoDialog.vue';
export { default as ServerMonitorDialog } from './components/ServerMonitorDialog.vue';
export { default as ServerTerminalDialog } from './components/ServerTerminalDialog.vue';

// 导出组合式函数
export { useServerData } from './composables/useServerData';

// 导出类型定义
export type * from '../../shared/types/server';

// 导出工具函数
export * from '../../shared/utils/serverUtils';
