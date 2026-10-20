import { On as unref, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, w as createSlots, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElCard } from "./card-v-sNLg7D.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReCard/theme/default/ReCard.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-card__header-inner" };
var _hoisted_2 = { class: "re-card__header-main" };
var _hoisted_3 = { class: "re-card__title" };
var _hoisted_4 = {
	key: 0,
	class: "re-card__subtitle"
};
var _hoisted_5 = {
	key: 0,
	class: "re-card__extra"
};
//#endregion
//#region ../../packages/ui/src/components/ReCard/theme/default/ReCard.vue
var ReCard_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReCard",
	inheritAttrs: true,
	__name: "ReCard",
	props: {
		layout: { default: "default" },
		header: { default: "" },
		title: { default: "" },
		subtitle: { default: "" },
		shadow: { default: "never" },
		bodyStyle: { default: void 0 },
		radius: { default: 8 },
		hoverable: {
			type: Boolean,
			default: false
		},
		bordered: {
			type: Boolean,
			default: true
		},
		padding: { default: 16 }
	},
	setup(__props) {
		/**
		* ReCard default 主题 —— 卡片组件（el-card 封装）
		*
		* 透传 el-card 全部能力。
		* 增强：
		*   - layout：default（标准带框） / simple（无边框、hover 浮起，圆角更大，玻璃质感）
		*   - radius：自定义圆角（默认 8）
		*   - hoverable：hover 时浮起（box-shadow + translateY）
		*   - bordered：是否显示边框
		*   - header / footer 插槽
		*   - title / subtitle 便捷字段（适用于通用卡片头部）
		*
		* 视觉定位：本组件属 **Modern 族**（配 modern-vars 的 --rm-* 令牌：扁平、密集、
		* 12px 圆角系），服务于业务自建卡片；与统计卡族的统一表面基线
		* （shared/re-surface.css，16px + 柔光投影）是两套用途，**刻意不合并**。
		* 统计卡场景请用 ReStatCard / ReStatsCard，不要用本组件套 baseline。
		*/
		const props = __props;
		/** simple 布局：自动关闭边框 + 加大圆角 + 强制 hover 浮起，shadow 不生效 */
		const isSimple = computed(() => props.layout === "simple");
		const finalBordered = computed(() => isSimple.value ? false : props.bordered);
		const finalRadius = computed(() => isSimple.value ? Math.max(props.radius, 16) : props.radius);
		const finalHoverable = computed(() => isSimple.value ? true : props.hoverable);
		const finalHeader = computed(() => props.header || props.title);
		const customStyle = computed(() => ({
			"--re-card-radius": `${finalRadius.value}px`,
			"--re-card-padding": typeof props.padding === "number" ? `${props.padding}px` : props.padding
		}));
		const mergedBodyStyle = computed(() => ({ ...props.bodyStyle ?? {} }));
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElCard), mergeProps(_ctx.$attrs, {
				header: finalHeader.value || void 0,
				shadow: isSimple.value ? "hover" : __props.shadow,
				"body-style": mergedBodyStyle.value,
				class: [
					"re-card",
					`re-card--${__props.layout}`,
					{
						"re-card--hoverable": finalHoverable.value,
						"re-card--bordered": finalBordered.value
					}
				],
				style: customStyle.value
			}), createSlots({
				default: withCtx(() => [renderSlot(_ctx.$slots, "default", {}, void 0, true)]),
				_: 2
			}, [finalHeader.value ? {
				name: "header",
				fn: withCtx(() => [renderSlot(_ctx.$slots, "header", {}, () => [createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createBaseVNode("span", _hoisted_3, toDisplayString(finalHeader.value), 1), __props.subtitle ? (openBlock(), createElementBlock("span", _hoisted_4, toDisplayString(__props.subtitle), 1)) : createCommentVNode("", true)]), _ctx.$slots.extra ? (openBlock(), createElementBlock("div", _hoisted_5, [renderSlot(_ctx.$slots, "extra", {}, void 0, true)])) : createCommentVNode("", true)])], true)]),
				key: "0"
			} : void 0, _ctx.$slots.footer ? {
				name: "footer",
				fn: withCtx(() => [renderSlot(_ctx.$slots, "footer", {}, void 0, true)]),
				key: "1"
			} : void 0]), 1040, [
				"header",
				"shadow",
				"body-style",
				"class",
				"style"
			]);
		};
	}
}), [["__scopeId", "data-v-e6f40f5a"]]);
//#endregion
export { ReCard_default as default };
