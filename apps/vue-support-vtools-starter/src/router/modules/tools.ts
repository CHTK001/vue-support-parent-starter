export default [
  {
    path: "/tools",
    name: "tools",
    meta: {
      icon: "ep:service",
      title: "工具管理",
      showLink: true,
    },
    children: [
      {
        path: "/tools/index",
        name: "toolsIndex",
        component: () => import("@pages/tools"),
        meta: {
          title: "开发工具",
          icon: "ri:tools-fill",
          category: "开发工具",
          showLink: true,
          showParent: true,
        }
      }]
  },
];
