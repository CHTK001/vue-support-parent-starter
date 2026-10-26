/**
 * ReRelationGraph —— 关系图谱组件（G6 5.1.1 原生内核）
 *
 * <p>以 G6 官方 BubbleSets 示例为地基，不做包装层。能力概览：</p>
 * <ul>
 *   <li><b>布局</b>：19 种（分组 / 力导向 / 环形 / 网格 / 分层 / 树 / 鱼骨 …），
 *       分组布局与鱼骨是自研坐标，其余走 G6 内置；布局落定后统一跑
 *       {@code relaxOverlaps} 消除节点重叠；</li>
 *   <li><b>分组</b>：BubbleSets 气泡集 / Hull 凹包轮廓 / 不画轮廓，按 {@code group}
 *       字段自动分色，支持 combo 折叠；</li>
 *   <li><b>交互</b>：悬停高亮、点选、框选、右键菜单、快捷键（撤销 / 重做 / 全选 /
 *       删除）、最短路径（工具栏开关 → 左键点两个节点自动出结果，右键取消）；</li>
 *   <li><b>外观</b>：圆形 / 矩形 / 图片 / 头像徽标 / 边箭头与虚线，或
 *       {@code #node-content} 插槽渲染任意 DOM（ER 表卡）；</li>
 *   <li><b>编辑</b>：节点与边的命令式增删改（带撤销栈）、工具栏内置布局与参数面板。</li>
 * </ul>
 *
 * <p>用法：{@code <ReRelationGraph :nodes="nodes" :edges="edges" layout="group" />}。
 * 完整 API 见同目录 {@code README.md}。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReRelationGraph", {
  default: () => import("./theme/default/ReRelationGraph.vue"),
  koi: () => import("./theme/koi/ReRelationGraph.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;

/* ---------------- 类型 ---------------- */
export type {
  RelationNode,
  RelationEdge,
  ContextMenuDetail,
  HistoryState,
  HistoryEntry,
} from "./internals/G6Graph.vue";
export type { LayoutType, LayoutOption, GroupType } from "./internals/layouts";
export type { CoreHandle } from "./internals/exposeCore";

/* ---------------- 布局清单 ---------------- */
export {
  LAYOUT_OPTIONS,
  DEFAULT_LAYOUT,
  TREE_LAYOUTS,
  isGroupLayout,
  isTreeLayoutType,
} from "./internals/layouts";

/* ---------------- 分组配色 ---------------- */
export { GROUP_PALETTE, groupColorOf } from "./internals/palette";

/* ---------------- 场景预设 ---------------- */
export { GRAPH_PRESETS, presetOf, applyPreset, suggestPreset } from "./internals/presets";
export type { Preset, PresetOptions } from "./internals/presets";

/* ---------------- 布局参数面板元数据 ---------------- */
export {
  LAYOUT_SETTINGS,
  GROUP_COMMON_SETTINGS,
  GROUP_TYPE_SETTINGS,
  settingsOf,
  groupSettingsOf,
  hasSettingsOf,
} from "./internals/layoutSettings";
export type { LayoutSettingField, LayoutSettingKind } from "./internals/layoutSettings";

/* ---------------- 工具栏（业务要自己排工具栏时可直接用） ---------------- */
export { default as GraphToolbar } from "./internals/GraphToolbar.vue";
