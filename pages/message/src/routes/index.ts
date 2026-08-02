/**
 * 消息推送模块路由配置（@repo/message）
 */
import type { RouteConfigsTable } from "@repo/core";

/** 消息推送模块路由（/v2/message 子页面） */
export const messageRoutes: RouteConfigsTable[] = [
  {
    path: "/message/provider",
    name: "MessageProvider",
    component: () => import("./views/ProviderManage.vue"),
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
    component: () => import("./views/TemplateManage.vue"),
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
    component: () => import("./views/SendLog.vue"),
    meta: {
      title: "发送日志",
      icon: "Document",
      showLink: true,
      keepAlive: true,
    },
  },
];
