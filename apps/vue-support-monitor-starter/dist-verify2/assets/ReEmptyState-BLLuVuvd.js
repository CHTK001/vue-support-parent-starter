import { $n as normalizeClass, D as createVNode, E as createTextVNode, St as resolveComponent, b as createElementBlock, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReEmptyState/theme/default/ReEmptyState.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["aria-live"];
var _hoisted_2 = {
	key: 0,
	class: "re-empty-state__icon",
	style: { "color": "var(--el-text-color-placeholder)" }
};
var _hoisted_3 = {
	key: 1,
	class: "re-empty-state__title",
	style: { "color": "var(--el-text-color-primary)" }
};
var _hoisted_4 = {
	key: 2,
	class: "re-empty-state__desc",
	style: { "color": "var(--el-text-color-secondary)" }
};
var _hoisted_5 = {
	key: 3,
	class: "re-empty-state__actions flex flex-wrap justify-center gap-2"
};
//#endregion
//#region ../../packages/ui/src/components/ReEmptyState/theme/default/ReEmptyState.vue
var ReEmptyState_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReEmptyState",
	inheritAttrs: true,
	__name: "ReEmptyState",
	props: {
		title: { default: "" },
		description: { default: "" },
		icon: { default: void 0 },
		iconSize: { default: 48 },
		loading: {
			type: Boolean,
			default: false
		},
		size: { default: "default" }
	},
	setup(__props) {
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(["re-empty-state flex flex-col items-center justify-center gap-3 px-10 py-10 text-center", [`re-empty-state--${__props.size}`, { "is-loading": __props.loading }]]),
				role: "status",
				"aria-live": __props.loading ? "polite" : "off"
			}, [
				_ctx.$slots.icon || __props.icon ? (openBlock(), createElementBlock("div", _hoisted_2, [renderSlot(_ctx.$slots, "icon", {}, () => [createVNode(_component_el_icon, { size: __props.iconSize }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
					_: 1
				}, 8, ["size"])], true)])) : createCommentVNode("", true),
				__props.title || _ctx.$slots.title ? (openBlock(), createElementBlock("h3", _hoisted_3, [renderSlot(_ctx.$slots, "title", {}, () => [createTextVNode(toDisplayString(__props.title), 1)], true)])) : createCommentVNode("", true),
				__props.description || _ctx.$slots.description ? (openBlock(), createElementBlock("p", _hoisted_4, [renderSlot(_ctx.$slots, "description", {}, () => [createTextVNode(toDisplayString(__props.description), 1)], true)])) : createCommentVNode("", true),
				_ctx.$slots.default ? (openBlock(), createElementBlock("div", _hoisted_5, [renderSlot(_ctx.$slots, "default", {}, void 0, true)])) : createCommentVNode("", true)
			], 10, _hoisted_1);
		};
	}
}), [["__scopeId", "data-v-27c82b0e"]]);
//#endregion
export { ReEmptyState_default as default };
