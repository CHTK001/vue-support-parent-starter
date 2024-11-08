export default {
  path: "/",
  name: "句柄",
  redirect: "/handle",
  meta: {
    icon: "ep:home-filled",
    title: "句柄",
    rank: 0
  },
  children: [
    {
      path: "/file_handle",
      name: "file_handle",
      component: () => import("@/views/hotspot/handle.vue"),
      meta: {
        icon: "ep:add-location",
        title: "文件句柄",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
