import { $n as normalizeClass, b as createElementBlock, k as defineComponent, mt as openBlock } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#endregion
//#region ../../packages/ui/src/components/ReStatusIndicator/ReStatusIndicator.vue
var ReStatusIndicator_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReStatusIndicator",
	inheritAttrs: true,
	__name: "ReStatusIndicator",
	props: {
		type: { default: "primary" },
		pulse: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* ReStatusIndicator —— 状态指示器（圆点 + 脉冲动画）
		*
		* 来源：整合自 scStatusIndicator。
		*  - 颜色映射 Element Plus 状态色（primary / success / warning / danger / info）
		*  - pulse=true 时开启扩散波纹动画（用于「加载中」/「运行中」等动态状态）
		*/
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", { class: normalizeClass(["re-status", [{ "re-status--pulse": __props.pulse }, `re-status--${__props.type}`]]) }, null, 2);
		};
	}
}), [["__scopeId", "data-v-880d09f3"]]);
//#endregion
//#region ../../packages/ui/src/components/ReStatusIndicator/index.ts
var plugin = { install(app) {
	app.component("ReStatusIndicator", ReStatusIndicator_default$1);
} };
var ReStatusIndicator_default = ReStatusIndicator_default$1;
//#endregion
export { plugin as n, ReStatusIndicator_default as t };
