import { $n as normalizeClass, D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, v as createBlock, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { i as componentSizes } from "./use-size-BpzpcbJM.js";
import { r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { n as useFormSize } from "./use-form-common-props-DzQ9ZY64.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { w as close_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tag/src/tag.mjs
/**
* @deprecated Removed after 3.0.0, Use `TagProps` instead.
*/
var tagProps = buildProps({
	/**
	* @description type of Tag
	*/
	type: {
		type: String,
		values: [
			"primary",
			"success",
			"info",
			"warning",
			"danger"
		],
		default: "primary"
	},
	/**
	* @description whether Tag can be removed
	*/
	closable: Boolean,
	/**
	* @description whether to disable animations
	*/
	disableTransitions: Boolean,
	/**
	* @description whether Tag has a highlighted border
	*/
	hit: Boolean,
	/**
	* @description background color of the Tag
	*/
	color: String,
	/**
	* @description size of Tag
	*/
	size: {
		type: String,
		values: componentSizes
	},
	/**
	* @description theme of Tag
	*/
	effect: {
		type: String,
		values: [
			"dark",
			"light",
			"plain"
		],
		default: "light"
	},
	/**
	* @description whether Tag is rounded
	*/
	round: Boolean
});
var tagEmits = {
	close: (evt) => evt instanceof MouseEvent,
	click: (evt) => evt instanceof MouseEvent
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tag/src/tag.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = ["aria-label"];
var _hoisted_2 = ["aria-label"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tag/index.mjs
var ElTag = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElTag",
	__name: "tag",
	props: tagProps,
	emits: tagEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const tagSize = useFormSize();
		const { t } = useLocale();
		const ns = useNamespace("tag");
		const containerKls = computed(() => {
			const { type, hit, effect, closable, round } = props;
			return [
				ns.b(),
				ns.is("closable", closable),
				ns.m(type || "primary"),
				ns.m(tagSize.value),
				ns.m(effect),
				ns.is("hit", hit),
				ns.is("round", round)
			];
		});
		const handleClose = (event) => {
			emit("close", event);
		};
		const handleClick = (event) => {
			emit("click", event);
		};
		const handleVNodeMounted = (vnode) => {
			if (vnode?.component?.subTree?.component?.bum) vnode.component.subTree.component.bum = null;
		};
		return (_ctx, _cache) => {
			return __props.disableTransitions ? (openBlock(), createElementBlock("span", {
				key: 0,
				class: normalizeClass(containerKls.value),
				style: normalizeStyle({ backgroundColor: __props.color }),
				onClick: handleClick
			}, [createBaseVNode("span", { class: normalizeClass(unref(ns).e("content")) }, [renderSlot(_ctx.$slots, "default")], 2), __props.closable ? (openBlock(), createElementBlock("button", {
				key: 0,
				"aria-label": unref(t)("el.tag.close"),
				class: normalizeClass(unref(ns).e("close")),
				type: "button",
				onClick: withModifiers(handleClose, ["stop"])
			}, [createVNode(unref(ElIcon), null, {
				default: withCtx(() => [createVNode(unref(close_default))]),
				_: 1
			})], 10, _hoisted_1)) : createCommentVNode("v-if", true)], 6)) : (openBlock(), createBlock(Transition, {
				key: 1,
				name: `${unref(ns).namespace.value}-zoom-in-center`,
				appear: "",
				onVnodeMounted: handleVNodeMounted
			}, {
				default: withCtx(() => [createBaseVNode("span", {
					class: normalizeClass(containerKls.value),
					style: normalizeStyle({ backgroundColor: __props.color }),
					onClick: handleClick
				}, [createBaseVNode("span", { class: normalizeClass(unref(ns).e("content")) }, [renderSlot(_ctx.$slots, "default")], 2), __props.closable ? (openBlock(), createElementBlock("button", {
					key: 0,
					"aria-label": unref(t)("el.tag.close"),
					class: normalizeClass(unref(ns).e("close")),
					type: "button",
					onClick: withModifiers(handleClose, ["stop"])
				}, [createVNode(unref(ElIcon), null, {
					default: withCtx(() => [createVNode(unref(close_default))]),
					_: 1
				})], 10, _hoisted_2)) : createCommentVNode("v-if", true)], 6)]),
				_: 3
			}, 8, ["name"]));
		};
	}
}));
//#endregion
export { tagProps as n, ElTag as t };
