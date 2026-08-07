/**
 * ReGraph3D —— 3D 力导向关系图组件
 *
 * 基于 three.js + d3-force 实现（d3-force-3d 的 d3-force 封装）。
 * 不引入 3d-force-graph npm 包，自行封装以减少依赖与体积。
 *
 * 支持：
 *   - 力导向布局（3D）
 *   - 鼠标拖拽旋转 / 滚轮缩放
 *   - 自动旋转
 *   - 节点悬停 / 点击事件
 *   - 节点大小（按 val 或度数）
 *   - 节点颜色（按 group）
 *   - 方向箭头
 *
 * 主题：
 *   - default：完整功能（搜索 / 工具栏 / 节点交互）
 *   - koi：精简视图（无工具栏，仅 3D 渲染）
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraph3D", {
  default: () => import("./theme/default/ReGraph3D.vue"),
  koi: () => import("./theme/koi/ReGraph3D.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;
