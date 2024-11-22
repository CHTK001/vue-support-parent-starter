import { $t } from "@repo/config";
const { VITE_HIDE_HOME } = import.meta.env;
import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@layout/default");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/home",
  meta: {
    icon: "ep:home-filled",
    title: $t("menus.pureHome"),
    rank: 0
  },
  children: [
    {
      path: "/home",
      name: "home",
      component: () => import("@repo/pages/home/custom/index.vue"),
      meta: {
        title: $t("menus.pureHome"),
        showLink: VITE_HIDE_HOME === "true" ? false : true
      }
    }
  ]
} satisfies RouteConfigsTable;
