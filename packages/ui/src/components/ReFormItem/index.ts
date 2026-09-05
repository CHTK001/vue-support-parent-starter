/**
 * ReFormItem —— 表单项组件（el-form-item 封装）
 */
import type { App, Plugin } from "vue";
import ReFormItem from "./ReFormItem.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReFormItem", ReFormItem);
  },
};

export { plugin as install };
export default ReFormItem;
