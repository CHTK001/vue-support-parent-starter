/**
 * Actuator 独立页面的业务 API（pages/actuator 自己的数据通道）
 *
 * <p>页面只做展示与交互，规则由后端契约决定；这里把「页面要用的接口」逐个收拢，
 * 与系统大屏里的同名能力保持同一口径（同样的 URL、同样的参数形态），但<b>不依赖
 * {@code @pages/system}**：独立页面对宿主的大屏能力是可选的，不能为了让一个页面
 * 就能反过来拖入系统包。</p>
 *
 * <p>两类接口：</p>
 * <ul>
 *   <li><b>Actuator 原生端点</b>（{@link getActuatorEndpoint} / {@link setActuatorLogger}）
 *       读 {@code /actuator/**}，Actuator 本身不走 {@code ApiResult} 包装，直接透传 body；</li>
 *   <li><b>调度与统计接口</b>（schedule tasks 三件套、RESTful 统计）—— 这些属于后端
 *       {@code /v2/**} 的公开契约，URL 与系统大屏一致，直接直读（auth 由 {@code http}
 *       的统一拦截器处理，与系统包同口径）。</li>
 * </ul>
 *
 * @since 4.0.0.51
 */
import { http, costMs } from "@repo/utils";
import { getActuatorEndpoint } from "./actuatorApi";

/** RESTful Top URL 统计（从 /v2/server/api/stats 取到的最小字段集） */
export interface RestfulUrlStat {
  key?: string;
  url?: string;
  method?: string;
  count?: number;
  avgMs?: number;
  ips?: { ip?: string; count?: number }[];
}

/** /v2/server/api/stats 的最小响应结构（只用到与请求映射表关联所需的字段） */
export interface RestfulApiStats {
  topUrls?: RestfulUrlStat[];
}

/** 可编辑定时任务（接口返回结构，与系统包同源） */
export interface ManagedScheduleTask {
  key?: string;
  label?: string;
  cron?: string;
  enabled?: boolean;
  nextTime?: string;
  lastTime?: string;
  lastStatus?: string;
}

/**
 * Actuator 端点（页面主数据通道，与 {@link getActuatorEndpoint} 同源）。
 *
 * <p>独立页面用（见 {@link getActuatorEndpoint}）；此别名显式导出，方便页面视图统一引用，
 * 避免「页面视图 import 了两处同名函数」的维护噪音。</p>
 */
export { getActuatorEndpoint };

/**
 * 修改指定 logger 的日志级别（actuator loggers 写接口，返回 204）。
 *
 * @param name   logger 名
 * @param level  目标级别（{@code INHERITED} 表示继承默认级别，body 里传 null）
 */
export async function setActuatorLogger(name: string, level: string): Promise<unknown> {
  return http()
    .post(`/actuator/loggers/${encodeURIComponent(name)}`)
    .data({ configuredLevel: level === "INHERITED" ? null : level })
    .loading(false)
    .noToast(true)
    .then((r) => r.data as unknown);
}

/** 获取可编辑定时任务列表（动态调度注册中心） */
export async function getScheduleTasks(): Promise<ManagedScheduleTask[]> {
  const res = await http()
    .get("/v2/schedule/tasks")
    .loading(false)
    .noToast(true);
  return (res.data as ManagedScheduleTask[]) ?? [];
}

/** 更新定时任务 cron / 启停 */
export async function updateScheduleTask(
  key: string,
  data: { cron?: string; enabled?: boolean },
): Promise<boolean> {
  const res = await http()
    .put(`/v2/schedule/tasks/${encodeURIComponent(key)}`)
    .data(data)
    .loading(false)
    .noToast(true);
  return res.data as boolean;
}

/** 立即执行一次定时任务 */
export async function runScheduleTask(key: string): Promise<boolean> {
  const res = await http()
    .post(`/v2/schedule/tasks/${encodeURIComponent(key)}/run`)
    .loading(false)
    .noToast(true);
  return res.data as boolean;
}

/**
 * 拉取 RESTful 请求统计（请求映射页签关联次数 / 耗时 / 访问 IP 用）。
 *
 * <p>URL 与系统大屏一致（{@code /v2/server/api/stats}），但此包不依赖系统包的函数，
 * 自己直读 —— 独立页面不应因「复用一个函数」而依赖系统域的 API 层。</p>
 */
export async function getRestfulApiStats(): Promise<RestfulApiStats> {
  const res = await http()
    .get("/v2/server/api/stats")
    .loading(false)
    .noToast(true);
  return res.data as RestfulApiStats;
}

/**
 * 从 Actuator 请求映射 predicate 解析方法 + 路径，匹配 RESTful 统计。
 *
 * <p>与系统大屏的 {@code matchRestfulStat} 同一套口径：先按
 * {@code METHOD [paths]} 精确匹配，再按「路径参数归一化（{param} → {id}）+ 方法兜底」
 * 匹配。 predicate 来自 {@code /actuator/mappings}，统计来自 {@code /v2/server/api/stats}。</p>
 *
 * <p><b>纯函数</b>：统计必须由调用方先 {@link getRestfulApiStats} 拉好再传进来
 * （{@code matchRestfulStat(predicate, stats)}）。页面一次性拉好 stats 后对多行映射复用，
 * 既避免每行发一次请求，也避免在同步函数里误把 Promise 当对象用。</p>
 *
 * @param predicate Actuator 映射的谓词（形如 {@code GET [/api/x, /api/y/{id}]}）
 * @param stats     已拉取的 {@code /v2/server/api/stats} 响应
 */
export function matchRestfulStat(
  predicate: string,
  stats: RestfulApiStats | undefined,
): {
  count?: number;
  avgMs?: number;
  ips?: { ip?: string; count?: number }[];
} | undefined {
  const method = (/(?:^|[{,\s])([A-Z]{3,7})\s*\[/.exec(predicate)?.[1] ?? "").toUpperCase();
  const paths = /\[([^\]]*)\]/.exec(predicate)?.[1]?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const index = buildUrlIndex(stats);
  for (const p of paths) {
    const found = index.get(`${method ?? ""} ${p}`);
    if (found) return toStat(found);
  }
  for (const p of paths) {
    const normalized = p.replace(/\{[^}]+\}/g, "{id}");
    for (const m of method ? [method] : ["GET", "POST", "PUT", "DELETE"]) {
      const found = index.get(`${m} ${normalized}`);
      if (found) return toStat(found);
    }
  }
  return undefined;
}

/** 从 Top URL 统计构造「方法 + 路径 → 统计」索引（键与系统大屏一致） */
function buildUrlIndex(stats: RestfulApiStats | undefined): Map<string, RestfulUrlStat> {
  const map = new Map<string, RestfulUrlStat>();
  for (const u of stats?.topUrls ?? []) {
    if (u.key) map.set(u.key, u);
    const m = (u.method || "GET").toUpperCase();
    if (u.url) map.set(`${m} ${u.url}`, u);
  }
  return map;
}

/** RestfulUrlStat → 页面表格要用的统计字段 */
function toStat(u: RestfulUrlStat): {
  count?: number;
  avgMs?: number;
  ips?: { ip?: string; count?: number }[];
} {
  return {
    count: u.count,
    avgMs: u.avgMs,
    ips: u.ips?.map((i) => ({ ip: i.ip, count: i.count })),
  };
}
