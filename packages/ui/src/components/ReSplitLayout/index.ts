/**
 * ReSplitLayout —— 基于 reactive-layout 的可拖拽分栏布局组件。
 */
import type { App, Plugin } from 'vue';
import ReSplitLayout from './ReSplitLayout.vue';

const plugin: Plugin = {
  install(app: App) {
    app.component('ReSplitLayout', ReSplitLayout);
  },
};

export { plugin as install };
export default ReSplitLayout;
export type { PanelNode, PanelTab, SplitNode, LayoutNode } from './vendor';
