/**
 * 租户模块路由（pages/tenant）
 *
 * 租户域从系统管理里独立出来后，ReFlow 编排架构这类“租户能力视图”放在本模块，
 * 不再继续堆进 pages/system。路由仍挂到 koi layout 下，保留侧边栏。
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

/**
 * 租户模块有自己的菜单根节点，不再挂在「系统管理」下。
 *
 * 不设置 isRemoteFallback：即使后端远程菜单已返回，这个根节点也应保留，
 * 否则新增的租户能力页会被远程菜单覆盖掉。
 */
export const tenantMenus: StaticMenuItem[] = [
  {
    path: "/tenant",
    name: "TenantModule",
    redirect: "/manage/tenant",
    meta: { title: "租户模块", icon: "OfficeBuilding", isVisible: "1" },
    children: [
      { path: "/manage/tenant", name: "SystemTenant", meta: { title: "租户管理", icon: "OfficeBuilding", isVisible: "1" } },
      { path: "/manage/tenant/reflow-orchestration", name: "TenantReFlowOrchestration", meta: { title: "ReFlow 编排架构", icon: "Share", isVisible: "1" } },
    ],
  },
];

export const tenantRoutes: RouteConfigsTable[] = [
  {
    path: "/manage/tenant",
    name: "SystemTenant",
    component: () => import("../views/TenantManage.vue"),
    meta: {
      title: "租户管理",
      icon: "OfficeBuilding",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/manage/tenant/reflow-orchestration",
    name: "TenantReFlowOrchestration",
    component: () => import("../views/ReFlowOrchestration.vue"),
    meta: {
      title: "ReFlow 编排架构",
      icon: "Share",
      showLink: true,
      keepAlive: true,
    },
  },
];
