const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Modern-DYom0mkq.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/Modern-A-1c0K9V.css","assets/modern-vars-DGJCsX_d.css"])))=>i.map(i=>d[i]);
import { $ as mergeModels, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, O as defineAsyncComponent, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tr as normalizeProps, v as createBlock, vn as ref, w as createSlots, xt as renderSlot, y as createCommentVNode, z as guardReactiveProps } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { p as useMediaQuery } from "./dist-Clzx2YUA.js";
import { $ as full_screen_default, A as crop_default } from "./dist-DogtK295.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElDialog } from "./dialog-C6HCRlOo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
import { t as CloseFab_default } from "./CloseFab-BDUUpPI2.js";
//#region ../../packages/ui/src/components/ReDialog/composables/useResponsiveDialog.ts
/**
* useResponsiveDialog —— 弹窗响应式尺寸 composable
*
* 基于 @vueuse/core 的 mediaQuery 实现：
*   - 监听预设/自定义断点
*   - 根据当前断点返回最终 width / top / fullscreen
*   - 支持手机端自动全屏
*
* 用法：
*   const { width, top, isFullscreen, breakpoint } = useResponsiveDialog(props, {
*     mobileBreakpoint: 768,
*     desktopWidth: '640px',
*     mobileFullscreen: true,
*   });
*/
var DEFAULT_BREAKPOINTS = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280
};
/**
* 把 width 值在不同断点下统一映射为字符串
* - 数字: 返回 `${n}px`
* - 字符串: 原样返回
* - undefined: 返回 undefined
*/
function normalizeWidth(w) {
	if (w === void 0 || w === null) return void 0;
	return typeof w === "number" ? `${w}px` : w;
}
function useResponsiveDialog(props, options = {}) {
	const bp = {
		...DEFAULT_BREAKPOINTS,
		...options.breakpoints ?? {}
	};
	options.mobileBreakpoint ?? bp.md;
	const mobileFullscreen = options.mobileFullscreen ?? true;
	const isXs = useMediaQuery(`(max-width: ${bp.sm - 1}px)`);
	const isSm = useMediaQuery(`(min-width: ${bp.sm}px) and (max-width: ${bp.md - 1}px)`);
	const isMd = useMediaQuery(`(min-width: ${bp.md}px) and (max-width: ${bp.lg - 1}px)`);
	const isLg = useMediaQuery(`(min-width: ${bp.lg}px) and (max-width: ${bp.xl - 1}px)`);
	const breakpoint = computed(() => {
		if (isXs.value) return "xs";
		if (isSm.value) return "sm";
		if (isMd.value) return "md";
		if (isLg.value) return "lg";
		return "xl";
	});
	const isMobile = computed(() => breakpoint.value === "xs" || breakpoint.value === "sm");
	const resolved = computed(() => {
		if (props.fullscreen) return {
			width: "100vw",
			top: "0",
			height: "100vh",
			fullscreen: true,
			breakpoint: breakpoint.value
		};
		if (mobileFullscreen && isMobile.value) return {
			width: "100vw",
			top: "0",
			height: "100vh",
			fullscreen: true,
			breakpoint: breakpoint.value
		};
		return {
			width: normalizeWidth(props.width) ?? "50%",
			top: props.top ?? "15vh",
			fullscreen: false,
			breakpoint: breakpoint.value
		};
	});
	/** 喂给 el-dialog 的样式（含 maxWidth 限制） */
	const elStyle = computed(() => {
		if (resolved.value.fullscreen) return {
			margin: "0",
			width: "100vw",
			height: "100vh",
			maxWidth: "100vw",
			maxHeight: "100vh",
			borderRadius: "0"
		};
		return {
			marginTop: resolved.value.top,
			marginLeft: "auto",
			marginRight: "auto",
			width: resolved.value.width,
			maxWidth: options.maxWidth ? `${options.maxWidth}px` : void 0
		};
	});
	return {
		width: computed(() => resolved.value.width),
		top: computed(() => resolved.value.top),
		height: computed(() => resolved.value.height),
		fullscreen: computed(() => resolved.value.fullscreen),
		breakpoint,
		isMobile,
		elStyle
	};
}
//#endregion
//#region ../../packages/ui/src/components/ReDialog/ReDialog.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-dialog__title" };
var _hoisted_2 = { class: "re-dialog__header-actions" };
//#endregion
//#region ../../packages/ui/src/components/ReDialog/ReDialog.vue
var ReDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReDialog",
	inheritAttrs: true,
	__name: "ReDialog",
	props: /*@__PURE__*/ mergeModels({
		layout: { default: "el" },
		id: { default: "" },
		title: { default: "" },
		width: { default: "65%" },
		top: { default: "15vh" },
		appendToBody: {
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
		showClose: {
			type: Boolean,
			default: true
		},
		beforeClose: {
			type: Function,
			default: void 0
		},
		destroyOnClose: {
			type: Boolean,
			default: false
		},
		modal: {
			type: Boolean,
			default: true
		},
		draggable: {
			type: Boolean,
			default: false
		},
		fullscreenable: {
			type: Boolean,
			default: false
		},
		fullscreen: {
			type: Boolean,
			default: false
		},
		confirmLoading: {
			type: Boolean,
			default: false
		},
		okText: { default: "确定" },
		cancelText: { default: "取消" },
		showOk: {
			type: Boolean,
			default: true
		},
		showCancel: {
			type: Boolean,
			default: true
		},
		showFooter: {
			type: Boolean,
			default: void 0
		},
		footerHidden: {
			type: Boolean,
			default: void 0
		},
		headless: {
			type: Boolean,
			default: false
		},
		responsive: {
			type: Boolean,
			default: true
		},
		mobileBreakpoint: { default: 768 },
		mobileFullscreen: {
			type: Boolean,
			default: true
		},
		compact: {
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
	emits: /*@__PURE__*/ mergeModels([
		"update:modelValue",
		"ok",
		"cancel",
		"fullscreen-change"
	], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* ReDialog —— 弹窗组件
		*
		* 透传 el-dialog 全部能力，v-model 控制显隐。
		* 增强：
		*   - layout："el"（默认 el-dialog）/ "modern"（现代化扁平弹窗，异步加载）
		*   - draggable：可拖拽头部移动弹窗
		*   - fullscreenable：右上角显示全屏切换
		*   - confirmLoading：确认按钮 loading 态（常用于提交场景）
		*   - cancelText / okText：确认/取消按钮文案
		*   - footer 三态：未传时只渲染业务自定义 #footer 插槽、不渲染自带按钮；
		*     show-footer / footer-hidden 显式开启才出自带「取消/确认」按钮
		*   - headless：隐藏 header，右上角圆形关闭按钮替代（圆心定位）
		*   - responsive：基于 @vueuse/core 自动响应式（移动端默认全屏）
		*
		* 说明：原 `layout="windows"` 变体（layouts/WindowsLayout.vue）经跨行审计确认
		* 全仓无人使用，已移除；需要时从 backups/ui-unused-layouts-retire-20260926/ 取回。
		*/
		const ModernLayout = defineAsyncComponent(() => __vitePreload(() => import("./Modern-DYom0mkq.js"), __vite__mapDeps([0,1,2,3,4,5,6,7])));
		const visible = useModel(__props, "modelValue");
		const props = __props;
		const emit = __emit;
		/**
		* footer 三态归一：true=渲染自带按钮 / false=整个底部不渲染 / undefined=未传
		* （只渲染业务 #footer 插槽，不渲染自带按钮）。
		*/
		const footerMode = computed(() => {
			if (props.showFooter !== void 0) return props.showFooter;
			if (props.footerHidden !== void 0) return !props.footerHidden;
		});
		const isFullscreen = ref(props.fullscreen);
		watch(() => props.fullscreen, (v) => isFullscreen.value = v);
		const responsive = useResponsiveDialog({
			width: props.width,
			top: props.top,
			fullscreen: isFullscreen.value
		}, {
			mobileBreakpoint: props.mobileBreakpoint,
			mobileFullscreen: props.mobileFullscreen
		});
		const resolved = computed(() => {
			if (!props.responsive) return {
				width: props.width,
				top: props.top,
				fullscreen: isFullscreen.value
			};
			return {
				width: responsive.width.value,
				top: responsive.top.value,
				fullscreen: isFullscreen.value || responsive.fullscreen.value
			};
		});
		const dragState = ref(null);
		const dialogStyle = ref({});
		function onHeaderMouseDown(e) {
			if (!props.draggable || isFullscreen.value) return;
			const rect = e.currentTarget.getBoundingClientRect();
			dragState.value = {
				x: e.clientX,
				y: e.clientY,
				offsetX: rect.left,
				offsetY: rect.top
			};
			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		}
		function onMouseMove(e) {
			if (!dragState.value) return;
			const dx = e.clientX - dragState.value.x;
			const dy = e.clientY - dragState.value.y;
			const left = dragState.value.offsetX + dx;
			const top = dragState.value.offsetY + dy;
			dialogStyle.value = {
				left: `${left}px`,
				top: `${top}px`,
				marginLeft: "0",
				marginTop: "0"
			};
		}
		function onMouseUp() {
			dragState.value = null;
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		}
		function onOk() {
			if (props.confirmLoading) return;
			emit("ok");
		}
		function onCancel() {
			emit("cancel");
			visible.value = false;
		}
		function toggleFullscreen() {
			isFullscreen.value = !isFullscreen.value;
			if (!isFullscreen.value) dialogStyle.value = {};
			emit("fullscreen-change", isFullscreen.value);
		}
		function closeByFab() {
			if (props.beforeClose) props.beforeClose(() => visible.value = false);
			else visible.value = false;
		}
		const fullscreenStyle = computed(() => {
			if (isFullscreen.value || resolved.value.fullscreen) return {
				left: "0",
				top: "0",
				width: "100vw",
				height: "100vh",
				maxWidth: "100vw",
				maxHeight: "100vh",
				marginTop: "0",
				marginLeft: "0",
				borderRadius: "0"
			};
			if (Object.keys(dialogStyle.value).length) return dialogStyle.value;
			if (props.responsive) return responsive.elStyle.value;
			return {
				marginTop: props.top,
				marginLeft: "auto",
				marginRight: "auto"
			};
		});
		const showCloseFab = computed(() => props.headless);
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return __props.layout === "modern" ? (openBlock(), createBlock(unref(ModernLayout), mergeProps({
				key: 0,
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => visible.value = $event),
				title: __props.title,
				width: resolved.value.width,
				top: resolved.value.top,
				"close-on-click-modal": __props.closeOnClickModal,
				"close-on-press-escape": __props.closeOnPressEscape,
				"show-close": __props.showClose,
				"destroy-on-close": __props.destroyOnClose,
				modal: __props.modal,
				draggable: __props.draggable,
				fullscreenable: __props.fullscreenable,
				fullscreen: resolved.value.fullscreen,
				"confirm-loading": __props.confirmLoading,
				"ok-text": __props.okText,
				"cancel-text": __props.cancelText,
				"show-ok": __props.showOk,
				"show-cancel": __props.showCancel,
				"show-footer": footerMode.value,
				headless: __props.headless,
				"mobile-breakpoint": __props.mobileBreakpoint,
				compact: __props.compact
			}, _ctx.$attrs, {
				"onUpdate:modelValue": _cache[1] || (_cache[1] = (v) => emit("update:modelValue", v)),
				onOk,
				onCancel,
				onFullscreenChange: _cache[2] || (_cache[2] = (v) => emit("fullscreen-change", v)),
				onCloseFab: closeByFab
			}), createSlots({
				default: withCtx(() => [renderSlot(_ctx.$slots, "default", {}, void 0, true)]),
				_: 2
			}, [_ctx.$slots.footer ? {
				name: "footer",
				fn: withCtx((scope) => [renderSlot(_ctx.$slots, "footer", normalizeProps(guardReactiveProps(scope)), void 0, true)]),
				key: "0"
			} : void 0]), 1040, [
				"modelValue",
				"title",
				"width",
				"top",
				"close-on-click-modal",
				"close-on-press-escape",
				"show-close",
				"destroy-on-close",
				"modal",
				"draggable",
				"fullscreenable",
				"fullscreen",
				"confirm-loading",
				"ok-text",
				"cancel-text",
				"show-ok",
				"show-cancel",
				"show-footer",
				"headless",
				"mobile-breakpoint",
				"compact"
			])) : (openBlock(), createBlock(unref(ElDialog), mergeProps({
				key: 1,
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => visible.value = $event)
			}, _ctx.$attrs, {
				title: __props.headless ? "" : __props.title,
				width: typeof resolved.value.width === "number" ? resolved.value.width : String(resolved.value.width),
				top: typeof resolved.value.top === "number" ? String(resolved.value.top) : resolved.value.top,
				"append-to-body": __props.appendToBody,
				"close-on-click-modal": __props.closeOnClickModal,
				"close-on-press-escape": __props.closeOnPressEscape,
				"show-close": __props.headless ? false : __props.showClose,
				"before-close": __props.beforeClose,
				"destroy-on-close": __props.destroyOnClose,
				modal: __props.modal,
				style: fullscreenStyle.value,
				class: ["re-dialog", {
					"re-dialog--draggable": __props.draggable,
					"re-dialog--fullscreen": isFullscreen.value,
					"re-dialog--headless": __props.headless,
					"re-dialog--responsive": unref(responsive),
					"re-dialog--compact": __props.compact
				}],
				"onUpdate:modelValue": _cache[4] || (_cache[4] = (v) => emit("update:modelValue", v))
			}), createSlots({
				default: withCtx(() => [renderSlot(_ctx.$slots, "default", {}, void 0, true), showCloseFab.value ? (openBlock(), createBlock(CloseFab_default, {
					key: 0,
					onClick: closeByFab
				})) : createCommentVNode("", true)]),
				_: 2
			}, [_ctx.$slots.header && !__props.headless ? {
				name: "header",
				fn: withCtx(() => [__props.draggable ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "re-dialog__header-inner",
					style: normalizeStyle({ cursor: __props.draggable && !isFullscreen.value ? "move" : "default" }),
					onMousedown: onHeaderMouseDown
				}, [renderSlot(_ctx.$slots, "header", {}, void 0, true)], 36)) : renderSlot(_ctx.$slots, "header", {}, void 0, true, 1)]),
				key: "0"
			} : (__props.draggable || __props.fullscreenable) && !__props.headless ? {
				name: "header",
				fn: withCtx(() => [createBaseVNode("div", {
					class: "re-dialog__header-inner",
					style: normalizeStyle({ cursor: __props.draggable && !isFullscreen.value ? "move" : "default" }),
					onMousedown: onHeaderMouseDown
				}, [createBaseVNode("span", _hoisted_1, toDisplayString(__props.title), 1), createBaseVNode("div", _hoisted_2, [__props.fullscreenable ? (openBlock(), createBlock(unref(ElButton), {
					key: 0,
					link: "",
					title: isFullscreen.value ? "退出全屏" : "全屏",
					onClick: toggleFullscreen
				}, {
					default: withCtx(() => [createVNode(_component_el_icon, null, {
						default: withCtx(() => [isFullscreen.value ? (openBlock(), createBlock(unref(crop_default), { key: 0 })) : (openBlock(), createBlock(unref(full_screen_default), { key: 1 }))]),
						_: 1
					})]),
					_: 1
				}, 8, ["title"])) : createCommentVNode("", true)])], 36)]),
				key: "1"
			} : void 0, footerMode.value !== false && (footerMode.value === true || !!_ctx.$slots.footer) ? {
				name: "footer",
				fn: withCtx(() => [renderSlot(_ctx.$slots, "footer", {
					ok: onOk,
					cancel: onCancel
				}, () => [footerMode.value === true ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [__props.showCancel ? (openBlock(), createBlock(unref(ElButton), {
					key: 0,
					onClick: onCancel
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.cancelText), 1)]),
					_: 1
				})) : createCommentVNode("", true), __props.showOk ? (openBlock(), createBlock(unref(ElButton), {
					key: 1,
					type: "primary",
					loading: __props.confirmLoading,
					onClick: onOk
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.okText), 1)]),
					_: 1
				}, 8, ["loading"])) : createCommentVNode("", true)], 64)) : createCommentVNode("", true)], true)]),
				key: "2"
			} : void 0]), 1040, [
				"modelValue",
				"title",
				"width",
				"top",
				"append-to-body",
				"close-on-click-modal",
				"close-on-press-escape",
				"show-close",
				"before-close",
				"destroy-on-close",
				"modal",
				"style",
				"class"
			]));
		};
	}
}), [["__scopeId", "data-v-e16591d3"]]);
//#endregion
export { ReDialog_default as default };
