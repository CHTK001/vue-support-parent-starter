export default [
  {
    path: "/example",
    name: "example",
    meta: {
      icon: "ep:setting",
      rank: 12,
      title: "测试例子",
      showLink: true,
    },
    children: [
      {
        path: "/example/index",
        name: "ExampleIndex",
        component: () => import("@pages/example"),
        meta: {
          title: "测试例子",
          icon: "ep:files",
        },
      },
      {
        path: "/example/techui",
        name: "ExampleTechUI",
        component: () => import("@pages/example/src/views/TechUIPage.vue"),
        meta: {
          title: "TechUI 科幻组件",
          icon: "ri:rocket-2-line",
          showLink: false,
        },
      },
    ],
  },
];
