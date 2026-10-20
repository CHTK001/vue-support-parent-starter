import { Ut as watchEffect, b as createElementBlock, et as mergeProps, k as defineComponent, mt as openBlock } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElLoading } from "./loading-U61sfGPr.js";
//#endregion
//#region ../../packages/ui/src/components/ReLoading/theme/default/ReLoading.vue
var ReLoading_default = /* @__PURE__ */ defineComponent({
	name: "ReLoading",
	inheritAttrs: true,
	__name: "ReLoading",
	props: {
		loading: {
			type: Boolean,
			default: false
		},
		text: { default: "加载中" }
	},
	setup(__props) {
		/**
		* ReLoading default 主题 —— 全屏加载遮罩
		*
		* 使用 el-loading 全屏遮罩，v-model / loading prop 控制显隐。
		*/
		const props = __props;
		let instance = null;
		watchEffect(() => {
			if (props.loading) {
				if (!instance) instance = ElLoading.service({
					text: props.text,
					lock: true,
					background: "rgba(0,0,0,0.5)"
				});
			} else if (instance) {
				instance.close();
				instance = null;
			}
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", mergeProps({ class: "re-loading" }, _ctx.$attrs), null, 16);
		};
	}
});
//#endregion
export { ReLoading_default as default };
