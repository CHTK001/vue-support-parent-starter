/**
 * ReGraph —— 全能关系图组件（按主题加载）
 *
 * 基于 @relation-graph/vue3 封装，支持：
 *   - 力导向图（force）
 *   - 思维导图（tree / 中心布局）
 *   - 关系图、组织架构、股权结构、网络拓扑等
 *   - 多种布局切换：center / force / tree / circle / fixed / folder
 *   - 自定义节点插槽、连线样式
 *   - 图编辑器模式（拖拽、连线、增删节点）
 *
 * 主题：
 *   - default：完整功能封装，提供插槽透传与工具栏
 *   - koi：精简视图，保留核心布局能力
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraph", {
  default: () => import("./theme/default/ReGraph.vue"),
  koi: () => import("./theme/koi/ReGraph.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;