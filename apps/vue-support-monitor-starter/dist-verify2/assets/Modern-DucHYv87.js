import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, S as vShow, t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { Et as plus_default, r as arrow_down_default } from "./dist-DogtK295.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                       */
//#region ../../packages/ui/src/components/ReSearch/layouts/Modern.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-search__footer" };
var _hoisted_2 = { class: "re-search__footer-left" };
var _hoisted_3 = [
	"aria-expanded",
	"aria-label",
	"onKeydown"
];
var _hoisted_4 = {
	key: 0,
	class: "re-search__label"
};
//#endregion
//#region ../../packages/ui/src/components/ReSearch/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReSearchModern",
	inheritAttrs: true,
	__name: "Modern",
	props: {
		isExpanded: {
			type: Boolean,
			default: false
		},
		showSearch: {
			type: Boolean,
			default: true
		},
		bordered: {
			type: Boolean,
			default: true
		},
		mode: { default: 1 },
		showLabel: {
			type: Boolean,
			default: false
		},
		tooltipText: { default: "搜索" },
		padding: { default: "16px 20px 6px" },
		addButton: {
			type: Boolean,
			default: true
		},
		addText: { default: "新增" }
	},
	emits: ["add"],
	setup(__props, { emit: __emit }) {
		/**
		* ReSearch Modern 布局 —— 现代化搜索折叠组件
		*
		* 使用 --rs-* 设计令牌，胶囊触发按钮带浮起阴影，
		* 展开时容器加深边框色。
		*/
		const props = __props;
		const emit = __emit;
		const showExpanded = ref(false);
		const toggleExpanded = () => {
			showExpanded.value = !showExpanded.value;
		};
		const handleAdd = () => {
			emit("add");
		};
		const tooltipContent = computed(() => showExpanded.value ? "收起" : props.tooltipText);
		const triggerIconClass = computed(() => ({ "koi-search__icon--expanded": showExpanded.value }));
		const containerStyle = computed(() => {
			const base = { padding: props.padding };
			if (props.mode === 2) base["--label-width"] = "100px";
			return base;
		});
		onMounted(() => {
			if (props.isExpanded !== void 0) showExpanded.value = props.isExpanded;
		});
		return (_ctx, _cache) => {
			const _component_el_collapse_transition = resolveComponent("el-collapse-transition");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_tooltip = resolveComponent("el-tooltip");
			return openBlock(), createBlock(Transition, { name: "re-search-collapse" }, {
				default: withCtx(() => [withDirectives(createBaseVNode("div", {
					class: normalizeClass(["re-search re-search--modern", {
						"re-search--no-border": !__props.bordered,
						"re-search--expanded": showExpanded.value,
						"re-search--form": __props.mode === 2
					}]),
					style: normalizeStyle(containerStyle.value)
				}, [
					_cache[1] || (_cache[1] = createBaseVNode("div", { class: "re-search__divider" }, null, -1)),
					createVNode(_component_el_collapse_transition, null, {
						default: withCtx(() => [showExpanded.value ? (openBlock(), createElementBlock("div", {
							key: 0,
							class: normalizeClass(["re-search__content", { "re-search__content--form": __props.mode === 2 }])
						}, [renderSlot(_ctx.$slots, "default", {}, void 0, true)], 2)) : createCommentVNode("", true)]),
						_: 3
					}),
					createBaseVNode("div", _hoisted_1, [
						createBaseVNode("div", _hoisted_2, [renderSlot(_ctx.$slots, "footer", {}, void 0, true)]),
						__props.addButton ? (openBlock(), createBlock(_component_el_button, {
							key: 0,
							class: "re-search__add-btn",
							type: "primary",
							icon: unref(plus_default),
							onClick: handleAdd
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(__props.addText), 1)]),
							_: 1
						}, 8, ["icon"])) : createCommentVNode("", true),
						_cache[0] || (_cache[0] = createBaseVNode("div", { class: "re-search__spacer" }, null, -1)),
						createVNode(_component_el_tooltip, {
							content: tooltipContent.value,
							placement: "top",
							"show-after": 100,
							"popper-class": "re-search__tooltip"
						}, {
							default: withCtx(() => [createBaseVNode("div", {
								class: normalizeClass(["re-search__trigger", { "re-search__trigger--label": __props.showLabel }]),
								onClick: toggleExpanded,
								role: "button",
								"aria-expanded": showExpanded.value,
								"aria-label": tooltipContent.value,
								tabindex: "0",
								onKeydown: [withKeys(withModifiers(toggleExpanded, ["prevent"]), ["enter"]), withKeys(withModifiers(toggleExpanded, ["prevent"]), ["space"])]
							}, [renderSlot(_ctx.$slots, "action", {}, () => [createVNode(_component_el_icon, {
								size: 14,
								class: normalizeClass(triggerIconClass.value)
							}, {
								default: withCtx(() => [createVNode(unref(arrow_down_default))]),
								_: 1
							}, 8, ["class"]), __props.showLabel ? (openBlock(), createElementBlock("span", _hoisted_4, toDisplayString(tooltipContent.value), 1)) : createCommentVNode("", true)], true)], 42, _hoisted_3)]),
							_: 3
						}, 8, ["content"])
					])
				], 6), [[vShow, __props.showSearch]])]),
				_: 3
			});
		};
	}
}), [["__scopeId", "data-v-108d00fa"]]);
//#endregion
export { Modern_default as default };
