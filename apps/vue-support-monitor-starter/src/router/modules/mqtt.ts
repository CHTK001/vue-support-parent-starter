export default [
  {
    path: "/mqtt",
    name: "mqtt",
    meta: {
      icon: "simple-icons:mqtt",
      title: "MQTT管理",
      showLink: true
    },
    children: [
      {
        path: "/mqtt-index",
        name: "mqtt-index",
        component: () => import("@/views/monitor/mqtt/index.vue"),
        meta: {
          icon: "simple-icons:mqtt",
          title: "MQTT管理",
          showLink: true,
          showParent: true
        }
      }
    ]
  }
];
