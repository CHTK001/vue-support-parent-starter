import { $n as normalizeClass, E as createTextVNode, On as unref, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { l as isBoolean, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { n as useTooltipTriggerProps, r as useTooltipContentProps, t as ElTooltip } from "./tooltip-DEX5DBfd.js";
import { n as withInstallDirective, t as withInstall } from "./install-CE5IEjzX.js";
import { r as dropdownProps } from "./dropdown-BQYEchFy.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/popover/src/popover.mjs
/**
* @deprecated Removed after 3.0.0, Use `PopoverProps` instead.
*/
var popoverProps = buildProps({
	/**
	* @description how the popover is triggered, not valid in controlled mode
	*/
	trigger: useTooltipTriggerProps.trigger,
	/**
	* @description When you click the mouse to focus on the trigger element, you can define a set of keyboard codes to control the display of popover through the keyboard, not valid in controlled mode
	*/
	triggerKeys: useTooltipTriggerProps.triggerKeys,
	/**
	* @description popover placement
	*/
	placement: dropdownProps.placement,
	/**
	* @description whether Popover is disabled
	*/
	disabled: useTooltipTriggerProps.disabled,
	/**
	* @description whether popover is visible
	*/
	visible: useTooltipContentProps.visible,
	/**
	* @description popover transition animation
	*/
	transition: useTooltipContentProps.transition,
	/**
	* @description parameters for [popper.js](https://popper.js.org/docs/v2/)
	*/
	popperOptions: dropdownProps.popperOptions,
	/**
	* @description [tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) of Popover
	*/
	tabindex: dropdownProps.tabindex,
	/**
	* @description popover content, can be replaced with a default `slot`
	*/
	content: useTooltipContentProps.content,
	/**
	* @description custom style for popover
	*/
	popperStyle: useTooltipContentProps.popperStyle,
	/**
	* @description custom class name for popover
	*/
	popperClass: useTooltipContentProps.popperClass,
	enterable: {
		...useTooltipContentProps.enterable,
		default: true
	},
	/**
	* @description Tooltip theme, built-in theme: `dark` / `light`
	*/
	effect: {
		...useTooltipContentProps.effect,
		default: "light"
	},
	/**
	* @description whether popover dropdown is teleported to the body
	*/
	teleported: useTooltipContentProps.teleported,
	/**
	* @description which select dropdown appends to
	*/
	appendTo: useTooltipContentProps.appendTo,
	/**
	* @description popover title
	*/
	title: String,
	/**
	* @description popover width
	*/
	width: {
		type: [String, Number],
		default: 150
	},
	/**
	* @description popover offset
	*/
	offset: {
		type: Number,
		default: void 0
	},
	/**
	* @description delay of appearance, in millisecond, not valid in controlled mode
	*/
	showAfter: {
		type: Number,
		default: 0
	},
	/**
	* @description delay of disappear, in millisecond, not valid in controlled mode
	*/
	hideAfter: {
		type: Number,
		default: 200
	},
	/**
	* @description timeout in milliseconds to hide tooltip, not valid in controlled mode
	*/
	autoClose: {
		type: Number,
		default: 0
	},
	/**
	* @description whether a tooltip arrow is displayed or not. For more info, please refer to [ElPopper](https://github.com/element-plus/element-plus/tree/dev/packages/components/popper)
	*/
	showArrow: {
		type: Boolean,
		default: true
	},
	/**
	* @description when popover inactive and `persistent` is `false` , popover will be destroyed
	*/
	persistent: {
		type: Boolean,
		default: true
	},
	"onUpdate:visible": { type: Function }
});
var popoverEmits = {
	"update:visible": (value) => isBoolean(value),
	"before-enter": () => true,
	"before-leave": () => true,
	"after-enter": () => true,
	"after-leave": () => true
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/popover/src/popover.vue_vue_type_script_setup_true_lang.mjs
var updateEventKeyRaw = `onUpdate:visible`;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/popover/src/popover2.mjs
var popover_default = /* @__PURE__ */ defineComponent({
	name: "ElPopover",
	__name: "popover",
	props: popoverProps,
	emits: popoverEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const onUpdateVisible = computed(() => {
			return props[updateEventKeyRaw];
		});
		const ns = useNamespace("popover");
		const tooltipRef = ref();
		const popperRef = computed(() => {
			return unref(tooltipRef)?.popperRef;
		});
		const style = computed(() => {
			return [{ width: addUnit(props.width) }, props.popperStyle];
		});
		const kls = computed(() => {
			return [
				ns.b(),
				props.popperClass,
				{ [ns.m("plain")]: !!props.content }
			];
		});
		const gpuAcceleration = computed(() => {
			return props.transition === `${ns.namespace.value}-fade-in-linear`;
		});
		const hide = () => {
			tooltipRef.value?.hide();
		};
		const beforeEnter = () => {
			emit("before-enter");
		};
		const beforeLeave = () => {
			emit("before-leave");
		};
		const afterEnter = () => {
			emit("after-enter");
		};
		const afterLeave = () => {
			emit("update:visible", false);
			emit("after-leave");
		};
		__expose({
			/** @description popper ref */
			popperRef,
			/** @description hide popover */
			hide
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElTooltip), mergeProps({
				ref_key: "tooltipRef",
				ref: tooltipRef
			}, _ctx.$attrs, {
				trigger: __props.trigger,
				"trigger-keys": __props.triggerKeys,
				placement: __props.placement,
				disabled: __props.disabled,
				visible: __props.visible,
				transition: __props.transition,
				"popper-options": __props.popperOptions,
				tabindex: __props.tabindex,
				content: __props.content,
				offset: __props.offset,
				"show-after": __props.showAfter,
				"hide-after": __props.hideAfter,
				"auto-close": __props.autoClose,
				"show-arrow": __props.showArrow,
				"aria-label": __props.title,
				effect: __props.effect,
				enterable: __props.enterable,
				"popper-class": kls.value,
				"popper-style": style.value,
				teleported: __props.teleported,
				"append-to": __props.appendTo,
				persistent: __props.persistent,
				"gpu-acceleration": gpuAcceleration.value,
				"onUpdate:visible": onUpdateVisible.value,
				onBeforeShow: beforeEnter,
				onBeforeHide: beforeLeave,
				onShow: afterEnter,
				onHide: afterLeave
			}), {
				content: withCtx(() => [__props.title ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ns).e("title")),
					role: "title"
				}, toDisplayString(__props.title), 3)) : createCommentVNode("v-if", true), renderSlot(_ctx.$slots, "default", { hide }, () => [createTextVNode(toDisplayString(__props.content), 1)])]),
				default: withCtx(() => [_ctx.$slots.reference ? renderSlot(_ctx.$slots, "reference", { key: 0 }) : createCommentVNode("v-if", true)]),
				_: 3
			}, 16, [
				"trigger",
				"trigger-keys",
				"placement",
				"disabled",
				"visible",
				"transition",
				"popper-options",
				"tabindex",
				"content",
				"offset",
				"show-after",
				"hide-after",
				"auto-close",
				"show-arrow",
				"aria-label",
				"effect",
				"enterable",
				"popper-class",
				"popper-style",
				"teleported",
				"append-to",
				"persistent",
				"gpu-acceleration",
				"onUpdate:visible"
			]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/popover/src/directive.mjs
var attachEvents = (el, binding) => {
	const popover = (binding.arg || binding.value)?.popperRef;
	if (popover) popover.triggerRef = el;
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/popover/index.mjs
var ElPopoverDirective = withInstallDirective({
	mounted(el, binding) {
		attachEvents(el, binding);
	},
	updated(el, binding) {
		attachEvents(el, binding);
	}
}, "popover");
var ElPopover = withInstall(popover_default, { directive: ElPopoverDirective });
//#endregion
export { ElPopoverDirective as n, ElPopover as t };
