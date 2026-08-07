/**
 * ReProgress —— 任务进度组件（入口）
 *
 * 多个布局模式：
 *   - "bar"   ：单条进度条（纯展示）
 *   - "task"  ：单个任务卡片（带状态 / 操作）
 *   - "panel" ：多任务面板（实时 / 历史模式 + 系统设置）
 */
import type { App, Plugin } from "vue";
import ReProgress from "./ReProgress.vue";
import ReProgressTask from "./ReProgressTask.vue";
import ReProgressPanel from "./ReProgressPanel.vue";
import ReProgressTimeline from "./ReProgressTimeline.vue";

const components = {
  ReProgress,
  ReProgressTask,
  ReProgressPanel,
  ReProgressTimeline,
};

const plugin: Plugin = {
  install(app: App) {
    for (const [name, c] of Object.entries(components)) {
      app.component(name, c);
    }
  },
};

export { plugin as install };
export { ReProgress, ReProgressTask, ReProgressPanel, ReProgressTimeline };
export { useProgress } from "./composables/useTasks";
export type * from "./types";
export default ReProgress;