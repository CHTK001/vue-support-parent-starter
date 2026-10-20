import { $n as normalizeClass, D as createVNode, E as createTextVNode, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                    */
//#region ../../packages/ui/src/components/ReStatCard/theme/default/ReStatCard.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-stat-card__aside"
};
var _hoisted_2 = { class: "re-stat-card__body" };
var _hoisted_3 = { class: "re-stat-card__value" };
var _hoisted_4 = { class: "re-stat-card__title" };
var _hoisted_5 = {
	key: 0,
	class: "re-stat-card__desc"
};
//#endregion
//#region ../../packages/ui/src/components/ReStatCard/theme/default/ReStatCard.vue
var ReStatCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReStatCard",
	inheritAttrs: true,
	__name: "ReStatCard",
	props: {
		title: {},
		value: { default: "" },
		desc: { default: "" },
		icon: { default: void 0 },
		iconColor: { default: "var(--el-color-primary)" },
		size: { default: "default" },
		layout: { default: "auto" }
	},
	setup(__props) {
		const props = __props;
		/** 是否紧凑档；模板与图标尺寸共用，避免两处各判一次 */
		const isCompact = computed(() => props.size === "compact");
		/** 是否横排（图标左 / 文案右） */
		const isInline = computed(() => props.layout === "inline" || props.layout !== "stacked" && isCompact.value);
		/** 图标字形大小：紧凑档跟着图标圆一起缩，否则 24px 字形会撑破 32px 圆 */
		const iconSize = computed(() => isCompact.value ? 16 : 24);
		/**
		* 图标圆：iconColor 渐变实底 + 白色图标 + 同色柔和投影（对齐设计稿的"柔和层次感"）。
		* 颜色任意（CSS 变量 / hex）均可，经 color-mix 派生亮部与投影。
		*/
		const iconStyle = computed(() => {
			const c = props.iconColor || "var(--el-color-primary)";
			return {
				background: `linear-gradient(140deg, color-mix(in srgb, ${c} 72%, var(--el-color-white)) 0%, ${c} 100%)`,
				color: "var(--el-color-white)",
				boxShadow: `0 10px 18px -8px color-mix(in srgb, ${c} 55%, transparent)`
			};
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-stat-card re-surface re-surface--hover", {
				"re-stat-card--compact": __props.size === "compact",
				"re-stat-card--inline": isInline.value
			}]) }, [__props.icon || _ctx.$slots.icon ? (openBlock(), createElementBlock("div", _hoisted_1, [renderSlot(_ctx.$slots, "icon", {}, () => [__props.icon ? (openBlock(), createElementBlock("span", {
				key: 0,
				class: "re-stat-card__icon",
				style: normalizeStyle(iconStyle.value)
			}, [createVNode(_component_el_icon, { size: iconSize.value }, {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
				_: 1
			}, 8, ["size"])], 4)) : createCommentVNode("", true)], true)])) : createCommentVNode("", true), createBaseVNode("div", _hoisted_2, [
				createBaseVNode("div", _hoisted_3, [renderSlot(_ctx.$slots, "value", {}, () => [createTextVNode(toDisplayString(__props.value), 1)], true)]),
				createBaseVNode("span", _hoisted_4, [renderSlot(_ctx.$slots, "title", {}, () => [createTextVNode(toDisplayString(__props.title), 1)], true)]),
				__props.desc ? (openBlock(), createElementBlock("div", _hoisted_5, toDisplayString(__props.desc), 1)) : createCommentVNode("", true)
			])], 2);
		};
	}
}), [["__scopeId", "data-v-74c025d9"]]);
//#endregion
export { ReStatCard_default as default };
