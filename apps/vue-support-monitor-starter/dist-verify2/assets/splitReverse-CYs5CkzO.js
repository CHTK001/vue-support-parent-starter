import { D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, wn as toRef, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as translateConfigText } from "./src-BVnZQO9c.js";
import { R as dist_exports } from "./dist-DogtK295.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as logo_default, t as resolveAssetUrl } from "./resolveAssetUrl-Cq_PQpvU.js";
import { t as ReLoginForm_default } from "./ReLoginForm-sur-Td5f.js";
//#region ../../packages/theme/src/themes/koi/views/login/styles/splitReverse.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "login-page login-split-reverse w-screen h-screen overflow-hidden flex" };
var _hoisted_2 = { class: "lsr-form-side flex-1 flex flex-col items-center justify-center relative p-24px" };
var _hoisted_3 = { class: "lsr-form-wrap w-100% max-w-400px" };
var _hoisted_4 = { class: "lsr-mobile-brand md:hidden flex items-center justify-center gap-10px m-b-24px" };
var _hoisted_5 = { class: "lsr-logo lsr-logo--mobile" };
var _hoisted_6 = ["src", "alt"];
var _hoisted_7 = { class: "text-18px font-700 text-[--el-text-color-primary]" };
var _hoisted_8 = { class: "text-center m-b-36px" };
var _hoisted_9 = { class: "text-28px font-800 m-b-8px text-[--el-text-color-primary]" };
var _hoisted_10 = { class: "text-14px text-[--el-text-color-regular]" };
var _hoisted_11 = { class: "lsr-footer m-t-28px text-center text-12px text-[--el-text-color-secondary] md:hidden" };
var _hoisted_12 = { key: 0 };
var _hoisted_13 = { class: "lsr-brand flex-1 relative overflow-hidden hidden md:flex flex-col justify-between p-40px" };
var _hoisted_14 = { class: "relative z-2 flex items-center gap-12px" };
var _hoisted_15 = { class: "lsr-logo" };
var _hoisted_16 = ["src", "alt"];
var _hoisted_17 = { class: "text-18px font-700 text-white" };
var _hoisted_18 = { class: "relative z-2" };
var _hoisted_19 = { class: "lsr-title text-40px font-800 text-white m-b-20px leading-tight" };
var _hoisted_20 = { class: "text-16px text-white/75 max-w-520px leading-relaxed" };
var _hoisted_21 = { class: "flex gap-12px m-t-32px flex-wrap" };
var _hoisted_22 = { class: "relative z-2 flex items-center justify-between text-12px text-white/60" };
var _hoisted_23 = { key: 0 };
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/styles/splitReverse.vue
var splitReverse_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "splitReverse",
	setup(__props) {
		const loginConfig = toRef(getConfig(), "login");
		const resolvedLogoUrl = computed(() => loginConfig.value.logoUrl ? resolveAssetUrl(loginConfig.value.logoUrl) : logo_default);
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
				createBaseVNode("div", _hoisted_4, [createBaseVNode("div", _hoisted_5, [createBaseVNode("img", {
					class: "login-logo",
					src: resolvedLogoUrl.value,
					alt: loginConfig.value.brandName
				}, null, 8, _hoisted_6)]), createBaseVNode("span", _hoisted_7, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1)]),
				createBaseVNode("div", _hoisted_8, [createBaseVNode("h3", _hoisted_9, toDisplayString(_ctx.$t("menu.login.account")), 1), createBaseVNode("p", _hoisted_10, toDisplayString(_ctx.$t("menu.login.form.loginName")) + " / " + toDisplayString(_ctx.$t("menu.login.form.password")), 1)]),
				createVNode(ReLoginForm_default, {
					"show-mobile-brand": false,
					"show-header": false
				}),
				createBaseVNode("div", _hoisted_11, [loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("span", _hoisted_12, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)) : createCommentVNode("", true)])
			])]), createBaseVNode("div", _hoisted_13, [
				_cache[0] || (_cache[0] = createBaseVNode("div", {
					class: "lsr-brand-mesh",
					"aria-hidden": "true"
				}, null, -1)),
				_cache[1] || (_cache[1] = createBaseVNode("div", { class: "lsr-brand-glow lsr-brand-glow--1" }, null, -1)),
				_cache[2] || (_cache[2] = createBaseVNode("div", { class: "lsr-brand-glow lsr-brand-glow--2" }, null, -1)),
				createBaseVNode("div", _hoisted_14, [createBaseVNode("div", _hoisted_15, [createBaseVNode("img", {
					class: "login-logo",
					src: resolvedLogoUrl.value,
					alt: loginConfig.value.brandName
				}, null, 8, _hoisted_16)]), createBaseVNode("span", _hoisted_17, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1)]),
				createBaseVNode("div", _hoisted_18, [
					createBaseVNode("h2", _hoisted_19, toDisplayString(unref(translateConfigText)(loginConfig.value.welcome)), 1),
					createBaseVNode("p", _hoisted_20, toDisplayString(unref(translateConfigText)(loginConfig.value.description)), 1),
					createBaseVNode("div", _hoisted_21, [(openBlock(true), createElementBlock(Fragment, null, renderList(loginConfig.value.featureTags, (tag) => {
						return openBlock(), createElementBlock("span", {
							class: "lsr-feature",
							key: tag.text
						}, [createVNode(_component_el_icon, {
							size: 14,
							class: "lsr-feature-icon"
						}, {
							default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(dist_exports[tag.icon])))]),
							_: 2
						}, 1024), createTextVNode(" " + toDisplayString(unref(translateConfigText)(tag.text)), 1)]);
					}), 128))])
				]),
				createBaseVNode("div", _hoisted_22, [createBaseVNode("span", null, "© 2026 " + toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1), loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("span", _hoisted_23, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)) : createCommentVNode("", true)])
			])]);
		};
	}
}), [["__scopeId", "data-v-097f3da3"]]);
//#endregion
export { splitReverse_default as default };
