import { J as inject, L as getCurrentInstance, On as unref, g as computed, gt as provide, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { n as useLocale, t as localeContextKey } from "./use-locale-MdBtu2ja.js";
import { t as SIZE_INJECTION_KEY } from "./use-size-BpzpcbJM.js";
import { _ as isNil, i as debugWarn, r as useNamespace, t as namespaceContextKey } from "./use-namespace-BksmY6RT.js";
import { r as keysOf } from "./objects-BYkkqs6t.js";
import { n as useZIndex, r as zIndexContextKey, t as defaultInitialZIndex } from "./use-z-index-Q40Vppe1.js";
import { t as emptyValuesContextKey } from "./use-empty-values-B_20a6o3.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/config-provider/src/constants.mjs
var configProviderContextKey = Symbol();
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/config-provider/src/hooks/use-global-config.mjs
var globalConfig = ref();
function useGlobalConfig(key, defaultValue = void 0) {
	const config = getCurrentInstance() ? inject(configProviderContextKey, globalConfig) : globalConfig;
	if (key) return computed(() => config.value?.[key] ?? defaultValue);
	else return config;
}
function useGlobalComponentSettings(block, sizeFallback) {
	const config = useGlobalConfig();
	const ns = useNamespace(block, computed(() => config.value?.namespace || "el"));
	const locale = useLocale(computed(() => config.value?.locale));
	const zIndex = useZIndex(computed(() => {
		const zIndex = config.value?.zIndex;
		return isNil(zIndex) || Number.isNaN(zIndex) ? defaultInitialZIndex : zIndex;
	}));
	const size = computed(() => unref(sizeFallback) || config.value?.size || "");
	provideGlobalConfig(computed(() => unref(config) || {}));
	return {
		ns,
		locale,
		zIndex,
		size
	};
}
var provideGlobalConfig = (config, app, global = false) => {
	const inSetup = !!getCurrentInstance();
	const oldConfig = inSetup ? useGlobalConfig() : void 0;
	const provideFn = app?.provide ?? (inSetup ? provide : void 0);
	if (!provideFn) {
		debugWarn("provideGlobalConfig", "provideGlobalConfig() can only be used inside setup().");
		return;
	}
	const context = computed(() => {
		const cfg = unref(config);
		if (!oldConfig?.value) return cfg;
		return mergeConfig(oldConfig.value, cfg);
	});
	provideFn(configProviderContextKey, context);
	provideFn(localeContextKey, computed(() => context.value.locale));
	provideFn(namespaceContextKey, computed(() => context.value.namespace));
	provideFn(zIndexContextKey, computed(() => context.value.zIndex));
	provideFn(SIZE_INJECTION_KEY, { size: computed(() => context.value.size || "") });
	provideFn(emptyValuesContextKey, computed(() => ({
		emptyValues: context.value.emptyValues,
		valueOnClear: context.value.valueOnClear
	})));
	if (global || !globalConfig.value) globalConfig.value = context.value;
	return context;
};
var mergeConfig = (a, b) => {
	const keys = [.../* @__PURE__ */ new Set([...keysOf(a), ...keysOf(b)])];
	const obj = {};
	for (const key of keys) obj[key] = b[key] !== void 0 ? b[key] : a[key];
	return obj;
};
//#endregion
export { useGlobalComponentSettings as n, useGlobalConfig as r, provideGlobalConfig as t };
