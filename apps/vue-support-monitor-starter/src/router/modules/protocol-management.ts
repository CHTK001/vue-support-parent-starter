export default [
  {
    path: "/protocol-management",
    name: "protocolManagement",
    meta: {
      icon: "ri:service-line",
      title: "协议管理",
      showLink: true,
      rank: 3,
    },
    children: [
      {
        path: "/protocol/management",
        name: "protocolManagementIndex",
        component: async () => {
          const { ProtocolManagementPage } = await import("@pages/protocol");
          return ProtocolManagementPage;
        },
        meta: {
          icon: "ri:settings-3-line",
          title: "协议管理",
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];

