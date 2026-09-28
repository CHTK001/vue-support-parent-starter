/**
 * 采集调度一体化平台路由树（RouteConfigsTable[]）。
 *
 * 一级为分组节点（无 component，只作侧边栏分组），二级为业务页面。
 * 业务页面统一挂在 koi layout 之下，菜单由本树推导，无需另配静态菜单。
 *
 * 路由模式：hash（见 main.ts 的 routerMode）。
 *
 * 数据源台账已统一到 @pages/datasource，页面与 API 都只此一份。
 */
import type { RouteConfigsTable } from "@repo/core";

/** 采集调度一体化平台路由树 */
export const collectRoutes: RouteConfigsTable[] = [
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
  {
    path: "/grp-collect",
    name: "GroupCollect",
    meta: { title: "数据采集", icon: "Download", showLink: true, rank: 1 },
    children: [
      {
        path: "/collect/design",
        name: "CollectDesign",
        component: () => import("./views/FlowView.vue"),
        meta: { title: "流程设计", icon: "Share", showLink: true, keepAlive: true, rank: 1, isVisible: "1" },
      },
      {
        path: "/collect/task",
        name: "CollectTask",
        component: () => import("./views/TaskView.vue"),
        meta: { title: "任务监控", icon: "Timer", showLink: true, keepAlive: true, rank: 2, isVisible: "1" },
      },
      {
        path: "/collect/record",
        name: "CollectRecord",
        component: () => import("./views/RecordView.vue"),
        meta: { title: "采集结果", icon: "Files", showLink: true, keepAlive: true, rank: 3, isVisible: "1" },
      },
      {
        path: "/collect/variable",
        name: "CollectVariable",
        component: () => import("./views/VariableView.vue"),
        meta: { title: "变量管理", icon: "SetUp", showLink: true, keepAlive: true, rank: 4, isVisible: "1" },
      },
      {
        // 数据源台账只有一份实现：@pages/datasource（对接数据源中心 /ms/datasource）
        path: "/collect/datasource/list",
        name: "CollectDatasourceList",
        component: () => import("@pages/datasource/src/views/ScDataSourceView.vue"),
        meta: { title: "数据源", icon: "Coin", showLink: true, keepAlive: true, rank: 5, isVisible: "1" },
      },
      {
        path: "/collect/function",
        name: "CollectFunction",
        component: () => import("./views/FunctionView.vue"),
        meta: { title: "函数库", icon: "Operation", showLink: true, keepAlive: true, rank: 6, isVisible: "1" },
      },
      {
        path: "/collect/notice",
        name: "CollectNotice",
        component: () => import("./views/NoticeView.vue"),
        meta: { title: "执行通知", icon: "Bell", showLink: true, keepAlive: true, rank: 7, isVisible: "1" },
      },
    ],
  },
  {
    path: "/grp-scheduler",
    name: "GroupScheduler",
    meta: { title: "调度中心", icon: "AlarmClock", showLink: true, rank: 2 },
    children: [
      {
        path: "/collect/job",
        name: "CollectJob",
        component: () => import("./views/JobView.vue"),
        meta: { title: "调度作业", icon: "Clock", showLink: true, keepAlive: true, rank: 2, isVisible: "1" },
      },
      {
        path: "/collect/remote-node",
        name: "CollectRemoteNode",
        component: () => import("./views/RemoteNodeView.vue"),
        meta: { title: "远程节点", icon: "Connection", showLink: true, keepAlive: true, rank: 3, isVisible: "1" },
      },
      {
        path: "/collect/job-log",
        name: "CollectJobLog",
        component: () => import("./views/JobLogView.vue"),
        meta: { title: "作业日志", icon: "Tickets", showLink: true, keepAlive: true, rank: 4, isVisible: "1" },
      },
    ],
  },
];

export default collectRoutes;
