import { $n as normalizeClass, D as createVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, wn as toRef, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as translateConfigText } from "./src-BVnZQO9c.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as logo_default, t as resolveAssetUrl } from "./resolveAssetUrl-Cq_PQpvU.js";
import { t as ReLoginForm_default } from "./ReLoginForm-sur-Td5f.js";
//#region ../../packages/theme/src/themes/koi/views/login/styles/bubble.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "login-page login-bubble" };
var _hoisted_2 = {
	class: "bb-orbs",
	"aria-hidden": "true"
};
var _hoisted_3 = {
	class: "bb-bubbles",
	"aria-hidden": "true"
};
var _hoisted_4 = { class: "bb-shell" };
var _hoisted_5 = { class: "bb-brand" };
var _hoisted_6 = { class: "bb-brand-mark" };
var _hoisted_7 = ["src", "alt"];
var _hoisted_8 = { class: "bb-title" };
var _hoisted_9 = { class: "bb-desc" };
var _hoisted_10 = {
	key: 0,
	class: "bb-tags"
};
var _hoisted_11 = { class: "bb-card" };
var _hoisted_12 = {
	key: 0,
	class: "bb-footer"
};
//#endregion
//#region ../../packages/theme/src/themes/koi/views/login/styles/bubble.vue
var bubble_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "bubble",
	setup(__props) {
		/**
		* 气泡简约（bubble）
		*
		* 设计要点：
		*  1. 标题只保留一处 —— 页面自带头部，故 ReLoginForm 传 show-header=false，
		*     避免与内部 .form-header 叠成「平台名 + 账号密码登录」双标题；
		*  2. 气泡由数据驱动（尺寸/速度/透明度/横向漂移各异），并使用负 delay，
		*     首屏即刻有气泡在途，不会出现「空背景 → 慢慢冒泡」的冷场；
		*  3. 卡片改毛玻璃 + 分层投影，配合大光斑形成前后景深。
		*/
		const loginConfig = toRef(getConfig(), "login");
		/** 品牌 Logo：优先 app.yaml 配置，回退内置 logo */
		const resolvedLogoUrl = computed(() => {
			const custom = loginConfig.value.logoUrl;
			if (custom && typeof custom === "string" && custom.trim() && !custom.includes("null")) return resolveAssetUrl(custom);
			return logo_default;
		});
		/** 特色标签：后端配置优先，缺省时用内置三项，避免空标签区 */
		const tags = computed(() => {
			const configured = loginConfig.value.featureTags;
			if (Array.isArray(configured) && configured.length) return configured.map((text, i) => ({
				icon: [
					"DataAnalysis",
					"Brush",
					"Lock"
				][i] ?? "DataAnalysis",
				text
			}));
			return [
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
		});
		/** 大光斑：少而大，负责景深与色彩重心 */
		const orbs = [
			{ id: 1 },
			{ id: 2 },
			{ id: 3 }
		];
		/** 上升气泡：确定性伪随机，保证每次渲染一致（便于视觉回归对比） */
		const bubbles = Array.from({ length: 18 }, (_, i) => ({
			id: i + 1,
			left: i * 41 % 97 + i * 13 % 5,
			size: 10 + i * 13 % 44,
			duration: 17 + i * 7 % 15,
			delay: -(i * 5 % 19),
			opacity: .22 + i * 11 % 40 / 100,
			drift: (i % 2 ? 1 : -1) * (10 + i * 3 % 24)
		}));
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_InfoFilled = resolveComponent("InfoFilled");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				_cache[0] || (_cache[0] = createBaseVNode("div", {
					class: "bb-bg",
					"aria-hidden": "true"
				}, null, -1)),
				createBaseVNode("div", _hoisted_2, [(openBlock(), createElementBlock(Fragment, null, renderList(orbs, (o) => {
					return createBaseVNode("span", {
						key: o.id,
						class: normalizeClass(["bb-orb", `bb-orb--${o.id}`])
					}, null, 2);
				}), 64))]),
				createBaseVNode("div", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(bubbles), (b) => {
					return openBlock(), createElementBlock("span", {
						key: b.id,
						class: "bb-bubble",
						style: normalizeStyle({
							left: `${b.left}%`,
							width: `${b.size}px`,
							height: `${b.size}px`,
							opacity: b.opacity,
							animationDuration: `${b.duration}s`,
							animationDelay: `${b.delay}s`,
							"--bb-drift": `${b.drift}px`
						})
					}, null, 4);
				}), 128))]),
				createBaseVNode("main", _hoisted_4, [
					createBaseVNode("header", _hoisted_5, [
						createBaseVNode("div", _hoisted_6, [createBaseVNode("img", {
							class: "bb-logo",
							src: resolvedLogoUrl.value,
							alt: loginConfig.value.brandName
						}, null, 8, _hoisted_7)]),
						createBaseVNode("h1", _hoisted_8, toDisplayString(unref(translateConfigText)(loginConfig.value.title)), 1),
						createBaseVNode("p", _hoisted_9, toDisplayString(unref(translateConfigText)(loginConfig.value.description)), 1),
						tags.value.length ? (openBlock(), createElementBlock("ul", _hoisted_10, [(openBlock(true), createElementBlock(Fragment, null, renderList(tags.value, (tag) => {
							return openBlock(), createElementBlock("li", {
								key: tag.text,
								class: "bb-tag"
							}, [createVNode(_component_el_icon, { size: 13 }, {
								default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(tag.icon)))]),
								_: 2
							}, 1024), createBaseVNode("span", null, toDisplayString(unref(translateConfigText)(tag.text)), 1)]);
						}), 128))])) : createCommentVNode("", true)
					]),
					createBaseVNode("section", _hoisted_11, [createVNode(ReLoginForm_default, {
						"show-mobile-brand": false,
						"show-header": false,
						"form-class": "bb-form"
					})]),
					loginConfig.value.beiAnHao ? (openBlock(), createElementBlock("footer", _hoisted_12, [createVNode(_component_el_icon, { size: 12 }, {
						default: withCtx(() => [createVNode(_component_InfoFilled)]),
						_: 1
					}), createBaseVNode("span", null, toDisplayString(_ctx.$t("menu.login.beiAnHao")) + "：" + toDisplayString(loginConfig.value.beiAnHao), 1)])) : createCommentVNode("", true)
				])
			]);
		};
	}
}), [["__scopeId", "data-v-878c4d11"]]);
//#endregion
export { bubble_default as default };
