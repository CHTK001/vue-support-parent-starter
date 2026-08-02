/**
 * ReColorize —— 图片上色组件
 */
import type { App, Plugin } from "vue";
import ReColorize from "./index.vue";
const plugin: Plugin = { install(app: App) { app.component("ReColorize", ReColorize); } };
export { plugin as install };
export default ReColorize;
