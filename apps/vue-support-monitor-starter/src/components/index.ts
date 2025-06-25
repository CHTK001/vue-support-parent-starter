/**
 * 全局组件注册
 */
import type { App } from "vue";

// 通用组件
import StatusIndicator from "./common/StatusIndicator.vue";
import DataTable from "./common/DataTable.vue";

// 图表组件
import MetricsChart from "./charts/MetricsChart.vue";

// 日志组件
import RealTimeLogViewer from "./logs/RealTimeLogViewer.vue";

// 仪表板组件
import ServerMetricsDashboard from "./dashboard/ServerMetricsDashboard.vue";

// 组件列表
const components = [
  StatusIndicator,
  DataTable,
  MetricsChart,
  RealTimeLogViewer,
  ServerMetricsDashboard,
];

/**
 * 注册全局组件
 */
export function setupGlobalComponents(app: App) {
  components.forEach((component) => {
    app.component(component.name || component.__name, component);
  });
}

// 导出组件
export {
  StatusIndicator,
  DataTable,
  MetricsChart,
  RealTimeLogViewer,
  ServerMetricsDashboard,
};

// 默认导出
export default {
  install: setupGlobalComponents,
};
