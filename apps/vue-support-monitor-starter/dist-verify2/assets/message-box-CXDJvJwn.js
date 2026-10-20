import { $n as normalizeClass, Bn as isFunction, D as createVNode, E as createTextVNode, Hn as isObject, Ht as watch, Jn as isString, Pn as hasOwn, St as resolveComponent, Tn as toRefs, Yt as withDirectives, Z as isVNode, _ as createBaseVNode, b as createElementBlock, ct as onMounted, fn as markRaw, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, S as vShow, f as render, t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { a as EVENT_CODE, n as getEventCode } from "./event-BIZRdi1l.js";
import { h as isUndefined, i as debugWarn, u as isElement } from "./use-namespace-BksmY6RT.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { a as isClient } from "./dist-DI3cGDuP.js";
import { s as obtainAllFocusableElements } from "./aria-DKP9Ei-1.js";
import { t as useDraggable } from "./use-draggable-P7Ccy1As.js";
import { n as useSameTarget, r as useLockscreen, t as ElOverlay } from "./overlay-D6Leq3yd.js";
import { t as useId } from "./use-id-C2v-tXFq.js";
import { n as _plugin_vue_export_helper_default, t as focus_trap_default$1 } from "./focus-trap-B31xXeBw.js";
import { dt as loading_default } from "./dist-DogtK295.js";
import { n as TypeComponents, r as TypeComponentsMap } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { n as useGlobalComponentSettings } from "./use-global-config-CwtC64sR.js";
import { t as isValidComponentSize } from "./validator-PIu3bjQD.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/directives/trap-focus/index.mjs
var FOCUSABLE_CHILDREN = "_trap-focus-children";
var FOCUS_STACK = [];
var FOCUS_HANDLER = (e) => {
	if (FOCUS_STACK.length === 0) return;
	const code = getEventCode(e);
	const focusableElement = FOCUS_STACK[FOCUS_STACK.length - 1][FOCUSABLE_CHILDREN];
	if (focusableElement.length > 0 && code === EVENT_CODE.tab) {
		if (focusableElement.length === 1) {
			e.preventDefault();
			if (document.activeElement !== focusableElement[0]) focusableElement[0].focus();
			return;
		}
		const goingBackward = e.shiftKey;
		const isFirst = e.target === focusableElement[0];
		const isLast = e.target === focusableElement[focusableElement.length - 1];
		if (isFirst && goingBackward) {
			e.preventDefault();
			focusableElement[focusableElement.length - 1].focus();
		}
		if (isLast && !goingBackward) {
			e.preventDefault();
			focusableElement[0].focus();
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/message-box/src/index.vue_vue_type_script_lang.mjs
var index_vue_vue_type_script_lang_default = defineComponent({
	name: "ElMessageBox",
	directives: { TrapFocus: {
		beforeMount(el) {
			el[FOCUSABLE_CHILDREN] = obtainAllFocusableElements(el);
			FOCUS_STACK.push(el);
			if (FOCUS_STACK.length <= 1) document.addEventListener("keydown", FOCUS_HANDLER);
		},
		updated(el) {
			nextTick(() => {
				el[FOCUSABLE_CHILDREN] = obtainAllFocusableElements(el);
			});
		},
		unmounted() {
			FOCUS_STACK.shift();
			if (FOCUS_STACK.length === 0) document.removeEventListener("keydown", FOCUS_HANDLER);
		}
	} },
	components: {
		ElButton,
		ElFocusTrap: focus_trap_default$1,
		ElInput,
		ElOverlay,
		ElIcon,
		...TypeComponents
	},
	inheritAttrs: false,
	props: {
		buttonSize: {
			type: String,
			validator: isValidComponentSize
		},
		modal: {
			type: Boolean,
			default: true
		},
		lockScroll: {
			type: Boolean,
			default: true
		},
		showClose: {
			type: Boolean,
			default: true
		},
		closeOnClickModal: {
			type: Boolean,
			default: true
		},
		closeOnPressEscape: {
			type: Boolean,
			default: true
		},
		closeOnHashChange: {
			type: Boolean,
			default: true
		},
		center: Boolean,
		draggable: Boolean,
		overflow: Boolean,
		roundButton: Boolean,
		container: {
			type: String,
			default: "body"
		},
		boxType: {
			type: String,
			default: ""
		}
	},
	emits: ["vanish", "action"],
	setup(props, { emit }) {
		const { locale, zIndex, ns, size: btnSize } = useGlobalComponentSettings("message-box", computed(() => props.buttonSize));
		const { t } = locale;
		const { nextZIndex } = zIndex;
		const visible = ref(false);
		const state = reactive({
			autofocus: true,
			beforeClose: null,
			callback: null,
			cancelButtonText: "",
			cancelButtonClass: "",
			confirmButtonText: "",
			confirmButtonClass: "",
			cancelButtonType: "",
			confirmButtonType: "primary",
			customClass: "",
			customStyle: {},
			dangerouslyUseHTMLString: false,
			distinguishCancelAndClose: false,
			icon: "",
			closeIcon: "",
			inputPattern: null,
			inputPlaceholder: "",
			inputType: "text",
			inputValue: "",
			inputValidator: void 0,
			inputErrorMessage: "",
			message: "",
			modalFade: true,
			modalClass: "",
			showCancelButton: false,
			showConfirmButton: true,
			type: "",
			title: void 0,
			showInput: false,
			action: "",
			confirmButtonLoading: false,
			cancelButtonLoading: false,
			confirmButtonLoadingIcon: markRaw(loading_default),
			cancelButtonLoadingIcon: markRaw(loading_default),
			confirmButtonDisabled: false,
			editorErrorMessage: "",
			validateError: false,
			zIndex: nextZIndex()
		});
		const typeClass = computed(() => {
			const type = state.type;
			return { [ns.bm("icon", type)]: type && TypeComponentsMap[type] };
		});
		const contentId = useId();
		const inputId = useId();
		const iconComponent = computed(() => {
			const type = state.type;
			return state.icon || type && TypeComponentsMap[type] || "";
		});
		const hasMessage = computed(() => !!state.message);
		const rootRef = ref();
		const headerRef = ref();
		const focusStartRef = ref();
		const inputRef = ref();
		const confirmRef = ref();
		const confirmButtonClasses = computed(() => state.confirmButtonClass);
		watch(() => state.inputValue, async (val) => {
			await nextTick();
			if (props.boxType === "prompt" && val) validate();
		}, { immediate: true });
		watch(() => visible.value, (val) => {
			if (val) {
				if (props.boxType !== "prompt") if (state.autofocus) focusStartRef.value = confirmRef.value?.$el ?? rootRef.value;
				else focusStartRef.value = rootRef.value;
				state.zIndex = nextZIndex();
			}
			if (props.boxType !== "prompt") return;
			if (val) nextTick().then(() => {
				if (inputRef.value && inputRef.value.$el) if (state.autofocus) focusStartRef.value = getInputElement() ?? rootRef.value;
				else focusStartRef.value = rootRef.value;
			});
			else {
				state.editorErrorMessage = "";
				state.validateError = false;
			}
		});
		const { isDragging } = useDraggable(rootRef, headerRef, computed(() => props.draggable), computed(() => props.overflow));
		onMounted(async () => {
			await nextTick();
			if (props.closeOnHashChange) window.addEventListener("hashchange", doClose);
		});
		onBeforeUnmount(() => {
			if (props.closeOnHashChange) window.removeEventListener("hashchange", doClose);
		});
		function doClose() {
			if (!visible.value) return;
			visible.value = false;
			nextTick(() => {
				if (state.action) emit("action", state.action);
			});
		}
		const handleWrapperClick = () => {
			if (props.closeOnClickModal) handleAction(state.distinguishCancelAndClose ? "close" : "cancel");
		};
		const overlayEvent = useSameTarget(handleWrapperClick);
		const handleInputEnter = (e) => {
			if (state.inputType !== "textarea" && !inputRef.value?.isComposing) {
				e.preventDefault();
				return handleAction("confirm");
			}
		};
		const handleAction = (action) => {
			if (props.boxType === "prompt" && action === "confirm" && !validate()) return;
			state.action = action;
			if (state.beforeClose) state.beforeClose?.(action, state, doClose);
			else doClose();
		};
		const validate = () => {
			if (props.boxType === "prompt") {
				const inputPattern = state.inputPattern;
				if (inputPattern && !inputPattern.test(state.inputValue || "")) {
					state.editorErrorMessage = state.inputErrorMessage || t("el.messagebox.error");
					state.validateError = true;
					return false;
				}
				const inputValidator = state.inputValidator;
				if (isFunction(inputValidator)) {
					const validateResult = inputValidator(state.inputValue);
					if (validateResult === false) {
						state.editorErrorMessage = state.inputErrorMessage || t("el.messagebox.error");
						state.validateError = true;
						return false;
					}
					if (isString(validateResult)) {
						state.editorErrorMessage = validateResult;
						state.validateError = true;
						return false;
					}
				}
			}
			state.editorErrorMessage = "";
			state.validateError = false;
			return true;
		};
		const getInputElement = () => {
			const inputRefs = inputRef.value?.$refs;
			return inputRefs?.input ?? inputRefs?.textarea;
		};
		const handleClose = () => {
			handleAction("close");
		};
		const onCloseRequested = () => {
			if (props.closeOnPressEscape) handleClose();
		};
		if (props.lockScroll) useLockscreen(visible, { ns });
		return {
			...toRefs(state),
			ns,
			overlayEvent,
			visible,
			hasMessage,
			typeClass,
			contentId,
			inputId,
			btnSize,
			iconComponent,
			confirmButtonClasses,
			rootRef,
			focusStartRef,
			headerRef,
			inputRef,
			isDragging,
			confirmRef,
			doClose,
			handleClose,
			onCloseRequested,
			handleWrapperClick,
			handleInputEnter,
			handleAction,
			t
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/message-box/src/index.mjs
var _hoisted_1 = ["aria-label", "aria-describedby"];
var _hoisted_2 = ["aria-label"];
var _hoisted_3 = ["id"];
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_icon = resolveComponent("el-icon");
	const _component_el_input = resolveComponent("el-input");
	const _component_el_button = resolveComponent("el-button");
	const _component_el_focus_trap = resolveComponent("el-focus-trap");
	const _component_el_overlay = resolveComponent("el-overlay");
	return openBlock(), createBlock(Transition, {
		name: "fade-in-linear",
		onAfterLeave: _cache[11] || (_cache[11] = ($event) => _ctx.$emit("vanish")),
		persisted: ""
	}, {
		default: withCtx(() => [withDirectives(createVNode(_component_el_overlay, {
			"z-index": _ctx.zIndex,
			"overlay-class": [_ctx.ns.is("message-box"), _ctx.modalClass],
			mask: _ctx.modal
		}, {
			default: withCtx(() => [createBaseVNode("div", {
				role: "dialog",
				"aria-label": _ctx.title,
				"aria-modal": "true",
				"aria-describedby": !_ctx.showInput ? _ctx.contentId : void 0,
				class: normalizeClass(`${_ctx.ns.namespace.value}-overlay-message-box`),
				onClick: _cache[8] || (_cache[8] = (...args) => _ctx.overlayEvent.onClick && _ctx.overlayEvent.onClick(...args)),
				onMousedown: _cache[9] || (_cache[9] = (...args) => _ctx.overlayEvent.onMousedown && _ctx.overlayEvent.onMousedown(...args)),
				onMouseup: _cache[10] || (_cache[10] = (...args) => _ctx.overlayEvent.onMouseup && _ctx.overlayEvent.onMouseup(...args))
			}, [createVNode(_component_el_focus_trap, {
				loop: "",
				trapped: _ctx.visible,
				"focus-trap-el": _ctx.rootRef,
				"focus-start-el": _ctx.focusStartRef,
				onReleaseRequested: _ctx.onCloseRequested
			}, {
				default: withCtx(() => [createBaseVNode("div", {
					ref: "rootRef",
					class: normalizeClass([
						_ctx.ns.b(),
						_ctx.customClass,
						_ctx.ns.is("draggable", _ctx.draggable),
						_ctx.ns.is("dragging", _ctx.isDragging),
						{ [_ctx.ns.m("center")]: _ctx.center }
					]),
					style: normalizeStyle(_ctx.customStyle),
					tabindex: "-1",
					onClick: _cache[7] || (_cache[7] = withModifiers(() => {}, ["stop"]))
				}, [
					_ctx.title !== null && _ctx.title !== void 0 ? (openBlock(), createElementBlock("div", {
						key: 0,
						ref: "headerRef",
						class: normalizeClass([_ctx.ns.e("header"), { "show-close": _ctx.showClose }])
					}, [createBaseVNode("div", { class: normalizeClass(_ctx.ns.e("title")) }, [_ctx.iconComponent && _ctx.center ? (openBlock(), createBlock(_component_el_icon, {
						key: 0,
						class: normalizeClass([_ctx.ns.e("status"), _ctx.typeClass])
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.iconComponent)))]),
						_: 1
					}, 8, ["class"])) : createCommentVNode("v-if", true), createBaseVNode("span", null, toDisplayString(_ctx.title), 1)], 2), _ctx.showClose ? (openBlock(), createElementBlock("button", {
						key: 0,
						type: "button",
						class: normalizeClass(_ctx.ns.e("headerbtn")),
						"aria-label": _ctx.t("el.messagebox.close"),
						onClick: _cache[0] || (_cache[0] = ($event) => _ctx.handleAction(_ctx.distinguishCancelAndClose ? "close" : "cancel")),
						onKeydown: _cache[1] || (_cache[1] = withKeys(withModifiers(($event) => _ctx.handleAction(_ctx.distinguishCancelAndClose ? "close" : "cancel"), ["prevent"]), ["enter"]))
					}, [createVNode(_component_el_icon, { class: normalizeClass(_ctx.ns.e("close")) }, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.closeIcon || "close")))]),
						_: 1
					}, 8, ["class"])], 42, _hoisted_2)) : createCommentVNode("v-if", true)], 2)) : createCommentVNode("v-if", true),
					createBaseVNode("div", {
						id: _ctx.contentId,
						class: normalizeClass(_ctx.ns.e("content"))
					}, [createBaseVNode("div", { class: normalizeClass(_ctx.ns.e("container")) }, [_ctx.iconComponent && !_ctx.center && _ctx.hasMessage ? (openBlock(), createBlock(_component_el_icon, {
						key: 0,
						class: normalizeClass([_ctx.ns.e("status"), _ctx.typeClass])
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.iconComponent)))]),
						_: 1
					}, 8, ["class"])) : createCommentVNode("v-if", true), _ctx.hasMessage ? (openBlock(), createElementBlock("div", {
						key: 1,
						class: normalizeClass(_ctx.ns.e("message"))
					}, [renderSlot(_ctx.$slots, "default", {}, () => [!_ctx.dangerouslyUseHTMLString ? (openBlock(), createBlock(resolveDynamicComponent(_ctx.showInput ? "label" : "p"), {
						key: 0,
						for: _ctx.showInput ? _ctx.inputId : void 0,
						textContent: toDisplayString(_ctx.message)
					}, null, 8, ["for", "textContent"])) : (openBlock(), createBlock(resolveDynamicComponent(_ctx.showInput ? "label" : "p"), {
						key: 1,
						for: _ctx.showInput ? _ctx.inputId : void 0,
						innerHTML: _ctx.message
					}, null, 8, ["for", "innerHTML"]))])], 2)) : createCommentVNode("v-if", true)], 2), withDirectives(createBaseVNode("div", { class: normalizeClass(_ctx.ns.e("input")) }, [createVNode(_component_el_input, {
						id: _ctx.inputId,
						ref: "inputRef",
						modelValue: _ctx.inputValue,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => _ctx.inputValue = $event),
						type: _ctx.inputType,
						placeholder: _ctx.inputPlaceholder,
						"aria-invalid": _ctx.validateError,
						class: normalizeClass({ invalid: _ctx.validateError }),
						onKeydown: withKeys(_ctx.handleInputEnter, ["enter"])
					}, null, 8, [
						"id",
						"modelValue",
						"type",
						"placeholder",
						"aria-invalid",
						"class",
						"onKeydown"
					]), createBaseVNode("div", {
						class: normalizeClass(_ctx.ns.e("errormsg")),
						style: normalizeStyle({ visibility: !!_ctx.editorErrorMessage ? "visible" : "hidden" })
					}, toDisplayString(_ctx.editorErrorMessage), 7)], 2), [[vShow, _ctx.showInput]])], 10, _hoisted_3),
					_ctx.showCancelButton || _ctx.showConfirmButton ? (openBlock(), createElementBlock("div", {
						key: 1,
						class: normalizeClass(_ctx.ns.e("btns"))
					}, [_ctx.showCancelButton ? (openBlock(), createBlock(_component_el_button, {
						key: 0,
						type: _ctx.cancelButtonType === "text" ? "" : _ctx.cancelButtonType,
						text: _ctx.cancelButtonType === "text",
						loading: _ctx.cancelButtonLoading,
						"loading-icon": _ctx.cancelButtonLoadingIcon,
						class: normalizeClass([_ctx.cancelButtonClass]),
						round: _ctx.roundButton,
						size: _ctx.btnSize,
						onClick: _cache[3] || (_cache[3] = ($event) => _ctx.handleAction("cancel")),
						onKeydown: _cache[4] || (_cache[4] = withKeys(withModifiers(($event) => _ctx.handleAction("cancel"), ["prevent"]), ["enter"]))
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(_ctx.cancelButtonText || _ctx.t("el.messagebox.cancel")), 1)]),
						_: 1
					}, 8, [
						"type",
						"text",
						"loading",
						"loading-icon",
						"class",
						"round",
						"size"
					])) : createCommentVNode("v-if", true), withDirectives(createVNode(_component_el_button, {
						ref: "confirmRef",
						type: _ctx.confirmButtonType === "text" ? "" : _ctx.confirmButtonType,
						text: _ctx.confirmButtonType === "text",
						loading: _ctx.confirmButtonLoading,
						"loading-icon": _ctx.confirmButtonLoadingIcon,
						class: normalizeClass([_ctx.confirmButtonClasses]),
						round: _ctx.roundButton,
						disabled: _ctx.confirmButtonDisabled,
						size: _ctx.btnSize,
						onClick: _cache[5] || (_cache[5] = ($event) => _ctx.handleAction("confirm")),
						onKeydown: _cache[6] || (_cache[6] = withKeys(withModifiers(($event) => _ctx.handleAction("confirm"), ["prevent"]), ["enter"]))
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(_ctx.confirmButtonText || _ctx.t("el.messagebox.confirm")), 1)]),
						_: 1
					}, 8, [
						"type",
						"text",
						"loading",
						"loading-icon",
						"class",
						"round",
						"disabled",
						"size"
					]), [[vShow, _ctx.showConfirmButton]])], 2)) : createCommentVNode("v-if", true)
				], 6)]),
				_: 3
			}, 8, [
				"trapped",
				"focus-trap-el",
				"focus-start-el",
				"onReleaseRequested"
			])], 42, _hoisted_1)]),
			_: 3
		}, 8, [
			"z-index",
			"overlay-class",
			"mask"
		]), [[vShow, _ctx.visible]])]),
		_: 3
	});
}
var src_default = /* @__PURE__ */ _plugin_vue_export_helper_default(index_vue_vue_type_script_lang_default, [["render", _sfc_render]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/message-box/src/messageBox.mjs
var messageInstance = /* @__PURE__ */ new Map();
var getAppendToElement = (props) => {
	let appendTo = document.body;
	if (props.appendTo) {
		if (isString(props.appendTo)) appendTo = document.querySelector(props.appendTo);
		if (isElement(props.appendTo)) appendTo = props.appendTo;
		if (!isElement(appendTo)) {
			debugWarn("ElMessageBox", "the appendTo option is not an HTMLElement. Falling back to document.body.");
			appendTo = document.body;
		}
	}
	return appendTo;
};
var handleAction = (vnode, action) => {
	const vm = vnode.component?.proxy;
	return () => vm.handleAction(action);
};
var initInstance = (props, container, appContext = null) => {
	const vnode = createVNode(src_default, props, isFunction(props.message) || isVNode(props.message) ? { default: isFunction(props.message) ? () => props.message({
		confirm: handleAction(vnode, "confirm"),
		cancel: handleAction(vnode, "cancel"),
		close: handleAction(vnode, "close")
	}) : () => props.message } : null);
	vnode.appContext = appContext;
	render(vnode, container);
	getAppendToElement(props).appendChild(container.firstElementChild);
	return vnode.component;
};
var genContainer = () => {
	return document.createElement("div");
};
var showMessage = (options, appContext) => {
	const container = genContainer();
	options.onVanish = () => {
		render(null, container);
		messageInstance.delete(vm);
	};
	options.onAction = (action) => {
		const currentMsg = messageInstance.get(vm);
		let resolve;
		if (options.showInput) resolve = {
			value: vm.inputValue,
			action
		};
		else resolve = action;
		if (options.callback) options.callback(resolve, instance.proxy);
		else if (action === "cancel" || action === "close") if (options.distinguishCancelAndClose && action !== "cancel") currentMsg.reject("close");
		else currentMsg.reject("cancel");
		else currentMsg.resolve(resolve);
	};
	const instance = initInstance(options, container, appContext);
	const vm = instance.proxy;
	for (const prop in options) if (hasOwn(options, prop) && !hasOwn(vm.$props, prop)) if (prop === "closeIcon" && isObject(options[prop])) vm[prop] = markRaw(options[prop]);
	else vm[prop] = options[prop];
	vm.visible = true;
	return vm;
};
function MessageBox(options, appContext = null) {
	if (!isClient) return Promise.reject();
	let callback;
	if (isString(options) || isVNode(options)) options = { message: options };
	else callback = options.callback;
	return new Promise((resolve, reject) => {
		const vm = showMessage(options, appContext ?? MessageBox._context);
		messageInstance.set(vm, {
			options,
			callback,
			resolve,
			reject
		});
	});
}
var MESSAGE_BOX_VARIANTS = [
	"alert",
	"confirm",
	"prompt"
];
var MESSAGE_BOX_DEFAULT_OPTS = {
	alert: {
		closeOnPressEscape: false,
		closeOnClickModal: false
	},
	confirm: { showCancelButton: true },
	prompt: {
		showCancelButton: true,
		showInput: true
	}
};
MESSAGE_BOX_VARIANTS.forEach((boxType) => {
	MessageBox[boxType] = messageBoxFactory(boxType);
});
function messageBoxFactory(boxType) {
	return (message, title, options, appContext) => {
		let titleOrOpts = "";
		if (isObject(title)) {
			options = title;
			titleOrOpts = "";
		} else if (isUndefined(title)) titleOrOpts = "";
		else titleOrOpts = title;
		return MessageBox(Object.assign({
			title: titleOrOpts,
			message,
			type: "",
			...MESSAGE_BOX_DEFAULT_OPTS[boxType]
		}, options, { boxType }), appContext);
	};
}
MessageBox.close = () => {
	messageInstance.forEach((_, vm) => {
		vm.doClose();
	});
	messageInstance.clear();
};
MessageBox._context = null;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/message-box/index.mjs
var _MessageBox = MessageBox;
_MessageBox.install = (app) => {
	_MessageBox._context = app._context;
	app.config.globalProperties.$msgbox = _MessageBox;
	app.config.globalProperties.$messageBox = _MessageBox;
	app.config.globalProperties.$alert = _MessageBox.alert;
	app.config.globalProperties.$confirm = _MessageBox.confirm;
	app.config.globalProperties.$prompt = _MessageBox.prompt;
};
var ElMessageBox = _MessageBox;
//#endregion
export { ElMessageBox as t };
