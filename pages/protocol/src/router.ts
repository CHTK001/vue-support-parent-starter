import type { RouteConfigsTable } from "@repo/core";

const loadProtocolPage = async () =>
  (await import("./views/ProtocolManagementPage.vue")).default;
const loadFirewallPage = async () =>
  (await import("./views/FirewallManagementPage.vue")).default;

export default [
  {
    path: "/protocol",
    name: "Protocol",
    redirect: "/protocol/service-management",
    meta: {
      icon: "ri:terminal-box-line",
      title: "协议管理",
      rank: 11,
      showLink: true,
    },
    children: [
      {
        path: "/protocol/service-management",
        name: "ProtocolServiceManagement",
        component: loadProtocolPage,
        meta: {
          title: "服务管理",
          showLink: true,
        },
      },
      {
        path: "/protocol/firewall",
        name: "ProtocolFirewall",
        component: loadFirewallPage,
        meta: {
          title: "防火墙管理",
          showLink: true,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
