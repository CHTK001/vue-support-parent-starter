import { $n as normalizeClass, E as createTextVNode, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReRibbon/ReRibbon.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-ribbon__text" };
//#endregion
//#region ../../packages/ui/src/components/ReRibbon/ReRibbon.vue
var ReRibbon_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReRibbon",
	inheritAttrs: true,
	__name: "ReRibbon",
	props: {
		text: { default: "" },
		position: { default: "top-right" },
		type: { default: "primary" },
		size: { default: "default" },
		color: { default: "" },
		textColor: { default: "" },
		folded: {
			type: Boolean,
			default: true
		},
		hidden: {
			type: Boolean,
			default: false
		},
		absolute: {
			type: Boolean,
			default: true
		}
	},
	setup(__props) {
		/**
		* ReRibbon —— 绸带组件
		*
		* 在父容器角落显示斜向绸带标签，常用于卡片/图片/商品的状态标记。
		*
		* 用法：
		*   <ReRibbon text="HOT" type="danger" position="top-right">
		*     <div class="card">...</div>
		*   </ReRibbon>
		*
		*   <ReRibbon text="新品" type="primary" position="top-left" folded>
		*     <img src="..." />
		*   </ReRibbon>
		*
		* 位置：top-left / top-right / bottom-left / bottom-right
		* 类型：primary / success / warning / danger / info
		* 尺寸：small / default / large
		* 支持自定义颜色、是否显示折角、是否隐藏等。
		*/
		const props = __props;
		/** 内联样式（自定义颜色覆盖） */
		const ribbonStyle = computed(() => {
			const s = {};
			if (props.color) s["--ribbon-bg"] = props.color;
			if (props.textColor) s["--ribbon-text"] = props.textColor;
			return s;
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-ribbon-wrapper", { "re-ribbon-wrapper--relative": !__props.absolute }]) }, [renderSlot(_ctx.$slots, "default", {}, void 0, true), !__props.hidden ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass([
					"re-ribbon",
					`re-ribbon--${__props.position}`,
					`re-ribbon--${__props.size}`,
					`re-ribbon--${__props.type}`,
					{ "re-ribbon--folded": __props.folded }
				]),
				style: normalizeStyle(ribbonStyle.value)
			}, [createBaseVNode("span", _hoisted_1, [renderSlot(_ctx.$slots, "content", {}, () => [createTextVNode(toDisplayString(__props.text), 1)], true)]), __props.folded ? (openBlock(), createElementBlock("span", {
				key: 0,
				class: normalizeClass(["re-ribbon__fold", `re-ribbon__fold--${__props.position}`])
			}, null, 2)) : createCommentVNode("", true)], 6)) : createCommentVNode("", true)], 2);
		};
	}
}), [["__scopeId", "data-v-3df5e6f2"]]);
//#endregion
//#region ../../packages/ui/src/components/ReRibbon/index.ts
var plugin = { install(app) {
	app.component("ReRibbon", ReRibbon_default$1);
} };
var ReRibbon_default = ReRibbon_default$1;
//#endregion
export { ReRibbon_default as default, plugin as install };
