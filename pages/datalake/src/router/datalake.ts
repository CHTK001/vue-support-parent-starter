import type { RouteConfigsTable } from "@repo/core";

const loadPipeline = async () => (await import("../views/pipeline/index.vue")).default;
const loadData = async () => (await import("../views/data/index.vue")).default;
const loadSubscription = async () => (await import("../views/subscription/index.vue")).default;
const loadMonitor = async () => (await import("../views/monitor/index.vue")).default;
const loadDlq = async () => (await import("../views/dlq/index.vue")).default;

export default [
  {
    path: "/datalake",
    name: "Datalake",
    redirect: "/datalake/pipeline",
    meta: {
      icon: "ri:database-2-line",
      title: "数据中台",
      rank: 15,
      showLink: true,
    },
    children: [
      {
        path: "/datalake/pipeline",
        name: "DatalakePipeline",
        component: loadPipeline,
        meta: { title: "流水线管理", showLink: true },
      },
      {
        path: "/datalake/data",
        name: "DatalakeData",
        component: loadData,
        meta: { title: "数据查询", showLink: true },
      },
      {
        path: "/datalake/subscription",
        name: "DatalakeSubscription",
        component: loadSubscription,
        meta: { title: "订阅管理", showLink: true },
      },
      {
        path: "/datalake/monitor",
        name: "DatalakeMonitor",
        component: loadMonitor,
        meta: { title: "监控面板", showLink: true },
      },
      {
        path: "/datalake/dlq",
        name: "DatalakeDlq",
        component: loadDlq,
        meta: { title: "死信队列", showLink: true },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
