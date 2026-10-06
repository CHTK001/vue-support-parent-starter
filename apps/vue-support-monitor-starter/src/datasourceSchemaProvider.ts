/**
 * 监控台的数据源表结构提供者。
 *
 * <p>共享包 {@code @pages/datasource} 的「浏览表结构」默认走采集平台的
 * {@code /v2/collect/datasource/*}，监控台后端不含采集模块，这里改用监控后端自带的
 * {@code /ms/monitor/db/*}，让该功能在监控台同样可用，且不产生对采集平台的运行期依赖。</p>
 *
 * <p>调用时机：应用启动时注册一次（见 main.ts），数据源中心页的「浏览表结构」
 * 即走本实现。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import {
  fetchDataSource,
  setDatasourceSchemaProvider,
  type CollectColumn,
  type DataSourceInfo,
} from "@pages/datasource";
import { fetchDbDatabases, fetchDbTables, fetchTableColumns } from "./monitorApi";

/**
 * 每个数据源在浏览时会话内选定的库。
 *
 * <p>列元数据接口需要 database 参数，而「浏览表结构」只携带数据源 ID，
 * 因此先由表清单流程选定并缓存，列查询复用同一库。</p>
 */
const databaseCache = new Map<number, string>();

/** 系统库：仅当数据源自身未登记库名时才跳过 */
const SYSTEM_DATABASES = new Set([
  "information_schema",
  "performance_schema",
  "mysql",
  "sys",
  "pg_catalog",
]);

/**
 * 候选库顺序：优先数据源登记的库名，其次首个非系统库，最后其余库。
 *
 * <p>系统库（如 mysql）在部分服务端不可枚举表，故登记库取不到表时按此顺序回退。</p>
 *
 * @param meta      数据源台账，可能为 null
 * @param databases 服务端返回的库列表
 * @return 去重后的候选库（最多 3 个，避免逐库试错拖慢弹窗）
 */
function pickDatabaseCandidates(meta: DataSourceInfo | null, databases: string[]): string[] {
  const ordered: string[] = [];
  const push = (name: string | undefined) => {
    if (name && databases.includes(name) && !ordered.includes(name)) {
      ordered.push(name);
    }
  };
  const configured = typeof meta?.database === "string" ? meta.database.trim() : "";
  push(configured);
  push(databases.find(name => !SYSTEM_DATABASES.has(name.toLowerCase())));
  databases.forEach(name => push(name));
  // 文件库（SQLite）没有「库」概念，服务端返回 []：兜一个空串候选，
  // 走「默认库」链路（fetchDbTables(id, ""))拉表，弹窗才不至于空手而归
  if (!ordered.length) {
    ordered.push("");
  }
  return ordered.slice(0, 3);
}

/**
 * 注册监控台的表结构提供者（启动时调用一次）。
 */
export function registerMonitorDatasourceSchema(): void {
  setDatasourceSchemaProvider({

    async fetchTables(datasource) {
      const id = Number(datasource);
      if (!Number.isFinite(id) || id <= 0) {
        return [];
      }
      const [meta, databases] = await Promise.all([
        fetchDataSource(id).catch(() => null),
        fetchDbDatabases(id).catch(() => [] as string[]),
      ]);
      const candidates = pickDatabaseCandidates(meta, databases ?? []);
      for (const database of candidates) {
        const tables = await fetchDbTables(id, database).catch(() => []);
        if (tables && tables.length > 0) {
          databaseCache.set(id, database);
          return tables.map(table => table.name);
        }
      }
      databaseCache.delete(id);
      return [];
    },

    async fetchColumns(datasource, table) {
      const id = Number(datasource);
      if (!Number.isFinite(id) || id <= 0) {
        return [];
      }
      const columns = await fetchTableColumns(table, id, databaseCache.get(id));
      return (columns ?? []).map(
        (column): CollectColumn => ({
          name: column.name,
          label: column.remark ?? null,
          position: column.position ?? null,
          typeName: column.type ?? null,
          size: column.size ?? null,
          nullable: column.nullable ?? null,
          primaryKey: column.isPrimaryKey ?? null,
        }),
      );
    },
  });
}
