import { D as createVNode, E as createTextVNode, St as resolveComponent, T as createStaticVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, wn as toRef, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as translateConfigText } from "./src-BVnZQO9c.js";
import { R as dist_exports } from "./dist-DogtK295.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as logo_default, t as resolveAssetUrl } from "./resolveAssetUrl-Cq_PQpvU.js";
import { t as ReLoginForm_default } from "./ReLoginForm-sur-Td5f.js";
//#region ../../packages/theme/src/themes/koi/views/login/styles/card.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "lc-page w-screen h-screen overflow-y-auto flex items-center justify-center relative" };
var _hoisted_2 = { class: "lc-card" };
var _hoisted_3 = { class: "lc-brand" };
var _hoisted_4 = { class: "lc-brand__head" };
var _hoisted_5 = { class: "lc-brand__logo" };
var _hoisted_6 = ["src", "alt"];
var _hoisted_7 = { class: "lc-brand__id" };
var _hoisted_8 = { class: "lc-brand__name" };
var _hoisted_9 = { class: "lc-brand__main" };
var _hoisted_10 = { class: "lc-brand__title" };
var _hoisted_11 = { class: "lc-brand__desc" };
var _hoisted_12 = { class: "lc-pills" };
var _hoisted_13 = { class: "lc-brand__foot" };
var _hoisted_14 = { class: "lc-form" };
var _hoisted_15 = { class: "lc-form__head" };
var _hoisted_16 = { class: "lc-form__brand" };
var _hoisted_17 = { class: "lc-form__logo" };
var _hoisted_18 = ["src", "alt"];
var _hoisted_19 = { class: "lc-form__brandname" };
var _hoisted_20 = { class: "lc-form__tab" };
var _hoisted_21 = { class: "lc-form__title" };
var _hoisted_22 = { class: "lc-form__prompt" };
var _hoisted_23 = { class: "lc-form__body" };
var _hoisted_24 = {
	key: 0,
	class: "lc-icp"
};
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/styles/card.vue
var card_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "card",
	setup(__props) {
		const loginConfig = toRef(getConfig(), "login");
		const brandName = computed(() => translateConfigText(loginConfig.value.title));
		const resolvedLogoUrl = computed(() => {
			const custom = loginConfig.value.logoUrl;
			if (custom && typeof custom === "string" && custom.trim() && !custom.includes("null")) return resolveAssetUrl(custom);
			return logo_default;
		});
		const features = [
			{
				icon: "Lightning",
				text: "极速开发体验"
			},
			{
				icon: "MagicStick",
				text: "现代化 UI 设计"
			},
			{
				icon: "Lock",
				text: "企业级安全保障"
			}
		];
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				_cache[4] || (_cache[4] = createBaseVNode("span", {
					class: "lc-bg lc-bg--1",
					"aria-hidden": "true"
				}, null, -1)),
				_cache[5] || (_cache[5] = createBaseVNode("span", {
					class: "lc-bg lc-bg--2",
					"aria-hidden": "true"
				}, null, -1)),
				_cache[6] || (_cache[6] = createBaseVNode("div", {
					class: "lc-grid",
					"aria-hidden": "true"
				}, null, -1)),
				createBaseVNode("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [createBaseVNode("div", _hoisted_5, [createBaseVNode("img", {
						class: "lc-logo-img",
						src: resolvedLogoUrl.value,
						alt: brandName.value
					}, null, 8, _hoisted_6)]), createBaseVNode("div", _hoisted_7, [createBaseVNode("div", _hoisted_8, toDisplayString(brandName.value), 1), _cache[0] || (_cache[0] = createBaseVNode("div", { class: "lc-brand__sub" }, "MANAGEMENT PLATFORM", -1))])]),
					createBaseVNode("div", _hoisted_9, [
						createBaseVNode("h2", _hoisted_10, [
							createTextVNode(toDisplayString(_ctx.$t("menu.login.welcome")), 1),
							_cache[1] || (_cache[1] = createBaseVNode("br", null, null, -1)),
							createTextVNode(toDisplayString(_ctx.$t("menu.login.platform")), 1)
						]),
						createBaseVNode("p", _hoisted_11, toDisplayString(_ctx.$t("menu.login.description")), 1),
						createBaseVNode("div", _hoisted_12, [(openBlock(), createElementBlock(Fragment, null, renderList(features, (f) => {
							return createBaseVNode("span", {
								class: "lc-pill",
								key: f.text
							}, [createVNode(_component_el_icon, { size: 13 }, {
								default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(dist_exports[f.icon])))]),
								_: 2
							}, 1024), createBaseVNode("span", null, toDisplayString(f.text), 1)]);
						}), 64))])
					]),
					_cache[2] || (_cache[2] = createStaticVNode("<div class=\"lc-mockup\" aria-hidden=\"true\" data-v-0dd1807c><div class=\"lc-mockup__bar\" data-v-0dd1807c><span data-v-0dd1807c></span><span data-v-0dd1807c></span><span data-v-0dd1807c></span></div><div class=\"lc-mockup__body\" data-v-0dd1807c><div class=\"lc-mockup__side\" data-v-0dd1807c></div><div class=\"lc-mockup__content\" data-v-0dd1807c><span class=\"lc-mockup__wide\" data-v-0dd1807c></span><span class=\"lc-mockup__box\" data-v-0dd1807c></span><span class=\"lc-mockup__box\" data-v-0dd1807c></span><span class=\"lc-mockup__box\" data-v-0dd1807c></span></div></div></div>", 1)),
					createBaseVNode("div", _hoisted_13, "© 2026 " + toDisplayString(brandName.value) + " Team", 1)
				]), createBaseVNode("div", _hoisted_14, [createBaseVNode("div", _hoisted_15, [
					createBaseVNode("div", _hoisted_16, [createBaseVNode("div", _hoisted_17, [createBaseVNode("img", {
						class: "lc-logo-img",
						src: resolvedLogoUrl.value,
						alt: brandName.value
					}, null, 8, _hoisted_18)]), createBaseVNode("span", _hoisted_19, toDisplayString(brandName.value), 1)]),
					createBaseVNode("div", _hoisted_20, [_cache[3] || (_cache[3] = createBaseVNode("span", { class: "lc-form__dot" }, null, -1)), createTextVNode(toDisplayString(_ctx.$t("menu.login.account")), 1)]),
					createBaseVNode("h3", _hoisted_21, toDisplayString(_ctx.$t("menu.login.in")), 1),
					createBaseVNode("p", _hoisted_22, toDisplayString(_ctx.$t("menu.login.form.loginName")) + " · " + toDisplayString(_ctx.$t("menu.login.form.password")), 1)
				]), createBaseVNode("div", _hoisted_23, [createVNode(ReLoginForm_default, {
					"show-mobile-brand": false,
					"form-class": "lc-form-inner",
					"show-header": false
				})])])]),
				loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("div", _hoisted_24, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)) : createCommentVNode("", true)
			]);
		};
	}
}), [["__scopeId", "data-v-0dd1807c"]]);
//#endregion
export { card_default as default };
