import { g as computed, k as defineComponent, mt as openBlock, v as createBlock } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as X6Graph_default } from "./X6Graph-Fl5wnKh9.js";
//#endregion
//#region ../../packages/ui/src/components/ReGraphFixed/theme/koi/ReGraphFixed.vue
var ReGraphFixed_default = /* @__PURE__ */ defineComponent({
	name: "ReGraphFixed",
	__name: "ReGraphFixed",
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
		}
	},
	emits: [
		"ready",
		"node-click",
		"edge-click"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const edges = computed(() => props.edges ?? props.lines);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(X6Graph_default, {
				mode: "fixed",
				data: __props.data,
				nodes: __props.nodes,
				edges: edges.value,
				options: __props.options,
				height: __props.height,
				width: __props.width,
				editable: __props.editable,
				minimal: true,
				"show-search": __props.showSearch,
				"show-toolbar": false,
				debug: __props.debug,
				onReady: _cache[0] || (_cache[0] = (e) => emit("ready", e)),
				onNodeClick: _cache[1] || (_cache[1] = (n, ev) => emit("node-click", n, ev)),
				onEdgeClick: _cache[2] || (_cache[2] = (e, ev) => emit("edge-click", e, ev))
			}, null, 8, [
				"data",
				"nodes",
				"edges",
				"options",
				"height",
				"width",
				"editable",
				"show-search",
				"debug"
			]);
		};
	}
});
//#endregion
export { ReGraphFixed_default as default };
