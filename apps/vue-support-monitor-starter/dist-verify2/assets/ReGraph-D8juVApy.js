import { g as computed, k as defineComponent, mt as openBlock, qt as withCtx, tr as normalizeProps, v as createBlock, w as createSlots, xt as renderSlot, z as guardReactiveProps } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { a as ReGraphMode } from "./internals-C4HpkYaV.js";
import { t as X6Graph_default } from "./X6Graph-Fl5wnKh9.js";
//#endregion
//#region ../../packages/ui/src/components/ReGraph/theme/default/ReGraph.vue
var ReGraph_default = /* @__PURE__ */ defineComponent({
	name: "ReGraph",
	inheritAttrs: true,
	__name: "ReGraph",
	props: {
		mode: { default: ReGraphMode.FORCE },
		data: { default: void 0 },
		nodes: { default: void 0 },
		lines: { default: void 0 },
		edges: { default: void 0 },
		options: { default: void 0 },
		height: { default: "100%" },
		width: { default: "100%" },
		showToolbar: {
			type: Boolean,
			default: true
		},
		showMiniView: {
			type: Boolean,
			default: false
		},
		showMinimap: {
			type: Boolean,
			default: false
		},
		editable: {
			type: Boolean,
			default: false
		},
		debug: {
			type: Boolean,
			default: false
		},
		toolbar: { default: void 0 },
		fetchExpand: {
			type: Function,
			default: void 0
		},
		enableHistory: {
			type: Boolean,
			default: true
		},
		maxHistorySize: { default: 50 },
		config: { default: void 0 }
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
	setup(__props, { emit: __emit }) {
		/**
		* ReGraph default 主题 —— 基于 X6 的全能关系图组件
		*
		* 复用 X6Graph 内核，提供完整工具栏、搜索高亮 / 路径模式、节点右键菜单、
		* 代理流调色板（editable）、小地图、历史回溯与导入导出。
		* API 与原 relation-graph 版基本一致（lines 兼容为 edges 别名）。
		*/
		const props = __props;
		const emit = __emit;
		const edges = computed(() => props.edges ?? props.lines);
		const showMap = computed(() => props.showMiniView || props.showMinimap);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(X6Graph_default, {
				mode: __props.mode,
				data: __props.data,
				nodes: __props.nodes,
				edges: edges.value,
				options: __props.options,
				height: __props.height,
				width: __props.width,
				editable: __props.editable,
				palette: __props.editable,
				"show-toolbar": __props.showToolbar,
				"show-minimap": showMap.value,
				debug: __props.debug,
				toolbar: __props.toolbar,
				"fetch-expand": __props.fetchExpand,
				"enable-history": __props.enableHistory,
				config: __props.config,
				onReady: _cache[0] || (_cache[0] = (e) => emit("ready", e)),
				onNodeClick: _cache[1] || (_cache[1] = (n, ev) => emit("node-click", n, ev)),
				onNodeDblclick: _cache[2] || (_cache[2] = (n, ev) => emit("node-dblclick", n, ev)),
				onNodeContextmenu: _cache[3] || (_cache[3] = (n, ev) => emit("node-contextmenu", n, ev)),
				onEdgeClick: _cache[4] || (_cache[4] = (e, ev) => emit("edge-click", e, ev)),
				onLayoutChange: _cache[5] || (_cache[5] = (m) => emit("layout-change", m)),
				onSearchChange: _cache[6] || (_cache[6] = (k, m) => emit("search-change", k, m)),
				onExpand: _cache[7] || (_cache[7] = (n, p) => emit("expand", n, p)),
				onNodeMenu: _cache[8] || (_cache[8] = (a, n) => emit("node-menu", a, n))
			}, createSlots({ _: 2 }, [_ctx.$slots.toolbar ? {
				name: "toolbar",
				fn: withCtx((slotProps) => [renderSlot(_ctx.$slots, "toolbar", normalizeProps(guardReactiveProps(slotProps)))]),
				key: "0"
			} : void 0, _ctx.$slots.status ? {
				name: "status",
				fn: withCtx((slotProps) => [renderSlot(_ctx.$slots, "status", normalizeProps(guardReactiveProps(slotProps)))]),
				key: "1"
			} : void 0]), 1032, [
				"mode",
				"data",
				"nodes",
				"edges",
				"options",
				"height",
				"width",
				"editable",
				"palette",
				"show-toolbar",
				"show-minimap",
				"debug",
				"toolbar",
				"fetch-expand",
				"enable-history",
				"config"
			]);
		};
	}
});
//#endregion
export { ReGraph_default as default };
