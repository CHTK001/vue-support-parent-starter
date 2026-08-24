/**
 * @pages/filesystem —— 文件系统管理共享包
 *
 * 提供文件管理（上传/分片/秒传/合并/删除）、分组管理、存储配置三组页面，
 * 以及后端 API 封装、路由表、静态菜单。
 *
 * 页面组件通过 registerMenuViewModules 以懒加载（异步组件）注册：
 * 后端菜单 component（如 filesystem/list/index）自动映射到本地 .vue，
 * main.ts 无需手动传路由，页面按需加载。
 */
import { registerMenuViewModules } from "@repo/core";
import "./styles/filesystem-page.css";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）
registerMenuViewModules({
  "views/filesystem/list/index.vue": () => import("./views/FileManage.vue"),
  "views/filesystem/group/index.vue": () => import("./views/GroupManage.vue"),
  "views/filesystem/filestorage/index.vue": () => import("./views/FileStorageManage.vue"),
  "views/filesystem/setting/index.vue": () => import("./views/SettingManage.vue"),
});

export { filesystemRoutes, filesystemMenus } from "./routes";
export * from "./api/types";
export * from "./api/filesystemApi";
export * from "./api/filestorageApi";