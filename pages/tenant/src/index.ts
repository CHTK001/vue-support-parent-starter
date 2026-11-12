/**
 * 租户模块（pages/tenant）
 *
 * 只导出路由和租户域视图，不把 ReFlow 编排页做成系统管理页。
 */
import { registerMenuViewModules } from "@repo/core";

// 后端菜单 component 仍沿用 views/system/tenant/index.vue，迁移后在这里注册，
// 避免 pages/system 继续持有租户首页的组件引用。
registerMenuViewModules({
  "views/system/tenant/index.vue": () => import("./views/TenantManage.vue"),
});

export * from "./routes";
