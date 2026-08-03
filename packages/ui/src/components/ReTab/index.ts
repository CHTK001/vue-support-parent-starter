/**
 * ReTab —— 标签页组件（el-tabs 封装，支持 tab 图标）
 */
import type { App, Plugin } from "vue";
import ReTab from "./ReTab.vue";
import type { ReTabItem } from "./types";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTab", ReTab);
  },
};

export { plugin as install };
export type { ReTabItem };
export default ReTab;
