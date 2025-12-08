import { $t } from "@repo/config";

export default [
  {
    path: "/setting",
    name: "setting",
    meta: {
      icon: "ep:setting",
      rank: 99,
      title: $t("buttons.monitor.setting"),
      showLink: true,
    },
    children: [
      {
        path: "/setting-index",
        name: "settingIndex",
        component: () => import("@pages/setting"),
        meta: {
          icon: "ep:setting",
          rank: 99,
          title: $t("buttons.monitor.setting"),
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/dict",
        name: "DictManagement",
        component: () => import("@pages/dict"),
        meta: {
          title: "字典管理",
        },
      },
      {
        path: "/holiday/index",
        name: "HolidayIndex",
        component: async () => {
          const { SystemHolidayIndex } = await import("@pages/system");
          return SystemHolidayIndex;
        },
        meta: {
          title: "节假日管理",
          icon: "ep:calendar",
        },
      },
      {
        path: "/log/system/index",
        name: "LogSystemIndex",
        component: async () => {
          const { SystemLogIndex } = await import("@pages/system");
          return SystemLogIndex;
        },
        meta: {
          title: "系统日志",
          icon: "ep:files",
        },
      },
    ],
  },
];
