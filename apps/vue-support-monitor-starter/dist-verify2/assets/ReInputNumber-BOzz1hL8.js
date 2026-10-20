const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Modern-DGhqdAas.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/Modern-CYkRcDlF.css","assets/modern-vars-DGJCsX_d.css"])))=>i.map(i=>d[i]);
import { $ as mergeModels, Ft as useModel, O as defineAsyncComponent, On as unref, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, v as createBlock } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as ElInputNumber } from "./input-number-C5-G8rpP.js";
//#endregion
//#region ../../packages/ui/src/components/ReInputNumber/ReInputNumber.vue
var ReInputNumber_default$1 = /* @__PURE__ */ defineComponent({
	name: "ReInputNumber",
	inheritAttrs: true,
	__name: "ReInputNumber",
	props: /*@__PURE__*/ mergeModels({
		layout: { default: "modern" },
		min: { default: void 0 },
		max: { default: void 0 },
		step: { default: 1 },
		stepStrictly: {
			type: Boolean,
			default: false
		},
		precision: { default: void 0 },
		placeholder: { default: "" },
		disabled: {
			type: Boolean,
			default: false
		},
		readonly: {
			type: Boolean,
			default: false
		},
		controls: {
			type: Boolean,
			default: true
		},
		controlsPosition: { default: "" },
		size: { default: "default" },
		prefix: { default: "" },
		suffix: { default: "" }
	}, {
		"modelValue": { default: void 0 },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* ReInputNumber —— 数字输入框组件
		*
		* 多种布局模式（与 ReSelect 等组件一致的分发模式）：
		*   - "modern" / "card"：现代化扁平数字输入框，**默认**；加减按钮左右分置
		*   - "default"：原生 el-input-number（需显式指定 layout="default"）
		*
		* 用法：
		*   <ReInputNumber v-model="num" />                              <!-- modern（默认） -->
		*   <ReInputNumber layout="default" v-model="num" :min="0" />     <!-- 原生 -->
		*/
		const ModernLayout = defineAsyncComponent(() => __vitePreload(() => import("./Modern-DGhqdAas.js"), __vite__mapDeps([0,1,2,3,4,5])));
		const model = useModel(__props, "modelValue");
		const props = __props;
		/** 统一处理 modern / card 别名（card 为 modern 的向后兼容别名） */
		const resolvedLayout = computed(() => {
			const l = props.layout;
			if (l === "card") return "modern";
			return l ?? "default";
		});
		return (_ctx, _cache) => {
			return resolvedLayout.value === "modern" ? (openBlock(), createBlock(unref(ModernLayout), mergeProps({
				key: 0,
				"model-value": model.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = (v) => model.value = v)
			}, _ctx.$attrs, {
				min: __props.min,
				max: __props.max,
				step: __props.step,
				"step-strictly": __props.stepStrictly,
				precision: __props.precision,
				placeholder: __props.placeholder,
				disabled: __props.disabled,
				readonly: __props.readonly,
				controls: __props.controls,
				"controls-position": __props.controlsPosition,
				size: __props.size,
				prefix: __props.prefix,
				suffix: __props.suffix
			}), null, 16, [
				"model-value",
				"min",
				"max",
				"step",
				"step-strictly",
				"precision",
				"placeholder",
				"disabled",
				"readonly",
				"controls",
				"controls-position",
				"size",
				"prefix",
				"suffix"
			])) : (openBlock(), createBlock(unref(ElInputNumber), mergeProps({
				key: 1,
				modelValue: model.value,
				"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => model.value = $event)
			}, _ctx.$attrs, {
				min: __props.min,
				max: __props.max,
				step: __props.step,
				"step-strictly": __props.stepStrictly,
				precision: __props.precision,
				placeholder: __props.placeholder,
				disabled: __props.disabled,
				readonly: __props.readonly,
				controls: __props.controls,
				"controls-position": (__props.controlsPosition === "right" ? "right" : "") || void 0,
				size: __props.size
			}), null, 16, [
				"modelValue",
				"min",
				"max",
				"step",
				"step-strictly",
				"precision",
				"placeholder",
				"disabled",
				"readonly",
				"controls",
				"controls-position",
				"size"
			]));
		};
	}
});
//#endregion
//#region ../../packages/ui/src/components/ReInputNumber/index.ts
var plugin = { install(app) {
	app.component("ReInputNumber", ReInputNumber_default$1);
} };
var ReInputNumber_default = ReInputNumber_default$1;
//#endregion
export { plugin as n, ReInputNumber_default as t };
