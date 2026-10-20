import { $ as mergeModels, $n as normalizeClass, D as createVNode, Ft as useModel, On as unref, St as resolveComponent, Tn as toRefs, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElSwitch } from "./switch-CNOkf5eO.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReSwitch/layouts/CardReSwitch.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-switch-card__body" };
var _hoisted_2 = {
	key: 0,
	class: "re-switch-card__head"
};
var _hoisted_3 = { class: "re-switch-card__title" };
var _hoisted_4 = {
	key: 0,
	class: "re-switch-card__sub"
};
var _hoisted_5 = {
	key: 1,
	class: "re-switch-card__desc"
};
//#endregion
//#region ../../packages/ui/src/components/ReSwitch/layouts/CardReSwitch.vue
var CardReSwitch_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "CardReSwitch",
	inheritAttrs: true,
	__name: "CardReSwitch",
	props: /*@__PURE__*/ mergeModels({
		title: {},
		sub: {},
		tip: {},
		description: {},
		cardHideSwitch: { type: Boolean },
		cardShowRadio: { type: Boolean }
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
		const { cardHideSwitch, cardShowRadio } = toRefs(__props);
		const modelValue = useModel(__props, "modelValue");
		const isActive = computed(() => Boolean(modelValue.value));
		/**
		* 卡片整体点击切换：
		*  - 默认（cardShowRadio=false）：点击卡片任意位置切换开关
		*  - radio 模式（cardShowRadio=true）：点击卡片仅设置为激活状态，不再 toggle off
		*/
		function handleCardClick() {
			if (cardShowRadio.value) modelValue.value = true;
			else modelValue.value = !isActive.value;
		}
		return (_ctx, _cache) => {
			const _component_QuestionFilled = resolveComponent("QuestionFilled");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_tooltip = resolveComponent("el-tooltip");
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(["re-switch-card", {
					"re-switch-card--active": isActive.value,
					"re-switch-card--hidden": unref(cardHideSwitch),
					"re-switch-card--clickable": !unref(cardShowRadio)
				}]),
				onClick: handleCardClick
			}, [createBaseVNode("div", _hoisted_1, [__props.title || __props.tip ? (openBlock(), createElementBlock("div", _hoisted_2, [
				createBaseVNode("span", _hoisted_3, toDisplayString(__props.title), 1),
				__props.sub ? (openBlock(), createElementBlock("span", _hoisted_4, toDisplayString(__props.sub), 1)) : createCommentVNode("", true),
				__props.tip ? (openBlock(), createBlock(_component_el_tooltip, {
					key: 1,
					content: __props.tip,
					placement: "top"
				}, {
					default: withCtx(() => [createVNode(_component_el_icon, { class: "re-switch-card__tip" }, {
						default: withCtx(() => [createVNode(_component_QuestionFilled)]),
						_: 1
					})]),
					_: 1
				}, 8, ["content"])) : createCommentVNode("", true)
			])) : createCommentVNode("", true), __props.description ? (openBlock(), createElementBlock("p", _hoisted_5, toDisplayString(__props.description), 1)) : createCommentVNode("", true)]), !unref(cardHideSwitch) ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: "re-switch-card__switch",
				onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"]))
			}, [createVNode(unref(ElSwitch), mergeProps(_ctx.$attrs, {
				modelValue: modelValue.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => modelValue.value = $event)
			}), null, 16, ["modelValue"])])) : createCommentVNode("", true)], 2);
		};
	}
}), [["__scopeId", "data-v-9f989f0d"]]);
//#endregion
export { CardReSwitch_default as default };
