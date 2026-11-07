/**
 * ReFloatWindow —— 可浮动窗口（拖拽 / 缩放 / 最小化浮标 / 最大化 / 全屏 / 边缘自动收起）
 *
 * <p>非模态，内容与头部尽量走 slot，行为尽量走 props：
 * `v-model` 控制显隐，`x/y/width/height` 双向同步几何，`confirm-close` 控制关闭二次确认。</p>
 */
import type { App, Plugin } from "vue";
import ReFloatWindow from "./ReFloatWindow.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReFloatWindow", ReFloatWindow);
  },
};

export { plugin as install };
export default ReFloatWindow;
export type ReFloatWindowInstance = InstanceType<typeof ReFloatWindow>;
