/**
 * Nginx 控制台 接口封装
 *
 * <p>对接 {@code spring-support-monitor-starter} 的 {@code NginxManageController}。
 * 数据源从 {@code @pages/datasource} 取，与「数据源中心」页面共用同一份实现，
 * 避免同一后端接口在同一个应用里出现两份封装。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { http, unwrapResult } from "@repo/utils";
import { fetchDataSources, type DataSourceInfo } from "@pages/datasource";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/** 接口根路径 */
const B = "/ms/monitor/nginx";

export type { DataSourceInfo };
export { fetchDataSources };

/** 列出 type 为 nginx 的数据源 */
export const fetchNginxSources = async (): Promise<DataSourceInfo[]> => {
  const all = await fetchDataSources();
  return (all || []).filter(d => d.type === "nginx");
};

// ==================== 类型 ====================

/** nginx 配置文件条目 */
export interface NginxConfigFile {
  path: string;
  size: number | null;
  mtime: string | null;
}

/** nginx 命令执行结果 */
export interface NginxCommandResult {
  success: boolean;
  message: string;
  stdout: string;
  stderr: string;
}

/** stub_status 实时状态 */
export interface NginxStatus {
  available: boolean;
  source: string | null;
  activeConnections: number | null;
  accepts: number | null;
  handled: number | null;
  requests: number | null;
  reading: number | null;
  writing: number | null;
  waiting: number | null;
  raw: string | null;
  /** 成功时是数据来源，失败时是具体原因 */
  message: string;
}

/** nginx 版本信息 */
export interface NginxVersion {
  version: string | null;
  configureArguments: string | null;
  raw: string;
}

/** 趋势曲线单点 */
export interface NginxTrendPoint {
  /** 采样时刻 */
  time: string;
  /** 指标名：active / accepts / handled / requests / reading / writing / waiting */
  name: string;
  /** 原始值（accepts/handled/requests 是「worker 启动以来」的累计计数） */
  value: number | null;
  /** 每秒增量；瞬时类等于 value，累计类为差值/秒，worker 重启处为 null（断点） */
  rate: number | null;
}

/** 指标趋势 */
export interface NginxTrend {
  datasourceId: number | null;
  from: string;
  to: string;
  /** 实际使用的采样间隔（分钟），点数超上限时后端会自动放大 */
  interval: number;
  points: NginxTrendPoint[];
  /** 无数据时说明原因；正常有数据时为 null */
  message: string | null;
}

/**
 * 查询指标趋势。
 *
 * <p>数据来自后台定时采集（默认 30s 一次），保留窗口由后端
 * `monitor.data.retention.days` 控制（默认 1，即滚动 24 小时）。</p>
 *
 * @param datasourceId 数据源 ID
 * @param hours       回溯小时数，缺省 24
 * @param interval    采样间隔（分钟），缺省 30
 * @return 趋势数据
 */
export const fetchNginxTrend = (datasourceId?: number, hours?: number, interval?: number) =>
  http()
    .get(`${B}/metric/trend`)
    .query({ datasourceId, hours, interval })
    .noToast(true)
    .then(r => unwrap<NginxTrend>(r));

/**
 * 实时运行态（后端每轮采集经 SSE 推送）。
 *
 * <p>字段口径与 `NginxOverview` 一致，但只含趋势与状态胶囊要用的字段——
 * 总览要遍历配置目录、读日志清单、跑 `nginx -t`，不适合 30s 推一次。</p>
 */
export interface NginxRuntime {
  datasourceId: number | null;
  /** RUNNING / STOPPED / UNKNOWN */
  running: string | null;
  masterPid: number | null;
  uptimeText: string | null;
  /** 取不到为 null（不是 0）：把「没读到」误报成「已停止」比显示「—」危险得多 */
  activeConnections: number | null;
  statusAvailable: boolean;
  collectedAt: string;
  message: string | null;
}

/** `metric` 事件的载荷：每个指标的最后一个点 */
export interface NginxMetricPush {
  datasourceId: number | null;
  points: NginxTrendPoint[];
}

/**
 * SSE 订阅地址。
 *
 * <p>刻意返回**相对路径**而不是拼绝对地址：SSE 客户端会把 `baseUrl` 拼到前面，
 * 写死绝对地址会让 dev 代理与生产部署各写一份、极易指错后端。</p>
 *
 * @param datasourceId 数据源 ID
 * @returns 相对路径
 */
export const nginxMetricStreamUrl = (datasourceId?: number): string =>
  datasourceId ? `${B}/metric/stream?datasourceId=${datasourceId}` : `${B}/metric/stream`;

/** Top 条目 */
export interface NginxTopItem {
  /** 路径 或 IP */
  key: string;
  /** 出现次数 */
  hits: number;
}

/** 状态码类别条目 */
export interface NginxTopStatus {
  /** 2xx 成功 / 3xx 重定向 / 4xx 客户端错误 / 5xx 服务端错误 */
  category: string;
  hits: number;
  /** 占已解析行数的百分比 */
  pct: number;
}

/** 访问日志 Top 统计 */
export interface NginxAccessTop {
  /** 成功解析的行数 */
  total: number;
  /** 实际扫描的行数 */
  scanned: number;
  paths: NginxTopItem[];
  ips: NginxTopItem[];
  statuses: NginxTopStatus[];
  /** 统计口径说明 */
  message: string | null;
  /**
   * 本次扫描的出站字节总量（`$body_bytes_sent` 求和）
   *
   * <p>`null` 表示**无法统计**（access log 被自定义过 log_format、没有这一列），
   * 不是「零流量」。界面必须区分这两种情况，原因见 {@link message}。</p>
   */
  bytesSent: number | null;
  /** 独立客户端 IP 总数（`ips` 只含 Top N，不能拿它当总数） */
  uniqueIps: number;
  /** 4xx 请求数 */
  clientErrors: number;
  /** 5xx 请求数 */
  serverErrors: number;
}

/** 按 URL 维度的访问趋势 */
export interface NginxUrlTrend {
  logName: string;
  totalLines: number;
  scannedLines: number;
  /**
   * 实际覆盖起点（epoch 秒）。
   *
   * <p>画图和标注都以这个为准，<strong>不要用 `fromTime`</strong>：
   * `fromTime` 是服务器本地时间文本，不带时区，浏览器会按**自己所在的时区**去解析它，
   * 前后端时区不一致时整条曲线会整体平移几个甚至几十个小时。
   * epoch 秒是无歧义的绝对时刻。</p>
   */
  fromEpoch: number;
  /** 实际覆盖终点（epoch 秒）；0 表示日志无法解析出时间 */
  toEpoch: number;
  /** 实际覆盖起点（服务器本地时间文本，仅供人读与排障） */
  fromTime: string | null;
  /** 实际覆盖终点（服务器本地时间文本） */
  toTime: string | null;
  /** 时间桶宽度（秒），由后端按实际跨度自适应挑选 */
  bucketSeconds: number;
  /** 口径说明（必须展示给用户，避免把「最近 N 行」误读成固定时间窗） */
  message: string;
  series: NginxUrlTrendSeries[];
}

/** 单个 URL 的时间序列 */
export interface NginxUrlTrendSeries {
  path: string;
  /** 覆盖区间内的总命中数 */
  hits: number;
  /** 各时间桶计数，长度与桶数一致 */
  buckets: number[];
}

/**
 * 读取按 URL 的访问趋势。
 *
 * <p>与 24 小时趋势是两条独立链路：这个直接扫 access log 尾部，
 * <strong>时间跨度由日志密度决定</strong>（高流量时可能只有几分钟），
 * 所以界面上必须用 {@link NginxUrlTrend.message} 把实际覆盖区间标出来。</p>
 *
 * @param datasourceId 数据源 ID
 * @param lines        扫描尾部行数，缺省 5000
 * @param topN         取前几个 URL，缺省 5
 * @return URL 趋势
 */
export const fetchNginxUrlTrend = (datasourceId?: number, lines?: number, topN?: number) =>
  http()
    .get(`${B}/log/url-trend`)
    .query({ datasourceId, lines, topN })
    .timeout(60_000)
    .then(r => unwrap<NginxUrlTrend>(r));

/**
 * 读取访问日志 Top 统计。
 *
 * <p>后端 SSH 拉 access log 尾部后解析，<strong>不入库</strong>，所以每次都是实时扫描。</p>
 *
 * @param datasourceId 数据源 ID
 * @param lines        扫描尾部行数，缺省 2000
 * @param minutes      只统计最近 N 分钟，缺省 0（不限）
 * @param topN         每维度取前几，缺省 10
 * @return Top 统计
 */
export const fetchNginxAccessTop = (datasourceId?: number, lines?: number, minutes?: number, topN?: number) =>
  http()
    .get(`${B}/log/top`)
    .query({ datasourceId, lines, minutes, topN })
    .noToast(true)
    .then(r => unwrap<NginxAccessTop>(r));

/** 日志文件条目 */
export interface NginxLogFile {
  path: string;
  type: string;
  size: number | null;
  mtime: string | null;
}

/** 总览 */
export interface NginxOverview {
  running: string;
  masterPid: number | null;
  uptimeText: string | null;
  configRoot: string;
  configPath: string;
  version: NginxVersion;
  status: NginxStatus;
  configFileCount: number | null;
  configTotalSize: number | null;
  listenPorts: number[];
  logFiles: NginxLogFile[];
  issues: string[];
}

/** 指令元数据 */
export interface NginxDirectiveMeta {
  name: string;
  argType: string;
  enumValues: string[];
  multiple: boolean;
  required: boolean;
  desc: string;
  example: string;
  scopes: string[];
}

/** 配置语法树节点 */
export interface NginxConfigNode {
  id: string | null;
  parentId: string | null;
  name: string;
  headArg: string | null;
  label: string;
  block: boolean;
  value: string;
  scope: string;
  startLine: number | null;
  endLine: number | null;
  originalText: string;
  dirty: boolean;
  removed: boolean;
  /** 指令名是否有元数据登记；false 时 UI 退化为通用文本输入 */
  known: boolean;
  meta: NginxDirectiveMeta | null;
  warnings: string[];
  children: NginxConfigNode[];
}

/** 配置解析结果 */
export interface NginxConfigParse {
  path: string;
  content: string;
  root: NginxConfigNode;
  nodeCount: number;
  serverCount: number;
  locationCount: number;
  upstreamCount: number;
  unknownCount: number;
  warnings: string[];
}

/** 配置改动补丁 */
export type NginxPatch = {
  nodeId: string | null;
  op: "UPDATE" | "ADD" | "REMOVE";
  name?: string;
  headArg?: string;
  value?: string;
  index?: number;
};

/**
 * 保存配置请求
 *
 * <p>用 type 而非 interface：interface 没有隐式索引签名，无法赋值给
 * {@code RequestBody}（其联合里含 {@code Record<string, unknown>}）。</p>
 */
export type NginxApplyRequest = {
  datasourceId?: number;
  path: string;
  mode: "FILE" | "MODEL";
  content?: string;
  patches?: NginxPatch[];
  backup?: boolean;
  validate?: boolean;
  reload?: boolean;
  /** 只预览渲染结果，不落盘 */
  dryRun?: boolean;
};

/** 保存配置结果 */
export interface NginxApplyResult {
  saved: boolean;
  message: string;
  backupPath: string | null;
  validated: boolean;
  validateOk: boolean;
  validateText: string | null;
  reloaded: boolean;
  reloadOk: boolean;
  content: string;
  changedLineCount: number | null;
  warnings: string[];
  steps: string[];
}

/** 备份条目 */
export interface NginxBackup {
  name: string;
  path: string;
  size: number | null;
  mtime: string | null;
  sourceSize: number | null;
  reason: string | null;
}

/** 备份与当前配置的差异结果 */export interface NginxBackupDiff {
  backupName: string;
  targetPath: string;
  /** 新增行数：只存在于当前文件 */
  added: number;
  /** 删除行数：只存在于备份 */
  removed: number;
  /** unified-diff 风格行序列：`-` 删除、`+` 新增、两个空格前缀为未变 */
  lines: string[];
}

/** 站点（一个 server 块）聚合视图 */
export interface NginxSite {
  /** 该 server 块在其所属文件语法树中的路径标识，可直接用于定位编辑 */
  nodePath: string;
  file: string;
  serverNames: string[];
  displayName: string;
  listenPorts: number[];
  https: boolean;
  defaultServer: boolean;
  rootDir: string | null;
  indexFiles: string[];
  proxyTargets: string[];
  locationCount: number;
  upstreamRefs: string[];
  hasCertificate: boolean;
  warnings: string[];
}

/** 配置模板 */
export interface NginxTemplate {
  key: string;
  title: string;
  summary: string;
  scene: string;
  difficulty: string;
  content: string;
  tips: string[];
  requiredFields: string[];
}

// ==================== 接口 ====================

/**
 * 总览。
 *
 * <p>超时给到 60s：这个接口要走 SSH 上目标机、跑 {@code nginx -V} 定位 prefix、
 * 读配置目录、跑 {@code nginx -t} 语法检查，再拉 stub_status。
 * 实测常态就要 3.6~4.2s，赶上采集器（每 30s 一轮）并发时经常冲过 10s。</p>
 *
 * <p>原来没设 timeout，用的是全局默认 10s，于是本机验收里间歇性报
 * 「总览加载失败 AxiosError: timeout of 10000ms exceeded」——
 * 看着像接口挂了，其实是超时预算不够。相邻的重接口（test/reload/stop 等）
 * 都显式给了 60~120s，唯独这里漏了。</p>
 */
export const fetchNginxOverview = (datasourceId?: number) =>
  http().get(`${B}/overview`).query({ datasourceId }).timeout(60_000).noToast(true).then(r => unwrap<NginxOverview>(r));

/** 列出配置文件 */
export const fetchNginxConfigFiles = (datasourceId?: number) =>
  http().get(`${B}/config/files`).query({ datasourceId }).then(r => unwrap<NginxConfigFile[]>(r));

/** 读取配置文件内容 */
export const fetchNginxConfig = (datasourceId: number | undefined, path: string) =>
  http().get(`${B}/config`).query({ datasourceId, path }).then(r => unwrap<string>(r));

/** 解析配置为语法树 */
export const fetchNginxConfigTree = (datasourceId: number | undefined, path: string) =>
  http().get(`${B}/config/tree`).query({ datasourceId, path }).timeout(60_000).then(r => unwrap<NginxConfigParse>(r));

/** 应用配置改动（文件模式 / UI 模式） */
export const applyNginxConfig = (data: NginxApplyRequest) =>
  http().post(`${B}/config/apply`).data(data).timeout(120_000).then(r => unwrap<NginxApplyResult>(r));

/** 指令元数据 */
export const fetchNginxDirectives = (scope?: string) =>
  http()
    .get(`${B}/directives`)
    // 「全部」必须传空值而不是 "all"：后端 NginxManageServiceImpl#directives 只在
    // scope 为空时返回全量，非空则走 NginxDirectiveRegistry#byScope 做精确匹配，
    // 而没有任何 directive 的 scopes 含 "all"，传 "all" 会静默返回空数组
    // （表现为「新增指令」下拉没有任何候选）。
    .query(scope && scope !== "all" ? { scope } : {})
    .then(r => unwrap<NginxDirectiveMeta[]>(r));

/** 站点清单：把所有 .conf 里的 server 块抽平 */
export const fetchNginxSites = (datasourceId?: number) =>
  http()
    .get(`${B}/sites`)
    .query({ datasourceId })
    .timeout(120_000)
    .then(r => unwrap<NginxSite[]>(r));

/** 配置模板库 */
export const fetchNginxTemplates = () =>
  http().get(`${B}/templates`).then(r => unwrap<NginxTemplate[]>(r));

/** 语法检查 */
export const testNginx = (datasourceId?: number) =>
  http().post(`${B}/test`).query({ datasourceId }).timeout(60_000).then(r => unwrap<NginxCommandResult>(r));

/** 重载 */
export const reloadNginx = (datasourceId?: number) =>
  http().post(`${B}/reload`).query({ datasourceId }).timeout(60_000).then(r => unwrap<NginxCommandResult>(r));

/** 重启 */
export const restartNginx = (datasourceId?: number) =>
  http().post(`${B}/restart`).query({ datasourceId }).timeout(120_000).then(r => unwrap<NginxCommandResult>(r));

/** 停止 */
export const stopNginx = (datasourceId?: number) =>
  http().post(`${B}/stop`).query({ datasourceId }).timeout(60_000).then(r => unwrap<NginxCommandResult>(r));

/** 启动 */
export const startNginx = (datasourceId?: number) =>
  http().post(`${B}/start`).query({ datasourceId }).timeout(60_000).then(r => unwrap<NginxCommandResult>(r));

/** 版本信息 */
export const fetchNginxVersion = (datasourceId?: number) =>
  http().get(`${B}/version`).query({ datasourceId }).then(r => unwrap<NginxVersion>(r));

/** stub_status 实时状态 */
export const fetchNginxStatus = (datasourceId?: number) =>
  http().get(`${B}/status`).query({ datasourceId }).noToast(true).then(r => unwrap<NginxStatus>(r));

/** 列出日志文件 */
export const fetchNginxLogFiles = (datasourceId?: number) =>
  http().get(`${B}/log/files`).query({ datasourceId }).then(r => unwrap<NginxLogFile[]>(r));

/** 日志增量结果 */
export interface NginxLogChunk {
  content: string;
  cursor: number | null;
  size: number | null;
  rotated: boolean;
  path: string;
}

/** 取日志尾部 N 行 */
export const fetchNginxLog = (datasourceId: number | undefined, path: string, lines = 200) =>
  http().get(`${B}/log`).query({ datasourceId, path, lines }).noToast(true).then(r => unwrap<string>(r));

/** 增量读取日志：只返回游标之后的新内容 */
export const fetchNginxLogChunk = (
  datasourceId: number | undefined,
  path: string,
  lines = 200,
  cursor?: number | null
) =>
  http()
    .get(`${B}/log/chunk`)
    .query({ datasourceId, path, lines, cursor: cursor ?? undefined })
    .noToast(true)
    .then(r => unwrap<NginxLogChunk>(r));

/** 立即备份 */
export const backupNginxConfig = (datasourceId: number | undefined, path: string, reason?: string) =>
  http().post(`${B}/backup`).query({ datasourceId, path, reason }).timeout(60_000).then(r => unwrap<NginxBackup>(r));

/** 列出备份 */
export const fetchNginxBackups = (datasourceId?: number) =>
  http().get(`${B}/backup`).query({ datasourceId }).then(r => unwrap<NginxBackup[]>(r));

/** 从备份恢复；原始路径含下划线时反推不可逆，必须显式给出 targetPath */
export const restoreNginxBackup = (
  datasourceId: number | undefined,
  backupName: string,
  targetPath?: string
) =>
  http()
    .post(`${B}/backup/${encodeURIComponent(backupName)}/restore`)
    .query({ datasourceId, targetPath })
    .timeout(60_000)
    .then(r => unwrap<NginxCommandResult>(r));

/** 读取备份内容，供预览与下载使用 */
export const fetchNginxBackupContent = (datasourceId: number | undefined, name: string) =>
  http()
    .get(`${B}/backup/content`)
    .query({ datasourceId, name })
    .timeout(60_000)
    .then(r => unwrap<string>(r));

/** 备份与当前配置的差异 */
export const fetchNginxBackupDiff = (
  datasourceId: number | undefined,
  name: string,
  target: string
) =>
  http()
    .get(`${B}/backup/diff`)
    .query({ datasourceId, name, target })
    .timeout(60_000)
    .then(r => unwrap<NginxBackupDiff>(r));

// ==================== 自定义看板 ====================

/** 看板 */
export interface NginxDashboard {
  datasourceId: number;
  name: string;
  /** 布局配置（JSON 文本） */
  config: string;
  embedToken: string;
  updateTime: string | null;
}

/** 读取看板 */
export const fetchNginxDashboard = (datasourceId?: number | null) =>
  http().get(`${B}/dashboard`).query({ datasourceId }).noToast(true).then(r => unwrap<NginxDashboard>(r));

/** 保存看板（实时保存链路后端入口） */
export const saveNginxDashboard = (payload: {
  datasourceId?: number | null;
  name?: string;
  config: string;
}) => http().put(`${B}/dashboard`).data(payload).noToast(true).then(r => unwrap<NginxDashboard>(r));

/** 重新生成嵌入令牌 */
export const regenerateNginxToken = (datasourceId?: number | null) =>
  http().post(`${B}/dashboard/token`).query({ datasourceId }).noToast(true).then(r => unwrap<NginxDashboard>(r));

// ==================== 嵌入（公开只读，原生 fetch） ====================

/** 嵌入返回解包：后端 ReturnResult 信封 */
const unwrapNgxEmbed = <T>(body: any): T => {
  if (body && (body.code === "00000" || body.code === 200 || body.success === true)) {
    return body.data as T;
  }
  throw new Error(body?.msg || body?.message || "嵌入请求失败");
};

const ngxEmbedGet = async <T>(token: string, subPath: string, query?: Record<string, string | number | undefined>): Promise<T> => {
  let url = `${B}/dashboard/embed/${encodeURIComponent(token)}${subPath}`;
  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v) !== "") {
        qs.set(k, String(v));
      }
    });
    const text = qs.toString();
    if (text) {
      url += `?${text}`;
    }
  }
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const body = await res.json().catch(() => null);
  if (!res.ok && !body) {
    throw new Error(`嵌入请求失败（HTTP ${res.status}）`);
  }
  return unwrapNgxEmbed<T>(body);
};

/** 按令牌读取嵌入看板 */
export const fetchEmbedNginxDashboard = (token: string) =>
  ngxEmbedGet<NginxDashboard>(token, "");

/** 嵌入实时状态 */
export const embedNginxStatus = (token: string) =>
  ngxEmbedGet<NginxStatus>(token, "/status");

/** 嵌入指标趋势 */
export const embedNginxTrend = (token: string, hours?: number, interval?: number) =>
  ngxEmbedGet<NginxTrend>(token, "/metric/trend", { hours, interval });

/** 嵌入访问日志 Top 统计 */
export const embedNginxAccessTop = (token: string, lines?: number, minutes?: number, topN?: number) =>
  ngxEmbedGet<NginxAccessTop>(token, "/log/top", { lines, minutes, topN });

/** 嵌入 URL 访问趋势 */
export const embedNginxUrlTrend = (token: string, lines?: number, topN?: number) =>
  ngxEmbedGet<NginxUrlTrend>(token, "/log/url-trend", { lines, topN });

// ==================== 卡片数据上下文 ====================

/**
 * 卡片取数上下文。
 *
 * <p>同一批卡片组件在两种宿主里复用：控制台（登录态、datasourceId）与嵌入页
 * （免登录、token）。把「怎么取数」抽成上下文注入，卡片本身不关心自己在哪。</p>
 */
export interface NgxDataContext {
  /** 是否嵌入模式（影响提示文案等） */
  embed: boolean;
  /** 数据源 ID（控制台模式），嵌入模式为 null */
  datasourceId?: number | null;
  /** 读取 stub_status 实时状态 */
  status: () => Promise<NginxStatus>;
  /** 读取指标趋势 */
  trend: (hours?: number, interval?: number) => Promise<NginxTrend>;
  /** 读取访问日志 Top 统计 */
  accessTop: (lines?: number, minutes?: number, topN?: number) => Promise<NginxAccessTop>;
  /** 读取 URL 访问趋势 */
  urlTrend: (lines?: number, topN?: number) => Promise<NginxUrlTrend>;
}

/** 构造控制台取数上下文 */
export const createNgxConsoleContext = (getDatasourceId: () => number | null | undefined): NgxDataContext => ({
  embed: false,
  get datasourceId() {
    return getDatasourceId() ?? null;
  },
  status: () => fetchNginxStatus(getDatasourceId() ?? undefined),
  trend: (hours, interval) => fetchNginxTrend(getDatasourceId() ?? undefined, hours, interval),
  accessTop: (lines, minutes, topN) => fetchNginxAccessTop(getDatasourceId() ?? undefined, lines, minutes, topN),
  urlTrend: (lines, topN) => fetchNginxUrlTrend(getDatasourceId() ?? undefined, lines, topN),
});

/** 构造嵌入取数上下文 */
export const createNgxEmbedContext = (token: string): NgxDataContext => ({
  embed: true,
  datasourceId: null,
  status: () => embedNginxStatus(token),
  trend: (hours, interval) => embedNginxTrend(token, hours, interval),
  accessTop: (lines, minutes, topN) => embedNginxAccessTop(token, lines, minutes, topN),
  urlTrend: (lines, topN) => embedNginxUrlTrend(token, lines, topN),
});
