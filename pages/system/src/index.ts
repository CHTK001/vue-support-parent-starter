/**
 * @pages/system —— 系统管理共享包
 *
 * 提供 8 个核心管理页面：用户/角色/菜单/部门/字典/在线用户/系统设置，
 * 以及后端 API 封装、路由表、静态菜单。
 *
 * 菜单由后端 /v2/user/menu 提供（route.mode=remote），页面组件通过
 * registerMenuViewModules 以懒加载（异步组件）注册：后端菜单 component
 * （如 system/user/index）自动映射到本地 .vue，main.ts 无需手动传路由，
 * 页面按需加载、不预载全部。
 */
import { registerMenuViewModules } from "@repo/core";
import "./styles/system-page.css";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）
registerMenuViewModules({
  "views/system/user/index.vue": () => import("./views/UserManage.vue"),
  "views/system/role/index.vue": () => import("./views/RoleManage.vue"),
  "views/system/menu/index.vue": () => import("./views/MenuManage.vue"),
  "views/system/dept/index.vue": () => import("./views/DeptManage.vue"),
  "views/system/dict/index.vue": () => import("./views/DictManage.vue"),
  "views/system/online/index.vue": () => import("./views/OnlineUser.vue"),
  "views/system/setting/index.vue": () => import("./views/SettingManage.vue"),
  "views/system/personage/index.vue": () => import("./views/Personage.vue"),
  "views/system/settings/index.vue": () => import("./views/PersonalSettings.vue"),
  "views/system/feedback/index.vue": () => import("./views/FeedbackManage.vue"),
  "views/system/userlog/index.vue": () => import("./views/UserLogManage.vue"),
  "views/system/syslog/index.vue": () => import("./views/SysLogManage.vue"),
  "views/system/tenant/index.vue": () => import("./views/TenantManage.vue"),
  "views/system/announcement/index.vue": () => import("./views/AnnouncementManage.vue"),
  "views/system/post/index.vue": () => import("./views/PostManage.vue"),
  "views/system/cache/index.vue": () => import("./views/CacheManage.vue"),
  "views/system/message/index.vue": () => import("./views/MessageManage.vue"),
  "views/system/errorlog/index.vue": () => import("./views/ErrorLogManage.vue"),
  "views/system/ip/index.vue": () => import("./views/IpManage.vue"),
  "views/system/monitor/index.vue": () => import("./views/MonitorManage.vue"),
});

export { systemRoutes, systemMenus } from "./routes";
export * from "./api/types";
export * from "./api/systemApi";
