<script setup lang="ts">
/**
 * 监控大盘（服务器） —— 对齐 Spring Monitor 原型
 *
 * 页头 + 6 ReStatsCard + CPU环图/内存环图/磁盘&网络侧栏
 * + 资源趋势 + GC统计 + 底部磁盘/系统(Spring) + 弹窗明细。
 *
 * 数据流：REST /v2/server/info 首拉 → SSE /v2/server/info/stream 每秒推送（OSHI + JMX 真实采集）。
 */
import { message } from "@repo/core";
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { Component } from "vue";
import { getConfig } from "@repo/config";

import {
  Refresh, RefreshLeft, Select, Cpu, Document, Coffee, DocumentCopy,
  Coin, DataBoard, FolderOpened, Share, Odometer,
  CircleCheckFilled, Files, FullScreen, Aim, Search, ArrowDown, Grid,
} from "@element-plus/icons-vue";
import ReEChart from "../components/ReEChart.vue";
import MonitorCardBoard from "./cards/MonitorCardBoard.vue";
import ReDialog from "@repo/ui/components/ReDialog/ReDialog.vue";
import ReStatsCard from "@repo/ui/re-stats-card";
import type { ReStatsCardItem } from "@repo/ui/re-stats-card";
import ReTag from "@repo/ui/components/ReTag/ReTag.vue";
import ReInput from "@repo/ui/components/ReInput/ReInput.vue";
import ReTab from "@repo/ui/re-tab";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReTime, { formatDuration } from "@repo/ui/re-time";
import { getServerInfo, getRestfulApiStats, getActuatorEndpoint, setActuatorLogger, getScheduleTasks, updateScheduleTask, runScheduleTask } from "../../api/systemApi";
import type { ManagedScheduleTask } from "../../api/systemApi";
import { createSseClient, costMs } from "@repo/utils";
import type { SseClient } from "@repo/utils";
import type { ServerInfo, ServerMemory, MemoryPoolInfo, NetworkInterfaceInfo, RestfulApiStats, RestfulTopUrl, RestfulTopIp } from "../../api/types";
import { useElColors, withAlpha } from "./echarts-colors";

const colors = useElColors();
const info = ref<ServerInfo>({});
const loading = ref(false);
const updateTime = ref("");

/* ============ 整页自定义布局（页头以下的区块全进网格） ============ */
/** 看板组件实例：页头的「自定义 / 保存」「恢复默认」都通过它操作布局 */
const boardRef = ref<InstanceType<typeof MonitorCardBoard> | null>(null);
/** 编辑态镜像：页头按钮要跟着「自定义 ↔ 保存」切换，所以在本页留一份可响应的状态 */
const layoutEditing = ref(false);

/**
 * 页头「自定义 / 保存」：同一个按钮在两态间切换。
 *
 * <p>进入编辑后滚到页面顶部（而不是某一块）：现在<b>整页</b>都是可拖的，
 * 需要用户看到整张画布，只滚到某个区块反而像「只有那一块能改」。</p>
 */
async function toggleCustomLayout(): Promise<void> {
  layoutEditing.value = Boolean(boardRef.value?.toggleEdit());
  if (!layoutEditing.value) return;
  await nextTick();
  document.querySelector(".srv-board")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** 页头「恢复默认」：退回进入编辑前的那一版布局（改动是即时落盘的，这是唯一撤销入口） */
async function restoreLayout(): Promise<void> {
  const done = await boardRef.value?.restorePreEdit();
  if (done) {
    // 恢复之后仍是编辑态，用户可以接着摆
    layoutEditing.value = Boolean(boardRef.value?.editing);
  }
}

/* ============ 详情 Tab ============ */
type DetailTab = "disk" | "network" | "system";
const detailTab = ref<DetailTab>("disk");
const tabItems: { key: DetailTab; label: string; icon: Component }[] = [
  { key: "disk", label: "磁盘分区", icon: markRaw(FolderOpened) },
  { key: "network", label: "网络接口", icon: markRaw(Share) },
  { key: "system", label: "系统信息", icon: markRaw(Document) },
];

/* ============ 弹窗状态 ============ */
const cpuDialogVisible = ref(false);
const jvmDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const actuatorDialogVisible = ref(false);

/* ============ 主图切换 / 网络 ============ */
type TrendTab = "cpu" | "heap" | "sysmem" | "load" | "restful";
const trendTab = ref<TrendTab>("heap");
const showAllNet = ref(false);
const netLayout = ref<"split" | "merged">("split");

/* ============ 无障碍 ============ */
const prefersReducedMotion = ref(false);
let mq: MediaQueryList | null = null;
const syncMotion = () => { prefersReducedMotion.value = !!mq?.matches; };

/* ============ SSE + 趋势 ============ */
type ConnStatus = "connecting" | "live" | "disconnected";
const connStatus = ref<ConnStatus>("connecting");
let sseClient: SseClient | null = null;
const MAX_POINTS = 30;
const cpuTrend = ref<number[]>([]);
const sysMemTrend = ref<number[]>([]);
const jvmMemTrend = ref<number[]>([]);
const loadTrend = ref<number[]>([]);
const timeLabels = ref<string[]>([]);
const netRxTrend = ref<Record<string, number[]>>({});
const netTxTrend = ref<Record<string, number[]>>({});
const coreTrends = ref<Record<number, number[]>>({});
let prevNetBytes: Record<string, { rx: number; tx: number }> = {};
const r1 = (v: number) => Math.round(v * 10) / 10;

function pushTrend(data: ServerInfo) {
  const now = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  cpuTrend.value.push(r1(data.cpu?.usagePercent ?? 0));
  sysMemTrend.value.push(r1(data.systemMemory?.usagePercent ?? 0));
  jvmMemTrend.value.push(r1(data.jvmMemory?.usagePercent ?? 0));
  loadTrend.value.push(Math.round((data.systemLoadAverage ?? 0) * 100) / 100);
  timeLabels.value.push(now);
  const cores = data.coreUsages ?? [];
  for (let i = 0; i < cores.length; i++) {
    if (!coreTrends.value[i]) coreTrends.value[i] = [];
    coreTrends.value[i].push(r1(cores[i]));
    if (coreTrends.value[i].length > MAX_POINTS) coreTrends.value[i].shift();
  }
  for (const ifc of data.networkInterfaces ?? []) {
    const key = ifc.name || "eth0";
    const prev = prevNetBytes[key];
    const rx = (ifc.bytesRecv ?? 0) / 1024;
    const tx = (ifc.bytesSent ?? 0) / 1024;
    if (prev) {
      const drx = Math.max(0, Math.round((rx - prev.rx) * 10) / 10);
      const dtx = Math.max(0, Math.round((tx - prev.tx) * 10) / 10);
      if (!netRxTrend.value[key]) { netRxTrend.value[key] = []; netTxTrend.value[key] = []; }
      netRxTrend.value[key].push(drx);
      netTxTrend.value[key].push(dtx);
      if (netRxTrend.value[key].length > MAX_POINTS) { netRxTrend.value[key].shift(); netTxTrend.value[key].shift(); }
    }
    prevNetBytes[key] = { rx, tx };
  }
  if (cpuTrend.value.length > MAX_POINTS) {
    cpuTrend.value.shift(); sysMemTrend.value.shift(); jvmMemTrend.value.shift();
    loadTrend.value.shift(); timeLabels.value.shift();
  }
}
function applyMetrics(d: ServerInfo) { info.value = d ?? {}; pushTrend(info.value); updateTime.value = new Date().toLocaleTimeString(); }
function connectSSE() {
  disconnectSSE(); connStatus.value = "connecting";
  sseClient = createSseClient<ServerInfo>("/v2/server/info/stream", {
    method: "POST", body: {},
    // 长连接推送：服务端每次重开流都续上（底层只在 onerror 里触发重连）。
    // 选项名是 reconnect（见 packages/utils/src/types 的 SseClientOptions），
    // 缺省即 true，这里显式写出来是为了配合下面的 reconnectInterval 一起表达意图。
    reconnect: true, reconnectInterval: 2000,
    onOpen: () => { connStatus.value = "live"; },
    onMessage: (e) => { applyMetrics(e.data); connStatus.value = "live"; },
    onError: () => { connStatus.value = "disconnected"; },
  });
}
const disconnectSSE = () => { sseClient?.close(); sseClient = null; };
async function loadInfo(silent = false) {
  if (!silent) loading.value = true;
  try { const res = await getServerInfo(); info.value = res?.data ?? {}; updateTime.value = new Date().toLocaleTimeString(); pushTrend(info.value); }
  catch (e) { if (!silent) message.error((e as Error)?.message ?? "加载失败"); }
  finally { if (!silent) loading.value = false; }
}
onMounted(async () => {
  mq = window.matchMedia("(prefers-reduced-motion: reduce)"); syncMotion(); mq.addEventListener?.("change", syncMotion);
  await Promise.all([loadInfo(), loadRestfulStats()]);
  connectSSE();
  restfulTimer = window.setInterval(() => { void loadRestfulStats(); }, 2000);
});
onBeforeUnmount(() => {
  mq?.removeEventListener?.("change", syncMotion);
  disconnectSSE();
  if (restfulTimer) { window.clearInterval(restfulTimer); restfulTimer = undefined; }
});

/* ============ 工具 ============ */
function formatBytes(b?: number): string {
  if (b === undefined || b === null || isNaN(b)) return "—";
  if (b < 1024) return `${b} B`;
  const u = ["KB", "MB", "GB", "TB"]; let v = b / 1024; let i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(2)} ${u[i]}`;
}
function fmtUptime(s?: number): string {
  if (!s) return "—"; const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}天 ${h}时 ${m}分` : h > 0 ? `${h}时 ${m}分` : `${m}分`;
}
function fmtTime(ms?: number): string { return ms ? new Date(ms).toLocaleString() : "—"; }
function shortUrl(u?: string): string {
  if (!u) return "—";
  return u.length > 42 ? u.slice(0, 42) + "…" : u;
}
function fmtRate(k: number): string { return k < 1024 ? `${k.toFixed(1)} KB/s` : `${(k / 1024).toFixed(2)} MB/s`; }
/** KB/s → Mbps（网卡侧栏展示） */
function toMbps(k: number): string { return `${(k * 8.192 / 1000).toFixed(1)} Mbps`; }
async function copyText(t?: string) { if (!t) return; try { await navigator.clipboard.writeText(t); message.success("已复制"); } catch { message.warning("复制失败"); } }

function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  } catch { /* ignore */ }
}

type Level = "ok" | "warn" | "danger";
const lvl = (p: number): Level => p >= 85 ? "danger" : p >= 60 ? "warn" : "ok";
const lvlColor = (l: Level) => l === "danger" ? colors.danger : l === "warn" ? colors.warning : colors.success;
const barColor = (p: number) => lvlColor(lvl(p));
/** 磁盘占用配色（详情弹窗：>=90 红 / >=80 橙 / 其余绿，贴合设计稿） */
const diskColor = (p: number) => (p >= 90 ? colors.danger : p >= 80 ? colors.warning : colors.success);
/** 盘符：C:\ → C: */
const driveLabel = (path?: string) => String(path ?? "").replace(/[\\/]+$/, "") || "—";
const lvlLabel = (p: number) => { const l = lvl(p); return l === "danger" ? "告警" : l === "warn" ? "偏高" : "正常"; };

/* ============ 派生指标 ============ */
const cpuPct = computed(() => r1(info.value.cpu?.usagePercent ?? 0));
const sysMemPct = computed(() => r1(info.value.systemMemory?.usagePercent ?? 0));
const jvmMemPct = computed(() => r1(info.value.jvmMemory?.usagePercent ?? 0));
const diskPct = computed(() => r1(info.value.diskPeak?.usagePercent ?? 0));
/** 环境标识：取应用配置 config.env.env（dev/test/prod），取不到按 dev 处理 */
const envLabel = computed(() => {
  const env = getConfig().env.env;
  return env === "prod" ? "生产环境" : env === "test" ? "测试环境" : "开发环境";
});
const hostname = computed(() => info.value.server?.hostname || "—");
const osInfo = computed(() => { const s = info.value.server; return s ? `${s.osName ?? ""} ${s.osVersion ?? ""}`.trim() : "—"; });
const loadAvg = computed(() => (info.value.systemLoadAverage ?? 0));
const connLabel = computed(() => connStatus.value === "live" ? "实时" : connStatus.value === "connecting" ? "连接中" : "已断开");
const logicalCores = computed(() => info.value.cpu?.logicalCores ?? 0);

const diskFreeBytes = computed(() => (info.value.disks ?? []).reduce((s, d) => s + (d.free ?? d.available ?? 0), 0));
const diskTotalBytes = computed(() => (info.value.disks ?? []).reduce((s, d) => s + (d.total ?? 0), 0));
const springEntries = computed(() => Object.entries(info.value.springConfig ?? {}));

const gcTotalCount = computed(() => (info.value.gcCollectors ?? []).reduce((s, g) => s + (g.collectionCount ?? 0), 0));
const gcTotalTimeMs = computed(() => (info.value.gcCollectors ?? []).reduce((s, g) => s + (g.collectionTime ?? 0), 0));
const gcAvgMs = computed(() => gcTotalCount.value > 0 ? Math.round(gcTotalTimeMs.value / gcTotalCount.value) : 0);

const mainNetIfc = computed<NetworkInterfaceInfo | null>(() => {
  const ifcs = info.value.networkInterfaces ?? [];
  return ifcs.find((i) => !/lo|loopback/i.test(i.name ?? "")) ?? ifcs[0] ?? null;
});
const netRxNow = computed(() => {
  const name = mainNetIfc.value?.name || "eth0";
  const a = netRxTrend.value[name] ?? [];
  return a.length ? a[a.length - 1] : 0;
});
const netTxNow = computed(() => {
  const name = mainNetIfc.value?.name || "eth0";
  const a = netTxTrend.value[name] ?? [];
  return a.length ? a[a.length - 1] : 0;
});
const displayNetIfcs = computed<NetworkInterfaceInfo[]>(() => {
  if (showAllNet.value) return info.value.networkInterfaces ?? [];
  return mainNetIfc.value ? [mainNetIfc.value] : [];
});

/* ============ RESTful 实时统计（方案 A） ============ */
type RestfulMode = "count" | "qps" | "top" | "ip";
const restfulMode = ref<RestfulMode>("count");
const restfulStats = ref<RestfulApiStats>({});
const restfulTrendLabels = ref<string[]>([]);
const restfulCountTrend = ref<number[]>([]);
const restfulQpsTrend = ref<number[]>([]);
/** 窗口内 Top IP 的每秒请求曲线 */
const restfulIpTrendRegions = ref<{ ip: string; data: number[] }[]>([]);
const restfulTopUrls = computed<RestfulTopUrl[]>(() => restfulStats.value.topUrls ?? []);
const restfulTopIps = computed<RestfulTopIp[]>(() => restfulStats.value.topIps ?? []);
const restfulSummary = computed(() => restfulStats.value.summary ?? {});
const restfulHasData = computed(() => {
  if (restfulMode.value === "top") return restfulTopUrls.value.length > 0;
  if (restfulMode.value === "ip") return restfulIpTrendRegions.value.length > 0;
  return restfulCountTrend.value.length > 0;
});

/** 每行的规范化 URL → 统计映射（供请求映射表关联次数 / 耗时 / IP） */
const restfulUrlIndex = computed(() => {
  const map = new Map<string, RestfulTopUrl>();
  for (const u of restfulTopUrls.value) {
    if (u.key) map.set(u.key, u);
    const m = (u.method || "GET").toUpperCase();
    if (u.url) map.set(`${m} ${u.url}`, u);
  }
  return map;
});

/** 从 Actuator predicate 解析 METHOD + 路径列表，并匹配旁路统计 */
function matchRestfulStat(predicate: string): RestfulTopUrl | undefined {
  const method = (/(?:^|[{,\s])([A-Z]{3,7})\s*\[/.exec(predicate)?.[1] ?? "").toUpperCase();
  const paths = /\[([^\]]*)\]/.exec(predicate)?.[1]?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const index = restfulUrlIndex.value;
  for (const p of paths) {
    const found = index.get(`${method} ${p}`);
    if (found) return found;
  }
  for (const p of paths) {
    const normalized = p.replace(/\{[^}]+\}/g, "{id}");
    for (const m of method ? [method] : ["GET", "POST", "PUT", "DELETE"]) {
      const found = index.get(`${m} ${normalized}`);
      if (found) return found;
    }
  }
  return undefined;
}
const restfulQpsNow = computed(() => {
  const a = restfulQpsTrend.value;
  return a.length ? a[a.length - 1] : (restfulSummary.value.windowQps ?? 0);
});

function applyRestfulStats(d?: RestfulApiStats) {
  if (!d) return;
  restfulStats.value = d;
  const trend = d.trend ?? [];
  const labels: string[] = [];
  const counts: number[] = [];
  const qps: number[] = [];
  for (const p of trend) {
    const sec = p.second ?? 0;
    labels.push(new Date(sec * 1000).toLocaleTimeString("zh-CN", { hour12: false }));
    counts.push(p.count ?? 0);
    qps.push(Math.round((p.qps ?? p.count ?? 0) * 10) / 10);
  }
  restfulTrendLabels.value = labels;
  restfulCountTrend.value = counts;
  restfulQpsTrend.value = qps;

  // IP 趋势：窗口中累计请求数前 5 的来源 IP，各自一条曲线
  const totals = new Map<string, number>();
  for (const p of trend) {
    for (const it of p.ips ?? []) {
      if (!it.ip) continue;
      totals.set(it.ip, (totals.get(it.ip) ?? 0) + (it.count ?? 0));
    }
  }
  const topIps = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([ip]) => ip);
  restfulIpTrendRegions.value = topIps.map((ip) => ({
    ip,
    data: trend.map((p) => (p.ips ?? []).find((it) => it.ip === ip)?.count ?? 0),
  }));
}
async function loadRestfulStats() {
  try {
    const res = await getRestfulApiStats();
    applyRestfulStats(res?.data);
  } catch {
    /* 静默：统计接口不可用不影响大盘 */
  }
}
let restfulTimer: number | undefined;

/* ============ Actuator 监控端点（可视化） ============ */
type ActuatorTab = "health" | "info" | "metrics" | "env" | "loggers" | "mappings" | "beans" | "conditions" | "threaddump" | "configprops" | "scheduledtasks";
const actuatorTab = ref<ActuatorTab>("health");
const actuatorData = ref<Record<string, any> | null>(null);
const actuatorLoading = ref(false);
const actuatorError = ref("");
const actKeyword = ref("");
const actLevelSaving = ref("");
const actuatorTabs: { name: ActuatorTab; label: string }[] = [
  { name: "health", label: "健康状态" },
  { name: "info", label: "应用信息" },
  { name: "metrics", label: "指标" },
  { name: "env", label: "环境属性" },
  { name: "loggers", label: "日志级别" },
  { name: "mappings", label: "请求映射" },
  { name: "beans", label: "Bean 列表" },
  { name: "conditions", label: "自动配置" },
  { name: "threaddump", label: "线程快照" },
  { name: "configprops", label: "配置属性" },
  { name: "scheduledtasks", label: "定时任务" },
];

async function loadActuator(tab: ActuatorTab = actuatorTab.value) {
  actuatorTab.value = tab;
  actuatorLoading.value = true;
  actuatorError.value = "";
  actuatorData.value = null;
  actKeyword.value = "";
  try {
    const data = await getActuatorEndpoint(tab);
    actuatorData.value = (data as Record<string, any>) ?? null;
  } catch (e) {
    actuatorError.value = (e as Error)?.message ?? "加载 Actuator 失败";
  } finally {
    actuatorLoading.value = false;
  }
  if (tab === "metrics") {
    // 默认选中第一个指标，避免右侧一直空着
    metricKeyword.value = "";
    metricName.value = "";
    metricDetail.value = null;
    const first = metricNames.value[0];
    if (first) void selectMetric(first);
  }
  if (tab === "scheduledtasks") {
    void loadManagedTasks();
  }
}

/* --- 指标（metrics）：左侧指标名列表 + 右侧明细 --- */
interface MetricMeasurement { statistic: string; value: number; }
interface MetricTag { tag: string; values?: string[]; }
interface MetricDetail {
  name: string;
  description?: string;
  baseUnit?: string;
  measurements?: MetricMeasurement[];
  availableTags?: MetricTag[];
}
const metricKeyword = ref("");
const metricName = ref("");
const metricDetail = ref<MetricDetail | null>(null);
const metricDetailLoading = ref(false);
/** /actuator/metrics 返回的指标名列表 */
const metricNames = computed<string[]>(() => {
  const names = (actuatorData.value as { names?: unknown } | null)?.names;
  return Array.isArray(names) ? names.filter((n): n is string => typeof n === "string") : [];
});
const filteredMetricNames = computed<string[]>(() => {
  const kw = metricKeyword.value.trim().toLowerCase();
  return kw ? metricNames.value.filter((n) => n.toLowerCase().includes(kw)) : metricNames.value;
});
/** 加载单个指标明细（/actuator/metrics/{name}） */
async function selectMetric(name: string) {
  metricName.value = name;
  metricDetailLoading.value = true;
  metricDetail.value = null;
  try {
    const data = await getActuatorEndpoint(`metrics/${name}`);
    metricDetail.value = (data as MetricDetail) ?? null;
  } catch (e) {
    message.error((e as Error)?.message ?? "加载指标明细失败");
  } finally {
    metricDetailLoading.value = false;
  }
}

/* --- 可编辑定时任务（动态调度注册中心） --- */
async function loadManagedTasks() {
  managedLoading.value = true;
  try {
    const res = await getScheduleTasks();
    managedTasks.value = res.data ?? [];
  } catch (e) {
    managedError.value = (e as Error)?.message ?? "加载定时任务失败";
  } finally {
    managedLoading.value = false;
  }
}
async function saveManagedCron(row: ManagedScheduleTask) {
  if (!row.key) return;
  managedSaving.value = row.key;
  try {
    await updateScheduleTask(row.key, { cron: row.cron });
    message.success(`「${row.label || row.key}」执行周期已更新`);
    await loadManagedTasks();
  } catch (e) {
    message.error((e as Error)?.message ?? "更新 cron 失败");
    await loadManagedTasks();
  } finally {
    managedSaving.value = "";
  }
}
async function toggleManagedTask(row: ManagedScheduleTask, enabled: boolean) {
  if (!row.key) return;
  managedSaving.value = row.key;
  try {
    await updateScheduleTask(row.key, { enabled });
    message.success(`已${enabled ? "启用" : "停用"}「${row.label || row.key}」`);
    await loadManagedTasks();
  } catch (e) {
    message.error((e as Error)?.message ?? "更新任务状态失败");
    await loadManagedTasks();
  } finally {
    managedSaving.value = "";
  }
}
async function runManagedTask(row: ManagedScheduleTask) {
  if (!row.key) return;
  managedSaving.value = row.key;
  try {
    await runScheduleTask(row.key);
    message.success(`已触发「${row.label || row.key}」`);
    await loadManagedTasks();
  } catch (e) {
    message.error((e as Error)?.message ?? "触发任务失败");
  } finally {
    managedSaving.value = "";
  }
}
function openActuator() {
  actuatorDialogVisible.value = true;
  void loadActuator(actuatorTab.value);
}

/** 关键字过滤 */
function actHit(...fields: unknown[]): boolean {
  const kw = actKeyword.value.trim().toLowerCase();
  if (!kw) return true;
  return fields.some((f) => String(f ?? "").toLowerCase().includes(kw));
}
/** 对象 → 键值列表 */
function toEntries(obj?: Record<string, any> | null): { k: string; v: string }[] {
  if (!obj) return [];
  return Object.entries(obj).map(([k, v]) => ({
    k,
    v: v !== null && typeof v === "object" ? JSON.stringify(v) : String(v ?? ""),
  }));
}
/** 健康详情摘要 */
function healthDetail(details?: Record<string, any>): string {
  if (!details) return "";
  return Object.entries(details)
    .map(([k, v]) => {
      if (["free", "total", "threshold"].includes(k) && typeof v === "number") {
        return `${k}=${formatBytes(v)}`;
      }
      return `${k}=${v !== null && typeof v === "object" ? JSON.stringify(v) : v}`;
    })
    .join(" · ");
}

/** 线程状态 → 标签配色 */
function threadStateType(state: string): "success" | "warning" | "danger" | "info" {
  if (state === "RUNNABLE") return "success";
  if (state === "BLOCKED") return "danger";
  if (state === "WAITING" || state === "TIMED_WAITING") return "warning";
  return "info";
}

/* ===== ReTable 列插槽收窄函数（规格 §5：插槽 row 是宽类型，
   要做算术或传给有参函数时在 script 里收窄，不在模板里堆 as any） ===== */

/** 线程状态列：宽 row → 字符串状态再取配色 */
function threadStateTypeOfRow(row: Record<string, unknown>): "success" | "warning" | "danger" | "info" {
  return threadStateType(String(row.state ?? "-"));
}

/** 阻塞列：`N次/Mms` 文案（原模板里的模板字符串挪到这里收窄） */
function blockedText(row: Record<string, unknown>): string {
  const count = Number(row.blockedCount ?? 0);
  return count ? `${count}次/${Number(row.blockedTime ?? 0)}ms` : "-";
}

/** 等待列：`N次/Mms` 文案 */
function waitedText(row: Record<string, unknown>): string {
  const count = Number(row.waitedCount ?? 0);
  return count ? `${count}次/${Number(row.waitedTime ?? 0)}ms` : "-";
}

/** 日志级别列：宽 row → name 字符串（传给 changeLoggerLevel 的有参函数） */
function changeLoggerLevelOfRow(row: Record<string, unknown>, level: string) {
  return changeLoggerLevel(String(row.name ?? ""), level);
}

/** 定时任务列插槽里的行收窄到 ManagedScheduleTask（保存/执行/启停都吃这个类型） */
function managedTaskOf(row: Record<string, unknown>): ManagedScheduleTask {
  return row as unknown as ManagedScheduleTask;
}

/* --- 健康状态 --- */
const healthStatus = computed(() => String(actuatorData.value?.status ?? "-"));
interface HealthNode { name: string; status: string; details: string; depth: number; }
const healthNodes = computed<HealthNode[]>(() => {
  const comps = actuatorData.value?.components as Record<string, any> | undefined;
  const out: HealthNode[] = [];
  const walk = (obj: Record<string, any>, depth: number, prefix: string) => {
    Object.entries(obj).forEach(([k, v]) => {
      const name = prefix ? `${prefix} / ${k}` : k;
      if (v && typeof v === "object" && v.components) {
        out.push({ name, status: String(v.status ?? "-"), details: "", depth });
        walk(v.components, depth + 1, name);
      } else {
        out.push({ name, status: String(v?.status ?? "-"), details: healthDetail(v?.details), depth });
      }
    });
  };
  if (comps) walk(comps, 0, "");
  return out.filter((n) => actHit(n.name, n.status, n.details));
});

/* --- 环境属性 --- */
const envSources = computed(() => {
  const list = (actuatorData.value?.propertySources as any[]) ?? [];
  return list
    .map((s) => ({
      name: String(s?.name ?? "-"),
      props: Object.entries(s?.properties ?? {})
        .map(([k, v]: [string, any]) => ({ k, v: String(v?.value ?? "") }))
        .filter((p) => actHit(p.k, p.v)),
    }))
    .filter((s) => s.props.length > 0);
});

/* --- 日志级别（可编辑） --- */
const loggerLevels = computed<string[]>(() => [
  "INHERITED",
  ...((actuatorData.value?.levels as string[]) ?? []),
]);
const loggerRows = computed(() => {
  const loggers = (actuatorData.value?.loggers as Record<string, any>) ?? {};
  return Object.entries(loggers)
    .map(([name, v]: [string, any]) => ({
      name,
      configured: v?.configuredLevel ?? "",
      effective: String(v?.effectiveLevel ?? "-"),
    }))
    .filter((r) => actHit(r.name, r.effective))
    .sort((a, b) => a.name.localeCompare(b.name));
});

/* 日志级别：前端分页 */
const loggerPage = ref(1);
const loggerPageSize = ref(20);
const pagedLoggerRows = computed(() => {
  const start = (loggerPage.value - 1) * loggerPageSize.value;
  return loggerRows.value.slice(start, start + loggerPageSize.value);
});
// 过滤条件 / 数据变化时回到第 1 页
watch([actKeyword, () => loggerRows.value.length], () => {
  loggerPage.value = 1;
});
async function changeLoggerLevel(name: string, level: string) {
  actLevelSaving.value = name;
  try {
    await setActuatorLogger(name, level);
    message.success(`已将「${name}」级别设为 ${level === "INHERITED" ? "继承" : level}`);
    await loadActuator("loggers");
  } catch (e) {
    message.error((e as Error)?.message ?? "修改日志级别失败");
  } finally {
    actLevelSaving.value = "";
  }
}

/* --- 请求映射 --- */
const mappingRows = computed(() => {
  const contexts = (actuatorData.value?.contexts as Record<string, any>) ?? {};
  const out: {
    ctx: string; handler: string; predicate: string;
    count: number; avgMs: number; ips: string; url: string;
  }[] = [];
  Object.entries(contexts).forEach(([ctx, c]: [string, any]) => {
    const ds = c?.mappings?.dispatcherServlets ?? {};
    Object.entries(ds).forEach(([, arr]: [string, any]) => {
      (arr ?? []).forEach((item: any) => {
        const predicate = String(item?.predicate ?? "");
        const stat = matchRestfulStat(predicate);
        out.push({
          ctx,
          handler: String(item?.handler ?? "-"),
          predicate,
          count: stat?.count ?? 0,
          avgMs: stat?.avgMs ?? 0,
          ips: stat?.ips?.map((i) => i.ip).filter(Boolean).join("、") ?? "",
          url: stat?.url ?? "",
        });
      });
    });
  });
  return out.filter((r) => actHit(r.handler, r.predicate));
});

/* --- Bean 列表 --- */
const beanRows = computed(() => {
  const contexts = (actuatorData.value?.contexts as Record<string, any>) ?? {};
  const out: { ctx: string; name: string; type: string; scope: string; resource: string }[] = [];
  Object.entries(contexts).forEach(([ctx, c]: [string, any]) => {
    Object.entries(c?.beans ?? {}).forEach(([name, b]: [string, any]) => {
      out.push({
        ctx,
        name,
        type: String(b?.type ?? ""),
        scope: String(b?.scope ?? ""),
        resource: String(b?.resource ?? ""),
      });
    });
  });
  return out.filter((r) => actHit(r.name, r.type));
});

/* --- 自动配置条件 --- */
const conditionRows = computed(() => {
  const contexts = (actuatorData.value?.contexts as Record<string, any>) ?? {};
  const out: { ctx: string; result: string; name: string; message: string }[] = [];
  const push = (ctx: string, list: any, result: string) => {
    Object.entries(list ?? {}).forEach(([name, v]: [string, any]) => {
      out.push({
        ctx,
        result,
        name,
        message: String(v?.message ?? v?.condition ?? ""),
      });
    });
  };
  Object.entries(contexts).forEach(([ctx, c]: [string, any]) => {
    push(ctx, c?.positiveMatches, "positive");
    push(ctx, c?.negativeMatches, "negative");
  });
  return out.filter((r) => actHit(r.name, r.message));
});

/* --- 线程快照 --- */
const threadRows = computed(() => {
  const threads = (actuatorData.value?.threads as any[]) ?? [];
  return threads
    .map((t) => ({
      name: String(t?.threadName ?? "-"),
      state: String(t?.threadState ?? "-"),
      daemon: t?.daemon === true,
      blockedCount: Number(t?.blockedCount ?? 0),
      blockedTime: Number(t?.blockedTime ?? 0),
      waitedCount: Number(t?.waitedCount ?? 0),
      waitedTime: Number(t?.waitedTime ?? 0),
      top:
        (t?.stackTrace?.[0]?.className ?? "") +
        (t?.stackTrace?.[0]?.methodName ? "." + t.stackTrace[0].methodName : ""),
    }))
    .filter((r) => actHit(r.name, r.state, r.top));
});

/* --- 配置属性 --- */
const configRows = computed(() => {
  const contexts = (actuatorData.value?.contexts as Record<string, any>) ?? {};
  const out: { ctx: string; prefix: string; key: string; value: string }[] = [];
  Object.entries(contexts).forEach(([ctx, c]: [string, any]) => {
    Object.entries(c?.beans ?? {}).forEach(([prefix, b]: [string, any]) => {
      Object.entries(b?.properties ?? {}).forEach(([k, v]: [string, any]) => {
        out.push({ ctx, prefix, key: k, value: String(v?.value ?? "") });
      });
    });
  });
  return out.filter((r) => actHit(r.prefix, r.key, r.value));
});

/* --- 定时任务 --- */
const managedTasks = ref<ManagedScheduleTask[]>([]);
const managedLoading = ref(false);
const managedSaving = ref("");
const managedError = ref("");
const scheduledRows = computed(() => {
  const d = actuatorData.value ?? {};
  const out: { type: string; target: string; expr: string; next: string; last: string; lastStatus: string }[] = [];
  (["cron", "fixedDelay", "fixedRate", "custom"] as const).forEach((type) => {
    ((d[type] as any[]) ?? []).forEach((t: any) => {
      out.push({
        type,
        target: String(t?.runnable?.target ?? "-"),
        expr: String(t?.expression ?? t?.interval ?? ""),
        next: String(t?.nextExecution?.time ?? "-"),
        last: String(t?.lastExecution?.time ?? "-"),
        lastStatus: String(t?.lastExecution?.status ?? "-"),
      });
    });
  });
  return out.filter((r) => actHit(r.target, r.expr, r.type));
});

/**
 * ===== Actuator 弹窗 8 张表格的列定义 =====
 *
 * <p>原模板里散落的 el-table-column 收敛到这里。标题均为中文字面量、不含
 * {@code t(...)}，所以用普通常量即可（只有带 t() 的列标题才需要 computed）。
 * 序号/选择列不存在：这 8 张表原本就没有 type="index" / type="selection"。</p>
 */

/** 日志级别表（配置级别列有自定义模板 → slot） */
const loggerColumns: ReTableColumn[] = [
  { prop: "name", label: "Logger", minWidth: 320, showOverflowTooltip: true },
  { prop: "effective", label: "生效级别", width: 120, align: "center" },
  { prop: "configured", label: "配置级别（可修改）", width: 200, align: "center", slot: "configured" },
];

/** 请求映射表 */
const mappingColumns: ReTableColumn[] = [
  { prop: "predicate", label: "映射条件", minWidth: 320, showOverflowTooltip: true },
  { prop: "handler", label: "处理器", minWidth: 220, showOverflowTooltip: true },
  { prop: "count", label: "请求次数", width: 110, align: "right", sortable: true, slot: "count" },
  { prop: "avgMs", label: "平均延迟", width: 110, align: "right", sortable: true, slot: "avgMs" },
  { prop: "ips", label: "访问 IP", minWidth: 150, showOverflowTooltip: true, sortable: true, slot: "ips" },
  { prop: "ctx", label: "上下文", width: 110, align: "center", sortable: true },
];

/** Bean 列表（纯展示，无模板列） */
const beanColumns: ReTableColumn[] = [
  { prop: "name", label: "Bean 名称", minWidth: 240, showOverflowTooltip: true },
  { prop: "type", label: "类型", minWidth: 320, showOverflowTooltip: true },
  { prop: "scope", label: "作用域", width: 110, align: "center" },
  { prop: "resource", label: "来源", minWidth: 200, showOverflowTooltip: true },
];

/** 自动配置条件（结果列无 prop，用行字段 result 作合成 prop） */
const conditionColumns: ReTableColumn[] = [
  { prop: "result", label: "结果", width: 110, align: "center", slot: "result" },
  { prop: "name", label: "自动配置", minWidth: 300, showOverflowTooltip: true },
  { prop: "message", label: "条件说明", minWidth: 360, showOverflowTooltip: true },
];

/** 线程快照 */
const threadColumns: ReTableColumn[] = [
  { prop: "name", label: "线程", minWidth: 240, showOverflowTooltip: true },
  { prop: "state", label: "状态", width: 120, align: "center", slot: "state" },
  { prop: "daemon", label: "守护", width: 70, align: "center", slot: "daemon" },
  { prop: "blockedCount", label: "阻塞", width: 120, align: "center", slot: "blockedCount" },
  { prop: "waitedCount", label: "等待", width: 120, align: "center", slot: "waitedCount" },
  { prop: "top", label: "栈顶", minWidth: 320, showOverflowTooltip: true },
];

/** 配置属性（纯展示，无模板列） */
const configColumns: ReTableColumn[] = [
  { prop: "prefix", label: "前缀", minWidth: 240, showOverflowTooltip: true },
  { prop: "key", label: "属性", minWidth: 260, showOverflowTooltip: true },
  { prop: "value", label: "值", minWidth: 300, showOverflowTooltip: true },
];

/** 可编辑定时任务（cron / 启停 / 上次状态 / 操作 4 列有模板；「操作」列无 prop → 合成 action） */
const managedTaskColumns: ReTableColumn[] = [
  { prop: "label", label: "任务", minWidth: 150, showOverflowTooltip: true },
  { prop: "cron", label: "cron 表达式", minWidth: 210, slot: "cron" },
  { prop: "enabled", label: "启用", width: 80, align: "center", slot: "enabled" },
  { prop: "nextTime", label: "下次执行", minWidth: 160, showOverflowTooltip: true },
  { prop: "lastTime", label: "上次执行", minWidth: 160, showOverflowTooltip: true },
  { prop: "lastStatus", label: "上次状态", width: 100, align: "center", slot: "lastStatus" },
  { prop: "action", label: "操作", width: 150, align: "center", fixed: "right", slot: "action" },
];

/** Actuator 只读定时任务 */
const scheduledTaskColumns: ReTableColumn[] = [
  { prop: "type", label: "类型", width: 120, align: "center" },
  { prop: "target", label: "任务", minWidth: 300, showOverflowTooltip: true },
  { prop: "expr", label: "表达式 / 间隔", minWidth: 160 },
  { prop: "next", label: "下次执行", minWidth: 220, showOverflowTooltip: true },
  { prop: "lastStatus", label: "上次状态", width: 110, align: "center", slot: "lastStatus" },
];

/** 当前 Tab 过滤后的条数（用于角标/提示） */
const actCount = computed(() => {
  switch (actuatorTab.value) {
    case "health": return healthNodes.value.length;
    case "env": return envSources.value.reduce((s, x) => s + x.props.length, 0);
    case "loggers": return loggerRows.value.length;
    case "mappings": return mappingRows.value.length;
    case "beans": return beanRows.value.length;
    case "conditions": return conditionRows.value.length;
    case "threaddump": return threadRows.value.length;
    case "configprops": return configRows.value.length;
    case "scheduledtasks": return scheduledRows.value.length;
    case "metrics": return metricNames.value.length;
    case "info": return Object.keys(actuatorData.value ?? {}).length;
    default: return 0;
  }
});

interface KpiCard extends ReStatsCardItem {
  label: string; value: string; unit: string; pct: number; level: Level;
  color: string; ring: boolean; sub: string; icon: Component; target: DetailTab | "jvm" | "cpu" | null;
  ringPercent?: number; ringColor?: string;
}
const kpiCards = computed<KpiCard[]>(() => [
  {
    key: "status", label: "运行状态", title: "运行状态", value: "运行中", unit: "", pct: 100, level: "ok",
    color: colors.success, ring: false, valueColor: colors.success,
    sub: `系统运行 ${fmtUptime(info.value.systemUptime)} · ${hostname.value}`,
    desc: `系统运行 ${fmtUptime(info.value.systemUptime)} · ${hostname.value}`,
    icon: markRaw(CircleCheckFilled), iconColor: colors.success, target: null,
  },
  {
    key: "cpu", label: "CPU 使用率", title: "CPU 使用率", value: String(cpuPct.value), unit: "%", pct: cpuPct.value, level: lvl(cpuPct.value),
    color: colors.primary, ring: false, valueColor: colors.primary,
    sub: `${lvlLabel(cpuPct.value)} · 用户 ${r1(info.value.cpu?.userPercent ?? 0)}% · ${logicalCores.value} 核 · 负载 ${loadAvg.value.toFixed(2)}`,
    desc: `${lvlLabel(cpuPct.value)} · 用户 ${r1(info.value.cpu?.userPercent ?? 0)}% · ${logicalCores.value} 核 · 负载 ${loadAvg.value.toFixed(2)}`,
    icon: markRaw(Cpu), iconColor: colors.primary, target: "cpu",
    ringPercent: cpuPct.value, ringColor: barColor(cpuPct.value),
  },
  {
    key: "sysmem", label: "系统内存", title: "系统内存", value: String(sysMemPct.value), unit: "%", pct: sysMemPct.value, level: lvl(sysMemPct.value),
    color: colors.primary, ring: false, valueColor: colors.primary,
    sub: `${formatBytes(info.value.systemMemory?.used)} / ${formatBytes(info.value.systemMemory?.total)}`,
    desc: `${formatBytes(info.value.systemMemory?.used)} / ${formatBytes(info.value.systemMemory?.total)}`,
    icon: markRaw(DataBoard), iconColor: colors.primary, target: "system",
    ringPercent: sysMemPct.value, ringColor: barColor(sysMemPct.value),
  },
  {
    key: "jvm", label: "JVM 内存", title: "JVM 内存", value: String(jvmMemPct.value), unit: "%", pct: jvmMemPct.value, level: lvl(jvmMemPct.value),
    color: colors.info, ring: false, valueColor: colors.info,
    sub: `已用 ${memCells(info.value.jvmMemory).used} · 空闲 ${memCells(info.value.jvmMemory).free} · 总量 ${memCells(info.value.jvmMemory).total}`,
    desc: `已用 ${memCells(info.value.jvmMemory).used} · 空闲 ${memCells(info.value.jvmMemory).free} · 总量 ${memCells(info.value.jvmMemory).total}`,
    icon: markRaw(Coffee), iconColor: colors.info, target: "jvm",
    ringPercent: jvmMemPct.value, ringColor: barColor(jvmMemPct.value),
  },
  {
    key: "disk", label: "磁盘使用率", title: "磁盘使用率", value: String(diskPct.value), unit: "%", pct: diskPct.value, level: lvl(diskPct.value),
    color: colors.warning, ring: false, valueColor: barColor(diskPct.value),
    sub: `剩余 ${formatBytes(diskFreeBytes.value)} / ${formatBytes(diskTotalBytes.value)}`,
    desc: `剩余 ${formatBytes(diskFreeBytes.value)} / ${formatBytes(diskTotalBytes.value)}`,
    icon: markRaw(FolderOpened), iconColor: colors.warning, target: "disk",
    ringPercent: diskPct.value, ringColor: barColor(diskPct.value),
  },
  {
    key: "proc", label: "进程 / 线程", title: "进程 / 线程", value: String(info.value.processCount ?? 0), unit: "", pct: 0, level: "ok",
    color: colors.success, ring: false, valueColor: colors.success,
    sub: `线程 ${info.value.threadCount ?? 0} · 死锁 ${info.value.deadlockedThreadCount ?? 0} · 类 ${info.value.loadedClassCount ?? 0}`,
    desc: `线程 ${info.value.threadCount ?? 0} · 死锁 ${info.value.deadlockedThreadCount ?? 0} · 类 ${info.value.loadedClassCount ?? 0}`,
    icon: markRaw(Files), iconColor: colors.success, target: "system",
  },
]);
const poolUsage = (p: { used?: number; max?: number }) => { const m = p.max ?? 0; return m <= 0 ? 0 : Math.min(100, r1((p.used ?? 0) / m * 100)); };
const memCells = (m?: ServerMemory) => ({
  total: formatBytes(m?.total),
  used: formatBytes(m?.used),
  free: formatBytes(m?.free),
  max: formatBytes(m?.max),
});
const coreBlocks = computed(() => (info.value.coreUsages ?? []).map((v) => ({ pct: r1(v), level: lvl(r1(v)) })));
const topThreadColumns = [
  { prop: "name", label: "线程名称", minWidth: 200, showOverflowTooltip: true },
  { prop: "state", label: "状态", width: 120, align: "center" as const },
  { prop: "cpuTime", label: "CPU时间(ms)", width: 140, align: "center" as const },
  { prop: "userTime", label: "用户时间(ms)", width: 140, align: "center" as const },
];

function openDetailDialog(tab: DetailTab) {
  detailTab.value = tab;
  detailDialogVisible.value = true;
}
function onKpiClick(card: KpiCard | ReStatsCardItem, _index?: number) {
  const target = (card as KpiCard).target;
  if (!target) return;
  if (target === "jvm") { jvmDialogVisible.value = true; return; }
  if (target === "cpu") { cpuDialogVisible.value = true; return; }
  openDetailDialog(target);
}

/* ============ ECharts ============ */
type Opt = Record<string, unknown>;

type MemoryPoolTone = "success" | "primary" | "warning" | "danger";

interface MemoryPoolView {
  key: string;
  name: string;
  used: number;
  max: number;
  usage: number;
  tone: MemoryPoolTone;
  weight: number;
}

interface MemoryPoolGroup {
  key: "heap" | "non-heap";
  label: string;
  pools: MemoryPoolView[];
}

/** 将 JVM/JMX 名称转换为与监控大盘一致的紧凑名称。 */
function memoryPoolName(name?: string): string {
  const value = name?.trim() || "未命名内存池";
  if (/eden\s*space/i.test(value)) return "G1 Eden Space";
  if (/survivor\s*space/i.test(value)) return "G1 Survivor Space";
  if (/old\s*gen|tenured/i.test(value)) return "G1 Old Gen";
  return value.replace(/^PS\s+/i, "");
}

function memoryPoolTone(name: string, usage: number): MemoryPoolTone {
  if (usage >= 85) return "danger";
  if (usage >= 60) return "warning";
  if (/code\s*cache/i.test(name)) return "primary";
  return "success";
}

function toMemoryPoolView(pool: MemoryPoolInfo, index: number): MemoryPoolView {
  const used = Math.max(0, pool.used ?? 0);
  const max = Math.max(0, pool.max ?? pool.committed ?? pool.used ?? 0);
  const usage = max > 0 ? r1(Math.min(100, (used / max) * 100)) : 0;
  const name = memoryPoolName(pool.name);
  return {
    key: `${name}-${index}`,
    name,
    used,
    max,
    usage,
    tone: memoryPoolTone(name, usage),
    weight: Math.max(1, used),
  };
}

/** UI 图式双栏内存池：面积（flex 权重）跟随实际 used 字节数。 */
const memoryPoolGroups = computed<MemoryPoolGroup[]>(() => {
  const source = info.value.memoryPools ?? [];
  const heapSource = source.filter((pool) => String(pool.type ?? "").toLowerCase() === "heap");
  const nonHeapSource = source.filter((pool) => String(pool.type ?? "").toLowerCase() !== "heap");

  if (!heapSource.length && info.value.jvmMemory?.used) {
    heapSource.push({
      name: "Heap Used",
      type: "heap",
      used: info.value.jvmMemory.used,
      max: info.value.jvmMemory.max,
      committed: info.value.jvmMemory.total,
    });
  }

  const buildGroup = (
    key: MemoryPoolGroup["key"],
    label: string,
    pools: MemoryPoolInfo[],
  ): MemoryPoolGroup => {
    const views = pools.map(toMemoryPoolView);
    const maxUsed = Math.max(1, ...views.map((pool) => pool.used));
    views.forEach((pool) => {
      pool.weight = Math.max(1, pool.used / maxUsed);
    });
    return { key, label, pools: views };
  };

  return [
    buildGroup("heap", "Heap", heapSource),
    buildGroup("non-heap", "Non-Heap", nonHeapSource),
  ];
});

function mainTrendOpt(data: number[], color: string, label: string, unit: string, max?: number): Opt {
  const m = max ?? Math.max(100, ...data) * 1.15;
  return {
    grid: { left: 8, right: 16, top: 20, bottom: 8, containLabel: true },
    xAxis: {
      type: "category", data: timeLabels.value, boundaryGap: false,
      axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: (v: string) => v.slice(0, 5) },
      axisLine: { lineStyle: { color: colors.borderLight } }, axisTick: { show: false },
    },
    yAxis: {
      type: "value", min: 0, max: unit === "%" ? 100 : undefined,
      splitLine: { lineStyle: { color: colors.borderLight, type: "dashed" } },
      axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: `{value}${unit}` },
    },
    tooltip: {
      trigger: "axis",
      formatter: (p: unknown) => {
        const a = p as Array<{ dataIndex: number; value: number }>;
        return `${timeLabels.value[a[0].dataIndex] || ""}<br/>${label}: <b>${a[0].value}${unit}</b>`;
      },
    },
    legend: { data: [label], top: 0, right: 0, textStyle: { color: colors.textSecondary, fontSize: 11 }, itemWidth: 12, itemHeight: 6 },
    series: [{
      name: label, type: "line", data, smooth: true, symbol: "none",
      lineStyle: { width: 2.5, color },
      areaStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: withAlpha(color, 0.28) },
            { offset: 1, color: withAlpha(color, 0.02) },
          ],
        },
      },
    }],
    ...(unit === "%" ? {} : { yAxis: { min: 0, max: m, splitLine: { lineStyle: { color: colors.borderLight, type: "dashed" } }, axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: `{value}${unit}` } } }),
  } as Opt;
}

/** 原型双线：已用 + 参考（堆内存 实/虚） */
function dualTrendOpt(primary: number[], secondary: number[], c1: string, c2: string, label1: string, label2: string, unit: string): Opt {
  const m = Math.max(1, ...primary, ...secondary) * 1.2;
  return {
    grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
    xAxis: {
      type: "category", data: timeLabels.value, boundaryGap: false,
      axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: (v: string) => v.slice(0, 5) },
      axisLine: { lineStyle: { color: colors.borderLight } }, axisTick: { show: false },
    },
    yAxis: {
      type: "value", min: 0,
      splitLine: { lineStyle: { color: colors.borderLight, type: "dashed" } },
      axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: (v: number) => `${v}${unit}` },
    },
    legend: { data: [label1, label2], top: 0, right: 0, textStyle: { color: colors.textSecondary, fontSize: 11 }, itemWidth: 12, itemHeight: 6 },
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: number) => `${v}${unit}`,
    },
    series: [
      {
        name: label1, type: "line", data: primary, smooth: true, symbol: "none",
        lineStyle: { width: 2.5, color: c1 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: withAlpha(c1, 0.25) }, { offset: 1, color: withAlpha(c1, 0.02) }] } },
      },
      {
        name: label2, type: "line", data: secondary, smooth: true, symbol: "none",
        lineStyle: { width: 1.5, color: c2, type: "dashed" },
      },
    ],
  } as Opt;
}

/** RESTful：请求数 / QPS / Top 接口排行（按 restfulMode 切换） */
function restfulTrendChartOpt(): Opt {
  if (restfulMode.value === "top") {
    const top = restfulTopUrls.value.slice(0, 8).slice().reverse();
    const maxCount = Math.max(1, ...top.map((u) => u.count ?? 0));
    return {
      grid: { left: 8, right: 56, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: "value", min: 0, max: maxCount,
        splitLine: { lineStyle: { color: colors.borderLight, type: "dashed" } },
        axisLabel: { color: colors.textSecondary, fontSize: 10 },
      },
      yAxis: {
        type: "category",
        data: top.map((u) => `${u.method || "GET"} ${shortUrl(u.url)}`),
        axisLabel: { color: colors.textSecondary, fontSize: 10, width: 140, overflow: "truncate" },
        axisLine: { lineStyle: { color: colors.borderLight } },
        axisTick: { show: false },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (p: unknown) => {
          const arr = Array.isArray(p) ? p : [p];
          const i = arr[0]?.dataIndex ?? 0;
          const u = top[i];
          if (!u) return "";
          // 平均延迟是真耗时，格式与全站其它耗时列同源（ReTime 的 formatDuration）
          return `${u.method} ${u.url}<br/>次数 <b>${u.count ?? 0}</b> · 成功 ${u.success ?? 0} · 失败 ${u.fail ?? 0}<br/>平均 ${formatDuration(costMs(u.avgMs) ?? 0)}`;
        },
      },
      series: [{
        name: "请求次数", type: "bar", data: top.map((u) => u.count ?? 0),
        barMaxWidth: 14,
        itemStyle: { color: colors.primary, borderRadius: [0, 3, 3, 0] },
        label: { show: true, position: "right", fontSize: 10, color: colors.textSecondary },
      }],
    } as Opt;
  }
  if (restfulMode.value === "ip") {
    const regions = restfulIpTrendRegions.value;
    const palette = [colors.primary, colors.success, colors.warning, colors.danger, colors.info];
    const labels = restfulTrendLabels.value;
    return {
      grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
      legend: {
        data: regions.map((r) => r.ip), top: 0, right: 0,
        textStyle: { color: colors.textSecondary, fontSize: 10 }, itemWidth: 10, itemHeight: 6,
      },
      xAxis: {
        type: "category", data: labels, boundaryGap: true,
        axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: (v: string) => v.slice(0, 8) },
        axisLine: { lineStyle: { color: colors.borderLight } }, axisTick: { show: false },
      },
      yAxis: {
        type: "value", min: 0, minInterval: 1,
        splitLine: { lineStyle: { color: colors.borderLight, type: "dashed" } },
        axisLabel: { color: colors.textSecondary, fontSize: 10 },
      },
      tooltip: { trigger: "axis" },
      series: regions.map((r, i) => ({
        name: r.ip, type: "line", data: r.data, smooth: true, symbol: "none",
        lineStyle: { width: 2, color: palette[i % palette.length] },
      })),
    } as Opt;
  }
  const labels = restfulTrendLabels.value;
  const counts = restfulCountTrend.value;
  const qps = restfulQpsTrend.value;
  const isQps = restfulMode.value === "qps";
  const data = isQps ? qps : counts;
  const name = isQps ? "QPS" : "请求数";
  const color = isQps ? colors.warning : colors.primary;
  const maxVal = Math.max(isQps ? 2 : 10, ...data) * 1.2;
  return {
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
    legend: { data: [name], top: 0, right: 0, textStyle: { color: colors.textSecondary, fontSize: 11 }, itemWidth: 12, itemHeight: 6 },
    xAxis: {
      type: "category", data: labels, boundaryGap: true,
      axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: (v: string) => v.slice(0, 8) },
      axisLine: { lineStyle: { color: colors.borderLight } }, axisTick: { show: false },
    },
    yAxis: {
      type: "value", min: 0, max: maxVal,
      splitLine: { lineStyle: { color: colors.borderLight, type: "dashed" } },
      axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: isQps ? (v: number) => v.toFixed(1) : undefined },
    },
    tooltip: {
      trigger: "axis",
      formatter: (p: unknown) => {
        const arr = Array.isArray(p) ? p : [p];
        const i = arr[0]?.dataIndex ?? 0;
        if (isQps) return `${labels[i] || ""}<br/>QPS: <b>${qps[i] ?? 0}</b>`;
        return `${labels[i] || ""}<br/>请求数: <b>${counts[i] ?? 0}</b><br/>QPS: <b>${qps[i] ?? 0}</b>`;
      },
    },
    series: isQps
      ? [{
          name, type: "line", data, smooth: true, symbol: "none",
          lineStyle: { width: 2.5, color },
          areaStyle: {
            color: {
              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: withAlpha(color, 0.22) },
                { offset: 1, color: withAlpha(color, 0.02) },
              ],
            },
          },
        }]
      : [{
          name, type: "bar", data, yAxisIndex: 0,
          itemStyle: { color, borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 14,
        }],
  } as Opt;
}
const restfulChartOpt = computed<Opt>(() => restfulTrendChartOpt());

const mainChartOpt = computed<Opt>(() => {
  if (trendTab.value === "cpu") return mainTrendOpt(cpuTrend.value, colors.primary, "CPU", "%");
  if (trendTab.value === "sysmem") return mainTrendOpt(sysMemTrend.value, colors.success, "系统内存", "%");
  if (trendTab.value === "load") return mainTrendOpt(loadTrend.value, colors.warning, "负载", "");
  if (trendTab.value === "restful") return restfulChartOpt.value;
  // heap：已用% 与 空闲参考
  const freeLine = jvmMemTrend.value.map((v) => Math.max(0, 100 - v));
  return dualTrendOpt(jvmMemTrend.value, freeLine, colors.primary, colors.success, "堆已用", "空闲", "%");
});

function netFlowOpt(): Opt {
  const name = mainNetIfc.value?.name || "eth0";
  const rx = netRxTrend.value[name] ?? [];
  const tx = netTxTrend.value[name] ?? [];
  const m = Math.max(1, ...rx, ...tx);
  const mkLine = (data: number[], color: string, name: string) => ({
    name, type: "line" as const, data, smooth: true, symbol: "none",
    lineStyle: { width: 2, color },
    areaStyle: {
      color: {
        type: "linear", x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: withAlpha(color, 0.18) },
          { offset: 1, color: withAlpha(color, 0.01) },
        ],
      },
    },
  });
  return {
    grid: { left: 8, right: 12, top: 28, bottom: 8, containLabel: true },
    legend: { top: 0, right: 0, textStyle: { color: colors.textSecondary, fontSize: 11 }, itemWidth: 12, itemHeight: 6, itemGap: 12 },
    xAxis: {
      type: "category", data: timeLabels.value, boundaryGap: false,
      axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: (v: string) => v.slice(0, 5) },
      axisLine: { lineStyle: { color: colors.borderLight } }, axisTick: { show: false },
    },
    yAxis: {
      type: "value", min: 0, max: m * 1.2,
      splitLine: { lineStyle: { color: colors.borderLight, type: "dashed" } },
      axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: (v: number) => (v >= 1024 ? (v / 1024).toFixed(1) + "M" : Math.round(v) + "K") },
    },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtRate(v) },
    series: [mkLine(rx, colors.primary, "入站"), mkLine(tx, colors.warning, "出站")],
  } as Opt;
}
const netFlowChartOpt = computed<Opt>(() => netFlowOpt());

function netOpt(name: string): Opt {
  const rx = netRxTrend.value[name] ?? [], tx = netTxTrend.value[name] ?? [], m = Math.max(1, ...rx, ...tx);
  return {
    grid: { left: 2, right: 2, top: 18, bottom: 2, containLabel: false },
    legend: { top: 0, right: 0, textStyle: { color: colors.textSecondary, fontSize: 10 }, itemWidth: 10, itemHeight: 6, data: ["收", "发"] },
    xAxis: { type: "category", data: timeLabels.value, show: false, boundaryGap: false },
    yAxis: { type: "value", min: 0, max: m * 1.2, show: false },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtRate(v) },
    series: [
      { name: "收", type: "line", data: rx, smooth: true, symbol: "none", lineStyle: { width: 1.5, color: colors.primary }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: withAlpha(colors.primary, 0.22) }, { offset: 1, color: withAlpha(colors.primary, 0.01) }] } } },
      { name: "发", type: "line", data: tx, smooth: true, symbol: "none", lineStyle: { width: 1.5, color: colors.warning }, areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: withAlpha(colors.warning, 0.22) }, { offset: 1, color: withAlpha(colors.warning, 0.01) }] } } },
    ],
  } as Opt;
}
const mergedNetOpt = computed<Opt>(() => {
  const ifcs = displayNetIfcs.value;
  const allVals: number[] = [];
  const series = ifcs.flatMap((ifc) => {
    const key = ifc.name || "eth0";
    const rx = netRxTrend.value[key] ?? []; const tx = netTxTrend.value[key] ?? [];
    allVals.push(...rx, ...tx);
    const lbl = ifc.displayName || ifc.name || key;
    return [
      { name: `${lbl} 收`, type: "line" as const, data: rx, smooth: true, symbol: "none", lineStyle: { width: 1.5, color: colors.primary } },
      { name: `${lbl} 发`, type: "line" as const, data: tx, smooth: true, symbol: "none", lineStyle: { width: 1.5, color: colors.warning } },
    ];
  });
  const m = Math.max(1, ...allVals);
  return {
    grid: { left: 8, right: 12, top: 32, bottom: 8, containLabel: true },
    legend: { top: 0, right: 0, textStyle: { color: colors.textSecondary, fontSize: 10 }, itemWidth: 10, itemHeight: 6 },
    xAxis: { type: "category", data: timeLabels.value, boundaryGap: false, axisLabel: { color: colors.textSecondary, fontSize: 10, formatter: (v: string) => v.slice(0, 5) }, axisLine: { lineStyle: { color: colors.borderLight } }, axisTick: { show: false } },
    yAxis: { type: "value", min: 0, max: m * 1.2, splitLine: { lineStyle: { color: colors.borderLight, type: "dashed" } }, axisLabel: { color: colors.textSecondary, fontSize: 10 } },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => fmtRate(v) },
    series,
  } as Opt;
});

const threadStatesOpt = computed<Opt>(() => {
  const states = info.value.threadStates ?? {};
  const pal = [colors.primary, colors.success, colors.warning, colors.danger, colors.info];
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 0, top: "middle", textStyle: { color: colors.textSecondary, fontSize: 11 }, itemWidth: 8, itemHeight: 8, itemGap: 6 },
    series: [{
      type: "pie", radius: ["52%", "76%"], center: ["30%", "50%"], avoidLabelOverlap: true,
      itemStyle: { borderRadius: 5, borderColor: colors.bgColor, borderWidth: 2 }, label: { show: false },
      data: Object.entries(states).map(([name, value], i) => ({ name, value, itemStyle: { color: pal[i % pal.length] } })),
    }],
  } as Opt;
});

/* ============ JVM 弹窗：卡片折叠 ============ */
const jvmCollapsed = ref<Record<string, boolean>>({});
const toggleJvmCard = (key: string) => {
  jvmCollapsed.value = { ...jvmCollapsed.value, [key]: !jvmCollapsed.value[key] };
};
/** GC 汇总（次数 · 耗时） */
const gcSummary = computed(() => {
  const list = info.value.gcCollectors ?? [];
  const count = list.reduce((s, g) => s + (g.collectionCount ?? 0), 0);
  const time = list.reduce((s, g) => s + (g.collectionTime ?? 0), 0);
  // 累计 GC 耗时是真耗时，格式与全站其它耗时展示同源
  return `共 ${count} 次 · ${formatDuration(costMs(time) ?? 0)}`;
});

/* ============ CPU 弹窗（左概要 + 右每核实时趋势） ============ */
const cpuDialogTitle = computed(() => `CPU 使用率 · ${logicalCores.value} 核`);
const detailDialogTitle = computed(() => {
  const t = tabItems.find((x) => x.key === detailTab.value);
  return `详细信息 · ${t?.label ?? ""}`;
});
function coreGaugeOpt(pct: number, color: string): Opt {
  return {
    animation: false,
    series: [{
      type: "gauge", startAngle: 220, endAngle: -40, min: 0, max: 100, radius: "88%", center: ["50%", "55%"],
      progress: { show: true, width: 12, roundCap: true, itemStyle: { color } },
      axisLine: { lineStyle: { width: 12, color: [[1, colors.fill]] } },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, pointer: { show: false }, anchor: { show: false },
      detail: { valueAnimation: false, fontSize: 32, fontWeight: 700, offsetCenter: [0, "0%"], formatter: "{value}%", color: colors.textPrimary },
      data: [{ value: pct }],
    }],
  };
}
const selectedCoreGaugeOpt = computed<Opt>(() => coreGaugeOpt(cpuPct.value, barColor(cpuPct.value)));

function coreRowOpt(index: number): Opt {
  const data = coreTrends.value[index] ?? [];
  const c = data.length ? r1(data[data.length - 1]) : 0;
  const color = barColor(c);
  return {
    grid: { left: 2, right: 2, top: 4, bottom: 2, containLabel: false },
    xAxis: { type: "category", data: timeLabels.value, show: false, boundaryGap: false },
    yAxis: { type: "value", min: 0, max: 100, show: false },
    tooltip: {
      trigger: "axis",
      formatter: (p: unknown) => {
        const a = p as Array<{ dataIndex: number; value: number }>;
        return `Core ${index + 1}: <b>${a[0]?.value ?? 0}%</b><br/>${timeLabels.value[a[0]?.dataIndex ?? 0] || ""}`;
      },
    },
    series: [{
      name: `Core ${index}`, type: "line", data, smooth: true, symbol: "none",
      lineStyle: { width: 1.5, color },
      areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: withAlpha(color, 0.2) }, { offset: 1, color: withAlpha(color, 0.01) }] } },
    }],
  } as Opt;
}
</script>

<template>
  <div class="srv" :class="{ 'is-reduced': prefersReducedMotion }">
    <!-- ===== 页头（原型：标题 + 徽章/时间/刷新/全屏，不套 card） ===== -->
    <div class="srv-page__bar">
      <div class="srv-page__heading">
        <h1 class="srv-page__title">监控大屏</h1>
        <p class="srv-page__subtitle">{{ hostname }}<span v-if="osInfo !== '—'"> · {{ osInfo }}</span> · 实时采集 OSHI + JMX</p>
      </div>
      <div class="srv-page__actions">
        <span class="srv-badge srv-badge--env">{{ envLabel }}</span>
        <span class="srv-conn" :class="`srv-conn--${connStatus}`">
          <span class="srv-conn__dot" />{{ connLabel }}
        </span>
        <span class="srv-page__time">{{ updateTime || "--:--:--" }}</span>
        <span class="srv-badge">近{{ MAX_POINTS }}秒</span>
        <button class="srv-icon-btn" title="JVM 运行时" @click="jvmDialogVisible = true">
          <el-icon :size="16"><Coffee /></el-icon>
        </button>
        <button class="srv-icon-btn" title="Actuator 监控端点" @click="openActuator()">
          <el-icon :size="16"><Odometer /></el-icon>
        </button>
        <button class="srv-icon-btn" title="刷新" :disabled="loading" @click="loadInfo()">
          <el-icon :size="16" :class="{ 'is-spin': loading }"><Refresh /></el-icon>
        </button>
        <button class="srv-icon-btn" title="全屏" @click="toggleFullscreen">
          <el-icon :size="16"><FullScreen /></el-icon>
        </button>
        <!-- 编辑态才露出的第二个入口：退回进入编辑前的布局（改动即时落盘，这是唯一撤销口） -->
        <button
          v-if="layoutEditing"
          class="srv-primary-btn srv-primary-btn--ghost"
          title="恢复到进入编辑前的布局"
          @click="restoreLayout"
        >
          <el-icon :size="15"><RefreshLeft /></el-icon>
          恢复默认
        </button>
        <button
          class="srv-primary-btn"
          :class="{ 'srv-primary-btn--ghost': layoutEditing }"
          :title="layoutEditing ? '保存当前布局并退出编辑' : '页头以下整页都可拖动摆放、缩放大小'"
          @click="toggleCustomLayout"
        >
          <el-icon :size="15"><component :is="layoutEditing ? Select : Grid" /></el-icon>
          {{ layoutEditing ? "保存" : "自定义" }}
        </button>
        <button class="srv-primary-btn" @click="openDetailDialog('system')">系统详情</button>
      </div>
    </div>

    <!--
      ===== 页头以下整页就是一张网格 =====
      KPI / RESTful 趋势 / 内存池 / 磁盘&网络 / GC / 趋势 / 网络流量 / 磁盘分区 / 系统信息
      这些原生区块，和注册表里的外围卡片（Actuator / OTel / 自定义）住在同一张
      12 列网格里 —— 拖拽摆放、拖右下角缩放、增删都由 MonitorCardBoard 负责。

      原生区块的正文仍写在这里（#block 插槽）：它们直接吃本页的 SSE 实时数据与图表
      option，抽成组件要把几十个绑定重新接一遍，收益为零。
    -->
    <MonitorCardBoard ref="boardRef" class="srv-board">
      <template #block="{ card, editable }">
        <!-- ===== KPI 统计卡（ReStatsCard 数组直出 · 原型 6 列） ===== -->
        <section
          v-if="card.type === 'page:kpi'"
          class="srv-block srv-kpis"
          :class="{ 'is-editable': editable }"
        >
          <ReStatsCard
            :list="kpiCards"
            :columns="6"
            class="srv-kpis__grid"
            @item-click="onKpiClick"
          />
        </section>

        <!-- ===== RESTful 趋势 ===== -->
        <div
          v-else-if="card.type === 'page:restful'"
          class="srv-block srv-card srv-restful-panel"
          :class="{ 'is-editable': editable }"
        >
          <div class="srv-card__head">
            <h3 class="srv-card__title">RESTful 趋势</h3>
            <div class="srv-seg srv-seg--pill">
              <button class="srv-seg__btn" :class="{ 'is-active': restfulMode === 'count' }" @click="restfulMode = 'count'">常规请求</button>
              <button class="srv-seg__btn" :class="{ 'is-active': restfulMode === 'qps' }" @click="restfulMode = 'qps'">QPS</button>
              <button class="srv-seg__btn" :class="{ 'is-active': restfulMode === 'top' }" @click="restfulMode = 'top'">Top</button>
              <button class="srv-seg__btn" :class="{ 'is-active': restfulMode === 'ip' }" @click="restfulMode = 'ip'">IP</button>
            </div>
          </div>
          <div class="srv-restful-panel__body">
            <div class="srv-restful-kpis">
              <div class="srv-restful-kpi">
                <span>窗口请求</span>
                <b>{{ restfulSummary.windowCount ?? 0 }}</b>
              </div>
              <div class="srv-restful-kpi">
                <span>QPS</span>
                <b>{{ restfulQpsNow }}</b>
              </div>
              <div class="srv-restful-kpi">
                <span>成功 / 失败</span>
                <b>
                  <i :style="{ color: colors.success, fontStyle: 'normal' }">{{ restfulSummary.windowSuccess ?? 0 }}</i>
                  /
                  <i :style="{ color: colors.danger, fontStyle: 'normal' }">{{ restfulSummary.windowFail ?? 0 }}</i>
                </b>
              </div>
              <div class="srv-restful-kpi">
                <span>平均耗时</span>
                <b>{{ restfulSummary.windowAvgMs ?? 0 }}<small>ms</small></b>
              </div>
            </div>
            <ReEChart v-if="restfulHasData" :option="(restfulChartOpt as never)" height="180px" class="srv-restful-panel__chart" />
            <p v-else class="srv-empty-inline srv-restful-panel__empty">{{ restfulMode === 'top' ? '暂无 Top 数据（等待业务请求）' : restfulMode === 'ip' ? '暂无 IP 数据（等待业务请求）' : '采集中… 页面请求将写入旁路统计' }}</p>
            <div class="srv-restful-lists">
              <div class="srv-restful-top">
                <div class="srv-restful-top__head">
                  <span>Top 接口</span>
                  <small>按累计次数 · 共 {{ restfulSummary.total ?? 0 }}</small>
                </div>
                <div v-if="restfulTopUrls.length" class="srv-restful-top__list">
                  <div v-for="u in restfulTopUrls.slice(0, 6)" :key="u.key" class="srv-restful-top__row">
                    <span class="srv-restful-top__m" :class="`is-${(u.method || 'GET').toLowerCase()}`">{{ u.method }}</span>
                    <code class="srv-restful-top__u" :title="u.url">{{ u.url }}</code>
                    <b class="srv-restful-top__c">{{ u.count }}</b>
                    <small class="srv-restful-top__ms"><ReTime :value="costMs(u.avgMs)" format="duration" placeholder="—" /></small>
                    <el-tooltip
                      v-if="u.ips?.length"
                      placement="top"
                      :content="`来源 IP：${u.ips.map((i) => `${i.ip} ×${i.count}`).join('，')}`"
                    >
                      <span class="srv-restful-top__ip">{{ u.ips[0]?.ip }}<i v-if="u.ips.length > 1">+{{ u.ips.length - 1 }}</i></span>
                    </el-tooltip>
                  </div>
                </div>
                <p v-else class="srv-empty-inline">暂无请求（需登录后产生业务请求）</p>
              </div>
              <div class="srv-restful-top">
                <div class="srv-restful-top__head">
                  <span>IP 排行</span>
                  <small>按累计次数 · {{ restfulTopIps.length }} 个来源</small>
                </div>
                <div v-if="restfulTopIps.length" class="srv-restful-top__list">
                  <div v-for="(it, idx) in restfulTopIps.slice(0, 6)" :key="it.ip" class="srv-restful-top__row">
                    <span class="srv-restful-top__rank" :class="{ 'is-top': idx < 3 }">{{ idx + 1 }}</span>
                    <code class="srv-restful-top__u" :title="it.topUrl || ''">{{ it.ip }}</code>
                    <b class="srv-restful-top__c">{{ it.count }}</b>
                    <small class="srv-restful-top__ms"><ReTime :value="costMs(it.avgMs)" format="duration" placeholder="—" /></small>
                  </div>
                </div>
                <p v-else class="srv-empty-inline">暂无来源 IP 统计</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== JVM 内存池 ===== -->
        <div
          v-else-if="card.type === 'page:mem'"
          class="srv-block srv-card srv-mem-panel"
          :class="{ 'is-editable': editable }"
        >
          <div class="srv-mem-panel__head">
            <h3 class="srv-card__title">JVM 内存池</h3>
            <span class="srv-mem-panel__percent">{{ jvmMemPct }}%</span>
          </div>
          <div class="srv-mem-groups">
            <section v-for="group in memoryPoolGroups" :key="group.key" class="srv-mem-group">
              <h4>{{ group.label }}</h4>
              <div v-if="group.pools.length" class="srv-mem-group__list">
                <div
                  v-for="pool in group.pools"
                  :key="pool.key"
                  class="srv-mem-pool"
                  :class="`is-${pool.tone}`"
                  :style="{ flexGrow: pool.weight }"
                  :title="`${pool.name} · 已用 ${formatBytes(pool.used)} / 上限 ${formatBytes(pool.max)} · ${pool.usage}%`"
                >
                  <span>{{ pool.name }}</span>
                  <b>{{ formatBytes(pool.used) }}</b>
                </div>
              </div>
              <el-empty v-else description="暂无数据" :image-size="36" />
            </section>
          </div>
          <div class="srv-mem-quick">
            <div class="srv-mem-quick__item">
              <span>已用 / 总量</span>
              <b>{{ memCells(info.jvmMemory).used }} <small>/</small> {{ memCells(info.jvmMemory).total }}</b>
            </div>
            <div class="srv-mem-quick__item">
              <span>GC</span>
              <b>{{ gcTotalCount }} <small>次</small> · {{ (gcTotalTimeMs / 1000).toFixed(1) }}<small>s</small></b>
            </div>
          </div>
        </div>

        <!-- ===== 磁盘 & 网络（原右侧栏第一张） ===== -->
        <div
          v-else-if="card.type === 'page:disk-net'"
          class="srv-block srv-card srv-side__card"
          :class="{ 'is-editable': editable }"
        >
          <div class="srv-card__head">
            <h3 class="srv-card__title">磁盘 & 网络</h3>
            <button class="srv-chip" @click="openDetailDialog('disk')">分区</button>
          </div>
          <div class="srv-side__block">
            <div class="srv-side__label">
              <span>磁盘使用率</span>
              <b :style="{ color: barColor(diskPct) }">{{ diskPct }}%</b>
            </div>
            <div class="srv-cell-bar__track srv-side__bar">
              <div class="srv-cell-bar__fill" :style="{ width: Math.min(100, diskPct) + '%', background: barColor(diskPct) }" />
            </div>
            <p class="srv-side__hint">剩余 {{ formatBytes(diskFreeBytes) }} / {{ formatBytes(diskTotalBytes) }} · {{ info.diskPeak?.partitionCount ?? 0 }} 分区</p>
          </div>
          <div class="srv-side__block">
            <div class="srv-side__label">
              <span>网络IO · {{ mainNetIfc?.displayName || mainNetIfc?.name || '—' }}</span>
            </div>
            <div class="srv-side__net">
              <div class="srv-side__net-row">
                <span class="srv-side__net-k" :style="{ color: colors.primary }">入</span>
                <b>{{ toMbps(netRxNow) }}</b>
                <div class="srv-cell-bar__track"><div class="srv-cell-bar__fill" :style="{ width: Math.min(100, netRxNow / Math.max(1, ...((netRxTrend[mainNetIfc?.name || 'eth0'] ?? [1]).concat(netTxTrend[mainNetIfc?.name || 'eth0'] ?? [1])) ) * 100) + '%', background: colors.primary }" /></div>
              </div>
              <div class="srv-side__net-row">
                <span class="srv-side__net-k" :style="{ color: colors.warning }">出</span>
                <b>{{ toMbps(netTxNow) }}</b>
                <div class="srv-cell-bar__track"><div class="srv-cell-bar__fill" :style="{ width: Math.min(100, netTxNow / Math.max(1, ...((netRxTrend[mainNetIfc?.name || 'eth0'] ?? [1]).concat(netTxTrend[mainNetIfc?.name || 'eth0'] ?? [1])) ) * 100) + '%', background: colors.warning }" /></div>
              </div>
            </div>
            <button class="srv-chip srv-chip--block" @click="openDetailDialog('network')">接口详情</button>
          </div>
        </div>

        <!-- ===== GC 统计（原右侧栏第二张） ===== -->
        <div
          v-else-if="card.type === 'page:gc'"
          class="srv-block srv-card srv-side__card"
          :class="{ 'is-editable': editable }"
        >
          <div class="srv-card__head">
            <h3 class="srv-card__title">GC 统计</h3>
            <button class="srv-chip" @click="jvmDialogVisible = true">JVM</button>
          </div>
          <div class="srv-gc-stat">
            <div class="srv-gc-stat__row">
              <div class="srv-gc-stat__main">
                <span>GC 次数</span>
                <b>{{ gcTotalCount.toLocaleString() }}</b>
                <small>次</small>
              </div>
              <div class="srv-gc-stat__aside">
                <span>平均耗时</span>
                <b>{{ gcAvgMs }}</b>
                <small>ms</small>
              </div>
            </div>
            <div class="srv-gc-stat__row">
              <div class="srv-gc-stat__main">
                <span>累计耗时</span>
                <b>{{ (gcTotalTimeMs / 1000).toFixed(1) }}</b>
                <small>s</small>
              </div>
              <div class="srv-gc-stat__aside">
                <span>收集器</span>
                <b>{{ (info.gcCollectors ?? []).length }}</b>
                <small>个</small>
              </div>
            </div>
            <div class="srv-gc-list">
              <div v-for="g in info.gcCollectors ?? []" :key="g.name" class="srv-gc">
                <el-icon :size="13" class="srv-gc__i"><Coin /></el-icon>
                <span class="srv-gc__n">{{ g.name }}</span>
                <span class="srv-gc__s">{{ g.collectionCount ?? 0 }} 次 · {{ g.collectionTime ?? 0 }} ms</span>
              </div>
              <div v-if="!(info.gcCollectors ?? []).length" class="srv-empty-inline">无数据</div>
            </div>
          </div>
        </div>

        <!-- ===== 资源趋势 ===== -->
        <div
          v-else-if="card.type === 'page:trend'"
          class="srv-block srv-card srv-trend-card"
          :class="{ 'is-editable': editable }"
        >
          <div class="srv-card__head">
            <h3 class="srv-card__title">
              {{ trendTab === 'heap' ? 'JVM 堆内存趋势' : trendTab === 'cpu' ? 'CPU 使用率趋势' : trendTab === 'sysmem' ? '系统内存趋势' : trendTab === 'restful' ? 'RESTful 请求趋势' : '系统负载趋势' }}
            </h3>
            <div class="srv-seg">
              <button class="srv-seg__btn" :class="{ 'is-active': trendTab === 'restful' }" @click="trendTab = 'restful'">RESTful</button>
              <button class="srv-seg__btn" :class="{ 'is-active': trendTab === 'heap' }" @click="trendTab = 'heap'">堆内存</button>
              <button class="srv-seg__btn" :class="{ 'is-active': trendTab === 'cpu' }" @click="trendTab = 'cpu'">CPU</button>
              <button class="srv-seg__btn" :class="{ 'is-active': trendTab === 'sysmem' }" @click="trendTab = 'sysmem'">系统内存</button>
              <button class="srv-seg__btn" :class="{ 'is-active': trendTab === 'load' }" @click="trendTab = 'load'">负载</button>
            </div>
          </div>
          <ReEChart :option="(mainChartOpt as never)" height="calc(100% - 36px)" class="srv-card__chart" />
          <div class="srv-trend-card__foot">
            <span v-if="trendTab === 'restful'">窗口请求 {{ restfulSummary.windowCount ?? 0 }} · QPS {{ restfulQpsNow }} · 平均 {{ restfulSummary.windowAvgMs ?? 0 }}ms</span>
            <span v-else-if="trendTab === 'heap'">已用 {{ memCells(info.jvmMemory).used }} / 最大 {{ memCells(info.jvmMemory).max || memCells(info.jvmMemory).total }}</span>
            <span v-else-if="trendTab === 'cpu'">CPU {{ cpuPct }}% · 负载 {{ loadAvg.toFixed(2) }}</span>
            <span v-else-if="trendTab === 'sysmem'">系统内存 {{ sysMemPct }}% · {{ formatBytes(info.systemMemory?.used) }} / {{ formatBytes(info.systemMemory?.total) }}</span>
            <span v-else>负载 {{ loadAvg.toFixed(2) }} · 近 {{ MAX_POINTS }} 秒</span>
            <span>{{ trendTab === 'restful' ? '最近 60 秒 · 方案 A 旁路' : `最近 ${MAX_POINTS} 秒 · SSE 实时` }}</span>
          </div>
        </div>

        <!-- ===== 网络流量 ===== -->
        <div
          v-else-if="card.type === 'page:netflow'"
          class="srv-block srv-card srv-trend-card srv-trend-card--net"
          :class="{ 'is-editable': editable }"
        >
          <div class="srv-card__head">
            <h3 class="srv-card__title">网络流量</h3>
            <span class="srv-card__tag">{{ mainNetIfc?.displayName || mainNetIfc?.name || '—' }}</span>
          </div>
          <ReEChart :option="(netFlowChartOpt as never)" height="calc(100% - 36px)" class="srv-card__chart" />
        </div>

        <!-- ===== 磁盘分区 ===== -->
        <div
          v-else-if="card.type === 'page:disks'"
          class="srv-block srv-card srv-bottom__card"
          :class="{ 'is-editable': editable }"
        >
          <div class="srv-card__head">
            <h3 class="srv-card__title">磁盘分区</h3>
            <button class="srv-chip" @click="openDetailDialog('disk')">全部详情</button>
          </div>
          <div class="srv-disk-list">
            <div v-for="d in info.disks ?? []" :key="d.path" class="srv-disk-item">
              <span
                class="srv-disk-item__icon"
                :style="{ background: diskColor(d.usagePercent ?? 0) }"
              >
                <el-icon :size="22" color="var(--el-color-white)"><FolderOpened /></el-icon>
              </span>
              <div class="srv-disk-item__body">
                <div class="srv-disk-item__value">
                  {{ driveLabel(d.path) }}
                  <small>{{ r1(d.usagePercent ?? 0) }}%</small>
                </div>
                <div class="srv-disk-item__desc">
                  {{ d.fsType || "—" }} · {{ formatBytes(d.used) }} / {{ formatBytes(d.total) }} · 剩余 {{ formatBytes(d.free ?? d.available) }}
                </div>
                <div class="srv-disk-item__track">
                  <div
                    class="srv-disk-item__fill"
                    :style="{ width: Math.min(100, d.usagePercent ?? 0) + '%', background: diskColor(d.usagePercent ?? 0) }"
                  />
                </div>
              </div>
            </div>
            <el-empty v-if="!(info.disks ?? []).length" description="无磁盘数据" :image-size="48" />
          </div>
        </div>

        <!-- ===== 系统信息 + Spring 参数 ===== -->
        <div
          v-else-if="card.type === 'page:sysinfo'"
          class="srv-block srv-card srv-bottom__card"
          :class="{ 'is-editable': editable }"
        >
          <div class="srv-card__head">
            <h3 class="srv-card__title">系统信息</h3>
            <button class="srv-chip" @click="openDetailDialog('system')">更多</button>
          </div>
          <div class="srv-sys-quick">
            <div class="srv-sys-quick__row"><span>主机</span><b>{{ hostname }} · {{ info.server?.ip || '—' }}</b></div>
            <div class="srv-sys-quick__row"><span>运行</span><b>{{ fmtUptime(info.systemUptime) }} · 进程 {{ fmtUptime(info.processUptime) }}</b></div>
            <div class="srv-sys-quick__row"><span>线程</span><b>{{ info.threadCount ?? 0 }} / 峰 {{ info.peakThreadCount ?? 0 }} · 死锁 {{ info.deadlockedThreadCount ?? 0 }}</b></div>
            <div class="srv-sys-quick__row"><span>类加载</span><b>{{ info.loadedClassCount ?? 0 }} / {{ info.totalLoadedClassCount ?? 0 }}</b></div>
          </div>
          <div class="srv-spring-block">
            <div class="srv-spring-block__head">
              <el-icon :size="14"><DocumentCopy /></el-icon>
              <span>Spring 核心参数</span>
              <small>{{ springEntries.length }} 项</small>
            </div>
            <div v-if="springEntries.length" class="srv-spring-list">
              <div v-for="[k, v] in springEntries" :key="k" class="srv-spring-row">
                <code>{{ k }}</code>
                <span>{{ v }}</span>
              </div>
            </div>
            <div v-else class="srv-empty-inline">暂无 Spring 参数（后端重启后生效）</div>
          </div>
        </div>
      </template>
    </MonitorCardBoard>

    <!-- ===== 详情 ReDialog ===== -->
    <ReDialog v-model="detailDialogVisible" :title="detailDialogTitle" width="960px" top="10px"  :show-footer="false">
      <div class="srv-detail srv-detail--in-dialog">
        <div class="srv-card__head srv-detail__head">
          <div class="srv-tabs" role="tablist">
            <button
              v-for="t in tabItems"
              :key="t.key"
              class="srv-tabs__btn"
              :class="{ 'is-active': detailTab === t.key }"
              role="tab"
              :aria-selected="detailTab === t.key"
              @click="detailTab = t.key"
            >
              <el-icon :size="13"><component :is="t.icon" /></el-icon>
              {{ t.label }}
            </button>
          </div>
        </div>

        <div v-show="detailTab === 'disk'" class="srv-detail__panel">
          <div class="srv-disk-cards">
            <div v-for="d in info.disks ?? []" :key="d.path" class="srv-disk-card">
              <span class="srv-disk-card__drive">{{ driveLabel(d.path) }}</span>
              <span class="srv-disk-card__fs">{{ d.fsType || "—" }}</span>
              <div class="srv-disk-card__track">
                <div
                  class="srv-disk-card__fill"
                  :style="{ width: Math.min(100, d.usagePercent ?? 0) + '%', background: diskColor(d.usagePercent ?? 0) }"
                />
              </div>
              <div class="srv-disk-card__right">
                <div class="srv-disk-card__pct-row">
                  <span class="srv-disk-card__pct" :style="{ color: diskColor(d.usagePercent ?? 0) }">{{ r1(d.usagePercent ?? 0) }}%</span>
                  <span class="srv-disk-card__plus" :style="{ color: diskColor(d.usagePercent ?? 0) }">+</span>
                </div>
                <div class="srv-disk-card__nums">
                  {{ formatBytes(d.used) }} / {{ formatBytes(d.total) }} · 剩余 {{ formatBytes(d.free ?? d.available) }}
                </div>
              </div>
            </div>
            <el-empty v-if="!(info.disks ?? []).length" description="无磁盘数据" :image-size="48" />
          </div>
          <div class="srv-detail__foot">
            峰值 <b :style="{ color: barColor(diskPct) }">{{ diskPct }}%</b> · 剩余合计 {{ formatBytes(diskFreeBytes) }} / {{ formatBytes(diskTotalBytes) }}
            <span class="srv-detail__foot-right">系统内存 {{ memCells(info.systemMemory).used }} / {{ memCells(info.systemMemory).total }} · JVM {{ memCells(info.jvmMemory).used }} / {{ memCells(info.jvmMemory).max || memCells(info.jvmMemory).total }}</span>
          </div>
        </div>

        <div v-show="detailTab === 'network'" class="srv-detail__panel">
          <div class="srv-net-toolbar">
            <div class="srv-seg">
              <button class="srv-seg__btn" :class="{ 'is-active': !showAllNet }" @click="showAllNet = false">仅主网卡</button>
              <button class="srv-seg__btn" :class="{ 'is-active': showAllNet }" @click="showAllNet = true">全部 ({{ (info.networkInterfaces ?? []).length }})</button>
            </div>
            <div class="srv-seg">
              <button class="srv-seg__btn" :class="{ 'is-active': netLayout === 'split' }" @click="netLayout = 'split'">分行</button>
              <button class="srv-seg__btn" :class="{ 'is-active': netLayout === 'merged' }" @click="netLayout = 'merged'">合并</button>
            </div>
          </div>
          <template v-if="displayNetIfcs.length > 0">
            <div v-if="netLayout === 'merged'" class="srv-net-merged">
              <ReEChart :option="(mergedNetOpt as never)" height="220px" />
              <div class="srv-net-merged-stats">
                <div v-for="ifc in displayNetIfcs" :key="ifc.name" class="srv-net-mini">
                  <span class="srv-net-mini__name">{{ ifc.displayName || ifc.name }}</span>
                  <span>收 {{ formatBytes(ifc.bytesRecv) }}</span><span>发 {{ formatBytes(ifc.bytesSent) }}</span>
                </div>
              </div>
            </div>
            <table v-else class="srv-table">
              <thead>
                <tr>
                  <th>接口</th><th>速率</th><th class="col-chart">实时收发</th>
                  <th>累计接收</th><th>累计发送</th><th>丢包</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ifc in displayNetIfcs" :key="ifc.name">
                  <td class="col-name">
                    <span class="srv-ifc">
                      <b>{{ ifc.displayName || ifc.name }}</b>
                      <small>{{ (ifc.addresses ?? []).slice(0, 2).join(", ") || "—" }}</small>
                    </span>
                  </td>
                  <td>{{ ifc.speed ? (ifc.speed / 1e9).toFixed(1) + " Gbps" : "—" }}</td>
                  <td class="col-chart"><ReEChart :option="(netOpt(ifc.name || 'eth0') as never)" height="48px" /></td>
                  <td>{{ formatBytes(ifc.bytesRecv) }}<small class="srv-td-sub">包 {{ ifc.packetsRecv ?? 0 }}</small></td>
                  <td>{{ formatBytes(ifc.bytesSent) }}<small class="srv-td-sub">包 {{ ifc.packetsSent ?? 0 }}</small></td>
                  <td>
                    <span :style="{ color: ((ifc.dropRecv ?? 0) + (ifc.dropSent ?? 0)) > 0 ? colors.danger : colors.textSecondary }">
                      {{ ifc.dropRecv ?? 0 }} / {{ ifc.dropSent ?? 0 }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
          <el-empty v-else description="无网络接口" :image-size="48" />
        </div>

        <div v-show="detailTab === 'system'" class="srv-detail__panel">
          <div class="srv-sys-cols">
            <!-- 左列 -->
            <div class="srv-sys-col">
              <!-- 主机 -->
              <div class="srv-sys-card">
                <div class="srv-sys-card__head">
                  <el-icon :size="14"><Document /></el-icon><span>主机</span>
                  <button class="srv-sys-plus" title="展开" @click="openDetailDialog('system')">+</button>
                </div>
                <div class="srv-sys-rows">
                  <div class="srv-sys-row"><span>主机名</span><b>{{ hostname }}</b></div>
                  <div class="srv-sys-row"><span>操作系统</span><b>{{ osInfo }}</b></div>
                  <div class="srv-sys-row"><span>进程运行</span><b class="srv-sys-hl">{{ fmtUptime(info.processUptime) }}</b></div>
                  <div class="srv-sys-row"><span>进程 / 线程</span><b>{{ info.processCount ?? 0 }} / {{ info.threadCount ?? 0 }}<small class="srv-sys-soft">（峰 {{ info.peakThreadCount ?? 0 }}）</small></b></div>
                  <div class="srv-sys-row"><span>负载均值</span><b>{{ loadAvg.toFixed(2) }}</b></div>
                </div>
              </div>

              <!-- JVM 内存池 -->
              <div class="srv-sys-card">
                <div class="srv-sys-card__head">
                  <el-icon :size="14"><Coin /></el-icon><span>JVM 内存池（{{ (info.memoryPools ?? []).length }}）</span>
                  <button class="srv-sys-plus" title="展开" @click="openDetailDialog('system')">+</button>
                </div>
                <div class="srv-pool-list">
                  <div v-for="p in info.memoryPools ?? []" :key="p.name" class="srv-pool">
                    <span class="srv-pool__name">{{ p.name }}</span>
                    <div class="srv-pool__bar"><el-progress :percentage="poolUsage(p)" :color="barColor(poolUsage(p))" :stroke-width="10" :show-text="false" /></div>
                    <span class="srv-pool__size">{{ formatBytes(p.used) }}</span>
                  </div>
                  <el-empty v-if="!(info.memoryPools ?? []).length" description="无内存池" :image-size="40" />
                </div>
                <button class="srv-primary-btn srv-sys-btn" @click.stop="jvmDialogVisible = true">JVM 详情（GC / 线程）</button>
              </div>
            </div>

            <!-- 右列 -->
            <div class="srv-sys-col">
              <!-- 内存 -->
              <div class="srv-sys-card">
                <div class="srv-sys-card__head">
                  <el-icon :size="14"><DataBoard /></el-icon><span>内存</span>
                  <button class="srv-sys-plus" title="展开" @click="openDetailDialog('system')">+</button>
                </div>
                <div class="srv-sys-rows">
                  <div class="srv-sys-row"><span>系统总量</span><b class="srv-sys-hl">{{ memCells(info.systemMemory).total }}</b></div>
                  <div class="srv-sys-row"><span>系统已用</span><b>{{ memCells(info.systemMemory).used }}</b></div>
                  <div class="srv-sys-row"><span>JVM总量</span><b>{{ memCells(info.jvmMemory).total }}</b></div>
                  <div class="srv-sys-row"><span>JVM已用</span><b>{{ memCells(info.jvmMemory).used }}</b></div>
                  <div class="srv-sys-row"><span>JVM剩余</span><b>{{ memCells(info.jvmMemory).free }}</b></div>
                </div>
              </div>

              <!-- JVM -->
              <div class="srv-sys-card">
                <div class="srv-sys-card__head">
                  <el-icon :size="14"><Coffee /></el-icon><span>JVM</span>
                  <button class="srv-sys-plus" title="展开" @click="openDetailDialog('system')">+</button>
                </div>
                <div class="srv-sys-rows">
                  <div class="srv-sys-row"><span>版本</span><b>{{ info.jvm?.name ?? "—" }} {{ info.jvm?.version ?? "" }}</b></div>
                  <div class="srv-sys-row"><span>启动时间</span><b>{{ fmtTime(info.jvm?.startTime) }}</b></div>
                  <div class="srv-sys-row"><span>类加载</span><b>{{ info.loadedClassCount ?? 0 }}<small class="srv-sys-soft">（累 {{ info.totalLoadedClassCount ?? 0 }} · 卸 {{ info.unloadedClassCount ?? 0 }}）</small></b></div>
                  <div class="srv-sys-row"><span>死锁线程</span><b :style="{ color: (info.deadlockedThreadCount ?? 0) > 0 ? colors.danger : colors.success }">{{ info.deadlockedThreadCount ?? 0 }}</b></div>
                  <div class="srv-sys-row"><span>项目路径</span><b class="srv-sys-code">{{ info.jvm?.projectPath || "—" }}</b></div>
                </div>
              </div>

              <!-- Spring 核心参数 -->
              <div class="srv-sys-card">
                <div class="srv-sys-card__head">
                  <el-icon :size="14"><DocumentCopy /></el-icon><span>Spring 核心参数</span>
                  <button class="srv-sys-plus" title="展开" @click="openDetailDialog('system')">+</button>
                </div>
                <div v-if="springEntries.length" class="srv-spring-list">
                  <div v-for="[k, v] in springEntries" :key="k" class="srv-spring-row">
                    <code>{{ k }}</code>
                    <span>{{ v }}</span>
                  </div>
                </div>
                <div v-else class="srv-empty-inline">暂无 Spring 参数（后端需重启后生效）</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReDialog>

    <!-- ===== CPU 弹窗：左概要 + 右逻辑处理器实时趋势 ===== -->
    <ReDialog v-model="cpuDialogVisible" :title="cpuDialogTitle" width="960px" top="10px"  :show-footer="false">
      <div class="srv-cpu-dialog">
        <aside class="srv-cpu-dialog__side">
          <ReEChart :option="(selectedCoreGaugeOpt as never)" height="180px" />
          <div class="srv-cpu-brk">
            <div class="srv-hbar"><span>用户态</span><div class="srv-hbar__t"><div class="srv-hbar__f" :style="{ width: r1(info.cpu?.userPercent ?? 0) + '%', background: colors.primary }" /></div><b>{{ r1(info.cpu?.userPercent ?? 0) }}%</b></div>
            <div class="srv-hbar"><span>系统态</span><div class="srv-hbar__t"><div class="srv-hbar__f" :style="{ width: r1(info.cpu?.systemPercent ?? 0) + '%', background: colors.warning }" /></div><b>{{ r1(info.cpu?.systemPercent ?? 0) }}%</b></div>
            <div class="srv-hbar"><span>空闲</span><div class="srv-hbar__t"><div class="srv-hbar__f" :style="{ width: r1(info.cpu?.idlePercent ?? 0) + '%', background: colors.success }" /></div><b>{{ r1(info.cpu?.idlePercent ?? 0) }}%</b></div>
          </div>
          <div class="srv-cpu-meta">
            <div class="srv-cpu-meta__item"><b>{{ logicalCores }}</b><span>逻辑核心</span></div>
            <div class="srv-cpu-meta__item"><b>{{ cpuPct }}%</b><span>总使用率</span></div>
            <div class="srv-cpu-meta__item"><b>{{ loadAvg.toFixed(2) }}</b><span>负载均值</span></div>
          </div>
          <p class="srv-cpu-hint">右侧每核一行 · 最近 {{ MAX_POINTS }} 秒实时趋势</p>
        </aside>
        <section class="srv-cpu-dialog__cores">
          <div class="srv-core-rows-head">
            <span>逻辑处理器</span>
            <span>当前</span>
            <span>使用率</span>
            <span>实时趋势</span>
          </div>
          <div v-if="coreBlocks.length" class="srv-core-rows">
            <div v-for="(c, i) in coreBlocks" :key="i" class="srv-core-row">
              <div class="srv-core-row__name">
                <span class="srv-core-row__dot" :style="{ background: barColor(c.pct) }" />
                <b>CPU {{ i + 1 }}</b>
                <small :class="`is-${c.level}`">{{ lvlLabel(c.pct) }}</small>
              </div>
              <div class="srv-core-row__pct" :style="{ color: barColor(c.pct) }">{{ c.pct }}%</div>
              <div class="srv-core-row__bar">
                <div class="srv-cell-bar__track">
                  <div class="srv-cell-bar__fill" :style="{ width: Math.min(100, c.pct) + '%', background: barColor(c.pct) }" />
                </div>
              </div>
              <div class="srv-core-row__chart">
                <ReEChart :option="(coreRowOpt(i) as never)" height="40px" />
              </div>
            </div>
          </div>
          <el-empty v-else description="无核心数据" :image-size="48" />
        </section>
      </div>
    </ReDialog>

    <!-- ===== Actuator 监控端点（可视化） ===== -->
    <ReDialog v-model="actuatorDialogVisible" title="Actuator 监控端点" width="980px" top="10px"  :show-footer="false">
      <div class="act">
        <!-- 端点导航（胶囊分段） -->
        <ReTab
          v-model="actuatorTab"
          :tabs="actuatorTabs"
          variant="capsule"
          nav-only
          class="act__nav"
          @tab-change="(name: string) => loadActuator(name as ActuatorTab)"
        />

        <!-- 工具条 -->
        <div class="act__bar">
          <ReInput
            v-if="!['health', 'info', 'metrics', 'scheduledtasks'].includes(actuatorTab)"
            layout="modern"
            v-model="actKeyword"
            placeholder="过滤…"
            clearable
            class="act__search"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </ReInput>
          <span class="act__count">共 {{ actCount }} 项</span>
          <div class="act__bar-right">
            <ReButton layout="modern" icon="Refresh" :loading="actuatorLoading" @click="loadActuator()">刷新</ReButton>
          </div>
        </div>

        <!-- 内容 -->
        <div v-loading="actuatorLoading" class="act__body">
          <div v-if="actuatorError" class="act__empty is-error">{{ actuatorError }}</div>

          <!-- 健康状态 -->
          <template v-else-if="actuatorTab === 'health'">
            <div class="act-health__banner" :class="healthStatus === 'UP' ? 'is-up' : 'is-down'">
              <span class="act-health__dot" />
              <span class="act-health__label">整体状态</span>
              <b>{{ healthStatus }}</b>
            </div>
            <div class="act-health__grid">
              <div v-for="n in healthNodes" :key="n.name" class="act-health__card" :class="n.status === 'UP' ? 'is-up' : 'is-down'">
                <div class="act-health__card-head">
                  <span class="act-health__card-dot" />
                  <span class="act-health__card-name">{{ n.name }}</span>
                  <ReTag :type="n.status === 'UP' ? 'success' : 'danger'" effect="light" round >{{ n.status }}</ReTag>
                </div>
                <div v-if="n.details" class="act-health__card-detail">{{ n.details }}</div>
              </div>
              <el-empty v-if="!healthNodes.length" description="无健康组件" :image-size="48" />
            </div>
          </template>

          <!-- 应用信息 / 指标 -->
          <template v-else-if="actuatorTab === 'info'">
            <div v-if="Object.keys(actuatorData ?? {}).length" class="act-kv">
              <div v-for="e in toEntries(actuatorData)" :key="e.k" class="act-kv__row">
                <span class="act-kv__k">{{ e.k }}</span><span class="act-kv__v">{{ e.v }}</span>
              </div>
            </div>
            <el-empty v-else description="应用未暴露 info 信息" :image-size="48" />
          </template>
          <template v-else-if="actuatorTab === 'metrics'">
            <div class="act-metrics">
              <aside class="act-metrics__list">
                <ReInput
                  layout="modern"
                  v-model="metricKeyword"
                  placeholder="过滤指标名"
                  clearable
                  class="act-metrics__filter"
                />
                <div class="act-metrics__scroll">
                  <button
                    v-for="n in filteredMetricNames"
                    :key="n"
                    type="button"
                    class="act-metrics__item"
                    :class="{ 'is-active': n === metricName }"
                    @click="selectMetric(n)"
                  >{{ n }}</button>
                </div>
                <el-empty v-if="!filteredMetricNames.length" description="无可显示的指标" :image-size="40" />
              </aside>
              <section v-loading="metricDetailLoading" class="act-metrics__detail">
                <template v-if="metricDetail">
                  <div class="act-metrics__title">
                    {{ metricDetail.name }}
                    <span v-if="metricDetail.baseUnit" class="act-metrics__unit">{{ metricDetail.baseUnit }}</span>
                  </div>
                  <p v-if="metricDetail.description" class="act-metrics__desc">{{ metricDetail.description }}</p>
                  <div class="act-kv">
                    <div v-for="m in metricDetail.measurements ?? []" :key="m.statistic" class="act-kv__row">
                      <span class="act-kv__k">{{ m.statistic }}</span>
                      <span class="act-kv__v">{{ m.value }}</span>
                    </div>
                  </div>
                  <div v-if="metricDetail.availableTags?.length" class="act-metrics__tags">
                    <div class="act-group__title">可用标签</div>
                    <div class="act-kv">
                      <div v-for="t in metricDetail.availableTags" :key="t.tag" class="act-kv__row">
                        <span class="act-kv__k">{{ t.tag }}</span>
                        <span class="act-kv__v">{{ (t.values ?? []).join("、") || "—" }}</span>
                      </div>
                    </div>
                  </div>
                </template>
                <el-empty v-else description="选择左侧指标查看明细" :image-size="48" />
              </section>
            </div>
          </template>

          <!-- 环境属性 -->
          <template v-else-if="actuatorTab === 'env'">
            <div v-for="s in envSources" :key="s.name" class="act-group">
              <div class="act-group__title">{{ s.name }}<span class="act-group__count">{{ s.props.length }}</span></div>
              <div class="act-kv">
                <div v-for="p in s.props" :key="p.k" class="act-kv__row">
                  <span class="act-kv__k">{{ p.k }}</span><span class="act-kv__v">{{ p.v }}</span>
                </div>
              </div>
            </div>
            <el-empty v-if="!envSources.length" description="无匹配属性" :image-size="48" />
          </template>

          <!-- 日志级别（可编辑 + 前端分页） -->
          <!--
            表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM 与
            页面 :deep(.el-table…) 覆盖；pagination=false —— 分页仍由下方 el-pagination 自管；
            toolbar=false 不新增工具栏按钮；原 el-table 无 border → settings.border=false 显式抑制；
            height="400" 收进 layout-table；配置级别列有模板 → slot + #col-configured。
          -->
          <template v-else-if="actuatorTab === 'loggers'">
            <ReTable
              :data="pagedLoggerRows"
              :columns="loggerColumns"
              engine="element"
              :pagination="false"
              :toolbar="false"
              :settings="{ border: false }"
              :layout-table="{ height: 400 }"
              class="act-table"
            >
              <template #col-configured="{ row }">
                <el-select
                  :model-value="row.configured || 'INHERITED'"
                  :loading="actLevelSaving === row.name"
                  
                  style="width: 160px"
                  @change="(v: string) => changeLoggerLevelOfRow(row, v)"
                >
                  <el-option v-for="lv in loggerLevels" :key="lv" :label="lv === 'INHERITED' ? '继承(INHERITED)' : lv" :value="lv" />
                </el-select>
              </template>
            </ReTable>
            <div class="act__pager">
              <el-pagination
                v-model:current-page="loggerPage"
                v-model:page-size="loggerPageSize"
                :page-sizes="[20, 50, 100, 200]"
                :total="loggerRows.length"
                layout="total, sizes, prev, pager, next, jumper"
                
                background
              />
            </div>
          </template>

          <!-- 请求映射（原 el-table 无 border → settings.border=false；height=440 收进 layout-table；
               count/avgMs/ips 三列有模板 → slot） -->
          <template v-else-if="actuatorTab === 'mappings'">
            <ReTable
              :data="mappingRows"
              :columns="mappingColumns"
              engine="element"
              :pagination="false"
              :toolbar="false"
              :settings="{ border: false }"
              :layout-table="{ height: 440 }"
              class="act-table"
            >
              <template #col-count="{ row }">
                <span :class="{ 'act-muted': !row.count }">{{ row.count }}</span>
              </template>
              <template #col-avgMs="{ row }">
                <span :class="{ 'act-muted': !row.count }"><ReTime v-if="row.count" :value="costMs(row.avgMs)" format="duration" placeholder="-" /><template v-else>-</template></span>
              </template>
              <template #col-ips="{ row }">
                <span :class="{ 'act-muted': !row.ips }">{{ row.ips || "-" }}</span>
              </template>
            </ReTable>
          </template>

          <!-- Bean 列表（纯展示表：原 el-table 无 border → settings.border=false；height=440） -->
          <template v-else-if="actuatorTab === 'beans'">
            <ReTable
              :data="beanRows"
              :columns="beanColumns"
              engine="element"
              :pagination="false"
              :toolbar="false"
              :settings="{ border: false }"
              :layout-table="{ height: 440 }"
              class="act-table"
            />
          </template>

          <!-- 自动配置条件（结果列无 prop，用行字段 result 作合成 prop → slot） -->
          <template v-else-if="actuatorTab === 'conditions'">
            <ReTable
              :data="conditionRows"
              :columns="conditionColumns"
              engine="element"
              :pagination="false"
              :toolbar="false"
              :settings="{ border: false }"
              :layout-table="{ height: 440 }"
              class="act-table"
            >
              <template #col-result="{ row }">
                <ReTag :type="row.result === 'positive' ? 'success' : 'info'" effect="light" round >
                  {{ row.result === "positive" ? "命中" : "未命中" }}
                </ReTag>
              </template>
            </ReTable>
          </template>

          <!-- 线程快照（状态/守护/阻塞/等待 4 列有模板 → slot；模板里的字符串拼接走 script 收窄） -->
          <template v-else-if="actuatorTab === 'threaddump'">
            <ReTable
              :data="threadRows"
              :columns="threadColumns"
              engine="element"
              :pagination="false"
              :toolbar="false"
              :settings="{ border: false }"
              :layout-table="{ height: 440 }"
              class="act-table"
            >
              <template #col-state="{ row }">
                <ReTag :type="threadStateTypeOfRow(row)" effect="light" round >{{ row.state }}</ReTag>
              </template>
              <template #col-daemon="{ row }">{{ row.daemon ? "是" : "否" }}</template>
              <template #col-blockedCount="{ row }">{{ blockedText(row) }}</template>
              <template #col-waitedCount="{ row }">{{ waitedText(row) }}</template>
            </ReTable>
          </template>

          <!-- 配置属性（纯展示表：原 el-table 无 border → settings.border=false；height=440） -->
          <template v-else-if="actuatorTab === 'configprops'">
            <ReTable
              :data="configRows"
              :columns="configColumns"
              engine="element"
              :pagination="false"
              :toolbar="false"
              :settings="{ border: false }"
              :layout-table="{ height: 440 }"
              class="act-table"
            />
          </template>

          <!-- 定时任务（可编辑表 + 只读表） -->
          <template v-else-if="actuatorTab === 'scheduledtasks'">
            <div class="act-sched-managed">
              <div class="act-sched-managed__head">
                <span>可编辑任务（改 cron / 启停 / 立即执行）</span>
                <small v-if="managedLoading">加载中…</small>
                <small v-else-if="managedError" class="is-error">{{ managedError }}</small>
                <small v-else>共 {{ managedTasks.length }} 个</small>
              </div>
              <!-- 表格统一 ReTable：原 el-table 无 border → settings.border=false；
                   :show-header="true" 收进 layout-table；cron/启用/上次状态/操作 4 列有模板 → slot -->
              <ReTable
                :data="managedTasks"
                :columns="managedTaskColumns"
                engine="element"
                :pagination="false"
                :toolbar="false"
                :settings="{ border: false }"
                :layout-table="{ showHeader: true, minHeight: 0 }"
                class="act-table"
              >
                <template #col-cron="{ row }">
                  <ReInput
                    v-model="row.cron"
                    
                    placeholder="如 0 * * * * ?"
                    :disabled="managedSaving === row.key"
                    @keyup.enter="saveManagedCron(managedTaskOf(row))"
                  />
                </template>
                <template #col-enabled="{ row }">
                  <el-switch
                    :model-value="!!row.enabled"
                    
                    :loading="managedSaving === row.key"
                    @change="(v: boolean | string | number) => toggleManagedTask(managedTaskOf(row), !!v)"
                  />
                </template>
                <template #col-lastStatus="{ row }">
                  <ReTag
                    :type="String(row.lastStatus || '').startsWith('FAILED') ? 'danger' : row.lastStatus === 'SUCCESS' ? 'success' : 'info'"
                    effect="light"
                    round
                    
                  >
                    {{ row.lastStatus || "-" }}
                  </ReTag>
                </template>
                <template #col-action="{ row }">
                  <el-button link type="primary"  :disabled="managedSaving === row.key" @click="saveManagedCron(managedTaskOf(row))">保存</el-button>
                  <el-button link type="warning"  :disabled="managedSaving === row.key" @click="runManagedTask(managedTaskOf(row))">执行一次</el-button>
                </template>
              </ReTable>
            </div>
            <div class="act-sched-managed__head">
              <span>Actuator 只读任务（Spring 托管）</span>
              <small>共 {{ scheduledRows.length }} 个</small>
            </div>
            <!-- 只读任务表：原 el-table 无 border → settings.border=false；max-height=260 收进 layout-table；
                 上次状态列有模板 → slot -->
            <ReTable
              :data="scheduledRows"
              :columns="scheduledTaskColumns"
              engine="element"
              :pagination="false"
              :toolbar="false"
              :settings="{ border: false }"
              :layout-table="{ maxHeight: 260 }"
              class="act-table"
            >
              <template #col-lastStatus="{ row }">
                <ReTag :type="row.lastStatus === 'SUCCESS' ? 'success' : 'info'" effect="light" round >
                  {{ row.lastStatus }}
                </ReTag>
              </template>
            </ReTable>
          </template>

          <el-empty v-else-if="!actuatorLoading" description="无数据" :image-size="48" />
        </div>

        <p class="act__hint">Base: /actuator · {{ actuatorTabs.length }} 个端点</p>
      </div>
    </ReDialog>

    <!-- ===== JVM ReDialog ===== -->
    <ReDialog v-model="jvmDialogVisible" title="JVM 运行时" width="1200px" top="10px" :show-footer="false">
      <div class="srv-jvm2">
        <!-- 顶部信息胶囊 -->
        <div class="srv-jvm2__chips">
          <div class="srv-jvm2__chip srv-jvm2__chip--wide">
            <span class="srv-jvm2__chip-label">JVM:</span>
            <span class="srv-jvm2__chip-value">{{ info.jvm?.name ?? "—" }} {{ info.jvm?.version ?? "" }}</span>
          </div>
          <div class="srv-jvm2__chip">
            <span class="srv-jvm2__chip-value">{{ fmtTime(info.jvm?.startTime) }}</span>
          </div>
          <div class="srv-jvm2__chip">
            <span class="srv-jvm2__chip-label">运行</span>
            <span class="srv-jvm2__chip-value">{{ fmtUptime(info.processUptime) }}</span>
          </div>
          <div class="srv-jvm2__chip">
            <span class="srv-jvm2__chip-label">死锁</span>
            <span
              class="srv-jvm2__deadlock"
              :class="{ 'is-danger': (info.deadlockedThreadCount ?? 0) > 0 }"
            >
              {{ info.deadlockedThreadCount ?? 0 }}
            </span>
          </div>
        </div>

        <!-- 三张卡片 -->
        <div class="srv-jvm2__cards">
          <!-- GC 收集器 -->
          <div class="srv-jvm2__card">
            <div class="srv-jvm2__head">
              <span class="srv-jvm2__title">GC 收集器</span>
              <span class="srv-jvm2__extra">· {{ gcSummary }}</span>
            </div>
            <div class="srv-jvm2__gc-list">
              <div v-for="g in info.gcCollectors ?? []" :key="g.name" class="srv-jvm2__gc">
                <span class="srv-jvm2__gc-icon"><el-icon :size="14"><Coin /></el-icon></span>
                <span class="srv-jvm2__gc-name">{{ g.name }}</span>
                <span class="srv-jvm2__gc-stat">{{ g.collectionCount ?? 0 }} · {{ g.collectionTime ?? 0 }}ms</span>
              </div>
              <div v-if="!(info.gcCollectors ?? []).length" class="srv-empty-inline">无数据</div>
            </div>
          </div>

          <!-- 类加载 -->
          <div class="srv-jvm2__card">
            <div class="srv-jvm2__head">
              <span class="srv-jvm2__title">类加载</span>
              <button class="srv-jvm2__toggle" :class="{ 'is-collapsed': jvmCollapsed.classes }" @click="toggleJvmCard('classes')">
                <el-icon><ArrowDown /></el-icon>
              </button>
            </div>
            <div v-show="!jvmCollapsed.classes" class="srv-jvm2__class">
              <div class="srv-jvm2__class-item"><b>{{ info.loadedClassCount ?? 0 }}</b><span>已加载</span></div>
              <div class="srv-jvm2__class-divider" />
              <div class="srv-jvm2__class-item"><b>{{ info.totalLoadedClassCount ?? 0 }}</b><span>累计</span></div>
              <div class="srv-jvm2__class-divider" />
              <div class="srv-jvm2__class-item"><b>{{ info.unloadedClassCount ?? 0 }}</b><span>已卸载</span></div>
            </div>
          </div>

          <!-- 线程状态 -->
          <div class="srv-jvm2__card">
            <div class="srv-jvm2__head">
              <span class="srv-jvm2__title">线程状态</span>
              <button class="srv-jvm2__toggle" :class="{ 'is-collapsed': jvmCollapsed.threads }" @click="toggleJvmCard('threads')">
                <el-icon><ArrowDown /></el-icon>
              </button>
            </div>
            <div v-show="!jvmCollapsed.threads">
              <ReEChart v-if="Object.keys(info.threadStates ?? {}).length > 0" :option="(threadStatesOpt as never)" height="170px" />
              <el-empty v-else description="无数据" :image-size="40" />
            </div>
          </div>
        </div>

        <!-- Top CPU 线程 -->
        <div class="srv-jvm2__card srv-jvm2__card--table">
          <div class="srv-jvm2__head">
            <span class="srv-jvm2__title">Top CPU 线程</span>
            <button class="srv-jvm2__toggle" :class="{ 'is-collapsed': jvmCollapsed.top }" @click="toggleJvmCard('top')">
              <el-icon><ArrowDown /></el-icon>
            </button>
          </div>
          <div v-show="!jvmCollapsed.top">
            <ReTable :data="(info.topThreads ?? []) as unknown as Record<string, unknown>[]" :columns="topThreadColumns" :pagination="false" :layout-table="{ minHeight: 0 }" row-key="name" />
          </div>
        </div>

        <!-- 路径 -->
        <div class="srv-jvm2__card srv-jvm2__paths">
          <div class="srv-path"><span class="srv-path__label">Java 路径</span><code class="srv-path__code">{{ info.jvm?.javaHome || "—" }}</code><button class="srv-icon-btn" title="复制" @click="copyText(info.jvm?.javaHome)"><el-icon :size="14"><DocumentCopy /></el-icon></button></div>
          <div class="srv-path"><span class="srv-path__label">项目路径</span><code class="srv-path__code">{{ info.jvm?.projectPath || "—" }}</code><button class="srv-icon-btn" title="复制" @click="copyText(info.jvm?.projectPath)"><el-icon :size="14"><DocumentCopy /></el-icon></button></div>
          <div class="srv-path srv-path--col"><span class="srv-path__label">运行参数</span><pre class="srv-path__pre">{{ (info.jvm?.inputArgs ?? []).join(" ") || "—" }}</pre><button class="srv-icon-btn" title="复制" @click="copyText((info.jvm?.inputArgs ?? []).join(' '))"><el-icon :size="14"><DocumentCopy /></el-icon></button></div>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.srv {
  --srv-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: auto;
  padding: 4px 2px 16px;
  box-sizing: border-box;
}

/* ===== 页头（对齐 Redis 监控：紧凑信息卡） ===== */
.srv-page__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 16px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}
.srv-page__heading { min-width: 0; flex: 1 1 auto; }
.srv-page__actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }
.srv-page__title { margin: 0; font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); line-height: 1.3; }
.srv-page__subtitle { margin: 2px 0 0; font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.4; }
.srv-page__time { font-size: 12px; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }

.srv-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  border: 1px solid var(--el-border-color-lighter);
}
.srv-badge--env {
  background: var(--el-color-success);
  border-color: var(--el-color-success);
  color: #fff;
}

.srv-conn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.srv-conn__dot { width: 7px; height: 7px; border-radius: 50%; }
.srv-conn--live { color: var(--el-color-success); border-color: var(--el-color-success-light-7); background: var(--el-color-success-light-9); }
.srv-conn--live .srv-conn__dot { background: var(--el-color-success); animation: srv-pulse 2s infinite; }
.srv-conn--connecting { color: var(--el-color-warning); border-color: var(--el-color-warning-light-7); background: var(--el-color-warning-light-9); }
.srv-conn--connecting .srv-conn__dot { background: var(--el-color-warning); animation: srv-pulse 1s infinite; }
.srv-conn--disconnected { color: var(--el-color-danger); border-color: var(--el-color-danger-light-7); background: var(--el-color-danger-light-9); }
.srv-conn--disconnected .srv-conn__dot { background: var(--el-color-danger); }
@keyframes srv-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.srv-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.srv-icon-btn:hover:not(:disabled) { color: var(--el-color-primary); border-color: var(--el-color-primary-light-7); background: var(--el-color-primary-light-9); }
.srv-icon-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.srv-icon-btn .is-spin { animation: srv-spin 0.9s linear infinite; }
@keyframes srv-spin { to { transform: rotate(360deg); } }

.srv-primary-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease;
}
.srv-primary-btn:hover { filter: brightness(1.08); }
.srv-primary-btn--sm { height: 28px; padding: 0 12px; font-size: 12px; border-radius: 8px; }
/* 「自定义」按钮：与主按钮同尺寸但描边样式 —— 它是入口不是主操作，别抢「系统详情」的视觉权重 */
.srv-primary-btn--ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}
.srv-primary-btn--ghost:hover { background: var(--el-color-primary-light-9); filter: none; }

.srv-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  transition: all 0.15s ease;
}
.srv-chip:hover { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.srv-chip--block { width: 100%; justify-content: center; margin-top: 8px; }

/* ===== 卡片 ===== */
.srv-card {
  border-radius: var(--srv-radius);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  padding: 16px 18px;
  min-width: 0;
  box-sizing: border-box;
}
.srv-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.srv-card__title { margin: 0; font-size: 15px; font-weight: 700; color: var(--el-text-color-primary); }
.srv-card__tag {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srv-card__chart { flex: 1; min-height: 0; }

/* ===== 整页布局网格（页头以下） ===== */
/**
 * .srv-board 是看板根节点：页头之下的全部内容都住在它的网格里。
 * 不再有 .srv-main / .srv-trend-row / .srv-bottom / .srv-ext 这些「段落容器」——
 * 段落变成了一个个可拖动、可缩放的区块。
 */
.srv-board {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

/**
 * 单个区块：填满自己的格子。
 *
 * 以前这些区块靠内容撑高（页面跟着变长）；进了网格之后高度由行数决定，
 * 内容超出就在区块内部滚动，拖大格子自然就全看见了。
 */
.srv-block {
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
}

/* 区块自带的 min-height（趋势卡 300px、底栏卡 200px）必须让位给格子高度 */
.srv-block.srv-card,
.srv-block.srv-bottom__card,
.srv-block.srv-trend-card {
  min-height: 0;
}

/* 编辑态：整块不接收指针事件，否则鼠标落在图表 / 按钮上就拖不动（同首页对 iframe 的处理） */
.srv-block.is-editable {
  pointer-events: none;
}

/* ===== KPI ===== */
.srv-kpis { display: block; }
.srv-kpis__grid {
  grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
}

/* ===== 主区 ===== */
.srv-main {  display: grid;
  grid-template-columns: 1.2fr 1.1fr 0.95fr;
  gap: 14px;
  align-items: stretch;
}
.srv-restful-panel { display: flex; flex-direction: column; min-width: 0; }
.srv-restful-panel__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
}
.srv-restful-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.srv-restful-kpi {
  padding: 8px 6px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  text-align: center;
  min-width: 0;
}
.srv-restful-kpi span {
  display: block;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.srv-restful-kpi b {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.srv-restful-kpi b small {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  margin-left: 2px;
}
.srv-restful-panel__chart { width: 100%; flex-shrink: 0; }
.srv-restful-panel__empty {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.srv-restful-lists {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 12px;
  min-height: 0;
}
@media (max-width: 1280px) {
  .srv-restful-lists { grid-template-columns: 1fr; }
}
.srv-restful-top {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 8px;
  min-height: 0;
}
.srv-restful-top__head span { font-weight: 600; color: var(--el-text-color-regular); }
.srv-restful-top__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.srv-restful-top__head small { font-size: 11px; color: var(--el-text-color-placeholder); }
.srv-restful-top__list { display: flex; flex-direction: column; gap: 4px; }
.srv-restful-top__row {
  display: grid;
  grid-template-columns: 48px 1fr auto auto;
  gap: 8px;
  align-items: center;
  min-width: 0;
}
.srv-restful-top__m {
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  padding: 2px 0;
  border-radius: 4px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}
.srv-restful-top__m.is-get { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.srv-restful-top__m.is-post { color: var(--el-color-success); background: var(--el-color-success-light-9); }
.srv-restful-top__m.is-put,
.srv-restful-top__m.is-patch { color: var(--el-color-warning); background: var(--el-color-warning-light-9); }
.srv-restful-top__m.is-delete { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }
.srv-restful-top__u {
  font-size: 11px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.srv-restful-top__c {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.srv-restful-top__ms {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  min-width: 40px;
  text-align: right;
  /* ReTime 根节点是 inline-flex + column，文字不跟 text-align 走，
     改用 flex 自身右对齐（配合下面的 :deep），否则数值贴左、与右侧 IP 列错位 */
  display: inline-flex;
  justify-content: flex-end;
}
/* ReTime 内层 .re-time__main 自带 --el-text-color-primary，会盖掉上面徽标的
   secondary 灰。scoped 样式穿不进子组件内部，必须用 :deep 显式压回灰色 */
.srv-restful-top__ms :deep(.re-time__main) {
  color: var(--el-text-color-secondary);
  text-align: right;
}
.srv-restful-top__ip {
  font-size: 10px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 999px;
  padding: 1px 7px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.srv-restful-top__ip i { font-style: normal; color: var(--el-text-color-secondary); margin-left: 2px; }
.srv-restful-top__rank {
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  font-size: 10px;
  border-radius: 50%;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}
.srv-restful-top__rank.is-top {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  font-weight: 700;
}
.act-muted { color: var(--el-text-color-placeholder); }
.srv-cpu-panel__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 0;
  justify-content: flex-start;
  flex: 1;
}
.srv-cpu-panel__ring { width: 100%; max-width: 200px; }
.srv-cpu-panel__sub {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}
.srv-cpu-panel__sub b { font-size: 16px; font-weight: 700; }
.srv-cpu-brk { width: 100%; display: flex; flex-direction: column; gap: 7px; margin-top: 2px; }

.srv-hbar { display: flex; align-items: center; gap: 8px; }
.srv-hbar span { font-size: 11px; color: var(--el-text-color-secondary); width: 44px; flex-shrink: 0; }
.srv-hbar__t { flex: 1; height: 7px; border-radius: 4px; background: var(--el-fill-color); overflow: hidden; }
.srv-hbar__f { height: 100%; border-radius: 4px; transition: none; }
.srv-hbar b { font-size: 12px; font-weight: 600; min-width: 40px; text-align: right; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }

.srv-mem-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 390px;
  padding: 20px;
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  background: var(--theme-color-bg-container, var(--el-bg-color));
}
.srv-mem-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.srv-mem-panel__head .srv-card__title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.srv-mem-panel__percent {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 86px;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.srv-mem-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
  min-height: 0;
}
.srv-mem-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 240px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  background: var(--el-fill-color-light);
}
.srv-mem-group h4 {
  margin: 0 0 10px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}
.srv-mem-group__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}
.srv-mem-pool {
  display: flex;
  flex: var(--pool-weight, 1) 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 44px;
  padding: 8px 10px;
  overflow: hidden;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-success);
  color: var(--el-color-white);
  text-align: center;
  box-shadow: none;
  transition: filter var(--el-transition-duration, 0.2s) ease;
}
.srv-mem-pool:hover { filter: brightness(1.04); }
.srv-mem-pool.is-primary { background: var(--el-color-primary); }
.srv-mem-pool.is-warning { background: var(--el-color-warning); }
.srv-mem-pool.is-danger { background: var(--el-color-danger); }
.srv-mem-pool span {
  max-width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srv-mem-pool b {
  margin-top: 2px;
  color: inherit;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.srv-mem-quick {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: 12px;
  flex-shrink: 0;
}
.srv-mem-quick__item {
  min-width: 0;
  padding: 12px 16px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 24%, transparent);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  background: color-mix(in srgb, var(--el-color-primary) 72%, var(--el-bg-color));
  color: var(--el-color-white);
}
.srv-mem-quick__item span {
  display: block;
  margin-bottom: 4px;
  color: color-mix(in srgb, var(--el-color-white) 82%, transparent);
  font-size: 13px;
  line-height: 1.4;
}
.srv-mem-quick__item b {
  display: block;
  color: inherit;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.srv-mem-quick__item b small {
  margin: 0 3px;
  font-size: 12px;
  font-weight: 500;
}

/* 侧栏 */
.srv-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.srv-side__card { flex: 1; display: flex; flex-direction: column; }
.srv-side__block { margin-bottom: 10px; }
.srv-side__block:last-child { margin-bottom: 0; }
.srv-side__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.srv-side__label b { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
.srv-side__bar { height: 8px; border-radius: 4px; }
.srv-side__hint { margin: 6px 0 0; font-size: 11px; color: var(--el-text-color-placeholder); }
.srv-side__net { display: flex; flex-direction: column; gap: 8px; }
.srv-side__net-row {
  display: grid;
  grid-template-columns: 28px auto 1fr;
  gap: 8px;
  align-items: center;
}
.srv-side__net-k { font-size: 12px; font-weight: 700; }
.srv-side__net-row b { font-size: 14px; font-weight: 700; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; min-width: 72px; }

/* ==================== Actuator 可视化弹窗 ==================== */
.act { display: flex; flex-direction: column; gap: 12px; min-height: 420px; }
.act__nav { width: 100%; }

.act__bar { display: flex; align-items: center; gap: 12px; }
.act__search { width: 260px; }
.act__count { font-size: 12px; color: var(--el-text-color-secondary); }
.act__bar-right { margin-left: auto; }

.act__body {
  flex: 1;
  min-height: 300px;
  max-height: 480px;
  overflow: auto;
  padding: 2px;
}
.act__empty { padding: 32px; text-align: center; font-size: 13px; color: var(--el-text-color-secondary); }
.act__empty.is-error { color: var(--el-color-danger); }
.act__hint { margin: 0; font-size: 11px; color: var(--el-text-color-placeholder); }

/* 指标（metrics）：左列表 + 右明细 */
.act-metrics { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 14px; align-items: start; }
.act-metrics__list { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.act-metrics__filter { width: 100%; }
.act-metrics__scroll { max-height: 380px; overflow: auto; display: flex; flex-direction: column; gap: 2px; }
.act-metrics__item {
  text-align: left; padding: 6px 10px; border: none; border-radius: var(--el-radius-md, 8px);
  background: transparent; cursor: pointer; font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--el-text-color-regular); word-break: break-all;
}
.act-metrics__item:hover { background: var(--el-fill-color-light); }
.act-metrics__item.is-active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.act-metrics__detail { min-width: 0; }
.act-metrics__title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); word-break: break-all; }
.act-metrics__unit { margin-left: 8px; font-size: 11px; font-weight: 400; color: var(--el-text-color-secondary); }
.act-metrics__desc { margin: 4px 0 10px; font-size: 12px; color: var(--el-text-color-secondary); }
.act-metrics__tags { margin-top: 12px; }

/* 健康状态 */
.act-health__banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 14px;
  border-radius: var(--el-radius-lg, 12px);
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.act-health__banner.is-up { background: var(--el-color-success-light-9); }
.act-health__banner.is-down { background: var(--el-color-danger-light-9); }
.act-health__banner b { margin-left: auto; font-size: 16px; }
.act-health__banner.is-up b { color: var(--el-color-success); }
.act-health__banner.is-down b { color: var(--el-color-danger); }
.act-health__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--el-color-success); }
.act-health__banner.is-down .act-health__dot { background: var(--el-color-danger); }

.act-health__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.act-health__card {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
}
.act-health__card-head { display: flex; align-items: center; gap: 8px; }
.act-health__card-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
.act-health__card.is-up .act-health__card-dot { background: var(--el-color-success); }
.act-health__card.is-down .act-health__card-dot { background: var(--el-color-danger); }
.act-health__card-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.act-health__card-detail { margin-top: 8px; font-size: 12px; line-height: 1.5; color: var(--el-text-color-secondary); word-break: break-all; }

/* 键值 / 分组 */
.act-group { margin-bottom: 14px; }
.act-group__title { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.act-group__count {
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}
.act-kv { border: 1px solid var(--el-border-color-lighter); border-radius: var(--el-radius-md, 8px); overflow: hidden; }
.act-kv__row { display: flex; gap: 12px; padding: 7px 12px; font-size: 12px; border-bottom: 1px solid var(--el-border-color-lighter); }
.act-kv__row:last-child { border-bottom: none; }
.act-kv__k { flex: 0 0 42%; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--el-color-primary); word-break: break-all; }
.act-kv__v { flex: 1; min-width: 0; color: var(--el-text-color-regular); word-break: break-all; }

.act-table :deep(.el-table__inner-wrapper) { font-size: 12px; }
.act__pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.act-sched-managed {
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.act-sched-managed__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.act-sched-managed__head small { font-weight: 400; color: var(--el-text-color-placeholder); }
.act-sched-managed__head small.is-error { color: var(--el-color-danger); }

.srv-gc-stat { display: flex; flex-direction: column; gap: 10px; flex: 1; }
.srv-gc-stat__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.srv-gc-stat__main,
.srv-gc-stat__aside {
  padding: 12px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
}
.srv-gc-stat__main span,
.srv-gc-stat__aside span { display: block; font-size: 11px; color: var(--el-text-color-secondary); }
.srv-gc-stat__main b,
.srv-gc-stat__aside b { font-size: 22px; font-weight: 700; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.srv-gc-stat__aside b { font-size: 16px; color: var(--el-color-warning); }
.srv-gc-stat__main small,
.srv-gc-stat__aside small { font-size: 11px; color: var(--el-text-color-secondary); margin-left: 2px; }
.srv-gc-list { display: flex; flex-direction: column; }
.srv-gc { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.srv-gc:last-child { border-bottom: none; }
.srv-gc__i { color: var(--el-color-warning); flex-shrink: 0; }
.srv-gc__n { font-size: 12px; font-weight: 500; color: var(--el-text-color-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.srv-gc__s { font-size: 11px; color: var(--el-text-color-secondary); }

/* ===== 趋势行 ===== */
.srv-trend-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 14px;
  min-height: 300px;
}
.srv-trend-card { display: flex; flex-direction: column; min-height: 300px; }
.srv-trend-card__foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* ===== 底部 ===== */
.srv-bottom {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}
.srv-bottom__card { min-height: 200px; }
.srv-sys-quick { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.srv-sys-quick__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}
.srv-sys-quick__row span { color: var(--el-text-color-secondary); flex-shrink: 0; }
.srv-sys-quick__row b {
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.srv-spring-block {
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  padding: 12px 14px;
}
.srv-spring-block__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.srv-spring-block__head .el-icon { color: var(--el-color-primary); }
.srv-spring-block__head small { margin-left: auto; font-weight: 500; color: var(--el-text-color-secondary); font-size: 11px; }
.srv-spring-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 180px;
  overflow: auto;
}
.srv-spring-row {
  display: grid;
  grid-template-columns: minmax(120px, 1.1fr) minmax(0, 1.4fr);
  gap: 10px;
  align-items: baseline;
  font-size: 12px;
  padding: 5px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
.srv-spring-row:last-child { border-bottom: none; }
.srv-spring-row code {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--el-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srv-spring-row span { color: var(--el-text-color-primary); word-break: break-all; }

/* ===== 磁盘行（美化：卡片化行 + 均匀栅格） ===== */
/* ===== 磁盘详情弹窗：盘符 + 文件系统 + 进度条 + 大号占比（参照设计稿） ===== */
.srv-disk-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.srv-disk-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  border-radius: var(--el-radius-xl, 16px);
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9),
    var(--el-color-info-light-9)
  );
  border: 1px solid var(--el-color-primary-light-8);
}
.srv-disk-card__drive {
  flex: none;
  min-width: 44px;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.02em;
}
.srv-disk-card__fs {
  flex: none;
  padding: 4px 16px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.srv-disk-card__track {
  flex: 1;
  min-width: 80px;
  height: 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  overflow: hidden;
}
.srv-disk-card__fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}
.srv-disk-card__right {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 230px;
}
.srv-disk-card__pct-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.srv-disk-card__pct {
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.srv-disk-card__plus {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
}
.srv-disk-card__nums {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

/* ===== 磁盘分区：纯色圆形图标 + 粗体数值 + 灰色副标题（参照设计稿统计卡） ===== */
.srv-disk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.srv-disk-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  transition: box-shadow var(--el-transition-duration, 0.2s) ease;
}
.srv-disk-item:hover {
  box-shadow: var(--el-box-shadow);
}
.srv-disk-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: var(--el-color-white);
  box-shadow: 0 10px 18px -8px color-mix(in srgb, var(--el-color-black) 35%, transparent);
}
.srv-disk-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.srv-disk-item__value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.srv-disk-item__value small {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.srv-disk-item__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.srv-disk-item__track {
  height: 7px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  overflow: hidden;
}
.srv-disk-item__fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.srv-cell-bar__track {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
  min-width: 60px;
}
.srv-cell-bar__fill {
  height: 100%;
  border-radius: 999px;
  transition: none;
}

/* ===== 分段切换 ===== */
.srv-seg {
  display: inline-flex;
  background: var(--el-fill-color);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}
.srv-seg--pill { border-radius: 999px; padding: 3px; }
.srv-seg__btn {
  border: none;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: var(--el-text-color-secondary);
  transition: all 0.15s ease;
  white-space: nowrap;
}
.srv-seg--pill .srv-seg__btn { border-radius: 999px; }
.srv-seg__btn.is-active {
  background: var(--el-color-primary);
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

/* ===== 详情 / 表格 ===== */
.srv-detail { display: flex; flex-direction: column; min-height: 0; }
.srv-detail--in-dialog { border: none; padding: 0; background: transparent; }
.srv-detail__head { margin-bottom: 12px; flex-wrap: wrap; }
.srv-detail__panel { min-height: 180px; }
.srv-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  padding-bottom: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.srv-tabs__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  padding: 8px 18px;
  border-radius: var(--el-radius-full, 9999px) var(--el-radius-full, 9999px) 0 0;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: var(--el-text-color-secondary);
  transition: background-color 0.15s ease, color 0.15s ease;
}
.srv-tabs__btn:hover { color: var(--el-text-color-primary); }
.srv-tabs__btn.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}
.srv-tabs__btn.is-active::after {
  content: "";
  position: absolute;
  left: 14%;
  right: 14%;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--el-color-primary);
}

.srv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}
.srv-table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  white-space: nowrap;
}
.srv-table th:first-child { border-radius: 8px 0 0 8px; }
.srv-table th:last-child { border-radius: 0 8px 8px 0; }
.srv-table td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  color: var(--el-text-color-primary);
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}
.srv-table tbody tr:hover td { background: var(--el-fill-color-lighter); }
.srv-table tbody tr:last-child td { border-bottom: none; }
.col-chart { width: 160px; }
.srv-td-sub { display: block; font-size: 11px; color: var(--el-text-color-secondary); margin-top: 1px; }
.srv-ifc { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.srv-ifc b { font-size: 13px; font-weight: 600; }
.srv-ifc small { font-size: 11px; color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.srv-detail__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.srv-detail__foot b { font-size: 14px; }
.srv-detail__foot-right { margin-left: auto; }

.srv-net-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 12px; }
.srv-net-merged { padding: 4px 0; }
.srv-net-merged-stats { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--el-border-color-lighter); }
.srv-net-mini { display: flex; align-items: center; gap: 8px; }
.srv-net-mini__name { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); }
.srv-net-mini span { font-size: 11px; color: var(--el-text-color-secondary); }

/* ===== CPU 弹窗 ===== */
.srv-cpu-dialog {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;
}
.srv-cpu-dialog__side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
}
.srv-cpu-dialog__cores {
  display: flex;
  flex-direction: column;
  min-height: 320px;
  max-height: 60vh;
  overflow: auto;
  padding: 10px 4px;
}
.srv-core-rows-head {
  display: grid;
  grid-template-columns: 110px 64px 1fr 140px;
  gap: 12px;
  align-items: center;
  padding: 0 10px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: sticky;
  top: 0;
  background: var(--el-bg-color);
  z-index: 1;
}
.srv-core-rows { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; }
.srv-core-row {
  display: grid;
  grid-template-columns: 110px 64px 1fr 140px;
  gap: 12px;
  align-items: center;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.srv-core-row:hover { background: var(--el-fill-color-light); }
.srv-core-row__name { display: flex; align-items: center; gap: 6px; min-width: 0; }
.srv-core-row__name b { font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.srv-core-row__name small { font-size: 10px; color: var(--el-text-color-secondary); }
.srv-core-row__name small.is-ok { color: var(--el-color-success); }
.srv-core-row__name small.is-warn { color: var(--el-color-warning); }
.srv-core-row__name small.is-danger { color: var(--el-color-danger); }
.srv-core-row__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.srv-core-row__pct { font-size: 13px; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
.srv-core-row__bar { min-width: 0; }
.srv-core-row__chart { min-width: 0; height: 40px; }
.srv-cpu-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.srv-cpu-meta__item {
  padding: 10px 6px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  text-align: center;
}
.srv-cpu-meta__item b { display: block; font-size: 16px; font-weight: 700; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.srv-cpu-meta__item span { font-size: 10px; color: var(--el-text-color-secondary); }
.srv-cpu-hint { margin: 0; font-size: 11px; color: var(--el-text-color-placeholder); }

/* ===== 系统 Tab ===== */
/* 系统信息：左右两列，每列纵向堆叠白色卡片（参照设计稿） */
.srv-sys-cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
}
.srv-sys-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.srv-sys-card {
  padding: 16px 18px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}
.srv-sys-card__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.srv-sys-card__head .el-icon { color: var(--el-color-primary); }
.srv-sys-plus {
  margin-left: auto;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.srv-sys-plus:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.srv-sys-rows { display: flex; flex-direction: column; gap: 9px; }
.srv-sys-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 13px; }
.srv-sys-row > span { color: var(--el-text-color-secondary); flex-shrink: 0; }
.srv-sys-row > b {
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.srv-sys-hl { color: var(--el-color-primary) !important; }
.srv-sys-soft { font-weight: 400; color: var(--el-text-color-secondary); font-size: 11px; }
.srv-sys-code { font-family: ui-monospace, monospace; font-size: 11px !important; font-weight: 500 !important; }
.srv-sys-btn { width: 100%; margin-top: 14px; }

.srv-pool-list { display: flex; flex-direction: column; gap: 11px; }
.srv-pool { display: grid; grid-template-columns: minmax(76px, 1fr) minmax(70px, 1.5fr) 64px; align-items: center; gap: 10px; }
/* 池名与右侧大小值同档（11px），两处视觉重量一致，不再一粗一细 */
.srv-pool__name { font-size: 11px; line-height: 1.5; color: var(--el-text-color-regular); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.srv-pool__bar { min-width: 0; }
/* 轨道底色改淡（--el-fill-color），填充由 barColor 按阈值给等级色，对比更明显 */
.srv-pool__bar :deep(.el-progress-bar__outer) { background-color: var(--el-fill-color); border-radius: var(--el-radius-full, 9999px); }
.srv-pool__bar :deep(.el-progress-bar__inner) { border-radius: var(--el-radius-full, 9999px); }
.srv-pool__size { font-size: 11px; line-height: 1.5; color: var(--el-text-color-secondary); text-align: right; font-variant-numeric: tabular-nums; }

/* ===== 弹窗公共 ===== */
.srv-panel-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.srv-panel-head span { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.srv-jvm-dialog__body { display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow: auto; }
.srv-jvm-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.srv-jvm-info__item { padding: 10px 12px; border-radius: 10px; background: var(--el-fill-color-light); display: flex; flex-direction: column; gap: 2px; }
.srv-jvm-info__item span { font-size: 11px; color: var(--el-text-color-secondary); }
.srv-jvm-info__item b { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.srv-jvm-grid { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 12px; }
.srv-jvm-block { padding: 14px; border-radius: 10px; background: var(--el-fill-color-light); }
.srv-empty-inline { font-size: 12px; color: var(--el-text-color-placeholder); padding: 8px 0; }
.srv-class-stats { display: flex; gap: 10px; }
.srv-class-stat { flex: 1; padding: 12px; border-radius: 8px; background: var(--el-bg-color); text-align: center; }
.srv-class-stat b { display: block; font-size: 18px; font-weight: 700; color: var(--el-text-color-primary); }
.srv-class-stat span { font-size: 10px; color: var(--el-text-color-secondary); }
.srv-jvm-threads { padding: 14px; border-radius: 10px; background: var(--el-fill-color-light); }
.srv-jvm-paths { padding: 14px; border-radius: 10px; background: var(--el-fill-color-light); }

/* ==================== JVM 运行时弹窗（参照设计稿） ==================== */
.srv-jvm2 { display: flex; flex-direction: column; gap: 16px; }

/* 顶部信息胶囊 */
.srv-jvm2__chips { display: flex; flex-wrap: wrap; gap: 12px; }
.srv-jvm2__chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 20px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-lighter);
}
.srv-jvm2__chip--wide { flex: 1; min-width: 240px; }
.srv-jvm2__chip-label { flex: none; font-size: 13px; color: var(--el-text-color-secondary); }
.srv-jvm2__chip-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.srv-jvm2__deadlock {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 24px;
  padding: 0 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-success);
  color: var(--el-color-white);
  font-size: 13px;
  font-weight: 700;
}
.srv-jvm2__deadlock.is-danger { background: var(--el-color-danger); }

/* 三列卡片 */
.srv-jvm2__cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.srv-jvm2__card {
  padding: 16px 18px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  border: 1px solid transparent;
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--el-color-black) 4%, transparent),
    0 12px 28px -14px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}
.srv-jvm2__card--table { grid-column: 1 / -1; }
.srv-jvm2__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}
.srv-jvm2__title { font-size: 15px; font-weight: 700; color: var(--el-text-color-primary); }
.srv-jvm2__extra { font-size: 12px; color: var(--el-text-color-secondary); }
.srv-jvm2__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: transform 0.2s ease, color 0.2s ease;
}
.srv-jvm2__toggle:hover { color: var(--el-color-primary); }
.srv-jvm2__toggle.is-collapsed { transform: rotate(-90deg); }

/* GC 收集器 */
.srv-jvm2__gc-list { display: flex; flex-direction: column; gap: 12px; }
.srv-jvm2__gc { display: flex; align-items: center; gap: 10px; }
.srv-jvm2__gc-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-warning);
  color: var(--el-color-white);
}
.srv-jvm2__gc-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--el-text-color-primary);
}
.srv-jvm2__gc-stat {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

/* 类加载 */
.srv-jvm2__class { display: flex; align-items: stretch; }
.srv-jvm2__class-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
}
.srv-jvm2__class-item b {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.srv-jvm2__class-item span { font-size: 12px; color: var(--el-text-color-secondary); }
.srv-jvm2__class-divider { width: 1px; background: var(--el-border-color-lighter); margin: 4px 0; }

/* 路径区 */
.srv-jvm2__paths { grid-column: 1 / -1; }
.srv-path { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.srv-path--col { align-items: flex-start; }
.srv-path:first-child { margin-top: 0; }
.srv-path__label { width: 70px; flex-shrink: 0; font-size: 11px; color: var(--el-text-color-secondary); padding-top: 6px; }
.srv-path__code { flex: 1; padding: 6px 10px; border-radius: 6px; background: var(--el-bg-color); font-family: ui-monospace, monospace; font-size: 11px; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.srv-path__pre { flex: 1; margin: 0; padding: 8px 10px; border-radius: 6px; background: var(--el-bg-color); font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; color: var(--el-text-color-primary); max-height: 100px; overflow: auto; }

/* ===== 响应式 ===== */
@media screen and (max-width: 1400px) {
  .srv-kpis__grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  .srv-main { grid-template-columns: 1fr 1fr; }
  .srv-side { grid-column: 1 / -1; flex-direction: row; }
  .srv-side__card { flex: 1; }
}
@media screen and (max-width: 1280px) {
  .srv-kpis__grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .srv-main { grid-template-columns: 1fr; }
  .srv-side { flex-direction: column; }
  .srv-restful-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .srv-trend-row { grid-template-columns: 1fr; }
  .srv-bottom { grid-template-columns: 1fr; }
  .srv-cpu-dialog { grid-template-columns: 1fr; }
  .srv-sys-cols { grid-template-columns: 1fr; }
  .srv-jvm-grid { grid-template-columns: 1fr; }
  .srv-jvm-info { grid-template-columns: repeat(2, 1fr); }
  .srv-jvm2__cards { grid-template-columns: 1fr; }
}
@media screen and (max-width: 768px) {
  .srv-kpis__grid { grid-template-columns: 1fr !important; }
  .srv-page__bar { flex-direction: column; align-items: stretch; }
  .srv-page__actions { justify-content: flex-start; }
  .srv-jvm-info { grid-template-columns: 1fr; }
  .srv-mem-groups { grid-template-columns: 1fr; }
  .srv-mem-quick { grid-template-columns: 1fr; }
  .srv-table { display: block; overflow-x: auto; }
  .srv-disk-item { gap: 12px; padding: 12px 14px; }
  .srv-disk-item__icon { width: 42px; height: 42px; }
}

/* ===== 减弱动效 ===== */
.is-reduced .re-stats-card__item, .is-reduced .srv-icon-btn { transition: none; }
.is-reduced .srv-conn--live .srv-conn__dot, .is-reduced .srv-conn--connecting .srv-conn__dot { animation: none; }
.is-reduced .srv-hbar__f, .is-reduced .srv-cell-bar__fill, .is-reduced .srv-disk-item__fill { transition: none; }
.is-reduced .srv-icon-btn .is-spin { animation: none; }
</style>
