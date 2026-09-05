/**
 * ReDropdownMenu —— 下拉菜单容器（el-dropdown-menu 封装）
 */
import type { App, Plugin } from "vue";
import ReDropdownMenu from "./ReDropdownMenu.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReDropdownMenu", ReDropdownMenu);
  },
};

export { plugin as install };
export default ReDropdownMenu;