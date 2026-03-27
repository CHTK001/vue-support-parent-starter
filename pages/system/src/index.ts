/**
 * 系统管理模块
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */

// 导出主页面组件
import SystemHolidayIndex from "./holiday/HolidayIndex.vue";
import SystemLogIndex from "./log/LogIndex.vue";
import SystemFileSystem from "./file/index.vue";
export { SystemHolidayIndex, SystemLogIndex, SystemFileSystem };
export { default as SystemDirectorySelector } from "./file/components/DirectorySelector.vue";
export { default as SystemUploadQueueStatus } from "./file/components/UploadQueueStatus.vue";
export * from "./api/acme";
export * from "./api/file-distribute";
export * from "./api/monitor/filesystem";
export * from "./api/monitor/filesystem-group";
export * from "./api/remote-desktop";
export * from "./api/server-file-management";
export * from "./api/server-upload";
export {
  batchDeleteFiles as batchDeleteFileSystemFiles,
  deleteFile as deleteFileSystemFile,
  downloadFile as downloadFileSystemFile,
} from "./api/monitor/filesystem";
export {
  batchDeleteFiles,
  deleteFile,
  downloadFile,
} from "./api/server-file-management";

// 导出 Job 任务调度模块
export * from "./job";

// 导出 JVM 监控模块
export * from "./jvm";
