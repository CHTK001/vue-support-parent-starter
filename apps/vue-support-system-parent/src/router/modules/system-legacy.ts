import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/manage/dict",
    name: "LegacyDictManagement",
    redirect: "/dict",
    meta: {
      title: "字典管理",
      showLink: false,
    },
  },
  {
    path: "/setting",
    name: "SettingManagement",
    component: () => import("@pages/setting"),
    meta: {
      title: "系统配置",
      showLink: false,
    },
  },
  {
    path: "/manage/setting",
    name: "LegacySettingManagement",
    redirect: "/setting",
    meta: {
      title: "系统配置",
      showLink: false,
    },
  },
] satisfies Array<RouteConfigsTable>;
