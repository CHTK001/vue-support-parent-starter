export default [
  {
    path: "/example",
    name: "example",
    meta: {
      icon: "ep:service",
      title: "测试管理",
      showLink: true
    },
    children: [
      {
        path: "/example/index",
        name: "exampleIndex",
        component: () => import("@pages/example"),
        meta: {
          title: "组件实例",
          icon: "ri:tools-fill",
          category: "开发工具",
          showLink: true,
          showParent: true
        }
      }
    ]
  }
];
