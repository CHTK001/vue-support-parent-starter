import { Bn as isFunction, Hn as isObject, Ht as watch, L as getCurrentInstance, Rn as isArray, ct as onMounted, g as computed, tt as nextTick, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as UPDATE_MODEL_EVENT } from "./event-CeZgVnv0.js";
import { c as definePropType, i as debugWarn, l as isBoolean, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { a as isClient, b as useTimeoutFn } from "./dist-DI3cGDuP.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { r as useLockscreen } from "./overlay-D6Leq3yd.js";
import { t as useId } from "./use-id-C2v-tXFq.js";
import { n as useZIndex } from "./use-z-index-Q40Vppe1.js";
import { a as iconPropType } from "./icon-C0dIJHSD.js";
import { r as useGlobalConfig } from "./use-global-config-CwtC64sR.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dialog/src/dialog-content.mjs
/**
* @deprecated Removed after 3.0.0, Use `DialogContentProps` instead.
*/
var dialogContentProps = buildProps({
	/**
	* @description whether to align the header and footer in center
	*/
	center: Boolean,
	/**
	* @description whether to align the dialog both horizontally and vertically
	*/
	alignCenter: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description custom close icon, default is Close
	*/
	closeIcon: { type: iconPropType },
	/**
	* @description enable dragging feature for Dialog
	*/
	draggable: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description draggable Dialog can overflow the viewport
	*/
	overflow: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description whether the Dialog takes up full screen
	*/
	fullscreen: Boolean,
	/**
	* @description custom class names for header wrapper
	*/
	headerClass: String,
	/**
	* @description custom class names for body wrapper
	*/
	bodyClass: String,
	/**
	* @description custom class names for footer wrapper
	*/
	footerClass: String,
	/**
	* @description whether to show a close button
	*/
	showClose: {
		type: Boolean,
		default: true
	},
	/**
	* @description title of Dialog. Can also be passed with a named slot (see the following table)
	*/
	title: {
		type: String,
		default: ""
	},
	/**
	* @description header's aria-level attribute
	*/
	ariaLevel: {
		type: String,
		default: "2"
	}
});
var dialogContentEmits = { close: () => true };
var dialogContentPropsDefaults = {
	alignCenter: void 0,
	draggable: void 0,
	overflow: void 0,
	showClose: true,
	title: "",
	ariaLevel: "2"
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dialog/src/dialog.mjs
/**
* @deprecated Removed after 3.0.0, Use `DialogProps` instead.
*/
var dialogProps = buildProps({
	...dialogContentProps,
	/**
	* @description whether to append Dialog itself to body. A nested Dialog should have this attribute set to `true`
	*/
	appendToBody: Boolean,
	/**
	* @description which element the Dialog appends to
	*/
	appendTo: {
		type: definePropType([String, Object]),
		default: "body"
	},
	/**
	* @description callback before Dialog closes, and it will prevent Dialog from closing, use done to close the dialog
	*/
	beforeClose: { type: definePropType(Function) },
	/**
	* @description destroy elements in Dialog when closed
	*/
	destroyOnClose: Boolean,
	/**
	* @description whether the Dialog can be closed by clicking the mask
	*/
	closeOnClickModal: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether the Dialog can be closed by pressing ESC
	*/
	closeOnPressEscape: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether scroll of body is disabled while Dialog is displayed
	*/
	lockScroll: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether a mask is displayed
	*/
	modal: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether the mask is penetrable
	*/
	modalPenetrable: Boolean,
	/**
	* @description the Time(milliseconds) before open
	*/
	openDelay: {
		type: Number,
		default: 0
	},
	/**
	* @description the Time(milliseconds) before close
	*/
	closeDelay: {
		type: Number,
		default: 0
	},
	/**
	* @description value for `margin-top` of Dialog CSS, default is 15vh
	*/
	top: { type: String },
	/**
	* @description visibility of Dialog
	*/
	modelValue: Boolean,
	/**
	* @description custom class names for mask
	*/
	modalClass: String,
	/**
	* @description custom class names for header wrapper
	*/
	headerClass: String,
	/**
	* @description custom class names for body wrapper
	*/
	bodyClass: String,
	/**
	* @description custom class names for footer wrapper
	*/
	footerClass: String,
	/**
	* @description width of Dialog, default is 50%
	*/
	width: { type: [String, Number] },
	/**
	* @description same as z-index in native CSS, z-order of dialog
	*/
	zIndex: { type: Number },
	trapFocus: Boolean,
	/**
	* @description header's aria-level attribute
	*/
	headerAriaLevel: {
		type: String,
		default: "2"
	},
	/**
	* @description custom transition configuration for dialog animation, it can be a string (transition name) or an object with Vue transition props
	*/
	transition: {
		type: definePropType([String, Object]),
		default: void 0
	}
});
var dialogEmits = {
	open: () => true,
	opened: () => true,
	close: () => true,
	closed: () => true,
	[UPDATE_MODEL_EVENT]: (value) => isBoolean(value),
	openAutoFocus: () => true,
	closeAutoFocus: () => true
};
({ ...dialogContentPropsDefaults });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dialog/src/constants.mjs
var dialogInjectionKey = Symbol("dialogInjectionKey");
var DEFAULT_DIALOG_TRANSITION = "dialog-fade";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dialog/src/use-dialog.mjs
var COMPONENT_NAME = "ElDialog";
var useDialog = (props, targetRef) => {
	const emit = getCurrentInstance().emit;
	const { nextZIndex } = useZIndex();
	let lastPosition = "";
	const titleId = useId();
	const bodyId = useId();
	const visible = ref(false);
	const closed = ref(false);
	const rendered = ref(false);
	const zIndex = ref(props.zIndex ?? nextZIndex());
	const closing = ref(false);
	let openTimer = void 0;
	let closeTimer = void 0;
	const config = useGlobalConfig();
	const namespace = computed(() => config.value?.namespace ?? "el");
	const globalConfig = computed(() => config.value?.dialog);
	const style = computed(() => {
		const style = {};
		const varPrefix = `--${namespace.value}-dialog`;
		if (!props.fullscreen) {
			if (props.top) style[`${varPrefix}-margin-top`] = props.top;
			const width = addUnit(props.width);
			if (width) style[`${varPrefix}-width`] = width;
		}
		return style;
	});
	const _draggable = computed(() => (props.draggable ?? globalConfig.value?.draggable ?? false) && !props.fullscreen);
	const _alignCenter = computed(() => props.alignCenter ?? globalConfig.value?.alignCenter ?? false);
	const _overflow = computed(() => props.overflow ?? globalConfig.value?.overflow ?? false);
	const penetrable = computed(() => props.modalPenetrable && !props.modal && !props.fullscreen);
	const overlayDialogStyle = computed(() => {
		if (_alignCenter.value) return { display: "flex" };
		return {};
	});
	const transitionConfig = computed(() => {
		const transition = props.transition ?? globalConfig.value?.transition ?? "dialog-fade";
		const baseConfig = {
			name: transition,
			onAfterEnter: afterEnter,
			onBeforeLeave: beforeLeave,
			onAfterLeave: afterLeave
		};
		if (isObject(transition)) {
			const config = { ...transition };
			const _mergeHook = (userHook, defaultHook) => {
				return (el) => {
					if (isArray(userHook)) userHook.forEach((fn) => {
						if (isFunction(fn)) fn(el);
					});
					else if (isFunction(userHook)) userHook(el);
					defaultHook();
				};
			};
			config.onAfterEnter = _mergeHook(config.onAfterEnter, afterEnter);
			config.onBeforeLeave = _mergeHook(config.onBeforeLeave, beforeLeave);
			config.onAfterLeave = _mergeHook(config.onAfterLeave, afterLeave);
			if (!config.name) {
				config.name = DEFAULT_DIALOG_TRANSITION;
				debugWarn(COMPONENT_NAME, `transition.name is missing when using object syntax, fallback to '${DEFAULT_DIALOG_TRANSITION}'`);
			}
			return config;
		}
		return baseConfig;
	});
	function afterEnter() {
		emit("opened");
	}
	function afterLeave() {
		emit("closed");
		emit(UPDATE_MODEL_EVENT, false);
		if (props.destroyOnClose) rendered.value = false;
		closing.value = false;
	}
	function beforeLeave() {
		closing.value = true;
		emit("close");
	}
	function open() {
		closeTimer?.();
		openTimer?.();
		if (props.openDelay && props.openDelay > 0) ({stop: openTimer} = useTimeoutFn(() => doOpen(), props.openDelay));
		else doOpen();
	}
	function close() {
		openTimer?.();
		closeTimer?.();
		if (props.closeDelay && props.closeDelay > 0) ({stop: closeTimer} = useTimeoutFn(() => doClose(), props.closeDelay));
		else doClose();
	}
	function handleClose() {
		function hide(shouldCancel) {
			if (shouldCancel) return;
			closed.value = true;
			visible.value = false;
		}
		if (props.beforeClose) props.beforeClose(hide);
		else close();
	}
	function onModalClick() {
		if (props.closeOnClickModal) handleClose();
	}
	function doOpen() {
		if (!isClient) return;
		visible.value = true;
	}
	function doClose() {
		visible.value = false;
	}
	function onOpenAutoFocus() {
		emit("openAutoFocus");
	}
	function onCloseAutoFocus() {
		emit("closeAutoFocus");
	}
	function onFocusoutPrevented(event) {
		if (event.detail?.focusReason === "pointer") event.preventDefault();
	}
	if (props.lockScroll) useLockscreen(visible);
	function onCloseRequested() {
		if (props.closeOnPressEscape) handleClose();
	}
	function bringToFront() {
		if (!visible.value || !penetrable.value || props.zIndex !== void 0) return;
		zIndex.value = nextZIndex();
	}
	watch(() => props.zIndex, () => {
		zIndex.value = props.zIndex ?? nextZIndex();
	});
	watch(() => props.modelValue, (val) => {
		if (val) {
			closed.value = false;
			closing.value = false;
			open();
			rendered.value = true;
			zIndex.value = props.zIndex ?? nextZIndex();
			nextTick(() => {
				emit("open");
				if (targetRef.value) {
					targetRef.value.parentElement.scrollTop = 0;
					targetRef.value.parentElement.scrollLeft = 0;
					targetRef.value.scrollTop = 0;
				}
			});
		} else if (visible.value) close();
	});
	watch(() => props.fullscreen, (val) => {
		if (!targetRef.value) return;
		if (val) {
			lastPosition = targetRef.value.style.transform;
			targetRef.value.style.transform = "";
		} else targetRef.value.style.transform = lastPosition;
	});
	onMounted(() => {
		if (props.modelValue) {
			visible.value = true;
			rendered.value = true;
			open();
		}
	});
	return {
		afterEnter,
		afterLeave,
		beforeLeave,
		handleClose,
		onModalClick,
		close,
		doClose,
		onOpenAutoFocus,
		onCloseAutoFocus,
		onCloseRequested,
		onFocusoutPrevented,
		bringToFront,
		titleId,
		bodyId,
		closed,
		style,
		overlayDialogStyle,
		rendered,
		visible,
		zIndex,
		transitionConfig,
		_draggable,
		_alignCenter,
		_overflow,
		closing,
		penetrable
	};
};
//#endregion
export { dialogContentEmits as a, dialogProps as i, dialogInjectionKey as n, dialogContentProps as o, dialogEmits as r, useDialog as t };
