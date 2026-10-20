import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, T as createStaticVNode, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, xn as shallowRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, S as vShow, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { a as Clipboard, c as Snapline, i as History, l as Graph, n as Export, o as Keyboard, r as MiniMap, s as Selection, t as register } from "./es-B93eErVb.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReButton_default } from "./ReButton-CH6SFZxo.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
//#region ../../packages/ui/src/components/ReFlowGraph/internals/dagRules.ts
/** 只作入边的锚点（连线的目标端） */
var INLET_PORT = "top";
/** 只作出边的锚点（连线的源端） */
var OUTLET_PORT = "bottom";
/**
* 判断一次连线在端口方向上是否合法。
*
* 与官方示例的差别见 engine.ts 文件头：官方用 `validateMagnet` 表达这条规则，但该回调
* 的签名只有 `{cell, view, magnet, e}`，拿不到源/目标方向，物理上表达不了「top 只作入边」。
* 本组件走 `bottom → top` 端口连线，改在能拿到两端端口的 `validateConnection` 上落地。
*
* 端口为 {@code null} 表示落在节点本体（`allowNode` 通道），不属于方向违规，一律放行。
*
* @param sourcePort 连线源端端口名，{@code null} 表示源落在节点本体
* @param targetPort 连线目标端端口名，{@code null} 表示目标落在节点本体
* @return 方向合法返回 {@code true}，否则返回 {@code false}
*/
function isDagTerminalAllowed(sourcePort, targetPort) {
	if (sourcePort === INLET_PORT) return false;
	if (targetPort === OUTLET_PORT) return false;
	return true;
}
/** type → path d */
var FLOW_ICON_PATHS = {
	start: "M9 6l10 6-10 6z",
	end: "M7 7h10v10H7z",
	request: "M12 3a9 9 0 100 18 9 9 0 000-18M3.5 9h17M3.5 15h17M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z",
	link: "M10.5 13.5a4 4 0 005.7 0l2.3-2.3a4 4 0 00-5.7-5.7L11.5 6.8M13.5 10.5a4 4 0 00-5.7 0l-2.3 2.3a4 4 0 005.7 5.7l1.3-1.3",
	extract: "M4 5h16l-6 7v6l-4 2v-8z",
	sql: "M12 4c4.4 0 8 1.2 8 2.8S16.4 9.6 12 9.6 4 8.4 4 6.8 7.6 4 12 4M4 6.8V17c0 1.6 3.6 2.8 8 2.8s8-1.2 8-2.8V6.8M4 11.9c0 1.6 3.6 2.8 8 2.8s8-1.2 8-2.8",
	output: "M12 3.5v9.5m0 0l-3.5-3.5M12 13l3.5-3.5M4.5 16.5V18a2 2 0 002 2h11a2 2 0 002-2v-1.5",
	variable: "M9.5 4.5H8a2 2 0 00-2 2v2.6L4.8 12l1.2 2.9V17.5a2 2 0 002 2h1.5M14.5 4.5H16a2 2 0 012 2v2.6l1.2 2.9-1.2 2.9v2.6a2 2 0 01-2 2h-1.5",
	dedup: "M12 3.2l7 2.8v5.6c0 4.1-2.9 7.4-7 8.8-4.1-1.4-7-4.7-7-8.8V6zM9 11.8l2.2 2.2 4.2-4.4",
	sleep: "M12 4a8 8 0 100 16 8 8 0 000-16M12 7.6V12l3.2 2",
	comment: "M5 5h14v10H9.5L5 19z",
	script: "M9 7L4.6 12 9 17M15 7l4.4 5L15 17",
	process: "M4 6.5h16v11H4zM8.5 12h6.5m0 0l-2.4-2.4M15 12l-2.4 2.4",
	function: "M7.5 19.5c1.9 0 2.4-1.2 2.8-3.9l1.9-9c.3-1.6 1-2.3 2.3-2.3M6 10.5h7M14 14l4.5 4.5m0-4.5L14 18.5",
	notice: "M12 4a5 5 0 00-5 5c0 3.9-1.3 5.3-2 6h14c-.7-.7-2-2.1-2-6a5 5 0 00-5-5zM10 19.2a2 2 0 004 0",
	condition: "M12 3.5L20.5 12 12 20.5 3.5 12z",
	loop: "M7.5 8.5h9a3.5 3.5 0 010 7H9m0 0l2.4-2.4M9 15.5l2.4 2.4M16.5 8.5l-2.4-2.4M16.5 8.5l-2.4 2.4",
	cache: "M12 3.5c4.7 0 8.5 1.4 8.5 3.2S16.7 9.9 12 9.9 3.5 8.5 3.5 6.7 7.3 3.5 12 3.5M3.5 6.7v10.6c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2V6.7M3.5 12c0 1.8 3.8 3.2 8.5 3.2s8.5-1.4 8.5-3.2",
	delay: "M12 3.6a8.4 8.4 0 100 16.8 8.4 8.4 0 000-16.8M12 7.4v.2M12 16.4v.2M9.2 9.2l5.6 5.6m0-5.6l-5.6 5.6"
};
/** 取 path，未命中回退通用图形 */
function resolveFlowIcon(type) {
	return type && FLOW_ICON_PATHS[type] || "M6 5h12a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1zm3 5h6m-6 4h4";
}
//#endregion
//#region ../../packages/ui/src/components/ReFlowGraph/internals/FlowNodeCard.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = ["src"];
var _hoisted_2$1 = {
	key: 1,
	viewBox: "0 0 24 24",
	width: "16",
	height: "16",
	fill: "none",
	stroke: "#fff",
	"stroke-width": "1.8",
	"stroke-linecap": "round",
	"stroke-linejoin": "round",
	"aria-hidden": "true"
};
var _hoisted_3$1 = ["d"];
var _hoisted_4$1 = ["title"];
var _hoisted_5$1 = ["title"];
//#endregion
//#region ../../packages/ui/src/components/ReFlowGraph/internals/FlowNodeCard.vue
var FlowNodeCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "FlowNodeCard",
	props: {
		node: {},
		graph: {}
	},
	setup(__props) {
		/**
		* FlowNodeCard —— 画布节点的卡片体
		*
		* 对应 X6 官方 DAG 示例（https://x6.antv.antgroup.com/examples/showcase/practices/#dag ，
		* 源码 site/examples/showcase/practices/demo/dag.tsx）里的 `AlgoNode`：官方用
		* `@antv/x6-react-shape` 把节点体交给 React 组件渲染，本组件用 Vue 侧的对应物
		* `@antv/x6-vue-shape` 注册，视觉同样是一张 180×36 的横向卡片 —— 白底、1px 描边、
		* 左侧 4px 主色竖条、20×20 图标 + 文本标签。
		*
		* 之所以自己订阅 `change:data` 而不等 vue-shape 重渲：`x6-vue-shape` 是用
		* `createApp` 把本组件挂到 `<foreignObject>` 里的，`node` 只是普通 prop、不是响应式，
		* 且 x6 的 `NodeView.confirmUpdate` 不会因为 `setData` 带上 `vue` action
		* （见 node_modules/@antv/x6-vue-shape/es/view.js 与 x6/es/view/node.js）。
		* 所以 `updateNode()` 改了 label / 颜色 / 图标后，必须靠这里的订阅把新值读进 state，
		* 否则画布上的名字不会跟着变。
		*/
		const props = __props;
		/** 卡片上真正要显示的东西；每次 change:data 整体重算 */
		const state = ref({
			type: "",
			label: "",
			typeLabel: "",
			color: "#4f7cff",
			icon: "",
			image: "",
			strokeColor: "",
			strokeWidth: 1.5
		});
		/** 从节点 data 读出卡片状态 */
		function read() {
			const data = props.node.getData() ?? {};
			return {
				type: data.flowType ?? "default",
				label: data.flowLabel ?? "",
				typeLabel: data.flowTypeLabel ?? "",
				color: data.flowColor || "#4f7cff",
				icon: data.flowIcon || "",
				image: data.flowImage || "",
				strokeColor: data.flowStrokeColor ?? "",
				strokeWidth: data.flowStrokeWidth ?? 1.5
			};
		}
		/** 状态描边只加粗高亮边框，不改变节点白底和图标底色 */
		const cardStyle = computed(() => {
			const style = {};
			if (state.value.strokeColor) {
				style.border = `${state.value.strokeWidth}px solid ${state.value.strokeColor}`;
				style.boxShadow = `0 0 0 1px ${state.value.strokeColor} inset, 0 2px 5px 1px rgba(0, 0, 0, 0.06)`;
			} else style.borderLeftColor = state.value.color;
			return style;
		});
		state.value = read();
		/**
		* 类型标签只在与显示名**不同**时才占位。
		*
		* 调色板里 `typeLabel` 多半就等于新建时的 label（如「HTTP 请求」），照原样再渲染一遍
		* 就是「HTTP 请求  HTTP 请求」的噪声；但用户改名后它又是唯一能看出节点类型的线索，
		* 所以判据是「不相等才显示」，不是「非空才显示」。
		*/
		function kindOf() {
			const s = state.value;
			if (!s.typeLabel || s.typeLabel === s.label) return "";
			return s.typeLabel;
		}
		/** data 变了就把新值读进 state，触发重绘 */
		function sync() {
			const next = read();
			if (next.image !== state.value.image) imageBroken.value = false;
			state.value = next;
		}
		/** 图片 URL 是否已加载失败；失败则回落到 SVG path */
		const imageBroken = ref(false);
		onMounted(() => {
			props.node.on("change:data", sync);
		});
		onBeforeUnmount(() => {
			props.node.off("change:data", sync);
		});
		watch(() => props.node, sync);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: "flow-node-card",
				style: normalizeStyle(cardStyle.value)
			}, [
				createBaseVNode("span", {
					class: "flow-node-icon",
					style: normalizeStyle({ background: state.value.color })
				}, [state.value.image && !imageBroken.value ? (openBlock(), createElementBlock("img", {
					key: 0,
					class: "flow-node-img",
					src: state.value.image,
					alt: "",
					onError: _cache[0] || (_cache[0] = ($event) => imageBroken.value = true)
				}, null, 40, _hoisted_1$1)) : (openBlock(), createElementBlock("svg", _hoisted_2$1, [createBaseVNode("path", { d: state.value.icon }, null, 8, _hoisted_3$1)]))], 4),
				createBaseVNode("span", {
					class: "flow-node-label",
					title: state.value.label
				}, toDisplayString(state.value.label), 9, _hoisted_4$1),
				kindOf() ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: "flow-node-kind",
					title: state.value.type
				}, toDisplayString(kindOf()), 9, _hoisted_5$1)) : createCommentVNode("", true)
			], 4);
		};
	}
}), [["__scopeId", "data-v-178c94f5"]]);
//#endregion
//#region ../../packages/ui/src/components/ReFlowGraph/internals/shapes.ts
/**
* ReFlowGraph 图形注册
*
* 节点按 X6 官方 DAG 示例（https://x6.antv.antgroup.com/examples/showcase/practices/#dag ，
* 源码 site/examples/showcase/practices/demo/dag.tsx）的做法，**节点体交给框架组件渲染**：
* 官方用 `@antv/x6-react-shape` 的 `register()`，本组件用 Vue 侧对应物
* `@antv/x6-vue-shape` 的 `register()`，注册一个 180×36 的横向卡片节点。
*
* 连线仍是自绘 SVG 图形：连线的语义色、虚实、箭头都由 attrs 决定，与节点体无关，
* 交给框架组件反而要额外维护一份 diff 逻辑，收益为负。
*
* 业务差异全部落在 data（flowType / flowLabel / flowColor / flowIcon / flowData）上，
* **新增节点类型无需注册新图形**。
*/
/** 卡片节点图形名（vue-shape 注册出来的 shape） */
var FLOW_NODE_SHAPE = "flow-card";
/** 连线图形名 */
var FLOW_EDGE_SHAPE = "flow-edge";
/** 连线语义色 */
var FLOW_EDGE_COLORS = {
	normal: "#00b96b",
	exception: "#e5484d",
	condition: "#4f7cff",
	else: "#a8b3c0"
};
/**
* 四向磁吸锚点。
*
* 官方 DAG 只注册了 top / bottom 两个组，本组件保留四向：持久化数据里
* `FlowEdge.fromPort` / `toPort` 可能是 left / right（见 types.ts），砍掉这两个组会让
* 已存流程的连线端点落空。四向与「自上而下」的主流程不冲突 —— dagRules 只禁止
* `top` 作源、`bottom` 作目标，left / right 仍然放行。
*/
function flowPortGroups() {
	const circle = {
		r: 4,
		magnet: true,
		stroke: "#4f7cff",
		strokeWidth: 1.5,
		fill: "#ffffff"
	};
	return {
		top: {
			position: "top",
			attrs: { circle }
		},
		right: {
			position: "right",
			attrs: { circle }
		},
		bottom: {
			position: "bottom",
			attrs: { circle }
		},
		left: {
			position: "left",
			attrs: { circle }
		}
	};
}
/**
* 四个端口实例。
*
* @returns 与 {@link flowPortGroups} 一一对应的端口项，id 与组名同名，
*          这样 `data-cell-id` 上的 `port-group` 才能被 dagRules 直接读成方向名
*/
function flowPortItems() {
	return [
		"top",
		"right",
		"bottom",
		"left"
	].map((g) => ({
		group: g,
		id: g
	}));
}
/**
* 判断节点（分支）图形名：一入两出的真菱形，不用卡片矩形冒充。
*
* 刻意标注成 {@link string} 而不是保留字面量类型：X6 的 `registerNode` 有一个
* `<K extends string>(name: K, entity: never[K])` 重载，名字是字面量时 TS 会优先撞上它
* 并报「参数类型不兼容 never」。
*/
var FLOW_DIAMOND_SHAPE = "flow-diamond";
/**
* 默认走菱形的节点类型。
*
* <p>判断类节点在多数流程工具里都是菱形，这个组件此前对所有类型一律用 180×36 卡片，
* 判断节点看起来和「抓取」一样，靠外形分不出「这里要选一条路走」。
* 宿主可用引擎选项 `diamondTypes` 覆盖这份名单。</p>
*/
var DEFAULT_DIAMOND_TYPES = [
	"condition",
	"branch",
	"judge",
	"decision"
];
/** 菱形实际提供的端口：入 = top，出 = right（真）/ bottom（假）。刻意不给 left */
var DIAMOND_PORTS = [
	"top",
	"right",
	"bottom"
];
/** 卡片实际提供的端口：四向 */
var CARD_PORTS = [
	"top",
	"right",
	"bottom",
	"left"
];
/**
* 判断某类型是否该走菱形。
*
* @param type 节点类型标识
* @param diamondTypes 覆盖名单，缺省用 {@link DEFAULT_DIAMOND_TYPES}
* @returns 命中名单返回 {@code true}
*/
function isDiamondType(type, diamondTypes = DEFAULT_DIAMOND_TYPES) {
	return !!type && diamondTypes.includes(type);
}
/**
* 某类型节点该用的图形与尺寸。
*
* <p>引擎每个建节点入口都要过这里，避免「载入存量节点」和「新建节点」两处各写一份
* 判断而漂移 —— 之前单一 `this.nodeShape` 就是这么漂移出问题的。</p>
*
* @param type 节点类型标识
* @param cardShape 卡片图形名（宿主自定义组件形状或内置卡片）
* @param diamondTypes 覆盖名单，缺省用 {@link DEFAULT_DIAMOND_TYPES}
* @returns 图形名、宽高，以及是否菱形（决定要不要走 label 型 attrs）
*/
function flowNodeShapeSpec(type, cardShape, diamondTypes = DEFAULT_DIAMOND_TYPES) {
	if (isDiamondType(type, diamondTypes)) return {
		shape: FLOW_DIAMOND_SHAPE,
		width: 96,
		height: 96,
		diamond: true
	};
	return {
		shape: cardShape,
		width: 180,
		height: 36,
		diamond: false
	};
}
/**
* 菱形的外框路径。
*
* <p>内缩 1px：路径正好压在节点盒边界上时，描边有一半会被视口裁掉。</p>
*
* @param size 边长
* @returns SVG path 的 d 属性
*/
function diamondPath(size) {
	const half = size / 2;
	return `M ${half} 1 L ${size - 1} ${half} L ${half} ${size - 1} L 1 ${half} Z`;
}
/** 菱形的端口组：只有 top / right / bottom 三个锚点 */
function flowDiamondPortGroups() {
	const circle = {
		r: 4,
		magnet: true,
		stroke: "#4f7cff",
		strokeWidth: 1.5,
		fill: "#ffffff"
	};
	return {
		top: {
			position: "top",
			attrs: { circle }
		},
		right: {
			position: "right",
			attrs: { circle }
		},
		bottom: {
			position: "bottom",
			attrs: { circle }
		}
	};
}
/** 菱形的端口实例，id 与组名同名（dagRules 靠这个读方向名） */
function flowDiamondPortItems() {
	return DIAMOND_PORTS.map((g) => ({
		group: g,
		id: g
	}));
}
/**
* 菱形的文字 attrs。
*
* <p>菱形不走 vue-shape 的 foreignObject：卡片那套「图标块 + 单行标签 + 右侧类型角标」
* 塞进菱形必然溢出（上下两角是空的、左右两角是尖的）。改成 SVG text 两行居中，
* 字色字号沿用卡片同一套（FlowNodeCard 的 #4e5969 / #a4abb5），两类节点看上去是一套东西。</p>
*
* @param label 节点名
* @param typeLabel 类型中文名，可为空
* @param color 节点主色，用作描边
* @returns 可直接喂给 `graph.addNode` 的 attrs
*/
function flowDiamondAttrs(label, typeLabel, color) {
	const half = 96 / 2;
	const twoLines = !!typeLabel && typeLabel !== label;
	return {
		body: {
			d: diamondPath(96),
			fill: "#ffffff",
			stroke: color || "#4f7cff",
			strokeWidth: 1.5,
			strokeLinejoin: "round"
		},
		label: {
			x: half,
			y: twoLines ? 40 : half,
			text: label,
			textAnchor: "middle",
			textVerticalAnchor: "middle",
			fontSize: 13,
			fill: "#4e5969"
		},
		typeLabel: {
			x: half,
			y: 58,
			text: twoLines ? typeLabel : "",
			textAnchor: "middle",
			textVerticalAnchor: "middle",
			fontSize: 11,
			fill: "#a4abb5"
		}
	};
}
var registered = false;
/** 自定义节点体形状名的前缀，后面跟序号 */
var FLOW_CUSTOM_NODE_SHAPE = "flow-card-custom";
/**
* 组件 → 已注册的形状名。
*
* 用 WeakMap 而不是模块级变量存「当前的自定义组件」：选形是**每个引擎实例**的事
* （同一页面可以开两个画布，一个用内置卡片、一个用自定义组件），
* 而 X6 的 `Graph.registerNode` 是全局的、同一 shape 名会被后注册的组件顶掉。
* 所以每个组件拿到自己的形状名，谁也不会覆盖谁。
*
* WeakMap 而非 Map：组件被 GC 后条目自动消失，不用手工清。
*/
var customShapes = /* @__PURE__ */ new WeakMap();
/** 形状名序号 */
var customSeq = 0;
/**
* 拿到（必要时注册）某组件对应的节点形状名。
*
* 注册走 `x6-vue-shape` 的 `register`：它内部 `Graph.registerNode(shape, { inherit: 'vue-shape' })`
* 并把 component 记进 `shapeMaps`，节点体挂进 `<foreignObject>`。
* 同一组件重复调用只注册一次（WeakMap 命中即返回），换组件才新增一个形状。
*
* @param component 自定义节点体组件
* @returns 该组件独占的形状名
*/
function ensureCustomShape(component) {
	const hit = customShapes.get(component);
	if (hit) return hit;
	customSeq += 1;
	const shape = `${FLOW_CUSTOM_NODE_SHAPE}-${customSeq}`;
	customShapes.set(component, shape);
	register({
		shape,
		width: 180,
		height: 36,
		component,
		ports: {
			groups: flowPortGroups(),
			items: flowPortItems()
		}
	});
	return shape;
}
/**
* 注册内置卡片节点与连线图形，幂等。
*
* 内置形状只注册一次，且**永不替换** —— 别的引擎实例可能正用着它，
* 就地改会互相污染（同页两个画布的经典故障）。
*
* @param nodeShape 自定义组件对应的形状名；给了则本次建图的节点都用它
* @returns 节点该用的形状名
*/
function ensureFlowRegistered(nodeComponent) {
	const nodeShape = nodeComponent ? ensureCustomShape(nodeComponent) : FLOW_NODE_SHAPE;
	if (registered) return nodeShape;
	registered = true;
	register({
		shape: FLOW_NODE_SHAPE,
		width: 180,
		height: 36,
		component: FlowNodeCard_default,
		ports: {
			groups: flowPortGroups(),
			items: flowPortItems()
		}
	});
	Graph.registerNode(FLOW_DIAMOND_SHAPE, {
		width: 96,
		height: 96,
		markup: [
			{
				tagName: "path",
				selector: "body"
			},
			{
				tagName: "text",
				selector: "label"
			},
			{
				tagName: "text",
				selector: "typeLabel"
			}
		],
		ports: {
			groups: flowDiamondPortGroups(),
			items: flowDiamondPortItems()
		}
	}, true);
	Graph.registerEdge(FLOW_EDGE_SHAPE, {
		inherit: "edge",
		zIndex: 0,
		attrs: {
			line: {
				stroke: FLOW_EDGE_COLORS.normal,
				strokeWidth: 1.8,
				strokeLinecap: "round",
				targetMarker: {
					name: "block",
					width: 9,
					height: 7
				}
			},
			label: {
				fontSize: 11,
				fill: "#86909c"
			}
		},
		router: {
			name: "orth",
			args: { padding: 4 }
		},
		connector: {
			name: "rounded",
			args: { radius: 8 }
		}
	}, true);
	return nodeShape;
}
/**
* 节点 metadata：业务数据挂 data，卡片组件只读 data。
*
* 这里**不再**设 attrs —— 节点体是 Vue 组件，颜色/图标/文字都从 data 取，
* 写了 attrs 也不会被渲染。
*
* @param input 节点的业务输入
* @returns 可直接交给 `graph.addNode` 的节点配置
*/
function buildFlowNodeMetadata(input) {
	const label = input.label;
	const typeLabel = input.typeLabel ?? "";
	const color = input.color || "#4f7cff";
	return {
		id: input.id,
		shape: input.shape ?? "flow-card",
		x: input.x,
		y: input.y,
		width: input.width ?? 180,
		height: input.height ?? 36,
		...input.diamond ? { attrs: flowDiamondAttrs(label, typeLabel, color) } : {},
		data: {
			flowType: input.type,
			flowLabel: label,
			flowTypeLabel: typeLabel,
			flowColor: color,
			flowIcon: input.iconPath || resolveFlowIcon(input.type),
			flowImage: input.image || "",
			flowData: input.data ?? {}
		}
	};
}
/**
* 按两节点的相对位置挑默认端口。
*
* <p>端口默认写死「下→上」是给<b>自上而下</b>的流程图用的。但持久化数据里存在
* <b>横向一排</b>的布局（内置的 GitHub 示例就是 x=60..910、y 全为 180）。
* 横向布局配下→上端口时，连线会从左边卡片「底部」出发、贴着右边卡片的下沿走一段、
* 再拐进它的「顶部」—— 画布上表现为一条贯穿所有卡片底边的绿线，看着像装饰线而不是连接。
* 实测连线 path 为 {@code M 154.75 216 L 342 216 C ... L 350 186.55}，
* 其中 {@code y=216} 正是卡片底边、横线覆盖 x=260..440 整段目标卡片。</p>
*
* <p>所以按几何自动选向：横向为主走 右→左，纵向为主走 下→上。
* 数据里显式写了端口的仍以数据为准 —— 用户手绘的连线端口是 X6 给的，不能被这里覆盖。</p>
*
* @param from   源节点左上角坐标
* @param to     目标节点左上角坐标
* @param fromPort 数据里显式指定的源端口，未指定则为空
* @param toPort   数据里显式指定的目标端口，未指定则为空
* @returns 实际要用的源/目标端口
*/
function pickFlowPorts(from, to, fromPort, toPort, options) {
	const diamondTypes = options?.diamondTypes ?? DEFAULT_DIAMOND_TYPES;
	const fromPorts = isDiamondType(options?.fromType, diamondTypes) ? DIAMOND_PORTS : CARD_PORTS;
	const toPorts = isDiamondType(options?.toType, diamondTypes) ? DIAMOND_PORTS : CARD_PORTS;
	const fw = options?.fromSize?.width ?? 180;
	const fh = options?.fromSize?.height ?? 36;
	const tw = options?.toSize?.width ?? 180;
	const th = options?.toSize?.height ?? 36;
	const dx = to.x + tw / 2 - (from.x + fw / 2);
	const dy = to.y + th / 2 - (from.y + fh / 2);
	const horizontal = Math.abs(dx) >= Math.abs(dy);
	/**
	* 显式端口若该端根本没有，不能照搬。
	*
	* <p>X6 接受任意 port 名，连线照样连上，但锚点落在节点盒子外 —— 表现为
	* 「线接上了却没有连接点」或绕一大圈。所以这里按可用端口夹取，
	* 落空时退回几何首选方向，再落空就用该端第一个端口。</p>
	*/
	const pick = (explicit, preferred, available) => {
		if (explicit && available.includes(explicit)) return explicit;
		return available.includes(preferred) ? preferred : available[0];
	};
	return {
		fromPort: pick(fromPort, horizontal ? "right" : "bottom", fromPorts),
		toPort: pick(toPort, horizontal ? "left" : "top", toPorts)
	};
}
/**
* 连线样式：语义色 + 不传递变量走虚线。
*
* @param kind 连线语义，决定描边色
* @param transfer false 表示「不传递变量」，此时走 `6 4` 虚线
* @returns 可直接喂给 `edge.setAttrs` 的 attrs
*/
function flowEdgeAttrs(kind, transfer) {
	const stroke = FLOW_EDGE_COLORS[kind ?? "normal"];
	return { line: {
		stroke,
		strokeWidth: 1.8,
		strokeLinecap: "round",
		strokeDasharray: transfer === false ? "6 4" : "",
		targetMarker: {
			name: "block",
			width: 9,
			height: 7,
			stroke: "none",
			fill: stroke
		}
	} };
}
/**
* 连线 metadata。
*
* @param input 连线的业务输入
* @returns 可直接交给 `graph.addEdge` 的连线配置
*/
function buildFlowEdgeMetadata(input) {
	return {
		id: input.id,
		shape: FLOW_EDGE_SHAPE,
		source: {
			cell: input.from,
			port: input.fromPort ?? "bottom"
		},
		target: {
			cell: input.to,
			port: input.toPort ?? "top"
		},
		attrs: flowEdgeAttrs(input.kind, input.transfer),
		labels: input.label ? [{
			position: .5,
			attrs: { label: { text: input.label } }
		}] : [],
		data: {
			flowKind: input.kind ?? "normal",
			flowTransfer: input.transfer !== false,
			flowData: input.data ?? {}
		}
	};
}
/**
* 按 type 取节点类型定义，未命中时兜底成一个同名节点。
*
* @param types 调色板的全量类型定义
* @param type 待查的类型标识
* @returns 命中的定义；未命中时返回 `{ type, label: type }`
*/
function resolveFlowType(types, type) {
	return types.find((t) => t.type === type) ?? {
		type: type ?? "default",
		label: type ?? "节点"
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReFlowGraph/internals/engine.ts
/**
* FlowGraphEngine —— ReFlowGraph 的 X6 内核
*
* 面向"流程设计器"（不是图查看器）：横向卡片节点 + 正交彩色连线 + 四向磁吸 +
* 拖拽入板 + 框选 + 辅助线 + 撤销重做 + 就地改名 + 结构自检。
* 观感与交互对齐 X6 官方 DAG 示例，业务差异全部走 data，不注册新图形。
*
* 节点体是 Vue 组件（见 shapes.ts 与 FlowNodeCard.vue），连线仍是自绘 SVG 图形。
* 因此**节点的一切变化都必须落在 data 上**：attrs 里写 `label` / `badge` / `icon`
* 在卡片节点上不会报错也不会生效（没有这几个选择器），是最难查的静默失效。
*
* 画布的连接/框选/高亮/缩放/节点五项配置对齐 X6 官方 DAG 示例
* （https://x6.antv.antgroup.com/examples/showcase/practices/#dag ，源码
* site/examples/showcase/practices/demo/dag.tsx）。有意偏离官方的三处，理由如下：
*
* 1. 官方 `connecting.validateMagnet` 写作 `port-group !== 'top'`，本组件**不照抄**。
*    官方之所以能禁掉 top，是因为它用 `anchor:'center'` + `connectionPoint:'anchor'`，
*    连线端点落在节点中心锚上、**根本不走端口**（端口只参与高亮）；而本组件走
*    `bottom → top` 端口连线，照抄会直接禁掉正常流程的落点，主交互被打断。
*    改在 `validateConnection` 上落地同一语义：`top` 只作入边、`bottom` 只作出边
*    —— 该回调带 `sourcePort`/`targetPort`，能真正区分方向（`validateMagnet` 的
*    签名只有 `{cell, view, magnet, e}`，拿不到方向，物理上表达不了这条规则）。
*    规则本体抽在 dagRules.ts（零 X6 依赖的纯函数），此处只做接线。
* 2. 官方 `panning.eventTypes:['leftMouseDown']`，本组件保留 `modifiers:'space'`。
*    左键已被框选占用，改成左键平移会与 Selection 插件的橡皮筋直接冲突。
* 3. 官方 `Selection` 的 `rubberband` 配 `modifiers:'shift'`，本组件不加修饰键。
*    画布左键唯一职责就是框选（平移走空格），再加一层 shift 等于让"框选"变成
*    用户必须先记住的隐藏手势，对国内流程工具的上手成本不划算。
*/
/**
* 从 X6 事件参数里稳妥取原生 MouseEvent。
*
* X6 各处传的事件包装不一致（有 `originalEvent`、有 `e`），这里统一兜住；
* 兜底构造一个空 MouseEvent 而不是抛错，让上层 `preventDefault?.()` 这类可选调用安全。
*
* @param e X6 事件参数
* @returns 原生 MouseEvent；取不到时返回空事件对象
*/
function nativeEvent(e) {
	const box = e;
	return (box?.originalEvent ?? box?.e) || new MouseEvent("click");
}
/**
* 生成带时间戳的短 id。
*
* @param prefix id 前缀（如 `node` / `edge`）
* @returns 形如 `node-m0abc-x7f2q` 的唯一 id
*/
function uid(prefix) {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
/**
* X6 节点 → 业务 `FlowNode`。
*
* @param cell 画布上的节点
* @returns 业务节点；坐标取整、data 里的显示字段（颜色/图标）不外泄
*/
function readFlowNode(cell) {
	const data = cell.getData() ?? {};
	const pos = cell.getPosition();
	return {
		id: cell.id,
		type: data.flowType ?? "default",
		label: data.flowLabel ?? "",
		x: Math.round(pos.x),
		y: Math.round(pos.y),
		data: data.flowData ?? {}
	};
}
function readFlowEdge(cell) {
	const data = cell.getData() ?? {};
	const source = cell.getSource();
	const target = cell.getTarget();
	const labels = cell.getLabels();
	return {
		id: cell.id,
		from: source.cell ?? "",
		to: target.cell ?? "",
		fromPort: source.port,
		toPort: target.port,
		kind: data.flowKind ?? "normal",
		label: labels[0]?.attrs?.label?.text ?? "",
		transfer: data.flowTransfer !== false,
		data: data.flowData ?? {}
	};
}
/**
* 只读时强制关掉的交互项。
*
* 单独抽成常量而不是内联在构造参数里：构造期与运行期（{@link FlowGraphEngine.setReadonly}）
* 必须是同一份，否则会出现「建图时只读所以拖不动，切回可编辑后仍然拖不动」——
* 两处各写一遍，早晚会对不上。
*
* 刻意**不包含** panning / zoom：只读视图照样要能平移和缩放去看布局，
* 只读限制的是「改内容」，不是「看内容」。
*/
var READONLY_INTERACTING = {
	nodeMovable: false,
	edgeMovable: false,
	edgeLabelMovable: false,
	arrowheadMovable: false,
	vertexMovable: false,
	vertexAddable: false,
	vertexDeletable: false,
	magnetConnectable: false
};
var FlowGraphEngine = class {
	graph;
	opts;
	/** setData 期间抑制 change 事件，避免上层拿到半成品 */
	loading = false;
	types;
	/**
	* 本实例建节点用的形状名。
	*
	* 存成实例字段而不是全局变量：同一页面可以同时开「内置卡片」和「自定义组件」
	* 两个画布，全局状态会让后建的把先建的形状一起换掉（实测会串）。
	*/
	nodeShape;
	/**
	* 走菱形的类型名单。
	*
	* 存成实例字段而不是直接读全局常量：宿主可以只给某一个画布换名单，
	* 同一页面两个画布用不同类型体系时互不影响。
	*/
	diamondTypes;
	/**
	* 非只读状态下宿主要求的 `interacting`。
	*
	* 必须留底：只读是「整体替换」，退出只读时要恢复成宿主当初的意图，
	* 而不是恢复成「全部可拖」—— 宿主传了 `nodeDraggable=false` 就不该被只读切换顶掉。
	* 没被宿主显式设过的键不写进这个对象，交给 X6 走默认值。
	*/
	interactingOn = {};
	/**
	* 框选插件实例。
	*
	* 存成字段不是为了用它的能力，而是为了 {@link togglePanning} 能临时把它关掉 ——
	* 原因见该方法的注释。
	*/
	selection;
	constructor(options) {
		this.nodeShape = ensureFlowRegistered(options.nodeComponent);
		this.diamondTypes = options.diamondTypes ?? DEFAULT_DIAMOND_TYPES;
		this.opts = options;
		this.types = options.nodeTypes ?? [];
		const readonly = !!options.readonly;
		const nodeDraggable = !readonly && options.nodeDraggable !== false;
		this.graph = new Graph({
			container: options.container,
			autoResize: true,
			background: { color: "transparent" },
			grid: options.grid === false ? false : {
				visible: true,
				type: "dot",
				args: [{
					color: "#e9edf2",
					thickness: 1
				}, {
					color: "#f3f6fa",
					thickness: 1,
					factor: 4
				}]
			},
			mousewheel: {
				enabled: options.zoom !== false,
				modifiers: ["ctrl", "meta"],
				factor: 1.1,
				minScale: .5,
				maxScale: 1.5
			},
			panning: {
				enabled: options.panning !== false,
				modifiers: "space"
			},
			connecting: {
				router: {
					name: "orth",
					args: { padding: 28 }
				},
				connector: {
					name: "rounded",
					args: { radius: 8 }
				},
				anchor: "center",
				connectionPoint: "boundary",
				allowBlank: false,
				allowNode: true,
				allowEdge: false,
				allowLoop: false,
				allowMulti: false,
				highlight: true,
				snap: { radius: 24 },
				createEdge() {
					return this.createEdge({
						shape: FLOW_EDGE_SHAPE,
						zIndex: -1,
						attrs: { line: {
							...flowEdgeAttrs("normal", true).line,
							strokeDasharray: "5 5",
							targetMarker: null
						} },
						data: {
							flowKind: "normal",
							flowTransfer: true,
							flowData: {}
						}
					});
				},
				validateConnection: ({ sourceCell, targetCell, sourcePort, targetPort }) => {
					if (!sourceCell || !targetCell || sourceCell === targetCell) return false;
					if (!isDagTerminalAllowed(sourcePort, targetPort)) return false;
					const sourceType = sourceCell.getData()?.flowType;
					if (sourcePort && isDiamondType(sourceType, this.diamondTypes)) {
						if (this.graph.getEdges().some((e) => {
							const src = e.getSource();
							return src?.cell === sourceCell.id && src.port === sourcePort;
						})) return false;
					}
					return true;
				}
			},
			highlighting: {
				magnetAvailable: {
					name: "stroke",
					args: {
						padding: 4,
						attrs: {
							strokeWidth: 1.5,
							stroke: "#4f7cff"
						}
					}
				},
				magnetAdsorbed: {
					name: "stroke",
					args: {
						padding: 4,
						attrs: {
							fill: "#ffffff",
							strokeWidth: 4,
							stroke: "#31d0c6"
						}
					}
				},
				nodeAvailable: {
					name: "stroke",
					args: {
						padding: 4,
						attrs: {
							strokeWidth: 1.5,
							stroke: "#4f7cff"
						}
					}
				}
			},
			interacting: readonly ? { ...READONLY_INTERACTING } : {
				nodeMovable: nodeDraggable,
				edgeMovable: true,
				edgeLabelMovable: true,
				arrowheadMovable: true,
				vertexMovable: true,
				vertexAddable: true,
				vertexDeletable: true,
				magnetConnectable: true
			}
		});
		if (!readonly) this.interactingOn = { nodeMovable: nodeDraggable };
		this.selection = new Selection({
			enabled: true,
			multiple: true,
			rubberband: true,
			rubberNode: true,
			rubberEdge: true,
			showNodeSelectionBox: true,
			pointerEvents: "none"
		});
		this.graph.use(new Snapline({ enabled: true })).use(this.selection).use(new Keyboard({ enabled: true })).use(new Clipboard({ enabled: true })).use(new History({ enabled: true })).use(new Export());
		if (options.minimapContainer) this.graph.use(new MiniMap({
			container: options.minimapContainer,
			width: 184,
			height: 124,
			padding: 8
		}));
		this.bindEvents();
		if (!readonly) this.bindKeys();
		options.handlers?.onReady?.(this);
	}
	/**
	* 挂载画布事件到 handlers 回调。
	*
	* `fire` 同时驱动 `change` 与 `history-change`：两者都从「当前图 + 当前撤销栈」派生，
	* 分成两个监听器会因事件到达顺序不同而短暂不同步。
	*/
	bindEvents() {
		const h = this.opts.handlers ?? {};
		this.graph.on("node:click", ({ node, e }) => {
			h.onNodeClick?.(readFlowNode(node), nativeEvent(e));
		});
		this.graph.on("node:dblclick", ({ node, e }) => {
			h.onNodeDblClick?.(readFlowNode(node), nativeEvent(e));
		});
		this.graph.on("node:contextmenu", ({ node, e }) => {
			const ev = nativeEvent(e);
			ev.preventDefault?.();
			h.onNodeContextMenu?.(readFlowNode(node), ev);
		});
		this.graph.on("edge:contextmenu", ({ edge, e }) => {
			const ev = nativeEvent(e);
			ev.preventDefault?.();
			h.onEdgeContextMenu?.(readFlowEdge(edge), ev);
		});
		this.graph.on("blank:contextmenu", ({ e }) => {
			const ev = nativeEvent(e);
			ev.preventDefault?.();
			h.onBlankContextMenu?.(ev);
		});
		this.graph.on("edge:click", ({ edge, e }) => {
			h.onEdgeClick?.(readFlowEdge(edge), nativeEvent(e));
			this.showEdgeTools(edge.id);
		});
		this.graph.on("blank:click", () => {
			this.graph.cleanSelection();
			this.clearEdgeTools();
		});
		this.graph.on("edge:connected", ({ edge, isNew }) => {
			const data = edge.getData() ?? {};
			edge.setAttrs(flowEdgeAttrs(data.flowKind, data.flowTransfer));
			edge.setZIndex(0);
			if (!isNew) return;
			h.onEdgeConnected?.(readFlowEdge(edge));
			this.showEdgeTools(edge.id);
		});
		this.graph.on("selection:changed", ({ selected }) => {
			const first = selected[0];
			if (!first) {
				h.onSelect?.(null);
				return;
			}
			if (first.isNode()) h.onSelect?.({
				kind: "node",
				node: readFlowNode(first)
			});
			else h.onSelect?.({
				kind: "edge",
				edge: readFlowEdge(first)
			});
		});
		const fire = () => {
			if (this.loading) return;
			h.onChange?.(this.getData());
			h.onHistoryChange?.({
				canUndo: this.canUndo(),
				canRedo: this.canRedo()
			});
		};
		this.graph.on("cell:added", fire);
		this.graph.on("cell:removed", fire);
		this.graph.on("cell:changed", fire);
		this.graph.on("node:moved", fire);
		this.graph.on("history:change", () => {
			if (this.loading) return;
			h.onHistoryChange?.({
				canUndo: this.canUndo(),
				canRedo: this.canRedo()
			});
		});
	}
	/**
	* 绑定画布级快捷键。
	*
	* 只读模式下不绑（构造时已判过），避免只读画布也能被删改。
	* 键位同时给 ctrl 与 meta 两套，兼容 Windows 与 macOS。
	*/
	bindKeys() {
		this.graph.bindKey(["delete", "backspace"], () => this.removeSelected());
		this.graph.bindKey(["ctrl+z", "meta+z"], () => this.undo());
		this.graph.bindKey([
			"ctrl+shift+z",
			"meta+shift+z",
			"ctrl+y"
		], () => this.redo());
		this.graph.bindKey(["ctrl+c", "meta+c"], () => this.copySelected(false));
		this.graph.bindKey(["ctrl+x", "meta+x"], () => this.copySelected(true));
		this.graph.bindKey(["ctrl+v", "meta+v"], () => this.paste());
		this.graph.bindKey(["ctrl+a", "meta+a"], () => {
			this.graph.select(this.graph.getCells());
		});
		this.graph.bindKey("esc", () => {
			this.graph.cleanSelection();
			this.clearEdgeTools();
		});
	}
	/**
	* 运行时改交互开关，prop 变化时由组件调用。
	*
	* 三个开关各有各的官方入口，不能一律改 `options`：
	* - 平移 / 滚轮：走 `togglePanning` / `toggleMouseWheel`，它们直接切插件的
	*   disabled 标志；改 `options` 不生效（`panning.enabled` 只在构造时读一次）。
	* - 节点拖动：`CellView.can('nodeMovable')` **每次**都实时读
	*   `graph.options.interacting`，所以直接改这个对象即可（已在 x6 源码
	*   `src/view/cell.ts` 的 `can()` 里核对过，不是猜的）。
	*
	* 只读一票否决的**只有节点拖动**：`nodeDraggable` 改成 true 也拖不动
	* （由 {@link syncInteracting} 兜）。平移与缩放不受只读限制 ——
	* 「只读但允许挪位置看布局」是真实需求，只读限制的是改内容，不是看内容。
	*
	* @param patch 待改开关；缺省的键保持原值
	*/
	applyInteraction(patch) {
		if (patch.panning != null) this.togglePanning(patch.panning);
		if (patch.zoom != null) this.graph.toggleMouseWheel(patch.zoom);
		if (patch.nodeDraggable != null) {
			this.interactingOn.nodeMovable = patch.nodeDraggable;
			this.syncInteracting();
		}
	}
	/**
	* 运行期开关画布平移，并绕开 X6 2.19.2 的一个上游缺陷。
	*
	* 缺陷（`@antv/x6@2.19.2` 的 `es/graph/panning.js`）：
	* `enablePanning()` / `disablePanning()` 都是**无参**调 `updateClassName()`（第 180/186 行），
	* 而 `updateClassName` 第 91 行 `selection.allowRubberband(e, true)` 直接用这个 `e`，
	* `allowRubberband` 内部 `ModifierKey.isMatch(e, ...)` 会读 `e.altKey` —— `e` 是
	* `undefined`，直接 `TypeError: Cannot read properties of undefined (reading 'altKey')`。
	* 上一行 `allowPanning(e)` 作者自己写了 `e ?? {}` 兜底，可见是漏改。
	*
	* `graph.togglePanning()` 走的正是 `enablePanning/disablePanning`，所以**只要装了框选插件
	* 就必现**（`init()` 里第 21 行那次无参调用不炸，因为那时 selection 还没装上）。
	* 实测在 Playwright 里被 pageerror 抓到，不是推测。
	*
	* 绕法：调用期间把框选关掉。`allowRubberband` 写成
	* `!this.rubberbandDisabled && ModifierKey.isMatch(e, ...)`，`&&` 短路后压根不碰 `e`，
	* 崩点就绕过去了；退出时按原值恢复。用的是公开 API，没去改 `protected` 方法。
	*
	* @param enabled true 表示允许平移
	*/
	togglePanning(enabled) {
		const rubberbandOn = this.selection.isRubberbandEnabled();
		if (rubberbandOn) this.selection.disableRubberband();
		try {
			this.graph.togglePanning(enabled);
		} finally {
			if (rubberbandOn) this.selection.enableRubberband();
		}
	}
	/**
	* 运行时切换只读。
	*
	* 之前 `readonly` 只在构造期生效：组件的 prop 变了但 `opts.readonly` 永远停在
	* 建图那一刻，于是宿主做「查看 / 编辑」切换时画布照样能拖 —— 实测确认过。
	* 这里让 prop 能真正切过来，并在退出只读时按 {@link interactingOn} 恢复。
	*
	* @param readonly true 表示只读
	*/
	setReadonly(readonly) {
		if (this.opts.readonly === readonly) return;
		this.opts.readonly = readonly;
		this.syncInteracting();
	}
	/**
	* 把 `interactingOn` 落到 graph 上；只读时整体换成 {@link READONLY_INTERACTING}。
	*
	* 整体替换而不是逐键改：逐键改会漏 —— 只读要关的是 8 项，逐项维护清单迟早对不上。
	* X6 的默认值等价于 `{}`，所以未设过的键不写进去是安全的。
	*/
	syncInteracting() {
		const movable = !this.opts.readonly && this.interactingOn.nodeMovable !== false;
		this.graph.options.interacting = this.opts.readonly ? { ...READONLY_INTERACTING } : { ...this.interactingOn };
		this.refreshNodeMovableClass(movable);
	}
	/**
	* 补刷节点容器上的 `x6-node-immovable` 类。
	*
	* X6 只在 `NodeView.render()` 里算这个类（`getContainerClassName()` / `empty()`），
	* 改 `interacting` 不会让它重算，于是运行期切只读后节点光标仍是 `move`，
	* 看着像能拖、实际拖不动（这个类唯一的 CSS 作用就是 `.x6-node-immovable{cursor:default}`）。
	*
	* 为什么不用 `view.render()` 重算：X6 没有公开的「只重算类名」入口，
	* `render()` 会 `empty()` 掉容器 —— 对 `vue-shape` 那等于把 Vue 组件的挂载点
	* 从 DOM 上摘下来，节点直接白掉。这里只动这一个类，不碰节点内容。
	*
	* 范围说明：只刷 `node-immovable`，因为只有 `nodeMovable` 是本组件对外暴露的开关
	* （`nodeDraggable`）。只读集里另外 7 项（端口不可连线、顶点不可增删等）没有公开
	* 的类名刷新入口，且它们的类在首次渲染时算的就是只读值，通常不会与本组件冲突。
	*
	* @param movable true 表示节点当前可拖动
	*/
	refreshNodeMovableClass(movable) {
		const cls = this.graph.view.prefixClassName("node-immovable");
		this.graph.getNodes().forEach((node) => {
			const el = this.graph.findViewByCell(node)?.container;
			if (el) el.classList.toggle(cls, !movable);
		});
	}
	/**
	* 用业务数据整体覆盖画布。
	*
	* 先关历史再灌图，避免「载入一次」塞满撤销栈；期间 `loading` 抑制逐 cell 的
	* `change`，只在末尾统一抛一次，避免上层拿到半成品图。
	*
	* @param data 整图数据；`nodes` / `edges` 缺省按空数组处理
	*/
	setData(data) {
		this.loading = true;
		this.graph.disableHistory();
		this.graph.clearCells();
		const positions = /* @__PURE__ */ new Map();
		(data.nodes ?? []).forEach((node) => {
			const def = resolveFlowType(this.types, node.type);
			const x = node.x ?? 0;
			const y = node.y ?? 0;
			const spec = this.shapeSpec(node.type);
			positions.set(node.id, {
				x,
				y,
				type: node.type,
				width: spec.width,
				height: spec.height
			});
			this.graph.addNode(buildFlowNodeMetadata({
				id: node.id,
				type: node.type,
				label: node.label || def.label,
				typeLabel: def.label,
				x,
				y,
				color: def.color ?? "#4f7cff",
				iconPath: def.path,
				image: def.image,
				shape: spec.shape,
				width: spec.width,
				height: spec.height,
				diamond: spec.diamond,
				data: node.data
			}));
		});
		(data.edges ?? []).forEach((edge) => {
			const src = positions.get(edge.from) ?? {
				x: 0,
				y: 0,
				type: "",
				width: 180,
				height: 36
			};
			const dst = positions.get(edge.to) ?? {
				x: 0,
				y: 0,
				type: "",
				width: 180,
				height: 36
			};
			const ports = pickFlowPorts({
				x: src.x,
				y: src.y
			}, {
				x: dst.x,
				y: dst.y
			}, edge.fromPort, edge.toPort, {
				fromType: src.type,
				toType: dst.type,
				diamondTypes: this.diamondTypes,
				fromSize: {
					width: src.width,
					height: src.height
				},
				toSize: {
					width: dst.width,
					height: dst.height
				}
			});
			this.graph.addEdge(buildFlowEdgeMetadata({
				id: edge.id,
				from: edge.from,
				to: edge.to,
				fromPort: ports.fromPort,
				toPort: ports.toPort,
				kind: edge.kind,
				label: edge.label,
				transfer: edge.transfer,
				data: edge.data
			}));
		});
		this.graph.cleanHistory();
		this.graph.enableHistory();
		this.loading = false;
		this.opts.handlers?.onChange?.(this.getData());
	}
	/**
	* 读出当前整图的业务数据。
	*
	* @returns 与 {@link setData} 对称的 `FlowGraphData`（坐标取整、不含 X6 内部字段）
	*/
	getData() {
		return {
			nodes: this.graph.getNodes().map(readFlowNode),
			edges: this.graph.getEdges().map(readFlowEdge)
		};
	}
	/**
	* 调色板落点：拖拽或点击新增一个节点。
	*
	* @param type 节点类型标识，须能在 `nodeTypes` 里查到
	* @param x 可选的画布局部横坐标；缺省时自动找空位
	* @param y 可选的画布局部纵坐标；缺省时自动找空位
	* @returns 新节点的业务数据；只读模式或命中固定类型时返回 null
	*/
	addNode(type, x, y) {
		if (this.opts.readonly) return null;
		const def = resolveFlowType(this.types, type);
		const same = this.graph.getNodes().filter((n) => n.getData()?.flowType === type).length;
		const spec = this.shapeSpec(type);
		const at = x == null || y == null ? this.cascadeSpot({
			width: spec.width,
			height: spec.height
		}) : {
			x,
			y
		};
		const node = this.graph.addNode(buildFlowNodeMetadata({
			id: uid("node"),
			type,
			label: same > 0 ? `${def.label} ${same + 1}` : def.label,
			typeLabel: def.label,
			x: Math.round(at.x - spec.width / 2),
			y: Math.round(at.y - spec.height / 2),
			color: def.color ?? "#4f7cff",
			iconPath: def.path,
			image: def.image,
			shape: spec.shape,
			width: spec.width,
			height: spec.height,
			diamond: spec.diamond,
			data: {}
		}));
		this.selectNode(node.id);
		return readFlowNode(node);
	}
	/**
	* 浏览器 client 坐标 → 画布局部坐标。
	*
	* 调色板的 HTML5 `dragover/drop` 给的是 client 坐标，必须过这一层换算；
	* 注意此时画布可能带平移与缩放，不能直接减容器 offset。
	*
	* @param clientX 浏览器 client 横坐标
	* @param clientY 浏览器 client 纵坐标
	* @returns 对应的画布局部坐标（画布左上角为原点）
	*/
	toLocalPoint(clientX, clientY) {
		const p = this.graph.clientToLocal(clientX, clientY);
		return {
			x: p.x,
			y: p.y
		};
	}
	/**
	* 某类型节点该用的图形与尺寸。
	*
	* 载入存量节点与新建节点都必须走这里 —— 两处各写一份判断必然漂移。
	*
	* @param type 节点类型标识
	* @returns 图形名、宽高与是否菱形
	*/
	shapeSpec(type) {
		return flowNodeShapeSpec(type, this.nodeShape, this.diamondTypes);
	}
	/** 视口中心（新增节点的默认落位） */
	blankCenter() {
		const area = this.graph.getGraphArea();
		return {
			x: area.x + area.width / 2,
			y: area.y + area.height / 2
		};
	}
	/**
	* 从视口中心向外一圈圈找空位，连续点击调色板时节点不会叠成一堆。
	*
	* 环形步长与重叠判据都跟着节点尺寸走：节点从 40×40 变成 180×36 之后，
	* 沿用原来的 180/120 步长会让同环的卡片横向压在一起（180 宽的卡片配 180 步长，
	* 相邻两张刚好首尾相接，看起来像连成一条），而 170/120 的重叠判据对 180 宽的卡片
	* 形同虚设。所以这里按尺寸推导，不再写死魔法数。
	*
	* <p>两种尺寸并存（卡片 180×36 / 菱形 96×96）后判据必须用「两个节点各自的半宽之和」：
	* 仍按卡片尺寸算的话，96 宽的菱形会被判成「不重叠」而压在卡片上。</p>
	*
	* @param size 待放入节点的尺寸，缺省按卡片 180×36
	* @returns 一个不与现有节点重叠的画布局部坐标；8 圈都找不到时退回视口中心
	*/
	cascadeSpot(size) {
		const base = this.blankCenter();
		const w = size?.width ?? 180;
		const h = size?.height ?? 36;
		const taken = this.graph.getNodes().map((node) => {
			const box = node.getBBox();
			return {
				x: box.center.x,
				y: box.center.y,
				width: box.width,
				height: box.height
			};
		});
		const fits = (p) => !taken.some((q) => Math.abs(q.x - p.x) < (q.width + w) / 2 + 24 && Math.abs(q.y - p.y) < (q.height + h) / 2 + 24);
		const stepX = Math.max(180, w) + 60;
		const stepY = Math.max(36, h) + 70;
		for (let ring = 0; ring < 8; ring += 1) {
			const free = (ring === 0 ? [base] : Array.from({ length: 8 }, (_, k) => {
				const angle = Math.PI / 4 * k;
				return {
					x: base.x + Math.cos(angle) * stepX * ring,
					y: base.y + Math.sin(angle) * stepY * ring
				};
			})).find(fits);
			if (free) return free;
		}
		return base;
	}
	/**
	* 局部更新一个节点。
	*
	* 全部字段都写 **data** 而非 attrs：节点体是 Vue 组件（`FlowNodeCard`），
	* 只认 data 里的 flowLabel / flowColor / flowIcon。旧实现往 `attrs.badge.fill`、
	* `attrs.icon.d` 上写，那是自绘 SVG 徽章时代的残留 —— 卡片节点既没有 `badge` 也没有
	* `icon` 选择器，写了不报错也不生效，是最难查的一类静默失效。
	*
	* @param id 节点 id
	* @param patch 待改字段；`label` 改显示名，`color` / `iconPath` 改类型外观，
	*              `image` 传空串表示去掉图片回到 SVG 图标，
	*              `data` 整体替换业务参数
	*/
	updateNode(id, patch) {
		const cell = this.graph.getCellById(id);
		if (!cell?.isNode()) return;
		const node = cell;
		const next = { ...node.getData() ?? {} };
		if (patch.label != null) next.flowLabel = patch.label;
		if (patch.color) next.flowColor = patch.color;
		if (patch.iconPath) next.flowIcon = patch.iconPath;
		if (patch.image != null) next.flowImage = patch.image;
		if (patch.strokeColor != null) next.flowStrokeColor = patch.strokeColor;
		if (patch.strokeWidth != null) next.flowStrokeWidth = patch.strokeWidth;
		if (patch.data) next.flowData = patch.data;
		if (node.shape === "flow-diamond") {
			const body = {};
			if (patch.strokeColor != null) body.stroke = patch.strokeColor;
			if (patch.strokeWidth != null) body.strokeWidth = patch.strokeWidth;
			if (Object.keys(body).length) node.setAttrs({ body });
		}
		node.setData(next);
	}
	/**
	* 局部更新一条连线：改语义色、标签、虚实（是否传递变量）与业务参数。
	*
	* @param id 连线 id
	* @param patch 待改字段；未给的字段沿用线上的既有值
	*/
	updateEdge(id, patch) {
		const cell = this.graph.getCellById(id);
		if (!cell?.isEdge()) return;
		const edge = cell;
		const data = edge.getData() ?? {};
		const kind = patch.kind ?? data.flowKind ?? "normal";
		const transfer = patch.transfer ?? data.flowTransfer ?? true;
		edge.setAttrs(flowEdgeAttrs(kind, transfer));
		edge.setLabels(patch.label ? [{
			position: .5,
			attrs: { label: { text: patch.label } }
		}] : []);
		edge.setData({
			flowKind: kind,
			flowTransfer: transfer,
			flowData: patch.data ?? data.flowData ?? {}
		});
	}
	/**
	* 删除一组节点，连带其出入边；调色板里标了 `fixed` 的类型（如开始节点）受保护。
	*
	* @param ids 待删节点 id 列表
	* @returns 实际从画布上消失的节点数（受保护或本来就不存在的 id 不计入）
	*/
	removeNodes(ids) {
		const cells = [];
		ids.forEach((id) => {
			const cell = this.graph.getCellById(id);
			if (!cell?.isNode()) return;
			const node = cell;
			const type = node.getData()?.flowType;
			if (resolveFlowType(this.types, type).fixed) return;
			cells.push(node, ...this.graph.getConnectedEdges(node));
		});
		if (!cells.length) return 0;
		this.graph.removeCells(cells);
		return ids.filter((id) => !this.graph.getCellById(id)).length;
	}
	/**
	* 删除一组连线。
	*
	* @param ids 待删连线 id 列表
	* @returns 实际从画布上消失的连线数
	*/
	removeEdges(ids) {
		ids.forEach((id) => this.graph.removeCell(id));
		return ids.filter((id) => !this.graph.getCellById(id)).length;
	}
	/**
	* 删除当前选中的节点与连线。
	*
	* @returns 实际删除的节点数 + 连线数
	*/
	removeSelected() {
		const selected = this.graph.getSelectedCells();
		const nodeIds = selected.filter((c) => c.isNode()).map((c) => c.id);
		const edgeIds = selected.filter((c) => c.isEdge()).map((c) => c.id);
		return this.removeNodes(nodeIds) + this.removeEdges(edgeIds);
	}
	/**
	* 复制（或剪切）选中项，节点连同其出入边一起带走。
	*
	* 只带节点不带边的话，粘出来的流程会丢连接关系，属性面板里看到的连线也就对不上。
	*
	* @param cut true 剪切（从画布移除），false 复制
	*/
	copySelected(cut) {
		const cells = this.graph.getSelectedCells();
		if (!cells.length) return;
		const all = [];
		cells.forEach((cell) => {
			all.push(cell);
			if (cell.isNode()) all.push(...this.graph.getConnectedEdges(cell));
		});
		if (cut) this.graph.cut(all);
		else this.graph.copy(all);
	}
	/** 把剪贴板内容粘到画布上并选中；剪贴板为空时什么都不做 */
	paste() {
		if (this.graph.isClipboardEmpty()) return;
		const cells = this.graph.paste({ offset: 24 });
		this.graph.cleanSelection();
		this.graph.select(cells);
	}
	/**
	* 独占选中一个节点。
	*
	* @param id 节点 id；查不到时静默返回
	*/
	selectNode(id) {
		const cell = this.graph.getCellById(id);
		if (!cell) return;
		this.graph.cleanSelection();
		this.graph.select(cell);
	}
	/**
	* 把画布平移到某个节点居中，并顺带选中它。
	*
	* @param id 节点 id；查不到时静默返回
	*/
	focusNode(id) {
		const cell = this.graph.getCellById(id);
		if (!cell) return;
		this.graph.centerCell(cell);
		this.selectNode(id);
	}
	/**
	* 取节点在屏幕上的矩形，供页面里的就地改名浮层定位。
	*
	* @param id 节点 id
	* @returns 屏幕坐标矩形；不是节点或查不到时返回 null
	*/
	nodeClientRect(id) {
		const cell = this.graph.getCellById(id);
		if (!cell?.isNode()) return null;
		const rect = this.graph.coord.localToClientRect(cell.getBBox());
		return {
			left: rect.x,
			top: rect.y,
			width: rect.width,
			height: rect.height
		};
	}
	/**
	* 给一条连线挂上顶点与两端箭头工具（拖端点改走向、双击加折点）。
	*
	* @param id 连线 id；只读模式或不是连线时不挂
	*/
	showEdgeTools(id) {
		this.clearEdgeTools();
		const cell = this.graph.getCellById(id);
		if (!cell?.isEdge() || this.opts.readonly) return;
		cell.addTools([
			{ name: "vertices" },
			{
				name: "source-arrowhead",
				args: { attrs: {
					fill: "#4f7cff",
					stroke: "#ffffff",
					strokeWidth: 1.5
				} }
			},
			{
				name: "target-arrowhead",
				args: { attrs: {
					fill: "#4f7cff",
					stroke: "#ffffff",
					strokeWidth: 1.5
				} }
			}
		]);
	}
	/** 清掉所有连线上的工具（任何新的选中都会先调它，保证同一时刻只有一条线带工具） */
	clearEdgeTools() {
		this.graph.getEdges().forEach((edge) => edge.removeTools());
	}
	/**
	* 按比例缩放画布。
	*
	* 注意走的是 `graph.zoom()`，**不受 `mousewheel.minScale/maxScale` 约束** ——
	* 那两个只管滚轮。工具栏按钮要限幅得自己夹。
	*
	* @param delta 缩放增量，正数放大、负数缩小
	*/
	zoomBy(delta) {
		this.graph.zoom(delta);
	}
	/** 缩放回 1:1 */
	resetZoom() {
		this.graph.zoomTo(1);
	}
	/**
	* 当前缩放比。
	*
	* @returns 画布缩放倍数，1 表示 100%
	*/
	getScale() {
		return this.graph.transform.getZoom();
	}
	/** 缩放到刚好装下全部内容（留 48px 边距，最大放大到 1.2 倍） */
	fit() {
		this.graph.zoomToFit({
			padding: 48,
			maxScale: 1.2
		});
	}
	/** 装下全部内容并居中；空图时不动，避免整张画布被拉到最大倍率 */
	fitCenter() {
		if (!this.graph.getCells().length) return;
		this.fit();
		this.graph.centerContent();
	}
	/**
	* 按拓扑分层重排节点（"整理布局"）。
	*
	* <p><b>为什么需要</b>：节点坐标来自 DSL 或 AI 生成，落库时未必考虑可读性——
	* 见过 x 步进只有 210（卡片宽 180，净间距 30）、y 恒定的一字长蛇形队列，
	* 末尾节点直接溢出画布右边界。「适应画布」只能缩放看全，不能让布局变整齐，
	* 所以这里补一次真正的重排。</p>
	*
	* <p><b>算法</b>：以「入度为 0 的节点」为第 0 层做 BFS，按连线方向分层；
	* 同层节点按各自当前 x 排序（保留用户手工调整的相对顺序），层内垂直居中、
	* 跨层留 {@link TIDY_GAP_X} / {@link TIDY_GAP_Y} 的净间距。有环时兜底把
	* 没能分层的节点顺次追加到最后一层，不会漏排。</p>
	*
	* <p>移动节点同样进 undo 栈，用户可撤销。</p>
	*/
	tidy() {
		const nodes = this.graph.getNodes();
		if (nodes.length < 2) return 0;
		const indegree = /* @__PURE__ */ new Map();
		const outgoing = /* @__PURE__ */ new Map();
		nodes.forEach((node) => {
			indegree.set(node.id, 0);
			outgoing.set(node.id, []);
		});
		this.graph.getEdges().forEach((edge) => {
			const source = edge.getSource();
			const target = edge.getTarget();
			if (!source?.cell || !target?.cell) return;
			const from = String(source.cell);
			const to = String(target.cell);
			if (from === to || !indegree.has(to) || !outgoing.has(from)) return;
			indegree.set(to, (indegree.get(to) ?? 0) + 1);
			outgoing.get(from).push(to);
		});
		const layers = [];
		const depth = /* @__PURE__ */ new Map();
		let frontier = nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0).map((node) => node.id);
		frontier.forEach((id) => depth.set(id, 0));
		while (frontier.length) {
			layers.push(frontier);
			const next = [];
			frontier.forEach((id) => {
				outgoing.get(id)?.forEach((to) => {
					if (depth.has(to)) return;
					depth.set(to, (depth.get(id) ?? 0) + 1);
					next.push(to);
				});
			});
			frontier = next;
		}
		const orphans = nodes.map((node) => node.id).filter((id) => !depth.has(id));
		if (orphans.length) layers.push(orphans);
		const cellOf = new Map(nodes.map((node) => [node.id, node]));
		layers.forEach((layer) => {
			layer.sort((a, b) => (cellOf.get(a)?.position().x ?? 0) - (cellOf.get(b)?.position().x ?? 0));
		});
		const stepX = 240;
		const stepY = 106;
		const anchorX = Math.min(...layers[0].map((id) => cellOf.get(id)?.position().x ?? 0));
		const anchorY = Math.min(...layers[0].map((id) => cellOf.get(id)?.position().y ?? 0));
		this.graph.batchUpdate("tidy", () => {
			layers.forEach((layer, row) => {
				const y = anchorY + row * stepY;
				layer.forEach((id, col) => {
					const node = cellOf.get(id);
					if (!node) return;
					node.position(anchorX + col * stepX, y, { skipHistory: false });
				});
			});
			this.repickEdgePorts();
		});
		const totalW = (Math.max(...layers.map((l) => l.length)) - 1) * stepX + 180;
		const totalH = (layers.length - 1) * stepY + 36;
		const area = this.graph.getGraphArea();
		const scale = this.graph.transform.getZoom() || 1;
		const viewW = area.width * scale;
		const viewH = area.height * scale;
		const fitScale = Math.min(1.2, Math.max(.2, Math.min((viewW - 96) / totalW, (viewH - 96) / totalH)));
		this.graph.zoomTo(fitScale);
		this.graph.centerContent();
		return nodes.length;
	}
	/**
	* 按当前节点坐标重选每条边的出入端口。
	*
	* <p>{@link setData} 建边时调一次 {@link pickFlowPorts}，节点一旦被拖动或重排，
	* 端口就与实际走向脱节。这里复用同一套选向规则重算，改端口不单独记一步撤销——
	* 与 {@link tidy} 的移动合起来算一次操作。</p>
	*/
	repickEdgePorts() {
		const specOf = /* @__PURE__ */ new Map();
		this.graph.getNodes().forEach((node) => {
			const type = node.getData()?.flowType ?? "";
			const spec = this.shapeSpec(type);
			specOf.set(node.id, {
				x: node.position().x,
				y: node.position().y,
				type,
				width: spec.width,
				height: spec.height
			});
		});
		this.graph.getEdges().forEach((edge) => {
			const source = edge.getSource();
			const target = edge.getTarget();
			if (!source?.cell || !target?.cell) return;
			const from = String(source.cell);
			const to = String(target.cell);
			const src = specOf.get(from);
			const dst = specOf.get(to);
			if (!src || !dst) return;
			const ports = pickFlowPorts({
				x: src.x,
				y: src.y
			}, {
				x: dst.x,
				y: dst.y
			}, void 0, void 0, {
				fromType: src.type,
				toType: dst.type,
				diamondTypes: this.diamondTypes,
				fromSize: {
					width: src.width,
					height: src.height
				},
				toSize: {
					width: dst.width,
					height: dst.height
				}
			});
			edge.setSource({
				cell: from,
				port: ports.fromPort
			});
			edge.setTarget({
				cell: to,
				port: ports.toPort
			});
		});
	}
	/** 撤销一步；栈空时静默返回 */
	undo() {
		if (this.graph.canUndo()) this.graph.undo();
	}
	/** 重做一步；栈空时静默返回 */
	redo() {
		if (this.graph.canRedo()) this.graph.redo();
	}
	/**
	* 撤销栈是否可用。
	*
	* @returns 可撤销时为 true
	*/
	canUndo() {
		return this.graph.canUndo();
	}
	/**
	* 重做栈是否可用。
	*
	* @returns 可重做时为 true
	*/
	canRedo() {
		return this.graph.canRedo();
	}
	/**
	* 导出 X6 原生 JSON。
	*
	* 含图形名与 attrs，**不是跨版本稳定的持久化格式**（节点 shape 名会随重构变化，
	* 例如 `flow-node` 改成 `flow-card`）。业务持久化请用 {@link getData}。
	*
	* @returns X6 `graph.toJSON()` 的结果
	*/
	toJSON() {
		return this.graph.toJSON();
	}
	/**
	* 用 X6 原生 JSON 覆盖画布并清空撤销栈。
	*
	* 与 {@link setData} 一样会回抛一次 `change`，同样受 `loading` 抑制，
	* 页面层用内容签名区分「程序灌图」与「用户编辑」。
	*
	* @param json 之前 {@link toJSON} 产出的对象
	*/
	fromJSON(json) {
		this.loading = true;
		this.graph.fromJSON(json);
		this.graph.cleanHistory();
		this.loading = false;
		this.opts.handlers?.onChange?.(this.getData());
	}
	/**
	* 导出 PNG 并触发下载。
	*
	* 节点体在 `<foreignObject>` 里（`x6-vue-shape`），能否光栅化取决于浏览器 ——
	* 本项目验证的 Chromium 能正常画出节点卡片，但历史版本的 Firefox 在把 SVG 当图片
	* 加载时不渲染 `foreignObject`，那种环境下导出的 PNG 会有连线而无节点体。
	*
	* @param filename 下载文件名，默认 `flow.png`
	*/
	exportPNG(filename = "flow.png") {
		this.graph.toPNG((uri) => {
			const a = document.createElement("a");
			a.href = uri;
			a.download = filename;
			a.click();
		}, {
			backgroundColor: "#ffffff",
			padding: 24
		});
	}
	/**
	* 结构自检：唯一开始、末端必须结束、无自环、无悬空/孤立节点。
	*
	* 只给提示、不阻断编辑；**保存与执行前必须以后端 `CollectGraph` 的校验结果为准**。
	*
	* @param startType 开始节点的 type，默认 `start`
	* @param endType 结束节点的 type，默认 `end`
	* @returns 问题列表；空数组表示前端口径上通过
	*/
	checkStructure(startType = "start", endType = "end") {
		const issues = [];
		const { nodes, edges } = this.getData();
		if (!nodes.length) {
			issues.push({
				level: "error",
				code: "NO_START",
				message: "流程为空，请至少添加开始与结束节点"
			});
			return issues;
		}
		const starts = nodes.filter((n) => n.type === startType);
		const ends = nodes.filter((n) => n.type === endType);
		if (starts.length === 0) issues.push({
			level: "error",
			code: "NO_START",
			message: "缺少开始节点"
		});
		if (starts.length > 1) issues.push({
			level: "error",
			code: "MULTI_START",
			message: `只能有一个开始节点，当前 ${starts.length} 个`,
			cellId: starts[1].id
		});
		if (ends.length === 0) issues.push({
			level: "error",
			code: "NO_END",
			message: "缺少结束节点，流程必须结束在「结束」节点"
		});
		if (ends.length > 1) issues.push({
			level: "warning",
			code: "MULTI_END",
			message: `存在 ${ends.length} 个结束节点`
		});
		const outgoing = /* @__PURE__ */ new Map();
		const incoming = /* @__PURE__ */ new Map();
		edges.forEach((e) => {
			outgoing.set(e.from, (outgoing.get(e.from) ?? 0) + 1);
			incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
			if (e.from === e.to) issues.push({
				level: "error",
				code: "SELF_LOOP",
				message: `节点「${e.from}」存在自环连线`,
				cellId: e.from
			});
		});
		nodes.forEach((n) => {
			if (!outgoing.get(n.id) && n.type !== endType) issues.push({
				level: "error",
				code: "DANGLING",
				message: `「${n.label}」没有出边，每条分支都必须收到「结束」节点`,
				cellId: n.id
			});
			if (!incoming.get(n.id) && n.type !== startType && starts.length > 0) issues.push({
				level: "error",
				code: "ISOLATED",
				message: `「${n.label}」没有入边，永远不会被执行`,
				cellId: n.id
			});
		});
		return issues;
	}
	/** 卸载画布：解绑快捷键并释放 X6 全部内部资源 */
	dispose() {
		this.graph.clearKeys?.();
		this.graph.dispose();
	}
};
//#endregion
//#region ../../packages/ui/src/components/ReFlowGraph/theme/default/ReFlowGraph.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "flow-toolbar"
};
var _hoisted_2 = { class: "flow-tb-group" };
var _hoisted_3 = { class: "flow-tb-group" };
var _hoisted_4 = { class: "flow-tb-group" };
var _hoisted_5 = { class: "flow-tb-stat" };
var _hoisted_6 = { class: "flow-tb-group" };
var _hoisted_7 = { class: "flow-main" };
var _hoisted_8 = {
	key: 0,
	class: "flow-palette"
};
var _hoisted_9 = { class: "flow-palette-title" };
var _hoisted_10 = { class: "flow-palette-items" };
var _hoisted_11 = [
	"title",
	"onDragstart",
	"onClick"
];
var _hoisted_12 = { class: "flow-chip-badge" };
var _hoisted_13 = {
	viewBox: "0 0 24 24",
	width: "16",
	height: "16",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "1.7",
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
var _hoisted_14 = ["d"];
var _hoisted_15 = { class: "flow-chip-label" };
var _hoisted_16 = { class: "flow-canvas-wrap" };
var _hoisted_17 = { class: "flow-minimap" };
var _hoisted_18 = {
	key: 0,
	class: "flow-empty"
};
var _hoisted_19 = { class: "flow-props-heading" };
var _hoisted_20 = { class: "flow-props-name" };
var _hoisted_21 = { class: "flow-props-sub" };
var _hoisted_22 = { class: "flow-props-actions" };
var _hoisted_23 = { class: "flow-props-body" };
var _hoisted_24 = { class: "flow-props-foot" };
var _hoisted_25 = { class: "flow-props-stats" };
var _hoisted_26 = { class: "flow-props-stat" };
var _hoisted_27 = { class: "flow-props-stat" };
var _hoisted_28 = {
	class: "flow-props-body flow-props-body--popup",
	style: {
		"max-height": "66vh",
		"overflow": "auto"
	}
};
var _hoisted_29 = {
	key: 1,
	class: "flow-issues"
};
var _hoisted_30 = ["onClick"];
var _hoisted_31 = ["onClick"];
var _hoisted_32 = {
	key: 1,
	class: "flow-menu-head"
};
var PROPS_MIN_WIDTH = 300;
var PROPS_MAX_WIDTH = 640;
//#endregion
//#region ../../packages/ui/src/components/ReFlowGraph/theme/default/ReFlowGraph.vue
var ReFlowGraph_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReFlowGraph",
	__name: "ReFlowGraph",
	props: {
		data: { default: () => ({
			nodes: [],
			edges: []
		}) },
		nodeTypes: { default: () => [] },
		readonly: {
			type: Boolean,
			default: false
		},
		height: { default: "100%" },
		width: { default: "100%" },
		showToolbar: {
			type: Boolean,
			default: true
		},
		showPalette: {
			type: Boolean,
			default: true
		},
		showProperties: {
			type: Boolean,
			default: true
		},
		startType: { default: "start" },
		endType: { default: "end" },
		propertiesTitle: { default: "属性" },
		showMinimap: {
			type: Boolean,
			default: false
		},
		panning: {
			type: Boolean,
			default: true
		},
		zoom: {
			type: Boolean,
			default: true
		},
		nodeDraggable: {
			type: Boolean,
			default: true
		},
		menuItems: {},
		nodeComponent: {}
	},
	emits: [
		"ready",
		"change",
		"select",
		"node-click",
		"node-dblclick",
		"node-contextmenu",
		"edge-contextmenu",
		"blank-contextmenu",
		"edge-click",
		"edge-connected",
		"history-change"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReFlowGraph —— 可视化流程设计器（X6 内核，对齐官方 DAG 实践）
		*
		* 一个页面内完成整条流程：左侧调色板（点击或拖拽入板）→ 画布连磁吸出正交彩线 →
		* 点节点/连线后右侧停靠面板直接编辑参数（表单由 #properties 插槽提供，组件不猜业务）。
		*
		* 节点是 180×36 的横向卡片，节点体由 Vue 组件渲染（`@antv/x6-vue-shape`），
		* 与 X6 官方 DAG 示例用 `@antv/x6-react-shape` 的做法一一对应。
		*
		* 提供能力：撤销重做、框选、复制粘贴、辅助线、就地改名、右键菜单、结构预检、
		* 缩放/适配/网格/小地图、PNG 导出、JSON 导入导出。
		*/
		const props = __props;
		const emit = __emit;
		const canvasRef = ref(null);
		const minimapRef = ref(null);
		const panelRef = ref(null);
		const engine = shallowRef(null);
		const ui = reactive({
			minimap: props.showMinimap,
			grid: true,
			collapsed: false,
			popup: false,
			/** 右侧属性停靠区宽度（px），由左边框热区拖拽调整 */
			propsWidth: 400,
			/** 拖拽调宽过程中为 true：期间关掉宽度过渡，否则面板会「追着鼠标跑」 */
			resizing: false,
			/** 面板是否浮起（脱离右侧停靠）。浮起后可整体拖动到任意位置 */
			floated: false,
			/** 浮起时面板左上角相对外壳的坐标（px） */
			floatX: 0,
			floatY: 0,
			scale: 1,
			canUndo: false,
			canRedo: false,
			nodes: 0,
			edges: 0
		});
		const selection = ref(null);
		/**
		* 选中对象徽标文案（UI 稿面板头胶囊「抽取节点」）：节点给「类型 + 节点」
		* （如 {@code 数据库节点}），连线给「连线」。类型文案从 nodeTypes（宿主 meta）查，
		* 查不到回落 flowType 本身；label 已带「节点」后缀时不再叠字。
		*/
		const selectionBadge = computed(() => {
			const sel = selection.value;
			if (!sel) return "";
			if (sel.kind === "edge") return "连线";
			const label = props.nodeTypes.find((t) => t.type === sel.node.type)?.label ?? sel.node.type;
			return label.endsWith("节点") ? label : `${label}节点`;
		});
		const issues = ref([]);
		const rename = reactive({
			visible: false,
			value: "",
			id: "",
			left: 0,
			top: 0,
			width: 120
		});
		const menu = reactive({
			visible: false,
			x: 0,
			y: 0,
			node: null,
			edge: null,
			event: null
		});
		/**
		* 右键菜单实际渲染的项。
		*
		* 按右键对象分流：连线 → 连线菜单（删除连线 / 定位）；节点 → 节点菜单
		* （重命名 / 定位 / 复制 / 删除）+「添加节点」分组；空白处 → 只有
		* 「添加节点」分组。宿主传 `menuItems` 则整体接管（行为与重构前一致），
		* 传空数组即彻底关掉菜单。
		*/
		const menuItems = computed(() => {
			if (props.menuItems) return props.menuItems;
			if (menu.edge) return [{
				key: "edge-delete",
				label: "删除连线",
				action: "delete-edge",
				danger: true
			}, {
				key: "edge-locate",
				label: "定位",
				action: "locate-edge"
			}];
			const items = [];
			if (menu.node) items.push({
				key: "rename",
				label: "重命名",
				action: "rename"
			}, {
				key: "locate",
				label: "定位",
				action: "locate"
			}, {
				key: "copy",
				label: "复制",
				action: "copy"
			}, {
				key: "delete",
				label: "删除",
				action: "delete",
				danger: true
			});
			if (props.nodeTypes.length) {
				if (items.length) items.push({
					key: "add-sep",
					label: "",
					header: "添加节点"
				});
				const groups = [];
				props.nodeTypes.forEach((t) => {
					const name = t.group ?? "节点";
					let bucket = groups.find((g) => g.name === name);
					if (!bucket) {
						bucket = {
							name,
							items: []
						};
						groups.push(bucket);
					}
					bucket.items.push(t);
				});
				groups.forEach((g) => {
					if (groups.length > 1) items.push({
						key: `add-g-${g.name}`,
						label: g.name,
						header: g.name
					});
					g.items.forEach((t) => {
						items.push({
							key: `add-${t.type}`,
							label: t.label,
							action: "add",
							addType: t.type
						});
					});
				});
			}
			return items;
		});
		/**
		* 右键菜单定位。
		*
		* <p>菜单是 fixed 定位、坐标取右键处（clientX/Y）。贴近右 / 下边缘时
		* 反向展开，避免菜单被视口裁掉一半。高度按项数估算（每项约 30px）。</p>
		*/
		const menuStyle = computed(() => {
			const W = 188;
			const h = menuItems.value.length * 30 + 10;
			let left = menu.x;
			let top = menu.y;
			if (left + W > window.innerWidth - 8) left = Math.max(8, window.innerWidth - W - 8);
			if (top + h > window.innerHeight - 8) top = Math.max(8, window.innerHeight - h - 8);
			return {
				left: `${left}px`,
				top: `${top}px`
			};
		});
		const shellStyle = computed(() => ({
			height: typeof props.height === "number" ? `${props.height}px` : props.height,
			width: typeof props.width === "number" ? `${props.width}px` : props.width
		}));
		/**
		* 属性面板样式。
		*
		* <p>停靠态只有宽度；浮起态换成 absolute 定位的左上角坐标 + 宽度，
		* 由 startPanelDrag 写 floatX/floatY、dockPanel 清回停靠。</p>
		*/
		const panelStyle = computed(() => {
			const width = ui.collapsed ? "40px" : `${ui.propsWidth}px`;
			if (ui.floated) return {
				left: `${ui.floatX}px`,
				top: `${ui.floatY}px`,
				width
			};
			return { width };
		});
		/** 调色板按 group 分段 */
		const palette = computed(() => {
			const groups = [];
			props.nodeTypes.forEach((t) => {
				const name = t.group ?? "节点";
				let bucket = groups.find((g) => g.name === name);
				if (!bucket) {
					bucket = {
						name,
						items: []
					};
					groups.push(bucket);
				}
				bucket.items.push(t);
			});
			return groups;
		});
		function iconOf(t) {
			return t.path ?? resolveFlowIcon(t.type);
		}
		/** 调色板项的主色（CSS 变量） */
		function chipStyle(t) {
			return { "--chip-color": t.color || "#4f7cff" };
		}
		/**
		* 画布结构签名。父级常把 change 事件的数据回写进 props.data，
		* 用它判断是否真的换了一张图，避免自激重载丢掉撤销栈和选中态。
		*/
		function sigOf(d) {
			return JSON.stringify([(d.nodes ?? []).map((n) => [
				n.id,
				n.type,
				n.label,
				n.x,
				n.y
			]), (d.edges ?? []).map((e) => [
				e.id,
				e.from,
				e.to,
				e.kind,
				e.label,
				e.transfer
			])]);
		}
		/**
		* 统计画布上的节点/连线数。
		*
		* <p>引擎实例可以直接传进来，因为引擎是在构造函数末尾回调 {@code onReady} 的——
		* 那时外壳自己的 {@code engine.value} 还没被赋值（赋值要等构造函数返回），
		* 只认 {@code engine.value} 的写法在 onReady 里会整段空转，计数永远停在 0，
		* 空态遮罩还会因此盖住画布、节点点不动（实测）。</p>
		*
		* @param eng 目标引擎；缺省用外壳持有的那个
		*/
		function syncStat(eng = engine.value) {
			if (!eng) return;
			const d = eng.getData();
			ui.nodes = d.nodes.length;
			ui.edges = d.edges.length;
		}
		onMounted(async () => {
			await nextTick();
			if (!canvasRef.value) return;
			engine.value = new FlowGraphEngine({
				container: canvasRef.value,
				minimapContainer: minimapRef.value,
				nodeTypes: props.nodeTypes,
				readonly: props.readonly,
				grid: true,
				panning: props.panning,
				zoom: props.zoom,
				nodeDraggable: props.nodeDraggable,
				nodeComponent: props.nodeComponent,
				handlers: {
					onReady: (eng) => {
						eng.setData(props.data ?? {
							nodes: [],
							edges: []
						});
						applied = sigOf(props.data ?? {
							nodes: [],
							edges: []
						});
						syncStat(eng);
						emit("ready", eng);
						syncStat(eng);
					},
					onSelect: (sel) => {
						selection.value = sel;
						emit("select", sel);
					},
					onChange: (data) => {
						syncStat();
						emit("change", data);
					},
					onNodeClick: (node, ev) => emit("node-click", node, ev),
					onNodeDblClick: (node) => startRename(node.id),
					onNodeContextMenu: (node, ev) => {
						menu.visible = true;
						menu.x = ev.clientX;
						menu.y = ev.clientY;
						menu.node = node;
						menu.edge = null;
						menu.event = ev;
						emit("node-contextmenu", node, ev);
					},
					onEdgeContextMenu: (edge, ev) => {
						menu.visible = true;
						menu.x = ev.clientX;
						menu.y = ev.clientY;
						menu.edge = edge;
						menu.node = null;
						menu.event = ev;
						emit("edge-contextmenu", edge, ev);
					},
					onBlankContextMenu: (ev) => {
						menu.visible = true;
						menu.x = ev.clientX;
						menu.y = ev.clientY;
						menu.node = null;
						menu.edge = null;
						menu.event = ev;
						emit("blank-contextmenu", ev);
					},
					onEdgeClick: (edge, ev) => emit("edge-click", edge, ev),
					onEdgeConnected: (edge) => emit("edge-connected", edge),
					onHistoryChange: (state) => {
						ui.canUndo = state.canUndo;
						ui.canRedo = state.canRedo;
						emit("history-change", state);
					}
				}
			});
		});
		onBeforeUnmount(() => {
			engine.value?.dispose();
			engine.value = null;
		});
		let applied = sigOf({
			nodes: [],
			edges: []
		});
		watch(() => props.data, () => {
			if (!engine.value) return;
			syncStat();
			const next = sigOf(props.data ?? {
				nodes: [],
				edges: []
			});
			if (next === applied) return;
			applied = next;
			engine.value.setData(props.data ?? {
				nodes: [],
				edges: []
			});
			syncStat();
		}, { deep: true });
		watch(() => [
			props.panning,
			props.zoom,
			props.nodeDraggable
		], ([panning, zoom, nodeDraggable]) => {
			engine.value?.applyInteraction({
				panning,
				zoom,
				nodeDraggable
			});
		});
		watch(() => props.readonly, (v) => {
			engine.value?.setReadonly(v);
			engine.value?.applyInteraction({
				panning: props.panning,
				zoom: props.zoom,
				nodeDraggable: props.nodeDraggable
			});
		});
		watch(() => props.showMinimap, (v) => {
			ui.minimap = v;
		});
		function addAtCenter(type) {
			if (engine.value?.addNode(type)) issues.value = [];
		}
		function onDrop(ev) {
			ev.preventDefault();
			const type = ev.dataTransfer?.getData("application/x-flow-type") || ev.dataTransfer?.getData("text/plain");
			if (!type || !engine.value) return;
			const p = engine.value.toLocalPoint(ev.clientX, ev.clientY);
			engine.value.addNode(type, p.x, p.y);
			issues.value = [];
		}
		function allowDragOver(ev) {
			ev.preventDefault();
			if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
		}
		function startRename(id) {
			if (!engine.value) return;
			const rect = engine.value.nodeClientRect(id);
			const node = engine.value.getData().nodes.find((n) => n.id === id);
			if (!rect || !node) return;
			rename.visible = true;
			rename.id = id;
			rename.value = node.label;
			rename.left = rect.left + rect.width / 2 - 70;
			rename.top = rect.top + rect.height + 4;
			rename.width = 140;
			nextTick(() => {
				const el = document.getElementById("flow-rename-input");
				el?.focus();
				el?.select();
			});
		}
		function commitRename() {
			if (rename.visible && engine.value) engine.value.updateNode(rename.id, { label: rename.value.trim() || "未命名" });
			rename.visible = false;
		}
		function cancelRename() {
			rename.visible = false;
		}
		function toggleGrid() {
			ui.grid = !ui.grid;
			if (!engine.value) return;
			if (ui.grid) engine.value.graph.showGrid();
			else engine.value.graph.hideGrid();
		}
		function runCheck() {
			issues.value = engine.value?.checkStructure(props.startType, props.endType) ?? [];
			return issues.value;
		}
		function zoom(delta) {
			engine.value?.zoomBy(delta);
			ui.scale = engine.value?.getScale() ?? 1;
		}
		function fit() {
			engine.value?.fitCenter();
			ui.scale = engine.value?.getScale() ?? 1;
		}
		/**
		* 按拓扑分层重排节点（工具条「整理布局」）。
		*
		* <p>重排会改坐标，因此走 change 事件让宿主把新位置写回 DSL；整理完顺带缩放到能看全。</p>
		*/
		function tidy() {
			engine.value?.tidy();
			ui.scale = engine.value?.getScale() ?? 1;
		}
		function resetZoom() {
			engine.value?.resetZoom();
			ui.scale = 1;
		}
		function copySelected() {
			engine.value?.copySelected(false);
		}
		/**
		* 执行一项右键菜单。
		*
		* 按 `item.action` 分派：节点四项（重命名 / 定位 / 复制 / 删除）、
		* 连线两项（删除连线 / 定位）、添加节点（落点取右键处坐标，添加后
		* 选中并通知宿主打开节点配置）。自定义 `onClick` 同时拿到 node 与
		* edge，随菜单上下文而定。
		*
		* @param item  被点击的菜单项
		* @param event 触发点击的原始鼠标事件，透传给自定义 `onClick`
		*/
		function menuAction(item, event) {
			const node = menu.node;
			const edge = menu.edge;
			menu.visible = false;
			if (item.header) return;
			if (item.disabled) return;
			if (!item.action) {
				item.onClick?.({
					node,
					edge,
					event
				});
				return;
			}
			if (!engine.value) return;
			if (item.action === "add") {
				if (!item.addType || !menu.event) return;
				const p = engine.value.toLocalPoint(menu.event.clientX, menu.event.clientY);
				const created = engine.value.addNode(item.addType, p.x, p.y);
				if (created) {
					engine.value.selectNode(created.id);
					issues.value = [];
					emit("select", {
						kind: "node",
						node: created
					});
				}
				return;
			}
			if (item.action === "delete-edge") {
				if (edge) {
					engine.value.removeEdges([edge.id]);
					syncStat();
				}
				return;
			}
			if (item.action === "locate-edge") {
				if (edge) engine.value.focusNode(edge.to);
				return;
			}
			if (!node) return;
			if (item.action === "rename") startRename(node.id);
			if (item.action === "locate") engine.value.focusNode(node.id);
			if (item.action === "copy") {
				engine.value.selectNode(node.id);
				copySelected();
			}
			if (item.action === "delete") {
				engine.value.removeNodes([node.id]);
				syncStat();
			}
		}
		/** 属性面板宽度下限 / 上限（px） */
		function startResize(ev) {
			ev.preventDefault();
			const startX = ev.clientX;
			const startW = ui.propsWidth;
			const startFloatX = ui.floatX;
			ui.resizing = true;
			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
			const move = (e) => {
				const max = Math.max(PROPS_MIN_WIDTH, Math.min(PROPS_MAX_WIDTH, window.innerWidth - 320));
				const delta = e.clientX - startX;
				const nextW = Math.round(Math.min(max, Math.max(PROPS_MIN_WIDTH, startW - delta)));
				ui.propsWidth = nextW;
				if (ui.floated) {
					const shellW = (panelRef.value?.closest(".flow-shell"))?.getBoundingClientRect().width ?? window.innerWidth;
					const maxX = Math.max(0, shellW - 120);
					ui.floatX = Math.round(Math.min(maxX, Math.max(0, startFloatX + delta)));
				}
			};
			const up = () => {
				ui.resizing = false;
				document.body.style.cursor = "";
				document.body.style.userSelect = "";
				window.removeEventListener("mousemove", move);
				window.removeEventListener("mouseup", up);
			};
			window.addEventListener("mousemove", move);
			window.addEventListener("mouseup", up);
		}
		function closeMenu() {
			menu.visible = false;
		}
		/**
		* 面板整体拖动（浮起模式）。
		*
		* <p>原来面板只有左边框那条 6px 竖边能拖、且只能改宽，整块面板
		* 挪不走 —— 需求是「面板没法整体拖动」。这里在标题栏按下即把面板
		* 从右侧停靠<b>浮起</b>（absolute 定位、脱离 flex 流，画布随之铺满），
		* 之后整块跟手平移；双击标题栏或点图钉按钮复位回停靠位。</p>
		*
		* <p>按在标题栏的按钮上不算拖面板（closest('button') 命中即放行），
		* 否则点「弹窗 / 收起」会被当成拖拽起点。浮起位置钳在外壳内，
		* 不会拖出可视区。</p>
		*
		* @param ev 标题栏上的 mousemove
		*/
		function startPanelDrag(ev) {
			if (ui.collapsed) return;
			if (ev.target.closest("button, input, textarea, select, a, [role='button'], .flow-props-resizer")) return;
			ev.preventDefault();
			const shellRect = (panelRef.value?.closest(".flow-shell"))?.getBoundingClientRect();
			const panelRect = panelRef.value?.getBoundingClientRect();
			if (!shellRect || !panelRect) return;
			const startX = ev.clientX;
			const startY = ev.clientY;
			const startFX = panelRect.left - shellRect.left;
			const startFY = panelRect.top - shellRect.top;
			ui.floated = true;
			ui.floatX = startFX;
			ui.floatY = startFY;
			document.body.style.userSelect = "none";
			const move = (e) => {
				const maxX = Math.max(0, shellRect.width - 120);
				const maxY = Math.max(0, shellRect.height - 80);
				ui.floatX = Math.round(Math.min(maxX, Math.max(0, startFX + (e.clientX - startX))));
				ui.floatY = Math.round(Math.min(maxY, Math.max(0, startFY + (e.clientY - startY))));
			};
			const up = () => {
				document.body.style.userSelect = "";
				window.removeEventListener("mousemove", move);
				window.removeEventListener("mouseup", up);
			};
			window.addEventListener("mousemove", move);
			window.addEventListener("mouseup", up);
		}
		/** 浮起的面板复位回右侧停靠位。 */
		function dockPanel() {
			ui.floated = false;
			ui.floatX = 0;
			ui.floatY = 0;
		}
		onMounted(() => window.addEventListener("click", closeMenu));
		onBeforeUnmount(() => window.removeEventListener("click", closeMenu));
		__expose({
			engine,
			addNode: (type) => engine.value?.addNode(type) ?? null,
			check: runCheck,
			getData: () => engine.value?.getData() ?? {
				nodes: [],
				edges: []
			},
			exportPNG: (name) => engine.value?.exportPNG(name),
			focus: (id) => engine.value?.focusNode(id),
			tidy: () => {
				tidy();
				return engine.value?.getScale() ?? 1;
			},
			fit: () => {
				fit();
				return engine.value?.getScale() ?? 1;
			},
			issues
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: "flow-shell",
				style: normalizeStyle(shellStyle.value)
			}, [
				__props.showToolbar ? (openBlock(), createElementBlock("div", _hoisted_1, [
					createBaseVNode("div", _hoisted_2, [createVNode(ReButton_default, {
						layout: "square",
						icon: "RefreshLeft",
						disabled: !ui.canUndo,
						onClick: _cache[0] || (_cache[0] = ($event) => engine.value?.undo())
					}, {
						default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("撤销", -1)])]),
						_: 1
					}, 8, ["disabled"]), createVNode(ReButton_default, {
						layout: "square",
						icon: "RefreshRight",
						disabled: !ui.canRedo,
						onClick: _cache[1] || (_cache[1] = ($event) => engine.value?.redo())
					}, {
						default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("重做", -1)])]),
						_: 1
					}, 8, ["disabled"])]),
					_cache[22] || (_cache[22] = createBaseVNode("i", { class: "flow-tb-sep" }, null, -1)),
					createBaseVNode("div", _hoisted_3, [
						createVNode(ReButton_default, {
							layout: "square",
							icon: "ZoomIn",
							onClick: _cache[2] || (_cache[2] = ($event) => zoom(.15))
						}, {
							default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("放大", -1)])]),
							_: 1
						}),
						createVNode(ReButton_default, {
							layout: "square",
							icon: "ZoomOut",
							onClick: _cache[3] || (_cache[3] = ($event) => zoom(-.15))
						}, {
							default: withCtx(() => [..._cache[13] || (_cache[13] = [createTextVNode("缩小", -1)])]),
							_: 1
						}),
						createVNode(ReButton_default, {
							layout: "square",
							icon: "Aim",
							onClick: resetZoom
						}, {
							default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("1:1", -1)])]),
							_: 1
						}),
						createVNode(ReButton_default, {
							layout: "square",
							icon: "FullScreen",
							onClick: fit
						}, {
							default: withCtx(() => [..._cache[15] || (_cache[15] = [createTextVNode("适应画布", -1)])]),
							_: 1
						}),
						!__props.readonly ? (openBlock(), createBlock(ReButton_default, {
							key: 0,
							layout: "square",
							icon: "Rank",
							tip: "按连线方向分层重排节点，修正节点挤在一行、间距过窄的问题",
							onClick: tidy
						}, {
							default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("整理布局", -1)])]),
							_: 1
						})) : createCommentVNode("", true)
					]),
					_cache[23] || (_cache[23] = createBaseVNode("i", { class: "flow-tb-sep" }, null, -1)),
					createBaseVNode("div", _hoisted_4, [
						createVNode(ReButton_default, {
							layout: "square",
							icon: "Grid",
							type: ui.grid ? "primary" : "",
							onClick: toggleGrid
						}, {
							default: withCtx(() => [..._cache[17] || (_cache[17] = [createTextVNode("网格", -1)])]),
							_: 1
						}, 8, ["type"]),
						createVNode(ReButton_default, {
							layout: "square",
							icon: "Histogram",
							type: ui.minimap ? "primary" : "",
							onClick: _cache[4] || (_cache[4] = ($event) => ui.minimap = !ui.minimap)
						}, {
							default: withCtx(() => [..._cache[18] || (_cache[18] = [createTextVNode("缩略图", -1)])]),
							_: 1
						}, 8, ["type"]),
						!__props.readonly ? (openBlock(), createBlock(ReButton_default, {
							key: 0,
							layout: "square",
							icon: "CircleCheck",
							onClick: runCheck
						}, {
							default: withCtx(() => [..._cache[19] || (_cache[19] = [createTextVNode("结构校验", -1)])]),
							_: 1
						})) : createCommentVNode("", true)
					]),
					_cache[24] || (_cache[24] = createBaseVNode("div", { class: "flow-tb-spacer" }, null, -1)),
					createBaseVNode("div", _hoisted_5, [
						createBaseVNode("span", null, toDisplayString(ui.nodes) + " 节点", 1),
						_cache[20] || (_cache[20] = createBaseVNode("i", null, "/", -1)),
						createBaseVNode("span", null, toDisplayString(ui.edges) + " 连线", 1),
						_cache[21] || (_cache[21] = createBaseVNode("i", null, "/", -1)),
						createBaseVNode("span", null, toDisplayString(Math.round(ui.scale * 100)) + "%", 1)
					]),
					createBaseVNode("div", _hoisted_6, [renderSlot(_ctx.$slots, "toolbar", { engine: engine.value }, void 0, true)])
				])) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_7, [
					__props.showPalette && !__props.readonly ? (openBlock(), createElementBlock("aside", _hoisted_8, [(openBlock(true), createElementBlock(Fragment, null, renderList(palette.value, (g) => {
						return openBlock(), createElementBlock("div", {
							key: g.name,
							class: "flow-palette-group"
						}, [createBaseVNode("div", _hoisted_9, toDisplayString(g.name), 1), createBaseVNode("div", _hoisted_10, [(openBlock(true), createElementBlock(Fragment, null, renderList(g.items, (t) => {
							return openBlock(), createElementBlock("div", {
								key: t.type,
								class: "flow-chip",
								style: normalizeStyle(chipStyle(t)),
								title: t.tips || t.label,
								draggable: "true",
								onDragstart: ($event) => {
									$event.dataTransfer?.setData("application/x-flow-type", t.type);
									$event.dataTransfer?.setData("text/plain", t.type);
								},
								onClick: ($event) => addAtCenter(t.type)
							}, [createBaseVNode("span", _hoisted_12, [(openBlock(), createElementBlock("svg", _hoisted_13, [createBaseVNode("path", { d: iconOf(t) }, null, 8, _hoisted_14)]))]), createBaseVNode("span", _hoisted_15, toDisplayString(t.label), 1)], 44, _hoisted_11);
						}), 128))])]);
					}), 128))])) : createCommentVNode("", true),
					createBaseVNode("div", _hoisted_16, [
						createBaseVNode("div", {
							ref_key: "canvasRef",
							ref: canvasRef,
							class: "flow-canvas",
							onDragover: allowDragOver,
							onDrop
						}, null, 544),
						withDirectives(createBaseVNode("div", _hoisted_17, [createBaseVNode("div", {
							ref_key: "minimapRef",
							ref: minimapRef
						}, null, 512)], 512), [[vShow, ui.minimap]]),
						!ui.nodes && !__props.readonly ? (openBlock(), createElementBlock("div", _hoisted_18, [..._cache[25] || (_cache[25] = [createBaseVNode("div", { class: "flow-empty-title" }, "从左侧拖入节点开始编排", -1), createBaseVNode("div", { class: "flow-empty-sub" }, "拖动节点边缘的圆点可连线，空格 + 拖拽平移画布，Ctrl + 滚轮缩放", -1)])])) : createCommentVNode("", true)
					]),
					__props.showProperties ? (openBlock(), createElementBlock("section", {
						key: 1,
						ref_key: "panelRef",
						ref: panelRef,
						class: normalizeClass(["flow-props", {
							"is-resizing": ui.resizing,
							"is-collapsed": ui.collapsed,
							"is-floated": ui.floated
						}]),
						style: normalizeStyle(panelStyle.value),
						onMousedown: startPanelDrag
					}, [
						createBaseVNode("span", {
							class: "flow-props-resizer",
							role: "separator",
							"aria-orientation": "vertical",
							title: "拖拽调整面板宽度",
							onMousedown: startResize
						}, null, 32),
						createBaseVNode("header", {
							class: "flow-props-head",
							title: "拖动移动面板，双击复位回右侧",
							onMousedown: startPanelDrag,
							onDblclick: dockPanel
						}, [
							_cache[26] || (_cache[26] = createStaticVNode("<span class=\"flow-props-icon\" data-v-fc2dc7d0><svg viewBox=\"0 0 24 24\" width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" data-v-fc2dc7d0><rect x=\"3\" y=\"5\" width=\"8\" height=\"6\" rx=\"1.5\" data-v-fc2dc7d0></rect><rect x=\"13\" y=\"13\" width=\"8\" height=\"6\" rx=\"1.5\" data-v-fc2dc7d0></rect><path d=\"M11 8h2a2 2 0 0 1 2 2v3\" data-v-fc2dc7d0></path></svg></span>", 1)),
							createBaseVNode("span", _hoisted_19, [createBaseVNode("span", _hoisted_20, toDisplayString(__props.propertiesTitle), 1), createBaseVNode("span", _hoisted_21, [createBaseVNode("i", { class: normalizeClass(["flow-props-dot", { "is-on": !!selection.value }]) }, null, 2), createTextVNode(" " + toDisplayString(selection.value ? selectionBadge.value : "未选中节点"), 1)])]),
							createBaseVNode("span", _hoisted_22, [
								ui.floated ? (openBlock(), createBlock(ReButton_default, {
									key: 0,
									layout: "square",
									icon: "Pin",
									tip: "复位回右侧停靠",
									onClick: dockPanel
								})) : createCommentVNode("", true),
								createVNode(ReButton_default, {
									layout: "square",
									icon: "Grid",
									tip: "弹窗配置（面板被拖窄或收起时用）",
									onClick: _cache[5] || (_cache[5] = ($event) => ui.popup = true)
								}),
								createVNode(ReButton_default, {
									layout: "square",
									icon: ui.collapsed ? "ArrowLeft" : "ArrowRight",
									tip: ui.collapsed ? "展开面板" : "收起面板",
									onClick: _cache[6] || (_cache[6] = ($event) => ui.collapsed = !ui.collapsed)
								}, null, 8, ["icon", "tip"])
							])
						], 32),
						withDirectives(createBaseVNode("div", _hoisted_23, [renderSlot(_ctx.$slots, "properties", {
							selection: selection.value,
							node: selection.value?.kind === "node" ? selection.value.node : null,
							edge: selection.value?.kind === "edge" ? selection.value.edge : null,
							nodeTypes: __props.nodeTypes,
							engine: engine.value
						}, () => [_cache[27] || (_cache[27] = createBaseVNode("div", { class: "flow-props-hint" }, "选中节点或连线后在此编辑参数", -1))], true)], 512), [[vShow, !ui.collapsed]]),
						withDirectives(createBaseVNode("footer", _hoisted_24, [renderSlot(_ctx.$slots, "properties-footer", {
							nodes: ui.nodes,
							edges: ui.edges
						}, () => [_cache[30] || (_cache[30] = createBaseVNode("div", { class: "flow-props-foot-title" }, "本流程概览", -1)), createBaseVNode("div", _hoisted_25, [createBaseVNode("div", _hoisted_26, [createBaseVNode("b", null, toDisplayString(ui.nodes), 1), _cache[28] || (_cache[28] = createBaseVNode("span", null, "流程节点", -1))]), createBaseVNode("div", _hoisted_27, [createBaseVNode("b", null, toDisplayString(ui.edges), 1), _cache[29] || (_cache[29] = createBaseVNode("span", null, "连线", -1))])])], true)], 512), [[vShow, !ui.collapsed]])
					], 38)) : createCommentVNode("", true),
					ui.popup ? (openBlock(), createBlock(unref(component), {
						key: 2,
						modelValue: ui.popup,
						"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => ui.popup = $event),
						title: "节点参数",
						width: "880px",
						"append-to-body": ""
					}, {
						default: withCtx(() => [createBaseVNode("div", _hoisted_28, [renderSlot(_ctx.$slots, "properties", {
							selection: selection.value,
							node: selection.value?.kind === "node" ? selection.value.node : null,
							edge: selection.value?.kind === "edge" ? selection.value.edge : null,
							nodeTypes: __props.nodeTypes,
							engine: engine.value
						}, () => [_cache[31] || (_cache[31] = createBaseVNode("div", { class: "flow-props-hint" }, "选中节点或连线后在此编辑参数", -1))], true)])]),
						_: 3
					}, 8, ["modelValue"])) : createCommentVNode("", true)
				]),
				issues.value.length ? (openBlock(), createElementBlock("div", _hoisted_29, [(openBlock(true), createElementBlock(Fragment, null, renderList(issues.value, (it, i) => {
					return openBlock(), createElementBlock("div", {
						key: i,
						class: normalizeClass(["flow-issue", it.level]),
						onClick: ($event) => it.cellId && engine.value?.focusNode(it.cellId)
					}, toDisplayString(it.message), 11, _hoisted_30);
				}), 128))])) : createCommentVNode("", true),
				rename.visible ? withDirectives((openBlock(), createElementBlock("input", {
					key: 2,
					id: "flow-rename-input",
					"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => rename.value = $event),
					class: "flow-rename",
					style: normalizeStyle({
						left: rename.left + "px",
						top: rename.top + "px",
						width: rename.width + "px"
					}),
					onKeyup: [withKeys(commitRename, ["enter"]), withKeys(cancelRename, ["esc"])],
					onBlur: commitRename
				}, null, 36)), [[vModelText, rename.value]]) : createCommentVNode("", true),
				menu.visible && menuItems.value.length ? (openBlock(), createElementBlock("ul", {
					key: 3,
					class: "flow-menu",
					style: normalizeStyle(menuStyle.value),
					onClick: _cache[9] || (_cache[9] = withModifiers(() => {}, ["stop"]))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(menuItems.value, (item) => {
					return openBlock(), createElementBlock(Fragment, { key: item.key }, [!item.header ? (openBlock(), createElementBlock("li", {
						key: 0,
						class: normalizeClass({
							danger: item.danger,
							disabled: item.disabled
						}),
						onClick: ($event) => menuAction(item, $event)
					}, toDisplayString(item.label), 11, _hoisted_31)) : (openBlock(), createElementBlock("li", _hoisted_32, toDisplayString(item.header), 1))], 64);
				}), 128))], 4)) : createCommentVNode("", true)
			], 4);
		};
	}
}), [["__scopeId", "data-v-fc2dc7d0"]]);
//#endregion
export { ReFlowGraph_default as t };
