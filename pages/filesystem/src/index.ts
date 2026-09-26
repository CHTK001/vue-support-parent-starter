/**
 * @pages/filesystem —— 文件系统管理共享包
 *
 * 页面：
 *   1) 文件服务器 —— 对接独立文件存储服务（默认 http://127.0.0.1:18080）的对象浏览与管理
 *
 * 页面组件通过 registerMenuViewModules 以懒加载（异步组件）注册：
 * 后端菜单 component（如 filesystem/filestorage/index）自动映射到本地 .vue，
 * main.ts 无需手动传路由，页面按需加载。
 */
import { registerMenuViewModules } from "@repo/core";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）
registerMenuViewModules({
  "views/filesystem/filestorage/index.vue": () => import("./views/FileStorageManage.vue"),
});

export * from "./api/filestorageApi";
