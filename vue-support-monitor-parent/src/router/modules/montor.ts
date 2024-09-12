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
        path: "/service-list",
        name: "service-list",
        component: () => import("@/views/monitor/service/app/index.vue"),
        meta: {
          icon: "ri:navigation-fill",
          title: $t("buttons.monitor.service-list"),
          showLink: true,
          showParent: true
        }
      },
      {
        path: "/online-service-list",
        name: "online-service-list",
        component: () => import("@/views/monitor/service/online/index.vue"),
        meta: {
          icon: "simple-icons:cloudflare",
          title: $t("buttons.monitor.online-service-list"),
          showLink: true,
          showParent: true
        }
      }
    ]
  },
  {
    path: "/job",
    name: "job",
    meta: {
      icon: "line-md:bell-twotone-loop",
      title: $t("buttons.monitor.job"),
      showLink: true
    },
    children: [
      {
        path: "/job-list",
        name: "job-list",
        component: () => import("@/views/monitor/job/info/index.vue"),
        meta: {
          icon: "line-md:bell-twotone-loop",
          title: $t("buttons.monitor.job-list"),
          showLink: true,
          showParent: true
        }
      }
    ]
  }
];
