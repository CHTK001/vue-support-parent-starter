/**
 * ReProcessTask —— 可拖拽 / 可最小化的过程任务浮层
 *
 * @example
 * <ReProcessTask :task="task" :index="0" @close="..." @minimize="..." @drag="..." />
 */
import type { App, Plugin } from "vue";
import ReProcessTask from "./ReProcessTask.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReProcessTask", ReProcessTask);
  },
};

export { plugin as install };
export { ReProcessTask };
export default ReProcessTask;
