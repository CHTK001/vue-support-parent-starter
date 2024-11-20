import { $t } from "@repo/config";
import { RouteConfigsTable } from "../../../types/router";
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
