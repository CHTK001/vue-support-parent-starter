<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="容器统计"
    width="800px"
    @closed="handleClosed"
  >
    <template #header>
      <div class="cs-header">
        <span class="cs-header__title">容器统计</span>
        <span class="cs-header__subtitle">{{ containerName || containerId?.substring(0, 12) }}</span>
        <ElTag v-if="isLive" type="success" size="small" effect="dark" style="margin-left: auto">实时</ElTag>
        <ElTag v-else type="info" size="small" style="margin-left: auto">离线</ElTag>
      </div>
    </template>

    <!-- Stats toolbar -->
    <div class="cs-toolbar">
      <div class="cs-toolbar__stats">
        <span class="cs-stat">
          <span class="cs-stat__label">CPU</span>
          <span class="cs-stat__value" :class="{ 'is-high': latestCpu > 80 }">{{ latestCpu.toFixed(1) }}%</span>
        </span>
        <span class="cs-stat">
          <span class="cs-stat__label">内存</span>
          <span class="cs-stat__value">{{ latestMemText }}</span>
        </span>
        <span class="cs-stat">
          <span class="cs-stat__label">网络 ↓</span>
          <span class="cs-stat__value">{{ formatBytes(latestNetRx) }}/s</span>
        </span>
        <span class="cs-stat">
          <span class="cs-stat__label">网络 ↑</span>
          <span class="cs-stat__value">{{ formatBytes(latestNetTx) }}/s</span>
        </span>
      </div>
    </div>

    <!-- Charts -->
    <div class="cs-charts">
      <ScEcharts v-if="hasData" :option="cpuOption" height="180px" />
      <ScEcharts v-if="hasData" :option="memOption" height="180px" />
      <ScEcharts v-if="hasData" :option="netOption" height="180px" />
      <div v-else class="cs-empty">
        <p>暂无统计数据</p>
        <p class="cs-empty__hint">数据采集后将自动显示</p>
      </div>
    </div>

    <template #footer>
      <span class="cs-footer__count">{{ dataPoints.length }} 个采样点</span>
      <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import { ElButton, ElDialog, ElTag } from "element-plus";
import ScEcharts from "@repo/components/ScEcharts";
import * as dockerApi from "../../api/docker";

const props = defineProps<{
  visible: boolean;
  connectionId: string;
  containerId: string;
  containerName?: string;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

// ─── Polling ─────────────────────────────────────
interface DataPoint { ts: number; cpu: number; memUsage: number; memLimit: number; netRx: number; netTx: number; }
const dataPoints = ref<DataPoint[]>([]);
const MAX_POINTS = 60;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const isLive = computed(() => {
  const last = dataPoints.value[dataPoints.value.length - 1];
  return !!last && (Date.now() - last.ts < 10000);
});

const pushPoint = (p: DataPoint) => {
  dataPoints.value.push(p);
  if (dataPoints.value.length > MAX_POINTS) {
    dataPoints.value.splice(0, dataPoints.value.length - MAX_POINTS);
  }
};

const fetchStats = async () => {
  try {
    const res = await dockerApi.fetchDockerContainerStats(props.connectionId, props.containerId);
    const d = res?.data;
    if (!d) return;
    pushPoint({
      ts: Date.now(),
      cpu: d.cpu_stats?.cpu_usage?.total_usage && d.cpu_stats?.system_cpu_usage
        ? ((d.cpu_stats.cpu_usage.total_usage - (d.precpu_stats?.cpu_usage?.total_usage || 0))
            / (d.cpu_stats.system_cpu_usage - (d.precpu_stats?.system_cpu_usage || 0))
            * d.cpu_stats?.online_cpus || 1) * 100
        : 0,
      memUsage: d.memory_stats?.usage || 0,
      memLimit: d.memory_stats?.limit || 0,
      netRx: Object.values(d.networks || {}).reduce<number>((sum, n: any) => sum + (n.rx_bytes || 0), 0),
      netTx: Object.values(d.networks || {}).reduce<number>((sum, n: any) => sum + (n.tx_bytes || 0), 0),
    });
  } catch { /* ignore */ }
};

// ─── Latest values ────────────────────────────────

const latestData = computed(() => dataPoints.value[dataPoints.value.length - 1]);
const latestCpu = computed(() => latestData.value?.cpu ?? 0);
const latestMemText = computed(() => {
  const last = latestData.value;
  if (!last) return "N/A";
  return formatBytes(last.memUsage) + (last.memLimit > 0 ? ` / ${formatBytes(last.memLimit)}` : "");
});
const latestNetRx = computed(() => latestData.value?.netRx ?? 0);
const latestNetTx = computed(() => latestData.value?.netTx ?? 0);
const hasData = computed(() => dataPoints.value.length > 1);

// ─── Chart options ────────────────────────────────

const timeLabels = computed(() => dataPoints.value.map(p => new Date(p.ts).toLocaleTimeString("zh-CN", { hour12: false })));

const cpuOption = computed(() => ({
  tooltip: { trigger: "axis" as const },
  grid: { left: 50, right: 20, top: 25, bottom: 20 },
  title: { text: "CPU 使用率", textStyle: { fontSize: 13 } },
  xAxis: { type: "category" as const, data: timeLabels.value, axisLabel: { fontSize: 10 } },
  yAxis: { type: "value" as const, max: 100, axisLabel: { formatter: "{value}%" } },
  series: [{ type: "line" as const, data: dataPoints.value.map(p => Number(p.cpu.toFixed(2))), smooth: true, showSymbol: false, areaStyle: { opacity: 0.1 }, lineStyle: { width: 2 } }],
  animation: false,
}));

const memOption = computed(() => ({
  tooltip: { trigger: "axis" as const },
  grid: { left: 50, right: 20, top: 25, bottom: 20 },
  title: { text: "内存使用", textStyle: { fontSize: 13 } },
  xAxis: { type: "category" as const, data: timeLabels.value, axisLabel: { fontSize: 10 } },
  yAxis: { type: "value" as const, axisLabel: { formatter: (v: number) => formatBytes(v) } },
  series: [
    { name: "已用", type: "line" as const, data: dataPoints.value.map(p => p.memUsage), smooth: true, showSymbol: false, areaStyle: { opacity: 0.1 }, lineStyle: { width: 2 } },
  ],
  animation: false,
}));

const netOption = computed(() => ({
  tooltip: { trigger: "axis" as const },
  grid: { left: 50, right: 20, top: 25, bottom: 20 },
  title: { text: "网络 I/O", textStyle: { fontSize: 13 } },
  xAxis: { type: "category" as const, data: timeLabels.value, axisLabel: { fontSize: 10 } },
  yAxis: { type: "value" as const, axisLabel: { formatter: (v: number) => formatBytes(v) } },
  series: [
    { name: "接收", type: "line" as const, data: dataPoints.value.map(p => p.netRx), smooth: true, showSymbol: false, lineStyle: { width: 1.5 } },
    { name: "发送", type: "line" as const, data: dataPoints.value.map(p => p.netTx), smooth: true, showSymbol: false, lineStyle: { width: 1.5 } },
  ],
  animation: false,
}));

// ─── Lifecycle ────────────────────────────────────

const startPolling = () => {
  stopPolling();
  fetchStats();
  pollTimer = setInterval(fetchStats, 2000);
};

const stopPolling = () => {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
};

const handleClosed = () => {
  stopPolling();
  dataPoints.value = [];
};

onBeforeUnmount(stopPolling);

// Start polling when dialog opens
import { watch } from "vue";
watch(() => props.visible, (v) => { if (v) startPolling(); });

// ─── Helpers ──────────────────────────────────────

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(i > 1 ? 1 : 0) + " " + units[i];
};
</script>

<style scoped>
.cs-header { display: flex; align-items: center; gap: 10px; }
.cs-header__title { font-size: 15px; font-weight: 600; }
.cs-header__subtitle { font-size: 13px; color: var(--el-text-color-secondary); }

.cs-toolbar { margin-bottom: 12px; }
.cs-toolbar__stats { display: flex; gap: 16px; flex-wrap: wrap; }
.cs-stat { display: flex; align-items: center; gap: 4px; font-size: 12px; }
.cs-stat__label { color: var(--el-text-color-secondary); }
.cs-stat__value { font-weight: 600; font-family: "Cascadia Code", "Fira Code", monospace; }
.cs-stat__value.is-high { color: var(--el-color-danger); }

.cs-charts { display: flex; flex-direction: column; gap: 12px; }
.cs-empty { text-align: center; padding: 60px 0; color: var(--el-text-color-secondary); }
.cs-empty__hint { font-size: 12px; color: var(--el-text-color-placeholder); margin-top: 4px; }

.cs-footer__count { font-size: 12px; color: var(--el-text-color-secondary); margin-right: auto; }
</style>
