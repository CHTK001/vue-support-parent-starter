import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { Ht as setting_default, a as arrow_right_default } from "./dist-DogtK295.js";
import { c as getConfig } from "./src-DzQcKxHP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/SystemConfigWidget.vue?vue&type=script&setup=true&name=SystemConfigWidget&lang.ts
var _hoisted_1 = { class: "scw" };
var _hoisted_2 = {
	key: 0,
	class: "scw__header"
};
var _hoisted_3 = { class: "scw__title" };
var _hoisted_4 = { class: "scw__body" };
var _hoisted_5 = [
	"aria-expanded",
	"aria-label",
	"onClick"
];
var _hoisted_6 = { class: "scw__gt" };
var _hoisted_7 = { class: "scw__gb" };
var _hoisted_8 = { class: "scw__rk" };
var _hoisted_9 = { class: "scw__rv" };
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/SystemConfigWidget.vue
var SystemConfigWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "SystemConfigWidget",
	props: { widget: {} },
	setup(__props) {
		const cfg = getConfig();
		const groups = reactive([
			{
				label: "系统信息",
				open: true,
				data: pick([
					"app",
					"env",
					"system"
				])
			},
			{
				label: "HTTP 请求",
				open: false,
				data: pick([
					"http",
					"url",
					"upload"
				])
			},
			{
				label: "路由与权限",
				open: false,
				data: pick([
					"route",
					"permission",
					"token"
				])
			},
			{
				label: "存储与安全",
				open: false,
				data: pick([
					"storage",
					"security",
					"crypto"
				])
			},
			{
				label: "登录与消息",
				open: false,
				data: pick([
					"login",
					"message",
					"socket"
				])
			},
			{
				label: "其他配置",
				open: false,
				data: pick([
					"other",
					"config",
					"monitor"
				])
			}
		]);
		function toggle(gi) {
			groups[gi].open = !groups[gi].open;
		}
		function isObject(v) {
			return v !== null && typeof v === "object" && !Array.isArray(v);
		}
		function pick(keys) {
			const r = {};
			keys.forEach((k) => {
				const v = cfg[k];
				if (v !== void 0) r[k] = v;
			});
			return r;
		}
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", _hoisted_1, [!__props.widget.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(_component_el_icon, { class: "scw__title-icon" }, {
				default: withCtx(() => [createVNode(unref(setting_default))]),
				_: 1
			}), _cache[0] || (_cache[0] = createBaseVNode("span", null, "系统配置", -1))]), _cache[1] || (_cache[1] = createBaseVNode("span", { class: "scw__badge" }, "仅管理员", -1))])) : createCommentVNode("", true), createBaseVNode("div", _hoisted_4, [(openBlock(true), createElementBlock(Fragment, null, renderList(groups, (group, gi) => {
				return openBlock(), createElementBlock("div", {
					key: gi,
					class: "scw__group"
				}, [createBaseVNode("button", {
					type: "button",
					class: "scw__gh",
					"aria-expanded": group.open,
					"aria-label": `${group.label} 配置分组`,
					onClick: ($event) => toggle(gi)
				}, [createBaseVNode("span", _hoisted_6, toDisplayString(group.label), 1), createVNode(_component_el_icon, { class: normalizeClass(["scw__ga", { "scw__ga--open": group.open }]) }, {
					default: withCtx(() => [createVNode(unref(arrow_right_default))]),
					_: 1
				}, 8, ["class"])], 8, _hoisted_5), withDirectives(createBaseVNode("div", _hoisted_7, [(openBlock(true), createElementBlock(Fragment, null, renderList(group.data, (val, key) => {
					return openBlock(), createElementBlock("div", {
						key,
						class: "scw__r"
					}, [createBaseVNode("span", _hoisted_8, toDisplayString(key), 1), createBaseVNode("span", _hoisted_9, [isObject(val) ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode(toDisplayString(JSON.stringify(val, null, 1)), 1)], 64)) : val === true || val === false ? (openBlock(), createElementBlock("span", {
						key: 1,
						class: normalizeClass(["scw__tag", val ? "scw__tag--on" : "scw__tag--off"])
					}, toDisplayString(val), 3)) : val == null || val === "" ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [createTextVNode("—")], 64)) : (openBlock(), createElementBlock(Fragment, { key: 3 }, [createTextVNode(toDisplayString(val), 1)], 64))])]);
				}), 128))], 512), [[vShow, group.open]])]);
			}), 128))])]);
		};
	}
}), [["__scopeId", "data-v-1614e72a"]]);
//#endregion
export { SystemConfigWidget_default as default };
