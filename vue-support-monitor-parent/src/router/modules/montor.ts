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
          icon: "ri:navigation-fill",
          title: $t("buttons.monitor.service-list"),
          showLink: true
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
        path: "/service",
        name: "service",
        component: () => import("@/views/monitor/job/index.vue"),
        meta: {
          icon: "line-md:bell-twotone-loop",
          title: $t("buttons.monitor.job-list"),
          showLink: true
        }
      }
    ]
  }
];
