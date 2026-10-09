/**
 * Prometheus 控制台 接口封装
 *
 * <p>对接 {@code spring-support-datasource-hub-starter} 的 {@code PrometheusManageController}。
 * 两条线：查询走 Prometheus HTTP API（后端代理），配置/看板走本模块接口。</p>
 *
 * <p>嵌入场景（{@code /dashboard/embed/**}）用原生 fetch 直连：嵌入页可能没有登录态，
 * 不能走 {@code http()}（它会给请求挂令牌/统一错误提示）。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { http, unwrapResult } from "@repo/utils";
import { fetchDataSources, type DataSourceInfo } from "@pages/datasource";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/** 接口根路径 */
const B = "/ms/monitor/prometheus";

export type { DataSourceInfo };
export { fetchDataSources };

/** 列出 type 为 prometheus 的数据源 */
export const fetchPrometheusSources = async (): Promise<DataSourceInfo[]> => {
  const all = await fetchDataSources();
  return (all || []).filter(d => d.type === "prometheus");
};

// ==================== 查询 ====================

/** 一条时间序列 */
export interface PromSeries {
  metric: Record<string, string>;
  /** 即时查询的结果：[unix 秒, 字符串值] */
  value?: [number, string];
  /** 范围查询的结果：[[unix 秒, 字符串值], ...] */
  values?: Array<[number, string]>;
}

/** Prometheus 查询响应（/api/v1/query 与 query_range 同构） */
export interface PromQueryResponse {
  status: string;
  data?: {
    resultType: "vector" | "matrix" | "scalar" | "string";
    result: PromSeries[];
  };
  errorType?: string;
  error?: string;
}

/**
 * 读取总览。
 *
 * @param datasourceId 数据源 ID，可空
 */
export const fetchPrometheusOverview = (datasourceId?: number | null) =>
  http().get(`${B}/overview`).query({ datasourceId }).noToast(true).then(r => unwrap<PromOverview>(r));

/** 总览数据 */
export interface PromOverview {
  datasourceId: number;
  datasourceName: string;
  prometheusUrl: string;
  configRoot: string;
  configPath: string;
  backupDir: string;
  reachable: boolean;
  version?: string;
  revision?: string;
  error?: string;
  targetTotal: number;
  targetUp: number;
  targetDown: number;
  targetUnknown: number;
  activeAlerts: number;
  ruleGroups: number;
  ruleCount: number;
  jobs: PromOverviewJob[];
  configExists?: boolean | null;
  configCheckError?: string;
}

/** 按 job 汇总的目标健康分布 */
export interface PromOverviewJob {
  job: string;
  up: number;
  down: number;
  unknown: number;
}

/** 抓取目标 */
export interface PromTarget {
  discoveredLabels?: Record<string, string>;
  labels: Record<string, string>;
  scrapePool?: string;
  scrapeUrl?: string;
  globalUrl?: string;
  lastError?: string;
  lastScrape?: string;
  lastScrapeDuration?: number;
  health: string;
}

/** 目标数据（/api/v1/targets 的 data 节点） */
export interface PromTargetsData {
  activeTargets: PromTarget[];
  droppedTargets: Array<{ discoveredLabels?: Record<string, string>; labels: Record<string, string> }>;
}

/** 规则 */
export interface PromRule {
  name: string;
  query: string;
  type: string;
  state?: string;
  health?: string;
  duration?: number;
  evaluationTime?: number;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  alerts?: Array<{ labels?: Record<string, string>; state?: string }>;
}

/** 规则组 */
export interface PromRuleGroup {
  name: string;
  file: string;
  interval?: number;
  rules: PromRule[];
}

/** 告警 */
export interface PromAlert {
  labels: Record<string, string>;
  annotations: Record<string, string>;
  state: string;
  activeAt?: string;
  value?: string;
}

/**
 * 即时查询。
 *
 * @param datasourceId 数据源 ID，可空
 * @param query        PromQL
 * @param time         求值时刻，可空
 */
export const prometheusQuery = (datasourceId: number | null | undefined, query: string, time?: string) =>
  http()
    .get(`${B}/query`)
    .query({ datasourceId, query, time })
    .noToast(true)
    .then(r => unwrap<PromQueryResponse>(r));

/**
 * 范围查询。
 *
 * @param datasourceId 数据源 ID，可空
 * @param query        PromQL
 * @param start        起始（RFC3339 或 Unix 秒）
 * @param end          结束
 * @param step         步长（如 30s / 1m）
 */
export const prometheusQueryRange = (
  datasourceId: number | null | undefined,
  query: string,
  start: string | number,
  end: string | number,
  step: string
) =>
  http()
    .get(`${B}/query_range`)
    .query({ datasourceId, query, start, end, step })
    .noToast(true)
    .timeout(30_000)
    .then(r => unwrap<PromQueryResponse>(r));

/** 抓取目标 */
export const fetchPrometheusTargets = (datasourceId?: number | null) =>
  http().get(`${B}/targets`).query({ datasourceId }).noToast(true).then(r => unwrap<PromTargetsData>(r));

/** 规则列表（data 节点：groups） */
export const fetchPrometheusRules = (datasourceId?: number | null) =>
  http()
    .get(`${B}/rules`)
    .query({ datasourceId })
    .noToast(true)
    .then(r => unwrap<{ groups: PromRuleGroup[] }>(r));

/** 活跃告警（data 节点：alerts） */
export const fetchPrometheusAlerts = (datasourceId?: number | null) =>
  http()
    .get(`${B}/alerts`)
    .query({ datasourceId })
    .noToast(true)
    .then(r => unwrap<{ alerts: PromAlert[] }>(r));

// ==================== 配置管理 ====================

/** 配置文件内容 */
export interface PromConfig {
  path: string;
  content: string;
  exists: boolean;
}

/** 配置文件 / 备份条目 */
export interface PromFile {
  path: string;
  size: number | null;
  mtime: string;
  main: boolean;
}

/** 保存/恢复的执行结果 */
export interface PromApplyResult {
  success: boolean;
  message: string;
  backupPath: string | null;
  validated: boolean | null;
  reloaded: boolean;
  output: string;
  steps: string[];
}

/** 命令执行结果 */
export interface PromCommandResult {
  success: boolean;
  message: string;
  output: string;
}

/** 读取配置文件 */
export const fetchPrometheusConfig = (datasourceId?: number | null, path?: string) =>
  http().get(`${B}/config`).query({ datasourceId, path }).noToast(true).then(r => unwrap<PromConfig>(r));

/** 列出配置文件 */
export const fetchPrometheusConfigFiles = (datasourceId?: number | null) =>
  http().get(`${B}/config/files`).query({ datasourceId }).noToast(true).then(r => unwrap<PromFile[]>(r));

/** 保存配置请求 */
export type PromSaveConfigRequest = {
  datasourceId?: number | null;
  path?: string;
  content: string;
  backup?: boolean;
  validate?: boolean;
  reload?: boolean;
};

/** 保存配置文件（校验 → 备份 → 覆盖 → 重载） */
export const savePrometheusConfig = (payload: PromSaveConfigRequest) =>
  http().put(`${B}/config`).data(payload).noToast(true).timeout(60_000).then(r => unwrap<PromApplyResult>(r));

/** 触发重载 */
export const reloadPrometheusConfig = (datasourceId?: number | null) =>
  http()
    .post(`${B}/config/reload`)
    .query({ datasourceId })
    .noToast(true)
    .timeout(30_000)
    .then(r => unwrap<PromCommandResult>(r));

/** 列出备份 */
export const fetchPrometheusBackups = (datasourceId?: number | null) =>
  http().get(`${B}/config/backups`).query({ datasourceId }).noToast(true).then(r => unwrap<PromFile[]>(r));

/** 从备份恢复 */
export const restorePrometheusBackup = (datasourceId: number | null | undefined, path: string) =>
  http()
    .post(`${B}/config/restore`)
    .query({ datasourceId, path })
    .noToast(true)
    .timeout(60_000)
    .then(r => unwrap<PromApplyResult>(r));

// ==================== 自定义看板 ====================

/** 看板 */
export interface PromDashboard {
  datasourceId: number;
  name: string;
  /** 布局配置（JSON 文本） */
  config: string;
  embedToken: string;
  updateTime: string | null;
}

/** 读取看板 */
export const fetchPrometheusDashboard = (datasourceId?: number | null) =>
  http().get(`${B}/dashboard`).query({ datasourceId }).noToast(true).then(r => unwrap<PromDashboard>(r));

/** 保存看板（实时保存链路后端入口） */
export const savePrometheusDashboard = (payload: {
  datasourceId?: number | null;
  name?: string;
  config: string;
}) => http().put(`${B}/dashboard`).data(payload).noToast(true).then(r => unwrap<PromDashboard>(r));

/** 重新生成嵌入令牌 */
export const regeneratePrometheusToken = (datasourceId?: number | null) =>
  http().post(`${B}/dashboard/token`).query({ datasourceId }).noToast(true).then(r => unwrap<PromDashboard>(r));

// ==================== 嵌入（公开只读，原生 fetch） ====================

/** 嵌入返回解包：后端 ReturnResult 信封 */
const unwrapEmbed = <T>(body: any): T => {
  if (body && (body.code === "00000" || body.code === 200 || body.success === true)) {
    return body.data as T;
  }
  throw new Error(body?.msg || body?.message || "嵌入请求失败");
};

const embedGet = async <T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> => {
  let url = `${B}${path}`;
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
  return unwrapEmbed<T>(body);
};

/** 按令牌读取嵌入看板 */
export const fetchEmbedDashboard = (token: string) =>
  embedGet<PromDashboard>(`/dashboard/embed/${encodeURIComponent(token)}`);

/** 嵌入即时查询 */
export const embedQuery = (token: string, query: string, time?: string) =>
  embedGet<PromQueryResponse>(`/dashboard/embed/${encodeURIComponent(token)}/query`, { query, time });

/** 嵌入范围查询 */
export const embedQueryRange = (
  token: string,
  query: string,
  start: string | number,
  end: string | number,
  step: string
) =>
  embedGet<PromQueryResponse>(`/dashboard/embed/${encodeURIComponent(token)}/query_range`, {
    query,
    start,
    end,
    step,
  });

// ==================== 卡片数据上下文 ====================

/**
 * 卡片取数上下文。
 *
 * <p>同一批卡片组件在两种宿主里复用：控制台（登录态、datasourceId）与嵌入页
 * （免登录、token）。把「怎么取数」抽成上下文注入，卡片本身不关心自己在哪。</p>
 */
export interface PromDataContext {
  /** 是否嵌入模式（影响提示文案等） */
  embed: boolean;
  /** 数据源 ID（控制台模式），嵌入模式为 null */
  datasourceId?: number | null;
  /** 即时查询 */
  query: (promql: string, time?: string) => Promise<PromQueryResponse>;
  /** 范围查询（epoch 秒 + 步长文本） */
  queryRange: (promql: string, startSec: number, endSec: number, step: string) => Promise<PromQueryResponse>;
}

/** 构造控制台取数上下文 */
export const createConsoleContext = (getDatasourceId: () => number | null | undefined): PromDataContext => ({
  embed: false,
  get datasourceId() {
    return getDatasourceId() ?? null;
  },
  query: (promql, time) => prometheusQuery(getDatasourceId(), promql, time),
  queryRange: (promql, startSec, endSec, step) =>
    prometheusQueryRange(getDatasourceId(), promql, startSec, endSec, step),
});

/** 构造嵌入取数上下文 */
export const createEmbedContext = (token: string): PromDataContext => ({
  embed: true,
  datasourceId: null,
  query: (promql, time) => embedQuery(token, promql, time),
  queryRange: (promql, startSec, endSec, step) => embedQueryRange(token, promql, startSec, endSec, step),
});
