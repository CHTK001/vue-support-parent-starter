import { r as t$1 } from "./objectSpread2-DeKe-97G.js";
//#region ../../node_modules/.pnpm/@file-viewer+vue3@3.1.2_vue@3.5.45_typescript@5.9.3_/node_modules/@file-viewer/vue3/dist/components/export.js
var t = (e, t) => {
	let n = URL.createObjectURL(e), r = document.createElement("a");
	r.href = n, r.download = t, r.rel = "noopener", document.body.appendChild(r), r.click(), r.remove(), window.setTimeout(() => URL.revokeObjectURL(n), 4e3);
};
var n = (e, t) => {
	let n = document.createElement("a");
	n.href = e, n.download = t, n.rel = "noopener", n.target = "_blank", document.body.appendChild(n), n.click(), n.remove();
};
var r = (e, t) => {
	let n = Array.from(e.querySelectorAll("canvas"));
	Array.from(t.querySelectorAll("canvas")).forEach((t, r) => {
		let i = n[r];
		if (i) try {
			let n = e.ownerDocument.createElement("img");
			n.src = i.toDataURL("image/png"), n.alt = "rendered canvas", n.style.maxWidth = "100%", n.style.display = "block", n.style.margin = "0 auto", t.replaceWith(n);
		} catch (e) {}
	});
};
var i = (e) => new Promise((t) => {
	let n = e || globalThis.window;
	if (!n || typeof n.requestAnimationFrame != "function") {
		(n != null && n.setTimeout ? n.setTimeout.bind(n) : globalThis.setTimeout.bind(globalThis))(() => t(), 0);
		return;
	}
	let r = n.requestAnimationFrame.bind(n);
	r(() => {
		r(() => t());
	});
});
var a = function() {
	var t = t$1(function* (t) {
		if (!t || typeof t.querySelectorAll != "function") return;
		let n = Array.from(t.querySelectorAll("img"));
		yield Promise.all(n.map(function() {
			var t = t$1(function* (e) {
				if (!e.complete) {
					if ("decode" in e) try {
						yield e.decode();
						return;
					} catch (e) {}
					yield new Promise((t) => {
						e.addEventListener("load", () => t(), { once: !0 }), e.addEventListener("error", () => t(), { once: !0 });
					});
				}
			});
			return function(e) {
				return t.apply(this, arguments);
			};
		}()));
	});
	return function(e) {
		return t.apply(this, arguments);
	};
}();
var o = (e, t) => {
	let n = t || "application/octet-stream", r = globalThis.Buffer;
	if (r) return `data:${n};base64,${r.from(e).toString("base64")}`;
	let i = "", a = new Uint8Array(e);
	for (let e = 0; e < a.length; e += 1) i += String.fromCharCode(a[e]);
	return `data:${n};base64,${btoa(i)}`;
};
var s = function() {
	var t = t$1(function* (e) {
		if (typeof FileReader == "function") try {
			return yield new Promise((t, n) => {
				let r = new FileReader();
				r.onload = () => t(String(r.result || "")), r.onerror = () => n(r.error || /* @__PURE__ */ Error("Failed to read blob")), r.readAsDataURL(e);
			});
		} catch (e) {}
		return o(yield e.arrayBuffer(), e.type || "application/octet-stream");
	});
	return function(e) {
		return t.apply(this, arguments);
	};
}();
var c = (e) => {
	let t = e.match(/blob:[^\s"'<>)\\]+/g) || [];
	return Array.from(new Set(t));
};
var l = function() {
	var t = t$1(function* (t) {
		if (!t.includes("blob:") || typeof fetch != "function") return t;
		let n = c(t);
		if (!n.length) return t;
		let r = yield Promise.all(n.map(function() {
			var t = t$1(function* (e) {
				try {
					let t = yield fetch(e);
					if (!t.ok) return null;
					let n = yield s(yield t.blob());
					return n ? [e, n] : null;
				} catch (e) {
					return null;
				}
			});
			return function(e) {
				return t.apply(this, arguments);
			};
		}())), i = t;
		for (let e of r) {
			if (!e) continue;
			let [t, n] = e;
			i = i.split(t).join(n);
		}
		return i;
	});
	return function(e) {
		return t.apply(this, arguments);
	};
}();
var u = function() {
	var t = t$1(function* (t) {
		let { document: n } = t;
		n.readyState !== "complete" && (yield new Promise((e) => {
			t.addEventListener("load", () => e(), { once: !0 }), t.setTimeout(() => e(), 1200);
		})), yield Promise.all(Array.from(n.images).map(function() {
			var n = t$1(function* (e) {
				if (!e.complete) {
					if ("decode" in e) try {
						yield e.decode();
						return;
					} catch (e) {}
					yield new Promise((n) => {
						e.addEventListener("load", () => n(), { once: !0 }), e.addEventListener("error", () => n(), { once: !0 }), t.setTimeout(() => n(), 1500);
					});
				}
			});
			return function(e) {
				return n.apply(this, arguments);
			};
		}())), yield new Promise((e) => {
			let n = !1, r, i = () => {
				n || (n = !0, r !== void 0 && t.clearTimeout(r), e());
			};
			r = t.setTimeout(i, 250);
			try {
				t.requestAnimationFrame(() => {
					t.requestAnimationFrame(i);
				});
			} catch (e) {
				i();
			}
		});
	});
	return function(e) {
		return t.apply(this, arguments);
	};
}();
var d = function() {
	var t = t$1(function* (e, t) {
		return t.mode !== "print" || !(e != null && e.printStyle) ? "" : typeof e.printStyle == "function" ? yield e.printStyle(t) : e.printStyle;
	});
	return function(e, n) {
		return t.apply(this, arguments);
	};
}();
var f = function() {
	var t = t$1(function* (e, t) {
		var n;
		yield (n = t == null ? void 0 : t.beforeSnapshot) == null ? void 0 : n.call(t), yield i(e.ownerDocument.defaultView || void 0), yield a(e);
	});
	return function(e, n) {
		return t.apply(this, arguments);
	};
}();
//#endregion
export { l as a, t as c, i, u as l, d as n, n as o, f as r, r as s, a as t };
