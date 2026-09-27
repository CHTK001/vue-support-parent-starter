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
    ],
  },
];

export default jobRoutes;
