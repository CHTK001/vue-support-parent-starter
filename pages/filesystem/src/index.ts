/**
 * @pages/filesystem —— 文件系统管理共享包
 *
 * 页面：
 *   1) 文件服务器 —— 对接独立文件存储服务（默认 http://127.0.0.1:18082）的对象浏览与管理
 *
 * 页面组件通过 registerMenuViewModules 以懒加载（异步组件）注册：
 * 后端菜单 component（如 filesystem/filestorage/index）自动映射到本地 .vue，
 * main.ts 无需手动传路由，页面按需加载。
 */
import { registerMenuViewModules } from "@repo/core";

// 上传弹框样式独立成文件：弹框 append-to-body，DOM 挂在 body 下，
// 放全局比塞进组件 scoped 样式更贴合实际 DOM；类名统一 .fs-up* 前缀，无污染风险
import "./styles/upload.css";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）
registerMenuViewModules({
  "views/filesystem/filestorage/index.vue": () => import("./views/FileStorageManage.vue"),
  "views/filesystem/uploadtask/index.vue": () => import("./views/UploadTaskView.vue"),
  "views/filesystem/collab/index.vue": () => import("./views/FileCollabManage.vue"),
});

export * from "./api/filestorageApi";

/**
 * 文件存储管理页组件。
 *
 * 供其它应用（而非仅后端菜单路由）直接嵌入使用，例如把文件服务器
 * 挂到「系统配置 → 文件存储」作为查看入口。
 */
export { default as FileStorageManage } from "./views/FileStorageManage.vue";

/**
 * 上传任务页组件。
 *
 * 供其它应用（而非仅后端菜单路由）直接嵌入使用，
 * 例如宿主侧栏「文件管理 → 文件管理」二级菜单项。
 */
export { default as UploadTaskView } from "./views/UploadTaskView.vue";

/**
 * 文件日志页组件。
 *
 * 供其它应用（而非仅后端菜单路由）直接嵌入使用，
 * 例如宿主侧栏「文件管理 → 文件日志」二级菜单项。
 */
export { default as FileLogView } from "./views/FileLogView.vue";

/**
 * 协同管理页组件。
 *
 * 供其它应用（而非仅后端菜单路由）直接嵌入使用，
 * 例如宿主侧栏「文件管理 → 协同管理」二级菜单项。
 */
export { default as FileCollabManage } from "./views/FileCollabManage.vue";
