/**
 * ReRemoteSelect —— 远程 + 自定义下拉选择（输入 + 同步按钮一体）
 */
import type { App, Plugin } from "vue";
import ReRemoteSelect from "./ReRemoteSelect.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRemoteSelect", ReRemoteSelect);
  },
};

export { plugin as install };
export type { ReRemoteOption } from "./types";
export default ReRemoteSelect;