/**
 * ReSelect —— 下拉选择组件（el-select 封装）
 *
 * 支持动态数据源：
 *   <ReSelect :data="['a','b']" />
 *   <ReSelect url="/api/options" />
 *   <ReSelect :data="() => fetch('/api').then(r => r.json())" />
 */
import type { App, Plugin } from "vue";
import ReSelect from "./ReSelect.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReSelect", ReSelect);
  },
};

export { plugin as install };
export default ReSelect;
export * from "./types";
