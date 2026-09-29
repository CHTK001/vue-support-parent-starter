/**
 * 采集调度系统宿主路由（跨系统的部分）。
 *
 * 这里只放两边都不专属的路由：平台总览（同时展示采集与调度指标）与 /home 重定向。
 * 采集侧路由在 @pages/collect，调度侧在 @pages/job，由 main.ts 合并。
 *
 * 之所以不把平台总览塞进任一侧：它既读采集指标（流程/任务/结果/变量/数据源）
 * 又读调度概览（/v2/scheduler/summary），放哪边都会造成两个 pages 互相依赖成环。
 * 这与后端把「调度控制台」放在系统模块而非采集/调度模块是同一个道理。
 */
import type { RouteConfigsTable } from "@repo/core";

/** 宿主层路由树（平台总览 + 首页重定向） */
export const hostRoutes: RouteConfigsTable[] = [
  {
    // 框架登录成功跳的是常量 HOME_URL（/home），这里接回平台总览，否则登录后落 404
    path: "/home",
    name: "CollectHome",
    redirect: "/collect/dashboard",
    meta: { title: "平台首页", showLink: false },
  },
  {
    path: "/collect/dashboard",
    name: "CollectDashboard",
    component: () => import("./views/DashboardView.vue"),
    meta: { title: "平台总览", icon: "Odometer", showLink: true, keepAlive: true, rank: 0, isVisible: "1" },
  },
];

export default hostRoutes;
