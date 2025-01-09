import { $t } from "@repo/config";

export default [
  {
    path: "/nginx",
    name: "nginx",
    meta: {
      icon: "simple-icons:nginx",
      title: $t("buttons.monitor.nginx"),
      showLink: true
    },
    children: [
      {
        path: "/nginx-config",
        name: "nginx-config",
        component: () => import("@/views/monitor/nginx/index.vue"),
        meta: {
          icon: "ri:navigation-fill",
          title: $t("buttons.monitor.service-list"),
          showLink: true,
          showParent: true
        }
      }
    ]
  }
];
