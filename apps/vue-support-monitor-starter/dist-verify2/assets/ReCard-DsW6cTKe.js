import { $n as normalizeClass, E as createTextVNode, _ as createBaseVNode, b as createElementBlock, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReCard/theme/koi/ReCard.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "koi-card__header"
};
var _hoisted_2 = {
	key: 1,
	class: "koi-card__footer"
};
//#endregion
//#region ../../packages/ui/src/components/ReCard/theme/koi/ReCard.vue
var ReCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReCard",
	inheritAttrs: true,
	__name: "ReCard",
	props: {
		header: { default: "" },
		shadow: { default: "always" },
		bodyStyle: { default: () => ({}) },
		isFlex: {
			type: Boolean,
			default: true
		}
	},
	setup(__props) {
		/**
		* ReCard koi 主题 —— 卡片组件（KoiCard 移植）
		*
		* 独立 div 结构，不依赖 element-plus，样式走主题令牌（--theme-* 变量）。
		* 兼容 default 主题的 header / shadow / bodyStyle props，业务切换主题不破 API。
		*/
		const props = __props;
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["koi-card", { "flex-1": props.isFlex }]) }, [
				__props.header || _ctx.$slots.header ? (openBlock(), createElementBlock("div", _hoisted_1, [renderSlot(_ctx.$slots, "header", {}, () => [createTextVNode(toDisplayString(__props.header), 1)], true)])) : createCommentVNode("", true),
				createBaseVNode("div", {
					class: "koi-card__body",
					style: normalizeStyle(__props.bodyStyle)
				}, [renderSlot(_ctx.$slots, "default", {}, void 0, true)], 4),
				_ctx.$slots.footer ? (openBlock(), createElementBlock("div", _hoisted_2, [renderSlot(_ctx.$slots, "footer", {}, void 0, true)])) : createCommentVNode("", true)
			], 2);
		};
	}
}), [["__scopeId", "data-v-21c775e9"]]);
//#endregion
export { ReCard_default as default };
