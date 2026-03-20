/**
 * 数据同步管理模块
 *
 * 提供完整的数据同步任务管理功能，包括：
 * - 任务列表与管理
 * - 可视化任务设计器（基于 ScReteEditor）
 * - 实时监控与日志
 * - SPI 插件系统
 *
 * @example
 * ```ts
 * // 在应用中导入路由
 * import { syncRoutes } from '@repo/pages-sync';
 *
 * const router = createRouter({
 *   routes: [
 *     ...syncRoutes,
 *     // 其他路由
 *   ]
 * });
 * ```
 *
 * @example
 * ```ts
 * // 导入 API 和 Store
 * import { useSyncTaskStore } from '@repo/pages-sync/stores';
 * import { listSyncTasks } from '@repo/pages-sync/api';
 * ```
 */

export { syncRoutes } from "./routes";
export { useSyncTaskStore } from "./stores/task";
export * from "./api/sync";
