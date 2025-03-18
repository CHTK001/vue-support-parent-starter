import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";
import { Account } from "@layout/default";
const Layout = () => import("@layout/default");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@repo/pages/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false,
      rank: 101,
    },
  },
  {
    path: "/AccountSettings",
    name: "AccountSettings",
    component: () => {
      return Account;
    },
    meta: {
      title: $t("buttons.accountSetting"),
      showLink: false,
    },
  },
  {
    path: "/CameraPreview",
    name: "CameraPreview",
    component: () => import("@/views/manage/template/device/preview/index.vue"),
    meta: {
      title: $t("buttons.accountSetting"),
      showLink: false,
    },
  },
  {
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
        component: () => import("@repo/pages/layout/redirect.vue"),
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
