<script setup lang="ts">
/**
 * 主机监控详情 —— 遥测控制台（mission-control telemetry）
 *
 * 数据源：
 *   1) HTTP 拉取：最新指标（CPU/内存/磁盘/网络/JVM）+ 24h 历史
 *   2) Socket 实时推送：订阅 monitor:metric（dataId=monitorId），
 *      命中当前主机时立即更新仪表并追加趋势点（最多保留 MAX_LIVE 点），
 *      推送心跳（计数 / 最后时间 / 连接状态）显示在面板头。
 *
 * 设计语言：深色遥测面板 + 发光刻度环 + 网格趋势 + 等宽数字，
 * 与外壳 koi 浅色主题形成“任务控制室”的对比记忆点。
 * @author CH
 * @since 4.0.0
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSocketService } from "@repo/core";
import { queryHosts } from "@pages/server/src/api";
import {
  getLatestCpu, getCpuHistory, getLatestMemory, getMemoryHistory, getLatestDisk,
  getLatestNetwork, getNetworkHistory, getLatestJvm, getJvmHistory,
} from "@pages/monitor/src/api";

const route = useRoute();
const router = useRouter();
const monitorId = ref<number>(Number(route.params.id) || 0);
const hostName = ref("");
const loading = ref(false);
const error = ref("");

const cpu = ref<{ usage?: number; cores?: number } | null>(null);
const mem = ref<{ usagePercent?: number; usage?: number; total?: number } | null>(null);
const disk = ref<any[]>([]);
const net = ref<{ rx?: number; tx?: number } | null>(null);
const jvm = ref<{ heapUsed?: number; heapMax?: number; heapUsagePercent?: number } | null>(null);
const cpuHist = ref<number[]>([]);
const memHist = ref<number[]>([]);
const netHist = ref<number[]>([]);
const jvmHist = ref<number[]>([]);

// ---------------- 格式化工具 ----------------
function pct(v?: number): string { return v == null ? "—" : `${v.toFixed(0)}%`; }
/**
 * 数值展示，null 显示 —
 * @param v 数值
 */
function num(v?: number): string { return v == null ? "—" : String(Math.round(v)); }
/**
 * 数值格式化
 * @param v 数值
 */
function fmt(v?: number): string {
  if (v == null) return "—";
  if (v >= 1073741824) return `${(v / 1073741824).toFixed(1)}G`;
  if (v >= 1048576) return `${(v / 1048576).toFixed(1)}M`;
  if (v >= 1024) return `${(v / 1024).toFixed(1)}K`;
  return String(Math.round(v));
}
/** 把 ISO 时间 / 时间戳转成 HH:MM:SS */
function fmtClock(t?: string | number): string {
  if (t == null) return "—";
  const d = new Date(typeof t === "number" ? t : String(t).length === 13 ? Number(t) : t);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

// ---------------- 趋势 sparkline（纯 SVG） ----------------
function spark(data: number[]): string {
  if (data.length === 0) return "";
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1, w = 200, h = 56, pad = 3;
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
/**
 * 序列面积估算文本
 * @param data 数值序列
 */
function area(data: number[]): string {
  if (data.length === 0) return "";
  return `${spark(data)} 200,56 0,56`;
}
/**
 * 序列最小值
 * @param data 数值序列
 */
function trendMin(data: number[]): string { return data.length ? data.reduce((a, b) => Math.min(a, b), Infinity).toFixed(0) : "—"; }
/**
 * 序列最大值
 * @param data 数值序列
 */
function trendMax(data: number[]): string { return data.length ? data.reduce((a, b) => Math.max(a, b), -Infinity).toFixed(0) : "—"; }
/**
 * 序列最新值
 * @param data 数值序列
 */
function trendLast(data: number[]): string { return data.length ? data[data.length - 1].toFixed(0) : "—"; }
/** 网络字节趋势的 min/max/last（空数据返回 —，有数据按 fmt 压缩显示） */
function netMin(data: number[]): string { return data.length ? fmt(data.reduce((a, b) => Math.min(a, b), Infinity)) : "—"; }
/**
 * 网络峰值
 * @param data 数值序列
 */
function netMax(data: number[]): string { return data.length ? fmt(data.reduce((a, b) => Math.max(a, b), -Infinity)) : "—"; }
/**
 * 网络最新值
 * @param data 数值序列
 */
function netLast(data: number[]): string { return data.length ? fmt(data[data.length - 1]) : "—"; }

// ---------------- 仪表 ----------------
const ticks = Array.from({ length: 60 }, (_, i) => i);
/** SVG 圆环进度：返回 stroke-dasharray 片段 */
function ringDash(p: number): string {
  const r = 50, circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, p));
  return `${(circ * v / 100).toFixed(2)} ${circ.toFixed(2)}`;
}
/**
 * 进度环样式
 * @param p 百分比
 */
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
const MAX_LIVE = 120;                       // 实时追加保留的最大点数
const sockOn = computed(() => socket?.connected.value ?? false);
const pushCount = ref(0);
const lastPushText = ref("—");
const lastPushAt = ref(0);                  // 最近一次推送的毫秒时间戳（判断 LIVE 活性）
const LIVE_TTL = 30_000;                    // 30s 内无推送则 LIVE 变灰
const liveActive = computed(() => sockOn.value && Date.now() - lastPushAt.value < LIVE_TTL);
let unsubMetric: (() => void) | undefined;

function pushPoint(arr: typeof cpuHist, v: number | null | undefined): void {
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
/** 应用一次实时指标推送 */
function applyLivePayload(payload: any): void {
  const metrics = payload?.metrics as Record<string, unknown> | undefined;
  if (!metrics) return;

  const cpuVal = pickMetric(metrics, ["cpu_usage", "cpuUsage", "cpu"]);
  if (cpuVal != null) { cpu.value = { ...(cpu.value ?? {}), usage: cpuVal }; pushPoint(cpuHist, cpuVal); }

  const memVal = pickMetric(metrics, ["memory_usage", "memoryUsage", "mem_usage", "memUsage"]);
  if (memVal != null) { mem.value = { ...(mem.value ?? {}), usagePercent: memVal }; pushPoint(memHist, memVal); }

  const diskVal = pickMetric(metrics, ["disk_usage", "diskUsage", "disk"]);
  if (diskVal != null && disk.value.length === 0) {
    disk.value = [{ mount: "—", device: "", used: 0, total: 0, usedText: "—", usagePercent: diskVal }];
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
/** 订阅当前主机的实时指标推送 */
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

// ---------------- 数据拉取 ----------------
async function fetchMetrics(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const id = monitorId.value;
    const [c, m, d, n, j] = await Promise.allSettled([getLatestCpu(id), getLatestMemory(id), getLatestDisk(id), getLatestNetwork(id), getLatestJvm(id)]);
    if (c.status === "fulfilled") cpu.value = c.value;
    if (m.status === "fulfilled") mem.value = m.value;
    if (d.status === "fulfilled") disk.value = d.value ?? [];
    if (n.status === "fulfilled") net.value = n.value;
    if (j.status === "fulfilled") jvm.value = j.value;
    const pick = (v: any): number => (v == null ? 0 : Number(v));
    const [ch, mh, nh, jh] = await Promise.allSettled([
      getCpuHistory(id, 24), getMemoryHistory(id, 24), getNetworkHistory(id, 24), getJvmHistory(id, 24),
    ]);
    if (ch.status === "fulfilled") cpuHist.value = (ch.value ?? []).map(r => pick((r as any).value));
    if (mh.status === "fulfilled") memHist.value = (mh.value ?? []).map(r => pick((r as any).value));
    if (nh.status === "fulfilled") netHist.value = (nh.value ?? []).map(r => pick((r as any).tx ?? r.value));
    if (jh.status === "fulfilled") jvmHist.value = (jh.value ?? []).map(r => pick((r as any).value));
  } catch (e) { error.value = String((e as Error)?.message ?? e); }
  finally { loading.value = false; }
}
async function resolveHost(): Promise<void> {
  try {
    const hosts = (await queryHosts()) ?? [];
    const hit = hosts.find((h: any) => h.id === monitorId.value);
    if (hit) hostName.value = hit.serverHostName;
  } catch { /* 忽略 */ }
}

// ---------------- 生命周期 ----------------
watch(() => route.params.id, id => {
  const n = Number(id);
  if (n && n !== monitorId.value) { monitorId.value = n; bindLive(); fetchMetrics(); resolveHost(); }
});
onMounted(() => { bindLive(); fetchMetrics(); resolveHost(); });
onBeforeUnmount(() => { unsubMetric?.(); });

// ---------------- 磁盘表 ----------------
const diskColumns = [
  { prop: "mount", label: "挂载点" },
  { prop: "device", label: "设备" },
  { prop: "usedText", label: "已用 / 总量" },
  { prop: "usagePercent", label: "使用率" },
];
/**
 * 磁盘已用/总量文本
 * @param r 分区行
 */
function diskUsed(r: any): string { return `${fmt(r.used)} / ${fmt(r.total)}`; }
/**
 * 磁盘使用率进度条宽度
 * @param r 分区行
 */
function diskUsageWidth(r: any): string { return `${Math.min(100, Number(r.usagePercent ?? 0))}%`; }
</script>

<template>
  <div class="hd tel-page">
    <!-- 页头（外壳浅色区域，保持与整体一致） -->
    <ReSectionHead :description="`主机 #${monitorId} · 实时遥测与 24h 趋势`">
      <template #title>{{ hostName || `主机 #${monitorId}` }}</template>
      <template #actions>
        <ReButton icon="Back" :show-text="true" size="small" @click="router.push('/assets')">资产</ReButton>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="fetchMetrics">刷新</ReButton>
        <ReButton icon="MagicStick" :show-text="true" size="small" :loading="aiLoading" @click="runAiAnalysis">AI 分析</ReButton>
        <ReButton icon="Connection" :show-text="true" type="primary" size="small" @click="router.push({ path: '/terminal', query: { hostId: String(monitorId) } })">连接远控</ReButton>
      </template>
    </ReSectionHead>

    <div v-if="error" class="hd-error">
      <span>部分数据加载失败：{{ error }}</span>
      <ReButton icon="RefreshRight" type="primary" size="small" :show-text="true" @click="fetchMetrics">重试</ReButton>
    </div>

    <!-- ================= 遥测控制台 ================= -->
    <div class="panel">
      <!-- 面板头 -->
      <header class="ph">
        <div class="ph-left">
          <div class="ph-idx">HOST · {{ String(monitorId).padStart(3, "0") }}</div>
          <div class="ph-title">{{ hostName || `主机 #${monitorId}` }}</div>
          <div class="ph-meta">
            <span>CPU {{ cpu?.cores ? cpu.cores + " 核" : "—" }}</span>
            <i class="dot-sep"></i>
            <span>内存 {{ mem?.total ? fmt(mem.total) : "—" }}</span>
            <i class="dot-sep"></i>
            <span>24h 趋势</span>
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
          <button class="btn-refresh" :disabled="loading" @click="fetchMetrics">
            <i class="ico" :class="{ spin: loading }"></i>刷新
          </button>
        </div>
      </header>
      <div class="scanline"></div>

      <!-- 实时仪表 -->
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

        <!-- 磁盘 -->
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
          <div class="g-label">磁盘</div>
          <div class="g-sub mono">{{ disk.length }} MOUNT</div>
        </div>

        <!-- 网络 -->
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

        <!-- JVM -->
        <div class="gauge" :class="{ hot: heat(jvmPct) === 1, danger: heat(jvmPct) === 2 }">
          <div class="g-ring">
            <svg viewBox="0 0 120 120" class="g-svg">
              <g class="ticks">
                <line v-for="t in ticks" :key="t" :class="{ major: t % 15 === 0 }"
                  :transform="`rotate(${t * 6} 60 60)`" x1="60" y1="8" x2="60" y2="13" />
              </g>
              <circle class="ring-bg" cx="60" cy="60" r="50" />
              <circle class="ring-fg jvm" cx="60" cy="60" r="50" :style="ringStyle(jvmPct)" transform="rotate(-90 60 60)" />
            </svg>
            <div class="g-center"><b class="g-num mono">{{ num(jvmPct) }}</b><span class="g-unit">%</span></div>
          </div>
          <div class="g-label">JVM</div>
          <div class="g-sub mono">{{ fmt(jvm?.heapUsed) }}/{{ fmt(jvm?.heapMax) }}</div>
        </div>
      </section>

      <!-- 24h 趋势 -->
      <section class="trend-grid">
        <div class="trend">
          <div class="t-head"><span class="t-label">CPU · 24H</span><span class="t-now mono">{{ trendLast(cpuHist) }}%</span></div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <defs><linearGradient id="tg-cpu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b82f6" stop-opacity=".30"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></linearGradient></defs>
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polygon class="t-area" :points="area(cpuHist)" fill="url(#tg-cpu)" />
            <polyline class="t-line cpu" :points="spark(cpuHist)" />
          </svg>
          <div class="t-foot mono"><span>MIN {{ trendMin(cpuHist) }}</span><span>MAX {{ trendMax(cpuHist) }}</span></div>
        </div>

        <div class="trend">
          <div class="t-head"><span class="t-label">内存 · 24H</span><span class="t-now mono">{{ trendLast(memHist) }}%</span></div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <defs><linearGradient id="tg-mem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".30"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient></defs>
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polygon class="t-area" :points="area(memHist)" fill="url(#tg-mem)" />
            <polyline class="t-line mem" :points="spark(memHist)" />
          </svg>
          <div class="t-foot mono"><span>MIN {{ trendMin(memHist) }}</span><span>MAX {{ trendMax(memHist) }}</span></div>
        </div>

        <div class="trend">
          <div class="t-head"><span class="t-label">JVM · 24H</span><span class="t-now mono">{{ trendLast(jvmHist) }}%</span></div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <defs><linearGradient id="tg-jvm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14b8a6" stop-opacity=".30"/><stop offset="1" stop-color="#14b8a6" stop-opacity="0"/></linearGradient></defs>
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polygon class="t-area" :points="area(jvmHist)" fill="url(#tg-jvm)" />
            <polyline class="t-line jvm" :points="spark(jvmHist)" />
          </svg>
          <div class="t-foot mono"><span>MIN {{ trendMin(jvmHist) }}</span><span>MAX {{ trendMax(jvmHist) }}</span></div>
        </div>

        <div class="trend">
          <div class="t-head"><span class="t-label">网络 · 24H</span><span class="t-now mono">{{ netLast(netHist) }}</span></div>
          <svg class="t-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
            <defs><linearGradient id="tg-net" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06b6d4" stop-opacity=".30"/><stop offset="1" stop-color="#06b6d4" stop-opacity="0"/></linearGradient></defs>
            <g class="t-grid"><line x1="0" y1="14" x2="200" y2="14"/><line x1="0" y1="28" x2="200" y2="28"/><line x1="0" y1="42" x2="200" y2="42"/></g>
            <polygon class="t-area" :points="area(netHist)" fill="url(#tg-net)" />
            <polyline class="t-line net" :points="spark(netHist)" />
          </svg>
          <div class="t-foot mono"><span>MIN {{ netMin(netHist) }}</span><span>MAX {{ netMax(netHist) }}</span></div>
        </div>
      </section>

      <!-- 磁盘挂载点 -->
      <section class="disk-panel">
        <div class="dp-head"><span class="dp-title">磁盘挂载点</span><span class="dp-count mono">{{ disk.length }} DEVICE</span></div>
        <table class="disk-table">
          <thead><tr><th v-for="c in diskColumns" :key="c.prop">{{ c.label }}</th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in disk" :key="i">
              <td class="mono">{{ r.mount || "—" }}</td>
              <td class="mono dim">{{ r.device || "—" }}</td>
              <td class="mono">{{ diskUsed(r) }}</td>
              <td>
                <div class="use-row">
                  <div class="bar"><div class="bar-fill" :class="{ danger: Number(r.usagePercent ?? 0) >= 85 }" :style="{ width: diskUsageWidth(r) }" /></div>
                  <span class="mono pct">{{ pct(r.usagePercent) }}</span>
                </div>
              </td>
            </tr>
            <tr v-if="disk.length === 0"><td colspan="4" class="empty">暂无磁盘数据</td></tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- AI 智能分析弹窗 -->
    <ReDialog v-model="aiDialogVisible" title="AI 主机指标智能分析" width="700px">
      <div v-if="aiLoading" class="ai-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>AI 正在分析主机指标，请稍候...</span>
      </div>
      <div v-else-if="aiError" class="ai-error">
        <span>分析失败：{{ aiError }}</span>
        <p style="margin-top: 8px; font-size: 12px; color: var(--text-tertiary)">
          可能原因：AI 模型未配置、网络超时、或后端服务不可用。请检查系统配置中的 AI 模型设置。
        </p>
      </div>
      <div v-else class="ai-result">
        <pre class="ai-content">{{ aiResult }}</pre>
      </div>
      <template #footer>
        <ReButton @click="aiDialogVisible = false">关闭</ReButton>
        <ReButton type="primary" :loading="aiLoading" @click="runAiAnalysis">重新分析</ReButton>
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
    radial-gradient(1100px 480px at 12% -12%, rgba(109, 93, 252, 0.18), transparent 62%),
    radial-gradient(900px 440px at 108% 112%, rgba(6, 182, 212, 0.12), transparent 60%),
    var(--p-bg);
  border: 1px solid var(--p-line);
  border-radius: 16px;
  padding: 18px 20px 20px;
  color: var(--p-text);
  box-shadow: 0 12px 40px rgba(7, 11, 26, 0.35);
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
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.45);
  box-shadow: 0 0 14px rgba(74, 222, 128, 0.22), inset 0 0 8px rgba(74, 222, 128, 0.08);
}
.live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: currentColor;
}
.live.on .live-dot { animation: livePulse 1.6s ease-in-out infinite; }
@keyframes livePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.55); }
  50% { box-shadow: 0 0 0 5px rgba(74, 222, 128, 0); }
}

.ph-stat {
  display: inline-flex; align-items: baseline; gap: 6px;
  padding: 4px 10px;
  font-size: 11px; color: var(--p-text-3);
  background: rgba(148, 163, 184, 0.07);
  border: 1px solid var(--p-line-2); border-radius: 8px;
}
.stat-k { font-size: 11px; color: var(--p-text-3); }
.stat-v { font-size: 12px; color: var(--p-text); font-weight: 600; }
.stat-sep { width: 1px; height: 10px; background: var(--p-line); margin: 0 3px; }
.mono { font-family: var(--p-mono); }

.sock { font-size: 11.5px; color: var(--p-text-3); }
.sock.ok { color: #4ade80; }
.btn-refresh {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px;
  font-size: 12px; color: var(--p-text);
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid var(--p-line); border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.btn-refresh:hover { border-color: rgba(109, 93, 252, 0.6); background: rgba(109, 93, 252, 0.12); box-shadow: 0 0 12px rgba(109, 93, 252, 0.25); }
.btn-refresh:disabled { opacity: 0.55; cursor: default; }
.ico {
  width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid rgba(148, 163, 184, 0.35);
  border-top-color: #a5b4fc;
}
.ico.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 扫描线（遥测氛围，reduced-motion 时关闭） */
.scanline {
  position: relative;
  z-index: 1;
  height: 1px;
  margin: 0 -20px;
  background: linear-gradient(90deg, transparent, rgba(109, 93, 252, 0.6), rgba(6, 182, 212, 0.6), transparent);
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

/* ---------- 仪表 ---------- */
.gauge-grid {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
  margin-top: 16px;
}
.gauge {
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 8px 14px;
  background: linear-gradient(180deg, rgba(148, 163, 184, 0.06), rgba(148, 163, 184, 0.02));
  border: 1px solid var(--p-line-2); border-radius: 12px;
  animation: cardIn 0.4s var(--ease-out, ease) both;
  transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
}
.gauge:nth-child(2) { animation-delay: 0.05s; }
.gauge:nth-child(3) { animation-delay: 0.1s; }
.gauge:nth-child(4) { animation-delay: 0.15s; }
.gauge:nth-child(5) { animation-delay: 0.2s; }
@keyframes cardIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.gauge:hover {
  border-color: rgba(148, 163, 184, 0.3);
  transform: translateY(-2px);
}
.gauge.hot { border-color: rgba(245, 158, 11, 0.4); }
.gauge.danger { border-color: rgba(239, 68, 68, 0.5); box-shadow: 0 0 18px rgba(239, 68, 68, 0.12); }

.g-ring { position: relative; width: 108px; height: 108px; }
.g-svg { width: 108px; height: 108px; display: block; }
.ticks line { stroke: rgba(148, 163, 184, 0.22); stroke-width: 1; }
.ticks line.major { stroke: rgba(148, 163, 184, 0.5); stroke-width: 1.6; }
.ring-bg { fill: none; stroke: rgba(148, 163, 184, 0.1); stroke-width: 7; }
.ring-fg {
  fill: none; stroke: #3b82f6; stroke-width: 7; stroke-linecap: round;
  filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.65));
  transition: stroke-dasharray 0.5s var(--ease-out, ease);
}
.ring-fg.mem { stroke: #8b5cf6; filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.65)); }
.ring-fg.disk { stroke: #f59e0b; filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.6)); }
.ring-fg.jvm { stroke: #14b8a6; filter: drop-shadow(0 0 5px rgba(20, 184, 166, 0.6)); }
.gauge.danger .ring-fg { stroke: #ef4444; filter: drop-shadow(0 0 7px rgba(239, 68, 68, 0.7)); }

.g-center {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center; gap: 2px;
}
.g-num { font-size: 24px; font-weight: 700; color: var(--p-text); line-height: 1; }
.g-unit { font-size: 11px; color: var(--p-text-3); align-self: flex-start; margin-top: 3px; }
.g-ring.net .g-center { flex-direction: column; gap: 4px; }
.net-dir { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #67e8f9; }
.net-dir b { font-size: 15px; color: var(--p-text); }
.rx-arr, .tx-arr { width: 0; height: 0; }
.rx-arr { border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 7px solid #06b6d4; }
.tx-arr { border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid #22d3ee; }

.g-label { margin-top: 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; color: var(--p-text-2); }
.g-sub { margin-top: 3px; font-size: 10.5px; color: var(--p-text-3); }

/* ---------- 趋势 ---------- */
.trend-grid {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  margin-top: 12px;
}
.trend {
  padding: 12px 12px 8px;
  background: var(--p-card);
  border: 1px solid var(--p-line-2); border-radius: 12px;
  animation: cardIn 0.4s var(--ease-out, ease) 0.12s both;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.trend:hover { border-color: rgba(148, 163, 184, 0.3); box-shadow: 0 4px 20px rgba(7, 11, 26, 0.45); }
.t-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
.t-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: var(--p-text-3); }
.t-now { font-size: 13px; font-weight: 700; color: var(--p-text); }
.t-svg { width: 100%; height: 56px; display: block; }
.t-grid line { stroke: rgba(148, 163, 184, 0.08); stroke-width: 1; }
.t-area { transition: d 0.4s var(--ease-out, ease); }
.t-line {
  fill: none; stroke-width: 1.8; stroke-linejoin: round; stroke-linecap: round;
}
.t-line.cpu { stroke: #3b82f6; filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5)); }
.t-line.mem { stroke: #8b5cf6; filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.5)); }
.t-line.jvm { stroke: #14b8a6; filter: drop-shadow(0 0 4px rgba(20, 184, 166, 0.5)); }
.t-line.net { stroke: #06b6d4; filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.5)); }
.t-foot {
  display: flex; justify-content: space-between; margin-top: 5px;
  font-size: 10px; color: var(--p-text-3);
}

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
.disk-table { width: 100%; border-collapse: collapse; }
.disk-table th {
  padding: 8px 14px; text-align: left;
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em;
  color: var(--p-text-3);
  background: rgba(148, 163, 184, 0.05);
  border-bottom: 1px solid var(--p-line-2);
}
.disk-table td { padding: 8px 14px; font-size: 12px; color: var(--p-text); border-bottom: 1px solid var(--p-line-2); }
.disk-table tbody tr:last-child td { border-bottom: none; }
.disk-table tbody tr { transition: background 0.15s; }
.disk-table tbody tr:hover { background: rgba(109, 93, 252, 0.07); }
.dim { color: var(--p-text-3); }
.empty { text-align: center; color: var(--p-text-3); padding: 18px 0; }
.use-row { display: flex; align-items: center; gap: 8px; }
.bar { flex: 1; height: 6px; background: rgba(148, 163, 184, 0.14); border-radius: 3px; overflow: hidden; }
.bar-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
  transition: width 0.5s var(--ease-out, ease);
}
.bar-fill.danger { background: linear-gradient(90deg, #ef4444, #f87171); box-shadow: 0 0 8px rgba(239, 68, 68, 0.55); }
.pct { min-width: 42px; text-align: right; color: var(--p-text-2); }

/* ---------- 响应式 ---------- */
@media (max-width: 1280px) {
  .gauge-grid { grid-template-columns: repeat(3, 1fr); }
  .trend-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .gauge-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .gauge-grid { grid-template-columns: 1fr; }
  .trend-grid { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .panel, .gauge, .trend, .disk-panel { animation: none; }
  .scanline, .live.on .live-dot, .ico.spin { animation: none; }
}
</style>
