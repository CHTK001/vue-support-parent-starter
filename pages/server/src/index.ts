/**
 * @pages/server —— 服务器资产管理页面包
 *
 * 提供服务器资产核心页面：主机/批量作业/会话审计/维护计划/分组/片段，
 * 以及后端 API 封装、路由表、静态菜单。
 *
 * 由宿主应用（router 模式 + koi layout）消费：
 *   import "@pages/server";
 *   createContextApp({}).routes(serverRoutes)...  或 手动 addRoute("layout", r)
 *   registerStaticMenu(serverMenus)
 */
export { serverRoutes, serverMenus } from "./routes";
export { default as ReHostList } from "./views/ReHostList.vue";
export { default as ReExecTab } from "./views/ReExecTab.vue";
export { default as ReSessionTab } from "./views/ReSessionTab.vue";
export { default as ReMaintenancePlan } from "./views/ReMaintenancePlan.vue";
export { default as ReGroupTree } from "./views/ReGroupTree.vue";
export { default as ReTerminalSnippetManager } from "./views/ReTerminalSnippetManager.vue";
export { default as ReHostFormDialog } from "./components/ReHostFormDialog.vue";
export { default as ReHostDetail } from "./components/ReHostDetail.vue";
export { default as ReConnectDialog } from "./components/ReConnectDialog.vue";
export { default as ReGuacViewer } from "./components/ReGuacViewer.vue";
export { default as ReSftpPanel } from "./components/ReSftpPanel.vue";
export { default as ReTerminal } from "./components/ReGuacViewer.vue";
export * from "./api";
