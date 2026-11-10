import { n as s$1, r as t } from "./objectSpread2-DeKe-97G.js";
import { n as f } from "./messages-u0TThKdS.js";
import { a as s$2, i as r } from "./printMask-DarSpqUR.js";
//#region ../../node_modules/.pnpm/@file-viewer+vue3@3.1.2_vue@3.5.45_typescript@5.9.3_/node_modules/@file-viewer/vue3/dist/components/print-mask.js
var a = "\n.fv-print-mask-layer{position:absolute;inset:0;z-index:2147483000;pointer-events:none;}\n.fv-print-mask-canvas{position:absolute;inset:0;z-index:2147483000;pointer-events:none;cursor:default;}\n.fv-print-mask-canvas.is-armed{pointer-events:auto;cursor:crosshair;touch-action:none;}\n.fv-print-mask-block{position:absolute;background:#000;box-sizing:border-box;pointer-events:auto;}\n.fv-print-mask-block-remove{position:absolute;right:-8px;top:-8px;width:18px;height:18px;border:0;border-radius:999px;background:#111;color:#fff;font:700 12px/18px system-ui,sans-serif;cursor:pointer;padding:0;}\n.fv-print-stamp{position:absolute;box-sizing:border-box;border:1px dashed rgba(22,119,76,.7);border-radius:4px;pointer-events:auto;touch-action:none;cursor:move;transform-origin:center center;}\n.fv-print-stamp img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;}\n.fv-print-stamp-resize{position:absolute;right:-7px;bottom:-7px;width:15px;height:15px;border:2px solid #fff;border-radius:4px;background:#16774c;box-shadow:0 1px 5px rgba(15,23,42,.22);cursor:nwse-resize;touch-action:none;}\n.fv-print-stamp-input{display:none!important;}\n.fv-print-mask-toolbar{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483001;display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid rgba(20,35,53,.12);border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 12px 28px rgba(15,23,42,.16);pointer-events:auto;max-width:calc(100% - 24px);flex-wrap:wrap;justify-content:center;}\n.fv-print-mask-toolbar span{font:600 12px/1.2 system-ui,sans-serif;color:#40546a;white-space:nowrap;}\n.fv-print-mask-toolbar button{min-width:42px;height:30px;padding:0 10px;border:0;border-radius:999px;background:transparent;color:#40546a;font:800 12px/1 system-ui,sans-serif;cursor:pointer;}\n.fv-print-mask-toolbar button:hover,.fv-print-mask-toolbar button.is-active{background:rgba(33,163,102,.1);color:#16774c;}\n.fv-print-mask-toolbar button.primary{background:#16774c;color:#fff;}\n.fv-print-mask-toolbar button.primary:hover{background:#0f5f3c;}\n";
var o = (e) => {
	let t = e.ownerDocument, n = e.getRootNode(), r = n === t ? t.head : n;
	if (r.querySelector("#fv-print-mask-designer-style")) return;
	let i = t.createElement("style");
	i.id = "fv-print-mask-designer-style", i.textContent = a, r.appendChild(i);
};
var s = (e, t, n, i) => {
	if (!n.width || !n.height) return null;
	let a = Math.min(e.x, t.x), o = Math.min(e.y, t.y), s = Math.abs(t.x - e.x), c = Math.abs(t.y - e.y);
	return s < 8 || c < 8 ? null : r({
		left: a / n.width * 100,
		top: o / n.height * 100,
		width: s / n.width * 100,
		height: c / n.height * 100,
		pageIndex: i
	});
};
var c = (e, t) => {
	let n = e.getBoundingClientRect();
	return Math.max(0, Math.min(n.right, t.right) - Math.max(n.left, t.left)) * Math.max(0, Math.min(n.bottom, t.bottom) - Math.max(n.top, t.top));
};
var l = 10485760;
var u = (e, t) => new Promise((n, r) => {
	if (!/^image\/(?:png|jpe?g|webp|gif|svg\+xml)$/i.test(e.type) || e.size > l) {
		r(/* @__PURE__ */ Error("Unsupported print stamp image"));
		return;
	}
	let i = new ((t == null ? void 0 : t.FileReader) || globalThis.FileReader)();
	i.addEventListener("load", () => {
		if (typeof i.result == "string" && i.result.startsWith("data:image/")) {
			n(i.result);
			return;
		}
		r(/* @__PURE__ */ Error("Invalid print stamp image"));
	}), i.addEventListener("error", () => r(i.error || /* @__PURE__ */ Error("Failed to read print stamp image"))), i.readAsDataURL(e);
});
var d = (a) => {
	let l = a.root, d = l.ownerDocument, f$1 = f(a.i18n), p = a.color || "#000000", m = [...a.initialRegions || []].map((e) => r(e)).filter((e) => !!e), h = [...a.initialStamps || []].map((e) => s$2(e)).filter((e) => !!e), g = Array.from(new Set(a.pages || [])).filter((e) => e === l || l.contains(e)), _ = g.length > 0, v = _ ? g : [l];
	o(l);
	let y = (e) => {
		var t, n, r;
		let i = e.style.position;
		return (((r = (n = (t = d.defaultView) == null ? void 0 : t.getComputedStyle) == null ? void 0 : n.call(t, e)) == null ? void 0 : r.position) || i || "static") === "static" && (e.style.position = "relative"), i;
	}, b = y(l);
	return new Promise((n) => {
		let r = !1, a = null, o = d.createElement("div");
		o.className = "fv-print-mask-layer", o.setAttribute("data-viewer-print-mask-designer", "true");
		let g = (e, t) => {
			let n = y(e), r = d.createElement("div");
			return r.className = "fv-print-mask-canvas", e.appendChild(r), {
				element: e,
				pageIndex: t,
				canvas: r,
				previousPosition: n
			};
		}, x = v.map((e, t) => g(e, _ ? t : void 0)), S = _ && !x.some((e) => e.element === l) && (m.some((e) => e.pageIndex === void 0) || h.some((e) => e.pageIndex === void 0)) ? g(l) : null, C = S ? [...x, S] : x, w = d.createElement("div");
		w.className = "fv-print-mask-toolbar", w.setAttribute("role", "toolbar"), w.setAttribute("aria-label", f$1("toolbar.printMaskTitle"));
		let T = d.createElement("span");
		T.textContent = f$1("toolbar.printMaskHint");
		let E = d.createElement("button");
		E.type = "button", E.textContent = f$1("toolbar.printMaskAdd");
		let D = d.createElement("input");
		D.type = "file", D.accept = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml", D.className = "fv-print-stamp-input", D.setAttribute("data-viewer-print-stamp-input", "true");
		let O = d.createElement("button");
		O.type = "button", O.textContent = f$1("toolbar.printStampUpload");
		let k = d.createElement("button");
		k.type = "button", k.textContent = f$1("toolbar.printMaskClear");
		let A = d.createElement("button");
		A.type = "button", A.textContent = f$1("toolbar.printMaskCancel");
		let j = d.createElement("button");
		j.type = "button", j.className = "primary", j.textContent = f$1("toolbar.printMaskConfirm"), w.append(T, E, O, k, A, j), o.append(D, w), l.appendChild(o);
		let M = () => {
			x.forEach((e) => e.canvas.classList.remove("is-armed")), E.classList.remove("is-active");
		}, N = (e) => {
			r || (r = !0, o.remove(), C.forEach((e) => {
				e.canvas.remove(), e.previousPosition ? e.element.style.position = e.previousPosition : e.element.style.removeProperty("position");
			}), b ? l.style.position = b : l.style.removeProperty("position"), n(e));
		}, P = (e) => e.pageIndex === void 0 ? S || x[0] : x.find((t) => t.pageIndex === e.pageIndex) || null, F = () => {
			C.forEach((e) => e.canvas.replaceChildren()), m.forEach((e, t) => {
				let n = P(e);
				if (!n) return;
				let r = d.createElement("div");
				r.className = "fv-print-mask-block", r.style.left = `${e.left}%`, r.style.top = `${e.top}%`, r.style.width = `${e.width}%`, r.style.height = `${e.height}%`, r.style.background = p;
				let i = d.createElement("button");
				i.type = "button", i.className = "fv-print-mask-block-remove", i.title = f$1("toolbar.printMaskClear"), i.setAttribute("aria-label", f$1("toolbar.printMaskClear")), i.textContent = "−", i.addEventListener("click", (e) => {
					e.preventDefault(), e.stopPropagation(), m.splice(t, 1), F();
				}), r.appendChild(i), n.canvas.appendChild(r);
			}), h.forEach((e, t) => {
				let n = P(e);
				if (!n) return;
				let r = d.createElement("div");
				r.className = "fv-print-stamp", r.setAttribute("data-viewer-print-stamp", String(t));
				let i = () => {
					var t, n;
					r.style.left = `${e.left}%`, r.style.top = `${e.top}%`, r.style.width = `${e.width}%`, r.style.height = `${e.height}%`, r.style.opacity = String((t = e.opacity) == null ? 1 : t), r.style.transform = `rotate(${(n = e.rotate) == null ? 0 : n}deg)`;
				};
				i();
				let a = d.createElement("img");
				a.src = e.src, a.alt = e.alt || "", a.draggable = !1;
				let o = d.createElement("button");
				o.type = "button", o.className = "fv-print-mask-block-remove", o.title = f$1("toolbar.printStampRemove"), o.setAttribute("aria-label", f$1("toolbar.printStampRemove")), o.textContent = "−", o.addEventListener("pointerdown", (e) => e.stopPropagation()), o.addEventListener("click", (e) => {
					e.preventDefault(), e.stopPropagation(), h.splice(t, 1), F();
				});
				let s = d.createElement("span");
				s.className = "fv-print-stamp-resize", s.setAttribute("role", "button"), s.setAttribute("aria-label", f$1("toolbar.printStampResize")), s.title = f$1("toolbar.printStampResize");
				let c = null;
				r.addEventListener("pointerdown", (t) => {
					var n;
					t.button !== 0 || t.target.closest("button") || (t.preventDefault(), t.stopPropagation(), c = {
						pointerId: t.pointerId,
						mode: t.target === s ? "resize" : "move",
						startX: t.clientX,
						startY: t.clientY,
						left: e.left,
						top: e.top,
						width: e.width,
						height: e.height
					}, (n = r.setPointerCapture) == null || n.call(r, t.pointerId));
				}), r.addEventListener("pointermove", (t) => {
					if (!c || c.pointerId !== t.pointerId) return;
					t.preventDefault();
					let r = n.canvas.getBoundingClientRect();
					if (!r.width || !r.height) return;
					let a = (t.clientX - c.startX) / r.width * 100, o = (t.clientY - c.startY) / r.height * 100;
					c.mode === "move" ? (e.left = Math.max(0, Math.min(100 - e.width, c.left + a)), e.top = Math.max(0, Math.min(100 - e.height, c.top + o))) : (e.width = Math.max(4, Math.min(100 - e.left, c.width + a)), e.height = Math.max(4, Math.min(100 - e.top, c.height + o))), i();
				});
				let l = (e) => {
					var t;
					if (!(!c || c.pointerId !== e.pointerId)) {
						try {
							(t = r.releasePointerCapture) == null || t.call(r, c.pointerId);
						} catch (e) {}
						c = null;
					}
				};
				r.addEventListener("pointerup", l), r.addEventListener("pointercancel", l), r.append(a, o, s), n.canvas.appendChild(r);
			});
		}, I = (e, t) => {
			let n = t.getBoundingClientRect();
			return {
				x: Math.max(0, Math.min(n.width, e.clientX - n.left)),
				y: Math.max(0, Math.min(n.height, e.clientY - n.top))
			};
		};
		x.forEach((e) => {
			e.canvas.addEventListener("pointerdown", (t) => {
				if (t.button !== 0 || !e.canvas.classList.contains("is-armed")) return;
				t.preventDefault();
				let n = I(t, e.canvas), r = d.createElement("div");
				r.className = "fv-print-mask-block", r.style.background = p, r.style.opacity = "0.72", e.canvas.appendChild(r), a = {
					surface: e,
					start: n,
					preview: r,
					pointerId: t.pointerId
				}, e.canvas.setPointerCapture(t.pointerId);
			}), e.canvas.addEventListener("pointermove", (t) => {
				if (!a || a.surface !== e) return;
				let n = I(t, e.canvas), r = Math.min(a.start.x, n.x), i = Math.min(a.start.y, n.y);
				a.preview.style.left = `${r}px`, a.preview.style.top = `${i}px`, a.preview.style.width = `${Math.abs(n.x - a.start.x)}px`, a.preview.style.height = `${Math.abs(n.y - a.start.y)}px`;
			}), e.canvas.addEventListener("pointerup", (t) => {
				if (!a || a.surface !== e) return;
				let n = I(t, e.canvas), r = s(a.start, n, e.canvas.getBoundingClientRect(), e.pageIndex);
				a.preview.remove();
				try {
					e.canvas.releasePointerCapture(a.pointerId);
				} catch (e) {}
				a = null, M(), r && m.push(r), F();
			}), e.canvas.addEventListener("pointercancel", () => {
				!a || a.surface !== e || (a.preview.remove(), a = null, M(), F());
			});
		});
		let L = () => {
			var e;
			let t = l.getBoundingClientRect();
			return ((e = x.map((e) => ({
				surface: e,
				area: c(e.element, t)
			})).sort((e, t) => t.area - e.area)[0]) == null ? void 0 : e.surface) || x[0];
		};
		E.addEventListener("click", () => {
			M();
			let e = L();
			e?.canvas.classList.add("is-armed"), E.classList.toggle("is-active", !!e);
		}), O.addEventListener("click", () => {
			M(), D.click();
		}), D.addEventListener("change", t(function* () {
			var e;
			let t = (e = D.files) == null ? void 0 : e[0];
			if (D.value = "", t) try {
				let e = yield u(t, d.defaultView), n = L();
				if (!n) return;
				let r = s$2({
					src: e,
					alt: t.name,
					left: 38,
					top: 38,
					width: 24,
					height: 18,
					pageIndex: n.pageIndex
				});
				r && (h.push(r), F());
			} catch (e) {}
		})), k.addEventListener("click", () => {
			m.splice(0, m.length), h.splice(0, h.length), M(), F();
		}), A.addEventListener("click", () => N(null)), j.addEventListener("click", () => {
			if (!m.length && !h.length) {
				N(null);
				return;
			}
			N({ mask: s$1(s$1(s$1({}, m.length ? { regions: m.map((e) => s$1({}, e)) } : {}), h.length ? { stamps: h.map((e) => s$1({}, e)) } : {}), {}, { color: p }) });
		}), F();
	});
};
//#endregion
export { d as openFileViewerPrintMaskDesigner };
