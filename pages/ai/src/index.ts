/**
 * @pages/ai —— AI 配置共享包
 *
 * 提供「提供商管理 / 模型管理 / 默认模型配置」三块独立组件 + 一条新设计的
 * 「AI 配置」菜单（路由树即菜单树），供任意业务系统集成，配置 ai-starter
 * 的全局能力（sys_ai_provider / sys_ai_provider_model / sys_ai_global_setting）。
 * 后端零改动：全部打 spring-support-ai-starter 既有端点，逻辑与 ai-guada 控制台同源。
 *
 * 用法（宿主应用 main.ts）：
 *   import { aiRoutes } from "@pages/ai";
 *   createContextApp({ install }).routes([...hostRoutes, ...aiRoutes] as never).mount("#app");
 *   —— 侧边栏自动多出分组「AI 配置」及三个页面（分组父节点 meta.isGroup 约定同 @pages/eduai）。
 *
 * 也可以只取单个组件自行装配：
 *   import { AiProviderView, aiAdminApi } from "@pages/ai";
 */
export { aiRoutes } from "./router";
export { aiAdminApi, notifyFail } from "./api/aiAdminApi";
export type {
  AiProviderRow,
  AiProviderModelRow,
  SettingsMergedRow,
  PipelineField,
  ProviderPayload,
  ModelPayload,
  TestConnectionResult,
} from "./api/aiAdminApi";
export { default as AiProviderView } from "./views/AiProviderView.vue";
export { default as AiModelView } from "./views/AiModelView.vue";
export { default as AiDefaultConfigView } from "./views/AiDefaultConfigView.vue";
