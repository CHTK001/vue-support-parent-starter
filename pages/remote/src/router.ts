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
        ],
      },
    ],
  },
] satisfies Array<RouteRecordRaw>;

export default routes;
