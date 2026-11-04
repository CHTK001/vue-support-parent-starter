<template>
  <div class="re-chart" :class="{ 're-chart--selector': engineSelector }">
    <!-- 引擎切换条（可选） -->
    <div v-if="engineSelector" class="re-chart__selector">
      <span class="re-chart__label">引擎</span>
      <button
        v-for="e in engineOptions"
        :key="e"
        class="re-chart__seg"
        :class="{ 'is-active': resolvedEngine === e }"
        type="button"
        @click="switchEngine(e)"
      >
        {{ e }}
      </button>
    </div>

    <!-- ECharts 引擎：同步渲染 ReEcharts（option 已由本组件构建并注入主题） -->
    <ReEcharts
      v-if="resolvedEngine === 'echarts'"
      ref="echartsRef"
      class="re-chart__body"
      :option="echartsOption"
      v-bind="echartsPassthrough"
      @ready="onEchartsReady"
      @click="(p: any) => emit('click', p)"
      @mouseover="(p: any) => emit('mouseover', p)"
      @mouseout="(p: any) => emit('mouseout', p)"
    />

    <!-- D3 / G6 引擎：经 ReAsync 异步按需加载，统一 loading / error 骨架 -->
    <ReAsync
      v-else
      class="re-chart__body"
      :loader="asyncLoader"
      :min-height="minHeight"
      loading-mode="loader"
      :loader-timeout="10000"
      v-bind="fallThrough"
    >
      <template #loading>
        <slot name="loading" />
      </template>
      <template #error="{ error, retry }">
        <slot name="error" :error="error" :retry="retry">
          <div class="re-chart__error">{{ error?.message || "图表加载失败" }}</div>
        </slot>
      </template>
    </ReAsync>
  </div>
</template>

<script setup lang="ts">
/**
 * ReChart —— 聚合图表组件。
 *
 * 把「面板类型 + 引擎」组合成一句话语法：
 * ```vue
 * <ReChart type="bar" :categories="x" :series="y" height="320px" />
 * <ReChart type="sankey" :sankey="{ nodes, links }" engine="d3" height="320px" />
 * <ReChart type="flow" :data="tree" height="420px" />  <!-- 资金流线图（G6） -->
 * ```
 *
 * - {@link type} 决定图类型（line/area/bar/pie/donut/radar/funnel/scatter/gauge/
 *   sankey/heatmap/custom/flow）；
 * - {@link engine} 默认 echarts，可切 d3；
 * - {@link type==='flow'} 固定走 G6（复刻官方 fund-flow 资金流向图），engine 被忽略；
 * - ECharts 是同步轻量路径（复用 ReEcharts 的主题注入 / 暗黑 / resize）；
 * - d3 / G6 经 {@link ReAsync} 异步按需 import，带统一骨架与错误重试。
 *
 * 数据与尺寸直接作为 prop 声明（categories/values/series/sankey/data/height/width/
 * theme…），经内部 computed 分别送入 echarts 或 d3/G6 引擎。
 */
import { ref, computed, watch } from "vue";
import ReAsync from "../ReAsync";
import ReEcharts from "../ReEcharts";
import { buildEchartsOption, type ChartSimpleSeries } from "./engines/echarts";
import type {
  ReChartType,
  ReChartEngine,
  ReChartProps,
  ReChartFlowNode,
  ReChartSankeyData,
} from "./types";

/** 面板自身声明的 props（数据/尺寸/主题统一声明，并向实际引擎透传） */
interface ReChartShellProps {
  type?: ReChartType;
  engine?: ReChartEngine;
  engineSelector?: boolean;
  height?: string;
  width?: string;
  theme?: "light" | "dark";
  minHeight?: string;
  autoResize?: boolean;
  /** flow 类型流线图数据（G6） */
  data?: ReChartFlowNode | { root?: ReChartFlowNode };
  /** flow 缩进像素量 / 折叠深度阈值（仅 G6 引擎生效） */
  indent?: number;
  collapseDepth?: number;
  /** d3 / echarts 桑基数据 */
  sankey?: ReChartSankeyData;
  /** echarts 完整 option（最优先，与默认做浅合并） */
  option?: ReChartProps["option"];
  /** echarts 简版数据：类目 / 数值 / 名称 / 系列 */
  categories?: string[];
  values?: number[] | number[][];
  name?: string;
  series?: ChartSimpleSeries;
}

const props = withDefaults(defineProps<ReChartShellProps>(), {
  type: "line" as ReChartType,
  engine: "echarts" as ReChartEngine,
  engineSelector: false,
  height: "100%",
  width: "100%",
  theme: "light",
  minHeight: "auto",
  autoResize: true,
});

const emit = defineEmits<{
  (e: "ready", payload: { engine: ReChartEngine; instance: unknown }): void;
  (e: "click", params: unknown): void;
  (e: "mouseover", params: unknown): void;
  (e: "mouseout", params: unknown): void;
}>();

/** flow 类型固定走「非 echarts」分支（即 ReAsync → G6） */
const isFlow = computed(() => props.type === "flow");

/** 引擎切换需要保留一个可变的当前引擎（flow 时不参与，恒为 d3 语义） */
const activeEngine = ref<ReChartEngine>(props.engine);
const resolvedEngine = computed<ReChartEngine>(
  () => (isFlow.value ? "d3" : activeEngine.value),
);

const engineOptions: ReChartEngine[] = ["echarts", "d3"];
function switchEngine(e: ReChartEngine) {
  if (!isFlow.value) activeEngine.value = e;
}

/** 父组件动态改 engine prop 时同步当前引擎（切组件前的最后一次仍优先于前台切换） */
watch(
  () => props.engine,
  (e) => {
    if (!isFlow.value) activeEngine.value = e;
  },
);

/** 透传给 ReEcharts 的尺寸/主题 */
const echartsPassthrough = computed(() => ({
  height: props.height,
  width: props.width,
  theme: props.theme,
  autoResize: props.autoResize !== false,
}));

/** 透传给 ReAsync（最终到达 ReChartFlow / D3Chart）的载荷 */
const fallThrough = computed(() => {
  const out: Record<string, unknown> = {
    height: props.height,
    width: props.width,
    theme: props.theme,
  };
  if (props.data !== undefined) out.data = props.data;
  if (props.sankey !== undefined) out.sankey = props.sankey;
  if (props.indent !== undefined) out.indent = props.indent;
  if (props.collapseDepth !== undefined) out.collapseDepth = props.collapseDepth;
  return out;
});

/** echarts 引擎的最终 option */
const echartsOption = computed(() =>
  buildEchartsOption(props.type, {
    option: props.option,
    sankey: props.sankey,
    simple: {
      categories: props.categories,
      values: props.values,
      name: props.name,
      series: props.series,
    },
  }),
);

const echartsRef = ref<InstanceType<typeof ReEcharts> | null>(null);

function onEchartsReady(chart: unknown) {
  emit("ready", { engine: "echarts", instance: chart });
}

/** 非 echarts 引擎的懒加载 loader（flow → G6；否则 → d3） */
function asyncLoader(): Promise<{ default: unknown }> {
  if (isFlow.value) return import("./flow/ReChartFlow.vue");
  return import("./engines/D3Chart.vue");
}

defineExpose({
  getInstance: () => (echartsRef.value as unknown as { getInstance?: () => unknown })?.getInstance?.(),
  resize: () => (echartsRef.value as unknown as { resize?: () => void })?.resize?.(),
  /** 读取当前生效引擎 */
  getEngine: () => resolvedEngine.value,
});
</script>

<style scoped>
.re-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.re-chart--selector {
  gap: 8px;
}
.re-chart__body {
  flex: 1 1 auto;
  min-height: 0;
}
.re-chart__selector {
  display: flex;
  align-items: center;
  gap: 4px;
}
.re-chart__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-right: 4px;
}
.re-chart__seg {
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  border-radius: 6px;
  font-size: 12px;
  padding: 2px 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.re-chart__seg.is-active {
  background: var(--el-color-primary);
  color: #fff;
  border-color: var(--el-color-primary);
}
.re-chart__error {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>