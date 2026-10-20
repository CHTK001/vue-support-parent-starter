const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/CloseFab-JqWPXX1L.js","assets/CloseFab-BDUUpPI2.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/CloseFab-DOA6DYuP.css"])))=>i.map(i=>d[i]);
import { $ as mergeModels, $n as normalizeClass, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, O as defineAsyncComponent, On as unref, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, u as Teleport, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReDialog/layouts/Modern.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "rm-dialog__title" };
var _hoisted_2 = { class: "rm-dialog__header-actions" };
var _hoisted_3 = {
	key: 1,
	class: "rm-dialog__footer"
};
var _hoisted_4 = ["disabled"];
var _hoisted_5 = {
	key: 0,
	class: "rm-dialog__spinner"
};
//#endregion
//#region ../../packages/ui/src/components/ReDialog/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReDialogModern",
	inheritAttrs: true,
	__name: "Modern",
	props: /*@__PURE__*/ mergeModels({
		title: { default: "" },
		width: { default: "50%" },
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
		confirmText: { default: void 0 },
		cancelButtonText: { default: void 0 },
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
		headless: {
			type: Boolean,
			default: false
		},
		responsive: {
			type: Boolean,
			default: false
		},
		mobileBreakpoint: { default: 768 },
		compact: {
			type: Boolean,
			default: false
		},
		top: { default: "15vh" }
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
		"fullscreen-change",
		"close-fab"
	], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* ReDialog Modern 布局 —— 现代化扁平弹窗
		*
		* 设计特点：
		*   - 大圆角容器（16px）
		*   - 扁平 header（无分割线，间距区分）
		*   - 扁平 footer 按钮
		*   - 柔和遮罩层
		*/
		const ReDialogCloseFab = defineAsyncComponent(() => __vitePreload(() => import("./CloseFab-JqWPXX1L.js"), __vite__mapDeps([0,1,2,3,4,5,6])));
		const visible = useModel(__props, "modelValue");
		const props = __props;
		const emit = __emit;
		const isFullscreen = ref(props.fullscreen);
		watch(() => props.fullscreen, (v) => isFullscreen.value = v);
		const resolvedOkText = computed(() => props.confirmText ?? props.okText);
		const resolvedCancelText = computed(() => props.cancelButtonText ?? props.cancelText);
		const dialogStyle = ref({});
		const dragState = ref(null);
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
			dialogStyle.value = {
				left: `${dragState.value.offsetX + e.clientX - dragState.value.x}px`,
				top: `${dragState.value.offsetY + e.clientY - dragState.value.y}px`,
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
		function closeByFab() {
			visible.value = false;
			emit("update:modelValue", false);
			emit("close-fab");
		}
		function toggleFullscreen() {
			isFullscreen.value = !isFullscreen.value;
			if (!isFullscreen.value) dialogStyle.value = {};
			emit("fullscreen-change", isFullscreen.value);
		}
		const mergedStyle = computed(() => {
			if (isFullscreen.value) return {
				left: "0",
				top: "0",
				width: "100vw",
				height: "100vh",
				maxWidth: "100vw",
				maxHeight: "100vh",
				marginTop: "0",
				marginLeft: "0"
			};
			if (Object.keys(dialogStyle.value).length) return dialogStyle.value;
			return {
				...dialogStyle.value,
				top: props.top
			};
		});
		const widthStyle = computed(() => {
			const w = props.width;
			return typeof w === "number" ? `${w}px` : w;
		});
		function onMaskClick() {
			if (props.closeOnClickModal) {
				visible.value = false;
				emit("update:modelValue", false);
			}
		}
		/**
		* Esc 关闭。
		*
		* <p><b>原实现的问题（HANDOVER §5.3 D2「已定位未修」）</b>：在 setup 顶层用了
		* <i>匿名</i>处理函数 `window.addEventListener("keydown", ...)` 且**从不注销** ——
		* 匿名函数也没法注销。于是每次挂载都往 `window` 上留一个监听器，
		* 组件卸载后依然存在，反复开关弹窗会持续累积。</p>
		*
		* <p><b>为什么改成这个最小版本</b>：本文件是<b>共用组件</b>，且当前环境无法完成
		* 运行时回归（system 应用的 modern 弹窗进不去 —— 它的 login 接口需要该应用自己的
		* 代理配置）。所以这里**刻意不改动挂载时机与判定条件**（仍然在 setup 时挂、
		* 仍然只在 `visible && closeOnPressEscape` 时响应），
		* 只补上原来缺的那一步：**卸载时注销**。
		* 这样 Esc 的既有行为逐字不变，而被修的正是真正会累积的那部分 —— 卸载后的残留。
		* 若将来能完成运行时回归，再考虑进一步「仅在 visible 期间挂载」。</p>
		*/
		function onKeydown(e) {
			if (e.key === "Escape" && visible.value && props.closeOnPressEscape) {
				visible.value = false;
				emit("update:modelValue", false);
			}
		}
		if (typeof document !== "undefined") {
			document.addEventListener("keydown", onKeydown);
			onBeforeUnmount(() => {
				document.removeEventListener("keydown", onKeydown);
			});
		}
		return (_ctx, _cache) => {
			return openBlock(), createBlock(Teleport, { to: "body" }, [createVNode(Transition, { name: "rm-dialog-fade" }, {
				default: withCtx(() => [visible.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "rm-dialog-overlay",
					onClick: withModifiers(onMaskClick, ["self"])
				}, [createBaseVNode("div", mergeProps({
					class: ["rm-dialog", {
						"rm-dialog--fullscreen": isFullscreen.value,
						"rm-dialog--compact": __props.compact
					}],
					style: {
						...mergedStyle.value,
						width: isFullscreen.value ? void 0 : widthStyle.value
					}
				}, _ctx.$attrs), [
					!__props.headless ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: "rm-dialog__header",
						style: normalizeStyle({ cursor: __props.draggable && !isFullscreen.value ? "move" : "default" }),
						onMousedown: onHeaderMouseDown
					}, [createBaseVNode("span", _hoisted_1, toDisplayString(__props.title), 1), createBaseVNode("div", _hoisted_2, [__props.fullscreenable ? (openBlock(), createElementBlock("button", {
						key: 0,
						class: "rm-dialog__header-btn",
						type: "button",
						onClick: toggleFullscreen
					}, toDisplayString(isFullscreen.value ? "⤢" : "⤡"), 1)) : createCommentVNode("", true), __props.showClose ? (openBlock(), createElementBlock("button", {
						key: 1,
						class: "rm-dialog__close",
						type: "button",
						onClick: onCancel
					}, [..._cache[0] || (_cache[0] = [createBaseVNode("svg", {
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						"stroke-width": "2"
					}, [createBaseVNode("line", {
						x1: "18",
						y1: "6",
						x2: "6",
						y2: "18"
					}), createBaseVNode("line", {
						x1: "6",
						y1: "6",
						x2: "18",
						y2: "18"
					})], -1)])])) : createCommentVNode("", true)])], 36)) : createCommentVNode("", true),
					createBaseVNode("div", { class: normalizeClass(["rm-dialog__body", { "rm-dialog__body--headless": __props.headless }]) }, [renderSlot(_ctx.$slots, "default", {}, void 0, true)], 2),
					__props.showFooter === true || __props.showFooter !== false && !!_ctx.$slots.footer ? (openBlock(), createElementBlock("div", _hoisted_3, [renderSlot(_ctx.$slots, "footer", {
						ok: onOk,
						cancel: onCancel
					}, () => [__props.showFooter === true ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [__props.showCancel ? (openBlock(), createElementBlock("button", {
						key: 0,
						class: "rm-dialog__btn rm-dialog__btn--cancel",
						type: "button",
						onClick: onCancel
					}, toDisplayString(resolvedCancelText.value), 1)) : createCommentVNode("", true), __props.showOk ? (openBlock(), createElementBlock("button", {
						key: 1,
						class: normalizeClass([
							"rm-dialog__btn",
							"rm-dialog__btn--ok",
							{ "is-loading": __props.confirmLoading }
						]),
						type: "button",
						disabled: __props.confirmLoading,
						onClick: onOk
					}, [__props.confirmLoading ? (openBlock(), createElementBlock("span", _hoisted_5, [..._cache[1] || (_cache[1] = [createBaseVNode("svg", {
						viewBox: "0 0 24 24",
						fill: "none"
					}, [createBaseVNode("circle", {
						cx: "12",
						cy: "12",
						r: "10",
						stroke: "currentColor",
						"stroke-width": "3",
						"stroke-dasharray": "30 70",
						"stroke-linecap": "round"
					})], -1)])])) : createCommentVNode("", true), createTextVNode(" " + toDisplayString(resolvedOkText.value), 1)], 10, _hoisted_4)) : createCommentVNode("", true)], 64)) : createCommentVNode("", true)], true)])) : createCommentVNode("", true),
					__props.headless ? (openBlock(), createBlock(unref(ReDialogCloseFab), {
						key: 2,
						onClick: closeByFab
					})) : createCommentVNode("", true)
				], 16)])) : createCommentVNode("", true)]),
				_: 3
			})]);
		};
	}
}), [["__scopeId", "data-v-9a4e3d93"]]);
//#endregion
export { Modern_default as default };
