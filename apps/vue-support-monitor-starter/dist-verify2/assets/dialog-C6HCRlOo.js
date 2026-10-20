import { $n as normalizeClass, D as createVNode, J as inject, Lt as useSlots, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, gt as provide, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, u as Teleport, v as createBlock, vn as ref, w as createSlots, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, t as Transition } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { r as useNamespace } from "./use-namespace-BksmY6RT.js";
import { t as useDeprecated } from "./use-deprecated-qam6HGto.js";
import { t as useDraggable } from "./use-draggable-P7Ccy1As.js";
import { n as useSameTarget, t as ElOverlay } from "./overlay-D6Leq3yd.js";
import { r as FOCUS_TRAP_INJECTION_KEY, t as focus_trap_default$1 } from "./focus-trap-B31xXeBw.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { t as CloseComponents } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { a as dialogContentEmits, i as dialogProps, n as dialogInjectionKey, o as dialogContentProps, r as dialogEmits, t as useDialog } from "./use-dialog-BDtWV0XE.js";
import { t as composeRefs } from "./refs-BRnhjbOJ.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dialog/src/dialog-content.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = ["aria-level"];
var _hoisted_2 = ["aria-label"];
var _hoisted_3 = ["id"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dialog/src/dialog-content2.mjs
var dialog_content_default = /* @__PURE__ */ defineComponent({
	name: "ElDialogContent",
	__name: "dialog-content",
	props: dialogContentProps,
	emits: dialogContentEmits,
	setup(__props, { expose: __expose }) {
		const { t } = useLocale();
		const { Close } = CloseComponents;
		const props = __props;
		const { dialogRef, headerRef, bodyId, ns, style } = inject(dialogInjectionKey);
		const { focusTrapRef } = inject(FOCUS_TRAP_INJECTION_KEY);
		const composedDialogRef = composeRefs(focusTrapRef, dialogRef);
		const draggable = computed(() => !!props.draggable);
		const { resetPosition, updatePosition, isDragging } = useDraggable(dialogRef, headerRef, draggable, computed(() => !!props.overflow));
		const dialogKls = computed(() => [
			ns.b(),
			ns.is("fullscreen", props.fullscreen),
			ns.is("draggable", draggable.value),
			ns.is("dragging", isDragging.value),
			ns.is("align-center", !!props.alignCenter),
			{ [ns.m("center")]: props.center }
		]);
		__expose({
			resetPosition,
			updatePosition
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref: unref(composedDialogRef),
				class: normalizeClass(dialogKls.value),
				style: normalizeStyle(unref(style)),
				tabindex: "-1"
			}, [
				createBaseVNode("header", {
					ref_key: "headerRef",
					ref: headerRef,
					class: normalizeClass([
						unref(ns).e("header"),
						__props.headerClass,
						{ "show-close": __props.showClose }
					])
				}, [renderSlot(_ctx.$slots, "header", {}, () => [createBaseVNode("span", {
					role: "heading",
					"aria-level": __props.ariaLevel,
					class: normalizeClass(unref(ns).e("title"))
				}, toDisplayString(__props.title), 11, _hoisted_1$1)]), __props.showClose ? (openBlock(), createElementBlock("button", {
					key: 0,
					"aria-label": unref(t)("el.dialog.close"),
					class: normalizeClass(unref(ns).e("headerbtn")),
					type: "button",
					onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("close"))
				}, [createVNode(unref(ElIcon), { class: normalizeClass(unref(ns).e("close")) }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.closeIcon || unref(Close))))]),
					_: 1
				}, 8, ["class"])], 10, _hoisted_2)) : createCommentVNode("v-if", true)], 2),
				createBaseVNode("div", {
					id: unref(bodyId),
					class: normalizeClass([unref(ns).e("body"), __props.bodyClass])
				}, [renderSlot(_ctx.$slots, "default")], 10, _hoisted_3),
				_ctx.$slots.footer ? (openBlock(), createElementBlock("footer", {
					key: 0,
					class: normalizeClass([unref(ns).e("footer"), __props.footerClass])
				}, [renderSlot(_ctx.$slots, "footer")], 2)) : createCommentVNode("v-if", true)
			], 6);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dialog/src/dialog.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"aria-label",
	"aria-labelledby",
	"aria-describedby"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dialog/index.mjs
var ElDialog = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElDialog",
	inheritAttrs: false,
	__name: "dialog",
	props: dialogProps,
	emits: dialogEmits,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const slots = useSlots();
		useDeprecated({
			scope: "el-dialog",
			from: "the title slot",
			replacement: "the header slot",
			version: "3.0.0",
			ref: "https://element-plus.org/en-US/component/dialog.html#slots"
		}, computed(() => !!slots.title));
		const ns = useNamespace("dialog");
		const dialogRef = ref();
		const headerRef = ref();
		const dialogContentRef = ref();
		const { visible, titleId, bodyId, style, overlayDialogStyle, rendered, transitionConfig, zIndex, _draggable, _alignCenter, _overflow, penetrable, handleClose, onModalClick, onOpenAutoFocus, onCloseAutoFocus, onCloseRequested, onFocusoutPrevented, bringToFront, closing } = useDialog(props, dialogRef);
		provide(dialogInjectionKey, {
			dialogRef,
			headerRef,
			bodyId,
			ns,
			rendered,
			style
		});
		const overlayEvent = useSameTarget(onModalClick);
		const resetPosition = () => {
			dialogContentRef.value?.resetPosition();
		};
		__expose({
			/** @description whether the dialog is visible */
			visible,
			dialogContentRef,
			resetPosition,
			handleClose
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(Teleport, {
				to: __props.appendTo,
				disabled: __props.appendTo !== "body" ? false : !__props.appendToBody
			}, [createVNode(Transition, mergeProps(unref(transitionConfig), { persisted: "" }), {
				default: withCtx(() => [withDirectives(createVNode(unref(ElOverlay), {
					"custom-mask-event": "",
					mask: __props.modal,
					"overlay-class": [
						__props.modalClass ?? "",
						`${unref(ns).namespace.value}-modal-dialog`,
						unref(ns).is("penetrable", unref(penetrable))
					],
					"z-index": unref(zIndex)
				}, {
					default: withCtx(() => [createBaseVNode("div", {
						role: "dialog",
						"aria-modal": "true",
						"aria-label": __props.title || void 0,
						"aria-labelledby": !__props.title ? unref(titleId) : void 0,
						"aria-describedby": unref(bodyId),
						class: normalizeClass([`${unref(ns).namespace.value}-overlay-dialog`, unref(ns).is("closing", unref(closing))]),
						style: normalizeStyle(unref(overlayDialogStyle)),
						onClick: _cache[0] || (_cache[0] = (...args) => unref(overlayEvent).onClick && unref(overlayEvent).onClick(...args)),
						onMousedown: _cache[1] || (_cache[1] = (...args) => unref(overlayEvent).onMousedown && unref(overlayEvent).onMousedown(...args)),
						onMouseup: _cache[2] || (_cache[2] = (...args) => unref(overlayEvent).onMouseup && unref(overlayEvent).onMouseup(...args))
					}, [createVNode(unref(focus_trap_default$1), {
						loop: "",
						trapped: unref(visible),
						"focus-start-el": "container",
						onFocusAfterTrapped: unref(onOpenAutoFocus),
						onFocusAfterReleased: unref(onCloseAutoFocus),
						onFocusoutPrevented: unref(onFocusoutPrevented),
						onReleaseRequested: unref(onCloseRequested)
					}, {
						default: withCtx(() => [unref(rendered) ? (openBlock(), createBlock(dialog_content_default, mergeProps({
							key: 0,
							ref_key: "dialogContentRef",
							ref: dialogContentRef
						}, _ctx.$attrs, {
							center: __props.center,
							"align-center": unref(_alignCenter),
							"close-icon": __props.closeIcon,
							draggable: unref(_draggable),
							overflow: unref(_overflow),
							fullscreen: __props.fullscreen,
							"header-class": __props.headerClass,
							"body-class": __props.bodyClass,
							"footer-class": __props.footerClass,
							"show-close": __props.showClose,
							title: __props.title,
							"aria-level": __props.headerAriaLevel,
							onClose: unref(handleClose),
							onMousedown: unref(bringToFront)
						}), createSlots({
							header: withCtx(() => [!_ctx.$slots.title ? renderSlot(_ctx.$slots, "header", {
								key: 0,
								close: unref(handleClose),
								titleId: unref(titleId),
								titleClass: unref(ns).e("title")
							}) : renderSlot(_ctx.$slots, "title", { key: 1 })]),
							default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
							_: 2
						}, [_ctx.$slots.footer ? {
							name: "footer",
							fn: withCtx(() => [renderSlot(_ctx.$slots, "footer")]),
							key: "0"
						} : void 0]), 1040, [
							"center",
							"align-center",
							"close-icon",
							"draggable",
							"overflow",
							"fullscreen",
							"header-class",
							"body-class",
							"footer-class",
							"show-close",
							"title",
							"aria-level",
							"onClose",
							"onMousedown"
						])) : createCommentVNode("v-if", true)]),
						_: 3
					}, 8, [
						"trapped",
						"onFocusAfterTrapped",
						"onFocusAfterReleased",
						"onFocusoutPrevented",
						"onReleaseRequested"
					])], 46, _hoisted_1)]),
					_: 3
				}, 8, [
					"mask",
					"overlay-class",
					"z-index"
				]), [[vShow, unref(visible)]])]),
				_: 3
			}, 16)], 8, ["to", "disabled"]);
		};
	}
}));
//#endregion
export { ElDialog as t };
