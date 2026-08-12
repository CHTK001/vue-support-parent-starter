/**
 * 文件系统管理模块路由配置（@pages/filesystem）
 *
 * 嵌套结构：/filesystem 父节点 + 叶子子路由。
 * 父节点无 component（仅 redirect），叶子节点挂到 koi layout 下。
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

export const filesystemRoutes: RouteConfigsTable[] = [
  {
    path: "/filesystem",
    name: "FileSystem",
    redirect: "/filesystem/list",
    meta: {
      title: "文件系统",
      icon: "FolderOpened",
      showLink: true,
    },
    children: [
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
    ],
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