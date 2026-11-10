import { r as t } from "./objectSpread2-DeKe-97G.js";
import { c as X, i as F, n as D, r as E } from "./fit-Co7ZHR3d.js";
import { n as f$1 } from "./messages-u0TThKdS.js";
//#region ../../node_modules/.pnpm/@file-viewer+vue3@3.1.2_vue@3.5.45_typescript@5.9.3_/node_modules/@file-viewer/vue3/dist/components/image.js
var o = {
	avif: "image/avif",
	bmp: "image/bmp",
	gif: "image/gif",
	heic: "image/heic",
	heif: "image/heif",
	ico: "image/x-icon",
	jxl: "image/jxl",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	svg: "image/svg+xml",
	tif: "image/tiff",
	tiff: "image/tiff",
	webp: "image/webp"
};
var s = "\n.image-viewer{position:relative;width:100%;height:100%;overflow:auto;background:var(--file-viewer-render-surface-background,#eef1f4);box-sizing:border-box}\n.image-stage{min-width:100%;min-height:100%;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}\n.image-stage img{display:block;width:auto;max-width:none;margin:0 auto;border:0;box-shadow:0 18px 48px rgba(15,23,42,.16);background:#fff;cursor:zoom-in}\n.image-stage img:focus-visible{outline:3px solid #2563eb;outline-offset:4px}\n.image-lightbox{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:40px;background:rgba(15,23,42,.9);box-sizing:border-box;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility 0s linear .18s}\n.image-lightbox[data-open='true']{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}\n.image-lightbox img{display:block;max-width:100%;max-height:100%;object-fit:contain;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.4);cursor:default;transform:scale(.985);transition:transform .18s ease}\n.image-lightbox[data-open='true'] img{transform:scale(1)}\n.image-lightbox button{position:absolute;top:16px;right:16px;display:grid;width:40px;height:40px;place-items:center;padding:0;border:1px solid rgba(255,255,255,.7);border-radius:999px;background:rgba(255,255,255,.96);color:#172033;font:400 27px/1 Arial,sans-serif;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,.24);transition:background-color .14s ease,transform .14s ease}\n.image-lightbox button:hover{background:#fff;transform:scale(1.04)}\n.image-lightbox button:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}\n[data-viewer-theme='dark'] .image-viewer{background:var(--file-viewer-render-surface-background,#101820)}\n@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .image-viewer{background:var(--file-viewer-render-surface-background,#101820)}}\n@media (max-width:767px){.image-stage{padding:12px}.image-lightbox{padding:16px}.image-lightbox button{top:12px;right:12px}}\n@media (prefers-reduced-motion:reduce){.image-lightbox,.image-lightbox img,.image-lightbox button{transition:none}}\n";
var c = (e) => {
	let t = e.createElement("style");
	return t.textContent = s, t;
};
var l = (e) => o[(e || "").trim().toLowerCase()] || "image/*";
var u = function() {
	var t$1 = t(function* (e) {
		return yield new Promise((t, n) => {
			let r = new FileReader();
			r.onload = (e) => {
				var r;
				let i = (r = e.target) == null ? void 0 : r.result;
				if (typeof i == "string") {
					t(i);
					return;
				}
				n(/* @__PURE__ */ Error("Unable to read image data URL."));
			}, r.onerror = () => n(r.error || /* @__PURE__ */ Error("Unable to read image data URL.")), r.readAsDataURL(e);
		});
	});
	return function(e) {
		return t$1.apply(this, arguments);
	};
}();
var d = function() {
	var t$2 = t(function* (e, t) {
		let n = (t || "").trim().toLowerCase();
		if (n === "heic" || n === "heif") throw Error("HEIC/HEIF image conversion has moved out of @file-viewer/core. Install and pass @file-viewer/renderer-image, or use @file-viewer/preset-all.");
		return u(new Blob([e], { type: l(n) }));
	});
	return function(e, n) {
		return t$2.apply(this, arguments);
	};
}();
var f = (e) => Number(e.toFixed(3));
var p = (e, t, n) => {
	let r = e.createElement("div");
	r.className = "image-lightbox", r.dataset.open = "false", r.setAttribute("role", "dialog"), r.setAttribute("aria-modal", "true"), r.setAttribute("aria-hidden", "true");
	let i = e.createElement("img");
	i.alt = n("image.lightbox.alt"), i.src = t;
	let a = e.createElement("button");
	a.type = "button", a.setAttribute("aria-label", n("image.lightbox.close")), a.textContent = "×";
	let o = null, s = () => {
		r.dataset.open === "true" && (r.dataset.open = "false", r.setAttribute("aria-hidden", "true"), o != null && o.isConnected && o.focus({ preventScroll: !0 }), o = null);
	}, c = (e) => {
		e.key === "Escape" && r.dataset.open === "true" && (e.preventDefault(), s());
	};
	return a.addEventListener("click", s), r.addEventListener("click", (e) => {
		e.target === r && s();
	}), e.addEventListener("keydown", c), r.append(i, a), {
		element: r,
		open(t) {
			o = t || (e.activeElement instanceof HTMLElement ? e.activeElement : null), r.dataset.open = "true", r.setAttribute("aria-hidden", "false"), a.focus({ preventScroll: !0 });
		},
		destroy() {
			a.removeEventListener("click", s), e.removeEventListener("keydown", c), r.remove();
		}
	};
};
function m(e, t, n, r) {
	return h.apply(this, arguments);
}
function h() {
	return h = t(function* (e, o, s, u) {
		var m, h;
		let g = f$1(u == null ? void 0 : u.options), _ = o.ownerDocument || document, v = yield d(e, s);
		(m = u == null ? void 0 : u.registerThumbnailAdapter) == null || m.call(u, { capture: () => new Blob([e], { type: l(s) }) });
		let y = 1, b = 1, x = 1, S = 0, C = F(), w = _.createElement("div");
		w.className = "image-viewer", w.dataset.viewerZoomProvider = "image";
		let T = _.createElement("div");
		T.className = "image-stage";
		let E$1 = _.createElement("img");
		E$1.alt = g("image.alt"), E$1.src = v, E$1.tabIndex = 0, E$1.setAttribute("role", "button"), E$1.setAttribute("aria-haspopup", "dialog"), T.append(E$1), w.append(T);
		let D$1 = p(_, v, g), O = () => D$1.open(E$1), k = (e) => {
			(e.key === "Enter" || e.key === " ") && (e.preventDefault(), D$1.open(E$1));
		};
		E$1.addEventListener("click", O), E$1.addEventListener("keydown", k);
		let A = () => Math.min(.1, b || .1), j = (e) => {
			let t = A();
			return Math.min(5, Math.max(t, f(e)));
		}, M = () => {
			let e = E$1.naturalWidth || 0, t = E$1.naturalHeight || 0;
			if (!e || !t) return 1;
			let n = Math.max((w.clientWidth || 0) - 48, 1), r = Math.max((w.clientHeight || S || 0) - 48, 1);
			return Math.min(1, n / e, r / t);
		}, N = () => {
			if (b = M(), x = j(b * y), E$1.naturalWidth && E$1.naturalHeight) {
				E$1.style.width = `${Math.max(1, Math.round(E$1.naturalWidth * x))}px`, E$1.style.height = `${Math.max(1, Math.round(E$1.naturalHeight * x))}px`;
				return;
			}
			E$1.style.width = "auto", E$1.style.height = S > 0 ? `${Math.max(1, Math.round(S * y))}px` : `${y * 100}%`;
		}, P = () => {
			S = w.clientHeight || 0, N(), C.emit();
		}, F$1 = new ResizeObserver(P);
		F$1.observe(w), E$1.addEventListener("load", P);
		let I = () => ({
			scale: x,
			label: `${Math.round(x * 100)}%`,
			canZoomIn: x < 5,
			canZoomOut: x > A(),
			canReset: Math.abs(y - 1) > .001,
			minScale: A(),
			maxScale: 5
		}), L = (e) => (y = j(e) / Math.max(b, .001), N(), C.emit(), I());
		return E(w, {
			zoomIn: () => L(x + .15),
			zoomOut: () => L(x - .15),
			resetZoom: () => (y = 1, N(), C.emit(), I()),
			setZoom: L,
			fit: (e) => {
				var t, n;
				let i = E$1.naturalWidth || 0, a = E$1.naturalHeight || 0;
				if (!i || !a) return {
					applied: !1,
					mode: e.mode,
					resize: e.resize,
					source: e.source,
					reason: "image-not-ready",
					provider: "zoom"
				};
				let o = e.mode === "auto" ? "scale-down" : e.mode, s = X({
					mode: o,
					viewportWidth: Math.max(1, e.viewportWidth || w.clientWidth || 0),
					viewportHeight: Math.max(1, e.viewportHeight || w.clientHeight || S || 0),
					contentWidth: i,
					contentHeight: a,
					currentScale: x,
					minScale: (t = e.minScale) == null ? A() : t,
					maxScale: (n = e.maxScale) == null ? 5 : n
				});
				if (!s) return {
					applied: !1,
					mode: e.mode,
					resize: e.resize,
					source: e.source,
					reason: "unmeasurable",
					provider: "zoom"
				};
				let c = L(s);
				return {
					applied: !0,
					mode: e.mode,
					resize: e.resize,
					scale: c.scale,
					source: e.source,
					provider: "zoom"
				};
			},
			getState: I,
			subscribe: C.subscribe
		}), o.replaceChildren(c(_), w), (((h = u == null ? void 0 : u.surface) == null ? void 0 : h.shadowRoot) || o).append(D$1.element), P(), {
			$el: o,
			unmount() {
				var e;
				(e = u == null ? void 0 : u.registerThumbnailAdapter) == null || e.call(u, null), D(w), F$1.disconnect(), E$1.removeEventListener("load", P), E$1.removeEventListener("click", O), E$1.removeEventListener("keydown", k), D$1.destroy(), o.replaceChildren();
			}
		};
	}), h.apply(this, arguments);
}
//#endregion
export { m as default };
