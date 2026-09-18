/**
 * @pages/project —— 发布项目管理页面包
 *
 * 提供软件部署/升级项目维护：项目台账卡片、拖拽上传部署、升级策略配置、
 * 启动/停止/重启与部署日志审计。
 *
 * 由宿主应用（vue-support-monitor-starter，single 模式）直接消费：
 *   import { ScProjectList } from "@pages/project/views/ScProjectList.vue";
 * 或按需引用 src/api 中的 API 封装。
 */
export { projectRoutes } from "./routes";
export { default as ScProjectList } from "./views/ScProjectList.vue";
export { default as ScProjectFormDialog } from "./components/ScProjectFormDialog.vue";
export { default as ScLiveLog } from "./components/ScLiveLog.vue";
export { default as ScDeployLog } from "./components/ScDeployLog.vue";
export * from "./api";
