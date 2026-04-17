import type { RouteConfigsTable } from "@repo/core";

// 全新项目管理（含服务器信息）
const loadProjectIndex = async () =>
  (await import("../views/project/index.vue")).default;

// 密钥管理（原项目管理改造而来）
const loadSecretIndex = async () =>
  (await import("../views/secret/index.vue")).default;

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
      // 全新项目管理主页
      {
        path: "/project/manage",
        name: "ProjectManage",
        component: loadProjectIndex,
        meta: {
          title: "项目管理",
        },
      },
      // 密钥管理主页（原项目管理）
      {
        path: "/secret/manage",
        name: "SecretManage",
        component: loadSecretIndex,
        meta: {
          title: "密钥管理",
        },
      },
      // 旧路由兼容重定向
      {
        path: "/project/secret",
        redirect: "/secret/manage",
        meta: {
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
