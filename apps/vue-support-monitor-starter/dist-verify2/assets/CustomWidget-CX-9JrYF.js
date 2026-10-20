import { D as createVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { lt as link_default, pn as warning_filled_default } from "./dist-DogtK295.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/CustomWidget.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "custom-widget" };
var _hoisted_2 = {
	key: 0,
	class: "custom-widget__empty"
};
var _hoisted_3 = { class: "custom-widget__header" };
var _hoisted_4 = { class: "custom-widget__title" };
var _hoisted_5 = { class: "custom-widget__body" };
var _hoisted_6 = [
	"src",
	"scrolling",
	"title"
];
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/CustomWidget.vue
var CustomWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "CustomWidget",
	props: { config: {} },
	setup(__props) {
		const props = __props;
		const cfg = computed(() => props.config ?? {});
		const hasUrl = computed(() => typeof cfg.value.url === "string" && cfg.value.url.trim().length > 0);
		const heightMode = computed(() => cfg.value.heightMode ?? "fill");
		const fixedHeight = computed(() => cfg.value.fixedHeight ?? 360);
		const scrolling = computed(() => cfg.value.scrolling ?? "auto");
		const title = computed(() => cfg.value.title ?? "自定义页面");
		const iframeStyle = computed(() => {
			if (heightMode.value === "fixed") return { height: `${fixedHeight.value}px` };
			return { height: "100%" };
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", _hoisted_1, [!hasUrl.value ? (openBlock(), createElementBlock("div", _hoisted_2, [
				createVNode(_component_el_icon, { size: 20 }, {
					default: withCtx(() => [createVNode(unref(warning_filled_default))]),
					_: 1
				}),
				_cache[0] || (_cache[0] = createBaseVNode("div", { class: "custom-widget__empty-title" }, "未配置 URL", -1)),
				_cache[1] || (_cache[1] = createBaseVNode("div", { class: "custom-widget__empty-tip" }, "编辑模式下点击该组件设置链接", -1))
			])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("div", _hoisted_3, [createVNode(_component_el_icon, { size: 14 }, {
				default: withCtx(() => [createVNode(unref(link_default))]),
				_: 1
			}), createBaseVNode("span", _hoisted_4, toDisplayString(title.value), 1)]), createBaseVNode("div", _hoisted_5, [createBaseVNode("iframe", {
				class: "custom-widget__iframe",
				src: cfg.value.url,
				style: normalizeStyle(iframeStyle.value),
				scrolling: scrolling.value,
				frameborder: "0",
				title: title.value,
				loading: "lazy"
			}, null, 12, _hoisted_6)])], 64))]);
		};
	}
}), [["__scopeId", "data-v-2d0b5740"]]);
//#endregion
export { CustomWidget_default as default };
