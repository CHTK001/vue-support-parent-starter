/**
 * ReFilePicker —— 文件/目录选择器
 *
 * filesystem 主页面同款「路径栏 + 左树 + 右表明细」。
 * 数据必须由宿主通过 loader（远端 filesystem 接口）或 data（本地 JSON）提供，
 * 组件不再提供内置 mock 兜底。
 *   <ReFilePicker v-model="show" :loader="loadDir" @select="onSelect" />
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
export type { FilePickerData, FilePickerItem, FilePickerListResult, FilePickerLoader } from "./types";
