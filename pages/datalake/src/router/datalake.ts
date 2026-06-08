import type { RouteConfigsTable } from "@repo/core";

const loadBigscreen = async () => (await import("../views/bigscreen/index.vue")).default;
const loadPipeline = async () => (await import("../views/pipeline/index.vue")).default;
const loadData = async () => (await import("../views/data/index.vue")).default;
const loadCollector = async () => (await import("../views/collector/index.vue")).default;
const loadActiveCollector = async () => (await import("../views/collector/active-collector.vue")).default;
const loadSubscription = async () => (await import("../views/subscription/index.vue")).default;
const loadDlq = async () => (await import("../views/dlq/index.vue")).default;
const loadSettings = async () => (await import("../views/settings/index.vue")).default;

export default [
  {
    path: "/datalake",
    name: "Datalake",
    redirect: "/datalake/bigscreen",
    meta: {
      icon: "ri:database-2-line",
      title: "数据中台",
      rank: 15,
      showLink: true,
    },
    children: [
      {
        path: "/datalake/bigscreen",
        name: "DatalakeBigscreen",
        component: loadBigscreen,
        meta: { title: "全景大屏", showLink: true },
      },
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
        path: "/datalake/collector",
        name: "DatalakeCollector",
        component: loadCollector,
        meta: { title: "被动采集端管理", showLink: true },
      },
      {
        path: "/datalake/active-collector",
        name: "DatalakeActiveCollector",
        component: loadActiveCollector,
        meta: { title: "主动采集器管理", showLink: true },
      },
      {
        path: "/datalake/subscription",
        name: "DatalakeSubscription",
        component: loadSubscription,
        meta: { title: "订阅管理", showLink: true },
      },
      {
        path: "/datalake/dlq",
        name: "DatalakeDlq",
        component: loadDlq,
        meta: { title: "死信队列", showLink: true },
      },
      {
        path: "/datalake/settings",
        name: "DatalakeSettings",
        component: loadSettings,
        meta: { title: "系统设置", showLink: true },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;