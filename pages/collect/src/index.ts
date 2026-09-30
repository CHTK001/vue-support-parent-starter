/**
 * @pages/collect —— 采集模块页面包。
 *
 * 承载采集侧的全部视图、API 与路由树：数据采集分组
 * （流程设计 / 任务监控 / 采集结果 / 变量管理 / 数据源 / 函数库 / 执行通知）。
 *
 * 平台总览与 /home 重定向属跨系统视图，留在宿主 app；调度侧在 @pages/job。
 * 三者由采集调度系统（apps/vue-support-collect-scheduler-starter）在入口处拼装。
 * 本包自带私有 HTTP 客户端（./api/http），与 job 包各自持有一份，
 * 照 pages/datasource 的既有约定，不跨包共享。
 */
// 样式随包走：谁 import 本包谁就得到采集侧样式，宿主不必记得单独引
import "./styles/collect.css";

export { collectRoutes } from "./routes";
export { default as collectRoutesTree } from "./routes";

// keep-alive 白名单按路由 name 登记，宿主入口在挂载后调用一次
export { registerCollectKeepAlive } from "./composables/useCollectKeepAlive";

// 采集侧 API 与领域类型
export * from "./api/collectApi";
export * from "./types/collect";

// CollectColumn 在 collectApi（转导自 @pages/datasource）与 types/collect（采集侧领域类型）
// 各有一份，两个 export * 会撞名报 TS2308。这里显式指定用领域类型那份来消除歧义；
// 需要数据源台账的类型时，直接从 @pages/datasource 引。
export type { CollectColumn } from "./types/collect";

// 采集侧贡献给 home 仪表板的 widget（app 侧用 .widgets(defineWidgetContribution(collectWidgets)) 接线）
export { collectWidgets } from "./widgets/collectWidgets";

// 采集侧的通用小件：平台总览（跑在 app 里）与包内视图都要用，故一并导出
export * from "./constants/taskStatus";
// 操作列全局配置：包内视图与宿主 app 共用同一份动作元数据
export * from "./constants/actionColumns";
export * from "./composables/useCollectView";
export * from "./utils/time";
