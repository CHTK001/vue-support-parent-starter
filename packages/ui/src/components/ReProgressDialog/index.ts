/**
 * ReProgressDialog —— 安装向导式长任务进度弹窗（不可关闭，取消由接口决定）
 *
 * @example
 * <ReProgressDialog
 *   v-model="visible"
 *   title="正在创建租户"
 *   :snapshot="snapshot"
 *   :steps="stepDefs"
 *   :cancellable="cancellable"
 *   @cancel="onCancel"
 *   @close="onClose"
 * />
 */
import type { App, Plugin } from "vue";
import ReProgressDialog from "./ReProgressDialog.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReProgressDialog", ReProgressDialog);
  },
};

export { plugin as install };
export { ReProgressDialog };
export type { ProgressSnapshot, ProgressStep } from "./types";
export default ReProgressDialog;
