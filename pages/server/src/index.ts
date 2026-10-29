/**
 * @pages/server —— 服务器资产管理页面包
 *
 * 提供服务器资产核心页面：主机/批量作业/会话审计/维护计划/分组/片段，
 * 以及后端 API 封装、路由表、静态菜单。
 *
 * 命名规范：仅通用组件用 ReXxx（@repo/ui），本项目自有组件统一 ScXxx。
 *
 * 由宿主应用（router 模式 + koi layout）消费：
 *   import "@pages/server";
 *   createContextApp({}).routes(serverRoutes)...  或 手动 addRoute("layout", r)
 *   registerStaticMenu(serverMenus)
 */
export { serverRoutes } from "./routes";
export { default as ScHostList } from "./views/ScHostList.vue";
export { default as ScExecTab } from "./views/ScExecTab.vue";
export { default as ScSessionTab } from "./views/ScSessionTab.vue";
export { default as ScMaintenancePlan } from "./views/ScMaintenancePlan.vue";
export { default as ScGroupTree } from "./views/ScGroupTree.vue";
export { default as ScTerminalSnippetManager } from "./views/ScTerminalSnippetManager.vue";
export { default as ScHostFormDialog } from "./components/ScHostFormDialog.vue";
export { default as ScHostDetail } from "./components/ScHostDetail.vue";
export { default as ScConnectDialog } from "./components/ScConnectDialog.vue";
export { default as ScGuacViewer } from "./components/ScGuacViewer.vue";
export { default as ScSftpPanel } from "./components/ScSftpPanel.vue";
export { default as ScTerminal } from "./components/ScGuacViewer.vue";
export * from "./api";
export * from "./services";
