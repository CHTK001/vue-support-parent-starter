import { $n as normalizeClass, D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                    */
import { t as ReCountup_default } from "./ReCountup-B5od-7Lk.js";
import { t as ReTrend_default } from "./ReTrend-0m6aPVXc.js";
//#region ../../packages/ui/src/components/ReStat/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-stat__header" };
var _hoisted_2 = { class: "re-stat__title" };
var _hoisted_3 = {
	key: 0,
	class: "re-stat__extra"
};
var _hoisted_4 = { class: "re-stat__body" };
var _hoisted_5 = {
	key: 0,
	class: "re-stat__footer"
};
var _hoisted_6 = { class: "re-stat__description" };
//#endregion
//#region ../../packages/ui/src/components/ReStat/index.vue
var ReStat_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		title: {},
		value: {},
		decimals: { default: 0 },
		duration: { default: 1500 },
		prefix: {},
		suffix: {},
		trend: {},
		reverseTrend: {
			type: Boolean,
			default: false
		},
		description: {},
		icon: {},
		iconColor: {},
		size: { default: "default" },
		loading: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* ReStat —— 数据统计卡片
		*
		* 组合 ReCountup + ReTrend + 图标，用于仪表盘/概览页
		*   <ReStat title="访问量" :value="12345" :trend="12.5" />
		*/
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-stat re-surface re-surface--hover", [`re-stat--${__props.size}`, { "is-loading": __props.loading }]]) }, [
				createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [__props.icon ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: "re-stat__icon",
					style: normalizeStyle({ color: __props.iconColor })
				}, [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))], 4)) : createCommentVNode("", true), createBaseVNode("span", null, toDisplayString(__props.title), 1)]), _ctx.$slots.extra ? (openBlock(), createElementBlock("div", _hoisted_3, [renderSlot(_ctx.$slots, "extra", {}, void 0, true)])) : createCommentVNode("", true)]),
				createBaseVNode("div", _hoisted_4, [createVNode(ReCountup_default, {
					class: "re-stat__value",
					value: __props.value,
					decimals: __props.decimals,
					duration: __props.duration,
					prefix: __props.prefix,
					suffix: __props.suffix
				}, null, 8, [
					"value",
					"decimals",
					"duration",
					"prefix",
					"suffix"
				]), __props.trend !== void 0 && __props.trend !== null ? (openBlock(), createBlock(unref(ReTrend_default), {
					key: 0,
					value: __props.trend,
					"reverse-color": __props.reverseTrend,
					class: "re-stat__trend"
				}, null, 8, ["value", "reverse-color"])) : createCommentVNode("", true)]),
				__props.description || _ctx.$slots.default ? (openBlock(), createElementBlock("div", _hoisted_5, [renderSlot(_ctx.$slots, "default", {}, () => [createBaseVNode("span", _hoisted_6, toDisplayString(__props.description), 1)], true)])) : createCommentVNode("", true)
			], 2);
		};
	}
}), [["__scopeId", "data-v-f68b8007"]]);
//#endregion
//#region ../../packages/ui/src/components/ReStat/index.ts
var plugin = { install(app) {
	app.component("ReStat", ReStat_default$1);
} };
var ReStat_default = ReStat_default$1;
//#endregion
export { ReStat_default as default, plugin as install };
