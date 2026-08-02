/**
 * @repo/message —— 消息推送管理共享包
 *
 * 提供消息提供商管理、消息模板管理、消息发送与推送日志页面，以及 API 封装与路由。
 * 业务应用通过 @repo/message 引入页面与路由，无需自写视图代码。
 */
export { default as ProviderManage } from "./views/ProviderManage.vue";
export { default as TemplateManage } from "./views/TemplateManage.vue";
export { default as SendLog } from "./views/SendLog.vue";
export { messageRoutes } from "./routes";
export * from "./api/types";
export * from "./api/messageApi";
