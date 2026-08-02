/**
 * ReCropper —— 图片裁剪组件（Cropper.js 封装）
 *
 * 支持图片裁剪、预览
 *   <ReCropper src="url" />
 */
import type { App, Plugin } from "vue";
import ReCropper from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReCropper", ReCropper);
  },
};

export { plugin as install };
export default ReCropper;