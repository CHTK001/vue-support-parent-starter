import { $ as mergeModels, Ft as useModel, On as unref, et as mergeProps, k as defineComponent, mt as openBlock, v as createBlock } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElDatePicker } from "./date-picker-D-vMtORE.js";
//#endregion
//#region ../../packages/ui/src/components/ReDatePicker/ReDatePicker.vue
var ReDatePicker_default$1 = /* @__PURE__ */ defineComponent({
	name: "ReDatePicker",
	inheritAttrs: true,
	__name: "ReDatePicker",
	props: /*@__PURE__*/ mergeModels({
		type: { default: void 0 },
		placeholder: { default: void 0 },
		startPlaceholder: { default: void 0 },
		endPlaceholder: { default: void 0 },
		format: { default: void 0 },
		valueFormat: { default: void 0 },
		clearable: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		readonly: {
			type: Boolean,
			default: false
		},
		size: { default: void 0 },
		rangeSeparator: { default: void 0 },
		disabledDate: {
			type: Function,
			default: void 0
		},
		shortcuts: { default: void 0 }
	}, {
		"modelValue": { default: null },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* ReDatePicker —— 日期选择组件
		*
		* 透传 el-date-picker 全部能力（v-model + 主要 props）。
		*
		* 说明：原 `layout="modern"` 变体（layouts/Modern.vue）经审计确认全仓无人使用，
		* 已随统一表面方案移除；需要时从 backups/ui-unused-layouts-retire-20260926/ 取回。
		*/
		const model = useModel(__props, "modelValue");
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElDatePicker), mergeProps({
				modelValue: model.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => model.value = $event)
			}, _ctx.$attrs, {
				type: __props.type,
				placeholder: __props.placeholder,
				"start-placeholder": __props.startPlaceholder,
				"end-placeholder": __props.endPlaceholder,
				format: __props.format,
				"value-format": __props.valueFormat,
				clearable: __props.clearable,
				disabled: __props.disabled,
				readonly: __props.readonly,
				size: __props.size,
				"range-separator": __props.rangeSeparator,
				"disabled-date": __props.disabledDate,
				shortcuts: __props.shortcuts
			}), null, 16, [
				"modelValue",
				"type",
				"placeholder",
				"start-placeholder",
				"end-placeholder",
				"format",
				"value-format",
				"clearable",
				"disabled",
				"readonly",
				"size",
				"range-separator",
				"disabled-date",
				"shortcuts"
			]);
		};
	}
});
//#endregion
//#region ../../packages/ui/src/components/ReDatePicker/index.ts
var plugin = { install(app) {
	app.component("ReDatePicker", ReDatePicker_default$1);
} };
var ReDatePicker_default = ReDatePicker_default$1;
//#endregion
export { ReDatePicker_default as default, plugin as install };
