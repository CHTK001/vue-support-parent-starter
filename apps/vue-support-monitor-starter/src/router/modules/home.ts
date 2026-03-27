import { t as $t } from "@repo/config";
const { VITE_HIDE_HOME } = import.meta.env;
import type { RouteConfigsTable } from "@repo/core";
export default [
  {
    path: "/",
    name: "Home",
    //@ts-ignore
    component: () => import("../../../../../layout/default/src/index.vue"),
    redirect: "/home",
    meta: {
      icon: "ep:home-filled",
      title: $t("menus.pureHome"),
      rank: 0,
    },
    children: [
      {
        path: "/home",
        name: "home",
        component: () =>
          import("../../../../../pages/common/home/default/index.vue"),
        meta: {
          title: $t("menus.pureHome"),
          showLink: VITE_HIDE_HOME !== "true",
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
