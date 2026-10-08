/**
 * ReRelationGraph —— 关系图谱组件（G6 v5 内核）
 *
 * <p>能力概览：</p>
 * <ul>
 *   <li>节点：原型（circle/rect/image/html/star/triangle/diamond/donut/hexagon/ellipse）、
 *       图片、名称、大小、分组、固定；</li>
 *   <li>交互：左键 / 右键 / 双击 / 鼠标经过与退出，ctrl+左键多选；</li>
 *   <li>边：类型、方向（箭头）、动态（虚线流动感）；</li>
 *   <li>布局：18 种内置布局可切换，节点可拖拽、可固定，小地图、缩放、
 *       悬停同组高亮（其余淡出）、悬停临近高亮（其余淡出）；</li>
 *   <li>运行时通过实例方法动态增删改节点与边（addNode / addEdge / updateNode /
 *       updateEdge / removeNode / removeEdge），同步 3D 视图，编辑进撤销栈；</li>
 *   <li>内置类地图悬浮工具栏（画布右上角，圆角半透明 + 阴影）：布局切换 /
 *       节点搜索定位 / 缩放 / 适配视口 / 撤销重做 / 图片导出 / 拖边连线 /
 *       小地图开关 / 2D-3D 切换；</li>
 *   <li>编辑能力：{@code editable} 下右键菜单删除、选中单个节点/边时工具栏出现
 *       更新 / 删除按钮、拖边连线（连线模式开关）、撤销 / 重做（仅记录数据变更，
 *       拖拽位移与布局不占栈）；</li>
 *   <li>节点内容插槽 {@code #node-content="{ node, selected }"}（仅 2D，
 *       类型为 {@code html} 的节点走 DOM 渲染）；</li>
 *   <li>无障碍：工具栏 {@code role=toolbar} + 左右方向键巡航、画布可聚焦、
 *       Ctrl+Z / Ctrl+Y / Ctrl+F / Esc 快捷键；文案随应用语言（i18n）切换；</li>
 *   <li>2D/3D 双视图：{@code mode="2d"|"3d"} 或工具栏按钮切换，3D 基于
 *       vue-force-graph-3d（力导向、拖拽、悬停高亮、右键菜单、选中），
 *       G6 实例全程保活，两视图共享同一数据源与选中状态。</li>
 * </ul>
 *
 * <p>用法：{@code <ReRelationGraph :nodes="nodes" :edges="edges" layout="force" />}；
 * 3D 视图：{@code <ReRelationGraph :nodes="nodes" :edges="edges" mode="3d" />}。</p>
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

export * from "./internals/types";
