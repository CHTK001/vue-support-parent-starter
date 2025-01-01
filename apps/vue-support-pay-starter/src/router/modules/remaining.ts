import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@repo/pages/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false,
      rank: 101
    }
  }
] satisfies Array<RouteConfigsTable>;
