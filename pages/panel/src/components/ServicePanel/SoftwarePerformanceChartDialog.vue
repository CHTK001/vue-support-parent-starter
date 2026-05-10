<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="性能监控"
    width="780px"
    @close="handleClose"
  >
    <template #header>
      <div class="perf-header">
        <span class="perf-header__title">性能监控</span>
        <span v-if="binding" class="perf-header__subtitle">
          {{ binding.softwareName }} v{{ binding.softwareVersion }}
        </span>
        <ElTag v-if="isLive" type="success" size="small" effect="dark" style="margin-left: auto">实时</ElTag>
        <ElTag v-else type="info" size="small" style="margin-left: auto">离线</ElTag>
      </div>
    </template>

    <!-- Time range selector -->
    <div class="perf-toolbar">
      <ElButtonGroup size="small">
        <ElButton
          v-for="r in timeRanges"
          :key="r.value"
          :type="range === r.value ? 'primary' : 'default'"
          @click="range = r.value"
        >{{ r.label }}</ElButton>
      </ElButtonGroup>
      <div class="perf-toolbar__stats">
        <span class="perf-stat">
          <span class="perf-stat__label">CPU</span>
          <span class="perf-stat__value" :class="{ 'is-high': latestCpu > 80 }">{{ latestCpu.toFixed(1) }}%</span>
        </span>
        <span class="perf-stat">
          <span class="perf-stat__label">内存</span>
          <span class="perf-stat__value">{{ latestMemText }}</span>
        </span>
        <span v-if="latestNetworkRx" class="perf-stat">
          <span class="perf-stat__label">网络 ↓</span>
          <span class="perf-stat__value">{{ formatBytes(latestNetworkRx) }}</span>
        </span>
        <span v-if="latestNetworkTx" class="perf-stat">
          <span class="perf-stat__label">网络 ↑</span>
          <span class="perf-stat__value">{{ formatBytes(latestNetworkTx) }}</span>
        </span>
      </div>
    </div>

    <!-- Chart -->
    <div class="perf-chart-wrapper">
      <ScEcharts v-if="hasData" :option="chartOption" height="380px" />
      <div v-else class="perf-empty">
        <IconifyIconOnline icon="ep:trend-chart" style="font-size: 40px; color: var(--el-text-color-placeholder)" />
        <p>暂无性能数据</p>
        <p class="perf-empty__hint">容器运行后将自动采集 CPU、内存和网络数据</p>
      </div>
    </div>

    <template #footer>
      <span class="perf-footer__count">共 {{ history.length }} 个采样点</span>
      <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import { ElButton, ElButtonGroup, ElDialog, ElTag } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScEcharts from "@repo/components/ScEcharts";
import type { SoftwareBinding } from "../../api/software";
import type { DockerContainerStats } from "./useSoftwareRuntimeLogSocket";

const props = defineProps<{
  visible: boolean;
  binding: SoftwareBinding | null;
  statsByBinding?: Record<number, DockerContainerStats>;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

// ─── Time range ─────────────────────────────────────────

interface TimeRangeDef { label: string; value: string; ms: number }

const timeRanges: TimeRangeDef[] = [
  { label: "1小时", value: "1h", ms: 3600_000 },
  { label: "6小时", value: "6h", ms: 21600_000 },
  { label: "24小时", value: "24h", ms: 86400_000 },
  { label: "7天", value: "7d", ms: 604800_000 },
];

const range = ref("1h");

// ─── History buffer ─────────────────────────────────────

interface HistoryPoint {
  ts: number;
  cpu: number;
  memUsage: number;
  memLimit: number;
  netRx: number;
  netTx: number;
}

const history = ref<HistoryPoint[]>([]);
const MAX_HISTORY = 3600; // 1 point/sec for 1h

const isLive = computed(() => {
  if (!props.binding?.sysProjectContainerSoftwareBindingId) return false;
  const bindingId = props.binding.sysProjectContainerSoftwareBindingId;
  const lastPoint = history.value[history.value.length - 1];
  if (!lastPoint) return false;
  return Date.now() - lastPoint.ts < 15000;
});

// Watch for new stats and push to history
watch(
  () => {
    if (!props.binding?.sysProjectContainerSoftwareBindingId) return undefined;
    return props.statsByBinding?.[props.binding.sysProjectContainerSoftwareBindingId];
  },
  (stats) => {
    if (!stats) return;
    const point: HistoryPoint = {
      ts: stats.timestamp ? new Date(stats.timestamp).getTime() : Date.now(),
      cpu: stats.cpuPercent ?? 0,
      memUsage: stats.memoryUsage ?? 0,
      memLimit: stats.memoryLimit ?? 0,
      netRx: stats.networkRx ?? 0,
      netTx: stats.networkTx ?? 0,
    };
    history.value.push(point);
    if (history.value.length > MAX_HISTORY) {
      history.value.splice(0, history.value.length - MAX_HISTORY);
    }
  },
  { deep: true },
);

// Filter history by selected time range
const filteredHistory = computed(() => {
  const rangeMs = timeRanges.find((r) => r.value === range.value)?.ms ?? 3600_000;
  const cutoff = Date.now() - rangeMs;
  return history.value.filter((p) => p.ts >= cutoff);
});

const hasData = computed(() => filteredHistory.value.length > 0);

// ─── Latest values ──────────────────────────────────────

const latestCpu = computed(() => {
  const last = filteredHistory.value[filteredHistory.value.length - 1];
  return last?.cpu ?? 0;
});

const latestMemText = computed(() => {
  const last = filteredHistory.value[filteredHistory.value.length - 1];
  if (!last || last.memUsage === 0) return "N/A";
  return formatBytes(last.memUsage) + (last.memLimit > 0 ? ` / ${formatBytes(last.memLimit)}` : "");
});

const latestNetworkRx = computed(() => {
  const last = filteredHistory.value[filteredHistory.value.length - 1];
  return last?.netRx ?? 0;
});

const latestNetworkTx = computed(() => {
  const last = filteredHistory.value[filteredHistory.value.length - 1];
  return last?.netTx ?? 0;
});

// ─── Chart option ───────────────────────────────────────

const chartOption = computed(() => {
  const data = filteredHistory.value;
  const times = data.map((p) => new Date(p.ts).toLocaleTimeString("zh-CN", { hour12: false }));
  const cpuData = data.map((p) => Number(p.cpu.toFixed(2)));
  const memData = data.map((p) => Number((p.memUsage / 1024 / 1024).toFixed(1)));
  const netRxData = data.map((p) => Number((p.netRx / 1024).toFixed(1)));
  const netTxData = data.map((p) => Number((p.netTx / 1024).toFixed(1)));

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: (params: any[]) => {
        if (!params.length) return "";
        let html = `<b>${params[0].axisValue}</b><br/>`;
        for (const p of params) {
          html += `${p.marker} ${p.seriesName}: ${p.value}${p.seriesName.includes("CPU") ? "%" : p.seriesName.includes("内存") ? " MB" : " KB"}<br/>`;
        }
        return html;
      },
    },
    legend: {
      data: ["CPU %", "内存 (MB)", "网络接收 (KB)", "网络发送 (KB)"],
      top: 0,
      textStyle: { fontSize: 11 },
    },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: {
      type: "category",
      data: times,
      axisLabel: { fontSize: 10, rotate: 0 },
    },
    yAxis: [
      {
        type: "value",
        name: "CPU %",
        position: "left",
        max: 100,
        axisLabel: { formatter: "{value}%", fontSize: 10 },
      },
      {
        type: "value",
        name: "内存 MB",
        position: "right",
        axisLabel: { formatter: "{value}", fontSize: 10 },
      },
    ],
    series: [
      {
        name: "CPU %",
        type: "line",
        yAxisIndex: 0,
        data: cpuData,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.08 },
      },
      {
        name: "内存 (MB)",
        type: "line",
        yAxisIndex: 1,
        data: memData,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.08 },
      },
      {
        name: "网络接收 (KB)",
        type: "line",
        yAxisIndex: 1,
        data: netRxData,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, type: "dashed" },
      },
      {
        name: "网络发送 (KB)",
        type: "line",
        yAxisIndex: 1,
        data: netTxData,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, type: "dashed" },
      },
    ],
    animation: false,
  };
});

// ─── Helpers ────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(i > 1 ? 1 : 0) + " " + units[i];
};

const handleClose = () => {
  // Keep history for reopening
};
</script>

<style scoped>
.perf-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.perf-header__title {
  font-size: 15px;
  font-weight: 600;
}
.perf-header__subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.perf-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}
.perf-toolbar__stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.perf-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.perf-stat__label {
  color: var(--el-text-color-secondary);
}
.perf-stat__value {
  font-weight: 600;
  font-family: "Cascadia Code", "Fira Code", monospace;
  color: var(--el-text-color-primary);
}
.perf-stat__value.is-high {
  color: var(--el-color-danger);
}

.perf-chart-wrapper {
  border: 1px solid var(--dt-glass-border-light);
  border-radius: var(--dt-radius-lg);
  overflow: hidden;
  background: var(--dt-glass-bg-light);
}
html.dark .perf-chart-wrapper {
  background: var(--dt-glass-bg-dark);
}

.perf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 380px;
  gap: 12px;
  color: var(--el-text-color-secondary);
}
.perf-empty p {
  margin: 0;
  font-size: 14px;
}
.perf-empty__hint {
  font-size: 12px !important;
  color: var(--el-text-color-placeholder);
}

.perf-footer__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-right: auto;
}
</style>
