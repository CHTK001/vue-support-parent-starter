import { D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, wn as toRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as translateConfigText } from "./src-BVnZQO9c.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as logo_default, t as resolveAssetUrl } from "./resolveAssetUrl-Cq_PQpvU.js";
import { t as ReLoginForm_default } from "./ReLoginForm-sur-Td5f.js";
//#region ../../packages/theme/src/themes/koi/views/login/styles/slide.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "login-page login-slide w-screen h-screen overflow-hidden flex items-center justify-center relative" };
var _hoisted_2 = { class: "slide-card relative z-10 w-440px max-w-94vw rounded-24px overflow-hidden p-36px" };
var _hoisted_3 = { class: "relative z-1" };
var _hoisted_4 = { class: "slide-card-head" };
var _hoisted_5 = { class: "slide-card-mark" };
var _hoisted_6 = ["src", "alt"];
var _hoisted_7 = { class: "slide-card-title" };
var _hoisted_8 = { class: "slide-card-desc" };
var _hoisted_9 = { class: "slide-footer m-t-24px text-center text-12px text-[--el-text-color-secondary]" };
var _hoisted_10 = { key: 0 };
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/styles/slide.vue
var slide_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "slide",
	setup(__props) {
		const loginConfig = toRef(getConfig(), "login");
		const resolvedLogoUrl = computed(() => loginConfig.value.logoUrl ? resolveAssetUrl(loginConfig.value.logoUrl) : logo_default);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				_cache[2] || (_cache[2] = createBaseVNode("div", { class: "slide-bg slide-bg--1" }, null, -1)),
				_cache[3] || (_cache[3] = createBaseVNode("div", { class: "slide-bg slide-bg--2" }, null, -1)),
				_cache[4] || (_cache[4] = createBaseVNode("div", { class: "slide-bg slide-bg--3" }, null, -1)),
				_cache[5] || (_cache[5] = createBaseVNode("div", {
					class: "slide-mesh",
					"aria-hidden": "true"
				}, null, -1)),
				createBaseVNode("div", _hoisted_2, [
					_cache[0] || (_cache[0] = createBaseVNode("div", { class: "slide-card-glow slide-card-glow--1" }, null, -1)),
					_cache[1] || (_cache[1] = createBaseVNode("div", { class: "slide-card-glow slide-card-glow--2" }, null, -1)),
					createBaseVNode("div", _hoisted_3, [
						createBaseVNode("div", _hoisted_4, [
							createBaseVNode("div", _hoisted_5, [createBaseVNode("img", {
								class: "slide-card-logo",
								src: resolvedLogoUrl.value,
								alt: loginConfig.value.brandName
							}, null, 8, _hoisted_6)]),
							createBaseVNode("h3", _hoisted_7, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1),
							createBaseVNode("p", _hoisted_8, toDisplayString(unref(translateConfigText)(loginConfig.value.description)), 1)
						]),
						createVNode(ReLoginForm_default, {
							"show-mobile-brand": false,
							"show-header": false,
							"form-class": "slide-form"
						}),
						createBaseVNode("div", _hoisted_9, [loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("span", _hoisted_10, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)) : createCommentVNode("", true)])
					])
				])
			]);
		};
	}
}), [["__scopeId", "data-v-2aa27a4d"]]);
//#endregion
export { slide_default as default };
