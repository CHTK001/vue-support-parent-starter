import { $ as mergeModels, D as createVNode, E as createTextVNode, Ft as useModel, On as unref, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { h as ReRadioGroup, m as ReRadioButton } from "./ReKit-CFSh6vls.js";
//#region ../../packages/ui/src/components/ReSwitch/layouts/Radio.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-switch-radio" };
var _hoisted_2 = {
	key: 0,
	class: "re-switch-radio__title"
};
//#endregion
//#region ../../packages/ui/src/components/ReSwitch/layouts/Radio.vue
var Radio_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "RadioReSwitch",
	inheritAttrs: false,
	__name: "Radio",
	props: /*@__PURE__*/ mergeModels({
		title: { default: "" },
		radioOnLabel: { default: "是" },
		radioOffLabel: { default: "否" }
	}, {
		"modelValue": {
			type: [
				Boolean,
				String,
				Number
			],
			default: false
		},
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		const props = __props;
		const modelValue = useModel(__props, "modelValue");
		/** 归一：只有 true/"true"/1/"1" 算开，其余一律算关（分段单选只能二选一） */
		const normalized = computed(() => modelValue.value === true || modelValue.value === "true" || modelValue.value === 1 || modelValue.value === "1");
		function onUpdate(value) {
			modelValue.value = value === true || value === "true" || value === 1 || value === "1";
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [props.title ? (openBlock(), createElementBlock("span", _hoisted_2, toDisplayString(props.title), 1)) : createCommentVNode("", true), createVNode(unref(ReRadioGroup), mergeProps({ "model-value": normalized.value }, _ctx.$attrs, { "onUpdate:modelValue": onUpdate }), {
				default: withCtx(() => [createVNode(unref(ReRadioButton), { value: true }, {
					default: withCtx(() => [createTextVNode(toDisplayString(props.radioOnLabel), 1)]),
					_: 1
				}), createVNode(unref(ReRadioButton), { value: false }, {
					default: withCtx(() => [createTextVNode(toDisplayString(props.radioOffLabel), 1)]),
					_: 1
				})]),
				_: 1
			}, 16, ["model-value"])]);
		};
	}
}), [["__scopeId", "data-v-991f6523"]]);
//#endregion
export { Radio_default as default };
