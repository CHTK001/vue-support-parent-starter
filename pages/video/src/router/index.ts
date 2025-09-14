import type { RouteConfigsTable } from "@repo/core";

/**
 * 视频模块路由配置
 * @author CH
 * @since 2024-12-19
 * @version 1.0.0
 */
const routes = [
  {
    path: "/video",
    name: "VideoManagement",
    component: async () => {
      const LayoutDefault = await import("@pages/video");
      return LayoutDefault;
    },
    meta: {
      title: "视频管理",
      icon: "ep:video-play",
      rank: 9,
    },
    children: [
      {
        path: "/video/index",
        name: "VideoIndex",
        component: async () => {
          const VideoIndex = await import("../index.vue");
          return VideoIndex;
        },
        meta: {
          title: "视频首页",
          showInMenu: false,
        },
      },
      {
        path: "/video/search",
        name: "VideoSearch",
        component: async () => {
          const VideoSearch = await import("../views/search/index.vue");
          return VideoSearch;
        },
        meta: {
          title: "视频搜索",
          icon: "ep:search",
          rank: 1,
        },
      },
      {
        path: "/video/search/result",
        name: "VideoSearchResult",
        component: async () => {
          const VideoSearchResult = await import("../views/search/result.vue");
          return VideoSearchResult;
        },
        meta: {
          title: "搜索结果",
          showInMenu: false,
        },
      },
      {
        path: "/video/parse",
        name: "VideoParse",
        component: async () => {
          const VideoParse = await import("../views/parse/index.vue");
          return VideoParse;
        },
        meta: {
          title: "视频解析",
          icon: "ep:link",
          rank: 2,
        },
      },
      {
        path: "/video/manage",
        name: "VideoManage",
        component: async () => {
          const VideoManage = await import("../views/manage/index.vue");
          return VideoManage;
        },
        meta: {
          title: "视频管理",
          icon: "ep:video-camera",
          rank: 3,
        },
      },
      {
        path: "/video/config",
        name: "VideoConfig",
        component: async () => {
          const VideoConfig = await import("../views/config/index.vue");
          return VideoConfig;
        },
        meta: {
          title: "配置管理",
          icon: "ep:setting",
          rank: 4,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;

export default routes;
