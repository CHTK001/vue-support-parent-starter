import { On as unref, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { c as definePropType, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/icon/src/icon.mjs
/**
* @deprecated Removed after 3.0.0, Use `IconProps` instead.
*/
var iconProps = buildProps({
	/**
	* @description SVG icon size, size x size
	*/
	size: { type: definePropType([Number, String]) },
	/**
	* @description SVG tag's fill attribute
	*/
	color: { type: String }
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/icon/index.mjs
var ElIcon = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElIcon",
	inheritAttrs: false,
	__name: "icon",
	props: iconProps,
	setup(__props) {
		const props = __props;
		const ns = useNamespace("icon");
		const style = computed(() => {
			const { size, color } = props;
			const fontSize = addUnit(size);
			if (!fontSize && !color) return {};
			return {
				fontSize,
				"--color": color
			};
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("i", mergeProps({
				class: unref(ns).b(),
				style: style.value
			}, _ctx.$attrs), [renderSlot(_ctx.$slots, "default")], 16);
		};
	}
}));
//#endregion
export { ElIcon as t };
