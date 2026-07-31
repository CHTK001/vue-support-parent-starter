import { $t } from "@repo/config";
import type { RouteConfigsTable } from "../../../types/router";

const Layout = () => import("@layout/default");

export default [
  {
    path: "/login",
    name: "Login",
      component: () => import("@repo/login/themes/koi/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false,
      rank: 101,
      remaining: true,
    },
  },
  {
    path: "/bindSuccess",
    name: "bindSuccess",
    component: () => import("@pages/common/page/bindSuccess.vue"),
    meta: {
      title: $t("buttons.bindSuccess"),
      showLink: false,
      remaining: true,
    },
  },
  {
    path: "/remaining-component/:componentPath",
    name: "RemainingComponent",
    component: () =>
      import("@pages/common/page/remaining/RemainingComponentPage.vue"),
    meta: {
      title: "组件页面",
      showLink: false,
      remaining: true,
    },
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: $t("status.pureLoad"),
      showLink: false,
      rank: 102,
      remaining: true,
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@repo/common-pages/layout/redirect.vue"),
        meta: {
          title: $t("status.pureLoad"),
          showLink: false,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
