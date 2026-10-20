import { g as computed, k as defineComponent, mt as openBlock, qt as withCtx, tr as normalizeProps, v as createBlock, vn as ref, xt as renderSlot, z as guardReactiveProps } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ReFlowGraph_default$1 } from "./ReFlowGraph-DlkGBrS3.js";
//#endregion
//#region ../../packages/ui/src/components/ReFlowGraph/theme/koi/ReFlowGraph.vue
var ReFlowGraph_default = /* @__PURE__ */ defineComponent({
	name: "ReFlowGraph",
	__name: "ReFlowGraph",
	props: {
		data: { default: () => ({
			nodes: [],
			edges: []
		}) },
		nodeTypes: { default: () => [] },
		height: { default: "100%" },
		width: { default: "100%" },
		editable: {
			type: Boolean,
			default: false
		},
		showToolbar: {
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
		"edge-click",
		"edge-connected"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReFlowGraph koi 主题 —— 设计器的视图形态
		*
		* 只做一件事：把 editable 翻译成 readonly / showPalette，事件与实例方法透传给 default 外壳。
		* 具名插槽按外壳实际提供的 #properties / #toolbar 逐个转发，漏掉任一个页面就拿不到对应区域。
		*/
		const props = __props;
		const emit = __emit;
		const shell = ref(null);
		const shellData = computed(() => props.data);
		__expose({
			get engine() {
				return shell.value?.engine ?? null;
			},
			addNode: (type) => shell.value?.addNode(type) ?? null,
			check: () => shell.value?.check() ?? [],
			getData: () => shell.value?.getData() ?? {
				nodes: [],
				edges: []
			},
			exportPNG: (name) => shell.value?.exportPNG(name),
			focus: (id) => shell.value?.focus(id),
			/**
			* 缩放到能看全（面板空态「全览流程节点」用）。
			*
			* <p>必须走外壳的 {@code fit} 而不是直接 {@code engine.fitCenter()}：
			* 外壳那版会同步工具条倍率，直接调引擎图缩放变了、倍率显示还停在旧值。</p>
			*/
			fit: () => shell.value?.fit(),
			/** 按拓扑分层重排（工具条「整理布局」），同样要经外壳才能同步倍率 */
			tidy: () => shell.value?.tidy()
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(ReFlowGraph_default$1, {
				ref_key: "shell",
				ref: shell,
				data: shellData.value,
				"node-types": __props.nodeTypes,
				height: __props.height,
				width: __props.width,
				"show-toolbar": __props.showToolbar,
				"show-palette": __props.editable,
				"show-properties": __props.editable,
				readonly: !__props.editable,
				"start-type": __props.startType,
				"end-type": __props.endType,
				"properties-title": __props.propertiesTitle,
				"show-minimap": __props.showMinimap,
				panning: __props.panning,
				zoom: __props.zoom,
				"node-draggable": __props.nodeDraggable,
				"menu-items": __props.menuItems,
				"node-component": __props.nodeComponent,
				onReady: _cache[0] || (_cache[0] = (e) => emit("ready", e)),
				onChange: _cache[1] || (_cache[1] = (d) => emit("change", d)),
				onSelect: _cache[2] || (_cache[2] = (s) => emit("select", s)),
				onNodeClick: _cache[3] || (_cache[3] = (n, ev) => emit("node-click", n, ev)),
				onNodeDblclick: _cache[4] || (_cache[4] = (n, ev) => emit("node-dblclick", n, ev)),
				onEdgeClick: _cache[5] || (_cache[5] = (e, ev) => emit("edge-click", e, ev)),
				onEdgeConnected: _cache[6] || (_cache[6] = (e) => emit("edge-connected", e))
			}, {
				properties: withCtx((slotProps) => [renderSlot(_ctx.$slots, "properties", normalizeProps(guardReactiveProps(slotProps)))]),
				toolbar: withCtx((slotProps) => [renderSlot(_ctx.$slots, "toolbar", normalizeProps(guardReactiveProps(slotProps)))]),
				"properties-footer": withCtx((slotProps) => [renderSlot(_ctx.$slots, "properties-footer", normalizeProps(guardReactiveProps(slotProps)))]),
				_: 3
			}, 8, [
				"data",
				"node-types",
				"height",
				"width",
				"show-toolbar",
				"show-palette",
				"show-properties",
				"readonly",
				"start-type",
				"end-type",
				"properties-title",
				"show-minimap",
				"panning",
				"zoom",
				"node-draggable",
				"menu-items",
				"node-component"
			]);
		};
	}
});
//#endregion
export { ReFlowGraph_default as default };
