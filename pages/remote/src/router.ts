import type { RouteRecordRaw } from "vue-router";
import { RouterView } from "vue-router";

const routes = [
  {
    path: "/",
    name: "RemoteLayout",
    component: async () => import("@layout/default"),
    redirect: "/remote/control",
    meta: {
      title: "远程控制",
      showLink: false,
    },
    children: [
      {
        path: "/remote",
        name: "RemoteManagement",
        component: RouterView,
        redirect: "/remote/control",
        meta: {
          title: "远程控制",
          icon: "mdi:remote-desktop",
          rank: 10,
        },
        children: [
          {
            path: "/remote/control",
            name: "RemoteControl",
            component: async () => import("./views/remote/index.vue"),
            meta: {
              title: "远程控制中心",
              icon: "mdi:remote-tv",
            },
          },
          {
            path: "/remote/monitor",
            name: "SessionMonitor",
            component: async () => import("./views/monitor/index.vue"),
            meta: {
              title: "会话监控",
              icon: "mdi:monitor-dashboard",
            },
          },
          {
            path: "/remote/config",
            name: "GatewayConfig",
            component: async () => import("./views/config/index.vue"),
            meta: {
              title: "网关配置",
              icon: "mdi:cog-outline",
            },
          },
        ],
      },
      {
        path: "/conference/join",
        name: "ConferenceJoin",
        component: async () => import("./views/conference-join/index.vue"),
        meta: {
          title: "加入会议",
          showLink: false,
        },
      },
    ],
  },
] satisfies Array<RouteRecordRaw>;

export default routes;
