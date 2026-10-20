import { On as unref, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, jt as toHandlers, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, v as createBlock, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
import { t as ReIcon_default } from "./ReIcon-mRxVAA3T.js";
//#region ../../packages/ui/src/components/ReButton/layouts/Square.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "rs-btn__spinner"
};
//#endregion
//#region ../../packages/ui/src/components/ReButton/layouts/Square.vue
var Square_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReButtonSquare",
	inheritAttrs: true,
	__name: "Square",
	props: {
		type: { default: "" },
		size: { default: "default" },
		plain: {
			type: Boolean,
			default: false
		},
		loading: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		icon: { default: "" },
		nativeType: { default: "button" },
		decorative: {
			type: Boolean,
			default: false
		}
	},
	emits: ["click"],
	setup(__props, { emit: __emit }) {
		/**
		* ReButton Square 布局 —— 正方形纯图标按钮
		*
		* <p><b>loading 与图标互斥</b>：spinner 出现时图标必须让位。此前两者是各自独立的
		* {@code v-if}，loading 态下会同时渲染 —— 按钮里并排两个 14px 图形，图标根本没被替换掉，
		* spinner 转圈时图标还杵在旁边（2026-09-28 在 ReTable 刷新按钮上实测：loading 态
		* {@code children.length === 2}、图标仍在）。现在 spinner 用 {@code v-if}、
		* 图标整块用 {@code v-else}，二者互斥，实测 loading 态 {@code children.length === 1}。</p>
		*/
		const props = __props;
		const emit = __emit;
		function onClick(e) {
			if (props.disabled || props.loading) return;
			emit("click", e);
		}
		const iconIsComponent = computed(() => typeof props.icon !== "string" && props.icon != null);
		const iconName = computed(() => typeof props.icon === "string" ? props.icon : "");
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(__props.decorative ? "span" : "button"), mergeProps({
				type: __props.decorative ? void 0 : __props.nativeType,
				disabled: __props.decorative ? void 0 : __props.disabled || __props.loading,
				"aria-hidden": __props.decorative ? "true" : void 0,
				class: [
					"rs-btn",
					`rs-btn--${__props.type || "default"}`,
					`rs-btn--size-${__props.size || "default"}`,
					{
						"rs-btn--plain": __props.plain,
						"is-loading": __props.loading,
						"is-disabled": __props.disabled,
						"rs-btn--decorative": __props.decorative
					}
				]
			}, _ctx.$attrs, toHandlers(__props.decorative ? {} : { click: onClick })), {
				default: withCtx(() => [__props.loading ? (openBlock(), createElementBlock("span", _hoisted_1, [..._cache[0] || (_cache[0] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					"aria-hidden": "true"
				}, [createBaseVNode("circle", {
					cx: "12",
					cy: "12",
					r: "10",
					stroke: "currentColor",
					"stroke-width": "3",
					"stroke-dasharray": "30 70",
					"stroke-linecap": "round"
				})], -1)])])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [__props.icon && !iconIsComponent.value ? (openBlock(), createBlock(ReIcon_default, {
					key: 0,
					name: iconName.value,
					class: "rs-btn__icon"
				}, null, 8, ["name"])) : iconIsComponent.value ? (openBlock(), createBlock(unref(ElIcon), {
					key: 1,
					class: "rs-btn__icon"
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
					_: 1
				})) : createCommentVNode("", true)], 64))]),
				_: 1
			}, 16, [
				"type",
				"disabled",
				"aria-hidden",
				"class"
			]);
		};
	}
}), [["__scopeId", "data-v-ac77cbd6"]]);
//#endregion
export { Square_default as default };
