//#region ../../packages/ui/src/components/ReRelationGraph/internals/types.ts
/** 工具栏可切换的布局（带中文名）
*
* <p><strong>层级布局需要树形数据</strong>：{@code compact-box / dendrogram / indented / mindmap / fishbone}
* 在 G6 里都走 {@code getRoots(TREE_KEY)}，套在普通关系图上会抛
* "Tree structure not found for treeKey: tree"（该异常在 G6 内部异步抛出，组件侧 try/catch 拦不住）。
* 给树形数据用时再选这几项。</p>
*/
var RELATION_LAYOUTS = [
	{
		value: "force",
		label: "力导向"
	},
	{
		value: "d3-force",
		label: "D3 力导向"
	},
	{
		value: "force-atlas2",
		label: "ForceAtlas2"
	},
	{
		value: "fruchterman",
		label: "Fruchterman"
	},
	{
		value: "mds",
		label: "MDS 降维"
	},
	{
		value: "circular",
		label: "环形"
	},
	{
		value: "concentric",
		label: "同心圆"
	},
	{
		value: "radial",
		label: "辐射"
	},
	{
		value: "grid",
		label: "网格"
	},
	{
		value: "random",
		label: "随机"
	},
	{
		value: "dagre",
		label: "有向分层"
	},
	{
		value: "antv-dagre",
		label: "有向分层(antv)"
	},
	{
		value: "snake",
		label: "蛇形"
	},
	{
		value: "compact-box",
		label: "紧凑树",
		needTree: true
	},
	{
		value: "dendrogram",
		label: "树状图",
		needTree: true
	},
	{
		value: "indented",
		label: "缩进树",
		needTree: true
	},
	{
		value: "mindmap",
		label: "思维导图",
		needTree: true
	},
	{
		value: "fishbone",
		label: "鱼骨图",
		needTree: true
	}
];
//#endregion
export { RELATION_LAYOUTS as t };
