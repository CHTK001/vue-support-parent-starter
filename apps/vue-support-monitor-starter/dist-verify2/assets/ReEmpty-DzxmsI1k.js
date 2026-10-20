const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Modern-D6cV3EAp.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/Modern-BzZh6EEw.css","assets/modern-vars-DGJCsX_d.css"])))=>i.map(i=>d[i]);
import { O as defineAsyncComponent, On as unref, St as resolveComponent, et as mergeProps, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, w as createSlots, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
//#endregion
//#region ../../packages/ui/src/components/ReEmpty/ReEmpty.vue
var ReEmpty_default$1 = /* @__PURE__ */ defineComponent({
	name: "ReEmpty",
	__name: "ReEmpty",
	props: {
		layout: { default: "el" },
		image: { default: void 0 },
		imageSize: { default: void 0 },
		description: { default: void 0 }
	},
	setup(__props) {
		/**
		* ReEmpty —— 空状态组件
		*
		* 透传 el-empty 全部能力。
		*   - layout：布局变体，"el"（默认，el-empty）/ "modern"（现代化扁平空状态，异步加载）
		*/
		const ModernLayout = defineAsyncComponent(() => __vitePreload(() => import("./Modern-D6cV3EAp.js"), __vite__mapDeps([0,1,2,3,4])));
		return (_ctx, _cache) => {
			const _component_el_empty = resolveComponent("el-empty");
			return __props.layout === "modern" ? (openBlock(), createBlock(unref(ModernLayout), mergeProps({
				key: 0,
				description: __props.description,
				image: __props.image,
				"image-size": __props.imageSize
			}, _ctx.$attrs), createSlots({ _: 2 }, [
				_ctx.$slots.default ? {
					name: "default",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
					key: "0"
				} : void 0,
				_ctx.$slots.image ? {
					name: "image",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "image")]),
					key: "1"
				} : void 0,
				_ctx.$slots.description ? {
					name: "description",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "description")]),
					key: "2"
				} : void 0
			]), 1040, [
				"description",
				"image",
				"image-size"
			])) : (openBlock(), createBlock(_component_el_empty, mergeProps({ key: 1 }, _ctx.$attrs, {
				image: __props.image,
				"image-size": __props.imageSize,
				description: __props.description
			}), createSlots({ _: 2 }, [
				_ctx.$slots.default ? {
					name: "default",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
					key: "0"
				} : void 0,
				_ctx.$slots.image ? {
					name: "image",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "image")]),
					key: "1"
				} : void 0,
				_ctx.$slots.description ? {
					name: "description",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "description")]),
					key: "2"
				} : void 0
			]), 1040, [
				"image",
				"image-size",
				"description"
			]));
		};
	}
});
//#endregion
//#region ../../packages/ui/src/components/ReEmpty/index.ts
var plugin = { install(app) {
	app.component("ReEmpty", ReEmpty_default$1);
} };
var ReEmpty_default = ReEmpty_default$1;
//#endregion
export { plugin as n, ReEmpty_default as t };
