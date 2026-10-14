/**
 * ReTab —— 标签页组件
 *
 * 默认 capsule 胶囊式分段布局（主题配置抽屉顶部页签同款），
 * 也可显式 variant="element" 走 element-plus 原生 el-tabs；两种都支持 tab 图标。
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
