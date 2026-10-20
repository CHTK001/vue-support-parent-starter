import { D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, wn as toRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as translateConfigText } from "./src-BVnZQO9c.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as logo_default, t as resolveAssetUrl } from "./resolveAssetUrl-Cq_PQpvU.js";
import { t as ReLoginForm_default } from "./ReLoginForm-sur-Td5f.js";
//#region ../../packages/theme/src/themes/koi/views/login/styles/mono.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "login-page login-mono w-screen h-screen overflow-hidden flex items-center justify-center relative" };
var _hoisted_2 = { class: "mono-shell relative z-10 w-520px max-w-94vw rounded-20px overflow-hidden" };
var _hoisted_3 = { class: "mono-shell-bar flex items-center gap-10px px-18px py-12px" };
var _hoisted_4 = { class: "mono-shell-logo" };
var _hoisted_5 = ["src", "alt"];
var _hoisted_6 = { class: "mono-shell-title ml-14px text-13px font-500" };
var _hoisted_7 = { class: "mono-shell-body p-36px" };
var _hoisted_8 = { class: "mono-prompt text-14px m-b-28px" };
var _hoisted_9 = { class: "ml-8px text-white/50" };
var _hoisted_10 = { class: "mono-footer m-t-28px flex items-center justify-between text-12px text-white/30" };
var _hoisted_11 = { key: 0 };
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/styles/mono.vue
var mono_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "mono",
	setup(__props) {
		const loginConfig = toRef(getConfig(), "login");
		const resolvedLogoUrl = computed(() => loginConfig.value.logoUrl ? resolveAssetUrl(loginConfig.value.logoUrl) : logo_default);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [_cache[4] || (_cache[4] = createBaseVNode("div", {
				class: "mono-dots",
				"aria-hidden": "true"
			}, null, -1)), createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
				_cache[0] || (_cache[0] = createBaseVNode("span", { class: "mono-dot mono-dot--red" }, null, -1)),
				_cache[1] || (_cache[1] = createBaseVNode("span", { class: "mono-dot mono-dot--yellow" }, null, -1)),
				_cache[2] || (_cache[2] = createBaseVNode("span", { class: "mono-dot mono-dot--green" }, null, -1)),
				createBaseVNode("span", _hoisted_4, [createBaseVNode("img", {
					class: "login-logo",
					src: resolvedLogoUrl.value,
					alt: loginConfig.value.brandName
				}, null, 8, _hoisted_5)]),
				createBaseVNode("span", _hoisted_6, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1)
			]), createBaseVNode("div", _hoisted_7, [
				createBaseVNode("div", _hoisted_8, [_cache[3] || (_cache[3] = createBaseVNode("span", { class: "mono-prompt-symbol" }, "$", -1)), createBaseVNode("span", _hoisted_9, toDisplayString(unref(translateConfigText)(loginConfig.value.welcome)), 1)]),
				createVNode(ReLoginForm_default, {
					"show-mobile-brand": false,
					"form-class": "mono-form",
					"show-header": false
				}),
				createBaseVNode("div", _hoisted_10, [createBaseVNode("span", null, toDisplayString(_ctx.$t("menu.login.account")), 1), loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("span", _hoisted_11, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)) : createCommentVNode("", true)])
			])])]);
		};
	}
}), [["__scopeId", "data-v-652f3c72"]]);
//#endregion
export { mono_default as default };
