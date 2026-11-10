/**
 * ReRailSplit — 左右分栏拖拽手柄
 *
 * <p>用法：</p>
 * <pre>
 *   const railWidth = ref(readRailWidth('xxx.rail.width.v1', 268))
 *   &lt;ReRailSplit v-model:width="railWidth" storage-key="xxx.rail.width.v1" :default-width="268" /&gt;
 * </pre>
 */
import type { App, Plugin } from "vue";
import ReRailSplit from "./ReRailSplit.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReRailSplit", ReRailSplit);
  },
};

export { plugin as install };
export default ReRailSplit;
export { readRailWidth } from "./readRailWidth";
