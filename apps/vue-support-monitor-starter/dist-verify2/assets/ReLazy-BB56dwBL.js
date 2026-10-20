import { b as createElementBlock, mt as openBlock, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReLazy/index.vue
var _sfc_main = {
	name: "ReLazy",
	props: { time: {
		required: false,
		default: 0
	} },
	data() {
		return { initSuccess: false };
	},
	created() {
		this.initSlot();
	},
	methods: { initSlot() {
		let vm = this;
		setTimeout(function() {
			vm.initSuccess = true;
		}, Number(vm.time || 0));
	} }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("span", null, [$data.initSuccess ? renderSlot(_ctx.$slots, "default", {}, void 0, void 0, 0) : createCommentVNode("", true)]);
}
var ReLazy_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(_sfc_main, [["render", _sfc_render]]);
//#endregion
//#region ../../packages/ui/src/components/ReLazy/index.ts
var plugin = { install(app) {
	app.component("ReLazy", ReLazy_default$1);
} };
var ReLazy_default = ReLazy_default$1;
//#endregion
export { ReLazy_default as default, plugin as install };
