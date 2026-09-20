/**
 * 系统管理模块路由配置（@pages/system）
 *
 * 一份 routes 同时承担两个角色：
 *   1) 路由表：通过 router.addRoute("layout", route) 把每个子页面挂到布局下，保留侧边栏
 *   2) 静态菜单：通过 systemMenus 导出，传入 registerStaticMenu() 让侧边栏渲染
 *
 * 注意：路由是扁平结构（直接 path=/user），不是嵌套的 /system + children 形式。
 *       这是为了适配 vue-router 的 addRoute("layout", item) 用法。
 *       侧边栏的层级由 systemMenus 的 children 表达，路由层级由 addRoute 自动平铺。
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

/**
 * 系统管理路由（叶子路由，直接挂到 layout 之下）
 *
 * 使用方式（在应用 main.ts）：
 *   const { context } = await createContextApp({});
 *   for (const r of systemRoutes) {
 *     context.router.addRoute("layout", r as never);
 *   }
 */
export const systemRoutes: RouteConfigsTable[] = [
  {
    path: "/settings",
    name: "SystemSettings",
    component: () => import("../views/PersonalSettings.vue"),
    meta: {
      title: "个人设置",
      icon: "Setting",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/user",
    name: "SystemUser",
    component: () => import("../views/UserManage.vue"),
    meta: {
      title: "menu.system.user.name",
      icon: "User",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/role",
    name: "SystemRole",
    component: () => import("../views/RoleManage.vue"),
    meta: {
      title: "menu.system.role.name",
      icon: "UserFilled",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/menu",
    name: "SystemMenu",
    component: () => import("../views/MenuManage.vue"),
    meta: {
      title: "menu.system.menu.name",
      icon: "Menu",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/dept",
    name: "SystemDept",
    component: () => import("../views/DeptManage.vue"),
    meta: {
      title: "menu.system.dept.name",
      icon: "OfficeBuilding",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/dict",
    name: "SystemDict",
    component: () => import("../views/DictManage.vue"),
    meta: {
      title: "menu.system.dictType.name",
      icon: "Collection",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/online",
    name: "SystemOnline",
    component: () => import("../views/OnlineUser.vue"),
    meta: {
      title: "menu.monitor.online.name",
      icon: "Connection",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/setting",
    name: "SystemSetting",
    component: () => import("../views/SettingManage.vue"),
    meta: {
      title: "menu.tools.config.name",
      icon: "Tools",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/announcement",
    name: "SystemAnnouncement",
    component: () => import("../views/AnnouncementManage.vue"),
    meta: {
      title: "公告管理",
      icon: "Bell",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/feedback",
    name: "SystemFeedback",
    component: () => import("../views/FeedbackManage.vue"),
    meta: {
      title: "反馈管理",
      icon: "ChatLineSquare",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/post",
    name: "SystemPost",
    component: () => import("../views/PostManage.vue"),
    meta: {
      title: "岗位管理",
      icon: "Postcard",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/message",
    name: "SystemMessage",
    component: () => import("../views/MessageManage.vue"),
    meta: {
      title: "消息管理",
      icon: "Message",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/error-log",
    name: "SystemErrorLog",
    component: () => import("../views/ErrorLogManage.vue"),
    meta: {
      title: "异常日志",
      icon: "Warning",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/cache",
    name: "SystemCache",
    component: () => import("../views/CacheManage.vue"),
    meta: {
      title: "缓存管理",
      icon: "Coin",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/ip",
    name: "SystemIp",
    component: () => import("../views/IpManage.vue"),
    meta: {
      title: "IP管理",
      icon: "Lock",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/monitor",
    name: "SystemMonitor",
    component: () => import("../views/MonitorManage.vue"),
    meta: {
      title: "系统监控",
      icon: "Monitor",
      showLink: true,
      keepAlive: true,
    },
  },
];

/**
 * 静态菜单（用于 registerStaticMenu，驱动侧边栏）
 *
 * 父级"系统管理"节点 + 15 个子节点，结构与 systemRoutes 对应。
 */
export const systemMenus: StaticMenuItem[] = [
  {
    path: "/system",
    name: "System",
    redirect: "/system/user",
    meta: { title: "menu.system.auth", icon: "Setting", isVisible: "1" },
    children: [
      {
        path: "/user",
        name: "SystemUser",
        meta: { title: "menu.system.user.name", icon: "User", isVisible: "1" },
      },
      {
        path: "/role",
        name: "SystemRole",
        meta: { title: "menu.system.role.name", icon: "UserFilled", isVisible: "1" },
      },
      {
        path: "/menu",
        name: "SystemMenu",
        meta: { title: "menu.system.menu.name", icon: "Menu", isVisible: "1" },
      },
      {
        path: "/dept",
        name: "SystemDept",
        meta: { title: "menu.system.dept.name", icon: "OfficeBuilding", isVisible: "1" },
      },
      {
        path: "/dict",
        name: "SystemDict",
        meta: { title: "menu.system.dictType.name", icon: "Collection", isVisible: "1" },
      },
      {
        path: "/online",
        name: "SystemOnline",
        meta: { title: "menu.monitor.online.name", icon: "Connection", isVisible: "1" },
      },
      {
        path: "/setting",
        name: "SystemSetting",
        meta: { title: "menu.tools.config.name", icon: "Tools", isVisible: "1" },
      },
      {
        path: "/announcement",
        name: "SystemAnnouncement",
        meta: { title: "公告管理", icon: "Bell", isVisible: "1" },
      },
      {
        path: "/feedback",
        name: "SystemFeedback",
        meta: { title: "反馈管理", icon: "ChatLineSquare", isVisible: "1" },
      },
      {
        path: "/post",
        name: "SystemPost",
        meta: { title: "岗位管理", icon: "Postcard", isVisible: "1" },
      },
      {
        path: "/message",
        name: "SystemMessage",
        meta: { title: "消息管理", icon: "Message", isVisible: "1" },
      },
      {
        path: "/error-log",
        name: "SystemErrorLog",
        meta: { title: "异常日志", icon: "Warning", isVisible: "1" },
      },
      {
        path: "/cache",
        name: "SystemCache",
        meta: { title: "缓存管理", icon: "Coin", isVisible: "1" },
      },
      {
        path: "/ip",
        name: "SystemIp",
        meta: { title: "IP管理", icon: "Lock", isVisible: "1" },
      },
      {
        path: "/monitor",
        name: "SystemMonitor",
        meta: { title: "系统监控", icon: "Monitor", isVisible: "1" },
      },
    ],
  },
];
