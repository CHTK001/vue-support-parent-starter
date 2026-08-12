import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

export const hotsportRoutes: RouteConfigsTable[] = [
  {
    path: "/hotsport/dashboard",
    name: "HotsportDashboard",
    component: () => import("../views/Dashboard.vue"),
    meta: { title: "menu.hotsport.dashboard.name", icon: "DataLine", showLink: true, keepAlive: true },
  },
  {
    path: "/hotsport/traces",
    name: "HotsportTraces",
    component: () => import("../views/Traces.vue"),
    meta: { title: "menu.hotsport.traces.name", icon: "Document", showLink: true, keepAlive: true },
  },
  {
    path: "/hotsport/dependencies",
    name: "HotsportDependencies",
    component: () => import("../views/Dependencies.vue"),
    meta: { title: "menu.hotsport.dependencies.name", icon: "Share", showLink: true, keepAlive: true },
  },
  {
    path: "/hotsport/leaks",
    name: "HotsportLeaks",
    component: () => import("../views/Leaks.vue"),
    meta: { title: "menu.hotsport.leaks.name", icon: "Warning", showLink: true, keepAlive: true },
  },
];

export const hotsportMenus: StaticMenuItem[] = [
  {
    path: "/hotsport",
    name: "Hotsport",
    redirect: "/hotsport/dashboard",
    meta: { title: "menu.hotsport.auth", icon: "Monitor", isVisible: "1" },
    children: [
      {
        path: "/hotsport/dashboard",
        name: "HotsportDashboard",
        meta: { title: "menu.hotsport.dashboard.name", icon: "DataLine", isVisible: "1" },
      },
      {
        path: "/hotsport/traces",
        name: "HotsportTraces",
        meta: { title: "menu.hotsport.traces.name", icon: "Document", isVisible: "1" },
      },
      {
        path: "/hotsport/dependencies",
        name: "HotsportDependencies",
        meta: { title: "menu.hotsport.dependencies.name", icon: "Share", isVisible: "1" },
      },
      {
        path: "/hotsport/leaks",
        name: "HotsportLeaks",
        meta: { title: "menu.hotsport.leaks.name", icon: "Warning", isVisible: "1" },
      },
    ],
  },
];