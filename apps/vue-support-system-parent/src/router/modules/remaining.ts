import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";
export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/AccountSettings",
    name: "AccountSettings",
    component: () => import("@/views/manage/account/setting.vue"),
    meta: {
      title: $t("buttons.accountSetting"),
      showLink: false
    }
  }
] satisfies Array<RouteConfigsTable>;
