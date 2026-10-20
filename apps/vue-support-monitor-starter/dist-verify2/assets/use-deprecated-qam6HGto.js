import { Ht as watch, On as unref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { i as debugWarn } from "./use-namespace-BksmY6RT.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-deprecated/index.mjs
var useDeprecated = ({ from, replacement, scope, version, ref, type = "API" }, condition) => {
	watch(() => unref(condition), (val) => {
		if (val) debugWarn(scope, `[${type}] ${from} is about to be deprecated in version ${version}, please use ${replacement} instead.
For more detail, please visit: ${ref}
`);
	}, { immediate: true });
};
//#endregion
export { useDeprecated as t };
