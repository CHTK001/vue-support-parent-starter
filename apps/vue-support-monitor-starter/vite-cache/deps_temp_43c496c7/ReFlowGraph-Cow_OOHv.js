import { t as defineThemeComponent } from "./theme-BnvP-uxy.js";
//#region ../../packages/ui/src/components/ReFlowGraph/index.ts
/**
* ReFlowGraph —— 可视化流程设计器（按主题加载）
*
* 基于 @antv/x6，交互对齐 X6 官方 DAG 示例
* （https://x6.antv.antgroup.com/examples/showcase/practices/#dag）：
*   - 180×36 横向卡片节点（白底 + 左侧主色竖条 + 图标 + 标签），节点体由 Vue 组件
*     经 `@antv/x6-vue-shape` 渲染，与官方用 `@antv/x6-react-shape` 的做法对应
*   - 四向磁吸端口，连线按语义着色：正常绿 / 异常红 / 条件蓝 / 其余灰，不传递变量转虚线
*   - 左侧调色板（点击或 HTML5 拖拽入板）、右侧可拖宽停靠属性面板（表单由插槽提供）
*   - 就地改名、右键菜单、框选、复制粘贴、辅助线、撤销重做、快捷键
*   - 结构预检（唯一开始、末端必须结束、悬空/孤立告警）、缩放适配、缩略图、PNG 导出
*
* 与官方实践的有意差异见 `internals/engine.ts` 文件头（方向约束、平移手势、框选修饰键）
* 与 README 的「与官方 DAG 实践的差异」一节。
*
* 主题：
*   - default：完整设计器
*   - koi：只读视图（editable 时才带调色板）
*/
var themed = defineThemeComponent("ReFlowGraph", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReFlowGraph/theme/default/ReFlowGraph.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReFlowGraph/theme/koi/ReFlowGraph.vue")
});
var component = themed.component;
//#endregion
export { component, component as default, themed as install };
