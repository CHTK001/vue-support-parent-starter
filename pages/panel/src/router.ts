import type { RouteConfigsTable } from "@repo/core";

const loadPanelPage = async () => (await import("./index.vue")).default;

export default [
  {
    path: "/panel",
    name: "Panel",
    redirect: "/panel/home",
    meta: {
      icon: "ri:database-2-line",
      title: "数据源",
      rank: 10,
      showLink: true,
    },
    children: [
      {
        path: "/panel/home",
        name: "PanelHome",
        component: loadPanelPage,
        meta: {
          title: "数据源面板",
          showLink: true,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
