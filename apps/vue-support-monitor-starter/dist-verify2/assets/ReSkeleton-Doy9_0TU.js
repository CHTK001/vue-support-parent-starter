import { St as resolveComponent, et as mergeProps, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, w as createSlots, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
//#endregion
//#region ../../packages/ui/src/components/ReSkeleton/ReSkeleton.vue
var ReSkeleton_default$1 = /* @__PURE__ */ defineComponent({
	name: "ReSkeleton",
	__name: "ReSkeleton",
	props: {
		animated: {
			type: Boolean,
			default: false
		},
		count: { default: 1 },
		loading: {
			type: Boolean,
			default: false
		},
		rows: { default: 3 },
		throttle: { default: 0 }
	},
	setup(__props) {
		/**
		* ReSkeleton —— 骨架屏组件
		*
		* 透传 el-skeleton 全部能力。
		*
		* 说明：原 `layout="modern"` 变体（layouts/Modern.vue）经审计确认全仓无人使用，
		* 已随统一表面方案一并移除；如需现代化骨架屏，请直接在业务侧按统一表面规格实现，
		* 或从 backups/ui-unused-layouts-retire-20260926/ 取回原实现。
		*/
		return (_ctx, _cache) => {
			const _component_el_skeleton = resolveComponent("el-skeleton");
			return openBlock(), createBlock(_component_el_skeleton, mergeProps(_ctx.$attrs, {
				animated: __props.animated,
				count: __props.count,
				loading: __props.loading,
				rows: __props.rows,
				throttle: __props.throttle
			}), createSlots({ _: 2 }, [_ctx.$slots.default ? {
				name: "default",
				fn: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				key: "0"
			} : void 0, _ctx.$slots.template ? {
				name: "template",
				fn: withCtx(() => [renderSlot(_ctx.$slots, "template")]),
				key: "1"
			} : void 0]), 1040, [
				"animated",
				"count",
				"loading",
				"rows",
				"throttle"
			]);
		};
	}
});
//#endregion
//#region ../../packages/ui/src/components/ReSkeleton/index.ts
var plugin = { install(app) {
	app.component("ReSkeleton", ReSkeleton_default$1);
} };
var ReSkeleton_default = ReSkeleton_default$1;
//#endregion
export { plugin as n, ReSkeleton_default as t };
