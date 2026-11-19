// @ts-nocheck
/**
 * echarts 兼容层（按需注册版，性能清单 X5）
 *
 * 业务代码大量使用 `import * as echarts from "echarts"`，而 ol-echarts 等第三方库
 * 使用默认导入 `import echarts from 'echarts'`。echarts 5 的 ESM 入口（index.js）
 * 只提供命名导出，没有 default，导致 Rollup 解析默认导入时报错。
 *
 * 本目录通过 Vite resolve.alias 被映射为 "echarts" 的解析目标：
 *   - 从 echarts/core 取核心 API，并按需注册图表 / 组件 / 渲染器，替代全量
 *     index.js，让 tree-shaking 真正生效（echarts 相关 chunk 体积显著下降）；
 *   - export * 保留 core 全部命名导出，业务 `import * as echarts` 继续可用
 *     （init / graphic / use / registerMap / number / time 等均在 core 导出内）；
 *   - 再导出一个 default namespace，满足 ol-echarts 的默认导入。
 *
 * 注册清单 = 全仓业务实际用到的图表 / 组件并集（grep 盘点，2026-11）：
 *   图表：line / bar / pie / scatter / radar / effectScatter / lines / heatmap /
 *         treemap（ReChart context 面积视图）/ graph / sankey / funnel / gauge /
 *         custom（ReChart custom 与 koi 首页组件）
 *   组件：grid / tooltip / axisPointer / legend / title / dataZoom（inside+slider）/
 *         visualMap / markPoint / markLine / markArea
 *   渲染器：CanvasRenderer（全仓无 SVG 渲染器用法）
 * 未注册项（map / sunburst / boxplot / candlestick / parallel / themeRiver /
 * pictorialBar 图表，toolbox / geo / calendar / dataset / polar / timeline /
 * brush / graphic 选项组件）在全仓业务代码中无使用；未来要用时按 echarts
 * 按需引入口径在此追加注册即可。
 *
 * 注意：不得在此处显式 re-export 单个 API（如 getLocale/setCanvasCreator），
 * Vite optimizeDeps 预构建 echarts 时 chunk 可能不包含所有命名导出，会导致
 * "does not provide an export named xxx" 语法错误，阻断整个模块图。
 * 依赖 `export *` 与 default namespace 即可。
 */
import * as echarts from "echarts/core";
import {
  BarChart,
  CustomChart,
  EffectScatterChart,
  FunnelChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  LinesChart,
  LineChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  TreemapChart,
} from "echarts/charts";
import {
  AxisPointerComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  // 图表
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  EffectScatterChart,
  LinesChart,
  HeatmapChart,
  TreemapChart,
  GraphChart,
  SankeyChart,
  FunnelChart,
  GaugeChart,
  CustomChart,
  // 组件
  GridComponent,
  TooltipComponent,
  AxisPointerComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  VisualMapComponent,
  MarkPointComponent,
  MarkLineComponent,
  MarkAreaComponent,
  // 渲染器
  CanvasRenderer,
]);

export * from "echarts/core";
export default echarts;
