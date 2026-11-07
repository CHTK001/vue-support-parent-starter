<script setup lang="ts">
/**
 * 主机指标历史弹窗 —— 底部状态条与指标监控页共用的一套「点击看历史」。
 *
 * <p>数据源只有一处：主机内置指标历史（{@code /ms/monitor/host/{id}/metric-history}）。
 * 指标由调用方决定（哪个数字被点开就是谁），弹窗内只负责时间范围与绘图，
 * 这样底部条的 CPU / 内存 / 磁盘 / IO 和指标监控页的四张趋势卡不会出现两套口径。</p>
 *
 * <p>关闭即销毁 echarts 实例：容器在弹窗里，隐藏后尺寸为 0，
 * 复用同一个实例再打开会算出错误的宽高。</p>
 *
 * @author CH
 * @since 4.0.0.54
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import * as echarts from "echarts";
import { Loading } from "@element-plus/icons-vue";
import { getHostMetricHistory, type HostMetricPoint } from "@pages/monitor/src/api";
import type { HostMetricKind } from "./HostMetricHistoryDialog.types";

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    modelValue: boolean;
    /** 主机台账标识 */
    hostId: number;
    /** 主机名（标题用） */
    hostName?: string;
    /** 指标 */
    kind?: HostMetricKind;
  }>(),
  { hostName: "", kind: "cpu" },
);

const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

/** 时间范围选项：与指标监控页保持同一组 */
const rangeOptions = [
  { label: "近1小时", value: 1 },
  { label: "近6小时", value: 6 },
  { label: "近24小时", value: 24 },
  { label: "近7天", value: 168 },
];

/** 指标中文名 */
const KIND_LABEL: Record<HostMetricKind, string> = {
  cpu: "CPU 使用率",
  mem: "内存使用率",
  disk: "磁盘使用率",
  diskio: "磁盘读写速率",
  net: "网络收发速率",
};

/** 指标主题色（与指标监控页趋势卡一致） */
const KIND_COLOR: Record<HostMetricKind, string> = {
  cpu: "#3b82f6",
  mem: "#8b5cf6",
  disk: "#f59e0b",
  diskio: "#f59e0b",
  net: "#10b981",
};

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});
const hours = ref(1);
const loading = ref(false);
/** 单序列（百分比） */
const series = ref<[number, number][]>([]);
/** 双序列：磁盘读 / 写（KB/s）或网络 收 / 发（KB/s） */
const seriesA = ref<[number, number][]>([]);
const seriesB = ref<[number, number][]>([]);

const title = computed(() =>
  `${props.hostName || ("主机 #" + props.hostId)} · ${KIND_LABEL[props.kind]}`);

/**
 * 速率展示：KB/s 超过 1024 自动升到 MB/s。
 *
 * @param v KB/s
 */
function fmtKbs(v: number): string {
  if (v >= 1024) return `${(v / 1024).toFixed(1)} MB/s`;
  return `${Math.round(v)} KB/s`;
}

/**
 * 按当前指标与时间范围拉取真实历史并渲染。
 */
async function fetchSeries(): Promise<void> {
  if (!props.hostId) return;
  loading.value = true;
  try {
    const rows: HostMetricPoint[] = await getHostMetricHistory(props.hostId, hours.value);
    series.value = [];
    seriesA.value = [];
    seriesB.value = [];
    if (props.kind === "diskio" || props.kind === "net") {
      const [ia, ib] = props.kind === "diskio" ? [4, 5] : [6, 7];
      const a: [number, number][] = [];
      const b: [number, number][] = [];
      for (const r of rows) {
        const ts = Number(r[0]);
        const va = r[ia];
        const vb = r[ib];
        if (va != null) a.push([ts, Number(va)]);
        if (vb != null) b.push([ts, Number(vb)]);
      }
      seriesA.value = a;
      seriesB.value = b;
    } else {
      const idx = props.kind === "cpu" ? 1 : props.kind === "mem" ? 2 : 3;
      const pts: [number, number][] = [];
      for (const r of rows) {
        const v = r[idx];
        if (v != null) pts.push([Number(r[0]), Number(v)]);
      }
      series.value = pts;
    }
    await nextTick(() => renderChart());
  } finally {
    loading.value = false;
  }
}

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

/**
 * 渲染历史大图。
 */
function renderChart(): void {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  const dual = props.kind === "diskio" || props.kind === "net";
  const color = KIND_COLOR[props.kind];
  if (dual) {
    const [nameA, nameB] = props.kind === "diskio" ? ["读取", "写入"] : ["接收", "发送"];
    const colorB = props.kind === "diskio" ? "#06b6d4" : "#f59e0b";
    chart.setOption({
      grid: { left: 60, right: 20, top: 36, bottom: 42 },
      legend: {
        top: 6, right: 12, itemWidth: 14, itemHeight: 8, textStyle: { fontSize: 11 },
        data: [{ name: nameA }, { name: nameB }],
      },
      tooltip: { trigger: "axis", valueFormatter: (v: unknown) => fmtKbs(Number(v)) },
      xAxis: { type: "time", axisLabel: { fontSize: 10, hideOverlap: true } },
      yAxis: {
        type: "value", min: 0,
        axisLabel: { formatter: (v: number) => v >= 1024 ? `${(v / 1024).toFixed(0)}M` : `${v}K`, fontSize: 10 },
      },
      dataZoom: [{ type: "inside" }, { type: "slider", height: 16, bottom: 12 }],
      series: [
        {
          name: nameA, type: "line", data: seriesA.value, showSymbol: false, smooth: false,
          lineStyle: { color, width: 2 }, itemStyle: { color },
          areaStyle: { color: `${color}14` },
        },
        {
          name: nameB, type: "line", data: seriesB.value, showSymbol: false, smooth: false,
          lineStyle: { color: colorB, width: 2 }, itemStyle: { color: colorB },
          areaStyle: { color: `${colorB}14` },
        },
      ],
    }, true);
  } else {
    chart.setOption({
      grid: { left: 48, right: 20, top: 20, bottom: 42 },
      tooltip: { trigger: "axis", valueFormatter: (v: unknown) => `${Number(v).toFixed(1)}%` },
      xAxis: { type: "time", axisLabel: { fontSize: 10, hideOverlap: true } },
      yAxis: { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value}%", fontSize: 10 } },
      dataZoom: [{ type: "inside" }, { type: "slider", height: 16, bottom: 12 }],
      series: [{
        type: "line", data: series.value, showSymbol: false, smooth: false,
        lineStyle: { color, width: 2 }, itemStyle: { color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${color}40` },
            { offset: 1, color: `${color}05` },
          ]),
        },
      }],
    }, true);
  }
  chart.resize();
}

/**
 * 打开弹窗或换指标时重新取数。
 */
function reload(): void {
  if (!visible.value) return;
  void fetchSeries();
}

watch(() => props.modelValue, (v) => {
  if (v) reload();
  else if (chart) { chart.dispose(); chart = null; }
});

// 弹窗已经打开时又被点了另一项（底部条连点两个指标）
watch(() => [props.kind, props.hostId], reload);

/**
 * 切换时间范围。
 *
 * @param v 小时数
 */
function onHoursChange(v: number | string): void {
  hours.value = Number(v);
  void fetchSeries();
}

/** 空态：单序列与双序列都没点 */
const isEmpty = computed(() => !series.value.length && !seriesA.value.length && !seriesB.value.length);

onBeforeUnmount(() => {
  if (chart) { chart.dispose(); chart = null; }
});
</script>

<template>
  <ReDialog v-model="visible" :title="title" width="860px" append-to-body>
    <div class="hist-bar">
      <ReSelect :model-value="hours" class="hist-sel" :options="rangeOptions" @change="onHoursChange" />
      <span class="hist-hint">数据来自主机采集历史，按主机维度持久化，口径与外侧数字一致</span>
    </div>
    <div class="hist-canvas-wrap">
      <div v-if="loading" class="hist-loading">
        <el-icon class="is-loading"><Loading /></el-icon><span>正在加载历史数据…</span>
      </div>
      <div v-else-if="isEmpty" class="hist-loading">
        <span>该时间段内暂无历史数据，请确认主机已开启自动采集。</span>
      </div>
      <div ref="chartRef" class="hist-canvas" />
    </div>
  </ReDialog>
</template>

<style scoped>
.hist-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
</style>
