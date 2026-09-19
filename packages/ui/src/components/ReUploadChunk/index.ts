/**
 * ReUploadChunk —— 分片上传组件
 *
 * 适配后端分片上传接口
 *   <ReUploadChunk v-model="files" base-url="/api/filesystem" />
 */
import type { App, Plugin } from "vue";
import ReUploadChunk from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReUploadChunk", ReUploadChunk);
  },
};

export { plugin as install };
export default ReUploadChunk;
export type { ChunkUploadFile } from "./types";