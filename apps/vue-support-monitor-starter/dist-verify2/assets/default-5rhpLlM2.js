import { $n as normalizeClass, D as createVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wn as toRef, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as translateConfigText } from "./src-BVnZQO9c.js";
import { R as dist_exports } from "./dist-DogtK295.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as logo_default, t as resolveAssetUrl } from "./resolveAssetUrl-Cq_PQpvU.js";
import { t as ReLoginForm_default } from "./ReLoginForm-sur-Td5f.js";
//#region ../../packages/theme/src/themes/koi/views/login/styles/default.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "login-background w-100% h-100%" };
var _hoisted_2 = { class: "content-layer" };
var _hoisted_3 = {
	class: "brand-badge flex flex-items-center gap-10px animate-fade-in-up",
	style: { "animation-delay": "0s" }
};
var _hoisted_4 = { class: "brand-logo-wrap" };
var _hoisted_5 = ["src", "alt"];
var _hoisted_6 = { class: "brand-text" };
var _hoisted_7 = {
	class: "hero-card animate-fade-in-up",
	style: { "animation-delay": "0.15s" }
};
var _hoisted_8 = { class: "hero-image-wrap" };
var _hoisted_9 = {
	class: "hero-title animate-fade-in-up",
	style: { "animation-delay": "0.3s" }
};
var _hoisted_10 = {
	class: "hero-desc animate-fade-in-up",
	style: { "animation-delay": "0.6s" }
};
var _hoisted_11 = {
	class: "hero-tags flex flex-justify-center gap-8px flex-wrap animate-fade-in-up",
	style: { "animation-delay": "0.75s" }
};
var _hoisted_12 = { class: "hero-tag-text" };
var _hoisted_13 = {
	class: "hero-footer animate-fade-in-up",
	style: { "animation-delay": "0.9s" }
};
var _hoisted_14 = { key: 0 };
var _hoisted_15 = {
	class: "login-form-panel animate-fade-in-right",
	style: { "align-items": "stretch" }
};
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/styles/default.vue
var default_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "default",
	setup(__props) {
		const loginConfig = toRef(getConfig(), "login");
		computed(() => {
			const custom = loginConfig.value.logoUrl;
			if (custom && typeof custom === "string" && custom.trim() && !custom.includes("null")) return resolveAssetUrl(custom);
			return logo_default;
		});
		const resolvedImageUrl = computed(() => loginConfig.value.imageUrl ? resolveAssetUrl(loginConfig.value.imageUrl) : "");
		/** 内置默认标签，不依赖后端配置避免异常空标签 */
		const defaultTags = [
			{
				icon: "DataAnalysis",
				text: "高效管理"
			},
			{
				icon: "Brush",
				text: "现代设计"
			},
			{
				icon: "Lock",
				text: "安全可靠"
			}
		];
		/**
		* 入场动画兜底：正常环境动画在 0.9s 内播完并保持可见，本兜底无感知；
		* 若动画时间轴被冻结（后台/自动化/异常），最迟 1.3s 强制内容可见，避免登录页永久空白。
		*/
		const animFallback = ref(false);
		onMounted(() => {
			setTimeout(() => {
				animFallback.value = true;
			}, 1300);
		});
		return (_ctx, _cache) => {
			const _component_el_image = resolveComponent("el-image");
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_col = resolveComponent("el-col");
			const _component_el_row = resolveComponent("el-row");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["login-page w-screen h-screen overflow-hidden", { "anim-ready-fallback": animFallback.value }]) }, [createVNode(_component_el_row, { class: "h-100%" }, {
				default: withCtx(() => [createVNode(_component_el_col, {
					lg: 16,
					md: 12,
					sm: 15,
					xs: 0,
					class: "flex flex-items-center flex-justify-center"
				}, {
					default: withCtx(() => [createBaseVNode("div", _hoisted_1, [
						_cache[0] || (_cache[0] = createBaseVNode("span", { class: "orb orb--1" }, null, -1)),
						_cache[1] || (_cache[1] = createBaseVNode("span", { class: "orb orb--2" }, null, -1)),
						_cache[2] || (_cache[2] = createBaseVNode("span", { class: "orb orb--3" }, null, -1)),
						_cache[3] || (_cache[3] = createBaseVNode("span", { class: "orb orb--4" }, null, -1)),
						_cache[4] || (_cache[4] = createBaseVNode("div", {
							class: "bg-grid",
							"aria-hidden": "true"
						}, null, -1)),
						_cache[5] || (_cache[5] = createBaseVNode("div", {
							class: "bg-grain",
							"aria-hidden": "true"
						}, null, -1)),
						_cache[6] || (_cache[6] = createBaseVNode("div", {
							class: "deco-line deco-line--1",
							"aria-hidden": "true"
						}, null, -1)),
						_cache[7] || (_cache[7] = createBaseVNode("div", {
							class: "deco-line deco-line--2",
							"aria-hidden": "true"
						}, null, -1)),
						createBaseVNode("div", _hoisted_2, [
							createBaseVNode("div", _hoisted_3, [createBaseVNode("div", _hoisted_4, [createBaseVNode("img", {
								class: "brand-logo",
								src: unref(logo_default),
								alt: loginConfig.value.brandName
							}, null, 8, _hoisted_5)]), createBaseVNode("span", _hoisted_6, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1)]),
							createBaseVNode("div", _hoisted_7, [createBaseVNode("div", _hoisted_8, [createVNode(_component_el_image, {
								class: "hero-image",
								src: resolvedImageUrl.value,
								alt: loginConfig.value.brandName
							}, null, 8, ["src", "alt"])])]),
							createBaseVNode("h2", _hoisted_9, toDisplayString(unref(translateConfigText)(loginConfig.value.welcome)), 1),
							createBaseVNode("p", _hoisted_10, toDisplayString(unref(translateConfigText)(loginConfig.value.description)), 1),
							createBaseVNode("div", _hoisted_11, [(openBlock(), createElementBlock(Fragment, null, renderList(defaultTags, (tag) => {
								return createBaseVNode("span", {
									class: "hero-tag",
									key: tag.text
								}, [createVNode(_component_el_icon, {
									size: 13,
									class: "hero-tag-icon"
								}, {
									default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(dist_exports[tag.icon])))]),
									_: 2
								}, 1024), createBaseVNode("span", _hoisted_12, toDisplayString(unref(translateConfigText)(tag.text)), 1)]);
							}), 64))])
						]),
						createBaseVNode("div", _hoisted_13, [createBaseVNode("span", null, "© 2026 " + toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1), loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("span", _hoisted_14, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)) : createCommentVNode("", true)])
					])]),
					_: 1
				}), createVNode(_component_el_col, {
					lg: 8,
					md: 12,
					sm: 9,
					xs: 24,
					class: "login-form-side flex flex-items-center flex-justify-center flex-col"
				}, {
					default: withCtx(() => [createBaseVNode("div", _hoisted_15, [createVNode(ReLoginForm_default, { "show-mobile-brand": "" })])]),
					_: 1
				})]),
				_: 1
			})], 2);
		};
	}
}), [["__scopeId", "data-v-a4ba0ef5"]]);
//#endregion
export { default_default as default };
