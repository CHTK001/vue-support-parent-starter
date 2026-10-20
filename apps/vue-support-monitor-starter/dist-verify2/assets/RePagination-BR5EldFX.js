const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Modern-DBrAiYy5.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/Modern-vFrDUXoo.css","assets/modern-vars-DGJCsX_d.css"])))=>i.map(i=>d[i]);
import { O as defineAsyncComponent, On as unref, St as resolveComponent, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, v as createBlock } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
//#endregion
//#region ../../packages/ui/src/components/RePagination/RePagination.vue
var RePagination_default = /* @__PURE__ */ defineComponent({
	name: "RePagination",
	__name: "RePagination",
	props: {
		layout: { default: "el" },
		total: {},
		currentPage: { default: void 0 },
		pageSize: { default: void 0 },
		pageSizes: { default: void 0 },
		disabled: {
			type: Boolean,
			default: false
		},
		background: {
			type: Boolean,
			default: false
		},
		paginationLayout: { default: "total, sizes, prev, pager, next, jumper" },
		small: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		"update:currentPage",
		"update:pageSize",
		"current-change",
		"size-change",
		"prev-click",
		"next-click"
	],
	setup(__props, { emit: __emit }) {
		/**
		* RePagination —— 分页组件
		*
		* 透传 el-pagination 全部能力，增加：
		*   - layout：布局变体，"el"（默认，el-pagination）/ "modern"（现代化扁平分页，异步加载）
		*   - paginationLayout：el-pagination 内部布局字符串（如 "total, sizes, prev, pager, next"）
		*
		* 兼容说明：历史调用方把 el-pagination 的布局串直接传给了 `layout`（如
		* `<RePagination layout="prev, pager, next" />`）。为避免这类调用静默失效，
		* `layout` 取到非变体值时按"布局串"处理（见 resolvedPaginationLayout）。
		*/
		const ModernLayout = defineAsyncComponent(() => __vitePreload(() => import("./Modern-DBrAiYy5.js"), __vite__mapDeps([0,1,2,3,4])));
		const props = __props;
		/** 是否为 Modern 变体 */
		const isModern = computed(() => props.layout === "modern");
		/**
		* el-pagination 实际布局串。
		*
		* `layout` 是变体名时用 paginationLayout；否则说明调用方把布局串传给了 `layout`
		* （历史用法），此时以 `layout` 为准 —— 否则该入参会静默失效。
		*/
		const resolvedPaginationLayout = computed(() => {
			const value = props.layout;
			if (value === "el" || value === "modern") return props.paginationLayout;
			return value;
		});
		const emit = __emit;
		return (_ctx, _cache) => {
			const _component_el_pagination = resolveComponent("el-pagination");
			return isModern.value ? (openBlock(), createBlock(unref(ModernLayout), mergeProps({
				key: 0,
				total: __props.total,
				"current-page": __props.currentPage,
				"page-size": __props.pageSize,
				"page-sizes": __props.pageSizes,
				disabled: __props.disabled,
				small: __props.small
			}, _ctx.$attrs, {
				"onUpdate:currentPage": _cache[0] || (_cache[0] = ($event) => emit("update:currentPage", $event)),
				"onUpdate:pageSize": _cache[1] || (_cache[1] = ($event) => emit("update:pageSize", $event)),
				onCurrentChange: _cache[2] || (_cache[2] = ($event) => emit("current-change", $event)),
				onSizeChange: _cache[3] || (_cache[3] = ($event) => emit("size-change", $event)),
				onPrevClick: _cache[4] || (_cache[4] = ($event) => emit("prev-click", $event)),
				onNextClick: _cache[5] || (_cache[5] = ($event) => emit("next-click", $event))
			}), null, 16, [
				"total",
				"current-page",
				"page-size",
				"page-sizes",
				"disabled",
				"small"
			])) : (openBlock(), createBlock(_component_el_pagination, mergeProps({ key: 1 }, _ctx.$attrs, {
				"current-page": __props.currentPage,
				"page-size": __props.pageSize,
				total: __props.total,
				"page-sizes": __props.pageSizes,
				disabled: __props.disabled,
				background: __props.background,
				layout: resolvedPaginationLayout.value,
				small: __props.small,
				"onUpdate:currentPage": _cache[6] || (_cache[6] = ($event) => emit("update:currentPage", $event)),
				"onUpdate:pageSize": _cache[7] || (_cache[7] = ($event) => emit("update:pageSize", $event)),
				onCurrentChange: _cache[8] || (_cache[8] = ($event) => emit("current-change", $event)),
				onSizeChange: _cache[9] || (_cache[9] = ($event) => emit("size-change", $event)),
				onPrevClick: _cache[10] || (_cache[10] = ($event) => emit("prev-click", $event)),
				onNextClick: _cache[11] || (_cache[11] = ($event) => emit("next-click", $event))
			}), null, 16, [
				"current-page",
				"page-size",
				"total",
				"page-sizes",
				"disabled",
				"background",
				"layout",
				"small"
			]));
		};
	}
});
//#endregion
export { RePagination_default as t };
