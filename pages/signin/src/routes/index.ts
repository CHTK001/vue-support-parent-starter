/**
 * Sign-in routes and menus (@repo/signin)
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

export const signinRoutes: RouteConfigsTable[] = [
  {
    path: "/signin/mine",
    name: "SignInMine",
    component: () => import("../views/SignInMine.vue"),
    meta: {
      title: "menu.signin.mine",
      icon: "Calendar",
      showLink: true,
      keepAlive: true,
    },
  },
  {
    path: "/signin/manage",
    name: "SignInManage",
    component: () => import("../views/SignInManage.vue"),
    meta: {
      title: "menu.signin.manage",
      icon: "DataLine",
      showLink: true,
      keepAlive: true,
    },
  },
];

export const signinMenus: StaticMenuItem[] = [
  {
    path: "/signin",
    name: "SignIn",
    redirect: "/signin/mine",
    meta: { title: "menu.signin", icon: "Calendar", isVisible: "1" },
    children: [
      {
        path: "/signin/mine",
        name: "SignInMine",
        meta: { title: "menu.signin.mine", icon: "Calendar", isVisible: "1" },
      },
      {
        path: "/signin/manage",
        name: "SignInManage",
        meta: { title: "menu.signin.manage", icon: "DataLine", isVisible: "1" },
      },
    ],
  },
];