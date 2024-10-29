import { $t } from "@/plugins/i18n";
const Layout = () => import("@/layout/index.vue");

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
    path: "/bindSuccess",
    name: "bindSuccess",
    component: () => import("@/views/page/bindSuccess.vue"),
    meta: {
      title: $t("buttons.bindSuccess"),
      showLink: false
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
  },

  {
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
        component: () => import("@/layout/redirect.vue")
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
