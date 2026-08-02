/**
 * ReLazy —— 延迟渲染占位组件
 *
 * 通过 `time` 延迟渲染 slot，常用于首屏占位
 *   <ReLazy :time="200"><HeavyComponent /></ReLazy>
 */
import type { App, Plugin } from "vue";
import ReLazy from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReLazy", ReLazy);
  },
};

export { plugin as install };
export default ReLazy;