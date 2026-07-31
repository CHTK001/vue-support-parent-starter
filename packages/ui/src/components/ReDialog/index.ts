/**
 * ReDialog —— 弹窗组件（el-dialog 封装）
 */
import type { App, Plugin } from "vue";
import ReDialog from "./ReDialog.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReDialog", ReDialog);
  },
};

export { plugin as install };
export default ReDialog;
