import { o as __toESM, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
import { $n as toRefs, At as onBeforeMount, C as vShow, Cn as withDirectives, Dt as mergeProps, Ft as onMounted, G as createBlock, Jt as renderSlot, K as createCommentVNode, Kn as ref, M as Fragment, Nn as getCurrentScope, Ot as nextTick, Qn as toRef, U as computed, Ut as provide, Vn as onScopeDispose, Vt as openBlock, Wn as reactive, Yn as shallowRef, _n as watchEffect, _r as normalizeStyle, et as createVNode, gn as watch, hr as normalizeClass, jt as onBeforeUnmount, nr as unref, nt as defineComponent, q as createElementBlock, qt as renderList, xn as withCtx, xt as inject } from "./vue.runtime.esm-bundler-BlWT4PH_.js";
//#region ../../node_modules/.pnpm/@vexip-ui+utils@2.16.4/node_modules/@vexip-ui/utils/dist/index.mjs
var y$2 = typeof window < "u";
var Ot;
y$2 && (Ot = window == null ? void 0 : window.navigator) != null && Ot.userAgent && /iP(ad|hone|od)/.test(window.navigator.userAgent);
function ie$1(t) {
	return t == null;
}
function it$1() {}
var F$1 = `(?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?)`;
var le$1 = `[\\s|\\(]+(${F$1})[,|\\s]+(${F$1})[,|\\s]+(${F$1})\\s*\\)?`;
var U = `[\\s|\\(]+(${F$1})[,|\\s]+(${F$1})[,|\\s]+(${F$1})[,|\\s]+(${F$1})\\s*\\)?`;
new RegExp(`rgb${le$1}`);
new RegExp(`rgba${U}`);
new RegExp(`hsl${U}`);
new RegExp(`hsla${U}`);
new RegExp(`hsv${U}`);
new RegExp(`hsva${U}`);
var W = Object.freeze({
	aliceblue: "f0f8ff",
	antiquewhite: "faebd7",
	aqua: "0ff",
	aquamarine: "7fffd4",
	azure: "f0ffff",
	beige: "f5f5dc",
	bisque: "ffe4c4",
	black: "000",
	blanchedalmond: "ffebcd",
	blue: "00f",
	blueviolet: "8a2be2",
	brown: "a52a2a",
	burlywood: "deb887",
	burntsienna: "ea7e5d",
	cadetblue: "5f9ea0",
	chartreuse: "7fff00",
	chocolate: "d2691e",
	coral: "ff7f50",
	cornflowerblue: "6495ed",
	cornsilk: "fff8dc",
	crimson: "dc143c",
	cyan: "0ff",
	darkblue: "00008b",
	darkcyan: "008b8b",
	darkgoldenrod: "b8860b",
	darkgray: "a9a9a9",
	darkgreen: "006400",
	darkgrey: "a9a9a9",
	darkkhaki: "bdb76b",
	darkmagenta: "8b008b",
	darkolivegreen: "556b2f",
	darkorange: "ff8c00",
	darkorchid: "9932cc",
	darkred: "8b0000",
	darksalmon: "e9967a",
	darkseagreen: "8fbc8f",
	darkslateblue: "483d8b",
	darkslategray: "2f4f4f",
	darkslategrey: "2f4f4f",
	darkturquoise: "00ced1",
	darkviolet: "9400d3",
	deeppink: "ff1493",
	deepskyblue: "00bfff",
	dimgray: "696969",
	dimgrey: "696969",
	dodgerblue: "1e90ff",
	firebrick: "b22222",
	floralwhite: "fffaf0",
	forestgreen: "228b22",
	fuchsia: "f0f",
	gainsboro: "dcdcdc",
	ghostwhite: "f8f8ff",
	gold: "ffd700",
	goldenrod: "daa520",
	gray: "808080",
	green: "008000",
	greenyellow: "adff2f",
	grey: "808080",
	honeydew: "f0fff0",
	hotpink: "ff69b4",
	indianred: "cd5c5c",
	indigo: "4b0082",
	ivory: "fffff0",
	khaki: "f0e68c",
	lavender: "e6e6fa",
	lavenderblush: "fff0f5",
	lawngreen: "7cfc00",
	lemonchiffon: "fffacd",
	lightblue: "add8e6",
	lightcoral: "f08080",
	lightcyan: "e0ffff",
	lightgoldenrodyellow: "fafad2",
	lightgray: "d3d3d3",
	lightgreen: "90ee90",
	lightgrey: "d3d3d3",
	lightpink: "ffb6c1",
	lightsalmon: "ffa07a",
	lightseagreen: "20b2aa",
	lightskyblue: "87cefa",
	lightslategray: "789",
	lightslategrey: "789",
	lightsteelblue: "b0c4de",
	lightyellow: "ffffe0",
	lime: "0f0",
	limegreen: "32cd32",
	linen: "faf0e6",
	magenta: "f0f",
	maroon: "800000",
	mediumaquamarine: "66cdaa",
	mediumblue: "0000cd",
	mediumorchid: "ba55d3",
	mediumpurple: "9370db",
	mediumseagreen: "3cb371",
	mediumslateblue: "7b68ee",
	mediumspringgreen: "00fa9a",
	mediumturquoise: "48d1cc",
	mediumvioletred: "c71585",
	midnightblue: "191970",
	mintcream: "f5fffa",
	mistyrose: "ffe4e1",
	moccasin: "ffe4b5",
	navajowhite: "ffdead",
	navy: "000080",
	oldlace: "fdf5e6",
	olive: "808000",
	olivedrab: "6b8e23",
	orange: "ffa500",
	orangered: "ff4500",
	orchid: "da70d6",
	palegoldenrod: "eee8aa",
	palegreen: "98fb98",
	paleturquoise: "afeeee",
	palevioletred: "db7093",
	papayawhip: "ffefd5",
	peachpuff: "ffdab9",
	peru: "cd853f",
	pink: "ffc0cb",
	plum: "dda0dd",
	powderblue: "b0e0e6",
	purple: "800080",
	rebeccapurple: "663399",
	red: "f00",
	rosybrown: "bc8f8f",
	royalblue: "4169e1",
	saddlebrown: "8b4513",
	salmon: "fa8072",
	sandybrown: "f4a460",
	seagreen: "2e8b57",
	seashell: "fff5ee",
	sienna: "a0522d",
	silver: "c0c0c0",
	skyblue: "87ceeb",
	slateblue: "6a5acd",
	slategray: "708090",
	slategrey: "708090",
	snow: "fffafa",
	springgreen: "00ff7f",
	steelblue: "4682b4",
	tan: "d2b48c",
	teal: "008080",
	thistle: "d8bfd8",
	tomato: "ff6347",
	turquoise: "40e0d0",
	violet: "ee82ee",
	wheat: "f5deb3",
	white: "fff",
	whitesmoke: "f5f5f5",
	yellow: "ff0",
	yellowgreen: "9acd32"
});
Object.freeze(new Set(Object.keys(W)));
Object.freeze([
	"B",
	"KB",
	"MB",
	"GB",
	"TB",
	"AUTO"
]);
var N = 1e3;
60 * N;
60 * N;
var qt = 3600;
qt * N;
qt * N;
var Qt$1 = 86400;
Qt$1 * N;
Qt$1 * N;
var Xt = 604800;
Xt * N;
Xt * N;
y$2 && ("ontouchstart" in window || tn());
function tn() {
	return typeof navigator < "u" && (navigator.maxTouchPoints || navigator.msMaxTouchPoints) || 0;
}
[
	"button",
	"[href]:not(.disabled)",
	"input",
	"select",
	"textarea",
	"[tabindex]",
	"[contenteditable]"
].map((t) => `${t}:not(:disabled):not([disabled])`).join(", ");
function Zr$1() {
	const t = /* @__PURE__ */ new Map();
	return {
		on(e, n) {
			const r = t.get(e);
			r != null && r.add(n) || t.set(e, /* @__PURE__ */ new Set([n]));
		},
		off(e, n) {
			const r = t.get(e);
			r && r.delete(n);
		},
		clear(e) {
			const n = t.get(e);
			n && n.clear();
		},
		clearAll() {
			t.clear();
		},
		emit(e, ...n) {
			const r = t.get(e);
			r && r.forEach((o) => {
				o(...n);
			});
		}
	};
}
function eo(t, e = 16) {
	if (typeof t != "function") return it$1;
	const n = (...i) => {
		t(...i);
	};
	if (e <= 0) return Jt$1(n);
	let r = 0, o;
	return function(...i) {
		const s = Date.now(), c = s - r;
		clearTimeout(o), c >= e ? (r = s, n(...i)) : o = setTimeout(() => {
			r = Date.now(), n(...i);
		}, Math.max(0, e - c));
	};
}
function no$1(t, e = 100) {
	if (typeof t != "function") return it$1;
	const n = (...o) => {
		t(...o);
	};
	if (e <= 0) return Jt$1(n);
	let r;
	return function(...o) {
		clearTimeout(r), r = setTimeout(() => {
			n(...o);
		}, e);
	};
}
function Jt$1(t) {
	if (typeof t != "function") return t;
	let e = !1, n, r;
	return function(...o) {
		return n = o, e || (e = !0, r = Promise.resolve().then(() => (e = !1, r = void 0, t(...n)))), r;
	};
}
var x$1 = /* @__PURE__ */ new Set();
var vt = /* @__PURE__ */ new WeakMap();
function hn$1() {
	x$1.forEach((t) => {
		t(...vt.get(t));
	}), x$1.clear();
}
function oo$1(t, ...e) {
	if (typeof t != "function") return t;
	vt.set(t, e), !x$1.has(t) && (x$1.add(t), x$1.size === 1 && Promise.resolve().then(hn$1));
}
//#endregion
//#region ../../node_modules/.pnpm/grid-layout-plus@1.1.1_vue@3.5.45_typescript@5.9.3_/node_modules/grid-layout-plus/es/helpers/common.mjs
var T = Symbol("LAYOUT_KEY");
var v$1 = Symbol("EMITTER_KEY");
function A(r) {
	let n = 0, t;
	for (let e = 0, i = r.length; e < i; e++) t = r[e].y + r[e].h, t > n && (n = t);
	return n;
}
function Y(r) {
	const n = Array(r.length);
	for (let t = 0, e = r.length; t < e; t++) n[t] = y$1(r[t]);
	return n;
}
function y$1(r) {
	return { ...r };
}
function a$1(r, n) {
	return !(r === n || r.x + r.w <= n.x || r.x >= n.x + n.w || r.y + r.h <= n.y || r.y >= n.y + n.h);
}
function $(r, n, t) {
	const e = b(r), i = g(r), o = Array(r.length);
	for (let s = 0, f = i.length; s < f; s++) {
		let c = i[s];
		c.static || (c = E(e, c, n, t), e.push(c)), o[r.findIndex((l) => l.i === c.i)] = c, c.moved = !1;
	}
	return o;
}
function E(r, n, t, e) {
	if (t) for (; n.y > 0 && !h(r, n);) n.y--;
	else if (e) {
		const o = e[n.i].y;
		for (; n.y > o && !h(r, n);) n.y--;
	}
	let i;
	for (; i = h(r, n);) n.y = i.y + i.h;
	return n;
}
function _(r, n) {
	const t = b(r);
	for (let e = 0, i = r.length; e < i; e++) {
		const o = r[e];
		if (o.x + o.w > n.cols && (o.x = n.cols - o.w), o.x < 0 && (o.x = 0, o.w = n.cols), !o.static) t.push(o);
		else for (; h(t, o);) o.y++;
	}
	return r;
}
function C(r, n) {
	for (let t = 0, e = r.length; t < e; t++) if (r[t].i === n) return r[t];
}
function h(r, n) {
	for (let t = 0, e = r.length; t < e; t++) if (a$1(r[t], n)) return r[t];
}
function L(r, n) {
	return r.filter((t) => a$1(t, n));
}
function b(r) {
	return r.filter((n) => n.static);
}
function x(r, n, t, e, i = !1, o = !1) {
	if (n.static) return r;
	const s = n.x, f = n.y, c = e && n.y > e;
	typeof t == "number" && (n.x = t), typeof e == "number" && (n.y = e), n.moved = !0;
	let l = g(r);
	c && (l = l.reverse());
	const p = L(l, n);
	if (o && p.length) return n.x = s, n.y = f, n.moved = !1, r;
	for (let w = 0, m = p.length; w < m; w++) {
		const u = p[w];
		u.moved || n.y > u.y && n.y - u.y > u.h / 4 || (u.static ? r = d$1(r, u, n, i) : r = d$1(r, n, u, i));
	}
	return r;
}
function d$1(r, n, t, e) {
	if (e) {
		const o = {
			x: t.x,
			y: t.y,
			w: t.w,
			h: t.h
		};
		if (o.y = Math.max(n.y - t.h, 0), !h(r, o)) return x(r, t, void 0, o.y, !1);
	}
	return x(r, t, void 0, t.y + 1, !1);
}
function G(r, n, t, e) {
	const i = "translate3d(" + n + "px," + r + "px, 0)";
	return {
		transform: i,
		WebkitTransform: i,
		MozTransform: i,
		msTransform: i,
		OTransform: i,
		width: t + "px",
		height: e + "px",
		position: "absolute"
	};
}
function O(r, n, t, e) {
	const i = "translate3d(" + n * -1 + "px," + r + "px, 0)";
	return {
		transform: i,
		WebkitTransform: i,
		MozTransform: i,
		msTransform: i,
		OTransform: i,
		width: t + "px",
		height: e + "px",
		position: "absolute"
	};
}
function R(r, n, t, e) {
	return {
		top: r + "px",
		left: n + "px",
		width: t + "px",
		height: e + "px",
		position: "absolute"
	};
}
function V$1(r, n, t, e) {
	return {
		top: r + "px",
		right: n + "px",
		width: t + "px",
		height: e + "px",
		position: "absolute"
	};
}
function g(r) {
	return Array.from(r).sort(function(n, t) {
		return n.y === t.y && n.x === t.x ? 0 : n.y > t.y || n.y === t.y && n.x > t.x ? 1 : -1;
	});
}
function k(r, n) {
	n = n || "Layout";
	const t = [
		"x",
		"y",
		"w",
		"h"
	], e = [];
	if (!Array.isArray(r)) throw new Error(n + " must be an array!");
	for (let i = 0, o = r.length; i < o; i++) {
		const s = r[i];
		for (let f = 0; f < t.length; f++) if (typeof s[t[f]] != "number") throw new Error("VueGridLayout: " + n + "[" + i + "]." + t[f] + " must be a number!");
		if (s.i === void 0 || s.i === null) throw new Error("VueGridLayout: " + n + "[" + i + "].i cannot be null!");
		if (typeof s.i != "number" && typeof s.i != "string") throw new Error("VueGridLayout: " + n + "[" + i + "].i must be a string or number!");
		if (e.indexOf(s.i) >= 0) throw new Error("VueGridLayout: " + n + "[" + i + "].i must be unique!");
		if (e.push(s.i), s.static !== void 0 && typeof s.static != "boolean") throw new Error("VueGridLayout: " + n + "[" + i + "].static must be a boolean!");
	}
}
function K(r, n = "vgl") {
	const t = () => `${n}-${r}`;
	return {
		b: t,
		be: (s) => `${t()}__${s}`,
		bm: (s) => `${t()}--${s}`,
		bem: (s, f) => `${t()}__${s}--${f}`
	};
}
//#endregion
//#region ../../node_modules/.pnpm/grid-layout-plus@1.1.1_vue@3.5.45_typescript@5.9.3_/node_modules/grid-layout-plus/es/helpers/draggable.mjs
function a(t) {
	return c(t);
}
function c(t) {
	var f;
	const n = ((f = t.target) == null ? void 0 : f.offsetParent) || document.body, e = t.offsetParent === document.body ? {
		left: 0,
		top: 0
	} : n.getBoundingClientRect();
	return {
		x: t.clientX + n.scrollLeft - e.left,
		y: t.clientY + n.scrollTop - e.top
	};
}
function i(t, n, e, o) {
	return s(t) ? {
		deltaX: e - t,
		deltaY: o - n,
		lastX: t,
		lastY: n,
		x: e,
		y: o
	} : {
		deltaX: 0,
		deltaY: 0,
		lastX: e,
		lastY: o,
		x: e,
		y: o
	};
}
function s(t) {
	return typeof t == "number" && !Number.isNaN(t);
}
//#endregion
//#region ../../node_modules/.pnpm/grid-layout-plus@1.1.1_vue@3.5.45_typescript@5.9.3_/node_modules/grid-layout-plus/es/helpers/responsive.mjs
function y(t, e) {
	const o = d(t);
	let n = o[0];
	for (let r = 1, c = o.length; r < c; r++) {
		const i = o[r];
		e > t[i] && (n = i);
	}
	return n;
}
function B$1(t, e) {
	if (!e[t]) throw new Error("ResponsiveGridLayout: `cols` entry for breakpoint " + t + " is missing!");
	return e[t];
}
function v(t, e, o, n, r, c, i) {
	if (e[n]) return Y(e[n]);
	let s = t;
	const u = d(o), l = u.slice(u.indexOf(n));
	for (let f = 0, g = l.length; f < g; f++) {
		const a = l[f];
		if (e[a]) {
			s = e[a];
			break;
		}
	}
	return s = Y(s || []), $(_(s, { cols: c }), i);
}
function d(t) {
	return Object.keys(t).sort((o, n) => t[o] - t[n]);
}
//#endregion
//#region ../../node_modules/.pnpm/grid-layout-plus@1.1.1_vue@3.5.45_typescript@5.9.3_/node_modules/grid-layout-plus/es/helpers/dom.mjs
var t = "auto";
function e() {
	return typeof document < "u";
}
function r() {
	return e() ? typeof document.dir < "u" ? document.dir : document.getElementsByTagName("html")[0].getAttribute("dir") : t;
}
//#endregion
//#region ../../node_modules/.pnpm/grid-layout-plus@1.1.1_vue@3.5.45_typescript@5.9.3_/node_modules/grid-layout-plus/es/components/grid-item.vue.mjs
var import_interact_min = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(t, e) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (t = "undefined" != typeof globalThis ? globalThis : t || self).interact = e();
	})(exports, (function() {
		"use strict";
		function t(t, e) {
			var n = Object.keys(t);
			if (Object.getOwnPropertySymbols) {
				var r = Object.getOwnPropertySymbols(t);
				e && (r = r.filter((function(e) {
					return Object.getOwnPropertyDescriptor(t, e).enumerable;
				}))), n.push.apply(n, r);
			}
			return n;
		}
		function e(e) {
			for (var n = 1; n < arguments.length; n++) {
				var r = null != arguments[n] ? arguments[n] : {};
				n % 2 ? t(Object(r), !0).forEach((function(t) {
					a(e, t, r[t]);
				})) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : t(Object(r)).forEach((function(t) {
					Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(r, t));
				}));
			}
			return e;
		}
		function n(t) {
			return n = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
				return typeof t;
			} : function(t) {
				return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
			}, n(t);
		}
		function r(t, e) {
			if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
		}
		function i(t, e) {
			for (var n = 0; n < e.length; n++) {
				var r = e[n];
				r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(t, d(r.key), r);
			}
		}
		function o(t, e, n) {
			return e && i(t.prototype, e), n && i(t, n), Object.defineProperty(t, "prototype", { writable: !1 }), t;
		}
		function a(t, e, n) {
			return (e = d(e)) in t ? Object.defineProperty(t, e, {
				value: n,
				enumerable: !0,
				configurable: !0,
				writable: !0
			}) : t[e] = n, t;
		}
		function s(t, e) {
			if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
			t.prototype = Object.create(e && e.prototype, { constructor: {
				value: t,
				writable: !0,
				configurable: !0
			} }), Object.defineProperty(t, "prototype", { writable: !1 }), e && l(t, e);
		}
		function c(t) {
			return c = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t) {
				return t.__proto__ || Object.getPrototypeOf(t);
			}, c(t);
		}
		function l(t, e) {
			return l = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t, e) {
				return t.__proto__ = e, t;
			}, l(t, e);
		}
		function u(t) {
			if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
			return t;
		}
		function p(t) {
			var e = function() {
				if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
				if (Reflect.construct.sham) return !1;
				if ("function" == typeof Proxy) return !0;
				try {
					return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function() {}))), !0;
				} catch (t) {
					return !1;
				}
			}();
			return function() {
				var n, r = c(t);
				if (e) {
					var i = c(this).constructor;
					n = Reflect.construct(r, arguments, i);
				} else n = r.apply(this, arguments);
				return function(t, e) {
					if (e && ("object" == typeof e || "function" == typeof e)) return e;
					if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
					return u(t);
				}(this, n);
			};
		}
		function f() {
			return f = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function(t, e, n) {
				var r = function(t, e) {
					for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = c(t)););
					return t;
				}(t, e);
				if (r) {
					var i = Object.getOwnPropertyDescriptor(r, e);
					return i.get ? i.get.call(arguments.length < 3 ? t : n) : i.value;
				}
			}, f.apply(this, arguments);
		}
		function d(t) {
			var e = function(t, e) {
				if ("object" != typeof t || null === t) return t;
				var n = t[Symbol.toPrimitive];
				if (void 0 !== n) {
					var r = n.call(t, e || "default");
					if ("object" != typeof r) return r;
					throw new TypeError("@@toPrimitive must return a primitive value.");
				}
				return ("string" === e ? String : Number)(t);
			}(t, "string");
			return "symbol" == typeof e ? e : e + "";
		}
		var h = function(t) {
			return !(!t || !t.Window) && t instanceof t.Window;
		}, v = void 0, g = void 0;
		function m(t) {
			v = t;
			var e = t.document.createTextNode("");
			e.ownerDocument !== t.document && "function" == typeof t.wrap && t.wrap(e) === e && (t = t.wrap(t)), g = t;
		}
		function y(t) {
			return h(t) ? t : (t.ownerDocument || t).defaultView || g.window;
		}
		"undefined" != typeof window && window && m(window);
		var b = function(t) {
			return !!t && "object" === n(t);
		}, x = function(t) {
			return "function" == typeof t;
		}, w = {
			window: function(t) {
				return t === g || h(t);
			},
			docFrag: function(t) {
				return b(t) && 11 === t.nodeType;
			},
			object: b,
			func: x,
			number: function(t) {
				return "number" == typeof t;
			},
			bool: function(t) {
				return "boolean" == typeof t;
			},
			string: function(t) {
				return "string" == typeof t;
			},
			element: function(t) {
				if (!t || "object" !== n(t)) return !1;
				var e = y(t) || g;
				return /object|function/.test("undefined" == typeof Element ? "undefined" : n(Element)) ? t instanceof Element || t instanceof e.Element : 1 === t.nodeType && "string" == typeof t.nodeName;
			},
			plainObject: function(t) {
				return b(t) && !!t.constructor && /function Object\b/.test(t.constructor.toString());
			},
			array: function(t) {
				return b(t) && void 0 !== t.length && x(t.splice);
			}
		};
		function E(t) {
			var e = t.interaction;
			if ("drag" === e.prepared.name) {
				var n = e.prepared.axis;
				"x" === n ? (e.coords.cur.page.y = e.coords.start.page.y, e.coords.cur.client.y = e.coords.start.client.y, e.coords.velocity.client.y = 0, e.coords.velocity.page.y = 0) : "y" === n && (e.coords.cur.page.x = e.coords.start.page.x, e.coords.cur.client.x = e.coords.start.client.x, e.coords.velocity.client.x = 0, e.coords.velocity.page.x = 0);
			}
		}
		function T(t) {
			var e = t.iEvent, n = t.interaction;
			if ("drag" === n.prepared.name) {
				var r = n.prepared.axis;
				if ("x" === r || "y" === r) {
					var i = "x" === r ? "y" : "x";
					e.page[i] = n.coords.start.page[i], e.client[i] = n.coords.start.client[i], e.delta[i] = 0;
				}
			}
		}
		var S = {
			id: "actions/drag",
			install: function(t) {
				var e = t.actions, n = t.Interactable, r = t.defaults;
				n.prototype.draggable = S.draggable, e.map.drag = S, e.methodDict.drag = "draggable", r.actions.drag = S.defaults;
			},
			listeners: {
				"interactions:before-action-move": E,
				"interactions:action-resume": E,
				"interactions:action-move": T,
				"auto-start:check": function(t) {
					var e = t.interaction, n = t.interactable, r = t.buttons, i = n.options.drag;
					if (i && i.enabled && (!e.pointerIsDown || !/mouse|pointer/.test(e.pointerType) || 0 != (r & n.options.drag.mouseButtons))) return t.action = {
						name: "drag",
						axis: "start" === i.lockAxis ? i.startAxis : i.lockAxis
					}, !1;
				}
			},
			draggable: function(t) {
				return w.object(t) ? (this.options.drag.enabled = !1 !== t.enabled, this.setPerAction("drag", t), this.setOnEvents("drag", t), /^(xy|x|y|start)$/.test(t.lockAxis) && (this.options.drag.lockAxis = t.lockAxis), /^(xy|x|y)$/.test(t.startAxis) && (this.options.drag.startAxis = t.startAxis), this) : w.bool(t) ? (this.options.drag.enabled = t, this) : this.options.drag;
			},
			beforeMove: E,
			move: T,
			defaults: {
				startAxis: "xy",
				lockAxis: "xy"
			},
			getCursor: function() {
				return "move";
			},
			filterEventType: function(t) {
				return 0 === t.search("drag");
			}
		}, _ = S, P = {
			init: function(t) {
				var e = t;
				P.document = e.document, P.DocumentFragment = e.DocumentFragment || O, P.SVGElement = e.SVGElement || O, P.SVGSVGElement = e.SVGSVGElement || O, P.SVGElementInstance = e.SVGElementInstance || O, P.Element = e.Element || O, P.HTMLElement = e.HTMLElement || P.Element, P.Event = e.Event, P.Touch = e.Touch || O, P.PointerEvent = e.PointerEvent || e.MSPointerEvent;
			},
			document: null,
			DocumentFragment: null,
			SVGElement: null,
			SVGSVGElement: null,
			SVGElementInstance: null,
			Element: null,
			HTMLElement: null,
			Event: null,
			Touch: null,
			PointerEvent: null
		};
		function O() {}
		var k = P;
		var D = {
			init: function(t) {
				var e = k.Element, n = t.navigator || {};
				D.supportsTouch = "ontouchstart" in t || w.func(t.DocumentTouch) && k.document instanceof t.DocumentTouch, D.supportsPointerEvent = !1 !== n.pointerEnabled && !!k.PointerEvent, D.isIOS = /iP(hone|od|ad)/.test(n.platform), D.isIOS7 = /iP(hone|od|ad)/.test(n.platform) && /OS 7[^\d]/.test(n.appVersion), D.isIe9 = /MSIE 9/.test(n.userAgent), D.isOperaMobile = "Opera" === n.appName && D.supportsTouch && /Presto/.test(n.userAgent), D.prefixedMatchesSelector = "matches" in e.prototype ? "matches" : "webkitMatchesSelector" in e.prototype ? "webkitMatchesSelector" : "mozMatchesSelector" in e.prototype ? "mozMatchesSelector" : "oMatchesSelector" in e.prototype ? "oMatchesSelector" : "msMatchesSelector", D.pEventTypes = D.supportsPointerEvent ? k.PointerEvent === t.MSPointerEvent ? {
					up: "MSPointerUp",
					down: "MSPointerDown",
					over: "mouseover",
					out: "mouseout",
					move: "MSPointerMove",
					cancel: "MSPointerCancel"
				} : {
					up: "pointerup",
					down: "pointerdown",
					over: "pointerover",
					out: "pointerout",
					move: "pointermove",
					cancel: "pointercancel"
				} : null, D.wheelEvent = k.document && "onmousewheel" in k.document ? "mousewheel" : "wheel";
			},
			supportsTouch: null,
			supportsPointerEvent: null,
			isIOS7: null,
			isIOS: null,
			isIe9: null,
			isOperaMobile: null,
			prefixedMatchesSelector: null,
			pEventTypes: null,
			wheelEvent: null
		};
		var I = D;
		function M(t, e) {
			if (t.contains) return t.contains(e);
			for (; e;) {
				if (e === t) return !0;
				e = e.parentNode;
			}
			return !1;
		}
		function z(t, e) {
			for (; w.element(t);) {
				if (R(t, e)) return t;
				t = A(t);
			}
			return null;
		}
		function A(t) {
			var e = t.parentNode;
			if (w.docFrag(e)) {
				for (; (e = e.host) && w.docFrag(e););
				return e;
			}
			return e;
		}
		function R(t, e) {
			return g !== v && (e = e.replace(/\/deep\//g, " ")), t[I.prefixedMatchesSelector](e);
		}
		var C = function(t) {
			return t.parentNode || t.host;
		};
		function j(t, e) {
			for (var n, r = [], i = t; (n = C(i)) && i !== e && n !== i.ownerDocument;) r.unshift(i), i = n;
			return r;
		}
		function F(t, e, n) {
			for (; w.element(t);) {
				if (R(t, e)) return !0;
				if ((t = A(t)) === n) return R(t, e);
			}
			return !1;
		}
		function X(t) {
			return t.correspondingUseElement || t;
		}
		function Y(t) {
			var e = t instanceof k.SVGElement ? t.getBoundingClientRect() : t.getClientRects()[0];
			return e && {
				left: e.left,
				right: e.right,
				top: e.top,
				bottom: e.bottom,
				width: e.width || e.right - e.left,
				height: e.height || e.bottom - e.top
			};
		}
		function L(t) {
			var e, n = Y(t);
			if (!I.isIOS7 && n) {
				var r = {
					x: (e = (e = y(t)) || g).scrollX || e.document.documentElement.scrollLeft,
					y: e.scrollY || e.document.documentElement.scrollTop
				};
				n.left += r.x, n.right += r.x, n.top += r.y, n.bottom += r.y;
			}
			return n;
		}
		function q(t) {
			for (var e = []; t;) e.push(t), t = A(t);
			return e;
		}
		function B(t) {
			return !!w.string(t) && (k.document.querySelector(t), !0);
		}
		function V(t, e) {
			for (var n in e) t[n] = e[n];
			return t;
		}
		function W(t, e, n) {
			return "parent" === t ? A(n) : "self" === t ? e.getRect(n) : z(n, t);
		}
		function G(t, e, n, r) {
			var i = t;
			return w.string(i) ? i = W(i, e, n) : w.func(i) && (i = i.apply(void 0, r)), w.element(i) && (i = L(i)), i;
		}
		function N(t) {
			return t && {
				x: "x" in t ? t.x : t.left,
				y: "y" in t ? t.y : t.top
			};
		}
		function U(t) {
			return !t || "x" in t && "y" in t || ((t = V({}, t)).x = t.left || 0, t.y = t.top || 0, t.width = t.width || (t.right || 0) - t.x, t.height = t.height || (t.bottom || 0) - t.y), t;
		}
		function H(t, e, n) {
			t.left && (e.left += n.x), t.right && (e.right += n.x), t.top && (e.top += n.y), t.bottom && (e.bottom += n.y), e.width = e.right - e.left, e.height = e.bottom - e.top;
		}
		function K(t, e, n) {
			var r = n && t.options[n];
			return N(G(r && r.origin || t.options.origin, t, e, [t && e])) || {
				x: 0,
				y: 0
			};
		}
		function $(t, e) {
			var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : function(t) {
				return !0;
			}, r = arguments.length > 3 ? arguments[3] : void 0;
			if (r = r || {}, w.string(t) && -1 !== t.search(" ") && (t = J(t)), w.array(t)) return t.forEach((function(t) {
				return $(t, e, n, r);
			})), r;
			if (w.object(t) && (e = t, t = ""), w.func(e) && n(t)) r[t] = r[t] || [], r[t].push(e);
			else if (w.array(e)) for (var i = 0, o = e; i < o.length; i++) {
				var a = o[i];
				$(t, a, n, r);
			}
			else if (w.object(e)) for (var s in e) $(J(s).map((function(e) {
				return "".concat(t).concat(e);
			})), e[s], n, r);
			return r;
		}
		function J(t) {
			return t.trim().split(/ +/);
		}
		var Q = function(t, e) {
			return Math.sqrt(t * t + e * e);
		}, Z = ["webkit", "moz"];
		function tt(t, e) {
			t.__set || (t.__set = {});
			var n = function(n) {
				if (Z.some((function(t) {
					return 0 === n.indexOf(t);
				}))) return 1;
				"function" != typeof t[n] && "__set" !== n && Object.defineProperty(t, n, {
					get: function() {
						return n in t.__set ? t.__set[n] : t.__set[n] = e[n];
					},
					set: function(e) {
						t.__set[n] = e;
					},
					configurable: !0
				});
			};
			for (var r in e) n(r);
			return t;
		}
		function et(t, e) {
			t.page = t.page || {}, t.page.x = e.page.x, t.page.y = e.page.y, t.client = t.client || {}, t.client.x = e.client.x, t.client.y = e.client.y, t.timeStamp = e.timeStamp;
		}
		function nt(t) {
			t.page.x = 0, t.page.y = 0, t.client.x = 0, t.client.y = 0;
		}
		function rt(t) {
			return t instanceof k.Event || t instanceof k.Touch;
		}
		function it(t, e, n) {
			return t = t || "page", (n = n || {}).x = e[t + "X"], n.y = e[t + "Y"], n;
		}
		function ot(t, e) {
			return e = e || {
				x: 0,
				y: 0
			}, I.isOperaMobile && rt(t) ? (it("screen", t, e), e.x += window.scrollX, e.y += window.scrollY) : it("page", t, e), e;
		}
		function at(t) {
			return w.number(t.pointerId) ? t.pointerId : t.identifier;
		}
		function st(t, e, n) {
			var r = e.length > 1 ? lt(e) : e[0];
			ot(r, t.page), function(t, e) {
				e = e || {}, I.isOperaMobile && rt(t) ? it("screen", t, e) : it("client", t, e);
			}(r, t.client), t.timeStamp = n;
		}
		function ct(t) {
			var e = [];
			return w.array(t) ? (e[0] = t[0], e[1] = t[1]) : "touchend" === t.type ? 1 === t.touches.length ? (e[0] = t.touches[0], e[1] = t.changedTouches[0]) : 0 === t.touches.length && (e[0] = t.changedTouches[0], e[1] = t.changedTouches[1]) : (e[0] = t.touches[0], e[1] = t.touches[1]), e;
		}
		function lt(t) {
			for (var e = {
				pageX: 0,
				pageY: 0,
				clientX: 0,
				clientY: 0,
				screenX: 0,
				screenY: 0
			}, n = 0; n < t.length; n++) {
				var r = t[n];
				for (var i in e) e[i] += r[i];
			}
			for (var o in e) e[o] /= t.length;
			return e;
		}
		function ut(t) {
			if (!t.length) return null;
			var e = ct(t), n = Math.min(e[0].pageX, e[1].pageX), r = Math.min(e[0].pageY, e[1].pageY), i = Math.max(e[0].pageX, e[1].pageX), o = Math.max(e[0].pageY, e[1].pageY);
			return {
				x: n,
				y: r,
				left: n,
				top: r,
				right: i,
				bottom: o,
				width: i - n,
				height: o - r
			};
		}
		function pt(t, e) {
			var n = e + "X", r = e + "Y", i = ct(t);
			return Q(i[0][n] - i[1][n], i[0][r] - i[1][r]);
		}
		function ft(t, e) {
			var n = e + "X", r = e + "Y", i = ct(t), o = i[1][n] - i[0][n], a = i[1][r] - i[0][r];
			return 180 * Math.atan2(a, o) / Math.PI;
		}
		function dt(t) {
			return w.string(t.pointerType) ? t.pointerType : w.number(t.pointerType) ? [
				void 0,
				void 0,
				"touch",
				"pen",
				"mouse"
			][t.pointerType] : /touch/.test(t.type || "") || t instanceof k.Touch ? "touch" : "mouse";
		}
		function ht(t) {
			var e = w.func(t.composedPath) ? t.composedPath() : t.path;
			return [X(e ? e[0] : t.target), X(t.currentTarget)];
		}
		var vt = function() {
			function t(e) {
				r(this, t), this.immediatePropagationStopped = !1, this.propagationStopped = !1, this._interaction = e;
			}
			return o(t, [
				{
					key: "preventDefault",
					value: function() {}
				},
				{
					key: "stopPropagation",
					value: function() {
						this.propagationStopped = !0;
					}
				},
				{
					key: "stopImmediatePropagation",
					value: function() {
						this.immediatePropagationStopped = this.propagationStopped = !0;
					}
				}
			]), t;
		}();
		Object.defineProperty(vt.prototype, "interaction", {
			get: function() {
				return this._interaction._proxy;
			},
			set: function() {}
		});
		var gt = function(t, e) {
			for (var n = 0; n < e.length; n++) {
				var r = e[n];
				t.push(r);
			}
			return t;
		}, mt = function(t) {
			return gt([], t);
		}, yt = function(t, e) {
			for (var n = 0; n < t.length; n++) if (e(t[n], n, t)) return n;
			return -1;
		}, bt = function(t, e) {
			return t[yt(t, e)];
		}, xt = function(t) {
			s(n, t);
			var e = p(n);
			function n(t, i, o) {
				var a;
				r(this, n), (a = e.call(this, i._interaction)).dropzone = void 0, a.dragEvent = void 0, a.relatedTarget = void 0, a.draggable = void 0, a.propagationStopped = !1, a.immediatePropagationStopped = !1;
				var s = "dragleave" === o ? t.prev : t.cur, c = s.element, l = s.dropzone;
				return a.type = o, a.target = c, a.currentTarget = c, a.dropzone = l, a.dragEvent = i, a.relatedTarget = i.target, a.draggable = i.interactable, a.timeStamp = i.timeStamp, a;
			}
			return o(n, [
				{
					key: "reject",
					value: function() {
						var t = this, e = this._interaction.dropState;
						if ("dropactivate" === this.type || this.dropzone && e.cur.dropzone === this.dropzone && e.cur.element === this.target) if (e.prev.dropzone = this.dropzone, e.prev.element = this.target, e.rejected = !0, e.events.enter = null, this.stopImmediatePropagation(), "dropactivate" === this.type) {
							var r = e.activeDrops, i = yt(r, (function(e) {
								var n = e.dropzone, r = e.element;
								return n === t.dropzone && r === t.target;
							}));
							e.activeDrops.splice(i, 1);
							var o = new n(e, this.dragEvent, "dropdeactivate");
							o.dropzone = this.dropzone, o.target = this.target, this.dropzone.fire(o);
						} else this.dropzone.fire(new n(e, this.dragEvent, "dragleave"));
					}
				},
				{
					key: "preventDefault",
					value: function() {}
				},
				{
					key: "stopPropagation",
					value: function() {
						this.propagationStopped = !0;
					}
				},
				{
					key: "stopImmediatePropagation",
					value: function() {
						this.immediatePropagationStopped = this.propagationStopped = !0;
					}
				}
			]), n;
		}(vt);
		function wt(t, e) {
			for (var n = 0, r = t.slice(); n < r.length; n++) {
				var i = r[n], o = i.dropzone, a = i.element;
				e.dropzone = o, e.target = a, o.fire(e), e.propagationStopped = e.immediatePropagationStopped = !1;
			}
		}
		function Et(t, e) {
			for (var n = function(t, e) {
				for (var n = [], r = 0, i = t.interactables.list; r < i.length; r++) {
					var o = i[r];
					if (o.options.drop.enabled) {
						var a = o.options.drop.accept;
						if (!(w.element(a) && a !== e || w.string(a) && !R(e, a) || w.func(a) && !a({
							dropzone: o,
							draggableElement: e
						}))) for (var s = 0, c = o.getAllElements(); s < c.length; s++) {
							var l = c[s];
							l !== e && n.push({
								dropzone: o,
								element: l,
								rect: o.getRect(l)
							});
						}
					}
				}
				return n;
			}(t, e), r = 0; r < n.length; r++) {
				var i = n[r];
				i.rect = i.dropzone.getRect(i.element);
			}
			return n;
		}
		function Tt(t, e, n) {
			for (var r = t.dropState, i = t.interactable, o = t.element, a = [], s = 0, c = r.activeDrops; s < c.length; s++) {
				var l = c[s], u = l.dropzone, p = l.element, f = l.rect, d = u.dropCheck(e, n, i, o, p, f);
				a.push(d ? p : null);
			}
			var h = function(t) {
				for (var e, n, r, i = [], o = 0; o < t.length; o++) {
					var a = t[o], s = t[e];
					if (a && o !== e) if (s) {
						var c = C(a), l = C(s);
						if (c !== a.ownerDocument) if (l !== a.ownerDocument) if (c !== l) {
							i = i.length ? i : j(s);
							var u = void 0;
							if (s instanceof k.HTMLElement && a instanceof k.SVGElement && !(a instanceof k.SVGSVGElement)) {
								if (a === l) continue;
								u = a.ownerSVGElement;
							} else u = a;
							for (var p = j(u, s.ownerDocument), f = 0; p[f] && p[f] === i[f];) f++;
							var d = [
								p[f - 1],
								p[f],
								i[f]
							];
							if (d[0]) for (var h = d[0].lastChild; h;) {
								if (h === d[1]) {
									e = o, i = p;
									break;
								}
								if (h === d[2]) break;
								h = h.previousSibling;
							}
						} else r = s, (parseInt(y(n = a).getComputedStyle(n).zIndex, 10) || 0) >= (parseInt(y(r).getComputedStyle(r).zIndex, 10) || 0) && (e = o);
						else e = o;
					} else e = o;
				}
				return e;
			}(a);
			return r.activeDrops[h] || null;
		}
		function St(t, e, n) {
			var r = t.dropState, i = {
				enter: null,
				leave: null,
				activate: null,
				deactivate: null,
				move: null,
				drop: null
			};
			return "dragstart" === n.type && (i.activate = new xt(r, n, "dropactivate"), i.activate.target = null, i.activate.dropzone = null), "dragend" === n.type && (i.deactivate = new xt(r, n, "dropdeactivate"), i.deactivate.target = null, i.deactivate.dropzone = null), r.rejected || (r.cur.element !== r.prev.element && (r.prev.dropzone && (i.leave = new xt(r, n, "dragleave"), n.dragLeave = i.leave.target = r.prev.element, n.prevDropzone = i.leave.dropzone = r.prev.dropzone), r.cur.dropzone && (i.enter = new xt(r, n, "dragenter"), n.dragEnter = r.cur.element, n.dropzone = r.cur.dropzone)), "dragend" === n.type && r.cur.dropzone && (i.drop = new xt(r, n, "drop"), n.dropzone = r.cur.dropzone, n.relatedTarget = r.cur.element), "dragmove" === n.type && r.cur.dropzone && (i.move = new xt(r, n, "dropmove"), n.dropzone = r.cur.dropzone)), i;
		}
		function _t(t, e) {
			var n = t.dropState, r = n.activeDrops, i = n.cur, o = n.prev;
			e.leave && o.dropzone.fire(e.leave), e.enter && i.dropzone.fire(e.enter), e.move && i.dropzone.fire(e.move), e.drop && i.dropzone.fire(e.drop), e.deactivate && wt(r, e.deactivate), n.prev.dropzone = i.dropzone, n.prev.element = i.element;
		}
		function Pt(t, e) {
			var n = t.interaction, r = t.iEvent, i = t.event;
			if ("dragmove" === r.type || "dragend" === r.type) {
				var o = n.dropState;
				e.dynamicDrop && (o.activeDrops = Et(e, n.element));
				var a = r, s = Tt(n, a, i);
				o.rejected = o.rejected && !!s && s.dropzone === o.cur.dropzone && s.element === o.cur.element, o.cur.dropzone = s && s.dropzone, o.cur.element = s && s.element, o.events = St(n, 0, a);
			}
		}
		var Ot = {
			id: "actions/drop",
			install: function(t) {
				var e = t.actions, n = t.interactStatic, r = t.Interactable, i = t.defaults;
				t.usePlugin(_), r.prototype.dropzone = function(t) {
					return function(t, e) {
						if (w.object(e)) {
							if (t.options.drop.enabled = !1 !== e.enabled, e.listeners) {
								var n = $(e.listeners), r = Object.keys(n).reduce((function(t, e) {
									return t[/^(enter|leave)/.test(e) ? "drag".concat(e) : /^(activate|deactivate|move)/.test(e) ? "drop".concat(e) : e] = n[e], t;
								}), {}), i = t.options.drop.listeners;
								i && t.off(i), t.on(r), t.options.drop.listeners = r;
							}
							return w.func(e.ondrop) && t.on("drop", e.ondrop), w.func(e.ondropactivate) && t.on("dropactivate", e.ondropactivate), w.func(e.ondropdeactivate) && t.on("dropdeactivate", e.ondropdeactivate), w.func(e.ondragenter) && t.on("dragenter", e.ondragenter), w.func(e.ondragleave) && t.on("dragleave", e.ondragleave), w.func(e.ondropmove) && t.on("dropmove", e.ondropmove), /^(pointer|center)$/.test(e.overlap) ? t.options.drop.overlap = e.overlap : w.number(e.overlap) && (t.options.drop.overlap = Math.max(Math.min(1, e.overlap), 0)), "accept" in e && (t.options.drop.accept = e.accept), "checker" in e && (t.options.drop.checker = e.checker), t;
						}
						if (w.bool(e)) return t.options.drop.enabled = e, t;
						return t.options.drop;
					}(this, t);
				}, r.prototype.dropCheck = function(t, e, n, r, i, o) {
					return function(t, e, n, r, i, o, a) {
						var s = !1;
						if (!(a = a || t.getRect(o))) return !!t.options.drop.checker && t.options.drop.checker(e, n, s, t, o, r, i);
						var c = t.options.drop.overlap;
						if ("pointer" === c) {
							var l = K(r, i, "drag"), u = ot(e);
							u.x += l.x, u.y += l.y;
							var p = u.x > a.left && u.x < a.right, f = u.y > a.top && u.y < a.bottom;
							s = p && f;
						}
						var d = r.getRect(i);
						if (d && "center" === c) {
							var h = d.left + d.width / 2, v = d.top + d.height / 2;
							s = h >= a.left && h <= a.right && v >= a.top && v <= a.bottom;
						}
						if (d && w.number(c)) s = Math.max(0, Math.min(a.right, d.right) - Math.max(a.left, d.left)) * Math.max(0, Math.min(a.bottom, d.bottom) - Math.max(a.top, d.top)) / (d.width * d.height) >= c;
						t.options.drop.checker && (s = t.options.drop.checker(e, n, s, t, o, r, i));
						return s;
					}(this, t, e, n, r, i, o);
				}, n.dynamicDrop = function(e) {
					return w.bool(e) ? (t.dynamicDrop = e, n) : t.dynamicDrop;
				}, V(e.phaselessTypes, {
					dragenter: !0,
					dragleave: !0,
					dropactivate: !0,
					dropdeactivate: !0,
					dropmove: !0,
					drop: !0
				}), e.methodDict.drop = "dropzone", t.dynamicDrop = !1, i.actions.drop = Ot.defaults;
			},
			listeners: {
				"interactions:before-action-start": function(t) {
					var e = t.interaction;
					"drag" === e.prepared.name && (e.dropState = {
						cur: {
							dropzone: null,
							element: null
						},
						prev: {
							dropzone: null,
							element: null
						},
						rejected: null,
						events: null,
						activeDrops: []
					});
				},
				"interactions:after-action-start": function(t, e) {
					var n = t.interaction, r = (t.event, t.iEvent);
					if ("drag" === n.prepared.name) {
						var i = n.dropState;
						i.activeDrops = [], i.events = {}, i.activeDrops = Et(e, n.element), i.events = St(n, 0, r), i.events.activate && (wt(i.activeDrops, i.events.activate), e.fire("actions/drop:start", {
							interaction: n,
							dragEvent: r
						}));
					}
				},
				"interactions:action-move": Pt,
				"interactions:after-action-move": function(t, e) {
					var n = t.interaction, r = t.iEvent;
					if ("drag" === n.prepared.name) {
						var i = n.dropState;
						_t(n, i.events), e.fire("actions/drop:move", {
							interaction: n,
							dragEvent: r
						}), i.events = {};
					}
				},
				"interactions:action-end": function(t, e) {
					if ("drag" === t.interaction.prepared.name) {
						var n = t.interaction, r = t.iEvent;
						Pt(t, e), _t(n, n.dropState.events), e.fire("actions/drop:end", {
							interaction: n,
							dragEvent: r
						});
					}
				},
				"interactions:stop": function(t) {
					var e = t.interaction;
					if ("drag" === e.prepared.name) {
						var n = e.dropState;
						n && (n.activeDrops = null, n.events = null, n.cur.dropzone = null, n.cur.element = null, n.prev.dropzone = null, n.prev.element = null, n.rejected = !1);
					}
				}
			},
			getActiveDrops: Et,
			getDrop: Tt,
			getDropEvents: St,
			fireDropEvents: _t,
			filterEventType: function(t) {
				return 0 === t.search("drag") || 0 === t.search("drop");
			},
			defaults: {
				enabled: !1,
				accept: null,
				overlap: "pointer"
			}
		}, kt = Ot;
		function Dt(t) {
			var e = t.interaction, n = t.iEvent, r = t.phase;
			if ("gesture" === e.prepared.name) {
				var i = e.pointers.map((function(t) {
					return t.pointer;
				})), o = "start" === r, a = "end" === r, s = e.interactable.options.deltaSource;
				if (n.touches = [i[0], i[1]], o) n.distance = pt(i, s), n.box = ut(i), n.scale = 1, n.ds = 0, n.angle = ft(i, s), n.da = 0, e.gesture.startDistance = n.distance, e.gesture.startAngle = n.angle;
				else if (a || e.pointers.length < 2) {
					var c = e.prevEvent;
					n.distance = c.distance, n.box = c.box, n.scale = c.scale, n.ds = 0, n.angle = c.angle, n.da = 0;
				} else n.distance = pt(i, s), n.box = ut(i), n.scale = n.distance / e.gesture.startDistance, n.angle = ft(i, s), n.ds = n.scale - e.gesture.scale, n.da = n.angle - e.gesture.angle;
				e.gesture.distance = n.distance, e.gesture.angle = n.angle, w.number(n.scale) && n.scale !== Infinity && !isNaN(n.scale) && (e.gesture.scale = n.scale);
			}
		}
		var It = {
			id: "actions/gesture",
			before: ["actions/drag", "actions/resize"],
			install: function(t) {
				var e = t.actions, n = t.Interactable, r = t.defaults;
				n.prototype.gesturable = function(t) {
					return w.object(t) ? (this.options.gesture.enabled = !1 !== t.enabled, this.setPerAction("gesture", t), this.setOnEvents("gesture", t), this) : w.bool(t) ? (this.options.gesture.enabled = t, this) : this.options.gesture;
				}, e.map.gesture = It, e.methodDict.gesture = "gesturable", r.actions.gesture = It.defaults;
			},
			listeners: {
				"interactions:action-start": Dt,
				"interactions:action-move": Dt,
				"interactions:action-end": Dt,
				"interactions:new": function(t) {
					t.interaction.gesture = {
						angle: 0,
						distance: 0,
						scale: 1,
						startAngle: 0,
						startDistance: 0
					};
				},
				"auto-start:check": function(t) {
					if (!(t.interaction.pointers.length < 2)) {
						var e = t.interactable.options.gesture;
						if (e && e.enabled) return t.action = { name: "gesture" }, !1;
					}
				}
			},
			defaults: {},
			getCursor: function() {
				return "";
			},
			filterEventType: function(t) {
				return 0 === t.search("gesture");
			}
		}, Mt = It;
		function zt(t, e, n, r, i, o, a) {
			if (!e) return !1;
			if (!0 === e) {
				var s = w.number(o.width) ? o.width : o.right - o.left, c = w.number(o.height) ? o.height : o.bottom - o.top;
				if (a = Math.min(a, Math.abs(("left" === t || "right" === t ? s : c) / 2)), s < 0 && ("left" === t ? t = "right" : "right" === t && (t = "left")), c < 0 && ("top" === t ? t = "bottom" : "bottom" === t && (t = "top")), "left" === t) {
					var l = s >= 0 ? o.left : o.right;
					return n.x < l + a;
				}
				if ("top" === t) {
					var u = c >= 0 ? o.top : o.bottom;
					return n.y < u + a;
				}
				if ("right" === t) return n.x > (s >= 0 ? o.right : o.left) - a;
				if ("bottom" === t) return n.y > (c >= 0 ? o.bottom : o.top) - a;
			}
			return !!w.element(r) && (w.element(e) ? e === r : F(r, e, i));
		}
		function At(t) {
			var e = t.iEvent, n = t.interaction;
			if ("resize" === n.prepared.name && n.resizeAxes) {
				var r = e;
				n.interactable.options.resize.square ? ("y" === n.resizeAxes ? r.delta.x = r.delta.y : r.delta.y = r.delta.x, r.axes = "xy") : (r.axes = n.resizeAxes, "x" === n.resizeAxes ? r.delta.y = 0 : "y" === n.resizeAxes && (r.delta.x = 0));
			}
		}
		var Rt, Ct, jt = {
			id: "actions/resize",
			before: ["actions/drag"],
			install: function(t) {
				var e = t.actions, n = t.browser, r = t.Interactable, i = t.defaults;
				jt.cursors = function(t) {
					return t.isIe9 ? {
						x: "e-resize",
						y: "s-resize",
						xy: "se-resize",
						top: "n-resize",
						left: "w-resize",
						bottom: "s-resize",
						right: "e-resize",
						topleft: "se-resize",
						bottomright: "se-resize",
						topright: "ne-resize",
						bottomleft: "ne-resize"
					} : {
						x: "ew-resize",
						y: "ns-resize",
						xy: "nwse-resize",
						top: "ns-resize",
						left: "ew-resize",
						bottom: "ns-resize",
						right: "ew-resize",
						topleft: "nwse-resize",
						bottomright: "nwse-resize",
						topright: "nesw-resize",
						bottomleft: "nesw-resize"
					};
				}(n), jt.defaultMargin = n.supportsTouch || n.supportsPointerEvent ? 20 : 10, r.prototype.resizable = function(e) {
					return function(t, e, n) {
						if (w.object(e)) return t.options.resize.enabled = !1 !== e.enabled, t.setPerAction("resize", e), t.setOnEvents("resize", e), w.string(e.axis) && /^x$|^y$|^xy$/.test(e.axis) ? t.options.resize.axis = e.axis : null === e.axis && (t.options.resize.axis = n.defaults.actions.resize.axis), w.bool(e.preserveAspectRatio) ? t.options.resize.preserveAspectRatio = e.preserveAspectRatio : w.bool(e.square) && (t.options.resize.square = e.square), t;
						if (w.bool(e)) return t.options.resize.enabled = e, t;
						return t.options.resize;
					}(this, e, t);
				}, e.map.resize = jt, e.methodDict.resize = "resizable", i.actions.resize = jt.defaults;
			},
			listeners: {
				"interactions:new": function(t) {
					t.interaction.resizeAxes = "xy";
				},
				"interactions:action-start": function(t) {
					(function(t) {
						var e = t.iEvent, n = t.interaction;
						if ("resize" === n.prepared.name && n.prepared.edges) {
							var r = e, i = n.rect;
							n._rects = {
								start: V({}, i),
								corrected: V({}, i),
								previous: V({}, i),
								delta: {
									left: 0,
									right: 0,
									width: 0,
									top: 0,
									bottom: 0,
									height: 0
								}
							}, r.edges = n.prepared.edges, r.rect = n._rects.corrected, r.deltaRect = n._rects.delta;
						}
					})(t), At(t);
				},
				"interactions:action-move": function(t) {
					(function(t) {
						var e = t.iEvent, n = t.interaction;
						if ("resize" === n.prepared.name && n.prepared.edges) {
							var r = e, i = n.interactable.options.resize.invert, o = "reposition" === i || "negate" === i, a = n.rect, s = n._rects, c = s.start, l = s.corrected, u = s.delta, p = s.previous;
							if (V(p, l), o) {
								if (V(l, a), "reposition" === i) {
									if (l.top > l.bottom) {
										var f = l.top;
										l.top = l.bottom, l.bottom = f;
									}
									if (l.left > l.right) {
										var d = l.left;
										l.left = l.right, l.right = d;
									}
								}
							} else l.top = Math.min(a.top, c.bottom), l.bottom = Math.max(a.bottom, c.top), l.left = Math.min(a.left, c.right), l.right = Math.max(a.right, c.left);
							for (var h in l.width = l.right - l.left, l.height = l.bottom - l.top, l) u[h] = l[h] - p[h];
							r.edges = n.prepared.edges, r.rect = l, r.deltaRect = u;
						}
					})(t), At(t);
				},
				"interactions:action-end": function(t) {
					var e = t.iEvent, n = t.interaction;
					if ("resize" === n.prepared.name && n.prepared.edges) {
						var r = e;
						r.edges = n.prepared.edges, r.rect = n._rects.corrected, r.deltaRect = n._rects.delta;
					}
				},
				"auto-start:check": function(t) {
					var e = t.interaction, n = t.interactable, r = t.element, i = t.rect, o = t.buttons;
					if (i) {
						var a = V({}, e.coords.cur.page), s = n.options.resize;
						if (s && s.enabled && (!e.pointerIsDown || !/mouse|pointer/.test(e.pointerType) || 0 != (o & s.mouseButtons))) {
							if (w.object(s.edges)) {
								var c = {
									left: !1,
									right: !1,
									top: !1,
									bottom: !1
								};
								for (var l in c) c[l] = zt(l, s.edges[l], a, e._latestPointer.eventTarget, r, i, s.margin || jt.defaultMargin);
								c.left = c.left && !c.right, c.top = c.top && !c.bottom, (c.left || c.right || c.top || c.bottom) && (t.action = {
									name: "resize",
									edges: c
								});
							} else {
								var u = "y" !== s.axis && a.x > i.right - jt.defaultMargin, p = "x" !== s.axis && a.y > i.bottom - jt.defaultMargin;
								(u || p) && (t.action = {
									name: "resize",
									axes: (u ? "x" : "") + (p ? "y" : "")
								});
							}
							return !t.action && void 0;
						}
					}
				}
			},
			defaults: {
				square: !1,
				preserveAspectRatio: !1,
				axis: "xy",
				margin: NaN,
				edges: null,
				invert: "none"
			},
			cursors: null,
			getCursor: function(t) {
				var e = t.edges, n = t.axis, r = t.name, i = jt.cursors, o = null;
				if (n) o = i[r + n];
				else if (e) {
					for (var a = "", s = 0, c = [
						"top",
						"bottom",
						"left",
						"right"
					]; s < c.length; s++) {
						var l = c[s];
						e[l] && (a += l);
					}
					o = i[a];
				}
				return o;
			},
			filterEventType: function(t) {
				return 0 === t.search("resize");
			},
			defaultMargin: null
		}, Ft = jt, Xt = {
			id: "actions",
			install: function(t) {
				t.usePlugin(Mt), t.usePlugin(Ft), t.usePlugin(_), t.usePlugin(kt);
			}
		}, Yt = 0;
		var Lt = {
			request: function(t) {
				return Rt(t);
			},
			cancel: function(t) {
				return Ct(t);
			},
			init: function(t) {
				if (Rt = t.requestAnimationFrame, Ct = t.cancelAnimationFrame, !Rt) for (var e = [
					"ms",
					"moz",
					"webkit",
					"o"
				], n = 0; n < e.length; n++) {
					var r = e[n];
					Rt = t["".concat(r, "RequestAnimationFrame")], Ct = t["".concat(r, "CancelAnimationFrame")] || t["".concat(r, "CancelRequestAnimationFrame")];
				}
				Rt = Rt && Rt.bind(t), Ct = Ct && Ct.bind(t), Rt || (Rt = function(e) {
					var n = Date.now(), r = Math.max(0, 16 - (n - Yt)), i = t.setTimeout((function() {
						e(n + r);
					}), r);
					return Yt = n + r, i;
				}, Ct = function(t) {
					return clearTimeout(t);
				});
			}
		};
		var qt = {
			defaults: {
				enabled: !1,
				margin: 60,
				container: null,
				speed: 300
			},
			now: Date.now,
			interaction: null,
			i: 0,
			x: 0,
			y: 0,
			isScrolling: !1,
			prevTime: 0,
			margin: 0,
			speed: 0,
			start: function(t) {
				qt.isScrolling = !0, Lt.cancel(qt.i), t.autoScroll = qt, qt.interaction = t, qt.prevTime = qt.now(), qt.i = Lt.request(qt.scroll);
			},
			stop: function() {
				qt.isScrolling = !1, qt.interaction && (qt.interaction.autoScroll = null), Lt.cancel(qt.i);
			},
			scroll: function() {
				var t = qt.interaction, e = t.interactable, n = t.element, r = t.prepared.name, i = e.options[r].autoScroll, o = Bt(i.container, e, n), a = qt.now(), s = (a - qt.prevTime) / 1e3, c = i.speed * s;
				if (c >= 1) {
					var l = {
						x: qt.x * c,
						y: qt.y * c
					};
					if (l.x || l.y) {
						var u = Vt(o);
						w.window(o) ? o.scrollBy(l.x, l.y) : o && (o.scrollLeft += l.x, o.scrollTop += l.y);
						var p = Vt(o), f = {
							x: p.x - u.x,
							y: p.y - u.y
						};
						(f.x || f.y) && e.fire({
							type: "autoscroll",
							target: n,
							interactable: e,
							delta: f,
							interaction: t,
							container: o
						});
					}
					qt.prevTime = a;
				}
				qt.isScrolling && (Lt.cancel(qt.i), qt.i = Lt.request(qt.scroll));
			},
			check: function(t, e) {
				var n;
				return null == (n = t.options[e].autoScroll) ? void 0 : n.enabled;
			},
			onInteractionMove: function(t) {
				var e = t.interaction, n = t.pointer;
				if (e.interacting() && qt.check(e.interactable, e.prepared.name)) if (e.simulation) qt.x = qt.y = 0;
				else {
					var r, i, o, a, s = e.interactable, c = e.element, l = e.prepared.name, u = s.options[l].autoScroll, p = Bt(u.container, s, c);
					if (w.window(p)) a = n.clientX < qt.margin, r = n.clientY < qt.margin, i = n.clientX > p.innerWidth - qt.margin, o = n.clientY > p.innerHeight - qt.margin;
					else {
						var f = Y(p);
						a = n.clientX < f.left + qt.margin, r = n.clientY < f.top + qt.margin, i = n.clientX > f.right - qt.margin, o = n.clientY > f.bottom - qt.margin;
					}
					qt.x = i ? 1 : a ? -1 : 0, qt.y = o ? 1 : r ? -1 : 0, qt.isScrolling || (qt.margin = u.margin, qt.speed = u.speed, qt.start(e));
				}
			}
		};
		function Bt(t, e, n) {
			return (w.string(t) ? W(t, e, n) : t) || y(n);
		}
		function Vt(t) {
			return w.window(t) && (t = window.document.body), {
				x: t.scrollLeft,
				y: t.scrollTop
			};
		}
		var Gt = {
			id: "auto-scroll",
			install: function(t) {
				var e = t.defaults, n = t.actions;
				t.autoScroll = qt, qt.now = function() {
					return t.now();
				}, n.phaselessTypes.autoscroll = !0, e.perAction.autoScroll = qt.defaults;
			},
			listeners: {
				"interactions:new": function(t) {
					t.interaction.autoScroll = null;
				},
				"interactions:destroy": function(t) {
					t.interaction.autoScroll = null, qt.stop(), qt.interaction && (qt.interaction = null);
				},
				"interactions:stop": qt.stop,
				"interactions:action-move": function(t) {
					return qt.onInteractionMove(t);
				}
			}
		};
		function Nt(t, e) {
			var n = !1;
			return function() {
				return n || (g.console.warn(e), n = !0), t.apply(this, arguments);
			};
		}
		function Ut(t, e) {
			return t.name = e.name, t.axis = e.axis, t.edges = e.edges, t;
		}
		function Ht(t) {
			return w.bool(t) ? (this.options.styleCursor = t, this) : null === t ? (delete this.options.styleCursor, this) : this.options.styleCursor;
		}
		function Kt(t) {
			return w.func(t) ? (this.options.actionChecker = t, this) : null === t ? (delete this.options.actionChecker, this) : this.options.actionChecker;
		}
		var $t = {
			id: "auto-start/interactableMethods",
			install: function(t) {
				var e = t.Interactable;
				e.prototype.getAction = function(e, n, r, i) {
					var o = function(t, e, n, r, i) {
						var s = {
							action: null,
							interactable: t,
							interaction: n,
							element: r,
							rect: t.getRect(r),
							buttons: e.buttons || {
								0: 1,
								1: 4,
								3: 8,
								4: 16
							}[e.button]
						};
						return i.fire("auto-start:check", s), s.action;
					}(this, n, r, i, t);
					return this.options.actionChecker ? this.options.actionChecker(e, n, o, this, i, r) : o;
				}, e.prototype.ignoreFrom = Nt((function(t) {
					return this._backCompatOption("ignoreFrom", t);
				}), "Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue})."), e.prototype.allowFrom = Nt((function(t) {
					return this._backCompatOption("allowFrom", t);
				}), "Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue})."), e.prototype.actionChecker = Kt, e.prototype.styleCursor = Ht;
			}
		};
		function Jt(t, e, n, r, i) {
			return e.testIgnoreAllow(e.options[t.name], n, r) && e.options[t.name].enabled && ee(e, n, t, i) ? t : null;
		}
		function Qt(t, e, n, r, i, o, a) {
			for (var s = 0, c = r.length; s < c; s++) {
				var l = r[s], u = i[s], p = l.getAction(e, n, t, u);
				if (p) {
					var f = Jt(p, l, u, o, a);
					if (f) return {
						action: f,
						interactable: l,
						element: u
					};
				}
			}
			return {
				action: null,
				interactable: null,
				element: null
			};
		}
		function Zt(t, e, n, r, i) {
			var o = [], a = [], s = r;
			function c(t) {
				o.push(t), a.push(s);
			}
			for (; w.element(s);) {
				o = [], a = [], i.interactables.forEachMatch(s, c);
				var l = Qt(t, e, n, o, a, r, i);
				if (l.action && !l.interactable.options[l.action.name].manualStart) return l;
				s = A(s);
			}
			return {
				action: null,
				interactable: null,
				element: null
			};
		}
		function te(t, e, n) {
			var r = e.action, i = e.interactable, o = e.element;
			r = r || { name: null }, t.interactable = i, t.element = o, Ut(t.prepared, r), t.rect = i && r.name ? i.getRect(o) : null, ie(t, n), n.fire("autoStart:prepared", { interaction: t });
		}
		function ee(t, e, n, r) {
			var i = t.options, o = i[n.name].max, a = i[n.name].maxPerElement, s = r.autoStart.maxInteractions, c = 0, l = 0, u = 0;
			if (!(o && a && s)) return !1;
			for (var p = 0, f = r.interactions.list; p < f.length; p++) {
				var d = f[p], h = d.prepared.name;
				if (d.interacting()) {
					if (++c >= s) return !1;
					if (d.interactable === t) {
						if ((l += h === n.name ? 1 : 0) >= o) return !1;
						if (d.element === e && (u++, h === n.name && u >= a)) return !1;
					}
				}
			}
			return s > 0;
		}
		function ne(t, e) {
			return w.number(t) ? (e.autoStart.maxInteractions = t, this) : e.autoStart.maxInteractions;
		}
		function re(t, e, n) {
			var r = n.autoStart.cursorElement;
			r && r !== t && (r.style.cursor = ""), t.ownerDocument.documentElement.style.cursor = e, t.style.cursor = e, n.autoStart.cursorElement = e ? t : null;
		}
		function ie(t, e) {
			var n = t.interactable, r = t.element, i = t.prepared;
			if ("mouse" === t.pointerType && n && n.options.styleCursor) {
				var o = "";
				if (i.name) {
					var a = n.options[i.name].cursorChecker;
					o = w.func(a) ? a(i, n, r, t._interacting) : e.actions.map[i.name].getCursor(i);
				}
				re(t.element, o || "", e);
			} else e.autoStart.cursorElement && re(e.autoStart.cursorElement, "", e);
		}
		var ae = {
			id: "auto-start/base",
			before: ["actions"],
			install: function(t) {
				var e = t.interactStatic, n = t.defaults;
				t.usePlugin($t), n.base.actionChecker = null, n.base.styleCursor = !0, V(n.perAction, {
					manualStart: !1,
					max: Infinity,
					maxPerElement: 1,
					allowFrom: null,
					ignoreFrom: null,
					mouseButtons: 1
				}), e.maxInteractions = function(e) {
					return ne(e, t);
				}, t.autoStart = {
					maxInteractions: Infinity,
					withinInteractionLimit: ee,
					cursorElement: null
				};
			},
			listeners: {
				"interactions:down": function(t, e) {
					var n = t.interaction, r = t.pointer, i = t.event, o = t.eventTarget;
					n.interacting() || te(n, Zt(n, r, i, o, e), e);
				},
				"interactions:move": function(t, e) {
					(function(t, e) {
						var n = t.interaction, r = t.pointer, i = t.event, o = t.eventTarget;
						"mouse" !== n.pointerType || n.pointerIsDown || n.interacting() || te(n, Zt(n, r, i, o, e), e);
					})(t, e), function(t, e) {
						var n = t.interaction;
						if (n.pointerIsDown && !n.interacting() && n.pointerWasMoved && n.prepared.name) {
							e.fire("autoStart:before-start", t);
							var r = n.interactable, i = n.prepared.name;
							i && r && (r.options[i].manualStart || !ee(r, n.element, n.prepared, e) ? n.stop() : (n.start(n.prepared, r, n.element), ie(n, e)));
						}
					}(t, e);
				},
				"interactions:stop": function(t, e) {
					var n = t.interaction, r = n.interactable;
					r && r.options.styleCursor && re(n.element, "", e);
				}
			},
			maxInteractions: ne,
			withinInteractionLimit: ee,
			validateAction: Jt
		};
		var se = {
			id: "auto-start/dragAxis",
			listeners: { "autoStart:before-start": function(t, e) {
				var n = t.interaction, r = t.eventTarget, i = t.dx, o = t.dy;
				if ("drag" === n.prepared.name) {
					var a = Math.abs(i), s = Math.abs(o), c = n.interactable.options.drag, l = c.startAxis, u = a > s ? "x" : a < s ? "y" : "xy";
					if (n.prepared.axis = "start" === c.lockAxis ? u[0] : c.lockAxis, "xy" !== u && "xy" !== l && l !== u) {
						n.prepared.name = null;
						for (var p = r, f = function(t) {
							if (t !== n.interactable) {
								var i = n.interactable.options.drag;
								if (!i.manualStart && t.testIgnoreAllow(i, p, r)) {
									var o = t.getAction(n.downPointer, n.downEvent, n, p);
									if (o && "drag" === o.name && function(t, e) {
										if (!e) return !1;
										var n = e.options.drag.startAxis;
										return "xy" === t || "xy" === n || n === t;
									}(u, t) && ae.validateAction(o, t, p, r, e)) return t;
								}
							}
						}; w.element(p);) {
							var d = e.interactables.forEachMatch(p, f);
							if (d) {
								n.prepared.name = "drag", n.interactable = d, n.element = p;
								break;
							}
							p = A(p);
						}
					}
				}
			} }
		};
		function ce(t) {
			var e = t.prepared && t.prepared.name;
			if (!e) return null;
			var n = t.interactable.options;
			return n[e].hold || n[e].delay;
		}
		var ue = {
			id: "auto-start/hold",
			install: function(t) {
				var e = t.defaults;
				t.usePlugin(ae), e.perAction.hold = 0, e.perAction.delay = 0;
			},
			listeners: {
				"interactions:new": function(t) {
					t.interaction.autoStartHoldTimer = null;
				},
				"autoStart:prepared": function(t) {
					var e = t.interaction, n = ce(e);
					n > 0 && (e.autoStartHoldTimer = setTimeout((function() {
						e.start(e.prepared, e.interactable, e.element);
					}), n));
				},
				"interactions:move": function(t) {
					var e = t.interaction, n = t.duplicate;
					e.autoStartHoldTimer && e.pointerWasMoved && !n && (clearTimeout(e.autoStartHoldTimer), e.autoStartHoldTimer = null);
				},
				"autoStart:before-start": function(t) {
					var e = t.interaction;
					ce(e) > 0 && (e.prepared.name = null);
				}
			},
			getHoldDuration: ce
		}, pe = {
			id: "auto-start",
			install: function(t) {
				t.usePlugin(ae), t.usePlugin(ue), t.usePlugin(se);
			}
		}, fe = function(t) {
			return /^(always|never|auto)$/.test(t) ? (this.options.preventDefault = t, this) : w.bool(t) ? (this.options.preventDefault = t ? "always" : "never", this) : this.options.preventDefault;
		};
		function de(t) {
			var e = t.interaction, n = t.event;
			e.interactable && e.interactable.checkAndPreventDefault(n);
		}
		var he = {
			id: "core/interactablePreventDefault",
			install: function(t) {
				var e = t.Interactable;
				e.prototype.preventDefault = fe, e.prototype.checkAndPreventDefault = function(e) {
					return function(t, e, n) {
						var r = t.options.preventDefault;
						if ("never" !== r) if ("always" !== r) {
							if (e.events.supportsPassive && /^touch(start|move)$/.test(n.type)) {
								var i = y(n.target).document, o = e.getDocOptions(i);
								if (!o || !o.events || !1 !== o.events.passive) return;
							}
							/^(mouse|pointer|touch)*(down|start)/i.test(n.type) || w.element(n.target) && R(n.target, "input,select,textarea,[contenteditable=true],[contenteditable=true] *") || n.preventDefault();
						} else n.preventDefault();
					}(this, t, e);
				}, t.interactions.docEvents.push({
					type: "dragstart",
					listener: function(e) {
						for (var n = 0, r = t.interactions.list; n < r.length; n++) {
							var i = r[n];
							if (i.element && (i.element === e.target || M(i.element, e.target))) return void i.interactable.checkAndPreventDefault(e);
						}
					}
				});
			},
			listeners: [
				"down",
				"move",
				"up",
				"cancel"
			].reduce((function(t, e) {
				return t["interactions:".concat(e)] = de, t;
			}), {})
		};
		function ve(t, e) {
			if (e.phaselessTypes[t]) return !0;
			for (var n in e.map) if (0 === t.indexOf(n) && t.substr(n.length) in e.phases) return !0;
			return !1;
		}
		function ge(t) {
			var e = {};
			for (var n in t) {
				var r = t[n];
				w.plainObject(r) ? e[n] = ge(r) : w.array(r) ? e[n] = mt(r) : e[n] = r;
			}
			return e;
		}
		var me = function() {
			function t(e) {
				r(this, t), this.states = [], this.startOffset = {
					left: 0,
					right: 0,
					top: 0,
					bottom: 0
				}, this.startDelta = void 0, this.result = void 0, this.endResult = void 0, this.startEdges = void 0, this.edges = void 0, this.interaction = void 0, this.interaction = e, this.result = ye(), this.edges = {
					left: !1,
					right: !1,
					top: !1,
					bottom: !1
				};
			}
			return o(t, [
				{
					key: "start",
					value: function(t, e) {
						var n, r, i = t.phase, o = this.interaction, a = function(t) {
							var e = t.interactable.options[t.prepared.name], n = e.modifiers;
							if (n && n.length) return n;
							return [
								"snap",
								"snapSize",
								"snapEdges",
								"restrict",
								"restrictEdges",
								"restrictSize"
							].map((function(t) {
								var n = e[t];
								return n && n.enabled && {
									options: n,
									methods: n._methods
								};
							})).filter((function(t) {
								return !!t;
							}));
						}(o);
						this.prepareStates(a), this.startEdges = V({}, o.edges), this.edges = V({}, this.startEdges), this.startOffset = (n = o.rect, r = e, n ? {
							left: r.x - n.left,
							top: r.y - n.top,
							right: n.right - r.x,
							bottom: n.bottom - r.y
						} : {
							left: 0,
							top: 0,
							right: 0,
							bottom: 0
						}), this.startDelta = {
							x: 0,
							y: 0
						};
						var s = this.fillArg({
							phase: i,
							pageCoords: e,
							preEnd: !1
						});
						return this.result = ye(), this.startAll(s), this.result = this.setAll(s);
					}
				},
				{
					key: "fillArg",
					value: function(t) {
						var e = this.interaction;
						return t.interaction = e, t.interactable = e.interactable, t.element = e.element, t.rect || (t.rect = e.rect), t.edges || (t.edges = this.startEdges), t.startOffset = this.startOffset, t;
					}
				},
				{
					key: "startAll",
					value: function(t) {
						for (var e = 0, n = this.states; e < n.length; e++) {
							var r = n[e];
							r.methods.start && (t.state = r, r.methods.start(t));
						}
					}
				},
				{
					key: "setAll",
					value: function(t) {
						var e = t.phase, n = t.preEnd, r = t.skipModifiers, i = t.rect, o = t.edges;
						t.coords = V({}, t.pageCoords), t.rect = V({}, i), t.edges = V({}, o);
						for (var a = r ? this.states.slice(r) : this.states, s = ye(t.coords, t.rect), c = 0; c < a.length; c++) {
							var l, u = a[c], p = u.options, f = V({}, t.coords), d = null;
							null != (l = u.methods) && l.set && this.shouldDo(p, n, e) && (t.state = u, d = u.methods.set(t), H(t.edges, t.rect, {
								x: t.coords.x - f.x,
								y: t.coords.y - f.y
							})), s.eventProps.push(d);
						}
						V(this.edges, t.edges), s.delta.x = t.coords.x - t.pageCoords.x, s.delta.y = t.coords.y - t.pageCoords.y, s.rectDelta.left = t.rect.left - i.left, s.rectDelta.right = t.rect.right - i.right, s.rectDelta.top = t.rect.top - i.top, s.rectDelta.bottom = t.rect.bottom - i.bottom;
						var h = this.result.coords, v = this.result.rect;
						if (h && v) s.changed = s.rect.left !== v.left || s.rect.right !== v.right || s.rect.top !== v.top || s.rect.bottom !== v.bottom || h.x !== s.coords.x || h.y !== s.coords.y;
						return s;
					}
				},
				{
					key: "applyToInteraction",
					value: function(t) {
						var e = this.interaction, n = t.phase, r = e.coords.cur, i = e.coords.start, o = this.result, a = this.startDelta, s = o.delta;
						"start" === n && V(this.startDelta, o.delta);
						for (var c = 0, l = [[i, a], [r, s]]; c < l.length; c++) {
							var u = l[c], p = u[0], f = u[1];
							p.page.x += f.x, p.page.y += f.y, p.client.x += f.x, p.client.y += f.y;
						}
						var d = this.result.rectDelta, h = t.rect || e.rect;
						h.left += d.left, h.right += d.right, h.top += d.top, h.bottom += d.bottom, h.width = h.right - h.left, h.height = h.bottom - h.top;
					}
				},
				{
					key: "setAndApply",
					value: function(t) {
						var e = this.interaction, n = t.phase, r = t.preEnd, i = t.skipModifiers, o = this.setAll(this.fillArg({
							preEnd: r,
							phase: n,
							pageCoords: t.modifiedCoords || e.coords.cur.page
						}));
						if (this.result = o, !o.changed && (!i || i < this.states.length) && e.interacting()) return !1;
						if (t.modifiedCoords) {
							var a = e.coords.cur.page, s = {
								x: t.modifiedCoords.x - a.x,
								y: t.modifiedCoords.y - a.y
							};
							o.coords.x += s.x, o.coords.y += s.y, o.delta.x += s.x, o.delta.y += s.y;
						}
						this.applyToInteraction(t);
					}
				},
				{
					key: "beforeEnd",
					value: function(t) {
						var e = t.interaction, n = t.event, r = this.states;
						if (r && r.length) {
							for (var i = !1, o = 0; o < r.length; o++) {
								var a = r[o];
								t.state = a;
								var s = a.options, c = a.methods, l = c.beforeEnd && c.beforeEnd(t);
								if (l) return this.endResult = l, !1;
								i = i || !i && this.shouldDo(s, !0, t.phase, !0);
							}
							i && e.move({
								event: n,
								preEnd: !0
							});
						}
					}
				},
				{
					key: "stop",
					value: function(t) {
						var e = t.interaction;
						if (this.states && this.states.length) {
							var n = V({
								states: this.states,
								interactable: e.interactable,
								element: e.element,
								rect: null
							}, t);
							this.fillArg(n);
							for (var r = 0, i = this.states; r < i.length; r++) {
								var o = i[r];
								n.state = o, o.methods.stop && o.methods.stop(n);
							}
							this.states = null, this.endResult = null;
						}
					}
				},
				{
					key: "prepareStates",
					value: function(t) {
						this.states = [];
						for (var e = 0; e < t.length; e++) {
							var n = t[e], r = n.options, i = n.methods, o = n.name;
							this.states.push({
								options: r,
								methods: i,
								index: e,
								name: o
							});
						}
						return this.states;
					}
				},
				{
					key: "restoreInteractionCoords",
					value: function(t) {
						var e = t.interaction, n = e.coords, r = e.rect, i = e.modification;
						if (i.result) {
							for (var o = i.startDelta, a = i.result, s = a.delta, c = a.rectDelta, l = 0, u = [[n.start, o], [n.cur, s]]; l < u.length; l++) {
								var p = u[l], f = p[0], d = p[1];
								f.page.x -= d.x, f.page.y -= d.y, f.client.x -= d.x, f.client.y -= d.y;
							}
							r.left -= c.left, r.right -= c.right, r.top -= c.top, r.bottom -= c.bottom;
						}
					}
				},
				{
					key: "shouldDo",
					value: function(t, e, n, r) {
						return !(!t || !1 === t.enabled || r && !t.endOnly || t.endOnly && !e || "start" === n && !t.setStart);
					}
				},
				{
					key: "copyFrom",
					value: function(t) {
						this.startOffset = t.startOffset, this.startDelta = t.startDelta, this.startEdges = t.startEdges, this.edges = t.edges, this.states = t.states.map((function(t) {
							return ge(t);
						})), this.result = ye(V({}, t.result.coords), V({}, t.result.rect));
					}
				},
				{
					key: "destroy",
					value: function() {
						for (var t in this) this[t] = null;
					}
				}
			]), t;
		}();
		function ye(t, e) {
			return {
				rect: e,
				coords: t,
				delta: {
					x: 0,
					y: 0
				},
				rectDelta: {
					left: 0,
					right: 0,
					top: 0,
					bottom: 0
				},
				eventProps: [],
				changed: !0
			};
		}
		function be(t, e) {
			var n = t.defaults, r = {
				start: t.start,
				set: t.set,
				beforeEnd: t.beforeEnd,
				stop: t.stop
			}, i = function(t) {
				var i = t || {};
				for (var o in i.enabled = !1 !== i.enabled, n) o in i || (i[o] = n[o]);
				var a = {
					options: i,
					methods: r,
					name: e,
					enable: function() {
						return i.enabled = !0, a;
					},
					disable: function() {
						return i.enabled = !1, a;
					}
				};
				return a;
			};
			return e && "string" == typeof e && (i._defaults = n, i._methods = r), i;
		}
		function xe(t) {
			var e = t.iEvent, n = t.interaction.modification.result;
			n && (e.modifiers = n.eventProps);
		}
		var Ee = {
			id: "modifiers/base",
			before: ["actions"],
			install: function(t) {
				t.defaults.perAction.modifiers = [];
			},
			listeners: {
				"interactions:new": function(t) {
					var e = t.interaction;
					e.modification = new me(e);
				},
				"interactions:before-action-start": function(t) {
					var e = t.interaction, n = t.interaction.modification;
					n.start(t, e.coords.start.page), e.edges = n.edges, n.applyToInteraction(t);
				},
				"interactions:before-action-move": function(t) {
					var e = t.interaction, n = e.modification, r = n.setAndApply(t);
					return e.edges = n.edges, r;
				},
				"interactions:before-action-end": function(t) {
					var e = t.interaction, n = e.modification, r = n.beforeEnd(t);
					return e.edges = n.startEdges, r;
				},
				"interactions:action-start": xe,
				"interactions:action-move": xe,
				"interactions:action-end": xe,
				"interactions:after-action-start": function(t) {
					return t.interaction.modification.restoreInteractionCoords(t);
				},
				"interactions:after-action-move": function(t) {
					return t.interaction.modification.restoreInteractionCoords(t);
				},
				"interactions:stop": function(t) {
					return t.interaction.modification.stop(t);
				}
			}
		}, Te = {
			base: {
				preventDefault: "auto",
				deltaSource: "page"
			},
			perAction: {
				enabled: !1,
				origin: {
					x: 0,
					y: 0
				}
			},
			actions: {}
		}, Se = function(t) {
			s(n, t);
			var e = p(n);
			function n(t, i, o, a, s, c, l) {
				var p;
				r(this, n), (p = e.call(this, t)).relatedTarget = null, p.screenX = void 0, p.screenY = void 0, p.button = void 0, p.buttons = void 0, p.ctrlKey = void 0, p.shiftKey = void 0, p.altKey = void 0, p.metaKey = void 0, p.page = void 0, p.client = void 0, p.delta = void 0, p.rect = void 0, p.x0 = void 0, p.y0 = void 0, p.t0 = void 0, p.dt = void 0, p.duration = void 0, p.clientX0 = void 0, p.clientY0 = void 0, p.velocity = void 0, p.speed = void 0, p.swipe = void 0, p.axes = void 0, p.preEnd = void 0, s = s || t.element;
				var f = t.interactable, d = (f && f.options || Te).deltaSource, h = K(f, s, o), v = "start" === a, g = "end" === a, m = v ? u(p) : t.prevEvent, y = v ? t.coords.start : g ? {
					page: m.page,
					client: m.client,
					timeStamp: t.coords.cur.timeStamp
				} : t.coords.cur;
				return p.page = V({}, y.page), p.client = V({}, y.client), p.rect = V({}, t.rect), p.timeStamp = y.timeStamp, g || (p.page.x -= h.x, p.page.y -= h.y, p.client.x -= h.x, p.client.y -= h.y), p.ctrlKey = i.ctrlKey, p.altKey = i.altKey, p.shiftKey = i.shiftKey, p.metaKey = i.metaKey, p.button = i.button, p.buttons = i.buttons, p.target = s, p.currentTarget = s, p.preEnd = c, p.type = l || o + (a || ""), p.interactable = f, p.t0 = v ? t.pointers[t.pointers.length - 1].downTime : m.t0, p.x0 = t.coords.start.page.x - h.x, p.y0 = t.coords.start.page.y - h.y, p.clientX0 = t.coords.start.client.x - h.x, p.clientY0 = t.coords.start.client.y - h.y, p.delta = v || g ? {
					x: 0,
					y: 0
				} : {
					x: p[d].x - m[d].x,
					y: p[d].y - m[d].y
				}, p.dt = t.coords.delta.timeStamp, p.duration = p.timeStamp - p.t0, p.velocity = V({}, t.coords.velocity[d]), p.speed = Q(p.velocity.x, p.velocity.y), p.swipe = g || "inertiastart" === a ? p.getSwipe() : null, p;
			}
			return o(n, [
				{
					key: "getSwipe",
					value: function() {
						var t = this._interaction;
						if (t.prevEvent.speed < 600 || this.timeStamp - t.prevEvent.timeStamp > 150) return null;
						var e = 180 * Math.atan2(t.prevEvent.velocityY, t.prevEvent.velocityX) / Math.PI;
						e < 0 && (e += 360);
						var n = 112.5 <= e && e < 247.5, r = 202.5 <= e && e < 337.5;
						return {
							up: r,
							down: !r && 22.5 <= e && e < 157.5,
							left: n,
							right: !n && (292.5 <= e || e < 67.5),
							angle: e,
							speed: t.prevEvent.speed,
							velocity: {
								x: t.prevEvent.velocityX,
								y: t.prevEvent.velocityY
							}
						};
					}
				},
				{
					key: "preventDefault",
					value: function() {}
				},
				{
					key: "stopImmediatePropagation",
					value: function() {
						this.immediatePropagationStopped = this.propagationStopped = !0;
					}
				},
				{
					key: "stopPropagation",
					value: function() {
						this.propagationStopped = !0;
					}
				}
			]), n;
		}(vt);
		Object.defineProperties(Se.prototype, {
			pageX: {
				get: function() {
					return this.page.x;
				},
				set: function(t) {
					this.page.x = t;
				}
			},
			pageY: {
				get: function() {
					return this.page.y;
				},
				set: function(t) {
					this.page.y = t;
				}
			},
			clientX: {
				get: function() {
					return this.client.x;
				},
				set: function(t) {
					this.client.x = t;
				}
			},
			clientY: {
				get: function() {
					return this.client.y;
				},
				set: function(t) {
					this.client.y = t;
				}
			},
			dx: {
				get: function() {
					return this.delta.x;
				},
				set: function(t) {
					this.delta.x = t;
				}
			},
			dy: {
				get: function() {
					return this.delta.y;
				},
				set: function(t) {
					this.delta.y = t;
				}
			},
			velocityX: {
				get: function() {
					return this.velocity.x;
				},
				set: function(t) {
					this.velocity.x = t;
				}
			},
			velocityY: {
				get: function() {
					return this.velocity.y;
				},
				set: function(t) {
					this.velocity.y = t;
				}
			}
		});
		var _e = o((function t(e, n, i, o, a) {
			r(this, t), this.id = void 0, this.pointer = void 0, this.event = void 0, this.downTime = void 0, this.downTarget = void 0, this.id = e, this.pointer = n, this.event = i, this.downTime = o, this.downTarget = a;
		})), Pe = function(t) {
			return t.interactable = "", t.element = "", t.prepared = "", t.pointerIsDown = "", t.pointerWasMoved = "", t._proxy = "", t;
		}({}), Oe = function(t) {
			return t.start = "", t.move = "", t.end = "", t.stop = "", t.interacting = "", t;
		}({}), ke = 0, De = function() {
			function t(e) {
				var n = this, i = e.pointerType, o = e.scopeFire;
				r(this, t), this.interactable = null, this.element = null, this.rect = null, this._rects = void 0, this.edges = null, this._scopeFire = void 0, this.prepared = {
					name: null,
					axis: null,
					edges: null
				}, this.pointerType = void 0, this.pointers = [], this.downEvent = null, this.downPointer = {}, this._latestPointer = {
					pointer: null,
					event: null,
					eventTarget: null
				}, this.prevEvent = null, this.pointerIsDown = !1, this.pointerWasMoved = !1, this._interacting = !1, this._ending = !1, this._stopped = !0, this._proxy = void 0, this.simulation = null, this.doMove = Nt((function(t) {
					this.move(t);
				}), "The interaction.doMove() method has been renamed to interaction.move()"), this.coords = {
					start: {
						page: {
							x: 0,
							y: 0
						},
						client: {
							x: 0,
							y: 0
						},
						timeStamp: 0
					},
					prev: {
						page: {
							x: 0,
							y: 0
						},
						client: {
							x: 0,
							y: 0
						},
						timeStamp: 0
					},
					cur: {
						page: {
							x: 0,
							y: 0
						},
						client: {
							x: 0,
							y: 0
						},
						timeStamp: 0
					},
					delta: {
						page: {
							x: 0,
							y: 0
						},
						client: {
							x: 0,
							y: 0
						},
						timeStamp: 0
					},
					velocity: {
						page: {
							x: 0,
							y: 0
						},
						client: {
							x: 0,
							y: 0
						},
						timeStamp: 0
					}
				}, this._id = ke++, this._scopeFire = o, this.pointerType = i;
				var a = this;
				this._proxy = {};
				var s = function(t) {
					Object.defineProperty(n._proxy, t, { get: function() {
						return a[t];
					} });
				};
				for (var c in Pe) s(c);
				var l = function(t) {
					Object.defineProperty(n._proxy, t, { value: function() {
						return a[t].apply(a, arguments);
					} });
				};
				for (var u in Oe) l(u);
				this._scopeFire("interactions:new", { interaction: this });
			}
			return o(t, [
				{
					key: "pointerMoveTolerance",
					get: function() {
						return 1;
					}
				},
				{
					key: "pointerDown",
					value: function(t, e, n) {
						var r = this.updatePointer(t, e, n, !0), i = this.pointers[r];
						this._scopeFire("interactions:down", {
							pointer: t,
							event: e,
							eventTarget: n,
							pointerIndex: r,
							pointerInfo: i,
							type: "down",
							interaction: this
						});
					}
				},
				{
					key: "start",
					value: function(t, e, n) {
						return !(this.interacting() || !this.pointerIsDown || this.pointers.length < ("gesture" === t.name ? 2 : 1) || !e.options[t.name].enabled) && (Ut(this.prepared, t), this.interactable = e, this.element = n, this.rect = e.getRect(n), this.edges = this.prepared.edges ? V({}, this.prepared.edges) : {
							left: !0,
							right: !0,
							top: !0,
							bottom: !0
						}, this._stopped = !1, this._interacting = this._doPhase({
							interaction: this,
							event: this.downEvent,
							phase: "start"
						}) && !this._stopped, this._interacting);
					}
				},
				{
					key: "pointerMove",
					value: function(t, e, n) {
						this.simulation || this.modification && this.modification.endResult || this.updatePointer(t, e, n, !1);
						var r, i, o = this.coords.cur.page.x === this.coords.prev.page.x && this.coords.cur.page.y === this.coords.prev.page.y && this.coords.cur.client.x === this.coords.prev.client.x && this.coords.cur.client.y === this.coords.prev.client.y;
						this.pointerIsDown && !this.pointerWasMoved && (r = this.coords.cur.client.x - this.coords.start.client.x, i = this.coords.cur.client.y - this.coords.start.client.y, this.pointerWasMoved = Q(r, i) > this.pointerMoveTolerance);
						var a, s, c, l = this.getPointerIndex(t), u = {
							pointer: t,
							pointerIndex: l,
							pointerInfo: this.pointers[l],
							event: e,
							type: "move",
							eventTarget: n,
							dx: r,
							dy: i,
							duplicate: o,
							interaction: this
						};
						o || (a = this.coords.velocity, s = this.coords.delta, c = Math.max(s.timeStamp / 1e3, .001), a.page.x = s.page.x / c, a.page.y = s.page.y / c, a.client.x = s.client.x / c, a.client.y = s.client.y / c, a.timeStamp = c), this._scopeFire("interactions:move", u), o || this.simulation || (this.interacting() && (u.type = null, this.move(u)), this.pointerWasMoved && et(this.coords.prev, this.coords.cur));
					}
				},
				{
					key: "move",
					value: function(t) {
						t && t.event || nt(this.coords.delta), (t = V({
							pointer: this._latestPointer.pointer,
							event: this._latestPointer.event,
							eventTarget: this._latestPointer.eventTarget,
							interaction: this
						}, t || {})).phase = "move", this._doPhase(t);
					}
				},
				{
					key: "pointerUp",
					value: function(t, e, n, r) {
						var i = this.getPointerIndex(t);
						-1 === i && (i = this.updatePointer(t, e, n, !1));
						var o = /cancel$/i.test(e.type) ? "cancel" : "up";
						this._scopeFire("interactions:".concat(o), {
							pointer: t,
							pointerIndex: i,
							pointerInfo: this.pointers[i],
							event: e,
							eventTarget: n,
							type: o,
							curEventTarget: r,
							interaction: this
						}), this.simulation || this.end(e), this.removePointer(t, e);
					}
				},
				{
					key: "documentBlur",
					value: function(t) {
						this.end(t), this._scopeFire("interactions:blur", {
							event: t,
							type: "blur",
							interaction: this
						});
					}
				},
				{
					key: "end",
					value: function(t) {
						var e;
						this._ending = !0, t = t || this._latestPointer.event, this.interacting() && (e = this._doPhase({
							event: t,
							interaction: this,
							phase: "end"
						})), this._ending = !1, !0 === e && this.stop();
					}
				},
				{
					key: "currentAction",
					value: function() {
						return this._interacting ? this.prepared.name : null;
					}
				},
				{
					key: "interacting",
					value: function() {
						return this._interacting;
					}
				},
				{
					key: "stop",
					value: function() {
						this._scopeFire("interactions:stop", { interaction: this }), this.interactable = this.element = null, this._interacting = !1, this._stopped = !0, this.prepared.name = this.prevEvent = null;
					}
				},
				{
					key: "getPointerIndex",
					value: function(t) {
						var e = at(t);
						return "mouse" === this.pointerType || "pen" === this.pointerType ? this.pointers.length - 1 : yt(this.pointers, (function(t) {
							return t.id === e;
						}));
					}
				},
				{
					key: "getPointerInfo",
					value: function(t) {
						return this.pointers[this.getPointerIndex(t)];
					}
				},
				{
					key: "updatePointer",
					value: function(t, e, n, r) {
						var i, o, a, s = at(t), c = this.getPointerIndex(t), l = this.pointers[c];
						return r = !1 !== r && (r || /(down|start)$/i.test(e.type)), l ? l.pointer = t : (l = new _e(s, t, e, null, null), c = this.pointers.length, this.pointers.push(l)), st(this.coords.cur, this.pointers.map((function(t) {
							return t.pointer;
						})), this._now()), i = this.coords.delta, o = this.coords.prev, a = this.coords.cur, i.page.x = a.page.x - o.page.x, i.page.y = a.page.y - o.page.y, i.client.x = a.client.x - o.client.x, i.client.y = a.client.y - o.client.y, i.timeStamp = a.timeStamp - o.timeStamp, r && (this.pointerIsDown = !0, l.downTime = this.coords.cur.timeStamp, l.downTarget = n, tt(this.downPointer, t), this.interacting() || (et(this.coords.start, this.coords.cur), et(this.coords.prev, this.coords.cur), this.downEvent = e, this.pointerWasMoved = !1)), this._updateLatestPointer(t, e, n), this._scopeFire("interactions:update-pointer", {
							pointer: t,
							event: e,
							eventTarget: n,
							down: r,
							pointerInfo: l,
							pointerIndex: c,
							interaction: this
						}), c;
					}
				},
				{
					key: "removePointer",
					value: function(t, e) {
						var n = this.getPointerIndex(t);
						if (-1 !== n) {
							var r = this.pointers[n];
							this._scopeFire("interactions:remove-pointer", {
								pointer: t,
								event: e,
								eventTarget: null,
								pointerIndex: n,
								pointerInfo: r,
								interaction: this
							}), this.pointers.splice(n, 1), this.pointerIsDown = !1;
						}
					}
				},
				{
					key: "_updateLatestPointer",
					value: function(t, e, n) {
						this._latestPointer.pointer = t, this._latestPointer.event = e, this._latestPointer.eventTarget = n;
					}
				},
				{
					key: "destroy",
					value: function() {
						this._latestPointer.pointer = null, this._latestPointer.event = null, this._latestPointer.eventTarget = null;
					}
				},
				{
					key: "_createPreparedEvent",
					value: function(t, e, n, r) {
						return new Se(this, t, this.prepared.name, e, this.element, n, r);
					}
				},
				{
					key: "_fireEvent",
					value: function(t) {
						var e;
						null == (e = this.interactable) || e.fire(t), (!this.prevEvent || t.timeStamp >= this.prevEvent.timeStamp) && (this.prevEvent = t);
					}
				},
				{
					key: "_doPhase",
					value: function(t) {
						var e = t.event, n = t.phase, r = t.preEnd, i = t.type, o = this.rect;
						if (o && "move" === n && (H(this.edges, o, this.coords.delta[this.interactable.options.deltaSource]), o.width = o.right - o.left, o.height = o.bottom - o.top), !1 === this._scopeFire("interactions:before-action-".concat(n), t)) return !1;
						var a = t.iEvent = this._createPreparedEvent(e, n, r, i);
						return this._scopeFire("interactions:action-".concat(n), t), "start" === n && (this.prevEvent = a), this._fireEvent(a), this._scopeFire("interactions:after-action-".concat(n), t), !0;
					}
				},
				{
					key: "_now",
					value: function() {
						return Date.now();
					}
				}
			]), t;
		}();
		function Ie(t) {
			Me(t.interaction);
		}
		function Me(t) {
			if (!function(t) {
				return !(!t.offset.pending.x && !t.offset.pending.y);
			}(t)) return !1;
			var e = t.offset.pending;
			return Ae(t.coords.cur, e), Ae(t.coords.delta, e), H(t.edges, t.rect, e), e.x = 0, e.y = 0, !0;
		}
		function ze(t) {
			var e = t.x, n = t.y;
			this.offset.pending.x += e, this.offset.pending.y += n, this.offset.total.x += e, this.offset.total.y += n;
		}
		function Ae(t, e) {
			var n = t.page, r = t.client, i = e.x, o = e.y;
			n.x += i, n.y += o, r.x += i, r.y += o;
		}
		Oe.offsetBy = "";
		var Ce = {
			id: "offset",
			before: [
				"modifiers",
				"pointer-events",
				"actions",
				"inertia"
			],
			install: function(t) {
				t.Interaction.prototype.offsetBy = ze;
			},
			listeners: {
				"interactions:new": function(t) {
					t.interaction.offset = {
						total: {
							x: 0,
							y: 0
						},
						pending: {
							x: 0,
							y: 0
						}
					};
				},
				"interactions:update-pointer": function(t) {
					return function(t) {
						t.pointerIsDown && (Ae(t.coords.cur, t.offset.total), t.offset.pending.x = 0, t.offset.pending.y = 0);
					}(t.interaction);
				},
				"interactions:before-action-start": Ie,
				"interactions:before-action-move": Ie,
				"interactions:before-action-end": function(t) {
					var e = t.interaction;
					if (Me(e)) return e.move({ offset: !0 }), e.end(), !1;
				},
				"interactions:stop": function(t) {
					var e = t.interaction;
					e.offset.total.x = 0, e.offset.total.y = 0, e.offset.pending.x = 0, e.offset.pending.y = 0;
				}
			}
		};
		var je = function() {
			function t(e) {
				r(this, t), this.active = !1, this.isModified = !1, this.smoothEnd = !1, this.allowResume = !1, this.modification = void 0, this.modifierCount = 0, this.modifierArg = void 0, this.startCoords = void 0, this.t0 = 0, this.v0 = 0, this.te = 0, this.targetOffset = void 0, this.modifiedOffset = void 0, this.currentOffset = void 0, this.lambda_v0 = 0, this.one_ve_v0 = 0, this.timeout = void 0, this.interaction = void 0, this.interaction = e;
			}
			return o(t, [
				{
					key: "start",
					value: function(t) {
						var e = this.interaction, n = Fe(e);
						if (!n || !n.enabled) return !1;
						var r = e.coords.velocity.client, i = Q(r.x, r.y), o = this.modification || (this.modification = new me(e));
						if (o.copyFrom(e.modification), this.t0 = e._now(), this.allowResume = n.allowResume, this.v0 = i, this.currentOffset = {
							x: 0,
							y: 0
						}, this.startCoords = e.coords.cur.page, this.modifierArg = o.fillArg({
							pageCoords: this.startCoords,
							preEnd: !0,
							phase: "inertiastart"
						}), this.t0 - e.coords.cur.timeStamp < 50 && i > n.minSpeed && i > n.endSpeed) this.startInertia();
						else {
							if (o.result = o.setAll(this.modifierArg), !o.result.changed) return !1;
							this.startSmoothEnd();
						}
						return e.modification.result.rect = null, e.offsetBy(this.targetOffset), e._doPhase({
							interaction: e,
							event: t,
							phase: "inertiastart"
						}), e.offsetBy({
							x: -this.targetOffset.x,
							y: -this.targetOffset.y
						}), e.modification.result.rect = null, this.active = !0, e.simulation = this, !0;
					}
				},
				{
					key: "startInertia",
					value: function() {
						var t = this, e = this.interaction.coords.velocity.client, n = Fe(this.interaction), r = n.resistance, i = -Math.log(n.endSpeed / this.v0) / r;
						this.targetOffset = {
							x: (e.x - i) / r,
							y: (e.y - i) / r
						}, this.te = i, this.lambda_v0 = r / this.v0, this.one_ve_v0 = 1 - n.endSpeed / this.v0;
						var o = this.modification, a = this.modifierArg;
						a.pageCoords = {
							x: this.startCoords.x + this.targetOffset.x,
							y: this.startCoords.y + this.targetOffset.y
						}, o.result = o.setAll(a), o.result.changed && (this.isModified = !0, this.modifiedOffset = {
							x: this.targetOffset.x + o.result.delta.x,
							y: this.targetOffset.y + o.result.delta.y
						}), this.onNextFrame((function() {
							return t.inertiaTick();
						}));
					}
				},
				{
					key: "startSmoothEnd",
					value: function() {
						var t = this;
						this.smoothEnd = !0, this.isModified = !0, this.targetOffset = {
							x: this.modification.result.delta.x,
							y: this.modification.result.delta.y
						}, this.onNextFrame((function() {
							return t.smoothEndTick();
						}));
					}
				},
				{
					key: "onNextFrame",
					value: function(t) {
						var e = this;
						this.timeout = Lt.request((function() {
							e.active && t();
						}));
					}
				},
				{
					key: "inertiaTick",
					value: function() {
						var t, e, n, r, i, o, a, s = this, c = this.interaction, l = Fe(c).resistance, u = (c._now() - this.t0) / 1e3;
						if (u < this.te) {
							var p, f = 1 - (Math.exp(-l * u) - this.lambda_v0) / this.one_ve_v0;
							this.isModified ? (t = 0, e = 0, n = this.targetOffset.x, r = this.targetOffset.y, i = this.modifiedOffset.x, o = this.modifiedOffset.y, p = {
								x: Ye(a = f, t, n, i),
								y: Ye(a, e, r, o)
							}) : p = {
								x: this.targetOffset.x * f,
								y: this.targetOffset.y * f
							};
							var d = {
								x: p.x - this.currentOffset.x,
								y: p.y - this.currentOffset.y
							};
							this.currentOffset.x += d.x, this.currentOffset.y += d.y, c.offsetBy(d), c.move(), this.onNextFrame((function() {
								return s.inertiaTick();
							}));
						} else c.offsetBy({
							x: this.modifiedOffset.x - this.currentOffset.x,
							y: this.modifiedOffset.y - this.currentOffset.y
						}), this.end();
					}
				},
				{
					key: "smoothEndTick",
					value: function() {
						var t = this, e = this.interaction, n = e._now() - this.t0, r = Fe(e).smoothEndDuration;
						if (n < r) {
							var i = {
								x: Le(n, 0, this.targetOffset.x, r),
								y: Le(n, 0, this.targetOffset.y, r)
							}, o = {
								x: i.x - this.currentOffset.x,
								y: i.y - this.currentOffset.y
							};
							this.currentOffset.x += o.x, this.currentOffset.y += o.y, e.offsetBy(o), e.move({ skipModifiers: this.modifierCount }), this.onNextFrame((function() {
								return t.smoothEndTick();
							}));
						} else e.offsetBy({
							x: this.targetOffset.x - this.currentOffset.x,
							y: this.targetOffset.y - this.currentOffset.y
						}), this.end();
					}
				},
				{
					key: "resume",
					value: function(t) {
						var e = t.pointer, n = t.event, r = t.eventTarget, i = this.interaction;
						i.offsetBy({
							x: -this.currentOffset.x,
							y: -this.currentOffset.y
						}), i.updatePointer(e, n, r, !0), i._doPhase({
							interaction: i,
							event: n,
							phase: "resume"
						}), et(i.coords.prev, i.coords.cur), this.stop();
					}
				},
				{
					key: "end",
					value: function() {
						this.interaction.move(), this.interaction.end(), this.stop();
					}
				},
				{
					key: "stop",
					value: function() {
						this.active = this.smoothEnd = !1, this.interaction.simulation = null, Lt.cancel(this.timeout);
					}
				}
			]), t;
		}();
		function Fe(t) {
			var e = t.interactable, n = t.prepared;
			return e && e.options && n.name && e.options[n.name].inertia;
		}
		var Xe = {
			id: "inertia",
			before: ["modifiers", "actions"],
			install: function(t) {
				var e = t.defaults;
				t.usePlugin(Ce), t.usePlugin(Ee), t.actions.phases.inertiastart = !0, t.actions.phases.resume = !0, e.perAction.inertia = {
					enabled: !1,
					resistance: 10,
					minSpeed: 100,
					endSpeed: 10,
					allowResume: !0,
					smoothEndDuration: 300
				};
			},
			listeners: {
				"interactions:new": function(t) {
					var e = t.interaction;
					e.inertia = new je(e);
				},
				"interactions:before-action-end": function(t) {
					var e = t.interaction, n = t.event;
					return (!e._interacting || e.simulation || !e.inertia.start(n)) && null;
				},
				"interactions:down": function(t) {
					var e = t.interaction, n = t.eventTarget, r = e.inertia;
					if (r.active) for (var i = n; w.element(i);) {
						if (i === e.element) {
							r.resume(t);
							break;
						}
						i = A(i);
					}
				},
				"interactions:stop": function(t) {
					var e = t.interaction.inertia;
					e.active && e.stop();
				},
				"interactions:before-action-resume": function(t) {
					var e = t.interaction.modification;
					e.stop(t), e.start(t, t.interaction.coords.cur.page), e.applyToInteraction(t);
				},
				"interactions:before-action-inertiastart": function(t) {
					return t.interaction.modification.setAndApply(t);
				},
				"interactions:action-resume": xe,
				"interactions:action-inertiastart": xe,
				"interactions:after-action-inertiastart": function(t) {
					return t.interaction.modification.restoreInteractionCoords(t);
				},
				"interactions:after-action-resume": function(t) {
					return t.interaction.modification.restoreInteractionCoords(t);
				}
			}
		};
		function Ye(t, e, n, r) {
			var i = 1 - t;
			return i * i * e + 2 * i * t * n + t * t * r;
		}
		function Le(t, e, n, r) {
			return -n * (t /= r) * (t - 2) + e;
		}
		var qe = Xe;
		function Be(t, e) {
			for (var n = 0; n < e.length; n++) {
				var r = e[n];
				if (t.immediatePropagationStopped) break;
				r(t);
			}
		}
		var Ve = function() {
			function t(e) {
				r(this, t), this.options = void 0, this.types = {}, this.propagationStopped = !1, this.immediatePropagationStopped = !1, this.global = void 0, this.options = V({}, e || {});
			}
			return o(t, [
				{
					key: "fire",
					value: function(t) {
						var e, n = this.global;
						(e = this.types[t.type]) && Be(t, e), !t.propagationStopped && n && (e = n[t.type]) && Be(t, e);
					}
				},
				{
					key: "on",
					value: function(t, e) {
						var n = $(t, e);
						for (t in n) this.types[t] = gt(this.types[t] || [], n[t]);
					}
				},
				{
					key: "off",
					value: function(t, e) {
						var n = $(t, e);
						for (t in n) {
							var r = this.types[t];
							if (r && r.length) for (var i = 0, o = n[t]; i < o.length; i++) {
								var a = o[i], s = r.indexOf(a);
								-1 !== s && r.splice(s, 1);
							}
						}
					}
				},
				{
					key: "getRect",
					value: function(t) {
						return null;
					}
				}
			]), t;
		}();
		var We = function() {
			function t(e) {
				r(this, t), this.currentTarget = void 0, this.originalEvent = void 0, this.type = void 0, this.originalEvent = e, tt(this, e);
			}
			return o(t, [
				{
					key: "preventOriginalDefault",
					value: function() {
						this.originalEvent.preventDefault();
					}
				},
				{
					key: "stopPropagation",
					value: function() {
						this.originalEvent.stopPropagation();
					}
				},
				{
					key: "stopImmediatePropagation",
					value: function() {
						this.originalEvent.stopImmediatePropagation();
					}
				}
			]), t;
		}();
		function Ge(t) {
			return w.object(t) ? {
				capture: !!t.capture,
				passive: !!t.passive
			} : {
				capture: !!t,
				passive: !1
			};
		}
		function Ne(t, e) {
			return t === e || ("boolean" == typeof t ? !!e.capture === t && !1 == !!e.passive : !!t.capture == !!e.capture && !!t.passive == !!e.passive);
		}
		var Ue = {
			id: "events",
			install: function(t) {
				var e, n = [], r = {}, i = [], o = {
					add: a,
					remove: s,
					addDelegate: function(t, e, n, o, s) {
						var u = Ge(s);
						if (!r[n]) {
							r[n] = [];
							for (var p = 0; p < i.length; p++) {
								var f = i[p];
								a(f, n, c), a(f, n, l, !0);
							}
						}
						var d = r[n], h = bt(d, (function(n) {
							return n.selector === t && n.context === e;
						}));
						h || (h = {
							selector: t,
							context: e,
							listeners: []
						}, d.push(h));
						h.listeners.push({
							func: o,
							options: u
						});
					},
					removeDelegate: function(t, e, n, i, o) {
						var a, u = Ge(o), p = r[n], f = !1;
						if (!p) return;
						for (a = p.length - 1; a >= 0; a--) {
							var d = p[a];
							if (d.selector === t && d.context === e) {
								for (var h = d.listeners, v = h.length - 1; v >= 0; v--) {
									var g = h[v];
									if (g.func === i && Ne(g.options, u)) {
										h.splice(v, 1), h.length || (p.splice(a, 1), s(e, n, c), s(e, n, l, !0)), f = !0;
										break;
									}
								}
								if (f) break;
							}
						}
					},
					delegateListener: c,
					delegateUseCapture: l,
					delegatedEvents: r,
					documents: i,
					targets: n,
					supportsOptions: !1,
					supportsPassive: !1
				};
				function a(t, e, r, i) {
					if (t.addEventListener) {
						var a = Ge(i), s = bt(n, (function(e) {
							return e.eventTarget === t;
						}));
						s || (s = {
							eventTarget: t,
							events: {}
						}, n.push(s)), s.events[e] || (s.events[e] = []), bt(s.events[e], (function(t) {
							return t.func === r && Ne(t.options, a);
						})) || (t.addEventListener(e, r, o.supportsOptions ? a : a.capture), s.events[e].push({
							func: r,
							options: a
						}));
					}
				}
				function s(t, e, r, i) {
					if (t.addEventListener && t.removeEventListener) {
						var a = yt(n, (function(e) {
							return e.eventTarget === t;
						})), c = n[a];
						if (c && c.events) if ("all" !== e) {
							var l = !1, u = c.events[e];
							if (u) {
								if ("all" === r) {
									for (var p = u.length - 1; p >= 0; p--) {
										var f = u[p];
										s(t, e, f.func, f.options);
									}
									return;
								}
								for (var d = Ge(i), h = 0; h < u.length; h++) {
									var v = u[h];
									if (v.func === r && Ne(v.options, d)) {
										t.removeEventListener(e, r, o.supportsOptions ? d : d.capture), u.splice(h, 1), 0 === u.length && (delete c.events[e], l = !0);
										break;
									}
								}
							}
							l && !Object.keys(c.events).length && n.splice(a, 1);
						} else for (e in c.events) c.events.hasOwnProperty(e) && s(t, e, "all");
					}
				}
				function c(t, e) {
					for (var n = Ge(e), i = new We(t), o = r[t.type], a = ht(t)[0], s = a; w.element(s);) {
						for (var c = 0; c < o.length; c++) {
							var l = o[c], u = l.selector, p = l.context;
							if (R(s, u) && M(p, a) && M(p, s)) {
								var f = l.listeners;
								i.currentTarget = s;
								for (var d = 0; d < f.length; d++) {
									var h = f[d];
									Ne(h.options, n) && h.func(i);
								}
							}
						}
						s = A(s);
					}
				}
				function l(t) {
					return c(t, !0);
				}
				return null == (e = t.document) || e.createElement("div").addEventListener("test", null, {
					get capture() {
						return o.supportsOptions = !0;
					},
					get passive() {
						return o.supportsPassive = !0;
					}
				}), t.events = o, o;
			}
		}, He = {
			methodOrder: [
				"simulationResume",
				"mouseOrPen",
				"hasPointer",
				"idle"
			],
			search: function(t) {
				for (var e = 0, n = He.methodOrder; e < n.length; e++) {
					var i = He[n[e]](t);
					if (i) return i;
				}
				return null;
			},
			simulationResume: function(t) {
				var e = t.pointerType, n = t.eventType, r = t.eventTarget, i = t.scope;
				if (!/down|start/i.test(n)) return null;
				for (var o = 0, a = i.interactions.list; o < a.length; o++) {
					var s = a[o], c = r;
					if (s.simulation && s.simulation.allowResume && s.pointerType === e) for (; c;) {
						if (c === s.element) return s;
						c = A(c);
					}
				}
				return null;
			},
			mouseOrPen: function(t) {
				var e, n = t.pointerId, r = t.pointerType, i = t.eventType, o = t.scope;
				if ("mouse" !== r && "pen" !== r) return null;
				for (var a = 0, s = o.interactions.list; a < s.length; a++) {
					var c = s[a];
					if (c.pointerType === r) {
						if (c.simulation && !Ke(c, n)) continue;
						if (c.interacting()) return c;
						e || (e = c);
					}
				}
				if (e) return e;
				for (var l = 0, u = o.interactions.list; l < u.length; l++) {
					var p = u[l];
					if (!(p.pointerType !== r || /down/i.test(i) && p.simulation)) return p;
				}
				return null;
			},
			hasPointer: function(t) {
				for (var e = t.pointerId, n = 0, r = t.scope.interactions.list; n < r.length; n++) {
					var i = r[n];
					if (Ke(i, e)) return i;
				}
				return null;
			},
			idle: function(t) {
				for (var e = t.pointerType, n = 0, r = t.scope.interactions.list; n < r.length; n++) {
					var i = r[n];
					if (1 === i.pointers.length) {
						var o = i.interactable;
						if (o && (!o.options.gesture || !o.options.gesture.enabled)) continue;
					} else if (i.pointers.length >= 2) continue;
					if (!i.interacting() && e === i.pointerType) return i;
				}
				return null;
			}
		};
		function Ke(t, e) {
			return t.pointers.some((function(t) {
				return t.id === e;
			}));
		}
		var $e = He, Je = [
			"pointerDown",
			"pointerMove",
			"pointerUp",
			"updatePointer",
			"removePointer",
			"windowBlur"
		];
		function Qe(t, e) {
			return function(n) {
				var r = e.interactions.list, i = dt(n), o = ht(n), a = o[0], s = o[1], c = [];
				if (/^touch/.test(n.type)) {
					e.prevTouchTime = e.now();
					for (var l = 0, u = n.changedTouches; l < u.length; l++) {
						var p = u[l], f = {
							pointer: p,
							pointerId: at(p),
							pointerType: i,
							eventType: n.type,
							eventTarget: a,
							curEventTarget: s,
							scope: e
						}, d = Ze(f);
						c.push([
							f.pointer,
							f.eventTarget,
							f.curEventTarget,
							d
						]);
					}
				} else {
					var h = !1;
					if (!I.supportsPointerEvent && /mouse/.test(n.type)) {
						for (var v = 0; v < r.length && !h; v++) h = "mouse" !== r[v].pointerType && r[v].pointerIsDown;
						h = h || e.now() - e.prevTouchTime < 500 || 0 === n.timeStamp;
					}
					if (!h) {
						var g = {
							pointer: n,
							pointerId: at(n),
							pointerType: i,
							eventType: n.type,
							curEventTarget: s,
							eventTarget: a,
							scope: e
						}, m = Ze(g);
						c.push([
							g.pointer,
							g.eventTarget,
							g.curEventTarget,
							m
						]);
					}
				}
				for (var y = 0; y < c.length; y++) {
					var b = c[y], x = b[0], w = b[1], E = b[2];
					b[3][t](x, n, w, E);
				}
			};
		}
		function Ze(t) {
			var e = t.pointerType, n = t.scope, r = {
				interaction: $e.search(t),
				searchDetails: t
			};
			return n.fire("interactions:find", r), r.interaction || n.interactions.new({ pointerType: e });
		}
		function tn(t, e) {
			var n = t.doc, r = t.scope, i = t.options, o = r.interactions.docEvents, a = r.events, s = a[e];
			for (var c in r.browser.isIOS && !i.events && (i.events = { passive: !1 }), a.delegatedEvents) s(n, c, a.delegateListener), s(n, c, a.delegateUseCapture, !0);
			for (var l = i && i.events, u = 0; u < o.length; u++) {
				var p = o[u];
				s(n, p.type, p.listener, l);
			}
		}
		var nn = {
			id: "core/interactions",
			install: function(t) {
				for (var e = {}, n = 0; n < Je.length; n++) {
					var i = Je[n];
					e[i] = Qe(i, t);
				}
				var a, c = I.pEventTypes;
				function l() {
					for (var e = 0, n = t.interactions.list; e < n.length; e++) {
						var r = n[e];
						if (r.pointerIsDown && "touch" === r.pointerType && !r._interacting) for (var i = function() {
							var e = a[o];
							t.documents.some((function(t) {
								return M(t.doc, e.downTarget);
							})) || r.removePointer(e.pointer, e.event);
						}, o = 0, a = r.pointers; o < a.length; o++) i();
					}
				}
				(a = k.PointerEvent ? [
					{
						type: c.down,
						listener: l
					},
					{
						type: c.down,
						listener: e.pointerDown
					},
					{
						type: c.move,
						listener: e.pointerMove
					},
					{
						type: c.up,
						listener: e.pointerUp
					},
					{
						type: c.cancel,
						listener: e.pointerUp
					}
				] : [
					{
						type: "mousedown",
						listener: e.pointerDown
					},
					{
						type: "mousemove",
						listener: e.pointerMove
					},
					{
						type: "mouseup",
						listener: e.pointerUp
					},
					{
						type: "touchstart",
						listener: l
					},
					{
						type: "touchstart",
						listener: e.pointerDown
					},
					{
						type: "touchmove",
						listener: e.pointerMove
					},
					{
						type: "touchend",
						listener: e.pointerUp
					},
					{
						type: "touchcancel",
						listener: e.pointerUp
					}
				]).push({
					type: "blur",
					listener: function(e) {
						for (var n = 0, r = t.interactions.list; n < r.length; n++) r[n].documentBlur(e);
					}
				}), t.prevTouchTime = 0, t.Interaction = function(e) {
					s(i, e);
					var n = p(i);
					function i() {
						return r(this, i), n.apply(this, arguments);
					}
					return o(i, [{
						key: "pointerMoveTolerance",
						get: function() {
							return t.interactions.pointerMoveTolerance;
						},
						set: function(e) {
							t.interactions.pointerMoveTolerance = e;
						}
					}, {
						key: "_now",
						value: function() {
							return t.now();
						}
					}]), i;
				}(De), t.interactions = {
					list: [],
					new: function(e) {
						e.scopeFire = function(e, n) {
							return t.fire(e, n);
						};
						var n = new t.Interaction(e);
						return t.interactions.list.push(n), n;
					},
					listeners: e,
					docEvents: a,
					pointerMoveTolerance: 1
				}, t.usePlugin(he);
			},
			listeners: {
				"scope:add-document": function(t) {
					return tn(t, "add");
				},
				"scope:remove-document": function(t) {
					return tn(t, "remove");
				},
				"interactable:unset": function(t, e) {
					for (var n = t.interactable, r = e.interactions.list.length - 1; r >= 0; r--) {
						var i = e.interactions.list[r];
						i.interactable === n && (i.stop(), e.fire("interactions:destroy", { interaction: i }), i.destroy(), e.interactions.list.length > 2 && e.interactions.list.splice(r, 1));
					}
				}
			},
			onDocSignal: tn,
			doOnInteractions: Qe,
			methodNames: Je
		}, rn = function(t) {
			return t[t.On = 0] = "On", t[t.Off = 1] = "Off", t;
		}(rn || {}), on = function() {
			function t(e, n, i, o) {
				r(this, t), this.target = void 0, this.options = void 0, this._actions = void 0, this.events = new Ve(), this._context = void 0, this._win = void 0, this._doc = void 0, this._scopeEvents = void 0, this._actions = n.actions, this.target = e, this._context = n.context || i, this._win = y(B(e) ? this._context : e), this._doc = this._win.document, this._scopeEvents = o, this.set(n);
			}
			return o(t, [
				{
					key: "_defaults",
					get: function() {
						return {
							base: {},
							perAction: {},
							actions: {}
						};
					}
				},
				{
					key: "setOnEvents",
					value: function(t, e) {
						return w.func(e.onstart) && this.on("".concat(t, "start"), e.onstart), w.func(e.onmove) && this.on("".concat(t, "move"), e.onmove), w.func(e.onend) && this.on("".concat(t, "end"), e.onend), w.func(e.oninertiastart) && this.on("".concat(t, "inertiastart"), e.oninertiastart), this;
					}
				},
				{
					key: "updatePerActionListeners",
					value: function(t, e, n) {
						var r, i = this, o = null == (r = this._actions.map[t]) ? void 0 : r.filterEventType, a = function(t) {
							return (null == o || o(t)) && ve(t, i._actions);
						};
						(w.array(e) || w.object(e)) && this._onOff(rn.Off, t, e, void 0, a), (w.array(n) || w.object(n)) && this._onOff(rn.On, t, n, void 0, a);
					}
				},
				{
					key: "setPerAction",
					value: function(t, e) {
						var n = this._defaults;
						for (var r in e) {
							var i = r, o = this.options[t], a = e[i];
							"listeners" === i && this.updatePerActionListeners(t, o.listeners, a), w.array(a) ? o[i] = mt(a) : w.plainObject(a) ? (o[i] = V(o[i] || {}, ge(a)), w.object(n.perAction[i]) && "enabled" in n.perAction[i] && (o[i].enabled = !1 !== a.enabled)) : w.bool(a) && w.object(n.perAction[i]) ? o[i].enabled = a : o[i] = a;
						}
					}
				},
				{
					key: "getRect",
					value: function(t) {
						return t = t || (w.element(this.target) ? this.target : null), w.string(this.target) && (t = t || this._context.querySelector(this.target)), L(t);
					}
				},
				{
					key: "rectChecker",
					value: function(t) {
						var e = this;
						return w.func(t) ? (this.getRect = function(n) {
							var r = V({}, t.call(e, n));
							return "width" in r || (r.width = r.right - r.left, r.height = r.bottom - r.top), r;
						}, this) : null === t ? (delete this.getRect, this) : this.getRect;
					}
				},
				{
					key: "_backCompatOption",
					value: function(t, e) {
						if (B(e) || w.object(e)) {
							for (var n in this.options[t] = e, this._actions.map) this.options[n][t] = e;
							return this;
						}
						return this.options[t];
					}
				},
				{
					key: "origin",
					value: function(t) {
						return this._backCompatOption("origin", t);
					}
				},
				{
					key: "deltaSource",
					value: function(t) {
						return "page" === t || "client" === t ? (this.options.deltaSource = t, this) : this.options.deltaSource;
					}
				},
				{
					key: "getAllElements",
					value: function() {
						var t = this.target;
						return w.string(t) ? Array.from(this._context.querySelectorAll(t)) : w.func(t) && t.getAllElements ? t.getAllElements() : w.element(t) ? [t] : [];
					}
				},
				{
					key: "context",
					value: function() {
						return this._context;
					}
				},
				{
					key: "inContext",
					value: function(t) {
						return this._context === t.ownerDocument || M(this._context, t);
					}
				},
				{
					key: "testIgnoreAllow",
					value: function(t, e, n) {
						return !this.testIgnore(t.ignoreFrom, e, n) && this.testAllow(t.allowFrom, e, n);
					}
				},
				{
					key: "testAllow",
					value: function(t, e, n) {
						return !t || !!w.element(n) && (w.string(t) ? F(n, t, e) : !!w.element(t) && M(t, n));
					}
				},
				{
					key: "testIgnore",
					value: function(t, e, n) {
						return !(!t || !w.element(n)) && (w.string(t) ? F(n, t, e) : !!w.element(t) && M(t, n));
					}
				},
				{
					key: "fire",
					value: function(t) {
						return this.events.fire(t), this;
					}
				},
				{
					key: "_onOff",
					value: function(t, e, n, r, i) {
						w.object(e) && !w.array(e) && (r = n, n = null);
						var o = $(e, n, i);
						for (var a in o) {
							"wheel" === a && (a = I.wheelEvent);
							for (var s = 0, c = o[a]; s < c.length; s++) {
								var l = c[s];
								ve(a, this._actions) ? this.events[t === rn.On ? "on" : "off"](a, l) : w.string(this.target) ? this._scopeEvents[t === rn.On ? "addDelegate" : "removeDelegate"](this.target, this._context, a, l, r) : this._scopeEvents[t === rn.On ? "add" : "remove"](this.target, a, l, r);
							}
						}
						return this;
					}
				},
				{
					key: "on",
					value: function(t, e, n) {
						return this._onOff(rn.On, t, e, n);
					}
				},
				{
					key: "off",
					value: function(t, e, n) {
						return this._onOff(rn.Off, t, e, n);
					}
				},
				{
					key: "set",
					value: function(t) {
						var e = this._defaults;
						for (var n in w.object(t) || (t = {}), this.options = ge(e.base), this._actions.methodDict) {
							var r = n, i = this._actions.methodDict[r];
							this.options[r] = {}, this.setPerAction(r, V(V({}, e.perAction), e.actions[r])), this[i](t[r]);
						}
						for (var o in t) "getRect" !== o ? w.func(this[o]) && this[o](t[o]) : this.rectChecker(t.getRect);
						return this;
					}
				},
				{
					key: "unset",
					value: function() {
						if (w.string(this.target)) for (var t in this._scopeEvents.delegatedEvents) for (var e = this._scopeEvents.delegatedEvents[t], n = e.length - 1; n >= 0; n--) {
							var r = e[n], i = r.selector, o = r.context, a = r.listeners;
							i === this.target && o === this._context && e.splice(n, 1);
							for (var s = a.length - 1; s >= 0; s--) this._scopeEvents.removeDelegate(this.target, this._context, t, a[s][0], a[s][1]);
						}
						else this._scopeEvents.remove(this.target, "all");
					}
				}
			]), t;
		}(), an = function() {
			function t(e) {
				var n = this;
				r(this, t), this.list = [], this.selectorMap = {}, this.scope = void 0, this.scope = e, e.addListeners({ "interactable:unset": function(t) {
					var e = t.interactable, r = e.target, i = w.string(r) ? n.selectorMap[r] : r[n.scope.id], o = yt(i, (function(t) {
						return t === e;
					}));
					i.splice(o, 1);
				} });
			}
			return o(t, [
				{
					key: "new",
					value: function(t, e) {
						e = V(e || {}, { actions: this.scope.actions });
						var n = new this.scope.Interactable(t, e, this.scope.document, this.scope.events);
						return this.scope.addDocument(n._doc), this.list.push(n), w.string(t) ? (this.selectorMap[t] || (this.selectorMap[t] = []), this.selectorMap[t].push(n)) : (n.target[this.scope.id] || Object.defineProperty(t, this.scope.id, {
							value: [],
							configurable: !0
						}), t[this.scope.id].push(n)), this.scope.fire("interactable:new", {
							target: t,
							options: e,
							interactable: n,
							win: this.scope._win
						}), n;
					}
				},
				{
					key: "getExisting",
					value: function(t, e) {
						var n = e && e.context || this.scope.document, r = w.string(t), i = r ? this.selectorMap[t] : t[this.scope.id];
						if (i) return bt(i, (function(e) {
							return e._context === n && (r || e.inContext(t));
						}));
					}
				},
				{
					key: "forEachMatch",
					value: function(t, e) {
						for (var n = 0, r = this.list; n < r.length; n++) {
							var i = r[n], o = void 0;
							if ((w.string(i.target) ? w.element(t) && R(t, i.target) : t === i.target) && i.inContext(t) && (o = e(i)), void 0 !== o) return o;
						}
					}
				}
			]), t;
		}();
		var sn = function() {
			function t() {
				var e = this;
				r(this, t), this.id = "__interact_scope_".concat(Math.floor(100 * Math.random())), this.isInitialized = !1, this.listenerMaps = [], this.browser = I, this.defaults = ge(Te), this.Eventable = Ve, this.actions = {
					map: {},
					phases: {
						start: !0,
						move: !0,
						end: !0
					},
					methodDict: {},
					phaselessTypes: {}
				}, this.interactStatic = function(t) {
					var e = function e(n, r) {
						var i = t.interactables.getExisting(n, r);
						return i || ((i = t.interactables.new(n, r)).events.global = e.globalEvents), i;
					};
					return e.getPointerAverage = lt, e.getTouchBBox = ut, e.getTouchDistance = pt, e.getTouchAngle = ft, e.getElementRect = L, e.getElementClientRect = Y, e.matchesSelector = R, e.closest = z, e.globalEvents = {}, e.version = "1.10.28", e.scope = t, e.use = function(t, e) {
						return this.scope.usePlugin(t, e), this;
					}, e.isSet = function(t, e) {
						return !!this.scope.interactables.get(t, e && e.context);
					}, e.on = Nt((function(t, e, n) {
						if (w.string(t) && -1 !== t.search(" ") && (t = t.trim().split(/ +/)), w.array(t)) {
							for (var r = 0, i = t; r < i.length; r++) {
								var o = i[r];
								this.on(o, e, n);
							}
							return this;
						}
						if (w.object(t)) {
							for (var a in t) this.on(a, t[a], e);
							return this;
						}
						return ve(t, this.scope.actions) ? this.globalEvents[t] ? this.globalEvents[t].push(e) : this.globalEvents[t] = [e] : this.scope.events.add(this.scope.document, t, e, { options: n }), this;
					}), "The interact.on() method is being deprecated"), e.off = Nt((function(t, e, n) {
						if (w.string(t) && -1 !== t.search(" ") && (t = t.trim().split(/ +/)), w.array(t)) {
							for (var r = 0, i = t; r < i.length; r++) {
								var o = i[r];
								this.off(o, e, n);
							}
							return this;
						}
						if (w.object(t)) {
							for (var a in t) this.off(a, t[a], e);
							return this;
						}
						var s;
						return ve(t, this.scope.actions) ? t in this.globalEvents && -1 !== (s = this.globalEvents[t].indexOf(e)) && this.globalEvents[t].splice(s, 1) : this.scope.events.remove(this.scope.document, t, e, n), this;
					}), "The interact.off() method is being deprecated"), e.debug = function() {
						return this.scope;
					}, e.supportsTouch = function() {
						return I.supportsTouch;
					}, e.supportsPointerEvent = function() {
						return I.supportsPointerEvent;
					}, e.stop = function() {
						for (var t = 0, e = this.scope.interactions.list; t < e.length; t++) e[t].stop();
						return this;
					}, e.pointerMoveTolerance = function(t) {
						return w.number(t) ? (this.scope.interactions.pointerMoveTolerance = t, this) : this.scope.interactions.pointerMoveTolerance;
					}, e.addDocument = function(t, e) {
						this.scope.addDocument(t, e);
					}, e.removeDocument = function(t) {
						this.scope.removeDocument(t);
					}, e;
				}(this), this.InteractEvent = Se, this.Interactable = void 0, this.interactables = new an(this), this._win = void 0, this.document = void 0, this.window = void 0, this.documents = [], this._plugins = {
					list: [],
					map: {}
				}, this.onWindowUnload = function(t) {
					return e.removeDocument(t.target);
				};
				var n = this;
				this.Interactable = function(t) {
					s(i, t);
					var e = p(i);
					function i() {
						return r(this, i), e.apply(this, arguments);
					}
					return o(i, [
						{
							key: "_defaults",
							get: function() {
								return n.defaults;
							}
						},
						{
							key: "set",
							value: function(t) {
								return f(c(i.prototype), "set", this).call(this, t), n.fire("interactable:set", {
									options: t,
									interactable: this
								}), this;
							}
						},
						{
							key: "unset",
							value: function() {
								f(c(i.prototype), "unset", this).call(this);
								var t = n.interactables.list.indexOf(this);
								t < 0 || (n.interactables.list.splice(t, 1), n.fire("interactable:unset", { interactable: this }));
							}
						}
					]), i;
				}(on);
			}
			return o(t, [
				{
					key: "addListeners",
					value: function(t, e) {
						this.listenerMaps.push({
							id: e,
							map: t
						});
					}
				},
				{
					key: "fire",
					value: function(t, e) {
						for (var n = 0, r = this.listenerMaps; n < r.length; n++) {
							var i = r[n].map[t];
							if (i && !1 === i(e, this, t)) return !1;
						}
					}
				},
				{
					key: "init",
					value: function(t) {
						return this.isInitialized ? this : function(t, e) {
							t.isInitialized = !0, w.window(e) && m(e);
							return k.init(e), I.init(e), Lt.init(e), t.window = e, t.document = e.document, t.usePlugin(nn), t.usePlugin(Ue), t;
						}(this, t);
					}
				},
				{
					key: "pluginIsInstalled",
					value: function(t) {
						var e = t.id;
						return e ? !!this._plugins.map[e] : -1 !== this._plugins.list.indexOf(t);
					}
				},
				{
					key: "usePlugin",
					value: function(t, e) {
						if (!this.isInitialized) return this;
						if (this.pluginIsInstalled(t)) return this;
						if (t.id && (this._plugins.map[t.id] = t), this._plugins.list.push(t), t.install && t.install(this, e), t.listeners && t.before) {
							for (var n = 0, r = this.listenerMaps.length, i = t.before.reduce((function(t, e) {
								return t[e] = !0, t[cn(e)] = !0, t;
							}), {}); n < r; n++) {
								var o = this.listenerMaps[n].id;
								if (o && (i[o] || i[cn(o)])) break;
							}
							this.listenerMaps.splice(n, 0, {
								id: t.id,
								map: t.listeners
							});
						} else t.listeners && this.listenerMaps.push({
							id: t.id,
							map: t.listeners
						});
						return this;
					}
				},
				{
					key: "addDocument",
					value: function(t, e) {
						if (-1 !== this.getDocIndex(t)) return !1;
						var n = y(t);
						e = e ? V({}, e) : {}, this.documents.push({
							doc: t,
							options: e
						}), this.events.documents.push(t), t !== this.document && this.events.add(n, "unload", this.onWindowUnload), this.fire("scope:add-document", {
							doc: t,
							window: n,
							scope: this,
							options: e
						});
					}
				},
				{
					key: "removeDocument",
					value: function(t) {
						var e = this.getDocIndex(t), n = y(t), r = this.documents[e].options;
						this.events.remove(n, "unload", this.onWindowUnload), this.documents.splice(e, 1), this.events.documents.splice(e, 1), this.fire("scope:remove-document", {
							doc: t,
							window: n,
							scope: this,
							options: r
						});
					}
				},
				{
					key: "getDocIndex",
					value: function(t) {
						for (var e = 0; e < this.documents.length; e++) if (this.documents[e].doc === t) return e;
						return -1;
					}
				},
				{
					key: "getDocOptions",
					value: function(t) {
						var e = this.getDocIndex(t);
						return -1 === e ? null : this.documents[e].options;
					}
				},
				{
					key: "now",
					value: function() {
						return (this.window.Date || Date).now();
					}
				}
			]), t;
		}();
		function cn(t) {
			return t && t.replace(/\/.*$/, "");
		}
		var ln = new sn(), un = ln.interactStatic, pn = "undefined" != typeof globalThis ? globalThis : window;
		ln.init(pn);
		var fn = Object.freeze({
			__proto__: null,
			edgeTarget: function() {},
			elements: function() {},
			grid: function(t) {
				var e = [
					["x", "y"],
					["left", "top"],
					["right", "bottom"],
					["width", "height"]
				].filter((function(e) {
					var n = e[0], r = e[1];
					return n in t || r in t;
				})), n = function(n, r) {
					for (var i = t.range, o = t.limits, a = void 0 === o ? {
						left: -Infinity,
						right: Infinity,
						top: -Infinity,
						bottom: Infinity
					} : o, s = t.offset, c = void 0 === s ? {
						x: 0,
						y: 0
					} : s, l = {
						range: i,
						grid: t,
						x: null,
						y: null
					}, u = 0; u < e.length; u++) {
						var p = e[u], f = p[0], d = p[1], h = Math.round((n - c.x) / t[f]), v = Math.round((r - c.y) / t[d]);
						l[f] = Math.max(a.left, Math.min(a.right, h * t[f] + c.x)), l[d] = Math.max(a.top, Math.min(a.bottom, v * t[d] + c.y));
					}
					return l;
				};
				return n.grid = t, n.coordFields = e, n;
			}
		}), hn = {
			id: "snappers",
			install: function(t) {
				var e = t.interactStatic;
				e.snappers = V(e.snappers || {}, fn), e.createSnapGrid = e.snappers.grid;
			}
		}, vn = {
			start: function(t) {
				var n = t.state, r = t.rect, i = t.edges, o = t.pageCoords, a = n.options, s = a.ratio, c = a.enabled, l = n.options, u = l.equalDelta, p = l.modifiers;
				"preserve" === s && (s = r.width / r.height), n.startCoords = V({}, o), n.startRect = V({}, r), n.ratio = s, n.equalDelta = u;
				var f = n.linkedEdges = {
					top: i.top || i.left && !i.bottom,
					left: i.left || i.top && !i.right,
					bottom: i.bottom || i.right && !i.top,
					right: i.right || i.bottom && !i.left
				};
				if (n.xIsPrimaryAxis = !(!i.left && !i.right), n.equalDelta) {
					var d = (f.left ? 1 : -1) * (f.top ? 1 : -1);
					n.edgeSign = {
						x: d,
						y: d
					};
				} else n.edgeSign = {
					x: f.left ? -1 : 1,
					y: f.top ? -1 : 1
				};
				if (!1 !== c && V(i, f), null != p && p.length) {
					var h = new me(t.interaction);
					h.copyFrom(t.interaction.modification), h.prepareStates(p), n.subModification = h, h.startAll(e({}, t));
				}
			},
			set: function(t) {
				var n = t.state, r = t.rect, i = t.coords, o = n.linkedEdges, a = V({}, i), s = n.equalDelta ? gn : mn;
				if (V(t.edges, o), s(n, n.xIsPrimaryAxis, i, r), !n.subModification) return null;
				var c = V({}, r);
				H(o, c, {
					x: i.x - a.x,
					y: i.y - a.y
				});
				var l = n.subModification.setAll(e(e({}, t), {}, {
					rect: c,
					edges: o,
					pageCoords: i,
					prevCoords: i,
					prevRect: c
				})), u = l.delta;
				l.changed && (s(n, Math.abs(u.x) > Math.abs(u.y), l.coords, l.rect), V(i, l.coords));
				return l.eventProps;
			},
			defaults: {
				ratio: "preserve",
				equalDelta: !1,
				modifiers: [],
				enabled: !1
			}
		};
		function gn(t, e, n) {
			var r = t.startCoords, i = t.edgeSign;
			e ? n.y = r.y + (n.x - r.x) * i.y : n.x = r.x + (n.y - r.y) * i.x;
		}
		function mn(t, e, n, r) {
			var i = t.startRect, o = t.startCoords, a = t.ratio, s = t.edgeSign;
			if (e) {
				var c = r.width / a;
				n.y = o.y + (c - i.height) * s.y;
			} else {
				var l = r.height * a;
				n.x = o.x + (l - i.width) * s.x;
			}
		}
		var yn = be(vn, "aspectRatio"), bn = function() {};
		bn._defaults = {};
		var xn = bn;
		function wn(t, e, n) {
			return w.func(t) ? G(t, e.interactable, e.element, [
				n.x,
				n.y,
				e
			]) : G(t, e.interactable, e.element);
		}
		var En = {
			start: function(t) {
				var e = t.rect, n = t.startOffset, r = t.state, i = t.interaction, o = t.pageCoords, a = r.options, s = a.elementRect, c = V({
					left: 0,
					top: 0,
					right: 0,
					bottom: 0
				}, a.offset || {});
				if (e && s) {
					var l = wn(a.restriction, i, o);
					if (l) {
						var u = l.right - l.left - e.width, p = l.bottom - l.top - e.height;
						u < 0 && (c.left += u, c.right += u), p < 0 && (c.top += p, c.bottom += p);
					}
					c.left += n.left - e.width * s.left, c.top += n.top - e.height * s.top, c.right += n.right - e.width * (1 - s.right), c.bottom += n.bottom - e.height * (1 - s.bottom);
				}
				r.offset = c;
			},
			set: function(t) {
				var e = t.coords, n = t.interaction, r = t.state, i = r.options, o = r.offset, a = wn(i.restriction, n, e);
				if (a) {
					var s = function(t) {
						return !t || "left" in t && "top" in t || ((t = V({}, t)).left = t.x || 0, t.top = t.y || 0, t.right = t.right || t.left + t.width, t.bottom = t.bottom || t.top + t.height), t;
					}(a);
					e.x = Math.max(Math.min(s.right - o.right, e.x), s.left + o.left), e.y = Math.max(Math.min(s.bottom - o.bottom, e.y), s.top + o.top);
				}
			},
			defaults: {
				restriction: null,
				elementRect: null,
				offset: null,
				endOnly: !1,
				enabled: !1
			}
		}, Tn = be(En, "restrict"), Sn = {
			top: Infinity,
			left: Infinity,
			bottom: -Infinity,
			right: -Infinity
		}, _n = {
			top: -Infinity,
			left: -Infinity,
			bottom: Infinity,
			right: Infinity
		};
		function Pn(t, e) {
			for (var n = 0, r = [
				"top",
				"left",
				"bottom",
				"right"
			]; n < r.length; n++) {
				var i = r[n];
				i in t || (t[i] = e[i]);
			}
			return t;
		}
		var On = {
			noInner: Sn,
			noOuter: _n,
			start: function(t) {
				var e, n = t.interaction, r = t.startOffset, i = t.state, o = i.options;
				o && (e = N(wn(o.offset, n, n.coords.start.page))), e = e || {
					x: 0,
					y: 0
				}, i.offset = {
					top: e.y + r.top,
					left: e.x + r.left,
					bottom: e.y - r.bottom,
					right: e.x - r.right
				};
			},
			set: function(t) {
				var e = t.coords, n = t.edges, r = t.interaction, i = t.state, o = i.offset, a = i.options;
				if (n) {
					var s = V({}, e), c = wn(a.inner, r, s) || {}, l = wn(a.outer, r, s) || {};
					Pn(c, Sn), Pn(l, _n), n.top ? e.y = Math.min(Math.max(l.top + o.top, s.y), c.top + o.top) : n.bottom && (e.y = Math.max(Math.min(l.bottom + o.bottom, s.y), c.bottom + o.bottom)), n.left ? e.x = Math.min(Math.max(l.left + o.left, s.x), c.left + o.left) : n.right && (e.x = Math.max(Math.min(l.right + o.right, s.x), c.right + o.right));
				}
			},
			defaults: {
				inner: null,
				outer: null,
				offset: null,
				endOnly: !1,
				enabled: !1
			}
		}, kn = be(On, "restrictEdges"), Dn = V({
			get elementRect() {
				return {
					top: 0,
					left: 0,
					bottom: 1,
					right: 1
				};
			},
			set elementRect(t) {}
		}, En.defaults), In = be({
			start: En.start,
			set: En.set,
			defaults: Dn
		}, "restrictRect"), Mn = {
			width: -Infinity,
			height: -Infinity
		}, zn = {
			width: Infinity,
			height: Infinity
		};
		var An = be({
			start: function(t) {
				return On.start(t);
			},
			set: function(t) {
				var e = t.interaction, n = t.state, r = t.rect, i = t.edges, o = n.options;
				if (i) {
					var a = U(wn(o.min, e, t.coords)) || Mn, s = U(wn(o.max, e, t.coords)) || zn;
					n.options = {
						endOnly: o.endOnly,
						inner: V({}, On.noInner),
						outer: V({}, On.noOuter)
					}, i.top ? (n.options.inner.top = r.bottom - a.height, n.options.outer.top = r.bottom - s.height) : i.bottom && (n.options.inner.bottom = r.top + a.height, n.options.outer.bottom = r.top + s.height), i.left ? (n.options.inner.left = r.right - a.width, n.options.outer.left = r.right - s.width) : i.right && (n.options.inner.right = r.left + a.width, n.options.outer.right = r.left + s.width), On.set(t), n.options = o;
				}
			},
			defaults: {
				min: null,
				max: null,
				endOnly: !1,
				enabled: !1
			}
		}, "restrictSize");
		var Rn = {
			start: function(t) {
				var e, n = t.interaction, r = t.interactable, i = t.element, o = t.rect, a = t.state, s = t.startOffset, c = a.options, l = c.offsetWithOrigin ? function(t) {
					var e = t.interaction.element;
					return N(G(t.state.options.origin, null, null, [e])) || K(t.interactable, e, t.interaction.prepared.name);
				}(t) : {
					x: 0,
					y: 0
				};
				if ("startCoords" === c.offset) e = {
					x: n.coords.start.page.x,
					y: n.coords.start.page.y
				};
				else {
					var u = G(c.offset, r, i, [n]);
					(e = N(u) || {
						x: 0,
						y: 0
					}).x += l.x, e.y += l.y;
				}
				var p = c.relativePoints;
				a.offsets = o && p && p.length ? p.map((function(t, n) {
					return {
						index: n,
						relativePoint: t,
						x: s.left - o.width * t.x + e.x,
						y: s.top - o.height * t.y + e.y
					};
				})) : [{
					index: 0,
					relativePoint: null,
					x: e.x,
					y: e.y
				}];
			},
			set: function(t) {
				var e = t.interaction, n = t.coords, r = t.state, i = r.options, o = r.offsets, a = K(e.interactable, e.element, e.prepared.name), s = V({}, n), c = [];
				i.offsetWithOrigin || (s.x -= a.x, s.y -= a.y);
				for (var l = 0, u = o; l < u.length; l++) for (var p = u[l], f = s.x - p.x, d = s.y - p.y, h = 0, v = i.targets.length; h < v; h++) {
					var g = i.targets[h], m = void 0;
					(m = w.func(g) ? g(f, d, e._proxy, p, h) : g) && c.push({
						x: (w.number(m.x) ? m.x : f) + p.x,
						y: (w.number(m.y) ? m.y : d) + p.y,
						range: w.number(m.range) ? m.range : i.range,
						source: g,
						index: h,
						offset: p
					});
				}
				for (var y = {
					target: null,
					inRange: !1,
					distance: 0,
					range: 0,
					delta: {
						x: 0,
						y: 0
					}
				}, b = 0; b < c.length; b++) {
					var x = c[b], E = x.range, T = x.x - s.x, S = x.y - s.y, _ = Q(T, S), P = _ <= E;
					E === Infinity && y.inRange && y.range !== Infinity && (P = !1), y.target && !(P ? y.inRange && E !== Infinity ? _ / E < y.distance / y.range : E === Infinity && y.range !== Infinity || _ < y.distance : !y.inRange && _ < y.distance) || (y.target = x, y.distance = _, y.range = E, y.inRange = P, y.delta.x = T, y.delta.y = S);
				}
				return y.inRange && (n.x = y.target.x, n.y = y.target.y), r.closest = y, y;
			},
			defaults: {
				range: Infinity,
				targets: null,
				offset: null,
				offsetWithOrigin: !0,
				origin: null,
				relativePoints: null,
				endOnly: !1,
				enabled: !1
			}
		}, Cn = be(Rn, "snap");
		var jn = {
			start: function(t) {
				var e = t.state, n = t.edges, r = e.options;
				if (!n) return null;
				t.state = { options: {
					targets: null,
					relativePoints: [{
						x: n.left ? 0 : 1,
						y: n.top ? 0 : 1
					}],
					offset: r.offset || "self",
					origin: {
						x: 0,
						y: 0
					},
					range: r.range
				} }, e.targetFields = e.targetFields || [["width", "height"], ["x", "y"]], Rn.start(t), e.offsets = t.state.offsets, t.state = e;
			},
			set: function(t) {
				var e = t.interaction, n = t.state, r = t.coords, i = n.options, o = n.offsets, a = {
					x: r.x - o[0].x,
					y: r.y - o[0].y
				};
				n.options = V({}, i), n.options.targets = [];
				for (var s = 0, c = i.targets || []; s < c.length; s++) {
					var l = c[s], u = void 0;
					if (u = w.func(l) ? l(a.x, a.y, e) : l) {
						for (var p = 0, f = n.targetFields; p < f.length; p++) {
							var d = f[p], h = d[0], v = d[1];
							if (h in u || v in u) {
								u.x = u[h], u.y = u[v];
								break;
							}
						}
						n.options.targets.push(u);
					}
				}
				var g = Rn.set(t);
				return n.options = i, g;
			},
			defaults: {
				range: Infinity,
				targets: null,
				offset: null,
				endOnly: !1,
				enabled: !1
			}
		}, Fn = be(jn, "snapSize");
		var Xn = {
			aspectRatio: yn,
			restrictEdges: kn,
			restrict: Tn,
			restrictRect: In,
			restrictSize: An,
			snapEdges: be({
				start: function(t) {
					var e = t.edges;
					return e ? (t.state.targetFields = t.state.targetFields || [[e.left ? "left" : "right", e.top ? "top" : "bottom"]], jn.start(t)) : null;
				},
				set: jn.set,
				defaults: V(ge(jn.defaults), {
					targets: void 0,
					range: void 0,
					offset: {
						x: 0,
						y: 0
					}
				})
			}, "snapEdges"),
			snap: Cn,
			snapSize: Fn,
			spring: xn,
			avoid: xn,
			transform: xn,
			rubberband: xn
		}, Ln = {
			id: "modifiers",
			install: function(t) {
				var e = t.interactStatic;
				for (var n in t.usePlugin(Ee), t.usePlugin(hn), e.modifiers = Xn, Xn) {
					var r = Xn[n], i = r._defaults;
					i._methods = r._methods, t.defaults.perAction[n] = i;
				}
			}
		}, qn = function(t) {
			s(n, t);
			var e = p(n);
			function n(t, i, o, a, s, c) {
				var l;
				if (r(this, n), tt(u(l = e.call(this, s)), o), o !== i && tt(u(l), i), l.timeStamp = c, l.originalEvent = o, l.type = t, l.pointerId = at(i), l.pointerType = dt(i), l.target = a, l.currentTarget = null, "tap" === t) {
					var p = s.getPointerIndex(i);
					l.dt = l.timeStamp - s.pointers[p].downTime;
					var f = l.timeStamp - s.tapTime;
					l.double = !!s.prevTap && "doubletap" !== s.prevTap.type && s.prevTap.target === l.target && f < 500;
				} else "doubletap" === t && (l.dt = i.timeStamp - s.tapTime, l.double = !0);
				return l;
			}
			return o(n, [
				{
					key: "_subtractOrigin",
					value: function(t) {
						var e = t.x, n = t.y;
						return this.pageX -= e, this.pageY -= n, this.clientX -= e, this.clientY -= n, this;
					}
				},
				{
					key: "_addOrigin",
					value: function(t) {
						var e = t.x, n = t.y;
						return this.pageX += e, this.pageY += n, this.clientX += e, this.clientY += n, this;
					}
				},
				{
					key: "preventDefault",
					value: function() {
						this.originalEvent.preventDefault();
					}
				}
			]), n;
		}(vt), Bn = {
			id: "pointer-events/base",
			before: [
				"inertia",
				"modifiers",
				"auto-start",
				"actions"
			],
			install: function(t) {
				t.pointerEvents = Bn, t.defaults.actions.pointerEvents = Bn.defaults, V(t.actions.phaselessTypes, Bn.types);
			},
			listeners: {
				"interactions:new": function(t) {
					var e = t.interaction;
					e.prevTap = null, e.tapTime = 0;
				},
				"interactions:update-pointer": function(t) {
					var e = t.down, n = t.pointerInfo;
					if (!e && n.hold) return;
					n.hold = {
						duration: Infinity,
						timeout: null
					};
				},
				"interactions:move": function(t, e) {
					var n = t.interaction, r = t.pointer, i = t.event, o = t.eventTarget;
					t.duplicate || n.pointerIsDown && !n.pointerWasMoved || (n.pointerIsDown && Gn(t), Vn({
						interaction: n,
						pointer: r,
						event: i,
						eventTarget: o,
						type: "move"
					}, e));
				},
				"interactions:down": function(t, e) {
					(function(t, e) {
						for (var n = t.interaction, r = t.pointer, i = t.event, o = t.eventTarget, a = t.pointerIndex, s = n.pointers[a].hold, c = q(o), l = {
							interaction: n,
							pointer: r,
							event: i,
							eventTarget: o,
							type: "hold",
							targets: [],
							path: c,
							node: null
						}, u = 0; u < c.length; u++) l.node = c[u], e.fire("pointerEvents:collect-targets", l);
						if (!l.targets.length) return;
						for (var f = Infinity, d = 0, h = l.targets; d < h.length; d++) {
							var v = h[d].eventable.options.holdDuration;
							v < f && (f = v);
						}
						s.duration = f, s.timeout = setTimeout((function() {
							Vn({
								interaction: n,
								eventTarget: o,
								pointer: r,
								event: i,
								type: "hold"
							}, e);
						}), f);
					})(t, e), Vn(t, e);
				},
				"interactions:up": function(t, e) {
					Gn(t), Vn(t, e), function(t, e) {
						var n = t.interaction, r = t.pointer, i = t.event, o = t.eventTarget;
						n.pointerWasMoved || Vn({
							interaction: n,
							eventTarget: o,
							pointer: r,
							event: i,
							type: "tap"
						}, e);
					}(t, e);
				},
				"interactions:cancel": function(t, e) {
					Gn(t), Vn(t, e);
				}
			},
			PointerEvent: qn,
			fire: Vn,
			collectEventTargets: Wn,
			defaults: {
				holdDuration: 600,
				ignoreFrom: null,
				allowFrom: null,
				origin: {
					x: 0,
					y: 0
				}
			},
			types: {
				down: !0,
				move: !0,
				up: !0,
				cancel: !0,
				tap: !0,
				doubletap: !0,
				hold: !0
			}
		};
		function Vn(t, e) {
			var n = t.interaction, r = t.pointer, i = t.event, o = t.eventTarget, a = t.type, s = t.targets, c = void 0 === s ? Wn(t, e) : s, l = new qn(a, r, i, o, n, e.now());
			e.fire("pointerEvents:new", { pointerEvent: l });
			for (var u = {
				interaction: n,
				pointer: r,
				event: i,
				eventTarget: o,
				targets: c,
				type: a,
				pointerEvent: l
			}, p = 0; p < c.length; p++) {
				var f = c[p];
				for (var d in f.props || {}) l[d] = f.props[d];
				var h = K(f.eventable, f.node);
				if (l._subtractOrigin(h), l.eventable = f.eventable, l.currentTarget = f.node, f.eventable.fire(l), l._addOrigin(h), l.immediatePropagationStopped || l.propagationStopped && p + 1 < c.length && c[p + 1].node !== l.currentTarget) break;
			}
			if (e.fire("pointerEvents:fired", u), "tap" === a) {
				var v = l.double ? Vn({
					interaction: n,
					pointer: r,
					event: i,
					eventTarget: o,
					type: "doubletap"
				}, e) : l;
				n.prevTap = v, n.tapTime = v.timeStamp;
			}
			return l;
		}
		function Wn(t, e) {
			var n = t.interaction, r = t.pointer, i = t.event, o = t.eventTarget, a = t.type, s = n.getPointerIndex(r), c = n.pointers[s];
			if ("tap" === a && (n.pointerWasMoved || !c || c.downTarget !== o)) return [];
			for (var l = q(o), u = {
				interaction: n,
				pointer: r,
				event: i,
				eventTarget: o,
				type: a,
				path: l,
				targets: [],
				node: null
			}, p = 0; p < l.length; p++) u.node = l[p], e.fire("pointerEvents:collect-targets", u);
			return "hold" === a && (u.targets = u.targets.filter((function(t) {
				var e, r;
				return t.eventable.options.holdDuration === (null == (e = n.pointers[s]) || null == (r = e.hold) ? void 0 : r.duration);
			}))), u.targets;
		}
		function Gn(t) {
			var e = t.interaction, n = t.pointerIndex, r = e.pointers[n].hold;
			r && r.timeout && (clearTimeout(r.timeout), r.timeout = null);
		}
		var Nn = Object.freeze({
			__proto__: null,
			default: Bn
		});
		function Un(t) {
			var e = t.interaction;
			e.holdIntervalHandle && (clearInterval(e.holdIntervalHandle), e.holdIntervalHandle = null);
		}
		var Kn = {
			id: "pointer-events/holdRepeat",
			install: function(t) {
				t.usePlugin(Bn);
				var e = t.pointerEvents;
				e.defaults.holdRepeatInterval = 0, e.types.holdrepeat = t.actions.phaselessTypes.holdrepeat = !0;
			},
			listeners: [
				"move",
				"up",
				"cancel",
				"endall"
			].reduce((function(t, e) {
				return t["pointerEvents:".concat(e)] = Un, t;
			}), {
				"pointerEvents:new": function(t) {
					var e = t.pointerEvent;
					"hold" === e.type && (e.count = (e.count || 0) + 1);
				},
				"pointerEvents:fired": function(t, e) {
					var n = t.interaction, r = t.pointerEvent, i = t.eventTarget, o = t.targets;
					if ("hold" === r.type && o.length) {
						var a = o[0].eventable.options.holdRepeatInterval;
						a <= 0 || (n.holdIntervalHandle = setTimeout((function() {
							e.pointerEvents.fire({
								interaction: n,
								eventTarget: i,
								type: "hold",
								pointer: r,
								event: r
							}, e);
						}), a));
					}
				}
			})
		};
		var Jn = {
			id: "pointer-events/interactableTargets",
			install: function(t) {
				var e = t.Interactable;
				e.prototype.pointerEvents = function(t) {
					return V(this.events.options, t), this;
				};
				var n = e.prototype._backCompatOption;
				e.prototype._backCompatOption = function(t, e) {
					var r = n.call(this, t, e);
					return r === this && (this.events.options[t] = e), r;
				};
			},
			listeners: {
				"pointerEvents:collect-targets": function(t, e) {
					var n = t.targets, r = t.node, i = t.type, o = t.eventTarget;
					e.interactables.forEachMatch(r, (function(t) {
						var e = t.events, a = e.options;
						e.types[i] && e.types[i].length && t.testIgnoreAllow(a, r, o) && n.push({
							node: r,
							eventable: e,
							props: { interactable: t }
						});
					}));
				},
				"interactable:new": function(t) {
					var e = t.interactable;
					e.events.getRect = function(t) {
						return e.getRect(t);
					};
				},
				"interactable:set": function(t, e) {
					var n = t.interactable, r = t.options;
					V(n.events.options, e.pointerEvents.defaults), V(n.events.options, r.pointerEvents || {});
				}
			}
		};
		if (un.use(he), un.use(Ce), un.use({
			id: "pointer-events",
			install: function(t) {
				t.usePlugin(Nn), t.usePlugin(Kn), t.usePlugin(Jn);
			}
		}), un.use(qe), un.use(Ln), un.use(pe), un.use(Xt), un.use(Gt), un.use({
			id: "reflow",
			install: function(t) {
				var e = t.Interactable;
				t.actions.phases.reflow = !0, e.prototype.reflow = function(e) {
					return function(t, e, n) {
						for (var r = t.getAllElements(), i = n.window.Promise, o = i ? [] : null, a = function() {
							var a = r[s], c = t.getRect(a);
							if (!c) return 1;
							var l, u = bt(n.interactions.list, (function(n) {
								return n.interacting() && n.interactable === t && n.element === a && n.prepared.name === e.name;
							}));
							if (u) u.move(), o && (l = u._reflowPromise || new i((function(t) {
								u._reflowResolve = t;
							})));
							else {
								var p = U(c);
								l = function(t, e, n, r, i) {
									var o = t.interactions.new({ pointerType: "reflow" }), a = {
										interaction: o,
										event: i,
										pointer: i,
										eventTarget: n,
										phase: "reflow"
									};
									o.interactable = e, o.element = n, o.prevEvent = i, o.updatePointer(i, i, n, !0), nt(o.coords.delta), Ut(o.prepared, r), o._doPhase(a);
									var c = t.window.Promise, l = c ? new c((function(t) {
										o._reflowResolve = t;
									})) : void 0;
									o._reflowPromise = l, o.start(r, e, n), o._interacting ? (o.move(a), o.end(i)) : (o.stop(), o._reflowResolve());
									return o.removePointer(i, i), l;
								}(n, t, a, e, function(t) {
									return {
										coords: t,
										get page() {
											return this.coords.page;
										},
										get client() {
											return this.coords.client;
										},
										get timeStamp() {
											return this.coords.timeStamp;
										},
										get pageX() {
											return this.coords.page.x;
										},
										get pageY() {
											return this.coords.page.y;
										},
										get clientX() {
											return this.coords.client.x;
										},
										get clientY() {
											return this.coords.client.y;
										},
										get pointerId() {
											return this.coords.pointerId;
										},
										get target() {
											return this.coords.target;
										},
										get type() {
											return this.coords.type;
										},
										get pointerType() {
											return this.coords.pointerType;
										},
										get buttons() {
											return this.coords.buttons;
										},
										preventDefault: function() {}
									};
								}({
									page: {
										x: p.x,
										y: p.y
									},
									client: {
										x: p.x,
										y: p.y
									},
									timeStamp: n.now()
								}));
							}
							o && o.push(l);
						}, s = 0; s < r.length && !a(); s++);
						return o && i.all(o).then((function() {
							return t;
						}));
					}(this, e, t);
				};
			},
			listeners: { "interactions:stop": function(t, e) {
				var n = t.interaction;
				"reflow" === n.pointerType && (n._reflowResolve && n._reflowResolve(), function(t, e) {
					t.splice(t.indexOf(e), 1);
				}(e.interactions.list, n));
			} }
		}), un.default = un, "object" === ("undefined" == typeof module ? "undefined" : n(module)) && module) try {
			module.exports = un;
		} catch (t) {}
		return un.default = un, un;
	}));
})))(), 1);
var st = /* @__PURE__ */ defineComponent({
	__name: "grid-item",
	props: {
		isDraggable: {
			type: Boolean,
			default: void 0
		},
		isResizable: {
			type: Boolean,
			default: void 0
		},
		isBounded: {
			type: Boolean,
			default: void 0
		},
		static: {
			type: Boolean,
			default: !1
		},
		minH: { default: 1 },
		minW: { default: 1 },
		maxH: { default: Infinity },
		maxW: { default: Infinity },
		x: {},
		y: {},
		w: {},
		h: {},
		i: {},
		dragIgnoreFrom: { default: "a, button" },
		dragAllowFrom: { default: void 0 },
		resizeIgnoreFrom: { default: "a, button" },
		preserveAspectRatio: {
			type: Boolean,
			default: !1
		},
		dragOption: { default: () => ({}) },
		resizeOption: { default: () => ({}) }
	},
	emits: [
		"container-resized",
		"resize",
		"resized",
		"move",
		"moved"
	],
	setup(Se, { expose: Me, emit: We }) {
		const i$1 = Se, M = We, l = inject(T), g = inject(v$1);
		if (!l) throw new Error("[grid-layout-plus]: missing layout store, GridItem must under a GridLayout.");
		const d = shallowRef(null), e = reactive({
			cols: 1,
			containerWidth: 100,
			rowHeight: 30,
			margin: [10, 10],
			maxRows: Infinity,
			draggable: void 0,
			resizable: void 0,
			bounded: void 0,
			transformScale: 1,
			useCssTransforms: !0,
			useStyleCursor: !0,
			isDragging: !1,
			dragging: {
				top: -1,
				left: -1
			},
			isResizing: !1,
			resizing: {
				width: -1,
				height: -1
			},
			style: {},
			rtl: !1
		});
		let X = !1, _ = !1, $ = NaN, G$1 = NaN, k = NaN, E = NaN, j = -1, K$2 = -1, V = -1, q = -1, h = i$1.x, v = i$1.y, p = i$1.w, y = i$1.h;
		const W = ref(), J = reactive({
			i: toRef(i$1, "i"),
			state: e,
			wrapper: W,
			calcXY: A
		});
		function Q(t) {
			Te(t);
		}
		function Z() {
			de();
		}
		function U(t) {
			ie$1(i$1.isDraggable) && (e.draggable = t);
		}
		function ee(t) {
			ie$1(i$1.isResizable) && (e.resizable = t);
		}
		function te(t) {
			ie$1(i$1.isBounded) && (e.bounded = t);
		}
		function ie(t) {
			e.transformScale = t;
		}
		function ae(t) {
			e.rowHeight = t;
		}
		function re(t) {
			e.maxRows = t;
		}
		function ne() {
			e.rtl = r() === "rtl", de();
		}
		function oe(t) {
			e.cols = Math.floor(t);
		}
		l.increaseItem(J), onBeforeMount(() => {
			e.rtl = r() === "rtl";
		}), onMounted(() => {
			l.responsive && l.lastBreakpoint ? e.cols = B$1(l.lastBreakpoint, l.cols) : e.cols = l.colNum, e.rowHeight = l.rowHeight, e.containerWidth = l.width !== null ? l.width : 100, e.margin = l.margin !== void 0 ? l.margin.map(Number) : [10, 10], e.maxRows = l.maxRows, ie$1(i$1.isDraggable) ? e.draggable = l.isDraggable : e.draggable = i$1.isDraggable, ie$1(i$1.isResizable) ? e.resizable = l.isResizable : e.resizable = i$1.isResizable, ie$1(i$1.isBounded) ? e.bounded = l.isBounded : e.bounded = i$1.isBounded, e.transformScale = l.transformScale, e.useCssTransforms = l.useCssTransforms, e.useStyleCursor = l.useStyleCursor, watchEffect(() => {
				h = i$1.x, v = i$1.y, y = i$1.h, p = i$1.w, oo$1(H);
			}), g.on("updateWidth", Q), g.on("compact", Z), g.on("setDraggable", U), g.on("setResizable", ee), g.on("setBounded", te), g.on("setTransformScale", ie), g.on("setRowHeight", ae), g.on("setMaxRows", re), g.on("directionchange", ne), g.on("setColNum", oe);
		}), onBeforeUnmount(() => {
			g.off("updateWidth", Q), g.off("compact", Z), g.off("setDraggable", U), g.off("setResizable", ee), g.off("setBounded", te), g.off("setTransformScale", ie), g.off("setRowHeight", ae), g.off("setMaxRows", re), g.off("directionchange", ne), g.off("setColNum", oe), d.value && (d.value.unset(), d.value = null), l.decreaseItem(J);
		}), Me({
			state: e,
			wrapper: W
		});
		const Be = typeof navigator < "u" ? navigator.userAgent.toLowerCase().includes("android") : !1, se = computed(() => e.resizable && !i$1.static), m = computed(() => l.isMirrored ? !e.rtl : e.rtl), Ce = computed(() => (e.draggable || e.resizable) && !i$1.static), z = K("item"), De = computed(() => ({
			[z.b()]: !0,
			[z.bm("resizable")]: se.value,
			[z.bm("static")]: i$1.static,
			[z.bm("resizing")]: e.isResizing,
			[z.bm("dragging")]: e.isDragging,
			[z.bm("transform")]: e.useCssTransforms,
			[z.bm("rtl")]: m.value,
			[z.bm("no-touch")]: Be && Ce.value
		})), T$1 = computed(() => [z.be("resizer"), m.value && z.bem("resizer", "rtl")].filter(Boolean));
		watch(() => i$1.isDraggable, (t) => {
			e.draggable = t;
		}), watch(() => i$1.static, () => {
			oo$1(ue), oo$1(S);
		}), watch(() => e.draggable, () => {
			oo$1(ue);
		}), watch(() => i$1.isResizable, (t) => {
			e.resizable = t;
		}), watch(() => i$1.isBounded, (t) => {
			e.bounded = t;
		}), watch(() => e.resizable, () => {
			oo$1(S);
		}), watch(() => e.rowHeight, () => {
			oo$1(H), oo$1(F);
		}), watch([() => e.cols, () => e.containerWidth], () => {
			oo$1(S), oo$1(H), oo$1(F);
		}), watch([
			() => i$1.minH,
			() => i$1.maxH,
			() => i$1.minW,
			() => i$1.maxW
		], () => {
			oo$1(S);
		}), watch(m, () => {
			oo$1(S), oo$1(H);
		}), watch([
			() => l.margin,
			() => l.margin[0],
			() => l.margin[1]
		], () => {
			const t = l.margin;
			!t || t[0] === e.margin[0] && t[1] === e.margin[1] || (e.margin = t.map(Number), oo$1(H), oo$1(F));
		});
		function H() {
			i$1.x + i$1.w > e.cols ? (h = 0, p = i$1.w > e.cols ? e.cols : i$1.w) : (h = i$1.x, p = i$1.w);
			const t = B(h, v, p, y);
			e.isDragging && (t.top = e.dragging.top, m.value ? t.right = e.dragging.left : t.left = e.dragging.left), e.isResizing && (t.width = e.resizing.width, t.height = e.resizing.height);
			let r;
			e.useCssTransforms ? m.value ? r = O(t.top, t.right, t.width, t.height) : r = G(t.top, t.left, t.width, t.height) : m.value ? r = V$1(t.top, t.right, t.width, t.height) : r = R(t.top, t.left, t.width, t.height), e.style = r;
		}
		function F() {
			const t = {};
			for (const r of ["width", "height"]) {
				const o = e.style[r].match(/^(\d+)px$/);
				if (!o) return;
				t[r] = o[1];
			}
			M("container-resized", i$1.i, i$1.h, i$1.w, t.height, t.width);
		}
		function le(t) {
			if (i$1.static) return;
			const r = t.type;
			if (r === "resizestart" && e.isResizing || r !== "resizestart" && !e.isResizing) return;
			const s = a(t);
			if (ie$1(s)) return;
			const { x: o, y: c } = s, n = {
				width: 0,
				height: 0
			};
			let a$2;
			switch (r) {
				case "resizestart":
					S(), j = p, K$2 = y, a$2 = B(h, v, p, y), n.width = a$2.width, n.height = a$2.height, e.resizing = n, e.isResizing = !0;
					break;
				case "resizemove": {
					!t.edges.right && !t.edges.left && (k = o), !t.edges.top && !t.edges.bottom && (E = c);
					const u = i(k, E, o, c);
					m.value ? n.width = e.resizing.width - u.deltaX / e.transformScale : n.width = e.resizing.width + u.deltaX / e.transformScale, n.height = e.resizing.height + u.deltaY / e.transformScale, e.resizing = n;
					break;
				}
				case "resizeend": a$2 = B(h, v, p, y), n.width = a$2.width, n.height = a$2.height, e.resizing = {
					width: -1,
					height: -1
				}, e.isResizing = !1;
			}
			a$2 = Ne(n.height, n.width), a$2.w < i$1.minW && (a$2.w = i$1.minW), a$2.w > i$1.maxW && (a$2.w = i$1.maxW), a$2.h < i$1.minH && (a$2.h = i$1.minH), a$2.h > i$1.maxH && (a$2.h = i$1.maxH), a$2.h < 1 && (a$2.h = 1), a$2.w < 1 && (a$2.w = 1), k = o, E = c, (p !== a$2.w || y !== a$2.h) && M("resize", i$1.i, a$2.h, a$2.w, n.height, n.width), t.type === "resizeend" && (j !== p || K$2 !== y) && M("resized", i$1.i, a$2.h, a$2.w, n.height, n.width), g.emit("resizeEvent", t.type, i$1.i, h, v, a$2.h, a$2.w);
		}
		function ge(t) {
			if (i$1.static || e.isResizing) return;
			const r = t.type;
			if (r === "dragstart" && e.isDragging || r !== "dragstart" && !e.isDragging) return;
			const s = a(t);
			if (ie$1(s)) return;
			const { x: o, y: c } = s, n = t.target;
			if (!n.offsetParent) return;
			const a$3 = {
				top: 0,
				left: 0
			};
			switch (r) {
				case "dragstart": {
					V = h, q = v;
					const w = n.offsetParent.getBoundingClientRect(), R = n.getBoundingClientRect(), C = R.left / e.transformScale, D = w.left / e.transformScale, P = R.right / e.transformScale, Y = w.right / e.transformScale, L = R.top / e.transformScale, O = w.top / e.transformScale;
					m.value ? a$3.left = (P - Y) * -1 : a$3.left = C - D, a$3.top = L - O, e.dragging = a$3, e.isDragging = !0;
					break;
				}
				case "dragmove": {
					const w = i($, G$1, o, c);
					if (m.value ? a$3.left = e.dragging.left - w.deltaX / e.transformScale : a$3.left = e.dragging.left + w.deltaX / e.transformScale, a$3.top = e.dragging.top + w.deltaY / e.transformScale, e.bounded) {
						const R = n.offsetParent.clientHeight - ce(i$1.h, e.rowHeight, e.margin[1]);
						a$3.top = fe(a$3.top, 0, R);
						const C = I(), D = e.containerWidth - ce(i$1.w, C, e.margin[0]);
						a$3.left = fe(a$3.left, 0, D);
					}
					e.dragging = a$3;
					break;
				}
				case "dragend": {
					const w = n.offsetParent.getBoundingClientRect(), R = n.getBoundingClientRect(), C = R.left / e.transformScale, D = w.left / e.transformScale, P = R.right / e.transformScale, Y = w.right / e.transformScale, L = R.top / e.transformScale, O = w.top / e.transformScale;
					m.value ? a$3.left = (P - Y) * -1 : a$3.left = C - D, a$3.top = L - O, e.dragging = {
						top: -1,
						left: -1
					}, e.isDragging = !1;
					break;
				}
			}
			let u;
			m.value, u = A(a$3.top, a$3.left), $ = o, G$1 = c, (h !== u.x || v !== u.y) && M("move", i$1.i, u.x, u.y), t.type === "dragend" && (V !== h || q !== v) && M("moved", i$1.i, u.x, u.y), g.emit("dragEvent", t.type, i$1.i, u.x, u.y, y, p);
		}
		function B(t, r, s, o) {
			const c = I();
			let n;
			return m.value ? n = {
				right: Math.round(c * t + (t + 1) * e.margin[0]),
				top: Math.round(e.rowHeight * r + (r + 1) * e.margin[1]),
				width: s === Infinity ? s : Math.round(c * s + Math.max(0, s - 1) * e.margin[0]),
				height: o === Infinity ? o : Math.round(e.rowHeight * o + Math.max(0, o - 1) * e.margin[1])
			} : n = {
				left: Math.round(c * t + (t + 1) * e.margin[0]),
				top: Math.round(e.rowHeight * r + (r + 1) * e.margin[1]),
				width: s === Infinity ? s : Math.round(c * s + Math.max(0, s - 1) * e.margin[0]),
				height: o === Infinity ? o : Math.round(e.rowHeight * o + Math.max(0, o - 1) * e.margin[1])
			}, n;
		}
		function A(t, r) {
			const s = I();
			let o = Math.round((r - e.margin[0]) / (s + e.margin[0])), c = Math.round((t - e.margin[1]) / (e.rowHeight + e.margin[1]));
			return o = Math.max(Math.min(o, e.cols - p), 0), c = Math.max(Math.min(c, e.maxRows - y), 0), {
				x: o,
				y: c
			};
		}
		function I() {
			return (e.containerWidth - e.margin[0] * (e.cols + 1)) / e.cols;
		}
		function ce(t, r, s) {
			return Number.isFinite(t) ? Math.round(r * t + Math.max(0, t - 1) * s) : t;
		}
		function fe(t, r, s) {
			return Math.max(Math.min(t, s), r);
		}
		function Ne(t, r, s = !1) {
			const o = I();
			let c = Math.round((r + e.margin[0]) / (o + e.margin[0])), n = 0;
			return s ? n = Math.ceil((t + e.margin[1]) / (e.rowHeight + e.margin[1])) : n = Math.round((t + e.margin[1]) / (e.rowHeight + e.margin[1])), c = Math.max(Math.min(c, e.cols - h), 0), n = Math.max(Math.min(n, e.maxRows - v), 0), {
				w: c,
				h: n
			};
		}
		function Te(t, r) {
			e.containerWidth = t;
		}
		function de() {
			H();
		}
		function me() {
			!d.value && W.value && (d.value = (0, import_interact_min.default)(W.value), e.useStyleCursor || d.value.styleCursor(!1));
		}
		const Ie = eo(ge);
		function ue() {
			if (me(), !!d.value) if (e.draggable && !i$1.static) {
				const t = {
					ignoreFrom: i$1.dragIgnoreFrom,
					allowFrom: i$1.dragAllowFrom,
					...i$1.dragOption
				};
				d.value.draggable(t), X || (X = !0, d.value.on("dragstart dragmove dragend", (r) => {
					r.type === "dragmove" ? Ie(r) : ge(r);
				}));
			} else d.value.draggable({ enabled: !1 });
		}
		const ke = eo(le);
		function S() {
			if (me(), !!d.value) if (e.resizable && !i$1.static) {
				const t = B(0, 0, i$1.maxW, i$1.maxH), r = B(0, 0, i$1.minW, i$1.minH), s = {
					edges: {
						left: m.value ? `.${T$1.value[0]}` : !1,
						right: m.value ? !1 : `.${T$1.value[0]}`,
						bottom: `.${T$1.value[0]}`,
						top: !1
					},
					ignoreFrom: i$1.resizeIgnoreFrom,
					restrictSize: {
						min: {
							height: r.height * e.transformScale,
							width: r.width * e.transformScale
						},
						max: {
							height: t.height * e.transformScale,
							width: t.width * e.transformScale
						}
					},
					...i$1.resizeOption
				};
				i$1.preserveAspectRatio && (s.modifiers = [import_interact_min.default.modifiers.aspectRatio({ ratio: "preserve" })]), d.value.resizable(s), _ || (_ = !0, d.value.on("resizestart resizemove resizeend", (o) => {
					o.type === "resizemove" ? ke(o) : le(o);
				}));
			} else d.value.resizable({ enabled: !1 });
		}
		return (t, r) => (openBlock(), createElementBlock("section", {
			ref_key: "wrapper",
			ref: W,
			class: normalizeClass(De.value),
			style: normalizeStyle(e.style)
		}, [renderSlot(t.$slots, "default"), se.value ? (openBlock(), createElementBlock("span", {
			key: 0,
			class: normalizeClass(T$1.value)
		}, null, 2)) : createCommentVNode("", !0)], 6));
	}
});
//#endregion
//#region ../../node_modules/.pnpm/@vexip-ui+hooks@2.9.4_vue@3.5.45_typescript@5.9.3_/node_modules/@vexip-ui/hooks/dist/index.mjs
var F = typeof window < "u";
var bt;
F && (bt = window == null ? void 0 : window.navigator) != null && bt.userAgent && /iP(ad|hone|od)/.test(window.navigator.userAgent);
function Be(e) {
	return e != null;
}
function B() {}
var zn = Object.freeze({
	aliceblue: "f0f8ff",
	antiquewhite: "faebd7",
	aqua: "0ff",
	aquamarine: "7fffd4",
	azure: "f0ffff",
	beige: "f5f5dc",
	bisque: "ffe4c4",
	black: "000",
	blanchedalmond: "ffebcd",
	blue: "00f",
	blueviolet: "8a2be2",
	brown: "a52a2a",
	burlywood: "deb887",
	burntsienna: "ea7e5d",
	cadetblue: "5f9ea0",
	chartreuse: "7fff00",
	chocolate: "d2691e",
	coral: "ff7f50",
	cornflowerblue: "6495ed",
	cornsilk: "fff8dc",
	crimson: "dc143c",
	cyan: "0ff",
	darkblue: "00008b",
	darkcyan: "008b8b",
	darkgoldenrod: "b8860b",
	darkgray: "a9a9a9",
	darkgreen: "006400",
	darkgrey: "a9a9a9",
	darkkhaki: "bdb76b",
	darkmagenta: "8b008b",
	darkolivegreen: "556b2f",
	darkorange: "ff8c00",
	darkorchid: "9932cc",
	darkred: "8b0000",
	darksalmon: "e9967a",
	darkseagreen: "8fbc8f",
	darkslateblue: "483d8b",
	darkslategray: "2f4f4f",
	darkslategrey: "2f4f4f",
	darkturquoise: "00ced1",
	darkviolet: "9400d3",
	deeppink: "ff1493",
	deepskyblue: "00bfff",
	dimgray: "696969",
	dimgrey: "696969",
	dodgerblue: "1e90ff",
	firebrick: "b22222",
	floralwhite: "fffaf0",
	forestgreen: "228b22",
	fuchsia: "f0f",
	gainsboro: "dcdcdc",
	ghostwhite: "f8f8ff",
	gold: "ffd700",
	goldenrod: "daa520",
	gray: "808080",
	green: "008000",
	greenyellow: "adff2f",
	grey: "808080",
	honeydew: "f0fff0",
	hotpink: "ff69b4",
	indianred: "cd5c5c",
	indigo: "4b0082",
	ivory: "fffff0",
	khaki: "f0e68c",
	lavender: "e6e6fa",
	lavenderblush: "fff0f5",
	lawngreen: "7cfc00",
	lemonchiffon: "fffacd",
	lightblue: "add8e6",
	lightcoral: "f08080",
	lightcyan: "e0ffff",
	lightgoldenrodyellow: "fafad2",
	lightgray: "d3d3d3",
	lightgreen: "90ee90",
	lightgrey: "d3d3d3",
	lightpink: "ffb6c1",
	lightsalmon: "ffa07a",
	lightseagreen: "20b2aa",
	lightskyblue: "87cefa",
	lightslategray: "789",
	lightslategrey: "789",
	lightsteelblue: "b0c4de",
	lightyellow: "ffffe0",
	lime: "0f0",
	limegreen: "32cd32",
	linen: "faf0e6",
	magenta: "f0f",
	maroon: "800000",
	mediumaquamarine: "66cdaa",
	mediumblue: "0000cd",
	mediumorchid: "ba55d3",
	mediumpurple: "9370db",
	mediumseagreen: "3cb371",
	mediumslateblue: "7b68ee",
	mediumspringgreen: "00fa9a",
	mediumturquoise: "48d1cc",
	mediumvioletred: "c71585",
	midnightblue: "191970",
	mintcream: "f5fffa",
	mistyrose: "ffe4e1",
	moccasin: "ffe4b5",
	navajowhite: "ffdead",
	navy: "000080",
	oldlace: "fdf5e6",
	olive: "808000",
	olivedrab: "6b8e23",
	orange: "ffa500",
	orangered: "ff4500",
	orchid: "da70d6",
	palegoldenrod: "eee8aa",
	palegreen: "98fb98",
	paleturquoise: "afeeee",
	palevioletred: "db7093",
	papayawhip: "ffefd5",
	peachpuff: "ffdab9",
	peru: "cd853f",
	pink: "ffc0cb",
	plum: "dda0dd",
	powderblue: "b0e0e6",
	purple: "800080",
	rebeccapurple: "663399",
	red: "f00",
	rosybrown: "bc8f8f",
	royalblue: "4169e1",
	saddlebrown: "8b4513",
	salmon: "fa8072",
	sandybrown: "f4a460",
	seagreen: "2e8b57",
	seashell: "fff5ee",
	sienna: "a0522d",
	silver: "c0c0c0",
	skyblue: "87ceeb",
	slateblue: "6a5acd",
	slategray: "708090",
	slategrey: "708090",
	snow: "fffafa",
	springgreen: "00ff7f",
	steelblue: "4682b4",
	tan: "d2b48c",
	teal: "008080",
	thistle: "d8bfd8",
	tomato: "ff6347",
	turquoise: "40e0d0",
	violet: "ee82ee",
	wheat: "f5deb3",
	white: "fff",
	whitesmoke: "f5f5f5",
	yellow: "ff0",
	yellowgreen: "9acd32"
});
Object.freeze(new Set(Object.keys(zn)));
var yt = F && ("ontouchstart" in window || Mn() > 0) ? "pointerdown" : "click";
function Mn() {
	return typeof navigator < "u" && (navigator.maxTouchPoints || navigator.msMaxTouchPoints) || 0;
}
function Ln(e, t, n = window.Event) {
	const { type: r, bubbles: o = !1, cancelable: i = !1, ...c } = t;
	if (!Be(r) || r === "") return !1;
	let s;
	return Be(n) ? s = new n(r, {
		bubbles: o,
		cancelable: i
	}) : (s = document.createEvent("HTMLEvents"), s.initEvent(r, o, i)), Object.assign(s, c), e.dispatchEvent(s);
}
function jt(e, t = 16) {
	if (typeof e != "function") return B;
	const n = (...i) => {
		e(...i);
	};
	if (t <= 0) return Bn(n);
	let r = 0, o;
	return function(...i) {
		const c = Date.now(), s = c - r;
		clearTimeout(o), s >= t ? (r = c, n(...i)) : o = setTimeout(() => {
			r = Date.now(), n(...i);
		}, Math.max(0, t - s));
	};
}
function Bn(e) {
	if (typeof e != "function") return e;
	let t = !1, n, r;
	return function(...o) {
		return n = o, t || (t = !0, r = Promise.resolve().then(() => (t = !1, r = void 0, e(...n)))), r;
	};
}
var Qe = /* @__PURE__ */ new Set();
var Xe = null;
function _n(e, t) {
	return e instanceof Node ? t === e || t.contains(e) || !!t.__transferElement && (t.__transferElement === e || t.__transferElement.contains(e)) : !1;
}
F && (yt === "click" && document.addEventListener("pointerdown", (e) => {
	Xe = e.target;
}, !0), document.addEventListener(yt, (e) => {
	const t = Xe;
	Xe = null, Qe.forEach((n) => {
		if (t && _n(t, n)) return;
		const r = e.target, o = e.composedPath && e.composedPath();
		n !== r && (o ? !o.includes(n) : !n.contains(r)) && (!n.__transferElement || n.__transferElement !== r && !n.__transferElement.contains(r)) && Ln(n, { type: "clickoutside" });
	});
}, !0));
var Nn = [
	[
		"requestFullscreen",
		"exitFullscreen",
		"fullscreenElement",
		"fullscreenEnabled",
		"fullscreenchange",
		"fullscreenerror"
	],
	[
		"webkitRequestFullscreen",
		"webkitExitFullscreen",
		"webkitFullscreenElement",
		"webkitFullscreenEnabled",
		"webkitfullscreenchange",
		"webkitfullscreenerror"
	],
	[
		"webkitRequestFullScreen",
		"webkitCancelFullScreen",
		"webkitCurrentFullScreenElement",
		"webkitCancelFullScreen",
		"webkitfullscreenchange",
		"webkitfullscreenerror"
	],
	[
		"mozRequestFullScreen",
		"mozCancelFullScreen",
		"mozFullScreenElement",
		"mozFullScreenEnabled",
		"mozfullscreenchange",
		"mozfullscreenerror"
	],
	[
		"msRequestFullscreen",
		"msExitFullscreen",
		"msFullscreenElement",
		"msFullscreenEnabled",
		"MSFullscreenChange",
		"MSFullscreenError"
	]
];
var le;
if (F) {
	for (const e of Nn) if (e[1] in document) {
		le = e;
		break;
	}
}
computed(() => !1);
var Jt = /* @__PURE__ */ new Set();
var et = /* @__PURE__ */ new WeakMap();
if (F && le) {
	const e = le[2], t = le[4];
	document.addEventListener(t, () => {
		if (Jt.forEach((n) => {
			n.value = !1;
		}), document[e]) {
			const n = et.get(document[e]);
			n && (n.value = !0);
		}
	}, !1);
}
var we = /* @__PURE__ */ new Set();
var Q = /* @__PURE__ */ new Map();
Q.set("x", 0);
Q.set("y", 0);
function jn(e) {
	const { pageX: t, pageY: n } = e;
	Q.set("x", t), Q.set("y", n), we.forEach((r) => {
		r.x.value = t, r.y.value = n;
	});
}
jt(jn);
var oe = [];
var Nr = function() {
	return oe.some(function(e) {
		return e.activeTargets.length > 0;
	});
};
var Wr = function() {
	return oe.some(function(e) {
		return e.skippedTargets.length > 0;
	});
};
var Lt = "ResizeObserver loop completed with undelivered notifications.";
var Ir = function() {
	var e;
	typeof ErrorEvent == "function" ? e = new ErrorEvent("error", { message: Lt }) : (e = document.createEvent("Event"), e.initEvent("error", !1, !1), e.message = Lt), window.dispatchEvent(e);
};
var xe;
(function(e) {
	e.BORDER_BOX = "border-box", e.CONTENT_BOX = "content-box", e.DEVICE_PIXEL_CONTENT_BOX = "device-pixel-content-box";
})(xe || (xe = {}));
var ie = function(e) {
	return Object.freeze(e);
};
var $r = /* @__PURE__ */ (function() {
	function e(t, n) {
		this.inlineSize = t, this.blockSize = n, ie(this);
	}
	return e;
})();
var un = (function() {
	function e(t, n, r, o) {
		return this.x = t, this.y = n, this.width = r, this.height = o, this.top = this.y, this.left = this.x, this.bottom = this.top + this.height, this.right = this.left + this.width, ie(this);
	}
	return e.prototype.toJSON = function() {
		var t = this;
		return {
			x: t.x,
			y: t.y,
			top: t.top,
			right: t.right,
			bottom: t.bottom,
			left: t.left,
			width: t.width,
			height: t.height
		};
	}, e.fromRect = function(t) {
		return new e(t.x, t.y, t.width, t.height);
	}, e;
})();
var mt = function(e) {
	return e instanceof SVGElement && "getBBox" in e;
};
var dn = function(e) {
	if (mt(e)) {
		var t = e.getBBox(), n = t.width, r = t.height;
		return !n && !r;
	}
	var o = e, i = o.offsetWidth, c = o.offsetHeight;
	return !(i || c || e.getClientRects().length);
};
var Pt = function(e) {
	var t;
	if (e instanceof Element) return !0;
	var n = (t = e == null ? void 0 : e.ownerDocument) === null || t === void 0 ? void 0 : t.defaultView;
	return !!(n && e instanceof n.Element);
};
var Hr = function(e) {
	switch (e.tagName) {
		case "INPUT": if (e.type !== "image") break;
		case "VIDEO":
		case "AUDIO":
		case "EMBED":
		case "OBJECT":
		case "CANVAS":
		case "IFRAME":
		case "IMG": return !0;
	}
	return !1;
};
var be = typeof window < "u" ? window : {};
var ke = /* @__PURE__ */ new WeakMap();
var Bt = /auto|scroll/;
var qr = /^tb|vertical/;
var Vr = /msie|trident/i.test(be.navigator && be.navigator.userAgent);
var V = function(e) {
	return parseFloat(e || "0");
};
var ue = function(e, t, n) {
	return e === void 0 && (e = 0), t === void 0 && (t = 0), n === void 0 && (n = !1), new $r((n ? t : e) || 0, (n ? e : t) || 0);
};
var Dt = ie({
	devicePixelContentBoxSize: ue(),
	borderBoxSize: ue(),
	contentBoxSize: ue(),
	contentRect: new un(0, 0, 0, 0)
});
var hn = function(e, t) {
	if (t === void 0 && (t = !1), ke.has(e) && !t) return ke.get(e);
	if (dn(e)) return ke.set(e, Dt), Dt;
	var n = getComputedStyle(e), r = mt(e) && e.ownerSVGElement && e.getBBox(), o = !Vr && n.boxSizing === "border-box", i = qr.test(n.writingMode || ""), c = !r && Bt.test(n.overflowY || ""), s = !r && Bt.test(n.overflowX || ""), a = r ? 0 : V(n.paddingTop), f = r ? 0 : V(n.paddingRight), l = r ? 0 : V(n.paddingBottom), u = r ? 0 : V(n.paddingLeft), v = r ? 0 : V(n.borderTopWidth), h = r ? 0 : V(n.borderRightWidth), b = r ? 0 : V(n.borderBottomWidth), p = r ? 0 : V(n.borderLeftWidth), g = u + f, m = a + l, d = p + h, w = v + b, O = s ? e.offsetHeight - w - e.clientHeight : 0, T = c ? e.offsetWidth - d - e.clientWidth : 0, R = o ? g + d : 0, A = o ? m + w : 0, k = r ? r.width : V(n.width) - R - T, L = r ? r.height : V(n.height) - A - O, P = k + g + T + d, $ = L + m + O + w, N = ie({
		devicePixelContentBoxSize: ue(Math.round(k * devicePixelRatio), Math.round(L * devicePixelRatio), i),
		borderBoxSize: ue(P, $, i),
		contentBoxSize: ue(k, L, i),
		contentRect: new un(u, a, k, L)
	});
	return ke.set(e, N), N;
};
var mn = function(e, t, n) {
	var r = hn(e, n), o = r.borderBoxSize, i = r.contentBoxSize, c = r.devicePixelContentBoxSize;
	switch (t) {
		case xe.DEVICE_PIXEL_CONTENT_BOX: return c;
		case xe.BORDER_BOX: return o;
		default: return i;
	}
};
var Xr = /* @__PURE__ */ (function() {
	function e(t) {
		var n = hn(t);
		this.target = t, this.contentRect = n.contentRect, this.borderBoxSize = ie([n.borderBoxSize]), this.contentBoxSize = ie([n.contentBoxSize]), this.devicePixelContentBoxSize = ie([n.devicePixelContentBoxSize]);
	}
	return e;
})();
var vn = function(e) {
	if (dn(e)) return Infinity;
	for (var t = 0, n = e.parentNode; n;) t += 1, n = n.parentNode;
	return t;
};
var jr = function() {
	var e = Infinity, t = [];
	oe.forEach(function(c) {
		if (c.activeTargets.length !== 0) {
			var s = [];
			c.activeTargets.forEach(function(f) {
				var l = new Xr(f.target), u = vn(f.target);
				s.push(l), f.lastReportedSize = mn(f.target, f.observedBox), u < e && (e = u);
			}), t.push(function() {
				c.callback.call(c.observer, s, c.observer);
			}), c.activeTargets.splice(0, c.activeTargets.length);
		}
	});
	for (var n = 0, r = t; n < r.length; n++) {
		var o = r[n];
		o();
	}
	return e;
};
var Ft = function(e) {
	oe.forEach(function(n) {
		n.activeTargets.splice(0, n.activeTargets.length), n.skippedTargets.splice(0, n.skippedTargets.length), n.observationTargets.forEach(function(o) {
			o.isActive() && (vn(o.target) > e ? n.activeTargets.push(o) : n.skippedTargets.push(o));
		});
	});
};
var Yr = function() {
	var e = 0;
	for (Ft(e); Nr();) e = jr(), Ft(e);
	return Wr() && Ir(), e > 0;
};
var Ue;
var pn = [];
var Kr = function() {
	return pn.splice(0).forEach(function(e) {
		return e();
	});
};
var Ur = function(e) {
	if (!Ue) {
		var t = 0, n = document.createTextNode("");
		new MutationObserver(function() {
			return Kr();
		}).observe(n, { characterData: !0 }), Ue = function() {
			n.textContent = "".concat(t ? t-- : t++);
		};
	}
	pn.push(e), Ue();
};
var Gr = function(e) {
	Ur(function() {
		requestAnimationFrame(e);
	});
};
var Le = 0;
var Jr = function() {
	return !!Le;
};
var Qr = 250;
var Zr = {
	attributes: !0,
	characterData: !0,
	childList: !0,
	subtree: !0
};
var _t = [
	"resize",
	"load",
	"transitionend",
	"animationend",
	"animationstart",
	"animationiteration",
	"keyup",
	"keydown",
	"mouseup",
	"mousedown",
	"mouseover",
	"mouseout",
	"blur",
	"focus"
];
var Nt = function(e) {
	return e === void 0 && (e = 0), Date.now() + e;
};
var Ge = !1;
var ot = new ((function() {
	function e() {
		var t = this;
		this.stopped = !0, this.listener = function() {
			return t.schedule();
		};
	}
	return e.prototype.run = function(t) {
		var n = this;
		if (t === void 0 && (t = Qr), !Ge) {
			Ge = !0;
			var r = Nt(t);
			Gr(function() {
				var o = !1;
				try {
					o = Yr();
				} finally {
					if (Ge = !1, t = r - Nt(), !Jr()) return;
					o ? n.run(1e3) : t > 0 ? n.run(t) : n.start();
				}
			});
		}
	}, e.prototype.schedule = function() {
		this.stop(), this.run();
	}, e.prototype.observe = function() {
		var t = this, n = function() {
			return t.observer && t.observer.observe(document.body, Zr);
		};
		document.body ? n() : be.addEventListener("DOMContentLoaded", n);
	}, e.prototype.start = function() {
		var t = this;
		this.stopped && (this.stopped = !1, this.observer = new MutationObserver(this.listener), this.observe(), _t.forEach(function(n) {
			return be.addEventListener(n, t.listener, !0);
		}));
	}, e.prototype.stop = function() {
		var t = this;
		this.stopped || (this.observer && this.observer.disconnect(), _t.forEach(function(n) {
			return be.removeEventListener(n, t.listener, !0);
		}), this.stopped = !0);
	}, e;
})())();
var Wt = function(e) {
	!Le && e > 0 && ot.start(), Le += e, !Le && ot.stop();
};
var to = function(e) {
	return !mt(e) && !Hr(e) && getComputedStyle(e).display === "inline";
};
var no = (function() {
	function e(t, n) {
		this.target = t, this.observedBox = n || xe.CONTENT_BOX, this.lastReportedSize = {
			inlineSize: 0,
			blockSize: 0
		};
	}
	return e.prototype.isActive = function() {
		var t = mn(this.target, this.observedBox, !0);
		return to(this.target) && (this.lastReportedSize = t), this.lastReportedSize.inlineSize !== t.inlineSize || this.lastReportedSize.blockSize !== t.blockSize;
	}, e;
})();
var ro = /* @__PURE__ */ (function() {
	function e(t, n) {
		this.activeTargets = [], this.skippedTargets = [], this.observationTargets = [], this.observer = t, this.callback = n;
	}
	return e;
})();
var Ae = /* @__PURE__ */ new WeakMap();
var It = function(e, t) {
	for (var n = 0; n < e.length; n += 1) if (e[n].target === t) return n;
	return -1;
};
var Me = (function() {
	function e() {}
	return e.connect = function(t, n) {
		var r = new ro(t, n);
		Ae.set(t, r);
	}, e.observe = function(t, n, r) {
		var o = Ae.get(t), i = o.observationTargets.length === 0;
		It(o.observationTargets, n) < 0 && (i && oe.push(o), o.observationTargets.push(new no(n, r && r.box)), Wt(1), ot.schedule());
	}, e.unobserve = function(t, n) {
		var r = Ae.get(t), o = It(r.observationTargets, n), i = r.observationTargets.length === 1;
		o >= 0 && (i && oe.splice(oe.indexOf(r), 1), r.observationTargets.splice(o, 1), Wt(-1));
	}, e.disconnect = function(t) {
		var n = this, r = Ae.get(t);
		r.observationTargets.slice().forEach(function(o) {
			return n.unobserve(t, o.target);
		}), r.activeTargets.splice(0, r.activeTargets.length);
	}, e;
})();
var $t = (function() {
	function e(t) {
		if (arguments.length === 0) throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
		if (typeof t != "function") throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
		Me.connect(this, t);
	}
	return e.prototype.observe = function(t, n) {
		if (arguments.length === 0) throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
		if (!Pt(t)) throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
		Me.observe(this, t, n);
	}, e.prototype.unobserve = function(t) {
		if (arguments.length === 0) throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
		if (!Pt(t)) throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
		Me.unobserve(this, t);
	}, e.prototype.disconnect = function() {
		Me.disconnect(this);
	}, e.toString = function() {
		return "function ResizeObserver () { [polyfill code] }";
	}, e;
})();
var Ne = /* @__PURE__ */ new WeakMap();
function oo(e) {
	var t;
	for (let n = 0, r = e.length; n < r; ++n) {
		const o = e[n], i = Ne.get(o.target);
		if (typeof i == "function") {
			const { inlineSize: c, blockSize: s } = ((t = o.borderBoxSize) == null ? void 0 : t[0]) ?? {}, { offsetWidth: a, offsetHeight: f } = o.target;
			i(Object.assign(o, {
				offsetWidth: a,
				offsetHeight: f,
				width: c ?? a,
				height: s ?? f
			}));
		}
	}
}
var gn = new (F && window.ResizeObserver || $t)(oo);
function Ee(e, t) {
	Ne.set(e, t), gn.observe(e);
}
function it(e) {
	Ne.has(e) && (gn.unobserve(e), Ne.delete(e));
}
function Lo(e = {}) {
	let t = B;
	const n = watch(() => unref(e.target), (o) => {
		t(), !(!o || typeof e.onResize != "function") && (Ee(o, e.onResize), t = () => {
			it(o), t = B;
		});
	}, { immediate: !0 }), r = () => {
		n(), t();
	};
	return getCurrentScope() && onScopeDispose(r), {
		/**
		* @deprecated Will be removed in next major version, please directly use `observeResize` from imports.
		*/
		observeResize: Ee,
		/**
		* @deprecated Will be removed in next major version, please directly use `unobserveResize` from imports.
		*/
		unobserveResize: it,
		unobserve: r
	};
}
var bn = ref(!1);
computed(() => bn.value);
Object.freeze([
	"top",
	"top-start",
	"top-end",
	"bottom",
	"bottom-start",
	"bottom-end",
	"left",
	"left-start",
	"left-end",
	"right",
	"right-start",
	"right-end"
]);
var Ht = "__theme_style__";
var Pe = "__theme_observer__";
var We = reactive(/* @__PURE__ */ new Map());
var st$1 = /* @__PURE__ */ new Map();
watch(We, () => {
	if (!F) return;
	st$1.clear();
	const e = document.head.querySelector(`#${Ht}`);
	e && document.head.removeChild(e);
	const t = document.createElement("style");
	let n = `.${Pe} { width: 1px }`, r = 1;
	for (const [o, [i, c]] of We.entries()) n += ` html.${i} .${Pe}, .${c} .${Pe} { width: ${++r}px }`, st$1.set(r, o);
	t.textContent = n, t.id = Ht, document.head.appendChild(t);
});
//#endregion
//#region ../../node_modules/.pnpm/grid-layout-plus@1.1.1_vue@3.5.45_typescript@5.9.3_/node_modules/grid-layout-plus/es/components/grid-layout.vue.mjs
var De = /* @__PURE__ */ defineComponent({
	__name: "grid-layout",
	props: {
		autoSize: {
			type: Boolean,
			default: !0
		},
		colNum: { default: 12 },
		rowHeight: { default: 150 },
		maxRows: { default: Infinity },
		margin: { default: () => [10, 10] },
		isDraggable: {
			type: Boolean,
			default: !0
		},
		isResizable: {
			type: Boolean,
			default: !0
		},
		isMirrored: {
			type: Boolean,
			default: !1
		},
		isBounded: {
			type: Boolean,
			default: !1
		},
		useCssTransforms: {
			type: Boolean,
			default: !0
		},
		verticalCompact: {
			type: Boolean,
			default: !0
		},
		restoreOnDrag: {
			type: Boolean,
			default: !1
		},
		layout: {},
		responsive: {
			type: Boolean,
			default: !1
		},
		responsiveLayouts: { default: () => ({}) },
		transformScale: { default: 1 },
		breakpoints: { default: () => ({
			lg: 1200,
			md: 996,
			sm: 768,
			xs: 480,
			xxs: 0
		}) },
		cols: { default: () => ({
			lg: 12,
			md: 10,
			sm: 6,
			xs: 4,
			xxs: 2
		}) },
		preventCollision: {
			type: Boolean,
			default: !1
		},
		useStyleCursor: {
			type: Boolean,
			default: !0
		}
	},
	emits: [
		"layout-before-mount",
		"layout-mounted",
		"layout-updated",
		"breakpoint-changed",
		"update:layout",
		"layout-ready"
	],
	setup(Y$1, { expose: N, emit: $$1 }) {
		const a = Y$1, u = $$1, t = reactive({
			width: -1,
			mergedStyle: {},
			lastLayoutLength: 0,
			isDragging: !1,
			placeholder: {
				x: 0,
				y: 0,
				w: 0,
				h: 0,
				i: ""
			},
			layouts: {},
			lastBreakpoint: null,
			originalLayout: null
		}), k$2 = /* @__PURE__ */ new Map(), o = ref(a.layout), g = ref(), { observeResize: A$1, unobserveResize: U } = Lo(), r = Zr$1();
		r.on("resizeEvent", q), r.on("dragEvent", G), onBeforeMount(() => {
			u("layout-before-mount", o.value);
		}), onMounted(() => {
			u("layout-mounted", o.value), nextTick(() => {
				k(o.value), t.originalLayout = o.value, nextTick(() => {
					D(), g.value && A$1(g.value, no$1(C$1, 16)), $(o.value, a.verticalCompact), u("layout-updated", o.value), y$3(), C$1();
				});
			});
		}), onBeforeUnmount(() => {
			r.clearAll(), g.value && U(g.value);
		});
		function q(e, n, l, f, d, c) {
			S(e, n, l, f, d, c);
		}
		function G(e, n, l, f, d, c) {
			E(e, n, l, f, d, c);
		}
		watch(() => t.width, (e, n) => {
			nextTick(() => {
				r.emit("updateWidth", e), n === -1 && nextTick(() => {
					u("layout-ready", o.value);
				}), y$3();
			});
		}), watch(() => [a.layout, a.layout.length], () => {
			o.value = a.layout, R();
		}), watch(() => a.colNum, (e) => {
			r.emit("setColNum", e);
		}), watch(() => a.rowHeight, (e) => {
			r.emit("setRowHeight", e);
		}), watch(() => a.isDraggable, (e) => {
			r.emit("setDraggable", e);
		}), watch(() => a.isResizable, (e) => {
			r.emit("setResizable", e);
		}), watch(() => a.isBounded, (e) => {
			r.emit("setBounded", e);
		}), watch(() => a.transformScale, (e) => {
			r.emit("setTransformScale", e);
		}), watch(() => a.responsive, (e) => {
			e || (u("update:layout", t.originalLayout), r.emit("setColNum", a.colNum)), C$1();
		}), watch(() => a.maxRows, (e) => {
			r.emit("setMaxRows", e);
		}), watch([() => a.margin, () => a.margin[1]], y$3), provide(T, reactive({
			...toRefs(a),
			...toRefs(t),
			increaseItem: K,
			decreaseItem: j
		})), provide(v$1, r), N({
			state: t,
			getItem: P,
			resizeEvent: S,
			dragEvent: E,
			layoutUpdate: R
		});
		function K(e) {
			k$2.set(e.i, e);
		}
		function j(e) {
			k$2.delete(e.i);
		}
		function P(e) {
			return k$2.get(e);
		}
		function R() {
			if (!ie$1(o.value) && !ie$1(t.originalLayout)) {
				if (o.value.length !== t.originalLayout.length) {
					const e = J(o.value, t.originalLayout);
					if (e.length > 0) if (o.value.length > t.originalLayout.length) t.originalLayout = t.originalLayout.concat(e);
					else {
						const n = new Set(e.map((l) => l.i));
						t.originalLayout = t.originalLayout.filter((l) => !n.has(l.i));
					}
					t.lastLayoutLength = o.value.length, D();
				}
				$(o.value, a.verticalCompact), r.emit("updateWidth", t.width), y$3(), u("layout-updated", o.value);
			}
		}
		function y$3() {
			t.mergedStyle = { height: V() };
		}
		function C$1() {
			g.value && (t.width = g.value.offsetWidth), r.emit("resizeEvent");
		}
		function V() {
			if (!a.autoSize) return;
			const e = parseFloat(a.margin[1]);
			return A(o.value) * (a.rowHeight + e) + e + "px";
		}
		let b;
		function E(e, n, l, f, d, c) {
			let i = C(o.value, n);
			ie$1(i) && (i = {
				h: 0,
				w: 0,
				x: 0,
				y: 0,
				i: ""
			}), e === "dragstart" && !a.verticalCompact && (b = o.value.reduce((v, { i: x, x: p, y: h }) => ({
				...v,
				[x]: {
					x: p,
					y: h
				}
			}), {})), e === "dragmove" || e === "dragstart" ? (t.placeholder.i = n, t.placeholder.x = i.x, t.placeholder.y = i.y, t.placeholder.w = c, t.placeholder.h = d, nextTick(() => {
				t.isDragging = !0;
			}), r.emit("updateWidth", t.width)) : nextTick(() => {
				t.isDragging = !1;
			}), o.value = x(o.value, i, l, f, !0, a.preventCollision), a.restoreOnDrag ? (i.static = !0, $(o.value, a.verticalCompact, b), i.static = !1) : $(o.value, a.verticalCompact), r.emit("compact"), y$3(), e === "dragend" && (b = void 0, u("layout-updated", o.value));
		}
		function S(e, n, l, f, d, c) {
			let i = C(o.value, n);
			ie$1(i) && (i = {
				h: 0,
				w: 0,
				x: 0,
				y: 0,
				i: ""
			});
			let v;
			if (a.preventCollision) {
				const x = L(o.value, {
					...i,
					w: c,
					h: d
				}).filter((p) => p.i !== i.i);
				if (v = x.length > 0, v) {
					let p = Infinity, h = Infinity;
					x.forEach((L) => {
						L.x > i.x && (p = Math.min(p, L.x)), L.y > i.y && (h = Math.min(h, L.y));
					}), Number.isFinite(p) && (i.w = p - i.x), Number.isFinite(h) && (i.h = h - i.y);
				}
			}
			v || (i.w = c, i.h = d), e === "resizestart" || e === "resizemove" ? (t.placeholder.i = n, t.placeholder.x = l, t.placeholder.y = f, t.placeholder.w = i.w, t.placeholder.h = i.h, nextTick(() => {
				t.isDragging = !0;
			}), r.emit("updateWidth", t.width)) : e && nextTick(() => {
				t.isDragging = !1;
			}), a.responsive && X(), $(o.value, a.verticalCompact), r.emit("compact"), y$3(), e === "resizeend" && u("layout-updated", o.value);
		}
		function X() {
			const e = y(a.breakpoints, t.width);
			if (e === t.lastBreakpoint) return;
			const n = B$1(e, a.cols);
			!ie$1(t.lastBreakpoint) && !t.layouts[t.lastBreakpoint] && (t.layouts[t.lastBreakpoint] = Y(o.value));
			const l = v(t.originalLayout, t.layouts, a.breakpoints, e, t.lastBreakpoint, n, a.verticalCompact);
			t.layouts[e] = l, t.lastBreakpoint !== e && u("breakpoint-changed", e, l), o.value = l, u("update:layout", l), t.lastBreakpoint = e, r.emit("setColNum", n);
		}
		function D() {
			t.layouts = Object.assign({}, a.responsiveLayouts);
		}
		function J(e, n) {
			const l = new Set(n.map((i) => i.i)), f = new Set(e.map((i) => i.i)), d = e.filter((i) => !l.has(i.i)), c = n.filter((i) => !f.has(i.i));
			return d.concat(c);
		}
		return (e, n) => (openBlock(), createElementBlock("div", {
			ref_key: "wrapper",
			ref: g,
			class: "vgl-layout",
			style: normalizeStyle(t.mergedStyle)
		}, [e.$slots.default ? renderSlot(e.$slots, "default", { key: 0 }) : (openBlock(!0), createElementBlock(Fragment, { key: 1 }, renderList(o.value, (l) => (openBlock(), createBlock(st, mergeProps({
			key: l.i,
			ref_for: !0
		}, l), {
			default: withCtx(() => [renderSlot(e.$slots, "item", { item: l })]),
			_: 2
		}, 1040))), 128)), withDirectives(createVNode(st, {
			class: "vgl-item--placeholder",
			x: t.placeholder.x,
			y: t.placeholder.y,
			w: t.placeholder.w,
			h: t.placeholder.h,
			i: t.placeholder.i
		}, null, 8, [
			"x",
			"y",
			"w",
			"h",
			"i"
		]), [[vShow, t.isDragging]])], 4));
	}
});
//#endregion
//#region ../../node_modules/.pnpm/grid-layout-plus@1.1.1_vue@3.5.45_typescript@5.9.3_/node_modules/grid-layout-plus/es/index.mjs
(function() {
	"use strict";
	try {
		if (typeof document < "u") {
			var e = document.createElement("style");
			e.appendChild(document.createTextNode(".vgl-layout{--vgl-placeholder-bg: red;--vgl-placeholder-opacity: 20%;--vgl-placeholder-z-index: 2;--vgl-item-resizing-z-index: 3;--vgl-item-resizing-opacity: 60%;--vgl-item-dragging-z-index: 3;--vgl-item-dragging-opacity: 100%;--vgl-resizer-size: 10px;--vgl-resizer-border-color: #444;--vgl-resizer-border-width: 2px;position:relative;box-sizing:border-box;transition:height .2s ease}.vgl-item{position:absolute;box-sizing:border-box;transition:.2s ease;transition-property:left,top,right}.vgl-item--placeholder{z-index:var(--vgl-placeholder-z-index, 2);-webkit-user-select:none;-moz-user-select:none;user-select:none;background-color:var(--vgl-placeholder-bg, red);opacity:var(--vgl-placeholder-opacity, 20%);transition-duration:.1s}.vgl-item--no-touch{touch-action:none}.vgl-item--transform{right:auto;left:0;transition-property:transform}.vgl-item--transform.vgl-item--rtl{right:0;left:auto}.vgl-item--resizing{z-index:var(--vgl-item-resizing-z-index, 3);-webkit-user-select:none;-moz-user-select:none;user-select:none;opacity:var(--vgl-item-resizing-opacity, 60%)}.vgl-item--dragging{z-index:var(--vgl-item-dragging-z-index, 3);-webkit-user-select:none;-moz-user-select:none;user-select:none;opacity:var(--vgl-item-dragging-opacity, 100%);transition:none}.vgl-item__resizer{position:absolute;right:0;bottom:0;box-sizing:border-box;width:var(--vgl-resizer-size);height:var(--vgl-resizer-size);cursor:se-resize}.vgl-item__resizer:before{position:absolute;top:0;right:3px;bottom:3px;left:0;content:\"\";border:0 solid var(--vgl-resizer-border-color);border-right-width:var(--vgl-resizer-border-width);border-bottom-width:var(--vgl-resizer-border-width)}.vgl-item__resizer--rtl{right:auto;left:0;cursor:sw-resize}.vgl-item__resizer--rtl:before{top:0;right:0;bottom:3px;left:3px;border-right-width:0;border-bottom-width:var(--vgl-resizer-border-width);border-left-width:var(--vgl-resizer-border-width)}")), document.head.appendChild(e);
		}
	} catch (r) {
		console.error("vite-plugin-css-injected-by-js", r);
	}
})();
//#endregion
export { st as GridItem, De as GridLayout };
