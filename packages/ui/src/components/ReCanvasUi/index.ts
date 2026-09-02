/**
 * ReCanvasUi —— Canvas UI Liquid 流体特效组件
 *
 * 基于 Canvas UI 的 html-in-canvas 技术，提供指针驱动的流体模拟效果。
 * 使用前需确保浏览器支持（Chrome + canvas-draw-element flag 或 Origin Trial）。
 *
 *   <ReCanvasUi :rainbow="true" style="height: 480px">
 *     <YourContent />
 *   </ReCanvasUi>
 */
import type { App, Plugin } from "vue";
import ReCanvasUi from "./ReCanvasUi.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReCanvasUi", ReCanvasUi);
  },
};

export { plugin as install };
export default ReCanvasUi;
