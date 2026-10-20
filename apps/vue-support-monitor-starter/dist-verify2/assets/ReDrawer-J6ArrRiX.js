import { $ as mergeModels, $n as normalizeClass, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, On as unref, St as resolveComponent, Tn as toRefs, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, ct as onMounted, ft as onUnmounted, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, pn as onScopeDispose, qt as withCtx, rr as toDisplayString, u as Teleport, v as createBlock, vn as ref, w as createSlots, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { $ as full_screen_default, _t as minus_default, q as files_default, t as aim_default, w as close_default } from "./dist-DogtK295.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ElDrawer } from "./drawer-CBwadwVQ.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReDrawer/theme/koi/useKoiWindowShell.ts
var dockSeq = 0;
var dockOrder = ref([]);
function pushDock(id) {
	if (!dockOrder.value.includes(id)) dockOrder.value = [...dockOrder.value, id];
}
function removeDock(id) {
	dockOrder.value = dockOrder.value.filter((x) => x !== id);
}
/**
* 弹窗 / 抽屉：收起至左下角浮标、全屏切换；多实例收起时在左侧自下而上排列。
* （从 @repo/theme/koi 移植为 ui 包自包含实现）
*/
function useKoiWindowShell(visible, getInitialFullscreen) {
	const minimized = ref(false);
	const fullscreen = ref(getInitialFullscreen?.() ?? false);
	const dockId = ++dockSeq;
	watch(minimized, (v) => {
		if (v) pushDock(dockId);
		else removeDock(dockId);
	}, { immediate: true });
	onScopeDispose(() => removeDock(dockId));
	const dockStackIndex = computed(() => dockOrder.value.indexOf(dockId));
	watch(visible, (v) => {
		if (v) {
			minimized.value = false;
			if (getInitialFullscreen) fullscreen.value = getInitialFullscreen();
		}
	});
	function minimize() {
		minimized.value = true;
		visible.value = false;
	}
	function restoreFromDock() {
		minimized.value = false;
		visible.value = true;
	}
	function toggleFullscreen() {
		fullscreen.value = !fullscreen.value;
		queueMicrotask(() => {
			window.dispatchEvent(new Event("resize"));
		});
	}
	function clearMinimized() {
		minimized.value = false;
	}
	return {
		minimized,
		fullscreen,
		minimize,
		restoreFromDock,
		toggleFullscreen,
		clearMinimized,
		dockStackIndex
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReDrawer/theme/koi/KoiShellHeaderActions.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "koi-shell-header-actions" };
//#endregion
//#region ../../packages/ui/src/components/ReDrawer/theme/koi/KoiShellHeaderActions.vue
var KoiShellHeaderActions_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "KoiShellHeaderActions",
	props: {
		isFullscreen: { type: Boolean },
		enabled: {
			type: Boolean,
			default: true
		},
		closeOnly: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		"minimize",
		"toggleFullscreen",
		"close"
	],
	setup(__props) {
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_tooltip = resolveComponent("el-tooltip");
			return openBlock(), createElementBlock("div", _hoisted_1$2, [!__props.closeOnly ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(_component_el_tooltip, {
				content: "最小化",
				placement: "bottom"
			}, {
				default: withCtx(() => [createBaseVNode("button", {
					type: "button",
					class: "koi-toolbar-btn",
					onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("minimize"))
				}, [createVNode(_component_el_icon, { size: "18" }, {
					default: withCtx(() => [createVNode(unref(minus_default))]),
					_: 1
				})])]),
				_: 1
			}), createVNode(_component_el_tooltip, {
				content: __props.isFullscreen ? "退出全屏" : "全屏",
				placement: "bottom"
			}, {
				default: withCtx(() => [createBaseVNode("button", {
					type: "button",
					class: "koi-toolbar-btn",
					onClick: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("toggleFullscreen"))
				}, [!__props.isFullscreen ? (openBlock(), createBlock(_component_el_icon, {
					key: 0,
					size: "18"
				}, {
					default: withCtx(() => [createVNode(unref(full_screen_default))]),
					_: 1
				})) : (openBlock(), createBlock(_component_el_icon, {
					key: 1,
					size: "18"
				}, {
					default: withCtx(() => [createVNode(unref(aim_default))]),
					_: 1
				}))])]),
				_: 1
			}, 8, ["content"])], 64)) : createCommentVNode("", true), createVNode(_component_el_tooltip, {
				content: "关闭",
				placement: "bottom"
			}, {
				default: withCtx(() => [createBaseVNode("button", {
					type: "button",
					class: "koi-toolbar-btn koi-toolbar-btn--close",
					onClick: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("close"))
				}, [createVNode(_component_el_icon, { size: "18" }, {
					default: withCtx(() => [createVNode(unref(close_default))]),
					_: 1
				})])]),
				_: 1
			})]);
		};
	}
}), [["__scopeId", "data-v-acfa8b91"]]);
//#endregion
//#region ../../packages/ui/src/components/ReDrawer/theme/koi/KoiShellMinimizedDock.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = ["title", "aria-label"];
var _hoisted_2$1 = { class: "koi-shell-minimized-dock__title" };
//#endregion
//#region ../../packages/ui/src/components/ReDrawer/theme/koi/KoiShellMinimizedDock.vue
var KoiShellMinimizedDock_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "KoiShellMinimizedDock",
	props: {
		visible: { type: Boolean },
		title: {},
		tooltip: {},
		stackIndex: {}
	},
	emits: ["restore"],
	setup(__props) {
		const props = __props;
		const dockStyle = computed(() => {
			const i = Math.max(0, props.stackIndex);
			return {
				bottom: `${16 + i * 40}px`,
				zIndex: 3e3 + i
			};
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createBlock(Teleport, { to: "body" }, [withDirectives(createBaseVNode("button", {
				type: "button",
				class: "koi-shell-minimized-dock",
				title: __props.title || __props.tooltip,
				"aria-label": __props.tooltip,
				style: normalizeStyle(dockStyle.value),
				onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("restore"))
			}, [createVNode(_component_el_icon, { class: "koi-shell-minimized-dock__icon" }, {
				default: withCtx(() => [createVNode(unref(files_default))]),
				_: 1
			}), createBaseVNode("span", _hoisted_2$1, toDisplayString(__props.title), 1)], 12, _hoisted_1$1), [[vShow, __props.visible]])]);
		};
	}
}), [["__scopeId", "data-v-1aba935e"]]);
//#endregion
//#region ../../packages/ui/src/components/ReDrawer/theme/koi/ReDrawer.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "koi-drawer-custom-header" };
var _hoisted_2 = { class: "koi-drawer-header-left" };
var _hoisted_3 = {
	key: 0,
	class: "koi-drawer-header-icon-wrap"
};
var _hoisted_4 = ["id"];
var _hoisted_5 = { class: "koi-drawer-body" };
var _hoisted_6 = { class: "body" };
var _hoisted_7 = {
	key: 0,
	class: "footer"
};
var _hoisted_8 = {
	key: 0,
	class: "koi-drawer-footer"
};
//#endregion
//#region ../../packages/ui/src/components/ReDrawer/theme/koi/ReDrawer.vue
var ReDrawer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReDrawer",
	inheritAttrs: false,
	__name: "ReDrawer",
	props: /*@__PURE__*/ mergeModels({
		title: { default: "ReDrawer" },
		icon: { default: aim_default },
		size: { default: "450" },
		destroyOnClose: {
			type: Boolean,
			default: false
		},
		closeOnClickModal: {
			type: Boolean,
			default: false
		},
		confirmText: { default: "" },
		cancelText: { default: "" },
		direction: { default: "rtl" },
		loading: {
			type: Boolean,
			default: false
		},
		footerHidden: {
			type: Boolean,
			default: false
		},
		showWindowShell: {
			type: Boolean,
			default: true
		},
		lockScroll: {
			type: Boolean,
			default: true
		},
		modalClass: { default: "" },
		drawerClass: { default: "" },
		closeConfirm: {
			type: Boolean,
			default: false
		},
		closeOnly: {
			type: Boolean,
			default: false
		}
	}, {
		"modelValue": {
			type: Boolean,
			default: false
		},
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels(["confirm", "cancel"], ["update:modelValue"]),
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReDrawer koi 主题 —— 抽屉组件（KoiDrawer 移植）
		*
		* 提供窗口壳能力：最小化浮标、全屏切换、关闭二次确认。
		* 使用方式与 default 主题对齐（v-model 控制显隐）。
		*/
		const props = __props;
		const visible = useModel(__props, "modelValue");
		const { loading } = toRefs(props);
		const confirmLoading = ref(loading);
		const { minimized, fullscreen: windowFullscreen, minimize, restoreFromDock, toggleFullscreen, clearMinimized, dockStackIndex } = useKoiWindowShell(visible);
		const windowWidth = ref(window.innerWidth);
		const handleResize = () => {
			windowWidth.value = window.innerWidth;
		};
		const baseDrawerSize = computed(() => {
			const sizeValue = parseFloat(String(props.size));
			if (props.direction === "ltr" || props.direction === "rtl") {
				if (windowWidth.value < 600) return "86%";
				if (sizeValue > windowWidth.value) return "86%";
				if (sizeValue > windowWidth.value * .9) return "90%";
			} else if (windowWidth.value < 600) return "60%";
			return props.size;
		});
		const mergedDrawerSize = computed(() => windowFullscreen.value ? "100%" : baseDrawerSize.value);
		onMounted(() => window.addEventListener("resize", handleResize));
		onUnmounted(() => window.removeEventListener("resize", handleResize));
		const emit = __emit;
		function koiClose() {
			if (props.closeConfirm && !props.closeOnClickModal) ElMessageBox.confirm("关闭后所有未保存内容将丢失，确认关闭？", "温馨提示", {
				confirmButtonText: "确定",
				cancelButtonText: "取消",
				type: "warning"
			}).then(() => {
				visible.value = false;
				clearMinimized();
				message.warning("已关闭");
			}).catch(() => {
				message.warning("已取消");
			});
			else {
				visible.value = false;
				clearMinimized();
			}
		}
		function koiConfirm() {
			emit("confirm");
		}
		function koiCancel() {
			emit("cancel");
			visible.value = false;
			clearMinimized();
		}
		function koiOpen() {
			visible.value = true;
		}
		function koiQuickClose() {
			clearMinimized();
			visible.value = false;
		}
		__expose({
			koiOpen,
			koiClose,
			koiQuickClose
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock(Fragment, null, [createVNode(unref(ElDrawer), {
				class: normalizeClass(["koi-drawer-shell", __props.drawerClass]),
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => visible.value = $event),
				title: __props.title,
				size: mergedDrawerSize.value,
				direction: __props.direction,
				"close-on-click-modal": __props.closeOnClickModal,
				"destroy-on-close": __props.destroyOnClose,
				"before-close": koiClose,
				loading: unref(loading),
				"show-close": !__props.showWindowShell,
				"lock-scroll": __props.lockScroll,
				"modal-class": __props.modalClass
			}, createSlots({
				default: withCtx(() => [createBaseVNode("div", _hoisted_5, [createBaseVNode("div", _hoisted_6, [renderSlot(_ctx.$slots, "content", {}, () => [renderSlot(_ctx.$slots, "default", {}, void 0, true)], true)]), !__props.footerHidden ? (openBlock(), createElementBlock("div", _hoisted_7, [_ctx.$slots.footer ? (openBlock(), createElementBlock("div", _hoisted_8, [renderSlot(_ctx.$slots, "footer", {
					confirm: koiConfirm,
					cancel: koiCancel,
					loading: confirmLoading.value
				}, void 0, true)])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createVNode(unref(ElButton), {
					class: "koi-btn-borderless",
					type: "primary",
					loading: confirmLoading.value,
					onClick: koiConfirm
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.confirmText || "确定"), 1)]),
					_: 1
				}, 8, ["loading"]), createVNode(unref(ElButton), {
					class: "koi-btn-borderless",
					type: "danger",
					onClick: koiCancel
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.cancelText || "取消"), 1)]),
					_: 1
				})], 64))])) : createCommentVNode("", true)])]),
				_: 2
			}, [__props.showWindowShell ? {
				name: "header",
				fn: withCtx(({ titleId, titleClass }) => [createBaseVNode("div", _hoisted_1, [createBaseVNode("span", _hoisted_2, [__props.icon ? (openBlock(), createElementBlock("span", _hoisted_3, [createVNode(_component_el_icon, { class: "koi-drawer-header-icon" }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
					_: 1
				})])) : createCommentVNode("", true), createBaseVNode("span", {
					id: titleId,
					class: normalizeClass(titleClass)
				}, toDisplayString(__props.title), 11, _hoisted_4)]), createVNode(KoiShellHeaderActions_default, {
					"is-fullscreen": unref(windowFullscreen),
					enabled: visible.value,
					"close-only": __props.closeOnly,
					onMinimize: unref(minimize),
					onToggleFullscreen: unref(toggleFullscreen),
					onClose: koiClose
				}, null, 8, [
					"is-fullscreen",
					"enabled",
					"close-only",
					"onMinimize",
					"onToggleFullscreen"
				])])]),
				key: "0"
			} : void 0]), 1032, [
				"class",
				"modelValue",
				"title",
				"size",
				"direction",
				"close-on-click-modal",
				"destroy-on-close",
				"loading",
				"show-close",
				"lock-scroll",
				"modal-class"
			]), createVNode(KoiShellMinimizedDock_default, {
				visible: unref(minimized),
				title: __props.title,
				tooltip: "恢复窗口",
				"stack-index": unref(dockStackIndex),
				onRestore: unref(restoreFromDock)
			}, null, 8, [
				"visible",
				"title",
				"stack-index",
				"onRestore"
			])], 64);
		};
	}
}), [["__scopeId", "data-v-54ba82e3"]]);
//#endregion
export { ReDrawer_default as default };
