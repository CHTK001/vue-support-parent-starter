import { $n as normalizeClass, D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, u as Teleport, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReIcon-By12b2Y9.js";
//#region ../../pages/datasource/src/components/console/DsmContextMenu.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "dsm-cm__divider"
};
var _hoisted_2 = ["aria-disabled", "onClick"];
var _hoisted_3 = { class: "dsm-cm__label" };
//#endregion
//#region ../../pages/datasource/src/components/console/DsmContextMenu.vue
var DsmContextMenu_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DsmContextMenu",
	props: {
		visible: {
			type: Boolean,
			default: false
		},
		x: { default: 0 },
		y: { default: 0 },
		items: { default: () => [] }
	},
	emits: ["select", "update:visible"],
	setup(__props, { emit: __emit }) {
		/**
		* DsmContextMenu — 中间件控制台统一右键菜单
		*
		* <p>第九批「统一右键」以 ZooKeeper 控制台的 {@code .zk-context-menu} 为模板：
		* fixed 定位在光标处、图标+文案、悬停高亮、danger/warning 变色、分隔线；
		* Teleport 到 body（不被侧栏 overflow 裁剪），点击外部自动关闭。</p>
		*
		* <p>宿主侧用原生 {@code @contextmenu.prevent} 打开并写入 x/y/items，
		* 选择项以 {@code select} 事件冒泡给宿主分发（key 对应宿主自己的动作键）。</p>
		*
		* @author CH
		* @since 4.0.0
		*/
		const props = __props;
		const emit = __emit;
		const menuRef = ref(null);
		/** 定位（防溢出：超出视口回退） */
		const menuStyle = computed(() => {
			const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
			const vh = typeof window !== "undefined" ? window.innerHeight : 9999;
			const estW = 200;
			const estH = (props.items?.length || 0) * 36;
			let x = props.x;
			let y = props.y;
			if (x + estW > vw) x = Math.max(8, vw - estW - 8);
			if (y + estH > vh) y = Math.max(8, vh - estH - 8);
			return {
				left: `${x}px`,
				top: `${y}px`
			};
		});
		/** 点击外部关闭 */
		function onDocumentClick(e) {
			if (!props.visible) return;
			if (menuRef.value && !menuRef.value.contains(e.target)) emit("update:visible", false);
		}
		onMounted(() => document.addEventListener("click", onDocumentClick, true));
		onBeforeUnmount(() => document.removeEventListener("click", onDocumentClick, true));
		return (_ctx, _cache) => {
			return openBlock(), createBlock(Teleport, { to: "body" }, [createVNode(Transition, { name: "dsm-cm-fade" }, {
				default: withCtx(() => [__props.visible && __props.items.length > 0 ? (openBlock(), createElementBlock("div", {
					key: 0,
					ref_key: "menuRef",
					ref: menuRef,
					class: "dsm-cm",
					style: normalizeStyle(menuStyle.value),
					onContextmenu: _cache[0] || (_cache[0] = withModifiers(() => {}, ["prevent"]))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (it, idx) => {
					return openBlock(), createElementBlock(Fragment, { key: it.key }, [it.divided && idx > 0 ? (openBlock(), createElementBlock("div", _hoisted_1)) : createCommentVNode("", true), createBaseVNode("div", {
						class: normalizeClass(["dsm-cm__item", {
							"dsm-cm__item--danger": it.danger,
							"dsm-cm__item--warning": it.warning,
							"is-disabled": it.disabled
						}]),
						"aria-disabled": it.disabled ? "true" : void 0,
						onClick: withModifiers(($event) => {
							if (!it.disabled) {
								emit("select", it.key);
								emit("update:visible", false);
							}
						}, ["stop"])
					}, [createVNode(unref(component), {
						name: it.icon,
						size: "14"
					}, null, 8, ["name"]), createBaseVNode("span", _hoisted_3, toDisplayString(it.label), 1)], 10, _hoisted_2)], 64);
				}), 128))], 36)) : createCommentVNode("", true)]),
				_: 1
			})]);
		};
	}
}), [["__scopeId", "data-v-122b6d81"]]);
//#endregion
export { DsmContextMenu_default as t };
