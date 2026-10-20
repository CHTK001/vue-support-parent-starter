import { Bn as isFunction } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { g as isWindow } from "./use-namespace-BksmY6RT.js";
import { a as isClient } from "./dist-DI3cGDuP.js";
import { o as isShadowRoot } from "./aria-DKP9Ei-1.js";
import { r as getStyle } from "./style-D30oR_2q.js";
import { n as rAF, t as cAF } from "./raf-Ck-OXP6t.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/easings.mjs
function easeInOutCubic(t, b, c, d) {
	const cc = c - b;
	t /= d / 2;
	if (t < 1) return cc / 2 * t * t * t + b;
	return cc / 2 * ((t -= 2) * t * t + 2) + b;
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/dom/scroll.mjs
var isScroll = (el, isVertical) => {
	if (!isClient) return false;
	const key = {
		undefined: "overflow",
		true: "overflow-y",
		false: "overflow-x"
	}[String(isVertical)];
	const overflow = getStyle(el, key);
	return [
		"scroll",
		"auto",
		"overlay"
	].some((s) => overflow.includes(s));
};
var getScrollContainer = (el, isVertical) => {
	if (!isClient) return;
	let parent = el;
	while (parent) {
		if ([
			window,
			document,
			document.documentElement
		].includes(parent)) return window;
		if (isScroll(parent, isVertical)) return parent;
		if (isShadowRoot(parent)) parent = parent.host;
		else parent = parent.parentNode;
	}
	return parent;
};
var scrollBarWidth;
var getScrollBarWidth = (namespace) => {
	if (!isClient) return 0;
	if (scrollBarWidth !== void 0) return scrollBarWidth;
	const outer = document.createElement("div");
	outer.className = `${namespace}-scrollbar__wrap`;
	outer.style.visibility = "hidden";
	outer.style.width = "100px";
	outer.style.position = "absolute";
	outer.style.top = "-9999px";
	document.body.appendChild(outer);
	const widthNoScroll = outer.offsetWidth;
	outer.style.overflow = "scroll";
	const inner = document.createElement("div");
	inner.style.width = "100%";
	outer.appendChild(inner);
	const widthWithScroll = inner.offsetWidth;
	outer.parentNode?.removeChild(outer);
	scrollBarWidth = widthNoScroll - widthWithScroll;
	return scrollBarWidth;
};
/**
* Scroll with in the container element, positioning the **selected** element at the top
* of the container
*/
function scrollIntoView(container, selected) {
	if (!isClient) return;
	if (!selected) {
		container.scrollTop = 0;
		return;
	}
	const offsetParents = [];
	let pointer = selected.offsetParent;
	while (pointer !== null && container !== pointer && container.contains(pointer)) {
		offsetParents.push(pointer);
		pointer = pointer.offsetParent;
	}
	const top = selected.offsetTop + offsetParents.reduce((prev, curr) => prev + curr.offsetTop, 0);
	const bottom = top + selected.offsetHeight;
	const viewRectTop = container.scrollTop;
	const viewRectBottom = viewRectTop + container.clientHeight;
	if (top < viewRectTop) container.scrollTop = top;
	else if (bottom > viewRectBottom) container.scrollTop = bottom - container.clientHeight;
}
function animateScrollTo(container, from, to, duration, callback) {
	const startTime = Date.now();
	let handle;
	const scroll = () => {
		const time = Date.now() - startTime;
		const nextScrollTop = easeInOutCubic(time > duration ? duration : time, from, to, duration);
		if (isWindow(container)) container.scrollTo(window.pageXOffset, nextScrollTop);
		else container.scrollTop = nextScrollTop;
		if (time < duration) handle = rAF(scroll);
		else if (isFunction(callback)) callback();
	};
	scroll();
	return () => {
		handle && cAF(handle);
	};
}
var getScrollElement = (target, container) => {
	if (isWindow(container)) return target.ownerDocument.documentElement;
	return container;
};
var getScrollTop = (container) => {
	if (isWindow(container)) return window.scrollY;
	return container.scrollTop;
};
//#endregion
export { getScrollTop as a, getScrollElement as i, getScrollBarWidth as n, scrollIntoView as o, getScrollContainer as r, animateScrollTo as t };
