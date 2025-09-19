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
  {
    path: "/remaining-component/:componentPath",
    name: "RemainingComponent",
    component: () => import("@repo/pages/page/remaining/RemainingComponentPage.vue"),
    meta: {
      title: "组件页面",
      showLink: false,
    },
  },
] satisfies Array<RouteConfigsTable>;
