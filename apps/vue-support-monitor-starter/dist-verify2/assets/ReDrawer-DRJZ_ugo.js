import { $ as mergeModels, E as createTextVNode, Ft as useModel, Ht as watch, On as unref, b as createElementBlock, ct as onMounted, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, w as createSlots, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElDrawer } from "./drawer-CBwadwVQ.js";
import { u as getStorageKey } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReDrawer/theme/default/ReDrawer.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-drawer__footer"
};
var DRAWER_SUFFIX = "drawer";
//#endregion
//#region ../../packages/ui/src/components/ReDrawer/theme/default/ReDrawer.vue
var ReDrawer_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReDrawer",
	inheritAttrs: true,
	__name: "ReDrawer",
	props: /*@__PURE__*/ mergeModels({
		id: {},
		title: {},
		size: {},
		direction: {},
		appendToBody: { type: Boolean },
		closeOnClickModal: { type: Boolean },
		destroyOnClose: { type: Boolean },
		beforeClose: {},
		showClose: { type: Boolean },
		modal: { type: Boolean },
		lockScroll: { type: Boolean },
		confirmText: { default: "确定" },
		cancelText: { default: "取消" },
		confirmLoading: {
			type: Boolean,
			default: false
		},
		loading: {
			type: Boolean,
			default: false
		},
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
		}
	}, {
		"modelValue": {
			type: Boolean,
			default: false
		},
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels([
		"ok",
		"confirm",
		"cancel"
	], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* ReDrawer default 主题 —— 抽屉组件（el-drawer 封装）
		*
		* 增强：传入 id 后，自动持久化 size（宽度/高度）和 visible 状态到 localStorage，
		* 刷新页面后自动恢复关闭前的状态。
		*
		* 持久化 key 由 @repo/config.getStorageKey 统一加前缀（避免多 app 串数据）。
		*/
		const visible = useModel(__props, "modelValue");
		const props = __props;
		/** 抽屉内部子项后缀（app 前缀由 getStorageKey 加） */
		function storageKey() {
			if (!props.id) return "";
			return getStorageKey(`${DRAWER_SUFFIX}:${props.id}`);
		}
		/** 内部响应式 size（可被持久化覆盖） */
		const innerSize = ref(props.size);
		/** 从 localStorage 恢复 */
		function restore() {
			const key = storageKey();
			if (!key) return;
			try {
				const raw = localStorage.getItem(key);
				if (!raw) return;
				const state = JSON.parse(raw);
				if (state.size != null) innerSize.value = state.size;
				if (state.visible != null) visible.value = state.visible;
			} catch {}
		}
		/** 保存到 localStorage */
		function save() {
			const key = storageKey();
			if (!key) return;
			try {
				localStorage.setItem(key, JSON.stringify({
					size: innerSize.value,
					visible: visible.value
				}));
			} catch {}
		}
		/** 监听 size/visible 变化自动保存 */
		watch([visible, innerSize], () => save(), { deep: true });
		/** 挂载时恢复 */
		onMounted(() => restore());
		/** size prop 变化同步到 innerSize */
		watch(() => props.size, (v) => {
			const key = storageKey();
			if (key) {
				const raw = localStorage.getItem(key);
				if (raw) try {
					if (JSON.parse(raw).size != null) return;
				} catch {}
			}
			innerSize.value = v;
		}, { immediate: true });
		/** 最终生效的 size */
		const effectiveSize = computed(() => innerSize.value ?? props.size);
		/** 确认按钮 loading：confirmLoading 优先，其次 loading（koi 同名 prop） */
		const effectiveConfirmLoading = computed(() => props.confirmLoading || props.loading);
		/**
		* 底部区域三态归一：true=渲染自带按钮 / false=整块不渲染 / undefined=未传
		* （只渲染业务 #footer 插槽，不自带按钮）。口径与 ReDialog / koi 主题一致。
		*/
		const footerMode = computed(() => {
			if (props.showFooter !== void 0) return props.showFooter;
			if (props.footerHidden !== void 0) return !props.footerHidden;
		});
		const emit = __emit;
		/** 确定：ok + confirm 都发（页面两种写法都能生效，与 koi ReDialog 同口径） */
		function onOk() {
			if (effectiveConfirmLoading.value) return;
			emit("confirm");
			emit("ok");
		}
		/**
		* 取消：发 cancel 并关闭抽屉。
		*
		* <p>关闭不能只交给调用方：业务没接 {@code @cancel} 时按钮会「点了没反应」，
		* 表现成「取消没法点击」。这里兜底关闭，接了 @cancel 的页面照旧收到事件（重复关闭无害）。</p>
		*/
		function onCancel() {
			emit("cancel");
			visible.value = false;
		}
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElDrawer), mergeProps({
				modelValue: visible.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => visible.value = $event)
			}, _ctx.$attrs, {
				title: __props.title,
				size: effectiveSize.value,
				direction: __props.direction,
				"append-to-body": __props.appendToBody,
				"close-on-click-modal": __props.closeOnClickModal,
				"destroy-on-close": __props.destroyOnClose,
				"before-close": __props.beforeClose,
				"show-close": __props.showClose,
				modal: __props.modal,
				"lock-scroll": __props.lockScroll
			}), createSlots({
				default: withCtx(() => [renderSlot(_ctx.$slots, "default", {}, void 0, true)]),
				_: 2
			}, [footerMode.value !== false && (footerMode.value === true || !!_ctx.$slots.footer) ? {
				name: "footer",
				fn: withCtx(() => [renderSlot(_ctx.$slots, "footer", {
					ok: onOk,
					confirm: onOk,
					cancel: onCancel,
					loading: effectiveConfirmLoading.value
				}, () => [footerMode.value === true ? (openBlock(), createElementBlock("div", _hoisted_1, [__props.showCancel ? (openBlock(), createBlock(unref(ElButton), {
					key: 0,
					onClick: onCancel
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.cancelText), 1)]),
					_: 1
				})) : createCommentVNode("", true), __props.showOk ? (openBlock(), createBlock(unref(ElButton), {
					key: 1,
					type: "primary",
					loading: effectiveConfirmLoading.value,
					onClick: onOk
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.confirmText), 1)]),
					_: 1
				}, 8, ["loading"])) : createCommentVNode("", true)])) : createCommentVNode("", true)], true)]),
				key: "0"
			} : void 0]), 1040, [
				"modelValue",
				"title",
				"size",
				"direction",
				"append-to-body",
				"close-on-click-modal",
				"destroy-on-close",
				"before-close",
				"show-close",
				"modal",
				"lock-scroll"
			]);
		};
	}
}), [["__scopeId", "data-v-5b10d74c"]]);
//#endregion
export { ReDrawer_default as default };
