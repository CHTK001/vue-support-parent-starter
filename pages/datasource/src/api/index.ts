/**
 * 数据源中心 API 封装（@pages/datasource）
 *
 * 对接后端 spring-support-datasource-hub-starter 暴露的 /ms/datasource 接口：
 *   1) GET    /ms/datasource                  — 列表（等价 /list）
 *   2) GET    /ms/datasource/{id}             — 详情
 *   3) POST   /ms/datasource                  — 新增
 *   4) PUT    /ms/datasource/{id}             — 更新
 *   5) DELETE /ms/datasource/{id}             — 删除
 *   6) POST   /ms/datasource/{id}/test        — 连通性测试（只测已存在的）
 *   7) GET    /ms/datasource/types            — 支持的类型
 *
 * 另外补两个采集平台独有的元数据接口（hub 只管"连得上"，不管"浏览表结构"）：
 *   8) GET    /v2/collect/datasource/tables   — 表清单
 *   9) GET    /v2/collect/datasource/columns  — 列元数据
 *
 * 请求走本包私有客户端（见 ./request），返回已解包的业务数据。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { del, get, post, put } from "./request";

/** 数据源中心接口根路径 */
const HUB = "/ms/datasource";

/** 采集平台接口根路径 */
const COLLECT = "/v2/collect/datasource";

/** 应用主库保留字，对应容器里的主 DataSource，不是台账里的行 */
export const APP_DATASOURCE = "app";

/** 下拉选项，value 始终是字符串 */
export interface DataSourceOption {
  value: string;
  label: string;
}

/** 数据源信息 */
export interface DataSourceInfo {
  id?: number;
  name: string;
  type: string;
  host?: string;
  port?: number | null;
  /** jdbc 类型时这里存完整 JDBC URL */
  database?: string | null;
  username?: string | null;
  password?: string | null;
  remark?: string | null;
  /** 状态，0 停用、1 启用 */
  status?: number | null;
  /** JDBC 驱动类名 */
  driverClassName?: string | null;
  createTime?: string | null;
  updateTime?: string | null;
}

/** 连通性测试结果 */
export interface DataSourceTestResult {
  success?: boolean;
  message?: string;
  type?: string;
  version?: string;
}

/** 通用下拉选项 */
export interface CollectOption {
  value: string;
  label: string;
}

/** 数据表列元数据，入库节点字段映射的候选列 */
export interface CollectColumn {
  name: string;
  label: string | null;
  position: number | null;
  typeName: string | null;
  size: number | null;
  nullable: boolean | null;
  primaryKey: boolean | null;
}

/**
 * 获取所有数据源。
 * @return 数据源列表
 */
export function fetchDataSources(): Promise<DataSourceInfo[]> {
  return get<DataSourceInfo[]>(`${HUB}/list`);
}

/**
 * 获取数据源详情。
 * @param id 数据源 ID
 * @return 数据源信息
 */
export function fetchDataSource(id: number): Promise<DataSourceInfo> {
  return get<DataSourceInfo>(`${HUB}/${id}`);
}

/**
 * 创建数据源。
 * @param data 数据源定义
 * @return 创建后的数据源
 */
export function createDataSource(data: Partial<DataSourceInfo>): Promise<DataSourceInfo> {
  return post<DataSourceInfo>(HUB, data);
}

/**
 * 更新数据源。
 * @param id   数据源 ID
 * @param data 数据源定义
 * @return 更新后的数据源
 */
export function updateDataSource(id: number, data: Partial<DataSourceInfo>): Promise<DataSourceInfo> {
  return put<DataSourceInfo>(`${HUB}/${id}`, data);
}

/**
 * 删除数据源。
 * @param id 数据源 ID
 * @return 删除结果
 */
export function deleteDataSource(id: number): Promise<boolean> {
  return del<boolean>(`${HUB}/${id}`);
}

/**
 * 测试已存在数据源的连接。
 * @param id 数据源 ID
 * @return 连接测试结果
 */
export function testDataSource(id: number): Promise<DataSourceTestResult> {
  return post<DataSourceTestResult>(`${HUB}/${id}/test`);
}

/**
 * 获取支持的数据源类型列表。
 * @return 数据源类型列表
 */
export function fetchDataSourceTypes(): Promise<string[]> {
  return get<string[]>(`${HUB}/types`);
}

/**
 * 采集侧数据源下拉：首项固定是应用主库 app，其后是数据源中心里的启用项。
 *
 * <p>app 不是台账里的行（它解析的是容器主 DataSource，运行期才知道 URL），
 * 所以这里本地拼一个不可编辑的首项。</p>
 *
 * @return 下拉选项
 */
export async function fetchDatasourceOptions(): Promise<CollectOption[]> {
  const rows = (await fetchDataSources()) ?? [];
  return [
    { value: APP_DATASOURCE, label: "应用主库" },
    ...rows
      .filter(row => row.status === null || row.status !== 0)
      .map(row => ({ value: String(row.id), label: row.name })),
  ];
}

/**
 * 表结构元数据提供者。
 *
 * <p>数据源中心（hub）只管「连得上」，不提供库表浏览；默认实现走采集平台的
 * {@code /v2/collect/datasource/tables|columns}。宿主应用的后端另有库表接口时
 * （如监控台的 {@code /ms/monitor/db/*}），可在启动时注入自己的实现，
 * 避免运行期依赖采集平台。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
export interface DatasourceSchemaProvider {

  /**
   * 读数据源下的表名清单。
   *
   * @param datasource 数据源 ID 或名称；不传、空串、保留字 app 表示应用主库
   * @return 表名清单
   */
  fetchTables(datasource: string | number | null | undefined): Promise<string[]>;

  /**
   * 读指定表的列元数据。
   *
   * @param datasource 数据源 ID 或名称；不传、空串、保留字 app 表示应用主库
   * @param table      表名，必须是合法标识符
   * @return 列元数据
   */
  fetchColumns(datasource: string | number | null | undefined, table: string): Promise<CollectColumn[]>;
}

/** 默认实现：采集平台元数据接口 */
const collectSchemaProvider: DatasourceSchemaProvider = {

  fetchTables: datasource => get<string[]>(`${COLLECT}/tables`, { datasource: normalizeRef(datasource) }),

  fetchColumns: (datasource, table) =>
    get<CollectColumn[]>(`${COLLECT}/columns`, { datasource: normalizeRef(datasource), table }),
};

/** 当前生效的表结构元数据提供者 */
let schemaProvider: DatasourceSchemaProvider = collectSchemaProvider;

/**
 * 注入表结构元数据提供者；传 null 恢复采集平台默认实现。
 *
 * @param provider 宿主应用提供的实现
 */
export function setDatasourceSchemaProvider(provider: DatasourceSchemaProvider | null): void {
  schemaProvider = provider ?? collectSchemaProvider;
}

/**
 * 读表清单，供入库节点选目标表、表结构浏览用。
 *
 * @param datasource 数据源 ID 或名称；不传、空串、保留字 app 表示应用主库
 * @return 表名清单
 */
export function fetchDatasourceTables(datasource?: string | number | null): Promise<string[]> {
  return schemaProvider.fetchTables(datasource);
}

/**
 * 读指定表的列元数据。
 *
 * @param datasource 数据源 ID 或名称；不传、空串、保留字 app 表示应用主库
 * @param table      表名，必须是合法标识符
 * @return 列元数据
 */
export function fetchDatasourceColumns(
  datasource: string | number | null | undefined,
  table: string,
): Promise<CollectColumn[]> {
  return schemaProvider.fetchColumns(datasource, table);
}

/**
 * 数据源引用归一化：空值统一成 undefined，避免拼出 datasource=undefined。
 *
 * @param value 原始引用
 * @return 查询参数值
 */
function normalizeRef(value: string | number | null | undefined): string | undefined {
  return value === undefined || value === null || value === "" ? undefined : String(value);
}
