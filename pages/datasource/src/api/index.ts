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
 * 另外提供数据源中心（数据源模块）的结构与 DDL 接口：
 *   8) GET    /ms/datasource/tables          — 表清单
 *   9) GET    /ms/datasource/columns         — 列元数据
 *  10) GET    /ms/datasource/table-exists    — 表是否存在
 *  11) POST   /ms/datasource/ddl/preview     — 预览建表 DDL
 *  12) POST   /ms/datasource/ddl/execute     — 执行建表 / 补列
 *  13) POST   /ms/datasource/mapping/resolve — 解析字段映射
 *
 * 表结构、建表与字段映射都归数据源模块：采集/监控等系统只消费这些接口，
 * 不再各自实现一份（采集侧的 /v2/collect/datasource/tables|columns 已改为薄委托）。
 *
 * 请求走本包私有客户端（见 ./request），返回已解包的业务数据。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { del, get, post, put } from "./request";

/**
 * 数据源中心接口根路径。
 *
 * <p>这是<b>相对 API 基址</b>的路径，不要带 context-path：本包的私有客户端（见 ./request）
 * 已在每个请求前拼上 {@code getConfig().http.baseUrl}，所以默认 {@code /ms/datasource}
 * 在采集应用里实际请求的就是 {@code /collect/api/ms/datasource}。</p>
 *
 * <p>只有当 hub 挂在别的基址下（例如另一个后端）时才需要覆盖，此时传完整路径
 * （含 context-path）——客户端会识别已带基址的路径，不会重复叠加。</p>
 */
let hubBase = "/ms/datasource";

/**
 * 覆盖数据源中心接口根路径。
 *
 * <p>默认无需调用：私有客户端自带 API 基址（context-path），{@code /ms/datasource}
 * 就已经指向了宿主 context-path 下的 hub 接口。传入值若不含 context-path 也可以，
 * 客户端会补齐。</p>
 *
 * <p>非法值（不以 {@code /} 开头）会被拒绝并保留原值：一旦让脏值进来，
 * 本包所有接口都会 404「资源不存在」，而排查方向很容易误判成后端没注册接口。</p>
 *
 * @param base 根路径；留空则恢复默认 {@code /ms/datasource}
 */
export function setDatasourceHubBase(base?: string | null): void {
  const candidate = (base ?? "").trim().replace(/\/+$/, "");
  if (!candidate) {
    hubBase = "/ms/datasource";
    return;
  }
  if (!candidate.startsWith("/")) {
    console.warn("[@pages/datasource] setDatasourceHubBase 忽略非法值（必须以 / 开头）：", base);
    return;
  }
  hubBase = candidate;
}

/**
 * 读取当前生效的数据源中心接口根路径。
 *
 * <p>用于调用方自己拼 URL 的场景（例如错误提示里回显实际请求地址、或把 hub 基址
 * 传给非本包封装的请求）。默认返回 {@code /ms/datasource}；被
 * {@link setDatasourceHubBase} 覆盖后返回覆盖值（去掉尾部斜杠）。</p>
 *
 * @return 当前根路径，始终以 {@code /} 开头、无尾部斜杠
 */
export function getDatasourceHubBase(): string {
  return hubBase;
}

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
  /**
   * 引用的驱动 jar（`ms_jdbc_driver_jar.id`）；空表示用应用 classpath 上的内置驱动。
   *
   * <p>本机不可能备齐所有数据库的驱动 jar（ojdbc、mssql-jdbc 与各类国产库驱动
   * 体积都在数 MB、许可各异），所以允许按数据源上传驱动。</p>
   */
  driverJarId?: number | null;
  /**
   * 扩展配置（JSON）。
   *
   * <p>InfluxDB / Neo4j / Nacos / ZooKeeper 这类中间件数据源，其 organization、
   * 集群地址等专用参数不在台账主字段里，统一放在这里；
   * {@code externalDatasource.extraText()} 会按键名逐个回退取值。</p>
   */
  config?: Record<string, unknown> | null;
  createTime?: string | null;
  updateTime?: string | null;
  /** 连接延迟（毫秒），点「测试连接」后由后端回写；从未测试过时为 null */
  connectLatencyMs?: number | null;
  /** 会话延迟（毫秒），点「测试连接」后由后端回写；从未测试过时为 null */
  sessionLatencyMs?: number | null;
  /** 最近一次测试时间（ISO-8601 文本） */
  lastTestTime?: string | null;
  /** 最近一次测试是否连通，null 表示从未测试 */
  lastTestOk?: number | null;
  /**
   * 进程控制方式（仅 nginx 类型使用）
   *
   * <p>空串或 undefined 表示自动探测：后端认得出托管单元、且当前 SSH 用户对该单元
   * 有免密 systemctl 权限时才走 systemd，否则用本地目录方式。这也是本字段引入前的行为。</p>
   */
  controlMode?: string | null;
  /**
   * 托管单元名，仅 `controlMode === "systemd"` 时有意义
   *
   * <p>如 `nginx.service`；留空时仍由后端自动探测。</p>
   */
  controlTarget?: string | null;
}

/** 连通性测试结果 */
export interface DataSourceTestResult {
  success?: boolean;
  message?: string;
  type?: string;
  version?: string;
  /** 连接延迟（毫秒）；测试失败时为 null */
  connectLatencyMs?: number | null;
  /** 会话延迟（毫秒）；未测出时为 null */
  sessionLatencyMs?: number | null;
  /** 本次测试是否经由 SSH 隧道中转 */
  tunneled?: boolean;
  /** 测试时间（ISO-8601 文本） */
  testedAt?: string | null;
}

/** SSH 隧道配置（高级配置） */
export interface DataSourceTunnel {
  id?: number;
  datasourceId?: number;
  name?: string | null;
  /** LOCAL 本地转发(-L) / REMOTE 反向转发(-R) / DYNAMIC 动态SOCKS5 */
  type?: string | null;
  sshHost?: string | null;
  sshPort?: number | null;
  sshUsername?: string | null;
  /** PASSWORD 口令 / KEY 私钥 */
  sshAuthType?: string | null;
  /** SSH 口令（sshAuthType=PASSWORD 时用） */
  sshPassword?: string | null;
  /** 私钥：PEM 文本或私钥文件路径 */
  sshPrivateKey?: string | null;
  /** 私钥口令（sshAuthType=KEY 时用） */
  sshPassphrase?: string | null;
  localPort?: number | null;
  remoteHost?: string | null;
  remotePort?: number | null;
  bindAddress?: string | null;
  /** 0 停用、1 启用 */
  status?: number | null;
}

/**
 * 通用下拉选项。
 *
 * <p>带索引签名：table/column 选项会挂上表名、字段名、类型等额外字段供 ReSelect
 * 的 table 布局与自定义插槽渲染（见 {@link toTableOptions} / {@link toColumnOptions}）。</p>
 */
export interface CollectOption {
  value: string;
  label: string;
  [key: string]: unknown;
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
 * 数据表元数据：三联选的表下拉用 label=中文备注、subtitle=表名渲染。
 *
 * <p>与后端 {@code SchemaTableVO} 对齐：表名 + 表备注（REMARKS）+ 表类型（TABLE / VIEW）。</p>
 */
export interface CollectTable {
  name: string;
  comment: string | null;
  type: string | null;
}

/**
 * 获取所有数据源。
 * @return 数据源列表
 */
export function fetchDataSources(): Promise<DataSourceInfo[]> {
  return get<DataSourceInfo[]>(`${hubBase}/list`);
}

/**
 * 获取数据源详情。
 * @param id 数据源 ID
 * @return 数据源信息
 */
export function fetchDataSource(id: number): Promise<DataSourceInfo> {
  return get<DataSourceInfo>(`${hubBase}/${id}`);
}

/**
 * 创建数据源。
 * @param data 数据源定义
 * @return 创建后的数据源
 */
export function createDataSource(data: Partial<DataSourceInfo>): Promise<DataSourceInfo> {
  return post<DataSourceInfo>(hubBase, data);
}

/**
 * 更新数据源。
 * @param id   数据源 ID
 * @param data 数据源定义
 * @return 更新后的数据源
 */
export function updateDataSource(id: number, data: Partial<DataSourceInfo>): Promise<DataSourceInfo> {
  return put<DataSourceInfo>(`${hubBase}/${id}`, data);
}

/**
 * 删除数据源。
 * @param id 数据源 ID
 * @return 删除结果
 */
export function deleteDataSource(id: number): Promise<boolean> {
  return del<boolean>(`${hubBase}/${id}`);
}

/**
 * 测试已存在数据源的连接。
 * @param id 数据源 ID
 * @return 连接测试结果
 */
export function testDataSource(id: number): Promise<DataSourceTestResult> {
  return post<DataSourceTestResult>(`${hubBase}/${id}/test`);
}

/**
 * 获取支持的数据源类型列表。
 * @return 数据源类型列表
 */
export function fetchDataSourceTypes(): Promise<string[]> {
  return get<string[]>(`${hubBase}/types`);
}

/**
 * 读取指定类型数据源的运行时信息（版本、模式、状态行等）。
 *
 * <p>走类型专属控制器：{@code /ms/datasource/{type}/{id}/info}。
 * 类型无专属探针（如 jdbc）时后端返回空对象。</p>
 *
 * @param id   数据源 ID
 * @param type 数据源类型
 * @return 键值信息
 */
export function fetchDatasourceRuntimeInfo(id: number, type: string): Promise<Record<string, string>> {
  return get<Record<string, string>>(`${hubBase}/${type}/${id}/info`);
}

/**
 * 查询数据源的 SSH 隧道配置。
 *
 * @param id 数据源 ID
 * @return 隧道配置；未配置时为 null
 */
export function fetchDatasourceTunnel(id: number): Promise<DataSourceTunnel | null> {
  return get<DataSourceTunnel | null>(`${hubBase}/tunnel/${id}`);
}

/**
 * 保存数据源的 SSH 隧道配置（存在则覆盖，一个数据源至多一条）。
 *
 * @param id   数据源 ID
 * @param data 隧道配置
 * @return 保存后的配置
 */
export function saveDatasourceTunnel(id: number, data: Partial<DataSourceTunnel>): Promise<DataSourceTunnel> {
  return put<DataSourceTunnel>(`${hubBase}/tunnel/${id}`, data);
}

/**
 * 删除数据源的 SSH 隧道配置并关闭隧道。
 *
 * @param id 数据源 ID
 * @return 是否删除成功
 */
export function deleteDatasourceTunnel(id: number): Promise<boolean> {
  return del<boolean>(`${hubBase}/tunnel/${id}`);
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
 * <p>数据源中心（hub）提供结构浏览与 DDL；默认实现走 {@code /ms/datasource/tables|columns}。
 * 宿主应用的后端另有库表接口时（如监控台的 {@code /ms/monitor/db/*}），可在启动时注入自己的实现，
 * 避免运行期依赖数据源模块的实现细节。</p>
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
   * 读数据源下的表元数据（含表备注与类型）。
   *
   * <p>新后端走 {@code /table-infos}；老 provider 没实现时前端按表名兜底拼（comment/type 为 null），
   * 调用方渲染时按「有备注显示中文、无备注显示表名」处理。</p>
   *
   * @param datasource 数据源 ID 或名称；不传、空串、保留字 app 表示应用主库
   * @return 表元数据
   */
  fetchTableInfos?: (datasource: string | number | null | undefined) => Promise<CollectTable[]>;

  /**
   * 读指定表的列元数据。
   *
   * @param datasource 数据源 ID 或名称；不传、空串、保留字 app 表示应用主库
   * @param table      表名，必须是合法标识符
   * @return 列元数据
   */
  fetchColumns(datasource: string | number | null | undefined, table: string): Promise<CollectColumn[]>;
}

/** 默认实现：数据源中心（数据源模块）结构与 DDL 接口 */
const hubSchemaProvider: DatasourceSchemaProvider = {

  fetchTables: datasource => get<string[]>(`${hubBase}/tables`, { datasource: normalizeRef(datasource) }),

  fetchTableInfos: datasource =>
    get<CollectTable[]>(`${hubBase}/table-infos`, { datasource: normalizeRef(datasource) }),

  fetchColumns: (datasource, table) =>
    get<CollectColumn[]>(`${hubBase}/columns`, { datasource: normalizeRef(datasource), table }),
};

/** 当前生效的表结构元数据提供者 */
let schemaProvider: DatasourceSchemaProvider = hubSchemaProvider;

/**
 * 注入表结构元数据提供者；传 null 恢复数据源中心默认实现。
 *
 * @param provider 宿主应用提供的实现
 */
export function setDatasourceSchemaProvider(provider: DatasourceSchemaProvider | null): void {
  schemaProvider = provider ?? hubSchemaProvider;
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
 * 读表元数据（含表备注与类型），供三联选的表下拉渲染「中文名 + 表名 subtitle」。
 *
 * <p>老 provider 没实现 {@code fetchTableInfos}（或后端还是旧版没有 {@code /table-infos}）
 * 时按表名兜底：逐项拼 {@code {name, comment: null, type: null}}，调用方按无备注渲染。</p>
 *
 * @param datasource 数据源 ID 或名称；不传、空串、保留字 app 表示应用主库
 * @return 表元数据
 */
export async function fetchDatasourceTableInfos(
  datasource?: string | number | null,
): Promise<CollectTable[]> {
  if (schemaProvider.fetchTableInfos) {
    try {
      return (await schemaProvider.fetchTableInfos(datasource)) ?? [];
    } catch {
      // 旧后端没有 /table-infos 时按表名兜底，不把三联选整体打挂
    }
  }
  const names = (await schemaProvider.fetchTables(datasource)) ?? [];
  return names.map(name => ({ name, comment: null, type: null }));
}

/**
 * 表下拉选项映射：label=中文备注（无备注时回退表名），description=表名·类型。
 *
 * <p>ReSelect 的 card 布局读 {@code description} 做副标题，table 布局按
 * {@code tableColumns} 取额外字段；这里把表名、备注、类型都带上，两种布局都能渲染。</p>
 *
 * @param tables 表元数据
 * @return ReSelect 选项
 */
export function toTableOptions(tables: CollectTable[]): CollectOption[] {
  return (tables ?? []).map(item => ({
    value: item.name,
    label: item.comment?.trim() ? item.comment.trim() : item.name,
    description: item.type ? `${item.name} · ${item.type}` : item.name,
    /** 原始表名：中文 label 只是备注，下游取值仍要真实表名 */
    table: item.name,
    comment: item.comment,
    type: item.type,
  }));
}

/**
 * 字段下拉选项映射：label=中文备注（无备注时回退字段名），description=字段名·类型。
 *
 * @param columns 列元数据
 * @return ReSelect 选项
 */
export function toColumnOptions(columns: CollectColumn[]): CollectOption[] {
  return (columns ?? []).map(item => {
    const name = item.name ?? "";
    const remark = (item.label ?? "").trim();
    const type = (item.typeName ?? "").trim();
    return {
      value: name,
      label: remark ? remark : name,
      description: type ? `${name} · ${type}` : name,
      /** 原始字段名：中文 label 只是备注，下游取值仍要真实字段名 */
      field: name,
      comment: remark || null,
      type: item.typeName,
      primaryKey: item.primaryKey,
    };
  });
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

/** 建表列定义（字段映射的落库侧） */
export interface DdlColumn {
  /** 列名 */
  name: string;
  /** 列类型（含长度）；留空时按 sourceType 推断 */
  type?: string | null;
  /** 是否可空，缺省可空 */
  nullable?: boolean | null;
  /** 列注释 */
  comment?: string | null;
  /** 默认值 */
  defaultValue?: string | null;
  /** 来源字段名 */
  sourceField?: string | null;
  /** 来源字段类型（STRING/INTEGER/DECIMAL/BOOLEAN/DATE/DATETIME/JSON） */
  sourceType?: string | null;
}

/** 建表 / 补列请求 */
export interface TableDdlRequest {
  /** 数据源引用：留空或 app 表示应用主库 */
  datasource?: string | null;
  /** 目标表名 */
  table: string;
  /** 列定义 */
  columns: DdlColumn[];
  /** 主键列名 */
  primaryKey?: string[] | null;
  /** 表注释 */
  comment?: string | null;
  /** 表已存在策略：APPEND（默认，补缺失列）/ SKIP / ERROR */
  ifExists?: string | null;
  /** 是否自动加自增主键列（主键为空时生效） */
  autoIdPrimaryKey?: boolean | null;
}

/** 建表 / 补列结果 */
export interface TableDdlResult {
  table: string;
  /** 执行前表是否已存在 */
  exists: boolean;
  /** 本次是否建了新表 */
  created: boolean;
  /** 本次补上的列 */
  appendedColumns: string[];
  /** 解析出的列定义（含推断后的类型） */
  columns: CollectColumn[];
  /** 将要执行 / 已执行的 SQL */
  statements: string[];
  /** 可读提示 */
  warnings: string[];
}

/** 字段映射输入：来源字段 */
export interface SourceField {
  name: string;
  type?: string | null;
}

/** 字段映射结论 */
export interface FieldMapping {
  sourceField: string;
  sourceType: string;
  targetColumn: string;
  targetType: string;
  matched: boolean;
  /** USE=直接写、ADD=需新增列、NEW_TABLE=表还不存在 */
  action: "USE" | "ADD" | "NEW_TABLE" | string;
  note?: string | null;
}

/**
 * 判断表是否存在。
 *
 * @param datasource 数据源引用
 * @param table      表名
 * @return true=存在
 */
export function fetchTableExists(datasource: string | number | null | undefined, table: string): Promise<boolean> {
  return get<boolean>(`${hubBase}/table-exists`, { datasource: normalizeRef(datasource), table });
}

/**
 * 预览建表 / 补列 DDL（不执行）。
 *
 * @param request 建表请求
 * @return 预览结果（含 SQL 文本）
 */
export function previewTableDdl(request: TableDdlRequest): Promise<TableDdlResult> {
  return post<TableDdlResult>(`${hubBase}/ddl/preview`, request);
}

/**
 * 执行建表 / 补列。
 *
 * @param request 建表请求
 * @return 执行结果
 */
export function executeTableDdl(request: TableDdlRequest): Promise<TableDdlResult> {
  return post<TableDdlResult>(`${hubBase}/ddl/execute`, request);
}

/**
 * 解析字段映射：来源字段 ↔ 目标表列，以及需新增的列与类型建议。
 *
 * @param datasource 数据源引用
 * @param table      目标表名
 * @param fields     来源字段
 * @return 每个来源字段的映射结论
 */
export function resolveFieldMapping(
  datasource: string | number | null | undefined,
  table: string,
  fields: SourceField[],
): Promise<FieldMapping[]> {
  return post<FieldMapping[]>(`${hubBase}/mapping/resolve`, {
    datasource: normalizeRef(datasource),
    table,
    fields,
  });
}

/* ==================== JDBC 驱动 jar（需求：本机不可能备齐全部驱动包） ==================== */

/**
 * JDBC 驱动 jar 视图。
 *
 * <p>驱动 jar 落在后端管理的目录里，前端只拿元信息；{@code storedName} 是
 * 后端落盘后的文件名（含内容指纹），{@code jarSha256} 用来在出问题时确认
 * 「线上跑的到底是哪一个 jar」。</p>
 */
export interface JdbcDriverJar {
  /** 驱动 jar ID */
  id: number;
  /** 上传时的原始文件名 */
  jarName: string;
  /** 落盘文件名 */
  storedName: string;
  /** 驱动类全名，如 org.h2.Driver */
  driverClassName: string;
  /** 字节数 */
  jarSize?: number | null;
  /** 内容 sha256 */
  jarSha256?: string | null;
  /** 备注 */
  remark?: string | null;
  /** 上传时间 */
  createTime?: string | null;
}

/**
 * 列出已上传的 JDBC 驱动 jar。
 *
 * @returns 驱动 jar 列表
 */
export function fetchJdbcDriverJars(): Promise<JdbcDriverJar[]> {
  return get<JdbcDriverJar[]>(`${hubBase}/jdbc-driver`);
}

/**
 * 上传 JDBC 驱动 jar。
 *
 * <p>后端在上传的当下就会尝试加载一次驱动类，失败会连文件带台账一起回滚，
 * 所以这里拿到成功响应就等于「这个 jar 确实能用」。</p>
 *
 * @param file            jar 文件
 * @param driverClassName 驱动类全名
 * @param remark          备注
 * @returns 落库后的驱动 jar
 */
export function uploadJdbcDriverJar(
  file: File,
  driverClassName: string,
  remark?: string,
): Promise<JdbcDriverJar> {
  const form = new FormData();
  form.append("file", file);
  form.append("driverClassName", driverClassName);
  if (remark) form.append("remark", remark);
  return post<JdbcDriverJar>(`${hubBase}/jdbc-driver`, form);
}

/**
 * 删除 JDBC 驱动 jar（仍被数据源引用时后端会拒绝）。
 *
 * @param id 驱动 jar ID
 * @returns 是否删除成功
 */
export function deleteJdbcDriverJar(id: number): Promise<boolean> {
  return del<boolean>(`${hubBase}/jdbc-driver/${id}`);
}