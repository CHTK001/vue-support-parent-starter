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

