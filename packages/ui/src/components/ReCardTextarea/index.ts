/**
 * ReCardTextarea —— 卡片式多行文本输入框
 */
import type { App, Plugin } from "vue";
import ReCardTextarea from "./index.vue";
const plugin: Plugin = { install(app: App) { app.component("ReCardTextarea", ReCardTextarea); } };
export { plugin as install };
export default ReCardTextarea;