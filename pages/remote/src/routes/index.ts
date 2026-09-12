import type { RouteConfigsTable } from "@repo/core";

export const remoteRoutes: RouteConfigsTable[] = [
  {
    path: "/remote",
    name: "Remote",
    redirect: "/remote/control",
    meta: { title: "远程控制", icon: "Connection", showLink: true },
    children: [
      {
        path: "/remote/control",
        name: "RemoteControl",
        component: () => import("../views/ScRemoteControl.vue"),
        meta: { title: "远程连接", icon: "Connection", showLink: true, keepAlive: true },
      },
    ],
  },
];
