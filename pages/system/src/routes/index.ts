/**
 * 系统管理模块路由配置（pages/system）
 *
 * 一份 routes 同时承担两个角色：
 *   1) 路由表：通过 router.addRoute("layout", route) 把每个子页面挂到 koi 布局下，保留侧边栏
 *   2) 静态菜单：通过 systemMenus 导出，传入 registerStaticMenu() 让侧边栏渲染
 *
 * 注意：路由是扁平结构（直接 path=/manage/user），不是嵌套的 /manage + children 形式。
 *       这是为了适配 vue-router 的 addRoute("layout", item) 用法。
 *       侧边栏的层级用 systemMenus 的 children 表达，路由层级由 addRoute 自动平铺。
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

/**
 * 系统管理路由（叶子路由，直接挂到 koi layout 之下）
 *
 * 使用方式（在应用 main.ts）：
 *   const { context } = await createContextApp({});
 *   for (const r of systemRoutes) {
 *     context.router.addRoute("layout", r as never);
 *   }
 */
export const systemRoutes: RouteConfigsTable[] = [
  {
    path: "/manage/settings",
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
    path: "/manage/user",
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
    path: "/manage/role",
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
    path: "/manage/menu",
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
    path: "/manage/dept",
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
    path: "/manage/dict",
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
    path: "/manage/setting",
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
    // 产品级系统配置：不作为菜单，由纵向侧边栏底部"系统配置"图标按钮进入
    path: "/system/config",
    name: "SystemConfig",
    component: () => import("../views/SystemConfig.vue"),
    meta: {
      title: "系统配置",
      icon: "Setting",
      showLink: false,
      keepAlive: true,
    },
  },
  {
    path: "/manage/announcement",
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
    path: "/manage/feedback",
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
    path: "/manage/post",
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
    path: "/manage/message",
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
    path: "/monitor/redis",
    name: "MonitorRedis",
    component: () => import("../views/monitor/RedisMonitor.vue"),
    meta: {
      title: "Redis 监控",
      icon: "Coin",
      showLink: false,
      keepAlive: true,
    },
  },
  {
    path: "/monitor/cache",
    name: "MonitorCache",
    component: () => import("../views/monitor/CacheMonitor.vue"),
    meta: {
      title: "缓存监控",
      icon: "Histogram",
      showLink: false,
      keepAlive: true,
    },
  },
  {
    path: "/monitor/server",
    name: "MonitorServer",
    component: () => import("../views/monitor/ServerMonitor.vue"),
    meta: {
      title: "监控大屏",
      icon: "Cpu",
      showLink: false,
      keepAlive: true,
    },
  },
  {
    path: "/monitor/policy",
    name: "MonitorPolicy",
    component: () => import("../views/monitor/PolicyTask.vue"),
    meta: {
      title: "策略控制台",
      icon: "Setting",
      showLink: false,
      keepAlive: true,
    },
  },
];

/**
 * 远程菜单不可用时的兜底菜单。
 *
 * `meta.isRemoteFallback = true` 的根节点只作为降级显示：后端 /v2/user/menu
 * 成功返回时会被过滤，避免与远程菜单重复。
 */
export const systemMenus: StaticMenuItem[] = [
  {
    path: "/home",
    name: "homePage",
    meta: { title: "工作台", icon: "koi-work", isVisible: "1", isRemoteFallback: true },
  },
  {
    path: "/manage",
    name: "System",
    redirect: "/manage/user",
    meta: { title: "系统管理", icon: "Setting", isVisible: "1", isRemoteFallback: true },
    children: [
      { path: "/manage/user", name: "SystemUser", meta: { title: "用户管理", icon: "User", isVisible: "1" } },
      { path: "/manage/role", name: "SystemRole", meta: { title: "角色管理", icon: "UserFilled", isVisible: "1" } },
      { path: "/manage/menu", name: "SystemMenu", meta: { title: "菜单管理", icon: "Menu", isVisible: "1" } },
      { path: "/manage/dept", name: "SystemDept", meta: { title: "机构管理", icon: "OfficeBuilding", isVisible: "1" } },
      { path: "/manage/dict", name: "SystemDict", meta: { title: "字典管理", icon: "Collection", isVisible: "1" } },
      { path: "/manage/setting", name: "SystemSetting", meta: { title: "参数配置", icon: "Tools", isVisible: "1" } },
      { path: "/manage/announcement", name: "SystemAnnouncement", meta: { title: "公告管理", icon: "Bell", isVisible: "1" } },
      { path: "/manage/feedback", name: "SystemFeedback", meta: { title: "反馈管理", icon: "ChatLineSquare", isVisible: "1" } },
      { path: "/manage/post", name: "SystemPost", meta: { title: "岗位管理", icon: "Postcard", isVisible: "1" } },
      { path: "/manage/message", name: "SystemMessage", meta: { title: "消息管理", icon: "Message", isVisible: "1" } },
    ],
  },
  {
    path: "/monitor",
    name: "Monitor",
    redirect: "/monitor/server",
    meta: { title: "监控管理", icon: "Monitor", isVisible: "1", isRemoteFallback: true },
    children: [
      { path: "/monitor/server", name: "MonitorServer", meta: { title: "监控大屏", icon: "Cpu", isVisible: "1" } },
      { path: "/monitor/redis", name: "MonitorRedis", meta: { title: "Redis 监控", icon: "Coin", isVisible: "1" } },
      { path: "/monitor/cache", name: "MonitorCache", meta: { title: "缓存监控", icon: "Histogram", isVisible: "1" } },
      { path: "/monitor/policy", name: "MonitorPolicy", meta: { title: "策略控制台", icon: "Setting", isVisible: "1" } },
    ],
  },
];
