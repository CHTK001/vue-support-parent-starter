import { $ as mergeModels, D as createVNode, Ft as useModel, On as unref, b as createElementBlock, et as mergeProps, k as defineComponent, mt as openBlock, rr as toDisplayString, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElSwitch } from "./switch-CNOkf5eO.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReSwitch/layouts/DefaultReSwitch.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-switch-default" };
var _hoisted_2 = {
	key: 0,
	class: "re-switch-default__title"
};
//#endregion
//#region ../../packages/ui/src/components/ReSwitch/layouts/DefaultReSwitch.vue
var DefaultReSwitch_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "DefaultReSwitch",
	inheritAttrs: true,
	__name: "DefaultReSwitch",
	props: /*@__PURE__*/ mergeModels({ title: {} }, {
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
		const modelValue = useModel(__props, "modelValue");
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [__props.title ? (openBlock(), createElementBlock("span", _hoisted_2, toDisplayString(__props.title), 1)) : createCommentVNode("", true), createVNode(unref(ElSwitch), mergeProps(_ctx.$attrs, {
				modelValue: modelValue.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => modelValue.value = $event)
			}), null, 16, ["modelValue"])]);
		};
	}
}), [["__scopeId", "data-v-3c6e6e16"]]);
//#endregion
export { DefaultReSwitch_default as default };
