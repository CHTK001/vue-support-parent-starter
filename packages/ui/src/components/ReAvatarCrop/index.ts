/**
 * ReAvatarCrop —— 头像裁剪上传组件
 *
 * 基于 ReCropper + Element Plus Upload
 *   <ReAvatarCrop v-model="avatar" :action="'/api/upload'" />
 */
import type { App, Plugin } from "vue";
import ReAvatarCrop from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReAvatarCrop", ReAvatarCrop);
  },
};

export { plugin as install };
export default ReAvatarCrop;