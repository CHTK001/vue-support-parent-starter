export default [
  {
    path: "/example",
    name: "example",
    meta: {
      icon: "ep:setting",
      rank: 12,
      title: "测试例子",
      showLink: true,
      permanentNew: true,
    },
    children: [
      {
        path: "/example/index",
        name: "ExampleIndex",
        component: () => import("@pages/example"),
        meta: {
          title: "测试例子",
          icon: "ep:files",
          permanentNew: true,
        },
      },
   
    ],
  },
];
