/**
 * ReFilePicker —— 文件/目录选择器
 *
 * Windows 资源管理器文件对话框风格：顶栏（后退 / 刷新 / 地址栏 / 搜索）、
 * 左侧导航窗格、右侧详细信息列表（名称 / 修改时间 / 类型 / 大小，可排序）、
 * 底部状态栏。数据必须由宿主通过 loader（远端接口）或 data（本地 JSON）提供。
 *
 *   <ReFilePicker v-model="show" :loader="loadDir" :limit="5" accept="dir,.zip" @select="onSelect" />
 *
 * 能力：
 *   - 数量/类型限制：limit（0 = 不限）、accept（扩展名 / MIME / 类别 / `dir`，含 dir 时目录可选）；
 *   - 右键菜单：contextMenu（true/false/逐项开关），刷新与属性组件自带，
 *     新建文件夹 / 重命名 / 删除 / 上传 / 下载默认关、由宿主的 createDir / renameItem /
 *     removeItems / uploadFiles / downloadItems 回调落盘；
 *   - 预览：previewUrl（如 FileStorageServerFilter 的 ?preview=true 票据通道）走内建 iframe，
 *     或用 `#preview` 插槽换成宿主自己的预览面板。
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
export { useFilePicker } from "./composables/useFilePicker";
export type { UseFilePickerOptions, UseFilePickerReturn } from "./composables/useFilePicker";
export * from "./utils";
export type {
  FilePickerColumn,
  FilePickerContextMenuAction,
  FilePickerContextMenuItem,
  FilePickerContextMenuOptions,
  FilePickerData,
  FilePickerItem,
  FilePickerListResult,
  FilePickerLoader,
  FilePickerSelectModifiers,
  FilePickerSortKey,
  FilePickerTreeNode,
  FilePickerViewMode,
} from "./types";
