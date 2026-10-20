import { E as createTextVNode, T as createStaticVNode, _ as createBaseVNode, b as createElementBlock, et as mergeProps, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReEmpty/layouts/Modern.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = [
	"src",
	"width",
	"height"
];
var _hoisted_2 = {
	key: 1,
	viewBox: "0 0 120 120",
	fill: "none",
	class: "rm-empty__svg"
};
var _hoisted_3 = { class: "rm-empty__description" };
var _hoisted_4 = {
	key: 0,
	class: "rm-empty__bottom"
};
//#endregion
//#region ../../packages/ui/src/components/ReEmpty/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReEmptyModern",
	inheritAttrs: true,
	__name: "Modern",
	props: {
		description: { default: "暂无数据" },
		image: { default: "" },
		imageSize: { default: 120 }
	},
	setup(__props) {
		/**
		* ReEmpty Modern 布局 —— 现代化扁平空状态
		*
		* 设计要点：
		*   - 主色渐变光晕背景
		*   - 极简线条图标 + 浮动微动画
		*   - 多层排版节奏感
		*   - bottom slot 行动按钮容器
		*/
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", mergeProps({ class: "rm-empty" }, _ctx.$attrs), [
				_cache[1] || (_cache[1] = createBaseVNode("div", { class: "rm-empty__halo" }, null, -1)),
				createBaseVNode("div", {
					class: "rm-empty__image",
					style: normalizeStyle({
						width: __props.imageSize + "px",
						height: __props.imageSize + "px"
					})
				}, [renderSlot(_ctx.$slots, "image", {}, () => [__props.image ? (openBlock(), createElementBlock("img", {
					key: 0,
					src: __props.image,
					width: __props.imageSize,
					height: __props.imageSize,
					alt: "empty",
					class: "rm-empty__img"
				}, null, 8, _hoisted_1)) : (openBlock(), createElementBlock("svg", _hoisted_2, [..._cache[0] || (_cache[0] = [createStaticVNode("<rect x=\"20\" y=\"30\" width=\"80\" height=\"60\" rx=\"10\" stroke=\"var(--rm-primary)\" stroke-width=\"2\" fill=\"none\" data-v-2c3a1b2b></rect><path d=\"M20 50h80\" stroke=\"var(--rm-primary)\" stroke-width=\"1.5\" opacity=\"0.6\" data-v-2c3a1b2b></path><circle cx=\"40\" cy=\"40\" r=\"3\" fill=\"var(--rm-primary)\" opacity=\"0.45\" data-v-2c3a1b2b></circle><circle cx=\"52\" cy=\"40\" r=\"3\" fill=\"var(--rm-primary)\" opacity=\"0.45\" data-v-2c3a1b2b></circle><circle cx=\"64\" cy=\"40\" r=\"3\" fill=\"var(--rm-primary)\" opacity=\"0.45\" data-v-2c3a1b2b></circle><rect x=\"35\" y=\"60\" width=\"50\" height=\"4\" rx=\"2\" fill=\"var(--rm-primary)\" opacity=\"0.2\" data-v-2c3a1b2b></rect><rect x=\"42\" y=\"70\" width=\"36\" height=\"4\" rx=\"2\" fill=\"var(--rm-primary)\" opacity=\"0.14\" data-v-2c3a1b2b></rect>", 7)])]))], true)], 4),
				createBaseVNode("div", _hoisted_3, [renderSlot(_ctx.$slots, "description", {}, () => [createTextVNode(toDisplayString(__props.description), 1)], true)]),
				_ctx.$slots.default ? (openBlock(), createElementBlock("div", _hoisted_4, [renderSlot(_ctx.$slots, "default", {}, void 0, true)])) : createCommentVNode("", true)
			], 16);
		};
	}
}), [["__scopeId", "data-v-2c3a1b2b"]]);
//#endregion
export { Modern_default as default };
