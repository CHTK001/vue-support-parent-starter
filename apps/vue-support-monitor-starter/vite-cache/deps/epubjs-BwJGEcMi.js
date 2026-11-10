import { i as __require } from "./rolldown-runtime-CEgmsyvS.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-epub@3.1.2/node_modules/@file-viewer/renderer-epub/dist/vendor/epubjs.js
var Jl = Object.create;
var zn = Object.defineProperty;
var eh = Object.getOwnPropertyDescriptor;
var th = Object.getOwnPropertyNames;
var rh = Object.getPrototypeOf;
var ih = Object.prototype.hasOwnProperty;
var Xt = ((n) => typeof __require != "undefined" ? __require : typeof Proxy != "undefined" ? new Proxy(n, { get: (e, t) => (typeof __require != "undefined" ? __require : e)[t] }) : n)(function(n) {
	if (typeof __require != "undefined") return __require.apply(this, arguments);
	throw Error("Dynamic require of \"" + n + "\" is not supported");
});
var pe = (n, e) => () => {
	try {
		return e || n((e = { exports: {} }).exports, e), e.exports;
	} catch (t) {
		throw e = 0, t;
	}
};
var nh = (n, e) => {
	for (var t in e) zn(n, t, {
		get: e[t],
		enumerable: !0
	});
};
var sh = (n, e, t, r) => {
	if (e && typeof e == "object" || typeof e == "function") for (let i of th(e)) !ih.call(n, i) && i !== t && zn(n, i, {
		get: () => e[i],
		enumerable: !(r = eh(e, i)) || r.enumerable
	});
	return n;
};
var rt = (n, e, t) => (t = n != null ? Jl(rh(n)) : {}, sh(e || !n || !n.__esModule ? zn(t, "default", {
	value: n,
	enumerable: !0
}) : t, n));
var Un = pe((Xd, da) => {
	"use strict";
	var ah = void 0;
	da.exports = function(n) {
		return n !== ah && n !== null;
	};
});
var ma = pe((Kd, pa) => {
	"use strict";
	var oh = Un(), uh = {
		object: !0,
		function: !0,
		undefined: !0
	};
	pa.exports = function(n) {
		return oh(n) ? hasOwnProperty.call(uh, typeof n) : !1;
	};
});
var ga = pe(($d, va) => {
	"use strict";
	var lh = ma();
	va.exports = function(n) {
		if (!lh(n)) return !1;
		try {
			return n.constructor ? n.constructor.prototype === n : !1;
		} catch {
			return !1;
		}
	};
});
var ya = pe((Qd, Ea) => {
	"use strict";
	var hh = ga();
	Ea.exports = function(n) {
		if (typeof n != "function" || !hasOwnProperty.call(n, "length")) return !1;
		try {
			if (typeof n.length != "number" || typeof n.call != "function" || typeof n.apply != "function") return !1;
		} catch {
			return !1;
		}
		return !hh(n);
	};
});
var wa = pe((Jd, ba) => {
	"use strict";
	var fh = ya(), ch = /^\s*class[\s{/}]/, dh = Function.prototype.toString;
	ba.exports = function(n) {
		return !(!fh(n) || ch.test(dh.call(n)));
	};
});
var xa = pe((ep, _a) => {
	"use strict";
	_a.exports = function() {
		var n = Object.assign, e;
		return typeof n != "function" ? !1 : (e = { foo: "raz" }, n(e, { bar: "dwa" }, { trzy: "trzy" }), e.foo + e.bar + e.trzy === "razdwatrzy");
	};
});
var Aa = pe((tp, Da) => {
	"use strict";
	Da.exports = function() {
		try {
			return !0;
		} catch {
			return !1;
		}
	};
});
var Ta = pe((rp, Ca) => {
	"use strict";
	Ca.exports = function() {};
});
var Wi = pe((ip, Sa) => {
	"use strict";
	var ph = Ta()();
	Sa.exports = function(n) {
		return n !== ph && n !== null;
	};
});
var Ia = pe((np, Na) => {
	"use strict";
	var mh = Wi(), vh = Object.keys;
	Na.exports = function(n) {
		return vh(mh(n) ? Object(n) : n);
	};
});
var Ra = pe((sp, Oa) => {
	"use strict";
	Oa.exports = Aa()() ? Object.keys : Ia();
});
var La = pe((ap, ka) => {
	"use strict";
	var gh = Wi();
	ka.exports = function(n) {
		if (!gh(n)) throw new TypeError("Cannot use null or undefined");
		return n;
	};
});
var Pa = pe((op, Ba) => {
	"use strict";
	var Eh = Ra(), yh = La(), bh = Math.max;
	Ba.exports = function(n, e) {
		var t, r, i = bh(arguments.length, 2), s;
		for (n = Object(yh(n)), s = function(a) {
			try {
				n[a] = e[a];
			} catch (o) {
				t || (t = o);
			}
		}, r = 1; r < i; ++r) e = arguments[r], Eh(e).forEach(s);
		if (t !== void 0) throw t;
		return n;
	};
});
var Ma = pe((up, Fa) => {
	"use strict";
	Fa.exports = xa()() ? Object.assign : Pa();
});
var Ua = pe((lp, za) => {
	"use strict";
	var wh = Wi(), _h = Array.prototype.forEach, xh = Object.create, Dh = function(n, e) {
		var t;
		for (t in n) e[t] = n[t];
	};
	za.exports = function(n) {
		var e = xh(null);
		return _h.call(arguments, function(t) {
			wh(t) && Dh(Object(t), e);
		}), e;
	};
});
var Wa = pe((hp, qa) => {
	"use strict";
	var qn = "razdwatrzy";
	qa.exports = function() {
		return typeof qn.contains != "function" ? !1 : qn.contains("dwa") === !0 && qn.contains("foo") === !1;
	};
});
var Ha = pe((fp, ja) => {
	"use strict";
	var Ah = String.prototype.indexOf;
	ja.exports = function(n) {
		return Ah.call(this, n, arguments[1]) > -1;
	};
});
var Ga = pe((cp, Va) => {
	"use strict";
	Va.exports = Wa()() ? String.prototype.contains : Ha();
});
var $a = pe((dp, Ka) => {
	"use strict";
	var ji = Un(), Ya = wa(), Za = Ma(), Xa = Ua(), oi = Ga(), Ch = Ka.exports = function(n, e) {
		var t, r, i, s, a;
		return arguments.length < 2 || typeof n != "string" ? (s = e, e = n, n = null) : s = arguments[2], ji(n) ? (t = oi.call(n, "c"), r = oi.call(n, "e"), i = oi.call(n, "w")) : (t = i = !0, r = !1), a = {
			value: e,
			configurable: t,
			enumerable: r,
			writable: i
		}, s ? Za(Xa(s), a) : a;
	};
	Ch.gs = function(n, e, t) {
		var r, i, s, a;
		return typeof n != "string" ? (s = t, t = e, e = n, n = null) : s = arguments[3], ji(e) ? Ya(e) ? ji(t) ? Ya(t) || (s = t, t = void 0) : t = void 0 : (s = e, e = t = void 0) : e = void 0, ji(n) ? (r = oi.call(n, "c"), i = oi.call(n, "e")) : (r = !0, i = !1), a = {
			get: e,
			set: t,
			configurable: r,
			enumerable: i
		}, s ? Za(Xa(s), a) : a;
	};
});
var Ja = pe((pp, Qa) => {
	"use strict";
	Qa.exports = function(n) {
		if (typeof n != "function") throw new TypeError(n + " is not a function");
		return n;
	};
});
var Yt = pe((Kn, no) => {
	"use strict";
	var Hi = $a(), Vn = Ja(), Hn = Function.prototype.apply, Wn = Function.prototype.call, eo = Object.create, Th = Object.defineProperty, to = Object.defineProperties, Gn = Object.prototype.hasOwnProperty, jn = {
		configurable: !0,
		enumerable: !1,
		writable: !0
	}, Vi = function(n, e) {
		var t;
		return Vn(e), Gn.call(this, "__ee__") ? t = this.__ee__ : (t = jn.value = eo(null), Th(this, "__ee__", jn), jn.value = null), t[n] ? typeof t[n] == "object" ? t[n].push(e) : t[n] = [t[n], e] : t[n] = e, this;
	}, Yn = function(n, e) {
		var t, r;
		return Vn(e), r = this, Vi.call(this, n, t = function() {
			Gi.call(r, n, t), Hn.call(e, this, arguments);
		}), t.__eeOnceListener__ = e, this;
	}, Gi = function(n, e) {
		var t, r, i, s;
		if (Vn(e), !Gn.call(this, "__ee__")) return this;
		if (t = this.__ee__, !t[n]) return this;
		if (r = t[n], typeof r == "object") for (s = 0; i = r[s]; ++s) (i === e || i.__eeOnceListener__ === e) && (r.length === 2 ? t[n] = r[s ? 0 : 1] : r.splice(s, 1));
		else (r === e || r.__eeOnceListener__ === e) && delete t[n];
		return this;
	}, Zn = function(n) {
		var e, t, r, i, s;
		if (Gn.call(this, "__ee__") && (i = this.__ee__[n], !!i)) if (typeof i == "object") {
			for (t = arguments.length, s = new Array(t - 1), e = 1; e < t; ++e) s[e - 1] = arguments[e];
			for (i = i.slice(), e = 0; r = i[e]; ++e) Hn.call(r, this, s);
		} else switch (arguments.length) {
			case 1:
				Wn.call(i, this);
				break;
			case 2:
				Wn.call(i, this, arguments[1]);
				break;
			case 3:
				Wn.call(i, this, arguments[1], arguments[2]);
				break;
			default:
				for (t = arguments.length, s = new Array(t - 1), e = 1; e < t; ++e) s[e - 1] = arguments[e];
				Hn.call(i, this, s);
		}
	}, ro = {
		on: Vi,
		once: Yn,
		off: Gi,
		emit: Zn
	}, Xn = {
		on: Hi(Vi),
		once: Hi(Yn),
		off: Hi(Gi),
		emit: Hi(Zn)
	}, io = to({}, Xn);
	no.exports = Kn = function(n) {
		return n == null ? eo(io) : to(Object(n), Xn);
	};
	Kn.methods = ro;
});
var yr = pe((mt) => {
	"use strict";
	function Sh(n, e, t) {
		if (t === void 0 && (t = Array.prototype), n && typeof t.find == "function") return t.find.call(n, e);
		for (var r = 0; r < n.length; r++) if (Er(n, r)) {
			var i = n[r];
			if (e.call(void 0, i, r, n)) return i;
		}
	}
	function Ir(n, e) {
		return e === void 0 && (e = Object), e && typeof e.getOwnPropertyDescriptors == "function" && (n = e.create(null, e.getOwnPropertyDescriptors(n))), e && typeof e.freeze == "function" ? e.freeze(n) : n;
	}
	function Er(n, e) {
		return Object.prototype.hasOwnProperty.call(n, e);
	}
	function Nh(n, e) {
		if (n === null || typeof n != "object") throw new TypeError("target is not an object");
		for (var t in e) Er(e, t) && (n[t] = e[t]);
		return n;
	}
	var so = Ir({
		allowfullscreen: !0,
		async: !0,
		autofocus: !0,
		autoplay: !0,
		checked: !0,
		controls: !0,
		default: !0,
		defer: !0,
		disabled: !0,
		formnovalidate: !0,
		hidden: !0,
		ismap: !0,
		itemscope: !0,
		loop: !0,
		multiple: !0,
		muted: !0,
		nomodule: !0,
		novalidate: !0,
		open: !0,
		playsinline: !0,
		readonly: !0,
		required: !0,
		reversed: !0,
		selected: !0
	});
	function Ih(n) {
		return Er(so, n.toLowerCase());
	}
	var ao = Ir({
		area: !0,
		base: !0,
		br: !0,
		col: !0,
		embed: !0,
		hr: !0,
		img: !0,
		input: !0,
		link: !0,
		meta: !0,
		param: !0,
		source: !0,
		track: !0,
		wbr: !0
	});
	function Oh(n) {
		return Er(ao, n.toLowerCase());
	}
	var ui = Ir({
		script: !1,
		style: !1,
		textarea: !0,
		title: !0
	});
	function Rh(n) {
		var e = n.toLowerCase();
		return Er(ui, e) && !ui[e];
	}
	function kh(n) {
		var e = n.toLowerCase();
		return Er(ui, e) && ui[e];
	}
	function oo(n) {
		return n === li.HTML;
	}
	function Lh(n) {
		return oo(n) || n === li.XML_XHTML_APPLICATION;
	}
	var li = Ir({
		HTML: "text/html",
		XML_APPLICATION: "application/xml",
		XML_TEXT: "text/xml",
		XML_XHTML_APPLICATION: "application/xhtml+xml",
		XML_SVG_IMAGE: "image/svg+xml"
	}), Bh = Object.keys(li).map(function(n) {
		return li[n];
	});
	function Ph(n) {
		return Bh.indexOf(n) > -1;
	}
	var Fh = Ir({
		HTML: "http://www.w3.org/1999/xhtml",
		SVG: "http://www.w3.org/2000/svg",
		XML: "http://www.w3.org/XML/1998/namespace",
		XMLNS: "http://www.w3.org/2000/xmlns/"
	});
	mt.assign = Nh;
	mt.find = Sh;
	mt.freeze = Ir;
	mt.HTML_BOOLEAN_ATTRIBUTES = so;
	mt.HTML_RAW_TEXT_ELEMENTS = ui;
	mt.HTML_VOID_ELEMENTS = ao;
	mt.hasDefaultHTMLNamespace = Lh;
	mt.hasOwn = Er;
	mt.isHTMLBooleanAttribute = Ih;
	mt.isHTMLRawTextElement = Rh;
	mt.isHTMLEscapableRawTextElement = kh;
	mt.isHTMLMimeType = oo;
	mt.isHTMLVoidElement = Oh;
	mt.isValidMimeType = Ph;
	mt.MIME_TYPE = li;
	mt.NAMESPACE = Fh;
});
var pi = pe((di) => {
	"use strict";
	var Mh = yr();
	function lo(n, e) {
		n.prototype = Object.create(Error.prototype, {
			constructor: { value: n },
			name: {
				value: n.name,
				enumerable: !0,
				writable: e
			}
		});
	}
	var fi = Mh.freeze({
		Error: "Error",
		IndexSizeError: "IndexSizeError",
		DomstringSizeError: "DomstringSizeError",
		HierarchyRequestError: "HierarchyRequestError",
		WrongDocumentError: "WrongDocumentError",
		InvalidCharacterError: "InvalidCharacterError",
		NoDataAllowedError: "NoDataAllowedError",
		NoModificationAllowedError: "NoModificationAllowedError",
		NotFoundError: "NotFoundError",
		NotSupportedError: "NotSupportedError",
		InUseAttributeError: "InUseAttributeError",
		InvalidStateError: "InvalidStateError",
		SyntaxError: "SyntaxError",
		InvalidModificationError: "InvalidModificationError",
		NamespaceError: "NamespaceError",
		InvalidAccessError: "InvalidAccessError",
		ValidationError: "ValidationError",
		TypeMismatchError: "TypeMismatchError",
		SecurityError: "SecurityError",
		NetworkError: "NetworkError",
		AbortError: "AbortError",
		URLMismatchError: "URLMismatchError",
		QuotaExceededError: "QuotaExceededError",
		TimeoutError: "TimeoutError",
		InvalidNodeTypeError: "InvalidNodeTypeError",
		DataCloneError: "DataCloneError",
		EncodingError: "EncodingError",
		NotReadableError: "NotReadableError",
		UnknownError: "UnknownError",
		ConstraintError: "ConstraintError",
		DataError: "DataError",
		TransactionInactiveError: "TransactionInactiveError",
		ReadOnlyError: "ReadOnlyError",
		VersionError: "VersionError",
		OperationError: "OperationError",
		NotAllowedError: "NotAllowedError",
		OptOutError: "OptOutError"
	}), ho = Object.keys(fi);
	function fo(n) {
		return typeof n == "number" && n >= 1 && n <= 25;
	}
	function zh(n) {
		return typeof n == "string" && n.substring(n.length - fi.Error.length) === fi.Error;
	}
	function ci(n, e) {
		fo(n) ? (this.name = ho[n], this.message = e || "") : (this.message = n, this.name = zh(e) ? e : fi.Error), Error.captureStackTrace && Error.captureStackTrace(this, ci);
	}
	lo(ci, !0);
	Object.defineProperties(ci.prototype, { code: {
		enumerable: !0,
		get: function() {
			var n = ho.indexOf(this.name);
			return fo(n) ? n : 0;
		}
	} });
	var co = {
		INDEX_SIZE_ERR: 1,
		DOMSTRING_SIZE_ERR: 2,
		HIERARCHY_REQUEST_ERR: 3,
		WRONG_DOCUMENT_ERR: 4,
		INVALID_CHARACTER_ERR: 5,
		NO_DATA_ALLOWED_ERR: 6,
		NO_MODIFICATION_ALLOWED_ERR: 7,
		NOT_FOUND_ERR: 8,
		NOT_SUPPORTED_ERR: 9,
		INUSE_ATTRIBUTE_ERR: 10,
		INVALID_STATE_ERR: 11,
		SYNTAX_ERR: 12,
		INVALID_MODIFICATION_ERR: 13,
		NAMESPACE_ERR: 14,
		INVALID_ACCESS_ERR: 15,
		VALIDATION_ERR: 16,
		TYPE_MISMATCH_ERR: 17,
		SECURITY_ERR: 18,
		NETWORK_ERR: 19,
		ABORT_ERR: 20,
		URL_MISMATCH_ERR: 21,
		QUOTA_EXCEEDED_ERR: 22,
		TIMEOUT_ERR: 23,
		INVALID_NODE_TYPE_ERR: 24,
		DATA_CLONE_ERR: 25
	}, $n = Object.entries(co);
	for (hi = 0; hi < $n.length; hi++) uo = $n[hi][0], ci[uo] = $n[hi][1];
	var uo, hi;
	function Qn(n, e, t) {
		this.message = n, this.locator = e, this.cause = t, Error.captureStackTrace && Error.captureStackTrace(this, Qn);
	}
	lo(Qn);
	di.DOMException = ci;
	di.DOMExceptionName = fi;
	di.ExceptionCode = co;
	di.ParseError = Qn;
});
var ss = pe((Ee) => {
	"use strict";
	function yo(n) {
		try {
			typeof n != "function" && (n = RegExp);
			var e = new n("𝌆", "u").exec("𝌆");
			return !!e && e[0].length === 2;
		} catch {}
		return !1;
	}
	var kr = yo();
	function hr(n) {
		if (n.source[0] !== "[") throw new Error(n + " can not be used with chars");
		return n.source.slice(1, n.source.lastIndexOf("]"));
	}
	function Or(n, e) {
		if (n.source[0] !== "[") throw new Error("/" + n.source + "/ can not be used with chars_without");
		if (!e || typeof e != "string") throw new Error(JSON.stringify(e) + " is not a valid search");
		if (n.source.indexOf(e) === -1) throw new Error("\"" + e + "\" is not is /" + n.source + "/");
		if (e === "-" && n.source.indexOf(e) !== 1) throw new Error("\"" + e + "\" is not at the first postion of /" + n.source + "/");
		return new RegExp(n.source.replace(e, ""), kr ? "u" : "");
	}
	function we(n) {
		var e = this;
		return new RegExp(Array.prototype.slice.call(arguments).map(function(t) {
			var r = typeof t == "string";
			if (r && e === void 0 && t === "|") throw new Error("use regg instead of reg to wrap expressions with `|`!");
			return r ? t : t.source;
		}).join(""), kr ? "u" : "");
	}
	function ve(n) {
		if (arguments.length === 0) throw new Error("no parameters provided");
		return we.apply(ve, ["(?:"].concat(Array.prototype.slice.call(arguments), [")"]));
	}
	var Uh = "�", fr = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;
	kr && (fr = we("[", hr(fr), "\\u{10000}-\\u{10FFFF}", "]"));
	var qh = new RegExp("[^" + hr(fr) + "]", kr ? "u" : ""), Yi = /[\x20\x09\x0D\x0A]/, Wh = hr(Yi), Ue = we(Yi, "+"), Ye = we(Yi, "*"), mi = /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
	kr && (mi = we("[", hr(mi), "\\u{10000}-\\u{10FFFF}", "]"));
	var ts = we("[", hr(mi), hr(/[-.0-9\xB7]/), hr(/[\u0300-\u036F\u203F-\u2040]/), "]"), kt = we(mi, ts, "*"), Hh = we("^", kt, "$"), po = we(ts, "+"), vi = ve(we("&", kt, ";"), "|", ve(/&#[0-9]+;|&#x[0-9a-fA-F]+;/)), gi = we("%", kt, ";"), rs = ve(we("\"", ve(/[^%&"]/, "|", gi, "|", vi), "*", "\""), "|", we("'", ve(/[^%&']/, "|", gi, "|", vi), "*", "'")), Yh = ve("\"", ve(/[^<&"]/, "|", vi), "*", "\"", "|", "'", ve(/[^<&']/, "|", vi), "*", "'"), Jn = we(Or(mi, ":"), Or(ts, ":"), "*"), Kh = we("^", Jn, "$"), Ei = we(Jn, ve(":", Jn), "?"), $h = we("^", Ei, "$"), Qh = we("(", Ei, ")"), Rr = ve(/"[^"]*"|'[^']*'/), Jh = we(/^<\?/, "(", kt, ")", ve(Ue, "(?!", Yi, ")(", fr, "*?)"), "?", /\?>/), mo = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/, yi = ve("\"", mo, "*\"", "|", "'", Or(mo, "'"), "*'"), bo = "<!--", wo = "-->", ef = we(bo, ve(Or(fr, "-"), "|", we("-", Or(fr, "-"))), "*", wo), vo = "#PCDATA", sf = ve("EMPTY", "|", "ANY", "|", ve(we(/\(/, Ye, vo, ve(Ye, /\|/, Ye, Ei), "*", Ye, /\)\*/), "|", we(/\(/, Ye, vo, Ye, /\)/)), "|", we(/\([^>]+\)/, /[?*+]?/)), of = we("<!ELEMENT", Ue, ve(Ei, "|", gi), Ue, ve(sf, "|", gi), Ye, ">"), mf = we("<!ATTLIST", Ue, kt, ve(Ue, kt, Ue, ve(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/, "|", ve(we("NOTATION", Ue, /\(/, Ye, kt, ve(Ye, /\|/, Ye, kt), "*", Ye, /\)/), "|", we(/\(/, Ye, po, ve(Ye, /\|/, Ye, po), "*", Ye, /\)/))), Ue, ve(/#REQUIRED|#IMPLIED/, "|", ve(ve("#FIXED", Ue), "?", Yh))), "*", Ye, ">"), es = "about:legacy-compat", vf = ve("\"" + es + "\"", "|", "'" + es + "'"), is = "SYSTEM", Zi = "PUBLIC", Xi = ve(ve(is, Ue, Rr), "|", ve(Zi, Ue, yi, Ue, Rr)), gf = we("^", ve(ve(is, Ue, "(?<SystemLiteralOnly>", Rr, ")"), "|", ve(Zi, Ue, "(?<PubidLiteral>", yi, ")", Ue, "(?<SystemLiteral>", Rr, ")"))), Ef = we("^", yi, "$"), yf = we("^", Rr, "$"), wf = ve(rs, "|", ve(Xi, ve(Ue, "NDATA", Ue, kt), "?")), _o = "<!ENTITY", Af = ve(we(_o, Ue, kt, Ue, wf, Ye, ">"), "|", we(_o, Ue, "%", Ue, kt, Ue, ve(rs, "|", Xi), Ye, ">")), Tf = we("<!NOTATION", Ue, kt, Ue, ve(Xi, "|", we(Zi, Ue, yi)), Ye, ">"), ns = we(Ye, "=", Ye), go = /1[.]\d+/, Sf = we(Ue, "version", ns, ve("'", go, "'", "|", "\"", go, "\"")), Eo = /[A-Za-z][-A-Za-z0-9._]*/, Of = we(/^<\?xml/, Sf, ve(Ue, "encoding", ns, ve("\"", Eo, "\"", "|", "'", Eo, "'")), "?", ve(Ue, "standalone", ns, ve("'", ve("yes", "|", "no"), "'", "|", "\"", ve("yes", "|", "no"), "\"")), "?", Ye, /\?>/), Rf = "<!DOCTYPE", kf = "<![CDATA[", Lf = "]]>", Mf = we(/<!\[CDATA\[/, we(fr, "*?", /\]\]>/));
	Ee.chars = hr;
	Ee.chars_without = Or;
	Ee.detectUnicodeSupport = yo;
	Ee.reg = we;
	Ee.regg = ve;
	Ee.ABOUT_LEGACY_COMPAT = es;
	Ee.ABOUT_LEGACY_COMPAT_SystemLiteral = vf;
	Ee.AttlistDecl = mf;
	Ee.CDATA_START = kf;
	Ee.CDATA_END = Lf;
	Ee.CDSect = Mf;
	Ee.Char = fr;
	Ee.Comment = ef;
	Ee.COMMENT_START = bo;
	Ee.COMMENT_END = wo;
	Ee.DOCTYPE_DECL_START = Rf;
	Ee.elementdecl = of;
	Ee.EntityDecl = Af;
	Ee.EntityValue = rs;
	Ee.ExternalID = Xi;
	Ee.ExternalID_match = gf;
	Ee.Name = kt;
	Ee.Name_exact = Hh;
	Ee.NCName_exact = Kh;
	Ee.NotationDecl = Tf;
	Ee.Reference = vi;
	Ee.PEReference = gi;
	Ee.PI = Jh;
	Ee.PUBLIC = Zi;
	Ee.PubidLiteral = yi;
	Ee.PubidLiteral_match = Ef;
	Ee.QName = Ei;
	Ee.QName_exact = $h;
	Ee.QName_group = Qh;
	Ee.S = Ue;
	Ee.SChar_s = Wh;
	Ee.S_OPT = Ye;
	Ee.SYSTEM = is;
	Ee.SystemLiteral = Rr;
	Ee.SystemLiteral_match = yf;
	Ee.InvalidChar = qh;
	Ee.UNICODE_REPLACEMENT_CHARACTER = Uh;
	Ee.UNICODE_SUPPORT = kr;
	Ee.XMLDecl = Of;
});
var ms = pe((Qe) => {
	"use strict";
	var zt = yr(), $t = zt.find, zf = zt.hasDefaultHTMLNamespace, Br = zt.hasOwn, Uf = zt.isHTMLMimeType, qf = zt.isHTMLRawTextElement, Wf = zt.isHTMLVoidElement, bi = zt.MIME_TYPE, Qt = zt.NAMESPACE, _t = Symbol(), No = pi(), se = No.DOMException, yt = No.DOMExceptionName, $e = ss();
	function Nt(n) {
		if (n !== _t) throw new TypeError("Illegal constructor");
	}
	function jf(n) {
		return n !== "";
	}
	function Hf(n) {
		return n ? n.split(/[\t\n\f\r ]+/).filter(jf) : [];
	}
	function Vf(n, e) {
		return Br(n, e) || (n[e] = !0), n;
	}
	function xo(n) {
		if (!n) return [];
		var e = Hf(n);
		return Object.keys(e.reduce(Vf, {}));
	}
	function Gf(n) {
		return function(e) {
			return n && n.indexOf(e) !== -1;
		};
	}
	function Io(n) {
		if (!$e.QName_exact.test(n)) throw new se(se.INVALID_CHARACTER_ERR, "invalid character in qualified name \"" + n + "\"");
	}
	function os(n, e) {
		Io(e), n = n || null;
		var t = null, r = e;
		if (e.indexOf(":") >= 0) {
			var i = e.split(":");
			t = i[0], r = i[1];
		}
		if (t !== null && n === null) throw new se(se.NAMESPACE_ERR, "prefix is non-null and namespace is null");
		if (t === "xml" && n !== zt.NAMESPACE.XML) throw new se(se.NAMESPACE_ERR, "prefix is \"xml\" and namespace is not the XML namespace");
		if ((t === "xmlns" || e === "xmlns") && n !== zt.NAMESPACE.XMLNS) throw new se(se.NAMESPACE_ERR, "either qualifiedName or prefix is \"xmlns\" and namespace is not the XMLNS namespace");
		if (n === zt.NAMESPACE.XMLNS && t !== "xmlns" && e !== "xmlns") throw new se(se.NAMESPACE_ERR, "namespace is the XMLNS namespace and neither qualifiedName nor prefix is \"xmlns\"");
		return [
			n,
			t,
			r
		];
	}
	function Mr(n, e) {
		for (var t in n) Br(n, t) && (e[t] = n[t]);
	}
	function It(n, e) {
		var t = n.prototype;
		if (!(t instanceof e)) {
			let r = function() {};
			r.prototype = e.prototype, r = new r(), Mr(t, r), n.prototype = t = r;
		}
		t.constructor != n && (typeof n != "function" && console.error("unknown Class:" + n), t.constructor = n);
	}
	var Ot = {}, Mt = Ot.ELEMENT_NODE = 1, Pr = Ot.ATTRIBUTE_NODE = 2, wi = Ot.TEXT_NODE = 3, Oo = Ot.CDATA_SECTION_NODE = 4, Ro = Ot.ENTITY_REFERENCE_NODE = 5, Yf = Ot.ENTITY_NODE = 6, us = Ot.PROCESSING_INSTRUCTION_NODE = 7, ls = Ot.COMMENT_NODE = 8, Lr = Ot.DOCUMENT_NODE = 9, ko = Ot.DOCUMENT_TYPE_NODE = 10, cr = Ot.DOCUMENT_FRAGMENT_NODE = 11, Zf = Ot.NOTATION_NODE = 12, Ke = zt.freeze({
		DOCUMENT_POSITION_DISCONNECTED: 1,
		DOCUMENT_POSITION_PRECEDING: 2,
		DOCUMENT_POSITION_FOLLOWING: 4,
		DOCUMENT_POSITION_CONTAINS: 8,
		DOCUMENT_POSITION_CONTAINED_BY: 16,
		DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
	});
	function Lo(n, e) {
		if (e.length < n.length) return Lo(e, n);
		var t = null;
		for (var r in n) {
			if (n[r] !== e[r]) return t;
			t = n[r];
		}
		return t;
	}
	function Do(n) {
		return n.guid || (n.guid = Math.random()), n.guid;
	}
	function lt() {}
	lt.prototype = {
		length: 0,
		item: function(n) {
			return n >= 0 && n < this.length ? this[n] : null;
		},
		toString: function(n) {
			var e;
			typeof n == "function" ? e = {
				requireWellFormed: !1,
				splitCDATASections: !0,
				nodeFilter: n
			} : n ? e = {
				requireWellFormed: !!n.requireWellFormed,
				splitCDATASections: n.splitCDATASections !== !1,
				nodeFilter: n.nodeFilter || null
			} : e = {
				requireWellFormed: !1,
				splitCDATASections: !0,
				nodeFilter: null
			};
			for (var t = [], r = 0; r < this.length; r++) ps(this[r], t, null, e);
			return t.join("");
		},
		filter: function(n) {
			return Array.prototype.filter.call(this, n);
		},
		indexOf: function(n) {
			return Array.prototype.indexOf.call(this, n);
		}
	};
	lt.prototype[Symbol.iterator] = function() {
		var n = this, e = 0;
		return {
			next: function() {
				return e < n.length ? {
					value: n[e++],
					done: !1
				} : { done: !0 };
			},
			return: function() {
				return { done: !0 };
			}
		};
	};
	function Kt(n, e) {
		this._node = n, this._refresh = e, Ji(this);
	}
	function Ji(n) {
		var e = n._node._inc || n._node.ownerDocument._inc;
		if (n._inc !== e) {
			var t = n._refresh(n._node);
			if (Vo(n, "length", t.length), !n.$$length || t.length < n.$$length) for (var r = t.length; r in n; r++) Br(n, r) && delete n[r];
			Mr(t, n), n._inc = e;
		}
	}
	Kt.prototype.item = function(n) {
		return Ji(this), this[n] || null;
	};
	It(Kt, lt);
	function Fr() {
		this._nsIndex = Object.create(null), this._noNsIndex = Object.create(null);
	}
	function Bo(n, e) {
		for (var t = 0; t < n.length;) {
			if (n[t] === e) return t;
			t++;
		}
	}
	function hs(n, e, t) {
		if (!e) return n._noNsIndex;
		var r = n._nsIndex[e];
		return !r && t && (r = n._nsIndex[e] = Object.create(null)), r;
	}
	function Xf(n, e, t) {
		var r = hs(n, e, !1);
		return r && r[t] || null;
	}
	function Kf(n, e) {
		hs(n, e.namespaceURI, !0)[e.localName] = e;
	}
	function $f(n, e) {
		var t = hs(n, e.namespaceURI, !1);
		t && delete t[e.localName];
	}
	function Qf(n, e, t, r) {
		if (r ? e[Bo(e, r)] = t : (e[e.length] = t, e.length++), Kf(e, t), n) {
			t.ownerElement = n;
			var i = n.ownerDocument;
			i && (r && Mo(i, n, r), Jf(i, n, t));
		}
	}
	function Ao(n, e, t) {
		var r = Bo(e, t);
		if (r >= 0) {
			for (var i = e.length - 1; r <= i;) e[r] = e[++r];
			if (e.length = i, $f(e, t), n) {
				var s = n.ownerDocument;
				s && Mo(s, n, t), t.ownerElement = null;
			}
		}
	}
	Fr.prototype = {
		length: 0,
		item: lt.prototype.item,
		getNamedItem: function(n) {
			this._ownerElement && this._ownerElement._isInHTMLDocumentAndNamespace() && (n = n.toLowerCase());
			for (var e = 0; e < this.length;) {
				var t = this[e];
				if (t.nodeName === n) return t;
				e++;
			}
			return null;
		},
		setNamedItem: function(n) {
			var e = n.ownerElement;
			if (e && e !== this._ownerElement) throw new se(se.INUSE_ATTRIBUTE_ERR);
			var t = Xf(this, n.namespaceURI, n.localName);
			return t === n ? n : (Qf(this._ownerElement, this, n, t), t);
		},
		setNamedItemNS: function(n) {
			return this.setNamedItem(n);
		},
		removeNamedItem: function(n) {
			var e = this.getNamedItem(n);
			if (!e) throw new se(se.NOT_FOUND_ERR, n);
			return Ao(this._ownerElement, this, e), e;
		},
		removeNamedItemNS: function(n, e) {
			var t = this.getNamedItemNS(n, e);
			if (!t) throw new se(se.NOT_FOUND_ERR, n ? n + " : " + e : e);
			return Ao(this._ownerElement, this, t), t;
		},
		getNamedItemNS: function(n, e) {
			n || (n = null);
			for (var t = 0; t < this.length;) {
				var r = this[t];
				if (r.localName === e && r.namespaceURI === n) return r;
				t++;
			}
			return null;
		}
	};
	Fr.prototype[Symbol.iterator] = function() {
		var n = this, e = 0;
		return {
			next: function() {
				return e < n.length ? {
					value: n[e++],
					done: !1
				} : { done: !0 };
			},
			return: function() {
				return { done: !0 };
			}
		};
	};
	function Po() {}
	Po.prototype = {
		hasFeature: function(n, e) {
			return !0;
		},
		createDocument: function(n, e, t) {
			var r = bi.XML_APPLICATION;
			n === Qt.HTML ? r = bi.XML_XHTML_APPLICATION : n === Qt.SVG && (r = bi.XML_SVG_IMAGE);
			var i = new sr(_t, { contentType: r });
			if (i.implementation = this, i.childNodes = new lt(), i.doctype = t || null, t && i.appendChild(t), e) {
				var s = i.createElementNS(n, e);
				i.appendChild(s);
			}
			return i;
		},
		createDocumentType: function(n, e, t, r) {
			Io(n);
			var i = new rn(_t);
			return i.name = n, i.nodeName = n, i.publicId = e || "", i.systemId = t || "", i.internalSubset = r || "", i.childNodes = new lt(), i;
		},
		createHTMLDocument: function(n) {
			var e = new sr(_t, { contentType: bi.HTML });
			if (e.implementation = this, e.childNodes = new lt(), n !== !1) {
				e.doctype = this.createDocumentType("html"), e.doctype.ownerDocument = e, e.appendChild(e.doctype);
				var t = e.createElement("html");
				e.appendChild(t);
				var r = e.createElement("head");
				if (t.appendChild(r), typeof n == "string") {
					var i = e.createElement("title");
					i.appendChild(e.createTextNode(n)), r.appendChild(i);
				}
				t.appendChild(e.createElement("body"));
			}
			return e;
		}
	};
	function Oe(n) {
		Nt(n);
	}
	Oe.prototype = {
		firstChild: null,
		lastChild: null,
		previousSibling: null,
		nextSibling: null,
		parentNode: null,
		get parentElement() {
			return this.parentNode && this.parentNode.nodeType === this.ELEMENT_NODE ? this.parentNode : null;
		},
		childNodes: null,
		ownerDocument: null,
		nodeValue: null,
		namespaceURI: null,
		prefix: null,
		localName: null,
		baseURI: "about:blank",
		get isConnected() {
			var n = this.getRootNode();
			return n && n.nodeType === n.DOCUMENT_NODE;
		},
		contains: function(n) {
			if (!n) return !1;
			var e = n;
			do {
				if (this === e) return !0;
				e = e.parentNode;
			} while (e);
			return !1;
		},
		getRootNode: function(n) {
			var e = this;
			do {
				if (!e.parentNode) return e;
				e = e.parentNode;
			} while (e);
		},
		isEqualNode: function(n) {
			if (!n) return !1;
			for (var e = [{
				node: this,
				other: n
			}]; e.length > 0;) {
				var t = e.pop(), r = t.node, i = t.other;
				if (r.nodeType !== i.nodeType) return !1;
				switch (r.nodeType) {
					case r.DOCUMENT_TYPE_NODE:
						if (r.name !== i.name || r.publicId !== i.publicId || r.systemId !== i.systemId) return !1;
						break;
					case r.ELEMENT_NODE:
						if (r.namespaceURI !== i.namespaceURI || r.prefix !== i.prefix || r.localName !== i.localName || r.attributes.length !== i.attributes.length) return !1;
						for (var s = 0; s < r.attributes.length; s++) {
							var a = r.attributes.item(s), o = i.getAttributeNodeNS(a.namespaceURI, a.localName);
							if (!o) return !1;
							e.push({
								node: a,
								other: o
							});
						}
						break;
					case r.ATTRIBUTE_NODE:
						if (r.namespaceURI !== i.namespaceURI || r.localName !== i.localName || r.value !== i.value) return !1;
						break;
					case r.PROCESSING_INSTRUCTION_NODE:
						if (r.target !== i.target || r.data !== i.data) return !1;
						break;
					case r.TEXT_NODE:
					case r.CDATA_SECTION_NODE:
					case r.COMMENT_NODE: if (r.data !== i.data) return !1;
				}
				if (r.childNodes.length !== i.childNodes.length) return !1;
				for (var s = r.childNodes.length - 1; s >= 0; s--) e.push({
					node: r.childNodes[s],
					other: i.childNodes[s]
				});
			}
			return !0;
		},
		isSameNode: function(n) {
			return this === n;
		},
		insertBefore: function(n, e) {
			return Qi(this, n, e);
		},
		replaceChild: function(n, e) {
			Qi(this, n, e, qo), e && this.removeChild(e);
		},
		removeChild: function(n) {
			return zo(this, n);
		},
		appendChild: function(n) {
			return this.insertBefore(n, null);
		},
		hasChildNodes: function() {
			return this.firstChild != null;
		},
		cloneNode: function(n) {
			return Ho(this.ownerDocument || this, this, n);
		},
		normalize: function() {
			vt(this, null, { enter: function(n) {
				for (var e = n.firstChild; e;) {
					var t = e.nextSibling;
					if (t !== null && t.nodeType === wi && e.nodeType === wi) {
						for (var r = [], i = t; i !== null && i.nodeType === wi;) r.push(i.data), i = i.nextSibling;
						for (var s = e.nextSibling; s !== i;) {
							var a = s.nextSibling;
							s.parentNode = null, s.previousSibling = null, s.nextSibling = null, s = a;
						}
						e.nextSibling = i, i !== null ? i.previousSibling = e : n.lastChild = e, e.appendData(r.join("")), fs(n.ownerDocument, n), e = i;
					} else e = t;
				}
				return !0;
			} });
		},
		isSupported: function(n, e) {
			return this.ownerDocument.implementation.hasFeature(n, e);
		},
		lookupPrefix: function(n) {
			for (var e = this; e;) {
				var t = e._nsMap;
				if (t) {
					for (var r in t) if (Br(t, r) && t[r] === n) return r;
				}
				e = e.nodeType == Pr ? e.ownerDocument : e.parentNode;
			}
			return null;
		},
		lookupNamespaceURI: function(n) {
			for (var e = this; e;) {
				var t = e._nsMap;
				if (t && Br(t, n)) return t[n];
				e = e.nodeType == Pr ? e.ownerDocument : e.parentNode;
			}
			return null;
		},
		isDefaultNamespace: function(n) {
			return this.lookupPrefix(n) == null;
		},
		compareDocumentPosition: function(n) {
			if (this === n) return 0;
			var e = n, t = this, r = null, i = null;
			if (e instanceof br && (r = e, e = r.ownerElement), t instanceof br && (i = t, t = i.ownerElement, r && e && t === e)) for (var s = 0, a; a = t.attributes[s]; s++) {
				if (a === r) return Ke.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + Ke.DOCUMENT_POSITION_PRECEDING;
				if (a === i) return Ke.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + Ke.DOCUMENT_POSITION_FOLLOWING;
			}
			if (!e || !t || t.ownerDocument !== e.ownerDocument) return Ke.DOCUMENT_POSITION_DISCONNECTED + Ke.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + (Do(t.ownerDocument) > Do(e.ownerDocument) ? Ke.DOCUMENT_POSITION_FOLLOWING : Ke.DOCUMENT_POSITION_PRECEDING);
			if (i && e === t) return Ke.DOCUMENT_POSITION_CONTAINS + Ke.DOCUMENT_POSITION_PRECEDING;
			if (r && e === t) return Ke.DOCUMENT_POSITION_CONTAINED_BY + Ke.DOCUMENT_POSITION_FOLLOWING;
			for (var o = [], l = e.parentNode; l;) {
				if (!i && l === t) return Ke.DOCUMENT_POSITION_CONTAINED_BY + Ke.DOCUMENT_POSITION_FOLLOWING;
				o.push(l), l = l.parentNode;
			}
			o.reverse();
			for (var u = [], f = t.parentNode; f;) {
				if (!r && f === e) return Ke.DOCUMENT_POSITION_CONTAINS + Ke.DOCUMENT_POSITION_PRECEDING;
				u.push(f), f = f.parentNode;
			}
			u.reverse();
			var c = Lo(o, u);
			for (var p in c.childNodes) {
				var y = c.childNodes[p];
				if (y === t) return Ke.DOCUMENT_POSITION_FOLLOWING;
				if (y === e) return Ke.DOCUMENT_POSITION_PRECEDING;
				if (u.indexOf(y) >= 0) return Ke.DOCUMENT_POSITION_FOLLOWING;
				if (o.indexOf(y) >= 0) return Ke.DOCUMENT_POSITION_PRECEDING;
			}
			return 0;
		}
	};
	function Fo(n) {
		return n == "<" && "&lt;" || n == ">" && "&gt;" || n == "&" && "&amp;" || n == "\"" && "&quot;" || "&#" + n.charCodeAt() + ";";
	}
	Mr(Ot, Oe);
	Mr(Ot, Oe.prototype);
	Mr(Ke, Oe);
	Mr(Ke, Oe.prototype);
	function $i(n, e) {
		vt(n, null, { enter: function(t) {
			return e(t) ? vt.STOP : !0;
		} });
	}
	function vt(n, e, t) {
		for (var r = [{
			node: n,
			context: e,
			phase: vt.ENTER
		}]; r.length > 0;) {
			var i = r.pop();
			if (i.phase === vt.ENTER) {
				var s = t.enter(i.node, i.context);
				if (s === vt.STOP) return vt.STOP;
				if (r.push({
					node: i.node,
					context: s,
					phase: vt.EXIT
				}), s == null) continue;
				for (var a = i.node.lastChild; a;) r.push({
					node: a,
					context: s,
					phase: vt.ENTER
				}), a = a.previousSibling;
			} else t.exit && t.exit(i.node, i.context);
		}
	}
	vt.STOP = Symbol("walkDOM.STOP");
	vt.ENTER = 0;
	vt.EXIT = 1;
	function sr(n, e) {
		Nt(n);
		var t = e || {};
		this.ownerDocument = this, this.contentType = t.contentType || bi.XML_APPLICATION, this.type = Uf(this.contentType) ? "html" : "xml";
	}
	function Jf(n, e, t) {
		n && n._inc++;
		t.namespaceURI === Qt.XMLNS && (e._nsMap[t.prefix ? t.localName : ""] = t.value);
	}
	function Mo(n, e, t, r) {
		n && n._inc++;
		t.namespaceURI === Qt.XMLNS && delete e._nsMap[t.prefix ? t.localName : ""];
	}
	function fs(n, e, t) {
		if (n && n._inc) {
			n._inc++;
			var r = e.childNodes;
			if (t && !t.nextSibling) r[r.length++] = t;
			else {
				for (var i = e.firstChild, s = 0; i;) r[s++] = i, i = i.nextSibling;
				r.length = s, delete r[r.length];
			}
		}
	}
	function zo(n, e) {
		if (n !== e.parentNode) throw new se(se.NOT_FOUND_ERR, "child's parent is not parent");
		var t = e.previousSibling, r = e.nextSibling;
		return t ? t.nextSibling = r : n.firstChild = r, r ? r.previousSibling = t : n.lastChild = t, fs(n.ownerDocument, n), e.parentNode = null, e.previousSibling = null, e.nextSibling = null, e;
	}
	function ec(n) {
		return n && (n.nodeType === Oe.DOCUMENT_NODE || n.nodeType === Oe.DOCUMENT_FRAGMENT_NODE || n.nodeType === Oe.ELEMENT_NODE);
	}
	function tc(n) {
		return n && (n.nodeType === Oe.CDATA_SECTION_NODE || n.nodeType === Oe.COMMENT_NODE || n.nodeType === Oe.DOCUMENT_FRAGMENT_NODE || n.nodeType === Oe.DOCUMENT_TYPE_NODE || n.nodeType === Oe.ELEMENT_NODE || n.nodeType === Oe.PROCESSING_INSTRUCTION_NODE || n.nodeType === Oe.TEXT_NODE);
	}
	function dr(n) {
		return n && n.nodeType === Oe.DOCUMENT_TYPE_NODE;
	}
	function nr(n) {
		return n && n.nodeType === Oe.ELEMENT_NODE;
	}
	function Uo(n) {
		return n && n.nodeType === Oe.TEXT_NODE;
	}
	function Co(n, e) {
		var t = n.childNodes || [];
		if ($t(t, nr) || dr(e)) return !1;
		var r = $t(t, dr);
		return !(e && r && t.indexOf(r) > t.indexOf(e));
	}
	function To(n, e) {
		var t = n.childNodes || [];
		function r(s) {
			return nr(s) && s !== e;
		}
		if ($t(t, r)) return !1;
		var i = $t(t, dr);
		return !(e && i && t.indexOf(i) > t.indexOf(e));
	}
	function rc(n, e, t) {
		if (!ec(n)) throw new se(se.HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + n.nodeType);
		if (t && t.parentNode !== n) throw new se(se.NOT_FOUND_ERR, "child not in parent");
		if (!tc(e) || dr(e) && n.nodeType !== Oe.DOCUMENT_NODE) throw new se(se.HIERARCHY_REQUEST_ERR, "Unexpected node type " + e.nodeType + " for parent node type " + n.nodeType);
	}
	function ic(n, e, t) {
		var r = n.childNodes || [], i = e.childNodes || [];
		if (e.nodeType === Oe.DOCUMENT_FRAGMENT_NODE) {
			var s = i.filter(nr);
			if (s.length > 1 || $t(i, Uo)) throw new se(se.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (s.length === 1 && !Co(n, t)) throw new se(se.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (nr(e) && !Co(n, t)) throw new se(se.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		if (dr(e)) {
			if ($t(r, dr)) throw new se(se.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var a = $t(r, nr);
			if (t && r.indexOf(a) < r.indexOf(t)) throw new se(se.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
			if (!t && a) throw new se(se.HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
		}
	}
	function qo(n, e, t) {
		var r = n.childNodes || [], i = e.childNodes || [];
		if (e.nodeType === Oe.DOCUMENT_FRAGMENT_NODE) {
			var s = i.filter(nr);
			if (s.length > 1 || $t(i, Uo)) throw new se(se.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
			if (s.length === 1 && !To(n, t)) throw new se(se.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
		}
		if (nr(e) && !To(n, t)) throw new se(se.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
		if (dr(e)) {
			if ($t(r, function(l) {
				return dr(l) && l !== t;
			})) throw new se(se.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
			var a = $t(r, nr);
			if (t && r.indexOf(a) < r.indexOf(t)) throw new se(se.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
		}
	}
	function Qi(n, e, t, r) {
		rc(n, e, t), n.nodeType === Oe.DOCUMENT_NODE && (r || ic)(n, e, t);
		var i = e.parentNode;
		if (i && i.removeChild(e), e.nodeType === cr) {
			var s = e.firstChild;
			if (s == null) return e;
			var a = e.lastChild;
		} else s = a = e;
		var o = t ? t.previousSibling : n.lastChild;
		s.previousSibling = o, a.nextSibling = t, o ? o.nextSibling = s : n.firstChild = s, t == null ? n.lastChild = a : t.previousSibling = a;
		do
			s.parentNode = n;
		while (s !== a && (s = s.nextSibling));
		return fs(n.ownerDocument || n, n, e), e.nodeType == cr && (e.firstChild = e.lastChild = null), e;
	}
	sr.prototype = {
		implementation: null,
		nodeName: "#document",
		nodeType: Lr,
		doctype: null,
		documentElement: null,
		_inc: 1,
		insertBefore: function(n, e) {
			if (n.nodeType === cr) {
				for (var t = n.firstChild; t;) {
					var r = t.nextSibling;
					this.insertBefore(t, e), t = r;
				}
				return n;
			}
			return Qi(this, n, e), n.ownerDocument = this, this.documentElement === null && n.nodeType === Mt && (this.documentElement = n), n;
		},
		removeChild: function(n) {
			var e = zo(this, n);
			return e === this.documentElement && (this.documentElement = null), e;
		},
		replaceChild: function(n, e) {
			Qi(this, n, e, qo), n.ownerDocument = this, e && this.removeChild(e), nr(n) && (this.documentElement = n);
		},
		importNode: function(n, e) {
			return nc(this, n, e);
		},
		getElementById: function(n) {
			var e = null;
			return $i(this.documentElement, function(t) {
				if (t.nodeType == Mt && t.getAttribute("id") == n) return e = t, !0;
			}), e;
		},
		createElement: function(n) {
			var e = new ar(_t);
			e.ownerDocument = this, this.type === "html" && (n = n.toLowerCase()), zf(this.contentType) && (e.namespaceURI = Qt.HTML), e.nodeName = n, e.tagName = n, e.localName = n, e.childNodes = new lt();
			var t = e.attributes = new Fr();
			return t._ownerElement = e, e;
		},
		createDocumentFragment: function() {
			var n = new zr(_t);
			return n.ownerDocument = this, n.childNodes = new lt(), n;
		},
		createTextNode: function(n) {
			var e = new _i(_t);
			return e.ownerDocument = this, e.childNodes = new lt(), e.appendData(n), e;
		},
		createComment: function(n) {
			var e = new en(_t);
			return e.ownerDocument = this, e.childNodes = new lt(), e.appendData(n), e;
		},
		createCDATASection: function(n) {
			if (n.indexOf("]]>") !== -1) throw new se(se.INVALID_CHARACTER_ERR, "data contains \"]]>\"");
			var e = new tn(_t);
			return e.ownerDocument = this, e.childNodes = new lt(), e.appendData(n), e;
		},
		createProcessingInstruction: function(n, e) {
			var t = new sn(_t);
			return t.ownerDocument = this, t.childNodes = new lt(), t.nodeName = t.target = n, t.nodeValue = t.data = e, t;
		},
		createAttribute: function(n) {
			if (!$e.QName_exact.test(n)) throw new se(se.INVALID_CHARACTER_ERR, "invalid character in name \"" + n + "\"");
			return this.type === "html" && (n = n.toLowerCase()), this._createAttribute(n);
		},
		_createAttribute: function(n) {
			var e = new br(_t);
			return e.ownerDocument = this, e.childNodes = new lt(), e.name = n, e.nodeName = n, e.localName = n, e.specified = !0, e;
		},
		createEntityReference: function(n) {
			if (!$e.Name_exact.test(n)) throw new se(se.INVALID_CHARACTER_ERR, "not a valid xml name \"" + n + "\"");
			if (this.type === "html") throw new se("document is an html document", yt.NotSupportedError);
			var e = new nn(_t);
			return e.ownerDocument = this, e.childNodes = new lt(), e.nodeName = n, e;
		},
		createElementNS: function(n, e) {
			var t = os(n, e), r = new ar(_t), i = r.attributes = new Fr();
			return r.childNodes = new lt(), r.ownerDocument = this, r.nodeName = e, r.tagName = e, r.namespaceURI = t[0], r.prefix = t[1], r.localName = t[2], i._ownerElement = r, r;
		},
		createAttributeNS: function(n, e) {
			var t = os(n, e), r = new br(_t);
			return r.ownerDocument = this, r.childNodes = new lt(), r.nodeName = e, r.name = e, r.specified = !0, r.namespaceURI = t[0], r.prefix = t[1], r.localName = t[2], r;
		}
	};
	It(sr, Oe);
	function ar(n) {
		Nt(n), this._nsMap = Object.create(null);
	}
	ar.prototype = {
		nodeType: Mt,
		attributes: null,
		getQualifiedName: function() {
			return this.prefix ? this.prefix + ":" + this.localName : this.localName;
		},
		_isInHTMLDocumentAndNamespace: function() {
			return this.ownerDocument.type === "html" && this.namespaceURI === Qt.HTML;
		},
		hasAttributes: function() {
			return !!(this.attributes && this.attributes.length);
		},
		hasAttribute: function(n) {
			return !!this.getAttributeNode(n);
		},
		getAttribute: function(n) {
			var e = this.getAttributeNode(n);
			return e ? e.value : null;
		},
		getAttributeNode: function(n) {
			return this._isInHTMLDocumentAndNamespace() && (n = n.toLowerCase()), this.attributes.getNamedItem(n);
		},
		setAttribute: function(n, e) {
			this._isInHTMLDocumentAndNamespace() && (n = n.toLowerCase());
			var t = this.getAttributeNode(n);
			t ? t.value = t.nodeValue = "" + e : (t = this.ownerDocument._createAttribute(n), t.value = t.nodeValue = "" + e, this.setAttributeNode(t));
		},
		removeAttribute: function(n) {
			var e = this.getAttributeNode(n);
			e && this.removeAttributeNode(e);
		},
		setAttributeNode: function(n) {
			return this.attributes.setNamedItem(n);
		},
		setAttributeNodeNS: function(n) {
			return this.attributes.setNamedItemNS(n);
		},
		removeAttributeNode: function(n) {
			return this.attributes.removeNamedItem(n.nodeName);
		},
		removeAttributeNS: function(n, e) {
			var t = this.getAttributeNodeNS(n, e);
			t && this.removeAttributeNode(t);
		},
		hasAttributeNS: function(n, e) {
			return this.getAttributeNodeNS(n, e) != null;
		},
		getAttributeNS: function(n, e) {
			var t = this.getAttributeNodeNS(n, e);
			return t ? t.value : null;
		},
		setAttributeNS: function(n, e, t) {
			var i = os(n, e)[2], s = this.getAttributeNodeNS(n, i);
			s ? s.value = s.nodeValue = "" + t : (s = this.ownerDocument.createAttributeNS(n, e), s.value = s.nodeValue = "" + t, this.setAttributeNode(s));
		},
		getAttributeNodeNS: function(n, e) {
			return this.attributes.getNamedItemNS(n, e);
		},
		getElementsByClassName: function(n) {
			var e = xo(n);
			return new Kt(this, function(t) {
				var r = [];
				return e.length > 0 && $i(t, function(i) {
					if (i !== t && i.nodeType === Mt) {
						var s = i.getAttribute("class");
						if (s) {
							var a = n === s;
							if (!a) {
								var o = xo(s);
								a = e.every(Gf(o));
							}
							a && r.push(i);
						}
					}
				}), r;
			});
		},
		getElementsByTagName: function(n) {
			var e = (this.nodeType === Lr ? this : this.ownerDocument).type === "html", t = n.toLowerCase();
			return new Kt(this, function(r) {
				var i = [];
				return $i(r, function(s) {
					if (!(s === r || s.nodeType !== Mt)) if (n === "*") i.push(s);
					else s.getQualifiedName() === (e && s.namespaceURI === Qt.HTML ? t : n) && i.push(s);
				}), i;
			});
		},
		getElementsByTagNameNS: function(n, e) {
			return new Kt(this, function(t) {
				var r = [];
				return $i(t, function(i) {
					i !== t && i.nodeType === Mt && (n === "*" || i.namespaceURI === n) && (e === "*" || i.localName == e) && r.push(i);
				}), r;
			});
		}
	};
	sr.prototype.getElementsByClassName = ar.prototype.getElementsByClassName;
	sr.prototype.getElementsByTagName = ar.prototype.getElementsByTagName;
	sr.prototype.getElementsByTagNameNS = ar.prototype.getElementsByTagNameNS;
	It(ar, Oe);
	function br(n) {
		Nt(n), this.namespaceURI = null, this.prefix = null, this.ownerElement = null;
	}
	br.prototype.nodeType = Pr;
	It(br, Oe);
	function pr(n) {
		Nt(n);
	}
	pr.prototype = {
		data: "",
		substringData: function(n, e) {
			return this.data.substring(n, n + e);
		},
		appendData: function(n) {
			n = this.data + n, this.nodeValue = this.data = n, this.length = n.length;
		},
		insertData: function(n, e) {
			this.replaceData(n, 0, e);
		},
		deleteData: function(n, e) {
			this.replaceData(n, e, "");
		},
		replaceData: function(n, e, t) {
			var r = this.data.substring(0, n), i = this.data.substring(n + e);
			t = r + t + i, this.nodeValue = this.data = t, this.length = t.length;
		}
	};
	It(pr, Oe);
	function _i(n) {
		Nt(n);
	}
	_i.prototype = {
		nodeName: "#text",
		nodeType: wi,
		splitText: function(n) {
			var e = this.data, t = e.substring(n);
			e = e.substring(0, n), this.data = this.nodeValue = e, this.length = e.length;
			var r = this.ownerDocument.createTextNode(t);
			return this.parentNode && this.parentNode.insertBefore(r, this.nextSibling), r;
		}
	};
	It(_i, pr);
	function en(n) {
		Nt(n);
	}
	en.prototype = {
		nodeName: "#comment",
		nodeType: ls
	};
	It(en, pr);
	function tn(n) {
		Nt(n);
	}
	tn.prototype = {
		nodeName: "#cdata-section",
		nodeType: Oo
	};
	It(tn, _i);
	function rn(n) {
		Nt(n);
	}
	rn.prototype.nodeType = ko;
	It(rn, Oe);
	function cs(n) {
		Nt(n);
	}
	cs.prototype.nodeType = Zf;
	It(cs, Oe);
	function ds(n) {
		Nt(n);
	}
	ds.prototype.nodeType = Yf;
	It(ds, Oe);
	function nn(n) {
		Nt(n);
	}
	nn.prototype.nodeType = Ro;
	It(nn, Oe);
	function zr(n) {
		Nt(n);
	}
	zr.prototype.nodeName = "#document-fragment";
	zr.prototype.nodeType = cr;
	It(zr, Oe);
	function sn(n) {
		Nt(n);
	}
	sn.prototype.nodeType = us;
	It(sn, pr);
	function Wo() {}
	Wo.prototype.serializeToString = function(n, e) {
		return jo.call(n, e);
	};
	Oe.prototype.toString = jo;
	function jo(n) {
		var e;
		typeof n == "function" ? e = {
			requireWellFormed: !1,
			splitCDATASections: !0,
			nodeFilter: n
		} : n != null ? e = {
			requireWellFormed: !!n.requireWellFormed,
			splitCDATASections: n.splitCDATASections !== !1,
			nodeFilter: n.nodeFilter || null
		} : e = {
			requireWellFormed: !1,
			splitCDATASections: !0,
			nodeFilter: null
		};
		var t = [], r = this.nodeType === Lr && this.documentElement || this, i = r.prefix, s = r.namespaceURI;
		if (s && i == null) {
			var i = r.lookupPrefix(s);
			if (i == null) var a = [{
				namespace: s,
				prefix: null
			}];
		}
		return ps(this, t, a, e), t.join("");
	}
	function So(n, e, t) {
		var r = n.prefix || "", i = n.namespaceURI;
		if (!i || r === "xml" && i === Qt.XML || i === Qt.XMLNS) return !1;
		for (var s = t.length; s--;) {
			var a = t[s];
			if (a.prefix === r) return a.namespace !== i;
		}
		return !0;
	}
	function Ki(n, e, t, r) {
		if (r && !$e.QName_exact.test(e)) throw new se("The attribute name \"" + e + "\" is not a valid XML QName", yt.InvalidStateError);
		n.push(" ", e, "=\"", t.replace(/[<>&"\t\n\r]/g, Fo), "\"");
	}
	function ps(n, e, t, r) {
		t || (t = []);
		var i = r.nodeFilter, s = r.requireWellFormed, a = r.splitCDATASections, l = (n.nodeType === Lr ? n : n.ownerDocument).type === "html";
		vt(n, { ns: t }, {
			enter: function(u, f) {
				var c = f.ns;
				if (i) if (u = i(u), u) {
					if (typeof u == "string") return e.push(u), null;
				} else return null;
				switch (u.nodeType) {
					case Mt:
						var p = u.attributes, y = p.length, _ = u.tagName, N = _;
						if (!l && !u.prefix && u.namespaceURI) {
							for (var I, d = 0; d < p.length; d++) if (p.item(d).name === "xmlns") {
								I = p.item(d).value;
								break;
							}
							if (!I) for (var v = c.length - 1; v >= 0; v--) {
								var b = c[v];
								if (b.prefix === "" && b.namespace === u.namespaceURI) {
									I = b.namespace;
									break;
								}
							}
							if (I !== u.namespaceURI) for (var v = c.length - 1; v >= 0; v--) {
								var b = c[v];
								if (b.namespace === u.namespaceURI) {
									b.prefix && (N = b.prefix + ":" + _);
									break;
								}
							}
						}
						if (s && !$e.QName_exact.test(N)) throw new se("The element name \"" + N + "\" is not a valid XML QName", yt.InvalidStateError);
						e.push("<", N);
						for (var T = c.slice(), F = 0; F < y; F++) {
							var E = p.item(F);
							E.prefix == "xmlns" ? T.push({
								prefix: E.localName,
								namespace: E.value
							}) : E.nodeName == "xmlns" && T.push({
								prefix: "",
								namespace: E.value
							});
						}
						for (var F = 0; F < y; F++) {
							var E = p.item(F);
							if (So(E, l, T)) {
								var A = E.prefix || "", C = E.namespaceURI;
								Ki(e, A ? "xmlns:" + A : "xmlns", C, s), T.push({
									prefix: A,
									namespace: C
								});
							}
							var R = i ? i(E) : E;
							R && (typeof R == "string" ? e.push(R) : Ki(e, R.name, R.value, s));
						}
						if (_ === N && So(u, l, T)) {
							var q = u.prefix || "", C = u.namespaceURI;
							Ki(e, q ? "xmlns:" + q : "xmlns", C, s), T.push({
								prefix: q,
								namespace: C
							});
						}
						var M = !u.firstChild;
						if (M && (l || u.namespaceURI === Qt.HTML) && (M = Wf(_)), M) return e.push("/>"), null;
						if (e.push(">"), l && qf(_)) {
							for (var Z = u.firstChild; Z;) Z.data ? e.push(Z.data) : ps(Z, e, T.slice(), r), Z = Z.nextSibling;
							return e.push("</", N, ">"), null;
						}
						return {
							ns: T,
							tag: N
						};
					case Lr:
					case cr:
						if (s && u.nodeType === Lr && u.documentElement == null) throw new se("The Document has no documentElement", yt.InvalidStateError);
						return { ns: c };
					case Pr: return Ki(e, u.name, u.value, s), null;
					case wi:
						if (s && $e.InvalidChar.test(u.data)) throw new se("The Text node data contains characters outside the XML Char production", yt.InvalidStateError);
						return e.push(u.data.replace(/[<&>]/g, Fo)), null;
					case Oo:
						if (s && u.data.indexOf("]]>") !== -1) throw new se("The CDATASection data contains \"]]>\"", yt.InvalidStateError);
						return a ? e.push($e.CDATA_START, u.data.replace(/]]>/g, "]]]]><![CDATA[>"), $e.CDATA_END) : e.push($e.CDATA_START, u.data, $e.CDATA_END), null;
					case ls:
						if (s) {
							if ($e.InvalidChar.test(u.data)) throw new se("The comment node data contains characters outside the XML Char production", yt.InvalidStateError);
							if (u.data.indexOf("--") !== -1 || u.data[u.data.length - 1] === "-") throw new se("The comment node data contains \"--\" or ends with \"-\"", yt.InvalidStateError);
						}
						return e.push($e.COMMENT_START, u.data, $e.COMMENT_END), null;
					case ko:
						var V = u.publicId, $ = u.systemId;
						if (s) {
							if (!$e.Name_exact.test(u.name)) throw new se("The doctype name \"" + u.name + "\" is not a valid XML Name", yt.InvalidStateError);
							if (V && !$e.PubidLiteral_match.test(V)) throw new se("DocumentType publicId is not a valid PubidLiteral", yt.InvalidStateError);
							if ($ && $ !== "." && !$e.SystemLiteral_match.test($)) throw new se("DocumentType systemId is not a valid SystemLiteral", yt.InvalidStateError);
							if (u.internalSubset && u.internalSubset.indexOf("]>") !== -1) throw new se("DocumentType internalSubset contains \"]>\"", yt.InvalidStateError);
						}
						return e.push($e.DOCTYPE_DECL_START, " ", u.name), V ? (e.push(" ", $e.PUBLIC, " ", V), $ && $ !== "." && e.push(" ", $)) : $ && $ !== "." && e.push(" ", $e.SYSTEM, " ", $), u.internalSubset && e.push(" [", u.internalSubset, "]"), e.push(">"), null;
					case us:
						if (s) {
							if (!$e.NCName_exact.test(u.target) || u.target.toLowerCase() === "xml") throw new se("The processing instruction target \"" + u.target + "\" is not a valid XML NCName or is reserved", yt.InvalidStateError);
							if ($e.InvalidChar.test(u.data)) throw new se("The ProcessingInstruction data contains characters outside the XML Char production", yt.InvalidStateError);
							if (u.data.indexOf("?>") !== -1) throw new se("The ProcessingInstruction data contains \"?>\"", yt.InvalidStateError);
						}
						return e.push("<?", u.target, " ", u.data, "?>"), null;
					case Ro:
						if (s && !$e.Name_exact.test(u.nodeName)) throw new se("The entity reference name \"" + u.nodeName + "\" is not a valid XML Name", yt.InvalidStateError);
						return e.push("&", u.nodeName, ";"), null;
					default: return e.push("??", u.nodeName), null;
				}
			},
			exit: function(u, f) {
				f && f.tag && e.push("</", f.tag, ">");
			}
		});
	}
	function nc(n, e, t) {
		var r;
		return vt(e, null, { enter: function(i, s) {
			var a = i.cloneNode(!1);
			a.ownerDocument = n, a.parentNode = null, s === null ? r = a : s.appendChild(a);
			return i.nodeType === Pr || t ? a : null;
		} }), r;
	}
	function Ho(n, e, t) {
		var r;
		return vt(e, null, { enter: function(i, s) {
			var a = new i.constructor(_t);
			for (var o in i) if (Br(i, o)) {
				var l = i[o];
				typeof l != "object" && l != a[o] && (a[o] = l);
			}
			i.childNodes && (a.childNodes = new lt()), a.ownerDocument = n;
			var u = t;
			switch (a.nodeType) {
				case Mt:
					var f = i.attributes, c = a.attributes = new Fr(), p = f.length;
					c._ownerElement = a;
					for (var y = 0; y < p; y++) a.setAttributeNode(Ho(n, f.item(y), !0));
					break;
				case Pr: u = !0;
			}
			return s !== null ? s.appendChild(a) : r = a, u ? a : null;
		} }), r;
	}
	function Vo(n, e, t) {
		n[e] = t;
	}
	function as(n) {
		for (var e = [], t = n.firstChild; t;) t.nodeType === Mt && e.push(t), t = t.nextSibling;
		return e;
	}
	try {
		Object.defineProperty && (Object.defineProperty(Kt.prototype, "length", { get: function() {
			return Ji(this), this.$$length;
		} }), Object.defineProperty(Oe.prototype, "textContent", {
			get: function() {
				if (this.nodeType === Mt || this.nodeType === cr) {
					var n = [];
					return vt(this, null, { enter: function(e) {
						if (e.nodeType === Mt || e.nodeType === cr) return !0;
						if (e.nodeType === us || e.nodeType === ls) return null;
						n.push(e.nodeValue);
					} }), n.join("");
				}
				return this.nodeValue;
			},
			set: function(n) {
				switch (this.nodeType) {
					case Mt:
					case cr:
						for (; this.firstChild;) this.removeChild(this.firstChild);
						(n || String(n)) && this.appendChild(this.ownerDocument.createTextNode(n));
						break;
					default: this.data = n, this.value = n, this.nodeValue = n;
				}
			}
		}), Object.defineProperty(pr.prototype, "data", {
			get: function() {
				return this._data != null ? this._data : "";
			},
			set: function(n) {
				this._data = n, this.length = typeof n == "string" ? n.length : 0;
			}
		}), Object.defineProperty(pr.prototype, "nodeValue", {
			get: function() {
				return this.data;
			},
			set: function(n) {
				this.data = n;
			},
			enumerable: !0,
			configurable: !0
		}), Object.defineProperty(ar.prototype, "children", { get: function() {
			return new Kt(this, as);
		} }), Object.defineProperty(sr.prototype, "children", { get: function() {
			return new Kt(this, as);
		} }), Object.defineProperty(zr.prototype, "children", { get: function() {
			return new Kt(this, as);
		} }), Vo = function(n, e, t) {
			n["$$" + e] = t;
		});
	} catch {}
	Qe._updateLiveList = Ji;
	Qe.Attr = br;
	Qe.CDATASection = tn;
	Qe.CharacterData = pr;
	Qe.Comment = en;
	Qe.Document = sr;
	Qe.DocumentFragment = zr;
	Qe.DocumentType = rn;
	Qe.DOMImplementation = Po;
	Qe.Element = ar;
	Qe.Entity = ds;
	Qe.EntityReference = nn;
	Qe.LiveNodeList = Kt;
	Qe.NamedNodeMap = Fr;
	Qe.Node = Oe;
	Qe.NodeList = lt;
	Qe.Notation = cs;
	Qe.Text = _i;
	Qe.ProcessingInstruction = sn;
	Qe.walkDOM = vt;
	Qe.XMLSerializer = Wo;
});
var Yo = pe((xi) => {
	"use strict";
	var Go = yr().freeze;
	xi.XML_ENTITIES = Go({
		amp: "&",
		apos: "'",
		gt: ">",
		lt: "<",
		quot: "\""
	});
	xi.HTML_ENTITIES = Go({
		Aacute: "Á",
		aacute: "á",
		Abreve: "Ă",
		abreve: "ă",
		ac: "∾",
		acd: "∿",
		acE: "∾̳",
		Acirc: "Â",
		acirc: "â",
		acute: "´",
		Acy: "А",
		acy: "а",
		AElig: "Æ",
		aelig: "æ",
		af: "⁡",
		Afr: "𝔄",
		afr: "𝔞",
		Agrave: "À",
		agrave: "à",
		alefsym: "ℵ",
		aleph: "ℵ",
		Alpha: "Α",
		alpha: "α",
		Amacr: "Ā",
		amacr: "ā",
		amalg: "⨿",
		AMP: "&",
		amp: "&",
		And: "⩓",
		and: "∧",
		andand: "⩕",
		andd: "⩜",
		andslope: "⩘",
		andv: "⩚",
		ang: "∠",
		ange: "⦤",
		angle: "∠",
		angmsd: "∡",
		angmsdaa: "⦨",
		angmsdab: "⦩",
		angmsdac: "⦪",
		angmsdad: "⦫",
		angmsdae: "⦬",
		angmsdaf: "⦭",
		angmsdag: "⦮",
		angmsdah: "⦯",
		angrt: "∟",
		angrtvb: "⊾",
		angrtvbd: "⦝",
		angsph: "∢",
		angst: "Å",
		angzarr: "⍼",
		Aogon: "Ą",
		aogon: "ą",
		Aopf: "𝔸",
		aopf: "𝕒",
		ap: "≈",
		apacir: "⩯",
		apE: "⩰",
		ape: "≊",
		apid: "≋",
		apos: "'",
		ApplyFunction: "⁡",
		approx: "≈",
		approxeq: "≊",
		Aring: "Å",
		aring: "å",
		Ascr: "𝒜",
		ascr: "𝒶",
		Assign: "≔",
		ast: "*",
		asymp: "≈",
		asympeq: "≍",
		Atilde: "Ã",
		atilde: "ã",
		Auml: "Ä",
		auml: "ä",
		awconint: "∳",
		awint: "⨑",
		backcong: "≌",
		backepsilon: "϶",
		backprime: "‵",
		backsim: "∽",
		backsimeq: "⋍",
		Backslash: "∖",
		Barv: "⫧",
		barvee: "⊽",
		Barwed: "⌆",
		barwed: "⌅",
		barwedge: "⌅",
		bbrk: "⎵",
		bbrktbrk: "⎶",
		bcong: "≌",
		Bcy: "Б",
		bcy: "б",
		bdquo: "„",
		becaus: "∵",
		Because: "∵",
		because: "∵",
		bemptyv: "⦰",
		bepsi: "϶",
		bernou: "ℬ",
		Bernoullis: "ℬ",
		Beta: "Β",
		beta: "β",
		beth: "ℶ",
		between: "≬",
		Bfr: "𝔅",
		bfr: "𝔟",
		bigcap: "⋂",
		bigcirc: "◯",
		bigcup: "⋃",
		bigodot: "⨀",
		bigoplus: "⨁",
		bigotimes: "⨂",
		bigsqcup: "⨆",
		bigstar: "★",
		bigtriangledown: "▽",
		bigtriangleup: "△",
		biguplus: "⨄",
		bigvee: "⋁",
		bigwedge: "⋀",
		bkarow: "⤍",
		blacklozenge: "⧫",
		blacksquare: "▪",
		blacktriangle: "▴",
		blacktriangledown: "▾",
		blacktriangleleft: "◂",
		blacktriangleright: "▸",
		blank: "␣",
		blk12: "▒",
		blk14: "░",
		blk34: "▓",
		block: "█",
		bne: "=⃥",
		bnequiv: "≡⃥",
		bNot: "⫭",
		bnot: "⌐",
		Bopf: "𝔹",
		bopf: "𝕓",
		bot: "⊥",
		bottom: "⊥",
		bowtie: "⋈",
		boxbox: "⧉",
		boxDL: "╗",
		boxDl: "╖",
		boxdL: "╕",
		boxdl: "┐",
		boxDR: "╔",
		boxDr: "╓",
		boxdR: "╒",
		boxdr: "┌",
		boxH: "═",
		boxh: "─",
		boxHD: "╦",
		boxHd: "╤",
		boxhD: "╥",
		boxhd: "┬",
		boxHU: "╩",
		boxHu: "╧",
		boxhU: "╨",
		boxhu: "┴",
		boxminus: "⊟",
		boxplus: "⊞",
		boxtimes: "⊠",
		boxUL: "╝",
		boxUl: "╜",
		boxuL: "╛",
		boxul: "┘",
		boxUR: "╚",
		boxUr: "╙",
		boxuR: "╘",
		boxur: "└",
		boxV: "║",
		boxv: "│",
		boxVH: "╬",
		boxVh: "╫",
		boxvH: "╪",
		boxvh: "┼",
		boxVL: "╣",
		boxVl: "╢",
		boxvL: "╡",
		boxvl: "┤",
		boxVR: "╠",
		boxVr: "╟",
		boxvR: "╞",
		boxvr: "├",
		bprime: "‵",
		Breve: "˘",
		breve: "˘",
		brvbar: "¦",
		Bscr: "ℬ",
		bscr: "𝒷",
		bsemi: "⁏",
		bsim: "∽",
		bsime: "⋍",
		bsol: "\\",
		bsolb: "⧅",
		bsolhsub: "⟈",
		bull: "•",
		bullet: "•",
		bump: "≎",
		bumpE: "⪮",
		bumpe: "≏",
		Bumpeq: "≎",
		bumpeq: "≏",
		Cacute: "Ć",
		cacute: "ć",
		Cap: "⋒",
		cap: "∩",
		capand: "⩄",
		capbrcup: "⩉",
		capcap: "⩋",
		capcup: "⩇",
		capdot: "⩀",
		CapitalDifferentialD: "ⅅ",
		caps: "∩︀",
		caret: "⁁",
		caron: "ˇ",
		Cayleys: "ℭ",
		ccaps: "⩍",
		Ccaron: "Č",
		ccaron: "č",
		Ccedil: "Ç",
		ccedil: "ç",
		Ccirc: "Ĉ",
		ccirc: "ĉ",
		Cconint: "∰",
		ccups: "⩌",
		ccupssm: "⩐",
		Cdot: "Ċ",
		cdot: "ċ",
		cedil: "¸",
		Cedilla: "¸",
		cemptyv: "⦲",
		cent: "¢",
		CenterDot: "·",
		centerdot: "·",
		Cfr: "ℭ",
		cfr: "𝔠",
		CHcy: "Ч",
		chcy: "ч",
		check: "✓",
		checkmark: "✓",
		Chi: "Χ",
		chi: "χ",
		cir: "○",
		circ: "ˆ",
		circeq: "≗",
		circlearrowleft: "↺",
		circlearrowright: "↻",
		circledast: "⊛",
		circledcirc: "⊚",
		circleddash: "⊝",
		CircleDot: "⊙",
		circledR: "®",
		circledS: "Ⓢ",
		CircleMinus: "⊖",
		CirclePlus: "⊕",
		CircleTimes: "⊗",
		cirE: "⧃",
		cire: "≗",
		cirfnint: "⨐",
		cirmid: "⫯",
		cirscir: "⧂",
		ClockwiseContourIntegral: "∲",
		CloseCurlyDoubleQuote: "”",
		CloseCurlyQuote: "’",
		clubs: "♣",
		clubsuit: "♣",
		Colon: "∷",
		colon: ":",
		Colone: "⩴",
		colone: "≔",
		coloneq: "≔",
		comma: ",",
		commat: "@",
		comp: "∁",
		compfn: "∘",
		complement: "∁",
		complexes: "ℂ",
		cong: "≅",
		congdot: "⩭",
		Congruent: "≡",
		Conint: "∯",
		conint: "∮",
		ContourIntegral: "∮",
		Copf: "ℂ",
		copf: "𝕔",
		coprod: "∐",
		Coproduct: "∐",
		COPY: "©",
		copy: "©",
		copysr: "℗",
		CounterClockwiseContourIntegral: "∳",
		crarr: "↵",
		Cross: "⨯",
		cross: "✗",
		Cscr: "𝒞",
		cscr: "𝒸",
		csub: "⫏",
		csube: "⫑",
		csup: "⫐",
		csupe: "⫒",
		ctdot: "⋯",
		cudarrl: "⤸",
		cudarrr: "⤵",
		cuepr: "⋞",
		cuesc: "⋟",
		cularr: "↶",
		cularrp: "⤽",
		Cup: "⋓",
		cup: "∪",
		cupbrcap: "⩈",
		CupCap: "≍",
		cupcap: "⩆",
		cupcup: "⩊",
		cupdot: "⊍",
		cupor: "⩅",
		cups: "∪︀",
		curarr: "↷",
		curarrm: "⤼",
		curlyeqprec: "⋞",
		curlyeqsucc: "⋟",
		curlyvee: "⋎",
		curlywedge: "⋏",
		curren: "¤",
		curvearrowleft: "↶",
		curvearrowright: "↷",
		cuvee: "⋎",
		cuwed: "⋏",
		cwconint: "∲",
		cwint: "∱",
		cylcty: "⌭",
		Dagger: "‡",
		dagger: "†",
		daleth: "ℸ",
		Darr: "↡",
		dArr: "⇓",
		darr: "↓",
		dash: "‐",
		Dashv: "⫤",
		dashv: "⊣",
		dbkarow: "⤏",
		dblac: "˝",
		Dcaron: "Ď",
		dcaron: "ď",
		Dcy: "Д",
		dcy: "д",
		DD: "ⅅ",
		dd: "ⅆ",
		ddagger: "‡",
		ddarr: "⇊",
		DDotrahd: "⤑",
		ddotseq: "⩷",
		deg: "°",
		Del: "∇",
		Delta: "Δ",
		delta: "δ",
		demptyv: "⦱",
		dfisht: "⥿",
		Dfr: "𝔇",
		dfr: "𝔡",
		dHar: "⥥",
		dharl: "⇃",
		dharr: "⇂",
		DiacriticalAcute: "´",
		DiacriticalDot: "˙",
		DiacriticalDoubleAcute: "˝",
		DiacriticalGrave: "`",
		DiacriticalTilde: "˜",
		diam: "⋄",
		Diamond: "⋄",
		diamond: "⋄",
		diamondsuit: "♦",
		diams: "♦",
		die: "¨",
		DifferentialD: "ⅆ",
		digamma: "ϝ",
		disin: "⋲",
		div: "÷",
		divide: "÷",
		divideontimes: "⋇",
		divonx: "⋇",
		DJcy: "Ђ",
		djcy: "ђ",
		dlcorn: "⌞",
		dlcrop: "⌍",
		dollar: "$",
		Dopf: "𝔻",
		dopf: "𝕕",
		Dot: "¨",
		dot: "˙",
		DotDot: "⃜",
		doteq: "≐",
		doteqdot: "≑",
		DotEqual: "≐",
		dotminus: "∸",
		dotplus: "∔",
		dotsquare: "⊡",
		doublebarwedge: "⌆",
		DoubleContourIntegral: "∯",
		DoubleDot: "¨",
		DoubleDownArrow: "⇓",
		DoubleLeftArrow: "⇐",
		DoubleLeftRightArrow: "⇔",
		DoubleLeftTee: "⫤",
		DoubleLongLeftArrow: "⟸",
		DoubleLongLeftRightArrow: "⟺",
		DoubleLongRightArrow: "⟹",
		DoubleRightArrow: "⇒",
		DoubleRightTee: "⊨",
		DoubleUpArrow: "⇑",
		DoubleUpDownArrow: "⇕",
		DoubleVerticalBar: "∥",
		DownArrow: "↓",
		Downarrow: "⇓",
		downarrow: "↓",
		DownArrowBar: "⤓",
		DownArrowUpArrow: "⇵",
		DownBreve: "̑",
		downdownarrows: "⇊",
		downharpoonleft: "⇃",
		downharpoonright: "⇂",
		DownLeftRightVector: "⥐",
		DownLeftTeeVector: "⥞",
		DownLeftVector: "↽",
		DownLeftVectorBar: "⥖",
		DownRightTeeVector: "⥟",
		DownRightVector: "⇁",
		DownRightVectorBar: "⥗",
		DownTee: "⊤",
		DownTeeArrow: "↧",
		drbkarow: "⤐",
		drcorn: "⌟",
		drcrop: "⌌",
		Dscr: "𝒟",
		dscr: "𝒹",
		DScy: "Ѕ",
		dscy: "ѕ",
		dsol: "⧶",
		Dstrok: "Đ",
		dstrok: "đ",
		dtdot: "⋱",
		dtri: "▿",
		dtrif: "▾",
		duarr: "⇵",
		duhar: "⥯",
		dwangle: "⦦",
		DZcy: "Џ",
		dzcy: "џ",
		dzigrarr: "⟿",
		Eacute: "É",
		eacute: "é",
		easter: "⩮",
		Ecaron: "Ě",
		ecaron: "ě",
		ecir: "≖",
		Ecirc: "Ê",
		ecirc: "ê",
		ecolon: "≕",
		Ecy: "Э",
		ecy: "э",
		eDDot: "⩷",
		Edot: "Ė",
		eDot: "≑",
		edot: "ė",
		ee: "ⅇ",
		efDot: "≒",
		Efr: "𝔈",
		efr: "𝔢",
		eg: "⪚",
		Egrave: "È",
		egrave: "è",
		egs: "⪖",
		egsdot: "⪘",
		el: "⪙",
		Element: "∈",
		elinters: "⏧",
		ell: "ℓ",
		els: "⪕",
		elsdot: "⪗",
		Emacr: "Ē",
		emacr: "ē",
		empty: "∅",
		emptyset: "∅",
		EmptySmallSquare: "◻",
		emptyv: "∅",
		EmptyVerySmallSquare: "▫",
		emsp: " ",
		emsp13: " ",
		emsp14: " ",
		ENG: "Ŋ",
		eng: "ŋ",
		ensp: " ",
		Eogon: "Ę",
		eogon: "ę",
		Eopf: "𝔼",
		eopf: "𝕖",
		epar: "⋕",
		eparsl: "⧣",
		eplus: "⩱",
		epsi: "ε",
		Epsilon: "Ε",
		epsilon: "ε",
		epsiv: "ϵ",
		eqcirc: "≖",
		eqcolon: "≕",
		eqsim: "≂",
		eqslantgtr: "⪖",
		eqslantless: "⪕",
		Equal: "⩵",
		equals: "=",
		EqualTilde: "≂",
		equest: "≟",
		Equilibrium: "⇌",
		equiv: "≡",
		equivDD: "⩸",
		eqvparsl: "⧥",
		erarr: "⥱",
		erDot: "≓",
		Escr: "ℰ",
		escr: "ℯ",
		esdot: "≐",
		Esim: "⩳",
		esim: "≂",
		Eta: "Η",
		eta: "η",
		ETH: "Ð",
		eth: "ð",
		Euml: "Ë",
		euml: "ë",
		euro: "€",
		excl: "!",
		exist: "∃",
		Exists: "∃",
		expectation: "ℰ",
		ExponentialE: "ⅇ",
		exponentiale: "ⅇ",
		fallingdotseq: "≒",
		Fcy: "Ф",
		fcy: "ф",
		female: "♀",
		ffilig: "ﬃ",
		fflig: "ﬀ",
		ffllig: "ﬄ",
		Ffr: "𝔉",
		ffr: "𝔣",
		filig: "ﬁ",
		FilledSmallSquare: "◼",
		FilledVerySmallSquare: "▪",
		fjlig: "fj",
		flat: "♭",
		fllig: "ﬂ",
		fltns: "▱",
		fnof: "ƒ",
		Fopf: "𝔽",
		fopf: "𝕗",
		ForAll: "∀",
		forall: "∀",
		fork: "⋔",
		forkv: "⫙",
		Fouriertrf: "ℱ",
		fpartint: "⨍",
		frac12: "½",
		frac13: "⅓",
		frac14: "¼",
		frac15: "⅕",
		frac16: "⅙",
		frac18: "⅛",
		frac23: "⅔",
		frac25: "⅖",
		frac34: "¾",
		frac35: "⅗",
		frac38: "⅜",
		frac45: "⅘",
		frac56: "⅚",
		frac58: "⅝",
		frac78: "⅞",
		frasl: "⁄",
		frown: "⌢",
		Fscr: "ℱ",
		fscr: "𝒻",
		gacute: "ǵ",
		Gamma: "Γ",
		gamma: "γ",
		Gammad: "Ϝ",
		gammad: "ϝ",
		gap: "⪆",
		Gbreve: "Ğ",
		gbreve: "ğ",
		Gcedil: "Ģ",
		Gcirc: "Ĝ",
		gcirc: "ĝ",
		Gcy: "Г",
		gcy: "г",
		Gdot: "Ġ",
		gdot: "ġ",
		gE: "≧",
		ge: "≥",
		gEl: "⪌",
		gel: "⋛",
		geq: "≥",
		geqq: "≧",
		geqslant: "⩾",
		ges: "⩾",
		gescc: "⪩",
		gesdot: "⪀",
		gesdoto: "⪂",
		gesdotol: "⪄",
		gesl: "⋛︀",
		gesles: "⪔",
		Gfr: "𝔊",
		gfr: "𝔤",
		Gg: "⋙",
		gg: "≫",
		ggg: "⋙",
		gimel: "ℷ",
		GJcy: "Ѓ",
		gjcy: "ѓ",
		gl: "≷",
		gla: "⪥",
		glE: "⪒",
		glj: "⪤",
		gnap: "⪊",
		gnapprox: "⪊",
		gnE: "≩",
		gne: "⪈",
		gneq: "⪈",
		gneqq: "≩",
		gnsim: "⋧",
		Gopf: "𝔾",
		gopf: "𝕘",
		grave: "`",
		GreaterEqual: "≥",
		GreaterEqualLess: "⋛",
		GreaterFullEqual: "≧",
		GreaterGreater: "⪢",
		GreaterLess: "≷",
		GreaterSlantEqual: "⩾",
		GreaterTilde: "≳",
		Gscr: "𝒢",
		gscr: "ℊ",
		gsim: "≳",
		gsime: "⪎",
		gsiml: "⪐",
		Gt: "≫",
		GT: ">",
		gt: ">",
		gtcc: "⪧",
		gtcir: "⩺",
		gtdot: "⋗",
		gtlPar: "⦕",
		gtquest: "⩼",
		gtrapprox: "⪆",
		gtrarr: "⥸",
		gtrdot: "⋗",
		gtreqless: "⋛",
		gtreqqless: "⪌",
		gtrless: "≷",
		gtrsim: "≳",
		gvertneqq: "≩︀",
		gvnE: "≩︀",
		Hacek: "ˇ",
		hairsp: " ",
		half: "½",
		hamilt: "ℋ",
		HARDcy: "Ъ",
		hardcy: "ъ",
		hArr: "⇔",
		harr: "↔",
		harrcir: "⥈",
		harrw: "↭",
		Hat: "^",
		hbar: "ℏ",
		Hcirc: "Ĥ",
		hcirc: "ĥ",
		hearts: "♥",
		heartsuit: "♥",
		hellip: "…",
		hercon: "⊹",
		Hfr: "ℌ",
		hfr: "𝔥",
		HilbertSpace: "ℋ",
		hksearow: "⤥",
		hkswarow: "⤦",
		hoarr: "⇿",
		homtht: "∻",
		hookleftarrow: "↩",
		hookrightarrow: "↪",
		Hopf: "ℍ",
		hopf: "𝕙",
		horbar: "―",
		HorizontalLine: "─",
		Hscr: "ℋ",
		hscr: "𝒽",
		hslash: "ℏ",
		Hstrok: "Ħ",
		hstrok: "ħ",
		HumpDownHump: "≎",
		HumpEqual: "≏",
		hybull: "⁃",
		hyphen: "‐",
		Iacute: "Í",
		iacute: "í",
		ic: "⁣",
		Icirc: "Î",
		icirc: "î",
		Icy: "И",
		icy: "и",
		Idot: "İ",
		IEcy: "Е",
		iecy: "е",
		iexcl: "¡",
		iff: "⇔",
		Ifr: "ℑ",
		ifr: "𝔦",
		Igrave: "Ì",
		igrave: "ì",
		ii: "ⅈ",
		iiiint: "⨌",
		iiint: "∭",
		iinfin: "⧜",
		iiota: "℩",
		IJlig: "Ĳ",
		ijlig: "ĳ",
		Im: "ℑ",
		Imacr: "Ī",
		imacr: "ī",
		image: "ℑ",
		ImaginaryI: "ⅈ",
		imagline: "ℐ",
		imagpart: "ℑ",
		imath: "ı",
		imof: "⊷",
		imped: "Ƶ",
		Implies: "⇒",
		in: "∈",
		incare: "℅",
		infin: "∞",
		infintie: "⧝",
		inodot: "ı",
		Int: "∬",
		int: "∫",
		intcal: "⊺",
		integers: "ℤ",
		Integral: "∫",
		intercal: "⊺",
		Intersection: "⋂",
		intlarhk: "⨗",
		intprod: "⨼",
		InvisibleComma: "⁣",
		InvisibleTimes: "⁢",
		IOcy: "Ё",
		iocy: "ё",
		Iogon: "Į",
		iogon: "į",
		Iopf: "𝕀",
		iopf: "𝕚",
		Iota: "Ι",
		iota: "ι",
		iprod: "⨼",
		iquest: "¿",
		Iscr: "ℐ",
		iscr: "𝒾",
		isin: "∈",
		isindot: "⋵",
		isinE: "⋹",
		isins: "⋴",
		isinsv: "⋳",
		isinv: "∈",
		it: "⁢",
		Itilde: "Ĩ",
		itilde: "ĩ",
		Iukcy: "І",
		iukcy: "і",
		Iuml: "Ï",
		iuml: "ï",
		Jcirc: "Ĵ",
		jcirc: "ĵ",
		Jcy: "Й",
		jcy: "й",
		Jfr: "𝔍",
		jfr: "𝔧",
		jmath: "ȷ",
		Jopf: "𝕁",
		jopf: "𝕛",
		Jscr: "𝒥",
		jscr: "𝒿",
		Jsercy: "Ј",
		jsercy: "ј",
		Jukcy: "Є",
		jukcy: "є",
		Kappa: "Κ",
		kappa: "κ",
		kappav: "ϰ",
		Kcedil: "Ķ",
		kcedil: "ķ",
		Kcy: "К",
		kcy: "к",
		Kfr: "𝔎",
		kfr: "𝔨",
		kgreen: "ĸ",
		KHcy: "Х",
		khcy: "х",
		KJcy: "Ќ",
		kjcy: "ќ",
		Kopf: "𝕂",
		kopf: "𝕜",
		Kscr: "𝒦",
		kscr: "𝓀",
		lAarr: "⇚",
		Lacute: "Ĺ",
		lacute: "ĺ",
		laemptyv: "⦴",
		lagran: "ℒ",
		Lambda: "Λ",
		lambda: "λ",
		Lang: "⟪",
		lang: "⟨",
		langd: "⦑",
		langle: "⟨",
		lap: "⪅",
		Laplacetrf: "ℒ",
		laquo: "«",
		Larr: "↞",
		lArr: "⇐",
		larr: "←",
		larrb: "⇤",
		larrbfs: "⤟",
		larrfs: "⤝",
		larrhk: "↩",
		larrlp: "↫",
		larrpl: "⤹",
		larrsim: "⥳",
		larrtl: "↢",
		lat: "⪫",
		lAtail: "⤛",
		latail: "⤙",
		late: "⪭",
		lates: "⪭︀",
		lBarr: "⤎",
		lbarr: "⤌",
		lbbrk: "❲",
		lbrace: "{",
		lbrack: "[",
		lbrke: "⦋",
		lbrksld: "⦏",
		lbrkslu: "⦍",
		Lcaron: "Ľ",
		lcaron: "ľ",
		Lcedil: "Ļ",
		lcedil: "ļ",
		lceil: "⌈",
		lcub: "{",
		Lcy: "Л",
		lcy: "л",
		ldca: "⤶",
		ldquo: "“",
		ldquor: "„",
		ldrdhar: "⥧",
		ldrushar: "⥋",
		ldsh: "↲",
		lE: "≦",
		le: "≤",
		LeftAngleBracket: "⟨",
		LeftArrow: "←",
		Leftarrow: "⇐",
		leftarrow: "←",
		LeftArrowBar: "⇤",
		LeftArrowRightArrow: "⇆",
		leftarrowtail: "↢",
		LeftCeiling: "⌈",
		LeftDoubleBracket: "⟦",
		LeftDownTeeVector: "⥡",
		LeftDownVector: "⇃",
		LeftDownVectorBar: "⥙",
		LeftFloor: "⌊",
		leftharpoondown: "↽",
		leftharpoonup: "↼",
		leftleftarrows: "⇇",
		LeftRightArrow: "↔",
		Leftrightarrow: "⇔",
		leftrightarrow: "↔",
		leftrightarrows: "⇆",
		leftrightharpoons: "⇋",
		leftrightsquigarrow: "↭",
		LeftRightVector: "⥎",
		LeftTee: "⊣",
		LeftTeeArrow: "↤",
		LeftTeeVector: "⥚",
		leftthreetimes: "⋋",
		LeftTriangle: "⊲",
		LeftTriangleBar: "⧏",
		LeftTriangleEqual: "⊴",
		LeftUpDownVector: "⥑",
		LeftUpTeeVector: "⥠",
		LeftUpVector: "↿",
		LeftUpVectorBar: "⥘",
		LeftVector: "↼",
		LeftVectorBar: "⥒",
		lEg: "⪋",
		leg: "⋚",
		leq: "≤",
		leqq: "≦",
		leqslant: "⩽",
		les: "⩽",
		lescc: "⪨",
		lesdot: "⩿",
		lesdoto: "⪁",
		lesdotor: "⪃",
		lesg: "⋚︀",
		lesges: "⪓",
		lessapprox: "⪅",
		lessdot: "⋖",
		lesseqgtr: "⋚",
		lesseqqgtr: "⪋",
		LessEqualGreater: "⋚",
		LessFullEqual: "≦",
		LessGreater: "≶",
		lessgtr: "≶",
		LessLess: "⪡",
		lesssim: "≲",
		LessSlantEqual: "⩽",
		LessTilde: "≲",
		lfisht: "⥼",
		lfloor: "⌊",
		Lfr: "𝔏",
		lfr: "𝔩",
		lg: "≶",
		lgE: "⪑",
		lHar: "⥢",
		lhard: "↽",
		lharu: "↼",
		lharul: "⥪",
		lhblk: "▄",
		LJcy: "Љ",
		ljcy: "љ",
		Ll: "⋘",
		ll: "≪",
		llarr: "⇇",
		llcorner: "⌞",
		Lleftarrow: "⇚",
		llhard: "⥫",
		lltri: "◺",
		Lmidot: "Ŀ",
		lmidot: "ŀ",
		lmoust: "⎰",
		lmoustache: "⎰",
		lnap: "⪉",
		lnapprox: "⪉",
		lnE: "≨",
		lne: "⪇",
		lneq: "⪇",
		lneqq: "≨",
		lnsim: "⋦",
		loang: "⟬",
		loarr: "⇽",
		lobrk: "⟦",
		LongLeftArrow: "⟵",
		Longleftarrow: "⟸",
		longleftarrow: "⟵",
		LongLeftRightArrow: "⟷",
		Longleftrightarrow: "⟺",
		longleftrightarrow: "⟷",
		longmapsto: "⟼",
		LongRightArrow: "⟶",
		Longrightarrow: "⟹",
		longrightarrow: "⟶",
		looparrowleft: "↫",
		looparrowright: "↬",
		lopar: "⦅",
		Lopf: "𝕃",
		lopf: "𝕝",
		loplus: "⨭",
		lotimes: "⨴",
		lowast: "∗",
		lowbar: "_",
		LowerLeftArrow: "↙",
		LowerRightArrow: "↘",
		loz: "◊",
		lozenge: "◊",
		lozf: "⧫",
		lpar: "(",
		lparlt: "⦓",
		lrarr: "⇆",
		lrcorner: "⌟",
		lrhar: "⇋",
		lrhard: "⥭",
		lrm: "‎",
		lrtri: "⊿",
		lsaquo: "‹",
		Lscr: "ℒ",
		lscr: "𝓁",
		Lsh: "↰",
		lsh: "↰",
		lsim: "≲",
		lsime: "⪍",
		lsimg: "⪏",
		lsqb: "[",
		lsquo: "‘",
		lsquor: "‚",
		Lstrok: "Ł",
		lstrok: "ł",
		Lt: "≪",
		LT: "<",
		lt: "<",
		ltcc: "⪦",
		ltcir: "⩹",
		ltdot: "⋖",
		lthree: "⋋",
		ltimes: "⋉",
		ltlarr: "⥶",
		ltquest: "⩻",
		ltri: "◃",
		ltrie: "⊴",
		ltrif: "◂",
		ltrPar: "⦖",
		lurdshar: "⥊",
		luruhar: "⥦",
		lvertneqq: "≨︀",
		lvnE: "≨︀",
		macr: "¯",
		male: "♂",
		malt: "✠",
		maltese: "✠",
		Map: "⤅",
		map: "↦",
		mapsto: "↦",
		mapstodown: "↧",
		mapstoleft: "↤",
		mapstoup: "↥",
		marker: "▮",
		mcomma: "⨩",
		Mcy: "М",
		mcy: "м",
		mdash: "—",
		mDDot: "∺",
		measuredangle: "∡",
		MediumSpace: " ",
		Mellintrf: "ℳ",
		Mfr: "𝔐",
		mfr: "𝔪",
		mho: "℧",
		micro: "µ",
		mid: "∣",
		midast: "*",
		midcir: "⫰",
		middot: "·",
		minus: "−",
		minusb: "⊟",
		minusd: "∸",
		minusdu: "⨪",
		MinusPlus: "∓",
		mlcp: "⫛",
		mldr: "…",
		mnplus: "∓",
		models: "⊧",
		Mopf: "𝕄",
		mopf: "𝕞",
		mp: "∓",
		Mscr: "ℳ",
		mscr: "𝓂",
		mstpos: "∾",
		Mu: "Μ",
		mu: "μ",
		multimap: "⊸",
		mumap: "⊸",
		nabla: "∇",
		Nacute: "Ń",
		nacute: "ń",
		nang: "∠⃒",
		nap: "≉",
		napE: "⩰̸",
		napid: "≋̸",
		napos: "ŉ",
		napprox: "≉",
		natur: "♮",
		natural: "♮",
		naturals: "ℕ",
		nbsp: "\xA0",
		nbump: "≎̸",
		nbumpe: "≏̸",
		ncap: "⩃",
		Ncaron: "Ň",
		ncaron: "ň",
		Ncedil: "Ņ",
		ncedil: "ņ",
		ncong: "≇",
		ncongdot: "⩭̸",
		ncup: "⩂",
		Ncy: "Н",
		ncy: "н",
		ndash: "–",
		ne: "≠",
		nearhk: "⤤",
		neArr: "⇗",
		nearr: "↗",
		nearrow: "↗",
		nedot: "≐̸",
		NegativeMediumSpace: "​",
		NegativeThickSpace: "​",
		NegativeThinSpace: "​",
		NegativeVeryThinSpace: "​",
		nequiv: "≢",
		nesear: "⤨",
		nesim: "≂̸",
		NestedGreaterGreater: "≫",
		NestedLessLess: "≪",
		NewLine: `
`,
		nexist: "∄",
		nexists: "∄",
		Nfr: "𝔑",
		nfr: "𝔫",
		ngE: "≧̸",
		nge: "≱",
		ngeq: "≱",
		ngeqq: "≧̸",
		ngeqslant: "⩾̸",
		nges: "⩾̸",
		nGg: "⋙̸",
		ngsim: "≵",
		nGt: "≫⃒",
		ngt: "≯",
		ngtr: "≯",
		nGtv: "≫̸",
		nhArr: "⇎",
		nharr: "↮",
		nhpar: "⫲",
		ni: "∋",
		nis: "⋼",
		nisd: "⋺",
		niv: "∋",
		NJcy: "Њ",
		njcy: "њ",
		nlArr: "⇍",
		nlarr: "↚",
		nldr: "‥",
		nlE: "≦̸",
		nle: "≰",
		nLeftarrow: "⇍",
		nleftarrow: "↚",
		nLeftrightarrow: "⇎",
		nleftrightarrow: "↮",
		nleq: "≰",
		nleqq: "≦̸",
		nleqslant: "⩽̸",
		nles: "⩽̸",
		nless: "≮",
		nLl: "⋘̸",
		nlsim: "≴",
		nLt: "≪⃒",
		nlt: "≮",
		nltri: "⋪",
		nltrie: "⋬",
		nLtv: "≪̸",
		nmid: "∤",
		NoBreak: "⁠",
		NonBreakingSpace: "\xA0",
		Nopf: "ℕ",
		nopf: "𝕟",
		Not: "⫬",
		not: "¬",
		NotCongruent: "≢",
		NotCupCap: "≭",
		NotDoubleVerticalBar: "∦",
		NotElement: "∉",
		NotEqual: "≠",
		NotEqualTilde: "≂̸",
		NotExists: "∄",
		NotGreater: "≯",
		NotGreaterEqual: "≱",
		NotGreaterFullEqual: "≧̸",
		NotGreaterGreater: "≫̸",
		NotGreaterLess: "≹",
		NotGreaterSlantEqual: "⩾̸",
		NotGreaterTilde: "≵",
		NotHumpDownHump: "≎̸",
		NotHumpEqual: "≏̸",
		notin: "∉",
		notindot: "⋵̸",
		notinE: "⋹̸",
		notinva: "∉",
		notinvb: "⋷",
		notinvc: "⋶",
		NotLeftTriangle: "⋪",
		NotLeftTriangleBar: "⧏̸",
		NotLeftTriangleEqual: "⋬",
		NotLess: "≮",
		NotLessEqual: "≰",
		NotLessGreater: "≸",
		NotLessLess: "≪̸",
		NotLessSlantEqual: "⩽̸",
		NotLessTilde: "≴",
		NotNestedGreaterGreater: "⪢̸",
		NotNestedLessLess: "⪡̸",
		notni: "∌",
		notniva: "∌",
		notnivb: "⋾",
		notnivc: "⋽",
		NotPrecedes: "⊀",
		NotPrecedesEqual: "⪯̸",
		NotPrecedesSlantEqual: "⋠",
		NotReverseElement: "∌",
		NotRightTriangle: "⋫",
		NotRightTriangleBar: "⧐̸",
		NotRightTriangleEqual: "⋭",
		NotSquareSubset: "⊏̸",
		NotSquareSubsetEqual: "⋢",
		NotSquareSuperset: "⊐̸",
		NotSquareSupersetEqual: "⋣",
		NotSubset: "⊂⃒",
		NotSubsetEqual: "⊈",
		NotSucceeds: "⊁",
		NotSucceedsEqual: "⪰̸",
		NotSucceedsSlantEqual: "⋡",
		NotSucceedsTilde: "≿̸",
		NotSuperset: "⊃⃒",
		NotSupersetEqual: "⊉",
		NotTilde: "≁",
		NotTildeEqual: "≄",
		NotTildeFullEqual: "≇",
		NotTildeTilde: "≉",
		NotVerticalBar: "∤",
		npar: "∦",
		nparallel: "∦",
		nparsl: "⫽⃥",
		npart: "∂̸",
		npolint: "⨔",
		npr: "⊀",
		nprcue: "⋠",
		npre: "⪯̸",
		nprec: "⊀",
		npreceq: "⪯̸",
		nrArr: "⇏",
		nrarr: "↛",
		nrarrc: "⤳̸",
		nrarrw: "↝̸",
		nRightarrow: "⇏",
		nrightarrow: "↛",
		nrtri: "⋫",
		nrtrie: "⋭",
		nsc: "⊁",
		nsccue: "⋡",
		nsce: "⪰̸",
		Nscr: "𝒩",
		nscr: "𝓃",
		nshortmid: "∤",
		nshortparallel: "∦",
		nsim: "≁",
		nsime: "≄",
		nsimeq: "≄",
		nsmid: "∤",
		nspar: "∦",
		nsqsube: "⋢",
		nsqsupe: "⋣",
		nsub: "⊄",
		nsubE: "⫅̸",
		nsube: "⊈",
		nsubset: "⊂⃒",
		nsubseteq: "⊈",
		nsubseteqq: "⫅̸",
		nsucc: "⊁",
		nsucceq: "⪰̸",
		nsup: "⊅",
		nsupE: "⫆̸",
		nsupe: "⊉",
		nsupset: "⊃⃒",
		nsupseteq: "⊉",
		nsupseteqq: "⫆̸",
		ntgl: "≹",
		Ntilde: "Ñ",
		ntilde: "ñ",
		ntlg: "≸",
		ntriangleleft: "⋪",
		ntrianglelefteq: "⋬",
		ntriangleright: "⋫",
		ntrianglerighteq: "⋭",
		Nu: "Ν",
		nu: "ν",
		num: "#",
		numero: "№",
		numsp: " ",
		nvap: "≍⃒",
		nVDash: "⊯",
		nVdash: "⊮",
		nvDash: "⊭",
		nvdash: "⊬",
		nvge: "≥⃒",
		nvgt: ">⃒",
		nvHarr: "⤄",
		nvinfin: "⧞",
		nvlArr: "⤂",
		nvle: "≤⃒",
		nvlt: "<⃒",
		nvltrie: "⊴⃒",
		nvrArr: "⤃",
		nvrtrie: "⊵⃒",
		nvsim: "∼⃒",
		nwarhk: "⤣",
		nwArr: "⇖",
		nwarr: "↖",
		nwarrow: "↖",
		nwnear: "⤧",
		Oacute: "Ó",
		oacute: "ó",
		oast: "⊛",
		ocir: "⊚",
		Ocirc: "Ô",
		ocirc: "ô",
		Ocy: "О",
		ocy: "о",
		odash: "⊝",
		Odblac: "Ő",
		odblac: "ő",
		odiv: "⨸",
		odot: "⊙",
		odsold: "⦼",
		OElig: "Œ",
		oelig: "œ",
		ofcir: "⦿",
		Ofr: "𝔒",
		ofr: "𝔬",
		ogon: "˛",
		Ograve: "Ò",
		ograve: "ò",
		ogt: "⧁",
		ohbar: "⦵",
		ohm: "Ω",
		oint: "∮",
		olarr: "↺",
		olcir: "⦾",
		olcross: "⦻",
		oline: "‾",
		olt: "⧀",
		Omacr: "Ō",
		omacr: "ō",
		Omega: "Ω",
		omega: "ω",
		Omicron: "Ο",
		omicron: "ο",
		omid: "⦶",
		ominus: "⊖",
		Oopf: "𝕆",
		oopf: "𝕠",
		opar: "⦷",
		OpenCurlyDoubleQuote: "“",
		OpenCurlyQuote: "‘",
		operp: "⦹",
		oplus: "⊕",
		Or: "⩔",
		or: "∨",
		orarr: "↻",
		ord: "⩝",
		order: "ℴ",
		orderof: "ℴ",
		ordf: "ª",
		ordm: "º",
		origof: "⊶",
		oror: "⩖",
		orslope: "⩗",
		orv: "⩛",
		oS: "Ⓢ",
		Oscr: "𝒪",
		oscr: "ℴ",
		Oslash: "Ø",
		oslash: "ø",
		osol: "⊘",
		Otilde: "Õ",
		otilde: "õ",
		Otimes: "⨷",
		otimes: "⊗",
		otimesas: "⨶",
		Ouml: "Ö",
		ouml: "ö",
		ovbar: "⌽",
		OverBar: "‾",
		OverBrace: "⏞",
		OverBracket: "⎴",
		OverParenthesis: "⏜",
		par: "∥",
		para: "¶",
		parallel: "∥",
		parsim: "⫳",
		parsl: "⫽",
		part: "∂",
		PartialD: "∂",
		Pcy: "П",
		pcy: "п",
		percnt: "%",
		period: ".",
		permil: "‰",
		perp: "⊥",
		pertenk: "‱",
		Pfr: "𝔓",
		pfr: "𝔭",
		Phi: "Φ",
		phi: "φ",
		phiv: "ϕ",
		phmmat: "ℳ",
		phone: "☎",
		Pi: "Π",
		pi: "π",
		pitchfork: "⋔",
		piv: "ϖ",
		planck: "ℏ",
		planckh: "ℎ",
		plankv: "ℏ",
		plus: "+",
		plusacir: "⨣",
		plusb: "⊞",
		pluscir: "⨢",
		plusdo: "∔",
		plusdu: "⨥",
		pluse: "⩲",
		PlusMinus: "±",
		plusmn: "±",
		plussim: "⨦",
		plustwo: "⨧",
		pm: "±",
		Poincareplane: "ℌ",
		pointint: "⨕",
		Popf: "ℙ",
		popf: "𝕡",
		pound: "£",
		Pr: "⪻",
		pr: "≺",
		prap: "⪷",
		prcue: "≼",
		prE: "⪳",
		pre: "⪯",
		prec: "≺",
		precapprox: "⪷",
		preccurlyeq: "≼",
		Precedes: "≺",
		PrecedesEqual: "⪯",
		PrecedesSlantEqual: "≼",
		PrecedesTilde: "≾",
		preceq: "⪯",
		precnapprox: "⪹",
		precneqq: "⪵",
		precnsim: "⋨",
		precsim: "≾",
		Prime: "″",
		prime: "′",
		primes: "ℙ",
		prnap: "⪹",
		prnE: "⪵",
		prnsim: "⋨",
		prod: "∏",
		Product: "∏",
		profalar: "⌮",
		profline: "⌒",
		profsurf: "⌓",
		prop: "∝",
		Proportion: "∷",
		Proportional: "∝",
		propto: "∝",
		prsim: "≾",
		prurel: "⊰",
		Pscr: "𝒫",
		pscr: "𝓅",
		Psi: "Ψ",
		psi: "ψ",
		puncsp: " ",
		Qfr: "𝔔",
		qfr: "𝔮",
		qint: "⨌",
		Qopf: "ℚ",
		qopf: "𝕢",
		qprime: "⁗",
		Qscr: "𝒬",
		qscr: "𝓆",
		quaternions: "ℍ",
		quatint: "⨖",
		quest: "?",
		questeq: "≟",
		QUOT: "\"",
		quot: "\"",
		rAarr: "⇛",
		race: "∽̱",
		Racute: "Ŕ",
		racute: "ŕ",
		radic: "√",
		raemptyv: "⦳",
		Rang: "⟫",
		rang: "⟩",
		rangd: "⦒",
		range: "⦥",
		rangle: "⟩",
		raquo: "»",
		Rarr: "↠",
		rArr: "⇒",
		rarr: "→",
		rarrap: "⥵",
		rarrb: "⇥",
		rarrbfs: "⤠",
		rarrc: "⤳",
		rarrfs: "⤞",
		rarrhk: "↪",
		rarrlp: "↬",
		rarrpl: "⥅",
		rarrsim: "⥴",
		Rarrtl: "⤖",
		rarrtl: "↣",
		rarrw: "↝",
		rAtail: "⤜",
		ratail: "⤚",
		ratio: "∶",
		rationals: "ℚ",
		RBarr: "⤐",
		rBarr: "⤏",
		rbarr: "⤍",
		rbbrk: "❳",
		rbrace: "}",
		rbrack: "]",
		rbrke: "⦌",
		rbrksld: "⦎",
		rbrkslu: "⦐",
		Rcaron: "Ř",
		rcaron: "ř",
		Rcedil: "Ŗ",
		rcedil: "ŗ",
		rceil: "⌉",
		rcub: "}",
		Rcy: "Р",
		rcy: "р",
		rdca: "⤷",
		rdldhar: "⥩",
		rdquo: "”",
		rdquor: "”",
		rdsh: "↳",
		Re: "ℜ",
		real: "ℜ",
		realine: "ℛ",
		realpart: "ℜ",
		reals: "ℝ",
		rect: "▭",
		REG: "®",
		reg: "®",
		ReverseElement: "∋",
		ReverseEquilibrium: "⇋",
		ReverseUpEquilibrium: "⥯",
		rfisht: "⥽",
		rfloor: "⌋",
		Rfr: "ℜ",
		rfr: "𝔯",
		rHar: "⥤",
		rhard: "⇁",
		rharu: "⇀",
		rharul: "⥬",
		Rho: "Ρ",
		rho: "ρ",
		rhov: "ϱ",
		RightAngleBracket: "⟩",
		RightArrow: "→",
		Rightarrow: "⇒",
		rightarrow: "→",
		RightArrowBar: "⇥",
		RightArrowLeftArrow: "⇄",
		rightarrowtail: "↣",
		RightCeiling: "⌉",
		RightDoubleBracket: "⟧",
		RightDownTeeVector: "⥝",
		RightDownVector: "⇂",
		RightDownVectorBar: "⥕",
		RightFloor: "⌋",
		rightharpoondown: "⇁",
		rightharpoonup: "⇀",
		rightleftarrows: "⇄",
		rightleftharpoons: "⇌",
		rightrightarrows: "⇉",
		rightsquigarrow: "↝",
		RightTee: "⊢",
		RightTeeArrow: "↦",
		RightTeeVector: "⥛",
		rightthreetimes: "⋌",
		RightTriangle: "⊳",
		RightTriangleBar: "⧐",
		RightTriangleEqual: "⊵",
		RightUpDownVector: "⥏",
		RightUpTeeVector: "⥜",
		RightUpVector: "↾",
		RightUpVectorBar: "⥔",
		RightVector: "⇀",
		RightVectorBar: "⥓",
		ring: "˚",
		risingdotseq: "≓",
		rlarr: "⇄",
		rlhar: "⇌",
		rlm: "‏",
		rmoust: "⎱",
		rmoustache: "⎱",
		rnmid: "⫮",
		roang: "⟭",
		roarr: "⇾",
		robrk: "⟧",
		ropar: "⦆",
		Ropf: "ℝ",
		ropf: "𝕣",
		roplus: "⨮",
		rotimes: "⨵",
		RoundImplies: "⥰",
		rpar: ")",
		rpargt: "⦔",
		rppolint: "⨒",
		rrarr: "⇉",
		Rrightarrow: "⇛",
		rsaquo: "›",
		Rscr: "ℛ",
		rscr: "𝓇",
		Rsh: "↱",
		rsh: "↱",
		rsqb: "]",
		rsquo: "’",
		rsquor: "’",
		rthree: "⋌",
		rtimes: "⋊",
		rtri: "▹",
		rtrie: "⊵",
		rtrif: "▸",
		rtriltri: "⧎",
		RuleDelayed: "⧴",
		ruluhar: "⥨",
		rx: "℞",
		Sacute: "Ś",
		sacute: "ś",
		sbquo: "‚",
		Sc: "⪼",
		sc: "≻",
		scap: "⪸",
		Scaron: "Š",
		scaron: "š",
		sccue: "≽",
		scE: "⪴",
		sce: "⪰",
		Scedil: "Ş",
		scedil: "ş",
		Scirc: "Ŝ",
		scirc: "ŝ",
		scnap: "⪺",
		scnE: "⪶",
		scnsim: "⋩",
		scpolint: "⨓",
		scsim: "≿",
		Scy: "С",
		scy: "с",
		sdot: "⋅",
		sdotb: "⊡",
		sdote: "⩦",
		searhk: "⤥",
		seArr: "⇘",
		searr: "↘",
		searrow: "↘",
		sect: "§",
		semi: ";",
		seswar: "⤩",
		setminus: "∖",
		setmn: "∖",
		sext: "✶",
		Sfr: "𝔖",
		sfr: "𝔰",
		sfrown: "⌢",
		sharp: "♯",
		SHCHcy: "Щ",
		shchcy: "щ",
		SHcy: "Ш",
		shcy: "ш",
		ShortDownArrow: "↓",
		ShortLeftArrow: "←",
		shortmid: "∣",
		shortparallel: "∥",
		ShortRightArrow: "→",
		ShortUpArrow: "↑",
		shy: "­",
		Sigma: "Σ",
		sigma: "σ",
		sigmaf: "ς",
		sigmav: "ς",
		sim: "∼",
		simdot: "⩪",
		sime: "≃",
		simeq: "≃",
		simg: "⪞",
		simgE: "⪠",
		siml: "⪝",
		simlE: "⪟",
		simne: "≆",
		simplus: "⨤",
		simrarr: "⥲",
		slarr: "←",
		SmallCircle: "∘",
		smallsetminus: "∖",
		smashp: "⨳",
		smeparsl: "⧤",
		smid: "∣",
		smile: "⌣",
		smt: "⪪",
		smte: "⪬",
		smtes: "⪬︀",
		SOFTcy: "Ь",
		softcy: "ь",
		sol: "/",
		solb: "⧄",
		solbar: "⌿",
		Sopf: "𝕊",
		sopf: "𝕤",
		spades: "♠",
		spadesuit: "♠",
		spar: "∥",
		sqcap: "⊓",
		sqcaps: "⊓︀",
		sqcup: "⊔",
		sqcups: "⊔︀",
		Sqrt: "√",
		sqsub: "⊏",
		sqsube: "⊑",
		sqsubset: "⊏",
		sqsubseteq: "⊑",
		sqsup: "⊐",
		sqsupe: "⊒",
		sqsupset: "⊐",
		sqsupseteq: "⊒",
		squ: "□",
		Square: "□",
		square: "□",
		SquareIntersection: "⊓",
		SquareSubset: "⊏",
		SquareSubsetEqual: "⊑",
		SquareSuperset: "⊐",
		SquareSupersetEqual: "⊒",
		SquareUnion: "⊔",
		squarf: "▪",
		squf: "▪",
		srarr: "→",
		Sscr: "𝒮",
		sscr: "𝓈",
		ssetmn: "∖",
		ssmile: "⌣",
		sstarf: "⋆",
		Star: "⋆",
		star: "☆",
		starf: "★",
		straightepsilon: "ϵ",
		straightphi: "ϕ",
		strns: "¯",
		Sub: "⋐",
		sub: "⊂",
		subdot: "⪽",
		subE: "⫅",
		sube: "⊆",
		subedot: "⫃",
		submult: "⫁",
		subnE: "⫋",
		subne: "⊊",
		subplus: "⪿",
		subrarr: "⥹",
		Subset: "⋐",
		subset: "⊂",
		subseteq: "⊆",
		subseteqq: "⫅",
		SubsetEqual: "⊆",
		subsetneq: "⊊",
		subsetneqq: "⫋",
		subsim: "⫇",
		subsub: "⫕",
		subsup: "⫓",
		succ: "≻",
		succapprox: "⪸",
		succcurlyeq: "≽",
		Succeeds: "≻",
		SucceedsEqual: "⪰",
		SucceedsSlantEqual: "≽",
		SucceedsTilde: "≿",
		succeq: "⪰",
		succnapprox: "⪺",
		succneqq: "⪶",
		succnsim: "⋩",
		succsim: "≿",
		SuchThat: "∋",
		Sum: "∑",
		sum: "∑",
		sung: "♪",
		Sup: "⋑",
		sup: "⊃",
		sup1: "¹",
		sup2: "²",
		sup3: "³",
		supdot: "⪾",
		supdsub: "⫘",
		supE: "⫆",
		supe: "⊇",
		supedot: "⫄",
		Superset: "⊃",
		SupersetEqual: "⊇",
		suphsol: "⟉",
		suphsub: "⫗",
		suplarr: "⥻",
		supmult: "⫂",
		supnE: "⫌",
		supne: "⊋",
		supplus: "⫀",
		Supset: "⋑",
		supset: "⊃",
		supseteq: "⊇",
		supseteqq: "⫆",
		supsetneq: "⊋",
		supsetneqq: "⫌",
		supsim: "⫈",
		supsub: "⫔",
		supsup: "⫖",
		swarhk: "⤦",
		swArr: "⇙",
		swarr: "↙",
		swarrow: "↙",
		swnwar: "⤪",
		szlig: "ß",
		Tab: "	",
		target: "⌖",
		Tau: "Τ",
		tau: "τ",
		tbrk: "⎴",
		Tcaron: "Ť",
		tcaron: "ť",
		Tcedil: "Ţ",
		tcedil: "ţ",
		Tcy: "Т",
		tcy: "т",
		tdot: "⃛",
		telrec: "⌕",
		Tfr: "𝔗",
		tfr: "𝔱",
		there4: "∴",
		Therefore: "∴",
		therefore: "∴",
		Theta: "Θ",
		theta: "θ",
		thetasym: "ϑ",
		thetav: "ϑ",
		thickapprox: "≈",
		thicksim: "∼",
		ThickSpace: "  ",
		thinsp: " ",
		ThinSpace: " ",
		thkap: "≈",
		thksim: "∼",
		THORN: "Þ",
		thorn: "þ",
		Tilde: "∼",
		tilde: "˜",
		TildeEqual: "≃",
		TildeFullEqual: "≅",
		TildeTilde: "≈",
		times: "×",
		timesb: "⊠",
		timesbar: "⨱",
		timesd: "⨰",
		tint: "∭",
		toea: "⤨",
		top: "⊤",
		topbot: "⌶",
		topcir: "⫱",
		Topf: "𝕋",
		topf: "𝕥",
		topfork: "⫚",
		tosa: "⤩",
		tprime: "‴",
		TRADE: "™",
		trade: "™",
		triangle: "▵",
		triangledown: "▿",
		triangleleft: "◃",
		trianglelefteq: "⊴",
		triangleq: "≜",
		triangleright: "▹",
		trianglerighteq: "⊵",
		tridot: "◬",
		trie: "≜",
		triminus: "⨺",
		TripleDot: "⃛",
		triplus: "⨹",
		trisb: "⧍",
		tritime: "⨻",
		trpezium: "⏢",
		Tscr: "𝒯",
		tscr: "𝓉",
		TScy: "Ц",
		tscy: "ц",
		TSHcy: "Ћ",
		tshcy: "ћ",
		Tstrok: "Ŧ",
		tstrok: "ŧ",
		twixt: "≬",
		twoheadleftarrow: "↞",
		twoheadrightarrow: "↠",
		Uacute: "Ú",
		uacute: "ú",
		Uarr: "↟",
		uArr: "⇑",
		uarr: "↑",
		Uarrocir: "⥉",
		Ubrcy: "Ў",
		ubrcy: "ў",
		Ubreve: "Ŭ",
		ubreve: "ŭ",
		Ucirc: "Û",
		ucirc: "û",
		Ucy: "У",
		ucy: "у",
		udarr: "⇅",
		Udblac: "Ű",
		udblac: "ű",
		udhar: "⥮",
		ufisht: "⥾",
		Ufr: "𝔘",
		ufr: "𝔲",
		Ugrave: "Ù",
		ugrave: "ù",
		uHar: "⥣",
		uharl: "↿",
		uharr: "↾",
		uhblk: "▀",
		ulcorn: "⌜",
		ulcorner: "⌜",
		ulcrop: "⌏",
		ultri: "◸",
		Umacr: "Ū",
		umacr: "ū",
		uml: "¨",
		UnderBar: "_",
		UnderBrace: "⏟",
		UnderBracket: "⎵",
		UnderParenthesis: "⏝",
		Union: "⋃",
		UnionPlus: "⊎",
		Uogon: "Ų",
		uogon: "ų",
		Uopf: "𝕌",
		uopf: "𝕦",
		UpArrow: "↑",
		Uparrow: "⇑",
		uparrow: "↑",
		UpArrowBar: "⤒",
		UpArrowDownArrow: "⇅",
		UpDownArrow: "↕",
		Updownarrow: "⇕",
		updownarrow: "↕",
		UpEquilibrium: "⥮",
		upharpoonleft: "↿",
		upharpoonright: "↾",
		uplus: "⊎",
		UpperLeftArrow: "↖",
		UpperRightArrow: "↗",
		Upsi: "ϒ",
		upsi: "υ",
		upsih: "ϒ",
		Upsilon: "Υ",
		upsilon: "υ",
		UpTee: "⊥",
		UpTeeArrow: "↥",
		upuparrows: "⇈",
		urcorn: "⌝",
		urcorner: "⌝",
		urcrop: "⌎",
		Uring: "Ů",
		uring: "ů",
		urtri: "◹",
		Uscr: "𝒰",
		uscr: "𝓊",
		utdot: "⋰",
		Utilde: "Ũ",
		utilde: "ũ",
		utri: "▵",
		utrif: "▴",
		uuarr: "⇈",
		Uuml: "Ü",
		uuml: "ü",
		uwangle: "⦧",
		vangrt: "⦜",
		varepsilon: "ϵ",
		varkappa: "ϰ",
		varnothing: "∅",
		varphi: "ϕ",
		varpi: "ϖ",
		varpropto: "∝",
		vArr: "⇕",
		varr: "↕",
		varrho: "ϱ",
		varsigma: "ς",
		varsubsetneq: "⊊︀",
		varsubsetneqq: "⫋︀",
		varsupsetneq: "⊋︀",
		varsupsetneqq: "⫌︀",
		vartheta: "ϑ",
		vartriangleleft: "⊲",
		vartriangleright: "⊳",
		Vbar: "⫫",
		vBar: "⫨",
		vBarv: "⫩",
		Vcy: "В",
		vcy: "в",
		VDash: "⊫",
		Vdash: "⊩",
		vDash: "⊨",
		vdash: "⊢",
		Vdashl: "⫦",
		Vee: "⋁",
		vee: "∨",
		veebar: "⊻",
		veeeq: "≚",
		vellip: "⋮",
		Verbar: "‖",
		verbar: "|",
		Vert: "‖",
		vert: "|",
		VerticalBar: "∣",
		VerticalLine: "|",
		VerticalSeparator: "❘",
		VerticalTilde: "≀",
		VeryThinSpace: " ",
		Vfr: "𝔙",
		vfr: "𝔳",
		vltri: "⊲",
		vnsub: "⊂⃒",
		vnsup: "⊃⃒",
		Vopf: "𝕍",
		vopf: "𝕧",
		vprop: "∝",
		vrtri: "⊳",
		Vscr: "𝒱",
		vscr: "𝓋",
		vsubnE: "⫋︀",
		vsubne: "⊊︀",
		vsupnE: "⫌︀",
		vsupne: "⊋︀",
		Vvdash: "⊪",
		vzigzag: "⦚",
		Wcirc: "Ŵ",
		wcirc: "ŵ",
		wedbar: "⩟",
		Wedge: "⋀",
		wedge: "∧",
		wedgeq: "≙",
		weierp: "℘",
		Wfr: "𝔚",
		wfr: "𝔴",
		Wopf: "𝕎",
		wopf: "𝕨",
		wp: "℘",
		wr: "≀",
		wreath: "≀",
		Wscr: "𝒲",
		wscr: "𝓌",
		xcap: "⋂",
		xcirc: "◯",
		xcup: "⋃",
		xdtri: "▽",
		Xfr: "𝔛",
		xfr: "𝔵",
		xhArr: "⟺",
		xharr: "⟷",
		Xi: "Ξ",
		xi: "ξ",
		xlArr: "⟸",
		xlarr: "⟵",
		xmap: "⟼",
		xnis: "⋻",
		xodot: "⨀",
		Xopf: "𝕏",
		xopf: "𝕩",
		xoplus: "⨁",
		xotime: "⨂",
		xrArr: "⟹",
		xrarr: "⟶",
		Xscr: "𝒳",
		xscr: "𝓍",
		xsqcup: "⨆",
		xuplus: "⨄",
		xutri: "△",
		xvee: "⋁",
		xwedge: "⋀",
		Yacute: "Ý",
		yacute: "ý",
		YAcy: "Я",
		yacy: "я",
		Ycirc: "Ŷ",
		ycirc: "ŷ",
		Ycy: "Ы",
		ycy: "ы",
		yen: "¥",
		Yfr: "𝔜",
		yfr: "𝔶",
		YIcy: "Ї",
		yicy: "ї",
		Yopf: "𝕐",
		yopf: "𝕪",
		Yscr: "𝒴",
		yscr: "𝓎",
		YUcy: "Ю",
		yucy: "ю",
		Yuml: "Ÿ",
		yuml: "ÿ",
		Zacute: "Ź",
		zacute: "ź",
		Zcaron: "Ž",
		zcaron: "ž",
		Zcy: "З",
		zcy: "з",
		Zdot: "Ż",
		zdot: "ż",
		zeetrf: "ℨ",
		ZeroWidthSpace: "​",
		Zeta: "Ζ",
		zeta: "ζ",
		Zfr: "ℨ",
		zfr: "𝔷",
		ZHcy: "Ж",
		zhcy: "ж",
		zigrarr: "⇝",
		Zopf: "ℤ",
		zopf: "𝕫",
		Zscr: "𝒵",
		zscr: "𝓏",
		zwj: "‍",
		zwnj: "‌"
	});
	xi.entityMap = xi.HTML_ENTITIES;
});
var ru = pe((on) => {
	"use strict";
	var Hr = yr(), ye = ss(), $o = pi(), sc = Hr.isHTMLEscapableRawTextElement, ac = Hr.isHTMLMimeType, oc = Hr.isHTMLRawTextElement, Ci = Hr.hasOwn, Zo = Hr.NAMESPACE, uc = $o.ParseError, lc = $o.DOMException, Ur = 0, mr = 1, qr = 2, Di = 3, Wr = 4, jr = 5, Ai = 6, an = 7;
	function Qo() {}
	Qo.prototype = { parse: function(n, e, t) {
		var r = this.domBuilder;
		r.startDocument(), dc(e, e = Object.create(null)), hc(n, e, t, r, this.errorHandler), r.endDocument();
	} };
	var vs = /&#?\w+;?/g;
	function hc(n, e, t, r, i) {
		var s = ac(r.mimeType);
		n.indexOf(ye.UNICODE_REPLACEMENT_CHARACTER) >= 0 && i.warning("Unicode replacement character detected, source encoding issues?");
		function a(fe) {
			if (fe > 65535) {
				fe -= 65536;
				var be = 55296 + (fe >> 10), ue = 56320 + (fe & 1023);
				return String.fromCharCode(be, ue);
			} else return String.fromCharCode(fe);
		}
		function o(fe) {
			var be = fe[fe.length - 1] === ";" ? fe : fe + ";";
			if (!s && be !== fe) return i.error("EntityRef: expecting ;"), fe;
			var ue = ye.Reference.exec(be);
			if (!ue || ue[0].length !== be.length) return i.error("entity not matching Reference production: " + fe), fe;
			var Ie = be.slice(1, -1);
			return Ci(t, Ie) ? t[Ie] : Ie.charAt(0) === "#" ? a(parseInt(Ie.substring(1).replace("x", "0x"))) : (i.error("entity not found:" + fe), fe);
		}
		function l(fe) {
			if (fe > I) {
				var be = n.substring(I, fe).replace(vs, o);
				p && y(I), r.characters(be, 0, fe - I), I = fe;
			}
		}
		var u = 0, f = 0, c = /\r\n?|\n|$/g, p = r.locator;
		function y(fe, be) {
			for (; fe >= f && (be = c.exec(n));) u = f, f = be.index + be[0].length, p.lineNumber++;
			p.columnNumber = fe - u + 1;
		}
		for (var _ = [{ currentNSMap: e }], N = [], I = 0;;) {
			try {
				var d = n.indexOf("<", I);
				if (d < 0) {
					if (!s && N.length > 0) return i.fatalError("unclosed xml tag(s): " + N.join(", "));
					if (!n.substring(I).match(/^\s*$/)) {
						var v = r.doc, b = v.createTextNode(n.substring(I));
						if (v.documentElement) return i.error("Extra content at the end of the document");
						v.appendChild(b), r.currentElement = b;
					}
					return;
				}
				if (d > I) {
					var T = n.substring(I, d);
					!s && N.length === 0 && (T = T.replace(new RegExp(ye.S_OPT.source, "g"), ""), T && i.error("Unexpected content outside root element: '" + T + "'")), l(d);
				}
				switch (n.charAt(d + 1)) {
					case "/":
						var oe = n.indexOf(">", d + 2), F = n.substring(d + 2, oe > 0 ? oe : void 0);
						if (!F) return i.fatalError("end tag name missing");
						var E = ye.reg("^", ye.QName_group, ye.S_OPT, "$"), A = oe > 0 && E.exec(F);
						if (!A) {
							var C = oe > 0 && ye.reg("^", ye.QName_group).exec(F);
							if (s && C) i.warning("end tag name contains invalid trailing characters: \"" + F + "\""), A = C;
							else if (C && new RegExp(E.source, E.flags + "m").test(F)) i.error("end tag name is followed by a line break and trailing content: \"" + F + "\""), A = C;
							else return i.fatalError("end tag name contains invalid characters: \"" + F + "\"");
						}
						if (!r.currentElement && !r.doc.documentElement) return;
						var R = N[N.length - 1] || r.currentElement.tagName || r.doc.documentElement.tagName || "";
						if (R !== A[1]) {
							var q = A[1].toLowerCase();
							if (!s || R.toLowerCase() !== q) return i.fatalError("Opening and ending tag mismatch: \"" + R + "\" != \"" + F + "\"");
						}
						var M = _.pop();
						N.pop();
						var Z = M.localNSMap;
						if (r.endElement(M.uri, M.localName, R), Z) for (var V in Z) Ci(Z, V) && r.endPrefixMapping(V);
						oe++;
						break;
					case "?":
						p && y(d), oe = mc(n, d, r, i);
						break;
					case "!":
						p && y(d), oe = eu(n, d, r, i, s);
						break;
					default:
						p && y(d);
						var $ = new tu(), me = _[_.length - 1].currentNSMap, oe = fc(n, d, $, me, o, i, s), xe = $.length;
						if ($.closed || (s && Hr.isHTMLVoidElement($.tagName) ? $.closed = !0 : N.push($.tagName)), p && xe) {
							for (var ce = Xo(p, {}), ae = 0; ae < xe; ae++) {
								var Ae = $[ae];
								y(Ae.offset), Ae.locator = Xo(p, {});
							}
							r.locator = ce, Ko($, r, me) && _.push($), r.locator = p;
						} else Ko($, r, me) && _.push($);
						s && !$.closed ? oe = cc(n, oe, $.tagName, o, r) : oe++;
				}
			} catch (fe) {
				if (fe instanceof uc) throw fe;
				if (fe instanceof lc) return i.fatalError("Error constructing the DOM: " + fe.name + ": " + fe.message, fe);
				i.error("element parse error: " + fe), oe = -1;
			}
			oe > I ? I = oe : l(Math.max(d, I) + 1);
		}
	}
	function Xo(n, e) {
		return e.lineNumber = n.lineNumber, e.columnNumber = n.columnNumber, e;
	}
	function fc(n, e, t, r, i, s, a) {
		function o(y, _, N) {
			if (Ci(t.attributeNames, y)) return s.fatalError("Attribute " + y + " redefined");
			if (!a && _.indexOf("<") >= 0) return s.fatalError("Unescaped '<' not allowed in attributes values");
			t.addValue(y, _.replace(/[\t\n\r]/g, " ").replace(vs, i), N);
		}
		for (var l, u, f = ++e, c = Ur;;) {
			var p = n.charAt(f);
			if (c === Ur && p === "<") throw new Error("unexpected < in tag name: " + n.slice(e, f));
			switch (p) {
				case "=":
					if (c === mr) l = n.slice(e, f), c = Di;
					else if (c === qr) c = Di;
					else throw new Error("attribute equal must after attrName");
					break;
				case "'":
				case "\"":
					if (c === Di || c === mr) if (c === mr && (s.warning("attribute value must after \"=\""), l = n.slice(e, f)), e = f + 1, f = n.indexOf(p, e), f > 0) u = n.slice(e, f), o(l, u, e - 1), c = jr;
					else throw new Error("attribute value no end '" + p + "' match");
					else if (c == Wr) u = n.slice(e, f), o(l, u, e), s.warning("attribute \"" + l + "\" missed start quot(" + p + ")!!"), e = f + 1, c = jr;
					else throw new Error("attribute value must after \"=\"");
					break;
				case "/":
					switch (c) {
						case Ur: t.setTagName(n.slice(e, f));
						case jr:
						case Ai:
						case an: c = an, t.closed = !0;
						case Wr:
						case mr: break;
						case qr:
							t.closed = !0;
							break;
						default: throw new Error("attribute invalid close char('/')");
					}
					break;
				case "": return s.error("unexpected end of input"), c == Ur && t.setTagName(n.slice(e, f)), f;
				case ">":
					switch (c) {
						case Ur: t.setTagName(n.slice(e, f));
						case jr:
						case Ai:
						case an: break;
						case Wr:
						case mr: u = n.slice(e, f), u.slice(-1) === "/" && (t.closed = !0, u = u.slice(0, -1));
						case qr:
							c === qr && (u = l), c == Wr ? (s.warning("attribute \"" + u + "\" missed quot(\")!"), o(l, u, e)) : (a || s.warning("attribute \"" + u + "\" missed value!! \"" + u + "\" instead!!"), o(u, u, e));
							break;
						case Di: if (!a) return s.fatalError(`AttValue: ' or " expected`);
					}
					return f;
				case "": p = " ";
				default: if (p <= " ") switch (c) {
					case Ur:
						t.setTagName(n.slice(e, f)), c = Ai;
						break;
					case mr:
						l = n.slice(e, f), c = qr;
						break;
					case Wr:
						var u = n.slice(e, f);
						s.warning("attribute \"" + u + "\" missed quot(\")!!"), o(l, u, e);
					case jr:
						c = Ai;
						break;
				}
				else switch (c) {
					case qr:
						a || s.warning("attribute \"" + l + "\" missed value!! \"" + l + "\" instead2!!"), o(l, l, e), e = f, c = mr;
						break;
					case jr: s.warning("attribute space is required\"" + l + "\"!!");
					case Ai:
						c = mr, e = f;
						break;
					case Di:
						c = Wr, e = f;
						break;
					case an: throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
			f++;
		}
	}
	function Ko(n, e, t) {
		for (var r = n.tagName, i = null, c = n.length; c--;) {
			var s = n[c], a = s.qName, o = s.value, p = a.indexOf(":");
			if (p > 0) var l = s.prefix = a.slice(0, p), u = a.slice(p + 1), f = l === "xmlns" && u;
			else u = a, l = null, f = a === "xmlns" && "";
			s.localName = u, f !== !1 && (i ?? (i = Object.create(null), t = Object.create(t)), t[f] = i[f] = o, s.uri = Zo.XMLNS, e.startPrefixMapping(f, o));
		}
		for (var c = n.length; c--;) s = n[c], s.prefix && (s.prefix === "xml" && (s.uri = Zo.XML), s.prefix !== "xmlns" && (s.uri = t[s.prefix]));
		var p = r.indexOf(":");
		p > 0 ? (l = n.prefix = r.slice(0, p), u = n.localName = r.slice(p + 1)) : (l = null, u = n.localName = r);
		var y = n.uri = t[l || ""];
		if (e.startElement(y, u, r, n), n.closed) {
			if (e.endElement(y, u, r), i) for (l in i) Ci(i, l) && e.endPrefixMapping(l);
		} else return n.currentNSMap = t, n.localNSMap = i, !0;
	}
	function cc(n, e, t, r, i) {
		var s = sc(t);
		if (s || oc(t)) {
			var a = new RegExp("</" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ">", "ig");
			a.lastIndex = e;
			var o = a.exec(n), l = o ? o.index : -1;
			if (l < 0) return e + 1;
			var u = n.substring(e + 1, l);
			return s && (u = u.replace(vs, r)), i.characters(u, 0, u.length), l;
		}
		return e + 1;
	}
	function dc(n, e) {
		for (var t in n) Ci(n, t) && (e[t] = n[t]);
	}
	function Jo(n, e) {
		var t = e;
		function r(f) {
			return f = f || 0, n.charAt(t + f);
		}
		function i(f) {
			f = f || 1, t += f;
		}
		function s() {
			for (var f = 0; t < n.length;) {
				var c = r();
				if (c !== " " && c !== `
` && c !== "	" && c !== "\r") return f;
				f++, i();
			}
			return -1;
		}
		function a() {
			return n.substring(t);
		}
		function o(f) {
			return n.substring(t, t + f.length) === f;
		}
		function l(f) {
			return n.substring(t, t + f.length).toUpperCase() === f.toUpperCase();
		}
		function u(f) {
			var p = ye.reg("^", f).exec(a());
			return p ? (i(p[0].length), p[0]) : null;
		}
		return {
			char: r,
			getIndex: function() {
				return t;
			},
			getMatch: u,
			getSource: function() {
				return n;
			},
			skip: i,
			skipBlanks: s,
			substringFromIndex: a,
			substringStartsWith: o,
			substringStartsWithCaseInsensitive: l
		};
	}
	function pc(n, e) {
		function t(o, l) {
			var u = ye.PI.exec(o.substringFromIndex());
			return u ? u[1].toLowerCase() === "xml" ? l.fatalError("xml declaration is only allowed at the start of the document, but found at position " + o.getIndex()) : (o.skip(u[0].length), u[0]) : l.fatalError("processing instruction is not well-formed at position " + o.getIndex());
		}
		var r = n.getSource();
		if (n.char() === "[") {
			n.skip(1);
			for (var i = n.getIndex(); n.getIndex() < r.length;) {
				if (n.skipBlanks(), n.char() === "]") {
					var s = r.substring(i, n.getIndex());
					return n.skip(1), s;
				}
				var a = null;
				if (n.char() === "<" && n.char(1) === "!") switch (n.char(2)) {
					case "E":
						n.char(3) === "L" ? a = n.getMatch(ye.elementdecl) : n.char(3) === "N" && (a = n.getMatch(ye.EntityDecl));
						break;
					case "A":
						a = n.getMatch(ye.AttlistDecl);
						break;
					case "N":
						a = n.getMatch(ye.NotationDecl);
						break;
					case "-":
						a = n.getMatch(ye.Comment);
						break;
				}
				else if (n.char() === "<" && n.char(1) === "?") a = t(n, e);
				else if (n.char() === "%") a = n.getMatch(ye.PEReference);
				else return e.fatalError("Error detected in Markup declaration");
				if (!a) return e.fatalError("Error in internal subset at position " + n.getIndex());
			}
			return e.fatalError("doctype internal subset is not well-formed, missing ]");
		}
	}
	function eu(n, e, t, r, i) {
		var s = Jo(n, e);
		switch (i ? s.char(2).toUpperCase() : s.char(2)) {
			case "-":
				var a = s.getMatch(ye.Comment);
				return a ? (t.comment(a, ye.COMMENT_START.length, a.length - ye.COMMENT_START.length - ye.COMMENT_END.length), s.getIndex()) : r.fatalError("comment is not well-formed at position " + s.getIndex());
			case "[":
				var o = s.getMatch(ye.CDSect);
				return o ? !i && !t.currentElement ? r.fatalError("CDATA outside of element") : (t.startCDATA(), t.characters(o, ye.CDATA_START.length, o.length - ye.CDATA_START.length - ye.CDATA_END.length), t.endCDATA(), s.getIndex()) : r.fatalError("Invalid CDATA starting at position " + e);
			case "D":
				if (t.doc && t.doc.documentElement) return r.fatalError("Doctype not allowed inside or after documentElement at position " + s.getIndex());
				if (i ? !s.substringStartsWithCaseInsensitive(ye.DOCTYPE_DECL_START) : !s.substringStartsWith(ye.DOCTYPE_DECL_START)) return r.fatalError("Expected " + ye.DOCTYPE_DECL_START + " at position " + s.getIndex());
				if (s.skip(ye.DOCTYPE_DECL_START.length), s.skipBlanks() < 1) return r.fatalError("Expected whitespace after " + ye.DOCTYPE_DECL_START + " at position " + s.getIndex());
				var l = {
					name: void 0,
					publicId: void 0,
					systemId: void 0,
					internalSubset: void 0
				};
				if (l.name = s.getMatch(ye.Name), !l.name) return r.fatalError("doctype name missing or contains unexpected characters at position " + s.getIndex());
				if (i && l.name.toLowerCase() !== "html" && r.warning("Unexpected DOCTYPE in HTML document at position " + s.getIndex()), s.skipBlanks(), s.substringStartsWith(ye.PUBLIC) || s.substringStartsWith(ye.SYSTEM)) {
					var u = ye.ExternalID_match.exec(s.substringFromIndex());
					if (!u) return r.fatalError("doctype external id is not well-formed at position " + s.getIndex());
					u.groups.SystemLiteralOnly !== void 0 ? l.systemId = u.groups.SystemLiteralOnly : (l.systemId = u.groups.SystemLiteral, l.publicId = u.groups.PubidLiteral), s.skip(u[0].length);
				} else if (i && s.substringStartsWithCaseInsensitive(ye.SYSTEM)) {
					if (s.skip(ye.SYSTEM.length), s.skipBlanks() < 1) return r.fatalError("Expected whitespace after " + ye.SYSTEM + " at position " + s.getIndex());
					if (l.systemId = s.getMatch(ye.ABOUT_LEGACY_COMPAT_SystemLiteral), !l.systemId) return r.fatalError("Expected " + ye.ABOUT_LEGACY_COMPAT + " in single or double quotes after " + ye.SYSTEM + " at position " + s.getIndex());
				}
				return i && l.systemId && !ye.ABOUT_LEGACY_COMPAT_SystemLiteral.test(l.systemId) && r.warning("Unexpected doctype.systemId in HTML document at position " + s.getIndex()), i || (s.skipBlanks(), l.internalSubset = pc(s, r)), s.skipBlanks(), s.char() !== ">" ? r.fatalError("doctype not terminated with > at position " + s.getIndex()) : (s.skip(1), t.startDTD(l.name, l.publicId, l.systemId, l.internalSubset), t.endDTD(), s.getIndex());
			default: return r.fatalError("Not well-formed XML starting with \"<!\" at position " + e);
		}
	}
	function mc(n, e, t, r) {
		var i = n.substring(e).match(ye.PI);
		if (!i) return r.fatalError("Invalid processing instruction starting at position " + e);
		if (i[1].toLowerCase() === "xml") {
			if (e > 0) return r.fatalError("processing instruction at position " + e + " is an xml declaration which is only at the start of the document");
			if (!ye.XMLDecl.test(n.substring(e))) return r.fatalError("xml declaration is not well-formed");
		}
		return t.processingInstruction(i[1], i[2]), e + i[0].length;
	}
	function tu() {
		this.attributeNames = Object.create(null);
	}
	tu.prototype = {
		setTagName: function(n) {
			if (!ye.QName_exact.test(n)) throw new Error("invalid tagName:" + n);
			this.tagName = n;
		},
		addValue: function(n, e, t) {
			if (!ye.QName_exact.test(n)) throw new Error("invalid attribute:" + n);
			this.attributeNames[n] = this.length, this[this.length++] = {
				qName: n,
				value: e,
				offset: t
			};
		},
		length: 0,
		getLocalName: function(n) {
			return this[n].localName;
		},
		getLocator: function(n) {
			return this[n].locator;
		},
		getQName: function(n) {
			return this[n].qName;
		},
		getURI: function(n) {
			return this[n].uri;
		},
		getValue: function(n) {
			return this[n].value;
		}
	};
	on.XMLReader = Qo;
	on.parseUtils = Jo;
	on.parseDoctypeCommentOrCData = eu;
});
var lu = pe((Gr) => {
	"use strict";
	var wr = yr(), vc = ms(), gc = pi(), iu = Yo(), Ec = ru(), yc = vc.DOMImplementation, bc = wr.hasDefaultHTMLNamespace, wc = wr.isHTMLMimeType, _c = wr.isValidMimeType, au = wr.MIME_TYPE, gs = wr.NAMESPACE, nu = gc.ParseError, xc = Ec.XMLReader;
	function ou(n) {
		return n.replace(/\r[\n\u0085]/g, `
`).replace(/[\r\u0085\u2028\u2029]/g, `
`);
	}
	function uu(n) {
		if (n = n || {}, n.locator === void 0 && (n.locator = !0), this.assign = n.assign || wr.assign, this.domHandler = n.domHandler || ln, this.onError = n.onError || n.errorHandler, n.errorHandler && typeof n.errorHandler != "function") throw new TypeError("errorHandler object is no longer supported, switch to onError!");
		n.errorHandler && n.errorHandler("warning", "The `errorHandler` option has been deprecated, use `onError` instead!", this), this.normalizeLineEndings = n.normalizeLineEndings || ou, this.locator = !!n.locator, this.xmlns = this.assign(Object.create(null), n.xmlns);
	}
	uu.prototype.parseFromString = function(n, e) {
		if (!_c(e)) throw new TypeError("DOMParser.parseFromString: the provided mimeType \"" + e + "\" is not valid.");
		var t = this.assign(Object.create(null), this.xmlns), r = iu.XML_ENTITIES, i = t[""] || null;
		bc(e) ? (r = iu.HTML_ENTITIES, i = gs.HTML) : e === au.XML_SVG_IMAGE && (i = gs.SVG), t[""] = i, t.xml = t.xml || gs.XML;
		var s = new this.domHandler({
			mimeType: e,
			defaultNamespace: i,
			onError: this.onError
		}), a = this.locator ? {} : void 0;
		this.locator && s.setDocumentLocator(a);
		var o = new xc();
		o.errorHandler = s, o.domBuilder = s;
		return !wr.isHTMLMimeType(e) && typeof n != "string" && o.errorHandler.fatalError("source is not a string"), o.parse(this.normalizeLineEndings(String(n)), t, r), s.doc.documentElement || o.errorHandler.fatalError("missing root element"), s.doc;
	};
	function ln(n) {
		var e = n || {};
		this.mimeType = e.mimeType || au.XML_APPLICATION, this.defaultNamespace = e.defaultNamespace || null, this.cdata = !1, this.currentElement = void 0, this.doc = void 0, this.locator = void 0, this.onError = e.onError;
	}
	function Vr(n, e) {
		e.lineNumber = n.lineNumber, e.columnNumber = n.columnNumber;
	}
	ln.prototype = {
		startDocument: function() {
			var n = new yc();
			this.doc = wc(this.mimeType) ? n.createHTMLDocument(!1) : n.createDocument(this.defaultNamespace, "");
		},
		startElement: function(n, e, t, r) {
			var i = this.doc, s = i.createElementNS(n, t || e), a = r.length;
			un(this, s), this.currentElement = s, this.locator && Vr(this.locator, s);
			for (var o = 0; o < a; o++) {
				var n = r.getURI(o), l = r.getValue(o), t = r.getQName(o), u = i.createAttributeNS(n, t);
				this.locator && Vr(r.getLocator(o), u), u.value = u.nodeValue = l, s.setAttributeNode(u);
			}
		},
		endElement: function(n, e, t) {
			this.currentElement = this.currentElement.parentNode;
		},
		startPrefixMapping: function(n, e) {},
		endPrefixMapping: function(n) {},
		processingInstruction: function(n, e) {
			var t = this.doc.createProcessingInstruction(n, e);
			this.locator && Vr(this.locator, t), un(this, t);
		},
		ignorableWhitespace: function(n, e, t) {},
		characters: function(n, e, t) {
			if (n = su.apply(this, arguments), n) {
				if (this.cdata) var r = this.doc.createCDATASection(n);
				else var r = this.doc.createTextNode(n);
				this.currentElement ? this.currentElement.appendChild(r) : /^\s*$/.test(n) && this.doc.appendChild(r), this.locator && Vr(this.locator, r);
			}
		},
		skippedEntity: function(n) {},
		endDocument: function() {
			this.doc.normalize();
		},
		setDocumentLocator: function(n) {
			n && (n.lineNumber = 0), this.locator = n;
		},
		comment: function(n, e, t) {
			n = su.apply(this, arguments);
			var r = this.doc.createComment(n);
			this.locator && Vr(this.locator, r), un(this, r);
		},
		startCDATA: function() {
			this.cdata = !0;
		},
		endCDATA: function() {
			this.cdata = !1;
		},
		startDTD: function(n, e, t, r) {
			var i = this.doc.implementation;
			if (i && i.createDocumentType) {
				var s = i.createDocumentType(n, e, t, r);
				this.locator && Vr(this.locator, s), un(this, s), this.doc.doctype = s;
			}
		},
		reportError: function(n, e) {
			if (typeof this.onError == "function") try {
				this.onError(n, e, this);
			} catch (t) {
				throw new nu("Reporting " + n + " \"" + e + "\" caused " + t, this.locator);
			}
			else console.error("[xmldom " + n + "]	" + e, Dc(this.locator));
		},
		warning: function(n) {
			this.reportError("warning", n);
		},
		error: function(n) {
			this.reportError("error", n);
		},
		fatalError: function(n, e) {
			throw this.reportError("fatalError", n), new nu(n, this.locator, e);
		}
	};
	function Dc(n) {
		if (n) return `
@#[line:` + n.lineNumber + ",col:" + n.columnNumber + "]";
	}
	function su(n, e, t) {
		return typeof n == "string" ? n.substr(e, t) : n.length >= e + t || e ? new java.lang.String(n, e, t) + "" : n;
	}
	"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(n) {
		ln.prototype[n] = function() {
			return null;
		};
	});
	function un(n, e) {
		n.currentElement ? n.currentElement.appendChild(e) : n.doc.appendChild(e);
	}
	function Ac(n) {
		if (n === "error") throw "onErrorStopParsing";
	}
	function Cc() {
		throw "onWarningStopParsing";
	}
	Gr.__DOMHandler = ln;
	Gr.DOMParser = uu;
	Gr.normalizeLineEndings = ou;
	Gr.onErrorStopParsing = Ac;
	Gr.onWarningStopParsing = Cc;
});
var Es = pe((Re) => {
	"use strict";
	var Yr = yr();
	Re.assign = Yr.assign;
	Re.hasDefaultHTMLNamespace = Yr.hasDefaultHTMLNamespace;
	Re.isHTMLMimeType = Yr.isHTMLMimeType;
	Re.isValidMimeType = Yr.isValidMimeType;
	Re.MIME_TYPE = Yr.MIME_TYPE;
	Re.NAMESPACE = Yr.NAMESPACE;
	var hn = pi();
	Re.DOMException = hn.DOMException;
	Re.DOMExceptionName = hn.DOMExceptionName;
	Re.ExceptionCode = hn.ExceptionCode;
	Re.ParseError = hn.ParseError;
	var ht = ms();
	Re.Attr = ht.Attr;
	Re.CDATASection = ht.CDATASection;
	Re.CharacterData = ht.CharacterData;
	Re.Comment = ht.Comment;
	Re.Document = ht.Document;
	Re.DocumentFragment = ht.DocumentFragment;
	Re.DocumentType = ht.DocumentType;
	Re.DOMImplementation = ht.DOMImplementation;
	Re.Element = ht.Element;
	Re.Entity = ht.Entity;
	Re.EntityReference = ht.EntityReference;
	Re.LiveNodeList = ht.LiveNodeList;
	Re.NamedNodeMap = ht.NamedNodeMap;
	Re.Node = ht.Node;
	Re.NodeList = ht.NodeList;
	Re.Notation = ht.Notation;
	Re.ProcessingInstruction = ht.ProcessingInstruction;
	Re.Text = ht.Text;
	Re.XMLSerializer = ht.XMLSerializer;
	var fn = lu();
	Re.DOMParser = fn.DOMParser;
	Re.normalizeLineEndings = fn.normalizeLineEndings;
	Re.onErrorStopParsing = fn.onErrorStopParsing;
	Re.onWarningStopParsing = fn.onWarningStopParsing;
});
var Oi = pe((xp, mu) => {
	"use strict";
	Is || (Is = { cwd: function() {
		return "/";
	} });
	var Is;
	function Jt(n) {
		if (typeof n != "string") throw new TypeError("Path must be a string. Received " + n);
	}
	function pu(n, e) {
		for (var t = "", r = -1, i = 0, s, a = 0; a <= n.length; ++a) {
			if (a < n.length) s = n.charCodeAt(a);
			else {
				if (s === 47) break;
				s = 47;
			}
			if (s === 47) {
				if (!(r === a - 1 || i === 1)) if (r !== a - 1 && i === 2) {
					if (t.length < 2 || t.charCodeAt(t.length - 1) !== 46 || t.charCodeAt(t.length - 2) !== 46) {
						if (t.length > 2) {
							for (var o = t.length - 1, l = o; l >= 0 && t.charCodeAt(l) !== 47; --l);
							if (l !== o) {
								l === -1 ? t = "" : t = t.slice(0, l), r = a, i = 0;
								continue;
							}
						} else if (t.length === 2 || t.length === 1) {
							t = "", r = a, i = 0;
							continue;
						}
					}
					e && (t.length > 0 ? t += "/.." : t = "..");
				} else t.length > 0 ? t += "/" + n.slice(r + 1, a) : t = n.slice(r + 1, a);
				r = a, i = 0;
			} else s === 46 && i !== -1 ? ++i : i = -1;
		}
		return t;
	}
	function kc(n, e) {
		var t = e.dir || e.root, r = e.base || (e.name || "") + (e.ext || "");
		return t ? t === e.root ? t + r : t + n + r : r;
	}
	var mn = {
		resolve: function() {
			for (var e = "", t = !1, r, i = arguments.length - 1; i >= -1 && !t; i--) {
				var s;
				i >= 0 ? s = arguments[i] : (r === void 0 && (r = Is.cwd()), s = r), Jt(s), s.length !== 0 && (e = s + "/" + e, t = s.charCodeAt(0) === 47);
			}
			return e = pu(e, !t), t ? e.length > 0 ? "/" + e : "/" : e.length > 0 ? e : ".";
		},
		normalize: function(e) {
			if (Jt(e), e.length === 0) return ".";
			var t = e.charCodeAt(0) === 47, r = e.charCodeAt(e.length - 1) === 47;
			return e = pu(e, !t), e.length === 0 && !t && (e = "."), e.length > 0 && r && (e += "/"), t ? "/" + e : e;
		},
		isAbsolute: function(e) {
			return Jt(e), e.length > 0 && e.charCodeAt(0) === 47;
		},
		join: function() {
			if (arguments.length === 0) return ".";
			for (var e, t = 0; t < arguments.length; ++t) {
				var r = arguments[t];
				Jt(r), r.length > 0 && (e === void 0 ? e = r : e += "/" + r);
			}
			return e === void 0 ? "." : mn.normalize(e);
		},
		relative: function(e, t) {
			if (Jt(e), Jt(t), e === t || (e = mn.resolve(e), t = mn.resolve(t), e === t)) return "";
			for (var r = 1; r < e.length && e.charCodeAt(r) === 47; ++r);
			for (var i = e.length, s = i - r, a = 1; a < t.length && t.charCodeAt(a) === 47; ++a);
			for (var l = t.length - a, u = s < l ? s : l, f = -1, c = 0; c <= u; ++c) {
				if (c === u) {
					if (l > u) {
						if (t.charCodeAt(a + c) === 47) return t.slice(a + c + 1);
						if (c === 0) return t.slice(a + c);
					} else s > u && (e.charCodeAt(r + c) === 47 ? f = c : c === 0 && (f = 0));
					break;
				}
				var p = e.charCodeAt(r + c);
				if (p !== t.charCodeAt(a + c)) break;
				p === 47 && (f = c);
			}
			var _ = "";
			for (c = r + f + 1; c <= i; ++c) (c === i || e.charCodeAt(c) === 47) && (_.length === 0 ? _ += ".." : _ += "/..");
			return _.length > 0 ? _ + t.slice(a + f) : (a += f, t.charCodeAt(a) === 47 && ++a, t.slice(a));
		},
		_makeLong: function(e) {
			return e;
		},
		dirname: function(e) {
			if (Jt(e), e.length === 0) return ".";
			for (var t = e.charCodeAt(0), r = t === 47, i = -1, s = !0, a = e.length - 1; a >= 1; --a) if (t = e.charCodeAt(a), t === 47) {
				if (!s) {
					i = a;
					break;
				}
			} else s = !1;
			return i === -1 ? r ? "/" : "." : r && i === 1 ? "//" : e.slice(0, i);
		},
		basename: function(e, t) {
			if (t !== void 0 && typeof t != "string") throw new TypeError("\"ext\" argument must be a string");
			Jt(e);
			var r = 0, i = -1, s = !0, a;
			if (t !== void 0 && t.length > 0 && t.length <= e.length) {
				if (t.length === e.length && t === e) return "";
				var o = t.length - 1, l = -1;
				for (a = e.length - 1; a >= 0; --a) {
					var u = e.charCodeAt(a);
					if (u === 47) {
						if (!s) {
							r = a + 1;
							break;
						}
					} else l === -1 && (s = !1, l = a + 1), o >= 0 && (u === t.charCodeAt(o) ? --o === -1 && (i = a) : (o = -1, i = l));
				}
				return r === i ? i = l : i === -1 && (i = e.length), e.slice(r, i);
			} else {
				for (a = e.length - 1; a >= 0; --a) if (e.charCodeAt(a) === 47) {
					if (!s) {
						r = a + 1;
						break;
					}
				} else i === -1 && (s = !1, i = a + 1);
				return i === -1 ? "" : e.slice(r, i);
			}
		},
		extname: function(e) {
			Jt(e);
			for (var t = -1, r = 0, i = -1, s = !0, a = 0, o = e.length - 1; o >= 0; --o) {
				var l = e.charCodeAt(o);
				if (l === 47) {
					if (!s) {
						r = o + 1;
						break;
					}
					continue;
				}
				i === -1 && (s = !1, i = o + 1), l === 46 ? t === -1 ? t = o : a !== 1 && (a = 1) : t !== -1 && (a = -1);
			}
			return t === -1 || i === -1 || a === 0 || a === 1 && t === i - 1 && t === r + 1 ? "" : e.slice(t, i);
		},
		format: function(e) {
			if (e === null || typeof e != "object") throw new TypeError("Parameter \"pathObject\" must be an object, not " + typeof e);
			return kc("/", e);
		},
		parse: function(e) {
			Jt(e);
			var t = {
				root: "",
				dir: "",
				base: "",
				ext: "",
				name: ""
			};
			if (e.length === 0) return t;
			var r = e.charCodeAt(0), i = r === 47, s;
			i ? (t.root = "/", s = 1) : s = 0;
			for (var a = -1, o = 0, l = -1, u = !0, f = e.length - 1, c = 0; f >= s; --f) {
				if (r = e.charCodeAt(f), r === 47) {
					if (!u) {
						o = f + 1;
						break;
					}
					continue;
				}
				l === -1 && (u = !1, l = f + 1), r === 46 ? a === -1 ? a = f : c !== 1 && (c = 1) : a !== -1 && (c = -1);
			}
			return a === -1 || l === -1 || c === 0 || c === 1 && a === l - 1 && a === o + 1 ? l !== -1 && (o === 0 && i ? t.base = t.name = e.slice(1, l) : t.base = t.name = e.slice(o, l)) : (o === 0 && i ? (t.name = e.slice(1, a), t.base = e.slice(1, l)) : (t.name = e.slice(o, a), t.base = e.slice(o, l)), t.ext = e.slice(a, l)), o > 0 ? t.dir = e.slice(0, o - 1) : i && (t.dir = "/"), t;
		},
		sep: "/",
		delimiter: ":",
		posix: null
	};
	mu.exports = mn;
});
var Pu = pe((xn) => {
	"use strict";
	Object.defineProperty(xn, "__esModule", { value: !0 });
	xn.createElement = Bu;
	function Bu(n) {
		return document.createElementNS("http://www.w3.org/2000/svg", n);
	}
	xn.default = { createElement: Bu };
});
var zu = pe((Bi) => {
	"use strict";
	Object.defineProperty(Bi, "__esModule", { value: !0 });
	Bi.proxyMouse = Fu;
	Bi.clone = Mu;
	Bi.default = { proxyMouse: Fu };
	function Fu(n, e) {
		function t(a) {
			for (var o = e.length - 1; o >= 0; o--) {
				var l = e[o], u = a.clientX, f = a.clientY;
				if (a.touches && a.touches.length && (u = a.touches[0].clientX, f = a.touches[0].clientY), !!qc(l, n, u, f)) {
					l.dispatchEvent(Mu(a));
					break;
				}
			}
		}
		if (n.nodeName === "iframe" || n.nodeName === "IFRAME") try {
			this.target = n.contentDocument;
		} catch {
			this.target = n;
		}
		else this.target = n;
		for (var r = [
			"mouseup",
			"mousedown",
			"click",
			"touchstart"
		], i = 0; i < r.length; i++) {
			var s = r[i];
			this.target.addEventListener(s, function(a) {
				return t(a);
			}, !1);
		}
	}
	function Mu(n) {
		var e = Object.assign({}, n, { bubbles: !1 });
		try {
			return new MouseEvent(n.type, e);
		} catch {
			var t = document.createEvent("MouseEvents");
			return t.initMouseEvent(n.type, !1, e.cancelable, e.view, e.detail, e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, e.relatedTarget), t;
		}
	}
	function qc(n, e, t, r) {
		var i = e.getBoundingClientRect();
		function s(f, c, p) {
			var y = f.top - i.top, _ = f.left - i.left, N = y + f.height, I = _ + f.width;
			return y <= p && _ <= c && N > p && I > c;
		}
		if (!s(n.getBoundingClientRect(), t, r)) return !1;
		for (var o = n.getClientRects(), l = 0, u = o.length; l < u; l++) if (s(o[l], t, r)) return !0;
		return !1;
	}
});
var ju = pe((er) => {
	"use strict";
	Object.defineProperty(er, "__esModule", { value: !0 });
	er.Underline = er.Highlight = er.Mark = er.Pane = void 0;
	var Wc = function n(e, t, r) {
		e === null && (e = Function.prototype);
		var i = Object.getOwnPropertyDescriptor(e, t);
		if (i === void 0) {
			var s = Object.getPrototypeOf(e);
			return s === null ? void 0 : n(s, t, r);
		} else {
			if ("value" in i) return i.value;
			var a = i.get;
			return a === void 0 ? void 0 : a.call(r);
		}
	}, Dn = (function() {
		function n(e, t) {
			for (var r = 0; r < t.length; r++) {
				var i = t[r];
				i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(e, i.key, i);
			}
		}
		return function(e, t, r) {
			return t && n(e.prototype, t), r && n(e, r), e;
		};
	})(), Pi = Uu(Pu()), Vc = Uu(zu());
	function Uu(n) {
		return n && n.__esModule ? n : { default: n };
	}
	function qu(n, e) {
		if (!n) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		return e && (typeof e == "object" || typeof e == "function") ? e : n;
	}
	function Wu(n, e) {
		if (typeof e != "function" && e !== null) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
		n.prototype = Object.create(e && e.prototype, { constructor: {
			value: n,
			enumerable: !1,
			writable: !0,
			configurable: !0
		} }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(n, e) : n.__proto__ = e);
	}
	function An(n, e) {
		if (!(n instanceof e)) throw new TypeError("Cannot call a class as a function");
	}
	er.Pane = (function() {
		function n(e) {
			var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : document.body;
			An(this, n), this.target = e, this.element = Pi.default.createElement("svg"), this.marks = [], this.element.style.position = "absolute", this.element.setAttribute("pointer-events", "none"), Vc.default.proxyMouse(this.target, this.marks), this.container = t, this.container.appendChild(this.element), this.render();
		}
		return Dn(n, [
			{
				key: "addMark",
				value: function(t) {
					var r = Pi.default.createElement("g");
					return this.element.appendChild(r), t.bind(r, this.container), this.marks.push(t), t.render(), t;
				}
			},
			{
				key: "removeMark",
				value: function(t) {
					var r = this.marks.indexOf(t);
					if (r !== -1) {
						var i = t.unbind();
						this.element.removeChild(i), this.marks.splice(r, 1);
					}
				}
			},
			{
				key: "render",
				value: function() {
					Xc(this.element, Zc(this.target, this.container));
					var t = !0, r = !1, i = void 0;
					try {
						for (var s = this.marks[Symbol.iterator](), a; !(t = (a = s.next()).done); t = !0) a.value.render();
					} catch (l) {
						r = !0, i = l;
					} finally {
						try {
							!t && s.return && s.return();
						} finally {
							if (r) throw i;
						}
					}
				}
			}
		]), n;
	})();
	er.Underline = (function(n) {
		Wu(e, n);
		function e(t, r, i, s) {
			return An(this, e), qu(this, (e.__proto__ || Object.getPrototypeOf(e)).call(this, t, r, i, s));
		}
		return Dn(e, [{
			key: "render",
			value: function() {
				for (; this.element.firstChild;) this.element.removeChild(this.element.firstChild);
				for (var r = this.element.ownerDocument.createDocumentFragment(), i = this.filteredRanges(), s = this.element.getBoundingClientRect(), a = this.container.getBoundingClientRect(), o = 0, l = i.length; o < l; o++) {
					var u = i[o], f = Pi.default.createElement("rect");
					f.setAttribute("x", u.left - s.left + a.left), f.setAttribute("y", u.top - s.top + a.top), f.setAttribute("height", u.height), f.setAttribute("width", u.width), f.setAttribute("fill", "none");
					var c = Pi.default.createElement("line");
					c.setAttribute("x1", u.left - s.left + a.left), c.setAttribute("x2", u.left - s.left + a.left + u.width), c.setAttribute("y1", u.top - s.top + a.top + u.height - 1), c.setAttribute("y2", u.top - s.top + a.top + u.height - 1), c.setAttribute("stroke-width", 1), c.setAttribute("stroke", "black"), c.setAttribute("stroke-linecap", "square"), r.appendChild(f), r.appendChild(c);
				}
				this.element.appendChild(r);
			}
		}]), e;
	})(er.Highlight = (function(n) {
		Wu(e, n);
		function e(t, r, i, s) {
			An(this, e);
			var a = qu(this, (e.__proto__ || Object.getPrototypeOf(e)).call(this));
			return a.range = t, a.className = r, a.data = i || {}, a.attributes = s || {}, a;
		}
		return Dn(e, [{
			key: "bind",
			value: function(r, i) {
				Wc(e.prototype.__proto__ || Object.getPrototypeOf(e.prototype), "bind", this).call(this, r, i);
				for (var s in this.data) this.data.hasOwnProperty(s) && (this.element.dataset[s] = this.data[s]);
				for (var s in this.attributes) this.attributes.hasOwnProperty(s) && this.element.setAttribute(s, this.attributes[s]);
				this.className && this.element.classList.add(this.className);
			}
		}, {
			key: "render",
			value: function() {
				for (; this.element.firstChild;) this.element.removeChild(this.element.firstChild);
				for (var r = this.element.ownerDocument.createDocumentFragment(), i = this.filteredRanges(), s = this.element.getBoundingClientRect(), a = this.container.getBoundingClientRect(), o = 0, l = i.length; o < l; o++) {
					var u = i[o], f = Pi.default.createElement("rect");
					f.setAttribute("x", u.left - s.left + a.left), f.setAttribute("y", u.top - s.top + a.top), f.setAttribute("height", u.height), f.setAttribute("width", u.width), r.appendChild(f);
				}
				this.element.appendChild(r);
			}
		}]), e;
	})(er.Mark = (function() {
		function n() {
			An(this, n), this.element = null;
		}
		return Dn(n, [
			{
				key: "bind",
				value: function(t, r) {
					this.element = t, this.container = r;
				}
			},
			{
				key: "unbind",
				value: function() {
					var t = this.element;
					return this.element = null, t;
				}
			},
			{
				key: "render",
				value: function() {}
			},
			{
				key: "dispatchEvent",
				value: function(t) {
					this.element && this.element.dispatchEvent(t);
				}
			},
			{
				key: "getBoundingClientRect",
				value: function() {
					return this.element.getBoundingClientRect();
				}
			},
			{
				key: "getClientRects",
				value: function() {
					for (var t = [], r = this.element.firstChild; r;) t.push(r.getBoundingClientRect()), r = r.nextSibling;
					return t;
				}
			},
			{
				key: "filteredRanges",
				value: function() {
					var t = Array.from(this.range.getClientRects());
					return t.filter(function(r) {
						for (var i = 0; i < t.length; i++) {
							if (t[i] === r) return !0;
							if (Kc(t[i], r)) return !1;
						}
						return !0;
					});
				}
			}
		]), n;
	})()));
	function Zc(n, e) {
		var t = e.getBoundingClientRect(), r = n.getBoundingClientRect();
		return {
			top: r.top - t.top,
			left: r.left - t.left,
			height: n.scrollHeight,
			width: n.scrollWidth
		};
	}
	function Xc(n, e) {
		n.style.setProperty("top", e.top + "px", "important"), n.style.setProperty("left", e.left + "px", "important"), n.style.setProperty("height", e.height + "px", "important"), n.style.setProperty("width", e.width + "px", "important");
	}
	function Kc(n, e) {
		return e.right <= n.right && e.left >= n.left && e.top >= n.top && e.bottom <= n.bottom;
	}
});
var Tn = pe((Km, Gu) => {
	function Qc(n) {
		var e = typeof n;
		return n != null && (e == "object" || e == "function");
	}
	Gu.exports = Qc;
});
var Zu = pe(($m, Yu) => {
	Yu.exports = typeof global == "object" && global && global.Object === Object && global;
});
var $s = pe((Qm, Xu) => {
	var ed = Zu(), td = typeof self == "object" && self && self.Object === Object && self;
	Xu.exports = ed || td || Function("return this")();
});
var $u = pe((Jm, Ku) => {
	var id = $s(), nd = function() {
		return id.Date.now();
	};
	Ku.exports = nd;
});
var Ju = pe((ev, Qu) => {
	var sd = /\s/;
	function ad(n) {
		for (var e = n.length; e-- && sd.test(n.charAt(e)););
		return e;
	}
	Qu.exports = ad;
});
var tl = pe((tv, el) => {
	var od = Ju(), ud = /^\s+/;
	function ld(n) {
		return n && n.slice(0, od(n) + 1).replace(ud, "");
	}
	el.exports = ld;
});
var Qs = pe((rv, rl) => {
	rl.exports = $s().Symbol;
});
var al = pe((iv, sl) => {
	var il = Qs(), nl = Object.prototype, cd = nl.hasOwnProperty, dd = nl.toString, Fi = il ? il.toStringTag : void 0;
	function pd(n) {
		var e = cd.call(n, Fi), t = n[Fi];
		try {
			n[Fi] = void 0;
			var r = !0;
		} catch {}
		var i = dd.call(n);
		return r && (e ? n[Fi] = t : delete n[Fi]), i;
	}
	sl.exports = pd;
});
var ul = pe((nv, ol) => {
	var vd = Object.prototype.toString;
	function gd(n) {
		return vd.call(n);
	}
	ol.exports = gd;
});
var cl = pe((sv, fl) => {
	var ll = Qs(), Ed = al(), yd = ul(), bd = "[object Null]", wd = "[object Undefined]", hl = ll ? ll.toStringTag : void 0;
	function _d(n) {
		return n == null ? n === void 0 ? wd : bd : hl && hl in Object(n) ? Ed(n) : yd(n);
	}
	fl.exports = _d;
});
var pl = pe((av, dl) => {
	function xd(n) {
		return n != null && typeof n == "object";
	}
	dl.exports = xd;
});
var vl = pe((ov, ml) => {
	var Dd = cl(), Ad = pl(), Cd = "[object Symbol]";
	function Td(n) {
		return typeof n == "symbol" || Ad(n) && Dd(n) == Cd;
	}
	ml.exports = Td;
});
var bl = pe((uv, yl) => {
	var Sd = tl(), gl = Tn(), Nd = vl(), El = NaN, Id = /^[-+]0x[0-9a-f]+$/i, Od = /^0b[01]+$/i, Rd = /^0o[0-7]+$/i, kd = parseInt;
	function Ld(n) {
		if (typeof n == "number") return n;
		if (Nd(n)) return El;
		if (gl(n)) {
			var e = typeof n.valueOf == "function" ? n.valueOf() : n;
			n = gl(e) ? e + "" : e;
		}
		if (typeof n != "string") return n === 0 ? n : +n;
		n = Sd(n);
		var t = Od.test(n);
		return t || Rd.test(n) ? kd(n.slice(2), t ? 2 : 8) : Id.test(n) ? El : +n;
	}
	yl.exports = Ld;
});
var ea = pe((lv, _l) => {
	var Bd = Tn(), Js = $u(), wl = bl(), Pd = "Expected a function", Fd = Math.max, Md = Math.min;
	function zd(n, e, t) {
		var r, i, s, a, o, l, u = 0, f = !1, c = !1, p = !0;
		if (typeof n != "function") throw new TypeError(Pd);
		e = wl(e) || 0, Bd(t) && (f = !!t.leading, c = "maxWait" in t, s = c ? Fd(wl(t.maxWait) || 0, e) : s, p = "trailing" in t ? !!t.trailing : p);
		function y(E) {
			var A = r, C = i;
			return r = i = void 0, u = E, a = n.apply(C, A), a;
		}
		function _(E) {
			return u = E, o = setTimeout(d, e), f ? y(E) : a;
		}
		function N(E) {
			var A = E - l, C = E - u, R = e - A;
			return c ? Md(R, s - C) : R;
		}
		function I(E) {
			var A = E - l, C = E - u;
			return l === void 0 || A >= e || A < 0 || c && C >= s;
		}
		function d() {
			var E = Js();
			if (I(E)) return v(E);
			o = setTimeout(d, N(E));
		}
		function v(E) {
			return o = void 0, p && r ? y(E) : (r = i = void 0, a);
		}
		function b() {
			o !== void 0 && clearTimeout(o), u = 0, r = l = i = o = void 0;
		}
		function T() {
			return o === void 0 ? a : v(Js());
		}
		function F() {
			var E = Js(), A = I(E);
			if (r = arguments, i = this, l = E, A) {
				if (o === void 0) return _(l);
				if (c) return clearTimeout(o), o = setTimeout(d, e), y(l);
			}
			return o === void 0 && (o = setTimeout(d, e)), a;
		}
		return F.cancel = b, F.flush = T, F;
	}
	_l.exports = zd;
});
var Dl = pe((hv, xl) => {
	var Ud = ea(), qd = Tn(), Wd = "Expected a function";
	function jd(n, e, t) {
		var r = !0, i = !0;
		if (typeof n != "function") throw new TypeError(Wd);
		return qd(t) && (r = "leading" in t ? !!t.leading : r, i = "trailing" in t ? !!t.trailing : i), Ud(n, e, {
			leading: r,
			maxWait: e,
			trailing: i
		});
	}
	xl.exports = jd;
});
var Ll = pe((kl, sa) => {
	(function(n) {
		if (typeof kl == "object" && typeof sa != "undefined") sa.exports = n();
		else if (typeof define == "function" && define.amd) define([], n);
		else {
			var e;
			typeof window != "undefined" ? e = window : typeof global != "undefined" ? e = global : typeof self != "undefined" ? e = self : e = this, e.JSZip = n();
		}
	})(function() {
		return (function r(i, s, a) {
			function o(f, c) {
				if (!s[f]) {
					if (!i[f]) {
						var p = typeof Xt == "function" && Xt;
						if (!c && p) return p(f, !0);
						if (l) return l(f, !0);
						var y = /* @__PURE__ */ new Error("Cannot find module '" + f + "'");
						throw y.code = "MODULE_NOT_FOUND", y;
					}
					var _ = s[f] = { exports: {} };
					i[f][0].call(_.exports, function(N) {
						var I = i[f][1][N];
						return o(I || N);
					}, _, _.exports, r, i, s, a);
				}
				return s[f].exports;
			}
			for (var l = typeof Xt == "function" && Xt, u = 0; u < a.length; u++) o(a[u]);
			return o;
		})({
			1: [function(r, i, s) {
				"use strict";
				var a = r("./utils"), o = r("./support"), l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
				s.encode = function(u) {
					for (var f = [], c, p, y, _, N, I, d, v = 0, b = u.length, T = b, F = a.getTypeOf(u) !== "string"; v < u.length;) T = b - v, F ? (c = u[v++], p = v < b ? u[v++] : 0, y = v < b ? u[v++] : 0) : (c = u.charCodeAt(v++), p = v < b ? u.charCodeAt(v++) : 0, y = v < b ? u.charCodeAt(v++) : 0), _ = c >> 2, N = (c & 3) << 4 | p >> 4, I = T > 1 ? (p & 15) << 2 | y >> 6 : 64, d = T > 2 ? y & 63 : 64, f.push(l.charAt(_) + l.charAt(N) + l.charAt(I) + l.charAt(d));
					return f.join("");
				}, s.decode = function(u) {
					var f, c, p, y, _, N, I, d = 0, v = 0, b = "data:";
					if (u.substr(0, b.length) === b) throw new Error("Invalid base64 input, it looks like a data url.");
					u = u.replace(/[^A-Za-z0-9+/=]/g, "");
					var T = u.length * 3 / 4;
					if (u.charAt(u.length - 1) === l.charAt(64) && T--, u.charAt(u.length - 2) === l.charAt(64) && T--, T % 1 !== 0) throw new Error("Invalid base64 input, bad content length.");
					var F;
					for (o.uint8array ? F = new Uint8Array(T | 0) : F = new Array(T | 0); d < u.length;) y = l.indexOf(u.charAt(d++)), _ = l.indexOf(u.charAt(d++)), N = l.indexOf(u.charAt(d++)), I = l.indexOf(u.charAt(d++)), f = y << 2 | _ >> 4, c = (_ & 15) << 4 | N >> 2, p = (N & 3) << 6 | I, F[v++] = f, N !== 64 && (F[v++] = c), I !== 64 && (F[v++] = p);
					return F;
				};
			}, {
				"./support": 30,
				"./utils": 32
			}],
			2: [function(r, i, s) {
				"use strict";
				var a = r("./external"), o = r("./stream/DataWorker"), l = r("./stream/Crc32Probe"), u = r("./stream/DataLengthProbe");
				function f(c, p, y, _, N) {
					this.compressedSize = c, this.uncompressedSize = p, this.crc32 = y, this.compression = _, this.compressedContent = N;
				}
				f.prototype = {
					getContentWorker: function() {
						var c = new o(a.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new u("data_length")), p = this;
						return c.on("end", function() {
							if (this.streamInfo.data_length !== p.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
						}), c;
					},
					getCompressedWorker: function() {
						return new o(a.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
					}
				}, f.createWorkerFrom = function(c, p, y) {
					return c.pipe(new l()).pipe(new u("uncompressedSize")).pipe(p.compressWorker(y)).pipe(new u("compressedSize")).withStreamInfo("compression", p);
				}, i.exports = f;
			}, {
				"./external": 6,
				"./stream/Crc32Probe": 25,
				"./stream/DataLengthProbe": 26,
				"./stream/DataWorker": 27
			}],
			3: [function(r, i, s) {
				"use strict";
				var a = r("./stream/GenericWorker");
				s.STORE = {
					magic: "\0\0",
					compressWorker: function() {
						return new a("STORE compression");
					},
					uncompressWorker: function() {
						return new a("STORE decompression");
					}
				}, s.DEFLATE = r("./flate");
			}, {
				"./flate": 7,
				"./stream/GenericWorker": 28
			}],
			4: [function(r, i, s) {
				"use strict";
				var a = r("./utils");
				function o() {
					for (var c, p = [], y = 0; y < 256; y++) {
						c = y;
						for (var _ = 0; _ < 8; _++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
						p[y] = c;
					}
					return p;
				}
				var l = o();
				function u(c, p, y, _) {
					var N = l, I = _ + y;
					c = c ^ -1;
					for (var d = _; d < I; d++) c = c >>> 8 ^ N[(c ^ p[d]) & 255];
					return c ^ -1;
				}
				function f(c, p, y, _) {
					var N = l, I = _ + y;
					c = c ^ -1;
					for (var d = _; d < I; d++) c = c >>> 8 ^ N[(c ^ p.charCodeAt(d)) & 255];
					return c ^ -1;
				}
				i.exports = function(p, y) {
					if (typeof p == "undefined" || !p.length) return 0;
					return a.getTypeOf(p) !== "string" ? u(y | 0, p, p.length, 0) : f(y | 0, p, p.length, 0);
				};
			}, { "./utils": 32 }],
			5: [function(r, i, s) {
				"use strict";
				s.base64 = !1, s.binary = !1, s.dir = !1, s.createFolders = !0, s.date = null, s.compression = null, s.compressionOptions = null, s.comment = null, s.unixPermissions = null, s.dosPermissions = null;
			}, {}],
			6: [function(r, i, s) {
				"use strict";
				var a = null;
				typeof Promise != "undefined" ? a = Promise : a = r("lie"), i.exports = { Promise: a };
			}, { lie: 37 }],
			7: [function(r, i, s) {
				"use strict";
				var a = typeof Uint8Array != "undefined" && typeof Uint16Array != "undefined" && typeof Uint32Array != "undefined", o = r("pako"), l = r("./utils"), u = r("./stream/GenericWorker"), f = a ? "uint8array" : "array";
				s.magic = "\b\0";
				function c(p, y) {
					u.call(this, "FlateWorker/" + p), this._pako = null, this._pakoAction = p, this._pakoOptions = y, this.meta = {};
				}
				l.inherits(c, u), c.prototype.processChunk = function(p) {
					this.meta = p.meta, this._pako === null && this._createPako(), this._pako.push(l.transformTo(f, p.data), !1);
				}, c.prototype.flush = function() {
					u.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
				}, c.prototype.cleanUp = function() {
					u.prototype.cleanUp.call(this), this._pako = null;
				}, c.prototype._createPako = function() {
					this._pako = new o[this._pakoAction]({
						raw: !0,
						level: this._pakoOptions.level || -1
					});
					var p = this;
					this._pako.onData = function(y) {
						p.push({
							data: y,
							meta: p.meta
						});
					};
				}, s.compressWorker = function(p) {
					return new c("Deflate", p);
				}, s.uncompressWorker = function() {
					return new c("Inflate", {});
				};
			}, {
				"./stream/GenericWorker": 28,
				"./utils": 32,
				pako: 38
			}],
			8: [function(r, i, s) {
				"use strict";
				var a = r("../utils"), o = r("../stream/GenericWorker"), l = r("../utf8"), u = r("../crc32"), f = r("../signature"), c = function(v, b) {
					var T = "", F;
					for (F = 0; F < b; F++) T += String.fromCharCode(v & 255), v = v >>> 8;
					return T;
				}, p = function(v, b) {
					var T = v;
					return v || (T = b ? 16893 : 33204), (T & 65535) << 16;
				}, y = function(v) {
					return (v || 0) & 63;
				}, _ = function(v, b, T, F, E, A) {
					var C = v.file, R = v.compression, q = A !== l.utf8encode, M = a.transformTo("string", A(C.name)), Z = a.transformTo("string", l.utf8encode(C.name)), V = C.comment, $ = a.transformTo("string", A(V)), me = a.transformTo("string", l.utf8encode(V)), oe = Z.length !== C.name.length, xe = me.length !== V.length, ce, ae, Ae = "", fe = "", be = "", ue = C.dir, Ie = C.date, Le = {
						crc32: 0,
						compressedSize: 0,
						uncompressedSize: 0
					};
					(!b || T) && (Le.crc32 = v.crc32, Le.compressedSize = v.compressedSize, Le.uncompressedSize = v.uncompressedSize);
					var ft = 0;
					b && (ft |= 8), !q && (oe || xe) && (ft |= 2048);
					var it = 0, Ge = 0;
					ue && (it |= 16), E === "UNIX" ? (Ge = 798, it |= p(C.unixPermissions, ue)) : (Ge = 20, it |= y(C.dosPermissions, ue)), ce = Ie.getUTCHours(), ce = ce << 6, ce = ce | Ie.getUTCMinutes(), ce = ce << 5, ce = ce | Ie.getUTCSeconds() / 2, ae = Ie.getUTCFullYear() - 1980, ae = ae << 4, ae = ae | Ie.getUTCMonth() + 1, ae = ae << 5, ae = ae | Ie.getUTCDate(), oe && (fe = c(1, 1) + c(u(M), 4) + Z, Ae += "up" + c(fe.length, 2) + fe), xe && (be = c(1, 1) + c(u($), 4) + me, Ae += "uc" + c(be.length, 2) + be);
					var Te = "";
					Te += `
\0`, Te += c(ft, 2), Te += R.magic, Te += c(ce, 2), Te += c(ae, 2), Te += c(Le.crc32, 4), Te += c(Le.compressedSize, 4), Te += c(Le.uncompressedSize, 4), Te += c(M.length, 2), Te += c(Ae.length, 2);
					return {
						fileRecord: f.LOCAL_FILE_HEADER + Te + M + Ae,
						dirRecord: f.CENTRAL_FILE_HEADER + c(Ge, 2) + Te + c($.length, 2) + "\0\0\0\0" + c(it, 4) + c(F, 4) + M + Ae + $
					};
				}, N = function(v, b, T, F, E) {
					var A = "", C = a.transformTo("string", E(F));
					return A = f.CENTRAL_DIRECTORY_END + "\0\0\0\0" + c(v, 2) + c(v, 2) + c(b, 4) + c(T, 4) + c(C.length, 2) + C, A;
				}, I = function(v) {
					var b = "";
					return b = f.DATA_DESCRIPTOR + c(v.crc32, 4) + c(v.compressedSize, 4) + c(v.uncompressedSize, 4), b;
				};
				function d(v, b, T, F) {
					o.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = b, this.zipPlatform = T, this.encodeFileName = F, this.streamFiles = v, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
				}
				a.inherits(d, o), d.prototype.push = function(v) {
					var b = v.meta.percent || 0, T = this.entriesCount, F = this._sources.length;
					this.accumulate ? this.contentBuffer.push(v) : (this.bytesWritten += v.data.length, o.prototype.push.call(this, {
						data: v.data,
						meta: {
							currentFile: this.currentFile,
							percent: T ? (b + 100 * (T - F - 1)) / T : 100
						}
					}));
				}, d.prototype.openedSource = function(v) {
					this.currentSourceOffset = this.bytesWritten, this.currentFile = v.file.name;
					var b = this.streamFiles && !v.file.dir;
					if (b) {
						var T = _(v, b, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
						this.push({
							data: T.fileRecord,
							meta: { percent: 0 }
						});
					} else this.accumulate = !0;
				}, d.prototype.closedSource = function(v) {
					this.accumulate = !1;
					var b = this.streamFiles && !v.file.dir, T = _(v, b, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
					if (this.dirRecords.push(T.dirRecord), b) this.push({
						data: I(v),
						meta: { percent: 100 }
					});
					else for (this.push({
						data: T.fileRecord,
						meta: { percent: 0 }
					}); this.contentBuffer.length;) this.push(this.contentBuffer.shift());
					this.currentFile = null;
				}, d.prototype.flush = function() {
					for (var v = this.bytesWritten, b = 0; b < this.dirRecords.length; b++) this.push({
						data: this.dirRecords[b],
						meta: { percent: 100 }
					});
					var T = this.bytesWritten - v, F = N(this.dirRecords.length, T, v, this.zipComment, this.encodeFileName);
					this.push({
						data: F,
						meta: { percent: 100 }
					});
				}, d.prototype.prepareNextSource = function() {
					this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
				}, d.prototype.registerPrevious = function(v) {
					this._sources.push(v);
					var b = this;
					return v.on("data", function(T) {
						b.processChunk(T);
					}), v.on("end", function() {
						b.closedSource(b.previous.streamInfo), b._sources.length ? b.prepareNextSource() : b.end();
					}), v.on("error", function(T) {
						b.error(T);
					}), this;
				}, d.prototype.resume = function() {
					if (!o.prototype.resume.call(this)) return !1;
					if (!this.previous && this._sources.length) return this.prepareNextSource(), !0;
					if (!this.previous && !this._sources.length && !this.generatedError) return this.end(), !0;
				}, d.prototype.error = function(v) {
					var b = this._sources;
					if (!o.prototype.error.call(this, v)) return !1;
					for (var T = 0; T < b.length; T++) try {
						b[T].error(v);
					} catch {}
					return !0;
				}, d.prototype.lock = function() {
					o.prototype.lock.call(this);
					for (var v = this._sources, b = 0; b < v.length; b++) v[b].lock();
				}, i.exports = d;
			}, {
				"../crc32": 4,
				"../signature": 23,
				"../stream/GenericWorker": 28,
				"../utf8": 31,
				"../utils": 32
			}],
			9: [function(r, i, s) {
				"use strict";
				var a = r("../compressions"), o = r("./ZipFileWorker"), l = function(u, f) {
					var c = u || f, p = a[c];
					if (!p) throw new Error(c + " is not a valid compression method !");
					return p;
				};
				s.generateWorker = function(u, f, c) {
					var p = new o(f.streamFiles, c, f.platform, f.encodeFileName), y = 0;
					try {
						u.forEach(function(_, N) {
							y++;
							var I = l(N.options.compression, f.compression), d = N.options.compressionOptions || f.compressionOptions || {}, v = N.dir, b = N.date;
							N._compressWorker(I, d).withStreamInfo("file", {
								name: _,
								dir: v,
								date: b,
								comment: N.comment || "",
								unixPermissions: N.unixPermissions,
								dosPermissions: N.dosPermissions
							}).pipe(p);
						}), p.entriesCount = y;
					} catch (_) {
						p.error(_);
					}
					return p;
				};
			}, {
				"../compressions": 3,
				"./ZipFileWorker": 8
			}],
			10: [function(r, i, s) {
				"use strict";
				function a() {
					if (!(this instanceof a)) return new a();
					if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
					this.files = Object.create(null), this.comment = null, this.root = "", this.clone = function() {
						var o = new a();
						for (var l in this) typeof this[l] != "function" && (o[l] = this[l]);
						return o;
					};
				}
				a.prototype = r("./object"), a.prototype.loadAsync = r("./load"), a.support = r("./support"), a.defaults = r("./defaults"), a.version = "3.10.1", a.loadAsync = function(o, l) {
					return new a().loadAsync(o, l);
				}, a.external = r("./external"), i.exports = a;
			}, {
				"./defaults": 5,
				"./external": 6,
				"./load": 11,
				"./object": 15,
				"./support": 30
			}],
			11: [function(r, i, s) {
				"use strict";
				var a = r("./utils"), o = r("./external"), l = r("./utf8"), u = r("./zipEntries"), f = r("./stream/Crc32Probe"), c = r("./nodejsUtils");
				function p(y) {
					return new o.Promise(function(_, N) {
						var I = y.decompressed.getContentWorker().pipe(new f());
						I.on("error", function(d) {
							N(d);
						}).on("end", function() {
							I.streamInfo.crc32 !== y.decompressed.crc32 ? N(/* @__PURE__ */ new Error("Corrupted zip : CRC32 mismatch")) : _();
						}).resume();
					});
				}
				i.exports = function(y, _) {
					var N = this;
					return _ = a.extend(_ || {}, {
						base64: !1,
						checkCRC32: !1,
						optimizedBinaryString: !1,
						createFolders: !1,
						decodeFileName: l.utf8decode
					}), c.isNode && c.isStream(y) ? o.Promise.reject(/* @__PURE__ */ new Error("JSZip can't accept a stream when loading a zip file.")) : a.prepareContent("the loaded zip file", y, !0, _.optimizedBinaryString, _.base64).then(function(I) {
						var d = new u(_);
						return d.load(I), d;
					}).then(function(d) {
						var v = [o.Promise.resolve(d)], b = d.files;
						if (_.checkCRC32) for (var T = 0; T < b.length; T++) v.push(p(b[T]));
						return o.Promise.all(v);
					}).then(function(d) {
						for (var v = d.shift(), b = v.files, T = 0; T < b.length; T++) {
							var F = b[T], E = F.fileNameStr, A = a.resolve(F.fileNameStr);
							N.file(A, F.decompressed, {
								binary: !0,
								optimizedBinaryString: !0,
								date: F.date,
								dir: F.dir,
								comment: F.fileCommentStr.length ? F.fileCommentStr : null,
								unixPermissions: F.unixPermissions,
								dosPermissions: F.dosPermissions,
								createFolders: _.createFolders
							}), F.dir || (N.file(A).unsafeOriginalName = E);
						}
						return v.zipComment.length && (N.comment = v.zipComment), N;
					});
				};
			}, {
				"./external": 6,
				"./nodejsUtils": 14,
				"./stream/Crc32Probe": 25,
				"./utf8": 31,
				"./utils": 32,
				"./zipEntries": 33
			}],
			12: [function(r, i, s) {
				"use strict";
				var a = r("../utils"), o = r("../stream/GenericWorker");
				function l(u, f) {
					o.call(this, "Nodejs stream input adapter for " + u), this._upstreamEnded = !1, this._bindStream(f);
				}
				a.inherits(l, o), l.prototype._bindStream = function(u) {
					var f = this;
					this._stream = u, u.pause(), u.on("data", function(c) {
						f.push({
							data: c,
							meta: { percent: 0 }
						});
					}).on("error", function(c) {
						f.isPaused ? this.generatedError = c : f.error(c);
					}).on("end", function() {
						f.isPaused ? f._upstreamEnded = !0 : f.end();
					});
				}, l.prototype.pause = function() {
					return o.prototype.pause.call(this) ? (this._stream.pause(), !0) : !1;
				}, l.prototype.resume = function() {
					return o.prototype.resume.call(this) ? (this._upstreamEnded ? this.end() : this._stream.resume(), !0) : !1;
				}, i.exports = l;
			}, {
				"../stream/GenericWorker": 28,
				"../utils": 32
			}],
			13: [function(r, i, s) {
				"use strict";
				var a = r("readable-stream").Readable;
				r("../utils").inherits(l, a);
				function l(u, f, c) {
					a.call(this, f), this._helper = u;
					var p = this;
					u.on("data", function(y, _) {
						p.push(y) || p._helper.pause(), c && c(_);
					}).on("error", function(y) {
						p.emit("error", y);
					}).on("end", function() {
						p.push(null);
					});
				}
				l.prototype._read = function() {
					this._helper.resume();
				}, i.exports = l;
			}, {
				"../utils": 32,
				"readable-stream": 16
			}],
			14: [function(r, i, s) {
				"use strict";
				i.exports = {
					isNode: typeof Buffer != "undefined",
					newBufferFrom: function(a, o) {
						if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(a, o);
						if (typeof a == "number") throw new Error("The \"data\" argument must not be a number");
						return new Buffer(a, o);
					},
					allocBuffer: function(a) {
						if (Buffer.alloc) return Buffer.alloc(a);
						var o = new Buffer(a);
						return o.fill(0), o;
					},
					isBuffer: function(a) {
						return Buffer.isBuffer(a);
					},
					isStream: function(a) {
						return a && typeof a.on == "function" && typeof a.pause == "function" && typeof a.resume == "function";
					}
				};
			}, {}],
			15: [function(r, i, s) {
				"use strict";
				var a = r("./utf8"), o = r("./utils"), l = r("./stream/GenericWorker"), u = r("./stream/StreamHelper"), f = r("./defaults"), c = r("./compressedObject"), p = r("./zipObject"), y = r("./generate"), _ = r("./nodejsUtils"), N = r("./nodejs/NodejsStreamInputAdapter"), I = function(E, A, C) {
					var R = o.getTypeOf(A), q, M = o.extend(C || {}, f);
					M.date = M.date || /* @__PURE__ */ new Date(), M.compression !== null && (M.compression = M.compression.toUpperCase()), typeof M.unixPermissions == "string" && (M.unixPermissions = parseInt(M.unixPermissions, 8)), M.unixPermissions && M.unixPermissions & 16384 && (M.dir = !0), M.dosPermissions && M.dosPermissions & 16 && (M.dir = !0), M.dir && (E = v(E)), M.createFolders && (q = d(E)) && b.call(this, q, !0);
					var Z = R === "string" && M.binary === !1 && M.base64 === !1;
					(!C || typeof C.binary == "undefined") && (M.binary = !Z);
					(A instanceof c && A.uncompressedSize === 0 || M.dir || !A || A.length === 0) && (M.base64 = !1, M.binary = !0, A = "", M.compression = "STORE", R = "string");
					var $ = null;
					A instanceof c || A instanceof l ? $ = A : _.isNode && _.isStream(A) ? $ = new N(E, A) : $ = o.prepareContent(E, A, M.binary, M.optimizedBinaryString, M.base64);
					var me = new p(E, $, M);
					this.files[E] = me;
				}, d = function(E) {
					E.slice(-1) === "/" && (E = E.substring(0, E.length - 1));
					var A = E.lastIndexOf("/");
					return A > 0 ? E.substring(0, A) : "";
				}, v = function(E) {
					return E.slice(-1) !== "/" && (E += "/"), E;
				}, b = function(E, A) {
					return A = typeof A != "undefined" ? A : f.createFolders, E = v(E), this.files[E] || I.call(this, E, null, {
						dir: !0,
						createFolders: A
					}), this.files[E];
				};
				function T(E) {
					return Object.prototype.toString.call(E) === "[object RegExp]";
				}
				i.exports = {
					load: function() {
						throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					forEach: function(E) {
						var A, C, R;
						for (A in this.files) R = this.files[A], C = A.slice(this.root.length, A.length), C && A.slice(0, this.root.length) === this.root && E(C, R);
					},
					filter: function(E) {
						var A = [];
						return this.forEach(function(C, R) {
							E(C, R) && A.push(R);
						}), A;
					},
					file: function(E, A, C) {
						if (arguments.length === 1) if (T(E)) {
							var R = E;
							return this.filter(function(M, Z) {
								return !Z.dir && R.test(M);
							});
						} else {
							var q = this.files[this.root + E];
							return q && !q.dir ? q : null;
						}
						else E = this.root + E, I.call(this, E, A, C);
						return this;
					},
					folder: function(E) {
						if (!E) return this;
						if (T(E)) return this.filter(function(q, M) {
							return M.dir && E.test(q);
						});
						var A = this.root + E, C = b.call(this, A), R = this.clone();
						return R.root = C.name, R;
					},
					remove: function(E) {
						E = this.root + E;
						var A = this.files[E];
						if (A || (E.slice(-1) !== "/" && (E += "/"), A = this.files[E]), A && !A.dir) delete this.files[E];
						else for (var C = this.filter(function(q, M) {
							return M.name.slice(0, E.length) === E;
						}), R = 0; R < C.length; R++) delete this.files[C[R].name];
						return this;
					},
					generate: function() {
						throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
					},
					generateInternalStream: function(E) {
						var A, C = {};
						try {
							if (C = o.extend(E || {}, {
								streamFiles: !1,
								compression: "STORE",
								compressionOptions: null,
								type: "",
								platform: "DOS",
								comment: null,
								mimeType: "application/zip",
								encodeFileName: a.utf8encode
							}), C.type = C.type.toLowerCase(), C.compression = C.compression.toUpperCase(), C.type === "binarystring" && (C.type = "string"), !C.type) throw new Error("No output type specified.");
							o.checkSupport(C.type), (C.platform === "darwin" || C.platform === "freebsd" || C.platform === "linux" || C.platform === "sunos") && (C.platform = "UNIX"), C.platform === "win32" && (C.platform = "DOS");
							var R = C.comment || this.comment || "";
							A = y.generateWorker(this, C, R);
						} catch (q) {
							A = new l("error"), A.error(q);
						}
						return new u(A, C.type || "string", C.mimeType);
					},
					generateAsync: function(E, A) {
						return this.generateInternalStream(E).accumulate(A);
					},
					generateNodeStream: function(E, A) {
						return E = E || {}, E.type || (E.type = "nodebuffer"), this.generateInternalStream(E).toNodejsStream(A);
					}
				};
			}, {
				"./compressedObject": 2,
				"./defaults": 5,
				"./generate": 9,
				"./nodejs/NodejsStreamInputAdapter": 12,
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31,
				"./utils": 32,
				"./zipObject": 35
			}],
			16: [function(r, i, s) {
				"use strict";
				i.exports = r("stream");
			}, { stream: void 0 }],
			17: [function(r, i, s) {
				"use strict";
				var a = r("./DataReader"), o = r("../utils");
				function l(u) {
					a.call(this, u);
					for (var f = 0; f < this.data.length; f++) u[f] = u[f] & 255;
				}
				o.inherits(l, a), l.prototype.byteAt = function(u) {
					return this.data[this.zero + u];
				}, l.prototype.lastIndexOfSignature = function(u) {
					for (var f = u.charCodeAt(0), c = u.charCodeAt(1), p = u.charCodeAt(2), y = u.charCodeAt(3), _ = this.length - 4; _ >= 0; --_) if (this.data[_] === f && this.data[_ + 1] === c && this.data[_ + 2] === p && this.data[_ + 3] === y) return _ - this.zero;
					return -1;
				}, l.prototype.readAndCheckSignature = function(u) {
					var f = u.charCodeAt(0), c = u.charCodeAt(1), p = u.charCodeAt(2), y = u.charCodeAt(3), _ = this.readData(4);
					return f === _[0] && c === _[1] && p === _[2] && y === _[3];
				}, l.prototype.readData = function(u) {
					if (this.checkOffset(u), u === 0) return [];
					var f = this.data.slice(this.zero + this.index, this.zero + this.index + u);
					return this.index += u, f;
				}, i.exports = l;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			18: [function(r, i, s) {
				"use strict";
				var a = r("../utils");
				function o(l) {
					this.data = l, this.length = l.length, this.index = 0, this.zero = 0;
				}
				o.prototype = {
					checkOffset: function(l) {
						this.checkIndex(this.index + l);
					},
					checkIndex: function(l) {
						if (this.length < this.zero + l || l < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + l + "). Corrupted zip ?");
					},
					setIndex: function(l) {
						this.checkIndex(l), this.index = l;
					},
					skip: function(l) {
						this.setIndex(this.index + l);
					},
					byteAt: function() {},
					readInt: function(l) {
						var u = 0, f;
						for (this.checkOffset(l), f = this.index + l - 1; f >= this.index; f--) u = (u << 8) + this.byteAt(f);
						return this.index += l, u;
					},
					readString: function(l) {
						return a.transformTo("string", this.readData(l));
					},
					readData: function() {},
					lastIndexOfSignature: function() {},
					readAndCheckSignature: function() {},
					readDate: function() {
						var l = this.readInt(4);
						return new Date(Date.UTC((l >> 25 & 127) + 1980, (l >> 21 & 15) - 1, l >> 16 & 31, l >> 11 & 31, l >> 5 & 63, (l & 31) << 1));
					}
				}, i.exports = o;
			}, { "../utils": 32 }],
			19: [function(r, i, s) {
				"use strict";
				var a = r("./Uint8ArrayReader"), o = r("../utils");
				function l(u) {
					a.call(this, u);
				}
				o.inherits(l, a), l.prototype.readData = function(u) {
					this.checkOffset(u);
					var f = this.data.slice(this.zero + this.index, this.zero + this.index + u);
					return this.index += u, f;
				}, i.exports = l;
			}, {
				"../utils": 32,
				"./Uint8ArrayReader": 21
			}],
			20: [function(r, i, s) {
				"use strict";
				var a = r("./DataReader"), o = r("../utils");
				function l(u) {
					a.call(this, u);
				}
				o.inherits(l, a), l.prototype.byteAt = function(u) {
					return this.data.charCodeAt(this.zero + u);
				}, l.prototype.lastIndexOfSignature = function(u) {
					return this.data.lastIndexOf(u) - this.zero;
				}, l.prototype.readAndCheckSignature = function(u) {
					return u === this.readData(4);
				}, l.prototype.readData = function(u) {
					this.checkOffset(u);
					var f = this.data.slice(this.zero + this.index, this.zero + this.index + u);
					return this.index += u, f;
				}, i.exports = l;
			}, {
				"../utils": 32,
				"./DataReader": 18
			}],
			21: [function(r, i, s) {
				"use strict";
				var a = r("./ArrayReader"), o = r("../utils");
				function l(u) {
					a.call(this, u);
				}
				o.inherits(l, a), l.prototype.readData = function(u) {
					if (this.checkOffset(u), u === 0) return /* @__PURE__ */ new Uint8Array(0);
					var f = this.data.subarray(this.zero + this.index, this.zero + this.index + u);
					return this.index += u, f;
				}, i.exports = l;
			}, {
				"../utils": 32,
				"./ArrayReader": 17
			}],
			22: [function(r, i, s) {
				"use strict";
				var a = r("../utils"), o = r("../support"), l = r("./ArrayReader"), u = r("./StringReader"), f = r("./NodeBufferReader"), c = r("./Uint8ArrayReader");
				i.exports = function(p) {
					var y = a.getTypeOf(p);
					return a.checkSupport(y), y === "string" && !o.uint8array ? new u(p) : y === "nodebuffer" ? new f(p) : o.uint8array ? new c(a.transformTo("uint8array", p)) : new l(a.transformTo("array", p));
				};
			}, {
				"../support": 30,
				"../utils": 32,
				"./ArrayReader": 17,
				"./NodeBufferReader": 19,
				"./StringReader": 20,
				"./Uint8ArrayReader": 21
			}],
			23: [function(r, i, s) {
				"use strict";
				s.LOCAL_FILE_HEADER = "PK", s.CENTRAL_FILE_HEADER = "PK", s.CENTRAL_DIRECTORY_END = "PK", s.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", s.ZIP64_CENTRAL_DIRECTORY_END = "PK", s.DATA_DESCRIPTOR = "PK\x07\b";
			}, {}],
			24: [function(r, i, s) {
				"use strict";
				var a = r("./GenericWorker"), o = r("../utils");
				function l(u) {
					a.call(this, "ConvertWorker to " + u), this.destType = u;
				}
				o.inherits(l, a), l.prototype.processChunk = function(u) {
					this.push({
						data: o.transformTo(this.destType, u.data),
						meta: u.meta
					});
				}, i.exports = l;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			25: [function(r, i, s) {
				"use strict";
				var a = r("./GenericWorker"), o = r("../crc32"), l = r("../utils");
				function u() {
					a.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
				}
				l.inherits(u, a), u.prototype.processChunk = function(f) {
					this.streamInfo.crc32 = o(f.data, this.streamInfo.crc32 || 0), this.push(f);
				}, i.exports = u;
			}, {
				"../crc32": 4,
				"../utils": 32,
				"./GenericWorker": 28
			}],
			26: [function(r, i, s) {
				"use strict";
				var a = r("../utils"), o = r("./GenericWorker");
				function l(u) {
					o.call(this, "DataLengthProbe for " + u), this.propName = u, this.withStreamInfo(u, 0);
				}
				a.inherits(l, o), l.prototype.processChunk = function(u) {
					if (u) {
						var f = this.streamInfo[this.propName] || 0;
						this.streamInfo[this.propName] = f + u.data.length;
					}
					o.prototype.processChunk.call(this, u);
				}, i.exports = l;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			27: [function(r, i, s) {
				"use strict";
				var a = r("../utils"), o = r("./GenericWorker"), l = 16384;
				function u(f) {
					o.call(this, "DataWorker");
					var c = this;
					this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, f.then(function(p) {
						c.dataIsReady = !0, c.data = p, c.max = p && p.length || 0, c.type = a.getTypeOf(p), c.isPaused || c._tickAndRepeat();
					}, function(p) {
						c.error(p);
					});
				}
				a.inherits(u, o), u.prototype.cleanUp = function() {
					o.prototype.cleanUp.call(this), this.data = null;
				}, u.prototype.resume = function() {
					return o.prototype.resume.call(this) ? (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, a.delay(this._tickAndRepeat, [], this)), !0) : !1;
				}, u.prototype._tickAndRepeat = function() {
					this._tickScheduled = !1, !(this.isPaused || this.isFinished) && (this._tick(), this.isFinished || (a.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
				}, u.prototype._tick = function() {
					if (this.isPaused || this.isFinished) return !1;
					var f = l, c = null, p = Math.min(this.max, this.index + f);
					if (this.index >= this.max) return this.end();
					switch (this.type) {
						case "string":
							c = this.data.substring(this.index, p);
							break;
						case "uint8array":
							c = this.data.subarray(this.index, p);
							break;
						case "array":
						case "nodebuffer": c = this.data.slice(this.index, p);
					}
					return this.index = p, this.push({
						data: c,
						meta: { percent: this.max ? this.index / this.max * 100 : 0 }
					});
				}, i.exports = u;
			}, {
				"../utils": 32,
				"./GenericWorker": 28
			}],
			28: [function(r, i, s) {
				"use strict";
				function a(o) {
					this.name = o || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = {
						data: [],
						end: [],
						error: []
					}, this.previous = null;
				}
				a.prototype = {
					push: function(o) {
						this.emit("data", o);
					},
					end: function() {
						if (this.isFinished) return !1;
						this.flush();
						try {
							this.emit("end"), this.cleanUp(), this.isFinished = !0;
						} catch (o) {
							this.emit("error", o);
						}
						return !0;
					},
					error: function(o) {
						return this.isFinished ? !1 : (this.isPaused ? this.generatedError = o : (this.isFinished = !0, this.emit("error", o), this.previous && this.previous.error(o), this.cleanUp()), !0);
					},
					on: function(o, l) {
						return this._listeners[o].push(l), this;
					},
					cleanUp: function() {
						this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
					},
					emit: function(o, l) {
						if (this._listeners[o]) for (var u = 0; u < this._listeners[o].length; u++) this._listeners[o][u].call(this, l);
					},
					pipe: function(o) {
						return o.registerPrevious(this);
					},
					registerPrevious: function(o) {
						if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
						this.streamInfo = o.streamInfo, this.mergeStreamInfo(), this.previous = o;
						var l = this;
						return o.on("data", function(u) {
							l.processChunk(u);
						}), o.on("end", function() {
							l.end();
						}), o.on("error", function(u) {
							l.error(u);
						}), this;
					},
					pause: function() {
						return this.isPaused || this.isFinished ? !1 : (this.isPaused = !0, this.previous && this.previous.pause(), !0);
					},
					resume: function() {
						if (!this.isPaused || this.isFinished) return !1;
						this.isPaused = !1;
						var o = !1;
						return this.generatedError && (this.error(this.generatedError), o = !0), this.previous && this.previous.resume(), !o;
					},
					flush: function() {},
					processChunk: function(o) {
						this.push(o);
					},
					withStreamInfo: function(o, l) {
						return this.extraStreamInfo[o] = l, this.mergeStreamInfo(), this;
					},
					mergeStreamInfo: function() {
						for (var o in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, o) && (this.streamInfo[o] = this.extraStreamInfo[o]);
					},
					lock: function() {
						if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
						this.isLocked = !0, this.previous && this.previous.lock();
					},
					toString: function() {
						var o = "Worker " + this.name;
						return this.previous ? this.previous + " -> " + o : o;
					}
				}, i.exports = a;
			}, {}],
			29: [function(r, i, s) {
				"use strict";
				var a = r("../utils"), o = r("./ConvertWorker"), l = r("./GenericWorker"), u = r("../base64"), f = r("../support"), c = r("../external"), p = null;
				if (f.nodestream) try {
					p = r("../nodejs/NodejsStreamOutputAdapter");
				} catch {}
				function y(d, v, b) {
					switch (d) {
						case "blob": return a.newBlob(a.transformTo("arraybuffer", v), b);
						case "base64": return u.encode(v);
						default: return a.transformTo(d, v);
					}
				}
				function _(d, v) {
					var b, T = 0, F = null, E = 0;
					for (b = 0; b < v.length; b++) E += v[b].length;
					switch (d) {
						case "string": return v.join("");
						case "array": return Array.prototype.concat.apply([], v);
						case "uint8array":
							for (F = new Uint8Array(E), b = 0; b < v.length; b++) F.set(v[b], T), T += v[b].length;
							return F;
						case "nodebuffer": return Buffer.concat(v);
						default: throw new Error("concat : unsupported type '" + d + "'");
					}
				}
				function N(d, v) {
					return new c.Promise(function(b, T) {
						var F = [], E = d._internalType, A = d._outputType, C = d._mimeType;
						d.on("data", function(R, q) {
							F.push(R), v && v(q);
						}).on("error", function(R) {
							F = [], T(R);
						}).on("end", function() {
							try {
								b(y(A, _(E, F), C));
							} catch (q) {
								T(q);
							}
							F = [];
						}).resume();
					});
				}
				function I(d, v, b) {
					var T = v;
					switch (v) {
						case "blob":
						case "arraybuffer":
							T = "uint8array";
							break;
						case "base64": T = "string";
					}
					try {
						this._internalType = T, this._outputType = v, this._mimeType = b, a.checkSupport(T), this._worker = d.pipe(new o(T)), d.lock();
					} catch (F) {
						this._worker = new l("error"), this._worker.error(F);
					}
				}
				I.prototype = {
					accumulate: function(d) {
						return N(this, d);
					},
					on: function(d, v) {
						var b = this;
						return d === "data" ? this._worker.on(d, function(T) {
							v.call(b, T.data, T.meta);
						}) : this._worker.on(d, function() {
							a.delay(v, arguments, b);
						}), this;
					},
					resume: function() {
						return a.delay(this._worker.resume, [], this._worker), this;
					},
					pause: function() {
						return this._worker.pause(), this;
					},
					toNodejsStream: function(d) {
						if (a.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
						return new p(this, { objectMode: this._outputType !== "nodebuffer" }, d);
					}
				}, i.exports = I;
			}, {
				"../base64": 1,
				"../external": 6,
				"../nodejs/NodejsStreamOutputAdapter": 13,
				"../support": 30,
				"../utils": 32,
				"./ConvertWorker": 24,
				"./GenericWorker": 28
			}],
			30: [function(r, i, s) {
				"use strict";
				if (s.base64 = !0, s.array = !0, s.string = !0, s.arraybuffer = typeof ArrayBuffer != "undefined" && typeof Uint8Array != "undefined", s.nodebuffer = typeof Buffer != "undefined", s.uint8array = typeof Uint8Array != "undefined", typeof ArrayBuffer == "undefined") s.blob = !1;
				else {
					var a = /* @__PURE__ */ new ArrayBuffer(0);
					try {
						s.blob = new Blob([a], { type: "application/zip" }).size === 0;
					} catch {
						try {
							var l = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
							l.append(a), s.blob = l.getBlob("application/zip").size === 0;
						} catch {
							s.blob = !1;
						}
					}
				}
				try {
					s.nodestream = !!r("readable-stream").Readable;
				} catch {
					s.nodestream = !1;
				}
			}, { "readable-stream": 16 }],
			31: [function(r, i, s) {
				"use strict";
				for (var a = r("./utils"), o = r("./support"), l = r("./nodejsUtils"), u = r("./stream/GenericWorker"), f = new Array(256), c = 0; c < 256; c++) f[c] = c >= 252 ? 6 : c >= 248 ? 5 : c >= 240 ? 4 : c >= 224 ? 3 : c >= 192 ? 2 : 1;
				f[254] = f[254] = 1;
				var p = function(d) {
					var v, b, T, F, E, A = d.length, C = 0;
					for (F = 0; F < A; F++) b = d.charCodeAt(F), (b & 64512) === 55296 && F + 1 < A && (T = d.charCodeAt(F + 1), (T & 64512) === 56320 && (b = 65536 + (b - 55296 << 10) + (T - 56320), F++)), C += b < 128 ? 1 : b < 2048 ? 2 : b < 65536 ? 3 : 4;
					for (o.uint8array ? v = new Uint8Array(C) : v = new Array(C), E = 0, F = 0; E < C; F++) b = d.charCodeAt(F), (b & 64512) === 55296 && F + 1 < A && (T = d.charCodeAt(F + 1), (T & 64512) === 56320 && (b = 65536 + (b - 55296 << 10) + (T - 56320), F++)), b < 128 ? v[E++] = b : b < 2048 ? (v[E++] = 192 | b >>> 6, v[E++] = 128 | b & 63) : b < 65536 ? (v[E++] = 224 | b >>> 12, v[E++] = 128 | b >>> 6 & 63, v[E++] = 128 | b & 63) : (v[E++] = 240 | b >>> 18, v[E++] = 128 | b >>> 12 & 63, v[E++] = 128 | b >>> 6 & 63, v[E++] = 128 | b & 63);
					return v;
				}, y = function(d, v) {
					var b;
					for (v = v || d.length, v > d.length && (v = d.length), b = v - 1; b >= 0 && (d[b] & 192) === 128;) b--;
					return b < 0 || b === 0 ? v : b + f[d[b]] > v ? b : v;
				}, _ = function(d) {
					var v, b, T, F, E = d.length, A = new Array(E * 2);
					for (b = 0, v = 0; v < E;) {
						if (T = d[v++], T < 128) {
							A[b++] = T;
							continue;
						}
						if (F = f[T], F > 4) {
							A[b++] = 65533, v += F - 1;
							continue;
						}
						for (T &= F === 2 ? 31 : F === 3 ? 15 : 7; F > 1 && v < E;) T = T << 6 | d[v++] & 63, F--;
						if (F > 1) {
							A[b++] = 65533;
							continue;
						}
						T < 65536 ? A[b++] = T : (T -= 65536, A[b++] = 55296 | T >> 10 & 1023, A[b++] = 56320 | T & 1023);
					}
					return A.length !== b && (A.subarray ? A = A.subarray(0, b) : A.length = b), a.applyFromCharCode(A);
				};
				s.utf8encode = function(v) {
					return o.nodebuffer ? l.newBufferFrom(v, "utf-8") : p(v);
				}, s.utf8decode = function(v) {
					return o.nodebuffer ? a.transformTo("nodebuffer", v).toString("utf-8") : (v = a.transformTo(o.uint8array ? "uint8array" : "array", v), _(v));
				};
				function N() {
					u.call(this, "utf-8 decode"), this.leftOver = null;
				}
				a.inherits(N, u), N.prototype.processChunk = function(d) {
					var v = a.transformTo(o.uint8array ? "uint8array" : "array", d.data);
					if (this.leftOver && this.leftOver.length) {
						if (o.uint8array) {
							var b = v;
							v = new Uint8Array(b.length + this.leftOver.length), v.set(this.leftOver, 0), v.set(b, this.leftOver.length);
						} else v = this.leftOver.concat(v);
						this.leftOver = null;
					}
					var T = y(v), F = v;
					T !== v.length && (o.uint8array ? (F = v.subarray(0, T), this.leftOver = v.subarray(T, v.length)) : (F = v.slice(0, T), this.leftOver = v.slice(T, v.length))), this.push({
						data: s.utf8decode(F),
						meta: d.meta
					});
				}, N.prototype.flush = function() {
					this.leftOver && this.leftOver.length && (this.push({
						data: s.utf8decode(this.leftOver),
						meta: {}
					}), this.leftOver = null);
				}, s.Utf8DecodeWorker = N;
				function I() {
					u.call(this, "utf-8 encode");
				}
				a.inherits(I, u), I.prototype.processChunk = function(d) {
					this.push({
						data: s.utf8encode(d.data),
						meta: d.meta
					});
				}, s.Utf8EncodeWorker = I;
			}, {
				"./nodejsUtils": 14,
				"./stream/GenericWorker": 28,
				"./support": 30,
				"./utils": 32
			}],
			32: [function(r, i, s) {
				"use strict";
				var a = r("./support"), o = r("./base64"), l = r("./nodejsUtils"), u = r("./external");
				r("setimmediate");
				function f(d) {
					var v = null;
					return a.uint8array ? v = new Uint8Array(d.length) : v = new Array(d.length), p(d, v);
				}
				s.newBlob = function(d, v) {
					s.checkSupport("blob");
					try {
						return new Blob([d], { type: v });
					} catch {
						try {
							var T = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
							return T.append(d), T.getBlob(v);
						} catch {
							throw new Error("Bug : can't construct the Blob.");
						}
					}
				};
				function c(d) {
					return d;
				}
				function p(d, v) {
					for (var b = 0; b < d.length; ++b) v[b] = d.charCodeAt(b) & 255;
					return v;
				}
				var y = {
					stringifyByChunk: function(d, v, b) {
						var T = [], F = 0, E = d.length;
						if (E <= b) return String.fromCharCode.apply(null, d);
						for (; F < E;) v === "array" || v === "nodebuffer" ? T.push(String.fromCharCode.apply(null, d.slice(F, Math.min(F + b, E)))) : T.push(String.fromCharCode.apply(null, d.subarray(F, Math.min(F + b, E)))), F += b;
						return T.join("");
					},
					stringifyByChar: function(d) {
						for (var v = "", b = 0; b < d.length; b++) v += String.fromCharCode(d[b]);
						return v;
					},
					applyCanBeUsed: {
						uint8array: (function() {
							try {
								return a.uint8array && String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1)).length === 1;
							} catch {
								return !1;
							}
						})(),
						nodebuffer: (function() {
							try {
								return a.nodebuffer && String.fromCharCode.apply(null, l.allocBuffer(1)).length === 1;
							} catch {
								return !1;
							}
						})()
					}
				};
				function _(d) {
					var v = 65536, b = s.getTypeOf(d), T = !0;
					if (b === "uint8array" ? T = y.applyCanBeUsed.uint8array : b === "nodebuffer" && (T = y.applyCanBeUsed.nodebuffer), T) for (; v > 1;) try {
						return y.stringifyByChunk(d, b, v);
					} catch {
						v = Math.floor(v / 2);
					}
					return y.stringifyByChar(d);
				}
				s.applyFromCharCode = _;
				function N(d, v) {
					for (var b = 0; b < d.length; b++) v[b] = d[b];
					return v;
				}
				var I = {};
				I.string = {
					string: c,
					array: function(d) {
						return p(d, new Array(d.length));
					},
					arraybuffer: function(d) {
						return I.string.uint8array(d).buffer;
					},
					uint8array: function(d) {
						return p(d, new Uint8Array(d.length));
					},
					nodebuffer: function(d) {
						return p(d, l.allocBuffer(d.length));
					}
				}, I.array = {
					string: _,
					array: c,
					arraybuffer: function(d) {
						return new Uint8Array(d).buffer;
					},
					uint8array: function(d) {
						return new Uint8Array(d);
					},
					nodebuffer: function(d) {
						return l.newBufferFrom(d);
					}
				}, I.arraybuffer = {
					string: function(d) {
						return _(new Uint8Array(d));
					},
					array: function(d) {
						return N(new Uint8Array(d), new Array(d.byteLength));
					},
					arraybuffer: c,
					uint8array: function(d) {
						return new Uint8Array(d);
					},
					nodebuffer: function(d) {
						return l.newBufferFrom(new Uint8Array(d));
					}
				}, I.uint8array = {
					string: _,
					array: function(d) {
						return N(d, new Array(d.length));
					},
					arraybuffer: function(d) {
						return d.buffer;
					},
					uint8array: c,
					nodebuffer: function(d) {
						return l.newBufferFrom(d);
					}
				}, I.nodebuffer = {
					string: _,
					array: function(d) {
						return N(d, new Array(d.length));
					},
					arraybuffer: function(d) {
						return I.nodebuffer.uint8array(d).buffer;
					},
					uint8array: function(d) {
						return N(d, new Uint8Array(d.length));
					},
					nodebuffer: c
				}, s.transformTo = function(d, v) {
					if (v || (v = ""), !d) return v;
					s.checkSupport(d);
					return I[s.getTypeOf(v)][d](v);
				}, s.resolve = function(d) {
					for (var v = d.split("/"), b = [], T = 0; T < v.length; T++) {
						var F = v[T];
						F === "." || F === "" && T !== 0 && T !== v.length - 1 || (F === ".." ? b.pop() : b.push(F));
					}
					return b.join("/");
				}, s.getTypeOf = function(d) {
					if (typeof d == "string") return "string";
					if (Object.prototype.toString.call(d) === "[object Array]") return "array";
					if (a.nodebuffer && l.isBuffer(d)) return "nodebuffer";
					if (a.uint8array && d instanceof Uint8Array) return "uint8array";
					if (a.arraybuffer && d instanceof ArrayBuffer) return "arraybuffer";
				}, s.checkSupport = function(d) {
					if (!a[d.toLowerCase()]) throw new Error(d + " is not supported by this platform");
				}, s.MAX_VALUE_16BITS = 65535, s.MAX_VALUE_32BITS = -1, s.pretty = function(d) {
					var v = "", b, T;
					for (T = 0; T < (d || "").length; T++) b = d.charCodeAt(T), v += "\\x" + (b < 16 ? "0" : "") + b.toString(16).toUpperCase();
					return v;
				}, s.delay = function(d, v, b) {
					setImmediate(function() {
						d.apply(b || null, v || []);
					});
				}, s.inherits = function(d, v) {
					var b = function() {};
					b.prototype = v.prototype, d.prototype = new b();
				}, s.extend = function() {
					var d = {}, v, b;
					for (v = 0; v < arguments.length; v++) for (b in arguments[v]) Object.prototype.hasOwnProperty.call(arguments[v], b) && typeof d[b] == "undefined" && (d[b] = arguments[v][b]);
					return d;
				}, s.prepareContent = function(d, v, b, T, F) {
					return u.Promise.resolve(v).then(function(A) {
						return a.blob && (A instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(A)) !== -1) && typeof FileReader != "undefined" ? new u.Promise(function(R, q) {
							var M = new FileReader();
							M.onload = function(Z) {
								R(Z.target.result);
							}, M.onerror = function(Z) {
								q(Z.target.error);
							}, M.readAsArrayBuffer(A);
						}) : A;
					}).then(function(A) {
						var C = s.getTypeOf(A);
						return C ? (C === "arraybuffer" ? A = s.transformTo("uint8array", A) : C === "string" && (F ? A = o.decode(A) : b && T !== !0 && (A = f(A))), A) : u.Promise.reject(/* @__PURE__ */ new Error("Can't read the data of '" + d + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
					});
				};
			}, {
				"./base64": 1,
				"./external": 6,
				"./nodejsUtils": 14,
				"./support": 30,
				setimmediate: 54
			}],
			33: [function(r, i, s) {
				"use strict";
				var a = r("./reader/readerFor"), o = r("./utils"), l = r("./signature"), u = r("./zipEntry"), f = r("./support");
				function c(p) {
					this.files = [], this.loadOptions = p;
				}
				c.prototype = {
					checkSignature: function(p) {
						if (!this.reader.readAndCheckSignature(p)) {
							this.reader.index -= 4;
							var y = this.reader.readString(4);
							throw new Error("Corrupted zip or bug: unexpected signature (" + o.pretty(y) + ", expected " + o.pretty(p) + ")");
						}
					},
					isSignature: function(p, y) {
						var _ = this.reader.index;
						this.reader.setIndex(p);
						var I = this.reader.readString(4) === y;
						return this.reader.setIndex(_), I;
					},
					readBlockEndOfCentral: function() {
						this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
						var p = this.reader.readData(this.zipCommentLength), y = f.uint8array ? "uint8array" : "array", _ = o.transformTo(y, p);
						this.zipComment = this.loadOptions.decodeFileName(_);
					},
					readBlockZip64EndOfCentral: function() {
						this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
						for (var p = this.zip64EndOfCentralSize - 44, y = 0, _, N, I; y < p;) _ = this.reader.readInt(2), N = this.reader.readInt(4), I = this.reader.readData(N), this.zip64ExtensibleData[_] = {
							id: _,
							length: N,
							value: I
						};
					},
					readBlockZip64EndOfCentralLocator: function() {
						if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), this.disksCount > 1) throw new Error("Multi-volumes zip are not supported");
					},
					readLocalFiles: function() {
						var p, y;
						for (p = 0; p < this.files.length; p++) y = this.files[p], this.reader.setIndex(y.localHeaderOffset), this.checkSignature(l.LOCAL_FILE_HEADER), y.readLocalPart(this.reader), y.handleUTF8(), y.processAttributes();
					},
					readCentralDir: function() {
						var p;
						for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(l.CENTRAL_FILE_HEADER);) p = new u({ zip64: this.zip64 }, this.loadOptions), p.readCentralPart(this.reader), this.files.push(p);
						if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
					},
					readEndOfCentral: function() {
						var p = this.reader.lastIndexOfSignature(l.CENTRAL_DIRECTORY_END);
						if (p < 0) throw !this.isSignature(0, l.LOCAL_FILE_HEADER) ? /* @__PURE__ */ new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : /* @__PURE__ */ new Error("Corrupted zip: can't find end of central directory");
						this.reader.setIndex(p);
						var _ = p;
						if (this.checkSignature(l.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === o.MAX_VALUE_16BITS || this.diskWithCentralDirStart === o.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === o.MAX_VALUE_16BITS || this.centralDirRecords === o.MAX_VALUE_16BITS || this.centralDirSize === o.MAX_VALUE_32BITS || this.centralDirOffset === o.MAX_VALUE_32BITS) {
							if (this.zip64 = !0, p = this.reader.lastIndexOfSignature(l.ZIP64_CENTRAL_DIRECTORY_LOCATOR), p < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
							if (this.reader.setIndex(p), this.checkSignature(l.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, l.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(l.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
							this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(l.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
						}
						var N = this.centralDirOffset + this.centralDirSize;
						this.zip64 && (N += 20, N += 12 + this.zip64EndOfCentralSize);
						var I = _ - N;
						if (I > 0) this.isSignature(_, l.CENTRAL_FILE_HEADER) || (this.reader.zero = I);
						else if (I < 0) throw new Error("Corrupted zip: missing " + Math.abs(I) + " bytes.");
					},
					prepareReader: function(p) {
						this.reader = a(p);
					},
					load: function(p) {
						this.prepareReader(p), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
					}
				}, i.exports = c;
			}, {
				"./reader/readerFor": 22,
				"./signature": 23,
				"./support": 30,
				"./utils": 32,
				"./zipEntry": 34
			}],
			34: [function(r, i, s) {
				"use strict";
				var a = r("./reader/readerFor"), o = r("./utils"), l = r("./compressedObject"), u = r("./crc32"), f = r("./utf8"), c = r("./compressions"), p = r("./support"), y = 0, _ = 3, N = function(d) {
					for (var v in c) if (Object.prototype.hasOwnProperty.call(c, v) && c[v].magic === d) return c[v];
					return null;
				};
				function I(d, v) {
					this.options = d, this.loadOptions = v;
				}
				I.prototype = {
					isEncrypted: function() {
						return (this.bitFlag & 1) === 1;
					},
					useUTF8: function() {
						return (this.bitFlag & 2048) === 2048;
					},
					readLocalPart: function(d) {
						var v, b;
						if (d.skip(22), this.fileNameLength = d.readInt(2), b = d.readInt(2), this.fileName = d.readData(this.fileNameLength), d.skip(b), this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
						if (v = N(this.compressionMethod), v === null) throw new Error("Corrupted zip : compression " + o.pretty(this.compressionMethod) + " unknown (inner file : " + o.transformTo("string", this.fileName) + ")");
						this.decompressed = new l(this.compressedSize, this.uncompressedSize, this.crc32, v, d.readData(this.compressedSize));
					},
					readCentralPart: function(d) {
						this.versionMadeBy = d.readInt(2), d.skip(2), this.bitFlag = d.readInt(2), this.compressionMethod = d.readString(2), this.date = d.readDate(), this.crc32 = d.readInt(4), this.compressedSize = d.readInt(4), this.uncompressedSize = d.readInt(4);
						var v = d.readInt(2);
						if (this.extraFieldsLength = d.readInt(2), this.fileCommentLength = d.readInt(2), this.diskNumberStart = d.readInt(2), this.internalFileAttributes = d.readInt(2), this.externalFileAttributes = d.readInt(4), this.localHeaderOffset = d.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
						d.skip(v), this.readExtraFields(d), this.parseZIP64ExtraField(d), this.fileComment = d.readData(this.fileCommentLength);
					},
					processAttributes: function() {
						this.unixPermissions = null, this.dosPermissions = null;
						var d = this.versionMadeBy >> 8;
						this.dir = !!(this.externalFileAttributes & 16), d === y && (this.dosPermissions = this.externalFileAttributes & 63), d === _ && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), !this.dir && this.fileNameStr.slice(-1) === "/" && (this.dir = !0);
					},
					parseZIP64ExtraField: function() {
						if (this.extraFields[1]) {
							var d = a(this.extraFields[1].value);
							this.uncompressedSize === o.MAX_VALUE_32BITS && (this.uncompressedSize = d.readInt(8)), this.compressedSize === o.MAX_VALUE_32BITS && (this.compressedSize = d.readInt(8)), this.localHeaderOffset === o.MAX_VALUE_32BITS && (this.localHeaderOffset = d.readInt(8)), this.diskNumberStart === o.MAX_VALUE_32BITS && (this.diskNumberStart = d.readInt(4));
						}
					},
					readExtraFields: function(d) {
						var v = d.index + this.extraFieldsLength, b, T, F;
						for (this.extraFields || (this.extraFields = {}); d.index + 4 < v;) b = d.readInt(2), T = d.readInt(2), F = d.readData(T), this.extraFields[b] = {
							id: b,
							length: T,
							value: F
						};
						d.setIndex(v);
					},
					handleUTF8: function() {
						var d = p.uint8array ? "uint8array" : "array";
						if (this.useUTF8()) this.fileNameStr = f.utf8decode(this.fileName), this.fileCommentStr = f.utf8decode(this.fileComment);
						else {
							var v = this.findExtraFieldUnicodePath();
							if (v !== null) this.fileNameStr = v;
							else {
								var b = o.transformTo(d, this.fileName);
								this.fileNameStr = this.loadOptions.decodeFileName(b);
							}
							var T = this.findExtraFieldUnicodeComment();
							if (T !== null) this.fileCommentStr = T;
							else {
								var F = o.transformTo(d, this.fileComment);
								this.fileCommentStr = this.loadOptions.decodeFileName(F);
							}
						}
					},
					findExtraFieldUnicodePath: function() {
						var d = this.extraFields[28789];
						if (d) {
							var v = a(d.value);
							return v.readInt(1) !== 1 || u(this.fileName) !== v.readInt(4) ? null : f.utf8decode(v.readData(d.length - 5));
						}
						return null;
					},
					findExtraFieldUnicodeComment: function() {
						var d = this.extraFields[25461];
						if (d) {
							var v = a(d.value);
							return v.readInt(1) !== 1 || u(this.fileComment) !== v.readInt(4) ? null : f.utf8decode(v.readData(d.length - 5));
						}
						return null;
					}
				}, i.exports = I;
			}, {
				"./compressedObject": 2,
				"./compressions": 3,
				"./crc32": 4,
				"./reader/readerFor": 22,
				"./support": 30,
				"./utf8": 31,
				"./utils": 32
			}],
			35: [function(r, i, s) {
				"use strict";
				var a = r("./stream/StreamHelper"), o = r("./stream/DataWorker"), l = r("./utf8"), u = r("./compressedObject"), f = r("./stream/GenericWorker"), c = function(N, I, d) {
					this.name = N, this.dir = d.dir, this.date = d.date, this.comment = d.comment, this.unixPermissions = d.unixPermissions, this.dosPermissions = d.dosPermissions, this._data = I, this._dataBinary = d.binary, this.options = {
						compression: d.compression,
						compressionOptions: d.compressionOptions
					};
				};
				c.prototype = {
					internalStream: function(N) {
						var I = null, d = "string";
						try {
							if (!N) throw new Error("No output type specified.");
							d = N.toLowerCase();
							var v = d === "string" || d === "text";
							(d === "binarystring" || d === "text") && (d = "string"), I = this._decompressWorker();
							var b = !this._dataBinary;
							b && !v && (I = I.pipe(new l.Utf8EncodeWorker())), !b && v && (I = I.pipe(new l.Utf8DecodeWorker()));
						} catch (T) {
							I = new f("error"), I.error(T);
						}
						return new a(I, d, "");
					},
					async: function(N, I) {
						return this.internalStream(N).accumulate(I);
					},
					nodeStream: function(N, I) {
						return this.internalStream(N || "nodebuffer").toNodejsStream(I);
					},
					_compressWorker: function(N, I) {
						if (this._data instanceof u && this._data.compression.magic === N.magic) return this._data.getCompressedWorker();
						var d = this._decompressWorker();
						return this._dataBinary || (d = d.pipe(new l.Utf8EncodeWorker())), u.createWorkerFrom(d, N, I);
					},
					_decompressWorker: function() {
						return this._data instanceof u ? this._data.getContentWorker() : this._data instanceof f ? this._data : new o(this._data);
					}
				};
				for (var p = [
					"asText",
					"asBinary",
					"asNodeBuffer",
					"asUint8Array",
					"asArrayBuffer"
				], y = function() {
					throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
				}, _ = 0; _ < p.length; _++) c.prototype[p[_]] = y;
				i.exports = c;
			}, {
				"./compressedObject": 2,
				"./stream/DataWorker": 27,
				"./stream/GenericWorker": 28,
				"./stream/StreamHelper": 29,
				"./utf8": 31
			}],
			36: [function(r, i, s) {
				(function(a) {
					"use strict";
					var o = a.MutationObserver || a.WebKitMutationObserver, l;
					if (o) {
						var u = 0, f = new o(N), c = a.document.createTextNode("");
						f.observe(c, { characterData: !0 }), l = function() {
							c.data = u = ++u % 2;
						};
					} else if (!a.setImmediate && typeof a.MessageChannel != "undefined") {
						var p = new a.MessageChannel();
						p.port1.onmessage = N, l = function() {
							p.port2.postMessage(0);
						};
					} else "document" in a && "onreadystatechange" in a.document.createElement("script") ? l = function() {
						var d = a.document.createElement("script");
						d.onreadystatechange = function() {
							N(), d.onreadystatechange = null, d.parentNode.removeChild(d), d = null;
						}, a.document.documentElement.appendChild(d);
					} : l = function() {
						setTimeout(N, 0);
					};
					var y, _ = [];
					function N() {
						y = !0;
						for (var d, v, b = _.length; b;) {
							for (v = _, _ = [], d = -1; ++d < b;) v[d]();
							b = _.length;
						}
						y = !1;
					}
					i.exports = I;
					function I(d) {
						_.push(d) === 1 && !y && l();
					}
				}).call(this, typeof global != "undefined" ? global : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
			}, {}],
			37: [function(r, i, s) {
				"use strict";
				var a = r("immediate");
				function o() {}
				var l = {}, u = ["REJECTED"], f = ["FULFILLED"], c = ["PENDING"];
				i.exports = p;
				function p(E) {
					if (typeof E != "function") throw new TypeError("resolver must be a function");
					this.state = c, this.queue = [], this.outcome = void 0, E !== o && I(this, E);
				}
				p.prototype.finally = function(E) {
					if (typeof E != "function") return this;
					var A = this.constructor;
					return this.then(C, R);
					function C(q) {
						function M() {
							return q;
						}
						return A.resolve(E()).then(M);
					}
					function R(q) {
						function M() {
							throw q;
						}
						return A.resolve(E()).then(M);
					}
				}, p.prototype.catch = function(E) {
					return this.then(null, E);
				}, p.prototype.then = function(E, A) {
					if (typeof E != "function" && this.state === f || typeof A != "function" && this.state === u) return this;
					var C = new this.constructor(o);
					if (this.state !== c) _(C, this.state === f ? E : A, this.outcome);
					else this.queue.push(new y(C, E, A));
					return C;
				};
				function y(E, A, C) {
					this.promise = E, typeof A == "function" && (this.onFulfilled = A, this.callFulfilled = this.otherCallFulfilled), typeof C == "function" && (this.onRejected = C, this.callRejected = this.otherCallRejected);
				}
				y.prototype.callFulfilled = function(E) {
					l.resolve(this.promise, E);
				}, y.prototype.otherCallFulfilled = function(E) {
					_(this.promise, this.onFulfilled, E);
				}, y.prototype.callRejected = function(E) {
					l.reject(this.promise, E);
				}, y.prototype.otherCallRejected = function(E) {
					_(this.promise, this.onRejected, E);
				};
				function _(E, A, C) {
					a(function() {
						var R;
						try {
							R = A(C);
						} catch (q) {
							return l.reject(E, q);
						}
						R === E ? l.reject(E, /* @__PURE__ */ new TypeError("Cannot resolve promise with itself")) : l.resolve(E, R);
					});
				}
				l.resolve = function(E, A) {
					var C = d(N, A);
					if (C.status === "error") return l.reject(E, C.value);
					var R = C.value;
					if (R) I(E, R);
					else {
						E.state = f, E.outcome = A;
						for (var q = -1, M = E.queue.length; ++q < M;) E.queue[q].callFulfilled(A);
					}
					return E;
				}, l.reject = function(E, A) {
					E.state = u, E.outcome = A;
					for (var C = -1, R = E.queue.length; ++C < R;) E.queue[C].callRejected(A);
					return E;
				};
				function N(E) {
					var A = E && E.then;
					if (E && (typeof E == "object" || typeof E == "function") && typeof A == "function") return function() {
						A.apply(E, arguments);
					};
				}
				function I(E, A) {
					var C = !1;
					function R(V) {
						C || (C = !0, l.reject(E, V));
					}
					function q(V) {
						C || (C = !0, l.resolve(E, V));
					}
					function M() {
						A(q, R);
					}
					var Z = d(M);
					Z.status === "error" && R(Z.value);
				}
				function d(E, A) {
					var C = {};
					try {
						C.value = E(A), C.status = "success";
					} catch (R) {
						C.status = "error", C.value = R;
					}
					return C;
				}
				p.resolve = v;
				function v(E) {
					return E instanceof this ? E : l.resolve(new this(o), E);
				}
				p.reject = b;
				function b(E) {
					var A = new this(o);
					return l.reject(A, E);
				}
				p.all = T;
				function T(E) {
					var A = this;
					if (Object.prototype.toString.call(E) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
					var C = E.length, R = !1;
					if (!C) return this.resolve([]);
					for (var q = new Array(C), M = 0, Z = -1, V = new this(o); ++Z < C;) $(E[Z], Z);
					return V;
					function $(me, oe) {
						A.resolve(me).then(xe, function(ce) {
							R || (R = !0, l.reject(V, ce));
						});
						function xe(ce) {
							q[oe] = ce, ++M === C && !R && (R = !0, l.resolve(V, q));
						}
					}
				}
				p.race = F;
				function F(E) {
					var A = this;
					if (Object.prototype.toString.call(E) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
					var C = E.length, R = !1;
					if (!C) return this.resolve([]);
					for (var q = -1, M = new this(o); ++q < C;) Z(E[q]);
					return M;
					function Z(V) {
						A.resolve(V).then(function($) {
							R || (R = !0, l.resolve(M, $));
						}, function($) {
							R || (R = !0, l.reject(M, $));
						});
					}
				}
			}, { immediate: 36 }],
			38: [function(r, i, s) {
				"use strict";
				var a = r("./lib/utils/common").assign, o = r("./lib/deflate"), l = r("./lib/inflate"), u = r("./lib/zlib/constants"), f = {};
				a(f, o, l, u), i.exports = f;
			}, {
				"./lib/deflate": 39,
				"./lib/inflate": 40,
				"./lib/utils/common": 41,
				"./lib/zlib/constants": 44
			}],
			39: [function(r, i, s) {
				"use strict";
				var a = r("./zlib/deflate"), o = r("./utils/common"), l = r("./utils/strings"), u = r("./zlib/messages"), f = r("./zlib/zstream"), c = Object.prototype.toString, p = 0, y = 4, _ = 0, N = 1, I = 2, d = -1, v = 0, b = 8;
				function T(C) {
					if (!(this instanceof T)) return new T(C);
					this.options = o.assign({
						level: d,
						method: b,
						chunkSize: 16384,
						windowBits: 15,
						memLevel: 8,
						strategy: v,
						to: ""
					}, C || {});
					var R = this.options;
					R.raw && R.windowBits > 0 ? R.windowBits = -R.windowBits : R.gzip && R.windowBits > 0 && R.windowBits < 16 && (R.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new f(), this.strm.avail_out = 0;
					var q = a.deflateInit2(this.strm, R.level, R.method, R.windowBits, R.memLevel, R.strategy);
					if (q !== _) throw new Error(u[q]);
					if (R.header && a.deflateSetHeader(this.strm, R.header), R.dictionary) {
						var M;
						if (typeof R.dictionary == "string" ? M = l.string2buf(R.dictionary) : c.call(R.dictionary) === "[object ArrayBuffer]" ? M = new Uint8Array(R.dictionary) : M = R.dictionary, q = a.deflateSetDictionary(this.strm, M), q !== _) throw new Error(u[q]);
						this._dict_set = !0;
					}
				}
				T.prototype.push = function(C, R) {
					var q = this.strm, M = this.options.chunkSize, Z, V;
					if (this.ended) return !1;
					V = R === ~~R ? R : R === !0 ? y : p, typeof C == "string" ? q.input = l.string2buf(C) : c.call(C) === "[object ArrayBuffer]" ? q.input = new Uint8Array(C) : q.input = C, q.next_in = 0, q.avail_in = q.input.length;
					do {
						if (q.avail_out === 0 && (q.output = new o.Buf8(M), q.next_out = 0, q.avail_out = M), Z = a.deflate(q, V), Z !== N && Z !== _) return this.onEnd(Z), this.ended = !0, !1;
						(q.avail_out === 0 || q.avail_in === 0 && (V === y || V === I)) && (this.options.to === "string" ? this.onData(l.buf2binstring(o.shrinkBuf(q.output, q.next_out))) : this.onData(o.shrinkBuf(q.output, q.next_out)));
					} while ((q.avail_in > 0 || q.avail_out === 0) && Z !== N);
					return V === y ? (Z = a.deflateEnd(this.strm), this.onEnd(Z), this.ended = !0, Z === _) : (V === I && (this.onEnd(_), q.avail_out = 0), !0);
				}, T.prototype.onData = function(C) {
					this.chunks.push(C);
				}, T.prototype.onEnd = function(C) {
					C === _ && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = C, this.msg = this.strm.msg;
				};
				function F(C, R) {
					var q = new T(R);
					if (q.push(C, !0), q.err) throw q.msg || u[q.err];
					return q.result;
				}
				function E(C, R) {
					return R = R || {}, R.raw = !0, F(C, R);
				}
				function A(C, R) {
					return R = R || {}, R.gzip = !0, F(C, R);
				}
				s.Deflate = T, s.deflate = F, s.deflateRaw = E, s.gzip = A;
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/deflate": 46,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			40: [function(r, i, s) {
				"use strict";
				var a = r("./zlib/inflate"), o = r("./utils/common"), l = r("./utils/strings"), u = r("./zlib/constants"), f = r("./zlib/messages"), c = r("./zlib/zstream"), p = r("./zlib/gzheader"), y = Object.prototype.toString;
				function _(d) {
					if (!(this instanceof _)) return new _(d);
					this.options = o.assign({
						chunkSize: 16384,
						windowBits: 0,
						to: ""
					}, d || {});
					var v = this.options;
					v.raw && v.windowBits >= 0 && v.windowBits < 16 && (v.windowBits = -v.windowBits, v.windowBits === 0 && (v.windowBits = -15)), v.windowBits >= 0 && v.windowBits < 16 && !(d && d.windowBits) && (v.windowBits += 32), v.windowBits > 15 && v.windowBits < 48 && !(v.windowBits & 15) && (v.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new c(), this.strm.avail_out = 0;
					var b = a.inflateInit2(this.strm, v.windowBits);
					if (b !== u.Z_OK) throw new Error(f[b]);
					this.header = new p(), a.inflateGetHeader(this.strm, this.header);
				}
				_.prototype.push = function(d, v) {
					var b = this.strm, T = this.options.chunkSize, F = this.options.dictionary, E, A, C, R, q, M, Z = !1;
					if (this.ended) return !1;
					A = v === ~~v ? v : v === !0 ? u.Z_FINISH : u.Z_NO_FLUSH, typeof d == "string" ? b.input = l.binstring2buf(d) : y.call(d) === "[object ArrayBuffer]" ? b.input = new Uint8Array(d) : b.input = d, b.next_in = 0, b.avail_in = b.input.length;
					do {
						if (b.avail_out === 0 && (b.output = new o.Buf8(T), b.next_out = 0, b.avail_out = T), E = a.inflate(b, u.Z_NO_FLUSH), E === u.Z_NEED_DICT && F && (typeof F == "string" ? M = l.string2buf(F) : y.call(F) === "[object ArrayBuffer]" ? M = new Uint8Array(F) : M = F, E = a.inflateSetDictionary(this.strm, M)), E === u.Z_BUF_ERROR && Z === !0 && (E = u.Z_OK, Z = !1), E !== u.Z_STREAM_END && E !== u.Z_OK) return this.onEnd(E), this.ended = !0, !1;
						b.next_out && (b.avail_out === 0 || E === u.Z_STREAM_END || b.avail_in === 0 && (A === u.Z_FINISH || A === u.Z_SYNC_FLUSH)) && (this.options.to === "string" ? (C = l.utf8border(b.output, b.next_out), R = b.next_out - C, q = l.buf2string(b.output, C), b.next_out = R, b.avail_out = T - R, R && o.arraySet(b.output, b.output, C, R, 0), this.onData(q)) : this.onData(o.shrinkBuf(b.output, b.next_out))), b.avail_in === 0 && b.avail_out === 0 && (Z = !0);
					} while ((b.avail_in > 0 || b.avail_out === 0) && E !== u.Z_STREAM_END);
					return E === u.Z_STREAM_END && (A = u.Z_FINISH), A === u.Z_FINISH ? (E = a.inflateEnd(this.strm), this.onEnd(E), this.ended = !0, E === u.Z_OK) : (A === u.Z_SYNC_FLUSH && (this.onEnd(u.Z_OK), b.avail_out = 0), !0);
				}, _.prototype.onData = function(d) {
					this.chunks.push(d);
				}, _.prototype.onEnd = function(d) {
					d === u.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = d, this.msg = this.strm.msg;
				};
				function N(d, v) {
					var b = new _(v);
					if (b.push(d, !0), b.err) throw b.msg || f[b.err];
					return b.result;
				}
				function I(d, v) {
					return v = v || {}, v.raw = !0, N(d, v);
				}
				s.Inflate = _, s.inflate = N, s.inflateRaw = I, s.ungzip = N;
			}, {
				"./utils/common": 41,
				"./utils/strings": 42,
				"./zlib/constants": 44,
				"./zlib/gzheader": 47,
				"./zlib/inflate": 49,
				"./zlib/messages": 51,
				"./zlib/zstream": 53
			}],
			41: [function(r, i, s) {
				"use strict";
				var a = typeof Uint8Array != "undefined" && typeof Uint16Array != "undefined" && typeof Int32Array != "undefined";
				s.assign = function(u) {
					for (var f = Array.prototype.slice.call(arguments, 1); f.length;) {
						var c = f.shift();
						if (c) {
							if (typeof c != "object") throw new TypeError(c + "must be non-object");
							for (var p in c) c.hasOwnProperty(p) && (u[p] = c[p]);
						}
					}
					return u;
				}, s.shrinkBuf = function(u, f) {
					return u.length === f ? u : u.subarray ? u.subarray(0, f) : (u.length = f, u);
				};
				var o = {
					arraySet: function(u, f, c, p, y) {
						if (f.subarray && u.subarray) {
							u.set(f.subarray(c, c + p), y);
							return;
						}
						for (var _ = 0; _ < p; _++) u[y + _] = f[c + _];
					},
					flattenChunks: function(u) {
						var f, c, p, y, _, N;
						for (p = 0, f = 0, c = u.length; f < c; f++) p += u[f].length;
						for (N = new Uint8Array(p), y = 0, f = 0, c = u.length; f < c; f++) _ = u[f], N.set(_, y), y += _.length;
						return N;
					}
				}, l = {
					arraySet: function(u, f, c, p, y) {
						for (var _ = 0; _ < p; _++) u[y + _] = f[c + _];
					},
					flattenChunks: function(u) {
						return [].concat.apply([], u);
					}
				};
				s.setTyped = function(u) {
					u ? (s.Buf8 = Uint8Array, s.Buf16 = Uint16Array, s.Buf32 = Int32Array, s.assign(s, o)) : (s.Buf8 = Array, s.Buf16 = Array, s.Buf32 = Array, s.assign(s, l));
				}, s.setTyped(a);
			}, {}],
			42: [function(r, i, s) {
				"use strict";
				var a = r("./common"), o = !0, l = !0;
				try {
					String.fromCharCode.apply(null, [0]);
				} catch {
					o = !1;
				}
				try {
					String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1));
				} catch {
					l = !1;
				}
				for (var u = new a.Buf8(256), f = 0; f < 256; f++) u[f] = f >= 252 ? 6 : f >= 248 ? 5 : f >= 240 ? 4 : f >= 224 ? 3 : f >= 192 ? 2 : 1;
				u[254] = u[254] = 1, s.string2buf = function(p) {
					var y, _, N, I, d, v = p.length, b = 0;
					for (I = 0; I < v; I++) _ = p.charCodeAt(I), (_ & 64512) === 55296 && I + 1 < v && (N = p.charCodeAt(I + 1), (N & 64512) === 56320 && (_ = 65536 + (_ - 55296 << 10) + (N - 56320), I++)), b += _ < 128 ? 1 : _ < 2048 ? 2 : _ < 65536 ? 3 : 4;
					for (y = new a.Buf8(b), d = 0, I = 0; d < b; I++) _ = p.charCodeAt(I), (_ & 64512) === 55296 && I + 1 < v && (N = p.charCodeAt(I + 1), (N & 64512) === 56320 && (_ = 65536 + (_ - 55296 << 10) + (N - 56320), I++)), _ < 128 ? y[d++] = _ : _ < 2048 ? (y[d++] = 192 | _ >>> 6, y[d++] = 128 | _ & 63) : _ < 65536 ? (y[d++] = 224 | _ >>> 12, y[d++] = 128 | _ >>> 6 & 63, y[d++] = 128 | _ & 63) : (y[d++] = 240 | _ >>> 18, y[d++] = 128 | _ >>> 12 & 63, y[d++] = 128 | _ >>> 6 & 63, y[d++] = 128 | _ & 63);
					return y;
				};
				function c(p, y) {
					if (y < 65537 && (p.subarray && l || !p.subarray && o)) return String.fromCharCode.apply(null, a.shrinkBuf(p, y));
					for (var _ = "", N = 0; N < y; N++) _ += String.fromCharCode(p[N]);
					return _;
				}
				s.buf2binstring = function(p) {
					return c(p, p.length);
				}, s.binstring2buf = function(p) {
					for (var y = new a.Buf8(p.length), _ = 0, N = y.length; _ < N; _++) y[_] = p.charCodeAt(_);
					return y;
				}, s.buf2string = function(p, y) {
					var _, N, I, d, v = y || p.length, b = new Array(v * 2);
					for (N = 0, _ = 0; _ < v;) {
						if (I = p[_++], I < 128) {
							b[N++] = I;
							continue;
						}
						if (d = u[I], d > 4) {
							b[N++] = 65533, _ += d - 1;
							continue;
						}
						for (I &= d === 2 ? 31 : d === 3 ? 15 : 7; d > 1 && _ < v;) I = I << 6 | p[_++] & 63, d--;
						if (d > 1) {
							b[N++] = 65533;
							continue;
						}
						I < 65536 ? b[N++] = I : (I -= 65536, b[N++] = 55296 | I >> 10 & 1023, b[N++] = 56320 | I & 1023);
					}
					return c(b, N);
				}, s.utf8border = function(p, y) {
					var _;
					for (y = y || p.length, y > p.length && (y = p.length), _ = y - 1; _ >= 0 && (p[_] & 192) === 128;) _--;
					return _ < 0 || _ === 0 ? y : _ + u[p[_]] > y ? _ : y;
				};
			}, { "./common": 41 }],
			43: [function(r, i, s) {
				"use strict";
				function a(o, l, u, f) {
					for (var c = o & 65535 | 0, p = o >>> 16 & 65535 | 0, y = 0; u !== 0;) {
						y = u > 2e3 ? 2e3 : u, u -= y;
						do
							c = c + l[f++] | 0, p = p + c | 0;
						while (--y);
						c %= 65521, p %= 65521;
					}
					return c | p << 16 | 0;
				}
				i.exports = a;
			}, {}],
			44: [function(r, i, s) {
				"use strict";
				i.exports = {
					Z_NO_FLUSH: 0,
					Z_PARTIAL_FLUSH: 1,
					Z_SYNC_FLUSH: 2,
					Z_FULL_FLUSH: 3,
					Z_FINISH: 4,
					Z_BLOCK: 5,
					Z_TREES: 6,
					Z_OK: 0,
					Z_STREAM_END: 1,
					Z_NEED_DICT: 2,
					Z_ERRNO: -1,
					Z_STREAM_ERROR: -2,
					Z_DATA_ERROR: -3,
					Z_BUF_ERROR: -5,
					Z_NO_COMPRESSION: 0,
					Z_BEST_SPEED: 1,
					Z_BEST_COMPRESSION: 9,
					Z_DEFAULT_COMPRESSION: -1,
					Z_FILTERED: 1,
					Z_HUFFMAN_ONLY: 2,
					Z_RLE: 3,
					Z_FIXED: 4,
					Z_DEFAULT_STRATEGY: 0,
					Z_BINARY: 0,
					Z_TEXT: 1,
					Z_UNKNOWN: 2,
					Z_DEFLATED: 8
				};
			}, {}],
			45: [function(r, i, s) {
				"use strict";
				function a() {
					for (var u, f = [], c = 0; c < 256; c++) {
						u = c;
						for (var p = 0; p < 8; p++) u = u & 1 ? 3988292384 ^ u >>> 1 : u >>> 1;
						f[c] = u;
					}
					return f;
				}
				var o = a();
				function l(u, f, c, p) {
					var y = o, _ = p + c;
					u ^= -1;
					for (var N = p; N < _; N++) u = u >>> 8 ^ y[(u ^ f[N]) & 255];
					return u ^ -1;
				}
				i.exports = l;
			}, {}],
			46: [function(r, i, s) {
				"use strict";
				var a = r("../utils/common"), o = r("./trees"), l = r("./adler32"), u = r("./crc32"), f = r("./messages"), c = 0, p = 1, y = 3, _ = 4, N = 5, I = 0, d = 1, v = -2, b = -3, T = -5, F = -1, E = 1, A = 2, C = 3, R = 4, q = 0, M = 2, Z = 8, V = 9, $ = 15, me = 8, ce = 286, ae = 30, Ae = 19, fe = 2 * ce + 1, be = 15, ue = 3, Ie = 258, Le = Ie + ue + 1, ft = 32, it = 42, Ge = 69, Te = 73, at = 91, Ze = 103, Fe = 113, He = 666, Be = 1, ct = 2, Je = 3, At = 4, Pe = 3;
				function nt(h, U) {
					return h.msg = f[U], U;
				}
				function qt(h) {
					return (h << 1) - (h > 4 ? 9 : 0);
				}
				function gt(h) {
					for (var U = h.length; --U >= 0;) h[U] = 0;
				}
				function pt(h) {
					var U = h.state, W = U.pending;
					W > h.avail_out && (W = h.avail_out), W !== 0 && (a.arraySet(h.output, U.pending_buf, U.pending_out, W, h.next_out), h.next_out += W, U.pending_out += W, h.total_out += W, h.avail_out -= W, U.pending -= W, U.pending === 0 && (U.pending_out = 0));
				}
				function We(h, U) {
					o._tr_flush_block(h, h.block_start >= 0 ? h.block_start : -1, h.strstart - h.block_start, U), h.block_start = h.strstart, pt(h.strm);
				}
				function De(h, U) {
					h.pending_buf[h.pending++] = U;
				}
				function bt(h, U) {
					h.pending_buf[h.pending++] = U >>> 8 & 255, h.pending_buf[h.pending++] = U & 255;
				}
				function tr(h, U, W, g) {
					var O = h.avail_in;
					return O > g && (O = g), O === 0 ? 0 : (h.avail_in -= O, a.arraySet(U, h.input, h.next_in, O, W), h.state.wrap === 1 ? h.adler = l(h.adler, U, O, W) : h.state.wrap === 2 && (h.adler = u(h.adler, U, O, W)), h.next_in += O, h.total_in += O, O);
				}
				function Wt(h, U) {
					var W = h.max_chain_length, g = h.strstart, O, z, le = h.prev_length, re = h.nice_match, ne = h.strstart > h.w_size - Le ? h.strstart - (h.w_size - Le) : 0, Se = h.window, Vt = h.w_mask, Ve = h.prev, Ne = h.strstart + Ie, et = Se[g + le - 1], dt = Se[g + le];
					h.prev_length >= h.good_match && (W >>= 2), re > h.lookahead && (re = h.lookahead);
					do
						if (O = U, !(Se[O + le] !== dt || Se[O + le - 1] !== et || Se[O] !== Se[g] || Se[++O] !== Se[g + 1])) {
							g += 2, O++;
							do							;
while (Se[++g] === Se[++O] && Se[++g] === Se[++O] && Se[++g] === Se[++O] && Se[++g] === Se[++O] && Se[++g] === Se[++O] && Se[++g] === Se[++O] && Se[++g] === Se[++O] && Se[++g] === Se[++O] && g < Ne);
							if (z = Ie - (Ne - g), g = Ne - Ie, z > le) {
								if (h.match_start = U, le = z, z >= re) break;
								et = Se[g + le - 1], dt = Se[g + le];
							}
						}
					while ((U = Ve[U & Vt]) > ne && --W !== 0);
					return le <= h.lookahead ? le : h.lookahead;
				}
				function wt(h) {
					var U = h.w_size, W, g, O, z, le;
					do {
						if (z = h.window_size - h.lookahead - h.strstart, h.strstart >= U + (U - Le)) {
							a.arraySet(h.window, h.window, U, U, 0), h.match_start -= U, h.strstart -= U, h.block_start -= U, g = h.hash_size, W = g;
							do
								O = h.head[--W], h.head[W] = O >= U ? O - U : 0;
							while (--g);
							g = U, W = g;
							do
								O = h.prev[--W], h.prev[W] = O >= U ? O - U : 0;
							while (--g);
							z += U;
						}
						if (h.strm.avail_in === 0) break;
						if (g = tr(h.strm, h.window, h.strstart + h.lookahead, z), h.lookahead += g, h.lookahead + h.insert >= ue) for (le = h.strstart - h.insert, h.ins_h = h.window[le], h.ins_h = (h.ins_h << h.hash_shift ^ h.window[le + 1]) & h.hash_mask; h.insert && (h.ins_h = (h.ins_h << h.hash_shift ^ h.window[le + ue - 1]) & h.hash_mask, h.prev[le & h.w_mask] = h.head[h.ins_h], h.head[h.ins_h] = le, le++, h.insert--, !(h.lookahead + h.insert < ue)););
					} while (h.lookahead < Le && h.strm.avail_in !== 0);
				}
				function rr(h, U) {
					var W = 65535;
					for (W > h.pending_buf_size - 5 && (W = h.pending_buf_size - 5);;) {
						if (h.lookahead <= 1) {
							if (wt(h), h.lookahead === 0 && U === c) return Be;
							if (h.lookahead === 0) break;
						}
						h.strstart += h.lookahead, h.lookahead = 0;
						var g = h.block_start + W;
						if ((h.strstart === 0 || h.strstart >= g) && (h.lookahead = h.strstart - g, h.strstart = g, We(h, !1), h.strm.avail_out === 0) || h.strstart - h.block_start >= h.w_size - Le && (We(h, !1), h.strm.avail_out === 0)) return Be;
					}
					return h.insert = 0, U === _ ? (We(h, !0), h.strm.avail_out === 0 ? Je : At) : (h.strstart > h.block_start && (We(h, !1), h.strm.avail_out), Be);
				}
				function jt(h, U) {
					for (var W, g;;) {
						if (h.lookahead < Le) {
							if (wt(h), h.lookahead < Le && U === c) return Be;
							if (h.lookahead === 0) break;
						}
						if (W = 0, h.lookahead >= ue && (h.ins_h = (h.ins_h << h.hash_shift ^ h.window[h.strstart + ue - 1]) & h.hash_mask, W = h.prev[h.strstart & h.w_mask] = h.head[h.ins_h], h.head[h.ins_h] = h.strstart), W !== 0 && h.strstart - W <= h.w_size - Le && (h.match_length = Wt(h, W)), h.match_length >= ue) if (g = o._tr_tally(h, h.strstart - h.match_start, h.match_length - ue), h.lookahead -= h.match_length, h.match_length <= h.max_lazy_match && h.lookahead >= ue) {
							h.match_length--;
							do
								h.strstart++, h.ins_h = (h.ins_h << h.hash_shift ^ h.window[h.strstart + ue - 1]) & h.hash_mask, W = h.prev[h.strstart & h.w_mask] = h.head[h.ins_h], h.head[h.ins_h] = h.strstart;
							while (--h.match_length !== 0);
							h.strstart++;
						} else h.strstart += h.match_length, h.match_length = 0, h.ins_h = h.window[h.strstart], h.ins_h = (h.ins_h << h.hash_shift ^ h.window[h.strstart + 1]) & h.hash_mask;
						else g = o._tr_tally(h, 0, h.window[h.strstart]), h.lookahead--, h.strstart++;
						if (g && (We(h, !1), h.strm.avail_out === 0)) return Be;
					}
					return h.insert = h.strstart < ue - 1 ? h.strstart : ue - 1, U === _ ? (We(h, !0), h.strm.avail_out === 0 ? Je : At) : h.last_lit && (We(h, !1), h.strm.avail_out === 0) ? Be : ct;
				}
				function Ct(h, U) {
					for (var W, g, O;;) {
						if (h.lookahead < Le) {
							if (wt(h), h.lookahead < Le && U === c) return Be;
							if (h.lookahead === 0) break;
						}
						if (W = 0, h.lookahead >= ue && (h.ins_h = (h.ins_h << h.hash_shift ^ h.window[h.strstart + ue - 1]) & h.hash_mask, W = h.prev[h.strstart & h.w_mask] = h.head[h.ins_h], h.head[h.ins_h] = h.strstart), h.prev_length = h.match_length, h.prev_match = h.match_start, h.match_length = ue - 1, W !== 0 && h.prev_length < h.max_lazy_match && h.strstart - W <= h.w_size - Le && (h.match_length = Wt(h, W), h.match_length <= 5 && (h.strategy === E || h.match_length === ue && h.strstart - h.match_start > 4096) && (h.match_length = ue - 1)), h.prev_length >= ue && h.match_length <= h.prev_length) {
							O = h.strstart + h.lookahead - ue, g = o._tr_tally(h, h.strstart - 1 - h.prev_match, h.prev_length - ue), h.lookahead -= h.prev_length - 1, h.prev_length -= 2;
							do
								++h.strstart <= O && (h.ins_h = (h.ins_h << h.hash_shift ^ h.window[h.strstart + ue - 1]) & h.hash_mask, W = h.prev[h.strstart & h.w_mask] = h.head[h.ins_h], h.head[h.ins_h] = h.strstart);
							while (--h.prev_length !== 0);
							if (h.match_available = 0, h.match_length = ue - 1, h.strstart++, g && (We(h, !1), h.strm.avail_out === 0)) return Be;
						} else if (h.match_available) {
							if (g = o._tr_tally(h, 0, h.window[h.strstart - 1]), g && We(h, !1), h.strstart++, h.lookahead--, h.strm.avail_out === 0) return Be;
						} else h.match_available = 1, h.strstart++, h.lookahead--;
					}
					return h.match_available && (g = o._tr_tally(h, 0, h.window[h.strstart - 1]), h.match_available = 0), h.insert = h.strstart < ue - 1 ? h.strstart : ue - 1, U === _ ? (We(h, !0), h.strm.avail_out === 0 ? Je : At) : h.last_lit && (We(h, !1), h.strm.avail_out === 0) ? Be : ct;
				}
				function ir(h, U) {
					for (var W, g, O, z, le = h.window;;) {
						if (h.lookahead <= Ie) {
							if (wt(h), h.lookahead <= Ie && U === c) return Be;
							if (h.lookahead === 0) break;
						}
						if (h.match_length = 0, h.lookahead >= ue && h.strstart > 0 && (O = h.strstart - 1, g = le[O], g === le[++O] && g === le[++O] && g === le[++O])) {
							z = h.strstart + Ie;
							do							;
while (g === le[++O] && g === le[++O] && g === le[++O] && g === le[++O] && g === le[++O] && g === le[++O] && g === le[++O] && g === le[++O] && O < z);
							h.match_length = Ie - (z - O), h.match_length > h.lookahead && (h.match_length = h.lookahead);
						}
						if (h.match_length >= ue ? (W = o._tr_tally(h, 1, h.match_length - ue), h.lookahead -= h.match_length, h.strstart += h.match_length, h.match_length = 0) : (W = o._tr_tally(h, 0, h.window[h.strstart]), h.lookahead--, h.strstart++), W && (We(h, !1), h.strm.avail_out === 0)) return Be;
					}
					return h.insert = 0, U === _ ? (We(h, !0), h.strm.avail_out === 0 ? Je : At) : h.last_lit && (We(h, !1), h.strm.avail_out === 0) ? Be : ct;
				}
				function Ht(h, U) {
					for (var W;;) {
						if (h.lookahead === 0 && (wt(h), h.lookahead === 0)) {
							if (U === c) return Be;
							break;
						}
						if (h.match_length = 0, W = o._tr_tally(h, 0, h.window[h.strstart]), h.lookahead--, h.strstart++, W && (We(h, !1), h.strm.avail_out === 0)) return Be;
					}
					return h.insert = 0, U === _ ? (We(h, !0), h.strm.avail_out === 0 ? Je : At) : h.last_lit && (We(h, !1), h.strm.avail_out === 0) ? Be : ct;
				}
				function ot(h, U, W, g, O) {
					this.good_length = h, this.max_lazy = U, this.nice_length = W, this.max_chain = g, this.func = O;
				}
				var Tt = [
					new ot(0, 0, 0, 0, rr),
					new ot(4, 4, 8, 4, jt),
					new ot(4, 5, 16, 8, jt),
					new ot(4, 6, 32, 32, jt),
					new ot(4, 4, 16, 16, Ct),
					new ot(8, 16, 32, 32, Ct),
					new ot(8, 16, 128, 128, Ct),
					new ot(8, 32, 128, 256, Ct),
					new ot(32, 128, 258, 1024, Ct),
					new ot(32, 258, 258, 4096, Ct)
				];
				function lr(h) {
					h.window_size = 2 * h.w_size, gt(h.head), h.max_lazy_match = Tt[h.level].max_lazy, h.good_match = Tt[h.level].good_length, h.nice_match = Tt[h.level].nice_length, h.max_chain_length = Tt[h.level].max_chain, h.strstart = 0, h.block_start = 0, h.lookahead = 0, h.insert = 0, h.match_length = h.prev_length = ue - 1, h.match_available = 0, h.ins_h = 0;
				}
				function x() {
					this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Z, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new a.Buf16(fe * 2), this.dyn_dtree = new a.Buf16((2 * ae + 1) * 2), this.bl_tree = new a.Buf16((2 * Ae + 1) * 2), gt(this.dyn_ltree), gt(this.dyn_dtree), gt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new a.Buf16(be + 1), this.heap = new a.Buf16(2 * ce + 1), gt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new a.Buf16(2 * ce + 1), gt(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
				}
				function G(h) {
					var U;
					return !h || !h.state ? nt(h, v) : (h.total_in = h.total_out = 0, h.data_type = M, U = h.state, U.pending = 0, U.pending_out = 0, U.wrap < 0 && (U.wrap = -U.wrap), U.status = U.wrap ? it : Fe, h.adler = U.wrap === 2 ? 0 : 1, U.last_flush = c, o._tr_init(U), I);
				}
				function K(h) {
					var U = G(h);
					return U === I && lr(h.state), U;
				}
				function ie(h, U) {
					return !h || !h.state || h.state.wrap !== 2 ? v : (h.state.gzhead = U, I);
				}
				function k(h, U, W, g, O, z) {
					if (!h) return v;
					var le = 1;
					if (U === F && (U = 6), g < 0 ? (le = 0, g = -g) : g > 15 && (le = 2, g -= 16), O < 1 || O > V || W !== Z || g < 8 || g > 15 || U < 0 || U > 9 || z < 0 || z > R) return nt(h, v);
					g === 8 && (g = 9);
					var re = new x();
					return h.state = re, re.strm = h, re.wrap = le, re.gzhead = null, re.w_bits = g, re.w_size = 1 << re.w_bits, re.w_mask = re.w_size - 1, re.hash_bits = O + 7, re.hash_size = 1 << re.hash_bits, re.hash_mask = re.hash_size - 1, re.hash_shift = ~~((re.hash_bits + ue - 1) / ue), re.window = new a.Buf8(re.w_size * 2), re.head = new a.Buf16(re.hash_size), re.prev = new a.Buf16(re.w_size), re.lit_bufsize = 1 << O + 6, re.pending_buf_size = re.lit_bufsize * 4, re.pending_buf = new a.Buf8(re.pending_buf_size), re.d_buf = 1 * re.lit_bufsize, re.l_buf = 3 * re.lit_bufsize, re.level = U, re.strategy = z, re.method = W, K(h);
				}
				function j(h, U) {
					return k(h, U, Z, $, me, q);
				}
				function m(h, U) {
					var W, g, O, z;
					if (!h || !h.state || U > N || U < 0) return h ? nt(h, v) : v;
					if (g = h.state, !h.output || !h.input && h.avail_in !== 0 || g.status === He && U !== _) return nt(h, h.avail_out === 0 ? T : v);
					if (g.strm = h, W = g.last_flush, g.last_flush = U, g.status === it) if (g.wrap === 2) h.adler = 0, De(g, 31), De(g, 139), De(g, 8), g.gzhead ? (De(g, (g.gzhead.text ? 1 : 0) + (g.gzhead.hcrc ? 2 : 0) + (g.gzhead.extra ? 4 : 0) + (g.gzhead.name ? 8 : 0) + (g.gzhead.comment ? 16 : 0)), De(g, g.gzhead.time & 255), De(g, g.gzhead.time >> 8 & 255), De(g, g.gzhead.time >> 16 & 255), De(g, g.gzhead.time >> 24 & 255), De(g, g.level === 9 ? 2 : g.strategy >= A || g.level < 2 ? 4 : 0), De(g, g.gzhead.os & 255), g.gzhead.extra && g.gzhead.extra.length && (De(g, g.gzhead.extra.length & 255), De(g, g.gzhead.extra.length >> 8 & 255)), g.gzhead.hcrc && (h.adler = u(h.adler, g.pending_buf, g.pending, 0)), g.gzindex = 0, g.status = Ge) : (De(g, 0), De(g, 0), De(g, 0), De(g, 0), De(g, 0), De(g, g.level === 9 ? 2 : g.strategy >= A || g.level < 2 ? 4 : 0), De(g, Pe), g.status = Fe);
					else {
						var le = Z + (g.w_bits - 8 << 4) << 8, re = -1;
						g.strategy >= A || g.level < 2 ? re = 0 : g.level < 6 ? re = 1 : g.level === 6 ? re = 2 : re = 3, le |= re << 6, g.strstart !== 0 && (le |= ft), le += 31 - le % 31, g.status = Fe, bt(g, le), g.strstart !== 0 && (bt(g, h.adler >>> 16), bt(g, h.adler & 65535)), h.adler = 1;
					}
					if (g.status === Ge) if (g.gzhead.extra) {
						for (O = g.pending; g.gzindex < (g.gzhead.extra.length & 65535) && !(g.pending === g.pending_buf_size && (g.gzhead.hcrc && g.pending > O && (h.adler = u(h.adler, g.pending_buf, g.pending - O, O)), pt(h), O = g.pending, g.pending === g.pending_buf_size));) De(g, g.gzhead.extra[g.gzindex] & 255), g.gzindex++;
						g.gzhead.hcrc && g.pending > O && (h.adler = u(h.adler, g.pending_buf, g.pending - O, O)), g.gzindex === g.gzhead.extra.length && (g.gzindex = 0, g.status = Te);
					} else g.status = Te;
					if (g.status === Te) if (g.gzhead.name) {
						O = g.pending;
						do {
							if (g.pending === g.pending_buf_size && (g.gzhead.hcrc && g.pending > O && (h.adler = u(h.adler, g.pending_buf, g.pending - O, O)), pt(h), O = g.pending, g.pending === g.pending_buf_size)) {
								z = 1;
								break;
							}
							g.gzindex < g.gzhead.name.length ? z = g.gzhead.name.charCodeAt(g.gzindex++) & 255 : z = 0, De(g, z);
						} while (z !== 0);
						g.gzhead.hcrc && g.pending > O && (h.adler = u(h.adler, g.pending_buf, g.pending - O, O)), z === 0 && (g.gzindex = 0, g.status = at);
					} else g.status = at;
					if (g.status === at) if (g.gzhead.comment) {
						O = g.pending;
						do {
							if (g.pending === g.pending_buf_size && (g.gzhead.hcrc && g.pending > O && (h.adler = u(h.adler, g.pending_buf, g.pending - O, O)), pt(h), O = g.pending, g.pending === g.pending_buf_size)) {
								z = 1;
								break;
							}
							g.gzindex < g.gzhead.comment.length ? z = g.gzhead.comment.charCodeAt(g.gzindex++) & 255 : z = 0, De(g, z);
						} while (z !== 0);
						g.gzhead.hcrc && g.pending > O && (h.adler = u(h.adler, g.pending_buf, g.pending - O, O)), z === 0 && (g.status = Ze);
					} else g.status = Ze;
					if (g.status === Ze && (g.gzhead.hcrc ? (g.pending + 2 > g.pending_buf_size && pt(h), g.pending + 2 <= g.pending_buf_size && (De(g, h.adler & 255), De(g, h.adler >> 8 & 255), h.adler = 0, g.status = Fe)) : g.status = Fe), g.pending !== 0) {
						if (pt(h), h.avail_out === 0) return g.last_flush = -1, I;
					} else if (h.avail_in === 0 && qt(U) <= qt(W) && U !== _) return nt(h, T);
					if (g.status === He && h.avail_in !== 0) return nt(h, T);
					if (h.avail_in !== 0 || g.lookahead !== 0 || U !== c && g.status !== He) {
						var ne = g.strategy === A ? Ht(g, U) : g.strategy === C ? ir(g, U) : Tt[g.level].func(g, U);
						if ((ne === Je || ne === At) && (g.status = He), ne === Be || ne === Je) return h.avail_out === 0 && (g.last_flush = -1), I;
						if (ne === ct && (U === p ? o._tr_align(g) : U !== N && (o._tr_stored_block(g, 0, 0, !1), U === y && (gt(g.head), g.lookahead === 0 && (g.strstart = 0, g.block_start = 0, g.insert = 0))), pt(h), h.avail_out === 0)) return g.last_flush = -1, I;
					}
					return U !== _ ? I : g.wrap <= 0 ? d : (g.wrap === 2 ? (De(g, h.adler & 255), De(g, h.adler >> 8 & 255), De(g, h.adler >> 16 & 255), De(g, h.adler >> 24 & 255), De(g, h.total_in & 255), De(g, h.total_in >> 8 & 255), De(g, h.total_in >> 16 & 255), De(g, h.total_in >> 24 & 255)) : (bt(g, h.adler >>> 16), bt(g, h.adler & 65535)), pt(h), g.wrap > 0 && (g.wrap = -g.wrap), g.pending !== 0 ? I : d);
				}
				function Y(h) {
					var U;
					return !h || !h.state ? v : (U = h.state.status, U !== it && U !== Ge && U !== Te && U !== at && U !== Ze && U !== Fe && U !== He ? nt(h, v) : (h.state = null, U === Fe ? nt(h, b) : I));
				}
				function de(h, U) {
					var W = U.length, g, O, z, le, re, ne, Se, Vt;
					if (!h || !h.state || (g = h.state, le = g.wrap, le === 2 || le === 1 && g.status !== it || g.lookahead)) return v;
					for (le === 1 && (h.adler = l(h.adler, U, W, 0)), g.wrap = 0, W >= g.w_size && (le === 0 && (gt(g.head), g.strstart = 0, g.block_start = 0, g.insert = 0), Vt = new a.Buf8(g.w_size), a.arraySet(Vt, U, W - g.w_size, g.w_size, 0), U = Vt, W = g.w_size), re = h.avail_in, ne = h.next_in, Se = h.input, h.avail_in = W, h.next_in = 0, h.input = U, wt(g); g.lookahead >= ue;) {
						O = g.strstart, z = g.lookahead - (ue - 1);
						do
							g.ins_h = (g.ins_h << g.hash_shift ^ g.window[O + ue - 1]) & g.hash_mask, g.prev[O & g.w_mask] = g.head[g.ins_h], g.head[g.ins_h] = O, O++;
						while (--z);
						g.strstart = O, g.lookahead = ue - 1, wt(g);
					}
					return g.strstart += g.lookahead, g.block_start = g.strstart, g.insert = g.lookahead, g.lookahead = 0, g.match_length = g.prev_length = ue - 1, g.match_available = 0, h.next_in = ne, h.input = Se, h.avail_in = re, g.wrap = le, I;
				}
				s.deflateInit = j, s.deflateInit2 = k, s.deflateReset = K, s.deflateResetKeep = G, s.deflateSetHeader = ie, s.deflate = m, s.deflateEnd = Y, s.deflateSetDictionary = de, s.deflateInfo = "pako deflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./messages": 51,
				"./trees": 52
			}],
			47: [function(r, i, s) {
				"use strict";
				function a() {
					this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
				}
				i.exports = a;
			}, {}],
			48: [function(r, i, s) {
				"use strict";
				var a = 30, o = 12;
				i.exports = function(u, f) {
					var c = u.state, p = u.next_in, y, _, N, I, d, v, b, T, F, E, A, C, R, q, M, Z, V, $, me, oe, xe, ce = u.input, ae;
					y = p + (u.avail_in - 5), _ = u.next_out, ae = u.output, N = _ - (f - u.avail_out), I = _ + (u.avail_out - 257), d = c.dmax, v = c.wsize, b = c.whave, T = c.wnext, F = c.window, E = c.hold, A = c.bits, C = c.lencode, R = c.distcode, q = (1 << c.lenbits) - 1, M = (1 << c.distbits) - 1;
					e: do {
						A < 15 && (E += ce[p++] << A, A += 8, E += ce[p++] << A, A += 8), Z = C[E & q];
						t: for (;;) {
							if (V = Z >>> 24, E >>>= V, A -= V, V = Z >>> 16 & 255, V === 0) ae[_++] = Z & 65535;
							else if (V & 16) {
								$ = Z & 65535, V &= 15, V && (A < V && (E += ce[p++] << A, A += 8), $ += E & (1 << V) - 1, E >>>= V, A -= V), A < 15 && (E += ce[p++] << A, A += 8, E += ce[p++] << A, A += 8), Z = R[E & M];
								r: for (;;) {
									if (V = Z >>> 24, E >>>= V, A -= V, V = Z >>> 16 & 255, V & 16) {
										if (me = Z & 65535, V &= 15, A < V && (E += ce[p++] << A, A += 8, A < V && (E += ce[p++] << A, A += 8)), me += E & (1 << V) - 1, me > d) {
											u.msg = "invalid distance too far back", c.mode = a;
											break e;
										}
										if (E >>>= V, A -= V, V = _ - N, me > V) {
											if (V = me - V, V > b && c.sane) {
												u.msg = "invalid distance too far back", c.mode = a;
												break e;
											}
											if (oe = 0, xe = F, T === 0) {
												if (oe += v - V, V < $) {
													$ -= V;
													do
														ae[_++] = F[oe++];
													while (--V);
													oe = _ - me, xe = ae;
												}
											} else if (T < V) {
												if (oe += v + T - V, V -= T, V < $) {
													$ -= V;
													do
														ae[_++] = F[oe++];
													while (--V);
													if (oe = 0, T < $) {
														V = T, $ -= V;
														do
															ae[_++] = F[oe++];
														while (--V);
														oe = _ - me, xe = ae;
													}
												}
											} else if (oe += T - V, V < $) {
												$ -= V;
												do
													ae[_++] = F[oe++];
												while (--V);
												oe = _ - me, xe = ae;
											}
											for (; $ > 2;) ae[_++] = xe[oe++], ae[_++] = xe[oe++], ae[_++] = xe[oe++], $ -= 3;
											$ && (ae[_++] = xe[oe++], $ > 1 && (ae[_++] = xe[oe++]));
										} else {
											oe = _ - me;
											do
												ae[_++] = ae[oe++], ae[_++] = ae[oe++], ae[_++] = ae[oe++], $ -= 3;
											while ($ > 2);
											$ && (ae[_++] = ae[oe++], $ > 1 && (ae[_++] = ae[oe++]));
										}
									} else if ((V & 64) === 0) {
										Z = R[(Z & 65535) + (E & (1 << V) - 1)];
										continue r;
									} else {
										u.msg = "invalid distance code", c.mode = a;
										break e;
									}
									break;
								}
							} else if ((V & 64) === 0) {
								Z = C[(Z & 65535) + (E & (1 << V) - 1)];
								continue t;
							} else if (V & 32) {
								c.mode = o;
								break e;
							} else {
								u.msg = "invalid literal/length code", c.mode = a;
								break e;
							}
							break;
						}
					} while (p < y && _ < I);
					$ = A >> 3, p -= $, A -= $ << 3, E &= (1 << A) - 1, u.next_in = p, u.next_out = _, u.avail_in = p < y ? 5 + (y - p) : 5 - (p - y), u.avail_out = _ < I ? 257 + (I - _) : 257 - (_ - I), c.hold = E, c.bits = A;
				};
			}, {}],
			49: [function(r, i, s) {
				"use strict";
				var a = r("../utils/common"), o = r("./adler32"), l = r("./crc32"), u = r("./inffast"), f = r("./inftrees"), c = 0, p = 1, y = 2, _ = 4, N = 5, I = 6, d = 0, v = 1, b = 2, T = -2, F = -3, E = -4, A = -5, C = 8, R = 1, q = 2, M = 3, Z = 4, V = 5, $ = 6, me = 7, oe = 8, xe = 9, ce = 10, ae = 11, Ae = 12, fe = 13, be = 14, ue = 15, Ie = 16, Le = 17, ft = 18, it = 19, Ge = 20, Te = 21, at = 22, Ze = 23, Fe = 24, He = 25, Be = 26, ct = 27, Je = 28, At = 29, Pe = 30, nt = 31, qt = 32, gt = 852, pt = 592, De = 15;
				function bt(k) {
					return (k >>> 24 & 255) + (k >>> 8 & 65280) + ((k & 65280) << 8) + ((k & 255) << 24);
				}
				function tr() {
					this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new a.Buf16(320), this.work = new a.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
				}
				function Wt(k) {
					var j;
					return !k || !k.state ? T : (j = k.state, k.total_in = k.total_out = j.total = 0, k.msg = "", j.wrap && (k.adler = j.wrap & 1), j.mode = R, j.last = 0, j.havedict = 0, j.dmax = 32768, j.head = null, j.hold = 0, j.bits = 0, j.lencode = j.lendyn = new a.Buf32(gt), j.distcode = j.distdyn = new a.Buf32(pt), j.sane = 1, j.back = -1, d);
				}
				function wt(k) {
					var j;
					return !k || !k.state ? T : (j = k.state, j.wsize = 0, j.whave = 0, j.wnext = 0, Wt(k));
				}
				function rr(k, j) {
					var m, Y;
					return !k || !k.state || (Y = k.state, j < 0 ? (m = 0, j = -j) : (m = (j >> 4) + 1, j < 48 && (j &= 15)), j && (j < 8 || j > 15)) ? T : (Y.window !== null && Y.wbits !== j && (Y.window = null), Y.wrap = m, Y.wbits = j, wt(k));
				}
				function jt(k, j) {
					var m, Y;
					return k ? (Y = new tr(), k.state = Y, Y.window = null, m = rr(k, j), m !== d && (k.state = null), m) : T;
				}
				function Ct(k) {
					return jt(k, De);
				}
				var ir = !0, Ht, ot;
				function Tt(k) {
					if (ir) {
						var j;
						for (Ht = new a.Buf32(512), ot = new a.Buf32(32), j = 0; j < 144;) k.lens[j++] = 8;
						for (; j < 256;) k.lens[j++] = 9;
						for (; j < 280;) k.lens[j++] = 7;
						for (; j < 288;) k.lens[j++] = 8;
						for (f(p, k.lens, 0, 288, Ht, 0, k.work, { bits: 9 }), j = 0; j < 32;) k.lens[j++] = 5;
						f(y, k.lens, 0, 32, ot, 0, k.work, { bits: 5 }), ir = !1;
					}
					k.lencode = Ht, k.lenbits = 9, k.distcode = ot, k.distbits = 5;
				}
				function lr(k, j, m, Y) {
					var de, h = k.state;
					return h.window === null && (h.wsize = 1 << h.wbits, h.wnext = 0, h.whave = 0, h.window = new a.Buf8(h.wsize)), Y >= h.wsize ? (a.arraySet(h.window, j, m - h.wsize, h.wsize, 0), h.wnext = 0, h.whave = h.wsize) : (de = h.wsize - h.wnext, de > Y && (de = Y), a.arraySet(h.window, j, m - Y, de, h.wnext), Y -= de, Y ? (a.arraySet(h.window, j, m - Y, Y, 0), h.wnext = Y, h.whave = h.wsize) : (h.wnext += de, h.wnext === h.wsize && (h.wnext = 0), h.whave < h.wsize && (h.whave += de))), 0;
				}
				function x(k, j) {
					var m, Y, de, h, U, W, g, O, z, le, re, ne, Se, Vt, Ve = 0, Ne, et, dt, Et, Tr, Sr, Xe, St, ut = new a.Buf8(4), Gt, Pt, Ui = [
						16,
						17,
						18,
						0,
						8,
						7,
						9,
						6,
						10,
						5,
						11,
						4,
						12,
						3,
						13,
						2,
						14,
						1,
						15
					];
					if (!k || !k.state || !k.output || !k.input && k.avail_in !== 0) return T;
					m = k.state, m.mode === Ae && (m.mode = fe), U = k.next_out, de = k.output, g = k.avail_out, h = k.next_in, Y = k.input, W = k.avail_in, O = m.hold, z = m.bits, le = W, re = g, St = d;
					e: for (;;) switch (m.mode) {
						case R:
							if (m.wrap === 0) {
								m.mode = fe;
								break;
							}
							for (; z < 16;) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							if (m.wrap & 2 && O === 35615) {
								m.check = 0, ut[0] = O & 255, ut[1] = O >>> 8 & 255, m.check = l(m.check, ut, 2, 0), O = 0, z = 0, m.mode = q;
								break;
							}
							if (m.flags = 0, m.head && (m.head.done = !1), !(m.wrap & 1) || (((O & 255) << 8) + (O >> 8)) % 31) {
								k.msg = "incorrect header check", m.mode = Pe;
								break;
							}
							if ((O & 15) !== C) {
								k.msg = "unknown compression method", m.mode = Pe;
								break;
							}
							if (O >>>= 4, z -= 4, Xe = (O & 15) + 8, m.wbits === 0) m.wbits = Xe;
							else if (Xe > m.wbits) {
								k.msg = "invalid window size", m.mode = Pe;
								break;
							}
							m.dmax = 1 << Xe, k.adler = m.check = 1, m.mode = O & 512 ? ce : Ae, O = 0, z = 0;
							break;
						case q:
							for (; z < 16;) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							if (m.flags = O, (m.flags & 255) !== C) {
								k.msg = "unknown compression method", m.mode = Pe;
								break;
							}
							if (m.flags & 57344) {
								k.msg = "unknown header flags set", m.mode = Pe;
								break;
							}
							m.head && (m.head.text = O >> 8 & 1), m.flags & 512 && (ut[0] = O & 255, ut[1] = O >>> 8 & 255, m.check = l(m.check, ut, 2, 0)), O = 0, z = 0, m.mode = M;
						case M:
							for (; z < 32;) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							m.head && (m.head.time = O), m.flags & 512 && (ut[0] = O & 255, ut[1] = O >>> 8 & 255, ut[2] = O >>> 16 & 255, ut[3] = O >>> 24 & 255, m.check = l(m.check, ut, 4, 0)), O = 0, z = 0, m.mode = Z;
						case Z:
							for (; z < 16;) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							m.head && (m.head.xflags = O & 255, m.head.os = O >> 8), m.flags & 512 && (ut[0] = O & 255, ut[1] = O >>> 8 & 255, m.check = l(m.check, ut, 2, 0)), O = 0, z = 0, m.mode = V;
						case V:
							if (m.flags & 1024) {
								for (; z < 16;) {
									if (W === 0) break e;
									W--, O += Y[h++] << z, z += 8;
								}
								m.length = O, m.head && (m.head.extra_len = O), m.flags & 512 && (ut[0] = O & 255, ut[1] = O >>> 8 & 255, m.check = l(m.check, ut, 2, 0)), O = 0, z = 0;
							} else m.head && (m.head.extra = null);
							m.mode = $;
						case $:
							if (m.flags & 1024 && (ne = m.length, ne > W && (ne = W), ne && (m.head && (Xe = m.head.extra_len - m.length, m.head.extra || (m.head.extra = new Array(m.head.extra_len)), a.arraySet(m.head.extra, Y, h, ne, Xe)), m.flags & 512 && (m.check = l(m.check, Y, ne, h)), W -= ne, h += ne, m.length -= ne), m.length)) break e;
							m.length = 0, m.mode = me;
						case me:
							if (m.flags & 2048) {
								if (W === 0) break e;
								ne = 0;
								do
									Xe = Y[h + ne++], m.head && Xe && m.length < 65536 && (m.head.name += String.fromCharCode(Xe));
								while (Xe && ne < W);
								if (m.flags & 512 && (m.check = l(m.check, Y, ne, h)), W -= ne, h += ne, Xe) break e;
							} else m.head && (m.head.name = null);
							m.length = 0, m.mode = oe;
						case oe:
							if (m.flags & 4096) {
								if (W === 0) break e;
								ne = 0;
								do
									Xe = Y[h + ne++], m.head && Xe && m.length < 65536 && (m.head.comment += String.fromCharCode(Xe));
								while (Xe && ne < W);
								if (m.flags & 512 && (m.check = l(m.check, Y, ne, h)), W -= ne, h += ne, Xe) break e;
							} else m.head && (m.head.comment = null);
							m.mode = xe;
						case xe:
							if (m.flags & 512) {
								for (; z < 16;) {
									if (W === 0) break e;
									W--, O += Y[h++] << z, z += 8;
								}
								if (O !== (m.check & 65535)) {
									k.msg = "header crc mismatch", m.mode = Pe;
									break;
								}
								O = 0, z = 0;
							}
							m.head && (m.head.hcrc = m.flags >> 9 & 1, m.head.done = !0), k.adler = m.check = 0, m.mode = Ae;
							break;
						case ce:
							for (; z < 32;) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							k.adler = m.check = bt(O), O = 0, z = 0, m.mode = ae;
						case ae:
							if (m.havedict === 0) return k.next_out = U, k.avail_out = g, k.next_in = h, k.avail_in = W, m.hold = O, m.bits = z, b;
							k.adler = m.check = 1, m.mode = Ae;
						case Ae: if (j === N || j === I) break e;
						case fe:
							if (m.last) {
								O >>>= z & 7, z -= z & 7, m.mode = ct;
								break;
							}
							for (; z < 3;) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							switch (m.last = O & 1, O >>>= 1, z -= 1, O & 3) {
								case 0:
									m.mode = be;
									break;
								case 1:
									if (Tt(m), m.mode = Ge, j === I) {
										O >>>= 2, z -= 2;
										break e;
									}
									break;
								case 2:
									m.mode = Le;
									break;
								case 3: k.msg = "invalid block type", m.mode = Pe;
							}
							O >>>= 2, z -= 2;
							break;
						case be:
							for (O >>>= z & 7, z -= z & 7; z < 32;) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							if ((O & 65535) !== (O >>> 16 ^ 65535)) {
								k.msg = "invalid stored block lengths", m.mode = Pe;
								break;
							}
							if (m.length = O & 65535, O = 0, z = 0, m.mode = ue, j === I) break e;
						case ue: m.mode = Ie;
						case Ie:
							if (ne = m.length, ne) {
								if (ne > W && (ne = W), ne > g && (ne = g), ne === 0) break e;
								a.arraySet(de, Y, h, ne, U), W -= ne, h += ne, g -= ne, U += ne, m.length -= ne;
								break;
							}
							m.mode = Ae;
							break;
						case Le:
							for (; z < 14;) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							if (m.nlen = (O & 31) + 257, O >>>= 5, z -= 5, m.ndist = (O & 31) + 1, O >>>= 5, z -= 5, m.ncode = (O & 15) + 4, O >>>= 4, z -= 4, m.nlen > 286 || m.ndist > 30) {
								k.msg = "too many length or distance symbols", m.mode = Pe;
								break;
							}
							m.have = 0, m.mode = ft;
						case ft:
							for (; m.have < m.ncode;) {
								for (; z < 3;) {
									if (W === 0) break e;
									W--, O += Y[h++] << z, z += 8;
								}
								m.lens[Ui[m.have++]] = O & 7, O >>>= 3, z -= 3;
							}
							for (; m.have < 19;) m.lens[Ui[m.have++]] = 0;
							if (m.lencode = m.lendyn, m.lenbits = 7, Gt = { bits: m.lenbits }, St = f(c, m.lens, 0, 19, m.lencode, 0, m.work, Gt), m.lenbits = Gt.bits, St) {
								k.msg = "invalid code lengths set", m.mode = Pe;
								break;
							}
							m.have = 0, m.mode = it;
						case it:
							for (; m.have < m.nlen + m.ndist;) {
								for (; Ve = m.lencode[O & (1 << m.lenbits) - 1], Ne = Ve >>> 24, et = Ve >>> 16 & 255, dt = Ve & 65535, !(Ne <= z);) {
									if (W === 0) break e;
									W--, O += Y[h++] << z, z += 8;
								}
								if (dt < 16) O >>>= Ne, z -= Ne, m.lens[m.have++] = dt;
								else {
									if (dt === 16) {
										for (Pt = Ne + 2; z < Pt;) {
											if (W === 0) break e;
											W--, O += Y[h++] << z, z += 8;
										}
										if (O >>>= Ne, z -= Ne, m.have === 0) {
											k.msg = "invalid bit length repeat", m.mode = Pe;
											break;
										}
										Xe = m.lens[m.have - 1], ne = 3 + (O & 3), O >>>= 2, z -= 2;
									} else if (dt === 17) {
										for (Pt = Ne + 3; z < Pt;) {
											if (W === 0) break e;
											W--, O += Y[h++] << z, z += 8;
										}
										O >>>= Ne, z -= Ne, Xe = 0, ne = 3 + (O & 7), O >>>= 3, z -= 3;
									} else {
										for (Pt = Ne + 7; z < Pt;) {
											if (W === 0) break e;
											W--, O += Y[h++] << z, z += 8;
										}
										O >>>= Ne, z -= Ne, Xe = 0, ne = 11 + (O & 127), O >>>= 7, z -= 7;
									}
									if (m.have + ne > m.nlen + m.ndist) {
										k.msg = "invalid bit length repeat", m.mode = Pe;
										break;
									}
									for (; ne--;) m.lens[m.have++] = Xe;
								}
							}
							if (m.mode === Pe) break;
							if (m.lens[256] === 0) {
								k.msg = "invalid code -- missing end-of-block", m.mode = Pe;
								break;
							}
							if (m.lenbits = 9, Gt = { bits: m.lenbits }, St = f(p, m.lens, 0, m.nlen, m.lencode, 0, m.work, Gt), m.lenbits = Gt.bits, St) {
								k.msg = "invalid literal/lengths set", m.mode = Pe;
								break;
							}
							if (m.distbits = 6, m.distcode = m.distdyn, Gt = { bits: m.distbits }, St = f(y, m.lens, m.nlen, m.ndist, m.distcode, 0, m.work, Gt), m.distbits = Gt.bits, St) {
								k.msg = "invalid distances set", m.mode = Pe;
								break;
							}
							if (m.mode = Ge, j === I) break e;
						case Ge: m.mode = Te;
						case Te:
							if (W >= 6 && g >= 258) {
								k.next_out = U, k.avail_out = g, k.next_in = h, k.avail_in = W, m.hold = O, m.bits = z, u(k, re), U = k.next_out, de = k.output, g = k.avail_out, h = k.next_in, Y = k.input, W = k.avail_in, O = m.hold, z = m.bits, m.mode === Ae && (m.back = -1);
								break;
							}
							for (m.back = 0; Ve = m.lencode[O & (1 << m.lenbits) - 1], Ne = Ve >>> 24, et = Ve >>> 16 & 255, dt = Ve & 65535, !(Ne <= z);) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							if (et && (et & 240) === 0) {
								for (Et = Ne, Tr = et, Sr = dt; Ve = m.lencode[Sr + ((O & (1 << Et + Tr) - 1) >> Et)], Ne = Ve >>> 24, et = Ve >>> 16 & 255, dt = Ve & 65535, !(Et + Ne <= z);) {
									if (W === 0) break e;
									W--, O += Y[h++] << z, z += 8;
								}
								O >>>= Et, z -= Et, m.back += Et;
							}
							if (O >>>= Ne, z -= Ne, m.back += Ne, m.length = dt, et === 0) {
								m.mode = Be;
								break;
							}
							if (et & 32) {
								m.back = -1, m.mode = Ae;
								break;
							}
							if (et & 64) {
								k.msg = "invalid literal/length code", m.mode = Pe;
								break;
							}
							m.extra = et & 15, m.mode = at;
						case at:
							if (m.extra) {
								for (Pt = m.extra; z < Pt;) {
									if (W === 0) break e;
									W--, O += Y[h++] << z, z += 8;
								}
								m.length += O & (1 << m.extra) - 1, O >>>= m.extra, z -= m.extra, m.back += m.extra;
							}
							m.was = m.length, m.mode = Ze;
						case Ze:
							for (; Ve = m.distcode[O & (1 << m.distbits) - 1], Ne = Ve >>> 24, et = Ve >>> 16 & 255, dt = Ve & 65535, !(Ne <= z);) {
								if (W === 0) break e;
								W--, O += Y[h++] << z, z += 8;
							}
							if ((et & 240) === 0) {
								for (Et = Ne, Tr = et, Sr = dt; Ve = m.distcode[Sr + ((O & (1 << Et + Tr) - 1) >> Et)], Ne = Ve >>> 24, et = Ve >>> 16 & 255, dt = Ve & 65535, !(Et + Ne <= z);) {
									if (W === 0) break e;
									W--, O += Y[h++] << z, z += 8;
								}
								O >>>= Et, z -= Et, m.back += Et;
							}
							if (O >>>= Ne, z -= Ne, m.back += Ne, et & 64) {
								k.msg = "invalid distance code", m.mode = Pe;
								break;
							}
							m.offset = dt, m.extra = et & 15, m.mode = Fe;
						case Fe:
							if (m.extra) {
								for (Pt = m.extra; z < Pt;) {
									if (W === 0) break e;
									W--, O += Y[h++] << z, z += 8;
								}
								m.offset += O & (1 << m.extra) - 1, O >>>= m.extra, z -= m.extra, m.back += m.extra;
							}
							if (m.offset > m.dmax) {
								k.msg = "invalid distance too far back", m.mode = Pe;
								break;
							}
							m.mode = He;
						case He:
							if (g === 0) break e;
							if (ne = re - g, m.offset > ne) {
								if (ne = m.offset - ne, ne > m.whave && m.sane) {
									k.msg = "invalid distance too far back", m.mode = Pe;
									break;
								}
								ne > m.wnext ? (ne -= m.wnext, Se = m.wsize - ne) : Se = m.wnext - ne, ne > m.length && (ne = m.length), Vt = m.window;
							} else Vt = de, Se = U - m.offset, ne = m.length;
							ne > g && (ne = g), g -= ne, m.length -= ne;
							do
								de[U++] = Vt[Se++];
							while (--ne);
							m.length === 0 && (m.mode = Te);
							break;
						case Be:
							if (g === 0) break e;
							de[U++] = m.length, g--, m.mode = Te;
							break;
						case ct:
							if (m.wrap) {
								for (; z < 32;) {
									if (W === 0) break e;
									W--, O |= Y[h++] << z, z += 8;
								}
								if (re -= g, k.total_out += re, m.total += re, re && (k.adler = m.check = m.flags ? l(m.check, de, re, U - re) : o(m.check, de, re, U - re)), re = g, (m.flags ? O : bt(O)) !== m.check) {
									k.msg = "incorrect data check", m.mode = Pe;
									break;
								}
								O = 0, z = 0;
							}
							m.mode = Je;
						case Je:
							if (m.wrap && m.flags) {
								for (; z < 32;) {
									if (W === 0) break e;
									W--, O += Y[h++] << z, z += 8;
								}
								if (O !== (m.total & 4294967295)) {
									k.msg = "incorrect length check", m.mode = Pe;
									break;
								}
								O = 0, z = 0;
							}
							m.mode = At;
						case At:
							St = v;
							break e;
						case Pe:
							St = F;
							break e;
						case nt: return E;
						case qt:
						default: return T;
					}
					return k.next_out = U, k.avail_out = g, k.next_in = h, k.avail_in = W, m.hold = O, m.bits = z, (m.wsize || re !== k.avail_out && m.mode < Pe && (m.mode < ct || j !== _)) && lr(k, k.output, k.next_out, re - k.avail_out) ? (m.mode = nt, E) : (le -= k.avail_in, re -= k.avail_out, k.total_in += le, k.total_out += re, m.total += re, m.wrap && re && (k.adler = m.check = m.flags ? l(m.check, de, re, k.next_out - re) : o(m.check, de, re, k.next_out - re)), k.data_type = m.bits + (m.last ? 64 : 0) + (m.mode === Ae ? 128 : 0) + (m.mode === Ge || m.mode === ue ? 256 : 0), (le === 0 && re === 0 || j === _) && St === d && (St = A), St);
				}
				function G(k) {
					if (!k || !k.state) return T;
					var j = k.state;
					return j.window && (j.window = null), k.state = null, d;
				}
				function K(k, j) {
					var m;
					return !k || !k.state || (m = k.state, (m.wrap & 2) === 0) ? T : (m.head = j, j.done = !1, d);
				}
				function ie(k, j) {
					var m = j.length, Y, de, h;
					return !k || !k.state || (Y = k.state, Y.wrap !== 0 && Y.mode !== ae) ? T : Y.mode === ae && (de = 1, de = o(de, j, m, 0), de !== Y.check) ? F : (h = lr(k, j, m, m), h ? (Y.mode = nt, E) : (Y.havedict = 1, d));
				}
				s.inflateReset = wt, s.inflateReset2 = rr, s.inflateResetKeep = Wt, s.inflateInit = Ct, s.inflateInit2 = jt, s.inflate = x, s.inflateEnd = G, s.inflateGetHeader = K, s.inflateSetDictionary = ie, s.inflateInfo = "pako inflate (from Nodeca project)";
			}, {
				"../utils/common": 41,
				"./adler32": 43,
				"./crc32": 45,
				"./inffast": 48,
				"./inftrees": 50
			}],
			50: [function(r, i, s) {
				"use strict";
				var a = r("../utils/common"), o = 15, l = 852, u = 592, f = 0, c = 1, p = 2, y = [
					3,
					4,
					5,
					6,
					7,
					8,
					9,
					10,
					11,
					13,
					15,
					17,
					19,
					23,
					27,
					31,
					35,
					43,
					51,
					59,
					67,
					83,
					99,
					115,
					131,
					163,
					195,
					227,
					258,
					0,
					0
				], _ = [
					16,
					16,
					16,
					16,
					16,
					16,
					16,
					16,
					17,
					17,
					17,
					17,
					18,
					18,
					18,
					18,
					19,
					19,
					19,
					19,
					20,
					20,
					20,
					20,
					21,
					21,
					21,
					21,
					16,
					72,
					78
				], N = [
					1,
					2,
					3,
					4,
					5,
					7,
					9,
					13,
					17,
					25,
					33,
					49,
					65,
					97,
					129,
					193,
					257,
					385,
					513,
					769,
					1025,
					1537,
					2049,
					3073,
					4097,
					6145,
					8193,
					12289,
					16385,
					24577,
					0,
					0
				], I = [
					16,
					16,
					16,
					16,
					17,
					17,
					18,
					18,
					19,
					19,
					20,
					20,
					21,
					21,
					22,
					22,
					23,
					23,
					24,
					24,
					25,
					25,
					26,
					26,
					27,
					27,
					28,
					28,
					29,
					29,
					64,
					64
				];
				i.exports = function(v, b, T, F, E, A, C, R) {
					var q = R.bits, M = 0, Z = 0, V = 0, $ = 0, me = 0, oe = 0, xe = 0, ce = 0, ae = 0, Ae = 0, fe, be, ue, Ie, Le, ft = null, it = 0, Ge, Te = new a.Buf16(o + 1), at = new a.Buf16(o + 1), Ze = null, Fe = 0, He, Be, ct;
					for (M = 0; M <= o; M++) Te[M] = 0;
					for (Z = 0; Z < F; Z++) Te[b[T + Z]]++;
					for (me = q, $ = o; $ >= 1 && Te[$] === 0; $--);
					if (me > $ && (me = $), $ === 0) return E[A++] = 20971520, E[A++] = 20971520, R.bits = 1, 0;
					for (V = 1; V < $ && Te[V] === 0; V++);
					for (me < V && (me = V), ce = 1, M = 1; M <= o; M++) if (ce <<= 1, ce -= Te[M], ce < 0) return -1;
					if (ce > 0 && (v === f || $ !== 1)) return -1;
					for (at[1] = 0, M = 1; M < o; M++) at[M + 1] = at[M] + Te[M];
					for (Z = 0; Z < F; Z++) b[T + Z] !== 0 && (C[at[b[T + Z]]++] = Z);
					if (v === f ? (ft = Ze = C, Ge = 19) : v === c ? (ft = y, it -= 257, Ze = _, Fe -= 257, Ge = 256) : (ft = N, Ze = I, Ge = -1), Ae = 0, Z = 0, M = V, Le = A, oe = me, xe = 0, ue = -1, ae = 1 << me, Ie = ae - 1, v === c && ae > l || v === p && ae > u) return 1;
					for (;;) {
						He = M - xe, C[Z] < Ge ? (Be = 0, ct = C[Z]) : C[Z] > Ge ? (Be = Ze[Fe + C[Z]], ct = ft[it + C[Z]]) : (Be = 96, ct = 0), fe = 1 << M - xe, be = 1 << oe, V = be;
						do
							be -= fe, E[Le + (Ae >> xe) + be] = He << 24 | Be << 16 | ct | 0;
						while (be !== 0);
						for (fe = 1 << M - 1; Ae & fe;) fe >>= 1;
						if (fe !== 0 ? (Ae &= fe - 1, Ae += fe) : Ae = 0, Z++, --Te[M] === 0) {
							if (M === $) break;
							M = b[T + C[Z]];
						}
						if (M > me && (Ae & Ie) !== ue) {
							for (xe === 0 && (xe = me), Le += V, oe = M - xe, ce = 1 << oe; oe + xe < $ && (ce -= Te[oe + xe], !(ce <= 0));) oe++, ce <<= 1;
							if (ae += 1 << oe, v === c && ae > l || v === p && ae > u) return 1;
							ue = Ae & Ie, E[ue] = me << 24 | oe << 16 | Le - A | 0;
						}
					}
					return Ae !== 0 && (E[Le + Ae] = M - xe << 24 | 4194304), R.bits = me, 0;
				};
			}, { "../utils/common": 41 }],
			51: [function(r, i, s) {
				"use strict";
				i.exports = {
					2: "need dictionary",
					1: "stream end",
					0: "",
					"-1": "file error",
					"-2": "stream error",
					"-3": "data error",
					"-4": "insufficient memory",
					"-5": "buffer error",
					"-6": "incompatible version"
				};
			}, {}],
			52: [function(r, i, s) {
				"use strict";
				var a = r("../utils/common"), o = 4, l = 0, u = 1, f = 2;
				function c(x) {
					for (var G = x.length; --G >= 0;) x[G] = 0;
				}
				var p = 0, y = 1, _ = 2, N = 3, I = 258, d = 29, v = 256, b = v + 1 + d, T = 30, F = 19, E = 2 * b + 1, A = 15, C = 16, R = 7, q = 256, M = 16, Z = 17, V = 18, $ = [
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					1,
					1,
					1,
					1,
					2,
					2,
					2,
					2,
					3,
					3,
					3,
					3,
					4,
					4,
					4,
					4,
					5,
					5,
					5,
					5,
					0
				], me = [
					0,
					0,
					0,
					0,
					1,
					1,
					2,
					2,
					3,
					3,
					4,
					4,
					5,
					5,
					6,
					6,
					7,
					7,
					8,
					8,
					9,
					9,
					10,
					10,
					11,
					11,
					12,
					12,
					13,
					13
				], oe = [
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					2,
					3,
					7
				], xe = [
					16,
					17,
					18,
					0,
					8,
					7,
					9,
					6,
					10,
					5,
					11,
					4,
					12,
					3,
					13,
					2,
					14,
					1,
					15
				], ce = 512, ae = new Array((b + 2) * 2);
				c(ae);
				var Ae = new Array(T * 2);
				c(Ae);
				var fe = new Array(ce);
				c(fe);
				var be = new Array(I - N + 1);
				c(be);
				var ue = new Array(d);
				c(ue);
				var Ie = new Array(T);
				c(Ie);
				function Le(x, G, K, ie, k) {
					this.static_tree = x, this.extra_bits = G, this.extra_base = K, this.elems = ie, this.max_length = k, this.has_stree = x && x.length;
				}
				var ft, it, Ge;
				function Te(x, G) {
					this.dyn_tree = x, this.max_code = 0, this.stat_desc = G;
				}
				function at(x) {
					return x < 256 ? fe[x] : fe[256 + (x >>> 7)];
				}
				function Ze(x, G) {
					x.pending_buf[x.pending++] = G & 255, x.pending_buf[x.pending++] = G >>> 8 & 255;
				}
				function Fe(x, G, K) {
					x.bi_valid > C - K ? (x.bi_buf |= G << x.bi_valid & 65535, Ze(x, x.bi_buf), x.bi_buf = G >> C - x.bi_valid, x.bi_valid += K - C) : (x.bi_buf |= G << x.bi_valid & 65535, x.bi_valid += K);
				}
				function He(x, G, K) {
					Fe(x, K[G * 2], K[G * 2 + 1]);
				}
				function Be(x, G) {
					var K = 0;
					do
						K |= x & 1, x >>>= 1, K <<= 1;
					while (--G > 0);
					return K >>> 1;
				}
				function ct(x) {
					x.bi_valid === 16 ? (Ze(x, x.bi_buf), x.bi_buf = 0, x.bi_valid = 0) : x.bi_valid >= 8 && (x.pending_buf[x.pending++] = x.bi_buf & 255, x.bi_buf >>= 8, x.bi_valid -= 8);
				}
				function Je(x, G) {
					var K = G.dyn_tree, ie = G.max_code, k = G.stat_desc.static_tree, j = G.stat_desc.has_stree, m = G.stat_desc.extra_bits, Y = G.stat_desc.extra_base, de = G.stat_desc.max_length, h, U, W, g, O, z, le = 0;
					for (g = 0; g <= A; g++) x.bl_count[g] = 0;
					for (K[x.heap[x.heap_max] * 2 + 1] = 0, h = x.heap_max + 1; h < E; h++) U = x.heap[h], g = K[K[U * 2 + 1] * 2 + 1] + 1, g > de && (g = de, le++), K[U * 2 + 1] = g, !(U > ie) && (x.bl_count[g]++, O = 0, U >= Y && (O = m[U - Y]), z = K[U * 2], x.opt_len += z * (g + O), j && (x.static_len += z * (k[U * 2 + 1] + O)));
					if (le !== 0) {
						do {
							for (g = de - 1; x.bl_count[g] === 0;) g--;
							x.bl_count[g]--, x.bl_count[g + 1] += 2, x.bl_count[de]--, le -= 2;
						} while (le > 0);
						for (g = de; g !== 0; g--) for (U = x.bl_count[g]; U !== 0;) W = x.heap[--h], !(W > ie) && (K[W * 2 + 1] !== g && (x.opt_len += (g - K[W * 2 + 1]) * K[W * 2], K[W * 2 + 1] = g), U--);
					}
				}
				function At(x, G, K) {
					var ie = new Array(A + 1), k = 0, j, m;
					for (j = 1; j <= A; j++) ie[j] = k = k + K[j - 1] << 1;
					for (m = 0; m <= G; m++) {
						var Y = x[m * 2 + 1];
						Y !== 0 && (x[m * 2] = Be(ie[Y]++, Y));
					}
				}
				function Pe() {
					var x, G, K, ie, k, j = new Array(A + 1);
					for (K = 0, ie = 0; ie < d - 1; ie++) for (ue[ie] = K, x = 0; x < 1 << $[ie]; x++) be[K++] = ie;
					for (be[K - 1] = ie, k = 0, ie = 0; ie < 16; ie++) for (Ie[ie] = k, x = 0; x < 1 << me[ie]; x++) fe[k++] = ie;
					for (k >>= 7; ie < T; ie++) for (Ie[ie] = k << 7, x = 0; x < 1 << me[ie] - 7; x++) fe[256 + k++] = ie;
					for (G = 0; G <= A; G++) j[G] = 0;
					for (x = 0; x <= 143;) ae[x * 2 + 1] = 8, x++, j[8]++;
					for (; x <= 255;) ae[x * 2 + 1] = 9, x++, j[9]++;
					for (; x <= 279;) ae[x * 2 + 1] = 7, x++, j[7]++;
					for (; x <= 287;) ae[x * 2 + 1] = 8, x++, j[8]++;
					for (At(ae, b + 1, j), x = 0; x < T; x++) Ae[x * 2 + 1] = 5, Ae[x * 2] = Be(x, 5);
					ft = new Le(ae, $, v + 1, b, A), it = new Le(Ae, me, 0, T, A), Ge = new Le(new Array(0), oe, 0, F, R);
				}
				function nt(x) {
					var G;
					for (G = 0; G < b; G++) x.dyn_ltree[G * 2] = 0;
					for (G = 0; G < T; G++) x.dyn_dtree[G * 2] = 0;
					for (G = 0; G < F; G++) x.bl_tree[G * 2] = 0;
					x.dyn_ltree[q * 2] = 1, x.opt_len = x.static_len = 0, x.last_lit = x.matches = 0;
				}
				function qt(x) {
					x.bi_valid > 8 ? Ze(x, x.bi_buf) : x.bi_valid > 0 && (x.pending_buf[x.pending++] = x.bi_buf), x.bi_buf = 0, x.bi_valid = 0;
				}
				function gt(x, G, K, ie) {
					qt(x), ie && (Ze(x, K), Ze(x, ~K)), a.arraySet(x.pending_buf, x.window, G, K, x.pending), x.pending += K;
				}
				function pt(x, G, K, ie) {
					var k = G * 2, j = K * 2;
					return x[k] < x[j] || x[k] === x[j] && ie[G] <= ie[K];
				}
				function We(x, G, K) {
					for (var ie = x.heap[K], k = K << 1; k <= x.heap_len && (k < x.heap_len && pt(G, x.heap[k + 1], x.heap[k], x.depth) && k++, !pt(G, ie, x.heap[k], x.depth));) x.heap[K] = x.heap[k], K = k, k <<= 1;
					x.heap[K] = ie;
				}
				function De(x, G, K) {
					var ie, k, j = 0, m, Y;
					if (x.last_lit !== 0) do
						ie = x.pending_buf[x.d_buf + j * 2] << 8 | x.pending_buf[x.d_buf + j * 2 + 1], k = x.pending_buf[x.l_buf + j], j++, ie === 0 ? He(x, k, G) : (m = be[k], He(x, m + v + 1, G), Y = $[m], Y !== 0 && (k -= ue[m], Fe(x, k, Y)), ie--, m = at(ie), He(x, m, K), Y = me[m], Y !== 0 && (ie -= Ie[m], Fe(x, ie, Y)));
					while (j < x.last_lit);
					He(x, q, G);
				}
				function bt(x, G) {
					var K = G.dyn_tree, ie = G.stat_desc.static_tree, k = G.stat_desc.has_stree, j = G.stat_desc.elems, m, Y, de = -1, h;
					for (x.heap_len = 0, x.heap_max = E, m = 0; m < j; m++) K[m * 2] !== 0 ? (x.heap[++x.heap_len] = de = m, x.depth[m] = 0) : K[m * 2 + 1] = 0;
					for (; x.heap_len < 2;) h = x.heap[++x.heap_len] = de < 2 ? ++de : 0, K[h * 2] = 1, x.depth[h] = 0, x.opt_len--, k && (x.static_len -= ie[h * 2 + 1]);
					for (G.max_code = de, m = x.heap_len >> 1; m >= 1; m--) We(x, K, m);
					h = j;
					do
						m = x.heap[1], x.heap[1] = x.heap[x.heap_len--], We(x, K, 1), Y = x.heap[1], x.heap[--x.heap_max] = m, x.heap[--x.heap_max] = Y, K[h * 2] = K[m * 2] + K[Y * 2], x.depth[h] = (x.depth[m] >= x.depth[Y] ? x.depth[m] : x.depth[Y]) + 1, K[m * 2 + 1] = K[Y * 2 + 1] = h, x.heap[1] = h++, We(x, K, 1);
					while (x.heap_len >= 2);
					x.heap[--x.heap_max] = x.heap[1], Je(x, G), At(K, de, x.bl_count);
				}
				function tr(x, G, K) {
					var ie, k = -1, j, m = G[1], Y = 0, de = 7, h = 4;
					for (m === 0 && (de = 138, h = 3), G[(K + 1) * 2 + 1] = 65535, ie = 0; ie <= K; ie++) j = m, m = G[(ie + 1) * 2 + 1], !(++Y < de && j === m) && (Y < h ? x.bl_tree[j * 2] += Y : j !== 0 ? (j !== k && x.bl_tree[j * 2]++, x.bl_tree[M * 2]++) : Y <= 10 ? x.bl_tree[Z * 2]++ : x.bl_tree[V * 2]++, Y = 0, k = j, m === 0 ? (de = 138, h = 3) : j === m ? (de = 6, h = 3) : (de = 7, h = 4));
				}
				function Wt(x, G, K) {
					var ie, k = -1, j, m = G[1], Y = 0, de = 7, h = 4;
					for (m === 0 && (de = 138, h = 3), ie = 0; ie <= K; ie++) if (j = m, m = G[(ie + 1) * 2 + 1], !(++Y < de && j === m)) {
						if (Y < h) do
							He(x, j, x.bl_tree);
						while (--Y !== 0);
						else j !== 0 ? (j !== k && (He(x, j, x.bl_tree), Y--), He(x, M, x.bl_tree), Fe(x, Y - 3, 2)) : Y <= 10 ? (He(x, Z, x.bl_tree), Fe(x, Y - 3, 3)) : (He(x, V, x.bl_tree), Fe(x, Y - 11, 7));
						Y = 0, k = j, m === 0 ? (de = 138, h = 3) : j === m ? (de = 6, h = 3) : (de = 7, h = 4);
					}
				}
				function wt(x) {
					var G;
					for (tr(x, x.dyn_ltree, x.l_desc.max_code), tr(x, x.dyn_dtree, x.d_desc.max_code), bt(x, x.bl_desc), G = F - 1; G >= 3 && x.bl_tree[xe[G] * 2 + 1] === 0; G--);
					return x.opt_len += 3 * (G + 1) + 5 + 5 + 4, G;
				}
				function rr(x, G, K, ie) {
					var k;
					for (Fe(x, G - 257, 5), Fe(x, K - 1, 5), Fe(x, ie - 4, 4), k = 0; k < ie; k++) Fe(x, x.bl_tree[xe[k] * 2 + 1], 3);
					Wt(x, x.dyn_ltree, G - 1), Wt(x, x.dyn_dtree, K - 1);
				}
				function jt(x) {
					var G = 4093624447, K;
					for (K = 0; K <= 31; K++, G >>>= 1) if (G & 1 && x.dyn_ltree[K * 2] !== 0) return l;
					if (x.dyn_ltree[18] !== 0 || x.dyn_ltree[20] !== 0 || x.dyn_ltree[26] !== 0) return u;
					for (K = 32; K < v; K++) if (x.dyn_ltree[K * 2] !== 0) return u;
					return l;
				}
				var Ct = !1;
				function ir(x) {
					Ct || (Pe(), Ct = !0), x.l_desc = new Te(x.dyn_ltree, ft), x.d_desc = new Te(x.dyn_dtree, it), x.bl_desc = new Te(x.bl_tree, Ge), x.bi_buf = 0, x.bi_valid = 0, nt(x);
				}
				function Ht(x, G, K, ie) {
					Fe(x, (p << 1) + (ie ? 1 : 0), 3), gt(x, G, K, !0);
				}
				function ot(x) {
					Fe(x, y << 1, 3), He(x, q, ae), ct(x);
				}
				function Tt(x, G, K, ie) {
					var k, j, m = 0;
					x.level > 0 ? (x.strm.data_type === f && (x.strm.data_type = jt(x)), bt(x, x.l_desc), bt(x, x.d_desc), m = wt(x), k = x.opt_len + 3 + 7 >>> 3, j = x.static_len + 3 + 7 >>> 3, j <= k && (k = j)) : k = j = K + 5, K + 4 <= k && G !== -1 ? Ht(x, G, K, ie) : x.strategy === o || j === k ? (Fe(x, (y << 1) + (ie ? 1 : 0), 3), De(x, ae, Ae)) : (Fe(x, (_ << 1) + (ie ? 1 : 0), 3), rr(x, x.l_desc.max_code + 1, x.d_desc.max_code + 1, m + 1), De(x, x.dyn_ltree, x.dyn_dtree)), nt(x), ie && qt(x);
				}
				function lr(x, G, K) {
					return x.pending_buf[x.d_buf + x.last_lit * 2] = G >>> 8 & 255, x.pending_buf[x.d_buf + x.last_lit * 2 + 1] = G & 255, x.pending_buf[x.l_buf + x.last_lit] = K & 255, x.last_lit++, G === 0 ? x.dyn_ltree[K * 2]++ : (x.matches++, G--, x.dyn_ltree[(be[K] + v + 1) * 2]++, x.dyn_dtree[at(G) * 2]++), x.last_lit === x.lit_bufsize - 1;
				}
				s._tr_init = ir, s._tr_stored_block = Ht, s._tr_flush_block = Tt, s._tr_tally = lr, s._tr_align = ot;
			}, { "../utils/common": 41 }],
			53: [function(r, i, s) {
				"use strict";
				function a() {
					this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
				}
				i.exports = a;
			}, {}],
			54: [function(r, i, s) {
				(function(a) {
					(function(o, l) {
						"use strict";
						if (o.setImmediate) return;
						var u = 1, f = {}, c = !1, p = o.document, y;
						function _(R) {
							typeof R != "function" && (R = new Function("" + R));
							for (var q = new Array(arguments.length - 1), M = 0; M < q.length; M++) q[M] = arguments[M + 1];
							return f[u] = {
								callback: R,
								args: q
							}, y(u), u++;
						}
						function N(R) {
							delete f[R];
						}
						function I(R) {
							var q = R.callback, M = R.args;
							switch (M.length) {
								case 0:
									q();
									break;
								case 1:
									q(M[0]);
									break;
								case 2:
									q(M[0], M[1]);
									break;
								case 3:
									q(M[0], M[1], M[2]);
									break;
								default: q.apply(l, M);
							}
						}
						function d(R) {
							if (c) setTimeout(d, 0, R);
							else {
								var q = f[R];
								if (q) {
									c = !0;
									try {
										I(q);
									} finally {
										N(R), c = !1;
									}
								}
							}
						}
						function v() {
							y = function(R) {
								process.nextTick(function() {
									d(R);
								});
							};
						}
						function b() {
							if (o.postMessage && !o.importScripts) {
								var R = !0, q = o.onmessage;
								return o.onmessage = function() {
									R = !1;
								}, o.postMessage("", "*"), o.onmessage = q, R;
							}
						}
						function T() {
							var R = "setImmediate$" + Math.random() + "$", q = function(M) {
								M.source === o && typeof M.data == "string" && M.data.indexOf(R) === 0 && d(+M.data.slice(R.length));
							};
							o.addEventListener ? o.addEventListener("message", q, !1) : o.attachEvent("onmessage", q), y = function(M) {
								o.postMessage(R + M, "*");
							};
						}
						function F() {
							var R = new MessageChannel();
							R.port1.onmessage = function(q) {
								var M = q.data;
								d(M);
							}, y = function(q) {
								R.port2.postMessage(q);
							};
						}
						function E() {
							var R = p.documentElement;
							y = function(q) {
								var M = p.createElement("script");
								M.onreadystatechange = function() {
									d(q), M.onreadystatechange = null, R.removeChild(M), M = null;
								}, R.appendChild(M);
							};
						}
						function A() {
							y = function(R) {
								setTimeout(d, 0, R);
							};
						}
						var C = Object.getPrototypeOf && Object.getPrototypeOf(o);
						C = C && C.setTimeout ? C : o, {}.toString.call(o.process) === "[object process]" ? v() : b() ? T() : o.MessageChannel ? F() : p && "onreadystatechange" in p.createElement("script") ? E() : A(), C.setImmediate = _, C.clearImmediate = N;
					})(typeof self == "undefined" ? typeof a == "undefined" ? this : a : self);
				}).call(this, typeof global != "undefined" ? global : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
			}, {}]
		}, {}, [10])(10);
	});
});
var Ml = pe((Fl, oa) => {
	(function(n) {
		if (typeof Fl == "object" && typeof oa != "undefined") oa.exports = n();
		else if (typeof define == "function" && define.amd) define([], n);
		else {
			var e;
			typeof window != "undefined" ? e = window : typeof global != "undefined" ? e = global : typeof self != "undefined" ? e = self : e = this, e.localforage = n();
		}
	})(function() {
		return (function r(i, s, a) {
			function o(f, c) {
				if (!s[f]) {
					if (!i[f]) {
						var p = typeof Xt == "function" && Xt;
						if (!c && p) return p(f, !0);
						if (l) return l(f, !0);
						var y = /* @__PURE__ */ new Error("Cannot find module '" + f + "'");
						throw y.code = "MODULE_NOT_FOUND", y;
					}
					var _ = s[f] = { exports: {} };
					i[f][0].call(_.exports, function(N) {
						var I = i[f][1][N];
						return o(I || N);
					}, _, _.exports, r, i, s, a);
				}
				return s[f].exports;
			}
			for (var l = typeof Xt == "function" && Xt, u = 0; u < a.length; u++) o(a[u]);
			return o;
		})({
			1: [function(r, i, s) {
				(function(a) {
					"use strict";
					var o = a.MutationObserver || a.WebKitMutationObserver, l;
					if (o) {
						var u = 0, f = new o(N), c = a.document.createTextNode("");
						f.observe(c, { characterData: !0 }), l = function() {
							c.data = u = ++u % 2;
						};
					} else if (!a.setImmediate && typeof a.MessageChannel != "undefined") {
						var p = new a.MessageChannel();
						p.port1.onmessage = N, l = function() {
							p.port2.postMessage(0);
						};
					} else "document" in a && "onreadystatechange" in a.document.createElement("script") ? l = function() {
						var d = a.document.createElement("script");
						d.onreadystatechange = function() {
							N(), d.onreadystatechange = null, d.parentNode.removeChild(d), d = null;
						}, a.document.documentElement.appendChild(d);
					} : l = function() {
						setTimeout(N, 0);
					};
					var y, _ = [];
					function N() {
						y = !0;
						for (var d, v, b = _.length; b;) {
							for (v = _, _ = [], d = -1; ++d < b;) v[d]();
							b = _.length;
						}
						y = !1;
					}
					i.exports = I;
					function I(d) {
						_.push(d) === 1 && !y && l();
					}
				}).call(this, typeof global != "undefined" ? global : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
			}, {}],
			2: [function(r, i, s) {
				"use strict";
				var a = r(1);
				function o() {}
				var l = {}, u = ["REJECTED"], f = ["FULFILLED"], c = ["PENDING"];
				i.exports = p;
				function p(E) {
					if (typeof E != "function") throw new TypeError("resolver must be a function");
					this.state = c, this.queue = [], this.outcome = void 0, E !== o && I(this, E);
				}
				p.prototype.catch = function(E) {
					return this.then(null, E);
				}, p.prototype.then = function(E, A) {
					if (typeof E != "function" && this.state === f || typeof A != "function" && this.state === u) return this;
					var C = new this.constructor(o);
					if (this.state !== c) _(C, this.state === f ? E : A, this.outcome);
					else this.queue.push(new y(C, E, A));
					return C;
				};
				function y(E, A, C) {
					this.promise = E, typeof A == "function" && (this.onFulfilled = A, this.callFulfilled = this.otherCallFulfilled), typeof C == "function" && (this.onRejected = C, this.callRejected = this.otherCallRejected);
				}
				y.prototype.callFulfilled = function(E) {
					l.resolve(this.promise, E);
				}, y.prototype.otherCallFulfilled = function(E) {
					_(this.promise, this.onFulfilled, E);
				}, y.prototype.callRejected = function(E) {
					l.reject(this.promise, E);
				}, y.prototype.otherCallRejected = function(E) {
					_(this.promise, this.onRejected, E);
				};
				function _(E, A, C) {
					a(function() {
						var R;
						try {
							R = A(C);
						} catch (q) {
							return l.reject(E, q);
						}
						R === E ? l.reject(E, /* @__PURE__ */ new TypeError("Cannot resolve promise with itself")) : l.resolve(E, R);
					});
				}
				l.resolve = function(E, A) {
					var C = d(N, A);
					if (C.status === "error") return l.reject(E, C.value);
					var R = C.value;
					if (R) I(E, R);
					else {
						E.state = f, E.outcome = A;
						for (var q = -1, M = E.queue.length; ++q < M;) E.queue[q].callFulfilled(A);
					}
					return E;
				}, l.reject = function(E, A) {
					E.state = u, E.outcome = A;
					for (var C = -1, R = E.queue.length; ++C < R;) E.queue[C].callRejected(A);
					return E;
				};
				function N(E) {
					var A = E && E.then;
					if (E && (typeof E == "object" || typeof E == "function") && typeof A == "function") return function() {
						A.apply(E, arguments);
					};
				}
				function I(E, A) {
					var C = !1;
					function R(V) {
						C || (C = !0, l.reject(E, V));
					}
					function q(V) {
						C || (C = !0, l.resolve(E, V));
					}
					function M() {
						A(q, R);
					}
					var Z = d(M);
					Z.status === "error" && R(Z.value);
				}
				function d(E, A) {
					var C = {};
					try {
						C.value = E(A), C.status = "success";
					} catch (R) {
						C.status = "error", C.value = R;
					}
					return C;
				}
				p.resolve = v;
				function v(E) {
					return E instanceof this ? E : l.resolve(new this(o), E);
				}
				p.reject = b;
				function b(E) {
					var A = new this(o);
					return l.reject(A, E);
				}
				p.all = T;
				function T(E) {
					var A = this;
					if (Object.prototype.toString.call(E) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
					var C = E.length, R = !1;
					if (!C) return this.resolve([]);
					for (var q = new Array(C), M = 0, Z = -1, V = new this(o); ++Z < C;) $(E[Z], Z);
					return V;
					function $(me, oe) {
						A.resolve(me).then(xe, function(ce) {
							R || (R = !0, l.reject(V, ce));
						});
						function xe(ce) {
							q[oe] = ce, ++M === C && !R && (R = !0, l.resolve(V, q));
						}
					}
				}
				p.race = F;
				function F(E) {
					var A = this;
					if (Object.prototype.toString.call(E) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
					var C = E.length, R = !1;
					if (!C) return this.resolve([]);
					for (var q = -1, M = new this(o); ++q < C;) Z(E[q]);
					return M;
					function Z(V) {
						A.resolve(V).then(function($) {
							R || (R = !0, l.resolve(M, $));
						}, function($) {
							R || (R = !0, l.reject(M, $));
						});
					}
				}
			}, { 1: 1 }],
			3: [function(r, i, s) {
				(function(a) {
					"use strict";
					typeof a.Promise != "function" && (a.Promise = r(2));
				}).call(this, typeof global != "undefined" ? global : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
			}, { 2: 2 }],
			4: [function(r, i, s) {
				"use strict";
				var a = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(w) {
					return typeof w;
				} : function(w) {
					return w && typeof Symbol == "function" && w.constructor === Symbol && w !== Symbol.prototype ? "symbol" : typeof w;
				};
				function o(w, S) {
					if (!(w instanceof S)) throw new TypeError("Cannot call a class as a function");
				}
				function l() {
					try {
						if (typeof indexedDB != "undefined") return indexedDB;
						if (typeof webkitIndexedDB != "undefined") return webkitIndexedDB;
						if (typeof mozIndexedDB != "undefined") return mozIndexedDB;
						if (typeof OIndexedDB != "undefined") return OIndexedDB;
						if (typeof msIndexedDB != "undefined") return msIndexedDB;
					} catch {
						return;
					}
				}
				var u = l();
				function f() {
					try {
						if (!u || !u.open) return !1;
						var w = typeof openDatabase != "undefined" && /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/BlackBerry/.test(navigator.platform), S = typeof fetch == "function" && fetch.toString().indexOf("[native code") !== -1;
						return (!w || S) && typeof indexedDB != "undefined" && typeof IDBKeyRange != "undefined";
					} catch {
						return !1;
					}
				}
				function c(w, S) {
					w = w || [], S = S || {};
					try {
						return new Blob(w, S);
					} catch (L) {
						if (L.name !== "TypeError") throw L;
						for (var B = new (typeof BlobBuilder != "undefined" ? BlobBuilder : typeof MSBlobBuilder != "undefined" ? MSBlobBuilder : typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : WebKitBlobBuilder)(), P = 0; P < w.length; P += 1) B.append(w[P]);
						return B.getBlob(S.type);
					}
				}
				typeof Promise == "undefined" && r(3);
				var p = Promise;
				function y(w, S) {
					S && w.then(function(D) {
						S(null, D);
					}, function(D) {
						S(D);
					});
				}
				function _(w, S, D) {
					typeof S == "function" && w.then(S), typeof D == "function" && w.catch(D);
				}
				function N(w) {
					return typeof w != "string" && (console.warn(w + " used as a key, but it is not a string."), w = String(w)), w;
				}
				function I() {
					if (arguments.length && typeof arguments[arguments.length - 1] == "function") return arguments[arguments.length - 1];
				}
				var d = "local-forage-detect-blob-support", v = void 0, b = {}, T = Object.prototype.toString, F = "readonly", E = "readwrite";
				function A(w) {
					for (var S = w.length, D = new ArrayBuffer(S), B = new Uint8Array(D), P = 0; P < S; P++) B[P] = w.charCodeAt(P);
					return D;
				}
				function C(w) {
					return new p(function(S) {
						var D = w.transaction(d, E), B = c([""]);
						D.objectStore(d).put(B, "key"), D.onabort = function(P) {
							P.preventDefault(), P.stopPropagation(), S(!1);
						}, D.oncomplete = function() {
							var P = navigator.userAgent.match(/Chrome\/(\d+)/);
							S(navigator.userAgent.match(/Edge\//) || !P || parseInt(P[1], 10) >= 43);
						};
					}).catch(function() {
						return !1;
					});
				}
				function R(w) {
					return typeof v == "boolean" ? p.resolve(v) : C(w).then(function(S) {
						return v = S, v;
					});
				}
				function q(w) {
					var S = b[w.name], D = {};
					D.promise = new p(function(B, P) {
						D.resolve = B, D.reject = P;
					}), S.deferredOperations.push(D), S.dbReady ? S.dbReady = S.dbReady.then(function() {
						return D.promise;
					}) : S.dbReady = D.promise;
				}
				function M(w) {
					var D = b[w.name].deferredOperations.pop();
					if (D) return D.resolve(), D.promise;
				}
				function Z(w, S) {
					var B = b[w.name].deferredOperations.pop();
					if (B) return B.reject(S), B.promise;
				}
				function V(w, S) {
					return new p(function(D, B) {
						if (b[w.name] = b[w.name] || ue(), w.db) if (S) q(w), w.db.close();
						else return D(w.db);
						var P = [w.name];
						S && P.push(w.version);
						var L = u.open.apply(u, P);
						S && (L.onupgradeneeded = function(H) {
							var X = L.result;
							try {
								X.createObjectStore(w.storeName), H.oldVersion <= 1 && X.createObjectStore(d);
							} catch (Q) {
								if (Q.name === "ConstraintError") console.warn("The database \"" + w.name + "\" has been upgraded from version " + H.oldVersion + " to version " + H.newVersion + ", but the storage \"" + w.storeName + "\" already exists.");
								else throw Q;
							}
						}), L.onerror = function(H) {
							H.preventDefault(), B(L.error);
						}, L.onsuccess = function() {
							var H = L.result;
							H.onversionchange = function(X) {
								X.target.close();
							}, D(H), M(w);
						};
					});
				}
				function $(w) {
					return V(w, !1);
				}
				function me(w) {
					return V(w, !0);
				}
				function oe(w, S) {
					if (!w.db) return !0;
					var D = !w.db.objectStoreNames.contains(w.storeName), B = w.version < w.db.version, P = w.version > w.db.version;
					if (B && (w.version !== S && console.warn("The database \"" + w.name + `" can't be downgraded from version ` + w.db.version + " to version " + w.version + "."), w.version = w.db.version), P || D) {
						if (D) {
							var L = w.db.version + 1;
							L > w.version && (w.version = L);
						}
						return !0;
					}
					return !1;
				}
				function xe(w) {
					return new p(function(S, D) {
						var B = new FileReader();
						B.onerror = D, B.onloadend = function(P) {
							S({
								__local_forage_encoded_blob: !0,
								data: btoa(P.target.result || ""),
								type: w.type
							});
						}, B.readAsBinaryString(w);
					});
				}
				function ce(w) {
					return c([A(atob(w.data))], { type: w.type });
				}
				function ae(w) {
					return w && w.__local_forage_encoded_blob;
				}
				function Ae(w) {
					var S = this, D = S._initReady().then(function() {
						var B = b[S._dbInfo.name];
						if (B && B.dbReady) return B.dbReady;
					});
					return _(D, w, w), D;
				}
				function fe(w) {
					q(w);
					for (var S = b[w.name], D = S.forages, B = 0; B < D.length; B++) {
						var P = D[B];
						P._dbInfo.db && (P._dbInfo.db.close(), P._dbInfo.db = null);
					}
					return w.db = null, $(w).then(function(L) {
						return w.db = L, oe(w) ? me(w) : L;
					}).then(function(L) {
						w.db = S.db = L;
						for (var H = 0; H < D.length; H++) D[H]._dbInfo.db = L;
					}).catch(function(L) {
						throw Z(w, L), L;
					});
				}
				function be(w, S, D, B) {
					B === void 0 && (B = 1);
					try {
						D(null, w.db.transaction(w.storeName, S));
					} catch (L) {
						if (B > 0 && (!w.db || L.name === "InvalidStateError" || L.name === "NotFoundError")) return p.resolve().then(function() {
							if (!w.db || L.name === "NotFoundError" && !w.db.objectStoreNames.contains(w.storeName) && w.version <= w.db.version) return w.db && (w.version = w.db.version + 1), me(w);
						}).then(function() {
							return fe(w).then(function() {
								be(w, S, D, B - 1);
							});
						}).catch(D);
						D(L);
					}
				}
				function ue() {
					return {
						forages: [],
						db: null,
						dbReady: null,
						deferredOperations: []
					};
				}
				function Ie(w) {
					var S = this, D = { db: null };
					if (w) for (var B in w) D[B] = w[B];
					var P = b[D.name];
					P || (P = ue(), b[D.name] = P), P.forages.push(S), S._initReady || (S._initReady = S.ready, S.ready = Ae);
					var L = [];
					function H() {
						return p.resolve();
					}
					for (var X = 0; X < P.forages.length; X++) {
						var Q = P.forages[X];
						Q !== S && L.push(Q._initReady().catch(H));
					}
					var J = P.forages.slice(0);
					return p.all(L).then(function() {
						return D.db = P.db, $(D);
					}).then(function(te) {
						return D.db = te, oe(D, S._defaultConfig.version) ? me(D) : te;
					}).then(function(te) {
						D.db = P.db = te, S._dbInfo = D;
						for (var he = 0; he < J.length; he++) {
							var Ce = J[he];
							Ce !== S && (Ce._dbInfo.db = D.db, Ce._dbInfo.version = D.version);
						}
					});
				}
				function Le(w, S) {
					var D = this;
					w = N(w);
					var B = new p(function(P, L) {
						D.ready().then(function() {
							be(D._dbInfo, F, function(H, X) {
								if (H) return L(H);
								try {
									var J = X.objectStore(D._dbInfo.storeName).get(w);
									J.onsuccess = function() {
										var te = J.result;
										te === void 0 && (te = null), ae(te) && (te = ce(te)), P(te);
									}, J.onerror = function() {
										L(J.error);
									};
								} catch (te) {
									L(te);
								}
							});
						}).catch(L);
					});
					return y(B, S), B;
				}
				function ft(w, S) {
					var D = this, B = new p(function(P, L) {
						D.ready().then(function() {
							be(D._dbInfo, F, function(H, X) {
								if (H) return L(H);
								try {
									var J = X.objectStore(D._dbInfo.storeName).openCursor(), te = 1;
									J.onsuccess = function() {
										var he = J.result;
										if (he) {
											var Ce = he.value;
											ae(Ce) && (Ce = ce(Ce));
											var Me = w(Ce, he.key, te++);
											Me !== void 0 ? P(Me) : he.continue();
										} else P();
									}, J.onerror = function() {
										L(J.error);
									};
								} catch (he) {
									L(he);
								}
							});
						}).catch(L);
					});
					return y(B, S), B;
				}
				function it(w, S, D) {
					var B = this;
					w = N(w);
					var P = new p(function(L, H) {
						var X;
						B.ready().then(function() {
							return X = B._dbInfo, T.call(S) === "[object Blob]" ? R(X.db).then(function(Q) {
								return Q ? S : xe(S);
							}) : S;
						}).then(function(Q) {
							be(B._dbInfo, E, function(J, te) {
								if (J) return H(J);
								try {
									var he = te.objectStore(B._dbInfo.storeName);
									Q === null && (Q = void 0);
									var Ce = he.put(Q, w);
									te.oncomplete = function() {
										Q === void 0 && (Q = null), L(Q);
									}, te.onabort = te.onerror = function() {
										H(Ce.error ? Ce.error : Ce.transaction.error);
									};
								} catch (Me) {
									H(Me);
								}
							});
						}).catch(H);
					});
					return y(P, D), P;
				}
				function Ge(w, S) {
					var D = this;
					w = N(w);
					var B = new p(function(P, L) {
						D.ready().then(function() {
							be(D._dbInfo, E, function(H, X) {
								if (H) return L(H);
								try {
									var J = X.objectStore(D._dbInfo.storeName).delete(w);
									X.oncomplete = function() {
										P();
									}, X.onerror = function() {
										L(J.error);
									}, X.onabort = function() {
										L(J.error ? J.error : J.transaction.error);
									};
								} catch (te) {
									L(te);
								}
							});
						}).catch(L);
					});
					return y(B, S), B;
				}
				function Te(w) {
					var S = this, D = new p(function(B, P) {
						S.ready().then(function() {
							be(S._dbInfo, E, function(L, H) {
								if (L) return P(L);
								try {
									var Q = H.objectStore(S._dbInfo.storeName).clear();
									H.oncomplete = function() {
										B();
									}, H.onabort = H.onerror = function() {
										P(Q.error ? Q.error : Q.transaction.error);
									};
								} catch (J) {
									P(J);
								}
							});
						}).catch(P);
					});
					return y(D, w), D;
				}
				function at(w) {
					var S = this, D = new p(function(B, P) {
						S.ready().then(function() {
							be(S._dbInfo, F, function(L, H) {
								if (L) return P(L);
								try {
									var Q = H.objectStore(S._dbInfo.storeName).count();
									Q.onsuccess = function() {
										B(Q.result);
									}, Q.onerror = function() {
										P(Q.error);
									};
								} catch (J) {
									P(J);
								}
							});
						}).catch(P);
					});
					return y(D, w), D;
				}
				function Ze(w, S) {
					var D = this, B = new p(function(P, L) {
						if (w < 0) {
							P(null);
							return;
						}
						D.ready().then(function() {
							be(D._dbInfo, F, function(H, X) {
								if (H) return L(H);
								try {
									var Q = X.objectStore(D._dbInfo.storeName), J = !1, te = Q.openKeyCursor();
									te.onsuccess = function() {
										var he = te.result;
										if (!he) {
											P(null);
											return;
										}
										w === 0 || J ? P(he.key) : (J = !0, he.advance(w));
									}, te.onerror = function() {
										L(te.error);
									};
								} catch (he) {
									L(he);
								}
							});
						}).catch(L);
					});
					return y(B, S), B;
				}
				function Fe(w) {
					var S = this, D = new p(function(B, P) {
						S.ready().then(function() {
							be(S._dbInfo, F, function(L, H) {
								if (L) return P(L);
								try {
									var Q = H.objectStore(S._dbInfo.storeName).openKeyCursor(), J = [];
									Q.onsuccess = function() {
										var te = Q.result;
										if (!te) {
											B(J);
											return;
										}
										J.push(te.key), te.continue();
									}, Q.onerror = function() {
										P(Q.error);
									};
								} catch (te) {
									P(te);
								}
							});
						}).catch(P);
					});
					return y(D, w), D;
				}
				function He(w, S) {
					S = I.apply(this, arguments);
					var D = this.config();
					w = typeof w != "function" && w || {}, w.name || (w.name = w.name || D.name, w.storeName = w.storeName || D.storeName);
					var B = this, P;
					if (!w.name) P = p.reject("Invalid arguments");
					else {
						var H = w.name === D.name && B._dbInfo.db ? p.resolve(B._dbInfo.db) : $(w).then(function(X) {
							var Q = b[w.name], J = Q.forages;
							Q.db = X;
							for (var te = 0; te < J.length; te++) J[te]._dbInfo.db = X;
							return X;
						});
						w.storeName ? P = H.then(function(X) {
							if (X.objectStoreNames.contains(w.storeName)) {
								var Q = X.version + 1;
								q(w);
								var J = b[w.name], te = J.forages;
								X.close();
								for (var he = 0; he < te.length; he++) {
									var Ce = te[he];
									Ce._dbInfo.db = null, Ce._dbInfo.version = Q;
								}
								return new p(function(ze, st) {
									var tt = u.open(w.name, Q);
									tt.onerror = function(Ft) {
										tt.result.close(), st(Ft);
									}, tt.onupgradeneeded = function() {
										tt.result.deleteObjectStore(w.storeName);
									}, tt.onsuccess = function() {
										var Ft = tt.result;
										Ft.close(), ze(Ft);
									};
								}).then(function(ze) {
									J.db = ze;
									for (var st = 0; st < te.length; st++) {
										var tt = te[st];
										tt._dbInfo.db = ze, M(tt._dbInfo);
									}
								}).catch(function(ze) {
									throw (Z(w, ze) || p.resolve()).catch(function() {}), ze;
								});
							}
						}) : P = H.then(function(X) {
							q(w);
							var Q = b[w.name], J = Q.forages;
							X.close();
							for (var te = 0; te < J.length; te++) {
								var he = J[te];
								he._dbInfo.db = null;
							}
							return new p(function(Me, ze) {
								var st = u.deleteDatabase(w.name);
								st.onerror = function() {
									var tt = st.result;
									tt && tt.close(), ze(st.error);
								}, st.onblocked = function() {
									console.warn("dropInstance blocked for database \"" + w.name + "\" until all open connections are closed");
								}, st.onsuccess = function() {
									var tt = st.result;
									tt && tt.close(), Me(tt);
								};
							}).then(function(Me) {
								Q.db = Me;
								for (var ze = 0; ze < J.length; ze++) {
									var st = J[ze];
									M(st._dbInfo);
								}
							}).catch(function(Me) {
								throw (Z(w, Me) || p.resolve()).catch(function() {}), Me;
							});
						});
					}
					return y(P, S), P;
				}
				var Be = {
					_driver: "asyncStorage",
					_initStorage: Ie,
					_support: f(),
					iterate: ft,
					getItem: Le,
					setItem: it,
					removeItem: Ge,
					clear: Te,
					length: at,
					key: Ze,
					keys: Fe,
					dropInstance: He
				};
				function ct() {
					return typeof openDatabase == "function";
				}
				var Je = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", At = "~~local_forage_type~", Pe = /^~~local_forage_type~([^~]+)~/, nt = "__lfsc__:", qt = nt.length, gt = "arbf", pt = "blob", We = "si08", De = "ui08", bt = "uic8", tr = "si16", Wt = "si32", wt = "ur16", rr = "ui32", jt = "fl32", Ct = "fl64", ir = qt + gt.length, Ht = Object.prototype.toString;
				function ot(w) {
					var S = w.length * .75, D = w.length, B, P = 0, L, H, X, Q;
					w[w.length - 1] === "=" && (S--, w[w.length - 2] === "=" && S--);
					var J = new ArrayBuffer(S), te = new Uint8Array(J);
					for (B = 0; B < D; B += 4) L = Je.indexOf(w[B]), H = Je.indexOf(w[B + 1]), X = Je.indexOf(w[B + 2]), Q = Je.indexOf(w[B + 3]), te[P++] = L << 2 | H >> 4, te[P++] = (H & 15) << 4 | X >> 2, te[P++] = (X & 3) << 6 | Q & 63;
					return J;
				}
				function Tt(w) {
					var S = new Uint8Array(w), D = "", B;
					for (B = 0; B < S.length; B += 3) D += Je[S[B] >> 2], D += Je[(S[B] & 3) << 4 | S[B + 1] >> 4], D += Je[(S[B + 1] & 15) << 2 | S[B + 2] >> 6], D += Je[S[B + 2] & 63];
					return S.length % 3 === 2 ? D = D.substring(0, D.length - 1) + "=" : S.length % 3 === 1 && (D = D.substring(0, D.length - 2) + "=="), D;
				}
				function lr(w, S) {
					var D = "";
					if (w && (D = Ht.call(w)), w && (D === "[object ArrayBuffer]" || w.buffer && Ht.call(w.buffer) === "[object ArrayBuffer]")) {
						var B, P = nt;
						w instanceof ArrayBuffer ? (B = w, P += gt) : (B = w.buffer, D === "[object Int8Array]" ? P += We : D === "[object Uint8Array]" ? P += De : D === "[object Uint8ClampedArray]" ? P += bt : D === "[object Int16Array]" ? P += tr : D === "[object Uint16Array]" ? P += wt : D === "[object Int32Array]" ? P += Wt : D === "[object Uint32Array]" ? P += rr : D === "[object Float32Array]" ? P += jt : D === "[object Float64Array]" ? P += Ct : S(/* @__PURE__ */ new Error("Failed to get type for BinaryArray"))), S(P + Tt(B));
					} else if (D === "[object Blob]") {
						var L = new FileReader();
						L.onload = function() {
							var H = At + w.type + "~" + Tt(this.result);
							S(nt + pt + H);
						}, L.readAsArrayBuffer(w);
					} else try {
						S(JSON.stringify(w));
					} catch (H) {
						console.error("Couldn't convert value into a JSON string: ", w), S(null, H);
					}
				}
				function x(w) {
					if (w.substring(0, qt) !== nt) return JSON.parse(w);
					var S = w.substring(ir), D = w.substring(qt, ir), B;
					if (D === pt && Pe.test(S)) {
						var P = S.match(Pe);
						B = P[1], S = S.substring(P[0].length);
					}
					var L = ot(S);
					switch (D) {
						case gt: return L;
						case pt: return c([L], { type: B });
						case We: return new Int8Array(L);
						case De: return new Uint8Array(L);
						case bt: return new Uint8ClampedArray(L);
						case tr: return new Int16Array(L);
						case wt: return new Uint16Array(L);
						case Wt: return new Int32Array(L);
						case rr: return new Uint32Array(L);
						case jt: return new Float32Array(L);
						case Ct: return new Float64Array(L);
						default: throw new Error("Unkown type: " + D);
					}
				}
				var G = {
					serialize: lr,
					deserialize: x,
					stringToBuffer: ot,
					bufferToString: Tt
				};
				function K(w, S, D, B) {
					w.executeSql("CREATE TABLE IF NOT EXISTS " + S.storeName + " (id INTEGER PRIMARY KEY, key unique, value)", [], D, B);
				}
				function ie(w) {
					var S = this, D = { db: null };
					if (w) for (var B in w) D[B] = typeof w[B] != "string" ? w[B].toString() : w[B];
					var P = new p(function(L, H) {
						try {
							D.db = openDatabase(D.name, String(D.version), D.description, D.size);
						} catch (X) {
							return H(X);
						}
						D.db.transaction(function(X) {
							K(X, D, function() {
								S._dbInfo = D, L();
							}, function(Q, J) {
								H(J);
							});
						}, H);
					});
					return D.serializer = G, P;
				}
				function k(w, S, D, B, P, L) {
					w.executeSql(D, B, P, function(H, X) {
						X.code === X.SYNTAX_ERR ? H.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [S.storeName], function(Q, J) {
							J.rows.length ? L(Q, X) : K(Q, S, function() {
								Q.executeSql(D, B, P, L);
							}, L);
						}, L) : L(H, X);
					}, L);
				}
				function j(w, S) {
					var D = this;
					w = N(w);
					var B = new p(function(P, L) {
						D.ready().then(function() {
							var H = D._dbInfo;
							H.db.transaction(function(X) {
								k(X, H, "SELECT * FROM " + H.storeName + " WHERE key = ? LIMIT 1", [w], function(Q, J) {
									var te = J.rows.length ? J.rows.item(0).value : null;
									te && (te = H.serializer.deserialize(te)), P(te);
								}, function(Q, J) {
									L(J);
								});
							});
						}).catch(L);
					});
					return y(B, S), B;
				}
				function m(w, S) {
					var D = this, B = new p(function(P, L) {
						D.ready().then(function() {
							var H = D._dbInfo;
							H.db.transaction(function(X) {
								k(X, H, "SELECT * FROM " + H.storeName, [], function(Q, J) {
									for (var te = J.rows, he = te.length, Ce = 0; Ce < he; Ce++) {
										var Me = te.item(Ce), ze = Me.value;
										if (ze && (ze = H.serializer.deserialize(ze)), ze = w(ze, Me.key, Ce + 1), ze !== void 0) {
											P(ze);
											return;
										}
									}
									P();
								}, function(Q, J) {
									L(J);
								});
							});
						}).catch(L);
					});
					return y(B, S), B;
				}
				function Y(w, S, D, B) {
					var P = this;
					w = N(w);
					var L = new p(function(H, X) {
						P.ready().then(function() {
							S === void 0 && (S = null);
							var Q = S, J = P._dbInfo;
							J.serializer.serialize(S, function(te, he) {
								he ? X(he) : J.db.transaction(function(Ce) {
									k(Ce, J, "INSERT OR REPLACE INTO " + J.storeName + " (key, value) VALUES (?, ?)", [w, te], function() {
										H(Q);
									}, function(Me, ze) {
										X(ze);
									});
								}, function(Ce) {
									if (Ce.code === Ce.QUOTA_ERR) {
										if (B > 0) {
											H(Y.apply(P, [
												w,
												Q,
												D,
												B - 1
											]));
											return;
										}
										X(Ce);
									}
								});
							});
						}).catch(X);
					});
					return y(L, D), L;
				}
				function de(w, S, D) {
					return Y.apply(this, [
						w,
						S,
						D,
						1
					]);
				}
				function h(w, S) {
					var D = this;
					w = N(w);
					var B = new p(function(P, L) {
						D.ready().then(function() {
							var H = D._dbInfo;
							H.db.transaction(function(X) {
								k(X, H, "DELETE FROM " + H.storeName + " WHERE key = ?", [w], function() {
									P();
								}, function(Q, J) {
									L(J);
								});
							});
						}).catch(L);
					});
					return y(B, S), B;
				}
				function U(w) {
					var S = this, D = new p(function(B, P) {
						S.ready().then(function() {
							var L = S._dbInfo;
							L.db.transaction(function(H) {
								k(H, L, "DELETE FROM " + L.storeName, [], function() {
									B();
								}, function(X, Q) {
									P(Q);
								});
							});
						}).catch(P);
					});
					return y(D, w), D;
				}
				function W(w) {
					var S = this, D = new p(function(B, P) {
						S.ready().then(function() {
							var L = S._dbInfo;
							L.db.transaction(function(H) {
								k(H, L, "SELECT COUNT(key) as c FROM " + L.storeName, [], function(X, Q) {
									var J = Q.rows.item(0).c;
									B(J);
								}, function(X, Q) {
									P(Q);
								});
							});
						}).catch(P);
					});
					return y(D, w), D;
				}
				function g(w, S) {
					var D = this, B = new p(function(P, L) {
						D.ready().then(function() {
							var H = D._dbInfo;
							H.db.transaction(function(X) {
								k(X, H, "SELECT key FROM " + H.storeName + " WHERE id = ? LIMIT 1", [w + 1], function(Q, J) {
									P(J.rows.length ? J.rows.item(0).key : null);
								}, function(Q, J) {
									L(J);
								});
							});
						}).catch(L);
					});
					return y(B, S), B;
				}
				function O(w) {
					var S = this, D = new p(function(B, P) {
						S.ready().then(function() {
							var L = S._dbInfo;
							L.db.transaction(function(H) {
								k(H, L, "SELECT key FROM " + L.storeName, [], function(X, Q) {
									for (var J = [], te = 0; te < Q.rows.length; te++) J.push(Q.rows.item(te).key);
									B(J);
								}, function(X, Q) {
									P(Q);
								});
							});
						}).catch(P);
					});
					return y(D, w), D;
				}
				function z(w) {
					return new p(function(S, D) {
						w.transaction(function(B) {
							B.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name <> '__WebKitDatabaseInfoTable__'", [], function(P, L) {
								for (var H = [], X = 0; X < L.rows.length; X++) H.push(L.rows.item(X).name);
								S({
									db: w,
									storeNames: H
								});
							}, function(P, L) {
								D(L);
							});
						}, function(B) {
							D(B);
						});
					});
				}
				function le(w, S) {
					S = I.apply(this, arguments);
					var D = this.config();
					w = typeof w != "function" && w || {}, w.name || (w.name = w.name || D.name, w.storeName = w.storeName || D.storeName);
					var B = this, P;
					return w.name ? P = new p(function(L) {
						var H;
						w.name === D.name ? H = B._dbInfo.db : H = openDatabase(w.name, "", "", 0), w.storeName ? L({
							db: H,
							storeNames: [w.storeName]
						}) : L(z(H));
					}).then(function(L) {
						return new p(function(H, X) {
							L.db.transaction(function(Q) {
								function J(Me) {
									return new p(function(ze, st) {
										Q.executeSql("DROP TABLE IF EXISTS " + Me, [], function() {
											ze();
										}, function(tt, Ft) {
											st(Ft);
										});
									});
								}
								for (var te = [], he = 0, Ce = L.storeNames.length; he < Ce; he++) te.push(J(L.storeNames[he]));
								p.all(te).then(function() {
									H();
								}).catch(function(Me) {
									X(Me);
								});
							}, function(Q) {
								X(Q);
							});
						});
					}) : P = p.reject("Invalid arguments"), y(P, S), P;
				}
				var re = {
					_driver: "webSQLStorage",
					_initStorage: ie,
					_support: ct(),
					iterate: m,
					getItem: j,
					setItem: de,
					removeItem: h,
					clear: U,
					length: W,
					key: g,
					keys: O,
					dropInstance: le
				};
				function ne() {
					try {
						return typeof localStorage != "undefined" && "setItem" in localStorage && !!localStorage.setItem;
					} catch {
						return !1;
					}
				}
				function Se(w, S) {
					var D = w.name + "/";
					return w.storeName !== S.storeName && (D += w.storeName + "/"), D;
				}
				function Vt() {
					var w = "_localforage_support_test";
					try {
						return localStorage.setItem(w, !0), localStorage.removeItem(w), !1;
					} catch {
						return !0;
					}
				}
				function Ve() {
					return !Vt() || localStorage.length > 0;
				}
				function Ne(w) {
					var S = this, D = {};
					if (w) for (var B in w) D[B] = w[B];
					return D.keyPrefix = Se(w, S._defaultConfig), Ve() ? (S._dbInfo = D, D.serializer = G, p.resolve()) : p.reject();
				}
				function et(w) {
					var S = this, D = S.ready().then(function() {
						for (var B = S._dbInfo.keyPrefix, P = localStorage.length - 1; P >= 0; P--) {
							var L = localStorage.key(P);
							L.indexOf(B) === 0 && localStorage.removeItem(L);
						}
					});
					return y(D, w), D;
				}
				function dt(w, S) {
					var D = this;
					w = N(w);
					var B = D.ready().then(function() {
						var P = D._dbInfo, L = localStorage.getItem(P.keyPrefix + w);
						return L && (L = P.serializer.deserialize(L)), L;
					});
					return y(B, S), B;
				}
				function Et(w, S) {
					var D = this, B = D.ready().then(function() {
						for (var P = D._dbInfo, L = P.keyPrefix, H = L.length, X = localStorage.length, Q = 1, J = 0; J < X; J++) {
							var te = localStorage.key(J);
							if (te.indexOf(L) === 0) {
								var he = localStorage.getItem(te);
								if (he && (he = P.serializer.deserialize(he)), he = w(he, te.substring(H), Q++), he !== void 0) return he;
							}
						}
					});
					return y(B, S), B;
				}
				function Tr(w, S) {
					var D = this, B = D.ready().then(function() {
						var P = D._dbInfo, L;
						try {
							L = localStorage.key(w);
						} catch {
							L = null;
						}
						return L && (L = L.substring(P.keyPrefix.length)), L;
					});
					return y(B, S), B;
				}
				function Sr(w) {
					var S = this, D = S.ready().then(function() {
						for (var B = S._dbInfo, P = localStorage.length, L = [], H = 0; H < P; H++) {
							var X = localStorage.key(H);
							X.indexOf(B.keyPrefix) === 0 && L.push(X.substring(B.keyPrefix.length));
						}
						return L;
					});
					return y(D, w), D;
				}
				function Xe(w) {
					var D = this.keys().then(function(B) {
						return B.length;
					});
					return y(D, w), D;
				}
				function St(w, S) {
					var D = this;
					w = N(w);
					var B = D.ready().then(function() {
						var P = D._dbInfo;
						localStorage.removeItem(P.keyPrefix + w);
					});
					return y(B, S), B;
				}
				function ut(w, S, D) {
					var B = this;
					w = N(w);
					var P = B.ready().then(function() {
						S === void 0 && (S = null);
						var L = S;
						return new p(function(H, X) {
							var Q = B._dbInfo;
							Q.serializer.serialize(S, function(J, te) {
								if (te) X(te);
								else try {
									localStorage.setItem(Q.keyPrefix + w, J), H(L);
								} catch (he) {
									(he.name === "QuotaExceededError" || he.name === "NS_ERROR_DOM_QUOTA_REACHED") && X(he), X(he);
								}
							});
						});
					});
					return y(P, D), P;
				}
				function Gt(w, S) {
					if (S = I.apply(this, arguments), w = typeof w != "function" && w || {}, !w.name) {
						var D = this.config();
						w.name = w.name || D.name, w.storeName = w.storeName || D.storeName;
					}
					var B = this, P;
					return w.name ? P = new p(function(L) {
						w.storeName ? L(Se(w, B._defaultConfig)) : L(w.name + "/");
					}).then(function(L) {
						for (var H = localStorage.length - 1; H >= 0; H--) {
							var X = localStorage.key(H);
							X.indexOf(L) === 0 && localStorage.removeItem(X);
						}
					}) : P = p.reject("Invalid arguments"), y(P, S), P;
				}
				var Pt = {
					_driver: "localStorageWrapper",
					_initStorage: Ne,
					_support: ne(),
					iterate: Et,
					getItem: dt,
					setItem: ut,
					removeItem: St,
					clear: et,
					length: Xe,
					key: Tr,
					keys: Sr,
					dropInstance: Gt
				}, Ui = function(S, D) {
					return S === D || typeof S == "number" && typeof D == "number" && isNaN(S) && isNaN(D);
				}, Hl = function(S, D) {
					for (var B = S.length, P = 0; P < B;) {
						if (Ui(S[P], D)) return !0;
						P++;
					}
					return !1;
				}, ha = Array.isArray || function(w) {
					return Object.prototype.toString.call(w) === "[object Array]";
				}, si = {}, fa = {}, Nr = {
					INDEXEDDB: Be,
					WEBSQL: re,
					LOCALSTORAGE: Pt
				}, Vl = [
					Nr.INDEXEDDB._driver,
					Nr.WEBSQL._driver,
					Nr.LOCALSTORAGE._driver
				], qi = ["dropInstance"], Bn = [
					"clear",
					"getItem",
					"iterate",
					"key",
					"keys",
					"length",
					"removeItem",
					"setItem"
				].concat(qi), Gl = {
					description: "",
					driver: Vl.slice(),
					name: "localforage",
					size: 4980736,
					storeName: "keyvaluepairs",
					version: 1
				};
				function Yl(w, S) {
					w[S] = function() {
						var D = arguments;
						return w.ready().then(function() {
							return w[S].apply(w, D);
						});
					};
				}
				function Pn() {
					for (var w = 1; w < arguments.length; w++) {
						var S = arguments[w];
						if (S) for (var D in S) S.hasOwnProperty(D) && (ha(S[D]) ? arguments[0][D] = S[D].slice() : arguments[0][D] = S[D]);
					}
					return arguments[0];
				}
				i.exports = new ((function() {
					function w(S) {
						o(this, w);
						for (var D in Nr) if (Nr.hasOwnProperty(D)) {
							var B = Nr[D], P = B._driver;
							this[D] = P, si[P] || this.defineDriver(B);
						}
						this._defaultConfig = Pn({}, Gl), this._config = Pn({}, this._defaultConfig, S), this._driverSet = null, this._initDriver = null, this._ready = !1, this._dbInfo = null, this._wrapLibraryMethodsWithReady(), this.setDriver(this._config.driver).catch(function() {});
					}
					return w.prototype.config = function(D) {
						if ((typeof D == "undefined" ? "undefined" : a(D)) === "object") {
							if (this._ready) return /* @__PURE__ */ new Error("Can't call config() after localforage has been used.");
							for (var B in D) {
								if (B === "storeName" && (D[B] = D[B].replace(/\W/g, "_")), B === "version" && typeof D[B] != "number") return /* @__PURE__ */ new Error("Database version must be a number.");
								this._config[B] = D[B];
							}
							return "driver" in D && D.driver ? this.setDriver(this._config.driver) : !0;
						} else return typeof D == "string" ? this._config[D] : this._config;
					}, w.prototype.defineDriver = function(D, B, P) {
						var L = new p(function(H, X) {
							try {
								var Q = D._driver, J = /* @__PURE__ */ new Error("Custom driver not compliant; see https://mozilla.github.io/localForage/#definedriver");
								if (!D._driver) {
									X(J);
									return;
								}
								for (var te = Bn.concat("_initStorage"), he = 0, Ce = te.length; he < Ce; he++) {
									var Me = te[he];
									if ((!Hl(qi, Me) || D[Me]) && typeof D[Me] != "function") {
										X(J);
										return;
									}
								}
								var st = function() {
									for (var ai = function($l) {
										return function() {
											var Ql = /* @__PURE__ */ new Error("Method " + $l + " is not implemented by the current driver"), ca = p.reject(Ql);
											return y(ca, arguments[arguments.length - 1]), ca;
										};
									}, Fn = 0, Kl = qi.length; Fn < Kl; Fn++) {
										var Mn = qi[Fn];
										D[Mn] || (D[Mn] = ai(Mn));
									}
								};
								st();
								var tt = function(ai) {
									si[Q] && console.info("Redefining LocalForage driver: " + Q), si[Q] = D, fa[Q] = ai, H();
								};
								"_support" in D ? D._support && typeof D._support == "function" ? D._support().then(tt, X) : tt(!!D._support) : tt(!0);
							} catch (Ft) {
								X(Ft);
							}
						});
						return _(L, B, P), L;
					}, w.prototype.driver = function() {
						return this._driver || null;
					}, w.prototype.getDriver = function(D, B, P) {
						var L = si[D] ? p.resolve(si[D]) : p.reject(/* @__PURE__ */ new Error("Driver not found."));
						return _(L, B, P), L;
					}, w.prototype.getSerializer = function(D) {
						var B = p.resolve(G);
						return _(B, D), B;
					}, w.prototype.ready = function(D) {
						var B = this, P = B._driverSet.then(function() {
							return B._ready === null && (B._ready = B._initDriver()), B._ready;
						});
						return _(P, D, D), P;
					}, w.prototype.setDriver = function(D, B, P) {
						var L = this;
						ha(D) || (D = [D]);
						var H = this._getSupportedDrivers(D);
						function X() {
							L._config.driver = L.driver();
						}
						function Q(he) {
							return L._extend(he), X(), L._ready = L._initStorage(L._config), L._ready;
						}
						function J(he) {
							return function() {
								var Ce = 0;
								function Me() {
									for (; Ce < he.length;) {
										var ze = he[Ce];
										return Ce++, L._dbInfo = null, L._ready = null, L.getDriver(ze).then(Q).catch(Me);
									}
									X();
									var st = /* @__PURE__ */ new Error("No available storage method found.");
									return L._driverSet = p.reject(st), L._driverSet;
								}
								return Me();
							};
						}
						var te = this._driverSet !== null ? this._driverSet.catch(function() {
							return p.resolve();
						}) : p.resolve();
						return this._driverSet = te.then(function() {
							var he = H[0];
							return L._dbInfo = null, L._ready = null, L.getDriver(he).then(function(Ce) {
								L._driver = Ce._driver, X(), L._wrapLibraryMethodsWithReady(), L._initDriver = J(H);
							});
						}).catch(function() {
							X();
							var he = /* @__PURE__ */ new Error("No available storage method found.");
							return L._driverSet = p.reject(he), L._driverSet;
						}), _(this._driverSet, B, P), this._driverSet;
					}, w.prototype.supports = function(D) {
						return !!fa[D];
					}, w.prototype._extend = function(D) {
						Pn(this, D);
					}, w.prototype._getSupportedDrivers = function(D) {
						for (var B = [], P = 0, L = D.length; P < L; P++) {
							var H = D[P];
							this.supports(H) && B.push(H);
						}
						return B;
					}, w.prototype._wrapLibraryMethodsWithReady = function() {
						for (var D = 0, B = Bn.length; D < B; D++) Yl(this, Bn[D]);
					}, w.prototype.createInstance = function(D) {
						return new w(D);
					}, w;
				})())();
			}, { 3: 3 }]
		}, {}, [4])(4);
	});
});
var Wl = rt(Yt());
var Ns = {};
nh(Ns, {
	RangeObject: () => Si,
	blob2base64: () => Ss,
	borders: () => Xr,
	bounds: () => Ii,
	createBase64Url: () => dn,
	createBlob: () => cu,
	createBlobUrl: () => $r,
	defaults: () => _s,
	defer: () => ge,
	documentHeight: () => Nc,
	extend: () => je,
	filterChildren: () => Dr,
	findChildren: () => pn,
	getParentByTagName: () => Rc,
	indexOfElementNode: () => Ds,
	indexOfNode: () => xs,
	indexOfSorted: () => Ti,
	indexOfTextNode: () => Oc,
	insert: () => Ic,
	isElement: () => bs,
	isFloat: () => ws,
	isNumber: () => qe,
	isXml: () => gr,
	locationOf: () => vr,
	nodeBounds: () => cn,
	parents: () => ys,
	parse: () => Lt,
	prefixed: () => _r,
	qs: () => ke,
	qsa: () => Bt,
	qsp: () => xr,
	querySelectorByType: () => Jr,
	requestAnimationFrame: () => Ni,
	revokeBlobUrl: () => As,
	sprint: () => Qr,
	treeWalker: () => du,
	type: () => Cs,
	uuid: () => Zr,
	walk: () => Ts,
	windowBounds: () => Kr
});
var hu = rt(Es());
var Ni = typeof window != "undefined" ? window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame : !1;
var Tc = 1;
var Sc = 3;
var fu = typeof URL != "undefined" ? URL : typeof window != "undefined" ? window.URL || window.webkitURL || window.mozURL : void 0;
function Zr() {
	var n = (/* @__PURE__ */ new Date()).getTime();
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(t) {
		var r = (n + Math.random() * 16) % 16 | 0;
		return n = Math.floor(n / 16), (t == "x" ? r : r & 7 | 8).toString(16);
	});
}
function Nc() {
	return Math.max(document.documentElement.clientHeight, document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight);
}
function bs(n) {
	return !!(n && n.nodeType == 1);
}
function qe(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}
function ws(n) {
	let e = parseFloat(n);
	return qe(n) === !1 ? !1 : typeof n == "string" && n.indexOf(".") > -1 ? !0 : Math.floor(e) !== e;
}
function _r(n) {
	var e = [
		"Webkit",
		"webkit",
		"Moz",
		"O",
		"ms"
	], t = [
		"-webkit-",
		"-webkit-",
		"-moz-",
		"-o-",
		"-ms-"
	], r = n.toLowerCase(), i = e.length;
	if (typeof document == "undefined" || typeof document.body.style[r] != "undefined") return n;
	for (var s = 0; s < i; s++) if (typeof document.body.style[t[s] + r] != "undefined") return t[s] + r;
	return n;
}
function _s(n) {
	for (var e = 1, t = arguments.length; e < t; e++) {
		var r = arguments[e];
		for (var i in r) n[i] === void 0 && (n[i] = r[i]);
	}
	return n;
}
function je(n) {
	return [].slice.call(arguments, 1).forEach(function(t) {
		t && Object.getOwnPropertyNames(t).forEach(function(r) {
			Object.defineProperty(n, r, Object.getOwnPropertyDescriptor(t, r));
		});
	}), n;
}
function Ic(n, e, t) {
	var r = vr(n, e, t);
	return e.splice(r, 0, n), r;
}
function vr(n, e, t, r, i) {
	var s = r || 0, a = i || e.length, o = parseInt(s + (a - s) / 2), l;
	return t || (t = function(u, f) {
		if (u > f) return 1;
		if (u < f) return -1;
		if (u == f) return 0;
	}), a - s <= 0 ? o : (l = t(e[o], n), a - s === 1 ? l >= 0 ? o : o + 1 : l === 0 ? o : l === -1 ? vr(n, e, t, o, a) : vr(n, e, t, s, o));
}
function Ti(n, e, t, r, i) {
	var s = r || 0, a = i || e.length, o = parseInt(s + (a - s) / 2), l;
	return t || (t = function(u, f) {
		if (u > f) return 1;
		if (u < f) return -1;
		if (u == f) return 0;
	}), a - s <= 0 ? -1 : (l = t(e[o], n), a - s === 1 ? l === 0 ? o : -1 : l === 0 ? o : l === -1 ? Ti(n, e, t, o, a) : Ti(n, e, t, s, o));
}
function Ii(n) {
	var e = window.getComputedStyle(n), t = [
		"width",
		"paddingRight",
		"paddingLeft",
		"marginRight",
		"marginLeft",
		"borderRightWidth",
		"borderLeftWidth"
	], r = [
		"height",
		"paddingTop",
		"paddingBottom",
		"marginTop",
		"marginBottom",
		"borderTopWidth",
		"borderBottomWidth"
	], i = 0, s = 0;
	return t.forEach(function(a) {
		i += parseFloat(e[a]) || 0;
	}), r.forEach(function(a) {
		s += parseFloat(e[a]) || 0;
	}), {
		height: s,
		width: i
	};
}
function Xr(n) {
	var e = window.getComputedStyle(n), t = [
		"paddingRight",
		"paddingLeft",
		"marginRight",
		"marginLeft",
		"borderRightWidth",
		"borderLeftWidth"
	], r = [
		"paddingTop",
		"paddingBottom",
		"marginTop",
		"marginBottom",
		"borderTopWidth",
		"borderBottomWidth"
	], i = 0, s = 0;
	return t.forEach(function(a) {
		i += parseFloat(e[a]) || 0;
	}), r.forEach(function(a) {
		s += parseFloat(e[a]) || 0;
	}), {
		height: s,
		width: i
	};
}
function cn(n) {
	let e, t = n.ownerDocument;
	if (n.nodeType == Node.TEXT_NODE) {
		let r = t.createRange();
		r.selectNodeContents(n), e = r.getBoundingClientRect();
	} else e = n.getBoundingClientRect();
	return e;
}
function Kr() {
	var n = window.innerWidth, e = window.innerHeight;
	return {
		top: 0,
		left: 0,
		right: n,
		bottom: e,
		width: n,
		height: e
	};
}
function xs(n, e) {
	for (var r = n.parentNode.childNodes, i, s = -1, a = 0; a < r.length && (i = r[a], i.nodeType === e && s++, i != n); a++);
	return s;
}
function Oc(n) {
	return xs(n, Sc);
}
function Ds(n) {
	return xs(n, Tc);
}
function gr(n) {
	return [
		"xml",
		"opf",
		"ncx"
	].indexOf(n) > -1;
}
function cu(n, e) {
	return new Blob([n], { type: e });
}
function $r(n, e) {
	var t, r = cu(n, e);
	return t = fu.createObjectURL(r), t;
}
function As(n) {
	return fu.revokeObjectURL(n);
}
function dn(n, e) {
	var t, r;
	if (typeof n == "string") return t = btoa(n), r = "data:" + e + ";base64," + t, r;
}
function Cs(n) {
	return Object.prototype.toString.call(n).slice(8, -1);
}
function Lt(n, e, t) {
	var r, i;
	return typeof DOMParser == "undefined" || t ? i = hu.DOMParser : i = DOMParser, n.charCodeAt(0) === 65279 && (n = n.slice(1)), r = new i().parseFromString(n, e), r;
}
function ke(n, e) {
	var t;
	if (!n) throw new Error("No Element Provided");
	if (typeof n.querySelector != "undefined") return n.querySelector(e);
	if (t = n.getElementsByTagName(e), t.length) return t[0];
}
function Bt(n, e) {
	return typeof n.querySelector != "undefined" ? n.querySelectorAll(e) : n.getElementsByTagName(e);
}
function xr(n, e, t) {
	var r, i;
	if (typeof n.querySelector != "undefined") {
		e += "[";
		for (var s in t) e += s + "~='" + t[s] + "'";
		return e += "]", n.querySelector(e);
	} else if (r = n.getElementsByTagName(e), i = Array.prototype.slice.call(r, 0).filter(function(a) {
		for (var o in t) if (a.getAttribute(o) === t[o]) return !0;
		return !1;
	}), i) return i[0];
}
function Qr(n, e) {
	typeof (n.ownerDocument || n).createTreeWalker != "undefined" ? du(n, e, NodeFilter.SHOW_TEXT) : Ts(n, function(r) {
		r && r.nodeType === 3 && e(r);
	}, !0);
}
function du(n, e, t) {
	var r = document.createTreeWalker(n, t, null, !1);
	let i;
	for (; i = r.nextNode();) e(i);
}
function Ts(n, e) {
	if (e(n)) return !0;
	if (n = n.firstChild, n) do {
		if (Ts(n, e)) return !0;
		n = n.nextSibling;
	} while (n);
}
function Ss(n) {
	return new Promise(function(e, t) {
		var r = new FileReader();
		r.readAsDataURL(n), r.onloadend = function() {
			e(r.result);
		};
	});
}
function ge() {
	this.resolve = null, this.reject = null, this.id = Zr(), this.promise = new Promise((n, e) => {
		this.resolve = n, this.reject = e;
	}), Object.freeze(this);
}
function Jr(n, e, t) {
	var r;
	if (typeof n.querySelector != "undefined" && (r = n.querySelector(`${e}[*|type="${t}"]`)), !r || r.length === 0) {
		r = Bt(n, e);
		for (var i = 0; i < r.length; i++) if (r[i].getAttributeNS("http://www.idpf.org/2007/ops", "type") === t || r[i].getAttribute("epub:type") === t) return r[i];
	} else return r;
}
function pn(n) {
	for (var e = [], t = n.childNodes, r = 0; r < t.length; r++) {
		let i = t[r];
		i.nodeType === 1 && e.push(i);
	}
	return e;
}
function ys(n) {
	for (var e = [n]; n; n = n.parentNode) e.unshift(n);
	return e;
}
function Dr(n, e, t) {
	for (var r = [], i = n.childNodes, s = 0; s < i.length; s++) {
		let a = i[s];
		if (a.nodeType === 1 && a.nodeName.toLowerCase() === e) {
			if (t) return a;
			r.push(a);
		}
	}
	if (!t) return r;
}
function Rc(n, e) {
	let t;
	if (!(n === null || e === "")) for (t = n.parentNode; t.nodeType === 1;) {
		if (t.tagName.toLowerCase() === e) return t;
		t = t.parentNode;
	}
}
var Si = class {
	constructor() {
		this.collapsed = !1, this.commonAncestorContainer = void 0, this.endContainer = void 0, this.endOffset = void 0, this.startContainer = void 0, this.startOffset = void 0;
	}
	setStart(e, t) {
		this.startContainer = e, this.startOffset = t, this.endContainer ? this.commonAncestorContainer = this._commonAncestorContainer() : this.collapse(!0), this._checkCollapsed();
	}
	setEnd(e, t) {
		this.endContainer = e, this.endOffset = t, this.startContainer ? (this.collapsed = !1, this.commonAncestorContainer = this._commonAncestorContainer()) : this.collapse(!1), this._checkCollapsed();
	}
	collapse(e) {
		this.collapsed = !0, e ? (this.endContainer = this.startContainer, this.endOffset = this.startOffset, this.commonAncestorContainer = this.startContainer.parentNode) : (this.startContainer = this.endContainer, this.startOffset = this.endOffset, this.commonAncestorContainer = this.endOffset.parentNode);
	}
	selectNode(e) {
		let t = e.parentNode, r = Array.prototype.indexOf.call(t.childNodes, e);
		this.setStart(t, r), this.setEnd(t, r + 1);
	}
	selectNodeContents(e) {
		e.childNodes[e.childNodes - 1];
		let r = e.nodeType === 3 ? e.textContent.length : parent.childNodes.length;
		this.setStart(e, 0), this.setEnd(e, r);
	}
	_commonAncestorContainer(e, t) {
		var r = ys(e || this.startContainer), i = ys(t || this.endContainer);
		if (r[0] == i[0]) {
			for (var s = 0; s < r.length; s++) if (r[s] != i[s]) return r[s - 1];
		}
	}
	_checkCollapsed() {
		this.startContainer === this.endContainer && this.startOffset === this.endOffset ? this.collapsed = !0 : this.collapsed = !1;
	}
	toString() {}
};
var Ri = rt(Oi());
var Os = class {
	constructor(e) {
		var t = e.indexOf("://"), r;
		t > -1 && (e = new URL(e).pathname), r = this.parse(e), this.path = e, this.isDirectory(e) ? this.directory = e : this.directory = r.dir + "/", this.filename = r.base, this.extension = r.ext.slice(1);
	}
	parse(e) {
		return Ri.default.parse(e);
	}
	isAbsolute(e) {
		return Ri.default.isAbsolute(e || this.path);
	}
	isDirectory(e) {
		return e.charAt(e.length - 1) === "/";
	}
	resolve(e) {
		return Ri.default.resolve(this.directory, e);
	}
	relative(e) {
		return e && e.indexOf("://") > -1 ? e : Ri.default.relative(this.directory, e);
	}
	splitPath(e) {
		return this.splitPathRe.exec(e).slice(1);
	}
	toString() {
		return this.path;
	}
};
var xt = Os;
var Rs = rt(Oi());
var ks = class {
	constructor(e, t) {
		var r = e.indexOf("://") > -1, i = e, s;
		if (this.Url = void 0, this.href = e, this.protocol = "", this.origin = "", this.hash = "", this.hash = "", this.search = "", this.base = t, !r && t !== !1 && typeof t != "string" && window && window.location && (this.base = window.location.href), r || this.base) try {
			this.base ? this.Url = new URL(e, this.base) : this.Url = new URL(e), this.href = this.Url.href, this.protocol = this.Url.protocol, this.origin = this.Url.origin, this.hash = this.Url.hash, this.search = this.Url.search, i = this.Url.pathname + (this.Url.search ? this.Url.search : "");
		} catch {
			this.Url = void 0, this.base && (s = new xt(this.base), i = s.resolve(i));
		}
		this.Path = new xt(i), this.directory = this.Path.directory, this.filename = this.Path.filename, this.extension = this.Path.extension;
	}
	path() {
		return this.Path;
	}
	resolve(e) {
		var t = e.indexOf("://") > -1, r;
		return t ? e : (r = Rs.default.resolve(this.directory, e), this.origin + r);
	}
	relative(e) {
		return Rs.default.relative(e, this.directory);
	}
	toString() {
		return this.href;
	}
};
var Dt = ks;
var ei = 1;
var Ut = 3;
var Lc = 9;
var _e = class n {
	constructor(e, t, r) {
		var i;
		if (this.str = "", this.base = {}, this.spinePos = 0, this.range = !1, this.path = {}, this.start = null, this.end = null, !(this instanceof n)) return new n(e, t, r);
		if (typeof t == "string" ? this.base = this.parseComponent(t) : typeof t == "object" && t.steps && (this.base = t), i = this.checkType(e), i === "string") return this.str = e, je(this, this.parse(e));
		if (i === "range") return je(this, this.fromRange(e, this.base, r));
		if (i === "node") return je(this, this.fromNode(e, this.base, r));
		if (i === "EpubCFI" && e.path) return e;
		if (e) throw new TypeError("not a valid argument for EpubCFI");
		return this;
	}
	checkType(e) {
		return this.isCfiString(e) ? "string" : e && typeof e == "object" && (Cs(e) === "Range" || typeof e.startContainer != "undefined") ? "range" : e && typeof e == "object" && typeof e.nodeType != "undefined" ? "node" : e && typeof e == "object" && e instanceof n ? "EpubCFI" : !1;
	}
	parse(e) {
		var t = {
			spinePos: -1,
			range: !1,
			base: {},
			path: {},
			start: null,
			end: null
		}, r, i, s;
		return typeof e != "string" ? { spinePos: -1 } : (e.indexOf("epubcfi(") === 0 && e[e.length - 1] === ")" && (e = e.slice(8, e.length - 1)), r = this.getChapterComponent(e), r ? (t.base = this.parseComponent(r), i = this.getPathComponent(e), t.path = this.parseComponent(i), s = this.getRange(e), s && (t.range = !0, t.start = this.parseComponent(s[0]), t.end = this.parseComponent(s[1])), t.spinePos = t.base.steps[1].index, t) : { spinePos: -1 });
	}
	parseComponent(e) {
		var t = {
			steps: [],
			terminal: {
				offset: null,
				assertion: null
			}
		}, r = e.split(":"), i = r[0].split("/"), s;
		return r.length > 1 && (s = r[1], t.terminal = this.parseTerminal(s)), i[0] === "" && i.shift(), t.steps = i.map(function(a) {
			return this.parseStep(a);
		}.bind(this)), t;
	}
	parseStep(e) {
		var t, r, i, s, a;
		if (s = e.match(/\[(.*)\]/), s && s[1] && (a = s[1]), r = parseInt(e), !isNaN(r)) return r % 2 === 0 ? (t = "element", i = r / 2 - 1) : (t = "text", i = (r - 1) / 2), {
			type: t,
			index: i,
			id: a || null
		};
	}
	parseTerminal(e) {
		var t, r, i = e.match(/\[(.*)\]/);
		return i && i[1] ? (t = parseInt(e.split("[")[0]), r = i[1]) : t = parseInt(e), qe(t) || (t = null), {
			offset: t,
			assertion: r
		};
	}
	getChapterComponent(e) {
		return e.split("!")[0];
	}
	getPathComponent(e) {
		var t = e.split("!");
		if (t[1]) return t[1].split(",")[0];
	}
	getRange(e) {
		var t = e.split(",");
		return t.length === 3 ? [t[1], t[2]] : !1;
	}
	getCharecterOffsetComponent(e) {
		return e.split(":")[1] || "";
	}
	joinSteps(e) {
		return e ? e.map(function(t) {
			var r = "";
			return t.type === "element" && (r += (t.index + 1) * 2), t.type === "text" && (r += 1 + 2 * t.index), t.id && (r += "[" + t.id + "]"), r;
		}).join("/") : "";
	}
	segmentString(e) {
		var t = "/";
		return t += this.joinSteps(e.steps), e.terminal && e.terminal.offset != null && (t += ":" + e.terminal.offset), e.terminal && e.terminal.assertion != null && (t += "[" + e.terminal.assertion + "]"), t;
	}
	toString() {
		var e = "epubcfi(";
		return e += this.segmentString(this.base), e += "!", e += this.segmentString(this.path), this.range && this.start && (e += ",", e += this.segmentString(this.start)), this.range && this.end && (e += ",", e += this.segmentString(this.end)), e += ")", e;
	}
	compare(e, t) {
		var r, i, s, a;
		if (typeof e == "string" && (e = new n(e)), typeof t == "string" && (t = new n(t)), e.spinePos > t.spinePos) return 1;
		if (e.spinePos < t.spinePos) return -1;
		e.range ? (r = e.path.steps.concat(e.start.steps), s = e.start.terminal) : (r = e.path.steps, s = e.path.terminal), t.range ? (i = t.path.steps.concat(t.start.steps), a = t.start.terminal) : (i = t.path.steps, a = t.path.terminal);
		for (var _ = 0; _ < r.length; _++) {
			if (!r[_]) return -1;
			if (!i[_] || r[_].index > i[_].index) return 1;
			if (r[_].index < i[_].index) return -1;
		}
		return r.length < i.length ? -1 : s.offset > a.offset ? 1 : s.offset < a.offset ? -1 : 0;
	}
	step(e) {
		var t = e.nodeType === Ut ? "text" : "element";
		return {
			id: e.id,
			tagName: e.tagName,
			type: t,
			index: this.position(e)
		};
	}
	filteredStep(e, t) {
		var r = this.filter(e, t), i;
		if (r) return i = r.nodeType === Ut ? "text" : "element", {
			id: r.id,
			tagName: r.tagName,
			type: i,
			index: this.filteredPosition(r, t)
		};
	}
	pathTo(e, t, r) {
		for (var i = {
			steps: [],
			terminal: {
				offset: null,
				assertion: null
			}
		}, s = e, a; s && s.parentNode && s.parentNode.nodeType != Lc;) r ? a = this.filteredStep(s, r) : a = this.step(s), a && i.steps.unshift(a), s = s.parentNode;
		return t != null && t >= 0 && (i.terminal.offset = t, i.steps[i.steps.length - 1].type != "text" && i.steps.push({
			type: "text",
			index: 0
		})), i;
	}
	equalStep(e, t) {
		return !e || !t ? !1 : e.index === t.index && e.id === t.id && e.type === t.type;
	}
	fromRange(e, t, r) {
		var i = {
			range: !1,
			base: {},
			path: {},
			start: null,
			end: null
		}, s = e.startContainer, a = e.endContainer, o = e.startOffset, l = e.endOffset, u = !1;
		if (r && (u = s.ownerDocument.querySelector("." + r) != null), typeof t == "string" ? (i.base = this.parseComponent(t), i.spinePos = i.base.steps[1].index) : typeof t == "object" && (i.base = t), e.collapsed) u && (o = this.patchOffset(s, o, r)), i.path = this.pathTo(s, o, r);
		else {
			i.range = !0, u && (o = this.patchOffset(s, o, r)), i.start = this.pathTo(s, o, r), u && (l = this.patchOffset(a, l, r)), i.end = this.pathTo(a, l, r), i.path = {
				steps: [],
				terminal: null
			};
			var f = i.start.steps.length, c;
			for (c = 0; c < f && this.equalStep(i.start.steps[c], i.end.steps[c]); c++) c === f - 1 ? i.start.terminal === i.end.terminal && (i.path.steps.push(i.start.steps[c]), i.range = !1) : i.path.steps.push(i.start.steps[c]);
			i.start.steps = i.start.steps.slice(i.path.steps.length), i.end.steps = i.end.steps.slice(i.path.steps.length);
		}
		return i;
	}
	fromNode(e, t, r) {
		var i = {
			range: !1,
			base: {},
			path: {},
			start: null,
			end: null
		};
		return typeof t == "string" ? (i.base = this.parseComponent(t), i.spinePos = i.base.steps[1].index) : typeof t == "object" && (i.base = t), i.path = this.pathTo(e, null, r), i;
	}
	filter(e, t) {
		var r, i, s, a, o, l = !1;
		return e.nodeType === Ut ? (l = !0, s = e.parentNode, r = e.parentNode.classList.contains(t)) : (l = !1, r = e.classList.contains(t)), r && l ? (a = s.previousSibling, o = s.nextSibling, a && a.nodeType === Ut ? i = a : o && o.nodeType === Ut && (i = o), i || e) : r && !l ? !1 : e;
	}
	patchOffset(e, t, r) {
		if (e.nodeType != Ut) throw new Error("Anchor must be a text node");
		var i = e, s = t;
		for (e.parentNode.classList.contains(r) && (i = e.parentNode); i.previousSibling;) {
			if (i.previousSibling.nodeType === ei) if (i.previousSibling.classList.contains(r)) s += i.previousSibling.textContent.length;
			else break;
			else s += i.previousSibling.textContent.length;
			i = i.previousSibling;
		}
		return s;
	}
	normalizedMap(e, t, r) {
		var i = {}, s = -1, a, o = e.length, l, u;
		for (a = 0; a < o; a++) l = e[a].nodeType, l === ei && e[a].classList.contains(r) && (l = Ut), a > 0 && l === Ut && u === Ut ? i[a] = s : t === l && (s = s + 1, i[a] = s), u = l;
		return i;
	}
	position(e) {
		var t, r;
		return e.nodeType === ei ? (t = e.parentNode.children, t || (t = pn(e.parentNode)), r = Array.prototype.indexOf.call(t, e)) : (t = this.textNodes(e.parentNode), r = t.indexOf(e)), r;
	}
	filteredPosition(e, t) {
		var r, i, s;
		return e.nodeType === ei ? (r = e.parentNode.children, s = this.normalizedMap(r, ei, t)) : (r = e.parentNode.childNodes, e.parentNode.classList.contains(t) && (e = e.parentNode, r = e.parentNode.childNodes), s = this.normalizedMap(r, Ut, t)), i = Array.prototype.indexOf.call(r, e), s[i];
	}
	stepsToXpath(e) {
		var t = [".", "*"];
		return e.forEach(function(r) {
			var i = r.index + 1;
			r.id ? t.push("*[position()=" + i + " and @id='" + r.id + "']") : r.type === "text" ? t.push("text()[" + i + "]") : t.push("*[" + i + "]");
		}), t.join("/");
	}
	stepsToQuerySelector(e) {
		var t = ["html"];
		return e.forEach(function(r) {
			var i = r.index + 1;
			r.id ? t.push("#" + r.id) : r.type === "text" || t.push("*:nth-child(" + i + ")");
		}), t.join(">");
	}
	textNodes(e, t) {
		return Array.prototype.slice.call(e.childNodes).filter(function(r) {
			return r.nodeType === Ut ? !0 : !!(t && r.classList.contains(t));
		});
	}
	walkToNode(e, t, r) {
		var i = t || document, s = i.documentElement, a, o, l = e.length, u;
		for (u = 0; u < l && (o = e[u], o.type === "element" ? o.id ? s = i.getElementById(o.id) : (a = s.children || pn(s), s = a[o.index]) : o.type === "text" && (s = this.textNodes(s, r)[o.index]), !!s); u++);
		return s;
	}
	findNode(e, t, r) {
		var i = t || document, s, a;
		return !r && typeof i.evaluate != "undefined" ? (a = this.stepsToXpath(e), s = i.evaluate(a, i, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue) : r ? s = this.walkToNode(e, i, r) : s = this.walkToNode(e, i), s;
	}
	fixMiss(e, t, r, i) {
		var s = this.findNode(e.slice(0, -1), r, i), a = s.childNodes, o = this.normalizedMap(a, Ut, i), l, u, f = e[e.length - 1].index;
		for (let c in o) {
			if (!o.hasOwnProperty(c)) return;
			if (o[c] === f) if (l = a[c], u = l.textContent.length, t > u) t = t - u;
			else {
				l.nodeType === ei ? s = l.childNodes[0] : s = l;
				break;
			}
		}
		return {
			container: s,
			offset: t
		};
	}
	toRange(e, t) {
		var r = e || document, i, s, a, o, l, u = this, f, c, p = t ? r.querySelector("." + t) != null : !1, y;
		if (typeof r.createRange != "undefined" ? i = r.createRange() : i = new Si(), u.range ? (s = u.start, f = u.path.steps.concat(s.steps), o = this.findNode(f, r, p ? t : null), a = u.end, c = u.path.steps.concat(a.steps), l = this.findNode(c, r, p ? t : null)) : (s = u.path, f = u.path.steps, o = this.findNode(u.path.steps, r, p ? t : null)), o) try {
			s.terminal.offset != null ? i.setStart(o, s.terminal.offset) : i.setStart(o, 0);
		} catch {
			y = this.fixMiss(f, s.terminal.offset, r, p ? t : null), i.setStart(y.container, y.offset);
		}
		else return console.log("No startContainer found for", this.toString()), null;
		if (l) try {
			a.terminal.offset != null ? i.setEnd(l, a.terminal.offset) : i.setEnd(l, 0);
		} catch {
			y = this.fixMiss(c, u.end.terminal.offset, r, p ? t : null), i.setEnd(y.container, y.offset);
		}
		return i;
	}
	isCfiString(e) {
		return typeof e == "string" && e.indexOf("epubcfi(") === 0 && e[e.length - 1] === ")";
	}
	generateChapterComponent(e, t, r) {
		var i = parseInt(t), a = "/" + (e + 1) * 2 + "/";
		return a += (i + 1) * 2, r && (a += "[" + r + "]"), a;
	}
	collapse(e) {
		this.range && (this.range = !1, e ? (this.path.steps = this.path.steps.concat(this.start.steps), this.path.terminal = this.start.terminal) : (this.path.steps = this.path.steps.concat(this.end.steps), this.path.terminal = this.end.terminal));
	}
};
var Bs = class {
	constructor(e) {
		this.context = e || this, this.hooks = [];
	}
	register() {
		for (var e = 0; e < arguments.length; ++e) if (typeof arguments[e] == "function") this.hooks.push(arguments[e]);
		else for (var t = 0; t < arguments[e].length; ++t) this.hooks.push(arguments[e][t]);
	}
	deregister(e) {
		let t;
		for (let r = 0; r < this.hooks.length; r++) if (t = this.hooks[r], t === e) {
			this.hooks.splice(r, 1);
			break;
		}
	}
	trigger() {
		var e = arguments, t = this.context, r = [];
		return this.hooks.forEach(function(i) {
			try {
				var s = i.apply(t, e);
			} catch (a) {
				console.log(a);
			}
			s && typeof s.then == "function" && r.push(s);
		}), Promise.all(r);
	}
	list() {
		return this.hooks;
	}
	clear() {
		return this.hooks = [];
	}
};
var Rt = Bs;
function vn(n, e) {
	var t, r, i = e.url, s = i.indexOf("://") > -1;
	n && (r = ke(n, "head"), t = ke(r, "base"), t || (t = n.createElement("base"), r.insertBefore(t, r.firstChild)), !s && window && window.location && (i = window.location.origin + i), t.setAttribute("href", i));
}
function vu(n, e) {
	var t, r, i = e.canonical;
	n && (t = ke(n, "head"), r = ke(t, "link[rel='canonical']"), r ? r.setAttribute("href", i) : (r = n.createElement("link"), r.setAttribute("rel", "canonical"), r.setAttribute("href", i), t.appendChild(r)));
}
function gu(n, e) {
	var t, r, i = e.idref;
	n && (t = ke(n, "head"), r = ke(t, "link[property='dc.identifier']"), r ? r.setAttribute("content", i) : (r = n.createElement("meta"), r.setAttribute("name", "dc.identifier"), r.setAttribute("content", i), t.appendChild(r)));
}
function Eu(n, e) {
	var t = n.querySelectorAll("a[href]");
	if (t.length) for (var r = ke(n.ownerDocument, "base"), i = r ? r.getAttribute("href") : void 0, s = function(o) {
		var l = o.getAttribute("href");
		if (l.indexOf("mailto:") !== 0) if (l.indexOf("://") > -1) o.setAttribute("target", "_blank");
		else {
			var f;
			try {
				f = new Dt(l, i);
			} catch {}
			o.onclick = function() {
				return f && f.hash ? e(f.Path.path + f.hash) : e(f ? f.Path.path : l), !1;
			};
		}
	}.bind(this), a = 0; a < t.length; a++) s(t[a]);
}
function Ps(n, e, t) {
	return e.forEach(function(r, i) {
		r && t[i] && (r = r.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), n = n.replace(new RegExp(r, "g"), t[i]));
	}), n;
}
function Bc(n, e, t, r) {
	var i = typeof window != "undefined" ? window.URL : !1, s = i ? "blob" : "arraybuffer", a = new ge(), o = new XMLHttpRequest(), l = XMLHttpRequest.prototype, u;
	"overrideMimeType" in l || Object.defineProperty(l, "overrideMimeType", { value: function() {} }), t && (o.withCredentials = !0), o.onreadystatechange = c, o.onerror = f, o.open("GET", n, !0);
	for (u in r) o.setRequestHeader(u, r[u]);
	e == "json" && o.setRequestHeader("Accept", "application/json"), e || (e = new xt(n).extension), e == "blob" && (o.responseType = s), gr(e) && o.overrideMimeType("text/xml"), e == "binary" && (o.responseType = "arraybuffer"), o.send();
	function f(p) {
		a.reject(p);
	}
	function c() {
		if (this.readyState === XMLHttpRequest.DONE) {
			var p = !1;
			if ((this.responseType === "" || this.responseType === "document") && (p = this.responseXML), this.status === 200 || this.status === 0 || p) {
				var y;
				if (!this.response && !p) return a.reject({
					status: this.status,
					message: "Empty Response",
					stack: (/* @__PURE__ */ new Error()).stack
				}), a.promise;
				if (this.status === 403) return a.reject({
					status: this.status,
					response: this.response,
					message: "Forbidden",
					stack: (/* @__PURE__ */ new Error()).stack
				}), a.promise;
				p ? y = this.responseXML : gr(e) ? y = Lt(this.response, "text/xml") : e == "xhtml" ? y = Lt(this.response, "application/xhtml+xml") : e == "html" || e == "htm" ? y = Lt(this.response, "text/html") : e == "json" ? y = JSON.parse(this.response) : e == "blob" ? i ? y = this.response : y = new Blob([this.response]) : y = this.response, a.resolve(y);
			} else a.reject({
				status: this.status,
				message: this.response,
				stack: (/* @__PURE__ */ new Error()).stack
			});
		}
	}
	return a.promise;
}
var or = Bc;
var yu = rt(Es());
var Fs = class {
	constructor(e, t) {
		this.idref = e.idref, this.linear = e.linear === "yes", this.properties = e.properties, this.index = e.index, this.href = e.href, this.url = e.url, this.canonical = e.canonical, this.next = e.next, this.prev = e.prev, this.cfiBase = e.cfiBase, t ? this.hooks = t : (this.hooks = {}, this.hooks.serialize = new Rt(this), this.hooks.content = new Rt(this)), this.document = void 0, this.contents = void 0, this.output = void 0;
	}
	load(e) {
		var t = e || this.request || or, r = new ge(), i = r.promise;
		return this.contents ? r.resolve(this.contents) : t(this.url).then(function(s) {
			return this.document = s, this.contents = s.documentElement, this.hooks.content.trigger(this.document, this);
		}.bind(this)).then(function() {
			r.resolve(this.contents);
		}.bind(this)).catch(function(s) {
			r.reject(s);
		}), i;
	}
	base() {
		return vn(this.document, this);
	}
	render(e) {
		var t = new ge(), r = t.promise;
		return this.output, this.load(e).then(function(i) {
			var a = (typeof navigator != "undefined" && navigator.userAgent || "").indexOf("Trident") >= 0, o;
			typeof XMLSerializer == "undefined" || a ? o = yu.DOMParser : o = XMLSerializer;
			var l = new o();
			return this.output = l.serializeToString(i), this.output;
		}.bind(this)).then(function() {
			return this.hooks.serialize.trigger(this.output, this);
		}.bind(this)).then(function() {
			t.resolve(this.output);
		}.bind(this)).catch(function(i) {
			t.reject(i);
		}), r;
	}
	find(e) {
		var t = this, r = [], i = e.toLowerCase(), s = function(a) {
			for (var o = a.textContent.toLowerCase(), l = t.document.createRange(), u, f, c = -1, p, y = 150; f != -1;) f = o.indexOf(i, c + 1), f != -1 && (l = t.document.createRange(), l.setStart(a, f), l.setEnd(a, f + i.length), u = t.cfiFromRange(l), a.textContent.length < y ? p = a.textContent : (p = a.textContent.substring(f - y / 2, f + y / 2), p = "..." + p + "..."), r.push({
				cfi: u,
				excerpt: p
			})), c = f;
		};
		return Qr(t.document, function(a) {
			s(a);
		}), r;
	}
	search(e, t = 5) {
		if (typeof document.createTreeWalker == "undefined") return this.find(e);
		let r = [], i = 150, s = this, a = e.toLowerCase(), o = function(c) {
			let _ = c.reduce((N, I) => N + I.textContent, "").toLowerCase().indexOf(a);
			if (_ != -1) {
				let I = _ + a.length, d = 0, v = 0;
				if (_ < c[0].length) {
					let b;
					for (; d < c.length - 1 && (v += c[d].length, !(I <= v));) d += 1;
					let T = c[0], F = c[d], E = s.document.createRange();
					E.setStart(T, _);
					let A = c.slice(0, d).reduce((R, q) => R + q.textContent.length, 0);
					E.setEnd(F, A > I ? I : I - A), b = s.cfiFromRange(E);
					let C = c.slice(0, d + 1).reduce((R, q) => R + q.textContent, "");
					C.length > i && (C = C.substring(_ - i / 2, _ + i / 2), C = "..." + C + "..."), r.push({
						cfi: b,
						excerpt: C
					});
				}
			}
		}, l = document.createTreeWalker(s.document, NodeFilter.SHOW_TEXT, null, !1), u, f = [];
		for (; u = l.nextNode();) f.push(u), f.length == t && (o(f.slice(0, t)), f = f.slice(1, t));
		return f.length > 0 && o(f), r;
	}
	reconcileLayoutSettings(e) {
		var t = {
			layout: e.layout,
			spread: e.spread,
			orientation: e.orientation
		};
		return this.properties.forEach(function(r) {
			var i = r.replace("rendition:", ""), s = i.indexOf("-"), a, o;
			s != -1 && (a = i.slice(0, s), o = i.slice(s + 1), t[a] = o);
		}), t;
	}
	cfiFromRange(e) {
		return new _e(e, this.cfiBase).toString();
	}
	cfiFromElement(e) {
		return new _e(e, this.cfiBase).toString();
	}
	unload() {
		this.document = void 0, this.contents = void 0, this.output = void 0;
	}
	destroy() {
		this.unload(), this.hooks.serialize.clear(), this.hooks.content.clear(), this.hooks = void 0, this.idref = void 0, this.linear = void 0, this.properties = void 0, this.index = void 0, this.href = void 0, this.url = void 0, this.next = void 0, this.prev = void 0, this.cfiBase = void 0;
	}
};
var bu = Fs;
var Ms = class {
	constructor() {
		this.spineItems = [], this.spineByHref = {}, this.spineById = {}, this.hooks = {}, this.hooks.serialize = new Rt(), this.hooks.content = new Rt(), this.hooks.content.register(vn), this.hooks.content.register(vu), this.hooks.content.register(gu), this.epubcfi = new _e(), this.loaded = !1, this.items = void 0, this.manifest = void 0, this.spineNodeIndex = void 0, this.baseUrl = void 0, this.length = void 0;
	}
	unpack(e, t, r) {
		this.items = e.spine, this.manifest = e.manifest, this.spineNodeIndex = e.spineNodeIndex, this.baseUrl = e.baseUrl || e.basePath || "", this.length = this.items.length, this.items.forEach((i, s) => {
			var a = this.manifest[i.idref], o;
			i.index = s, i.cfiBase = this.epubcfi.generateChapterComponent(this.spineNodeIndex, i.index, i.id), i.href && (i.url = t(i.href, !0), i.canonical = r(i.href)), a && (i.href = a.href, i.url = t(i.href, !0), i.canonical = r(i.href), a.properties.length && i.properties.push.apply(i.properties, a.properties)), i.linear === "yes" ? (i.prev = function() {
				let l = i.index;
				for (; l > 0;) {
					let u = this.get(l - 1);
					if (u && u.linear) return u;
					l -= 1;
				}
			}.bind(this), i.next = function() {
				let l = i.index;
				for (; l < this.spineItems.length - 1;) {
					let u = this.get(l + 1);
					if (u && u.linear) return u;
					l += 1;
				}
			}.bind(this)) : (i.prev = function() {}, i.next = function() {}), o = new bu(i, this.hooks), this.append(o);
		}), this.loaded = !0;
	}
	get(e) {
		var t = 0;
		if (typeof e == "undefined") for (; t < this.spineItems.length;) {
			let r = this.spineItems[t];
			if (r && r.linear) break;
			t += 1;
		}
		else this.epubcfi.isCfiString(e) ? t = new _e(e).spinePos : typeof e == "number" || isNaN(e) === !1 ? t = e : typeof e == "string" && e.indexOf("#") === 0 ? t = this.spineById[e.substring(1)] : typeof e == "string" && (e = e.split("#")[0], t = this.spineByHref[e] || this.spineByHref[encodeURI(e)]);
		return this.spineItems[t] || null;
	}
	append(e) {
		var t = this.spineItems.length;
		return e.index = t, this.spineItems.push(e), this.spineByHref[decodeURI(e.href)] = t, this.spineByHref[encodeURI(e.href)] = t, this.spineByHref[e.href] = t, this.spineById[e.idref] = t, t;
	}
	prepend(e) {
		return this.spineByHref[e.href] = 0, this.spineById[e.idref] = 0, this.spineItems.forEach(function(t, r) {
			t.index = r;
		}), 0;
	}
	remove(e) {
		var t = this.spineItems.indexOf(e);
		if (t > -1) return delete this.spineByHref[e.href], delete this.spineById[e.idref], this.spineItems.splice(t, 1);
	}
	each() {
		return this.spineItems.forEach.apply(this.spineItems, arguments);
	}
	first() {
		let e = 0;
		do {
			let t = this.get(e);
			if (t && t.linear) return t;
			e += 1;
		} while (e < this.spineItems.length);
	}
	last() {
		let e = this.spineItems.length - 1;
		do {
			let t = this.get(e);
			if (t && t.linear) return t;
			e -= 1;
		} while (e >= 0);
	}
	destroy() {
		this.each((e) => e.destroy()), this.spineItems = void 0, this.spineByHref = void 0, this.spineById = void 0, this.hooks.serialize.clear(), this.hooks.content.clear(), this.hooks = void 0, this.epubcfi = void 0, this.loaded = !1, this.items = void 0, this.manifest = void 0, this.spineNodeIndex = void 0, this.baseUrl = void 0, this.length = void 0;
	}
};
var wu = Ms;
var zs = class {
	constructor(e) {
		this._q = [], this.context = e, this.tick = Ni, this.running = !1, this.paused = !1;
	}
	enqueue() {
		var e, t, r, i = [].shift.call(arguments), s = arguments;
		if (!i) throw new Error("No Task Provided");
		return typeof i == "function" ? (e = new ge(), t = e.promise, r = {
			task: i,
			args: s,
			deferred: e,
			promise: t
		}) : r = { promise: i }, this._q.push(r), this.paused == !1 && !this.running && this.run(), r.promise;
	}
	dequeue() {
		var e, t, r;
		if (this._q.length && !this.paused) {
			if (e = this._q.shift(), t = e.task, t) return r = t.apply(this.context, e.args), r && typeof r.then == "function" ? r.then(function() {
				e.deferred.resolve.apply(this.context, arguments);
			}.bind(this), function() {
				e.deferred.reject.apply(this.context, arguments);
			}.bind(this)) : (e.deferred.resolve.apply(this.context, r), e.promise);
			if (e.promise) return e.promise;
		} else return e = new ge(), e.deferred.resolve(), e.promise;
	}
	dump() {
		for (; this._q.length;) this.dequeue();
	}
	run() {
		return this.running || (this.running = !0, this.defered = new ge()), this.tick.call(window, () => {
			this._q.length ? this.dequeue().then(function() {
				this.run();
			}.bind(this)) : (this.defered.resolve(), this.running = void 0);
		}), this.paused == !0 && (this.paused = !1), this.defered.promise;
	}
	flush() {
		if (this.running) return this.running;
		if (this._q.length) return this.running = this.dequeue().then(function() {
			return this.running = void 0, this.flush();
		}.bind(this)), this.running;
	}
	clear() {
		this._q = [];
	}
	length() {
		return this._q.length;
	}
	pause() {
		this.paused = !0;
	}
	stop() {
		this._q = [], this.running = !1, this.paused = !0;
	}
};
var ti = zs;
var ri = [
	"keydown",
	"keyup",
	"keypressed",
	"mouseup",
	"mousedown",
	"mousemove",
	"click",
	"touchend",
	"touchstart",
	"touchmove"
];
var ee = {
	BOOK: { OPEN_FAILED: "openFailed" },
	CONTENTS: {
		EXPAND: "expand",
		RESIZE: "resize",
		SELECTED: "selected",
		SELECTED_RANGE: "selectedRange",
		LINK_CLICKED: "linkClicked"
	},
	LOCATIONS: { CHANGED: "changed" },
	MANAGERS: {
		RESIZE: "resize",
		RESIZED: "resized",
		ORIENTATION_CHANGE: "orientationchange",
		ADDED: "added",
		SCROLL: "scroll",
		SCROLLED: "scrolled",
		REMOVED: "removed"
	},
	VIEWS: {
		AXIS: "axis",
		WRITING_MODE: "writingMode",
		LOAD_ERROR: "loaderror",
		RENDERED: "rendered",
		RESIZED: "resized",
		DISPLAYED: "displayed",
		SHOWN: "shown",
		HIDDEN: "hidden",
		MARK_CLICKED: "markClicked"
	},
	RENDITION: {
		STARTED: "started",
		ATTACHED: "attached",
		DISPLAYED: "displayed",
		DISPLAY_ERROR: "displayerror",
		RENDERED: "rendered",
		REMOVED: "removed",
		RESIZED: "resized",
		ORIENTATION_CHANGE: "orientationchange",
		LOCATION_CHANGED: "locationChanged",
		RELOCATED: "relocated",
		MARK_CLICKED: "markClicked",
		SELECTED: "selected",
		LAYOUT: "layout"
	},
	LAYOUT: { UPDATED: "updated" },
	ANNOTATION: {
		ATTACH: "attach",
		DETACH: "detach"
	}
};
var _u = rt(Yt());
var gn = class {
	constructor(e, t, r) {
		this.spine = e, this.request = t, this.pause = r || 100, this.q = new ti(this), this.epubcfi = new _e(), this._locations = [], this._locationsWords = [], this.total = 0, this.break = 150, this._current = 0, this._wordCounter = 0, this.currentLocation = "", this._currentCfi = "", this.processingTimeout = void 0;
	}
	generate(e) {
		return e && (this.break = e), this.q.pause(), this.spine.each(function(t) {
			t.linear && this.q.enqueue(this.process.bind(this), t);
		}.bind(this)), this.q.run().then(function() {
			return this.total = this._locations.length - 1, this._currentCfi && (this.currentLocation = this._currentCfi), this._locations;
		}.bind(this));
	}
	createRange() {
		return {
			startContainer: void 0,
			startOffset: void 0,
			endContainer: void 0,
			endOffset: void 0
		};
	}
	process(e) {
		return e.load(this.request).then(function(t) {
			var r = new ge(), i = this.parse(t, e.cfiBase);
			return this._locations = this._locations.concat(i), e.unload(), this.processingTimeout = setTimeout(() => r.resolve(i), this.pause), r.promise;
		}.bind(this));
	}
	parse(e, t, r) {
		var i = [], s, a = e.ownerDocument, o = ke(a, "body"), l = 0, u, f = r || this.break, c = function(p) {
			var y = p.length, _, N = 0;
			if (p.textContent.trim().length === 0) return !1;
			for (l == 0 && (s = this.createRange(), s.startContainer = p, s.startOffset = 0), _ = f - l, _ > y && (l += y, N = y); N < y;) if (_ = f - l, l === 0 && (N += 1, s = this.createRange(), s.startContainer = p, s.startOffset = N), N + _ >= y) l += y - N, N = y;
			else {
				N += _, s.endContainer = p, s.endOffset = N;
				let I = new _e(s, t).toString();
				i.push(I), l = 0;
			}
			u = p;
		};
		if (Qr(o, c.bind(this)), s && s.startContainer && u) {
			s.endContainer = u, s.endOffset = u.length;
			let p = new _e(s, t).toString();
			i.push(p), l = 0;
		}
		return i;
	}
	generateFromWords(e, t, r) {
		var i = e ? new _e(e) : void 0;
		return this.q.pause(), this._locationsWords = [], this._wordCounter = 0, this.spine.each(function(s) {
			s.linear && (i ? s.index >= i.spinePos && this.q.enqueue(this.processWords.bind(this), s, t, i, r) : this.q.enqueue(this.processWords.bind(this), s, t, i, r));
		}.bind(this)), this.q.run().then(function() {
			return this._currentCfi && (this.currentLocation = this._currentCfi), this._locationsWords;
		}.bind(this));
	}
	processWords(e, t, r, i) {
		return i && this._locationsWords.length >= i ? Promise.resolve() : e.load(this.request).then(function(s) {
			var a = new ge(), o = this.parseWords(s, e, t, r), l = i - this._locationsWords.length;
			return this._locationsWords = this._locationsWords.concat(o.length >= i ? o.slice(0, l) : o), e.unload(), this.processingTimeout = setTimeout(() => a.resolve(o), this.pause), a.promise;
		}.bind(this));
	}
	countWords(e) {
		return e = e.replace(/(^\s*)|(\s*$)/gi, ""), e = e.replace(/[ ]{2,}/gi, " "), e = e.replace(/\n /, `
`), e.split(" ").length;
	}
	parseWords(e, t, r, i) {
		var s = t.cfiBase, a = [], o = e.ownerDocument, l = ke(o, "body"), f = r, c = i ? i.spinePos !== t.index : !0, p;
		i && t.index === i.spinePos && (p = i.findNode(i.range ? i.path.steps.concat(i.start.steps) : i.path.steps, e.ownerDocument));
		var y = function(_) {
			if (!c) if (_ === p) c = !0;
			else return !1;
			if (_.textContent.length < 10 && _.textContent.trim().length === 0) return !1;
			var N = this.countWords(_.textContent), I, d = 0;
			if (N === 0) return !1;
			for (I = f - this._wordCounter, I > N && (this._wordCounter += N, d = N); d < N;) if (I = f - this._wordCounter, d + I >= N) this._wordCounter += N - d, d = N;
			else {
				d += I;
				let v = new _e(_, s);
				a.push({
					cfi: v.toString(),
					wordCount: this._wordCounter
				}), this._wordCounter = 0;
			}
		};
		return Qr(l, y.bind(this)), a;
	}
	locationFromCfi(e) {
		let t;
		return _e.prototype.isCfiString(e) && (e = new _e(e)), this._locations.length === 0 ? -1 : (t = vr(e, this._locations, this.epubcfi.compare), t > this.total ? this.total : t);
	}
	percentageFromCfi(e) {
		if (this._locations.length === 0) return null;
		var t = this.locationFromCfi(e);
		return this.percentageFromLocation(t);
	}
	percentageFromLocation(e) {
		return !e || !this.total ? 0 : e / this.total;
	}
	cfiFromLocation(e) {
		var t = -1;
		return typeof e != "number" && (e = parseInt(e)), e >= 0 && e < this._locations.length && (t = this._locations[e]), t;
	}
	cfiFromPercentage(e) {
		let t;
		if (e > 1 && console.warn("Normalize cfiFromPercentage value to between 0 - 1"), e >= 1) {
			let r = new _e(this._locations[this.total]);
			return r.collapse(), r.toString();
		}
		return t = Math.ceil(this.total * e), this.cfiFromLocation(t);
	}
	load(e) {
		return typeof e == "string" ? this._locations = JSON.parse(e) : this._locations = e, this.total = this._locations.length - 1, this._locations;
	}
	save() {
		return JSON.stringify(this._locations);
	}
	getCurrent() {
		return this._current;
	}
	setCurrent(e) {
		var t;
		if (typeof e == "string") this._currentCfi = e;
		else if (typeof e == "number") this._current = e;
		else return;
		this._locations.length !== 0 && (typeof e == "string" ? (t = this.locationFromCfi(e), this._current = t) : t = e, this.emit(ee.LOCATIONS.CHANGED, { percentage: this.percentageFromLocation(t) }));
	}
	get currentLocation() {
		return this._current;
	}
	set currentLocation(e) {
		this.setCurrent(e);
	}
	length() {
		return this._locations.length;
	}
	destroy() {
		this.spine = void 0, this.request = void 0, this.pause = void 0, this.q.stop(), this.q = void 0, this.epubcfi = void 0, this._locations = void 0, this.total = void 0, this.break = void 0, this._current = void 0, this.currentLocation = void 0, this._currentCfi = void 0, clearTimeout(this.processingTimeout);
	}
};
(0, _u.default)(gn.prototype);
var xu = gn;
var Du = rt(Oi());
var Us = class {
	constructor(e) {
		this.packagePath = "", this.directory = "", this.encoding = "", e && this.parse(e);
	}
	parse(e) {
		var t;
		if (!e) throw new Error("Container File Not Found");
		if (t = ke(e, "rootfile"), !t) throw new Error("No RootFile Found");
		this.packagePath = t.getAttribute("full-path"), this.directory = Du.default.dirname(this.packagePath), this.encoding = e.xmlEncoding;
	}
	destroy() {
		this.packagePath = void 0, this.directory = void 0, this.encoding = void 0;
	}
};
var Au = Us;
var qs = class {
	constructor(e) {
		this.manifest = {}, this.navPath = "", this.ncxPath = "", this.coverPath = "", this.spineNodeIndex = 0, this.spine = [], this.metadata = {}, e && this.parse(e);
	}
	parse(e) {
		var t, r, i;
		if (!e) throw new Error("Package File Not Found");
		if (t = ke(e, "metadata"), !t) throw new Error("No Metadata Found");
		if (r = ke(e, "manifest"), !r) throw new Error("No Manifest Found");
		if (i = ke(e, "spine"), !i) throw new Error("No Spine Found");
		return this.manifest = this.parseManifest(r), this.navPath = this.findNavPath(r), this.ncxPath = this.findNcxPath(r, i), this.coverPath = this.findCoverPath(e), this.spineNodeIndex = Ds(i), this.spine = this.parseSpine(i, this.manifest), this.uniqueIdentifier = this.findUniqueIdentifier(e), this.metadata = this.parseMetadata(t), this.metadata.direction = i.getAttribute("page-progression-direction"), {
			metadata: this.metadata,
			spine: this.spine,
			manifest: this.manifest,
			navPath: this.navPath,
			ncxPath: this.ncxPath,
			coverPath: this.coverPath,
			spineNodeIndex: this.spineNodeIndex
		};
	}
	parseMetadata(e) {
		var t = {};
		return t.title = this.getElementText(e, "title"), t.creator = this.getElementText(e, "creator"), t.description = this.getElementText(e, "description"), t.pubdate = this.getElementText(e, "date"), t.publisher = this.getElementText(e, "publisher"), t.identifier = this.getElementText(e, "identifier"), t.language = this.getElementText(e, "language"), t.rights = this.getElementText(e, "rights"), t.modified_date = this.getPropertyText(e, "dcterms:modified"), t.layout = this.getPropertyText(e, "rendition:layout"), t.orientation = this.getPropertyText(e, "rendition:orientation"), t.flow = this.getPropertyText(e, "rendition:flow"), t.viewport = this.getPropertyText(e, "rendition:viewport"), t.media_active_class = this.getPropertyText(e, "media:active-class"), t.spread = this.getPropertyText(e, "rendition:spread"), t;
	}
	parseManifest(e) {
		var t = {}, r = Bt(e, "item");
		return Array.prototype.slice.call(r).forEach(function(s) {
			var a = s.getAttribute("id"), o = s.getAttribute("href") || "", l = s.getAttribute("media-type") || "", u = s.getAttribute("media-overlay") || "", f = s.getAttribute("properties") || "";
			t[a] = {
				href: o,
				type: l,
				overlay: u,
				properties: f.length ? f.split(" ") : []
			};
		}), t;
	}
	parseSpine(e, t) {
		var r = [], i = Bt(e, "itemref");
		return Array.prototype.slice.call(i).forEach(function(a, o) {
			var l = a.getAttribute("idref"), u = a.getAttribute("properties") || "", f = u.length ? u.split(" ") : [], c = {
				id: a.getAttribute("id"),
				idref: l,
				linear: a.getAttribute("linear") || "yes",
				properties: f,
				index: o
			};
			r.push(c);
		}), r;
	}
	findUniqueIdentifier(e) {
		var t = e.documentElement.getAttribute("unique-identifier");
		if (!t) return "";
		var r = e.getElementById(t);
		return r && r.localName === "identifier" && r.namespaceURI === "http://purl.org/dc/elements/1.1/" && r.childNodes.length > 0 ? r.childNodes[0].nodeValue.trim() : "";
	}
	findNavPath(e) {
		var t = xr(e, "item", { properties: "nav" });
		return t ? t.getAttribute("href") : !1;
	}
	findNcxPath(e, t) {
		var r = xr(e, "item", { "media-type": "application/x-dtbncx+xml" }), i;
		return r || (i = t.getAttribute("toc"), i && (r = e.querySelector(`#${i}`))), r ? r.getAttribute("href") : !1;
	}
	findCoverPath(e) {
		ke(e, "package").getAttribute("version");
		var i = xr(e, "item", { properties: "cover-image" });
		if (i) return i.getAttribute("href");
		var s = xr(e, "meta", { name: "cover" });
		if (s) {
			var a = s.getAttribute("content"), o = e.getElementById(a);
			return o ? o.getAttribute("href") : "";
		} else return !1;
	}
	getElementText(e, t) {
		var r = e.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", t), i;
		return !r || r.length === 0 ? "" : (i = r[0], i.childNodes.length ? i.childNodes[0].nodeValue : "");
	}
	getPropertyText(e, t) {
		var r = xr(e, "meta", { property: t });
		return r && r.childNodes.length ? r.childNodes[0].nodeValue : "";
	}
	load(e) {
		this.metadata = e.metadata;
		let t = e.readingOrder || e.spine;
		return this.spine = t.map((r, i) => (r.index = i, r.linear = r.linear || "yes", r)), e.resources.forEach((r, i) => {
			this.manifest[i] = r, r.rel && r.rel[0] === "cover" && (this.coverPath = r.href);
		}), this.spineNodeIndex = 0, this.toc = e.toc.map((r, i) => (r.label = r.title, r)), {
			metadata: this.metadata,
			spine: this.spine,
			manifest: this.manifest,
			navPath: this.navPath,
			ncxPath: this.ncxPath,
			coverPath: this.coverPath,
			spineNodeIndex: this.spineNodeIndex,
			toc: this.toc
		};
	}
	destroy() {
		this.manifest = void 0, this.navPath = void 0, this.ncxPath = void 0, this.coverPath = void 0, this.spineNodeIndex = void 0, this.spine = void 0, this.metadata = void 0;
	}
};
var Ws = qs;
var js = class {
	constructor(e) {
		this.toc = [], this.tocByHref = {}, this.tocById = {}, this.landmarks = [], this.landmarksByType = {}, this.length = 0, e && this.parse(e);
	}
	parse(e) {
		let t = e.nodeType, r, i;
		t && (r = ke(e, "html"), i = ke(e, "ncx")), t ? r ? (this.toc = this.parseNav(e), this.landmarks = this.parseLandmarks(e)) : i && (this.toc = this.parseNcx(e)) : this.toc = this.load(e), this.length = 0, this.unpack(this.toc);
	}
	unpack(e) {
		for (var t, r = 0; r < e.length; r++) t = e[r], t.href && (this.tocByHref[t.href] = r), t.id && (this.tocById[t.id] = r), this.length++, t.subitems.length && this.unpack(t.subitems);
	}
	get(e) {
		var t;
		return e ? (e.indexOf("#") === 0 ? t = this.tocById[e.substring(1)] : e in this.tocByHref && (t = this.tocByHref[e]), this.getByIndex(e, t, this.toc)) : this.toc;
	}
	getByIndex(e, t, r) {
		if (r.length === 0) return;
		let i = r[t];
		if (i && (e === i.id || e === i.href)) return i;
		{
			let s;
			for (let a = 0; a < r.length && (s = this.getByIndex(e, t, r[a].subitems), !s); ++a);
			return s;
		}
	}
	landmark(e) {
		var t;
		return e ? (t = this.landmarksByType[e], this.landmarks[t]) : this.landmarks;
	}
	parseNav(e) {
		var t = Jr(e, "nav", "toc"), r = [];
		if (!t) return r;
		let i = Dr(t, "ol", !0);
		return i && (r = this.parseNavList(i)), r;
	}
	parseNavList(e, t) {
		let r = [];
		if (!e || !e.children) return r;
		for (let i = 0; i < e.children.length; i++) {
			let s = this.navItem(e.children[i], t);
			s && r.push(s);
		}
		return r;
	}
	navItem(e, t) {
		let r = e.getAttribute("id") || void 0, i = Dr(e, "a", !0) || Dr(e, "span", !0);
		if (!i) return;
		let s = i.getAttribute("href") || "";
		r || (r = s);
		let a = i.textContent || "", o = [], l = Dr(e, "ol", !0);
		return l && (o = this.parseNavList(l, r)), {
			id: r,
			href: s,
			label: a,
			subitems: o,
			parent: t
		};
	}
	parseLandmarks(e) {
		var t = Jr(e, "nav", "landmarks"), r = t ? Bt(t, "li") : [], i = r.length, s, a = [], o;
		if (!r || i === 0) return a;
		for (s = 0; s < i; ++s) o = this.landmarkItem(r[s]), o && (a.push(o), this.landmarksByType[o.type] = s);
		return a;
	}
	landmarkItem(e) {
		let t = Dr(e, "a", !0);
		if (!t) return;
		let r = t.getAttributeNS("http://www.idpf.org/2007/ops", "type") || void 0;
		return {
			href: t.getAttribute("href") || "",
			label: t.textContent || "",
			type: r
		};
	}
	parseNcx(e) {
		var t = Bt(e, "navPoint"), r = t.length, i, s = {}, a = [], o, l;
		if (!t || r === 0) return a;
		for (i = 0; i < r; ++i) o = this.ncxItem(t[i]), s[o.id] = o, o.parent ? (l = s[o.parent], l.subitems.push(o)) : a.push(o);
		return a;
	}
	ncxItem(e) {
		var t = e.getAttribute("id") || !1, i = ke(e, "content").getAttribute("src"), s = ke(e, "navLabel"), a = s.textContent ? s.textContent : "", o = [], l = e.parentNode, u;
		return l && (l.nodeName === "navPoint" || l.nodeName.split(":").slice(-1)[0] === "navPoint") && (u = l.getAttribute("id")), {
			id: t,
			href: i,
			label: a,
			subitems: o,
			parent: u
		};
	}
	load(e) {
		return e.map((t) => (t.label = t.title, t.subitems = t.children ? this.load(t.children) : [], t));
	}
	forEach(e) {
		return this.toc.forEach(e);
	}
};
var En = js;
var ki = {
	application: {
		ecmascript: ["es", "ecma"],
		javascript: "js",
		ogg: "ogx",
		pdf: "pdf",
		postscript: [
			"ps",
			"ai",
			"eps",
			"epsi",
			"epsf",
			"eps2",
			"eps3"
		],
		"rdf+xml": "rdf",
		smil: ["smi", "smil"],
		"xhtml+xml": ["xhtml", "xht"],
		xml: [
			"xml",
			"xsl",
			"xsd",
			"opf",
			"ncx"
		],
		zip: "zip",
		"x-httpd-eruby": "rhtml",
		"x-latex": "latex",
		"x-maker": [
			"frm",
			"maker",
			"frame",
			"fm",
			"fb",
			"book",
			"fbdoc"
		],
		"x-object": "o",
		"x-shockwave-flash": ["swf", "swfl"],
		"x-silverlight": "scr",
		"epub+zip": "epub",
		"font-tdpfr": "pfr",
		"inkml+xml": ["ink", "inkml"],
		json: "json",
		"jsonml+json": "jsonml",
		"mathml+xml": "mathml",
		"metalink+xml": "metalink",
		mp4: "mp4s",
		"omdoc+xml": "omdoc",
		oxps: "oxps",
		"vnd.amazon.ebook": "azw",
		widget: "wgt",
		"x-dtbook+xml": "dtb",
		"x-dtbresource+xml": "res",
		"x-font-bdf": "bdf",
		"x-font-ghostscript": "gsf",
		"x-font-linux-psf": "psf",
		"x-font-otf": "otf",
		"x-font-pcf": "pcf",
		"x-font-snf": "snf",
		"x-font-ttf": ["ttf", "ttc"],
		"x-font-type1": [
			"pfa",
			"pfb",
			"pfm",
			"afm"
		],
		"x-font-woff": "woff",
		"x-mobipocket-ebook": ["prc", "mobi"],
		"x-mspublisher": "pub",
		"x-nzb": "nzb",
		"x-tgif": "obj",
		"xaml+xml": "xaml",
		"xml-dtd": "dtd",
		"xproc+xml": "xpl",
		"xslt+xml": "xslt",
		"internet-property-stream": "acx",
		"x-compress": "z",
		"x-compressed": "tgz",
		"x-gzip": "gz"
	},
	audio: {
		flac: "flac",
		midi: [
			"mid",
			"midi",
			"kar",
			"rmi"
		],
		mpeg: [
			"mpga",
			"mpega",
			"mp2",
			"mp3",
			"m4a",
			"mp2a",
			"m2a",
			"m3a"
		],
		mpegurl: "m3u",
		ogg: [
			"oga",
			"ogg",
			"spx"
		],
		"x-aiff": [
			"aif",
			"aiff",
			"aifc"
		],
		"x-ms-wma": "wma",
		"x-wav": "wav",
		adpcm: "adp",
		mp4: "mp4a",
		webm: "weba",
		"x-aac": "aac",
		"x-caf": "caf",
		"x-matroska": "mka",
		"x-pn-realaudio-plugin": "rmp",
		xm: "xm",
		mid: ["mid", "rmi"]
	},
	image: {
		gif: "gif",
		ief: "ief",
		jpeg: [
			"jpeg",
			"jpg",
			"jpe"
		],
		pcx: "pcx",
		png: "png",
		"svg+xml": ["svg", "svgz"],
		tiff: ["tiff", "tif"],
		"x-icon": "ico",
		bmp: "bmp",
		webp: "webp",
		"x-pict": ["pic", "pct"],
		"x-tga": "tga",
		"cis-cod": "cod"
	},
	text: {
		"cache-manifest": ["manifest", "appcache"],
		css: "css",
		csv: "csv",
		html: [
			"html",
			"htm",
			"shtml",
			"stm"
		],
		mathml: "mml",
		plain: [
			"txt",
			"text",
			"brf",
			"conf",
			"def",
			"list",
			"log",
			"in",
			"bas"
		],
		richtext: "rtx",
		"tab-separated-values": "tsv",
		"x-bibtex": "bib"
	},
	video: {
		mpeg: [
			"mpeg",
			"mpg",
			"mpe",
			"m1v",
			"m2v",
			"mp2",
			"mpa",
			"mpv2"
		],
		mp4: [
			"mp4",
			"mp4v",
			"mpg4"
		],
		quicktime: ["qt", "mov"],
		ogg: "ogv",
		"vnd.mpegurl": ["mxu", "m4u"],
		"x-flv": "flv",
		"x-la-asf": ["lsf", "lsx"],
		"x-mng": "mng",
		"x-ms-asf": [
			"asf",
			"asx",
			"asr"
		],
		"x-ms-wm": "wm",
		"x-ms-wmv": "wmv",
		"x-ms-wmx": "wmx",
		"x-ms-wvx": "wvx",
		"x-msvideo": "avi",
		"x-sgi-movie": "movie",
		"x-matroska": [
			"mpv",
			"mkv",
			"mk3d",
			"mks"
		],
		"3gpp2": "3g2",
		h261: "h261",
		h263: "h263",
		h264: "h264",
		jpeg: "jpgv",
		jpm: ["jpm", "jpgm"],
		mj2: ["mj2", "mjp2"],
		"vnd.ms-playready.media.pyv": "pyv",
		"vnd.uvvu.mp4": ["uvu", "uvvu"],
		"vnd.vivo": "viv",
		webm: "webm",
		"x-f4v": "f4v",
		"x-m4v": "m4v",
		"x-ms-vob": "vob",
		"x-smv": "smv"
	}
};
var Pc = (function() {
	var n, e, t, r, i = {};
	for (n in ki) if (ki.hasOwnProperty(n)) {
		for (e in ki[n]) if (ki[n].hasOwnProperty(e)) if (t = ki[n][e], typeof t == "string") i[t] = n + "/" + e;
		else for (r = 0; r < t.length; r++) i[t[r]] = n + "/" + e;
	}
	return i;
})();
var Fc = "text/plain";
function Mc(n) {
	return n && Pc[n.split(".").pop().toLowerCase()] || Fc;
}
var ur = { lookup: Mc };
var Cu = rt(Oi());
var Hs = class {
	constructor(e, t) {
		this.settings = {
			replacements: t && t.replacements || "base64",
			archive: t && t.archive,
			resolver: t && t.resolver,
			request: t && t.request
		}, this.process(e);
	}
	process(e) {
		this.manifest = e, this.resources = Object.keys(e).map(function(t) {
			return e[t];
		}), this.replacementUrls = [], this.html = [], this.assets = [], this.css = [], this.urls = [], this.cssUrls = [], this.split(), this.splitUrls();
	}
	split() {
		this.html = this.resources.filter(function(e) {
			if (e.type === "application/xhtml+xml" || e.type === "text/html") return !0;
		}), this.assets = this.resources.filter(function(e) {
			if (e.type !== "application/xhtml+xml" && e.type !== "text/html") return !0;
		}), this.css = this.resources.filter(function(e) {
			if (e.type === "text/css") return !0;
		});
	}
	splitUrls() {
		this.urls = this.assets.map(function(e) {
			return e.href;
		}.bind(this)), this.cssUrls = this.css.map(function(e) {
			return e.href;
		});
	}
	createUrl(e) {
		var t = new Dt(e), r = ur.lookup(t.filename);
		return this.settings.archive ? this.settings.archive.createUrl(e, { base64: this.settings.replacements === "base64" }) : this.settings.replacements === "base64" ? this.settings.request(e, "blob").then((i) => Ss(i)).then((i) => dn(i, r)) : this.settings.request(e, "blob").then((i) => $r(i, r));
	}
	replacements() {
		if (this.settings.replacements === "none") return new Promise(function(t) {
			t(this.urls);
		}.bind(this));
		var e = this.urls.map((t) => {
			var r = this.settings.resolver(t);
			return this.createUrl(r).catch((i) => (console.error(i), null));
		});
		return Promise.all(e).then((t) => (this.replacementUrls = t.filter((r) => typeof r == "string"), t));
	}
	replaceCss(e, t) {
		var r = [];
		return e = e || this.settings.archive, t = t || this.settings.resolver, this.cssUrls.forEach(function(i) {
			var s = this.createCssFile(i, e, t).then(function(a) {
				var o = this.urls.indexOf(i);
				o > -1 && (this.replacementUrls[o] = a);
			}.bind(this));
			r.push(s);
		}.bind(this)), Promise.all(r);
	}
	createCssFile(e) {
		var t;
		if (Cu.default.isAbsolute(e)) return new Promise(function(a) {
			a();
		});
		var r = this.settings.resolver(e), i;
		this.settings.archive ? i = this.settings.archive.getText(r) : i = this.settings.request(r, "text");
		var s = this.urls.map((a) => {
			var o = this.settings.resolver(a);
			return new xt(r).relative(o);
		});
		return i ? i.then((a) => (a = Ps(a, s, this.replacementUrls), this.settings.replacements === "base64" ? t = dn(a, "text/css") : t = $r(a, "text/css"), t), (a) => new Promise(function(o) {
			o();
		})) : new Promise(function(a) {
			a();
		});
	}
	relativeTo(e, t) {
		return t = t || this.settings.resolver, this.urls.map(function(r) {
			var i = t(r);
			return new xt(e).relative(i);
		}.bind(this));
	}
	get(e) {
		var t = this.urls.indexOf(e);
		if (t !== -1) return this.replacementUrls.length ? new Promise(function(r, i) {
			r(this.replacementUrls[t]);
		}.bind(this)) : this.createUrl(e);
	}
	substitute(e, t) {
		var r;
		return t ? r = this.relativeTo(t) : r = this.urls, Ps(e, r, this.replacementUrls);
	}
	destroy() {
		this.settings = void 0, this.manifest = void 0, this.resources = void 0, this.replacementUrls = void 0, this.html = void 0, this.assets = void 0, this.css = void 0, this.urls = void 0, this.cssUrls = void 0;
	}
};
var Tu = Hs;
var Vs = class {
	constructor(e) {
		this.pages = [], this.locations = [], this.epubcfi = new _e(), this.firstPage = 0, this.lastPage = 0, this.totalPages = 0, this.toc = void 0, this.ncx = void 0, e && (this.pageList = this.parse(e)), this.pageList && this.pageList.length && this.process(this.pageList);
	}
	parse(e) {
		var t = ke(e, "html"), r = ke(e, "ncx");
		if (t) return this.parseNav(e);
		if (r) return this.parseNcx(e);
	}
	parseNav(e) {
		var t = Jr(e, "nav", "page-list"), r = t ? Bt(t, "li") : [], i = r.length, s, a = [], o;
		if (!r || i === 0) return a;
		for (s = 0; s < i; ++s) o = this.item(r[s]), a.push(o);
		return a;
	}
	parseNcx(e) {
		var t = [], r = 0, i, s, a, o = 0;
		if (s = ke(e, "pageList"), !s || (a = Bt(s, "pageTarget"), o = a.length, !a || a.length === 0)) return t;
		for (r = 0; r < o; ++r) i = this.ncxItem(a[r]), t.push(i);
		return t;
	}
	ncxItem(e) {
		var i = ke(ke(e, "navLabel"), "text").textContent;
		return {
			href: ke(e, "content").getAttribute("src"),
			page: parseInt(i, 10)
		};
	}
	item(e) {
		var t = ke(e, "a"), r = t.getAttribute("href") || "", i = t.textContent || "", s = parseInt(i), a = r.indexOf("epubcfi"), o, l, u;
		return a != -1 ? (o = r.split("#"), l = o[0], u = o.length > 1 ? o[1] : !1, {
			cfi: u,
			href: r,
			packageUrl: l,
			page: s
		}) : {
			href: r,
			page: s
		};
	}
	process(e) {
		e.forEach(function(t) {
			this.pages.push(t.page), t.cfi && this.locations.push(t.cfi);
		}, this), this.firstPage = parseInt(this.pages[0]), this.lastPage = parseInt(this.pages[this.pages.length - 1]), this.totalPages = this.lastPage - this.firstPage;
	}
	pageFromCfi(e) {
		var t = -1;
		if (this.locations.length === 0) return -1;
		var r = Ti(e, this.locations, this.epubcfi.compare);
		return r != -1 ? t = this.pages[r] : (r = vr(e, this.locations, this.epubcfi.compare), t = r - 1 >= 0 ? this.pages[r - 1] : this.pages[0], t !== void 0 || (t = -1)), t;
	}
	cfiFromPage(e) {
		var t = -1;
		typeof e != "number" && (e = parseInt(e));
		var r = this.pages.indexOf(e);
		return r != -1 && (t = this.locations[r]), t;
	}
	pageFromPercentage(e) {
		return Math.round(this.totalPages * e);
	}
	percentageFromPage(e) {
		var t = (e - this.firstPage) / this.totalPages;
		return Math.round(t * 1e3) / 1e3;
	}
	percentageFromCfi(e) {
		var t = this.pageFromCfi(e);
		return this.percentageFromPage(t);
	}
	destroy() {
		this.pages = void 0, this.locations = void 0, this.epubcfi = void 0, this.pageList = void 0, this.toc = void 0, this.ncx = void 0;
	}
};
var yn = Vs;
var Rl = rt(Yt());
var Su = rt(Yt());
var bn = class {
	constructor(e) {
		this.settings = e, this.name = e.layout || "reflowable", this._spread = e.spread !== "none", this._minSpreadWidth = e.minSpreadWidth || 800, this._evenSpreads = e.evenSpreads || !1, e.flow === "scrolled" || e.flow === "scrolled-continuous" || e.flow === "scrolled-doc" ? this._flow = "scrolled" : this._flow = "paginated", this.width = 0, this.height = 0, this.spreadWidth = 0, this.delta = 0, this.columnWidth = 0, this.gap = 0, this.divisor = 1, this.props = {
			name: this.name,
			spread: this._spread,
			flow: this._flow,
			width: 0,
			height: 0,
			spreadWidth: 0,
			delta: 0,
			columnWidth: 0,
			gap: 0,
			divisor: 1
		};
	}
	flow(e) {
		return typeof e != "undefined" && (e === "scrolled" || e === "scrolled-continuous" || e === "scrolled-doc" ? this._flow = "scrolled" : this._flow = "paginated", this.update({ flow: this._flow })), this._flow;
	}
	spread(e, t) {
		return e && (this._spread = e !== "none", this.update({ spread: this._spread })), t >= 0 && (this._minSpreadWidth = t), this._spread;
	}
	calculate(e, t, r) {
		var i = 1, s = r || 0, a = e, o = t, l = Math.floor(a / 12), u, f, c, p;
		this._spread && a >= this._minSpreadWidth ? i = 2 : i = 1, this.name === "reflowable" && this._flow === "paginated" && !(r >= 0) && (s = l % 2 === 0 ? l : l - 1), this.name === "pre-paginated" && (s = 0), i > 1 ? (u = a / i - s, c = u + s) : (u = a, c = a), this.name === "pre-paginated" && i > 1 && (a = u), f = u * i + s, p = a, this.width = a, this.height = o, this.spreadWidth = f, this.pageWidth = c, this.delta = p, this.columnWidth = u, this.gap = s, this.divisor = i, this.update({
			width: a,
			height: o,
			spreadWidth: f,
			pageWidth: c,
			delta: p,
			columnWidth: u,
			gap: s,
			divisor: i
		});
	}
	format(e, t, r) {
		var i;
		return this.name === "pre-paginated" ? i = e.fit(this.columnWidth, this.height, t) : this._flow === "paginated" ? i = e.columns(this.width, this.height, this.columnWidth, this.gap, this.settings.direction) : r && r === "horizontal" ? i = e.size(null, this.height) : i = e.size(this.width, null), i;
	}
	count(e, t) {
		let r, i;
		return this.name === "pre-paginated" ? (r = 1, i = 1) : this._flow === "paginated" ? (t = t || this.delta, r = Math.ceil(e / t), i = r * this.divisor) : (t = t || this.height, r = Math.ceil(e / t), i = r), {
			spreads: r,
			pages: i
		};
	}
	update(e) {
		if (Object.keys(e).forEach((t) => {
			this.props[t] === e[t] && delete e[t];
		}), Object.keys(e).length > 0) {
			let t = je(this.props, e);
			this.emit(ee.LAYOUT.UPDATED, t, e);
		}
	}
};
(0, Su.default)(bn.prototype);
var Gs = bn;
var Ys = class {
	constructor(e) {
		this.rendition = e, this._themes = { default: {
			rules: {},
			url: "",
			serialized: ""
		} }, this._overrides = {}, this._current = "default", this._injected = [], this.rendition.hooks.content.register(this.inject.bind(this)), this.rendition.hooks.content.register(this.overrides.bind(this));
	}
	register() {
		if (arguments.length !== 0) {
			if (arguments.length === 1 && typeof arguments[0] == "object") return this.registerThemes(arguments[0]);
			if (arguments.length === 1 && typeof arguments[0] == "string") return this.default(arguments[0]);
			if (arguments.length === 2 && typeof arguments[1] == "string") return this.registerUrl(arguments[0], arguments[1]);
			if (arguments.length === 2 && typeof arguments[1] == "object") return this.registerRules(arguments[0], arguments[1]);
		}
	}
	default(e) {
		if (e) {
			if (typeof e == "string") return this.registerUrl("default", e);
			if (typeof e == "object") return this.registerRules("default", e);
		}
	}
	registerThemes(e) {
		for (var t in e) e.hasOwnProperty(t) && (typeof e[t] == "string" ? this.registerUrl(t, e[t]) : this.registerRules(t, e[t]));
	}
	registerCss(e, t) {
		this._themes[e] = { serialized: t }, (this._injected[e] || e == "default") && this.update(e);
	}
	registerUrl(e, t) {
		var r = new Dt(t);
		this._themes[e] = { url: r.toString() }, (this._injected[e] || e == "default") && this.update(e);
	}
	registerRules(e, t) {
		this._themes[e] = { rules: t }, (this._injected[e] || e == "default") && this.update(e);
	}
	select(e) {
		var t = this._current, r;
		this._current = e, this.update(e), r = this.rendition.getContents(), r.forEach((i) => {
			i.removeClass(t), i.addClass(e);
		});
	}
	update(e) {
		this.rendition.getContents().forEach((r) => {
			this.add(e, r);
		});
	}
	inject(e) {
		var t = [], r = this._themes, i;
		for (var s in r) r.hasOwnProperty(s) && (s === this._current || s === "default") && (i = r[s], (i.rules && Object.keys(i.rules).length > 0 || i.url && t.indexOf(i.url) === -1) && this.add(s, e), this._injected.push(s));
		this._current != "default" && e.addClass(this._current);
	}
	add(e, t) {
		var r = this._themes[e];
		!r || !t || (r.url ? t.addStylesheet(r.url) : r.serialized ? (t.addStylesheetCss(r.serialized, e), r.injected = !0) : r.rules && (t.addStylesheetRules(r.rules, e), r.injected = !0));
	}
	override(e, t, r) {
		var i = this.rendition.getContents();
		this._overrides[e] = {
			value: t,
			priority: r === !0
		}, i.forEach((s) => {
			s.css(e, this._overrides[e].value, this._overrides[e].priority);
		});
	}
	removeOverride(e) {
		var t = this.rendition.getContents();
		delete this._overrides[e], t.forEach((r) => {
			r.css(e);
		});
	}
	overrides(e) {
		var t = this._overrides;
		for (var r in t) t.hasOwnProperty(r) && e.css(r, t[r].value, t[r].priority);
	}
	fontSize(e) {
		this.override("font-size", e);
	}
	font(e) {
		this.override("font-family", e, !0);
	}
	destroy() {
		this.rendition = void 0, this._themes = void 0, this._overrides = void 0, this._current = void 0, this._injected = void 0;
	}
};
var Nu = Ys;
var Ou = rt(Yt());
var Zs = class {
	constructor(e, t, r, i = !1) {
		this.layout = e, this.horizontal = r === "horizontal", this.direction = t || "ltr", this._dev = i;
	}
	section(e) {
		var t = this.findRanges(e);
		return this.rangeListToCfiList(e.section.cfiBase, t);
	}
	page(e, t, r, i) {
		var s = e && e.document ? e.document.body : !1, a;
		if (s) {
			if (a = this.rangePairToCfiPair(t, {
				start: this.findStart(s, r, i),
				end: this.findEnd(s, r, i)
			}), this._dev === !0) {
				let o = e.document, l = new _e(a.start).toRange(o), u = new _e(a.end).toRange(o), f = o.defaultView.getSelection(), c = o.createRange();
				f.removeAllRanges(), c.setStart(l.startContainer, l.startOffset), c.setEnd(u.endContainer, u.endOffset), f.addRange(c);
			}
			return a;
		}
	}
	walk(e, t) {
		if (!(e && e.nodeType === Node.TEXT_NODE)) {
			var r = { acceptNode: function(l) {
				return l.data.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
			} }, i = r.acceptNode;
			i.acceptNode = r.acceptNode;
			for (var s = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, i, !1), a, o; (a = s.nextNode()) && (o = t(a), !o););
			return o;
		}
	}
	findRanges(e) {
		for (var t = [], r = e.contents.scrollWidth(), s = Math.ceil(r / this.layout.spreadWidth) * this.layout.divisor, a = this.layout.columnWidth, o = this.layout.gap, l, u, f = 0; f < s.pages; f++) l = (a + o) * f, u = a * (f + 1) + o * f, t.push({
			start: this.findStart(e.document.body, l, u),
			end: this.findEnd(e.document.body, l, u)
		});
		return t;
	}
	findStart(e, t, r) {
		for (var i = [e], s, a, o = e; i.length;) if (s = i.shift(), a = this.walk(s, (l) => {
			var u, f, c, p, y;
			if (y = cn(l), this.horizontal && this.direction === "ltr") {
				if (u = this.horizontal ? y.left : y.top, f = this.horizontal ? y.right : y.bottom, u >= t && u <= r) return l;
				if (f > t) return l;
				o = l, i.push(l);
			} else if (this.horizontal && this.direction === "rtl") {
				if (u = y.left, f = y.right, f <= r && f >= t) return l;
				if (u < r) return l;
				o = l, i.push(l);
			} else {
				if (c = y.top, p = y.bottom, c >= t && c <= r) return l;
				if (p > t) return l;
				o = l, i.push(l);
			}
		}), a) return this.findTextStartRange(a, t, r);
		return this.findTextStartRange(o, t, r);
	}
	findEnd(e, t, r) {
		for (var i = [e], s, a = e, o; i.length;) if (s = i.shift(), o = this.walk(s, (l) => {
			var u, f, c, p, y;
			if (y = cn(l), this.horizontal && this.direction === "ltr") {
				if (u = Math.round(y.left), f = Math.round(y.right), u > r && a) return a;
				if (f > r) return l;
				a = l, i.push(l);
			} else if (this.horizontal && this.direction === "rtl") {
				if (u = Math.round(this.horizontal ? y.left : y.top), f = Math.round(this.horizontal ? y.right : y.bottom), f < t && a) return a;
				if (u < t) return l;
				a = l, i.push(l);
			} else {
				if (c = Math.round(y.top), p = Math.round(y.bottom), c > r && a) return a;
				if (p > r) return l;
				a = l, i.push(l);
			}
		}), o) return this.findTextEndRange(o, t, r);
		return this.findTextEndRange(a, t, r);
	}
	findTextStartRange(e, t, r) {
		for (var i = this.splitTextNodeIntoRanges(e), s, a, o, l, u, f = 0; f < i.length; f++) if (s = i[f], a = s.getBoundingClientRect(), this.horizontal && this.direction === "ltr") {
			if (o = a.left, o >= t) return s;
		} else if (this.horizontal && this.direction === "rtl") {
			if (u = a.right, u <= r) return s;
		} else if (l = a.top, l >= t) return s;
		return i[0];
	}
	findTextEndRange(e, t, r) {
		for (var i = this.splitTextNodeIntoRanges(e), s, a, o, l, u, f, c, p = 0; p < i.length; p++) {
			if (a = i[p], o = a.getBoundingClientRect(), this.horizontal && this.direction === "ltr") {
				if (l = o.left, u = o.right, l > r && s) return s;
				if (u > r) return a;
			} else if (this.horizontal && this.direction === "rtl") {
				if (l = o.left, u = o.right, u < t && s) return s;
				if (l < t) return a;
			} else {
				if (f = o.top, c = o.bottom, f > r && s) return s;
				if (c > r) return a;
			}
			s = a;
		}
		return i[i.length - 1];
	}
	splitTextNodeIntoRanges(e, t) {
		var r = [], s = (e.textContent || "").trim(), a, o = e.ownerDocument, l = t || " ", u = s.indexOf(l);
		if (u === -1 || e.nodeType != Node.TEXT_NODE) return a = o.createRange(), a.selectNodeContents(e), [a];
		for (a = o.createRange(), a.setStart(e, 0), a.setEnd(e, u), r.push(a), a = !1; u != -1;) u = s.indexOf(l, u + 1), u > 0 && (a && (a.setEnd(e, u), r.push(a)), a = o.createRange(), a.setStart(e, u + 1));
		return a && (a.setEnd(e, s.length), r.push(a)), r;
	}
	rangePairToCfiPair(e, t) {
		var r = t.start, i = t.end;
		r.collapse(!0), i.collapse(!1);
		return {
			start: new _e(r, e).toString(),
			end: new _e(i, e).toString()
		};
	}
	rangeListToCfiList(e, t) {
		for (var r = [], i, s = 0; s < t.length; s++) i = this.rangePairToCfiPair(e, t[s]), r.push(i);
		return r;
	}
	axis(e) {
		return e && (this.horizontal = e === "horizontal"), this.horizontal;
	}
};
var ii = Zs;
var Ru = typeof navigator != "undefined";
var zc = Ru && /Chrome/.test(navigator.userAgent);
var Iu = Ru && !zc && /AppleWebKit/.test(navigator.userAgent);
var Uc = 1;
var wn = class {
	constructor(e, t, r, i) {
		this.epubcfi = new _e(), this.document = e, this.documentElement = this.document.documentElement, this.content = t || this.document.body, this.window = this.document.defaultView, this._size = {
			width: 0,
			height: 0
		}, this.sectionIndex = i || 0, this.cfiBase = r || "", this.epubReadingSystem("epub.js", "0.3"), this.called = 0, this.active = !0, this.listeners();
	}
	static get listenedEvents() {
		return ri;
	}
	width(e) {
		var t = this.content;
		return e && qe(e) && (e = e + "px"), e && (t.style.width = e), parseInt(this.window.getComputedStyle(t).width);
	}
	height(e) {
		var t = this.content;
		return e && qe(e) && (e = e + "px"), e && (t.style.height = e), parseInt(this.window.getComputedStyle(t).height);
	}
	contentWidth(e) {
		var t = this.content || this.document.body;
		return e && qe(e) && (e = e + "px"), e && (t.style.width = e), parseInt(this.window.getComputedStyle(t).width);
	}
	contentHeight(e) {
		var t = this.content || this.document.body;
		return e && qe(e) && (e = e + "px"), e && (t.style.height = e), parseInt(this.window.getComputedStyle(t).height);
	}
	textWidth() {
		let e, t, r = this.document.createRange(), i = this.content || this.document.body, s = Xr(i);
		return r.selectNodeContents(i), e = r.getBoundingClientRect(), t = e.width, s && s.width && (t += s.width), Math.round(t);
	}
	textHeight() {
		let e, t, r = this.document.createRange(), i = this.content || this.document.body;
		return r.selectNodeContents(i), e = r.getBoundingClientRect(), t = e.bottom, Math.round(t);
	}
	scrollWidth() {
		return this.documentElement.scrollWidth;
	}
	scrollHeight() {
		return this.documentElement.scrollHeight;
	}
	overflow(e) {
		return e && (this.documentElement.style.overflow = e), this.window.getComputedStyle(this.documentElement).overflow;
	}
	overflowX(e) {
		return e && (this.documentElement.style.overflowX = e), this.window.getComputedStyle(this.documentElement).overflowX;
	}
	overflowY(e) {
		return e && (this.documentElement.style.overflowY = e), this.window.getComputedStyle(this.documentElement).overflowY;
	}
	css(e, t, r) {
		var i = this.content || this.document.body;
		return t ? i.style.setProperty(e, t, r ? "important" : "") : i.style.removeProperty(e), this.window.getComputedStyle(i)[e];
	}
	viewport(e) {
		var l = this.document.querySelector("meta[name='viewport']"), u = {
			width: void 0,
			height: void 0,
			scale: void 0,
			minimum: void 0,
			maximum: void 0,
			scalable: void 0
		}, f = [], c = {};
		if (l && l.hasAttribute("content")) {
			let p = l.getAttribute("content"), y = p.match(/width\s*=\s*([^,]*)/), _ = p.match(/height\s*=\s*([^,]*)/), N = p.match(/initial-scale\s*=\s*([^,]*)/), I = p.match(/minimum-scale\s*=\s*([^,]*)/), d = p.match(/maximum-scale\s*=\s*([^,]*)/), v = p.match(/user-scalable\s*=\s*([^,]*)/);
			y && y.length && typeof y[1] != "undefined" && (u.width = y[1]), _ && _.length && typeof _[1] != "undefined" && (u.height = _[1]), N && N.length && typeof N[1] != "undefined" && (u.scale = N[1]), I && I.length && typeof I[1] != "undefined" && (u.minimum = I[1]), d && d.length && typeof d[1] != "undefined" && (u.maximum = d[1]), v && v.length && typeof v[1] != "undefined" && (u.scalable = v[1]);
		}
		return c = _s(e || {}, u), e && (c.width && f.push("width=" + c.width), c.height && f.push("height=" + c.height), c.scale && f.push("initial-scale=" + c.scale), c.scalable === "no" ? (f.push("minimum-scale=" + c.scale), f.push("maximum-scale=" + c.scale), f.push("user-scalable=" + c.scalable)) : (c.scalable && f.push("user-scalable=" + c.scalable), c.minimum && f.push("minimum-scale=" + c.minimum), c.maximum && f.push("minimum-scale=" + c.maximum)), l || (l = this.document.createElement("meta"), l.setAttribute("name", "viewport"), this.document.querySelector("head").appendChild(l)), l.setAttribute("content", f.join(", ")), this.window.scrollTo(0, 0)), c;
	}
	expand() {
		this.emit(ee.CONTENTS.EXPAND);
	}
	listeners() {
		this.imageLoadListeners(), this.mediaQueryListeners(), this.addEventListeners(), this.addSelectionListeners(), typeof ResizeObserver == "undefined" ? (this.resizeListeners(), this.visibilityListeners()) : this.resizeObservers(), this.linksHandler();
	}
	removeListeners() {
		this.removeEventListeners(), this.removeSelectionListeners(), this.observer && this.observer.disconnect(), clearTimeout(this.expanding);
	}
	resizeCheck() {
		let e = this.textWidth(), t = this.textHeight();
		(e != this._size.width || t != this._size.height) && (this._size = {
			width: e,
			height: t
		}, this.onResize && this.onResize(this._size), this.emit(ee.CONTENTS.RESIZE, this._size));
	}
	resizeListeners() {
		clearTimeout(this.expanding), requestAnimationFrame(this.resizeCheck.bind(this)), this.expanding = setTimeout(this.resizeListeners.bind(this), 350);
	}
	visibilityListeners() {
		document.addEventListener("visibilitychange", () => {
			document.visibilityState === "visible" && this.active === !1 ? (this.active = !0, this.resizeListeners()) : (this.active = !1, clearTimeout(this.expanding));
		});
	}
	transitionListeners() {
		let e = this.content;
		e.style.transitionProperty = "font, font-size, font-size-adjust, font-stretch, font-variation-settings, font-weight, width, height", e.style.transitionDuration = "0.001ms", e.style.transitionTimingFunction = "linear", e.style.transitionDelay = "0", this._resizeCheck = this.resizeCheck.bind(this), this.document.addEventListener("transitionend", this._resizeCheck);
	}
	mediaQueryListeners() {
		for (var e = this.document.styleSheets, t = function(o) {
			o.matches && !this._expanding && setTimeout(this.expand.bind(this), 1);
		}.bind(this), r = 0; r < e.length; r += 1) {
			var i;
			try {
				i = e[r].cssRules;
			} catch {
				return;
			}
			if (!i) return;
			for (var s = 0; s < i.length; s += 1) if (i[s].media) this.window.matchMedia(i[s].media.mediaText).addListener(t);
		}
	}
	resizeObservers() {
		this.observer = new ResizeObserver((e) => {
			requestAnimationFrame(this.resizeCheck.bind(this));
		}), this.observer.observe(this.document.documentElement);
	}
	mutationObservers() {
		this.observer = new MutationObserver((t) => {
			this.resizeCheck();
		});
		this.observer.observe(this.document, {
			attributes: !0,
			childList: !0,
			characterData: !0,
			subtree: !0
		});
	}
	imageLoadListeners() {
		for (var e = this.document.querySelectorAll("img"), t, r = 0; r < e.length; r++) t = e[r], typeof t.naturalWidth != "undefined" && t.naturalWidth === 0 && (t.onload = this.expand.bind(this));
	}
	fontLoadListeners() {
		!this.document || !this.document.fonts || this.document.fonts.ready.then(function() {
			this.resizeCheck();
		}.bind(this));
	}
	root() {
		return this.document ? this.document.documentElement : null;
	}
	locationOf(e, t) {
		var r, i = {
			left: 0,
			top: 0
		};
		if (!this.document) return i;
		if (this.epubcfi.isCfiString(e)) {
			let s = new _e(e).toRange(this.document, t);
			if (s) {
				try {
					if (!s.endContainer || s.startContainer == s.endContainer && s.startOffset == s.endOffset) {
						let a = s.startContainer.textContent.indexOf(" ", s.startOffset);
						a == -1 && (a = s.startContainer.textContent.length), s.setEnd(s.startContainer, a);
					}
				} catch (a) {
					console.error("setting end offset to start container length failed", a);
				}
				if (s.startContainer.nodeType === Node.ELEMENT_NODE) r = s.startContainer.getBoundingClientRect(), i.left = r.left, i.top = r.top;
				else if (Iu) {
					let a = s.startContainer, o = new Range();
					try {
						a.nodeType === Uc ? r = a.getBoundingClientRect() : s.startOffset + 2 < a.length ? (o.setStart(a, s.startOffset), o.setEnd(a, s.startOffset + 2), r = o.getBoundingClientRect()) : s.startOffset - 2 > 0 ? (o.setStart(a, s.startOffset - 2), o.setEnd(a, s.startOffset), r = o.getBoundingClientRect()) : r = a.parentNode.getBoundingClientRect();
					} catch (l) {
						console.error(l, l.stack);
					}
				} else r = s.getBoundingClientRect();
			}
		} else if (typeof e == "string" && e.indexOf("#") > -1) {
			let s = e.substring(e.indexOf("#") + 1), a = this.document.getElementById(s);
			if (a) if (Iu) {
				let o = new Range();
				o.selectNode(a), r = o.getBoundingClientRect();
			} else r = a.getBoundingClientRect();
		}
		return r && (i.left = r.left, i.top = r.top), i;
	}
	addStylesheet(e) {
		return new Promise(function(t, r) {
			var i, s = !1;
			if (!this.document) {
				t(!1);
				return;
			}
			if (i = this.document.querySelector("link[href='" + e + "']"), i) {
				t(!0);
				return;
			}
			i = this.document.createElement("link"), i.type = "text/css", i.rel = "stylesheet", i.href = e, i.onload = i.onreadystatechange = function() {
				!s && (!this.readyState || this.readyState == "complete") && (s = !0, setTimeout(() => {
					t(!0);
				}, 1));
			}, this.document.head.appendChild(i);
		}.bind(this));
	}
	_getStylesheetNode(e) {
		var t;
		return e = "epubjs-inserted-css-" + (e || ""), this.document ? (t = this.document.getElementById(e), t || (t = this.document.createElement("style"), t.id = e, this.document.head.appendChild(t)), t) : !1;
	}
	addStylesheetCss(e, t) {
		if (!this.document || !e) return !1;
		var r;
		return r = this._getStylesheetNode(t), r.innerHTML = e, !0;
	}
	addStylesheetRules(e, t) {
		var r;
		if (!(!this.document || !e || e.length === 0)) if (r = this._getStylesheetNode(t).sheet, Object.prototype.toString.call(e) === "[object Array]") for (var i = 0, s = e.length; i < s; i++) {
			var a = 1, o = e[i], l = e[i][0], u = "";
			Object.prototype.toString.call(o[1][0]) === "[object Array]" && (o = o[1], a = 0);
			for (var f = o.length; a < f; a++) {
				var c = o[a];
				u += c[0] + ":" + c[1] + (c[2] ? " !important" : "") + `;
`;
			}
			r.insertRule(l + "{" + u + "}", r.cssRules.length);
		}
		else Object.keys(e).forEach((y) => {
			let _ = e[y];
			if (Array.isArray(_)) _.forEach((N) => {
				let d = Object.keys(N).map((v) => `${v}:${N[v]}`).join(";");
				r.insertRule(`${y}{${d}}`, r.cssRules.length);
			});
			else {
				let I = Object.keys(_).map((d) => `${d}:${_[d]}`).join(";");
				r.insertRule(`${y}{${I}}`, r.cssRules.length);
			}
		});
	}
	addScript(e) {
		return new Promise(function(t, r) {
			var i, s = !1;
			if (!this.document) {
				t(!1);
				return;
			}
			i = this.document.createElement("script"), i.type = "text/javascript", i.async = !0, i.src = e, i.onload = i.onreadystatechange = function() {
				!s && (!this.readyState || this.readyState == "complete") && (s = !0, setTimeout(function() {
					t(!0);
				}, 1));
			}, this.document.head.appendChild(i);
		}.bind(this));
	}
	addClass(e) {
		var t;
		this.document && (t = this.content || this.document.body, t && t.classList.add(e));
	}
	removeClass(e) {
		var t;
		this.document && (t = this.content || this.document.body, t && t.classList.remove(e));
	}
	addEventListeners() {
		this.document && (this._triggerEvent = this.triggerEvent.bind(this), ri.forEach(function(e) {
			this.document.addEventListener(e, this._triggerEvent, { passive: !0 });
		}, this));
	}
	removeEventListeners() {
		this.document && (ri.forEach(function(e) {
			this.document.removeEventListener(e, this._triggerEvent, { passive: !0 });
		}, this), this._triggerEvent = void 0);
	}
	triggerEvent(e) {
		this.emit(e.type, e);
	}
	addSelectionListeners() {
		this.document && (this._onSelectionChange = this.onSelectionChange.bind(this), this.document.addEventListener("selectionchange", this._onSelectionChange, { passive: !0 }));
	}
	removeSelectionListeners() {
		this.document && (this.document.removeEventListener("selectionchange", this._onSelectionChange, { passive: !0 }), this._onSelectionChange = void 0);
	}
	onSelectionChange(e) {
		this.selectionEndTimeout && clearTimeout(this.selectionEndTimeout), this.selectionEndTimeout = setTimeout(function() {
			var t = this.window.getSelection();
			this.triggerSelectedEvent(t);
		}.bind(this), 250);
	}
	triggerSelectedEvent(e) {
		var t, r;
		e && e.rangeCount > 0 && (t = e.getRangeAt(0), t.collapsed || (r = new _e(t, this.cfiBase).toString(), this.emit(ee.CONTENTS.SELECTED, r), this.emit(ee.CONTENTS.SELECTED_RANGE, t)));
	}
	range(e, t) {
		return new _e(e).toRange(this.document, t);
	}
	cfiFromRange(e, t) {
		return new _e(e, this.cfiBase, t).toString();
	}
	cfiFromNode(e, t) {
		return new _e(e, this.cfiBase, t).toString();
	}
	map(e) {
		return new ii(e).section();
	}
	size(e, t) {
		var r = {
			scale: 1,
			scalable: "no"
		};
		this.layoutStyle("scrolling"), e >= 0 && (this.width(e), r.width = e, this.css("padding", "0 " + e / 12 + "px")), t >= 0 && (this.height(t), r.height = t), this.css("margin", "0"), this.css("box-sizing", "border-box"), this.viewport(r);
	}
	columns(e, t, r, i, s) {
		let a = _r("column-axis"), o = _r("column-gap"), l = _r("column-width"), u = _r("column-fill"), c = this.writingMode().indexOf("vertical") === 0 ? "vertical" : "horizontal";
		this.layoutStyle("paginated"), s === "rtl" && c === "horizontal" && this.direction(s), this.width(e), this.height(t), this.viewport({
			width: e,
			height: t,
			scale: 1,
			scalable: "no"
		}), this.css("overflow-y", "hidden"), this.css("margin", "0", !0), c === "vertical" ? (this.css("padding-top", i / 2 + "px", !0), this.css("padding-bottom", i / 2 + "px", !0), this.css("padding-left", "20px"), this.css("padding-right", "20px"), this.css(a, "vertical")) : (this.css("padding-top", "20px"), this.css("padding-bottom", "20px"), this.css("padding-left", i / 2 + "px", !0), this.css("padding-right", i / 2 + "px", !0), this.css(a, "horizontal")), this.css("box-sizing", "border-box"), this.css("max-width", "inherit"), this.css(u, "auto"), this.css(o, i + "px"), this.css(l, r + "px"), this.css("-webkit-line-box-contain", "block glyphs replaced");
	}
	scaler(e, t, r) {
		var i = "scale(" + e + ")", s = "";
		this.css("transform-origin", "top left"), (t >= 0 || r >= 0) && (s = " translate(" + (t || 0) + "px, " + (r || 0) + "px )"), this.css("transform", i + s);
	}
	fit(e, t, r) {
		var i = this.viewport(), s = parseInt(i.width), a = parseInt(i.height), o = e / s, l = t / a, u = o < l ? o : l;
		if (this.layoutStyle("paginated"), this.width(s), this.height(a), this.overflow("hidden"), this.scaler(u, 0, 0), this.css("background-size", s * u + "px " + a * u + "px"), this.css("background-color", "transparent"), r && r.properties.includes("page-spread-left")) {
			var f = e - s * u;
			this.css("margin-left", f + "px");
		}
	}
	direction(e) {
		this.documentElement && (this.documentElement.style.direction = e);
	}
	mapPage(e, t, r, i, s) {
		return new ii(t, s).page(this, e, r, i);
	}
	linksHandler() {
		Eu(this.content, (e) => {
			this.emit(ee.CONTENTS.LINK_CLICKED, e);
		});
	}
	writingMode(e) {
		let t = _r("writing-mode");
		return e && this.documentElement && (this.documentElement.style[t] = e), this.window.getComputedStyle(this.documentElement)[t] || "";
	}
	layoutStyle(e) {
		return e && (this._layoutStyle = e, navigator.epubReadingSystem.layoutStyle = this._layoutStyle), this._layoutStyle || "paginated";
	}
	epubReadingSystem(e, t) {
		return navigator.epubReadingSystem = {
			name: e,
			version: t,
			layoutStyle: this.layoutStyle(),
			hasFeature: function(r) {
				switch (r) {
					case "dom-manipulation": return !0;
					case "layout-changes": return !0;
					case "touch-events": return !0;
					case "mouse-events": return !0;
					case "keyboard-events": return !0;
					case "spine-scripting": return !1;
					default: return !1;
				}
			}
		}, navigator.epubReadingSystem;
	}
	destroy() {
		this.removeListeners();
	}
};
(0, Ou.default)(wn.prototype);
var Li = wn;
var ku = rt(Yt());
var Xs = class {
	constructor(e) {
		this.rendition = e, this.highlights = [], this.underlines = [], this.marks = [], this._annotations = {}, this._annotationsBySectionIndex = {}, this.rendition.hooks.render.register(this.inject.bind(this)), this.rendition.hooks.unloaded.register(this.clear.bind(this));
	}
	add(e, t, r, i, s, a) {
		let o = encodeURI(t + e), u = new _e(t).spinePos, f = new _n({
			type: e,
			cfiRange: t,
			data: r,
			sectionIndex: u,
			cb: i,
			className: s,
			styles: a
		});
		return this._annotations[o] = f, u in this._annotationsBySectionIndex ? this._annotationsBySectionIndex[u].push(o) : this._annotationsBySectionIndex[u] = [o], this.rendition.views().forEach((p) => {
			f.sectionIndex === p.index && f.attach(p);
		}), f;
	}
	remove(e, t) {
		let r = encodeURI(e + t);
		if (r in this._annotations) {
			let i = this._annotations[r];
			if (t && i.type !== t) return;
			this.rendition.views().forEach((a) => {
				this._removeFromAnnotationBySectionIndex(i.sectionIndex, r), i.sectionIndex === a.index && i.detach(a);
			}), delete this._annotations[r];
		}
	}
	_removeFromAnnotationBySectionIndex(e, t) {
		this._annotationsBySectionIndex[e] = this._annotationsAt(e).filter((r) => r !== t);
	}
	_annotationsAt(e) {
		return this._annotationsBySectionIndex[e];
	}
	highlight(e, t, r, i, s) {
		return this.add("highlight", e, t, r, i, s);
	}
	underline(e, t, r, i, s) {
		return this.add("underline", e, t, r, i, s);
	}
	mark(e, t, r) {
		return this.add("mark", e, t, r);
	}
	each() {
		return this._annotations.forEach.apply(this._annotations, arguments);
	}
	inject(e) {
		let t = e.index;
		t in this._annotationsBySectionIndex && this._annotationsBySectionIndex[t].forEach((i) => {
			this._annotations[i].attach(e);
		});
	}
	clear(e) {
		let t = e.index;
		t in this._annotationsBySectionIndex && this._annotationsBySectionIndex[t].forEach((i) => {
			this._annotations[i].detach(e);
		});
	}
	show() {}
	hide() {}
};
var _n = class {
	constructor({ type: e, cfiRange: t, data: r, sectionIndex: i, cb: s, className: a, styles: o }) {
		this.type = e, this.cfiRange = t, this.data = r, this.sectionIndex = i, this.mark = void 0, this.cb = s, this.className = a, this.styles = o;
	}
	update(e) {
		this.data = e;
	}
	attach(e) {
		let { cfiRange: t, data: r, type: i, mark: s, cb: a, className: o, styles: l } = this, u;
		return i === "highlight" ? u = e.highlight(t, r, a, o, l) : i === "underline" ? u = e.underline(t, r, a, o, l) : i === "mark" && (u = e.mark(t, r, a)), this.mark = u, this.emit(ee.ANNOTATION.ATTACH, u), u;
	}
	detach(e) {
		let { cfiRange: t, type: r } = this, i;
		return e && (r === "highlight" ? i = e.unhighlight(t) : r === "underline" ? i = e.ununderline(t) : r === "mark" && (i = e.unmark(t))), this.mark = void 0, this.emit(ee.ANNOTATION.DETACH, i), i;
	}
	text() {}
};
(0, ku.default)(_n.prototype);
var Lu = Xs;
var Hu = rt(Yt());
var Ar = rt(ju());
var Cn = class {
	constructor(e, t) {
		this.settings = je({
			ignoreClass: "",
			axis: void 0,
			direction: void 0,
			width: 0,
			height: 0,
			layout: void 0,
			globalLayoutProperties: {},
			method: void 0,
			forceRight: !1,
			allowScriptedContent: !1,
			allowPopups: !1
		}, t || {}), this.id = "epubjs-view-" + Zr(), this.section = e, this.index = e.index, this.element = this.container(this.settings.axis), this.added = !1, this.displayed = !1, this.rendered = !1, this.fixedWidth = 0, this.fixedHeight = 0, this.epubcfi = new _e(), this.layout = this.settings.layout, this.pane = void 0, this.highlights = {}, this.underlines = {}, this.marks = {};
	}
	container(e) {
		var t = document.createElement("div");
		return t.classList.add("epub-view"), t.style.height = "0px", t.style.width = "0px", t.style.overflow = "hidden", t.style.position = "relative", t.style.display = "block", e && e == "horizontal" ? t.style.flex = "none" : t.style.flex = "initial", t;
	}
	create() {
		return this.iframe ? this.iframe : (this.element || (this.element = this.createContainer()), this.iframe = document.createElement("iframe"), this.iframe.id = this.id, this.iframe.scrolling = "no", this.iframe.style.overflow = "hidden", this.iframe.seamless = "seamless", this.iframe.style.border = "none", this.iframe.sandbox = "allow-same-origin", this.settings.allowScriptedContent && (this.iframe.sandbox += " allow-scripts"), this.settings.allowPopups && (this.iframe.sandbox += " allow-popups"), this.iframe.setAttribute("enable-annotation", "true"), this.resizing = !0, this.element.style.visibility = "hidden", this.iframe.style.visibility = "hidden", this.iframe.style.width = "0", this.iframe.style.height = "0", this._width = 0, this._height = 0, this.element.setAttribute("ref", this.index), this.added = !0, this.elementBounds = Ii(this.element), "srcdoc" in this.iframe ? this.supportsSrcdoc = !0 : this.supportsSrcdoc = !1, this.settings.method || (this.settings.method = this.supportsSrcdoc ? "srcdoc" : "write"), this.iframe);
	}
	render(e, t) {
		return this.create(), this.size(), this.sectionRender || (this.sectionRender = this.section.render(e)), this.sectionRender.then(function(r) {
			return this.load(r);
		}.bind(this)).then(function() {
			let r = this.contents.writingMode(), i;
			return this.settings.flow === "scrolled" ? i = r.indexOf("vertical") === 0 ? "horizontal" : "vertical" : i = r.indexOf("vertical") === 0 ? "vertical" : "horizontal", r.indexOf("vertical") === 0 && this.settings.flow === "paginated" && (this.layout.delta = this.layout.height), this.setAxis(i), this.emit(ee.VIEWS.AXIS, i), this.setWritingMode(r), this.emit(ee.VIEWS.WRITING_MODE, r), this.layout.format(this.contents, this.section, this.axis), this.addListeners(), new Promise((s, a) => {
				this.expand(), this.settings.forceRight && (this.element.style.marginLeft = this.width() + "px"), s();
			});
		}.bind(this), function(r) {
			return this.emit(ee.VIEWS.LOAD_ERROR, r), new Promise((i, s) => {
				s(r);
			});
		}.bind(this)).then(function() {
			this.emit(ee.VIEWS.RENDERED, this.section);
		}.bind(this));
	}
	reset() {
		this.iframe && (this.iframe.style.width = "0", this.iframe.style.height = "0", this._width = 0, this._height = 0, this._textWidth = void 0, this._contentWidth = void 0, this._textHeight = void 0, this._contentHeight = void 0), this._needsReframe = !0;
	}
	size(e, t) {
		var r = e || this.settings.width, i = t || this.settings.height;
		this.layout.name === "pre-paginated" ? this.lock("both", r, i) : this.settings.axis === "horizontal" ? this.lock("height", r, i) : this.lock("width", r, i), this.settings.width = r, this.settings.height = i;
	}
	lock(e, t, r) {
		var i = Xr(this.element), s;
		this.iframe ? s = Xr(this.iframe) : s = {
			width: 0,
			height: 0
		}, e == "width" && qe(t) && (this.lockedWidth = t - i.width - s.width), e == "height" && qe(r) && (this.lockedHeight = r - i.height - s.height), e === "both" && qe(t) && qe(r) && (this.lockedWidth = t - i.width - s.width, this.lockedHeight = r - i.height - s.height), this.displayed && this.iframe && this.expand();
	}
	expand(e) {
		var t = this.lockedWidth, r = this.lockedHeight, i;
		!this.iframe || this._expanding || (this._expanding = !0, this.layout.name === "pre-paginated" ? (t = this.layout.columnWidth, r = this.layout.height) : this.settings.axis === "horizontal" ? (t = this.contents.textWidth(), t % this.layout.pageWidth > 0 && (t = Math.ceil(t / this.layout.pageWidth) * this.layout.pageWidth), this.settings.forceEvenPages && (i = t / this.layout.pageWidth, this.layout.divisor > 1 && this.layout.name === "reflowable" && i % 2 > 0 && (t += this.layout.pageWidth))) : this.settings.axis === "vertical" && (r = this.contents.textHeight(), this.settings.flow === "paginated" && r % this.layout.height > 0 && (r = Math.ceil(r / this.layout.height) * this.layout.height)), (this._needsReframe || t != this._width || r != this._height) && this.reframe(t, r), this._expanding = !1);
	}
	reframe(e, t) {
		var r;
		qe(e) && (this.element.style.width = e + "px", this.iframe.style.width = e + "px", this._width = e), qe(t) && (this.element.style.height = t + "px", this.iframe.style.height = t + "px", this._height = t);
		r = {
			width: e,
			height: t,
			widthDelta: this.prevBounds ? e - this.prevBounds.width : e,
			heightDelta: this.prevBounds ? t - this.prevBounds.height : t
		}, this.pane && this.pane.render(), requestAnimationFrame(() => {
			let a;
			for (let o in this.marks) this.marks.hasOwnProperty(o) && (a = this.marks[o], this.placeMark(a.element, a.range));
		}), this.onResize(this, r), this.emit(ee.VIEWS.RESIZED, r), this.prevBounds = r, this.elementBounds = Ii(this.element);
	}
	load(e) {
		var t = new ge(), r = t.promise;
		if (!this.iframe) return t.reject(/* @__PURE__ */ new Error("No Iframe Available")), r;
		if (this.iframe.onload = function(s) {
			this.onLoad(s, t);
		}.bind(this), this.settings.method === "blobUrl") this.blobUrl = $r(e, "application/xhtml+xml"), this.iframe.src = this.blobUrl, this.element.appendChild(this.iframe);
		else if (this.settings.method === "srcdoc") this.iframe.srcdoc = e, this.element.appendChild(this.iframe);
		else {
			if (this.element.appendChild(this.iframe), this.document = this.iframe.contentDocument, !this.document) return t.reject(/* @__PURE__ */ new Error("No Document Available")), r;
			if (this.iframe.contentDocument.open(), window.MSApp && MSApp.execUnsafeLocalFunction) {
				var i = this;
				MSApp.execUnsafeLocalFunction(function() {
					i.iframe.contentDocument.write(e);
				});
			} else this.iframe.contentDocument.write(e);
			this.iframe.contentDocument.close();
		}
		return r;
	}
	onLoad(e, t) {
		this.window = this.iframe.contentWindow, this.document = this.iframe.contentDocument, this.contents = new Li(this.document, this.document.body, this.section.cfiBase, this.section.index), this.rendering = !1;
		var r = this.document.querySelector("link[rel='canonical']");
		r ? r.setAttribute("href", this.section.canonical) : (r = this.document.createElement("link"), r.setAttribute("rel", "canonical"), r.setAttribute("href", this.section.canonical), this.document.querySelector("head").appendChild(r)), this.contents.on(ee.CONTENTS.EXPAND, () => {
			this.displayed && this.iframe && (this.expand(), this.contents && this.layout.format(this.contents));
		}), this.contents.on(ee.CONTENTS.RESIZE, (i) => {
			this.displayed && this.iframe && (this.expand(), this.contents && this.layout.format(this.contents));
		}), t.resolve(this.contents);
	}
	setLayout(e) {
		this.layout = e, this.contents && (this.layout.format(this.contents), this.expand());
	}
	setAxis(e) {
		this.settings.axis = e, e == "horizontal" ? this.element.style.flex = "none" : this.element.style.flex = "initial", this.size();
	}
	setWritingMode(e) {
		this.writingMode = e;
	}
	addListeners() {}
	removeListeners(e) {}
	display(e) {
		var t = new ge();
		return this.displayed ? t.resolve(this) : this.render(e).then(function() {
			this.emit(ee.VIEWS.DISPLAYED, this), this.onDisplayed(this), this.displayed = !0, t.resolve(this);
		}.bind(this), function(r) {
			t.reject(r, this);
		}), t.promise;
	}
	show() {
		this.element.style.visibility = "visible", this.iframe && (this.iframe.style.visibility = "visible", this.iframe.style.transform = "translateZ(0)", this.iframe.offsetWidth, this.iframe.style.transform = null), this.emit(ee.VIEWS.SHOWN, this);
	}
	hide() {
		this.element.style.visibility = "hidden", this.iframe.style.visibility = "hidden", this.stopExpanding = !0, this.emit(ee.VIEWS.HIDDEN, this);
	}
	offset() {
		return {
			top: this.element.offsetTop,
			left: this.element.offsetLeft
		};
	}
	width() {
		return this._width;
	}
	height() {
		return this._height;
	}
	position() {
		return this.element.getBoundingClientRect();
	}
	locationOf(e) {
		this.iframe.getBoundingClientRect();
		var r = this.contents.locationOf(e, this.settings.ignoreClass);
		return {
			left: r.left,
			top: r.top
		};
	}
	onDisplayed(e) {}
	onResize(e, t) {}
	bounds(e) {
		return (e || !this.elementBounds) && (this.elementBounds = Ii(this.element)), this.elementBounds;
	}
	highlight(e, t = {}, r, i = "epubjs-hl", s = {}) {
		if (!this.contents) return;
		let a = Object.assign({
			fill: "yellow",
			"fill-opacity": "0.3",
			"mix-blend-mode": "multiply"
		}, s), o = this.contents.range(e), l = () => {
			this.emit(ee.VIEWS.MARK_CLICKED, e, t);
		};
		t.epubcfi = e, this.pane || (this.pane = new Ar.Pane(this.iframe, this.element));
		let u = new Ar.Highlight(o, i, t, a), f = this.pane.addMark(u);
		return this.highlights[e] = {
			mark: f,
			element: f.element,
			listeners: [l, r]
		}, f.element.setAttribute("ref", i), f.element.addEventListener("click", l), f.element.addEventListener("touchstart", l), r && (f.element.addEventListener("click", r), f.element.addEventListener("touchstart", r)), f;
	}
	underline(e, t = {}, r, i = "epubjs-ul", s = {}) {
		if (!this.contents) return;
		let a = Object.assign({
			stroke: "black",
			"stroke-opacity": "0.3",
			"mix-blend-mode": "multiply"
		}, s), o = this.contents.range(e), l = () => {
			this.emit(ee.VIEWS.MARK_CLICKED, e, t);
		};
		t.epubcfi = e, this.pane || (this.pane = new Ar.Pane(this.iframe, this.element));
		let u = new Ar.Underline(o, i, t, a), f = this.pane.addMark(u);
		return this.underlines[e] = {
			mark: f,
			element: f.element,
			listeners: [l, r]
		}, f.element.setAttribute("ref", i), f.element.addEventListener("click", l), f.element.addEventListener("touchstart", l), r && (f.element.addEventListener("click", r), f.element.addEventListener("touchstart", r)), f;
	}
	mark(e, t = {}, r) {
		if (!this.contents) return;
		if (e in this.marks) return this.marks[e];
		let i = this.contents.range(e);
		if (!i) return;
		let s = i.commonAncestorContainer, a = s.nodeType === 1 ? s : s.parentNode, o = (u) => {
			this.emit(ee.VIEWS.MARK_CLICKED, e, t);
		};
		i.collapsed && s.nodeType === 1 ? (i = new Range(), i.selectNodeContents(s)) : i.collapsed && (i = new Range(), i.selectNodeContents(a));
		let l = this.document.createElement("a");
		return l.setAttribute("ref", "epubjs-mk"), l.style.position = "absolute", l.dataset.epubcfi = e, t && Object.keys(t).forEach((u) => {
			l.dataset[u] = t[u];
		}), r && (l.addEventListener("click", r), l.addEventListener("touchstart", r)), l.addEventListener("click", o), l.addEventListener("touchstart", o), this.placeMark(l, i), this.element.appendChild(l), this.marks[e] = {
			element: l,
			range: i,
			listeners: [o, r]
		}, a;
	}
	placeMark(e, t) {
		let r, i, s;
		if (this.layout.name === "pre-paginated" || this.settings.axis !== "horizontal") {
			let o = t.getBoundingClientRect();
			r = o.top, i = o.right;
		} else {
			let o = t.getClientRects(), l;
			for (var a = 0; a != o.length; a++) l = o[a], (!s || l.left < s) && (s = l.left, i = Math.ceil(s / this.layout.props.pageWidth) * this.layout.props.pageWidth - this.layout.gap / 2, r = l.top);
		}
		e.style.top = `${r}px`, e.style.left = `${i}px`;
	}
	unhighlight(e) {
		let t;
		e in this.highlights && (t = this.highlights[e], this.pane.removeMark(t.mark), t.listeners.forEach((r) => {
			r && (t.element.removeEventListener("click", r), t.element.removeEventListener("touchstart", r));
		}), delete this.highlights[e]);
	}
	ununderline(e) {
		let t;
		e in this.underlines && (t = this.underlines[e], this.pane.removeMark(t.mark), t.listeners.forEach((r) => {
			r && (t.element.removeEventListener("click", r), t.element.removeEventListener("touchstart", r));
		}), delete this.underlines[e]);
	}
	unmark(e) {
		let t;
		e in this.marks && (t = this.marks[e], this.element.removeChild(t.element), t.listeners.forEach((r) => {
			r && (t.element.removeEventListener("click", r), t.element.removeEventListener("touchstart", r));
		}), delete this.marks[e]);
	}
	destroy() {
		for (let e in this.highlights) this.unhighlight(e);
		for (let e in this.underlines) this.ununderline(e);
		for (let e in this.marks) this.unmark(e);
		this.blobUrl && As(this.blobUrl), this.displayed && (this.displayed = !1, this.removeListeners(), this.contents.destroy(), this.stopExpanding = !0, this.element.removeChild(this.iframe), this.pane && (this.pane.element.remove(), this.pane = void 0), this.iframe = void 0, this.contents = void 0, this._textWidth = null, this._textHeight = null, this._width = null, this._height = null);
	}
};
(0, Hu.default)(Cn.prototype);
var Vu = Cn;
var Sl = rt(Yt());
function Ks() {
	var n = "reverse", e = $c();
	return document.body.appendChild(e), e.scrollLeft > 0 ? n = "default" : typeof Element != "undefined" && Element.prototype.scrollIntoView ? (e.children[0].children[1].scrollIntoView(), e.scrollLeft < 0 && (n = "negative")) : (e.scrollLeft = 1, e.scrollLeft === 0 && (n = "negative")), document.body.removeChild(e), n;
}
function $c() {
	var n = document.createElement("div");
	n.dir = "rtl", n.style.position = "fixed", n.style.width = "1px", n.style.height = "1px", n.style.top = "0px", n.style.left = "0px", n.style.overflow = "hidden";
	var e = document.createElement("div");
	e.style.width = "2px";
	var t = document.createElement("span");
	t.style.width = "1px", t.style.display = "inline-block";
	var r = document.createElement("span");
	return r.style.width = "1px", r.style.display = "inline-block", e.appendChild(t), e.appendChild(r), n.appendChild(e), n;
}
var Al = rt(Dl());
var ta = class {
	constructor(e) {
		this.settings = e || {}, this.id = "epubjs-container-" + Zr(), this.container = this.create(this.settings), this.settings.hidden && (this.wrapper = this.wrap(this.container));
	}
	create(e) {
		let t = e.height, r = e.width, i = e.overflow || !1, s = e.axis || "vertical", a = e.direction;
		je(this.settings, e), e.height && qe(e.height) && (t = e.height + "px"), e.width && qe(e.width) && (r = e.width + "px");
		let o = document.createElement("div");
		return o.id = this.id, o.classList.add("epub-container"), o.style.wordSpacing = "0", o.style.lineHeight = "0", o.style.verticalAlign = "top", o.style.position = "relative", s === "horizontal" && (o.style.display = "flex", o.style.flexDirection = "row", o.style.flexWrap = "nowrap"), r && (o.style.width = r), t && (o.style.height = t), i && (i === "scroll" && s === "vertical" ? (o.style["overflow-y"] = i, o.style["overflow-x"] = "hidden") : i === "scroll" && s === "horizontal" ? (o.style["overflow-y"] = "hidden", o.style["overflow-x"] = i) : o.style.overflow = i), a && (o.dir = a, o.style.direction = a), a && this.settings.fullsize && (document.body.style.direction = a), o;
	}
	wrap(e) {
		var t = document.createElement("div");
		return t.style.visibility = "hidden", t.style.overflow = "hidden", t.style.width = "0", t.style.height = "0", t.appendChild(e), t;
	}
	getElement(e) {
		var t;
		if (bs(e) ? t = e : typeof e == "string" && (t = document.getElementById(e)), !t) throw new Error("Not an Element");
		return t;
	}
	attachTo(e) {
		var t = this.getElement(e), r;
		if (t) return this.settings.hidden ? r = this.wrapper : r = this.container, t.appendChild(r), this.element = t, t;
	}
	getContainer() {
		return this.container;
	}
	onResize(e) {
		(!qe(this.settings.width) || !qe(this.settings.height)) && (this.resizeFunc = (0, Al.default)(e, 50), window.addEventListener("resize", this.resizeFunc, !1));
	}
	onOrientationChange(e) {
		this.orientationChangeFunc = e, window.addEventListener("orientationchange", this.orientationChangeFunc, !1);
	}
	size(e, t) {
		var r;
		let i = e || this.settings.width, s = t || this.settings.height;
		e === null ? (r = this.element.getBoundingClientRect(), r.width && (e = Math.floor(r.width), this.container.style.width = e + "px")) : qe(e) ? this.container.style.width = e + "px" : this.container.style.width = e, t === null ? (r = r || this.element.getBoundingClientRect(), r.height && (t = r.height, this.container.style.height = t + "px")) : qe(t) ? this.container.style.height = t + "px" : this.container.style.height = t, qe(e) || (e = this.container.clientWidth), qe(t) || (t = this.container.clientHeight), this.containerStyles = window.getComputedStyle(this.container), this.containerPadding = {
			left: parseFloat(this.containerStyles["padding-left"]) || 0,
			right: parseFloat(this.containerStyles["padding-right"]) || 0,
			top: parseFloat(this.containerStyles["padding-top"]) || 0,
			bottom: parseFloat(this.containerStyles["padding-bottom"]) || 0
		};
		let a = Kr(), o = window.getComputedStyle(document.body), l = {
			left: parseFloat(o["padding-left"]) || 0,
			right: parseFloat(o["padding-right"]) || 0,
			top: parseFloat(o["padding-top"]) || 0,
			bottom: parseFloat(o["padding-bottom"]) || 0
		};
		return i || (e = a.width - l.left - l.right), (this.settings.fullsize && !s || !s) && (t = a.height - l.top - l.bottom), {
			width: e - this.containerPadding.left - this.containerPadding.right,
			height: t - this.containerPadding.top - this.containerPadding.bottom
		};
	}
	bounds() {
		let e;
		return this.container.style.overflow !== "visible" && (e = this.container && this.container.getBoundingClientRect()), !e || !e.width || !e.height ? Kr() : e;
	}
	getSheet() {
		var e = document.createElement("style");
		return e.appendChild(document.createTextNode("")), document.head.appendChild(e), e.sheet;
	}
	addStyleRules(e, t) {
		var r = "#" + this.id + " ", i = "";
		this.sheet || (this.sheet = this.getSheet()), t.forEach(function(s) {
			for (var a in s) s.hasOwnProperty(a) && (i += a + ":" + s[a] + ";");
		}), this.sheet.insertRule(r + e + " {" + i + "}", 0);
	}
	axis(e) {
		e === "horizontal" ? (this.container.style.display = "flex", this.container.style.flexDirection = "row", this.container.style.flexWrap = "nowrap") : this.container.style.display = "block", this.settings.axis = e;
	}
	direction(e) {
		this.container && (this.container.dir = e, this.container.style.direction = e), this.settings.fullsize && (document.body.style.direction = e), this.settings.dir = e;
	}
	overflow(e) {
		this.container && (e === "scroll" && this.settings.axis === "vertical" ? (this.container.style["overflow-y"] = e, this.container.style["overflow-x"] = "hidden") : e === "scroll" && this.settings.axis === "horizontal" ? (this.container.style["overflow-y"] = "hidden", this.container.style["overflow-x"] = e) : this.container.style.overflow = e), this.settings.overflow = e;
	}
	destroy() {
		this.element && (this.settings.hidden ? this.wrapper : this.container, this.element.contains(this.container) && this.element.removeChild(this.container), window.removeEventListener("resize", this.resizeFunc), window.removeEventListener("orientationChange", this.orientationChangeFunc));
	}
};
var Cl = ta;
var ra = class {
	constructor(e) {
		this.container = e, this._views = [], this.length = 0, this.hidden = !1;
	}
	all() {
		return this._views;
	}
	first() {
		return this._views[0];
	}
	last() {
		return this._views[this._views.length - 1];
	}
	indexOf(e) {
		return this._views.indexOf(e);
	}
	slice() {
		return this._views.slice.apply(this._views, arguments);
	}
	get(e) {
		return this._views[e];
	}
	append(e) {
		return this._views.push(e), this.container && this.container.appendChild(e.element), this.length++, e;
	}
	prepend(e) {
		return this._views.unshift(e), this.container && this.container.insertBefore(e.element, this.container.firstChild), this.length++, e;
	}
	insert(e, t) {
		return this._views.splice(t, 0, e), this.container && (t < this.container.children.length ? this.container.insertBefore(e.element, this.container.children[t]) : this.container.appendChild(e.element)), this.length++, e;
	}
	remove(e) {
		var t = this._views.indexOf(e);
		t > -1 && this._views.splice(t, 1), this.destroy(e), this.length--;
	}
	destroy(e) {
		e.displayed && e.destroy(), this.container && this.container.removeChild(e.element), e = null;
	}
	forEach() {
		return this._views.forEach.apply(this._views, arguments);
	}
	clear() {
		var e, t = this.length;
		if (this.length) {
			for (var r = 0; r < t; r++) e = this._views[r], this.destroy(e);
			this._views = [], this.length = 0;
		}
	}
	find(e) {
		for (var t, r = this.length, i = 0; i < r; i++) if (t = this._views[i], t.displayed && t.section.index == e.index) return t;
	}
	displayed() {
		for (var e = [], t, r = this.length, i = 0; i < r; i++) t = this._views[i], t.displayed && e.push(t);
		return e;
	}
	show() {
		for (var e, t = this.length, r = 0; r < t; r++) e = this._views[r], e.displayed && e.show();
		this.hidden = !1;
	}
	hide() {
		for (var e, t = this.length, r = 0; r < t; r++) e = this._views[r], e.displayed && e.hide();
		this.hidden = !0;
	}
};
var Tl = ra;
var Sn = class {
	constructor(e) {
		this.name = "default", this.optsSettings = e.settings, this.View = e.view, this.request = e.request, this.renditionQueue = e.queue, this.q = new ti(this), this.settings = je(this.settings || {}, {
			infinite: !0,
			hidden: !1,
			width: void 0,
			height: void 0,
			axis: void 0,
			writingMode: void 0,
			flow: "scrolled",
			ignoreClass: "",
			fullsize: void 0,
			allowScriptedContent: !1,
			allowPopups: !1
		}), je(this.settings, e.settings || {}), this.viewSettings = {
			ignoreClass: this.settings.ignoreClass,
			axis: this.settings.axis,
			flow: this.settings.flow,
			layout: this.layout,
			method: this.settings.method,
			width: 0,
			height: 0,
			forceEvenPages: !0,
			allowScriptedContent: this.settings.allowScriptedContent,
			allowPopups: this.settings.allowPopups
		}, this.rendered = !1;
	}
	render(e, t) {
		let r = e.tagName;
		typeof this.settings.fullsize == "undefined" && r && (r.toLowerCase() == "body" || r.toLowerCase() == "html") && (this.settings.fullsize = !0), this.settings.fullsize && (this.settings.overflow = "visible", this.overflow = this.settings.overflow), this.settings.size = t, this.settings.rtlScrollType = Ks(), this.stage = new Cl({
			width: t.width,
			height: t.height,
			overflow: this.overflow,
			hidden: this.settings.hidden,
			axis: this.settings.axis,
			fullsize: this.settings.fullsize,
			direction: this.settings.direction
		}), this.stage.attachTo(e), this.container = this.stage.getContainer(), this.views = new Tl(this.container), this._bounds = this.bounds(), this._stageSize = this.stage.size(), this.viewSettings.width = this._stageSize.width, this.viewSettings.height = this._stageSize.height, this.stage.onResize(this.onResized.bind(this)), this.stage.onOrientationChange(this.onOrientationChange.bind(this)), this.addEventListeners(), this.layout && this.updateLayout(), this.rendered = !0;
	}
	addEventListeners() {
		var e;
		window.addEventListener("unload", function(t) {
			this.destroy();
		}.bind(this)), this.settings.fullsize ? e = window : e = this.container, this._onScroll = this.onScroll.bind(this), e.addEventListener("scroll", this._onScroll);
	}
	removeEventListeners() {
		var e;
		this.settings.fullsize ? e = window : e = this.container, e.removeEventListener("scroll", this._onScroll), this._onScroll = void 0;
	}
	destroy() {
		clearTimeout(this.orientationTimeout), clearTimeout(this.resizeTimeout), clearTimeout(this.afterScrolled), this.clear(), this.removeEventListeners(), this.stage.destroy(), this.rendered = !1;
	}
	onOrientationChange(e) {
		let { orientation: t } = window;
		this.optsSettings.resizeOnOrientationChange && this.resize(), clearTimeout(this.orientationTimeout), this.orientationTimeout = setTimeout(function() {
			this.orientationTimeout = void 0, this.optsSettings.resizeOnOrientationChange && this.resize(), this.emit(ee.MANAGERS.ORIENTATION_CHANGE, t);
		}.bind(this), 500);
	}
	onResized(e) {
		this.resize();
	}
	resize(e, t, r) {
		let i = this.stage.size(e, t);
		if (this.winBounds = Kr(), this.orientationTimeout && this.winBounds.width === this.winBounds.height) {
			this._stageSize = void 0;
			return;
		}
		this._stageSize && this._stageSize.width === i.width && this._stageSize.height === i.height || (this._stageSize = i, this._bounds = this.bounds(), this.clear(), this.viewSettings.width = this._stageSize.width, this.viewSettings.height = this._stageSize.height, this.updateLayout(), this.emit(ee.MANAGERS.RESIZED, {
			width: this._stageSize.width,
			height: this._stageSize.height
		}, r));
	}
	createView(e, t) {
		return new this.View(e, je(this.viewSettings, { forceRight: t }));
	}
	handleNextPrePaginated(e, t, r) {
		let i;
		if (this.layout.name === "pre-paginated" && this.layout.divisor > 1) {
			if (e || t.index === 0) return;
			if (i = t.next(), i && !i.properties.includes("page-spread-left")) return r.call(this, i);
		}
	}
	display(e, t) {
		var r = new ge(), i = r.promise;
		(t === e.href || qe(t)) && (t = void 0);
		var s = this.views.find(e);
		if (s && e && this.layout.name !== "pre-paginated") {
			let o = s.offset();
			if (this.settings.direction === "ltr") this.scrollTo(o.left, o.top, !0);
			else {
				let l = s.width();
				this.scrollTo(o.left + l, o.top, !0);
			}
			if (t) {
				let l = s.locationOf(t), u = s.width();
				this.moveTo(l, u);
			}
			return r.resolve(), i;
		}
		this.clear();
		let a = !1;
		return this.layout.name === "pre-paginated" && this.layout.divisor === 2 && e.properties.includes("page-spread-right") && (a = !0), this.add(e, a).then(function(o) {
			if (t) {
				let l = o.locationOf(t), u = o.width();
				this.moveTo(l, u);
			}
		}.bind(this), (o) => {
			r.reject(o);
		}).then(function() {
			return this.handleNextPrePaginated(a, e, this.add);
		}.bind(this)).then(function() {
			this.views.show(), r.resolve();
		}.bind(this)), i;
	}
	afterDisplayed(e) {
		this.emit(ee.MANAGERS.ADDED, e);
	}
	afterResized(e) {
		this.emit(ee.MANAGERS.RESIZE, e.section);
	}
	moveTo(e, t) {
		var r = 0, i = 0;
		this.isPaginated ? (r = Math.floor(e.left / this.layout.delta) * this.layout.delta, r + this.layout.delta > this.container.scrollWidth && (r = this.container.scrollWidth - this.layout.delta), i = Math.floor(e.top / this.layout.delta) * this.layout.delta, i + this.layout.delta > this.container.scrollHeight && (i = this.container.scrollHeight - this.layout.delta)) : i = e.top, this.settings.direction === "rtl" && (r = r + this.layout.delta, r = r - t), this.scrollTo(r, i, !0);
	}
	add(e, t) {
		var r = this.createView(e, t);
		return this.views.append(r), r.onDisplayed = this.afterDisplayed.bind(this), r.onResize = this.afterResized.bind(this), r.on(ee.VIEWS.AXIS, (i) => {
			this.updateAxis(i);
		}), r.on(ee.VIEWS.WRITING_MODE, (i) => {
			this.updateWritingMode(i);
		}), r.display(this.request);
	}
	append(e, t) {
		var r = this.createView(e, t);
		return this.views.append(r), r.onDisplayed = this.afterDisplayed.bind(this), r.onResize = this.afterResized.bind(this), r.on(ee.VIEWS.AXIS, (i) => {
			this.updateAxis(i);
		}), r.on(ee.VIEWS.WRITING_MODE, (i) => {
			this.updateWritingMode(i);
		}), r.display(this.request);
	}
	prepend(e, t) {
		var r = this.createView(e, t);
		return r.on(ee.VIEWS.RESIZED, (i) => {
			this.counter(i);
		}), this.views.prepend(r), r.onDisplayed = this.afterDisplayed.bind(this), r.onResize = this.afterResized.bind(this), r.on(ee.VIEWS.AXIS, (i) => {
			this.updateAxis(i);
		}), r.on(ee.VIEWS.WRITING_MODE, (i) => {
			this.updateWritingMode(i);
		}), r.display(this.request);
	}
	counter(e) {
		this.settings.axis === "vertical" ? this.scrollBy(0, e.heightDelta, !0) : this.scrollBy(e.widthDelta, 0, !0);
	}
	next() {
		var e, t;
		let r = this.settings.direction;
		if (this.views.length && (this.isPaginated && this.settings.axis === "horizontal" && (!r || r === "ltr") ? (this.scrollLeft = this.container.scrollLeft, t = this.container.scrollLeft + this.container.offsetWidth + this.layout.delta, t <= this.container.scrollWidth ? this.scrollBy(this.layout.delta, 0, !0) : e = this.views.last().section.next()) : this.isPaginated && this.settings.axis === "horizontal" && r === "rtl" ? (this.scrollLeft = this.container.scrollLeft, this.settings.rtlScrollType === "default" ? (t = this.container.scrollLeft, t > 0 ? this.scrollBy(this.layout.delta, 0, !0) : e = this.views.last().section.next()) : (t = this.container.scrollLeft + this.layout.delta * -1, t > this.container.scrollWidth * -1 ? this.scrollBy(this.layout.delta, 0, !0) : e = this.views.last().section.next())) : this.isPaginated && this.settings.axis === "vertical" ? (this.scrollTop = this.container.scrollTop, this.container.scrollTop + this.container.offsetHeight < this.container.scrollHeight ? this.scrollBy(0, this.layout.height, !0) : e = this.views.last().section.next()) : e = this.views.last().section.next(), e)) {
			this.clear(), this.updateLayout();
			let i = !1;
			return this.layout.name === "pre-paginated" && this.layout.divisor === 2 && e.properties.includes("page-spread-right") && (i = !0), this.append(e, i).then(function() {
				return this.handleNextPrePaginated(i, e, this.append);
			}.bind(this), (s) => s).then(function() {
				!this.isPaginated && this.settings.axis === "horizontal" && this.settings.direction === "rtl" && this.settings.rtlScrollType === "default" && this.scrollTo(this.container.scrollWidth, 0, !0), this.views.show();
			}.bind(this));
		}
	}
	prev() {
		var e, t;
		let r = this.settings.direction;
		if (this.views.length && (this.isPaginated && this.settings.axis === "horizontal" && (!r || r === "ltr") ? (this.scrollLeft = this.container.scrollLeft, t = this.container.scrollLeft, t > 0 ? this.scrollBy(-this.layout.delta, 0, !0) : e = this.views.first().section.prev()) : this.isPaginated && this.settings.axis === "horizontal" && r === "rtl" ? (this.scrollLeft = this.container.scrollLeft, this.settings.rtlScrollType === "default" ? (t = this.container.scrollLeft + this.container.offsetWidth, t < this.container.scrollWidth ? this.scrollBy(-this.layout.delta, 0, !0) : e = this.views.first().section.prev()) : (t = this.container.scrollLeft, t < 0 ? this.scrollBy(-this.layout.delta, 0, !0) : e = this.views.first().section.prev())) : this.isPaginated && this.settings.axis === "vertical" ? (this.scrollTop = this.container.scrollTop, this.container.scrollTop > 0 ? this.scrollBy(0, -this.layout.height, !0) : e = this.views.first().section.prev()) : e = this.views.first().section.prev(), e)) {
			this.clear(), this.updateLayout();
			let i = !1;
			return this.layout.name === "pre-paginated" && this.layout.divisor === 2 && typeof e.prev() != "object" && (i = !0), this.prepend(e, i).then(function() {
				var s;
				if (this.layout.name === "pre-paginated" && this.layout.divisor > 1 && (s = e.prev(), s)) return this.prepend(s);
			}.bind(this), (s) => s).then(function() {
				this.isPaginated && this.settings.axis === "horizontal" && (this.settings.direction === "rtl" ? this.settings.rtlScrollType === "default" ? this.scrollTo(0, 0, !0) : this.scrollTo(this.container.scrollWidth * -1 + this.layout.delta, 0, !0) : this.scrollTo(this.container.scrollWidth - this.layout.delta, 0, !0)), this.views.show();
			}.bind(this));
		}
	}
	current() {
		var e = this.visible();
		return e.length ? e[e.length - 1] : null;
	}
	clear() {
		this.views && (this.views.hide(), this.scrollTo(0, 0, !0), this.views.clear());
	}
	currentLocation() {
		return this.updateLayout(), this.isPaginated && this.settings.axis === "horizontal" ? this.location = this.paginatedLocation() : this.location = this.scrolledLocation(), this.location;
	}
	scrolledLocation() {
		let e = this.visible(), t = this.container.getBoundingClientRect(), r = t.height < window.innerHeight ? t.height : window.innerHeight, i = t.width < window.innerWidth ? t.width : window.innerWidth, s = this.settings.axis === "vertical";
		this.settings.direction;
		let o = 0, l = 0;
		return this.settings.fullsize && (o = s ? window.scrollY : window.scrollX), e.map((f) => {
			let { index: c, href: p } = f.section, y = f.position(), _ = f.width(), N = f.height(), I, d, v, b;
			s ? (I = o + t.top - y.top + l, d = I + r - l, b = this.layout.count(N, r).pages, v = r) : (I = o + t.left - y.left + l, d = I + i - l, b = this.layout.count(_, i).pages, v = i);
			let T = Math.ceil(I / v), F = [], E = Math.ceil(d / v);
			if (this.settings.direction === "rtl" && !s) {
				let R = T;
				T = b - E, E = b - R;
			}
			F = [];
			for (var A = T; A <= E; A++) {
				let R = A + 1;
				F.push(R);
			}
			let C = this.mapping.page(f.contents, f.section.cfiBase, I, d);
			return {
				index: c,
				href: p,
				pages: F,
				totalPages: b,
				mapping: C
			};
		});
	}
	paginatedLocation() {
		let e = this.visible(), t = this.container.getBoundingClientRect(), r = 0, i = 0;
		return this.settings.fullsize && (r = window.scrollX), e.map((a) => {
			let { index: o, href: l } = a.section, u, f = a.position(), c = a.width(), p, y, _;
			this.settings.direction === "rtl" ? (u = t.right - r, _ = Math.min(Math.abs(u - f.left), this.layout.width) - i, y = f.width - (f.right - u) - i, p = y - _) : (u = t.left + r, _ = Math.min(f.right - u, this.layout.width) - i, p = u - f.left + i, y = p + _), i += _;
			let N = this.mapping.page(a.contents, a.section.cfiBase, p, y), I = this.layout.count(c).pages, d = Math.floor(p / this.layout.pageWidth), v = [], b = Math.floor(y / this.layout.pageWidth);
			if (d < 0 && (d = 0, b = b + 1), this.settings.direction === "rtl") {
				let F = d;
				d = I - b, b = I - F;
			}
			for (var T = d + 1; T <= b; T++) {
				let F = T;
				v.push(F);
			}
			return {
				index: o,
				href: l,
				pages: v,
				totalPages: I,
				mapping: N
			};
		});
	}
	isVisible(e, t, r, i) {
		var s = e.position(), a = i || this.bounds();
		return this.settings.axis === "horizontal" && s.right > a.left - t && s.left < a.right + r ? !0 : this.settings.axis === "vertical" && s.bottom > a.top - t && s.top < a.bottom + r;
	}
	visible() {
		for (var e = this.bounds(), t = this.views.displayed(), r = t.length, i = [], s, a, o = 0; o < r; o++) a = t[o], s = this.isVisible(a, 0, 0, e), s === !0 && i.push(a);
		return i;
	}
	scrollBy(e, t, r) {
		let i = this.settings.direction === "rtl" ? -1 : 1;
		r && (this.ignore = !0), this.settings.fullsize ? window.scrollBy(e * i, t * i) : (e && (this.container.scrollLeft += e * i), t && (this.container.scrollTop += t)), this.scrolled = !0;
	}
	scrollTo(e, t, r) {
		r && (this.ignore = !0), this.settings.fullsize ? window.scrollTo(e, t) : (this.container.scrollLeft = e, this.container.scrollTop = t), this.scrolled = !0;
	}
	onScroll() {
		let e, t;
		this.settings.fullsize ? (e = window.scrollY, t = window.scrollX) : (e = this.container.scrollTop, t = this.container.scrollLeft), this.scrollTop = e, this.scrollLeft = t, this.ignore ? this.ignore = !1 : (this.emit(ee.MANAGERS.SCROLL, {
			top: e,
			left: t
		}), clearTimeout(this.afterScrolled), this.afterScrolled = setTimeout(function() {
			this.emit(ee.MANAGERS.SCROLLED, {
				top: this.scrollTop,
				left: this.scrollLeft
			});
		}.bind(this), 20));
	}
	bounds() {
		var e;
		return e = this.stage.bounds(), e;
	}
	applyLayout(e) {
		this.layout = e, this.updateLayout(), this.views && this.views.length > 0 && this.layout.name === "pre-paginated" && this.display(this.views.first().section);
	}
	updateLayout() {
		this.stage && (this._stageSize = this.stage.size(), this.isPaginated ? (this.layout.calculate(this._stageSize.width, this._stageSize.height, this.settings.gap), this.settings.offset = this.layout.delta / this.layout.divisor) : this.layout.calculate(this._stageSize.width, this._stageSize.height), this.viewSettings.width = this.layout.width, this.viewSettings.height = this.layout.height, this.setLayout(this.layout));
	}
	setLayout(e) {
		this.viewSettings.layout = e, this.mapping = new ii(e.props, this.settings.direction, this.settings.axis), this.views && this.views.forEach(function(t) {
			t && t.setLayout(e);
		});
	}
	updateWritingMode(e) {
		this.writingMode = e;
	}
	updateAxis(e, t) {
		!t && e === this.settings.axis || (this.settings.axis = e, this.stage && this.stage.axis(e), this.viewSettings.axis = e, this.mapping && (this.mapping = new ii(this.layout.props, this.settings.direction, this.settings.axis)), this.layout && (e === "vertical" ? this.layout.spread("none") : this.layout.spread(this.layout.settings.spread)));
	}
	updateFlow(e, t = "auto") {
		let r = e === "paginated" || e === "auto";
		this.isPaginated = r, e === "scrolled-doc" || e === "scrolled-continuous" || e === "scrolled" ? this.updateAxis("vertical") : this.updateAxis("horizontal"), this.viewSettings.flow = e, this.settings.overflow ? this.overflow = this.settings.overflow : this.overflow = r ? "hidden" : t, this.stage && this.stage.overflow(this.overflow), this.updateLayout();
	}
	getContents() {
		var e = [];
		return this.views && this.views.forEach(function(t) {
			let r = t && t.contents;
			r && e.push(r);
		}), e;
	}
	direction(e = "ltr") {
		this.settings.direction = e, this.stage && this.stage.direction(e), this.viewSettings.direction = e, this.updateLayout();
	}
	isRendered() {
		return this.rendered;
	}
};
(0, Sl.default)(Sn.prototype);
var Mi = Sn;
var Nl = rt(Yt());
var Hd = Math.PI / 2;
var Vd = {
	easeOutSine: function(n) {
		return Math.sin(n * Hd);
	},
	easeInOutSine: function(n) {
		return -.5 * (Math.cos(Math.PI * n) - 1);
	},
	easeInOutQuint: function(n) {
		return (n /= .5) < 1 ? .5 * Math.pow(n, 5) : .5 * (Math.pow(n - 2, 5) + 2);
	},
	easeInCubic: function(n) {
		return Math.pow(n, 3);
	}
};
var Nn = class {
	constructor(e, t) {
		this.settings = je({
			duration: 80,
			minVelocity: .2,
			minDistance: 10,
			easing: Vd.easeInCubic
		}, t || {}), this.supportsTouch = this.supportsTouch(), this.supportsTouch && this.setup(e);
	}
	setup(e) {
		this.manager = e, this.layout = this.manager.layout, this.fullsize = this.manager.settings.fullsize, this.fullsize ? (this.element = this.manager.stage.element, this.scroller = window, this.disableScroll()) : (this.element = this.manager.stage.container, this.scroller = this.element, this.element.style.WebkitOverflowScrolling = "touch"), this.manager.settings.offset = this.layout.width, this.manager.settings.afterScrolledTimeout = this.settings.duration * 2, this.isVertical = this.manager.settings.axis === "vertical", !(!this.manager.isPaginated || this.isVertical) && (this.touchCanceler = !1, this.resizeCanceler = !1, this.snapping = !1, this.scrollLeft, this.scrollTop, this.startTouchX = void 0, this.startTouchY = void 0, this.startTime = void 0, this.endTouchX = void 0, this.endTouchY = void 0, this.endTime = void 0, this.addListeners());
	}
	supportsTouch() {
		return !!("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
	}
	disableScroll() {
		this.element.style.overflow = "hidden";
	}
	enableScroll() {
		this.element.style.overflow = "";
	}
	addListeners() {
		this._onResize = this.onResize.bind(this), window.addEventListener("resize", this._onResize), this._onScroll = this.onScroll.bind(this), this.scroller.addEventListener("scroll", this._onScroll), this._onTouchStart = this.onTouchStart.bind(this), this.scroller.addEventListener("touchstart", this._onTouchStart, { passive: !0 }), this.on("touchstart", this._onTouchStart), this._onTouchMove = this.onTouchMove.bind(this), this.scroller.addEventListener("touchmove", this._onTouchMove, { passive: !0 }), this.on("touchmove", this._onTouchMove), this._onTouchEnd = this.onTouchEnd.bind(this), this.scroller.addEventListener("touchend", this._onTouchEnd, { passive: !0 }), this.on("touchend", this._onTouchEnd), this._afterDisplayed = this.afterDisplayed.bind(this), this.manager.on(ee.MANAGERS.ADDED, this._afterDisplayed);
	}
	removeListeners() {
		window.removeEventListener("resize", this._onResize), this._onResize = void 0, this.scroller.removeEventListener("scroll", this._onScroll), this._onScroll = void 0, this.scroller.removeEventListener("touchstart", this._onTouchStart, { passive: !0 }), this.off("touchstart", this._onTouchStart), this._onTouchStart = void 0, this.scroller.removeEventListener("touchmove", this._onTouchMove, { passive: !0 }), this.off("touchmove", this._onTouchMove), this._onTouchMove = void 0, this.scroller.removeEventListener("touchend", this._onTouchEnd, { passive: !0 }), this.off("touchend", this._onTouchEnd), this._onTouchEnd = void 0, this.manager.off(ee.MANAGERS.ADDED, this._afterDisplayed), this._afterDisplayed = void 0;
	}
	afterDisplayed(e) {
		let t = e.contents;
		[
			"touchstart",
			"touchmove",
			"touchend"
		].forEach((r) => {
			t.on(r, (i) => this.triggerViewEvent(i, t));
		});
	}
	triggerViewEvent(e, t) {
		this.emit(e.type, e, t);
	}
	onScroll(e) {
		this.scrollLeft = this.fullsize ? window.scrollX : this.scroller.scrollLeft, this.scrollTop = this.fullsize ? window.scrollY : this.scroller.scrollTop;
	}
	onResize(e) {
		this.resizeCanceler = !0;
	}
	onTouchStart(e) {
		let { screenX: t, screenY: r } = e.touches[0];
		this.fullsize && this.enableScroll(), this.touchCanceler = !0, this.startTouchX || (this.startTouchX = t, this.startTouchY = r, this.startTime = this.now()), this.endTouchX = t, this.endTouchY = r, this.endTime = this.now();
	}
	onTouchMove(e) {
		let { screenX: t, screenY: r } = e.touches[0], i = Math.abs(r - this.endTouchY);
		this.touchCanceler = !0, !this.fullsize && i < 10 && (this.element.scrollLeft -= t - this.endTouchX), this.endTouchX = t, this.endTouchY = r, this.endTime = this.now();
	}
	onTouchEnd(e) {
		this.fullsize && this.disableScroll(), this.touchCanceler = !1;
		let t = this.wasSwiped();
		t !== 0 ? this.snap(t) : this.snap(), this.startTouchX = void 0, this.startTouchY = void 0, this.startTime = void 0, this.endTouchX = void 0, this.endTouchY = void 0, this.endTime = void 0;
	}
	wasSwiped() {
		let e = this.layout.pageWidth * this.layout.divisor, t = this.endTouchX - this.startTouchX, r = Math.abs(t), s = t / (this.endTime - this.startTime), a = this.settings.minVelocity;
		if (r <= this.settings.minDistance || r >= e) return 0;
		if (s > a) return -1;
		if (s < -a) return 1;
	}
	needsSnap() {
		return this.scrollLeft % (this.layout.pageWidth * this.layout.divisor) !== 0;
	}
	snap(e = 0) {
		let t = this.scrollLeft, r = this.layout.pageWidth * this.layout.divisor, i = Math.round(t / r) * r;
		return e && (i += e * r), this.smoothScrollTo(i);
	}
	smoothScrollTo(e) {
		let t = new ge(), r = this.scrollLeft, i = this.now(), s = this.settings.duration, a = this.settings.easing;
		this.snapping = !0;
		function o() {
			let l = this.now(), u = Math.min(1, (l - i) / s);
			a(u);
			if (this.touchCanceler || this.resizeCanceler) {
				this.resizeCanceler = !1, this.snapping = !1, t.resolve();
				return;
			}
			u < 1 ? (window.requestAnimationFrame(o.bind(this)), this.scrollTo(r + (e - r) * u, 0)) : (this.scrollTo(e, 0), this.snapping = !1, t.resolve());
		}
		return o.call(this), t.promise;
	}
	scrollTo(e = 0, t = 0) {
		this.fullsize ? window.scroll(e, t) : (this.scroller.scrollLeft = e, this.scroller.scrollTop = t);
	}
	now() {
		return "now" in window.performance ? performance.now() : (/* @__PURE__ */ new Date()).getTime();
	}
	destroy() {
		this.scroller && (this.fullsize && this.enableScroll(), this.removeListeners(), this.scroller = void 0);
	}
};
(0, Nl.default)(Nn.prototype);
var ia = Nn;
var Il = rt(ea());
var na = class extends Mi {
	constructor(e) {
		super(e), this.name = "continuous", this.settings = je(this.settings || {}, {
			infinite: !0,
			overflow: void 0,
			axis: void 0,
			writingMode: void 0,
			flow: "scrolled",
			offset: 500,
			offsetDelta: 250,
			width: void 0,
			height: void 0,
			snap: !1,
			afterScrolledTimeout: 10,
			allowScriptedContent: !1,
			allowPopups: !1
		}), je(this.settings, e.settings || {}), e.settings.gap != "undefined" && e.settings.gap === 0 && (this.settings.gap = e.settings.gap), this.viewSettings = {
			ignoreClass: this.settings.ignoreClass,
			axis: this.settings.axis,
			flow: this.settings.flow,
			layout: this.layout,
			width: 0,
			height: 0,
			forceEvenPages: !1,
			allowScriptedContent: this.settings.allowScriptedContent,
			allowPopups: this.settings.allowPopups
		}, this.scrollTop = 0, this.scrollLeft = 0;
	}
	display(e, t) {
		return Mi.prototype.display.call(this, e, t).then(function() {
			return this.fill();
		}.bind(this));
	}
	fill(e) {
		var t = e || new ge();
		return this.q.enqueue(() => this.check()).then((r) => {
			r ? this.fill(t) : t.resolve();
		}), t.promise;
	}
	moveTo(e) {
		var t = 0, r = 0;
		this.isPaginated ? (t = Math.floor(e.left / this.layout.delta) * this.layout.delta, t + this.settings.offsetDelta) : (r = e.top, e.top + this.settings.offsetDelta), (t > 0 || r > 0) && this.scrollBy(t, r, !0);
	}
	afterResized(e) {
		this.emit(ee.MANAGERS.RESIZE, e.section);
	}
	removeShownListeners(e) {
		e.onDisplayed = function() {};
	}
	add(e) {
		var t = this.createView(e);
		return this.views.append(t), t.on(ee.VIEWS.RESIZED, (r) => {
			t.expanded = !0;
		}), t.on(ee.VIEWS.AXIS, (r) => {
			this.updateAxis(r);
		}), t.on(ee.VIEWS.WRITING_MODE, (r) => {
			this.updateWritingMode(r);
		}), t.onDisplayed = this.afterDisplayed.bind(this), t.onResize = this.afterResized.bind(this), t.display(this.request);
	}
	append(e) {
		var t = this.createView(e);
		return t.on(ee.VIEWS.RESIZED, (r) => {
			t.expanded = !0;
		}), t.on(ee.VIEWS.AXIS, (r) => {
			this.updateAxis(r);
		}), t.on(ee.VIEWS.WRITING_MODE, (r) => {
			this.updateWritingMode(r);
		}), this.views.append(t), t.onDisplayed = this.afterDisplayed.bind(this), t;
	}
	prepend(e) {
		var t = this.createView(e);
		return t.on(ee.VIEWS.RESIZED, (r) => {
			this.counter(r), t.expanded = !0;
		}), t.on(ee.VIEWS.AXIS, (r) => {
			this.updateAxis(r);
		}), t.on(ee.VIEWS.WRITING_MODE, (r) => {
			this.updateWritingMode(r);
		}), this.views.prepend(t), t.onDisplayed = this.afterDisplayed.bind(this), t;
	}
	counter(e) {
		this.settings.axis === "vertical" ? this.scrollBy(0, e.heightDelta, !0) : this.scrollBy(e.widthDelta, 0, !0);
	}
	update(e) {
		for (var t = this.bounds(), r = this.views.all(), i = r.length, s = [], a = typeof e != "undefined" ? e : this.settings.offset || 0, o, l, u = new ge(), f = [], c = 0; c < i; c++) if (l = r[c], o = this.isVisible(l, a, a, t), o === !0) {
			if (l.displayed) l.show();
			else {
				let p = l.display(this.request).then(function(y) {
					y.show();
				}, (y) => {
					l.hide();
				});
				f.push(p);
			}
			s.push(l);
		} else this.q.enqueue(l.destroy.bind(l)), clearTimeout(this.trimTimeout), this.trimTimeout = setTimeout(function() {
			this.q.enqueue(this.trim.bind(this));
		}.bind(this), 250);
		return f.length ? Promise.all(f).catch((p) => {
			u.reject(p);
		}) : (u.resolve(), u.promise);
	}
	check(e, t) {
		var r = new ge(), i = [], s = this.settings.axis === "horizontal", a = this.settings.offset || 0;
		e && s && (a = e), t && !s && (a = t);
		var o = this._bounds;
		let l = s ? this.scrollLeft : this.scrollTop, u = s ? Math.floor(o.width) : o.height, f = s ? this.container.scrollWidth : this.container.scrollHeight, c = this.writingMode && this.writingMode.indexOf("vertical") === 0 ? "vertical" : "horizontal", p = this.settings.rtlScrollType, y = this.settings.direction === "rtl";
		this.settings.fullsize ? (s && y && p === "negative" || !s && y && p === "default") && (l = l * -1) : (y && p === "default" && c === "horizontal" && (l = f - u - l), y && p === "negative" && c === "horizontal" && (l = l * -1));
		let _ = () => {
			let b = this.views.first(), T = b && b.section.prev();
			T && i.push(this.prepend(T));
		}, N = () => {
			let b = this.views.last(), T = b && b.section.next();
			T && i.push(this.append(T));
		}, I = l + u + a, d = l - a;
		I >= f && N(), d < 0 && _();
		let v = i.map((b) => b.display(this.request));
		return i.length ? Promise.all(v).then(() => this.check()).then(() => this.update(a), (b) => b) : (this.q.enqueue(function() {
			this.update();
		}.bind(this)), r.resolve(!1), r.promise);
	}
	trim() {
		for (var e = new ge(), t = this.views.displayed(), r = t[0], i = t[t.length - 1], s = this.views.indexOf(r), a = this.views.indexOf(i), o = this.views.slice(0, s), l = this.views.slice(a + 1), u = 0; u < o.length - 1; u++) this.erase(o[u], o);
		for (var f = 1; f < l.length; f++) this.erase(l[f]);
		return e.resolve(), e.promise;
	}
	erase(e, t) {
		var r, i;
		this.settings.fullsize ? (r = window.scrollY, i = window.scrollX) : (r = this.container.scrollTop, i = this.container.scrollLeft);
		var s = e.bounds();
		this.views.remove(e), t && (this.settings.axis === "vertical" ? this.scrollTo(0, r - s.height, !0) : this.settings.direction === "rtl" ? this.settings.fullsize ? this.scrollTo(i + Math.floor(s.width), 0, !0) : this.scrollTo(i, 0, !0) : this.scrollTo(i - Math.floor(s.width), 0, !0));
	}
	addEventListeners(e) {
		window.addEventListener("unload", function(t) {
			this.ignore = !0, this.destroy();
		}.bind(this)), this.addScrollListeners(), this.isPaginated && this.settings.snap && (this.snapper = new ia(this, this.settings.snap && typeof this.settings.snap == "object" && this.settings.snap));
	}
	addScrollListeners() {
		var e;
		this.tick = Ni;
		let t = this.settings.direction === "rtl" && this.settings.rtlScrollType === "default" ? -1 : 1;
		this.scrollDeltaVert = 0, this.scrollDeltaHorz = 0, this.settings.fullsize ? (e = window, this.scrollTop = window.scrollY * t, this.scrollLeft = window.scrollX * t) : (e = this.container, this.scrollTop = this.container.scrollTop, this.scrollLeft = this.container.scrollLeft), this._onScroll = this.onScroll.bind(this), e.addEventListener("scroll", this._onScroll), this._scrolled = (0, Il.default)(this.scrolled.bind(this), 30), this.didScroll = !1;
	}
	removeEventListeners() {
		var e;
		this.settings.fullsize ? e = window : e = this.container, e.removeEventListener("scroll", this._onScroll), this._onScroll = void 0;
	}
	onScroll() {
		let e, t, r = this.settings.direction === "rtl" && this.settings.rtlScrollType === "default" ? -1 : 1;
		this.settings.fullsize ? (e = window.scrollY * r, t = window.scrollX * r) : (e = this.container.scrollTop, t = this.container.scrollLeft), this.scrollTop = e, this.scrollLeft = t, this.ignore ? this.ignore = !1 : this._scrolled(), this.scrollDeltaVert += Math.abs(e - this.prevScrollTop), this.scrollDeltaHorz += Math.abs(t - this.prevScrollLeft), this.prevScrollTop = e, this.prevScrollLeft = t, clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(function() {
			this.scrollDeltaVert = 0, this.scrollDeltaHorz = 0;
		}.bind(this), 150), clearTimeout(this.afterScrolled), this.didScroll = !1;
	}
	scrolled() {
		this.q.enqueue(function() {
			return this.check();
		}.bind(this)), this.emit(ee.MANAGERS.SCROLL, {
			top: this.scrollTop,
			left: this.scrollLeft
		}), clearTimeout(this.afterScrolled), this.afterScrolled = setTimeout(function() {
			this.snapper && this.snapper.supportsTouch && this.snapper.needsSnap() || this.emit(ee.MANAGERS.SCROLLED, {
				top: this.scrollTop,
				left: this.scrollLeft
			});
		}.bind(this), this.settings.afterScrolledTimeout);
	}
	next() {
		let e = this.layout.props.name === "pre-paginated" && this.layout.props.spread ? this.layout.props.delta * 2 : this.layout.props.delta;
		this.views.length && (this.isPaginated && this.settings.axis === "horizontal" ? this.scrollBy(e, 0, !0) : this.scrollBy(0, this.layout.height, !0), this.q.enqueue(function() {
			return this.check();
		}.bind(this)));
	}
	prev() {
		let e = this.layout.props.name === "pre-paginated" && this.layout.props.spread ? this.layout.props.delta * 2 : this.layout.props.delta;
		this.views.length && (this.isPaginated && this.settings.axis === "horizontal" ? this.scrollBy(-e, 0, !0) : this.scrollBy(0, -this.layout.height, !0), this.q.enqueue(function() {
			return this.check();
		}.bind(this)));
	}
	updateFlow(e) {
		this.rendered && this.snapper && (this.snapper.destroy(), this.snapper = void 0), super.updateFlow(e, "scroll"), this.rendered && this.isPaginated && this.settings.snap && (this.snapper = new ia(this, this.settings.snap && typeof this.settings.snap == "object" && this.settings.snap));
	}
	destroy() {
		super.destroy(), this.snapper && this.snapper.destroy();
	}
};
var Ol = na;
var In = class {
	constructor(e, t) {
		this.settings = je(this.settings || {}, {
			width: null,
			height: null,
			ignoreClass: "",
			manager: "default",
			view: "iframe",
			flow: null,
			layout: null,
			spread: null,
			minSpreadWidth: 800,
			stylesheet: null,
			resizeOnOrientationChange: !0,
			script: null,
			snap: !1,
			defaultDirection: "ltr",
			allowScriptedContent: !1,
			allowPopups: !1
		}), je(this.settings, t), typeof this.settings.manager == "object" && (this.manager = this.settings.manager), this.book = e, this.hooks = {}, this.hooks.display = new Rt(this), this.hooks.serialize = new Rt(this), this.hooks.content = new Rt(this), this.hooks.unloaded = new Rt(this), this.hooks.layout = new Rt(this), this.hooks.render = new Rt(this), this.hooks.show = new Rt(this), this.hooks.content.register(this.handleLinks.bind(this)), this.hooks.content.register(this.passEvents.bind(this)), this.hooks.content.register(this.adjustImages.bind(this)), this.book.spine.hooks.content.register(this.injectIdentifier.bind(this)), this.settings.stylesheet && this.book.spine.hooks.content.register(this.injectStylesheet.bind(this)), this.settings.script && this.book.spine.hooks.content.register(this.injectScript.bind(this)), this.themes = new Nu(this), this.annotations = new Lu(this), this.epubcfi = new _e(), this.q = new ti(this), this.location = void 0, this.q.enqueue(this.book.opened), this.starting = new ge(), this.started = this.starting.promise, this.q.enqueue(this.start);
	}
	setManager(e) {
		this.manager = e;
	}
	requireManager(e) {
		var t;
		return typeof e == "string" && e === "default" ? t = Mi : typeof e == "string" && e === "continuous" ? t = Ol : t = e, t;
	}
	requireView(e) {
		var t;
		return typeof e == "string" && e === "iframe" ? t = Vu : t = e, t;
	}
	start() {
		switch (!this.settings.layout && (this.book.package.metadata.layout === "pre-paginated" || this.book.displayOptions.fixedLayout === "true") && (this.settings.layout = "pre-paginated"), this.book.package.metadata.spread) {
			case "none":
				this.settings.spread = "none";
				break;
			case "both": this.settings.spread = !0;
		}
		this.manager || (this.ViewManager = this.requireManager(this.settings.manager), this.View = this.requireView(this.settings.view), this.manager = new this.ViewManager({
			view: this.View,
			queue: this.q,
			request: this.book.load.bind(this.book),
			settings: this.settings
		})), this.direction(this.book.package.metadata.direction || this.settings.defaultDirection), this.settings.globalLayoutProperties = this.determineLayoutProperties(this.book.package.metadata), this.flow(this.settings.globalLayoutProperties.flow), this.layout(this.settings.globalLayoutProperties), this.manager.on(ee.MANAGERS.ADDED, this.afterDisplayed.bind(this)), this.manager.on(ee.MANAGERS.REMOVED, this.afterRemoved.bind(this)), this.manager.on(ee.MANAGERS.RESIZED, this.onResized.bind(this)), this.manager.on(ee.MANAGERS.ORIENTATION_CHANGE, this.onOrientationChange.bind(this)), this.manager.on(ee.MANAGERS.SCROLLED, this.reportLocation.bind(this)), this.emit(ee.RENDITION.STARTED), this.starting.resolve();
	}
	attachTo(e) {
		return this.q.enqueue(function() {
			this.manager.render(e, {
				width: this.settings.width,
				height: this.settings.height
			}), this.emit(ee.RENDITION.ATTACHED);
		}.bind(this));
	}
	display(e) {
		return this.displaying && this.displaying.resolve(), this.q.enqueue(this._display, e);
	}
	_display(e) {
		if (this.book) {
			this.epubcfi.isCfiString(e);
			var r = new ge(), i = r.promise, s;
			return this.displaying = r, this.book.locations.length() && ws(e) && (e = this.book.locations.cfiFromPercentage(parseFloat(e))), s = this.book.spine.get(e), s ? (this.manager.display(s, e).then(() => {
				r.resolve(s), this.displaying = void 0, this.emit(ee.RENDITION.DISPLAYED, s), this.reportLocation();
			}, (o) => {
				this.emit(ee.RENDITION.DISPLAY_ERROR, o);
			}), i) : (r.reject(/* @__PURE__ */ new Error("No Section Found")), i);
		}
	}
	afterDisplayed(e) {
		e.on(ee.VIEWS.MARK_CLICKED, (t, r) => this.triggerMarkEvent(t, r, e.contents)), this.hooks.render.trigger(e, this).then(() => {
			e.contents ? this.hooks.content.trigger(e.contents, this).then(() => {
				this.emit(ee.RENDITION.RENDERED, e.section, e);
			}) : this.emit(ee.RENDITION.RENDERED, e.section, e);
		});
	}
	afterRemoved(e) {
		this.hooks.unloaded.trigger(e, this).then(() => {
			this.emit(ee.RENDITION.REMOVED, e.section, e);
		});
	}
	onResized(e, t) {
		this.emit(ee.RENDITION.RESIZED, {
			width: e.width,
			height: e.height
		}, t), this.location && this.location.start && this.display(t || this.location.start.cfi);
	}
	onOrientationChange(e) {
		this.emit(ee.RENDITION.ORIENTATION_CHANGE, e);
	}
	moveTo(e) {
		this.manager.moveTo(e);
	}
	resize(e, t, r) {
		e && (this.settings.width = e), t && (this.settings.height = t), this.manager.resize(e, t, r);
	}
	clear() {
		this.manager.clear();
	}
	next() {
		return this.q.enqueue(this.manager.next.bind(this.manager)).then(this.reportLocation.bind(this));
	}
	prev() {
		return this.q.enqueue(this.manager.prev.bind(this.manager)).then(this.reportLocation.bind(this));
	}
	determineLayoutProperties(e) {
		var t, r = this.settings.layout || e.layout || "reflowable", i = this.settings.spread || e.spread || "auto", s = this.settings.orientation || e.orientation || "auto", a = this.settings.flow || e.flow || "auto", o = e.viewport || "", l = this.settings.minSpreadWidth || e.minSpreadWidth || 800, u = this.settings.direction || e.direction || "ltr";
		return (this.settings.width === 0 || this.settings.width > 0) && (this.settings.height === 0 || this.settings.height), t = {
			layout: r,
			spread: i,
			orientation: s,
			flow: a,
			viewport: o,
			minSpreadWidth: l,
			direction: u
		}, t;
	}
	flow(e) {
		var t = e;
		(e === "scrolled" || e === "scrolled-doc" || e === "scrolled-continuous") && (t = "scrolled"), (e === "auto" || e === "paginated") && (t = "paginated"), this.settings.flow = e, this._layout && this._layout.flow(t), this.manager && this._layout && this.manager.applyLayout(this._layout), this.manager && this.manager.updateFlow(t), this.manager && this.manager.isRendered() && this.location && (this.manager.clear(), this.display(this.location.start.cfi));
	}
	layout(e) {
		return e && (this._layout = new Gs(e), this._layout.spread(e.spread, this.settings.minSpreadWidth), this._layout.on(ee.LAYOUT.UPDATED, (t, r) => {
			this.emit(ee.RENDITION.LAYOUT, t, r);
		})), this.manager && this._layout && this.manager.applyLayout(this._layout), this._layout;
	}
	spread(e, t) {
		this.settings.spread = e, t && (this.settings.minSpreadWidth = t), this._layout && this._layout.spread(e, t), this.manager && this.manager.isRendered() && this.manager.updateLayout();
	}
	direction(e) {
		this.settings.direction = e || "ltr", this.manager && this.manager.direction(this.settings.direction), this.manager && this.manager.isRendered() && this.location && (this.manager.clear(), this.display(this.location.start.cfi));
	}
	reportLocation() {
		return this.q.enqueue(function() {
			requestAnimationFrame(function() {
				var r = this.manager.currentLocation();
				if (r && r.then && typeof r.then == "function") r.then(function(i) {
					let s = this.located(i);
					!s || !s.start || !s.end || (this.location = s, this.emit(ee.RENDITION.LOCATION_CHANGED, {
						index: this.location.start.index,
						href: this.location.start.href,
						start: this.location.start.cfi,
						end: this.location.end.cfi,
						percentage: this.location.start.percentage
					}), this.emit(ee.RENDITION.RELOCATED, this.location));
				}.bind(this));
				else if (r) {
					let i = this.located(r);
					if (!i || !i.start || !i.end) return;
					this.location = i, this.emit(ee.RENDITION.LOCATION_CHANGED, {
						index: this.location.start.index,
						href: this.location.start.href,
						start: this.location.start.cfi,
						end: this.location.end.cfi,
						percentage: this.location.start.percentage
					}), this.emit(ee.RENDITION.RELOCATED, this.location);
				}
			}.bind(this));
		}.bind(this));
	}
	currentLocation() {
		var e = this.manager.currentLocation();
		if (e && e.then && typeof e.then == "function") e.then(function(t) {
			return this.located(t);
		}.bind(this));
		else if (e) return this.located(e);
	}
	located(e) {
		if (!e.length) return {};
		let t = e[0], r = e[e.length - 1], i = {
			start: {
				index: t.index,
				href: t.href,
				cfi: t.mapping.start,
				displayed: {
					page: t.pages[0] || 1,
					total: t.totalPages
				}
			},
			end: {
				index: r.index,
				href: r.href,
				cfi: r.mapping.end,
				displayed: {
					page: r.pages[r.pages.length - 1] || 1,
					total: r.totalPages
				}
			}
		}, s = this.book.locations.locationFromCfi(t.mapping.start), a = this.book.locations.locationFromCfi(r.mapping.end);
		s != null && (i.start.location = s, i.start.percentage = this.book.locations.percentageFromLocation(s)), a != null && (i.end.location = a, i.end.percentage = this.book.locations.percentageFromLocation(a));
		let o = this.book.pageList.pageFromCfi(t.mapping.start), l = this.book.pageList.pageFromCfi(r.mapping.end);
		return o != -1 && (i.start.page = o), l != -1 && (i.end.page = l), r.index === this.book.spine.last().index && i.end.displayed.page >= i.end.displayed.total && (i.atEnd = !0), t.index === this.book.spine.first().index && i.start.displayed.page === 1 && (i.atStart = !0), i;
	}
	destroy() {
		this.manager && this.manager.destroy(), this.book = void 0;
	}
	passEvents(e) {
		ri.forEach((t) => {
			e.on(t, (r) => this.triggerViewEvent(r, e));
		}), e.on(ee.CONTENTS.SELECTED, (t) => this.triggerSelectedEvent(t, e));
	}
	triggerViewEvent(e, t) {
		this.emit(e.type, e, t);
	}
	triggerSelectedEvent(e, t) {
		this.emit(ee.RENDITION.SELECTED, e, t);
	}
	triggerMarkEvent(e, t, r) {
		this.emit(ee.RENDITION.MARK_CLICKED, e, t, r);
	}
	getRange(e, t) {
		var r = new _e(e), i = this.manager.visible().filter(function(s) {
			if (r.spinePos === s.index) return !0;
		});
		if (i.length) return i[0].contents.range(r, t);
	}
	adjustImages(e) {
		if (this._layout.name === "pre-paginated") return new Promise(function(s) {
			s();
		});
		let t = e.window.getComputedStyle(e.content, null), r = (e.content.offsetHeight - (parseFloat(t.paddingTop) + parseFloat(t.paddingBottom))) * .95, i = parseFloat(t.paddingLeft) + parseFloat(t.paddingRight);
		return e.addStylesheetRules({
			img: {
				"max-width": (this._layout.columnWidth ? this._layout.columnWidth - i + "px" : "100%") + "!important",
				"max-height": r + "px!important",
				"object-fit": "contain",
				"page-break-inside": "avoid",
				"break-inside": "avoid",
				"box-sizing": "border-box"
			},
			svg: {
				"max-width": (this._layout.columnWidth ? this._layout.columnWidth - i + "px" : "100%") + "!important",
				"max-height": r + "px!important",
				"page-break-inside": "avoid",
				"break-inside": "avoid"
			}
		}), new Promise(function(s, a) {
			setTimeout(function() {
				s();
			}, 1);
		});
	}
	getContents() {
		return this.manager ? this.manager.getContents() : [];
	}
	views() {
		return (this.manager ? this.manager.views : void 0) || [];
	}
	handleLinks(e) {
		e && e.on(ee.CONTENTS.LINK_CLICKED, (t) => {
			let r = this.book.path.relative(t);
			this.display(r);
		});
	}
	injectStylesheet(e, t) {
		let r = e.createElement("link");
		r.setAttribute("type", "text/css"), r.setAttribute("rel", "stylesheet"), r.setAttribute("href", this.settings.stylesheet), e.getElementsByTagName("head")[0].appendChild(r);
	}
	injectScript(e, t) {
		let r = e.createElement("script");
		r.setAttribute("type", "text/javascript"), r.setAttribute("src", this.settings.script), r.textContent = " ", e.getElementsByTagName("head")[0].appendChild(r);
	}
	injectIdentifier(e, t) {
		let r = this.book.packaging.metadata.identifier, i = e.createElement("meta");
		i.setAttribute("name", "dc.relation.ispartof"), r && i.setAttribute("content", r), e.getElementsByTagName("head")[0].appendChild(i);
	}
};
(0, Rl.default)(In.prototype);
var zi = In;
var Bl = rt(Ll());
var aa = class {
	constructor() {
		this.zip = void 0, this.urlCache = {}, this.checkRequirements();
	}
	checkRequirements() {
		try {
			this.zip = new Bl.default();
		} catch {
			throw new Error("JSZip lib not loaded");
		}
	}
	open(e, t) {
		return this.zip.loadAsync(e, { base64: t });
	}
	openUrl(e, t) {
		return or(e, "binary").then(function(r) {
			return this.zip.loadAsync(r, { base64: t });
		}.bind(this));
	}
	request(e, t) {
		var r = new ge(), i, s = new xt(e);
		return t || (t = s.extension), t == "blob" ? i = this.getBlob(e) : i = this.getText(e), i ? i.then(function(a) {
			let o = this.handleResponse(a, t);
			r.resolve(o);
		}.bind(this)) : r.reject({
			message: "File not found in the epub: " + e,
			stack: (/* @__PURE__ */ new Error()).stack
		}), r.promise;
	}
	handleResponse(e, t) {
		var r;
		return t == "json" ? r = JSON.parse(e) : gr(t) ? r = Lt(e, "text/xml") : t == "xhtml" ? r = Lt(e, "application/xhtml+xml") : t == "html" || t == "htm" ? r = Lt(e, "text/html") : r = e, r;
	}
	getBlob(e, t) {
		var r = window.decodeURIComponent(e.substr(1)), i = this.zip.file(r);
		if (i) return t = t || ur.lookup(i.name), i.async("uint8array").then(function(s) {
			return new Blob([s], { type: t });
		});
	}
	getText(e, t) {
		var r = window.decodeURIComponent(e.substr(1)), i = this.zip.file(r);
		if (i) return i.async("string").then(function(s) {
			return s;
		});
	}
	getBase64(e, t) {
		var r = window.decodeURIComponent(e.substr(1)), i = this.zip.file(r);
		if (i) return t = t || ur.lookup(i.name), i.async("base64").then(function(s) {
			return "data:" + t + ";base64," + s;
		});
	}
	createUrl(e, t) {
		var r = new ge(), i = window.URL || window.webkitURL || window.mozURL, s, a, o = t && t.base64;
		return e in this.urlCache ? (r.resolve(this.urlCache[e]), r.promise) : (o ? (a = this.getBase64(e), a && a.then(function(l) {
			this.urlCache[e] = l, r.resolve(l);
		}.bind(this))) : (a = this.getBlob(e), a && a.then(function(l) {
			s = i.createObjectURL(l), this.urlCache[e] = s, r.resolve(s);
		}.bind(this))), a || r.reject({
			message: "File not found in the epub: " + e,
			stack: (/* @__PURE__ */ new Error()).stack
		}), r.promise);
	}
	revokeUrl(e) {
		var t = window.URL || window.webkitURL || window.mozURL, r = this.urlCache[e];
		r && t.revokeObjectURL(r);
	}
	destroy() {
		var e = window.URL || window.webkitURL || window.mozURL;
		for (let t in this.urlCache) e.revokeObjectURL(t);
		this.zip = void 0, this.urlCache = {};
	}
};
var Pl = aa;
var zl = rt(Yt());
var ua = rt(Ml());
var On = class {
	constructor(e, t, r) {
		this.urlCache = {}, this.storage = void 0, this.name = e, this.requester = t || or, this.resolver = r, this.online = !0, this.checkRequirements(), this.addListeners();
	}
	checkRequirements() {
		try {
			let e;
			typeof ua.default == "undefined" && (e = ua.default), this.storage = e.createInstance({ name: this.name });
		} catch {
			throw new Error("localForage lib not loaded");
		}
	}
	addListeners() {
		this._status = this.status.bind(this), window.addEventListener("online", this._status), window.addEventListener("offline", this._status);
	}
	removeListeners() {
		window.removeEventListener("online", this._status), window.removeEventListener("offline", this._status), this._status = void 0;
	}
	status(e) {
		let t = navigator.onLine;
		this.online = t, t ? this.emit("online", this) : this.emit("offline", this);
	}
	add(e, t) {
		let r = e.resources.map((i) => {
			let { href: s } = i, a = this.resolver(s), o = window.encodeURIComponent(a);
			return this.storage.getItem(o).then((l) => !l || t ? this.requester(a, "binary").then((u) => this.storage.setItem(o, u)) : l);
		});
		return Promise.all(r);
	}
	put(e, t, r) {
		let i = window.encodeURIComponent(e);
		return this.storage.getItem(i).then((s) => s || this.requester(e, "binary", t, r).then((a) => this.storage.setItem(i, a)));
	}
	request(e, t, r, i) {
		return this.online ? this.requester(e, t, r, i).then((s) => (this.put(e), s)) : this.retrieve(e, t);
	}
	retrieve(e, t) {
		new ge();
		var i, s = new xt(e);
		return t || (t = s.extension), t == "blob" ? i = this.getBlob(e) : i = this.getText(e), i.then((a) => {
			var o = new ge(), l;
			return a ? (l = this.handleResponse(a, t), o.resolve(l)) : o.reject({
				message: "File not found in storage: " + e,
				stack: (/* @__PURE__ */ new Error()).stack
			}), o.promise;
		});
	}
	handleResponse(e, t) {
		var r;
		return t == "json" ? r = JSON.parse(e) : gr(t) ? r = Lt(e, "text/xml") : t == "xhtml" ? r = Lt(e, "application/xhtml+xml") : t == "html" || t == "htm" ? r = Lt(e, "text/html") : r = e, r;
	}
	getBlob(e, t) {
		let r = window.encodeURIComponent(e);
		return this.storage.getItem(r).then(function(i) {
			if (i) return t = t || ur.lookup(e), new Blob([i], { type: t });
		});
	}
	getText(e, t) {
		let r = window.encodeURIComponent(e);
		return t = t || ur.lookup(e), this.storage.getItem(r).then(function(i) {
			var s = new ge(), a = new FileReader(), o;
			if (i) return o = new Blob([i], { type: t }), a.addEventListener("loadend", () => {
				s.resolve(a.result);
			}), a.readAsText(o, t), s.promise;
		});
	}
	getBase64(e, t) {
		let r = window.encodeURIComponent(e);
		return t = t || ur.lookup(e), this.storage.getItem(r).then((i) => {
			var s = new ge(), a = new FileReader(), o;
			if (i) return o = new Blob([i], { type: t }), a.addEventListener("loadend", () => {
				s.resolve(a.result);
			}), a.readAsDataURL(o, t), s.promise;
		});
	}
	createUrl(e, t) {
		var r = new ge(), i = window.URL || window.webkitURL || window.mozURL, s, a, o = t && t.base64;
		return e in this.urlCache ? (r.resolve(this.urlCache[e]), r.promise) : (o ? (a = this.getBase64(e), a && a.then(function(l) {
			this.urlCache[e] = l, r.resolve(l);
		}.bind(this))) : (a = this.getBlob(e), a && a.then(function(l) {
			s = i.createObjectURL(l), this.urlCache[e] = s, r.resolve(s);
		}.bind(this))), a || r.reject({
			message: "File not found in storage: " + e,
			stack: (/* @__PURE__ */ new Error()).stack
		}), r.promise);
	}
	revokeUrl(e) {
		var t = window.URL || window.webkitURL || window.mozURL, r = this.urlCache[e];
		r && t.revokeObjectURL(r);
	}
	destroy() {
		var e = window.URL || window.webkitURL || window.mozURL;
		for (let t in this.urlCache) e.revokeObjectURL(t);
		this.urlCache = {}, this.removeListeners();
	}
};
(0, zl.default)(On.prototype);
var Ul = On;
var la = class {
	constructor(e) {
		this.interactive = "", this.fixedLayout = "", this.openToSpread = "", this.orientationLock = "", e && this.parse(e);
	}
	parse(e) {
		if (!e) return this;
		let t = ke(e, "display_options");
		return t ? (Bt(t, "option").forEach((i) => {
			let s = "";
			switch (i.childNodes.length && (s = i.childNodes[0].nodeValue), i.attributes.name.value) {
				case "interactive":
					this.interactive = s;
					break;
				case "fixed-layout":
					this.fixedLayout = s;
					break;
				case "open-to-spread":
					this.openToSpread = s;
					break;
				case "orientation-lock": this.orientationLock = s;
			}
		}), this) : this;
	}
	destroy() {
		this.interactive = void 0, this.fixedLayout = void 0, this.openToSpread = void 0, this.orientationLock = void 0;
	}
};
var Rn = la;
var ql = "META-INF/container.xml";
var Gd = "META-INF/com.apple.ibooks.display-options.xml";
var Zt = {
	BINARY: "binary",
	BASE64: "base64",
	EPUB: "epub",
	OPF: "opf",
	MANIFEST: "json",
	DIRECTORY: "directory"
};
var kn = class {
	constructor(e, t) {
		typeof t == "undefined" && typeof e != "string" && !(e instanceof Blob) && !(e instanceof ArrayBuffer) && (t = e, e = void 0), this.settings = je(this.settings || {}, {
			requestMethod: void 0,
			requestCredentials: void 0,
			requestHeaders: void 0,
			encoding: void 0,
			replacements: void 0,
			canonical: void 0,
			openAs: void 0,
			store: void 0
		}), je(this.settings, t), this.opening = new ge(), this.opened = this.opening.promise, this.isOpen = !1, this.loading = {
			manifest: new ge(),
			spine: new ge(),
			metadata: new ge(),
			cover: new ge(),
			navigation: new ge(),
			pageList: new ge(),
			resources: new ge(),
			displayOptions: new ge()
		}, this.loaded = {
			manifest: this.loading.manifest.promise,
			spine: this.loading.spine.promise,
			metadata: this.loading.metadata.promise,
			cover: this.loading.cover.promise,
			navigation: this.loading.navigation.promise,
			pageList: this.loading.pageList.promise,
			resources: this.loading.resources.promise,
			displayOptions: this.loading.displayOptions.promise
		}, this.ready = Promise.all([
			this.loaded.manifest,
			this.loaded.spine,
			this.loaded.metadata,
			this.loaded.cover,
			this.loaded.navigation,
			this.loaded.resources,
			this.loaded.displayOptions
		]), this.isRendered = !1, this.request = this.settings.requestMethod || or, this.spine = new wu(), this.locations = new xu(this.spine, this.load.bind(this)), this.navigation = void 0, this.pageList = void 0, this.url = void 0, this.path = void 0, this.archived = !1, this.archive = void 0, this.storage = void 0, this.resources = void 0, this.rendition = void 0, this.container = void 0, this.packaging = void 0, this.displayOptions = void 0, this.settings.store && this.store(this.settings.store), e && this.open(e, this.settings.openAs).catch((r) => {
			var i = /* @__PURE__ */ new Error("Cannot load book at " + e);
			this.emit(ee.BOOK.OPEN_FAILED, i);
		});
	}
	open(e, t) {
		var r, i = t || this.determineType(e);
		return i === Zt.BINARY ? (this.archived = !0, this.url = new Dt("/", ""), r = this.openEpub(e)) : i === Zt.BASE64 ? (this.archived = !0, this.url = new Dt("/", ""), r = this.openEpub(e, i)) : i === Zt.EPUB ? (this.archived = !0, this.url = new Dt("/", ""), r = this.request(e, "binary", this.settings.requestCredentials, this.settings.requestHeaders).then(this.openEpub.bind(this))) : i == Zt.OPF ? (this.url = new Dt(e), r = this.openPackaging(this.url.Path.toString())) : i == Zt.MANIFEST ? (this.url = new Dt(e), r = this.openManifest(this.url.Path.toString())) : (this.url = new Dt(e), r = this.openContainer(ql).then(this.openPackaging.bind(this))), r;
	}
	openEpub(e, t) {
		return this.unarchive(e, t || this.settings.encoding).then(() => this.openContainer(ql)).then((r) => this.openPackaging(r));
	}
	openContainer(e) {
		return this.load(e).then((t) => (this.container = new Au(t), this.resolve(this.container.packagePath)));
	}
	openPackaging(e) {
		return this.path = new xt(e), this.load(e).then((t) => (this.packaging = new Ws(t), this.unpack(this.packaging)));
	}
	openManifest(e) {
		return this.path = new xt(e), this.load(e).then((t) => (this.packaging = new Ws(), this.packaging.load(t), this.unpack(this.packaging)));
	}
	load(e) {
		var t = this.resolve(e);
		return this.archived ? this.archive.request(t) : this.request(t, null, this.settings.requestCredentials, this.settings.requestHeaders);
	}
	resolve(e, t) {
		if (e) {
			var r = e;
			return e.indexOf("://") > -1 ? e : (this.path && (r = this.path.resolve(e)), t != !1 && this.url && (r = this.url.resolve(r)), r);
		}
	}
	canonical(e) {
		var t = e;
		return e ? (this.settings.canonical ? t = this.settings.canonical(e) : t = this.resolve(e, !0), t) : "";
	}
	determineType(e) {
		var t, r, i;
		if (this.settings.encoding === "base64") return Zt.BASE64;
		if (typeof e != "string") return Zt.BINARY;
		if (t = new Dt(e), r = t.path(), i = r.extension, i && (i = i.replace(/\?.*$/, "")), !i) return Zt.DIRECTORY;
		if (i === "epub") return Zt.EPUB;
		if (i === "opf") return Zt.OPF;
		if (i === "json") return Zt.MANIFEST;
	}
	unpack(e) {
		this.package = e, this.packaging.metadata.layout === "" ? this.load(this.url.resolve(Gd)).then((t) => {
			this.displayOptions = new Rn(t), this.loading.displayOptions.resolve(this.displayOptions);
		}).catch((t) => {
			this.displayOptions = new Rn(), this.loading.displayOptions.resolve(this.displayOptions);
		}) : (this.displayOptions = new Rn(), this.loading.displayOptions.resolve(this.displayOptions)), this.spine.unpack(this.packaging, this.resolve.bind(this), this.canonical.bind(this)), this.resources = new Tu(this.packaging.manifest, {
			archive: this.archive,
			resolver: this.resolve.bind(this),
			request: this.request.bind(this),
			replacements: this.settings.replacements || (this.archived ? "blobUrl" : "base64")
		}), this.loadNavigation(this.packaging).then(() => {
			this.loading.navigation.resolve(this.navigation);
		}), this.packaging.coverPath && (this.cover = this.resolve(this.packaging.coverPath)), this.loading.manifest.resolve(this.packaging.manifest), this.loading.metadata.resolve(this.packaging.metadata), this.loading.spine.resolve(this.spine), this.loading.cover.resolve(this.cover), this.loading.resources.resolve(this.resources), this.loading.pageList.resolve(this.pageList), this.isOpen = !0, this.archived || this.settings.replacements && this.settings.replacements != "none" ? this.replacements().then(() => {
			this.loaded.displayOptions.then(() => {
				this.opening.resolve(this);
			});
		}).catch((t) => {
			console.error(t);
		}) : this.loaded.displayOptions.then(() => {
			this.opening.resolve(this);
		});
	}
	loadNavigation(e) {
		let t = e.navPath || e.ncxPath, r = e.toc;
		return r ? new Promise((i, s) => {
			this.navigation = new En(r), e.pageList && (this.pageList = new yn(e.pageList)), i(this.navigation);
		}) : t ? this.load(t, "xml").then((i) => (this.navigation = new En(i), this.pageList = new yn(i), this.navigation)) : new Promise((i, s) => {
			this.navigation = new En(), this.pageList = new yn(), i(this.navigation);
		});
	}
	section(e) {
		return this.spine.get(e);
	}
	renderTo(e, t) {
		return this.rendition = new zi(this, t), this.rendition.attachTo(e), this.rendition;
	}
	setRequestCredentials(e) {
		this.settings.requestCredentials = e;
	}
	setRequestHeaders(e) {
		this.settings.requestHeaders = e;
	}
	unarchive(e, t) {
		return this.archive = new Pl(), this.archive.open(e, t);
	}
	store(e) {
		let t = this.settings.replacements && this.settings.replacements !== "none", r = this.url, i = this.settings.requestMethod || or.bind(this);
		return this.storage = new Ul(e, i, this.resolve.bind(this)), this.request = this.storage.request.bind(this.storage), this.opened.then(() => {
			this.archived && (this.storage.requester = this.archive.request.bind(this.archive));
			let s = (a, o) => {
				o.output = this.resources.substitute(a, o.url);
			};
			this.resources.settings.replacements = t || "blobUrl", this.resources.replacements().then(() => this.resources.replaceCss()), this.storage.on("offline", () => {
				this.url = new Dt("/", ""), this.spine.hooks.serialize.register(s);
			}), this.storage.on("online", () => {
				this.url = r, this.spine.hooks.serialize.deregister(s);
			});
		}), this.storage;
	}
	coverUrl() {
		return this.loaded.cover.then(() => this.cover ? this.archived ? this.archive.createUrl(this.cover) : this.cover : null);
	}
	replacements() {
		return this.spine.hooks.serialize.register((e, t) => {
			t.output = this.resources.substitute(e, t.url);
		}), this.resources.replacements().then(() => this.resources.replaceCss());
	}
	getRange(e) {
		var t = new _e(e), r = this.spine.get(t.spinePos), i = this.load.bind(this);
		return r ? r.load(i).then(function(s) {
			return t.toRange(r.document);
		}) : new Promise((s, a) => {
			a("CFI could not be found");
		});
	}
	key(e) {
		return `epubjs:0.3:${e || this.packaging.metadata.identifier || this.url.filename}`;
	}
	destroy() {
		this.opened = void 0, this.loading = void 0, this.loaded = void 0, this.ready = void 0, this.isOpen = !1, this.isRendered = !1, this.spine && this.spine.destroy(), this.locations && this.locations.destroy(), this.pageList && this.pageList.destroy(), this.archive && this.archive.destroy(), this.resources && this.resources.destroy(), this.container && this.container.destroy(), this.packaging && this.packaging.destroy(), this.rendition && this.rendition.destroy(), this.displayOptions && this.displayOptions.destroy(), this.spine = void 0, this.locations = void 0, this.pageList = void 0, this.archive = void 0, this.resources = void 0, this.container = void 0, this.packaging = void 0, this.rendition = void 0, this.navigation = void 0, this.url = void 0, this.path = void 0, this.archived = !1;
	}
};
(0, Wl.default)(kn.prototype);
var Ln = kn;
function Cr(n, e) {
	return new Ln(n, e);
}
Cr.VERSION = "0.3";
typeof global != "undefined" && (global.EPUBJS_VERSION = "0.3");
Cr.Book = Ln;
Cr.Rendition = zi;
Cr.Contents = Li;
Cr.CFI = _e;
Cr.utils = Ns;
var jg = Cr;
//#endregion
export { Ln as Book, Li as Contents, _e as EpubCFI, Gs as Layout, zi as Rendition, jg as default };
