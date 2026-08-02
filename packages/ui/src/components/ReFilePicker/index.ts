/**
 * ReFilePicker —— 文件选择器
 *
 * 支持树形浏览、搜索、多选、文件类型过滤
 * 适配后端 spring-support-filesystem-starter
 *   <ReFilePicker v-model="show" @select="onSelect" />
 */
import type { App, Plugin } from "vue";
import ReFilePicker from "./index.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReFilePicker", ReFilePicker);
  },
};

export { plugin as install };
export default ReFilePicker;
export type { FilePickerItem, FilePickerListResult } from "./types";