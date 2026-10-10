/**
 * @pages/ai —— AI 控制台共享包
 *
 * 全部业务源码归档于此（聊天 / 角色 / 模型 / 设置 / 知识库 / 插件等），
 * vue-support-ai-guada 只作为启动壳。
 */
export { mountAiApp } from "./main.js";
export { default as ModelsPage } from "./components/models/ModelsPage.vue";
export { default as SystemSettings } from "./components/setting/SystemSettings.vue";
export { default as DefaultModelSettings } from "./components/setting/DefaultModelSettings.vue";
export { default as ModelsProviderList } from "./components/setting/ModelsProviderList.vue";