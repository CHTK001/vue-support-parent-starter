/**
 * WebRTC路由配置
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/webrtc",
    name: "WebRTC",
    redirect: "/webrtc/index",
    meta: {
      icon: "ep:video-camera",
      title: "WebRTC管理",
      rank: 15,
    },
    children: [
      {
        path: "/webrtc/index",
        name: "WebRTCIndex",
        component: () => import("@/views/webrtc/index.vue"),
        meta: {
          title: "WebRTC概览",
          icon: "ep:data-analysis",
        },
      },
      {
        path: "/webrtc/rooms",
        name: "WebRTCRooms",
        component: () => import("@/views/webrtc/rooms/index.vue"),
        meta: {
          title: "房间管理",
          icon: "ep:office-building",
        },
      },
      {
        path: "/webrtc/video-call",
        name: "WebRTCVideoCall",
        component: () => import("@/views/webrtc/video-call/index.vue"),
        meta: {
          title: "视频通话",
          icon: "ep:video-camera",
        },
      },
      {
        path: "/webrtc/video-conference",
        name: "WebRTCVideoConference",
        component: () => import("@/views/webrtc/video-conference/index.vue"),
        meta: {
          title: "视频会议",
          icon: "ep:user-filled",
        },
      },
      {
        path: "/webrtc/screen-share",
        name: "WebRTCScreenShare",
        component: () => import("@/views/webrtc/screen-share/index.vue"),
        meta: {
          title: "屏幕共享",
          icon: "ep:monitor",
        },
      },
      {
        path: "/webrtc/statistics",
        name: "WebRTCStatistics",
        component: () => import("@/views/webrtc/statistics/index.vue"),
        meta: {
          title: "房间统计",
          icon: "ep:pie-chart",
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;