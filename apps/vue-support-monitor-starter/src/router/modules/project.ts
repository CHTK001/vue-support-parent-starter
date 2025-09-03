import type { RouteConfigsTable } from "@repo/core";
const Layout = () => import("@layout/default");

export default [
  {
    path: "/project",
    name: "Project",
    component: Layout,
    redirect: "/project/manage",
    meta: {
      icon: "ep:folder",
      title: "项目管理",
      rank: 5
    },
    children: [
      {
        path: "/project/manage",
        name: "ProjectManage",
        component: async () => {
          const { ProjectIndex } = await import("@pages/project");
          return ProjectIndex;
        },
        meta: {
          title: "项目管理",
          showLink: false
        }
      },
      {
        path: "/project/secret",
        name: "ProjectSecret",
        component: async () => {
          const { SecretIndex } = await import("@pages/project");
          return SecretIndex;
        },
        meta: {
          title: "密钥管理",
          showLink: false
        }
      },
      {
        path: "/project/ai/llm",
        name: "ProjectAiLlm",
        component: async () => {
          const { LlmIndex } = await import("@pages/project");
          return LlmIndex;
        },
        meta: {
          title: "大语言模型",
          showLink: false
        }
      },
      {
        path: "/project/ai/vincent",
        name: "ProjectAiVincent",
        component: async () => {
          const { VincentIndex } = await import("@pages/project");
          return VincentIndex;
        },
        meta: {
          title: "图像生成",
          showLink: false
        }
      },
      {
        path: "/project/ai/video",
        name: "ProjectAiVideo",
        component: async () => {
          const { VideoIndex } = await import("@pages/project");
          return VideoIndex;
        },
        meta: {
          title: "视频生成",
          showLink: false
        }
      },
      {
        path: "/project/ai/colorization",
        name: "ProjectAiColorization",
        component: async () => {
          const { ColorizationIndex } = await import("@pages/project");
          return ColorizationIndex;
        },
        meta: {
          title: "图像上色",
          showLink: false
        }
      },
      {
        path: "/project/ai/resolution",
        name: "ProjectAiResolution",
        component: async () => {
          const { ResolutionIndex } = await import("@pages/project");
          return ResolutionIndex;
        },
        meta: {
          title: "图像分辨率增强",
          showLink: false
        }
      },
      {
        path: "/project/template/device",
        name: "device-template",
        component: async () => {
          const { DeviceTemplate } = await import("@pages/project");
          return DeviceTemplate;
        },
        meta: {
          title: "设备模板",
          showLink: false
        }
      },
      {
        path: "/project/template/sms",
        name: "sms-template",
        component: async () => {
          const { SmsTemplate } = await import("@pages/project");
          return SmsTemplate;
        },
        meta: {
          title: "短信模板",
          showLink: false
        }
      },
      {
        path: "/project/template/email",
        name: "email-template",
        component: async () => {
          const { EmailTemplate } = await import("@pages/project");
          return EmailTemplate;
        },
        meta: {
          title: "邮件模板",
          showLink: false
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
