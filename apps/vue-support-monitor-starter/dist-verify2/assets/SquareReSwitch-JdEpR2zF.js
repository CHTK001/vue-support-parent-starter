import { $ as mergeModels, $n as normalizeClass, Ft as useModel, Lt as useSlots, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElTooltip } from "./tooltip-DEX5DBfd.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReIcon-By12b2Y9.js";
//#region ../../packages/ui/src/components/ReSwitch/layouts/SquareReSwitch.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = [
	"disabled",
	"aria-checked",
	"aria-label"
];
var _hoisted_2 = { class: "re-switch-square__label" };
var _hoisted_3 = {
	key: 3,
	class: "re-switch-square__default-icon",
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
var _hoisted_4 = {
	key: 0,
	class: "re-switch-square__check"
};
var _hoisted_5 = [
	"disabled",
	"aria-checked",
	"aria-label"
];
var _hoisted_6 = { class: "re-switch-square__label" };
var _hoisted_7 = {
	key: 3,
	class: "re-switch-square__default-icon",
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2",
	"stroke-linecap": "round",
	"stroke-linejoin": "round"
};
var _hoisted_8 = {
	key: 0,
	class: "re-switch-square__check"
};
//#endregion
//#region ../../packages/ui/src/components/ReSwitch/layouts/SquareReSwitch.vue
var SquareReSwitch_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "SquareReSwitch",
	inheritAttrs: true,
	__name: "SquareReSwitch",
	props: /*@__PURE__*/ mergeModels({
		title: { default: "" },
		ariaLabel: { default: "" },
		disabled: {
			type: Boolean,
			default: false
		},
		size: { default: "default" },
		activeValue: {
			type: [
				Boolean,
				String,
				Number
			],
			default: true
		},
		inactiveValue: {
			type: [
				Boolean,
				String,
				Number
			],
			default: false
		},
		icon: { default: "" },
		activeIcon: { default: "" },
		inactiveIcon: { default: "" }
	}, {
		"modelValue": {
			type: [
				Boolean,
				String,
				Number
			],
			default: false
		},
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* SquareReSwitch —— 正方形纯图标开关
		*
		* 以正方形按钮形式展示，激活时右上角打勾 + 边框高亮。
		* 可通过默认插槽传入图标/文字。
		*
		* <p><b>无障碍</b>：激活态只有视觉信号（边框色 + 右上角打勾），颜色/图形本身
		* 对屏幕阅读器不可见。所以按钮必须带 {@code role="switch"} 与
		* {@code :aria-checked="isActive"}，否则读屏只会报「某按钮」，
		* 用户无从判断开关状态（WCAG 4.1.2 名称/角色/值）。两个分支
		* （有/无 tooltip）都要带，缺一个就有一半场景失效。</p>
		*
		* <p>同一个 WCAG 条款还要「名称」。这个按钮常常只画一个图标
		* （{@code icon} 或内置图形），图标对读屏是空的，tooltip 又只在
		* {@code title} 非空时才出现 —— 于是 {@code title} 为空时按钮**一个名字都没有**，
		* 读屏只会念「开关」。实测演示站的参数面板就是这种状态：
		* 一颗 40×40 的纯图标开关，{@code aria-label} 与 {@code title} 全为 {@code null}。
		* 故 {@link accessibleName} 兜一层：{@code ariaLabel} → {@code title}。</p>
		*/
		const slots = useSlots();
		/** 默认插槽是否有实际内容（排除注释/空白节点） */
		const hasSlotContent = computed(() => {
			return (slots.default?.() ?? []).some((n) => {
				if (typeof n.type === "symbol") return false;
				if (typeof n.children === "string") return n.children.trim().length > 0;
				return true;
			});
		});
		/** 命名插槽是否有实际内容 */
		function hasNamedSlot(name) {
			return (slots[name]?.() ?? []).some((n) => typeof n.type !== "symbol");
		}
		const hasActiveSlot = computed(() => hasNamedSlot("active"));
		const hasInactiveSlot = computed(() => hasNamedSlot("inactive"));
		const props = __props;
		const modelValue = useModel(__props, "modelValue");
		const isActive = computed(() => modelValue.value === props.activeValue);
		/**
		* 无障碍名称：`ariaLabel` 优先，其次 `title`（tooltip 文案也能当名字用）。
		*
		* <p>两者都没有时返回 {@code undefined} 而不是空串 —— 空串会被当成"有个空名字"，
		* 读屏念出来是空白，比不设更糟。</p>
		*/
		const accessibleName = computed(() => props.ariaLabel || props.title || void 0);
		/** 中心图标尺寸（随按钮尺寸） */
		const iconSize = computed(() => props.size === "small" ? 15 : props.size === "large" ? 22 : 18);
		/** 当前态解析出的图标名（0 长度表示未配置，回退到默认插槽/内置图形） */
		const centerIcon = computed(() => {
			return (isActive.value ? props.activeIcon : props.inactiveIcon) || props.icon || "";
		});
		/** 当前态是否使用专属命名插槽 */
		const useNamedSlot = computed(() => isActive.value ? hasActiveSlot.value : hasInactiveSlot.value);
		function toggle() {
			if (props.disabled) return;
			modelValue.value = isActive.value ? props.inactiveValue : props.activeValue;
		}
		return (_ctx, _cache) => {
			return __props.title ? (openBlock(), createBlock(unref(ElTooltip), {
				key: 0,
				content: __props.title,
				placement: "top"
			}, {
				default: withCtx(() => [createBaseVNode("button", {
					class: normalizeClass([
						"re-switch-square",
						`re-switch-square--${__props.size}`,
						{
							"re-switch-square--active": isActive.value,
							"re-switch-square--disabled": __props.disabled
						}
					]),
					disabled: __props.disabled,
					type: "button",
					role: "switch",
					"aria-checked": isActive.value,
					"aria-label": accessibleName.value,
					onClick: toggle
				}, [createBaseVNode("span", _hoisted_2, [useNamedSlot.value ? renderSlot(_ctx.$slots, isActive.value ? "active" : "inactive", {}, void 0, true, 0) : centerIcon.value ? (openBlock(), createBlock(unref(component), {
					key: 1,
					name: centerIcon.value,
					size: iconSize.value
				}, null, 8, ["name", "size"])) : hasSlotContent.value ? renderSlot(_ctx.$slots, "default", {}, void 0, true, 2) : (openBlock(), createElementBlock("svg", _hoisted_3, [..._cache[0] || (_cache[0] = [createBaseVNode("rect", {
					x: "3",
					y: "7",
					width: "18",
					height: "10",
					rx: "5"
				}, null, -1), createBaseVNode("circle", {
					cx: "17",
					cy: "12",
					r: "2.5",
					fill: "currentColor",
					stroke: "none"
				}, null, -1)])]))]), isActive.value ? (openBlock(), createElementBlock("span", _hoisted_4, [..._cache[1] || (_cache[1] = [createBaseVNode("svg", {
					viewBox: "0 0 12 12",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("polyline", { points: "2 6 5 9 10 3" })], -1)])])) : createCommentVNode("", true)], 10, _hoisted_1)]),
				_: 3
			}, 8, ["content"])) : (openBlock(), createElementBlock("button", {
				key: 1,
				class: normalizeClass([
					"re-switch-square",
					`re-switch-square--${__props.size}`,
					{
						"re-switch-square--active": isActive.value,
						"re-switch-square--disabled": __props.disabled
					}
				]),
				disabled: __props.disabled,
				type: "button",
				role: "switch",
				"aria-checked": isActive.value,
				"aria-label": accessibleName.value,
				onClick: toggle
			}, [createBaseVNode("span", _hoisted_6, [useNamedSlot.value ? renderSlot(_ctx.$slots, isActive.value ? "active" : "inactive", {}, void 0, true, 0) : centerIcon.value ? (openBlock(), createBlock(unref(component), {
				key: 1,
				name: centerIcon.value,
				size: iconSize.value
			}, null, 8, ["name", "size"])) : hasSlotContent.value ? renderSlot(_ctx.$slots, "default", {}, void 0, true, 2) : (openBlock(), createElementBlock("svg", _hoisted_7, [..._cache[2] || (_cache[2] = [createBaseVNode("rect", {
				x: "3",
				y: "7",
				width: "18",
				height: "10",
				rx: "5"
			}, null, -1), createBaseVNode("circle", {
				cx: "17",
				cy: "12",
				r: "2.5",
				fill: "currentColor",
				stroke: "none"
			}, null, -1)])]))]), isActive.value ? (openBlock(), createElementBlock("span", _hoisted_8, [..._cache[3] || (_cache[3] = [createBaseVNode("svg", {
				viewBox: "0 0 12 12",
				fill: "none",
				stroke: "currentColor",
				"stroke-width": "2",
				"stroke-linecap": "round",
				"stroke-linejoin": "round"
			}, [createBaseVNode("polyline", { points: "2 6 5 9 10 3" })], -1)])])) : createCommentVNode("", true)], 10, _hoisted_5));
		};
	}
}), [["__scopeId", "data-v-25c39935"]]);
//#endregion
export { SquareReSwitch_default as default };
