import { J as inject, L as getCurrentInstance, On as unref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { i as debugWarn, n as useGetDerivedNamespace } from "./use-namespace-BksmY6RT.js";
import { a as isClient, n as computedEager } from "./dist-DI3cGDuP.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-id/index.mjs
var defaultIdInjection = {
	prefix: Math.floor(Math.random() * 1e4),
	current: 0
};
var ID_INJECTION_KEY = Symbol("elIdInjection");
var useIdInjection = () => {
	return getCurrentInstance() ? inject(ID_INJECTION_KEY, defaultIdInjection) : defaultIdInjection;
};
var useId = (deterministicId) => {
	const idInjection = useIdInjection();
	if (!isClient && idInjection === defaultIdInjection) debugWarn("IdInjection", `Looks like you are using server rendering, you must provide a id provider to ensure the hydration process to be succeed
usage: app.provide(ID_INJECTION_KEY, {
  prefix: number,
  current: number,
})`);
	const namespace = useGetDerivedNamespace();
	return computedEager(() => unref(deterministicId) || `${namespace.value}-id-${idInjection.prefix}-${idInjection.current++}`);
};
//#endregion
export { useIdInjection as n, useId as t };
