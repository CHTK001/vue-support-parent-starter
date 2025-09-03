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
      rank: 5
    },
    children: [
      {
        path: "/project/index",
        name: "ProjectIndex",
        component: () => import("@pages/project"),
        meta: {
          title: "项目管理",
          showParent: true
        }
      },
      {
        path: "/project/manage",
        name: "ProjectManage",
        component: () => import("@pages/project/ProjectIndex"),
        meta: {
          title: "项目管理",
          showLink: false
        }
      },
      {
        path: "/project/secret",
        name: "ProjectSecret",
        component: () => import("@pages/project/SecretIndex"),
        meta: {
          title: "密钥管理",
          showLink: false
        }
      },
      {
        path: "/project/ai/llm",
        name: "ProjectAiLlm",
        component: () => import("@pages/project/LlmIndex"),
        meta: {
          title: "大语言模型",
          showLink: false
        }
      },
      {
        path: "/project/ai/vincent",
        name: "ProjectAiVincent",
        component: () => import("@pages/project/VincentIndex"),
        meta: {
          title: "图像生成",
          showLink: false
        }
      },
      {
        path: "/project/ai/video",
        name: "ProjectAiVideo",
        component: () => import("@pages/project/VideoIndex"),
        meta: {
          title: "视频生成",
          showLink: false
        }
      },
      {
        path: "/project/ai/colorization",
        name: "ProjectAiColorization",
        component: () => import("@pages/project/ColorizationIndex"),
        meta: {
          title: "图像上色",
          showLink: false
        }
      },
      {
        path: "/project/ai/resolution",
        name: "ProjectAiResolution",
        component: () => import("@pages/project/ResolutionIndex"),
        meta: {
          title: "图像分辨率增强",
          showLink: false
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
