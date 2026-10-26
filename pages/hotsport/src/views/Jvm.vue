<template>
  <div class="view">
    <!-- 操作条：无标题大卡，实时推送驱动 -->
    <div class="view-bar">
      <span class="match-hint">
        <ReStatusIndicator :type="live ? 'success' : 'info'" :pulse="live" />
        <template v-if="live"> 实时推送中</template>
        <template v-if="snapshot"> · 快照 {{ snapshotTime }}</template>
      </span>
      <div class="view-bar__actions">
        <ReRadioGroup v-model="metricsWindow" @change="onWindowChange">
          <ReRadioButton v-for="w in windowOptions" :key="w.value" :value="w.value" :label="w.label" />
        </ReRadioGroup>
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </div>
    </div>

    <!-- 首次加载：骨架屏；后端不可用时给出空态，不留白 -->
    <ReSkeleton v-if="!snapshot && (loading || !initialized)" :loading="true" :rows="4" animated />
    <div class="panel" v-else-if="!snapshot">
      <div class="panel-empty">暂无 JVM 快照数据<br />请确认 Agent 在线后点击刷新</div>
    </div>

    <template v-else>
      <!-- 关键指标：全部来自 /jvm/snapshot，不做前端虚构 -->
      <div class="stat-row">
        <ReStatCard
          size="compact"
          title="堆内存使用率"
          :value="heapPercent.toFixed(1) + ' %'"
          :desc="`${mb(snapshot.memory.heapUsed)} / ${mb(snapshot.memory.heapMax)} MB 已用`"
          :icon="Odometer"
          :icon-color="levelToken(heapLevel)"
        />
        <ReStatCard
          size="compact"
          title="线程数"
          :value="snapshot.threads.liveThreads"
          :desc="`峰值 ${snapshot.threads.peakThreads} · 守护 ${snapshot.threads.daemonThreads}`"
          :icon="Connection"
          icon-color="var(--apm-accent)"
        />
        <ReStatCard
          size="compact"
          title="GC 次数"
          :value="snapshot.gc.gcCount"
          :desc="`总耗时 ${snapshot.gc.gcTimeMs} ms · ${snapshot.gc.collectors.length} 收集器`"
          :icon="RefreshRight"
          icon-color="var(--apm-accent-alt)"
        />
        <ReStatCard
          size="compact"
          title="运行时长"
          :value="uptime"
          :desc="`PID ${pidText} · ${snapshot.cpu.cpuCores} 核`"
          :icon="Timer"
          icon-color="var(--apm-warning)"
        />
      </div>

      <!-- 水位条：内存/CPU 百分比用进度条直读，超 60% 警告、超 80% 危险 -->
      <div class="panel-row">
        <div class="panel">
          <div class="panel-head">
            <span>堆内存</span>
            <span class="panel-sub">Used / Max · 已提交 {{ mb(snapshot.memory.heapCommitted) }} MB</span>
          </div>
          <div class="metric-line">
            <div class="metric-value">
              {{ mb(snapshot.memory.heapUsed) }}<span class="metric-unit"> / {{ mb(snapshot.memory.heapMax) }} MB</span>
            </div>
            <ReTag :type="heapLevel" round>{{ heapPercent.toFixed(1) }} %</ReTag>
          </div>
          <div
            class="meter"
            role="progressbar"
            aria-label="堆内存使用率"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Number(heapPercent.toFixed(1))"
          >
            <div class="meter-fill" :class="heapLevel" :style="{ width: heapPercent + '%' }" />
          </div>
          <div class="metric-foot">
            <span>非堆内存 {{ mb(snapshot.memory.nonHeapUsed) }} MB</span>
            <span class="muted">水位线 60% / 80%</span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <span>进程 CPU</span>
            <span class="panel-sub">
              核心数 {{ snapshot.cpu.cpuCores }} · 系统负载 {{ loadText(snapshot.cpu.systemLoadAverage) }}
            </span>
          </div>
          <div class="metric-line">
            <div class="metric-value">{{ cpuPercent.toFixed(1) }}<span class="metric-unit"> %</span></div>
            <ReTag :type="cpuLevel" round>{{ cpuLevel === "danger" ? "高负载" : cpuLevel === "warning" ? "偏高" : "正常" }}</ReTag>
          </div>
          <div
            class="meter"
            role="progressbar"
            aria-label="进程 CPU 使用率"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Number(cpuPercent.toFixed(1))"
          >
            <div class="meter-fill" :class="cpuLevel" :style="{ width: cpuPercent + '%' }" />
          </div>
          <div class="metric-foot">
            <span>单核负载 {{ snapshot.cpu.loadPerCore.toFixed(2) }}</span>
            <span class="muted">水位线 60% / 80%</span>
          </div>
        </div>
      </div>

      <!-- GC 收集器 + 进程信息 -->
      <div class="panel-row">
        <div class="panel">
          <div class="panel-head">
            <span>GC 收集器</span>
            <span class="panel-sub">JVM 启动时注册的收集器名称</span>
          </div>
          <div class="chip-row" v-if="snapshot.gc.collectors.length">
            <ReTag v-for="c in snapshot.gc.collectors" :key="c" type="info" effect="plain" round>{{ c }}</ReTag>
          </div>
          <div v-else class="panel-empty gc-empty">未检测到 GC 收集器</div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <span>进程信息</span>
            <span class="panel-sub">PID / 主机 / JVM 版本 / 启动时长</span>
          </div>
          <ReDescriptions :column="2" border>
            <ReDescriptionsItem label="PID">{{ pidText }}</ReDescriptionsItem>
            <ReDescriptionsItem label="主机">{{ hostText }}</ReDescriptionsItem>
            <ReDescriptionsItem label="JVM">{{ vmVersionText }}</ReDescriptionsItem>
            <ReDescriptionsItem label="运行时长">{{ uptime }}</ReDescriptionsItem>
          </ReDescriptions>
        </div>
      </div>

      <!-- 指标趋势 -->
      <div class="panel">
        <div class="panel-head">
          <span>指标趋势</span>
          <span class="panel-sub">
            时间窗 {{ metricsWindow }} 分钟 · 堆使用率 / GC 次数 / 线程数（后端 /jvm/metrics）
          </span>
        </div>
        <div v-if="!metrics.length" class="panel-empty">
          该时间窗内暂无指标采样<br />5s 轮询开始后会逐步累积
        </div>
        <ReEcharts v-else :option="trendOption" theme="light" height="240px" />
      </div>

      <!-- 线程池 / 连接池 -->
      <div class="panel-row">
        <div class="panel">
          <div class="panel-head">
            <span>线程池</span>
            <span class="panel-sub">按线程名分组 · {{ threadPools.length }} 组（/thread-pools）</span>
          </div>
          <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM，
               .apm-table 变量覆盖与 e2e 的 .el-table__body 选择器不失效；
               pagination=false / toolbar=false —— 原表既无分页也无工具栏按钮；
               原 el-table 没写 border → settings.border=false 抑制默认边框；
               layout-table.minHeight=0 关掉组件默认的 440px 撑高与 fill 自适应。
               本页两张表各自独立 columns，插槽名互不重名（#col-name/#col-states 与
               #col-endpoint/#col-avgMs/#col-lastCall），作用域无歧义。 -->
          <ReTable
            :data="threadPools as unknown as Record<string, unknown>[]"
            :columns="threadPoolColumns"
            engine="element"
            :settings="{ border: false }"
            :layout-table="{ minHeight: 0 }"
            class="apm-table"
            empty-text="暂无线程池数据"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          >
            <template #col-name="{ row }">
              <span class="mono">
                {{ row.name }}
                <ReTag v-if="row.knownPool" type="success" round effect="plain" style="margin-left: 6px">已知池</ReTag>
              </span>
            </template>
            <template #col-states="{ row }">
              <span class="mono muted">{{ stateTextOf(row) }}</span>
            </template>
          </ReTable>
        </div>
        <div class="panel">
          <div class="panel-head">
            <span>连接池</span>
            <span class="panel-sub">按目标端点分组 + OS-FD · {{ connectionPools.length }} 组（/connection-pools）</span>
          </div>
          <ReTable
            :data="connectionPools as unknown as Record<string, unknown>[]"
            :columns="connectionPoolColumns"
            engine="element"
            :settings="{ border: false }"
            :layout-table="{ minHeight: 0 }"
            class="apm-table"
            empty-text="暂无连接池数据"
            :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          >
            <template #col-endpoint="{ row }">
              <span class="mono">{{ row.endpoint }}</span>
            </template>
            <template #col-avgMs="{ row }">
              <span class="mono">{{ avgMsText(row) }}</span>
            </template>
            <template #col-lastCall="{ row }">
              <span class="mono muted">{{ lastCallText(row) }}</span>
            </template>
          </ReTable>
        </div>
      </div>

      <!-- 文件句柄：OS 级 FD + Agent 跟踪句柄（真实数据，来自 /agent/handles） -->
      <div class="panel">
        <div class="panel-head">
          <span>文件句柄</span>
          <span class="panel-sub">
            OS 级 FD {{ handleSnapshot?.fileDescriptors?.length ?? 0 }} 个 ·
            跟踪句柄 {{ handleSnapshot?.trackedHandles?.length ?? 0 }} 个
            <template v-if="openHandleCount"> · 未关闭 {{ openHandleCount }}</template>
          </span>
        </div>
        <ReTable
          :data="fdRows as unknown as Record<string, unknown>[]"
          :columns="fdColumns"
          engine="element"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table"
          empty-text="暂无文件句柄数据（/agent/handles 未开放或当前平台不支持）"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-fd="{ row }">
            <span class="mono">{{ row.fd }}</span>
          </template>
          <template #col-target="{ row }">
            <span class="mono fd-target" :title="row.target">{{ row.target }}</span>
          </template>
        </ReTable>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Connection, Odometer, RefreshRight, Timer } from "@element-plus/icons-vue";
import type { EChartsOption } from "echarts";
import ReStatCard from "@repo/ui/re-stat-card";
import ReTag from "@repo/ui/re-tag";
import ReButton from "@repo/ui/re-button";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReStatusIndicator from "@repo/ui/re-status-indicator";
import ReEcharts from "@repo/ui/re-echarts";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { ReDescriptions, ReDescriptionsItem, ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";
import { getJvmSnapshot, getJvmMetrics, getThreadPools, getConnectionPools, getHandleInventory } from "../api/apmApi";
import type { JvmSnapshot, JvmMetricPoint, ThreadPoolStat, ConnectionPoolStat, ThreadStateSample, HandleInventorySnapshot } from "../api/apmApi";
import { useRealtimeEvent } from "../composables/useRealtime";
import {
  areaGradient,
  axisTextColor,
  baseGrid,
  baseTooltip,
  categoryAxis,
  chartCanvas,
  chartColor,
  valueAxis,
} from "../styles/chartTheme";

const snapshot = ref<JvmSnapshot | null>(null);
const loading = ref(false);
const initialized = ref(false);
const live = ref(false);
/** 文件句柄快照（/agent/handles） */
const handleSnapshot = ref<HandleInventorySnapshot | null>(null);

/** 线程池 / 连接池（随实时推送静默刷新） */
const threadPools = ref<ThreadPoolStat[]>([]);
const connectionPools = ref<ConnectionPoolStat[]>([]);

function stateText(states: ThreadStateSample[] | undefined): string {
  if (!states?.length) return "—";
  return states.map((s) => `${s.state}×${s.count}`).join(" / ");
}

/**
 * 线程池表列配置（原 4 个 el-table-column 收敛到这里）。
 *
 * <p>标题都是写死文案（没有 t()），用普通常量即可。「状态分布」原 el-table-column
 * 没有 prop，补稳定合成 prop，模板 #col-states 对应。</p>
 */
const threadPoolColumns: ReTableColumn[] = [
  { prop: "name", label: "线程组", minWidth: 140, slot: "name" },
  { prop: "count", label: "总数", width: 70, align: "right" },
  { prop: "daemonCount", label: "守护线程", width: 80, align: "right" },
  { prop: "states", label: "状态分布", minWidth: 180, slot: "states" },
];

/**
 * 连接池表列配置（原 5 个 el-table-column 收敛到这里）。
 *
 * <p>「端点 / 平均耗时 / 最后调用」原 el-table-column 没有 prop，补稳定合成 prop
 * （lastCall 承载「OS-FD 计数 / 最后调用时间」这格），模板 #col-* 一一对应。</p>
 */
const connectionPoolColumns: ReTableColumn[] = [
  { prop: "endpoint", label: "端点", minWidth: 160, slot: "endpoint" },
  { prop: "callCount", label: "调用量", width: 80, align: "right" },
  { prop: "avgMs", label: "平均耗时", width: 90, align: "right", slot: "avgMs" },
  { prop: "activeLeakCount", label: "活跃泄漏", width: 80, align: "right" },
  { prop: "lastCall", label: "最后调用", minWidth: 140, slot: "lastCall" },
];

/** 插槽里的 row 是宽类型（unknown）：状态分布入参先收窄成线程采样数组（原 stateText(row.sampleStates) 同义） */
function stateTextOf(row: Record<string, unknown>): string {
  const states = Array.isArray(row.sampleStates)
    ? (row.sampleStates as ThreadStateSample[])
    : undefined;
  return stateText(states);
}

/** 平均耗时：原模板 row.avgMs.toFixed ? row.avgMs.toFixed(1) : row.avgMs，这里原样保留该口径 */
function avgMsText(row: Record<string, unknown>): string {
  const v = row.avgMs as { toFixed?: (fractionDigits: number) => string } | null | undefined;
  return v?.toFixed ? v.toFixed(1) : String(v ?? "");
}

/** 最后调用：原模板 openFileDescriptors 存在则显示 OS-FD 计数，否则显示最后调用时间 */
function lastCallText(row: Record<string, unknown>): string {
  if (row.openFileDescriptors !== undefined) return `OS-FD ${row.openFileDescriptors}`;
  return String(row.lastCallAt || "—");
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

/** 快照采集时间（工具栏提示，避免误以为页面停在旧数据） */
const snapshotTime = computed(() => {
  const ts = Number(snapshot.value?.ts ?? 0);
  return ts > 0 ? fmtTs(ts) : "—";
});

const uptime = computed(() => {
  const p = snapshot.value?.process as Record<string, unknown> | undefined;
  const up = Number(p?.uptimeMs ?? 0);
  if (!up) return "—";
  const s = Math.floor(up / 1000);
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
});

const pidText = computed(() => String((snapshot.value?.process as Record<string, unknown> | undefined)?.pid ?? "—"));
const hostText = computed(() => String((snapshot.value?.process as Record<string, unknown> | undefined)?.hostName ?? "—"));
const vmVersionText = computed(() =>
  String((snapshot.value?.process as Record<string, unknown> | undefined)?.vmVersion ?? "—"),
);

function mb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}

/** 水位等级：先判危险再判警告，边界与「超 80% / 超 60%」一致 */
type Level = "success" | "warning" | "danger";

function levelOf(percent: number): Level {
  if (percent > 80) return "danger";
  if (percent > 60) return "warning";
  return "success";
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function levelToken(level: Level): string {
  if (level === "danger") return "var(--apm-danger)";
  if (level === "warning") return "var(--apm-warning)";
  return "var(--apm-success)";
}

function loadText(value: number): string {
  return value > 0 ? value.toFixed(2) : "n/a";
}

const heapPercent = computed(() => clampPercent(Number(snapshot.value?.memory.heapUsedPercent ?? 0)));
const cpuPercent = computed(() => clampPercent(Number(snapshot.value?.cpu.processCpuLoad ?? 0)));
const heapLevel = computed<Level>(() => levelOf(heapPercent.value));
const cpuLevel = computed<Level>(() => levelOf(cpuPercent.value));

/** 趋势图：全部颜色走 chartTheme，画布透明避免盖住卡片底色 */
const trendOption = computed<EChartsOption>(() => {
  const heapColor = chartColor(0);
  const threadColor = chartColor(1);
  const gcColor = chartColor(2);
  const nameStyle = { color: axisTextColor(), fontSize: 11 };

  return {
    ...chartCanvas(),
    grid: baseGrid({ left: 48, right: 56, top: 42, bottom: 28 }),
    tooltip: baseTooltip(),
    legend: {
      top: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 4,
      textStyle: { color: axisTextColor(), fontSize: 11 },
    },
    xAxis: {
      ...categoryAxis(metrics.value.map((p) => fmtTs(p.ts))),
      boundaryGap: false,
    },
    yAxis: [
      valueAxis({ name: "%", min: 0, max: 100, nameTextStyle: nameStyle }),
      valueAxis({ name: "次 / 线程", nameTextStyle: nameStyle, splitLine: { show: false }, minInterval: 1 }),
    ],
    series: [
      {
        name: "堆使用率",
        type: "line",
        smooth: true,
        symbol: "none",
        data: metrics.value.map((p) => Number(p.heapPercent.toFixed(1))),
        itemStyle: { color: heapColor },
        lineStyle: { color: heapColor, width: 2 },
        areaStyle: { color: areaGradient(heapColor, 0.24) },
      },
      {
        name: "GC 次数",
        type: "line",
        smooth: true,
        symbol: "none",
        yAxisIndex: 1,
        data: metrics.value.map((p) => p.gcCount),
        itemStyle: { color: gcColor },
        lineStyle: { color: gcColor, width: 1.5 },
      },
      {
        name: "线程数",
        type: "line",
        smooth: true,
        symbol: "none",
        yAxisIndex: 1,
        data: metrics.value.map((p) => p.liveThreads),
        itemStyle: { color: threadColor },
        lineStyle: { color: threadColor, width: 1.5 },
      },
    ],
  } as EChartsOption;
});

async function load() {
  loading.value = true;
  try {
    snapshot.value = await getJvmSnapshot();
  } catch {
    /* 后端未就绪时静默降级 */
  } finally {
    loading.value = false;
    initialized.value = true;
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
  try {
    handleSnapshot.value = await getHandleInventory(200);
  } catch {
    handleSnapshot.value = null;
  }
}

// ---- 文件句柄（4.7）----

/** 未关闭的跟踪句柄数：句柄泄漏的直接信号 */
const openHandleCount = computed(
  () => (handleSnapshot.value?.trackedHandles || []).filter((h) => !h.closed).length,
);

/** FD 行：fd → 目标路径，按 fd 序号自然排序 */
const fdRows = computed(() => {
  const list = handleSnapshot.value?.fileDescriptors || [];
  return [...list].sort((a, b) => Number(a.fd) - Number(b.fd));
});

const fdColumns: ReTableColumn[] = [
  { prop: "fd", label: "FD", width: 90, slot: "fd" },
  { prop: "target", label: "目标", minWidth: 320, slot: "target" },
];

onMounted(() => {
  load();
  live.value = true;
});

// 实时推送驱动（整站共用一条 WS/SSE），不再 setInterval 轮询
useRealtimeEvent("stats", () => {
  if (!loading.value) load();
});

onBeforeUnmount(() => {
  live.value = false;
});
</script>

<style scoped>
/* .view / .view-toolbar / .toolbar-* / .section-label / .match-hint / .stat-row /
   .panel-row / .panel / .panel-head / .panel-sub / .mono / .muted 由 styles/layout.css 提供 */

.live-hint {
  font-size: 12px;
  color: var(--apm-success);
}

/* 数值 + 水位标签同一行，数值左、状态右 */
.metric-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--apm-space-3);
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--apm-fg);
}

.metric-unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--apm-muted);
  margin-left: 4px;
}

/* 轨道用弱描边色，填充色按水位切换（success / warning / danger） */
.meter {
  height: 8px;
  border-radius: 999px;
  background: var(--apm-border-soft);
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--apm-success);
  transition: width var(--apm-t-base);
}

.meter-fill.warning {
  background: var(--apm-warning);
}

.meter-fill.danger {
  background: var(--apm-danger);
}

/* 水位条下方的补充口径：左事实、右阈值说明 */
.metric-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--apm-space-3);
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--apm-fg-regular);
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--apm-space-2);
}

/* 空态默认 140px 是为图表留的；收集器列表只需要一条提示的高度 */
.gc-empty {
  min-height: 72px;
}

@media (prefers-reduced-motion: reduce) {
  .meter-fill {
    transition: none;
  }
  .view :deep(.el-skeleton__item),
  .view :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
