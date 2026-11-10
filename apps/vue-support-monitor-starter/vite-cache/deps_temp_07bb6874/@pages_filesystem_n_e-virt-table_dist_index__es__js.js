//#region ../../node_modules/.pnpm/e-virt-table@1.4.15/node_modules/e-virt-table/dist/index.es.js
(function() {
	"use strict";
	try {
		if (typeof document < "u") {
			var e = document.createElement("style");
			e.appendChild(document.createTextNode(":root{--evt-header-font: 12px normal Arial;--evt-body-font: 12px normal Arial;--evt-color-white: #fff;--evt-color-black: #000000;--evt-color-primary: rgb(82, 146, 247);--evt-text-color-primary: #333;--evt-text-color-regular: #666;--evt-text-color-secondary: #999;--evt-box-shadow: 0 2px 12px 0 #0000001a;--evt-editor-bg-color: #fff;--evt-editor-text-color: #333;--evt-border-color: #e1e6eb;--evt-fixed-column-shadow-color: rgba(0, 0, 0, .1);--evt-fixed-column-shadow-fade-color: rgba(0, 0, 0, 0);--evt-body-bg-color: #fff;--evt-stripe-color: #fafafa;--evt-placeholder-color: #cdd0dc;--evt-header-bg-color: #f8faff;--evt-header-text-color: #1d2129;--evt-body-text-color: #4e5969;--evt-footer-text-color: #4e5969;--evt-loading-icon-color: #4e5969;--evt-expand-icon-color: #4e5969;--evt-shrink-icon-color: #4e5969;--evt-error-tip-icon-color: red;--evt-required-color: #f56c6c;--evt-cell-hover-icon-bg-color: #fff;--evt-cell-hover-icon-border-color: #dde0ea;--evt-scroller-color: #dee0e3;--evt-scroller-track-color: #fff;--evt-scroller-focus-color: #bbbec4;--evt-select-border-color: var(--evt-color-primary);--evt-select-area-color: rgba(82, 146, 247, .1);--evt-select-row-col-bg-color: rgba(82, 146, 247, .1);--evt-autofill-point-border-color: #fff;--evt-edit-bg-color: #fcf6ed;--evt-checkbox-color: var(--evt-color-primary);--evt-checkbox-uncheck-color: #dde0ea;--evt-checkbox-disabled-color: #f1f2f4;--evt-checkbox-check-disabled-color: #dde0ea;--evt-icon-edit-color: #4e5969;--evt-icon-select-color: #4e5969;--evt-readonly-color: #fff;--evt-readonly-text-color: var(--evt-body-text-color);--evt-error-tip-color: #ed3f14;--evt-footer-bg-color: #fafafa;--evt-highlight-hover-row-color: rgba(186, 203, 231, .1);--evt-highlight-selected-row-color: rgba(82, 146, 247, .1);--evt-tooltip-bg-color: #303133;--evt-tooltip-text-color: #fff;--evt-resize-row-line-color: #e1e6eb;--evt-resize-column-text-color: #fff;--evt-resize-column-text-bg-color: var(--evt-color-primary);--evt-resize-column-line-color: #e1e6eb;--evt-tree-line-color: #e1e6eb;--evt-sort-icon-color: var(--evt-color-primary);--evt-drag-tip-bg-color: rgba(82, 146, 247, .1);--evt-drag-tip-line-color: var(--evt-color-primary);--evt-context-menu-min-width: 150px;--evt-context-menu-max-width: 220px;--evt-context-menu-item-padding: 8px 12px;--evt-context-menu-bg-color: #fff;--evt-context-menu-text-color: #333;--evt-context-menu-item-hover-text-color: var(--evt-color-primary);--evt-context-menu-item-hover-bg-color: #f5f5f5;--evt-context-menu-text-size: 13px}.dark{--evt-border-color: #363637;--evt-header-bg-color: #141414;--evt-body-bg-color: #141414;--evt-header-text-color: #a3a6ad;--evt-body-text-color: #cfd3dc;--evt-readonly-text-color: #cfd3dc;--evt-footer-text-color: #cfd3dc;--evt-scroller-color: #414243;--evt-scroller-track-color: #141414;--evt-scroller-focus-color: #a3a6ad;--evt-edit-bg-color: #141414;--evt-footer-bg-color: #262727;--evt-autofill-point-border-color: #fff;--evt-editor-bg-color: #434343;--evt-editor-text-color: #cfd3dc;--evt-context-menu-bg-color: #141414;--evt-context-menu-text-color: #cfd3dc;--evt-context-menu-item-hover-text-color: var(--evt-color-primary);--evt-context-menu-item-hover-bg-color: #414243}.e-virt-table-container{position:relative;outline:none}.e-virt-table-stage{position:relative;overflow:hidden;outline:none;box-sizing:border-box;z-index:10;border-radius:8px;border:1px solid var(--evt-border-color)}.e-virt-table-canvas{position:absolute;left:0;top:0;box-sizing:border-box;background-color:var(--evt-body-bg-color);border:none;outline:none;z-index:10}.e-virt-table-editor{position:absolute;top:-10000px;left:-10000px;text-align:left;height:auto;line-height:0;z-index:100;overflow:hidden;background-color:var(--evt-editor-bg-color);border:2px solid var(--evt-color-primary);box-sizing:border-box;box-shadow:var(--evt-box-shadow);display:flex;align-items:center}.e-virt-table-overlayer{position:absolute;left:0;top:0;overflow:hidden;z-index:100;pointer-events:none}.e-virt-table-editor-textarea{width:100%;box-sizing:border-box;outline:none;font-weight:400;padding:8px;font-size:12px;color:inherit;white-space:pre-wrap;word-wrap:break-word;word-break:break-all;line-height:1.5;margin:0;border:none;vertical-align:middle;background:var(--evt-editor-bg-color);color:var(--evt-editor-text-color);overflow-y:auto;resize:none}.e-virt-table-context-menu{position:absolute;font-size:14px;color:var(--evt-text-color-regular);background-color:var(--evt-color-white);border-radius:4px;border:1px solid #e4e7ed;box-shadow:var(--evt-box-shadow);width:fit-content;padding:6px 0;z-index:9999;left:-99999px;top:-99999px}.e-virt-table-context-menu-item{cursor:pointer;padding:6px 24px;color:var(--evt-text-color-regular)}.e-virt-table-context-menu-item:hover{color:var(--evt-color-primary);background-color:#f5f7fa}.e-virt-table-loading{display:none;position:absolute;left:0;top:0;right:0;bottom:0;width:100%;height:100%;z-index:2000;background-color:#fff6;display:flex;align-items:center;justify-content:center}.e-virt-table-loading-spinner{opacity:1;display:flex;flex-direction:column;align-items:center;justify-content:center}.e-virt-table-loading-spinner svg{color:var(--evt-text-color-regular);animation:rotate 1s linear infinite}@keyframes rotate{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.e-virt-table-loading-text{margin:0;font-size:12px;color:var(--evt-text-color-regular)}.e-virt-table-main-menu,.e-virt-table-submenu{position:absolute;background:var(--evt-context-menu-bg-color);border-radius:4px;box-shadow:0 2px 8px #0000001a;min-width:var(--evt-context-menu-min-width);max-width:var(--evt-context-menu-max-width);color:var(--evt-text-color-primary)}.e-virt-table-main-menu{border:1px solid var(--evt-border-color);z-index:3000;left:-99999px;top:-99999px;display:none;position:fixed;background-color:var(--evt-body-bg-color)}.e-virt-table-submenu{border:1px solid var(--evt-border-color);z-index:1000;max-height:350px;overflow-y:auto;opacity:0;visibility:hidden;transform:translate(-10px);transition:opacity .2s,visibility .2s,transform .2s;-ms-overflow-style:none;scrollbar-width:none}.e-virt-table-submenu::-webkit-scrollbar{display:none}.e-virt-table-submenu.show{opacity:1;visibility:visible;transform:translate(0)}.e-virt-table-submenu:not(.show){transition:none}.e-virt-table-menu-item,.e-virt-table-submenu-item{position:relative;-webkit-user-select:none;user-select:none;padding:var(--evt-context-menu-item-padding);cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background .2s,color .2s;color:var(--evt-context-menu-text-color);font-size:var(--evt-context-menu-text-size)}.e-virt-table-menu-item:last-child,.e-virt-table-submenu-item:last-child{border-bottom:none}.e-virt-table-menu-item:has(.e-virt-table-menu-item-icon){padding-left:8px}.e-virt-table-menu-item-content{display:flex;align-items:center;flex:1;min-width:0}.e-virt-table-menu-item-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin-right:8px;flex-shrink:0}.e-virt-table-menu-item-icon svg{width:100%;height:100%;fill:currentColor}.e-virt-table-menu-item-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.e-virt-table-menu-arrow{display:inline-flex;align-items:center;justify-content:center;color:var(--evt-text-color-regular);transition:color .2s}.e-virt-table-menu-arrow svg{width:20px;height:20px;fill:currentColor}.e-virt-table-submenu-item:hover,.e-virt-table-menu-item:hover,.e-virt-table-menu-item.active{background:var(--evt-context-menu-item-hover-bg-color);color:var(--evt-context-menu-item-hover-text-color)}.e-virt-table-menu-item.disabled,.e-virt-table-submenu-item.disabled{cursor:not-allowed}.e-virt-table-finder-bar{position:absolute;top:8px;right:16px;display:none;z-index:10000;background:#fff;border:1px solid #dadce0;border-radius:12px;box-shadow:0 2px 6px #0003;padding:0 8px;height:48px;min-width:250px;align-items:center;font-size:12px}.e-virt-table-finder-bar.show{display:flex}.e-virt-table-finder-bar-input-wrapper{display:flex;align-items:center;flex:1;padding:0 8px;position:relative}.e-virt-table-finder-bar-input{border:none;outline:none;flex:1;font-size:12px;background:transparent;color:#333;min-width:150px;padding-left:0;position:relative}.e-virt-table-finder-bar-nav{display:flex;flex-direction:row;gap:8px;margin:0 8px;align-items:center}.e-virt-table-finder-bar-nav-btn{border:none;background:transparent;cursor:pointer;padding:0;color:#666;border-radius:50%;display:flex;align-items:center;justify-content:center}.e-virt-table-finder-bar-nav-btn svg{width:24px;height:24px}.e-virt-table-finder-bar-nav-btn.prev-btn{transform:rotate(-90deg)}.e-virt-table-finder-bar-nav-btn.next-btn{transform:rotate(90deg)}.e-virt-table-finder-bar-nav-btn.close-btn{font-size:24px;color:#666;line-height:1;width:24px;height:24px}.e-virt-table-finder-bar-nav-btn:hover{color:#666;background-color:#f0f0f0}.e-virt-table-finder-bar-count{color:#666;font-size:12px;margin:0 8px;white-space:nowrap;flex-shrink:0}.e-virt-table-finder-bar-count.no-results{color:#999}.e-virt-table-finder-bar-loading{display:none;position:absolute;left:8px;top:0;width:16px;height:16px;flex-shrink:0;pointer-events:none;z-index:0}.e-virt-table-finder-bar-loading.show{display:block}.e-virt-table-finder-bar-loading svg{width:100%;height:100%;color:#666;animation:rotate 1s linear infinite}.e-virt-table-empty{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:14px;color:#666;z-index:15}")), document.head.appendChild(e);
		}
	} catch (t) {
		console.error("vite-plugin-css-injected-by-js", t);
	}
})();
var Te = Object.defineProperty;
var Se = (h, t, e) => t in h ? Te(h, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: e
}) : h[t] = e;
var n = (h, t, e) => Se(h, typeof t != "symbol" ? t + "" : t, e);
var Oe = class {
	constructor(t) {
		n(this, "rules");
		this.rules = t;
	}
	validate(t) {
		const e = [], { column: i, row: s, key: o, rowKey: r, colIndex: a, rowIndex: l, value: c, field: f, fieldValue: d } = t;
		Array.isArray(this.rules) || (this.rules = [this.rules]);
		for (const u of this.rules) {
			if (u.validator) {
				const x = {
					field: f,
					fieldValue: d,
					value: c,
					column: i,
					colIndex: a,
					rowIndex: l,
					row: s,
					key: o,
					rowKey: r,
					...u
				};
				u.validator(x, c, (w) => {
					w && e.push({
						...x,
						message: w
					});
				});
			}
			if (!u.required && (c == null || c === "")) return e;
			u.pattern && !u.pattern.test(c) && e.push({
				value: c,
				column: i,
				row: s,
				key: o,
				rowKey: r,
				colIndex: a,
				rowIndex: l,
				field: f,
				fieldValue: d,
				message: u.message || `${o} is pattern validation error`
			}), u.required && (c == null || c === "") && e.push({
				value: c,
				column: i,
				row: s,
				key: o,
				rowKey: r,
				colIndex: a,
				rowIndex: l,
				field: f,
				fieldValue: d,
				message: u.message || `${o} is required`
			});
		}
		return e;
	}
};
function ae() {
	return "xxxxxxxxxxxxxxxxxx".replace(/[x]/g, function(h) {
		const t = Math.random() * 16 | 0;
		return (h === "x" ? t : t & 3 | 8).toString(16);
	});
}
function Nt(h, t) {
	let e = 0, i;
	return function(...s) {
		const o = (/* @__PURE__ */ new Date()).getTime(), r = o - e, a = typeof t == "function" ? t() : t;
		!e || r >= a ? (h.apply(this, s), e = o) : i || (i = setTimeout(() => {
			h.apply(this, s), e = (/* @__PURE__ */ new Date()).getTime(), i = void 0;
		}, a - r));
	};
}
function ht(h = []) {
	return h.length ? h.map((t) => ht(t.children) + 1).sort((t, e) => e - t)[0] : 0;
}
function Le(h = []) {
	let t = [], e = [], i = [];
	return h.forEach((s) => {
		s.fixed === "left" ? t.push(s) : s.fixed === "right" ? i.push(s) : e.push(s);
	}), [
		...t.sort((s, o) => (s.sort ?? 0) - (o.sort ?? 0)),
		...e.sort((s, o) => (s.sort ?? 0) - (o.sort ?? 0)),
		...i.sort((s, o) => (s.sort ?? 0) - (o.sort ?? 0))
	];
}
function dt(h = [], t = 1, e = 0, i = "") {
	return h.sort((s, o) => (s.sort ?? 0) - (o.sort ?? 0)).map((s) => {
		if (s.children) {
			let o = 0, r = s.fixed;
			s.children.forEach((l) => {
				l.fixed = r;
			});
			const a = dt(s.children, t - 1, e + 1, s.key);
			return a && a.forEach((l) => {
				o += l.colspan ?? 0;
			}), {
				...s,
				width: s.width,
				level: e,
				rowspan: 1,
				colspan: o,
				parentKey: i,
				children: a.sort((l, c) => (l.sort ?? 0) - (c.sort ?? 0))
			};
		}
		return {
			...s,
			level: e,
			rowspan: t,
			colspan: 1,
			parentKey: i
		};
	});
}
function st(h = []) {
	let t = [];
	return h.forEach((e) => {
		e.children ? t = t.concat(st(e.children)) : t.push(e);
	}), t;
}
function le(h) {
	return h.filter((t) => !t.hide).map((t) => Array.isArray(t.children) && t.children.length > 0 ? {
		...t,
		children: le(t.children)
	} : { ...t });
}
var zt = /^(\r\n|\n\r|\r|\n)/;
var Me = /^[^\t\r\n]+/;
var Pt = /^\t/;
function Ae(h) {
	let t = [[""]];
	if (h.length === 0) return t;
	let e = 0, i = 0, s;
	for (; h.length > 0 && s !== h.length;) if (s = h.length, h.match(Pt)) h = h.replace(Pt, ""), e += 1, t[i][e] = "";
	else if (h.match(zt)) h = h.replace(zt, ""), e = 0, i += 1, t[i] = [""];
	else {
		let o = "";
		if (h.startsWith("\"")) {
			let r = 0, a = !0;
			for (; a;) {
				const l = h.slice(0, 1);
				l === "\"" && (r += 1), o += l, h = h.slice(1), (h.length === 0 || h.match(/^[\t\r\n]/) && r % 2 === 0) && (a = !1);
			}
			o = o.replace(/^"/, "").replace(/"$/, "").replace(/["]*/g, (l) => new Array(Math.floor(l.length / 2)).fill("\"").join(""));
		} else {
			const r = h.match(Me);
			o = r ? r[0] : "", h = h.slice(o.length);
		}
		t[i][e] = o;
	}
	return Array.isArray(t) && t.length > 1 && t[t.length - 1].length === 1 && t[t.length - 1][0] === "" && (t = t.slice(0, t.length - 1)), t;
}
function De(h) {
	let t, e, i, s, o = "", r;
	for (t = 0, e = h.length; t < e; t += 1) {
		for (s = h[t].length, i = 0; i < s; i += 1) i > 0 && (o += "	"), r = h[t][i], typeof r == "string" ? r.indexOf(`
`) > -1 ? o += `"${r.replace(/"/g, "\"\"")}"` : o += r : r == null ? o += "" : o += r;
		t !== e - 1 && (o += `
`);
	}
	return o;
}
function ce(h, t, e = []) {
	let i = 0;
	const s = [];
	return h.forEach((o, r) => {
		if (r === 0) s.push(1);
		else (e.reduce((c, f) => `${c}${o[f] ?? ""}`, "") || o[t]) === (e.reduce((c, f) => `${c}${h[r - 1][f] ?? ""}`, "") || h[r - 1][t]) ? (s[i] += 1, s.push(0)) : (s.push(1), i = r);
	}), s;
}
function he(h, t) {
	let e = "", i = "";
	const s = {};
	return t.forEach((o, r) => {
		r === 0 ? (e = o.key, i = o.key, s[o.key] = 1) : h[o.key] === h[e] ? (s[o.key] = 0, s[i] += 1) : (s[o.key] = 1, e = o.key, i = o.key);
	}), s;
}
function He(h, t, e = []) {
	const { visibleRows: i, rowIndex: s, headIndex: o } = h, r = ce(i, t, e);
	return r[s - o] === 0 ? {
		rowspan: 0,
		colspan: 0,
		relationRowKeys: e,
		mergeRow: !0
	} : {
		rowspan: r[s - o],
		colspan: 1,
		relationRowKeys: e,
		mergeRow: !0
	};
}
function Ne(h, t = []) {
	const { column: e, row: i, visibleLeafColumns: s } = h, o = s.filter((r) => t.includes(r.key));
	if (t.includes(e.key)) {
		const r = he(i, o);
		return r[e.key] === 0 ? {
			rowspan: 0,
			colspan: 0,
			relationColKeys: t,
			mergeCol: !0
		} : {
			rowspan: 1,
			colspan: r[e.key],
			relationColKeys: t,
			mergeCol: !0
		};
	}
}
function ke(h, t = document.documentElement) {
	const e = h.startsWith("--") ? h : `--${h}`;
	return getComputedStyle(t).getPropertyValue(e).trim();
}
function $t(h) {
	if (!h) return /* @__PURE__ */ new Date(0);
	if (typeof h == "number") return new Date(h);
	const t = String(h).trim(), e = new Date(t);
	if (!isNaN(e.getTime())) return e;
	for (const s of [
		/^(\d{4})-(\d{1,2})-(\d{1,2})$/,
		/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
		/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/,
		/^(\d{1,2})-(\d{1,2})-(\d{4})$/,
		/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
		/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
		/^(\d{1,2})-(\d{1,2})-(\d{4})$/,
		/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
		/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
		/^(\d{4})(\d{2})(\d{2})$/,
		/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/,
		/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/
	]) {
		const o = t.match(s);
		if (o) {
			const r = o.slice(1).map(Number);
			if (s.source.includes("YYYY-MM-DD") || s.source.includes("YYYY/MM/DD") || s.source.includes("YYYY.MM.DD")) {
				const [a, l, c, f = 0, d = 0, u = 0] = r;
				return new Date(a, l - 1, c, f, d, u);
			} else if (s.source.includes("DD-MM-YYYY") || s.source.includes("DD/MM/YYYY") || s.source.includes("DD.MM.YYYY")) {
				const [a, l, c, f = 0, d = 0, u = 0] = r;
				return new Date(c, l - 1, a, f, d, u);
			} else if (s.source.includes("MM-DD-YYYY") || s.source.includes("MM/DD/YYYY") || s.source.includes("MM.DD.YYYY")) {
				const [a, l, c, f = 0, d = 0, u = 0] = r;
				return new Date(c, a - 1, l, f, d, u);
			} else if (s.source.includes("YYYYMMDD")) {
				const [a, l, c] = r;
				return new Date(a, l - 1, c);
			}
		}
	}
	return /* @__PURE__ */ new Date(NaN);
}
function Be(h, t) {
	const e = $t(h), i = $t(t);
	return isNaN(e.getTime()) && isNaN(i.getTime()) ? 0 : isNaN(e.getTime()) ? -1 : isNaN(i.getTime()) ? 1 : e.getTime() - i.getTime();
}
function Xe(h) {
	const t = String(h).match(/\.(\d+)/);
	return (t == null ? void 0 : t[1].length) ?? 0;
}
function Fe(h) {
	return (h.scrollbarMode ?? h.SCROLLBAR_MODE) === "inner" ? "inner" : "outer";
}
function V(h) {
	return Fe(h) === "inner";
}
function B(h) {
	return V(h) ? 0 : h.SCROLLER_TRACK_SIZE || 0;
}
function de(h) {
	return h.SCROLLER_TRACK_SIZE || 0;
}
function Gt(h, t) {
	return !V(h) || !t ? 0 : de(h);
}
function Ye(h) {
	return V(h) ? 1 : 0;
}
function Ke(h) {
	return !V(h);
}
function We(h) {
	return !V(h);
}
function Ve(h, t) {
	return V(h) && t;
}
function ze(h, t) {
	return V(h) ? t.innerVisible || t.isFocus || t.isDragging : !0;
}
var fe = class {
	constructor(t, e, i, s, o, r, a) {
		n(this, "ctx");
		n(this, "x", 0);
		n(this, "y", 0);
		n(this, "width", 0);
		n(this, "height", 0);
		n(this, "visibleWidth", 0);
		n(this, "visibleHeight", 0);
		n(this, "fixed");
		n(this, "cellType");
		n(this, "drawX", 0);
		n(this, "drawY", 0);
		n(this, "cellImages", /* @__PURE__ */ new Map());
		this.ctx = t, this.x = e, this.y = i, this.width = s, this.height = o, this.fixed = a, this.cellType = r;
	}
	isHorizontalVisible() {
		if (this.fixed) return !0;
		const { stageWidth: t, fixedLeftWidth: e, scrollX: i, fixedRightWidth: s } = this.ctx, o = t;
		return !(this.x + this.width - e - i <= 0 || this.x - i >= o - s);
	}
	isVerticalVisible() {
		const { stageHeight: t, scrollY: e } = this.ctx, i = t;
		return !(this.y + this.height - e <= 0 || this.y - e >= i);
	}
	getDrawX() {
		if (this.fixed === "left") return this.x;
		if (this.fixed === "right") {
			const { stageWidth: t } = this.ctx;
			return t - (this.ctx.header.width - this.x) - B(this.ctx.config);
		}
		return this.x - this.ctx.scrollX;
	}
	getDrawY() {
		return this.cellType === "header" ? this.y : this.cellType === "footer" && this.ctx.config.FOOTER_FIXED ? this.y : this.y - this.ctx.scrollY;
	}
	getLeftFixedX() {
		return this.x - this.ctx.scrollX;
	}
	isInside(t, e) {
		return t >= this.drawX && t <= this.drawX + this.width && e >= this.drawY && e <= this.drawY + this.height;
	}
	/**
	* 判断是否在可见区域,合并单元格用
	* @param x 
	* @param y 
	* @returns 
	*/
	isInsideVisible(t, e) {
		return t >= this.drawX && t <= this.drawX + this.visibleWidth && e >= this.drawY && e <= this.drawY + this.visibleHeight && this.isInside(t, e);
	}
	setImage(t, e) {
		this.cellImages.set(t, e);
	}
	getImages() {
		return this.cellImages;
	}
	getImage(t) {
		return this.cellImages.get(t);
	}
	isImageInside(t, e) {
		const { offsetX: i, offsetY: s } = this.ctx.getOffset(e), o = this.getImage(t);
		return o ? o.isInside(i, s) : !1;
	}
	getImageClickDirection(t, e) {
		const { offsetX: i, offsetY: s } = this.ctx.getOffset(e), o = this.getImage(t);
		if (!o) return null;
		const r = i - o.x, a = s - o.y, l = o.width / 2;
		return a < o.height / 2 ? r < l ? "up-left" : "up-right" : r < l ? "down-left" : "down-right";
	}
};
var Z = class {
	constructor(t, e, i, s, o, r) {
		n(this, "source");
		n(this, "name");
		n(this, "x");
		n(this, "y");
		n(this, "width");
		n(this, "height");
		n(this, "visible", !0);
		this.source = r, this.name = t, this.x = e, this.y = i, this.width = s, this.height = o;
	}
	drawWrapper(t, e) {
		t.paint.drawRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4, {
			radius: 4,
			borderWidth: 1,
			...e
		});
	}
	setVisible(t) {
		this.visible = t;
	}
	isInside(t, e) {
		return this.visible ? !!(this.source && t > this.x && t < this.x + this.width && e > this.y && e < this.y + this.height) : !1;
	}
};
function Pe(h) {
	return h.ENABLE_RESIZE_COLUMN ? h.RESIZE_COLUMN_DIVIDER_COLOR : void 0;
}
function rt(h) {
	return h === !0 ? "default" : h === !1 ? "inner" : h;
}
function ft(h) {
	return rt(h) === "default";
}
function kt(h) {
	const t = rt(h);
	return t === "default" || t === "inner";
}
function $e(h, t, e, i, s = {}) {
	const { fixedLeftEnd: o = i, fixedRightStart: r = 0 } = s;
	return h === "right" ? t > r + .01 ? "left" : null : h === "left" ? t + e < o - .01 ? "right" : null : t + e < i - .01 ? "right" : null;
}
function Ge(h) {
	const t = rt(h);
	return t === "default" || t === "outer";
}
function St(h) {
	return rt(h) === "default";
}
function Ue(h, t) {
	return St(h) || t;
}
var ue = class extends fe {
	constructor(e, i, s, o, r, a, l, c, f, d = "body", u = !0) {
		super(e, o, r, a, l, d, c.fixed);
		n(this, "parentRowKey", "");
		n(this, "parentRowKeys", []);
		n(this, "formatter");
		n(this, "formatterFinderValue");
		n(this, "formatterFinderFooterValue");
		n(this, "formatterFooter");
		n(this, "hoverIconName", "");
		n(this, "operation", !1);
		n(this, "align");
		n(this, "verticalAlign");
		n(this, "fixed");
		n(this, "type");
		n(this, "editorType");
		n(this, "editorProps");
		n(this, "cellType");
		n(this, "level");
		n(this, "colspan", 1);
		n(this, "rowspan", 1);
		n(this, "mergeRow", !1);
		n(this, "mergeCol", !1);
		n(this, "relationRowKeys", []);
		n(this, "relationColKeys", []);
		n(this, "key");
		n(this, "column");
		n(this, "rowIndex");
		n(this, "colIndex");
		n(this, "rowKey");
		n(this, "row");
		n(this, "value");
		n(this, "render");
		n(this, "renderFooter");
		n(this, "style", {});
		n(this, "domDataset", {});
		n(this, "rules", []);
		n(this, "message", "");
		n(this, "text", "");
		n(this, "displayText", "");
		n(this, "visibleWidth", 0);
		n(this, "visibleHeight", 0);
		n(this, "isHasChanged", !1);
		n(this, "drawX", 0);
		n(this, "drawY", 0);
		n(this, "drawCellBgColor", "");
		n(this, "drawCellSkyBgColor", "");
		n(this, "drawTextColor", "");
		n(this, "drawTextFont", "");
		n(this, "drawTextX", 0);
		n(this, "drawTextY", 0);
		n(this, "drawTextWidth", 0);
		n(this, "drawTextHeight", 0);
		n(this, "autoRowHeight", !1);
		n(this, "calculatedHeight", 0);
		n(this, "ellipsis", !1);
		n(this, "rowExpand", !1);
		n(this, "rowHasChildren", !1);
		n(this, "overflowTooltipShow", !0);
		n(this, "selectorCellValueType", "value");
		n(this, "overflowTooltipMaxWidth", 500);
		n(this, "overflowTooltipPlacement", "top");
		n(this, "maxLineClamp", "auto");
		n(this, "precision");
		n(this, "min");
		n(this, "max");
		n(this, "maxlength");
		n(this, "mixedRender", !1);
		n(this, "renderType", "default");
		n(this, "renderFooterType", "default");
		this.visibleWidth = this.width, this.visibleHeight = this.height, this.colIndex = s, this.rowIndex = i, this.key = c.key, this.type = c.type || "", this.editorType = c.editorType || "text", this.selectorCellValueType = c.selectorCellValueType || this.ctx.config.SELECTOR_CELL_VALUE_TYPE || "value", this.editorProps = c.editorProps || {}, this.cellType = d, this.align = c.align || this.ctx.config.COLUMNS_ALIGN, this.verticalAlign = c.verticalAlign || this.ctx.config.COLUMNS_VERTICAL_ALIGN, this.fixed = c.fixed || "", this.level = c.level || 0, this.operation = c.operation || !1, this.column = c, this.rules = c.rules || [], this.row = f, this.rowKey = this.cellType === "body" ? this.ctx.database.getRowKeyForRowIndex(i) : `${this.cellType}_${this.rowIndex}`, this.value = this.getValue(), this.render = c.render, this.overflowTooltipShow = c.overflowTooltipShow !== !1, this.autoRowHeight = c.autoRowHeight !== void 0 ? c.autoRowHeight : this.ctx.config.AUTO_ROW_HEIGHT, this.overflowTooltipMaxWidth = c.overflowTooltipMaxWidth || 500, this.overflowTooltipPlacement = c.overflowTooltipPlacement || "top", this.renderFooter = c.renderFooter, this.hoverIconName = c.hoverIconName, this.formatter = c.formatter, this.formatterFinderValue = c.formatterFinderValue, this.formatterFinderFooterValue = c.formatterFinderFooterValue, this.formatterFooter = c.formatterFooter, this.maxLineClamp = c.maxLineClamp || "auto", this.precision = c.precision, this.min = c.min, this.max = c.max, this.maxlength = c.maxlength, this.mixedRender = c.mixedRender || !1, this.renderType = c.renderType || "default", this.renderFooterType = c.renderFooterType || "default";
		const x = this.ctx.database.getRowForRowKey(this.rowKey);
		this.cellType === "body" && x && (this.parentRowKey = x.parentRowKey, this.parentRowKeys = x.parentRowKeys), u && this.update();
	}
	setWidthHeight(e, i) {
		this.width = e, this.height = i;
	}
	getValidationMessage() {
		const e = this.ctx.database.getValidationError(this.rowKey, this.key);
		if (Array.isArray(e) && e.length) {
			const [i] = e;
			this.message = i.message || "";
		}
		return this.message;
	}
	update() {
		this.drawX = this.getDrawX(), this.drawY = this.getDrawY(), this.updateSpan(), this.updateDragImage();
		const e = this.getImage("drag"), i = e ? e.width : 0;
		this.drawTextX = this.drawX + i, this.drawTextY = this.drawY, this.isHasChanged = this.ctx.database.isHasChangedData(this.rowKey, this.key), this.drawTextWidth = this.visibleWidth - i, this.drawTextHeight = this.visibleHeight, this.updateStyle(), this.updateType(), this.updateHoverIcon(), this.updateSelection(), this.updateTree(), this.updateEditor(), this.updateRender(), this.getValidationMessage(), this.updateContainer(), this.text = this.getText(), this.displayText = this.getDisplayText();
	}
	updateSpan() {
		if (this.cellType === "footer") return;
		const { SPAN_METHOD: e } = this.ctx.config;
		if (typeof e == "function") {
			const { colspan: s = 1, rowspan: o = 1, relationRowKeys: r, relationColKeys: a, mergeRow: l = !1, mergeCol: c = !1 } = e({
				row: this.row,
				rowIndex: this.rowIndex,
				colIndex: this.colIndex,
				column: this.column,
				value: this.getValue(),
				headIndex: this.ctx.body.headIndex,
				headPosition: this.ctx.database.getPositionForRowIndex(this.ctx.body.headIndex),
				visibleRows: this.ctx.body.visibleRows,
				visibleLeafColumns: this.ctx.header.visibleLeafColumns,
				rows: this.ctx.body.data
			}) || {};
			Array.isArray(r) && r.length > 0 ? this.relationRowKeys = r : this.relationRowKeys = [this.key], Array.isArray(a) && a.length > 0 ? this.relationColKeys = a : this.relationColKeys = [this.key], this.mergeCol = c, this.mergeRow = l, this.colspan = s, this.rowspan = o, this.visibleWidth = this.getWidthByColIndexColSpan(this.colIndex, this.colspan), this.visibleHeight = this.ctx.database.getHeightByRowIndexRowSpan(this.rowIndex, this.rowspan);
		}
	}
	updateSpanInfo() {
		if (this.mergeRow || this.mergeCol) {
			const e = this.getSpanInfo();
			this.height = e.height, this.width = e.width, this.drawX = this.getDrawX(), this.drawY = this.getDrawY(), this.drawY -= e.offsetTop, this.drawX -= e.offsetLeft;
		}
	}
	updateType() {
		const { BODY_CELL_TYPE_METHOD: e } = this.ctx.config;
		if (typeof e == "function") {
			const s = e({
				row: this.row,
				rowIndex: this.rowIndex,
				colIndex: this.colIndex,
				column: this.column,
				value: this.getValue()
			});
			s !== void 0 && (this.type = s);
		}
	}
	updateEditor() {
		const { BODY_CELL_EDITOR_METHOD: e } = this.ctx.config;
		if (typeof e == "function") {
			const s = e({
				row: this.row,
				rowIndex: this.rowIndex,
				colIndex: this.colIndex,
				column: this.column,
				value: this.getValue()
			});
			if (s !== void 0) {
				const { type: o, props: r = {} } = s;
				this.editorType = o, this.editorProps = r;
			}
		}
	}
	updateRender() {
		const { BODY_CELL_RENDER_METHOD: e } = this.ctx.config;
		if (typeof e == "function") {
			const s = e({
				row: this.row,
				rowIndex: this.rowIndex,
				colIndex: this.colIndex,
				column: this.column,
				value: this.getValue()
			});
			s !== void 0 && (this.render = s);
		}
	}
	validate() {
		this.ctx.database.getValidator(this.rowKey, this.key).then((e) => {
			if (Array.isArray(e) && e.length) {
				const [i] = e;
				this.message = i.message;
			} else this.message = "";
		}).finally(() => {
			this.ctx.emit("draw");
		});
	}
	/**
	* 更新样式
	*/
	updateStyle() {
		this.autoRowHeight && (this.domDataset = {
			"data-auto-height": !0,
			"data-row-index": this.rowIndex,
			"data-col-index": this.colIndex
		}), this.style = this.getOverlayerViewsStyle();
	}
	isInsideVisible(e, i) {
		return e >= this.drawX && e <= this.drawX + this.visibleWidth && i >= this.drawY && i <= this.drawY + this.visibleHeight;
	}
	updateTree() {
		const { CELL_PADDING: e = 0 } = this.ctx.config, { rowKey: i, cellType: s } = this;
		let o, r = 0, a = "";
		if (!([
			"tree",
			"selection-tree",
			"tree-selection"
		].includes(this.type) && s === "body")) return;
		const { expand: c = !1, hasChildren: f = !1, expandLoading: d = !1, level: u = 0 } = this.ctx.database.getRowForRowKey(i) || {};
		this.rowExpand = c, this.rowHasChildren = f;
		const { TREE_INDENT: x = 16, CHECKBOX_SIZE: w, TREE_ICON_SIZE: E } = this.ctx.config;
		if (r = u * x, d) {
			const v = this.ctx.icons.get("loading");
			a = "loading", o = v;
		} else if (f) {
			const v = this.ctx.icons.get("expand"), I = this.ctx.icons.get("shrink");
			o = c ? I : v, a = c ? "shrink" : "expand";
		}
		let g = E, m = E, y = this.drawX;
		(this.align === "center" || this.align === "right") && (y = this.drawX + (this.visibleWidth - g - 2 * e) / 2, this.align = "left");
		let p = y + r + e, R = this.drawY + (this.visibleHeight - m) / 2, C = r + this.drawX + g - .5;
		const b = this.getImage("selection"), _ = this.getImage("drag"), T = _ ? _.width : 0;
		if (this.type === "selection-tree" && b) {
			const v = b.x, I = b.width;
			p = r + v + I, C = p + g - e / 2;
		} else this.type === "tree-selection" ? (p += T, C = p + w + g - e / 2) : (p += T, C = p + g - e / 2);
		this.drawTextX = C, this.drawTextWidth = this.drawX + this.visibleWidth - C, !(p + g + e > this.drawX + this.visibleWidth) && (R + m + e > this.drawY + this.visibleHeight || this.setImage("tree", new Z(a, p, R, g, m, o)));
	}
	updateDragImage() {
		if (this.cellType === "body" && this.column.dragRow) {
			const { DRAG_ROW_ICON_SIZE: e, CELL_PADDING: i } = this.ctx.config, r = new Z("drag", this.drawX + i / 2, this.drawY + (this.visibleHeight - e) / 2, e, e, this.ctx.icons.get("drag"));
			this.rowspan === 0 && r.setVisible(!1), this.setImage("drag", r);
		}
	}
	drawTreeLine() {
		const { TREE_LINE: e, TREE_INDENT: i = 16, TREE_ICON_SIZE: s = 16, TREE_LINE_COLOR: o = "#e1e6eb" } = this.ctx.config;
		if (!e || this.cellType !== "body" || ![
			"tree",
			"selection-tree",
			"tree-selection"
		].includes(this.type) || this.rowspan === 0 || this.colspan === 0) return;
		const r = this.ctx.database.getRowForRowKey(this.rowKey) || {}, a = r.level ?? 0, l = this.getImage("tree");
		if (!l) return;
		const c = l.x, f = l.y, d = l.width, u = l.height, x = c + d / 2, w = f + u / 2;
		let E = c - a * i;
		const g = Array.isArray(r.parentRowKeys) ? r.parentRowKeys : [];
		if (a > 0) {
			for (let C = 0; C < a - 1; C += 1) {
				const b = g[C + 1];
				if (!!(b ? this.ctx.database.getRowForRowKey(b) || {} : {}).isLastChild) continue;
				const v = Math.round(c - (a - C) * i + s / 2);
				this.ctx.paint.drawLine([
					v,
					this.drawY,
					v,
					this.drawY + this.visibleHeight
				], {
					borderColor: o,
					borderWidth: 1,
					lineDash: [4, 4],
					lineDashOffset: 0
				});
			}
			const m = Math.round(c - i + s / 2), p = !!r.isLastChild ? w : this.drawY + this.visibleHeight;
			this.ctx.paint.drawLine([
				m,
				this.drawY,
				m,
				p
			], {
				borderColor: o,
				borderWidth: 1,
				lineDash: [4, 4],
				lineDashOffset: 0
			});
			const R = Math.round(E + (a - 1) * i + s / 2);
			this.ctx.paint.drawLine([
				R,
				w,
				x,
				w
			], {
				borderColor: o,
				borderWidth: 1,
				lineDash: [4, 4],
				lineDashOffset: 0
			});
		}
		if (r.hasChildren && r.expand) {
			const m = f + u, y = this.drawY + this.visibleHeight;
			this.ctx.paint.drawLine([
				x,
				m,
				x,
				y
			], {
				borderColor: o,
				borderWidth: 1,
				lineDash: [4, 4],
				lineDashOffset: 0
			});
		}
	}
	updateContainer() {
		const { BODY_BG_COLOR: e, EDIT_BG_COLOR: i, BODY_CELL_STYLE_METHOD: s, FOOTER_CELL_STYLE_METHOD: o, READONLY_TEXT_COLOR: r, BODY_TEXT_COLOR: a, FOOTER_TEXT_COLOR: l, FOOTER_BG_COLOR: c, HIGHLIGHT_SELECTED_ROW: f, HIGHLIGHT_SELECTED_ROW_COLOR: d, HIGHLIGHT_HOVER_ROW: u, HIGHLIGHT_HOVER_ROW_COLOR: x, STRIPE: w, STRIPE_COLOR: E, FINDER_CELL_BG_COLOR: g } = this.ctx.config;
		if (this.cellType === "footer") {
			let S = c, O = l;
			if (typeof o == "function") {
				const { backgroundColor: A, color: k, font: H } = o({
					row: this.row,
					rowIndex: this.rowIndex,
					colIndex: this.colIndex,
					column: this.column,
					value: this.getValue()
				}) || {};
				A && (S = A), k && (O = k), H && (this.drawTextFont = H);
			}
			const { rowIndex: M, colIndex: L, type: D } = this.ctx.finderBar;
			M === this.rowIndex && L === this.colIndex && D === "footer" && (S = g), this.drawCellSkyBgColor = "transparent", this.drawCellBgColor = S, this.drawTextColor = O;
			return;
		}
		let m = "transparent";
		const y = this.ctx.hoverCell, p = this.ctx.currentCell;
		let R = this.rowIndex, C = this.rowIndex;
		if (this.rowspan !== 1 && (u || f)) {
			const { yArr: O } = this.getSpanInfo();
			R = O[0], C = O[1];
		}
		u && y && !this.ctx.dragRowIng && (y.rowKey === this.rowKey && (m = x), y.rowIndex >= R && y.rowIndex <= C && (m = x)), f && p && !this.ctx.dragRowIng && (p.rowKey === this.rowKey && (m = d), p.rowIndex >= R && p.rowIndex <= C && (m = d)), this.drawCellSkyBgColor = m;
		let b = e, _ = a;
		if (!this.ctx.database.getReadonly(this.rowKey, this.key) && !["index", "index-selection"].includes(this.type) && (b = i, _ = r), w && (this.rowIndex % 2 ? b = E : b = e), typeof s == "function") {
			const { backgroundColor: O, color: M, font: L } = s({
				row: this.row,
				rowIndex: this.rowIndex,
				colIndex: this.colIndex,
				column: this.column,
				isHasChanged: this.isHasChanged,
				value: this.getValue()
			}) || {};
			O && (b = O), M && (_ = M), L && (this.drawTextFont = L);
		}
		const { rowIndex: T, colIndex: v, type: I } = this.ctx.finderBar;
		T === this.rowIndex && v === this.colIndex && I === "body" && (b = g), this.drawCellBgColor = b, this.drawTextColor = _;
	}
	updateSelection() {
		const { visibleWidth: e, visibleHeight: i, rowspan: s, colspan: o, cellType: r, type: a, rowIndex: l, rowKey: c } = this;
		if (s === 0 || o === 0 || r === "footer" || ![
			"index-selection",
			"selection",
			"selection-tree",
			"tree-selection"
		].includes(a)) return;
		const f = this.ctx.database.getRowSelectable(c), { CHECKBOX_SIZE: d = 0, CELL_PADDING: u } = this.ctx.config;
		let x = this.drawX + u;
		(this.align === "center" || this.align === "right") && (x = this.drawX + (e - d) / 2);
		let w = x, E = this.drawY + (i - d) / 2;
		if (a !== "selection-tree") {
			if (a === "tree-selection") {
				const { TREE_INDENT: C = 16, TREE_ICON_SIZE: b } = this.ctx.config, { level: T = 0 } = this.ctx.database.getRowForRowKey(c) || {}, v = T * C;
				w = x + b + v;
			}
		}
		let g = this.ctx.icons.get("checkbox-uncheck"), m = "checkbox-uncheck";
		if (a === "selection-tree" || a === "tree-selection") {
			const C = this.ctx.database.getTreeSelectionState(c);
			C.indeterminate && f ? (g = this.ctx.icons.get("checkbox-indeterminate"), m = "checkbox-indeterminate") : C.checked && f ? (g = this.ctx.icons.get("checkbox-check"), m = "checkbox-check") : !C.checked && f ? (g = this.ctx.icons.get("checkbox-uncheck"), m = "checkbox-uncheck") : (g = this.ctx.icons.get("checkbox-disabled"), m = "checkbox-disabled");
		} else {
			const C = this.ctx.database.getRowSelection(c);
			C && f ? (g = this.ctx.icons.get("checkbox-check"), m = "checkbox-check") : C && !f ? (g = this.ctx.icons.get("checkbox-check-disabled"), m = "checkbox-check-disabled") : !C && f ? (g = this.ctx.icons.get("checkbox-uncheck"), m = "checkbox-uncheck") : (g = this.ctx.icons.get("checkbox-disabled"), m = "checkbox-disabled");
		}
		const y = this.getImage("drag"), p = y ? y.width : 0;
		if (w += p, w + d + u > this.drawX + this.visibleWidth || E + d + u > this.drawY + this.visibleHeight) return;
		const R = new Z(m, w, E, d, d, g);
		if (a === "index-selection") {
			R.setVisible(!1), (this.ctx.hoverCell && this.ctx.hoverCell.rowIndex === l || ["checkbox-disabled", "checkbox-check"].includes(m)) && R.setVisible(!0);
			let C = this.rowIndex, b = this.rowIndex;
			const _ = this.ctx.hoverCell, { yArr: v } = this.getSpanInfo();
			C = v[0], b = v[1], _ && _.rowIndex >= C && _.rowIndex <= b && R.setVisible(!0);
		}
		this.setImage("selection", R);
	}
	updateHoverIcon() {
		if (this.ctx.database.getReadonly(this.rowKey, this.key)) return;
		const { BODY_CELL_HOVER_ICON_METHOD: i, CELL_HOVER_ICON_SIZE: s, CELL_PADDING: o, ENABLE_MERGE_CELL_LINK: r } = this.ctx.config;
		if (typeof i == "function") {
			const c = i({
				row: this.row,
				rowIndex: this.rowIndex,
				colIndex: this.colIndex,
				column: this.column,
				value: this.getValue()
			});
			c !== void 0 && (this.hoverIconName = c);
		}
		const { hoverCell: a } = this.ctx;
		if (this.hoverIconName && !this.ctx.editing && !this.ctx.dragRowIng && a) {
			let l = 0, c = 0;
			if (a.rowKey === this.rowKey && (l = this.drawX + this.width - s - o, c = this.drawY + (this.height - s) / 2), this.rowspan !== 1 && r) {
				const u = this.getSpanInfo(), { yArr: x } = u, w = x[0], E = x[1];
				if (a.rowIndex >= w && a.rowIndex <= E) {
					const { width: g, height: m, offsetTop: y, offsetLeft: p } = u;
					l = this.drawX - p + g - s - o, c = this.drawY - y + (m - s) / 2;
				}
			}
			const f = this.ctx.icons.get(this.hoverIconName), d = new Z(this.hoverIconName, l, c, s, s, f);
			(this.rowspan === 0 || this.colspan === 0) && d.setVisible(!1), this.setImage("hover", d);
		}
	}
	/**
	* 获取自动高度
	* @returns
	*/
	getAutoHeight() {
		if (this.cellType !== "body" || !this.autoRowHeight || this.rowspan === 0) return 0;
		if (this.render) {
			const a = this.ctx.database.getOverlayerAutoHeight(this.rowIndex, this.colIndex);
			return this.rowspan > 1 ? a < this.visibleHeight ? 0 : Math.round(a - (this.visibleHeight - this.height)) : Math.round(a);
		}
		if (!(this.displayText && typeof this.displayText == "string")) return 0;
		const { BODY_FONT: e, CELL_PADDING: i, CELL_LINE_HEIGHT: s } = this.ctx.config, o = `${this.displayText}_${this.drawTextWidth}_${this.drawTextFont}`, r = this.ctx.paint.calculateTextHeight(this.displayText, this.drawTextWidth, {
			font: this.drawTextFont || e,
			padding: i,
			align: this.align,
			verticalAlign: this.verticalAlign,
			color: this.drawTextColor,
			autoRowHeight: this.autoRowHeight,
			lineHeight: s,
			maxLineClamp: this.maxLineClamp,
			cacheTextKey: o
		});
		return this.rowspan > 1 ? r < this.visibleHeight ? 0 : Math.round(r - (this.visibleHeight - this.height)) : Math.round(r);
	}
	getSpanInfo() {
		return this.ctx.database.getSpanInfo(this);
	}
	/**
	* 获取显示文本
	* @returns
	*/
	getDisplayText(e = this.text) {
		if (this.cellType === "footer") return this.renderFooter && this.renderFooterType === "default" || e == null ? "" : `${e}`;
		{
			if (this.rowspan === 0 || this.colspan === 0 || this.render && this.renderType === "default" && !this.mixedRender) return "";
			const i = this.getImage("selection");
			return this.type === "index-selection" && i && i.visible || e == null ? "" : `${e}`;
		}
	}
	/**
	* 获取文本
	* @returns
	*/
	getText() {
		if (this.cellType === "footer") return typeof this.formatterFooter == "function" ? this.formatterFooter({
			row: this.row,
			rowIndex: this.rowIndex,
			colIndex: this.colIndex,
			column: this.column,
			value: this.row[this.key]
		}) : this.row[this.key];
		if (typeof this.formatter == "function") return this.formatter({
			row: this.row,
			rowIndex: this.rowIndex,
			colIndex: this.colIndex,
			column: this.column,
			value: this.getValue()
		});
		const { BODY_CELL_FORMATTER_METHOD: e } = this.ctx.config;
		return typeof e == "function" ? e({
			row: this.row,
			rowIndex: this.rowIndex,
			colIndex: this.colIndex,
			column: this.column,
			value: this.getValue()
		}) : ["index-selection", "index"].includes(this.type) ? `${this.rowIndex + 1}` : (this.value = this.ctx.database.getItemValue(this.rowKey, this.key), this.value);
	}
	getFinderText() {
		const e = this.getDisplayText(this.getText()), i = this.cellType === "footer" ? this.formatterFinderFooterValue : this.formatterFinderValue;
		if (typeof i != "function") return e;
		const s = i({
			row: this.row,
			rowIndex: this.rowIndex,
			colIndex: this.colIndex,
			column: this.column,
			value: this.cellType === "footer" ? this.row[this.key] : this.getValue(),
			displayText: e
		});
		return s == null ? e : `${s}`;
	}
	getValue() {
		return this.ctx.database.getItemValue(this.rowKey, this.key);
	}
	setValue(e) {
		this.ctx.setItemValueByEditor(this.rowKey, this.key, e);
	}
	/**
	* 获取样式
	*/
	getOverlayerViewsStyle() {
		let e = this.drawX - this.ctx.fixedLeftWidth, i = this.drawY - this.ctx.body.y;
		if (this.fixed === "left" ? e = this.drawX : this.fixed === "right" && (e = this.drawX - (this.ctx.stageWidth - this.ctx.fixedRightWidth)), this.cellType === "footer" && this.ctx.config.FOOTER_FIXED && (i = this.drawY - this.ctx.footer.y), this.autoRowHeight && this.render && this.verticalAlign === "middle") {
			const o = this.ctx.database.getOverlayerAutoHeight(this.rowIndex, this.colIndex);
			if (o < this.visibleHeight && o > 0) {
				const r = (this.visibleHeight - o) / 2;
				i = i + r;
			}
		}
		this.autoRowHeight && this.ctx.database.getOverlayerAutoHeight(this.rowIndex, this.colIndex) === 0 && (e = -99999, i = -99999);
		let s = {};
		return this.rowspan === 0 && (s = { display: "none" }), {
			position: "absolute",
			overflow: "hidden",
			left: `${Math.round(e - 1)}px`,
			top: `${Math.round(i - 1)}px`,
			width: `${this.visibleWidth}px`,
			height: this.autoRowHeight && this.renderType === "default" ? "auto" : `${this.visibleHeight}px`,
			pointerEvents: "initial",
			userSelect: "none",
			...s
		};
	}
	drawContainer() {
		const { paint: e, config: i } = this.ctx, { BORDER: s } = i, { drawX: o, drawY: r } = this, l = ft(s) ? i.BORDER_COLOR : void 0;
		e.drawRect(o, r, this.visibleWidth, this.visibleHeight, {
			borderColor: l,
			fillColor: this.drawCellBgColor
		}), e.drawRect(o, r, this.width, this.height, { fillColor: this.drawCellSkyBgColor });
	}
	drawHorizontalBorder() {
		const { config: e } = this.ctx, { BORDER: i } = e;
		if (!kt(i) || this.cellType !== "footer" && ft(i)) return;
		const { drawX: s, drawY: o } = this, r = e.BORDER_COLOR;
		this.ctx.paint.drawLine([
			s,
			o + this.visibleHeight,
			s + this.visibleWidth,
			o + this.visibleHeight
		], {
			borderColor: r,
			fillColor: r,
			borderWidth: 1,
			lineCap: "round",
			lineJoin: "round"
		});
	}
	drawAutofillPiont() {
		if (this.cellType === "footer") return;
		const { SELECT_BORDER_COLOR: e, ENABLE_AUTOFILL: i, ENABLE_SELECTOR: s, AUTOFILL_POINT_BORDER_COLOR: o } = this.ctx.config;
		if (!s || !i || this.ctx.editing) return;
		const { xArr: r, yArr: a } = this.ctx.selector, l = r[1], c = a[1], { colIndex: f, rowIndex: d, drawX: u, drawY: x } = this;
		if (f === l && d === c) {
			const E = f === this.ctx.maxColIndex || d === this.ctx.maxRowIndex || f === this.ctx.lastCenterColIndex ? 6 : 4;
			this.ctx.paint.drawRect(u + this.width - E, x + this.height - E, 6, 6, {
				borderColor: o,
				fillColor: e
			});
		}
	}
	draw() {
		this.drawTreeLine(), this.drawText(), this.drawImage(), this.drawSelector(), this.drawAutofillPiont(), this.drawErrorTip();
	}
	/**
	* 根据列的索引获取列的宽度
	* @param {Number} colIndex
	*/
	getWidthByColIndexColSpan(e, i) {
		if (i === 0) return 0;
		let s = 0;
		for (let o = e; o < e + i; o++) {
			const r = this.ctx.header.leafCellHeaders[o];
			s += r.width;
		}
		return s;
	}
	drawText() {
		const { CELL_PADDING: e, BODY_FONT: i, PLACEHOLDER_COLOR: s, CELL_LINE_HEIGHT: o } = this.ctx.config, { placeholder: r } = this.column;
		let a = this.displayText, l = this.drawTextColor;
		if (!this.ctx.database.getReadonly(this.rowKey, this.key) && r && [
			"",
			null,
			void 0
		].includes(this.text) && this.cellType === "body" && !(this.rowspan === 0 || this.colspan === 0) && (a = r, l = s), [
			"",
			null,
			void 0
		].includes(a)) return !1;
		typeof a != "string" && (a = `${a}`);
		const f = `${a}_${this.drawTextWidth}_${this.drawTextFont}`;
		return this.ellipsis = this.ctx.paint.drawText(a, this.drawTextX, this.drawTextY, this.drawTextWidth, this.drawTextHeight, {
			font: this.drawTextFont || i,
			padding: e,
			align: this.align,
			verticalAlign: this.verticalAlign,
			color: l,
			autoRowHeight: this.autoRowHeight,
			lineHeight: o,
			maxLineClamp: this.maxLineClamp,
			cacheTextKey: f,
			layoutCallback: (d) => {
				this.ctx.emit("registerTextLayout", `${this.cellType}-${this.rowIndex}-${this.colIndex}`, d);
			}
		}), this.ellipsis;
	}
	drawImage() {
		this.getImages().forEach((e, i) => {
			if (e.visible && e.source) {
				if (i === "hover") {
					const { CELL_HOVER_ICON_BG_COLOR: s, CELL_HOVER_ICON_BORDER_COLOR: o } = this.ctx.config;
					e.drawWrapper(this.ctx, {
						borderColor: o,
						fillColor: s
					});
				}
				this.ctx.paint.drawImage(e.source, e.x, e.y, e.width, e.height);
			}
		});
	}
	drawSelector() {
		if (this.cellType === "footer") return;
		const { ENABLE_SELECTOR: e } = this.ctx.config;
		if (!e) return;
		const { xArr: i, yArr: s, xArrCopy: o, yArrCopy: r } = this.ctx.selector;
		this.drawBorder({
			xArr: o,
			yArr: r,
			borderColor: this.ctx.config.SELECT_BORDER_COLOR || "rgb(82,146,247)",
			fillColor: "transparent",
			borderWidth: 1,
			lineDash: [4, 4]
		}), this.drawBorder({
			xArr: this.ctx.autofill.xArr,
			yArr: this.ctx.autofill.yArr,
			borderColor: this.ctx.config.SELECT_BORDER_COLOR || "rgb(82,146,247)",
			fillColor: "transparent",
			borderWidth: 1,
			lineDash: [4, 4]
		}), this.drawBorder({
			xArr: i,
			yArr: s,
			borderColor: this.ctx.config.SELECT_BORDER_COLOR || "rgb(82,146,247)",
			fillColor: "transparent",
			borderWidth: 1
		});
		const [a, l] = i, [c, f] = s;
		!(a === l && c === f) && this.colIndex >= a && this.colIndex <= l && this.rowIndex >= c && this.rowIndex <= f && this.ctx.paint.drawRect(this.drawX, this.drawY, this.width, this.height, {
			borderColor: "transparent",
			fillColor: this.ctx.config.SELECT_AREA_COLOR || "rgba(82,146,247,0.1)"
		}), this.operation && this.rowIndex >= c && this.rowIndex <= f && this.ctx.paint.drawRect(this.drawX, this.drawY, this.visibleWidth, this.visibleHeight, {
			borderColor: "transparent",
			fillColor: this.ctx.config.SELECT_ROW_COL_BG_COLOR || "transparent"
		});
	}
	drawErrorTip() {
		if (this.cellType === "footer" || !this.message || this.rowspan === 0 || this.colspan === 0) return;
		const { ERROR_TIP_ICON_SIZE: e, ERROR_TIP_COLOR: i } = this.ctx.config, { width: s } = this, o = this.drawX, r = this.drawY, a = [
			o + s - e - .5,
			r,
			o + s - .5,
			r,
			o + s - .5,
			r + e
		];
		this.ctx.paint.drawLine(a, {
			borderColor: i,
			fillColor: i,
			borderWidth: 1,
			lineCap: "round",
			lineJoin: "round"
		});
	}
	drawBorder(e) {
		const { drawX: i, drawY: s, rowIndex: o, colIndex: r, height: a, width: l } = this;
		let c = i, f = s;
		const { xArr: d, yArr: u, lineDash: x = [], borderWidth: w = 1, borderColor: E, fillColor: g } = e, m = d[0], y = d[1], p = u[0], R = u[1];
		if (r >= m && r <= y && o === p) {
			const C = r === y ? 1 : 0, b = r === m ? 1 : 0;
			this.ctx.paint.drawLine([
				c + b,
				f + 1,
				c + l - C,
				f + 1
			], {
				borderColor: E,
				fillColor: g,
				borderWidth: w,
				lineCap: "round",
				lineJoin: "round",
				lineDash: x
			});
		}
		if (r === y && o >= p && o <= R) {
			const C = o === p ? 1 : 0, b = o === R ? 1 : 0;
			this.ctx.paint.drawLine([
				c + l - 1,
				f + C,
				c + l - 1,
				f + a - b
			], {
				borderColor: E,
				fillColor: g,
				borderWidth: w,
				lineCap: "round",
				lineJoin: "round",
				lineDash: x
			});
		}
		if (r >= m && r <= y && o === R) {
			const C = r === y ? 1 : 0, b = r === m ? 1 : 0;
			this.ctx.paint.drawLine([
				c + b,
				f + a - 1,
				c + l - C,
				f + a - 1
			], {
				borderColor: E,
				fillColor: g,
				borderWidth: w,
				lineCap: "round",
				lineJoin: "round",
				lineDash: x
			});
		}
		if (r === m && o >= p && o <= R) {
			const C = o === R ? 1 : 0, b = o === p ? 1 : 0;
			this.ctx.paint.drawLine([
				c + 1,
				f + b,
				c + 1,
				f + a - C
			], {
				borderColor: E,
				fillColor: g,
				borderWidth: w,
				lineCap: "round",
				lineJoin: "round",
				lineDash: x
			});
		}
	}
};
var je = class {
	constructor(t, e) {
		n(this, "ctx");
		n(this, "data");
		n(this, "columns");
		n(this, "footerData", []);
		n(this, "rowKeyMap", /* @__PURE__ */ new Map());
		n(this, "colIndexKeyMap", /* @__PURE__ */ new Map());
		n(this, "headerMap", /* @__PURE__ */ new Map());
		n(this, "rowIndexRowKeyMap", /* @__PURE__ */ new Map());
		n(this, "rowKeyRowIndexMap", /* @__PURE__ */ new Map());
		n(this, "checkboxKeyMap", /* @__PURE__ */ new Map());
		n(this, "selectionMap", /* @__PURE__ */ new Map());
		n(this, "expandMap", /* @__PURE__ */ new Map());
		n(this, "originalDataMap", /* @__PURE__ */ new Map());
		n(this, "changedDataMap", /* @__PURE__ */ new Map());
		n(this, "validationErrorMap", /* @__PURE__ */ new Map());
		n(this, "itemRowKeyMap", /* @__PURE__ */ new WeakMap());
		n(this, "bufferData", []);
		n(this, "customHeader", {
			fixedData: {},
			sortData: {},
			hideData: {},
			resizableData: {}
		});
		n(this, "overlayerAutoHeightMap", /* @__PURE__ */ new Map());
		n(this, "maxRowHeightCellMap", /* @__PURE__ */ new Map());
		n(this, "bufferCheckState", {
			buffer: !1,
			check: !1,
			indeterminate: !1,
			selectable: !0
		});
		n(this, "sumHeight", 0);
		n(this, "filterMethod");
		n(this, "positions", []);
		n(this, "sortState", /* @__PURE__ */ new Map());
		this.ctx = t;
		const { data: i = [], columns: s = [], footerData: o = [] } = e;
		this.data = i, this.footerData = o, this.columns = s, this.init();
	}
	init(t = !0) {
		this.ctx.paint.clearTextCache(), this.clearBufferData(), this.rowKeyMap.clear(), this.checkboxKeyMap.clear(), this.colIndexKeyMap.clear(), this.rowIndexRowKeyMap.clear(), this.rowKeyRowIndexMap.clear(), this.maxRowHeightCellMap.clear();
		const i = st(this.getColumns());
		if (this.ctx.hasSelection = i.some((s) => s.type === "selection"), this.ctx.hasTree = i.some((s) => {
			var o;
			return (o = s.type) == null ? void 0 : o.includes("tree");
		}), t) {
			this.originalDataMap.clear(), this.changedDataMap.clear(), this.validationErrorMap.clear();
			const { ROW_KEY: s } = this.ctx.config;
			s ? (this.ctx.hasSelection || this.selectionMap.clear(), this.ctx.hasTree || this.expandMap.clear()) : (this.selectionMap.clear(), this.expandMap.clear());
		}
		this.itemRowKeyMap = /* @__PURE__ */ new WeakMap(), this.initData(this.data), this.getData(), this.bufferCheckState.buffer = !1;
	}
	/**
	* 清除缓存数据
	*/
	clearBufferData() {
		this.bufferData = [];
	}
	/**
	* 解析行唯一标识，统一转为 string
	*/
	resolveRowKey(t, e = "") {
		let i;
		return typeof e == "function" ? i = e(t) : e && (i = t[e]), i != null ? String(i) : ae();
	}
	/**
	* 初始化数据
	* @param dataList
	* @param level
	*/
	initData(t, e = 0, i = []) {
		const s = t.length, { ROW_KEY: o = "", DEFAULT_EXPAND_ALL: r, CELL_HEIGHT: a, SELECTABLE_METHOD: l, CHECKBOX_KEY: c, TREE_CHILDREN_KEY: f } = this.ctx.config;
		t.forEach((d, u) => {
			var y;
			f !== "children" && (d.children = d[f]);
			const x = this.resolveRowKey(d, o);
			this.itemRowKeyMap.set(d, x);
			const w = d._height || a, E = d._readonly;
			let g = !0;
			if (typeof l == "function" && (g = l), c) {
				const p = d[c];
				if (this.checkboxKeyMap.has(p)) {
					const R = this.checkboxKeyMap.get(p) || [];
					R.push(x), this.checkboxKeyMap.set(p, R);
				} else this.checkboxKeyMap.set(p, [x]);
			}
			this.selectionMap.set(x, {
				key: c ? d[c] : x,
				row: d,
				check: ((y = this.selectionMap.get(x)) == null ? void 0 : y.check) || !1
			});
			const m = r || this.expandMap.get(x) || d._expand || !1;
			this.expandMap.set(x, m), this.rowKeyMap.set(x, {
				readonly: E,
				index: u,
				rowIndex: u,
				level: e,
				height: w,
				calculatedHeight: -1,
				check: !1,
				selectable: g,
				expand: m,
				expandLazy: !1,
				hasChildren: d._hasChildren || (Array.isArray(d.children) ? d.children.length > 0 : !1),
				expandLoading: !1,
				item: d,
				parentRowKeys: i,
				parentRowKey: i[i.length - 1] || "",
				isLastChild: u === s - 1
			}), Array.isArray(d.children) && d.children.length && this.initData(d.children, e + 1, [...i, x]);
		});
	}
	/**
	*
	* @param rowKey 设置Row高度
	* @param height
	*/
	setRowHeight(t, e) {
		const i = this.rowIndexRowKeyMap.get(t);
		if (i === void 0) return;
		const s = this.rowKeyMap.get(i);
		s.height = e, s.item._height = e, this.clearBufferData();
	}
	setBatchRowHeight(t) {
		t.forEach(({ rowIndex: e, height: i }) => {
			const s = this.rowIndexRowKeyMap.get(e);
			if (s) {
				const o = this.rowKeyMap.get(s);
				o.height = i, o.item._height = i;
			}
		}), this.clearBufferData();
	}
	setBatchCalculatedRowHeight(t) {
		return t.every(({ height: i, rowIndex: s }) => this.getPositionForRowIndex(s).calculatedHeight === i) ? !1 : (t.forEach(({ rowIndex: i, height: s }) => {
			const o = this.rowIndexRowKeyMap.get(i);
			if (o) {
				const r = this.rowKeyMap.get(o), { height: a = -1 } = this.getMaxRowHeightItem(o) || {};
				r.calculatedHeight = Math.max(s, a);
			}
		}), this.clearBufferData(), this.getData(), !0);
	}
	/**
	* 获取所有行数据（平铺）
	* @returns 获取转化平铺数据
	*/
	getAllRowsData() {
		let t = [];
		const e = (i) => {
			i.forEach((s) => {
				t.push(s), Array.isArray(s.children) && e(s.children);
			});
		};
		return e(this.data), t;
	}
	generateColumns(t) {
		const e = (i) => i.map((s) => {
			var c, f, d, u, x, w, E, g;
			const o = s.children && Array.isArray(s.children) ? e(s.children) : void 0, r = {
				hide: (f = (c = this.customHeader) == null ? void 0 : c.hideData) == null ? void 0 : f[s.key],
				fixed: (u = (d = this.customHeader) == null ? void 0 : d.fixedData) == null ? void 0 : u[s.key],
				sort: (w = (x = this.customHeader) == null ? void 0 : x.sortData) == null ? void 0 : w[s.key],
				width: (g = (E = this.customHeader) == null ? void 0 : E.resizableData) == null ? void 0 : g[s.key]
			}, a = {};
			for (const [m, y] of Object.entries(r)) y !== void 0 && (a[m] = y);
			const l = o && o.every((m) => m.hide);
			return {
				...s,
				children: o,
				hide: l || (typeof s.hide == "function" ? s.hide(s) : s.hide),
				...a
			};
		});
		return e(t);
	}
	getColumns() {
		return this.generateColumns(this.columns);
	}
	setColumns(t) {
		this.columns = t, this.clearBufferData();
	}
	setData(t) {
		this.data = t, this.init();
	}
	getOriginalData() {
		return this.data;
	}
	/**
	* 统一转化数据，给画body使用，包括过滤树状等，统一入口
	* @returns
	*/
	getData() {
		if (this.bufferData.length > 0) return {
			data: this.bufferData,
			sumHeight: this.sumHeight,
			positions: this.positions
		};
		let t = [], e = 0;
		this.sumHeight = 0, this.positions = [];
		const i = (o) => {
			o?.forEach((r) => {
				t.push(r);
				const a = this.itemRowKeyMap.get(r), { expand: l, hasChildren: c, height: f, calculatedHeight: d } = this.rowKeyMap.get(a), u = this.sumHeight, x = Math.max(d, f);
				this.sumHeight += x, this.rowIndexRowKeyMap.set(e, a), this.rowKeyRowIndexMap.set(a, e), this.positions.push({
					top: u,
					height: x,
					bottom: this.sumHeight,
					calculatedHeight: d
				}), e += 1, l && c && i(r.children);
			});
		};
		this.rowIndexRowKeyMap.clear(), this.rowKeyRowIndexMap.clear();
		let s = this.data;
		if (typeof this.filterMethod == "function" && (s = this.filterMethod(s)), this.sortState.size) {
			const o = Array.from(this.sortState.entries()).sort((r, a) => r[1].timestamp - a[1].timestamp);
			s = this.sortDataRecursive(s, o);
		}
		return i(s), this.bufferData = t, {
			data: t,
			sumHeight: this.sumHeight,
			positions: this.positions
		};
	}
	setFooterData(t) {
		this.footerData = t;
	}
	getFooterData() {
		return this.footerData;
	}
	/**
	* 设置过滤方法
	*/
	setFilterMethod(t) {
		this.filterMethod = t;
	}
	/**
	* 清空过滤方法
	*/
	clearFilterMethod() {
		this.filterMethod = void 0;
	}
	/**
	* 获取排序状态
	*/
	getSortState(t) {
		return this.sortState.get(t) || {
			direction: "none",
			timestamp: 0
		};
	}
	/**
	* 设置排序状态
	*/
	setSortState(t, e) {
		const i = Date.now();
		this.ctx.config.SORT_STRICTLY && this.sortState.clear(), e === "none" ? this.sortState.delete(t) : this.sortState.set(t, {
			direction: e,
			timestamp: i
		}), this.ctx.emit("sortChange", this.sortState), this.clearBufferData(), this.ctx.emit("draw");
	}
	/**
	* 清除所有排序状态
	*/
	clearSort() {
		this.sortState.clear(), this.ctx.emit("sortChange", this.sortState), this.clearBufferData(), this.ctx.emit("draw");
	}
	/**
	* 递归排序方法，支持树形数据
	* @param data 要排序的数据
	* @param sortedEntries 排序条目，按时间戳排序
	* @returns 排序后的数据
	*/
	sortDataRecursive(t, e) {
		let i = [...t];
		for (const [s, { direction: o }] of e) {
			if (o === "none") continue;
			const r = this.getColumnByKey(s);
			!r || !r.column.sortBy || (i = this.applySingleColumnSort(i, s, o, r.column.sortBy));
		}
		return i.map((s) => (s.children && Array.isArray(s.children) && (s.children = this.sortDataRecursive(s.children, e)), s));
	}
	/**
	* 对数组进行单列排序
	* @param data 要排序的数据
	* @param key 排序的列键
	* @param direction 排序方向
	* @param sortBy 排序类型
	* @returns 排序后的数据
	*/
	applySingleColumnSort(t, e, i, s) {
		return t.sort((o, r) => {
			const a = o[e], l = r[e];
			let c = 0;
			if (typeof s == "function") c = s(o, r);
			else if (s === "number") c = (Number(a) || 0) - (Number(l) || 0);
			else if (s === "string") {
				const f = String(a || ""), d = String(l || "");
				c = f.localeCompare(d);
			} else s === "date" && (c = Be(a, l));
			return i === "asc" ? c : -c;
		});
	}
	/**
	* 根据rowKey,控制指定展开行
	* @param rowKey
	* @param expand
	*/
	expandItem(t, e = !1) {
		const i = this.rowKeyMap.get(t);
		i.expand = e, this.expandMap.set(t, e), this.clearBufferData(), this.ctx.emit("draw");
	}
	setExpandRowKeys(t, e = !0) {
		this.expandMap.clear(), t.forEach((i) => {
			const s = this.rowKeyMap.get(i);
			this.expandMap.set(i, e), s.expand = e;
		}), this.clearBufferData(), this.ctx.emit("draw");
	}
	getExpandRowKeys() {
		let t = [];
		return this.rowKeyMap.forEach((e, i) => {
			e.expand && t.push(i);
		}), t;
	}
	expandAll(t) {
		this.expandMap.clear(), this.rowKeyMap.forEach((e, i) => {
			e.expand = t, this.expandMap.set(i, t);
		}), this.clearBufferData(), this.ctx.emit("draw");
	}
	expandLoading(t, e = !1) {
		const i = this.rowKeyMap.get(t);
		i.expandLoading = e, this.clearBufferData(), this.ctx.emit("draw");
	}
	setExpandChildren(t, e) {
		const i = this.rowKeyMap.get(t);
		i.expand = !0, this.expandMap.set(t, !0), i.expandLazy = !0, i.item.children = e, this.initData(i.item.children, i.level + 1), this.clearBufferData();
	}
	getIsExpandLoading(t) {
		return this.rowKeyMap.get(t).expandLoading;
	}
	getIsExpandLazy(t) {
		return this.rowKeyMap.get(t).expandLazy;
	}
	/**
	* 根据rowKey获取是否展开
	* @param rowKey
	* @returns
	*/
	getIsExpand(t) {
		return this.rowKeyMap.get(t).expand;
	}
	/**
	* 根据rowKey获取行数据
	* @param rowKey
	* @returns
	*/
	getRowForRowKey(t) {
		return this.rowKeyMap.get(t);
	}
	getRowForRowIndex(t) {
		const e = this.getRowKeyForRowIndex(t);
		return this.rowKeyMap.get(e);
	}
	/**
	* 根据rowIndex获取rowKey
	* @param rowKey
	* @returns
	*/
	getRowKeyForRowIndex(t) {
		return this.rowIndexRowKeyMap.get(t) || "";
	}
	getRowKeyByItem(t) {
		return this.itemRowKeyMap.get(t);
	}
	getRowIndexForRowKey(t) {
		return this.rowKeyRowIndexMap.get(t);
	}
	/**
	* 根据rowIndex和colIndex获取单元格数据
	* @param rowIndex
	* @param colIndex
	* @returns
	*/
	getItemValueForRowIndexAndColIndex(t, e) {
		if (!(this.rowIndexRowKeyMap.has(t) && this.colIndexKeyMap.get(e))) return null;
		const s = this.rowIndexRowKeyMap.get(t), o = this.colIndexKeyMap.get(e);
		return s === void 0 || o === void 0 ? null : {
			rowKey: s,
			key: o,
			value: this.getItemValue(s, o)
		};
	}
	/**
	* 根据rowKey和key获取单元格数据
	* @param rowKey
	* @param key
	* @returns
	*/
	getItemValue(t, e) {
		const i = this.rowKeyMap.get(t);
		return i && i.item ? i.item[e] === void 0 ? null : i.item[e] : null;
	}
	/**
	* 批量设置数据
	* @param list
	* @param history
	* @returns
	*/
	async batchSetItemValue(t, e = !1, i = !0, s = "none") {
		var w, E;
		let o = [], r = i;
		const a = /* @__PURE__ */ new Map(), l = [];
		let c = [];
		for (const g of t) {
			const { rowKey: m, key: y } = g;
			let p = g.value;
			const R = this.getRowDataItemForRowKey(m), C = this.getItemValue(m, y), b = this.getVirtualBodyCellByKey(m, y), _ = {
				...g,
				oldValue: C,
				row: R
			};
			if ((b == null ? void 0 : b.type) === "number") if ([
				"",
				void 0,
				null
			].includes(p)) p = null;
			else if (/^-?\d+(\.\d+)?$/.test(String(p))) {
				const T = Xe(p);
				if (typeof b.precision == "number" && b.precision >= 0 && T > b.precision) {
					const v = 10 ** b.precision;
					p = Math.round(Number(p) * v) / v;
					const I = this.ctx.locale.getText("numberTruncated", { precision: b.precision });
					l.push({
						..._,
						column: b == null ? void 0 : b.column,
						code: "ERR_NUMBER_PRECISION",
						message: I
					});
				} else p = Number(p);
				if (typeof b.min == "number" && Number(p) < b.min) {
					const v = this.ctx.locale.getText("numberMin", { min: b.min });
					p = b.min, l.push({
						..._,
						column: b == null ? void 0 : b.column,
						code: "ERR_NUMBER_MIN",
						message: v
					});
				} else if (typeof b.max == "number" && Number(p) > b.max) {
					const v = this.ctx.locale.getText("numberMax", { max: b.max });
					p = b.max, l.push({
						..._,
						column: b == null ? void 0 : b.column,
						code: "ERR_NUMBER_MAX",
						message: v
					});
				}
			} else p = C, l.push({
				..._,
				column: b == null ? void 0 : b.column,
				code: "ERR_INVALID_NUMBER",
				message: this.ctx.locale.getText("invalidNumber")
			});
			else if ((b == null ? void 0 : b.editorType) === "text" && typeof b.maxlength == "number" && String(p).length > b.maxlength) {
				p = String(p).slice(0, b.maxlength);
				const T = this.ctx.locale.getText("stringMaxlength", { maxlength: b.maxlength });
				l.push({
					..._,
					column: b == null ? void 0 : b.column,
					code: "ERR_STRING_MAXLENGTH",
					message: T
				});
			}
			typeof ((w = b == null ? void 0 : b.column) == null ? void 0 : w.canValueChange) == "function" && (await b.column.canValueChange({
				..._,
				value: p
			}) || (p = C)), typeof ((E = b == null ? void 0 : b.column) == null ? void 0 : E.beforeValueChange) == "function" && (p = (await b.column.beforeValueChange({
				..._,
				value: p
			})).value), p !== C && c.push({
				...g,
				value: p,
				oldValue: C,
				row: R
			});
		}
		if (l.length) {
			const g = {
				code: "ERR_BATCH_SET_ITEM_VALUE",
				message: this.ctx.locale.getText("batchSetItemValueError"),
				data: l
			};
			this.ctx.emit("error", g);
		}
		if (!c.length) return;
		const { BEFORE_VALUE_CHANGE_METHOD: f } = this.ctx.config;
		s === "none" && typeof f == "function" && (c = await f(c), r = !1);
		const d = [];
		c.forEach((g) => {
			const { value: m, rowKey: y, key: p, row: R } = g, C = this.getItemValue(y, p);
			a.set(y, R), this.setItemValue(y, p, m, !1, !1, !1, r), d.push(this.getValidator(g.rowKey, g.key)), o.push({
				rowKey: y,
				key: p,
				oldValue: C,
				newValue: m
			});
		});
		const u = Array.from(a.values());
		await Promise.all(d), this.validationErrorMap.size === 0 && this.changedDataMap.size > 0 && this.ctx.emit("validateChangedData", this.getChangedData());
		const x = c.map((g) => {
			var C;
			const m = !!this.getValidationError(g.rowKey, g.key).length, { rowKey: y, key: p } = g, R = this.getVirtualBodyCellByKey(y, p);
			return typeof ((C = R == null ? void 0 : R.column) == null ? void 0 : C.valueChange) == "function" && R.column.valueChange({
				...g,
				errorTip: m
			}), {
				...g,
				errorTip: m
			};
		});
		this.ctx.emit("change", x, u), e && this.ctx.history.pushState({
			changeList: o,
			scrollX: this.ctx.scrollX,
			scrollY: this.ctx.scrollY,
			type: "multiple"
		}), this.ctx.emit("draw");
	}
	/**
	*设置单一数据
	* @param rowKey
	* @param key
	* @param value
	* @param history 是否添加历史记录
	* @param reDraw 是否刷新重绘
	* @param isEditor 是否是编辑器
	* @param checkReadonly 是否检查只读
	* @returns
	*/
	async setItemValue(t, e, i, s = !1, o = !1, r = !1, a = !0) {
		if (!this.rowKeyMap.has(t)) return {};
		const { item: l } = this.rowKeyMap.get(t);
		let c = l[e], f = i;
		if (a && this.ctx.database.getReadonly(t, e)) return {
			oldValue: c,
			newValue: c
		};
		l[e] !== null && typeof l[e] == "object" && (c = JSON.parse(JSON.stringify(l[e])));
		const d = `${t}​_${e}`;
		this.originalDataMap.has(d) || this.originalDataMap.set(d, c);
		const u = this.originalDataMap.get(d), x = this.getRowDataItemForRowKey(t), w = {
			rowKey: t,
			key: e,
			value: f,
			oldValue: c,
			row: x
		};
		if (r) {
			if (f === c) return {
				oldValue: c,
				newValue: c
			};
			this.batchSetItemValue([w], s, !1), this.ctx.emit("editChange", {
				...w,
				originalValue: u
			});
		} else this.changedDataMap.set(d, f), l[e] = f;
		return this.ctx.hasEvent("iterationChange") && this.ctx.emit("iterationChange", {
			...w,
			originalValue: u
		}), o && this.ctx.emit("draw"), {
			oldValue: c,
			newValue: f
		};
	}
	/**
	* 根据rowKey 获取行数据
	* @param rowKey
	* @returns
	*/
	getRowDataItemForRowKey(t) {
		if (!this.rowKeyMap.has(t)) return {};
		const { item: e } = this.rowKeyMap.get(t);
		return e;
	}
	/**
	*
	* @param rowKey 设置选中状态ByCheckboxKey，用于合并Checkbox单元格时声明唯一key
	* @param check
	*/
	setRowSelectionByCheckboxKey(t, e) {
		const { CHECKBOX_KEY: i } = this.ctx.config;
		if (i) {
			if (!this.rowKeyMap.has(t)) return !1;
			const { item: s } = this.rowKeyMap.get(t), o = s[i];
			this.checkboxKeyMap.has(o) && (this.checkboxKeyMap.get(o) || []).forEach((a) => {
				const l = this.selectionMap.get(a);
				l && (l.check = e);
			});
		}
	}
	/**
	* 根据rowKey 取反选中
	* @param rowKey
	*/
	toggleRowSelection(t, e) {
		const i = this.rowKeyMap.get(t), s = this.selectionMap.get(t);
		if (!s) return;
		e === "selection-tree" || e === "tree-selection" ? this.toggleTreeSelection(t) : (s.check = !s.check, this.setRowSelectionByCheckboxKey(t, s.check)), this.ctx.emit("toggleRowSelection", i);
		const o = this.getSelectionRows();
		this.ctx.emit("selectionChange", o), this.bufferCheckState.buffer = !1, this.ctx.emit("draw");
	}
	toggleTreeSelection(t) {
		const e = this.getTreeSelectionState(t), i = this.ctx.config.TREE_SELECT_MODE;
		if (i === "auto") e.checked && !e.indeterminate ? (this.clearTreeSelectionRecursive(t), this.setRowSelection(t, !1, !1)) : (this.selectTreeSelectionRecursive(t), this.setRowSelection(t, !0, !1));
		else if (i === "cautious") e.checked && !e.indeterminate ? (this.clearTreeSelectionRecursive(t), this.setRowSelection(t, !1, !1)) : (this.selectTreeSelectionRecursive(t), this.setRowSelection(t, !0, !1));
		else if (i === "strictly") {
			const s = this.selectionMap.get(t);
			s && (s.check = !s.check, this.setRowSelectionByCheckboxKey(t, s.check));
		}
		this.ctx.emit("selectionChange", this.getSelectionRows()), this.ctx.emit("draw");
	}
	selectTreeSelectionRecursive(t) {
		this.getTreeChildren(t).forEach((i) => {
			this.setRowSelectionByParent(i, !0), this.selectTreeSelectionRecursive(i);
		});
	}
	clearTreeSelectionRecursive(t) {
		this.getTreeChildren(t).forEach((i) => {
			this.setRowSelectionByParent(i, !1), this.clearTreeSelectionRecursive(i);
		});
	}
	updateParentTreeSelection(t) {
		const e = this.getTreeParent(t);
		if (!e) return;
		const s = this.getTreeChildren(e).map((c) => this.selectionMap.get(c)), o = s.filter((c) => c == null ? void 0 : c.check).length, r = s.length;
		let a = !1;
		r > 0 && (o === 0 ? a = !1 : o === r || this.ctx.config.TREE_SELECT_MODE === "auto" ? a = !0 : this.ctx.config.TREE_SELECT_MODE === "cautious" && (a = !1));
		const l = this.selectionMap.get(e);
		l && l.check !== a && (l.check = a, this.setRowSelectionByCheckboxKey(e, a), this.updateParentTreeSelection(e));
	}
	/**
	* 根据rowKey 设置选中状态
	* @param rowKey
	*/
	setRowSelection(t, e, i = !0) {
		const s = this.selectionMap.get(t);
		s && (s.check = e, this.setRowSelectionByCheckboxKey(t, s.check), this.ctx.emit("setRowSelection", e, s.row), (this.ctx.config.TREE_SELECT_MODE === "auto" || this.ctx.config.TREE_SELECT_MODE === "cautious") && this.updateParentTreeSelection(t), i && (this.bufferCheckState.buffer = !1, this.ctx.emit("draw")));
	}
	setRowSelectionByParent(t, e) {
		const i = this.selectionMap.get(t);
		i && (i.check = e, this.setRowSelectionByCheckboxKey(t, i.check));
	}
	getSelectionRows() {
		let t = [];
		return this.selectionMap.forEach((e) => {
			e.check && t.push(e.row);
		}), t;
	}
	/**
	* 根据rowKey 获取选中状态
	* @param rowKey
	*/
	getRowSelection(t) {
		const e = this.selectionMap.get(t);
		return e ? e.check : !1;
	}
	getTreeSelectionState(t) {
		if (!this.getRowForRowKey(t)) return {
			checked: !1,
			indeterminate: !1
		};
		const i = this.selectionMap.get(t), s = (i == null ? void 0 : i.check) || !1;
		if (this.getTreeChildren(t).length === 0) return {
			checked: s,
			indeterminate: !1
		};
		let r = !1, a = s;
		if (this.ctx.config.TREE_SELECT_MODE === "auto") {
			const c = (g) => {
				const m = this.getTreeChildren(g);
				let y = [];
				for (const p of m) y.push(p), y.push(...c(p));
				return y;
			}, d = c(t).map((g) => this.selectionMap.get(g)), u = d.filter((g) => g == null ? void 0 : g.check).length, x = d.length, w = u > 0;
			r = w && !(u === x), a = s || w, s && x > 0 && u === 0 && (a = !1, r = !1);
		} else if (this.ctx.config.TREE_SELECT_MODE === "cautious") {
			const c = (g) => {
				const m = this.getTreeChildren(g);
				let y = [];
				for (const p of m) y.push(p), y.push(...c(p));
				return y;
			}, d = c(t).map((g) => this.selectionMap.get(g)), u = d.filter((g) => g == null ? void 0 : g.check).length, x = d.length, w = u > 0, E = u === x;
			r = w && !E, a = s || E, s && x > 0 && u === 0 && (a = !1, r = !1);
		} else this.ctx.config.TREE_SELECT_MODE === "strictly" && (r = !1, a = s);
		return {
			checked: a,
			indeterminate: r
		};
	}
	getTreeChildren(t) {
		const e = this.getRowForRowKey(t);
		if (!e || !e.item || !e.item.children) return [];
		const i = [], s = (o) => {
			for (const r of o) {
				const a = this.getRowKeyByItem(r);
				a && i.push(a), r.children && r.children.length > 0 && s(r.children);
			}
		};
		return s(e.item.children), i;
	}
	getTreeParent(t) {
		const e = (i, s) => {
			for (const o of i) {
				const r = this.getRowKeyByItem(o);
				if (o.children) for (const a of o.children) {
					if (this.getRowKeyByItem(a) === s) return r;
					const c = e(o.children, s);
					if (c) return c;
				}
			}
			return null;
		};
		return e(this.data, t);
	}
	/**
	* 根据rowKey 获取选中状态
	* @param rowKey
	*/
	getRowSelectable(t) {
		const { selectable: e, item: i, rowIndex: s } = this.rowKeyMap.get(t);
		return typeof e == "function" ? e({
			row: i,
			rowIndex: s
		}) : e;
	}
	/**
	* 全选
	* @param rowKey
	*/
	toggleAllSelection() {
		this.ctx.config.TREE_SELECT_MODE === "auto" || this.ctx.config.TREE_SELECT_MODE === "cautious" ? this.rowKeyMap.forEach((i, s) => {
			let o = i.selectable;
			if (typeof o == "function" && (o = o({
				row: i.item,
				rowIndex: i.rowIndex
			})), o) {
				const r = this.selectionMap.get(s);
				r && (r.check = !0, this.setRowSelectionByCheckboxKey(s, !0));
			}
		}) : this.rowKeyMap.forEach((i, s) => {
			let o = i.selectable;
			typeof o == "function" && (o = o({
				row: i.item,
				rowIndex: i.rowIndex
			})), o && this.setRowSelection(s, !0, !1);
		});
		const e = this.getSelectionRows();
		this.ctx.emit("toggleAllSelection", e), this.ctx.emit("selectionChange", e), this.bufferCheckState.buffer = !1, this.ctx.emit("draw");
	}
	/**
	* 清除选中
	* @param rowKey
	*/
	clearSelection(t = !1) {
		const e = this.ctx.config.TREE_SELECT_MODE === "auto" || this.ctx.config.TREE_SELECT_MODE === "cautious";
		t ? e ? this.rowKeyMap.forEach((s, o) => {
			const r = this.selectionMap.get(o);
			r && (r.check = !1, this.setRowSelectionByCheckboxKey(o, !1));
		}) : this.rowKeyMap.forEach((s, o) => {
			this.setRowSelection(o, !1, !1);
		}) : (this.selectionMap.clear(), this.rowKeyMap.forEach((s, o) => {
			this.selectionMap.set(o, {
				check: !1,
				row: s.item,
				key: o
			});
		}));
		const i = this.getSelectionRows();
		this.ctx.emit("clearSelection"), this.ctx.emit("selectionChange", i), this.bufferCheckState.buffer = !1, this.ctx.emit("draw");
	}
	/**
	* 获取选中状态，表头用
	* @param rowKey
	*/
	getCheckedState() {
		const { buffer: t, ...e } = this.bufferCheckState;
		if (t) return e;
		const i = this.rowKeyMap.size;
		let s = 0, o = 0;
		const r = this.selectionMap.size, a = Array.from(this.selectionMap.values()).some((u) => u.check);
		this.rowKeyMap.forEach((u, x) => {
			var E;
			(E = this.selectionMap.get(x)) != null && E.check && (s += 1);
			let w = u.selectable;
			typeof w == "function" && (w = w({
				row: u.item,
				rowIndex: u.rowIndex
			})), w && (o += 1);
		});
		const c = o && o > s && s > 0 || r > i && s === 0 && a, f = o !== 0, d = !!o && o === s;
		return this.bufferCheckState = {
			buffer: !0,
			check: d,
			indeterminate: c,
			selectable: f
		}, {
			check: d,
			indeterminate: c,
			selectable: f
		};
	}
	/**
	* 更新列索引
	* @param list 表头末级列表
	*/
	updateColIndexKeyMap(t = []) {
		this.colIndexKeyMap.clear(), t.forEach((e) => {
			this.colIndexKeyMap.set(e.colIndex, e.key);
		});
	}
	getColumnByColIndex(t) {
		var i;
		const e = this.colIndexKeyMap.get(t);
		if (e && this.headerMap.has(e)) return (i = this.headerMap.get(e)) == null ? void 0 : i.column;
	}
	getColumnByKey(t) {
		const e = this.headerMap.get(t);
		if (e) return e;
	}
	getColIndexForKey(t) {
		var e;
		if (t && this.headerMap.has(t)) return (e = this.headerMap.get(t)) == null ? void 0 : e.colIndex;
	}
	getColHeaderByIndex(t) {
		const e = this.colIndexKeyMap.get(t);
		if (e && this.headerMap.has(e)) return this.headerMap.get(e);
	}
	/**
	* 获取以改变数据
	*/
	getChangedData() {
		let t = [];
		return this.changedDataMap.forEach((e, i) => {
			const s = this.originalDataMap.get(i), o = i.split("​_")[0], r = i.split("​_")[1];
			s !== e && t.push({
				rowKey: o,
				colKey: r,
				originalValue: s,
				row: this.ctx.database.getRowDataItemForRowKey(o),
				value: e
			});
		}), t;
	}
	getChangedRows() {
		const t = /* @__PURE__ */ new Set();
		this.changedDataMap.forEach((i, s) => {
			const o = this.originalDataMap.get(s), r = s.split("​_")[0];
			o !== i && t.add(r);
		});
		let e = [];
		return t.forEach((i) => {
			e.push(this.ctx.database.getRowDataItemForRowKey(i));
		}), e;
	}
	/**
	* 获取改变值是否已经改变
	* @param rowKey
	* @param key
	* @returns
	*/
	isHasChangedData(t, e) {
		const i = `${t}​_${e}`;
		if (!this.changedDataMap.has(i)) return !1;
		return this.originalDataMap.get(i) !== this.changedDataMap.get(i);
	}
	getPositionForRowIndex(t) {
		return t < this.positions.length ? this.positions[t] : {
			height: 0,
			top: 0,
			bottom: 0,
			calculatedHeight: 0
		};
	}
	setHeader(t, e) {
		return t ? (this.headerMap.set(t, e), !0) : !1;
	}
	getReadonly(t, e) {
		var c;
		const { DISABLED: i } = this.ctx.config;
		if (i) return !0;
		const s = this.rowKeyMap.get(t), o = this.headerMap.get(e);
		if (!s || !o) return !0;
		const r = s.readonly, a = o.readonly, { BODY_CELL_READONLY_METHOD: l } = this.ctx.config;
		if (typeof l == "function" && o) {
			const d = l({
				row: s.item,
				rowIndex: s.rowIndex,
				colIndex: o.colIndex,
				column: o.column,
				value: this.getItemValue(t, e)
			});
			if (d !== void 0) return d;
		}
		if (typeof ((c = o.column) == null ? void 0 : c.readonly) == "function") {
			const f = o.column.readonly({
				row: s.item,
				rowIndex: s.rowIndex,
				colIndex: o.colIndex,
				column: o.column,
				value: this.getItemValue(t, e)
			});
			if (f !== void 0) return f;
		}
		return a || r;
	}
	clearValidate() {
		this.validationErrorMap.clear();
	}
	hasValidationError() {
		return this.validationErrorMap.size !== 0;
	}
	getValidator(t, e) {
		const i = this.ctx.database.getReadonly(t, e), { ENABLE_READONLY_VALIDATE: s } = this.ctx.config;
		return !s && i ? new Promise((o) => {
			o([]);
		}) : new Promise((o) => {
			const r = this.rowKeyMap.get(t), a = this.headerMap.get(e), { BODY_CELL_RULES_METHOD: l } = this.ctx.config;
			if (r === void 0 || a === void 0) return o([]);
			const c = a.column;
			let f = c.rules;
			if (typeof l == "function") {
				const u = l({
					row: r.item,
					rowIndex: r.rowIndex,
					colIndex: a.colIndex,
					column: c,
					value: this.getItemValue(t, e)
				});
				u && (f = u);
			}
			if (f) {
				const d = {
					row: r.item,
					rowIndex: r.rowIndex,
					colIndex: a.colIndex,
					column: c,
					key: e,
					rowKey: t,
					value: this.getItemValue(t, e),
					field: e,
					fieldValue: this.getItemValue(t, e)
				}, x = new Oe(f).validate(d);
				x.length ? this.setValidationError(t, e, x) : this.clearValidationError(t, e), o(x);
			} else this.clearValidationError(t, e), o([]);
		});
	}
	getHeightByRowIndexRowSpan(t, e) {
		let i = 0;
		for (let s = 0; s < e; s++) {
			const o = this.positions[t + s];
			o && (i += o.height);
		}
		return i;
	}
	getSpanInfo(t) {
		const { rowIndex: e, key: i, rowKey: s, row: o, value: r, colIndex: a, relationRowKeys: l, relationColKeys: c, rowspan: f, height: d, width: u, colspan: x, mergeRow: w, mergeCol: E } = t;
		if (f === 1 && x === 1) return {
			xArr: [a, a],
			yArr: [e, e],
			rowspan: f,
			colspan: x,
			height: d,
			width: u,
			offsetTop: 0,
			offsetLeft: 0,
			dataList: [{
				rowKey: s,
				key: i,
				row: o,
				value: r
			}]
		};
		let g = e, m = e, y = a, p = a, R = [], C = 0, b = 0, _ = 0, T = 0;
		if (f !== 1 && w) {
			T = u;
			const v = l.reduce((I, S) => {
				return `${I}${this.getItemValue(s, S) ?? ""}`;
			}, "");
			for (let I = e - 1; I >= 0; I--) {
				const S = this.rowIndexRowKeyMap.get(I) || "";
				if (v === l.reduce((M, L) => {
					return `${M}${this.getItemValue(S, L) ?? ""}`;
				}, "")) g = I;
				else break;
			}
			for (let I = e; I <= this.ctx.maxRowIndex; I++) {
				const S = this.rowIndexRowKeyMap.get(I) || "";
				if (v === l.reduce((M, L) => {
					return `${M}${this.getItemValue(S, L) ?? ""}`;
				}, "")) m = I;
				else break;
			}
			for (let I = g; I < e; I++) {
				const { height: S } = this.positions[I];
				C += S;
			}
			for (let I = g; I <= m; I++) {
				const { height: S } = this.positions[I];
				_ += S;
				const O = this.rowIndexRowKeyMap.get(I) || "", { item: M } = this.rowKeyMap.get(O), L = this.getItemValue(O, i);
				R.push({
					rowKey: O,
					key: i,
					value: L,
					row: M
				});
			}
		}
		if (x !== 1 && E) {
			_ = d;
			for (let v = a - 1; v >= 0; v--) {
				const I = this.getColumnByColIndex(v);
				if (!I) break;
				if (this.getItemValue(s, i) === this.getItemValue(s, I.key) && c.includes(I.key)) y = v;
				else break;
			}
			for (let v = a; v <= this.ctx.maxColIndex; v++) {
				const I = this.getColumnByColIndex(v);
				if (!I) break;
				if (this.getItemValue(s, i) === this.getItemValue(s, I.key) && c.includes(I.key)) p = v;
				else break;
			}
			for (let v = y; v < a; v++) {
				const I = this.getColumnByColIndex(v);
				if (!I) break;
				b += I.width || 100;
			}
			for (let v = y; v <= p; v++) {
				const I = this.getColumnByColIndex(v);
				if (!I) break;
				T += I.width || 100, R.push({
					rowKey: s,
					key: I.key,
					value: this.getItemValue(s, I.key),
					row: o
				});
			}
		}
		return {
			xArr: [y, p],
			yArr: [g, m],
			rowspan: f,
			colspan: x,
			height: _,
			width: T,
			offsetTop: C,
			offsetLeft: b,
			dataList: R
		};
	}
	setValidationErrorByRowKey(t, e, i) {
		const s = `${t}​_${e}`, o = this.getRowForRowKey(t), r = o == null ? void 0 : o.rowIndex, a = this.getColumnByKey(e);
		if (!t || !a || !o) return;
		const l = this.getItemValue(t, e), c = [{
			key: e,
			rowKey: t,
			rowIndex: r,
			colIndex: a.colIndex,
			column: a.column,
			row: o,
			value: l,
			message: i,
			field: e,
			fieldValue: l
		}];
		this.validationErrorMap.set(s, c);
	}
	setValidationError(t, e, i) {
		const s = `${t}​_${e}`;
		this.validationErrorMap.set(s, i);
	}
	clearValidationError(t, e) {
		const i = `${t}​_${e}`;
		this.validationErrorMap.has(i) && this.validationErrorMap.delete(i);
	}
	getValidationError(t, e) {
		const i = `${t}​_${e}`;
		return this.validationErrorMap.get(i) || [];
	}
	getVirtualBodyCell(t, e, i = !0) {
		const s = this.getColumnByColIndex(e), o = this.getRowForRowIndex(t);
		return !s || !o ? void 0 : new ue(this.ctx, t, e, 0, 0, 0, 0, s, o.item, "body", i);
	}
	getVirtualBodyCellByKey(t, e) {
		const i = this.getRowIndexForRowKey(t), s = this.getColIndexForKey(e);
		if (!(i === void 0 || s === void 0)) return this.getVirtualBodyCell(i, s);
	}
	hasMergeCell(t, e) {
		let i = !1;
		for (let s = e[0]; s <= e[1]; s++) for (let o = t[0]; o <= t[1]; o++) {
			const r = this.getVirtualBodyCell(s, o);
			if (r && (r.rowspan !== 1 || r.colspan !== 1)) {
				i = !0;
				break;
			}
		}
		return i;
	}
	/**
	* 计算树形数据的最大深度
	* @param data 树形数据
	* @param currentDepth 当前深度
	* @returns 最大深度
	*/
	calculateMaxTreeDepth(t, e = 0) {
		let i = e;
		return t.forEach((s) => {
			if (Array.isArray(s.children) && s.children.length > 0) {
				const o = this.calculateMaxTreeDepth(s.children, e + 1);
				i = Math.max(i, o);
			}
		}), i;
	}
	setOverlayerAutoHeightMap(t) {
		this.overlayerAutoHeightMap = t;
	}
	getOverlayerAutoHeightMap() {
		return this.overlayerAutoHeightMap;
	}
	getOverlayerAutoHeight(t, e) {
		const i = `${t}​_${e}`;
		return this.overlayerAutoHeightMap.get(i) || 0;
	}
	setCustomHeader(t, e = !1) {
		if ([
			"fixedData",
			"sortData",
			"hideData",
			"resizableData"
		].forEach((i) => {
			const s = t[i];
			s !== void 0 && (this.customHeader[i] = s);
		}), !e) {
			const i = this.clearCustomHeaderInvalidValues(this.columns);
			this.ctx.emit("customHeaderChange", i);
		}
	}
	resetCustomHeader() {
		this.customHeader = {}, this.ctx.emit("resetHeader"), this.ctx.emit("customHeaderChange", this.customHeader);
	}
	getCustomHeader() {
		return this.customHeader;
	}
	setCustomHeaderResizableData(t, e) {
		let { resizableData: i = {} } = this.customHeader;
		i[t] = e, this.setCustomHeader({ resizableData: i });
	}
	setCustomHeaderHideData(t, e) {
		let { hideData: i = {} } = this.customHeader;
		t.forEach((s) => {
			i[s] = e;
		}), this.setCustomHeader({ hideData: i }), this.ctx.emit("resetHeader");
	}
	setCustomHeaderFixedData(t, e) {
		let { fixedData: i = {} } = this.customHeader;
		t.forEach((s) => {
			i[s] = e;
		}), this.setCustomHeader({ fixedData: i }), this.ctx.emit("resetHeader");
	}
	clearCustomHeaderInvalidValues(t) {
		const e = (s, o = {}) => {
			s.forEach((r) => {
				r.children && r.children.length > 0 && e(r.children, o);
				const a = (l, c) => {
					var d, u;
					const f = (d = this.customHeader[l]) == null ? void 0 : d[r.key];
					f !== void 0 && f !== c && (o[l] || (o[l] = {}), o[l][r.key] = f, l === "fixedData" && !f && !c && ((u = o[l]) == null || delete u[r.key]));
				};
				a("fixedData", r.fixed), a("sortData", r.sort), a("hideData", r.hide), a("resizableData", r.width);
			});
		};
		let i = {};
		return e(t, i), i;
	}
	setMaxRowHeightItem(t, e, i) {
		this.maxRowHeightCellMap.set(t, {
			key: e,
			height: i
		});
	}
	getMaxRowHeightItem(t) {
		return this.maxRowHeightCellMap.get(t);
	}
	clearChangeData() {
		this.changedDataMap.clear();
	}
};
var qe = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "history", []);
		n(this, "historyIndex", -1);
		this.ctx = t, this.init();
	}
	init() {
		this.ctx.on("keydown", (t) => {
			if (!this.ctx.editing) {
				if (t.ctrlKey && !t.shiftKey && t.code === "KeyZ" || t.metaKey && !t.shiftKey && t.code === "KeyZ") {
					t.preventDefault(), this.ctx.clearSelector(), this.ctx.clearAutofill(), this.backState();
					return;
				}
				if (t.ctrlKey && t.code === "KeyY" || t.ctrlKey && t.shiftKey && t.code === "KeyZ" || t.metaKey && t.shiftKey && t.code === "KeyZ") {
					t.preventDefault(), this.ctx.clearSelector(), this.ctx.clearAutofill(), this.forwardState();
					return;
				}
			}
		});
	}
	pushState(t) {
		const { HISTORY_NUM: e = 0, ENABLE_HISTORY: i } = this.ctx.config;
		i && (this.history.push(t), this.history.length > e && this.history.splice(0, 1), this.historyIndex = this.history.length - 1);
	}
	backState() {
		if (this.historyIndex >= 0) {
			const { changeList: t, scrollX: e, scrollY: i } = this.history[this.historyIndex], s = t.map((o) => ({
				rowKey: o.rowKey,
				key: o.key,
				value: o.oldValue,
				row: {}
			}));
			this.ctx.setScroll(e, i), this.ctx.database.batchSetItemValue(s, !1, !1, "back"), this.historyIndex -= 1;
		}
	}
	forwardState() {
		if (this.historyIndex < this.history.length - 1) {
			this.historyIndex += 1;
			const { changeList: t } = this.history[this.historyIndex], e = t.map((i) => ({
				rowKey: i.rowKey,
				key: i.key,
				value: i.newValue,
				row: {}
			}));
			this.ctx.database.batchSetItemValue(e, !1, !1, "forward");
		}
	}
	clear() {
		this.history = [], this.historyIndex = -1;
	}
};
var Ze = class {
	constructor(t) {
		n(this, "eventTasks", /* @__PURE__ */ new Set());
		n(this, "ctx");
		this.ctx = t, this.init();
	}
	init() {
		this.bind(window, "resize", this.handleResize.bind(this)), this.bind(window, "mouseup", this.handleMouseUp.bind(this)), this.bind(window, "mousemove", this.handleMousemove.bind(this)), this.bind(window, "blur", this.handleOutsideMousedown.bind(this)), this.bind(window, "mousedown", this.handleOutsideMousedown.bind(this)), this.bind(this.ctx.stageElement, "click", this.handleClick.bind(this)), this.bind(window, "keydown", this.handleKeydown.bind(this)), this.bind(this.ctx.stageElement, "wheel", this.handleWheel.bind(this), { passive: !1 }), this.bind(this.ctx.stageElement, "touchstart", this.handleTouchstart.bind(this), { passive: !1 }), this.bind(this.ctx.stageElement, "touchend", this.handleTouchend.bind(this)), this.bind(this.ctx.stageElement, "touchmove", this.handleTouchmove.bind(this), { passive: !1 }), this.bind(this.ctx.stageElement, "contextmenu", this.handleContextMenu.bind(this)), this.bind(this.ctx.stageElement, "mousedown", this.handleMouseDown.bind(this)), this.bind(this.ctx.stageElement, "dblclick", this.handleDblclick.bind(this)), this.bind(this.ctx.stageElement, "mouseover", this.handleMouseover.bind(this)), this.bind(this.ctx.stageElement, "mouseout", this.handleMouseout.bind(this)), this.bind(document, "selectionchange", this.selectionchange.bind(this));
	}
	selectionchange() {
		this.ctx.domSelectionStr = "";
		const t = window.getSelection();
		t && t.toString() && (this.ctx.domSelectionStr = t.toString());
	}
	clearDomSelection() {
		const t = window.getSelection();
		t && !t.isCollapsed && t.removeAllRanges();
	}
	destroy() {
		Array.from(this.eventTasks).forEach(({ target: e, name: i, fn: s, options: o }) => {
			this.unbind(e, i, s, o);
		}), this.eventTasks.clear();
	}
	handleResize(t) {
		this.ctx.emit("resetHeader", t), this.ctx.emit("resize", t);
	}
	handleMouseDown(t) {
		this.clearDomSelection(), t.button === 0 && (this.ctx.mousedown = !0), this.ctx.emit("mousedown", t);
	}
	handleMousemove(t) {
		const e = t, i = this.ctx.containerElement.getBoundingClientRect(), s = e.clientX - i.left, o = e.clientY - i.top;
		this.ctx.mouseX = s, this.ctx.mouseY = o, this.ctx.emit("mousemove", t);
	}
	handleMouseUp(t) {
		t.button === 0 && (this.ctx.mousedown = !1), this.ctx.emit("mouseup", t);
	}
	handleClick(t) {
		this.ctx.emit("click", t);
	}
	handleKeydown(t) {
		const { ENABLE_KEYBOARD: e } = this.ctx.config;
		e && this.ctx.isTarget(t) && (this.ctx.dragHeaderIng || this.ctx.emit("keydown", t));
	}
	handleWheel(t) {
		this.ctx.emit("wheel", t);
	}
	handleTouchstart(t) {
		this.ctx.emit("touchstart", t);
	}
	handleTouchend(t) {
		this.ctx.emit("touchend", t);
	}
	handleTouchmove(t) {
		this.ctx.emit("touchmove", t);
	}
	handleContextMenu(t) {
		t.preventDefault(), this.ctx.emit("contextMenu", t);
	}
	handleMouseover(t) {
		this.ctx.isMouseoverTargetContainer = !0, this.ctx.emit("mouseover", t);
	}
	handleMouseout(t) {
		this.ctx.isMouseoverTargetContainer = !1, this.ctx.emit("mouseout", t);
	}
	handleDblclick(t) {
		this.ctx.emit("dblclick", t);
	}
	handleOutsideMousedown(t) {
		this.ctx.selector.enable && (t.target instanceof Window || t.target instanceof Node && !this.ctx.containerElement.contains(t.target)) && this.ctx.emit("outsideMousedown", t);
	}
	bind(t, e, i, s) {
		t.addEventListener(e, i, s), this.eventTasks.add({
			target: t,
			name: e,
			fn: i,
			options: s
		});
	}
	unbind(t, e, i, s) {
		t.removeEventListener(e, i, s);
		for (const o of this.eventTasks) if (o.target === t && o.name === e && o.fn === i) {
			this.eventTasks.delete(o);
			break;
		}
	}
};
var Je = class {
	constructor() {
		n(this, "events", /* @__PURE__ */ new Map());
	}
	has(t) {
		return this.events.has(t);
	}
	on(t, e) {
		const i = this.events.get(t) || [];
		i.push(e), this.events.set(t, i);
	}
	once(t, e) {
		const i = (...s) => {
			e(...s), this.off(t, i);
		};
		return this.on(t, i), this;
	}
	off(t, e) {
		const i = this.events.get(t);
		if (i) {
			const s = i.indexOf(e);
			s >= 0 && (i.splice(s, 1), i.length === 0 ? this.events.delete(t) : this.events.set(t, i));
		}
	}
	emit(t, ...e) {
		const i = this.events.get(t);
		i && i.forEach((s) => {
			s(...e);
		});
	}
	destroy() {
		this.events.clear();
	}
};
var Qe = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "textCacheMap", /* @__PURE__ */ new Map());
		const e = t.getContext("2d");
		if (!e) throw new Error("canvas context not found");
		this.ctx = e;
	}
	getCtx() {
		return this.ctx;
	}
	clearTextCache() {
		this.textCacheMap.clear();
	}
	scale(t) {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0), this.ctx.scale(t, t);
	}
	save() {
		this.ctx.save();
	}
	restore() {
		this.ctx.restore();
	}
	translate(t, e) {
		this.ctx.translate(t, e);
	}
	setCursor(t = "default") {
		this.ctx.canvas.style.cursor = t;
	}
	clear(t = 0, e = 0, i, s) {
		this.ctx.clearRect(t, e, i || this.ctx.canvas.width, s || this.ctx.canvas.height);
	}
	/**
	* 在 Canvas 上绘制单侧阴影
	* @param {number} x - 矩形的 x 坐标
	* @param {number} y - 矩形的 y 坐标
	* @param {number} width - 矩形的宽度
	* @param {number} height - 矩形的高度
	* @param {string} side - 阴影的位置（'left', 'right', 'top', 'bottom'）
	* @param {number} shadowWidth - 阴影的宽度
	* @param {string} color - 阴影的颜色
	*/
	drawShadow(t, e, i, s, o) {
		const { fillColor: r, side: a, shadowWidth: l, colorStart: c, colorEnd: f } = o;
		if (this.ctx.save(), r && (this.ctx.fillStyle = r, this.ctx.fillRect(t, e, i, s)), !Number.isFinite(l) || l <= 0) {
			this.ctx.restore();
			return;
		}
		let d;
		switch (a) {
			case "left":
				d = this.ctx.createLinearGradient(t - l, e, t, e), d.addColorStop(0, c), d.addColorStop(1, f), this.ctx.fillStyle = d, this.ctx.fillRect(t - l, e, l, s);
				break;
			case "right":
				d = this.ctx.createLinearGradient(t + i, e, t + i + l, e), d.addColorStop(0, c), d.addColorStop(1, f), this.ctx.fillStyle = d, this.ctx.fillRect(t + i, e, l, s);
				break;
			case "top":
				d = this.ctx.createLinearGradient(t, e - l, t, e), d.addColorStop(0, c), d.addColorStop(1, f), this.ctx.fillStyle = d, this.ctx.fillRect(t, e - l, i, l);
				break;
			case "bottom":
				d = this.ctx.createLinearGradient(t, e + s, t, e + s + l), d.addColorStop(0, c), d.addColorStop(1, f), this.ctx.fillStyle = d, this.ctx.fillRect(t, e + s, i, l);
				break;
			default: console.error("Invalid side specified for shadow");
		}
		this.ctx.restore();
	}
	drawLine(t, e) {
		if (t.length < 4 || t.length % 2 !== 0) throw new Error("A valid array of points is required to draw a line");
		this.ctx.save();
		const { borderColor: i = "black", borderWidth: s = 1 } = e;
		this.ctx.beginPath(), this.ctx.moveTo(t[0] - .5, t[1] - .5);
		for (let o = 2; o < t.length; o += 2) this.ctx.lineTo(t[o] - .5, t[o + 1] - .5);
		this.ctx.strokeStyle = i, this.ctx.lineWidth = s, e.lineDash && (this.ctx.lineDashOffset = e.lineDashOffset ?? 0, this.ctx.setLineDash(e.lineDash)), e.fillColor && (this.ctx.fillStyle = e.fillColor, this.ctx.fill()), e.borderColor && (this.ctx.strokeStyle = e.borderColor), this.ctx.stroke(), this.ctx.closePath(), this.ctx.restore();
	}
	drawImage(t, e, i, s, o) {
		this.ctx.save(), this.ctx.drawImage(t, e, i, s, o), this.ctx.restore();
	}
	drawRect(t, e, i, s, { borderWidth: o = 1, borderColor: r, fillColor: a, radius: l = 0 } = {}) {
		if (this.ctx.save(), a !== void 0 && (this.ctx.fillStyle = a), r !== void 0 && (this.ctx.lineWidth = o, this.ctx.strokeStyle = r), this.ctx.beginPath(), l === 0) a !== void 0 && this.ctx.fillRect(t, e, i, s), this.ctx.rect(t - .5, e - .5, i, s);
		else {
			const [c, f, d, u] = typeof l == "number" ? [
				l,
				l,
				l,
				l
			] : l;
			this.ctx.moveTo(t + c, e), this.ctx.arcTo(t + i, e, t + i, e + f, f), this.ctx.arcTo(t + i, e + s, t + i - d, e + s, d), this.ctx.arcTo(t, e + s, t, e + s - u, u), this.ctx.arcTo(t, e, t + c, e, c);
		}
		a !== void 0 && l !== 0 && this.ctx.fill(), r !== void 0 && this.ctx.stroke(), this.ctx.restore();
	}
	/**
	* 画文本
	* @param text
	* @param x
	* @param y
	* @param width
	* @param height
	* @param options
	* @returns 是否溢出
	*/
	drawText(t = "", e, i, s, o, r = {}) {
		var p, R, C;
		this.ctx.save();
		const { font: a = "12px Arial", align: l = "center", color: c = "#495060", padding: f = 0, verticalAlign: d = "middle", maxLineClamp: u = 1, autoRowHeight: x = !1, offsetLeft: w = 0, offsetRight: E = 0 } = r;
		if (this.ctx.font = a, this.ctx.fillStyle = c, [
			"",
			null,
			void 0
		].includes(t)) return this.ctx.restore(), !1;
		const m = parseInt(((p = a.match(/\d+/)) == null ? void 0 : p[0]) || "12") * (r.lineHeight || 1.2), y = this.buildTextLayout(t, e, i, s, o, {
			font: a,
			color: c,
			align: l,
			padding: f,
			verticalAlign: d,
			maxLineClamp: u,
			autoRowHeight: x,
			lineHeight: m,
			offsetLeft: w,
			offsetRight: E
		});
		if (this.ctx.textBaseline = "middle", this.ctx.textAlign = "left", y.lines.forEach((b) => {
			this.ctx.fillText(b.text, b.drawX, b.drawY + y.lineHeight / 2);
		}), r.textCallback && y.lines.length) {
			const b = y.lines.reduce((S, O) => Math.max(S, O.width), 0), _ = Math.round(b);
			let T = ((R = y.lines[0]) == null ? void 0 : R.drawX) ?? e + f + w, v = T + _;
			l === "center" ? (T = e + s / 2 - _ / 2, v = e + s / 2 + _ / 2) : l === "right" && (T = e + s - f - E - _, v = e + s - f - E);
			const I = {
				x: ((C = y.lines[0]) == null ? void 0 : C.drawX) ?? T,
				y: y.contentY,
				width: _,
				height: y.lines.length * m,
				left: T,
				right: v,
				top: y.contentY,
				bottom: y.contentY + y.lines.length * m
			};
			r.textCallback(I);
		}
		return r.layoutCallback && r.layoutCallback(y), this.ctx.restore(), y.ellipsis;
	}
	buildTextLayout(t, e, i, s, o, r) {
		const { font: a, color: l, align: c, padding: f, verticalAlign: d, maxLineClamp: u, autoRowHeight: x, lineHeight: w, offsetLeft: E, offsetRight: g } = r;
		this.ctx.save(), this.ctx.font = a;
		const m = s - f * 2 - E - g, y = m, p = o - f * 2, R = Array.from(t);
		let C = this.wrapTextToLines(t, m);
		const b = Math.round(p / w);
		let _ = Math.min(C.length, Math.max(b, 1));
		u === "auto" && x ? _ = C.length : typeof u == "number" && u < _ && u !== 1 ? _ = u : (u === 1 && (C = [{
			items: R.map((M, L) => ({
				char: M,
				sourceIndex: L
			})),
			text: t,
			caretIndex: 0,
			lineIndex: 0,
			drawX: 0,
			drawY: 0,
			width: 0,
			segments: []
		}], _ = 1), u === "auto" && b === 1 && (C = [{
			items: R.map((M, L) => ({
				char: M,
				sourceIndex: L
			})),
			text: t,
			caretIndex: 0,
			lineIndex: 0,
			drawX: 0,
			drawY: 0,
			width: 0,
			segments: []
		}], _ = 1));
		let T = !1;
		const v = C.slice(0, _);
		if (C.length > _) {
			T = !0;
			const M = C.slice(_ - 1), L = this.buildEllipsisLine(M, s, f);
			L.lineIndex = _ - 1, v[_ - 1] = L;
		} else if (_ > 0) {
			const M = _ - 1, L = C.slice(M), D = L.map((A) => A.text).join(""), { ellipsis: N } = this.handleEllipsis(D, s, f, a);
			if (N) {
				T = !0;
				const A = this.buildEllipsisLine(L, s, f);
				A.lineIndex = M, v[M] = A;
			}
		}
		const I = v.length * w;
		let S = i + f;
		d === "middle" ? S = i + (o - I) / 2 : d === "bottom" && (S = i + o - I - f);
		const O = [];
		return v.forEach((M, L) => {
			M.lineIndex = L;
			const D = this.buildLineSegments(M), N = D.reduce((H, vt) => H + vt.width, 0);
			let A = e + f + E;
			c === "center" ? A = e + (s - N) / 2 : c === "right" && (A = e + s - f - g - N);
			const k = S + L * w;
			M.drawX = A, M.drawY = k, M.width = N, M.segments = D, D.forEach((H) => {
				H.sourceIndex < 0 || O.push({
					char: H.char,
					index: H.sourceIndex,
					line: L,
					x: A + H.x,
					y: k,
					width: H.width,
					height: w
				});
			});
		}), this.ctx.restore(), {
			text: t,
			chars: R,
			glyphs: O,
			lines: v,
			box: {
				x: e,
				y: i,
				width: s,
				height: o
			},
			contentBox: {
				x: e + f + E,
				y: i + f,
				width: y,
				height: p
			},
			contentY: S,
			lineHeight: w,
			font: a,
			color: l,
			align: c,
			ellipsis: T
		};
	}
	wrapTextToLines(t, e) {
		if (!t) return [{
			items: [],
			text: "",
			caretIndex: 0,
			lineIndex: 0,
			drawX: 0,
			drawY: 0,
			width: 0,
			segments: []
		}];
		const i = Array.from(t), s = [];
		let o = [], r = 0, a = 0;
		const l = (c) => {
			const f = o.map((d) => d.char).join("");
			s.push({
				items: o,
				text: f,
				caretIndex: a,
				lineIndex: s.length,
				drawX: 0,
				drawY: 0,
				width: 0,
				segments: []
			}), o = [], r = 0, a = c;
		};
		for (let c = 0; c < i.length; c++) {
			const f = i[c];
			if (f === `
`) {
				l(c + 1);
				continue;
			}
			const d = this.ctx.measureText(f).width;
			if (r + d > e && o.length > 0) {
				l(o[o.length - 1].sourceIndex + 1), o.push({
					char: f,
					sourceIndex: c
				}), r = d;
				continue;
			}
			o.push({
				char: f,
				sourceIndex: c
			}), r += d;
		}
		return (o.length > 0 || s.length === 0) && l(i.length), s;
	}
	buildEllipsisLine(t, e, i) {
		var f;
		const s = t.flatMap((d) => d.items), o = s.map((d) => d.char).join(""), { _text: r, ellipsis: a } = this.handleEllipsis(o, e, i, this.ctx.font), l = a ? r.slice(0, -3) : r, c = [];
		for (let d = 0; d < l.length; d++) {
			const u = s[d];
			if (!u) break;
			c.push({
				char: u.char,
				sourceIndex: u.sourceIndex
			});
		}
		return a && c.push({
			char: ".",
			sourceIndex: -1,
			ellipsis: !0
		}, {
			char: ".",
			sourceIndex: -1,
			ellipsis: !0
		}, {
			char: ".",
			sourceIndex: -1,
			ellipsis: !0
		}), {
			items: c,
			text: r,
			caretIndex: ((f = t[0]) == null ? void 0 : f.caretIndex) ?? 0,
			lineIndex: 0,
			drawX: 0,
			drawY: 0,
			width: 0,
			segments: []
		};
	}
	buildLineSegments(t) {
		const e = [];
		let i = 0;
		return t.items.forEach((s, o) => {
			const r = this.ctx.measureText(s.char).width;
			e.push({
				char: s.char,
				itemIndex: o,
				sourceIndex: s.sourceIndex,
				x: i,
				width: r
			}), i += r;
		}), e;
	}
	/**
	* 将文本按宽度换行
	* @param text
	* @param maxWidth
	* @returns
	*/
	wrapText(t, e, i = "") {
		if (!t) return [""];
		if (i && this.textCacheMap.has(i)) return this.textCacheMap.get(i) || [""];
		const s = [], o = t.split(`
`);
		for (const a of o) {
			if (a === "") {
				s.push("");
				continue;
			}
			const l = a.split("");
			let c = "";
			for (const f of l) {
				const d = c + f;
				this.ctx.measureText(d).width <= e ? c = d : c ? (s.push(c), c = f) : (s.push(f), c = "");
			}
			c && s.push(c);
		}
		const r = s.length > 0 ? s : [""];
		return i && this.textCacheMap.set(i, r), r;
	}
	/**
	* 计算文本自适应高度
	* @param text
	* @param width
	* @param options
	* @returns 计算出的高度
	*/
	calculateTextHeight(t = "", e, i = {}) {
		var E;
		const { font: s = "12px Arial", padding: o = 0, align: r = "center", color: a = "#495060", maxLineClamp: l = 1, cacheTextKey: c = "" } = i;
		this.ctx.save(), this.ctx.font = s, this.ctx.fillStyle = a, this.ctx.textAlign = r;
		const f = parseInt(((E = s.match(/\d+/)) == null ? void 0 : E[0]) || "12"), d = f * (i.lineHeight || 1.2), u = e - o * 2, x = this.wrapText(t, u, c);
		let w = 1;
		return l === "auto" ? w = x.length : x.length > l ? w = l : w = x.length, this.ctx.restore(), Math.max(Math.floor(w * d + o * 2), Math.floor(f + o * 2));
	}
	handleEllipsis(t, e, i = 0, s = "12px Arial") {
		this.ctx.save();
		let o = !1, r = t;
		if (this.ctx.font = s, t == null || t === "") return this.ctx.restore(), {
			_text: "",
			ellipsis: o
		};
		const a = this.ctx.measureText("...").width;
		if (e <= a + i * 2) return this.ctx.restore(), {
			_text: "",
			ellipsis: !0
		};
		const l = this.ctx.measureText(t).width, c = e - i * 2;
		if (l && l >= c) {
			o = !0;
			let f = 0;
			for (let d = 0; d < t.length; d++) if (f += this.ctx.measureText(t[d]).width, f >= c - a) {
				r = t.slice(0, d) + "...", o = !0;
				break;
			}
		}
		return this.ctx.restore(), {
			_text: r,
			ellipsis: o
		};
	}
};
var Ut = class {
	constructor(t) {
		n(this, "_config", {});
		/** CSS 类名前缀 */
		n(this, "CSS_PREFIX", "e-virt-table");
		/** 图标集合 */
		n(this, "ICONS", []);
		/** 行的唯一标识：字段名，或返回唯一标识的方法 */
		n(this, "ROW_KEY", "");
		/** 禁用编辑,优先等级最高 */
		n(this, "DISABLED", !1);
		/** 表头字体 */
		n(this, "HEADER_FONT", "12px normal Arial");
		/** 单元格字体 */
		n(this, "BODY_FONT", "12px normal Arial");
		/** 边框 */
		n(this, "BORDER", !0);
		/** 斑马纹 */
		n(this, "STRIPE", !1);
		/** 斑马纹颜色 */
		n(this, "STRIPE_COLOR", "#fafafa");
		/** 区域边框颜色 */
		n(this, "BORDER_COLOR", "#e1e6eb");
		/** 固定列阴影靠近边界的颜色 */
		n(this, "FIXED_COLUMN_SHADOW_COLOR", "rgba(0,0,0,0.1)");
		/** 固定列阴影渐隐末端的颜色 */
		n(this, "FIXED_COLUMN_SHADOW_FADE_COLOR", "rgba(0,0,0,0)");
		/** 固定列阴影宽度 */
		n(this, "FIXED_COLUMN_SHADOW_WIDTH", 4);
		/** 高度，为 0 表示自适应 */
		n(this, "HEIGHT", 0);
		/** 占位文本颜色 */
		n(this, "PLACEHOLDER_COLOR", "#CDD0DC");
		/** 空数据 body 高度 */
		n(this, "EMPTY_BODY_HEIGHT", 120);
		/** 自定义空样式 */
		n(this, "EMPTY_CUSTOM_STYLE", {});
		/** 空数据文本 */
		n(this, "EMPTY_TEXT", "");
		/** 加载文本 */
		n(this, "LOADING_TEXT", "");
		/** 最大高度，为 0 表示自适应高度根据 HEIGHT	 */
		n(this, "MAX_HEIGHT", 1e3);
		/** 区域边框圆角 */
		n(this, "BORDER_RADIUS", 8);
		/** 启用偏移高度内部计算表格高度 */
		n(this, "ENABLE_OFFSET_HEIGHT", !1);
		/** 偏移高度 */
		n(this, "OFFSET_HEIGHT", 0);
		/** 表头高度 */
		n(this, "HEADER_HEIGHT", 36);
		/** 启用头部固定,需要外面实现覆盖层，或者所有表头都要是元素 */
		n(this, "ENABLE_HEADER_STICKY", !1);
		/** 表头背景色 */
		n(this, "HEADER_BG_COLOR", "#F8FAFF");
		/** body 背景色 */
		n(this, "BODY_BG_COLOR", "#FFF");
		/** 表头文本颜色 */
		n(this, "HEADER_TEXT_COLOR", "#1D2129");
		/** 必填*颜色 */
		n(this, "REQUIRED_COLOR", "#F56C6C");
		/** body文本颜色 */
		n(this, "BODY_TEXT_COLOR", "#4E5969");
		/** footer文本颜色 */
		n(this, "FOOTER_TEXT_COLOR", "#4E5969");
		/** 加载 svg 图标 */
		n(this, "LOADING_ICON_SVG", "");
		/** 加载 svg 图标颜色 */
		n(this, "LOADING_ICON_COLOR", "#4E5969");
		/** 树形展开svg 图标 */
		n(this, "EXPAND_ICON_SVG", "");
		/** 树形收缩svg 图标 */
		n(this, "SHRINK_ICON_SVG", "");
		/** 展开图标颜色 */
		n(this, "EXPAND_ICON_COLOR", "#4E5969");
		/** 收缩图标颜色 */
		n(this, "SHRINK_ICON_COLOR", "#4E5969");
		/** 错误提示颜色 */
		n(this, "ERROR_TIP_ICON_COLOR", "red");
		/** 错误提示图标大小 */
		n(this, "ERROR_TIP_ICON_SIZE", 6);
		/** 所有列对齐方式 */
		n(this, "COLUMNS_ALIGN", "left");
		/** 所有列垂直对齐方式 */
		n(this, "COLUMNS_VERTICAL_ALIGN", "middle");
		/** 是否开启懒加载	 */
		n(this, "EXPAND_LAZY", !0);
		/** 默认展开全部	 */
		n(this, "DEFAULT_EXPAND_ALL", !1);
		/** 表格 body 部分的宽度 */
		n(this, "CELL_WIDTH", 100);
		/** body 单元格默认行高 */
		n(this, "CELL_HEIGHT", 36);
		/** 表格 body 部分的 padding */
		n(this, "CELL_PADDING", 8);
		/** hover编辑图标大小 */
		n(this, "CELL_HOVER_ICON_SIZE", 14);
		/** hover编辑图标背景色 */
		n(this, "CELL_HOVER_ICON_BG_COLOR", "#fff");
		/** hover编辑图标边框颜色 */
		n(this, "CELL_HOVER_ICON_BORDER_COLOR", "#DDE0EA");
		/** 滚动条轨道尺寸 */
		n(this, "SCROLLER_TRACK_SIZE", 14);
		/** 滚动条模式，outer 为外部预留区域，inner 为覆盖在内容上 */
		n(this, "scrollbarMode", "outer");
		/** 内部滚动条悬停后显示延迟 */
		n(this, "SCROLLBAR_SHOW_DELAY", 300);
		/** 滚动条滑块尺寸 */
		n(this, "SCROLLER_SIZE", 8);
		/** 滚动条滑块颜色 */
		n(this, "SCROLLER_COLOR", "#dee0e3");
		/** 轨道颜色 */
		n(this, "SCROLLER_TRACK_COLOR", "#fff");
		/** 滚动条滑块聚焦时的颜色 */
		n(this, "SCROLLER_FOCUS_COLOR", "#bbbec4");
		/** 选中区域边框颜色 */
		n(this, "SELECT_BORDER_COLOR", "rgb(82,146,247)");
		/** 选中区域背景颜色 */
		n(this, "SELECT_AREA_COLOR", "rgba(82,146,247,0.1)");
		/** 当前焦点单元格所在行、列的背景色 */
		n(this, "SELECT_ROW_COL_BG_COLOR", "transparent");
		/** 填充点的边框颜色 */
		n(this, "AUTOFILL_POINT_BORDER_COLOR", "#fff");
		/** 可编辑背景色 */
		n(this, "EDIT_BG_COLOR", "#fcf6ed");
		/** 选择 key,合并时用 */
		n(this, "CHECKBOX_KEY", "");
		/** 选择框颜色 */
		n(this, "CHECKBOX_COLOR", "rgb(82,146,247)");
		/** 查找结果当前行颜色 */
		n(this, "FINDER_CELL_BG_COLOR", "rgb(255,229,144)");
		/** 启用查找 */
		n(this, "ENABLE_FINDER", !0);
		/** 选择框大小 */
		n(this, "CHECKBOX_SIZE", 20);
		/** 选择框禁用图标 */
		n(this, "CHECKBOX_DISABLED_SVG", "");
		/** 选择框禁用图标颜色 */
		n(this, "CHECKBOX_DISABLED_COLOR", "#F1F2F4");
		/** 选择框选中图标 */
		n(this, "CHECKBOX_CHECK_SVG", "");
		/** 选择框未中图标 */
		n(this, "CHECKBOX_UNCHECK_SVG", "");
		/** 选择框未中图标颜色 */
		n(this, "CHECKBOX_UNCHECK_COLOR", "#DDE0EA");
		/** 选择框半选中图标 */
		n(this, "CHECKBOX_INDETERMINATE_SVG", "");
		/** 选择框选中禁用图标 */
		n(this, "CHECKBOX_CHECK_DISABLED_SVG", "");
		/** 选择框选中禁用图标颜色 */
		n(this, "CHECKBOX_CHECK_DISABLED_COLOR", "#DDE0EA");
		/** 编辑图标 */
		n(this, "ICON_EDIT_SVG", "");
		/** 编辑图标颜色 */
		n(this, "ICON_EDIT_COLOR", "#4E5969");
		/** 选择图标 */
		n(this, "ICON_SELECT_SVG", "");
		/** 选择图标颜色 */
		n(this, "ICON_SELECT_COLOR", "#4E5969");
		/** 启用严格排序，即不支持多列排序 */
		n(this, "SORT_STRICTLY", !0);
		/** 排序升序图标 */
		n(this, "SORT_ASC_ICON_SVG", "");
		/** 排序降序图标 */
		n(this, "SORT_DESC_ICON_SVG", "");
		/** 排序默认图标 */
		n(this, "SORTABLE_ICON_SVG", "");
		/** 排序图标颜色 */
		n(this, "SORT_ICON_COLOR", "rgb(82,146,247)");
		/** 单元格只读背景色 */
		n(this, "READONLY_COLOR", "#fff");
		/** 单元格只读文本颜色 */
		n(this, "READONLY_TEXT_COLOR", "#4E5969");
		/**启用单元格只读触发校验 */
		n(this, "ENABLE_READONLY_VALIDATE", !1);
		/** 单元格错误提示文本颜色 */
		n(this, "ERROR_TIP_COLOR", "#ED3F14");
		/** 合计底部背景色 */
		n(this, "FOOTER_BG_COLOR", "#fafafa");
		/** 合计底部固定 */
		n(this, "FOOTER_FIXED", !0);
		/** 合计底部位置 */
		n(this, "FOOTER_POSITION", "bottom");
		/** 单元格底部高度 */
		n(this, "CELL_FOOTER_HEIGHT", 36);
		/** 启用选择器 */
		n(this, "ENABLE_SELECTOR", !0);
		/** 树形选择模式 */
		n(this, "TREE_SELECT_MODE", "auto");
		/** 树形子项key名称 */
		n(this, "TREE_CHILDREN_KEY", "children");
		/** 树形缩进宽度 */
		n(this, "TREE_INDENT", 20);
		/** 树形图标大小 */
		n(this, "TREE_ICON_SIZE", 20);
		/**树形划线 */
		n(this, "TREE_LINE", !1);
		/** 树形划线颜色 */
		n(this, "TREE_LINE_COLOR", "#e1e6eb");
		/** 启用单点击立马编辑 */
		n(this, "ENABLE_EDIT_SINGLE_CLICK", !1);
		/** 启用点击选择器编辑 */
		n(this, "ENABLE_EDIT_CLICK_SELECTOR", !0);
		/** 选择器X最小范围 */
		n(this, "SELECTOR_AREA_MIN_X", 0);
		/** 选择器X最大范围colMax - offset */
		n(this, "SELECTOR_AREA_MAX_X_OFFSET", 0);
		/** 选择器X最大范围,0默认最大colMax */
		n(this, "SELECTOR_AREA_MAX_X", 0);
		/** 选择器Y最小范围 */
		n(this, "SELECTOR_AREA_MIN_Y", 0);
		/** 选择器Y最大范围,0默认rowMax */
		n(this, "SELECTOR_AREA_MAX_Y", 0);
		/** 选择器Y最大范围,0默认rowMax */
		n(this, "SELECTOR_AREA_MAX_Y_OFFSET", 0);
		/** 选择器值类型，value，displayText,区别displayText受format影响 */
		n(this, "SELECTOR_CELL_VALUE_TYPE", "value");
		/** 启用自动主题 */
		n(this, "ENABLE_AUTO_THEME", !0);
		/** 启用选择器-选择器单选 */
		n(this, "ENABLE_SELECTOR_SINGLE", !1);
		/** 启用选择器-批量跨列选择 */
		n(this, "ENABLE_SELECTOR_SPAN_COL", !0);
		/** 启用选择器-批量跨行选择 */
		n(this, "ENABLE_SELECTOR_SPAN_ROW", !0);
		/** 启用选择器-批量选中列 */
		n(this, "ENABLE_SELECTOR_ALL_ROWS", !0);
		/** 启用选择器-批量选中行 */
		n(this, "ENABLE_SELECTOR_ALL_COLS", !0);
		/** 启用合并格子数据关联 */
		n(this, "ENABLE_MERGE_CELL_LINK", !1);
		/** 启用填充器 */
		n(this, "ENABLE_AUTOFILL", !1);
		/** 启用选择器-批量跨列选择 */
		n(this, "ENABLE_AUTOFILL_SPAN_COL", !0);
		/** 启用选择器-批量跨行选择 */
		n(this, "ENABLE_AUTOFILL_SPAN_ROW", !0);
		/** 启用body右键菜单 */
		n(this, "ENABLE_CONTEXT_MENU", !1);
		/** 启用表头右键菜单 */
		n(this, "ENABLE_HEADER_CONTEXT_MENU", !1);
		/** 启用文字选中复制 */
		n(this, "ENABLE_TEXT_SELECTION", !0);
		/** 启用复制 */
		n(this, "ENABLE_COPY", !0);
		/** 启用粘贴 */
		n(this, "ENABLE_PASTER", !0);
		/** 启用调整行高 */
		n(this, "ENABLE_RESIZE_ROW", !0);
		/** 启用列宽可调整 */
		n(this, "ENABLE_RESIZE_COLUMN", !0);
		/** 可调整列宽时的表头静态列分割线颜色 */
		n(this, "RESIZE_COLUMN_DIVIDER_COLOR");
		/** 行调整线颜色 */
		n(this, "RESIZE_ROW_LINE_COLOR", "#e1e6eb");
		/** 列调整线颜色 */
		n(this, "RESIZE_COLUMN_LINE_COLOR", "#e1e6eb");
		/** 启用列调整文本 */
		n(this, "ENABLE_RESIZE_COLUMN_TEXT", !0);
		/** 列调整线颜色 */
		n(this, "RESIZE_COLUMN_TEXT_COLOR", "#fff");
		/** 列调整线文本背景色 */
		n(this, "RESIZE_COLUMN_TEXT_BG_COLOR", "rgb(82,146,247)");
		/** 最小调整行高 */
		n(this, "RESIZE_ROW_MIN_HEIGHT", 36);
		/** 列宽最小值 */
		n(this, "RESIZE_COLUMN_MIN_WIDTH", 40);
		/** 拖拽提示背景色 */
		n(this, "DRAG_TIP_BG_COLOR", "rgba(82,146,247,0.1)");
		/** 拖拽提示线颜色 */
		n(this, "DRAG_TIP_LINE_COLOR", "rgb(82,146,247)");
		/** 拖拽提示文本颜色 */
		/** 启用键盘 */
		n(this, "ENABLE_KEYBOARD", !0);
		/** 启用历史 */
		n(this, "ENABLE_HISTORY", !1);
		n(this, "ENABLE_VALIDATOR_IMMEDIATE", !0);
		/** 历史栈数量 */
		n(this, "HISTORY_NUM", 50);
		/** 启用悬浮高亮 */
		n(this, "HIGHLIGHT_HOVER_ROW", !1);
		/** 悬浮颜色 */
		n(this, "HIGHLIGHT_HOVER_ROW_COLOR", "rgba(186,203,231,0.1)");
		/** 高亮选中当前行 */
		n(this, "HIGHLIGHT_SELECTED_ROW", !1);
		/** 高亮当前行颜色 */
		n(this, "HIGHLIGHT_SELECTED_ROW_COLOR", "rgba(82,146,247,0.1)");
		/** 提示背景颜色 */
		n(this, "TOOLTIP_BG_COLOR", "#303133");
		/** 提示文本颜色 */
		n(this, "TOOLTIP_TEXT_COLOR", "#fff");
		/** 提示层级 */
		n(this, "TOOLTIP_ZINDEX", 3e3);
		/** 自定义提示样式 */
		n(this, "TOOLTIP_CUSTOM_STYLE", {});
		/** 自定义右键菜单 */
		n(this, "CONTEXT_MENU", [
			{ value: "copy" },
			{ value: "cut" },
			{ value: "paste" },
			{ value: "clearSelected" }
		]);
		n(this, "CUSTOM_BODY_CONTEXT_MENU", []);
		n(this, "HEADER_CONTEXT_MENU", [
			{ value: "fixedLeft" },
			{ value: "fixedRight" },
			{ value: "fixedNone" },
			{ value: "hide" },
			{ value: "visible" },
			{ value: "resetHeader" }
		]);
		n(this, "CUSTOM_HEADER_CONTEXT_MENU", []);
		/** 格子多行文本行高,isAutoRowHeight才会生效 */
		n(this, "CELL_LINE_HEIGHT", 1.2);
		/** 全局自动行高 */
		n(this, "AUTO_ROW_HEIGHT", !1);
		/** 启用拖拽表头 */
		n(this, "ENABLE_DRAG_COLUMN", !1);
		/** 启用拖拽行 */
		n(this, "ENABLE_DRAG_ROW", !1);
		/** 启用拖拽行跨级,针对tree数据结构 */
		n(this, "ENABLE_DRAG_ROW_CROSS_LEVEL", !1);
		/** 启用拖拽行自定义 */
		n(this, "ENABLE_DRAG_ROW_CUSTOM", !1);
		/** 拖拽提示线颜色 */
		n(this, "DRAG_ROW_TIP_LINE_COLOR", "rgb(82,146,247)");
		/** 拖拽行图标 */
		n(this, "DRAG_ROW_ICON_SVG", "");
		/** 拖拽行图标大小 */
		n(this, "DRAG_ROW_ICON_SIZE", 18);
		/** 拖拽行图标颜色 */
		n(this, "DRAG_ROW_ICON_COLOR", "#bec4c7");
		/** header 格子样式 */
		n(this, "HEADER_CELL_STYLE_METHOD");
		/** body 格子样式 */
		n(this, "BODY_CELL_STYLE_METHOD");
		/** footer 格子样式 */
		n(this, "FOOTER_CELL_STYLE_METHOD");
		/** 自定义只读 */
		n(this, "BODY_CELL_READONLY_METHOD");
		/** 格式化方法更改（formatter优先等级比较高） */
		n(this, "BODY_CELL_FORMATTER_METHOD");
		/** 自定义校验规则 */
		n(this, "BODY_CELL_RULES_METHOD");
		/** 自定义只读 */
		n(this, "BODY_CELL_TYPE_METHOD");
		/** 自定义编辑器类型 */
		n(this, "BODY_CELL_EDITOR_METHOD");
		/** 自定义只读 */
		n(this, "BODY_CELL_RENDER_METHOD");
		/** 自定义只读 */
		n(this, "BODY_CELL_HOVER_ICON_METHOD");
		/** 自定义跨列/行渲染 */
		n(this, "SPAN_METHOD");
		/** 自定义选择禁用 */
		n(this, "SELECTABLE_METHOD");
		/** 自定义选择禁用 */
		n(this, "EXPAND_LAZY_METHOD");
		/** 数值改变前回调 */
		n(this, "BEFORE_VALUE_CHANGE_METHOD");
		/** 粘贴前回调 */
		n(this, "BEFORE_PASTE_DATA_METHOD");
		/** 数值填充前回调 */
		n(this, "BEFORE_AUTOFILL_DATA_METHOD");
		/** 设置选择器前回调 */
		n(this, "BEFORE_SET_SELECTOR_METHOD");
		/** 设置填充器前回调 */
		n(this, "BEFORE_SET_AUTOFILL_METHOD");
		/** 自定义表头右键菜单 */
		n(this, "BEFORE_HEADER_CONTEXT_MENU_METHOD");
		/** 自定义BODY右键菜单 */
		n(this, "BEFORE_BODY_CONTEXT_MENU_METHOD");
		/** 数据复制前回调 */
		n(this, "BEFORE_COPY_METHOD");
		n(this, "BEFORE_DRAG_ROW_METHOD");
		this._config = t, this.updateCssVar();
	}
	/** 初始化 */
	init(t) {
		this._config = t, this.updateCssVar();
	}
	/** 同步css 样式变量 */
	updateCssVar() {
		let t = {};
		Object.keys(this).forEach((e) => {
			if (e.endsWith("_COLOR") || e.endsWith("_FONT")) {
				const s = ke(`--evt-${e.toLocaleLowerCase().replace(/_/g, "-")}`);
				s && (t[e] = s);
			}
		}), Object.assign(this, t, this._config);
	}
};
var ut = `<svg t="1724122015492" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4237" width="32" height="32"><path d="M401.472 316.992l159.04 217.664L591.488 512l-30.976-22.656-159.04 217.728q-2.24 3.008-3.84 6.464-1.6 3.456-2.496 7.104-0.896 3.648-1.024 7.424-0.192 3.84 0.384 7.552 0.64 3.712 1.92 7.296 1.28 3.52 3.2 6.784 1.984 3.2 4.544 6.016 2.56 2.752 5.632 4.992 3.072 2.24 6.464 3.84 3.456 1.6 7.168 2.496 3.648 0.896 7.424 1.024 3.776 0.192 7.488-0.448 3.776-0.576 7.296-1.856 3.584-1.28 6.784-3.264 3.2-1.92 6.016-4.48 2.816-2.56 5.056-5.632l159.04-217.728q3.584-4.928 5.504-10.752 1.92-5.76 1.92-11.904 0-6.08-1.92-11.904-1.92-5.76-5.504-10.752L463.488 271.68q-2.24-3.072-5.056-5.632-2.752-2.56-6.016-4.48-3.2-1.984-6.784-3.328-3.52-1.28-7.296-1.856-3.712-0.576-7.488-0.448-3.84 0.192-7.424 1.088-3.712 0.896-7.168 2.496-3.392 1.6-6.4 3.84-3.136 2.176-5.696 4.992-2.56 2.752-4.48 6.016-1.984 3.2-3.264 6.784-1.28 3.52-1.92 7.296-0.576 3.712-0.384 7.488 0.128 3.84 1.024 7.488 0.896 3.648 2.496 7.04 1.6 3.456 3.84 6.528z m30.976-61.056q-3.776 0-7.488 0.704-3.712 0.768-7.168 2.24-3.52 1.408-6.656 3.52-3.2 2.112-5.824 4.8-2.688 2.624-4.8 5.76-2.112 3.2-3.52 6.656-1.472 3.52-2.176 7.232-0.768 3.712-0.768 7.488 0 3.776 0.768 7.488 0.704 3.712 2.176 7.232 1.408 3.456 3.52 6.592 2.112 3.2 4.8 5.824 2.688 2.688 5.76 4.8 3.2 2.112 6.72 3.52 3.456 1.472 7.168 2.176 3.712 0.768 7.488 0.768 3.84 0 7.488-0.768 3.712-0.704 7.232-2.176 3.456-1.408 6.592-3.52 3.2-2.112 5.824-4.8 2.688-2.688 4.8-5.76 2.112-3.2 3.52-6.656 1.472-3.52 2.24-7.232 0.704-3.712 0.704-7.488 0-3.84-0.704-7.488-0.768-3.712-2.24-7.232-1.408-3.456-3.52-6.592-2.112-3.2-4.8-5.824-2.624-2.688-5.76-4.8-3.2-2.112-6.656-3.52-3.52-1.472-7.232-2.24Q436.224 256 432.448 256z m0 435.392q-3.776 0-7.488 0.704-3.712 0.768-7.168 2.176-3.52 1.472-6.656 3.584-3.2 2.112-5.824 4.736-2.688 2.688-4.8 5.824-2.112 3.2-3.52 6.656-1.472 3.52-2.176 7.232-0.768 3.712-0.768 7.488 0 3.776 0.768 7.488 0.704 3.712 2.176 7.168 1.408 3.52 3.52 6.656 2.112 3.2 4.8 5.76 2.688 2.752 5.76 4.8 3.2 2.112 6.72 3.584 3.456 1.472 7.168 2.176 3.712 0.768 7.488 0.768 3.84 0 7.488-0.768 3.712-0.704 7.232-2.176 3.456-1.472 6.592-3.584 3.2-2.048 5.824-4.736 2.688-2.688 4.8-5.824 2.112-3.2 3.52-6.656 1.472-3.456 2.24-7.168 0.704-3.712 0.704-7.488 0-3.84-0.704-7.488-0.768-3.712-2.24-7.232-1.408-3.52-3.52-6.656-2.112-3.136-4.8-5.76-2.624-2.688-5.76-4.8-3.2-2.112-6.656-3.584-3.52-1.408-7.232-2.176-3.712-0.704-7.488-0.704z" p-id="4238"></path></svg>\r
`;
var jt = `<svg t="1722595535853" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4551" width="32" height="32"><path d="M640 128H384c-170.496 0-256 85.504-256 256v256c0 170.496 85.504 256 256 256h256c170.496 0 256-85.504 256-256V384c0-170.496-85.504-256-256-256z m67.584 302.592c-2.048 4.608-4.608 8.704-8.192 12.288L506.88 634.88c-3.584 3.584-7.68 6.144-12.288 8.192-4.608 2.048-9.728 3.072-14.848 3.072s-10.24-1.024-14.848-3.072c-4.608-2.048-8.704-4.608-12.288-8.192l-96.256-96.256c-3.584-3.584-6.144-7.68-8.192-12.288-2.048-4.608-3.072-9.728-3.072-14.848 0-2.56 0-5.12 1.024-7.68 0.512-2.56 1.024-5.12 2.048-7.168 1.024-2.56 2.048-4.608 3.584-6.656 1.536-2.048 3.072-4.096 4.608-5.632 1.536-2.048 3.584-3.584 5.632-4.608 2.048-1.536 4.096-2.56 6.656-3.584 2.56-1.024 4.608-1.536 7.168-2.048 2.56-0.512 5.12-0.512 7.68-0.512 5.12 0 10.24 1.024 14.848 3.072 4.608 2.048 8.704 4.608 12.288 8.192l69.12 68.608L645.12 389.12c3.584-3.584 7.68-6.144 12.288-8.192 4.608-2.048 9.728-3.072 14.848-3.072 2.56 0 5.12 0 7.68 0.512s5.12 1.024 7.168 2.048c2.56 1.024 4.608 2.048 6.656 3.584 2.048 1.536 4.096 3.072 5.632 4.608 1.536 1.536 3.584 3.584 4.608 5.632 1.536 2.048 2.56 4.096 3.584 6.656 1.024 2.56 1.536 4.608 2.048 7.168 0.512 2.56 1.024 5.12 1.024 7.68 0 5.12-1.024 10.24-3.072 14.848z" p-id="4552"></path></svg>
`;
var qt = `<svg t="1724122044148" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4551" width="32" height="32"><path d="M707.648 401.28L489.28 560.704l22.656 30.976 22.656-30.976L316.16 401.216q-3.072-2.24-6.464-3.84-3.456-1.536-7.104-2.432-3.712-0.896-7.488-1.088-3.776-0.128-7.488 0.448-3.776 0.64-7.296 1.92-3.584 1.28-6.784 3.2-3.2 1.984-6.016 4.544-2.816 2.56-5.056 5.632-2.176 3.072-3.84 6.464-1.536 3.456-2.432 7.104-0.896 3.712-1.088 7.488-0.128 3.776 0.448 7.488 0.64 3.776 1.92 7.296 1.28 3.584 3.2 6.784 1.984 3.2 4.544 6.016 2.56 2.752 5.632 4.992l218.368 159.552q4.928 3.584 10.752 5.504 5.76 1.92 11.904 1.92 6.08 0 11.904-1.92 5.76-1.92 10.752-5.504l218.368-159.552q3.008-2.24 5.568-4.992 2.56-2.816 4.544-6.016 1.92-3.2 3.264-6.784 1.28-3.52 1.92-7.296 0.576-3.712 0.384-7.488-0.128-3.84-1.024-7.488-0.896-3.648-2.496-7.04-1.6-3.456-3.84-6.528-2.24-3.072-4.992-5.632-2.816-2.56-6.016-4.48-3.2-1.984-6.784-3.328-3.584-1.28-7.296-1.856-3.712-0.64-7.488-0.448-3.84 0.192-7.488 1.088-3.648 0.896-7.04 2.496-3.456 1.536-6.528 3.84z m61.056 30.976q0-3.84-0.768-7.488-0.704-3.712-2.176-7.232-1.472-3.456-3.52-6.656-2.112-3.136-4.8-5.76-2.688-2.688-5.76-4.8-3.2-2.112-6.72-3.584-3.456-1.408-7.168-2.176-3.712-0.704-7.488-0.704-3.84 0-7.488 0.704-3.712 0.768-7.232 2.176-3.456 1.472-6.656 3.584-3.136 2.112-5.76 4.8-2.688 2.624-4.8 5.76-2.112 3.2-3.584 6.656-1.408 3.52-2.176 7.232-0.704 3.712-0.704 7.488 0 3.776 0.704 7.488 0.768 3.712 2.176 7.168 1.472 3.52 3.584 6.656 2.112 3.2 4.8 5.824 2.624 2.688 5.76 4.8 3.2 2.112 6.656 3.52 3.52 1.472 7.232 2.176 3.712 0.768 7.488 0.768 3.776 0 7.488-0.768 3.712-0.704 7.168-2.176 3.52-1.408 6.656-3.52 3.2-2.112 5.824-4.8 2.688-2.688 4.8-5.76 2.048-3.2 3.52-6.72 1.472-3.456 2.176-7.168 0.768-3.712 0.768-7.488z m-436.736 0q0-3.84-0.768-7.488-0.704-3.712-2.176-7.232-1.408-3.456-3.52-6.656-2.112-3.136-4.8-5.76-2.688-2.688-5.76-4.8-3.2-2.112-6.656-3.584-3.52-1.408-7.232-2.176-3.712-0.704-7.488-0.704-3.84 0-7.488 0.704-3.712 0.768-7.232 2.176-3.456 1.472-6.592 3.584-3.2 2.112-5.824 4.8-2.688 2.624-4.8 5.76-2.112 3.2-3.52 6.656-1.472 3.52-2.24 7.232-0.704 3.712-0.704 7.488 0 3.776 0.704 7.488 0.768 3.712 2.24 7.168 1.408 3.52 3.52 6.656 2.112 3.2 4.8 5.824 2.624 2.688 5.76 4.8 3.2 2.112 6.656 3.52 3.52 1.472 7.232 2.176 3.712 0.768 7.488 0.768 3.776 0 7.488-0.768 3.712-0.704 7.232-2.176 3.456-1.408 6.592-3.52 3.2-2.112 5.824-4.8 2.688-2.688 4.8-5.76 2.112-3.2 3.52-6.72 1.472-3.456 2.176-7.168 0.768-3.712 0.768-7.488z" p-id="4552"></path></svg>
`;
var Bt = `<svg t="1755138507987" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5079" width="200" height="200"><path d="M512 938.688a42.688 42.688 0 0 1-35.072-18.432l-192-277.312A42.56 42.56 0 0 1 320 576h384a42.752 42.752 0 0 1 35.072 66.944l-192 277.312a42.688 42.688 0 0 1-35.072 18.432" fill="currentColor" p-id="2016"></path><path d="M704 448H320a42.752 42.752 0 0 1-35.072-66.944l192-277.312c16-23.04 54.208-23.04 70.144 0l192 277.312A42.56 42.56 0 0 1 704 448" fill="currentColor" p-id="2015"></path></svg>
`;
var xe = `<svg t="1724133395728" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2893" width="32" height="32"><path d="M512 226.8476541a19.82487759 19.82487759 0 0 1 14.66497778 5.70304692c3.80203107 3.82918865 5.70304692 8.71751457 5.70304693 14.66497779v122.20814825a19.82487759 19.82487759 0 0 1-5.70304693 14.66497778 19.82487759 19.82487759 0 0 1-14.66497778 5.70304691 19.82487759 19.82487759 0 0 1-14.66497778-5.70304691 19.82487759 19.82487759 0 0 1-5.70304693-14.66497778v-122.20814825a19.82487759 19.82487759 0 0 1 5.70304693-14.66497779 19.82487759 19.82487759 0 0 1 14.66497778-5.70304692z m0 407.36049415a19.82487759 19.82487759 0 0 1 14.66497778 5.70304691c3.80203107 3.82918865 5.70304692 8.71751457 5.70304693 14.66497778v122.20814827a19.82487759 19.82487759 0 0 1-5.70304693 14.66497776 19.82487759 19.82487759 0 0 1-14.66497778 5.70304693 19.82487759 19.82487759 0 0 1-14.66497778-5.70304693 19.82487759 19.82487759 0 0 1-5.70304693-14.66497776v-122.20814827a19.82487759 19.82487759 0 0 1 5.70304693-14.66497778 19.82487759 19.82487759 0 0 1 14.66497778-5.70304691zM797.1523459 512a19.82487759 19.82487759 0 0 1-5.70304692 14.66497778 19.82487759 19.82487759 0 0 1-14.66497779 5.70304693h-122.20814825a19.82487759 19.82487759 0 0 1-14.66497778-5.70304693 19.82487759 19.82487759 0 0 1-5.70304691-14.66497778 19.82487759 19.82487759 0 0 1 5.70304691-14.66497778 19.82487759 19.82487759 0 0 1 14.66497778-5.70304693h122.20814825a19.82487759 19.82487759 0 0 1 14.66497779 5.70304693c3.80203107 3.82918865 5.70304692 8.71751457 5.70304692 14.66497778z m-407.36049415 0a19.82487759 19.82487759 0 0 1-5.70304691 14.66497778 19.82487759 19.82487759 0 0 1-14.66497778 5.70304693h-122.20814827a19.82487759 19.82487759 0 0 1-14.66497776-5.70304693 19.82487759 19.82487759 0 0 1-5.70304693-14.66497778 19.82487759 19.82487759 0 0 1 5.70304693-14.66497778 19.82487759 19.82487759 0 0 1 14.66497776-5.70304693h122.20814827a19.82487759 19.82487759 0 0 1 14.66497778 5.70304693c3.80203107 3.82918865 5.70304692 8.71751457 5.70304691 14.66497778zM310.22076878 310.22076878a21.29137537 21.29137537 0 0 1 14.66497779-5.70304693c5.51294514 0 10.18401235 1.90101585 14.01320099 5.70304693l86.55052591 86.57768347a20.91117183 20.91117183 0 0 1 5.73020449 14.31193182 19.28172983 19.28172983 0 0 1-6.05609289 14.013201 19.11878565 19.11878565 0 0 1-14.013201 6.05609289 20.96548698 20.96548698 0 0 1-14.31193182-5.70304692L310.22076878 338.87178998a19.06447114 19.06447114 0 0 1-5.70304693-14.01320099c0-5.54010272 1.90101585-10.42842865 5.70304693-14.66497778z m288.32975775 288.32975775a19.79772001 19.79772001 0 0 1 14.3390894-6.35482371c5.29568642 0 10.04822572 2.11827457 14.31193182 6.38198066l86.57768347 86.55052651c3.80203107 3.80203107 5.70304692 8.47309828 5.70304691 14.01320102a19.55330372 19.55330372 0 0 1-6.05609225 14.31193182 19.66193339 19.66193339 0 0 1-14.31193245 6.05609288 19.01015661 19.01015661 0 0 1-14.01320099-5.70304692l-86.55052591-86.57768347a19.79772001 19.79772001 0 0 1-6.38198129-14.31193245c0-5.29568642 2.11827457-10.07538268 6.38198129-14.33908939zM713.77923122 310.22076878c3.80203107 4.26370672 5.70304692 9.15203265 5.70304693 14.66497779s-1.90101585 10.18401235-5.70304693 14.01320099l-86.57768347 86.55052591a20.91117183 20.91117183 0 0 1-14.31193182 5.73020449 19.28172983 19.28172983 0 0 1-14.013201-6.05609289 19.11878565 19.11878565 0 0 1-6.05609289-14.013201c0-5.29568642 1.90101585-10.07538268 5.70304692-14.31193182l86.57768348-86.57768347c3.80203107-3.80203107 8.50025585-5.70304692 14.01320099-5.70304693 5.54010272 0 10.40127108 1.90101585 14.66497779 5.70304693zM425.44947347 598.57768347a19.79772001 19.79772001 0 0 1 6.35482371 14.33908939c0 5.29568642-2.11827457 10.04822572-6.38198066 14.31193245L338.89894756 713.77923122a19.06447114 19.06447114 0 0 1-14.01320099 5.70304693 19.55330372 19.55330372 0 0 1-14.31193245-6.05609227 19.68909035 19.68909035 0 0 1-6.05609227-14.31193245 19.01015661 19.01015661 0 0 1 5.70304693-14.01320099l86.57768347-86.55052591a19.79772001 19.79772001 0 0 1 14.31193182-6.38198129c5.29568642 0 10.07538268 2.11827457 14.3390894 6.38198129z" fill="#000000" fill-opacity=".65" p-id="2894"></path></svg>
`;
var ti = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2s.9-2 2-2s2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2s2-.9 2-2s-.9-2-2-2z" fill="currentColor"></path></svg>
`;
var ei = `<svg t="1722595639920" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4708" width="32" height="32"><path d="M128 640V384a256 256 0 0 1 256-256h256a256 256 0 0 1 256 256v256a256 256 0 0 1-256 256H384a256 256 0 0 1-256-256z m64 0q0 79.552 56.256 135.744Q304.448 832 384 832h256q79.552 0 135.744-56.256Q832 719.552 832 640V384q0-79.552-56.256-135.744Q719.552 192 640 192H384q-79.552 0-135.744 56.256Q192 304.448 192 384v256z" p-id="4709"></path></svg>
`;
var ii = `<svg t="1722595280953" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4394" width="32" height="32"><path d="M128 384v256q0 12.608 1.28 25.088 1.216 12.544 3.648 24.832 2.432 12.352 6.08 24.384t8.448 23.68q4.864 11.584 10.752 22.72 5.952 11.072 12.928 21.504 7.04 10.496 14.976 20.224 8 9.728 16.896 18.56 8.896 8.96 18.56 16.896 9.728 8 20.224 14.976 10.432 7.04 21.504 12.928 11.136 5.888 22.72 10.688 11.648 4.864 23.68 8.512 12.032 3.648 24.32 6.08 12.352 2.432 24.896 3.712Q371.392 896 384 896h256q12.608 0 25.088-1.28 12.544-1.216 24.832-3.648 12.352-2.432 24.384-6.08t23.68-8.512q11.584-4.8 22.72-10.688 11.072-5.952 21.504-12.928 10.496-7.04 20.224-14.976 9.728-8 18.56-16.896 8.96-8.832 16.896-18.56 8-9.728 14.976-20.224 7.04-10.432 12.928-21.504 5.888-11.136 10.688-22.72 4.864-11.648 8.512-23.68 3.648-12.032 6.08-24.32 2.432-12.352 3.712-24.896Q896 652.608 896 640V384q0-12.608-1.28-25.088-1.216-12.544-3.648-24.832-2.432-12.352-6.08-24.384t-8.512-23.68q-4.8-11.584-10.688-22.72-5.952-11.072-12.928-21.504-7.04-10.496-14.976-20.224-8-9.664-16.896-18.56-8.832-8.96-18.56-16.896-9.728-8-20.224-14.976-10.432-7.04-21.504-12.928-11.136-5.888-22.72-10.752-11.648-4.8-23.68-8.448-12.032-3.648-24.32-6.08-12.352-2.432-24.896-3.712Q652.608 128 640 128H384q-12.608 0-25.088 1.28-12.544 1.216-24.832 3.648-12.352 2.432-24.384 6.08t-23.68 8.448q-11.584 4.864-22.72 10.752-11.072 5.952-21.504 12.928-10.496 7.04-20.224 14.976-9.664 8-18.56 16.896-8.96 8.896-16.896 18.56-8 9.728-14.976 20.224-7.04 10.432-12.928 21.504-5.888 11.136-10.752 22.72-4.8 11.648-8.448 23.68-3.648 12.032-6.08 24.32-2.432 12.352-3.712 24.896Q128 371.392 128 384z m566.016 166.336H330.112a38.4 38.4 0 0 1 0-76.8h363.904a38.4 38.4 0 0 1 0 76.8z" p-id="4395"></path></svg>
`;
var si = `<svg t="1722595946663" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4865" width="32" height="32"><path d="M128 640V384a256 256 0 0 1 256-256h256a256 256 0 0 1 256 256v256a256 256 0 0 1-256 256H384a256 256 0 0 1-256-256z" p-id="4866"></path><path d="M128 640V384a256 256 0 0 1 256-256h256a256 256 0 0 1 256 256v256a256 256 0 0 1-256 256H384a256 256 0 0 1-256-256z m64 0q0 79.552 56.256 135.744Q304.448 832 384 832h256q79.552 0 135.744-56.256Q832 719.552 832 640V384q0-79.552-56.256-135.744Q719.552 192 640 192H384q-79.552 0-135.744 56.256Q192 304.448 192 384v256z" fill="#DDE0EA" p-id="4867"></path></svg>
`;
var oi = `<svg t="1744798692576" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6606" width="200" height="200"><path d="M855.296 894.528H168.768v-76.8h686.528v76.8z m38.4-38.4q0 3.84-0.768 7.488-0.704 3.712-2.176 7.232-1.472 3.52-3.52 6.656-2.112 3.136-4.8 5.76-2.688 2.688-5.824 4.8-3.2 2.112-6.656 3.584-3.456 1.408-7.168 2.176-3.712 0.704-7.488 0.704-3.84 0-7.488-0.704-3.712-0.768-7.232-2.176-3.52-1.472-6.656-3.584-3.136-2.112-5.76-4.736-2.688-2.688-4.8-5.824-2.112-3.2-3.584-6.656-1.408-3.52-2.176-7.232-0.704-3.648-0.704-7.488 0-3.776 0.704-7.488 0.768-3.712 2.176-7.168 1.472-3.52 3.584-6.656 2.112-3.136 4.736-5.76 2.688-2.752 5.824-4.8 3.2-2.112 6.656-3.584 3.52-1.472 7.232-2.176 3.712-0.768 7.488-0.768 3.776 0 7.488 0.768 3.712 0.704 7.168 2.176 3.52 1.472 6.656 3.584 3.2 2.048 5.76 4.736 2.752 2.688 4.864 5.824 2.048 3.2 3.52 6.656 1.472 3.456 2.176 7.168 0.768 3.712 0.768 7.488z m-686.528 0q0 3.84-0.768 7.488-0.704 3.712-2.176 7.232-1.472 3.52-3.52 6.656-2.112 3.136-4.8 5.76-2.688 2.688-5.76 4.8-3.2 2.112-6.72 3.584-3.456 1.408-7.168 2.176-3.712 0.704-7.488 0.704-3.84 0-7.488-0.704-3.712-0.768-7.232-2.176-3.456-1.472-6.656-3.584-3.136-2.112-5.76-4.736-2.688-2.688-4.8-5.824-2.112-3.2-3.584-6.656-1.408-3.52-2.176-7.232-0.704-3.648-0.704-7.488 0-3.776 0.704-7.488 0.768-3.712 2.176-7.168 1.472-3.52 3.584-6.656 2.112-3.136 4.736-5.76 2.688-2.752 5.824-4.8 3.2-2.112 6.656-3.584 3.52-1.472 7.232-2.176 3.712-0.768 7.488-0.768 3.776 0 7.488 0.768 3.712 0.704 7.168 2.176 3.52 1.472 6.656 3.584 3.2 2.048 5.824 4.736 2.688 2.688 4.8 5.824 2.048 3.2 3.52 6.656 1.472 3.456 2.176 7.168 0.768 3.712 0.768 7.488zM652.032 211.2l-369.92 370.368v89.344h90.048l369.664-369.856L652.032 211.2z m-54.4-54.272q22.528-22.528 54.4-22.528 31.808 0 54.336 22.528l89.792 89.856q22.464 22.464 22.464 54.272t-22.464 54.272l-369.664 369.856q-22.464 22.528-54.336 22.528H282.24q-31.808 0-54.336-22.528-22.464-22.464-22.464-54.272V581.568q0-31.808 22.4-54.272l369.92-370.368z" p-id="6607"></path></svg>
`;
var ri = Bt.replace("fill=\"currentColor\" p-id=\"2016\"", "fill=\"#bec4c7\" p-id=\"2016\"");
var ni = Bt.replace("fill=\"currentColor\" p-id=\"2015\"", "fill=\"#bec4c7\" p-id=\"2015\"");
var ai = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "list", [
			{
				name: "loading",
				configName: "LOADING_ICON_SVG",
				configColorName: "LOADING_ICON_COLOR",
				svg: xe,
				color: "#4E5969"
			},
			{
				name: "expand",
				configName: "EXPAND_ICON_SVG",
				configColorName: "EXPAND_ICON_COLOR",
				svg: ut,
				color: "#4E5969"
			},
			{
				name: "shrink",
				configName: "SHRINK_ICON_SVG",
				configColorName: "SHRINK_ICON_COLOR",
				svg: qt,
				color: "#4E5969"
			},
			{
				name: "checkbox-uncheck",
				configName: "CHECKBOX_UNCHECK_SVG",
				configColorName: "CHECKBOX_UNCHECK_COLOR",
				svg: ei,
				color: ""
			},
			{
				name: "checkbox-check",
				configName: "CHECKBOX_CHECK_SVG",
				configColorName: "CHECKBOX_COLOR",
				svg: jt,
				color: "rgb(82,146,247)"
			},
			{
				name: "checkbox-indeterminate",
				configName: "CHECKBOX_INDETERMINATE_SVG",
				configColorName: "CHECKBOX_COLOR",
				svg: ii,
				color: "rgb(82,146,247)"
			},
			{
				name: "checkbox-check-disabled",
				configName: "CHECKBOX_CHECK_DISABLED_SVG",
				svg: jt,
				color: "#DDE0EA"
			},
			{
				name: "checkbox-disabled",
				configName: "CHECKBOX_DISABLED_SVG",
				configColorName: "CHECKBOX_DISABLED_COLOR",
				svg: si,
				color: "#F1F2F4"
			},
			{
				name: "icon-edit",
				configName: "ICON_EDIT_SVG",
				configColorName: "ICON_EDIT_COLOR",
				svg: oi,
				color: "#4E5969"
			},
			{
				name: "icon-select",
				configName: "ICON_SELECT_SVG",
				configColorName: "ICON_SELECT_COLOR",
				svg: qt,
				color: "#4E5969"
			},
			{
				name: "sort-asc",
				configName: "SORT_ASC_ICON_SVG",
				configColorName: "SORT_ICON_COLOR",
				svg: ri,
				color: "rgb(82,146,247)"
			},
			{
				name: "sort-desc",
				configName: "SORT_DESC_ICON_SVG",
				configColorName: "SORT_ICON_COLOR",
				svg: ni,
				color: "rgb(82,146,247)"
			},
			{
				name: "sort-default",
				configName: "SORTABLE_ICON_SVG",
				svg: Bt,
				color: "#bec4c7"
			},
			{
				name: "drag",
				configName: "DRAG_ROW_ICON_SVG",
				svg: ti,
				color: "#4E5969"
			}
		]);
		n(this, "icons", /* @__PURE__ */ new Map());
		this.ctx = t, this.init();
	}
	async init() {
		const t = [];
		for (let e = 0; e < this.list.length; e++) {
			const i = this.list[e];
			let s = i.color, o = i.svg;
			if (i.configColorName) {
				const a = this.ctx.config[i.configColorName];
				a && (s = a);
			}
			if (i.configName) {
				const a = this.ctx.config[i.configName];
				a && (o = a);
			}
			const r = this.createImageFromSVG(o, s).then((a) => {
				this.icons.set(i.name, a);
			});
			t.push(r);
		}
		for (let e = 0; e < this.ctx.config.ICONS.length; e++) {
			const i = this.ctx.config.ICONS[e];
			let s = i.color;
			const o = this.createImageFromSVG(i.svg, s, i.isBlob).then((r) => {
				this.icons.set(i.name, r);
			});
			t.push(o);
		}
		await Promise.all(t), this.ctx.emit("draw");
	}
	async createImageFromSVG(t, e, i = !1) {
		const r = new DOMParser().parseFromString(t, "image/svg+xml").documentElement;
		e && r.querySelectorAll("*").forEach((c) => {
			const f = c.getAttribute("fill");
			(f === "currentColor" || f === null) && c.setAttribute("fill", e);
		});
		const a = new Image();
		let l = "";
		if (i) {
			const c = new Blob([new XMLSerializer().serializeToString(r)], { type: "image/svg+xml" });
			l = URL.createObjectURL(c);
		} else l = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(r));
		return a.src = l, new Promise((c, f) => {
			a.onerror = () => f(/* @__PURE__ */ new Error("Failed to load image:" + t)), a.onload = () => {
				c(a);
			};
		});
	}
	get(t) {
		return this.icons.get(t);
	}
	getSvg(t) {
		return this.list.find((e) => e.name === t);
	}
};
var li = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "visibleHoverCell");
		n(this, "resizeObserver");
		n(this, "mutationObserver");
		this.ctx = t, this.init();
	}
	init() {
		this.resizeObserver = new ResizeObserver((t) => {
			this.ctx.emit("resetHeader"), this.ctx.emit("resizeObserver", t), this.ctx.emit("containerResize", this.ctx.containerElement);
		}), this.resizeObserver.observe(this.ctx.containerElement), this.mutationObserver = new MutationObserver((t) => {
			for (const e of t) e.type === "attributes" && e.attributeName === "class" && (this.ctx.config.updateCssVar(), this.ctx.emit("draw"));
		}), this.ctx.config.ENABLE_AUTO_THEME && this.mutationObserver.observe(document.documentElement, {
			attributes: !0,
			attributeFilter: ["class"]
		}), this.ctx.on("mousedown", (t) => {
			if (this.isBusy(t)) return;
			const { offsetY: e, offsetX: i } = this.ctx.getOffset(t), s = e, o = i;
			this.isInsideBody(o, s) || this.ctx.emit("mousedownBodyOutside", t), t.button === 0 && (this.handleHeaderEvent(o, s, this.ctx.header.renderCellHeaders, (r) => {
				this.ctx.focusCellHeader = r, this.ctx.focusCell = void 0, this.ctx.emit("cellHeaderMousedown", r, t);
			}), this.handleBodyEvent(o, s, this.ctx.body.renderRows, (r) => {
				this.ctx.setFocusCell(r), this.ctx.focusCellHeader = void 0, this.ctx.emit("cellMousedown", r, t);
			}, !0));
		}), this.ctx.on("mouseup", (t) => {
			if (t.button !== 0 || this.isBusy(t)) return;
			const { offsetY: e, offsetX: i } = this.ctx.getOffset(t), s = e, o = i;
			this.handleHeaderEvent(o, s, this.ctx.header.renderCellHeaders, (r) => {
				this.ctx.emit("cellHeaderMouseup", r, t);
			}), this.handleBodyEvent(o, s, this.ctx.body.renderRows, (r) => {
				this.ctx.emit("cellMouseup", r, t);
			});
		}), this.ctx.on("click", (t) => {
			if (t.button !== 0 || this.isBusy(t)) return;
			const e = this.ctx.getOffset(t).offsetY, i = this.ctx.getOffset(t).offsetX;
			this.handleHeaderEvent(i, e, this.ctx.header.renderCellHeaders, (s) => {
				this.ctx.clickCellHeader = s, this.ctx.emit("cellHeaderClick", s, t);
			}), this.handleBodyEvent(i, e, this.ctx.body.renderRows, (s) => {
				this.ctx.clickCell = s, this.ctx.emit("cellClick", s, t);
				const o = s.getImage("hover");
				!this.ctx.disableHoverIconClick && o && o.isInside(i, e) && this.ctx.emit("hoverIconClick", s);
			}, !0);
		}), this.ctx.on("dblclick", (t) => {
			if (t.button !== 0 || this.isBusy(t)) return;
			const e = this.ctx.getOffset(t).offsetY, i = this.ctx.getOffset(t).offsetX;
			this.handleHeaderEvent(i, e, this.ctx.header.renderCellHeaders, (s) => {
				this.ctx.emit("cellHeaderDblclick", s, t);
			}), this.handleBodyEvent(i, e, this.ctx.body.renderRows, (s) => {
				this.ctx.clickCell = s, this.ctx.emit("cellDblclick", s, t);
			});
		}), this.ctx.on("contextMenu", (t) => {
			if (this.isBusy(t)) return;
			const { offsetY: e, offsetX: i } = this.ctx.getOffset(t), s = e, o = i;
			this.handleHeaderEvent(o, s, this.ctx.header.renderCellHeaders, (r) => {
				this.ctx.emit("cellHeaderContextMenuClick", r, t);
			}), this.handleBodyEvent(o, s, this.ctx.body.renderRows, (r) => {
				this.ctx.emit("cellContextMenuClick", r, t);
			});
		}), this.ctx.on("mouseout", (t) => {
			!this.ctx.containerElement.contains(t.relatedTarget) && this.ctx.hoverCell !== void 0 && (this.ctx.hoverRow = void 0, this.ctx.hoverCell = void 0, this.ctx.emit("draw"));
		}), this.ctx.on("mousemove", (t) => {
			if (this.isBusy(t)) return;
			!this.ctx.mousedown && this.ctx.stageElement.style.cursor !== "default" && (this.ctx.stageElement.style.cursor = "default");
			const e = this.ctx.getOffset(t).offsetY, i = this.ctx.getOffset(t).offsetX;
			this.handleHeaderEvent(i, e, this.ctx.header.renderCellHeaders, (s) => {
				this.imageEnterAndLeave(s, t), this.ctx.emit("cellHeaderMouseenter", s, t), this.ctx.hoverCellHeader && this.ctx.hoverCellHeader !== s && this.ctx.emit("cellHeaderMouseleave", this.ctx.hoverCellHeader, t), this.ctx.hoverCellHeader !== s && (this.ctx.hoverCellHeader = s, this.visibleHoverCell = void 0, this.ctx.emit("cellHeaderHoverChange", s, t));
			}), this.handleBodyEvent(i, e, this.ctx.body.renderRows, (s) => {
				this.imageEnterAndLeave(s, t), this.visibleHoverCell !== s && (this.ctx.emit("visibleCellMouseleave", s, t), this.visibleHoverCell = s, this.ctx.hoverCellHeader = void 0, this.ctx.emit("visibleCellHoverChange", s, t));
			}, !0), this.handleBodyEvent(i, e, this.ctx.body.renderRows, (s) => {
				var o;
				this.ctx.emit("cellMouseenter", s, t), this.ctx.hoverCell && this.ctx.hoverCell !== s && this.ctx.emit("cellMouseleave", s, t), this.ctx.hoverCell !== s && (((o = this.ctx.hoverCell) == null ? void 0 : o.rowKey) !== s.rowKey && (this.ctx.hoverCell = s, this.ctx.hoverRow = this.ctx.body.renderRows.find((r) => r.rowKey === s.rowKey), this.ctx.emit("rowHoverChange", this.ctx.hoverRow, s, t), this.ctx.emit("draw")), this.ctx.hoverCell = s, this.ctx.emit("cellHoverChange", s, t));
			}), this.handleFooterEvent(i, e, this.ctx.footer.renderRows, (s) => {
				this.ctx.emit("cellFooterMouseenter", s, t), this.ctx.hoverCell && this.ctx.hoverCell !== s && this.ctx.emit("cellFooterMouseleave", s, t), this.ctx.emit("cellFooterHoverChange", s, t);
			});
		});
	}
	/**
	* 图标进入和离开事件，包括选中，展开，提示图标等
	* @param cell
	* @param e
	*/
	imageEnterAndLeave(t, e) {
		if (this.ctx.dragRowIng || this.ctx.dragHeaderIng || this.ctx.selectorMove || this.ctx.autofillMove) return;
		const { offsetY: i, offsetX: s } = this.ctx.getOffset(e), o = i, r = s;
		t.cellImages.forEach((a, l) => {
			a.isInside(r, o) && (l === "drag" ? this.ctx.stageElement.style.cursor = "grab" : this.ctx.stageElement.style.cursor = "pointer");
		});
	}
	isBusy(t) {
		const { offsetY: e, offsetX: i } = this.ctx.getOffset(t), s = e, o = i;
		if (this.ctx.loading || !this.ctx.isTarget(t) || this.ctx.stageElement.style.cursor === "row-resize" || this.ctx.stageElement.style.cursor === "col-resize" || this.ctx.columnResizing || this.ctx.rowResizing) return !0;
		const { SCROLLER_TRACK_SIZE: r } = this.ctx.config, a = V(this.ctx.config);
		return !!(this.ctx.scrollerMove || this.ctx.scrollerFocus || !a && s > this.ctx.stageHeight - r || !a && o > this.ctx.stageWidth - r);
	}
	handleBodyEvent(t, e, i, s, o = !1) {
		if (this.isInsideBody(t, e)) for (const r of i) {
			const a = r.fixedCells.concat(r.noFixedCells);
			for (const l of a) if (o ? l.isInsideVisible(t, e) : l.isInside(t, e)) {
				s(l);
				return;
			}
		}
	}
	handleHeaderEvent(t, e, i, s) {
		for (const o of i) if (o.isInside(t, e)) {
			s(o);
			return;
		}
	}
	handleFooterEvent(t, e, i, s) {
		for (const o of i) {
			const r = o.fixedCells.concat(o.noFixedCells);
			for (const a of r) if (a.isInside(t, e)) {
				s(a);
				return;
			}
		}
	}
	isInsideBody(t, e) {
		const { body: { y: i, visibleHeight: s, height: o, visibleWidth: r } } = this.ctx;
		return t > 0 && t < r && e > i && e < i + Math.min(o, s);
	}
	destroy() {
		this.resizeObserver.unobserve(this.ctx.stageElement), this.mutationObserver.disconnect();
	}
};
var ci = {
	numberErrorTip: "只允许输入数字",
	emptyText: "暂无数据",
	loadingText: "加载中...",
	copy: "复制",
	cut: "剪切",
	paste: "粘贴",
	clearSelected: "清空选中内容",
	fixedLeft: "左固定",
	fixedRight: "右固定",
	fixedNone: "取消固定",
	hide: "隐藏",
	visible: "显示",
	resetHeader: "恢复默认",
	invalidNumber: "请输入数字类型",
	mergeCellNoFill: "合并单元格不能填充",
	mergeCellNoCopy: "合并单元格不能复制",
	mergeCellNoPaste: "合并单元格不能粘贴",
	numberTruncated: "输入的数字已截取至小数点后{precision}位",
	batchSetItemValueError: "批量赋值错误",
	numberMin: "输入值小于{min}，已自动调整为{min}",
	numberMax: "输入值大于{max}，已自动调整为{max}",
	stringMaxlength: "输入值超过{maxlength}个字符，已自动截取"
};
var hi = class {
	constructor() {
		n(this, "langConfig");
	}
	use(t) {
		this.langConfig = t;
	}
	getText(t, e) {
		const i = { ...ci };
		Object.assign(i, Ht.locale, this.langConfig);
		const s = i[t];
		return s ? s.replace(/{(\w+)}/g, (o, r) => (e == null ? void 0 : e[r]) || o) : "";
	}
};
var di = class {
	constructor(t, e) {
		n(this, "eventBus");
		n(this, "eventBrowser");
		n(this, "eventTable");
		n(this, "locale", new hi());
		n(this, "containerElement");
		n(this, "stageElement");
		n(this, "canvasElement");
		n(this, "overlayerElement");
		n(this, "editorElement");
		n(this, "emptyElement");
		n(this, "contextMenuElement");
		n(this, "loadingElement");
		n(this, "stageWidth", 0);
		n(this, "stageHeight", 0);
		n(this, "paint");
		n(this, "icons");
		n(this, "domSelectionStr", "");
		n(this, "textSelectionStr", "");
		n(this, "textSelecting", !1);
		n(this, "isMouseoverTargetContainer", !1);
		n(this, "mousedown", !1);
		n(this, "isEmpty", !1);
		n(this, "rowResizing", !1);
		n(this, "columnResizing", !1);
		n(this, "scrollerMove", !1);
		n(this, "scrollerFocus", !1);
		n(this, "autofillMove", !1);
		n(this, "selectorMove", !1);
		n(this, "disableHoverIconClick", !1);
		n(this, "selectColsIng", !1);
		n(this, "selectRowsIng", !1);
		n(this, "dragHeaderIng", !1);
		n(this, "dragRowIng", !1);
		n(this, "finding", !1);
		n(this, "contextMenuIng", !1);
		n(this, "editing", !1);
		n(this, "loading", !1);
		n(this, "onlyMergeCell", !1);
		n(this, "selectOnlyOne", !1);
		n(this, "hasSelection", !1);
		n(this, "hasTree", !1);
		n(this, "scrollY", 0);
		n(this, "scrollX", 0);
		n(this, "fixedLeftWidth", 0);
		n(this, "fixedRightWidth", 0);
		n(this, "lastCenterColIndex", 0);
		n(this, "maxColIndex", 0);
		n(this, "maxRowIndex", 0);
		n(this, "hoverRow");
		n(this, "clickCell");
		n(this, "focusCell");
		n(this, "currentCell");
		n(this, "hoverCell");
		n(this, "clickCellHeader");
		n(this, "focusCellHeader");
		n(this, "hoverCellHeader");
		n(this, "mouseX", 0);
		n(this, "mouseY", 0);
		n(this, "body", {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			visibleHeight: 0,
			visibleWidth: 0,
			headIndex: 0,
			tailIndex: 0,
			visibleRows: [],
			renderRows: [],
			data: []
		});
		n(this, "footer", {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			visibleHeight: 0,
			visibleWidth: 0,
			renderRows: []
		});
		n(this, "header", {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			visibleHeight: 0,
			visibleWidth: 0,
			visibleLeafColumns: [],
			leafCellHeaders: [],
			allCellHeaders: [],
			renderLeafCellHeaders: [],
			renderCellHeaders: [],
			fixedLeftCellHeaders: [],
			fixedRightCellHeaders: [],
			renderCenterCellHeaders: []
		});
		n(this, "selector", {
			enable: !1,
			xArr: [-1, -1],
			yArr: [-1, -1],
			xArrCopy: [-1, -1],
			yArrCopy: [-1, -1]
		});
		n(this, "autofill", {
			enable: !1,
			xArr: [-1, -1],
			yArr: [-1, -1]
		});
		n(this, "finderBar", {
			text: "",
			rowIndex: -1,
			colIndex: -1,
			type: "body"
		});
		n(this, "database");
		n(this, "history");
		n(this, "config");
		const { containerElement: i, stageElement: s, canvasElement: o, overlayerElement: r, editorElement: a, emptyElement: l, loadingElement: c, contextMenuElement: f } = t;
		this.containerElement = i, s.tabIndex = 0, this.stageElement = s, this.canvasElement = o, this.overlayerElement = r, this.editorElement = a, this.emptyElement = l, this.loadingElement = c, this.contextMenuElement = f, this.config = new Ut(e.config || {}), this.eventBus = new Je(), this.eventBrowser = new Ze(this), this.eventTable = new li(this), this.paint = new Qe(this.canvasElement), this.database = new je(this, e), this.history = new qe(this), this.icons = new ai(this);
	}
	setConfig(t) {
		this.config = new Ut(t);
	}
	setItemValueByEditor(t, e, i, s = !0, o = !0, r = !0) {
		if (this.config.ENABLE_MERGE_CELL_LINK) {
			const a = this.database.getVirtualBodyCellByKey(t, e);
			if (a && (a.mergeRow || a.mergeCol)) {
				const { dataList: l } = a.getSpanInfo(), c = l.map((f) => ({
					...f,
					value: i
				}));
				this.database.batchSetItemValue(c, s, r);
				return;
			}
		}
		this.database.setItemValue(t, e, i, s, o, !0, r);
	}
	batchSetItemValueByEditor(t, e = !0, i = !0) {
		if (this.config.ENABLE_MERGE_CELL_LINK) {
			const s = [];
			t.forEach((o) => {
				const r = this.database.getRowIndexForRowKey(o.rowKey), a = this.database.getColIndexForKey(o.key);
				if (r === void 0 || a === void 0) return;
				const l = this.database.getVirtualBodyCell(r, a);
				if (l) {
					const { dataList: c } = l.getSpanInfo(), f = c.map((d) => ({
						...d,
						value: o.value
					}));
					s.push(...f);
				}
			}), this.database.batchSetItemValue(s, e, i);
		} else this.database.batchSetItemValue(t, e, i);
	}
	setFocusCell(t) {
		var e;
		if (this.focusCell !== t) {
			if (((e = this.focusCell) == null ? void 0 : e.rowKey) !== t.rowKey) {
				this.currentCell = t, this.emit("rowFocusChange", t);
				const i = {
					rowIndex: t.rowIndex,
					rowKey: t.rowKey,
					row: t.row
				};
				this.emit("currentRowChange", i);
			}
			this.focusCell = t, this.emit("cellFocusChange", t);
		}
	}
	clearSelector() {
		this.selector.enable = !1, this.selector.xArr = [-1, -1], this.selector.yArr = [-1, -1], this.emit("clearSelector");
	}
	clearSelectorCopy() {
		this.selector.xArrCopy = [-1, -1], this.selector.yArrCopy = [-1, -1];
	}
	clearAutofill() {
		this.autofill = {
			enable: !1,
			xArr: [-1, -1],
			yArr: [-1, -1]
		};
	}
	/**
	* 获取选中的数据
	* @returns
	*/
	getSelectedData() {
		var o;
		const t = [], e = this.selector.yArr, i = this.selector.xArr;
		let s = "";
		for (let r = 0; r <= e[1] - e[0]; r++) {
			const a = [];
			for (let l = 0; l <= i[1] - i[0]; l++) {
				const c = r + e[0], f = l + i[0], d = this.database.getVirtualBodyCell(c, f);
				if (d) if ((o = d == null ? void 0 : d.column) != null && o.formatterSelectorValue) {
					const { row: u, rowIndex: x, colIndex: w, column: E } = d, g = d.column.formatterSelectorValue({
						row: u,
						rowIndex: x,
						colIndex: w,
						column: E,
						value: d.getValue()
					});
					a.push(g);
				} else d.selectorCellValueType === "displayText" ? a.push(d.displayText) : a.push(d.getValue());
			}
			s += `${a.join("	")}\r`, t.push(a);
		}
		return s = s ? s.replace(/\r$/, "") : " ", {
			xArr: i,
			yArr: e,
			text: s,
			value: t
		};
	}
	setScroll(t, e) {
		let i = Math.floor(t);
		const s = this.body.width - this.body.visibleWidth;
		i < 0 ? i = 0 : i > s && (i = s);
		let o = Math.floor(e), r = this.body.height - this.body.visibleHeight;
		this.config.FOOTER_FIXED || (r = this.body.height + this.footer.height - this.body.visibleHeight), o < 0 ? o = 0 : o > r && (o = r), this.emit("setScroll", i, o);
	}
	setScrollX(t) {
		let e = Math.floor(t);
		const i = this.body.width - this.body.visibleWidth;
		e < 0 ? e = 0 : e > i && (e = i), this.emit("setScrollX", e);
	}
	setScrollY(t) {
		let e = Math.floor(t), i = 0;
		this.config.FOOTER_FIXED || (i = this.footer.height);
		const s = this.body.height - this.body.visibleHeight + i;
		e < 0 ? e = 0 : e > s && (e = s), this.emit("setScrollY", e);
	}
	startAdjustPosition(t) {
		this.emit("startAdjustPosition", t);
	}
	stopAdjustPosition() {
		this.emit("stopAdjustPosition");
	}
	isTarget(t) {
		return !!this.containerElement.contains(t.target);
	}
	getOffset(t) {
		const { left: e, top: i } = this.containerElement.getBoundingClientRect();
		return {
			offsetX: t.clientX - e,
			offsetY: t.clientY - i
		};
	}
	hasEvent(t) {
		return this.eventBus.has(t);
	}
	on(t, e) {
		this.eventBus.on(t, e);
	}
	once(t, e) {
		this.eventBus.once(t, e);
	}
	off(t, e) {
		this.eventBus.off(t, e);
	}
	emit(t, ...e) {
		this.eventBus.emit(t, ...e);
	}
	destroy() {
		this.eventTable.destroy(), this.eventBrowser.destroy(), this.eventBus.destroy();
	}
};
function Zt(h, t, e, i = t, s = 30) {
	if (h <= 0 || t <= 0 || e <= 0 || i <= 0) return 0;
	const o = Math.floor(t / e * i);
	return o < s ? Math.min(s, i) : o > i ? 0 : o;
}
function fi(h) {
	return h.shiftKey ? Math.abs(h.deltaX) > Math.abs(h.deltaY) ? h.deltaX : h.deltaY : h.deltaX;
}
var Jt = class {
	constructor(t, e) {
		n(this, "ctx");
		n(this, "type");
		n(this, "isFocus", !1);
		n(this, "trackX", 0);
		n(this, "trackY", 0);
		n(this, "trackWidth", 0);
		n(this, "trackHeight", 0);
		n(this, "splitPoints", []);
		n(this, "barX", 0);
		n(this, "barY", 0);
		n(this, "barWidth", 0);
		n(this, "barHeight", 0);
		n(this, "distance", 0);
		n(this, "visibleDistance", 0);
		n(this, "thumbTrackDistance", 0);
		n(this, "thumbTravelDistance", 0);
		n(this, "clientX", 0);
		n(this, "clientY", 0);
		n(this, "dragStart", 0);
		n(this, "innerVisible", !1);
		n(this, "innerShowTimer", 0);
		n(this, "isDragging", !1);
		n(this, "scroll", 0);
		this.ctx = t, this.type = e, this.type === "vertical" ? this.scroll = this.ctx.scrollY : this.scroll = this.ctx.scrollX;
	}
	onWheel(t) {
		this.updateScroll(t);
	}
	onTouchmove(t) {
		const { clientY: e, clientX: i } = t.touches[0], s = e - this.clientY, o = i - this.clientX;
		let r = 0;
		this.type === "vertical" ? (r = Math.max(0, Math.min(this.dragStart - s, this.distance)), this.hasScrollbar() && !(r === 0 && s > 0 || r === this.distance && s < 0) && t.preventDefault()) : this.type === "horizontal" && (r = Math.max(0, Math.min(this.dragStart - o, this.distance))), this.scroll = r;
	}
	onTouchstart(t) {
		const { clientY: e, clientX: i } = t.touches[0];
		this.clientX = i, this.clientY = e, this.dragStart = this.scroll;
	}
	onMouseDown(t) {
		if (!(t.target instanceof Element) || !this.ctx.isTarget(t)) return;
		if (this.ctx.stageElement.style.cursor === "row-resize" || this.ctx.stageElement.style.cursor === "col-resize") return !0;
		const { clientX: e, clientY: i } = t, { offsetX: s, offsetY: o } = this.ctx.getOffset(t);
		if (!(e == this.clientX && i == this.clientY) && !(this.isInnerMode() && !this.canInteractWithScrollbar())) {
			if (this.isOnScrollbar(s, o)) this.clientX = e, this.clientY = i, this.isDragging = !0, this.ctx.scrollerMove = !0, this.isFocus = !0, this.dragStart = this.scroll, t.preventDefault();
			else if (this.isOnTrack(s, o)) {
				let r = 0;
				this.type === "vertical" ? r = (o - this.ctx.header.height - this.barHeight / 2) / this.thumbTravelDistance * this.distance : r = (s - this.barWidth / 2) / this.thumbTravelDistance * this.distance, this.scroll = Math.max(0, Math.min(r, this.distance));
			}
		}
	}
	onMouseUp() {
		this.isDragging = !1, this.isFocus = !1, this.clientX = 0, this.clientY = 0;
	}
	onMouseMove(t, e) {
		const { clientX: i, clientY: s, buttons: o } = t, { offsetX: r, offsetY: a } = this.ctx.getOffset(t);
		let l = !1;
		if (Ve(this.ctx.config, e) ? this.startInnerShowTimer() : l = this.hideInnerScrollbar(), this.canInteractWithScrollbar() && (this.isOnScrollbar(r, a) || this.isOnTrack(r, a)) && e ? (this.isFocus = !0, this.ctx.stageElement.style.cursor = "pointer") : this.isFocus = !1, o === 0 || i == this.clientX && s == this.clientY) return l;
		let f = 0;
		if (this.type === "horizontal" ? f = i - this.clientX : f = s - this.clientY, this.isDragging && f !== 0) {
			let d = 0;
			this.type === "vertical" ? d = this.dragStart + f / this.thumbTravelDistance * this.distance : d = this.dragStart + f / this.thumbTravelDistance * this.distance, this.scroll = Math.max(0, Math.min(d, this.distance));
		}
		return l;
	}
	isPointInElement(t, e, i, s, o, r) {
		return t >= i && t <= i + o && e >= s && e <= s + r;
	}
	hasScrollbar() {
		return this.type === "vertical" ? this.barHeight > 0 : this.type === "horizontal" ? this.barWidth > 0 : !1;
	}
	isOnScrollbar(t, e) {
		return this.isPointInElement(t, e, this.barX, this.barY, this.barWidth, this.barHeight);
	}
	isOnTrack(t, e) {
		return this.isPointInElement(t, e, this.trackX, this.trackY, this.trackWidth, this.trackHeight);
	}
	isInnerMode() {
		return V(this.ctx.config);
	}
	shouldDrawInnerScrollbar() {
		return ze(this.ctx.config, {
			innerVisible: this.innerVisible,
			isFocus: this.isFocus,
			isDragging: this.isDragging
		});
	}
	canInteractWithScrollbar() {
		return !this.isInnerMode() || this.shouldDrawInnerScrollbar();
	}
	startInnerShowTimer() {
		if (!this.isInnerMode() || this.innerVisible || this.innerShowTimer) return;
		const t = Math.max(0, this.ctx.config.SCROLLBAR_SHOW_DELAY || 0);
		this.innerShowTimer = window.setTimeout(() => {
			this.innerVisible = !0, this.innerShowTimer = 0, this.ctx.emit("draw");
		}, t);
	}
	cancelInnerShowTimer() {
		this.innerShowTimer && (clearTimeout(this.innerShowTimer), this.innerShowTimer = 0);
	}
	hideInnerScrollbar() {
		if (!this.isInnerMode() || this.isDragging) return !1;
		const t = this.innerVisible || this.isFocus;
		return this.cancelInnerShowTimer(), this.innerVisible = !1, this.isFocus = !1, t;
	}
	updateScroll(t) {
		const e = t.deltaY;
		if (this.type === "vertical" && t.shiftKey === !1) this.hasScrollbar() && !(this.scroll === 0 && e < 0 || this.scroll === this.distance && e > 0) && t.preventDefault(), this.scroll = Math.max(0, Math.min(this.scroll + e, this.distance));
		else if (this.type === "horizontal") {
			const i = fi(t), s = this.hasScrollbar();
			i !== 0 && s && !(this.scroll === 0 && i < 0 || this.scroll === this.distance && i > 0) && t.preventDefault(), this.scroll = Math.max(0, Math.min(this.scroll + i, this.distance));
		}
	}
	updatedSize() {
		const { body: t, header: e, stageHeight: i, stageWidth: s, config: { SCROLLER_SIZE: o = 0, BORDER: r } } = this.ctx, a = B(this.ctx.config), l = de(this.ctx.config), c = s, f = i, d = e.height, u = e.width, x = t.height, w = this.ctx.footer.height, E = f - a - d, g = c - a, m = Math.max(0, x - E + w), y = Math.max(0, u - g), p = Ye(this.ctx.config);
		if (this.type === "vertical") {
			this.visibleDistance = E, this.distance = m;
			const R = Gt(this.ctx.config, y > 0);
			this.thumbTrackDistance = Math.max(0, this.visibleDistance - R), this.trackX = c - l, this.trackY = 0, this.splitPoints = [
				this.trackX,
				d,
				this.trackX + l,
				d
			], this.trackWidth = l, this.trackHeight = Math.max(0, f - R), this.barX = this.trackX - 1 + (l - o) / 2, this.barWidth = o, this.barHeight = Zt(this.distance, this.visibleDistance, x + w, this.thumbTrackDistance), this.thumbTravelDistance = Math.max(0, this.thumbTrackDistance - this.barHeight - p);
			const C = this.distance ? this.scroll / this.distance : 0;
			this.barY = d + C * this.thumbTravelDistance, this.scroll = Math.max(0, Math.min(this.scroll, this.distance));
		} else {
			this.visibleDistance = g, this.distance = y;
			const R = Gt(this.ctx.config, m > 0);
			this.thumbTrackDistance = Math.max(0, this.visibleDistance - R), this.splitPoints = [
				c - l,
				f - l,
				c - l,
				f
			];
			const C = St(r) ? 0 : .5;
			this.trackX = 0, this.trackY = f - l + C, this.trackWidth = Math.max(0, c - R), this.trackHeight = l, this.barWidth = Zt(this.distance, this.visibleDistance, u, this.thumbTrackDistance), this.thumbTravelDistance = Math.max(0, this.thumbTrackDistance - this.barWidth - p), this.barY = this.trackY - 1 + (l - o) / 2, this.barHeight = o;
			const b = this.distance ? this.scroll / this.distance : 0;
			this.barX = b * this.thumbTravelDistance, this.scroll = Math.max(0, Math.min(this.scroll, this.distance));
		}
	}
	draw() {
		const { config: { SCROLLER_FOCUS_COLOR: t, SCROLLER_COLOR: e, BORDER_COLOR: i, BORDER: s, SCROLLER_TRACK_COLOR: o } } = this.ctx;
		if (this.updatedSize(), this.isInnerMode() && !this.shouldDrawInnerScrollbar()) return this.isFocus || this.isDragging;
		const r = Ke(this.ctx.config), a = We(this.ctx.config), l = r && St(s) ? i : "transparent", c = this.hasScrollbar(), f = Ue(s, c);
		return a && f ? (this.ctx.paint.drawRect(this.trackX, this.trackY, this.trackWidth, this.trackHeight, { fillColor: o }), this.drawTrackHeaderBackground(), r && (this.ctx.paint.drawRect(this.trackX, this.trackY, this.trackWidth, this.trackHeight, { borderColor: l }), this.drawRightBoundaryBorder())) : a && this.drawInactiveTrackBackground(), c && this.ctx.paint.drawRect(this.barX, this.barY, this.barWidth, this.barHeight, {
			fillColor: this.isFocus || this.isDragging ? t : e,
			radius: 4
		}), r && f && this.splitPoints.length > 0 && this.ctx.paint.drawLine(this.splitPoints, {
			borderColor: l,
			borderWidth: 1
		}), this.isFocus || this.isDragging;
	}
	drawTrackHeaderBackground() {
		if (this.type !== "vertical" || this.trackWidth <= 0) return;
		const { header: t, config: { HEADER_BG_COLOR: e } } = this.ctx, i = Math.max(0, Math.min(t.height, this.trackHeight));
		i <= 0 || this.ctx.paint.drawRect(this.trackX, this.trackY, this.trackWidth, i, { fillColor: e });
	}
	drawInactiveTrackBackground() {
		if (this.type !== "vertical") return;
		const { footer: t, header: e, scrollY: i, stageHeight: s, config: { BODY_BG_COLOR: o, FOOTER_BG_COLOR: r, FOOTER_FIXED: a, FOOTER_POSITION: l, HEADER_BG_COLOR: c, SCROLLER_TRACK_SIZE: f = 0 } } = this.ctx, d = Math.max(0, s - f);
		if (d <= 0 || this.trackWidth <= 0 || (this.ctx.paint.drawRect(this.trackX, 0, this.trackWidth, d, { fillColor: o }), this.ctx.paint.drawRect(this.trackX, 0, this.trackWidth, e.height, { fillColor: c }), !t.height)) return;
		const u = a ? l === "top" ? e.height : d - t.height : t.y - i, x = Math.max(e.height, Math.min(u, d)), w = Math.max(0, Math.min(t.height, d - x));
		w > 0 && this.ctx.paint.drawRect(this.trackX, x, this.trackWidth, w, { fillColor: r });
	}
	drawRightBoundaryBorder() {
		const { stageHeight: t, config: { BORDER: e, BORDER_COLOR: i, SCROLLER_TRACK_SIZE: s = 0 } } = this.ctx;
		this.type;
	}
};
var ui = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "verticalScrollbar");
		n(this, "horizontalScrollbar");
		n(this, "mousedownHeader", !1);
		n(this, "adjustPositionX", "");
		n(this, "adjustPositionY", "");
		n(this, "timerX", 0);
		n(this, "timerY", 0);
		this.ctx = t, this.verticalScrollbar = new Jt(t, "vertical"), this.horizontalScrollbar = new Jt(t, "horizontal"), this.ctx.on("wheel", (e) => this.onWheel(e)), this.ctx.on("mousedown", (e) => this.onMouseDown(e)), this.ctx.on("mousemove", (e) => this.onMouseMove(e)), this.ctx.on("mouseup", () => this.onMouseUp()), this.ctx.on("mouseout", (e) => this.onMouseOut(e)), this.ctx.on("touchmove", (e) => this.onTouchmove(e)), this.ctx.on("touchstart", (e) => {
			this.onTouchstart(e);
		}), this.ctx.on("setScroll", (e, i) => {
			this.setScroll(e, i);
		}), this.ctx.on("setScrollX", (e) => {
			this.setScrollX(e);
		}), this.ctx.on("setScrollY", (e) => {
			this.setScrollY(e);
		}), this.ctx.on("scrollToIndex", (e, i, s = "body") => {
			this.scrollToIndex(e, i, s);
		}), this.ctx.on("cellHeaderMousedown", () => {
			this.mousedownHeader = !0;
		}), this.ctx.on("startAdjustPosition", (e) => {
			this.startAdjustPosition(e);
		}), this.ctx.on("stopAdjustPosition", () => {
			this.stopAdjustPosition();
		});
	}
	onWheel(t) {
		this.verticalScrollbar.onWheel(t), this.horizontalScrollbar.onWheel(t), this.draw();
	}
	onTouchmove(t) {
		this.verticalScrollbar.onTouchmove(t), this.horizontalScrollbar.onTouchmove(t), this.draw();
	}
	onTouchstart(t) {
		this.verticalScrollbar.onTouchstart(t), this.horizontalScrollbar.onTouchstart(t), this.draw();
	}
	onMouseDown(t) {
		this.verticalScrollbar.onMouseDown(t), this.horizontalScrollbar.onMouseDown(t), this.draw();
	}
	onMouseMove(t) {
		const e = this.ctx.containerElement.getBoundingClientRect(), i = t.clientX >= e.left && t.clientX <= e.right && t.clientY >= e.top && t.clientY <= e.bottom, s = this.verticalScrollbar.onMouseMove(t, i), o = this.horizontalScrollbar.onMouseMove(t, i);
		s || o ? this.ctx.emit("draw") : this.draw();
	}
	onMouseUp() {
		this.mousedownHeader = !1, this.verticalScrollbar.onMouseUp(), this.horizontalScrollbar.onMouseUp(), this.ctx.scrollerMove = !1;
	}
	onMouseOut(t) {
		this.ctx.containerElement.contains(t.relatedTarget) || (this.verticalScrollbar.hideInnerScrollbar(), this.horizontalScrollbar.hideInnerScrollbar(), this.ctx.emit("draw"));
	}
	draw() {
		const t = this.verticalScrollbar.draw(), e = this.horizontalScrollbar.draw();
		this.ctx.scrollerFocus = t || e;
		const i = Math.floor(this.horizontalScrollbar.scroll), s = Math.floor(this.verticalScrollbar.scroll);
		(i !== this.ctx.scrollX || s !== this.ctx.scrollY) && (this.ctx.emit("onScroll", i, s), i !== this.ctx.scrollX && this.ctx.emit("onScrollX", i), s !== this.ctx.scrollY && this.ctx.emit("onScrollY", s), this.ctx.scrollX = i, this.ctx.scrollY = s, this.ctx.emit("draw"));
	}
	setScroll(t, e) {
		this.horizontalScrollbar.scroll = t, this.verticalScrollbar.scroll = e, this.ctx.emit("draw"), this.ctx.emit("onScroll", t, e);
	}
	setScrollX(t) {
		this.horizontalScrollbar.scroll = t, this.ctx.emit("draw");
	}
	setScrollY(t) {
		this.verticalScrollbar.scroll = t, this.ctx.emit("draw");
	}
	scrollToColkey(t) {
		const { header: e } = this.ctx, i = e.leafCellHeaders.find((s) => s.key === t);
		i && this.setScrollX(i.x - e.visibleWidth / 2);
	}
	scrollToColIndex(t) {
		const { header: e } = this.ctx, i = e.leafCellHeaders.find((s) => s.colIndex === t);
		i && this.setScrollX(i.x - e.visibleWidth / 2);
	}
	scrollToRowIndex(t) {
		const { body: e, database: i } = this.ctx, { top: s } = i.getPositionForRowIndex(t);
		this.setScrollY(s - e.visibleHeight / 2);
	}
	scrollToFooterRowIndex(t) {
		const { body: e, config: i, footer: s } = this.ctx;
		if (i.FOOTER_FIXED) return;
		const o = s.renderRows.find((r) => r.rowIndex === t);
		o && this.setScrollY(o.y - e.y - (e.visibleHeight - o.height) / 2);
	}
	scrollToIndex(t, e, i = "body") {
		i === "body" ? this.scrollToRowIndex(t) : i === "footer" && this.scrollToFooterRowIndex(t), this.scrollToColIndex(e);
	}
	scrollToRowKey(t) {
		const { body: e, database: i } = this.ctx, s = i.getRowIndexForRowKey(t);
		if (s === void 0) return;
		const { top: o } = i.getPositionForRowIndex(s);
		this.setScrollY(o - e.visibleHeight / 2);
	}
	/**
	* 调整滚动条位置，让到达边界时自动滚动
	*/
	startAdjustPosition(t) {
		var r, a;
		const { offsetX: e, offsetY: i } = this.ctx.getOffset(t);
		let s = "", o = "";
		if (((r = this.ctx.focusCell) == null ? void 0 : r.fixed) !== "left" && e < this.ctx.fixedLeftWidth ? s = "left" : ((a = this.ctx.focusCell) == null ? void 0 : a.fixed) !== "right" && e > this.ctx.body.visibleWidth - this.ctx.fixedRightWidth ? s = "right" : (s = "", this.stopAdjustPosition(!0, !1)), !this.mousedownHeader && i < this.ctx.header.visibleHeight ? o = "top" : i > this.ctx.header.visibleHeight + this.ctx.body.visibleHeight ? o = "bottom" : (o = "", this.stopAdjustPosition(!1, !0)), s && this.adjustPositionX !== s) {
			this.adjustPositionX = s;
			let c = 10 * (s === "left" ? -1 : 1);
			this.timerX && (clearInterval(this.timerX), this.timerX = 0), this.timerX = setInterval(() => {
				c *= 1.5;
				const { scrollX: f } = this.ctx, d = f + c;
				(d < 0 || d > this.ctx.body.width) && (clearInterval(this.timerX), this.timerX = 0), this.ctx.setScrollX(d);
			}, 100);
		}
		if (o && this.adjustPositionY !== o) {
			this.adjustPositionY = o;
			let c = 10 * (o === "top" ? -1 : 1);
			this.timerY && (clearInterval(this.timerY), this.timerY = 0), this.timerY = setInterval(() => {
				c *= 1.5;
				const { scrollY: f } = this.ctx, d = f + c;
				(d < 0 || d > this.ctx.body.height) && (clearInterval(this.timerY), this.timerY = 0), this.ctx.setScrollY(d);
			}, 100);
		}
	}
	stopAdjustPosition(t = !0, e = !0) {
		t && (this.adjustPositionX = "", this.timerX && (clearInterval(this.timerX), this.timerX = 0)), e && (this.adjustPositionY = "", this.timerY && (clearInterval(this.timerY), this.timerY = 0));
	}
};
var xi = class extends fe {
	constructor(e, i, s, o, r, a, l) {
		super(e, s, o, r, a, "header", l.fixed);
		n(this, "align");
		n(this, "hideHeaderSelection", !1);
		n(this, "verticalAlign", "middle");
		n(this, "fixed");
		n(this, "minWidth");
		n(this, "maxWidth");
		n(this, "formatterFinderHeaderValue");
		n(this, "widthFillDisable");
		n(this, "type");
		n(this, "operation", !1);
		n(this, "editorType");
		n(this, "level");
		n(this, "text");
		n(this, "hide", !1);
		n(this, "displayText", "");
		n(this, "colspan");
		n(this, "rowspan");
		n(this, "row");
		n(this, "key");
		n(this, "required", !1);
		n(this, "readonly", !1);
		n(this, "ellipsis", !1);
		n(this, "overflowTooltipShow", !0);
		n(this, "children", []);
		n(this, "column");
		n(this, "colIndex");
		n(this, "rowKey");
		n(this, "rules");
		n(this, "hasChildren");
		n(this, "render");
		n(this, "style", {});
		n(this, "drawX", 0);
		n(this, "drawY", 0);
		n(this, "sortIconName", "sort-default");
		n(this, "sortAscIconName", "sort-asc");
		n(this, "sortDescIconName", "sort-desc");
		n(this, "visibleWidth", 0);
		n(this, "visibleHeight", 0);
		n(this, "maxLineClampHeader", "auto");
		n(this, "domDataset", {});
		n(this, "textOffsetRight", 0);
		n(this, "textOffsetLeft", 0);
		n(this, "textInfo");
		n(this, "drawTextX", 0);
		n(this, "drawTextY", 0);
		n(this, "drawTextWidth", 0);
		n(this, "drawTextHeight", 0);
		n(this, "drawCellBgColor", "");
		n(this, "drawTextColor", "");
		n(this, "drawTextFont", "");
		n(this, "drawSelectionImageX", 0);
		n(this, "drawSelectionImageY", 0);
		n(this, "drawSelectionImageWidth", 0);
		n(this, "drawSelectionImageHeight", 0);
		n(this, "drawSelectionImageName", "");
		n(this, "drawSelectionImageSource");
		n(this, "drawSortImageX", 0);
		n(this, "drawSortImageY", 0);
		n(this, "drawSortImageWidth", 0);
		n(this, "drawSortImageHeight", 0);
		n(this, "drawSortImageName", "");
		n(this, "drawSortImageSource");
		n(this, "renderHeaderType", "default");
		this.ctx = e, this.x = s, this.y = o, this.width = r, this.height = a, this.visibleWidth = r, this.visibleHeight = a, this.colIndex = i, this.key = l.key, this.minWidth = l.minWidth, this.maxWidth = l.maxWidth, this.formatterFinderHeaderValue = l.formatterFinderHeaderValue, this.hide = (typeof l.hide == "function" ? l.hide(l) : l.hide) || !1, this.type = l.type || "", this.editorType = l.editorType || "text", this.hideHeaderSelection = l.hideHeaderSelection || !1, this.align = l.headerAlign || l.align || this.ctx.config.COLUMNS_ALIGN, this.verticalAlign = l.headerVerticalAlign || l.verticalAlign || this.ctx.config.COLUMNS_VERTICAL_ALIGN, this.fixed = l.fixed || "", this.level = l.level || 0, this.operation = l.operation || !1, this.text = l.title, this.column = l, this.colspan = l.colspan || 1, this.widthFillDisable = l.widthFillDisable || !1, this.rowspan = l.rowspan || 1, this.rules = l.rules, this.readonly = typeof l.readonly == "boolean" ? l.readonly : !1, this.required = l.required || !1, this.sortIconName = l.sortIconName || "sort-default", this.sortAscIconName = l.sortAscIconName || "sort-asc", this.sortDescIconName = l.sortDescIconName || "sort-desc", this.rowKey = ae(), this.overflowTooltipShow = l.overflowTooltipHeaderShow !== !1, this.hasChildren = l.children && l.children.length > 0 || !1, this.render = l.renderHeader, this.maxLineClampHeader = l.maxLineClampHeader || "auto", this.renderHeaderType = l.renderHeaderType || "default";
	}
	/**
	* 是否可见，覆盖基类方法，表头是跟y滚动条没有关系的所以不需要加滚动参数
	* @returns
	*/
	isVerticalVisible() {
		const { stageHeight: e } = this.ctx, i = e;
		return !(this.y + this.height <= 0 || this.y >= i);
	}
	/**
	* 更新样式
	*/
	updateStyle() {
		this.style = this.getOverlayerViewsStyle();
	}
	updateContainer() {
		const { HEADER_CELL_STYLE_METHOD: e, HEADER_BG_COLOR: i, HEADER_TEXT_COLOR: s } = this.ctx.config;
		let o = i, r = s;
		if (typeof e == "function") {
			const { backgroundColor: f, color: d, font: u } = e({
				colIndex: this.colIndex,
				column: this.column
			}) || {};
			f && (o = f), d && (r = d), u && (this.drawTextFont = u);
		}
		const { colKey: a, type: l } = this.ctx.finderBar;
		l === "header" && a === this.key && (o = this.ctx.config.FINDER_CELL_BG_COLOR), this.drawCellBgColor = o, this.drawTextColor = r;
	}
	updateOffset() {
		this.column.sortBy && (this.textOffsetRight = 16), this.required && (this.textOffsetLeft = 12);
	}
	update() {
		this.updateContainer(), this.updateOffset(), this.displayText = this.getText(), this.drawX = this.getDrawX(), this.drawY = this.getDrawY(), this.drawTextX = this.drawX, this.drawTextY = this.drawY, this.drawTextWidth = this.width, this.drawTextHeight = this.height, this.updateSelection(), this.updateStyle();
	}
	draw() {
		this.drawEdge(), this.drawText(), this.drawBg(), this.updateSortIcon(), this.drawImages(), this.drawRequired();
	}
	drawImages() {
		this.getImages().forEach((e) => {
			e.visible && e.source && this.ctx.paint.drawImage(e.source, e.x, e.y, e.width, e.height);
		});
	}
	getFinderText() {
		const e = this.displayText;
		if (typeof this.formatterFinderHeaderValue != "function") return e;
		const i = this.formatterFinderHeaderValue({
			rowIndex: this.level,
			colIndex: this.colIndex,
			column: this.column,
			value: this.text,
			displayText: e
		});
		return i == null ? e : `${i}`;
	}
	drawEdge() {
		const { paint: e, config: i } = this.ctx, s = Pe(i), o = ft(i.BORDER) && s === void 0;
		e.drawRect(this.drawX, this.drawY, this.width, this.height, {
			borderColor: o ? i.BORDER_COLOR : void 0,
			fillColor: this.drawCellBgColor
		}), o || (this.drawColumnDivider(s), this.drawHorizontalDivider());
	}
	drawColumnDivider(e) {
		const { paint: i, header: s, config: o, fixedLeftWidth: r, fixedRightWidth: a, scrollX: l, stageWidth: c } = this.ctx;
		if (e === void 0) return;
		const f = l > 0 ? r : void 0, d = l < Math.floor(s.width - c - 1) ? s.width - a + B(o) : void 0, u = $e(this.fixed, this.x, this.width, s.width, {
			fixedLeftEnd: f,
			fixedRightStart: d
		});
		if (!u) return;
		const x = u === "left" ? this.drawX : this.drawX + this.visibleWidth;
		i.drawLine([
			x,
			this.drawY,
			x,
			this.drawY + this.visibleHeight
		], {
			borderColor: e,
			borderWidth: 1
		});
	}
	drawHorizontalDivider() {
		const { paint: e, config: i, header: s } = this.ctx;
		if (!ft(i.BORDER) || this.y + this.height >= s.height) return;
		const o = this.drawY + this.visibleHeight;
		e.drawLine([
			this.drawX,
			o,
			this.drawX + this.visibleWidth,
			o
		], {
			borderColor: i.BORDER_COLOR,
			borderWidth: 1
		});
	}
	drawText() {
		const { paint: e, config: { HEADER_FONT: i, CELL_PADDING: s } } = this.ctx, o = `${this.displayText}_${this.drawTextWidth}_${this.drawTextFont}`;
		this.ellipsis = e.drawText(this.displayText, this.drawTextX, this.drawTextY, this.drawTextWidth, this.drawTextHeight, {
			font: this.drawTextFont || i,
			padding: s,
			color: this.drawTextColor,
			align: this.align,
			verticalAlign: this.verticalAlign,
			maxLineClamp: this.maxLineClampHeader,
			offsetRight: this.textOffsetRight,
			offsetLeft: this.textOffsetLeft,
			cacheTextKey: o,
			textCallback: (r) => {
				this.textInfo = r;
			},
			layoutCallback: (r) => {
				this.ctx.emit("registerTextLayout", `${this.cellType}-${this.colIndex}-${this.level}`, r);
			}
		});
	}
	drawRequired() {
		if (!this.required || !this.textInfo) return;
		const { left: e, top: i, height: s } = this.textInfo, { paint: o, config: { REQUIRED_COLOR: r } } = this.ctx;
		o.drawText("*", e - 18, i + (s - 12) / 2, 24, 24, {
			color: r,
			font: "18px Arial",
			align: "center",
			verticalAlign: "middle",
			padding: 0
		});
	}
	drawBg() {
		if (this.ctx.dragHeaderIng) return;
		const { ENABLE_SELECTOR: e, ENABLE_SELECTOR_SINGLE: i } = this.ctx.config;
		let s = -1, o = -1;
		if (this.ctx.focusCellHeader && (s = this.ctx.focusCellHeader.colIndex, o = this.ctx.focusCellHeader.colIndex + this.ctx.focusCellHeader.colspan - 1), e && !i) {
			const { xArr: a } = this.ctx.selector;
			s = a[0], o = a[1];
		}
		const r = this.colspan + this.colIndex - 1;
		this.colIndex >= s && this.colIndex <= o && r <= o && this.ctx.paint.drawRect(this.drawX, this.drawY, this.width, this.height, {
			borderColor: "transparent",
			fillColor: this.ctx.config.SELECT_ROW_COL_BG_COLOR || "transparent"
		});
	}
	updateSelection() {
		if ([
			"index-selection",
			"selection",
			"selection-tree",
			"tree-selection"
		].includes(this.type)) {
			const { indeterminate: e, check: i, selectable: s } = this.ctx.database.getCheckedState(), { CHECKBOX_SIZE: o = 0, CELL_PADDING: r } = this.ctx.config;
			let a = this.drawX + (this.width - o) / 2, l = this.drawY + (this.height - o) / 2;
			this.drawTextX = a + o - r / 2, this.drawTextWidth = this.drawX + this.visibleWidth - this.drawTextX, (this.align === "left" || this.align === "right") && (a = this.drawX + r, this.drawTextX = a + o - r / 2, this.drawTextWidth = this.drawX + this.visibleWidth - this.drawTextX), this.verticalAlign === "top" ? l = this.drawY + r / 2 : this.verticalAlign === "bottom" && (l = this.drawY + this.height - o - r / 2), this.column.dragRow && (a += this.ctx.config.DRAG_ROW_ICON_SIZE, this.drawTextX += this.ctx.config.DRAG_ROW_ICON_SIZE, this.drawTextWidth -= this.ctx.config.DRAG_ROW_ICON_SIZE);
			let c = this.ctx.icons.get("checkbox-uncheck"), f = "checkbox-uncheck";
			e ? (c = this.ctx.icons.get("checkbox-indeterminate"), f = "checkbox-indeterminate") : i && s ? (c = this.ctx.icons.get("checkbox-check"), f = "checkbox-check") : i && !s ? (c = this.ctx.icons.get("checkbox-check-disabled"), f = "checkbox-check-disabled") : !i && s ? (c = this.ctx.icons.get("checkbox-uncheck"), f = "checkbox-uncheck") : (c = this.ctx.icons.get("checkbox-disabled"), f = "checkbox-disabled");
			const d = new Z(f, a, l, o, o, c);
			d.setVisible(!this.hideHeaderSelection), this.setImage("selection", d);
		}
	}
	updateSortIcon() {
		if (!this.column.sortBy || !this.textInfo) return;
		const { right: e, top: i, height: s } = this.textInfo, o = e + 4, r = i + (s - 16) / 2, a = 16;
		let l = this.sortIconName;
		const c = this.ctx.database.getSortState(this.key);
		c.direction === "asc" ? l = this.sortAscIconName : c.direction === "desc" && (l = this.sortDescIconName);
		const f = this.ctx.icons.get(l), d = new Z(l, o, r, a, a, f);
		this.setImage("sort", d);
	}
	getText() {
		return this.render && this.renderHeaderType === "default" || [
			"",
			null,
			void 0
		].includes(this.text) ? "" : `${this.text}`;
	}
	/**
	* 获取样式
	*/
	getOverlayerViewsStyle() {
		let e = "";
		return this.fixed === "left" ? e = `${this.drawX}px` : this.fixed === "right" ? e = `${this.drawX - (this.ctx.stageWidth - this.ctx.fixedRightWidth)}px` : e = `${this.drawX - this.ctx.fixedLeftWidth}px`, {
			position: "absolute",
			overflow: "hidden",
			left: e,
			top: `${this.drawY + 1}px`,
			width: `${this.width}px`,
			height: `${this.height - 2}px`,
			pointerEvents: "initial",
			userSelect: "none"
		};
	}
};
var ge = class {
	constructor(t, e) {
		n(this, "root");
		n(this, "key");
		n(this, "childrenKey");
		this.root = t, this.key = (e == null ? void 0 : e.key) || "key", this.childrenKey = (e == null ? void 0 : e.childrenKey) || "children";
	}
	getTree() {
		return this.root;
	}
	treeMove(t, e, i) {
		if (i === "none" || String(t) === String(e)) return;
		const s = this.findNodeWithParent(this.root, t);
		if (!s) return;
		const o = this.findNodeWithParent(this.root, e);
		if (!o) return;
		const { parent: r, index: a, node: l } = s, { parent: c, index: f, node: d } = o;
		if (this.isDescendant(l, e)) return;
		const u = r ? r[this.childrenKey] : this.root;
		if (u.splice(a, 1), r && u.length === 0 && delete r[this.childrenKey], i === "inside") {
			Array.isArray(d[this.childrenKey]) || (d[this.childrenKey] = []), d[this.childrenKey].push(l);
			return;
		}
		const x = c ? c[this.childrenKey] : this.root;
		let w = f;
		r === c && a < f && w--, i === "after" && w++, x.splice(w, 0, l);
	}
	getNodeKey(t) {
		return typeof this.key == "function" ? this.key(t) : t[this.key];
	}
	isSameKey(t, e) {
		return t == null || e === void 0 || e === null ? !1 : String(t) === String(e);
	}
	findNodeWithParent(t, e, i = null) {
		for (let s = 0; s < t.length; s++) {
			const o = t[s];
			if (this.isSameKey(this.getNodeKey(o), e)) return {
				parent: i,
				index: s,
				node: o
			};
			const r = o[this.childrenKey];
			if (Array.isArray(r)) {
				const a = this.findNodeWithParent(r, e, o);
				if (a) return a;
			}
		}
		return null;
	}
	isDescendant(t, e) {
		const i = t[this.childrenKey];
		if (!Array.isArray(i)) return !1;
		for (const s of i) if (this.isSameKey(this.getNodeKey(s), e) || this.isDescendant(s, e)) return !0;
		return !1;
	}
};
var gi = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "x", 0);
		n(this, "y", 0);
		n(this, "width", 0);
		n(this, "height", 0);
		n(this, "resizeTarget", null);
		n(this, "dragTarget", null);
		n(this, "dragingCell");
		n(this, "dragCellDiff", 0);
		n(this, "resizeNum", 0);
		n(this, "isResizing", !1);
		n(this, "clientX", 0);
		n(this, "resizeDiff", 0);
		n(this, "columnIndex", 0);
		n(this, "isMouseDown", !1);
		n(this, "columns");
		n(this, "visibleColumns");
		n(this, "visibleLeafColumns", []);
		n(this, "visibleHeight", 0);
		n(this, "visibleWidth", 0);
		n(this, "allCellHeaders", []);
		n(this, "leafCellHeaders", []);
		n(this, "renderLeafCellHeaders", []);
		n(this, "fixedLeftCellHeaders", []);
		n(this, "centerCellHeaders", []);
		n(this, "fixedRightCellHeaders", []);
		n(this, "renderCenterCellHeaders", []);
		n(this, "renderFixedCellHeaders", []);
		this.ctx = t, this.ctx.on("resetHeader", Nt(() => {
			this.init(), this.ctx.clearSelector(), this.ctx.emit("draw");
		}, 100)), this.init(), this.initSelection(), this.initSort(), this.initResizeColumn(), this.initDragColumn();
	}
	init(t = !1) {
		const { config: { HEADER_HEIGHT: e } } = this.ctx, i = B(this.ctx.config);
		if (!t) {
			const d = this.ctx.database.getColumns();
			this.columns = d;
		}
		this.allCellHeaders = [], this.leafCellHeaders = [], this.fixedLeftCellHeaders = [], this.fixedRightCellHeaders = [], this.centerCellHeaders = [], this.visibleColumns = le(this.columns);
		const s = ht(this.visibleColumns), o = st(this.visibleColumns);
		this.height = e * s, this.visibleHeight = this.height, this.width = o.reduce((d, u) => {
			const x = u.width || 100, { maxWidth: w, minWidth: E } = u;
			return w && x > w ? d + w : E && x < E ? d + E : d + x;
		}, 0), this.columnIndex = 0, this.resizeNum = 0;
		const r = Le(dt(this.visibleColumns, s));
		this.render(r, 0), this.ctx.database.updateColIndexKeyMap(this.leafCellHeaders);
		const a = this.ctx.containerElement.getBoundingClientRect();
		this.resizeNum > 0 ? this.ctx.stageWidth = Math.floor(a.width) : this.ctx.stageWidth = Math.min(Math.floor(this.width + i), Math.floor(a.width)), this.ctx.stageElement.style.width = `${this.ctx.stageWidth}px`, this.visibleWidth = this.ctx.stageWidth - i;
		const l = this.visibleWidth - this.width;
		if (this.resizeNum && l > 0) {
			const d = Math.floor(l / this.resizeNum * 100) / 100;
			this.resizeAllColumn(d);
		}
		const c = this.fixedLeftCellHeaders.filter((d) => !d.hasChildren);
		this.ctx.fixedLeftWidth = c.reduce((d, u) => d + u.width, 0);
		const f = this.fixedRightCellHeaders.filter((d) => !d.hasChildren);
		this.ctx.fixedRightWidth = f.reduce((d, u) => d + u.width, i), this.ctx.maxColIndex = this.leafCellHeaders.length - 1, this.ctx.header.x = this.x, this.ctx.header.y = this.y, this.ctx.header.width = this.width, this.ctx.header.height = this.height, this.ctx.header.allCellHeaders = this.allCellHeaders, this.ctx.header.visibleWidth = this.visibleWidth, this.ctx.header.visibleHeight = this.visibleHeight;
	}
	initSort() {
		this.ctx.on("cellHeaderClick", (t, e) => {
			if (!t.isImageInside("sort", e)) return;
			const { sortIconType: i = "up-down" } = t.column, s = t.getImageClickDirection("sort", e);
			let o = "none";
			const r = this.ctx.database.getSortState(t.key);
			function a(l, c) {
				return l === "none" ? c : l === c ? "none" : c;
			}
			i === "loop" ? r.direction === "none" ? o = "asc" : r.direction === "asc" ? o = "desc" : o = "none" : s && i === "up-down" ? s.includes("up") ? o = a(r.direction, "asc") : s.includes("down") && (o = a(r.direction, "desc")) : s && i === "left-right" && (s.includes("left") ? o = a(r.direction, "asc") : s.includes("right") && (o = a(r.direction, "desc"))), this.ctx.database.setSortState(t.key, o);
		});
	}
	initSelection() {
		this.ctx.on("cellHeaderClick", (t, e) => {
			if (this.ctx.stageElement.style.cursor !== "pointer" || !t.isImageInside("selection", e)) return;
			const i = t.getImage("selection");
			["checkbox-uncheck", "checkbox-indeterminate"].includes(i.name) ? this.ctx.database.toggleAllSelection() : i.name === "checkbox-check" && this.ctx.database.clearSelection(!0);
		});
	}
	initResizeColumn() {
		this.ctx.on("mousedown", (t) => {
			this.ctx.config.ENABLE_RESIZE_COLUMN && this.ctx.isTarget(t) && (this.clientX = t.clientX, this.resizeTarget ? (this.isResizing = !0, this.ctx.columnResizing = !0) : this.isResizing = !1, this.isMouseDown = !0);
		}), this.ctx.on("mouseup", () => {
			this.ctx.config.ENABLE_RESIZE_COLUMN && (this.isMouseDown = !1, this.resizeDiff !== 0 && this.resizeTarget && this.resizeColumn(this.resizeTarget, this.resizeDiff), this.resizeTarget = null, this.isResizing = !1, this.isMouseDown = !1, this.ctx.columnResizing = !1, this.clientX = 0, this.resizeDiff = 0);
		}), this.ctx.on("mousemove", (t) => {
			if (!this.ctx.config.ENABLE_RESIZE_COLUMN || this.ctx.editing) return;
			const { stageWidth: e, config: { RESIZE_COLUMN_MIN_WIDTH: i } } = this.ctx;
			if (this.isResizing && this.resizeTarget) {
				const s = this.resizeTarget.width, o = this.resizeTarget.minWidth, r = this.resizeTarget.maxWidth;
				let a = t.clientX - this.clientX;
				a + s < i && (a = -(s - i)), o && a + s < o && (a = -(s - o)), r && a + s > r && (a = r - s), this.resizeDiff = a, this.ctx.emit("draw");
			} else {
				if (this.resizeTarget = null, this.isMouseDown) return;
				const { offsetX: s } = this.ctx.getOffset(t);
				if (s < 0 || s > this.visibleWidth) {
					this.ctx.stageElement.style.cursor === "col-resize" && (this.ctx.stageElement.style.cursor = "default");
					return;
				}
				this.ctx.stageElement.style.cursor === "col-resize" && (this.ctx.stageElement.style.cursor = "default");
				const o = [...this.renderFixedCellHeaders, ...this.renderCenterCellHeaders];
				for (const r of o) {
					const { offsetX: a, offsetY: l } = this.ctx.getOffset(t), c = a, f = l, d = r.getDrawX(), u = r.getDrawY();
					if (c > d + r.width - 5 && c < d + r.width + 4 && c < e - 4 && f > u) {
						const x = r.colIndex + r.colspan - 1, w = this.leafCellHeaders.find((E) => E.colIndex === x);
						if (!w || !w.fixed && this.ctx.stageWidth - this.ctx.fixedRightWidth < d + r.width) return;
						this.ctx.isTarget(t) && l <= this.height && (this.ctx.stageElement.style.cursor = "col-resize", this.resizeTarget = w);
					}
				}
			}
		});
	}
	initDragColumn() {
		this.ctx.on("cellHeaderMousedown", (t) => {
			this.ctx.stageElement.style.cursor === "default" && this.ctx.config.ENABLE_DRAG_COLUMN && (t.column.dragDisabled || (this.dragTarget === t ? (this.ctx.dragHeaderIng = !0, this.dragCellDiff = this.ctx.mouseX - t.drawX, this.ctx.stageElement.style.cursor = "grabbing") : (this.dragTarget = t, this.ctx.dragHeaderIng = !1)));
		}), this.ctx.on("cellMousedown", () => {
			this.ctx.config.ENABLE_DRAG_COLUMN && (this.dragTarget = null, this.ctx.dragHeaderIng = !1);
		}), this.ctx.on("mouseup", () => {
			if (this.ctx.config.ENABLE_DRAG_COLUMN) {
				if (this.dragingCell && this.dragTarget) {
					const t = (c, f = {}) => (c.forEach((d, u) => {
						d.children && t(d.children, f), f[d.key] = u;
					}), f), e = this.ctx.database.getColumns(), i = dt(e, ht(e)), s = new ge(i, {
						key: "key",
						childrenKey: "children"
					}), o = this.dragTarget.colIndex > this.dragingCell.colIndex ? "before" : "after";
					s.treeMove(this.dragTarget.column.key, this.dragingCell.column.key, o);
					const a = t(s.getTree());
					this.ctx.database.setCustomHeader({ sortData: a }), this.init();
					const l = {
						source: this.dragTarget,
						target: this.dragingCell,
						columns: i
					};
					this.ctx.emit("columnDragChange", l);
				}
				this.ctx.dragHeaderIng && this.dragTarget && (this.ctx.stageElement.style.cursor === "grabbing" && (this.ctx.stageElement.style.cursor = "default"), this.ctx.dragHeaderIng = !1, this.dragTarget = null, this.dragingCell = void 0, this.dragCellDiff = 0, this.ctx.clearSelector(), this.ctx.focusCellHeader = void 0, this.ctx.emit("draw"));
			}
		}), this.ctx.on("mousemove", (t) => {
			this.ctx.config.ENABLE_DRAG_COLUMN && (!this.ctx.dragHeaderIng || !this.dragTarget || (this.dragTarget.fixed || this.ctx.startAdjustPosition(t), this.ctx.emit("draw")));
		}), this.ctx.on("cellHoverChange", (t) => {
			this.ctx.config.ENABLE_DRAG_COLUMN && (t.column.dragDisabled || (this.dragingCell = this.getDragCellHeader(t.colIndex)));
		}), this.ctx.on("cellHeaderHoverChange", (t) => {
			this.ctx.config.ENABLE_DRAG_COLUMN && (t.column.dragDisabled || (this.dragingCell = this.getDragCellHeader(t.colIndex)));
		});
	}
	getDragCellHeader(t) {
		if (!this.dragTarget || !this.ctx.dragHeaderIng) return;
		const { column: { parentKey: e }, key: i, level: s, fixed: o } = this.dragTarget, r = this.allCellHeaders.find((a) => a.key !== i && a.fixed === o && a.column.level === s && a.column.parentKey === e && a.colIndex <= t && a.colIndex + a.colspan - 1 >= t);
		if (this.ctx.dragHeaderIng) {
			const a = r ? "grabbing" : "not-allowed";
			this.ctx.stageElement.style.cursor = a;
		}
		return r;
	}
	resizeColumn(t, e) {
		const i = (r) => {
			r.forEach((a) => {
				if (a.children && a.children.length > 0 && i(a.children), a.key === t.key) a.width = (a.width || 100) + e;
			});
		};
		i(this.columns);
		let s = 0;
		if (this.width < this.visibleWidth) {
			const r = this.visibleWidth - this.width;
			s = Math.floor(r / this.resizeNum * 100) / 100, this.resizeAllColumn(s);
		}
		const o = t.width + e + s;
		this.ctx.emit("resizeColumnChange", {
			colIndex: t.colIndex,
			key: t.key,
			oldWidth: t.width,
			width: o,
			column: t.column,
			columns: this.columns
		}), this.ctx.database.setCustomHeaderResizableData(t.key, o), this.init(!0), this.ctx.emit("draw");
	}
	resizeAllColumn(t) {
		if (t === 0) return;
		const e = /* @__PURE__ */ new Map();
		let i = !0;
		for (const o of this.allCellHeaders) if (o.widthFillDisable) e.set(o.key, o.width);
		else {
			const r = o.width + t * o.colspan;
			e.set(o.key, r), r < this.ctx.config.RESIZE_COLUMN_MIN_WIDTH && (i = !1);
		}
		if (!i) return;
		const s = (o) => {
			o.forEach((r) => {
				e.has(r.key) && (r.width = e.get(r.key)), r.children && r.children.length > 0 && s(r.children);
			});
		};
		s(this.columns), this.init(!0), this.ctx.emit("draw");
	}
	getCustomHeader() {
		const t = this.ctx.database.getColumns(), e = this.ctx.database.getCustomHeader(), { sortData: i = {} } = e;
		return Object.keys(i).length === 0 ? {
			columns: t,
			customHeader: e
		} : {
			columns: dt(t, ht(t)),
			customHeader: e
		};
	}
	render(t, e) {
		const i = t.length;
		let s = e;
		const { HEADER_HEIGHT: o = 0 } = this.ctx.config;
		for (let r = 0; r < i; r++) {
			const a = t[r], l = o * (a.rowspan || 0), c = o * (a.level || 0);
			let { minWidth: f, maxWidth: d } = a, u = a.width || 100;
			f && u < f && (u = f), d && u > d && (u = d), a.children && (u = st(a.children).reduce((E, g) => E + ((g == null ? void 0 : g.width) || 100), 0));
			const x = new xi(this.ctx, this.columnIndex, s, c, u, l, a);
			this.ctx.database.setHeader(a.key, x), this.allCellHeaders.push(x), a.children || (this.leafCellHeaders.push(x), x.column.widthFillDisable || this.resizeNum++), a.fixed === "left" ? this.fixedLeftCellHeaders.push(x) : a.fixed === "right" ? this.fixedRightCellHeaders.push(x) : this.centerCellHeaders.push(x), !a.children && this.columnIndex++, a.children && this.render(a.children, s), s += u;
		}
	}
	drawTipLine() {
		if (this.isResizing && this.resizeTarget) {
			const { stageHeight: t, config: { RESIZE_COLUMN_LINE_COLOR: e, RESIZE_COLUMN_TEXT_COLOR: i, RESIZE_COLUMN_TEXT_BG_COLOR: s, ENABLE_RESIZE_COLUMN_TEXT: o } } = this.ctx, r = this.resizeTarget.getDrawX(), a = this.resizeTarget.width, l = r + a + this.resizeDiff - .5, c = [
				l - .5,
				0,
				l - .5,
				t
			];
			if (this.ctx.paint.drawLine(c, { borderColor: e }), o) {
				const d = `${Math.floor(a + this.resizeDiff)}px`, u = 45, x = 24;
				this.ctx.paint.drawRect(l + u / 2, this.ctx.mouseY - x / 2, u, x, {
					fillColor: s,
					borderWidth: 0,
					borderColor: "transparent"
				}), this.ctx.paint.drawText(d, l + u / 2, this.ctx.mouseY - x / 2, u, 26, {
					padding: 0,
					color: i,
					align: "center",
					verticalAlign: "middle"
				});
			}
		}
	}
	drawDragTip() {
		if (this.dragTarget && this.ctx.dragHeaderIng) {
			const { DRAG_TIP_BG_COLOR: t, DRAG_TIP_LINE_COLOR: e } = this.ctx.config, i = this.dragTarget.width;
			if (this.ctx.paint.drawRect(this.ctx.mouseX - this.dragCellDiff, this.visibleHeight, i, this.ctx.body.visibleHeight, {
				fillColor: t,
				borderWidth: 0,
				borderColor: "transparent"
			}), this.dragingCell) {
				const { drawX: s, drawY: o, visibleWidth: r, colIndex: a } = this.dragingCell;
				let l = s, c = o;
				a > this.dragTarget.colIndex && (l = s + r), a === 0 && (l = l + 1), a === this.ctx.maxColIndex && (l = l - 1);
				const f = [
					l,
					c,
					l,
					this.ctx.stageHeight
				], d = [
					l - 4,
					c,
					l + 4,
					c,
					l,
					c + 6,
					l - 4,
					c
				];
				this.ctx.paint.drawLine(d, {
					borderColor: e,
					borderWidth: 1.2,
					fillColor: e
				}), this.ctx.paint.drawLine(f, {
					borderColor: e,
					borderWidth: 1.2
				});
			}
		}
	}
	drawFixedShadow() {
		const { fixedLeftWidth: t, fixedRightWidth: e, scrollX: i, header: s, stageWidth: o, config: { HEADER_BG_COLOR: r, FIXED_COLUMN_SHADOW_COLOR: a, FIXED_COLUMN_SHADOW_FADE_COLOR: l, FIXED_COLUMN_SHADOW_WIDTH: c } } = this.ctx, f = B(this.ctx.config);
		if (i > 0 && t !== 0 && this.ctx.paint.drawShadow(this.x, this.y, t, this.height, {
			fillColor: r,
			side: "right",
			shadowWidth: c,
			colorStart: a,
			colorEnd: l
		}), i < Math.floor(s.width - o - 1) && e !== f) {
			const d = s.width - (this.x + this.width) + o - e;
			this.ctx.paint.drawShadow(d, this.y, e, this.height, {
				fillColor: r,
				side: "left",
				shadowWidth: c,
				colorStart: l,
				colorEnd: a
			});
		}
	}
	update() {
		const t = [], e = [], i = [];
		if (this.centerCellHeaders.length) {
			const s = this.centerCellHeaders[this.centerCellHeaders.length - 1];
			this.ctx.lastCenterColIndex = s.colIndex;
		}
		this.centerCellHeaders.forEach((s) => {
			s.isHorizontalVisible() && s.isVerticalVisible() && (e.push(s), s.hasChildren || t.push(s));
		}), this.fixedLeftCellHeaders.forEach((s) => {
			i.push(s), s.hasChildren || t.push(s);
		}), this.fixedRightCellHeaders.forEach((s) => {
			i.push(s), s.hasChildren || t.push(s);
		}), this.renderCenterCellHeaders = e, this.renderFixedCellHeaders = i, this.renderLeafCellHeaders = t.sort((s, o) => s.x - o.x), this.visibleLeafColumns = this.renderLeafCellHeaders.map((s) => s.column), this.ctx.header.visibleLeafColumns = this.visibleLeafColumns, this.ctx.header.leafCellHeaders = this.leafCellHeaders, this.ctx.header.renderLeafCellHeaders = this.renderLeafCellHeaders, this.ctx.header.renderCellHeaders = this.renderFixedCellHeaders.concat(this.renderCenterCellHeaders);
	}
	drawBottomLine() {
		const { stageWidth: t, config: e } = this.ctx, { BORDER: i } = e;
		if (!kt(i)) return;
		const s = [
			0,
			this.height,
			t,
			this.height
		];
		this.ctx.paint.drawLine(s, {
			borderColor: e.BORDER_COLOR,
			borderWidth: 1
		});
	}
	draw() {
		this.renderCenterCellHeaders.forEach((t) => {
			t.update(), t.draw();
		}), this.drawFixedShadow(), this.renderFixedCellHeaders.forEach((t) => {
			t.update(), t.draw();
		}), this.drawBottomLine(), this.drawTipLine(), this.drawDragTip();
	}
};
var we = class {
	constructor(t, e, i = 0, s = 0, o = 0, r = 0, a, l = "body") {
		n(this, "ctx");
		n(this, "x", 0);
		n(this, "y", 0);
		n(this, "width", 0);
		n(this, "height");
		n(this, "cells", []);
		n(this, "fixedCells", []);
		n(this, "noFixedCells", []);
		n(this, "calculatedHeightCells", []);
		n(this, "rowIndex", 0);
		n(this, "rowKey", "");
		n(this, "rowType", "body");
		n(this, "data");
		n(this, "calculatedHeight", -1);
		this.ctx = t, this.x = i, this.y = s, this.width = o, this.height = r, this.rowIndex = e, this.rowKey = t.database.getRowKeyForRowIndex(e) || "", this.rowType = l, this.data = a, this.update();
	}
	update() {
		const { header: t } = this.ctx, e = [], i = [], s = [], o = [];
		t.renderLeafCellHeaders.forEach((r) => {
			const a = new ue(this.ctx, this.rowIndex, r.colIndex, r.x, this.y, r.width, this.height, r.column, this.data, this.rowType);
			a.fixed ? i.push(a) : s.push(a), e.push(a), a.autoRowHeight && o.push(a);
		}), this.cells = e, this.calculatedHeightCells = o, this.fixedCells = i, this.noFixedCells = s;
	}
	updateCalculatedHeight() {
		const t = this.calculatedHeightCells.map((e) => {
			const i = e.getAutoHeight(), { key: s, height: o = -1 } = this.ctx.database.getMaxRowHeightItem(this.rowKey) || {};
			return i > o ? this.ctx.database.setMaxRowHeightItem(this.rowKey, e.key, i) : e.key === s && i < o && this.ctx.database.setMaxRowHeightItem(this.rowKey, e.key, i), i;
		});
		return this.calculatedHeight = t.length ? Math.max(...t) : -1, this.calculatedHeight;
	}
	drawCenter() {
		this.noFixedCells.forEach((t) => {
			t.draw();
		});
	}
	drawFixed() {
		this.fixedCells.forEach((t) => {
			t.draw();
		});
	}
	drawContainer() {
		this.noFixedCells.forEach((t) => {
			t.drawContainer();
		});
	}
	drawFixedContainer() {
		this.fixedCells.forEach((t) => {
			t.drawContainer();
		});
	}
	drawHorizontalBorder() {
		this.noFixedCells.forEach((t) => {
			t.drawHorizontalBorder();
		});
	}
	drawFixedHorizontalBorder() {
		this.fixedCells.forEach((t) => {
			t.drawHorizontalBorder();
		});
	}
};
var wi = class {
	constructor(t) {
		n(this, "resizeTarget", null);
		n(this, "dragSource", null);
		n(this, "dragTarget", null);
		n(this, "dragRowDiff", 0);
		n(this, "dragPosition", "none");
		n(this, "isMouseDown", !1);
		n(this, "resizeDiff", 0);
		n(this, "clientY", 0);
		n(this, "ctx");
		n(this, "x", 0);
		n(this, "y", 0);
		n(this, "width", 0);
		n(this, "height", 0);
		n(this, "headIndex", 0);
		n(this, "tailIndex", 0);
		n(this, "isResizing", !1);
		n(this, "renderRows", []);
		n(this, "visibleRows", []);
		n(this, "visibleHeight", 0);
		n(this, "visibleWidth", 0);
		n(this, "containerRect");
		n(this, "data", []);
		this.ctx = t, this.init(), this.initTree(), this.initSelection(), this.initResizeRow(), this.initDragRow();
	}
	init() {
		const { canvasElement: t, header: e, footer: i, database: s, config: { FOOTER_FIXED: o, HEIGHT: r, EMPTY_BODY_HEIGHT: a = 0, MAX_HEIGHT: l = 0, ENABLE_OFFSET_HEIGHT: c = 0, OFFSET_HEIGHT: f = 0, FOOTER_POSITION: d } } = this.ctx, u = B(this.ctx.config);
		if (!e.width) return;
		this.x = 0, d === "top" && o ? this.y = e.height + i.height : this.y = e.height;
		const { data: x, sumHeight: w } = s.getData();
		this.height = w, this.data = x, this.width = e.width, this.visibleWidth = this.ctx.stageWidth - u;
		const E = this.ctx.footer.height;
		this.ctx.isEmpty = !this.data.length, !this.data.length && !r ? this.height = a : !this.data.length && r && (this.height = r - e.height - E - u);
		let g = this.height + e.height + u;
		g += E;
		let m = g;
		const y = window.innerHeight, { top: p } = this.containerRect || this.ctx.containerElement.getBoundingClientRect();
		if (y > p && c && !r) {
			const O = y - p - f;
			O > e.height + u ? m = O : g > l && (m = l);
		} else this.data.length && r ? m = r : this.data.length && l && g > l && (m = l);
		m > 0 && (this.ctx.stageHeight = Math.floor(m), this.ctx.stageElement.style.height = `${this.ctx.stageHeight}px`);
		let R = this.ctx.stageHeight - e.height - u;
		o ? this.visibleHeight = R - E : this.visibleHeight = R, this.data.length || (this.height = this.visibleHeight), this.ctx.body.x = this.x, this.ctx.body.y = this.y, this.ctx.body.width = this.width, this.ctx.body.height = this.height, this.ctx.body.visibleWidth = this.visibleWidth, this.ctx.body.visibleHeight = this.visibleHeight, this.ctx.body.data = x;
		const C = window.devicePixelRatio || 1, b = this.ctx.stageWidth * C, _ = this.ctx.stageHeight * C;
		t.width = Math.round(b), t.height = Math.round(_);
		const T = this.data.length ? "not-empty" : "empty";
		this.ctx.emit("emptyChange", {
			isEmpty: T,
			type: T,
			headerHeight: e.height,
			bodyHeight: this.height,
			footerHeight: E,
			width: this.width,
			height: this.data.length ? 0 : a + E
		});
		const v = Math.round(t.width / C * 1e4) / 1e4, I = Math.round(t.height / C * 1e4) / 1e4;
		this.ctx.canvasElement.setAttribute("style", `height:${I}px;width:${v}px;`), this.ctx.paint.scale(C);
	}
	initTree() {
		this.ctx.on("cellClick", (t, e) => {
			if (this.ctx.stageElement.style.cursor !== "pointer" || !t.isImageInside("tree", e)) return;
			const { expand: s = !1, expandLazy: o = !1 } = this.ctx.database.getRowForRowKey(t.rowKey) || {}, { EXPAND_LAZY: r, EXPAND_LAZY_METHOD: a } = this.ctx.config;
			if (r && a && !s && !o) typeof a == "function" && (this.ctx.database.expandLoading(t.rowKey, !0), a({
				row: t.row,
				rowIndex: t.rowIndex,
				colIndex: t.colIndex,
				column: t.column,
				value: t.getValue()
			}).then((c) => {
				this.ctx.database.setExpandChildren(t.rowKey, c), this.ctx.database.expandLoading(t.rowKey, !1), this.ctx.emit("expandChange", this.ctx.database.getExpandRowKeys());
			}).catch((c) => {
				this.ctx.database.expandLoading(t.rowKey, !1), console.error(c);
			}));
			else {
				const l = this.ctx.database.getIsExpand(t.rowKey);
				this.ctx.database.expandItem(t.rowKey, !l), this.ctx.emit("expandChange", this.ctx.database.getExpandRowKeys());
			}
		});
	}
	initSelection() {
		this.ctx.on("cellClick", (t, e) => {
			this.ctx.stageElement.style.cursor !== "pointer" || !t.isImageInside("selection", e) || !this.ctx.database.getRowSelectable(t.rowKey) || this.ctx.database.toggleRowSelection(t.rowKey, t.type);
		});
	}
	initResizeRow() {
		this.ctx.on("resize", () => {
			this.ctx.config.ENABLE_RESIZE_ROW && (this.containerRect = this.ctx.containerElement.getBoundingClientRect());
		}), this.ctx.on("resizeObserver", () => {
			this.ctx.config.ENABLE_RESIZE_ROW && (this.containerRect = this.ctx.containerElement.getBoundingClientRect());
		}), this.ctx.on("mouseup", () => {
			this.ctx.config.ENABLE_RESIZE_ROW && (this.isMouseDown = !1, this.resizeDiff !== 0 && this.resizeTarget && this.resizeRow(this.resizeTarget, this.resizeDiff), this.resizeTarget = null, this.resizeDiff = 0, this.isResizing = !1, setTimeout(() => {
				this.ctx.rowResizing = !1;
			}, 0), this.clientY = 0);
		}), this.ctx.on("mousedown", (t) => {
			this.ctx.config.ENABLE_RESIZE_ROW && this.ctx.isTarget(t) && (this.clientY = t.clientY, this.resizeTarget ? (this.isResizing = !0, this.ctx.rowResizing = !0) : (this.isResizing = !1, this.ctx.rowResizing = !1), this.isMouseDown = !0);
		}), this.ctx.on("mousemove", (t) => {
			if (!this.ctx.config.ENABLE_RESIZE_ROW || this.ctx.editing) return;
			const { offsetY: e, offsetX: i } = this.ctx.getOffset(t), s = e, o = i, r = t.clientY, { stageHeight: a, scrollY: l, config: { RESIZE_ROW_MIN_HEIGHT: c = 0 } } = this.ctx;
			if (this.isResizing && this.resizeTarget) {
				const f = this.resizeTarget.height;
				let d = r - this.clientY;
				const { calculatedHeight: u } = this.resizeTarget, x = u === -1 ? c : u;
				d + f < x && (d = -(f - x)), this.resizeDiff = d, this.ctx.emit("draw");
			} else {
				if (this.resizeTarget = null, this.isMouseDown) return;
				if (o < 0 || o > this.ctx.body.visibleWidth || s < 0 || s > this.ctx.header.visibleHeight + this.ctx.body.visibleHeight) {
					this.ctx.stageElement.style.cursor === "row-resize" && (this.ctx.stageElement.style.cursor = "default");
					return;
				}
				if (this.ctx.stageElement.style.cursor === "crosshair") return;
				this.ctx.stageElement.style.cursor === "row-resize" && (this.ctx.stageElement.style.cursor = "default");
				for (let f = 0; f < this.renderRows.length; f++) {
					const d = this.renderRows[f];
					if (s > d.y - l + d.height - 1.5 && s < d.y - l + d.height + 1.5 && s < a - 4) for (let x = 0; x < d.cells.length; x++) {
						const w = d.cells[x];
						o > w.drawX + 10 && o < w.drawX + w.width - 10 && w.rowspan === 1 && (this.ctx.stageElement.style.cursor = "row-resize", this.resizeTarget = d);
					}
				}
			}
		});
	}
	initDragRow() {
		this.ctx.on("cellMousedown", (t, e) => {
			this.ctx.config.ENABLE_DRAG_ROW && t.isImageInside("drag", e) && (this.dragSource = t, this.ctx.database.expandItem(t.rowKey, !1), this.ctx.dragRowIng = !0, this.dragRowDiff = this.ctx.mouseY - t.drawY, this.ctx.stageElement.style.cursor = "grabbing", this.ctx.clearSelector(), this.ctx.emit("dragRowMouseDown", t), this.ctx.emit("draw"));
		}), this.ctx.on("mouseup", async () => {
			if (this.ctx.dragRowIng) {
				if (this.dragSource && this.dragTarget && this.ctx.stageElement.style.cursor !== "not-allowed") {
					const t = this.dragSource, e = this.dragTarget, i = {
						source: t,
						target: e,
						position: this.dragPosition
					};
					this.ctx.emit("dragRowChange", i);
					let s = !0;
					const { BEFORE_DRAG_ROW_METHOD: o } = this.ctx.config;
					if (typeof o == "function" && (s = await o(i)), s && !this.ctx.config.ENABLE_DRAG_ROW_CUSTOM) {
						const r = this.ctx.database.getOriginalData(), { TREE_CHILDREN_KEY: a, ROW_KEY: l } = this.ctx.config, c = new ge(r, {
							key: l,
							childrenKey: a
						});
						c.treeMove(t.rowKey, e.rowKey, this.dragPosition), this.ctx.emit("loadData", c.getTree());
					}
				}
				this.dragTarget || (this.ctx.stageElement.style.cursor = "grab"), this.ctx.dragRowIng = !1, this.dragSource = null, this.dragTarget = null, this.dragPosition = "after", this.dragRowDiff = 0, this.ctx.emit("draw");
			}
		}), this.ctx.on("mousemove", (t) => {
			if (!this.ctx.dragRowIng) return;
			const { offsetY: e } = this.ctx.getOffset(t), { drawY: i } = this.dragTarget;
			i < e || i > e ? this.ctx.startAdjustPosition(t) : this.ctx.stopAdjustPosition();
		}), this.ctx.on("cellMouseenter", (t) => {
			if (!this.ctx.dragRowIng) return;
			this.dragTarget = t;
			const { ENABLE_DRAG_ROW_CROSS_LEVEL: e } = this.ctx.config, i = this.dragSource, s = this.dragTarget;
			if (!e && i && s && i.parentRowKey !== s.parentRowKey) {
				this.ctx.stageElement.style.cursor = "not-allowed";
				return;
			}
			this.ctx.stageElement.style.cursor = "grabbing", this.dragTarget = t;
			const { drawY: o, visibleHeight: r } = t, a = e ? r / 3 : r / 2;
			this.ctx.mouseY <= o + a ? this.dragPosition = "before" : this.ctx.mouseY > o + r - a ? this.dragPosition = "after" : this.dragPosition = "inside";
			const l = {
				dragSource: this.dragSource,
				dragTarget: this.dragTarget,
				dragPosition: this.dragPosition
			};
			this.ctx.emit("dragRowMove", l), this.ctx.emit("draw");
		});
	}
	resizeRow(t, e) {
		const { rowIndex: i, height: s, rowKey: o, data: r } = t;
		this.ctx.database.setRowHeight(i, s + e), this.init(), this.ctx.emit("draw"), this.ctx.emit("resizeRowChange", {
			rowIndex: i,
			oldHeight: s,
			height: s + e,
			rowKey: o,
			row: r,
			data: this.data
		});
	}
	drawTipLine() {
		if (this.isResizing && this.resizeTarget) {
			const { stageWidth: t, scrollY: e, config: { RESIZE_ROW_LINE_COLOR: i } } = this.ctx, r = this.resizeTarget.y - e + this.resizeTarget.height + this.resizeDiff - .5, a = [
				0,
				r - .5,
				t,
				r - .5
			];
			this.ctx.paint.drawLine(a, {
				borderColor: i,
				borderWidth: 1
			});
		}
	}
	drawDragRowTip() {
		if (this.ctx.dragRowIng && this.dragTarget && this.dragSource) {
			const { stageWidth: t, config: { DRAG_ROW_TIP_LINE_COLOR: e, DRAG_TIP_BG_COLOR: i } } = this.ctx, s = this.dragSource.visibleHeight;
			this.ctx.paint.drawRect(0, this.ctx.mouseY - this.dragRowDiff, this.visibleWidth, s, {
				fillColor: i,
				borderWidth: 0,
				borderColor: "transparent"
			});
			const o = this.dragTarget.drawY, r = this.dragTarget.height;
			let a = o;
			if (["before", "after"].includes(this.dragPosition)) {
				this.dragPosition === "after" && (a = o + r);
				const c = [
					0,
					a - .5,
					t,
					a - .5
				];
				this.ctx.paint.drawLine(c, {
					borderColor: e,
					borderWidth: 1.2
				});
			}
			["inside"].includes(this.dragPosition) && (a = o + r / 2);
			const l = [
				0,
				a - 4,
				6,
				a,
				0,
				a + 4,
				0,
				a - 4
			];
			this.ctx.paint.drawLine(l, {
				borderColor: e,
				borderWidth: 1.2,
				fillColor: e
			});
		}
	}
	drawFixedShadow() {
		const { fixedLeftWidth: t, fixedRightWidth: e, scrollX: i, header: s, stageWidth: o, config: { HEADER_BG_COLOR: r, FIXED_COLUMN_SHADOW_COLOR: a, FIXED_COLUMN_SHADOW_FADE_COLOR: l, FIXED_COLUMN_SHADOW_WIDTH: c } } = this.ctx, f = B(this.ctx.config);
		if (i > 0 && t !== 0 && !this.ctx.isEmpty && this.ctx.paint.drawShadow(this.x, this.y, t, this.height, {
			fillColor: r,
			side: "right",
			shadowWidth: c,
			colorStart: a,
			colorEnd: l
		}), i < Math.floor(s.width - o - 1) && e !== f && !this.ctx.isEmpty) {
			const d = s.width - (this.x + this.width) + o - e;
			this.ctx.paint.drawShadow(d, this.y, e, this.height, {
				fillColor: r,
				side: "left",
				shadowWidth: c,
				colorStart: l,
				colorEnd: a
			});
		}
	}
	binarySearch(t, e) {
		let i = 0, s = t.length - 1, o = -1;
		for (; i <= s;) {
			let r = Math.floor((i + s) / 2), a = t[r].bottom;
			if (a === e) return r;
			a < e ? i = r + 1 : (o = r, s = r - 1);
		}
		return o;
	}
	update() {
		this.init();
		const { header: t, database: e, scrollY: i, config: { CELL_HEIGHT: s } } = this.ctx, o = i, { data: r, positions: a } = e.getData();
		this.ctx.maxRowIndex = r.length - 1;
		let l = this.binarySearch(a, o), c = this.binarySearch(a, o + this.visibleHeight);
		if (c === -1 && (c = this.ctx.maxRowIndex), l === -1 && c === this.ctx.maxRowIndex) {
			const d = Math.floor(this.visibleHeight / s);
			l = this.ctx.maxRowIndex - d;
		}
		this.headIndex = Math.max(0, l), this.tailIndex = Math.min(this.ctx.maxRowIndex, c + 1), this.visibleRows = r.slice(this.headIndex, this.tailIndex + 1), this.ctx.body.headIndex = this.headIndex, this.ctx.body.tailIndex = this.tailIndex, this.ctx.body.visibleRows = this.visibleRows;
		const f = [];
		for (let d = 0; d < this.visibleRows.length; d++) {
			const u = this.headIndex + d, x = this.visibleRows[d], { height: w, top: E } = this.ctx.database.getPositionForRowIndex(u), g = new we(this.ctx, u, 0, E + this.y, t.width, w, x);
			f.push(g);
		}
		this.renderRows = f, this.ctx.body.renderRows = f;
	}
	updateAutoHeight() {
		const t = this.ctx.body.renderRows;
		if (!t.some((s) => s.calculatedHeightCells.length > 0)) return !1;
		t.forEach((s) => {
			s.updateCalculatedHeight();
		});
		const i = t.map((s) => ({
			height: s.calculatedHeight,
			rowIndex: s.rowIndex
		}));
		return this.ctx.database.setBatchCalculatedRowHeight(i);
	}
	draw() {
		this.renderRows.forEach((t) => {
			t.drawContainer();
		}), this.renderRows.forEach((t) => {
			t.drawHorizontalBorder();
		}), this.renderRows.forEach((t) => {
			t.drawCenter();
		}), this.drawFixedShadow(), this.renderRows.forEach((t) => {
			t.drawFixedContainer();
		}), this.renderRows.forEach((t) => {
			t.drawFixedHorizontalBorder();
		}), this.renderRows.forEach((t) => {
			t.drawFixed();
		}), this.drawTipLine();
	}
};
var mi = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "renderRows", []);
		n(this, "data", []);
		n(this, "x", 0);
		n(this, "y", 0);
		n(this, "width", 0);
		n(this, "height", 0);
		n(this, "visibleWidth", 0);
		n(this, "visibleHeight", 0);
		this.ctx = t, this.init();
	}
	init() {
		this.data = this.ctx.database.getFooterData();
		const { header: t, body: e, config: { CELL_FOOTER_HEIGHT: i, FOOTER_FIXED: s, FOOTER_POSITION: o } } = this.ctx, r = B(this.ctx.config);
		this.width = t.width, this.visibleWidth = t.visibleWidth, this.height = this.data.reduce((a) => a + i, 0), this.visibleHeight = this.height, s ? o === "top" ? this.y = this.ctx.header.height : this.y = this.ctx.stageHeight - this.height - r : this.y = e.y + e.height, this.ctx.footer.x = this.x, this.ctx.footer.y = this.y, this.ctx.footer.height = this.height, this.ctx.footer.width = this.width, this.ctx.footer.visibleWidth = this.visibleWidth, this.ctx.footer.visibleHeight = this.visibleHeight;
	}
	drawFixedShadow() {
		const { fixedLeftWidth: t, fixedRightWidth: e, scrollX: i, header: s, stageWidth: o, config: { HEADER_BG_COLOR: r, FIXED_COLUMN_SHADOW_COLOR: a, FIXED_COLUMN_SHADOW_FADE_COLOR: l, FIXED_COLUMN_SHADOW_WIDTH: c } } = this.ctx, f = B(this.ctx.config);
		let d = this.y;
		if (this.ctx.config.FOOTER_FIXED || (d = this.y - this.ctx.scrollY), i > 0 && t !== 0 && this.ctx.paint.drawShadow(this.x, d, t, this.height, {
			fillColor: r,
			side: "right",
			shadowWidth: c,
			colorStart: a,
			colorEnd: l
		}), i < Math.floor(s.width - o - 1) && e !== f) {
			const u = s.width - (this.x + this.width) + o - e;
			this.ctx.paint.drawShadow(u, d, e, this.height, {
				fillColor: r,
				side: "left",
				shadowWidth: c,
				colorStart: l,
				colorEnd: a
			});
		}
	}
	update() {
		this.init();
		const { CELL_FOOTER_HEIGHT: t } = this.ctx.config;
		let e = this.y;
		const i = [];
		this.data.forEach((s, o) => {
			const r = new we(this.ctx, o, 0, e, this.width, t, s, "footer");
			e += t, i.push(r);
		}), this.renderRows = i, this.ctx.footer.renderRows = this.renderRows;
	}
	drawTopLine() {
		const { stageWidth: t, config: e } = this.ctx, { BORDER: i } = e;
		if (!kt(i)) return;
		const s = [
			0,
			this.y,
			t,
			this.y
		];
		this.ctx.paint.drawLine(s, {
			borderColor: e.BORDER_COLOR,
			borderWidth: 1
		});
	}
	draw() {
		this.renderRows.forEach((t) => {
			t.drawContainer();
		}), this.renderRows.forEach((t) => {
			t.drawHorizontalBorder();
		}), this.renderRows.forEach((t) => {
			t.drawCenter();
		}), this.drawFixedShadow(), this.renderRows.forEach((t) => {
			t.drawFixedContainer();
		}), this.renderRows.forEach((t) => {
			t.drawFixedHorizontalBorder();
		}), this.renderRows.forEach((t) => {
			t.drawFixed();
		}), this.drawTopLine();
	}
};
var Ei = class {
	constructor(t) {
		n(this, "isCut", !1);
		n(this, "isMultipleRow", !1);
		n(this, "ctx");
		this.ctx = t, this.init();
	}
	init() {
		this.ctx.on("setMoveFocus", (t) => {
			this.moveFocus(t);
		}), this.ctx.on("mousemove", Nt((t) => {
			var e;
			(e = this.ctx.focusCellHeader) != null && e.fixed || !this.ctx.dragHeaderIng && this.ctx.selectorMove && this.ctx.startAdjustPosition(t);
		}, 100)), this.ctx.on("cellHoverChange", (t) => {
			if (!this.ctx.autofillMove) {
				if (t.operation) {
					this.selectRows(t, !1);
					return;
				}
				this.isMultipleRow || this.mouseenter();
			}
		}), this.ctx.on("cellClick", () => {
			this.adjustBoundaryPosition();
		}), this.ctx.on("cellMousedown", (t, e) => {
			if (!this.ctx.isTarget(e) || this.ctx.stageElement.style.cursor === "pointer" || this.ctx.stageElement.style.cursor === "crosshair") return;
			if (t.operation) {
				this.isMultipleRow = !0, this.selectRows(t);
				return;
			}
			window.getComputedStyle(e.target).userSelect !== "text" && e.preventDefault(), this.isMultipleRow = !1, this.click(e.shiftKey), this.ctx.emit("selectorClick", t);
		}), this.ctx.on("mouseup", () => {
			this.ctx.selectorMove = !1, this.ctx.stopAdjustPosition(), setTimeout(() => {
				this.ctx.disableHoverIconClick = !1;
			}, 0);
		}), this.ctx.on("cellHeaderHoverChange", (t) => {
			this.ctx.textSelecting || this.ctx.mousedown && this.selectCols(t);
		}), this.ctx.on("cellHoverChange", (t) => {
			this.ctx.textSelecting || this.ctx.mousedown && this.selectCols(t);
		}), this.ctx.on("cellHeaderMousedown", (t, e) => {
			if (this.ctx.stageElement.style.cursor === "pointer") return;
			window.getComputedStyle(e.target).userSelect !== "text" && e.preventDefault(), this.ctx.clearSelector(), t.operation ? this.selectAll() : this.selectCols(t);
		}), this.ctx.on("keydown", (t) => {
			if (!this.ctx.editing && !this.ctx.finding) {
				if (t.ctrlKey && t.code === "KeyV" || t.metaKey && t.code === "KeyV") {
					this.paste();
					return;
				}
				if (t.ctrlKey && t.code === "KeyC" || t.metaKey && t.code === "KeyC") {
					this.copy(), this.isCut = !1;
					return;
				}
				if (t.ctrlKey && t.code === "KeyX" || t.metaKey && t.code === "KeyX") {
					this.isCut = !0, this.copy();
					return;
				}
				if ((t.ctrlKey && t.code === "KeyA" || t.metaKey && t.code === "KeyA") && (t.preventDefault(), this.selectAll()), t.code === "ArrowLeft" || t.shiftKey && t.code === "Tab") {
					t.preventDefault(), this.moveFocus("LEFT");
					return;
				}
				if (t.code === "ArrowUp") {
					t.preventDefault(), this.moveFocus("TOP");
					return;
				}
				if (t.code === "ArrowRight" || t.code === "Tab") {
					t.preventDefault(), this.moveFocus("RIGHT");
					return;
				}
				if (t.code === "ArrowDown") {
					t.preventDefault(), this.moveFocus("BOTTOM");
					return;
				}
				if (t.code === "Delete" || t.code === "Backspace") {
					t.preventDefault();
					const { xArr: e, yArr: i } = this.ctx.selector;
					this.clearSelectedData(e, i);
					return;
				}
			}
		}), this.ctx.on("contextMenuClearSelected", () => {
			const { xArr: t, yArr: e } = this.ctx.selector;
			this.clearSelectedData(t, e);
		}), this.ctx.on("contextMenuCopy", () => {
			this.copy();
		}), this.ctx.on("contextMenuPaste", () => {
			this.paste();
		}), this.ctx.on("contextMenuCut", () => {
			this.isCut = !0, this.copy();
		}), this.ctx.on("setSelectorCell", (t) => {
			this.ctx.setFocusCell(t), this.click(), this.adjustBoundaryPosition();
		}), this.ctx.on("selectCols", (t) => {
			this.selectCols(t);
		});
	}
	setSelector(t, e) {
		if (this.ctx.dragHeaderIng || this.ctx.dragRowIng) return;
		const { ENABLE_SELECTOR_SPAN_COL: i, ENABLE_SELECTOR_SPAN_ROW: s } = this.ctx.config;
		let o = t, r = e;
		if (!s) {
			const [a] = r;
			r = [a, a];
		}
		if (!i) {
			const [a] = o;
			o = [a, a];
		}
		if (JSON.stringify(this.ctx.selector.xArr) !== JSON.stringify(o) || JSON.stringify(this.ctx.selector.yArr) !== JSON.stringify(r)) {
			this.ctx.mousedown && (this.ctx.selectorMove = !0, this.ctx.disableHoverIconClick = !0), this.ctx.selector.enable = !0;
			const { SELECTOR_AREA_MIN_X: a, SELECTOR_AREA_MAX_X: l, SELECTOR_AREA_MIN_Y: c, SELECTOR_AREA_MAX_Y: f, SELECTOR_AREA_MAX_X_OFFSET: d, SELECTOR_AREA_MAX_Y_OFFSET: u } = this.ctx.config, x = a, w = l || this.ctx.maxColIndex - d, E = c, g = f || this.ctx.maxRowIndex - u;
			let [m, y] = o, [p, R] = r;
			if (m < x || y > w || p < E || R > g) return;
			if (this.ctx.config.ENABLE_MERGE_CELL_LINK) {
				const b = this.adjustMergeCells(o, r);
				p = b.yArr[0], R = b.yArr[1], m = b.xArr[0], y = b.xArr[1], this.ctx.onlyMergeCell = b.onlyMergeCell;
			}
			m === y && p === R ? this.ctx.selectOnlyOne = !0 : this.ctx.selectOnlyOne = !1, o = [Math.max(x, m), Math.min(w, y)], r = [Math.max(E, p), Math.min(g, R)];
			const { BEFORE_SET_SELECTOR_METHOD: C } = this.ctx.config;
			if (typeof C == "function") {
				const _ = C({
					focusCell: this.ctx.focusCell,
					xArr: o,
					yArr: r
				});
				if (!_) return;
				o = _.xArr, r = _.yArr;
			}
			this.ctx.selector.xArr = o, this.ctx.selector.yArr = r, R === this.ctx.maxRowIndex && p === 0 ? this.ctx.selectColsIng = !0 : this.ctx.selectColsIng = !1, y === this.ctx.maxColIndex && m === 0 ? this.ctx.selectRowsIng = !0 : this.ctx.selectRowsIng = !1, this.ctx.emit("setSelector", this.ctx.selector), this.ctx.emit("drawView");
		}
	}
	adjustMergeCells(t, e) {
		var w;
		const [i, s] = e, [o, r] = t;
		if (s === this.ctx.maxRowIndex && i === 0 || r === this.ctx.maxColIndex && o === 0) return {
			xArr: t,
			yArr: e,
			onlyMergeCell: !1
		};
		let a = [], l = [];
		for (let E = 0; E <= e[1] - e[0]; E++) for (let g = 0; g <= t[1] - t[0]; g++) {
			const m = E + e[0], y = g + t[0], p = this.ctx.database.getVirtualBodyCell(m, y);
			p && ((m === i || m === s) && a.push(p), (y === o || y === r) && l.push(p));
		}
		const c = a.reduce((E, g) => {
			const { yArr: m } = g.getSpanInfo(), [y, p] = m;
			return E.minY = Math.min(E.minY, y), E.maxY = Math.max(E.maxY, p), E;
		}, {
			minY: i,
			maxY: s
		}), f = l.reduce((E, g) => {
			const { xArr: m } = g.getSpanInfo(), [y, p] = m;
			return E.minX = Math.min(E.minX, y), E.maxX = Math.max(E.maxX, p), E;
		}, {
			minX: o,
			maxX: r
		}), d = [f.minX, f.maxX], u = [c.minY, c.maxY];
		let x = !1;
		if (f.minX !== f.maxX || c.minY !== c.maxY) {
			const E = JSON.stringify(d) + JSON.stringify(u), g = (w = this.ctx.focusCell) == null ? void 0 : w.getSpanInfo();
			x = (g && JSON.stringify(g.xArr) + JSON.stringify(g.yArr)) === E;
		}
		return {
			xArr: d,
			yArr: u,
			onlyMergeCell: x
		};
	}
	selectCols(t) {
		if (this.ctx.config.ENABLE_SELECTOR_SINGLE || !this.ctx.config.ENABLE_SELECTOR_ALL_ROWS || this.ctx.autofillMove || this.ctx.columnResizing || this.ctx.editing) return;
		const { SELECTOR_AREA_MIN_Y: e, SELECTOR_AREA_MAX_Y: i, SELECTOR_AREA_MAX_Y_OFFSET: s } = this.ctx.config, o = e, r = i || this.ctx.maxRowIndex - s;
		if (this.ctx.focusCellHeader) {
			const { colIndex: a } = this.ctx.focusCellHeader;
			if (this.ctx.clearSelector(), this.ctx.mousedown && t.colIndex >= a) {
				const l = [a, t.colIndex + t.colspan - 1], c = [o, r];
				this.setSelector(l, c);
			} else {
				const l = [t.colIndex, a + t.colspan - 1], c = [o, r];
				this.setSelector(l, c);
			}
		}
	}
	selectAll() {
		if (this.ctx.autofillMove || this.ctx.editing) return;
		const { ENABLE_SELECTOR_ALL_ROWS: t, ENABLE_SELECTOR_ALL_COLS: e } = this.ctx.config;
		if (t && e) {
			const { SELECTOR_AREA_MIN_X: i, SELECTOR_AREA_MAX_X: s, SELECTOR_AREA_MIN_Y: o, SELECTOR_AREA_MAX_Y: r, SELECTOR_AREA_MAX_X_OFFSET: a, SELECTOR_AREA_MAX_Y_OFFSET: l } = this.ctx.config, c = i, f = s || this.ctx.maxColIndex - a, d = o, u = r || this.ctx.maxRowIndex - l, x = [c, f], w = [d, u];
			this.setSelector(x, w);
		}
	}
	selectRows(t, e = !0) {
		if (this.ctx.config.ENABLE_SELECTOR_SINGLE || !this.ctx.config.ENABLE_SELECTOR_ALL_COLS || this.ctx.autofillMove || this.ctx.editing) return;
		const { SELECTOR_AREA_MIN_X: i, SELECTOR_AREA_MAX_X: s, SELECTOR_AREA_MAX_X_OFFSET: o } = this.ctx.config, r = s || this.ctx.maxColIndex - o, a = i;
		if (e) {
			this.ctx.setFocusCell(t);
			const l = [a, r], c = [t.rowIndex, t.rowIndex];
			this.setSelector(l, c);
		}
		if (this.ctx.focusCell && this.ctx.mousedown) {
			const { rowIndex: l } = this.ctx.focusCell;
			if (t.rowIndex >= l) {
				const c = [a, r], f = [l, t.rowIndex];
				this.setSelector(c, f);
			} else {
				const c = [a, r], f = [t.rowIndex, l];
				this.setSelector(c, f);
			}
		}
	}
	mouseenter() {
		if (this.ctx.config.ENABLE_SELECTOR_SINGLE || this.ctx.editing) return;
		const { mousedown: t, focusCell: e, hoverCell: i } = this.ctx;
		if (t && e && i) {
			const { rowIndex: s, colIndex: o } = e, r = Math.min(i.colIndex, o), a = Math.max(i.colIndex, o), l = Math.min(i.rowIndex, s), c = Math.max(i.rowIndex, s), f = [r, a], d = [l, c];
			this.setSelector(f, d);
		}
	}
	click(t = !1) {
		const { focusCell: e, clickCell: i } = this.ctx;
		if (e && this.isInSettingRange(e.rowIndex, e.colIndex)) if (this.ctx.selector.enable = !0, i && t) {
			if (this.ctx.config.ENABLE_SELECTOR_SINGLE) return;
			const { colIndex: s, rowIndex: o } = i, { colIndex: r, rowIndex: a } = e, l = Math.min(r, s), c = Math.max(r, s), f = Math.min(a, o), d = Math.max(a, o), u = [l, c], x = [f, d];
			this.setSelector(u, x);
		} else {
			this.ctx.emit("cellSelectedClick", e);
			const s = [e.colIndex, e.colIndex], o = [e.rowIndex, e.rowIndex];
			this.setSelector(s, o);
		}
	}
	clearCopyLine() {
		this.ctx.selector.xArrCopy = [-1, -1], this.ctx.selector.yArrCopy = [-1, -1];
	}
	/**
	* 获取选中单元格
	* @param rowIndex
	* @param colIndex
	* @returns
	*/
	getCell(t, e) {
		const i = this.ctx.body.renderRows.find((o) => o.rowIndex === t);
		return i == null ? void 0 : i.cells.find((o) => o.colIndex === e);
	}
	/**
	* 复制
	* @returns
	*/
	copy() {
		if (!this.ctx.config.ENABLE_COPY || this.ctx.domSelectionStr || this.ctx.textSelectionStr) return;
		let { value: t, xArr: e, yArr: i } = this.ctx.getSelectedData();
		if (this.ctx.config.ENABLE_MERGE_CELL_LINK && this.ctx.database.hasMergeCell(e, i)) if (this.ctx.onlyMergeCell && this.ctx.focusCell) {
			const r = this.ctx.focusCell;
			t = [[r.getValue()]], e = [r.colIndex, r.colIndex], i = [r.rowIndex, r.rowIndex];
		} else {
			const r = {
				code: "ERR_MERGED_CELLS_COPY",
				message: this.ctx.locale.getText("mergeCellNoCopy")
			};
			this.ctx.hasEvent("error") ? this.ctx.emit("error", r) : console.error(r.message);
			return;
		}
		const { BEFORE_COPY_METHOD: s } = this.ctx.config;
		if (typeof s == "function") {
			const a = s({
				focusCell: this.ctx.focusCell,
				data: t,
				xArr: e,
				yArr: i
			});
			if (!a) return;
			t = a.data;
		}
		const o = De(t);
		navigator.clipboard ? navigator.clipboard.writeText(o).then(() => {
			this.ctx.selector.xArrCopy = this.ctx.selector.xArr.slice(), this.ctx.selector.yArrCopy = this.ctx.selector.yArr.slice(), this.ctx.emit("copyChange", {
				xArr: this.ctx.selector.xArrCopy,
				yArr: this.ctx.selector.yArrCopy,
				data: t
			}), this.ctx.emit("draw");
		}).catch((r) => console.error("Copy Failure:", r)) : console.error("current browser does not support the Clipboard API");
	}
	clearSelectedData(t, e, i = !1, s = null) {
		let o = [];
		const r = /* @__PURE__ */ new Set();
		for (let l = 0; l <= e[1] - e[0]; l++) for (let c = 0; c <= t[1] - t[0]; c++) {
			const f = l + e[0], d = c + t[0], u = this.ctx.database.getItemValueForRowIndexAndColIndex(f, d);
			if (u) {
				const { rowKey: x, key: w } = u;
				this.ctx.database.getReadonly(x, w) || (r.add(x), o.push({
					rowKey: x,
					key: w,
					value: s,
					row: {}
				}));
			}
		}
		if (!o.length) return [];
		if (i) return o;
		this.ctx.database.batchSetItemValue(o, !0);
		let a = [];
		return r.forEach((l) => {
			a.push(this.ctx.database.getRowDataItemForRowKey(l));
		}), this.ctx.emit("clearSelectedDataChange", o, a), o;
	}
	paste() {
		if (!navigator.clipboard) {
			console.error("current browser does not support the Clipboard API");
			return;
		}
		const { ENABLE_PASTER: t } = this.ctx.config;
		if (this.ctx.selector.enable && t) {
			const e = this.ctx.selector.yArr[0], i = this.ctx.selector.xArr[0], s = /* @__PURE__ */ new Set();
			navigator.clipboard.readText().then(async (o) => {
				let r = Ae(o);
				const a = [i, i + r[0].length - 1], l = [e, e + r.length - 1], [c, f] = l, [d, u] = a, x = f - this.ctx.maxRowIndex, w = u - this.ctx.maxColIndex;
				(x > 0 || w > 0) && this.ctx.emit("onPastedDataOverflow", {
					maxY: f,
					maxX: u,
					minY: c,
					minX: d,
					overflowRowCount: x,
					overflowColCount: w,
					textArr: r
				});
				const E = r.length === 1 && r[0].length === 1;
				if (this.ctx.config.ENABLE_MERGE_CELL_LINK && this.ctx.database.hasMergeCell(a, l) && !E) {
					const p = {
						code: "ERR_MERGED_CELLS_PASTE",
						message: this.ctx.locale.getText("mergeCellNoPaste"),
						data: []
					};
					this.ctx.hasEvent("error") ? this.ctx.emit("error", p) : console.error(p.message);
					return;
				}
				let g = [];
				for (let p = 0; p <= r.length - 1; p++) {
					const R = r[p].length;
					for (let C = 0; C <= R - 1; C++) {
						const b = p + e, _ = C + i, T = r[p][C], v = this.ctx.database.getItemValueForRowIndexAndColIndex(b, _);
						if (v) {
							const { rowKey: I, key: S } = v;
							this.ctx.database.getReadonly(I, S) || (s.add(I), g.push({
								rowKey: I,
								key: S,
								value: T,
								row: {}
							}));
						}
					}
				}
				if (this.isCut) {
					const p = this.clearSelectedData(this.ctx.selector.xArrCopy, this.ctx.selector.yArrCopy, !0), R = g.map((C) => `${C.rowKey}-${C.key}`);
					p.forEach((C) => {
						R.includes(`${C.rowKey}-${C.key}`) || g.unshift(C);
					}), this.isCut = !1;
				}
				if (!g.length) return;
				const { BEFORE_PASTE_DATA_METHOD: m } = this.ctx.config;
				if (typeof m == "function") {
					if (g = await m(g.map((C) => ({
						rowKey: C.rowKey,
						key: C.key,
						value: C.value,
						oldValue: this.ctx.database.getItemValue(C.rowKey, C.key),
						row: this.ctx.database.getRowDataItemForRowKey(C.rowKey)
					})), a, l, r), g && !g.length) return;
				}
				this.clearCopyLine(), this.ctx.batchSetItemValueByEditor(g, !0);
				let y = [];
				s.forEach((p) => {
					y.push(this.ctx.database.getRowDataItemForRowKey(p));
				}), this.ctx.emit("pasteChange", g, y), this.ctx.emit("draw");
			}).catch((o) => {
				console.error("Failed to get the clipboard content:", o);
			});
		}
	}
	/**键盘上下左右切换
	* @param dir
	*/
	moveFocus(t) {
		if (this.ctx.editing) return;
		const { focusCell: e } = this.ctx;
		if (!e) return;
		let { colIndex: i = 0, rowIndex: s = 0 } = e;
		const o = 0, r = 0, a = this.ctx.maxColIndex, l = this.ctx.maxRowIndex;
		switch (t) {
			case "LEFT":
				i > o && i--;
				break;
			case "TOP":
				s > r && s--;
				break;
			case "RIGHT":
				i < a && i++;
				break;
			case "BOTTOM": s < l && s++;
		}
		const c = [i, i], f = [s, s], d = this.getCell(s, i);
		d && (d.operation || this.isInSettingRange(d.rowIndex, d.colIndex) && (this.ctx.setFocusCell(d), this.setSelector(c, f), this.adjustBoundaryPosition(), this.ctx.emit("moveFocus", d), this.ctx.emit("draw")));
	}
	isInSettingRange(t, e) {
		const { SELECTOR_AREA_MIN_X: i, SELECTOR_AREA_MAX_X: s, SELECTOR_AREA_MIN_Y: o, SELECTOR_AREA_MAX_Y: r, SELECTOR_AREA_MAX_X_OFFSET: a, SELECTOR_AREA_MAX_Y_OFFSET: l } = this.ctx.config, c = i, f = s || this.ctx.maxColIndex - a, d = o, u = r || this.ctx.maxRowIndex - l;
		return !(e < c || e > f || t < d || t > u);
	}
	/**
	* 调整滚动条位置，让焦点单元格始终出现在可视区域内
	*/
	adjustBoundaryPosition() {
		const { stageHeight: t, stageWidth: e, focusCell: i, fixedRightWidth: s, fixedLeftWidth: o, header: r, footer: a, body: l, scrollX: c, scrollY: f, config: { FOOTER_FIXED: d, FOOTER_POSITION: u, ENABLE_MERGE_CELL_LINK: x } } = this.ctx, w = B(this.ctx.config);
		if (!i) return;
		x && this.ctx.onlyMergeCell && i.updateSpanInfo();
		const { drawX: E, drawY: g, width: m, height: y, fixed: p } = i, R = o - E + 1, C = i.drawX + m - (e - s) + 1;
		let b = r.height - g, _ = y;
		_ > l.visibleHeight && (_ = l.visibleHeight);
		let T = 0;
		d && (u === "top" ? b = r.height + a.height - g : T = a.visibleHeight);
		const v = g + _ - (t - T - w);
		let I = c, S = f;
		C > 0 && !p ? I = Math.floor(c + C) : R > 0 && !p && (I = Math.floor(c - R)), b > 0 ? S = Math.floor(f - b) : v > 0 && (S = Math.floor(f + v)), (Math.abs(c - I) > 2.5 || Math.abs(f - S) > 2.5) && this.ctx.setScroll(I, S);
	}
	destroy() {}
};
var pi = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "maxColRowCell");
		this.ctx = t, this.init();
	}
	init() {
		this.ctx.on("mousemove", (t) => {
			if (this.ctx.stageElement.style.cursor === "crosshair" && (this.ctx.stageElement.style.cursor = "default"), this.ctx.editing || !this.ctx.focusCell || !this.maxColRowCell) return;
			const { offsetX: e, offsetY: i } = this.ctx.getOffset(t), { colIndex: s, rowIndex: o, drawX: r, drawY: a, width: l, height: c } = this.maxColRowCell, f = 6, d = s === this.ctx.maxColIndex || o === this.ctx.maxRowIndex ? 0 : 2, u = r + l - f + d, x = a + c - f + d;
			e > u && i > x && e < u + f && i < x + f && (this.ctx.stageElement.style.cursor = "crosshair"), this.ctx.autofillMove && this.ctx.startAdjustPosition(t);
		}), this.ctx.on("cellMouseenter", (t) => {
			const { xArr: e, yArr: i } = this.ctx.selector, s = e[1], o = i[1], { colIndex: r, rowIndex: a } = t;
			this.ctx.config.ENABLE_AUTOFILL && r === s && a === o && (this.maxColRowCell = t), this.mouseenter(t);
		}), this.ctx.on("mousedown", () => {
			this.ctx.stageElement.style.cursor === "crosshair" && this.setMousedown();
		}), this.ctx.on("mouseup", () => {
			this.setMouseUp(), this.ctx.stopAdjustPosition();
		});
	}
	/**
	* 是否在填充
	* @returns
	*/
	isAutofillIng() {
		const { xArr: t, yArr: e } = this.ctx.selector;
		return !(JSON.stringify(this.ctx.autofill.xArr) === JSON.stringify(t) && JSON.stringify(this.ctx.autofill.yArr) === JSON.stringify(e));
	}
	setMousedown() {
		this.ctx.autofill.enable = !0, this.ctx.autofillMove = !0, this.ctx.disableHoverIconClick = !0;
	}
	setMouseUp() {
		if (!this.ctx.autofill.enable) return;
		this.isAutofillIng() && this.autofillData(), this.ctx.autofill.enable = !1, this.ctx.autofillMove = !1, this.ctx.autofill.xArr = [-1, -1], this.ctx.autofill.yArr = [-1, -1], setTimeout(() => {
			this.ctx.disableHoverIconClick = !1;
		}, 0);
	}
	setAutofill(t, e) {
		const { ENABLE_AUTOFILL: i, ENABLE_AUTOFILL_SPAN_COL: s, ENABLE_AUTOFILL_SPAN_ROW: o } = this.ctx.config;
		if (!i) return;
		let r = t, a = e;
		const l = this.ctx.selector.xArr, c = this.ctx.selector.yArr;
		if (!(!o && JSON.stringify(c) !== JSON.stringify(a)) && !(!s && JSON.stringify(l) !== JSON.stringify(r)) && (JSON.stringify(this.ctx.autofill.xArr) !== JSON.stringify(r) || JSON.stringify(this.ctx.autofill.yArr) !== JSON.stringify(a))) {
			const { SELECTOR_AREA_MIN_X: f, SELECTOR_AREA_MAX_X: d, SELECTOR_AREA_MIN_Y: u, SELECTOR_AREA_MAX_Y: x, SELECTOR_AREA_MAX_X_OFFSET: w, SELECTOR_AREA_MAX_Y_OFFSET: E } = this.ctx.config, g = f, m = d || this.ctx.maxColIndex - w, y = u, p = x || this.ctx.maxRowIndex - E;
			let [R, C] = r, [b, _] = a;
			if (R < g || b < y) return;
			r = [Math.max(g, R), Math.min(m, C)], a = [Math.max(y, b), Math.min(p, _)];
			const { BEFORE_SET_AUTOFILL_METHOD: T } = this.ctx.config;
			if (typeof T == "function") {
				const I = T({
					focusCell: this.ctx.focusCell,
					xArr: r,
					yArr: a
				});
				if (!I) return;
				r = I.xArr, a = I.yArr;
			}
			this.ctx.autofill.xArr = r, this.ctx.autofill.yArr = a, this.ctx.emit("setAutofill", this.ctx.autofill), this.ctx.emit("draw");
		}
	}
	/**
	* 填充数据
	*/
	async autofillData() {
		const t = /* @__PURE__ */ new Set(), e = this.ctx.getSelectedData(), i = /* @__PURE__ */ new Map();
		for (let x = 0; x <= e.yArr[1] - e.yArr[0]; x++) for (let w = 0; w <= e.xArr[1] - e.xArr[0]; w++) {
			const E = x + e.yArr[0], g = w + e.xArr[0];
			i.set(`${E}-${g}`, !0);
		}
		const { value: s } = e, o = s[0].length, r = s.length, a = this.ctx.autofill.xArr, l = this.ctx.autofill.yArr, c = o === 1 && r === 1;
		if (this.ctx.config.ENABLE_MERGE_CELL_LINK && this.ctx.database.hasMergeCell(a, l) && !c) {
			const x = {
				code: "ERR_MERGED_CELLS_AUTOFILL",
				message: this.ctx.locale.getText("mergeCellNoFill"),
				data: []
			};
			this.ctx.hasEvent("error") ? this.ctx.emit("error", x) : console.error(x.message);
			return;
		}
		let f = [];
		for (let x = 0; x <= l[1] - l[0]; x++) for (let w = 0; w <= a[1] - a[0]; w++) {
			const E = w + a[0], g = x + l[0], m = s[x % r][w % o], y = this.ctx.database.getItemValueForRowIndexAndColIndex(g, E), p = `${g}-${E}`;
			if (y && !i.has(p)) {
				const { rowKey: R, key: C } = y;
				this.ctx.database.getReadonly(R, C) || (t.add(R), f.push({
					rowKey: R,
					key: C,
					value: m,
					row: {}
				}));
			}
		}
		if (!f.length) return;
		this.ctx.selector.xArr = this.ctx.autofill.xArr, this.ctx.selector.yArr = this.ctx.autofill.yArr;
		const { BEFORE_AUTOFILL_DATA_METHOD: d } = this.ctx.config;
		if (typeof d == "function") {
			if (f = await d(f.map((E) => ({
				rowKey: E.rowKey,
				key: E.key,
				value: E.value,
				oldValue: this.ctx.database.getItemValue(E.rowKey, E.key),
				row: this.ctx.database.getRowDataItemForRowKey(E.rowKey)
			})), a, l), f && !f.length) return;
		}
		this.ctx.batchSetItemValueByEditor(f, !0);
		let u = [];
		t.forEach((x) => {
			u.push(this.ctx.database.getRowDataItemForRowKey(x));
		}), this.ctx.emit("autofillChange", f, u), this.ctx.emit("draw");
	}
	mouseenter(t) {
		if ([
			"index",
			"selection",
			"index-selection"
		].includes(t.type)) return;
		const { selector: e, autofill: i } = this.ctx;
		if (this.ctx.mousedown && e.enable && i.enable) {
			const { rowIndex: s, colIndex: o } = t, r = e.xArr.slice(), a = e.yArr.slice();
			s >= e.yArr[0] && s <= e.yArr[1] ? o > e.xArr[1] ? r.splice(1, 1, o) : o < e.xArr[0] && r.splice(0, 1, o) : s > e.yArr[1] ? a.splice(1, 1, s) : s < e.yArr[0] && a.splice(0, 1, s), this.setAutofill(r, a);
		}
	}
	destroy() {}
};
var Q = Math.min;
var U = Math.max;
var xt = Math.round;
var ct = Math.floor;
var K = (h) => ({
	x: h,
	y: h
});
var yi = {
	left: "right",
	right: "left",
	bottom: "top",
	top: "bottom"
};
function Ot(h, t, e) {
	return U(h, Q(t, e));
}
function nt(h, t) {
	return typeof h == "function" ? h(t) : h;
}
function j(h) {
	return h.split("-")[0];
}
function at(h) {
	return h.split("-")[1];
}
function me(h) {
	return h === "x" ? "y" : "x";
}
function Xt(h) {
	return h === "y" ? "height" : "width";
}
function P(h) {
	const t = h[0];
	return t === "t" || t === "b" ? "y" : "x";
}
function Ft(h) {
	return me(P(h));
}
function Ci(h, t, e) {
	e === void 0 && (e = !1);
	const i = at(h), s = Ft(h), o = Xt(s);
	let r = s === "x" ? i === (e ? "end" : "start") ? "right" : "left" : i === "start" ? "bottom" : "top";
	return t.reference[o] > t.floating[o] && (r = gt(r)), [r, gt(r)];
}
function bi(h) {
	const t = gt(h);
	return [
		Lt(h),
		t,
		Lt(t)
	];
}
function Lt(h) {
	return h.includes("start") ? h.replace("start", "end") : h.replace("end", "start");
}
var Qt = ["left", "right"];
var te = ["right", "left"];
var Ri = ["top", "bottom"];
var Ii = ["bottom", "top"];
function vi(h, t, e) {
	switch (h) {
		case "top":
		case "bottom": return e ? t ? te : Qt : t ? Qt : te;
		case "left":
		case "right": return t ? Ri : Ii;
		default: return [];
	}
}
function _i(h, t, e, i) {
	const s = at(h);
	let o = vi(j(h), e === "start", i);
	return s && (o = o.map((r) => r + "-" + s), t && (o = o.concat(o.map(Lt)))), o;
}
function gt(h) {
	const t = j(h);
	return yi[t] + h.slice(t.length);
}
function Ti(h) {
	return {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		...h
	};
}
function Ee(h) {
	return typeof h != "number" ? Ti(h) : {
		top: h,
		right: h,
		bottom: h,
		left: h
	};
}
function wt(h) {
	const { x: t, y: e, width: i, height: s } = h;
	return {
		width: i,
		height: s,
		top: e,
		left: t,
		right: t + i,
		bottom: e + s,
		x: t,
		y: e
	};
}
function ee(h, t, e) {
	let { reference: i, floating: s } = h;
	const o = P(t), r = Ft(t), a = Xt(r), l = j(t), c = o === "y", f = i.x + i.width / 2 - s.width / 2, d = i.y + i.height / 2 - s.height / 2, u = i[a] / 2 - s[a] / 2;
	let x;
	switch (l) {
		case "top":
			x = {
				x: f,
				y: i.y - s.height
			};
			break;
		case "bottom":
			x = {
				x: f,
				y: i.y + i.height
			};
			break;
		case "right":
			x = {
				x: i.x + i.width,
				y: d
			};
			break;
		case "left":
			x = {
				x: i.x - s.width,
				y: d
			};
			break;
		default: x = {
			x: i.x,
			y: i.y
		};
	}
	switch (at(t)) {
		case "start":
			x[r] -= u * (e && c ? -1 : 1);
			break;
		case "end": x[r] += u * (e && c ? -1 : 1);
	}
	return x;
}
async function Si(h, t) {
	var e;
	t === void 0 && (t = {});
	const { x: i, y: s, platform: o, rects: r, elements: a, strategy: l } = h, { boundary: c = "clippingAncestors", rootBoundary: f = "viewport", elementContext: d = "floating", altBoundary: u = !1, padding: x = 0 } = nt(t, h), w = Ee(x), g = a[u ? d === "floating" ? "reference" : "floating" : d], m = wt(await o.getClippingRect({
		element: (e = await (o.isElement == null ? void 0 : o.isElement(g))) == null || e ? g : g.contextElement || await (o.getDocumentElement == null ? void 0 : o.getDocumentElement(a.floating)),
		boundary: c,
		rootBoundary: f,
		strategy: l
	})), y = d === "floating" ? {
		x: i,
		y: s,
		width: r.floating.width,
		height: r.floating.height
	} : r.reference, p = await (o.getOffsetParent == null ? void 0 : o.getOffsetParent(a.floating)), R = await (o.isElement == null ? void 0 : o.isElement(p)) ? await (o.getScale == null ? void 0 : o.getScale(p)) || {
		x: 1,
		y: 1
	} : {
		x: 1,
		y: 1
	}, C = wt(o.convertOffsetParentRelativeRectToViewportRelativeRect ? await o.convertOffsetParentRelativeRectToViewportRelativeRect({
		elements: a,
		rect: y,
		offsetParent: p,
		strategy: l
	}) : y);
	return {
		top: (m.top - C.top + w.top) / R.y,
		bottom: (C.bottom - m.bottom + w.bottom) / R.y,
		left: (m.left - C.left + w.left) / R.x,
		right: (C.right - m.right + w.right) / R.x
	};
}
var Oi = 50;
var Li = async (h, t, e) => {
	const { placement: i = "bottom", strategy: s = "absolute", middleware: o = [], platform: r } = e, a = r.detectOverflow ? r : {
		...r,
		detectOverflow: Si
	}, l = await (r.isRTL == null ? void 0 : r.isRTL(t));
	let c = await r.getElementRects({
		reference: h,
		floating: t,
		strategy: s
	}), { x: f, y: d } = ee(c, i, l), u = i, x = 0;
	const w = {};
	for (let E = 0; E < o.length; E++) {
		const g = o[E];
		if (!g) continue;
		const { name: m, fn: y } = g, { x: p, y: R, data: C, reset: b } = await y({
			x: f,
			y: d,
			initialPlacement: i,
			placement: u,
			strategy: s,
			middlewareData: w,
			rects: c,
			platform: a,
			elements: {
				reference: h,
				floating: t
			}
		});
		f = p ?? f, d = R ?? d, w[m] = {
			...w[m],
			...C
		}, b && x < Oi && (x++, typeof b == "object" && (b.placement && (u = b.placement), b.rects && (c = b.rects === !0 ? await r.getElementRects({
			reference: h,
			floating: t,
			strategy: s
		}) : b.rects), {x: f, y: d} = ee(c, u, l)), E = -1);
	}
	return {
		x: f,
		y: d,
		placement: u,
		strategy: s,
		middlewareData: w
	};
};
var Mi = (h) => ({
	name: "arrow",
	options: h,
	async fn(t) {
		const { x: e, y: i, placement: s, rects: o, platform: r, elements: a, middlewareData: l } = t, { element: c, padding: f = 0 } = nt(h, t) || {};
		if (c == null) return {};
		const d = Ee(f), u = {
			x: e,
			y: i
		}, x = Ft(s), w = Xt(x), E = await r.getDimensions(c), g = x === "y", m = g ? "top" : "left", y = g ? "bottom" : "right", p = g ? "clientHeight" : "clientWidth", R = o.reference[w] + o.reference[x] - u[x] - o.floating[w], C = u[x] - o.reference[x], b = await (r.getOffsetParent == null ? void 0 : r.getOffsetParent(c));
		let _ = b ? b[p] : 0;
		(!_ || !await (r.isElement == null ? void 0 : r.isElement(b))) && (_ = a.floating[p] || o.floating[w]);
		const T = R / 2 - C / 2, v = _ / 2 - E[w] / 2 - 1, I = Q(d[m], v), S = Q(d[y], v), O = I, M = _ - E[w] - S, L = _ / 2 - E[w] / 2 + T, D = Ot(O, L, M), N = !l.arrow && at(s) != null && L !== D && o.reference[w] / 2 - (L < O ? I : S) - E[w] / 2 < 0, A = N ? L < O ? L - O : L - M : 0;
		return {
			[x]: u[x] + A,
			data: {
				[x]: D,
				centerOffset: L - D - A,
				...N && { alignmentOffset: A }
			},
			reset: N
		};
	}
});
var Ai = function(h) {
	return h === void 0 && (h = {}), {
		name: "flip",
		options: h,
		async fn(t) {
			var e, i;
			const { placement: s, middlewareData: o, rects: r, initialPlacement: a, platform: l, elements: c } = t, { mainAxis: f = !0, crossAxis: d = !0, fallbackPlacements: u, fallbackStrategy: x = "bestFit", fallbackAxisSideDirection: w = "none", flipAlignment: E = !0, ...g } = nt(h, t);
			if ((e = o.arrow) != null && e.alignmentOffset) return {};
			const m = j(s), y = P(a), p = j(a) === a, R = await (l.isRTL == null ? void 0 : l.isRTL(c.floating)), C = u || (p || !E ? [gt(a)] : bi(a)), b = w !== "none";
			!u && b && C.push(..._i(a, E, w, R));
			const _ = [a, ...C], T = await l.detectOverflow(t, g), v = [];
			let I = ((i = o.flip) == null ? void 0 : i.overflows) || [];
			if (f && v.push(T[m]), d) {
				const L = Ci(s, r, R);
				v.push(T[L[0]], T[L[1]]);
			}
			if (I = [...I, {
				placement: s,
				overflows: v
			}], !v.every((L) => L <= 0)) {
				var S, O;
				const L = (((S = o.flip) == null ? void 0 : S.index) || 0) + 1, D = _[L];
				if (D && (!(d === "alignment" ? y !== P(D) : !1) || I.every((k) => P(k.placement) === y ? k.overflows[0] > 0 : !0))) return {
					data: {
						index: L,
						overflows: I
					},
					reset: { placement: D }
				};
				let N = (O = I.filter((A) => A.overflows[0] <= 0).sort((A, k) => A.overflows[1] - k.overflows[1])[0]) == null ? void 0 : O.placement;
				if (!N) switch (x) {
					case "bestFit": {
						var M;
						const A = (M = I.filter((k) => {
							if (b) {
								const H = P(k.placement);
								return H === y || H === "y";
							}
							return !0;
						}).map((k) => [k.placement, k.overflows.filter((H) => H > 0).reduce((H, vt) => H + vt, 0)]).sort((k, H) => k[1] - H[1])[0]) == null ? void 0 : M[0];
						A && (N = A);
						break;
					}
					case "initialPlacement":
						N = a;
						break;
				}
				if (s !== N) return { reset: { placement: N } };
			}
			return {};
		}
	};
};
var Di = /* @__PURE__ */ new Set(["left", "top"]);
async function Hi(h, t) {
	const { placement: e, platform: i, elements: s } = h, o = await (i.isRTL == null ? void 0 : i.isRTL(s.floating)), r = j(e), a = at(e), l = P(e) === "y", c = Di.has(r) ? -1 : 1, f = o && l ? -1 : 1, d = nt(t, h);
	let { mainAxis: u, crossAxis: x, alignmentAxis: w } = typeof d == "number" ? {
		mainAxis: d,
		crossAxis: 0,
		alignmentAxis: null
	} : {
		mainAxis: d.mainAxis || 0,
		crossAxis: d.crossAxis || 0,
		alignmentAxis: d.alignmentAxis
	};
	return a && typeof w == "number" && (x = a === "end" ? w * -1 : w), l ? {
		x: x * f,
		y: u * c
	} : {
		x: u * c,
		y: x * f
	};
}
var Ni = function(h) {
	return h === void 0 && (h = 0), {
		name: "offset",
		options: h,
		async fn(t) {
			var e, i;
			const { x: s, y: o, placement: r, middlewareData: a } = t, l = await Hi(t, h);
			return r === ((e = a.offset) == null ? void 0 : e.placement) && (i = a.arrow) != null && i.alignmentOffset ? {} : {
				x: s + l.x,
				y: o + l.y,
				data: {
					...l,
					placement: r
				}
			};
		}
	};
};
var ki = function(h) {
	return h === void 0 && (h = {}), {
		name: "shift",
		options: h,
		async fn(t) {
			const { x: e, y: i, placement: s, platform: o } = t, { mainAxis: r = !0, crossAxis: a = !1, limiter: l = { fn: (m) => {
				let { x: y, y: p } = m;
				return {
					x: y,
					y: p
				};
			} }, ...c } = nt(h, t), f = {
				x: e,
				y: i
			}, d = await o.detectOverflow(t, c), u = P(j(s)), x = me(u);
			let w = f[x], E = f[u];
			if (r) {
				const m = x === "y" ? "top" : "left", y = x === "y" ? "bottom" : "right", p = w + d[m], R = w - d[y];
				w = Ot(p, w, R);
			}
			if (a) {
				const m = u === "y" ? "top" : "left", y = u === "y" ? "bottom" : "right", p = E + d[m], R = E - d[y];
				E = Ot(p, E, R);
			}
			const g = l.fn({
				...t,
				[x]: w,
				[u]: E
			});
			return {
				...g,
				data: {
					x: g.x - e,
					y: g.y - i,
					enabled: {
						[x]: r,
						[u]: a
					}
				}
			};
		}
	};
};
function Ct() {
	return typeof window < "u";
}
function et(h) {
	return pe(h) ? (h.nodeName || "").toLowerCase() : "#document";
}
function X(h) {
	var t;
	return (h == null || (t = h.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function W(h) {
	var t;
	return (t = (pe(h) ? h.ownerDocument : h.document) || window.document) == null ? void 0 : t.documentElement;
}
function pe(h) {
	return Ct() ? h instanceof Node || h instanceof X(h).Node : !1;
}
function F(h) {
	return Ct() ? h instanceof Element || h instanceof X(h).Element : !1;
}
function z(h) {
	return Ct() ? h instanceof HTMLElement || h instanceof X(h).HTMLElement : !1;
}
function ie(h) {
	return !Ct() || typeof ShadowRoot > "u" ? !1 : h instanceof ShadowRoot || h instanceof X(h).ShadowRoot;
}
function lt(h) {
	const { overflow: t, overflowX: e, overflowY: i, display: s } = Y(h);
	return /auto|scroll|overlay|hidden|clip/.test(t + i + e) && s !== "inline" && s !== "contents";
}
function Bi(h) {
	return /^(table|td|th)$/.test(et(h));
}
function bt(h) {
	try {
		if (h.matches(":popover-open")) return !0;
	} catch {}
	try {
		return h.matches(":modal");
	} catch {
		return !1;
	}
}
var Xi = /transform|translate|scale|rotate|perspective|filter/;
var Fi = /paint|layout|strict|content/;
var G = (h) => !!h && h !== "none";
var _t;
function Yt(h) {
	const t = F(h) ? Y(h) : h;
	return G(t.transform) || G(t.translate) || G(t.scale) || G(t.rotate) || G(t.perspective) || !Kt() && (G(t.backdropFilter) || G(t.filter)) || Xi.test(t.willChange || "") || Fi.test(t.contain || "");
}
function Yi(h) {
	let t = $(h);
	for (; z(t) && !tt(t);) {
		if (Yt(t)) return t;
		if (bt(t)) return null;
		t = $(t);
	}
	return null;
}
function Kt() {
	return _t ??= typeof CSS < "u" && CSS.supports && CSS.supports("-webkit-backdrop-filter", "none"), _t;
}
function tt(h) {
	return /^(html|body|#document)$/.test(et(h));
}
function Y(h) {
	return X(h).getComputedStyle(h);
}
function Rt(h) {
	return F(h) ? {
		scrollLeft: h.scrollLeft,
		scrollTop: h.scrollTop
	} : {
		scrollLeft: h.scrollX,
		scrollTop: h.scrollY
	};
}
function $(h) {
	if (et(h) === "html") return h;
	const t = h.assignedSlot || h.parentNode || ie(h) && h.host || W(h);
	return ie(t) ? t.host : t;
}
function ye(h) {
	const t = $(h);
	return tt(t) ? h.ownerDocument ? h.ownerDocument.body : h.body : z(t) && lt(t) ? t : ye(t);
}
function ot(h, t, e) {
	var i;
	t === void 0 && (t = []), e === void 0 && (e = !0);
	const s = ye(h), o = s === ((i = h.ownerDocument) == null ? void 0 : i.body), r = X(s);
	if (o) {
		const a = Mt(r);
		return t.concat(r, r.visualViewport || [], lt(s) ? s : [], a && e ? ot(a) : []);
	} else return t.concat(s, ot(s, [], e));
}
function Mt(h) {
	return h.parent && Object.getPrototypeOf(h.parent) ? h.frameElement : null;
}
function Ce(h) {
	const t = Y(h);
	let e = parseFloat(t.width) || 0, i = parseFloat(t.height) || 0;
	const s = z(h), o = s ? h.offsetWidth : e, r = s ? h.offsetHeight : i, a = xt(e) !== o || xt(i) !== r;
	return a && (e = o, i = r), {
		width: e,
		height: i,
		$: a
	};
}
function Wt(h) {
	return F(h) ? h : h.contextElement;
}
function J(h) {
	const t = Wt(h);
	if (!z(t)) return K(1);
	const e = t.getBoundingClientRect(), { width: i, height: s, $: o } = Ce(t);
	let r = (o ? xt(e.width) : e.width) / i, a = (o ? xt(e.height) : e.height) / s;
	return (!r || !Number.isFinite(r)) && (r = 1), (!a || !Number.isFinite(a)) && (a = 1), {
		x: r,
		y: a
	};
}
var Ki = /* @__PURE__ */ K(0);
function be(h) {
	const t = X(h);
	return !Kt() || !t.visualViewport ? Ki : {
		x: t.visualViewport.offsetLeft,
		y: t.visualViewport.offsetTop
	};
}
function Wi(h, t, e) {
	return t === void 0 && (t = !1), !e || t && e !== X(h) ? !1 : t;
}
function q(h, t, e, i) {
	t === void 0 && (t = !1), e === void 0 && (e = !1);
	const s = h.getBoundingClientRect(), o = Wt(h);
	let r = K(1);
	t && (i ? F(i) && (r = J(i)) : r = J(h));
	const a = Wi(o, e, i) ? be(o) : K(0);
	let l = (s.left + a.x) / r.x, c = (s.top + a.y) / r.y, f = s.width / r.x, d = s.height / r.y;
	if (o) {
		const u = X(o), x = i && F(i) ? X(i) : i;
		let w = u, E = Mt(w);
		for (; E && i && x !== w;) {
			const g = J(E), m = E.getBoundingClientRect(), y = Y(E), p = m.left + (E.clientLeft + parseFloat(y.paddingLeft)) * g.x, R = m.top + (E.clientTop + parseFloat(y.paddingTop)) * g.y;
			l *= g.x, c *= g.y, f *= g.x, d *= g.y, l += p, c += R, w = X(E), E = Mt(w);
		}
	}
	return wt({
		width: f,
		height: d,
		x: l,
		y: c
	});
}
function It(h, t) {
	const e = Rt(h).scrollLeft;
	return t ? t.left + e : q(W(h)).left + e;
}
function Re(h, t) {
	const e = h.getBoundingClientRect();
	return {
		x: e.left + t.scrollLeft - It(h, e),
		y: e.top + t.scrollTop
	};
}
function Vi(h) {
	let { elements: t, rect: e, offsetParent: i, strategy: s } = h;
	const o = s === "fixed", r = W(i), a = t ? bt(t.floating) : !1;
	if (i === r || a && o) return e;
	let l = {
		scrollLeft: 0,
		scrollTop: 0
	}, c = K(1);
	const f = K(0), d = z(i);
	if ((d || !d && !o) && ((et(i) !== "body" || lt(r)) && (l = Rt(i)), d)) {
		const x = q(i);
		c = J(i), f.x = x.x + i.clientLeft, f.y = x.y + i.clientTop;
	}
	const u = r && !d && !o ? Re(r, l) : K(0);
	return {
		width: e.width * c.x,
		height: e.height * c.y,
		x: e.x * c.x - l.scrollLeft * c.x + f.x + u.x,
		y: e.y * c.y - l.scrollTop * c.y + f.y + u.y
	};
}
function zi(h) {
	return Array.from(h.getClientRects());
}
function Pi(h) {
	const t = W(h), e = Rt(h), i = h.ownerDocument.body, s = U(t.scrollWidth, t.clientWidth, i.scrollWidth, i.clientWidth), o = U(t.scrollHeight, t.clientHeight, i.scrollHeight, i.clientHeight);
	let r = -e.scrollLeft + It(h);
	const a = -e.scrollTop;
	return Y(i).direction === "rtl" && (r += U(t.clientWidth, i.clientWidth) - s), {
		width: s,
		height: o,
		x: r,
		y: a
	};
}
var se = 25;
function $i(h, t) {
	const e = X(h), i = W(h), s = e.visualViewport;
	let o = i.clientWidth, r = i.clientHeight, a = 0, l = 0;
	if (s) {
		o = s.width, r = s.height;
		const f = Kt();
		(!f || f && t === "fixed") && (a = s.offsetLeft, l = s.offsetTop);
	}
	const c = It(i);
	if (c <= 0) {
		const f = i.ownerDocument, d = f.body, u = getComputedStyle(d), x = f.compatMode === "CSS1Compat" && parseFloat(u.marginLeft) + parseFloat(u.marginRight) || 0, w = Math.abs(i.clientWidth - d.clientWidth - x);
		w <= se && (o -= w);
	} else c <= se && (o += c);
	return {
		width: o,
		height: r,
		x: a,
		y: l
	};
}
function Gi(h, t) {
	const e = q(h, !0, t === "fixed"), i = e.top + h.clientTop, s = e.left + h.clientLeft, o = z(h) ? J(h) : K(1);
	return {
		width: h.clientWidth * o.x,
		height: h.clientHeight * o.y,
		x: s * o.x,
		y: i * o.y
	};
}
function oe(h, t, e) {
	let i;
	if (t === "viewport") i = $i(h, e);
	else if (t === "document") i = Pi(W(h));
	else if (F(t)) i = Gi(t, e);
	else {
		const s = be(h);
		i = {
			x: t.x - s.x,
			y: t.y - s.y,
			width: t.width,
			height: t.height
		};
	}
	return wt(i);
}
function Ie(h, t) {
	const e = $(h);
	return e === t || !F(e) || tt(e) ? !1 : Y(e).position === "fixed" || Ie(e, t);
}
function Ui(h, t) {
	const e = t.get(h);
	if (e) return e;
	let i = ot(h, [], !1).filter((a) => F(a) && et(a) !== "body"), s = null;
	const o = Y(h).position === "fixed";
	let r = o ? $(h) : h;
	for (; F(r) && !tt(r);) {
		const a = Y(r), l = Yt(r);
		!l && a.position === "fixed" && (s = null), (o ? !l && !s : !l && a.position === "static" && !!s && (s.position === "absolute" || s.position === "fixed") || lt(r) && !l && Ie(h, r)) ? i = i.filter((f) => f !== r) : s = a, r = $(r);
	}
	return t.set(h, i), i;
}
function ji(h) {
	let { element: t, boundary: e, rootBoundary: i, strategy: s } = h;
	const r = [...e === "clippingAncestors" ? bt(t) ? [] : Ui(t, this._c) : [].concat(e), i], a = oe(t, r[0], s);
	let l = a.top, c = a.right, f = a.bottom, d = a.left;
	for (let u = 1; u < r.length; u++) {
		const x = oe(t, r[u], s);
		l = U(x.top, l), c = Q(x.right, c), f = Q(x.bottom, f), d = U(x.left, d);
	}
	return {
		width: c - d,
		height: f - l,
		x: d,
		y: l
	};
}
function qi(h) {
	const { width: t, height: e } = Ce(h);
	return {
		width: t,
		height: e
	};
}
function Zi(h, t, e) {
	const i = z(t), s = W(t), o = e === "fixed", r = q(h, !0, o, t);
	let a = {
		scrollLeft: 0,
		scrollTop: 0
	};
	const l = K(0);
	function c() {
		l.x = It(s);
	}
	if (i || !i && !o) if ((et(t) !== "body" || lt(s)) && (a = Rt(t)), i) {
		const x = q(t, !0, o, t);
		l.x = x.x + t.clientLeft, l.y = x.y + t.clientTop;
	} else s && c();
	o && !i && s && c();
	const f = s && !i && !o ? Re(s, a) : K(0);
	return {
		x: r.left + a.scrollLeft - l.x - f.x,
		y: r.top + a.scrollTop - l.y - f.y,
		width: r.width,
		height: r.height
	};
}
function Tt(h) {
	return Y(h).position === "static";
}
function re(h, t) {
	if (!z(h) || Y(h).position === "fixed") return null;
	if (t) return t(h);
	let e = h.offsetParent;
	return W(h) === e && (e = e.ownerDocument.body), e;
}
function ve(h, t) {
	const e = X(h);
	if (bt(h)) return e;
	if (!z(h)) {
		let s = $(h);
		for (; s && !tt(s);) {
			if (F(s) && !Tt(s)) return s;
			s = $(s);
		}
		return e;
	}
	let i = re(h, t);
	for (; i && Bi(i) && Tt(i);) i = re(i, t);
	return i && tt(i) && Tt(i) && !Yt(i) ? e : i || Yi(h) || e;
}
var Ji = async function(h) {
	const t = this.getOffsetParent || ve, e = this.getDimensions, i = await e(h.floating);
	return {
		reference: Zi(h.reference, await t(h.floating), h.strategy),
		floating: {
			x: 0,
			y: 0,
			width: i.width,
			height: i.height
		}
	};
};
function Qi(h) {
	return Y(h).direction === "rtl";
}
var ts = {
	convertOffsetParentRelativeRectToViewportRelativeRect: Vi,
	getDocumentElement: W,
	getClippingRect: ji,
	getOffsetParent: ve,
	getElementRects: Ji,
	getClientRects: zi,
	getDimensions: qi,
	getScale: J,
	isElement: F,
	isRTL: Qi
};
function _e(h, t) {
	return h.x === t.x && h.y === t.y && h.width === t.width && h.height === t.height;
}
function es(h, t) {
	let e = null, i;
	const s = W(h);
	function o() {
		var a;
		clearTimeout(i), (a = e) == null || a.disconnect(), e = null;
	}
	function r(a, l) {
		a === void 0 && (a = !1), l === void 0 && (l = 1), o();
		const c = h.getBoundingClientRect(), { left: f, top: d, width: u, height: x } = c;
		if (a || t(), !u || !x) return;
		const w = ct(d), E = ct(s.clientWidth - (f + u)), g = ct(s.clientHeight - (d + x)), m = ct(f), p = {
			rootMargin: -w + "px " + -E + "px " + -g + "px " + -m + "px",
			threshold: U(0, Q(1, l)) || 1
		};
		let R = !0;
		function C(b) {
			const _ = b[0].intersectionRatio;
			if (_ !== l) {
				if (!R) return r();
				_ ? r(!1, _) : i = setTimeout(() => {
					r(!1, 1e-7);
				}, 1e3);
			}
			_ === 1 && !_e(c, h.getBoundingClientRect()) && r(), R = !1;
		}
		try {
			e = new IntersectionObserver(C, {
				...p,
				root: s.ownerDocument
			});
		} catch {
			e = new IntersectionObserver(C, p);
		}
		e.observe(h);
	}
	return r(!0), o;
}
function At(h, t, e, i) {
	i === void 0 && (i = {});
	const { ancestorScroll: s = !0, ancestorResize: o = !0, elementResize: r = typeof ResizeObserver == "function", layoutShift: a = typeof IntersectionObserver == "function", animationFrame: l = !1 } = i, c = Wt(h), f = s || o ? [...c ? ot(c) : [], ...t ? ot(t) : []] : [];
	f.forEach((m) => {
		s && m.addEventListener("scroll", e, { passive: !0 }), o && m.addEventListener("resize", e);
	});
	const d = c && a ? es(c, e) : null;
	let u = -1, x = null;
	r && (x = new ResizeObserver((m) => {
		let [y] = m;
		y && y.target === c && x && t && (x.unobserve(t), cancelAnimationFrame(u), u = requestAnimationFrame(() => {
			var p;
			(p = x) == null || p.observe(t);
		})), e();
	}), c && !l && x.observe(c), t && x.observe(t));
	let w, E = l ? q(h) : null;
	l && g();
	function g() {
		const m = q(h);
		E && !_e(E, m) && e(), E = m, w = requestAnimationFrame(g);
	}
	return e(), () => {
		var m;
		f.forEach((y) => {
			s && y.removeEventListener("scroll", e), o && y.removeEventListener("resize", e);
		}), d?.(), (m = x) == null || m.disconnect(), x = null, l && cancelAnimationFrame(w);
	};
}
var mt = Ni;
var Et = ki;
var Vt = Ai;
var is = Mi;
var pt = (h, t, e) => {
	const i = /* @__PURE__ */ new Map(), s = {
		platform: ts,
		...e
	}, o = {
		...s.platform,
		_c: i
	};
	return Li(h, t, {
		...s,
		platform: o
	});
};
var ss = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "enable", !1);
		n(this, "contentEl");
		n(this, "floatingEl");
		n(this, "arrowEl");
		this.ctx = t;
		const { TOOLTIP_BG_COLOR: e, TOOLTIP_TEXT_COLOR: i, TOOLTIP_ZINDEX: s, TOOLTIP_CUSTOM_STYLE: o, CSS_PREFIX: r } = this.ctx.config;
		this.contentEl = document.createElement("div"), this.arrowEl = document.createElement("div"), this.floatingEl = document.createElement("div"), this.floatingEl.className = `${r}-tooltip`, this.contentEl.className = `${r}-tooltip-content`, this.arrowEl.className = `${r}-tooltip-arrow`;
		const a = {
			display: "none",
			position: "absolute",
			background: e,
			color: i,
			boxSizing: "border-box",
			zIndex: s,
			padding: "8px",
			borderRadius: "4px",
			fontSize: "12px",
			...o
		}, l = {
			position: "absolute",
			width: "10px",
			height: "10px",
			background: a.background,
			backgroundColor: a.backgroundColor,
			transform: "rotate(45deg)",
			zIndex: a.zIndex
		};
		Object.assign(this.arrowEl.style, l), Object.assign(this.floatingEl.style, a), this.floatingEl.appendChild(this.contentEl), this.floatingEl.appendChild(this.arrowEl), this.ctx.containerElement.appendChild(this.floatingEl), this.init();
	}
	init() {
		this.floatingEl.addEventListener("mouseleave", () => {
			this.hide();
		}), this.ctx.on("mouseout", (t) => {
			this.floatingEl.contains(t.relatedTarget) || this.hide();
		}), this.ctx.on("onScroll", () => {
			this.hide();
		}), this.ctx.on("startEdit", () => {
			this.hide();
		}), this.ctx.on("visibleCellHoverChange", (t, e) => {
			this.floatingEl.contains(e.target) || (t.ellipsis || t.message) && this.show(t);
		}), this.ctx.on("visibleCellMouseleave", (t, e) => {
			this.floatingEl.contains(e.target) || this.hide();
		}), this.ctx.on("cellHeaderMouseleave", (t, e) => {
			this.floatingEl.contains(e.target) || this.hide();
		}), this.ctx.on("cellHeaderHoverChange", (t, e) => {
			this.floatingEl.contains(e.target) || t.ellipsis && this.show(t);
		}), this.ctx.on("cellFooterMouseleave", (t, e) => {
			this.floatingEl.contains(e.target) || this.hide();
		}), this.ctx.on("cellFooterHoverChange", (t, e) => {
			this.floatingEl.contains(e.target) || t.ellipsis && this.show(t);
		}), this.ctx.on("cellShowTooltip", (t, e) => {
			this.show(t, e);
		}), this.ctx.on("cellHideTooltip", () => {
			this.hide();
		});
	}
	show(t, e) {
		if (this.ctx.contextMenuIng || !t.overflowTooltipShow || this.ctx.mousedown) return;
		this.floatingEl.style.display = "block";
		let i = t.getText();
		t.message && (i = t.message), e && (i = e);
		const s = this.ctx.containerElement.getBoundingClientRect();
		if (!s) return;
		this.enable = !0, this.contentEl.style.maxWidth = `${t.overflowTooltipMaxWidth || 500}px`, this.contentEl.style.minWidth = "100px", this.contentEl.style.width = "100%", this.contentEl.style.display = "inline-block", this.contentEl.style.wordBreak = "break-all", this.contentEl.style.lineHeight = "1.5", this.contentEl.innerText = i;
		const o = t.drawX + s.x, r = t.drawY + s.y;
		pt({ getBoundingClientRect() {
			return {
				width: t.visibleWidth,
				height: t.visibleHeight,
				x: o,
				y: r,
				left: o,
				right: o + t.visibleWidth,
				top: r,
				bottom: r + t.visibleHeight
			};
		} }, this.floatingEl, {
			placement: t.overflowTooltipPlacement,
			middleware: [
				Et(),
				Vt(),
				mt(6),
				is({ element: this.arrowEl })
			]
		}).then((l) => {
			const { x: c, y: f, placement: d, middlewareData: u } = l;
			if (Object.assign(this.floatingEl.style, {
				top: `${f}px`,
				left: `${c}px`
			}), u.arrow) {
				const x = u.arrow;
				[
					"left",
					"left-start",
					"left-end"
				].includes(d) ? Object.assign(this.arrowEl.style, {
					top: `${x.y}px`,
					bottom: "",
					left: "",
					right: "-5px"
				}) : [
					"right",
					"right-start",
					"right-end"
				].includes(d) ? Object.assign(this.arrowEl.style, {
					top: `${x.y}px`,
					bottom: "",
					left: "-5px",
					right: ""
				}) : [
					"bottom",
					"bottom-start",
					"bottom-end"
				].includes(d) ? Object.assign(this.arrowEl.style, {
					top: "-5px",
					bottom: "",
					left: `${x.x}px`,
					right: ""
				}) : [
					"top",
					"top-start",
					"top-end"
				].includes(d) && Object.assign(this.arrowEl.style, {
					top: "",
					bottom: "-5px",
					left: `${x.x}px`,
					right: ""
				});
			}
		});
	}
	hide() {
		this.enable && (this.enable = !1, this.floatingEl.style.display = "none");
	}
	destroy() {
		this.contentEl.remove(), this.arrowEl.remove(), this.floatingEl.remove();
	}
};
var os = class {
	constructor(t) {
		n(this, "editorEl");
		n(this, "inputEl");
		n(this, "enable", !1);
		n(this, "cellTarget", null);
		n(this, "selectorArrStr", "");
		n(this, "ctx");
		n(this, "drawY", 0);
		n(this, "drawX", 0);
		n(this, "cancel", !1);
		this.ctx = t, this.initTextEditor(), this.init();
	}
	init() {
		this.ctx.on("outsideMousedown", () => {
			this.cellTarget && this.cellTarget.editorType === "text" && this.clearEditor();
		}), this.ctx.on("moveFocus", (t) => {
			this.cellTarget = t, this.resetEditorStyle();
			const { xArr: e, yArr: i } = this.ctx.selector;
			this.selectorArrStr = JSON.stringify(e) + JSON.stringify(i), this.focusInput();
		}), this.ctx.on("onScroll", () => {
			this.enable && this.doneEdit();
		}), this.ctx.on("hoverIconClick", (t) => {
			this.editCell(t.rowIndex, t.colIndex);
		}), this.ctx.on("keydown", (t) => {
			if (!this.ctx.isTarget(t) || !this.ctx.focusCell || this.ctx.finding) return;
			const { focusCell: e } = this.ctx;
			if (t.code === "Escape" && this.ctx.editing) {
				this.cancel = !0;
				const { focusCell: f } = this.ctx;
				f && (this.ctx.emit("setSelectorCell", f), this.cellTarget = f), this.doneEdit();
				return;
			}
			if ((t.altKey || t.metaKey) && t.key === "Enter" && this.ctx.editing && this.inputEl) {
				t.preventDefault();
				const f = this.inputEl.selectionStart, d = this.inputEl.value.substring(0, f), u = this.inputEl.value.substring(f);
				this.inputEl.value = d + `
` + u, this.inputEl.selectionStart = this.inputEl.selectionEnd = f + 1, this.autoSize();
				return;
			}
			if (t.code === "Tab" && this.ctx.editing) {
				if (t.preventDefault(), this.doneEdit(), t.shiftKey) {
					this.ctx.emit("setMoveFocus", "LEFT");
					return;
				}
				this.ctx.emit("setMoveFocus", "RIGHT");
				return;
			}
			if (t.key === "Enter" && this.ctx.editing) {
				if (t.preventDefault(), this.doneEdit(), t.shiftKey) {
					this.ctx.emit("setMoveFocus", "TOP");
					return;
				}
				this.ctx.emit("setMoveFocus", "BOTTOM");
				return;
			}
			if (t.key === "Enter" && !this.ctx.editing) {
				t.preventDefault(), this.startEdit();
				return;
			}
			const i = t.key, s = t.ctrlKey, o = t.altKey, r = t.shiftKey, a = t.metaKey;
			if (s || o || r || a || [
				"Enter",
				"CapsLock",
				"Escape",
				"Tab",
				"Backspace",
				"Delete",
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
				"Home",
				"End",
				"PageUp",
				"PageDown",
				"Insert",
				"F1",
				"F2",
				"F3",
				"F4",
				"F5",
				"F6",
				"F7",
				"F8",
				"F9",
				"F10",
				"F11",
				"F12"
			].includes(i)) return;
			if (!(document.activeElement === this.inputEl) && e.editorType === "text") {
				t.preventDefault();
				return;
			}
			this.startEdit(!0);
		}), this.ctx.on("cellClick", (t) => {
			if (this.ctx.stageElement.style.cursor === "pointer" || !this.isInSelectorRange(t.rowIndex, t.colIndex)) return;
			const { xArr: e, yArr: i } = this.ctx.selector, s = JSON.stringify(e) + JSON.stringify(i);
			if (this.focusInput(), this.selectorArrStr === s && this.cellTarget) {
				if (this.ctx.config.ENABLE_MERGE_CELL_LINK && this.ctx.onlyMergeCell) {
					this.startEdit();
					return;
				}
				if (this.ctx.selectOnlyOne && t.rowKey === this.cellTarget.rowKey && t.key === this.cellTarget.key) {
					this.startEdit();
					return;
				}
			}
			if (this.selectorArrStr = s, this.doneEdit(), this.cellTarget = t, this.resetEditorStyle(), this.ctx.config.ENABLE_EDIT_SINGLE_CLICK) {
				if (this.ctx.config.ENABLE_MERGE_CELL_LINK && this.ctx.onlyMergeCell) {
					this.startEdit();
					return;
				}
				this.ctx.selectOnlyOne && this.startEdit();
			}
		});
	}
	isTextSelectionActive() {
		return this.ctx.config.ENABLE_TEXT_SELECTION && (this.ctx.textSelecting || !!this.ctx.textSelectionStr);
	}
	isInSelectorRange(t, e) {
		const { xArr: i, yArr: s } = this.ctx.selector, [o, r] = i, [a, l] = s;
		return !(e < o || e > r || t < a || t > l);
	}
	initTextEditor() {
		this.inputEl = document.createElement("textarea"), this.inputEl.id = "e-virt-table-editor-textarea", this.inputEl.setAttribute("rows", "1"), this.inputEl.setAttribute("tabindex", "-1"), this.inputEl.addEventListener("input", this.autoSize.bind(this)), this.editorEl = this.ctx.editorElement, this.inputEl.className = "e-virt-table-editor-textarea", this.editorEl.appendChild(this.inputEl), this.ctx.containerElement.appendChild(this.editorEl);
	}
	autoSize() {
		if (!this.ctx.editing) return;
		const t = this.inputEl.value;
		if (this.cellTarget && this.cellTarget.type === "number" && t !== "" && (this.ctx.emit("cellHideTooltip"), !/^-?\d+(\.\d+)?$/.test(t))) {
			const l = this.ctx.locale.getText("numberErrorTip");
			this.ctx.emit("cellShowTooltip", this.cellTarget, l);
		}
		this.inputEl.style.height = "auto";
		let e = this.inputEl.scrollHeight, i = this.ctx.body.visibleHeight;
		e > i && (e = i);
		const { stageHeight: s, footer: o, header: r } = this.ctx, a = s - o.height - B(this.ctx.config);
		this.editorEl.style.bottom = "auto", this.drawY < r.height && (this.editorEl.style.top = `${r.height - 1}px`), this.drawY + e > a && (this.editorEl.style.left = `${this.drawX - 1}px`, this.editorEl.style.top = "auto", this.editorEl.style.bottom = `${s - a}px`), this.inputEl.style.height = `${e}px`;
	}
	startEditByInput(t, e = !1) {
		const i = e ? null : t.getValue(), { editorType: s } = t;
		if (s === "none") return;
		t.update(), this.ctx.config.ENABLE_MERGE_CELL_LINK && t.updateSpanInfo();
		let { height: o, width: r, drawY: a, drawX: l } = t;
		this.drawX = l, this.drawY = a;
		const { config: { CELL_PADDING: c }, header: f } = this.ctx;
		let d = this.ctx.body.visibleHeight;
		o > d && (o = d), this.editorEl.style.zIndex = "100", this.editorEl.style.left = `${this.drawX - 1}px`, this.editorEl.style.top = `${this.drawY}px`, this.editorEl.style.bottom = "auto", this.editorEl.style.maxWidth = "none", this.editorEl.style.border = "", this.editorEl.style.maxHeight = `${d}px`, ["text"].includes(s) ? (this.inputEl.style.opacity = "1", this.inputEl.style.position = "relative", this.inputEl.style.minWidth = `${r - 1}px`, this.inputEl.style.minHeight = `${o - 1}px`, this.inputEl.style.maxHeight = `${d}px`, this.inputEl.style.width = `${r}px`, this.inputEl.style.height = "auto", this.inputEl.style.padding = `${c}px`, this.inputEl.value = "", i !== null && (this.inputEl.value = i), (this.inputEl.scrollHeight > o || this.drawY < f.height) && this.autoSize()) : (this.inputEl.style.opacity = "0", this.inputEl.style.zIndex = "-1", this.inputEl.style.width = "1px", this.inputEl.style.height = "1px", this.inputEl.style.position = "absolute", this.inputEl.style.left = "0px", this.inputEl.style.top = "0px");
	}
	doneEditByInput() {
		if (this.cellTarget && this.cellTarget.editorType === "text") {
			const { rowKey: t, key: e } = this.cellTarget, i = this.cellTarget.getValue(), s = this.inputEl.value;
			s !== i && !(s === "" && i === null) && !this.cancel && this.ctx.setItemValueByEditor(t, e, s, !0);
		}
	}
	focusInput() {
		document.activeElement !== this.inputEl && this.inputEl.focus({ preventScroll: !0 });
	}
	startEdit(t = !1) {
		if (this.isTextSelectionActive()) return;
		this.cancel = !1;
		const { ENABLE_EDIT_CLICK_SELECTOR: e } = this.ctx.config;
		if (!e) return;
		const i = this.ctx.focusCell;
		if (!i) return;
		i.isVerticalVisible() && i.isHorizontalVisible() || this.ctx.emit("scrollToIndex", i.rowIndex, i.colIndex), this.editCell(i.rowIndex, i.colIndex, t);
	}
	editCell(t, e, i = !1) {
		const s = this.ctx.body.renderRows.find((d) => d.rowIndex === t);
		if (!s) return;
		const o = s.cells.find((d) => d.colIndex === e);
		if (!o || !(o.isVerticalVisible() && o.isHorizontalVisible())) return;
		this.ctx.emit("setSelectorCell", o);
		const a = this.ctx.focusCell;
		if (!a || [
			"index",
			"index-selection",
			"selection"
		].includes(a.type) || this.enable) return;
		const { rowKey: l, key: c } = a, f = this.ctx.database.getReadonly(l, c);
		a && !f && (this.enable = !0, this.ctx.editing = !0, this.cellTarget = a, this.startEditByInput(this.cellTarget, i), this.ctx.emit("startEdit", this.cellTarget), this.ctx.emit("draw"));
	}
	doneEdit() {
		this.enable && (this.doneEditByInput(), this.ctx.emit("cellHideTooltip"), this.ctx.emit("doneEdit", this.cellTarget), this.enable = !1, this.ctx.editing = !1, this.resetEditorStyle(), setTimeout(() => {
			this.focusInput();
		}, 0), this.ctx.emit("draw"));
	}
	resetEditorStyle() {
		const t = this.cellTarget;
		t && (this.editorEl.style.left = `${t.drawX}px`, this.editorEl.style.top = `${t.drawY}px`, this.editorEl.style.maxWidth = "1px", this.editorEl.style.maxHeight = "1px", this.editorEl.style.zIndex = "-1", this.editorEl.style.border = "none");
	}
	clearEditor() {
		this.doneEdit(), this.cellTarget = null, this.selectorArrStr = "", this.ctx.clearSelector(), this.ctx.focusCell = void 0, this.inputEl.blur(), this.ctx.emit("draw");
	}
	destroy() {
		var t;
		(t = this.editorEl) == null || t.remove();
	}
};
var rs = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "emptyEl");
		this.ctx = t;
		const { EMPTY_CUSTOM_STYLE: e } = this.ctx.config;
		this.ctx.emptyElement ? this.emptyEl = this.ctx.emptyElement : (this.emptyEl = document.createElement("div"), this.emptyEl.innerText = this.getText()), this.emptyEl.className = "e-virt-table-empty", this.emptyEl.style.display = "none", this.ctx.containerElement.appendChild(this.emptyEl), this.ctx.on("emptyChange", ({ type: i, headerHeight: s, bodyHeight: o, footerHeight: r }) => {
			const a = s + (o + r) / 2, l = {
				display: i === "empty" ? "block" : "none",
				top: `${a}px`,
				...e
			};
			Object.assign(this.emptyEl.style, l);
		});
	}
	getText() {
		return this.ctx.config.EMPTY_TEXT || this.ctx.locale.getText("emptyText");
	}
	draw() {
		this.ctx.emptyElement || (this.emptyEl.innerText = this.getText());
	}
	destroy() {
		this.emptyEl.remove();
	}
};
var ns = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "observer");
		this.ctx = t, this.init();
	}
	arerMapsEqual(t, e) {
		if (t.size !== e.size) return !1;
		for (let [i, s] of t) if (!e.has(i) || e.get(i) !== s) return !1;
		return !0;
	}
	init() {
		this.observer = new MutationObserver(Nt(() => {
			const t = this.ctx.overlayerElement.querySelectorAll("[data-auto-height=\"true\"]"), e = /* @__PURE__ */ new Map();
			t.forEach((o) => {
				const r = Number(o.getAttribute("data-row-index")), a = Number(o.getAttribute("data-col-index"));
				if (isNaN(r) || isNaN(a)) return;
				const l = o.getBoundingClientRect(), c = `${r}​_${a}`;
				e.set(c, Math.round(l.height));
			});
			const i = this.ctx.database.getOverlayerAutoHeightMap();
			if (!this.arerMapsEqual(i, e)) {
				if (this.ctx.database.setOverlayerAutoHeightMap(e), i.size === 0 && e.size === 0) return;
				this.ctx.emit("draw");
			}
		}, 16.67)), this.observer.observe(this.ctx.overlayerElement, {
			childList: !0,
			subtree: !0,
			attributes: !0,
			characterData: !0
		}), this.ctx.overlayerElement.getAttribute("data-overlayer") === "default" && this.ctx.on("overlayerChange", (t) => {
			const e = this.ctx.overlayerElement;
			e.replaceChildren(), Object.assign(e.style, t.style), t.views.forEach((i) => {
				const s = document.createElement("div");
				s.className = i.class, Object.assign(s.style, i.style), i.views.forEach((o) => {
					const r = document.createElement("div");
					Object.assign(r.style, o.style), o.cells.forEach((a) => {
						const l = document.createElement("div");
						Object.assign(l.style, a.style), Object.keys(a.domDataset || {}).forEach((c) => {
							l.setAttribute(c, a.domDataset[c]);
						}), typeof a.render == "function" && a.render(l, a), r.appendChild(l);
					}), s.appendChild(r);
				}), e.appendChild(s);
			});
		});
	}
	draw() {
		const t = this.getContainer();
		this.ctx.emit("overlayerChange", t);
	}
	destroy() {
		this.observer && this.observer.disconnect(), this.ctx.emit("overlayerChange", {
			style: {},
			views: []
		});
	}
	getContainer() {
		const t = this.getHeader(), e = this.getBody(), i = this.getFooter();
		let s = [];
		const { FOOTER_FIXED: o, FOOTER_POSITION: r } = this.ctx.config;
		return o ? r === "top" ? s = [
			t,
			i,
			e
		] : s = [
			t,
			e,
			i
		] : s = [t, e], { views: s };
	}
	getHeader() {
		const { fixedLeftWidth: t, fixedRightWidth: e, config: { CSS_PREFIX: i } } = this.ctx, s = B(this.ctx.config), { visibleWidth: o, visibleHeight: r, renderCellHeaders: a } = this.ctx.header;
		let l = [], c = [], f = [];
		a.forEach((g) => {
			g.render && (g.fixed === "left" ? c.push(g) : g.fixed === "right" ? f.push(g) : l.push(g));
		});
		const d = e - s, u = {
			key: "left",
			style: {
				position: "absolute",
				top: "0px",
				left: "0px",
				overflow: "hidden",
				width: `${t}px`,
				height: `${r}px`
			},
			cells: c
		}, x = {
			key: "center",
			style: {
				position: "absolute",
				top: "0px",
				left: `${t}px`,
				overflow: "hidden",
				width: `${o - t - d + 1}px`,
				height: `${r}px`
			},
			cells: l
		}, w = {
			key: "right",
			style: {
				position: "absolute",
				top: "0px",
				right: "0px",
				overflow: "hidden",
				width: `${d + 1}px`,
				height: `${r}px`
			},
			cells: f
		};
		return {
			type: "header",
			class: `${i}-overlayer-header`,
			style: {
				position: "relative",
				overflow: "hidden",
				width: `${o}px`,
				height: `${r}px`
			},
			views: [
				u,
				x,
				w
			]
		};
	}
	getBody() {
		const t = [], e = [], i = [];
		let s = this.ctx.body.renderRows;
		this.ctx.config.FOOTER_FIXED || (s = s.concat(this.ctx.footer.renderRows)), s.forEach((g) => {
			g.cells.forEach((m) => {
				m.cellType === "footer" && (m.render = m.renderFooter), m.render && (m.fixed === "left" ? e.push(m) : m.fixed === "right" ? i.push(m) : t.push(m));
			});
		});
		const { fixedLeftWidth: o, fixedRightWidth: r, config: { CSS_PREFIX: a } } = this.ctx, l = B(this.ctx.config), { visibleWidth: c, visibleHeight: f } = this.ctx.body, d = r - l, u = {
			key: "left",
			style: {
				position: "absolute",
				top: `0.5px`,
				left: `0.5px`,
				overflow: "hidden",
				width: `${o}px`,
				height: `${f}px`
			},
			cells: e
		}, x = {
			key: "center",
			style: {
				position: "absolute",
				top: `0.5px`,
				left: `${o - .5}px`,
				overflow: "hidden",
				width: `${c - o - d}px`,
				height: `${f}px`
			},
			cells: t
		}, w = {
			key: "right",
			style: {
				position: "absolute",
				top: "0px",
				right: "0px",
				overflow: "hidden",
				width: `${d}px`,
				height: `${f}px`
			},
			cells: i
		};
		return {
			type: "body",
			class: `${a}-overlayer-body`,
			style: {
				position: "relative",
				overflow: "hidden",
				width: `${c}px`,
				height: `${f}px`
			},
			views: [
				u,
				x,
				w
			]
		};
	}
	getFooter() {
		const t = [], e = [], i = [];
		this.ctx.footer.renderRows.forEach((E) => {
			E.cells.forEach((g) => {
				g.cellType === "footer" && g.renderFooter && (g.render = g.renderFooter, g.fixed === "left" ? e.push(g) : g.fixed === "right" ? i.push(g) : t.push(g));
			});
		});
		const { fixedLeftWidth: s, fixedRightWidth: o, config: { CSS_PREFIX: r } } = this.ctx, a = B(this.ctx.config), { visibleWidth: l, visibleHeight: c } = this.ctx.footer, f = o - a, d = {
			key: "left",
			style: {
				position: "absolute",
				top: `0.5px`,
				left: `0.5px`,
				overflow: "hidden",
				width: `${s}px`,
				height: `${c}px`
			},
			cells: e
		}, u = {
			key: "center",
			style: {
				position: "absolute",
				top: `0.5px`,
				left: `${s - .5}px`,
				overflow: "hidden",
				width: `${l - s - f}px`,
				height: `${c}px`
			},
			cells: t
		}, x = {
			key: "right",
			style: {
				position: "absolute",
				top: `0.5px`,
				right: `0.5px`,
				overflow: "hidden",
				width: `${f}px`,
				height: `${c}px`
			},
			cells: i
		};
		return {
			type: "footer",
			class: `${r}-overlayer-footer`,
			style: {
				position: "relative",
				overflow: "hidden",
				width: `${l}px`,
				height: `${c}px`
			},
			views: [
				d,
				u,
				x
			]
		};
	}
};
var ne = class {
	constructor(t, e = [], i = {}) {
		n(this, "container");
		n(this, "menuData");
		n(this, "onClick");
		n(this, "activeSubmenus", /* @__PURE__ */ new Set());
		n(this, "boundMouseEnterHandler");
		n(this, "boundMouseLeaveHandler");
		n(this, "boundClickHandler");
		this.container = t, this.menuData = e, this.onClick = i.onClick, this.boundMouseEnterHandler = (s) => this.handleMouseEvent(s, "enter"), this.boundMouseLeaveHandler = (s) => this.handleMouseEvent(s, "leave"), this.boundClickHandler = (s) => this.handleClick(s), this.createMenu(), this.bindEvents();
	}
	createMenu() {
		this.container.className = "e-virt-table-main-menu", this.container.style.display = "block";
		const t = document.createDocumentFragment();
		this.menuData.forEach((e) => {
			t.appendChild(this.createMenuItem(e));
		}), this.container.appendChild(t);
	}
	createMenuItem(t, e = !1) {
		var r;
		const i = this.createElement("div", e ? "e-virt-table-submenu-item" : "e-virt-table-menu-item");
		i.setAttribute(e ? "data-submenu" : "data-menu", t.value), t.disabled && i.classList.add("disabled");
		const s = this.createElement("div", "e-virt-table-menu-item-content");
		if (t.icon) {
			const a = this.createElement("span", "e-virt-table-menu-item-icon");
			a.innerHTML = t.icon, s.appendChild(a);
		} else s.classList.add("menu-item-no-icon");
		const o = this.createElement("span", "e-virt-table-menu-item-text");
		if (o.textContent = t.label || "", s.appendChild(o), i.appendChild(s), (r = t.children) != null && r.length) {
			const a = this.createElement("span", "e-virt-table-menu-arrow");
			a.innerHTML = ut, i.appendChild(a);
			const l = this.createSubmenu(t.children);
			i._submenu = l, this.container.appendChild(l);
		}
		return i;
	}
	createSubmenu(t) {
		const e = this.createElement("div", "e-virt-table-submenu");
		return t.forEach((i) => {
			e.appendChild(this.createMenuItem(i, !0));
		}), e;
	}
	createElement(t, e = "") {
		const i = document.createElement(t);
		return e && (i.className = e), i;
	}
	bindEvents() {
		this.container.addEventListener("mouseenter", this.boundMouseEnterHandler, !0), this.container.addEventListener("mouseleave", this.boundMouseLeaveHandler, !0), this.container.addEventListener("click", this.boundClickHandler);
	}
	handleMouseEvent(t, e) {
		t.stopPropagation();
		const s = t.target.closest(".e-virt-table-menu-item, .e-virt-table-submenu-item");
		s && (this.container.contains(s) || s.classList.contains("e-virt-table-submenu-item")) && (e === "enter" ? this.handleHover(s) : this.handleLeave(s));
	}
	handleHover(t) {
		t.classList.contains("e-virt-table-menu-item") && (this.container.querySelectorAll(".e-virt-table-menu-item").forEach((i) => i.classList.remove("active")), t.classList.contains("disabled") || t.classList.add("active"));
		const e = t._submenu || t.querySelector(".e-virt-table-submenu");
		e && (this.hideSiblingSubmenus(t), this.showSubmenu(t, e));
	}
	handleLeave(t) {
		const e = t._submenu || t.querySelector(".e-virt-table-submenu");
		setTimeout(() => {
			const i = e;
			i && !i.matches(":hover") && !t.matches(":hover") && (this.hideSubmenu(i), t.classList.contains("e-virt-table-menu-item") && t.classList.remove("active"));
		}, 150);
	}
	hideSiblingSubmenus(t) {
		let e;
		if (t.classList.contains("e-virt-table-menu-item")) e = this.container.querySelectorAll(".e-virt-table-menu-item");
		else {
			const i = t.closest(".e-virt-table-submenu");
			if (i) e = i.querySelectorAll(".e-virt-table-submenu-item");
			else return;
		}
		e.forEach((i) => {
			i !== t && i._submenu && this.hideSubmenu(i._submenu);
		});
	}
	async showSubmenu(t, e) {
		if (this.activeSubmenus.has(e)) return;
		this.activeSubmenus.add(e), e.classList.add("show");
		e._cleanup = At(t, e, async () => {
			const s = this.container.getBoundingClientRect(), o = window.innerWidth, r = e.offsetWidth || 200, a = o - s.right, l = s.left, { x: f, y: d } = await pt(t, e, {
				placement: a >= r || a >= l ? "right-start" : "left-start",
				middleware: [mt(8), Et({ padding: 8 })]
			});
			Object.assign(e.style, {
				left: `${f}px`,
				top: `${d}px`
			});
		});
	}
	hideSubmenu(t) {
		if (!this.activeSubmenus.has(t)) return;
		this.activeSubmenus.delete(t), t.classList.remove("show"), this.hideAllChildSubmenus(t);
		const e = t;
		e._cleanup && (e._cleanup(), delete e._cleanup);
	}
	hideAllChildSubmenus(t) {
		t.querySelectorAll(".e-virt-table-submenu-item").forEach((i) => {
			if (i._submenu) {
				const s = i._submenu;
				if (this.activeSubmenus.has(s)) {
					this.activeSubmenus.delete(s), s.classList.remove("show");
					const o = s;
					o._cleanup && (o._cleanup(), delete o._cleanup), this.hideAllChildSubmenus(s);
				}
			}
		});
	}
	handleClick(t) {
		t.stopPropagation();
		const e = t.target.closest(".e-virt-table-menu-item, .e-virt-table-submenu-item");
		if (!e || e.classList.contains("disabled")) return;
		if (e.classList.contains("e-virt-table-menu-item")) {
			const o = e._submenu || e.querySelector(".e-virt-table-submenu");
			if (o) {
				this.showSubmenu(e, o);
				return;
			}
		}
		const i = e.getAttribute("data-menu") || (e == null ? void 0 : e.getAttribute("data-submenu")), s = this.findMenuItem(i || "");
		s && this.onClick && this.onClick(s, i || "");
	}
	findMenuItem(t, e = this.menuData) {
		for (const i of e) {
			if (i.value === t) return i;
			if (i.children) {
				const s = this.findMenuItem(t, i.children);
				if (s) return s;
			}
		}
		return null;
	}
	positionMenu(t) {
		const e = {
			getBoundingClientRect: () => ({
				width: 0,
				height: 0,
				top: t.clientY,
				left: t.clientX,
				right: t.clientX,
				bottom: t.clientY,
				x: t.clientX,
				y: t.clientY
			}),
			contextElement: document.body
		};
		At(e, this.container, () => {
			pt(e, this.container, {
				placement: "right-start",
				middleware: [
					mt(),
					Et(),
					Vt()
				]
			}).then(({ x: i, y: s }) => {
				this.container && Object.assign(this.container.style, {
					left: `${i}px`,
					top: `${s}px`
				});
			});
		});
	}
	destroy() {
		this.container.removeEventListener("mouseenter", this.boundMouseEnterHandler, !0), this.container.removeEventListener("mouseleave", this.boundMouseLeaveHandler, !0), this.container.removeEventListener("click", this.boundClickHandler), this.cleanupAllSubmenus(this.container), this.container.style.display = "none", this.container.replaceChildren();
	}
	/**
	* 删除指定值的菜单项
	* @param value 要删除的菜单项的值
	* @returns 是否成功删除
	*/
	removeMenuItem(t) {
		const e = this.container.querySelector(`[data-menu="${t}"]`);
		if (!e) return !1;
		const i = e.querySelector(".e-virt-table-submenu");
		return i && this.cleanupSubmenuRecursively(i), e.remove(), !0;
	}
	/**
	* 删除指定值的子菜单项
	* @param value 要删除的子菜单项的值
	* @returns 是否成功删除
	*/
	removeSubMenuItem(t) {
		const e = this.container.querySelector(`[data-submenu="${t}"]`);
		if (!e) return !1;
		const i = e.closest(".e-virt-table-submenu"), s = e._submenu;
		if (s && this.cleanupSubmenuRecursively(s), e.remove(), i && i.querySelectorAll(".e-virt-table-submenu-item").length === 0) {
			const r = this.container.querySelector("[data-menu]");
			if (r && r._submenu === i) this.removeMenuItem(r.getAttribute("data-menu") || "");
			else {
				const a = this.container.querySelectorAll("[data-menu], [data-submenu]");
				for (const l of a) if (l._submenu === i) {
					const c = l.getAttribute("data-menu") || l.getAttribute("data-submenu");
					c && (l.hasAttribute("data-menu") ? this.removeMenuItem(c) : this.removeSubMenuItem(c));
					break;
				}
			}
		}
		return !0;
	}
	cleanupAllSubmenus(t) {
		t.querySelectorAll(".e-virt-table-menu-item").forEach((i) => {
			i._submenu && (this.cleanupSubmenuRecursively(i._submenu), i._submenu = void 0);
		});
	}
	cleanupSubmenuRecursively(t) {
		const e = t;
		e._cleanup && (e._cleanup(), delete e._cleanup), t.querySelectorAll(".e-virt-table-submenu-item").forEach((s) => {
			s._submenu && this.cleanupSubmenuRecursively(s._submenu);
		}), t.remove();
	}
};
var as = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "contextMenuEl");
		n(this, "currentDOMTreeMenu");
		n(this, "isCustom", !1);
		this.ctx = t, this.ctx.contextMenuElement ? (this.contextMenuEl = this.ctx.contextMenuElement, this.contextMenuEl.className = "e-virt-table-main-menu", this.isCustom = !0) : (this.contextMenuEl = document.createElement("div"), this.isCustom = !1), this.ctx.containerElement.appendChild(this.contextMenuEl), this.init();
	}
	init() {
		this.ctx.on("outsideMousedown", () => {
			this.hide();
		}), this.ctx.on("cellContextMenuClick", async (t, e) => {
			if (this.isCustom) {
				this.contextMenuEl.style.display = "block", this.positionMenu(e);
				return;
			}
			const { ENABLE_CONTEXT_MENU: i, CUSTOM_BODY_CONTEXT_MENU: s, CONTEXT_MENU: o, BEFORE_BODY_CONTEXT_MENU_METHOD: r } = this.ctx.config;
			let a = o.map((m) => ({
				...m,
				label: m.label || this.ctx.locale.getText(m.value)
			}));
			if (a = [...a, ...s], r && (a = await r({
				list: a,
				cell: t,
				hide: this.hide.bind(this)
			})), !i || a.length === 0) return;
			e.preventDefault();
			const { xArr: l, yArr: c } = this.ctx.selector, [f, d] = l, [u, x] = c, { rowIndex: w, colIndex: E } = t;
			w >= u && w <= x && E >= f && E <= d || this.ctx.emit("setSelectorCell", t, e), this.currentDOMTreeMenu && this.currentDOMTreeMenu.destroy(), this.ctx.contextMenuIng = !0, this.currentDOMTreeMenu = new ne(this.contextMenuEl, a, { onClick: (m, y) => {
				y === "copy" ? (this.ctx.emit("contextMenuCopy"), this.hide()) : y === "paste" ? (this.ctx.emit("contextMenuPaste"), this.hide()) : y === "cut" ? (this.ctx.emit("contextMenuCut"), this.hide()) : y === "clearSelected" ? (this.ctx.emit("contextMenuClearSelected"), this.hide()) : m.event && m.event(e, {
					hide: this.hide.bind(this),
					cell: t
				});
			} }), this.currentDOMTreeMenu.positionMenu(e);
		}), this.ctx.on("cellHeaderContextMenuClick", async (t, e) => {
			if (this.isCustom) {
				this.contextMenuEl.style.display = "block", this.positionMenu(e);
				return;
			}
			const { SELECTOR_AREA_MIN_X: i, SELECTOR_AREA_MAX_X: s, SELECTOR_AREA_MAX_X_OFFSET: o, BEFORE_HEADER_CONTEXT_MENU_METHOD: r } = this.ctx.config, a = i, l = s || this.ctx.maxColIndex - o;
			if (t.colIndex < a || t.colIndex > l) return;
			const { HEADER_CONTEXT_MENU: c, CUSTOM_HEADER_CONTEXT_MENU: f, ENABLE_HEADER_CONTEXT_MENU: d } = this.ctx.config;
			let u = c.map((R) => ({
				...R,
				label: R.label || this.ctx.locale.getText(R.value)
			}));
			if (u = [...u, ...f], r && (u = await r({
				list: u,
				cell: t,
				hide: this.hide.bind(this)
			})), !d || u.length === 0) return;
			e.preventDefault();
			const { xArr: x } = this.ctx.selector, [w, E] = x, { colIndex: g } = t;
			g >= w && g <= E || (this.ctx.focusCellHeader = t, this.ctx.emit("selectCols", t)), this.currentDOMTreeMenu && this.currentDOMTreeMenu.destroy();
			const y = this.ctx.database.getColumns(), p = u.map((R) => R.value === "visible" ? {
				...R,
				children: this.filterColumns(y)
			} : R);
			this.ctx.contextMenuIng = !0, this.currentDOMTreeMenu = new ne(this.contextMenuEl, p, { onClick: (R, C) => {
				const { xArr: b } = this.ctx.selector, [_, T] = b;
				if (C === "fixedLeft" || C === "fixedRight" || C === "fixedNone") {
					const v = this.ctx.header.allCellHeaders.filter((I) => I.colIndex >= _ && I.colIndex <= T).filter((I) => I.level === 0).filter((I) => !I.column.fixedDisabled).map((I) => I.key);
					this.ctx.database.setCustomHeaderFixedData(v, C === "fixedLeft" ? "left" : C === "fixedRight" ? "right" : ""), this.hide();
				} else if (C === "hide") {
					const v = this.ctx.header.leafCellHeaders.filter((I) => I.colIndex >= _ && I.colIndex <= T).filter((I) => !I.children.length).filter((I) => !I.column.hideDisabled).map((I) => I.key);
					v.length > 0 && this.ctx.database.setCustomHeaderHideData(v, !0), this.hide();
				} else if (C !== "visible") if (C.startsWith("visible_")) {
					if (!R.key) return;
					if (R.children) {
						const O = this.getLeafKeys(R.children);
						this.ctx.database.setCustomHeaderHideData(O, !1);
					} else this.ctx.database.setCustomHeaderHideData([R.key], !1);
					this.currentDOMTreeMenu && this.currentDOMTreeMenu.removeSubMenuItem(C);
					st(this.ctx.database.getColumns()).filter((O) => O.hide).length === 0 && this.hide();
				} else C === "resetHeader" ? (this.ctx.database.resetCustomHeader(), this.hide()) : R.event && R.event(e, {
					hide: this.hide.bind(this),
					cell: t
				});
			} }), this.positionMenu(e);
		}), this.ctx.on("click", () => {
			this.hide();
		}), this.ctx.on("onScroll", this.hide.bind(this)), this.ctx.on("resize", this.hide.bind(this));
	}
	positionMenu(t) {
		const e = {
			getBoundingClientRect: () => ({
				width: 0,
				height: 0,
				top: t.clientY,
				left: t.clientX,
				right: t.clientX,
				bottom: t.clientY,
				x: t.clientX,
				y: t.clientY
			}),
			contextElement: document.body
		};
		At(e, this.contextMenuEl, () => {
			pt(e, this.contextMenuEl, {
				placement: "right-start",
				middleware: [
					mt(),
					Et(),
					Vt()
				]
			}).then(({ x: i, y: s }) => {
				this.contextMenuEl && Object.assign(this.contextMenuEl.style, {
					left: `${i}px`,
					top: `${s}px`
				});
			});
		});
	}
	filterColumns(t) {
		const e = [];
		for (const i of t) if (i.children && i.children.length > 0) {
			const s = this.filterColumns(i.children);
			s.length > 0 && e.push({
				label: i.title,
				key: i.key,
				value: `visible_${i.key}`,
				children: s
			});
		} else i.hide && e.push({
			label: i.title,
			value: `visible_${i.key}`,
			key: i.key
		});
		return e;
	}
	getLeafKeys(t) {
		return t.reduce((e, i) => (!i.children || i.children.length === 0 ? e.push(String(i.key)) : e.push(...this.getLeafKeys(i.children)), e), []);
	}
	hide() {
		this.currentDOMTreeMenu && (this.currentDOMTreeMenu.destroy(), this.currentDOMTreeMenu = void 0), this.contextMenuEl.style.display = "none", this.ctx.contextMenuIng = !1;
	}
	destroy() {
		var t;
		this.hide(), (t = this.contextMenuEl) == null || t.remove();
	}
};
var ls = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "loadingEl");
		n(this, "textEl", document.createElement("p"));
		if (this.ctx = t, this.ctx.loadingElement) this.loadingEl = this.ctx.loadingElement;
		else {
			this.loadingEl = document.createElement("div");
			const e = document.createElement("div");
			e.className = "e-virt-table-loading-spinner";
			const i = this.ctx.icons.getSvg("loading");
			if (i) {
				const r = new DOMParser().parseFromString(i.svg, "image/svg+xml").documentElement;
				e.appendChild(r);
			}
			this.textEl.className = "e-virt-table-loading-text", this.textEl.innerText = this.getText(), e.appendChild(this.textEl), this.loadingEl.appendChild(e);
		}
		this.loadingEl.className = "e-virt-table-loading", this.loadingEl.style.display = "none", this.ctx.containerElement.appendChild(this.loadingEl);
	}
	getText() {
		return this.ctx.config.LOADING_TEXT || this.ctx.locale.getText("loadingText");
	}
	show() {
		this.loadingEl.style.display = "flex";
	}
	hide() {
		this.loadingEl.style.display = "none";
	}
	draw() {
		this.ctx.loadingElement || (this.textEl.innerText = this.getText());
	}
	destroy() {
		this.loadingEl.remove();
	}
};
var cs = class {
	constructor(t) {
		n(this, "ctx");
		n(this, "container");
		n(this, "input");
		n(this, "prevBtn");
		n(this, "nextBtn");
		n(this, "closeBtn");
		n(this, "countEl");
		n(this, "loadingEl");
		n(this, "isVisible", !1);
		n(this, "searchResults", []);
		n(this, "currentIndex", -1);
		n(this, "searchData", []);
		n(this, "isComposing", !1);
		this.ctx = t, this.container = this.createContainer(), this.ctx.containerElement.appendChild(this.container), this.bindEvents(), this.ctx.on("keydown", (e) => {
			if (this.ctx.config.ENABLE_FINDER && !this.ctx.editing) {
				if ((e.ctrlKey || e.metaKey) && e.code === "KeyF") {
					e.preventDefault(), this.show();
					return;
				}
				if (this.ctx.finding) {
					if (e.code === "Escape") {
						e.preventDefault(), this.hide();
						return;
					}
					if (e.code === "ArrowUp" || e.shiftKey && e.key === "Enter") {
						e.preventDefault(), this.navigatePrevious();
						return;
					}
					if (e.code === "ArrowDown" || e.key === "Enter") {
						e.preventDefault(), this.navigateNext();
						return;
					}
				}
			}
		}), this.ctx.on("setSelector", () => {
			this.hide();
		}), this.ctx.on("outsideMousedown", () => {
			this.hide();
		});
	}
	async initSearchData() {
		this.showLoading(), this.searchData = [], setTimeout(() => {
			const { allCellHeaders: t } = this.ctx.header;
			for (let s = 0; s < t.length; s++) {
				const o = t[s];
				if (!o) continue;
				const r = o.getFinderText();
				r && this.searchData.push({
					rowIndex: o.level,
					colIndex: o.colIndex,
					text: r,
					type: "header",
					colKey: o.key
				});
			}
			const { maxColIndex: e, maxRowIndex: i } = this.ctx;
			for (let s = 0; s <= i; s++) for (let o = 0; o <= e; o++) {
				const r = this.ctx.database.getVirtualBodyCell(s, o, !1), a = r == null ? void 0 : r.getFinderText();
				a && this.searchData.push({
					rowIndex: s,
					colIndex: o,
					text: a,
					type: "body"
				});
			}
			for (const s of this.ctx.footer.renderRows) for (const o of s.cells) {
				const r = o.getFinderText();
				r && this.searchData.push({
					rowIndex: o.rowIndex,
					colIndex: o.colIndex,
					text: r,
					type: "footer"
				});
			}
			this.hideLoading();
		}, 0);
	}
	createContainer() {
		const t = document.createElement("div");
		t.className = "e-virt-table-finder-bar";
		const e = document.createElement("div");
		e.className = "e-virt-table-finder-bar-input-wrapper", this.input = document.createElement("input"), this.input.type = "text", this.input.className = "e-virt-table-finder-bar-input", this.input.placeholder = "", e.appendChild(this.input), this.loadingEl = document.createElement("div"), this.loadingEl.className = "e-virt-table-finder-bar-loading";
		const i = xe;
		this.loadingEl.innerHTML = i, e.appendChild(this.loadingEl), this.countEl = document.createElement("span"), this.countEl.className = "e-virt-table-finder-bar-count";
		const s = document.createElement("div");
		return s.className = "e-virt-table-finder-bar-nav", this.prevBtn = document.createElement("button"), this.prevBtn.className = "e-virt-table-finder-bar-nav-btn prev-btn", this.prevBtn.innerHTML = ut, this.nextBtn = document.createElement("button"), this.nextBtn.className = "e-virt-table-finder-bar-nav-btn next-btn", this.nextBtn.innerHTML = ut, s.appendChild(this.prevBtn), s.appendChild(this.nextBtn), this.closeBtn = document.createElement("button"), this.closeBtn.className = "e-virt-table-finder-bar-nav-btn close-btn", this.closeBtn.innerHTML = "×", t.appendChild(e), t.appendChild(this.countEl), t.appendChild(s), t.appendChild(this.closeBtn), t;
	}
	bindEvents() {
		this.input.addEventListener("input", () => {
			this.isComposing || this.performSearch();
		}), this.input.addEventListener("compositionstart", () => {
			this.isComposing = !0;
		}), this.input.addEventListener("compositionend", () => {
			this.isComposing = !1, this.performSearch();
		}), this.prevBtn.addEventListener("click", () => {
			this.navigatePrevious();
		}), this.nextBtn.addEventListener("click", () => {
			this.navigateNext();
		}), this.closeBtn.addEventListener("click", () => {
			this.hide();
		});
	}
	performSearch() {
		const t = this.input.value.trim();
		if (this.searchResults = [], this.currentIndex = -1, !t) {
			this.cearFinderBar(), this.updateCount();
			return;
		}
		this.showLoading(), setTimeout(() => {
			this.searchResults = this.searchData.filter((e) => e.text.toLowerCase().includes(t.toLowerCase())), this.searchResults.length > 0 ? (this.currentIndex = 0, this.scrollToCurrentResult()) : this.cearFinderBar(), this.updateCount(), this.hideLoading();
		}, 0);
	}
	scrollToCurrentResult() {
		if (this.currentIndex < 0 || this.currentIndex >= this.searchResults.length) return;
		const t = this.searchResults[this.currentIndex];
		this.ctx.finderBar = t;
		const { rowIndex: e, colIndex: i } = t;
		this.ctx.emit("scrollToIndex", e, i, t.type);
	}
	navigateNext() {
		this.searchResults.length !== 0 && (this.currentIndex = (this.currentIndex + 1) % this.searchResults.length, this.scrollToCurrentResult(), this.updateCount());
	}
	navigatePrevious() {
		this.searchResults.length !== 0 && (this.currentIndex = this.currentIndex <= 0 ? this.searchResults.length - 1 : this.currentIndex - 1, this.scrollToCurrentResult(), this.updateCount());
	}
	updateCount() {
		if (this.searchResults.length === 0) this.input.value.trim() ? (this.countEl.textContent = "0/0", this.countEl.classList.add("no-results")) : (this.countEl.textContent = "", this.countEl.classList.remove("no-results"));
		else {
			const t = this.currentIndex + 1, e = this.searchResults.length;
			this.countEl.textContent = `${t}/${e}`, this.countEl.classList.remove("no-results");
		}
	}
	show() {
		this.isVisible || (this.isVisible = !0, this.ctx.finding = !0, this.container.classList.add("show"), this.input.focus(), this.initSearchData());
	}
	showLoading() {
		var t;
		this.loadingEl.classList.add("show"), (t = this.loadingEl.parentElement) == null || t.classList.add("loading"), this.input.readOnly = !0;
	}
	hideLoading() {
		var t;
		this.loadingEl.classList.remove("show"), (t = this.loadingEl.parentElement) == null || t.classList.remove("loading"), this.input.readOnly = !1;
	}
	cearFinderBar() {
		this.ctx.finderBar = {
			rowIndex: -1,
			colIndex: -1,
			text: "",
			type: "header"
		}, this.ctx.emit("draw");
	}
	hide() {
		this.isVisible && (this.isVisible = !1, this.container.classList.remove("show"), this.ctx.finding = !1, this.input.value = "", this.searchResults = [], this.searchData = [], this.currentIndex = -1, this.hideLoading(), this.ctx.finderBar = {
			rowIndex: -1,
			colIndex: -1,
			text: "",
			type: "header"
		}, this.updateCount(), this.ctx.emit("draw"));
	}
	destroy() {
		this.hide(), this.container.remove();
	}
};
var it = class it {
	constructor(t) {
		n(this, "ctx");
		n(this, "layouts", /* @__PURE__ */ new Map());
		n(this, "activeCellKey", "");
		n(this, "selectionStart", null);
		n(this, "selectionEnd", null);
		n(this, "pending", null);
		this.ctx = t, this.ctx.on("registerTextLayout", (e, i) => this.layouts.set(e, i)), this.ctx.on("mousedown", (e) => this.onMouseDown(e)), this.ctx.on("mousemove", (e) => this.onMouseMove(e)), this.ctx.on("mouseup", () => this.onMouseUp()), this.ctx.on("cellHeaderHoverChange", (e) => this.yieldToColumnDrag(e)), this.ctx.on("cellHoverChange", () => this.yieldToColumnDrag()), this.ctx.on("setSelector", () => this.yieldToSelectorSpan()), this.ctx.on("keydown", (e) => this.onCopyKeydown(e)), this.ctx.on("outsideMousedown", () => this.resetSelection());
	}
	get canSelect() {
		return this.ctx.config.ENABLE_TEXT_SELECTION && !this.ctx.editing && !this.ctx.finding && !this.isSelectorSpanningCells;
	}
	/** Selector 跨格子（含整行/整列）时，禁用文字选中 */
	get isSelectorSpanningCells() {
		return this.ctx.selector.enable && !this.ctx.selectOnlyOne && !this.ctx.onlyMergeCell;
	}
	yieldToSelectorSpan() {
		this.isSelectorSpanningCells && this.resetSelection();
	}
	/** 跨表头列或从表头拖入 body 时，让位给列/区域选择 */
	yieldToColumnDrag(t) {
		const e = this.ctx.focusCellHeader;
		if (!(!this.ctx.textSelecting || !e)) {
			if (t) {
				const i = e.colIndex, s = e.colIndex + e.colspan - 1, o = t.colIndex, r = t.colIndex + t.colspan - 1;
				if (o >= i && r <= s) return;
			}
			this.resetSelection();
		}
	}
	onMouseDown(t) {
		if (!this.canSelect || !this.ctx.isTarget(t)) return;
		this.ctx.containerElement.contains(document.activeElement) || this.ctx.containerElement.focus({ preventScroll: !0 });
		const e = this.hitTest(t);
		if (!e) {
			this.resetSelection();
			return;
		}
		const { offsetX: i, offsetY: s } = this.ctx.getOffset(t);
		this.pending = {
			cellKey: e.cellKey,
			index: e.index,
			startX: i,
			startY: s
		};
	}
	onMouseMove(t) {
		if (!this.canSelect || (this.ctx.textSelecting || this.tryStartDrag(t), !this.ctx.textSelecting)) return;
		const e = this.layouts.get(this.activeCellKey);
		if (!e) return;
		const { offsetX: i, offsetY: s } = this.ctx.getOffset(t), o = this.hitTestText(e, i, s);
		o !== null && (this.selectionEnd = o, this.updateSelection());
	}
	tryStartDrag(t) {
		if (!this.pending || !this.ctx.mousedown) return;
		const { offsetX: e, offsetY: i } = this.ctx.getOffset(t), s = Math.abs(e - this.pending.startX), o = Math.abs(i - this.pending.startY);
		if (s < it.DRAG_THRESHOLD && o < it.DRAG_THRESHOLD) return;
		const r = this.hitTest(t);
		if (!r || r.cellKey !== this.pending.cellKey) {
			this.pending = null;
			return;
		}
		this.activeCellKey = this.pending.cellKey, this.selectionStart = this.pending.index, this.selectionEnd = r.index, this.pending = null, this.ctx.textSelecting = !0, this.updateSelection();
	}
	onMouseUp() {
		this.pending = null, this.ctx.textSelecting = !1, this.ctx.textSelectionStr = this.getSelectedText(), this.ctx.textSelectionStr && this.ctx.emit("drawView");
	}
	onCopyKeydown(t) {
		var i;
		if (!this.canSelect || !((t.ctrlKey || t.metaKey) && t.code === "KeyC")) return;
		const e = this.getSelectedText();
		e && (t.preventDefault(), (i = navigator.clipboard) == null || i.writeText(e).catch((s) => console.error("Copy Failure:", s)));
	}
	/**
	* 命中最顶层文字（固定列/表头后绘制会覆盖普通单元格，取最后一个命中）。
	*/
	hitTest(t) {
		const { offsetX: e, offsetY: i } = this.ctx.getOffset(t);
		let s = null;
		for (const [o, r] of this.layouts) {
			const a = this.hitTestText(r, e, i);
			a !== null && (s = {
				cellKey: o,
				index: a
			});
		}
		return s;
	}
	updateSelection() {
		this.ctx.textSelectionStr = this.getSelectedText(), this.ctx.emit("drawView");
	}
	hitTestText(t, e, i) {
		const { glyphs: s, contentY: o, lineHeight: r, lines: a } = t;
		if (!s.length) return null;
		const l = Math.floor((i - o) / r);
		if (l < 0 || l >= a.length) return null;
		const c = s.filter((w) => w.line === l);
		if (!c.length) return null;
		const f = 2, d = o + l * r;
		if (i < d - f || i >= d + r + f) return null;
		const u = c[0], x = c[c.length - 1];
		if (e < u.x - f || e > x.x + x.width + f) return null;
		if (e <= u.x) return u.index;
		for (const w of c) if (e < w.x + w.width / 2) return w.index;
		return x.index + 1;
	}
	clearLayouts() {
		this.layouts.clear();
	}
	draw() {
		if (!this.ctx.config.ENABLE_TEXT_SELECTION || this.isSelectorSpanningCells) return;
		const t = this.getSelectionRange(), e = t && this.layouts.get(this.activeCellKey);
		e && this.drawTextSelection(e, t);
	}
	drawTextSelection(t, e, i = "#fff", s = "#3b82f6") {
		if (e.start >= e.end) return;
		const o = /* @__PURE__ */ new Map();
		for (const a of t.glyphs) {
			if (a.index < e.start || a.index >= e.end) continue;
			const l = o.get(a.line) ?? [];
			l.push(a), o.set(a.line, l);
		}
		if (!o.size) return;
		const r = this.ctx.paint.getCtx();
		r.save(), r.font = t.font, r.textBaseline = "middle", r.textAlign = "left", o.forEach((a) => {
			const l = a[0], c = a[a.length - 1];
			r.fillStyle = s, r.fillRect(l.x, l.y - 1, c.x + c.width - l.x, l.height), r.fillStyle = i;
			for (const f of a) r.fillText(f.char, f.x, f.y + t.lineHeight / 2);
		}), r.restore();
	}
	getSelectionRange() {
		return this.selectionStart === null || this.selectionEnd === null ? null : {
			start: Math.min(this.selectionStart, this.selectionEnd),
			end: Math.max(this.selectionStart, this.selectionEnd)
		};
	}
	getSelectedText() {
		const t = this.getSelectionRange(), e = t && this.layouts.get(this.activeCellKey);
		return !e || t.start >= t.end ? "" : e.chars.slice(t.start, t.end).join("");
	}
	resetSelection() {
		!this.activeCellKey && this.selectionStart === null && !this.pending && !this.ctx.textSelecting && !this.ctx.textSelectionStr || (this.activeCellKey = "", this.selectionStart = null, this.selectionEnd = null, this.pending = null, this.ctx.textSelecting = !1, this.ctx.textSelectionStr = "", this.ctx.emit("drawView"));
	}
	destroy() {
		this.layouts.clear(), this.resetSelection();
	}
};
n(it, "DRAG_THRESHOLD", 4);
var Dt = it;
var yt = class yt {
	constructor(t, e) {
		n(this, "options");
		n(this, "scroller");
		n(this, "header");
		n(this, "body");
		n(this, "footer");
		n(this, "selector");
		n(this, "autofill");
		n(this, "tooltip");
		n(this, "editor");
		n(this, "empty");
		n(this, "overlayer");
		n(this, "contextMenu");
		n(this, "loading");
		n(this, "finderBar");
		n(this, "textSelector");
		n(this, "animationFrameId");
		n(this, "ctx");
		this.options = e;
		const { overlayerElement: i, editorElement: s, emptyElement: o, contextMenuElement: r } = this.options, a = this.createContainer(t, i, s, o, r);
		this.ctx = new di(a, this.options), this.textSelector = new Dt(this.ctx), this.header = new gi(this.ctx), this.footer = new mi(this.ctx), this.body = new wi(this.ctx), this.scroller = new ui(this.ctx), this.selector = new Ei(this.ctx), this.autofill = new pi(this.ctx), this.tooltip = new ss(this.ctx), this.empty = new rs(this.ctx), this.editor = new os(this.ctx), this.overlayer = new ns(this.ctx), this.contextMenu = new as(this.ctx), this.loading = new ls(this.ctx), this.finderBar = new cs(this.ctx), this.ctx.on("loadData", (l) => {
			this.loadData(l);
		}), this.ctx.on("draw", () => {
			this.draw();
		}), this.ctx.on("drawView", () => {
			this.draw(!0);
		}), this.draw();
	}
	static useLocale(t) {
		yt.locale = t;
	}
	createContainer(t, e, i, s, o) {
		t.className = "e-virt-table-container";
		const r = document.createElement("div"), a = document.createElement("canvas"), l = e || document.createElement("div");
		r.className = "e-virt-table-stage", t.tabIndex = 0, a.className = "e-virt-table-canvas", l.className = "e-virt-table-overlayer", l.setAttribute("data-overlayer", e ? "custom" : "default");
		const c = i || document.createElement("div");
		c.className = "e-virt-table-editor";
		const f = s, d = o;
		return r.appendChild(a), r.appendChild(l), t.appendChild(r), {
			containerElement: t,
			stageElement: r,
			canvasElement: a,
			overlayerElement: l,
			editorElement: c,
			emptyElement: f,
			contextMenuElement: d
		};
	}
	doDraw(t = !1) {
		this.updateStageBorder(), this.header.update(), this.body.update(), this.footer.update(), this.ctx.paint.clear(), this.textSelector.clearLayouts(), this.body.draw(), this.footer.draw(), this.header.draw(), this.textSelector.draw(), this.body.drawDragRowTip(), this.scroller.draw(), this.empty.draw(), this.loading.draw(), t || this.overlayer.draw();
	}
	updateStageBorder() {
		const { BORDER: t, BORDER_COLOR: e, BORDER_RADIUS: i } = this.ctx.config;
		this.ctx.stageElement.dataset.borderStyle = rt(t), this.ctx.stageElement.style.borderColor = Ge(t) ? e : "transparent", this.ctx.stageElement.style.borderRadius = `${i}px`;
	}
	draw(t = !1) {
		this.animationFrameId && cancelAnimationFrame(this.animationFrameId), this.animationFrameId = requestAnimationFrame(() => {
			this.doDraw(t), this.body.updateAutoHeight() && this.doDraw(t);
		});
	}
	loadConfig(t) {
		this.ctx.config.init(t), this.ctx.database.init(!1), this.header.init(), this.ctx.emit("draw");
	}
	loadColumns(t) {
		this.editor.doneEdit(), this.ctx.database.setColumns(t), this.header.init(), this.ctx.emit("draw");
	}
	loadData(t) {
		this.editor.doneEdit(), this.ctx.database.setData(t), this.header.init(), this.tooltip.hide(), this.ctx.emit("draw");
	}
	loadFooterData(t) {
		this.ctx.database.setFooterData(t), this.ctx.emit("draw");
	}
	setCustomHeader(t, e = !0) {
		this.ctx.database.setCustomHeader(t, e), this.header.init(), this.ctx.emit("draw");
	}
	getCustomHeader() {
		return this.header.getCustomHeader();
	}
	showColumns(t, e = !0) {
		this.ctx.database.setCustomHeaderHideData(t, !e), this.header.init(), this.ctx.emit("draw");
	}
	fixedColumns(t, e) {
		this.ctx.database.setCustomHeaderFixedData(t, e), this.header.init(), this.ctx.emit("draw");
	}
	setLoading(t) {
		this.ctx.loading = t, t ? this.loading.show() : this.loading.hide();
	}
	on(t, e) {
		this.ctx.on(t, e);
	}
	emit(t, ...e) {
		this.ctx.emit(t, ...e);
	}
	off(t, e) {
		this.ctx.off(t, e);
	}
	filterMethod(t) {
		this.ctx.database.setFilterMethod(t), this.ctx.database.init(!1), this.header.init(), this.ctx.emit("draw");
	}
	editCell(t, e) {
		this.editor.editCell(t, e);
	}
	setItemValue(t, e, i, s = !0, o = !0, r = !1, a = !0) {
		this.ctx.database.setItemValue(t, e, i, s, o, r, a);
	}
	batchSetItemValue(t, e = !0, i = !0) {
		this.ctx.database.batchSetItemValue(t, e, i);
	}
	setItemValueByEditor(t, e, i, s = !0, o = !0, r = !0) {
		this.ctx.setItemValueByEditor(t, e, i, s, o, r), this.editor.doneEdit();
	}
	clearEditableData(t = null) {
		const e = [0, this.ctx.maxColIndex], i = [0, this.ctx.maxRowIndex];
		return this.selector.clearSelectedData(e, i, !1, t);
	}
	clearEditor() {
		this.editor.clearEditor();
	}
	doLayout() {
		this.ctx.emit("draw");
	}
	getChangedData() {
		return this.ctx.database.getChangedData();
	}
	getChangedRows() {
		return this.ctx.database.getChangedRows();
	}
	setCurrentRowByRowIndex(t) {
		this.ctx.currentCell = this.ctx.database.getVirtualBodyCell(t, 0), this.ctx.emit("draw");
	}
	setCurrentRow(t) {
		const e = this.ctx.database.getColumnByColIndex(0);
		e && (this.ctx.currentCell = this.ctx.database.getVirtualBodyCellByKey(t, e.key), this.ctx.emit("draw"));
	}
	getCurrentRow() {
		const t = this.ctx.currentCell;
		return t ? {
			row: t.row,
			rowIndex: t.rowIndex,
			rowKey: t.rowKey
		} : void 0;
	}
	clearValidate() {
		this.ctx.database.clearValidate(), this.ctx.emit("draw");
	}
	validateFields(t, e = !0) {
		return new Promise(async (i, s) => {
			let o = [];
			for (let r = 0; r < t.length; r++) {
				const { rowKey: a, key: l } = t[r], c = await this.ctx.database.getValidator(a, l);
				Array.isArray(c) && c.length && o.push(c);
			}
			if (o.length) {
				if (s(o), e) {
					const [r] = o;
					if (Array.isArray(r) && r.length) {
						const [a] = r, { rowKey: l, key: c } = a;
						this.scrollToRowkey(l), this.scrollToColkey(c);
					}
				}
				this.ctx.emit("draw");
			} else i([]), this.ctx.emit("draw");
		});
	}
	async validate(t = !0) {
		return new Promise(async (e, i) => {
			try {
				e(await this.getValidations());
			} catch (s) {
				if (t && Array.isArray(s) && s.length) {
					const [o] = s;
					if (Array.isArray(o) && o.length) {
						const [r] = o, { rowKey: a, key: l } = r, c = this.ctx.database.getRowForRowKey(a);
						if (c) {
							const { parentRowKeys: f = [] } = c;
							f && f.length && this.setExpandRowKeys(f, !0);
						}
						this.scrollToRowkey(a), this.scrollToColkey(l);
					}
				}
				i(s);
			}
		});
	}
	setValidations(t) {
		if (t.forEach((e) => {
			const { rowIndex: i, key: s, message: o, rowKey: r } = e;
			if (i !== void 0 && r === void 0) {
				const a = this.ctx.database.getRowKeyForRowIndex(i);
				this.ctx.database.setValidationErrorByRowKey(a, s, o);
			}
			r && this.ctx.database.setValidationErrorByRowKey(r, s, o);
		}), t && Array.isArray(t) && t.length) {
			const [e] = t;
			if (e && e.rowKey) this.scrollToRowkey(e.rowKey), this.scrollToColkey(e.key);
			else if (e && e.rowIndex !== void 0 && e.rowIndex >= 0 && e.key) {
				const { rowIndex: i, key: s } = e;
				this.scrollToRowIndex(i), this.scrollToColkey(s);
			}
		}
	}
	getValidations() {
		return this.ctx.config.DISABLED ? new Promise((t) => {
			t([]);
		}) : new Promise(async (t, e) => {
			const i = this.ctx.database.getAllRowsData(), s = this.ctx.header.leafCellHeaders;
			let o = [];
			for (let r = 0; r < i.length; r++) for (let a = 0; a < s.length; a++) {
				const l = this.ctx.database.getRowKeyByItem(i[r]), f = s[a].key, d = await this.ctx.database.getValidator(l, f);
				Array.isArray(d) && d.length && o.push(d);
			}
			o.length ? (e(o), this.ctx.emit("draw")) : (t([]), this.ctx.emit("draw"));
		});
	}
	hasValidationError() {
		return this.ctx.database.hasValidationError();
	}
	scrollTo(t, e) {
		this.scroller.setScroll(t, e);
	}
	scrollXTo(t) {
		this.scroller.setScrollX(t);
	}
	scrollToColkey(t) {
		this.scroller.scrollToColkey(t);
	}
	scrollToRowkey(t) {
		this.scroller.scrollToRowKey(t);
	}
	scrollToColIndex(t) {
		this.scroller.scrollToColIndex(t);
	}
	scrollToRowIndex(t) {
		this.scroller.scrollToRowIndex(t);
	}
	scrollYTo(t) {
		this.scroller.setScrollY(t);
	}
	setExpandRowKeys(t, e = !0) {
		this.ctx.database.setExpandRowKeys(t, e);
	}
	getExpandRowKeys() {
		return this.ctx.database.getExpandRowKeys();
	}
	clearSelection() {
		this.ctx.database.clearSelection(), this.ctx.emit("draw");
	}
	toggleRowSelection(t) {
		const e = this.ctx.database.getRowKeyByItem(t);
		this.ctx.database.toggleRowSelection(e), this.ctx.emit("draw");
	}
	setSelectionByRows(t, e = !0) {
		t.forEach((i) => {
			const s = this.ctx.database.getRowKeyByItem(i);
			this.ctx.database.setRowSelection(s, e, !1);
		}), this.ctx.emit("selectionChange", this.getSelectionRows()), this.ctx.emit("draw");
	}
	setSelectionByRowKeys(t, e = !0) {
		t.forEach((i) => {
			this.ctx.database.setRowSelection(i, e, !1);
		}), this.ctx.emit("selectionChange", this.getSelectionRows()), this.ctx.emit("draw");
	}
	toggleAllSelection() {
		this.ctx.database.toggleAllSelection(), this.ctx.emit("draw");
	}
	toggleRowExpand(t, e) {
		this.ctx.database.expandItem(t, e), this.ctx.emit("draw");
	}
	toggleExpandAll(t) {
		this.ctx.database.expandAll(t), this.ctx.emit("draw");
	}
	getSelectionRows() {
		return this.ctx.database.getSelectionRows();
	}
	getPositionForRowIndex(t) {
		return this.ctx.database.getPositionForRowIndex(t);
	}
	getCellValue(t, e) {
		return this.ctx.database.getItemValue(t, e);
	}
	getCellValueByIndex(t, e) {
		return this.ctx.database.getItemValueForRowIndexAndColIndex(t, e);
	}
	clearSort() {
		this.ctx.database.clearSort();
	}
	contextMenuHide() {
		this.contextMenu.hide();
	}
	getUtils() {
		return {
			mergeColCell: Ne,
			mergeRowCell: He,
			getSpanArrByRow: ce,
			getSpanObjByColumn: he
		};
	}
	getColumnByKey(t) {
		var e;
		return (e = this.ctx.database.getColumnByKey(t)) == null ? void 0 : e.column;
	}
	clearChangeData() {
		this.ctx.database.clearChangeData(), this.ctx.emit("draw");
	}
	getReadonly(t, e) {
		return this.ctx.database.getReadonly(t, e);
	}
	useLocale(t) {
		this.ctx.locale.use(t);
	}
	/**
	* 销毁
	*/
	destroy() {
		this.overlayer.destroy(), this.empty.destroy(), this.editor.destroy(), this.tooltip.destroy(), this.selector.destroy(), this.autofill.destroy(), this.contextMenu.destroy(), this.loading.destroy(), this.finderBar.destroy(), this.textSelector.destroy(), this.ctx.destroy(), this.ctx.containerElement.remove();
	}
};
n(yt, "locale");
var Ht = yt;
//#endregion
export { Ht as default };
