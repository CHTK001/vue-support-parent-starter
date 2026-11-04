/**
 * Micrometer 指标批量取数
 *
 * <p>{@code /actuator/metrics} 只返回<b>指标名列表</b>，每个指标的数值要再取一次
 * {@code /actuator/metrics/{name}}。所以「一屏 KPI」天然是一次批量请求，
 * 这里把「并行取 → 逐个失败不算整体失败 → 拼成行」收在一处。</p>
 *
 * <p>设计取舍：单个指标 404（某些指标只在特定条件下注册，比如没有 HTTP 流量时
 * {@code http.server.requests} 可能不存在）<b>不该</b>让整个卡片变成「加载失败」——
 * 用 {@code Promise.allSettled} 跳过错失的那些，只展示真实取到的。</p>
 */
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import { getActuatorEndpoint } from "../../../api/systemApi";
import { isUnavailableError, unavailableHint, type ResourceState } from "./useCardResource";

/** 单行指标 */
export interface MetricRow {
  /** 指标名（唯一键） */
  key: string;
  /** 展示名（取不到时用指标名末段） */
  label: string;
  /** 主统计量的数值 */
  value: number | undefined;
  /** 已格式化的展示文本 */
  text: string;
  /** 主统计量名（COUNT / VALUE / MAX…） */
  statistic: string;
  /** 该指标的次级统计量（如 timers 的 TOTAL_TIME / MAX） */
  extra: Record<string, number>;
}

/** 指标明细响应（只取用到的字段） */
interface MetricDetail {
  name?: string;
  description?: string;
  baseUnit?: string;
  measurements?: { statistic?: string; value?: number }[];
}

/** 字节数格式化 */
export function humanBytes(v: number | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = v;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
}

/** 百分数格式化 */
function humanPercent(v: number | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

/** 秒 → 可读耗时（运行时长这种会到「天」，GC 暂停只有毫秒级） */
function humanSeconds(v: number | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v >= 86400) return `${(v / 86400).toFixed(1)} 天`;
  if (v >= 3600) return `${(v / 3600).toFixed(1)} h`;
  if (v >= 60) return `${(v / 60).toFixed(1)} min`;
  if (v >= 1) return `${v.toFixed(2)} s`;
  return `${(v * 1000).toFixed(1)} ms`;
}

/** 按 baseUnit 选格式化器 */
function formatValue(value: number | undefined, unit: string | undefined): string {
  if (value == null) return "—";
  switch (unit) {
    case "bytes":
      return humanBytes(value);
    case "seconds":
      return humanSeconds(value);
    case "percent":
      return humanPercent(value);
    default:
      if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
      if (Math.abs(value) >= 1e4) return `${(value / 1e3).toFixed(1)}k`;
      if (Number.isInteger(value)) return String(value);
      if (Math.abs(value) < 1) return value.toFixed(4);
      return value.toFixed(2);
  }
}

/** 指标名末段作为兜底展示名（jvm.memory.used → used） */
function labelOf(name: string, detail?: MetricDetail): string {
  const desc = detail?.description;
  if (desc && desc.length <= 24) return desc;
  const seg = name.split(".").pop() ?? name;
  return seg;
}

/** 指标行 hook 返回值 */
export interface MetricRowsResult {
  state: Ref<ResourceState>;
  rows: Ref<MetricRow[]>;
  error: Ref<string>;
  updatedAt: Ref<number>;
  reload: (silent?: boolean) => Promise<void>;
}

/**
 * 批量取指标。
 *
 * @param getNames      指标名清单（如 {@code ["jvm.memory.used", ...]}）
 * @param getIntervalMs 轮询间隔（毫秒），0 = 不轮询
 */
export function useMetricRows(getNames: () => string[], getIntervalMs: () => number): MetricRowsResult {
  const state = ref<ResourceState>("loading");
  const rows = ref<MetricRow[]>([]);
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

  async function reload(silent = false): Promise<void> {
    const tag = ++ticker;
    const names = getNames().filter((n) => typeof n === "string" && n.trim());
    if (!names.length) {
      state.value = "unavailable";
      error.value = "未选择要展示的指标";
      rows.value = [];
      return;
    }
    if (!silent) {
      state.value = "loading";
      error.value = "";
    }

    const results = await Promise.allSettled(
      names.map(async (name) => {
        const raw = (await getActuatorEndpoint(`metrics/${name}`)) as MetricDetail | null;
        return { name, detail: raw };
      }),
    );
    if (tag !== ticker) return;

    const next: MetricRow[] = [];
    let firstError: unknown = null;
    for (const r of results) {
      if (r.status === "rejected") {
        firstError ??= r.reason;
        continue;
      }
      const detail = r.value.detail;
      const measurements = (detail?.measurements ?? []).filter(
        (m): m is { statistic: string; value: number } => typeof m?.value === "number" && typeof m?.statistic === "string",
      );
      if (!measurements.length) continue;
      // 主统计量：优先 VALUE（gauge），其次 COUNT（timer / counter），最后首个
      const primary =
        measurements.find((m) => m.statistic === "VALUE") ??
        measurements.find((m) => m.statistic === "COUNT") ??
        measurements[0];
      const extra: Record<string, number> = {};
      for (const m of measurements) if (m.statistic !== primary.statistic) extra[m.statistic] = m.value;
      next.push({
        key: r.value.name,
        label: labelOf(r.value.name, detail ?? undefined),
        value: primary.value,
        // COUNT 是「次数」，不该按 baseUnit（如 seconds）格式化 —— 否则
        // jvm.gc.pause 的 128 次暂停会被显示成「128 s」
        text: formatValue(primary.value, primary.statistic === "COUNT" ? undefined : detail?.baseUnit),
        statistic: primary.statistic,
        extra,
      });
    }

    if (next.length) {
      rows.value = next;
      state.value = "ready";
      error.value = "";
      updatedAt.value = Date.now();
      return;
    }

    rows.value = [];
    const unavailable = firstError ? isUnavailableError(firstError) : true;
    state.value = unavailable ? "unavailable" : "error";
    error.value = unavailable
      ? unavailableHint("metrics")
      : ((firstError as Error)?.message ?? "指标全部获取失败");
  }

  const restartTimer = () => {
    stopTimer();
    const ms = Math.max(0, Math.round(getIntervalMs() || 0));
    if (ms <= 0) return;
    timer = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void reload(true);
    }, ms);
  };

  onMounted(() => {
    void reload();
    restartTimer();
  });
  onBeforeUnmount(stopTimer);
  watch(() => getNames().join(","), () => void reload());
  watch(() => Math.round(getIntervalMs() || 0), restartTimer);

  return { state, rows, error, updatedAt, reload };
}
