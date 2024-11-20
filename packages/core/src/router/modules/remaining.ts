import { $t } from "@repo/config";
export default [
  {
    path: "/bindSuccess",
    name: "bindSuccess",
    component: () => import("@repo/pages/page/bindSuccess.vue"),
    meta: {
      title: $t("buttons.bindSuccess"),
      showLink: false,
    },
  },
] satisfies Array<RouteConfigsTable>;
