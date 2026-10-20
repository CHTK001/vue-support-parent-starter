import { J as inject, L as getCurrentInstance, On as unref, g as computed, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { f as isNumber, i as debugWarn } from "./use-namespace-BksmY6RT.js";
import { a as isClient } from "./dist-DI3cGDuP.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-z-index/index.mjs
var initial = { current: 0 };
var zIndex = ref(0);
var defaultInitialZIndex = 2e3;
var ZINDEX_INJECTION_KEY = Symbol("elZIndexContextKey");
var zIndexContextKey = Symbol("zIndexContextKey");
var useZIndex = (zIndexOverrides) => {
	const increasingInjection = getCurrentInstance() ? inject(ZINDEX_INJECTION_KEY, initial) : initial;
	const zIndexInjection = zIndexOverrides || (getCurrentInstance() ? inject(zIndexContextKey, void 0) : void 0);
	const initialZIndex = computed(() => {
		const zIndexFromInjection = unref(zIndexInjection);
		return isNumber(zIndexFromInjection) ? zIndexFromInjection : defaultInitialZIndex;
	});
	const currentZIndex = computed(() => initialZIndex.value + zIndex.value);
	const nextZIndex = () => {
		increasingInjection.current++;
		zIndex.value = increasingInjection.current;
		return currentZIndex.value;
	};
	if (!isClient && !inject(ZINDEX_INJECTION_KEY)) debugWarn("ZIndexInjection", `Looks like you are using server rendering, you must provide a z-index provider to ensure the hydration process to be succeed
usage: app.provide(ZINDEX_INJECTION_KEY, { current: 0 })`);
	return {
		initialZIndex,
		currentZIndex,
		nextZIndex
	};
};
//#endregion
export { useZIndex as n, zIndexContextKey as r, defaultInitialZIndex as t };
