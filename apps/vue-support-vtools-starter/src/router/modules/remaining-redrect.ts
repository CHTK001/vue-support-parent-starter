import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@layout/default");

export default {
  path: "/redirect",
  component: Layout,
  meta: {
    title: $t("status.pureLoad"),
    showLink: false,
    rank: 102
  },
  children: [
    {
      path: "/redirect/:path(.*)",
      name: "Redirect",
      component: () => import("@repo/pages/layout/redirect.vue")
    }
  ]
} satisfies RouteConfigsTable;
