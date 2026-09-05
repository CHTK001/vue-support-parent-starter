/**
 * ReDropdownItem —— 下拉菜单项（el-dropdown-item 封装）
 */
import type { App, Plugin } from "vue";
import ReDropdownItem from "./ReDropdownItem.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReDropdownItem", ReDropdownItem);
  },
};

export { plugin as install };
export default ReDropdownItem;