import type { RouteConfigsTable } from "@repo/core";

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
const loadProjectIndex = async () =>
  (await import("../views/project/index.vue")).default;
const loadSecretIndex = async () =>
  (await import("../views/secret/index.vue")).default;
const loadDeviceTemplate = async () =>
  (await import("../views/template/device/index.vue")).default;
const loadSmsTemplate = async () =>
  (await import("../views/template/sms/index.vue")).default;
const loadEmailTemplate = async () =>
  (await import("../views/template/email/index.vue")).default;

export default [
  {
    path: "/project",
    name: "Project",
    redirect: "/project/manage",
    meta: {
      icon: "ep:folder",
      title: "项目管理",
      rank: 5,
    },
    children: [
      {
        path: "/project/llm",
        name: "ProjectLlm",
        redirect: "/project/llm",
        meta: {
          icon: "ep:folder",
          title: "大语言模型",
        },
        children: [
          {
            path: "/project/ai/llm/web",
            name: "ProjectAiLlmWeb",
            component: loadLlmNewIndex,
            meta: {
              title: "大语言模型",
            },
          },
        ],
      },
      {
        path: "/project/generation",
        name: "ProjectGeneration",
        redirect: "/project/llm",
        meta: {
          icon: "ep:folder",
          title: "文生图模型",
        },
        children: [
          {
            path: "/project/ai/vincent/web",
            name: "ProjectAiVincentWeb",
            component: loadVincentIndex,
            meta: {
              title: "图像生成",
            },
          },
          {
            path: "/project/ai/face/detect/web",
            name: "ProjectAiFaceDetectWeb",
            component: loadImageDetectIndex,
            meta: {
              title: "人脸检测",
            },
          },
          {
            path: "/project/ai/video/web",
            name: "ProjectAiVideoWeb",
            component: loadVideoIndex,
            meta: {
              title: "视频生成",
            },
          },
          {
            path: "/project/ai/colorization/web",
            name: "ProjectAiColorizationWeb",
            component: loadColorizationIndex,
            meta: {
              title: "图像上色",
            },
          },
          {
            path: "/project/ai/resolution/web",
            name: "ProjectAiResolutionWeb",
            component: loadResolutionIndex,
            meta: {
              title: "图像分辨率增强",
            },
          },
        ],
      },
      {
        path: "/project/manage",
        name: "ProjectManage",
        component: loadProjectIndex,
        meta: {
          title: "项目管理",
        },
      },
      {
        path: "/project/secret",
        name: "ProjectSecret",
        component: loadSecretIndex,
        meta: {
          title: "密钥管理",
          showLink: false,
        },
      },
      {
        path: "/project/ai/llm",
        name: "ProjectAiLlm",
        component: loadLlmNewIndex,
        meta: {
          title: "大语言模型",
          showLink: false,
        },
      },
      {
        path: "/project/ai/vincent",
        name: "ProjectAiVincent",
        component: loadVincentIndex,
        meta: {
          title: "图像生成",
          showLink: false,
        },
      },
      {
        path: "/project/ai/video",
        name: "ProjectAiVideo",
        component: loadVideoIndex,
        meta: {
          title: "视频生成",
          showLink: false,
        },
      },
      {
        path: "/project/ai/colorization",
        name: "ProjectAiColorization",
        component: loadColorizationIndex,
        meta: {
          title: "图像上色",
          showLink: false,
        },
      },
      {
        path: "/project/ai/resolution",
        name: "ProjectAiResolution",
        component: loadResolutionIndex,
        meta: {
          title: "图像分辨率增强",
          showLink: false,
        },
      },
      {
        path: "/project/template/device",
        name: "device-template",
        component: loadDeviceTemplate,
        meta: {
          title: "设备模板",
          showLink: false,
        },
      },
      {
        path: "/project/template/sms",
        name: "sms-template",
        component: loadSmsTemplate,
        meta: {
          title: "短信模板",
          showLink: false,
        },
      },
      {
        path: "/project/template/email",
        name: "email-template",
        component: loadEmailTemplate,
        meta: {
          title: "邮件模板",
          showLink: false,
        },
      },
    ],
  },
] satisfies Array<RouteConfigsTable>;
