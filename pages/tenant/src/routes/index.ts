/**
 * 租户模块路由（pages/tenant）
 *
 * 租户域从系统管理里独立出来后，面向管理员的是三件事：
 * 卖什么（服务管理：服务 + 多档规格 + 菜单/按钮配置）、
 * 谁买了（租户订阅：录入订阅 + 线下收款记账）、
 * 有哪些租户（租户管理）。路由仍挂到 koi layout 下，保留侧边栏。
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
    redirect: "/manage/tenant/service",
    meta: { title: "租户模块", icon: "OfficeBuilding", isVisible: "1" },
    children: [
      { path: "/manage/tenant/service", name: "TenantServiceManage", meta: { title: "服务管理", icon: "Goods", isVisible: "1" } },
      { path: "/manage/tenant/subscription", name: "TenantSubscription", meta: { title: "租户订阅", icon: "Tickets", isVisible: "1" } },
      { path: "/manage/tenant", name: "SystemTenant", meta: { title: "租户管理", icon: "OfficeBuilding", isVisible: "1" } },
    ],
  },
];

export const tenantRoutes: RouteConfigsTable[] = [
  {
    path: "/manage/tenant/service",
    name: "TenantServiceManage",
    component: () => import("../views/ServiceManage.vue"),
    meta: {
      title: "服务管理",
      icon: "Goods",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/manage/tenant/subscription",
    name: "TenantSubscription",
    component: () => import("../views/TenantSubscription.vue"),
    meta: {
      title: "租户订阅",
      icon: "Tickets",
      showLink: true,
      keepAlive: true,
    },
  },
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
];
