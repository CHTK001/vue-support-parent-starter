/**
 * @pages/message —— 消息推送管理共享包
 *
 * 提供消息提供商管理、消息发送与推送日志页面，以及 API 封装与路由。
 * 业务应用通过 @pages/message 引入页面与路由，无需自写视图代码。
 *
 * 页面组件通过 registerMenuViewModules 以懒加载（异步组件）注册，
 * 后端菜单 component（如 message/provider/index）自动映射到本地 .vue。
 *
 * 2026-11 合并说明：模板编辑页（原 views/message/template/index.vue → TemplateManage.vue）
 * 已下线。短信 / 邮件模板统一在系统管理的 {@code /manage/message}
 * （pages/system/MessageManage.vue「消息模板」页签）里维护，它打同一组
 * {@code /v2/message/template/*} 接口而字段更全；统一模板库的只读视图在 {@code /template}。
 * 因此本包不再导出 TemplateManage —— 留着导出只会让下一个宿主又接出一套重复的模板 CRUD。
 */
import { registerMenuViewModules } from "@repo/core";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）
// 注意：这里**不再注册** views/message/template/index.vue —— 重复的模板 CRUD 已合并。
registerMenuViewModules({
  "views/message/provider/index.vue": () => import("./views/ProviderManage.vue"),
  "views/message/log/index.vue": () => import("./views/SendLog.vue"),
});

export { default as ProviderManage } from "./views/ProviderManage.vue";
export { default as SendLog } from "./views/SendLog.vue";
export { messageRoutes } from "./routes";
export * from "./api/types";
export * from "./api/messageApi";
