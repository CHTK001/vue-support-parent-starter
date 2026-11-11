/**
 * ReChart —— 聚合图表组件。
 *
 * 封装 ECharts / D3 / G6 三种渲染后端，统一「图类型 + 引擎」语法：
 * ```vue
 * <ReChart type="bar" :categories="x" :series="y" />
 * <ReChart type="sankey" :sankey="{ nodes, links }" engine="d3" />
 * <ReChart type="flow" :data="tree" />  <!-- 资金流线图，G6 -->
 * ```
 *
 * - ECharts 引擎同步、轻量（复用 ReEcharts 的主题/暗黑/resize）；
 * - D3 引擎经 ReAsync 异步 import d3-sankey 画桑基/流线；
 * - flow 类型固定走 @antv/g6（复刻官方 fund-flow 示例）。
 *
 * @author CH
 * @since 4.0.0.xx
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReChart", {
  default: () => import("./ReChart.vue"),
  koi: () => import("./ReChart.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;

/** 上下文窗口「面积图 / 方格」切换图标：宿主面板可单独引用来做自己的切换条 */
export { default as ContextModeIcon } from "./ContextModeIcon.vue";

export type {
  ReChartType,
  ReChartEngine,
  ReChartFlowNode,
  ReChartFlowData,
  ReChartSankeyData,
  ReChartProps,
  ReChartEmit,
  ViewPane,
  TopologyNode,
  TopologyEdge,
  TopologyNodeStatus,
  ReChartTopologyData,
  ContextSlice,
  ContextSliceKind,
  ReChartContextData,
} from "./types";
export {
  isTopologyData,
  isContextWindowData,
  normalizeContextWindow,
  formatTokens,
  sliceColor,
  sliceKindLabel,
  layoutTreemap,
  assignDots,
} from "./contract";
export type { TreemapRect } from "./contract";
export type {
  ChartSimpleData,
  ChartSimpleSeries,
  ChartSimpleSeriesItem,
} from "./engines/echarts";