import { t as defineThemeComponent } from "./theme-DlZtNnND.js";
//#region ../../packages/ui/src/components/ReChart/index.ts
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
var themed = defineThemeComponent("ReChart", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReChart/ReChart.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReChart/ReChart.vue")
});
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
