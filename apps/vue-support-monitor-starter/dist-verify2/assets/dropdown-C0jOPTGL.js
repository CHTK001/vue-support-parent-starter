import { $n as normalizeClass, D as createVNode, Ht as watch, J as inject, L as getCurrentInstance, On as unref, St as resolveComponent, _ as createBaseVNode, _n as readonly, b as createElementBlock, ct as onMounted, et as mergeProps, g as computed, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, tr as normalizeProps, tt as nextTick, v as createBlock, vn as ref, w as createSlots, wn as toRef, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode, z as guardReactiveProps } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { a as EVENT_CODE, i as whenMouse, n as getEventCode, t as composeEventHandlers } from "./event-BIZRdi1l.js";
import { t as castArray } from "./castArray-DkZAeVfZ.js";
import { c as definePropType, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { u as useEventListener } from "./dist-Clzx2YUA.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { c as OnlyChild, t as ElTooltip } from "./tooltip-DEX5DBfd.js";
import { n as useFormSize } from "./use-form-common-props-DzQ9ZY64.js";
import { t as useId } from "./use-id-C2v-tXFq.js";
import { n as _plugin_vue_export_helper_default } from "./focus-trap-B31xXeBw.js";
import { i as withNoopInstall, t as withInstall } from "./install-CE5IEjzX.js";
import { r as arrow_down_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as ElScrollbar } from "./scrollbar-DRrkTSQ2.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as composeRefs } from "./refs-BRnhjbOJ.js";
import { n as dropdownMenuProps, r as dropdownProps, t as dropdownItemProps } from "./dropdown-BQYEchFy.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/tokens.mjs
var DROPDOWN_INJECTION_KEY = Symbol("elDropdown");
var DROPDOWN_INSTANCE_INJECTION_KEY = "elDropdown";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collection/src/collection.vue_vue_type_script_lang.mjs
var collection_vue_vue_type_script_lang_default = defineComponent({ inheritAttrs: false });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collection/src/collection2.mjs
function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default");
}
var collection_default = /* @__PURE__ */ _plugin_vue_export_helper_default(collection_vue_vue_type_script_lang_default, [["render", _sfc_render$8]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collection/src/collection-item.vue_vue_type_script_lang.mjs
var collection_item_vue_vue_type_script_lang_default = defineComponent({
	name: "ElCollectionItem",
	inheritAttrs: false
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collection/src/collection-item.mjs
function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default");
}
var collection_item_default = /* @__PURE__ */ _plugin_vue_export_helper_default(collection_item_vue_vue_type_script_lang_default, [["render", _sfc_render$7]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collection/src/collection.mjs
var COLLECTION_ITEM_SIGN = `data-el-collection-item`;
var createCollectionWithScope = (name) => {
	const COLLECTION_NAME = `El${name}Collection`;
	const COLLECTION_ITEM_NAME = `${COLLECTION_NAME}Item`;
	const COLLECTION_INJECTION_KEY = Symbol(COLLECTION_NAME);
	const COLLECTION_ITEM_INJECTION_KEY = Symbol(COLLECTION_ITEM_NAME);
	return {
		COLLECTION_INJECTION_KEY,
		COLLECTION_ITEM_INJECTION_KEY,
		ElCollection: Object.assign({}, collection_default, {
			name: COLLECTION_NAME,
			setup() {
				const collectionRef = ref();
				const itemMap = /* @__PURE__ */ new Map();
				const getItems = (() => {
					const collectionEl = unref(collectionRef);
					if (!collectionEl) return [];
					const orderedNodes = Array.from(collectionEl.querySelectorAll(`[${COLLECTION_ITEM_SIGN}]`));
					return [...itemMap.values()].sort((a, b) => orderedNodes.indexOf(a.ref) - orderedNodes.indexOf(b.ref));
				});
				provide(COLLECTION_INJECTION_KEY, {
					itemMap,
					getItems,
					collectionRef
				});
			}
		}),
		ElCollectionItem: Object.assign({}, collection_item_default, {
			name: COLLECTION_ITEM_NAME,
			setup(_, { attrs }) {
				const collectionItemRef = ref();
				const collectionInjection = inject(COLLECTION_INJECTION_KEY, void 0);
				provide(COLLECTION_ITEM_INJECTION_KEY, { collectionItemRef });
				onMounted(() => {
					const collectionItemEl = unref(collectionItemRef);
					if (collectionItemEl) collectionInjection.itemMap.set(collectionItemEl, {
						ref: collectionItemEl,
						...attrs
					});
				});
				onBeforeUnmount(() => {
					const collectionItemEl = unref(collectionItemRef);
					collectionInjection.itemMap.delete(collectionItemEl);
				});
			}
		})
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/src/roving-focus-group.mjs
var rovingFocusGroupProps = buildProps({
	style: {
		type: definePropType([
			String,
			Array,
			Object,
			Boolean
		]),
		default: void 0
	},
	currentTabId: { type: definePropType(String) },
	defaultCurrentTabId: String,
	loop: Boolean,
	dir: {
		type: String,
		values: ["ltr", "rtl"],
		default: "ltr"
	},
	orientation: { type: definePropType(String) },
	onBlur: Function,
	onFocus: Function,
	onMousedown: Function
});
var { ElCollection, ElCollectionItem, COLLECTION_INJECTION_KEY, COLLECTION_ITEM_INJECTION_KEY } = createCollectionWithScope("RovingFocusGroup");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/src/tokens.mjs
var ROVING_FOCUS_GROUP_INJECTION_KEY = Symbol("elRovingFocusGroup");
var ROVING_FOCUS_GROUP_ITEM_INJECTION_KEY = Symbol("elRovingFocusGroupItem");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/src/utils.mjs
var MAP_KEY_TO_FOCUS_INTENT = {
	ArrowLeft: "prev",
	ArrowUp: "prev",
	ArrowRight: "next",
	ArrowDown: "next",
	PageUp: "first",
	Home: "first",
	PageDown: "last",
	End: "last"
};
var getDirectionAwareKey = (key, dir) => {
	if (dir !== "rtl") return key;
	switch (key) {
		case EVENT_CODE.right: return EVENT_CODE.left;
		case EVENT_CODE.left: return EVENT_CODE.right;
		default: return key;
	}
};
var getFocusIntent = (event, orientation, dir) => {
	const key = getDirectionAwareKey(getEventCode(event), dir);
	if (orientation === "vertical" && [EVENT_CODE.left, EVENT_CODE.right].includes(key)) return void 0;
	if (orientation === "horizontal" && [EVENT_CODE.up, EVENT_CODE.down].includes(key)) return void 0;
	return MAP_KEY_TO_FOCUS_INTENT[key];
};
var reorderArray = (array, atIdx) => {
	return array.map((_, idx) => array[(idx + atIdx) % array.length]);
};
var focusFirst = (elements) => {
	const { activeElement: prevActive } = document;
	for (const element of elements) {
		if (element === prevActive) return;
		element.focus();
		if (prevActive !== document.activeElement) return;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/src/roving-focus-group-impl.vue_vue_type_script_lang.mjs
var CURRENT_TAB_ID_CHANGE_EVT = "currentTabIdChange";
var ENTRY_FOCUS_EVT = "rovingFocusGroup.entryFocus";
var EVT_OPTS = {
	bubbles: false,
	cancelable: true
};
var roving_focus_group_impl_vue_vue_type_script_lang_default = defineComponent({
	name: "ElRovingFocusGroupImpl",
	inheritAttrs: false,
	props: rovingFocusGroupProps,
	emits: [CURRENT_TAB_ID_CHANGE_EVT, "entryFocus"],
	setup(props, { emit }) {
		const currentTabbedId = ref((props.currentTabId || props.defaultCurrentTabId) ?? null);
		const isBackingOut = ref(false);
		const isClickFocus = ref(false);
		const rovingFocusGroupRef = ref();
		const { getItems } = inject(COLLECTION_INJECTION_KEY, void 0);
		const rovingFocusGroupRootStyle = computed(() => {
			return [{ outline: "none" }, props.style];
		});
		const onItemFocus = (tabbedId) => {
			emit(CURRENT_TAB_ID_CHANGE_EVT, tabbedId);
		};
		const onItemShiftTab = () => {
			isBackingOut.value = true;
		};
		const onMousedown = composeEventHandlers((e) => {
			props.onMousedown?.(e);
		}, () => {
			isClickFocus.value = true;
		});
		const onFocus = composeEventHandlers((e) => {
			props.onFocus?.(e);
		}, (e) => {
			const isKeyboardFocus = !unref(isClickFocus);
			const { target, currentTarget } = e;
			if (target === currentTarget && isKeyboardFocus && !unref(isBackingOut)) {
				const entryFocusEvt = new Event(ENTRY_FOCUS_EVT, EVT_OPTS);
				currentTarget?.dispatchEvent(entryFocusEvt);
				if (!entryFocusEvt.defaultPrevented) {
					const items = getItems().filter((item) => item.focusable);
					focusFirst([
						items.find((item) => item.active),
						items.find((item) => item.id === unref(currentTabbedId)),
						...items
					].filter(Boolean).map((item) => item.ref));
				}
			}
			isClickFocus.value = false;
		});
		const onBlur = composeEventHandlers((e) => {
			props.onBlur?.(e);
		}, () => {
			isBackingOut.value = false;
		});
		const handleEntryFocus = (...args) => {
			emit("entryFocus", ...args);
		};
		const onKeydown = (e) => {
			const focusIntent = getFocusIntent(e);
			if (focusIntent) {
				e.preventDefault();
				let elements = getItems().filter((item) => item.focusable).map((item) => item.ref);
				switch (focusIntent) {
					case "last":
						elements.reverse();
						break;
					case "prev":
					case "next": {
						if (focusIntent === "prev") elements.reverse();
						const currentIdx = elements.indexOf(e.currentTarget);
						elements = props.loop ? reorderArray(elements, currentIdx + 1) : elements.slice(currentIdx + 1);
						break;
					}
				}
				nextTick(() => {
					focusFirst(elements);
				});
			}
		};
		provide(ROVING_FOCUS_GROUP_INJECTION_KEY, {
			currentTabbedId: readonly(currentTabbedId),
			loop: toRef(props, "loop"),
			tabIndex: computed(() => {
				return unref(isBackingOut) ? -1 : 0;
			}),
			rovingFocusGroupRef,
			rovingFocusGroupRootStyle,
			orientation: toRef(props, "orientation"),
			dir: toRef(props, "dir"),
			onItemFocus,
			onItemShiftTab,
			onBlur,
			onFocus,
			onMousedown,
			onKeydown
		});
		watch(() => props.currentTabId, (val) => {
			currentTabbedId.value = val ?? null;
		});
		useEventListener(rovingFocusGroupRef, ENTRY_FOCUS_EVT, handleEntryFocus);
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/src/roving-focus-group-impl.mjs
function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
	return renderSlot(_ctx.$slots, "default");
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/src/roving-focus-group.vue_vue_type_script_lang.mjs
var roving_focus_group_vue_vue_type_script_lang_default = defineComponent({
	name: "ElRovingFocusGroup",
	components: {
		ElFocusGroupCollection: ElCollection,
		ElRovingFocusGroupImpl: /* @__PURE__ */ _plugin_vue_export_helper_default(roving_focus_group_impl_vue_vue_type_script_lang_default, [["render", _sfc_render$6]])
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/src/roving-focus-group2.mjs
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_roving_focus_group_impl = resolveComponent("el-roving-focus-group-impl");
	const _component_el_focus_group_collection = resolveComponent("el-focus-group-collection");
	return openBlock(), createBlock(_component_el_focus_group_collection, null, {
		default: withCtx(() => [createVNode(_component_el_roving_focus_group_impl, normalizeProps(guardReactiveProps(_ctx.$attrs)), {
			default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
			_: 3
		}, 16)]),
		_: 3
	});
}
var roving_focus_group_default = /* @__PURE__ */ _plugin_vue_export_helper_default(roving_focus_group_vue_vue_type_script_lang_default, [["render", _sfc_render$5]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/src/roving-focus-item.vue_vue_type_script_lang.mjs
var roving_focus_item_vue_vue_type_script_lang_default = defineComponent({
	components: { ElRovingFocusCollectionItem: ElCollectionItem },
	props: {
		focusable: {
			type: Boolean,
			default: true
		},
		active: Boolean
	},
	emits: [
		"mousedown",
		"focus",
		"keydown"
	],
	setup(props, { emit }) {
		const { currentTabbedId, onItemFocus, onItemShiftTab, onKeydown } = inject(ROVING_FOCUS_GROUP_INJECTION_KEY, void 0);
		const id = useId();
		const rovingFocusGroupItemRef = ref();
		const handleMousedown = composeEventHandlers((e) => {
			emit("mousedown", e);
		}, (e) => {
			if (!props.focusable) e.preventDefault();
			else onItemFocus(unref(id));
		});
		const handleFocus = composeEventHandlers((e) => {
			emit("focus", e);
		}, () => {
			onItemFocus(unref(id));
		});
		const handleKeydown = composeEventHandlers((e) => {
			emit("keydown", e);
		}, (e) => {
			const { shiftKey, target, currentTarget } = e;
			if (getEventCode(e) === EVENT_CODE.tab && shiftKey) {
				onItemShiftTab();
				return;
			}
			if (target !== currentTarget) return;
			onKeydown(e);
		});
		const isCurrentTab = computed(() => currentTabbedId.value === unref(id));
		provide(ROVING_FOCUS_GROUP_ITEM_INJECTION_KEY, {
			rovingFocusGroupItemRef,
			tabIndex: computed(() => unref(isCurrentTab) ? 0 : -1),
			handleMousedown,
			handleFocus,
			handleKeydown
		});
		return {
			id,
			handleKeydown,
			handleFocus,
			handleMousedown
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/src/roving-focus-item.mjs
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_roving_focus_collection_item = resolveComponent("el-roving-focus-collection-item");
	return openBlock(), createBlock(_component_el_roving_focus_collection_item, {
		id: _ctx.id,
		focusable: _ctx.focusable,
		active: _ctx.active
	}, {
		default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
		_: 3
	}, 8, [
		"id",
		"focusable",
		"active"
	]);
}
var roving_focus_item_default = /* @__PURE__ */ _plugin_vue_export_helper_default(roving_focus_item_vue_vue_type_script_lang_default, [["render", _sfc_render$4]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/roving-focus-group/index.mjs
var roving_focus_group_default$1 = roving_focus_group_default;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/dropdown.vue_vue_type_script_lang.mjs
var { ButtonGroup: ElButtonGroup } = ElButton;
var dropdown_vue_vue_type_script_lang_default = defineComponent({
	name: "ElDropdown",
	components: {
		ElButton,
		ElButtonGroup,
		ElScrollbar,
		ElTooltip,
		ElRovingFocusGroup: roving_focus_group_default$1,
		ElOnlyChild: OnlyChild,
		ElIcon,
		ArrowDown: arrow_down_default
	},
	props: dropdownProps,
	emits: [
		"visible-change",
		"click",
		"command"
	],
	setup(props, { emit }) {
		const _instance = getCurrentInstance();
		const ns = useNamespace("dropdown");
		const { t } = useLocale();
		const triggeringElementRef = ref();
		const referenceElementRef = ref();
		const popperRef = ref();
		const contentRef = ref();
		const scrollbar = ref(null);
		const currentTabId = ref(null);
		const isUsingKeyboard = ref(false);
		const wrapStyle = computed(() => ({ maxHeight: addUnit(props.maxHeight) }));
		const dropdownTriggerKls = computed(() => [ns.m(dropdownSize.value)]);
		const trigger = computed(() => castArray(props.trigger));
		const defaultTriggerId = useId().value;
		const triggerId = computed(() => props.id || defaultTriggerId);
		function handleClick() {
			popperRef.value?.onClose(void 0, 0);
		}
		function handleClose() {
			popperRef.value?.onClose();
		}
		function handleOpen() {
			popperRef.value?.onOpen();
		}
		const dropdownSize = useFormSize();
		function commandHandler(...args) {
			emit("command", ...args);
		}
		function onItemEnter() {}
		function onItemLeave() {
			const contentEl = unref(contentRef);
			trigger.value.includes("hover") && contentEl?.focus({ preventScroll: true });
			currentTabId.value = null;
		}
		function handleCurrentTabIdChange(id) {
			currentTabId.value = id;
		}
		function handleBeforeShowTooltip() {
			emit("visible-change", true);
		}
		function handleShowTooltip(event) {
			isUsingKeyboard.value = event?.type === "keydown";
			contentRef.value?.focus();
		}
		function handleBeforeHideTooltip() {
			emit("visible-change", false);
		}
		provide(DROPDOWN_INJECTION_KEY, {
			contentRef,
			role: computed(() => props.role),
			triggerId,
			isUsingKeyboard,
			onItemEnter,
			onItemLeave,
			handleClose
		});
		provide(DROPDOWN_INSTANCE_INJECTION_KEY, {
			instance: _instance,
			dropdownSize,
			handleClick,
			commandHandler,
			trigger: toRef(props, "trigger"),
			hideOnClick: toRef(props, "hideOnClick")
		});
		const handlerMainButtonClick = (event) => {
			emit("click", event);
		};
		return {
			t,
			ns,
			scrollbar,
			wrapStyle,
			dropdownTriggerKls,
			dropdownSize,
			triggerId,
			currentTabId,
			handleCurrentTabIdChange,
			handlerMainButtonClick,
			handleClose,
			handleOpen,
			handleBeforeShowTooltip,
			handleShowTooltip,
			handleBeforeHideTooltip,
			popperRef,
			contentRef,
			triggeringElementRef,
			referenceElementRef
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/dropdown2.mjs
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_roving_focus_group = resolveComponent("el-roving-focus-group");
	const _component_el_scrollbar = resolveComponent("el-scrollbar");
	const _component_el_only_child = resolveComponent("el-only-child");
	const _component_el_tooltip = resolveComponent("el-tooltip");
	const _component_el_button = resolveComponent("el-button");
	const _component_arrow_down = resolveComponent("arrow-down");
	const _component_el_icon = resolveComponent("el-icon");
	const _component_el_button_group = resolveComponent("el-button-group");
	return openBlock(), createElementBlock("div", { class: normalizeClass([_ctx.ns.b(), _ctx.ns.is("disabled", _ctx.disabled)]) }, [createVNode(_component_el_tooltip, {
		ref: "popperRef",
		role: _ctx.role,
		effect: _ctx.effect,
		"fallback-placements": ["bottom", "top"],
		"popper-options": _ctx.popperOptions,
		"gpu-acceleration": false,
		placement: _ctx.placement,
		"popper-class": [_ctx.ns.e("popper"), _ctx.popperClass],
		"popper-style": _ctx.popperStyle,
		trigger: _ctx.trigger,
		"trigger-keys": _ctx.triggerKeys,
		"trigger-target-el": _ctx.contentRef,
		"show-arrow": _ctx.showArrow,
		"show-after": _ctx.trigger === "hover" ? _ctx.showTimeout : 0,
		"hide-after": _ctx.trigger === "hover" ? _ctx.hideTimeout : 0,
		"virtual-ref": _ctx.virtualRef ?? _ctx.triggeringElementRef,
		"virtual-triggering": _ctx.virtualTriggering || _ctx.splitButton,
		disabled: _ctx.disabled,
		transition: `${_ctx.ns.namespace.value}-zoom-in-top`,
		teleported: _ctx.teleported,
		"append-to": _ctx.appendTo,
		pure: "",
		"focus-on-target": "",
		persistent: _ctx.persistent,
		onBeforeShow: _ctx.handleBeforeShowTooltip,
		onShow: _ctx.handleShowTooltip,
		onBeforeHide: _ctx.handleBeforeHideTooltip
	}, createSlots({
		content: withCtx(() => [createVNode(_component_el_scrollbar, {
			ref: "scrollbar",
			"wrap-style": _ctx.wrapStyle,
			tag: "div",
			"view-class": _ctx.ns.e("list")
		}, {
			default: withCtx(() => [createVNode(_component_el_roving_focus_group, {
				loop: _ctx.loop,
				"current-tab-id": _ctx.currentTabId,
				orientation: "horizontal",
				onCurrentTabIdChange: _ctx.handleCurrentTabIdChange
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "dropdown")]),
				_: 3
			}, 8, [
				"loop",
				"current-tab-id",
				"onCurrentTabIdChange"
			])]),
			_: 3
		}, 8, ["wrap-style", "view-class"])]),
		_: 2
	}, [!_ctx.splitButton ? {
		name: "default",
		fn: withCtx(() => [createVNode(_component_el_only_child, {
			id: _ctx.triggerId,
			ref: "triggeringElementRef",
			role: "button",
			tabindex: _ctx.tabindex
		}, {
			default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
			_: 3
		}, 8, ["id", "tabindex"])]),
		key: "0"
	} : void 0]), 1032, [
		"role",
		"effect",
		"popper-options",
		"placement",
		"popper-class",
		"popper-style",
		"trigger",
		"trigger-keys",
		"trigger-target-el",
		"show-arrow",
		"show-after",
		"hide-after",
		"virtual-ref",
		"virtual-triggering",
		"disabled",
		"transition",
		"teleported",
		"append-to",
		"persistent",
		"onBeforeShow",
		"onShow",
		"onBeforeHide"
	]), _ctx.splitButton ? (openBlock(), createBlock(_component_el_button_group, { key: 0 }, {
		default: withCtx(() => [createVNode(_component_el_button, mergeProps({ ref: "referenceElementRef" }, _ctx.buttonProps, {
			size: _ctx.dropdownSize,
			type: _ctx.type,
			disabled: _ctx.disabled,
			tabindex: _ctx.tabindex,
			onClick: _ctx.handlerMainButtonClick
		}), {
			default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
			_: 3
		}, 16, [
			"size",
			"type",
			"disabled",
			"tabindex",
			"onClick"
		]), createVNode(_component_el_button, mergeProps({
			id: _ctx.triggerId,
			ref: "triggeringElementRef"
		}, _ctx.buttonProps, {
			role: "button",
			size: _ctx.dropdownSize,
			type: _ctx.type,
			class: _ctx.ns.e("caret-button"),
			disabled: _ctx.disabled,
			tabindex: _ctx.tabindex,
			"aria-label": _ctx.t("el.dropdown.toggleDropdown")
		}), {
			default: withCtx(() => [createVNode(_component_el_icon, { class: normalizeClass(_ctx.ns.e("icon")) }, {
				default: withCtx(() => [createVNode(_component_arrow_down)]),
				_: 1
			}, 8, ["class"])]),
			_: 1
		}, 16, [
			"id",
			"size",
			"type",
			"class",
			"disabled",
			"tabindex",
			"aria-label"
		])]),
		_: 3
	})) : createCommentVNode("v-if", true)], 2);
}
var dropdown_default = /* @__PURE__ */ _plugin_vue_export_helper_default(dropdown_vue_vue_type_script_lang_default, [["render", _sfc_render$3]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/dropdown-item-impl.vue_vue_type_script_lang.mjs
var dropdown_item_impl_vue_vue_type_script_lang_default = defineComponent({
	name: "DropdownItemImpl",
	components: { ElIcon },
	props: dropdownItemProps,
	emits: [
		"pointermove",
		"pointerleave",
		"click",
		"clickimpl"
	],
	setup(_, { emit }) {
		const ns = useNamespace("dropdown");
		const { role: menuRole } = inject(DROPDOWN_INJECTION_KEY, void 0);
		const { collectionItemRef: rovingFocusCollectionItemRef } = inject(COLLECTION_ITEM_INJECTION_KEY, void 0);
		const { rovingFocusGroupItemRef, tabIndex, handleFocus, handleKeydown: handleItemKeydown, handleMousedown } = inject(ROVING_FOCUS_GROUP_ITEM_INJECTION_KEY, void 0);
		const itemRef = composeRefs(rovingFocusCollectionItemRef, rovingFocusGroupItemRef);
		const role = computed(() => {
			if (menuRole.value === "menu") return "menuitem";
			else if (menuRole.value === "navigation") return "link";
			return "button";
		});
		const handleKeydown = composeEventHandlers((e) => {
			const code = getEventCode(e);
			if ([
				EVENT_CODE.enter,
				EVENT_CODE.numpadEnter,
				EVENT_CODE.space
			].includes(code)) {
				e.preventDefault();
				e.stopImmediatePropagation();
				emit("clickimpl", e);
				return true;
			}
		}, handleItemKeydown);
		return {
			ns,
			itemRef,
			dataset: { [COLLECTION_ITEM_SIGN]: "" },
			role,
			tabIndex,
			handleFocus,
			handleKeydown,
			handleMousedown
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/dropdown-item-impl.mjs
var _hoisted_1$1 = [
	"aria-disabled",
	"tabindex",
	"role"
];
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_icon = resolveComponent("el-icon");
	return openBlock(), createElementBlock(Fragment, null, [_ctx.divided ? (openBlock(), createElementBlock("li", {
		key: 0,
		role: "separator",
		class: normalizeClass(_ctx.ns.bem("menu", "item", "divided"))
	}, null, 2)) : createCommentVNode("v-if", true), createBaseVNode("li", mergeProps({ ref: _ctx.itemRef }, {
		..._ctx.dataset,
		..._ctx.$attrs
	}, {
		"aria-disabled": _ctx.disabled,
		class: [_ctx.ns.be("menu", "item"), _ctx.ns.is("disabled", _ctx.disabled)],
		tabindex: _ctx.tabIndex,
		role: _ctx.role,
		onClick: _cache[0] || (_cache[0] = (e) => _ctx.$emit("clickimpl", e)),
		onFocus: _cache[1] || (_cache[1] = (...args) => _ctx.handleFocus && _ctx.handleFocus(...args)),
		onKeydown: _cache[2] || (_cache[2] = withModifiers((...args) => _ctx.handleKeydown && _ctx.handleKeydown(...args), ["self"])),
		onMousedown: _cache[3] || (_cache[3] = (...args) => _ctx.handleMousedown && _ctx.handleMousedown(...args)),
		onPointermove: _cache[4] || (_cache[4] = (e) => _ctx.$emit("pointermove", e)),
		onPointerleave: _cache[5] || (_cache[5] = (e) => _ctx.$emit("pointerleave", e))
	}), [_ctx.icon || _ctx.$slots.icon ? (openBlock(), createBlock(_component_el_icon, { key: 0 }, {
		default: withCtx(() => [renderSlot(_ctx.$slots, "icon", {}, () => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.icon)))])]),
		_: 3
	})) : createCommentVNode("v-if", true), renderSlot(_ctx.$slots, "default")], 16, _hoisted_1$1)], 64);
}
var dropdown_item_impl_default = /* @__PURE__ */ _plugin_vue_export_helper_default(dropdown_item_impl_vue_vue_type_script_lang_default, [["render", _sfc_render$2]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/useDropdown.mjs
var useDropdown = () => {
	const elDropdown = inject(DROPDOWN_INSTANCE_INJECTION_KEY, {});
	return {
		elDropdown,
		_elDropdownSize: computed(() => elDropdown?.dropdownSize)
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/dropdown-item.vue_vue_type_script_lang.mjs
var dropdown_item_vue_vue_type_script_lang_default = defineComponent({
	name: "ElDropdownItem",
	components: {
		ElRovingFocusItem: roving_focus_item_default,
		ElDropdownItemImpl: dropdown_item_impl_default
	},
	inheritAttrs: false,
	props: dropdownItemProps,
	emits: [
		"pointermove",
		"pointerleave",
		"click"
	],
	setup(props, { emit, attrs }) {
		const { elDropdown } = useDropdown();
		const _instance = getCurrentInstance();
		const { onItemEnter, onItemLeave } = inject(DROPDOWN_INJECTION_KEY, void 0);
		const handlePointerMove = composeEventHandlers((e) => {
			emit("pointermove", e);
			return e.defaultPrevented;
		}, whenMouse((e) => {
			if (props.disabled) {
				onItemLeave(e);
				return;
			}
			const target = e.currentTarget;
			/**
			* This handles the following scenario:
			*   when the item contains a form element such as input element
			*   when the mouse is moving over the element itself which is contained by
			*   the item, the default focusing logic should be prevented so that
			*   it won't cause weird action.
			*/
			if (target === document.activeElement || target.contains(document.activeElement)) return;
			onItemEnter(e);
			if (!e.defaultPrevented) target?.focus({ preventScroll: true });
		}));
		const handlePointerLeave = composeEventHandlers((e) => {
			emit("pointerleave", e);
			return e.defaultPrevented;
		}, whenMouse(onItemLeave));
		return {
			handleClick: composeEventHandlers((e) => {
				if (props.disabled) return;
				emit("click", e);
				return e.type !== "keydown" && e.defaultPrevented;
			}, (e) => {
				if (props.disabled) {
					e.stopImmediatePropagation();
					return;
				}
				if (elDropdown?.hideOnClick?.value) elDropdown.handleClick?.();
				elDropdown.commandHandler?.(props.command, _instance, e);
			}),
			handlePointerMove,
			handlePointerLeave,
			propsAndAttrs: computed(() => ({
				...props,
				...attrs
			}))
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/dropdown-item.mjs
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_dropdown_item_impl = resolveComponent("el-dropdown-item-impl");
	const _component_el_roving_focus_item = resolveComponent("el-roving-focus-item");
	return openBlock(), createBlock(_component_el_roving_focus_item, { focusable: !_ctx.disabled }, {
		default: withCtx(() => [createVNode(_component_el_dropdown_item_impl, mergeProps(_ctx.propsAndAttrs, {
			onPointerleave: _ctx.handlePointerLeave,
			onPointermove: _ctx.handlePointerMove,
			onClickimpl: _ctx.handleClick
		}), createSlots({
			default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
			_: 2
		}, [_ctx.$slots.icon ? {
			name: "icon",
			fn: withCtx(() => [renderSlot(_ctx.$slots, "icon")]),
			key: "0"
		} : void 0]), 1040, [
			"onPointerleave",
			"onPointermove",
			"onClickimpl"
		])]),
		_: 3
	}, 8, ["focusable"]);
}
var dropdown_item_default = /* @__PURE__ */ _plugin_vue_export_helper_default(dropdown_item_vue_vue_type_script_lang_default, [["render", _sfc_render$1]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/dropdown-menu.vue_vue_type_script_lang.mjs
var dropdown_menu_vue_vue_type_script_lang_default = defineComponent({
	name: "ElDropdownMenu",
	props: dropdownMenuProps,
	setup(props) {
		const ns = useNamespace("dropdown");
		const { _elDropdownSize } = useDropdown();
		const size = _elDropdownSize.value;
		const { contentRef, role, triggerId, isUsingKeyboard, handleClose } = inject(DROPDOWN_INJECTION_KEY, void 0);
		const { rovingFocusGroupRef, rovingFocusGroupRootStyle, onBlur, onFocus, onKeydown, onMousedown } = inject(ROVING_FOCUS_GROUP_INJECTION_KEY, void 0);
		const { collectionRef: rovingFocusGroupCollectionRef } = inject(COLLECTION_INJECTION_KEY, void 0);
		const dropdownKls = computed(() => {
			return [ns.b("menu"), ns.bm("menu", size?.value)];
		});
		const dropdownListWrapperRef = composeRefs(contentRef, rovingFocusGroupRef, rovingFocusGroupCollectionRef);
		const handleKeydown = composeEventHandlers((e) => {
			props.onKeydown?.(e);
		}, (e) => {
			const { currentTarget, target } = e;
			const code = getEventCode(e);
			if (currentTarget.contains(target)) {}
			if (EVENT_CODE.tab === code) return handleClose();
			onKeydown(e);
		});
		function handleFocus(e) {
			isUsingKeyboard.value && onFocus(e);
		}
		return {
			size,
			rovingFocusGroupRootStyle,
			dropdownKls,
			role,
			triggerId,
			dropdownListWrapperRef,
			handleKeydown,
			onBlur,
			handleFocus,
			onMousedown
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/src/dropdown-menu.mjs
var _hoisted_1 = ["role", "aria-labelledby"];
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("ul", {
		ref: _ctx.dropdownListWrapperRef,
		class: normalizeClass(_ctx.dropdownKls),
		style: normalizeStyle(_ctx.rovingFocusGroupRootStyle),
		tabindex: -1,
		role: _ctx.role,
		"aria-labelledby": _ctx.triggerId,
		onFocusin: _cache[0] || (_cache[0] = (...args) => _ctx.handleFocus && _ctx.handleFocus(...args)),
		onFocusout: _cache[1] || (_cache[1] = (...args) => _ctx.onBlur && _ctx.onBlur(...args)),
		onKeydown: _cache[2] || (_cache[2] = withModifiers((...args) => _ctx.handleKeydown && _ctx.handleKeydown(...args), ["self"])),
		onMousedown: _cache[3] || (_cache[3] = withModifiers((...args) => _ctx.onMousedown && _ctx.onMousedown(...args), ["self"]))
	}, [renderSlot(_ctx.$slots, "default")], 46, _hoisted_1);
}
var dropdown_menu_default = /* @__PURE__ */ _plugin_vue_export_helper_default(dropdown_menu_vue_vue_type_script_lang_default, [["render", _sfc_render]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/dropdown/index.mjs
var ElDropdown = withInstall(dropdown_default, {
	DropdownItem: dropdown_item_default,
	DropdownMenu: dropdown_menu_default
});
var ElDropdownItem = withNoopInstall(dropdown_item_default);
var ElDropdownMenu = withNoopInstall(dropdown_menu_default);
//#endregion
export { ElDropdownItem as n, ElDropdownMenu as r, ElDropdown as t };
