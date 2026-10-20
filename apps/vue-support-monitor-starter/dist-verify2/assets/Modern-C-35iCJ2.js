import { Ft as useModel, et as mergeProps, k as defineComponent, mt as openBlock, v as createBlock } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
import { t as ReSelect_default } from "./ReSelect-BrUGYrlz.js";
//#endregion
//#region ../../packages/ui/src/components/ReSelect/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReSelectModern",
	inheritAttrs: true,
	__name: "Modern",
	props: {
		"modelValue": { default: "" },
		"modelModifiers": {}
	},
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* ReSelect Modern 布局
		*
		* 基于 ReSelect default 布局的轻量包装，仅追加现代化扁平样式类，
		* 保持 el-select 的完整能力（远程 / 多选 / 可搜索 / 可清空等）。
		*/
		const model = useModel(__props, "modelValue");
		return (_ctx, _cache) => {
			return openBlock(), createBlock(ReSelect_default, mergeProps({
				layout: "default",
				modelValue: model.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => model.value = $event)
			}, _ctx.$attrs, { class: "re-select--modern" }), null, 16, ["modelValue"]);
		};
	}
}), [["__scopeId", "data-v-139ad149"]]);
//#endregion
export { Modern_default as default };
