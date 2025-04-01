/**
 * 视频管理路由
 */
export default [
  {
    path: "/video",
    name: "Video",
    meta: {
      title: "视频管理",
      icon: "ri:map-pin-range-fill",
      rank: 2,
    },
    children: [
      {
        path: "/video/manager",
        name: "VideoManage",
        component: () => import("@/view/video/manage/index.vue"),
        meta: {
          title: "视频列表",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/video/sync-config",
        name: "VideoSyncConfig",
        component: () => import("@/view/video/sync/index.vue"),
        meta: {
          title: "同步设置",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/video/manage/edit",
        name: "videoEdit",
        component: () => import("@/view/video/manage/edit.vue"),
        meta: {
          title: "编辑视频",
          icon: "edit",
          showLink: false,
          showParent: true,
        },
      },
    ],
  },
];
