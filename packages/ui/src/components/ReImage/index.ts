/**
 * ReImage —— 图片组件
 *
 * 基于 viewerjs，支持预览、错误处理、加载占位
 *   <ReImage src="url" :preview="true" />
 */
import type { App, Plugin } from "vue";
import ReImage from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReImage", ReImage);
  },
};

export { plugin as install };
export default ReImage;