/**
 * ReVideoGen —— 文生视频组件
 */
import type { App, Plugin } from "vue";
import ReVideoGen from "./index.vue";
const plugin: Plugin = { install(app: App) { app.component("ReVideoGen", ReVideoGen); } };
export { plugin as install };
export default ReVideoGen;
