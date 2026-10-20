import { D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, wn as toRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as translateConfigText } from "./src-BVnZQO9c.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as logo_default, t as resolveAssetUrl } from "./resolveAssetUrl-Cq_PQpvU.js";
import { t as ReLoginForm_default } from "./ReLoginForm-sur-Td5f.js";
//#region ../../packages/theme/src/themes/koi/views/login/styles/simple.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "login-page login-simple w-screen h-screen overflow-hidden relative flex items-center justify-center" };
var _hoisted_2 = { class: "simple-shell relative z-10 w-460px max-w-94vw rounded-16px overflow-hidden" };
var _hoisted_3 = { class: "simple-shell-bar flex items-center gap-8px px-16px py-10px" };
var _hoisted_4 = { class: "simple-shell-logo" };
var _hoisted_5 = ["src", "alt"];
var _hoisted_6 = { class: "simple-shell-title ml-12px text-12px font-500" };
var _hoisted_7 = { class: "simple-shell-body p-32px" };
var _hoisted_8 = { class: "simple-prompt text-13px m-b-24px" };
var _hoisted_9 = { class: "ml-8px text-[--el-text-color-secondary]" };
var _hoisted_10 = { class: "simple-footer m-t-24px flex items-center justify-between text-12px text-[--el-text-color-secondary]" };
var _hoisted_11 = { key: 0 };
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/styles/simple.vue
var simple_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "simple",
	setup(__props) {
		const loginConfig = toRef(getConfig(), "login");
		const resolvedLogoUrl = computed(() => loginConfig.value.logoUrl ? resolveAssetUrl(loginConfig.value.logoUrl) : logo_default);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				_cache[4] || (_cache[4] = createBaseVNode("div", {
					class: "simple-dots",
					"aria-hidden": "true"
				}, null, -1)),
				_cache[5] || (_cache[5] = createBaseVNode("div", {
					class: "simple-grid",
					"aria-hidden": "true"
				}, null, -1)),
				_cache[6] || (_cache[6] = createBaseVNode("div", { class: "simple-glow simple-glow--1" }, null, -1)),
				_cache[7] || (_cache[7] = createBaseVNode("div", { class: "simple-glow simple-glow--2" }, null, -1)),
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
					_cache[0] || (_cache[0] = createBaseVNode("span", { class: "simple-dot simple-dot--red" }, null, -1)),
					_cache[1] || (_cache[1] = createBaseVNode("span", { class: "simple-dot simple-dot--yellow" }, null, -1)),
					_cache[2] || (_cache[2] = createBaseVNode("span", { class: "simple-dot simple-dot--green" }, null, -1)),
					createBaseVNode("span", _hoisted_4, [createBaseVNode("img", {
						class: "login-logo",
						src: resolvedLogoUrl.value,
						alt: loginConfig.value.brandName
					}, null, 8, _hoisted_5)]),
					createBaseVNode("span", _hoisted_6, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1)
				]), createBaseVNode("div", _hoisted_7, [
					createBaseVNode("div", _hoisted_8, [_cache[3] || (_cache[3] = createBaseVNode("span", { class: "simple-prompt-symbol" }, "$", -1)), createBaseVNode("span", _hoisted_9, toDisplayString(unref(translateConfigText)(loginConfig.value.welcome)), 1)]),
					createVNode(ReLoginForm_default, {
						"show-mobile-brand": false,
						"form-class": "simple-form",
						"show-header": false
					}),
					createBaseVNode("div", _hoisted_10, [createBaseVNode("span", null, toDisplayString(_ctx.$t("menu.login.account")), 1), loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("span", _hoisted_11, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)) : createCommentVNode("", true)])
				])])
			]);
		};
	}
}), [["__scopeId", "data-v-9b2f44d9"]]);
//#endregion
export { simple_default as default };
