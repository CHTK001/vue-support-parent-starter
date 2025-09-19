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
    meta: {
      title: "视频管理",
      icon: "ep:video-play",
      rank: 9,
    },
    children: [
      {
        path: "/video1",
        name: "VideoManagement1",
        meta: {
          title: "视频管理",
          icon: "ep:video-play",
          rank: 9,
        },
        children: [
          {
            path: "/video/search",
            name: "VideoSearch",
            component: async () => {
              const { VideoSearch } = await import("@pages/video");
              return VideoSearch;
            },
            meta: {
              title: "视频搜索",
              icon: "ep:search",
              rank: 1,
              remaining: true,
            },
          },
          {
            path: "/video/search/result",
            name: "VideoSearchResult",
            component: async () => {
              const { VideoSearchResult } = await import("@pages/video");
              return VideoSearchResult;
            },
            meta: {
              title: "搜索结果",
              showLink: false,
              remaining: true,
            },
          },
          {
            path: "/video/detail/result",
            name: "VideoDetailResult",
            component: async () => {
              const { VideoDetailResult } = await import("@pages/video");
              return VideoDetailResult;
            },
            meta: {
              title: "视频详情",
              showLink: false,
              remaining: true,
            },
          },
          {
            path: "/video/parse",
            name: "VideoParse",
            component: async () => {
              const { VideoParse } = await import("@pages/video");
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
              const { VideoManage } = await import("@pages/video");
              return VideoManage;
            },
            meta: {
              title: "视频管理",
              icon: "ep:video-camera",
              rank: 3,
              remaining: true,
            },
          },
        ],
      },

      {
        path: "/video/sync",
        name: "VideoSync",
        meta: {
          title: "视频源",
          icon: "ep:video-play",
          rank: 9,
        },
        children: [
          {
            path: "/video/source",
            name: "VideoSource",
            component: async () => {
              const { VideoSource } = await import("@pages/video");
              return VideoSource;
            },
            meta: {
              title: "视频源管理",
              icon: "ep:setting",
              rank: 4,
            },
          },
          {
            path: "/video/config",
            name: "VideoConfig",
            component: async () => {
              const { VideoConfig } = await import("@pages/video");
              return VideoConfig;
            },
            meta: {
              title: "视频同步配置",
              icon: "ep:setting",
              rank: 4,
            },
          },
        ],
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;

export default routes;
