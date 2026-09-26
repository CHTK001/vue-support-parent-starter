/**
 * @pages/datasource —— 数据源中心共享包（全站唯一实现方）
 *
 * 提供数据源台账页面与后端 API：
 *   - 台账 CRUD/测试  → 后端 spring-support-datasource-hub-starter 的 /ms/datasource
 *   - 表清单/列元数据  → 采集平台 /v2/collect/datasource（hub 只管"连得上"，不管"浏览表结构"）
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
  fetchDataSources,
  fetchDataSource,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSource,
  fetchDataSourceTypes,
  fetchDatasourceOptions,
  fetchDatasourceTables,
  fetchDatasourceColumns,
  setDatasourceSchemaProvider,
} from "./api";
export type {
  CollectColumn,
  CollectOption,
  DataSourceInfo,
  DataSourceOption,
  DataSourceTestResult,
  DatasourceSchemaProvider,
} from "./api";
export { ApiError, setUnauthorizedHandler } from "./api/request";
