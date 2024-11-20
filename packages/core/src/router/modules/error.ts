import { $t } from "@repo/config";

export default {
  path: "/error",
  redirect: "/error/403",
  meta: {
    icon: "ri:information-line",
    // showLink: false,
    title: $t("menus.pureAbnormal"),
    showLink: false,
    rank: 9
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      component: () => import("@repo/pages/error/403.vue"),
      meta: {
        title: $t("menus.pureFourZeroOne")
      }
    },
    {
      path: "/error/404",
      name: "404",
      component: () => import("@repo/pages/error/404.vue"),
      meta: {
        title: $t("menus.pureFourZeroFour")
      }
    },
    {
      path: "/error/500",
      name: "500",
      component: () => import("@repo/pages/error/500.vue"),
      meta: {
        title: $t("menus.pureFive")
      }
    }
  ]
} satisfies RouteConfigsTable;
