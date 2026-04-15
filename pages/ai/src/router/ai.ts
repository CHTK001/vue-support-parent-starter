import type { RouteConfigsTable } from "@repo/core";
import { getConfig } from "@repo/config";

const showAiChat = getConfig("ShowAiChat") ?? false;

const loadAiHomePage = async () => (await import("../index.vue")).default;
const loadLlmNewIndex = async () =>
  (await import("../views/ai/llm-new/index.vue")).default;
const loadVincentIndex = async () =>
  (await import("../views/ai/generation/index.vue")).default;
const loadImageDetectIndex = async () =>
  (await import("../views/ai/image/detect/index.vue")).default;
const loadVideoIndex = async () =>
  (await import("../views/ai/video/index.vue")).default;
const loadColorizationIndex = async () =>
  (await import("../views/ai/colorization/index.vue")).default;
const loadResolutionIndex = async () =>
  (await import("../views/ai/resolution/index.vue")).default;

export default [
  {
    path: "/ai",
    name: "Ai",
    redirect: "/ai/home",
    meta: {
      icon: "ri:robot-2-line",
      title: "AI中心",
      rank: 9,
      showLink: showAiChat,
    },
    children: [
      {
        path: "/ai/home",
        name: "AiHome",
        component: loadAiHomePage,
        meta: {
          title: "AI中心",
          showLink: false,
        },
      },
      {
        path: "/ai/llm",
        name: "ProjectAiLlm",
        component: loadLlmNewIndex,
        meta: {
          title: "大语言模型",
        },
      },
      {
        path: "/ai/llm/web",
        name: "ProjectAiLlmWeb",
        component: loadLlmNewIndex,
        meta: {
          title: "大语言模型",
          showLink: false,
        },
      },
      {
        path: "/ai/vincent",
        name: "ProjectAiVincent",
        component: loadVincentIndex,
        meta: {
          title: "图像生成",
        },
      },
      {
        path: "/ai/vincent/web",
        name: "ProjectAiVincentWeb",
        component: loadVincentIndex,
        meta: {
          title: "图像生成",
          showLink: false,
        },
      },
      {
        path: "/ai/face/detect",
        name: "ProjectAiImageDetection",
        component: loadImageDetectIndex,
        meta: {
          title: "人脸检测",
          showLink: false,
        },
      },
      {
        path: "/ai/face/detect/web",
        name: "ProjectAiImageDetectionWeb",
        component: loadImageDetectIndex,
        meta: {
          title: "人脸检测",
          showLink: false,
        },
      },
      {
        path: "/ai/video",
        name: "ProjectAiVideo",
        component: loadVideoIndex,
        meta: {
          title: "视频生成",
        },
      },
      {
        path: "/ai/video/web",
        name: "ProjectAiVideoWeb",
        component: loadVideoIndex,
        meta: {
          title: "视频生成",
          showLink: false,
        },
      },
      {
        path: "/ai/colorization",
        name: "ProjectAiColorization",
        component: loadColorizationIndex,
        meta: {
          title: "图像上色",
        },
      },
      {
        path: "/ai/colorization/web",
        name: "ProjectAiColorizationWeb",
        component: loadColorizationIndex,
        meta: {
          title: "图像上色",
          showLink: false,
        },
      },
      {
        path: "/ai/resolution",
        name: "ProjectAiResolution",
        component: loadResolutionIndex,
        meta: {
          title: "图像分辨率增强",
        },
      },
      {
        path: "/ai/resolution/web",
        name: "ProjectAiResolutionWeb",
        component: loadResolutionIndex,
        meta: {
          title: "图像分辨率增强",
          showLink: false,
        },
      },
    ],
  },
  {
    path: "/project/llm",
    redirect: "/ai/llm/web",
  },
  {
    path: "/project/generation",
    redirect: "/ai/vincent/web",
  },
  {
    path: "/project/ai/llm",
    redirect: "/ai/llm",
  },
  {
    path: "/project/ai/llm/web",
    redirect: "/ai/llm/web",
  },
  {
    path: "/project/ai/vincent",
    redirect: "/ai/vincent",
  },
  {
    path: "/project/ai/vincent/web",
    redirect: "/ai/vincent/web",
  },
  {
    path: "/project/ai/face/detect",
    redirect: "/ai/face/detect",
  },
  {
    path: "/project/ai/face/detect/web",
    redirect: "/ai/face/detect/web",
  },
  {
    path: "/project/ai/video",
    redirect: "/ai/video",
  },
  {
    path: "/project/ai/video/web",
    redirect: "/ai/video/web",
  },
  {
    path: "/project/ai/colorization",
    redirect: "/ai/colorization",
  },
  {
    path: "/project/ai/colorization/web",
    redirect: "/ai/colorization/web",
  },
  {
    path: "/project/ai/resolution",
    redirect: "/ai/resolution",
  },
  {
    path: "/project/ai/resolution/web",
    redirect: "/ai/resolution/web",
  },
] satisfies Array<RouteConfigsTable>;
