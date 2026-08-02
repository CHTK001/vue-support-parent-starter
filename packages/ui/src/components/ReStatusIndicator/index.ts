/**
 * ReStatusIndicator —— 状态指示器（圆点 + 脉冲动画）
 *
 * 对应 Element Plus 主色系，支持 5 种状态色 + 脉冲扩散动画。
 * 典型场景：表格行状态、监控看板运行指示、列表激活态标记。
 */
import type { App, Plugin } from "vue";
import ReStatusIndicator from "./ReStatusIndicator.vue";

export type ReStatusType = "primary" | "success" | "warning" | "danger" | "info";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReStatusIndicator", ReStatusIndicator);
  },
};

export { plugin as install };
export default ReStatusIndicator;