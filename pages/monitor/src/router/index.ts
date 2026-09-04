import type { RouteConfigsTable } from "@repo/core";

export const monitorRoutes: RouteConfigsTable[] = [
  {
    path: "/monitor",
    name: "Monitor",
    redirect: "/monitor/overview",
    meta: { title: "监控管理", icon: "DataLine", showLink: true },
    children: [
      {
        path: "/monitor/overview",
        name: "MonitorOverview",
        component: () => import("../views/overview/ReOverview.vue"),
        meta: { title: "监控概览", icon: "DataLine", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/dashboard",
        name: "MonitorServerDashboard",
        component: () => import("../views/dashboard/ReServerDashboard.vue"),
        meta: { title: "服务器仪表盘", icon: "Odometer", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/assets",
        name: "MonitorAssets",
        component: () => import("../views/ReAssetList.vue"),
        meta: { title: "资产管理", icon: "Files", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/snippets",
        name: "MonitorSnippets",
        component: () => import("../views/ReTerminalSnippetManager.vue"),
        meta: { title: "命令片段", icon: "Document", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/alarm",
        name: "MonitorAlarm",
        component: () => import("../views/alarm/ReAlarmTab.vue"),
        meta: { title: "告警管理", icon: "Bell", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/redis",
        name: "MonitorRedis",
        component: () => import("../views/redis/ReRedisManager.vue"),
        meta: { title: "Redis 管理", icon: "Coin", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/redis-monitor",
        name: "MonitorRedisDashboard",
        component: () => import("../views/redis-monitor/ReRedisDashboard.vue"),
        meta: { title: "Redis 监控", icon: "Coin", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/cache",
        name: "MonitorCache",
        component: () => import("../views/cache/ReCacheMonitor.vue"),
        meta: { title: "缓存监控", icon: "List", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/tasks",
        name: "MonitorTasks",
        component: () => import("../views/tasks/ReTaskList.vue"),
        meta: { title: "任务管理", icon: "Timer", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/agents",
        name: "MonitorAgents",
        component: () => import("../views/agents/ReAgentList.vue"),
        meta: { title: "Agent 管理", icon: "Monitor", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/tshark",
        name: "MonitorTshark",
        component: () => import("../views/tshark/ReTsharkCapture.vue"),
        meta: { title: "抓包分析", icon: "Search", showLink: true, keepAlive: true },
      },
      {
        path: "/monitor/config",
        name: "MonitorConfig",
        component: () => import("../views/config/ReConfigPanel.vue"),
        meta: { title: "监控配置", icon: "Setting", showLink: true, keepAlive: true },
      },
    ],
  },
];