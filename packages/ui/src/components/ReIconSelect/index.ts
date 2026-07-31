/**
 * ReIconSelect —— 图标选择器
 *
 * 支持多个图标库（默认 ep / ri / mdi），可通过 props 注入自定义集合。
 */
import type { App, Plugin } from "vue";
import ReIconSelect from "./ReIconSelect.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReIconSelect", ReIconSelect);
  },
};

export { plugin as install };
export default ReIconSelect;
export * from "../ReIcon/iconData";