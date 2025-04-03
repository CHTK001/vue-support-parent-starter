import { $t } from "@repo/config";

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
        path: "/video/home",
        name: "VideoHome",
        component: () => import("@/view/video/index.vue"),
        meta: {
          title: "视频首页",
          icon: "ep:house",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/video/search",
        name: "VideoSearchHome",
        component: () => import("@/view/video/index.vue"),
        meta: {
          title: "视频搜索",
          icon: "ri:search-2-line",
          showLink: true,
          showParent: true,
        },
      },
      {
        path: "/video/manager",
        name: "VideoManage",
        component: () => import("@/view/video/manage/index.vue"),
        meta: {
          title: "视频列表",
          icon: "ri:list-check",
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
          icon: "ri:settings-2-line",
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
      {
        path: "/video/manage/detail",
        name: "videoDetail",
        component: () => import("@/view/video/manage/detail.vue"),
        meta: {
          title: "编辑详情",
          icon: "detail",
          showLink: false,
          showParent: true,
        },
      },
    ],
  },
  {
    path: "/setting",
    name: "setting",
    meta: {
      icon: "ep:setting",
      rank: 10299,
      title: $t("buttons.monitor.setting"),
      showLink: true,
    },
    children: [
      {
        path: "/setting-index",
        name: "settingIndex",
        component: () => import("@pages/setting"),
        meta: {
          icon: "ep:setting",
          rank: 10299,
          title: $t("buttons.monitor.setting"),
          showLink: true,
          showParent: true,
        },
      },
    ],
  },
];
