/**
 * Achievement routes and menus (@pages/achievement)
 */
import type { RouteConfigsTable } from "@repo/core";
import type { StaticMenuItem } from "@repo/pinia";

export const achievementRoutes: RouteConfigsTable[] = [
  {
    path: "/achievement",
    name: "Achievement",
    redirect: "/achievement/manage",
    meta: {
      title: "menu.achievement",
      icon: "Trophy",
      showLink: true,
    },
    children: [
      {
        path: "/achievement/manage",
        name: "AchievementManage",
        component: () => import("../views/AchievementManage.vue"),
        meta: {
          title: "menu.achievement.manage",
          icon: "Trophy",
          showLink: true,
          keepAlive: true,
        },
      },
      {
        path: "/achievement/mine",
        name: "AchievementMine",
        component: () => import("../views/AchievementMine.vue"),
        meta: {
          title: "menu.achievement.mine",
          icon: "Medal",
          showLink: true,
          keepAlive: true,
        },
      },
    ],
  },
];

export const achievementMenus: StaticMenuItem[] = [
  {
    path: "/achievement",
    name: "Achievement",
    redirect: "/achievement/manage",
    meta: { title: "menu.achievement", icon: "Trophy", isVisible: "1" },
    children: [
      {
        path: "/achievement/manage",
        name: "AchievementManage",
        meta: { title: "menu.achievement.manage", icon: "Trophy", isVisible: "1" },
      },
      {
        path: "/achievement/mine",
        name: "AchievementMine",
        meta: { title: "menu.achievement.mine", icon: "Medal", isVisible: "1" },
      },
    ],
  },
];
