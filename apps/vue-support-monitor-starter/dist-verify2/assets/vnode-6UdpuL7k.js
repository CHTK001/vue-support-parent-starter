import { Mn as capitalize$1, Pn as hasOwn, Rn as isArray, Z as isVNode, jn as camelize, o as Fragment, r as Comment } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { i as debugWarn } from "./use-namespace-BksmY6RT.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/strings.mjs
/**
* fork from {@link https://github.com/sindresorhus/escape-string-regexp}
*/
var escapeStringRegexp = (string = "") => string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
var capitalize = (str) => capitalize$1(str);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/vue/vnode.mjs
var SCOPE = "utils/vue/vnode";
function isFragment(node) {
	return isVNode(node) && node.type === Fragment;
}
function isComment(node) {
	return isVNode(node) && node.type === Comment;
}
function isValidElementNode(node) {
	return isVNode(node) && !isFragment(node) && !isComment(node);
}
var getNormalizedProps = (node) => {
	if (!isVNode(node)) {
		debugWarn(SCOPE, "[getNormalizedProps] must be a VNode");
		return {};
	}
	const raw = node.props || {};
	const type = (isVNode(node.type) ? node.type.props : void 0) || {};
	const props = {};
	Object.keys(type).forEach((key) => {
		if (hasOwn(type[key], "default")) props[key] = type[key].default;
	});
	Object.keys(raw).forEach((key) => {
		props[camelize(key)] = raw[key];
	});
	return props;
};
var flattedChildren = (children) => {
	const vNodes = isArray(children) ? children : [children];
	const result = [];
	vNodes.forEach((child) => {
		if (isArray(child)) result.push(...flattedChildren(child));
		else if (isVNode(child) && child.component?.subTree) result.push(child, ...flattedChildren(child.component.subTree));
		else if (isVNode(child) && isArray(child.children)) result.push(...flattedChildren(child.children));
		else if (isVNode(child) && child.shapeFlag === 2) result.push(...flattedChildren(child.type()));
		else result.push(child);
	});
	return result;
};
//#endregion
export { isValidElementNode as a, isFragment as i, getNormalizedProps as n, capitalize as o, isComment as r, escapeStringRegexp as s, flattedChildren as t };
