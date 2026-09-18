<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">JVM 实时指标</span>
        <ReStatusIndicator :type="live ? 'success' : 'info'" :pulse="live" />
        <span class="live-hint" v-if="live">5s 自动刷新中</span>
      </div>
      <div class="toolbar-right">
        <ReRadioGroup v-model="metricsWindow" size="small" @change="onWindowChange">
          <ReRadioButton v-for="w in windowOptions" :key="w.value" :value="w.value" :label="w.label" />
        </ReRadioGroup>
        <ReButton size="small" icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <ReSkeleton :loading="loading" :rows="3" animated v-if="!snapshot">
      <div class="skeleton-box" />
    </ReSkeleton>

    <template v-else>
      <!-- 内存 -->
      <div class="panel-row">
        <div class="panel">
          <div class="panel-head"><span>堆内存</span><span class="panel-sub">Used / Max</span></div>
          <div class="metric-line">
            <div class="metric-value">{{ mb(snapshot.memory.heapUsed) }}<span class="metric-unit"> / {{ mb(snapshot.memory.heapMax) }} MB</span></div>
            <div class="meter"><div class="meter-fill" :style="{ width: snapshot.memory.heapUsedPercent + '%' }" /></div>
            <ReTag :type="snapshot.memory.heapUsedPercent > 85 ? 'danger' : snapshot.memory.heapUsedPercent > 60 ? 'warning' : 'success'" size="small" round>
              {{ snapshot.memory.heapUsedPercent.toFixed(1) }}%
            </ReTag>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><span>非堆内存</span><span class="panel-sub">Metaspace / CodeCache</span></div>
          <div class="metric-line">
            <div class="metric-value">{{ mb(snapshot.memory.nonHeapUsed) }}<span class="metric-unit"> MB</span></div>
          </div>
        </div>
      </div>

      <div class="panel-row">
        <ReStatCard title="进程 CPU" :value="snapshot.cpu.processCpuLoad.toFixed(1) + ' %'" :desc="`核心数 ${snapshot.cpu.cpuCores}`" :icon="Odometer" icon-color="#3b82f6" />
        <ReStatCard title="GC 次数" :value="snapshot.gc.gcCount" :desc="`总耗时 ${snapshot.gc.gcTimeMs} ms · ${snapshot.gc.collectors.length} 收集器`" :icon="RefreshRight" icon-color="#8b5cf6" />
        <ReStatCard title="线程数" :value="snapshot.threads.liveThreads" :desc="`峰值 ${snapshot.threads.peakThreads} · 守护 ${snapshot.threads.daemonThreads}`" :icon="Connection" icon-color="#22c55e" />
        <ReStatCard title="系统负载" :value="snapshot.cpu.systemLoadAverage > 0 ? snapshot.cpu.systemLoadAverage.toFixed(2) : 'n/a'" :desc="`单核 ${snapshot.cpu.loadPerCore.toFixed(2)}`" :icon="DataLine" icon-color="#f59e0b" />
      </div>

      <!-- GC 收集器 + 网络 -->
      <div class="panel-row">
        <div class="panel">
          <div class="panel-head"><span>GC 收集器</span></div>
          <div class="chip-row">
            <ReTag v-for="c in snapshot.gc.collectors" :key="c" type="info" effect="plain" round>{{ c }}</ReTag>
            <ReTag v-if="!snapshot.gc.collectors.length" type="info" round>无</ReTag>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><span>进程信息</span></div>
          <ReDescriptions :column="2" border size="small">
            <ReDescriptionsItem label="PID">{{ (snapshot.process as Record<string, unknown>).pid ?? '—' }}</ReDescriptionsItem>
            <ReDescriptionsItem label="主机">{{ (snapshot.process as Record<string, unknown>).hostName ?? '—' }}</ReDescriptionsItem>
            <ReDescriptionsItem label="JVM">{{ String((snapshot.process as Record<string, unknown>).vmVersion ?? '—') }}</ReDescriptionsItem>
            <ReDescriptionsItem label="运行时长">{{ uptime }}</ReDescriptionsItem>
          </ReDescriptions>
        </div>
      </div>

      <!-- 指标趋势 -->
      <div class="panel">
        <div class="panel-head"><span>指标趋势</span><span class="panel-sub">时间窗 {{ metricsWindow }} 分钟（后端 /jvm/metrics）</span></div>
        <div ref="trendRef" class="trend-chart" />
      </div>

      <!-- 线程池 / 连接池（2026 增强 R3） -->
      <div class="panel-row">
        <div class="panel">
          <div class="panel-head"><span>线程池</span><span class="panel-sub">按线程名分组（/thread-pools）</span></div>
          <el-table :data="threadPools" class="apm-table" size="small" empty-text="暂无线程池数据">
            <el-table-column prop="name" label="线程组" min-width="140">
              <template #default="{ row }">
                <span class="mono">
                  {{ row.name }}
                  <ReTag v-if="row.knownPool" type="success" size="small" round effect="plain" style="margin-left:6px">已知池</ReTag>
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="总数" width="70" align="right" />
            <el-table-column prop="daemonCount" label="守护线程" width="80" align="right" />
            <el-table-column label="状态分布" min-width="180">
              <template #default="{ row }">
                <span class="mono muted">{{ stateText(row.sampleStates) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="panel">
          <div class="panel-head"><span>连接池</span><span class="panel-sub">按目标端点分组 + OS-FD（/connection-pools）</span></div>
          <el-table :data="connectionPools" class="apm-table" size="small" empty-text="暂无连接池数据">
            <el-table-column label="端点" min-width="160">
              <template #default="{ row }">
                <span class="mono">{{ row.endpoint }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="callCount" label="调用量" width="80" align="right" />
            <el-table-column label="平均耗时" width="90" align="right">
              <template #default="{ row }">
                <span class="mono">{{ row.avgMs.toFixed ? row.avgMs.toFixed(1) : row.avgMs }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="activeLeakCount" label="活跃泄漏" width="80" align="right" />
            <el-table-column label="最后调用" min-width="140">
              <template #default="{ row }">
                <span class="mono muted">{{ row.openFileDescriptors !== undefined ? 'OS-FD ' + row.openFileDescriptors : (row.lastCallAt || '—') }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import * as echarts from "echarts";
import { Odometer, RefreshRight, Connection, DataLine } from "@element-plus/icons-vue";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTag from "@repo/ui/re-tag";
import ReButton from "@repo/ui/re-button";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatusIndicator from "@repo/ui/re-status-indicator";
import { ReDescriptions, ReDescriptionsItem, ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";
import { getJvmSnapshot, getJvmMetrics, getThreadPools, getConnectionPools } from "../api/apmApi";
import type { JvmSnapshot, JvmMetricPoint, ThreadPoolStat, ConnectionPoolStat, ThreadStateSample } from "../api/apmApi";

const snapshot = ref<JvmSnapshot | null>(null);
const loading = ref(false);
const live = ref(false);
const trendRef = ref<HTMLElement | null>(null);
let timer: number | undefined;
let chart: echarts.ECharts | null = null;

/** 线程池 / 连接池（2026 增强 R3，随 5s 轮询静默刷新） */
const threadPools = ref<ThreadPoolStat[]>([]);
const connectionPools = ref<ConnectionPoolStat[]>([]);

function stateText(states: ThreadStateSample[] | undefined): string {
  if (!states?.length) return "—";
  return states.map((s) => `${s.state}×${s.count}`).join(" / ");
}

/** 趋势图数据源（后端 /jvm/metrics 环形缓冲，跨路由/刷新不丢数据） */
const metrics = ref<JvmMetricPoint[]>([]);
/** 时间窗（分钟） */
const metricsWindow = ref(30);
const windowOptions = [
  { value: 5, label: "5 分钟" },
  { value: 15, label: "15 分钟" },
  { value: 30, label: "30 分钟" },
  { value: 60, label: "1 小时" },
];

function onWindowChange() {
  loadTrend();
}

function fmtTs(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const uptime = computed(() => {
  const p = snapshot.value?.process as Record<string, unknown> | undefined;
  const up = Number(p?.uptimeMs ?? 0);
  if (!up) return "—";
  const s = Math.floor(up / 1000);
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
});

function mb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}

async function load() {
  loading.value = true;
  try {
    snapshot.value = await getJvmSnapshot();
  } catch {
    /* 后端未就绪时静默降级 */
  } finally {
    loading.value = false;
  }
  await loadTrend();
}

async function loadTrend() {
  try {
    const points = await getJvmMetrics(metricsWindow.value);
    metrics.value = [...points].sort((a, b) => a.ts - b.ts);
  } catch {
    metrics.value = [];
  }
  renderTrend();
  loadPoolStats();
}

/** 线程池 / 连接池统计（失败静默，不影响主视图） */
async function loadPoolStats() {
  try {
    threadPools.value = (await getThreadPools()) || [];
  } catch {
    threadPools.value = [];
  }
  try {
    connectionPools.value = (await getConnectionPools()) || [];
  } catch {
    connectionPools.value = [];
  }
}

function renderTrend() {
  if (!trendRef.value) return;
  if (!chart) chart = echarts.init(trendRef.value, "dark");
  const labels = metrics.value.map((p) => fmtTs(p.ts));
  chart.setOption({
    backgroundColor: "transparent",
    legend: { top: 0, textStyle: { color: "#e6edf7" } },
    grid: { left: 40, right: 40, top: 28, bottom: 24 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", boundaryGap: false, data: labels, axisLabel: { color: "#e6edf7" } },
    yAxis: [
      { type: "value", name: "%", min: 0, max: 100, axisLabel: { color: "#e6edf7" } },
      { type: "value", name: "次 / 线程", axisLabel: { color: "#e6edf7" } },
    ],
    series: [
      {
        name: "堆使用率",
        type: "line",
        smooth: true,
        symbol: "none",
        data: metrics.value.map((p) => Number(p.heapPercent.toFixed(1))),
        lineStyle: { color: "#3b82f6", width: 2 },
        areaStyle: { color: "rgba(59,130,246,0.25)" },
      },
      {
        name: "GC 次数",
        type: "line",
        smooth: true,
        symbol: "none",
        yAxisIndex: 1,
        data: metrics.value.map((p) => p.gcCount),
        lineStyle: { color: "#8b5cf6", width: 1.5 },
      },
      {
        name: "线程数",
        type: "line",
        smooth: true,
        symbol: "none",
        yAxisIndex: 1,
        data: metrics.value.map((p) => p.liveThreads),
        lineStyle: { color: "#22c55e", width: 1.5 },
      },
    ],
  });
}

onMounted(() => {
  load();
  live.value = true;
  timer = window.setInterval(load, 5000);
});

onBeforeUnmount(() => {
  live.value = false;
  if (timer) window.clearInterval(timer);
  chart?.dispose();
  chart = null;
});
</script>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-label {
  font-size: 14px;
  font-weight: 600;
}
.live-hint {
  font-size: 12px;
  color: var(--apm-success, #22c55e);
}
.panel-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.panel {
  background: var(--apm-panel);
  border: 1px solid var(--apm-border);
  border-radius: 14px;
  padding: 16px;
}
.panel-head {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.panel-sub {
  font-size: 12px;
  color: var(--apm-muted);
  font-weight: 400;
}
.metric-line {
  display: flex;
  align-items: center;
  gap: 14px;
}
.metric-value {
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.metric-unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--apm-muted);
  margin-left: 4px;
}
.meter {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}
.meter-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #22c55e, #f59e0b 70%, #ef4444);
  transition: width 0.5s ease;
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.trend-chart {
  height: 220px;
}
.skeleton-box {
  height: 300px;
}
@media (max-width: 900px) {
  .panel-row {
    grid-template-columns: 1fr;
  }
}
</style>
