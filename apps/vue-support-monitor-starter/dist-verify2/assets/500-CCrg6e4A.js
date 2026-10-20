import { D as createVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, k as defineComponent, mt as openBlock, qt as withCtx } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { i as arrow_left_default, it as home_filled_default } from "./dist-DogtK295.js";
import { x as HOME_URL } from "./src-DzQcKxHP.js";
import { a as useRouter } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as _500_default$1 } from "./500-CPUXSUXa.js";
//#region ../../packages/pages/src/error/500.vue?vue&type=script&setup=true&name=Error500Page&lang.ts
var _hoisted_1 = { class: "error-page" };
var _hoisted_2 = { class: "error-page__inner" };
var _hoisted_3 = ["src"];
var _hoisted_4 = { class: "koi-bottom" };
var _hoisted_5 = { class: "error-page__actions" };
//#endregion
//#region ../../packages/pages/src/error/500.vue
var _500_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "500",
	setup(__props) {
		const router = useRouter();
		const handleHomePage = () => {
			router.push({ path: HOME_URL });
		};
		const handleBack = () => {
			if (window.history.length > 1) router.back();
			else handleHomePage();
		};
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_button = resolveComponent("el-button");
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createBaseVNode("img", {
				class: "error-page__banner",
				src: unref(_500_default$1),
				alt: "500"
			}, null, 8, _hoisted_3), createBaseVNode("div", _hoisted_4, [
				_cache[2] || (_cache[2] = createBaseVNode("div", { class: "koi-text1" }, "500", -1)),
				_cache[3] || (_cache[3] = createBaseVNode("p", { class: "koi-text2" }, "服务器好像开小差了，请稍后再试", -1)),
				createBaseVNode("div", _hoisted_5, [createVNode(_component_el_button, {
					class: "error-btn error-btn--primary",
					onClick: handleHomePage
				}, {
					default: withCtx(() => [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(home_filled_default))]),
						_: 1
					}), _cache[0] || (_cache[0] = createBaseVNode("span", null, "返回首页", -1))]),
					_: 1
				}), createVNode(_component_el_button, {
					class: "error-btn error-btn--ghost",
					onClick: handleBack
				}, {
					default: withCtx(() => [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(arrow_left_default))]),
						_: 1
					}), _cache[1] || (_cache[1] = createBaseVNode("span", null, "返回上页", -1))]),
					_: 1
				})])
			])])]);
		};
	}
}), [["__scopeId", "data-v-7fb1de24"]]);
//#endregion
export { _500_default as t };
