import { $t } from "@repo/config";
import { RouteConfigsTable } from "../../../types/router";

const Layout = () => import("@layout/default");

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
  {
    path: "/AccountSettings",
    name: "AccountSettings",
    component: async () => {
      const { Account } = await import("@layout/default");
      return Account;
    },
    meta: {
      title: $t("buttons.accountSetting"),
      showLink: false,
    },
  },
  {
    path: "/message/center",
    name: "MessageCenter",
    component: () => import("@repo/pages/page/message/MessageCenter.vue"),
    meta: {
      title: "消息中心",
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
  // 全屏错误页面 - 不在Layout内渲染
  {
    path: "/error/403",
    name: "Error403",
    component: () => import("@repo/pages/error/403.vue"),
    meta: {
      title: $t("menus.pureFourZeroOne"),
      showLink: false,
    },
  },
  {
    path: "/error/404",
    name: "Error404",
    component: () => import("@repo/pages/error/404.vue"),
    meta: {
      title: $t("menus.pureFourZeroFour"),
      showLink: false,
    },
  },
  {
    path: "/error/500",
    name: "Error500",
    component: () => import("@repo/pages/error/500.vue"),
    meta: {
      title: $t("menus.pureFive"),
      showLink: false,
    },
  },
] satisfies Array<RouteConfigsTable>;
