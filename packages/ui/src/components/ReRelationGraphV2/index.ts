/**
 * ReRelationGraphV2 —— 关系图谱组件（G6 v5.1.1 原生，bubble-sets 基础）
 *
 * <p>以 G6 官方 Bubblesets 气泡集示例为地基逐步构建。第一版能力：</p>
 * <ul>
 *   <li>节点 + 边渲染，{@code group} 字段驱动气泡集分组与配色；</li>
 *   <li>force 力导向布局防重叠；</li>
 *   <li>缩放画布 / 拖拽画布 / 拖拽节点（G6 原生行为）；</li>
 *   <li>{@code autoFit} 自适应。</li>
 * </ul>
 *
 * <p>用法：{@code <ReRelationGraphV2 :nodes="nodes" :edges="edges" />}。</p>
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
