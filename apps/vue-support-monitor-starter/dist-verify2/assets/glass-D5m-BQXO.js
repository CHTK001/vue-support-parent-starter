import { D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, wn as toRef, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as translateConfigText } from "./src-BVnZQO9c.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as logo_default, t as resolveAssetUrl } from "./resolveAssetUrl-Cq_PQpvU.js";
import { t as ReLoginForm_default } from "./ReLoginForm-sur-Td5f.js";
//#region ../../packages/theme/src/themes/koi/views/login/styles/glass.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "login-page login-glass w-screen h-screen overflow-hidden flex items-center justify-center relative" };
var _hoisted_2 = { class: "glass-card relative z-10 w-440px max-w-92vw rounded-24px p-40px" };
var _hoisted_3 = { class: "glass-card-inner" };
var _hoisted_4 = { class: "glass-card-header text-center m-b-36px" };
var _hoisted_5 = { class: "glass-card-mark" };
var _hoisted_6 = ["src", "alt"];
var _hoisted_7 = { class: "text-28px font-800 m-b-8px text-[--el-text-color-primary]" };
var _hoisted_8 = { class: "text-14px text-[--el-text-color-regular]" };
var _hoisted_9 = { class: "glass-footer m-t-24px text-center" };
var _hoisted_10 = {
	key: 0,
	class: "text-12px text-[--el-text-color-secondary]"
};
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/styles/glass.vue
var glass_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "glass",
	setup(__props) {
		const loginConfig = toRef(getConfig(), "login");
		const resolvedLogoUrl = computed(() => loginConfig.value.logoUrl ? resolveAssetUrl(loginConfig.value.logoUrl) : logo_default);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				_cache[0] || (_cache[0] = createBaseVNode("div", { class: "glass-bg glass-bg--1" }, null, -1)),
				_cache[1] || (_cache[1] = createBaseVNode("div", { class: "glass-bg glass-bg--2" }, null, -1)),
				_cache[2] || (_cache[2] = createBaseVNode("div", { class: "glass-bg glass-bg--3" }, null, -1)),
				_cache[3] || (_cache[3] = createBaseVNode("div", {
					class: "glass-grid",
					"aria-hidden": "true"
				}, null, -1)),
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [
						createBaseVNode("div", _hoisted_5, [createBaseVNode("img", {
							class: "glass-card-logo",
							src: resolvedLogoUrl.value,
							alt: loginConfig.value.brandName
						}, null, 8, _hoisted_6)]),
						createBaseVNode("h3", _hoisted_7, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1),
						createBaseVNode("p", _hoisted_8, toDisplayString(unref(translateConfigText)(loginConfig.value.description)), 1)
					]),
					createVNode(ReLoginForm_default, {
						"show-mobile-brand": false,
						"show-header": false,
						"form-class": "glass-form"
					}),
					createBaseVNode("div", _hoisted_9, [loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("span", _hoisted_10, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)) : createCommentVNode("", true)])
				])])
			]);
		};
	}
}), [["__scopeId", "data-v-e6c6c28c"]]);
//#endregion
export { glass_default as default };
