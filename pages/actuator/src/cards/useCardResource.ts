/**
 * 卡片数据源 composable
 *
 * <p>监控大屏上的卡片有两大类数据来源：</p>
 * <ol>
 *   <li><b>actuator</b> —— 走 {@code getActuatorEndpoint()}。该接口把 {@code /actuator/**}
 *       原始 JSON 透传给前端（不经 ApiResult 包装、带登录态、同源），是内置卡片的首选；</li>
 *   <li><b>url</b> —— 用户在「自定义卡片」里填的绝对地址，用 {@code fetch} 直连
 *       （对方需允许跨域，否则浏览器会挡在 CORS 预检上）。</li>
 * </ol>
 *
 * <p>状态机刻意区分 {@code unavailable} 与 {@code error}：</p>
 * <ul>
 *   <li>{@code unavailable} —— 端点没暴露（404 / 405 / 501）或没配数据源。这是
 *       <b>正常的部署形态</b>（很多环境只放 {@code health,info}），重试永远不会成功，
 *       所以给的是「怎么开启」的接入指引，而不是一个骗人的「重试」；</li>
 *   <li>{@code error} —— 网络炸了 / 500 / 解析失败。这是真故障，给「重试」。</li>
 * </ul>
 *
 * <p>轮询一律<b>页面隐藏时跳过</b>：监控大屏常被挂在副屏上长时间开着，
 * 切到后台标签还在每秒打后端日志端点，纯属给别人制造负载。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import { getActuatorEndpoint } from "../api/actuatorApi";

/** 资源状态 */
export type ResourceState = "loading" | "ready" | "unavailable" | "error";

/** 数据源描述 */
export interface DataSpec {
  /** 数据源类型，缺省按 actuator 处理 */
  kind?: "actuator" | "url";
  /** actuator 路径（如 {@code metrics/jvm.memory.used}）或绝对 URL */
  path?: string;
}

/** composable 返回 */
export interface CardResource {
  /** 当前状态 */
  state: Ref<ResourceState>;
  /** 最近一次成功拉到的数据 */
  data: Ref<unknown>;
  /** 错误文案（state 为 error / unavailable 时有效） */
  error: Ref<string>;
  /** 最近成功时间戳（ms） */
  updatedAt: Ref<number>;
  /** 手动重载（silent = 静默刷新，不闪 loading） */
  reload: (silent?: boolean) => Promise<void>;
  /** 按最新间隔重建定时器（间隔配置变化后调用） */
  restartTimer: () => void;
}

/** 从任意错误对象里挖出可读文案 */
function errorText(err: unknown): string {
  if (!err) return "未知错误";
  const e = err as {
    message?: string;
    status?: number;
    code?: string;
    response?: { status?: number; data?: unknown };
  };
  const status = e.response?.status ?? e.status;
  const data = e.response?.data;
  if (typeof data === "string" && data.trim()) return `${status ? `[${status}] ` : ""}${data.slice(0, 200)}`;
  if (data && typeof data === "object") {
    const msg = (data as { message?: string; error?: string }).message ?? (data as { error?: string }).error;
    if (msg) return `${status ? `[${status}] ` : ""}${msg}`;
  }
  if (e.message) return e.message;
  return String(err);
}

/**
 * 是否为「端点未暴露」类错误（404 / 405 / 501）。
 *
 * <p>拿不到 HTTP 状态时退回文案匹配 —— 不同 axios 版本、不同拦截器对错误的包装不一致，
 * 只认状态码会在某些链路上把 404 误判成真故障，于是卡片永远显示「加载失败 + 重试」。</p>
 */
export function isUnavailableError(err: unknown): boolean {
  const e = err as { status?: number; response?: { status?: number }; message?: string };
  const status = e?.response?.status ?? e?.status;
  if (status === 404 || status === 405 || status === 501) return true;
  const text = (e?.message ?? "").toString();
  return /(^|\D)(404|405|501)(\D|$)|not found|no static resource|未找到/i.test(text);
}

/** 是否为鉴权类错误 */
export function isAuthError(err: unknown): boolean {
  const e = err as { status?: number; response?: { status?: number }; message?: string };
  const status = e?.response?.status ?? e?.status;
  if (status === 401 || status === 403) return true;
  return /401|403|未授权|无权限|token/i.test(e?.message ?? "");
}

/**
 * 未接入时的接入指引。
 *
 * <p>文案按「缺什么补什么」写：Actuator 端点要 {@code management.endpoints.web.exposure.include}
 * 放出来；Prometheus 指标要再加 micrometer-registry-prometheus；OTLP 导出要配
 * {@code management.otlp.metrics.export.endpoint}。</p>
 */
export function unavailableHint(path: string): string {
  const p = path.toLowerCase();
  if (p.startsWith("prometheus")) {
    return "后端未暴露 Prometheus 指标。需引入 micrometer-registry-prometheus，并把 prometheus 加入 management.endpoints.web.exposure.include。";
  }
  if (p.includes("otel") || p.includes("otlp")) {
    return "后端未上报 OpenTelemetry 指标。需配置 management.otlp.metrics.export.endpoint 指向 Collector。";
  }
  return `后端 /actuator/${path} 未暴露。可在 application.yml 里把 ${path} 加入 management.endpoints.web.exposure.include。`;
}

/** 按点号路径取值，支持数组下标（如 {@code measurements.0.value}） */
export function pickByPath(source: unknown, path?: string): unknown {
  if (!path) return source;
  let cur: unknown = source;
  for (const seg of path.split(".").filter(Boolean)) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) {
      const idx = Number(seg);
      cur = Number.isInteger(idx) ? cur[idx] : undefined;
      continue;
    }
    if (typeof cur === "object") {
      cur = (cur as Record<string, unknown>)[seg];
      continue;
    }
    return undefined;
  }
  return cur;
}

/** 把任意 JSON 压平成 [{ key, value }]，用于键值列表展示 */
export function flattenKv(source: unknown, prefix = "", depth = 0): { key: string; value: string }[] {
  if (source == null) return [];
  if (typeof source !== "object") {
    return [{ key: prefix || "值", value: String(source) }];
  }
  const rows: { key: string; value: string }[] = [];
  const entries = Array.isArray(source)
    ? source.map((v, i) => [String(i), v] as const)
    : Object.entries(source as Record<string, unknown>);
  for (const [k, v] of entries) {
    const key = prefix ? `${prefix}.${k}` : k;
    // 展开两层足够：再深的结构用 JSON 视图更清楚，压平后反而读不懂
    if (v && typeof v === "object" && depth < 2) {
      rows.push(...flattenKv(v, key, depth + 1));
    } else {
      rows.push({ key, value: v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v) });
    }
  }
  return rows;
}

/** 把数组型 JSON 转成表格行（取每个元素的浅层字段作为列） */
export function toRows(source: unknown): { columns: string[]; rows: Record<string, string>[] } {
  const list = Array.isArray(source)
    ? source
    : Array.isArray((source as { content?: unknown })?.content)
      ? ((source as { content: unknown[] }).content ?? [])
      : [];
  const columns: string[] = [];
  const rows: Record<string, string>[] = [];
  for (const item of list) {
    const row: Record<string, string> = {};
    if (item && typeof item === "object") {
      for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
        if (!columns.includes(k)) columns.push(k);
        row[k] = v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);
      }
    } else {
      if (!columns.includes("值")) columns.push("值");
      row["值"] = String(item);
    }
    rows.push(row);
  }
  return { columns, rows };
}

/** 拉取数据（按 kind 分流） */
async function fetchSpec(spec: DataSpec): Promise<unknown> {
  const path = (spec.path ?? "").trim();
  if (!path) throw Object.assign(new Error("未配置数据源"), { status: 404 });
  if ((spec.kind ?? "actuator") === "url") {
    const res = await fetch(path, { credentials: "omit" });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
    const type = res.headers.get("content-type") ?? "";
    return type.includes("json") ? res.json() : res.text();
  }
  return getActuatorEndpoint(path);
}

/** 轮询间隔（秒）→ 毫秒；0 / 非法值 = 不轮询 */
function toMs(sec: number | undefined): number {
  const n = Number(sec ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.max(2000, Math.round(n * 1000)) : 0;
}

/**
 * 数据源 hook。
 *
 * @param getSpec    返回当前数据源（传 getter 以便卡片配置变化时自动重取）
 * @param getInterval 返回轮询间隔秒数（同样传 getter）
 * @returns 状态、数据与重载入口
 */
export function useCardResource(getSpec: () => DataSpec, getInterval: () => number | undefined = () => undefined): CardResource {
  const state = ref<ResourceState>("loading");
  const data = ref<unknown>(null);
  const error = ref("");
  const updatedAt = ref(0);
  let ticker = 0;
  let timer: number | undefined;

  const stopTimer = () => {
    if (timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };

  const restartTimer = () => {
    stopTimer();
    const ms = toMs(getInterval());
    if (ms <= 0) return;
    timer = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void reload(true);
    }, ms);
  };

  async function reload(silent = false): Promise<void> {
    const tag = ++ticker;
    if (!silent) {
      state.value = "loading";
      error.value = "";
    }
    try {
      const res = await fetchSpec(getSpec());
      if (tag !== ticker) return;
      data.value = res;
      updatedAt.value = Date.now();
      state.value = "ready";
      error.value = "";
    } catch (err) {
      if (tag !== ticker) return;
      const unavailable = isUnavailableError(err);
      error.value = unavailable ? unavailableHint((getSpec().path ?? "").trim()) : errorText(err);
      state.value = unavailable ? "unavailable" : "error";
      if (isAuthError(err)) {
        error.value = `鉴权失败：${errorText(err)}`;
        state.value = "error";
      }
    }
  }

  /** 配置变化（数据源或间隔）时重新拉取并重建定时器 */
  const specKey = computed(() => `${getSpec().kind ?? "actuator"}::${getSpec().path ?? ""}`);
  const intervalKey = computed(() => `${toMs(getInterval())}`);
  watch([specKey, intervalKey], () => {
    void reload();
    restartTimer();
  });

  onMounted(() => {
    void reload();
    restartTimer();
  });
  onBeforeUnmount(stopTimer);

  return { state, data, error, updatedAt, reload, restartTimer };
}

/** 便捷封装：固定 actuator 路径（内置卡片最常用） */
export function useActuatorResource(
  getPath: () => string,
  getInterval: () => number | undefined = () => undefined,
): CardResource {
  return useCardResource(() => ({ kind: "actuator", path: getPath() }), getInterval);
}

/** 毫秒时间戳 → HH:mm:ss */
export function formatClock(ts: number): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString("zh-CN", { hour12: false });
}
