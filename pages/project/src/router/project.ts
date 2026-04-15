import type { RouteConfigsTable } from "@repo/core";

const loadProjectIndex = async () =>
  (await import("../views/project/index.vue")).default;
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
