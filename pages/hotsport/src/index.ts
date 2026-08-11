import { registerMenuViewModules } from "@repo/core";

registerMenuViewModules({
  "views/hotsport/dashboard/index.vue": () => import("./views/Dashboard.vue"),
  "views/hotsport/traces/index.vue": () => import("./views/Traces.vue"),
  "views/hotsport/dependencies/index.vue": () => import("./views/Dependencies.vue"),
  "views/hotsport/leaks/index.vue": () => import("./views/Leaks.vue"),
});

export { hotsportRoutes, hotsportMenus } from "./routes";
export * from "./api/types";
export * from "./api/hotsportApi";