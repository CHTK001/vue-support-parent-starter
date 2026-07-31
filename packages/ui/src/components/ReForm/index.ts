/**
 * ReForm —— 表单组件（el-form 封装）
 *
 * 支持 schema 化渲染：
 *   <ReForm :model="model" :fields="[{ prop: 'name', label: '姓名', component: 'input' }]" />
 */
import type { App, Plugin } from "vue";
import ReForm from "./ReForm.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReForm", ReForm);
  },
};

export { plugin as install };
export default ReForm;
export * from "./types";
