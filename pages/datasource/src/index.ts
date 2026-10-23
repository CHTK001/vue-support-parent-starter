/**
 * @pages/datasource —— 数据源中心共享包（全站唯一实现方）
 *
 * 提供数据源台账页面与后端 API：
 *   - 台账 CRUD/测试  → 后端 spring-support-datasource-hub-starter 的 /ms/datasource
 *   - 表结构/DDL/字段映射 → 同一数据源模块：/ms/datasource/tables|columns|ddl/*|mapping/resolve
 *     （采集侧 /v2/collect/datasource 的同类接口已改为薄委托，能力只此一份）
 *
 * 采集控制台、监控台、nginx 等页面都从这里取数据源，不再各自实现一份。
 *
 * 页面组件通过 registerMenuViewModules 以懒加载注册：
 * 后端菜单 component（如 datasource/index）自动映射到本地 .vue。
 */
import { registerMenuViewModules } from "@repo/core";

// 后端菜单 component → 本地页面（懒加载，仅访问时 import）。
// 菜单 component 值存在数据库里，这里按几种常见写法都注册一遍；
// createMenuRouteResolver 还会按末两段后缀回退匹配（见 packages/core/src/router/menu.ts），
// 多注册的 key 只是 Map 多几项，不影响解析结果。
registerMenuViewModules({
  "views/datasource/index.vue": () => import("./views/ScDataSourceView.vue"),
  "views/datasource/list/index.vue": () => import("./views/ScDataSourceView.vue"),
  "views/datasource/ScDataSourceView.vue": () => import("./views/ScDataSourceView.vue"),
});

export {
  APP_DATASOURCE,
  setDatasourceHubBase,
  getDatasourceHubBase,
  fetchDataSources,
  fetchDataSource,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSource,
  fetchDataSourceTypes,
  fetchDatasourceOptions,
  fetchDatasourceTables,
  fetchDatasourceTableInfos,
  fetchDatasourceColumns,
  hubSchemaProvider,
  toTableOptions,
  toColumnOptions,
  setDatasourceSchemaProvider,
  fetchTableExists,
  previewTableDdl,
  executeTableDdl,
  resolveFieldMapping,
} from "./api";
export type {
  CollectColumn,
  CollectOption,
  CollectTable,
  DataSourceInfo,
  DataSourceOption,
  DataSourceTestResult,
  DatasourceSchemaProvider,
  DdlColumn,
  TableDdlRequest,
  TableDdlResult,
  SourceField,
  FieldMapping,
} from "./api";
export { ApiError, setUnauthorizedHandler } from "./api/request";

// 路由收敛口：管理页路由与「类型→路径」映射都由本包声明，宿主只做合并。
// 宿主不要再在自己的 routes.ts 里抄这些视图路径 —— 抄两份就会漏（历史上漏过 /prometheus）。
export {
  createDatasourceManageRoutes,
  managerRouteFor,
  MANAGER_ROUTE_MAP,
  MANAGER_ROUTE_PATHS,
  createSyncTaskRoutes,
} from "./routes";
export type { DatasourceManageRoutesOptions } from "./routes";

// 共享组件：他模块直接 import 这几个就能拿到「选数据源 / 选表 / 选字段 / 建表」
export {
  DatasourceSelect,
  TableSelect,
  ColumnSelect,
  DatasourceTableSelect,
  CreateTableDialog,
} from "./components/selectors";

// 数据库管理器沿用的「设计表」组件：表名 + 字段网格，非 DDL 预览
export { default as DesignTableDialog } from "./components/console/CreateTableDialog.vue";

// 数据源「浏览表结构」的 schema 提供者（监控侧实现）。
//
// 实现与它依赖的 /ms/monitor/db/* 接口同处 api/manageConsoles，由该模块导入时自动注册：
// 宿主用到数据源控制台页面即意味着「浏览表结构」该走监控侧接口，
// 不必再在 main.ts 里手写一次注册调用。
//
// registerMonitorDatasourceSchema 仍导出，供需要提前注册的首屏场景显式调用（幂等）。
export { registerMonitorDatasourceSchema } from "./schema/monitorSchemaProvider";
