import { On as unref, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
import { t as ReIcon_default } from "./ReIcon-mRxVAA3T.js";
//#region ../../packages/ui/src/components/ReButton/layouts/Modern.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["type", "disabled"];
var _hoisted_2 = {
	key: 0,
	class: "rm-btn__spinner"
};
var _hoisted_3 = {
	key: 1,
	class: "rm-btn__content"
};
//#endregion
//#region ../../packages/ui/src/components/ReButton/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReButtonModern",
	inheritAttrs: true,
	__name: "Modern",
	props: {
		type: { default: "" },
		size: { default: "default" },
		plain: {
			type: Boolean,
			default: false
		},
		round: {
			type: Boolean,
			default: false
		},
		circle: {
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
		link: {
			type: Boolean,
			default: false
		},
		text: {
			type: Boolean,
			default: false
		},
		bg: {
			type: Boolean,
			default: false
		},
		nativeType: { default: "button" }
	},
	emits: ["click"],
	setup(__props, { emit: __emit }) {
		/**
		* ReButton Modern 布局 —— 现代化扁平按钮
		*
		* 设计特点：
		*   - 无边框阴影，纯色块 + 细边框
		*   - 大圆角（8px）
		*   - 平滑 hover/active 过渡
		*   - 支持 loading 旋转动画
		*
		* <p><b>loading 与内容互斥</b>：spinner 出现时按钮内容必须让位。此前 spinner 用
		* {@code v-if}、内容块是并列的独立节点，loading 态下两者同时渲染（图标/文字会转着圈的
		* spinner 一起出现）。现在内容整块用 {@code v-else}，与 Square 布局同一套写法。</p>
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
			return openBlock(), createElementBlock("button", mergeProps({
				type: __props.nativeType,
				disabled: __props.disabled || __props.loading,
				class: [
					"rm-btn",
					`rm-btn--${__props.type || "default"}`,
					`rm-btn--${__props.size || "default"}`,
					{
						"rm-btn--plain": __props.plain,
						"rm-btn--round": __props.round,
						"rm-btn--circle": __props.circle,
						"rm-btn--link": __props.link,
						"rm-btn--text": __props.text,
						"rm-btn--bg": __props.bg,
						"is-loading": __props.loading,
						"is-disabled": __props.disabled
					}
				]
			}, _ctx.$attrs, { onClick }), [__props.loading ? (openBlock(), createElementBlock("span", _hoisted_2, [..._cache[0] || (_cache[0] = [createBaseVNode("svg", {
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
			})], -1)])])) : (openBlock(), createElementBlock("span", _hoisted_3, [__props.icon && !iconIsComponent.value ? (openBlock(), createBlock(ReIcon_default, {
				key: 0,
				name: iconName.value,
				class: "rm-btn__icon"
			}, null, 8, ["name"])) : iconIsComponent.value ? (openBlock(), createBlock(unref(ElIcon), {
				key: 1,
				class: "rm-btn__icon"
			}, {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
				_: 1
			})) : createCommentVNode("", true), renderSlot(_ctx.$slots, "default", {}, void 0, true)]))], 16, _hoisted_1);
		};
	}
}), [["__scopeId", "data-v-afc4ffd0"]]);
//#endregion
export { Modern_default as default };
