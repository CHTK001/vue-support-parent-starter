import { t as $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";

const { VITE_HIDE_HOME } = import.meta.env;

export default [
  {
    path: "/",
    name: "Home",
    component: () => import("@layout/default"),
    redirect: "/home",
    meta: {
      icon: "ep:home-filled",
      title: $t("menus.pureHome"),
      rank: 0,
      alwaysIncludeStatic: true,
    },
    children: [
      {
        path: "/home",
        name: "home",
        component: () => import("@pages/common/home/default/index.vue"),
        meta: {
          title: $t("menus.pureHome"),
          showLink: VITE_HIDE_HOME !== "true",
          alwaysIncludeStatic: true,
        },
      },
    ],
  },
  {
    path: "/manage",
    name: "ManageRoot",
    component: () => import("@layout/default"),
    redirect: "/manage/user",
    meta: {
      title: "系统管理",
      icon: "ri:settings-3-line",
      rank: 20,
      showLink: false,
    },
    children: [
      {
        path: "user",
        name: "ManageUser",
        component: () => import("@/views/manage/user/layout.vue"),
        meta: {
          title: "用户管理",
          icon: "ri:user-settings-line",
          keepAlive: true,
        },
      },
      {
        path: "role",
        name: "ManageRole",
        component: () => import("@/views/manage/role/index.vue"),
        meta: {
          title: "角色管理",
          icon: "ri:shield-user-line",
          keepAlive: true,
        },
      },
      {
        path: "dept",
        name: "ManageDept",
        component: () => import("@/views/manage/dept/index.vue"),
        meta: {
          title: "部门管理",
          icon: "ri:building-2-line",
          keepAlive: true,
        },
      },
      {
        path: "log/user",
        name: "ManageUserLog",
        component: () => import("@/views/manage/log/user/index.vue"),
        meta: {
          title: "登录日志",
          icon: "ri:history-line",
          keepAlive: true,
        },
      },
      {
        path: "feedback",
        name: "ManageFeedback",
        component: () => import("@/views/manage/feedback/index.vue"),
        meta: {
          title: "反馈管理",
          icon: "ri:feedback-line",
          keepAlive: true,
        },
      },
      {
        path: "menu",
        name: "ManageMenu",
        component: () => import("@/views/manage/menu/index.vue"),
        meta: {
          title: "菜单管理",
          icon: "ri:menu-2-line",
          keepAlive: true,
        },
      },
      {
        path: "dict",
        name: "ManageDict",
        component: () => import("@/views/manage/dict/index.vue"),
        meta: {
          title: "字典管理",
          icon: "ri:book-2-line",
          keepAlive: true,
        },
      },
      {
        path: "setting",
        name: "ManageSetting",
        component: () => import("@/views/manage/setting/index.vue"),
        meta: {
          title: "系统设置",
          icon: "ri:tools-line",
          keepAlive: true,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
