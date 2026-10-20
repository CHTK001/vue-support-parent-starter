import { $n as normalizeClass, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReTrend/ReTrend.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	width: "12",
	height: "12",
	viewBox: "0 0 12 12",
	class: "re-trend__arrow"
};
var _hoisted_2 = {
	key: 0,
	points: "6,1 11,10 1,10"
};
var _hoisted_3 = {
	key: 1,
	points: "6,11 1,2 11,2"
};
var _hoisted_4 = { class: "re-trend__label" };
//#endregion
//#region ../../packages/ui/src/components/ReTrend/ReTrend.vue
var ReTrend_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReTrend",
	props: {
		value: {},
		reverseColor: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		const props = __props;
		const isUp = computed(() => props.value >= 0);
		const isDown = computed(() => props.value < 0);
		const formatted = computed(() => {
			return Math.abs(props.value).toFixed(1);
		});
		const colorClass = computed(() => {
			if (props.value >= 0) return props.reverseColor ? "color-down" : "color-up";
			return props.reverseColor ? "color-up" : "color-down";
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", { class: normalizeClass(["re-trend", [colorClass.value, {
				"re-trend--up": isUp.value,
				"re-trend--down": isDown.value
			}]]) }, [(openBlock(), createElementBlock("svg", _hoisted_1, [isUp.value ? (openBlock(), createElementBlock("polygon", _hoisted_2)) : createCommentVNode("", true), isDown.value ? (openBlock(), createElementBlock("polygon", _hoisted_3)) : createCommentVNode("", true)])), createBaseVNode("span", _hoisted_4, toDisplayString(formatted.value) + "%", 1)], 2);
		};
	}
}), [["__scopeId", "data-v-f06249ab"]]);
//#endregion
//#region ../../packages/ui/src/components/ReTrend/index.ts
var plugin = { install(app) {
	app.component("ReTrend", ReTrend_default$1);
} };
var ReTrend_default = ReTrend_default$1;
//#endregion
export { plugin as n, ReTrend_default as t };
