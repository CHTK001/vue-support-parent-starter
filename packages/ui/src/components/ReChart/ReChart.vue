<template>
  <div
    class="re-chart"
    :class="{
      're-chart--selector': engineSelector,
      're-chart--views': viewTabs.length > 0,
    }"
  >
    <!-- 视图切换栏：仅当传入 views（带图标）时出现 -->
    <div v-if="viewTabs.length" class="re-chart__viewbar" role="tablist" aria-label="图表视图">
      <button
        v-for="tab in viewTabs"
        :key="tab.key"
        type="button"
        role="tab"
        class="re-chart__viewtab"
        :class="{ 'is-active': activeView === tab.key }"
        :title="tab.label || tab.key"
        :aria-label="tab.label || tab.key"
        :aria-selected="activeView === tab.key"
        @click="switchView(tab.key)"
      >
        <el-icon v-if="tab.icon"><component :is="tab.icon" /></el-icon>
        <span v-else class="re-chart__viewtab-text">{{ tab.label || tab.key }}</span>
      </button>
    </div>

    <!-- 内置视图 1：链路拓扑（连线流动 + 在用线路高亮 + 小鸟搬运） -->
    <TopologyChart
      v-if="activeType === 'topology'"
      class="re-chart__body"
      :data="topologyData"
      :height="height"
      :theme="theme"
    />

    <!-- 内置视图 2：上下文窗口（面积图 / 点阵图，同一份数据的两种画法） -->
    <ContextWindowChart
      v-else-if="activeType === 'context'"
      class="re-chart__body"
      :data="contextData"
      :height="height"
    />

    <template v-else>
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
    </template>
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
 * <ReChart type="flow" :data="tree" height="420px" />          <!-- 资金流线图（G6） -->
 * <ReChart type="topology" :topology="{ nodes, edges }" />      <!-- 链路拓扑 -->
 * <ReChart type="context" :context-window="{ used, total, slices }" />
 * ```
 *
 * - {@link type} 决定图类型（line/area/bar/pie/donut/radar/funnel/scatter/gauge/
 *   sankey/heatmap/custom/flow/topology/context）；
 * - {@link engine} 默认 echarts，可切 d3；
 * - {@link type==='flow'} 固定走 G6（复刻官方 fund-flow 资金流向图），engine 被忽略；
 * - {@link type==='topology' | 'context'} 走内置自绘面板，engine 被忽略；
 * - ECharts 是同步轻量路径（复用 ReEcharts 的主题注入 / 暗黑 / resize）；
 * - d3 / G6 经 {@link ReAsync} 异步按需 import，带统一骨架与错误重试。
 *
 * 数据与尺寸直接作为 prop 声明（categories/values/series/sankey/data/height/width/
 * theme…），经内部 computed 分别送入 echarts 或 d3/G6 引擎。
 *
 * ## 多视图（图标切换）
 *
 * 传 {@link views} 即可在面板顶部得到一排图标按钮，点一个换一个图：
 * ```vue
 * <ReChart
 *   :views="[
 *     { key: 'trend', icon: TrendCharts, label: '调用趋势', type: 'line',
 *       options: { categories, values } },
 *     { key: 'route', icon: Connection, label: '链路拓扑', type: 'topology',
 *       data: routeMap },
 *     { key: 'ctx', icon: Histogram, label: '上下文窗口', type: 'context',
 *       data: contextWindow },
 *   ]"
 *   height="360px"
 * />
 * ```
 *
 * **数据格式强约束**：同一个 {@link views} 里所有视图的 `data` 必须符合其 `type`
 * 的形状契约（topology 要 `{ nodes, edges }`，context 要 `{ used, total, slices }`）。
 * 上游给的不是这个形状时，**必须**同时传 {@link ViewPane.transform} 显式归一；
 * 既不一致又没有 transform 时，本组件不猜字段，直接告警 + 渲染空态。
 */
import { ref, computed, watch } from "vue";
import ReAsync from "../ReAsync";
import ReEcharts from "../ReEcharts";
import TopologyChart from "./TopologyChart.vue";
import ContextWindowChart from "./ContextWindowChart.vue";
import { buildEchartsOption, type ChartSimpleSeries } from "./engines/echarts";
import { isContextWindowData, isTopologyData } from "./contract";
import type {
  ReChartType,
  ReChartEngine,
  ReChartProps,
  ReChartFlowNode,
  ReChartSankeyData,
  ViewPane,
  ReChartTopologyData,
  ReChartContextData,
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
  /** 链路拓扑数据（type="topology" 时生效） */
  topology?: ReChartTopologyData;
  /** 上下文窗口数据（type="context" 时生效） */
  contextWindow?: ReChartContextData;
  /** 多视图（图标切换）；所有视图的 data 必须同形状，不一致须给 transform */
  views?: ViewPane[];
  /** 初始激活的视图 key；不填取 views 第一项 */
  activeViewKey?: string;
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
  views: () => [],
  activeViewKey: undefined,
});

const emit = defineEmits<{
  (e: "ready", payload: { engine: ReChartEngine; instance: unknown }): void;
  (e: "click", params: unknown): void;
  (e: "mouseover", params: unknown): void;
  (e: "mouseout", params: unknown): void;
  /** 视图切换（多视图时触发） */
  (e: "view-change", payload: { key: string; type: ReChartType }): void;
}>();

/* ==================== 多视图（图标切换） ==================== */

/** 当前激活的视图 key；null 表示没走 views，用面板自身 type/data */
const activeViewKey = ref<string | null>(props.activeViewKey ?? null);

// 父组件动态改 activeViewKey 时同步
watch(
  () => props.activeViewKey,
  (key) => {
    if (key !== undefined) activeViewKey.value = key;
  },
);

/** 视图列表（无视图时为空，切换栏不渲染，旧用法完全不受影响） */
const viewTabs = computed(() => props.views);

/** 当前视图（未选中或 key 不存在时取第一个，保证有视图就一定有图） */
const activePane = computed<ViewPane | null>(() => {
  const list = viewTabs.value;
  if (!list.length) return null;
  return list.find((v) => v.key === activeViewKey.value) ?? list[0];
});

/** 生效的图类型：视图 type > 面板 type */
const activeType = computed<ReChartType>(() => activePane.value?.type ?? props.type);

/** 校验失败（既不符契约又没 transform）的视图 key，用于打一次告警 */
const warnedKeys = new Set<string>();

/**
 * 视图数据归一。
 *
 * 契约在这里一次说清：
 *  1. 有 `transform` → 一律以 transform 结果为准（调用方显式承诺了形状）；
 *  2. 无 `transform` → 数据必须自身符合 type 的契约，否则告警并返回 null（渲染空态）。
 * 不存在「字段名像，就猜它是」这条路。
 */
function resolvePaneData(pane: ViewPane, type: ReChartType): unknown {
  if (pane.transform) {
    try {
      return pane.transform(pane.data);
    } catch (err) {
      console.warn(`[ReChart] 视图 "${pane.key}" 的 transform 抛错，渲染空态:`, err);
      return null;
    }
  }

  const raw = pane.data;
  if (type === "topology") {
    if (isTopologyData(raw)) return raw;
    warnOnce(pane.key, type, "{ nodes, edges }");
    return null;
  }
  if (type === "context") {
    if (isContextWindowData(raw)) return raw;
    warnOnce(pane.key, type, "{ used, total, slices }");
    return null;
  }
  return raw;
}

function warnOnce(key: string, type: ReChartType, expect: string) {
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(
    `[ReChart] 视图 "${key}" 的 data 不符合 type="${type}" 的契约，期望 ${expect}。` +
      `数据形状不同请显式传入 transform 归一，本组件不做隐式转换；当前渲染空态。`,
  );
}

/** 链路拓扑最终数据 */
const topologyData = computed<ReChartTopologyData | null>(() => {
  const pane = activePane.value;
  if (pane && activeType.value === "topology") {
    const resolved = resolvePaneData(pane, "topology");
    return isTopologyData(resolved) ? resolved : null;
  }
  return isTopologyData(props.topology) ? props.topology : null;
});

/** 上下文窗口最终数据 */
const contextData = computed<ReChartContextData | null>(() => {
  const pane = activePane.value;
  if (pane && activeType.value === "context") {
    const resolved = resolvePaneData(pane, "context");
    return isContextWindowData(resolved) ? resolved : null;
  }
  return isContextWindowData(props.contextWindow) ? props.contextWindow : null;
});

function switchView(key: string) {
  const pane = viewTabs.value.find((v) => v.key === key);
  if (!pane) return;
  activeViewKey.value = key;
  emit("view-change", { key, type: pane.type ?? props.type });
}

/** 当前视图 key（模板用），空串表示没有视图 */
const activeView = computed(() => activePane.value?.key ?? "");

/** flow 类型固定走「非 echarts」分支（即 ReAsync → G6） */
const isFlow = computed(() => activeType.value === "flow");

/** 视图级覆盖（option / categories / series / 引擎等） */
const paneProps = computed<Partial<ReChartShellProps>>(() => activePane.value?.options ?? {});

/** 引擎切换需要保留一个可变的当前引擎（flow 时不参与，恒为 d3 语义） */
const activeEngine = ref<ReChartEngine>(props.engine);
const resolvedEngine = computed<ReChartEngine>(() =>
  isFlow.value ? "d3" : (paneProps.value.engine ?? activeEngine.value),
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
  const data = paneProps.value.data ?? props.data;
  const sankey = paneProps.value.sankey ?? props.sankey;
  const indent = paneProps.value.indent ?? props.indent;
  const collapseDepth = paneProps.value.collapseDepth ?? props.collapseDepth;
  if (data !== undefined) out.data = data;
  if (sankey !== undefined) out.sankey = sankey;
  if (indent !== undefined) out.indent = indent;
  if (collapseDepth !== undefined) out.collapseDepth = collapseDepth;
  return out;
});

/** echarts 引擎的最终 option（视图级 options 覆盖面板同名字段） */
const echartsOption = computed(() =>
  buildEchartsOption(activeType.value, {
    option: paneProps.value.option ?? props.option,
    sankey: paneProps.value.sankey ?? props.sankey,
    simple: {
      categories: paneProps.value.categories ?? props.categories,
      values: paneProps.value.values ?? props.values,
      name: paneProps.value.name ?? props.name,
      series: paneProps.value.series ?? props.series,
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
  /** 代码切换视图（同点击图标按钮） */
  switchView,
  /** 当前生效的图类型（视图 type 优先） */
  getType: () => activeType.value,
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
.re-chart--views {
  gap: 8px;
}

/* ===== 视图切换栏（图标按钮） ===== */
.re-chart__viewbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: var(--el-fill-color-light, #f1f5f9);
  align-self: flex-start;
}
.re-chart__viewtab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-regular, #64748b);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.re-chart__viewtab .el-icon {
  font-size: 16px;
}
.re-chart__viewtab:hover {
  background: var(--el-fill-color, #e8edf3);
  color: var(--el-color-primary, #6366f1);
}
.re-chart__viewtab.is-active {
  background: var(--el-bg-color, #fff);
  color: var(--el-color-primary, #6366f1);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}
.re-chart__viewtab:focus-visible {
  outline: 2px solid var(--el-color-primary, #6366f1);
  outline-offset: 1px;
}
.re-chart__viewtab-text {
  white-space: nowrap;
}
/* 切换动画：换视图时淡入，避免生硬跳变 */
.re-chart--views .re-chart__body {
  animation: re-chart-view-in 0.22s ease;
}
@keyframes re-chart-view-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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