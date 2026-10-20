import { D as createVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, et as mergeProps, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as Transition } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReLoading/theme/koi/ReLoading.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "koi-loading-box"
};
var _hoisted_2 = { class: "koi-loading" };
//#endregion
//#region ../../packages/ui/src/components/ReLoading/theme/koi/ReLoading.vue
var ReLoading_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReLoading",
	inheritAttrs: true,
	__name: "ReLoading",
	props: { loading: {
		type: Boolean,
		default: false
	} },
	setup(__props) {
		/**
		* ReLoading koi 主题 —— 全屏加载遮罩（KoiLoading 移植）
		*
		* 独立动画结构（gooey 流体小球），不依赖 element-plus loading。
		*/
		const props = __props;
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", mergeProps({ class: "re-loading" }, _ctx.$attrs), [createVNode(Transition, { name: "el-fade-in-linear" }, {
				default: withCtx(() => [props.loading ? (openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [(openBlock(), createElementBlock(Fragment, null, renderList(7, (i) => {
					return createBaseVNode("span", {
						style: normalizeStyle({ "--i": i }),
						key: i
					}, null, 4);
				}), 64))]), _cache[0] || (_cache[0] = createBaseVNode("svg", null, [createBaseVNode("filter", { id: "koi-gooey" }, [createBaseVNode("feGaussianBlur", {
					in: "SourceGraphic",
					stdDeviation: "10"
				}), createBaseVNode("feColorMatrix", { values: "1 0 0 0 0 \n                      0 1 0 0 0\n                      0 0 1 0 0 \n                      0 0 0 20 -10" })])], -1))])) : createCommentVNode("", true)]),
				_: 1
			})], 16);
		};
	}
}), [["__scopeId", "data-v-237393b7"]]);
//#endregion
export { ReLoading_default as default };
