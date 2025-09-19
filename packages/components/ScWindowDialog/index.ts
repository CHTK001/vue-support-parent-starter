import { withInstall } from "@pureadmin/utils";
import ScWindowDialog from "./index.vue";

/**
 * ScWindowDialog 组件导出
 * @author CH
 * @version 2.0.0
 * @description 基于 draggable-resizable-vue3 的增强对话框组件
 */

// 使用 withInstall 包装组件，支持全局注册
const _ScWindowDialog = withInstall(ScWindowDialog);

// 导出组件
export default _ScWindowDialog;
export { _ScWindowDialog as ScWindowDialog };

// 导出类型
export type { ScWindowDialogEmits, ScWindowDialogInstance, ScWindowDialogProps, ScWindowDialogTheme } from "./types";

// 组件信息
export const componentInfo = {
  name: "ScWindowDialog",
  version: "2.0.0",
  description: "基于 draggable-resizable-vue3 的增强对话框组件，支持拖拽、调整大小、主题、图标等功能",
  author: "CH",
  features: ["支持拖拽和调整大小", "支持多种主题样式", "支持标题图标显示", "自动收缩功能", "多弹框管理", "响应式设计", "优化的视觉效果"]
};
