/**
 * @repo/message —— 消息推送管理共享包
 *
 * 提供消息提供商管理、消息模板管理、消息发送与推送日志页面，以及 API 封装与路由。
 * 业务应用通过 @repo/message 引入页面与路由，无需自写视图代码。
 *
 * 页面组件通过 registerMenuViewModules 以懒加载（异步组件）注册，
 * 后端菜单 component（如 message/provider/index）自动映射到本地 .vue。
 */
import { registerMenuViewModules } from "@repo/core";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）
registerMenuViewModules({
  "views/message/provider/index.vue": () => import("./views/ProviderManage.vue"),
  "views/message/template/index.vue": () => import("./views/TemplateManage.vue"),
  "views/message/log/index.vue": () => import("./views/SendLog.vue"),
});

export { default as ProviderManage } from "./views/ProviderManage.vue";
export { default as TemplateManage } from "./views/TemplateManage.vue";
export { default as SendLog } from "./views/SendLog.vue";
export { messageRoutes } from "./routes";
export * from "./api/types";
export * from "./api/messageApi";
