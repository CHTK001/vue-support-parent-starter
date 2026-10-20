import { $n as normalizeClass, E as createTextVNode, On as unref, _ as createBaseVNode, b as createElementBlock, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { c as definePropType, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { r as useGlobalConfig } from "./use-global-config-CwtC64sR.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/card/src/card.mjs
/**
* @deprecated Removed after 3.0.0, Use `CardProps` instead.
*/
var cardProps = buildProps({
	/**
	* @description title of the card. Also accepts a DOM passed by `slot#header`
	*/
	header: {
		type: String,
		default: ""
	},
	/**
	* @description content of footer. Also accepts a DOM passed by `slot#footer`
	*/
	footer: {
		type: String,
		default: ""
	},
	/**
	* @description CSS style of card body
	*/
	bodyStyle: {
		type: definePropType([
			String,
			Object,
			Array,
			Boolean
		]),
		default: ""
	},
	/**
	* @description custom class name of card footer
	*/
	headerClass: String,
	/**
	* @description custom class name of card body
	*/
	bodyClass: String,
	/**
	* @description custom class name of card footer
	*/
	footerClass: String,
	/**
	* @description when to show card shadows
	*/
	shadow: {
		type: String,
		values: [
			"always",
			"hover",
			"never"
		],
		default: void 0
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/card/index.mjs
var ElCard = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElCard",
	__name: "card",
	props: cardProps,
	setup(__props) {
		const globalConfig = useGlobalConfig("card");
		const ns = useNamespace("card");
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass([unref(ns).b(), unref(ns).is(`${__props.shadow || unref(globalConfig)?.shadow || "always"}-shadow`)]) }, [
				_ctx.$slots.header || __props.header ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass([unref(ns).e("header"), __props.headerClass])
				}, [renderSlot(_ctx.$slots, "header", {}, () => [createTextVNode(toDisplayString(__props.header), 1)])], 2)) : createCommentVNode("v-if", true),
				createBaseVNode("div", {
					class: normalizeClass([unref(ns).e("body"), __props.bodyClass]),
					style: normalizeStyle(__props.bodyStyle)
				}, [renderSlot(_ctx.$slots, "default")], 6),
				_ctx.$slots.footer || __props.footer ? (openBlock(), createElementBlock("div", {
					key: 1,
					class: normalizeClass([unref(ns).e("footer"), __props.footerClass])
				}, [renderSlot(_ctx.$slots, "footer", {}, () => [createTextVNode(toDisplayString(__props.footer), 1)])], 2)) : createCommentVNode("v-if", true)
			], 2);
		};
	}
}));
//#endregion
export { ElCard as t };
