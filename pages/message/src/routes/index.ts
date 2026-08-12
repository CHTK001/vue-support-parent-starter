/**
 * 消息推送模块路由配置（@pages/message）
 *
 * 嵌套结构：/message 父节点 + 叶子子路由。
 */
import type { RouteConfigsTable } from "@repo/core";

export const messageRoutes: RouteConfigsTable[] = [
  {
    path: "/message",
    name: "Message",
    redirect: "/message/provider",
    meta: {
      title: "消息推送",
      icon: "Message",
      showLink: true,
    },
    children: [
      {
        path: "/message/provider",
        name: "MessageProvider",
        component: () => import("../views/ProviderManage.vue"),
        meta: {
          title: "消息提供商",
          icon: "OfficeBuilding",
          showLink: true,
          keepAlive: true,
        },
      },
      {
        path: "/message/template",
        name: "MessageTemplate",
        component: () => import("../views/TemplateManage.vue"),
        meta: {
          title: "消息模板",
          icon: "Message",
          showLink: true,
          keepAlive: true,
        },
      },
      {
        path: "/message/log",
        name: "MessageLog",
        component: () => import("../views/SendLog.vue"),
        meta: {
          title: "发送日志",
          icon: "Document",
          showLink: true,
          keepAlive: true,
        },
      },
    ],
  },
];
