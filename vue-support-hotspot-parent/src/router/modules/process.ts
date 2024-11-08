export default {
  path: "/handle",
  name: "进程",
  meta: {
    icon: "ep:promotion",
    title: "句柄管理",
    rank: 2
  },
  children: [
    {
      path: "/handle/file_handle",
      name: "file_handle",
      component: () => import("@/views/hotspot/handle.vue"),
      meta: {
        icon: "ep:add-location",
        title: "文件句柄",
        showParent: true
      }
    },
    {
      path: "/handle/thread",
      name: "thread",
      component: () => import("@/views/hotspot/thread.vue"),
      meta: {
        icon: "ri:threads-fill",
        title: "线程",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
