import type { RouteConfigsTable } from "@repo/core";
import { getConfig } from "@repo/config";

const showAiChat = getConfig("ShowAiChat") ?? false;

const loadAiHomePage = async () => (await import("../index.vue")).default;
const loadSettingsIndex = async () =>
  (await import("../views/ai/settings/index.vue")).default;
const loadChatIndex = async () => (await import("../views/ai/chat/index.vue")).default;
const loadImageIndex = async () => (await import("../views/ai/image/index.vue")).default;
const loadVideoIndex = async () => (await import("../views/ai/video/index.vue")).default;
const loadFaceIndex = async () => (await import("../views/ai/face/index.vue")).default;
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
        path: "/ai/settings",
        name: "AiSettings",
        meta: {
          title: "模型设置",
        },
        component: loadSettingsIndex,
      },
      {
        path: "/ai/chat",
        name: "AiChat",
        meta: {
          title: "聊天",
        },
        component: loadChatIndex,
      },
      {
        path: "/ai/image",
        name: "AiImage",
        meta: {
          title: "图像生成",
        },
        component: loadImageIndex,
      },
      {
        path: "/ai/video",
        name: "AiVideo",
        meta: {
          title: "视频生成",
        },
        component: loadVideoIndex,
      },
      {
        path: "/ai/face",
        name: "AiFace",
        meta: {
          title: "人脸检测",
        },
        component: loadFaceIndex,
      },
      {
        path: "/ai/colorization",
        name: "AiColorization",
        meta: {
          title: "图像上色",
        },
        component: loadColorizationIndex,
      },
      {
        path: "/ai/resolution",
        name: "AiResolution",
        meta: {
          title: "图像分辨率增强",
        },
        component: loadResolutionIndex,
      },
    ],
  },
  {
    path: "/project/llm",
    redirect: "/ai/chat",
  },
  {
    path: "/project/generation",
    redirect: "/ai/image",
  },
  {
    path: "/project/ai/llm",
    redirect: "/ai/chat",
  },
  {
    path: "/project/ai/llm/web",
    redirect: "/ai/chat",
  },
  {
    path: "/project/ai/vincent",
    redirect: "/ai/image",
  },
  {
    path: "/project/ai/vincent/web",
    redirect: "/ai/image",
  },
  {
    path: "/project/ai/face/detect",
    redirect: "/ai/face",
  },
  {
    path: "/project/ai/face/detect/web",
    redirect: "/ai/face",
  },
  {
    path: "/project/ai/video",
    redirect: "/ai/video",
  },
  {
    path: "/project/ai/video/web",
    redirect: "/ai/video",
  },
  {
    path: "/project/ai/colorization",
    redirect: "/ai/colorization",
  },
  {
    path: "/project/ai/colorization/web",
    redirect: "/ai/colorization",
  },
  {
    path: "/project/ai/resolution",
    redirect: "/ai/resolution",
  },
  {
    path: "/project/ai/resolution/web",
    redirect: "/ai/resolution",
  },
  {
    path: "/ai/llm",
    redirect: "/ai/chat",
  },
  {
    path: "/ai/llm/web",
    redirect: "/ai/chat",
  },
  {
    path: "/ai/vincent",
    redirect: "/ai/image",
  },
  {
    path: "/ai/vincent/web",
    redirect: "/ai/image",
  },
  {
    path: "/ai/face/detect",
    redirect: "/ai/face",
  },
  {
    path: "/ai/face/detect/web",
    redirect: "/ai/face",
  },
  {
    path: "/ai/video/web",
    redirect: "/ai/video",
  },
  {
    path: "/ai/colorization/web",
    redirect: "/ai/colorization",
  },
  {
    path: "/ai/resolution/web",
    redirect: "/ai/resolution",
  },
] satisfies Array<RouteConfigsTable>;
