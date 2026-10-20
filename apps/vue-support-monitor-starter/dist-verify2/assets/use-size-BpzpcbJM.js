import { J as inject, On as unref, g as computed } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { o as buildProp } from "./use-namespace-BksmY6RT.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/constants/size.mjs
var componentSizes = [
	"",
	"default",
	"small",
	"large"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-size/index.mjs
var useSizeProp = buildProp({
	type: String,
	values: componentSizes,
	required: false
});
var SIZE_INJECTION_KEY = Symbol("size");
var useGlobalSize = () => {
	const injectedSize = inject(SIZE_INJECTION_KEY, {});
	return computed(() => {
		return unref(injectedSize.size) || "";
	});
};
//#endregion
export { componentSizes as i, useGlobalSize as n, useSizeProp as r, SIZE_INJECTION_KEY as t };
