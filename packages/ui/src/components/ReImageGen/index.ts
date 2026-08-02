/**
 * ReImageGen —— 文生图组件
 */
import type { App, Plugin } from "vue";
import ReImageGen from "./index.vue";
const plugin: Plugin = { install(app: App) { app.component("ReImageGen", ReImageGen); } };
export { plugin as install };
export default ReImageGen;
