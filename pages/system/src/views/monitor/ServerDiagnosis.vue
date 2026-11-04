<script setup lang="ts">
/**
 * 服务诊断（ServerDiagnosis）—— 线程 / 内存 / 性能三合一诊断页
 *
 * 数据源：
 *   ServerInfo /v2/server/info     CPU / 系统内存 / JVM 内存 / 磁盘 / 网络 /
 *                                  线程池 / 线程状态 / Top 线程
 *   JvmInfo  /v2/jvm/info          堆/非堆 / 内存池 / 线程 / GC / Top CPU 线程
 *   接口统计 /v2/server/api/stats  接口质量 Top
 *
 * 交互：Credential 切 3 类诊断，指标实时染色（正常/偏高/告警）；10s 轮询，
 *       一键手动刷新，关闭自动轮询。
 */
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Refresh, Timer } from "@element-plus/icons-vue";
import ReEChart from "../components/ReEChart.vue";
import { getServerInfo, getJvmInfo, getRestfulApiStats } from "../../api/systemApi";
import type {
  ServerInfo,
  JvmInfo,
  TopThread,
  GcCollector,
  RestfulApiStats,
  RestfulTopUrl,
  MemoryPoolInfo,
} from "../../api/types";
import { useElColors, withAlpha } from "./echarts-colors";

/** 诊断 Tab */
export type DiagTab = "thread" | "memory" | "perf";

/** ECharts option 类型 */
export type Opt = Record<string, unknown>;

const colors = useElColors();

/* ================= 页面状态 ================= */
const activeTab = ref<DiagTab>("thread");
const loading = ref(false);
/** 是否开启自动轮询 */
const autoPoll = ref(true);
/** 最后刷新时间 */
const lastRefresh = ref("");
const subTip = ref("等待数据…");

const info = ref<ServerInfo>({});
const jvm = ref<JvmInfo>({});
const apiStats = ref<RestfulApiStats>({});
const refreshErr = ref("");

/** 统一后的内存池明细（ServerInfo.MemoryPoolInfo / JvmInfo.memoryPools） */
const pools = computed<MemoryPoolInfo[]>(() => {
  const a = info.value.memoryPools ?? [];
  if (a.length) return a;
  const b = jvm.value.memoryPools ?? [];
  return b.map((p) => ({
    name: p.name,
    type: p.type,
    used: p.usage?.used,
    committed: p.usage?.committed,
    max: p.usage?.max,
  }));
});

/* ================= 轮询 ================= */
let timer: ReturnType<typeof setTimeout> | null = null;
const POLL_MS = 10000;
function startPoll() {
  stopPoll();
  timer = setInterval(() => { void loadAll(); }, POLL_MS);
}
function stopPoll() {
  if (timer) { window.clearInterval(timer); timer = null; }
}
function scheduleLoadAll() {
  loadAll();
  if (autoPoll.value) startPoll();
}
async function loadAll() {
  loading.value = true;
  refreshErr.value = "";
  try {
    await Promise.all([loadServerInfo(), loadJvmInfo(), loadApiStats()]);
    lastRefresh.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    subTip.value = `数据更新于 ${lastRefresh.value}`;
  } catch (e) {
    const msg = (e as Error)?.message ?? "数据加载失败";
    refreshErr.value = msg;
    subTip.value = `${msg}`;
    message.error(msg);
  } finally {
    loading.value = false;
  }
}

async function loadServerInfo() {
  const res = await getServerInfo();
  info.value = res?.data ?? {};
}

async function loadJvmInfo() {
  const res = await getJvmInfo();
  jvm.value = res?.data ?? {};
}

async function loadApiStats() {
  const res = await getRestfulApiStats();
  apiStats.value = res?.data ?? {};
}

onMounted(() => { void loadAll(); });
onBeforeUnmount(() => { stopPoll(); });

/* 切换 Tab 时重新拉取接口统计（大屏常驻，不依赖轮询） */
watch(activeTab, () => { void loadApiStats(); });

/* ================= 工具 ================= */
function formatBytes(b?: number): string {
  if (b === undefined || b === null || b <= 0) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"]; let v = b; let i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(2)} ${u[i]}`;
}
function fmtUptime(s?: number): string {
  if (!s) return "—";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}天 ${h}时 ${m}分` : h > 0 ? `${h}时 ${m}分` : `${m}分`;
}
function r1(v: number): number { return Math.round(v * 10) / 10; }
function pct(v: number | undefined): number { return Math.min(100, Math.max(0, r1(v ?? 0))); }

/** 绿/橙/红阈值合约定在内存条，样式共用 */
function lvl(p: number): "ok" | "warn" | "danger" {
  return p >= 85 ? "danger" : p >= 60 ? "warn" : "ok";
}
function lvlColor(l: "ok" | "warn" | "danger"): string {
  return l === "danger" ? colors.danger : l === "warn" ? colors.warning : colors.success;
}

/* ================= Tab 标题 ================= */
const tabItems: { key: DiagTab; label: string }[] = [
  { key: "thread", label: "线程诊断" },
  { key: "memory", label: "内存诊断" },
  { key: "perf", label: "性能诊断" },
];

/* ================= 派生指标 ================= */
const cpuPct = computed(() => pct(info.value.cpu?.usagePercent));
const sysMemPct = computed(() => pct(info.value.systemMemory?.usagePercent));
const jvmMemPct = computed(() => pct(info.value.jvmMemory?.usagePercent));
const hostName = computed(() => info.value.server?.hostname ?? "—");
const osInfo = computed(() => {
  const s = info.value.server;
  return s && `${s.osName ?? ""} ${s.osVersion ?? ""}`.trim() || "—";
});
const systemUptime = computed(() => fmtUptime(info.value.systemUptime));
const processCount = computed(() => info.value.processCount ?? "—");
const processUptime = computed(() => fmtUptime(info.value.processUptime));
const loadAvg = computed(() => (info.value.systemLoadAverage ?? 0));
const threadCount = computed(() => info.value.threadCount ?? 0);
const peakThreadCount = computed(() => info.value.peakThreadCount ?? 0);
const daemonThreadCount = computed(() => (info.value.daemonThreadCount ?? 0) + (jvm.value.threadInfo?.daemonThreadCount ?? 0));
const deadlockedCount = computed(() => info.value.deadlockedThreadCount ?? jvm.value.threadInfo?.deadlockedThreadCount ?? 0);

/* ================= 线程诊断：状态环形图 ================= */
const threadStatesOpt = computed<Opt>(() => {
  const states = info.value.threadStates ?? {};
  const pal = [colors.primary, colors.success, colors.warning, colors.danger, colors.info];
  const data = Object.entries(states).map(([name, value], i) => ({
    name,
    value,
    itemStyle: { color: pal[i % pal.length] },
  }));
  if (!data.length) return { series: [] } as Opt;
  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: 0, top: "middle", textStyle: { color: colors.textSecondary, fontSize: 11 }, itemWidth: 8, itemHeight: 8, itemGap: 6 },
    series: [{
      type: "pie",
      radius: ["52%", "76%"],
      center: ["30%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 5, borderColor: colors.bgColor, borderWidth: 2 },
      label: { show: false },
      data,
    }],
  } as Opt;
});

/* ================= 线程诊断：Top 线程表 ================= */
const topThreads = computed(() => {
  const list = info.value.topThreads ?? jvm.value.topCpuThreads ?? [];
  return list.map((t: TopThread) => ({
    name: t.name ?? "—",
    state: t.state ?? "—",
    cpuTime: t.cpuTime ?? 0,
    userTime: t.userTime ?? 0,
  }));
});

/* ================= 内存诊断：堆/非堆 + 内存池 ================= */
const heapMem = computed<MemoryUsage>(
  () => ({
    used: jvm.value.heapMemory?.used ?? info.value.jvmMemory?.used ?? 0,
    max: jvm.value.heapMemory?.max ?? info.value.jvmMemory?.max ?? 0,
  })
);
const nonHeapMem = computed<MemoryUsage>(
  () => ({
    used: jvm.value.nonHeapMemory?.used ?? 0,
    max: jvm.value.nonHeapMemory?.max ?? 0,
  })
);

function memPoolBar(pools: MemoryPoolInfo[] | undefined): Opt {
  const items = pools ?? [];
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (params: any[]) => {
      const p = params[0];
      return `${p.name}<br/>已用 ${(p.value! / 1024 / 1024).toFixed(0)} MB / 总计 ${(p.data.total! / 1024 / 1024).toFixed(0)} MB`;
    } },
    grid: { left: 0, right: 0, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: "value", axisLabel: { show: false }, axisTick: { show: false }, splitLine: { show: false } },
    yAxis: {
      type: "category",
      data: items.map((p) => p.name ?? "—"),
      axisLabel: { color: colors.textSecondary, fontSize: 10 },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [{
      type: "bar",
      data: items.map((p) => ({
        value: pct((p.used ?? 0) / Math.max(1, p.max ?? 1)),
        total: p.max ?? 0,
        itemStyle: { color: lvlColor(lvl(pct((p.used ?? 0) / Math.max(1, p.max ?? 1)))), borderRadius: [0, 3, 3, 0] },
      })),
      barWidth: 12,
    }],
  } as Opt;
}
const memPoolOpt = computed<Opt>(() => memPoolBar(pools.value));

/* ================= 性能诊断：CPU 环图 ================= */
const cpuRingOpt = computed<Opt>(() => {
  const p = cpuPct.value;
  const l = lvl(p);
  return {
    series: [{
      type: "gauge",
      radius: "76%",
      center: ["50%", "54%"],
      axisLine: { lineStyle: { width: 22, color: [[1, withAlpha(colors.fill, 1)]] } },
      axisTick: { show: false },
      splitLine: { distance: -18, length: 10, lineStyle: { color: colors.borderLight, width: 1 } },
      axisLabel: { distance: -24, fontSize: 9, color: colors.textSecondary },
      pointer: { show: false },
      progress: { show: true, width: 22, roundCap: true, tooltip: { show: false } },
      detail: {
        valueAnimation: true,
        fontSize: 28,
        fontWeight: 800,
        color: l === "danger" ? colors.danger : l === "warn" ? colors.warning : colors.textPrimary,
        offsetCenter: ["0%", "10%"],
        formatter: (v: number) => `${v.toFixed(0)}%`,
      },
      title: { fontSize: 10, color: colors.textSecondary, offsetCenter: ["0%", "60%"] },
      label: { show: false },
      data: [{ value: p, name: "" }],
    }],
  } as Opt;
});

/* ================= 性能诊断：负载柱状图 ================= */
const loadOpt = computed<Opt>(() => {
  const n = loadAvg.value;
  const cores = info.value.cpu?.logicalCores ?? 1;
  const v = cores > 0 ? Math.min(100, (n / cores) * 100) : 0;
  return {
    series: [{
      type: "bar",
      barWidth: 40,
      grid: { left: 0, right: 0, top: 12, bottom: 0, containLabel: false },
      xAxis: { type: "category", show: false, data: ["负载(1m)"] },
      yAxis: { type: "value", show: false, min: 0, max: 100 },
      tooltip: { show: true, formatter: () => `负载数 ${n.toFixed(2)} / ${cores} 核` },
      data: [{ value: Math.min(100, v), itemStyle: { color: lvlColor(lvl(v)), borderRadius: 6 } }],
    }],
  } as Opt;
});

/* ================= 性能诊断：接口统计 ================= */
const topUrlList = computed<RestfulTopUrl[]>(() => {
  const s = apiStats.value.summary ?? {};
  const top = apiStats.value.topUrls ?? [];
  return top.slice(0, 20).map((u) => ({
    key: u.key ?? u.url ?? "—",
    url: u.url ?? "—",
    method: u.method ?? "-",
    count: u.count ?? 0,
    success: u.success ?? 0,
    fail: u.fail ?? 0,
    avgMs: u.avgMs ?? 0,
  }));
});

</script>

<template>
  <div class="srv-page">
    <!-- ===== 页头 ===== -->
    <header class="srv-header">
      <div class="srv-header__meta">
        <h1 class="srv-header__title">服务诊断</h1>
        <p class="srv-header__sub">
          <span class="srv-host">{{ hostName }}</span>
          · {{ osInfo }}
          · <span class="srv-tag srv-tag--green">运行 {{ systemUptime }}</span>
          · {{ processCount }} 进程
        </p>
      </div>
      <div class="srv-header__ops">
        <span class="srv-info">{{ lastRefresh ? subTip : "未刷新" }}</span>
        <button class="srv-icon-btn" :disabled="loading" @click="void loadAll()" title="立即刷新">
          <el-icon :size="15"><Refresh /></el-icon>
        </button>
        <button class="srv-icon-btn" :class="{ 'is-active': autoPoll }" @click="autoPoll = !autoPoll" title="自动轮询">
          <el-icon :size="15"><Timer /></el-icon>
        </button>
      </div>
    </header>

    <!-- ===== 诊断 Tab ===== -->
    <nav class="srv-nav">
      <div class="srv-nav__head">
        <button class="srv-nav__list" role="tablist">
          <template v-for="t in tabItems" :key="t.key">
            <button class="srv-nav__item" :class="{ 'is-active': activeTab === t.key }"
                    :role="activeTab === t.key ? 'tab' : undefined"
                    :aria-selected="activeTab === t.key ? 'true' : undefined"
                    @click="activeTab = t.key">
              <span class="srv-nav__dot"></span>
              <span class="srv-nav__name">{{ t.label }}</span>
            </button>
          </template>
        </button>
      </div>
    </nav>

    <!-- ===== 内容 ===== -->
    <main class="srv-main">
      <div v-show="activeTab === 'thread'" class="srv-body">
        <section class="srv-card">
          <div class="srv-card__head">
            <h3 class="srv-card__title">线程池概览</h3>
          </div>
          <div class="srv-card__body">
            <div class="srv-dgrid">
              <div><span>活动线程</span><b>{{ threadCount }}</b></div>
              <div><span>峰值线程</span><b>{{ peakThreadCount }}</b></div>
              <div><span>守护线程</span><b>{{ daemonThreadCount }}</b></div>
              <div><span>死锁</span><b :style="{ color: deadlockedCount > 0 ? colors.danger : colors.textSecondary }">{{ deadlockedCount }}</b></div>
            </div>
          </div>
        </section>
        <section class="srv-pane__group srv-diag-grid">
          <section class="srv-card srv-diag-card--wide">
            <div class="srv-card__head">
              <h3 class="srv-card__title">线程状态分布</h3>
              <p class="srv-card__sub">NEW / RUNNABLE / BLOCKED / WAITING / TIMED_WAITING / TERMINATED</p>
            </div>
            <div class="srv-card__chart">
              <ReEChart :option="threadStatesOpt" height="310px" :loading="loading" />
            </div>
          </section>
          <section class="srv-card">
            <div class="srv-card__head">
              <h3 class="srv-card__title">Top CPU 线程</h3>
            </div>
            <div class="srv-card__body srv-diag-table">
              <table>
                <thead>
                  <tr><th>线程名</th><th>状态</th><th>CPU 时间</th><th>用户时间</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(t, i) in topThreads" :key="`${t.name}-${i}`">
                    <td class="srv-table__mono">{{ t.name }}</td>
                    <td>{{ t.state }}</td>
                    <td>{{ t.cpuTime ?? 0 }} ms</td>
                    <td>{{ t.userTime ?? 0 }} ms</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="topThreads.length === 0" class="srv-empty-inline">无线程采样数据</p>
            </div>
          </section>
        </section>
      </div>

      <div v-show="activeTab === 'memory'" class="srv-body">
        <section class="srv-card">
          <div class="srv-card__head">
            <h3 class="srv-card__title">内存概览</h3>
          </div>
          <div class="srv-card__body">
            <div class="srv-dgrid">
              <div><span>堆已用</span><b>{{ formatBytes(heapMem.used) }}</b></div>
              <div><span>堆最大</span><b>{{ formatBytes(heapMem.max) }}</b></div>
              <div><span>非堆已用</span><b>{{ formatBytes(nonHeapMem.used) }}</b></div>
              <div><span>堆占用率</span><b :style="{ color: lvlColor(lvl(jvmMemPct)) }">{{ jvmMemPct }}%</b></div>
            </div>
          </div>
        </section>
        <section class="srv-pane__group srv-diag-grid">
          <section class="srv-card">
            <div class="srv-card__head">
              <h3 class="srv-card__title">堆 / 非堆</h3>
            </div>
            <div class="srv-card__body srv-mem-diag">
              <div class="srv-bar-row">
                <label>非堆使用</label>
                <div class="srv-bar"><i class="srv-bar__fill" :class="lvl(pct(nonHeapMem.used / Math.max(1, nonHeapMem.max)))" :style="{ width: pct(nonHeapMem.used / Math.max(1, nonHeapMem.max)) + '%' }"></i></div>
                <b>{{ formatBytes(nonHeapMem.used) }}</b>
              </div>
              <div class="srv-bar-row">
                <label>堆使用</label>
                <div class="srv-bar"><i class="srv-bar__fill" :class="lvl(jvmMemPct)" :style="{ width: jvmMemPct + '%' }"></i></div>
                <b>{{ formatBytes(heapMem.used) }} / {{ formatBytes(heapMem.max) }}</b>
              </div>
            </div>
          </section>
          <section class="srv-card">
            <div class="srv-card__head">
              <h3 class="srv-card__title">内存池使用率</h3>
            </div>
            <div class="srv-card__chart">
              <ReEChart :option="memPoolOpt" height="220px" :loading="loading" />
            </div>
          </section>
        </section>
        <section v-if="pools.length > 0" class="srv-card">
          <div class="srv-card__head"><h3 class="srv-card__title">内存池明细</h3></div>
          <div class="srv-card__body srv-diag-table">
            <table>
              <thead>
                <tr><th>名称</th><th>类型</th><th>已用</th><th>已提交</th><th>最大</th><th>使用率</th></tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in pools" :key="`pool-${i}`">
                  <td class="srv-table__mono">{{ p.name ?? "—" }}</td>
                  <td>{{ p.type ?? "—" }}</td>
                  <td>{{ formatBytes(p.used) }}</td>
                  <td>{{ formatBytes(p.committed) }}</td>
                  <td>{{ formatBytes(p.max) }}</td>
                  <td :style="{ color: lvlColor(lvl(pct(p.used / Math.max(1, p.max ?? 0)))) }">{{ pct(p.used / Math.max(1, p.max ?? 0)) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <section v-if="(info.gcCollectors ?? jvm.garbageCollectors ?? []).length > 0" class="srv-card">
          <div class="srv-card__head"><h3 class="srv-card__title">GC 收集器</h3></div>
          <div class="srv-card__body">
            <div class="srv-dgrid">
              <div v-for="(g, i) in (info.gcCollectors ?? jvm.garbageCollectors)" :key="`gc-${i}`">
                <span>{{ g.name ?? "—" }}</span>
                <b>{{ g.collectionCount ?? 0 }}</b><em>总耗时 {{ g.collectionTime ?? 0 }} ms</em>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-show="activeTab === 'perf'" class="srv-body">
        <section class="srv-card">
          <div class="srv-card__head">
            <h3 class="srv-card__title">性能概览</h3>
          </div>
          <div class="srv-card__body srv-diag-grid">
            <div class="srv-mem-panel srv-diag-center">
              <div class="srv-card__chart srv-diag-chart">
                <ReEChart :option="cpuRingOpt" height="220px" :loading="loading" />
              </div>
              <p class="srv-diag-row"><label>CPU 使用率</label><b>{{ cpuPct }}%</b></p>
            </div>
            <div class="srv-mem-panel srv-diag-center">
              <div class="srv-card__chart srv-diag-chart">
                <ReEChart :option="loadOpt" height="220px" :loading="loading" />
              </div>
              <p class="srv-diag-row"><label>系统负载</label><b>{{ loadAvg }} / {{ info.cpu?.logicalCores }} 核</b></p>
            </div>
          </div>
        </section>
        <section class="srv-card">
          <div class="srv-card__head">
            <h3 class="srv-card__title">Top 接口</h3>
            <p class="srv-card__sub">按请求数排序（最近一轮采样）</p>
          </div>
          <div class="srv-card__body srv-diag-table">
            <table>
              <thead>
                <tr><th>接口</th><th>方式</th><th>请求数</th><th>成功</th><th>失败</th><th>平均耗时</th></tr>
              </thead>
              <tbody>
                <tr v-for="(u, i) in topUrlList" :key="`u-${i}`">
                  <td class="srv-table__mono">{{ u.url }}</td>
                  <td>{{ u.method }}</td>
                  <td>{{ u.count }}</td>
                  <td :style="{ color: colors.success }">{{ u.success }}</td>
                  <td :style="{ color: u.fail > 0 ? colors.danger : colors.textSecondary }">{{ u.fail }}</td>
                  <td>{{ u.avgMs }} ms</td>
                </tr>
              </tbody>
            </table>
            <p v-if="topUrlList.length === 0" class="srv-empty-inline">无接口采样数据</p>
          </div>
        </section>
      </div>
    </main>

    <!-- ===== 底部状态栏 ===== -->
    <footer class="srv-foot">
      <div class="srv-foot__sys">
        <div class="srv-conn" :class="refreshErr ? 'srv-conn--disconnected' : 'srv-conn--live'">
          <span class="srv-conn__dot"></span>
          <span class="srv-conn__len">{{ refreshErr ? "连接断开" : "数据正常" }}</span>
        </div>
      </div>
      <div class="srv-foot__sys">
        <div class="srv-foot__left">{{ lastRefresh ? `更新于 ${lastRefresh}` : '—' }}</div>
        <div class="srv-foot__right">刷新耗时 {{ loading ? '…' : '0 ms' }}</div>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
/* ===== 页面容器 ===== */
.srv-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  overflow: hidden;
}

/* ===== 页头 ===== */
.srv-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.srv-header__meta { min-width: 0; }
.srv-header__title {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}
.srv-header__sub {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}
.srv-host { color: var(--el-text-color-regular); font-weight: 600; }
.srv-tag--green { background: var(--el-color-success); color: #fff; padding: 2px 6px; border-radius: 4px; }
.srv-header__ops {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.srv-info {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
  margin-right: 8px;
}

/* ========== Tab 栏（复用 srv-nav） ========== */
.srv-nav {
  flex: none;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.srv-nav__list {
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 2px;
}
.srv-nav__item {
  display: grid;
  grid-template-columns: 6px minmax(0, 1fr);
  align-items: center;
  gap: 0 8px;
  padding: 11px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}
.srv-nav__item:hover { color: var(--el-color-primary); }
.srv-nav__item.is-active { color: var(--el-color-primary); border-bottom-color: var(--el-color-primary); }
.srv-nav__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--el-border-color-lighter); }
.srv-nav__item.is-active .srv-nav__dot { background: var(--el-color-primary); }

/* ===== 内容区 ===== */
.srv-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
.srv-body {
  flex: 1;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== 卡片 ===== */
.srv-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}
.srv-card__head {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.srv-card__title { margin: 0; font-size: 13px; font-weight: 700; color: var(--el-text-color-primary); }
.srv-card__sub { margin: 2px 0 0; font-size: 9px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--el-text-color-placeholder); }
.srv-card__body { padding: 12px 16px; }
.srv-card__chart { padding: 8px 16px 16px; }

/* ========== 诊断 Grid（双列自适应） ========== */
.srv-diag-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.7fr);
  gap: 14px;
}
.srv-diag-card--wide { min-width: 0; }

/* ========== 表格 ========== */
.srv-diag-table { overflow: auto; }
.srv-diag-table table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
.srv-diag-table th {
  text-align: left;
  padding: 6px 8px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.srv-diag-table td { padding: 7px 8px; color: var(--el-text-color-regular); border-bottom: 1px dashed var(--el-border-color-extra-light); }
.srv-diag-table .srv-table__mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--el-text-color-regular); }
.srv-empty-inline { margin: 14px 0 0; font-size: 11px; color: var(--el-text-color-placeholder); text-align: center; }

/* ========== 内存条 ========== */
.srv-bar-row {
  display: grid;
  grid-template-columns: 1.1fr 1.6fr minmax(0, 50px);
  gap: 10px;
  align-items: center;
  padding: 5px 0;
  font-size: 11px;
}
.srv-bar {
  height: 8px;
  border-radius: 4px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.srv-bar__fill { display: block; height: 100%; border-radius: inherit; transition: width 0.3s ease; }
.srv-bar__fill.is-ok { background: var(--el-color-success); }
.srv-bar__fill.is-warn { background: var(--el-color-warning); }
.srv-bar__fill.is-danger { background: var(--el-color-danger); }

/* ========== 性能格 ========== */
.srv-mem-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  min-width: 0;
}
.srv-diag-chart { margin-bottom: 8px; }
.srv-diag-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-regular);
}
.srv-diag-row b { font-size: 13px; font-weight: 700; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }

/* ===== 底部状态栏 ===== */
.srv-foot {
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}
.srv-foot__sys { display: flex; align-items: center; gap: 10px; padding: 7px 16px; }
.srv-foot__left { color: var(--el-text-color-primary); }
.srv-foot__right { justify-self: end; }
.srv-conn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.srv-conn__dot { width: 5px; height: 5px; border-radius: 50%; background: var(--el-color-success); }
.srv-conn--disconnected .srv-conn__dot { background: var(--el-color-danger); }

/* ===== 按钮 ===== */
.srv-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.srv-icon-btn:hover:not(:disabled) { border-color: var(--el-color-primary-light-7); color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.srv-icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.srv-icon-btn.is-active { border-color: var(--el-color-primary); color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
</style>
