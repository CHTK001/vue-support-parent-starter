import { $n as normalizeClass, D as createVNode, Ht as watch, Lt as useSlots, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, u as Teleport, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as clamp } from "./dist-DI3cGDuP.js";
import { u as useEventListener, v as useWindowSize } from "./dist-Clzx2YUA.js";
import { t as useDeprecated } from "./use-deprecated-qam6HGto.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { t as ElOverlay } from "./overlay-D6Leq3yd.js";
import { t as focus_trap_default$1 } from "./focus-trap-B31xXeBw.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { w as close_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { i as dialogProps, r as dialogEmits, t as useDialog } from "./use-dialog-BDtWV0XE.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/drawer/src/drawer.mjs
/**
* @deprecated Removed after 3.0.0, Use `DrawerProps` instead.
*/
var drawerProps = buildProps({
	...dialogProps,
	direction: {
		type: String,
		default: "rtl",
		values: [
			"ltr",
			"rtl",
			"ttb",
			"btt"
		]
	},
	resizable: Boolean,
	size: {
		type: [String, Number],
		default: "30%"
	},
	withHeader: {
		type: Boolean,
		default: true
	},
	modalFade: {
		type: Boolean,
		default: true
	},
	headerAriaLevel: {
		type: String,
		default: "2"
	}
});
var drawerEmits = {
	...dialogEmits,
	"resize-start": (evt, size) => evt instanceof MouseEvent && typeof size === "number",
	resize: (evt, size) => evt instanceof MouseEvent && typeof size === "number",
	"resize-end": (evt, size) => evt instanceof MouseEvent && typeof size === "number"
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/drawer/src/composables/useResizable.mjs
function useResizable(props, target, emit) {
	const { width, height } = useWindowSize();
	const isHorizontal = computed(() => ["ltr", "rtl"].includes(props.direction));
	const sign = computed(() => ["ltr", "ttb"].includes(props.direction) ? 1 : -1);
	const windowSize = computed(() => isHorizontal.value ? width.value : height.value);
	const getSize = computed(() => {
		return clamp(startSize.value + sign.value * offset.value, 4, windowSize.value);
	});
	const startSize = ref(0);
	const offset = ref(0);
	const isResizing = ref(false);
	const hasStartedDragging = ref(false);
	let startPos = [];
	let cleanups = [];
	const getActualSize = () => {
		const drawerEl = target.value?.closest("[aria-modal=\"true\"]");
		if (drawerEl) return isHorizontal.value ? drawerEl.offsetWidth : drawerEl.offsetHeight;
		return 100;
	};
	watch(() => [props.size, props.resizable], () => {
		hasStartedDragging.value = false;
		startSize.value = 0;
		offset.value = 0;
		onMouseUp();
	});
	const onMousedown = (e) => {
		if (!props.resizable) return;
		if (!hasStartedDragging.value) {
			startSize.value = getActualSize();
			hasStartedDragging.value = true;
		}
		startPos = [e.pageX, e.pageY];
		isResizing.value = true;
		emit("resize-start", e, startSize.value);
		cleanups.push(useEventListener(window, "mouseup", onMouseUp), useEventListener(window, "mousemove", onMouseMove));
	};
	const onMouseMove = (e) => {
		const { pageX, pageY } = e;
		const offsetX = pageX - startPos[0];
		const offsetY = pageY - startPos[1];
		offset.value = isHorizontal.value ? offsetX : offsetY;
		emit("resize", e, getSize.value);
	};
	const onMouseUp = (e) => {
		if (!isResizing.value) return;
		startPos = [];
		startSize.value = getSize.value;
		offset.value = 0;
		isResizing.value = false;
		cleanups.forEach((cleanup) => cleanup?.());
		cleanups = [];
		if (e) emit("resize-end", e, startSize.value);
	};
	const cleanup = useEventListener(target, "mousedown", onMousedown);
	onBeforeUnmount(() => {
		cleanup();
		onMouseUp();
	});
	return {
		size: computed(() => {
			return hasStartedDragging.value ? `${getSize.value}px` : addUnit(props.size);
		}),
		isResizing,
		isHorizontal
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/drawer/src/drawer.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"aria-label",
	"aria-labelledby",
	"aria-describedby"
];
var _hoisted_2 = ["id", "aria-level"];
var _hoisted_3 = ["aria-label"];
var _hoisted_4 = ["id"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/drawer/index.mjs
var ElDrawer = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElDrawer",
	inheritAttrs: false,
	__name: "drawer",
	props: drawerProps,
	emits: drawerEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const slots = useSlots();
		useDeprecated({
			scope: "el-drawer",
			from: "the title slot",
			replacement: "the header slot",
			version: "3.0.0",
			ref: "https://element-plus.org/en-US/component/drawer.html#slots"
		}, computed(() => !!slots.title));
		const drawerRef = ref();
		const focusStartRef = ref();
		const draggerRef = ref();
		const ns = useNamespace("drawer");
		const { t } = useLocale();
		const { afterEnter, afterLeave, beforeLeave, visible, rendered, titleId, bodyId, zIndex, onModalClick, onOpenAutoFocus, onCloseAutoFocus, onFocusoutPrevented, onCloseRequested, handleClose } = useDialog(props, drawerRef);
		const { isHorizontal, size, isResizing } = useResizable(props, draggerRef, emit);
		const penetrable = computed(() => props.modalPenetrable && !props.modal);
		__expose({ handleClose });
		return (_ctx, _cache) => {
			return openBlock(), createBlock(Teleport, {
				to: __props.appendTo,
				disabled: __props.appendTo !== "body" ? false : !__props.appendToBody
			}, [createVNode(Transition, {
				name: unref(ns).b("fade"),
				onAfterEnter: unref(afterEnter),
				onAfterLeave: unref(afterLeave),
				onBeforeLeave: unref(beforeLeave),
				persisted: ""
			}, {
				default: withCtx(() => [withDirectives(createVNode(unref(ElOverlay), {
					mask: __props.modal,
					"overlay-class": [
						unref(ns).is("drawer"),
						__props.modalClass ?? "",
						`${unref(ns).namespace.value}-modal-drawer`,
						unref(ns).is("penetrable", penetrable.value)
					],
					"z-index": unref(zIndex),
					onClick: unref(onModalClick)
				}, {
					default: withCtx(() => [createVNode(unref(focus_trap_default$1), {
						loop: "",
						trapped: unref(visible),
						"focus-trap-el": drawerRef.value,
						"focus-start-el": focusStartRef.value,
						onFocusAfterTrapped: unref(onOpenAutoFocus),
						onFocusAfterReleased: unref(onCloseAutoFocus),
						onFocusoutPrevented: unref(onFocusoutPrevented),
						onReleaseRequested: unref(onCloseRequested)
					}, {
						default: withCtx(() => [createBaseVNode("div", mergeProps({
							ref_key: "drawerRef",
							ref: drawerRef,
							"aria-modal": "true",
							"aria-label": __props.title || void 0,
							"aria-labelledby": !__props.title ? unref(titleId) : void 0,
							"aria-describedby": unref(bodyId)
						}, _ctx.$attrs, {
							class: [
								unref(ns).b(),
								__props.direction,
								unref(visible) && "open",
								unref(ns).is("dragging", unref(isResizing))
							],
							style: { [unref(isHorizontal) ? "width" : "height"]: unref(size) },
							role: "dialog",
							onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"]))
						}), [
							createBaseVNode("span", {
								ref_key: "focusStartRef",
								ref: focusStartRef,
								class: normalizeClass(unref(ns).e("sr-focus")),
								tabindex: "-1"
							}, null, 2),
							__props.withHeader ? (openBlock(), createElementBlock("header", {
								key: 0,
								class: normalizeClass([unref(ns).e("header"), __props.headerClass])
							}, [!_ctx.$slots.title ? renderSlot(_ctx.$slots, "header", {
								key: 0,
								close: unref(handleClose),
								titleId: unref(titleId),
								titleClass: unref(ns).e("title")
							}, () => [createBaseVNode("span", {
								id: unref(titleId),
								role: "heading",
								"aria-level": __props.headerAriaLevel,
								class: normalizeClass(unref(ns).e("title"))
							}, toDisplayString(__props.title), 11, _hoisted_2)]) : renderSlot(_ctx.$slots, "title", { key: 1 }, () => [createCommentVNode(" DEPRECATED SLOT ")]), __props.showClose ? (openBlock(), createElementBlock("button", {
								key: 2,
								"aria-label": unref(t)("el.drawer.close"),
								class: normalizeClass(unref(ns).e("close-btn")),
								type: "button",
								onClick: _cache[0] || (_cache[0] = (...args) => unref(handleClose) && unref(handleClose)(...args))
							}, [createVNode(unref(ElIcon), { class: normalizeClass(unref(ns).e("close")) }, {
								default: withCtx(() => [createVNode(unref(close_default))]),
								_: 1
							}, 8, ["class"])], 10, _hoisted_3)) : createCommentVNode("v-if", true)], 2)) : createCommentVNode("v-if", true),
							unref(rendered) ? (openBlock(), createElementBlock("div", {
								key: 1,
								id: unref(bodyId),
								class: normalizeClass([unref(ns).e("body"), __props.bodyClass])
							}, [renderSlot(_ctx.$slots, "default")], 10, _hoisted_4)) : createCommentVNode("v-if", true),
							_ctx.$slots.footer ? (openBlock(), createElementBlock("div", {
								key: 2,
								class: normalizeClass([unref(ns).e("footer"), __props.footerClass])
							}, [renderSlot(_ctx.$slots, "footer")], 2)) : createCommentVNode("v-if", true),
							__props.resizable ? (openBlock(), createElementBlock("div", {
								key: 3,
								ref_key: "draggerRef",
								ref: draggerRef,
								style: normalizeStyle({ zIndex: unref(zIndex) }),
								class: normalizeClass(unref(ns).e("dragger"))
							}, null, 6)) : createCommentVNode("v-if", true)
						], 16, _hoisted_1)]),
						_: 3
					}, 8, [
						"trapped",
						"focus-trap-el",
						"focus-start-el",
						"onFocusAfterTrapped",
						"onFocusAfterReleased",
						"onFocusoutPrevented",
						"onReleaseRequested"
					])]),
					_: 3
				}, 8, [
					"mask",
					"overlay-class",
					"z-index",
					"onClick"
				]), [[vShow, unref(visible)]])]),
				_: 3
			}, 8, [
				"name",
				"onAfterEnter",
				"onAfterLeave",
				"onBeforeLeave"
			])], 8, ["to", "disabled"]);
		};
	}
}));
//#endregion
export { ElDrawer as t };
