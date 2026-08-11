import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

export const hotsportRoutes: RouteConfigsTable[] = [
  {
    path: "/hotsport/dashboard",
    name: "HotsportDashboard",
    component: () => import("../views/Dashboard.vue"),
    meta: { title: "menu.hotsport.dashboard", icon: "DataLine", showLink: true, keepAlive: true },
  },
  {
    path: "/hotsport/traces",
    name: "HotsportTraces",
    component: () => import("../views/Traces.vue"),
    meta: { title: "menu.hotsport.traces", icon: "Document", showLink: true, keepAlive: true },
  },
  {
    path: "/hotsport/dependencies",
    name: "HotsportDependencies",
    component: () => import("../views/Dependencies.vue"),
    meta: { title: "menu.hotsport.dependencies", icon: "Share", showLink: true, keepAlive: true },
  },
  {
    path: "/hotsport/leaks",
    name: "HotsportLeaks",
    component: () => import("../views/Leaks.vue"),
    meta: { title: "menu.hotsport.leaks", icon: "Warning", showLink: true, keepAlive: true },
  },
];

export const hotsportMenus: StaticMenuItem[] = [
  {
    path: "/hotsport",
    name: "Hotsport",
    redirect: "/hotsport/dashboard",
    meta: { title: "menu.hotsport", icon: "Monitor", isVisible: "1" },
    children: [
      {
        path: "/hotsport/dashboard",
        name: "HotsportDashboard",
        meta: { title: "menu.hotsport.dashboard", icon: "DataLine", isVisible: "1" },
      },
      {
        path: "/hotsport/traces",
        name: "HotsportTraces",
        meta: { title: "menu.hotsport.traces", icon: "Document", isVisible: "1" },
      },
      {
        path: "/hotsport/dependencies",
        name: "HotsportDependencies",
        meta: { title: "menu.hotsport.dependencies", icon: "Share", isVisible: "1" },
      },
      {
        path: "/hotsport/leaks",
        name: "HotsportLeaks",
        meta: { title: "menu.hotsport.leaks", icon: "Warning", isVisible: "1" },
      },
    ],
  },
];