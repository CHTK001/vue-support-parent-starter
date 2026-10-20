import { $ as mergeModels, Ft as useModel, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReSwitch/layouts/Modern.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "rm-switch__title" };
var _hoisted_2 = {
	key: 0,
	class: "rm-switch__sub"
};
var _hoisted_3 = {
	key: 1,
	class: "rm-switch__desc"
};
var _hoisted_4 = ["disabled", "aria-pressed"];
//#endregion
//#region ../../packages/ui/src/components/ReSwitch/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReSwitchModern",
	inheritAttrs: true,
	__name: "Modern",
	props: /*@__PURE__*/ mergeModels({
		title: { default: "" },
		sub: { default: "" },
		tip: { default: "" },
		description: { default: "" },
		disabled: {
			type: Boolean,
			default: false
		}
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
		/**
		* ReSwitch Modern 布局 —— 现代化扁平开关
		*
		* 设计要点：
		*   - 极致扁平胶囊轨道（active 渐变 + 内白色高光 + 主色发光）
		*   - 圆形滑块（白底 + 阴影 + 弹性位移）
		*   - 焦点环（focus-visible 4px 主色 ring）
		*   - 标题 + 副标题 + 描述 三层排版
		*   - 禁用态灰度
		*/
		const props = __props;
		const modelValue = useModel(__props, "modelValue");
		const isActive = computed(() => Boolean(modelValue.value));
		function toggle() {
			if (props.disabled) return;
			modelValue.value = !modelValue.value;
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", mergeProps({ class: ["rm-switch", {
				"rm-switch--active": isActive.value,
				"rm-switch--disabled": __props.disabled
			}] }, _ctx.$attrs), [__props.title || __props.sub || __props.description ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: "rm-switch__info",
				onClick: toggle
			}, [
				createBaseVNode("span", _hoisted_1, toDisplayString(__props.title), 1),
				__props.sub ? (openBlock(), createElementBlock("span", _hoisted_2, toDisplayString(__props.sub), 1)) : createCommentVNode("", true),
				__props.description ? (openBlock(), createElementBlock("span", _hoisted_3, toDisplayString(__props.description), 1)) : createCommentVNode("", true)
			])) : createCommentVNode("", true), createBaseVNode("button", {
				type: "button",
				class: "rm-switch__track",
				disabled: __props.disabled,
				"aria-pressed": isActive.value,
				onClick: toggle
			}, [..._cache[0] || (_cache[0] = [createBaseVNode("span", { class: "rm-switch__thumb" }, null, -1)])], 8, _hoisted_4)], 16);
		};
	}
}), [["__scopeId", "data-v-a55dafd8"]]);
//#endregion
export { Modern_default as default };
