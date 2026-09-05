/**
 * ReDropdown —— 下拉菜单组件（el-dropdown 封装）
 */
import type { App, Plugin } from "vue";
import ReDropdown from "./ReDropdown.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReDropdown", ReDropdown);
  },
};

export { plugin as install };
export default ReDropdown;