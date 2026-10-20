import { $n as normalizeClass, E as createTextVNode, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReBreadcrumb/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["aria-label"];
var _hoisted_2 = { class: "re-breadcrumb__list" };
var _hoisted_3 = ["href", "onClick"];
var _hoisted_4 = { class: "re-breadcrumb__label" };
var _hoisted_5 = ["aria-current"];
var _hoisted_6 = { class: "re-breadcrumb__label" };
var _hoisted_7 = {
	key: 2,
	class: "re-breadcrumb__separator",
	"aria-hidden": "true"
};
//#endregion
//#region ../../packages/ui/src/components/ReBreadcrumb/index.vue
var ReBreadcrumb_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		items: {},
		separator: {
			type: [String, Function],
			default: "/"
		},
		size: { default: "default" },
		ariaLabel: { default: "Breadcrumb" },
		block: {
			type: Boolean,
			default: false
		}
	},
	emits: ["click"],
	setup(__props, { emit: __emit }) {
		/**
		* ReBreadcrumb —— 面包屑导航组件
		*
		* 支持自定义分隔符、图标、跳转
		*   <ReBreadcrumb :items="[{ label: '首页', href: '/' }, { label: '详情' }]" />
		*/
		const props = __props;
		const emit = __emit;
		const isLast = (index) => index === props.items.length - 1;
		const getSeparator = (index) => {
			if (typeof props.separator === "function") return props.separator();
			return props.separator;
		};
		const handleClick = (item, index, event) => {
			if (item.disabled) {
				event.preventDefault();
				return;
			}
			emit("click", item, index, event);
			if (item.to) {
				if (typeof item.to === "string") window.history.pushState({}, "", item.to);
			}
		};
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("nav", {
				class: normalizeClass(["re-breadcrumb", [`re-breadcrumb--${__props.size}`, `re-breadcrumb--${__props.separator}`]]),
				"aria-label": __props.ariaLabel
			}, [createBaseVNode("ol", _hoisted_2, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (item, index) => {
				return openBlock(), createElementBlock("li", {
					key: item.key ?? index,
					class: normalizeClass(["re-breadcrumb__item", { "is-active": isLast(index) }])
				}, [!isLast(index) && item.href ? (openBlock(), createElementBlock("a", {
					key: 0,
					class: "re-breadcrumb__link",
					href: item.href,
					onClick: withModifiers(($event) => handleClick(item, index, $event), ["prevent"])
				}, [renderSlot(_ctx.$slots, "item", {
					item,
					index,
					isLast: isLast(index)
				}, () => [item.icon ? (openBlock(), createBlock(unref(ElIcon), {
					key: 0,
					class: "re-breadcrumb__icon"
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(item.icon)))]),
					_: 2
				}, 1024)) : createCommentVNode("", true), createBaseVNode("span", _hoisted_4, toDisplayString(item.label), 1)], true)], 8, _hoisted_3)) : (openBlock(), createElementBlock("span", {
					key: 1,
					class: "re-breadcrumb__text",
					"aria-current": isLast(index) ? "page" : void 0
				}, [renderSlot(_ctx.$slots, "item", {
					item,
					index,
					isLast: isLast(index)
				}, () => [item.icon ? (openBlock(), createBlock(unref(ElIcon), {
					key: 0,
					class: "re-breadcrumb__icon"
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(item.icon)))]),
					_: 2
				}, 1024)) : createCommentVNode("", true), createBaseVNode("span", _hoisted_6, toDisplayString(item.label), 1)], true)], 8, _hoisted_5)), !isLast(index) ? (openBlock(), createElementBlock("span", _hoisted_7, [renderSlot(_ctx.$slots, "separator", { separator: getSeparator(index) }, () => [createTextVNode(toDisplayString(getSeparator(index)), 1)], true)])) : createCommentVNode("", true)], 2);
			}), 128))])], 10, _hoisted_1);
		};
	}
}), [["__scopeId", "data-v-7844261e"]]);
//#endregion
//#region ../../packages/ui/src/components/ReBreadcrumb/index.ts
var plugin = { install(app) {
	app.component("ReBreadcrumb", ReBreadcrumb_default$1);
} };
var ReBreadcrumb_default = ReBreadcrumb_default$1;
//#endregion
export { ReBreadcrumb_default as default, plugin as install };
