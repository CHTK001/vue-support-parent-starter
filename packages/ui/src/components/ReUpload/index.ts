/**
 * ReUpload —— 通用上传组件
 *
 * 基于 Element Plus Upload，支持拖拽/图片/多文件/限制
 *   <ReUpload v-model="files" :action="'/api/upload'" />
 */
import type { App, Plugin } from "vue";
import ReUpload from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReUpload", ReUpload);
  },
};

export { plugin as install };
export default ReUpload;
export type { UploadFileItem } from "./types";