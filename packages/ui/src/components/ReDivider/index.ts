/**
 * ReDivider —— 分隔线组件（el-divider 封装）
 */
import type { App, Plugin } from "vue";
import ReDivider from "./ReDivider.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReDivider", ReDivider);
  },
};

export { plugin as install };
export default ReDivider;