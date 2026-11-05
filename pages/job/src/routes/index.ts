/**
 * 调度模块路由树（@pages/job）。
 *
 * 采集与调度是两个平级系统：采集侧路由在 @pages/collect，这里只保留调度中心分组。
 * 两者由采集调度系统在 app 入口处拼装成完整菜单树。
 *
 * 后端出口是 job-starter 的治理接口 /v2/scheduler/**（见 ./api/jobApi），
 * 而不是自建台账 —— 调度只读 sys_job，采集只是共用这张表。
 */
import type { RouteConfigsTable } from "@repo/core";

/** 调度侧路由树（调度中心分组） */
export const jobRoutes: RouteConfigsTable[] = [
  {
    path: "/grp-scheduler",
    name: "GroupScheduler",
    meta: { title: "调度中心", icon: "AlarmClock", showLink: true, rank: 2 },
    children: [
      {
        // 概览页此前只登记在 index.ts 的「本地视图映射」里（key views/job/index.vue），
        // 没有任何静态路由或菜单指向它 —— 页面存在却点不到。这里给它补上入口，
        // rank 1 放在分组最前，与「先看概览再进明细」的动线一致。
        path: "/collect/job-overview",
        name: "CollectJobOverview",
        component: () => import("../views/JobOverviewView.vue"),
        meta: { title: "调度概览", icon: "DataAnalysis", showLink: true, keepAlive: true, rank: 1, isVisible: "1" },
      },
      {
        path: "/collect/job",
        name: "CollectJob",
        component: () => import("../views/JobView.vue"),
        meta: { title: "调度作业", icon: "Clock", showLink: true, keepAlive: true, rank: 2, isVisible: "1" },
      },
      {
        path: "/collect/remote-node",
        name: "CollectRemoteNode",
        component: () => import("../views/RemoteNodeView.vue"),
        meta: { title: "远程节点", icon: "Connection", showLink: true, keepAlive: true, rank: 3, isVisible: "1" },
      },
      {
        path: "/collect/job-log",
        name: "CollectJobLog",
        component: () => import("../views/JobLogView.vue"),
        meta: { title: "作业日志", icon: "Tickets", showLink: true, keepAlive: true, rank: 4, isVisible: "1" },
      },
      {
        // [临时] 设计探索沙箱：调度概览的 5 个候选方案并排对比，选定后连同
        // pages/job/src/views/ovx 整个目录与本条路由一起删除。
        path: "/collect/-ovx",
        name: "CollectJobOverviewOvx",
        component: () => import("../views/ovx/OvxVariantsView.vue"),
        meta: { title: "调度概览·方案", showLink: false },
      },
    ],
  },
];

export default jobRoutes;
