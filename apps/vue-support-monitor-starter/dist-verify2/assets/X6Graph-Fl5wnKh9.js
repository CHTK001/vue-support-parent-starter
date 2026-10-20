import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, xn as shallowRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { A as call, C as remove, D as toggleClass, E as removeClass, O as isAsync, S as appendTo, T as hasClass, _ as ensure, a as Clipboard, b as attr, c as Snapline, d as Model, f as Node, g as clean, h as GeometryUtil, i as History, k as toDeferredBoolean, l as Graph, m as Rectangle, n as Export, o as Keyboard, p as View, r as MiniMap, s as Selection, t as register, u as Edge, v as offset, w as addClass, x as append, y as css } from "./es-B93eErVb.js";
import { t as debounce } from "./debounce-DfrQLO3V.js";
import { $ as full_screen_default, Bt as search_default, D as connection_default, Dt as position_default, I as delete_default, K as expand_default, Nt as refresh_default, U as download_default, Z as folder_default, a as arrow_right_default, ft as lock_default, hn as zoom_out_default, i as arrow_left_default, mn as zoom_in_default, nn as unlock_default, rn as upload_default, rt as histogram_default } from "./dist-DogtK295.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { a as ReGraphMode, c as simulation_default, d as constant_default, f as center_default, l as link_default, n as buildFinalData, o as normalizeReGraphMode, s as manyBody_default, t as buildContainerStyle, u as jiggle_default } from "./internals-C4HpkYaV.js";
import { t as quadtree } from "./quadtree-DbdpW_fl.js";
//#region ../../node_modules/.pnpm/d3-force@3.0.0/node_modules/d3-force/src/collide.js
function x(d) {
	return d.x + d.vx;
}
function y(d) {
	return d.y + d.vy;
}
function collide_default(radius) {
	var nodes, radii, random, strength = 1, iterations = 1;
	if (typeof radius !== "function") radius = constant_default(radius == null ? 1 : +radius);
	function force() {
		var i, n = nodes.length, tree, node, xi, yi, ri, ri2;
		for (var k = 0; k < iterations; ++k) {
			tree = quadtree(nodes, x, y).visitAfter(prepare);
			for (i = 0; i < n; ++i) {
				node = nodes[i];
				ri = radii[node.index], ri2 = ri * ri;
				xi = node.x + node.vx;
				yi = node.y + node.vy;
				tree.visit(apply);
			}
		}
		function apply(quad, x0, y0, x1, y1) {
			var data = quad.data, rj = quad.r, r = ri + rj;
			if (data) {
				if (data.index > node.index) {
					var x = xi - data.x - data.vx, y = yi - data.y - data.vy, l = x * x + y * y;
					if (l < r * r) {
						if (x === 0) x = jiggle_default(random), l += x * x;
						if (y === 0) y = jiggle_default(random), l += y * y;
						l = (r - (l = Math.sqrt(l))) / l * strength;
						node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
						node.vy += (y *= l) * r;
						data.vx -= x * (r = 1 - r);
						data.vy -= y * r;
					}
				}
				return;
			}
			return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
		}
	}
	function prepare(quad) {
		if (quad.data) return quad.r = radii[quad.data.index];
		for (var i = quad.r = 0; i < 4; ++i) if (quad[i] && quad[i].r > quad.r) quad.r = quad[i].r;
	}
	function initialize() {
		if (!nodes) return;
		var i, n = nodes.length, node;
		radii = new Array(n);
		for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
	}
	force.initialize = function(_nodes, _random) {
		nodes = _nodes;
		random = _random;
		initialize();
	};
	force.iterations = function(_) {
		return arguments.length ? (iterations = +_, force) : iterations;
	};
	force.strength = function(_) {
		return arguments.length ? (strength = +_, force) : strength;
	};
	force.radius = function(_) {
		return arguments.length ? (radius = typeof _ === "function" ? _ : constant_default(+_), initialize(), force) : radius;
	};
	return force;
}
//#endregion
//#region ../../packages/ui/src/components/ReGraph/internals/x6/nodeTypes.ts
/** 默认调色板节点类型（start / llm / knowledge / tool / condition / ...） */
var DEFAULT_NODE_TYPES = [
	{
		type: "start",
		label: "开始",
		icon: "▶",
		color: "#52c41a"
	},
	{
		type: "end",
		label: "结束",
		icon: "■",
		color: "#ff4d4f"
	},
	{
		type: "llm",
		label: "大模型",
		icon: "✦",
		color: "#1677ff"
	},
	{
		type: "knowledge",
		label: "知识库",
		icon: "❖",
		color: "#13c2c2"
	},
	{
		type: "tool",
		label: "工具",
		icon: "⚙",
		color: "#fa8c16"
	},
	{
		type: "condition",
		label: "条件",
		icon: "?",
		color: "#722ed1"
	},
	{
		type: "code",
		label: "代码",
		icon: "›_",
		color: "#2f54eb"
	},
	{
		type: "http",
		label: "HTTP",
		icon: "⇄",
		color: "#eb2f96"
	},
	{
		type: "input",
		label: "输入",
		icon: "↓",
		color: "#16a34a"
	},
	{
		type: "output",
		label: "输出",
		icon: "↑",
		color: "#d97706"
	}
];
var TYPE_MAP = new Map(DEFAULT_NODE_TYPES.map((t) => [t.type, t]));
/** 获取某类型的样式定义，未命中回退 default */
function resolveNodeType(type) {
	if (type && TYPE_MAP.has(type)) return TYPE_MAP.get(type);
	return {
		type: "default",
		label: "节点",
		icon: "●",
		color: "#5b8ff9"
	};
}
/** 锚点名称集合（与 register.ts 中 ports 组名对应） */
var PORT_GROUPS = [
	"top",
	"right",
	"bottom",
	"left"
];
//#endregion
//#region ../../packages/ui/src/components/ReGraph/internals/x6/nodes/BaseNode.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "gn__badge" };
var _hoisted_2$1 = { class: "gn__body" };
var _hoisted_3$1 = { class: "gn__title" };
var _hoisted_4$1 = {
	key: 0,
	class: "gn__sub"
};
//#endregion
//#region ../../packages/ui/src/components/ReGraph/internals/x6/nodes/BaseNode.vue
var BaseNode_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "BaseNode",
	props: {
		type: {},
		text: {},
		subtitle: {},
		color: {},
		icon: {},
		active: { type: Boolean }
	},
	setup(__props) {
		/**
		* BaseNode —— 所有 X6 Vue 节点的共享视觉外壳
		*
		* 每个图形（start / llm / knowledge / ...）都是一个独立 SFC，组合本组件并传入
		* 自己的 icon / color / subtitle，实现「不同图形不同属性配置」。
		*/
		const props = __props;
		const def = computed(() => resolveNodeType(props.type));
		const color = computed(() => props.color ?? def.value.color);
		const icon = computed(() => props.icon ?? def.value.icon);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(["gn", { "gn--active": __props.active }]),
				style: normalizeStyle({ "--gn-color": color.value })
			}, [createBaseVNode("div", _hoisted_1$1, toDisplayString(icon.value), 1), createBaseVNode("div", _hoisted_2$1, [createBaseVNode("div", _hoisted_3$1, toDisplayString(__props.text || def.value.label), 1), __props.subtitle ? (openBlock(), createElementBlock("div", _hoisted_4$1, toDisplayString(__props.subtitle), 1)) : createCommentVNode("", true)])], 6);
		};
	}
}), [["__scopeId", "data-v-982c67be"]]);
//#endregion
//#region ../../packages/ui/src/components/ReGraph/internals/x6/register.ts
/**
* X6 节点 / 连线形状注册
*
* 每个节点类型（start / llm / knowledge / tool / condition / ...）都注册为一个
* 独立的 Vue 形状（基于 @antv/x6-vue-shape），渲染各自的 SFC 组件，拥有独立属性配置。
* 连线为带箭头的有向边 `re-graph-edge`。
*/
/** 类型 → Vue 组件映射（每个图形一个独立组件） */
var NODE_COMPONENTS = {
	start: /* @__PURE__ */ defineComponent({
		__name: "StartNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "start",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: data.value.trigger ? "触发：" + data.value.trigger : "流程起点"
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	end: /* @__PURE__ */ defineComponent({
		__name: "EndNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "end",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: data.value.status ? "状态：" + data.value.status : "流程终点"
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	llm: /* @__PURE__ */ defineComponent({
		__name: "LlmNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "llm",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: "模型 " + (data.value.model || "gpt") + " · T=" + (data.value.temperature ?? .7)
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	knowledge: /* @__PURE__ */ defineComponent({
		__name: "KnowledgeNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "knowledge",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: "知识库 " + (data.value.dataset || "default")
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	tool: /* @__PURE__ */ defineComponent({
		__name: "ToolNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "tool",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: "工具 " + (data.value.tool || "—")
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	condition: /* @__PURE__ */ defineComponent({
		__name: "ConditionNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "condition",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: data.value.expression ? "IF " + data.value.expression : "条件分支"
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	code: /* @__PURE__ */ defineComponent({
		__name: "CodeNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "code",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: "语言 " + (data.value.lang || "python")
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	http: /* @__PURE__ */ defineComponent({
		__name: "HttpNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "http",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: (data.value.method || "GET") + " " + (data.value.url || "—")
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	input: /* @__PURE__ */ defineComponent({
		__name: "InputNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "input",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: data.value.source ? "来源 " + data.value.source : "输入节点"
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	output: /* @__PURE__ */ defineComponent({
		__name: "OutputNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: "output",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: data.value.target ? "去向 " + data.value.target : "输出节点"
				}, null, 8, [
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	}),
	default: /* @__PURE__ */ defineComponent({
		__name: "DefaultNode",
		props: {
			node: {},
			graph: {}
		},
		setup(__props) {
			const props = __props;
			const data = computed(() => props.node?.getData?.() ?? {});
			return (_ctx, _cache) => {
				return openBlock(), createBlock(BaseNode_default, {
					type: data.value.reType || "default",
					text: data.value.reText,
					color: data.value.reColor,
					icon: data.value.reIcon,
					subtitle: data.value.desc || ""
				}, null, 8, [
					"type",
					"text",
					"color",
					"icon",
					"subtitle"
				]);
			};
		}
	})
};
var registered = false;
/** 端口组定义（锚点） */
function portGroups() {
	const portAttrs = { circle: {
		r: 4,
		magnet: true,
		stroke: "#5b8ff9",
		strokeWidth: 1,
		fill: "#fff",
		style: { visibility: "visible" }
	} };
	return {
		top: {
			position: "top",
			attrs: portAttrs
		},
		right: {
			position: "right",
			attrs: portAttrs
		},
		bottom: {
			position: "bottom",
			attrs: portAttrs
		},
		left: {
			position: "left",
			attrs: portAttrs
		}
	};
}
/** 注册所有 Vue 节点形状（按类型）与连线形状，幂等 */
function ensureRegistered(extra = []) {
	if (registered) return;
	registered = true;
	const overrides = new Map(extra.map((e) => [e.type, e]));
	Object.entries(NODE_COMPONENTS).forEach(([type, component]) => {
		const ov = overrides.get(type);
		const comp = ov && ov.component || component;
		register({
			shape: `re-graph-node-${type}`,
			component: comp,
			width: 180,
			height: 44,
			ports: {
				groups: portGroups(),
				items: PORT_GROUPS.map((g) => ({
					group: g,
					id: g
				}))
			}
		});
	});
	Graph.registerEdge("re-graph-edge", {
		inherit: "edge",
		attrs: { line: {
			stroke: "#8c8c8c",
			strokeWidth: 1.5,
			targetMarker: {
				name: "block",
				width: 10,
				height: 8
			}
		} },
		router: { name: "manhattan" },
		connector: { name: "rounded" },
		zIndex: 0
	}, true);
}
/** 生成节点 metadata（shape 由类型决定，业务数据挂在 data 上供 Vue 组件读取） */
function buildNodeMetadata(node) {
	const def = resolveNodeType(node.type);
	return {
		shape: `re-graph-node-${def.type}`,
		id: node.id,
		x: node.x ?? 0,
		y: node.y ?? 0,
		width: node.width ?? 180,
		height: node.height ?? 44,
		ports: {
			groups: portGroups(),
			items: PORT_GROUPS.map((g) => ({
				group: g,
				id: g
			}))
		},
		data: {
			reType: node.type ?? def.type,
			reText: node.text,
			reData: node.data ?? {},
			reColor: node.color,
			reIcon: node.icon,
			locked: node.locked ?? false,
			hidden: node.hidden ?? false
		}
	};
}
/** 生成连线 metadata（支持每种图形的 router / connector 差异） */
function buildEdgeMetadata(edge, opts) {
	const fromPort = edge.fromPort ?? "bottom";
	const toPort = edge.toPort ?? "top";
	const line = {
		stroke: "#8c8c8c",
		strokeWidth: 1.5,
		targetMarker: {
			name: "block",
			width: 10,
			height: 8
		},
		...(edge.style ?? {}).line ?? {}
	};
	return {
		shape: "re-graph-edge",
		id: edge.id,
		source: {
			cell: edge.from,
			port: fromPort
		},
		target: {
			cell: edge.to,
			port: toPort
		},
		attrs: { line },
		router: { name: opts?.router ?? "manhattan" },
		connector: { name: opts?.connector ?? "rounded" },
		labels: edge.text ? [{ attrs: { label: { text: edge.text } } }] : [],
		data: {
			reData: edge.data ?? {},
			animated: !!edge.animated
		}
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReGraph/internals/x6/layout.ts
/**
* 布局算法
*
* 与原 ReGraph 的 mode 对齐：force / tree / mind / circle / center / fixed / relation。
* force 使用 d3-force（已为项目依赖）；其余为确定性几何布局，避免额外依赖与异步不确定性。
*/
var NODE_W = 180;
var NODE_H = 44;
/** 构建有向父子关系（from → to 视为父 → 子） */
function buildChildren(nodes, edges) {
	const children = /* @__PURE__ */ new Map();
	nodes.forEach((n) => children.set(n.id, []));
	edges.forEach((e) => {
		if (!children.has(e.from)) children.set(e.from, []);
		if (children.has(e.to)) children.get(e.from).push(e.to);
	});
	return children;
}
/** 找根节点：优先 rootId，否则入度为 0 的首个，否则首个节点 */
function findRoot(data) {
	if (data.rootId && data.nodes.some((n) => n.id === data.rootId)) return data.rootId;
	const hasIncoming = new Set(data.edges.map((e) => e.to));
	return data.nodes.find((n) => !hasIncoming.has(n.id))?.id;
}
/** 力导向布局（d3-force，同步跑满 tick） */
function forceLayout(data, width = 800, height = 600) {
	const simNodes = data.nodes.map((n) => ({
		id: n.id,
		x: n.x ?? Math.random() * width,
		y: n.y ?? Math.random() * height
	}));
	const simLinks = data.edges.filter((e) => e.from && e.to).map((e) => ({
		source: e.from,
		target: e.to
	}));
	const sim = simulation_default(simNodes).force("link", link_default(simLinks).id((d) => d.id).distance(140).strength(.5)).force("charge", manyBody_default().strength(-400)).force("center", center_default(width / 2, height / 2)).force("collide", collide_default(80)).stop();
	for (let i = 0; i < 300; i++) sim.tick();
	const pos = {};
	simNodes.forEach((n) => {
		pos[n.id] = {
			x: Math.round(n.x - NODE_W / 2),
			y: Math.round(n.y - NODE_H / 2)
		};
	});
	return pos;
}
/** 层级树布局（自上而下） */
function treeLayout(data) {
	return layeredLayout(data, "TB");
}
/** 思维导图布局（自左向右，双分支） */
function mindLayout(data) {
	return layeredLayout(data, "LR");
}
function layeredLayout(data, dir) {
	const children = buildChildren(data.nodes, data.edges);
	const root = findRoot(data);
	const pos = {};
	const levelGap = dir === "TB" ? 110 : 240;
	const nodeGap = dir === "TB" ? 70 : 56;
	const depth = /* @__PURE__ */ new Map();
	const visited = /* @__PURE__ */ new Set();
	const queue = root ? [{
		id: root,
		d: 0
	}] : [];
	while (queue.length) {
		const { id, d } = queue.shift();
		if (visited.has(id)) continue;
		visited.add(id);
		depth.set(id, d);
		(children.get(id) ?? []).forEach((c) => queue.push({
			id: c,
			d: d + 1
		}));
	}
	let maxDepth = 0;
	depth.forEach((d) => maxDepth = Math.max(maxDepth, d));
	data.nodes.forEach((n) => {
		if (!depth.has(n.id)) {
			maxDepth += 1;
			depth.set(n.id, maxDepth);
		}
	});
	const byLevel = /* @__PURE__ */ new Map();
	depth.forEach((d, id) => {
		if (!byLevel.has(d)) byLevel.set(d, []);
		byLevel.get(d).push(id);
	});
	byLevel.forEach((ids, d) => {
		const total = (ids.length - 1) * nodeGap;
		ids.forEach((id, i) => {
			const offset = -total / 2 + i * nodeGap;
			pos[id] = dir === "TB" ? {
				x: Math.round(offset),
				y: Math.round(d * levelGap)
			} : {
				x: Math.round(d * levelGap),
				y: Math.round(offset)
			};
		});
	});
	return pos;
}
/** 环形布局 */
function circleLayout(data) {
	const n = data.nodes.length || 1;
	const radius = Math.max(160, n * 28);
	const pos = {};
	data.nodes.forEach((node, i) => {
		const angle = i / n * Math.PI * 2 - Math.PI / 2;
		pos[node.id] = {
			x: Math.round(radius * Math.cos(angle)),
			y: Math.round(radius * Math.sin(angle))
		};
	});
	return pos;
}
/** 中心放射布局（root 居中，其余按 BFS 距离成环） */
function centerLayout(data) {
	const root = findRoot(data);
	const children = buildChildren(data.nodes, data.edges);
	const pos = {};
	if (root) pos[root] = {
		x: 0,
		y: 0
	};
	const rings = [];
	const visited = new Set(root ? [root] : []);
	let frontier = root ? [root] : [];
	while (frontier.length) {
		const next = [];
		frontier.forEach((id) => (children.get(id) ?? []).forEach((c) => {
			if (!visited.has(c)) {
				visited.add(c);
				next.push(c);
			}
		}));
		if (next.length) rings.push(next);
		frontier = next;
	}
	const orphans = data.nodes.map((n) => n.id).filter((id) => !visited.has(id));
	if (orphans.length) rings.push(orphans);
	rings.forEach((ring, r) => {
		const radius = (r + 1) * 170;
		ring.forEach((id, i) => {
			const angle = i / ring.length * Math.PI * 2 - Math.PI / 2;
			pos[id] = {
				x: Math.round(radius * Math.cos(angle)),
				y: Math.round(radius * Math.sin(angle))
			};
		});
	});
	return pos;
}
/** 固定布局（使用节点自带 x/y，缺省随机散布） */
function fixedLayout(data) {
	const pos = {};
	data.nodes.forEach((n, i) => {
		pos[n.id] = {
			x: n.x ?? (i % 6 - 3) * 220,
			y: n.y ?? (Math.floor(i / 6) - 3) * 120
		};
	});
	return pos;
}
/** 按 mode 计算全部节点坐标 */
function computeLayout(mode, data, width, height) {
	switch (mode) {
		case "force": return forceLayout(data, width, height);
		case "mind": return mindLayout(data);
		case "tree": return treeLayout(data);
		case "circle": return circleLayout(data);
		case "center":
		case "relation": return centerLayout(data);
		default: return fixedLayout(data);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-dnd@2.1.1_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-dnd/es/style/raw.js
/**
* Auto generated file, do not modify it!
*/
var content$1 = `.x6-widget-dnd {
  position: absolute;
  top: -10000px;
  left: -10000px;
  z-index: 999999;
  display: none;
  cursor: move;
  opacity: 0.7;
  pointer-events: 'cursor';
}
.x6-widget-dnd.dragging {
  display: inline-block;
}
.x6-widget-dnd.dragging * {
  pointer-events: none !important;
}
.x6-widget-dnd .x6-graph {
  background: transparent;
  box-shadow: none;
}
`;
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-dnd@2.1.1_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-dnd/es/index.js
var __decorate$1 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Dnd = class Dnd extends View {
	get targetScroller() {
		return this.options.target.getPlugin("scroller");
	}
	get targetGraph() {
		return this.options.target;
	}
	get targetModel() {
		return this.targetGraph.model;
	}
	get snapline() {
		return this.options.target.getPlugin("snapline");
	}
	constructor(options) {
		super();
		this.name = "dnd";
		this.options = Object.assign(Object.assign({}, Dnd.defaults), options);
		this.init();
	}
	init() {
		ensure(this.name, content$1);
		this.container = document.createElement("div");
		addClass(this.container, this.prefixClassName("widget-dnd"));
		this.draggingGraph = new Graph(Object.assign(Object.assign({}, this.options.delegateGraphOptions), {
			container: document.createElement("div"),
			width: 1,
			height: 1,
			async: false
		}));
		append(this.container, this.draggingGraph.container);
	}
	start(node, evt) {
		const e = evt;
		e.preventDefault();
		this.targetModel.startBatch("dnd");
		addClass(this.container, "dragging");
		appendTo(this.container, this.options.draggingContainer || document.body);
		this.sourceNode = node;
		this.prepareDragging(node, e.clientX, e.clientY);
		const local = this.updateNodePosition(e.clientX, e.clientY);
		if (this.isSnaplineEnabled()) {
			this.snapline.captureCursorOffset({
				e,
				node,
				cell: node,
				view: this.draggingView,
				x: local.x,
				y: local.y
			});
			this.draggingNode.on("change:position", this.snap, this);
		}
		this.delegateDocumentEvents(Dnd.documentEvents, e.data);
	}
	isSnaplineEnabled() {
		return this.snapline && this.snapline.isEnabled();
	}
	prepareDragging(sourceNode, clientX, clientY) {
		const draggingGraph = this.draggingGraph;
		const draggingModel = draggingGraph.model;
		const draggingNode = this.options.getDragNode(sourceNode, {
			sourceNode,
			draggingGraph,
			targetGraph: this.targetGraph
		});
		draggingNode.position(0, 0);
		let padding = 5;
		if (this.isSnaplineEnabled()) padding += this.snapline.options.tolerance || 0;
		if (this.isSnaplineEnabled() || this.options.scaled) {
			const scale = this.targetGraph.transform.getScale();
			draggingGraph.scale(scale.sx, scale.sy);
			padding *= Math.max(scale.sx, scale.sy);
		} else draggingGraph.scale(1, 1);
		this.clearDragging();
		draggingModel.resetCells([draggingNode]);
		const delegateView = draggingGraph.findViewByCell(draggingNode);
		delegateView.undelegateEvents();
		delegateView.cell.off("changed");
		draggingGraph.fitToContent({
			padding,
			allowNewOrigin: "any",
			useCellGeometry: false
		});
		const bbox = delegateView.getBBox();
		this.geometryBBox = delegateView.getBBox({ useCellGeometry: true });
		this.delta = this.geometryBBox.getTopLeft().diff(bbox.getTopLeft());
		this.draggingNode = draggingNode;
		this.draggingView = delegateView;
		this.draggingBBox = draggingNode.getBBox();
		this.padding = padding;
		this.originOffset = this.updateGraphPosition(clientX, clientY);
	}
	updateGraphPosition(clientX, clientY) {
		const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
		const scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
		const delta = this.delta;
		const nodeBBox = this.geometryBBox;
		const padding = this.padding || 5;
		const offset = {
			left: clientX - delta.x - nodeBBox.width / 2 - padding + scrollLeft,
			top: clientY - delta.y - nodeBBox.height / 2 - padding + scrollTop
		};
		if (this.draggingGraph) css(this.container, {
			left: `${offset.left}px`,
			top: `${offset.top}px`
		});
		return offset;
	}
	updateNodePosition(x, y) {
		const local = this.targetGraph.clientToLocal(x, y);
		const bbox = this.draggingBBox;
		local.x -= bbox.width / 2;
		local.y -= bbox.height / 2;
		this.draggingNode.position(local.x, local.y);
		return local;
	}
	snap({ cell, current, options }) {
		const node = cell;
		if (options.snapped) {
			const bbox = this.draggingBBox;
			node.position(bbox.x + options.tx, bbox.y + options.ty, { silent: true });
			this.draggingView.translate();
			node.position(current.x, current.y, { silent: true });
			this.snapOffset = {
				x: options.tx,
				y: options.ty
			};
		} else this.snapOffset = null;
	}
	onDragging(evt) {
		const draggingView = this.draggingView;
		if (draggingView) {
			evt.preventDefault();
			const e = this.normalizeEvent(evt);
			const clientX = e.clientX;
			const clientY = e.clientY;
			this.updateGraphPosition(clientX, clientY);
			const local = this.updateNodePosition(clientX, clientY);
			const embeddingMode = this.targetGraph.options.embedding.enabled;
			const isValidArea = (embeddingMode || this.isSnaplineEnabled()) && this.isInsideValidArea({
				x: clientX,
				y: clientY
			});
			if (embeddingMode) {
				draggingView.setEventData(e, {
					graph: this.targetGraph,
					candidateEmbedView: this.candidateEmbedView
				});
				const data = draggingView.getEventData(e);
				if (isValidArea) draggingView.processEmbedding(e, data);
				else draggingView.clearEmbedding(data);
				this.candidateEmbedView = data.candidateEmbedView;
			}
			if (this.isSnaplineEnabled()) if (isValidArea) this.snapline.snapOnMoving({
				e,
				view: draggingView,
				x: local.x,
				y: local.y
			});
			else this.snapline.hide();
		}
	}
	onDragEnd(evt) {
		const draggingNode = this.draggingNode;
		if (draggingNode) {
			const e = this.normalizeEvent(evt);
			const draggingView = this.draggingView;
			const draggingBBox = this.draggingBBox;
			const snapOffset = this.snapOffset;
			let x = draggingBBox.x;
			let y = draggingBBox.y;
			if (snapOffset) {
				x += snapOffset.x;
				y += snapOffset.y;
			}
			draggingNode.position(x, y, { silent: true });
			const ret = this.drop(draggingNode, {
				x: e.clientX,
				y: e.clientY
			});
			const callback = (node) => {
				if (node) {
					this.onDropped(draggingNode);
					if (this.targetGraph.options.embedding.enabled && draggingView) {
						draggingView.setEventData(e, {
							cell: node,
							graph: this.targetGraph,
							candidateEmbedView: this.candidateEmbedView
						});
						draggingView.finalizeEmbedding(e, draggingView.getEventData(e));
					}
				} else this.onDropInvalid();
				this.candidateEmbedView = null;
				this.targetModel.stopBatch("dnd");
			};
			if (isAsync(ret)) {
				this.undelegateDocumentEvents();
				ret.then(callback);
			} else callback(ret);
		}
	}
	clearDragging() {
		if (this.draggingNode) {
			this.sourceNode = null;
			this.draggingNode.remove();
			this.draggingNode = null;
			this.draggingView = null;
			this.delta = null;
			this.padding = null;
			this.snapOffset = null;
			this.originOffset = null;
			this.undelegateDocumentEvents();
		}
	}
	onDropped(draggingNode) {
		if (this.draggingNode === draggingNode) {
			this.clearDragging();
			removeClass(this.container, "dragging");
			remove(this.container);
		}
	}
	onDropInvalid() {
		const draggingNode = this.draggingNode;
		if (draggingNode) this.onDropped(draggingNode);
	}
	isInsideValidArea(p) {
		let targetRect;
		let dndRect = null;
		const targetGraph = this.targetGraph;
		const targetScroller = this.targetScroller;
		if (this.options.dndContainer) dndRect = this.getDropArea(this.options.dndContainer);
		const isInsideDndRect = dndRect && dndRect.containsPoint(p);
		if (targetScroller) if (targetScroller.options.autoResize) targetRect = this.getDropArea(targetScroller.container);
		else {
			const outter = this.getDropArea(targetScroller.container);
			targetRect = this.getDropArea(targetGraph.container).intersectsWithRect(outter);
		}
		else targetRect = this.getDropArea(targetGraph.container);
		return !isInsideDndRect && targetRect && targetRect.containsPoint(p);
	}
	getDropArea(elem) {
		const offset$1 = offset(elem);
		const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
		const scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
		return Rectangle.create({
			x: offset$1.left + parseInt(css(elem, "border-left-width"), 10) - scrollLeft,
			y: offset$1.top + parseInt(css(elem, "border-top-width"), 10) - scrollTop,
			width: elem.clientWidth,
			height: elem.clientHeight
		});
	}
	drop(draggingNode, pos) {
		if (this.isInsideValidArea(pos)) {
			const targetGraph = this.targetGraph;
			const targetModel = targetGraph.model;
			const local = targetGraph.clientToLocal(pos);
			const sourceNode = this.sourceNode;
			const droppingNode = this.options.getDropNode(draggingNode, {
				sourceNode,
				draggingNode,
				targetGraph: this.targetGraph,
				draggingGraph: this.draggingGraph
			});
			const bbox = droppingNode.getBBox();
			local.x += bbox.x - bbox.width / 2;
			local.y += bbox.y - bbox.height / 2;
			const gridSize = this.snapOffset ? 1 : targetGraph.getGridSize();
			droppingNode.position(GeometryUtil.snapToGrid(local.x, gridSize), GeometryUtil.snapToGrid(local.y, gridSize));
			droppingNode.removeZIndex();
			const validateNode = this.options.validateNode;
			const ret = validateNode ? validateNode(droppingNode, {
				sourceNode,
				draggingNode,
				droppingNode,
				targetGraph,
				draggingGraph: this.draggingGraph
			}) : true;
			if (typeof ret === "boolean") {
				if (ret) {
					targetModel.addCell(droppingNode, { stencil: this.cid });
					return droppingNode;
				}
				return null;
			}
			return toDeferredBoolean(ret).then((valid) => {
				if (valid) {
					targetModel.addCell(droppingNode, { stencil: this.cid });
					return droppingNode;
				}
				return null;
			});
		}
		return null;
	}
	onRemove() {
		if (this.draggingGraph) {
			this.draggingGraph.view.remove();
			this.draggingGraph.dispose();
		}
	}
	dispose() {
		this.remove();
		clean(this.name);
	}
};
__decorate$1([View.dispose()], Dnd.prototype, "dispose", null);
(function(Dnd) {
	Dnd.defaults = {
		getDragNode: (sourceNode) => sourceNode.clone(),
		getDropNode: (draggingNode) => draggingNode.clone()
	};
	Dnd.documentEvents = {
		mousemove: "onDragging",
		touchmove: "onDragging",
		mouseup: "onDragEnd",
		touchend: "onDragEnd",
		touchcancel: "onDragEnd"
	};
})(Dnd || (Dnd = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-stencil@2.1.5_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-stencil/es/grid.js
function grid(cells, options = {}) {
	const model = Model.isModel(cells) ? cells : new Model().resetCells(cells, {
		sort: false,
		dryrun: true
	});
	const nodes = model.getNodes();
	const columns = options.columns || 1;
	const rows = Math.ceil(nodes.length / columns);
	const dx = options.dx || 0;
	const dy = options.dy || 0;
	const centre = options.center !== false;
	const resizeToFit = options.resizeToFit === true;
	const marginX = options.marginX || 0;
	const marginY = options.marginY || 0;
	const columnWidths = [];
	let columnWidth = options.columnWidth;
	if (columnWidth === "compact") for (let j = 0; j < columns; j += 1) {
		const items = GridLayout.getNodesInColumn(nodes, j, columns);
		columnWidths.push(GridLayout.getMaxDim(items, "width") + dx);
	}
	else {
		if (columnWidth == null || columnWidth === "auto") columnWidth = GridLayout.getMaxDim(nodes, "width") + dx;
		for (let i = 0; i < columns; i += 1) columnWidths.push(columnWidth);
	}
	const columnLefts = GridLayout.accumulate(columnWidths, marginX);
	const rowHeights = [];
	let rowHeight = options.rowHeight;
	if (rowHeight === "compact") for (let i = 0; i < rows; i += 1) {
		const items = GridLayout.getNodesInRow(nodes, i, columns);
		rowHeights.push(GridLayout.getMaxDim(items, "height") + dy);
	}
	else {
		if (rowHeight == null || rowHeight === "auto") rowHeight = GridLayout.getMaxDim(nodes, "height") + dy;
		for (let i = 0; i < rows; i += 1) rowHeights.push(rowHeight);
	}
	const rowTops = GridLayout.accumulate(rowHeights, marginY);
	model.startBatch("layout");
	nodes.forEach((node, index) => {
		const rowIndex = index % columns;
		const columnIndex = Math.floor(index / columns);
		const columnWidth = columnWidths[rowIndex];
		const rowHeight = rowHeights[columnIndex];
		let cx = 0;
		let cy = 0;
		let size = node.getSize();
		if (resizeToFit) {
			let width = columnWidth - 2 * dx;
			let height = rowHeight - 2 * dy;
			const calcHeight = size.height * (size.width ? width / size.width : 1);
			const calcWidth = size.width * (size.height ? height / size.height : 1);
			if (rowHeight < calcHeight) width = calcWidth;
			else height = calcHeight;
			size = {
				width,
				height
			};
			node.setSize(size, options);
		}
		if (centre) {
			cx = (columnWidth - size.width) / 2;
			cy = (rowHeight - size.height) / 2;
		}
		node.position(columnLefts[rowIndex] + dx + cx, rowTops[columnIndex] + dy + cy, options);
	});
	model.stopBatch("layout");
}
var GridLayout;
(function(GridLayout) {
	function getMaxDim(nodes, name) {
		return nodes.reduce((memo, node) => Math.max(node === null || node === void 0 ? void 0 : node.getSize()[name], memo), 0);
	}
	GridLayout.getMaxDim = getMaxDim;
	function getNodesInRow(nodes, rowIndex, columnCount) {
		const res = [];
		for (let i = columnCount * rowIndex, ii = i + columnCount; i < ii; i += 1) if (nodes[i]) res.push(nodes[i]);
		return res;
	}
	GridLayout.getNodesInRow = getNodesInRow;
	function getNodesInColumn(nodes, columnIndex, columnCount) {
		const res = [];
		for (let i = columnIndex, ii = nodes.length; i < ii; i += columnCount) if (nodes[i]) res.push(nodes[i]);
		return res;
	}
	GridLayout.getNodesInColumn = getNodesInColumn;
	function accumulate(items, start) {
		return items.reduce((memo, item, i) => {
			memo.push(memo[i] + item);
			return memo;
		}, [start || 0]);
	}
	GridLayout.accumulate = accumulate;
})(GridLayout || (GridLayout = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-stencil@2.1.5_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-stencil/es/style/raw.js
/**
* Auto generated file, do not modify it!
*/
var content = `.x6-widget-dnd {
  position: absolute;
  top: -10000px;
  left: -10000px;
  z-index: 999999;
  display: none;
  cursor: move;
  opacity: 0.7;
  pointer-events: 'cursor';
}
.x6-widget-dnd.dragging {
  display: inline-block;
}
.x6-widget-dnd.dragging * {
  pointer-events: none !important;
}
.x6-widget-dnd .x6-graph {
  background: transparent;
  box-shadow: none;
}
.x6-widget-stencil {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.x6-widget-stencil::after {
  position: absolute;
  top: 0;
  display: block;
  width: 100%;
  height: 20px;
  padding: 8px 0;
  line-height: 20px;
  text-align: center;
  opacity: 0;
  transition: top 0.1s linear, opacity 0.1s linear;
  content: ' ';
  pointer-events: none;
}
.x6-widget-stencil-content {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  height: auto;
  overflow-x: hidden;
  overflow-y: auto;
}
.x6-widget-stencil .x6-node [magnet]:not([magnet='passive']) {
  pointer-events: none;
}
.x6-widget-stencil-group {
  padding: 0;
  padding-bottom: 8px;
  overflow: hidden;
  user-select: none;
}
.x6-widget-stencil-group.collapsed {
  height: auto;
  padding-bottom: 0;
}
.x6-widget-stencil-group-title {
  position: relative;
  margin-top: 0;
  margin-bottom: 0;
  padding: 4px;
  cursor: pointer;
}
.x6-widget-stencil-title,
.x6-widget-stencil-group > .x6-widget-stencil-group-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  user-select: none;
}
.x6-widget-stencil .unmatched {
  opacity: 0.3;
}
.x6-widget-stencil .x6-node.unmatched {
  display: none;
}
.x6-widget-stencil-group.unmatched {
  display: none;
}
.x6-widget-stencil-search-text {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  height: 30px;
  max-height: 30px;
  line-height: 30px;
  outline: 0;
}
.x6-widget-stencil.not-found::after {
  opacity: 1;
  content: attr(data-not-found-text);
}
.x6-widget-stencil.not-found.searchable::after {
  top: 30px;
}
.x6-widget-stencil.not-found.searchable.collapsable::after {
  top: 50px;
}
.x6-widget-stencil {
  color: #333;
  background: #f5f5f5;
}
.x6-widget-stencil-content {
  position: absolute;
}
.x6-widget-stencil.collapsable > .x6-widget-stencil-content {
  top: 32px;
}
.x6-widget-stencil.searchable > .x6-widget-stencil-content {
  top: 80px;
}
.x6-widget-stencil.not-found::after {
  position: absolute;
}
.x6-widget-stencil.not-found.searchable.collapsable::after {
  top: 80px;
}
.x6-widget-stencil.not-found.searchable::after {
  top: 60px;
}
.x6-widget-stencil-group {
  height: auto;
  margin-bottom: 1px;
  padding: 0;
  transition: none;
}
.x6-widget-stencil-group .x6-graph {
  background: transparent;
  box-shadow: none;
}
.x6-widget-stencil-group.collapsed {
  height: auto;
  max-height: 31px;
}
.x6-widget-stencil-title,
.x6-widget-stencil-group > .x6-widget-stencil-group-title {
  position: relative;
  left: 0;
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 0 5px 0 8px;
  color: #666;
  font-weight: 700;
  font-size: 12px;
  line-height: 32px;
  cursor: default;
  transition: all 0.3;
}
.x6-widget-stencil-title:hover,
.x6-widget-stencil-group > .x6-widget-stencil-group-title:hover {
  color: #444;
}
.x6-widget-stencil-title {
  background: #e9e9e9;
}
.x6-widget-stencil-group > .x6-widget-stencil-group-title {
  background: #ededed;
}
.x6-widget-stencil.collapsable > .x6-widget-stencil-title,
.x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title {
  padding-left: 32px;
  cursor: pointer;
}
.x6-widget-stencil.collapsable > .x6-widget-stencil-title::before,
.x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title::before {
  position: absolute;
  top: 6px;
  left: 8px;
  display: block;
  width: 18px;
  height: 18px;
  margin: 0;
  padding: 0;
  background-color: transparent;
  background-repeat: no-repeat;
  background-position: 0 0;
  border: none;
  content: ' ';
}
.x6-widget-stencil.collapsable > .x6-widget-stencil-title::before,
.x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title::before {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzAwMCIgZmlsbC1ydWxlPSJub256ZXJvIj48cGF0aCBkPSJNOS4zNzUuNUM0LjY4Ny41Ljg3NSA0LjMxMy44NzUgOWMwIDQuNjg4IDMuODEyIDguNSA4LjUgOC41IDQuNjg3IDAgOC41LTMuODEyIDguNS04LjUgMC00LjY4Ny0zLjgxMy04LjUtOC41LTguNXptMCAxNS44ODZDNS4zMDMgMTYuMzg2IDEuOTkgMTMuMDcyIDEuOTkgOXMzLjMxMi03LjM4NSA3LjM4NS03LjM4NVMxNi43NiA0LjkyOCAxNi43NiA5YzAgNC4wNzItMy4zMTMgNy4zODYtNy4zODUgNy4zODZ6Ii8+PHBhdGggZD0iTTEyLjc1MyA4LjQ0M0g1Ljk5N2EuNTU4LjU1OCAwIDAwMCAxLjExNmg2Ljc1NmEuNTU4LjU1OCAwIDAwMC0xLjExNnoiLz48L2c+PC9zdmc+');
  opacity: 0.4;
  transition: all 0.3s;
}
.x6-widget-stencil.collapsable > .x6-widget-stencil-title:hover::before,
.x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title:hover::before {
  opacity: 0.6;
}
.x6-widget-stencil.collapsable.collapsed > .x6-widget-stencil-title::before,
.x6-widget-stencil-group.collapsable.collapsed > .x6-widget-stencil-group-title::before {
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzAwMCIgZmlsbC1ydWxlPSJub256ZXJvIj48cGF0aCBkPSJNOS4zNzUuNUM0LjY4Ny41Ljg3NSA0LjMxMy44NzUgOWMwIDQuNjg4IDMuODEyIDguNSA4LjUgOC41IDQuNjg3IDAgOC41LTMuODEyIDguNS04LjUgMC00LjY4Ny0zLjgxMy04LjUtOC41LTguNXptMCAxNS44ODZDNS4zMDMgMTYuMzg2IDEuOTkgMTMuMDcyIDEuOTkgOXMzLjMxMi03LjM4NSA3LjM4NS03LjM4NVMxNi43NiA0LjkyOCAxNi43NiA5YzAgNC4wNzItMy4zMTMgNy4zODYtNy4zODUgNy4zODZ6Ii8+PHBhdGggZD0iTTEyLjc1MyA4LjQ0M0g1Ljk5N2EuNTU4LjU1OCAwIDAwMCAxLjExNmg2Ljc1NmEuNTU4LjU1OCAwIDAwMC0xLjExNnoiLz48cGF0aCBkPSJNOC44MTcgNS42MjN2Ni43NTZhLjU1OC41NTggMCAwMDEuMTE2IDBWNS42MjNhLjU1OC41NTggMCAxMC0xLjExNiAweiIvPjwvZz48L3N2Zz4=');
  opacity: 0.4;
}
.x6-widget-stencil.collapsable.collapsed > .x6-widget-stencil-title:hover::before,
.x6-widget-stencil-group.collapsable.collapsed > .x6-widget-stencil-group-title:hover::before {
  opacity: 0.6;
}
.x6-widget-stencil input[type='search'] {
  appearance: textfield;
}
.x6-widget-stencil input[type='search']::-webkit-search-cancel-button,
.x6-widget-stencil input[type='search']::-webkit-search-decoration {
  appearance: none;
}
.x6-widget-stencil-search-text {
  display: block;
  width: 90%;
  margin: 8px 5%;
  padding-left: 8px;
  color: #333;
  background: #fff;
  border: 1px solid #e9e9e9;
  border-radius: 12px;
  outline: 0;
}
.x6-widget-stencil-search-text:focus {
  outline: 0;
}
.x6-widget-stencil::after {
  color: #808080;
  font-weight: 600;
  font-size: 12px;
  background: 0 0;
}
`;
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-stencil@2.1.5_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-stencil/es/index.js
var __decorate = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Stencil = class Stencil extends View {
	get targetScroller() {
		return this.options.target.getPlugin("scroller");
	}
	get targetGraph() {
		return this.options.target;
	}
	get targetModel() {
		return this.targetGraph.model;
	}
	constructor(options = {}) {
		super();
		this.name = "stencil";
		ensure(this.name, content);
		this.graphs = {};
		this.groups = {};
		this.options = Object.assign(Object.assign({}, Stencil.defaultOptions), options);
		this.init();
	}
	init() {
		this.dnd = new Dnd(this.options);
		this.onSearch = debounce(this.onSearch, 200);
		this.initContainer();
		this.initSearch();
		this.initContent();
		this.initGroups();
		this.setTitle();
		this.startListening();
	}
	load(data, groupName) {
		if (Array.isArray(data)) this.loadGroup(data, groupName);
		else if (this.options.groups) Object.keys(this.options.groups).forEach((groupName) => {
			if (data[groupName]) this.loadGroup(data[groupName], groupName);
		});
		return this;
	}
	unload(data, groupName) {
		if (Array.isArray(data)) this.loadGroup(data, groupName, true);
		else if (this.options.groups) Object.keys(this.options.groups).forEach((groupName) => {
			if (data[groupName]) this.loadGroup(data[groupName], groupName, true);
		});
		return this;
	}
	toggleGroup(groupName) {
		if (this.isGroupCollapsed(groupName)) this.expandGroup(groupName);
		else this.collapseGroup(groupName);
		return this;
	}
	collapseGroup(groupName) {
		if (this.isGroupCollapsable(groupName)) {
			const group = this.groups[groupName];
			if (group && !this.isGroupCollapsed(groupName)) {
				this.trigger("group:collapse", { name: groupName });
				addClass(group, "collapsed");
			}
		}
		return this;
	}
	expandGroup(groupName) {
		if (this.isGroupCollapsable(groupName)) {
			const group = this.groups[groupName];
			if (group && this.isGroupCollapsed(groupName)) {
				this.trigger("group:expand", { name: groupName });
				removeClass(group, "collapsed");
			}
		}
		return this;
	}
	isGroupCollapsable(groupName) {
		const group = this.groups[groupName];
		return hasClass(group, "collapsable");
	}
	isGroupCollapsed(groupName) {
		const group = this.groups[groupName];
		return group && hasClass(group, "collapsed");
	}
	collapseGroups() {
		Object.keys(this.groups).forEach((groupName) => this.collapseGroup(groupName));
		return this;
	}
	expandGroups() {
		Object.keys(this.groups).forEach((groupName) => this.expandGroup(groupName));
		return this;
	}
	resizeGroup(groupName, size) {
		const graph = this.graphs[groupName];
		if (graph) graph.resize(size.width, size.height);
		return this;
	}
	addGroup(group) {
		const groups = Array.isArray(group) ? group : [group];
		if (this.options.groups) this.options.groups.push(...groups);
		else this.options.groups = groups;
		groups.forEach((group) => this.initGroup(group));
	}
	removeGroup(groupName) {
		const groupNames = Array.isArray(groupName) ? groupName : [groupName];
		if (this.options.groups) {
			this.options.groups = this.options.groups.filter((group) => !groupNames.includes(group.name));
			groupNames.forEach((groupName) => {
				const graph = this.graphs[groupName];
				this.unregisterGraphEvents(graph);
				graph.dispose();
				delete this.graphs[groupName];
				const elem = this.groups[groupName];
				remove(elem);
				delete this.groups[groupName];
			});
		}
	}
	initContainer() {
		this.container = document.createElement("div");
		addClass(this.container, this.prefixClassName(ClassNames.base));
		attr(this.container, "data-not-found-text", this.options.notFoundText || "No matches found");
	}
	initContent() {
		this.content = document.createElement("div");
		addClass(this.content, this.prefixClassName(ClassNames.content));
		appendTo(this.content, this.container);
	}
	initSearch() {
		if (this.options.search) {
			addClass(this.container, "searchable");
			append(this.container, this.renderSearch());
		}
	}
	initGroup(group) {
		const globalGraphOptions = this.options.stencilGraphOptions || {};
		const groupElem = document.createElement("div");
		addClass(groupElem, this.prefixClassName(ClassNames.group));
		attr(groupElem, "data-name", group.name);
		if (group.collapsable == null && this.options.collapsable || group.collapsable !== false) addClass(groupElem, "collapsable");
		toggleClass(groupElem, "collapsed", group.collapsed === true);
		const title = document.createElement("h3");
		addClass(title, this.prefixClassName(ClassNames.groupTitle));
		title.innerHTML = group.title || group.name;
		const content = document.createElement("div");
		addClass(content, this.prefixClassName(ClassNames.groupContent));
		const graphOptionsInGroup = group.graphOptions;
		const graph = new Graph(Object.assign(Object.assign(Object.assign({}, globalGraphOptions), graphOptionsInGroup), {
			container: document.createElement("div"),
			model: globalGraphOptions.model || new Model(),
			width: group.graphWidth || this.options.stencilGraphWidth,
			height: group.graphHeight || this.options.stencilGraphHeight,
			interacting: false,
			preventDefaultBlankAction: false
		}));
		this.registerGraphEvents(graph);
		append(content, graph.container);
		append(groupElem, [title, content]);
		appendTo(groupElem, this.content);
		this.groups[group.name] = groupElem;
		this.graphs[group.name] = graph;
	}
	initGroups() {
		this.clearGroups();
		this.setCollapsableState();
		if (this.options.groups && this.options.groups.length) this.options.groups.forEach((group) => {
			this.initGroup(group);
		});
		else {
			const globalGraphOptions = this.options.stencilGraphOptions || {};
			const graph = new Graph(Object.assign(Object.assign({}, globalGraphOptions), {
				container: document.createElement("div"),
				model: globalGraphOptions.model || new Model(),
				width: this.options.stencilGraphWidth,
				height: this.options.stencilGraphHeight,
				interacting: false,
				preventDefaultBlankAction: false
			}));
			append(this.content, graph.container);
			this.graphs[Private.defaultGroupName] = graph;
		}
	}
	setCollapsableState() {
		this.options.collapsable = this.options.collapsable && this.options.groups && this.options.groups.some((group) => group.collapsable !== false);
		if (this.options.collapsable) {
			addClass(this.container, "collapsable");
			if (this.options.groups && this.options.groups.every((group) => group.collapsed || group.collapsable === false)) addClass(this.container, "collapsed");
			else removeClass(this.container, "collapsed");
		} else removeClass(this.container, "collapsable");
	}
	setTitle() {
		const title = document.createElement("div");
		addClass(title, this.prefixClassName(ClassNames.title));
		title.innerHTML = this.options.title;
		appendTo(title, this.container);
	}
	renderSearch() {
		const elem = document.createElement("div");
		addClass(elem, this.prefixClassName(ClassNames.search));
		const input = document.createElement("input");
		attr(input, {
			type: "search",
			placeholder: this.options.placeholder || "Search"
		});
		addClass(input, this.prefixClassName(ClassNames.searchText));
		append(elem, input);
		return elem;
	}
	startListening() {
		const title = this.prefixClassName(ClassNames.title);
		const searchText = this.prefixClassName(ClassNames.searchText);
		const groupTitle = this.prefixClassName(ClassNames.groupTitle);
		this.delegateEvents({
			[`click .${title}`]: "onTitleClick",
			[`touchstart .${title}`]: "onTitleClick",
			[`click .${groupTitle}`]: "onGroupTitleClick",
			[`touchstart .${groupTitle}`]: "onGroupTitleClick",
			[`input .${searchText}`]: "onSearch",
			[`focusin .${searchText}`]: "onSearchFocusIn",
			[`focusout .${searchText}`]: "onSearchFocusOut"
		});
	}
	stopListening() {
		this.undelegateEvents();
	}
	registerGraphEvents(graph) {
		graph.on("cell:mousedown", this.onDragStart, this);
	}
	unregisterGraphEvents(graph) {
		graph.off("cell:mousedown", this.onDragStart, this);
	}
	loadGroup(cells, groupName, reverse) {
		const model = this.getModel(groupName);
		if (model) {
			const nodes = cells.map((cell) => Node.isNode(cell) ? cell : Node.create(cell));
			if (reverse === true) model.removeCells(nodes);
			else model.resetCells(nodes);
		}
		const group = this.getGroup(groupName);
		let height = this.options.stencilGraphHeight;
		if (group && group.graphHeight != null) height = group.graphHeight;
		const layout = group && group.layout || this.options.layout;
		if (layout && model) call(layout, this, model, group);
		if (!height) {
			const graph = this.getGraph(groupName);
			graph.fitToContent({
				minWidth: graph.options.width,
				gridHeight: 1,
				padding: group && group.graphPadding || this.options.stencilGraphPadding || 10
			});
		}
		return this;
	}
	onDragStart(args) {
		const { e, node } = args;
		const group = this.getGroupByNode(node);
		if (group && group.nodeMovable === false) return;
		this.dnd.start(node, e);
	}
	filter(keyword, filter) {
		const found = Object.keys(this.graphs).reduce((memo, groupName) => {
			const graph = this.graphs[groupName];
			const name = groupName === Private.defaultGroupName ? null : groupName;
			const items = graph.model.getNodes().filter((cell) => {
				let matched = false;
				if (typeof filter === "function") matched = call(filter, this, cell, keyword, name, this);
				else if (typeof filter === "boolean") matched = filter;
				else matched = this.isCellMatched(cell, keyword, filter, keyword.toLowerCase() !== keyword);
				const view = graph.renderer.findViewByCell(cell);
				if (view) toggleClass(view.container, "unmatched", !matched);
				return matched;
			});
			const found = items.length > 0;
			const options = this.options;
			const model = new Model();
			model.resetCells(items);
			if (options.layout) call(options.layout, this, model, this.getGroup(groupName));
			if (this.groups[groupName]) toggleClass(this.groups[groupName], "unmatched", !found);
			graph.fitToContent({
				gridWidth: 1,
				gridHeight: 1,
				padding: options.stencilGraphPadding || 10
			});
			return memo || found;
		}, false);
		toggleClass(this.container, "not-found", !found);
	}
	isCellMatched(cell, keyword, filters, ignoreCase) {
		if (keyword && filters) return Object.keys(filters).some((shape) => {
			if (shape === "*" || cell.shape === shape) {
				const filter = filters[shape];
				if (typeof filter === "boolean") return filter;
				return (Array.isArray(filter) ? filter : [filter]).some((path) => {
					let val = cell.getPropByPath(path);
					if (val != null) {
						val = `${val}`;
						if (!ignoreCase) val = val.toLowerCase();
						return val.indexOf(keyword) >= 0;
					}
					return false;
				});
			}
			return false;
		});
		return true;
	}
	onSearch(evt) {
		this.filter(evt.target.value, this.options.search);
	}
	onSearchFocusIn() {
		addClass(this.container, "is-focused");
	}
	onSearchFocusOut() {
		removeClass(this.container, "is-focused");
	}
	onTitleClick() {
		if (this.options.collapsable) {
			toggleClass(this.container, "collapsed");
			if (hasClass(this.container, "collapsed")) this.collapseGroups();
			else this.expandGroups();
		}
	}
	onGroupTitleClick(evt) {
		const group = evt.target.closest(`.${this.prefixClassName(ClassNames.group)}`);
		if (group) this.toggleGroup(attr(group, "data-name") || "");
		const allCollapsed = Object.keys(this.groups).every((name) => {
			const group = this.getGroup(name);
			const groupElem = this.groups[name];
			return group && group.collapsable === false || hasClass(groupElem, "collapsed");
		});
		toggleClass(this.container, "collapsed", allCollapsed);
	}
	getModel(groupName) {
		const graph = this.getGraph(groupName);
		return graph ? graph.model : null;
	}
	getGraph(groupName) {
		return this.graphs[groupName || Private.defaultGroupName];
	}
	getGroup(groupName) {
		const groups = this.options.groups;
		if (groupName != null && groups && groups.length) return groups.find((group) => group.name === groupName);
		return null;
	}
	getGroupByNode(node) {
		const groups = this.options.groups;
		if (groups) return groups.find((group) => {
			const model = this.getModel(group.name);
			if (model) return model.has(node.id);
			return false;
		});
		return null;
	}
	clearGroups() {
		Object.keys(this.graphs).forEach((groupName) => {
			const graph = this.graphs[groupName];
			this.unregisterGraphEvents(graph);
			graph.dispose();
		});
		Object.keys(this.groups).forEach((groupName) => {
			const elem = this.groups[groupName];
			remove(elem);
		});
		this.graphs = {};
		this.groups = {};
	}
	onRemove() {
		this.clearGroups();
		this.dnd.remove();
		this.stopListening();
		this.undelegateDocumentEvents();
	}
	dispose() {
		this.remove();
		clean(this.name);
	}
};
__decorate([View.dispose()], Stencil.prototype, "dispose", null);
(function(Stencil) {
	Stencil.defaultOptions = Object.assign({
		stencilGraphWidth: 200,
		stencilGraphHeight: 800,
		title: "Stencil",
		collapsable: false,
		placeholder: "Search",
		notFoundText: "No matches found",
		layout(model, group) {
			const options = {
				columnWidth: this.options.stencilGraphWidth / 2 - 10,
				columns: 2,
				rowHeight: 80,
				resizeToFit: false,
				dx: 10,
				dy: 10
			};
			grid(model, Object.assign(Object.assign(Object.assign({}, options), this.options.layoutOptions), group ? group.layoutOptions : {}));
		}
	}, Dnd.defaults);
})(Stencil || (Stencil = {}));
var ClassNames;
(function(ClassNames) {
	ClassNames.base = "widget-stencil";
	ClassNames.title = `${ClassNames.base}-title`;
	ClassNames.search = `${ClassNames.base}-search`;
	ClassNames.searchText = `${ClassNames.search}-text`;
	ClassNames.content = `${ClassNames.base}-content`;
	ClassNames.group = `${ClassNames.base}-group`;
	ClassNames.groupTitle = `${ClassNames.group}-title`;
	ClassNames.groupContent = `${ClassNames.group}-content`;
})(ClassNames || (ClassNames = {}));
var Private;
(function(Private) {
	Private.defaultGroupName = "__default__";
})(Private || (Private = {}));
//#endregion
//#region ../../packages/ui/src/components/ReGraph/internals/x6/engine.ts
/**
* X6GraphEngine —— ReGraph 的 X6 内核
*
* 封装 @antv/x6 的 Graph 与若干官方插件（snapline / selection / keyboard /
* clipboard / history / minimap / export / transform / stencil），向上层 Vue
* 组件暴露无框架依赖的命令式 API：setData / addNode / addEdge / zoomToFit /
* undo / redo / toJSON / fromJSON / highlight 等。
*
* 同时实现 agent-flow 风格的节点调色板（Stencil），支持从左侧拖拽生成节点。
*/
/** 从 X6 事件参数中稳妥提取原生 MouseEvent */
function nativeEvent(e) {
	const anyE = e;
	return (anyE?.originalEvent ?? anyE?.e ?? anyE) || new MouseEvent("click");
}
/** 从 X6 cell 读取我们挂的业务数据 */
function readNode(cell) {
	const data = cell.getData?.() ?? {};
	const pos = cell.getPosition();
	return {
		id: cell.id,
		text: data.reText ?? "",
		type: data.reType ?? "default",
		x: Math.round(pos.x),
		y: Math.round(pos.y),
		width: cell.getSize().width,
		height: cell.getSize().height,
		locked: data.locked ?? false,
		hidden: data.hidden ?? false,
		data: data.reData ?? {}
	};
}
function readEdge(cell) {
	const data = cell.getData?.() ?? {};
	const source = cell.getSource();
	const target = cell.getTarget();
	const labels = cell.getLabels();
	return {
		id: cell.id,
		from: source.cell ?? "",
		to: target.cell ?? "",
		fromPort: source.port,
		toPort: target.port,
		text: labels[0]?.attrs?.label?.text ?? "",
		data: data.reData ?? {}
	};
}
var X6GraphEngine = class {
	graph;
	stencil = null;
	options;
	mode;
	lastData = {
		nodes: [],
		edges: []
	};
	animateAll = false;
	animatedEdges = /* @__PURE__ */ new Set();
	rafId = 0;
	animOffset = 0;
	edgeRouter = "manhattan";
	edgeConnector = "rounded";
	constructor(options) {
		ensureRegistered();
		this.options = options;
		this.mode = options.mode ?? ReGraphMode.FORCE;
		this.animateAll = options.animated ?? false;
		this.edgeRouter = options.edgeRouter ?? "manhattan";
		this.edgeConnector = options.edgeConnector ?? "rounded";
		this.graph = new Graph({
			container: options.container,
			autoResize: true,
			background: { color: "transparent" },
			grid: {
				visible: true,
				type: "dot",
				args: [{
					color: "#e6e6e6",
					thickness: 1
				}, {
					color: "#f2f2f2",
					thickness: 1,
					factor: 4
				}]
			},
			mousewheel: {
				enabled: true,
				modifiers: ["ctrl", "meta"],
				minScale: .3,
				maxScale: 2.5
			},
			panning: {
				enabled: true,
				modifiers: "space"
			},
			connecting: {
				router: { name: "manhattan" },
				connector: { name: "rounded" },
				anchor: "center",
				connectionPoint: "boundary",
				allowBlank: false,
				allowLoop: false,
				snap: { radius: 24 },
				createEdge() {
					return new Edge({ shape: "re-graph-edge" });
				},
				validateConnection({ sourceCell, targetCell }) {
					return !!sourceCell && !!targetCell && sourceCell !== targetCell;
				}
			},
			highlighting: {
				magnetAvailable: {
					name: "stroke",
					args: {
						padding: 2,
						attrs: {
							stroke: "#1677ff",
							strokeWidth: 2
						}
					}
				},
				magnetAdsorbed: {
					name: "stroke",
					args: {
						padding: 2,
						attrs: {
							stroke: "#1677ff",
							strokeWidth: 2
						}
					}
				}
			},
			interacting: { nodeMovable: (args) => {
				return !(args.cell.getData?.() ?? {}).locked;
			} }
		});
		this.graph.use(new Snapline({ enabled: true })).use(new Selection({
			enabled: true,
			multiple: true,
			rubberband: true,
			showNodeSelectionBox: true
		})).use(new Keyboard({ enabled: true })).use(new Clipboard({ enabled: true })).use(new History({ enabled: true })).use(new Export());
		if (options.minimapContainer) this.graph.use(new MiniMap({
			container: options.minimapContainer,
			width: 200,
			height: 140,
			padding: 10
		}));
		if (options.paletteContainer && (options.editable || options.paletteTypes)) this.initPalette(options.paletteContainer, options.paletteTypes ?? DEFAULT_NODE_TYPES);
		this.bindEvents();
		options.handlers?.onReady?.(this);
	}
	/** 初始化 agent-flow 调色板 */
	initPalette(container, types) {
		this.stencil = new Stencil({
			target: this.graph,
			title: "节点",
			collapsable: false,
			stencilGraphWidth: container.clientWidth || 200,
			stencilGraphHeight: container.clientHeight || 600,
			groups: [{
				name: "flow",
				title: "流程节点"
			}],
			layoutOptions: {
				columns: 1,
				columnWidth: 180,
				rowHeight: 52
			}
		});
		container.appendChild(this.stencil.container);
		const templates = types.map((def) => this.graph.createNode(buildNodeMetadata({
			id: `tpl-${def.type}`,
			type: def.type,
			text: def.label,
			width: 180,
			height: 44
		})));
		this.stencil.load(templates, "flow");
	}
	bindEvents() {
		this.graph.on("node:click", ({ node, e }) => {
			this.options.handlers?.onNodeClick?.(readNode(node), nativeEvent(e));
		});
		this.graph.on("node:dblclick", ({ node, e }) => {
			this.options.handlers?.onNodeDblClick?.(readNode(node), nativeEvent(e));
		});
		this.graph.on("node:contextmenu", ({ node, e }) => {
			nativeEvent(e).preventDefault?.();
			this.options.handlers?.onNodeContextMenu?.(readNode(node), nativeEvent(e));
		});
		this.graph.on("edge:click", ({ edge, e }) => {
			this.options.handlers?.onEdgeClick?.(readEdge(edge), nativeEvent(e));
		});
		this.graph.on("cell:added", () => this.options.handlers?.onCellChanged?.());
		this.graph.on("cell:removed", () => this.options.handlers?.onCellChanged?.());
	}
	/** 写入完整图数据（按 mode 计算坐标后渲染） */
	setData(raw) {
		const data = {
			rootId: raw.rootId,
			nodes: (raw.nodes ?? []).map((n) => ({ ...n })),
			edges: raw.edges ?? raw.lines ?? []
		};
		this.lastData = data;
		this.graph.clearCells();
		const positions = computeLayout(this.mode, data, 800, 600);
		if (this.mode === ReGraphMode.FIXED) data.nodes.forEach((n) => {
			if (typeof n.x !== "number" || typeof n.y !== "number") {
				const p = positions[n.id] ?? {
					x: 0,
					y: 0
				};
				n.x = p.x;
				n.y = p.y;
			}
		});
		else data.nodes.forEach((n) => {
			const p = positions[n.id] ?? {
				x: 0,
				y: 0
			};
			n.x = p.x;
			n.y = p.y;
		});
		const nodes = data.nodes.map((n) => buildNodeMetadata(n));
		const edgeOpts = {
			router: this.edgeRouter,
			connector: this.edgeConnector
		};
		const edges = data.edges.map((e) => buildEdgeMetadata(e, edgeOpts));
		this.graph.addNodes(nodes);
		this.graph.addEdges(edges);
		this.syncAnimatedEdges();
		this.startAnimation();
	}
	/** 读取当前图数据为通用结构 */
	getData() {
		return {
			nodes: this.graph.getNodes().map((c) => readNode(c)),
			edges: this.graph.getEdges().map((c) => readEdge(c))
		};
	}
	/** 重新布局（沿用当前 mode） */
	relayout() {
		const data = this.lastData.nodes.length ? this.lastData : this.getData();
		this.lastData = data;
		const positions = computeLayout(this.mode, data, 800, 600);
		this.graph.getNodes().forEach((node) => {
			const p = positions[node.id];
			if (p) node.position(p.x, p.y, { deep: false });
		});
	}
	/** 追加节点 */
	addNode(node) {
		return this.graph.addNode(buildNodeMetadata(node));
	}
	/** 追加连线 */
	addEdge(edge) {
		const cell = this.graph.addEdge(buildEdgeMetadata(edge, {
			router: this.edgeRouter,
			connector: this.edgeConnector
		}));
		if (this.animateAll || edge.animated) {
			this.animatedEdges.add(cell.id);
			this.startAnimation();
		}
		return cell;
	}
	getNodeById(id) {
		const cell = this.graph.getCellById(id);
		return cell ? readNode(cell) : null;
	}
	removeNodeById(id) {
		const cell = this.graph.getCellById(id);
		if (cell) this.graph.removeCell(cell);
	}
	removeEdgeById(id) {
		const cell = this.graph.getCellById(id);
		if (cell) this.graph.removeCell(cell);
	}
	/** 更新节点业务数据 / 类型 / 文本 */
	updateNode(id, patch) {
		const cell = this.graph.getCellById(id);
		if (!cell) return;
		const data = cell.getData?.() ?? {};
		if (patch.text !== void 0) {
			data.reText = patch.text;
			cell.attr("label/text", patch.text);
		}
		if (patch.type !== void 0) {
			data.reType = patch.type;
			const def = resolveNodeType(patch.type);
			cell.attr("body/stroke", def.color);
			cell.attr("body/fill", `${def.color}14`);
			cell.attr("icon/fill", def.color);
			cell.attr("icon/text", def.icon);
		}
		if (patch.locked !== void 0) data.locked = patch.locked;
		if (patch.hidden !== void 0) data.hidden = patch.hidden;
		if (patch.data !== void 0) data.reData = patch.data;
		cell.setData(data);
	}
	/** 隐藏 / 显示节点（含相邻连线） */
	hideNode(id) {
		this.graph.getCellById(id)?.attr("body/opacity", .25);
		this.getRelatedEdges(id).forEach((e) => e.hide());
	}
	showNode(id) {
		this.graph.getCellById(id)?.attr("body/opacity", 1);
		this.getRelatedEdges(id).forEach((e) => e.show());
	}
	getRelatedEdges(id) {
		return this.graph.getEdges().filter((e) => {
			const s = e.getSource();
			const t = e.getTarget();
			return s.cell === id || t.cell === id;
		});
	}
	focusNode(id) {
		const cell = this.graph.getCellById(id);
		if (cell) this.graph.centerCell(cell);
	}
	setMode(mode) {
		if (this.mode === mode) return;
		this.mode = mode;
		this.relayout();
	}
	getMode() {
		return this.mode;
	}
	zoomBy(delta) {
		const scale = this.graph.zoom();
		this.graph.zoom(Math.max(.3, Math.min(2.5, scale + delta / 100)), {
			maxScale: 2.5,
			minScale: .3
		});
	}
	zoomToFit() {
		this.graph.zoomToFit({
			padding: 24,
			maxScale: 1.5
		});
	}
	centerContent() {
		this.graph.centerContent();
	}
	undo() {
		if (this.graph.canUndo()) this.graph.undo();
	}
	redo() {
		if (this.graph.canRedo()) this.graph.redo();
	}
	canUndo() {
		return this.graph.canUndo();
	}
	canRedo() {
		return this.graph.canRedo();
	}
	matchedIds = /* @__PURE__ */ new Set();
	highlight(keyword, mode = "highlight") {
		const kw = keyword.trim().toLowerCase();
		const all = this.graph.getNodes().map((c) => readNode(c));
		if (!kw) {
			this.clearHighlight();
			return [];
		}
		const kws = kw.split(/[,， \n]+/).filter(Boolean);
		const matched = /* @__PURE__ */ new Set();
		all.forEach((n) => {
			if (kws.some((k) => String(n.text ?? "").toLowerCase().includes(k))) matched.add(n.id);
		});
		this.matchedIds = matched;
		if (mode === "path" && matched.size >= 2) {
			const pathIds = /* @__PURE__ */ new Set();
			const ids = [...matched];
			for (let i = 0; i < ids.length - 1; i++) this.shortestPath(ids[i], ids[i + 1]).forEach((p) => pathIds.add(p));
			this.applyDim(pathIds);
		} else this.applyDim(matched);
		return [...matched];
	}
	applyDim(keep) {
		this.graph.getNodes().forEach((node) => {
			if (keep.has(node.id)) {
				node.attr("body/opacity", 1);
				node.attr("body/strokeWidth", 2.5);
			} else {
				node.attr("body/opacity", .15);
				node.attr("body/strokeWidth", 1.5);
			}
		});
		this.graph.getEdges().forEach((edge) => {
			const s = edge.getSource().cell;
			const t = edge.getTarget().cell;
			edge.attr("line/opacity", keep.has(s ?? "") && keep.has(t ?? "") ? 1 : .12);
		});
	}
	clearHighlight() {
		this.matchedIds = /* @__PURE__ */ new Set();
		this.graph.getNodes().forEach((node) => {
			node.attr("body/opacity", 1);
			node.attr("body/strokeWidth", 1.5);
		});
		this.graph.getEdges().forEach((edge) => edge.attr("line/opacity", 1));
	}
	shortestPath(from, to) {
		const adj = /* @__PURE__ */ new Map();
		this.graph.getNodes().forEach((n) => adj.set(n.id, []));
		this.graph.getEdges().forEach((e) => {
			const s = e.getSource().cell;
			const t = e.getTarget().cell;
			if (s && t) {
				adj.get(s)?.push(t);
				adj.get(t)?.push(s);
			}
		});
		const prev = /* @__PURE__ */ new Map();
		const visited = /* @__PURE__ */ new Set();
		const queue = [from];
		prev.set(from, null);
		visited.add(from);
		while (queue.length) {
			const cur = queue.shift();
			if (cur === to) break;
			for (const nxt of adj.get(cur) ?? []) if (!visited.has(nxt)) {
				visited.add(nxt);
				prev.set(nxt, cur);
				queue.push(nxt);
			}
		}
		if (!visited.has(to)) return [];
		const path = [];
		let cur = to;
		while (cur) {
			path.unshift(cur);
			cur = prev.get(cur) ?? null;
		}
		return path;
	}
	toJSON() {
		return {
			version: "2.0",
			exportTime: (/* @__PURE__ */ new Date()).toISOString(),
			mode: this.mode,
			cells: this.graph.toJSON().cells
		};
	}
	fromJSON(json) {
		this.graph.fromJSON({ cells: json.cells });
		if (json.mode) this.mode = json.mode;
	}
	/** 导出 PNG（依赖 Export 插件） */
	async exportPNG(name = "graph.png") {
		this.graph.toPNG((uri) => {
			const a = document.createElement("a");
			a.href = uri;
			a.download = name;
			a.click();
		}, {
			backgroundColor: "#ffffff",
			padding: 16
		});
	}
	async expand(nodeId, fetcher) {
		const payload = await fetcher(nodeId);
		payload.nodes.forEach((n) => {
			if (!this.graph.getCellById(n.id)) this.addNode(n);
		});
		payload.edges.forEach((e) => {
			if (e.from && e.to) this.addEdge(e);
		});
		this.updateNode(nodeId, { data: {
			...this.getNodeById(nodeId)?.data ?? {},
			expanded: true
		} });
		return payload;
	}
	async handleMenuAction(action, node) {
		switch (action) {
			case "lock":
				this.updateNode(node.id, { locked: true });
				break;
			case "unlock":
				this.updateNode(node.id, { locked: false });
				break;
			case "hide":
				this.hideNode(node.id);
				break;
			case "show":
				this.showNode(node.id);
				break;
			case "focus":
				this.focusNode(node.id);
				break;
			case "remove": this.removeNodeById(node.id);
		}
	}
	dispose() {
		this.stopAnimation();
		this.stencil?.dispose();
		this.graph.dispose();
	}
	/** 同步需要动画的边集合（animateAll 或单条边 animated 标记） */
	syncAnimatedEdges() {
		this.graph.getEdges().forEach((e) => {
			const d = e.getData() ?? {};
			if (this.animateAll || d.animated) this.animatedEdges.add(e.id);
		});
	}
	/** 开启全部边动画 */
	animateEdges(on) {
		this.animateAll = on;
		if (on) {
			this.graph.getEdges().forEach((e) => this.animatedEdges.add(e.id));
			this.startAnimation();
		} else {
			this.animatedEdges.clear();
			this.stopAnimation();
		}
	}
	/** 应用 preset 配置（由 config.mode 解析） */
	applyPreset(preset) {
		this.edgeRouter = preset.edgeRouter;
		this.edgeConnector = preset.edgeConnector;
		this.graph.getEdges().forEach((e) => {
			e.setRouter(preset.edgeRouter);
			e.setConnector(preset.edgeConnector);
		});
	}
	/** 单独控制某条边的动画 */
	setEdgeAnimated(id, on) {
		if (on) {
			this.animatedEdges.add(id);
			this.startAnimation();
		} else {
			this.animatedEdges.delete(id);
			this.graph.getCellById(id)?.attr("line/strokeDasharray", null);
			if (this.animatedEdges.size === 0) this.stopAnimation();
		}
	}
	startAnimation() {
		if (this.rafId || typeof requestAnimationFrame === "undefined") return;
		if (this.animatedEdges.size === 0) return;
		this.animatedEdges.forEach((id) => {
			this.graph.getCellById(id)?.attr("line/strokeDasharray", "5 5");
		});
		const tick = () => {
			this.animOffset = (this.animOffset - .4) % 1e3;
			this.animatedEdges.forEach((id) => {
				this.graph.getCellById(id)?.attr("line/strokeDashoffset", this.animOffset);
			});
			this.rafId = requestAnimationFrame(tick);
		};
		this.rafId = requestAnimationFrame(tick);
	}
	stopAnimation() {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}
	}
};
//#endregion
//#region ../../packages/ui/src/components/ReGraph/internals/x6/graphPresets.ts
/**
* Graph Presets — 每种图模式，对应一组默认配置
*
* ReGraph 通过 config 或 mode 选择预设，再与用户传入的 config 合并，
* 从而设置不同的 X6 路由 / 连接器 / 工具栏等
*/
var GRAPH_PRESETS = {
	[ReGraphMode.FORCE]: {
		mode: ReGraphMode.FORCE,
		label: "力导向",
		nodeWidth: 180,
		nodeHeight: 44,
		edgeRouter: "normal",
		edgeConnector: "rounded",
		toolbar: {
			search: true,
			layout: true,
			zoom: true,
			fit: true,
			history: true,
			importExport: true
		},
		layoutOpts: {
			repulsion: 400,
			distance: 140
		}
	},
	[ReGraphMode.TREE]: {
		mode: ReGraphMode.TREE,
		label: "树形",
		nodeWidth: 180,
		nodeHeight: 44,
		edgeRouter: "orth",
		edgeConnector: "rounded",
		toolbar: {
			search: true,
			layout: true,
			zoom: true,
			fit: true
		},
		layoutOpts: {
			direction: "TB",
			rankdir: "TB"
		}
	},
	[ReGraphMode.MIND]: {
		mode: ReGraphMode.MIND,
		label: "思维导图",
		nodeWidth: 200,
		nodeHeight: 44,
		edgeRouter: "orth",
		edgeConnector: "smooth",
		toolbar: {
			search: true,
			layout: true,
			zoom: true,
			fit: true
		},
		layoutOpts: { direction: "LR" }
	},
	[ReGraphMode.CIRCLE]: {
		mode: ReGraphMode.CIRCLE,
		label: "环形",
		nodeWidth: 160,
		nodeHeight: 44,
		edgeRouter: "normal",
		edgeConnector: "rounded",
		toolbar: {
			search: true,
			zoom: true,
			fit: true
		},
		layoutOpts: { radius: 160 }
	},
	[ReGraphMode.CENTER]: {
		mode: ReGraphMode.CENTER,
		label: "中心辐射",
		nodeWidth: 180,
		nodeHeight: 44,
		edgeRouter: "normal",
		edgeConnector: "rounded",
		toolbar: {
			search: true,
			layout: true,
			zoom: true,
			fit: true
		},
		layoutOpts: { centerRadius: 170 }
	},
	[ReGraphMode.FIXED]: {
		mode: ReGraphMode.FIXED,
		label: "固定坐标",
		nodeWidth: 180,
		nodeHeight: 44,
		edgeRouter: "manhattan",
		edgeConnector: "rounded",
		toolbar: {
			search: true,
			zoom: true,
			fit: true,
			palette: true,
			minimap: true
		},
		layoutOpts: {}
	},
	[ReGraphMode.RELATION]: {
		mode: ReGraphMode.RELATION,
		label: "关系图",
		nodeWidth: 180,
		nodeHeight: 44,
		edgeRouter: "manhattan",
		edgeConnector: "rounded",
		toolbar: {
			search: true,
			zoom: true,
			fit: true,
			history: true
		},
		layoutOpts: {}
	}
};
function resolvePreset(mode) {
	return GRAPH_PRESETS[mode] ?? GRAPH_PRESETS[ReGraphMode.FORCE];
}
//#endregion
//#region ../../packages/ui/src/components/ReGraph/internals/X6Graph.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "x6rg__main" };
var _hoisted_2 = {
	key: 0,
	class: "x6rg__toolbar"
};
var _hoisted_3 = { class: "x6rg__toolbar-left" };
var _hoisted_4 = {
	key: 0,
	class: "x6rg__search"
};
var _hoisted_5 = { class: "x6rg__toolbar-right" };
var _hoisted_6 = {
	key: 5,
	class: "x6rg__minimap-tag"
};
var _hoisted_7 = {
	key: 1,
	class: "x6rg__searchbar"
};
var _hoisted_8 = {
	key: 0,
	class: "x6rg__count"
};
var _hoisted_9 = { class: "x6rg__context-menu-title" };
var _hoisted_10 = {
	key: 1,
	class: "x6rg__statusbar"
};
var _hoisted_11 = { key: 0 };
var _hoisted_12 = { key: 1 };
var X6Graph_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "X6Graph",
	props: {
		mode: { default: ReGraphMode.FORCE },
		data: { default: void 0 },
		nodes: { default: void 0 },
		edges: { default: void 0 },
		height: { default: "100%" },
		width: { default: "100%" },
		editable: {
			type: Boolean,
			default: false
		},
		palette: {
			type: Boolean,
			default: false
		},
		showToolbar: {
			type: Boolean,
			default: true
		},
		minimal: {
			type: Boolean,
			default: false
		},
		showMinimap: {
			type: Boolean,
			default: false
		},
		showSearch: {
			type: Boolean,
			default: true
		},
		toolbar: { default: () => ({
			search: true,
			layout: true,
			zoom: true,
			fit: true,
			collapseAll: true,
			expandAll: true,
			importExport: true,
			history: true,
			minimap: true,
			palette: true
		}) },
		fetchExpand: {
			type: Function,
			default: void 0
		},
		enableHistory: {
			type: Boolean,
			default: true
		},
		nodeTypes: { default: () => DEFAULT_NODE_TYPES },
		animated: {
			type: Boolean,
			default: false
		},
		config: { default: void 0 },
		debug: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		"ready",
		"node-click",
		"node-dblclick",
		"node-contextmenu",
		"edge-click",
		"layout-change",
		"search-change",
		"expand",
		"node-menu"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* X6Graph —— ReGraph 的 X6 内核承载组件（agent-flow 风格）
		*
		* 内部封装 X6GraphEngine，提供：
		*   - 多模式布局：force / mind / tree / circle / center / fixed / relation
		*   - agent-flow 节点调色板（左侧拖拽生成节点，editable 模式）
		*   - 工具栏：搜索高亮 / 路径模式 / 缩放 / 适配 / 重排 / 折叠展开 / 撤销重做 / 导入导出 / 小地图
		*   - 节点右键菜单：扩线 / 折叠 / 锁定 / 隐藏 / 删除 / 定位
		*   - 端口连线、缩略图、历史回溯、JSON 导入导出、PNG 导出
		*
		* 主题组件（ReGraph default / koi 及各 ReGraph* 变体）均以不同 props 复用本组件，
		* 只有被选中的主题实现会被打包。
		*/
		const props = __props;
		const emit = __emit;
		const engine = shallowRef(null);
		const canvasRef = ref(null);
		const paletteRef = ref(null);
		const minimapRef = ref(null);
		const containerStyle = computed(() => buildContainerStyle(props.config?.width ?? props.width, props.config?.height ?? props.height));
		const showPalette = computed(() => props.config?.palette ?? ((props.config?.editable ?? props.editable) && (props.config?.toolbar ?? props.toolbar)?.palette !== false));
		/** 通用 config：config 中的字段覆盖同名独立 prop */
		const resolved = computed(() => {
			const cfg = props.config ?? {};
			return {
				mode: normalizeReGraphMode(cfg.mode ?? props.mode),
				editable: cfg.editable ?? props.editable,
				palette: cfg.palette ?? props.palette,
				showToolbar: cfg.showToolbar ?? props.showToolbar,
				showMinimap: cfg.showMinimap ?? props.showMinimap,
				animated: cfg.animated ?? props.animated,
				toolbar: {
					...props.toolbar,
					...cfg.toolbar
				},
				nodeTypes: cfg.nodeTypes ?? props.nodeTypes
			};
		});
		const preset = computed(() => resolvePreset(resolved.value.mode));
		const search = reactive({
			keyword: "",
			mode: "highlight",
			matched: []
		});
		const contextMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			node: null
		});
		const stat = reactive({
			nodes: 0,
			edges: 0,
			loading: 0
		});
		const fileInputRef = ref(null);
		const loadingMap = reactive({});
		function buildData() {
			return buildFinalData(props.data, props.nodes, props.edges);
		}
		function refreshStat() {
			if (!engine.value) return;
			const d = engine.value.getData();
			stat.nodes = d.nodes.length;
			stat.edges = d.edges.length;
		}
		onMounted(async () => {
			await nextTick();
			if (!canvasRef.value) return;
			engine.value = new X6GraphEngine({
				container: canvasRef.value,
				paletteContainer: showPalette.value ? paletteRef.value : null,
				minimapContainer: resolved.value.showMinimap ? minimapRef.value : null,
				paletteTypes: resolved.value.nodeTypes,
				editable: resolved.value.editable,
				mode: resolved.value.mode,
				animated: resolved.value.animated,
				edgeRouter: preset.value.edgeRouter,
				edgeConnector: preset.value.edgeConnector,
				handlers: {
					onReady: (eng) => {
						eng.setData(buildData());
						refreshStat();
						emit("ready", eng);
					},
					onNodeClick: (node, ev) => emit("node-click", node, ev),
					onNodeDblClick: (node, ev) => {
						emit("node-dblclick", node, ev);
						expandNode(node);
					},
					onNodeContextMenu: (node, ev) => {
						contextMenu.visible = true;
						contextMenu.x = ev.clientX;
						contextMenu.y = ev.clientY;
						contextMenu.node = node;
						emit("node-contextmenu", node, ev);
					},
					onEdgeClick: (edge, ev) => emit("edge-click", edge, ev),
					onCellChanged: () => refreshStat()
				}
			});
		});
		watch(() => [
			props.data,
			props.nodes,
			props.edges
		], () => {
			if (engine.value) {
				engine.value.setData(buildData());
				refreshStat();
			}
		}, { deep: true });
		watch(() => [resolved.value.mode, resolved.value.animated], ([m, a]) => {
			if (!engine.value) return;
			engine.value.setMode(m);
			engine.value.applyPreset(preset.value);
			engine.value.animateEdges(!!a);
			engine.value.zoomToFit();
			emit("layout-change", m);
		});
		onBeforeUnmount(() => {
			engine.value?.dispose();
			engine.value = null;
		});
		function runSearch(value) {
			search.keyword = value;
			if (!engine.value) return;
			if (!value.trim()) {
				clearSearch();
				return;
			}
			const matchedIds = engine.value.highlight(value, search.mode);
			const allNodes = engine.value.getData().nodes;
			search.matched = allNodes.filter((n) => matchedIds.includes(n.id));
			emit("search-change", value, search.matched);
		}
		function clearSearch() {
			search.keyword = "";
			search.matched = [];
			engine.value?.clearHighlight();
			emit("search-change", "", []);
		}
		function toggleSearchMode() {
			search.mode = search.mode === "highlight" ? "path" : "highlight";
			if (search.keyword) runSearch(search.keyword);
		}
		function doZoom(delta) {
			engine.value?.zoomBy(delta);
		}
		function doFit() {
			engine.value?.zoomToFit();
			engine.value?.centerContent();
		}
		function doRelayout() {
			engine.value?.relayout();
			engine.value?.zoomToFit();
		}
		function doCollapseAll() {
			engine.value?.graph.getNodes().forEach((n) => engine.value?.hideNode(n.id));
		}
		function doExpandAll() {
			engine.value?.graph.getNodes().forEach((n) => engine.value?.showNode(n.id));
		}
		function undo() {
			engine.value?.undo();
		}
		function redo() {
			engine.value?.redo();
		}
		function exportJSON() {
			if (!engine.value) return;
			const payload = engine.value.toJSON();
			const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `x6-graph-${Date.now()}.json`;
			a.click();
			URL.revokeObjectURL(url);
			message.success("图谱已导出");
		}
		function triggerImport() {
			fileInputRef.value?.click();
		}
		async function handleImportFile(ev) {
			const input = ev.target;
			const file = input.files?.[0];
			if (!file || !engine.value) return;
			try {
				const text = await file.text();
				engine.value.fromJSON(JSON.parse(text));
				refreshStat();
				message.success("图谱已导入");
			} catch (err) {
				message.error(`导入失败：${err instanceof Error ? err.message : String(err)}`);
			} finally {
				input.value = "";
			}
		}
		async function exportPNG() {
			await engine.value?.exportPNG(`x6-graph-${Date.now()}.png`);
		}
		function closeContextMenu() {
			contextMenu.visible = false;
		}
		function onCanvasClick() {
			if (contextMenu.visible) closeContextMenu();
		}
		async function handleMenuAction(action) {
			const node = contextMenu.node;
			closeContextMenu();
			if (!node || !engine.value) return;
			emit("node-menu", action, node);
			if (action === "expand") {
				await expandNode(node);
				return;
			}
			engine.value.handleMenuAction(action, node);
		}
		async function expandNode(node) {
			const fetchExpand = props.fetchExpand;
			if (!fetchExpand) {
				message.info("未配置 fetchExpand，无法扩线");
				return;
			}
			if (!engine.value) return;
			if (loadingMap[node.id]) return;
			loadingMap[node.id] = true;
			stat.loading += 1;
			try {
				const payload = await engine.value.expand(node.id, fetchExpand);
				refreshStat();
				emit("expand", node, payload);
				message.success(`已扩展 ${payload.nodes.length} 个节点`);
			} catch (err) {
				message.error(`扩线失败：${err instanceof Error ? err.message : String(err)}`);
			} finally {
				delete loadingMap[node.id];
				stat.loading -= 1;
			}
		}
		__expose({
			engine,
			addNode: (n) => engine.value?.addNode(n),
			addEdge: (e) => engine.value?.addEdge(e),
			removeNodeById: (id) => engine.value?.removeNodeById(id),
			removeEdgeById: (id) => engine.value?.removeEdgeById(id),
			getNodeById: (id) => engine.value?.getNodeById(id),
			updateNode: (id, patch) => engine.value?.updateNode(id, patch),
			undo,
			redo,
			canUndo: () => engine.value?.canUndo() ?? false,
			canRedo: () => engine.value?.canRedo() ?? false,
			zoomBy: doZoom,
			zoomToFit: doFit,
			relayout: doRelayout,
			runSearch,
			clearSearch,
			toJSON: () => engine.value?.toJSON(),
			fromJSON: (j) => engine.value?.fromJSON(j),
			exportJSON,
			exportPNG,
			getData: () => engine.value?.getData(),
			setData: (d) => engine.value?.setData(d)
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_button_group = resolveComponent("el-button-group");
			return openBlock(), createElementBlock("div", {
				class: "x6rg",
				style: normalizeStyle(containerStyle.value),
				onClick: onCanvasClick
			}, [
				showPalette.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					ref_key: "paletteRef",
					ref: paletteRef,
					class: "x6rg__palette"
				}, null, 512)) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_1, [
					resolved.value.showToolbar && !__props.minimal ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [resolved.value.toolbar.search !== false ? (openBlock(), createElementBlock("div", _hoisted_4, [createVNode(_component_el_input, {
						modelValue: search.keyword,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => search.keyword = $event),
						placeholder: "搜索节点（逗号分隔）",
						clearable: "",
						onInput: runSearch,
						onClear: clearSearch
					}, {
						prefix: withCtx(() => [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(search_default))]),
							_: 1
						})]),
						_: 1
					}, 8, ["modelValue"]), createVNode(_component_el_button_group, null, {
						default: withCtx(() => [createVNode(_component_el_button, {
							type: search.mode === "highlight" ? "primary" : "default",
							onClick: toggleSearchMode
						}, {
							default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode(" 高亮 ", -1)])]),
							_: 1
						}, 8, ["type"]), createVNode(_component_el_button, {
							type: search.mode === "path" ? "primary" : "default",
							onClick: toggleSearchMode
						}, {
							default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode(" 路径 ", -1)])]),
							_: 1
						}, 8, ["type"])]),
						_: 1
					})])) : createCommentVNode("", true)]), createBaseVNode("div", _hoisted_5, [
						resolved.value.toolbar.zoom !== false ? (openBlock(), createBlock(_component_el_button_group, { key: 0 }, {
							default: withCtx(() => [
								createVNode(_component_el_button, { onClick: _cache[1] || (_cache[1] = ($event) => doZoom(20)) }, {
									default: withCtx(() => [createVNode(_component_el_icon, null, {
										default: withCtx(() => [createVNode(unref(zoom_in_default))]),
										_: 1
									})]),
									_: 1
								}),
								createVNode(_component_el_button, { onClick: _cache[2] || (_cache[2] = ($event) => doZoom(-20)) }, {
									default: withCtx(() => [createVNode(_component_el_icon, null, {
										default: withCtx(() => [createVNode(unref(zoom_out_default))]),
										_: 1
									})]),
									_: 1
								}),
								createVNode(_component_el_button, { onClick: doFit }, {
									default: withCtx(() => [createVNode(_component_el_icon, null, {
										default: withCtx(() => [createVNode(unref(full_screen_default))]),
										_: 1
									})]),
									_: 1
								})
							]),
							_: 1
						})) : createCommentVNode("", true),
						resolved.value.toolbar.collapseAll !== false || resolved.value.toolbar.expandAll !== false ? (openBlock(), createBlock(_component_el_button_group, { key: 1 }, {
							default: withCtx(() => [resolved.value.toolbar.collapseAll !== false ? (openBlock(), createBlock(_component_el_button, {
								key: 0,
								onClick: doCollapseAll
							}, {
								default: withCtx(() => [createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(folder_default))]),
									_: 1
								}), _cache[13] || (_cache[13] = createTextVNode("折叠", -1))]),
								_: 1
							})) : createCommentVNode("", true), resolved.value.toolbar.expandAll !== false ? (openBlock(), createBlock(_component_el_button, {
								key: 1,
								onClick: doExpandAll
							}, {
								default: withCtx(() => [createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(expand_default))]),
									_: 1
								}), _cache[14] || (_cache[14] = createTextVNode("展开", -1))]),
								_: 1
							})) : createCommentVNode("", true)]),
							_: 1
						})) : createCommentVNode("", true),
						resolved.value.toolbar.layout !== false ? (openBlock(), createBlock(_component_el_button, {
							key: 2,
							onClick: doRelayout
						}, {
							default: withCtx(() => [createVNode(_component_el_icon, null, {
								default: withCtx(() => [createVNode(unref(refresh_default))]),
								_: 1
							}), _cache[15] || (_cache[15] = createTextVNode("重排", -1))]),
							_: 1
						})) : createCommentVNode("", true),
						resolved.value.toolbar.history !== false && __props.enableHistory ? (openBlock(), createBlock(_component_el_button_group, { key: 3 }, {
							default: withCtx(() => [createVNode(_component_el_button, {
								disabled: !engine.value || !engine.value.canUndo(),
								onClick: undo
							}, {
								default: withCtx(() => [createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(arrow_left_default))]),
									_: 1
								}), _cache[16] || (_cache[16] = createTextVNode("撤销", -1))]),
								_: 1
							}, 8, ["disabled"]), createVNode(_component_el_button, {
								disabled: !engine.value || !engine.value.canRedo(),
								onClick: redo
							}, {
								default: withCtx(() => [createVNode(_component_el_icon, null, {
									default: withCtx(() => [createVNode(unref(arrow_right_default))]),
									_: 1
								}), _cache[17] || (_cache[17] = createTextVNode("重做", -1))]),
								_: 1
							}, 8, ["disabled"])]),
							_: 1
						})) : createCommentVNode("", true),
						resolved.value.toolbar.importExport !== false ? (openBlock(), createBlock(_component_el_button_group, { key: 4 }, {
							default: withCtx(() => [
								createVNode(_component_el_button, { onClick: triggerImport }, {
									default: withCtx(() => [createVNode(_component_el_icon, null, {
										default: withCtx(() => [createVNode(unref(upload_default))]),
										_: 1
									}), _cache[18] || (_cache[18] = createTextVNode("导入", -1))]),
									_: 1
								}),
								createVNode(_component_el_button, { onClick: exportJSON }, {
									default: withCtx(() => [createVNode(_component_el_icon, null, {
										default: withCtx(() => [createVNode(unref(download_default))]),
										_: 1
									}), _cache[19] || (_cache[19] = createTextVNode("导出", -1))]),
									_: 1
								}),
								createVNode(_component_el_button, { onClick: exportPNG }, {
									default: withCtx(() => [..._cache[20] || (_cache[20] = [createTextVNode("PNG", -1)])]),
									_: 1
								})
							]),
							_: 1
						})) : createCommentVNode("", true),
						resolved.value.toolbar.minimap !== false && resolved.value.showMinimap ? (openBlock(), createElementBlock("span", _hoisted_6, "小地图")) : createCommentVNode("", true),
						renderSlot(_ctx.$slots, "toolbar", { engine: engine.value }, void 0, true)
					])])) : createCommentVNode("", true),
					__props.minimal && __props.showSearch ? (openBlock(), createElementBlock("div", _hoisted_7, [createVNode(_component_el_input, {
						modelValue: search.keyword,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => search.keyword = $event),
						placeholder: "搜索节点",
						clearable: "",
						onInput: runSearch,
						onClear: clearSearch
					}, {
						prefix: withCtx(() => [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(search_default))]),
							_: 1
						})]),
						_: 1
					}, 8, ["modelValue"]), search.matched.length ? (openBlock(), createElementBlock("span", _hoisted_8, toDisplayString(search.matched.length) + " 个匹配", 1)) : createCommentVNode("", true)])) : createCommentVNode("", true),
					createBaseVNode("div", {
						ref_key: "canvasRef",
						ref: canvasRef,
						class: "x6rg__canvas"
					}, null, 512),
					resolved.value.showMinimap ? (openBlock(), createElementBlock("div", {
						key: 2,
						ref_key: "minimapRef",
						ref: minimapRef,
						class: "x6rg__minimap"
					}, null, 512)) : createCommentVNode("", true),
					contextMenu.visible ? (openBlock(), createElementBlock("div", {
						key: 3,
						class: "x6rg__context-menu",
						style: normalizeStyle({
							left: contextMenu.x + "px",
							top: contextMenu.y + "px"
						}),
						onClick: _cache[10] || (_cache[10] = withModifiers(() => {}, ["stop"]))
					}, [
						createBaseVNode("div", _hoisted_9, toDisplayString(contextMenu.node?.text), 1),
						createBaseVNode("div", {
							class: "x6rg__context-menu-item",
							onClick: _cache[4] || (_cache[4] = ($event) => handleMenuAction("expand"))
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(connection_default))]),
							_: 1
						}), _cache[21] || (_cache[21] = createBaseVNode("span", null, "扩展节点", -1))]),
						createBaseVNode("div", {
							class: "x6rg__context-menu-item",
							onClick: _cache[5] || (_cache[5] = ($event) => handleMenuAction("lock"))
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(lock_default))]),
							_: 1
						}), _cache[22] || (_cache[22] = createBaseVNode("span", null, "锁定位置", -1))]),
						createBaseVNode("div", {
							class: "x6rg__context-menu-item",
							onClick: _cache[6] || (_cache[6] = ($event) => handleMenuAction("unlock"))
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(unlock_default))]),
							_: 1
						}), _cache[23] || (_cache[23] = createBaseVNode("span", null, "解锁位置", -1))]),
						createBaseVNode("div", {
							class: "x6rg__context-menu-item",
							onClick: _cache[7] || (_cache[7] = ($event) => handleMenuAction("focus"))
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(position_default))]),
							_: 1
						}), _cache[24] || (_cache[24] = createBaseVNode("span", null, "定位到此节点", -1))]),
						createBaseVNode("div", {
							class: "x6rg__context-menu-item",
							onClick: _cache[8] || (_cache[8] = ($event) => handleMenuAction("hide"))
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(histogram_default))]),
							_: 1
						}), _cache[25] || (_cache[25] = createBaseVNode("span", null, "隐藏节点", -1))]),
						createBaseVNode("div", {
							class: "x6rg__context-menu-item x6rg__context-menu-item--danger",
							onClick: _cache[9] || (_cache[9] = ($event) => handleMenuAction("remove"))
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(delete_default))]),
							_: 1
						}), _cache[26] || (_cache[26] = createBaseVNode("span", null, "删除节点", -1))])
					], 4)) : createCommentVNode("", true)
				]),
				createBaseVNode("input", {
					ref_key: "fileInputRef",
					ref: fileInputRef,
					type: "file",
					accept: "application/json",
					hidden: "",
					onChange: handleImportFile
				}, null, 544),
				resolved.value.showToolbar && !__props.minimal ? (openBlock(), createElementBlock("div", _hoisted_10, [
					createBaseVNode("span", null, "节点 " + toDisplayString(stat.nodes), 1),
					createBaseVNode("span", null, "连线 " + toDisplayString(stat.edges), 1),
					search.matched.length ? (openBlock(), createElementBlock("span", _hoisted_11, "匹配 " + toDisplayString(search.matched.length), 1)) : createCommentVNode("", true),
					stat.loading ? (openBlock(), createElementBlock("span", _hoisted_12, "加载中 " + toDisplayString(stat.loading), 1)) : createCommentVNode("", true),
					renderSlot(_ctx.$slots, "status", {
						data: engine.value?.getData(),
						engine: engine.value
					}, void 0, true)
				])) : createCommentVNode("", true)
			], 4);
		};
	}
});
//#endregion
//#region ../../packages/ui/src/components/ReGraph/internals/X6Graph.vue
var X6Graph_default = /*#__PURE__*/ _plugin_vue_export_helper_default(X6Graph_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b8e394f9"]]);
//#endregion
export { X6Graph_default as t };
