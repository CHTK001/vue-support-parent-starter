/**
 * ReRelationGraphV2 —— 关系图谱组件（G6 v5.1.1 原生，bubble-sets 基础）
 *
 * <p>以 G6 官方 Bubblesets 气泡集示例为地基逐步构建。当前能力：</p>
 * <ul>
 *   <li>节点 + 边渲染，{@code group} 字段驱动分组轮廓与配色；</li>
 *   <li><b>两种分组轮廓</b>（{@code groupType}）：{@code bubble} 气泡集 /
 *       {@code hull} Hull 凹包轮廓（G6 plugin/hull 示例），{@code none} 只留配色；</li>
 *   <li><b>分组布局 group</b>：每组（势力）自动占据画布上独立的一块区域，组内成团、组间留白；</li>
 *   <li>G6 5.1.1 全部内置布局可选择：force / d3-force / force-atlas2 / fruchterman /
 *       circular / concentric / grid / radial / mds / dagre / antv-dagre /
 *       combo-combined / snake / fishbone / random（见 {@link ./internals/layouts}）；</li>
 *   <li><b>内置工具栏</b>（{@code toolbar}）：布局选择 / 分组轮廓切换 / 分组开关 /
 *       按布局动态生成的参数面板 / 适应画布，全部是「图标 + Popover」；
 *       业务可用 {@code <template #toolbar-extra>} 追加自己的工具；</li>
 *   <li>缩放画布 / 拖拽画布 / 拖拽节点（G6 原生行为）、节点与边 hover 事件、{@code autoFit}。</li>
 * </ul>
 *
 * <p>用法：</p>
 * <pre>
 * &lt;ReRelationGraphV2 :nodes="nodes" :edges="edges" layout="group"
 *   group-type="hull" toolbar /&gt;
 * </pre>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReRelationGraphV2", {
  default: () => import("./theme/default/ReRelationGraphV2.vue"),
  koi: () => import("./theme/koi/ReRelationGraphV2.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;

export * from "./internals/G6GraphV2.vue";
/** 布局清单与类型（供业务做布局切换下拉） */
export { LAYOUT_OPTIONS, DEFAULT_LAYOUT, isGroupLayout } from "./internals/layouts";
export type { V2LayoutType, V2LayoutOption, V2GroupType } from "./internals/layouts";
/** 布局参数表（工具栏「布局设置」面板的数据源，业务可复用做自有面板） */
export {
  LAYOUT_SETTINGS,
  GROUP_COMMON_SETTINGS,
  GROUP_TYPE_SETTINGS,
  settingsOf,
  groupSettingsOf,
} from "./internals/layoutSettings";
export type { LayoutSettingField } from "./internals/layoutSettings";
/** 内置工具栏（可单独取用，做自定义浮动条） */
export { default as GraphToolbarV2 } from "./internals/GraphToolbarV2.vue";
