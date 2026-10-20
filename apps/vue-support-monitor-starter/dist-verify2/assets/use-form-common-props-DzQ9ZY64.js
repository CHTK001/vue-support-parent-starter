import { J as inject, L as getCurrentInstance, On as unref, g as computed, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { n as useGlobalSize } from "./use-size-BpzpcbJM.js";
import { n as formItemContextKey, t as formContextKey } from "./constants-ntbKDiND.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-prop/index.mjs
var useProp = (name) => {
	const vm = getCurrentInstance();
	return computed(() => (vm?.proxy?.$props)?.[name]);
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/form/src/hooks/use-form-common-props.mjs
var useFormSize = (fallback, ignore = {}) => {
	const emptyRef = ref(void 0);
	const size = ignore.prop ? emptyRef : useProp("size");
	const globalConfig = ignore.global ? emptyRef : useGlobalSize();
	const form = ignore.form ? { size: void 0 } : inject(formContextKey, void 0);
	const formItem = ignore.formItem ? { size: void 0 } : inject(formItemContextKey, void 0);
	return computed(() => size.value || unref(fallback) || formItem?.size || form?.size || globalConfig.value || "");
};
var useFormDisabled = (fallback) => {
	const disabled = useProp("disabled");
	const form = inject(formContextKey, void 0);
	return computed(() => {
		return disabled.value ?? unref(fallback) ?? form?.disabled ?? false;
	});
};
//#endregion
export { useFormSize as n, useFormDisabled as t };
