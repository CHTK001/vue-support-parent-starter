/**
 * 采集调度系统宿主路由（跨系统的部分）。
 *
 * <p><strong>为什么这里允许放宿主层视图</strong>：本文件只放<b>跨系统聚合页</b>，
 * 即同时依赖两个以上 pages 包、无法归到单侧而不引入包间环依赖的页面。
 * 平台总览（DashboardView）同时读采集、调度、数据源三侧数据，放 @pages/collect
 * 或 @pages/job 任一侧都会造成互相依赖成环；因此它作为「app 级聚合视图」
 * 留在宿主，属于业务归 pages 约定的显式例外，不是业务副本。</p>
 *
 * <p>数据源管理页的合并同理：路由表与「类型→路径」映射在 @pages/datasource 声明，
 * 本文件只做合并，不抄第二份。</p>
 *
 * <p>采集侧路由在 @pages/collect，调度侧在 @pages/job，三者都由 main.ts 合并。</p>
 *
 * <p>为什么不把平台总览塞进任一侧：它既读采集指标（流程/任务/结果/变量/数据源）
 * 又读调度概览（/v2/scheduler/summary），放哪边都会造成两个 pages 互相依赖成环。
 * 这与后端把「调度控制台」放在系统模块而非采集/调度模块是同一个道理。</p>
 */
import type { RouteConfigsTable } from "@repo/core";
// 深导入 src/routes 而不是包根：包根 index.ts 有 registerMenuViewModules 顶层副作用，
// 会把整个 api/组件桶拖进主 chunk；本文件只需要路由工厂。
import { createDatasourceManageRoutes } from "@pages/datasource/src/routes";

/** 宿主层路由树（平台总览 + 首页重定向 + 数据源管理页） */
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
  // 数据源管理页（隐藏路由，由数据源列表的「打开管理」进入）。
  // 路由表与「类型→路径」映射都在 @pages/datasource 里声明，本文件只做合并 ——
  // 以前这里自己抄一份，抄漏了 Prometheus，于是只有 Prometheus 数据源点「打开管理」
  // 会弹「当前应用未注册 /prometheus 管理页」。抄两份必然漂，改成收敛到模块一处。
  ...createDatasourceManageRoutes({ activeMenu: "/collect/datasource/list" }),
];

export default hostRoutes;
