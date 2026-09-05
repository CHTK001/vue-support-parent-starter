/**
 * ReDescriptionsItem —— 描述项（el-descriptions-item 封装）
 */
import type { App, Plugin } from "vue";
import ReDescriptionsItem from "./ReDescriptionsItem.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReDescriptionsItem", ReDescriptionsItem);
  },
};

export { plugin as install };
export default ReDescriptionsItem;