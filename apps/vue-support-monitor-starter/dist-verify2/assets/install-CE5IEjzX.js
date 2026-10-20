import { An as NOOP, Pn as hasOwn, Rn as isArray } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as isPlainObject } from "./isPlainObject-CmtvaEIG.js";
import { v as fromPairs } from "./use-namespace-BksmY6RT.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/vue/install.mjs
var withPropsDefaultsSetter = (target) => {
	const _p = target.props;
	const props = isArray(_p) ? fromPairs(_p.map((key) => [key, {}])) : _p;
	target.setPropsDefaults = (defaults) => {
		if (!props) return;
		for (const [key, value] of Object.entries(defaults)) {
			const prop = props[key];
			if (!hasOwn(props, key)) continue;
			if (isPlainObject(prop)) {
				props[key] = {
					...prop,
					default: value
				};
				continue;
			}
			props[key] = {
				type: prop,
				default: value
			};
		}
		target.props = props;
	};
};
var withInstall = (main, extra) => {
	main.install = (app) => {
		for (const comp of [main, ...Object.values(extra ?? {})]) app.component(comp.name, comp);
	};
	if (extra) for (const [key, comp] of Object.entries(extra)) main[key] = comp;
	withPropsDefaultsSetter(main);
	return main;
};
var withInstallFunction = (fn, name) => {
	fn.install = (app) => {
		fn._context = app._context;
		app.config.globalProperties[name] = fn;
	};
	return fn;
};
var withInstallDirective = (directive, name) => {
	directive.install = (app) => {
		app.directive(name, directive);
	};
	return directive;
};
var withNoopInstall = (component) => {
	component.install = NOOP;
	withPropsDefaultsSetter(component);
	return component;
};
//#endregion
export { withNoopInstall as i, withInstallDirective as n, withInstallFunction as r, withInstall as t };
