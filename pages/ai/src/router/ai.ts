import type { RouteConfigsTable } from "@repo/core";
import { getConfig } from "@repo/config";

const showAiChat = getConfig("ShowAiChat") ?? false;

const loadAiHomePage = async () => (await import("../index.vue")).default;
const loadManufacturerIndex = async () =>
  (await import("../views/ai/manufacturer/index.vue")).default;
const loadChatIndex = async () => (await import("../views/ai/chat/index.vue")).default;
const loadImageIndex = async () => (await import("../views/ai/image/index.vue")).default;
const loadVideoIndex = async () => (await import("../views/ai/video/index.vue")).default;
const loadFaceIndex = async () => (await import("../views/ai/face/index.vue")).default;
const loadFaceCompareIndex = async () =>
  (await import("../views/ai/face-compare/index.vue")).default;
const loadFaceLibraryIndex = async () =>
  (await import("../views/ai/face-library/index.vue")).default;
const loadColorizationIndex = async () =>
  (await import("../views/ai/colorization/index.vue")).default;
const loadResolutionIndex = async () =>
  (await import("../views/ai/resolution/index.vue")).default;
const loadMattingIndex = async () =>
  (await import("../views/ai/matting/index.vue")).default;
const loadTokenIndex = async () =>
  (await import("../views/ai/token/index.vue")).default;
const loadOcrIndex = async () =>
  (await import("../views/ai/ocr/index.vue")).default;
const loadImageLibraryIndex = async () =>
  (await import("../views/ai/image-library/index.vue")).default;
const loadKgIndex = async () =>
  (await import("../views/ai/knowledge-graph/index.vue")).default;
export default [
  {
    path: "/ai",
    name: "Ai",
    redirect: "/ai/home",
    meta: {
      icon: "ri:robot-2-line",
      title: "AI中心",
      rank: 9,
      showLink: true,
    },
    children: [
      {
        path: "/ai/home",
        name: "AiHome",
        component: loadAiHomePage,
        meta: {
          title: "AI中心",
        },
      },
      {
        path: "/ai/manufacturer",
        name: "AiManufacturer",
        meta: {
          title: "厂家管理",
          showLink: false,
        },
        component: loadManufacturerIndex,
      },
      {
        path: "/ai/chat",
        name: "AiChat",
        meta: {
          title: "聊天",
          showLink: false,
        },
        component: loadChatIndex,
      },
      {
        path: "/ai/image",
        name: "AiImage",
        meta: {
          title: "图像生成",
          showLink: false,
        },
        component: loadImageIndex,
      },
      {
        path: "/ai/video",
        name: "AiVideo",
        meta: {
          title: "视频生成",
          showLink: false,
        },
        component: loadVideoIndex,
      },
      {
        path: "/ai/face",
        name: "AiFace",
        meta: {
          title: "人脸检测",
          showLink: false,
        },
        component: loadFaceIndex,
      },
      {
        path: "/ai/face-compare",
        name: "AiFaceCompare",
        meta: {
          title: "人脸对比",
          showLink: false,
        },
        component: loadFaceCompareIndex,
      },
      {
        path: "/ai/face-library",
        name: "AiFaceLibrary",
        meta: {
          title: "人脸库管理",
          showLink: false,
        },
        component: loadFaceLibraryIndex,
      },
      {
        path: "/ai/colorization",
        name: "AiColorization",
        meta: {
          title: "图像上色",
          showLink: false,
        },
        component: loadColorizationIndex,
      },
      {
        path: "/ai/resolution",
        name: "AiResolution",
        meta: {
          title: "图像分辨率增强",
          showLink: false,
        },
        component: loadResolutionIndex,
      },
      {
        path: "/ai/matting",
        name: "AiMatting",
        meta: {
          title: "图像抠图",
          showLink: false,
        },
        component: loadMattingIndex,
      },
      {
        path: "/ai/token",
        name: "AiToken",
        meta: {
          title: "令牌管理",
          showLink: false,
        },
        component: loadTokenIndex,
      },
      {
        path: "/ai/ocr",
        name: "AiOcr",
        meta: {
          title: "OCR",
          showLink: false,
        },
        component: loadOcrIndex,
      },
      {
        path: "/ai/image-library",
        name: "AiImageLibrary",
        meta: {
          title: "图像库",
          showLink: false,
        },
        component: loadImageLibraryIndex,
      },
      {
        path: "/ai/knowledge-graph",
        name: "AiKnowledgeGraph",
        meta: {
          title: "知识图谱",
          showLink: false,
        },
        component: loadKgIndex,
      },
    ],
  },
  {
    path: "/ai/settings",
    redirect: "/ai/manufacturer",
    meta: { showLink: false },
  },
  {
    path: "/project/llm",
    redirect: "/ai/chat",
    meta: { showLink: false },
  },
  {
    path: "/project/generation",
    redirect: "/ai/image",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/llm",
    redirect: "/ai/chat",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/llm/web",
    redirect: "/ai/chat",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/vincent",
    redirect: "/ai/image",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/vincent/web",
    redirect: "/ai/image",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/face/detect",
    redirect: "/ai/face",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/face/detect/web",
    redirect: "/ai/face",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/face/compare",
    redirect: "/ai/face-compare",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/face/compare/web",
    redirect: "/ai/face-compare",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/video",
    redirect: "/ai/video",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/video/web",
    redirect: "/ai/video",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/colorization",
    redirect: "/ai/colorization",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/colorization/web",
    redirect: "/ai/colorization",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/resolution",
    redirect: "/ai/resolution",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/resolution/web",
    redirect: "/ai/resolution",
    meta: { showLink: false },
  },
  {
    path: "/ai/llm",
    redirect: "/ai/chat",
    meta: { showLink: false },
  },
  {
    path: "/ai/llm/web",
    redirect: "/ai/chat",
    meta: { showLink: false },
  },
  {
    path: "/ai/vincent",
    redirect: "/ai/image",
    meta: { showLink: false },
  },
  {
    path: "/ai/vincent/web",
    redirect: "/ai/image",
    meta: { showLink: false },
  },
  {
    path: "/ai/face/detect",
    redirect: "/ai/face",
    meta: { showLink: false },
  },
  {
    path: "/ai/face/detect/web",
    redirect: "/ai/face",
    meta: { showLink: false },
  },
  {
    path: "/ai/face/compare",
    redirect: "/ai/face-compare",
    meta: { showLink: false },
  },
  {
    path: "/ai/face/compare/web",
    redirect: "/ai/face-compare",
    meta: { showLink: false },
  },
  {
    path: "/ai/video/web",
    redirect: "/ai/video",
    meta: { showLink: false },
  },
  {
    path: "/ai/colorization/web",
    redirect: "/ai/colorization",
    meta: { showLink: false },
  },
  {
    path: "/ai/resolution/web",
    redirect: "/ai/resolution",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/matting",
    redirect: "/ai/matting",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/matting/web",
    redirect: "/ai/matting",
    meta: { showLink: false },
  },
  {
    path: "/ai/matting/web",
    redirect: "/ai/matting",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/ocr",
    redirect: "/ai/ocr",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/ocr/web",
    redirect: "/ai/ocr",
    meta: { showLink: false },
  },
  {
    path: "/ai/ocr/web",
    redirect: "/ai/ocr",
    meta: { showLink: false },
  },
  {
    path: "/project/ai/knowledge-graph",
    redirect: "/ai/knowledge-graph",
    meta: { showLink: false },
  },
] satisfies Array<RouteConfigsTable>;
