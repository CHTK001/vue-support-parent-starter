/**
 * 服务管理 API 封装
 *
 * 对应后端监控服务暴露的 REST 接口：
 *   1) GET    /ms/monitor/server                        — 节点列表（含运行状态）
 *   2) GET    /ms/monitor/server/{id}                   — 节点详情
 *   3) POST   /ms/monitor/server                        — 创建节点（enabled=1 立即拉起）
 *   4) PUT    /ms/monitor/server/{id}                   — 全量更新（停→替换→重启）
 *   5) POST   /ms/monitor/server/{id}/hot-update        — 热更新（过滤器链就地替换，不中断）
 *   6) DELETE /ms/monitor/server/{id}                   — 删除节点
 *   7) POST   /ms/monitor/server/{id}/start|stop        — 启停
 *   8) POST   /ms/monitor/server/{id}/filters/{i}/toggle— 热切换单个过滤器启停
 *   9) POST   /ms/monitor/server/{id}/filters/{i}/params— 热更新单个过滤器参数
 *  10) GET    /ms/monitor/server/protocols              — 协议下拉（内置 + Server SPI 动态发现）
 *  11) GET    /ms/monitor/server/filters                — ServerFilter 下拉（预设 + SPI + FQCN）
 *  12) GET    /ms/monitor/server/proxies                — 反向代理节点
 */
import { http, unwrapResult } from '@repo/utils';

const B = '/ms/monitor/server';

/** 协议元数据（/protocols 项） */
export interface ProtocolMeta {
  /** 协议编码 */
  code: string;
  /** 协议别名（小写，提交时用） */
  alias: string;
  /** 协议描述 */
  desc: string;
  /** 默认端口 */
  defaultPort: number | null;
  /** 默认引擎 */
  defaultEngine: string | null;
  /** 是否必须提供后端地址 */
  requiresBackend: boolean;
  /** 是否来自 Server SPI 动态发现 */
  spi: boolean;
  /** SPI 参数模板 */
  params?: FilterParamSchema[];
  /**
   * 该协议可选引擎（Server SPI 实际注册名）。
   *
   * HTTP 一个实现注册了多个引擎名（jdk/jdk-http、nio/nio-http、aio/aio-http/iocp），
   * 所以引擎候选必须由后端下发——前端不得再硬编码 jdk/nio/aio，否则新增实现时
   * 下拉里选不到。缺省时回落到 {@link defaultEngine}。
   */
  engines?: string[] | null;
}

/** 插件参数字段 schema */
export interface FilterParamSchema {
  /** 参数名 */
  name: string;
  /** 默认值 */
  defaultValue: string;
  /** 参数说明 */
  desc: string;
  /** 控件类型：boolean / string / number / enum */
  type: string;
  /** 枚举候选值（type=enum 时由后端下发） */
  options?: string[];
}

/** ServerFilter 插件元数据（/filters 项） */
export interface FilterTypeMeta {
  /** 插件类型：预设别名 file-storage / SPI 名称 / FQCN */
  type: string;
  /** 插件描述 */
  desc: string;
  /** 参数 schema */
  params?: FilterParamSchema[];
  /** 使用前提说明 */
  require?: string;
  /** 是否来自 SPI */
  spi?: boolean;
  /** 分组标识：storage / discovery / routing / generic ... */
  group?: string;
  /** 深度查看页路由（不同实现不同页面，仅 detailKind=route 时有值） */
  detailPage?: string;
  /**
   * 深度查看目标类型：
   *  - `node`  —— 深度页面由插件自身 HTTP 服务提供（如 FileStorageServerFilter 的 SYSTEM 布局
   *               在 `{serverUrl}{bucket}` 上返回 Vue 独立构建），应新窗口直开节点地址，任何宿主都可用；
   *  - `route` —— 深度页面由宿主应用托管，需校验路由存在后跳转。
   *  未提供表示该插件没有深度查看入口。
   */
  detailKind?: 'node' | 'route';
  /** 深度查看按钮文案 */
  detailLabel?: string;
}

/** 节点上的单个过滤器配置 */
export interface ServerFilterDescriptor {
  /** 过滤器唯一名（同一服务器内不重复） */
  name: string;
  /** 过滤器类型 */
  type?: string;
  /** 执行顺序，越小越先执行 */
  order?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 初始化参数 */
  params?: Record<string, string>;
}

/** 节点视图（定义 + 运行状态） */
export interface ServerNodeView {
  id: number;
  name: string;
  protocol: string;
  protocolDesc?: string;
  engine?: string;
  host?: string;
  port?: number;
  enabled?: number;
  remark?: string;
  config?: Record<string, any>;
  filters?: ServerFilterDescriptor[];
  status: 'RUNNING' | 'STOPPED' | 'ERROR';
  error?: string;
  serverUrl?: string;
}

/** 创建/更新请求体 */
export interface ServerNodeRequest {
  name: string;
  protocol: string;
  engine?: string;
  host?: string;
  port?: number | null;
  enabled?: number;
  remark?: string;
  config?: Record<string, any>;
  filters?: ServerFilterDescriptor[];
  /** 允许透传扩展字段（后端按需读取） */
  [key: string]: unknown;
}

/** 热更新结果 */
export interface ServerHotUpdateResult {
  node: ServerNodeView;
  /** 过滤器链是否已热生效（服务未中断） */
  hotApplied: boolean;
  /** 是否因监听参数变更触发自动重启 */
  restarted: boolean;
  /** 本次生效项说明 */
  appliedItems: string[];
  /** 结果提示文案 */
  message: string;
}

// ===== 节点 CRUD =====
export const listServerNodes = () =>
  http().get(B).then(r => unwrapResult<ServerNodeView[]>(r));

/** 分页查询条件（后端过滤 + 排序 + 切片） */
export interface ServerNodePageQuery {
  /** 关键字：名称 / 协议 / 监听 / 后端 / 报错 */
  keyword?: string;
  /** 协议编码精确匹配 */
  protocol?: string;
  /** 运行状态精确匹配 */
  status?: string;
  /** 排序口径：name / port / status */
  sort?: string;
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页条数，服务端封顶 500 */
  size?: number;
}

/** 分页结果（对齐 MyBatis-Plus Page 的字段） */
export interface ServerNodePage {
  /** 当前页数据 */
  records: ServerNodeView[];
  /** 命中条件的总条数 */
  total: number;
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  size: number;
}

/** 节点统计摘要（左栏计数与新建表单重名校验） */
export interface ServerNodeSummary {
  total: number;
  running: number;
  stopped: number;
  error: number;
  unknown: number;
  plugins: number;
  /** 全部节点名称 */
  names: string[];
}

/**
 * 分页查询节点。
 *
 * <p>过滤与排序都在后端完成（{@code status} 是运行时状态，库里没有这一列），
 * 前端只翻页，不在本页做切片。</p>
 *
 * @param q 查询条件
 */
export const pageServerNodes = (q: ServerNodePageQuery = {}) => {
  const params: Record<string, string | number> = {};
  if (q.keyword) params.keyword = q.keyword;
  if (q.protocol) params.protocol = q.protocol;
  if (q.status) params.status = q.status;
  if (q.sort) params.sort = q.sort;
  if (q.page) params.page = q.page;
  if (q.size) params.size = q.size;
  return http()
    .get(`${B}/page`)
    .query(params)
    .then(r => unwrapResult<ServerNodePage>(r));
};

/** 节点统计摘要（分页后左栏计数不再能从当前页算出） */
export const serverNodeSummary = () =>
  http().get(`${B}/summary`).then(r => unwrapResult<ServerNodeSummary>(r));

export const getServerNode = (id: number) =>
  http().get(`${B}/${id}`).then(r => unwrapResult<ServerNodeView>(r));

export const createServerNode = (d: ServerNodeRequest) =>
  http().post(B).data(d).then(r => unwrapResult<ServerNodeView>(r));

export const updateServerNode = (id: number, d: ServerNodeRequest) =>
  http().put(`${B}/${id}`).data(d).then(r => unwrapResult<ServerNodeView>(r));

/** 热更新：过滤器链就地替换，仅监听参数变更时才重启 */
export const hotUpdateServerNode = (id: number, d: ServerNodeRequest) =>
  http().post(`${B}/${id}/hot-update`).data(d).then(r => unwrapResult<ServerHotUpdateResult>(r));

export const deleteServerNode = (id: number) =>
  http().delete(`${B}/${id}`).then(r => unwrapResult<void>(r));

// ===== 启停 =====
export const startServerNode = (id: number) =>
  http().post(`${B}/${id}/start`).then(r => unwrapResult<ServerNodeView>(r));

export const stopServerNode = (id: number) =>
  http().post(`${B}/${id}/stop`).then(r => unwrapResult<ServerNodeView>(r));

/** 先停再启，用于 ERROR 节点排障 */
export const restartServerNode = async (id: number) => {
  await http().post(`${B}/${id}/stop`).then(r => unwrapResult<ServerNodeView>(r));
  return http().post(`${B}/${id}/start`).then(r => unwrapResult<ServerNodeView>(r));
};

// ===== 过滤器热操作 =====
export const toggleServerFilter = (id: number, index: number, enabled: boolean) =>
  http().post(`${B}/${id}/filters/${index}/toggle?enabled=${enabled}`).then(r => unwrapResult<ServerNodeView>(r));

export const updateServerFilterParams = (id: number, index: number, params: Record<string, string>) =>
  http().post(`${B}/${id}/filters/${index}/params`).data(params).then(r => unwrapResult<ServerNodeView>(r));

// ===== 元数据 =====
export const listProtocols = () =>
  http().get(`${B}/protocols`).then(r => unwrapResult<ProtocolMeta[]>(r));

export const listFilterTypes = () =>
  http().get(`${B}/filters`).then(r => unwrapResult<FilterTypeMeta[]>(r));

export const listProxyNodes = () =>
  http().get(`${B}/proxies`).then(r => unwrapResult<ServerNodeView[]>(r));

// ===== 发现服务（service-discovery 插件的专属接口，后端 /ms/monitor/discovery）=====
/** 服务发现实例 */
export interface DiscoveryInstance {
  id?: string;
  host: string;
  port: number;
  protocol: string;
  weight?: number;
  env?: string;
  uriSpec?: string;
  metadata?: Record<string, unknown>;
}

/** 发现服务查询结果 */
export interface DiscoveryQueryResult {
  instances: DiscoveryInstance[];
  message: string;
}

/** 按协议 / 服务标识查询服务实例 */
export const queryDiscoveryInstances = (protocol?: string, uriSpec?: string) => {
  const qs = new URLSearchParams();
  if (protocol) qs.set('protocol', protocol);
  if (uriSpec) qs.set('uriSpec', uriSpec);
  return http()
    .get(`/ms/monitor/discovery/services${qs.toString() ? `?${qs.toString()}` : ''}`)
    .then(r => unwrapResult<DiscoveryQueryResult>(r));
};

/** 已启用的发现协议列表 */
export const listDiscoveryProtocols = () =>
  http().get('/ms/monitor/discovery/protocols').then(r => unwrapResult<string[]>(r));

/** 发现服务状态（对齐后端 DiscoveryStatusVO） */
export interface DiscoveryStatus {
  /** 运行中节点上挂载的发现插件数量 */
  runningDiscoveryFilters: number;
  /** SPI 可用的发现协议名 */
  availableProtocols: string[];
  /** 容器内是否装配 DiscoveryService */
  discoveryServicePresent: boolean;
  /** 是否存在可用的发现能力 */
  enabled: boolean;
}

/** 发现服务状态 */
export const getDiscoveryStatus = () =>
  http().get('/ms/monitor/discovery/status').then(r => unwrapResult<DiscoveryStatus>(r));

// ===== 节点操作日志（GET /ms/monitor/server/oper-log/{id}）=====

/** 节点操作日志列表项（对齐后端 ServerOperLogVO） */
export interface ServerOperLog {
  id: number;
  nodeId: number;
  nodeName: string | null;
  /** 操作码，如 CREATE / UPDATE / HOT_UPDATE / START / STOP / DELETE */
  action: string;
  /** 操作中文名 */
  actionName: string | null;
  target: string | null;
  detail: string | null;
  /** 1 成功 / 0 失败 / null 未判定 */
  success: number | null;
  costMs: number | null;
  operator: string | null;
  clientIp: string | null;
  requestUrl: string | null;
  createTime: string | null;
}

/** 操作日志分页结果（对齐 MyBatis-Plus Page） */
export interface ServerOperLogPage {
  records: ServerOperLog[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/** 操作日志查询参数 */
export interface ServerOperLogQuery {
  /** 操作码过滤，空则全部 */
  action?: string | null;
  /** 起始时间（ISO 本地时间），空则不限 */
  from?: string | null;
  /** 截止时间（ISO 本地时间），空则不限 */
  to?: string | null;
  page?: number;
  size?: number;
}

/**
 * 按节点分页查操作日志。
 *
 * <p>读的是本模块自己落的 {@code ms_server_oper_log}，不是全仓通用的
 * {@code /v2/log/page}：后者在当前部署上没有对应的消费者与表。</p>
 *
 * @param id    节点 ID
 * @param query 过滤与分页参数
 * @returns 分页结果
 */
export const listServerOperLogs = (id: number, query: ServerOperLogQuery = {}) => {
  const params: Record<string, string | number> = {};
  if (query.action) params.action = query.action;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  if (query.page) params.page = query.page;
  if (query.size) params.size = query.size;
  return http()
    .get(`${B}/oper-log/${id}`)
    .query(params)
    .then(r => unwrapResult<ServerOperLogPage>(r));
};

