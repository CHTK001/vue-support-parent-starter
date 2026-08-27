/**
 * ReGraph —— 全能关系图组件（按主题加载）
 *
 * 基于 @antv/x6 封装（agent-flow 风格），支持：
 *   - 力导向图（force）
 *   - 思维导图（tree / mind / 中心布局）
 *   - 关系图、组织架构、股权结构、网络拓扑等
 *   - 多种布局切换：center / force / tree / circle / fixed / mind / relation
 *   - 节点调色板（拖拽生成）、端口连线、缩略图、历史回溯
 *   - 自定义节点类型、连线样式、JSON / PNG 导入导出
 *
 * 主题：
 *   - default：完整功能封装，提供工具栏 / 小地图 / 右键菜单
 *   - koi：精简视图，仅搜索栏 + 轻交互，适合仪表盘
 */
import { defineThemeComponent } from "../../theme";

const themed = defineThemeComponent("ReGraph", {
  default: () => import("./theme/default/ReGraph.vue"),
  koi: () => import("./theme/koi/ReGraph.vue"),
});

export const component = themed.component;
export { themed as install };
export default component;