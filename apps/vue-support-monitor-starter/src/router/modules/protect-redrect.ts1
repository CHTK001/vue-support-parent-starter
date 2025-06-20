import { $t } from "@repo/config";

export default [
  {
    path: "/protect",
    name: "protect",
    meta: {
      icon: "simple-icons:parrotsecurity",
      title: $t("buttons.monitor.protection"),
      showLink: true,
    },
    children: [
      {
        path: "/protection/manager",
        name: "protectionManager",
        component: () => import("@/views/monitor/protection/index.vue"),
        meta: {
          icon: "ri:shirt-line",
          title: $t("buttons.monitor.protection"),
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
