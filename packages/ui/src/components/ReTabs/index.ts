/**
 * ReTabs —— 多标签工作区（可关闭 / 右键菜单 / 面板常驻）
 */
import type { App, Plugin } from "vue";
import ReTabs from "./ReTabs.vue";
import type { ReTabsContextItem, ReTabsItem } from "./types";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTabs", ReTabs);
  },
};

export { plugin as install };
export type { ReTabsContextItem, ReTabsItem };
export default ReTabs;
