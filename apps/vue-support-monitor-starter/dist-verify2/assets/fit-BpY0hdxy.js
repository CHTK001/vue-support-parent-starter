import { n as s$1, r as t } from "./objectSpread2-BfUs1NtZ.js";
//#region ../../node_modules/.pnpm/@file-viewer+vue3@3.1.2_vue@3.5.40_typescript@5.9.3_/node_modules/@file-viewer/vue3/dist/components/fit.js
var n = (e = {}) => {
	var t, n, r;
	let i = Number.isFinite(e.scale) && e.scale ? Number(e.scale) : 1;
	return {
		scale: i,
		label: e.label || `${Math.round(i * 100)}%`,
		canZoomIn: (t = e.canZoomIn) != null && t,
		canZoomOut: (n = e.canZoomOut) != null && n,
		canReset: (r = e.canReset) != null && r,
		minScale: e.minScale,
		maxScale: e.maxScale
	};
};
var r = (e) => e === !1 ? { enabled: !1 } : e === !0 || e === void 0 ? {} : e;
var i = (e = "") => ({
	query: e,
	total: 0,
	currentIndex: -1,
	current: null,
	matches: []
});
var a = (e) => e === !1 ? {
	enabled: !1,
	collectText: !1
} : e === !0 || e === void 0 ? {} : e;
var o = (e, t) => {
	var n;
	let r = a(t);
	if (r.enabled === !1 || r.collectText === !1) return [];
	let i = Math.max(200, r.chunkSize || 1200), o = Math.max(0, Math.min(i - 1, (n = r.chunkOverlap) == null ? 160 : n)), s = Math.max(0, r.maxTextLength || 0), c = [];
	return e.forEach((e) => {
		let t = s ? e.text.slice(0, s) : e.text;
		if (!t) return;
		if (t.length <= i) {
			c.push({
				id: `${e.id}-chunk-1`,
				text: t,
				anchor: e,
				startLine: e.line,
				endLine: e.line
			});
			return;
		}
		let n = 0, r = 1;
		for (; n < t.length;) {
			let a = t.slice(n, n + i);
			if (c.push({
				id: `${e.id}-chunk-${r}`,
				text: a,
				anchor: e,
				startLine: e.line,
				endLine: e.line
			}), n + i >= t.length) break;
			n += i - o, r += 1;
		}
	}), c;
};
var s = (/* @__PURE__ */ "[data-viewer-anchor-id],.pdfViewer .page,.docx-wrapper section,.docx p,.docx li,.docx table,.markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4,.markdown-body h5,.markdown-body h6,.markdown-body p,.markdown-body li,.markdown-body pre,.markdown-body table,article h1,article h2,article h3,article h4,article h5,article h6,article p,article li,article pre,article table,pre code,p,li,tr,h1,h2,h3,h4,h5,h6,pre,table".split(",")).join(",");
var c = [
	".viewer-actions",
	".viewer-watermark",
	".state-panel",
	".pdf-toolbar",
	".pdf-nav-pane",
	".flyfish-search-match"
].join(",");
var l = (e) => typeof CSS < "u" && typeof CSS.escape == "function" ? CSS.escape(e) : e.replace(/["\\]/g, "\\$&");
var u = (e, t = 160) => {
	let n = e.replace(/\s+/g, " ").trim();
	return n.length > t ? `${n.slice(0, t - 1)}…` : n;
};
var d = (e) => {
	let t = e.getBoundingClientRect();
	return t.width > 0 || t.height > 0;
};
var f = (e) => !!e.closest(c);
var p = (e) => {
	let t = e.closest("[data-page-number], [data-page]"), n = (t == null ? void 0 : t.dataset.pageNumber) || (t == null ? void 0 : t.dataset.page), r = n ? Number.parseInt(n, 10) : NaN;
	return Number.isFinite(r) ? r : void 0;
};
var m = (e) => e.matches(".pdfViewer .page, [data-page-number], [data-page]") ? "page" : e.matches("p, li, tr, pre, code") ? "line" : "block";
var h = (e, t) => {
	let n = e.parentElement;
	for (; n;) {
		if (t.has(n)) return !0;
		n = n.parentElement;
	}
	return !1;
};
var g = (e) => {
	if (!e) return [];
	let t = e.getBoundingClientRect(), n = /* @__PURE__ */ new Set(), r = [];
	return Array.from(e.querySelectorAll(s)).forEach((i) => {
		if (f(i) || !d(i)) return;
		let a = u(i.textContent || "", 1e3);
		if (!a || h(i, n) && !i.matches("p, li, tr, pre, code")) return;
		n.add(i);
		let o = i.dataset.viewerAnchorId || `viewer-anchor-${r.length + 1}`;
		i.dataset.viewerAnchorId = o, i.dataset.viewerLine = String(r.length + 1);
		let s = i.getBoundingClientRect();
		r.push({
			id: o,
			index: r.length,
			line: r.length + 1,
			type: m(i),
			label: u(a, 96),
			text: a,
			page: p(i),
			top: s.top - t.top + e.scrollTop,
			left: s.left - t.left + e.scrollLeft,
			width: s.width,
			height: s.height
		});
	}), r;
};
var _ = (e, t, n) => {
	if (!e) return null;
	let r = e.closest("[data-viewer-anchor-id]");
	if (r != null && r.dataset.viewerAnchorId) {
		let e = t.find((e) => e.id === r.dataset.viewerAnchorId);
		if (e) return e;
	}
	if (!n) return null;
	let i = n.getBoundingClientRect(), a = e.getBoundingClientRect().top - i.top + n.scrollTop, o = null;
	for (let e of t) {
		if (e.top <= a + 1) {
			o = e;
			continue;
		}
		break;
	}
	return o;
};
var v = (e, t) => {
	if (!e || !t.length) return null;
	let n = e.scrollTop + e.clientHeight * .42, r = t[0];
	for (let e of t) {
		if (e.top <= n) {
			r = e;
			continue;
		}
		break;
	}
	return r;
};
var y = (e, t) => {
	if (!e || t == null) return !1;
	let n = typeof t == "object" ? `[data-viewer-anchor-id="${l(t.id)}"]` : typeof t == "number" ? `[data-viewer-line="${t}"]` : `[data-viewer-anchor-id="${l(t)}"]`, r = e.querySelector(n);
	return r ? (r.scrollIntoView({
		block: "center",
		inline: "nearest"
	}), !0) : typeof t == "object" && (e.scrollTo({
		top: Math.max(0, t.top - e.clientHeight * .18),
		left: Math.max(0, Math.min(t.left, e.scrollWidth - e.clientWidth)),
		behavior: "smooth"
	}), !0);
};
var b = /* @__PURE__ */ new WeakMap();
var x = /* @__PURE__ */ new WeakMap();
var S = /* @__PURE__ */ new WeakMap();
var C = (e) => !!e && e.nodeType === 1;
var w = (e, t) => {
	if (!(e != null && e.querySelectorAll)) return [];
	let n = Array.from(e.querySelectorAll(t));
	C(e) && e.shadowRoot && n.push(...w(e.shadowRoot, t));
	let r = Array.from(e.querySelectorAll("*"));
	for (let e of r) e.shadowRoot && n.push(...w(e.shadowRoot, t));
	return n;
};
var T = (e) => {
	if (!e) return null;
	let t = C(e) ? b.get(e) || e.__flyfishViewerSearchProvider : null;
	if (t) return t;
	let n = w(e, "[data-viewer-search-provider]")[0];
	return n && (b.get(n) || n.__flyfishViewerSearchProvider) || null;
};
var E = (e, t) => {
	x.set(e, t), e.dataset.viewerZoomProvider = e.dataset.viewerZoomProvider || "custom", e.__flyfishViewerZoomProvider = t;
};
var D = (e) => {
	e && (x.delete(e), delete e.dataset.viewerZoomProvider, delete e.__flyfishViewerZoomProvider);
};
var O = (e) => {
	if (!e) return null;
	let t = C(e) ? x.get(e) || e.__flyfishViewerZoomProvider : null;
	if (t) return t;
	let n = w(e, "[data-viewer-zoom-provider]")[0];
	return n && (x.get(n) || n.__flyfishViewerZoomProvider) || null;
};
var k = (e, t) => {
	S.set(e, t), e.dataset.viewerViewStateProvider = e.dataset.viewerViewStateProvider || "custom", e.__flyfishViewerViewStateProvider = t;
};
var A = (e) => {
	e && (S.delete(e), delete e.dataset.viewerViewStateProvider, delete e.__flyfishViewerViewStateProvider);
};
var j = (e) => {
	if (!e) return null;
	let t = C(e) ? S.get(e) || e.__flyfishViewerViewStateProvider : null;
	if (t && (!C(e) || e.dataset.viewerViewStateProvider !== "generic")) return t;
	let n = w(e, "[data-viewer-view-state-provider]"), r = n.find((e) => e.dataset.viewerViewStateProvider !== "generic"), i = n.find((e) => e.dataset.viewerViewStateProvider === "generic"), a = r || i;
	return a ? S.get(a) || a.__flyfishViewerViewStateProvider || null : t || null;
};
var M = (e) => ({
	scale: e.scale,
	label: e.label,
	canZoomIn: e.canZoomIn,
	canZoomOut: e.canZoomOut,
	canReset: e.canReset,
	minScale: e.minScale,
	maxScale: e.maxScale
});
var N = (e, t) => {
	let r = n(t || {});
	return e.scale = r.scale, e.label = r.label, e.canZoomIn = r.canZoomIn, e.canZoomOut = r.canZoomOut, e.canReset = r.canReset, e.minScale = r.minScale, e.maxScale = r.maxScale, e;
};
var P = (e) => M(e);
(function() {
	var t$1 = t(function* (e, t) {
		return N(e, yield t()), P(e);
	});
	return function(e, n) {
		return t$1.apply(this, arguments);
	};
})();
var F = () => {
	let e = /* @__PURE__ */ new Set();
	return {
		emit() {
			e.forEach((e) => e());
		},
		subscribe(t) {
			return e.add(t), () => {
				e.delete(t);
			};
		},
		clear() {
			e.clear();
		}
	};
};
var I = (e) => {
	var t, n;
	return ((n = (t = e == null ? void 0 : e.ownerDocument) == null ? void 0 : t.defaultView) == null ? void 0 : n.MutationObserver) || (typeof MutationObserver < "u" ? MutationObserver : void 0);
};
var L = ({ root: t$3, enabled: r, beforeZoom: i, onChange: a }) => {
	let o = null, s = null, c = null, l = !1, u = n(), d = () => {
		a?.(M(u));
	}, f = () => {
		s?.(), s = null, o = null, N(u, null);
	}, p = () => {
		var e, n;
		if ((r == null ? void 0 : r()) === !1) return f(), null;
		let i = O(t$3());
		return i !== o && (s?.(), o = i, s = ((e = i == null ? void 0 : i.subscribe) == null ? void 0 : e.call(i, () => {
			N(u, i.getState()), l || d();
		})) || null), N(u, ((n = i == null ? void 0 : i.getState) == null ? void 0 : n.call(i)) || null), i;
	}, m = () => {
		c?.disconnect(), c = null;
	}, h = function() {
		var t$2 = t(function* (e, t) {
			let n = p();
			if (!n || i && (yield i(e)) === !1) return M(u);
			l = !0;
			try {
				let e = yield t(n);
				return N(u, e || n.getState()), M(u);
			} finally {
				l = !1;
			}
		});
		return function(e, n) {
			return t$2.apply(this, arguments);
		};
	}();
	return {
		get provider() {
			return o;
		},
		state: u,
		hasProvider() {
			return !!p();
		},
		refreshProvider: p,
		observe() {
			m();
			let e = t$3(), n = I(e);
			if (!e || !n) {
				p();
				return;
			}
			c = new n(() => {
				p();
			}), c.observe(e, {
				childList: !0,
				subtree: !0
			}), p();
		},
		clearProvider: f,
		getState() {
			return M(u);
		},
		zoomIn: () => h("zoom-in", (e) => e.zoomIn()),
		zoomOut: () => h("zoom-out", (e) => e.zoomOut()),
		resetZoom: () => h("zoom-reset", (e) => e.resetZoom()),
		destroy() {
			m(), f();
		}
	};
};
var R = [
	"auto",
	"contain",
	"cover",
	"width",
	"height",
	"actual",
	"scale-down"
];
var z = [
	"until-interaction",
	"always",
	"initial"
];
var B = "until-interaction";
var V = 0;
var H = 8;
var U = (e) => !!e && typeof e == "object" && !Array.isArray(e);
var W = (e) => typeof e == "string" && R.includes(e);
var G = (e) => typeof e == "string" && z.includes(e);
var K = (e) => {
	let t = Number(e);
	return Number.isFinite(t) && t > 0 ? t : void 0;
};
var q = (e) => {
	let t = Number(e);
	return Number.isFinite(t) && t > 0 ? t : V;
};
var J = (e) => {
	if (e == null || e === !1) return null;
	if (W(e)) return {
		mode: e,
		resize: B,
		padding: V
	};
	if (!U(e)) return null;
	let t = K(e.minScale), n = K(e.maxScale), r = t !== void 0 && n !== void 0 && n < t ? t : n;
	return {
		mode: W(e.mode) ? e.mode : "auto",
		resize: G(e.resize) ? e.resize : B,
		padding: q(e.padding),
		minScale: t,
		maxScale: r
	};
};
var Y = (e, t, n) => {
	let r = e;
	return Number.isFinite(t) && (r = Math.max(Number(t), r)), Number.isFinite(n) && (r = Math.min(Number(n), r)), r;
};
var X = ({ mode: e, viewportWidth: t, viewportHeight: n, contentWidth: r, contentHeight: i, minScale: a, maxScale: o }) => {
	if (t <= 0 || n <= 0 || r <= 0 || i <= 0) return;
	let s = t / r, c = n / i, l = Math.min(s, c), u = Math.max(s, c), d = (() => {
		switch (e) {
			case "cover": return u;
			case "width": return s;
			case "height": return c;
			case "actual": return 1;
			case "scale-down": return Math.min(1, l);
			default: return l;
		}
	})();
	if (!(!Number.isFinite(d) || d <= 0)) return Y(d, a, o);
};
var Z = (e) => {
	var t, n;
	if (!e) return !1;
	let r = Number((t = e.scale) == null ? (n = e.zoom) == null ? void 0 : n.scale : t);
	if (Number.isFinite(r) && r > 0 || Number.isFinite(e.page) || Number.isFinite(e.rotation) || e.navigation && Object.keys(e.navigation).length > 0 || e.extra && Object.keys(e.extra).length > 0) return !0;
	let i = e.scroll || {};
	return [
		"top",
		"left",
		"topRatio",
		"leftRatio"
	].some((e) => {
		let t = i[e];
		return Number.isFinite(t);
	});
};
var Q = (e, t, n = "viewer", r = "none") => ({
	applied: !1,
	mode: e.mode,
	resize: e.resize,
	source: n,
	reason: t,
	provider: r
});
var $ = (e, t, n) => ({
	applied: !!(e != null && e.applied),
	mode: (e == null ? void 0 : e.mode) || t.mode,
	resize: (e == null ? void 0 : e.resize) || t.resize,
	scale: e == null ? void 0 : e.scale,
	source: (e == null ? void 0 : e.source) || t.source,
	reason: e == null ? void 0 : e.reason,
	provider: (e == null ? void 0 : e.provider) || n,
	state: e == null ? void 0 : e.state
});
var ee = (e) => e === "pending" || e === "retry" || e === "image-not-ready" || e === "unmeasurable";
var te = (e) => {
	var t;
	let n = (t = e.getBoundingClientRect) == null ? void 0 : t.call(e);
	return {
		width: Math.max(0, (n == null ? void 0 : n.width) || e.clientWidth || 0),
		height: Math.max(0, (n == null ? void 0 : n.height) || e.clientHeight || 0)
	};
};
var ne = ({ root: n, enabled: r, getFit: i = () => void 0, onFit: a }) => {
	let o = null, s = null, c = null, l = !1, u = 0, d = () => {
		var e;
		let t = n();
		return ((e = t == null ? void 0 : t.ownerDocument) == null ? void 0 : e.defaultView) || (typeof window < "u" ? window : void 0);
	}, f = () => {
		if (s === null) return;
		let e = d();
		e != null && e.cancelAnimationFrame && e.cancelAnimationFrame(s), s = null;
	}, p = () => {
		c && clearTimeout(c), c = null;
	}, m = (e, t) => {
		let n = e === void 0 ? i() : e;
		return n == null ? t === "api" ? J("auto") : null : J(n);
	}, h = (e, t, n) => {
		u >= H || (p(), u += 1, c = setTimeout(() => {
			c = null, g(e, {
				source: t,
				reason: n === "api" ? "api" : "retry"
			});
		}, 32 * u));
	}, g = function() {
		var i = t(function* (e, i = {}) {
			let o = i.source || "api", s = i.reason || "api", c = m(e, s);
			if (!c) return {
				applied: !1,
				mode: "auto",
				resize: B,
				source: o,
				reason: "not-configured",
				provider: "none"
			};
			if ((r == null ? void 0 : r()) === !1) return Q(c, "disabled", o);
			let l = n();
			if (!l) return h(e, o, s), Q(c, "no-root", o);
			let d = te(l);
			if (d.width <= 0 || d.height <= 0) return h(e, o, s), Q(c, "zero-size", o);
			let f = s$1(s$1({}, c), {}, {
				source: o,
				reason: s,
				viewportWidth: Math.max(0, d.width - c.padding * 2),
				viewportHeight: Math.max(0, d.height - c.padding * 2),
				container: l
			}), p = j(l), g = null;
			if (p != null && p.fit) {
				let e = $(yield p.fit(f), f, "view-state");
				if (e.applied) return u = 0, a?.(e), e;
				g = e;
			}
			let _ = O(l);
			if (_ != null && _.fit) {
				let e = $(yield _.fit(f), f, "zoom");
				if (e.applied) return u = 0, a?.(e), e;
				g = e;
			}
			let v = Q(c, p || _ ? "unsupported" : "no-provider", o);
			return (v.reason === "no-provider" || ee(g == null ? void 0 : g.reason)) && h(e, o, s), v;
		});
		return function(e) {
			return i.apply(this, arguments);
		};
	}(), _ = (e = "resize") => {
		let t = J(i());
		if (!t || t.resize === "initial" || t.resize === "until-interaction" && l) return;
		f();
		let n = d(), r = () => {
			s = null, g(void 0, {
				source: "viewer",
				reason: e
			});
		};
		if (n != null && n.requestAnimationFrame) {
			s = n.requestAnimationFrame(r);
			return;
		}
		s = setTimeout(r, 16);
	}, v = () => {
		f(), o?.disconnect(), o = null;
	};
	return {
		normalize: J,
		fit: function() {
			var t$4 = t(function* (e, t) {
				return p(), l = !1, g(e, {
					source: (t == null ? void 0 : t.source) || "api",
					reason: (t == null ? void 0 : t.reason) || "api"
				});
			});
			return function(e, n) {
				return t$4.apply(this, arguments);
			};
		}(),
		applyInitialFit: function() {
			var t$5 = t(function* (e = {}) {
				return p(), u = 0, l = !1, e.skip ? Q(J(i()) || J("auto"), "initial-view-state", "initial") : g(void 0, {
					source: "initial",
					reason: "initial"
				});
			});
			return function() {
				return t$5.apply(this, arguments);
			};
		}(),
		scheduleFit: _,
		observe() {
			var e, t;
			v();
			let r = n(), i = ((t = (e = r == null ? void 0 : r.ownerDocument) == null ? void 0 : e.defaultView) == null ? void 0 : t.ResizeObserver) || (typeof ResizeObserver < "u" ? ResizeObserver : void 0);
			!r || !i || (o = new i(() => _("resize")), o.observe(r));
		},
		markUserInteraction() {
			l = !0, p();
		},
		resetAutoFit() {
			l = !1, u = 0;
		},
		destroy() {
			v(), p(), u = 0;
		}
	};
};
//#endregion
export { r as _, L as a, X as c, g as d, i as f, o as g, ne as h, F as i, Z as l, k as m, D as n, O as o, j as p, E as r, T as s, A as t, _ as u, v, y };
