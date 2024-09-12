import { $t } from "@/plugins/i18n";

export default [
  {
    path: "/service",
    name: "service",
    meta: {
      icon: "ep:service",
      title: $t("buttons.monitor.service"),
      showLink: true
    },
    children: [
      {
        path: "/service",
        name: "service",
        component: () => import("@/views/monitor/service/index.vue"),
        meta: {
          icon: "ep:service",
          title: $t("buttons.monitor.service-list"),
          showLink: true
        }
      }
    ]
  }
];
