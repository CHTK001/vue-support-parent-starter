/**
 * 文件系统管理模块路由配置（@pages/filesystem）
 *
 * 一份 routes 同时承担两个角色：
 *   1) 路由表：通过 router.addRoute("layout", route) 把每个子页面挂到 koi 布局下
 *   2) 静态菜单：通过 filesystemMenus 导出，传入 registerStaticMenu() 驱动侧边栏
 *
 * 路由是扁平结构（直接 path=/filesystem/xxx），适配 addRoute("layout", item)。
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

/**
 * 文件系统管理路由（叶子路由，直接挂到 koi layout 之下）
 *
 * 使用方式（在应用 main.ts）：
 *   const { context } = await createContextApp({});
 *   for (const r of filesystemRoutes) {
 *     context.router.addRoute("layout", r as never);
 *   }
 */
export const filesystemRoutes: RouteConfigsTable[] = [
  {
    path: "/filesystem/list",
    name: "FileSystemList",
    component: () => import("../views/FileManage.vue"),
    meta: {
      title: "文件管理",
      icon: "FolderOpened",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/filesystem/group",
    name: "FileSystemGroup",
    component: () => import("../views/GroupManage.vue"),
    meta: {
      title: "分组管理",
      icon: "Files",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/filesystem/setting",
    name: "FileSystemSetting",
    component: () => import("../views/SettingManage.vue"),
    meta: {
      title: "存储配置",
      icon: "Setting",
      showLink: true,
      keepAlive: true,
    },
  },
];

/**
 * 静态菜单（用于 registerStaticMenu，驱动侧边栏）
 */
export const filesystemMenus: StaticMenuItem[] = [
  {
    path: "/filesystem",
    name: "FileSystem",
    redirect: "/filesystem/list",
    meta: { title: "文件系统", icon: "FolderOpened", isVisible: "1" },
    children: [
      {
        path: "/filesystem/list",
        name: "FileSystemList",
        meta: { title: "文件管理", icon: "FolderOpened", isVisible: "1" },
      },
      {
        path: "/filesystem/group",
        name: "FileSystemGroup",
        meta: { title: "分组管理", icon: "Files", isVisible: "1" },
      },
      {
        path: "/filesystem/setting",
        name: "FileSystemSetting",
        meta: { title: "存储配置", icon: "Setting", isVisible: "1" },
      },
    ],
  },
];