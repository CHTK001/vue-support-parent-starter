import { t as defineThemeComponent } from "./theme-DY5ftAcm.js";
import GraphToolbar from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReRelationGraph/internals/GraphToolbar.vue";
//#region ../../packages/ui/src/components/ReRelationGraph/internals/layouts.ts
/** 全部布局（顺序即参数面板顺序，分组布局置顶） */
var LAYOUT_OPTIONS = [
	{
		label: "分组布局 group",
		value: "group",
		hint: "每组自动占据独立区域（推荐）",
		icon: "Files"
	},
	{
		label: "力导向 force",
		value: "force",
		hint: "弹簧模型，节点斥力 + 连线拉力",
		icon: "Share"
	},
	{
		label: "D3 力导向 d3-force",
		value: "d3-force",
		hint: "d3-force 模拟",
		icon: "Connection"
	},
	{
		label: "ForceAtlas2 force-atlas2",
		value: "force-atlas2",
		hint: "大型网络聚类力导向",
		icon: "Aim"
	},
	{
		label: "Fruchterman fruchterman",
		value: "fruchterman",
		hint: "经典力导向（带 grid 加速）",
		icon: "Compass"
	},
	{
		label: "环形 circular",
		value: "circular",
		hint: "节点均布在圆周上",
		icon: "RefreshRight"
	},
	{
		label: "同心圆 concentric",
		value: "concentric",
		hint: "按度数分环",
		icon: "Odometer"
	},
	{
		label: "网格 grid",
		value: "grid",
		hint: "等距网格排列",
		icon: "Grid"
	},
	{
		label: "辐射 radial",
		value: "radial",
		hint: "以中心节点向四周辐射",
		icon: "Position"
	},
	{
		label: "MDS mds",
		value: "mds",
		hint: "多维尺度降维",
		icon: "Histogram"
	},
	{
		label: "Dagre 分层 dagre",
		value: "dagre",
		hint: "有向分层（需边有方向）",
		icon: "Sort"
	},
	{
		label: "AntV Dagre 分层 antv-dagre",
		value: "antv-dagre",
		hint: "AntV 版分层布局",
		icon: "SortDown"
	},
	{
		label: "Combo 组合 combo-combined",
		value: "combo-combined",
		hint: "按 combo 分组组合",
		icon: "Menu"
	},
	{
		label: "鱼骨 fishbone",
		value: "fishbone",
		hint: "鱼骨图（自研：自动 BFS 生成树）",
		icon: "DataLine"
	},
	{
		label: "脑图 mindmap",
		value: "mindmap",
		hint: "双向脑图，中心向外展开",
		icon: "Share"
	},
	{
		label: "生态树 compact-box",
		value: "compact-box",
		hint: "紧凑树（生态树），最省空间",
		icon: "Grid"
	},
	{
		label: "树图 dendrogram",
		value: "dendrogram",
		hint: "层次聚类树（叶子在底层）",
		icon: "Sort"
	},
	{
		label: "缩进树 indented",
		value: "indented",
		hint: "目录式缩进树",
		icon: "Tickets"
	},
	{
		label: "随机 random",
		value: "random",
		hint: "随机位置（对照用）",
		icon: "MagicStick"
	}
];
/** 默认布局 */
var DEFAULT_LAYOUT = "group";
/** 判断布局名是否是分组布局 */
var isGroupLayout = (type) => type === "group";
/**
* 需要「树结构」的布局。
*
* <p>@antv/hierarchy 的树图族（compact-box / mindmap / dendrogram / indented）
* 由 G6 自己从边推导树；<b>fishbone</b> 走的是另一条路径 ——
* 它读 {@code model.getRootsData()}（model 里的 TREE 结构），
* 而 TREE 结构只由节点数据上的 {@code children} 建立。
* 所以只传 nodes + edges 时鱼骨布局「什么都不画」：
* 该布局下本组件会先算一棵生成树写进 {@code children}。</p>
*/
var TREE_LAYOUTS = [
	"fishbone",
	"compact-box",
	"mindmap",
	"dendrogram",
	"indented"
];
/** 是否树类布局（需要拼树 / 布局结果靠层级） */
var isTreeLayoutType = (type) => TREE_LAYOUTS.includes(type);
//#endregion
//#region ../../packages/ui/src/components/ReRelationGraph/internals/palette.ts
/**
* 分组配色（唯一来源）。
*
* <p>节点填充 / 分组轮廓 / combo 描边 / 工具面板色点全从这里取，
* 所以「同组同色」在全图各处一致；业务要画图例、头像底色、
* 自定义面板时也应该用 {@link groupColorOf}，不要自己再抄一套调色板
* （抄一套就得跟着这里改，实际做过的项目里几乎都抄歪了）。</p>
*
* <p>取色是「组名 hash → 调色板下标」，跟数据顺序无关：
* 加节点、换布局、改分组顺序都不会让颜色跳变。</p>
*/
/** 分组调色板（沿用 G6 官方 bubble-sets 示例的六色） */
var GROUP_PALETTE = [
	"#1783FF",
	"#00C9C9",
	"#F08F56",
	"#D580FF",
	"#786CFF",
	"#FF85C0"
];
/** 组名 hash → 稳定色（同组同色，跨渲染稳定） */
var groupColorOf = (group, palette = GROUP_PALETTE) => {
	let hash = 0;
	for (let i = 0; i < group.length; i++) hash = hash * 31 + group.charCodeAt(i) >>> 0;
	return palette[hash % palette.length] ?? GROUP_PALETTE[0];
};
//#endregion
//#region ../../packages/ui/src/components/ReRelationGraph/internals/presets.ts
/**
* 内置场景预设。
*
* <p>每个都经过实测：布局能排出唯一位置（不会全叠在原点）、交叉数可接受、
* 开关组合自洽（例如树类布局不再画分组轮廓，因为树已经自带层次）。</p>
*/
var GRAPH_PRESETS = [
	{
		key: "knowledge",
		label: "知识图谱",
		hint: "分组 + 气泡轮廓 + 悬浮提示，看势力结构和节点详情",
		effect: "分组布局 · 气泡集轮廓 · 节点/边提示开 · 无箭头",
		options: {
			layout: "group",
			groupType: "bubble",
			groupVisible: true,
			groupAutoHide: true,
			highlight: true,
			nodeTooltip: true,
			edgeTooltip: true,
			clickSelect: true,
			brushSelect: false,
			minimap: false,
			combo: false,
			edgeArrow: false,
			edgeDashed: false,
			edgeWidth: 1.4,
			edgeLabel: true,
			nodeBadge: true,
			toolbarVariant: "pill",
			toolbarCollapsible: true
		}
	},
	{
		key: "org",
		label: "组织架构",
		hint: "自顶向下的层级 + 箭头，看汇报关系（谁向谁汇报）",
		effect: "dagre 自上而下 · 不画轮廓 · 单向箭头 · 边标签开",
		options: {
			layout: "dagre",
			layoutOptions: {
				rankdir: "TB",
				nodesep: 40,
				ranksep: 110
			},
			groupType: "none",
			groupVisible: false,
			highlight: true,
			nodeTooltip: true,
			edgeTooltip: true,
			clickSelect: true,
			brushSelect: false,
			minimap: false,
			combo: false,
			edgeArrow: true,
			edgeDashed: false,
			edgeWidth: 1.6,
			edgeLabel: true,
			nodeBadge: true,
			toolbarVariant: "pill",
			toolbarCollapsible: true
		}
	},
	{
		key: "topology",
		label: "流程拓扑",
		hint: "分层铺开 + 小地图/框选，看上下游和数据流向",
		effect: "antv-dagre 宽幅分层 · 单向箭头 · 小地图 + 框选开",
		options: {
			layout: "antv-dagre",
			layoutOptions: {
				nodesep: 34,
				ranksep: 80
			},
			groupType: "none",
			groupVisible: false,
			highlight: true,
			nodeTooltip: true,
			edgeTooltip: true,
			clickSelect: true,
			brushSelect: true,
			minimap: true,
			combo: false,
			edgeArrow: true,
			edgeDashed: false,
			edgeWidth: 1.6,
			edgeLabel: true,
			nodeBadge: true,
			toolbarVariant: "card",
			toolbarCollapsible: true
		}
	},
	{
		key: "social",
		label: "社交关系",
		hint: "力导向自由布局 + 细虚线，看聚类和远近亲疏",
		effect: "d3-force · 无轮廓 · 细虚线 · 只开节点提示",
		options: {
			layout: "d3-force",
			groupType: "none",
			groupVisible: false,
			highlight: true,
			nodeTooltip: true,
			edgeTooltip: false,
			clickSelect: true,
			brushSelect: true,
			minimap: true,
			combo: false,
			edgeArrow: false,
			edgeDashed: true,
			edgeWidth: 1.1,
			edgeLabel: false,
			nodeBadge: false,
			toolbarVariant: "pill",
			toolbarCollapsible: true
		}
	},
	{
		key: "hierarchy",
		label: "家族谱系",
		hint: "鱼骨横向铺开 + 双向箭头，看世代和婚姻/血缘的双向关系",
		effect: "鱼骨布局 · 双向箭头 · 边标签开 · 提示全开",
		options: {
			layout: "fishbone",
			groupType: "none",
			groupVisible: false,
			highlight: true,
			nodeTooltip: true,
			edgeTooltip: true,
			clickSelect: true,
			brushSelect: false,
			minimap: true,
			combo: false,
			edgeArrow: "both",
			edgeDashed: false,
			edgeWidth: 1.4,
			edgeLabel: true,
			nodeBadge: true,
			toolbarVariant: "pill",
			toolbarCollapsible: true
		}
	}
];
/** 按 key 取预设（找不到给第一个，方便下拉初始化） */
var presetOf = (key) => GRAPH_PRESETS.find((p) => p.key === key) ?? GRAPH_PRESETS[0];
/**
* 取出可直接 v-bind 的参数包（浅拷贝，避免业务改到内置常量）。
*
* <p>{@code layoutOptions} / {@code groupOptions} 也做了拷贝，业务改了不会污染预设。</p>
*/
var applyPreset = (preset) => {
	const p = typeof preset === "string" ? presetOf(preset) : preset;
	return {
		...p.options,
		...p.options.layoutOptions ? { layoutOptions: { ...p.options.layoutOptions } } : {},
		...p.options.groupOptions ? { groupOptions: { ...p.options.groupOptions } } : {}
	};
};
/**
* 从现有数据猜一个合适的预设（首次接入时少调参）。
*
* <p>规则很简单，够用就好：有 group 字段 + 分组数 ≥ 3 → 知识图谱；
* 连通且有明确层次（平均度数低、有唯一高度数节点）→ 组织架构；其余 → 流程拓扑。</p>
*/
var suggestPreset = (nodes = [], edges = []) => {
	if (new Set(nodes.map((n) => n.group).filter(Boolean)).size >= 3) return presetOf("knowledge");
	const degree = /* @__PURE__ */ new Map();
	for (const n of nodes) degree.set(String(n.id), 0);
	for (const e of edges) {
		degree.set(String(e.source), (degree.get(String(e.source)) ?? 0) + 1);
		degree.set(String(e.target), (degree.get(String(e.target)) ?? 0) + 1);
	}
	const degs = [...degree.values()].sort((a, b) => b - a);
	const avg = degs.reduce((s, d) => s + d, 0) / Math.max(1, degs.length);
	if ((degs[0] ?? 0) >= 3 && avg <= 2) return presetOf("org");
	return presetOf("topology");
};
//#endregion
//#region ../../packages/ui/src/components/ReRelationGraph/internals/layoutSettings.ts
/** 方向类下拉的公共选项（树类布局 / 分层布局复用） */
var DIRECTION_TB = [
	{
		label: "从上到下 TB",
		value: "TB"
	},
	{
		label: "从下到上 BT",
		value: "BT"
	},
	{
		label: "从左到右 LR",
		value: "LR"
	},
	{
		label: "从右到左 RL",
		value: "RL"
	}
];
/** 各布局的参数表（键为布局名；缺省 = 该布局无可调参数） */
var LAYOUT_SETTINGS = {
	group: [
		{
			key: "spacing",
			label: "组内间距",
			min: 40,
			max: 240,
			step: 10,
			defaultValue: 100,
			unit: "px",
			hint: "越大组内越松散，单组区域也随之变大"
		},
		{
			key: "gap",
			label: "组间留白",
			min: 60,
			max: 400,
			step: 10,
			defaultValue: 170,
			unit: "px",
			hint: "组与组之间的空隙"
		},
		{
			key: "minRadius",
			label: "最小半径",
			min: 30,
			max: 200,
			step: 10,
			defaultValue: 70,
			unit: "px",
			hint: "小势力（1~2 个节点）的占位半径"
		}
	],
	force: [
		{
			key: "nodeStrength",
			label: "节点斥力",
			min: 10,
			max: 2e3,
			step: 10,
			defaultValue: 1e3,
			hint: "正值=互相排斥，越大越散"
		},
		{
			key: "linkDistance",
			label: "连线长度",
			min: 50,
			max: 400,
			step: 10,
			defaultValue: 200,
			unit: "px"
		},
		{
			key: "gravity",
			label: "向心引力",
			min: 0,
			max: 50,
			step: 1,
			defaultValue: 10,
			hint: "把节点往画布中心拉"
		}
	],
	"d3-force": [
		{
			key: "linkDistance",
			label: "连线长度",
			min: 20,
			max: 300,
			step: 10,
			defaultValue: 100,
			unit: "px"
		},
		{
			key: "nodeStrength",
			label: "节点斥力",
			min: -500,
			max: 0,
			step: 10,
			defaultValue: -30,
			hint: "负数=排斥，越负越散"
		},
		{
			key: "collideStrength",
			label: "防撞强度",
			min: .1,
			max: 1,
			step: .1,
			defaultValue: 1,
			hint: "节点挤在一起时互相推开的力度"
		}
	],
	"force-atlas2": [
		{
			key: "kr",
			label: "斥力系数",
			min: 1,
			max: 500,
			step: 1,
			defaultValue: 5,
			hint: "越大布局越松"
		},
		{
			key: "kg",
			label: "向心系数",
			min: 0,
			max: 20,
			step: 1,
			defaultValue: 1,
			hint: "越大越聚在中心"
		},
		{
			key: "ks",
			label: "移动速度",
			min: .01,
			max: 1,
			step: .01,
			defaultValue: .1
		},
		{
			key: "mode",
			label: "聚类模式",
			kind: "select",
			defaultValue: "normal",
			hint: "linlog 模式下同簇节点更紧凑",
			options: [{
				label: "普通 normal",
				value: "normal"
			}, {
				label: "紧凑 linlog",
				value: "linlog"
			}]
		}
	],
	fruchterman: [{
		key: "gravity",
		label: "向心引力",
		min: 0,
		max: 50,
		step: 1,
		defaultValue: 10
	}, {
		key: "speed",
		label: "收敛速度",
		min: .1,
		max: 10,
		step: .1,
		defaultValue: 5,
		hint: "太快会明显震荡"
	}],
	circular: [
		{
			key: "radius",
			label: "圆半径",
			min: 0,
			max: 900,
			step: 20,
			defaultValue: 0,
			unit: "px",
			zeroAsAuto: true,
			hint: "0 = 按节点尺寸自动撑开圆周；手填半径后不再按间距反推，半径小的圈会靠去重叠收尾"
		},
		{
			key: "nodeSpacing",
			label: "环上间距",
			min: 0,
			max: 80,
			step: 2,
			defaultValue: 14,
			unit: "px",
			hint: "仅自动半径时生效：按节点直径之和反推圆周；手填了半径就不再用它"
		},
		{
			key: "startAngle",
			label: "起始角度",
			min: 0,
			max: 360,
			step: 15,
			defaultValue: 0,
			unit: "°"
		},
		{
			key: "ordering",
			label: "环上排序",
			kind: "select",
			defaultValue: "",
			hint: "决定节点在圆周上的先后顺序",
			options: [
				{
					label: "数据顺序",
					value: ""
				},
				{
					label: "按拓扑 topology",
					value: "topology"
				},
				{
					label: "按有向拓扑",
					value: "topology-directed"
				},
				{
					label: "按度数 degree",
					value: "degree"
				}
			]
		},
		{
			key: "clockwise",
			label: "顺时针",
			kind: "switch",
			defaultValue: true
		}
	],
	concentric: [
		{
			key: "nodeSpacing",
			label: "节点间距",
			min: 0,
			max: 80,
			step: 2,
			defaultValue: 14,
			unit: "px"
		},
		{
			key: "equidistant",
			label: "等距分环",
			kind: "switch",
			defaultValue: false,
			hint: "开=每环间距相同；关=按度数比例分配"
		},
		{
			key: "clockwise",
			label: "顺时针",
			kind: "switch",
			defaultValue: true
		},
		{
			key: "sortBy",
			label: "分环依据",
			kind: "select",
			defaultValue: "degree",
			hint: "数值越高越靠圆心",
			options: [{
				label: "按度数 degree",
				value: "degree"
			}]
		}
	],
	grid: [
		{
			key: "rows",
			label: "行数",
			min: 0,
			max: 20,
			step: 1,
			defaultValue: 0,
			zeroAsAuto: true,
			hint: "0 = 按画布宽高比自动算"
		},
		{
			key: "cols",
			label: "列数",
			min: 0,
			max: 20,
			step: 1,
			defaultValue: 0,
			zeroAsAuto: true,
			hint: "0 = 按画布宽高比自动算"
		},
		{
			key: "nodeSpacing",
			label: "节点间距",
			min: 0,
			max: 80,
			step: 2,
			defaultValue: 14,
			unit: "px"
		},
		{
			key: "condense",
			label: "紧凑排列",
			kind: "switch",
			defaultValue: false,
			hint: "开=只用最小画布空间，关=铺满画布"
		}
	],
	radial: [
		{
			key: "unitRadius",
			label: "环间距",
			min: 20,
			max: 300,
			step: 10,
			defaultValue: 100,
			unit: "px"
		},
		{
			key: "linkDistance",
			label: "连线长度",
			min: 20,
			max: 200,
			step: 10,
			defaultValue: 50,
			unit: "px"
		},
		{
			key: "focusNode",
			label: "中心节点",
			kind: "select",
			defaultValue: "",
			fromNodes: true,
			hint: "留空 = 取数据里的第一个节点"
		},
		{
			key: "strictRadial",
			label: "严格同环",
			kind: "switch",
			defaultValue: true,
			hint: "关掉后同环节点可以前后错开，更容易避开重叠"
		}
	],
	mds: [{
		key: "linkDistance",
		label: "连线长度",
		min: 20,
		max: 300,
		step: 10,
		defaultValue: 200,
		unit: "px"
	}],
	dagre: [
		{
			key: "rankdir",
			label: "布局方向",
			kind: "select",
			defaultValue: "TB",
			options: DIRECTION_TB
		},
		{
			key: "nodesep",
			label: "同层间距",
			min: 10,
			max: 200,
			step: 10,
			defaultValue: 40,
			unit: "px"
		},
		{
			key: "ranksep",
			label: "层间距",
			min: 20,
			max: 300,
			step: 10,
			defaultValue: 70,
			unit: "px"
		}
	],
	"antv-dagre": [
		{
			key: "rankdir",
			label: "布局方向",
			kind: "select",
			defaultValue: "TB",
			options: DIRECTION_TB
		},
		{
			key: "nodesep",
			label: "同层间距",
			min: 10,
			max: 200,
			step: 10,
			defaultValue: 40,
			unit: "px"
		},
		{
			key: "ranksep",
			label: "层间距",
			min: 20,
			max: 300,
			step: 10,
			defaultValue: 70,
			unit: "px"
		},
		{
			key: "align",
			label: "节点对齐",
			kind: "select",
			defaultValue: "UL",
			options: [
				{
					label: "左上 UL",
					value: "UL"
				},
				{
					label: "右上 UR",
					value: "UR"
				},
				{
					label: "左下 DL",
					value: "DL"
				},
				{
					label: "右下 DR",
					value: "DR"
				}
			]
		}
	],
	"combo-combined": [
		{
			key: "comboSpacing",
			label: "组间距",
			min: 0,
			max: 200,
			step: 10,
			defaultValue: 30,
			unit: "px",
			hint: "combo 之间的空隙"
		},
		{
			key: "comboPadding",
			label: "组内边距",
			min: 0,
			max: 100,
			step: 5,
			defaultValue: 20,
			unit: "px"
		},
		{
			key: "nodeSpacing",
			label: "节点间距",
			min: 0,
			max: 80,
			step: 2,
			defaultValue: 14,
			unit: "px"
		}
	],
	fishbone: [
		{
			key: "hGap",
			label: "骨头间距",
			min: 40,
			max: 260,
			step: 10,
			defaultValue: 90,
			unit: "px",
			hint: "沿脊柱方向，一级节点之间的距离"
		},
		{
			key: "vGap",
			label: "肋骨长度",
			min: 40,
			max: 200,
			step: 10,
			defaultValue: 70,
			unit: "px"
		},
		{
			key: "root",
			label: "鱼头节点",
			kind: "select",
			defaultValue: "",
			fromNodes: true,
			hint: "留空 = 取度数最大的枢纽节点"
		}
	],
	"compact-box": [
		{
			key: "direction",
			label: "展开方向",
			kind: "select",
			defaultValue: "LR",
			options: DIRECTION_TB,
			hint: "生态树默认横向展开"
		},
		{
			key: "nodeSize",
			label: "节点占位",
			min: 30,
			max: 120,
			step: 4,
			defaultValue: 56,
			unit: "px",
			hint: "参与排版的节点尺寸，要和实际节点差不多大才不会挤"
		},
		{
			key: "getVGap",
			label: "层间距",
			min: 0,
			max: 120,
			step: 4,
			defaultValue: 16,
			unit: "px"
		},
		{
			key: "getHGap",
			label: "兄弟间距",
			min: 0,
			max: 120,
			step: 4,
			defaultValue: 16,
			unit: "px"
		}
	],
	mindmap: [
		{
			key: "direction",
			label: "展开方向",
			kind: "select",
			defaultValue: "H",
			options: [
				{
					label: "左右展开 H",
					value: "H"
				},
				{
					label: "从上到下 TB",
					value: "TB"
				},
				{
					label: "从下到上 BT",
					value: "BT"
				}
			],
			hint: "脑图默认左右对称展开"
		},
		{
			key: "nodeSize",
			label: "节点占位",
			min: 30,
			max: 120,
			step: 4,
			defaultValue: 56,
			unit: "px",
			hint: "参与排版的节点尺寸，要和实际节点差不多大才不会挤"
		},
		{
			key: "getVGap",
			label: "层间距",
			min: 0,
			max: 120,
			step: 4,
			defaultValue: 16,
			unit: "px"
		},
		{
			key: "getHGap",
			label: "兄弟间距",
			min: 0,
			max: 120,
			step: 4,
			defaultValue: 16,
			unit: "px"
		}
	],
	dendrogram: [
		{
			key: "isHorizontal",
			label: "横向展开",
			kind: "switch",
			defaultValue: true,
			hint: "关掉改为纵向"
		},
		{
			key: "nodeSize",
			label: "节点占位",
			min: 30,
			max: 120,
			step: 4,
			defaultValue: 56,
			unit: "px",
			hint: "参与排版的节点尺寸，要和实际节点差不多大才不会挤"
		},
		{
			key: "nodeSep",
			label: "叶子间距",
			min: 0,
			max: 160,
			step: 4,
			defaultValue: 60,
			unit: "px"
		},
		{
			key: "rankSep",
			label: "层间距",
			min: 40,
			max: 400,
			step: 10,
			defaultValue: 160,
			unit: "px"
		}
	],
	indented: [
		{
			key: "direction",
			label: "展开方向",
			kind: "select",
			defaultValue: "LR",
			options: [
				{
					label: "从左到右 LR",
					value: "LR"
				},
				{
					label: "从右到左 RL",
					value: "RL"
				},
				{
					label: "横向 H",
					value: "H"
				}
			]
		},
		{
			key: "nodeSize",
			label: "节点占位",
			min: 30,
			max: 120,
			step: 4,
			defaultValue: 56,
			unit: "px",
			hint: "参与排版的节点尺寸，要和实际节点差不多大才不会挤"
		},
		{
			key: "indent",
			label: "缩进",
			min: 10,
			max: 200,
			step: 5,
			defaultValue: 60,
			unit: "px"
		}
	],
	random: []
};
/** 分组轮廓：两种包裹方式共有的外观参数 */
var GROUP_COMMON_SETTINGS = [{
	key: "fillOpacity",
	label: "填充透明度",
	min: .02,
	max: .5,
	step: .02,
	defaultValue: .14,
	hint: "组的底色浓淡"
}, {
	key: "lineWidth",
	label: "描边粗细",
	min: 0,
	max: 6,
	step: 1,
	defaultValue: 2,
	unit: "px"
}];
/**
* 分组轮廓：按包裹方式区分的参数。
*
* <p>两种轮廓的「胖瘦」由完全不同的机制控制，因此不硬凑同一个字段：</p>
* <ul>
*   <li>bubble-sets：轮廓由等值线场推出来，{@code nodeR1} 决定节点影响半径（越大越鼓）；</li>
*   <li>hull：直接对节点外包多边形做 {@code padding} 外扩，{@code concavity} 决定贴合程度。</li>
* </ul>
*/
var GROUP_TYPE_SETTINGS = {
	bubble: [{
		key: "nodeR1",
		label: "轮廓外扩",
		min: 10,
		max: 220,
		step: 5,
		defaultValue: 90,
		unit: "px",
		hint: "节点影响半径，越大气泡越鼓"
	}],
	hull: [{
		key: "padding",
		label: "轮廓内边距",
		min: 4,
		max: 60,
		step: 2,
		defaultValue: 18,
		unit: "px",
		hint: "轮廓把节点包多紧"
	}, {
		key: "concavity",
		label: "凹度",
		min: 100,
		max: 3e3,
		step: 20,
		defaultValue: 700,
		hint: "最大边长，越大轮廓越平滑（≤ 节点间距才贴形）"
	}]
};
/** 取某分组类型的参数表（不含「不分组」） */
var groupSettingsOf = (groupType) => [...GROUP_TYPE_SETTINGS[groupType] ?? [], ...GROUP_COMMON_SETTINGS];
/** 取某布局的参数表（无配置时返回空数组） */
var settingsOf = (layout) => LAYOUT_SETTINGS[layout] ?? [];
/** 该布局有没有可调参数（面板据此决定是否显示空态说明） */
var hasSettingsOf = (layout) => settingsOf(layout).length > 0;
//#endregion
//#region ../../packages/ui/src/components/ReRelationGraph/index.ts
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
var themed = defineThemeComponent("ReRelationGraph", {
	default: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReRelationGraph/theme/default/ReRelationGraph.vue"),
	koi: () => import("D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReRelationGraph/theme/koi/ReRelationGraph.vue")
});
var component = themed.component;
//#endregion
export { DEFAULT_LAYOUT, GRAPH_PRESETS, GROUP_COMMON_SETTINGS, GROUP_PALETTE, GROUP_TYPE_SETTINGS, GraphToolbar, LAYOUT_OPTIONS, LAYOUT_SETTINGS, TREE_LAYOUTS, applyPreset, component, component as default, groupColorOf, groupSettingsOf, hasSettingsOf, themed as install, isGroupLayout, isTreeLayoutType, presetOf, settingsOf, suggestPreset };
