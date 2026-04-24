import type { RouteConfigsTable } from "@repo/core";

const loadSpiderHomePage = async () => (await import("../index.vue")).default;
const loadSpiderOverviewPage = async () =>
  (await import("../views/spider/overview/index.vue")).default;
const loadSpiderManagePage = async () =>
  (await import("../views/spider/manage/index.vue")).default;
const loadSpiderOrchestrationPage = async () =>
  (await import("../views/spider/orchestration/index.vue")).default;

export default [
  {
    path: "/spider",
    name: "Spider",
    redirect: "/spider/home",
    meta: {
      icon: "ri:bug-2-line",
      title: "爬虫中心",
      rank: 10,
      showLink: true,
    },
    children: [
      {
        path: "/spider/home",
        name: "SpiderHome",
        component: loadSpiderHomePage,
        meta: {
          title: "爬虫中心",
          showLink: false,
        },
      },
      {
        path: "/spider/overview",
        name: "SpiderOverview",
        component: loadSpiderOverviewPage,
        meta: {
          title: "总览",
        },
      },
      {
        path: "/spider/manage",
        name: "SpiderManage",
        component: loadSpiderManagePage,
        meta: {
          title: "爬虫管理",
        },
      },
      {
        path: "/spider/orchestration",
        name: "SpiderOrchestration",
        component: loadSpiderOrchestrationPage,
        meta: {
          title: "编排器",
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
