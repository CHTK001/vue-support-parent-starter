import { t as $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";
//@ts-ignore
const Layout = () => import("../../../../../layout/default/src/index.vue");

export default {
  path: "/redirect",
  component: Layout,
  meta: {
    title: $t("status.pureLoad"),
    showLink: false,
    rank: 102,
  },
  children: [
    {
      path: "/redirect/:path(.*)",
      name: "Redirect",
      component: () =>
        import("../../../../../pages/common/layout/redirect.vue"),
    },
  ],
} satisfies RouteConfigsTable;
