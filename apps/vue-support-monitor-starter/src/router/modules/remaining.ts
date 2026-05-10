import type { RouteConfigsTable } from "@repo/core";

export default [
  {
    path: "/node/documentation/:nodeId",
    name: "nodeDocumentation",
    component: () =>
      import("@/views/node-management/module/node-documentation/index.vue"),
    meta: {
      icon: "ri:file-text-line",
      title: "节点API文档",
      showLink: false,
    },
  },
  {
    path: "/node/monitor/:nodeId",
    name: "nodeMonitorDashboard",
    component: () =>
      import("@/views/node-management/module/monitor-dashboard/index.vue"),
    meta: {
      icon: "ri:dashboard-3-line",
      title: "节点监控大屏",
      showLink: false,
    },
  },
  {
    path: "/node/scifi-dashboard/:nodeId",
    name: "nodeScifiDashboard",
    component: () =>
      import("@/views/node-management/module/scifi-dashboard/index.vue"),
    meta: {
      icon: "ri:dashboard-3-line",
      title: "科幻监控大屏",
      showLink: false,
    },
  },
  {
    path: "/file-manager/:serverId",
    name: "fileManager",
    component: () => import("@/views/server/modules/file-management/index.vue"),
    meta: {
      icon: "ri:folder-line",
      title: "文件管理器",
      showLink: false,
    },
  },
  {
    path: "/service/file-storage/preview/:serverId",
    name: "fileStoragePreviewFull",
    component: () =>
      import("@pages/protocol/views/service-management/file-storage/PreviewFull.vue"),
    meta: {
      title: "文件存储预览",
      showLink: false,
    },
  },
  {
    path: "/ai/image-library",
    name: "AiImageLibrary",
    component: () =>
      import("@pages/ai/views/ai/image-library/index.vue"),
    meta: {
      title: "图像库",
      showLink: false,
    },
  },
  {
    path: "/ai/ocr",
    name: "AiOcr",
    component: () =>
      import("@pages/ai/views/ai/ocr/index.vue"),
    meta: {
      title: "文字识别",
      showLink: false,
    },
  },
] satisfies Array<RouteConfigsTable>;
