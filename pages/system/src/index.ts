/**
 * @pages/system —— 系统管理共享包
 *
 * 提供系统管理与监控管理页面，以及后端 API 封装、路由表、静态菜单。
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
  "views/system/tenant/index.vue": () => import("./views/TenantManage.vue"),
  "views/system/role/index.vue": () => import("./views/RoleManage.vue"),
  "views/system/menu/index.vue": () => import("./views/MenuManage.vue"),
  "views/system/dept/index.vue": () => import("./views/DeptManage.vue"),
  "views/system/dict/index.vue": () => import("./views/DictManage.vue"),
  "views/system/setting/index.vue": () => import("./views/SettingManage.vue"),
  "views/system/settings/index.vue": () => import("./views/PersonalSettings.vue"),
  "views/system/feedback/index.vue": () => import("./views/FeedbackManage.vue"),
  "views/system/userlog/index.vue": () => import("./views/UserLogManage.vue"),
  "views/system/syslog/index.vue": () => import("./views/SysLogManage.vue"),
  "views/system/announcement/index.vue": () => import("./views/AnnouncementManage.vue"),
  "views/system/post/index.vue": () => import("./views/PostManage.vue"),
  "views/system/message/index.vue": () => import("./views/MessageManage.vue"),
  "views/system/online/index.vue": () => import("./views/OnlineUserManage.vue"),
  "views/system/monitor/redis/index.vue": () => import("./views/monitor/RedisMonitor.vue"),
  "views/system/monitor/cache/index.vue": () => import("./views/monitor/CacheMonitor.vue"),
  "views/system/monitor/server/index.vue": () => import("./views/monitor/ServerMonitor.vue"),
  "views/system/monitor/policy/index.vue": () => import("./views/monitor/PolicyTask.vue"),
});

export { systemRoutes, systemMenus } from "./routes";
export * from "./api/types";
export * from "./api/systemApi";
/**
 * 监控大屏动态卡片扩展点
 *
 * <p>其他 {@code pages/xx} 模块可在 {@code main.ts} 里
 * {@code registerMonitorCards([...])} 贡献自己的卡片。</p>
 *
 * <p>刻意从 {@code cards/registry} 而不是 {@code cards/index} 导出：后者会
 * re-export {@code MonitorCardBoard.vue}，那会把整张看板（及其所有卡片）拉进
 * 应用主包，破坏监控页按需加载。注册表本身是纯 TS，注册动作只是往 Map 里塞几条元数据。</p>
 */
export {
  registerMonitorCards,
  defineMonitorCardContribution,
  monitorCardCatalog,
  getMonitorCardRegistration,
  type MonitorCardRegistration,
} from "./views/monitor/cards/registry";
export type { MonitorCardItem, MonitorCardSourceConfig } from "./views/monitor/cards/types";
