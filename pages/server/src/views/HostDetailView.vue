<script setup lang="ts">
/**
 * 主机监控详情 —— 遥测控制台（mission-control telemetry）
 *
 * 数据源（前端不做 HTTP 轮询，全部由 socket 推送或事件触发的一次性拉取）：
 *   1) 进入页面一次性拉取：主机台账 + 近1h内置历史 + 资产监控项解析 + 一次新鲜画像；
 *   2) Socket 实时推送：
 *      - monitor:host-metrics（按 hostId 过滤）：CPU/内存/磁盘/磁盘IO/软件；
 *      - monitor:metric（按 monitorId 过滤）：监控项明细（含 JVM）。
 *   3) AI 智能分析：事件触发，后端按主机取数，前端只传分析重点。
 *
 * 所有仪表/趋势均来自真实采集值，点击趋势卡打开的历史弹窗与外侧口径一致；
 * 弹窗内只选择时间范围，指标由被点击的卡片确定。
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import {useSocketService, message} from "@repo/core";
import * as echarts from "echarts";
import { Loading } from "@element-plus/icons-vue";
import {
  getAssetDetail, getLatestCpu, getCpuHistory, getLatestMemory, getMemoryHistory, getLatestDisk,
  getLatestNetwork, getNetworkHistory, getLatestJvm, getJvmHistory, getHostMetricHistory,
  aiAnalyzeHost, fetchAiStatus,
  type AssetMonitorRef, type SoftwareInstance,
} from "@pages/monitor/src/api";
import { getHost, fetchHostProfile, fetchHostProfileSection, closeNetProcess, killProcess, restartHostProcess, startService, stopService, restartService, setHostEnvVar, deleteHostEnvVar, fetchFirewallRules, type HostProfile } from "../api";
import ProfileDisks from "../components/profile/ProfileDisks.vue";
import ProfileProcesses from "../components/profile/ProfileProcesses.vue";
import ProfileServices from "../components/profile/ProfileServices.vue";
import ProfilePorts from "../components/profile/ProfilePorts.vue";
import ProfileNetwork from "../components/profile/ProfileNetwork.vue";
import ProfileEnv from "../components/profile/ProfileEnv.vue";
import ProfileFirewall from "../components/profile/ProfileFirewall.vue";
import ScSoftwarePanel from "../components/ScSoftwarePanel.vue";

const route = useRoute();
const router = useRouter();

/**
 * 嵌入模式：作为主机工作区的一个页签渲染。
 *
 * <p>嵌入时主机由页签绑定（{@link props.hostId}），不读路由参数；
 * 页头（返回资产 / 连接远控）也由外壳承担，这里只留指标本体。</p>
 */
const props = withDefaults(
  defineProps<{
    /** 嵌入模式 */
    embedded?: boolean;
    /** 嵌入模式下锁定查看的主机 id */
    hostId?: number | null;
  }>(),
  { embedded: false, hostId: null },
);

/** 路由参数是主机台账标识（AssetsView 用 /host/${h.id} 跳转），不是监控项标识 */
const hostId = ref<number>(props.embedded ? (props.hostId ?? 0) : (Number(route.params.id) || 0));
/** 指标查询用监控项标识，由资产详情解析得到 */
const monitorId = ref<number>(0);
const hostName = ref("");
const monitors = ref<AssetMonitorRef[]>([]);
const loading = ref(false);
const error = ref("");
/** 主机台账记录（内置指标的初始来源，即使没有监控项也能出数） */
const hostRecord = ref<any>(null);

const cpu = ref<{ usage?: number; cores?: number } | null>(null);
const mem = ref<{ usagePercent?: number; usage?: number; total?: number } | null>(null);
const disk = ref<any[]>([]);
const net = ref<{ rx?: number; tx?: number } | null>(null);
const jvm = ref<{ heapUsed?: number; heapMax?: number; heapUsagePercent?: number } | null>(null);
/** 磁盘读写速率 KB/s */
const diskRead = ref(0);
const diskWrite = ref(0);
/** 主机上识别到的软件实例（动态，按主机实际存在渲染） */
const software = ref<SoftwareInstance[]>([]);

/** 主机运行时长（秒，来自台账 serverHostUptimeSec / 画像 info.uptimeSec） */
const hostUptime = ref(0);
/** 主机系统信息（来自台账字段，画像刷新时覆盖） */
const hostOsInfo = ref<{
  osType: string; osVersion: string; arch: string;
  cpuCores: number; memoryMb: number; javaVersion: string;
  hostname: string; gpuModel: string;
}>({
  osType: "", osVersion: "", arch: "", cpuCores: 0, memoryMb: 0,
  javaVersion: "", hostname: "", gpuModel: "",
});

/** 防火墙状态：规则列表由 /ms/system/firewall/rules 采集 */
const hostFirewallRules = ref(0);
const hostFirewallOn = ref(false);

const cpuHist = ref<number[]>([]);
const memHist = ref<number[]>([]);
const diskHist = ref<number[]>([]);
const diskReadHist = ref<number[]>([]);
const diskWriteHist = ref<number[]>([]);
const netHist = ref<number[]>([]);
const jvmHist = ref<number[]>([]);

// ---------------- 格式化工具 ----------------
function pct(v?: number): string { return v == null ? "—" : `${v.toFixed(0)}%`; }
function num(v?: number): string { return v == null ? "—" : String(Math.round(v)); }
function fmt(v?: number): string {
  if (v == null) return "—";
  if (v >= 1073741824) return `${(v / 1073741824).toFixed(1)}G`;
  if (v >= 1048576) return `${(v / 1048576).toFixed(1)}M`;
  if (v >= 1024) return `${(v / 1024).toFixed(1)}K`;
  return String(Math.round(v));
}
/** 速率（KB/s）展示：自动升到 MB/s */
function fmtKbs(v?: number): string {
  if (v == null) return "—";
  if (v >= 1024) return `${(v / 1024).toFixed(1)} MB/s`;
  return `${v.toFixed(0)} KB/s`;
}
/** 运行时长：2d 3h / 4h 12m / 30m */
function fmtUptime(sec?: number): string {
  if (sec == null || sec < 0) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}
function numOr0(v: unknown): number {
  const n = Number(v);
  return v == null || Number.isNaN(n) ? 0 : n;
}
/** 把 ISO 时间 / 时间戳转成 HH:MM:SS */
function fmtClock(t?: string | number): string {
  if (t == null) return "—";
  const d = new Date(typeof t === "number" ? t : String(t).length === 13 ? Number(t) : t);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
/** 解析软件 JSON（后端可能给字符串或数组） */
function parseSoftware(raw: unknown): SoftwareInstance[] {
  if (!raw) return [];
  let arr: any = raw;
  if (typeof raw === "string") {
    try { arr = JSON.parse(raw); } catch { return []; }
  }
  return Array.isArray(arr) ? arr : [];
}

// ---------------- 趋势 sparkline（纯 SVG） ----------------
function sparkScaled(data: number[], min: number, max: number): string {
  if (data.length === 0) return "";
  const range = max - min || 1, w = 200, h = 56, pad = 3;
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
function spark(data: number[]): string {
  if (data.length === 0) return "";
  return sparkScaled(data, Math.min(...data), Math.max(...data));
}
function area(data: number[]): string {
  if (data.length === 0) return "";
  return `${spark(data)} 200,56 0,56`;
}
/** 磁盘IO 两条线共用纵轴（读+写一起取 min/max，便于对比） */
function ioSpark(which: "read" | "write"): string {
  const all = [...diskReadHist.value, ...diskWriteHist.value];
  if (!all.length) return "";
  const min = Math.min(...all), max = Math.max(...all);
  return sparkScaled(which === "read" ? diskReadHist.value : diskWriteHist.value, min, max);
}
function trendMin(data: number[]): string { return data.length ? data.reduce((a, b) => Math.min(a, b), Infinity).toFixed(0) : "—"; }
function trendMax(data: number[]): string { return data.length ? data.reduce((a, b) => Math.max(a, b), -Infinity).toFixed(0) : "—"; }
function trendLast(data: number[]): string { return data.length ? data[data.length - 1].toFixed(0) : "—"; }
function netMin(data: number[]): string { return data.length ? fmt(data.reduce((a, b) => Math.min(a, b), Infinity)) : "—"; }
function netMax(data: number[]): string { return data.length ? fmt(data.reduce((a, b) => Math.max(a, b), -Infinity)) : "—"; }
function netLast(data: number[]): string { return data.length ? fmt(data[data.length - 1]) : "—"; }
/** 磁盘IO 趋势的最新读/写文本 */
const ioLastRead = computed(() => diskReadHist.value.length ? fmtKbs(diskReadHist.value[diskReadHist.value.length - 1]) : "—");
const ioLastWrite = computed(() => diskWriteHist.value.length ? fmtKbs(diskWriteHist.value[diskWriteHist.value.length - 1]) : "—");

// ---------------- 仪表 ----------------
const ticks = Array.from({ length: 60 }, (_, i) => i);
function ringDash(p: number): string {
  const r = 50, circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, p));
  return `${(circ * v / 100).toFixed(2)} ${circ.toFixed(2)}`;
}
function ringStyle(p: number): Record<string, string> {
  return { strokeDasharray: ringDash(p) };
}
/** 仪表热力等级：0 正常 / 1 偏高 / 2 告警 */
function heat(v?: number): number {
  if (v == null) return 0;
  if (v >= 85) return 2;
  if (v >= 70) return 1;
  return 0;
}

const cpuPct = computed(() => cpu.value?.usage ?? 0);
const memPct = computed(() => mem.value?.usagePercent ?? 0);
const diskPct = computed(() => Math.max(0, ...disk.value.map(d => Number(d.usagePercent ?? 0))));
const jvmPct = computed(() => jvm.value?.heapUsagePercent ?? 0);

// ---------------- Socket 实时推送 ----------------
const socket = useSocketService();
const MAX_LIVE = 240;                       // 实时追加保留的最大点数（滚动近1h，15s粒度≈240点）
const sockOn = computed(() => socket?.connected.value ?? false);
const pushCount = ref(0);
const lastPushText = ref("—");
const lastPushAt = ref(0);                  // 最近一次推送的毫秒时间戳（判断 LIVE 活性）
const LIVE_TTL = 30_000;                    // 30s 内无推送则 LIVE 变灰
const liveActive = computed(() => sockOn.value && Date.now() - lastPushAt.value < LIVE_TTL);
let unsubMetric: (() => void) | undefined;
let unsubHostMetric: (() => void) | undefined;

function pushPoint(arr: { value: number[] }, v: number | null | undefined): void {
  if (v == null || Number.isNaN(Number(v))) return;
  const next = [...arr.value, Number(v)];
  arr.value = next.length > MAX_LIVE ? next.slice(next.length - MAX_LIVE) : next;
}
/** 从推送 metrics 中按候选键名取值（后端 ServerLocalProvider 用 snake_case） */
function pickMetric(metrics: Record<string, unknown>, keys: string[]): number | null {
  if (!metrics) return null;
  for (const k of keys) {
    const v = metrics[k];
    if (v != null && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}
/** 应用一次实时指标推送（monitor:metric，监控项明细） */
function applyLivePayload(payload: any): void {
  const metrics = payload?.metrics as Record<string, unknown> | undefined;
  if (!metrics) return;

  const cpuVal = pickMetric(metrics, ["cpu_usage", "cpuUsage", "cpu"]);
  if (cpuVal != null) { cpu.value = { ...(cpu.value ?? {}), usage: cpuVal }; pushPoint(cpuHist, cpuVal); }

  const memVal = pickMetric(metrics, ["memory_usage", "memoryUsage", "mem_usage", "memUsage"]);
  if (memVal != null) { mem.value = { ...(mem.value ?? {}), usagePercent: memVal }; pushPoint(memHist, memVal); }

  const diskVal = pickMetric(metrics, ["disk_usage", "diskUsage", "disk"]);
  if (diskVal != null && disk.value.length === 0) {
    disk.value = [{ mount: "/", device: "", used: 0, total: 0, usedText: "—", usagePercent: diskVal }];
  }

  const rx = pickMetric(metrics, ["network_rx_bytes", "networkRx", "rx"]);
  const tx = pickMetric(metrics, ["network_tx_bytes", "networkTx", "tx"]);
  if (rx != null || tx != null) {
    net.value = { rx: rx ?? net.value?.rx, tx: tx ?? net.value?.tx };
    pushPoint(netHist, tx ?? rx ?? 0);
  }

  const jvmVal = pickMetric(metrics, ["jvm_heap_usage", "heapUsagePercent", "jvm_usage", "jvmUsage"]);
  if (jvmVal != null) { jvm.value = { ...(jvm.value ?? {}), heapUsagePercent: jvmVal }; pushPoint(jvmHist, jvmVal); }

  pushCount.value++;
  lastPushAt.value = Date.now();
  lastPushText.value = fmtClock(payload.collectTime ?? Date.now());
}
/** 订阅当前主机的监控项明细推送 */
function bindLive(): void {
  unsubMetric?.();
  if (!socket) return;
  unsubMetric = socket.subscribe("monitor", "metric", (msg: any) => {
    try {
      const data = (msg.data ?? msg) as any;
      const payload = data && typeof data === "object" ? (data.data ?? data) : data;
      if (!payload || payload.monitorId == null) return;
      if (String(payload.monitorId) !== String(monitorId.value)) return;
      applyLivePayload(payload);
    } catch { /* 静默 */ }
  });
}

// ---------------- 主机内置指标（无监控项也出数） ----------------
/** 聚合磁盘的合成标签：Linux 根「/」，Windows「此电脑」 */
const aggDiskLabel = computed(() => {
  const os = String(hostRecord.value?.serverHostOsType ?? "").toUpperCase();
  return os.includes("WIN") ? "此电脑" : "/";
});
/** 主机是否曾被成功画像：成功采集会写入 CPU 核数/内存/磁盘规格，失败主机这些列为 null */
function isProfiled(r: any): boolean {
  return !!r && (r.serverHostCpuCores != null || r.serverHostMemoryMb != null || r.serverHostDiskGb != null);
}
/** 主机是否已采到过内置指标（决定无监控项时是否仍渲染仪表） */
const hasHostMetrics = computed(() => {
  const r = hostRecord.value;
  if (!r || !isProfiled(r)) return false;   // 仅有持久化 0 值、从未成功画像的主机不显示假仪表
  return r.serverHostCpuUsage != null || r.serverHostMemUsage != null || r.serverHostDiskUsage != null;
});
/** 趋势口径：有监控项为 24h 历史，否则仅本次会话的实时序列 */
const trendIsRealtime = computed(() => !monitorId.value);

/** 记录一次推送/采集的心跳（LIVE 活性、推送计数、最后时间） */
function markPushHeart(clock?: string | number): void {
  pushCount.value++;
  lastPushAt.value = Date.now();
  lastPushText.value = fmtClock(clock ?? Date.now());
}

/**
 * 用主机台账记录初始化仪表（CPU/内存/磁盘/磁盘IO/软件 + 硬件规格），并给实时趋势种起点。
 * 监控项存在时，监控项的明细（网络/JVM/24h）会在 fetchMetrics 中覆盖更精确的值。
 */
function applyHostRecord(r: any): void {
  if (!r) return;
  hostRecord.value = r;
  if (!hostName.value) hostName.value = r.serverHostName ?? "";
  // 从未成功画像的主机（硬件规格全 null）不填充 0 值假仪表
  if (!isProfiled(r)) return;

  const cores = r.serverHostCpuCores != null ? Number(r.serverHostCpuCores) : undefined;
  if (r.serverHostCpuUsage != null) {
    const v = Number(r.serverHostCpuUsage);
    cpu.value = { usage: v, cores };
    if (trendFollowsLive.value) pushPoint(cpuHist, v);
  } else if (cores != null) {
    cpu.value = { ...(cpu.value ?? {}), cores };
  }

  const memMb = r.serverHostMemoryMb != null ? Number(r.serverHostMemoryMb) : undefined;
  const memTotal = memMb != null ? memMb * 1024 * 1024 : undefined;
  if (r.serverHostMemUsage != null) {
    const v = Number(r.serverHostMemUsage);
    const used = memTotal != null ? (memTotal * v) / 100 : undefined;
    mem.value = { usagePercent: v, usage: used, total: memTotal };
    if (trendFollowsLive.value) pushPoint(memHist, v);
  } else if (memTotal != null) {
    mem.value = { ...(mem.value ?? {}), total: memTotal };
  }

  if (r.serverHostDiskUsage != null && disk.value.length === 0) {
    const v = Number(r.serverHostDiskUsage);
    const total = r.serverHostDiskGb != null ? Number(r.serverHostDiskGb) * 1024 * 1024 * 1024 : undefined;
    disk.value = [{ mount: aggDiskLabel.value, device: r.serverHostOsType ?? "", used: total ? (total * v) / 100 : 0, total, usedText: "—", usagePercent: v }];
  }
  if (r.serverHostDiskReadKbs != null) diskRead.value = Number(r.serverHostDiskReadKbs);
  if (r.serverHostDiskWriteKbs != null) diskWrite.value = Number(r.serverHostDiskWriteKbs);
  const sw = parseSoftware(r.serverHostSoftware);
  if (sw.length) software.value = sw;

  // 新卡片数据
  if (r.serverHostUptimeSec != null) hostUptime.value = Number(r.serverHostUptimeSec);
  hostOsInfo.value = {
    osType: r.serverHostOsType ?? "",
    osVersion: r.serverHostOsVersion ?? "",
    arch: r.serverHostOsArch ?? "",
    cpuCores: Number(r.serverHostCpuCores ?? 0),
    memoryMb: Number(r.serverHostMemoryMb ?? 0),
    javaVersion: r.serverHostJavaVersion ?? "",
    hostname: r.serverHostOsHostname ?? r.serverHostName ?? "",
    gpuModel: r.serverHostGpuModel ?? "",
  };
}

/** 拉取主机台账，初始化内置指标 */
async function loadHostRecord(): Promise<void> {
  try {
    const r = await getHost(hostId.value);
    applyHostRecord(r);
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
  }
}

/** 订阅主机内置实时推送（host-metrics，按 hostId 过滤），无监控项时这是主实时源 */
function bindHostMetrics(): void {
  unsubHostMetric?.();
  if (!socket) return;
  unsubHostMetric = socket.subscribe("monitor", "host-metrics", (msg: any) => {
    try {
      const d = (msg.data ?? msg) as {
        hostId?: number; cpu?: number; mem?: number; disk?: number;
        diskRead?: number; diskWrite?: number; software?: unknown; collectTime?: string;
      };
      if (!d || d.hostId == null || String(d.hostId) !== String(hostId.value)) return;

      if (d.cpu != null && !Number.isNaN(Number(d.cpu))) {
        const v = Number(d.cpu);
        cpu.value = { ...(cpu.value ?? {}), usage: v };
        if (trendFollowsLive.value) pushPoint(cpuHist, v);
      }
      if (d.mem != null && !Number.isNaN(Number(d.mem))) {
        const v = Number(d.mem);
        mem.value = { ...(mem.value ?? {}), usagePercent: v };
        if (trendFollowsLive.value) pushPoint(memHist, v);
      }
      if (d.disk != null && !Number.isNaN(Number(d.disk))) {
        const v = Number(d.disk);
        if (disk.value.length === 0) {
          disk.value = [{ mount: aggDiskLabel.value, device: "", used: 0, total: 0, usedText: "—", usagePercent: v }];
        } else {
          disk.value = disk.value.map((d0, i) => (i === 0 ? { ...d0, usagePercent: v } : d0));
        }
        if (trendFollowsLive.value) pushPoint(diskHist, v);
      }
      if (d.diskRead != null) { const v = Number(d.diskRead); diskRead.value = v; if (trendFollowsLive.value) pushPoint(diskReadHist, v); }
      if (d.diskWrite != null) { const v = Number(d.diskWrite); diskWrite.value = v; if (trendFollowsLive.value) pushPoint(diskWriteHist, v); }
      const sw = parseSoftware(d.software);
      if (sw.length) software.value = sw;
      markPushHeart(d.collectTime);
    } catch { /* 静默 */ }
  });
}

// ---------------- 画像即时采集（强制一次新鲜采集，含网络速率） ----------------
/** 把画像概览（HostProfile，metrics 为 HostMetricsVO 形状）映射到仪表与趋势 */
function applyFreshProfile(p: HostProfile): void {
  if (!p) return;
  if (p.host) {
    hostRecord.value = p.host;
    if (!hostName.value) hostName.value = (p.host as any).serverHostName ?? "";
  }
  const m = p.metrics as Record<string, any> | undefined;
  if (!m) { markPushHeart(p.collectedAt); return; }

  const realtime = trendFollowsLive.value;
  const cpuVal = numOr0(m.cpuPercent);
  const cores = cpu.value?.cores ?? ((p.host as any)?.serverHostCpuCores != null ? numOr0((p.host as any).serverHostCpuCores) : undefined);
  cpu.value = { usage: cpuVal, cores };
  if (realtime) pushPoint(cpuHist, cpuVal);

  const totalMb = numOr0(m.memoryTotalMb), usedMb = numOr0(m.memoryUsedMb);
  mem.value = { usagePercent: numOr0(m.memoryPercent), usage: usedMb * 1024 * 1024, total: totalMb * 1024 * 1024 };
  if (realtime) pushPoint(memHist, numOr0(m.memoryPercent));

  if (realtime) {
    const totalGb = numOr0(m.diskTotalGb), usedGb = numOr0(m.diskUsedGb);
    disk.value = [{ mount: aggDiskLabel.value, device: (p.host as any)?.serverHostOsType ?? "", used: usedGb * 1073741824, total: totalGb * 1073741824, usedText: "—", usagePercent: numOr0(m.diskPercent) }];
    pushPoint(diskHist, numOr0(m.diskPercent));
  }

  // 磁盘IO KB/s
  const rKbs = numOr0(m.diskReadKbs), wKbs = numOr0(m.diskWriteKbs);
  diskRead.value = rKbs; diskWrite.value = wKbs;
  if (realtime) { pushPoint(diskReadHist, rKbs); pushPoint(diskWriteHist, wKbs); }

  // 软件（画像已在台账派生，优先读 host 字段）
  const sw = parseSoftware((p.host as any)?.serverHostSoftware);
  if (sw.length) software.value = sw;

  // 网络速率 KB/s → 转字节供 fmt 显示
  const rxKb = Number(m.networkRxKb ?? 0), txKb = Number(m.networkTxKb ?? 0);
  net.value = { rx: rxKb * 1024, tx: txKb * 1024 };
  if (realtime) pushPoint(netHist, Math.max(txKb, rxKb) * 1024);

  // 新卡片数据：uptime 与系统信息
  const h = p.host as any;
  const i = p.info as Record<string, any> | undefined;
  const upSec = Number(m.uptimeSec ?? i?.uptimeSec ?? h?.serverHostUptimeSec ?? 0);
  if (upSec > 0) hostUptime.value = upSec;
  hostOsInfo.value = {
    osType: h?.serverHostOsType ?? i?.osName ?? i?.os ?? "",
    osVersion: h?.serverHostOsVersion ?? i?.osVersion ?? "",
    arch: h?.serverHostOsArch ?? i?.arch ?? "",
    cpuCores: Number(h?.serverHostCpuCores ?? i?.cpuCores ?? 0),
    memoryMb: Number(h?.serverHostMemoryMb ?? i?.memoryMb ?? 0),
    javaVersion: h?.serverHostJavaVersion ?? i?.javaVersion ?? "",
    hostname: h?.serverHostOsHostname ?? i?.hostname ?? h?.serverHostName ?? "",
    gpuModel: h?.serverHostGpuModel ?? i?.gpu ?? "",
  };

  markPushHeart(m.collectTime ?? p.collectedAt);
}

/** 强制一次新鲜采集：画像接口拉全量（含网络/磁盘IO/软件），有监控项再补 JVM/24h */
async function refreshNow(silent = false): Promise<void> {
  if (!silent) loading.value = true;
  error.value = "";
  try {
    const p = await fetchHostProfile(hostId.value, { live: true, persist: true });
    applyFreshProfile(p);
    if (monitorId.value) await fetchMetrics();
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

/** 拉取防火墙规则数（仅用于信息卡片概览，完整规则在画像分区查看） */
async function loadFirewallStatus(): Promise<void> {
  if (!hostId.value) return;
  try {
    const rules = await fetchFirewallRules(hostId.value);
    hostFirewallRules.value = Array.isArray(rules) ? rules.length : 0;
    hostFirewallOn.value = hostFirewallRules.value > 0;
  } catch {
    hostFirewallRules.value = 0;
    hostFirewallOn.value = false;
  }
}

// ---------------- 数据拉取 ----------------
async function fetchMetrics(): Promise<void> {
  if (!monitorId.value) {
    resetMetrics();
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const id = monitorId.value;
    const [c, m, d, n, j] = await Promise.allSettled([getLatestCpu(id), getLatestMemory(id), getLatestDisk(id), getLatestNetwork(id), getLatestJvm(id)]);
    // 指标端点返回的是实体行（cpuUsage / usedBytes / mountPoint / rxBytes / heapUsedBytes…），
    // 页面统一按下面的形状渲染，故只在取数边界做一次归一，模板不再猜字段名。
    if (c.status === "fulfilled") {
      cpu.value = c.value ? { usage: numOr0(c.value.cpuUsage), cores: c.value.cpuCores } : null;
    }
    if (m.status === "fulfilled") {
      mem.value = m.value
        ? { usagePercent: numOr0(m.value.usagePercent), usage: numOr0(m.value.usedBytes), total: numOr0(m.value.totalBytes) }
        : null;
    }
    if (d.status === "fulfilled") {
      disk.value = (d.value ?? []).map(r => ({
        mount: r.mountPoint, device: r.fileSystem, used: r.usedBytes, total: r.totalBytes,
        usagePercent: r.usagePercent,
      }));
    }
    if (n.status === "fulfilled") {
      net.value = n.value ? { rx: numOr0(n.value.rxBytes), tx: numOr0(n.value.txBytes) } : null;
    }
    if (j.status === "fulfilled") {
      jvm.value = j.value
        ? { heapUsed: numOr0(j.value.heapUsedBytes), heapMax: numOr0(j.value.heapMaxBytes), heapUsagePercent: numOr0(j.value.heapUsagePercent) }
        : null;
    }
    // 用当前趋势范围而不是写死 24：否则用户选了 6H，切一次监控项就被打回 24H，
    // 图上点数突变、标题却还写着「近6H」。实时档（0）在监控项口径下仍按 24H 取，
    // 因为监控项没有「仅本次会话」的序列。
    const histHours = trendHours.value || 24;
    const [ch, mh, nh, jh] = await Promise.allSettled([
      getCpuHistory(id, histHours), getMemoryHistory(id, histHours),
      getNetworkHistory(id, histHours), getJvmHistory(id, histHours),
    ]);
    if (ch.status === "fulfilled") cpuHist.value = (ch.value ?? []).map(r => numOr0(r.cpuUsage));
    if (mh.status === "fulfilled") memHist.value = (mh.value ?? []).map(r => numOr0(r.usagePercent));
    if (nh.status === "fulfilled") netHist.value = (nh.value ?? []).map(r => numOr0(r.txBytes));
    if (jh.status === "fulfilled") jvmHist.value = (jh.value ?? []).map(r => numOr0(r.heapUsagePercent));
  } catch (e) { error.value = String((e as Error)?.message ?? e); }
  finally { loading.value = false; }
}
/** 清空仪表与趋势，避免显示上一台主机/上一个监控项的数据 */
function resetMetrics(): void {
  cpu.value = null;
  mem.value = null;
  disk.value = [];
  net.value = null;
  jvm.value = null;
  diskRead.value = 0; diskWrite.value = 0;
  software.value = [];
  cpuHist.value = [];
  memHist.value = [];
  diskHist.value = [];
  diskReadHist.value = [];
  diskWriteHist.value = [];
  netHist.value = [];
  jvmHist.value = [];
}
/**
 * 解析资产聚合详情：主机名 + 名下监控项，并把 monitorId 定位到可用监控项
 * @param preferred 优先选中的监控项标识（下拉切换时用）
 */
async function resolveAsset(preferred?: number): Promise<void> {
  try {
    const detail = await getAssetDetail(hostId.value);
    hostName.value = detail?.name ?? "";
    monitors.value = detail?.monitors ?? [];
    const hit = preferred != null
      ? monitors.value.find(m => Number(m.monitorId) === Number(preferred))
      : (monitors.value.find(m => m.enabled !== false) ?? monitors.value[0]);
    const next = hit ? Number(hit.monitorId) : 0;
    if (next === monitorId.value) return;
    monitorId.value = next;
    bindLive();
    await fetchMetrics();
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
  }
}
/** 下拉切换监控项 */
function onMonitorChange(id: number): void {
  void resolveAsset(id);
}

// ---------------- AI 智能分析 ----------------
const aiEnabled = ref(false);
const aiModel = ref("");
const aiDialogVisible = ref(false);
const aiLoading = ref(false);
const aiError = ref("");
const aiResult = ref("");
const aiUsedModel = ref("");
const aiDimension = ref("");
/** 分析重点候选：后端把该值原样拼进提示词的"分析重点"，空值即综合评估 */
const AI_DIMENSIONS = [
  { label: "综合评估", value: "" },
  { label: "CPU 与负载", value: "CPU 使用率与系统负载" },
  { label: "内存压力", value: "内存占用与泄漏风险" },
  { label: "磁盘容量", value: "磁盘使用率与容量趋势" },
  { label: "网络与延迟", value: "网络吞吐与延迟" },
];
/** 按钮可用态：AI 未配置时禁用并在提示里说明原因 */
const aiDisabled = computed(() => !aiEnabled.value || !hostId.value);

/** 读取 AI 配置状态，决定入口是否可用 */
async function loadAiStatus(): Promise<void> {
  try {
    const st = await fetchAiStatus();
    aiEnabled.value = !!st?.enabled;
    aiModel.value = st?.model ?? "";
  } catch {
    aiEnabled.value = false;
  }
}
/** 打开弹窗并发起一次分析 */
function runAiAnalysis(): void {
  aiError.value = "";
  aiResult.value = "";
  aiUsedModel.value = "";
  aiDialogVisible.value = true;
  void requestAnalysis();
}
/** 调用主机指标分析接口（指标快照由后端按 hostId 取，前端不回传） */
async function requestAnalysis(): Promise<void> {
  if (aiLoading.value || !hostId.value) return;
  aiLoading.value = true;
  aiError.value = "";
  aiResult.value = "";
  try {
    const res = await aiAnalyzeHost(hostId.value, { dimension: aiDimension.value || undefined });
    aiResult.value = res?.content ?? "";
    aiUsedModel.value = res?.model ?? "";
    if (!aiResult.value) aiError.value = "模型未返回内容，请稍后重试。";
  } catch (e: unknown) {
    aiError.value = String((e as { message?: string })?.message ?? e);
  } finally {
    aiLoading.value = false;
  }
}

// ---------------- 生命周期 ----------------
watch(() => route.params.id, id => {
  if (props.embedded) return;
  const n = Number(id);
  if (!n || n === hostId.value) return;
  hostId.value = n;
  monitorId.value = 0;
  hostRecord.value = null;
  trendHours.value = 0;   // 换主机回到「实时」，否则选择器写着 6H、图上却只有近 1h 的种子数据
  if (histChart) { histChart.dispose(); histChart = null; }
  resetMetrics();
  resetProfilePager();
  profileRows.value = [];
  void (async () => {
    await loadHostRecord();      // 即时种子
    await loadHostBaseHistory(); // 近1h历史基础
    await resolveAsset();       // 解析监控项（监控项24h覆盖）
    await refreshNow(true);     // 强制新鲜采集（含网络）
    void loadProfileSection();  // 画像分区随主机切换重拉
    void loadFirewallStatus();  // 防火墙状态卡片
  })();
});
/** 嵌入模式：父级切换锁定主机时重新加载全套指标 */
watch(() => props.hostId, id => {
  if (!props.embedded) return;
  const n = Number(id);
  if (!n || n === hostId.value) return;
  hostId.value = n;
  monitorId.value = 0;
  hostRecord.value = null;
  trendHours.value = 0;
  if (histChart) { histChart.dispose(); histChart = null; }
  resetMetrics();
  resetProfilePager();
  profileRows.value = [];
  void (async () => {
    await loadHostRecord();
    await loadHostBaseHistory();
    await resolveAsset();
    await refreshNow(true);
    void loadProfileSection();
    void loadFirewallStatus();
  })();
});
onMounted(() => {
  bindHostMetrics();
  void (async () => {
    await loadHostRecord();
    await loadHostBaseHistory();
    await resolveAsset();
    await refreshNow(true);
    void loadAiStatus();
    void loadProfileSection();
    void loadFirewallStatus();
  })();
});
onBeforeUnmount(() => {
  unsubMetric?.(); unsubHostMetric?.();
  if (histChart) { histChart.dispose(); histChart = null; }
});

// ---------------- 近1h历史基础数据 + 图表历史弹窗 ----------------
/** 进页面先取近 1 小时主机历史，作为趋势基础数据（无监控项也可） */
async function loadHostBaseHistory(): Promise<void> {
  try {
    const rows = await getHostMetricHistory(hostId.value, 1);
    if (!rows.length) return;
    const cpuVals: number[] = [];
    const memVals: number[] = [];
    const diskVals: number[] = [];
    const rVals: number[] = [];
    const wVals: number[] = [];
    for (const r of rows) {
      if (r[1] != null) cpuVals.push(Number(r[1]));
      if (r[2] != null) memVals.push(Number(r[2]));
      if (r[3] != null) diskVals.push(Number(r[3]));
      if (r[4] != null) rVals.push(Number(r[4]));
      if (r[5] != null) wVals.push(Number(r[5]));
    }
    // 仅在无监控项时用主机历史种趋势；监控项的 24h 明细在 fetchMetrics 中覆盖
    if (!monitorId.value) {
      if (cpuVals.length) cpuHist.value = cpuVals.slice(-MAX_LIVE);
      if (memVals.length) memHist.value = memVals.slice(-MAX_LIVE);
      if (diskVals.length) diskHist.value = diskVals.slice(-MAX_LIVE);
      if (rVals.length) diskReadHist.value = rVals.slice(-MAX_LIVE);
      if (wVals.length) diskWriteHist.value = wVals.slice(-MAX_LIVE);
    }
  } catch { /* 静默，实时推送仍可出数 */ }
}

/* ---------------- 趋势时间范围切换（实时 / 1H / 6H / 24H / 7D） ---------------- */

/**
 * 当前趋势范围（小时）。
 *
 * <p>0 表示「实时」：趋势图只吃 socket 推送累积的点，不额外请求历史；
 * 其余档位按小时数拉一次历史并整体替换，切回实时时重新以近 1h 打底。</p>
 */
const trendHours = ref(0);

/**
 * 趋势是否跟随实时推送。
 *
 * <p>两个条件同时成立才算：没有监控项（有监控项时趋势来自监控项明细），
 * 且范围选在「实时」。少了后半句，用户切到 6H 之后 socket 每来一个点就
 * 往历史序列尾部追加一次，图上会多出一段密度完全不同的实时数据。</p>
 */
const trendFollowsLive = computed(() => trendIsRealtime.value && trendHours.value === 0);

/** 范围档位（与后端 metric-history 的 hours 参数一一对应） */
const TREND_RANGES = [
  { label: "实时", value: 0 },
  { label: "1H", value: 1 },
  { label: "6H", value: 6 },
  { label: "24H", value: 24 },
  { label: "7D", value: 168 },
];

/** 趋势卡标题里的范围文案 */
const trendRangeLabel = computed(() => {
  const hit = TREND_RANGES.find(r => r.value === trendHours.value);
  return hit && hit.value !== 0 ? `近${hit.label}` : (trendIsRealtime.value ? "近1H" : "24H");
});

/**
 * 切换趋势时间范围。
 *
 * <p>实时档不请求历史：它代表「看现在的推送」，切过去若还去拉 1h 数据，
 * 图上会突然铺满旧点，和「实时」这个语义对不上。</p>
 *
 * @param hours 小时数（0 = 实时）
 */
async function setTrendHours(hours: number): Promise<void> {
  if (trendHours.value === hours) return;
  trendHours.value = hours;
  if (hours === 0) {
    resetTrendSeries();
    await loadHostBaseHistory();
    return;
  }
  await loadTrendRange(hours);
}

/** 清空趋势序列（切范围前先清，避免旧范围的点混进新图） */
function resetTrendSeries(): void {
  cpuHist.value = [];
  memHist.value = [];
  diskHist.value = [];
  diskReadHist.value = [];
  diskWriteHist.value = [];
  netHist.value = [];
  jvmHist.value = [];
}

/**
 * 按指定小时数拉取趋势序列。
 *
 * <p>监控项与内置指标是两套端点：有监控项走 /monitor 的明细历史（含 JVM），
 * 没监控项走主机内置 metric-history（只有 CPU/内存/磁盘/IO）。</p>
 *
 * @param hours 小时数
 */
async function loadTrendRange(hours: number): Promise<void> {
  const id = monitorId.value;
  if (id) {
    const [ch, mh, nh, jh] = await Promise.allSettled([
      getCpuHistory(id, hours), getMemoryHistory(id, hours), getNetworkHistory(id, hours), getJvmHistory(id, hours),
    ]);
    if (ch.status === "fulfilled") cpuHist.value = (ch.value ?? []).map(r => numOr0(r.cpuUsage));
    if (mh.status === "fulfilled") memHist.value = (mh.value ?? []).map(r => numOr0(r.usagePercent));
    if (nh.status === "fulfilled") netHist.value = (nh.value ?? []).map(r => numOr0(r.txBytes));
    if (jh.status === "fulfilled") jvmHist.value = (jh.value ?? []).map(r => numOr0(r.heapUsagePercent));
    return;
  }
  const rows = await getHostMetricHistory(hostId.value, hours);
  if (!rows.length) { resetTrendSeries(); return; }
  const cpuVals: number[] = [];
  const memVals: number[] = [];
  const diskVals: number[] = [];
  const rVals: number[] = [];
  const wVals: number[] = [];
  for (const r of rows) {
    if (r[1] != null) cpuVals.push(Number(r[1]));
    if (r[2] != null) memVals.push(Number(r[2]));
    if (r[3] != null) diskVals.push(Number(r[3]));
    if (r[4] != null) rVals.push(Number(r[4]));
    if (r[5] != null) wVals.push(Number(r[5]));
  }
  cpuHist.value = cpuVals;
  memHist.value = memVals;
  diskHist.value = diskVals;
  diskReadHist.value = rVals;
  diskWriteHist.value = wVals;
}

/** 历史弹窗指标：单序列百分比（cpu/mem/disk）或双序列磁盘IO（diskio） */
type HostMetricKind = "cpu" | "mem" | "disk" | "diskio";
const histDialogVisible = ref(false);
const histKind = ref<HostMetricKind>("cpu");
const histHours = ref(1);
const histLoading = ref(false);
/** 单序列（百分比） */
const histSeries = ref<[number, number][]>([]);
/** 双序列（磁盘IO，KB/s）：读 / 写 */
const histIoRead = ref<[number, number][]>([]);
const histIoWrite = ref<[number, number][]>([]);
const histRangeOptions = [
  { label: "近1小时", value: 1 },
  { label: "近6小时", value: 6 },
  { label: "近24小时", value: 24 },
  { label: "近7天", value: 168 },
];
const KIND_LABEL: Record<HostMetricKind, string> = {
  cpu: "CPU 使用率", mem: "内存使用率", disk: "磁盘使用率", diskio: "磁盘读写速率",
};
const histTitle = computed(() =>
  `${hostName.value || ("主机 #" + hostId.value)} · ${KIND_LABEL[histKind.value]}`);
const histChartRef = ref<HTMLDivElement>();
let histChart: echarts.ECharts | null = null;
/** 各指标主题色（与趋势 sparkline 一致） */
const HIST_COLOR: Record<Exclude<HostMetricKind, "diskio">, string> = {
  cpu: "#3b82f6", mem: "#8b5cf6", disk: "#f59e0b",
};

/** 点击趋势卡片打开历史弹窗（指标即被点击卡片，弹窗内只选时间范围） */
function openHistDialog(kind: HostMetricKind): void {
  histKind.value = kind;
  histDialogVisible.value = true;
  void fetchHistSeries();
}
/** 弹窗内切换时间范围后重新拉取 */
function onHistHoursChange(v: number | string): void {
  histHours.value = Number(v);
  void fetchHistSeries();
}

/** 按当前指标与时间范围拉取真实历史并渲染大图 */
async function fetchHistSeries(): Promise<void> {
  histLoading.value = true;
  try {
    const rows = await getHostMetricHistory(hostId.value, histHours.value);
    if (histKind.value === "diskio") {
      const rPts: [number, number][] = [];
      const wPts: [number, number][] = [];
      for (const r of rows) {
        if (r[4] != null) rPts.push([Number(r[0]), Number(r[4])]);
        if (r[5] != null) wPts.push([Number(r[0]), Number(r[5])]);
      }
      histIoRead.value = rPts;
      histIoWrite.value = wPts;
    } else {
      const idx = histKind.value === "cpu" ? 1 : histKind.value === "mem" ? 2 : 3;
      const pts: [number, number][] = [];
      for (const r of rows) {
        const v = r[idx];
        if (v != null) pts.push([Number(r[0]), Number(v)]);
      }
      histSeries.value = pts;
    }
    await nextTick(() => renderHistChart());
  } finally { histLoading.value = false; }
}
/** 渲染历史大图 */
function renderHistChart(): void {
  if (!histChartRef.value) return;
  if (!histChart) histChart = echarts.init(histChartRef.value);

  if (histKind.value === "diskio") {
    // 双序列磁盘IO（KB/s）
    histChart.setOption({
      grid: { left: 60, right: 20, top: 36, bottom: 42 },
      legend: {
        top: 6, right: 12, itemWidth: 14, itemHeight: 8, textStyle: { fontSize: 11 },
        data: [
          { name: "读取" }, { name: "写入" },
        ],
      },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: unknown) => fmtKbs(Number(v)),
      },
      xAxis: { type: "time", axisLabel: { fontSize: 10, hideOverlap: true } },
      yAxis: {
        type: "value", min: 0,
        axisLabel: { formatter: (v: number) => v >= 1024 ? `${(v / 1024).toFixed(0)}M` : `${v}K`, fontSize: 10 },
      },
      dataZoom: [
        { type: "inside" },
        { type: "slider", height: 16, bottom: 12 },
      ],
      series: [
        {
          name: "读取", type: "line", data: histIoRead.value, showSymbol: false, smooth: false,
          lineStyle: { color: "#f59e0b", width: 2 }, itemStyle: { color: "#f59e0b" },
          areaStyle: { color: "rgba(245,158,11,0.08)" },
        },
        {
          name: "写入", type: "line", data: histIoWrite.value, showSymbol: false, smooth: false,
          lineStyle: { color: "#06b6d4", width: 2 }, itemStyle: { color: "#06b6d4" },
          areaStyle: { color: "rgba(6,182,212,0.08)" },
        },
      ],
    }, true);
  } else {
    const color = HIST_COLOR[histKind.value as Exclude<HostMetricKind, "diskio">];
    histChart.setOption({
      grid: { left: 48, right: 20, top: 20, bottom: 42 },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: unknown) => `${Number(v).toFixed(1)}%`,
      },
      xAxis: {
        type: "time",
        axisLabel: { fontSize: 10, hideOverlap: true },
      },
      yAxis: {
        type: "value", min: 0, max: 100,
        axisLabel: { formatter: "{value}%", fontSize: 10 },
      },
      dataZoom: [
        { type: "inside" },
        { type: "slider", height: 16, bottom: 12 },
      ],
      series: [{
        type: "line", data: histSeries.value, showSymbol: false, smooth: false,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color + "40" },
            { offset: 1, color: color + "05" },
          ]),
        },
      }],
    }, true);
  }
  histChart.resize();
}
// 关闭弹窗即释放图表实例，重开时重新初始化（避免容器尺寸异常）
watch(histDialogVisible, (v) => {
  if (!v && histChart) { histChart.dispose(); histChart = null; }
});

// ---------------- 磁盘卡片（Windows 风格驱动器磁片） ----------------
function diskCapacityText(r: any): string {
  // 与进度条同口径显示「已用」，避免条子填满 90% 旁边却写「44 GB 可用」而被读成反了
  return `已用 ${fmt(r.used)} · 共 ${fmt(r.total)}`;
}
/** 容量是否紧张（使用率 ≥90%）→ 进度条红色 */
function diskLow(r: any): boolean {
  return Number(r.usagePercent ?? 0) >= 90;
}
function diskUsageWidth(r: any): string {
  return `${Math.max(0, Math.min(100, Number(r.usagePercent ?? 0)))}%`;
}

// ---------------- 软件实例（版式与显示设置由 ScSoftwarePanel 统一承载） ----------------
/** 可见软件类型数：面板按显示设置过滤后回传，页头统计与面板计数保持一致 */
const softwareTypeCount = ref(0);

/**
 * 接收面板回传的可见统计。
 *
 * @param c 可见实例数 / 类型数
 */
function onSwCounts(c: { instanceCount: number; typeCount: number }): void {
  softwareTypeCount.value = c.typeCount;
}

// ---------------- 画像分区（与 HostProfileView 同口径：ports/processes/services/disks/network/env/firewall） ----------------
/** 分区定义：单主机详情无需左侧列表，直接沿用画像分区的列与动作 */
type ProfileSection = "ports" | "processes" | "services" | "disks" | "network" | "env" | "firewall";
const PROFILE_SECTIONS: Array<{ name: ProfileSection; label: string }> = [
  { name: "ports", label: "监听端口" },
  { name: "processes", label: "进程" },
  { name: "services", label: "服务" },
  { name: "disks", label: "磁盘" },
  { name: "network", label: "网络" },
  { name: "env", label: "环境变量" },
  { name: "firewall", label: "防火墙" },
];
/** 当前分区 */
const profileTab = ref<ProfileSection>("disks");
/** 分页（仅 ports/processes/services/firewall 走后端分页） */
const profilePage = ref(1);
const profilePageSize = ref(10);
/** 检索关键字：分页分区走后端跨页匹配，非分页分区走前端过滤 */
const profileKeyword = ref("");
const profileRows = ref<Record<string, any>[]>([]);
/** 后端返回的过滤后总行数（分页分区为 total，非分页分区为当前全量行数） */
const profileTotal = ref(0);
/** 后端是否已达到 500 条采集上限 */
const profileTruncated = ref(false);
const profileLoading = ref(false);
const profileError = ref("");
let profileReq = 0;
/** 进程/服务/监听端口/防火墙由后端分页（后台只回当前页） */
const profilePaged = computed(() =>
  profileTab.value === "processes" || profileTab.value === "services"
  || profileTab.value === "ports" || profileTab.value === "firewall");
/** 分页分区由后端返回当前页；非分页分区在前端过滤（排序由 Profile* 组件内部处理） */
const profileVisibleRows = computed(() => {
  const kw = profileKeyword.value.trim().toLowerCase();
  if (profilePaged.value || !kw) return profileRows.value;
  return profileRows.value.filter(r => Object.values(r).some(v =>
    v !== null && v !== undefined && String(v).toLowerCase().includes(kw)));
});

/** 切分区先归零页码与关键字 */
function resetProfilePager(): void {
  profilePage.value = 1;
  profileKeyword.value = "";
  profileTotal.value = 0;
  profileTruncated.value = false;
}
/** 拉取当前分区 */
async function loadProfileSection(): Promise<void> {
  const req = ++profileReq;
  const hid = hostId.value;
  if (!hid) return;
  profileLoading.value = true;
  profileError.value = "";
  try {
    const sec = profileTab.value;
    const res = await fetchHostProfileSection(hid, sec,
      profilePaged.value ? profilePage.value : undefined,
      profilePaged.value ? profilePageSize.value : undefined,
      profilePaged.value ? profileKeyword.value.trim() || undefined : undefined);
    if (req !== profileReq || hid !== hostId.value) return;
    // 兼容两种返回：新后端为 { rows, total, truncated }，旧后端为裸数组
    const rows = Array.isArray(res) ? res : (Array.isArray(res?.rows) ? res.rows : []);
    profileRows.value = rows;
    profileTotal.value = Array.isArray(res) ? rows.length
      : (typeof res.total === "number" ? res.total : rows.length);
    profileTruncated.value = !Array.isArray(res) && !!res.truncated;
    if (profilePaged.value && profilePage.value > 1 && profilePageSize.value * (profilePage.value - 1) >= profileTotal.value) {
      profilePage.value = Math.max(1, Math.ceil(profileTotal.value / profilePageSize.value));
    }
  } catch (e) {
    if (req !== profileReq) return;
    profileError.value = String((e as Error)?.message ?? e);
  } finally {
    if (req === profileReq) profileLoading.value = false;
  }
}
function pickProfileTab(name: ProfileSection): void {
  profileTab.value = name;
  resetProfilePager();
  profileRows.value = [];
  void loadProfileSection();
}
function changeProfilePage(delta: number): void {
  const next = profilePage.value + delta;
  if (next < 1) return;
  profilePage.value = next;
  void loadProfileSection();
}

/** 正在执行动作的行键（同一时刻只允许一个远端写操作） */
const profileBusyRow = ref("");
/** 环境变量新增弹窗 */
const profileEnvDialog = ref(false);
const profileEnvForm = ref<{ name: string; value: string }>({ name: "", value: "" });
/** 执行一次远端写操作：成功回显后端文案并重拉分区；失败由传输层统一提示 */
async function runProfileAction(key: string, task: Promise<string>): Promise<boolean> {
  profileBusyRow.value = key;
  try {
    const msg = await task;
    message.success(String(msg || "操作已完成"));
    await loadProfileSection();
    return true;
  } catch {
    return false;
  } finally {
    profileBusyRow.value = "";
  }
}
/** 破坏性动作前确认，取消返回 false */
async function confirmProfileAction(message: string): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, "操作确认", {
      type: "warning", confirmButtonText: "确定", cancelButtonText: "取消",
    });
    return true;
  } catch {
    return false;
  }
}
/** 提交新增环境变量 */
async function submitProfileEnv(): Promise<void> {
  const name = profileEnvForm.value.name.trim();
  if (!name) { message.warning("请填写变量名"); return; }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    message.warning("变量名只能包含字母、数字、下划线，且不能以数字开头"); return;
  }
  const ok = await runProfileAction(`env-set-${name}`,
    setHostEnvVar(hostId.value, name, profileEnvForm.value.value));
  if (ok) { profileEnvDialog.value = false; profileEnvForm.value = { name: "", value: "" }; }
}

/** 删除环境变量（ProfileEnv @remove） */
async function onProfileDeleteEnv(row: Record<string, any>): Promise<void> {
  const name = String(row.name ?? "");
  if (!await confirmProfileAction(`确定删除系统级环境变量 ${name}？`)) return;
  await runProfileAction(`env-del-${name}`, deleteHostEnvVar(hostId.value, name));
}

/** 复制文本（ProfileEnv @copy；剪贴板 API 不可用时回退到临时 textarea） */
async function copyText(text: string, label: string): Promise<void> {
  const ok = (() => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand("copy");
      return true;
    } catch { return false; }
    finally { document.body.removeChild(el); }
  })();
  if (ok) message.success(`${label || "内容"}已复制`);
  else message.warning("复制失败，请手动选择文本");
}

/** 结束进程（ProfileProcesses @kill） */
async function onProfileKill(row: Record<string, any>): Promise<void> {
  if (!await confirmProfileAction(`确定结束进程 ${row.name ?? ""}（PID ${row.pid}）？该操作不可恢复。`)) return;
  await runProfileAction(`kill-${row.pid}`, killProcess(Number(row.pid), hostId.value));
}

/** 重启进程（ProfileProcesses @restart） */
async function onProfileRestart(row: Record<string, any>): Promise<void> {
  if (!await confirmProfileAction(`确定重启进程 ${row.name ?? ""}（PID ${row.pid}）？`)) return;
  await runProfileAction(`restart-${row.pid}`, restartHostProcess(Number(row.pid), hostId.value));
}

/** 服务启停（ProfileServices @start/@stop/@restart） */
async function onProfileService(row: Record<string, any>, action: "start" | "stop" | "restart"): Promise<void> {
  const label = action === "start" ? "启动" : action === "stop" ? "停止" : "重启";
  if (action !== "start" && !await confirmProfileAction(`确定${label}服务 ${row.displayName || row.name}？`)) return;
  const call = action === "start" ? startService : action === "stop" ? stopService : restartService;
  await runProfileAction(`service-${action}-${row.name}`, call(String(row.name), hostId.value));
}

/** 关闭占用端口的进程（ProfilePorts @close） */
async function onProfileClosePort(row: Record<string, any>): Promise<void> {
  if (!await confirmProfileAction(`确定结束 PID ${row.pid}？它正占用 ${row.protocol ?? ""} ${row.port}。`)) return;
  await runProfileAction(`netproc-${row.pid}-${row.port}`,
    closeNetProcess(Number(row.pid), Number(row.port) || undefined, hostId.value));
}

/** 网卡配置下发后重拉分区（ProfileNetwork @applied） */
function onProfileNetworkApplied(): void {
  void loadProfileSection();
}

/** 检索输入过程：只更新本地关键字（非分页分区立即前端过滤），不触发请求（Profile* @search） */
function onProfileSearch(kw: string): void {
  profileKeyword.value = kw;
}
/** 检索确认（回车/点搜索/清空）：分页分区重发请求（Profile* @commit） */
function onProfileCommit(kw: string): void {
  profileKeyword.value = kw;
  profilePage.value = 1;
  void loadProfileSection();
}
</script>

<template>
  <div class="hd tel-page" :class="{ 'is-embedded': embedded }">
    <!-- 页头（外壳浅色区域，保持与整体一致）；嵌入到工作区时由外壳提供 -->
    <ReSectionHead v-if="!embedded" :description="`主机 #${hostId} · 实时遥测与趋势`">
      <template #title>{{ hostName || `主机 #${hostId}` }}</template>
      <template #actions>
        <ReButton icon="Back" :show-text="true" @click="router.push('/assets')">资产</ReButton>
        <ReButton icon="RefreshRight" :show-text="true" :loading="loading" @click="refreshNow()">刷新</ReButton>
        <ReButton
          icon="MagicStick" :show-text="true" :disabled="aiDisabled"
          :title="aiDisabled ? '未配置 AI 模型，请先在系统配置中接入' : '按主机指标调用大模型分析'"
          @click="runAiAnalysis"
        >AI 分析</ReButton>
        <ReButton icon="Connection" :show-text="true" type="primary" @click="router.push({ path: '/terminal', query: { hostId: String(hostId) } })">连接远控</ReButton>
      </template>
    </ReSectionHead>

    <div v-if="error && (monitorId || hasHostMetrics)" class="hd-error">
      <span>部分数据加载失败：{{ error }}</span>
      <ReButton icon="RefreshRight" type="primary" :show-text="true" @click="refreshNow()">重试</ReButton>
    </div>

    <!-- ================= 遥测控制台 ================= -->
    <div class="panel">
      <!-- 面板头 -->
      <header class="ph">
        <div class="ph-left">
          <div class="ph-idx">HOST · {{ String(hostId).padStart(3, "0") }}</div>
          <div class="ph-title">{{ hostName || `主机 #${hostId}` }}</div>
          <div class="ph-meta">
            <span>CPU {{ cpu?.cores ? cpu.cores + " 核" : "—" }}</span>
            <i class="dot-sep"></i>
            <span>内存 {{ mem?.total ? fmt(mem.total) : "—" }}</span>
            <i class="dot-sep"></i>
            <span>软件 {{ softwareTypeCount || "—" }} 类</span>
          </div>
          <div v-if="monitors.length" class="ph-monitor">
            <span class="pm-k">监控项</span>
            <ReSelect
              :model-value="monitorId" class="pm-sel"
              :options="monitors.map(m => ({ label: `${m.name || ('#' + m.monitorId)}（告警 ${m.activeAlarmCount ?? 0}）`, value: Number(m.monitorId) }))"
              @change="onMonitorChange(Number($event))"
            />
            <span class="pm-hint">指标按监控项存储，切换后下方仪表与趋势随之刷新</span>
          </div>
        </div>
        <div class="ph-right">
          <span class="live" :class="{ on: liveActive }"><i class="live-dot"></i>LIVE</span>
          <div class="ph-stat">
            <span class="stat-k">推送</span>
            <b class="stat-v">{{ pushCount }}</b>
            <span class="stat-sep"></span>
            <span class="stat-k">最后</span>
            <b class="stat-v mono">{{ lastPushText }}</b>
          </div>
          <span class="sock" :class="{ ok: sockOn }">{{ sockOn ? "● 实时已连接" : "○ 实时未连接" }}</span>
          <button class="btn-refresh" :disabled="loading" @click="refreshNow()">
            <i class="ico" :class="{ spin: loading }"></i>刷新
          </button>
        </div>
      </header>
      <div class="scanline"></div>

      <!-- 既无监控项、也从未成功采到内置指标：不给全 0 假仪表，区分「采集失败」与「未配置」 -->
      <div v-if="!monitorId && !hasHostMetrics" class="no-monitor">
        <template v-if="error">
          <b>主机当前不可采集</b>
          <span>{{ error }}。请检查主机采集方式、端口与凭据，或确认 Agent 是否已部署并运行。</span>
          <ReButton type="primary" :show-text="true" :loading="loading" @click="refreshNow()">重新连接</ReButton>
        </template>
        <template v-else>
          <b>该主机尚未关联监控项</b>
          <span>遥测指标按监控项存储。请到「监控配置」新建监控项并绑定本机，或开启主机采集以获取内置 CPU/内存/磁盘指标。</span>
          <ReButton type="primary" :show-text="true" @click="router.push('/config')">去配置监控项</ReButton>
        </template>
      </div>

      <template v-else>
      <!-- 无监控项但有内置指标：软提示，不阻断仪表 -->
      <div v-if="!monitorId" class="builtin-hint">
        <span>当前显示主机内置实时指标（CPU / 内存 / 磁盘 / 磁盘IO / 网络 / 软件）；配置监控项后可获得 JVM 堆与 24h 历史。</span>
        <ReButton icon="Setting" text :show-text="true" @click="router.push('/config')">配置监控项</ReButton>
      </div>
      <!-- 实时仪表（响应式自适应） -->
      <section class="gauge-grid">
        <!-- CPU -->
        <div class="gauge" :class="{ hot: heat(cpuPct) === 1, danger: heat(cpuPct) === 2 }">
          <div class="g-ring">
            <svg viewBox="0 0 120 120" class="g-svg">
              <g class="ticks">
                <line v-for="t in ticks" :key="t" :class="{ major: t % 15 === 0 }"
                  :transform="`rotate(${t * 6} 60 60)`" x1="60" y1="8" x2="60" y2="13" />
              </g>
              <circle class="ring-bg" cx="60" cy="60" r="50" />
              <circle class="ring-fg" cx="60" cy="60" r="50" :style="ringStyle(cpuPct)" transform="rotate(-90 60 60)" />
            </svg>
            <div class="g-center"><b class="g-num mono">{{ num(cpuPct) }}</b><span class="g-unit">%</span></div>
          </div>
          <div class="g-label">CPU</div>
          <div class="g-sub mono">{{ cpu?.cores ? cpu.cores + " CORE" : "—" }}</div>
        </div>

        <!-- 内存 -->
        <div class="gauge" :class="{ hot: heat(memPct) === 1, danger: heat(memPct) === 2 }">
          <div class="g-ring">
            <svg viewBox="0 0 120 120" class="g-svg">
              <g class="ticks">
                <line v-for="t in ticks" :key="t" :class="{ major: t % 15 === 0 }"
                  :transform="`rotate(${t * 6} 60 60)`" x1="60" y1="8" x2="60" y2="13" />
              </g>
              <circle class="ring-bg" cx="60" cy="60" r="50" />
              <circle class="ring-fg mem" cx="60" cy="60" r="50" :style="ringStyle(memPct)" transform="rotate(-90 60 60)" />
            </svg>
            <div class="g-center"><b class="g-num mono">{{ num(memPct) }}</b><span class="g-unit">%</span></div>
          </div>
          <div class="g-label">内存</div>
          <div class="g-sub mono">{{ fmt(mem?.usage) }}/{{ fmt(mem?.total) }}</div>
        </div>

        <!-- 磁盘容量 -->
        <div class="gauge" :class="{ hot: heat(diskPct) === 1, danger: heat(diskPct) === 2 }">
          <div class="g-ring">
            <svg viewBox="0 0 120 120" class="g-svg">
              <g class="ticks">
                <line v-for="t in ticks" :key="t" :class="{ major: t % 15 === 0 }"
                  :transform="`rotate(${t * 6} 60 60)`" x1="60" y1="8" x2="60" y2="13" />
              </g>
              <circle class="ring-bg" cx="60" cy="60" r="50" />
              <circle class="ring-fg disk" cx="60" cy="60" r="50" :style="ringStyle(diskPct)" transform="rotate(-90 60 60)" />
            </svg>
            <div class="g-center"><b class="g-num mono">{{ num(diskPct) }}</b><span class="g-unit">%</span></div>
          </div>
          <div class="g-label">磁盘容量</div>
          <div class="g-sub mono">{{ disk.length }} MOUNT</div>
        </div>

        <!-- 磁盘IO -->
        <div class="gauge">
          <div class="g-ring">
            <svg viewBox="0 0 120 120" class="g-svg">
              <g class="ticks">
                <line v-for="t in ticks" :key="t" :class="{ major: t % 15 === 0 }"
                  :transform="`rotate(${t * 6} 60 60)`" x1="60" y1="8" x2="60" y2="13" />
              </g>
              <circle class="ring-bg" cx="60" cy="60" r="50" />
            </svg>
            <div class="g-center io-c">
              <span class="io-row"><i class="io-k">R</i><b class="mono">{{ diskRead >= 1024 ? (diskRead / 1024).toFixed(1) + 'M' : diskRead.toFixed(0) + 'K' }}</b></span>
              <span class="io-row"><i class="io-k">W</i><b class="mono">{{ diskWrite >= 1024 ? (diskWrite / 1024).toFixed(1) + 'M' : diskWrite.toFixed(0) + 'K' }}</b></span>
            </div>
          </div>
          <div class="g-label">磁盘 IO</div>
          <div class="g-sub mono">READ / WRITE</div>
        </div>

        <!-- 网络（画像采集即有速率） -->
        <div class="gauge">
          <div class="g-ring net">
            <svg viewBox="0 0 120 120" class="g-svg">
              <g class="ticks">
                <line v-for="t in ticks" :key="t" :class="{ major: t % 15 === 0 }"
                  :transform="`rotate(${t * 6} 60 60)`" x1="60" y1="8" x2="60" y2="13" />
              </g>
              <circle class="ring-bg" cx="60" cy="60" r="50" />
            </svg>
            <div class="g-center net-c">
              <span class="net-dir"><i class="rx-arr"></i><b class="mono">{{ fmt(net?.rx) }}</b></span>
              <span class="net-dir"><i class="tx-arr"></i><b class="mono">{{ fmt(net?.tx) }}</b></span>
            </div>
          </div>
          <div class="g-label">网络</div>
          <div class="g-sub mono">RX / TX</div>
        </div>

        <!-- JVM（需监控项明细） -->
        <div v-if="monitorId" class="gauge" :class="{ hot: heat(jvmPct) === 1, danger: heat(jvmPct) === 2 }">
          <div class="g-ring">
            <svg viewBox="0 0 120 120" class="g-svg">
              <g class="ticks">
                <line v-for="t in ticks" :key="t" :class="{ major: t % 15 === 0 }"
                  :transform="`rotate(${t * 6} 60 60)`" x1="60" y1="8" x2="60" y2="13" />
              </g>
              <circle class="ring-bg" cx="60" cy="60" r="50" />
              <circle class="ring-fg jvm" cx="60" cy="60" r="50" :style="ringStyle(jvmPct)" transform="rotate(-90 60 60)" />
            </svg>
            <div class="g-center"><b class="g-num mono">{{ jvm ? num(jvmPct) : "—" }}</b><span class="g-unit">%</span></div>
          </div>
          <div class="g-label">JVM</div>
          <div class="g-sub mono">{{ fmt(jvm?.heapUsed) }}/{{ fmt(jvm?.heapMax) }}</div>
        </div>
      </section>

      <!-- 信息卡片：Uptime / 系统信息 / 温度 / 防火墙 / Cron Jobs -->
      <section class="info-cards">
        <!-- Uptime -->
        <div class="info-card">
          <div class="ic-icon uptime">
            <ReIcon name="Timer" :size="16" />
          </div>
          <div class="ic-body">
            <div class="ic-label">UPTIME</div>
            <div class="ic-value mono">{{ hostUptime > 0 ? fmtUptime(hostUptime) : "—" }}</div>
            <div class="ic-sub">{{ hostUptime > 0 ? `${Math.floor(hostUptime / 86400)} 天 ${Math.floor((hostUptime % 86400) / 3600)} 小时` : "未采集" }}</div>
          </div>
        </div>

        <!-- System Information -->
        <div class="info-card">
          <div class="ic-icon sys">
            <ReIcon name="Monitor" :size="16" />
          </div>
          <div class="ic-body">
            <div class="ic-label">系统信息</div>
            <div class="ic-value">{{ hostOsInfo.osType || "—" }}</div>
            <div class="ic-sub mono">
              {{ hostOsInfo.arch ? `${hostOsInfo.arch} · ` : "" }}{{ hostOsInfo.cpuCores }}C
              {{ hostOsInfo.memoryMb ? ` · ${(hostOsInfo.memoryMb / 1024).toFixed(0)}G` : "" }}
            </div>
            <div v-if="hostOsInfo.javaVersion" class="ic-sub">Java {{ hostOsInfo.javaVersion }}</div>
            <div v-if="hostOsInfo.gpuModel" class="ic-sub">GPU {{ hostOsInfo.gpuModel }}</div>
          </div>
        </div>

        <!-- Temperature -->
        <div class="info-card">
          <div class="ic-icon temp">
            <ReIcon name="Sunny" :size="16" />
          </div>
          <div class="ic-body">
            <div class="ic-label">温度</div>
            <div class="ic-value mono">—</div>
            <div class="ic-sub">未采集</div>
          </div>
        </div>

        <!-- Firewall Status -->
        <div class="info-card">
          <div class="ic-icon firewall" :class="{ on: hostFirewallOn }">
            <ReIcon name="Lock" :size="16" />
          </div>
          <div class="ic-body">
            <div class="ic-label">防火墙</div>
            <div class="ic-value">{{ hostFirewallOn ? "已启用" : "未检测" }}</div>
            <div class="ic-sub">{{ hostFirewallRules > 0 ? `${hostFirewallRules} 条规则` : "" }}</div>
          </div>
        </div>

        <!-- Cron Jobs -->
        <div class="info-card">
          <div class="ic-icon cron">
            <ReIcon name="AlarmClock" :size="16" />
          </div>
          <div class="ic-body">
            <div class="ic-label">CRON JOBS</div>
            <div class="ic-value mono">—</div>
            <div class="ic-sub">未采集</div>
          </div>
        </div>
      </section>

      <!-- 趋势（点击卡片弹窗，弹窗内只选时间段，口径与外侧一致） -->
      <div class="trend-range">
        <span class="tr-label">趋势范围</span>
        <div class="tr-seg">
          <button
            v-for="r in TREND_RANGES"
            :key="r.value"
            type="button"
            class="tr-btn"
            :class="{ on: trendHours === r.value }"
            @click="setTrendHours(r.value)"
          >{{ r.label }}</button>
        </div>
        <span class="tr-hint">点击任一趋势卡可打开大图</span>
      </div>

      <section class="trend-grid">
        <div class="trend clickable" title="点击查看 CPU 历史" @click="openHistDialog('cpu')">
          <div class="t-head">
            <span class="t-label">CPU · {{ trendRangeLabel }}</span>
            <span class="t-right"><span class="t-now mono">{{ trendLast(cpuHist) }}%</span><i class="t-zoom"></i></span>
          </div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <defs><linearGradient id="tg-cpu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6" stop-opacity=".30"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></linearGradient></defs>
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polygon class="t-area" :points="area(cpuHist)" fill="url(#tg-cpu)" />
            <polyline class="t-line cpu" :points="spark(cpuHist)" />
          </svg>
          <div class="t-foot mono"><span>MIN {{ trendMin(cpuHist) }}</span><span>MAX {{ trendMax(cpuHist) }}</span></div>
        </div>

        <div class="trend clickable" title="点击查看内存历史" @click="openHistDialog('mem')">
          <div class="t-head">
            <span class="t-label">内存 · {{ trendRangeLabel }}</span>
            <span class="t-right"><span class="t-now mono">{{ trendLast(memHist) }}%</span><i class="t-zoom"></i></span>
          </div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <defs><linearGradient id="tg-mem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".30"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient></defs>
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polygon class="t-area" :points="area(memHist)" fill="url(#tg-mem)" />
            <polyline class="t-line mem" :points="spark(memHist)" />
          </svg>
          <div class="t-foot mono"><span>MIN {{ trendMin(memHist) }}</span><span>MAX {{ trendMax(memHist) }}</span></div>
        </div>

        <div class="trend clickable" title="点击查看磁盘容量历史" @click="openHistDialog('disk')">
          <div class="t-head">
            <span class="t-label">磁盘容量 · {{ trendRangeLabel }}</span>
            <span class="t-right"><span class="t-now mono">{{ trendLast(diskHist) }}%</span><i class="t-zoom"></i></span>
          </div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <defs><linearGradient id="tg-disk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f59e0b" stop-opacity=".30"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></linearGradient></defs>
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polygon class="t-area" :points="area(diskHist)" fill="url(#tg-disk)" />
            <polyline class="t-line disk" :points="spark(diskHist)" />
          </svg>
          <div class="t-foot mono"><span>MIN {{ trendMin(diskHist) }}</span><span>MAX {{ trendMax(diskHist) }}</span></div>
        </div>

        <!-- 磁盘IO（双序列，点击查看读写历史） -->
        <div class="trend clickable" title="点击查看磁盘读写历史" @click="openHistDialog('diskio')">
          <div class="t-head">
            <span class="t-label">磁盘 IO · {{ trendRangeLabel }}</span>
            <span class="t-right"><i class="t-zoom"></i></span>
          </div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polyline class="t-line io-r" :points="ioSpark('read')" />
            <polyline class="t-line io-w" :points="ioSpark('write')" />
          </svg>
          <div class="t-foot io-legend mono">
            <span><i class="lg-dot r"></i>R {{ ioLastRead }}</span>
            <span><i class="lg-dot w"></i>W {{ ioLastWrite }}</span>
          </div>
        </div>

        <div v-if="monitorId" class="trend">
          <div class="t-head"><span class="t-label">JVM · {{ trendRangeLabel }}</span><span class="t-now mono">{{ trendLast(jvmHist) }}%</span></div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <defs><linearGradient id="tg-jvm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14b8a6" stop-opacity=".30"/><stop offset="1" stop-color="#14b8a6" stop-opacity="0"/></linearGradient></defs>
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polygon class="t-area" :points="area(jvmHist)" fill="url(#tg-jvm)" />
            <polyline class="t-line jvm" :points="spark(jvmHist)" />
          </svg>
          <div class="t-foot mono"><span>MIN {{ trendMin(jvmHist) }}</span><span>MAX {{ trendMax(jvmHist) }}</span></div>
        </div>

        <div class="trend">
          <div class="t-head"><span class="t-label">网络 · {{ trendHours === 0 ? "实时" : trendRangeLabel }}</span><span class="t-now mono">{{ netLast(netHist) }}</span></div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <defs><linearGradient id="tg-net" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06b6d4" stop-opacity=".30"/><stop offset="1" stop-color="#06b6d4" stop-opacity="0"/></linearGradient></defs>
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polygon class="t-area" :points="area(netHist)" fill="url(#tg-net)" />
            <polyline class="t-line net" :points="spark(netHist)" />
          </svg>
          <div class="t-foot mono"><span>MIN {{ netMin(netHist) }}</span><span>MAX {{ netMax(netHist) }}</span></div>
        </div>
      </section>

      <!-- 软件实例（与「软件实例」页签共用 ScSoftwarePanel，版式与显示设置只有一份） -->
      <ScSoftwarePanel
        v-if="software.length"
        class="sw-block"
        :instances="software"
        @counts="onSwCounts"
      />

      <!-- 画像分区（复用 HostProfileView 同款 Profile* 组件，走 /ms/server/host/profile/{hostId}/{section}） -->
      <section class="profile-panel">
        <div class="pp-head">
          <span class="pp-title">画像分区</span>
          <div class="pp-tabs">
            <button
              v-for="s in PROFILE_SECTIONS" :key="s.name"
              class="pp-tab" :class="{ on: profileTab === s.name }"
              @click="pickProfileTab(s.name)"
            >{{ s.label }}</button>
          </div>
        </div>

        <!-- 磁盘：容量环卡片，点卡片打开该盘根目录 -->
        <ProfileDisks
          v-if="profileTab === 'disks'"
          :rows="profileVisibleRows"
          :keyword="profileKeyword"
          :loading="profileLoading"
          :error="profileError"
          :total="profileVisibleRows.length"
          @search="onProfileSearch"
          @commit="onProfileCommit"
          @refresh="loadProfileSection"
        />

        <!-- 进程：排名条 + 展开详情 -->
        <ProfileProcesses
          v-else-if="profileTab === 'processes'"
          :rows="profileVisibleRows"
          :keyword="profileKeyword"
          :loading="profileLoading"
          :error="profileError"
          paged
          :page="profilePage"
          :page-size="profilePageSize"
          :total="profileTotal"
          :truncated="profileTruncated"
          :busy-key="profileBusyRow"
          @search="onProfileSearch"
          @commit="onProfileCommit"
          @page="changeProfilePage"
          @refresh="loadProfileSection"
          @restart="onProfileRestart"
          @kill="onProfileKill"
        />

        <!-- 服务：运行中 / 已停止 双列 -->
        <ProfileServices
          v-else-if="profileTab === 'services'"
          :rows="profileVisibleRows"
          :keyword="profileKeyword"
          :loading="profileLoading"
          :error="profileError"
          paged
          :page="profilePage"
          :page-size="profilePageSize"
          :total="profileTotal"
          :truncated="profileTruncated"
          :busy-key="profileBusyRow"
          @search="onProfileSearch"
          @commit="onProfileCommit"
          @page="changeProfilePage"
          @refresh="loadProfileSection"
          @start="(r: Record<string, any>) => onProfileService(r, 'start')"
          @stop="(r: Record<string, any>) => onProfileService(r, 'stop')"
          @restart="(r: Record<string, any>) => onProfileService(r, 'restart')"
        />

        <!-- 监听端口：按协议分组的端口块 -->
        <ProfilePorts
          v-else-if="profileTab === 'ports'"
          :rows="profileVisibleRows"
          :keyword="profileKeyword"
          :loading="profileLoading"
          :error="profileError"
          paged
          :page="profilePage"
          :page-size="profilePageSize"
          :total="profileTotal"
          :truncated="profileTruncated"
          :busy-key="profileBusyRow"
          @search="onProfileSearch"
          @commit="onProfileCommit"
          @page="changeProfilePage"
          @refresh="loadProfileSection"
          @close="onProfileClosePort"
        />

        <!-- 网络：网卡总览卡 + 原有配置能力 -->
        <ProfileNetwork
          v-else-if="profileTab === 'network'"
          :host-id="hostId"
          :rows="profileRows"
          :platform="hostRecord?.serverHostOsType"
          :loading="profileLoading"
          :error="profileError"
          @refresh="loadProfileSection"
          @applied="onProfileNetworkApplied"
        />

        <!-- 环境变量：键值台账 -->
        <ProfileEnv
          v-else-if="profileTab === 'env'"
          :rows="profileVisibleRows"
          :keyword="profileKeyword"
          :loading="profileLoading"
          :error="profileError"
          :busy-key="profileBusyRow"
          @search="onProfileSearch"
          @commit="onProfileCommit"
          @refresh="loadProfileSection"
          @add="profileEnvDialog = true"
          @remove="onProfileDeleteEnv"
          @copy="copyText"
        />

        <!-- 防火墙：方向优先的规则行 -->
        <ProfileFirewall
          v-else
          :rows="profileVisibleRows"
          :keyword="profileKeyword"
          :loading="profileLoading"
          :error="profileError"
          paged
          :page="profilePage"
          :page-size="profilePageSize"
          :total="profileTotal"
          :truncated="profileTruncated"
          @search="onProfileSearch"
          @commit="onProfileCommit"
          @page="changeProfilePage"
          @refresh="loadProfileSection"
        />
      </section>

      <!-- 磁盘（Windows「此电脑」风格驱动器磁片，响应式自适应） -->
      <section class="disk-panel">
        <div class="dp-head"><span class="dp-title">磁盘驱动器</span><span class="dp-count mono">{{ disk.length }} DEVICE</span></div>
        <div class="drive-grid">
          <div v-for="(r, i) in disk" :key="i" class="drive-tile" :class="{ low: diskLow(r) }">
            <svg class="drive-ico" viewBox="0 0 48 48" aria-hidden="true">
              <path class="di-body" d="M6 16 h36 a3 3 0 0 1 3 3 v14 a3 3 0 0 1-3 3 H6 a3 3 0 0 1-3-3 V19 a3 3 0 0 1 3-3 z"/>
              <rect class="di-slot" x="9" y="20" width="22" height="4" rx="1.5"/>
              <circle class="di-led" cx="39" cy="22" r="2.2"/>
              <rect class="di-base" x="9" y="29" width="30" height="3" rx="1.5"/>
            </svg>
            <div class="drive-info">
              <div class="drive-name" :title="r.mount || ''">{{ r.mount || "—" }}</div>
              <div class="drive-bar"><div class="drive-fill" :style="{ width: diskUsageWidth(r) }" /></div>
              <div class="drive-cap">{{ diskCapacityText(r) }}</div>
            </div>
          </div>
          <div v-if="disk.length === 0" class="empty drive-empty">暂无磁盘数据</div>
        </div>
      </section>
      </template>
    </div>

    <!-- AI 智能分析弹窗 -->
    <ReDialog v-model="aiDialogVisible" title="AI 主机指标智能分析" width="700px">
      <div class="ai-bar">
        <span class="ai-bar-k">分析重点</span>
        <ReSelect v-model="aiDimension" class="ai-bar-sel" :options="AI_DIMENSIONS" />
        <ReButton type="primary" :show-text="true" :loading="aiLoading" @click="requestAnalysis">
          {{ aiResult || aiError ? "重新分析" : "开始分析" }}
        </ReButton>
        <span class="ai-bar-hint">指标快照与趋势由后端按主机取数，前端不回传</span>
      </div>

      <div v-if="!aiEnabled" class="ai-state">
        <b>AI 分析未启用</b>
        <span>未检测到可用的模型配置，请先到「系统配置 → AI 设置」接入模型后再试。</span>
        <ReButton :show-text="true" @click="router.push('/system-config')">前往配置</ReButton>
      </div>
      <div v-else-if="aiLoading" class="ai-state">
        <el-icon class="is-loading ai-spin"><Loading /></el-icon>
        <span>AI 正在分析主机 {{ hostName || `#${hostId}` }} 的指标，请稍候…</span>
      </div>
      <div v-else-if="aiError" class="ai-state is-error">
        <b>分析失败</b>
        <span>{{ aiError }}</span>
      </div>
      <div v-else-if="aiResult" class="ai-result">
        <pre class="ai-content">{{ aiResult }}</pre>
        <div class="ai-meta">
          <span>模型：{{ aiUsedModel || aiModel || "默认模型" }}</span>
          <span>对象：{{ hostName || `#${hostId}` }}（监控项 #{{ monitorId }}）</span>
        </div>
      </div>
      <div v-else class="ai-state">
        <span>点击上方「开始分析」生成主机指标诊断结论。</span>
      </div>
    </ReDialog>

    <!-- 历史数据弹窗：只保留时间范围过滤，指标由被点击卡片确定 -->
    <ReDialog v-model="histDialogVisible" :title="histTitle" width="860px">
      <div class="hist-bar">
        <ReSelect
          :model-value="histHours" class="hist-sel"
          :options="histRangeOptions"
          @change="onHistHoursChange"
        />
        <span class="hist-hint">数据来自主机采集历史，按主机维度持久化，口径与外侧卡片一致</span>
      </div>
      <div class="hist-canvas-wrap">
        <div v-if="histLoading" class="hist-loading">
          <el-icon class="is-loading"><Loading /></el-icon><span>正在加载历史数据…</span>
        </div>
        <div v-else-if="!histSeries.length && !(histIoRead.length || histIoWrite.length)" class="hist-loading">
          <span>该时间段内暂无历史数据，请确认主机已开启自动采集。</span>
        </div>
        <div ref="histChartRef" class="hist-canvas" />
      </div>
    </ReDialog>

    <!-- 画像分区：新增系统级环境变量 -->
    <ReDialog v-model="profileEnvDialog" title="新增系统级环境变量" width="520px">
      <div class="swdet">
        <label class="sub-label">变量名</label>
        <el-input v-model="profileEnvForm.name" placeholder="如 JAVA_HOME，字母/数字/下划线" spellcheck="false" />
        <label class="sub-label">变量值</label>
        <el-input v-model="profileEnvForm.value" type="textarea" :rows="4" placeholder="系统级持久化：Windows 写入 Machine，Linux 写入 /etc/environment" spellcheck="false" />
      </div>
      <template #footer>
        <ReButton @click="profileEnvDialog = false">取消</ReButton>
        <ReButton type="primary" :loading="profileBusyRow.startsWith('env-set')" @click="submitProfileEnv">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* ================= 遥测面板（浅色） ================= */
.hd {
  --p-bg: #f8fafc;
  --p-bg-2: #ffffff;
  --p-card: #ffffff;
  --p-line: rgba(148, 163, 184, 0.2);
  --p-line-2: rgba(148, 163, 184, 0.1);
  --p-text: #1e293b;
  --p-text-2: #64748b;
  --p-text-3: #94a3b8;
  --p-mono: "JetBrains Mono", "SFMono-Regular", ui-monospace, Consolas, "Liberation Mono", monospace;
  --p-glow: 0 0 12px rgba(59, 130, 246, 0.3);
}
/* 覆盖全局 .tel-page 的固定高度 + overflow:hidden，让外层 .main 出滚动条 */
.hd.tel-page {
  height: auto;
  min-height: 100%;
  overflow: visible;
}
/* 嵌入到工作区页签：由页签面板自己滚，内部不再撑出第二层滚动条 */
.hd.tel-page.is-embedded {
  min-height: 0;
  padding: 12px 14px;
  overflow-y: auto;
}
.hd-error {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; margin-bottom: 16px;
  font-size: 13px; color: var(--status-error-text);
  background: var(--status-error-bg); border: 1px solid var(--status-error-border);
  border-radius: var(--radius-sm);
}

.panel {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(1100px 480px at 12% -12%, var(--el-color-primary-light-8, rgba(109, 93, 252, 0.18)), transparent 62%),
    radial-gradient(900px 440px at 108% 112%, var(--el-color-info-light-8, rgba(6, 182, 212, 0.12)), transparent 60%),
    var(--p-bg);
  border: 1px solid var(--p-line);
  border-radius: 16px;
  padding: 18px 20px 20px;
  color: var(--p-text);
  box-shadow: 0 2px 12px rgba(7, 11, 26, 0.08);
  animation: panelIn 0.45s var(--ease-out, ease) both;
}
/* 背景网格（伪元素叠加，不干扰 radial 光晕） */
.panel::before {
  content: "";
  position: absolute; inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--p-line-2) 1px, transparent 1px),
    linear-gradient(90deg, var(--p-line-2) 1px, transparent 1px);
  background-size: 30px 30px;
  mask-image: radial-gradient(ellipse 90% 80% at 50% 20%, #000 30%, transparent 78%);
}
@keyframes panelIn {
  from { opacity: 0; transform: translateY(10px) scale(0.995); }
  to { opacity: 1; transform: none; }
}

/* ---------- 面板头 ---------- */
.ph {
  position: relative;
  z-index: 1;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  padding-bottom: 14px;
}
.ph-idx {
  font-family: var(--p-mono);
  font-size: 10.5px; letter-spacing: 0.22em;
  color: var(--p-text-3);
}
.ph-title { font-size: 18px; font-weight: 700; margin-top: 3px; letter-spacing: 0.01em; }
.ph-meta {
  display: flex; align-items: center; gap: 8px;
  margin-top: 5px; font-size: 12px; color: var(--p-text-2);
}
.dot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--p-text-3); }
.ph-monitor {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-top: 9px;
}
.pm-k { font-size: 11px; letter-spacing: 0.08em; color: var(--p-text-3); }
.pm-sel { width: 220px; }
.pm-hint { font-size: 11px; color: var(--p-text-3); }
.no-monitor {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
  margin-top: 18px; padding: 22px 20px;
  background: var(--p-card);
  border: 1px dashed var(--p-line); border-radius: 12px;
}
.no-monitor b { font-size: 14px; color: var(--p-text); }
.no-monitor span { font-size: 12.5px; color: var(--p-text-2); line-height: 1.7; }
/* 无监控项但有内置指标的软提示条 */
.builtin-hint {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  margin-top: 4px; padding: 9px 14px;
  font-size: 12px; color: var(--p-text-2);
  background: var(--el-color-info-light-9, rgba(148, 163, 184, 0.1));
  border: 1px solid var(--p-line-2); border-radius: 10px;
}
.builtin-hint span { line-height: 1.5; }
.ph-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.live {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px;
  font-family: var(--p-mono); font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
  color: var(--p-text-3);
  border: 1px solid var(--p-line); border-radius: 999px;
  transition: color 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.live.on {
  color: var(--el-color-success, #4ade80);
  border-color: var(--el-color-success-light-5, rgba(74, 222, 128, 0.45));
  box-shadow: 0 0 14px var(--el-color-success-light-7, rgba(74, 222, 128, 0.22));
}
.live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: currentColor;
}
.live.on .live-dot { animation: livePulse 1.6s ease-in-out infinite; }
@keyframes livePulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--el-color-success-light-5, rgba(74, 222, 128, 0.55)); }
  50% { box-shadow: 0 0 0 5px transparent; }
}

.ph-stat {
  display: inline-flex; align-items: baseline; gap: 6px;
  padding: 4px 10px;
  font-size: 11px; color: var(--p-text-3);
  background: var(--el-color-info-light-9, rgba(148, 163, 184, 0.07));
  border: 1px solid var(--p-line-2); border-radius: 8px;
}
.stat-k { font-size: 11px; color: var(--p-text-3); }
.stat-v { font-size: 12px; color: var(--p-text); font-weight: 600; }
.stat-sep { width: 1px; height: 10px; background: var(--p-line); margin: 0 3px; }
.mono { font-family: var(--p-mono); }

.sock { font-size: 11.5px; color: var(--p-text-3); }
.sock.ok { color: var(--el-color-success, #4ade80); }
.btn-refresh {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px;
  font-size: 12px; color: var(--p-text);
  background: var(--el-color-info-light-9, rgba(148, 163, 184, 0.08));
  border: 1px solid var(--p-line); border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.btn-refresh:hover { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); }
.btn-refresh:disabled { opacity: 0.55; cursor: default; }
.ico {
  width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid var(--el-color-info-light-5, rgba(148, 163, 184, 0.35));
  border-top-color: var(--el-color-primary, #a5b4fc);
}
.ico.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 扫描线（遥测氛围，reduced-motion 时关闭） */
.scanline {
  position: relative;
  z-index: 1;
  height: 1px;
  margin: 0 -20px;
  background: linear-gradient(90deg, transparent, var(--el-color-primary, rgba(109, 93, 252, 0.6)), var(--el-color-info, rgba(6, 182, 212, 0.6)), transparent);
  background-size: 240px 100%;
  background-repeat: no-repeat;
  animation: scan 3.2s ease-in-out infinite;
  opacity: 0.5;
}
@keyframes scan {
  0% { background-position: -260px 0; opacity: 0.2; }
  45% { opacity: 0.85; }
  100% { background-position: calc(100% + 260px) 0; opacity: 0.2; }
}

/* ---------- 仪表（响应式自适应） ---------- */
.gauge-grid {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;
  margin-top: 16px;
}
.gauge {
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 8px 14px;
  background: linear-gradient(180deg, var(--el-color-info-light-9, rgba(148, 163, 184, 0.06)), transparent);
  border: 1px solid var(--p-line-2); border-radius: 12px;
  animation: cardIn 0.4s var(--ease-out, ease) both;
  transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
}
@keyframes cardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.gauge:hover {
  border-color: var(--el-color-info-light-5, rgba(148, 163, 184, 0.3));
  transform: translateY(-2px);
}
.gauge.hot { border-color: var(--el-color-warning-light-5, rgba(245, 158, 11, 0.4)); }
.gauge.danger { border-color: var(--el-color-danger-light-5, rgba(239, 68, 68, 0.5)); box-shadow: 0 0 18px var(--el-color-danger-light-8, rgba(239, 68, 68, 0.12)); }

.g-ring { position: relative; width: 108px; height: 108px; }
.g-svg { width: 108px; height: 108px; display: block; }
.ticks line { stroke: var(--el-color-info-light-5, rgba(148, 163, 184, 0.22)); stroke-width: 1; }
.ticks line.major { stroke: var(--el-color-info-light-3, rgba(148, 163, 184, 0.5)); stroke-width: 1.6; }
.ring-bg { fill: none; stroke: var(--el-color-info-light-8, rgba(148, 163, 184, 0.1)); stroke-width: 7; }
.ring-fg {
  fill: none; stroke: var(--el-color-primary, #3b82f6); stroke-width: 7; stroke-linecap: round;
  filter: drop-shadow(0 0 5px var(--el-color-primary-light-5, rgba(59, 130, 246, 0.65)));
  transition: stroke-dasharray 0.5s var(--ease-out, ease);
}
.ring-fg.mem { stroke: var(--el-color-success, #8b5cf6); filter: drop-shadow(0 0 5px var(--el-color-success-light-5, rgba(139, 92, 246, 0.65))); }
.ring-fg.disk { stroke: var(--el-color-warning, #f59e0b); filter: drop-shadow(0 0 5px var(--el-color-warning-light-5, rgba(245, 158, 11, 0.6))); }
.ring-fg.jvm { stroke: var(--el-color-info, #14b8a6); filter: drop-shadow(0 0 5px var(--el-color-info-light-5, rgba(20, 184, 166, 0.6))); }
.gauge.danger .ring-fg { stroke: var(--el-color-danger, #ef4444); filter: drop-shadow(0 0 7px var(--el-color-danger-light-5, rgba(239, 68, 68, 0.7))); }

.g-center {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center; gap: 2px;
}
.g-num { font-size: 24px; font-weight: 700; color: var(--p-text); line-height: 1; }
.g-unit { font-size: 11px; color: var(--p-text-3); align-self: flex-start; margin-top: 3px; }
.g-ring.net .g-center, .g-center.io-c { flex-direction: column; gap: 4px; }
.io-c { gap: 3px; }
.io-row { display: inline-flex; align-items: center; gap: 5px; }
.io-k {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 4px;
  font-style: normal; font-size: 9px;
  background: var(--el-color-info-light-8); color: var(--el-color-info, #64748b);
}
.io-row b { font-size: 13px; color: var(--p-text); }
.net-dir { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; }
.net-dir b { font-size: 15px; color: var(--p-text); }
.rx-arr, .tx-arr { width: 0; height: 0; }
.rx-arr { border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 7px solid var(--el-color-info, #06b6d4); }
.tx-arr { border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid var(--el-color-primary, #22d3ee); }

.g-label { margin-top: 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: var(--p-text-2); }
.g-sub { margin-top: 3px; font-size: 10.5px; color: var(--p-text-3); }

/* ---------- 信息卡片（Uptime / 系统信息 / 温度 / 防火墙 / Cron Jobs） ---------- */
.info-cards {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;
  margin-top: 12px;
}
.info-card {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(180deg, var(--el-color-info-light-9, rgba(148, 163, 184, 0.06)), transparent);
  border: 1px solid var(--p-line-2); border-radius: 12px;
  animation: cardIn 0.4s var(--ease-out, ease) both;
  transition: border-color 0.25s, transform 0.25s;
}
.info-card:hover {
  border-color: var(--el-color-info-light-5, rgba(148, 163, 184, 0.3));
  transform: translateY(-2px);
}
.ic-icon {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; flex: none;
  border-radius: 8px;
  font-size: 16px;
  background: var(--el-color-info-light-8, rgba(148, 163, 184, 0.1));
  color: var(--el-color-info, #64748b);
}
.ic-icon.uptime { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.ic-icon.sys { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
.ic-icon.temp { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.ic-icon.firewall { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.ic-icon.firewall.on { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.ic-icon.cron { background: rgba(20, 184, 166, 0.12); color: #14b8a6; }
.ic-body { flex: 1; min-width: 0; }
.ic-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em; color: var(--p-text-3); }
.ic-value { margin-top: 3px; font-size: 15px; font-weight: 700; color: var(--p-text); }
.ic-sub { margin-top: 2px; font-size: 11px; color: var(--p-text-3); }

/* ---------- 趋势（响应式自适应） ---------- */
/* 趋势范围切换：分段按钮，和 Termix 的 LIVE/1H/6H/24H/7D 对齐 */
.trend-range {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 10px;
  margin-top: 14px;
}
.tr-label {
  font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
  color: var(--p-text-3); text-transform: uppercase;
}
.tr-seg {
  display: inline-flex; gap: 2px; padding: 2px;
  background: var(--el-fill-color-light);
  border-radius: 9999px;
}
.tr-btn {
  min-width: 38px; height: 22px; padding: 0 8px;
  font-family: inherit; font-size: 11px; font-weight: 600;
  color: var(--p-text-3); cursor: pointer;
  background: transparent; border: none; border-radius: 9999px;
  transition: background 0.15s ease, color 0.15s ease;
}
.tr-btn:hover { color: var(--p-text-1); }
.tr-btn.on {
  color: var(--el-color-primary);
  background: var(--p-card);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}
.tr-hint { margin-left: auto; font-size: 10.5px; color: var(--p-text-3); }

.trend-grid {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px;
  margin-top: 12px;
}
.trend.clickable { cursor: pointer; }
.trend.clickable:hover { border-color: var(--el-color-primary-light-5, rgba(109, 93, 252, 0.5)); }
.t-right { display: inline-flex; align-items: center; gap: 6px; }
/* 放大镜提示图标 */
.t-zoom {
  position: relative;
  width: 12px; height: 12px;
  border: 1.6px solid var(--p-text-3); border-radius: 50%;
  opacity: 0; transition: opacity 0.2s, border-color 0.2s;
}
.t-zoom::after {
  content: ""; position: absolute; right: -3px; bottom: -3px;
  width: 5px; height: 1.6px; background: var(--p-text-3);
  transform: rotate(45deg); transform-origin: center;
}
.trend.clickable:hover .t-zoom { opacity: 1; }
.trend {
  padding: 12px 12px 8px;
  background: var(--p-card);
  border: 1px solid var(--p-line-2); border-radius: 12px;
  animation: cardIn 0.4s var(--ease-out, ease) 0.12s both;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.trend:hover { border-color: var(--el-color-info-light-5, rgba(148, 163, 184, 0.3)); box-shadow: 0 2px 8px rgba(7, 11, 26, 0.06); }
.t-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
.t-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: var(--p-text-3); }
.t-now { font-size: 13px; font-weight: 700; color: var(--p-text); }
.t-svg { width: 100%; height: 56px; display: block; }
.t-grid line { stroke: var(--el-color-info-light-8, rgba(148, 163, 184, 0.08)); stroke-width: 1; }
.t-area { transition: d 0.4s var(--ease-out, ease); }
.t-line {
  fill: none; stroke-width: 1.8; stroke-linejoin: round; stroke-linecap: round;
}
.t-line.cpu { stroke: var(--el-color-primary, #3b82f6); }
.t-line.mem { stroke: var(--el-color-success, #8b5cf6); }
.t-line.jvm { stroke: var(--el-color-info, #14b8a6); }
.t-line.net { stroke: var(--el-color-info, #06b6d4); }
.t-line.io-r { stroke: var(--el-color-warning, #f59e0b); }
.t-line.io-w { stroke: var(--el-color-info, #06b6d4); }
.t-foot {
  display: flex; justify-content: space-between; gap: 8px; margin-top: 5px;
  font-size: 10px; color: var(--p-text-3);
}
.t-foot.io-legend { flex-direction: column; gap: 2px; }
.lg-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 4px; }
.lg-dot.r { background: var(--el-color-warning, #f59e0b); }
.lg-dot.w { background: var(--el-color-info, #06b6d4); }

/* ---------- 软件实例（版式在 ScSoftwarePanel 内部，这里只留区块间距） ---------- */
.sw-block {
  display: block;
  margin-top: 12px;
}
/* 通用弹窗表单列（画像分区新增环境变量等） */
.swdet { display: flex; flex-direction: column; gap: 12px; }

/* ---------- 画像分区 ---------- */
.profile-panel {
  position: relative; z-index: 1;
  margin-top: 12px;
  background: var(--p-card);
  border: 1px solid var(--p-line-2); border-radius: 12px;
  overflow: hidden;
  animation: cardIn 0.4s var(--ease-out, ease) 0.16s both;
}
.pp-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: 11px 14px;
  border-bottom: 1px solid var(--p-line-2);
}
.pp-title { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; }
.pp-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.pp-tab {
  padding: 4px 12px; font-size: 12px; color: var(--p-text-2);
  background: transparent; border: 1px solid var(--p-line-2); border-radius: 999px; cursor: pointer;
}
.pp-tab.on { color: var(--el-color-primary); border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.sub-label { font-size: 12px; color: var(--el-text-color-secondary); margin: 8px 0 4px; }

/* ---------- 磁盘 ---------- */
.disk-panel {
  position: relative; z-index: 1;
  margin-top: 12px;
  background: var(--p-card);
  border: 1px solid var(--p-line-2); border-radius: 12px;
  overflow: hidden;
  animation: cardIn 0.4s var(--ease-out, ease) 0.18s both;
}
.dp-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px;
  border-bottom: 1px solid var(--p-line-2);
}
.dp-title { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; }
.dp-count { font-size: 10.5px; color: var(--p-text-3); letter-spacing: 0.12em; }
/* 驱动器响应式栅格（Windows「此电脑」磁片，自适应换行） */
.drive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
  padding: 14px;
}
.drive-tile {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: var(--p-bg-2);
  border: 1px solid var(--p-line-2); border-radius: 10px;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.drive-tile:hover {
  border-color: var(--el-color-info-light-5, rgba(148, 163, 184, 0.4));
  box-shadow: 0 2px 10px rgba(7, 11, 26, 0.06);
  transform: translateY(-1px);
}
.drive-ico { width: 40px; height: 40px; flex: none; }
.di-body { fill: var(--el-color-info-light-7, #cbd5e1); }
.di-slot { fill: var(--el-color-info-light-9, #f1f5f9); }
.di-led { fill: var(--el-color-success, #22c55e); }
.di-base { fill: var(--el-color-info-light-5, #94a3b8); }
.drive-info { flex: 1; min-width: 0; }
.drive-name {
  font-size: 13px; font-weight: 600; color: var(--p-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.drive-bar {
  height: 5px; margin: 6px 0 5px;
  background: var(--el-color-info-light-8, rgba(148, 163, 184, 0.16)); border-radius: 3px; overflow: hidden;
}
.drive-fill {
  height: 100%; border-radius: 3px;
  background: var(--el-color-primary, #3b82f6);
  transition: width 0.5s var(--ease-out, ease);
}
.drive-cap { font-size: 10.5px; color: var(--p-text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* 容量紧张：图标变红、进度条红色 */
.drive-tile.low .di-led { fill: var(--el-color-danger, #ef4444); }
.drive-tile.low .drive-fill { background: var(--el-color-danger, #ef4444); }
.drive-empty { grid-column: 1 / -1; text-align: center; padding: 26px 0; }

/* ---------- AI 分析弹窗 ---------- */
.ai-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding-bottom: 12px; margin-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
}
.ai-bar-k { font-size: 12px; color: var(--text-tertiary, #94a3b8); }
.ai-bar-sel { width: 190px; }
.ai-bar-hint { font-size: 11.5px; color: var(--text-tertiary, #94a3b8); }
.ai-state {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 26px 6px; font-size: 13px; color: var(--text-secondary, #64748b);
}
.ai-state b { font-size: 14px; color: var(--text-primary, #1e293b); }
.ai-state.is-error b { color: var(--status-error-text, #ef4444); }
.ai-spin { font-size: 18px; color: var(--el-color-primary, #6d5dfc); }
.ai-result .ai-content {
  margin: 0; padding: 12px 14px; max-height: 460px; overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px; line-height: 1.75;
  white-space: pre-wrap; word-break: break-word;
  background: var(--bg-fill, rgba(148, 163, 184, 0.07));
  border: 1px solid var(--border-subtle, rgba(148, 163, 184, 0.2));
  border-radius: 8px; color: var(--text-primary, #1e293b);
}
.ai-meta {
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  margin-top: 8px; font-size: 11px; color: var(--text-tertiary, #94a3b8);
}

/* ---------- 历史数据弹窗 ---------- */
.hist-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 12px;
}
.hist-sel { width: 150px; }
.hist-hint { font-size: 11.5px; color: var(--p-text-3); }
.hist-canvas-wrap {
  position: relative;
  width: 100%;
  height: 380px;
}
.hist-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 13px;
  color: var(--p-text-2);
  background: var(--el-bg-color, #fff);
  z-index: 1;
}
.hist-canvas { width: 100%; height: 100%; }

/* ---------- 响应式 ---------- */
@media (prefers-reduced-motion: reduce) {
  .panel, .gauge, .trend, .disk-panel, .sw-panel { animation: none; }
  .scanline, .live.on .live-dot, .ico.spin { animation: none; }
}
</style>
