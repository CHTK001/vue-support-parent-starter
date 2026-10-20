import { Hn as isObject, Jn as isString, jn as camelize } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { f as isNumber, i as debugWarn, m as isStringNumber } from "./use-namespace-BksmY6RT.js";
import { t as entriesOf } from "./objects-BYkkqs6t.js";
import { a as isClient } from "./dist-DI3cGDuP.js";
import { o as isShadowRoot } from "./aria-DKP9Ei-1.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/dom/style.mjs
var SCOPE = "utils/dom/style";
var classNameToArray = (cls = "") => cls.split(" ").filter((item) => !!item.trim());
var hasClass = (el, cls) => {
	if (!el || !cls) return false;
	if (cls.includes(" ")) throw new Error("className should not contain space.");
	return el.classList.contains(cls);
};
var addClass = (el, cls) => {
	if (!el || !cls.trim()) return;
	el.classList.add(...classNameToArray(cls));
};
var removeClass = (el, cls) => {
	if (!el || !cls.trim()) return;
	el.classList.remove(...classNameToArray(cls));
};
var getStyle = (element, styleName) => {
	if (!isClient || !element || !styleName || isShadowRoot(element)) return "";
	let key = camelize(styleName);
	if (key === "float") key = "cssFloat";
	try {
		const style = element.style[key];
		if (style) return style;
		const computed = document.defaultView?.getComputedStyle(element, "");
		return computed ? computed[key] : "";
	} catch {
		return element.style[key];
	}
};
var setStyle = (element, styleName, value) => {
	if (!element || !styleName) return;
	if (isObject(styleName)) entriesOf(styleName).forEach(([prop, value]) => setStyle(element, prop, value));
	else {
		const key = camelize(styleName);
		element.style[key] = value;
	}
};
function addUnit(value, defaultUnit = "px") {
	if (!value && value !== 0) return "";
	if (isNumber(value) || isStringNumber(value)) return `${value}${defaultUnit}`;
	else if (isString(value)) return value;
	debugWarn(SCOPE, "binding value must be a string or number");
}
//#endregion
export { removeClass as a, hasClass as i, addUnit as n, setStyle as o, getStyle as r, addClass as t };
