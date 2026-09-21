/**
 * ReFlowGraph —— 可视化流程设计器（按主题加载）
 *
 * 基于 @antv/x6，交互对齐 spider-flow 的编辑器：
 *   - 小图标节点（40×40 徽章 + 下方标签），四向磁吸，拖拽出正交圆角连线
 *   - 连线按语义着色：正常绿 / 异常红 / 条件蓝 / 其余灰，不传递变量转虚线
 *   - 左侧调色板（点击或 HTML5 拖拽入板）、底部可拖高停靠属性面板（表单由插槽提供）
 *   - 就地改名、右键菜单、框选、复制粘贴、辅助线、撤销重做、快捷键
 *   - 结构预检（唯一开始、末端必须结束、悬空/孤立告警）、缩放适配、缩略图、PNG 导出
 *
 * 主题：
 *   - default：完整设计器
 *   - koi：只读视图（editable 时才带调色板）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReFlowGraph", {
  default: () => import("./theme/default/ReFlowGraph.vue"),
  koi: () => import("./theme/koi/ReFlowGraph.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;

export type { FlowGraphEngine } from "./internals/engine";
export type {
  FlowEdge,
  FlowEdgeKind,
  FlowGraphData,
  FlowNode,
  FlowNodeTypeDef,
  FlowSelection,
  FlowStructureIssue,
} from "./internals/types";
