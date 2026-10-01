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
 *   <li>运行时通过实例方法动态增删节点与边；</li>
 *   <li>内置工具栏：布局切换 / 缩放 / 适配视口 / 小地图开关。</li>
 * </ul>
 *
 * <p>用法：{@code <ReRelationGraph :nodes="nodes" :edges="edges" layout="force" />}。</p>
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
