import { E as createTextVNode, _ as createBaseVNode, b as createElementBlock, k as defineComponent, mt as openBlock, rr as toDisplayString, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReSectionHead/theme/default/ReSectionHead.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-section-head" };
var _hoisted_2 = { class: "re-section-head__main" };
var _hoisted_3 = {
	key: 0,
	class: "re-section-head__title",
	style: { "color": "var(--el-text-color-primary)" }
};
var _hoisted_4 = {
	key: 1,
	class: "re-section-head__desc",
	style: { "color": "var(--el-text-color-secondary)" }
};
var _hoisted_5 = {
	key: 0,
	class: "re-section-head__actions"
};
//#endregion
//#region ../../packages/ui/src/components/ReSectionHead/theme/default/ReSectionHead.vue
var ReSectionHead_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReSectionHead",
	inheritAttrs: true,
	__name: "ReSectionHead",
	props: {
		title: { default: "" },
		description: { default: "" }
	},
	setup(__props) {
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("header", _hoisted_1, [createBaseVNode("div", _hoisted_2, [__props.title || _ctx.$slots.title ? (openBlock(), createElementBlock("h3", _hoisted_3, [renderSlot(_ctx.$slots, "title", {}, () => [createTextVNode(toDisplayString(__props.title), 1)], true)])) : createCommentVNode("", true), __props.description || _ctx.$slots.description ? (openBlock(), createElementBlock("div", _hoisted_4, [renderSlot(_ctx.$slots, "description", {}, () => [createTextVNode(toDisplayString(__props.description), 1)], true)])) : createCommentVNode("", true)]), _ctx.$slots.actions ? (openBlock(), createElementBlock("div", _hoisted_5, [renderSlot(_ctx.$slots, "actions", {}, void 0, true)])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-321d0936"]]);
//#endregion
export { ReSectionHead_default as default };
