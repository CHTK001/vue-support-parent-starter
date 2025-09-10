import { $t } from "@repo/config";

export default [
  {
    path: "/setting",
    name: "setting",
    meta: {
      icon: "ep:setting",
      rank: 10299,
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
          rank: 10299,
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
    ],
  },
];
