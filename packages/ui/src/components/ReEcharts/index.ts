/**
 * ReEcharts —— 图表组件（ECharts 封装）
 *
 * 支持暗黑模式自适应、CSS 变量主题、响应式 resize
 *   <ReEcharts :option="chartOption" />
 */
import type { App, Plugin } from "vue";
import ReEcharts from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReEcharts", ReEcharts);
  },
};

export { plugin as install };
export default ReEcharts;
