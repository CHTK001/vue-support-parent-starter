import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@layout/default");

export default [
  {
    path: "/project",
    name: "Project",
    component: Layout,
    redirect: "/project/index",
    meta: {
      icon: "ep:folder",
      title: "项目管理",
      rank: 5,
    },
    children: [
      {
        path: "/project/index",
        name: "ProjectIndex",
        component: () => import("@pages/project/index.vue"),
        meta: {
          title: "项目管理",
          showParent: true,
        },
      },
      {
        path: "/project/manage",
        name: "ProjectManage",
        component: () => import("@pages/project/src/views/project/index.vue"),
        meta: {
          title: "项目管理",
          showLink: false,
        },
      },
      {
        path: "/project/secret",
        name: "ProjectSecret",
        component: () => import("@pages/project/src/views/secret/index.vue"),
        meta: {
          title: "密钥管理",
          showLink: false,
        },
      },
      {
        path: "/project/ai/llm",
        name: "ProjectAiLlm",
        component: () => import("@pages/project/src/views/ai/llm/index.vue"),
        meta: {
          title: "大语言模型",
          showLink: false,
        },
      },
      {
        path: "/project/ai/vincent",
        name: "ProjectAiVincent",
        component: () => import("@pages/project/src/views/ai/vincent/index.vue"),
        meta: {
          title: "图像生成",
          showLink: false,
        },
      },
      {
        path: "/project/ai/video",
        name: "ProjectAiVideo",
        component: () => import("@repo/pages/project/src/views/ai/video/index.vue"),
        meta: {
          title: "视频生成",
          showLink: false,
        },
      },
      {
        path: "/project/ai/colorization",
        name: "ProjectAiColorization",
        component: () => import("@repo/pages/project/src/views/ai/colorization/index.vue"),
        meta: {
          title: "图像上色",
          showLink: false,
        },
      },
      {
        path: "/project/ai/resolution",
        name: "ProjectAiResolution",
        component: () => import("@repo/pages/project/src/views/ai/resolution/index.vue"),
        meta: {
          title: "图像分辨率增强",
          showLink: false,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;