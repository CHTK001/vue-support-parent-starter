import { $ as mergeModels, $n as normalizeClass, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, On as unref, St as resolveComponent, Tn as toRefs, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, ct as onMounted, et as mergeProps, ft as onUnmounted, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, pn as onScopeDispose, qt as withCtx, rr as toDisplayString, tr as normalizeProps, u as Teleport, v as createBlock, vn as ref, w as createSlots, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode, z as guardReactiveProps } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { $ as full_screen_default, _t as minus_default, q as files_default, t as aim_default, w as close_default } from "./dist-DogtK295.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElDialog } from "./dialog-C6HCRlOo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as CloseFab_default } from "./CloseFab-BDUUpPI2.js";
//#region ../../packages/ui/src/components/ReDialog/theme/koi/useKoiWindowShell.ts
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
//#region ../../packages/ui/src/components/ReDialog/theme/koi/KoiShellHeaderActions.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$2 = { class: "koi-shell-header-actions" };
var _hoisted_2$2 = ["aria-label"];
//#endregion
//#region ../../packages/ui/src/components/ReDialog/theme/koi/KoiShellHeaderActions.vue
var KoiShellHeaderActions_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "KoiShellHeaderActions",
	props: {
		isFullscreen: { type: Boolean },
		enabled: {
			type: Boolean,
			default: true
		},
		showMinimize: {
			type: Boolean,
			default: false
		},
		showFullscreen: {
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
			return openBlock(), createElementBlock("div", _hoisted_1$2, [
				__props.showMinimize ? (openBlock(), createBlock(_component_el_tooltip, {
					key: 0,
					content: "最小化",
					placement: "bottom"
				}, {
					default: withCtx(() => [createBaseVNode("button", {
						type: "button",
						class: "koi-toolbar-btn",
						"aria-label": "最小化",
						onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("minimize"))
					}, [createVNode(_component_el_icon, { size: "14" }, {
						default: withCtx(() => [createVNode(unref(minus_default))]),
						_: 1
					})])]),
					_: 1
				})) : createCommentVNode("", true),
				__props.showFullscreen ? (openBlock(), createBlock(_component_el_tooltip, {
					key: 1,
					content: __props.isFullscreen ? "退出全屏" : "全屏",
					placement: "bottom"
				}, {
					default: withCtx(() => [createBaseVNode("button", {
						type: "button",
						class: "koi-toolbar-btn",
						"aria-label": __props.isFullscreen ? "退出全屏" : "全屏",
						onClick: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("toggleFullscreen"))
					}, [!__props.isFullscreen ? (openBlock(), createBlock(_component_el_icon, {
						key: 0,
						size: "14"
					}, {
						default: withCtx(() => [createVNode(unref(full_screen_default))]),
						_: 1
					})) : (openBlock(), createBlock(_component_el_icon, {
						key: 1,
						size: "14"
					}, {
						default: withCtx(() => [createVNode(unref(aim_default))]),
						_: 1
					}))], 8, _hoisted_2$2)]),
					_: 1
				}, 8, ["content"])) : createCommentVNode("", true),
				createVNode(_component_el_tooltip, {
					content: "关闭",
					placement: "bottom"
				}, {
					default: withCtx(() => [createBaseVNode("button", {
						type: "button",
						class: "koi-toolbar-btn koi-toolbar-btn--close",
						"aria-label": "关闭",
						onClick: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("close"))
					}, [createVNode(_component_el_icon, { size: "14" }, {
						default: withCtx(() => [createVNode(unref(close_default))]),
						_: 1
					})])]),
					_: 1
				})
			]);
		};
	}
}), [["__scopeId", "data-v-e705f507"]]);
//#endregion
//#region ../../packages/ui/src/components/ReDialog/theme/koi/KoiShellMinimizedDock.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = ["title", "aria-label"];
var _hoisted_2$1 = { class: "koi-shell-minimized-dock__title" };
//#endregion
//#region ../../packages/ui/src/components/ReDialog/theme/koi/KoiShellMinimizedDock.vue
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
}), [["__scopeId", "data-v-288df021"]]);
//#endregion
//#region ../../packages/ui/src/components/ReDialog/theme/koi/ReDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "koi-dialog-header-left" };
var _hoisted_2 = {
	key: 0,
	class: "koi-dialog-header-icon-wrap"
};
var _hoisted_3 = {
	key: 1,
	class: "koi-dialog-header-titles"
};
var _hoisted_4 = { class: "el-dialog__title" };
var _hoisted_5 = { class: "koi-dialog-subtitle" };
var _hoisted_6 = {
	key: 2,
	class: "el-dialog__title"
};
var _hoisted_7 = {
	key: 1,
	class: "koi-dialog-header-drag"
};
var _hoisted_8 = {
	key: 0,
	class: "dialog-footer"
};
//#endregion
//#region ../../packages/ui/src/components/ReDialog/theme/koi/ReDialog.vue
var ReDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReDialog",
	inheritAttrs: false,
	__name: "ReDialog",
	props: /*@__PURE__*/ mergeModels({
		title: { default: "ReDialog" },
		subtitle: { default: "" },
		icon: { default: aim_default },
		width: { default: 650 },
		top: { default: "" },
		center: {
			type: Boolean,
			default: true
		},
		alignCenter: {
			type: Boolean,
			default: true
		},
		height: { default: 0 },
		closeOnClickModal: {
			type: Boolean,
			default: false
		},
		closeOnPressEscape: {
			type: Boolean,
			default: true
		},
		confirmText: { default: "" },
		cancelText: { default: "" },
		destroyOnClose: {
			type: Boolean,
			default: false
		},
		fullscreen: {
			type: Boolean,
			default: false
		},
		loading: {
			type: Boolean,
			default: false
		},
		footerHidden: {
			type: Boolean,
			default: void 0
		},
		showWindowShell: {
			type: Boolean,
			default: true
		},
		showMinimize: {
			type: Boolean,
			default: false
		},
		showFullscreen: {
			type: Boolean,
			default: false
		},
		headless: {
			type: Boolean,
			default: false
		},
		compact: {
			type: Boolean,
			default: false
		},
		zIndex: { default: void 0 }
	}, {
		"modelValue": {
			type: Boolean,
			default: false
		},
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels([
		"confirm",
		"ok",
		"cancel"
	], ["update:modelValue"]),
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReDialog koi 主题 —— 弹窗组件（KoiDialog 移植）
		*
		* 提供窗口壳能力：最小化浮标、全屏切换、关闭二次确认。
		* 使用方式与 default 主题对齐（v-model 控制显隐），
		* 额外支持 koi 专属能力：showWindowShell / fullscreen / footerHidden。
		*/
		const props = __props;
		/** v-model 控制显隐（与 default 主题 API 对齐） */
		const visible = useModel(__props, "modelValue");
		/**
		* 本地可见性镜像：关闭时本地立即生效，不依赖父组件是否响应 update:modelValue
		* （防止 v-model 绑定只读 props 等错误用法——父不响应时弹窗也能关闭；父重新打开时再同步）
		*/
		const localOpen = ref(false);
		watch(visible, (v) => {
			localOpen.value = v;
		}, { immediate: true });
		const { loading, width } = toRefs(props);
		const confirmLoading = ref(loading);
		const { minimized, fullscreen: windowFullscreen, minimize, restoreFromDock, toggleFullscreen, clearMinimized, dockStackIndex } = useKoiWindowShell(visible, () => props.fullscreen);
		/**
		* localOpen 与 visible 双向闭环：
		* el-dialog 内部关闭（ESC / 遮罩 / v-model）只更新 localOpen，
		* 这里把状态回传父级 v-model，并在关闭时清理最小化停靠。
		*/
		watch(localOpen, (v) => {
			visible.value = v;
			if (!v) clearMinimized();
		});
		const dialogFullscreen = computed(() => windowFullscreen.value);
		const windowWidth = ref(window.innerWidth);
		const dialogWidth = computed(() => {
			if (dialogFullscreen.value) return "100%";
			if (windowWidth.value < 600) return "90%";
			const numericWidth = typeof width.value === "number" ? width.value : Number.parseFloat(String(width.value)) || windowWidth.value;
			if (numericWidth > windowWidth.value) return "90%";
			if (numericWidth > windowWidth.value * .95) return "95%";
			return width.value;
		});
		function handleResize() {
			windowWidth.value = window.innerWidth;
		}
		onMounted(() => window.addEventListener("resize", handleResize));
		onUnmounted(() => window.removeEventListener("resize", handleResize));
		const emit = __emit;
		function koiClose() {
			localOpen.value = false;
			visible.value = false;
			clearMinimized();
		}
		function koiConfirm() {
			emit("ok");
			emit("confirm");
		}
		function koiCancel() {
			emit("cancel");
			localOpen.value = false;
			visible.value = false;
			clearMinimized();
		}
		/** 编程式打开 */
		function koiOpen() {
			visible.value = true;
		}
		/** 编程式快速关闭（跳过二次确认） */
		function koiQuickClose() {
			clearMinimized();
			localOpen.value = false;
			visible.value = false;
		}
		__expose({
			koiOpen,
			koiClose,
			koiQuickClose
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock(Fragment, null, [createVNode(unref(ElDialog), mergeProps(_ctx.$attrs, {
				class: ["koi-dialog-shell", {
					"is-headless": __props.headless,
					"koi-dialog-compact": __props.compact
				}],
				modelValue: localOpen.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => localOpen.value = $event),
				title: __props.title,
				width: dialogWidth.value,
				top: __props.top,
				center: __props.center,
				"align-center": __props.alignCenter,
				"close-on-click-modal": __props.closeOnClickModal,
				"close-on-press-escape": __props.closeOnPressEscape,
				"append-to-body": "",
				"modal-class": "koi-dialog-modal",
				draggable: "",
				"destroy-on-close": __props.destroyOnClose,
				fullscreen: dialogFullscreen.value,
				"z-index": props.zIndex,
				loading: unref(loading),
				"show-close": !__props.showWindowShell
			}), createSlots({
				default: withCtx(() => [
					!__props.headless ? renderSlot(_ctx.$slots, "header", {}, void 0, true, 0) : createCommentVNode("", true),
					__props.headless ? (openBlock(), createBlock(CloseFab_default, {
						key: 1,
						size: 28,
						onClick: koiClose
					})) : createCommentVNode("", true),
					createBaseVNode("div", {
						class: "dialog-content-wrapper",
						style: normalizeStyle(dialogFullscreen.value || !__props.height ? { height: "auto" } : { maxHeight: __props.height + "px" })
					}, [renderSlot(_ctx.$slots, "content", {}, () => [renderSlot(_ctx.$slots, "default", {}, void 0, true)], true)], 4)
				]),
				_: 2
			}, [__props.showWindowShell ? {
				name: "header",
				fn: withCtx(() => [createBaseVNode("div", { class: normalizeClass(["koi-dialog-custom-header", { "is-empty": __props.headless }]) }, [!__props.headless ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("span", _hoisted_1, [__props.icon ? (openBlock(), createElementBlock("span", _hoisted_2, [createVNode(_component_el_icon, { class: "koi-dialog-header-icon" }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
					_: 1
				})])) : createCommentVNode("", true), __props.subtitle ? (openBlock(), createElementBlock("span", _hoisted_3, [createBaseVNode("span", _hoisted_4, toDisplayString(__props.title), 1), createBaseVNode("small", _hoisted_5, toDisplayString(__props.subtitle), 1)])) : (openBlock(), createElementBlock("span", _hoisted_6, toDisplayString(__props.title), 1))]), createVNode(KoiShellHeaderActions_default, {
					"is-fullscreen": dialogFullscreen.value,
					enabled: visible.value,
					"show-minimize": __props.showMinimize,
					"show-fullscreen": __props.showFullscreen,
					onMinimize: unref(minimize),
					onToggleFullscreen: unref(toggleFullscreen),
					onClose: koiClose
				}, null, 8, [
					"is-fullscreen",
					"enabled",
					"show-minimize",
					"show-fullscreen",
					"onMinimize",
					"onToggleFullscreen"
				])], 64)) : (openBlock(), createElementBlock("span", _hoisted_7))], 2)]),
				key: "0"
			} : void 0, __props.footerHidden === false || __props.footerHidden !== true && !!_ctx.$slots.footer ? {
				name: "footer",
				fn: withCtx(() => [renderSlot(_ctx.$slots, "footer", normalizeProps(guardReactiveProps({
					confirm: koiConfirm,
					cancel: koiCancel,
					loading: confirmLoading.value
				})), () => [__props.footerHidden === false ? (openBlock(), createElementBlock("span", _hoisted_8, [createVNode(unref(ElButton), {
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
				})])) : createCommentVNode("", true)], true)]),
				key: "1"
			} : void 0]), 1040, [
				"class",
				"modelValue",
				"title",
				"width",
				"top",
				"center",
				"align-center",
				"close-on-click-modal",
				"close-on-press-escape",
				"destroy-on-close",
				"fullscreen",
				"z-index",
				"loading",
				"show-close"
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
}), [["__scopeId", "data-v-831c9391"]]);
//#endregion
export { ReDialog_default as default };
