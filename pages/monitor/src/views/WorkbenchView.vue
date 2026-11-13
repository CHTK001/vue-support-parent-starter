<script setup lang="ts">
/**
 * 监控概览（工作台）—— 运行态驾驶舱
 *
 * <p>这一版不再只是“4 个数字 + 一个空态”：先回答“系统现在能不能用、哪块能力降级”，
 * 再回答“资产/告警怎么样”，最后给出可执行动作。页面上的每个状态都来自真实接口或
 * socket 连接态，不再无条件写“实时更新”。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { getConfig, getGlobalSocketConfig, useSocketService } from "@repo/core";
import { http, unwrapResult } from "@repo/utils";
import ReTable from "@repo/ui/re-table";
import { ElMessage } from "element-plus";
import { queryHosts, testConnectHost } from "@pages/server/src/api";
import { fetchAlarmEvents, alarmLevel, isUnhandled, type AlarmEvent } from "../api/monitorApi";
import { getTsharkStatus, type TsharkRuntimeStatus } from "../api";

const router = useRouter();
const socket = useSocketService();

const loading = ref(false);
const loadError = ref("");
const hostsError = ref("");
const alarmsError = ref("");
const hosts = ref<any[]>([]);
const events = ref<AlarmEvent[]>([]);
const lastRefresh = ref("");

const tsharkStatus = ref<TsharkRuntimeStatus | null>(null);
const tsharkError = ref("");

const diagOpen = ref(false);
const diagRunning = ref(false);
const diagAt = ref("");
const diagChecks = ref<DiagCheck[]>([]);
const checkingHosts = ref(false);

interface DiagCheck {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
  ms: number;
  /** 失败后可前往处理的路由（没有对应页面时留空） */
  to?: string;
}

type CapStatus = "ok" | "warn" | "error" | "unknown";
interface CapabilityChip {
  key: string;
  label: string;
  status: CapStatus;
  text: string;
  hint: string;
}

const LEVELS = ["P0", "P1", "P2", "P3", "P4"] as const;
const LEVEL_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
const LEVEL_COLORS: Record<string, string> = {
  P0: "var(--sev-p0-text, var(--status-error))",
  P1: "var(--sev-p1-text, var(--status-warning))",
  P2: "var(--sev-p2-text, var(--status-warning))",
  P3: "var(--sev-p3-text, var(--text-tertiary))",
  P4: "var(--sev-p4-text, var(--text-tertiary))",
};
const LEVEL_LABELS: Record<string, string> = { P0: "严重", P1: "高", P2: "中", P3: "低", P4: "信息" };

const realtimeConnected = computed(() => Boolean(socket?.connected?.value));
/** 部署侧是否开启 socket（关闭时“未连接”是预期状态，不是故障） */
const socketEnabled = computed(() => getConfig()?.socket?.enable !== false);
/**
 * 实际解析出的 socket 目标地址。
 *
 * <p>地址可能来自后端 {@code /v2/setting/default}（SocketUrl），不一定等于当前站点；
 * 连不上时把它显示出来，才能直接判断是端口没开、隧道没转，还是代理指错。</p>
 */
const socketTarget = computed(() => {
  try {
    return getGlobalSocketConfig().urls.join(", ");
  } catch {
    return "";
  }
});

const enabledCount = computed(() => hosts.value.filter(h => Number(h.serverHostStatus) !== 0).length);
const onlineCount = computed(() => hosts.value.filter(h => Number(h.serverHostOnline) === 1).length);
const unhandledCount = computed(() => events.value.filter(isUnhandled).length);
const totalAlarms = computed(() => events.value.length);
const levelCounts = computed(() => {
  const m: Record<string, number> = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 };
  for (const e of events.value) m[alarmLevel(e)]++;
  return m;
});
const donutStyle = computed(() => {
  const total = totalAlarms.value;
  if (total === 0) return { background: "var(--border-subtle)" };
  let acc = 0;
  const stops: string[] = [];
  for (const lv of LEVELS) {
    const n = levelCounts.value[lv];
    if (!n) continue;
    const from = (acc / total) * 360;
    acc += n;
    stops.push(`${LEVEL_COLORS[lv]} ${from}deg ${(acc / total) * 360}deg`);
  }
  return { background: `conic-gradient(${stops.join(", ")})` };
});
const recentAlarms = computed(() =>
  [...events.value]
    .sort((a, b) => (b.msMonitorAlarmEventTriggerTime ?? "").localeCompare(a.msMonitorAlarmEventTriggerTime ?? ""))
    .slice(0, 5),
);

const hostRows = computed(() =>
  [...hosts.value].sort((a, b) => {
    const ao = Number(a.serverHostOnline) === 1 ? 1 : 0;
    const bo = Number(b.serverHostOnline) === 1 ? 1 : 0;
    return bo - ao || String(a.serverHostName ?? "").localeCompare(String(b.serverHostName ?? ""));
  }),
);
const avgDelay = computed(() => {
  const vals = hosts.value.map(h => Number(h.serverHostDelayMs)).filter(v => Number.isFinite(v) && v >= 0);
  return vals.length ? `${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)} ms` : "—";
});
const hostOnline = computed(() => hosts.value.filter(h => Number(h.serverHostOnline) === 1).length);

const HOUR = 3600_000;
const alarmTrend = computed(() => {
  const now = Date.now();
  const buckets = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now - (23 - i) * HOUR);
    return { hour: d.getHours(), count: 0, top: "P4" };
  });
  for (const e of events.value) {
    const t = parseAlarmTime(e.msMonitorAlarmEventTriggerTime);
    if (t == null) continue;
    const age = now - t;
    if (age < 0 || age >= 24 * HOUR) continue;
    const idx = 23 - Math.floor(age / HOUR);
    if (idx < 0 || idx > 23) continue;
    buckets[idx].count += 1;
    const lv = alarmLevel(e);
    if ((LEVEL_ORDER[lv] ?? 9) < (LEVEL_ORDER[buckets[idx].top] ?? 9)) buckets[idx].top = lv;
  }
  return buckets;
});
const trendMax = computed(() => Math.max(1, ...alarmTrend.value.map(b => b.count)));
/** 落在近 24 小时窗口内的事件数（totalAlarms 含窗口外的历史事件） */
const trendTotal = computed(() => alarmTrend.value.reduce((sum, b) => sum + b.count, 0));
const trendLabels = computed(() =>
  [0, 6, 12, 18, 23].map(i => (i === 23 ? "现在" : `${String(alarmTrend.value[i]?.hour ?? 0).padStart(2, "0")}:00`)),
);

function checkOf(key: string): DiagCheck | undefined {
  return diagChecks.value.find(c => c.key === key);
}
const capabilities = computed<CapabilityChip[]>(() => {
  const remote = checkOf("remote");
  const files = checkOf("files");
  const t = tsharkStatus.value;
  return [
    {
      key: "realtime",
      label: "实时通道",
      status: realtimeConnected.value ? "ok" : socketEnabled.value ? "error" : "unknown",
      text: realtimeConnected.value ? "已连接" : socketEnabled.value ? "未连接" : "未启用",
      hint: realtimeConnected.value
        ? `Socket.IO 已连接（${socketTarget.value || "同源"}）：告警、主机指标按推送更新`
        : socketEnabled.value
          ? `Socket.IO 未连接（目标 ${socketTarget.value || "未解析"}）：数据每 30s 轮询。点此运行诊断，检查该端口/隧道是否可达`
          : "本部署未启用 socket 推送，数据每 30s 轮询；点此运行诊断查看其它能力",
    },
    {
      key: "tshark",
      label: "抓包",
      status: t ? (t.captureReady ? "ok" : t.ready ? "warn" : "error") : tsharkError.value ? "error" : "unknown",
      text: t ? (t.captureReady ? "可抓包" : t.ready ? "仅解析" : "未安装") : tsharkError.value ? "检测失败" : "检测中",
      hint: t?.message || tsharkError.value || "正在读取 tshark 运行时状态",
    },
    {
      key: "remote",
      label: "远控",
      status: remote ? (remote.ok ? "ok" : "error") : "unknown",
      text: remote ? (remote.ok ? "可用" : "不可用") : "点此检测",
      hint: remote?.detail || "点此运行诊断，检查 /control 远控模块是否挂载",
    },
    {
      key: "files",
      label: "文件存储",
      status: files ? (files.ok ? "ok" : "error") : "unknown",
      text: files ? (files.ok ? "可用" : "不可用") : "点此检测",
      hint: files?.detail || "点此运行诊断，检查 localFileStorage 根目录/回收站",
    },
  ];
});
const diagSummary = computed(() => {
  if (!diagChecks.value.length) return "未检测";
  const ok = diagChecks.value.filter(c => c.ok).length;
  return `${ok}/${diagChecks.value.length} 正常`;
});
const headDescription = computed(
  () => `资产健康 · 最近更新 ${lastRefresh.value || "—"}`,
);
const remoteStatus = computed(() => checkOf("remote")?.ok);

function stampClock(): void {
  const d = new Date();
  lastRefresh.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function describeError(e: unknown): string {
  const err = e as { message?: string; status?: number; response?: { status?: number } };
  const status = err?.status ?? err?.response?.status;
  const msg = err?.message || String(e);
  return status ? `${status} ${msg}` : msg;
}
/**
 * 诊断项的可读失败原因。
 *
 * <p>axios 的原始文案只有 “Request failed with status code 404”，放在诊断结果里
 * 等于没说。这里补上被探测的路径与部署侧最常见的成因，用户才能直接去改配置。</p>
 *
 * @param e      捕获到的异常
 * @param path   被探测的接口路径
 * @param hint404 404 时的部署侧解释
 * @returns 可直接展示的一行原因
 */
function probeDetail(e: unknown, path: string, hint404: string): string {
  const err = e as { message?: string; status?: number; response?: { status?: number } };
  const status = err?.status ?? err?.response?.status;
  if (status === 404) return `404 ${path} — ${hint404}`;
  if (status) return `${status} ${path} — ${err?.message || "请求失败"}`;
  return `${path} — ${err?.message || String(e)}`;
}
function parseAlarmTime(s?: string): number | null {
  if (!s) return null;
  const t = new Date(s.replace(" ", "T")).getTime();
  return Number.isFinite(t) ? t : null;
}
function isHostOnline(h: any): boolean {
  return Number(h.serverHostOnline) === 1;
}
function isHostRemote(h: any): boolean {
  return Number(h.serverHostRemoteEnabled) === 1;
}
function groupLabel(h: any): string {
  return h.serverGroupId != null ? `组 #${h.serverGroupId}` : "未分组";
}
function delayText(h: any): string {
  const d = Number(h.serverHostDelayMs);
  return h.serverHostDelayMs == null || !Number.isFinite(d) ? "—" : `${Math.max(0, Math.round(d))} ms`;
}
function metricItems(h: any): { key: string; label: string; value: number; has: boolean }[] {
  return [
    { key: "cpu", label: "CPU", raw: h.serverHostCpuUsage },
    { key: "mem", label: "内存", raw: h.serverHostMemUsage },
    { key: "disk", label: "磁盘", raw: h.serverHostDiskUsage },
  ].map(d => {
    const n = Number(d.raw);
    return { key: d.key, label: d.label, value: n, has: d.raw != null && Number.isFinite(n) && n > 0 };
  });
}

/** 主机轮询间隔：实时通道不可用时的兜底 */
const POLL_MS = 30_000;
/** 告警轮询间隔：全量事件列表比主机列表重得多，降频到 2 分钟 */
const ALARM_POLL_MS = 120_000;
let pollTimer: ReturnType<typeof setInterval> | undefined;
let lastAlarmPollAt = 0;
let hostsLoading = false;
let alarmsLoading = false;
/** 是否已完成过一次全量加载（避免 socket 首次连接时重复拉取） */
let hasFetched = false;

function startPolling(): void {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    // 后台标签页不轮询：监控页常驻时不该一直打后端。
    if (document.hidden || realtimeConnected.value) return;
    void loadHosts();
    if (Date.now() - lastAlarmPollAt >= ALARM_POLL_MS) {
      lastAlarmPollAt = Date.now();
      void loadAlarms();
    }
  }, POLL_MS);
}
function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

/** 拉主机列表（独立节流，轮询与手动刷新互不打断） */
async function loadHosts(): Promise<void> {
  if (hostsLoading) return;
  hostsLoading = true;
  try {
    hosts.value = (await queryHosts({})) ?? [];
    hostsError.value = "";
    stampClock();
  } catch (e) {
    hostsError.value = describeError(e);
  } finally {
    hostsLoading = false;
  }
}

/** 拉告警事件（全量列表，按需触发） */
async function loadAlarms(): Promise<void> {
  if (alarmsLoading) return;
  alarmsLoading = true;
  try {
    events.value = (await fetchAlarmEvents()) ?? [];
    alarmsError.value = "";
    stampClock();
  } catch (e) {
    alarmsError.value = describeError(e);
  } finally {
    alarmsLoading = false;
  }
}

async function fetchAll(silent = false): Promise<void> {
  if (!silent) loading.value = true;
  loadError.value = "";
  hostsError.value = "";
  alarmsError.value = "";
  await Promise.all([loadHosts(), loadAlarms()]);
  lastAlarmPollAt = Date.now();
  hasFetched = true;
  if (hostsError.value && alarmsError.value) {
    loadError.value = `概览数据加载失败：${hostsError.value}`;
  }
  if (!silent) loading.value = false;
}

async function loadTsharkStatus(): Promise<void> {
  try {
    tsharkStatus.value = await getTsharkStatus();
    tsharkError.value = "";
  } catch (e) {
    tsharkError.value = describeError(e);
  }
}

let unsubOnline: (() => void) | undefined;
let unsubMetrics: (() => void) | undefined;
let unsubAlarm: (() => void) | undefined;
function bindSocket(): void {
  if (!socket) return;
  unsubOnline = socket.subscribe("monitor", "host-online", (msg: any) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; online?: number };
      const t = d?.hostId != null ? hosts.value.find(h => h.id === d.hostId) : null;
      if (t) t.serverHostOnline = d.online ? 1 : 0;
    } catch {
      /* 静默 */
    }
  });
  unsubMetrics = socket.subscribe("monitor", "host-metrics", (msg: any) => {
    try {
      const d = (msg.data ?? msg) as { hostId?: number; cpu?: number; mem?: number; disk?: number };
      const t = d?.hostId != null ? hosts.value.find(h => h.id === d.hostId) : null;
      if (t) {
        if (d.cpu != null) t.serverHostCpuUsage = Number(d.cpu);
        if (d.mem != null) t.serverHostMemUsage = Number(d.mem);
        if (d.disk != null) t.serverHostDiskUsage = Number(d.disk);
        stampClock();
      }
    } catch {
      /* 静默 */
    }
  });
  unsubAlarm = socket.subscribe("monitor", "alarm", () => {
    void loadAlarms();
  });
}

/**
 * 限并发执行（连通性检测一次打所有主机会把 SSH 线程池占满）。
 *
 * @param items 待处理项
 * @param limit 并发上限
 * @param fn    单项处理函数
 * @returns 与 items 顺序一致的 settled 结果
 */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i]) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function checkAllHosts(): Promise<void> {
  if (checkingHosts.value) return;
  if (!hosts.value.length) {
    ElMessage.info("暂无主机资产");
    return;
  }
  checkingHosts.value = true;
  const results = await mapLimit(hosts.value, 4, h => testConnectHost(Number(h.id)));
  const ok = results.filter(r => r.status === "fulfilled").length;
  const firstFail = results.find(r => r.status === "rejected") as PromiseRejectedResult | undefined;
  checkingHosts.value = false;
  if (ok === results.length) ElMessage.success(`连通性检测通过：${ok}/${results.length}`);
  else {
    ElMessage.warning(
      `连通性检测：${ok}/${results.length} 通过${firstFail ? `；首个失败：${describeError(firstFail.reason).slice(0, 80)}` : ""}`,
    );
  }
  await fetchAll(true);
}

async function runDiagnostics(): Promise<void> {
  if (diagRunning.value) return;
  diagRunning.value = true;
  diagChecks.value = [];
  const push = async (key: string, label: string, fn: () => Promise<string>, to?: string): Promise<void> => {
    const t0 = performance.now();
    try {
      const detail = await fn();
      diagChecks.value.push({ key, label, ok: true, detail, ms: Math.round(performance.now() - t0), to });
    } catch (e) {
      diagChecks.value.push({ key, label, ok: false, detail: describeError(e), ms: Math.round(performance.now() - t0), to });
    }
  };
  await Promise.all([
    push("realtime", "实时通道", async () => {
      if (!socketEnabled.value) return "socket 未启用（部署配置关闭）：页面按 30s 轮询";
      if (!realtimeConnected.value) {
        throw new Error(`Socket.IO 未连接（目标 ${socketTarget.value || "未解析"}）`);
      }
      return `Socket.IO 已连接（${socketTarget.value || "同源"}）`;
    }),
    push("backend", "后端健康", async () => {
      try {
        const r = await http().get("/actuator/health");
        const b = ((r as any)?.data ?? r) as { status?: string };
        return `status=${b?.status ?? "UP"}`;
      } catch (e) {
        throw new Error(probeDetail(e, "/actuator/health", "actuator 未开放或网关未转发"));
      }
    }),
    push("remote", "远程控制", async () => {
      try {
        const r = await http().get("/control/sessions");
        const list = unwrapResult<any[]>(r);
        return `${Array.isArray(list) ? list.length : 0} 个活跃会话，/control 已挂载`;
      } catch (e) {
        throw new Error(probeDetail(e, "/control/sessions", "远控模块未挂载（control.webrtc.enabled=false 或未引入 starter）"));
      }
    }, "/control/remote"),
    push("tshark", "抓包能力", async () => {
      const s = await getTsharkStatus();
      tsharkStatus.value = s;
      if (!s.ready) throw new Error(s.message || `状态 ${s.state}`);
      return s.captureReady ? `可实时抓包 · ${s.version || s.source}` : `仅解析 pcap · ${s.version || s.source}`;
    }, "/tshark"),
    push("files", "文件存储", async () => {
      // 探桶根而不是 .recycle：回收站目录只在第一次删除时创建，
      // 用它做健康探针会在新部署上稳定误报 404（页面本身已改为先 ensure 再列表）。
      try {
        await http().get("/fs/localFileStorage").query({ format: "json" });
        return "localFileStorage 根目录可访问";
      } catch (e) {
        throw new Error(probeDetail(e, "/fs/localFileStorage", "文件服务未挂载或桶名不匹配"));
      }
    }, "/files"),
  ]);
  // 并行探测的完成顺序不稳定；按固定顺序展示，便于两次诊断对照
  const order = ["realtime", "backend", "remote", "tshark", "files"];
  diagChecks.value.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  diagRunning.value = false;
  const d = new Date();
  diagAt.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function openDiagnostics(runFresh = false): void {
  diagOpen.value = true;
  if ((runFresh || !diagChecks.value.length) && !diagRunning.value) void runDiagnostics();
}

/** 从诊断结果跳转到对应处理页（抽屉先关，避免盖住目标页） */
function openDiagTarget(to: string): void {
  diagOpen.value = false;
  router.push(to);
}

/**
 * 复制文本（带 HTTP 部署兜底）。
 *
 * <p>navigator.clipboard 只在安全上下文（https / localhost）可用；监控平台常以内网
 * http 部署，那里直接调用会抛 NotAllowedError。兜底用隐藏 textarea + execCommand。</p>
 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* 继续走兜底 */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

async function copyDiagnostics(): Promise<void> {
  if (!diagChecks.value.length) {
    ElMessage.info("请先运行诊断");
    return;
  }
  const text = [
    `监控概览运行诊断 ${diagAt.value}`,
    ...diagChecks.value.map(c => `[${c.ok ? "OK" : "FAIL"}] ${c.label} (${c.ms}ms): ${c.detail}`),
  ].join("\n");
  if (await copyText(text)) ElMessage.success("诊断结果已复制");
  else ElMessage.warning("复制失败，请手动选择文本");
}

function openRemote(): void {
  if (checkOf("remote") && !checkOf("remote")!.ok) {
    openDiagnostics();
    return;
  }
  router.push("/control/remote");
}

/** 回到前台补一次数据，避免看到切走前的旧值 */
function onVisibility(): void {
  if (!document.hidden) void fetchAll(true);
}

onMounted(() => {
  void fetchAll();
  void loadTsharkStatus();
  bindSocket();
  startPolling();
  document.addEventListener("visibilitychange", onVisibility);
});
watch(realtimeConnected, connected => {
  if (connected) {
    stopPolling();
    // 断线期间漏掉的推送靠一次全量补齐；首次连接不重复拉（挂载时已拉过）。
    if (hasFetched) void fetchAll(true);
  } else {
    startPolling();
  }
});
onBeforeUnmount(() => {
  stopPolling();
  document.removeEventListener("visibilitychange", onVisibility);
  unsubOnline?.();
  unsubMetrics?.();
  unsubAlarm?.();
});
</script>

<template>
  <div class="workbench-page">
    <ReSectionHead class="page-head" title="监控概览" :description="headDescription">
      <template #actions>
        <ReButton show-text icon="FirstAidKit" size="small" @click="openDiagnostics(true)">运行诊断</ReButton>
        <ReButton show-text icon="RefreshRight" size="small" :loading="loading" @click="fetchAll()">刷新</ReButton>
        <ReButton show-text icon="Setting" type="primary" size="small" @click="router.push('/assets')">管理资产</ReButton>
      </template>
    </ReSectionHead>

    <ReErrorBar v-if="loadError" :message="loadError" retryText="重试" @retry="fetchAll" />

    <!-- 签名元素：运行状态带。每块能力都能戳开诊断，看到真实原因 -->
    <section class="status-rail" aria-label="运行状态">
      <button
        v-for="c in capabilities"
        :key="c.key"
        type="button"
        class="cap-chip"
        :class="`is-${c.status}`"
        :title="c.hint"
        @click="openDiagnostics(true)"
      >
        <span class="cap-dot" />
        <span class="cap-label">{{ c.label }}</span>
        <span class="cap-state">{{ c.text }}</span>
      </button>
      <span class="rail-meta">
        {{ lastRefresh ? `数据 ${lastRefresh}` : "数据 —" }}
        <span class="rail-sep">·</span>
        {{ realtimeConnected ? "实时通道已连接" : socketEnabled ? "实时通道未连接，30s 轮询" : "未启用实时通道，30s 轮询" }}
      </span>
    </section>

    <ReSkeleton :loading="loading" :rows="2" :count="1" animated>
      <div class="stats-grid">
        <div
          class="stat-card is-clickable"
          style="--accent: var(--brand-500)"
          role="link"
          tabindex="0"
          @click="router.push('/assets')"
          @keydown.enter="router.push('/assets')"
        >
          <div class="stat-label">资产总数</div>
          <div class="stat-value">{{ hosts.length }}</div>
          <div class="stat-trend">已启用 {{ enabledCount }} · 在线 {{ onlineCount }}</div>
        </div>
        <div
          class="stat-card is-clickable"
          style="--accent: var(--status-error)"
          role="link"
          tabindex="0"
          @click="router.push('/alarms')"
          @keydown.enter="router.push('/alarms')"
        >
          <div class="stat-label">未处理告警</div>
          <div class="stat-value">{{ unhandledCount }}</div>
          <div class="stat-trend is-down">累计事件 {{ totalAlarms }}</div>
        </div>
        <div
          class="stat-card is-clickable"
          style="--accent: var(--sev-p0-text, var(--status-error))"
          role="link"
          tabindex="0"
          @click="router.push('/alarms')"
          @keydown.enter="router.push('/alarms')"
        >
          <div class="stat-label">高危告警 P0+P1</div>
          <div class="stat-value">{{ levelCounts.P0 + levelCounts.P1 }}</div>
          <div class="stat-trend">需立即处理</div>
        </div>
        <div
          class="stat-card is-clickable"
          style="--accent: var(--sev-p2-text, var(--status-warning))"
          role="link"
          tabindex="0"
          @click="router.push('/alarms')"
          @keydown.enter="router.push('/alarms')"
        >
          <div class="stat-label">中危告警 P2</div>
          <div class="stat-value">{{ levelCounts.P2 }}</div>
          <div class="stat-trend">当班处理</div>
        </div>
      </div>
    </ReSkeleton>

    <div class="dash-grid">
      <!-- 主机健康：把已经取到、但原来只用来计数的字段真正展示出来 -->
      <section class="wb-card span-7">
        <header class="card-head">
          <div>
            <span class="card-title">主机健康</span>
            <span class="card-sub">{{ hostOnline }}/{{ hosts.length }} 在线 · 平均延迟 {{ avgDelay }}</span>
          </div>
          <ReButton text size="small" icon="ArrowRight" @click="router.push('/assets')">全部资产</ReButton>
        </header>
        <div v-if="hostsError" class="section-error">
          <span>{{ hostsError }}</span>
          <ReButton text size="small" type="primary" @click="fetchAll()">重试</ReButton>
        </div>
        <ReSkeleton v-else :loading="loading" :rows="2" :count="2" animated>
          <div v-if="!hosts.length" class="empty-state">
            <ReEmpty description="还没有主机资产，先添加一台主机" />
            <ReButton type="primary" size="small" icon="Plus" @click="router.push('/assets')">去添加主机</ReButton>
          </div>
          <div v-else class="host-list">
            <button
              v-for="h in hostRows"
              :key="h.id"
              type="button"
              class="host-row"
              @click="router.push('/assets')"
            >
              <span class="host-dot" :class="isHostOnline(h) ? 'is-on' : 'is-off'" />
              <span class="host-avatar">{{ (h.serverHostName || "?").slice(0, 1).toUpperCase() }}</span>
              <span class="host-main">
                <span class="host-name">{{ h.serverHostName || "未命名主机" }}</span>
                <span class="host-meta">{{ h.serverHostAddress || "—" }}:{{ h.serverHostPort || "—" }} · {{ groupLabel(h) }}</span>
              </span>
              <span class="host-delay">{{ delayText(h) }}</span>
              <span class="host-remote" :class="{ on: isHostRemote(h) }">{{ isHostRemote(h) ? "远控开" : "远控关" }}</span>
              <span class="host-metrics">
                <template v-if="metricItems(h).some(m => m.has)">
                  <span
                    v-for="m in metricItems(h)"
                    :key="m.key"
                    class="metric"
                    :title="`${m.label} ${m.has ? Math.round(m.value) + '%' : '未采集'}`"
                  >
                    <span class="metric-label">{{ m.label }}</span>
                    <span class="metric-track">
                      <span class="metric-fill" :style="{ width: m.has ? `${Math.min(100, Math.max(0, m.value))}%` : '0%' }" />
                    </span>
                    <span class="metric-value">{{ m.has ? `${Math.round(m.value)}%` : "—" }}</span>
                  </span>
                </template>
                <span v-else class="metric-empty" title="该主机尚未上报 CPU / 内存 / 磁盘">指标未采集</span>
              </span>
            </button>
          </div>
        </ReSkeleton>
      </section>

      <!-- 告警构成 -->
      <section class="wb-card span-5">
        <header class="card-head">
          <div>
            <span class="card-title">告警构成</span>
            <span class="card-sub">未处理 {{ unhandledCount }} · 累计 {{ totalAlarms }}</span>
          </div>
          <ReButton text size="small" icon="ArrowRight" @click="router.push('/alarms')">告警中心</ReButton>
        </header>
        <div class="donut-wrap">
          <div class="donut" :style="donutStyle">
            <div class="donut-center">
              <div class="donut-value">{{ totalAlarms }}</div>
            </div>
          </div>
          <div class="donut-legend">
            <div v-for="lv in LEVELS" :key="lv" class="legend-item">
              <span class="legend-dot" :style="{ background: LEVEL_COLORS[lv] }" />
              <span class="legend-label">{{ lv }} · {{ LEVEL_LABELS[lv] }}</span>
              <span class="tag" :class="`sev-${lv}`">{{ levelCounts[lv] }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 告警趋势：过去 24 小时 -->
      <section class="wb-card span-5">
        <header class="card-head">
          <div>
            <span class="card-title">告警趋势</span>
            <span class="card-sub">近 24 小时 · {{ trendTotal }} 条 · 峰值 {{ trendMax }}/时</span>
          </div>
        </header>
        <div class="trend" :class="{ 'is-empty': trendTotal === 0 }">
          <div class="trend-bars">
            <span
              v-for="(b, i) in alarmTrend"
              :key="i"
              class="trend-bar"
              :class="{ 'is-current': i === 23, 'is-zero': b.count === 0 }"
              :style="{
                height: b.count ? `${Math.max(8, (b.count / trendMax) * 100)}%` : '3px',
                background: b.count ? LEVEL_COLORS[b.top] : undefined,
              }"
              :title="`${b.hour}:00 · ${b.count} 条`"
            />
          </div>
          <div class="trend-axis">
            <span v-for="(l, i) in trendLabels" :key="i">{{ l }}</span>
          </div>
          <div v-if="trendTotal === 0" class="trend-empty">过去 24 小时无告警</div>
        </div>
      </section>

      <!-- 最近告警 -->
      <section class="wb-card span-7">
        <header class="card-head">
          <div>
            <span class="card-title">最近告警</span>
            <span class="card-sub">按触发时间倒序 · 最多 5 条</span>
          </div>
          <ReButton text size="small" icon="ArrowRight" @click="router.push('/alarms')">全部告警</ReButton>
        </header>
        <div v-if="alarmsError" class="section-error">
          <span>{{ alarmsError }}</span>
          <ReButton text size="small" type="primary" @click="fetchAll()">重试</ReButton>
        </div>
        <div v-else-if="!recentAlarms.length" class="empty-state">
          <ReEmpty description="暂无告警事件，系统运行平稳" />
        </div>
        <ReTable
          v-else
          :data="recentAlarms"
          row-key="id"
          class="alarm-table"
          :layout-table="{ minHeight: 0 }"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <ReTableColumn label="级别" width="76" align="center">
            <template #default="{ row }">
              <span class="tag" :class="`sev-${alarmLevel(row)}`">{{ alarmLevel(row) }}</span>
            </template>
          </ReTableColumn>
          <ReTableColumn label="主机" min-width="110">
            <template #default="{ row }">{{ row.msMonitorAlarmEventMonitorName || "—" }}</template>
          </ReTableColumn>
          <ReTableColumn label="指标" min-width="130">
            <template #default="{ row }">
              <span class="truncate">{{ row.msMonitorAlarmEventMetricName || "—" }}</span>
            </template>
          </ReTableColumn>
          <ReTableColumn label="时间" width="96">
            <template #default="{ row }">
              <span class="mono dim">{{ (row.msMonitorAlarmEventTriggerTime || "").slice(5, 16) }}</span>
            </template>
          </ReTableColumn>
        </ReTable>
      </section>

      <!-- 快捷操作：按能力可用性收敛 -->
      <section class="wb-card span-7">
        <header class="card-head">
          <div>
            <span class="card-title">快捷操作</span>
            <span class="card-sub">按当前能力可用性收敛</span>
          </div>
        </header>
        <div class="quick-grid">
          <ReButton
            class="quick-tile"
            icon="Connection"
            show-text
            :loading="checkingHosts"
            @click="checkAllHosts"
          >一键连通性检测</ReButton>
          <ReButton class="quick-tile" icon="RefreshRight" show-text :loading="loading" @click="fetchAll()">刷新概览</ReButton>
          <ReButton
            class="quick-tile"
            icon="Position"
            show-text
            :disabled="remoteStatus === false"
            :title="remoteStatus === false ? '远控模块未挂载，点“运行诊断”查看原因' : '打开设备远程控制'"
            @click="openRemote"
          >远程控制</ReButton>
          <ReButton class="quick-tile" icon="Cpu" show-text @click="router.push('/monitor/server')">监控大屏</ReButton>
          <ReButton class="quick-tile" icon="Bell" show-text @click="router.push('/alarms')">告警中心</ReButton>
          <ReButton class="quick-tile" icon="Monitor" show-text @click="router.push('/assets')">主机资产</ReButton>
        </div>
      </section>

      <!-- 诊断摘要 -->
      <section class="wb-card span-5 diag-card">
        <header class="card-head">
          <div>
            <span class="card-title">运行诊断</span>
            <span class="card-sub">{{ diagSummary }}</span>
          </div>
          <ReButton text size="small" icon="FirstAidKit" @click="openDiagnostics">打开</ReButton>
        </header>
        <div class="diag-mini">
          <template v-if="diagChecks.length">
            <div v-for="c in diagChecks.filter(x => !x.ok).slice(0, 3)" :key="c.key" class="diag-item is-fail">
              <span class="diag-dot is-fail" />
              <span class="diag-mini-label">{{ c.label }}</span>
              <span class="diag-mini-detail">{{ c.detail }}</span>
            </div>
            <div v-if="diagChecks.every(c => c.ok)" class="diag-hint is-ok">全部检查正常。</div>
          </template>
          <div v-else class="diag-hint">运行一次诊断，确认实时通道、远控、抓包、文件存储是否可用。</div>
        </div>
        <div class="diag-foot">
          <span v-if="diagAt" class="diag-time">上次 {{ diagAt }}</span>
          <ReButton text size="small" type="primary" @click="openDiagnostics">查看全部</ReButton>
        </div>
      </section>
    </div>

    <el-drawer v-model="diagOpen" title="运行诊断" size="440px" class="diag-drawer">
      <p class="drawer-intro">只读检查：实时通道、后端健康、远控模块、抓包能力、文件存储。不会安装依赖或修改数据。</p>
      <div v-if="diagRunning && !diagChecks.length" class="drawer-loading">正在检测…</div>
      <div class="drawer-checks">
        <div v-for="c in diagChecks" :key="c.key" class="diag-check" :class="{ 'is-fail': !c.ok }">
          <span class="diag-dot" :class="c.ok ? 'is-ok' : 'is-fail'" />
          <div class="diag-main">
            <div class="diag-line">
              <span class="diag-label">{{ c.label }}</span>
              <span class="diag-ms">{{ c.ms }} ms</span>
            </div>
            <div class="diag-detail">{{ c.detail }}</div>
            <ReButton
              v-if="!c.ok && c.to"
              text
              size="small"
              type="primary"
              class="diag-go"
              @click="openDiagTarget(c.to)"
            >前往处理</ReButton>
          </div>
        </div>
      </div>
      <div class="drawer-actions">
        <ReButton icon="RefreshRight" :loading="diagRunning" @click="runDiagnostics">重新检测</ReButton>
        <ReButton icon="CopyDocument" type="primary" @click="copyDiagnostics">复制诊断</ReButton>
      </div>
      <p v-if="diagAt" class="drawer-time">上次检测 {{ diagAt }}</p>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.workbench-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
}

.page-head { margin-bottom: 2px; }

/* ── 运行状态带 ─────────────────────────────────────── */
.status-rail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  padding: 8px 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  animation: wb-rise 0.32s var(--ease-out) both;
}
.cap-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;
  cursor: pointer;
  transition: background 0.16s var(--ease-out);
}
.cap-chip:hover { background: var(--bg-hover, rgba(0, 0, 0, 0.04)); }
.cap-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary);
  flex-shrink: 0;
}
.cap-chip.is-ok .cap-dot { background: var(--status-success); }
.cap-chip.is-warn .cap-dot { background: var(--status-warning); }
.cap-chip.is-error .cap-dot { background: var(--status-error); }
.cap-chip.is-unknown .cap-dot { background: var(--text-tertiary); }
.cap-label { font-weight: 600; color: var(--text-primary); }
.cap-state { color: var(--text-tertiary); }
.cap-chip.is-error .cap-state { color: var(--status-error); }
.cap-chip.is-warn .cap-state { color: var(--status-warning); }
.cap-chip.is-ok .cap-state { color: var(--status-success); }
.rail-meta {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
}
.rail-sep { margin: 0 4px; }

/* ── KPI ───────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out);
  animation: wb-rise 0.3s var(--ease-out) both;
}
.stat-card.is-clickable { cursor: pointer; }
.stat-card.is-clickable:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; }
.stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.stat-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 5px;
}
.stat-trend { font-size: 11px; color: var(--text-tertiary); font-weight: 500; }
.stat-trend.is-down { color: var(--status-error); }

/* ── 12 栏网格 ──────────────────────────────────────── */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 14px;
}
.span-7 { grid-column: span 7; }
.span-5 { grid-column: span 5; }

.wb-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  animation: wb-rise 0.34s var(--ease-out) both;
}
.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.card-head > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.card-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.card-sub { font-size: 11px; color: var(--text-tertiary); }

/* ── 主机健康 ───────────────────────────────────────── */
.host-list { display: flex; flex-direction: column; }
.host-row {
  display: grid;
  grid-template-columns: 8px 28px minmax(120px, 1.4fr) 58px 62px minmax(180px, 0.9fr);
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 4px;
  border: 0;
  border-bottom: 1px dashed var(--border-subtle);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.16s var(--ease-out);
}
.host-row:last-child { border-bottom: 0; }
.host-row:hover { background: var(--bg-hover, rgba(0, 0, 0, 0.03)); }
.host-row:focus-visible { outline: 2px solid var(--brand-500); outline-offset: -2px; }
.host-dot { width: 7px; height: 7px; border-radius: 50%; }
.host-dot.is-on { background: var(--status-success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-success) 18%, transparent); }
.host-dot.is-off { background: var(--text-tertiary); }
.host-avatar {
  width: 28px; height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-weak-bg, color-mix(in srgb, var(--brand-500) 12%, transparent));
  color: var(--brand-500);
  font-size: 12px;
  font-weight: 700;
}
.host-main { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.host-name { font-size: 13px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.host-meta { font-size: 11px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.host-delay { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--text-secondary); text-align: right; }
.host-remote {
  font-size: 10px; font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
  color: var(--text-tertiary);
  background: var(--bg-muted, rgba(0, 0, 0, 0.04));
  justify-self: start;
}
.host-remote.on { color: var(--status-success); background: color-mix(in srgb, var(--status-success) 12%, transparent); }
.host-metrics { display: flex; align-items: center; gap: 10px; min-width: 0; }
.metric { display: grid; grid-template-columns: 24px 1fr 30px; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.metric-label { font-size: 11px; color: var(--text-tertiary); }
.metric-track { height: 6px; background: var(--border-subtle); border-radius: 999px; overflow: hidden; }
.metric-fill { display: block; height: 100%; border-radius: 999px; background: var(--brand-500); transition: width 0.4s var(--ease-out); }
.metric-value { font-size: 11px; color: var(--text-tertiary); text-align: right; font-variant-numeric: tabular-nums; }
.metric-empty { font-size: 11px; color: var(--text-tertiary); }

/* ── 甜甜圈 ────────────────────────────────────────── */
.donut-wrap { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.donut { width: 104px; height: 104px; border-radius: 50%; position: relative; flex-shrink: 0; }
.donut-center { position: absolute; inset: 13px; background: var(--bg-container); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.donut-value { font-size: 20px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.donut-legend { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 130px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.legend-label { font-weight: 500; flex: 1; }
.tag { font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: var(--radius-sm); }
.sev-P0, .sev-P1 { color: var(--status-error); }
.sev-P2 { color: var(--status-warning); }
.sev-P3, .sev-P4 { color: var(--text-tertiary); }

/* ── 告警趋势 ──────────────────────────────────────── */
.trend { position: relative; display: flex; flex-direction: column; gap: 6px; padding-top: 2px; flex: 1; }
.trend-bars {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  flex: 1;
  min-height: 118px;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 2px;
}
.trend-bar {
  flex: 1;
  min-width: 2px;
  background: var(--brand-500);
  opacity: 0.8;
  border-radius: 2px 2px 0 0;
  transition: opacity 0.16s var(--ease-out), height 0.35s var(--ease-out);
}
.trend-bar:hover { opacity: 1; }
.trend-bar.is-zero { background: var(--border-subtle); opacity: 1; }
.trend-bar.is-current { opacity: 1; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-500) 45%, transparent); }
.trend-axis { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-tertiary); }
.trend-empty {
  position: absolute;
  inset: 12px 0 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-tertiary);
  pointer-events: none;
}

/* ── 最近告警表 ─────────────────────────────────────── */
.alarm-table { font-size: 12px; }
.truncate { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: monospace; }
.dim { color: var(--text-tertiary); }

/* ── 快捷操作 ──────────────────────────────────────── */
.quick-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.quick-tile { width: 100%; justify-content: flex-start; }

/* ── 诊断摘要 ──────────────────────────────────────── */
.diag-mini { display: flex; flex-direction: column; gap: 6px; min-height: 64px; }
.diag-item { display: flex; align-items: center; gap: 8px; font-size: 12px; min-width: 0; }
.diag-mini-label { font-weight: 600; color: var(--text-secondary); flex-shrink: 0; }
.diag-mini-detail { color: var(--status-error); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.diag-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: var(--text-tertiary); }
.diag-dot.is-ok { background: var(--status-success); }
.diag-dot.is-fail { background: var(--status-error); }
.diag-hint { font-size: 12px; color: var(--text-tertiary); line-height: 1.7; }
.diag-hint.is-ok { color: var(--status-success); }
.diag-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; }
.diag-time { font-size: 11px; color: var(--text-tertiary); }

/* ── 抽屉（teleport 到 body，壳样式用 :global） ─────── */
:global(.diag-drawer .el-drawer__body) { padding: 8px 20px 20px; }
.drawer-intro { margin: 0 0 14px; font-size: 12px; line-height: 1.7; color: var(--text-tertiary); }
.drawer-loading { padding: 24px 0; font-size: 13px; color: var(--text-tertiary); }
.drawer-checks { display: flex; flex-direction: column; gap: 10px; }
.diag-check { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md, 8px); }
.diag-check.is-fail { border-color: color-mix(in srgb, var(--status-error) 35%, var(--border-subtle)); background: color-mix(in srgb, var(--status-error) 4%, transparent); }
.diag-check .diag-dot { margin-top: 3px; }
.diag-main { flex: 1; min-width: 0; }
.diag-line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.diag-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.diag-ms { font-size: 11px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.diag-detail { margin-top: 2px; font-size: 12px; line-height: 1.6; color: var(--text-secondary); overflow-wrap: anywhere; }
.diag-check.is-fail .diag-detail { color: var(--status-error); }
.diag-go { align-self: flex-start; margin-top: 2px; padding-left: 0; }
.drawer-actions { display: flex; gap: 8px; margin-top: 18px; }
.drawer-time { margin: 10px 0 0; font-size: 11px; color: var(--text-tertiary); }

/* ── 通用 ──────────────────────────────────────────── */
.section-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--status-error) 30%, var(--border-subtle));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--status-error) 4%, transparent);
  font-size: 12px;
  color: var(--status-error);
}
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 28px 0; }

@keyframes wb-rise {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .span-7, .span-5 { grid-column: span 12; }
  .host-row { grid-template-columns: 8px 28px minmax(120px, 1fr) 58px 62px; }
  .host-metrics { grid-column: 1 / -1; padding-left: 44px; }
}
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .rail-meta { margin-left: 0; width: 100%; }
}
@media (max-width: 640px) {
  .quick-grid { grid-template-columns: 1fr; }
  .host-row { grid-template-columns: 8px 28px minmax(100px, 1fr) 58px; }
  .host-remote { display: none; }
  .metric-label { display: none; }
  .metric { grid-template-columns: 1fr 30px; }
}
@media (prefers-reduced-motion: reduce) {
  .stat-card, .wb-card, .status-rail { animation: none; transition: none; }
  .trend-bar, .metric-fill { transition: none; }
}
</style>
