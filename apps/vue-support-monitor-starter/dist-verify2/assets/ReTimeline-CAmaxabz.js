import { $n as normalizeClass, _ as createBaseVNode, b as createElementBlock, bt as renderList, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, rr as toDisplayString, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReTimeline/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["onClick"];
var _hoisted_2 = { class: "re-timeline__dot-wrapper" };
var _hoisted_3 = {
	key: 0,
	class: "re-timeline__line"
};
var _hoisted_4 = { class: "re-timeline__content" };
var _hoisted_5 = { class: "re-timeline__header" };
var _hoisted_6 = { class: "re-timeline__title" };
var _hoisted_7 = {
	key: 0,
	class: "re-timeline__time"
};
var _hoisted_8 = {
	key: 0,
	class: "re-timeline__description"
};
var _hoisted_9 = {
	key: 0,
	class: "re-timeline__empty"
};
//#endregion
//#region ../../packages/ui/src/components/ReTimeline/index.vue
var ReTimeline_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		items: { default: () => [] },
		activeIndex: { default: -1 },
		mode: { default: "left" },
		size: { default: "default" },
		showLine: {
			type: Boolean,
			default: true
		}
	},
	emits: ["item-click"],
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-timeline", [`re-timeline--${__props.mode}`, `re-timeline--${__props.size}`]]) }, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (item, index) => {
				return openBlock(), createElementBlock("div", {
					key: item.id ?? index,
					class: normalizeClass(["re-timeline__item", { "re-timeline__item--active": __props.activeIndex === index }]),
					onClick: ($event) => _ctx.$emit("item-click", item, index)
				}, [createBaseVNode("div", _hoisted_2, [createBaseVNode("div", {
					class: normalizeClass(["re-timeline__dot", item.dotType ? `re-timeline__dot--${item.dotType}` : ""]),
					style: normalizeStyle(item.dotColor ? { backgroundColor: item.dotColor } : {})
				}, null, 6), __props.showLine && index < __props.items.length - 1 ? (openBlock(), createElementBlock("div", _hoisted_3)) : createCommentVNode("", true)]), createBaseVNode("div", _hoisted_4, [
					createBaseVNode("div", _hoisted_5, [renderSlot(_ctx.$slots, "title", {
						item,
						index
					}, () => [createBaseVNode("span", _hoisted_6, toDisplayString(item.title), 1)], true), renderSlot(_ctx.$slots, "extra", {
						item,
						index
					}, () => [item.time ? (openBlock(), createElementBlock("span", _hoisted_7, toDisplayString(item.time), 1)) : createCommentVNode("", true)], true)]),
					renderSlot(_ctx.$slots, "description", {
						item,
						index
					}, () => [item.description ? (openBlock(), createElementBlock("p", _hoisted_8, toDisplayString(item.description), 1)) : createCommentVNode("", true)], true),
					renderSlot(_ctx.$slots, "content", {
						item,
						index
					}, void 0, true)
				])], 10, _hoisted_1);
			}), 128)), !__props.items.length ? (openBlock(), createElementBlock("div", _hoisted_9, [renderSlot(_ctx.$slots, "empty", {}, () => [_cache[0] || (_cache[0] = createBaseVNode("span", { class: "re-timeline__empty-text" }, "暂无数据", -1))], true)])) : createCommentVNode("", true)], 2);
		};
	}
}), [["__scopeId", "data-v-d110cc47"]]);
//#endregion
//#region ../../packages/ui/src/components/ReTimeline/index.ts
var plugin = { install(app) {
	app.component("ReTimeline", ReTimeline_default$1);
} };
var ReTimeline_default = ReTimeline_default$1;
//#endregion
export { ReTimeline_default as default, plugin as install };
