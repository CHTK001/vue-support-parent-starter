import { g as computed, k as defineComponent, mt as openBlock, v as createBlock } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as X6Graph_default } from "./X6Graph-Fl5wnKh9.js";
//#endregion
//#region ../../packages/ui/src/components/ReGraph/theme/koi/ReGraph.vue
var ReGraph_default = /* @__PURE__ */ defineComponent({
	name: "ReGraph",
	__name: "ReGraph",
	props: {
		data: { default: void 0 },
		nodes: { default: void 0 },
		lines: { default: void 0 },
		edges: { default: void 0 },
		options: { default: void 0 },
		height: { default: "100%" },
		width: { default: "100%" },
		debug: {
			type: Boolean,
			default: false
		},
		editable: {
			type: Boolean,
			default: false
		},
		showSearch: {
			type: Boolean,
			default: true
		},
		fetchExpand: {
			type: Function,
			default: void 0
		}
	},
	emits: [
		"ready",
		"node-click",
		"node-dblclick",
		"node-contextmenu",
		"edge-click",
		"expand"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReGraph koi 主题 —— 精简关系图组件（X6 版）
		*
		* 与 default 差异：仅保留轻量搜索栏（高亮模式）+ 节点右键菜单 + 拖拽连线，
		* 适合仪表盘只读/轻交互场景。API 与原 relation-graph koi 版一致。
		*/
		const props = __props;
		const emit = __emit;
		const edges = computed(() => props.edges ?? props.lines);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(X6Graph_default, {
				mode: "center",
				data: __props.data,
				nodes: __props.nodes,
				edges: edges.value,
				options: __props.options,
				height: __props.height,
				width: __props.width,
				debug: __props.debug,
				editable: __props.editable,
				minimal: true,
				"show-search": __props.showSearch,
				"show-toolbar": false,
				"fetch-expand": __props.fetchExpand,
				onReady: _cache[0] || (_cache[0] = (e) => emit("ready", e)),
				onNodeClick: _cache[1] || (_cache[1] = (n, ev) => emit("node-click", n, ev)),
				onNodeDblclick: _cache[2] || (_cache[2] = (n, ev) => emit("node-dblclick", n, ev)),
				onNodeContextmenu: _cache[3] || (_cache[3] = (n, ev) => emit("node-contextmenu", n, ev)),
				onEdgeClick: _cache[4] || (_cache[4] = (e, ev) => emit("edge-click", e, ev)),
				onExpand: _cache[5] || (_cache[5] = (n, p) => emit("expand", n, p))
			}, null, 8, [
				"data",
				"nodes",
				"edges",
				"options",
				"height",
				"width",
				"debug",
				"editable",
				"show-search",
				"fetch-expand"
			]);
		};
	}
});
//#endregion
export { ReGraph_default as default };
