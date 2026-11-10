import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import "./dist-B6GcL3C6.js";
import { n as decodeFileViewerTextBuffer } from "./textEncoding-M25CFHsg.js";
import { t as require_lib } from "./lib-BZRU-hm4.js";
import { t as require_jszip_min } from "./jszip.min-eM67_wVy.js";
import { n as MAX_TRANSFERRED_LINE_CHART_POINTS, r as extremaPointIndexes, t as tinycolor } from "./tinycolor-VHUswiq2.js";
//#region ../../node_modules/.pnpm/styled-exceljs@0.21.6/node_modules/styled-exceljs/xlsx.mjs
/*! xlsx.js (C) 2013-present SheetJS -- http://sheetjs.com */
var XLSX = {};
XLSX.version = "0.21.6";
var current_codepage = 1200;
var current_ansi = 1252;
var $cptable;
var VALID_ANSI = [
	874,
	932,
	936,
	949,
	950,
	1250,
	1251,
	1252,
	1253,
	1254,
	1255,
	1256,
	1257,
	1258,
	1e4
];
var CS2CP = {
	0: 1252,
	1: 65001,
	2: 65001,
	77: 1e4,
	128: 932,
	129: 949,
	130: 1361,
	134: 936,
	136: 950,
	161: 1253,
	162: 1254,
	163: 1258,
	177: 1255,
	178: 1256,
	186: 1257,
	204: 1251,
	222: 874,
	238: 1250,
	255: 1252,
	69: 6969
};
var set_ansi = function(cp) {
	if (VALID_ANSI.indexOf(cp) == -1) return;
	current_ansi = CS2CP[0] = cp;
};
function reset_ansi() {
	set_ansi(1252);
}
var set_cp = function(cp) {
	current_codepage = cp;
	set_ansi(cp);
};
function reset_cp() {
	set_cp(1200);
	reset_ansi();
}
function char_codes(data) {
	var o = [];
	for (var i = 0, len = data.length; i < len; ++i) o[i] = data.charCodeAt(i);
	return o;
}
function utf16leread(data) {
	var o = [];
	for (var i = 0; i < data.length >> 1; ++i) o[i] = String.fromCharCode(data.charCodeAt(2 * i) + (data.charCodeAt(2 * i + 1) << 8));
	return o.join("");
}
function utf16lereadu(data) {
	var o = [];
	for (var i = 0; i < data.length >> 1; ++i) o[i] = String.fromCharCode(data[2 * i] + (data[2 * i + 1] << 8));
	return o.join("");
}
function utf16beread(data) {
	var o = [];
	for (var i = 0; i < data.length >> 1; ++i) o[i] = String.fromCharCode(data.charCodeAt(2 * i + 1) + (data.charCodeAt(2 * i) << 8));
	return o.join("");
}
var debom = function(data) {
	var c1 = data.charCodeAt(0), c2 = data.charCodeAt(1);
	if (c1 == 255 && c2 == 254) return utf16leread(data.slice(2));
	if (c1 == 254 && c2 == 255) return utf16beread(data.slice(2));
	if (c1 == 65279) return data.slice(1);
	return data;
};
var _getchar = function _gc1(x) {
	return String.fromCharCode(x);
};
var _getansi = function _ga1(x) {
	return String.fromCharCode(x);
};
var DENSE = null;
var DIF_XL = true;
var Base64_map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function Base64_encode(input) {
	var o = "";
	var c1 = 0, c2 = 0, c3 = 0, e1 = 0, e2 = 0, e3 = 0, e4 = 0;
	for (var i = 0; i < input.length;) {
		c1 = input.charCodeAt(i++);
		e1 = c1 >> 2;
		c2 = input.charCodeAt(i++);
		e2 = (c1 & 3) << 4 | c2 >> 4;
		c3 = input.charCodeAt(i++);
		e3 = (c2 & 15) << 2 | c3 >> 6;
		e4 = c3 & 63;
		if (isNaN(c2)) e3 = e4 = 64;
		else if (isNaN(c3)) e4 = 64;
		o += Base64_map.charAt(e1) + Base64_map.charAt(e2) + Base64_map.charAt(e3) + Base64_map.charAt(e4);
	}
	return o;
}
function Base64_encode_arr(input) {
	var o = "";
	var c1 = 0, c2 = 0, c3 = 0, e1 = 0, e2 = 0, e3 = 0, e4 = 0;
	for (var i = 0; i < input.length;) {
		c1 = input[i++];
		e1 = c1 >> 2;
		c2 = input[i++];
		e2 = (c1 & 3) << 4 | c2 >> 4;
		c3 = input[i++];
		e3 = (c2 & 15) << 2 | c3 >> 6;
		e4 = c3 & 63;
		if (isNaN(c2)) e3 = e4 = 64;
		else if (isNaN(c3)) e4 = 64;
		o += Base64_map.charAt(e1) + Base64_map.charAt(e2) + Base64_map.charAt(e3) + Base64_map.charAt(e4);
	}
	return o;
}
function Base64_decode(input) {
	var o = "";
	var c1 = 0, c2 = 0, c3 = 0, e1 = 0, e2 = 0, e3 = 0, e4 = 0;
	if (input.slice(0, 5) == "data:") {
		var sep = input.slice(0, 1024).indexOf(";base64,");
		if (sep > -1) input = input.slice(sep + 8);
	}
	input = input.replace(/[^\w\+\/\=]/g, "");
	for (var i = 0; i < input.length;) {
		e1 = Base64_map.indexOf(input.charAt(i++));
		e2 = Base64_map.indexOf(input.charAt(i++));
		c1 = e1 << 2 | e2 >> 4;
		o += String.fromCharCode(c1);
		e3 = Base64_map.indexOf(input.charAt(i++));
		c2 = (e2 & 15) << 4 | e3 >> 2;
		if (e3 !== 64) o += String.fromCharCode(c2);
		e4 = Base64_map.indexOf(input.charAt(i++));
		c3 = (e3 & 3) << 6 | e4;
		if (e4 !== 64) o += String.fromCharCode(c3);
	}
	return o;
}
var has_buf = /*#__PURE__*/ (function() {
	return typeof Buffer !== "undefined" && typeof process !== "undefined" && typeof process.versions !== "undefined" && !!process.versions.node;
})();
var Buffer_from = /*#__PURE__*/ (function() {
	if (typeof Buffer !== "undefined") {
		var nbfs = !Buffer.from;
		if (!nbfs) try {
			Buffer.from("foo", "utf8");
		} catch (e) {
			nbfs = true;
		}
		return nbfs ? function(buf, enc) {
			return enc ? new Buffer(buf, enc) : new Buffer(buf);
		} : Buffer.from.bind(Buffer);
	}
	return function() {};
})();
var buf_utf16le = /*#__PURE__*/ (function() {
	if (typeof Buffer === "undefined") return false;
	var x = Buffer_from([65, 0]);
	if (!x) return false;
	return x.toString("utf16le").length == 1;
})();
function new_raw_buf(len) {
	if (has_buf) return Buffer.alloc ? Buffer.alloc(len) : new Buffer(len);
	return typeof Uint8Array != "undefined" ? new Uint8Array(len) : new Array(len);
}
function new_unsafe_buf(len) {
	if (has_buf) return Buffer.allocUnsafe ? Buffer.allocUnsafe(len) : new Buffer(len);
	return typeof Uint8Array != "undefined" ? new Uint8Array(len) : new Array(len);
}
var s2a = function s2a(s) {
	if (has_buf) return Buffer_from(s, "binary");
	return s.split("").map(function(x) {
		return x.charCodeAt(0) & 255;
	});
};
function a2s(data) {
	if (Array.isArray(data)) return data.map(function(c) {
		return String.fromCharCode(c);
	}).join("");
	var o = [];
	for (var i = 0; i < data.length; ++i) o[i] = String.fromCharCode(data[i]);
	return o.join("");
}
function ab2a(data) {
	if (typeof ArrayBuffer == "undefined") throw new Error("Unsupported");
	if (data instanceof ArrayBuffer) return ab2a(new Uint8Array(data));
	var o = new Array(data.length);
	for (var i = 0; i < data.length; ++i) o[i] = data[i];
	return o;
}
var bconcat = has_buf ? function(bufs) {
	return Buffer.concat(bufs.map(function(buf) {
		return Buffer.isBuffer(buf) ? buf : Buffer_from(buf);
	}));
} : function(bufs) {
	if (typeof Uint8Array !== "undefined") {
		var i = 0, maxlen = 0;
		for (i = 0; i < bufs.length; ++i) maxlen += bufs[i].length;
		var o = new Uint8Array(maxlen);
		var len = 0;
		for (i = 0, maxlen = 0; i < bufs.length; maxlen += len, ++i) {
			len = bufs[i].length;
			if (bufs[i] instanceof Uint8Array) o.set(bufs[i], maxlen);
			else if (typeof bufs[i] == "string") o.set(new Uint8Array(s2a(bufs[i])), maxlen);
			else o.set(new Uint8Array(bufs[i]), maxlen);
		}
		return o;
	}
	return [].concat.apply([], bufs.map(function(buf) {
		return Array.isArray(buf) ? buf : [].slice.call(buf);
	}));
};
function utf8decode(content) {
	var out = [], widx = 0, L = content.length + 250;
	var o = new_raw_buf(content.length + 255);
	for (var ridx = 0; ridx < content.length; ++ridx) {
		var c = content.charCodeAt(ridx);
		if (c < 128) o[widx++] = c;
		else if (c < 2048) {
			o[widx++] = 192 | c >> 6 & 31;
			o[widx++] = 128 | c & 63;
		} else if (c >= 55296 && c < 57344) {
			c = (c & 1023) + 64;
			var d = content.charCodeAt(++ridx) & 1023;
			o[widx++] = 240 | c >> 8 & 7;
			o[widx++] = 128 | c >> 2 & 63;
			o[widx++] = 128 | d >> 6 & 15 | (c & 3) << 4;
			o[widx++] = 128 | d & 63;
		} else {
			o[widx++] = 224 | c >> 12 & 15;
			o[widx++] = 128 | c >> 6 & 63;
			o[widx++] = 128 | c & 63;
		}
		if (widx > L) {
			out.push(o.slice(0, widx));
			widx = 0;
			o = new_raw_buf(65535);
			L = 65530;
		}
	}
	out.push(o.slice(0, widx));
	return bconcat(out);
}
var chr0 = /\u0000/g;
var chr1 = /[\u0001-\u0006]/g;
function _strrev(x) {
	var o = "", i = x.length - 1;
	while (i >= 0) o += x.charAt(i--);
	return o;
}
function pad0(v, d) {
	var t = "" + v;
	return t.length >= d ? t : fill("0", d - t.length) + t;
}
function pad_(v, d) {
	var t = "" + v;
	return t.length >= d ? t : fill(" ", d - t.length) + t;
}
function rpad_(v, d) {
	var t = "" + v;
	return t.length >= d ? t : t + fill(" ", d - t.length);
}
function pad0r1(v, d) {
	var t = "" + Math.round(v);
	return t.length >= d ? t : fill("0", d - t.length) + t;
}
function pad0r2(v, d) {
	var t = "" + v;
	return t.length >= d ? t : fill("0", d - t.length) + t;
}
var p2_32 = /*#__PURE__*/ Math.pow(2, 32);
function pad0r(v, d) {
	if (v > p2_32 || v < -p2_32) return pad0r1(v, d);
	return pad0r2(Math.round(v), d);
}
function SSF_isgeneral(s, i) {
	i = i || 0;
	return s.length >= 7 + i && (s.charCodeAt(i) | 32) === 103 && (s.charCodeAt(i + 1) | 32) === 101 && (s.charCodeAt(i + 2) | 32) === 110 && (s.charCodeAt(i + 3) | 32) === 101 && (s.charCodeAt(i + 4) | 32) === 114 && (s.charCodeAt(i + 5) | 32) === 97 && (s.charCodeAt(i + 6) | 32) === 108;
}
var days = [
	["Sun", "Sunday"],
	["Mon", "Monday"],
	["Tue", "Tuesday"],
	["Wed", "Wednesday"],
	["Thu", "Thursday"],
	["Fri", "Friday"],
	["Sat", "Saturday"]
];
var months = [
	[
		"J",
		"Jan",
		"January"
	],
	[
		"F",
		"Feb",
		"February"
	],
	[
		"M",
		"Mar",
		"March"
	],
	[
		"A",
		"Apr",
		"April"
	],
	[
		"M",
		"May",
		"May"
	],
	[
		"J",
		"Jun",
		"June"
	],
	[
		"J",
		"Jul",
		"July"
	],
	[
		"A",
		"Aug",
		"August"
	],
	[
		"S",
		"Sep",
		"September"
	],
	[
		"O",
		"Oct",
		"October"
	],
	[
		"N",
		"Nov",
		"November"
	],
	[
		"D",
		"Dec",
		"December"
	]
];
function SSF_init_table(t) {
	if (!t) t = {};
	t[0] = "General";
	t[1] = "0";
	t[2] = "0.00";
	t[3] = "#,##0";
	t[4] = "#,##0.00";
	t[9] = "0%";
	t[10] = "0.00%";
	t[11] = "0.00E+00";
	t[12] = "# ?/?";
	t[13] = "# ??/??";
	t[14] = "m/d/yy";
	t[15] = "d-mmm-yy";
	t[16] = "d-mmm";
	t[17] = "mmm-yy";
	t[18] = "h:mm AM/PM";
	t[19] = "h:mm:ss AM/PM";
	t[20] = "h:mm";
	t[21] = "h:mm:ss";
	t[22] = "m/d/yy h:mm";
	t[37] = "#,##0 ;(#,##0)";
	t[38] = "#,##0 ;[Red](#,##0)";
	t[39] = "#,##0.00;(#,##0.00)";
	t[40] = "#,##0.00;[Red](#,##0.00)";
	t[45] = "mm:ss";
	t[46] = "[h]:mm:ss";
	t[47] = "mmss.0";
	t[48] = "##0.0E+0";
	t[49] = "@";
	t[56] = "\"上午/下午 \"hh\"時\"mm\"分\"ss\"秒 \"";
	return t;
}
var table_fmt = {
	0: "General",
	1: "0",
	2: "0.00",
	3: "#,##0",
	4: "#,##0.00",
	9: "0%",
	10: "0.00%",
	11: "0.00E+00",
	12: "# ?/?",
	13: "# ??/??",
	14: "m/d/yy",
	15: "d-mmm-yy",
	16: "d-mmm",
	17: "mmm-yy",
	18: "h:mm AM/PM",
	19: "h:mm:ss AM/PM",
	20: "h:mm",
	21: "h:mm:ss",
	22: "m/d/yy h:mm",
	37: "#,##0 ;(#,##0)",
	38: "#,##0 ;[Red](#,##0)",
	39: "#,##0.00;(#,##0.00)",
	40: "#,##0.00;[Red](#,##0.00)",
	45: "mm:ss",
	46: "[h]:mm:ss",
	47: "mmss.0",
	48: "##0.0E+0",
	49: "@",
	56: "\"上午/下午 \"hh\"時\"mm\"分\"ss\"秒 \""
};
var SSF_default_map = {
	5: 37,
	6: 38,
	7: 39,
	8: 40,
	23: 0,
	24: 0,
	25: 0,
	26: 0,
	27: 14,
	28: 14,
	29: 14,
	30: 14,
	31: 14,
	50: 14,
	51: 14,
	52: 14,
	53: 14,
	54: 14,
	55: 14,
	56: 14,
	57: 14,
	58: 14,
	59: 1,
	60: 2,
	61: 3,
	62: 4,
	67: 9,
	68: 10,
	69: 12,
	70: 13,
	71: 14,
	72: 14,
	73: 15,
	74: 16,
	75: 17,
	76: 20,
	77: 21,
	78: 22,
	79: 45,
	80: 46,
	81: 47,
	82: 0
};
var SSF_default_str = {
	5: "\"$\"#,##0_);\\(\"$\"#,##0\\)",
	63: "\"$\"#,##0_);\\(\"$\"#,##0\\)",
	6: "\"$\"#,##0_);[Red]\\(\"$\"#,##0\\)",
	64: "\"$\"#,##0_);[Red]\\(\"$\"#,##0\\)",
	7: "\"$\"#,##0.00_);\\(\"$\"#,##0.00\\)",
	65: "\"$\"#,##0.00_);\\(\"$\"#,##0.00\\)",
	8: "\"$\"#,##0.00_);[Red]\\(\"$\"#,##0.00\\)",
	66: "\"$\"#,##0.00_);[Red]\\(\"$\"#,##0.00\\)",
	41: "_(* #,##0_);_(* \\(#,##0\\);_(* \"-\"_);_(@_)",
	42: "_(\"$\"* #,##0_);_(\"$\"* \\(#,##0\\);_(\"$\"* \"-\"_);_(@_)",
	43: "_(* #,##0.00_);_(* \\(#,##0.00\\);_(* \"-\"??_);_(@_)",
	44: "_(\"$\"* #,##0.00_);_(\"$\"* \\(#,##0.00\\);_(\"$\"* \"-\"??_);_(@_)"
};
function SSF_frac(x, D, mixed) {
	var sgn = x < 0 ? -1 : 1;
	var B = x * sgn;
	var P_2 = 0, P_1 = 1, P = 0;
	var Q_2 = 1, Q_1 = 0, Q = 0;
	var A = Math.floor(B);
	while (Q_1 < D) {
		A = Math.floor(B);
		P = A * P_1 + P_2;
		Q = A * Q_1 + Q_2;
		if (B - A < 5e-8) break;
		B = 1 / (B - A);
		P_2 = P_1;
		P_1 = P;
		Q_2 = Q_1;
		Q_1 = Q;
	}
	if (Q > D) if (Q_1 > D) {
		Q = Q_2;
		P = P_2;
	} else {
		Q = Q_1;
		P = P_1;
	}
	if (!mixed) return [
		0,
		sgn * P,
		Q
	];
	var q = Math.floor(sgn * P / Q);
	return [
		q,
		sgn * P - q * Q,
		Q
	];
}
function SSF_normalize_xl_unsafe(v) {
	var s = v.toPrecision(16);
	if (s.indexOf("e") > -1) {
		var m = s.slice(0, s.indexOf("e"));
		m = m.indexOf(".") > -1 ? m.slice(0, m.slice(0, 2) == "0." ? 17 : 16) : m.slice(0, 15) + fill("0", m.length - 15);
		return m + s.slice(s.indexOf("e"));
	}
	var n = s.indexOf(".") > -1 ? s.slice(0, s.slice(0, 2) == "0." ? 17 : 16) : s.slice(0, 15) + fill("0", s.length - 15);
	return Number(n);
}
function SSF_parse_date_code(v, opts, b2) {
	if (v > 2958465 || v < 0) return null;
	v = SSF_normalize_xl_unsafe(v);
	var date = v | 0, time = Math.floor(86400 * (v - date)), dow = 0;
	var dout = [];
	var out = {
		D: date,
		T: time,
		u: 86400 * (v - date) - time,
		y: 0,
		m: 0,
		d: 0,
		H: 0,
		M: 0,
		S: 0,
		q: 0
	};
	if (Math.abs(out.u) < 1e-6) out.u = 0;
	if (opts && opts.date1904) date += 1462;
	if (out.u > .9999) {
		out.u = 0;
		if (++time == 86400) {
			out.T = time = 0;
			++date;
			++out.D;
		}
	}
	if (date === 60) {
		dout = b2 ? [
			1317,
			10,
			29
		] : [
			1900,
			2,
			29
		];
		dow = 3;
	} else if (date === 0) {
		dout = b2 ? [
			1317,
			8,
			29
		] : [
			1900,
			1,
			0
		];
		dow = 6;
	} else {
		if (date > 60) --date;
		var d = new Date(1900, 0, 1);
		d.setDate(d.getDate() + date - 1);
		dout = [
			d.getFullYear(),
			d.getMonth() + 1,
			d.getDate()
		];
		dow = d.getDay();
		if (date < 60) dow = (dow + 6) % 7;
		if (b2) dow = SSF_fix_hijri(d, dout);
	}
	out.y = dout[0];
	out.m = dout[1];
	out.d = dout[2];
	out.S = time % 60;
	time = Math.floor(time / 60);
	out.M = time % 60;
	time = Math.floor(time / 60);
	out.H = time;
	out.q = dow;
	return out;
}
function SSF_strip_decimal(o) {
	return o.indexOf(".") == -1 ? o : o.replace(/(?:\.0*|(\.\d*[1-9])0+)$/, "$1");
}
function SSF_normalize_exp(o) {
	if (o.indexOf("E") == -1) return o;
	return o.replace(/(?:\.0*|(\.\d*[1-9])0+)[Ee]/, "$1E").replace(/(E[+-])(\d)$/, "$10$2");
}
function SSF_small_exp(v) {
	var w = v < 0 ? 12 : 11;
	var o = SSF_strip_decimal(v.toFixed(12));
	if (o.length <= w) return o;
	o = v.toPrecision(10);
	if (o.length <= w) return o;
	return v.toExponential(5);
}
function SSF_large_exp(v) {
	var o = SSF_strip_decimal(v.toFixed(11));
	return o.length > (v < 0 ? 12 : 11) || o === "0" || o === "-0" ? v.toPrecision(6) : o;
}
function SSF_general_num(v) {
	if (!isFinite(v)) return isNaN(v) ? "#NUM!" : "#DIV/0!";
	var V = Math.floor(Math.log(Math.abs(v)) * Math.LOG10E), o;
	if (V >= -4 && V <= -1) o = v.toPrecision(10 + V);
	else if (Math.abs(V) <= 9) o = SSF_small_exp(v);
	else if (V === 10) o = v.toFixed(10).substr(0, 12);
	else o = SSF_large_exp(v);
	return SSF_strip_decimal(SSF_normalize_exp(o.toUpperCase()));
}
function SSF_general(v, opts) {
	switch (typeof v) {
		case "string": return v;
		case "boolean": return v ? "TRUE" : "FALSE";
		case "number": return (v | 0) === v ? v.toString(10) : SSF_general_num(v);
		case "undefined": return "";
		case "object":
			if (v == null) return "";
			if (v instanceof Date) return SSF_format(14, datenum(v, opts && opts.date1904), opts);
	}
	throw new Error("unsupported value in General format: " + v);
}
function SSF_fix_hijri(date, o) {
	o[0] -= 581;
	var dow = date.getDay();
	if (date < 60) dow = (dow + 6) % 7;
	return dow;
}
function SSF_write_date(type, fmt, val, ss0) {
	var o = "", ss = 0, tt = 0, y = val.y, out, outl = 0;
	switch (type) {
		case 98: y = val.y + 543;
		case 121:
			switch (fmt.length) {
				case 1:
				case 2:
					out = y % 100;
					outl = 2;
					break;
				default:
					out = y % 1e4;
					outl = 4;
			}
			break;
		case 109:
			switch (fmt.length) {
				case 1:
				case 2:
					out = val.m;
					outl = fmt.length;
					break;
				case 3: return months[val.m - 1][1];
				case 5: return months[val.m - 1][0];
				default: return months[val.m - 1][2];
			}
			break;
		case 100:
			switch (fmt.length) {
				case 1:
				case 2:
					out = val.d;
					outl = fmt.length;
					break;
				case 3: return days[val.q][0];
				default: return days[val.q][1];
			}
			break;
		case 104:
			switch (fmt.length) {
				case 1:
				case 2:
					out = 1 + (val.H + 11) % 12;
					outl = fmt.length;
					break;
				default: throw "bad hour format: " + fmt;
			}
			break;
		case 72:
			switch (fmt.length) {
				case 1:
				case 2:
					out = val.H;
					outl = fmt.length;
					break;
				default: throw "bad hour format: " + fmt;
			}
			break;
		case 77:
			switch (fmt.length) {
				case 1:
				case 2:
					out = val.M;
					outl = fmt.length;
					break;
				default: throw "bad minute format: " + fmt;
			}
			break;
		case 115:
			if (fmt != "s" && fmt != "ss" && fmt != ".0" && fmt != ".00" && fmt != ".000") throw "bad second format: " + fmt;
			if (val.u === 0 && (fmt == "s" || fmt == "ss")) return pad0(val.S, fmt.length);
			if (ss0 >= 2) tt = ss0 === 3 ? 1e3 : 100;
			else tt = ss0 === 1 ? 10 : 1;
			ss = Math.round(tt * (val.S + val.u));
			if (ss >= 60 * tt) ss = 0;
			if (fmt === "s") return ss === 0 ? "0" : "" + ss / tt;
			o = pad0(ss, 2 + ss0);
			if (fmt === "ss") return o.substr(0, 2);
			return "." + o.substr(2, fmt.length - 1);
		case 90:
			switch (fmt) {
				case "[h]":
				case "[hh]":
					out = val.D * 24 + val.H;
					break;
				case "[m]":
				case "[mm]":
					out = (val.D * 24 + val.H) * 60 + val.M;
					break;
				case "[s]":
				case "[ss]":
					out = ((val.D * 24 + val.H) * 60 + val.M) * 60 + (ss0 == 0 ? Math.round(val.S + val.u) : val.S);
					break;
				default: throw "bad abstime format: " + fmt;
			}
			outl = fmt.length === 3 ? 1 : 2;
			break;
		case 101:
			out = y;
			outl = 1;
	}
	return outl > 0 ? pad0(out, outl) : "";
}
function commaify(s) {
	var w = 3;
	if (s.length <= w) return s;
	var j = s.length % w, o = s.substr(0, j);
	for (; j != s.length; j += w) o += (o.length > 0 ? "," : "") + s.substr(j, w);
	return o;
}
var pct1 = /%/g;
function write_num_pct(type, fmt, val) {
	var sfmt = fmt.replace(pct1, ""), mul = fmt.length - sfmt.length;
	return write_num(type, sfmt, val * Math.pow(10, 2 * mul)) + fill("%", mul);
}
function write_num_cm(type, fmt, val) {
	var idx = fmt.length - 1;
	while (fmt.charCodeAt(idx - 1) === 44) --idx;
	return write_num(type, fmt.substr(0, idx), val / Math.pow(10, 3 * (fmt.length - idx)));
}
function write_num_exp(fmt, val) {
	var o;
	var idx = fmt.indexOf("E") - fmt.indexOf(".") - 1;
	if (fmt.match(/^#+0.0E\+0$/)) {
		if (val == 0) return "0.0E+0";
		else if (val < 0) return "-" + write_num_exp(fmt, -val);
		var period = fmt.indexOf(".");
		if (period === -1) period = fmt.indexOf("E");
		var ee = Math.floor(Math.log(val) * Math.LOG10E) % period;
		if (ee < 0) ee += period;
		o = (val / Math.pow(10, ee)).toPrecision(idx + 1 + (period + ee) % period);
		if (o.indexOf("e") === -1) {
			var fakee = Math.floor(Math.log(val) * Math.LOG10E);
			if (o.indexOf(".") === -1) o = o.charAt(0) + "." + o.substr(1) + "E+" + (fakee - o.length + ee);
			else o += "E+" + (fakee - ee);
			while (o.substr(0, 2) === "0.") {
				o = o.charAt(0) + o.substr(2, period) + "." + o.substr(2 + period);
				o = o.replace(/^0+([1-9])/, "$1").replace(/^0+\./, "0.");
			}
			o = o.replace(/\+-/, "-");
		}
		o = o.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/, function($$, $1, $2, $3) {
			return $1 + $2 + $3.substr(0, (period + ee) % period) + "." + $3.substr(ee) + "E";
		});
	} else o = val.toExponential(idx);
	if (fmt.match(/E\+00$/) && o.match(/e[+-]\d$/)) o = o.substr(0, o.length - 1) + "0" + o.charAt(o.length - 1);
	if (fmt.match(/E\-/) && o.match(/e\+/)) o = o.replace(/e\+/, "e");
	return o.replace("e", "E");
}
var frac1 = /# (\?+)( ?)\/( ?)(\d+)/;
function write_num_f1(r, aval, sign) {
	var den = parseInt(r[4], 10), rr = Math.round(aval * den), base = Math.floor(rr / den);
	var myn = rr - base * den, myd = den;
	return sign + (base === 0 ? "" : "" + base) + " " + (myn === 0 ? fill(" ", r[1].length + 1 + r[4].length) : pad_(myn, r[1].length) + r[2] + "/" + r[3] + pad0(myd, r[4].length));
}
function write_num_f2(r, aval, sign) {
	return sign + (aval === 0 ? "" : "" + aval) + fill(" ", r[1].length + 2 + r[4].length);
}
var dec1 = /^#*0*\.([0#]+)/;
var closeparen = /\)[^)]*[0#]/;
var phone = /\(###\) ###\\?-####/;
function hashq(str) {
	var o = "", cc;
	for (var i = 0; i != str.length; ++i) switch (cc = str.charCodeAt(i)) {
		case 35: break;
		case 63:
			o += " ";
			break;
		case 48:
			o += "0";
			break;
		default: o += String.fromCharCode(cc);
	}
	return o;
}
function rnd(val, d) {
	var sgn = val < 0 ? -1 : 1;
	var dd = Math.pow(10, d);
	return "" + sgn * (Math.round(sgn * val * dd) / dd);
}
function dec(val, d) {
	var _frac = val - Math.floor(val), dd = Math.pow(10, d);
	if (d < ("" + Math.round(_frac * dd)).length) return 0;
	return Math.round(_frac * dd);
}
function carry(val, d) {
	if (d < ("" + Math.round((val - Math.floor(val)) * Math.pow(10, d))).length) return 1;
	return 0;
}
function flr(val) {
	if (val < 2147483647 && val > -2147483648) return "" + (val >= 0 ? val | 0 : val - 1 | 0);
	return "" + Math.floor(val);
}
function write_num_flt(type, fmt, val) {
	if (type.charCodeAt(0) === 40 && !fmt.match(closeparen)) {
		var ffmt = fmt.replace(/\( */, "").replace(/ \)/, "").replace(/\)/, "");
		if (val >= 0) return write_num_flt("n", ffmt, val);
		return "(" + write_num_flt("n", ffmt, -val) + ")";
	}
	if (fmt.charCodeAt(fmt.length - 1) === 44) return write_num_cm(type, fmt, val);
	if (fmt.indexOf("%") !== -1) return write_num_pct(type, fmt, val);
	if (fmt.indexOf("E") !== -1) return write_num_exp(fmt, val);
	if (fmt.charCodeAt(0) === 36) return "$" + write_num_flt(type, fmt.substr(fmt.charAt(1) == " " ? 2 : 1), val);
	var o;
	var r, ri, ff, aval = Math.abs(val), sign = val < 0 ? "-" : "";
	if (fmt.match(/^00+$/)) return sign + pad0r(aval, fmt.length);
	if (fmt.match(/^[#?]+$/)) {
		o = pad0r(val, 0);
		if (o === "0") o = "";
		return o.length > fmt.length ? o : hashq(fmt.substr(0, fmt.length - o.length)) + o;
	}
	if (r = fmt.match(frac1)) return write_num_f1(r, aval, sign);
	if (fmt.match(/^#+0+$/)) return sign + pad0r(aval, fmt.length - fmt.indexOf("0"));
	if (r = fmt.match(dec1)) {
		o = rnd(val, r[1].length).replace(/^([^\.]+)$/, "$1." + hashq(r[1])).replace(/\.$/, "." + hashq(r[1])).replace(/\.(\d*)$/, function($$, $1) {
			return "." + $1 + fill("0", hashq(r[1]).length - $1.length);
		});
		return fmt.indexOf("0.") !== -1 ? o : o.replace(/^0\./, ".");
	}
	fmt = fmt.replace(/^#+([0.])/, "$1");
	if (r = fmt.match(/^(0*)\.(#*)$/)) return sign + rnd(aval, r[2].length).replace(/\.(\d*[1-9])0*$/, ".$1").replace(/^(-?\d*)$/, "$1.").replace(/^0\./, r[1].length ? "0." : ".");
	if (r = fmt.match(/^#{1,3},##0(\.?)$/)) return sign + commaify(pad0r(aval, 0));
	if (r = fmt.match(/^#,##0\.([#0]*0)$/)) return val < 0 ? "-" + write_num_flt(type, fmt, -val) : commaify("" + (Math.floor(val) + carry(val, r[1].length))) + "." + pad0(dec(val, r[1].length), r[1].length);
	if (r = fmt.match(/^#,#*,#0/)) return write_num_flt(type, fmt.replace(/^#,#*,/, ""), val);
	if (r = fmt.match(/^([0#]+)(\\?-([0#]+))+$/)) {
		o = _strrev(write_num_flt(type, fmt.replace(/[\\-]/g, ""), val));
		ri = 0;
		return _strrev(_strrev(fmt.replace(/\\/g, "")).replace(/[0#]/g, function(x) {
			return ri < o.length ? o.charAt(ri++) : x === "0" ? "0" : "";
		}));
	}
	if (fmt.match(phone)) {
		o = write_num_flt(type, "##########", val);
		return "(" + o.substr(0, 3) + ") " + o.substr(3, 3) + "-" + o.substr(6);
	}
	var oa = "";
	if (r = fmt.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/)) {
		ri = Math.min(r[4].length, 7);
		ff = SSF_frac(aval, Math.pow(10, ri) - 1, false);
		o = "" + sign;
		oa = write_num("n", r[1], ff[1]);
		if (oa.charAt(oa.length - 1) == " ") oa = oa.substr(0, oa.length - 1) + "0";
		o += oa + r[2] + "/" + r[3];
		oa = rpad_(ff[2], ri);
		if (oa.length < r[4].length) oa = hashq(r[4].substr(r[4].length - oa.length)) + oa;
		o += oa;
		return o;
	}
	if (r = fmt.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/)) {
		ri = Math.min(Math.max(r[1].length, r[4].length), 7);
		ff = SSF_frac(aval, Math.pow(10, ri) - 1, true);
		return sign + (ff[0] || (ff[1] ? "" : "0")) + " " + (ff[1] ? pad_(ff[1], ri) + r[2] + "/" + r[3] + rpad_(ff[2], ri) : fill(" ", 2 * ri + 1 + r[2].length + r[3].length));
	}
	if (r = fmt.match(/^[#0?]+$/)) {
		o = pad0r(val, 0);
		if (fmt.length <= o.length) return o;
		return hashq(fmt.substr(0, fmt.length - o.length)) + o;
	}
	if (r = fmt.match(/^([#0?]+)\.([#0]+)$/)) {
		o = "" + val.toFixed(Math.min(r[2].length, 10)).replace(/([^0])0+$/, "$1");
		ri = o.indexOf(".");
		var lres = fmt.indexOf(".") - ri, rres = fmt.length - o.length - lres;
		return hashq(fmt.substr(0, lres) + o + fmt.substr(fmt.length - rres));
	}
	if (r = fmt.match(/^00,000\.([#0]*0)$/)) {
		ri = dec(val, r[1].length);
		return val < 0 ? "-" + write_num_flt(type, fmt, -val) : commaify(flr(val)).replace(/^\d,\d{3}$/, "0$&").replace(/^\d*$/, function($$) {
			return "00," + ($$.length < 3 ? pad0(0, 3 - $$.length) : "") + $$;
		}) + "." + pad0(ri, r[1].length);
	}
	switch (fmt) {
		case "###,##0.00": return write_num_flt(type, "#,##0.00", val);
		case "###,###":
		case "##,###":
		case "#,###":
			var x = commaify(pad0r(aval, 0));
			return x !== "0" ? sign + x : "";
		case "###,###.00": return write_num_flt(type, "###,##0.00", val).replace(/^0\./, ".");
		case "#,###.00": return write_num_flt(type, "#,##0.00", val).replace(/^0\./, ".");
	}
	throw new Error("unsupported format |" + fmt + "|");
}
function write_num_cm2(type, fmt, val) {
	var idx = fmt.length - 1;
	while (fmt.charCodeAt(idx - 1) === 44) --idx;
	return write_num(type, fmt.substr(0, idx), val / Math.pow(10, 3 * (fmt.length - idx)));
}
function write_num_pct2(type, fmt, val) {
	var sfmt = fmt.replace(pct1, ""), mul = fmt.length - sfmt.length;
	return write_num(type, sfmt, val * Math.pow(10, 2 * mul)) + fill("%", mul);
}
function write_num_exp2(fmt, val) {
	var o;
	var idx = fmt.indexOf("E") - fmt.indexOf(".") - 1;
	if (fmt.match(/^#+0.0E\+0$/)) {
		if (val == 0) return "0.0E+0";
		else if (val < 0) return "-" + write_num_exp2(fmt, -val);
		var period = fmt.indexOf(".");
		if (period === -1) period = fmt.indexOf("E");
		var ee = Math.floor(Math.log(val) * Math.LOG10E) % period;
		if (ee < 0) ee += period;
		o = (val / Math.pow(10, ee)).toPrecision(idx + 1 + (period + ee) % period);
		if (!o.match(/[Ee]/)) {
			var fakee = Math.floor(Math.log(val) * Math.LOG10E);
			if (o.indexOf(".") === -1) o = o.charAt(0) + "." + o.substr(1) + "E+" + (fakee - o.length + ee);
			else o += "E+" + (fakee - ee);
			o = o.replace(/\+-/, "-");
		}
		o = o.replace(/^([+-]?)(\d*)\.(\d*)[Ee]/, function($$, $1, $2, $3) {
			return $1 + $2 + $3.substr(0, (period + ee) % period) + "." + $3.substr(ee) + "E";
		});
	} else o = val.toExponential(idx);
	if (fmt.match(/E\+00$/) && o.match(/e[+-]\d$/)) o = o.substr(0, o.length - 1) + "0" + o.charAt(o.length - 1);
	if (fmt.match(/E\-/) && o.match(/e\+/)) o = o.replace(/e\+/, "e");
	return o.replace("e", "E");
}
function write_num_int(type, fmt, val) {
	if (type.charCodeAt(0) === 40 && !fmt.match(closeparen)) {
		var ffmt = fmt.replace(/\( */, "").replace(/ \)/, "").replace(/\)/, "");
		if (val >= 0) return write_num_int("n", ffmt, val);
		return "(" + write_num_int("n", ffmt, -val) + ")";
	}
	if (fmt.charCodeAt(fmt.length - 1) === 44) return write_num_cm2(type, fmt, val);
	if (fmt.indexOf("%") !== -1) return write_num_pct2(type, fmt, val);
	if (fmt.indexOf("E") !== -1) return write_num_exp2(fmt, val);
	if (fmt.charCodeAt(0) === 36) return "$" + write_num_int(type, fmt.substr(fmt.charAt(1) == " " ? 2 : 1), val);
	var o;
	var r, ri, ff, aval = Math.abs(val), sign = val < 0 ? "-" : "";
	if (fmt.match(/^00+$/)) return sign + pad0(aval, fmt.length);
	if (fmt.match(/^[#?]+$/)) {
		o = "" + val;
		if (val === 0) o = "";
		return o.length > fmt.length ? o : hashq(fmt.substr(0, fmt.length - o.length)) + o;
	}
	if (r = fmt.match(frac1)) return write_num_f2(r, aval, sign);
	if (fmt.match(/^#+0+$/)) return sign + pad0(aval, fmt.length - fmt.indexOf("0"));
	if (r = fmt.match(dec1)) {
		o = ("" + val).replace(/^([^\.]+)$/, "$1." + hashq(r[1])).replace(/\.$/, "." + hashq(r[1]));
		o = o.replace(/\.(\d*)$/, function($$, $1) {
			return "." + $1 + fill("0", hashq(r[1]).length - $1.length);
		});
		return fmt.indexOf("0.") !== -1 ? o : o.replace(/^0\./, ".");
	}
	fmt = fmt.replace(/^#+([0.])/, "$1");
	if (r = fmt.match(/^(0*)\.(#*)$/)) return sign + ("" + aval).replace(/\.(\d*[1-9])0*$/, ".$1").replace(/^(-?\d*)$/, "$1.").replace(/^0\./, r[1].length ? "0." : ".");
	if (r = fmt.match(/^#{1,3},##0(\.?)$/)) return sign + commaify("" + aval);
	if (r = fmt.match(/^#,##0\.([#0]*0)$/)) return val < 0 ? "-" + write_num_int(type, fmt, -val) : commaify("" + val) + "." + fill("0", r[1].length);
	if (r = fmt.match(/^#,#*,#0/)) return write_num_int(type, fmt.replace(/^#,#*,/, ""), val);
	if (r = fmt.match(/^([0#]+)(\\?-([0#]+))+$/)) {
		o = _strrev(write_num_int(type, fmt.replace(/[\\-]/g, ""), val));
		ri = 0;
		return _strrev(_strrev(fmt.replace(/\\/g, "")).replace(/[0#]/g, function(x) {
			return ri < o.length ? o.charAt(ri++) : x === "0" ? "0" : "";
		}));
	}
	if (fmt.match(phone)) {
		o = write_num_int(type, "##########", val);
		return "(" + o.substr(0, 3) + ") " + o.substr(3, 3) + "-" + o.substr(6);
	}
	var oa = "";
	if (r = fmt.match(/^([#0?]+)( ?)\/( ?)([#0?]+)/)) {
		ri = Math.min(r[4].length, 7);
		ff = SSF_frac(aval, Math.pow(10, ri) - 1, false);
		o = "" + sign;
		oa = write_num("n", r[1], ff[1]);
		if (oa.charAt(oa.length - 1) == " ") oa = oa.substr(0, oa.length - 1) + "0";
		o += oa + r[2] + "/" + r[3];
		oa = rpad_(ff[2], ri);
		if (oa.length < r[4].length) oa = hashq(r[4].substr(r[4].length - oa.length)) + oa;
		o += oa;
		return o;
	}
	if (r = fmt.match(/^# ([#0?]+)( ?)\/( ?)([#0?]+)/)) {
		ri = Math.min(Math.max(r[1].length, r[4].length), 7);
		ff = SSF_frac(aval, Math.pow(10, ri) - 1, true);
		return sign + (ff[0] || (ff[1] ? "" : "0")) + " " + (ff[1] ? pad_(ff[1], ri) + r[2] + "/" + r[3] + rpad_(ff[2], ri) : fill(" ", 2 * ri + 1 + r[2].length + r[3].length));
	}
	if (r = fmt.match(/^[#0?]+$/)) {
		o = "" + val;
		if (fmt.length <= o.length) return o;
		return hashq(fmt.substr(0, fmt.length - o.length)) + o;
	}
	if (r = fmt.match(/^([#0]+)\.([#0]+)$/)) {
		o = "" + val.toFixed(Math.min(r[2].length, 10)).replace(/([^0])0+$/, "$1");
		ri = o.indexOf(".");
		var lres = fmt.indexOf(".") - ri, rres = fmt.length - o.length - lres;
		return hashq(fmt.substr(0, lres) + o + fmt.substr(fmt.length - rres));
	}
	if (r = fmt.match(/^00,000\.([#0]*0)$/)) return val < 0 ? "-" + write_num_int(type, fmt, -val) : commaify("" + val).replace(/^\d,\d{3}$/, "0$&").replace(/^\d*$/, function($$) {
		return "00," + ($$.length < 3 ? pad0(0, 3 - $$.length) : "") + $$;
	}) + "." + pad0(0, r[1].length);
	switch (fmt) {
		case "###,###":
		case "##,###":
		case "#,###":
			var x = commaify("" + aval);
			return x !== "0" ? sign + x : "";
		default: if (fmt.match(/\.[0#?]*$/)) return write_num_int(type, fmt.slice(0, fmt.lastIndexOf(".")), val) + hashq(fmt.slice(fmt.lastIndexOf(".")));
	}
	throw new Error("unsupported format |" + fmt + "|");
}
function write_num(type, fmt, val) {
	return (val | 0) === val ? write_num_int(type, fmt, val) : write_num_flt(type, fmt, val);
}
function SSF_split_fmt(fmt) {
	var out = [];
	var in_str = false;
	for (var i = 0, j = 0; i < fmt.length; ++i) switch (fmt.charCodeAt(i)) {
		case 34:
			in_str = !in_str;
			break;
		case 95:
		case 42:
		case 92:
			++i;
			break;
		case 59:
			out[out.length] = fmt.substr(j, i - j);
			j = i + 1;
	}
	out[out.length] = fmt.substr(j);
	if (in_str === true) throw new Error("Format |" + fmt + "| unterminated string ");
	return out;
}
var SSF_abstime = /\[[HhMmSs\u0E0A\u0E19\u0E17]*\]/;
function fmt_is_date(fmt) {
	var i = 0, c = "", o = "";
	while (i < fmt.length) switch (c = fmt.charAt(i)) {
		case "G":
			if (SSF_isgeneral(fmt, i)) i += 6;
			i++;
			break;
		case "\"":
			for (; fmt.charCodeAt(++i) !== 34 && i < fmt.length;);
			++i;
			break;
		case "\\":
			i += 2;
			break;
		case "_":
			i += 2;
			break;
		case "@":
			++i;
			break;
		case "B":
		case "b": if (fmt.charAt(i + 1) === "1" || fmt.charAt(i + 1) === "2") return true;
		case "M":
		case "D":
		case "Y":
		case "H":
		case "S":
		case "E":
		case "m":
		case "d":
		case "y":
		case "h":
		case "s":
		case "e":
		case "g": return true;
		case "A":
		case "a":
		case "上":
			if (fmt.substr(i, 3).toUpperCase() === "A/P") return true;
			if (fmt.substr(i, 5).toUpperCase() === "AM/PM") return true;
			if (fmt.substr(i, 5).toUpperCase() === "上午/下午") return true;
			++i;
			break;
		case "[":
			o = c;
			while (fmt.charAt(i++) !== "]" && i < fmt.length) o += fmt.charAt(i);
			if (o.match(SSF_abstime)) return true;
			break;
		case ".":
		case "0":
		case "#":
			while (i < fmt.length && ("0#?.,E+-%".indexOf(c = fmt.charAt(++i)) > -1 || c == "\\" && fmt.charAt(i + 1) == "-" && "0#".indexOf(fmt.charAt(i + 2)) > -1));
			break;
		case "?":
			while (fmt.charAt(++i) === c);
			break;
		case "*":
			++i;
			if (fmt.charAt(i) == " " || fmt.charAt(i) == "*") ++i;
			break;
		case "(":
		case ")":
			++i;
			break;
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
		case "6":
		case "7":
		case "8":
		case "9":
			while (i < fmt.length && "0123456789".indexOf(fmt.charAt(++i)) > -1);
			break;
		case " ":
			++i;
			break;
		default: ++i;
	}
	return false;
}
function eval_fmt(fmt, v, opts, flen) {
	var out = [], o = "", i = 0, c = "", lst = "t", dt, j, cc;
	var hr = "H";
	while (i < fmt.length) switch (c = fmt.charAt(i)) {
		case "G":
			if (!SSF_isgeneral(fmt, i)) throw new Error("unrecognized character " + c + " in " + fmt);
			out[out.length] = {
				t: "G",
				v: "General"
			};
			i += 7;
			break;
		case "\"":
			for (o = ""; (cc = fmt.charCodeAt(++i)) !== 34 && i < fmt.length;) o += String.fromCharCode(cc);
			out[out.length] = {
				t: "t",
				v: o
			};
			++i;
			break;
		case "\\":
			var w = fmt.charAt(++i), t = w === "(" || w === ")" ? w : "t";
			out[out.length] = {
				t,
				v: w
			};
			++i;
			break;
		case "_":
			out[out.length] = {
				t: "t",
				v: " "
			};
			i += 2;
			break;
		case "@":
			out[out.length] = {
				t: "T",
				v
			};
			++i;
			break;
		case "B":
		case "b": if (fmt.charAt(i + 1) === "1" || fmt.charAt(i + 1) === "2") {
			if (dt == null) {
				dt = SSF_parse_date_code(v, opts, fmt.charAt(i + 1) === "2");
				if (dt == null) return "";
			}
			out[out.length] = {
				t: "X",
				v: fmt.substr(i, 2)
			};
			lst = c;
			i += 2;
			break;
		}
		case "M":
		case "D":
		case "Y":
		case "H":
		case "S":
		case "E": c = c.toLowerCase();
		case "m":
		case "d":
		case "y":
		case "h":
		case "s":
		case "e":
		case "g":
			if (v < 0) return "";
			if (dt == null) {
				dt = SSF_parse_date_code(v, opts);
				if (dt == null) return "";
			}
			o = c;
			while (++i < fmt.length && fmt.charAt(i).toLowerCase() === c) o += c;
			if (c === "m" && lst.toLowerCase() === "h") c = "M";
			if (c === "h") c = hr;
			out[out.length] = {
				t: c,
				v: o
			};
			lst = c;
			break;
		case "A":
		case "a":
		case "上":
			var q = {
				t: c,
				v: c
			};
			if (dt == null) dt = SSF_parse_date_code(v, opts);
			if (fmt.substr(i, 3).toUpperCase() === "A/P") {
				if (dt != null) q.v = dt.H >= 12 ? fmt.charAt(i + 2) : c;
				q.t = "T";
				hr = "h";
				i += 3;
			} else if (fmt.substr(i, 5).toUpperCase() === "AM/PM") {
				if (dt != null) q.v = dt.H >= 12 ? "PM" : "AM";
				q.t = "T";
				i += 5;
				hr = "h";
			} else if (fmt.substr(i, 5).toUpperCase() === "上午/下午") {
				if (dt != null) q.v = dt.H >= 12 ? "下午" : "上午";
				q.t = "T";
				i += 5;
				hr = "h";
			} else {
				q.t = "t";
				++i;
			}
			if (dt == null && q.t === "T") return "";
			out[out.length] = q;
			lst = c;
			break;
		case "[":
			o = c;
			while (fmt.charAt(i++) !== "]" && i < fmt.length) o += fmt.charAt(i);
			if (o.slice(-1) !== "]") throw "unterminated \"[\" block: |" + o + "|";
			if (o.match(SSF_abstime)) {
				if (dt == null) {
					dt = SSF_parse_date_code(v, opts);
					if (dt == null) return "";
				}
				out[out.length] = {
					t: "Z",
					v: o.toLowerCase()
				};
				lst = o.charAt(1);
			} else if (o.indexOf("$") > -1) {
				o = (o.match(/\$([^-\[\]]*)/) || [])[1] || "$";
				if (!fmt_is_date(fmt)) out[out.length] = {
					t: "t",
					v: o
				};
			}
			break;
		case ".": if (dt != null) {
			o = c;
			while (++i < fmt.length && (c = fmt.charAt(i)) === "0") o += c;
			out[out.length] = {
				t: "s",
				v: o
			};
			break;
		}
		case "0":
		case "#":
			o = c;
			while (++i < fmt.length && "0#?.,E+-%".indexOf(c = fmt.charAt(i)) > -1) o += c;
			out[out.length] = {
				t: "n",
				v: o
			};
			break;
		case "?":
			o = c;
			while (fmt.charAt(++i) === c) o += c;
			out[out.length] = {
				t: c,
				v: o
			};
			lst = c;
			break;
		case "*":
			++i;
			if (fmt.charAt(i) == " " || fmt.charAt(i) == "*") ++i;
			break;
		case "(":
		case ")":
			out[out.length] = {
				t: flen === 1 ? "t" : c,
				v: c
			};
			++i;
			break;
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
		case "6":
		case "7":
		case "8":
		case "9":
			o = c;
			while (i < fmt.length && "0123456789".indexOf(fmt.charAt(++i)) > -1) o += fmt.charAt(i);
			out[out.length] = {
				t: "D",
				v: o
			};
			break;
		case " ":
			out[out.length] = {
				t: c,
				v: c
			};
			++i;
			break;
		case "$":
			out[out.length] = {
				t: "t",
				v: "$"
			};
			++i;
			break;
		default:
			if (",$-+/():!^&'~{}<>=€acfijklopqrtuvwxzP".indexOf(c) === -1) throw new Error("unrecognized character " + c + " in " + fmt);
			out[out.length] = {
				t: "t",
				v: c
			};
			++i;
	}
	var bt = 0, ss0 = 0, ssm;
	for (i = out.length - 1, lst = "t"; i >= 0; --i) switch (out[i].t) {
		case "h":
		case "H":
			out[i].t = hr;
			lst = "h";
			if (bt < 1) bt = 1;
			break;
		case "s":
			if (ssm = out[i].v.match(/\.0+$/)) {
				ss0 = Math.max(ss0, ssm[0].length - 1);
				bt = 4;
			}
			if (bt < 3) bt = 3;
		case "d":
		case "y":
		case "e":
			lst = out[i].t;
			break;
		case "M":
			lst = out[i].t;
			if (bt < 2) bt = 2;
			break;
		case "m":
			if (lst === "s") {
				out[i].t = "M";
				if (bt < 2) bt = 2;
			}
			break;
		case "X": break;
		case "Z":
			if (bt < 1 && out[i].v.match(/[Hh]/)) bt = 1;
			if (bt < 2 && out[i].v.match(/[Mm]/)) bt = 2;
			if (bt < 3 && out[i].v.match(/[Ss]/)) bt = 3;
	}
	var _dt;
	switch (bt) {
		case 0: break;
		case 1:
		case 2:
		case 3:
			if (dt.u >= .5) {
				dt.u = 0;
				++dt.S;
			}
			if (dt.S >= 60) {
				dt.S = 0;
				++dt.M;
			}
			if (dt.M >= 60) {
				dt.M = 0;
				++dt.H;
			}
			if (dt.H >= 24) {
				dt.H = 0;
				++dt.D;
				_dt = SSF_parse_date_code(dt.D);
				_dt.u = dt.u;
				_dt.S = dt.S;
				_dt.M = dt.M;
				_dt.H = dt.H;
				dt = _dt;
			}
			break;
		case 4:
			switch (ss0) {
				case 1:
					dt.u = Math.round(dt.u * 10) / 10;
					break;
				case 2:
					dt.u = Math.round(dt.u * 100) / 100;
					break;
				case 3: dt.u = Math.round(dt.u * 1e3) / 1e3;
			}
			if (dt.u >= 1) {
				dt.u = 0;
				++dt.S;
			}
			if (dt.S >= 60) {
				dt.S = 0;
				++dt.M;
			}
			if (dt.M >= 60) {
				dt.M = 0;
				++dt.H;
			}
			if (dt.H >= 24) {
				dt.H = 0;
				++dt.D;
				_dt = SSF_parse_date_code(dt.D);
				_dt.u = dt.u;
				_dt.S = dt.S;
				_dt.M = dt.M;
				_dt.H = dt.H;
				dt = _dt;
			}
	}
	var nstr = "", jj;
	for (i = 0; i < out.length; ++i) switch (out[i].t) {
		case "t":
		case "T":
		case " ":
		case "D": break;
		case "X":
			out[i].v = "";
			out[i].t = ";";
			break;
		case "d":
		case "m":
		case "y":
		case "h":
		case "H":
		case "M":
		case "s":
		case "e":
		case "b":
		case "Z":
			out[i].v = SSF_write_date(out[i].t.charCodeAt(0), out[i].v, dt, ss0);
			out[i].t = "t";
			break;
		case "n":
		case "?":
			jj = i + 1;
			while (out[jj] != null && ((c = out[jj].t) === "?" || c === "D" || (c === " " || c === "t") && out[jj + 1] != null && (out[jj + 1].t === "?" || out[jj + 1].t === "t" && out[jj + 1].v === "/") || out[i].t === "(" && (c === " " || c === "n" || c === ")") || c === "t" && (out[jj].v === "/" || out[jj].v === " " && out[jj + 1] != null && out[jj + 1].t == "?"))) {
				out[i].v += out[jj].v;
				out[jj] = {
					v: "",
					t: ";"
				};
				++jj;
			}
			nstr += out[i].v;
			i = jj - 1;
			break;
		case "G":
			out[i].t = "t";
			out[i].v = SSF_general(v, opts);
	}
	var vv = "", myv, ostr;
	if (nstr.length > 0) {
		if (nstr.charCodeAt(0) == 40) {
			myv = v < 0 && nstr.charCodeAt(0) === 45 ? -v : v;
			ostr = write_num("n", nstr, myv);
		} else {
			myv = v < 0 && flen > 1 ? -v : v;
			ostr = write_num("n", nstr, myv);
			if (myv < 0 && out[0] && out[0].t == "t") {
				ostr = ostr.substr(1);
				out[0].v = "-" + out[0].v;
			}
		}
		jj = ostr.length - 1;
		var decpt = out.length;
		for (i = 0; i < out.length; ++i) if (out[i] != null && out[i].t != "t" && out[i].v.indexOf(".") > -1) {
			decpt = i;
			break;
		}
		var lasti = out.length;
		if (decpt === out.length && ostr.indexOf("E") === -1) {
			for (i = out.length - 1; i >= 0; --i) {
				if (out[i] == null || "n?".indexOf(out[i].t) === -1) continue;
				if (jj >= out[i].v.length - 1) {
					jj -= out[i].v.length;
					out[i].v = ostr.substr(jj + 1, out[i].v.length);
				} else if (jj < 0) out[i].v = "";
				else {
					out[i].v = ostr.substr(0, jj + 1);
					jj = -1;
				}
				out[i].t = "t";
				lasti = i;
			}
			if (jj >= 0 && lasti < out.length) out[lasti].v = ostr.substr(0, jj + 1) + out[lasti].v;
		} else if (decpt !== out.length && ostr.indexOf("E") === -1) {
			jj = ostr.indexOf(".") - 1;
			for (i = decpt; i >= 0; --i) {
				if (out[i] == null || "n?".indexOf(out[i].t) === -1) continue;
				j = out[i].v.indexOf(".") > -1 && i === decpt ? out[i].v.indexOf(".") - 1 : out[i].v.length - 1;
				vv = out[i].v.substr(j + 1);
				for (; j >= 0; --j) if (jj >= 0 && (out[i].v.charAt(j) === "0" || out[i].v.charAt(j) === "#")) vv = ostr.charAt(jj--) + vv;
				out[i].v = vv;
				out[i].t = "t";
				lasti = i;
			}
			if (jj >= 0 && lasti < out.length) out[lasti].v = ostr.substr(0, jj + 1) + out[lasti].v;
			jj = ostr.indexOf(".") + 1;
			for (i = decpt; i < out.length; ++i) {
				if (out[i] == null || "n?(".indexOf(out[i].t) === -1 && i !== decpt) continue;
				j = out[i].v.indexOf(".") > -1 && i === decpt ? out[i].v.indexOf(".") + 1 : 0;
				vv = out[i].v.substr(0, j);
				for (; j < out[i].v.length; ++j) if (jj < ostr.length) vv += ostr.charAt(jj++);
				out[i].v = vv;
				out[i].t = "t";
				lasti = i;
			}
		}
	}
	for (i = 0; i < out.length; ++i) if (out[i] != null && "n?".indexOf(out[i].t) > -1) {
		myv = flen > 1 && v < 0 && i > 0 && out[i - 1].v === "-" ? -v : v;
		out[i].v = write_num(out[i].t, out[i].v, myv);
		out[i].t = "t";
	}
	var retval = "";
	for (i = 0; i !== out.length; ++i) if (out[i] != null) retval += out[i].v;
	return retval;
}
var cfregex2 = /\[(=|>[=]?|<[>=]?)(-?\d+(?:\.\d*)?)\]/;
function chkcond(v, rr) {
	if (rr == null) return false;
	var thresh = parseFloat(rr[2]);
	switch (rr[1]) {
		case "=":
			if (v == thresh) return true;
			break;
		case ">":
			if (v > thresh) return true;
			break;
		case "<":
			if (v < thresh) return true;
			break;
		case "<>":
			if (v != thresh) return true;
			break;
		case ">=":
			if (v >= thresh) return true;
			break;
		case "<=": if (v <= thresh) return true;
	}
	return false;
}
function choose_fmt(f, v) {
	var fmt = SSF_split_fmt(f);
	var l = fmt.length, lat = fmt[l - 1].indexOf("@");
	if (l < 4 && lat > -1) --l;
	if (fmt.length > 4) throw new Error("cannot find right format for |" + fmt.join("|") + "|");
	if (typeof v !== "number") return [4, fmt.length === 4 || lat > -1 ? fmt[fmt.length - 1] : "@"];
	if (typeof v === "number" && !isFinite(v)) v = 0;
	switch (fmt.length) {
		case 1:
			fmt = lat > -1 ? [
				"General",
				"General",
				"General",
				fmt[0]
			] : [
				fmt[0],
				fmt[0],
				fmt[0],
				"@"
			];
			break;
		case 2:
			fmt = lat > -1 ? [
				fmt[0],
				fmt[0],
				fmt[0],
				fmt[1]
			] : [
				fmt[0],
				fmt[1],
				fmt[0],
				"@"
			];
			break;
		case 3: fmt = lat > -1 ? [
			fmt[0],
			fmt[1],
			fmt[0],
			fmt[2]
		] : [
			fmt[0],
			fmt[1],
			fmt[2],
			"@"
		];
	}
	var ff = v > 0 ? fmt[0] : v < 0 ? fmt[1] : fmt[2];
	if (fmt[0].indexOf("[") === -1 && fmt[1].indexOf("[") === -1) return [l, ff];
	if (fmt[0].match(/\[[=<>]/) != null || fmt[1].match(/\[[=<>]/) != null) {
		var m1 = fmt[0].match(cfregex2);
		var m2 = fmt[1].match(cfregex2);
		return chkcond(v, m1) ? [l, fmt[0]] : chkcond(v, m2) ? [l, fmt[1]] : [l, fmt[m1 != null && m2 != null ? 2 : 1]];
	}
	return [l, ff];
}
function SSF_format(fmt, v, o) {
	if (o == null) o = {};
	var sfmt = "";
	switch (typeof fmt) {
		case "string":
			if (fmt == "m/d/yy" && o.dateNF) sfmt = o.dateNF;
			else sfmt = fmt;
			break;
		case "number":
			if (fmt == 14 && o.dateNF) sfmt = o.dateNF;
			else sfmt = (o.table != null ? o.table : table_fmt)[fmt];
			if (sfmt == null) sfmt = o.table && o.table[SSF_default_map[fmt]] || table_fmt[SSF_default_map[fmt]];
			if (sfmt == null) sfmt = SSF_default_str[fmt] || "General";
	}
	if (SSF_isgeneral(sfmt, 0)) return SSF_general(v, o);
	if (v instanceof Date) v = datenum(v, o.date1904);
	var f = choose_fmt(sfmt, v);
	if (SSF_isgeneral(f[1])) return SSF_general(v, o);
	if (v === true) v = "TRUE";
	else if (v === false) v = "FALSE";
	else if (v === "" || v == null) return "";
	else if (isNaN(v) && f[1].indexOf("0") > -1) return "#NUM!";
	else if (!isFinite(v) && f[1].indexOf("0") > -1) return "#DIV/0!";
	return eval_fmt(f[1], v, o, f[0]);
}
function SSF_load(fmt, idx) {
	if (typeof idx != "number") {
		idx = +idx || -1;
		for (var i = 0; i < 392; ++i) {
			if (table_fmt[i] == void 0) {
				if (idx < 0) idx = i;
				continue;
			}
			if (table_fmt[i] == fmt) {
				idx = i;
				break;
			}
		}
		if (idx < 0) idx = 391;
	}
	table_fmt[idx] = fmt;
	return idx;
}
function make_ssf() {
	table_fmt = SSF_init_table();
}
var SSFImplicit = {
	"5": "\"$\"#,##0_);\\(\"$\"#,##0\\)",
	"6": "\"$\"#,##0_);[Red]\\(\"$\"#,##0\\)",
	"7": "\"$\"#,##0.00_);\\(\"$\"#,##0.00\\)",
	"8": "\"$\"#,##0.00_);[Red]\\(\"$\"#,##0.00\\)",
	"23": "General",
	"24": "General",
	"25": "General",
	"26": "General",
	"27": "m/d/yy",
	"28": "m/d/yy",
	"29": "m/d/yy",
	"30": "m/d/yy",
	"31": "m/d/yy",
	"32": "h:mm:ss",
	"33": "h:mm:ss",
	"34": "h:mm:ss",
	"35": "h:mm:ss",
	"36": "m/d/yy",
	"41": "_(* #,##0_);_(* (#,##0);_(* \"-\"_);_(@_)",
	"42": "_(\"$\"* #,##0_);_(\"$\"* (#,##0);_(\"$\"* \"-\"_);_(@_)",
	"43": "_(* #,##0.00_);_(* (#,##0.00);_(* \"-\"??_);_(@_)",
	"44": "_(\"$\"* #,##0.00_);_(\"$\"* (#,##0.00);_(\"$\"* \"-\"??_);_(@_)",
	"50": "m/d/yy",
	"51": "m/d/yy",
	"52": "m/d/yy",
	"53": "m/d/yy",
	"54": "m/d/yy",
	"55": "m/d/yy",
	"56": "m/d/yy",
	"57": "m/d/yy",
	"58": "m/d/yy",
	"59": "0",
	"60": "0.00",
	"61": "#,##0",
	"62": "#,##0.00",
	"63": "\"$\"#,##0_);\\(\"$\"#,##0\\)",
	"64": "\"$\"#,##0_);[Red]\\(\"$\"#,##0\\)",
	"65": "\"$\"#,##0.00_);\\(\"$\"#,##0.00\\)",
	"66": "\"$\"#,##0.00_);[Red]\\(\"$\"#,##0.00\\)",
	"67": "0%",
	"68": "0.00%",
	"69": "# ?/?",
	"70": "# ??/??",
	"71": "m/d/yy",
	"72": "m/d/yy",
	"73": "d-mmm-yy",
	"74": "d-mmm",
	"75": "mmm-yy",
	"76": "h:mm",
	"77": "h:mm:ss",
	"78": "m/d/yy h:mm",
	"79": "mm:ss",
	"80": "[h]:mm:ss",
	"81": "mmss.0"
};
var dateNFregex = /[dD]+|[mM]+|[yYeE]+|[Hh]+|[Ss]+/g;
function dateNF_regex(dateNF) {
	var fmt = typeof dateNF == "number" ? table_fmt[dateNF] : dateNF;
	fmt = fmt.replace(dateNFregex, "(\\d+)");
	dateNFregex.lastIndex = 0;
	return new RegExp("^" + fmt + "$");
}
function dateNF_fix(str, dateNF, match) {
	var Y = -1, m = -1, d = -1, H = -1, M = -1, S = -1;
	(dateNF.match(dateNFregex) || []).forEach(function(n, i) {
		var v = parseInt(match[i + 1], 10);
		switch (n.toLowerCase().charAt(0)) {
			case "y":
				Y = v;
				break;
			case "d":
				d = v;
				break;
			case "h":
				H = v;
				break;
			case "s":
				S = v;
				break;
			case "m": if (H >= 0) M = v;
			else m = v;
		}
	});
	dateNFregex.lastIndex = 0;
	if (S >= 0 && M == -1 && m >= 0) {
		M = m;
		m = -1;
	}
	var datestr = ("" + (Y >= 0 ? Y : (/* @__PURE__ */ new Date()).getFullYear())).slice(-4) + "-" + ("00" + (m >= 1 ? m : 1)).slice(-2) + "-" + ("00" + (d >= 1 ? d : 1)).slice(-2);
	if (datestr.length == 7) datestr = "0" + datestr;
	if (datestr.length == 8) datestr = "20" + datestr;
	var timestr = ("00" + (H >= 0 ? H : 0)).slice(-2) + ":" + ("00" + (M >= 0 ? M : 0)).slice(-2) + ":" + ("00" + (S >= 0 ? S : 0)).slice(-2);
	if (H == -1 && M == -1 && S == -1) return datestr;
	if (Y == -1 && m == -1 && d == -1) return timestr;
	return datestr + "T" + timestr;
}
var bad_formats = { "d.m": "d\\.m" };
function SSF__load(fmt, idx) {
	return SSF_load(bad_formats[fmt] || fmt, idx);
}
var CRC32 = /*#__PURE__*/ (function() {
	var CRC32 = {};
	CRC32.version = "1.2.0";
	function signed_crc_table() {
		var c = 0, table = new Array(256);
		for (var n = 0; n != 256; ++n) {
			c = n;
			c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
			c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
			c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
			c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
			c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
			c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
			c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
			c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
			table[n] = c;
		}
		return typeof Int32Array !== "undefined" ? new Int32Array(table) : table;
	}
	var T0 = signed_crc_table();
	function slice_by_16_tables(T) {
		var c = 0, v = 0, n = 0, table = typeof Int32Array !== "undefined" ? /* @__PURE__ */ new Int32Array(4096) : new Array(4096);
		for (n = 0; n != 256; ++n) table[n] = T[n];
		for (n = 0; n != 256; ++n) {
			v = T[n];
			for (c = 256 + n; c < 4096; c += 256) v = table[c] = v >>> 8 ^ T[v & 255];
		}
		var out = [];
		for (n = 1; n != 16; ++n) out[n - 1] = typeof Int32Array !== "undefined" && typeof table.subarray == "function" ? table.subarray(n * 256, n * 256 + 256) : table.slice(n * 256, n * 256 + 256);
		return out;
	}
	var TT = slice_by_16_tables(T0);
	var T1 = TT[0], T2 = TT[1], T3 = TT[2], T4 = TT[3], T5 = TT[4];
	var T6 = TT[5], T7 = TT[6], T8 = TT[7], T9 = TT[8], Ta = TT[9];
	var Tb = TT[10], Tc = TT[11], Td = TT[12], Te = TT[13], Tf = TT[14];
	function crc32_bstr(bstr, seed) {
		var C = seed ^ -1;
		for (var i = 0, L = bstr.length; i < L;) C = C >>> 8 ^ T0[(C ^ bstr.charCodeAt(i++)) & 255];
		return ~C;
	}
	function crc32_buf(B, seed) {
		var C = seed ^ -1, L = B.length - 15, i = 0;
		for (; i < L;) C = Tf[B[i++] ^ C & 255] ^ Te[B[i++] ^ C >> 8 & 255] ^ Td[B[i++] ^ C >> 16 & 255] ^ Tc[B[i++] ^ C >>> 24] ^ Tb[B[i++]] ^ Ta[B[i++]] ^ T9[B[i++]] ^ T8[B[i++]] ^ T7[B[i++]] ^ T6[B[i++]] ^ T5[B[i++]] ^ T4[B[i++]] ^ T3[B[i++]] ^ T2[B[i++]] ^ T1[B[i++]] ^ T0[B[i++]];
		L += 15;
		while (i < L) C = C >>> 8 ^ T0[(C ^ B[i++]) & 255];
		return ~C;
	}
	function crc32_str(str, seed) {
		var C = seed ^ -1;
		for (var i = 0, L = str.length, c = 0, d = 0; i < L;) {
			c = str.charCodeAt(i++);
			if (c < 128) C = C >>> 8 ^ T0[(C ^ c) & 255];
			else if (c < 2048) {
				C = C >>> 8 ^ T0[(C ^ (192 | c >> 6 & 31)) & 255];
				C = C >>> 8 ^ T0[(C ^ (128 | c & 63)) & 255];
			} else if (c >= 55296 && c < 57344) {
				c = (c & 1023) + 64;
				d = str.charCodeAt(i++) & 1023;
				C = C >>> 8 ^ T0[(C ^ (240 | c >> 8 & 7)) & 255];
				C = C >>> 8 ^ T0[(C ^ (128 | c >> 2 & 63)) & 255];
				C = C >>> 8 ^ T0[(C ^ (128 | d >> 6 & 15 | (c & 3) << 4)) & 255];
				C = C >>> 8 ^ T0[(C ^ (128 | d & 63)) & 255];
			} else {
				C = C >>> 8 ^ T0[(C ^ (224 | c >> 12 & 15)) & 255];
				C = C >>> 8 ^ T0[(C ^ (128 | c >> 6 & 63)) & 255];
				C = C >>> 8 ^ T0[(C ^ (128 | c & 63)) & 255];
			}
		}
		return ~C;
	}
	CRC32.table = T0;
	CRC32.bstr = crc32_bstr;
	CRC32.buf = crc32_buf;
	CRC32.str = crc32_str;
	return CRC32;
})();
var CFB = /*#__PURE__*/ (function _CFB() {
	var exports = {};
	exports.version = "1.2.2";
	function namecmp(l, r) {
		var L = l.split("/"), R = r.split("/");
		for (var i = 0, c = 0, Z = Math.min(L.length, R.length); i < Z; ++i) {
			if (c = L[i].length - R[i].length) return c;
			if (L[i] != R[i]) return L[i] < R[i] ? -1 : 1;
		}
		return L.length - R.length;
	}
	function dirname(p) {
		if (p.charAt(p.length - 1) == "/") return p.slice(0, -1).indexOf("/") === -1 ? p : dirname(p.slice(0, -1));
		var c = p.lastIndexOf("/");
		return c === -1 ? p : p.slice(0, c + 1);
	}
	function filename(p) {
		if (p.charAt(p.length - 1) == "/") return filename(p.slice(0, -1));
		var c = p.lastIndexOf("/");
		return c === -1 ? p : p.slice(c + 1);
	}
	function write_dos_date(buf, date) {
		if (typeof date === "string") date = new Date(date);
		var hms = date.getHours();
		hms = hms << 6 | date.getMinutes();
		hms = hms << 5 | date.getSeconds() >>> 1;
		buf.write_shift(2, hms);
		var ymd = date.getFullYear() - 1980;
		ymd = ymd << 4 | date.getMonth() + 1;
		ymd = ymd << 5 | date.getDate();
		buf.write_shift(2, ymd);
	}
	function parse_dos_date(buf) {
		var hms = buf.read_shift(2) & 65535;
		var ymd = buf.read_shift(2) & 65535;
		var val = /* @__PURE__ */ new Date();
		var d = ymd & 31;
		ymd >>>= 5;
		var m = ymd & 15;
		ymd >>>= 4;
		val.setMilliseconds(0);
		val.setFullYear(ymd + 1980);
		val.setMonth(m - 1);
		val.setDate(d);
		var S = hms & 31;
		hms >>>= 5;
		var M = hms & 63;
		hms >>>= 6;
		val.setHours(hms);
		val.setMinutes(M);
		val.setSeconds(S << 1);
		return val;
	}
	function parse_extra_field(blob) {
		prep_blob(blob, 0);
		var o = {};
		var flags = 0;
		while (blob.l <= blob.length - 4) {
			var type = blob.read_shift(2);
			var sz = blob.read_shift(2), tgt = blob.l + sz;
			var p = {};
			switch (type) {
				case 21589:
					flags = blob.read_shift(1);
					if (flags & 1) p.mtime = blob.read_shift(4);
					if (sz > 5) {
						if (flags & 2) p.atime = blob.read_shift(4);
						if (flags & 4) p.ctime = blob.read_shift(4);
					}
					if (p.mtime) p.mt = /* @__PURE__ */ new Date(p.mtime * 1e3);
					break;
				case 1:
					var sz1 = blob.read_shift(4), sz2 = blob.read_shift(4);
					p.usz = sz2 * Math.pow(2, 32) + sz1;
					sz1 = blob.read_shift(4);
					sz2 = blob.read_shift(4);
					p.csz = sz2 * Math.pow(2, 32) + sz1;
			}
			blob.l = tgt;
			o[type] = p;
		}
		return o;
	}
	var fs;
	function get_fs() {
		return fs || (fs = _fs);
	}
	function parse(file, options) {
		if (file[0] == 80 && file[1] == 75) return parse_zip(file, options);
		if ((file[0] | 32) == 109 && (file[1] | 32) == 105) return parse_mad(file, options);
		if (file.length < 512) throw new Error("CFB file size " + file.length + " < 512");
		var mver = 3;
		var ssz = 512;
		var nmfs = 0;
		var difat_sec_cnt = 0;
		var dir_start = 0;
		var minifat_start = 0;
		var difat_start = 0;
		var fat_addrs = [];
		var blob = file.slice(0, 512);
		prep_blob(blob, 0);
		var mv = check_get_mver(blob);
		mver = mv[0];
		switch (mver) {
			case 3:
				ssz = 512;
				break;
			case 4:
				ssz = 4096;
				break;
			case 0: if (mv[1] == 0) return parse_zip(file, options);
			default: throw new Error("Major Version: Expected 3 or 4 saw " + mver);
		}
		if (ssz !== 512) {
			blob = file.slice(0, ssz);
			prep_blob(blob, 28);
		}
		var header = file.slice(0, ssz);
		check_shifts(blob, mver);
		var dir_cnt = blob.read_shift(4, "i");
		if (mver === 3 && dir_cnt !== 0) throw new Error("# Directory Sectors: Expected 0 saw " + dir_cnt);
		blob.l += 4;
		dir_start = blob.read_shift(4, "i");
		blob.l += 4;
		blob.chk("00100000", "Mini Stream Cutoff Size: ");
		minifat_start = blob.read_shift(4, "i");
		nmfs = blob.read_shift(4, "i");
		difat_start = blob.read_shift(4, "i");
		difat_sec_cnt = blob.read_shift(4, "i");
		for (var q = -1, j = 0; j < 109; ++j) {
			q = blob.read_shift(4, "i");
			if (q < 0) break;
			fat_addrs[j] = q;
		}
		/** Break the file up into sectors */
		var sectors = sectorify(file, ssz);
		sleuth_fat(difat_start, difat_sec_cnt, sectors, ssz, fat_addrs);
		/** Chains */
		var sector_list = make_sector_list(sectors, dir_start, fat_addrs, ssz);
		if (!sector_list[dir_start]) throw new Error("CFB directory chain is missing");
		sector_list[dir_start].name = "!Directory";
		if (nmfs > 0 && sector_list[minifat_start]) sector_list[minifat_start].name = "!MiniFAT";
		if (!sector_list[fat_addrs[0]]) throw new Error("CFB FAT chain is missing");
		sector_list[fat_addrs[0]].name = "!FAT";
		sector_list.fat_addrs = fat_addrs;
		sector_list.ssz = ssz;
		var files = {}, Paths = [], FileIndex = [], FullPaths = [];
		read_directory(dir_start, sector_list, sectors, Paths, nmfs, files, FileIndex, minifat_start);
		build_full_paths(FileIndex, FullPaths, Paths);
		Paths.shift();
		var o = {
			FileIndex,
			FullPaths
		};
		if (options && options.raw) o.raw = {
			header,
			sectors
		};
		return o;
	}
	function check_get_mver(blob) {
		if (blob[blob.l] == 80 && blob[blob.l + 1] == 75) return [0, 0];
		blob.chk(HEADER_SIGNATURE, "Header Signature: ");
		blob.l += 16;
		var mver = blob.read_shift(2, "u");
		return [blob.read_shift(2, "u"), mver];
	}
	function check_shifts(blob, mver) {
		var shift = 9;
		blob.l += 2;
		switch (shift = blob.read_shift(2)) {
			case 9:
				if (mver != 3) throw new Error("Sector Shift: Expected 9 saw " + shift);
				break;
			case 12:
				if (mver != 4) throw new Error("Sector Shift: Expected 12 saw " + shift);
				break;
			default: throw new Error("Sector Shift: Expected 9 or 12 saw " + shift);
		}
		blob.chk("0600", "Mini Sector Shift: ");
		blob.chk("000000000000", "Reserved: ");
	}
	/** Break the file up into sectors */
	function sectorify(file, ssz) {
		var nsectors = Math.ceil(file.length / ssz) - 1;
		var sectors = [];
		for (var i = 1; i < nsectors; ++i) sectors[i - 1] = file.slice(i * ssz, (i + 1) * ssz);
		sectors[nsectors - 1] = file.slice(nsectors * ssz);
		return sectors;
	}
	function build_full_paths(FI, FP, Paths) {
		var i = 0, L = 0, R = 0, C = 0, j = 0, pl = Paths.length;
		var dad = [], q = [];
		for (; i < pl; ++i) {
			dad[i] = q[i] = i;
			FP[i] = Paths[i];
		}
		for (; j < q.length; ++j) {
			i = q[j];
			L = FI[i].L;
			R = FI[i].R;
			C = FI[i].C;
			if (dad[i] === i) {
				if (L !== -1 && dad[L] !== L) dad[i] = dad[L];
				if (R !== -1 && dad[R] !== R) dad[i] = dad[R];
			}
			if (C !== -1) dad[C] = i;
			if (L !== -1 && i != dad[i]) {
				dad[L] = dad[i];
				if (q.lastIndexOf(L) < j) q.push(L);
			}
			if (R !== -1 && i != dad[i]) {
				dad[R] = dad[i];
				if (q.lastIndexOf(R) < j) q.push(R);
			}
		}
		for (i = 1; i < pl; ++i) if (dad[i] === i) {
			if (R !== -1 && dad[R] !== R) dad[i] = dad[R];
			else if (L !== -1 && dad[L] !== L) dad[i] = dad[L];
		}
		for (i = 1; i < pl; ++i) {
			if (FI[i].type === 0) continue;
			j = i;
			if (j != dad[j]) do {
				j = dad[j];
				FP[i] = FP[j] + "/" + FP[i];
			} while (j !== 0 && -1 !== dad[j] && j != dad[j]);
			dad[i] = -1;
		}
		FP[0] += "/";
		for (i = 1; i < pl; ++i) if (FI[i].type !== 2) FP[i] += "/";
	}
	function get_mfat_entry(entry, payload, mini) {
		var start = entry.start, size = entry.size;
		var o = [];
		var idx = start;
		while (mini && size > 0 && idx >= 0) {
			o.push(payload.slice(idx * MSSZ, idx * MSSZ + MSSZ));
			size -= MSSZ;
			idx = __readInt32LE(mini, idx * 4);
		}
		if (o.length === 0) return new_buf(0);
		return bconcat(o).slice(0, entry.size);
	}
	/** Chase down the rest of the DIFAT chain to build a comprehensive list
	DIFAT chains by storing the next sector number as the last 32 bits */
	function sleuth_fat(idx, cnt, sectors, ssz, fat_addrs) {
		var q = ENDOFCHAIN;
		if (idx === ENDOFCHAIN) {
			if (cnt !== 0) throw new Error("DIFAT chain shorter than expected");
		} else if (idx !== -1) {
			var sector = sectors[idx], m = (ssz >>> 2) - 1;
			if (!sector) return;
			for (var i = 0; i < m; ++i) {
				if ((q = __readInt32LE(sector, i * 4)) === ENDOFCHAIN) break;
				fat_addrs.push(q);
			}
			if (cnt >= 1) sleuth_fat(__readInt32LE(sector, ssz - 4), cnt - 1, sectors, ssz, fat_addrs);
		}
	}
	/** Follow the linked list of sectors for a given starting point */
	function get_sector_list(sectors, start, fat_addrs, ssz, chkd) {
		var buf = [], buf_chain = [];
		if (!chkd) chkd = [];
		var modulus = ssz - 1, j = 0, jj = 0;
		for (j = start; j >= 0;) {
			chkd[j] = true;
			buf[buf.length] = j;
			buf_chain.push(sectors[j]);
			var addr = fat_addrs[Math.floor(j * 4 / ssz)];
			jj = j * 4 & modulus;
			if (ssz < 4 + jj) throw new Error("FAT boundary crossed: " + j + " 4 " + ssz);
			if (!sectors[addr]) break;
			j = __readInt32LE(sectors[addr], jj);
		}
		return {
			nodes: buf,
			data: __toBuffer([buf_chain])
		};
	}
	/** Chase down the sector linked lists */
	function make_sector_list(sectors, dir_start, fat_addrs, ssz) {
		var sl = sectors.length, sector_list = [];
		var chkd = [], buf = [], buf_chain = [];
		var modulus = ssz - 1, i = 0, j = 0, k = 0, jj = 0;
		for (i = 0; i < sl; ++i) {
			buf = [];
			k = i + dir_start;
			if (k >= sl) k -= sl;
			if (chkd[k]) continue;
			buf_chain = [];
			var seen = [];
			for (j = k; j >= 0;) {
				seen[j] = true;
				chkd[j] = true;
				buf[buf.length] = j;
				buf_chain.push(sectors[j]);
				var addr = fat_addrs[Math.floor(j * 4 / ssz)];
				jj = j * 4 & modulus;
				if (ssz < 4 + jj) throw new Error("FAT boundary crossed: " + j + " 4 " + ssz);
				if (!sectors[addr]) break;
				j = __readInt32LE(sectors[addr], jj);
				if (seen[j]) break;
			}
			sector_list[k] = {
				nodes: buf,
				data: __toBuffer([buf_chain])
			};
		}
		return sector_list;
	}
	function read_directory(dir_start, sector_list, sectors, Paths, nmfs, files, FileIndex, mini) {
		var minifat_store = 0, pl = Paths.length ? 2 : 0;
		var sector = sector_list[dir_start].data;
		var i = 0, namelen = 0, name;
		for (; i < sector.length; i += 128) {
			var blob = sector.slice(i, i + 128);
			prep_blob(blob, 64);
			namelen = blob.read_shift(2);
			name = __utf16le(blob, 0, namelen - pl);
			Paths.push(name);
			var o = {
				name,
				type: blob.read_shift(1),
				color: blob.read_shift(1),
				L: blob.read_shift(4, "i"),
				R: blob.read_shift(4, "i"),
				C: blob.read_shift(4, "i"),
				clsid: blob.read_shift(16),
				state: blob.read_shift(4, "i"),
				start: 0,
				size: 0
			};
			if (blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) !== 0) o.ct = read_date(blob, blob.l - 8);
			if (blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) !== 0) o.mt = read_date(blob, blob.l - 8);
			o.start = blob.read_shift(4, "i");
			o.size = blob.read_shift(4, "i");
			if (o.type === 0) {
				o.size = 0;
				o.start = ENDOFCHAIN;
			}
			if (o.size < 0 && o.start < 0) {
				o.size = o.type = 0;
				o.start = ENDOFCHAIN;
				o.name = "";
			}
			if (o.type === 5) {
				minifat_store = o.size > 0 ? o.start : ENDOFCHAIN;
				if (o.size > 0 && nmfs > 0) {
					if (!sector_list[minifat_store]) throw new Error("CFB root mini stream is missing");
					sector_list[minifat_store].name = "!StreamData";
				}
			} else if (o.size >= 4096) {
				o.storage = "fat";
				if (sector_list[o.start] === void 0) sector_list[o.start] = get_sector_list(sectors, o.start, sector_list.fat_addrs, sector_list.ssz);
				sector_list[o.start].name = o.name;
				o.content = sector_list[o.start].data.slice(0, o.size);
			} else {
				o.storage = "minifat";
				if (o.size < 0) o.size = 0;
				else if (o.type === 2 && o.size > 0) {
					if (nmfs < 1 || !sector_list[mini]) throw new Error("CFB MiniFAT chain is missing for stream: " + o.name);
					if (!sector_list[minifat_store]) throw new Error("CFB root mini stream is missing");
					o.content = get_mfat_entry(o, sector_list[minifat_store].data, sector_list[mini].data);
					if (o.content.length !== o.size) throw new Error("CFB mini stream is truncated: " + o.name);
				}
			}
			if (o.content) prep_blob(o.content, 0);
			files[name] = o;
			FileIndex.push(o);
		}
	}
	function read_date(blob, offset) {
		return /* @__PURE__ */ new Date((__readUInt32LE(blob, offset + 4) / 1e7 * Math.pow(2, 32) + __readUInt32LE(blob, offset) / 1e7 - 11644473600) * 1e3);
	}
	function read_file(filename, options) {
		get_fs();
		return parse(fs.readFileSync(filename), options);
	}
	function read(blob, options) {
		var type = options && options.type;
		if (!type) {
			if (has_buf && Buffer.isBuffer(blob)) type = "buffer";
		}
		switch (type || "base64") {
			case "file": return read_file(blob, options);
			case "base64": return parse(s2a(Base64_decode(blob)), options);
			case "binary": return parse(s2a(blob), options);
		}
		return parse(blob, options);
	}
	function init_cfb(cfb, opts) {
		var o = opts || {}, root = o.root || "Root Entry";
		if (!cfb.FullPaths) cfb.FullPaths = [];
		if (!cfb.FileIndex) cfb.FileIndex = [];
		if (cfb.FullPaths.length !== cfb.FileIndex.length) throw new Error("inconsistent CFB structure");
		if (cfb.FullPaths.length === 0) {
			cfb.FullPaths[0] = root + "/";
			cfb.FileIndex[0] = {
				name: root,
				type: 5
			};
		}
		if (o.CLSID) cfb.FileIndex[0].clsid = o.CLSID;
		seed_cfb(cfb);
	}
	function seed_cfb(cfb) {
		var nm = "Sh33tJ5";
		if (CFB.find(cfb, "/" + nm)) return;
		var p = new_buf(4);
		p[0] = 55;
		p[1] = p[3] = 50;
		p[2] = 54;
		cfb.FileIndex.push({
			name: nm,
			type: 2,
			content: p,
			size: 4,
			L: 69,
			R: 69,
			C: 69
		});
		cfb.FullPaths.push(cfb.FullPaths[0] + nm);
		rebuild_cfb(cfb);
	}
	function rebuild_cfb(cfb, f) {
		init_cfb(cfb);
		var gc = false, s = false;
		for (var i = cfb.FullPaths.length - 1; i >= 0; --i) {
			var _file = cfb.FileIndex[i];
			switch (_file.type) {
				case 0:
					if (s) gc = true;
					else {
						cfb.FileIndex.pop();
						cfb.FullPaths.pop();
					}
					break;
				case 1:
				case 2:
				case 5:
					s = true;
					if (isNaN(_file.R * _file.L * _file.C)) gc = true;
					if (_file.R > -1 && _file.L > -1 && _file.R == _file.L) gc = true;
					break;
				default: gc = true;
			}
		}
		if (!gc && !f) return;
		var now = new Date(1987, 1, 19), j = 0;
		var fullPaths = Object.create ? Object.create(null) : {};
		var data = [];
		for (i = 0; i < cfb.FullPaths.length; ++i) {
			fullPaths[cfb.FullPaths[i]] = true;
			if (cfb.FileIndex[i].type === 0) continue;
			data.push([cfb.FullPaths[i], cfb.FileIndex[i]]);
		}
		for (i = 0; i < data.length; ++i) {
			var dad = dirname(data[i][0]);
			s = fullPaths[dad];
			while (!s) {
				while (dirname(dad) && !fullPaths[dirname(dad)]) dad = dirname(dad);
				data.push([dad, {
					name: filename(dad).replace("/", ""),
					type: 1,
					clsid: HEADER_CLSID,
					ct: now,
					mt: now,
					content: null
				}]);
				fullPaths[dad] = true;
				dad = dirname(data[i][0]);
				s = fullPaths[dad];
			}
		}
		data.sort(function(x, y) {
			return namecmp(x[0], y[0]);
		});
		cfb.FullPaths = [];
		cfb.FileIndex = [];
		for (i = 0; i < data.length; ++i) {
			cfb.FullPaths[i] = data[i][0];
			cfb.FileIndex[i] = data[i][1];
		}
		for (i = 0; i < data.length; ++i) {
			var elt = cfb.FileIndex[i];
			var nm = cfb.FullPaths[i];
			elt.name = filename(nm).replace("/", "");
			elt.L = elt.R = elt.C = -(elt.color = 1);
			elt.size = elt.content ? elt.content.length : 0;
			elt.start = 0;
			elt.clsid = elt.clsid || HEADER_CLSID;
			if (i === 0) {
				elt.C = data.length > 1 ? 1 : -1;
				elt.size = 0;
				elt.type = 5;
			} else if (nm.slice(-1) == "/") {
				for (j = i + 1; j < data.length; ++j) if (dirname(cfb.FullPaths[j]) == nm) break;
				elt.C = j >= data.length ? -1 : j;
				for (j = i + 1; j < data.length; ++j) if (dirname(cfb.FullPaths[j]) == dirname(nm)) break;
				elt.R = j >= data.length ? -1 : j;
				elt.type = 1;
			} else {
				if (dirname(cfb.FullPaths[i + 1] || "") == dirname(nm)) elt.R = i + 1;
				elt.type = 2;
			}
		}
	}
	function _write(cfb, options) {
		var _opts = options || {};
		if (_opts.fileType == "mad") return write_mad(cfb, _opts);
		rebuild_cfb(cfb);
		switch (_opts.fileType) {
			case "zip": return write_zip(cfb, _opts);
		}
		var L = (function(cfb) {
			var mini_size = 0, fat_size = 0;
			for (var i = 0; i < cfb.FileIndex.length; ++i) {
				var file = cfb.FileIndex[i];
				if (!file.content) continue;
				var flen = file.content.length;
				if (flen > 0) if (flen < 4096) mini_size += flen + 63 >> 6;
				else fat_size += flen + 511 >> 9;
			}
			var dir_cnt = cfb.FullPaths.length + 3 >> 2;
			var mini_cnt = mini_size + 7 >> 3;
			var mfat_cnt = mini_size + 127 >> 7;
			var fat_base = mini_cnt + fat_size + dir_cnt + mfat_cnt;
			var fat_cnt = fat_base + 127 >> 7;
			var difat_cnt = fat_cnt <= 109 ? 0 : Math.ceil((fat_cnt - 109) / 127);
			while (fat_base + fat_cnt + difat_cnt + 127 >> 7 > fat_cnt) difat_cnt = ++fat_cnt <= 109 ? 0 : Math.ceil((fat_cnt - 109) / 127);
			var L = [
				1,
				difat_cnt,
				fat_cnt,
				mfat_cnt,
				dir_cnt,
				fat_size,
				mini_size,
				0
			];
			cfb.FileIndex[0].size = mini_size << 6;
			L[7] = (cfb.FileIndex[0].start = L[0] + L[1] + L[2] + L[3] + L[4] + L[5]) + (L[6] + 7 >> 3);
			return L;
		})(cfb);
		var o = new_buf(L[7] << 9);
		var i = 0, T = 0;
		for (i = 0; i < 8; ++i) o.write_shift(1, HEADER_SIG[i]);
		for (i = 0; i < 8; ++i) o.write_shift(2, 0);
		o.write_shift(2, 62);
		o.write_shift(2, 3);
		o.write_shift(2, 65534);
		o.write_shift(2, 9);
		o.write_shift(2, 6);
		for (i = 0; i < 3; ++i) o.write_shift(2, 0);
		o.write_shift(4, 0);
		o.write_shift(4, L[2]);
		o.write_shift(4, L[0] + L[1] + L[2] + L[3] - 1);
		o.write_shift(4, 0);
		o.write_shift(4, 4096);
		o.write_shift(4, L[3] ? L[0] + L[1] + L[2] - 1 : ENDOFCHAIN);
		o.write_shift(4, L[3]);
		o.write_shift(-4, L[1] ? L[0] - 1 : ENDOFCHAIN);
		o.write_shift(4, L[1]);
		for (i = 0; i < 109; ++i) o.write_shift(-4, i < L[2] ? L[1] + i : -1);
		if (L[1]) for (T = 0; T < L[1]; ++T) {
			for (; i < 236 + T * 127; ++i) o.write_shift(-4, i < L[2] ? L[1] + i : -1);
			o.write_shift(-4, T === L[1] - 1 ? ENDOFCHAIN : T + 1);
		}
		var chainit = function(w) {
			for (T += w; i < T - 1; ++i) o.write_shift(-4, i + 1);
			if (w) {
				++i;
				o.write_shift(-4, ENDOFCHAIN);
			}
		};
		T = i = 0;
		for (T += L[1]; i < T; ++i) o.write_shift(-4, consts.DIFSECT);
		for (T += L[2]; i < T; ++i) o.write_shift(-4, consts.FATSECT);
		chainit(L[3]);
		chainit(L[4]);
		var j = 0, flen = 0;
		var file = cfb.FileIndex[0];
		for (; j < cfb.FileIndex.length; ++j) {
			file = cfb.FileIndex[j];
			if (!file.content) continue;
			flen = file.content.length;
			if (flen < 4096) continue;
			file.start = T;
			chainit(flen + 511 >> 9);
		}
		chainit(L[6] + 7 >> 3);
		while (o.l & 511) o.write_shift(-4, consts.ENDOFCHAIN);
		T = i = 0;
		for (j = 0; j < cfb.FileIndex.length; ++j) {
			file = cfb.FileIndex[j];
			if (!file.content) continue;
			flen = file.content.length;
			if (!flen || flen >= 4096) continue;
			file.start = T;
			chainit(flen + 63 >> 6);
		}
		while (o.l & 511) o.write_shift(-4, consts.ENDOFCHAIN);
		for (i = 0; i < L[4] << 2; ++i) {
			var nm = cfb.FullPaths[i];
			if (!nm || nm.length === 0) {
				for (j = 0; j < 17; ++j) o.write_shift(4, 0);
				for (j = 0; j < 3; ++j) o.write_shift(4, -1);
				for (j = 0; j < 12; ++j) o.write_shift(4, 0);
				continue;
			}
			file = cfb.FileIndex[i];
			if (i === 0) file.start = file.size ? file.start - 1 : ENDOFCHAIN;
			var _nm = i === 0 && _opts.root || file.name;
			if (_nm.length > 31) {
				console.error("Name " + _nm + " will be truncated to " + _nm.slice(0, 31));
				_nm = _nm.slice(0, 31);
			}
			flen = 2 * (_nm.length + 1);
			o.write_shift(64, _nm, "utf16le");
			o.write_shift(2, flen);
			o.write_shift(1, file.type);
			o.write_shift(1, file.color);
			o.write_shift(-4, file.L);
			o.write_shift(-4, file.R);
			o.write_shift(-4, file.C);
			if (!file.clsid) for (j = 0; j < 4; ++j) o.write_shift(4, 0);
			else o.write_shift(16, file.clsid, "hex");
			o.write_shift(4, file.state || 0);
			o.write_shift(4, 0);
			o.write_shift(4, 0);
			o.write_shift(4, 0);
			o.write_shift(4, 0);
			o.write_shift(4, file.start);
			o.write_shift(4, file.size);
			o.write_shift(4, 0);
		}
		for (i = 1; i < cfb.FileIndex.length; ++i) {
			file = cfb.FileIndex[i];
			if (file.size >= 4096) {
				o.l = file.start + 1 << 9;
				if (has_buf && Buffer.isBuffer(file.content)) {
					file.content.copy(o, o.l, 0, file.size);
					o.l += file.size + 511 & -512;
				} else {
					for (j = 0; j < file.size; ++j) o.write_shift(1, file.content[j]);
					for (; j & 511; ++j) o.write_shift(1, 0);
				}
			}
		}
		for (i = 1; i < cfb.FileIndex.length; ++i) {
			file = cfb.FileIndex[i];
			if (file.size > 0 && file.size < 4096) if (has_buf && Buffer.isBuffer(file.content)) {
				file.content.copy(o, o.l, 0, file.size);
				o.l += file.size + 63 & -64;
			} else {
				for (j = 0; j < file.size; ++j) o.write_shift(1, file.content[j]);
				for (; j & 63; ++j) o.write_shift(1, 0);
			}
		}
		if (has_buf) o.l = o.length;
		else while (o.l < o.length) o.write_shift(1, 0);
		return o;
	}
	function find(cfb, path) {
		var UCFullPaths = cfb.FullPaths.map(function(x) {
			return x.toUpperCase();
		});
		var UCPaths = UCFullPaths.map(function(x) {
			var y = x.split("/");
			return y[y.length - (x.slice(-1) == "/" ? 2 : 1)];
		});
		var k = false;
		if (path.charCodeAt(0) === 47) {
			k = true;
			path = UCFullPaths[0].slice(0, -1) + path;
		} else k = path.indexOf("/") !== -1;
		var UCPath = path.toUpperCase();
		var w = k === true ? UCFullPaths.indexOf(UCPath) : UCPaths.indexOf(UCPath);
		if (w !== -1) return cfb.FileIndex[w];
		var m = !UCPath.match(chr1);
		UCPath = UCPath.replace(chr0, "");
		if (m) UCPath = UCPath.replace(chr1, "!");
		for (w = 0; w < UCFullPaths.length; ++w) {
			if ((m ? UCFullPaths[w].replace(chr1, "!") : UCFullPaths[w]).replace(chr0, "") == UCPath) return cfb.FileIndex[w];
			if ((m ? UCPaths[w].replace(chr1, "!") : UCPaths[w]).replace(chr0, "") == UCPath) return cfb.FileIndex[w];
		}
		return null;
	}
	/** CFB Constants */
	var MSSZ = 64;
	var ENDOFCHAIN = -2;
	var HEADER_SIGNATURE = "d0cf11e0a1b11ae1";
	var HEADER_SIG = [
		208,
		207,
		17,
		224,
		161,
		177,
		26,
		225
	];
	var HEADER_CLSID = "00000000000000000000000000000000";
	var consts = {
		MAXREGSECT: -6,
		DIFSECT: -4,
		FATSECT: -3,
		ENDOFCHAIN,
		FREESECT: -1,
		HEADER_SIGNATURE,
		HEADER_MINOR_VERSION: "3e00",
		MAXREGSID: -6,
		NOSTREAM: -1,
		HEADER_CLSID,
		EntryTypes: [
			"unknown",
			"storage",
			"stream",
			"lockbytes",
			"property",
			"root"
		]
	};
	function write_file(cfb, filename, options) {
		get_fs();
		var o = _write(cfb, options);
		fs.writeFileSync(filename, o);
	}
	function a2s(o) {
		var out = new Array(o.length);
		for (var i = 0; i < o.length; ++i) out[i] = String.fromCharCode(o[i]);
		return out.join("");
	}
	function write(cfb, options) {
		var o = _write(cfb, options);
		switch (options && options.type || "buffer") {
			case "file":
				get_fs();
				fs.writeFileSync(options.filename, o);
				return o;
			case "binary": return typeof o == "string" ? o : a2s(o);
			case "base64": return Base64_encode(typeof o == "string" ? o : a2s(o));
			case "buffer": if (has_buf) return Buffer.isBuffer(o) ? o : Buffer_from(o);
			case "array": return typeof o == "string" ? s2a(o) : o;
		}
		return o;
	}
	var _zlib;
	function use_zlib(zlib) {
		try {
			var InflateRaw = zlib.InflateRaw;
			var InflRaw = new InflateRaw();
			InflRaw._processChunk(new Uint8Array([3, 0]), InflRaw._finishFlushFlag);
			if (InflRaw.bytesRead) _zlib = zlib;
			else throw new Error("zlib does not expose bytesRead");
		} catch (e) {
			console.error("cannot use native zlib: " + (e.message || e));
		}
	}
	function _inflateRawSync(payload, usz) {
		if (!_zlib) return _inflate(payload, usz);
		var InflateRaw = _zlib.InflateRaw;
		var InflRaw = new InflateRaw();
		var out = InflRaw._processChunk(payload.slice(payload.l), InflRaw._finishFlushFlag);
		payload.l += InflRaw.bytesRead;
		return out;
	}
	function _deflateRawSync(payload) {
		return _zlib ? _zlib.deflateRawSync(payload) : _deflate(payload);
	}
	var CLEN_ORDER = [
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
	var LEN_LN = [
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
		258
	];
	var DST_LN = [
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
		24577
	];
	function bit_swap_8(n) {
		var t = (n << 1 | n << 11) & 139536 | (n << 5 | n << 15) & 558144;
		return (t >> 16 | t >> 8 | t) & 255;
	}
	var use_typed_arrays = typeof Uint8Array !== "undefined";
	var bitswap8 = use_typed_arrays ? /* @__PURE__ */ new Uint8Array(256) : [];
	for (var q = 0; q < 256; ++q) bitswap8[q] = bit_swap_8(q);
	function bit_swap_n(n, b) {
		var rev = bitswap8[n & 255];
		if (b <= 8) return rev >>> 8 - b;
		rev = rev << 8 | bitswap8[n >> 8 & 255];
		if (b <= 16) return rev >>> 16 - b;
		rev = rev << 8 | bitswap8[n >> 16 & 255];
		return rev >>> 24 - b;
	}
	function read_bits_2(buf, bl) {
		var w = bl & 7, h = bl >>> 3;
		return (buf[h] | (w <= 6 ? 0 : buf[h + 1] << 8)) >>> w & 3;
	}
	function read_bits_3(buf, bl) {
		var w = bl & 7, h = bl >>> 3;
		return (buf[h] | (w <= 5 ? 0 : buf[h + 1] << 8)) >>> w & 7;
	}
	function read_bits_4(buf, bl) {
		var w = bl & 7, h = bl >>> 3;
		return (buf[h] | (w <= 4 ? 0 : buf[h + 1] << 8)) >>> w & 15;
	}
	function read_bits_5(buf, bl) {
		var w = bl & 7, h = bl >>> 3;
		return (buf[h] | (w <= 3 ? 0 : buf[h + 1] << 8)) >>> w & 31;
	}
	function read_bits_7(buf, bl) {
		var w = bl & 7, h = bl >>> 3;
		return (buf[h] | (w <= 1 ? 0 : buf[h + 1] << 8)) >>> w & 127;
	}
	function read_bits_n(buf, bl, n) {
		var w = bl & 7, h = bl >>> 3, f = (1 << n) - 1;
		var v = buf[h] >>> w;
		if (n < 8 - w) return v & f;
		v |= buf[h + 1] << 8 - w;
		if (n < 16 - w) return v & f;
		v |= buf[h + 2] << 16 - w;
		if (n < 24 - w) return v & f;
		v |= buf[h + 3] << 24 - w;
		return v & f;
	}
	function write_bits_3(buf, bl, v) {
		var w = bl & 7, h = bl >>> 3;
		if (w <= 5) buf[h] |= (v & 7) << w;
		else {
			buf[h] |= v << w & 255;
			buf[h + 1] = (v & 7) >> 8 - w;
		}
		return bl + 3;
	}
	function write_bits_1(buf, bl, v) {
		var w = bl & 7, h = bl >>> 3;
		v = (v & 1) << w;
		buf[h] |= v;
		return bl + 1;
	}
	function write_bits_8(buf, bl, v) {
		var w = bl & 7, h = bl >>> 3;
		v <<= w;
		buf[h] |= v & 255;
		v >>>= 8;
		buf[h + 1] = v;
		return bl + 8;
	}
	function write_bits_16(buf, bl, v) {
		var w = bl & 7, h = bl >>> 3;
		v <<= w;
		buf[h] |= v & 255;
		v >>>= 8;
		buf[h + 1] = v & 255;
		buf[h + 2] = v >>> 8;
		return bl + 16;
	}
	function realloc(b, sz) {
		var L = b.length, M = 2 * L > sz ? 2 * L : sz + 5, i = 0;
		if (L >= sz) return b;
		if (has_buf) {
			var o = new_unsafe_buf(M);
			if (b.copy) b.copy(o);
			else for (; i < b.length; ++i) o[i] = b[i];
			return o;
		} else if (use_typed_arrays) {
			var a = new Uint8Array(M);
			if (a.set) a.set(b);
			else for (; i < L; ++i) a[i] = b[i];
			return a;
		}
		b.length = M;
		return b;
	}
	function zero_fill_array(n) {
		var o = new Array(n);
		for (var i = 0; i < n; ++i) o[i] = 0;
		return o;
	}
	function build_tree(clens, cmap, MAX) {
		var maxlen = 1, w = 0, i = 0, j = 0, ccode = 0, L = clens.length;
		var bl_count = use_typed_arrays ? /* @__PURE__ */ new Uint16Array(32) : zero_fill_array(32);
		for (i = 0; i < 32; ++i) bl_count[i] = 0;
		for (i = L; i < MAX; ++i) clens[i] = 0;
		L = clens.length;
		var ctree = use_typed_arrays ? new Uint16Array(L) : zero_fill_array(L);
		for (i = 0; i < L; ++i) {
			bl_count[w = clens[i]]++;
			if (maxlen < w) maxlen = w;
			ctree[i] = 0;
		}
		bl_count[0] = 0;
		for (i = 1; i <= maxlen; ++i) bl_count[i + 16] = ccode = ccode + bl_count[i - 1] << 1;
		for (i = 0; i < L; ++i) {
			ccode = clens[i];
			if (ccode != 0) ctree[i] = bl_count[ccode + 16]++;
		}
		var cleni = 0;
		for (i = 0; i < L; ++i) {
			cleni = clens[i];
			if (cleni != 0) {
				ccode = bit_swap_n(ctree[i], maxlen) >> maxlen - cleni;
				for (j = (1 << maxlen + 4 - cleni) - 1; j >= 0; --j) cmap[ccode | j << cleni] = cleni & 15 | i << 4;
			}
		}
		return maxlen;
	}
	var fix_lmap = use_typed_arrays ? /* @__PURE__ */ new Uint16Array(512) : zero_fill_array(512);
	var fix_dmap = use_typed_arrays ? /* @__PURE__ */ new Uint16Array(32) : zero_fill_array(32);
	if (!use_typed_arrays) {
		for (var i = 0; i < 512; ++i) fix_lmap[i] = 0;
		for (i = 0; i < 32; ++i) fix_dmap[i] = 0;
	}
	(function() {
		var dlens = [];
		var i = 0;
		for (; i < 32; i++) dlens.push(5);
		build_tree(dlens, fix_dmap, 32);
		var clens = [];
		i = 0;
		for (; i <= 143; i++) clens.push(8);
		for (; i <= 255; i++) clens.push(9);
		for (; i <= 279; i++) clens.push(7);
		for (; i <= 287; i++) clens.push(8);
		build_tree(clens, fix_lmap, 288);
	})();
	var _deflateRaw = /*#__PURE__*/ (function _deflateRawIIFE() {
		var DST_LN_RE = use_typed_arrays ? /* @__PURE__ */ new Uint8Array(32768) : [];
		var j = 0, k = 0;
		for (; j < DST_LN.length - 1; ++j) for (; k < DST_LN[j + 1]; ++k) DST_LN_RE[k] = j;
		for (; k < 32768; ++k) DST_LN_RE[k] = 29;
		var LEN_LN_RE = use_typed_arrays ? /* @__PURE__ */ new Uint8Array(259) : [];
		for (j = 0, k = 0; j < LEN_LN.length - 1; ++j) for (; k < LEN_LN[j + 1]; ++k) LEN_LN_RE[k] = j;
		function write_stored(data, out) {
			var boff = 0;
			while (boff < data.length) {
				var L = Math.min(65535, data.length - boff);
				var h = boff + L == data.length;
				out.write_shift(1, +h);
				out.write_shift(2, L);
				out.write_shift(2, ~L & 65535);
				while (L-- > 0) out[out.l++] = data[boff++];
			}
			return out.l;
		}
		function write_huff_fixed(data, out) {
			var bl = 0;
			var boff = 0;
			var addrs = use_typed_arrays ? /* @__PURE__ */ new Uint16Array(32768) : [];
			while (boff < data.length) {
				var L = Math.min(65535, data.length - boff);
				if (L < 10) {
					bl = write_bits_3(out, bl, +!!(boff + L == data.length));
					if (bl & 7) bl += 8 - (bl & 7);
					out.l = bl / 8 | 0;
					out.write_shift(2, L);
					out.write_shift(2, ~L & 65535);
					while (L-- > 0) out[out.l++] = data[boff++];
					bl = out.l * 8;
					continue;
				}
				bl = write_bits_3(out, bl, +!!(boff + L == data.length) + 2);
				var hash = 0;
				while (L-- > 0) {
					var d = data[boff];
					hash = (hash << 5 ^ d) & 32767;
					var match = -1, mlen = 0;
					if (match = addrs[hash]) {
						match |= boff & -32768;
						if (match > boff) match -= 32768;
						if (match < boff) while (data[match + mlen] == data[boff + mlen] && mlen < 250) ++mlen;
					}
					if (mlen > 2) {
						d = LEN_LN_RE[mlen];
						if (d <= 22) bl = write_bits_8(out, bl, bitswap8[d + 1] >> 1) - 1;
						else {
							write_bits_8(out, bl, 3);
							bl += 5;
							write_bits_8(out, bl, bitswap8[d - 23] >> 5);
							bl += 3;
						}
						var len_eb = d < 8 ? 0 : d - 4 >> 2;
						if (len_eb > 0) {
							write_bits_16(out, bl, mlen - LEN_LN[d]);
							bl += len_eb;
						}
						d = DST_LN_RE[boff - match];
						bl = write_bits_8(out, bl, bitswap8[d] >> 3);
						bl -= 3;
						var dst_eb = d < 4 ? 0 : d - 2 >> 1;
						if (dst_eb > 0) {
							write_bits_16(out, bl, boff - match - DST_LN[d]);
							bl += dst_eb;
						}
						for (var q = 0; q < mlen; ++q) {
							addrs[hash] = boff & 32767;
							hash = (hash << 5 ^ data[boff]) & 32767;
							++boff;
						}
						L -= mlen - 1;
					} else {
						if (d <= 143) d = d + 48;
						else bl = write_bits_1(out, bl, 1);
						bl = write_bits_8(out, bl, bitswap8[d]);
						addrs[hash] = boff & 32767;
						++boff;
					}
				}
				bl = write_bits_8(out, bl, 0) - 1;
			}
			out.l = (bl + 7) / 8 | 0;
			return out.l;
		}
		return function _deflateRaw(data, out) {
			if (data.length < 8) return write_stored(data, out);
			return write_huff_fixed(data, out);
		};
	})();
	function _deflate(data) {
		var buf = new_buf(50 + Math.floor(data.length * 1.1));
		var off = _deflateRaw(data, buf);
		return buf.slice(0, off);
	}
	var dyn_lmap = use_typed_arrays ? /* @__PURE__ */ new Uint16Array(32768) : zero_fill_array(32768);
	var dyn_dmap = use_typed_arrays ? /* @__PURE__ */ new Uint16Array(32768) : zero_fill_array(32768);
	var dyn_cmap = use_typed_arrays ? /* @__PURE__ */ new Uint16Array(128) : zero_fill_array(128);
	var dyn_len_1 = 1, dyn_len_2 = 1;
	function dyn(data, boff) {
		var _HLIT = read_bits_5(data, boff) + 257;
		boff += 5;
		var _HDIST = read_bits_5(data, boff) + 1;
		boff += 5;
		var _HCLEN = read_bits_4(data, boff) + 4;
		boff += 4;
		var w = 0;
		var clens = use_typed_arrays ? /* @__PURE__ */ new Uint8Array(19) : zero_fill_array(19);
		var ctree = [
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
			0,
			0,
			0
		];
		var maxlen = 1;
		var bl_count = use_typed_arrays ? /* @__PURE__ */ new Uint8Array(8) : zero_fill_array(8);
		var next_code = use_typed_arrays ? /* @__PURE__ */ new Uint8Array(8) : zero_fill_array(8);
		var L = clens.length;
		for (var i = 0; i < _HCLEN; ++i) {
			clens[CLEN_ORDER[i]] = w = read_bits_3(data, boff);
			if (maxlen < w) maxlen = w;
			bl_count[w]++;
			boff += 3;
		}
		var ccode = 0;
		bl_count[0] = 0;
		for (i = 1; i <= maxlen; ++i) next_code[i] = ccode = ccode + bl_count[i - 1] << 1;
		for (i = 0; i < L; ++i) if ((ccode = clens[i]) != 0) ctree[i] = next_code[ccode]++;
		var cleni = 0;
		for (i = 0; i < L; ++i) {
			cleni = clens[i];
			if (cleni != 0) {
				ccode = bitswap8[ctree[i]] >> 8 - cleni;
				for (var j = (1 << 7 - cleni) - 1; j >= 0; --j) dyn_cmap[ccode | j << cleni] = cleni & 7 | i << 3;
			}
		}
		var hcodes = [];
		maxlen = 1;
		for (; hcodes.length < _HLIT + _HDIST;) {
			ccode = dyn_cmap[read_bits_7(data, boff)];
			boff += ccode & 7;
			switch (ccode >>>= 3) {
				case 16:
					w = 3 + read_bits_2(data, boff);
					boff += 2;
					ccode = hcodes[hcodes.length - 1];
					while (w-- > 0) hcodes.push(ccode);
					break;
				case 17:
					w = 3 + read_bits_3(data, boff);
					boff += 3;
					while (w-- > 0) hcodes.push(0);
					break;
				case 18:
					w = 11 + read_bits_7(data, boff);
					boff += 7;
					while (w-- > 0) hcodes.push(0);
					break;
				default:
					hcodes.push(ccode);
					if (maxlen < ccode) maxlen = ccode;
			}
		}
		var h1 = hcodes.slice(0, _HLIT), h2 = hcodes.slice(_HLIT);
		for (i = _HLIT; i < 286; ++i) h1[i] = 0;
		for (i = _HDIST; i < 30; ++i) h2[i] = 0;
		dyn_len_1 = build_tree(h1, dyn_lmap, 286);
		dyn_len_2 = build_tree(h2, dyn_dmap, 30);
		return boff;
	}
	function inflate(data, usz) {
		if (data[0] == 3 && !(data[1] & 3)) return [new_raw_buf(usz), 2];
		var boff = 0;
		var header = 0;
		var outbuf = new_unsafe_buf(usz ? usz : 1 << 18);
		var woff = 0;
		var OL = outbuf.length >>> 0;
		var max_len_1 = 0, max_len_2 = 0;
		while ((header & 1) == 0) {
			header = read_bits_3(data, boff);
			boff += 3;
			if (header >>> 1 == 0) {
				if (boff & 7) boff += 8 - (boff & 7);
				var sz = data[boff >>> 3] | data[(boff >>> 3) + 1] << 8;
				boff += 32;
				if (sz > 0) {
					if (!usz && OL < woff + sz) {
						outbuf = realloc(outbuf, woff + sz);
						OL = outbuf.length;
					}
					while (sz-- > 0) {
						outbuf[woff++] = data[boff >>> 3];
						boff += 8;
					}
				}
				continue;
			} else if (header >> 1 == 1) {
				max_len_1 = 9;
				max_len_2 = 5;
			} else {
				boff = dyn(data, boff);
				max_len_1 = dyn_len_1;
				max_len_2 = dyn_len_2;
			}
			for (;;) {
				if (!usz && OL < woff + 32767) {
					outbuf = realloc(outbuf, woff + 32767);
					OL = outbuf.length;
				}
				var bits = read_bits_n(data, boff, max_len_1);
				var code = header >>> 1 == 1 ? fix_lmap[bits] : dyn_lmap[bits];
				boff += code & 15;
				code >>>= 4;
				if ((code >>> 8 & 255) === 0) outbuf[woff++] = code;
				else if (code == 256) break;
				else {
					code -= 257;
					var len_eb = code < 8 ? 0 : code - 4 >> 2;
					if (len_eb > 5) len_eb = 0;
					var tgt = woff + LEN_LN[code];
					if (len_eb > 0) {
						tgt += read_bits_n(data, boff, len_eb);
						boff += len_eb;
					}
					bits = read_bits_n(data, boff, max_len_2);
					code = header >>> 1 == 1 ? fix_dmap[bits] : dyn_dmap[bits];
					boff += code & 15;
					code >>>= 4;
					var dst_eb = code < 4 ? 0 : code - 2 >> 1;
					var dst = DST_LN[code];
					if (dst_eb > 0) {
						dst += read_bits_n(data, boff, dst_eb);
						boff += dst_eb;
					}
					if (!usz && OL < tgt) {
						outbuf = realloc(outbuf, tgt + 100);
						OL = outbuf.length;
					}
					while (woff < tgt) {
						outbuf[woff] = outbuf[woff - dst];
						++woff;
					}
				}
			}
		}
		if (usz) return [outbuf, boff + 7 >>> 3];
		return [outbuf.slice(0, woff), boff + 7 >>> 3];
	}
	function _inflate(payload, usz) {
		var out = inflate(payload.slice(payload.l || 0), usz);
		payload.l += out[1];
		return out[0];
	}
	function warn_or_throw(wrn, msg) {
		if (wrn) {
			if (typeof console !== "undefined") console.error(msg);
		} else throw new Error(msg);
	}
	function parse_zip(file, options) {
		var blob = file;
		prep_blob(blob, 0);
		var o = {
			FileIndex: [],
			FullPaths: []
		};
		init_cfb(o, { root: options.root });
		var i = blob.length - 4;
		while ((blob[i] != 80 || blob[i + 1] != 75 || blob[i + 2] != 5 || blob[i + 3] != 6) && i >= 0) --i;
		blob.l = i + 4;
		blob.l += 4;
		var fcnt = blob.read_shift(2);
		blob.l += 6;
		blob.l = blob.read_shift(4);
		for (i = 0; i < fcnt; ++i) {
			blob.l += 20;
			var csz = blob.read_shift(4);
			var usz = blob.read_shift(4);
			var namelen = blob.read_shift(2);
			var efsz = blob.read_shift(2);
			var fcsz = blob.read_shift(2);
			blob.l += 8;
			var offset = blob.read_shift(4);
			var EF = parse_extra_field(blob.slice(blob.l + namelen, blob.l + namelen + efsz));
			blob.l += namelen + efsz + fcsz;
			var L = blob.l;
			blob.l = offset + 4;
			if (EF && EF[1]) {
				if ((EF[1] || {}).usz) usz = EF[1].usz;
				if ((EF[1] || {}).csz) csz = EF[1].csz;
			}
			parse_local_file(blob, csz, usz, o, EF);
			blob.l = L;
		}
		return o;
	}
	function parse_local_file(blob, csz, usz, o, EF) {
		blob.l += 2;
		var flags = blob.read_shift(2);
		var meth = blob.read_shift(2);
		var date = parse_dos_date(blob);
		if (flags & 8257) throw new Error("Unsupported ZIP encryption");
		var crc32 = blob.read_shift(4);
		var _csz = blob.read_shift(4);
		var _usz = blob.read_shift(4);
		var namelen = blob.read_shift(2);
		var efsz = blob.read_shift(2);
		var name = "";
		for (var i = 0; i < namelen; ++i) name += String.fromCharCode(blob[blob.l++]);
		if (efsz) {
			var ef = parse_extra_field(blob.slice(blob.l, blob.l + efsz));
			if ((ef[21589] || {}).mt) date = ef[21589].mt;
			if ((ef[1] || {}).usz) _usz = ef[1].usz;
			if ((ef[1] || {}).csz) _csz = ef[1].csz;
			if (EF) {
				if ((EF[21589] || {}).mt) date = EF[21589].mt;
				if ((EF[1] || {}).usz) _usz = EF[1].usz;
				if ((EF[1] || {}).csz) _csz = EF[1].csz;
			}
		}
		blob.l += efsz;
		var data = blob.slice(blob.l, blob.l + _csz);
		switch (meth) {
			case 8:
				data = _inflateRawSync(blob, _usz);
				break;
			case 0:
				blob.l += _csz;
				break;
			default: throw new Error("Unsupported ZIP Compression method " + meth);
		}
		var wrn = false;
		if (flags & 8) {
			crc32 = blob.read_shift(4);
			if (crc32 == 134695760) {
				crc32 = blob.read_shift(4);
				wrn = true;
			}
			_csz = blob.read_shift(4);
			_usz = blob.read_shift(4);
		}
		if (_csz != csz) warn_or_throw(wrn, "Bad compressed size: " + csz + " != " + _csz);
		if (_usz != usz) warn_or_throw(wrn, "Bad uncompressed size: " + usz + " != " + _usz);
		cfb_add(o, name, data, {
			unsafe: true,
			mt: date
		});
	}
	function write_zip(cfb, options) {
		var _opts = options || {};
		var out = [], cdirs = [];
		var o = new_buf(1);
		var method = _opts.compression ? 8 : 0, flags = 0;
		var i = 0, j = 0;
		var start_cd = 0, fcnt = 0;
		var root = cfb.FullPaths[0], fp = root, fi = cfb.FileIndex[0];
		var crcs = [];
		var sz_cd = 0;
		for (i = 1; i < cfb.FullPaths.length; ++i) {
			fp = cfb.FullPaths[i].slice(root.length);
			fi = cfb.FileIndex[i];
			if (!fi.size || !fi.content || Array.isArray(fi.content) && fi.content.length == 0 || fp == "Sh33tJ5") continue;
			var start = start_cd;
			var namebuf = new_buf(fp.length);
			for (j = 0; j < fp.length; ++j) namebuf.write_shift(1, fp.charCodeAt(j) & 127);
			namebuf = namebuf.slice(0, namebuf.l);
			crcs[fcnt] = typeof fi.content == "string" ? CRC32.bstr(fi.content, 0) : CRC32.buf(fi.content, 0);
			var outbuf = typeof fi.content == "string" ? s2a(fi.content) : fi.content;
			if (method == 8) outbuf = _deflateRawSync(outbuf);
			o = new_buf(30);
			o.write_shift(4, 67324752);
			o.write_shift(2, 20);
			o.write_shift(2, flags);
			o.write_shift(2, method);
			if (fi.mt) write_dos_date(o, fi.mt);
			else o.write_shift(4, 0);
			o.write_shift(-4, flags & 8 ? 0 : crcs[fcnt]);
			o.write_shift(4, flags & 8 ? 0 : outbuf.length);
			o.write_shift(4, flags & 8 ? 0 : fi.content.length);
			o.write_shift(2, namebuf.length);
			o.write_shift(2, 0);
			start_cd += o.length;
			out.push(o);
			start_cd += namebuf.length;
			out.push(namebuf);
			start_cd += outbuf.length;
			out.push(outbuf);
			if (flags & 8) {
				o = new_buf(12);
				o.write_shift(-4, crcs[fcnt]);
				o.write_shift(4, outbuf.length);
				o.write_shift(4, fi.content.length);
				start_cd += o.l;
				out.push(o);
			}
			o = new_buf(46);
			o.write_shift(4, 33639248);
			o.write_shift(2, 0);
			o.write_shift(2, 20);
			o.write_shift(2, flags);
			o.write_shift(2, method);
			o.write_shift(4, 0);
			o.write_shift(-4, crcs[fcnt]);
			o.write_shift(4, outbuf.length);
			o.write_shift(4, fi.content.length);
			o.write_shift(2, namebuf.length);
			o.write_shift(2, 0);
			o.write_shift(2, 0);
			o.write_shift(2, 0);
			o.write_shift(2, 0);
			o.write_shift(4, 0);
			o.write_shift(4, start);
			sz_cd += o.l;
			cdirs.push(o);
			sz_cd += namebuf.length;
			cdirs.push(namebuf);
			++fcnt;
		}
		o = new_buf(22);
		o.write_shift(4, 101010256);
		o.write_shift(2, 0);
		o.write_shift(2, 0);
		o.write_shift(2, fcnt);
		o.write_shift(2, fcnt);
		o.write_shift(4, sz_cd);
		o.write_shift(4, start_cd);
		o.write_shift(2, 0);
		return bconcat([
			bconcat(out),
			bconcat(cdirs),
			o
		]);
	}
	var ContentTypeMap = {
		"htm": "text/html",
		"xml": "text/xml",
		"gif": "image/gif",
		"jpg": "image/jpeg",
		"png": "image/png",
		"mso": "application/x-mso",
		"thmx": "application/vnd.ms-officetheme",
		"sh33tj5": "application/octet-stream"
	};
	function get_content_type(fi, fp) {
		if (fi.ctype) return fi.ctype;
		var ext = fi.name || "", m = ext.match(/\.([^\.]+)$/);
		if (m && ContentTypeMap[m[1]]) return ContentTypeMap[m[1]];
		if (fp) {
			m = (ext = fp).match(/[\.\\]([^\.\\])+$/);
			if (m && ContentTypeMap[m[1]]) return ContentTypeMap[m[1]];
		}
		return "application/octet-stream";
	}
	function write_base64_76(bstr) {
		var data = Base64_encode(bstr);
		var o = [];
		for (var i = 0; i < data.length; i += 76) o.push(data.slice(i, i + 76));
		return o.join("\r\n") + "\r\n";
	}
	function write_quoted_printable(text) {
		var encoded = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF=]/g, function(c) {
			var w = c.charCodeAt(0).toString(16).toUpperCase();
			return "=" + (w.length == 1 ? "0" + w : w);
		});
		encoded = encoded.replace(/ $/gm, "=20").replace(/\t$/gm, "=09");
		if (encoded.charAt(0) == "\n") encoded = "=0D" + encoded.slice(1);
		encoded = encoded.replace(/\r(?!\n)/gm, "=0D").replace(/\n\n/gm, "\n=0A").replace(/([^\r\n])\n/gm, "$1=0A");
		var o = [], split = encoded.split("\r\n");
		for (var si = 0; si < split.length; ++si) {
			var str = split[si];
			if (str.length == 0) {
				o.push("");
				continue;
			}
			for (var i = 0; i < str.length;) {
				var end = 76;
				var tmp = str.slice(i, i + end);
				if (tmp.charAt(end - 1) == "=") end--;
				else if (tmp.charAt(end - 2) == "=") end -= 2;
				else if (tmp.charAt(end - 3) == "=") end -= 3;
				tmp = str.slice(i, i + end);
				i += end;
				if (i < str.length) tmp += "=";
				o.push(tmp);
			}
		}
		return o.join("\r\n");
	}
	function parse_quoted_printable(data) {
		var o = [];
		for (var di = 0; di < data.length; ++di) {
			var line = data[di];
			while (di <= data.length && line.charAt(line.length - 1) == "=") line = line.slice(0, line.length - 1) + data[++di];
			o.push(line);
		}
		for (var oi = 0; oi < o.length; ++oi) o[oi] = o[oi].replace(/[=][0-9A-Fa-f]{2}/g, function($$) {
			return String.fromCharCode(parseInt($$.slice(1), 16));
		});
		return s2a(o.join("\r\n"));
	}
	function parse_mime(cfb, data, root) {
		var fname = "", cte = "", ctype = "", fdata;
		var di = 0;
		for (; di < 10; ++di) {
			var line = data[di];
			if (!line || line.match(/^\s*$/)) break;
			var m = line.match(/^([^:]*?):\s*([^\s].*)$/);
			if (m) switch (m[1].toLowerCase()) {
				case "content-location":
					fname = m[2].trim();
					break;
				case "content-type":
					ctype = m[2].trim();
					break;
				case "content-transfer-encoding":
					cte = m[2].trim();
					break;
			}
		}
		++di;
		switch (cte.toLowerCase()) {
			case "base64":
				fdata = s2a(Base64_decode(data.slice(di).join("")));
				break;
			case "quoted-printable":
				fdata = parse_quoted_printable(data.slice(di));
				break;
			default: throw new Error("Unsupported Content-Transfer-Encoding " + cte);
		}
		var file = cfb_add(cfb, fname.slice(root.length), fdata, { unsafe: true });
		if (ctype) file.ctype = ctype;
	}
	function parse_mad(file, options) {
		if (a2s(file.slice(0, 13)).toLowerCase() != "mime-version:") throw new Error("Unsupported MAD header");
		var root = options && options.root || "";
		var data = (has_buf && Buffer.isBuffer(file) ? file.toString("binary") : a2s(file)).split("\r\n");
		var di = 0, row = "";
		for (di = 0; di < data.length; ++di) {
			row = data[di];
			if (!/^Content-Location:/i.test(row)) continue;
			row = row.slice(row.indexOf("file"));
			if (!root) root = row.slice(0, row.lastIndexOf("/") + 1);
			if (row.slice(0, root.length) == root) continue;
			while (root.length > 0) {
				root = root.slice(0, root.length - 1);
				root = root.slice(0, root.lastIndexOf("/") + 1);
				if (row.slice(0, root.length) == root) break;
			}
		}
		var mboundary = (data[1] || "").match(/boundary="(.*?)"/);
		if (!mboundary) throw new Error("MAD cannot find boundary");
		var boundary = "--" + (mboundary[1] || "");
		var o = {
			FileIndex: [],
			FullPaths: []
		};
		init_cfb(o);
		var start_di, fcnt = 0;
		for (di = 0; di < data.length; ++di) {
			var line = data[di];
			if (line !== boundary && line !== boundary + "--") continue;
			if (fcnt++) parse_mime(o, data.slice(start_di, di), root);
			start_di = di;
		}
		return o;
	}
	function write_mad(cfb, options) {
		var opts = options || {};
		var boundary = opts.boundary || "SheetJS";
		boundary = "------=" + boundary;
		var out = [
			"MIME-Version: 1.0",
			"Content-Type: multipart/related; boundary=\"" + boundary.slice(2) + "\"",
			"",
			"",
			""
		];
		var root = cfb.FullPaths[0], fp = root, fi = cfb.FileIndex[0];
		for (var i = 1; i < cfb.FullPaths.length; ++i) {
			fp = cfb.FullPaths[i].slice(root.length);
			fi = cfb.FileIndex[i];
			if (!fi.size || !fi.content || fp == "Sh33tJ5") continue;
			fp = fp.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF]/g, function(c) {
				return "_x" + c.charCodeAt(0).toString(16) + "_";
			}).replace(/[\u0080-\uFFFF]/g, function(u) {
				return "_u" + u.charCodeAt(0).toString(16) + "_";
			});
			var ca = fi.content;
			var cstr = has_buf && Buffer.isBuffer(ca) ? ca.toString("binary") : a2s(ca);
			var dispcnt = 0, L = Math.min(1024, cstr.length), cc = 0;
			for (var csl = 0; csl <= L; ++csl) if ((cc = cstr.charCodeAt(csl)) >= 32 && cc < 128) ++dispcnt;
			var qp = dispcnt >= L * 4 / 5;
			out.push(boundary);
			out.push("Content-Location: " + (opts.root || "file:///C:/SheetJS/") + fp);
			out.push("Content-Transfer-Encoding: " + (qp ? "quoted-printable" : "base64"));
			out.push("Content-Type: " + get_content_type(fi, fp));
			out.push("");
			out.push(qp ? write_quoted_printable(cstr) : write_base64_76(cstr));
		}
		out.push(boundary + "--\r\n");
		return out.join("\r\n");
	}
	function cfb_new(opts) {
		var o = {};
		init_cfb(o, opts);
		return o;
	}
	function cfb_add(cfb, name, content, opts) {
		var unsafe = opts && opts.unsafe;
		if (!unsafe) init_cfb(cfb);
		var file = !unsafe && CFB.find(cfb, name);
		if (!file) {
			var fpath = cfb.FullPaths[0];
			if (name.slice(0, fpath.length) == fpath) fpath = name;
			else {
				if (fpath.slice(-1) != "/") fpath += "/";
				fpath = (fpath + name).replace("//", "/");
			}
			file = {
				name: filename(name),
				type: 2
			};
			cfb.FileIndex.push(file);
			cfb.FullPaths.push(fpath);
			if (!unsafe) CFB.utils.cfb_gc(cfb);
		}
		file.content = content;
		file.size = content ? content.length : 0;
		if (opts) {
			if (opts.CLSID) file.clsid = opts.CLSID;
			if (opts.mt) file.mt = opts.mt;
			if (opts.ct) file.ct = opts.ct;
		}
		return file;
	}
	function cfb_del(cfb, name) {
		init_cfb(cfb);
		var file = CFB.find(cfb, name);
		if (file) {
			for (var j = 0; j < cfb.FileIndex.length; ++j) if (cfb.FileIndex[j] == file) {
				cfb.FileIndex.splice(j, 1);
				cfb.FullPaths.splice(j, 1);
				return true;
			}
		}
		return false;
	}
	function cfb_mov(cfb, old_name, new_name) {
		init_cfb(cfb);
		var file = CFB.find(cfb, old_name);
		if (file) {
			for (var j = 0; j < cfb.FileIndex.length; ++j) if (cfb.FileIndex[j] == file) {
				cfb.FileIndex[j].name = filename(new_name);
				cfb.FullPaths[j] = new_name;
				return true;
			}
		}
		return false;
	}
	function cfb_gc(cfb) {
		rebuild_cfb(cfb, true);
	}
	exports.find = find;
	exports.read = read;
	exports.parse = parse;
	exports.write = write;
	exports.writeFile = write_file;
	exports.utils = {
		cfb_new,
		cfb_add,
		cfb_del,
		cfb_mov,
		cfb_gc,
		ReadShift,
		CheckField,
		prep_blob,
		bconcat,
		use_zlib,
		_deflateRaw: _deflate,
		_inflateRaw: _inflate,
		consts
	};
	return exports;
})();
var _fs;
function read_binary(path) {
	if (typeof _fs !== "undefined") return _fs.readFileSync(path);
	if (typeof Deno !== "undefined") return Deno.readFileSync(path);
	if (typeof $ !== "undefined" && typeof File !== "undefined" && typeof Folder !== "undefined") try {
		var infile = File(path);
		infile.open("r");
		infile.encoding = "binary";
		var data = infile.read();
		infile.close();
		return data;
	} catch (e) {
		if (!e.message || e.message.indexOf("onstruct") == -1) throw e;
	}
	throw new Error("Cannot access file " + path);
}
function keys(o) {
	var ks = Object.keys(o), o2 = [];
	for (var i = 0; i < ks.length; ++i) if (Object.prototype.hasOwnProperty.call(o, ks[i])) o2.push(ks[i]);
	return o2;
}
function evert(obj) {
	var o = [], K = keys(obj);
	for (var i = 0; i !== K.length; ++i) o[obj[K[i]]] = K[i];
	return o;
}
var dnthresh = /*#__PURE__*/ Date.UTC(1899, 11, 30, 0, 0, 0);
var dnthresh1 = /*#__PURE__*/ Date.UTC(1899, 11, 31, 0, 0, 0);
var dnthresh2 = /*#__PURE__*/ Date.UTC(1904, 0, 1, 0, 0, 0);
function datenum(v, date1904) {
	var res = (/* @__PURE__ */ v.getTime() - dnthresh) / 864e5;
	if (date1904) {
		res -= 1462;
		return res < -1402 ? res - 1 : res;
	}
	return res < 60 ? res - 1 : res;
}
function numdate(v) {
	if (v >= 60 && v < 61) return v;
	var out = /* @__PURE__ */ new Date();
	out.setTime((v > 60 ? v : v + 1) * 24 * 60 * 60 * 1e3 + dnthresh);
	return out;
}
function parse_isodur(s) {
	var sec = 0, mt = 0, time = false;
	var m = s.match(/P([0-9\.]+Y)?([0-9\.]+M)?([0-9\.]+D)?T([0-9\.]+H)?([0-9\.]+M)?([0-9\.]+S)?/);
	if (!m) throw new Error("|" + s + "| is not an ISO8601 Duration");
	for (var i = 1; i != m.length; ++i) {
		if (!m[i]) continue;
		mt = 1;
		if (i > 3) time = true;
		switch (m[i].slice(m[i].length - 1)) {
			case "Y": throw new Error("Unsupported ISO Duration Field: " + m[i].slice(m[i].length - 1));
			case "D": mt *= 24;
			case "H": mt *= 60;
			case "M": if (!time) throw new Error("Unsupported ISO Duration Field: M");
			else mt *= 60;
		}
		sec += mt * parseInt(m[i], 10);
	}
	return sec;
}
var pdre1 = /^(\d+):(\d+)(:\d+)?(\.\d+)?$/;
var pdre2 = /^(\d+)-(\d+)-(\d+)$/;
var pdre3 = /^(\d+)-(\d+)-(\d+)[T ](\d+):(\d+)(:\d+)?(\.\d+)?$/;
function parseDate(str, date1904) {
	if (str instanceof Date) return str;
	var m = str.match(pdre1);
	if (m) return new Date((date1904 ? dnthresh2 : dnthresh1) + ((parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) * 60 + (m[3] ? parseInt(m[3].slice(1), 10) : 0)) * 1e3 + (m[4] ? parseInt((m[4] + "000").slice(1, 4), 10) : 0));
	m = str.match(pdre2);
	if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 0, 0, 0, 0));
	m = str.match(pdre3);
	if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] && parseInt(m[6].slice(1), 10) || 0, m[7] && parseInt((m[7] + "0000").slice(1, 4), 10) || 0));
	return new Date(str);
}
function cc2str(arr, debomit) {
	if (has_buf && Buffer.isBuffer(arr)) {
		if (debomit && buf_utf16le) {
			if (arr[0] == 255 && arr[1] == 254) return utf8write(arr.slice(2).toString("utf16le"));
			if (arr[1] == 254 && arr[2] == 255) return utf8write(utf16beread(arr.slice(2).toString("binary")));
		}
		return arr.toString("binary");
	}
	if (typeof TextDecoder !== "undefined") try {
		if (debomit) {
			if (arr[0] == 255 && arr[1] == 254) return utf8write(new TextDecoder("utf-16le").decode(arr.slice(2)));
			if (arr[0] == 254 && arr[1] == 255) return utf8write(new TextDecoder("utf-16be").decode(arr.slice(2)));
		}
		var rev = {
			"€": "",
			"‚": "",
			"ƒ": "",
			"„": "",
			"…": "",
			"†": "",
			"‡": "",
			"ˆ": "",
			"‰": "",
			"Š": "",
			"‹": "",
			"Œ": "",
			"Ž": "",
			"‘": "",
			"’": "",
			"“": "",
			"”": "",
			"•": "",
			"–": "",
			"—": "",
			"˜": "",
			"™": "",
			"š": "",
			"›": "",
			"œ": "",
			"ž": "",
			"Ÿ": ""
		};
		if (Array.isArray(arr)) arr = new Uint8Array(arr);
		return new TextDecoder("latin1").decode(arr).replace(/[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g, function(c) {
			return rev[c] || c;
		});
	} catch (e) {}
	var o = [], i = 0;
	try {
		for (i = 0; i < arr.length - 65536; i += 65536) o.push(String.fromCharCode.apply(0, arr.slice(i, i + 65536)));
		o.push(String.fromCharCode.apply(0, arr.slice(i)));
	} catch (e) {
		try {
			for (; i < arr.length - 16384; i += 16384) o.push(String.fromCharCode.apply(0, arr.slice(i, i + 16384)));
			o.push(String.fromCharCode.apply(0, arr.slice(i)));
		} catch (e) {
			for (; i != arr.length; ++i) o.push(String.fromCharCode(arr[i]));
		}
	}
	return o.join("");
}
function dup(o) {
	if (typeof JSON != "undefined" && !Array.isArray(o)) return JSON.parse(JSON.stringify(o));
	if (typeof o != "object" || o == null) return o;
	if (o instanceof Date) return new Date(o.getTime());
	var out = {};
	for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = dup(o[k]);
	return out;
}
function fill(c, l) {
	var o = "";
	while (o.length < l) o += c;
	return o;
}
function fuzzynum(s) {
	var v = Number(s);
	if (!isNaN(v)) return isFinite(v) ? v : NaN;
	if (!/\d/.test(s)) return v;
	var wt = 1;
	var ss = s.replace(/([\d]),([\d])/g, "$1$2").replace(/[$]/g, "").replace(/[%]/g, function() {
		wt *= 100;
		return "";
	});
	if (!isNaN(v = Number(ss))) return v / wt;
	ss = ss.replace(/[(]([^()]*)[)]/, function($$, $1) {
		wt = -wt;
		return $1;
	});
	if (!isNaN(v = Number(ss))) return v / wt;
	return v;
}
var FDRE1 = /^(0?\d|1[0-2])(?:|:([0-5]?\d)(?:|(\.\d+)(?:|:([0-5]?\d))|:([0-5]?\d)(|\.\d+)))\s+([ap])m?$/;
var FDRE2 = /^([01]?\d|2[0-3])(?:|:([0-5]?\d)(?:|(\.\d+)(?:|:([0-5]?\d))|:([0-5]?\d)(|\.\d+)))$/;
var FDISO = /^(\d+)-(\d+)-(\d+)[T ](\d+):(\d+)(:\d+)(\.\d+)?[Z]?$/;
var utc_append_works = (/* @__PURE__ */ new Date("6/9/69 00:00 UTC")).valueOf() == -177984e5;
function fuzzytime1(M) {
	if (!M[2]) return new Date(Date.UTC(1899, 11, 31, +M[1] % 12 + (M[7] == "p" ? 12 : 0), 0, 0, 0));
	if (M[3]) if (M[4]) return new Date(Date.UTC(1899, 11, 31, +M[1] % 12 + (M[7] == "p" ? 12 : 0), +M[2], +M[4], parseFloat(M[3]) * 1e3));
	else return new Date(Date.UTC(1899, 11, 31, M[7] == "p" ? 12 : 0, +M[1], +M[2], parseFloat(M[3]) * 1e3));
	else if (M[5]) return new Date(Date.UTC(1899, 11, 31, +M[1] % 12 + (M[7] == "p" ? 12 : 0), +M[2], +M[5], M[6] ? parseFloat(M[6]) * 1e3 : 0));
	else return new Date(Date.UTC(1899, 11, 31, +M[1] % 12 + (M[7] == "p" ? 12 : 0), +M[2], 0, 0));
}
function fuzzytime2(M) {
	if (!M[2]) return new Date(Date.UTC(1899, 11, 31, +M[1], 0, 0, 0));
	if (M[3]) if (M[4]) return new Date(Date.UTC(1899, 11, 31, +M[1], +M[2], +M[4], parseFloat(M[3]) * 1e3));
	else return new Date(Date.UTC(1899, 11, 31, 0, +M[1], +M[2], parseFloat(M[3]) * 1e3));
	else if (M[5]) return new Date(Date.UTC(1899, 11, 31, +M[1], +M[2], +M[5], M[6] ? parseFloat(M[6]) * 1e3 : 0));
	else return new Date(Date.UTC(1899, 11, 31, +M[1], +M[2], 0, 0));
}
var lower_months = [
	"january",
	"february",
	"march",
	"april",
	"may",
	"june",
	"july",
	"august",
	"september",
	"october",
	"november",
	"december"
];
function fuzzydate(s) {
	if (FDISO.test(s)) return s.indexOf("Z") == -1 ? local_to_utc(new Date(s)) : new Date(s);
	var lower = s.toLowerCase();
	var lnos = lower.replace(/\s+/g, " ").trim();
	var M = lnos.match(FDRE1);
	if (M) return fuzzytime1(M);
	M = lnos.match(FDRE2);
	if (M) return fuzzytime2(M);
	M = lnos.match(pdre3);
	if (M) return new Date(Date.UTC(+M[1], +M[2] - 1, +M[3], +M[4], +M[5], M[6] && parseInt(M[6].slice(1), 10) || 0, M[7] && parseInt((M[7] + "0000").slice(1, 4), 10) || 0));
	var o = new Date(utc_append_works && s.indexOf("UTC") == -1 ? s + " UTC" : s), n = /* @__PURE__ */ new Date(NaN), y = o.getYear();
	o.getMonth();
	var d = o.getDate();
	if (isNaN(d)) return n;
	if (lower.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/)) {
		lower = lower.replace(/[^a-z]/g, "").replace(/([^a-z]|^)[ap]m?([^a-z]|$)/, "");
		if (lower.length > 3 && lower_months.indexOf(lower) == -1) return n;
	} else if (lower.replace(/[ap]m?/, "").match(/[a-z]/)) return n;
	if (y < 0 || y > 8099 || s.match(/[^-0-9:,\/\\\ ]/)) return n;
	return o;
}
var split_regex = /*#__PURE__*/ (function() {
	var safe_split_regex = "abacaba".split(/(:?b)/i).length == 5;
	return function split_regex(str, re, def) {
		if (safe_split_regex || typeof re == "string") return str.split(re);
		var p = str.split(re), o = [p[0]];
		for (var i = 1; i < p.length; ++i) {
			o.push(def);
			o.push(p[i]);
		}
		return o;
	};
})();
function utc_to_local(utc) {
	return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), utc.getUTCHours(), utc.getUTCMinutes(), utc.getUTCSeconds(), utc.getUTCMilliseconds());
}
function local_to_utc(local) {
	return new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), local.getHours(), local.getMinutes(), local.getSeconds(), local.getMilliseconds()));
}
function remove_doctype(str) {
	var si = str.slice(0, 1024).indexOf("<!DOCTYPE");
	if (si == -1) return str;
	var m = str.match(/<[\w]/);
	if (!m) return str;
	return str.slice(0, si) + str.slice(m.index);
}
function str_match_ng(str, s, e) {
	var out = [];
	var si = str.indexOf(s);
	while (si > -1) {
		var ei = str.indexOf(e, si + s.length);
		if (ei == -1) break;
		out.push(str.slice(si, ei + e.length));
		si = str.indexOf(s, ei + e.length);
	}
	return out.length > 0 ? out : null;
}
function str_remove_ng(str, s, e) {
	var out = [], last = 0;
	var si = str.indexOf(s);
	if (si == -1) return str;
	while (si > -1) {
		out.push(str.slice(last, si));
		var ei = str.indexOf(e, si + s.length);
		if (ei == -1) break;
		if ((si = str.indexOf(s, last = ei + e.length)) == -1) out.push(str.slice(last));
	}
	return out.join("");
}
var xml_boundary = {
	" ": 1,
	"	": 1,
	"\r": 1,
	"\n": 1,
	">": 1
};
function str_match_xml(str, tag) {
	var si = str.indexOf("<" + tag), w = tag.length + 1, L = str.length;
	while (si >= 0 && si <= L - w && !xml_boundary[str.charAt(si + w)]) si = str.indexOf("<" + tag, si + 1);
	if (si === -1) return null;
	var sf = str.indexOf(">", si + tag.length);
	if (sf === -1) return null;
	var et = "</" + tag + ">";
	var ei = str.indexOf(et, sf);
	if (ei == -1) return null;
	return [str.slice(si, ei + et.length), str.slice(sf + 1, ei)];
}
var str_match_xml_ns = /*#__PURE__*/ (function() {
	var str_match_xml_ns_cache = {};
	return function str_match_xml_ns(str, tag) {
		var res = str_match_xml_ns_cache[tag];
		if (!res) str_match_xml_ns_cache[tag] = res = [new RegExp("<(?:\\w+:)?" + tag + "\\b[^<>]*>", "g"), new RegExp("</(?:\\w+:)?" + tag + ">", "g")];
		res[0].lastIndex = res[1].lastIndex = 0;
		var m = res[0].exec(str);
		if (!m) return null;
		var si = m.index;
		var sf = res[0].lastIndex;
		res[1].lastIndex = res[0].lastIndex;
		m = res[1].exec(str);
		if (!m) return null;
		var ei = m.index;
		var ef = res[1].lastIndex;
		return [str.slice(si, ef), str.slice(sf, ei)];
	};
})();
var str_match_xml_ns_g = /*#__PURE__*/ (function() {
	var str_match_xml_ns_cache = {};
	return function str_match_xml_ns(str, tag) {
		var out = [];
		var res = str_match_xml_ns_cache[tag];
		if (!res) str_match_xml_ns_cache[tag] = res = [new RegExp("<(?:\\w+:)?" + tag + "\\b[^<>]*>", "g"), new RegExp("</(?:\\w+:)?" + tag + ">", "g")];
		res[0].lastIndex = res[1].lastIndex = 0;
		var m;
		while (m = res[0].exec(str)) {
			var si = m.index;
			res[1].lastIndex = res[0].lastIndex;
			m = res[1].exec(str);
			if (!m) return null;
			var ef = res[1].lastIndex;
			out.push(str.slice(si, ef));
			res[0].lastIndex = res[1].lastIndex;
		}
		return out.length == 0 ? null : out;
	};
})();
var str_remove_xml_ns_g = /*#__PURE__*/ (function() {
	var str_remove_xml_ns_cache = {};
	return function str_remove_xml_ns_g(str, tag) {
		var out = [];
		var res = str_remove_xml_ns_cache[tag];
		if (!res) str_remove_xml_ns_cache[tag] = res = [new RegExp("<(?:\\w+:)?" + tag + "\\b[^<>]*>", "g"), new RegExp("</(?:\\w+:)?" + tag + ">", "g")];
		res[0].lastIndex = res[1].lastIndex = 0;
		var m;
		var si = 0, ef = 0;
		while (m = res[0].exec(str)) {
			si = m.index;
			out.push(str.slice(ef, si));
			ef = si;
			res[1].lastIndex = res[0].lastIndex;
			m = res[1].exec(str);
			if (!m) return null;
			ef = res[1].lastIndex;
			res[0].lastIndex = res[1].lastIndex;
		}
		out.push(str.slice(ef));
		return out.length == 0 ? "" : out.join("");
	};
})();
var str_match_xml_ig = /*#__PURE__*/ (function() {
	var str_match_xml_ns_cache = {};
	return function str_match_xml_ns(str, tag) {
		var out = [];
		var res = str_match_xml_ns_cache[tag];
		if (!res) str_match_xml_ns_cache[tag] = res = [new RegExp("<" + tag + "\\b[^<>]*>", "ig"), new RegExp("</" + tag + ">", "ig")];
		res[0].lastIndex = res[1].lastIndex = 0;
		var m;
		while (m = res[0].exec(str)) {
			var si = m.index;
			res[1].lastIndex = res[0].lastIndex;
			m = res[1].exec(str);
			if (!m) return null;
			var ef = res[1].lastIndex;
			out.push(str.slice(si, ef));
			res[0].lastIndex = res[1].lastIndex;
		}
		return out.length == 0 ? null : out;
	};
})();
function getdatastr(data) {
	if (!data) return null;
	if (data.content && data.type) return cc2str(data.content, true);
	if (data.data) return debom(data.data);
	if (data.asNodeBuffer && has_buf) return debom(data.asNodeBuffer().toString("binary"));
	if (data.asBinary) return debom(data.asBinary());
	if (data._data && data._data.getContent) return debom(cc2str(Array.prototype.slice.call(data._data.getContent(), 0)));
	return null;
}
function getdatabin(data) {
	if (!data) return null;
	if (data.data) return char_codes(data.data);
	if (data.asNodeBuffer && has_buf) return data.asNodeBuffer();
	if (data._data && data._data.getContent) {
		var o = data._data.getContent();
		if (typeof o == "string") return char_codes(o);
		return Array.prototype.slice.call(o);
	}
	if (data.content && data.type) return data.content;
	return null;
}
function getdata(data) {
	return data && data.name.slice(-4) === ".bin" ? getdatabin(data) : getdatastr(data);
}
function safegetzipfile(zip, file) {
	var k = zip.FullPaths || keys(zip.files);
	var f = file.toLowerCase().replace(/[\/]/g, "\\"), g = f.replace(/\\/g, "/");
	for (var i = 0; i < k.length; ++i) {
		var n = k[i].replace(/^Root Entry[\/]/, "").toLowerCase();
		if (f == n || g == n) return zip.files ? zip.files[k[i]] : zip.FileIndex[i];
	}
	return null;
}
function getzipfile(zip, file) {
	var o = safegetzipfile(zip, file);
	if (o == null) throw new Error("Cannot find file " + file + " in zip");
	return o;
}
function getzipdata(zip, file, safe) {
	if (!safe) return getdata(getzipfile(zip, file));
	if (!file) return null;
	try {
		return getzipdata(zip, file);
	} catch (e) {
		return null;
	}
}
function getzipstr(zip, file, safe) {
	if (!safe) return getdatastr(getzipfile(zip, file));
	if (!file) return null;
	try {
		return getzipstr(zip, file);
	} catch (e) {
		return null;
	}
}
function getzipbin(zip, file, safe) {
	if (!safe) return getdatabin(getzipfile(zip, file));
	if (!file) return null;
	try {
		return getzipbin(zip, file);
	} catch (e) {
		return null;
	}
}
function zipentries(zip) {
	var k = zip.FullPaths || keys(zip.files), o = [];
	for (var i = 0; i < k.length; ++i) if (k[i].slice(-1) != "/") o.push(k[i].replace(/^Root Entry[\/]/, ""));
	return o.sort();
}
function zip_add_file(zip, path, content) {
	if (zip.FullPaths) {
		if (Array.isArray(content) && typeof content[0] == "string") content = content.join("");
		if (typeof content == "string") {
			var res;
			if (has_buf) res = Buffer_from(content);
			else res = utf8decode(content);
			return CFB.utils.cfb_add(zip, path, res);
		}
		CFB.utils.cfb_add(zip, path, content);
	} else zip.file(path, content);
}
function zip_read(d, o) {
	switch (o.type) {
		case "base64": return CFB.read(d, { type: "base64" });
		case "binary": return CFB.read(d, { type: "binary" });
		case "buffer":
		case "array": return CFB.read(d, { type: "buffer" });
	}
	throw new Error("Unrecognized type " + o.type);
}
function resolve_path(path, base) {
	if (path.charAt(0) == "/") return path.slice(1);
	var result = base.split("/");
	if (base.slice(-1) != "/") result.pop();
	var target = path.split("/");
	while (target.length !== 0) {
		var step = target.shift();
		if (step === "..") result.pop();
		else if (step !== ".") result.push(step);
	}
	return result.join("/");
}
var XML_HEADER = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\r\n";
var attregexg = /\s([^"\s?>\/]+)\s*=\s*((?:")([^"]*)(?:")|(?:')([^']*)(?:')|([^'">\s]+))/g;
var tagregex1 = /<[\/\?]?[a-zA-Z0-9:_-]+(?:\s+[^"\s?<>\/]+\s*=\s*(?:"[^"]*"|'[^']*'|[^'"<>\s=]+))*\s*[\/\?]?>/gm;
var tagregex = /*#__PURE__*/ XML_HEADER.match(tagregex1) ? tagregex1 : /<[^<>]*>/g;
var nsregex = /<\w*:/;
var nsregex2 = /<(\/?)\w+:/;
function parsexmltag(tag, skip_root, skip_LC) {
	var z = {};
	var eq = 0, c = 0;
	for (; eq !== tag.length; ++eq) if ((c = tag.charCodeAt(eq)) === 32 || c === 10 || c === 13) break;
	if (!skip_root) z[0] = tag.slice(0, eq);
	if (eq === tag.length) return z;
	var m = tag.match(attregexg), j = 0, v = "", i = 0, q = "", cc = "", quot = 1;
	if (m) for (i = 0; i != m.length; ++i) {
		cc = m[i].slice(1);
		for (c = 0; c != cc.length; ++c) if (cc.charCodeAt(c) === 61) break;
		q = cc.slice(0, c).trim();
		while (cc.charCodeAt(c + 1) == 32) ++c;
		quot = (eq = cc.charCodeAt(c + 1)) == 34 || eq == 39 ? 1 : 0;
		v = cc.slice(c + 1 + quot, cc.length - quot);
		for (j = 0; j != q.length; ++j) if (q.charCodeAt(j) === 58) break;
		if (j === q.length) {
			if (q.indexOf("_") > 0) q = q.slice(0, q.indexOf("_"));
			z[q] = v;
			if (!skip_LC) z[q.toLowerCase()] = v;
		} else {
			var k = (j === 5 && q.slice(0, 5) === "xmlns" ? "xmlns" : "") + q.slice(j + 1);
			if (z[k] && q.slice(j - 3, j) == "ext") continue;
			z[k] = v;
			if (!skip_LC) z[k.toLowerCase()] = v;
		}
	}
	return z;
}
function parsexmltagraw(tag, skip_root, skip_LC) {
	var z = {};
	var eq = 0, c = 0;
	for (; eq !== tag.length; ++eq) if ((c = tag.charCodeAt(eq)) === 32 || c === 10 || c === 13) break;
	if (!skip_root) z[0] = tag.slice(0, eq);
	if (eq === tag.length) return z;
	var m = tag.match(attregexg), v = "", i = 0, q = "", cc = "", quot = 1;
	if (m) for (i = 0; i != m.length; ++i) {
		cc = m[i].slice(1);
		for (c = 0; c != cc.length; ++c) if (cc.charCodeAt(c) === 61) break;
		q = cc.slice(0, c).trim();
		while (cc.charCodeAt(c + 1) == 32) ++c;
		quot = (eq = cc.charCodeAt(c + 1)) == 34 || eq == 39 ? 1 : 0;
		v = cc.slice(c + 1 + quot, cc.length - quot);
		if (q.indexOf("_") > 0) q = q.slice(0, q.indexOf("_"));
		z[q] = v;
		if (!skip_LC) z[q.toLowerCase()] = v;
	}
	return z;
}
function strip_ns(x) {
	return x.replace(nsregex2, "<$1");
}
var encodings = {
	"&quot;": "\"",
	"&apos;": "'",
	"&gt;": ">",
	"&lt;": "<",
	"&amp;": "&"
};
var rencoding = /*#__PURE__*/ evert(encodings);
var unescapexml = /*#__PURE__*/ (function() {
	var encregex = /&(?:quot|apos|gt|lt|amp|#x?([\da-fA-F]+));/gi, coderegex = /_x([\da-fA-F]{4})_/g;
	function raw_unescapexml(text) {
		var s = text + "", i = s.indexOf("<![CDATA[");
		if (i == -1) return s.replace(encregex, function($$, $1) {
			return encodings[$$] || String.fromCharCode(parseInt($1, $$.indexOf("x") > -1 ? 16 : 10)) || $$;
		}).replace(coderegex, function(m, c) {
			return String.fromCharCode(parseInt(c, 16));
		});
		var j = s.indexOf("]]>");
		return raw_unescapexml(s.slice(0, i)) + s.slice(i + 9, j) + raw_unescapexml(s.slice(j + 3));
	}
	return function unescapexml(text, xlsx) {
		var out = raw_unescapexml(text);
		return xlsx ? out.replace(/\r\n/g, "\n") : out;
	};
})();
var decregex = /[&<>'"]/g;
var htmlcharegex = /[\u0000-\u001f]/g;
function escapehtml(text) {
	return (text + "").replace(decregex, function(y) {
		return rencoding[y];
	}).replace(/\r\n|\r|\n/g, "<br/>").replace(htmlcharegex, function(s) {
		return "&#x" + ("000" + s.charCodeAt(0).toString(16)).slice(-4) + ";";
	});
}
function strip_xml_tags(text) {
	var str = String(text), out = [], inTag = false;
	for (var i = 0; i < str.length; ++i) {
		var cc = str.charCodeAt(i);
		if (!inTag && cc == 60) inTag = true;
		else if (inTag && cc == 62) inTag = false;
		else if (!inTag) out.push(str.charAt(i));
	}
	return out.join("");
}
var xlml_fixstr = /*#__PURE__*/ (function() {
	var entregex = /&#(\d+);/g;
	function entrepl($$, $1) {
		return String.fromCharCode(parseInt($1, 10));
	}
	return function xlml_fixstr(str) {
		return str.replace(entregex, entrepl);
	};
})();
function parsexmlbool(value) {
	switch (value) {
		case 1:
		case true:
		case "1":
		case "true": return true;
		case 0:
		case false:
		case "0":
		case "false": return false;
	}
	return false;
}
function utf8reada(orig) {
	var out = "", i = 0, c = 0, d = 0, e = 0, f = 0, w = 0;
	while (i < orig.length) {
		c = orig.charCodeAt(i++);
		if (c < 128) {
			out += String.fromCharCode(c);
			continue;
		}
		d = orig.charCodeAt(i++);
		if (c > 191 && c < 224) {
			f = (c & 31) << 6;
			f |= d & 63;
			out += String.fromCharCode(f);
			continue;
		}
		e = orig.charCodeAt(i++);
		if (c < 240) {
			out += String.fromCharCode((c & 15) << 12 | (d & 63) << 6 | e & 63);
			continue;
		}
		f = orig.charCodeAt(i++);
		w = ((c & 7) << 18 | (d & 63) << 12 | (e & 63) << 6 | f & 63) - 65536;
		out += String.fromCharCode(55296 + (w >>> 10 & 1023));
		out += String.fromCharCode(56320 + (w & 1023));
	}
	return out;
}
function utf8readb(data) {
	var out = new_raw_buf(2 * data.length), w, i, j = 1, k = 0, ww = 0, c;
	for (i = 0; i < data.length; i += j) {
		j = 1;
		if ((c = data.charCodeAt(i)) < 128) w = c;
		else if (c < 224) {
			w = (c & 31) * 64 + (data.charCodeAt(i + 1) & 63);
			j = 2;
		} else if (c < 240) {
			w = (c & 15) * 4096 + (data.charCodeAt(i + 1) & 63) * 64 + (data.charCodeAt(i + 2) & 63);
			j = 3;
		} else {
			j = 4;
			w = (c & 7) * 262144 + (data.charCodeAt(i + 1) & 63) * 4096 + (data.charCodeAt(i + 2) & 63) * 64 + (data.charCodeAt(i + 3) & 63);
			w -= 65536;
			ww = 55296 + (w >>> 10 & 1023);
			w = 56320 + (w & 1023);
		}
		if (ww !== 0) {
			out[k++] = ww & 255;
			out[k++] = ww >>> 8;
			ww = 0;
		}
		out[k++] = w % 256;
		out[k++] = w >>> 8;
	}
	return out.slice(0, k).toString("ucs2");
}
function utf8readc(data) {
	return Buffer_from(data, "binary").toString("utf8");
}
var utf8corpus = "foo bar bazâð£";
var utf8read = /*#__PURE__*/ (function() {
	if (has_buf) {
		if (utf8readc(utf8corpus) == utf8reada(utf8corpus)) return utf8readc;
		if (utf8readb(utf8corpus) == utf8reada(utf8corpus)) return utf8readb;
	}
	return utf8reada;
})();
var utf8write = has_buf ? function(data) {
	return Buffer_from(data, "utf8").toString("binary");
} : function(orig) {
	var out = [], i = 0, c = 0, d = 0;
	while (i < orig.length) {
		c = orig.charCodeAt(i++);
		switch (true) {
			case c < 128:
				out.push(String.fromCharCode(c));
				break;
			case c < 2048:
				out.push(String.fromCharCode(192 + (c >> 6)));
				out.push(String.fromCharCode(128 + (c & 63)));
				break;
			case c >= 55296 && c < 57344:
				c -= 55296;
				d = orig.charCodeAt(i++) - 56320 + (c << 10);
				out.push(String.fromCharCode(240 + (d >> 18 & 7)));
				out.push(String.fromCharCode(144 + (d >> 12 & 63)));
				out.push(String.fromCharCode(128 + (d >> 6 & 63)));
				out.push(String.fromCharCode(128 + (d & 63)));
				break;
			default:
				out.push(String.fromCharCode(224 + (c >> 12)));
				out.push(String.fromCharCode(128 + (c >> 6 & 63)));
				out.push(String.fromCharCode(128 + (c & 63)));
		}
	}
	return out.join("");
};
var htmldecode = /*#__PURE__*/ (function() {
	var entities = [
		["nbsp", " "],
		["middot", "·"],
		["quot", "\""],
		["apos", "'"],
		["gt", ">"],
		["lt", "<"],
		["amp", "&"]
	].map(function(x) {
		return [new RegExp("&" + x[0] + ";", "ig"), x[1]];
	});
	return function htmldecode(str) {
		var o = str.replace(/^[\t\n\r ]+/, "").replace(/(^|[^\t\n\r ])[\t\n\r ]+$/, "$1").replace(/>\s+/g, ">").replace(/\b\s+</g, "<").replace(/[\t\n\r ]+/g, " ").replace(/<\s*[bB][rR]\s*\/?>/g, "\n");
		o = strip_xml_tags(o);
		for (var i = 0; i < entities.length; ++i) o = o.replace(entities[i][0], entities[i][1]);
		return o;
	};
})();
var vtvregex = /<\/?(?:vt:)?variant>/g;
var vtmregex = /<(?:vt:)([^<"'>]*)>([\s\S]*)</;
function parseVector(data, opts) {
	var h = parsexmltag(data);
	var matches = str_match_xml_ns_g(data, h.baseType) || [];
	var res = [];
	if (matches.length != h.size) {
		if (opts.WTF) throw new Error("unexpected vector length " + matches.length + " != " + h.size);
		return res;
	}
	matches.forEach(function(x) {
		var v = x.replace(vtvregex, "").match(vtmregex);
		if (v) res.push({
			v: utf8read(v[2]),
			t: v[1]
		});
	});
	return res;
}
function xlml_normalize(d) {
	if (has_buf && Buffer.isBuffer(d)) return d.toString("utf8");
	if (typeof d === "string") return d;
	if (typeof Uint8Array !== "undefined" && d instanceof Uint8Array) return utf8read(a2s(ab2a(d)));
	throw new Error("Bad input format: expected Buffer or string");
}
var xlmlregex = /<([\/]?)([^\s?><!\/:"]*:|)([^\s?<>:\/"]+)(?:\s+[^<>=?"'\s]+="[^"]*?")*\s*[\/]?>/gm;
var XMLNS = {
	CORE_PROPS: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
	CUST_PROPS: "http://schemas.openxmlformats.org/officeDocument/2006/custom-properties",
	EXT_PROPS: "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties",
	CT: "http://schemas.openxmlformats.org/package/2006/content-types",
	RELS: "http://schemas.openxmlformats.org/package/2006/relationships",
	TCMNT: "http://schemas.microsoft.com/office/spreadsheetml/2018/threadedcomments",
	"dc": "http://purl.org/dc/elements/1.1/",
	"dcterms": "http://purl.org/dc/terms/",
	"dcmitype": "http://purl.org/dc/dcmitype/",
	"mx": "http://schemas.microsoft.com/office/mac/excel/2008/main",
	"r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
	"sjs": "http://schemas.openxmlformats.org/package/2006/sheetjs/core-properties",
	"vt": "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes",
	"xsi": "http://www.w3.org/2001/XMLSchema-instance",
	"xsd": "http://www.w3.org/2001/XMLSchema"
};
var XMLNS_main = [
	"http://schemas.openxmlformats.org/spreadsheetml/2006/main",
	"http://purl.oclc.org/ooxml/spreadsheetml/main",
	"http://schemas.microsoft.com/office/excel/2006/main",
	"http://schemas.microsoft.com/office/excel/2006/2"
];
function read_double_le(b, idx) {
	var s = 1 - 2 * (b[idx + 7] >>> 7);
	var e = ((b[idx + 7] & 127) << 4) + (b[idx + 6] >>> 4 & 15);
	var m = b[idx + 6] & 15;
	for (var i = 5; i >= 0; --i) m = m * 256 + b[idx + i];
	if (e == 2047) return m == 0 ? s * Infinity : NaN;
	if (e == 0) e = -1022;
	else {
		e -= 1023;
		m += Math.pow(2, 52);
	}
	return s * Math.pow(2, e - 52) * m;
}
function write_double_le(b, v, idx) {
	var bs = (v < 0 || 1 / v == -Infinity ? 1 : 0) << 7, e = 0, m = 0;
	var av = bs ? -v : v;
	if (!isFinite(av)) {
		e = 2047;
		m = isNaN(v) ? 26985 : 0;
	} else if (av == 0) e = m = 0;
	else {
		e = Math.floor(Math.log(av) / Math.LN2);
		m = av * Math.pow(2, 52 - e);
		if (e <= -1023 && (!isFinite(m) || m < Math.pow(2, 52))) e = -1022;
		else {
			m -= Math.pow(2, 52);
			e += 1023;
		}
	}
	for (var i = 0; i <= 5; ++i, m /= 256) b[idx + i] = m & 255;
	b[idx + 6] = (e & 15) << 4 | m & 15;
	b[idx + 7] = e >> 4 | bs;
}
var ___toBuffer = function(bufs) {
	var x = [], w = 10240;
	for (var i = 0; i < bufs[0].length; ++i) if (bufs[0][i]) for (var j = 0, L = bufs[0][i].length; j < L; j += w) x.push.apply(x, bufs[0][i].slice(j, j + w));
	return x;
};
var __toBuffer = has_buf ? function(bufs) {
	return bufs[0].length > 0 && Buffer.isBuffer(bufs[0][0]) ? Buffer.concat(bufs[0].map(function(x) {
		return Buffer.isBuffer(x) ? x : Buffer_from(x);
	})) : ___toBuffer(bufs);
} : ___toBuffer;
var ___utf16le = function(b, s, e) {
	var ss = [];
	for (var i = s; i < e; i += 2) ss.push(String.fromCharCode(__readUInt16LE(b, i)));
	return ss.join("").replace(chr0, "");
};
var __utf16le = has_buf ? function(b, s, e) {
	if (!Buffer.isBuffer(b) || !buf_utf16le) return ___utf16le(b, s, e);
	return b.toString("utf16le", s, e).replace(chr0, "");
} : ___utf16le;
var ___hexlify = function(b, s, l) {
	var ss = [];
	for (var i = s; i < s + l; ++i) ss.push(("0" + b[i].toString(16)).slice(-2));
	return ss.join("");
};
var __hexlify = has_buf ? function(b, s, l) {
	return Buffer.isBuffer(b) ? b.toString("hex", s, s + l) : ___hexlify(b, s, l);
} : ___hexlify;
var ___utf8 = function(b, s, e) {
	var ss = [];
	for (var i = s; i < e; i++) ss.push(String.fromCharCode(__readUInt8(b, i)));
	return ss.join("");
};
var __utf8 = has_buf ? function utf8_b(b, s, e) {
	return Buffer.isBuffer(b) ? b.toString("utf8", s, e) : ___utf8(b, s, e);
} : ___utf8;
var ___lpstr = function(b, i) {
	var len = __readUInt32LE(b, i);
	return len > 0 ? __utf8(b, i + 4, i + 4 + len - 1) : "";
};
var __lpstr = ___lpstr;
var ___cpstr = function(b, i) {
	var len = __readUInt32LE(b, i);
	return len > 0 ? __utf8(b, i + 4, i + 4 + len - 1) : "";
};
var __cpstr = ___cpstr;
var ___lpwstr = function(b, i) {
	var len = 2 * __readUInt32LE(b, i);
	return len > 0 ? __utf8(b, i + 4, i + 4 + len - 1) : "";
};
var __lpwstr = ___lpwstr;
var ___lpp4 = function lpp4_(b, i) {
	var len = __readUInt32LE(b, i);
	return len > 0 ? __utf16le(b, i + 4, i + 4 + len) : "";
};
var __lpp4 = ___lpp4;
var ___8lpp4 = function(b, i) {
	var len = __readUInt32LE(b, i);
	return len > 0 ? __utf8(b, i + 4, i + 4 + len) : "";
};
var __8lpp4 = ___8lpp4;
var ___double = function(b, idx) {
	return read_double_le(b, idx);
};
var __double = ___double;
var is_buf = function is_buf_a(a) {
	return Array.isArray(a) || typeof Uint8Array !== "undefined" && a instanceof Uint8Array;
};
if (has_buf) {
	__lpstr = function lpstr_b(b, i) {
		if (!Buffer.isBuffer(b)) return ___lpstr(b, i);
		var len = b.readUInt32LE(i);
		return len > 0 ? b.toString("utf8", i + 4, i + 4 + len - 1) : "";
	};
	__cpstr = function cpstr_b(b, i) {
		if (!Buffer.isBuffer(b)) return ___cpstr(b, i);
		var len = b.readUInt32LE(i);
		return len > 0 ? b.toString("utf8", i + 4, i + 4 + len - 1) : "";
	};
	__lpwstr = function lpwstr_b(b, i) {
		if (!Buffer.isBuffer(b) || !buf_utf16le) return ___lpwstr(b, i);
		var len = 2 * b.readUInt32LE(i);
		return b.toString("utf16le", i + 4, i + 4 + len - 1);
	};
	__lpp4 = function lpp4_b(b, i) {
		if (!Buffer.isBuffer(b) || !buf_utf16le) return ___lpp4(b, i);
		var len = b.readUInt32LE(i);
		return b.toString("utf16le", i + 4, i + 4 + len);
	};
	__8lpp4 = function lpp4_8b(b, i) {
		if (!Buffer.isBuffer(b)) return ___8lpp4(b, i);
		var len = b.readUInt32LE(i);
		return b.toString("utf8", i + 4, i + 4 + len);
	};
	__double = function double_(b, i) {
		if (Buffer.isBuffer(b)) return b.readDoubleLE(i);
		return ___double(b, i);
	};
	is_buf = function is_buf_b(a) {
		return Buffer.isBuffer(a) || Array.isArray(a) || typeof Uint8Array !== "undefined" && a instanceof Uint8Array;
	};
}
function cpdoit() {
	__utf16le = function(b, s, e) {
		return $cptable.utils.decode(1200, b.slice(s, e)).replace(chr0, "");
	};
	__utf8 = function(b, s, e) {
		return $cptable.utils.decode(65001, b.slice(s, e));
	};
	__lpstr = function(b, i) {
		var len = __readUInt32LE(b, i);
		return len > 0 ? $cptable.utils.decode(current_ansi, b.slice(i + 4, i + 4 + len - 1)) : "";
	};
	__cpstr = function(b, i) {
		var len = __readUInt32LE(b, i);
		return len > 0 ? $cptable.utils.decode(current_codepage, b.slice(i + 4, i + 4 + len - 1)) : "";
	};
	__lpwstr = function(b, i) {
		var len = 2 * __readUInt32LE(b, i);
		return len > 0 ? $cptable.utils.decode(1200, b.slice(i + 4, i + 4 + len - 1)) : "";
	};
	__lpp4 = function(b, i) {
		var len = __readUInt32LE(b, i);
		return len > 0 ? $cptable.utils.decode(1200, b.slice(i + 4, i + 4 + len)) : "";
	};
	__8lpp4 = function(b, i) {
		var len = __readUInt32LE(b, i);
		return len > 0 ? $cptable.utils.decode(65001, b.slice(i + 4, i + 4 + len)) : "";
	};
}
if (typeof $cptable !== "undefined") cpdoit();
var __readUInt8 = function(b, idx) {
	return b[idx];
};
var __readUInt16LE = function(b, idx) {
	return b[idx + 1] * 256 + b[idx];
};
var __readInt16LE = function(b, idx) {
	var u = b[idx + 1] * 256 + b[idx];
	return u < 32768 ? u : (65535 - u + 1) * -1;
};
var __readUInt32LE = function(b, idx) {
	return b[idx + 3] * (1 << 24) + (b[idx + 2] << 16) + (b[idx + 1] << 8) + b[idx];
};
var __readInt32LE = function(b, idx) {
	return b[idx + 3] << 24 | b[idx + 2] << 16 | b[idx + 1] << 8 | b[idx];
};
var __readInt32BE = function(b, idx) {
	return b[idx] << 24 | b[idx + 1] << 16 | b[idx + 2] << 8 | b[idx + 3];
};
function ReadShift(size, t) {
	var o = "", oI, oR, oo = [], w, vv, i, loc;
	switch (t) {
		case "dbcs":
			loc = this.l;
			if (has_buf && Buffer.isBuffer(this) && buf_utf16le) o = this.slice(this.l, this.l + 2 * size).toString("utf16le");
			else for (i = 0; i < size; ++i) {
				o += String.fromCharCode(__readUInt16LE(this, loc));
				loc += 2;
			}
			size *= 2;
			break;
		case "utf8":
			o = __utf8(this, this.l, this.l + size);
			break;
		case "utf16le":
			size *= 2;
			o = __utf16le(this, this.l, this.l + size);
			break;
		case "wstr":
			if (typeof $cptable !== "undefined") o = $cptable.utils.decode(current_codepage, this.slice(this.l, this.l + 2 * size));
			else return ReadShift.call(this, size, "dbcs");
			size = 2 * size;
			break;
		case "lpstr-ansi":
			o = __lpstr(this, this.l);
			size = 4 + __readUInt32LE(this, this.l);
			break;
		case "lpstr-cp":
			o = __cpstr(this, this.l);
			size = 4 + __readUInt32LE(this, this.l);
			break;
		case "lpwstr":
			o = __lpwstr(this, this.l);
			size = 4 + 2 * __readUInt32LE(this, this.l);
			break;
		case "lpp4":
			size = 4 + __readUInt32LE(this, this.l);
			o = __lpp4(this, this.l);
			if (size & 2) size += 2;
			break;
		case "8lpp4":
			size = 4 + __readUInt32LE(this, this.l);
			o = __8lpp4(this, this.l);
			if (size & 3) size += 4 - (size & 3);
			break;
		case "cstr":
			size = 0;
			o = "";
			while ((w = __readUInt8(this, this.l + size++)) !== 0) oo.push(_getchar(w));
			o = oo.join("");
			break;
		case "_wstr":
			size = 0;
			o = "";
			while ((w = __readUInt16LE(this, this.l + size)) !== 0) {
				oo.push(_getchar(w));
				size += 2;
			}
			size += 2;
			o = oo.join("");
			break;
		case "dbcs-cont":
			o = "";
			loc = this.l;
			for (i = 0; i < size; ++i) {
				if (this.lens && this.lens.indexOf(loc) !== -1) {
					w = __readUInt8(this, loc);
					this.l = loc + 1;
					vv = ReadShift.call(this, size - i, w ? "dbcs-cont" : "sbcs-cont");
					return oo.join("") + vv;
				}
				oo.push(_getchar(__readUInt16LE(this, loc)));
				loc += 2;
			}
			o = oo.join("");
			size *= 2;
			break;
		case "cpstr": if (typeof $cptable !== "undefined") {
			o = $cptable.utils.decode(current_codepage, this.slice(this.l, this.l + size));
			break;
		}
		case "sbcs-cont":
			o = "";
			loc = this.l;
			for (i = 0; i != size; ++i) {
				if (this.lens && this.lens.indexOf(loc) !== -1) {
					w = __readUInt8(this, loc);
					this.l = loc + 1;
					vv = ReadShift.call(this, size - i, w ? "dbcs-cont" : "sbcs-cont");
					return oo.join("") + vv;
				}
				oo.push(_getchar(__readUInt8(this, loc)));
				loc += 1;
			}
			o = oo.join("");
			break;
		default: switch (size) {
			case 1:
				oI = __readUInt8(this, this.l);
				this.l++;
				return oI;
			case 2:
				oI = (t === "i" ? __readInt16LE : __readUInt16LE)(this, this.l);
				this.l += 2;
				return oI;
			case 4:
			case -4:
				if (t === "i" || (this[this.l + 3] & 128) === 0) {
					oI = (size > 0 ? __readInt32LE : __readInt32BE)(this, this.l);
					this.l += 4;
					return oI;
				} else {
					oR = __readUInt32LE(this, this.l);
					this.l += 4;
				}
				return oR;
			case 8:
			case -8: if (t === "f") {
				if (size == 8) oR = __double(this, this.l);
				else oR = __double([
					this[this.l + 7],
					this[this.l + 6],
					this[this.l + 5],
					this[this.l + 4],
					this[this.l + 3],
					this[this.l + 2],
					this[this.l + 1],
					this[this.l + 0]
				], 0);
				this.l += 8;
				return oR;
			} else size = 8;
			case 16: o = __hexlify(this, this.l, size);
		}
	}
	this.l += size;
	return o;
}
var __writeUInt32LE = function(b, val, idx) {
	b[idx] = val & 255;
	b[idx + 1] = val >>> 8 & 255;
	b[idx + 2] = val >>> 16 & 255;
	b[idx + 3] = val >>> 24 & 255;
};
var __writeInt32LE = function(b, val, idx) {
	b[idx] = val & 255;
	b[idx + 1] = val >> 8 & 255;
	b[idx + 2] = val >> 16 & 255;
	b[idx + 3] = val >> 24 & 255;
};
var __writeUInt16LE = function(b, val, idx) {
	b[idx] = val & 255;
	b[idx + 1] = val >>> 8 & 255;
};
function WriteShift(t, val, f) {
	var size = 0, i = 0;
	if (f === "dbcs") {
		for (i = 0; i != val.length; ++i) __writeUInt16LE(this, val.charCodeAt(i), this.l + 2 * i);
		size = 2 * val.length;
	} else if (f === "sbcs" || f == "cpstr") if (typeof $cptable !== "undefined" && current_ansi == 874) {
		for (i = 0; i != val.length; ++i) {
			var cpp = $cptable.utils.encode(current_ansi, val.charAt(i));
			this[this.l + i] = cpp[0];
		}
		size = val.length;
	} else if (typeof $cptable !== "undefined" && f == "cpstr") {
		cpp = $cptable.utils.encode(current_codepage, val);
		if (cpp.length == val.length) {
			for (i = 0; i < val.length; ++i) if (cpp[i] == 0 && val.charCodeAt(i) != 0) cpp[i] = 95;
		}
		if (cpp.length == 2 * val.length) {
			for (i = 0; i < val.length; ++i) if (cpp[2 * i] == 0 && cpp[2 * i + 1] == 0 && val.charCodeAt(i) != 0) cpp[2 * i] = 95;
		}
		for (i = 0; i < cpp.length; ++i) this[this.l + i] = cpp[i];
		size = cpp.length;
	} else {
		val = val.replace(/[^\x00-\x7F]/g, "_");
		for (i = 0; i != val.length; ++i) this[this.l + i] = val.charCodeAt(i) & 255;
		size = val.length;
	}
	else if (f === "hex") {
		for (; i < t; ++i) this[this.l++] = parseInt(val.slice(2 * i, 2 * i + 2), 16) || 0;
		return this;
	} else if (f === "utf16le") {
		var end = Math.min(this.l + t, this.length);
		for (i = 0; i < Math.min(val.length, t); ++i) {
			var cc = val.charCodeAt(i);
			this[this.l++] = cc & 255;
			this[this.l++] = cc >> 8;
		}
		while (this.l < end) this[this.l++] = 0;
		return this;
	} else switch (t) {
		case 1:
			size = 1;
			this[this.l] = val & 255;
			break;
		case 2:
			size = 2;
			this[this.l] = val & 255;
			val >>>= 8;
			this[this.l + 1] = val & 255;
			break;
		case 3:
			size = 3;
			this[this.l] = val & 255;
			val >>>= 8;
			this[this.l + 1] = val & 255;
			val >>>= 8;
			this[this.l + 2] = val & 255;
			break;
		case 4:
			size = 4;
			__writeUInt32LE(this, val, this.l);
			break;
		case 8:
			size = 8;
			if (f === "f") {
				write_double_le(this, val, this.l);
				break;
			}
		case 16: break;
		case -4:
			size = 4;
			__writeInt32LE(this, val, this.l);
			break;
	}
	this.l += size;
	return this;
}
function CheckField(hexstr, fld) {
	var m = __hexlify(this, this.l, hexstr.length >> 1);
	if (m !== hexstr) throw new Error(fld + "Expected " + hexstr + " saw " + m);
	this.l += hexstr.length >> 1;
}
function prep_blob(blob, pos) {
	blob.l = pos;
	blob.read_shift = ReadShift;
	blob.chk = CheckField;
	blob.write_shift = WriteShift;
}
function parsenoop(blob, length) {
	blob.l += length;
}
function new_buf(sz) {
	var o = new_raw_buf(sz);
	prep_blob(o, 0);
	return o;
}
function recordhopper(data, cb, opts) {
	if (!data) return;
	var tmpbyte, cntbyte, length;
	prep_blob(data, data.l || 0);
	var L = data.length, RT = 0, tgt = 0;
	while (data.l < L) {
		RT = data.read_shift(1);
		if (RT & 128) RT = (RT & 127) + ((data.read_shift(1) & 127) << 7);
		var R = XLSBRecordEnum[RT] || XLSBRecordEnum[65535];
		tmpbyte = data.read_shift(1);
		length = tmpbyte & 127;
		for (cntbyte = 1; cntbyte < 4 && tmpbyte & 128; ++cntbyte) length += ((tmpbyte = data.read_shift(1)) & 127) << 7 * cntbyte;
		tgt = data.l + length;
		var d = R.f && R.f(data, length, opts);
		data.l = tgt;
		if (cb(d, R, RT)) return;
	}
}
function buf_array() {
	var bufs = [], blksz = has_buf ? 16384 : 2048;
	var has_buf_subarray = has_buf && typeof new_buf(blksz).subarray == "function";
	var newblk = function ba_newblk(sz) {
		var o = new_buf(sz);
		prep_blob(o, 0);
		return o;
	};
	var curbuf = newblk(blksz);
	var endbuf = function ba_endbuf() {
		if (!curbuf) return;
		if (curbuf.l) {
			if (curbuf.length > curbuf.l) {
				curbuf = curbuf.slice(0, curbuf.l);
				curbuf.l = curbuf.length;
			}
			if (curbuf.length > 0) bufs.push(curbuf);
		}
		curbuf = null;
	};
	var next = function ba_next(sz) {
		if (curbuf && sz < curbuf.length - curbuf.l) return curbuf;
		endbuf();
		return curbuf = newblk(Math.max(sz + 1, blksz));
	};
	var end = function ba_end() {
		endbuf();
		return bconcat(bufs);
	};
	var end2 = function() {
		endbuf();
		return bufs;
	};
	return {
		next,
		push: function ba_push(buf) {
			if (curbuf.l > 0) bufs.push(curbuf.slice(0, curbuf.l));
			bufs.push(buf);
			curbuf = has_buf_subarray ? curbuf.subarray(curbuf.l || 0) : curbuf.slice(curbuf.l || 0);
			prep_blob(curbuf, 0);
		},
		end,
		_bufs: bufs,
		end2
	};
}
function shift_cell_xls(cell, tgt, opts) {
	var out = dup(cell);
	if (tgt.s) {
		if (out.cRel) out.c += tgt.s.c;
		if (out.rRel) out.r += tgt.s.r;
	} else {
		if (out.cRel) out.c += tgt.c;
		if (out.rRel) out.r += tgt.r;
	}
	if (!opts || opts.biff < 12) {
		while (out.c >= 256) out.c -= 256;
		while (out.r >= 65536) out.r -= 65536;
	}
	return out;
}
function shift_range_xls(cell, range, opts) {
	var out = dup(cell);
	out.s = shift_cell_xls(out.s, range.s, opts);
	out.e = shift_cell_xls(out.e, range.s, opts);
	return out;
}
function encode_cell_xls(c, biff) {
	if (c.cRel && c.c < 0) {
		c = dup(c);
		while (c.c < 0) c.c += biff > 8 ? 16384 : 256;
	}
	if (c.rRel && c.r < 0) {
		c = dup(c);
		while (c.r < 0) c.r += biff > 8 ? 1048576 : biff > 5 ? 65536 : 16384;
	}
	var s = encode_cell(c);
	if (!c.cRel && c.cRel != null) s = fix_col(s);
	if (!c.rRel && c.rRel != null) s = fix_row(s);
	return s;
}
function encode_range_xls(r, opts) {
	if (r.s.r == 0 && !r.s.rRel) {
		if (r.e.r == (opts.biff >= 12 ? 1048575 : opts.biff >= 8 ? 65536 : 16384) && !r.e.rRel) return (r.s.cRel ? "" : "$") + encode_col(r.s.c) + ":" + (r.e.cRel ? "" : "$") + encode_col(r.e.c);
	}
	if (r.s.c == 0 && !r.s.cRel) {
		if (r.e.c == (opts.biff >= 12 ? 16383 : 255) && !r.e.cRel) return (r.s.rRel ? "" : "$") + encode_row(r.s.r) + ":" + (r.e.rRel ? "" : "$") + encode_row(r.e.r);
	}
	return encode_cell_xls(r.s, opts.biff) + ":" + encode_cell_xls(r.e, opts.biff);
}
function decode_row(rowstr) {
	return parseInt(unfix_row(rowstr), 10) - 1;
}
function encode_row(row) {
	return "" + (row + 1);
}
function fix_row(cstr) {
	return cstr.replace(/([A-Z]|^)(\d+)$/, "$1$$$2");
}
function unfix_row(cstr) {
	return cstr.replace(/\$(\d+)$/, "$1");
}
function decode_col(colstr) {
	var c = unfix_col(colstr), d = 0, i = 0;
	for (; i !== c.length; ++i) d = 26 * d + c.charCodeAt(i) - 64;
	return d - 1;
}
function encode_col(col) {
	if (col < 0) throw new Error("invalid column " + col);
	var s = "";
	for (++col; col; col = Math.floor((col - 1) / 26)) s = String.fromCharCode((col - 1) % 26 + 65) + s;
	return s;
}
function fix_col(cstr) {
	return cstr.replace(/^([A-Z])/, "$$$1");
}
function unfix_col(cstr) {
	return cstr.replace(/^\$([A-Z])/, "$1");
}
function split_cell(cstr) {
	return cstr.replace(/(\$?[A-Z]*)(\$?\d*)/, "$1,$2").split(",");
}
function decode_cell(cstr) {
	var R = 0, C = 0;
	for (var i = 0; i < cstr.length; ++i) {
		var cc = cstr.charCodeAt(i);
		if (cc >= 48 && cc <= 57) R = 10 * R + (cc - 48);
		else if (cc >= 65 && cc <= 90) C = 26 * C + (cc - 64);
	}
	return {
		c: C - 1,
		r: R - 1
	};
}
function encode_cell(cell) {
	var col = cell.c + 1;
	var s = "";
	for (; col; col = (col - 1) / 26 | 0) s = String.fromCharCode((col - 1) % 26 + 65) + s;
	return s + (cell.r + 1);
}
function decode_range(range) {
	var idx = range.indexOf(":");
	if (idx == -1) return {
		s: decode_cell(range),
		e: decode_cell(range)
	};
	return {
		s: decode_cell(range.slice(0, idx)),
		e: decode_cell(range.slice(idx + 1))
	};
}
function encode_range(cs, ce) {
	if (typeof ce === "undefined" || typeof ce === "number") return encode_range(cs.s, cs.e);
	if (typeof cs !== "string") cs = encode_cell(cs);
	if (typeof ce !== "string") ce = encode_cell(ce);
	return cs == ce ? cs : cs + ":" + ce;
}
function formula_quote_sheet_name(sname, opts) {
	if (!sname && !(opts && opts.biff <= 5 && opts.biff >= 2)) throw new Error("empty sheet name");
	if (/[^\w\u4E00-\u9FFF\u3040-\u30FF]/.test(sname)) return "'" + sname.replace(/'/g, "''") + "'";
	return sname;
}
function safe_decode_range(range) {
	var o = {
		s: {
			c: 0,
			r: 0
		},
		e: {
			c: 0,
			r: 0
		}
	};
	var idx = 0, i = 0, cc = 0;
	var len = range.length;
	for (idx = 0; i < len; ++i) {
		if ((cc = range.charCodeAt(i) - 64) < 1 || cc > 26) break;
		idx = 26 * idx + cc;
	}
	o.s.c = --idx;
	for (idx = 0; i < len; ++i) {
		if ((cc = range.charCodeAt(i) - 48) < 0 || cc > 9) break;
		idx = 10 * idx + cc;
	}
	o.s.r = --idx;
	if (i === len || cc != 10) {
		o.e.c = o.s.c;
		o.e.r = o.s.r;
		return o;
	}
	++i;
	for (idx = 0; i != len; ++i) {
		if ((cc = range.charCodeAt(i) - 64) < 1 || cc > 26) break;
		idx = 26 * idx + cc;
	}
	o.e.c = --idx;
	for (idx = 0; i != len; ++i) {
		if ((cc = range.charCodeAt(i) - 48) < 0 || cc > 9) break;
		idx = 10 * idx + cc;
	}
	o.e.r = --idx;
	return o;
}
function safe_format_cell(cell, v) {
	var q = cell.t == "d" && v instanceof Date;
	if (cell.z != null) try {
		return cell.w = SSF_format(cell.z, q ? datenum(v) : v);
	} catch (e) {}
	try {
		return cell.w = SSF_format((cell.XF || {}).numFmtId || (q ? 14 : 0), q ? datenum(v) : v);
	} catch (e) {
		return "" + v;
	}
}
function format_cell(cell, v, o) {
	if (cell == null || cell.t == null || cell.t == "z") return "";
	if (cell.w !== void 0) return cell.w;
	if (cell.t == "d" && !cell.z && o && o.dateNF) cell.z = o.dateNF;
	if (cell.t == "e") return BErr[cell.v] || cell.v;
	if (v == void 0) return safe_format_cell(cell, cell.v);
	return safe_format_cell(cell, v);
}
function sheet_map_new() {
	return Object.create ? Object.create(null) : {};
}
function sheet_map_set(sheets, name, sheet) {
	if (name == "__proto__" && Object.defineProperty) Object.defineProperty(sheets, name, {
		value: sheet,
		configurable: true,
		enumerable: true,
		writable: true
	});
	else sheets[name] = sheet;
}
function sheet_map_get(sheets, name) {
	return sheets != null && Object.prototype.hasOwnProperty.call(sheets, name) ? sheets[name] : void 0;
}
function sheet_to_workbook(sheet, opts) {
	var n = opts && opts.sheet ? opts.sheet : "Sheet1";
	var sheets = sheet_map_new();
	sheet_map_set(sheets, n, sheet);
	return {
		SheetNames: [n],
		Sheets: sheets
	};
}
function sheet_new(opts) {
	var out = {};
	if ((opts || {}).dense) out["!data"] = [];
	return out;
}
function sheet_add_aoa(_ws, data, opts) {
	var o = opts || {};
	var dense = _ws ? _ws["!data"] != null : o.dense;
	if (DENSE != null && dense == null) dense = DENSE;
	var ws = _ws || (dense ? { "!data": [] } : {});
	if (dense && !ws["!data"]) ws["!data"] = [];
	var _R = 0, _C = 0;
	if (ws && o.origin != null) if (typeof o.origin == "number") _R = o.origin;
	else {
		var _origin = typeof o.origin == "string" ? decode_cell(o.origin) : o.origin;
		_R = _origin.r;
		_C = _origin.c;
	}
	var range = {
		s: {
			c: 1e7,
			r: 1e7
		},
		e: {
			c: 0,
			r: 0
		}
	};
	if (ws["!ref"]) {
		var _range = safe_decode_range(ws["!ref"]);
		range.s.c = _range.s.c;
		range.s.r = _range.s.r;
		range.e.c = Math.max(range.e.c, _range.e.c);
		range.e.r = Math.max(range.e.r, _range.e.r);
		if (_R == -1) range.e.r = _R = ws["!ref"] ? _range.e.r + 1 : 0;
	} else range.s.c = range.e.c = range.s.r = range.e.r = 0;
	var row = [], seen = false;
	for (var R = 0; R != data.length; ++R) {
		if (!data[R]) continue;
		if (!Array.isArray(data[R])) throw new Error("aoa_to_sheet expects an array of arrays");
		var __R = _R + R;
		if (dense) {
			if (!ws["!data"][__R]) ws["!data"][__R] = [];
			row = ws["!data"][__R];
		}
		var data_R = data[R];
		for (var C = 0; C != data_R.length; ++C) {
			if (typeof data_R[C] === "undefined") continue;
			var cell = {
				v: data_R[C],
				t: ""
			};
			var __C = _C + C;
			if (range.s.r > __R) range.s.r = __R;
			if (range.s.c > __C) range.s.c = __C;
			if (range.e.r < __R) range.e.r = __R;
			if (range.e.c < __C) range.e.c = __C;
			seen = true;
			if (data_R[C] && typeof data_R[C] === "object" && !Array.isArray(data_R[C]) && !(data_R[C] instanceof Date)) cell = data_R[C];
			else {
				if (Array.isArray(cell.v)) {
					cell.f = data_R[C][1];
					cell.v = cell.v[0];
				}
				if (cell.v === null) if (cell.f) cell.t = "n";
				else if (o.nullError) {
					cell.t = "e";
					cell.v = 0;
				} else if (!o.sheetStubs) continue;
				else cell.t = "z";
				else if (typeof cell.v === "number") if (isFinite(cell.v)) cell.t = "n";
				else if (isNaN(cell.v)) {
					cell.t = "e";
					cell.v = 15;
				} else {
					cell.t = "e";
					cell.v = 7;
				}
				else if (typeof cell.v === "boolean") cell.t = "b";
				else if (cell.v instanceof Date) {
					cell.z = o.dateNF || table_fmt[14];
					if (!o.UTC) cell.v = local_to_utc(cell.v);
					if (o.cellDates) {
						cell.t = "d";
						cell.w = SSF_format(cell.z, datenum(cell.v, o.date1904));
					} else {
						cell.t = "n";
						cell.v = datenum(cell.v, o.date1904);
						cell.w = SSF_format(cell.z, cell.v);
					}
				} else cell.t = "s";
			}
			if (dense) {
				if (row[__C] && row[__C].z) cell.z = row[__C].z;
				row[__C] = cell;
			} else {
				var cell_ref = encode_col(__C) + (__R + 1);
				if (ws[cell_ref] && ws[cell_ref].z) cell.z = ws[cell_ref].z;
				ws[cell_ref] = cell;
			}
		}
	}
	if (seen && range.s.c < 104e5) ws["!ref"] = encode_range(range);
	return ws;
}
function aoa_to_sheet(data, opts) {
	return sheet_add_aoa(null, data, opts);
}
function parse_Int32LE(data) {
	return data.read_shift(4, "i");
}
function parse_XLWideString(data) {
	var cchCharacters = data.read_shift(4);
	return cchCharacters === 0 ? "" : data.read_shift(cchCharacters, "dbcs");
}
function parse_StrRun(data) {
	return {
		ich: data.read_shift(2),
		ifnt: data.read_shift(2)
	};
}
function parse_RichStr(data, length) {
	var start = data.l;
	var flags = data.read_shift(1);
	var str = parse_XLWideString(data);
	var rgsStrRun = [];
	var z = {
		t: str,
		h: str
	};
	if ((flags & 1) !== 0) {
		var dwSizeStrRun = data.read_shift(4);
		for (var i = 0; i != dwSizeStrRun; ++i) rgsStrRun.push(parse_StrRun(data));
		z.r = rgsStrRun;
	} else z.r = [{
		ich: 0,
		ifnt: 0
	}];
	data.l = start + length;
	return z;
}
var parse_BrtCommentText = parse_RichStr;
function parse_XLSBCell(data) {
	var col = data.read_shift(4);
	var iStyleRef = data.read_shift(2);
	iStyleRef += data.read_shift(1) << 16;
	data.l++;
	return {
		c: col,
		iStyleRef
	};
}
function parse_XLSBShortCell(data) {
	var iStyleRef = data.read_shift(2);
	iStyleRef += data.read_shift(1) << 16;
	data.l++;
	return {
		c: -1,
		iStyleRef
	};
}
var parse_XLSBCodeName = parse_XLWideString;
function parse_XLNullableWideString(data) {
	var cchCharacters = data.read_shift(4);
	return cchCharacters === 0 || cchCharacters === 4294967295 ? "" : data.read_shift(cchCharacters, "dbcs");
}
var parse_XLNameWideString = parse_XLWideString;
var parse_RelID = parse_XLNullableWideString;
function parse_RkNumber(data) {
	var b = data.slice(data.l, data.l + 4);
	var fX100 = b[0] & 1, fInt = b[0] & 2;
	data.l += 4;
	var RK = fInt === 0 ? __double([
		0,
		0,
		0,
		0,
		b[0] & 252,
		b[1],
		b[2],
		b[3]
	], 0) : __readInt32LE(b, 0) >> 2;
	return fX100 ? RK / 100 : RK;
}
function parse_RfX(data) {
	var cell = {
		s: {},
		e: {}
	};
	cell.s.r = data.read_shift(4);
	cell.e.r = data.read_shift(4);
	cell.s.c = data.read_shift(4);
	cell.e.c = data.read_shift(4);
	return cell;
}
var parse_UncheckedRfX = parse_RfX;
function parse_Xnum(data) {
	if (data.length - data.l < 8) throw "XLS Xnum Buffer underflow";
	return data.read_shift(8, "f");
}
function parse_BrtColor(data) {
	var out = {};
	var xColorType = data.read_shift(1) >>> 1;
	var index = data.read_shift(1);
	var nTS = data.read_shift(2, "i");
	var bR = data.read_shift(1);
	var bG = data.read_shift(1);
	var bB = data.read_shift(1);
	data.l++;
	switch (xColorType) {
		case 0:
			out.auto = 1;
			break;
		case 1:
			out.index = index;
			var icv = XLSIcv[index];
			if (icv) out.rgb = rgb2Hex(icv);
			break;
		case 2:
			out.rgb = rgb2Hex([
				bR,
				bG,
				bB
			]);
			break;
		case 3: out.theme = index;
	}
	if (nTS != 0) out.tint = nTS > 0 ? nTS / 32767 : nTS / 32768;
	return out;
}
function parse_FontFlags(data) {
	var d = data.read_shift(1);
	data.l++;
	return {
		fBold: d & 1,
		fItalic: d & 2,
		fUnderline: d & 4,
		fStrikeout: d & 8,
		fOutline: d & 16,
		fShadow: d & 32,
		fCondense: d & 64,
		fExtend: d & 128
	};
}
function parse_ClipboardFormatOrString(o, w) {
	var ClipFmt = {
		2: "BITMAP",
		3: "METAFILEPICT",
		8: "DIB",
		14: "ENHMETAFILE"
	};
	var m = o.read_shift(4);
	switch (m) {
		case 0: return "";
		case 4294967295:
		case 4294967294: return ClipFmt[o.read_shift(4)] || "";
	}
	if (m > 400) throw new Error("Unsupported Clipboard: " + m.toString(16));
	o.l -= 4;
	return o.read_shift(0, w == 1 ? "lpstr" : "lpwstr");
}
function parse_ClipboardFormatOrAnsiString(o) {
	return parse_ClipboardFormatOrString(o, 1);
}
function parse_ClipboardFormatOrUnicodeString(o) {
	return parse_ClipboardFormatOrString(o, 2);
}
var VT_I2 = 2;
var VT_I4 = 3;
var VT_BOOL = 11;
var VT_VARIANT = 12;
var VT_UI4 = 19;
var VT_FILETIME = 64;
var VT_BLOB = 65;
var VT_CF = 71;
var VT_VECTOR_VARIANT = 4108;
var VT_VECTOR_LPSTR = 4126;
var VT_STRING = 80;
var VT_USTR = 81;
var VT_CUSTOM = [VT_STRING, VT_USTR];
var DocSummaryPIDDSI = {
	1: {
		n: "CodePage",
		t: VT_I2
	},
	2: {
		n: "Category",
		t: VT_STRING
	},
	3: {
		n: "PresentationFormat",
		t: VT_STRING
	},
	4: {
		n: "ByteCount",
		t: VT_I4
	},
	5: {
		n: "LineCount",
		t: VT_I4
	},
	6: {
		n: "ParagraphCount",
		t: VT_I4
	},
	7: {
		n: "SlideCount",
		t: VT_I4
	},
	8: {
		n: "NoteCount",
		t: VT_I4
	},
	9: {
		n: "HiddenCount",
		t: VT_I4
	},
	10: {
		n: "MultimediaClipCount",
		t: VT_I4
	},
	11: {
		n: "ScaleCrop",
		t: VT_BOOL
	},
	12: {
		n: "HeadingPairs",
		t: VT_VECTOR_VARIANT
	},
	13: {
		n: "TitlesOfParts",
		t: VT_VECTOR_LPSTR
	},
	14: {
		n: "Manager",
		t: VT_STRING
	},
	15: {
		n: "Company",
		t: VT_STRING
	},
	16: {
		n: "LinksUpToDate",
		t: VT_BOOL
	},
	17: {
		n: "CharacterCount",
		t: VT_I4
	},
	19: {
		n: "SharedDoc",
		t: VT_BOOL
	},
	22: {
		n: "HyperlinksChanged",
		t: VT_BOOL
	},
	23: {
		n: "AppVersion",
		t: VT_I4,
		p: "version"
	},
	24: {
		n: "DigSig",
		t: VT_BLOB
	},
	26: {
		n: "ContentType",
		t: VT_STRING
	},
	27: {
		n: "ContentStatus",
		t: VT_STRING
	},
	28: {
		n: "Language",
		t: VT_STRING
	},
	29: {
		n: "Version",
		t: VT_STRING
	},
	255: {},
	2147483648: {
		n: "Locale",
		t: VT_UI4
	},
	2147483651: {
		n: "Behavior",
		t: VT_UI4
	},
	1919054434: {}
};
var SummaryPIDSI = {
	1: {
		n: "CodePage",
		t: VT_I2
	},
	2: {
		n: "Title",
		t: VT_STRING
	},
	3: {
		n: "Subject",
		t: VT_STRING
	},
	4: {
		n: "Author",
		t: VT_STRING
	},
	5: {
		n: "Keywords",
		t: VT_STRING
	},
	6: {
		n: "Comments",
		t: VT_STRING
	},
	7: {
		n: "Template",
		t: VT_STRING
	},
	8: {
		n: "LastAuthor",
		t: VT_STRING
	},
	9: {
		n: "RevNumber",
		t: VT_STRING
	},
	10: {
		n: "EditTime",
		t: VT_FILETIME
	},
	11: {
		n: "LastPrinted",
		t: VT_FILETIME
	},
	12: {
		n: "CreatedDate",
		t: VT_FILETIME
	},
	13: {
		n: "ModifiedDate",
		t: VT_FILETIME
	},
	14: {
		n: "PageCount",
		t: VT_I4
	},
	15: {
		n: "WordCount",
		t: VT_I4
	},
	16: {
		n: "CharCount",
		t: VT_I4
	},
	17: {
		n: "Thumbnail",
		t: VT_CF
	},
	18: {
		n: "Application",
		t: VT_STRING
	},
	19: {
		n: "DocSecurity",
		t: VT_I4
	},
	255: {},
	2147483648: {
		n: "Locale",
		t: VT_UI4
	},
	2147483651: {
		n: "Behavior",
		t: VT_UI4
	},
	1919054434: {}
};
var CountryEnum = {
	1: "US",
	2: "CA",
	3: "",
	7: "RU",
	20: "EG",
	30: "GR",
	31: "NL",
	32: "BE",
	33: "FR",
	34: "ES",
	36: "HU",
	39: "IT",
	41: "CH",
	43: "AT",
	44: "GB",
	45: "DK",
	46: "SE",
	47: "NO",
	48: "PL",
	49: "DE",
	52: "MX",
	55: "BR",
	61: "AU",
	64: "NZ",
	66: "TH",
	81: "JP",
	82: "KR",
	84: "VN",
	86: "CN",
	90: "TR",
	105: "JS",
	213: "DZ",
	216: "MA",
	218: "LY",
	351: "PT",
	354: "IS",
	358: "FI",
	420: "CZ",
	886: "TW",
	961: "LB",
	962: "JO",
	963: "SY",
	964: "IQ",
	965: "KW",
	966: "SA",
	971: "AE",
	972: "IL",
	974: "QA",
	981: "IR",
	65535: "US"
};
var XLSFillPattern = [
	null,
	"solid",
	"mediumGray",
	"darkGray",
	"lightGray",
	"darkHorizontal",
	"darkVertical",
	"darkDown",
	"darkUp",
	"darkGrid",
	"darkTrellis",
	"lightHorizontal",
	"lightVertical",
	"lightDown",
	"lightUp",
	"lightGrid",
	"lightTrellis",
	"gray125",
	"gray0625"
];
function rgbify(arr) {
	return arr.map(function(x) {
		return [
			x >> 16 & 255,
			x >> 8 & 255,
			x & 255
		];
	});
}
var XLSIcv = /*#__PURE__*/ dup(/* @__PURE__ */ rgbify([
	0,
	16777215,
	16711680,
	65280,
	255,
	16776960,
	16711935,
	65535,
	0,
	16777215,
	16711680,
	65280,
	255,
	16776960,
	16711935,
	65535,
	8388608,
	32768,
	128,
	8421376,
	8388736,
	32896,
	12632256,
	8421504,
	10066431,
	10040166,
	16777164,
	13434879,
	6684774,
	16744576,
	26316,
	13421823,
	128,
	16711935,
	16776960,
	65535,
	8388736,
	8388608,
	32896,
	255,
	52479,
	13434879,
	13434828,
	16777113,
	10079487,
	16751052,
	13408767,
	16764057,
	3368703,
	3394764,
	10079232,
	16763904,
	16750848,
	16737792,
	6710937,
	9868950,
	13158,
	3381606,
	13056,
	3355392,
	10040064,
	10040166,
	3355545,
	3355443,
	0,
	16777215,
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
	0
]));
var BErr = {
	0: "#NULL!",
	7: "#DIV/0!",
	15: "#VALUE!",
	23: "#REF!",
	29: "#NAME?",
	36: "#NUM!",
	42: "#N/A",
	43: "#GETTING_DATA",
	255: "#WTF?"
};
var RBErr = {
	"#NULL!": 0,
	"#DIV/0!": 7,
	"#VALUE!": 15,
	"#REF!": 23,
	"#NAME?": 29,
	"#NUM!": 36,
	"#N/A": 42,
	"#GETTING_DATA": 43,
	"#WTF?": 255
};
var XLSLblBuiltIn = [
	"_xlnm.Consolidate_Area",
	"_xlnm.Auto_Open",
	"_xlnm.Auto_Close",
	"_xlnm.Extract",
	"_xlnm.Database",
	"_xlnm.Criteria",
	"_xlnm.Print_Area",
	"_xlnm.Print_Titles",
	"_xlnm.Recorder",
	"_xlnm.Data_Form",
	"_xlnm.Auto_Activate",
	"_xlnm.Auto_Deactivate",
	"_xlnm.Sheet_Title",
	"_xlnm._FilterDatabase"
];
var ct2type = {
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": "workbooks",
	"application/vnd.ms-excel.sheet.macroEnabled.main+xml": "workbooks",
	"application/vnd.ms-excel.sheet.binary.macroEnabled.main": "workbooks",
	"application/vnd.ms-excel.addin.macroEnabled.main+xml": "workbooks",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": "workbooks",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": "sheets",
	"application/vnd.ms-excel.worksheet": "sheets",
	"application/vnd.ms-excel.binIndexWs": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": "charts",
	"application/vnd.ms-excel.chartsheet": "charts",
	"application/vnd.ms-excel.macrosheet+xml": "macros",
	"application/vnd.ms-excel.macrosheet": "macros",
	"application/vnd.ms-excel.intlmacrosheet": "TODO",
	"application/vnd.ms-excel.binIndexMs": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": "dialogs",
	"application/vnd.ms-excel.dialogsheet": "dialogs",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml": "strs",
	"application/vnd.ms-excel.sharedStrings": "strs",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": "styles",
	"application/vnd.ms-excel.styles": "styles",
	"application/vnd.openxmlformats-package.core-properties+xml": "coreprops",
	"application/vnd.openxmlformats-officedocument.custom-properties+xml": "custprops",
	"application/vnd.openxmlformats-officedocument.extended-properties+xml": "extprops",
	"application/vnd.openxmlformats-officedocument.customXmlProperties+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.customProperty": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": "comments",
	"application/vnd.ms-excel.comments": "comments",
	"application/vnd.ms-excel.threadedcomments+xml": "threadedcomments",
	"application/vnd.ms-excel.person+xml": "people",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml": "metadata",
	"application/vnd.ms-excel.sheetMetadata": "metadata",
	"application/vnd.ms-excel.pivotTable": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.drawingml.chart+xml": "TODO",
	"application/vnd.ms-office.chartcolorstyle+xml": "TODO",
	"application/vnd.ms-office.chartstyle+xml": "TODO",
	"application/vnd.ms-office.chartex+xml": "TODO",
	"application/vnd.ms-excel.calcChain": "calcchains",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml": "calcchains",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.printerSettings": "TODO",
	"application/vnd.ms-office.activeX": "TODO",
	"application/vnd.ms-office.activeX+xml": "TODO",
	"application/vnd.ms-excel.attachedToolbars": "TODO",
	"application/vnd.ms-excel.connections": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": "TODO",
	"application/vnd.ms-excel.externalLink": "links",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml": "links",
	"application/vnd.ms-excel.pivotCacheDefinition": "TODO",
	"application/vnd.ms-excel.pivotCacheRecords": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml": "TODO",
	"application/vnd.ms-excel.queryTable": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.queryTable+xml": "TODO",
	"application/vnd.ms-excel.userNames": "TODO",
	"application/vnd.ms-excel.revisionHeaders": "TODO",
	"application/vnd.ms-excel.revisionLog": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionHeaders+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionLog+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.userNames+xml": "TODO",
	"application/vnd.ms-excel.tableSingleCells": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.tableSingleCells+xml": "TODO",
	"application/vnd.ms-excel.slicer": "TODO",
	"application/vnd.ms-excel.slicerCache": "TODO",
	"application/vnd.ms-excel.slicer+xml": "TODO",
	"application/vnd.ms-excel.slicerCache+xml": "TODO",
	"application/vnd.ms-excel.wsSortMap": "TODO",
	"application/vnd.ms-excel.table": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.theme+xml": "themes",
	"application/vnd.openxmlformats-officedocument.themeOverride+xml": "TODO",
	"application/vnd.ms-excel.Timeline+xml": "TODO",
	"application/vnd.ms-excel.TimelineCache+xml": "TODO",
	"application/vnd.ms-office.vbaProject": "vba",
	"application/vnd.ms-office.vbaProjectSignature": "TODO",
	"application/vnd.ms-office.volatileDependencies": "TODO",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.volatileDependencies+xml": "TODO",
	"application/vnd.ms-excel.controlproperties+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.model+data": "TODO",
	"application/vnd.ms-excel.Survey+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.drawing+xml": "drawings",
	"application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.drawingml.diagramColors+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.drawingml.diagramStyle+xml": "TODO",
	"application/vnd.openxmlformats-officedocument.vmlDrawing": "TODO",
	"application/vnd.openxmlformats-package.relationships+xml": "rels",
	"application/vnd.openxmlformats-officedocument.oleObject": "TODO",
	"image/png": "TODO",
	"sheet": "js"
};
function new_ct() {
	return {
		workbooks: [],
		sheets: [],
		charts: [],
		dialogs: [],
		macros: [],
		rels: [],
		strs: [],
		comments: [],
		threadedcomments: [],
		links: [],
		coreprops: [],
		extprops: [],
		custprops: [],
		themes: [],
		styles: [],
		calcchains: [],
		vba: [],
		drawings: [],
		metadata: [],
		people: [],
		TODO: [],
		xmlns: ""
	};
}
function parse_ct(data) {
	var ct = new_ct();
	if (!data || !data.match) return ct;
	var ctext = {};
	(data.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		switch (y[0].replace(nsregex, "<")) {
			case "<?xml": break;
			case "<Types":
				ct.xmlns = y["xmlns" + (y[0].match(/<(\w+):/) || ["", ""])[1]];
				break;
			case "<Default":
				ctext[y.Extension.toLowerCase()] = y.ContentType;
				break;
			case "<Override": if (ct[ct2type[y.ContentType]] !== void 0) ct[ct2type[y.ContentType]].push(y.PartName);
		}
	});
	if (ct.xmlns !== XMLNS.CT) throw new Error("Unknown Namespace: " + ct.xmlns);
	ct.calcchain = ct.calcchains.length > 0 ? ct.calcchains[0] : "";
	ct.sst = ct.strs.length > 0 ? ct.strs[0] : "";
	ct.style = ct.styles.length > 0 ? ct.styles[0] : "";
	ct.defaults = ctext;
	delete ct.calcchains;
	return ct;
}
var RELS = {
	WB: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
	SHEET: "http://sheetjs.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
	HLINK: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
	VML: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing",
	XPATH: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLinkPath",
	XMISS: "http://schemas.microsoft.com/office/2006/relationships/xlExternalLinkPath/xlPathMissing",
	XLINK: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLink",
	CXML: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml",
	CXMLP: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps",
	CMNT: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments",
	CORE_PROPS: "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
	EXT_PROPS: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties",
	CUST_PROPS: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties",
	SST: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings",
	STY: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles",
	THEME: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme",
	CHART: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart",
	CHARTEX: "http://schemas.microsoft.com/office/2014/relationships/chartEx",
	CS: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chartsheet",
	WS: ["http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet", "http://purl.oclc.org/ooxml/officeDocument/relationships/worksheet"],
	DS: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/dialogsheet",
	MS: "http://schemas.microsoft.com/office/2006/relationships/xlMacrosheet",
	IMG: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
	DRAW: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing",
	TABLE: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/table",
	XLMETA: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sheetMetadata",
	TCMNT: "http://schemas.microsoft.com/office/2017/10/relationships/threadedComment",
	PEOPLE: "http://schemas.microsoft.com/office/2017/10/relationships/person",
	CONN: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/connections",
	VBA: "http://schemas.microsoft.com/office/2006/relationships/vbaProject"
};
function get_rels_path(file) {
	var n = file.lastIndexOf("/");
	return file.slice(0, n + 1) + "_rels/" + file.slice(n + 1) + ".rels";
}
function parse_rels(data, currentFilePath) {
	var rels = { "!id": {} };
	if (!data) return rels;
	if (currentFilePath.charAt(0) !== "/") currentFilePath = "/" + currentFilePath;
	var hash = {};
	(data.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		if (y[0] === "<Relationship") {
			var rel = {};
			rel.Type = y.Type;
			rel.Target = unescapexml(y.Target);
			rel.Id = y.Id;
			if (y.TargetMode) rel.TargetMode = y.TargetMode;
			var canonictarget = y.TargetMode === "External" ? y.Target : resolve_path(y.Target, currentFilePath);
			rels[canonictarget] = rel;
			hash[y.Id] = rel;
		}
	});
	rels["!id"] = hash;
	return rels;
}
var CT_ODS = "application/vnd.oasis.opendocument.spreadsheet";
function parse_manifest(d, opts) {
	var str = xlml_normalize(d);
	var Rn;
	var FEtag;
	while (Rn = xlmlregex.exec(str)) switch (Rn[3]) {
		case "manifest": break;
		case "file-entry":
			FEtag = parsexmltag(Rn[0], false);
			if (FEtag.path == "/" && FEtag.type !== CT_ODS) throw new Error("This OpenDocument is not a spreadsheet");
			break;
		case "encryption-data":
		case "algorithm":
		case "start-key-generation":
		case "key-derivation": throw new Error("Unsupported ODS Encryption");
		default: if (opts && opts.WTF) throw Rn;
	}
}
var CORE_PROPS = [
	["cp:category", "Category"],
	["cp:contentStatus", "ContentStatus"],
	["cp:keywords", "Keywords"],
	["cp:lastModifiedBy", "LastAuthor"],
	["cp:lastPrinted", "LastPrinted"],
	["cp:revision", "RevNumber"],
	["cp:version", "Version"],
	["dc:creator", "Author"],
	["dc:description", "Comments"],
	["dc:identifier", "Identifier"],
	["dc:language", "Language"],
	["dc:subject", "Subject"],
	["dc:title", "Title"],
	[
		"dcterms:created",
		"CreatedDate",
		"date"
	],
	[
		"dcterms:modified",
		"ModifiedDate",
		"date"
	]
];
function parse_core_props(data) {
	var p = {};
	data = utf8read(data);
	for (var i = 0; i < CORE_PROPS.length; ++i) {
		var f = CORE_PROPS[i], cur = str_match_xml(data, f[0]);
		if (cur != null && cur.length > 0) p[f[1]] = unescapexml(cur[1]);
		if (f[2] === "date" && p[f[1]]) p[f[1]] = parseDate(p[f[1]]);
	}
	return p;
}
var EXT_PROPS = [
	[
		"Application",
		"Application",
		"string"
	],
	[
		"AppVersion",
		"AppVersion",
		"string"
	],
	[
		"Company",
		"Company",
		"string"
	],
	[
		"DocSecurity",
		"DocSecurity",
		"string"
	],
	[
		"Manager",
		"Manager",
		"string"
	],
	[
		"HyperlinksChanged",
		"HyperlinksChanged",
		"bool"
	],
	[
		"SharedDoc",
		"SharedDoc",
		"bool"
	],
	[
		"LinksUpToDate",
		"LinksUpToDate",
		"bool"
	],
	[
		"ScaleCrop",
		"ScaleCrop",
		"bool"
	],
	[
		"HeadingPairs",
		"HeadingPairs",
		"raw"
	],
	[
		"TitlesOfParts",
		"TitlesOfParts",
		"raw"
	]
];
function load_props_pairs(HP, TOP, props, opts) {
	var v = [];
	if (typeof HP == "string") v = parseVector(HP, opts);
	else for (var j = 0; j < HP.length; ++j) v = v.concat(HP[j].map(function(hp) {
		return { v: hp };
	}));
	var parts = typeof TOP == "string" ? parseVector(TOP, opts).map(function(x) {
		return x.v;
	}) : TOP;
	var idx = 0, len = 0;
	if (parts.length > 0) for (var i = 0; i !== v.length; i += 2) {
		len = +v[i + 1].v;
		switch (v[i].v) {
			case "Worksheets":
			case "工作表":
			case "Листы":
			case "أوراق العمل":
			case "ワークシート":
			case "גליונות עבודה":
			case "Arbeitsblätter":
			case "Çalışma Sayfaları":
			case "Feuilles de calcul":
			case "Fogli di lavoro":
			case "Folhas de cálculo":
			case "Planilhas":
			case "Regneark":
			case "Hojas de cálculo":
			case "Werkbladen":
				props.Worksheets = len;
				props.SheetNames = parts.slice(idx, idx + len);
				break;
			case "Named Ranges":
			case "Rangos con nombre":
			case "名前付き一覧":
			case "Benannte Bereiche":
			case "Navngivne områder":
				props.NamedRanges = len;
				props.DefinedNames = parts.slice(idx, idx + len);
				break;
			case "Charts":
			case "Diagramme":
				props.Chartsheets = len;
				props.ChartNames = parts.slice(idx, idx + len);
		}
		idx += len;
	}
}
function parse_ext_props(data, p, opts) {
	var q = {};
	if (!p) p = {};
	data = utf8read(data);
	EXT_PROPS.forEach(function(f) {
		var xml = (str_match_xml_ns(data, f[0]) || [])[1];
		switch (f[2]) {
			case "string":
				if (xml) p[f[1]] = unescapexml(xml);
				break;
			case "bool":
				p[f[1]] = xml === "true";
				break;
			case "raw":
				var cur = str_match_xml(data, f[0]);
				if (cur && cur.length > 0) q[f[1]] = cur[1];
		}
	});
	if (q.HeadingPairs && q.TitlesOfParts) load_props_pairs(q.HeadingPairs, q.TitlesOfParts, p, opts);
	return p;
}
var custregex = /<[^<>]+>[^<]*/g;
function parse_cust_props(data, opts) {
	var p = {}, name = "";
	var m = data.match(custregex);
	if (m) for (var i = 0; i != m.length; ++i) {
		var x = m[i], y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<?xml": break;
			case "<Properties": break;
			case "<property":
				name = unescapexml(y.name);
				break;
			case "</property>":
				name = null;
				break;
			default: if (x.indexOf("<vt:") === 0) {
				var toks = x.split(">");
				var type = toks[0].slice(4), text = toks[1];
				switch (type) {
					case "lpstr":
					case "bstr":
					case "lpwstr":
						p[name] = unescapexml(text);
						break;
					case "bool":
						p[name] = parsexmlbool(text);
						break;
					case "i1":
					case "i2":
					case "i4":
					case "i8":
					case "int":
					case "uint":
						p[name] = parseInt(text, 10);
						break;
					case "r4":
					case "r8":
					case "decimal":
						p[name] = parseFloat(text);
						break;
					case "filetime":
					case "date":
						p[name] = parseDate(text);
						break;
					case "cy":
					case "error":
						p[name] = unescapexml(text);
						break;
					default:
						if (type.slice(-1) == "/") break;
						if (opts.WTF && typeof console !== "undefined") console.warn("Unexpected", x, type, toks);
				}
			} else if (x.slice(0, 2) === "</") {} else if (opts.WTF) throw new Error(x);
		}
	}
	return p;
}
var XLMLDocPropsMap = {
	Title: "Title",
	Subject: "Subject",
	Author: "Author",
	Keywords: "Keywords",
	Comments: "Description",
	LastAuthor: "LastAuthor",
	RevNumber: "Revision",
	Application: "AppName",
	LastPrinted: "LastPrinted",
	CreatedDate: "Created",
	ModifiedDate: "LastSaved",
	Category: "Category",
	Manager: "Manager",
	Company: "Company",
	AppVersion: "Version",
	ContentStatus: "ContentStatus",
	Identifier: "Identifier",
	Language: "Language"
};
var evert_XLMLDPM;
function xlml_set_prop(Props, tag, val) {
	if (!evert_XLMLDPM) evert_XLMLDPM = evert(XLMLDocPropsMap);
	tag = evert_XLMLDPM[tag] || tag;
	Props[tag] = val;
}
function parse_FILETIME(blob) {
	var dwLowDateTime = blob.read_shift(4), dwHighDateTime = blob.read_shift(4);
	return (/* @__PURE__ */ new Date((dwHighDateTime / 1e7 * Math.pow(2, 32) + dwLowDateTime / 1e7 - 11644473600) * 1e3)).toISOString().replace(/\.000/, "");
}
function parse_lpstr(blob, type, pad) {
	var start = blob.l;
	var str = blob.read_shift(0, "lpstr-cp");
	if (pad) while (blob.l - start & 3) ++blob.l;
	return str;
}
function parse_lpwstr(blob, type, pad) {
	var str = blob.read_shift(0, "lpwstr");
	if (pad) blob.l += 4 - (str.length + 1 & 3) & 3;
	return str;
}
function parse_VtStringBase(blob, stringType, pad) {
	if (stringType === 31) return parse_lpwstr(blob);
	return parse_lpstr(blob, stringType, pad);
}
function parse_VtString(blob, t, pad) {
	return parse_VtStringBase(blob, t, pad === false ? 0 : 4);
}
function parse_VtUnalignedString(blob, t) {
	if (!t) throw new Error("VtUnalignedString must have positive length");
	return parse_VtStringBase(blob, t, 0);
}
function parse_VtVecLpwstrValue(blob) {
	var length = blob.read_shift(4);
	var ret = [];
	for (var i = 0; i != length; ++i) {
		var start = blob.l;
		ret[i] = blob.read_shift(0, "lpwstr").replace(chr0, "");
		if (blob.l - start & 2) blob.l += 2;
	}
	return ret;
}
function parse_VtVecUnalignedLpstrValue(blob) {
	var length = blob.read_shift(4);
	var ret = [];
	for (var i = 0; i != length; ++i) ret[i] = blob.read_shift(0, "lpstr-cp").replace(chr0, "");
	return ret;
}
function parse_VtHeadingPair(blob) {
	var start = blob.l;
	var headingString = parse_TypedPropertyValue(blob, VT_USTR);
	if (blob[blob.l] == 0 && blob[blob.l + 1] == 0 && blob.l - start & 2) blob.l += 2;
	return [headingString, parse_TypedPropertyValue(blob, VT_I4)];
}
function parse_VtVecHeadingPairValue(blob) {
	var cElements = blob.read_shift(4);
	var out = [];
	for (var i = 0; i < cElements / 2; ++i) out.push(parse_VtHeadingPair(blob));
	return out;
}
function parse_dictionary(blob, CodePage) {
	var cnt = blob.read_shift(4);
	var dict = {};
	for (var j = 0; j != cnt; ++j) {
		var pid = blob.read_shift(4);
		var len = blob.read_shift(4);
		dict[pid] = blob.read_shift(len, CodePage === 1200 ? "utf16le" : "utf8").replace(chr0, "").replace(chr1, "!");
		if (CodePage === 1200 && len % 2) blob.l += 2;
	}
	if (blob.l & 3) blob.l = blob.l >> 3 << 2;
	return dict;
}
function parse_BLOB(blob) {
	var size = blob.read_shift(4);
	var bytes = blob.slice(blob.l, blob.l + size);
	blob.l += size;
	if ((size & 3) > 0) blob.l += 4 - (size & 3) & 3;
	return bytes;
}
function parse_ClipboardData(blob) {
	var o = {};
	o.Size = blob.read_shift(4);
	blob.l += o.Size + 3 - (o.Size - 1) % 4;
	return o;
}
function parse_TypedPropertyValue(blob, type, _opts) {
	var t = blob.read_shift(2), ret, opts = _opts || {};
	blob.l += 2;
	if (type !== VT_VARIANT) {
		if (t !== type && VT_CUSTOM.indexOf(type) === -1 && !((type & 65534) == 4126 && (t & 65534) == 4126)) throw new Error("Expected type " + type + " saw " + t);
	}
	switch (type === VT_VARIANT ? t : type) {
		case 2:
			ret = blob.read_shift(2, "i");
			if (!opts.raw) blob.l += 2;
			return ret;
		case 3:
			ret = blob.read_shift(4, "i");
			return ret;
		case 11: return blob.read_shift(4) !== 0;
		case 19:
			ret = blob.read_shift(4);
			return ret;
		case 30:
			blob.l += 4;
			return parse_VtString(blob, blob[blob.l - 4]).replace(/(^|[^\u0000])\u0000+$/, "$1");
		case 31:
			blob.l += 4;
			return parse_VtString(blob, blob[blob.l - 4]).replace(/(^|[^\u0000])\u0000+$/, "$1");
		case 64: return parse_FILETIME(blob);
		case 65: return parse_BLOB(blob);
		case 71: return parse_ClipboardData(blob);
		case 80: return parse_VtString(blob, t, !opts.raw).replace(chr0, "");
		case 81: return parse_VtUnalignedString(blob, t).replace(chr0, "");
		case 4108: return parse_VtVecHeadingPairValue(blob);
		case 4126:
		case 4127: return t == 4127 ? parse_VtVecLpwstrValue(blob) : parse_VtVecUnalignedLpstrValue(blob);
		default: throw new Error("TypedPropertyValue unrecognized type " + type + " " + t);
	}
}
function parse_PropertySet(blob, PIDSI) {
	var start_addr = blob.l;
	var size = blob.read_shift(4);
	var NumProps = blob.read_shift(4);
	var Props = [], i = 0;
	var CodePage = 0;
	var Dictionary = -1, DictObj = {};
	for (i = 0; i != NumProps; ++i) {
		var PropID = blob.read_shift(4);
		var Offset = blob.read_shift(4);
		Props[i] = [PropID, Offset + start_addr];
	}
	Props.sort(function(x, y) {
		return x[1] - y[1];
	});
	var PropH = {};
	for (i = 0; i != NumProps; ++i) {
		if (blob.l !== Props[i][1]) {
			var fail = true;
			if (i > 0 && PIDSI) switch (PIDSI[Props[i - 1][0]].t) {
				case 2:
					if (blob.l + 2 === Props[i][1]) {
						blob.l += 2;
						fail = false;
					}
					break;
				case 80:
					if (blob.l <= Props[i][1]) {
						blob.l = Props[i][1];
						fail = false;
					}
					break;
				case 4108:
					if (blob.l <= Props[i][1]) {
						blob.l = Props[i][1];
						fail = false;
					}
					break;
			}
			if ((!PIDSI || i == 0) && blob.l <= Props[i][1]) {
				fail = false;
				blob.l = Props[i][1];
			}
			if (fail) throw new Error("Read Error: Expected address " + Props[i][1] + " at " + blob.l + " :" + i);
		}
		if (PIDSI) {
			if (Props[i][0] == 0 && Props.length > i + 1 && Props[i][1] == Props[i + 1][1]) continue;
			var piddsi = PIDSI[Props[i][0]];
			PropH[piddsi.n] = parse_TypedPropertyValue(blob, piddsi.t, { raw: true });
			if (piddsi.p === "version") PropH[piddsi.n] = String(PropH[piddsi.n] >> 16) + "." + ("0000" + String(PropH[piddsi.n] & 65535)).slice(-4);
			if (piddsi.n == "CodePage") switch (PropH[piddsi.n]) {
				case 0: PropH[piddsi.n] = 1252;
				case 874:
				case 932:
				case 936:
				case 949:
				case 950:
				case 1250:
				case 1251:
				case 1253:
				case 1254:
				case 1255:
				case 1256:
				case 1257:
				case 1258:
				case 1e4:
				case 1200:
				case 1201:
				case 1252:
				case 65e3:
				case -536:
				case 65001:
				case -535:
					set_cp(CodePage = PropH[piddsi.n] >>> 0 & 65535);
					break;
				default: throw new Error("Unsupported CodePage: " + PropH[piddsi.n]);
			}
		} else if (Props[i][0] === 1) {
			CodePage = PropH.CodePage = parse_TypedPropertyValue(blob, VT_I2);
			set_cp(CodePage);
			if (Dictionary !== -1) {
				var oldpos = blob.l;
				blob.l = Props[Dictionary][1];
				DictObj = parse_dictionary(blob, CodePage);
				blob.l = oldpos;
			}
		} else if (Props[i][0] === 0) {
			if (CodePage === 0) {
				Dictionary = i;
				blob.l = Props[i + 1][1];
				continue;
			}
			DictObj = parse_dictionary(blob, CodePage);
		} else {
			var name = DictObj[Props[i][0]];
			var val;
			switch (blob[blob.l]) {
				case 65:
					blob.l += 4;
					val = parse_BLOB(blob);
					break;
				case 30:
					blob.l += 4;
					val = parse_VtString(blob, blob[blob.l - 4]).replace(/(^|[^\u0000])\u0000+$/, "$1");
					break;
				case 31:
					blob.l += 4;
					val = parse_VtString(blob, blob[blob.l - 4]).replace(/(^|[^\u0000])\u0000+$/, "$1");
					break;
				case 3:
					blob.l += 4;
					val = blob.read_shift(4, "i");
					break;
				case 19:
					blob.l += 4;
					val = blob.read_shift(4);
					break;
				case 5:
					blob.l += 4;
					val = blob.read_shift(8, "f");
					break;
				case 11:
					blob.l += 4;
					val = parsebool(blob, 4);
					break;
				case 64:
					blob.l += 4;
					val = parseDate(parse_FILETIME(blob));
					break;
				default: throw new Error("unparsed value: " + blob[blob.l]);
			}
			PropH[name] = val;
		}
	}
	blob.l = start_addr + size;
	return PropH;
}
function parse_PropertySetStream(file, PIDSI, clsid) {
	var blob = file.content;
	if (!blob) return {};
	prep_blob(blob, 0);
	var NumSets, FMTID0, FMTID1, Offset0, Offset1 = 0;
	blob.chk("feff", "Byte Order: ");
	blob.read_shift(2);
	var SystemIdentifier = blob.read_shift(4);
	var CLSID = blob.read_shift(16);
	if (CLSID !== CFB.utils.consts.HEADER_CLSID && CLSID !== clsid) throw new Error("Bad PropertySet CLSID " + CLSID);
	NumSets = blob.read_shift(4);
	if (NumSets !== 1 && NumSets !== 2) throw new Error("Unrecognized #Sets: " + NumSets);
	FMTID0 = blob.read_shift(16);
	Offset0 = blob.read_shift(4);
	if (NumSets === 1 && Offset0 !== blob.l) throw new Error("Length mismatch: " + Offset0 + " !== " + blob.l);
	else if (NumSets === 2) {
		FMTID1 = blob.read_shift(16);
		Offset1 = blob.read_shift(4);
	}
	var PSet0 = parse_PropertySet(blob, PIDSI);
	var rval = { SystemIdentifier };
	for (var y in PSet0) rval[y] = PSet0[y];
	rval.FMTID = FMTID0;
	if (NumSets === 1) return rval;
	if (Offset1 - blob.l == 2) blob.l += 2;
	if (blob.l !== Offset1) throw new Error("Length mismatch 2: " + blob.l + " !== " + Offset1);
	var PSet1;
	try {
		PSet1 = parse_PropertySet(blob, null);
	} catch (e) {}
	for (y in PSet1) rval[y] = PSet1[y];
	rval.FMTID = [FMTID0, FMTID1];
	return rval;
}
function parsenoop2(blob, length) {
	blob.read_shift(length);
	return null;
}
function parslurp(blob, length, cb) {
	var arr = [], target = blob.l + length;
	while (blob.l < target) arr.push(cb(blob, target - blob.l));
	if (target !== blob.l) throw new Error("Slurp error");
	return arr;
}
function parsebool(blob, length) {
	return blob.read_shift(length) === 1;
}
function parseuint16(blob) {
	return blob.read_shift(2, "u");
}
function parseuint16a(blob, length) {
	return parslurp(blob, length, parseuint16);
}
function parse_Bes(blob) {
	var v = blob.read_shift(1);
	return blob.read_shift(1) === 1 ? v : v === 1;
}
function parse_ShortXLUnicodeString(blob, length, opts) {
	var cch = blob.read_shift(opts && opts.biff >= 12 ? 2 : 1);
	var encoding = "sbcs-cont";
	var cp = current_codepage;
	if (opts && opts.biff >= 8) current_codepage = 1200;
	if (!opts || opts.biff == 8) {
		if (blob.read_shift(1)) encoding = "dbcs-cont";
	} else if (opts.biff == 12) encoding = "wstr";
	if (opts.biff >= 2 && opts.biff <= 5) encoding = "cpstr";
	var o = cch ? blob.read_shift(cch, encoding) : "";
	current_codepage = cp;
	return o;
}
function parse_XLUnicodeRichExtendedString(blob) {
	var cp = current_codepage;
	current_codepage = 1200;
	var cch = blob.read_shift(2), flags = blob.read_shift(1);
	var fExtSt = flags & 4, fRichSt = flags & 8;
	var width = 1 + (flags & 1);
	var cRun = 0, cbExtRst;
	var z = {};
	if (fRichSt) cRun = blob.read_shift(2);
	if (fExtSt) cbExtRst = blob.read_shift(4);
	var encoding = width == 2 ? "dbcs-cont" : "sbcs-cont";
	var msg = cch === 0 ? "" : blob.read_shift(cch, encoding);
	if (fRichSt) blob.l += 4 * cRun;
	if (fExtSt) blob.l += cbExtRst;
	z.t = msg;
	if (!fRichSt) {
		z.raw = "<t>" + z.t + "</t>";
		z.r = z.t;
	}
	current_codepage = cp;
	return z;
}
function parse_XLUnicodeStringNoCch(blob, cch, opts) {
	var retval;
	if (opts) {
		if (opts.biff >= 2 && opts.biff <= 5) return blob.read_shift(cch, "cpstr");
		if (opts.biff >= 12) return blob.read_shift(cch, "dbcs-cont");
	}
	if (blob.read_shift(1) === 0) retval = blob.read_shift(cch, "sbcs-cont");
	else retval = blob.read_shift(cch, "dbcs-cont");
	return retval;
}
function parse_XLUnicodeString(blob, length, opts) {
	var cch = blob.read_shift(opts && opts.biff == 2 ? 1 : 2);
	if (cch === 0) {
		if (opts.biff <= 8) blob.l++;
		return "";
	}
	return parse_XLUnicodeStringNoCch(blob, cch, opts);
}
function parse_XLUnicodeString2(blob, length, opts) {
	if (opts.biff > 5) return parse_XLUnicodeString(blob, length, opts);
	var cch = blob.read_shift(1);
	if (cch === 0) {
		blob.l++;
		return "";
	}
	return blob.read_shift(cch, opts.biff <= 4 || !blob.lens ? "cpstr" : "sbcs-cont");
}
function parse_ControlInfo(blob) {
	var flags = blob.read_shift(1);
	blob.l++;
	var accel = blob.read_shift(2);
	blob.l += 2;
	return [flags, accel];
}
function parse_URLMoniker(blob) {
	var len = blob.read_shift(4), start = blob.l;
	var extra = false;
	if (len > 24) {
		blob.l += len - 24;
		if (blob.read_shift(16) === "795881f43b1d7f48af2c825dc4852763") extra = true;
		blob.l = start;
	}
	var url = blob.read_shift((extra ? len - 24 : len) >> 1, "utf16le").replace(chr0, "");
	if (extra) blob.l += 24;
	return url;
}
function parse_FileMoniker(blob) {
	var cAnti = blob.read_shift(2);
	var preamble = "";
	while (cAnti-- > 0) preamble += "../";
	var ansiPath = blob.read_shift(0, "lpstr-ansi");
	blob.l += 2;
	if (blob.read_shift(2) != 57005) throw new Error("Bad FileMoniker");
	if (blob.read_shift(4) === 0) return preamble + ansiPath.replace(/\\/g, "/");
	var bytes = blob.read_shift(4);
	if (blob.read_shift(2) != 3) throw new Error("Bad FileMoniker");
	var unicodePath = blob.read_shift(bytes >> 1, "utf16le").replace(chr0, "");
	return preamble + unicodePath;
}
function parse_HyperlinkMoniker(blob, length) {
	var clsid = blob.read_shift(16);
	length -= 16;
	switch (clsid) {
		case "e0c9ea79f9bace118c8200aa004ba90b": return parse_URLMoniker(blob, length);
		case "0303000000000000c000000000000046": return parse_FileMoniker(blob, length);
		default: throw new Error("Unsupported Moniker " + clsid);
	}
}
function parse_HyperlinkString(blob) {
	var len = blob.read_shift(4);
	return len > 0 ? blob.read_shift(len, "utf16le").replace(chr0, "") : "";
}
function parse_Hyperlink(blob, length) {
	var end = blob.l + length;
	var sVer = blob.read_shift(4);
	if (sVer !== 2) throw new Error("Unrecognized streamVersion: " + sVer);
	var flags = blob.read_shift(2);
	blob.l += 2;
	var displayName, targetFrameName, moniker, oleMoniker, Loc = "", guid, fileTime;
	if (flags & 16) displayName = parse_HyperlinkString(blob, end - blob.l);
	if (flags & 128) targetFrameName = parse_HyperlinkString(blob, end - blob.l);
	if ((flags & 257) === 257) moniker = parse_HyperlinkString(blob, end - blob.l);
	if ((flags & 257) === 1) oleMoniker = parse_HyperlinkMoniker(blob, end - blob.l);
	if (flags & 8) Loc = parse_HyperlinkString(blob, end - blob.l);
	if (flags & 32) guid = blob.read_shift(16);
	if (flags & 64) fileTime = parse_FILETIME(blob);
	blob.l = end;
	var target = targetFrameName || moniker || oleMoniker || "";
	if (target && Loc) target += "#" + Loc;
	if (!target) target = "#" + Loc;
	if (flags & 2 && target.charAt(0) == "/" && target.charAt(1) != "/") target = "file://" + target;
	var out = { Target: target };
	if (guid) out.guid = guid;
	if (fileTime) out.time = fileTime;
	if (displayName) out.Tooltip = displayName;
	return out;
}
function parse_LongRGBA(blob) {
	return [
		blob.read_shift(1),
		blob.read_shift(1),
		blob.read_shift(1),
		blob.read_shift(1)
	];
}
function parse_LongRGB(blob, length) {
	var x = parse_LongRGBA(blob, length);
	x[3] = 0;
	return x;
}
function parse_XLSCell(blob, length, opts) {
	var ret = {
		r: blob.read_shift(2),
		c: blob.read_shift(2),
		ixfe: 0
	};
	if (opts && opts.biff == 2 || length == 7) {
		ret.ixfe = blob.read_shift(1) & 63;
		blob.l += 2;
	} else ret.ixfe = blob.read_shift(2);
	return ret;
}
function parse_frtHeader(blob) {
	var rt = blob.read_shift(2);
	var flags = blob.read_shift(2);
	blob.l += 8;
	return {
		type: rt,
		flags
	};
}
function parse_OptXLUnicodeString(blob, length, opts) {
	return length === 0 ? "" : parse_XLUnicodeString2(blob, length, opts);
}
function parse_XTI(blob, length, opts) {
	var w = opts.biff > 8 ? 4 : 2;
	return [
		blob.read_shift(w),
		blob.read_shift(w, "i"),
		blob.read_shift(w, "i")
	];
}
function parse_RkRec(blob) {
	return [blob.read_shift(2), parse_RkNumber(blob)];
}
function parse_AddinUdf(blob, length, opts) {
	blob.l += 4;
	length -= 4;
	var l = blob.l + length;
	var udfName = parse_ShortXLUnicodeString(blob, length, opts);
	var cb = blob.read_shift(2);
	l -= blob.l;
	if (cb !== l) throw new Error("Malformed AddinUdf: padding = " + l + " != " + cb);
	blob.l += cb;
	return udfName;
}
function parse_Ref8U(blob) {
	var rwFirst = blob.read_shift(2);
	var rwLast = blob.read_shift(2);
	var colFirst = blob.read_shift(2);
	var colLast = blob.read_shift(2);
	return {
		s: {
			c: colFirst,
			r: rwFirst
		},
		e: {
			c: colLast,
			r: rwLast
		}
	};
}
function parse_RefU(blob) {
	var rwFirst = blob.read_shift(2);
	var rwLast = blob.read_shift(2);
	var colFirst = blob.read_shift(1);
	var colLast = blob.read_shift(1);
	return {
		s: {
			c: colFirst,
			r: rwFirst
		},
		e: {
			c: colLast,
			r: rwLast
		}
	};
}
var parse_Ref = parse_RefU;
function parse_FtCmo(blob) {
	blob.l += 4;
	var ot = blob.read_shift(2);
	var id = blob.read_shift(2);
	var flags = blob.read_shift(2);
	blob.l += 12;
	return [
		id,
		ot,
		flags
	];
}
function parse_FtNts(blob) {
	var out = {};
	blob.l += 4;
	blob.l += 16;
	out.fSharedNote = blob.read_shift(2);
	blob.l += 4;
	return out;
}
function parse_FtCf(blob) {
	var out = {};
	blob.l += 4;
	blob.cf = blob.read_shift(2);
	return out;
}
function parse_FtSkip(blob) {
	blob.l += 2;
	blob.l += blob.read_shift(2);
}
var FtTab = {
	0: parse_FtSkip,
	4: parse_FtSkip,
	5: parse_FtSkip,
	6: parse_FtSkip,
	7: parse_FtCf,
	8: parse_FtSkip,
	9: parse_FtSkip,
	10: parse_FtSkip,
	11: parse_FtSkip,
	12: parse_FtSkip,
	13: parse_FtNts,
	14: parse_FtSkip,
	15: parse_FtSkip,
	16: parse_FtSkip,
	17: parse_FtSkip,
	18: parse_FtSkip,
	19: parse_FtSkip,
	20: parse_FtSkip,
	21: parse_FtCmo
};
function parse_FtArray(blob, length) {
	var tgt = blob.l + length;
	var fts = [];
	while (blob.l < tgt) {
		var ft = blob.read_shift(2);
		blob.l -= 2;
		try {
			fts[ft] = FtTab[ft](blob, tgt - blob.l);
		} catch (e) {
			blob.l = tgt;
			return fts;
		}
	}
	if (blob.l != tgt) blob.l = tgt;
	return fts;
}
function parse_BOF(blob, length) {
	var o = {
		BIFFVer: 0,
		dt: 0
	};
	o.BIFFVer = blob.read_shift(2);
	length -= 2;
	if (length >= 2) {
		o.dt = blob.read_shift(2);
		blob.l -= 2;
	}
	switch (o.BIFFVer) {
		case 1536:
		case 1280:
		case 1024:
		case 768:
		case 512:
		case 2:
		case 7: break;
		default: if (length > 6) throw new Error("Unexpected BIFF Ver " + o.BIFFVer);
	}
	blob.read_shift(length);
	return o;
}
function parse_InterfaceHdr(blob, length) {
	if (length === 0) return 1200;
	if (blob.read_shift(2) !== 1200) {}
	return 1200;
}
function parse_WriteAccess(blob, length, opts) {
	if (opts.enc) {
		blob.l += length;
		return "";
	}
	var l = blob.l;
	var UserName = parse_XLUnicodeString2(blob, 0, opts);
	blob.read_shift(length + l - blob.l);
	return UserName;
}
function parse_WsBool(blob, length, opts) {
	var flags = opts && opts.biff == 8 || length == 2 ? blob.read_shift(2) : (blob.l += length, 0);
	return {
		fDialog: flags & 16,
		fBelow: flags & 64,
		fRight: flags & 128
	};
}
function parse_BoundSheet8(blob, length, opts) {
	var name = "";
	if (opts.biff == 4) {
		name = parse_ShortXLUnicodeString(blob, 0, opts);
		if (name.length === 0) name = "Sheet1";
		return { name };
	}
	var pos = blob.read_shift(4);
	var hidden = blob.read_shift(1) & 3;
	var dt = blob.read_shift(1);
	switch (dt) {
		case 0:
			dt = "Worksheet";
			break;
		case 1:
			dt = "Macrosheet";
			break;
		case 2:
			dt = "Chartsheet";
			break;
		case 6: dt = "VBAModule";
	}
	name = parse_ShortXLUnicodeString(blob, 0, opts);
	if (name.length === 0) name = "Sheet1";
	return {
		pos,
		hs: hidden,
		dt,
		name
	};
}
function parse_SST(blob, length) {
	var end = blob.l + length;
	var cnt = blob.read_shift(4);
	var ucnt = blob.read_shift(4);
	var strs = [];
	for (var i = 0; i != ucnt && blob.l < end; ++i) strs.push(parse_XLUnicodeRichExtendedString(blob));
	strs.Count = cnt;
	strs.Unique = ucnt;
	return strs;
}
function parse_ExtSST(blob, length) {
	var extsst = {};
	extsst.dsst = blob.read_shift(2);
	blob.l += length - 2;
	return extsst;
}
function parse_Row(blob) {
	var z = {};
	z.r = blob.read_shift(2);
	z.c = blob.read_shift(2);
	z.cnt = blob.read_shift(2) - z.c;
	var miyRw = blob.read_shift(2);
	blob.l += 4;
	var flags = blob.read_shift(1);
	blob.l += 1;
	var ixfe = blob.read_shift(2);
	z.ixfe = ixfe & 4095;
	z.flags = ixfe >> 12 & 15;
	if (flags & 7) z.level = flags & 7;
	if (flags & 32) z.hidden = true;
	if (flags & 64) z.hpt = miyRw / 20;
	return z;
}
function parse_ForceFullCalculation(blob) {
	var header = parse_frtHeader(blob);
	if (header.type != 2211) throw new Error("Invalid Future Record " + header.type);
	return blob.read_shift(4) !== 0;
}
function parse_RecalcId(blob) {
	blob.read_shift(2);
	return blob.read_shift(4);
}
function parse_DefaultRowHeight(blob, length, opts) {
	var f = 0;
	if (!(opts && opts.biff == 2)) f = blob.read_shift(2);
	var miyRw = blob.read_shift(2);
	if (opts && opts.biff == 2) {
		f = 1 - (miyRw >> 15);
		miyRw &= 32767;
	}
	return [{
		Unsynced: f & 1,
		DyZero: (f & 2) >> 1,
		ExAsc: (f & 4) >> 2,
		ExDsc: (f & 8) >> 3
	}, miyRw];
}
function parse_Window1(blob) {
	var xWn = blob.read_shift(2), yWn = blob.read_shift(2), dxWn = blob.read_shift(2), dyWn = blob.read_shift(2);
	var flags = blob.read_shift(2), iTabCur = blob.read_shift(2), iTabFirst = blob.read_shift(2);
	var ctabSel = blob.read_shift(2), wTabRatio = blob.read_shift(2);
	return {
		Pos: [xWn, yWn],
		Dim: [dxWn, dyWn],
		Flags: flags,
		CurTab: iTabCur,
		FirstTab: iTabFirst,
		Selected: ctabSel,
		TabRatio: wTabRatio
	};
}
function parse_Window2(blob, length, opts) {
	if (opts && opts.biff >= 2 && opts.biff < 5) return {};
	return { RTL: blob.read_shift(2) & 64 };
}
function parse_Pane() {}
function parse_Font(blob, length, opts) {
	var end = blob.l + length;
	var o = {
		dyHeight: blob.read_shift(2),
		fl: blob.read_shift(2)
	};
	o.sz = o.dyHeight / 20;
	o.italic = !!(o.fl & 2);
	o.strike = !!(o.fl & 8);
	o.outline = !!(o.fl & 16);
	o.shadow = !!(o.fl & 32);
	o.condense = !!(o.fl & 64);
	o.extend = !!(o.fl & 128);
	switch (opts && opts.biff || 8) {
		case 2: break;
		case 3:
		case 4:
			o.icv = blob.read_shift(2);
			break;
		default:
			o.icv = blob.read_shift(2);
			o.bls = blob.read_shift(2);
			o.bold = o.bls >= 700;
			o.vertAlign = blob.read_shift(2);
			o.underline = blob.read_shift(1);
			o.family = blob.read_shift(1);
			o.charset = blob.read_shift(1);
			blob.l++;
	}
	o.name = blob.l < end ? parse_ShortXLUnicodeString(blob, end - blob.l, opts) : "";
	return o;
}
function parse_LabelSst(blob, length, opts) {
	var cell = parse_XLSCell(blob, length, opts);
	cell.isst = blob.read_shift(4);
	return cell;
}
function parse_Label(blob, length, opts) {
	if (opts.biffguess && opts.biff == 2) opts.biff = 5;
	var target = blob.l + length;
	var cell = parse_XLSCell(blob, length, opts);
	cell.val = parse_XLUnicodeString(blob, target - blob.l, opts);
	return cell;
}
function parse_Format(blob, length, opts) {
	return [blob.read_shift(2), parse_XLUnicodeString2(blob, 0, opts)];
}
var parse_BIFF2Format = parse_XLUnicodeString2;
function parse_Dimensions(blob, length, opts) {
	var end = blob.l + length;
	var w = opts.biff == 8 || !opts.biff ? 4 : 2;
	var r = blob.read_shift(w), R = blob.read_shift(w);
	var c = blob.read_shift(2), C = blob.read_shift(2);
	blob.l = end;
	return {
		s: {
			r,
			c
		},
		e: {
			r: R,
			c: C
		}
	};
}
function parse_RK(blob) {
	var rw = blob.read_shift(2), col = blob.read_shift(2);
	var rkrec = parse_RkRec(blob);
	return {
		r: rw,
		c: col,
		ixfe: rkrec[0],
		rknum: rkrec[1]
	};
}
function parse_MulRk(blob, length) {
	var target = blob.l + length - 2;
	var rw = blob.read_shift(2), col = blob.read_shift(2);
	var rkrecs = [];
	while (blob.l < target) rkrecs.push(parse_RkRec(blob));
	if (blob.l !== target) throw new Error("MulRK read error");
	var lastcol = blob.read_shift(2);
	if (rkrecs.length != lastcol - col + 1) throw new Error("MulRK length mismatch");
	return {
		r: rw,
		c: col,
		C: lastcol,
		rkrec: rkrecs
	};
}
function parse_MulBlank(blob, length) {
	var target = blob.l + length - 2;
	var rw = blob.read_shift(2), col = blob.read_shift(2);
	var ixfes = [];
	while (blob.l < target) ixfes.push(blob.read_shift(2));
	if (blob.l !== target) throw new Error("MulBlank read error");
	var lastcol = blob.read_shift(2);
	if (ixfes.length != lastcol - col + 1) throw new Error("MulBlank length mismatch");
	return {
		r: rw,
		c: col,
		C: lastcol,
		ixfe: ixfes
	};
}
function parse_CellStyleXF(blob, length, style, opts) {
	var o = {};
	var a = blob.read_shift(4), b = blob.read_shift(4);
	var c = blob.read_shift(4), d = blob.read_shift(2);
	o.patternType = XLSFillPattern[c >> 26];
	o.alc = a & 7;
	o.fWrap = a >> 3 & 1;
	o.alcV = a >> 4 & 7;
	o.fJustLast = a >> 7 & 1;
	o.trot = a >> 8 & 255;
	o.cIndent = a >> 16 & 15;
	o.fShrinkToFit = a >> 20 & 1;
	o.iReadOrder = a >> 22 & 2;
	o.fAtrNum = a >> 26 & 1;
	o.fAtrFnt = a >> 27 & 1;
	o.fAtrAlc = a >> 28 & 1;
	o.fAtrBdr = a >> 29 & 1;
	o.fAtrPat = a >> 30 & 1;
	o.fAtrProt = a >> 31 & 1;
	o.dgLeft = b & 15;
	o.dgRight = b >> 4 & 15;
	o.dgTop = b >> 8 & 15;
	o.dgBottom = b >> 12 & 15;
	o.icvLeft = b >> 16 & 127;
	o.icvRight = b >> 23 & 127;
	o.grbitDiag = b >> 30 & 3;
	o.icvTop = c & 127;
	o.icvBottom = c >> 7 & 127;
	o.icvDiag = c >> 14 & 127;
	o.dgDiag = c >> 21 & 15;
	o.icvFore = d & 127;
	o.icvBack = d >> 7 & 127;
	o.fsxButton = d >> 14 & 1;
	return o;
}
function parse_XF(blob, length, opts) {
	var o = {};
	o.ifnt = blob.read_shift(2);
	o.numFmtId = blob.read_shift(2);
	o.flags = blob.read_shift(2);
	o.locked = !!(o.flags & 1);
	o.hidden = !!(o.flags & 2);
	o.fStyle = o.flags >> 2 & 1;
	o.xfId = o.ixfeParent = o.flags >> 4 & 4095;
	length -= 6;
	o.data = parse_CellStyleXF(blob, length, o.fStyle, opts);
	return o;
}
function parse_BIFF2XF(blob) {
	var o = {};
	o.ifnt = blob.read_shift(1);
	blob.l++;
	o.flags = blob.read_shift(1);
	o.numFmtId = o.flags & 63;
	o.flags >>= 6;
	o.fStyle = 0;
	o.data = {};
	return o;
}
function parse_BIFF3XF(blob) {
	var o = {};
	o.ifnt = blob.read_shift(1);
	o.numFmtId = blob.read_shift(1);
	o.flags = blob.read_shift(2);
	o.fStyle = o.flags >> 2 & 1;
	o.data = {};
	return o;
}
function parse_BIFF4XF(blob) {
	var o = {};
	o.ifnt = blob.read_shift(1);
	o.numFmtId = blob.read_shift(1);
	o.flags = blob.read_shift(2);
	o.fStyle = o.flags >> 2 & 1;
	o.data = {};
	return o;
}
function parse_Guts(blob) {
	blob.l += 4;
	var out = [blob.read_shift(2), blob.read_shift(2)];
	if (out[0] !== 0) out[0]--;
	if (out[1] !== 0) out[1]--;
	if (out[0] > 7 || out[1] > 7) throw new Error("Bad Gutters: " + out.join("|"));
	return out;
}
function parse_BoolErr(blob, length, opts) {
	var cell = parse_XLSCell(blob, 6, opts);
	var val = parse_Bes(blob, 2);
	cell.val = val;
	cell.t = val === true || val === false ? "b" : "e";
	return cell;
}
function parse_Number(blob, length, opts) {
	if (opts.biffguess && opts.biff == 2) opts.biff = 5;
	var cell = parse_XLSCell(blob, 6, opts);
	cell.val = parse_Xnum(blob, 8);
	return cell;
}
var parse_XLHeaderFooter = parse_OptXLUnicodeString;
function parse_SupBook(blob, length, opts) {
	var end = blob.l + length;
	var ctab = blob.read_shift(2);
	var cch = blob.read_shift(2);
	opts.sbcch = cch;
	if (cch == 1025 || cch == 14849) return [cch, ctab];
	if (cch < 1 || cch > 255) throw new Error("Unexpected SupBook type: " + cch);
	var virtPath = parse_XLUnicodeStringNoCch(blob, cch);
	var rgst = [];
	while (end > blob.l) rgst.push(parse_XLUnicodeString(blob, end - blob.l, opts));
	return [
		cch,
		ctab,
		virtPath,
		rgst
	];
}
function parse_ExternName(blob, length, opts) {
	var flags = blob.read_shift(2);
	var body;
	var o = {
		fBuiltIn: flags & 1,
		fWantAdvise: flags >>> 1 & 1,
		fWantPict: flags >>> 2 & 1,
		fOle: flags >>> 3 & 1,
		fOleLink: flags >>> 4 & 1,
		cf: flags >>> 5 & 1023,
		fIcon: flags >>> 15 & 1
	};
	if (opts.sbcch === 14849) body = parse_AddinUdf(blob, length - 2, opts);
	o.body = body || blob.read_shift(length - 2);
	if (typeof body === "string") o.Name = body;
	return o;
}
function parse_Lbl(blob, length, opts) {
	var target = blob.l + length;
	var flags = blob.read_shift(2);
	var chKey = blob.read_shift(1);
	var cch = blob.read_shift(1);
	var cce = blob.read_shift(opts && opts.biff == 2 ? 1 : 2);
	var itab = 0;
	if (!opts || opts.biff >= 5) {
		if (opts.biff != 5) blob.l += 2;
		itab = blob.read_shift(2);
		if (opts.biff == 5) blob.l += 2;
		blob.l += 4;
	}
	var name = parse_XLUnicodeStringNoCch(blob, cch, opts);
	if (flags & 32) name = XLSLblBuiltIn[name.charCodeAt(0)];
	var npflen = target - blob.l;
	if (opts && opts.biff == 2) --npflen;
	var rgce = target == blob.l || cce === 0 || !(npflen > 0) ? [] : parse_NameParsedFormula(blob, npflen, opts, cce);
	return {
		chKey,
		Name: name,
		itab,
		rgce
	};
}
function parse_ExternSheet(blob, length, opts) {
	if (opts.biff < 8) return parse_BIFF5ExternSheet(blob, length, opts);
	if (!(opts.biff > 8) && length == blob[blob.l] + (blob[blob.l + 1] == 3 ? 1 : 0) + 1) return parse_BIFF5ExternSheet(blob, length, opts);
	var o = [], target = blob.l + length, len = blob.read_shift(opts.biff > 8 ? 4 : 2);
	while (len-- !== 0) o.push(parse_XTI(blob, opts.biff > 8 ? 12 : 6, opts));
	if (blob.l != target) throw new Error("Bad ExternSheet: " + blob.l + " != " + target);
	return o;
}
function parse_BIFF5ExternSheet(blob, length, opts) {
	if (blob[blob.l + 1] == 3) blob[blob.l]++;
	var o = parse_ShortXLUnicodeString(blob, length, opts);
	return o.charCodeAt(0) == 3 ? o.slice(1) : o;
}
function parse_NameCmt(blob, length, opts) {
	if (opts.biff < 8) {
		blob.l += length;
		return;
	}
	var cchName = blob.read_shift(2);
	var cchComment = blob.read_shift(2);
	return [parse_XLUnicodeStringNoCch(blob, cchName, opts), parse_XLUnicodeStringNoCch(blob, cchComment, opts)];
}
function parse_ShrFmla(blob, length, opts) {
	var ref = parse_RefU(blob, 6);
	blob.l++;
	var cUse = blob.read_shift(1);
	length -= 8;
	return [
		parse_SharedParsedFormula(blob, length, opts),
		cUse,
		ref
	];
}
function parse_Array(blob, length, opts) {
	var ref = parse_Ref(blob, 6);
	switch (opts.biff) {
		case 2:
			blob.l++;
			length -= 7;
			break;
		case 3:
		case 4:
			blob.l += 2;
			length -= 8;
			break;
		default:
			blob.l += 6;
			length -= 12;
	}
	return [ref, parse_ArrayParsedFormula(blob, length, opts, ref)];
}
function parse_MTRSettings(blob) {
	return [
		blob.read_shift(4) !== 0,
		blob.read_shift(4) !== 0,
		blob.read_shift(4)
	];
}
function parse_NoteSh(blob, length, opts) {
	var row = blob.read_shift(2), col = blob.read_shift(2);
	var flags = blob.read_shift(2), idObj = blob.read_shift(2);
	var stAuthor = parse_XLUnicodeString2(blob, 0, opts);
	return [
		{
			r: row,
			c: col
		},
		stAuthor,
		idObj,
		flags
	];
}
function parse_Note(blob, length, opts) {
	if (opts && opts.biff < 8) {
		var row = blob.read_shift(2), col = blob.read_shift(2);
		if (row == 65535 || row == -1) return;
		var cch = blob.read_shift(2);
		var cmnt = blob.read_shift(Math.min(cch, 2048), "cpstr");
		return [{
			r: row,
			c: col
		}, cmnt];
	}
	return parse_NoteSh(blob, length, opts);
}
function parse_MergeCells(blob, length) {
	var merges = [];
	var cmcs = blob.read_shift(2);
	while (cmcs--) merges.push(parse_Ref8U(blob, length));
	return merges;
}
function parse_Obj(blob, length, opts) {
	if (opts && opts.biff < 8) return parse_BIFF5Obj(blob, length, opts);
	var cmo = parse_FtCmo(blob, 22);
	return {
		cmo,
		ft: parse_FtArray(blob, length - 22, cmo[1])
	};
}
var parse_BIFF5OT = { 8: function(blob, length) {
	var tgt = blob.l + length;
	blob.l += 10;
	var cf = blob.read_shift(2);
	blob.l += 4;
	blob.l += 2;
	blob.l += 2;
	blob.l += 2;
	blob.l += 4;
	var cchName = blob.read_shift(1);
	blob.l += cchName;
	blob.l = tgt;
	return { fmt: cf };
} };
function parse_BIFF5Obj(blob, length, opts) {
	blob.l += 4;
	var ot = blob.read_shift(2);
	var id = blob.read_shift(2);
	var grbit = blob.read_shift(2);
	blob.l += 2;
	blob.l += 2;
	blob.l += 2;
	blob.l += 2;
	blob.l += 2;
	blob.l += 2;
	blob.l += 2;
	blob.l += 2;
	blob.l += 2;
	blob.l += 6;
	length -= 36;
	var fts = [];
	fts.push((parse_BIFF5OT[ot] || parsenoop)(blob, length, opts));
	return {
		cmo: [
			id,
			ot,
			grbit
		],
		ft: fts
	};
}
function parse_TxO(blob, length, opts) {
	var s = blob.l;
	var texts = "";
	try {
		blob.l += 4;
		var ot = (opts.lastobj || { cmo: [0, 0] }).cmo[1];
		if ([
			0,
			5,
			7,
			11,
			12,
			14
		].indexOf(ot) == -1) blob.l += 6;
		else parse_ControlInfo(blob, 6, opts);
		var cchText = blob.read_shift(2);
		blob.read_shift(2);
		parseuint16(blob, 2);
		var len = blob.read_shift(2);
		blob.l += len;
		for (var i = 1; i < blob.lens.length - 1; ++i) {
			if (blob.l - s != blob.lens[i]) throw new Error("TxO: bad continue record");
			var hdr = blob[blob.l];
			var t = parse_XLUnicodeStringNoCch(blob, blob.lens[i + 1] - blob.lens[i] - 1);
			texts += t;
			if (texts.length >= (hdr ? cchText : 2 * cchText)) break;
		}
		if (texts.length !== cchText && texts.length !== cchText * 2) throw new Error("cchText: " + cchText + " != " + texts.length);
		blob.l = s + length;
		return { t: texts };
	} catch (e) {
		blob.l = s + length;
		return { t: texts };
	}
}
function parse_HLink(blob, length) {
	var ref = parse_Ref8U(blob, 8);
	blob.l += 16;
	return [ref, parse_Hyperlink(blob, length - 24)];
}
function parse_HLinkTooltip(blob, length) {
	blob.read_shift(2);
	var ref = parse_Ref8U(blob, 8);
	var wzTooltip = blob.read_shift((length - 10) / 2, "dbcs-cont");
	wzTooltip = wzTooltip.replace(chr0, "");
	return [ref, wzTooltip];
}
function parse_Country(blob) {
	var o = [0, 0], d = blob.read_shift(2);
	o[0] = CountryEnum[d] || d;
	d = blob.read_shift(2);
	o[1] = CountryEnum[d] || d;
	return o;
}
function parse_ClrtClient(blob) {
	var ccv = blob.read_shift(2);
	var o = [];
	while (ccv-- > 0) o.push(parse_LongRGB(blob, 8));
	return o;
}
function parse_Palette(blob) {
	var ccv = blob.read_shift(2);
	var o = [];
	while (ccv-- > 0) o.push(parse_LongRGB(blob, 8));
	return o;
}
function parse_XFCRC(blob) {
	blob.l += 2;
	var o = {
		cxfs: 0,
		crc: 0
	};
	o.cxfs = blob.read_shift(2);
	o.crc = blob.read_shift(4);
	return o;
}
function parse_ColInfo(blob, length, opts) {
	if (!opts.cellStyles) return parsenoop(blob, length);
	var w = opts && opts.biff >= 12 ? 4 : 2;
	var colFirst = blob.read_shift(w);
	var colLast = blob.read_shift(w);
	var coldx = blob.read_shift(w);
	var ixfe = blob.read_shift(w);
	var flags = blob.read_shift(2);
	if (w == 2) blob.l += 2;
	var o = {
		s: colFirst,
		e: colLast,
		w: coldx,
		ixfe,
		flags
	};
	if (opts.biff >= 5 || !opts.biff) o.level = flags >> 8 & 7;
	return o;
}
function parse_Setup(blob, length) {
	var o = {};
	if (length < 32) return o;
	blob.l += 16;
	o.header = parse_Xnum(blob, 8);
	o.footer = parse_Xnum(blob, 8);
	blob.l += 2;
	return o;
}
function parse_ShtProps(blob, length, opts) {
	var def = { area: false };
	if (opts.biff != 5) {
		blob.l += length;
		return def;
	}
	var d = blob.read_shift(1);
	blob.l += 3;
	if (d & 16) def.area = true;
	return def;
}
var parse_Blank = parse_XLSCell;
var parse_Scl = parseuint16a;
var parse_String = parse_XLUnicodeString;
function parse_ImData(blob) {
	var cf = blob.read_shift(2);
	var env = blob.read_shift(2);
	var lcb = blob.read_shift(4);
	var o = {
		fmt: cf,
		env,
		len: lcb,
		data: blob.slice(blob.l, blob.l + lcb)
	};
	blob.l += lcb;
	return o;
}
function parse_BIFF2STR(blob, length, opts) {
	if (opts.biffguess && opts.biff == 5) opts.biff = 2;
	var cell = parse_XLSCell(blob, 7, opts);
	var str = parse_XLUnicodeString2(blob, length - 7, opts);
	cell.t = "str";
	cell.val = str;
	return cell;
}
function parse_BIFF2NUM(blob, length, opts) {
	var cell = parse_XLSCell(blob, 7, opts);
	var num = parse_Xnum(blob, 8);
	cell.t = "n";
	cell.val = num;
	return cell;
}
function parse_BIFF2INT(blob, length, opts) {
	var cell = parse_XLSCell(blob, 7, opts);
	var num = blob.read_shift(2);
	cell.t = "n";
	cell.val = num;
	return cell;
}
function parse_BIFF2STRING(blob) {
	var cch = blob.read_shift(1);
	if (cch === 0) {
		blob.l++;
		return "";
	}
	return blob.read_shift(cch, "sbcs-cont");
}
function parse_BIFF2BOOLERR(blob, length, opts) {
	var bestart = blob.l + 7;
	var cell = parse_XLSCell(blob, 6, opts);
	blob.l = bestart;
	var val = parse_Bes(blob, 2);
	cell.val = val;
	cell.t = val === true || val === false ? "b" : "e";
	return cell;
}
function parse_BIFF2FONTXTRA(blob, length) {
	blob.l += 6;
	blob.l += 2;
	blob.l += 1;
	blob.l += 3;
	blob.l += 1;
	blob.l += length - 13;
}
function parse_RString(blob, length, opts) {
	var end = blob.l + length;
	var cell = parse_XLSCell(blob, 6, opts);
	var str = parse_XLUnicodeStringNoCch(blob, blob.read_shift(2), opts);
	blob.l = end;
	cell.t = "str";
	cell.val = str;
	return cell;
}
function parse_BIFF4SheetInfo(blob) {
	var flags = blob.read_shift(4);
	var cch = blob.read_shift(1), name = blob.read_shift(cch, "sbcs");
	if (name.length === 0) name = "Sheet1";
	return {
		flags,
		name
	};
}
var DBF_SUPPORTED_VERSIONS = [
	2,
	3,
	48,
	49,
	131,
	139,
	140,
	245
];
var DBF = /*#__PURE__*/ (function() {
	var dbf_codepage_map = {
		1: 437,
		2: 850,
		3: 1252,
		4: 1e4,
		100: 852,
		101: 866,
		102: 865,
		103: 861,
		104: 895,
		105: 620,
		106: 737,
		107: 857,
		120: 950,
		121: 949,
		122: 936,
		123: 932,
		124: 874,
		125: 1255,
		126: 1256,
		150: 10007,
		151: 10029,
		152: 10006,
		200: 1250,
		201: 1251,
		202: 1254,
		203: 1253,
		0: 20127,
		8: 865,
		9: 437,
		10: 850,
		11: 437,
		13: 437,
		14: 850,
		15: 437,
		16: 850,
		17: 437,
		18: 850,
		19: 932,
		20: 850,
		21: 437,
		22: 850,
		23: 865,
		24: 437,
		25: 437,
		26: 850,
		27: 437,
		28: 863,
		29: 850,
		31: 852,
		34: 852,
		35: 852,
		36: 860,
		37: 850,
		38: 866,
		55: 850,
		64: 852,
		77: 936,
		78: 949,
		79: 950,
		80: 874,
		87: 1252,
		88: 1252,
		89: 1252,
		108: 863,
		134: 737,
		135: 852,
		136: 857,
		204: 1257,
		255: 16969
	};
	var dbf_reverse_map = evert({
		1: 437,
		2: 850,
		3: 1252,
		4: 1e4,
		100: 852,
		101: 866,
		102: 865,
		103: 861,
		104: 895,
		105: 620,
		106: 737,
		107: 857,
		120: 950,
		121: 949,
		122: 936,
		123: 932,
		124: 874,
		125: 1255,
		126: 1256,
		150: 10007,
		151: 10029,
		152: 10006,
		200: 1250,
		201: 1251,
		202: 1254,
		203: 1253,
		0: 20127
	});
	function dbf_to_aoa(buf, opts) {
		var out = [];
		var d = new_raw_buf(1);
		switch (opts.type) {
			case "base64":
				d = s2a(Base64_decode(buf));
				break;
			case "binary":
				d = s2a(buf);
				break;
			case "buffer":
			case "array": d = buf;
		}
		prep_blob(d, 0);
		var ft = d.read_shift(1);
		var memo = !!(ft & 136);
		var vfp = false, l7 = false;
		switch (ft) {
			case 2: break;
			case 3: break;
			case 48:
				vfp = true;
				memo = true;
				break;
			case 49:
				vfp = true;
				memo = true;
				break;
			case 131: break;
			case 139: break;
			case 140:
				l7 = true;
				break;
			case 245: break;
			default: throw new Error("DBF Unsupported Version: " + ft.toString(16));
		}
		var nrow = 0, fpos = 521;
		if (ft == 2) nrow = d.read_shift(2);
		d.l += 3;
		if (ft != 2) nrow = d.read_shift(4);
		if (nrow > 1048576) nrow = 1e6;
		if (ft != 2) fpos = d.read_shift(2);
		var rlen = d.read_shift(2);
		var current_cp = opts.codepage || 1252;
		if (ft != 2) {
			d.l += 16;
			d.read_shift(1);
			if (d[d.l] !== 0) current_cp = dbf_codepage_map[d[d.l]];
			d.l += 1;
			d.l += 2;
		}
		if (l7) d.l += 36;
		var fields = [], field = {};
		var hend = Math.min(d.length, ft == 2 ? 521 : fpos - 10 - (vfp ? 264 : 0));
		var ww = l7 ? 32 : 11;
		while (d.l < hend && d[d.l] != 13) {
			field = {};
			field.name = (typeof $cptable !== "undefined" ? $cptable.utils.decode(current_cp, d.slice(d.l, d.l + ww)) : a2s(d.slice(d.l, d.l + ww))).replace(/[\u0000\r\n][\S\s]*$/g, "");
			d.l += ww;
			field.type = String.fromCharCode(d.read_shift(1));
			if (ft != 2 && !l7) field.offset = d.read_shift(4);
			field.len = d.read_shift(1);
			if (ft == 2) field.offset = d.read_shift(2);
			field.dec = d.read_shift(1);
			if (field.name.length) fields.push(field);
			if (ft != 2) d.l += l7 ? 13 : 14;
			switch (field.type) {
				case "B":
					if ((!vfp || field.len != 8) && opts.WTF) console.log("Skipping " + field.name + ":" + field.type);
					break;
				case "G":
				case "P":
					if (opts.WTF) console.log("Skipping " + field.name + ":" + field.type);
					break;
				case "+":
				case "0":
				case "@":
				case "C":
				case "D":
				case "F":
				case "I":
				case "L":
				case "M":
				case "N":
				case "O":
				case "T":
				case "Y": break;
				default: throw new Error("Unknown Field Type: " + field.type);
			}
		}
		if (d[d.l] !== 13) d.l = fpos - 1;
		if (d.read_shift(1) !== 13) throw new Error("DBF Terminator not found " + d.l + " " + d[d.l]);
		d.l = fpos;
		var R = 0, C = 0;
		out[0] = [];
		for (C = 0; C != fields.length; ++C) out[0][C] = fields[C].name;
		while (nrow-- > 0) {
			if (d[d.l] === 42) {
				d.l += rlen;
				continue;
			}
			++d.l;
			out[++R] = [];
			C = 0;
			for (C = 0; C != fields.length; ++C) {
				var dd = d.slice(d.l, d.l + fields[C].len);
				d.l += fields[C].len;
				prep_blob(dd, 0);
				var s = typeof $cptable !== "undefined" ? $cptable.utils.decode(current_cp, dd) : a2s(dd);
				switch (fields[C].type) {
					case "C":
						if (s.trim().length) out[R][C] = s.replace(/([^\s])\s+$/, "$1");
						break;
					case "D":
						if (s.length === 8) {
							out[R][C] = new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), 0, 0, 0, 0));
							if (!(opts && opts.UTC)) out[R][C] = utc_to_local(out[R][C]);
						} else out[R][C] = s;
						break;
					case "F":
						out[R][C] = parseFloat(s.trim());
						break;
					case "+":
					case "I":
						out[R][C] = l7 ? dd.read_shift(-4, "i") ^ 2147483648 : dd.read_shift(4, "i");
						break;
					case "L":
						switch (s.trim().toUpperCase()) {
							case "Y":
							case "T":
								out[R][C] = true;
								break;
							case "N":
							case "F":
								out[R][C] = false;
								break;
							case "":
							case "\0":
							case "?": break;
							default: throw new Error("DBF Unrecognized L:|" + s + "|");
						}
						break;
					case "M":
						if (!memo) throw new Error("DBF Unexpected MEMO for type " + ft.toString(16));
						out[R][C] = "##MEMO##" + (l7 ? parseInt(s.trim(), 10) : dd.read_shift(4));
						break;
					case "N":
						s = s.replace(/\u0000/g, "").trim();
						if (s && s != ".") out[R][C] = +s || 0;
						break;
					case "@":
						out[R][C] = /* @__PURE__ */ new Date(dd.read_shift(-8, "f") - 621356832e5);
						break;
					case "T":
						var hi = dd.read_shift(4), lo = dd.read_shift(4);
						if (hi == 0 && lo == 0) break;
						out[R][C] = new Date((hi - 2440588) * 864e5 + lo);
						if (!(opts && opts.UTC)) out[R][C] = utc_to_local(out[R][C]);
						break;
					case "Y":
						out[R][C] = dd.read_shift(4, "i") / 1e4 + dd.read_shift(4, "i") / 1e4 * Math.pow(2, 32);
						break;
					case "O":
						out[R][C] = -dd.read_shift(-8, "f");
						break;
					case "B": if (vfp && fields[C].len == 8) {
						out[R][C] = dd.read_shift(8, "f");
						break;
					}
					case "G":
					case "P":
						dd.l += fields[C].len;
						break;
					case "0": if (fields[C].name === "_NullFlags") break;
					default: throw new Error("DBF Unsupported data type " + fields[C].type);
				}
			}
		}
		if (ft != 2) {
			if (d.l < d.length && d[d.l++] != 26) throw new Error("DBF EOF Marker missing " + (d.l - 1) + " of " + d.length + " " + d[d.l - 1].toString(16));
		}
		if (opts && opts.sheetRows) out = out.slice(0, opts.sheetRows);
		opts.DBF = fields;
		return out;
	}
	function dbf_to_sheet(buf, opts) {
		var o = opts || {};
		if (!o.dateNF) o.dateNF = "yyyymmdd";
		var ws = aoa_to_sheet(dbf_to_aoa(buf, o), o);
		ws["!cols"] = o.DBF.map(function(field) {
			return {
				wch: field.len,
				DBF: field
			};
		});
		delete o.DBF;
		return ws;
	}
	function dbf_to_workbook(buf, opts) {
		try {
			var o = sheet_to_workbook(dbf_to_sheet(buf, opts), opts);
			o.bookType = "dbf";
			return o;
		} catch (e) {
			if (opts && opts.WTF) throw e;
		}
		return {
			SheetNames: [],
			Sheets: sheet_map_new()
		};
	}
	var _RLEN = {
		"B": 8,
		"C": 250,
		"L": 1,
		"D": 8,
		"?": 0,
		"": 0
	};
	function sheet_to_dbf(ws, opts) {
		if (!ws["!ref"]) throw new Error("Cannot export empty sheet to DBF");
		var o = opts || {};
		var old_cp = current_codepage;
		if (+o.codepage >= 0) set_cp(+o.codepage);
		if (o.type == "string") throw new Error("Cannot write DBF to JS string");
		var ba = buf_array();
		var aoa = sheet_to_json(ws, {
			header: 1,
			raw: true,
			cellDates: true
		});
		var headers = aoa[0], data = aoa.slice(1), cols = ws["!cols"] || [];
		var i = 0, j = 0, hcnt = 0, rlen = 1;
		for (i = 0; i < headers.length; ++i) {
			if (((cols[i] || {}).DBF || {}).name) {
				headers[i] = cols[i].DBF.name;
				++hcnt;
				continue;
			}
			if (headers[i] == null) continue;
			++hcnt;
			if (typeof headers[i] === "number") headers[i] = headers[i].toString(10);
			if (typeof headers[i] !== "string") throw new Error("DBF Invalid column name " + headers[i] + " |" + typeof headers[i] + "|");
			if (headers.indexOf(headers[i]) !== i) {
				for (j = 0; j < 1024; ++j) if (headers.indexOf(headers[i] + "_" + j) == -1) {
					headers[i] += "_" + j;
					break;
				}
			}
		}
		var range = safe_decode_range(ws["!ref"]);
		var coltypes = [];
		var colwidths = [];
		var coldecimals = [];
		for (i = 0; i <= range.e.c - range.s.c; ++i) {
			var guess = "", _guess = "", maxlen = 0;
			var col = [];
			for (j = 0; j < data.length; ++j) if (data[j][i] != null) col.push(data[j][i]);
			if (col.length == 0 || headers[i] == null) {
				coltypes[i] = "?";
				continue;
			}
			for (j = 0; j < col.length; ++j) {
				switch (typeof col[j]) {
					case "number":
						_guess = "B";
						break;
					case "string":
						_guess = "C";
						break;
					case "boolean":
						_guess = "L";
						break;
					case "object":
						_guess = col[j] instanceof Date ? "D" : "C";
						break;
					default: _guess = "C";
				}
				maxlen = Math.max(maxlen, (typeof $cptable !== "undefined" && typeof col[j] == "string" ? $cptable.utils.encode(current_ansi, col[j]) : String(col[j])).length);
				guess = guess && guess != _guess ? "C" : _guess;
			}
			if (maxlen > 250) maxlen = 250;
			_guess = ((cols[i] || {}).DBF || {}).type;
			if (_guess == "C") {
				if (cols[i].DBF.len > maxlen) maxlen = cols[i].DBF.len;
			}
			if (guess == "B" && _guess == "N") {
				guess = "N";
				coldecimals[i] = cols[i].DBF.dec;
				maxlen = cols[i].DBF.len;
			}
			colwidths[i] = guess == "C" || _guess == "N" ? maxlen : _RLEN[guess] || 0;
			rlen += colwidths[i];
			coltypes[i] = guess;
		}
		var h = ba.next(32);
		h.write_shift(4, 318902576);
		h.write_shift(4, data.length);
		h.write_shift(2, 296 + 32 * hcnt);
		h.write_shift(2, rlen);
		for (i = 0; i < 4; ++i) h.write_shift(4, 0);
		var cp = +dbf_reverse_map[current_codepage] || 3;
		h.write_shift(4, 0 | cp << 8);
		if (dbf_codepage_map[cp] != +o.codepage) {
			if (o.codepage) console.error("DBF Unsupported codepage " + current_codepage + ", using 1252");
			current_codepage = 1252;
		}
		for (i = 0, j = 0; i < headers.length; ++i) {
			if (headers[i] == null) continue;
			var hf = ba.next(32);
			var _f = (headers[i].slice(-10) + "\0\0\0\0\0\0\0\0\0\0\0").slice(0, 11);
			hf.write_shift(1, _f, "sbcs");
			hf.write_shift(1, coltypes[i] == "?" ? "C" : coltypes[i], "sbcs");
			hf.write_shift(4, j);
			hf.write_shift(1, colwidths[i] || _RLEN[coltypes[i]] || 0);
			hf.write_shift(1, coldecimals[i] || 0);
			hf.write_shift(1, 2);
			hf.write_shift(4, 0);
			hf.write_shift(1, 0);
			hf.write_shift(4, 0);
			hf.write_shift(4, 0);
			j += colwidths[i] || _RLEN[coltypes[i]] || 0;
		}
		var hb = ba.next(264);
		hb.write_shift(4, 13);
		for (i = 0; i < 65; ++i) hb.write_shift(4, 0);
		for (i = 0; i < data.length; ++i) {
			var rout = ba.next(rlen);
			rout.write_shift(1, 0);
			for (j = 0; j < headers.length; ++j) {
				if (headers[j] == null) continue;
				switch (coltypes[j]) {
					case "L":
						rout.write_shift(1, data[i][j] == null ? 63 : data[i][j] ? 84 : 70);
						break;
					case "B":
						rout.write_shift(8, data[i][j] || 0, "f");
						break;
					case "N":
						var _n = "0";
						if (typeof data[i][j] == "number") _n = data[i][j].toFixed(coldecimals[j] || 0);
						if (_n.length > colwidths[j]) _n = _n.slice(0, colwidths[j]);
						for (hcnt = 0; hcnt < colwidths[j] - _n.length; ++hcnt) rout.write_shift(1, 32);
						rout.write_shift(1, _n, "sbcs");
						break;
					case "D":
						if (!data[i][j]) rout.write_shift(8, "00000000", "sbcs");
						else {
							rout.write_shift(4, ("0000" + data[i][j].getFullYear()).slice(-4), "sbcs");
							rout.write_shift(2, ("00" + (data[i][j].getMonth() + 1)).slice(-2), "sbcs");
							rout.write_shift(2, ("00" + data[i][j].getDate()).slice(-2), "sbcs");
						}
						break;
					case "C":
						var _l = rout.l;
						var _s = String(data[i][j] != null ? data[i][j] : "").slice(0, colwidths[j]);
						rout.write_shift(1, _s, "cpstr");
						_l += colwidths[j] - rout.l;
						for (hcnt = 0; hcnt < _l; ++hcnt) rout.write_shift(1, 32);
				}
			}
		}
		current_codepage = old_cp;
		ba.next(1).write_shift(1, 26);
		return ba.end();
	}
	return {
		to_workbook: dbf_to_workbook,
		to_sheet: dbf_to_sheet,
		from_sheet: sheet_to_dbf
	};
})();
var SYLK = /*#__PURE__*/ (function() {
	var sylk_escapes = {
		AA: "À",
		BA: "Á",
		CA: "Â",
		DA: 195,
		HA: "Ä",
		JA: 197,
		AE: "È",
		BE: "É",
		CE: "Ê",
		HE: "Ë",
		AI: "Ì",
		BI: "Í",
		CI: "Î",
		HI: "Ï",
		AO: "Ò",
		BO: "Ó",
		CO: "Ô",
		DO: 213,
		HO: "Ö",
		AU: "Ù",
		BU: "Ú",
		CU: "Û",
		HU: "Ü",
		Aa: "à",
		Ba: "á",
		Ca: "â",
		Da: 227,
		Ha: "ä",
		Ja: 229,
		Ae: "è",
		Be: "é",
		Ce: "ê",
		He: "ë",
		Ai: "ì",
		Bi: "í",
		Ci: "î",
		Hi: "ï",
		Ao: "ò",
		Bo: "ó",
		Co: "ô",
		Do: 245,
		Ho: "ö",
		Au: "ù",
		Bu: "ú",
		Cu: "û",
		Hu: "ü",
		KC: "Ç",
		Kc: "ç",
		q: "æ",
		z: "œ",
		a: "Æ",
		j: "Œ",
		DN: 209,
		Dn: 241,
		Hy: 255,
		S: 169,
		c: 170,
		R: 174,
		"B ": 180,
		0: 176,
		1: 177,
		2: 178,
		3: 179,
		5: 181,
		6: 182,
		7: 183,
		Q: 185,
		k: 186,
		b: 208,
		i: 216,
		l: 222,
		s: 240,
		y: 248,
		"!": 161,
		"\"": 162,
		"#": 163,
		"(": 164,
		"%": 165,
		"'": 167,
		"H ": 168,
		"+": 171,
		";": 187,
		"<": 188,
		"=": 189,
		">": 190,
		"?": 191,
		"{": 223
	};
	var sylk_char_regex = new RegExp("\x1BN(" + keys(sylk_escapes).join("|").replace(/\|\|\|/, "|\\||").replace(/([?()+])/g, "\\$1").replace("{", "\\{") + "|\\|)", "gm");
	try {
		sylk_char_regex = new RegExp("\x1BN(" + keys(sylk_escapes).join("|").replace(/\|\|\|/, "|\\||").replace(/([?()+])/g, "\\$1") + "|\\|)", "gm");
	} catch (e) {}
	var sylk_char_fn = function(_, $1) {
		var o = sylk_escapes[$1];
		return typeof o == "number" ? _getansi(o) : o;
	};
	var decode_sylk_char = function($$, $1, $2) {
		var newcc = $1.charCodeAt(0) - 32 << 4 | $2.charCodeAt(0) - 48;
		return newcc == 59 ? $$ : _getansi(newcc);
	};
	sylk_escapes["|"] = 254;
	var encode_sylk_str = function($$) {
		return $$.replace(/\n/g, "\x1B :").replace(/\r/g, "\x1B =");
	};
	function sylk_to_aoa(d, opts) {
		switch (opts.type) {
			case "base64": return sylk_to_aoa_str(Base64_decode(d), opts);
			case "binary": return sylk_to_aoa_str(d, opts);
			case "buffer": return sylk_to_aoa_str(has_buf && Buffer.isBuffer(d) ? d.toString("binary") : a2s(d), opts);
			case "array": return sylk_to_aoa_str(cc2str(d), opts);
		}
		throw new Error("Unrecognized type " + opts.type);
	}
	function sylk_to_aoa_str(str, opts) {
		var records = str.split(/[\n\r]+/), R = -1, C = -1, ri = 0, rj = 0, arr = [];
		var formats = [];
		var next_cell_format = null;
		var sht = {}, rowinfo = [], colinfo = [], cw = [];
		var Mval = 0, j;
		var wb = { Workbook: {
			WBProps: {},
			Names: []
		} };
		if (+opts.codepage >= 0) set_cp(+opts.codepage);
		for (; ri !== records.length; ++ri) {
			Mval = 0;
			var rstr = records[ri].trim().replace(/\x1B([\x20-\x2F])([\x30-\x3F])/g, decode_sylk_char).replace(sylk_char_regex, sylk_char_fn);
			var record = rstr.replace(/;;/g, "\0").split(";").map(function(x) {
				return x.replace(/\u0000/g, ";");
			});
			var RT = record[0], val;
			if (rstr.length > 0) switch (RT) {
				case "ID": break;
				case "E": break;
				case "B": break;
				case "O":
					for (rj = 1; rj < record.length; ++rj) switch (record[rj].charAt(0)) {
						case "V":
							var d1904 = parseInt(record[rj].slice(1), 10);
							if (d1904 >= 1 && d1904 <= 4) wb.Workbook.WBProps.date1904 = true;
							break;
					}
					break;
				case "W": break;
				case "P":
					switch (record[1].charAt(0)) {
						case "P": formats.push(rstr.slice(3).replace(/;;/g, ";"));
					}
					break;
				case "NN":
					var nn = { Sheet: 0 };
					for (rj = 1; rj < record.length; ++rj) switch (record[rj].charAt(0)) {
						case "N":
							nn.Name = record[rj].slice(1);
							break;
						case "E":
							nn.Ref = (opts && opts.sheet || "Sheet1") + "!" + rc_to_a1(record[rj].slice(1));
							break;
					}
					wb.Workbook.Names.push(nn);
					break;
				case "C":
					var C_seen_K = false, C_seen_X = false, C_seen_S = false, C_seen_E = false, _R = -1, _C = -1, formula = "", cell_t = "z";
					var cmnt = "";
					for (rj = 1; rj < record.length; ++rj) switch (record[rj].charAt(0)) {
						case "A":
							cmnt = record[rj].slice(1);
							break;
						case "X":
							C = parseInt(record[rj].slice(1), 10) - 1;
							C_seen_X = true;
							break;
						case "Y":
							R = parseInt(record[rj].slice(1), 10) - 1;
							if (!C_seen_X) C = 0;
							for (j = arr.length; j <= R; ++j) arr[j] = [];
							break;
						case "K":
							val = record[rj].slice(1);
							if (val.charAt(0) === "\"") {
								val = val.slice(1, val.length - 1);
								cell_t = "s";
							} else if (val === "TRUE" || val === "FALSE") {
								val = val === "TRUE";
								cell_t = "b";
							} else if (val.charAt(0) == "#" && RBErr[val] != null) {
								cell_t = "e";
								val = RBErr[val];
							} else if (!isNaN(fuzzynum(val))) {
								val = fuzzynum(val);
								cell_t = "n";
								if (next_cell_format !== null && fmt_is_date(next_cell_format) && opts.cellDates) {
									val = numdate(wb.Workbook.WBProps.date1904 ? val + 1462 : val);
									cell_t = typeof val == "number" ? "n" : "d";
								}
							}
							if (typeof $cptable !== "undefined" && typeof val == "string" && (opts || {}).type != "string" && (opts || {}).codepage) val = $cptable.utils.decode(opts.codepage, val);
							C_seen_K = true;
							break;
						case "E":
							C_seen_E = true;
							formula = rc_to_a1(record[rj].slice(1), {
								r: R,
								c: C
							});
							break;
						case "S":
							C_seen_S = true;
							break;
						case "G": break;
						case "R":
							_R = parseInt(record[rj].slice(1), 10) - 1;
							break;
						case "C":
							_C = parseInt(record[rj].slice(1), 10) - 1;
							break;
						default: if (opts && opts.WTF) throw new Error("SYLK bad record " + rstr);
					}
					if (C_seen_K) {
						if (!arr[R][C]) arr[R][C] = {
							t: cell_t,
							v: val
						};
						else {
							arr[R][C].t = cell_t;
							arr[R][C].v = val;
						}
						if (next_cell_format) arr[R][C].z = next_cell_format;
						if (opts.cellText !== false && next_cell_format) arr[R][C].w = SSF_format(arr[R][C].z, arr[R][C].v, { date1904: wb.Workbook.WBProps.date1904 });
						next_cell_format = null;
					}
					if (C_seen_S) {
						if (C_seen_E) throw new Error("SYLK shared formula cannot have own formula");
						var shrbase = _R > -1 && arr[_R][_C];
						if (!shrbase || !shrbase[1]) throw new Error("SYLK shared formula cannot find base");
						formula = shift_formula_str(shrbase[1], {
							r: R - _R,
							c: C - _C
						});
					}
					if (formula) if (!arr[R][C]) arr[R][C] = {
						t: "n",
						f: formula
					};
					else arr[R][C].f = formula;
					if (cmnt) {
						if (!arr[R][C]) arr[R][C] = { t: "z" };
						arr[R][C].c = [{
							a: "SheetJSYLK",
							t: cmnt
						}];
					}
					break;
				case "F":
					var F_seen = 0;
					for (rj = 1; rj < record.length; ++rj) switch (record[rj].charAt(0)) {
						case "X":
							C = parseInt(record[rj].slice(1), 10) - 1;
							++F_seen;
							break;
						case "Y":
							R = parseInt(record[rj].slice(1), 10) - 1;
							for (j = arr.length; j <= R; ++j) arr[j] = [];
							break;
						case "M":
							Mval = parseInt(record[rj].slice(1), 10) / 20;
							break;
						case "F": break;
						case "G": break;
						case "P":
							next_cell_format = formats[parseInt(record[rj].slice(1), 10)];
							break;
						case "S": break;
						case "D": break;
						case "N": break;
						case "W":
							cw = record[rj].slice(1).split(" ");
							for (j = parseInt(cw[0], 10); j <= parseInt(cw[1], 10); ++j) {
								Mval = parseInt(cw[2], 10);
								colinfo[j - 1] = Mval === 0 ? { hidden: true } : { wch: Mval };
							}
							break;
						case "C":
							C = parseInt(record[rj].slice(1), 10) - 1;
							if (!colinfo[C]) colinfo[C] = {};
							break;
						case "R":
							R = parseInt(record[rj].slice(1), 10) - 1;
							if (!rowinfo[R]) rowinfo[R] = {};
							if (Mval > 0) {
								rowinfo[R].hpt = Mval;
								rowinfo[R].hpx = pt2px(Mval);
							} else if (Mval === 0) rowinfo[R].hidden = true;
							break;
						default: if (opts && opts.WTF) throw new Error("SYLK bad record " + rstr);
					}
					if (F_seen < 1) next_cell_format = null;
					break;
				default: if (opts && opts.WTF) throw new Error("SYLK bad record " + rstr);
			}
		}
		if (rowinfo.length > 0) sht["!rows"] = rowinfo;
		if (colinfo.length > 0) sht["!cols"] = colinfo;
		colinfo.forEach(function(col) {
			process_col(col);
		});
		if (opts && opts.sheetRows) arr = arr.slice(0, opts.sheetRows);
		return [
			arr,
			sht,
			wb
		];
	}
	function sylk_to_workbook(d, opts) {
		var aoasht = sylk_to_aoa(d, opts);
		var aoa = aoasht[0], ws = aoasht[1], wb = aoasht[2];
		var _opts = dup(opts);
		_opts.date1904 = (((wb || {}).Workbook || {}).WBProps || {}).date1904;
		var o = aoa_to_sheet(aoa, _opts);
		keys(ws).forEach(function(k) {
			o[k] = ws[k];
		});
		var outwb = sheet_to_workbook(o, opts);
		keys(wb).forEach(function(k) {
			outwb[k] = wb[k];
		});
		outwb.bookType = "sylk";
		return outwb;
	}
	function write_ws_cell_sylk(cell, ws, R, C, opts, date1904) {
		var o = "C;Y" + (R + 1) + ";X" + (C + 1) + ";K";
		switch (cell.t) {
			case "n":
				o += isFinite(cell.v) ? cell.v || 0 : BErr[isNaN(cell.v) ? 36 : 7];
				if (cell.f && !cell.F) o += ";E" + a1_to_rc(cell.f, {
					r: R,
					c: C
				});
				break;
			case "b":
				o += cell.v ? "TRUE" : "FALSE";
				break;
			case "e":
				o += cell.w || BErr[cell.v] || cell.v;
				break;
			case "d":
				o += datenum(parseDate(cell.v, date1904), date1904);
				break;
			case "s": o += "\"" + (cell.v == null ? "" : String(cell.v)).replace(/"/g, "").replace(/;/g, ";;") + "\"";
		}
		return o;
	}
	function write_ws_cmnt_sylk(cmnt, R, C) {
		var o = "C;Y" + (R + 1) + ";X" + (C + 1) + ";A";
		o += encode_sylk_str(cmnt.map(function(c) {
			return c.t;
		}).join(""));
		return o;
	}
	function write_ws_cols_sylk(out, cols) {
		cols.forEach(function(col, i) {
			var rec = "F;W" + (i + 1) + " " + (i + 1) + " ";
			if (col.hidden) rec += "0";
			else {
				if (typeof col.width == "number" && !col.wpx) col.wpx = width2px(col.width);
				if (typeof col.wpx == "number" && !col.wch) col.wch = px2char(col.wpx);
				if (typeof col.wch == "number") rec += Math.round(col.wch);
			}
			if (rec.charAt(rec.length - 1) != " ") out.push(rec);
		});
	}
	function write_ws_rows_sylk(out, rows) {
		rows.forEach(function(row, i) {
			var rec = "F;";
			if (row.hidden) rec += "M0;";
			else if (row.hpt) rec += "M" + 20 * row.hpt + ";";
			else if (row.hpx) rec += "M" + 20 * px2pt(row.hpx) + ";";
			if (rec.length > 2) out.push(rec + "R" + (i + 1));
		});
	}
	function sheet_to_sylk(ws, opts, wb) {
		if (!opts) opts = {};
		opts._formats = ["General"];
		var preamble = ["ID;PSheetJS;N;E"], o = [];
		var r = safe_decode_range(ws["!ref"] || "A1"), cell;
		var dense = ws["!data"] != null;
		var RS = "\r\n";
		var d1904 = (((wb || {}).Workbook || {}).WBProps || {}).date1904;
		var _lastfmt = "General";
		preamble.push("P;PGeneral");
		var R = r.s.r, C = r.s.c, p = [];
		if (ws["!ref"]) for (R = r.s.r; R <= r.e.r; ++R) {
			if (dense && !ws["!data"][R]) continue;
			p = [];
			for (C = r.s.c; C <= r.e.c; ++C) {
				cell = dense ? ws["!data"][R][C] : ws[encode_col(C) + encode_row(R)];
				if (!cell || !cell.c) continue;
				p.push(write_ws_cmnt_sylk(cell.c, R, C));
			}
			if (p.length) o.push(p.join(RS));
		}
		if (ws["!ref"]) for (R = r.s.r; R <= r.e.r; ++R) {
			if (dense && !ws["!data"][R]) continue;
			p = [];
			for (C = r.s.c; C <= r.e.c; ++C) {
				cell = dense ? ws["!data"][R][C] : ws[encode_col(C) + encode_row(R)];
				if (!cell || cell.v == null && (!cell.f || cell.F)) continue;
				if ((cell.z || (cell.t == "d" ? table_fmt[14] : "General")) != _lastfmt) {
					var ifmt = opts._formats.indexOf(cell.z);
					if (ifmt == -1) {
						opts._formats.push(cell.z);
						ifmt = opts._formats.length - 1;
						preamble.push("P;P" + cell.z.replace(/;/g, ";;"));
					}
					p.push("F;P" + ifmt + ";Y" + (R + 1) + ";X" + (C + 1));
				}
				p.push(write_ws_cell_sylk(cell, ws, R, C, opts, d1904));
			}
			o.push(p.join(RS));
		}
		preamble.push("F;P0;DG0G8;M255");
		if (ws["!cols"]) write_ws_cols_sylk(preamble, ws["!cols"]);
		if (ws["!rows"]) write_ws_rows_sylk(preamble, ws["!rows"]);
		if (ws["!ref"]) preamble.push("B;Y" + (r.e.r - r.s.r + 1) + ";X" + (r.e.c - r.s.c + 1) + ";D" + [
			r.s.c,
			r.s.r,
			r.e.c,
			r.e.r
		].join(" "));
		preamble.push("O;L;D;B" + (d1904 ? ";V4" : "") + ";K47;G100 0.001");
		delete opts._formats;
		return preamble.join(RS) + RS + o.join(RS) + RS + "E" + RS;
	}
	return {
		to_workbook: sylk_to_workbook,
		from_sheet: sheet_to_sylk
	};
})();
var DIF = /*#__PURE__*/ (function() {
	function dif_to_aoa(d, opts) {
		switch (opts.type) {
			case "base64": return dif_to_aoa_str(Base64_decode(d), opts);
			case "binary": return dif_to_aoa_str(d, opts);
			case "buffer": return dif_to_aoa_str(has_buf && Buffer.isBuffer(d) ? d.toString("binary") : a2s(d), opts);
			case "array": return dif_to_aoa_str(cc2str(d), opts);
		}
		throw new Error("Unrecognized type " + opts.type);
	}
	function dif_to_aoa_str(str, opts) {
		var records = str.split("\n"), R = -1, C = -1, ri = 0, arr = [];
		for (; ri !== records.length; ++ri) {
			if (records[ri].trim() === "BOT") {
				arr[++R] = [];
				C = 0;
				continue;
			}
			if (R < 0) continue;
			var metadata = records[ri].trim().split(",");
			var type = metadata[0], value = metadata[1];
			++ri;
			var data = records[ri] || "";
			while ((data.match(/["]/g) || []).length & 1 && ri < records.length - 1) data += "\n" + records[++ri];
			data = data.trim();
			switch (+type) {
				case -1:
					if (data === "BOT") {
						arr[++R] = [];
						C = 0;
						continue;
					} else if (data !== "EOD") throw new Error("Unrecognized DIF special command " + data);
					break;
				case 0:
					if (data === "TRUE") arr[R][C] = true;
					else if (data === "FALSE") arr[R][C] = false;
					else if (!isNaN(fuzzynum(value))) arr[R][C] = fuzzynum(value);
					else if (!isNaN(fuzzydate(value).getDate())) {
						arr[R][C] = parseDate(value);
						if (!(opts && opts.UTC)) arr[R][C] = utc_to_local(arr[R][C]);
					} else arr[R][C] = value;
					++C;
					break;
				case 1:
					data = data.slice(1, data.length - 1);
					data = data.replace(/""/g, "\"");
					if (DIF_XL && data && data.match(/^=".*"$/)) data = data.slice(2, -1);
					arr[R][C++] = data !== "" ? data : null;
			}
			if (data === "EOD") break;
		}
		if (opts && opts.sheetRows) arr = arr.slice(0, opts.sheetRows);
		return arr;
	}
	function dif_to_sheet(str, opts) {
		return aoa_to_sheet(dif_to_aoa(str, opts), opts);
	}
	function dif_to_workbook(str, opts) {
		var o = sheet_to_workbook(dif_to_sheet(str, opts), opts);
		o.bookType = "dif";
		return o;
	}
	function make_value(v, s) {
		return "0," + String(v) + "\r\n" + s;
	}
	function make_value_str(s) {
		return "1,0\r\n\"" + s.replace(/"/g, "\"\"") + "\"";
	}
	function sheet_to_dif(ws) {
		var _DIF_XL = DIF_XL;
		if (!ws["!ref"]) throw new Error("Cannot export empty sheet to DIF");
		var r = safe_decode_range(ws["!ref"]);
		var dense = ws["!data"] != null;
		var o = [
			"TABLE\r\n0,1\r\n\"sheetjs\"\r\n",
			"VECTORS\r\n0," + (r.e.r - r.s.r + 1) + "\r\n\"\"\r\n",
			"TUPLES\r\n0," + (r.e.c - r.s.c + 1) + "\r\n\"\"\r\n",
			"DATA\r\n0,0\r\n\"\"\r\n"
		];
		for (var R = r.s.r; R <= r.e.r; ++R) {
			var row = dense ? ws["!data"][R] : [];
			var p = "-1,0\r\nBOT\r\n";
			for (var C = r.s.c; C <= r.e.c; ++C) {
				var cell = dense ? row && row[C] : ws[encode_cell({
					r: R,
					c: C
				})];
				if (cell == null) {
					p += "1,0\r\n\"\"\r\n";
					continue;
				}
				switch (cell.t) {
					case "n":
						if (_DIF_XL) if (cell.w != null) p += "0," + cell.w + "\r\nV";
						else if (cell.v != null) p += make_value(cell.v, "V");
						else if (cell.f != null && !cell.F) p += make_value_str("=" + cell.f);
						else p += "1,0\r\n\"\"";
						else if (cell.v == null) p += "1,0\r\n\"\"";
						else p += make_value(cell.v, "V");
						break;
					case "b":
						p += cell.v ? make_value(1, "TRUE") : make_value(0, "FALSE");
						break;
					case "s":
						p += make_value_str(!_DIF_XL || isNaN(+cell.v) ? cell.v : "=\"" + cell.v + "\"");
						break;
					case "d":
						if (!cell.w) cell.w = SSF_format(cell.z || table_fmt[14], datenum(parseDate(cell.v)));
						if (_DIF_XL) p += make_value(cell.w, "V");
						else p += make_value_str(cell.w);
						break;
					default: p += "1,0\r\n\"\"";
				}
				p += "\r\n";
			}
			o.push(p);
		}
		return o.join("") + "-1,0\r\nEOD";
	}
	return {
		to_workbook: dif_to_workbook,
		to_sheet: dif_to_sheet,
		from_sheet: sheet_to_dif
	};
})();
var ETH = /*#__PURE__*/ (function() {
	function decode(s) {
		return s.replace(/\\b/g, "\\").replace(/\\c/g, ":").replace(/\\n/g, "\n");
	}
	function encode(s) {
		return s.replace(/\\/g, "\\b").replace(/:/g, "\\c").replace(/\n/g, "\\n");
	}
	function eth_to_aoa(str, opts) {
		var records = str.split("\n"), R = -1, C = -1, ri = 0, arr = [];
		for (; ri !== records.length; ++ri) {
			var record = records[ri].trim().split(":");
			if (record[0] !== "cell") continue;
			var addr = decode_cell(record[1]);
			if (arr.length <= addr.r) {
				for (R = arr.length; R <= addr.r; ++R) if (!arr[R]) arr[R] = [];
			}
			R = addr.r;
			C = addr.c;
			switch (record[2]) {
				case "t":
					arr[R][C] = decode(record[3]);
					break;
				case "v":
					arr[R][C] = +record[3];
					break;
				case "vtf": var _f = record[record.length - 1];
				case "vtc":
					switch (record[3]) {
						case "nl":
							arr[R][C] = +record[4] ? true : false;
							break;
						default: arr[R][C] = record[record.length - 1].charAt(0) == "#" ? {
							t: "e",
							v: RBErr[record[record.length - 1]]
						} : +record[4];
					}
					if (record[2] == "vtf") arr[R][C] = [arr[R][C], _f];
			}
		}
		if (opts && opts.sheetRows) arr = arr.slice(0, opts.sheetRows);
		return arr;
	}
	function eth_to_sheet(d, opts) {
		return aoa_to_sheet(eth_to_aoa(d, opts), opts);
	}
	function eth_to_workbook(d, opts) {
		return sheet_to_workbook(eth_to_sheet(d, opts), opts);
	}
	var header = [
		"socialcalc:version:1.5",
		"MIME-Version: 1.0",
		"Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave"
	].join("\n");
	var sep = ["--SocialCalcSpreadsheetControlSave", "Content-type: text/plain; charset=UTF-8"].join("\n") + "\n";
	var meta = ["# SocialCalc Spreadsheet Control Save", "part:sheet"].join("\n");
	var end = "--SocialCalcSpreadsheetControlSave--";
	function sheet_to_eth_data(ws) {
		if (!ws || !ws["!ref"]) return "";
		var o = [], oo = [], cell, coord = "";
		var r = decode_range(ws["!ref"]);
		var dense = ws["!data"] != null;
		for (var R = r.s.r; R <= r.e.r; ++R) for (var C = r.s.c; C <= r.e.c; ++C) {
			coord = encode_cell({
				r: R,
				c: C
			});
			cell = dense ? (ws["!data"][R] || [])[C] : ws[coord];
			if (!cell || cell.v == null || cell.t === "z") continue;
			oo = [
				"cell",
				coord,
				"t"
			];
			switch (cell.t) {
				case "s":
					oo.push(encode(cell.v));
					break;
				case "b":
					oo[2] = "vt" + (cell.f ? "f" : "c");
					oo[3] = "nl";
					oo[4] = cell.v ? "1" : "0";
					oo[5] = encode(cell.f || (cell.v ? "TRUE" : "FALSE"));
					break;
				case "d":
					var t = datenum(parseDate(cell.v));
					oo[2] = "vtc";
					oo[3] = "nd";
					oo[4] = "" + t;
					oo[5] = cell.w || SSF_format(cell.z || table_fmt[14], t);
					break;
				case "n":
					if (isFinite(cell.v)) if (!cell.f) {
						oo[2] = "v";
						oo[3] = cell.v;
					} else {
						oo[2] = "vtf";
						oo[3] = "n";
						oo[4] = cell.v;
						oo[5] = encode(cell.f);
					}
					else {
						oo[2] = "vt" + (cell.f ? "f" : "c");
						oo[3] = "e" + BErr[isNaN(cell.v) ? 36 : 7];
						oo[4] = "0";
						oo[5] = cell.f || oo[3].slice(1);
						oo[6] = "e";
						oo[7] = oo[3].slice(1);
					}
					break;
				case "e": continue;
			}
			o.push(oo.join(":"));
		}
		o.push("sheet:c:" + (r.e.c - r.s.c + 1) + ":r:" + (r.e.r - r.s.r + 1) + ":tvf:1");
		o.push("valueformat:1:text-wiki");
		return o.join("\n");
	}
	function sheet_to_eth(ws) {
		return [
			header,
			sep,
			meta,
			sep,
			sheet_to_eth_data(ws),
			end
		].join("\n");
	}
	return {
		to_workbook: eth_to_workbook,
		to_sheet: eth_to_sheet,
		from_sheet: sheet_to_eth
	};
})();
var PRN = /*#__PURE__*/ (function() {
	function set_text_arr(data, arr, R, C, o) {
		if (o.raw) arr[R][C] = data;
		else if (data === "") {} else if (data === "TRUE") arr[R][C] = true;
		else if (data === "FALSE") arr[R][C] = false;
		else if (!isNaN(fuzzynum(data))) arr[R][C] = fuzzynum(data);
		else if (!isNaN(fuzzydate(data).getDate())) arr[R][C] = parseDate(data);
		else if (data.charCodeAt(0) == 35 && RBErr[data] != null) arr[R][C] = {
			t: "e",
			v: RBErr[data],
			w: data
		};
		else arr[R][C] = data;
	}
	function prn_to_aoa_str(f, opts) {
		var o = opts || {};
		var arr = [];
		if (!f || f.length === 0) return arr;
		var lines = f.split(/[\r\n]/);
		var L = lines.length - 1;
		while (L >= 0 && lines[L].length === 0) --L;
		var start = 10, idx = 0;
		var R = 0;
		for (; R <= L; ++R) {
			idx = lines[R].indexOf(" ");
			if (idx == -1) idx = lines[R].length;
			else idx++;
			start = Math.max(start, idx);
		}
		for (R = 0; R <= L; ++R) {
			arr[R] = [];
			var C = 0;
			set_text_arr(lines[R].slice(0, start).trim(), arr, R, C, o);
			for (C = 1; C <= (lines[R].length - start) / 10 + 1; ++C) set_text_arr(lines[R].slice(start + (C - 1) * 10, start + C * 10).trim(), arr, R, C, o);
		}
		if (o.sheetRows) arr = arr.slice(0, o.sheetRows);
		return arr;
	}
	var guess_seps = {
		44: ",",
		9: "	",
		59: ";",
		124: "|"
	};
	var guess_sep_weights = {
		44: 3,
		9: 2,
		59: 1,
		124: 0
	};
	function guess_sep(str) {
		var cnt = {}, instr = false, end = 0, cc = 0;
		for (; end < str.length; ++end) if ((cc = str.charCodeAt(end)) == 34) instr = !instr;
		else if (!instr && cc in guess_seps) cnt[cc] = (cnt[cc] || 0) + 1;
		cc = [];
		for (end in cnt) if (Object.prototype.hasOwnProperty.call(cnt, end)) cc.push([cnt[end], end]);
		if (!cc.length) {
			cnt = guess_sep_weights;
			for (end in cnt) if (Object.prototype.hasOwnProperty.call(cnt, end)) cc.push([cnt[end], end]);
		}
		cc.sort(function(a, b) {
			return a[0] - b[0] || guess_sep_weights[a[1]] - guess_sep_weights[b[1]];
		});
		return guess_seps[cc.pop()[1]] || 44;
	}
	function dsv_to_sheet_str(str, opts) {
		var o = opts || {};
		var sep = "";
		if (DENSE != null && o.dense == null) o.dense = DENSE;
		var ws = {};
		if (o.dense) ws["!data"] = [];
		var range = {
			s: {
				c: 0,
				r: 0
			},
			e: {
				c: 0,
				r: 0
			}
		};
		if (str.slice(0, 4) == "sep=") if (str.charCodeAt(5) == 13 && str.charCodeAt(6) == 10) {
			sep = str.charAt(4);
			str = str.slice(7);
		} else if (str.charCodeAt(5) == 13 || str.charCodeAt(5) == 10) {
			sep = str.charAt(4);
			str = str.slice(6);
		} else sep = guess_sep(str.slice(0, 1024));
		else if (o && o.FS) sep = o.FS;
		else sep = guess_sep(str.slice(0, 1024));
		var R = 0, C = 0, v = 0;
		var start = 0, end = 0, sepcc = sep.charCodeAt(0), instr = false, cc = 0, startcc = str.charCodeAt(0);
		var _re = o.dateNF != null ? dateNF_regex(o.dateNF) : null;
		function finish_cell() {
			var s = str.slice(start, end);
			if (s.slice(-1) == "\r") s = s.slice(0, -1);
			var cell = {};
			if (s.charAt(0) == "\"" && s.charAt(s.length - 1) == "\"") s = s.slice(1, -1).replace(/""/g, "\"");
			if (o.cellText !== false) cell.w = s;
			if (s.length === 0) cell.t = "z";
			else if (o.raw) {
				cell.t = "s";
				cell.v = s;
			} else if (s.trim().length === 0) {
				cell.t = "s";
				cell.v = s;
			} else if (s.charCodeAt(0) == 61) if (s.charCodeAt(1) == 34 && s.charCodeAt(s.length - 1) == 34) {
				cell.t = "s";
				cell.v = s.slice(2, -1).replace(/""/g, "\"");
			} else if (fuzzyfmla(s)) {
				cell.t = "s";
				cell.f = s.slice(1);
				cell.v = s;
			} else {
				cell.t = "s";
				cell.v = s;
			}
			else if (s == "TRUE") {
				cell.t = "b";
				cell.v = true;
			} else if (s == "FALSE") {
				cell.t = "b";
				cell.v = false;
			} else if (!isNaN(v = fuzzynum(s))) {
				cell.t = "n";
				cell.v = v;
			} else if (!isNaN((v = fuzzydate(s)).getDate()) || _re && s.match(_re)) {
				cell.z = o.dateNF || table_fmt[14];
				if (_re && s.match(_re)) {
					v = parseDate(dateNF_fix(s, o.dateNF, s.match(_re) || []));
					if (o && o.UTC === false) v = utc_to_local(v);
				} else if (o && o.UTC === false) v = utc_to_local(v);
				else if (o.cellText !== false && o.dateNF) cell.w = SSF_format(cell.z, v);
				if (o.cellDates) {
					cell.t = "d";
					cell.v = v;
				} else {
					cell.t = "n";
					cell.v = datenum(v);
				}
				if (!o.cellNF) delete cell.z;
			} else if (s.charCodeAt(0) == 35 && RBErr[s] != null) {
				cell.t = "e";
				cell.w = s;
				cell.v = RBErr[s];
			} else {
				cell.t = "s";
				cell.v = s;
			}
			if (cell.t == "z") {} else if (o.dense) {
				if (!ws["!data"][R]) ws["!data"][R] = [];
				ws["!data"][R][C] = cell;
			} else ws[encode_cell({
				c: C,
				r: R
			})] = cell;
			start = end + 1;
			startcc = str.charCodeAt(start);
			if (range.e.c < C) range.e.c = C;
			if (range.e.r < R) range.e.r = R;
			if (cc == sepcc) ++C;
			else {
				C = 0;
				++R;
				if (o.sheetRows && o.sheetRows <= R) return true;
			}
		}
		outer: for (; end < str.length; ++end) switch (cc = str.charCodeAt(end)) {
			case 34:
				if (startcc === 34) instr = !instr;
				break;
			case 13:
				if (instr) break;
				if (str.charCodeAt(end + 1) == 10) ++end;
			case sepcc:
			case 10:
				if (!instr && finish_cell()) break outer;
				break;
			default: break;
		}
		if (end - start > 0) finish_cell();
		ws["!ref"] = encode_range(range);
		return ws;
	}
	function prn_to_sheet_str(str, opts) {
		if (!(opts && opts.PRN)) return dsv_to_sheet_str(str, opts);
		if (opts.FS) return dsv_to_sheet_str(str, opts);
		if (str.slice(0, 4) == "sep=") return dsv_to_sheet_str(str, opts);
		if (str.indexOf("	") >= 0 || str.indexOf(",") >= 0 || str.indexOf(";") >= 0) return dsv_to_sheet_str(str, opts);
		return aoa_to_sheet(prn_to_aoa_str(str, opts), opts);
	}
	function prn_to_sheet(d, opts) {
		var str = "", bytes = opts.type == "string" ? [
			0,
			0,
			0,
			0
		] : firstbyte(d, opts);
		switch (opts.type) {
			case "base64":
				str = Base64_decode(d);
				break;
			case "binary":
				str = d;
				break;
			case "buffer":
				if (opts.codepage == 65001) str = d.toString("utf8");
				else if (opts.codepage && typeof $cptable !== "undefined") str = $cptable.utils.decode(opts.codepage, d);
				else str = has_buf && Buffer.isBuffer(d) ? d.toString("binary") : a2s(d);
				break;
			case "array":
				str = cc2str(d);
				break;
			case "string":
				str = d;
				break;
			default: throw new Error("Unrecognized type " + opts.type);
		}
		if (bytes[0] == 239 && bytes[1] == 187 && bytes[2] == 191) str = utf8read(str.slice(3));
		else if (opts.type != "string" && opts.type != "buffer" && opts.codepage == 65001) str = utf8read(str);
		else if (opts.type == "binary" && typeof $cptable !== "undefined" && opts.codepage) str = $cptable.utils.decode(opts.codepage, $cptable.utils.encode(28591, str));
		if (str.slice(0, 19) == "socialcalc:version:") return ETH.to_sheet(opts.type == "string" ? str : utf8read(str), opts);
		return prn_to_sheet_str(str, opts);
	}
	function prn_to_workbook(d, opts) {
		return sheet_to_workbook(prn_to_sheet(d, opts), opts);
	}
	function sheet_to_prn(ws) {
		var o = [];
		if (!ws["!ref"]) return "";
		var r = safe_decode_range(ws["!ref"]), cell;
		var dense = ws["!data"] != null;
		for (var R = r.s.r; R <= r.e.r; ++R) {
			var oo = [];
			for (var C = r.s.c; C <= r.e.c; ++C) {
				var coord = encode_cell({
					r: R,
					c: C
				});
				cell = dense ? (ws["!data"][R] || [])[C] : ws[coord];
				if (!cell || cell.v == null) {
					oo.push("          ");
					continue;
				}
				var w = (cell.w || (format_cell(cell), cell.w) || "").slice(0, 10);
				while (w.length < 10) w += " ";
				oo.push(w + (C === 0 ? " " : ""));
			}
			o.push(oo.join(""));
		}
		return o.join("\n");
	}
	return {
		to_workbook: prn_to_workbook,
		to_sheet: prn_to_sheet,
		from_sheet: sheet_to_prn
	};
})();
function read_wb_ID(d, opts) {
	var o = opts || {}, OLD_WTF = !!o.WTF;
	o.WTF = true;
	try {
		var out = SYLK.to_workbook(d, o);
		o.WTF = OLD_WTF;
		return out;
	} catch (e) {
		o.WTF = OLD_WTF;
		if (e.message.indexOf("SYLK bad record ID") == -1 && OLD_WTF) throw e;
		return PRN.to_workbook(d, opts);
	}
}
function read_wb_TABL(d, opts) {
	var o = opts || {}, OLD_WTF = !!o.WTF;
	o.WTF = true;
	try {
		var out = DIF.to_workbook(d, o);
		if (!out || !out.Sheets) throw "DIF bad workbook";
		var ws = sheet_map_get(out.Sheets, out.SheetNames[0]);
		if (!ws || !ws["!ref"]) throw "DIF empty worksheet";
		o.WTF = OLD_WTF;
		return out;
	} catch (e) {
		o.WTF = OLD_WTF;
		return PRN.to_workbook(d, opts);
	}
}
var WK_ = /*#__PURE__*/ (function() {
	function lotushopper(data, cb, opts) {
		if (!data) return;
		prep_blob(data, data.l || 0);
		var Enum = opts.Enum || WK1Enum;
		while (data.l < data.length) {
			var RT = data.read_shift(2);
			var R = Enum[RT] || Enum[65535];
			var length = data.read_shift(2);
			var tgt = data.l + length;
			var d = R.f && R.f(data, length, opts);
			data.l = tgt;
			if (cb(d, R, RT)) return;
		}
	}
	function lotus_to_workbook(d, opts) {
		switch (opts.type) {
			case "base64": return lotus_to_workbook_buf(s2a(Base64_decode(d)), opts);
			case "binary": return lotus_to_workbook_buf(s2a(d), opts);
			case "buffer":
			case "array": return lotus_to_workbook_buf(d, opts);
		}
		throw "Unsupported type " + opts.type;
	}
	var LOTUS_DATE_FMTS = [
		"mmmm",
		"dd-mmm-yyyy",
		"dd-mmm",
		"mmm-yyyy",
		"@",
		"mm/dd",
		"hh:mm:ss AM/PM",
		"hh:mm AM/PM",
		"mm/dd/yyyy",
		"mm/dd",
		"hh:mm:ss",
		"hh:mm"
	];
	function lotus_to_workbook_buf(d, opts) {
		if (!d) return d;
		var o = opts || {};
		if (DENSE != null && o.dense == null) o.dense = DENSE;
		var s = {}, n = "Sheet1", next_n = "", sidx = 0;
		var sheets = sheet_map_new(), snames = [], realnames = [], sdata = [];
		if (o.dense) sdata = s["!data"] = [];
		var refguess = {
			s: {
				r: 0,
				c: 0
			},
			e: {
				r: 0,
				c: 0
			}
		};
		var sheetRows = o.sheetRows || 0;
		var lastcell = {};
		if (d[4] == 81 && d[5] == 80 && d[6] == 87) return qpw_to_workbook_buf(d, opts);
		if (d[2] == 0) {
			if (d[3] == 8 || d[3] == 9) {
				if (d.length >= 16 && d[14] == 5 && d[15] === 108) throw new Error("Unsupported Works 3 for Mac file");
			}
		}
		if (d[2] == 2) {
			o.Enum = WK1Enum;
			lotushopper(d, function(val, R, RT) {
				switch (RT) {
					case 0:
						o.vers = val;
						if (val >= 4096) o.qpro = true;
						break;
					case 255:
						o.vers = val;
						o.works = true;
						break;
					case 6:
						refguess = val;
						break;
					case 204:
						if (val) next_n = val;
						break;
					case 222:
						next_n = val;
						break;
					case 15:
					case 51:
						if ((!o.qpro && !o.works || RT == 51) && val[1].v.charCodeAt(0) < 48) val[1].v = val[1].v.slice(1);
						if (o.works || o.works2) val[1].v = val[1].v.replace(/\r\n/g, "\n");
					case 13:
					case 14:
					case 16:
						if ((val[2] & 112) == 112 && (val[2] & 15) > 1 && (val[2] & 15) < 15) {
							val[1].z = o.dateNF || LOTUS_DATE_FMTS[(val[2] & 15) - 1] || table_fmt[14];
							if (o.cellDates) {
								val[1].v = numdate(val[1].v);
								val[1].t = typeof val[1].v == "number" ? "n" : "d";
							}
						}
						if (o.qpro) {
							if (val[3] > sidx) {
								s["!ref"] = encode_range(refguess);
								sheet_map_set(sheets, n, s);
								snames.push(n);
								s = {};
								if (o.dense) sdata = s["!data"] = [];
								refguess = {
									s: {
										r: 0,
										c: 0
									},
									e: {
										r: 0,
										c: 0
									}
								};
								sidx = val[3];
								n = next_n || "Sheet" + (sidx + 1);
								next_n = "";
							}
						}
						var tmpcell = o.dense ? (sdata[val[0].r] || [])[val[0].c] : s[encode_cell(val[0])];
						if (tmpcell) {
							tmpcell.t = val[1].t;
							tmpcell.v = val[1].v;
							if (val[1].z != null) tmpcell.z = val[1].z;
							if (val[1].f != null) tmpcell.f = val[1].f;
							lastcell = tmpcell;
							break;
						}
						if (o.dense) {
							if (!sdata[val[0].r]) sdata[val[0].r] = [];
							sdata[val[0].r][val[0].c] = val[1];
						} else s[encode_cell(val[0])] = val[1];
						lastcell = val[1];
						break;
					case 21509:
						o.works2 = true;
						break;
					case 21506: if (val == 5281) {
						lastcell.z = "hh:mm:ss";
						if (o.cellDates && lastcell.t == "n") {
							lastcell.v = numdate(lastcell.v);
							lastcell.t = typeof lastcell.v == "number" ? "n" : "d";
						}
					}
				}
			}, o);
		} else if (d[2] == 26 || d[2] == 14) {
			o.Enum = WK3Enum;
			if (d[2] == 14) {
				o.qpro = true;
				d.l = 0;
			}
			lotushopper(d, function(val, R, RT) {
				switch (RT) {
					case 204:
						n = val;
						break;
					case 22:
						if (val[1].v.charCodeAt(0) < 48) val[1].v = val[1].v.slice(1);
						val[1].v = val[1].v.replace(/\x0F./g, function($$) {
							return String.fromCharCode($$.charCodeAt(1) - 32);
						}).replace(/\r\n/g, "\n");
					case 23:
					case 24:
					case 25:
					case 37:
					case 39:
					case 40:
						if (val[3] > sidx) {
							s["!ref"] = encode_range(refguess);
							sheet_map_set(sheets, n, s);
							snames.push(n);
							s = {};
							if (o.dense) sdata = s["!data"] = [];
							refguess = {
								s: {
									r: 0,
									c: 0
								},
								e: {
									r: 0,
									c: 0
								}
							};
							sidx = val[3];
							n = "Sheet" + (sidx + 1);
						}
						if (sheetRows > 0 && val[0].r >= sheetRows) break;
						if (o.dense) {
							if (!sdata[val[0].r]) sdata[val[0].r] = [];
							sdata[val[0].r][val[0].c] = val[1];
						} else s[encode_cell(val[0])] = val[1];
						if (refguess.e.c < val[0].c) refguess.e.c = val[0].c;
						if (refguess.e.r < val[0].r) refguess.e.r = val[0].r;
						break;
					case 27:
						if (val[14e3]) realnames[val[14e3][0]] = val[14e3][1];
						break;
					case 1537:
						realnames[val[0]] = val[1];
						if (val[0] == sidx) n = val[1];
				}
			}, o);
		} else throw new Error("Unrecognized LOTUS BOF " + d[2]);
		s["!ref"] = encode_range(refguess);
		sheet_map_set(sheets, next_n || n, s);
		snames.push(next_n || n);
		if (!realnames.length) return {
			SheetNames: snames,
			Sheets: sheets
		};
		var osheets = sheet_map_new(), rnames = [];
		for (var i = 0; i < realnames.length; ++i) if (sheet_map_get(sheets, snames[i])) {
			rnames.push(realnames[i] || snames[i]);
			sheet_map_set(osheets, realnames[i] || snames[i], sheet_map_get(sheets, realnames[i]) || sheet_map_get(sheets, snames[i]));
		} else {
			rnames.push(realnames[i]);
			sheet_map_set(osheets, realnames[i], { "!ref": "A1" });
		}
		return {
			SheetNames: rnames,
			Sheets: osheets
		};
	}
	function sheet_to_wk1(ws, opts) {
		var o = opts || {};
		if (+o.codepage >= 0) set_cp(+o.codepage);
		if (o.type == "string") throw new Error("Cannot write WK1 to JS string");
		var ba = buf_array();
		if (!ws["!ref"]) throw new Error("Cannot export empty sheet to WK1");
		var range = safe_decode_range(ws["!ref"]);
		var dense = ws["!data"] != null;
		var cols = [];
		write_biff_rec(ba, 0, write_BOF_WK1(1030));
		write_biff_rec(ba, 6, write_RANGE(range));
		var max_R = Math.min(range.e.r, 8191);
		for (var C = range.s.c; C <= range.e.c; ++C) cols[C] = encode_col(C);
		for (var R = range.s.r; R <= max_R; ++R) {
			var rr = encode_row(R);
			for (C = range.s.c; C <= range.e.c; ++C) {
				var cell = dense ? (ws["!data"][R] || [])[C] : ws[cols[C] + rr];
				if (!cell || cell.t == "z") continue;
				switch (cell.t) {
					case "n":
						if ((cell.v | 0) == cell.v && cell.v >= -32768 && cell.v <= 32767) write_biff_rec(ba, 13, write_INTEGER(R, C, cell));
						else write_biff_rec(ba, 14, write_NUMBER(R, C, cell));
						break;
					case "d":
						var dc = datenum(cell.v);
						if ((dc | 0) == dc && dc >= -32768 && dc <= 32767) write_biff_rec(ba, 13, write_INTEGER(R, C, {
							t: "n",
							v: dc,
							z: cell.z || table_fmt[14]
						}));
						else write_biff_rec(ba, 14, write_NUMBER(R, C, {
							t: "n",
							v: dc,
							z: cell.z || table_fmt[14]
						}));
						break;
					default:
						var str = format_cell(cell);
						write_biff_rec(ba, 15, write_LABEL(R, C, str.slice(0, 239)));
				}
			}
		}
		write_biff_rec(ba, 1);
		return ba.end();
	}
	function book_to_wk3(wb, opts) {
		var o = opts || {};
		if (+o.codepage >= 0) set_cp(+o.codepage);
		if (o.type == "string") throw new Error("Cannot write WK3 to JS string");
		var ba = buf_array();
		write_biff_rec(ba, 0, write_BOF_WK3(wb));
		for (var i = 0, cnt = 0; i < wb.SheetNames.length; ++i) if ((sheet_map_get(wb.Sheets, wb.SheetNames[i]) || {})["!ref"]) write_biff_rec(ba, 27, write_XFORMAT_SHEETNAME(wb.SheetNames[i], cnt++));
		var wsidx = 0;
		for (i = 0; i < wb.SheetNames.length; ++i) {
			var ws = sheet_map_get(wb.Sheets, wb.SheetNames[i]);
			if (!ws || !ws["!ref"]) continue;
			var range = safe_decode_range(ws["!ref"]);
			var dense = ws["!data"] != null;
			var cols = [];
			var max_R = Math.min(range.e.r, 8191);
			for (var R = range.s.r; R <= max_R; ++R) {
				var rr = encode_row(R);
				for (var C = range.s.c; C <= range.e.c; ++C) {
					if (R === range.s.r) cols[C] = encode_col(C);
					var ref = cols[C] + rr;
					var cell = dense ? (ws["!data"][R] || [])[C] : ws[ref];
					if (!cell || cell.t == "z") continue;
					if (cell.t == "n") write_biff_rec(ba, 23, write_NUMBER_17(R, C, wsidx, cell.v));
					else {
						var str = format_cell(cell);
						write_biff_rec(ba, 22, write_LABEL_16(R, C, wsidx, str.slice(0, 239)));
					}
				}
			}
			++wsidx;
		}
		write_biff_rec(ba, 1);
		return ba.end();
	}
	function write_BOF_WK1(v) {
		var out = new_buf(2);
		out.write_shift(2, v);
		return out;
	}
	function write_BOF_WK3(wb) {
		var out = new_buf(26);
		out.write_shift(2, 4096);
		out.write_shift(2, 4);
		out.write_shift(4, 0);
		var rows = 0, cols = 0, wscnt = 0;
		for (var i = 0; i < wb.SheetNames.length; ++i) {
			var name = wb.SheetNames[i];
			var ws = sheet_map_get(wb.Sheets, name);
			if (!ws || !ws["!ref"]) continue;
			++wscnt;
			var range = decode_range(ws["!ref"]);
			if (rows < range.e.r) rows = range.e.r;
			if (cols < range.e.c) cols = range.e.c;
		}
		if (rows > 8191) rows = 8191;
		out.write_shift(2, rows);
		out.write_shift(1, wscnt);
		out.write_shift(1, cols);
		out.write_shift(2, 0);
		out.write_shift(2, 0);
		out.write_shift(1, 1);
		out.write_shift(1, 2);
		out.write_shift(4, 0);
		out.write_shift(4, 0);
		return out;
	}
	function parse_RANGE(blob, length, opts) {
		var o = {
			s: {
				c: 0,
				r: 0
			},
			e: {
				c: 0,
				r: 0
			}
		};
		if (length == 8 && opts.qpro) {
			o.s.c = blob.read_shift(1);
			blob.l++;
			o.s.r = blob.read_shift(2);
			o.e.c = blob.read_shift(1);
			blob.l++;
			o.e.r = blob.read_shift(2);
			return o;
		}
		o.s.c = blob.read_shift(2);
		o.s.r = blob.read_shift(2);
		if (length == 12 && opts.qpro) blob.l += 2;
		o.e.c = blob.read_shift(2);
		o.e.r = blob.read_shift(2);
		if (length == 12 && opts.qpro) blob.l += 2;
		if (o.s.c == 65535) o.s.c = o.e.c = o.s.r = o.e.r = 0;
		return o;
	}
	function write_RANGE(range) {
		var out = new_buf(8);
		out.write_shift(2, range.s.c);
		out.write_shift(2, range.s.r);
		out.write_shift(2, range.e.c);
		out.write_shift(2, range.e.r);
		return out;
	}
	function parse_cell(blob, length, opts) {
		var o = [
			{
				c: 0,
				r: 0
			},
			{
				t: "n",
				v: 0
			},
			0,
			0
		];
		if (opts.qpro && opts.vers != 20768) {
			o[0].c = blob.read_shift(1);
			o[3] = blob.read_shift(1);
			o[0].r = blob.read_shift(2);
			blob.l += 2;
		} else if (opts.works) {
			o[0].c = blob.read_shift(2);
			o[0].r = blob.read_shift(2);
			o[2] = blob.read_shift(2);
		} else {
			o[2] = blob.read_shift(1);
			o[0].c = blob.read_shift(2);
			o[0].r = blob.read_shift(2);
		}
		return o;
	}
	function get_wk1_fmt(cell) {
		if (cell.z && fmt_is_date(cell.z)) return 240 | (LOTUS_DATE_FMTS.indexOf(cell.z) + 1 || 2);
		return 255;
	}
	function parse_LABEL(blob, length, opts) {
		var tgt = blob.l + length;
		var o = parse_cell(blob, length, opts);
		o[1].t = "s";
		if ((opts.vers & 65534) == 20768) {
			blob.l++;
			var len = blob.read_shift(1);
			o[1].v = blob.read_shift(len, "utf8");
			return o;
		}
		if (opts.qpro) blob.l++;
		o[1].v = blob.read_shift(tgt - blob.l, "cstr");
		return o;
	}
	function write_LABEL(R, C, s) {
		var o = new_buf(7 + s.length);
		o.write_shift(1, 255);
		o.write_shift(2, C);
		o.write_shift(2, R);
		o.write_shift(1, 39);
		for (var i = 0; i < o.length; ++i) {
			var cc = s.charCodeAt(i);
			o.write_shift(1, cc >= 128 ? 95 : cc);
		}
		o.write_shift(1, 0);
		return o;
	}
	function parse_STRING(blob, length, opts) {
		var tgt = blob.l + length;
		var o = parse_cell(blob, length, opts);
		o[1].t = "s";
		if (opts.vers == 20768) {
			var len = blob.read_shift(1);
			o[1].v = blob.read_shift(len, "utf8");
			return o;
		}
		o[1].v = blob.read_shift(tgt - blob.l, "cstr");
		return o;
	}
	function parse_INTEGER(blob, length, opts) {
		var o = parse_cell(blob, length, opts);
		o[1].v = blob.read_shift(2, "i");
		return o;
	}
	function write_INTEGER(R, C, cell) {
		var o = new_buf(7);
		o.write_shift(1, get_wk1_fmt(cell));
		o.write_shift(2, C);
		o.write_shift(2, R);
		o.write_shift(2, cell.v, "i");
		return o;
	}
	function parse_NUMBER(blob, length, opts) {
		var o = parse_cell(blob, length, opts);
		o[1].v = blob.read_shift(8, "f");
		return o;
	}
	function write_NUMBER(R, C, cell) {
		var o = new_buf(13);
		o.write_shift(1, get_wk1_fmt(cell));
		o.write_shift(2, C);
		o.write_shift(2, R);
		o.write_shift(8, cell.v, "f");
		return o;
	}
	function parse_FORMULA(blob, length, opts) {
		var tgt = blob.l + length;
		var o = parse_cell(blob, length, opts);
		o[1].v = blob.read_shift(8, "f");
		if (opts.qpro) blob.l = tgt;
		else {
			var flen = blob.read_shift(2);
			wk1_fmla_to_csf(blob.slice(blob.l, blob.l + flen), o);
			blob.l += flen;
		}
		return o;
	}
	function wk1_parse_rc(B, V, col) {
		var rel = V & 32768;
		V &= -32769;
		V = (rel ? B : 0) + (V >= 8192 ? V - 16384 : V);
		return (rel ? "" : "$") + (col ? encode_col(V) : encode_row(V));
	}
	var FuncTab = {
		31: ["NA", 0],
		33: ["ABS", 1],
		34: ["TRUNC", 1],
		35: ["SQRT", 1],
		36: ["LOG", 1],
		37: ["LN", 1],
		38: ["PI", 0],
		39: ["SIN", 1],
		40: ["COS", 1],
		41: ["TAN", 1],
		42: ["ATAN2", 2],
		43: ["ATAN", 1],
		44: ["ASIN", 1],
		45: ["ACOS", 1],
		46: ["EXP", 1],
		47: ["MOD", 2],
		49: ["ISNA", 1],
		50: ["ISERR", 1],
		51: ["FALSE", 0],
		52: ["TRUE", 0],
		53: ["RAND", 0],
		54: ["DATE", 3],
		63: ["ROUND", 2],
		64: ["TIME", 3],
		68: ["ISNUMBER", 1],
		69: ["ISTEXT", 1],
		70: ["LEN", 1],
		71: ["VALUE", 1],
		73: ["MID", 3],
		74: ["CHAR", 1],
		80: ["SUM", 69],
		81: ["AVERAGEA", 69],
		82: ["COUNTA", 69],
		83: ["MINA", 69],
		84: ["MAXA", 69],
		102: ["UPPER", 1],
		103: ["LOWER", 1],
		107: ["PROPER", 1],
		109: ["TRIM", 1],
		111: ["T", 1]
	};
	var BinOpTab = [
		"",
		"",
		"",
		"",
		"",
		"",
		"",
		"",
		"",
		"+",
		"-",
		"*",
		"/",
		"^",
		"=",
		"<>",
		"<=",
		">=",
		"<",
		">",
		"",
		"",
		"",
		"",
		"&",
		"",
		"",
		"",
		"",
		"",
		"",
		""
	];
	function wk1_fmla_to_csf(blob, o) {
		prep_blob(blob, 0);
		var out = [], argc = 0, R = "", C = "", argL = "", argR = "";
		while (blob.l < blob.length) {
			var cc = blob[blob.l++];
			switch (cc) {
				case 0:
					out.push(blob.read_shift(8, "f"));
					break;
				case 1:
					C = wk1_parse_rc(o[0].c, blob.read_shift(2), true);
					R = wk1_parse_rc(o[0].r, blob.read_shift(2), false);
					out.push(C + R);
					break;
				case 2:
					var c = wk1_parse_rc(o[0].c, blob.read_shift(2), true);
					var r = wk1_parse_rc(o[0].r, blob.read_shift(2), false);
					C = wk1_parse_rc(o[0].c, blob.read_shift(2), true);
					R = wk1_parse_rc(o[0].r, blob.read_shift(2), false);
					out.push(c + r + ":" + C + R);
					break;
				case 3:
					if (blob.l < blob.length) {
						console.error("WK1 premature formula end");
						return;
					}
					break;
				case 4:
					out.push("(" + out.pop() + ")");
					break;
				case 5:
					out.push(blob.read_shift(2));
					break;
				case 6:
					var Z = "";
					while (cc = blob[blob.l++]) Z += String.fromCharCode(cc);
					out.push("\"" + Z.replace(/"/g, "\"\"") + "\"");
					break;
				case 8:
					out.push("-" + out.pop());
					break;
				case 23:
					out.push("+" + out.pop());
					break;
				case 22:
					out.push("NOT(" + out.pop() + ")");
					break;
				case 20:
				case 21:
					argR = out.pop();
					argL = out.pop();
					out.push(["AND", "OR"][cc - 20] + "(" + argL + "," + argR + ")");
					break;
				default: if (cc < 32 && BinOpTab[cc]) {
					argR = out.pop();
					argL = out.pop();
					out.push(argL + BinOpTab[cc] + argR);
				} else if (FuncTab[cc]) {
					argc = FuncTab[cc][1];
					if (argc == 69) argc = blob[blob.l++];
					if (argc > out.length) {
						console.error("WK1 bad formula parse 0x" + cc.toString(16) + ":|" + out.join("|") + "|");
						return;
					}
					var args = out.slice(-argc);
					out.length -= argc;
					out.push(FuncTab[cc][0] + "(" + args.join(",") + ")");
				} else if (cc <= 7) return console.error("WK1 invalid opcode " + cc.toString(16));
				else if (cc <= 24) return console.error("WK1 unsupported op " + cc.toString(16));
				else if (cc <= 30) return console.error("WK1 invalid opcode " + cc.toString(16));
				else if (cc <= 115) return console.error("WK1 unsupported function opcode " + cc.toString(16));
				else return console.error("WK1 unrecognized opcode " + cc.toString(16));
			}
		}
		if (out.length == 1) o[1].f = "" + out[0];
		else console.error("WK1 bad formula parse |" + out.join("|") + "|");
	}
	function parse_cell_3(blob) {
		var o = [
			{
				c: 0,
				r: 0
			},
			{
				t: "n",
				v: 0
			},
			0
		];
		o[0].r = blob.read_shift(2);
		o[3] = blob[blob.l++];
		o[0].c = blob[blob.l++];
		return o;
	}
	function parse_LABEL_16(blob, length) {
		var o = parse_cell_3(blob, length);
		o[1].t = "s";
		o[1].v = blob.read_shift(length - 4, "cstr");
		return o;
	}
	function write_LABEL_16(R, C, wsidx, s) {
		var o = new_buf(6 + s.length);
		o.write_shift(2, R);
		o.write_shift(1, wsidx);
		o.write_shift(1, C);
		o.write_shift(1, 39);
		for (var i = 0; i < s.length; ++i) {
			var cc = s.charCodeAt(i);
			o.write_shift(1, cc >= 128 ? 95 : cc);
		}
		o.write_shift(1, 0);
		return o;
	}
	function parse_NUMBER_18(blob, length) {
		var o = parse_cell_3(blob, length);
		o[1].v = blob.read_shift(2);
		var v = o[1].v >> 1;
		if (o[1].v & 1) switch (v & 7) {
			case 0:
				v = (v >> 3) * 5e3;
				break;
			case 1:
				v = (v >> 3) * 500;
				break;
			case 2:
				v = (v >> 3) / 20;
				break;
			case 3:
				v = (v >> 3) / 200;
				break;
			case 4:
				v = (v >> 3) / 2e3;
				break;
			case 5:
				v = (v >> 3) / 2e4;
				break;
			case 6:
				v = (v >> 3) / 16;
				break;
			case 7: v = (v >> 3) / 64;
		}
		o[1].v = v;
		return o;
	}
	function parse_NUMBER_17(blob, length) {
		var o = parse_cell_3(blob, length);
		var v1 = blob.read_shift(4);
		var v2 = blob.read_shift(4);
		var e = blob.read_shift(2);
		if (e == 65535) {
			if (v1 === 0 && v2 === 3221225472) {
				o[1].t = "e";
				o[1].v = 15;
			} else if (v1 === 0 && v2 === 3489660928) {
				o[1].t = "e";
				o[1].v = 42;
			} else o[1].v = 0;
			return o;
		}
		var s = e & 32768;
		e = (e & 32767) - 16446;
		o[1].v = (1 - s * 2) * (v2 * Math.pow(2, e + 32) + v1 * Math.pow(2, e));
		return o;
	}
	function write_NUMBER_17(R, C, wsidx, v) {
		var o = new_buf(14);
		o.write_shift(2, R);
		o.write_shift(1, wsidx);
		o.write_shift(1, C);
		if (v == 0) {
			o.write_shift(4, 0);
			o.write_shift(4, 0);
			o.write_shift(2, 65535);
			return o;
		}
		var s = 0, e = 0, v1 = 0, v2 = 0;
		if (v < 0) {
			s = 1;
			v = -v;
		}
		e = Math.log2(v) | 0;
		v /= Math.pow(2, e - 31);
		v2 = v >>> 0;
		if ((v2 & 2147483648) == 0) {
			v /= 2;
			++e;
			v2 = v >>> 0;
		}
		v -= v2;
		v2 |= 2147483648;
		v2 >>>= 0;
		v *= Math.pow(2, 32);
		v1 = v >>> 0;
		o.write_shift(4, v1);
		o.write_shift(4, v2);
		e += 16383 + (s ? 32768 : 0);
		o.write_shift(2, e);
		return o;
	}
	function parse_FORMULA_19(blob, length) {
		var o = parse_NUMBER_17(blob, 14);
		blob.l += length - 14;
		return o;
	}
	function parse_NUMBER_25(blob, length) {
		var o = parse_cell_3(blob, length);
		var v1 = blob.read_shift(4);
		o[1].v = v1 >> 6;
		return o;
	}
	function parse_NUMBER_27(blob, length) {
		var o = parse_cell_3(blob, length);
		var v1 = blob.read_shift(8, "f");
		o[1].v = v1;
		return o;
	}
	function parse_FORMULA_28(blob, length) {
		var o = parse_NUMBER_27(blob, 12);
		blob.l += length - 12;
		return o;
	}
	function parse_SHEETNAMECS(blob, length) {
		return blob[blob.l + length - 1] == 0 ? blob.read_shift(length, "cstr") : "";
	}
	function parse_SHEETNAMELP(blob, length) {
		var len = blob[blob.l++];
		if (len > length - 1) len = length - 1;
		var o = "";
		while (o.length < len) o += String.fromCharCode(blob[blob.l++]);
		return o;
	}
	function parse_SHEETINFOQP(blob, length, opts) {
		if (!opts.qpro || length < 21) return;
		var id = blob.read_shift(1);
		blob.l += 17;
		blob.l += 1;
		blob.l += 2;
		return [id, blob.read_shift(length - 21, "cstr")];
	}
	function parse_XFORMAT(blob, length) {
		var o = {}, tgt = blob.l + length;
		while (blob.l < tgt) {
			var dt = blob.read_shift(2);
			if (dt == 14e3) {
				o[dt] = [0, ""];
				o[dt][0] = blob.read_shift(2);
				while (blob[blob.l]) {
					o[dt][1] += String.fromCharCode(blob[blob.l]);
					blob.l++;
				}
				blob.l++;
			}
		}
		return o;
	}
	function write_XFORMAT_SHEETNAME(name, wsidx) {
		var out = new_buf(5 + name.length);
		out.write_shift(2, 14e3);
		out.write_shift(2, wsidx);
		for (var i = 0; i < name.length; ++i) {
			var cc = name.charCodeAt(i);
			out[out.l++] = cc > 127 ? 95 : cc;
		}
		out[out.l++] = 0;
		return out;
	}
	var WK1Enum = {
		0: {
			n: "BOF",
			f: parseuint16
		},
		1: { n: "EOF" },
		2: { n: "CALCMODE" },
		3: { n: "CALCORDER" },
		4: { n: "SPLIT" },
		5: { n: "SYNC" },
		6: {
			n: "RANGE",
			f: parse_RANGE
		},
		7: { n: "WINDOW1" },
		8: { n: "COLW1" },
		9: { n: "WINTWO" },
		10: { n: "COLW2" },
		11: { n: "NAME" },
		12: { n: "BLANK" },
		13: {
			n: "INTEGER",
			f: parse_INTEGER
		},
		14: {
			n: "NUMBER",
			f: parse_NUMBER
		},
		15: {
			n: "LABEL",
			f: parse_LABEL
		},
		16: {
			n: "FORMULA",
			f: parse_FORMULA
		},
		24: { n: "TABLE" },
		25: { n: "ORANGE" },
		26: { n: "PRANGE" },
		27: { n: "SRANGE" },
		28: { n: "FRANGE" },
		29: { n: "KRANGE1" },
		32: { n: "HRANGE" },
		35: { n: "KRANGE2" },
		36: { n: "PROTEC" },
		37: { n: "FOOTER" },
		38: { n: "HEADER" },
		39: { n: "SETUP" },
		40: { n: "MARGINS" },
		41: { n: "LABELFMT" },
		42: { n: "TITLES" },
		43: { n: "SHEETJS" },
		45: { n: "GRAPH" },
		46: { n: "NGRAPH" },
		47: { n: "CALCCOUNT" },
		48: { n: "UNFORMATTED" },
		49: { n: "CURSORW12" },
		50: { n: "WINDOW" },
		51: {
			n: "STRING",
			f: parse_STRING
		},
		55: { n: "PASSWORD" },
		56: { n: "LOCKED" },
		60: { n: "QUERY" },
		61: { n: "QUERYNAME" },
		62: { n: "PRINT" },
		63: { n: "PRINTNAME" },
		64: { n: "GRAPH2" },
		65: { n: "GRAPHNAME" },
		66: { n: "ZOOM" },
		67: { n: "SYMSPLIT" },
		68: { n: "NSROWS" },
		69: { n: "NSCOLS" },
		70: { n: "RULER" },
		71: { n: "NNAME" },
		72: { n: "ACOMM" },
		73: { n: "AMACRO" },
		74: { n: "PARSE" },
		102: { n: "PRANGES??" },
		103: { n: "RRANGES??" },
		104: { n: "FNAME??" },
		105: { n: "MRANGES??" },
		204: {
			n: "SHEETNAMECS",
			f: parse_SHEETNAMECS
		},
		222: {
			n: "SHEETNAMELP",
			f: parse_SHEETNAMELP
		},
		255: {
			n: "BOF",
			f: parseuint16
		},
		21506: {
			n: "WKSNF",
			f: parseuint16
		},
		65535: { n: "" }
	};
	var WK3Enum = {
		0: { n: "BOF" },
		1: { n: "EOF" },
		2: { n: "PASSWORD" },
		3: { n: "CALCSET" },
		4: { n: "WINDOWSET" },
		5: { n: "SHEETCELLPTR" },
		6: { n: "SHEETLAYOUT" },
		7: { n: "COLUMNWIDTH" },
		8: { n: "HIDDENCOLUMN" },
		9: { n: "USERRANGE" },
		10: { n: "SYSTEMRANGE" },
		11: { n: "ZEROFORCE" },
		12: { n: "SORTKEYDIR" },
		13: { n: "FILESEAL" },
		14: { n: "DATAFILLNUMS" },
		15: { n: "PRINTMAIN" },
		16: { n: "PRINTSTRING" },
		17: { n: "GRAPHMAIN" },
		18: { n: "GRAPHSTRING" },
		19: { n: "??" },
		20: { n: "ERRCELL" },
		21: { n: "NACELL" },
		22: {
			n: "LABEL16",
			f: parse_LABEL_16
		},
		23: {
			n: "NUMBER17",
			f: parse_NUMBER_17
		},
		24: {
			n: "NUMBER18",
			f: parse_NUMBER_18
		},
		25: {
			n: "FORMULA19",
			f: parse_FORMULA_19
		},
		26: { n: "FORMULA1A" },
		27: {
			n: "XFORMAT",
			f: parse_XFORMAT
		},
		28: { n: "DTLABELMISC" },
		29: { n: "DTLABELCELL" },
		30: { n: "GRAPHWINDOW" },
		31: { n: "CPA" },
		32: { n: "LPLAUTO" },
		33: { n: "QUERY" },
		34: { n: "HIDDENSHEET" },
		35: { n: "??" },
		37: {
			n: "NUMBER25",
			f: parse_NUMBER_25
		},
		38: { n: "??" },
		39: {
			n: "NUMBER27",
			f: parse_NUMBER_27
		},
		40: {
			n: "FORMULA28",
			f: parse_FORMULA_28
		},
		142: { n: "??" },
		147: { n: "??" },
		150: { n: "??" },
		151: { n: "??" },
		152: { n: "??" },
		153: { n: "??" },
		154: { n: "??" },
		155: { n: "??" },
		156: { n: "??" },
		163: { n: "??" },
		174: { n: "??" },
		175: { n: "??" },
		176: { n: "??" },
		177: { n: "??" },
		184: { n: "??" },
		185: { n: "??" },
		186: { n: "??" },
		187: { n: "??" },
		188: { n: "??" },
		195: { n: "??" },
		201: { n: "??" },
		204: {
			n: "SHEETNAMECS",
			f: parse_SHEETNAMECS
		},
		205: { n: "??" },
		206: { n: "??" },
		207: { n: "??" },
		208: { n: "??" },
		256: { n: "??" },
		259: { n: "??" },
		260: { n: "??" },
		261: { n: "??" },
		262: { n: "??" },
		263: { n: "??" },
		265: { n: "??" },
		266: { n: "??" },
		267: { n: "??" },
		268: { n: "??" },
		270: { n: "??" },
		271: { n: "??" },
		384: { n: "??" },
		389: { n: "??" },
		390: { n: "??" },
		393: { n: "??" },
		396: { n: "??" },
		512: { n: "??" },
		514: { n: "??" },
		513: { n: "??" },
		516: { n: "??" },
		517: { n: "??" },
		640: { n: "??" },
		641: { n: "??" },
		642: { n: "??" },
		643: { n: "??" },
		644: { n: "??" },
		645: { n: "??" },
		646: { n: "??" },
		647: { n: "??" },
		648: { n: "??" },
		658: { n: "??" },
		659: { n: "??" },
		660: { n: "??" },
		661: { n: "??" },
		662: { n: "??" },
		665: { n: "??" },
		666: { n: "??" },
		768: { n: "??" },
		772: { n: "??" },
		1537: {
			n: "SHEETINFOQP",
			f: parse_SHEETINFOQP
		},
		1600: { n: "??" },
		1602: { n: "??" },
		1793: { n: "??" },
		1794: { n: "??" },
		1795: { n: "??" },
		1796: { n: "??" },
		1920: { n: "??" },
		2048: { n: "??" },
		2049: { n: "??" },
		2052: { n: "??" },
		2688: { n: "??" },
		10998: { n: "??" },
		12849: { n: "??" },
		28233: { n: "??" },
		28484: { n: "??" },
		65535: { n: "" }
	};
	var QPWNFTable = {
		5: "dd-mmm-yy",
		6: "dd-mmm",
		7: "mmm-yy",
		8: "mm/dd/yy",
		10: "hh:mm:ss AM/PM",
		11: "hh:mm AM/PM",
		14: "dd-mmm-yyyy",
		15: "mmm-yyyy",
		34: "0.00",
		50: "0.00;[Red]0.00",
		66: "0.00;(0.00)",
		82: "0.00;[Red](0.00)",
		162: "\"$\"#,##0.00;\\(\"$\"#,##0.00\\)",
		288: "0%",
		304: "0E+00",
		320: "# ?/?"
	};
	function parse_qpw_str(p) {
		var cch = p.read_shift(2);
		var flags = p.read_shift(1);
		if (flags != 0) throw "unsupported QPW string type " + flags.toString(16);
		return p.read_shift(cch, "sbcs-cont");
	}
	function qpw_to_workbook_buf(d, opts) {
		prep_blob(d, 0);
		var o = opts || {};
		if (DENSE != null && o.dense == null) o.dense = DENSE;
		var s = {};
		if (o.dense) s["!data"] = [];
		var SST = [], sname = "";
		var range = {
			s: {
				r: -1,
				c: -1
			},
			e: {
				r: -1,
				c: -1
			}
		};
		var cnt = 0, type = 0, C = 0, R = 0;
		var wb = {
			SheetNames: [],
			Sheets: sheet_map_new()
		};
		var FMTS = [];
		outer: while (d.l < d.length) {
			var RT = d.read_shift(2), length = d.read_shift(2);
			var p = d.slice(d.l, d.l + length);
			prep_blob(p, 0);
			switch (RT) {
				case 1:
					if (p.read_shift(4) != 962023505) throw "Bad QPW9 BOF!";
					break;
				case 2: break outer;
				case 8: break;
				case 10:
					var fcnt = p.read_shift(4);
					var step = (p.length - p.l) / fcnt | 0;
					for (var ifmt = 0; ifmt < fcnt; ++ifmt) {
						var end = p.l + step;
						var fmt = {};
						p.l += 2;
						fmt.numFmtId = p.read_shift(2);
						if (QPWNFTable[fmt.numFmtId]) fmt.z = QPWNFTable[fmt.numFmtId];
						p.l = end;
						FMTS.push(fmt);
					}
					break;
				case 1025: break;
				case 1026: break;
				case 1031:
					p.l += 12;
					while (p.l < p.length) {
						cnt = p.read_shift(2);
						type = p.read_shift(1);
						SST.push(p.read_shift(cnt, "cstr"));
					}
					break;
				case 1032: break;
				case 1537:
					var sidx = p.read_shift(2);
					s = {};
					if (o.dense) s["!data"] = [];
					range.s.c = p.read_shift(2);
					range.e.c = p.read_shift(2);
					range.s.r = p.read_shift(4);
					range.e.r = p.read_shift(4);
					p.l += 4;
					if (p.l + 2 < p.length) {
						cnt = p.read_shift(2);
						type = p.read_shift(1);
						sname = cnt == 0 ? "" : p.read_shift(cnt, "cstr");
					}
					if (!sname) sname = encode_col(sidx);
					break;
				case 1538:
					if (range.s.c > 255 || range.s.r > 999999) break;
					if (range.e.c < range.s.c) range.e.c = range.s.c;
					if (range.e.r < range.s.r) range.e.r = range.s.r;
					s["!ref"] = encode_range(range);
					book_append_sheet(wb, s, sname);
					break;
				case 2561:
					C = p.read_shift(2);
					if (range.e.c < C) range.e.c = C;
					if (range.s.c > C) range.s.c = C;
					R = p.read_shift(4);
					if (range.s.r > R) range.s.r = R;
					R = p.read_shift(4);
					if (range.e.r < R) range.e.r = R;
					break;
				case 3073:
					R = p.read_shift(4), cnt = p.read_shift(4);
					if (range.s.r > R) range.s.r = R;
					if (range.e.r < R + cnt - 1) range.e.r = R + cnt - 1;
					var CC = encode_col(C);
					while (p.l < p.length) {
						var cell = { t: "z" };
						var flags = p.read_shift(1), fmtidx = -1;
						if (flags & 128) fmtidx = p.read_shift(2);
						var mul = flags & 64 ? p.read_shift(2) - 1 : 0;
						switch (flags & 31) {
							case 0: break;
							case 1: break;
							case 2:
								cell = {
									t: "n",
									v: p.read_shift(2)
								};
								break;
							case 3:
								cell = {
									t: "n",
									v: p.read_shift(2, "i")
								};
								break;
							case 4:
								cell = {
									t: "n",
									v: parse_RkNumber(p)
								};
								break;
							case 5:
								cell = {
									t: "n",
									v: p.read_shift(8, "f")
								};
								break;
							case 7:
								cell = {
									t: "s",
									v: SST[type = p.read_shift(4) - 1]
								};
								break;
							case 8:
								cell = {
									t: "n",
									v: p.read_shift(8, "f")
								};
								p.l += 2;
								p.l += 4;
								if (isNaN(cell.v)) cell = {
									t: "e",
									v: 15
								};
								break;
							default: throw "Unrecognized QPW cell type " + (flags & 31);
						}
						if (fmtidx != -1 && (FMTS[fmtidx - 1] || {}).z) cell.z = FMTS[fmtidx - 1].z;
						var delta = 0;
						if (flags & 32) switch (flags & 31) {
							case 2:
								delta = p.read_shift(2);
								break;
							case 3:
								delta = p.read_shift(2, "i");
								break;
							case 7:
								delta = p.read_shift(2);
								break;
							default: throw "Unsupported delta for QPW cell type " + (flags & 31);
						}
						if (!(!o.sheetStubs && cell.t == "z")) {
							var newcell = dup(cell);
							if (cell.t == "n" && cell.z && fmt_is_date(cell.z) && o.cellDates) {
								newcell.v = numdate(cell.v);
								newcell.t = typeof newcell.v == "number" ? "n" : "d";
							}
							if (s["!data"] != null) {
								if (!s["!data"][R]) s["!data"][R] = [];
								s["!data"][R][C] = newcell;
							} else s[CC + encode_row(R)] = newcell;
						}
						++R;
						--cnt;
						while (mul-- > 0 && cnt >= 0) {
							if (flags & 32) switch (flags & 31) {
								case 2:
									cell = {
										t: "n",
										v: cell.v + delta & 65535
									};
									break;
								case 3:
									cell = {
										t: "n",
										v: cell.v + delta & 65535
									};
									if (cell.v > 32767) cell.v -= 65536;
									break;
								case 7:
									cell = {
										t: "s",
										v: SST[type = type + delta >>> 0]
									};
									break;
								default: throw "Cannot apply delta for QPW cell type " + (flags & 31);
							}
							else switch (flags & 31) {
								case 1:
									cell = { t: "z" };
									break;
								case 2:
									cell = {
										t: "n",
										v: p.read_shift(2)
									};
									break;
								case 7:
									cell = {
										t: "s",
										v: SST[type = p.read_shift(4) - 1]
									};
									break;
								default: throw "Cannot apply repeat for QPW cell type " + (flags & 31);
							}
							if (fmtidx != -1);
							if (!(!o.sheetStubs && cell.t == "z")) if (s["!data"] != null) {
								if (!s["!data"][R]) s["!data"][R] = [];
								s["!data"][R][C] = cell;
							} else s[CC + encode_row(R)] = cell;
							++R;
							--cnt;
						}
					}
					break;
				case 3074:
					C = p.read_shift(2);
					R = p.read_shift(4);
					var str = parse_qpw_str(p);
					if (s["!data"] != null) {
						if (!s["!data"][R]) s["!data"][R] = [];
						s["!data"][R][C] = {
							t: "s",
							v: str
						};
					} else s[encode_col(C) + encode_row(R)] = {
						t: "s",
						v: str
					};
			}
			d.l += length;
		}
		return wb;
	}
	return {
		sheet_to_wk1,
		book_to_wk3,
		to_workbook: lotus_to_workbook
	};
})();
function parse_rpr(rpr) {
	var font = {}, m = rpr.match(tagregex), i = 0;
	var pass = false;
	if (m) for (; i != m.length; ++i) {
		var y = parsexmltag(m[i]);
		switch (y[0].replace(/<\w*:/g, "<")) {
			case "<condense": break;
			case "<extend": break;
			case "<shadow": if (!y.val) break;
			case "<shadow>":
			case "<shadow/>":
				font.shadow = 1;
				break;
			case "</shadow>": break;
			case "<charset":
				if (y.val == "1") break;
				font.cp = CS2CP[parseInt(y.val, 10)];
				break;
			case "<outline": if (!y.val) break;
			case "<outline>":
			case "<outline/>":
				font.outline = 1;
				break;
			case "</outline>": break;
			case "<rFont":
				font.name = y.val;
				break;
			case "<sz":
				font.sz = y.val;
				break;
			case "<strike": if (!y.val) break;
			case "<strike>":
			case "<strike/>":
				font.strike = 1;
				break;
			case "</strike>": break;
			case "<u":
				if (!y.val) break;
				switch (y.val) {
					case "double":
						font.uval = "double";
						break;
					case "singleAccounting":
						font.uval = "single-accounting";
						break;
					case "doubleAccounting": font.uval = "double-accounting";
				}
			case "<u>":
			case "<u/>":
				font.u = 1;
				break;
			case "</u>": break;
			case "<b": if (y.val == "0") break;
			case "<b>":
			case "<b/>":
				font.b = 1;
				break;
			case "</b>": break;
			case "<i": if (y.val == "0") break;
			case "<i>":
			case "<i/>":
				font.i = 1;
				break;
			case "</i>": break;
			case "<color":
				if (y.rgb) font.color = y.rgb.slice(2, 8);
				break;
			case "<color>":
			case "<color/>":
			case "</color>": break;
			case "<family":
				font.family = y.val;
				break;
			case "<family>":
			case "<family/>":
			case "</family>": break;
			case "<vertAlign":
				font.valign = y.val;
				break;
			case "<vertAlign>":
			case "<vertAlign/>":
			case "</vertAlign>": break;
			case "<scheme": break;
			case "<scheme>":
			case "<scheme/>":
			case "</scheme>": break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (y[0].charCodeAt(1) !== 47 && !pass) throw new Error("Unrecognized rich format " + y[0]);
		}
	}
	return font;
}
var parse_rs = /*#__PURE__*/ (function() {
	function parse_r(r) {
		var t = str_match_xml_ns(r, "t");
		if (!t) return {
			t: "s",
			v: ""
		};
		var o = {
			t: "s",
			v: unescapexml(t[1])
		};
		var rpr = str_match_xml_ns(r, "rPr");
		if (rpr) o.s = parse_rpr(rpr[1]);
		return o;
	}
	var rregex = /<(?:\w+:)?r>/g, rend = /<\/(?:\w+:)?r>/;
	return function parse_rs(rs) {
		return rs.replace(rregex, "").split(rend).map(parse_r).filter(function(r) {
			return r.v;
		});
	};
})();
var rs_to_html = /*#__PURE__*/ (function parse_rs_factory() {
	function parse_rpr2(font, intro, outro) {
		var style = [];
		if (font.u) style.push("text-decoration: underline;");
		if (font.uval && /^(?:single|double|single-accounting|double-accounting)$/.test(font.uval)) style.push("text-underline-style:" + font.uval + ";");
		var sz = +font.sz;
		if (isFinite(sz) && sz > 0) style.push("font-size:" + Math.min(sz, 409) + "pt;");
		if (font.outline) style.push("text-effect: outline;");
		if (font.shadow) style.push("text-shadow: auto;");
		intro.push("<span style=\"" + style.join("") + "\">");
		if (font.b) {
			intro.push("<b>");
			outro.push("</b>");
		}
		if (font.i) {
			intro.push("<i>");
			outro.push("</i>");
		}
		if (font.strike) {
			intro.push("<s>");
			outro.push("</s>");
		}
		var align = font.valign || "";
		if (align == "superscript" || align == "super") align = "sup";
		else if (align == "subscript") align = "sub";
		if (align != "") {
			intro.push("<" + align + ">");
			outro.push("</" + align + ">");
		}
		outro.push("</span>");
		return font;
	}
	function r_to_html(r) {
		var terms = [
			[],
			r.v,
			[]
		];
		if (!r.v) return "";
		if (r.s) parse_rpr2(r.s, terms[0], terms[2]);
		return terms[0].join("") + escapehtml(terms[1]) + terms[2].join("");
	}
	return function parse_rs(rs) {
		return rs.map(r_to_html).join("");
	};
})();
var sitregex = /<(?:\w+:)?t\b[^<>]*>([^<]*)<\/(?:\w+:)?t>/g;
var sirregex = /<(?:\w+:)?r\b[^<>]*>/;
function parse_si(x, opts) {
	var html = opts ? opts.cellHTML : true;
	var z = {};
	if (!x) return { t: "" };
	if (x.match(/^\s*<(?:\w+:)?t[^>]*>/)) {
		z.t = unescapexml(utf8read(x.slice(x.indexOf(">") + 1).split(/<\/(?:\w+:)?t>/)[0] || ""), true);
		z.r = utf8read(x);
		if (html) z.h = escapehtml(z.t);
	} else if (x.match(sirregex)) {
		z.r = utf8read(x);
		z.t = unescapexml(utf8read((str_remove_xml_ns_g(x, "rPh").match(sitregex) || []).join("").replace(tagregex, "")), true);
		if (html) z.h = rs_to_html(parse_rs(z.r));
	}
	return z;
}
var sstr1 = /<(?:\w+:)?(?:si|sstItem)>/g;
var sstr2 = /<\/(?:\w+:)?(?:si|sstItem)>/;
function parse_sst_xml(data, opts) {
	var s = [], ss = "";
	if (!data) return s;
	var sst = str_match_xml_ns(data, "sst");
	if (sst) {
		ss = sst[1].replace(sstr1, "").split(sstr2);
		for (var i = 0; i != ss.length; ++i) {
			var o = parse_si(ss[i].trim(), opts);
			if (o != null) s[s.length] = o;
		}
		sst = parsexmltag(sst[0].slice(0, sst[0].indexOf(">")));
		s.Count = sst.count;
		s.Unique = sst.uniqueCount;
	}
	return s;
}
function parse_BrtBeginSst(data) {
	return [data.read_shift(4), data.read_shift(4)];
}
function parse_sst_bin(data, opts) {
	var s = [];
	var pass = false;
	recordhopper(data, function hopper_sst(val, R, RT) {
		switch (RT) {
			case 159:
				s.Count = val[0];
				s.Unique = val[1];
				break;
			case 19:
				s.push(val);
				break;
			case 160: return true;
			case 35:
				pass = true;
				break;
			case 36:
				pass = false;
				break;
			default:
				if (R.T) {}
				if (!pass || opts.WTF) throw new Error("Unexpected record 0x" + RT.toString(16));
		}
	});
	return s;
}
function _JS2ANSI(str) {
	if (typeof $cptable !== "undefined") return $cptable.utils.encode(current_ansi, str);
	var o = [], oo = str.split("");
	for (var i = 0; i < oo.length; ++i) o[i] = oo[i].charCodeAt(0);
	return o;
}
function parse_CRYPTOVersion(blob, length) {
	var o = {};
	o.Major = blob.read_shift(2);
	o.Minor = blob.read_shift(2);
	if (length >= 4) blob.l += length - 4;
	return o;
}
function parse_DataSpaceVersionInfo(blob) {
	var o = {};
	o.id = blob.read_shift(0, "lpp4");
	o.R = parse_CRYPTOVersion(blob, 4);
	o.U = parse_CRYPTOVersion(blob, 4);
	o.W = parse_CRYPTOVersion(blob, 4);
	return o;
}
function parse_DataSpaceMapEntry(blob) {
	var len = blob.read_shift(4);
	var end = blob.l + len - 4;
	var o = {};
	var cnt = blob.read_shift(4);
	var comps = [];
	while (cnt-- > 0) comps.push({
		t: blob.read_shift(4),
		v: blob.read_shift(0, "lpp4")
	});
	o.name = blob.read_shift(0, "lpp4");
	o.comps = comps;
	if (blob.l != end) throw new Error("Bad DataSpaceMapEntry: " + blob.l + " != " + end);
	return o;
}
function parse_DataSpaceMap(blob) {
	var o = [];
	blob.l += 4;
	var cnt = blob.read_shift(4);
	while (cnt-- > 0) o.push(parse_DataSpaceMapEntry(blob));
	return o;
}
function parse_DataSpaceDefinition(blob) {
	var o = [];
	blob.l += 4;
	var cnt = blob.read_shift(4);
	while (cnt-- > 0) o.push(blob.read_shift(0, "lpp4"));
	return o;
}
function parse_TransformInfoHeader(blob) {
	var o = {};
	blob.read_shift(4);
	blob.l += 4;
	o.id = blob.read_shift(0, "lpp4");
	o.name = blob.read_shift(0, "lpp4");
	o.R = parse_CRYPTOVersion(blob, 4);
	o.U = parse_CRYPTOVersion(blob, 4);
	o.W = parse_CRYPTOVersion(blob, 4);
	return o;
}
function parse_Primary(blob) {
	var hdr = parse_TransformInfoHeader(blob);
	hdr.ename = blob.read_shift(0, "8lpp4");
	hdr.blksz = blob.read_shift(4);
	hdr.cmode = blob.read_shift(4);
	if (blob.read_shift(4) != 4) throw new Error("Bad !Primary record");
	return hdr;
}
function parse_EncryptionHeader(blob, length) {
	var tgt = blob.l + length;
	var o = {};
	o.Flags = blob.read_shift(4) & 63;
	blob.l += 4;
	o.AlgID = blob.read_shift(4);
	var valid = false;
	switch (o.AlgID) {
		case 26126:
		case 26127:
		case 26128:
			valid = o.Flags == 36;
			break;
		case 26625:
			valid = o.Flags == 4;
			break;
		case 0:
			valid = o.Flags == 16 || o.Flags == 4 || o.Flags == 36;
			break;
		default: throw "Unrecognized encryption algorithm: " + o.AlgID;
	}
	if (!valid) throw new Error("Encryption Flags/AlgID mismatch");
	o.AlgIDHash = blob.read_shift(4);
	o.KeySize = blob.read_shift(4);
	o.ProviderType = blob.read_shift(4);
	blob.l += 8;
	o.CSPName = blob.read_shift(tgt - blob.l >> 1, "utf16le");
	blob.l = tgt;
	return o;
}
function parse_EncryptionVerifier(blob, length) {
	var o = {}, tgt = blob.l + length;
	blob.l += 4;
	o.Salt = blob.slice(blob.l, blob.l + 16);
	blob.l += 16;
	o.Verifier = blob.slice(blob.l, blob.l + 16);
	blob.l += 16;
	blob.read_shift(4);
	o.VerifierHash = blob.slice(blob.l, tgt);
	blob.l = tgt;
	return o;
}
function parse_EncryptionInfo(blob) {
	var vers = parse_CRYPTOVersion(blob);
	switch (vers.Minor) {
		case 2: return [vers.Minor, parse_EncInfoStd(blob, vers)];
		case 3: return [vers.Minor, parse_EncInfoExt(blob, vers)];
		case 4: return [vers.Minor, parse_EncInfoAgl(blob, vers)];
	}
	throw new Error("ECMA-376 Encrypted file unrecognized Version: " + vers.Minor);
}
function parse_EncInfoStd(blob) {
	if ((blob.read_shift(4) & 63) != 36) throw new Error("EncryptionInfo mismatch");
	return {
		t: "Std",
		h: parse_EncryptionHeader(blob, blob.read_shift(4)),
		v: parse_EncryptionVerifier(blob, blob.length - blob.l)
	};
}
function parse_EncInfoExt() {
	throw new Error("File is password-protected: ECMA-376 Extensible");
}
function parse_EncInfoAgl(blob) {
	var KeyData = [
		"saltSize",
		"blockSize",
		"keyBits",
		"hashSize",
		"cipherAlgorithm",
		"cipherChaining",
		"hashAlgorithm",
		"saltValue"
	];
	blob.l += 4;
	var xml = blob.read_shift(blob.length - blob.l, "utf8");
	var o = {};
	xml.replace(tagregex, function xml_agile(x) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<?xml": break;
			case "<encryption":
			case "</encryption>": break;
			case "<keyData":
				KeyData.forEach(function(k) {
					o[k] = y[k];
				});
				break;
			case "<dataIntegrity":
				o.encryptedHmacKey = y.encryptedHmacKey;
				o.encryptedHmacValue = y.encryptedHmacValue;
				break;
			case "<keyEncryptors>":
			case "<keyEncryptors":
				o.encs = [];
				break;
			case "</keyEncryptors>": break;
			case "<keyEncryptor":
				o.uri = y.uri;
				break;
			case "</keyEncryptor>": break;
			case "<encryptedKey":
				o.encs.push(y);
				break;
			default: throw y[0];
		}
	});
	return o;
}
function parse_RC4CryptoHeader(blob, length) {
	var o = {};
	var vers = o.EncryptionVersionInfo = parse_CRYPTOVersion(blob, 4);
	length -= 4;
	if (vers.Minor != 2) throw new Error("unrecognized minor version code: " + vers.Minor);
	if (vers.Major > 4 || vers.Major < 2) throw new Error("unrecognized major version code: " + vers.Major);
	o.Flags = blob.read_shift(4);
	length -= 4;
	var sz = blob.read_shift(4);
	length -= 4;
	o.EncryptionHeader = parse_EncryptionHeader(blob, sz);
	length -= sz;
	o.EncryptionVerifier = parse_EncryptionVerifier(blob, length);
	return o;
}
function parse_RC4Header(blob) {
	var o = {};
	var vers = o.EncryptionVersionInfo = parse_CRYPTOVersion(blob, 4);
	if (vers.Major != 1 || vers.Minor != 1) throw "unrecognized version code " + vers.Major + " : " + vers.Minor;
	o.Salt = blob.read_shift(16);
	o.EncryptedVerifier = blob.read_shift(16);
	o.EncryptedVerifierHash = blob.read_shift(16);
	return o;
}
function crypto_CreatePasswordVerifier_Method1(Password) {
	var Verifier = 0, PasswordArray;
	var PasswordDecoded = _JS2ANSI(Password);
	var len = PasswordDecoded.length + 1, i, PasswordByte;
	var Intermediate1, Intermediate2, Intermediate3;
	PasswordArray = new_raw_buf(len);
	PasswordArray[0] = PasswordDecoded.length;
	for (i = 1; i != len; ++i) PasswordArray[i] = PasswordDecoded[i - 1];
	for (i = len - 1; i >= 0; --i) {
		PasswordByte = PasswordArray[i];
		Intermediate1 = (Verifier & 16384) === 0 ? 0 : 1;
		Intermediate2 = Verifier << 1 & 32767;
		Intermediate3 = Intermediate1 | Intermediate2;
		Verifier = Intermediate3 ^ PasswordByte;
	}
	return Verifier ^ 52811;
}
var crypto_CreateXorArray_Method1 = /*#__PURE__*/ (function() {
	var PadArray = [
		187,
		255,
		255,
		186,
		255,
		255,
		185,
		128,
		0,
		190,
		15,
		0,
		191,
		15,
		0
	];
	var InitialCode = [
		57840,
		7439,
		52380,
		33984,
		4364,
		3600,
		61902,
		12606,
		6258,
		57657,
		54287,
		34041,
		10252,
		43370,
		20163
	];
	var XorMatrix = [
		44796,
		19929,
		39858,
		10053,
		20106,
		40212,
		10761,
		31585,
		63170,
		64933,
		60267,
		50935,
		40399,
		11199,
		17763,
		35526,
		1453,
		2906,
		5812,
		11624,
		23248,
		885,
		1770,
		3540,
		7080,
		14160,
		28320,
		56640,
		55369,
		41139,
		20807,
		41614,
		21821,
		43642,
		17621,
		28485,
		56970,
		44341,
		19019,
		38038,
		14605,
		29210,
		60195,
		50791,
		40175,
		10751,
		21502,
		43004,
		24537,
		18387,
		36774,
		3949,
		7898,
		15796,
		31592,
		63184,
		47201,
		24803,
		49606,
		37805,
		14203,
		28406,
		56812,
		17824,
		35648,
		1697,
		3394,
		6788,
		13576,
		27152,
		43601,
		17539,
		35078,
		557,
		1114,
		2228,
		4456,
		30388,
		60776,
		51953,
		34243,
		7079,
		14158,
		28316,
		14128,
		28256,
		56512,
		43425,
		17251,
		34502,
		7597,
		13105,
		26210,
		52420,
		35241,
		883,
		1766,
		3532,
		4129,
		8258,
		16516,
		33032,
		4657,
		9314,
		18628
	];
	var Ror = function(Byte) {
		return (Byte / 2 | Byte * 128) & 255;
	};
	var XorRor = function(byte1, byte2) {
		return Ror(byte1 ^ byte2);
	};
	var CreateXorKey_Method1 = function(Password) {
		var XorKey = InitialCode[Password.length - 1];
		var CurrentElement = 104;
		for (var i = Password.length - 1; i >= 0; --i) {
			var Char = Password[i];
			for (var j = 0; j != 7; ++j) {
				if (Char & 64) XorKey ^= XorMatrix[CurrentElement];
				Char *= 2;
				--CurrentElement;
			}
		}
		return XorKey;
	};
	return function(password) {
		var Password = _JS2ANSI(password);
		var XorKey = CreateXorKey_Method1(Password);
		var Index = Password.length;
		var ObfuscationArray = new_raw_buf(16);
		for (var i = 0; i != 16; ++i) ObfuscationArray[i] = 0;
		var Temp, PasswordLastChar, PadIndex;
		if ((Index & 1) === 1) {
			Temp = XorKey >> 8;
			ObfuscationArray[Index] = XorRor(PadArray[0], Temp);
			--Index;
			Temp = XorKey & 255;
			PasswordLastChar = Password[Password.length - 1];
			ObfuscationArray[Index] = XorRor(PasswordLastChar, Temp);
		}
		while (Index > 0) {
			--Index;
			Temp = XorKey >> 8;
			ObfuscationArray[Index] = XorRor(Password[Index], Temp);
			--Index;
			Temp = XorKey & 255;
			ObfuscationArray[Index] = XorRor(Password[Index], Temp);
		}
		Index = 15;
		PadIndex = 15 - Password.length;
		while (PadIndex > 0) {
			Temp = XorKey >> 8;
			ObfuscationArray[Index] = XorRor(PadArray[PadIndex], Temp);
			--Index;
			--PadIndex;
			Temp = XorKey & 255;
			ObfuscationArray[Index] = XorRor(Password[Index], Temp);
			--Index;
			--PadIndex;
		}
		return ObfuscationArray;
	};
})();
var crypto_DecryptData_Method1 = function(password, Data, XorArrayIndex, XorArray, O) {
	if (!O) O = Data;
	if (!XorArray) XorArray = crypto_CreateXorArray_Method1(password);
	var Index, Value;
	for (Index = 0; Index != Data.length; ++Index) {
		Value = Data[Index];
		Value ^= XorArray[XorArrayIndex];
		Value = (Value >> 5 | Value << 3) & 255;
		O[Index] = Value;
		++XorArrayIndex;
	}
	return [
		O,
		XorArrayIndex,
		XorArray
	];
};
var crypto_MakeXorDecryptor = function(password) {
	var XorArrayIndex = 0, XorArray = crypto_CreateXorArray_Method1(password);
	return function(Data) {
		var O = crypto_DecryptData_Method1("", Data, XorArrayIndex, XorArray);
		XorArrayIndex = O[1];
		return O[0];
	};
};
function parse_XORObfuscation(blob, length, opts, out) {
	var o = {
		key: parseuint16(blob),
		verificationBytes: parseuint16(blob)
	};
	if (opts.password) o.verifier = crypto_CreatePasswordVerifier_Method1(opts.password);
	out.valid = o.verificationBytes === o.verifier;
	if (out.valid) out.insitu = crypto_MakeXorDecryptor(opts.password);
	return o;
}
function parse_FilePassHeader(blob, length, oo) {
	var o = oo || {};
	o.Info = blob.read_shift(2);
	blob.l -= 2;
	if (o.Info === 1) o.Data = parse_RC4Header(blob, length);
	else o.Data = parse_RC4CryptoHeader(blob, length);
	return o;
}
function parse_FilePass(blob, length, opts) {
	var o = { Type: opts.biff >= 8 ? blob.read_shift(2) : 0 };
	if (o.Type) parse_FilePassHeader(blob, length - 2, o);
	else parse_XORObfuscation(blob, opts.biff >= 8 ? length : length - 2, opts, o);
	return o;
}
function rtf_to_sheet(d, opts) {
	switch (opts.type) {
		case "base64": return rtf_to_sheet_str(Base64_decode(d), opts);
		case "binary": return rtf_to_sheet_str(d, opts);
		case "buffer": return rtf_to_sheet_str(has_buf && Buffer.isBuffer(d) ? d.toString("binary") : a2s(d), opts);
		case "array": return rtf_to_sheet_str(cc2str(d), opts);
	}
	throw new Error("Unrecognized type " + opts.type);
}
function rtf_to_sheet_str(str, opts) {
	var o = opts || {};
	var ws = {};
	var dense = o.dense;
	if (dense) ws["!data"] = [];
	var rows = str_match_ng(str, "\\trowd", "\\row");
	if (!rows) throw new Error("RTF missing table");
	var range = {
		s: {
			c: 0,
			r: 0
		},
		e: {
			c: 0,
			r: rows.length - 1
		}
	};
	var row = [];
	rows.forEach(function(rowtf, R) {
		if (dense) row = ws["!data"][R] = [];
		var rtfre = /\\[\w\-]+\b/g;
		var last_index = 0;
		var res;
		var C = -1;
		var payload = [];
		while ((res = rtfre.exec(rowtf)) != null) {
			var data = rowtf.slice(last_index, rtfre.lastIndex - res[0].length);
			if (data.charCodeAt(0) == 32) data = data.slice(1);
			if (data.length) payload.push(data);
			switch (res[0]) {
				case "\\cell":
					++C;
					if (payload.length) {
						var cell = {
							v: payload.join(""),
							t: "s"
						};
						if (cell.v == "TRUE" || cell.v == "FALSE") {
							cell.v = cell.v == "TRUE";
							cell.t = "b";
						} else if (!isNaN(fuzzynum(cell.v))) {
							cell.t = "n";
							if (o.cellText !== false) cell.w = cell.v;
							cell.v = fuzzynum(cell.v);
						} else if (RBErr[cell.v] != null) {
							cell.t = "e";
							cell.w = cell.v;
							cell.v = RBErr[cell.v];
						}
						if (dense) row[C] = cell;
						else ws[encode_cell({
							r: R,
							c: C
						})] = cell;
					}
					payload = [];
					break;
				case "\\par": payload.push("\n");
			}
			last_index = rtfre.lastIndex;
		}
		if (C > range.e.c) range.e.c = C;
	});
	ws["!ref"] = encode_range(range);
	return ws;
}
function rtf_to_workbook(d, opts) {
	var wb = sheet_to_workbook(rtf_to_sheet(d, opts), opts);
	wb.bookType = "rtf";
	return wb;
}
function hex2RGB(h) {
	var o = h.slice(h[0] === "#" ? 1 : 0).slice(0, 6);
	return [
		parseInt(o.slice(0, 2), 16),
		parseInt(o.slice(2, 4), 16),
		parseInt(o.slice(4, 6), 16)
	];
}
function rgb2Hex(rgb) {
	for (var i = 0, o = 1; i != 3; ++i) o = o * 256 + (rgb[i] > 255 ? 255 : rgb[i] < 0 ? 0 : rgb[i]);
	return o.toString(16).toUpperCase().slice(1);
}
function rgb2HSL(rgb) {
	var R = rgb[0] / 255, G = rgb[1] / 255, B = rgb[2] / 255;
	var M = Math.max(R, G, B), m = Math.min(R, G, B), C = M - m;
	if (C === 0) return [
		0,
		0,
		R
	];
	var H6 = 0, S = 0, L2 = M + m;
	S = C / (L2 > 1 ? 2 - L2 : L2);
	switch (M) {
		case R:
			H6 = ((G - B) / C + 6) % 6;
			break;
		case G:
			H6 = (B - R) / C + 2;
			break;
		case B: H6 = (R - G) / C + 4;
	}
	return [
		H6 / 6,
		S,
		L2 / 2
	];
}
function hsl2RGB(hsl) {
	var H = hsl[0], S = hsl[1], L = hsl[2];
	var C = S * 2 * (L < .5 ? L : 1 - L), m = L - C / 2;
	var rgb = [
		m,
		m,
		m
	], h6 = 6 * H;
	var X;
	if (S !== 0) switch (h6 | 0) {
		case 0:
		case 6:
			X = C * h6;
			rgb[0] += C;
			rgb[1] += X;
			break;
		case 1:
			X = C * (2 - h6);
			rgb[0] += X;
			rgb[1] += C;
			break;
		case 2:
			X = C * (h6 - 2);
			rgb[1] += C;
			rgb[2] += X;
			break;
		case 3:
			X = C * (4 - h6);
			rgb[1] += X;
			rgb[2] += C;
			break;
		case 4:
			X = C * (h6 - 4);
			rgb[2] += C;
			rgb[0] += X;
			break;
		case 5:
			X = C * (6 - h6);
			rgb[2] += X;
			rgb[0] += C;
			break;
	}
	for (var i = 0; i != 3; ++i) rgb[i] = Math.round(rgb[i] * 255);
	return rgb;
}
function rgb_tint(hex, tint) {
	if (tint === 0) return hex;
	var hsl = rgb2HSL(hex2RGB(hex));
	if (tint < 0) hsl[2] = hsl[2] * (1 + tint);
	else hsl[2] = 1 - (1 - hsl[2]) * (1 - tint);
	return rgb2Hex(hsl2RGB(hsl));
}
function style_color_from_attrs(y, themes) {
	var o = {};
	if (y == null) return o;
	if (y.auto != null) o.auto = parsexmlbool(y.auto);
	if (y.rgb != null) o.rgb = y.rgb.slice(-6).toUpperCase();
	if (y.indexed != null) {
		o.indexed = parseInt(y.indexed, 10);
		o.index = o.indexed;
		var icv = XLSIcv[o.indexed];
		if (o.indexed == 81) icv = XLSIcv[1];
		if (!icv) icv = XLSIcv[1];
		if (icv) o.rgb = rgb2Hex(icv);
	}
	if (y.theme != null) {
		o.theme = parseInt(y.theme, 10);
		if (y.tint != null) o.tint = parseFloat(y.tint);
		if (themes && themes.themeElements && themes.themeElements.clrScheme && themes.themeElements.clrScheme[o.theme]) {
			o.raw_rgb = themes.themeElements.clrScheme[o.theme].rgb;
			o.rgb = rgb_tint(o.raw_rgb, o.tint || 0);
		}
	}
	if (y.tint != null && o.tint == null) o.tint = parseFloat(y.tint);
	return o;
}
function resolve_style_color(color, themes) {
	if (!color) return color;
	var o = dup(color);
	if (o.rgb) o.rgb = ("" + o.rgb).slice(-6).toUpperCase();
	if (o.indexed != null && !o.rgb) {
		var icv = XLSIcv[o.indexed];
		if (o.indexed == 81) icv = XLSIcv[1];
		if (!icv) icv = XLSIcv[1];
		if (icv) o.rgb = rgb2Hex(icv);
	}
	if (o.index != null && o.indexed == null) o.indexed = o.index;
	if (o.theme != null && themes && themes.themeElements && themes.themeElements.clrScheme && themes.themeElements.clrScheme[o.theme]) {
		o.raw_rgb = themes.themeElements.clrScheme[o.theme].rgb;
		o.rgb = rgb_tint(o.raw_rgb, o.tint || 0);
	}
	return o;
}
function resolve_style_obj_color(obj, themes) {
	if (!obj) return obj;
	var o = dup(obj);
	if (o.color) o.color = resolve_style_color(o.color, themes);
	if (o.fgColor) o.fgColor = resolve_style_color(o.fgColor, themes);
	if (o.bgColor) o.bgColor = resolve_style_color(o.bgColor, themes);
	[
		"left",
		"right",
		"top",
		"bottom",
		"diagonal",
		"horizontal",
		"vertical",
		"start",
		"end"
	].forEach(function(k) {
		if (o[k] && o[k].color) o[k].color = resolve_style_color(o[k].color, themes);
	});
	if (o.gradientFill && o.gradientFill.stops) o.gradientFill.stops.forEach(function(stop) {
		if (stop.color) stop.color = resolve_style_color(stop.color, themes);
	});
	return o;
}
var DEF_MDW = 7;
var MDW = DEF_MDW;
function width2px(width) {
	return Math.floor((width + Math.round(128 / MDW) / 256) * MDW);
}
function px2char(px) {
	return Math.floor((px - 5) / MDW * 100 + .5) / 100;
}
function char2width(chr) {
	return Math.round((chr * MDW + 5) / MDW * 256) / 256;
}
function process_col(coll) {
	if (coll.width) {
		coll.wpx = width2px(coll.width);
		coll.wch = px2char(coll.wpx);
		coll.MDW = MDW;
	} else if (coll.wpx) {
		coll.wch = px2char(coll.wpx);
		coll.width = char2width(coll.wch);
		coll.MDW = MDW;
	} else if (typeof coll.wch == "number") {
		coll.width = char2width(coll.wch);
		coll.wpx = width2px(coll.width);
		coll.MDW = MDW;
	}
	if (coll.customWidth) delete coll.customWidth;
}
var XLSX_COL_WIDTH_MAX = 255;
var XLSX_COL_WIDTH_PADDING = 5;
function clamp_col_width(width) {
	return width > XLSX_COL_WIDTH_MAX ? XLSX_COL_WIDTH_MAX : width < 0 ? 0 : width;
}
function px2col(px) {
	return clamp_col_width(char2width(px2char(Math.max(0, px))));
}
function col2px(col) {
	if (!col) return 64;
	if (col.wpx != null) return col.wpx;
	if (col.width != null) return width2px(col.width);
	if (col.wch != null) return width2px(char2width(col.wch));
	return 64;
}
function set_col_width_from_px(col, px) {
	if (!col) col = {};
	col.wpx = Math.max(0, Math.ceil(px));
	col.wch = px2char(col.wpx);
	col.width = px2col(col.wpx);
	col.MDW = MDW;
	col.bestFit = true;
	col.customWidth = true;
	return col;
}
function style_font_size_pt(style) {
	var sz = +(style && style.font || {}).sz;
	return sz > 0 ? sz : 11;
}
function style_font_family(style) {
	return (style && style.font || {}).name || "Calibri";
}
function css_string_escape(value, quote) {
	var str = String(value), out = [];
	for (var i = 0; i < str.length; ++i) {
		var cc = str.charCodeAt(i), ch = str.charAt(i);
		if (ch == quote || ch == "\\" || cc < 32 || cc == 127 || ch == "<" || ch == ">" || ch == "&") out.push("\\" + cc.toString(16) + " ");
		else out.push(ch);
	}
	return out.join("");
}
function css_font_from_style(style) {
	var font = style && style.font || {};
	var parts = [];
	if (font.italic) parts.push("italic");
	if (font.bold) parts.push("bold");
	parts.push(style_font_size_pt(style) + "pt");
	var name = style_font_family(style);
	if (/[,\s'"]/.test(name)) name = "\"" + css_string_escape(name, "\"") + "\"";
	else name = css_string_escape(name, "\"");
	parts.push(name);
	return parts.join(" ");
}
function fallback_char_width(ch, fpx) {
	var cc = ch.charCodeAt(0);
	if (cc == 9 || cc == 32) return fpx * .33;
	if (cc >= 48 && cc <= 57) return fpx * .52;
	if (cc >= 65 && cc <= 90) return fpx * .62;
	if (cc >= 97 && cc <= 122) {
		if ("iljtfr".indexOf(ch) > -1) return fpx * .28;
		if ("mw".indexOf(ch) > -1) return fpx * .82;
		return fpx * .5;
	}
	if (cc >= 11904) return fpx;
	return fpx * .52;
}
function fallback_text_width(text, style) {
	var fpx = pt2px_browser(style_font_size_pt(style)), width = 0;
	for (var i = 0; i < text.length; ++i) width += fallback_char_width(text.charAt(i), fpx);
	return width;
}
function measure_text_width(text, style, opts) {
	var o = opts || {};
	var lines = (text == null ? "" : String(text)).split(/\r\n|\n|\r/g), max = 0, i = 0, w = 0;
	if (o.measureText) for (i = 0; i < lines.length; ++i) {
		w = +o.measureText(lines[i], css_font_from_style(style), style || {});
		if (isFinite(w) && w > max) max = w;
	}
	else {
		var canvas = o.canvas, ctx = null;
		if (!canvas && typeof document !== "undefined" && document.createElement) try {
			canvas = document.createElement("canvas");
		} catch (e) {}
		try {
			ctx = canvas && canvas.getContext && canvas.getContext("2d");
		} catch (e) {
			ctx = null;
		}
		if (ctx && ctx.measureText) {
			ctx.font = css_font_from_style(style);
			for (i = 0; i < lines.length; ++i) {
				w = ctx.measureText(lines[i]).width;
				if (isFinite(w) && w > max) max = w;
			}
		} else for (i = 0; i < lines.length; ++i) {
			w = fallback_text_width(lines[i], style || {});
			if (isFinite(w) && w > max) max = w;
		}
	}
	return max;
}
function auto_fit_cell_text(cell, opts) {
	if (!cell || cell.v == null) return "";
	if (cell.w == null && cell.t != "z") format_cell(cell);
	return String(cell.w != null ? cell.w : cell.v);
}
function text_width_segments(text, wrap) {
	var lines = String(text == null ? "" : text).split(/\r\n|\n|\r/g), out = [], i = 0, j = 0, parts = null;
	if (!wrap) return lines;
	for (i = 0; i < lines.length; ++i) {
		parts = lines[i].split(/[\t \u00A0\-\/]+/);
		for (j = 0; j < parts.length; ++j) if (parts[j]) out.push(parts[j]);
		if (!parts.length || parts.length == 1 && !parts[0]) out.push(lines[i]);
	}
	return out.length ? out : [""];
}
function effective_cell_style(ws, cell, R, C) {
	var out = {}, cols = ws["!cols"] || [], rows = ws["!rows"] || [];
	if (cols[C] && cols[C].s) extend_style_obj(out, cols[C].s);
	if (rows[R] && rows[R].s) extend_style_obj(out, rows[R].s);
	if (cell && cell.s) extend_style_obj(out, cell.s);
	return out;
}
function measure_cell_text_width(cell, style, opts) {
	var o = opts || {}, text = auto_fit_cell_text(cell, o), align = style && style.alignment || {};
	var segments = text_width_segments(text, !!align.wrapText), max = 0, w = 0;
	for (var i = 0; i < segments.length; ++i) {
		w = measure_text_width(segments[i], style, o);
		if (w > max) max = w;
	}
	var indent = +align.indent || 0;
	if (indent > 0) max += indent * 3 * Math.max(1, MDW);
	var rotation = +align.textRotation || 0;
	if (rotation == 255) rotation = 90;
	if (rotation > 90) rotation = 90 - rotation;
	if (rotation < 0) rotation = -rotation;
	if (rotation > 0 && rotation < 90) {
		var rad = rotation * Math.PI / 180, fpx = pt2px_browser(style_font_size_pt(style));
		max = Math.abs(max * Math.cos(rad)) + Math.abs(fpx * Math.sin(rad));
	} else if (rotation >= 90) max = Math.max(MDW + XLSX_COL_WIDTH_PADDING, pt2px_browser(style_font_size_pt(style)) + 2);
	return max + (o.padding != null ? +o.padding : XLSX_COL_WIDTH_PADDING);
}
function merge_start_map(merges) {
	var out = {};
	for (var i = 0; i < merges.length; ++i) out[merges[i].s.r + ":" + merges[i].s.c] = merges[i];
	return out;
}
function is_covered_merge(merges, R, C) {
	for (var i = 0; i < merges.length; ++i) {
		var m = merges[i];
		if (m.s.r <= R && R <= m.e.r && m.s.c <= C && C <= m.e.c) return !(m.s.r == R && m.s.c == C);
	}
	return false;
}
function auto_fit_columns(ws, opts) {
	var o = opts || {}, oldMDW = MDW;
	if (o.MDW) MDW = +o.MDW || MDW;
	var r = o.range ? typeof o.range == "string" ? decode_range(o.range) : o.range : decode_range(ws["!ref"] || "A1");
	var base = ws["!cols"] || [], rows = ws["!rows"] || [], cols = [], widths = [];
	var minpx = o.minPx != null ? +o.minPx : o.min != null ? width2px(char2width(+o.min)) : 0;
	var maxpx = o.maxPx != null ? +o.maxPx : width2px(XLSX_COL_WIDTH_MAX);
	var merges = o.includeMerged === false ? [] : ws["!merges"] || [];
	var starts = merge_start_map(merges), dense = ws["!data"] != null;
	var C = 0, R = 0, span = 0, m = null, j = 0, cell = null, style = null, need = 0, have = 0;
	for (C = r.s.c; C <= r.e.c; ++C) {
		cols[C] = dup(base[C] || {});
		if (cols[C] && cols[C].hidden && o.skipHidden) continue;
		widths[C] = cols[C] && (cols[C].wpx != null || cols[C].width != null || cols[C].wch != null) ? col2px(cols[C]) : minpx;
	}
	for (R = r.s.r; R <= r.e.r; ++R) {
		if (rows[R] && rows[R].hidden && o.skipHidden) continue;
		for (C = r.s.c; C <= r.e.c; ++C) {
			if (cols[C] && cols[C].hidden && o.skipHidden) continue;
			if (is_covered_merge(merges, R, C)) continue;
			cell = dense ? (ws["!data"][R] || [])[C] : ws[encode_cell({
				r: R,
				c: C
			})];
			if (!cell || cell.v == null) continue;
			style = effective_cell_style(ws, cell, R, C);
			need = measure_cell_text_width(cell, style, o);
			if (style && style.alignment && style.alignment.shrinkToFit && widths[C]) need = Math.min(need, widths[C]);
			m = starts[R + ":" + C];
			span = m ? m.e.c - m.s.c + 1 : 1;
			if (span > 1) {
				have = 0;
				for (j = 0; j < span; ++j) have += widths[C + j] || minpx;
				if (need > have) for (j = 0; j < span; ++j) widths[C + j] = Math.min(maxpx, Math.max(widths[C + j] || minpx, (widths[C + j] || minpx) + (need - have) / span));
			} else widths[C] = Math.min(maxpx, Math.max(widths[C] || minpx, need));
		}
	}
	for (C = r.s.c; C <= r.e.c; ++C) if (widths[C] != null) cols[C] = set_col_width_from_px(cols[C] || {}, Math.min(maxpx, Math.max(minpx, widths[C])));
	if (o.set === false) {
		MDW = oldMDW;
		return cols;
	}
	ws["!cols"] = cols;
	MDW = oldMDW;
	return cols;
}
var PPI = 96;
function px2pt(px) {
	return px * 96 / PPI;
}
function pt2px(pt) {
	return pt * PPI / 96;
}
function pt2px_browser(pt) {
	return pt * 96 / 72;
}
function px2pt_browser(px) {
	return px * 72 / 96;
}
var XLMLPatternTypeMap = {
	"None": "none",
	"Solid": "solid",
	"Gray50": "mediumGray",
	"Gray75": "darkGray",
	"Gray25": "lightGray",
	"HorzStripe": "darkHorizontal",
	"VertStripe": "darkVertical",
	"ReverseDiagStripe": "darkDown",
	"DiagStripe": "darkUp",
	"DiagCross": "darkGrid",
	"ThickDiagCross": "darkTrellis",
	"ThinHorzStripe": "lightHorizontal",
	"ThinVertStripe": "lightVertical",
	"ThinReverseDiagStripe": "lightDown",
	"ThinHorzCross": "lightGrid"
};
function parse_borders(t, styles, themes, opts) {
	styles.Borders = [];
	var border = {};
	var side = "";
	var pass = false;
	(t.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<borders":
			case "<borders>":
			case "</borders>": break;
			case "<border":
			case "<border>":
			case "<border/>":
				border = {};
				if (y.diagonalUp) border.diagonalUp = parsexmlbool(y.diagonalUp);
				if (y.diagonalDown) border.diagonalDown = parsexmlbool(y.diagonalDown);
				styles.Borders.push(border);
				break;
			case "</border>": break;
			case "<left/>":
				border.left = {};
				if (y.style) border.left.style = y.style;
				break;
			case "<left":
			case "<left>":
				side = "left";
				border[side] = border[side] || {};
				if (y.style) border[side].style = y.style;
				break;
			case "</left>":
				side = "";
				break;
			case "<right/>":
				border.right = {};
				if (y.style) border.right.style = y.style;
				break;
			case "<right":
			case "<right>":
				side = "right";
				border[side] = border[side] || {};
				if (y.style) border[side].style = y.style;
				break;
			case "</right>":
				side = "";
				break;
			case "<top/>":
				border.top = {};
				if (y.style) border.top.style = y.style;
				break;
			case "<top":
			case "<top>":
				side = "top";
				border[side] = border[side] || {};
				if (y.style) border[side].style = y.style;
				break;
			case "</top>":
				side = "";
				break;
			case "<bottom/>":
				border.bottom = {};
				if (y.style) border.bottom.style = y.style;
				break;
			case "<bottom":
			case "<bottom>":
				side = "bottom";
				border[side] = border[side] || {};
				if (y.style) border[side].style = y.style;
				break;
			case "</bottom>":
				side = "";
				break;
			case "<diagonal/>":
				border.diagonal = {};
				if (y.style) border.diagonal.style = y.style;
				break;
			case "<diagonal":
			case "<diagonal>":
				side = "diagonal";
				border[side] = border[side] || {};
				if (y.style) border[side].style = y.style;
				break;
			case "</diagonal>":
				side = "";
				break;
			case "<horizontal/>":
				border.horizontal = {};
				if (y.style) border.horizontal.style = y.style;
				break;
			case "<horizontal":
			case "<horizontal>":
				side = "horizontal";
				border[side] = border[side] || {};
				if (y.style) border[side].style = y.style;
				break;
			case "</horizontal>":
				side = "";
				break;
			case "<vertical/>":
				border.vertical = {};
				if (y.style) border.vertical.style = y.style;
				break;
			case "<vertical":
			case "<vertical>":
				side = "vertical";
				border[side] = border[side] || {};
				if (y.style) border[side].style = y.style;
				break;
			case "</vertical>":
				side = "";
				break;
			case "<start/>":
				border.start = {};
				if (y.style) border.start.style = y.style;
				break;
			case "<start":
			case "<start>":
				side = "start";
				border[side] = border[side] || {};
				if (y.style) border[side].style = y.style;
				break;
			case "</start>":
				side = "";
				break;
			case "<end/>":
				border.end = {};
				if (y.style) border.end.style = y.style;
				break;
			case "<end":
			case "<end>":
				side = "end";
				border[side] = border[side] || {};
				if (y.style) border[side].style = y.style;
				break;
			case "</end>":
				side = "";
				break;
			case "<color":
			case "<color>":
				if (side) border[side].color = style_color_from_attrs(y, themes);
				break;
			case "<color/>":
			case "</color>": break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (opts && opts.WTF) {
				if (!pass) throw new Error("unrecognized " + y[0] + " in borders");
			}
		}
	});
}
function parse_fills(t, styles, themes, opts) {
	styles.Fills = [];
	var fill = {};
	var gradient = null, stop = null;
	var pass = false;
	(t.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<fills":
			case "<fills>":
			case "</fills>": break;
			case "<fill>":
			case "<fill":
			case "<fill/>":
				fill = {};
				styles.Fills.push(fill);
				break;
			case "</fill>": break;
			case "<gradientFill>":
				gradient = { stops: [] };
				fill.gradientFill = gradient;
				break;
			case "<gradientFill":
				gradient = { stops: [] };
				if (y.type) gradient.type = y.type;
				if (y.degree) gradient.degree = parseFloat(y.degree);
				[
					"left",
					"right",
					"top",
					"bottom"
				].forEach(function(k) {
					if (y[k] != null) gradient[k] = parseFloat(y[k]);
				});
				fill.gradientFill = gradient;
				break;
			case "</gradientFill>":
				gradient = null;
				break;
			case "<patternFill":
			case "<patternFill>":
				if (y.patternType) fill.patternType = y.patternType;
				break;
			case "<patternFill/>":
			case "</patternFill>": break;
			case "<bgColor":
				fill.bgColor = style_color_from_attrs(y, themes);
				break;
			case "<bgColor/>":
			case "</bgColor>": break;
			case "<fgColor":
				fill.fgColor = style_color_from_attrs(y, themes);
				break;
			case "<fgColor/>":
			case "</fgColor>": break;
			case "<stop":
				stop = {};
				if (y.position != null) stop.position = parseFloat(y.position);
				if (gradient) gradient.stops.push(stop);
				break;
			case "<stop/>":
				if (gradient) {
					stop = {};
					if (y.position != null) stop.position = parseFloat(y.position);
					gradient.stops.push(stop);
				}
				stop = null;
				break;
			case "</stop>":
				stop = null;
				break;
			case "<color":
				if (stop) stop.color = style_color_from_attrs(y, themes);
				break;
			case "<color/>":
				if (stop) stop.color = style_color_from_attrs(y, themes);
				break;
			case "</color>": break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (opts && opts.WTF) {
				if (!pass) throw new Error("unrecognized " + y[0] + " in fills");
			}
		}
	});
}
function parse_fonts(t, styles, themes, opts) {
	styles.Fonts = [];
	var font = {};
	var pass = false;
	(t.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<fonts":
			case "<fonts>":
			case "</fonts>": break;
			case "<font":
			case "<font>": break;
			case "</font>":
			case "<font/>":
				styles.Fonts.push(font);
				font = {};
				break;
			case "<name":
				if (y.val) font.name = utf8read(y.val);
				break;
			case "<name/>":
			case "</name>": break;
			case "<b":
				font.bold = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<b/>":
				font.bold = 1;
				break;
			case "</b>":
			case "</b": break;
			case "<i":
				font.italic = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<i/>":
				font.italic = 1;
				break;
			case "</i>":
			case "</i": break;
			case "<u":
				switch (y.val) {
					case "none":
						font.underline = 0;
						break;
					case "single":
						font.underline = 1;
						break;
					case "double":
						font.underline = 2;
						break;
					case "singleAccounting":
						font.underline = 33;
						break;
					case "doubleAccounting": font.underline = 34;
				}
				break;
			case "<u/>":
				font.underline = 1;
				break;
			case "</u>":
			case "</u": break;
			case "<strike":
				font.strike = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<strike/>":
				font.strike = 1;
				break;
			case "</strike>":
			case "</strike": break;
			case "<outline":
				font.outline = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<outline/>":
				font.outline = 1;
				break;
			case "</outline>":
			case "</outline": break;
			case "<shadow":
				font.shadow = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<shadow/>":
				font.shadow = 1;
				break;
			case "</shadow>":
			case "</shadow": break;
			case "<condense":
				font.condense = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<condense/>":
				font.condense = 1;
				break;
			case "</condense>":
			case "</condense": break;
			case "<extend":
				font.extend = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<extend/>":
				font.extend = 1;
				break;
			case "</extend>":
			case "</extend": break;
			case "<sz":
				if (y.val) font.sz = +y.val;
				break;
			case "<sz/>":
			case "</sz>":
			case "</sz": break;
			case "<vertAlign":
				if (y.val) font.vertAlign = y.val;
				break;
			case "<vertAlign/>":
			case "</vertAlign>":
			case "</vertAlign": break;
			case "<family":
				if (y.val) font.family = parseInt(y.val, 10);
				break;
			case "<family/>":
			case "</family>":
			case "</family": break;
			case "<scheme":
				if (y.val) font.scheme = y.val;
				break;
			case "<scheme/>":
			case "</scheme>":
			case "</scheme": break;
			case "<charset":
				if (y.val == "1") break;
				y.codepage = CS2CP[parseInt(y.val, 10)];
				break;
			case "<charset/>":
			case "</charset>":
			case "</charset": break;
			case "<color":
				font.color = style_color_from_attrs(y, themes);
				break;
			case "<color/>":
			case "</color>":
			case "</color": break;
			case "<AlternateContent":
				pass = true;
				break;
			case "</AlternateContent>":
			case "</AlternateContent":
				pass = false;
				break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (opts && opts.WTF) {
				if (!pass) throw new Error("unrecognized " + y[0] + " in fonts");
			}
		}
	});
}
function parse_numFmts(t, styles, opts) {
	styles.NumberFmt = [];
	var k = keys(table_fmt);
	for (var i = 0; i < k.length; ++i) styles.NumberFmt[k[i]] = table_fmt[k[i]];
	var m = t.match(tagregex);
	if (!m) return;
	for (i = 0; i < m.length; ++i) {
		var y = parsexmltag(m[i]);
		switch (strip_ns(y[0])) {
			case "<numFmts":
			case "</numFmts>":
			case "<numFmts/>":
			case "<numFmts>": break;
			case "<numFmt":
				var f = unescapexml(utf8read(y.formatCode)), j = parseInt(y.numFmtId, 10);
				styles.NumberFmt[j] = f;
				if (j > 0) {
					if (j > 392) {
						for (j = 392; j > 60; --j) if (styles.NumberFmt[j] == null) break;
						styles.NumberFmt[j] = f;
					}
					SSF__load(f, j);
				}
				break;
			case "</numFmt>": break;
			default: if (opts.WTF) throw new Error("unrecognized " + y[0] + " in numFmts");
		}
	}
}
var cellXF_uint = [
	"numFmtId",
	"fillId",
	"fontId",
	"borderId",
	"xfId"
];
var cellXF_bool = [
	"applyAlignment",
	"applyBorder",
	"applyFill",
	"applyFont",
	"applyNumberFormat",
	"applyProtection",
	"pivotButton",
	"quotePrefix"
];
function parse_xfs(t, styles, opts, key) {
	styles[key] = [];
	var xf;
	var pass = false;
	(t.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x), i = 0;
		switch (strip_ns(y[0])) {
			case "<cellXfs":
			case "<cellXfs>":
			case "<cellXfs/>":
			case "</cellXfs>":
			case "<cellStyleXfs":
			case "<cellStyleXfs>":
			case "<cellStyleXfs/>":
			case "</cellStyleXfs>": break;
			case "<xf":
			case "<xf/>":
			case "<xf>":
				xf = y;
				delete xf[0];
				for (i = 0; i < cellXF_uint.length; ++i) if (xf[cellXF_uint[i]]) xf[cellXF_uint[i]] = parseInt(xf[cellXF_uint[i]], 10);
				for (i = 0; i < cellXF_bool.length; ++i) if (xf[cellXF_bool[i]]) xf[cellXF_bool[i]] = parsexmlbool(xf[cellXF_bool[i]]);
				if (styles.NumberFmt && xf.numFmtId > 392) {
					for (i = 392; i > 60; --i) if (styles.NumberFmt[xf.numFmtId] == styles.NumberFmt[i]) {
						xf.numFmtId = i;
						break;
					}
				}
				styles[key].push(xf);
				break;
			case "</xf>": break;
			case "<alignment":
			case "<alignment/>":
			case "<alignment>":
				var alignment = {};
				if (y.vertical) alignment.vertical = y.vertical;
				if (y.horizontal) alignment.horizontal = y.horizontal;
				if (y.textRotation != null) alignment.textRotation = parseInt(y.textRotation, 10);
				if (y.indent) alignment.indent = parseInt(y.indent, 10);
				if (y.relativeIndent) alignment.relativeIndent = parseInt(y.relativeIndent, 10);
				if (y.readingOrder) alignment.readingOrder = parseInt(y.readingOrder, 10);
				if (y.wrapText) alignment.wrapText = parsexmlbool(y.wrapText);
				if (y.shrinkToFit) alignment.shrinkToFit = parsexmlbool(y.shrinkToFit);
				if (y.justifyLastLine) alignment.justifyLastLine = parsexmlbool(y.justifyLastLine);
				xf.alignment = alignment;
				break;
			case "</alignment>": break;
			case "<protection":
			case "<protection>":
				var protection = {};
				if (y.locked != null) protection.locked = parsexmlbool(y.locked);
				if (y.hidden != null) protection.hidden = parsexmlbool(y.hidden);
				xf.protection = protection;
				break;
			case "<protection/>":
				protection = {};
				if (y.locked != null) protection.locked = parsexmlbool(y.locked);
				if (y.hidden != null) protection.hidden = parsexmlbool(y.hidden);
				xf.protection = protection;
				break;
			case "</protection>": break;
			case "<AlternateContent":
			case "<AlternateContent>":
				pass = true;
				break;
			case "</AlternateContent>":
				pass = false;
				break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (opts && opts.WTF) {
				if (!pass) throw new Error("unrecognized " + y[0] + " in cellXfs");
			}
		}
	});
}
function parse_cellXfs(t, styles, opts) {
	parse_xfs(t, styles, opts, "CellXf");
}
function parse_cellStyleXfs(t, styles, opts) {
	parse_xfs(t, styles, opts, "CellStyleXf");
}
function parse_cellStyles(t, styles, opts) {
	styles.CellStyles = [];
	(t.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<cellStyles":
			case "<cellStyles>":
			case "<cellStyles/>":
			case "</cellStyles>": break;
			case "<cellStyle":
			case "<cellStyle/>":
				delete y[0];
				if (y.xfId != null) y.xfId = parseInt(y.xfId, 10);
				if (y.builtinId != null) y.builtinId = parseInt(y.builtinId, 10);
				if (y.iLevel != null) y.iLevel = parseInt(y.iLevel, 10);
				if (y.customBuiltin != null) y.customBuiltin = parsexmlbool(y.customBuiltin);
				if (y.hidden != null) y.hidden = parsexmlbool(y.hidden);
				if (y.name) y.name = utf8read(y.name);
				styles.CellStyles.push(y);
				break;
			case "</cellStyle>": break;
			default: if (opts && opts.WTF) throw new Error("unrecognized " + y[0] + " in cellStyles");
		}
	});
}
function parse_dxfs(t, styles, themes, opts) {
	styles.Dxfs = [];
	var dxf = null, font = null, fill = null, border = null, side = "";
	var pass = false;
	(t.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<dxfs":
			case "<dxfs>":
			case "<dxfs/>":
			case "</dxfs>": break;
			case "<dxf":
			case "<dxf>":
				dxf = {};
				styles.Dxfs.push(dxf);
				break;
			case "<dxf/>":
				styles.Dxfs.push({});
				dxf = null;
				break;
			case "</dxf>":
				dxf = null;
				break;
			case "<font":
			case "<font>":
				font = {};
				if (dxf) dxf.font = font;
				break;
			case "</font>":
			case "<font/>":
				font = null;
				break;
			case "<name":
				if (font && y.val) font.name = utf8read(y.val);
				break;
			case "<name/>":
			case "</name>": break;
			case "<b":
				if (font) font.bold = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<b/>":
				if (font) font.bold = 1;
				break;
			case "</b>": break;
			case "<i":
				if (font) font.italic = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<i/>":
				if (font) font.italic = 1;
				break;
			case "</i>": break;
			case "<u":
				if (font) font.underline = y.val || 1;
				break;
			case "<u/>":
				if (font) font.underline = 1;
				break;
			case "</u>": break;
			case "<strike":
				if (font) font.strike = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<strike/>":
				if (font) font.strike = 1;
				break;
			case "</strike>": break;
			case "<sz":
				if (font && y.val) font.sz = +y.val;
				break;
			case "<sz/>":
			case "</sz>": break;
			case "<outline":
				if (font) font.outline = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<outline/>":
				if (font) font.outline = 1;
				break;
			case "</outline>": break;
			case "<shadow":
				if (font) font.shadow = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<shadow/>":
				if (font) font.shadow = 1;
				break;
			case "</shadow>": break;
			case "<condense":
				if (font) font.condense = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<condense/>":
				if (font) font.condense = 1;
				break;
			case "</condense>": break;
			case "<extend":
				if (font) font.extend = y.val ? parsexmlbool(y.val) : 1;
				break;
			case "<extend/>":
				if (font) font.extend = 1;
				break;
			case "</extend>": break;
			case "<vertAlign":
				if (font && y.val) font.vertAlign = y.val;
				break;
			case "<vertAlign/>":
			case "</vertAlign>": break;
			case "<family":
				if (font && y.val) font.family = parseInt(y.val, 10);
				break;
			case "<family/>":
			case "</family>": break;
			case "<scheme":
				if (font && y.val) font.scheme = y.val;
				break;
			case "<scheme/>":
			case "</scheme>": break;
			case "<charset":
				if (font && y.val != null) font.charset = parseInt(y.val, 10);
				break;
			case "<charset/>":
			case "</charset>": break;
			case "<color":
				if (font) font.color = style_color_from_attrs(y, themes);
				else if (side && border) border[side].color = style_color_from_attrs(y, themes);
				break;
			case "<color/>":
			case "</color>": break;
			case "<fill":
			case "<fill>":
				fill = {};
				if (dxf) dxf.fill = fill;
				break;
			case "<fill/>":
				fill = null;
				break;
			case "</fill>":
				fill = null;
				break;
			case "<patternFill":
			case "<patternFill>":
				if (fill && y.patternType) fill.patternType = y.patternType;
				break;
			case "<patternFill/>":
			case "</patternFill>": break;
			case "<fgColor":
				if (fill) fill.fgColor = style_color_from_attrs(y, themes);
				break;
			case "<fgColor/>":
			case "</fgColor>": break;
			case "<bgColor":
				if (fill) fill.bgColor = style_color_from_attrs(y, themes);
				break;
			case "<bgColor/>":
			case "</bgColor>": break;
			case "<border":
			case "<border>":
				border = {};
				if (dxf) dxf.border = border;
				break;
			case "<border/>":
				border = null;
				break;
			case "</border>":
				border = null;
				break;
			case "<left":
			case "<left>":
			case "<left/>":
				side = "left";
				if (border) {
					border[side] = border[side] || {};
					if (y.style) border[side].style = y.style;
				}
				if (y[0].slice(-2) == "/>") side = "";
				break;
			case "</left>":
				side = "";
				break;
			case "<right":
			case "<right>":
			case "<right/>":
				side = "right";
				if (border) {
					border[side] = border[side] || {};
					if (y.style) border[side].style = y.style;
				}
				if (y[0].slice(-2) == "/>") side = "";
				break;
			case "</right>":
				side = "";
				break;
			case "<top":
			case "<top>":
			case "<top/>":
				side = "top";
				if (border) {
					border[side] = border[side] || {};
					if (y.style) border[side].style = y.style;
				}
				if (y[0].slice(-2) == "/>") side = "";
				break;
			case "</top>":
				side = "";
				break;
			case "<bottom":
			case "<bottom>":
			case "<bottom/>":
				side = "bottom";
				if (border) {
					border[side] = border[side] || {};
					if (y.style) border[side].style = y.style;
				}
				if (y[0].slice(-2) == "/>") side = "";
				break;
			case "</bottom>":
				side = "";
				break;
			case "<diagonal":
			case "<diagonal>":
			case "<diagonal/>":
				side = "diagonal";
				if (border) {
					border[side] = border[side] || {};
					if (y.style) border[side].style = y.style;
				}
				if (y[0].slice(-2) == "/>") side = "";
				break;
			case "</diagonal>":
				side = "";
				break;
			case "<horizontal":
			case "<horizontal>":
			case "<horizontal/>":
				side = "horizontal";
				if (border) {
					border[side] = border[side] || {};
					if (y.style) border[side].style = y.style;
				}
				if (y[0].slice(-2) == "/>") side = "";
				break;
			case "</horizontal>":
				side = "";
				break;
			case "<vertical":
			case "<vertical>":
			case "<vertical/>":
				side = "vertical";
				if (border) {
					border[side] = border[side] || {};
					if (y.style) border[side].style = y.style;
				}
				if (y[0].slice(-2) == "/>") side = "";
				break;
			case "</vertical>":
				side = "";
				break;
			case "<start":
			case "<start>":
			case "<start/>":
				side = "start";
				if (border) {
					border[side] = border[side] || {};
					if (y.style) border[side].style = y.style;
				}
				if (y[0].slice(-2) == "/>") side = "";
				break;
			case "</start>":
				side = "";
				break;
			case "<end":
			case "<end>":
			case "<end/>":
				side = "end";
				if (border) {
					border[side] = border[side] || {};
					if (y.style) border[side].style = y.style;
				}
				if (y[0].slice(-2) == "/>") side = "";
				break;
			case "</end>":
				side = "";
				break;
			case "<alignment":
				if (dxf) {
					dxf.alignment = {};
					if (y.vertical) dxf.alignment.vertical = y.vertical;
					if (y.horizontal) dxf.alignment.horizontal = y.horizontal;
					if (y.wrapText) dxf.alignment.wrapText = parsexmlbool(y.wrapText);
				}
				break;
			case "<alignment/>":
			case "</alignment>": break;
			case "<numFmt":
				if (dxf) dxf.numFmt = {
					numFmtId: y.numFmtId != null ? parseInt(y.numFmtId, 10) : void 0,
					formatCode: y.formatCode ? unescapexml(utf8read(y.formatCode)) : void 0
				};
				break;
			case "<numFmt/>":
			case "</numFmt>": break;
			case "<protection":
				if (dxf) {
					dxf.protection = {};
					if (y.locked != null) dxf.protection.locked = parsexmlbool(y.locked);
					if (y.hidden != null) dxf.protection.hidden = parsexmlbool(y.hidden);
				}
				break;
			case "<protection/>":
			case "</protection>": break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (opts && opts.WTF) {
				if (!pass) throw new Error("unrecognized " + y[0] + " in dxfs");
			}
		}
	});
}
function parse_tableStyles(t, styles, opts) {
	styles.TableStyles = { styles: [] };
	var tableStyle = null, pass = false;
	(t.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x), tag = strip_ns(y[0]);
		switch (tag) {
			case "<tableStyles":
			case "<tableStyles>":
				if (y.defaultTableStyle) styles.TableStyles.defaultTableStyle = utf8read(unescapexml(y.defaultTableStyle));
				if (y.defaultPivotStyle) styles.TableStyles.defaultPivotStyle = utf8read(unescapexml(y.defaultPivotStyle));
				break;
			case "<tableStyles/>":
			case "</tableStyles>": break;
			case "<tableStyle":
			case "<tableStyle>":
			case "<tableStyle/>":
				if (styles.TableStyles.styles.length >= TABLE_STYLE_MAX_TABLES) {
					tableStyle = null;
					break;
				}
				tableStyle = {
					name: utf8read(unescapexml(y.name || "")),
					pivot: y.pivot != null ? parsexmlbool(y.pivot) : false,
					table: y.table != null ? parsexmlbool(y.table) : true,
					elements: []
				};
				styles.TableStyles.styles.push(tableStyle);
				if (tag.slice(-2) == "/>") tableStyle = null;
				break;
			case "</tableStyle>":
				tableStyle = null;
				break;
			case "<tableStyleElement":
			case "<tableStyleElement>":
			case "<tableStyleElement/>":
				if (tableStyle && tableStyle.elements.length < 64 && table_style_element_type(y.type) && y.dxfId != null) tableStyle.elements.push({
					type: y.type,
					dxfId: parseInt(y.dxfId, 10),
					size: y.size != null ? Math.max(1, parseInt(y.size, 10) || 1) : 1
				});
				break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (opts && opts.WTF && !pass) throw new Error("unrecognized " + y[0] + " in tableStyles");
		}
	});
}
function parse_colors(t, styles, themes, opts) {
	styles.Colors = {
		indexedColors: [],
		mruColors: [],
		themeColors: []
	};
	var target = null, pass = false;
	(t.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<colors":
			case "<colors>":
			case "</colors>": break;
			case "<indexedColors":
			case "<indexedColors>":
				target = styles.Colors.indexedColors;
				break;
			case "</indexedColors>":
				target = null;
				break;
			case "<themeColors":
			case "<themeColors>":
				target = styles.Colors.themeColors;
				break;
			case "</themeColors>":
				target = null;
				break;
			case "<mruColors":
			case "<mruColors>":
				target = styles.Colors.mruColors;
				break;
			case "</mruColors>":
				target = null;
				break;
			case "<rgbColor":
			case "<rgbColor/>":
				if (target) target.push(style_color_from_attrs(y, themes));
				break;
			case "</rgbColor>": break;
			case "<color":
			case "<color/>":
				if (target) target.push(style_color_from_attrs(y, themes));
				break;
			case "</color>": break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (opts && opts.WTF) {
				if (!pass) throw new Error("unrecognized " + y[0] + " in colors");
			}
		}
	});
}
var parse_sty_xml = /*#__PURE__*/ (function make_pstyx() {
	return function parse_sty_xml(data, themes, opts) {
		var styles = {};
		if (!data) return styles;
		data = remove_doctype(str_remove_ng(data, "<!--", "-->"));
		var t;
		if (t = str_match_xml_ns(data, "numFmts")) parse_numFmts(t[0], styles, opts);
		if (t = str_match_xml_ns(data, "fonts")) parse_fonts(t[0], styles, themes, opts);
		if (t = str_match_xml_ns(data, "fills")) parse_fills(t[0], styles, themes, opts);
		if (t = str_match_xml_ns(data, "borders")) parse_borders(t[0], styles, themes, opts);
		if (t = str_match_xml_ns(data, "cellStyleXfs")) parse_cellStyleXfs(t[0], styles, opts);
		if (t = str_match_xml_ns(data, "cellStyles")) parse_cellStyles(t[0], styles, opts);
		if (t = str_match_xml_ns(data, "cellXfs")) parse_cellXfs(t[0], styles, opts);
		if (t = str_match_xml_ns(data, "dxfs")) parse_dxfs(t[0], styles, themes, opts);
		if (t = str_match_xml_ns(data, "tableStyles")) parse_tableStyles(t[0], styles, opts);
		if (t = str_match_xml_ns(data, "colors")) parse_colors(t[0], styles, themes, opts);
		return styles;
	};
})();
function parse_BrtFmt(data, length) {
	return [data.read_shift(2), parse_XLWideString(data, length - 2)];
}
function parse_BrtFont(data, length, opts) {
	var out = {};
	out.sz = data.read_shift(2) / 20;
	var grbit = parse_FontFlags(data, 2, opts);
	if (grbit.fItalic) out.italic = 1;
	if (grbit.fCondense) out.condense = 1;
	if (grbit.fExtend) out.extend = 1;
	if (grbit.fShadow) out.shadow = 1;
	if (grbit.fOutline) out.outline = 1;
	if (grbit.fStrikeout) out.strike = 1;
	if (data.read_shift(2) === 700) out.bold = 1;
	switch (data.read_shift(2)) {
		case 1:
			out.vertAlign = "superscript";
			break;
		case 2: out.vertAlign = "subscript";
	}
	var underline = data.read_shift(1);
	if (underline != 0) out.underline = underline;
	var family = data.read_shift(1);
	if (family > 0) out.family = family;
	var bCharSet = data.read_shift(1);
	if (bCharSet > 0) out.charset = bCharSet;
	data.l++;
	out.color = parse_BrtColor(data, 8);
	switch (data.read_shift(1)) {
		case 1:
			out.scheme = "major";
			break;
		case 2: out.scheme = "minor";
	}
	out.name = parse_XLWideString(data, length - 21);
	return out;
}
var parse_BrtFill = parsenoop;
function parse_BrtXF(data, length) {
	var tgt = data.l + length;
	var ixfeParent = data.read_shift(2);
	var ifmt = data.read_shift(2);
	data.l = tgt;
	return {
		ixfe: ixfeParent,
		numFmtId: ifmt
	};
}
var parse_BrtBorder = parsenoop;
function parse_sty_bin(data, themes, opts) {
	var styles = {};
	styles.NumberFmt = [];
	for (var y in table_fmt) styles.NumberFmt[y] = table_fmt[y];
	styles.CellXf = [];
	styles.Fonts = [];
	var state = [];
	var pass = false;
	recordhopper(data, function hopper_sty(val, R, RT) {
		switch (RT) {
			case 44:
				styles.NumberFmt[val[0]] = val[1];
				SSF__load(val[1], val[0]);
				break;
			case 43:
				styles.Fonts.push(val);
				if (val.color.theme != null && themes && themes.themeElements && themes.themeElements.clrScheme) val.color.rgb = rgb_tint(themes.themeElements.clrScheme[val.color.theme].rgb, val.color.tint || 0);
				break;
			case 1025: break;
			case 45: break;
			case 46: break;
			case 47:
				if (state[state.length - 1] == 617) styles.CellXf.push(val);
				break;
			case 48:
			case 507:
			case 572:
			case 475: break;
			case 1171:
			case 2102:
			case 1130:
			case 512:
			case 2095:
			case 3072: break;
			case 35:
				pass = true;
				break;
			case 36:
				pass = false;
				break;
			case 37:
				state.push(RT);
				pass = true;
				break;
			case 38:
				state.pop();
				pass = false;
				break;
			default: if (R.T > 0) state.push(RT);
			else if (R.T < 0) state.pop();
			else if (!pass || opts.WTF && state[state.length - 1] != 37) throw new Error("Unexpected record 0x" + RT.toString(16));
		}
	});
	return styles;
}
var XLSXThemeClrScheme = [
	"</a:lt1>",
	"</a:dk1>",
	"</a:lt2>",
	"</a:dk2>",
	"</a:accent1>",
	"</a:accent2>",
	"</a:accent3>",
	"</a:accent4>",
	"</a:accent5>",
	"</a:accent6>",
	"</a:hlink>",
	"</a:folHlink>"
];
function parse_clrScheme(t, themes, opts) {
	themes.themeElements.clrScheme = [];
	var color = {};
	(t[0].match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		switch (y[0]) {
			case "<a:clrScheme":
			case "</a:clrScheme>": break;
			case "<a:srgbClr":
				color.rgb = y.val;
				break;
			case "</a:srgbClr>": break;
			case "<a:sysClr":
				color.rgb = y.lastClr;
				break;
			case "</a:sysClr>": break;
			case "</a:dk1>":
			case "</a:lt1>":
			case "<a:dk1>":
			case "<a:lt1>":
			case "<a:dk2>":
			case "</a:dk2>":
			case "<a:lt2>":
			case "</a:lt2>":
			case "<a:accent1>":
			case "</a:accent1>":
			case "<a:accent2>":
			case "</a:accent2>":
			case "<a:accent3>":
			case "</a:accent3>":
			case "<a:accent4>":
			case "</a:accent4>":
			case "<a:accent5>":
			case "</a:accent5>":
			case "<a:accent6>":
			case "</a:accent6>":
			case "<a:hlink>":
			case "</a:hlink>":
			case "<a:folHlink>":
			case "</a:folHlink>":
				if (y[0].charAt(1) === "/") {
					themes.themeElements.clrScheme[XLSXThemeClrScheme.indexOf(y[0])] = color;
					color = {};
				} else color.name = y[0].slice(3, y[0].length - 1);
				break;
			default: if (opts && opts.WTF) throw new Error("Unrecognized " + y[0] + " in clrScheme");
		}
	});
}
function parse_themeElements(data, themes, opts) {
	themes.themeElements = {};
	var t;
	if (!(t = str_match_xml(data, "a:clrScheme"))) throw new Error("clrScheme not found in themeElements");
	parse_clrScheme(t, themes, opts);
	if (!(t = str_match_xml(data, "a:fontScheme"))) throw new Error("fontScheme not found in themeElements");
	if (!(t = str_match_xml(data, "a:fmtScheme"))) throw new Error("fmtScheme not found in themeElements");
}
function parse_theme_xml(data, opts) {
	if (!data || data.length === 0) data = write_theme();
	var t;
	var themes = {};
	if (!(t = str_match_xml(data, "a:themeElements"))) throw new Error("themeElements not found in theme");
	parse_themeElements(t[0], themes, opts);
	themes.raw = data;
	return themes;
}
function write_theme(Themes, opts) {
	if (opts && opts.themeXLSX) return opts.themeXLSX;
	if (Themes && typeof Themes.raw == "string") return Themes.raw;
	var o = [XML_HEADER];
	o[o.length] = "<a:theme xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" name=\"Office Theme\">";
	o[o.length] = "<a:themeElements>";
	o[o.length] = "<a:clrScheme name=\"Office\">";
	o[o.length] = "<a:dk1><a:sysClr val=\"windowText\" lastClr=\"000000\"/></a:dk1>";
	o[o.length] = "<a:lt1><a:sysClr val=\"window\" lastClr=\"FFFFFF\"/></a:lt1>";
	o[o.length] = "<a:dk2><a:srgbClr val=\"1F497D\"/></a:dk2>";
	o[o.length] = "<a:lt2><a:srgbClr val=\"EEECE1\"/></a:lt2>";
	o[o.length] = "<a:accent1><a:srgbClr val=\"4F81BD\"/></a:accent1>";
	o[o.length] = "<a:accent2><a:srgbClr val=\"C0504D\"/></a:accent2>";
	o[o.length] = "<a:accent3><a:srgbClr val=\"9BBB59\"/></a:accent3>";
	o[o.length] = "<a:accent4><a:srgbClr val=\"8064A2\"/></a:accent4>";
	o[o.length] = "<a:accent5><a:srgbClr val=\"4BACC6\"/></a:accent5>";
	o[o.length] = "<a:accent6><a:srgbClr val=\"F79646\"/></a:accent6>";
	o[o.length] = "<a:hlink><a:srgbClr val=\"0000FF\"/></a:hlink>";
	o[o.length] = "<a:folHlink><a:srgbClr val=\"800080\"/></a:folHlink>";
	o[o.length] = "</a:clrScheme>";
	o[o.length] = "<a:fontScheme name=\"Office\">";
	o[o.length] = "<a:majorFont>";
	o[o.length] = "<a:latin typeface=\"Cambria\"/>";
	o[o.length] = "<a:ea typeface=\"\"/>";
	o[o.length] = "<a:cs typeface=\"\"/>";
	o[o.length] = "<a:font script=\"Jpan\" typeface=\"ＭＳ Ｐゴシック\"/>";
	o[o.length] = "<a:font script=\"Hang\" typeface=\"맑은 고딕\"/>";
	o[o.length] = "<a:font script=\"Hans\" typeface=\"宋体\"/>";
	o[o.length] = "<a:font script=\"Hant\" typeface=\"新細明體\"/>";
	o[o.length] = "<a:font script=\"Arab\" typeface=\"Times New Roman\"/>";
	o[o.length] = "<a:font script=\"Hebr\" typeface=\"Times New Roman\"/>";
	o[o.length] = "<a:font script=\"Thai\" typeface=\"Tahoma\"/>";
	o[o.length] = "<a:font script=\"Ethi\" typeface=\"Nyala\"/>";
	o[o.length] = "<a:font script=\"Beng\" typeface=\"Vrinda\"/>";
	o[o.length] = "<a:font script=\"Gujr\" typeface=\"Shruti\"/>";
	o[o.length] = "<a:font script=\"Khmr\" typeface=\"MoolBoran\"/>";
	o[o.length] = "<a:font script=\"Knda\" typeface=\"Tunga\"/>";
	o[o.length] = "<a:font script=\"Guru\" typeface=\"Raavi\"/>";
	o[o.length] = "<a:font script=\"Cans\" typeface=\"Euphemia\"/>";
	o[o.length] = "<a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/>";
	o[o.length] = "<a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/>";
	o[o.length] = "<a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/>";
	o[o.length] = "<a:font script=\"Thaa\" typeface=\"MV Boli\"/>";
	o[o.length] = "<a:font script=\"Deva\" typeface=\"Mangal\"/>";
	o[o.length] = "<a:font script=\"Telu\" typeface=\"Gautami\"/>";
	o[o.length] = "<a:font script=\"Taml\" typeface=\"Latha\"/>";
	o[o.length] = "<a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/>";
	o[o.length] = "<a:font script=\"Orya\" typeface=\"Kalinga\"/>";
	o[o.length] = "<a:font script=\"Mlym\" typeface=\"Kartika\"/>";
	o[o.length] = "<a:font script=\"Laoo\" typeface=\"DokChampa\"/>";
	o[o.length] = "<a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/>";
	o[o.length] = "<a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/>";
	o[o.length] = "<a:font script=\"Viet\" typeface=\"Times New Roman\"/>";
	o[o.length] = "<a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/>";
	o[o.length] = "<a:font script=\"Geor\" typeface=\"Sylfaen\"/>";
	o[o.length] = "</a:majorFont>";
	o[o.length] = "<a:minorFont>";
	o[o.length] = "<a:latin typeface=\"Calibri\"/>";
	o[o.length] = "<a:ea typeface=\"\"/>";
	o[o.length] = "<a:cs typeface=\"\"/>";
	o[o.length] = "<a:font script=\"Jpan\" typeface=\"ＭＳ Ｐゴシック\"/>";
	o[o.length] = "<a:font script=\"Hang\" typeface=\"맑은 고딕\"/>";
	o[o.length] = "<a:font script=\"Hans\" typeface=\"宋体\"/>";
	o[o.length] = "<a:font script=\"Hant\" typeface=\"新細明體\"/>";
	o[o.length] = "<a:font script=\"Arab\" typeface=\"Arial\"/>";
	o[o.length] = "<a:font script=\"Hebr\" typeface=\"Arial\"/>";
	o[o.length] = "<a:font script=\"Thai\" typeface=\"Tahoma\"/>";
	o[o.length] = "<a:font script=\"Ethi\" typeface=\"Nyala\"/>";
	o[o.length] = "<a:font script=\"Beng\" typeface=\"Vrinda\"/>";
	o[o.length] = "<a:font script=\"Gujr\" typeface=\"Shruti\"/>";
	o[o.length] = "<a:font script=\"Khmr\" typeface=\"DaunPenh\"/>";
	o[o.length] = "<a:font script=\"Knda\" typeface=\"Tunga\"/>";
	o[o.length] = "<a:font script=\"Guru\" typeface=\"Raavi\"/>";
	o[o.length] = "<a:font script=\"Cans\" typeface=\"Euphemia\"/>";
	o[o.length] = "<a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/>";
	o[o.length] = "<a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/>";
	o[o.length] = "<a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/>";
	o[o.length] = "<a:font script=\"Thaa\" typeface=\"MV Boli\"/>";
	o[o.length] = "<a:font script=\"Deva\" typeface=\"Mangal\"/>";
	o[o.length] = "<a:font script=\"Telu\" typeface=\"Gautami\"/>";
	o[o.length] = "<a:font script=\"Taml\" typeface=\"Latha\"/>";
	o[o.length] = "<a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/>";
	o[o.length] = "<a:font script=\"Orya\" typeface=\"Kalinga\"/>";
	o[o.length] = "<a:font script=\"Mlym\" typeface=\"Kartika\"/>";
	o[o.length] = "<a:font script=\"Laoo\" typeface=\"DokChampa\"/>";
	o[o.length] = "<a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/>";
	o[o.length] = "<a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/>";
	o[o.length] = "<a:font script=\"Viet\" typeface=\"Arial\"/>";
	o[o.length] = "<a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/>";
	o[o.length] = "<a:font script=\"Geor\" typeface=\"Sylfaen\"/>";
	o[o.length] = "</a:minorFont>";
	o[o.length] = "</a:fontScheme>";
	o[o.length] = "<a:fmtScheme name=\"Office\">";
	o[o.length] = "<a:fillStyleLst>";
	o[o.length] = "<a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill>";
	o[o.length] = "<a:gradFill rotWithShape=\"1\">";
	o[o.length] = "<a:gsLst>";
	o[o.length] = "<a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"50000\"/><a:satMod val=\"300000\"/></a:schemeClr></a:gs>";
	o[o.length] = "<a:gs pos=\"35000\"><a:schemeClr val=\"phClr\"><a:tint val=\"37000\"/><a:satMod val=\"300000\"/></a:schemeClr></a:gs>";
	o[o.length] = "<a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:tint val=\"15000\"/><a:satMod val=\"350000\"/></a:schemeClr></a:gs>";
	o[o.length] = "</a:gsLst>";
	o[o.length] = "<a:lin ang=\"16200000\" scaled=\"1\"/>";
	o[o.length] = "</a:gradFill>";
	o[o.length] = "<a:gradFill rotWithShape=\"1\">";
	o[o.length] = "<a:gsLst>";
	o[o.length] = "<a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"100000\"/><a:shade val=\"100000\"/><a:satMod val=\"130000\"/></a:schemeClr></a:gs>";
	o[o.length] = "<a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:tint val=\"50000\"/><a:shade val=\"100000\"/><a:satMod val=\"350000\"/></a:schemeClr></a:gs>";
	o[o.length] = "</a:gsLst>";
	o[o.length] = "<a:lin ang=\"16200000\" scaled=\"0\"/>";
	o[o.length] = "</a:gradFill>";
	o[o.length] = "</a:fillStyleLst>";
	o[o.length] = "<a:lnStyleLst>";
	o[o.length] = "<a:ln w=\"9525\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:solidFill><a:schemeClr val=\"phClr\"><a:shade val=\"95000\"/><a:satMod val=\"105000\"/></a:schemeClr></a:solidFill><a:prstDash val=\"solid\"/></a:ln>";
	o[o.length] = "<a:ln w=\"25400\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:prstDash val=\"solid\"/></a:ln>";
	o[o.length] = "<a:ln w=\"38100\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:prstDash val=\"solid\"/></a:ln>";
	o[o.length] = "</a:lnStyleLst>";
	o[o.length] = "<a:effectStyleLst>";
	o[o.length] = "<a:effectStyle>";
	o[o.length] = "<a:effectLst>";
	o[o.length] = "<a:outerShdw blurRad=\"40000\" dist=\"20000\" dir=\"5400000\" rotWithShape=\"0\"><a:srgbClr val=\"000000\"><a:alpha val=\"38000\"/></a:srgbClr></a:outerShdw>";
	o[o.length] = "</a:effectLst>";
	o[o.length] = "</a:effectStyle>";
	o[o.length] = "<a:effectStyle>";
	o[o.length] = "<a:effectLst>";
	o[o.length] = "<a:outerShdw blurRad=\"40000\" dist=\"23000\" dir=\"5400000\" rotWithShape=\"0\"><a:srgbClr val=\"000000\"><a:alpha val=\"35000\"/></a:srgbClr></a:outerShdw>";
	o[o.length] = "</a:effectLst>";
	o[o.length] = "</a:effectStyle>";
	o[o.length] = "<a:effectStyle>";
	o[o.length] = "<a:effectLst>";
	o[o.length] = "<a:outerShdw blurRad=\"40000\" dist=\"23000\" dir=\"5400000\" rotWithShape=\"0\"><a:srgbClr val=\"000000\"><a:alpha val=\"35000\"/></a:srgbClr></a:outerShdw>";
	o[o.length] = "</a:effectLst>";
	o[o.length] = "<a:scene3d><a:camera prst=\"orthographicFront\"><a:rot lat=\"0\" lon=\"0\" rev=\"0\"/></a:camera><a:lightRig rig=\"threePt\" dir=\"t\"><a:rot lat=\"0\" lon=\"0\" rev=\"1200000\"/></a:lightRig></a:scene3d>";
	o[o.length] = "<a:sp3d><a:bevelT w=\"63500\" h=\"25400\"/></a:sp3d>";
	o[o.length] = "</a:effectStyle>";
	o[o.length] = "</a:effectStyleLst>";
	o[o.length] = "<a:bgFillStyleLst>";
	o[o.length] = "<a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill>";
	o[o.length] = "<a:gradFill rotWithShape=\"1\">";
	o[o.length] = "<a:gsLst>";
	o[o.length] = "<a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"40000\"/><a:satMod val=\"350000\"/></a:schemeClr></a:gs>";
	o[o.length] = "<a:gs pos=\"40000\"><a:schemeClr val=\"phClr\"><a:tint val=\"45000\"/><a:shade val=\"99000\"/><a:satMod val=\"350000\"/></a:schemeClr></a:gs>";
	o[o.length] = "<a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:shade val=\"20000\"/><a:satMod val=\"255000\"/></a:schemeClr></a:gs>";
	o[o.length] = "</a:gsLst>";
	o[o.length] = "<a:path path=\"circle\"><a:fillToRect l=\"50000\" t=\"-80000\" r=\"50000\" b=\"180000\"/></a:path>";
	o[o.length] = "</a:gradFill>";
	o[o.length] = "<a:gradFill rotWithShape=\"1\">";
	o[o.length] = "<a:gsLst>";
	o[o.length] = "<a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"80000\"/><a:satMod val=\"300000\"/></a:schemeClr></a:gs>";
	o[o.length] = "<a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:shade val=\"30000\"/><a:satMod val=\"200000\"/></a:schemeClr></a:gs>";
	o[o.length] = "</a:gsLst>";
	o[o.length] = "<a:path path=\"circle\"><a:fillToRect l=\"50000\" t=\"50000\" r=\"50000\" b=\"50000\"/></a:path>";
	o[o.length] = "</a:gradFill>";
	o[o.length] = "</a:bgFillStyleLst>";
	o[o.length] = "</a:fmtScheme>";
	o[o.length] = "</a:themeElements>";
	o[o.length] = "<a:objectDefaults>";
	o[o.length] = "<a:spDef>";
	o[o.length] = "<a:spPr/><a:bodyPr/><a:lstStyle/><a:style><a:lnRef idx=\"1\"><a:schemeClr val=\"accent1\"/></a:lnRef><a:fillRef idx=\"3\"><a:schemeClr val=\"accent1\"/></a:fillRef><a:effectRef idx=\"2\"><a:schemeClr val=\"accent1\"/></a:effectRef><a:fontRef idx=\"minor\"><a:schemeClr val=\"lt1\"/></a:fontRef></a:style>";
	o[o.length] = "</a:spDef>";
	o[o.length] = "<a:lnDef>";
	o[o.length] = "<a:spPr/><a:bodyPr/><a:lstStyle/><a:style><a:lnRef idx=\"2\"><a:schemeClr val=\"accent1\"/></a:lnRef><a:fillRef idx=\"0\"><a:schemeClr val=\"accent1\"/></a:fillRef><a:effectRef idx=\"1\"><a:schemeClr val=\"accent1\"/></a:effectRef><a:fontRef idx=\"minor\"><a:schemeClr val=\"tx1\"/></a:fontRef></a:style>";
	o[o.length] = "</a:lnDef>";
	o[o.length] = "</a:objectDefaults>";
	o[o.length] = "<a:extraClrSchemeLst/>";
	o[o.length] = "</a:theme>";
	return o.join("");
}
function parse_Theme(blob, length, opts) {
	var end = blob.l + length;
	if (blob.read_shift(4) === 124226) return;
	if (!opts.cellStyles) {
		blob.l = end;
		return;
	}
	var data = blob.slice(blob.l);
	blob.l = end;
	var zip;
	try {
		zip = zip_read(data, { type: "array" });
	} catch (e) {
		return;
	}
	var themeXML = getzipstr(zip, "theme/theme/theme1.xml", true);
	if (!themeXML) return;
	return parse_theme_xml(themeXML, opts);
}
function parse_ColorTheme(blob) {
	return blob.read_shift(4);
}
function parse_FullColorExt(blob) {
	var o = {};
	o.xclrType = blob.read_shift(2);
	o.nTintShade = blob.read_shift(2, "i");
	switch (o.xclrType) {
		case 0:
			blob.l += 4;
			break;
		case 1:
			o.xclrValue = parse_IcvXF(blob, 4);
			break;
		case 2:
			o.xclrValue = parse_LongRGBA(blob, 4);
			break;
		case 3:
			o.xclrValue = parse_ColorTheme(blob, 4);
			break;
		case 4: blob.l += 4;
	}
	blob.l += 8;
	return o;
}
function parse_IcvXF(blob, length) {
	var end = blob.l + length;
	var icv = blob.read_shift(2) & 127;
	blob.l = end;
	return icv;
}
function parse_XFExtGradient(blob, length) {
	return parsenoop(blob, length);
}
function parse_ExtProp(blob) {
	var extType = blob.read_shift(2);
	var cb = blob.read_shift(2) - 4;
	var o = [extType];
	switch (extType) {
		case 4:
		case 5:
		case 7:
		case 8:
		case 9:
		case 10:
		case 11:
		case 13:
			o[1] = parse_FullColorExt(blob, cb);
			break;
		case 6:
			o[1] = parse_XFExtGradient(blob, cb);
			break;
		case 14:
		case 15:
			o[1] = blob.read_shift(cb === 1 ? 1 : 2);
			break;
		default: throw new Error("Unrecognized ExtProp type: " + extType + " " + cb);
	}
	return o;
}
function parse_XFExt(blob, length) {
	var end = blob.l + length;
	blob.l += 2;
	var ixfe = blob.read_shift(2);
	blob.l += 2;
	var cexts = blob.read_shift(2);
	var ext = [];
	while (cexts-- > 0) ext.push(parse_ExtProp(blob, end - blob.l));
	return {
		ixfe,
		ext
	};
}
function update_xfext(xf, xfext) {
	if (!xf) return;
	if (!xf.data) xf.data = {};
	xfext.forEach(function(xfe) {
		switch (xfe[0]) {
			case 4:
				xf.data.xfextFore = xfe[1];
				break;
			case 5:
				xf.data.xfextBack = xfe[1];
				break;
			case 6:
				xf.data.gradientFill = xfe[1];
				break;
			case 7:
				xf.data.xfextTop = xfe[1];
				break;
			case 8:
				xf.data.xfextBottom = xfe[1];
				break;
			case 9:
				xf.data.xfextLeft = xfe[1];
				break;
			case 10:
				xf.data.xfextRight = xfe[1];
				break;
			case 11:
				xf.data.xfextDiag = xfe[1];
				break;
			case 13:
				xf.xfextFont = xfe[1];
				break;
			case 14:
				xf.fontScheme = xfe[1];
				break;
			case 15: xf.data.cIndent = xfe[1];
		}
	});
}
function parse_BrtMdtinfo(data, length) {
	return {
		flags: data.read_shift(4),
		version: data.read_shift(4),
		name: parse_XLWideString(data, length - 8)
	};
}
function parse_BrtMdb(data) {
	var out = [];
	var cnt = data.read_shift(4);
	while (cnt-- > 0) out.push([data.read_shift(4), data.read_shift(4)]);
	return out;
}
function parse_BrtBeginEsmdb(data) {
	data.l += 4;
	return data.read_shift(4) != 0;
}
function parse_xlmeta_bin(data, name, _opts) {
	var out = {
		Types: [],
		Cell: [],
		Value: []
	};
	var opts = _opts || {};
	var state = [];
	var pass = false;
	var metatype = 2;
	recordhopper(data, function(val, R, RT) {
		switch (RT) {
			case 58: break;
			case 59: break;
			case 335:
				out.Types.push({ name: val.name });
				break;
			case 51:
				val.forEach(function(r) {
					if (metatype == 1) out.Cell.push({
						type: out.Types[r[0] - 1].name,
						index: r[1]
					});
					else if (metatype == 0) out.Value.push({
						type: out.Types[r[0] - 1].name,
						index: r[1]
					});
				});
				break;
			case 337:
				metatype = val ? 1 : 0;
				break;
			case 338:
				metatype = 2;
				break;
			case 35:
				state.push(RT);
				pass = true;
				break;
			case 36:
				state.pop();
				pass = false;
				break;
			default: if (R.T) {} else if (!pass || opts.WTF && state[state.length - 1] != 35) throw new Error("Unexpected record 0x" + RT.toString(16));
		}
	});
	return out;
}
function parse_xlmeta_xml(data, name, opts) {
	var out = {
		Types: [],
		Cell: [],
		Value: []
	};
	if (!data) return out;
	var pass = false;
	var metatype = 2;
	var lastmeta;
	data.replace(tagregex, function(x) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<?xml": break;
			case "<metadata":
			case "</metadata>": break;
			case "<metadataTypes":
			case "</metadataTypes>": break;
			case "<metadataType":
				out.Types.push({ name: y.name });
				break;
			case "</metadataType>": break;
			case "<futureMetadata":
				for (var j = 0; j < out.Types.length; ++j) if (out.Types[j].name == y.name) lastmeta = out.Types[j];
				break;
			case "</futureMetadata>": break;
			case "<bk>": break;
			case "</bk>": break;
			case "<rc":
				if (metatype == 1) out.Cell.push({
					type: out.Types[y.t - 1].name,
					index: +y.v
				});
				else if (metatype == 0) out.Value.push({
					type: out.Types[y.t - 1].name,
					index: +y.v
				});
				break;
			case "</rc>": break;
			case "<cellMetadata":
				metatype = 1;
				break;
			case "</cellMetadata>":
				metatype = 2;
				break;
			case "<valueMetadata":
				metatype = 0;
				break;
			case "</valueMetadata>":
				metatype = 2;
				break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>":
			case "<extLst/>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			case "<rvb":
				if (!lastmeta) break;
				if (!lastmeta.offsets) lastmeta.offsets = [];
				lastmeta.offsets.push(+y.i);
				break;
			default: if (!pass && (opts == null ? void 0 : opts.WTF)) throw new Error("unrecognized " + y[0] + " in metadata");
		}
		return x;
	});
	return out;
}
function parse_cc_xml(data) {
	var d = [];
	if (!data) return d;
	var i = 1;
	(data.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x);
		switch (y[0]) {
			case "<?xml": break;
			case "<calcChain":
			case "<calcChain>":
			case "</calcChain>": break;
			case "<c":
				delete y[0];
				if (y.i) i = y.i;
				else y.i = i;
				d.push(y);
		}
	});
	return d;
}
function parse_BrtCalcChainItem$(data) {
	var out = {};
	out.i = data.read_shift(4);
	var cell = {};
	cell.r = data.read_shift(4);
	cell.c = data.read_shift(4);
	out.r = encode_cell(cell);
	var flags = data.read_shift(1);
	if (flags & 2) out.l = "1";
	if (flags & 8) out.a = "1";
	return out;
}
function parse_cc_bin(data, name, opts) {
	var out = [];
	var pass = false;
	recordhopper(data, function hopper_cc(val, R, RT) {
		switch (RT) {
			case 63:
				out.push(val);
				break;
			default: if (R.T) {} else if (!pass || opts.WTF) throw new Error("Unexpected record 0x" + RT.toString(16));
		}
	});
	return out;
}
function parse_xlink_bin(data, rel, name, _opts) {
	if (!data) return data;
	var opts = _opts || {};
	var pass = false, end = false;
	recordhopper(data, function xlink_parse(val, R, RT) {
		if (end) return;
		switch (RT) {
			case 359:
			case 363:
			case 364:
			case 366:
			case 367:
			case 368:
			case 369:
			case 370:
			case 371:
			case 472:
			case 577:
			case 578:
			case 579:
			case 580:
			case 581:
			case 582:
			case 583:
			case 584:
			case 585:
			case 586:
			case 587:
			case 5108: break;
			case 35:
				pass = true;
				break;
			case 36:
				pass = false;
				break;
			default: if (R.T) {} else if (!pass || opts.WTF) throw new Error("Unexpected record 0x" + RT.toString(16));
		}
	}, opts);
}
function parse_drawing(data, rels) {
	if (!data) return {
		charts: [],
		images: [],
		shapes: [],
		raw: ""
	};
	var out = {
		charts: [],
		images: [],
		shapes: [],
		raw: data
	};
	if (!rels) rels = { "!id": {} };
	(data.match(/<(?:\w+:)?(twoCellAnchor|oneCellAnchor|absoluteAnchor)\b[^>]*>[\s\S]*?<\/(?:\w+:)?\1>/g) || [data]).forEach(function(anchorXml) {
		var anchor = parse_drawing_anchor(anchorXml);
		(anchorXml.match(/<c:chart\b[^<>]*r:id="([^<>"]*)"/g) || []).forEach(function(chartTag) {
			var idm = chartTag.match(/r:id="([^<>"]*)"/);
			if (!idm) return;
			var rel = rels["!id"][idm[1]] || {};
			out.charts.push({
				id: idm[1],
				rel,
				target: rel.Target,
				anchor
			});
		});
		(anchorXml.match(/<a:blip\b[^<>]*(?:r:embed|r:link)="([^<>"]*)"/g) || []).forEach(function(blipTag) {
			var idm = blipTag.match(/(?:r:embed|r:link)="([^<>"]*)"/);
			if (!idm) return;
			var rel = rels["!id"][idm[1]] || {};
			out.images.push({
				id: idm[1],
				rel,
				target: rel.Target,
				anchor
			});
		});
		var tx = parse_drawing_text(anchorXml);
		if (tx) out.shapes.push({
			text: tx,
			anchor,
			raw: anchorXml
		});
	});
	out.chart = out.charts[0] && out.charts[0].target;
	return out;
}
function parse_drawing_marker(data, tag) {
	var m = str_match_xml_ns(data, tag);
	var body = m && m[1] || "";
	function num(name) {
		var v = str_match_xml_ns(body, name);
		return v && v[1] != null ? parseInt(v[1], 10) : 0;
	}
	return {
		col: num("col"),
		colOff: num("colOff"),
		row: num("row"),
		rowOff: num("rowOff")
	};
}
function parse_drawing_anchor(data) {
	var anchor = { type: (data.match(/^<(?:\w+:)?(\w+)/) || [])[1] || "anchor" };
	if (data.indexOf("<xdr:from") >= 0 || data.indexOf("<from") >= 0) anchor.from = parse_drawing_marker(data, "from");
	if (data.indexOf("<xdr:to") >= 0 || data.indexOf("<to") >= 0) anchor.to = parse_drawing_marker(data, "to");
	var pos = data.match(/<(?:\w+:)?pos\b[^<>]*\/>/);
	if (pos) {
		var p = parsexmltag(pos[0]);
		anchor.pos = {
			x: p.x ? parseInt(p.x, 10) : 0,
			y: p.y ? parseInt(p.y, 10) : 0
		};
	}
	var ext = data.match(/<(?:\w+:)?ext\b[^<>]*\/>/);
	if (ext) {
		var e = parsexmltag(ext[0]);
		anchor.ext = {
			cx: e.cx ? parseInt(e.cx, 10) : 0,
			cy: e.cy ? parseInt(e.cy, 10) : 0
		};
	}
	return anchor;
}
function parse_drawing_text(data) {
	var out = [];
	(data.match(/<a:t\b[^>]*>[\s\S]*?<\/a:t>/g) || []).forEach(function(t) {
		out.push(unescapexml(strip_xml_tags(t)));
	});
	return out.join("");
}
function parse_MsoDrawingGroup(blob, length, opts) {
	var data = blob.slice(blob.l, blob.l + length);
	blob.l += length;
	if (!opts || !opts.drawings && !opts.charts) return {
		raw: data,
		blips: [],
		shapes: [],
		images: [],
		charts: [],
		groups: true
	};
	return parse_xls_officeart(data, true);
}
function parse_MsoDrawing(blob, length, opts) {
	var data = blob.slice(blob.l, blob.l + length);
	blob.l += length;
	if (!opts || !opts.drawings && !opts.charts) return {
		raw: data,
		blips: [],
		shapes: [],
		images: [],
		charts: [],
		groups: false
	};
	return parse_xls_officeart(data, false);
}
function xls_officeart_u16(data, off) {
	return data[off] | data[off + 1] << 8;
}
function xls_officeart_u32(data, off) {
	return (data[off] | data[off + 1] << 8 | data[off + 2] << 16 | data[off + 3] << 24) >>> 0;
}
function parse_xls_officeart(data, isGroup) {
	var out = {
		raw: data,
		blips: [],
		shapes: [],
		images: [],
		charts: [],
		groups: !!isGroup
	};
	var state = {
		out,
		current: null
	};
	try {
		walk_xls_officeart(data, 0, data.length, state);
	} catch (e) {
		out.error = e.message || String(e);
	}
	return out;
}
function walk_xls_officeart(data, start, end, state) {
	var pos = start;
	while (pos + 8 <= end && pos + 8 <= data.length) {
		var verinst = xls_officeart_u16(data, pos), fbt = xls_officeart_u16(data, pos + 2), cb = xls_officeart_u32(data, pos + 4);
		var ver = verinst & 15, inst = verinst >> 4, body = pos + 8, next = body + cb;
		if (next > data.length) next = data.length;
		if (fbt == 61444) {
			var shape = {
				raw: data.slice(pos, next),
				props: {}
			};
			state.out.shapes.push(shape);
			var old = state.current;
			state.current = shape;
			walk_xls_officeart(data, body, next, state);
			state.current = old;
		} else if (fbt == 61447) state.out.blips.push(parse_xls_officeart_bse(data, body, next, inst));
		else if (fbt == 61450 && state.current) {
			state.current.spid = xls_officeart_u32(data, body);
			state.current.flags = xls_officeart_u32(data, body + 4);
		} else if (fbt == 61451 && state.current) {
			state.current.props = parse_xls_officeart_props(data, body, next, inst);
			if (state.current.props.pib != null) state.current.blipId = state.current.props.pib;
		} else if (fbt == 61456 && state.current) state.current.anchor = parse_xls_officeart_anchor(data, body, next);
		else if (fbt == 61457 && state.current) state.current.clientData = data.slice(body, next);
		else if (ver == 15) walk_xls_officeart(data, body, next, state);
		pos = next;
	}
}
function parse_xls_officeart_props(data, start, end, count) {
	var props = {}, complex = [], pos = start, i = 0;
	for (; i < count && pos + 6 <= end; ++i, pos += 6) {
		var opid = xls_officeart_u16(data, pos), op = xls_officeart_u32(data, pos + 2), id = opid & 16383;
		props[id] = op;
		if (opid & 16384) complex.push([id, op]);
		if (id == 260) props.pib = op;
		if (id == 261) props.pibName = op;
		if (id == 896) props.fillColor = op;
		if (id == 897) props.fillOpacity = op;
		if (id == 959) props.lineColor = op;
	}
	complex.forEach(function(c) {
		if (pos + c[1] <= end) props["complex_" + c[0]] = data.slice(pos, pos + c[1]);
		pos += c[1];
	});
	return props;
}
function parse_xls_officeart_anchor(data, start, end) {
	if (end - start < 18) return {};
	var pos = start;
	var flags = xls_officeart_u16(data, pos);
	pos += 2;
	var c1 = xls_officeart_u16(data, pos), dx1 = xls_officeart_u16(data, pos + 2), r1 = xls_officeart_u16(data, pos + 4), dy1 = xls_officeart_u16(data, pos + 6);
	pos += 8;
	var c2 = xls_officeart_u16(data, pos), dx2 = xls_officeart_u16(data, pos + 2), r2 = xls_officeart_u16(data, pos + 4), dy2 = xls_officeart_u16(data, pos + 6);
	return {
		type: "twoCellAnchor",
		flags,
		from: {
			col: c1,
			colOff: dx1 * 9525 / 1024,
			row: r1,
			rowOff: dy1 * 9525 / 256
		},
		to: {
			col: c2,
			colOff: dx2 * 9525 / 1024,
			row: r2,
			rowOff: dy2 * 9525 / 256
		}
	};
}
function xls_find_image_magic(data, start, end) {
	for (var i = start; i + 8 <= end; ++i) {
		if (data[i] == 137 && data[i + 1] == 80 && data[i + 2] == 78 && data[i + 3] == 71) return [i, "image/png"];
		if (data[i] == 255 && data[i + 1] == 216 && data[i + 2] == 255) return [i, "image/jpeg"];
		if (data[i] == 66 && data[i + 1] == 77) return [i, "image/bmp"];
	}
	return [start, ""];
}
function parse_xls_officeart_bse(data, start, end, inst) {
	var out = {
		index: inst,
		raw: data.slice(start, end)
	};
	if (end - start < 36) return out;
	out.btWin32 = data[start];
	out.btMacOS = data[start + 1];
	out.size = xls_officeart_u32(data, start + 20);
	out.cRef = xls_officeart_u32(data, start + 24);
	var blip = start + 36;
	if (blip + 8 <= end) {
		out.blipType = xls_officeart_u16(data, blip + 2);
		var bstart = blip + 8, bend = end;
		var magic = xls_find_image_magic(data, bstart, bend);
		if (magic[1]) {
			out.contentType = magic[1];
			out.data = data.slice(magic[0], bend);
			out.dataURI = "data:" + out.contentType + ";base64," + Base64_encode_arr(out.data);
		}
	}
	return out;
}
function parse_vml(data, sheet, comments) {
	var cidx = 0;
	(str_match_xml_ns_g(data, "(?:shape|rect)") || []).forEach(function(m) {
		var type = "";
		var hidden = true;
		var aidx = -1;
		var R = -1, C = -1;
		m.replace(tagregex, function(x, idx) {
			var y = parsexmltag(x);
			switch (strip_ns(y[0])) {
				case "<ClientData":
					if (y.ObjectType) type = y.ObjectType;
					break;
				case "<Visible":
				case "<Visible/>":
					hidden = false;
					break;
				case "<Row":
				case "<Row>":
					aidx = idx + x.length;
					break;
				case "</Row>":
					R = +m.slice(aidx, idx).trim();
					break;
				case "<Column":
				case "<Column>":
					aidx = idx + x.length;
					break;
				case "</Column>": C = +m.slice(aidx, idx).trim();
			}
			return "";
		});
		switch (type) {
			case "Note":
				var cell = ws_get_cell_stub(sheet, R >= 0 && C >= 0 ? encode_cell({
					r: R,
					c: C
				}) : comments[cidx].ref);
				if (cell.c) cell.c.hidden = hidden;
				++cidx;
		}
	});
}
function sheet_insert_comments(sheet, comments, threaded, people) {
	var dense = sheet["!data"] != null;
	var cell;
	comments.forEach(function(comment) {
		var r = decode_cell(comment.ref);
		if (r.r < 0 || r.c < 0) return;
		if (dense) {
			if (!sheet["!data"][r.r]) sheet["!data"][r.r] = [];
			cell = sheet["!data"][r.r][r.c];
		} else cell = sheet[comment.ref];
		if (!cell) {
			cell = { t: "z" };
			if (dense) sheet["!data"][r.r][r.c] = cell;
			else sheet[comment.ref] = cell;
			var range = safe_decode_range(sheet["!ref"] || "BDWGO1000001:A1");
			if (range.s.r > r.r) range.s.r = r.r;
			if (range.e.r < r.r) range.e.r = r.r;
			if (range.s.c > r.c) range.s.c = r.c;
			if (range.e.c < r.c) range.e.c = r.c;
			sheet["!ref"] = encode_range(range);
		}
		if (!cell.c) cell.c = [];
		var o = {
			a: comment.author,
			t: comment.t,
			r: comment.r,
			T: threaded
		};
		if (comment.h) o.h = comment.h;
		for (var i = cell.c.length - 1; i >= 0; --i) {
			if (!threaded && cell.c[i].T) return;
			if (threaded && !cell.c[i].T) cell.c.splice(i, 1);
		}
		if (threaded && people) {
			for (i = 0; i < people.length; ++i) if (o.a == people[i].id) {
				o.a = people[i].name || o.a;
				break;
			}
		}
		cell.c.push(o);
	});
}
function parse_comments_xml(data, opts) {
	if (data.match(/<(?:\w+:)?comments *\/>/)) return [];
	var authors = [];
	var commentList = [];
	var authtag = str_match_xml_ns(data, "authors");
	if (authtag && authtag[1]) authtag[1].split(/<\/\w*:?author>/).forEach(function(x) {
		if (x === "" || x.trim() === "") return;
		var a = x.match(/<(?:\w+:)?author[^<>]*>(.*)/);
		if (a) authors.push(a[1]);
	});
	var cmnttag = str_match_xml_ns(data, "commentList");
	if (cmnttag && cmnttag[1]) cmnttag[1].split(/<\/\w*:?comment>/).forEach(function(x) {
		if (x === "" || x.trim() === "") return;
		var cm = x.match(/<(?:\w+:)?comment[^<>]*>/);
		if (!cm) return;
		var y = parsexmltag(cm[0]);
		var comment = {
			author: y.authorId && authors[y.authorId] || "sheetjsghost",
			ref: y.ref,
			guid: y.guid
		};
		var cell = decode_cell(y.ref);
		if (opts.sheetRows && opts.sheetRows <= cell.r) return;
		var textMatch = str_match_xml_ns(x, "text");
		var rt = !!textMatch && !!textMatch[1] && parse_si(textMatch[1]) || {
			r: "",
			t: "",
			h: ""
		};
		comment.r = rt.r;
		if (rt.r == "<t></t>") rt.t = rt.h = "";
		comment.t = (rt.t || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
		if (opts.cellHTML) comment.h = rt.h;
		commentList.push(comment);
	});
	return commentList;
}
function parse_tcmnt_xml(data, opts) {
	var out = [];
	var pass = false, comment = {}, tidx = 0;
	data.replace(tagregex, function xml_tcmnt(x, idx) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<?xml": break;
			case "<ThreadedComments": break;
			case "</ThreadedComments>": break;
			case "<threadedComment":
				comment = {
					author: y.personId,
					guid: y.id,
					ref: y.ref,
					T: 1
				};
				break;
			case "</threadedComment>":
				if (comment.t != null) out.push(comment);
				break;
			case "<text>":
			case "<text":
				tidx = idx + x.length;
				break;
			case "</text>":
				comment.t = data.slice(tidx, idx).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
				break;
			case "<mentions":
			case "<mentions>":
				pass = true;
				break;
			case "</mentions>":
				pass = false;
				break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>":
			case "<extLst/>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (!pass && opts.WTF) throw new Error("unrecognized " + y[0] + " in threaded comments");
		}
		return x;
	});
	return out;
}
function parse_people_xml(data, opts) {
	var out = [];
	var pass = false;
	data.replace(tagregex, function xml_tcmnt(x) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<?xml": break;
			case "<personList": break;
			case "</personList>": break;
			case "<person":
				out.push({
					name: y.displayname,
					id: y.id
				});
				break;
			case "</person>": break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>":
			case "<extLst/>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (!pass && opts.WTF) throw new Error("unrecognized " + y[0] + " in threaded comments");
		}
		return x;
	});
	return out;
}
function parse_BrtBeginComment(data) {
	var out = {};
	out.iauthor = data.read_shift(4);
	var rfx = parse_UncheckedRfX(data, 16);
	out.rfx = rfx.s;
	out.ref = encode_cell(rfx.s);
	data.l += 16;
	return out;
}
var parse_BrtCommentAuthor = parse_XLWideString;
function parse_comments_bin(data, opts) {
	var out = [];
	var authors = [];
	var c = {};
	var pass = false;
	recordhopper(data, function hopper_cmnt(val, R, RT) {
		switch (RT) {
			case 632:
				authors.push(val);
				break;
			case 635:
				c = val;
				break;
			case 637:
				c.t = val.t;
				c.h = val.h;
				c.r = val.r;
				break;
			case 636:
				c.author = authors[c.iauthor];
				delete c.iauthor;
				if (opts.sheetRows && c.rfx && opts.sheetRows <= c.rfx.r) break;
				if (!c.t) c.t = "";
				delete c.rfx;
				out.push(c);
				break;
			case 3072: break;
			case 35:
				pass = true;
				break;
			case 36:
				pass = false;
				break;
			case 37: break;
			case 38: break;
			default: if (R.T) {} else if (!pass || opts.WTF) throw new Error("Unexpected record 0x" + RT.toString(16));
		}
	});
	return out;
}
var CT_VBA = "application/vnd.ms-office.vbaProject";
function make_vba_xls(cfb) {
	var newcfb = CFB.utils.cfb_new({ root: "R" });
	cfb.FullPaths.forEach(function(p, i) {
		if (p.slice(-1) === "/" || !p.match(/_VBA_PROJECT_CUR/)) return;
		var newpath = p.replace(/^[^\/]*/, "R").replace(/\/_VBA_PROJECT_CUR\u0000*/, "");
		CFB.utils.cfb_add(newcfb, newpath, cfb.FileIndex[i].content);
	});
	return CFB.write(newcfb);
}
function parse_ds_bin() {
	return { "!type": "dialog" };
}
function parse_ds_xml() {
	return { "!type": "dialog" };
}
function parse_ms_bin() {
	return { "!type": "macro" };
}
function parse_ms_xml() {
	return { "!type": "macro" };
}
var rc_to_a1 = /*#__PURE__*/ (function() {
	var rcregex = /(^|[^A-Za-z_])R(\[?-?\d+\]|[1-9]\d*|)C(\[?-?\d+\]|[1-9]\d*|)(?![A-Za-z0-9_])/g;
	var rcbase = {
		r: 0,
		c: 0
	};
	function rcfunc($$, $1, $2, $3) {
		var cRel = false, rRel = false;
		if ($2.length == 0) rRel = true;
		else if ($2.charAt(0) == "[") {
			rRel = true;
			$2 = $2.slice(1, -1);
		}
		if ($3.length == 0) cRel = true;
		else if ($3.charAt(0) == "[") {
			cRel = true;
			$3 = $3.slice(1, -1);
		}
		var R = $2.length > 0 ? parseInt($2, 10) | 0 : 0, C = $3.length > 0 ? parseInt($3, 10) | 0 : 0;
		if (cRel) C += rcbase.c;
		else --C;
		if (rRel) R += rcbase.r;
		else --R;
		return $1 + (cRel ? "" : "$") + encode_col(C) + (rRel ? "" : "$") + encode_row(R);
	}
	return function rc_to_a1(fstr, base) {
		rcbase = base;
		return fstr.replace(rcregex, rcfunc);
	};
})();
var crefregex = /(^|[^._A-Za-z0-9])(\$?)([A-Z]{1,2}|[A-W][A-Z]{2}|X[A-E][A-Z]|XF[A-D])(\$?)(\d{1,7})(?![_.\(A-Za-z0-9])/g;
try {
	crefregex = /(^|[^._A-Za-z0-9])([$]?)([A-Z]{1,2}|[A-W][A-Z]{2}|X[A-E][A-Z]|XF[A-D])([$]?)(10[0-3]\d{4}|104[0-7]\d{3}|1048[0-4]\d{2}|10485[0-6]\d|104857[0-6]|[1-9]\d{0,5})(?![_.\(A-Za-z0-9])/g;
} catch (e) {}
var a1_to_rc = /*#__PURE__*/ (function() {
	return function a1_to_rc(fstr, base) {
		return fstr.replace(crefregex, function($0, $1, $2, $3, $4, $5) {
			var c = decode_col($3) - ($2 ? 0 : base.c);
			var r = decode_row($5) - ($4 ? 0 : base.r);
			var R = $4 == "$" ? r + 1 : r == 0 ? "" : "[" + r + "]";
			var C = $2 == "$" ? c + 1 : c == 0 ? "" : "[" + c + "]";
			return $1 + "R" + R + "C" + C;
		});
	};
})();
function shift_formula_str(f, delta) {
	return f.replace(crefregex, function($0, $1, $2, $3, $4, $5) {
		return $1 + ($2 == "$" ? $2 + $3 : encode_col(decode_col($3) + delta.c)) + ($4 == "$" ? $4 + $5 : encode_row(decode_row($5) + delta.r));
	});
}
function shift_formula_xlsx(f, range, cell) {
	var s = decode_range(range).s, c = decode_cell(cell);
	return shift_formula_str(f, {
		r: c.r - s.r,
		c: c.c - s.c
	});
}
function fuzzyfmla(f) {
	if (f.length == 1) return false;
	return true;
}
function _xlfn(f) {
	return f.replace(/_xlfn\./g, "");
}
function parseread1(blob) {
	blob.l += 1;
}
function parse_ColRelU(blob, length) {
	var c = blob.read_shift(length == 1 ? 1 : 2);
	return [
		c & 16383,
		c >> 14 & 1,
		c >> 15 & 1
	];
}
function parse_RgceArea(blob, length, opts) {
	var w = 2;
	if (opts) {
		if (opts.biff >= 2 && opts.biff <= 5) return parse_RgceArea_BIFF2(blob, length, opts);
		else if (opts.biff == 12) w = 4;
	}
	var r = blob.read_shift(w), R = blob.read_shift(w);
	var c = parse_ColRelU(blob, 2);
	var C = parse_ColRelU(blob, 2);
	return {
		s: {
			r,
			c: c[0],
			cRel: c[1],
			rRel: c[2]
		},
		e: {
			r: R,
			c: C[0],
			cRel: C[1],
			rRel: C[2]
		}
	};
}
function parse_RgceArea_BIFF2(blob) {
	var r = parse_ColRelU(blob, 2), R = parse_ColRelU(blob, 2);
	var c = blob.read_shift(1);
	var C = blob.read_shift(1);
	return {
		s: {
			r: r[0],
			c,
			cRel: r[1],
			rRel: r[2]
		},
		e: {
			r: R[0],
			c: C,
			cRel: R[1],
			rRel: R[2]
		}
	};
}
function parse_RgceAreaRel(blob, length, opts) {
	if (opts.biff < 8) return parse_RgceArea_BIFF2(blob, length, opts);
	var r = blob.read_shift(opts.biff == 12 ? 4 : 2), R = blob.read_shift(opts.biff == 12 ? 4 : 2);
	var c = parse_ColRelU(blob, 2);
	var C = parse_ColRelU(blob, 2);
	return {
		s: {
			r,
			c: c[0],
			cRel: c[1],
			rRel: c[2]
		},
		e: {
			r: R,
			c: C[0],
			cRel: C[1],
			rRel: C[2]
		}
	};
}
function parse_RgceLoc(blob, length, opts) {
	if (opts && opts.biff >= 2 && opts.biff <= 5) return parse_RgceLoc_BIFF2(blob, length, opts);
	var r = blob.read_shift(opts && opts.biff == 12 ? 4 : 2);
	var c = parse_ColRelU(blob, 2);
	return {
		r,
		c: c[0],
		cRel: c[1],
		rRel: c[2]
	};
}
function parse_RgceLoc_BIFF2(blob) {
	var r = parse_ColRelU(blob, 2);
	var c = blob.read_shift(1);
	return {
		r: r[0],
		c,
		cRel: r[1],
		rRel: r[2]
	};
}
function parse_RgceElfLoc(blob) {
	var r = blob.read_shift(2);
	var c = blob.read_shift(2);
	return {
		r,
		c: c & 255,
		fQuoted: !!(c & 16384),
		cRel: c >> 15,
		rRel: c >> 15
	};
}
function parse_RgceLocRel(blob, length, opts) {
	var biff = opts && opts.biff ? opts.biff : 8;
	if (biff >= 2 && biff <= 5) return parse_RgceLocRel_BIFF2(blob, length, opts);
	var r = blob.read_shift(biff >= 12 ? 4 : 2);
	var cl = blob.read_shift(2);
	var cRel = (cl & 16384) >> 14, rRel = (cl & 32768) >> 15;
	cl &= 16383;
	if (rRel == 1) while (r > 524287) r -= 1048576;
	if (cRel == 1) while (cl > 8191) cl = cl - 16384;
	return {
		r,
		c: cl,
		cRel,
		rRel
	};
}
function parse_RgceLocRel_BIFF2(blob) {
	var rl = blob.read_shift(2);
	var c = blob.read_shift(1);
	var rRel = (rl & 32768) >> 15, cRel = (rl & 16384) >> 14;
	rl &= 16383;
	if (rRel == 1 && rl >= 8192) rl = rl - 16384;
	if (cRel == 1 && c >= 128) c = c - 256;
	return {
		r: rl,
		c,
		cRel,
		rRel
	};
}
function parse_PtgArea(blob, length, opts) {
	return [(blob[blob.l++] & 96) >> 5, parse_RgceArea(blob, opts.biff >= 2 && opts.biff <= 5 ? 6 : 8, opts)];
}
function parse_PtgArea3d(blob, length, opts) {
	var type = (blob[blob.l++] & 96) >> 5;
	var ixti = blob.read_shift(2, "i");
	var w = 8;
	if (opts) switch (opts.biff) {
		case 5:
			blob.l += 12;
			w = 6;
			break;
		case 12:
			w = 12;
			break;
	}
	return [
		type,
		ixti,
		parse_RgceArea(blob, w, opts)
	];
}
function parse_PtgAreaErr(blob, length, opts) {
	var type = (blob[blob.l++] & 96) >> 5;
	blob.l += opts && opts.biff > 8 ? 12 : opts.biff < 8 ? 6 : 8;
	return [type];
}
function parse_PtgAreaErr3d(blob, length, opts) {
	var type = (blob[blob.l++] & 96) >> 5;
	var ixti = blob.read_shift(2);
	var w = 8;
	if (opts) switch (opts.biff) {
		case 5:
			blob.l += 12;
			w = 6;
			break;
		case 12:
			w = 12;
			break;
	}
	blob.l += w;
	return [type, ixti];
}
function parse_PtgAreaN(blob, length, opts) {
	return [(blob[blob.l++] & 96) >> 5, parse_RgceAreaRel(blob, length - 1, opts)];
}
function parse_PtgArray(blob, length, opts) {
	var type = (blob[blob.l++] & 96) >> 5;
	blob.l += opts.biff == 2 ? 6 : opts.biff == 12 ? 14 : 7;
	return [type];
}
function parse_PtgAttrBaxcel(blob) {
	var bitSemi = blob[blob.l + 1] & 1;
	var bitBaxcel = 1;
	blob.l += 4;
	return [bitSemi, bitBaxcel];
}
function parse_PtgAttrChoose(blob, length, opts) {
	blob.l += 2;
	var offset = blob.read_shift(opts && opts.biff == 2 ? 1 : 2);
	var o = [];
	for (var i = 0; i <= offset; ++i) o.push(blob.read_shift(opts && opts.biff == 2 ? 1 : 2));
	return o;
}
function parse_PtgAttrGoto(blob, length, opts) {
	var bitGoto = blob[blob.l + 1] & 255 ? 1 : 0;
	blob.l += 2;
	return [bitGoto, blob.read_shift(opts && opts.biff == 2 ? 1 : 2)];
}
function parse_PtgAttrIf(blob, length, opts) {
	var bitIf = blob[blob.l + 1] & 255 ? 1 : 0;
	blob.l += 2;
	return [bitIf, blob.read_shift(opts && opts.biff == 2 ? 1 : 2)];
}
function parse_PtgAttrIfError(blob) {
	var bitIf = blob[blob.l + 1] & 255 ? 1 : 0;
	blob.l += 2;
	return [bitIf, blob.read_shift(2)];
}
function parse_PtgAttrSemi(blob, length, opts) {
	var bitSemi = blob[blob.l + 1] & 255 ? 1 : 0;
	blob.l += opts && opts.biff == 2 ? 3 : 4;
	return [bitSemi];
}
function parse_PtgAttrSpaceType(blob) {
	return [blob.read_shift(1), blob.read_shift(1)];
}
function parse_PtgAttrSpace(blob) {
	blob.read_shift(2);
	return parse_PtgAttrSpaceType(blob, 2);
}
function parse_PtgAttrSpaceSemi(blob) {
	blob.read_shift(2);
	return parse_PtgAttrSpaceType(blob, 2);
}
function parse_PtgRef(blob, length, opts) {
	var type = (blob[blob.l] & 96) >> 5;
	blob.l += 1;
	return [type, parse_RgceLoc(blob, 0, opts)];
}
function parse_PtgRefN(blob, length, opts) {
	var type = (blob[blob.l] & 96) >> 5;
	blob.l += 1;
	return [type, parse_RgceLocRel(blob, 0, opts)];
}
function parse_PtgRef3d(blob, length, opts) {
	var type = (blob[blob.l] & 96) >> 5;
	blob.l += 1;
	var ixti = blob.read_shift(2);
	if (opts && opts.biff == 5) blob.l += 12;
	return [
		type,
		ixti,
		parse_RgceLoc(blob, 0, opts)
	];
}
function parse_PtgFunc(blob, length, opts) {
	var type = (blob[blob.l] & 96) >> 5;
	blob.l += 1;
	var iftab = blob.read_shift(opts && opts.biff <= 3 ? 1 : 2);
	return [
		FtabArgc[iftab],
		Ftab[iftab],
		type
	];
}
function parse_PtgFuncVar(blob, length, opts) {
	var type = blob[blob.l++];
	var cparams = blob.read_shift(1), tab = opts && opts.biff <= 3 ? [type == 88 ? -1 : 0, blob.read_shift(1)] : parsetab(blob);
	return [cparams, (tab[0] === 0 ? Ftab : Cetab)[tab[1]]];
}
function parsetab(blob) {
	return [blob[blob.l + 1] >> 7, blob.read_shift(2) & 32767];
}
function parse_PtgAttrSum(blob, length, opts) {
	blob.l += opts && opts.biff == 2 ? 3 : 4;
}
function parse_PtgExp(blob, length, opts) {
	blob.l++;
	if (opts && opts.biff == 12) return [blob.read_shift(4, "i"), 0];
	return [blob.read_shift(2), blob.read_shift(opts && opts.biff == 2 ? 1 : 2)];
}
function parse_PtgErr(blob) {
	blob.l++;
	return BErr[blob.read_shift(1)];
}
function parse_PtgInt(blob) {
	blob.l++;
	return blob.read_shift(2);
}
function parse_PtgBool(blob) {
	blob.l++;
	return blob.read_shift(1) !== 0;
}
function parse_PtgNum(blob) {
	blob.l++;
	return parse_Xnum(blob, 8);
}
function parse_PtgStr(blob, length, opts) {
	blob.l++;
	return parse_ShortXLUnicodeString(blob, length - 1, opts);
}
function parse_SerAr(blob, biff) {
	var val = [blob.read_shift(1)];
	if (biff == 12) switch (val[0]) {
		case 2:
			val[0] = 4;
			break;
		case 4:
			val[0] = 16;
			break;
		case 0:
			val[0] = 1;
			break;
		case 1:
			val[0] = 2;
			break;
	}
	switch (val[0]) {
		case 4:
			val[1] = parsebool(blob, 1) ? "TRUE" : "FALSE";
			if (biff != 12) blob.l += 7;
			break;
		case 37:
		case 16:
			val[1] = BErr[blob[blob.l]];
			blob.l += biff == 12 ? 4 : 8;
			break;
		case 0:
			blob.l += 8;
			break;
		case 1:
			val[1] = parse_Xnum(blob, 8);
			break;
		case 2:
			val[1] = parse_XLUnicodeString2(blob, 0, { biff: biff > 0 && biff < 8 ? 2 : biff });
			break;
		default: throw new Error("Bad SerAr: " + val[0]);
	}
	return val;
}
function parse_PtgExtraMem(blob, cce, opts) {
	var count = blob.read_shift(opts.biff == 12 ? 4 : 2);
	var out = [];
	for (var i = 0; i != count; ++i) out.push((opts.biff == 12 ? parse_UncheckedRfX : parse_Ref8U)(blob, 8));
	return out;
}
function parse_PtgExtraArray(blob, length, opts) {
	var rows = 0, cols = 0;
	if (opts.biff == 12) {
		rows = blob.read_shift(4);
		cols = blob.read_shift(4);
	} else {
		cols = 1 + blob.read_shift(1);
		rows = 1 + blob.read_shift(2);
	}
	if (opts.biff >= 2 && opts.biff < 8) {
		--rows;
		if (--cols == 0) cols = 256;
	}
	for (var i = 0, o = []; i != rows && (o[i] = []); ++i) for (var j = 0; j != cols; ++j) o[i][j] = parse_SerAr(blob, opts.biff);
	return o;
}
function parse_PtgName(blob, length, opts) {
	var type = blob.read_shift(1) >>> 5 & 3;
	var w = !opts || opts.biff >= 8 ? 4 : 2;
	var nameindex = blob.read_shift(w);
	switch (opts.biff) {
		case 2:
			blob.l += 5;
			break;
		case 3:
		case 4:
			blob.l += 8;
			break;
		case 5: blob.l += 12;
	}
	return [
		type,
		0,
		nameindex
	];
}
function parse_PtgNameX(blob, length, opts) {
	if (opts.biff == 5) return parse_PtgNameX_BIFF5(blob, length, opts);
	return [
		blob.read_shift(1) >>> 5 & 3,
		blob.read_shift(2),
		blob.read_shift(4)
	];
}
function parse_PtgNameX_BIFF5(blob) {
	var type = blob.read_shift(1) >>> 5 & 3;
	var ixti = blob.read_shift(2, "i");
	blob.l += 8;
	var nameindex = blob.read_shift(2);
	blob.l += 12;
	return [
		type,
		ixti,
		nameindex
	];
}
function parse_PtgMemArea(blob, length, opts) {
	var type = blob.read_shift(1) >>> 5 & 3;
	blob.l += opts && opts.biff == 2 ? 3 : 4;
	return [type, blob.read_shift(opts && opts.biff == 2 ? 1 : 2)];
}
function parse_PtgMemFunc(blob, length, opts) {
	return [blob.read_shift(1) >>> 5 & 3, blob.read_shift(opts && opts.biff == 2 ? 1 : 2)];
}
function parse_PtgRefErr(blob, length, opts) {
	var type = blob.read_shift(1) >>> 5 & 3;
	blob.l += 4;
	if (opts.biff < 8) blob.l--;
	if (opts.biff == 12) blob.l += 2;
	return [type];
}
function parse_PtgRefErr3d(blob, length, opts) {
	var type = (blob[blob.l++] & 96) >> 5;
	var ixti = blob.read_shift(2);
	var w = 4;
	if (opts) switch (opts.biff) {
		case 5:
			w = 15;
			break;
		case 12:
			w = 6;
			break;
	}
	blob.l += w;
	return [type, ixti];
}
var parse_PtgMemErr = parsenoop;
var parse_PtgMemNoMem = parsenoop;
var parse_PtgTbl = parsenoop;
function parse_PtgElfLoc(blob, length, opts) {
	blob.l += 2;
	return [parse_RgceElfLoc(blob, 4, opts)];
}
function parse_PtgElfNoop(blob) {
	blob.l += 6;
	return [];
}
var parse_PtgElfCol = parse_PtgElfLoc;
var parse_PtgElfColS = parse_PtgElfNoop;
var parse_PtgElfColSV = parse_PtgElfNoop;
var parse_PtgElfColV = parse_PtgElfLoc;
function parse_PtgElfLel(blob) {
	blob.l += 2;
	return [parseuint16(blob), blob.read_shift(2) & 1];
}
var parse_PtgElfRadical = parse_PtgElfLoc;
var parse_PtgElfRadicalLel = parse_PtgElfLel;
var parse_PtgElfRadicalS = parse_PtgElfNoop;
var parse_PtgElfRw = parse_PtgElfLoc;
var parse_PtgElfRwV = parse_PtgElfLoc;
var PtgListRT = [
	"Data",
	"All",
	"Headers",
	"??",
	"?Data2",
	"??",
	"?DataHeaders",
	"??",
	"Totals",
	"??",
	"??",
	"??",
	"?DataTotals",
	"??",
	"??",
	"??",
	"?Current"
];
function parse_PtgList(blob) {
	blob.l += 2;
	var ixti = blob.read_shift(2);
	var flags = blob.read_shift(2);
	var idx = blob.read_shift(4);
	var c = blob.read_shift(2);
	var C = blob.read_shift(2);
	var rt = PtgListRT[flags >> 2 & 31];
	return {
		ixti,
		coltype: flags & 3,
		rt,
		idx,
		c,
		C
	};
}
function parse_PtgSxName(blob) {
	blob.l += 2;
	return [blob.read_shift(4)];
}
function parse_PtgSheet(blob, length, opts) {
	blob.l += 5;
	blob.l += 2;
	blob.l += opts.biff == 2 ? 1 : 4;
	return ["PTGSHEET"];
}
function parse_PtgEndSheet(blob, length, opts) {
	blob.l += opts.biff == 2 ? 4 : 5;
	return ["PTGENDSHEET"];
}
function parse_PtgMemAreaN(blob) {
	return [blob.read_shift(1) >>> 5 & 3, blob.read_shift(2)];
}
function parse_PtgMemNoMemN(blob) {
	return [blob.read_shift(1) >>> 5 & 3, blob.read_shift(2)];
}
function parse_PtgAttrNoop(blob) {
	blob.l += 4;
	return [0, 0];
}
var PtgTypes = {
	1: {
		n: "PtgExp",
		f: parse_PtgExp
	},
	2: {
		n: "PtgTbl",
		f: parse_PtgTbl
	},
	3: {
		n: "PtgAdd",
		f: parseread1
	},
	4: {
		n: "PtgSub",
		f: parseread1
	},
	5: {
		n: "PtgMul",
		f: parseread1
	},
	6: {
		n: "PtgDiv",
		f: parseread1
	},
	7: {
		n: "PtgPower",
		f: parseread1
	},
	8: {
		n: "PtgConcat",
		f: parseread1
	},
	9: {
		n: "PtgLt",
		f: parseread1
	},
	10: {
		n: "PtgLe",
		f: parseread1
	},
	11: {
		n: "PtgEq",
		f: parseread1
	},
	12: {
		n: "PtgGe",
		f: parseread1
	},
	13: {
		n: "PtgGt",
		f: parseread1
	},
	14: {
		n: "PtgNe",
		f: parseread1
	},
	15: {
		n: "PtgIsect",
		f: parseread1
	},
	16: {
		n: "PtgUnion",
		f: parseread1
	},
	17: {
		n: "PtgRange",
		f: parseread1
	},
	18: {
		n: "PtgUplus",
		f: parseread1
	},
	19: {
		n: "PtgUminus",
		f: parseread1
	},
	20: {
		n: "PtgPercent",
		f: parseread1
	},
	21: {
		n: "PtgParen",
		f: parseread1
	},
	22: {
		n: "PtgMissArg",
		f: parseread1
	},
	23: {
		n: "PtgStr",
		f: parse_PtgStr
	},
	26: {
		n: "PtgSheet",
		f: parse_PtgSheet
	},
	27: {
		n: "PtgEndSheet",
		f: parse_PtgEndSheet
	},
	28: {
		n: "PtgErr",
		f: parse_PtgErr
	},
	29: {
		n: "PtgBool",
		f: parse_PtgBool
	},
	30: {
		n: "PtgInt",
		f: parse_PtgInt
	},
	31: {
		n: "PtgNum",
		f: parse_PtgNum
	},
	32: {
		n: "PtgArray",
		f: parse_PtgArray
	},
	33: {
		n: "PtgFunc",
		f: parse_PtgFunc
	},
	34: {
		n: "PtgFuncVar",
		f: parse_PtgFuncVar
	},
	35: {
		n: "PtgName",
		f: parse_PtgName
	},
	36: {
		n: "PtgRef",
		f: parse_PtgRef
	},
	37: {
		n: "PtgArea",
		f: parse_PtgArea
	},
	38: {
		n: "PtgMemArea",
		f: parse_PtgMemArea
	},
	39: {
		n: "PtgMemErr",
		f: parse_PtgMemErr
	},
	40: {
		n: "PtgMemNoMem",
		f: parse_PtgMemNoMem
	},
	41: {
		n: "PtgMemFunc",
		f: parse_PtgMemFunc
	},
	42: {
		n: "PtgRefErr",
		f: parse_PtgRefErr
	},
	43: {
		n: "PtgAreaErr",
		f: parse_PtgAreaErr
	},
	44: {
		n: "PtgRefN",
		f: parse_PtgRefN
	},
	45: {
		n: "PtgAreaN",
		f: parse_PtgAreaN
	},
	46: {
		n: "PtgMemAreaN",
		f: parse_PtgMemAreaN
	},
	47: {
		n: "PtgMemNoMemN",
		f: parse_PtgMemNoMemN
	},
	57: {
		n: "PtgNameX",
		f: parse_PtgNameX
	},
	58: {
		n: "PtgRef3d",
		f: parse_PtgRef3d
	},
	59: {
		n: "PtgArea3d",
		f: parse_PtgArea3d
	},
	60: {
		n: "PtgRefErr3d",
		f: parse_PtgRefErr3d
	},
	61: {
		n: "PtgAreaErr3d",
		f: parse_PtgAreaErr3d
	},
	255: {}
};
var PtgDupes = {
	64: 32,
	96: 32,
	65: 33,
	97: 33,
	66: 34,
	98: 34,
	67: 35,
	99: 35,
	68: 36,
	100: 36,
	69: 37,
	101: 37,
	70: 38,
	102: 38,
	71: 39,
	103: 39,
	72: 40,
	104: 40,
	73: 41,
	105: 41,
	74: 42,
	106: 42,
	75: 43,
	107: 43,
	76: 44,
	108: 44,
	77: 45,
	109: 45,
	78: 46,
	110: 46,
	79: 47,
	111: 47,
	88: 34,
	120: 34,
	89: 57,
	121: 57,
	90: 58,
	122: 58,
	91: 59,
	123: 59,
	92: 60,
	124: 60,
	93: 61,
	125: 61
};
var Ptg18 = {
	1: {
		n: "PtgElfLel",
		f: parse_PtgElfLel
	},
	2: {
		n: "PtgElfRw",
		f: parse_PtgElfRw
	},
	3: {
		n: "PtgElfCol",
		f: parse_PtgElfCol
	},
	6: {
		n: "PtgElfRwV",
		f: parse_PtgElfRwV
	},
	7: {
		n: "PtgElfColV",
		f: parse_PtgElfColV
	},
	10: {
		n: "PtgElfRadical",
		f: parse_PtgElfRadical
	},
	11: {
		n: "PtgElfRadicalS",
		f: parse_PtgElfRadicalS
	},
	13: {
		n: "PtgElfColS",
		f: parse_PtgElfColS
	},
	15: {
		n: "PtgElfColSV",
		f: parse_PtgElfColSV
	},
	16: {
		n: "PtgElfRadicalLel",
		f: parse_PtgElfRadicalLel
	},
	25: {
		n: "PtgList",
		f: parse_PtgList
	},
	29: {
		n: "PtgSxName",
		f: parse_PtgSxName
	},
	255: {}
};
var Ptg19 = {
	0: {
		n: "PtgAttrNoop",
		f: parse_PtgAttrNoop
	},
	1: {
		n: "PtgAttrSemi",
		f: parse_PtgAttrSemi
	},
	2: {
		n: "PtgAttrIf",
		f: parse_PtgAttrIf
	},
	4: {
		n: "PtgAttrChoose",
		f: parse_PtgAttrChoose
	},
	8: {
		n: "PtgAttrGoto",
		f: parse_PtgAttrGoto
	},
	16: {
		n: "PtgAttrSum",
		f: parse_PtgAttrSum
	},
	32: {
		n: "PtgAttrBaxcel",
		f: parse_PtgAttrBaxcel
	},
	33: {
		n: "PtgAttrBaxcel",
		f: parse_PtgAttrBaxcel
	},
	64: {
		n: "PtgAttrSpace",
		f: parse_PtgAttrSpace
	},
	65: {
		n: "PtgAttrSpaceSemi",
		f: parse_PtgAttrSpaceSemi
	},
	128: {
		n: "PtgAttrIfError",
		f: parse_PtgAttrIfError
	},
	255: {}
};
function parse_RgbExtra(blob, length, rgce, opts) {
	if (opts.biff < 8) return parsenoop(blob, length);
	var target = blob.l + length;
	var o = [];
	for (var i = 0; i !== rgce.length; ++i) switch (rgce[i][0]) {
		case "PtgArray":
			rgce[i][1] = parse_PtgExtraArray(blob, 0, opts);
			o.push(rgce[i][1]);
			break;
		case "PtgMemArea":
			rgce[i][2] = parse_PtgExtraMem(blob, rgce[i][1], opts);
			o.push(rgce[i][2]);
			break;
		case "PtgExp":
			if (opts && opts.biff == 12) {
				rgce[i][1][1] = blob.read_shift(4);
				o.push(rgce[i][1]);
			}
			break;
		case "PtgList":
		case "PtgElfRadicalS":
		case "PtgElfColS":
		case "PtgElfColSV": throw "Unsupported " + rgce[i][0];
	}
	length = target - blob.l;
	if (length !== 0) o.push(parsenoop(blob, length));
	return o;
}
function parse_Rgce(blob, length, opts) {
	var target = blob.l + length;
	var R, id, ptgs = [];
	while (target != blob.l) {
		length = target - blob.l;
		id = blob[blob.l];
		R = PtgTypes[id] || PtgTypes[PtgDupes[id]];
		if (id === 24 || id === 25) R = (id === 24 ? Ptg18 : Ptg19)[blob[blob.l + 1]];
		if (!R || !R.f) parsenoop(blob, length);
		else ptgs.push([R.n, R.f(blob, length, opts)]);
	}
	return ptgs;
}
function stringify_array(f) {
	var o = [];
	for (var i = 0; i < f.length; ++i) {
		var x = f[i], r = [];
		for (var j = 0; j < x.length; ++j) {
			var y = x[j];
			if (y) switch (y[0]) {
				case 2:
					r.push("\"" + y[1].replace(/"/g, "\"\"") + "\"");
					break;
				default: r.push(y[1]);
			}
			else r.push("");
		}
		o.push(r.join(","));
	}
	return o.join(";");
}
var PtgBinOp = {
	PtgAdd: "+",
	PtgConcat: "&",
	PtgDiv: "/",
	PtgEq: "=",
	PtgGe: ">=",
	PtgGt: ">",
	PtgLe: "<=",
	PtgLt: "<",
	PtgMul: "*",
	PtgNe: "<>",
	PtgPower: "^",
	PtgSub: "-"
};
function make_3d_range(start, end) {
	var s = start.lastIndexOf("!"), e = end.lastIndexOf("!");
	if (s == -1 && e == -1) return start + ":" + end;
	if (s > 0 && e > 0 && start.slice(0, s).toLowerCase() == end.slice(0, e).toLowerCase()) return start + ":" + end.slice(e + 1);
	console.error("Cannot hydrate range", start, end);
	return start + ":" + end;
}
function get_ixti_raw(supbooks, ixti, opts) {
	if (!supbooks) return "SH33TJSERR0";
	if (opts.biff > 8 && (!supbooks.XTI || !supbooks.XTI[ixti])) return supbooks.SheetNames[ixti];
	if (!supbooks.XTI) return "SH33TJSERR6";
	var XTI = supbooks.XTI[ixti];
	if (opts.biff < 8) {
		if (ixti > 1e4) ixti -= 65536;
		if (ixti < 0) ixti = -ixti;
		return ixti == 0 ? "" : supbooks.XTI[ixti - 1];
	}
	if (!XTI) return "SH33TJSERR1";
	var o = "";
	if (opts.biff > 8) switch (supbooks[XTI[0]][0]) {
		case 357:
			o = XTI[1] == -1 ? "#REF" : supbooks.SheetNames[XTI[1]];
			return XTI[1] == XTI[2] ? o : o + ":" + supbooks.SheetNames[XTI[2]];
		case 358:
			if (opts.SID != null) return supbooks.SheetNames[opts.SID];
			return "SH33TJSSAME" + supbooks[XTI[0]][0];
		case 355:
		default: return "SH33TJSSRC" + supbooks[XTI[0]][0];
	}
	switch (supbooks[XTI[0]][0][0]) {
		case 1025:
			o = XTI[1] == -1 ? "#REF" : supbooks.SheetNames[XTI[1]] || "SH33TJSERR3";
			return XTI[1] == XTI[2] ? o : o + ":" + supbooks.SheetNames[XTI[2]];
		case 14849: return supbooks[XTI[0]].slice(1).map(function(name) {
			return name.Name;
		}).join(";;");
		default:
			if (!supbooks[XTI[0]][0][3]) return "SH33TJSERR2";
			o = XTI[1] == -1 ? "#REF" : supbooks[XTI[0]][0][3][XTI[1]] || "SH33TJSERR4";
			return XTI[1] == XTI[2] ? o : o + ":" + supbooks[XTI[0]][0][3][XTI[2]];
	}
}
function get_ixti(supbooks, ixti, opts) {
	var ixtiraw = get_ixti_raw(supbooks, ixti, opts);
	return ixtiraw == "#REF" ? ixtiraw : formula_quote_sheet_name(ixtiraw, opts);
}
function stringify_formula(formula, range, cell, supbooks, opts) {
	var biff = opts && opts.biff || 8;
	var _range = {
		s: {
			c: 0,
			r: 0
		},
		e: {
			c: 0,
			r: 0
		}
	};
	var stack = [], e1, e2, c, ixti = 0, nameidx = 0, r, sname = "";
	if (!formula[0] || !formula[0][0]) return "";
	var last_sp = -1, sp = "";
	for (var ff = 0, fflen = formula[0].length; ff < fflen; ++ff) {
		var f = formula[0][ff];
		switch (f[0]) {
			case "PtgUminus":
				stack.push("-" + stack.pop());
				break;
			case "PtgUplus":
				stack.push("+" + stack.pop());
				break;
			case "PtgPercent":
				stack.push(stack.pop() + "%");
				break;
			case "PtgAdd":
			case "PtgConcat":
			case "PtgDiv":
			case "PtgEq":
			case "PtgGe":
			case "PtgGt":
			case "PtgLe":
			case "PtgLt":
			case "PtgMul":
			case "PtgNe":
			case "PtgPower":
			case "PtgSub":
				e1 = stack.pop();
				e2 = stack.pop();
				if (last_sp >= 0) {
					switch (formula[0][last_sp][1][0]) {
						case 0:
							sp = fill(" ", formula[0][last_sp][1][1]);
							break;
						case 1:
							sp = fill("\r", formula[0][last_sp][1][1]);
							break;
						default:
							sp = "";
							if (opts.WTF) throw new Error("Unexpected PtgAttrSpaceType " + formula[0][last_sp][1][0]);
					}
					e2 = e2 + sp;
					last_sp = -1;
				}
				stack.push(e2 + PtgBinOp[f[0]] + e1);
				break;
			case "PtgIsect":
				e1 = stack.pop();
				e2 = stack.pop();
				stack.push(e2 + " " + e1);
				break;
			case "PtgUnion":
				e1 = stack.pop();
				e2 = stack.pop();
				stack.push(e2 + "," + e1);
				break;
			case "PtgRange":
				e1 = stack.pop();
				e2 = stack.pop();
				stack.push(make_3d_range(e2, e1));
				break;
			case "PtgAttrChoose": break;
			case "PtgAttrGoto": break;
			case "PtgAttrIf": break;
			case "PtgAttrIfError": break;
			case "PtgRef":
				c = shift_cell_xls(f[1][1], _range, opts);
				stack.push(encode_cell_xls(c, biff));
				break;
			case "PtgRefN":
				c = cell ? shift_cell_xls(f[1][1], cell, opts) : f[1][1];
				stack.push(encode_cell_xls(c, biff));
				break;
			case "PtgRef3d":
				ixti = f[1][1];
				c = shift_cell_xls(f[1][2], _range, opts);
				sname = get_ixti(supbooks, ixti, opts);
				stack.push(sname + "!" + encode_cell_xls(c, biff));
				break;
			case "PtgFunc":
			case "PtgFuncVar":
				var argc = f[1][0], func = f[1][1];
				if (!argc) argc = 0;
				argc &= 127;
				var args = argc == 0 ? [] : stack.slice(-argc);
				stack.length -= argc;
				if (func === "User") func = args.shift();
				stack.push(func + "(" + args.join(",") + ")");
				break;
			case "PtgBool":
				stack.push(f[1] ? "TRUE" : "FALSE");
				break;
			case "PtgInt":
				stack.push(f[1]);
				break;
			case "PtgNum":
				stack.push(String(f[1]));
				break;
			case "PtgStr":
				stack.push("\"" + f[1].replace(/"/g, "\"\"") + "\"");
				break;
			case "PtgErr":
				stack.push(f[1]);
				break;
			case "PtgAreaN":
				r = shift_range_xls(f[1][1], cell ? { s: cell } : _range, opts);
				stack.push(encode_range_xls(r, opts));
				break;
			case "PtgArea":
				r = shift_range_xls(f[1][1], _range, opts);
				stack.push(encode_range_xls(r, opts));
				break;
			case "PtgArea3d":
				ixti = f[1][1];
				r = f[1][2];
				sname = get_ixti(supbooks, ixti, opts);
				stack.push(sname + "!" + encode_range_xls(r, opts));
				break;
			case "PtgAttrSum":
				stack.push("SUM(" + stack.pop() + ")");
				break;
			case "PtgAttrBaxcel":
			case "PtgAttrSemi": break;
			case "PtgName":
				nameidx = f[1][2];
				var lbl = (supbooks.names || [])[nameidx - 1] || (supbooks[0] || [])[nameidx];
				var name = lbl ? lbl.Name : "SH33TJSNAME" + String(nameidx);
				if (name && name.slice(0, 6) == "_xlfn." && !opts.xlfn) name = name.slice(6);
				stack.push(name);
				break;
			case "PtgNameX":
				var bookidx = f[1][1];
				nameidx = f[1][2];
				var externbook;
				if (opts.biff <= 5) {
					if (bookidx < 0) bookidx = -bookidx;
					if (supbooks[bookidx]) externbook = supbooks[bookidx][nameidx];
				} else {
					var o = "";
					if (((supbooks[bookidx] || [])[0] || [])[0] == 14849) {} else if (((supbooks[bookidx] || [])[0] || [])[0] == 1025) {
						if (supbooks[bookidx][nameidx] && supbooks[bookidx][nameidx].itab > 0) o = supbooks.SheetNames[supbooks[bookidx][nameidx].itab - 1] + "!";
					} else o = supbooks.SheetNames[nameidx - 1] + "!";
					if (supbooks[bookidx] && supbooks[bookidx][nameidx]) o += supbooks[bookidx][nameidx].Name;
					else if (supbooks[0] && supbooks[0][nameidx]) o += supbooks[0][nameidx].Name;
					else {
						var ixtidata = (get_ixti_raw(supbooks, bookidx, opts) || "").split(";;");
						if (ixtidata[nameidx - 1]) o = ixtidata[nameidx - 1];
						else o += "SH33TJSERRX";
					}
					stack.push(o);
					break;
				}
				if (!externbook) externbook = { Name: "SH33TJSERRY" };
				stack.push(externbook.Name);
				break;
			case "PtgParen":
				var lp = "(", rp = ")";
				if (last_sp >= 0) {
					sp = "";
					switch (formula[0][last_sp][1][0]) {
						case 2:
							lp = fill(" ", formula[0][last_sp][1][1]) + lp;
							break;
						case 3:
							lp = fill("\r", formula[0][last_sp][1][1]) + lp;
							break;
						case 4:
							rp = fill(" ", formula[0][last_sp][1][1]) + rp;
							break;
						case 5:
							rp = fill("\r", formula[0][last_sp][1][1]) + rp;
							break;
						default: if (opts.WTF) throw new Error("Unexpected PtgAttrSpaceType " + formula[0][last_sp][1][0]);
					}
					last_sp = -1;
				}
				stack.push(lp + stack.pop() + rp);
				break;
			case "PtgRefErr":
				stack.push("#REF!");
				break;
			case "PtgRefErr3d":
				stack.push("#REF!");
				break;
			case "PtgExp":
				c = {
					c: f[1][1],
					r: f[1][0]
				};
				var q = {
					c: cell.c,
					r: cell.r
				};
				if (supbooks.sharedf[encode_cell(c)]) {
					var parsedf = supbooks.sharedf[encode_cell(c)];
					stack.push(stringify_formula(parsedf, _range, q, supbooks, opts));
				} else {
					var fnd = false;
					for (e1 = 0; e1 != supbooks.arrayf.length; ++e1) {
						e2 = supbooks.arrayf[e1];
						if (c.c < e2[0].s.c || c.c > e2[0].e.c) continue;
						if (c.r < e2[0].s.r || c.r > e2[0].e.r) continue;
						stack.push(stringify_formula(e2[1], _range, q, supbooks, opts));
						fnd = true;
						break;
					}
					if (!fnd) stack.push(f[1]);
				}
				break;
			case "PtgArray":
				stack.push("{" + stringify_array(f[1]) + "}");
				break;
			case "PtgMemArea": break;
			case "PtgAttrSpace":
			case "PtgAttrSpaceSemi":
				last_sp = ff;
				break;
			case "PtgTbl": break;
			case "PtgMemErr": break;
			case "PtgMissArg":
				stack.push("");
				break;
			case "PtgAreaErr":
				stack.push("#REF!");
				break;
			case "PtgAreaErr3d":
				stack.push("#REF!");
				break;
			case "PtgList":
				stack.push("Table" + f[1].idx + "[#" + f[1].rt + "]");
				break;
			case "PtgMemAreaN":
			case "PtgMemNoMemN":
			case "PtgAttrNoop":
			case "PtgSheet":
			case "PtgEndSheet": break;
			case "PtgMemFunc": break;
			case "PtgMemNoMem": break;
			case "PtgElfCol":
			case "PtgElfColS":
			case "PtgElfColSV":
			case "PtgElfColV":
			case "PtgElfLel":
			case "PtgElfRadical":
			case "PtgElfRadicalLel":
			case "PtgElfRadicalS":
			case "PtgElfRw":
			case "PtgElfRwV": throw new Error("Unsupported ELFs");
			case "PtgSxName": throw new Error("Unrecognized Formula Token: " + String(f));
			default: throw new Error("Unrecognized Formula Token: " + String(f));
		}
		var PtgNonDisp = [
			"PtgAttrSpace",
			"PtgAttrSpaceSemi",
			"PtgAttrGoto"
		];
		if (opts.biff != 3) {
			if (last_sp >= 0 && PtgNonDisp.indexOf(formula[0][ff][0]) == -1) {
				f = formula[0][last_sp];
				var _left = true;
				switch (f[1][0]) {
					case 4: _left = false;
					case 0:
						sp = fill(" ", f[1][1]);
						break;
					case 5: _left = false;
					case 1:
						sp = fill("\r", f[1][1]);
						break;
					default:
						sp = "";
						if (opts.WTF) throw new Error("Unexpected PtgAttrSpaceType " + f[1][0]);
				}
				stack.push((_left ? sp : "") + stack.pop() + (_left ? "" : sp));
				last_sp = -1;
			}
		}
	}
	if (stack.length > 1 && opts.WTF) throw new Error("bad formula stack");
	if (stack[0] == "TRUE") return true;
	if (stack[0] == "FALSE") return false;
	return stack[0];
}
function parse_ArrayParsedFormula(blob, length, opts) {
	var target = blob.l + length, len = opts.biff == 2 ? 1 : 2;
	var rgcb, cce = blob.read_shift(len);
	if (cce == 65535) return [[], parsenoop(blob, length - 2)];
	var rgce = parse_Rgce(blob, cce, opts);
	if (length !== cce + len) rgcb = parse_RgbExtra(blob, length - cce - len, rgce, opts);
	blob.l = target;
	return [rgce, rgcb];
}
function parse_XLSCellParsedFormula(blob, length, opts) {
	var target = blob.l + length, len = opts.biff == 2 ? 1 : 2;
	var rgcb, cce = blob.read_shift(len);
	if (cce == 65535) return [[], parsenoop(blob, length - 2)];
	var rgce = parse_Rgce(blob, cce, opts);
	if (length !== cce + len) rgcb = parse_RgbExtra(blob, length - cce - len, rgce, opts);
	blob.l = target;
	return [rgce, rgcb];
}
function parse_NameParsedFormula(blob, length, opts, cce) {
	var target = blob.l + length;
	var rgce = parse_Rgce(blob, cce, opts);
	var rgcb;
	if (target !== blob.l) rgcb = parse_RgbExtra(blob, target - blob.l, rgce, opts);
	return [rgce, rgcb];
}
function parse_SharedParsedFormula(blob, length, opts) {
	var target = blob.l + length;
	var rgcb, cce = blob.read_shift(2);
	var rgce = parse_Rgce(blob, cce, opts);
	if (cce == 65535) return [[], parsenoop(blob, length - 2)];
	if (length !== cce + 2) rgcb = parse_RgbExtra(blob, target - cce - 2, rgce, opts);
	return [rgce, rgcb];
}
function parse_FormulaValue(blob) {
	var b;
	if (__readUInt16LE(blob, blob.l + 6) !== 65535) return [parse_Xnum(blob), "n"];
	switch (blob[blob.l]) {
		case 0:
			blob.l += 8;
			return ["String", "s"];
		case 1:
			b = blob[blob.l + 2] === 1;
			blob.l += 8;
			return [b, "b"];
		case 2:
			b = blob[blob.l + 2];
			blob.l += 8;
			return [b, "e"];
		case 3:
			blob.l += 8;
			return ["", "s"];
	}
	return [];
}
function parse_Formula(blob, length, opts) {
	var end = blob.l + length;
	var cell = parse_XLSCell(blob, 6, opts);
	var val = parse_FormulaValue(blob, 8);
	var flags = blob.read_shift(1);
	if (opts.biff != 2) {
		blob.read_shift(1);
		if (opts.biff >= 5) blob.read_shift(4);
	}
	var cbf = parse_XLSCellParsedFormula(blob, end - blob.l, opts);
	return {
		cell,
		val: val[0],
		formula: cbf,
		shared: flags >> 3 & 1,
		tt: val[1]
	};
}
function parse_XLSBParsedFormula(data, length, opts) {
	var rgce = parse_Rgce(data, data.read_shift(4), opts);
	var cb = data.read_shift(4);
	return [rgce, cb > 0 ? parse_RgbExtra(data, cb, rgce, opts) : null];
}
var parse_XLSBArrayParsedFormula = parse_XLSBParsedFormula;
var parse_XLSBCellParsedFormula = parse_XLSBParsedFormula;
var parse_XLSBNameParsedFormula = parse_XLSBParsedFormula;
var parse_XLSBSharedParsedFormula = parse_XLSBParsedFormula;
var Cetab = {
	0: "BEEP",
	1: "OPEN",
	2: "OPEN.LINKS",
	3: "CLOSE.ALL",
	4: "SAVE",
	5: "SAVE.AS",
	6: "FILE.DELETE",
	7: "PAGE.SETUP",
	8: "PRINT",
	9: "PRINTER.SETUP",
	10: "QUIT",
	11: "NEW.WINDOW",
	12: "ARRANGE.ALL",
	13: "WINDOW.SIZE",
	14: "WINDOW.MOVE",
	15: "FULL",
	16: "CLOSE",
	17: "RUN",
	22: "SET.PRINT.AREA",
	23: "SET.PRINT.TITLES",
	24: "SET.PAGE.BREAK",
	25: "REMOVE.PAGE.BREAK",
	26: "FONT",
	27: "DISPLAY",
	28: "PROTECT.DOCUMENT",
	29: "PRECISION",
	30: "A1.R1C1",
	31: "CALCULATE.NOW",
	32: "CALCULATION",
	34: "DATA.FIND",
	35: "EXTRACT",
	36: "DATA.DELETE",
	37: "SET.DATABASE",
	38: "SET.CRITERIA",
	39: "SORT",
	40: "DATA.SERIES",
	41: "TABLE",
	42: "FORMAT.NUMBER",
	43: "ALIGNMENT",
	44: "STYLE",
	45: "BORDER",
	46: "CELL.PROTECTION",
	47: "COLUMN.WIDTH",
	48: "UNDO",
	49: "CUT",
	50: "COPY",
	51: "PASTE",
	52: "CLEAR",
	53: "PASTE.SPECIAL",
	54: "EDIT.DELETE",
	55: "INSERT",
	56: "FILL.RIGHT",
	57: "FILL.DOWN",
	61: "DEFINE.NAME",
	62: "CREATE.NAMES",
	63: "FORMULA.GOTO",
	64: "FORMULA.FIND",
	65: "SELECT.LAST.CELL",
	66: "SHOW.ACTIVE.CELL",
	67: "GALLERY.AREA",
	68: "GALLERY.BAR",
	69: "GALLERY.COLUMN",
	70: "GALLERY.LINE",
	71: "GALLERY.PIE",
	72: "GALLERY.SCATTER",
	73: "COMBINATION",
	74: "PREFERRED",
	75: "ADD.OVERLAY",
	76: "GRIDLINES",
	77: "SET.PREFERRED",
	78: "AXES",
	79: "LEGEND",
	80: "ATTACH.TEXT",
	81: "ADD.ARROW",
	82: "SELECT.CHART",
	83: "SELECT.PLOT.AREA",
	84: "PATTERNS",
	85: "MAIN.CHART",
	86: "OVERLAY",
	87: "SCALE",
	88: "FORMAT.LEGEND",
	89: "FORMAT.TEXT",
	90: "EDIT.REPEAT",
	91: "PARSE",
	92: "JUSTIFY",
	93: "HIDE",
	94: "UNHIDE",
	95: "WORKSPACE",
	96: "FORMULA",
	97: "FORMULA.FILL",
	98: "FORMULA.ARRAY",
	99: "DATA.FIND.NEXT",
	100: "DATA.FIND.PREV",
	101: "FORMULA.FIND.NEXT",
	102: "FORMULA.FIND.PREV",
	103: "ACTIVATE",
	104: "ACTIVATE.NEXT",
	105: "ACTIVATE.PREV",
	106: "UNLOCKED.NEXT",
	107: "UNLOCKED.PREV",
	108: "COPY.PICTURE",
	109: "SELECT",
	110: "DELETE.NAME",
	111: "DELETE.FORMAT",
	112: "VLINE",
	113: "HLINE",
	114: "VPAGE",
	115: "HPAGE",
	116: "VSCROLL",
	117: "HSCROLL",
	118: "ALERT",
	119: "NEW",
	120: "CANCEL.COPY",
	121: "SHOW.CLIPBOARD",
	122: "MESSAGE",
	124: "PASTE.LINK",
	125: "APP.ACTIVATE",
	126: "DELETE.ARROW",
	127: "ROW.HEIGHT",
	128: "FORMAT.MOVE",
	129: "FORMAT.SIZE",
	130: "FORMULA.REPLACE",
	131: "SEND.KEYS",
	132: "SELECT.SPECIAL",
	133: "APPLY.NAMES",
	134: "REPLACE.FONT",
	135: "FREEZE.PANES",
	136: "SHOW.INFO",
	137: "SPLIT",
	138: "ON.WINDOW",
	139: "ON.DATA",
	140: "DISABLE.INPUT",
	142: "OUTLINE",
	143: "LIST.NAMES",
	144: "FILE.CLOSE",
	145: "SAVE.WORKBOOK",
	146: "DATA.FORM",
	147: "COPY.CHART",
	148: "ON.TIME",
	149: "WAIT",
	150: "FORMAT.FONT",
	151: "FILL.UP",
	152: "FILL.LEFT",
	153: "DELETE.OVERLAY",
	155: "SHORT.MENUS",
	159: "SET.UPDATE.STATUS",
	161: "COLOR.PALETTE",
	162: "DELETE.STYLE",
	163: "WINDOW.RESTORE",
	164: "WINDOW.MAXIMIZE",
	166: "CHANGE.LINK",
	167: "CALCULATE.DOCUMENT",
	168: "ON.KEY",
	169: "APP.RESTORE",
	170: "APP.MOVE",
	171: "APP.SIZE",
	172: "APP.MINIMIZE",
	173: "APP.MAXIMIZE",
	174: "BRING.TO.FRONT",
	175: "SEND.TO.BACK",
	185: "MAIN.CHART.TYPE",
	186: "OVERLAY.CHART.TYPE",
	187: "SELECT.END",
	188: "OPEN.MAIL",
	189: "SEND.MAIL",
	190: "STANDARD.FONT",
	191: "CONSOLIDATE",
	192: "SORT.SPECIAL",
	193: "GALLERY.3D.AREA",
	194: "GALLERY.3D.COLUMN",
	195: "GALLERY.3D.LINE",
	196: "GALLERY.3D.PIE",
	197: "VIEW.3D",
	198: "GOAL.SEEK",
	199: "WORKGROUP",
	200: "FILL.GROUP",
	201: "UPDATE.LINK",
	202: "PROMOTE",
	203: "DEMOTE",
	204: "SHOW.DETAIL",
	206: "UNGROUP",
	207: "OBJECT.PROPERTIES",
	208: "SAVE.NEW.OBJECT",
	209: "SHARE",
	210: "SHARE.NAME",
	211: "DUPLICATE",
	212: "APPLY.STYLE",
	213: "ASSIGN.TO.OBJECT",
	214: "OBJECT.PROTECTION",
	215: "HIDE.OBJECT",
	216: "SET.EXTRACT",
	217: "CREATE.PUBLISHER",
	218: "SUBSCRIBE.TO",
	219: "ATTRIBUTES",
	220: "SHOW.TOOLBAR",
	222: "PRINT.PREVIEW",
	223: "EDIT.COLOR",
	224: "SHOW.LEVELS",
	225: "FORMAT.MAIN",
	226: "FORMAT.OVERLAY",
	227: "ON.RECALC",
	228: "EDIT.SERIES",
	229: "DEFINE.STYLE",
	240: "LINE.PRINT",
	243: "ENTER.DATA",
	249: "GALLERY.RADAR",
	250: "MERGE.STYLES",
	251: "EDITION.OPTIONS",
	252: "PASTE.PICTURE",
	253: "PASTE.PICTURE.LINK",
	254: "SPELLING",
	256: "ZOOM",
	259: "INSERT.OBJECT",
	260: "WINDOW.MINIMIZE",
	265: "SOUND.NOTE",
	266: "SOUND.PLAY",
	267: "FORMAT.SHAPE",
	268: "EXTEND.POLYGON",
	269: "FORMAT.AUTO",
	272: "GALLERY.3D.BAR",
	273: "GALLERY.3D.SURFACE",
	274: "FILL.AUTO",
	276: "CUSTOMIZE.TOOLBAR",
	277: "ADD.TOOL",
	278: "EDIT.OBJECT",
	279: "ON.DOUBLECLICK",
	280: "ON.ENTRY",
	281: "WORKBOOK.ADD",
	282: "WORKBOOK.MOVE",
	283: "WORKBOOK.COPY",
	284: "WORKBOOK.OPTIONS",
	285: "SAVE.WORKSPACE",
	288: "CHART.WIZARD",
	289: "DELETE.TOOL",
	290: "MOVE.TOOL",
	291: "WORKBOOK.SELECT",
	292: "WORKBOOK.ACTIVATE",
	293: "ASSIGN.TO.TOOL",
	295: "COPY.TOOL",
	296: "RESET.TOOL",
	297: "CONSTRAIN.NUMERIC",
	298: "PASTE.TOOL",
	302: "WORKBOOK.NEW",
	305: "SCENARIO.CELLS",
	306: "SCENARIO.DELETE",
	307: "SCENARIO.ADD",
	308: "SCENARIO.EDIT",
	309: "SCENARIO.SHOW",
	310: "SCENARIO.SHOW.NEXT",
	311: "SCENARIO.SUMMARY",
	312: "PIVOT.TABLE.WIZARD",
	313: "PIVOT.FIELD.PROPERTIES",
	314: "PIVOT.FIELD",
	315: "PIVOT.ITEM",
	316: "PIVOT.ADD.FIELDS",
	318: "OPTIONS.CALCULATION",
	319: "OPTIONS.EDIT",
	320: "OPTIONS.VIEW",
	321: "ADDIN.MANAGER",
	322: "MENU.EDITOR",
	323: "ATTACH.TOOLBARS",
	324: "VBAActivate",
	325: "OPTIONS.CHART",
	328: "VBA.INSERT.FILE",
	330: "VBA.PROCEDURE.DEFINITION",
	336: "ROUTING.SLIP",
	338: "ROUTE.DOCUMENT",
	339: "MAIL.LOGON",
	342: "INSERT.PICTURE",
	343: "EDIT.TOOL",
	344: "GALLERY.DOUGHNUT",
	350: "CHART.TREND",
	352: "PIVOT.ITEM.PROPERTIES",
	354: "WORKBOOK.INSERT",
	355: "OPTIONS.TRANSITION",
	356: "OPTIONS.GENERAL",
	370: "FILTER.ADVANCED",
	373: "MAIL.ADD.MAILER",
	374: "MAIL.DELETE.MAILER",
	375: "MAIL.REPLY",
	376: "MAIL.REPLY.ALL",
	377: "MAIL.FORWARD",
	378: "MAIL.NEXT.LETTER",
	379: "DATA.LABEL",
	380: "INSERT.TITLE",
	381: "FONT.PROPERTIES",
	382: "MACRO.OPTIONS",
	383: "WORKBOOK.HIDE",
	384: "WORKBOOK.UNHIDE",
	385: "WORKBOOK.DELETE",
	386: "WORKBOOK.NAME",
	388: "GALLERY.CUSTOM",
	390: "ADD.CHART.AUTOFORMAT",
	391: "DELETE.CHART.AUTOFORMAT",
	392: "CHART.ADD.DATA",
	393: "AUTO.OUTLINE",
	394: "TAB.ORDER",
	395: "SHOW.DIALOG",
	396: "SELECT.ALL",
	397: "UNGROUP.SHEETS",
	398: "SUBTOTAL.CREATE",
	399: "SUBTOTAL.REMOVE",
	400: "RENAME.OBJECT",
	412: "WORKBOOK.SCROLL",
	413: "WORKBOOK.NEXT",
	414: "WORKBOOK.PREV",
	415: "WORKBOOK.TAB.SPLIT",
	416: "FULL.SCREEN",
	417: "WORKBOOK.PROTECT",
	420: "SCROLLBAR.PROPERTIES",
	421: "PIVOT.SHOW.PAGES",
	422: "TEXT.TO.COLUMNS",
	423: "FORMAT.CHARTTYPE",
	424: "LINK.FORMAT",
	425: "TRACER.DISPLAY",
	430: "TRACER.NAVIGATE",
	431: "TRACER.CLEAR",
	432: "TRACER.ERROR",
	433: "PIVOT.FIELD.GROUP",
	434: "PIVOT.FIELD.UNGROUP",
	435: "CHECKBOX.PROPERTIES",
	436: "LABEL.PROPERTIES",
	437: "LISTBOX.PROPERTIES",
	438: "EDITBOX.PROPERTIES",
	439: "PIVOT.REFRESH",
	440: "LINK.COMBO",
	441: "OPEN.TEXT",
	442: "HIDE.DIALOG",
	443: "SET.DIALOG.FOCUS",
	444: "ENABLE.OBJECT",
	445: "PUSHBUTTON.PROPERTIES",
	446: "SET.DIALOG.DEFAULT",
	447: "FILTER",
	448: "FILTER.SHOW.ALL",
	449: "CLEAR.OUTLINE",
	450: "FUNCTION.WIZARD",
	451: "ADD.LIST.ITEM",
	452: "SET.LIST.ITEM",
	453: "REMOVE.LIST.ITEM",
	454: "SELECT.LIST.ITEM",
	455: "SET.CONTROL.VALUE",
	456: "SAVE.COPY.AS",
	458: "OPTIONS.LISTS.ADD",
	459: "OPTIONS.LISTS.DELETE",
	460: "SERIES.AXES",
	461: "SERIES.X",
	462: "SERIES.Y",
	463: "ERRORBAR.X",
	464: "ERRORBAR.Y",
	465: "FORMAT.CHART",
	466: "SERIES.ORDER",
	467: "MAIL.LOGOFF",
	468: "CLEAR.ROUTING.SLIP",
	469: "APP.ACTIVATE.MICROSOFT",
	470: "MAIL.EDIT.MAILER",
	471: "ON.SHEET",
	472: "STANDARD.WIDTH",
	473: "SCENARIO.MERGE",
	474: "SUMMARY.INFO",
	475: "FIND.FILE",
	476: "ACTIVE.CELL.FONT",
	477: "ENABLE.TIPWIZARD",
	478: "VBA.MAKE.ADDIN",
	480: "INSERTDATATABLE",
	481: "WORKGROUP.OPTIONS",
	482: "MAIL.SEND.MAILER",
	485: "AUTOCORRECT",
	489: "POST.DOCUMENT",
	491: "PICKLIST",
	493: "VIEW.SHOW",
	494: "VIEW.DEFINE",
	495: "VIEW.DELETE",
	509: "SHEET.BACKGROUND",
	510: "INSERT.MAP.OBJECT",
	511: "OPTIONS.MENONO",
	517: "MSOCHECKS",
	518: "NORMAL",
	519: "LAYOUT",
	520: "RM.PRINT.AREA",
	521: "CLEAR.PRINT.AREA",
	522: "ADD.PRINT.AREA",
	523: "MOVE.BRK",
	545: "HIDECURR.NOTE",
	546: "HIDEALL.NOTES",
	547: "DELETE.NOTE",
	548: "TRAVERSE.NOTES",
	549: "ACTIVATE.NOTES",
	620: "PROTECT.REVISIONS",
	621: "UNPROTECT.REVISIONS",
	647: "OPTIONS.ME",
	653: "WEB.PUBLISH",
	667: "NEWWEBQUERY",
	673: "PIVOT.TABLE.CHART",
	753: "OPTIONS.SAVE",
	755: "OPTIONS.SPELL",
	808: "HIDEALL.INKANNOTS"
};
var Ftab = {
	0: "COUNT",
	1: "IF",
	2: "ISNA",
	3: "ISERROR",
	4: "SUM",
	5: "AVERAGE",
	6: "MIN",
	7: "MAX",
	8: "ROW",
	9: "COLUMN",
	10: "NA",
	11: "NPV",
	12: "STDEV",
	13: "DOLLAR",
	14: "FIXED",
	15: "SIN",
	16: "COS",
	17: "TAN",
	18: "ATAN",
	19: "PI",
	20: "SQRT",
	21: "EXP",
	22: "LN",
	23: "LOG10",
	24: "ABS",
	25: "INT",
	26: "SIGN",
	27: "ROUND",
	28: "LOOKUP",
	29: "INDEX",
	30: "REPT",
	31: "MID",
	32: "LEN",
	33: "VALUE",
	34: "TRUE",
	35: "FALSE",
	36: "AND",
	37: "OR",
	38: "NOT",
	39: "MOD",
	40: "DCOUNT",
	41: "DSUM",
	42: "DAVERAGE",
	43: "DMIN",
	44: "DMAX",
	45: "DSTDEV",
	46: "VAR",
	47: "DVAR",
	48: "TEXT",
	49: "LINEST",
	50: "TREND",
	51: "LOGEST",
	52: "GROWTH",
	53: "GOTO",
	54: "HALT",
	55: "RETURN",
	56: "PV",
	57: "FV",
	58: "NPER",
	59: "PMT",
	60: "RATE",
	61: "MIRR",
	62: "IRR",
	63: "RAND",
	64: "MATCH",
	65: "DATE",
	66: "TIME",
	67: "DAY",
	68: "MONTH",
	69: "YEAR",
	70: "WEEKDAY",
	71: "HOUR",
	72: "MINUTE",
	73: "SECOND",
	74: "NOW",
	75: "AREAS",
	76: "ROWS",
	77: "COLUMNS",
	78: "OFFSET",
	79: "ABSREF",
	80: "RELREF",
	81: "ARGUMENT",
	82: "SEARCH",
	83: "TRANSPOSE",
	84: "ERROR",
	85: "STEP",
	86: "TYPE",
	87: "ECHO",
	88: "SET.NAME",
	89: "CALLER",
	90: "DEREF",
	91: "WINDOWS",
	92: "SERIES",
	93: "DOCUMENTS",
	94: "ACTIVE.CELL",
	95: "SELECTION",
	96: "RESULT",
	97: "ATAN2",
	98: "ASIN",
	99: "ACOS",
	100: "CHOOSE",
	101: "HLOOKUP",
	102: "VLOOKUP",
	103: "LINKS",
	104: "INPUT",
	105: "ISREF",
	106: "GET.FORMULA",
	107: "GET.NAME",
	108: "SET.VALUE",
	109: "LOG",
	110: "EXEC",
	111: "CHAR",
	112: "LOWER",
	113: "UPPER",
	114: "PROPER",
	115: "LEFT",
	116: "RIGHT",
	117: "EXACT",
	118: "TRIM",
	119: "REPLACE",
	120: "SUBSTITUTE",
	121: "CODE",
	122: "NAMES",
	123: "DIRECTORY",
	124: "FIND",
	125: "CELL",
	126: "ISERR",
	127: "ISTEXT",
	128: "ISNUMBER",
	129: "ISBLANK",
	130: "T",
	131: "N",
	132: "FOPEN",
	133: "FCLOSE",
	134: "FSIZE",
	135: "FREADLN",
	136: "FREAD",
	137: "FWRITELN",
	138: "FWRITE",
	139: "FPOS",
	140: "DATEVALUE",
	141: "TIMEVALUE",
	142: "SLN",
	143: "SYD",
	144: "DDB",
	145: "GET.DEF",
	146: "REFTEXT",
	147: "TEXTREF",
	148: "INDIRECT",
	149: "REGISTER",
	150: "CALL",
	151: "ADD.BAR",
	152: "ADD.MENU",
	153: "ADD.COMMAND",
	154: "ENABLE.COMMAND",
	155: "CHECK.COMMAND",
	156: "RENAME.COMMAND",
	157: "SHOW.BAR",
	158: "DELETE.MENU",
	159: "DELETE.COMMAND",
	160: "GET.CHART.ITEM",
	161: "DIALOG.BOX",
	162: "CLEAN",
	163: "MDETERM",
	164: "MINVERSE",
	165: "MMULT",
	166: "FILES",
	167: "IPMT",
	168: "PPMT",
	169: "COUNTA",
	170: "CANCEL.KEY",
	171: "FOR",
	172: "WHILE",
	173: "BREAK",
	174: "NEXT",
	175: "INITIATE",
	176: "REQUEST",
	177: "POKE",
	178: "EXECUTE",
	179: "TERMINATE",
	180: "RESTART",
	181: "HELP",
	182: "GET.BAR",
	183: "PRODUCT",
	184: "FACT",
	185: "GET.CELL",
	186: "GET.WORKSPACE",
	187: "GET.WINDOW",
	188: "GET.DOCUMENT",
	189: "DPRODUCT",
	190: "ISNONTEXT",
	191: "GET.NOTE",
	192: "NOTE",
	193: "STDEVP",
	194: "VARP",
	195: "DSTDEVP",
	196: "DVARP",
	197: "TRUNC",
	198: "ISLOGICAL",
	199: "DCOUNTA",
	200: "DELETE.BAR",
	201: "UNREGISTER",
	204: "USDOLLAR",
	205: "FINDB",
	206: "SEARCHB",
	207: "REPLACEB",
	208: "LEFTB",
	209: "RIGHTB",
	210: "MIDB",
	211: "LENB",
	212: "ROUNDUP",
	213: "ROUNDDOWN",
	214: "ASC",
	215: "DBCS",
	216: "RANK",
	219: "ADDRESS",
	220: "DAYS360",
	221: "TODAY",
	222: "VDB",
	223: "ELSE",
	224: "ELSE.IF",
	225: "END.IF",
	226: "FOR.CELL",
	227: "MEDIAN",
	228: "SUMPRODUCT",
	229: "SINH",
	230: "COSH",
	231: "TANH",
	232: "ASINH",
	233: "ACOSH",
	234: "ATANH",
	235: "DGET",
	236: "CREATE.OBJECT",
	237: "VOLATILE",
	238: "LAST.ERROR",
	239: "CUSTOM.UNDO",
	240: "CUSTOM.REPEAT",
	241: "FORMULA.CONVERT",
	242: "GET.LINK.INFO",
	243: "TEXT.BOX",
	244: "INFO",
	245: "GROUP",
	246: "GET.OBJECT",
	247: "DB",
	248: "PAUSE",
	251: "RESUME",
	252: "FREQUENCY",
	253: "ADD.TOOLBAR",
	254: "DELETE.TOOLBAR",
	255: "User",
	256: "RESET.TOOLBAR",
	257: "EVALUATE",
	258: "GET.TOOLBAR",
	259: "GET.TOOL",
	260: "SPELLING.CHECK",
	261: "ERROR.TYPE",
	262: "APP.TITLE",
	263: "WINDOW.TITLE",
	264: "SAVE.TOOLBAR",
	265: "ENABLE.TOOL",
	266: "PRESS.TOOL",
	267: "REGISTER.ID",
	268: "GET.WORKBOOK",
	269: "AVEDEV",
	270: "BETADIST",
	271: "GAMMALN",
	272: "BETAINV",
	273: "BINOMDIST",
	274: "CHIDIST",
	275: "CHIINV",
	276: "COMBIN",
	277: "CONFIDENCE",
	278: "CRITBINOM",
	279: "EVEN",
	280: "EXPONDIST",
	281: "FDIST",
	282: "FINV",
	283: "FISHER",
	284: "FISHERINV",
	285: "FLOOR",
	286: "GAMMADIST",
	287: "GAMMAINV",
	288: "CEILING",
	289: "HYPGEOMDIST",
	290: "LOGNORMDIST",
	291: "LOGINV",
	292: "NEGBINOMDIST",
	293: "NORMDIST",
	294: "NORMSDIST",
	295: "NORMINV",
	296: "NORMSINV",
	297: "STANDARDIZE",
	298: "ODD",
	299: "PERMUT",
	300: "POISSON",
	301: "TDIST",
	302: "WEIBULL",
	303: "SUMXMY2",
	304: "SUMX2MY2",
	305: "SUMX2PY2",
	306: "CHITEST",
	307: "CORREL",
	308: "COVAR",
	309: "FORECAST",
	310: "FTEST",
	311: "INTERCEPT",
	312: "PEARSON",
	313: "RSQ",
	314: "STEYX",
	315: "SLOPE",
	316: "TTEST",
	317: "PROB",
	318: "DEVSQ",
	319: "GEOMEAN",
	320: "HARMEAN",
	321: "SUMSQ",
	322: "KURT",
	323: "SKEW",
	324: "ZTEST",
	325: "LARGE",
	326: "SMALL",
	327: "QUARTILE",
	328: "PERCENTILE",
	329: "PERCENTRANK",
	330: "MODE",
	331: "TRIMMEAN",
	332: "TINV",
	334: "MOVIE.COMMAND",
	335: "GET.MOVIE",
	336: "CONCATENATE",
	337: "POWER",
	338: "PIVOT.ADD.DATA",
	339: "GET.PIVOT.TABLE",
	340: "GET.PIVOT.FIELD",
	341: "GET.PIVOT.ITEM",
	342: "RADIANS",
	343: "DEGREES",
	344: "SUBTOTAL",
	345: "SUMIF",
	346: "COUNTIF",
	347: "COUNTBLANK",
	348: "SCENARIO.GET",
	349: "OPTIONS.LISTS.GET",
	350: "ISPMT",
	351: "DATEDIF",
	352: "DATESTRING",
	353: "NUMBERSTRING",
	354: "ROMAN",
	355: "OPEN.DIALOG",
	356: "SAVE.DIALOG",
	357: "VIEW.GET",
	358: "GETPIVOTDATA",
	359: "HYPERLINK",
	360: "PHONETIC",
	361: "AVERAGEA",
	362: "MAXA",
	363: "MINA",
	364: "STDEVPA",
	365: "VARPA",
	366: "STDEVA",
	367: "VARA",
	368: "BAHTTEXT",
	369: "THAIDAYOFWEEK",
	370: "THAIDIGIT",
	371: "THAIMONTHOFYEAR",
	372: "THAINUMSOUND",
	373: "THAINUMSTRING",
	374: "THAISTRINGLENGTH",
	375: "ISTHAIDIGIT",
	376: "ROUNDBAHTDOWN",
	377: "ROUNDBAHTUP",
	378: "THAIYEAR",
	379: "RTD",
	380: "CUBEVALUE",
	381: "CUBEMEMBER",
	382: "CUBEMEMBERPROPERTY",
	383: "CUBERANKEDMEMBER",
	384: "HEX2BIN",
	385: "HEX2DEC",
	386: "HEX2OCT",
	387: "DEC2BIN",
	388: "DEC2HEX",
	389: "DEC2OCT",
	390: "OCT2BIN",
	391: "OCT2HEX",
	392: "OCT2DEC",
	393: "BIN2DEC",
	394: "BIN2OCT",
	395: "BIN2HEX",
	396: "IMSUB",
	397: "IMDIV",
	398: "IMPOWER",
	399: "IMABS",
	400: "IMSQRT",
	401: "IMLN",
	402: "IMLOG2",
	403: "IMLOG10",
	404: "IMSIN",
	405: "IMCOS",
	406: "IMEXP",
	407: "IMARGUMENT",
	408: "IMCONJUGATE",
	409: "IMAGINARY",
	410: "IMREAL",
	411: "COMPLEX",
	412: "IMSUM",
	413: "IMPRODUCT",
	414: "SERIESSUM",
	415: "FACTDOUBLE",
	416: "SQRTPI",
	417: "QUOTIENT",
	418: "DELTA",
	419: "GESTEP",
	420: "ISEVEN",
	421: "ISODD",
	422: "MROUND",
	423: "ERF",
	424: "ERFC",
	425: "BESSELJ",
	426: "BESSELK",
	427: "BESSELY",
	428: "BESSELI",
	429: "XIRR",
	430: "XNPV",
	431: "PRICEMAT",
	432: "YIELDMAT",
	433: "INTRATE",
	434: "RECEIVED",
	435: "DISC",
	436: "PRICEDISC",
	437: "YIELDDISC",
	438: "TBILLEQ",
	439: "TBILLPRICE",
	440: "TBILLYIELD",
	441: "PRICE",
	442: "YIELD",
	443: "DOLLARDE",
	444: "DOLLARFR",
	445: "NOMINAL",
	446: "EFFECT",
	447: "CUMPRINC",
	448: "CUMIPMT",
	449: "EDATE",
	450: "EOMONTH",
	451: "YEARFRAC",
	452: "COUPDAYBS",
	453: "COUPDAYS",
	454: "COUPDAYSNC",
	455: "COUPNCD",
	456: "COUPNUM",
	457: "COUPPCD",
	458: "DURATION",
	459: "MDURATION",
	460: "ODDLPRICE",
	461: "ODDLYIELD",
	462: "ODDFPRICE",
	463: "ODDFYIELD",
	464: "RANDBETWEEN",
	465: "WEEKNUM",
	466: "AMORDEGRC",
	467: "AMORLINC",
	468: "CONVERT",
	724: "SHEETJS",
	469: "ACCRINT",
	470: "ACCRINTM",
	471: "WORKDAY",
	472: "NETWORKDAYS",
	473: "GCD",
	474: "MULTINOMIAL",
	475: "LCM",
	476: "FVSCHEDULE",
	477: "CUBEKPIMEMBER",
	478: "CUBESET",
	479: "CUBESETCOUNT",
	480: "IFERROR",
	481: "COUNTIFS",
	482: "SUMIFS",
	483: "AVERAGEIF",
	484: "AVERAGEIFS"
};
var FtabArgc = {
	2: 1,
	3: 1,
	10: 0,
	15: 1,
	16: 1,
	17: 1,
	18: 1,
	19: 0,
	20: 1,
	21: 1,
	22: 1,
	23: 1,
	24: 1,
	25: 1,
	26: 1,
	27: 2,
	30: 2,
	31: 3,
	32: 1,
	33: 1,
	34: 0,
	35: 0,
	38: 1,
	39: 2,
	40: 3,
	41: 3,
	42: 3,
	43: 3,
	44: 3,
	45: 3,
	47: 3,
	48: 2,
	53: 1,
	61: 3,
	63: 0,
	65: 3,
	66: 3,
	67: 1,
	68: 1,
	69: 1,
	70: 1,
	71: 1,
	72: 1,
	73: 1,
	74: 0,
	75: 1,
	76: 1,
	77: 1,
	79: 2,
	80: 2,
	83: 1,
	85: 0,
	86: 1,
	89: 0,
	90: 1,
	94: 0,
	95: 0,
	97: 2,
	98: 1,
	99: 1,
	101: 3,
	102: 3,
	105: 1,
	106: 1,
	108: 2,
	111: 1,
	112: 1,
	113: 1,
	114: 1,
	117: 2,
	118: 1,
	119: 4,
	121: 1,
	126: 1,
	127: 1,
	128: 1,
	129: 1,
	130: 1,
	131: 1,
	133: 1,
	134: 1,
	135: 1,
	136: 2,
	137: 2,
	138: 2,
	140: 1,
	141: 1,
	142: 3,
	143: 4,
	144: 4,
	161: 1,
	162: 1,
	163: 1,
	164: 1,
	165: 2,
	172: 1,
	175: 2,
	176: 2,
	177: 3,
	178: 2,
	179: 1,
	184: 1,
	186: 1,
	189: 3,
	190: 1,
	195: 3,
	196: 3,
	197: 1,
	198: 1,
	199: 3,
	201: 1,
	207: 4,
	210: 3,
	211: 1,
	212: 2,
	213: 2,
	214: 1,
	215: 1,
	225: 0,
	229: 1,
	230: 1,
	231: 1,
	232: 1,
	233: 1,
	234: 1,
	235: 3,
	244: 1,
	247: 4,
	252: 2,
	257: 1,
	261: 1,
	271: 1,
	273: 4,
	274: 2,
	275: 2,
	276: 2,
	277: 3,
	278: 3,
	279: 1,
	280: 3,
	281: 3,
	282: 3,
	283: 1,
	284: 1,
	285: 2,
	286: 4,
	287: 3,
	288: 2,
	289: 4,
	290: 3,
	291: 3,
	292: 3,
	293: 4,
	294: 1,
	295: 3,
	296: 1,
	297: 3,
	298: 1,
	299: 2,
	300: 3,
	301: 3,
	302: 4,
	303: 2,
	304: 2,
	305: 2,
	306: 2,
	307: 2,
	308: 2,
	309: 3,
	310: 2,
	311: 2,
	312: 2,
	313: 2,
	314: 2,
	315: 2,
	316: 4,
	325: 2,
	326: 2,
	327: 2,
	328: 2,
	331: 2,
	332: 2,
	337: 2,
	342: 1,
	343: 1,
	346: 2,
	347: 1,
	350: 4,
	351: 3,
	352: 1,
	353: 2,
	360: 1,
	368: 1,
	369: 1,
	370: 1,
	371: 1,
	372: 1,
	373: 1,
	374: 1,
	375: 1,
	376: 1,
	377: 1,
	378: 1,
	382: 3,
	385: 1,
	392: 1,
	393: 1,
	396: 2,
	397: 2,
	398: 2,
	399: 1,
	400: 1,
	401: 1,
	402: 1,
	403: 1,
	404: 1,
	405: 1,
	406: 1,
	407: 1,
	408: 1,
	409: 1,
	410: 1,
	414: 4,
	415: 1,
	416: 1,
	417: 2,
	420: 1,
	421: 1,
	422: 2,
	424: 1,
	425: 2,
	426: 2,
	427: 2,
	428: 2,
	430: 3,
	438: 3,
	439: 3,
	440: 3,
	443: 2,
	444: 2,
	445: 2,
	446: 2,
	447: 6,
	448: 6,
	449: 2,
	450: 2,
	464: 2,
	468: 3,
	476: 2,
	479: 1,
	480: 2,
	65535: 0
};
function ods_to_csf_formula(f) {
	if (f.slice(0, 3) == "of:") f = f.slice(3);
	if (f.charCodeAt(0) == 61) {
		f = f.slice(1);
		if (f.charCodeAt(0) == 61) f = f.slice(1);
	}
	f = f.replace(/COM\.MICROSOFT\./g, "");
	f = f.replace(/\[((?:\.[A-Z]+[0-9]+)(?::\.[A-Z]+[0-9]+)?)\]/g, function($$, $1) {
		return $1.replace(/\./g, "");
	});
	f = f.replace(/\$'([^']|'')+'/g, function($$) {
		return $$.slice(1);
	});
	f = f.replace(/\$([^\]\. #$]+)/g, function($$, $1) {
		return $1.match(/^([A-Z]{1,2}|[A-W][A-Z]{2}|X[A-E][A-Z]|XF[A-D])?(10[0-3]\d{4}|104[0-7]\d{3}|1048[0-4]\d{2}|10485[0-6]\d|104857[0-6]|[1-9]\d{0,5})?$/) ? $$ : $1;
	});
	f = f.replace(/\[.(#[A-Z]*[?!])\]/g, "$1");
	return f.replace(/[;~]/g, ",").replace(/\|/g, ";");
}
function ods_to_csf_3D(r) {
	r = r.replace(/\$'([^']|'')+'/g, function($$) {
		return $$.slice(1);
	});
	r = r.replace(/\$([^\]\. #$]+)/g, function($$, $1) {
		return $1.match(/^([A-Z]{1,2}|[A-W][A-Z]{2}|X[A-E][A-Z]|XF[A-D])?(10[0-3]\d{4}|104[0-7]\d{3}|1048[0-4]\d{2}|10485[0-6]\d|104857[0-6]|[1-9]\d{0,5})?$/) ? $$ : $1;
	});
	var a = r.split(":");
	return [a[0].split(".")[0], a[0].split(".")[1] + (a.length > 1 ? ":" + (a[1].split(".")[1] || a[1].split(".")[0]) : "")];
}
var strs = {};
var _ssfopts = {};
function default_margins(margins, mode) {
	if (!margins) return;
	var defs = [
		.7,
		.7,
		.75,
		.75,
		.3,
		.3
	];
	if (mode == "xlml") defs = [
		1,
		1,
		1,
		1,
		.5,
		.5
	];
	if (margins.left == null) margins.left = defs[0];
	if (margins.right == null) margins.right = defs[1];
	if (margins.top == null) margins.top = defs[2];
	if (margins.bottom == null) margins.bottom = defs[3];
	if (margins.header == null) margins.header = defs[4];
	if (margins.footer == null) margins.footer = defs[5];
}
function extend_style_obj(dst, src) {
	if (!src) return dst;
	keys(src).forEach(function(k) {
		dst[k] = dup(src[k]);
	});
	return dst;
}
function fill_style_aliases(out, fill) {
	if (!fill) return out;
	if (fill.patternType != null) out.patternType = fill.patternType;
	if (fill.fgColor != null) out.fgColor = dup(fill.fgColor);
	if (fill.bgColor != null) out.bgColor = dup(fill.bgColor);
	if (fill.gradientFill != null) out.gradientFill = dup(fill.gradientFill);
	return out;
}
function resolve_cell_style(styles, cf, themes, styleid) {
	if (!styles || !cf) return null;
	var xf = {};
	if (cf.xfId != null && styles.CellStyleXf && styles.CellStyleXf[cf.xfId]) extend_style_obj(xf, styles.CellStyleXf[cf.xfId]);
	extend_style_obj(xf, cf);
	var out = {
		id: styleid,
		xf: dup(xf)
	};
	if (xf.numFmtId != null) {
		out.numFmtId = xf.numFmtId;
		if (styles.NumberFmt && styles.NumberFmt[xf.numFmtId] != null) out.numFmt = styles.NumberFmt[xf.numFmtId];
	}
	if (xf.fontId != null && styles.Fonts && styles.Fonts[xf.fontId]) out.font = resolve_style_obj_color(styles.Fonts[xf.fontId], themes);
	if (xf.fillId != null && styles.Fills && styles.Fills[xf.fillId]) {
		out.fill = resolve_style_obj_color(styles.Fills[xf.fillId], themes);
		fill_style_aliases(out, out.fill);
	}
	if (xf.borderId != null && styles.Borders && styles.Borders[xf.borderId]) out.border = resolve_style_obj_color(styles.Borders[xf.borderId], themes);
	if (xf.alignment) out.alignment = dup(xf.alignment);
	if (xf.protection) out.protection = dup(xf.protection);
	return out;
}
function safe_format(p, fmtid, fillid, opts, themes, styles, date1904, cf, styleid) {
	try {
		if (opts.cellNF) p.z = table_fmt[fmtid];
	} catch (e) {
		if (opts.WTF) throw e;
	}
	if (p.t === "z" && !opts.cellStyles) return;
	if (p.t === "d" && typeof p.v === "string") p.v = parseDate(p.v);
	if ((!opts || opts.cellText !== false) && p.t !== "z") try {
		if (table_fmt[fmtid] == null) SSF__load(SSFImplicit[fmtid] || "General", fmtid);
		if (p.t === "e") p.w = p.w || BErr[p.v];
		else if (fmtid === 0) if (p.t === "n") if ((p.v | 0) === p.v) p.w = p.v.toString(10);
		else p.w = SSF_general_num(p.v);
		else if (p.t === "d") {
			var dd = datenum(p.v, !!date1904);
			if ((dd | 0) === dd) p.w = dd.toString(10);
			else p.w = SSF_general_num(dd);
		} else if (p.v === void 0) return "";
		else p.w = SSF_general(p.v, _ssfopts);
		else if (p.t === "d") p.w = SSF_format(fmtid, datenum(p.v, !!date1904), _ssfopts);
		else p.w = SSF_format(fmtid, p.v, _ssfopts);
	} catch (e) {
		if (opts.WTF) throw e;
	}
	if (!opts.cellStyles) return;
	if (cf != null) try {
		var resolved = resolve_cell_style(styles, cf, themes, styleid);
		if (resolved) {
			p.s = resolved;
			return;
		}
	} catch (e) {
		if (opts.WTF) throw e;
	}
	if (fillid != null) try {
		p.s = resolve_style_obj_color(styles.Fills[fillid], themes);
	} catch (e) {
		if (opts.WTF && styles.Fills) throw e;
	}
}
function merge_range_overlap(a, b) {
	return !(a.e.r < b.s.r || b.e.r < a.s.r || a.e.c < b.s.c || b.e.c < a.s.c);
}
function validate_merges(ws, opts) {
	var merges = ws && ws["!merges"] || [];
	var errors = [];
	var ref = ws && ws["!ref"] ? safe_decode_range(ws["!ref"]) : null;
	var seen = {};
	for (var i = 0; i < merges.length; ++i) {
		var m = merges[i];
		var enc = "";
		if (!m || !m.s || !m.e) {
			errors.push({
				code: "E_MERGE_RANGE",
				message: "Merge range is malformed",
				index: i
			});
			continue;
		}
		if (m.s.r < 0 || m.s.c < 0 || m.e.r < m.s.r || m.e.c < m.s.c) {
			errors.push({
				code: "E_MERGE_RANGE",
				message: "Merge range is invalid",
				index: i,
				range: m
			});
			continue;
		}
		enc = encode_range(m);
		if (seen[enc] != null) errors.push({
			code: "E_MERGE_DUP",
			message: "Merge range is duplicated",
			index: i,
			other: seen[enc],
			range: enc
		});
		seen[enc] = i;
		if (ref && (m.s.r < ref.s.r || m.s.c < ref.s.c || m.e.r > ref.e.r || m.e.c > ref.e.c)) errors.push({
			code: "E_MERGE_BOUNDS",
			message: "Merge range exceeds worksheet range",
			index: i,
			range: enc,
			ref: encode_range(ref)
		});
		for (var j = 0; j < i; ++j) {
			if (!merges[j] || !merges[j].s || !merges[j].e) continue;
			if (merge_range_overlap(m, merges[j]) && encode_range(merges[j]) != enc) errors.push({
				code: "E_MERGE_OVERLAP",
				message: "Merge ranges overlap",
				index: i,
				other: j,
				range: enc,
				otherRange: encode_range(merges[j])
			});
		}
	}
	if (errors.length && opts && opts.WTF) {
		var err = /* @__PURE__ */ new Error(errors[0].message + " (" + (errors[0].range || errors[0].index) + ")");
		err.code = errors[0].code;
		throw err;
	}
	return errors;
}
function parse_ws_xml_dim(ws, s) {
	var d = safe_decode_range(s);
	if (d.s.r <= d.e.r && d.s.c <= d.e.c && d.s.r >= 0 && d.s.c >= 0) ws["!ref"] = encode_range(d);
}
var mergecregex = /<(?:\w+:)?mergeCell ref=["'][A-Z0-9:]+['"]\s*[\/]?>/g;
var hlinkregex = /<(?:\w+:)?hyperlink [^<>]*>/gm;
var dimregex = /"(\w*:\w*)"/;
var colregex = /<(?:\w+:)?col\b[^<>]*[\/]?>/g;
function match_ws_xml_autofilter(data) {
	var paired = str_match_xml_ns(data, "autoFilter");
	if (paired) return paired[0];
	var start = 0;
	while ((start = data.indexOf("<", start)) != -1) {
		var end = data.indexOf(">", start + 1);
		if (end == -1) return null;
		var tag = data.slice(start + 1, end), p = 0;
		while (p < tag.length && tag.charCodeAt(p) <= 32) ++p;
		var nameEnd = p;
		while (nameEnd < tag.length && tag.charCodeAt(nameEnd) > 32 && tag.charAt(nameEnd) != "/") ++nameEnd;
		var name = tag.slice(p, nameEnd), colon = name.indexOf(":");
		if (colon != -1) name = name.slice(colon + 1);
		var tail = tag.slice(nameEnd).trim();
		if (name == "autoFilter" && tail.charAt(tail.length - 1) == "/") return data.slice(start, end + 1);
		start = end + 1;
	}
	return null;
}
var marginregex = /<(?:\w+:)?pageMargins[^<>]*\/>/g;
var sheetprregex = /<(?:\w+:)?sheetPr\b[^<>]*?\/>/;
function parse_ws_xml(data, opts, idx, rels, wb, themes, styles) {
	if (!data) return data;
	if (!rels) rels = { "!id": {} };
	if (DENSE != null && opts.dense == null) opts.dense = DENSE;
	var s = {};
	if (opts.dense) s["!data"] = [];
	var refguess = {
		s: {
			r: 2e6,
			c: 2e6
		},
		e: {
			r: 0,
			c: 0
		}
	};
	var data1 = "", data2 = "";
	var mtch = str_match_xml_ns(data, "sheetData");
	if (mtch) {
		data1 = data.slice(0, mtch.index);
		data2 = data.slice(mtch.index + mtch[0].length);
	} else data1 = data2 = data;
	var sheetPr = data1.match(sheetprregex);
	if (sheetPr) parse_ws_xml_sheetpr(sheetPr[0], s, wb, idx);
	else if (sheetPr = str_match_xml_ns(data1, "sheetPr")) parse_ws_xml_sheetpr2(sheetPr[0], sheetPr[1] || "", s, wb, idx, styles, themes);
	var ridx = (data1.match(/<(?:\w*:)?dimension/) || { index: -1 }).index;
	if (ridx > 0) {
		var ref = data1.slice(ridx, ridx + 50).match(dimregex);
		if (ref && !(opts && opts.nodim)) parse_ws_xml_dim(s, ref[1]);
	}
	var svs = str_match_xml_ns(data1, "sheetViews");
	if (svs && svs[1]) parse_ws_xml_sheetviews(svs[1], wb);
	var columns = [];
	if (opts.cellStyles) {
		var cols = data1.match(colregex);
		if (cols) parse_ws_xml_cols(columns, cols);
	}
	if (mtch) parse_ws_xml_data(mtch[1], s, opts, refguess, themes, styles, wb);
	var afilter = match_ws_xml_autofilter(data2);
	if (afilter) s["!autofilter"] = parse_ws_xml_autofilter(afilter);
	var merges = [];
	var _merge = data2.match(mergecregex);
	if (_merge) for (ridx = 0; ridx != _merge.length; ++ridx) merges[ridx] = safe_decode_range(_merge[ridx].slice(_merge[ridx].indexOf("=") + 2));
	var hlink = data2.match(hlinkregex);
	if (hlink) parse_ws_xml_hlinks(s, hlink, rels);
	var margins = data2.match(marginregex);
	if (margins) s["!margins"] = parse_ws_xml_margins(parsexmltag(margins[0]));
	var m;
	if (m = data2.match(/<(?:\w+:)?drawing\b[^<>]*r:id="(.*?)"/)) s["!rel"] = m[1];
	if (m = data2.match(/legacyDrawing r:id="(.*?)"/)) s["!legrel"] = m[1];
	if (opts && opts.nodim) refguess.s.c = refguess.s.r = 0;
	if (!s["!ref"] && refguess.e.c >= refguess.s.c && refguess.e.r >= refguess.s.r) s["!ref"] = encode_range(refguess);
	if (opts.sheetRows > 0 && s["!ref"]) {
		var tmpref = safe_decode_range(s["!ref"]);
		if (opts.sheetRows <= +tmpref.e.r) {
			tmpref.e.r = opts.sheetRows - 1;
			if (tmpref.e.r > refguess.e.r) tmpref.e.r = refguess.e.r;
			if (tmpref.e.r < tmpref.s.r) tmpref.s.r = tmpref.e.r;
			if (tmpref.e.c > refguess.e.c) tmpref.e.c = refguess.e.c;
			if (tmpref.e.c < tmpref.s.c) tmpref.s.c = tmpref.e.c;
			s["!fullref"] = s["!ref"];
			s["!ref"] = encode_range(tmpref);
		}
	}
	if (columns.length > 0) s["!cols"] = columns;
	if (merges.length > 0) {
		s["!merges"] = merges;
		var mergeErrors = validate_merges(s, { WTF: !!(opts && opts.validateMerges) });
		if (mergeErrors.length) s["!mergeErrors"] = mergeErrors;
	}
	if (rels["!id"][s["!rel"]]) s["!drawel"] = rels["!id"][s["!rel"]];
	if (rels["!id"][s["!legrel"]]) s["!legdrawel"] = rels["!id"][s["!legrel"]];
	return s;
}
function parse_ws_xml_sheetpr(sheetPr, s, wb, idx) {
	var data = parsexmltag(sheetPr);
	if (!wb.Sheets[idx]) wb.Sheets[idx] = {};
	if (data.codeName) wb.Sheets[idx].CodeName = unescapexml(utf8read(data.codeName));
}
function parse_ws_xml_sheetpr2(sheetPr, body, s, wb, idx) {
	parse_ws_xml_sheetpr(sheetPr.slice(0, sheetPr.indexOf(">")), s, wb, idx);
}
function parse_ws_xml_hlinks(s, data, rels) {
	var dense = s["!data"] != null;
	for (var i = 0; i != data.length; ++i) {
		var val = parsexmltag(utf8read(data[i]), true);
		if (!val.ref) return;
		var rel = ((rels || {})["!id"] || [])[val.id];
		if (rel) {
			val.Target = rel.Target;
			if (val.location) val.Target += "#" + unescapexml(val.location);
		} else {
			val.Target = "#" + unescapexml(val.location);
			rel = {
				Target: val.Target,
				TargetMode: "Internal"
			};
		}
		val.Rel = rel;
		if (val.tooltip) {
			val.Tooltip = val.tooltip;
			delete val.tooltip;
		}
		var rng = safe_decode_range(val.ref);
		for (var R = rng.s.r; R <= rng.e.r; ++R) for (var C = rng.s.c; C <= rng.e.c; ++C) {
			var addr = encode_col(C) + encode_row(R);
			if (dense) {
				if (!s["!data"][R]) s["!data"][R] = [];
				if (!s["!data"][R][C]) s["!data"][R][C] = {
					t: "z",
					v: void 0
				};
				s["!data"][R][C].l = val;
			} else {
				if (!s[addr]) s[addr] = {
					t: "z",
					v: void 0
				};
				s[addr].l = val;
			}
		}
	}
}
function parse_ws_xml_margins(margin) {
	var o = {};
	[
		"left",
		"right",
		"top",
		"bottom",
		"header",
		"footer"
	].forEach(function(k) {
		if (margin[k]) o[k] = parseFloat(margin[k]);
	});
	return o;
}
function parse_ws_xml_cols(columns, cols) {
	var seencol = false;
	for (var coli = 0; coli != cols.length; ++coli) {
		var coll = parsexmltag(cols[coli], true);
		if (coll.hidden) coll.hidden = parsexmlbool(coll.hidden);
		if (coll.bestFit) coll.bestFit = parsexmlbool(coll.bestFit);
		if (coll.customWidth) coll.customWidth = parsexmlbool(coll.customWidth);
		var colm = parseInt(coll.min, 10) - 1, colM = parseInt(coll.max, 10) - 1;
		if (coll.outlineLevel) coll.level = +coll.outlineLevel || 0;
		delete coll.min;
		delete coll.max;
		coll.width = +coll.width;
		if (!seencol && coll.width) {
			seencol = true;
			MDW = DEF_MDW;
		}
		process_col(coll);
		while (colm <= colM) columns[colm++] = dup(coll);
	}
}
function parse_ws_xml_autofilter(data) {
	return { ref: (data.match(/ref=["']([^"']*)["']/) || [])[1] };
}
var sviewregex = /<(?:\w:)?sheetView(?:[^<>a-z][^<>]*)?\/?>/g;
function parse_ws_xml_sheetviews(data, wb) {
	if (!wb.Views) wb.Views = [{}];
	(data.match(sviewregex) || []).forEach(function(r, i) {
		var tag = parsexmltag(r);
		if (!wb.Views[i]) wb.Views[i] = {};
		if (+tag.zoomScale) wb.Views[i].zoom = +tag.zoomScale;
		if (tag.rightToLeft && parsexmlbool(tag.rightToLeft)) wb.Views[i].RTL = true;
	});
}
var parse_ws_xml_data = /*#__PURE__*/ (function() {
	var cellregex = /<(?:\w+:)?c[ \/>]/, rowregex = /<\/(?:\w+:)?row>/;
	var rregex = /r=["']([^"']*)["']/;
	var refregex = /ref=["']([^"']*)["']/;
	return function parse_ws_xml_data(sdata, s, opts, guess, themes, styles, wb) {
		var ri = 0, x = "", cells = [], cref = [], idx = 0, i = 0, cc = 0, d = "", p;
		var tag, tagr = 0, tagc = 0;
		var sstr, ftag;
		var fmtid = 0, fillid = 0, styleid = -1;
		var do_format = Array.isArray(styles.CellXf), cf;
		var arrayf = [];
		var sharedf = [];
		var dense = s["!data"] != null;
		var rows = [], rowobj = {}, rowrite = false;
		var sheetStubs = !!opts.sheetStubs;
		var date1904 = !!((wb || {}).WBProps || {}).date1904;
		for (var marr = sdata.split(rowregex), mt = 0, marrlen = marr.length; mt != marrlen; ++mt) {
			x = marr[mt].trim();
			var xlen = x.length;
			if (xlen === 0) continue;
			var rstarti = 0;
			outa: for (ri = 0; ri < xlen; ++ri) switch (x[ri]) {
				case ">":
					if (x[ri - 1] != "/") {
						++ri;
						break outa;
					}
					if (opts && opts.cellStyles) {
						tag = parsexmltag(x.slice(rstarti, ri), true);
						tagr = tag.r != null ? parseInt(tag.r, 10) : tagr + 1;
						tagc = -1;
						if (opts.sheetRows && opts.sheetRows < tagr) continue;
						rowobj = {};
						rowrite = false;
						if (tag.ht) {
							rowrite = true;
							rowobj.hpt = parseFloat(tag.ht);
							rowobj.hpx = pt2px(rowobj.hpt);
						}
						if (tag.hidden && parsexmlbool(tag.hidden)) {
							rowrite = true;
							rowobj.hidden = true;
						}
						if (tag.outlineLevel != null) {
							rowrite = true;
							rowobj.level = +tag.outlineLevel;
						}
						if (rowrite) rows[tagr - 1] = rowobj;
					}
					break;
				case "<":
					rstarti = ri;
					break;
			}
			if (rstarti >= ri) break;
			tag = parsexmltag(x.slice(rstarti, ri), true);
			tagr = tag.r != null ? parseInt(tag.r, 10) : tagr + 1;
			tagc = -1;
			if (opts.sheetRows && opts.sheetRows < tagr) continue;
			if (!opts.nodim) {
				if (guess.s.r > tagr - 1) guess.s.r = tagr - 1;
				if (guess.e.r < tagr - 1) guess.e.r = tagr - 1;
			}
			if (opts && opts.cellStyles) {
				rowobj = {};
				rowrite = false;
				if (tag.ht) {
					rowrite = true;
					rowobj.hpt = parseFloat(tag.ht);
					rowobj.hpx = pt2px(rowobj.hpt);
				}
				if (tag.hidden && parsexmlbool(tag.hidden)) {
					rowrite = true;
					rowobj.hidden = true;
				}
				if (tag.outlineLevel != null) {
					rowrite = true;
					rowobj.level = +tag.outlineLevel;
				}
				if (rowrite) rows[tagr - 1] = rowobj;
			}
			cells = x.slice(ri).split(cellregex);
			for (var rslice = 0; rslice != cells.length; ++rslice) if (cells[rslice].trim().charAt(0) != "<") break;
			cells = cells.slice(rslice);
			for (ri = 0; ri != cells.length; ++ri) {
				x = cells[ri].trim();
				if (x.length === 0) continue;
				cref = x.match(rregex);
				idx = ri;
				i = 0;
				cc = 0;
				x = "<c " + (x.slice(0, 1) == "<" ? ">" : "") + x;
				if (cref != null && cref.length === 2) {
					idx = 0;
					d = cref[1];
					for (i = 0; i != d.length; ++i) {
						if ((cc = d.charCodeAt(i) - 64) < 1 || cc > 26) break;
						idx = 26 * idx + cc;
					}
					--idx;
					tagc = idx;
				} else ++tagc;
				for (i = 0; i != x.length; ++i) if (x.charCodeAt(i) === 62) break;
				++i;
				tag = parsexmltag(x.slice(0, i), true);
				if (!tag.r) tag.r = encode_cell({
					r: tagr - 1,
					c: tagc
				});
				d = x.slice(i);
				p = { t: "" };
				if ((cref = str_match_xml_ns(d, "v")) != null && cref[1] !== "") p.v = unescapexml(cref[1]);
				if (opts.cellFormula) {
					if ((cref = str_match_xml_ns(d, "f")) != null) if (cref[1] == "") {
						if (cref[0].indexOf("t=\"shared\"") > -1) {
							ftag = parsexmltag(cref[0]);
							if (sharedf[ftag.si]) p.f = shift_formula_xlsx(sharedf[ftag.si][1], sharedf[ftag.si][2], tag.r);
						}
					} else {
						p.f = unescapexml(utf8read(cref[1]), true);
						if (!opts.xlfn) p.f = _xlfn(p.f);
						if (cref[0].indexOf("t=\"array\"") > -1) {
							p.F = (d.match(refregex) || [])[1];
							if (p.F.indexOf(":") > -1) arrayf.push([safe_decode_range(p.F), p.F]);
						} else if (cref[0].indexOf("t=\"shared\"") > -1) {
							ftag = parsexmltag(cref[0]);
							var ___f = unescapexml(utf8read(cref[1]), true);
							if (!opts.xlfn) ___f = _xlfn(___f);
							sharedf[parseInt(ftag.si, 10)] = [
								ftag,
								___f,
								tag.r
							];
						}
					}
					else if (cref = d.match(/<f[^<>]*\/>/)) {
						ftag = parsexmltag(cref[0]);
						if (sharedf[ftag.si]) p.f = shift_formula_xlsx(sharedf[ftag.si][1], sharedf[ftag.si][2], tag.r);
					}
					var _tag = decode_cell(tag.r);
					for (i = 0; i < arrayf.length; ++i) if (_tag.r >= arrayf[i][0].s.r && _tag.r <= arrayf[i][0].e.r) {
						if (_tag.c >= arrayf[i][0].s.c && _tag.c <= arrayf[i][0].e.c) p.F = arrayf[i][1];
					}
				}
				if (tag.t == null && p.v === void 0) if (p.f || p.F) {
					p.v = 0;
					p.t = "n";
				} else if (!sheetStubs) continue;
				else p.t = "z";
				else p.t = tag.t || "n";
				if (guess.s.c > tagc) guess.s.c = tagc;
				if (guess.e.c < tagc) guess.e.c = tagc;
				switch (p.t) {
					case "n":
						if (p.v == "" || p.v == null) {
							if (!sheetStubs) continue;
							p.t = "z";
						} else p.v = parseFloat(p.v);
						break;
					case "s":
						if (typeof p.v == "undefined") {
							if (!sheetStubs) continue;
							p.t = "z";
						} else {
							sstr = strs[parseInt(p.v, 10)];
							p.v = sstr.t;
							p.r = sstr.r;
							if (opts.cellHTML) p.h = sstr.h;
						}
						break;
					case "str":
						p.t = "s";
						p.v = p.v != null ? unescapexml(utf8read(p.v), true) : "";
						if (opts.cellHTML) p.h = escapehtml(p.v);
						break;
					case "inlineStr":
						cref = str_match_xml_ns(d, "is");
						p.t = "s";
						if (cref != null && (sstr = parse_si(cref[1]))) {
							p.v = sstr.t;
							if (opts.cellHTML) p.h = sstr.h;
						} else p.v = "";
						break;
					case "b":
						p.v = parsexmlbool(p.v);
						break;
					case "d":
						if (opts.cellDates) p.v = parseDate(p.v, date1904);
						else {
							p.v = datenum(parseDate(p.v, date1904), date1904);
							p.t = "n";
						}
						break;
					case "e":
						if (!opts || opts.cellText !== false) p.w = p.v;
						p.v = RBErr[p.v];
				}
				fmtid = fillid = 0;
				styleid = -1;
				cf = null;
				if (do_format && tag.s !== void 0) {
					styleid = parseInt(tag.s, 10);
					cf = styles.CellXf[styleid];
					if (cf != null) {
						if (cf.numFmtId != null) fmtid = cf.numFmtId;
						if (opts.cellStyles) {
							if (cf.fillId != null) fillid = cf.fillId;
						}
					}
				}
				safe_format(p, fmtid, fillid, opts, themes, styles, date1904, cf, styleid);
				if (opts.cellDates && do_format && p.t == "n" && fmt_is_date(table_fmt[fmtid])) {
					p.v = numdate(p.v + (date1904 ? 1462 : 0));
					p.t = typeof p.v == "number" ? "n" : "d";
				}
				if (tag.cm && opts.xlmeta) {
					var cm = (opts.xlmeta.Cell || [])[+tag.cm - 1];
					if (cm && cm.type == "XLDAPR") p.D = true;
				}
				var _r;
				if (opts.nodim) {
					_r = decode_cell(tag.r);
					if (guess.s.r > _r.r) guess.s.r = _r.r;
					if (guess.e.r < _r.r) guess.e.r = _r.r;
				}
				if (dense) {
					_r = decode_cell(tag.r);
					if (!s["!data"][_r.r]) s["!data"][_r.r] = [];
					s["!data"][_r.r][_r.c] = p;
				} else s[tag.r] = p;
			}
		}
		if (rows.length > 0) s["!rows"] = rows;
	};
})();
var TABLE_STYLE_MAX_TABLES = 1024;
var TABLE_STYLE_MAX_COLUMNS = 16384;
var TABLE_STYLE_MAX_XML_LENGTH = 5242880;
var TABLE_STYLE_ELEMENT_TYPES = {
	wholeTable: true,
	headerRow: true,
	totalRow: true,
	firstColumn: true,
	lastColumn: true,
	firstRowStripe: true,
	secondRowStripe: true,
	firstColumnStripe: true,
	secondColumnStripe: true,
	firstHeaderCell: true,
	lastHeaderCell: true,
	firstTotalCell: true,
	lastTotalCell: true
};
function table_style_safe_key(key) {
	return key != "__proto__" && key != "constructor" && key != "prototype";
}
function table_style_element_type(type) {
	return Object.prototype.hasOwnProperty.call(TABLE_STYLE_ELEMENT_TYPES, type);
}
function table_style_attr(y, name) {
	if (y[name] != null) return y[name];
	return y[name.toLowerCase()];
}
function table_style_bool(y, name, fallback) {
	var value = table_style_attr(y, name);
	return value == null ? fallback : parsexmlbool(value);
}
function table_style_int(y, name) {
	var value = table_style_attr(y, name);
	if (value == null || value === "") return void 0;
	value = parseInt(value, 10);
	return isFinite(value) && value >= 0 ? value : void 0;
}
function table_style_merge(target, source) {
	if (!source) return target;
	if (!target) target = {};
	keys(source).forEach(function(k) {
		if (!table_style_safe_key(k)) return;
		var value = source[k];
		if (value && typeof value == "object" && !Array.isArray(value)) target[k] = table_style_merge(target[k] && typeof target[k] == "object" && !Array.isArray(target[k]) ? table_style_merge({}, target[k]) : {}, value);
		else target[k] = value;
	});
	return target;
}
function table_style_color(themes, theme, tint) {
	return style_color_from_attrs({
		theme: String(theme),
		tint: String(tint || 0)
	}, themes);
}
function table_style_fill(color) {
	return { fill: {
		patternType: "solid",
		fgColor: color
	} };
}
function table_style_font(color, bold) {
	var font = {};
	if (color) font.color = color;
	if (bold) font.bold = 1;
	return { font };
}
function table_style_border(side, color, style) {
	var border = {}, out = { border };
	border[side] = {
		style: style || "thin",
		color
	};
	return out;
}
function table_style_accent(themes, index) {
	var position = (index - 1) % 7;
	return table_style_color(themes, position ? 3 + position : 1, 0);
}
function built_in_table_style_rules(name, themes) {
	var match = /^TableStyle(Light|Medium|Dark)(\d+)$/i.exec(name || "");
	if (!match) return null;
	var family = match[1].toLowerCase(), index = parseInt(match[2], 10);
	if (index < 1 || index > (family == "light" ? 21 : family == "medium" ? 28 : 11)) return null;
	var accent = table_style_accent(themes, index);
	var white = table_style_color(themes, 0, 0);
	var dark = table_style_color(themes, 1, 0);
	var rules = {};
	if (family == "light") {
		rules.headerRow = table_style_merge(table_style_font(accent, true), table_style_border("bottom", accent, "medium"));
		rules.totalRow = table_style_merge(table_style_font(accent, true), table_style_border("top", accent, "double"));
		rules.firstRowStripe = table_style_fill(table_style_color(themes, accent.theme, .9));
		rules.firstColumnStripe = rules.firstRowStripe;
	} else if (family == "medium") {
		var group = Math.floor((index - 1) / 7);
		rules.headerRow = table_style_merge(table_style_fill(accent), table_style_font(white, true));
		rules.totalRow = table_style_merge(table_style_font(accent, true), table_style_border("top", accent, "double"));
		if (group == 1) {
			rules.wholeTable = table_style_fill(table_style_color(themes, accent.theme, .8));
			rules.firstRowStripe = table_style_fill(table_style_color(themes, accent.theme, .6));
			rules.firstColumnStripe = rules.firstRowStripe;
		} else if (group == 2) {
			rules.firstRowStripe = table_style_fill(table_style_color(themes, accent.theme, .8));
			rules.firstColumnStripe = rules.firstRowStripe;
			rules.wholeTable = table_style_border("bottom", table_style_color(themes, accent.theme, .4), "thin");
		} else if (group == 3) {
			rules.wholeTable = table_style_fill(table_style_color(themes, accent.theme, .9));
			rules.firstRowStripe = table_style_fill(table_style_color(themes, accent.theme, .7));
			rules.firstColumnStripe = rules.firstRowStripe;
		} else {
			rules.firstRowStripe = table_style_fill(table_style_color(themes, accent.theme, .8));
			rules.firstColumnStripe = rules.firstRowStripe;
		}
	} else {
		rules.wholeTable = table_style_merge(table_style_fill(dark), table_style_font(white, false));
		rules.headerRow = table_style_merge(table_style_fill(accent), table_style_font(white, true));
		rules.firstRowStripe = table_style_fill(table_style_color(themes, accent.theme, -.35));
		rules.firstColumnStripe = rules.firstRowStripe;
		rules.totalRow = table_style_merge(table_style_font(white, true), table_style_border("top", accent, "double"));
	}
	rules.firstColumn = table_style_font(null, true);
	rules.lastColumn = table_style_font(null, true);
	return rules;
}
function custom_table_style_rules(name, styles) {
	var tableStyles = styles && styles.TableStyles;
	if (!tableStyles || !tableStyles.styles) return null;
	for (var i = 0; i < tableStyles.styles.length; ++i) {
		var tableStyle = tableStyles.styles[i];
		if (tableStyle.name != name) continue;
		var rules = Object.create(null);
		(tableStyle.elements || []).forEach(function(element) {
			if (!table_style_element_type(element.type)) return;
			var dxf = styles.Dxfs && styles.Dxfs[element.dxfId];
			if (dxf) rules[element.type] = {
				style: dup(dxf),
				size: element.size || 1
			};
		});
		return rules;
	}
	return null;
}
function parse_table_xml(data, path, themes, styles, opts) {
	if (!data || data.length > TABLE_STYLE_MAX_XML_LENGTH) return null;
	data = remove_doctype(str_remove_ng(data, "<!--", "-->"));
	var table = { columns: [] }, column = null, pass = false;
	(data.match(tagregex) || []).forEach(function(x) {
		var y = parsexmltag(x), tag = strip_ns(y[0]);
		switch (tag) {
			case "<table":
			case "<table>":
				table.id = table_style_int(y, "id");
				table.name = utf8read(unescapexml(table_style_attr(y, "name") || ""));
				table.displayName = utf8read(unescapexml(table_style_attr(y, "displayName") || table.name));
				table.ref = table_style_attr(y, "ref") || "";
				table.headerRowCount = table_style_int(y, "headerRowCount");
				table.totalsRowCount = table_style_int(y, "totalsRowCount");
				table.totalsRowShown = table_style_bool(y, "totalsRowShown", false);
				table.headerRowDxfId = table_style_int(y, "headerRowDxfId");
				table.dataDxfId = table_style_int(y, "dataDxfId");
				table.totalsRowDxfId = table_style_int(y, "totalsRowDxfId");
				table.path = path;
				break;
			case "<tableColumn":
			case "<tableColumn>":
			case "<tableColumn/>":
				if (table.columns.length >= TABLE_STYLE_MAX_COLUMNS) {
					column = null;
					break;
				}
				column = {
					id: table_style_int(y, "id"),
					name: utf8read(unescapexml(table_style_attr(y, "name") || "")),
					headerRowDxfId: table_style_int(y, "headerRowDxfId"),
					dataDxfId: table_style_int(y, "dataDxfId"),
					totalsRowDxfId: table_style_int(y, "totalsRowDxfId")
				};
				table.columns.push(column);
				if (tag.slice(-2) == "/>") column = null;
				break;
			case "</tableColumn>":
				column = null;
				break;
			case "<tableStyleInfo":
			case "<tableStyleInfo>":
			case "<tableStyleInfo/>":
				table.styleInfo = {
					name: utf8read(unescapexml(table_style_attr(y, "name") || "")),
					showFirstColumn: table_style_bool(y, "showFirstColumn", false),
					showLastColumn: table_style_bool(y, "showLastColumn", false),
					showRowStripes: table_style_bool(y, "showRowStripes", false),
					showColumnStripes: table_style_bool(y, "showColumnStripes", false)
				};
				break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			default: if (opts && opts.WTF && !pass) {
				if (/^<\/?(?:tableColumns|autoFilter|sortState|calculatedColumnFormula|totalsRowFormula|xmlColumnPr)/.test(tag)) break;
			}
		}
	});
	if (!table.ref) return null;
	try {
		table.range = safe_decode_range(table.ref);
		if (table.range.s.r < 0 || table.range.s.c < 0 || table.range.e.r > 1048575 || table.range.e.c > 16383) return null;
	} catch (e) {
		return null;
	}
	var styleName = table.styleInfo && table.styleInfo.name;
	table.styleRules = custom_table_style_rules(styleName, styles) || built_in_table_style_rules(styleName, themes) || {};
	table.dxfs = styles && styles.Dxfs ? styles.Dxfs : [];
	return table;
}
function parse_sheet_tables(sheet, zip, path, rels, opts, themes, styles) {
	if (!sheet || !rels || !rels["!id"] || !opts || !opts.cellStyles) return;
	var tables = [], seen = Object.create(null);
	keys(rels["!id"]).forEach(function(id) {
		if (tables.length >= TABLE_STYLE_MAX_TABLES) return;
		var rel = rels["!id"][id];
		if (!rel || rel.TargetMode == "External" || typeof rel.Target != "string" || !rel.Target || rel.Type != RELS.TABLE && !/\/table$/.test(rel.Type || "")) return;
		var tablePath = resolve_path(rel.Target, path);
		if (seen[tablePath]) return;
		seen[tablePath] = true;
		var table = parse_table_xml(getzipstr(zip, tablePath, true), tablePath, themes, styles, opts);
		if (table) tables.push(table);
	});
	if (tables.length) sheet["!tables"] = tables;
}
function table_style_rule_value(rule) {
	return rule && rule.style ? rule.style : rule;
}
function table_style_stripe_rule(first, second, offset) {
	var firstSize = first && first.size || 1;
	var period = firstSize + (second && second.size || 1);
	if (!period) return null;
	return offset % period < firstSize ? first : second;
}
function table_style_dxf(table, id) {
	return id == null || !table.dxfs ? null : table.dxfs[id];
}
function resolve_table_cell_style(ws, row, col, baseStyle) {
	var tables = ws && ws["!tables"];
	var resolved = baseStyle ? table_style_merge({}, baseStyle) : {};
	if (!tables || !tables.length) return keys(resolved).length ? resolved : void 0;
	for (var i = 0; i < tables.length; ++i) {
		var table = tables[i], range = table.range;
		if (!range || row < range.s.r || row > range.e.r || col < range.s.c || col > range.e.c) continue;
		var rules = table.styleRules || {}, info = table.styleInfo || {};
		var rowOffset = row - range.s.r, colOffset = col - range.s.c;
		var headerRows = table.headerRowCount == null ? 1 : table.headerRowCount;
		var totalRows = table.totalsRowCount != null ? table.totalsRowCount : table.totalsRowShown ? 1 : 0;
		var dataStart = headerRows, dataEnd = range.e.r - range.s.r - totalRows;
		var isHeader = rowOffset < headerRows;
		var isTotal = totalRows > 0 && rowOffset > dataEnd;
		var dataOffset = rowOffset - dataStart;
		var column = table.columns && table.columns[colOffset];
		resolved = table_style_merge(resolved, table_style_rule_value(rules.wholeTable));
		if (!isHeader && !isTotal && dataOffset >= 0) {
			if (info.showRowStripes) resolved = table_style_merge(resolved, table_style_rule_value(table_style_stripe_rule(rules.firstRowStripe, rules.secondRowStripe, dataOffset)));
			if (info.showColumnStripes) resolved = table_style_merge(resolved, table_style_rule_value(table_style_stripe_rule(rules.firstColumnStripe, rules.secondColumnStripe, colOffset)));
		}
		if (info.showFirstColumn && col == range.s.c) resolved = table_style_merge(resolved, table_style_rule_value(rules.firstColumn));
		if (info.showLastColumn && col == range.e.c) resolved = table_style_merge(resolved, table_style_rule_value(rules.lastColumn));
		if (isHeader) {
			resolved = table_style_merge(resolved, table_style_rule_value(rules.headerRow));
			if (col == range.s.c) resolved = table_style_merge(resolved, table_style_rule_value(rules.firstHeaderCell));
			if (col == range.e.c) resolved = table_style_merge(resolved, table_style_rule_value(rules.lastHeaderCell));
			resolved = table_style_merge(resolved, table_style_dxf(table, table.headerRowDxfId));
			resolved = table_style_merge(resolved, table_style_dxf(table, column && column.headerRowDxfId));
		} else if (isTotal) {
			resolved = table_style_merge(resolved, table_style_rule_value(rules.totalRow));
			if (col == range.s.c) resolved = table_style_merge(resolved, table_style_rule_value(rules.firstTotalCell));
			if (col == range.e.c) resolved = table_style_merge(resolved, table_style_rule_value(rules.lastTotalCell));
			resolved = table_style_merge(resolved, table_style_dxf(table, table.totalsRowDxfId));
			resolved = table_style_merge(resolved, table_style_dxf(table, column && column.totalsRowDxfId));
		} else {
			resolved = table_style_merge(resolved, table_style_dxf(table, table.dataDxfId));
			resolved = table_style_merge(resolved, table_style_dxf(table, column && column.dataDxfId));
		}
	}
	return keys(resolved).length ? resolved : void 0;
}
function parse_BrtRowHdr(data, length) {
	var z = {};
	var tgt = data.l + length;
	z.r = data.read_shift(4);
	data.l += 4;
	var miyRw = data.read_shift(2);
	data.l += 1;
	var flags = data.read_shift(1);
	data.l = tgt;
	if (flags & 7) z.level = flags & 7;
	if (flags & 16) z.hidden = true;
	if (flags & 32) z.hpt = miyRw / 20;
	return z;
}
var parse_BrtWsDim = parse_UncheckedRfX;
function parse_BrtWsFmtInfo() {}
function parse_BrtWsProp(data, length) {
	var z = {};
	var f = data[data.l];
	++data.l;
	z.above = !(f & 64);
	z.left = !(f & 128);
	data.l += 18;
	z.name = parse_XLSBCodeName(data, length - 19);
	return z;
}
function parse_BrtCellBlank(data) {
	return [parse_XLSBCell(data)];
}
function parse_BrtShortBlank(data) {
	return [parse_XLSBShortCell(data)];
}
function parse_BrtCellBool(data) {
	return [
		parse_XLSBCell(data),
		data.read_shift(1),
		"b"
	];
}
function parse_BrtShortBool(data) {
	return [
		parse_XLSBShortCell(data),
		data.read_shift(1),
		"b"
	];
}
function parse_BrtCellError(data) {
	return [
		parse_XLSBCell(data),
		data.read_shift(1),
		"e"
	];
}
function parse_BrtShortError(data) {
	return [
		parse_XLSBShortCell(data),
		data.read_shift(1),
		"e"
	];
}
function parse_BrtCellIsst(data) {
	return [
		parse_XLSBCell(data),
		data.read_shift(4),
		"s"
	];
}
function parse_BrtShortIsst(data) {
	return [
		parse_XLSBShortCell(data),
		data.read_shift(4),
		"s"
	];
}
function parse_BrtCellReal(data) {
	return [
		parse_XLSBCell(data),
		parse_Xnum(data),
		"n"
	];
}
function parse_BrtShortReal(data) {
	return [
		parse_XLSBShortCell(data),
		parse_Xnum(data),
		"n"
	];
}
function parse_BrtCellRk(data) {
	return [
		parse_XLSBCell(data),
		parse_RkNumber(data),
		"n"
	];
}
function parse_BrtShortRk(data) {
	return [
		parse_XLSBShortCell(data),
		parse_RkNumber(data),
		"n"
	];
}
function parse_BrtCellRString(data) {
	return [
		parse_XLSBCell(data),
		parse_RichStr(data),
		"is"
	];
}
function parse_BrtCellSt(data) {
	return [
		parse_XLSBCell(data),
		parse_XLWideString(data),
		"str"
	];
}
function parse_BrtShortSt(data) {
	return [
		parse_XLSBShortCell(data),
		parse_XLWideString(data),
		"str"
	];
}
function parse_BrtFmlaBool(data, length, opts) {
	var end = data.l + length;
	var cell = parse_XLSBCell(data);
	cell.r = opts["!row"];
	var o = [
		cell,
		data.read_shift(1),
		"b"
	];
	if (opts.cellFormula) {
		data.l += 2;
		o[3] = stringify_formula(parse_XLSBCellParsedFormula(data, end - data.l, opts), null, cell, opts.supbooks, opts);
	} else data.l = end;
	return o;
}
function parse_BrtFmlaError(data, length, opts) {
	var end = data.l + length;
	var cell = parse_XLSBCell(data);
	cell.r = opts["!row"];
	var o = [
		cell,
		data.read_shift(1),
		"e"
	];
	if (opts.cellFormula) {
		data.l += 2;
		o[3] = stringify_formula(parse_XLSBCellParsedFormula(data, end - data.l, opts), null, cell, opts.supbooks, opts);
	} else data.l = end;
	return o;
}
function parse_BrtFmlaNum(data, length, opts) {
	var end = data.l + length;
	var cell = parse_XLSBCell(data);
	cell.r = opts["!row"];
	var o = [
		cell,
		parse_Xnum(data),
		"n"
	];
	if (opts.cellFormula) {
		data.l += 2;
		o[3] = stringify_formula(parse_XLSBCellParsedFormula(data, end - data.l, opts), null, cell, opts.supbooks, opts);
	} else data.l = end;
	return o;
}
function parse_BrtFmlaString(data, length, opts) {
	var end = data.l + length;
	var cell = parse_XLSBCell(data);
	cell.r = opts["!row"];
	var o = [
		cell,
		parse_XLWideString(data),
		"str"
	];
	if (opts.cellFormula) {
		data.l += 2;
		o[3] = stringify_formula(parse_XLSBCellParsedFormula(data, end - data.l, opts), null, cell, opts.supbooks, opts);
	} else data.l = end;
	return o;
}
var parse_BrtMergeCell = parse_UncheckedRfX;
function parse_BrtHLink(data, length) {
	var end = data.l + length;
	var rfx = parse_UncheckedRfX(data, 16);
	var relId = parse_XLNullableWideString(data);
	var loc = parse_XLWideString(data);
	var tooltip = parse_XLWideString(data);
	var display = parse_XLWideString(data);
	data.l = end;
	var o = {
		rfx,
		relId,
		loc,
		display
	};
	if (tooltip) o.Tooltip = tooltip;
	return o;
}
function parse_BrtPane() {}
function parse_BrtArrFmla(data, length, opts) {
	var end = data.l + length;
	var rfx = parse_RfX(data, 16);
	var fAlwaysCalc = data.read_shift(1);
	var o = [rfx];
	o[2] = fAlwaysCalc;
	if (opts.cellFormula) o[1] = parse_XLSBArrayParsedFormula(data, end - data.l, opts);
	else data.l = end;
	return o;
}
function parse_BrtShrFmla(data, length, opts) {
	var end = data.l + length;
	var o = [parse_UncheckedRfX(data, 16)];
	if (opts.cellFormula) {
		o[1] = parse_XLSBSharedParsedFormula(data, end - data.l, opts);
		data.l = end;
	} else data.l = end;
	return o;
}
var BrtMarginKeys = [
	"left",
	"right",
	"top",
	"bottom",
	"header",
	"footer"
];
function parse_BrtMargins(data) {
	var margins = {};
	BrtMarginKeys.forEach(function(k) {
		margins[k] = parse_Xnum(data, 8);
	});
	return margins;
}
function parse_BrtBeginWsView(data) {
	var f = data.read_shift(2);
	data.l += 28;
	return { RTL: f & 32 };
}
function parse_BrtDVal() {}
function parse_BrtDVal14() {}
function parse_ws_bin(data, _opts, idx, rels, wb, themes, styles) {
	if (!data) return data;
	var opts = _opts || {};
	if (!rels) rels = { "!id": {} };
	if (DENSE != null && opts.dense == null) opts.dense = DENSE;
	var s = {};
	if (opts.dense) s["!data"] = [];
	var ref;
	var refguess = {
		s: {
			r: 2e6,
			c: 2e6
		},
		e: {
			r: 0,
			c: 0
		}
	};
	var state = [];
	var pass = false, end = false;
	var row, p, cf, R, C, addr, sstr, rr, cell;
	var merges = [];
	opts.biff = 12;
	opts["!row"] = 0;
	var ai = 0, af = false;
	var arrayf = [];
	var sharedf = {};
	var supbooks = opts.supbooks || wb.supbooks || [[]];
	supbooks.sharedf = sharedf;
	supbooks.arrayf = arrayf;
	supbooks.SheetNames = wb.SheetNames || wb.Sheets.map(function(x) {
		return x.name;
	});
	if (!opts.supbooks) {
		opts.supbooks = supbooks;
		if (wb.Names) for (var i = 0; i < wb.Names.length; ++i) supbooks[0][i + 1] = wb.Names[i];
	}
	var colinfo = [], rowinfo = [];
	var seencol = false;
	XLSBRecordEnum[16] = {
		n: "BrtShortReal",
		f: parse_BrtShortReal
	};
	var cm, vm;
	var date1904 = 1462 * +!!((wb || {}).WBProps || {}).date1904;
	recordhopper(data, function ws_parse(val, RR, RT) {
		if (end) return;
		switch (RT) {
			case 148:
				ref = val;
				break;
			case 0:
				row = val;
				if (opts.sheetRows && opts.sheetRows <= row.r) end = true;
				rr = encode_row(R = row.r);
				opts["!row"] = row.r;
				if (val.hidden || val.hpt || val.level != null) {
					if (val.hpt) val.hpx = pt2px(val.hpt);
					rowinfo[val.r] = val;
				}
				break;
			case 2:
			case 3:
			case 4:
			case 5:
			case 6:
			case 7:
			case 8:
			case 9:
			case 10:
			case 11:
			case 13:
			case 14:
			case 15:
			case 16:
			case 17:
			case 18:
			case 62:
				p = { t: val[2] };
				switch (val[2]) {
					case "n":
						p.v = val[1];
						break;
					case "s":
						sstr = strs[val[1]];
						p.v = sstr.t;
						p.r = sstr.r;
						break;
					case "b":
						p.v = val[1] ? true : false;
						break;
					case "e":
						p.v = val[1];
						if (opts.cellText !== false) p.w = BErr[p.v];
						break;
					case "str":
						p.t = "s";
						p.v = val[1];
						break;
					case "is":
						p.t = "s";
						p.v = val[1].t;
				}
				if (cf = styles.CellXf[val[0].iStyleRef]) safe_format(p, cf.numFmtId, null, opts, themes, styles, date1904 > 0, cf, val[0].iStyleRef);
				C = val[0].c == -1 ? C + 1 : val[0].c;
				if (opts.dense) {
					if (!s["!data"][R]) s["!data"][R] = [];
					s["!data"][R][C] = p;
				} else s[encode_col(C) + rr] = p;
				if (opts.cellFormula) {
					af = false;
					for (ai = 0; ai < arrayf.length; ++ai) {
						var aii = arrayf[ai];
						if (row.r >= aii[0].s.r && row.r <= aii[0].e.r) {
							if (C >= aii[0].s.c && C <= aii[0].e.c) {
								p.F = encode_range(aii[0]);
								af = true;
							}
						}
					}
					if (!af && val.length > 3) p.f = val[3];
				}
				if (refguess.s.r > row.r) refguess.s.r = row.r;
				if (refguess.s.c > C) refguess.s.c = C;
				if (refguess.e.r < row.r) refguess.e.r = row.r;
				if (refguess.e.c < C) refguess.e.c = C;
				if (opts.cellDates && cf && p.t == "n" && fmt_is_date(table_fmt[cf.numFmtId])) {
					var _d = SSF_parse_date_code(p.v + date1904);
					if (_d) {
						p.t = "d";
						p.v = new Date(Date.UTC(_d.y, _d.m - 1, _d.d, _d.H, _d.M, _d.S, _d.u));
					}
				}
				if (cm) {
					if (cm.type == "XLDAPR") p.D = true;
					cm = void 0;
				}
				if (vm) vm = void 0;
				break;
			case 1:
			case 12:
				if (!opts.sheetStubs || pass) break;
				p = {
					t: "z",
					v: void 0
				};
				C = val[0].c == -1 ? C + 1 : val[0].c;
				if (opts.dense) {
					if (!s["!data"][R]) s["!data"][R] = [];
					s["!data"][R][C] = p;
				} else s[encode_col(C) + rr] = p;
				if (refguess.s.r > row.r) refguess.s.r = row.r;
				if (refguess.s.c > C) refguess.s.c = C;
				if (refguess.e.r < row.r) refguess.e.r = row.r;
				if (refguess.e.c < C) refguess.e.c = C;
				if (cm) {
					if (cm.type == "XLDAPR") p.D = true;
					cm = void 0;
				}
				if (vm) vm = void 0;
				break;
			case 176:
				merges.push(val);
				break;
			case 49:
				cm = ((opts.xlmeta || {}).Cell || [])[val - 1];
				break;
			case 494:
				var rel = rels["!id"][val.relId];
				if (rel) {
					val.Target = rel.Target;
					if (val.loc) val.Target += "#" + val.loc;
					val.Rel = rel;
				} else if (val.relId == "") val.Target = "#" + val.loc;
				for (R = val.rfx.s.r; R <= val.rfx.e.r; ++R) for (C = val.rfx.s.c; C <= val.rfx.e.c; ++C) if (opts.dense) {
					if (!s["!data"][R]) s["!data"][R] = [];
					if (!s["!data"][R][C]) s["!data"][R][C] = {
						t: "z",
						v: void 0
					};
					s["!data"][R][C].l = val;
				} else {
					addr = encode_col(C) + encode_row(R);
					if (!s[addr]) s[addr] = {
						t: "z",
						v: void 0
					};
					s[addr].l = val;
				}
				break;
			case 426:
				if (!opts.cellFormula) break;
				arrayf.push(val);
				cell = opts.dense ? s["!data"][R][C] : s[encode_col(C) + rr];
				cell.f = stringify_formula(val[1], refguess, {
					r: row.r,
					c: C
				}, supbooks, opts);
				cell.F = encode_range(val[0]);
				break;
			case 427:
				if (!opts.cellFormula) break;
				sharedf[encode_cell(val[0].s)] = val[1];
				cell = opts.dense ? s["!data"][R][C] : s[encode_col(C) + rr];
				cell.f = stringify_formula(val[1], refguess, {
					r: row.r,
					c: C
				}, supbooks, opts);
				break;
			case 60:
				if (!opts.cellStyles) break;
				while (val.e >= val.s) {
					colinfo[val.e--] = {
						width: val.w / 256,
						hidden: !!(val.flags & 1),
						level: val.level
					};
					if (!seencol) {
						seencol = true;
						MDW = DEF_MDW;
					}
					process_col(colinfo[val.e + 1]);
				}
				break;
			case 551:
				if (val) s["!legrel"] = val;
				break;
			case 161:
				s["!autofilter"] = { ref: encode_range(val) };
				break;
			case 476:
				s["!margins"] = val;
				break;
			case 147:
				if (!wb.Sheets[idx]) wb.Sheets[idx] = {};
				if (val.name) wb.Sheets[idx].CodeName = val.name;
				if (val.above || val.left) s["!outline"] = {
					above: val.above,
					left: val.left
				};
				break;
			case 137:
				if (!wb.Views) wb.Views = [{}];
				if (!wb.Views[0]) wb.Views[0] = {};
				if (val.RTL) wb.Views[0].RTL = true;
				break;
			case 485: break;
			case 64:
			case 1053: break;
			case 151: break;
			case 152:
			case 175:
			case 644:
			case 625:
			case 562:
			case 396:
			case 1112:
			case 1146:
			case 471:
			case 1050:
			case 649:
			case 1105:
			case 589:
			case 607:
			case 564:
			case 1055:
			case 168:
			case 174:
			case 1180:
			case 499:
			case 507:
			case 550:
			case 171:
			case 167:
			case 1177:
			case 169:
			case 1181:
			case 552:
			case 661:
			case 639:
			case 478:
			case 537:
			case 477:
			case 536:
			case 1103:
			case 680:
			case 1104:
			case 1024:
			case 663:
			case 535:
			case 678:
			case 504:
			case 1043:
			case 428:
			case 170:
			case 3072:
			case 50:
			case 2070:
			case 1045: break;
			case 35:
				pass = true;
				break;
			case 36:
				pass = false;
				break;
			case 37:
				state.push(RT);
				pass = true;
				break;
			case 38:
				state.pop();
				pass = false;
				break;
			default: if (RR.T) {} else if (!pass || opts.WTF) throw new Error("Unexpected record 0x" + RT.toString(16));
		}
	}, opts);
	delete opts.supbooks;
	delete opts["!row"];
	if (!s["!ref"] && (refguess.s.r < 2e6 || ref && (ref.e.r > 0 || ref.e.c > 0 || ref.s.r > 0 || ref.s.c > 0))) s["!ref"] = encode_range(ref || refguess);
	if (opts.sheetRows && s["!ref"]) {
		var tmpref = safe_decode_range(s["!ref"]);
		if (opts.sheetRows <= +tmpref.e.r) {
			tmpref.e.r = opts.sheetRows - 1;
			if (tmpref.e.r > refguess.e.r) tmpref.e.r = refguess.e.r;
			if (tmpref.e.r < tmpref.s.r) tmpref.s.r = tmpref.e.r;
			if (tmpref.e.c > refguess.e.c) tmpref.e.c = refguess.e.c;
			if (tmpref.e.c < tmpref.s.c) tmpref.s.c = tmpref.e.c;
			s["!fullref"] = s["!ref"];
			s["!ref"] = encode_range(tmpref);
		}
	}
	if (merges.length > 0) s["!merges"] = merges;
	if (colinfo.length > 0) s["!cols"] = colinfo;
	if (rowinfo.length > 0) s["!rows"] = rowinfo;
	if (rels["!id"][s["!legrel"]]) s["!legdrawel"] = rels["!id"][s["!legrel"]];
	return s;
}
function parse_Cache(data) {
	var col = [];
	var num = data.match(/^<c:numCache>/);
	var f;
	(data.match(/<c:pt idx="(\d*)"[^<>\/]*><c:v>([^<]*)<\/c:v><\/c:pt>/gm) || []).forEach(function(pt) {
		var q = pt.match(/<c:pt idx="(\d*)"[^<>\/]*><c:v>([^<]*)<\/c:v><\/c:pt>/);
		if (!q) return;
		col[+q[1]] = num ? +q[2] : q[2];
	});
	var nf = unescapexml((str_match_xml(data, "c:formatCode") || ["", "General"])[1]);
	(str_match_ng(data, "<c:f>", "</c:f>") || []).forEach(function(F) {
		f = strip_xml_tags(F);
	});
	return [
		col,
		nf,
		f
	];
}
function parse_chart_cache(data) {
	var nc = str_match_ng(data, "<c:numCache>", "</c:numCache>");
	if (nc && nc.length) {
		var n = parse_Cache(nc[0]);
		return {
			values: n[0],
			formatCode: n[1],
			formula: n[2]
		};
	}
	var sc = str_match_ng(data, "<c:strCache>", "</c:strCache>");
	if (sc && sc.length) {
		var s = parse_Cache(sc[0]);
		return {
			values: s[0],
			formatCode: s[1],
			formula: s[2]
		};
	}
	var f = (str_match_ng(data, "<c:f>", "</c:f>") || [])[0];
	return {
		values: [],
		formula: f ? strip_xml_tags(f) : void 0
	};
}
function parse_chart_tx(data) {
	var tx = str_match_ng(data, "<c:tx>", "</c:tx>");
	if (!tx || !tx.length) return "";
	var v = str_match_xml_ns(tx[0], "v");
	if (v && v[1]) return unescapexml(v[1]);
	var f = str_match_xml_ns(tx[0], "f");
	if (f && f[1]) return unescapexml(f[1]);
	return "";
}
function parse_chart_series(data) {
	var ser = { name: parse_chart_tx(data) };
	var idx = str_match_xml_ns(data, "idx");
	if (idx) ser.idx = +(parsexmltag(idx[0]).val || 0);
	var order = str_match_xml_ns(data, "order");
	if (order) ser.order = +(parsexmltag(order[0]).val || 0);
	[
		"cat",
		"val",
		"xVal",
		"yVal",
		"bubbleSize"
	].forEach(function(k) {
		var m = str_match_xml_ns(data, k);
		if (m) ser[k] = parse_chart_cache(m[0]);
	});
	if (ser.val && ser.val.values) ser.data = ser.val.values;
	else if (ser.yVal && ser.yVal.values) ser.data = ser.yVal.values;
	return ser;
}
function parse_chart_title(data) {
	var title = str_match_xml_ns(data, "title");
	if (!title) return "";
	var out = [];
	(title[0].match(/<a:t\b[^>]*>[\s\S]*?<\/a:t>/g) || []).forEach(function(t) {
		out.push(unescapexml(strip_xml_tags(t)));
	});
	return out.join("");
}
function parse_chart_model(data, name, rels) {
	var model = {
		target: name,
		raw: data,
		rels,
		series: []
	};
	model.title = parse_chart_title(data);
	var plot = str_match_xml_ns(data, "plotArea");
	var body = plot ? plot[1] : data;
	[
		"barChart",
		"lineChart",
		"areaChart",
		"scatterChart",
		"pieChart",
		"doughnutChart",
		"bubbleChart"
	].forEach(function(type) {
		(str_match_ng(body, "<c:" + type + ">", "</c:" + type + ">") || []).forEach(function(chartXml) {
			if (!model.type) model.type = type;
			var grouping = str_match_xml_ns(chartXml, "grouping");
			if (grouping) model.grouping = parsexmltag(grouping[0]).val;
			(str_match_ng(chartXml, "<c:ser>", "</c:ser>") || []).forEach(function(serXml) {
				var ser = parse_chart_series(serXml);
				ser.chartType = type;
				model.series.push(ser);
			});
		});
	});
	var legend = str_match_xml_ns(data, "legend");
	if (legend) {
		model.legend = {};
		var pos = str_match_xml_ns(legend[0], "legendPos");
		if (pos) model.legend.position = parsexmltag(pos[0]).val;
	}
	return model;
}
function parse_chart(data, name, opts, rels, wb, csheet) {
	var cs = csheet || { "!type": "chart" };
	if (!data) return csheet;
	cs["!chart"] = parse_chart_model(data, name, rels);
	var C = 0, R = 0, col = "A";
	var refguess = {
		s: {
			r: 2e6,
			c: 2e6
		},
		e: {
			r: 0,
			c: 0
		}
	};
	(str_match_ng(data, "<c:numCache>", "</c:numCache>") || []).forEach(function(nc) {
		var cache = parse_Cache(nc);
		refguess.s.r = refguess.s.c = 0;
		refguess.e.c = C;
		col = encode_col(C);
		cache[0].forEach(function(n, i) {
			if (cs["!data"]) {
				if (!cs["!data"][i]) cs["!data"][i] = [];
				cs["!data"][i][C] = {
					t: "n",
					v: n,
					z: cache[1]
				};
			} else cs[col + encode_row(i)] = {
				t: "n",
				v: n,
				z: cache[1]
			};
			R = i;
		});
		if (refguess.e.r < R) refguess.e.r = R;
		++C;
	});
	if (C > 0) cs["!ref"] = encode_range(refguess);
	return cs;
}
function parse_cs_xml(data, opts, idx, rels, wb) {
	if (!data) return data;
	if (!rels) rels = { "!id": {} };
	var s = {
		"!type": "chart",
		"!drawel": null,
		"!rel": ""
	};
	var m;
	var sheetPr = data.match(sheetprregex);
	if (sheetPr) parse_ws_xml_sheetpr(sheetPr[0], s, wb, idx);
	if (m = data.match(/drawing r:id="(.*?)"/)) s["!rel"] = m[1];
	if (rels["!id"][s["!rel"]]) s["!drawel"] = rels["!id"][s["!rel"]];
	return s;
}
function parse_BrtCsProp(data, length) {
	data.l += 10;
	return { name: parse_XLWideString(data, length - 10) };
}
function parse_cs_bin(data, opts, idx, rels, wb) {
	if (!data) return data;
	if (!rels) rels = { "!id": {} };
	var s = {
		"!type": "chart",
		"!drawel": null,
		"!rel": ""
	};
	var state = [];
	var pass = false;
	recordhopper(data, function cs_parse(val, R, RT) {
		switch (RT) {
			case 550:
				s["!rel"] = val;
				break;
			case 651:
				if (!wb.Sheets[idx]) wb.Sheets[idx] = {};
				if (val.name) wb.Sheets[idx].CodeName = val.name;
				break;
			case 562:
			case 652:
			case 669:
			case 679:
			case 551:
			case 552:
			case 476:
			case 3072: break;
			case 35:
				pass = true;
				break;
			case 36:
				pass = false;
				break;
			case 37:
				state.push(RT);
				break;
			case 38:
				state.pop();
				break;
			default: if (R.T > 0) state.push(RT);
			else if (R.T < 0) state.pop();
			else if (!pass || opts.WTF) throw new Error("Unexpected record 0x" + RT.toString(16));
		}
	}, opts);
	if (rels["!id"][s["!rel"]]) s["!drawel"] = rels["!id"][s["!rel"]];
	return s;
}
var WBPropsDef = [
	[
		"allowRefreshQuery",
		false,
		"bool"
	],
	[
		"autoCompressPictures",
		true,
		"bool"
	],
	[
		"backupFile",
		false,
		"bool"
	],
	[
		"checkCompatibility",
		false,
		"bool"
	],
	["CodeName", ""],
	[
		"date1904",
		false,
		"bool"
	],
	[
		"defaultThemeVersion",
		0,
		"int"
	],
	[
		"filterPrivacy",
		false,
		"bool"
	],
	[
		"hidePivotFieldList",
		false,
		"bool"
	],
	[
		"promptedSolutions",
		false,
		"bool"
	],
	[
		"publishItems",
		false,
		"bool"
	],
	[
		"refreshAllConnections",
		false,
		"bool"
	],
	[
		"saveExternalLinkValues",
		true,
		"bool"
	],
	[
		"showBorderUnselectedTables",
		true,
		"bool"
	],
	[
		"showInkAnnotation",
		true,
		"bool"
	],
	["showObjects", "all"],
	[
		"showPivotChartFilter",
		false,
		"bool"
	],
	["updateLinks", "userSet"]
];
var WBViewDef = [
	[
		"activeTab",
		0,
		"int"
	],
	[
		"autoFilterDateGrouping",
		true,
		"bool"
	],
	[
		"firstSheet",
		0,
		"int"
	],
	[
		"minimized",
		false,
		"bool"
	],
	[
		"showHorizontalScroll",
		true,
		"bool"
	],
	[
		"showSheetTabs",
		true,
		"bool"
	],
	[
		"showVerticalScroll",
		true,
		"bool"
	],
	[
		"tabRatio",
		600,
		"int"
	],
	["visibility", "visible"]
];
var SheetDef = [];
var CalcPrDef = [
	["calcCompleted", "true"],
	["calcMode", "auto"],
	["calcOnSave", "true"],
	["concurrentCalc", "true"],
	["fullCalcOnLoad", "false"],
	["fullPrecision", "true"],
	["iterate", "false"],
	["iterateCount", "100"],
	["iterateDelta", "0.001"],
	["refMode", "A1"]
];
function push_defaults_array(target, defaults) {
	for (var j = 0; j != target.length; ++j) {
		var w = target[j];
		for (var i = 0; i != defaults.length; ++i) {
			var z = defaults[i];
			if (w[z[0]] == null) w[z[0]] = z[1];
			else switch (z[2]) {
				case "bool":
					if (typeof w[z[0]] == "string") w[z[0]] = parsexmlbool(w[z[0]]);
					break;
				case "int":
					if (typeof w[z[0]] == "string") w[z[0]] = parseInt(w[z[0]], 10);
					break;
			}
		}
	}
}
function push_defaults(target, defaults) {
	for (var i = 0; i != defaults.length; ++i) {
		var z = defaults[i];
		if (target[z[0]] == null) target[z[0]] = z[1];
		else switch (z[2]) {
			case "bool":
				if (typeof target[z[0]] == "string") target[z[0]] = parsexmlbool(target[z[0]]);
				break;
			case "int":
				if (typeof target[z[0]] == "string") target[z[0]] = parseInt(target[z[0]], 10);
				break;
		}
	}
}
function parse_wb_defaults(wb) {
	push_defaults(wb.WBProps, WBPropsDef);
	push_defaults(wb.CalcPr, CalcPrDef);
	push_defaults_array(wb.WBView, WBViewDef);
	push_defaults_array(wb.Sheets, SheetDef);
	_ssfopts.date1904 = parsexmlbool(wb.WBProps.date1904);
}
var badchars = /*#__PURE__*/ ":][*?/\\".split("");
function check_ws_name(n, safe) {
	try {
		if (n == "") throw new Error("Sheet name cannot be blank");
		if (n.length > 31) throw new Error("Sheet name cannot exceed 31 chars");
		if (n.charCodeAt(0) == 39 || n.charCodeAt(n.length - 1) == 39) throw new Error("Sheet name cannot start or end with apostrophe (')");
		if (n.toLowerCase() == "history") throw new Error("Sheet name cannot be 'History'");
		badchars.forEach(function(c) {
			if (n.indexOf(c) == -1) return;
			throw new Error("Sheet name cannot contain : \\ / ? * [ ]");
		});
	} catch (e) {
		if (safe) return false;
		throw e;
	}
	return true;
}
var wbnsregex = /<\w+:workbook/;
function parse_wb_xml(data, opts) {
	if (!data) throw new Error("Could not find file");
	var wb = {
		AppVersion: {},
		WBProps: {},
		WBView: [],
		Sheets: [],
		CalcPr: {},
		Names: [],
		xmlns: ""
	};
	var pass = false, xmlns = "xmlns";
	var dname = {}, dnstart = 0;
	data.replace(tagregex, function xml_wb(x, idx) {
		var y = parsexmltag(x);
		switch (strip_ns(y[0])) {
			case "<?xml": break;
			case "<workbook":
				if (x.match(wbnsregex)) xmlns = "xmlns" + x.match(/<(\w+):/)[1];
				wb.xmlns = y[xmlns];
				break;
			case "</workbook>": break;
			case "<fileVersion":
				delete y[0];
				wb.AppVersion = y;
				break;
			case "<fileVersion/>":
			case "</fileVersion>": break;
			case "<fileSharing": break;
			case "<fileSharing/>": break;
			case "<workbookPr":
			case "<workbookPr/>":
				WBPropsDef.forEach(function(w) {
					if (y[w[0]] == null) return;
					switch (w[2]) {
						case "bool":
							wb.WBProps[w[0]] = parsexmlbool(y[w[0]]);
							break;
						case "int":
							wb.WBProps[w[0]] = parseInt(y[w[0]], 10);
							break;
						default: wb.WBProps[w[0]] = y[w[0]];
					}
				});
				if (y.codeName) wb.WBProps.CodeName = utf8read(y.codeName);
				break;
			case "</workbookPr>": break;
			case "<workbookProtection": break;
			case "<workbookProtection/>": break;
			case "<bookViews":
			case "<bookViews>":
			case "</bookViews>": break;
			case "<workbookView":
			case "<workbookView/>":
				delete y[0];
				wb.WBView.push(y);
				break;
			case "</workbookView>": break;
			case "<sheets":
			case "<sheets>":
			case "</sheets>": break;
			case "<sheet":
				switch (y.state) {
					case "hidden":
						y.Hidden = 1;
						break;
					case "veryHidden":
						y.Hidden = 2;
						break;
					default: y.Hidden = 0;
				}
				delete y.state;
				y.name = unescapexml(utf8read(y.name));
				delete y[0];
				wb.Sheets.push(y);
				break;
			case "</sheet>": break;
			case "<functionGroups":
			case "<functionGroups/>": break;
			case "<functionGroup": break;
			case "<externalReferences":
			case "</externalReferences>":
			case "<externalReferences>": break;
			case "<externalReference": break;
			case "<definedNames/>": break;
			case "<definedNames>":
			case "<definedNames":
				pass = true;
				break;
			case "</definedNames>":
				pass = false;
				break;
			case "<definedName":
				dname = {};
				dname.Name = utf8read(y.name);
				if (y.comment) dname.Comment = y.comment;
				if (y.localSheetId) dname.Sheet = +y.localSheetId;
				if (parsexmlbool(y.hidden || "0")) dname.Hidden = true;
				dnstart = idx + x.length;
				break;
			case "</definedName>":
				dname.Ref = unescapexml(utf8read(data.slice(dnstart, idx)));
				wb.Names.push(dname);
				break;
			case "<definedName/>": break;
			case "<calcPr":
				delete y[0];
				wb.CalcPr = y;
				break;
			case "<calcPr/>":
				delete y[0];
				wb.CalcPr = y;
				break;
			case "</calcPr>": break;
			case "<oleSize": break;
			case "<customWorkbookViews>":
			case "</customWorkbookViews>":
			case "<customWorkbookViews": break;
			case "<customWorkbookView":
			case "</customWorkbookView>": break;
			case "<pivotCaches>":
			case "</pivotCaches>":
			case "<pivotCaches": break;
			case "<pivotCache": break;
			case "<smartTagPr":
			case "<smartTagPr/>": break;
			case "<smartTagTypes":
			case "<smartTagTypes>":
			case "</smartTagTypes>": break;
			case "<smartTagType": break;
			case "<webPublishing":
			case "<webPublishing/>": break;
			case "<fileRecoveryPr":
			case "<fileRecoveryPr/>": break;
			case "<webPublishObjects>":
			case "<webPublishObjects":
			case "</webPublishObjects>": break;
			case "<webPublishObject": break;
			case "<extLst":
			case "<extLst>":
			case "</extLst>":
			case "<extLst/>": break;
			case "<ext":
				pass = true;
				break;
			case "</ext>":
				pass = false;
				break;
			case "<ArchID": break;
			case "<AlternateContent":
			case "<AlternateContent>":
				pass = true;
				break;
			case "</AlternateContent>":
				pass = false;
				break;
			case "<revisionPtr": break;
			default: if (!pass && opts.WTF) throw new Error("unrecognized " + y[0] + " in workbook");
		}
		return x;
	});
	if (XMLNS_main.indexOf(wb.xmlns) === -1) throw new Error("Unknown Namespace: " + wb.xmlns);
	parse_wb_defaults(wb);
	return wb;
}
function parse_BrtBundleSh(data, length) {
	var z = {};
	z.Hidden = data.read_shift(4);
	z.iTabID = data.read_shift(4);
	z.strRelID = parse_RelID(data, length - 8);
	z.name = parse_XLWideString(data);
	return z;
}
function parse_BrtWbProp(data, length) {
	var o = {};
	var flags = data.read_shift(4);
	o.defaultThemeVersion = data.read_shift(4);
	var strName = length > 8 ? parse_XLWideString(data) : "";
	if (strName.length > 0) o.CodeName = strName;
	o.autoCompressPictures = !!(flags & 65536);
	o.backupFile = !!(flags & 64);
	o.checkCompatibility = !!(flags & 4096);
	o.date1904 = !!(flags & 1);
	o.filterPrivacy = !!(flags & 8);
	o.hidePivotFieldList = !!(flags & 1024);
	o.promptedSolutions = !!(flags & 16);
	o.publishItems = !!(flags & 2048);
	o.refreshAllConnections = !!(flags & 262144);
	o.saveExternalLinkValues = !!(flags & 128);
	o.showBorderUnselectedTables = !!(flags & 4);
	o.showInkAnnotation = !!(flags & 32);
	o.showObjects = [
		"all",
		"placeholders",
		"none"
	][flags >> 13 & 3];
	o.showPivotChartFilter = !!(flags & 32768);
	o.updateLinks = [
		"userSet",
		"never",
		"always"
	][flags >> 8 & 3];
	return o;
}
function parse_BrtFRTArchID$(data, length) {
	var o = {};
	data.read_shift(4);
	o.ArchID = data.read_shift(4);
	data.l += length - 8;
	return o;
}
function parse_BrtName(data, length, opts) {
	var end = data.l + length;
	var flags = data.read_shift(4);
	data.l += 1;
	var itab = data.read_shift(4);
	var name = parse_XLNameWideString(data);
	var formula;
	var comment = "";
	try {
		formula = parse_XLSBNameParsedFormula(data, 0, opts);
		try {
			comment = parse_XLNullableWideString(data);
		} catch (e) {}
	} catch (e) {
		console.error("Could not parse defined name " + name);
	}
	if (flags & 32) name = "_xlnm." + name;
	data.l = end;
	var out = {
		Name: name,
		Ptg: formula,
		Flags: flags
	};
	if (itab < 268435455) out.Sheet = itab;
	if (comment) out.Comment = comment;
	return out;
}
function parse_wb_bin(data, opts) {
	var wb = {
		AppVersion: {},
		WBProps: {},
		WBView: [],
		Sheets: [],
		CalcPr: {},
		xmlns: ""
	};
	var state = [];
	var pass = false;
	if (!opts) opts = {};
	opts.biff = 12;
	var Names = [];
	var supbooks = [[]];
	supbooks.SheetNames = [];
	supbooks.XTI = [];
	XLSBRecordEnum[16] = {
		n: "BrtFRTArchID$",
		f: parse_BrtFRTArchID$
	};
	recordhopper(data, function hopper_wb(val, R, RT) {
		switch (RT) {
			case 156:
				supbooks.SheetNames.push(val.name);
				wb.Sheets.push(val);
				break;
			case 153:
				wb.WBProps = val;
				break;
			case 39:
				if (val.Sheet != null) opts.SID = val.Sheet;
				val.Ref = val.Ptg ? stringify_formula(val.Ptg, null, null, supbooks, opts) : "#REF!";
				delete opts.SID;
				delete val.Ptg;
				Names.push(val);
				break;
			case 1036: break;
			case 357:
			case 358:
			case 355:
			case 667:
				if (!supbooks[0].length) supbooks[0] = [RT, val];
				else supbooks.push([RT, val]);
				supbooks[supbooks.length - 1].XTI = [];
				break;
			case 362:
				if (supbooks.length === 0) {
					supbooks[0] = [];
					supbooks[0].XTI = [];
				}
				supbooks[supbooks.length - 1].XTI = supbooks[supbooks.length - 1].XTI.concat(val);
				supbooks.XTI = supbooks.XTI.concat(val);
				break;
			case 361: break;
			case 2071:
			case 158:
			case 143:
			case 664:
			case 353: break;
			case 3072:
			case 3073:
			case 534:
			case 677:
			case 157:
			case 610:
			case 2050:
			case 155:
			case 548:
			case 676:
			case 128:
			case 665:
			case 2128:
			case 2125:
			case 549:
			case 2053:
			case 596:
			case 2076:
			case 2075:
			case 2082:
			case 397:
			case 154:
			case 1117:
			case 553:
			case 2091: break;
			case 35:
				state.push(RT);
				pass = true;
				break;
			case 36:
				state.pop();
				pass = false;
				break;
			case 37:
				state.push(RT);
				pass = true;
				break;
			case 38:
				state.pop();
				pass = false;
				break;
			case 16: break;
			default: if (R.T) {} else if (!pass || opts.WTF && state[state.length - 1] != 37 && state[state.length - 1] != 35) throw new Error("Unexpected record 0x" + RT.toString(16));
		}
	}, opts);
	parse_wb_defaults(wb);
	wb.Names = Names;
	wb.supbooks = supbooks;
	return wb;
}
function parse_wb(data, name, opts) {
	if (name.slice(-4) === ".bin") return parse_wb_bin(data, opts);
	return parse_wb_xml(data, opts);
}
function parse_ws(data, name, idx, opts, rels, wb, themes, styles) {
	if (name.slice(-4) === ".bin") return parse_ws_bin(data, opts, idx, rels, wb, themes, styles);
	return parse_ws_xml(data, opts, idx, rels, wb, themes, styles);
}
function parse_cs(data, name, idx, opts, rels, wb, themes, styles) {
	if (name.slice(-4) === ".bin") return parse_cs_bin(data, opts, idx, rels, wb, themes, styles);
	return parse_cs_xml(data, opts, idx, rels, wb, themes, styles);
}
function parse_ms(data, name, idx, opts, rels, wb, themes, styles) {
	if (name.slice(-4) === ".bin") return parse_ms_bin(data, opts, idx, rels, wb, themes, styles);
	return parse_ms_xml(data, opts, idx, rels, wb, themes, styles);
}
function parse_ds(data, name, idx, opts, rels, wb, themes, styles) {
	if (name.slice(-4) === ".bin") return parse_ds_bin(data, opts, idx, rels, wb, themes, styles);
	return parse_ds_xml(data, opts, idx, rels, wb, themes, styles);
}
function parse_sty(data, name, themes, opts) {
	if (name.slice(-4) === ".bin") return parse_sty_bin(data, themes, opts);
	return parse_sty_xml(data, themes, opts);
}
function parse_sst(data, name, opts) {
	if (name.slice(-4) === ".bin") return parse_sst_bin(data, opts);
	return parse_sst_xml(data, opts);
}
function parse_cmnt(data, name, opts) {
	if (name.slice(-4) === ".bin") return parse_comments_bin(data, opts);
	return parse_comments_xml(data, opts);
}
function parse_cc(data, name, opts) {
	if (name.slice(-4) === ".bin") return parse_cc_bin(data, name, opts);
	return parse_cc_xml(data, name, opts);
}
function parse_xlink(data, rel, name, opts) {
	if (name.slice(-4) === ".bin") return parse_xlink_bin(data, rel, name, opts);
}
function parse_xlmeta(data, name, opts) {
	if (name.slice(-4) === ".bin") return parse_xlmeta_bin(data, name, opts);
	return parse_xlmeta_xml(data, name, opts);
}
var attregexg2 = /\b((?:\w+:)?[\w]+)=((?:")([^"]*)(?:")|(?:')([^']*)(?:'))/g;
var attregex2 = /\b((?:\w+:)?[\w]+)=((?:")(?:[^"]*)(?:")|(?:')(?:[^']*)(?:'))/;
function xlml_parsexmltag(tag, skip_root) {
	var words = tag.split(/\s+/);
	var z = [];
	if (!skip_root) z[0] = words[0];
	if (words.length === 1) return z;
	var m = tag.match(attregexg2), y, j, w, i;
	if (m) for (i = 0; i != m.length; ++i) {
		y = m[i].match(attregex2);
		if ((j = y[1].indexOf(":")) === -1) z[y[1]] = y[2].slice(1, y[2].length - 1);
		else {
			if (y[1].slice(0, 6) === "xmlns:") w = "xmlns" + y[1].slice(6);
			else w = y[1].slice(j + 1);
			z[w] = y[2].slice(1, y[2].length - 1);
		}
	}
	return z;
}
function xlml_parsexmltagobj(tag) {
	var words = tag.split(/\s+/);
	var z = {};
	if (words.length === 1) return z;
	var m = tag.match(attregexg2), y, j, w, i;
	if (m) for (i = 0; i != m.length; ++i) {
		y = m[i].match(attregex2);
		if ((j = y[1].indexOf(":")) === -1) z[y[1]] = y[2].slice(1, y[2].length - 1);
		else {
			if (y[1].slice(0, 6) === "xmlns:") w = "xmlns" + y[1].slice(6);
			else w = y[1].slice(j + 1);
			z[w] = y[2].slice(1, y[2].length - 1);
		}
	}
	return z;
}
var XLMLFormatMap;
function xlml_format(format, value, date1904) {
	var fmt = XLMLFormatMap[format] || unescapexml(format);
	if (fmt === "General") return SSF_general(value);
	return SSF_format(fmt, value, { date1904: !!date1904 });
}
function xlml_set_custprop(Custprops, key, cp, val) {
	var oval = val;
	switch ((cp[0].match(/dt:dt="([\w.]+)"/) || ["", ""])[1]) {
		case "boolean":
			oval = parsexmlbool(val);
			break;
		case "i2":
		case "int":
			oval = parseInt(val, 10);
			break;
		case "r4":
		case "float":
			oval = parseFloat(val);
			break;
		case "date":
		case "dateTime.tz":
			oval = parseDate(val);
			break;
		case "i8":
		case "string":
		case "fixed":
		case "uuid":
		case "bin.base64": break;
		default: throw new Error("bad custprop:" + cp[0]);
	}
	Custprops[unescapexml(key)] = oval;
}
function safe_format_xlml(cell, nf, o, date1904) {
	if (cell.t === "z") return;
	if (!o || o.cellText !== false) try {
		if (cell.t === "e") cell.w = cell.w || BErr[cell.v];
		else if (nf === "General") if (cell.t === "n") if ((cell.v | 0) === cell.v) cell.w = cell.v.toString(10);
		else cell.w = SSF_general_num(cell.v);
		else cell.w = SSF_general(cell.v);
		else cell.w = xlml_format(nf || "General", cell.v, date1904);
	} catch (e) {
		if (o.WTF) throw e;
	}
	try {
		var z = XLMLFormatMap[nf] || nf || "General";
		if (o.cellNF) cell.z = z;
		if (o.cellDates && cell.t == "n" && fmt_is_date(z)) {
			var _d = SSF_parse_date_code(cell.v + (date1904 ? 1462 : 0));
			if (_d) {
				cell.t = "d";
				cell.v = new Date(Date.UTC(_d.y, _d.m - 1, _d.d, _d.H, _d.M, _d.S, _d.u));
			}
		}
	} catch (e) {
		if (o.WTF) throw e;
	}
}
function process_style_xlml(styles, stag, opts) {
	if (opts.cellStyles) {
		if (stag.Interior) {
			var I = stag.Interior;
			if (I.Pattern) I.patternType = XLMLPatternTypeMap[I.Pattern] || I.Pattern;
		}
	}
	styles[stag.ID] = stag;
}
function parse_xlml_data(xml, ss, data, cell, base, styles, csty, row, arrayf, o, date1904) {
	var nf = "General", sid = cell.StyleID, S = {};
	o = o || {};
	var interiors = [];
	var i = 0;
	if (sid === void 0 && row) sid = row.StyleID;
	if (sid === void 0 && csty) sid = csty.StyleID;
	while (styles[sid] !== void 0) {
		var ssid = styles[sid];
		if (ssid.nf) nf = ssid.nf;
		if (ssid.Interior) interiors.push(ssid.Interior);
		if (!ssid.Parent) break;
		sid = ssid.Parent;
	}
	switch (data.Type) {
		case "Boolean":
			cell.t = "b";
			cell.v = parsexmlbool(xml);
			break;
		case "String":
			cell.t = "s";
			cell.r = xlml_fixstr(unescapexml(xml));
			cell.v = xml.indexOf("<") > -1 ? strip_xml_tags(unescapexml(ss || xml)) : cell.r;
			break;
		case "DateTime":
			if (xml.slice(-1) != "Z") xml += "Z";
			cell.v = datenum(parseDate(xml, date1904), date1904);
			if (cell.v !== cell.v) cell.v = unescapexml(xml);
			if (!nf || nf == "General") nf = "yyyy-mm-dd";
		case "Number":
			if (cell.v === void 0) cell.v = +xml;
			if (!cell.t) cell.t = "n";
			break;
		case "Error":
			cell.t = "e";
			cell.v = RBErr[xml];
			if (o.cellText !== false) cell.w = xml;
			break;
		default: if (xml == "" && ss == "") cell.t = "z";
		else {
			cell.t = "s";
			cell.v = xlml_fixstr(ss || xml);
		}
	}
	safe_format_xlml(cell, nf, o, date1904);
	if (o.cellFormula !== false) {
		if (cell.Formula) {
			var fstr = unescapexml(cell.Formula);
			if (fstr.charCodeAt(0) == 61) fstr = fstr.slice(1);
			cell.f = rc_to_a1(fstr, base);
			delete cell.Formula;
			if (cell.ArrayRange == "RC") cell.F = rc_to_a1("RC:RC", base);
			else if (cell.ArrayRange) {
				cell.F = rc_to_a1(cell.ArrayRange, base);
				arrayf.push([safe_decode_range(cell.F), cell.F]);
			}
		} else for (i = 0; i < arrayf.length; ++i) if (base.r >= arrayf[i][0].s.r && base.r <= arrayf[i][0].e.r) {
			if (base.c >= arrayf[i][0].s.c && base.c <= arrayf[i][0].e.c) cell.F = arrayf[i][1];
		}
	}
	if (o.cellStyles) {
		interiors.forEach(function(x) {
			if (!S.patternType && x.patternType) S.patternType = x.patternType;
		});
		cell.s = S;
	}
	if (cell.StyleID !== void 0) cell.ixfe = cell.StyleID;
}
function xlml_prefix_dname(dname) {
	return XLSLblBuiltIn.indexOf("_xlnm." + dname) > -1 ? "_xlnm." + dname : dname;
}
function xlml_clean_comment(comment) {
	comment.t = comment.v || "";
	comment.t = comment.t.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
	comment.v = comment.w = comment.ixfe = void 0;
}
function parse_xlml_xml(d, _opts) {
	var opts = _opts || {};
	make_ssf();
	var str = debom(xlml_normalize(d));
	if (opts.type == "binary" || opts.type == "array" || opts.type == "base64") if (typeof $cptable !== "undefined") str = $cptable.utils.decode(65001, char_codes(str));
	else str = utf8read(str);
	var opening = str.slice(0, 1024).toLowerCase(), ishtml = false;
	opening = opening.replace(/".*?"/g, "");
	if ((opening.indexOf(">") & 1023) > Math.min(opening.indexOf(",") & 1023, opening.indexOf(";") & 1023)) {
		var _o = dup(opts);
		_o.type = "string";
		return PRN.to_workbook(str, _o);
	}
	if (opening.indexOf("<?xml") == -1) [
		"html",
		"table",
		"head",
		"meta",
		"script",
		"style",
		"div"
	].forEach(function(tag) {
		if (opening.indexOf("<" + tag) >= 0) ishtml = true;
	});
	if (ishtml) return html_to_workbook(str, opts);
	XLMLFormatMap = {
		"General Number": "General",
		"General Date": table_fmt[22],
		"Long Date": "dddd, mmmm dd, yyyy",
		"Medium Date": table_fmt[15],
		"Short Date": table_fmt[14],
		"Long Time": table_fmt[19],
		"Medium Time": table_fmt[18],
		"Short Time": table_fmt[20],
		"Currency": "\"$\"#,##0.00_);[Red]\\(\"$\"#,##0.00\\)",
		"Fixed": table_fmt[2],
		"Standard": table_fmt[4],
		"Percent": table_fmt[10],
		"Scientific": table_fmt[11],
		"Yes/No": "\"Yes\";\"Yes\";\"No\";@",
		"True/False": "\"True\";\"True\";\"False\";@",
		"On/Off": "\"Yes\";\"Yes\";\"No\";@"
	};
	var Rn;
	var state = [], tmp;
	if (DENSE != null && opts.dense == null) opts.dense = DENSE;
	var sheets = sheet_map_new(), sheetnames = [], cursheet = {}, sheetname = "";
	if (opts.dense) cursheet["!data"] = [];
	var cell = {}, row = {};
	var dtag = xlml_parsexmltag("<Data ss:Type=\"String\">"), didx = 0;
	var c = 0, r = 0;
	var refguess = {
		s: {
			r: 2e6,
			c: 2e6
		},
		e: {
			r: 0,
			c: 0
		}
	};
	var styles = {}, stag = {};
	var ss = "", fidx = 0;
	var merges = [];
	var Props = {}, Custprops = {}, pidx = 0, cp = [];
	var comments = [], comment = {};
	var cstys = [], csty, seencol = false;
	var arrayf = [];
	var rowinfo = [], rowobj = {}, cc = 0, rr = 0;
	var Workbook = {
		Sheets: [],
		WBProps: { date1904: false }
	}, wsprops = {};
	xlmlregex.lastIndex = 0;
	str = str_remove_ng(str, "<!--", "-->");
	var raw_Rn3 = "";
	while (Rn = xlmlregex.exec(str)) switch (Rn[3] = (raw_Rn3 = Rn[3]).toLowerCase()) {
		case "data":
			if (raw_Rn3 == "data") {
				if (Rn[1] === "/") {
					if ((tmp = state.pop())[0] !== Rn[3]) throw new Error("Bad state: " + tmp.join("|"));
				} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") state.push([Rn[3], true]);
				break;
			}
			if (state[state.length - 1][1]) break;
			if (Rn[1] === "/") parse_xlml_data(str.slice(didx, Rn.index), ss, dtag, state[state.length - 1][0] == "comment" ? comment : cell, {
				c,
				r
			}, styles, cstys[c], row, arrayf, opts, Workbook.WBProps.date1904);
			else {
				ss = "";
				dtag = xlml_parsexmltag(Rn[0]);
				didx = Rn.index + Rn[0].length;
			}
			break;
		case "cell":
			if (Rn[1] === "/") {
				if (comments.length > 0) cell.c = comments;
				if ((!opts.sheetRows || opts.sheetRows > r) && cell.v !== void 0) if (opts.dense) {
					if (!cursheet["!data"][r]) cursheet["!data"][r] = [];
					cursheet["!data"][r][c] = cell;
				} else cursheet[encode_col(c) + encode_row(r)] = cell;
				if (cell.HRef) {
					cell.l = { Target: unescapexml(cell.HRef) };
					if (cell.HRefScreenTip) cell.l.Tooltip = cell.HRefScreenTip;
					delete cell.HRef;
					delete cell.HRefScreenTip;
				}
				if (cell.MergeAcross || cell.MergeDown) {
					cc = c + (parseInt(cell.MergeAcross, 10) | 0);
					rr = r + (parseInt(cell.MergeDown, 10) | 0);
					if (cc > c || rr > r) merges.push({
						s: {
							c,
							r
						},
						e: {
							c: cc,
							r: rr
						}
					});
				}
				if (!opts.sheetStubs) if (cell.MergeAcross) c = cc + 1;
				else ++c;
				else if (cell.MergeAcross || cell.MergeDown) {
					for (var cma = c; cma <= cc; ++cma) for (var cmd = r; cmd <= rr; ++cmd) if (cma > c || cmd > r) if (opts.dense) {
						if (!cursheet["!data"][cmd]) cursheet["!data"][cmd] = [];
						cursheet["!data"][cmd][cma] = { t: "z" };
					} else cursheet[encode_col(cma) + encode_row(cmd)] = { t: "z" };
					c = cc + 1;
				} else ++c;
			} else {
				cell = xlml_parsexmltagobj(Rn[0]);
				if (cell.Index) c = +cell.Index - 1;
				if (c < refguess.s.c) refguess.s.c = c;
				if (c > refguess.e.c) refguess.e.c = c;
				if (Rn[0].slice(-2) === "/>") ++c;
				comments = [];
			}
			break;
		case "row":
			if (Rn[1] === "/" || Rn[0].slice(-2) === "/>") {
				if (r < refguess.s.r) refguess.s.r = r;
				if (r > refguess.e.r) refguess.e.r = r;
				if (Rn[0].slice(-2) === "/>") {
					row = xlml_parsexmltag(Rn[0]);
					if (row.Index) r = +row.Index - 1;
				}
				c = 0;
				++r;
			} else {
				row = xlml_parsexmltag(Rn[0]);
				if (row.Index) r = +row.Index - 1;
				rowobj = {};
				if (row.AutoFitHeight == "0" || row.Height) {
					rowobj.hpx = parseInt(row.Height, 10);
					rowobj.hpt = px2pt(rowobj.hpx);
					rowinfo[r] = rowobj;
				}
				if (row.Hidden == "1") {
					rowobj.hidden = true;
					rowinfo[r] = rowobj;
				}
			}
			break;
		case "worksheet":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw new Error("Bad state: " + tmp.join("|"));
				sheetnames.push(sheetname);
				if (refguess.s.r <= refguess.e.r && refguess.s.c <= refguess.e.c) {
					cursheet["!ref"] = encode_range(refguess);
					if (opts.sheetRows && opts.sheetRows <= refguess.e.r) {
						cursheet["!fullref"] = cursheet["!ref"];
						refguess.e.r = opts.sheetRows - 1;
						cursheet["!ref"] = encode_range(refguess);
					}
				}
				if (merges.length) cursheet["!merges"] = merges;
				if (cstys.length > 0) cursheet["!cols"] = cstys;
				if (rowinfo.length > 0) cursheet["!rows"] = rowinfo;
				sheet_map_set(sheets, sheetname, cursheet);
			} else {
				refguess = {
					s: {
						r: 2e6,
						c: 2e6
					},
					e: {
						r: 0,
						c: 0
					}
				};
				r = c = 0;
				state.push([Rn[3], false]);
				tmp = xlml_parsexmltag(Rn[0]);
				sheetname = unescapexml(tmp.Name);
				cursheet = {};
				if (opts.dense) cursheet["!data"] = [];
				merges = [];
				arrayf = [];
				rowinfo = [];
				wsprops = {
					name: sheetname,
					Hidden: 0
				};
				Workbook.Sheets.push(wsprops);
			}
			break;
		case "table":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw new Error("Bad state: " + tmp.join("|"));
			} else if (Rn[0].slice(-2) == "/>") break;
			else {
				state.push([Rn[3], false]);
				cstys = [];
				seencol = false;
			}
			break;
		case "style":
			if (Rn[1] === "/") process_style_xlml(styles, stag, opts);
			else stag = xlml_parsexmltag(Rn[0]);
			break;
		case "numberformat":
			stag.nf = unescapexml(xlml_parsexmltag(Rn[0]).Format || "General");
			if (XLMLFormatMap[stag.nf]) stag.nf = XLMLFormatMap[stag.nf];
			for (var ssfidx = 0; ssfidx != 392; ++ssfidx) if (table_fmt[ssfidx] == stag.nf) break;
			if (ssfidx == 392) {
				for (ssfidx = 57; ssfidx != 392; ++ssfidx) if (table_fmt[ssfidx] == null) {
					SSF__load(stag.nf, ssfidx);
					break;
				}
			}
			break;
		case "column":
			if (state[state.length - 1][0] !== "table") break;
			if (Rn[1] === "/") break;
			csty = xlml_parsexmltag(Rn[0]);
			if (csty.Hidden) {
				csty.hidden = true;
				delete csty.Hidden;
			}
			if (csty.Width) csty.wpx = parseInt(csty.Width, 10);
			if (!seencol && csty.wpx > 10) {
				seencol = true;
				MDW = DEF_MDW;
				for (var _col = 0; _col < cstys.length; ++_col) if (cstys[_col]) process_col(cstys[_col]);
			}
			if (seencol) process_col(csty);
			cstys[csty.Index - 1 || cstys.length] = csty;
			for (var i = 0; i < +csty.Span; ++i) cstys[cstys.length] = dup(csty);
			break;
		case "namedrange":
			if (Rn[1] === "/") break;
			if (!Workbook.Names) Workbook.Names = [];
			var _NamedRange = parsexmltag(Rn[0]);
			var _DefinedName = {
				Name: xlml_prefix_dname(_NamedRange.Name),
				Ref: rc_to_a1(_NamedRange.RefersTo.slice(1), {
					r: 0,
					c: 0
				})
			};
			if (Workbook.Sheets.length > 0) _DefinedName.Sheet = Workbook.Sheets.length - 1;
			Workbook.Names.push(_DefinedName);
			break;
		case "namedcell": break;
		case "b": break;
		case "i": break;
		case "u": break;
		case "s": break;
		case "em": break;
		case "h2": break;
		case "h3": break;
		case "sub": break;
		case "sup": break;
		case "span": break;
		case "alignment": break;
		case "borders": break;
		case "border": break;
		case "font":
			if (Rn[0].slice(-2) === "/>") break;
			else if (Rn[1] === "/") ss += str.slice(fidx, Rn.index);
			else fidx = Rn.index + Rn[0].length;
			break;
		case "interior":
			if (!opts.cellStyles) break;
			stag.Interior = xlml_parsexmltag(Rn[0]);
			break;
		case "protection": break;
		case "author":
		case "title":
		case "description":
		case "created":
		case "keywords":
		case "subject":
		case "category":
		case "company":
		case "lastauthor":
		case "lastsaved":
		case "lastprinted":
		case "version":
		case "revision":
		case "totaltime":
		case "hyperlinkbase":
		case "manager":
		case "contentstatus":
		case "identifier":
		case "language":
		case "appname":
			if (Rn[0].slice(-2) === "/>") break;
			else if (Rn[1] === "/") xlml_set_prop(Props, raw_Rn3, str.slice(pidx, Rn.index));
			else pidx = Rn.index + Rn[0].length;
			break;
		case "paragraphs": break;
		case "styles":
		case "workbook":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw new Error("Bad state: " + tmp.join("|"));
			} else state.push([Rn[3], false]);
			break;
		case "comment":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw new Error("Bad state: " + tmp.join("|"));
				xlml_clean_comment(comment);
				comments.push(comment);
			} else {
				state.push([Rn[3], false]);
				tmp = xlml_parsexmltag(Rn[0]);
				if (!parsexmlbool(tmp["ShowAlways"] || "0")) comments.hidden = true;
				comment = { a: tmp.Author };
			}
			break;
		case "autofilter":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw new Error("Bad state: " + tmp.join("|"));
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") {
				var AutoFilter = xlml_parsexmltag(Rn[0]);
				cursheet["!autofilter"] = { ref: rc_to_a1(AutoFilter.Range).replace(/\$/g, "") };
				state.push([Rn[3], true]);
			}
			break;
		case "name": break;
		case "datavalidation":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw new Error("Bad state: " + tmp.join("|"));
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") state.push([Rn[3], true]);
			break;
		case "pixelsperinch": break;
		case "componentoptions":
		case "documentproperties":
		case "customdocumentproperties":
		case "officedocumentsettings":
		case "pivottable":
		case "pivotcache":
		case "names":
		case "mapinfo":
		case "pagebreaks":
		case "querytable":
		case "sorting":
		case "schema":
		case "conditionalformatting":
		case "smarttagtype":
		case "smarttags":
		case "excelworkbook":
		case "workbookoptions":
		case "worksheetoptions":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw new Error("Bad state: " + tmp.join("|"));
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") state.push([Rn[3], true]);
			break;
		case "null": break;
		default:
			if (state.length == 0 && Rn[3] == "document") return parse_fods(str, opts);
			if (state.length == 0 && Rn[3] == "uof") return parse_fods(str, opts);
			var seen = true;
			switch (state[state.length - 1][0]) {
				case "officedocumentsettings":
					switch (Rn[3]) {
						case "allowpng": break;
						case "removepersonalinformation": break;
						case "downloadcomponents": break;
						case "locationofcomponents": break;
						case "colors": break;
						case "color": break;
						case "index": break;
						case "rgb": break;
						case "targetscreensize": break;
						case "readonlyrecommended": break;
						default: seen = false;
					}
					break;
				case "componentoptions":
					switch (Rn[3]) {
						case "toolbar": break;
						case "hideofficelogo": break;
						case "spreadsheetautofit": break;
						case "label": break;
						case "caption": break;
						case "maxheight": break;
						case "maxwidth": break;
						case "nextsheetnumber": break;
						default: seen = false;
					}
					break;
				case "excelworkbook":
					switch (Rn[3]) {
						case "date1904":
							Workbook.WBProps.date1904 = true;
							break;
						case "hidehorizontalscrollbar": break;
						case "hideverticalscrollbar": break;
						case "hideworkbooktabs": break;
						case "windowheight": break;
						case "windowwidth": break;
						case "windowtopx": break;
						case "windowtopy": break;
						case "tabratio": break;
						case "protectstructure": break;
						case "protectwindow": break;
						case "protectwindows": break;
						case "activesheet": break;
						case "displayinknotes": break;
						case "firstvisiblesheet": break;
						case "supbook": break;
						case "sheetname": break;
						case "sheetindex": break;
						case "sheetindexfirst": break;
						case "sheetindexlast": break;
						case "dll": break;
						case "acceptlabelsinformulas": break;
						case "donotsavelinkvalues": break;
						case "iteration": break;
						case "maxiterations": break;
						case "maxchange": break;
						case "path": break;
						case "xct": break;
						case "count": break;
						case "selectedsheets": break;
						case "calculation": break;
						case "uncalced": break;
						case "startupprompt": break;
						case "crn": break;
						case "externname": break;
						case "formula": break;
						case "colfirst": break;
						case "collast": break;
						case "wantadvise": break;
						case "boolean": break;
						case "error": break;
						case "text": break;
						case "ole": break;
						case "noautorecover": break;
						case "publishobjects": break;
						case "donotcalculatebeforesave": break;
						case "number": break;
						case "refmoder1c1": break;
						case "embedsavesmarttags": break;
						default: seen = false;
					}
					break;
				case "workbookoptions":
					switch (Rn[3]) {
						case "owcversion": break;
						case "height": break;
						case "width": break;
						default: seen = false;
					}
					break;
				case "worksheetoptions":
					switch (Rn[3]) {
						case "visible":
							if (Rn[0].slice(-2) === "/>") {} else if (Rn[1] === "/") switch (str.slice(pidx, Rn.index)) {
								case "SheetHidden":
									wsprops.Hidden = 1;
									break;
								case "SheetVeryHidden":
									wsprops.Hidden = 2;
									break;
							}
							else pidx = Rn.index + Rn[0].length;
							break;
						case "header":
							if (!cursheet["!margins"]) default_margins(cursheet["!margins"] = {}, "xlml");
							if (!isNaN(+parsexmltag(Rn[0]).Margin)) cursheet["!margins"].header = +parsexmltag(Rn[0]).Margin;
							break;
						case "footer":
							if (!cursheet["!margins"]) default_margins(cursheet["!margins"] = {}, "xlml");
							if (!isNaN(+parsexmltag(Rn[0]).Margin)) cursheet["!margins"].footer = +parsexmltag(Rn[0]).Margin;
							break;
						case "pagemargins":
							var pagemargins = parsexmltag(Rn[0]);
							if (!cursheet["!margins"]) default_margins(cursheet["!margins"] = {}, "xlml");
							if (!isNaN(+pagemargins.Top)) cursheet["!margins"].top = +pagemargins.Top;
							if (!isNaN(+pagemargins.Left)) cursheet["!margins"].left = +pagemargins.Left;
							if (!isNaN(+pagemargins.Right)) cursheet["!margins"].right = +pagemargins.Right;
							if (!isNaN(+pagemargins.Bottom)) cursheet["!margins"].bottom = +pagemargins.Bottom;
							break;
						case "displayrighttoleft":
							if (!Workbook.Views) Workbook.Views = [];
							if (!Workbook.Views[0]) Workbook.Views[0] = {};
							Workbook.Views[0].RTL = true;
							break;
						case "freezepanes": break;
						case "frozennosplit": break;
						case "splithorizontal":
						case "splitvertical": break;
						case "donotdisplaygridlines": break;
						case "activerow": break;
						case "activecol": break;
						case "toprowbottompane": break;
						case "leftcolumnrightpane": break;
						case "unsynced": break;
						case "print": break;
						case "printerrors": break;
						case "panes": break;
						case "scale": break;
						case "pane": break;
						case "number": break;
						case "layout": break;
						case "pagesetup": break;
						case "selected": break;
						case "protectobjects": break;
						case "enableselection": break;
						case "protectscenarios": break;
						case "validprinterinfo": break;
						case "horizontalresolution": break;
						case "verticalresolution": break;
						case "numberofcopies": break;
						case "activepane": break;
						case "toprowvisible": break;
						case "leftcolumnvisible": break;
						case "fittopage": break;
						case "rangeselection": break;
						case "papersizeindex": break;
						case "pagelayoutzoom": break;
						case "pagebreakzoom": break;
						case "filteron": break;
						case "fitwidth": break;
						case "fitheight": break;
						case "commentslayout": break;
						case "zoom": break;
						case "lefttoright": break;
						case "gridlines": break;
						case "allowsort": break;
						case "allowfilter": break;
						case "allowinsertrows": break;
						case "allowdeleterows": break;
						case "allowinsertcols": break;
						case "allowdeletecols": break;
						case "allowinserthyperlinks": break;
						case "allowformatcells": break;
						case "allowsizecols": break;
						case "allowsizerows": break;
						case "nosummaryrowsbelowdetail":
							if (!cursheet["!outline"]) cursheet["!outline"] = {};
							cursheet["!outline"].above = true;
							break;
						case "tabcolorindex": break;
						case "donotdisplayheadings": break;
						case "showpagelayoutzoom": break;
						case "nosummarycolumnsrightdetail":
							if (!cursheet["!outline"]) cursheet["!outline"] = {};
							cursheet["!outline"].left = true;
							break;
						case "blackandwhite": break;
						case "donotdisplayzeros": break;
						case "displaypagebreak": break;
						case "rowcolheadings": break;
						case "donotdisplayoutline": break;
						case "noorientation": break;
						case "allowusepivottables": break;
						case "zeroheight": break;
						case "viewablerange": break;
						case "selection": break;
						case "protectcontents": break;
						default: seen = false;
					}
					break;
				case "pivottable":
				case "pivotcache":
					switch (Rn[3]) {
						case "immediateitemsondrop": break;
						case "showpagemultipleitemlabel": break;
						case "compactrowindent": break;
						case "location": break;
						case "pivotfield": break;
						case "orientation": break;
						case "layoutform": break;
						case "layoutsubtotallocation": break;
						case "layoutcompactrow": break;
						case "position": break;
						case "pivotitem": break;
						case "datatype": break;
						case "datafield": break;
						case "sourcename": break;
						case "parentfield": break;
						case "ptlineitems": break;
						case "ptlineitem": break;
						case "countofsameitems": break;
						case "item": break;
						case "itemtype": break;
						case "ptsource": break;
						case "cacheindex": break;
						case "consolidationreference": break;
						case "filename": break;
						case "reference": break;
						case "nocolumngrand": break;
						case "norowgrand": break;
						case "blanklineafteritems": break;
						case "hidden": break;
						case "subtotal": break;
						case "basefield": break;
						case "mapchilditems": break;
						case "function": break;
						case "refreshonfileopen": break;
						case "printsettitles": break;
						case "mergelabels": break;
						case "defaultversion": break;
						case "refreshname": break;
						case "refreshdate": break;
						case "refreshdatecopy": break;
						case "versionlastrefresh": break;
						case "versionlastupdate": break;
						case "versionupdateablemin": break;
						case "versionrefreshablemin": break;
						case "calculation": break;
						default: seen = false;
					}
					break;
				case "pagebreaks":
					switch (Rn[3]) {
						case "colbreaks": break;
						case "colbreak": break;
						case "rowbreaks": break;
						case "rowbreak": break;
						case "colstart": break;
						case "colend": break;
						case "rowend": break;
						default: seen = false;
					}
					break;
				case "autofilter":
					switch (Rn[3]) {
						case "autofiltercolumn": break;
						case "autofiltercondition": break;
						case "autofilterand": break;
						case "autofilteror": break;
						default: seen = false;
					}
					break;
				case "querytable":
					switch (Rn[3]) {
						case "id": break;
						case "autoformatfont": break;
						case "autoformatpattern": break;
						case "querysource": break;
						case "querytype": break;
						case "enableredirections": break;
						case "refreshedinxl9": break;
						case "urlstring": break;
						case "htmltables": break;
						case "connection": break;
						case "commandtext": break;
						case "refreshinfo": break;
						case "notitles": break;
						case "nextid": break;
						case "columninfo": break;
						case "overwritecells": break;
						case "donotpromptforfile": break;
						case "textwizardsettings": break;
						case "source": break;
						case "number": break;
						case "decimal": break;
						case "thousandseparator": break;
						case "trailingminusnumbers": break;
						case "formatsettings": break;
						case "fieldtype": break;
						case "delimiters": break;
						case "tab": break;
						case "comma": break;
						case "autoformatname": break;
						case "versionlastedit": break;
						case "versionlastrefresh": break;
						default: seen = false;
					}
					break;
				case "datavalidation":
					switch (Rn[3]) {
						case "range": break;
						case "type": break;
						case "min": break;
						case "max": break;
						case "sort": break;
						case "descending": break;
						case "order": break;
						case "casesensitive": break;
						case "value": break;
						case "errorstyle": break;
						case "errormessage": break;
						case "errortitle": break;
						case "inputmessage": break;
						case "inputtitle": break;
						case "combohide": break;
						case "inputhide": break;
						case "condition": break;
						case "qualifier": break;
						case "useblank": break;
						case "value1": break;
						case "value2": break;
						case "format": break;
						case "cellrangelist": break;
						default: seen = false;
					}
					break;
				case "sorting":
				case "conditionalformatting":
					switch (Rn[3]) {
						case "range": break;
						case "type": break;
						case "min": break;
						case "max": break;
						case "sort": break;
						case "descending": break;
						case "order": break;
						case "casesensitive": break;
						case "value": break;
						case "errorstyle": break;
						case "errormessage": break;
						case "errortitle": break;
						case "cellrangelist": break;
						case "inputmessage": break;
						case "inputtitle": break;
						case "combohide": break;
						case "inputhide": break;
						case "condition": break;
						case "qualifier": break;
						case "useblank": break;
						case "value1": break;
						case "value2": break;
						case "format": break;
						default: seen = false;
					}
					break;
				case "mapinfo":
				case "schema":
				case "data":
					switch (Rn[3]) {
						case "map": break;
						case "entry": break;
						case "range": break;
						case "xpath": break;
						case "field": break;
						case "xsdtype": break;
						case "filteron": break;
						case "aggregate": break;
						case "elementtype": break;
						case "attributetype": break;
						case "schema":
						case "element":
						case "complextype":
						case "datatype":
						case "all":
						case "attribute":
						case "extends": break;
						case "row": break;
						default: seen = false;
					}
					break;
				case "smarttags": break;
				default: seen = false;
			}
			if (seen) break;
			if (Rn[3].match(/!\[CDATA/)) break;
			if (!state[state.length - 1][1]) throw "Unrecognized tag: " + Rn[3] + "|" + state.join("|");
			if (state[state.length - 1][0] === "customdocumentproperties") {
				if (Rn[0].slice(-2) === "/>") break;
				else if (Rn[1] === "/") xlml_set_custprop(Custprops, raw_Rn3, cp, str.slice(pidx, Rn.index));
				else {
					cp = Rn;
					pidx = Rn.index + Rn[0].length;
				}
				break;
			}
			if (opts.WTF) throw "Unrecognized tag: " + Rn[3] + "|" + state.join("|");
	}
	var out = {};
	if (!opts.bookSheets && !opts.bookProps) out.Sheets = sheets;
	out.SheetNames = sheetnames;
	out.Workbook = Workbook;
	out.SSF = dup(table_fmt);
	out.Props = Props;
	out.Custprops = Custprops;
	out.bookType = "xlml";
	return out;
}
function parse_xlml(data, opts) {
	fix_read_opts(opts = opts || {});
	switch (opts.type || "base64") {
		case "base64": return parse_xlml_xml(Base64_decode(data), opts);
		case "binary":
		case "buffer":
		case "file": return parse_xlml_xml(data, opts);
		case "array": return parse_xlml_xml(a2s(data), opts);
	}
}
function parse_compobj(obj) {
	var v = {};
	var o = obj.content;
	o.l = 28;
	v.AnsiUserType = o.read_shift(0, "lpstr-ansi");
	v.AnsiClipboardFormat = parse_ClipboardFormatOrAnsiString(o);
	if (o.length - o.l <= 4) return v;
	var m = o.read_shift(4);
	if (m == 0 || m > 40) return v;
	o.l -= 4;
	v.Reserved1 = o.read_shift(0, "lpstr-ansi");
	if (o.length - o.l <= 4) return v;
	m = o.read_shift(4);
	if (m !== 1907505652) return v;
	v.UnicodeClipboardFormat = parse_ClipboardFormatOrUnicodeString(o);
	m = o.read_shift(4);
	if (m == 0 || m > 40) return v;
	o.l -= 4;
	v.Reserved2 = o.read_shift(0, "lpwstr");
}
var CONTINUE_RT = [
	60,
	1084,
	2066,
	2165,
	2175
];
function slurp(RecordType, R, blob, length, opts) {
	var l = length;
	var bufs = [];
	var d = blob.slice(blob.l, blob.l + l);
	if (opts && opts.enc && opts.enc.insitu && d.length > 0) switch (RecordType) {
		case 9:
		case 521:
		case 1033:
		case 2057:
		case 47:
		case 405:
		case 225:
		case 406:
		case 312:
		case 404:
		case 10: break;
		case 133: break;
		default: opts.enc.insitu(d);
	}
	bufs.push(d);
	blob.l += l;
	var nextrt = __readUInt16LE(blob, blob.l), next = XLSRecordEnum[nextrt];
	var start = 0;
	while (next != null && CONTINUE_RT.indexOf(nextrt) > -1) {
		l = __readUInt16LE(blob, blob.l + 2);
		start = blob.l + 4;
		if (nextrt == 2066) start += 4;
		else if (nextrt == 2165 || nextrt == 2175) start += 12;
		d = blob.slice(start, blob.l + 4 + l);
		bufs.push(d);
		blob.l += 4 + l;
		next = XLSRecordEnum[nextrt = __readUInt16LE(blob, blob.l)];
	}
	var b = bconcat(bufs);
	prep_blob(b, 0);
	var ll = 0;
	b.lens = [];
	for (var j = 0; j < bufs.length; ++j) {
		b.lens.push(ll);
		ll += bufs[j].length;
	}
	if (b.length < length) throw "XLS Record 0x" + RecordType.toString(16) + " Truncated: " + b.length + " < " + length;
	return R.f(b, b.length, opts);
}
function safe_format_xf(p, opts, date1904) {
	if (p.t === "z") return;
	if (!p.XF) return;
	var fmtid = 0;
	try {
		fmtid = p.z || p.XF.numFmtId || 0;
		if (opts.cellNF && p.z == null) p.z = table_fmt[fmtid];
	} catch (e) {
		if (opts.WTF) throw e;
	}
	if (!opts || opts.cellText !== false) try {
		if (p.t === "e") p.w = p.w || BErr[p.v];
		else if (fmtid === 0 || fmtid == "General") if (p.t === "n") if ((p.v | 0) === p.v) p.w = p.v.toString(10);
		else p.w = SSF_general_num(p.v);
		else p.w = SSF_general(p.v);
		else p.w = SSF_format(fmtid, p.v, {
			date1904: !!date1904,
			dateNF: opts && opts.dateNF
		});
	} catch (e) {
		if (opts.WTF) throw e;
	}
	if (opts.cellDates && fmtid && p.t == "n" && fmt_is_date(table_fmt[fmtid] || String(fmtid))) {
		var _d = SSF_parse_date_code(p.v + (date1904 ? 1462 : 0));
		if (_d) {
			p.t = "d";
			p.v = new Date(Date.UTC(_d.y, _d.m - 1, _d.d, _d.H, _d.M, _d.S, _d.u));
		}
	}
}
function make_cell(val, ixfe, t) {
	return {
		v: val,
		ixfe,
		t
	};
}
var XLSBorderStyle = [
	"none",
	"thin",
	"medium",
	"dashed",
	"dotted",
	"thick",
	"double",
	"hair",
	"mediumDashed",
	"dashDot",
	"mediumDashDot",
	"dashDotDot",
	"mediumDashDotDot",
	"slantDashDot"
];
var XLSAlignH = [
	null,
	"left",
	"center",
	"right",
	"fill",
	"justify",
	"centerContinuous",
	"distributed"
];
var XLSAlignV = [
	"top",
	"center",
	"bottom",
	"justify",
	"distributed"
];
function parse_BIFFChart(blob, length) {
	var end = blob.l + length, o = {};
	if (length >= 16) {
		o.x = blob.read_shift(4, "i");
		o.y = blob.read_shift(4, "i");
		o.w = blob.read_shift(4, "i");
		o.h = blob.read_shift(4, "i");
	}
	blob.l = end;
	return o;
}
function parse_BIFFChartSeries(blob, length) {
	var end = blob.l + length, o = {};
	if (length >= 12) {
		o.catType = blob.read_shift(2);
		o.valType = blob.read_shift(2);
		o.cCat = blob.read_shift(2);
		o.cVal = blob.read_shift(2);
		o.bubbleType = blob.read_shift(2);
		o.cBubble = blob.read_shift(2);
	}
	blob.l = end;
	return o;
}
function parse_BIFFSeriesText(blob, length, opts) {
	var end = blob.l + length, o = {};
	if (length >= 2) o.id = blob.read_shift(2);
	try {
		if (blob.l < end) o.text = parse_ShortXLUnicodeString(blob, end - blob.l, opts);
	} catch (e) {
		blob.l = end;
	}
	blob.l = end;
	return o;
}
function parse_BIFFLegend(blob, length) {
	var end = blob.l + length, o = {};
	if (length >= 20) {
		o.x = blob.read_shift(4, "i");
		o.y = blob.read_shift(4, "i");
		o.w = blob.read_shift(4, "i");
		o.h = blob.read_shift(4, "i");
		o.dock = blob.read_shift(1);
		o.spacing = blob.read_shift(1);
		o.flags = blob.read_shift(2);
	}
	blob.l = end;
	return o;
}
function parse_BIFFAxis(blob, length) {
	var end = blob.l + length, o = {};
	if (length >= 2) o.axisType = blob.read_shift(2);
	blob.l = end;
	return o;
}
function parse_BIFFText(blob, length) {
	var end = blob.l + length, o = {};
	if (length >= 32) {
		o.hAlign = blob.read_shift(1);
		o.vAlign = blob.read_shift(1);
		o.bgMode = blob.read_shift(2);
		o.color = blob.read_shift(4);
		o.x = blob.read_shift(4, "i");
		o.y = blob.read_shift(4, "i");
		o.w = blob.read_shift(4, "i");
		o.h = blob.read_shift(4, "i");
	}
	blob.l = end;
	return o;
}
function parse_BIFFBRAI(blob, length) {
	var end = blob.l + length, o = {};
	if (length >= 6) {
		o.id = blob.read_shift(1);
		o.rt = blob.read_shift(1);
		o.flags = blob.read_shift(2);
		var cce = blob.read_shift(2);
		o.cce = cce;
		o.formulaRaw = blob.slice(blob.l, Math.min(end, blob.l + cce));
	}
	blob.l = end;
	return o;
}
function make_BIFFChartType(type) {
	return function parse_BIFFChartType(blob, length) {
		var end = blob.l + length, o = { type };
		if (length >= 2) o.flags = blob.read_shift(2);
		blob.l = end;
		return o;
	};
}
var parse_BIFFBar = make_BIFFChartType("barChart");
var parse_BIFFLine = make_BIFFChartType("lineChart");
var parse_BIFFPie = make_BIFFChartType("pieChart");
var parse_BIFFArea = make_BIFFChartType("areaChart");
var parse_BIFFScatter = make_BIFFChartType("scatterChart");
var parse_BIFFRadar = make_BIFFChartType("radarChart");
var parse_BIFFSurface = make_BIFFChartType("surfaceChart");
function parse_workbook(blob, options) {
	var wb = { opts: {} };
	var Sheets = sheet_map_new();
	if (DENSE != null && options.dense == null) options.dense = DENSE;
	var out = {};
	if (options.dense) out["!data"] = [];
	var Directory = {};
	var range = {};
	var last_formula = null;
	var sst = [];
	var cur_sheet = "";
	var Preamble = {};
	var lastcell, last_cell = "", cc, cmnt, rngC, rngR;
	var sharedf = {};
	var arrayf = [];
	var temp_val;
	var country;
	var XFs = [];
	var Fonts = [];
	var style_cache = {};
	var palette = [];
	var Workbook = {
		Sheets: [],
		WBProps: { date1904: false },
		Views: [{}]
	}, wsprops = {};
	var biff4w = false;
	var get_rgb = function getrgb(icv) {
		if (icv < 8) return XLSIcv[icv];
		if (icv < 64) return palette[icv - 8] || XLSIcv[icv];
		return XLSIcv[icv];
	};
	var xls_color = function xlscolor(icv) {
		if (icv == null) return null;
		var rgb = get_rgb(icv), out = {
			indexed: icv,
			index: icv
		};
		if (rgb) out.rgb = rgb2Hex(rgb);
		return resolve_style_color(out, themes);
	};
	var xls_ext_color = function xlsextcolor(ext) {
		if (!ext) return null;
		var out = {};
		switch (ext.xclrType) {
			case 0:
				out.auto = 1;
				break;
			case 1:
				out = xls_color(ext.xclrValue) || {};
				break;
			case 2:
				out.rgb = rgb2Hex(ext.xclrValue);
				break;
			case 3: out.theme = ext.xclrValue;
		}
		if (ext.nTintShade) out.tint = ext.nTintShade > 0 ? ext.nTintShade / 32767 : ext.nTintShade / 32768;
		return resolve_style_color(out, themes);
	};
	var xls_font_style = function xlsfontstyle(font, xf) {
		if (!font) return null;
		var out = {};
		if (font.name) out.name = font.name;
		if (font.sz) out.sz = font.sz;
		if (font.bold) out.bold = true;
		if (font.italic) out.italic = true;
		if (font.underline) out.underline = font.underline;
		if (font.strike) out.strike = true;
		if (font.outline) out.outline = true;
		if (font.shadow) out.shadow = true;
		if (font.family != null) out.family = font.family;
		if (font.charset != null) out.charset = font.charset;
		if (font.vertAlign == 1) out.vertAlign = "superscript";
		else if (font.vertAlign == 2) out.vertAlign = "subscript";
		if (xf && xf.fontScheme != null) out.scheme = xf.fontScheme == 1 ? "major" : xf.fontScheme == 2 ? "minor" : "none";
		out.color = xls_ext_color(xf && xf.xfextFont) || xls_color(font.icv);
		if (out.color && out.color.auto) delete out.color;
		return out;
	};
	var xls_fill_style = function xlsfillstyle(xfd) {
		if (!xfd) return null;
		var out = { patternType: xfd.patternType || "none" };
		var fg = xls_ext_color(xfd.xfextFore) || xls_color(xfd.icvFore);
		var bg = xls_ext_color(xfd.xfextBack) || xls_color(xfd.icvBack);
		if (fg) out.fgColor = fg;
		if (bg) out.bgColor = bg;
		if (xfd.gradientFill) out.gradientFill = xfd.gradientFill;
		return out;
	};
	var xls_border_part = function xlsborderpart(style, icv, ext) {
		if (!style) return null;
		var out = { style: XLSBorderStyle[style] || "thin" };
		var color = xls_ext_color(ext) || xls_color(icv);
		if (color) out.color = color;
		return out;
	};
	var xls_border_style = function xlsborderstyle(xfd) {
		if (!xfd) return null;
		var out = {};
		var b;
		if (b = xls_border_part(xfd.dgLeft, xfd.icvLeft, xfd.xfextLeft)) out.left = b;
		if (b = xls_border_part(xfd.dgRight, xfd.icvRight, xfd.xfextRight)) out.right = b;
		if (b = xls_border_part(xfd.dgTop, xfd.icvTop, xfd.xfextTop)) out.top = b;
		if (b = xls_border_part(xfd.dgBottom, xfd.icvBottom, xfd.xfextBottom)) out.bottom = b;
		if (b = xls_border_part(xfd.dgDiag, xfd.icvDiag, xfd.xfextDiag)) out.diagonal = b;
		if (xfd.grbitDiag & 1) out.diagonalUp = true;
		if (xfd.grbitDiag & 2) out.diagonalDown = true;
		return keys(out).length ? out : null;
	};
	var xls_alignment_style = function xlsalignmentstyle(xfd) {
		if (!xfd) return null;
		var out = {};
		if (XLSAlignH[xfd.alc]) out.horizontal = XLSAlignH[xfd.alc];
		if (XLSAlignV[xfd.alcV] && xfd.alcV != 2) out.vertical = XLSAlignV[xfd.alcV];
		if (xfd.fWrap) out.wrapText = true;
		if (xfd.fShrinkToFit) out.shrinkToFit = true;
		if (xfd.trot) out.textRotation = xfd.trot;
		if (xfd.cIndent) out.indent = xfd.cIndent;
		if (xfd.iReadOrder) out.readingOrder = xfd.iReadOrder;
		return keys(out).length ? out : null;
	};
	var apply_xls_style = function applyxlsstyle(out, xf) {
		if (!xf) return out;
		var xfd = xf.data || {};
		if (xf.numFmtId != null) {
			out.numFmtId = xf.numFmtId;
			if (table_fmt[xf.numFmtId] != null) out.numFmt = table_fmt[xf.numFmtId];
		}
		var font = xls_font_style(Fonts[xf.ifnt], xf);
		if (font) out.font = font;
		var fill = xls_fill_style(xfd);
		if (fill) {
			out.fill = fill;
			fill_style_aliases(out, fill);
		}
		var border = xls_border_style(xfd);
		if (border) out.border = border;
		var alignment = xls_alignment_style(xfd);
		if (alignment) out.alignment = alignment;
		if (xf.locked || xf.hidden) out.protection = {
			locked: xf.locked,
			hidden: xf.hidden
		};
		return out;
	};
	var resolve_xls_style = function resolvexlsstyle(xf, styleid) {
		if (!xf) return null;
		if (styleid == null) styleid = XFs.indexOf(xf);
		if (style_cache[styleid]) return style_cache[styleid];
		var out = {
			id: styleid,
			xf: dup(xf)
		};
		if (!xf.fStyle && xf.xfId != null && xf.xfId !== styleid && XFs[xf.xfId]) extend_style_obj(out, resolve_xls_style(XFs[xf.xfId], xf.xfId));
		out.id = styleid;
		out.xf = dup(xf);
		apply_xls_style(out, xf);
		return style_cache[styleid] = out;
	};
	var process_cell_style = function pcs(line, options) {
		if (!line.XF || !options || !options.cellStyles) return;
		var resolved = resolve_xls_style(line.XF, line.ixfe);
		if (resolved) line.s = resolved;
	};
	var addcell = function addcell(cell, line, options) {
		if (!biff4w && file_depth > 1) return;
		if (options.sheetRows && cell.r >= options.sheetRows) return;
		if (options.cellStyles && line.XF && line.XF.data) process_cell_style(line, options);
		delete line.ixfe;
		delete line.XF;
		lastcell = cell;
		last_cell = encode_cell(cell);
		if (!range || !range.s || !range.e) range = {
			s: {
				r: 0,
				c: 0
			},
			e: {
				r: 0,
				c: 0
			}
		};
		if (cell.r < range.s.r) range.s.r = cell.r;
		if (cell.c < range.s.c) range.s.c = cell.c;
		if (cell.r + 1 > range.e.r) range.e.r = cell.r + 1;
		if (cell.c + 1 > range.e.c) range.e.c = cell.c + 1;
		if (options.cellFormula && line.f) for (var afi = 0; afi < arrayf.length; ++afi) {
			if (arrayf[afi][0].s.c > cell.c || arrayf[afi][0].s.r > cell.r) continue;
			if (arrayf[afi][0].e.c < cell.c || arrayf[afi][0].e.r < cell.r) continue;
			line.F = encode_range(arrayf[afi][0]);
			if (arrayf[afi][0].s.c != cell.c || arrayf[afi][0].s.r != cell.r) delete line.f;
			if (line.f) line.f = "" + stringify_formula(arrayf[afi][1], range, cell, supbooks, opts);
			break;
		}
		if (options.dense) {
			if (!out["!data"][cell.r]) out["!data"][cell.r] = [];
			out["!data"][cell.r][cell.c] = line;
		} else out[last_cell] = line;
	};
	var opts = {
		enc: false,
		sbcch: 0,
		snames: [],
		sharedf,
		arrayf,
		rrtabid: [],
		lastuser: "",
		biff: 8,
		codepage: 0,
		winlocked: 0,
		cellStyles: !!options && !!options.cellStyles,
		drawings: !!options && !!options.drawings,
		charts: !!options && !!options.charts,
		WTF: !!options && !!options.WTF
	};
	if (options.password) opts.password = options.password;
	var themes;
	var merges = [];
	var objects = [];
	var colinfo = [], rowinfo = [];
	var seencol = false;
	var officeart = { blips: [] };
	var drawings = null, pending_shapes = [];
	var chart_state = null;
	var supbooks = [];
	supbooks.SheetNames = opts.snames;
	supbooks.sharedf = opts.sharedf;
	supbooks.arrayf = opts.arrayf;
	supbooks.names = [];
	supbooks.XTI = [];
	var last_RT = 0;
	var file_depth = 0;
	var BIFF2Fmt = 0, BIFF2FmtTable = [];
	var FilterDatabases = [];
	var last_lbl;
	var ensure_drawings = function ensuredrawings() {
		if (!drawings) drawings = {
			raw: [],
			images: [],
			shapes: [],
			charts: []
		};
		return drawings;
	};
	var add_officeart = function addofficeart(val) {
		if (!val) return;
		if (!options.drawings && !options.charts) return;
		if (val.groups && val.blips) officeart.blips = officeart.blips.concat(val.blips);
		else {
			var draw = ensure_drawings();
			if (val.raw) draw.raw.push(val.raw);
			if (val.blips && val.blips.length) officeart.blips = officeart.blips.concat(val.blips);
			(val.shapes || []).forEach(function(shape) {
				pending_shapes.push(shape);
				var blip = shape.blipId != null ? officeart.blips[shape.blipId - 1] : null;
				if (blip && blip.dataURI) draw.images.push({
					id: "xls-image-" + (draw.images.length + 1),
					objectId: shape.spid,
					biffType: "msoDrawing",
					anchor: shape.anchor,
					dataURI: blip.dataURI,
					contentType: blip.contentType,
					raw: shape.raw
				});
				else draw.shapes.push({
					id: "xls-shape-" + (draw.shapes.length + 1),
					objectId: shape.spid,
					biffType: "msoDrawing",
					anchor: shape.anchor,
					props: shape.props,
					raw: shape.raw
				});
			});
		}
	};
	var add_imdata = function addimdata(obj) {
		if (!obj || !obj.ImData || !obj.ImData.data) return;
		if (!options.drawings && !options.charts) return;
		var draw = ensure_drawings(), data = obj.ImData.data, magic = xls_find_image_magic(data, 0, data.length);
		var shape = obj._shape || {};
		var img = {
			id: "xls-imdata-" + (draw.images.length + 1),
			objectId: obj.cmo && obj.cmo[0],
			biffType: "imData",
			anchor: shape.anchor,
			raw: obj.ImData
		};
		if (magic[1]) {
			img.contentType = magic[1];
			img.dataURI = "data:" + magic[1] + ";base64," + Base64_encode_arr(data.slice(magic[0]));
			draw.images.push(img);
		} else draw.shapes.push({
			id: "xls-imdata-" + (draw.shapes.length + 1),
			objectId: img.objectId,
			biffType: "imData",
			anchor: shape.anchor,
			raw: obj.ImData
		});
	};
	var reset_chart_state = function resetchartstate() {
		chart_state = {
			type: null,
			title: "",
			series: [],
			seriesText: [],
			raw: [],
			current: null
		};
	};
	var push_chart_record = function pushchartrecord(rt, val) {
		if (!chart_state) reset_chart_state();
		chart_state.raw.push({
			rt,
			v: val
		});
		switch (rt) {
			case 4099:
				chart_state.current = {
					raw: val,
					name: "",
					data: []
				};
				chart_state.series.push(chart_state.current);
				break;
			case 4109:
				if (val && val.text) if (chart_state.current && !chart_state.current.name) chart_state.current.name = val.text;
				else if (!chart_state.title) chart_state.title = val.text;
				else chart_state.seriesText.push(val.text);
				break;
			case 4119:
			case 4120:
			case 4121:
			case 4122:
			case 4123:
			case 4158:
			case 4159:
				if (val && val.type) chart_state.type = val.type;
				break;
			case 4177: if (chart_state.current) {
				if (!chart_state.current.brai) chart_state.current.brai = [];
				chart_state.current.brai.push(val);
			}
		}
	};
	var build_xls_chart_model = function buildxlschartmodel(ws) {
		if (!chart_state || !chart_state.raw.length) return null;
		var model = {
			type: chart_state.type || "barChart",
			title: chart_state.title,
			series: [],
			raw: chart_state.raw
		};
		if (ws && ws["!ref"]) {
			var rr = safe_decode_range(ws["!ref"]), dense = ws["!data"] != null, C, R, cell, firstNumeric = false;
			for (R = rr.s.r; R <= rr.e.r; ++R) {
				cell = dense ? (ws["!data"][R] || [])[rr.s.c] : ws[encode_cell({
					r: R,
					c: rr.s.c
				})];
				if (cell && cell.t == "n") firstNumeric = true;
			}
			var labels = [];
			if (!firstNumeric && rr.e.c > rr.s.c) for (R = rr.s.r; R <= rr.e.r; ++R) {
				cell = dense ? (ws["!data"][R] || [])[rr.s.c] : ws[encode_cell({
					r: R,
					c: rr.s.c
				})];
				labels.push(cell ? cell.w || cell.v : "");
			}
			for (C = rr.s.c + (labels.length ? 1 : 0); C <= rr.e.c; ++C) {
				var vals = [], name = (chart_state.series[C - rr.s.c] || chart_state.series[C - rr.s.c - 1] || {}).name || "";
				for (R = rr.s.r; R <= rr.e.r; ++R) {
					cell = dense ? (ws["!data"][R] || [])[C] : ws[encode_cell({
						r: R,
						c: C
					})];
					if (cell && cell.t == "n") vals.push(cell.v);
					else if (cell && cell.v != null && !isNaN(+cell.v)) vals.push(+cell.v);
				}
				if (vals.length) model.series.push({
					name,
					data: vals,
					val: { values: vals },
					cat: { values: labels }
				});
			}
		}
		if (!model.series.length) chart_state.series.forEach(function(ser) {
			model.series.push({
				name: ser.name || "",
				data: [],
				raw: ser
			});
		});
		return model;
	};
	var finalize_sheet_visuals = function finalizesheetvisuals(ws) {
		if (ws["!merges"] && ws["!merges"].length) {
			var mergeErrors = validate_merges(ws, { WTF: !!(options && options.validateMerges) });
			if (mergeErrors.length) ws["!mergeErrors"] = mergeErrors;
		}
		if (drawings && (drawings.images.length || drawings.shapes.length || drawings.charts.length || drawings.raw.length)) ws["!drawings"] = drawings;
		var model = options.charts ? build_xls_chart_model(ws) : null;
		if (model) {
			ws["!chart"] = model;
			if (!ws["!charts"]) ws["!charts"] = [];
			if (drawings && drawings.charts.length) drawings.charts.forEach(function(ch) {
				if (!ch.model) ch.model = model;
				ws["!charts"].push(ch);
			});
			else ws["!charts"].push({
				id: "xls-chart-" + ws["!charts"].length,
				title: model.title,
				model,
				raw: model.raw,
				anchor: {
					type: "absoluteAnchor",
					pos: {
						x: 0,
						y: 0
					},
					ext: {
						cx: 4572e3,
						cy: 2743200
					}
				}
			});
		}
	};
	opts.codepage = 1200;
	set_cp(1200);
	var seen_codepage = false;
	while (blob.l < blob.length - 1) {
		var s = blob.l;
		var RecordType = blob.read_shift(2);
		if (RecordType === 0 && last_RT === 10) break;
		var length = blob.l === blob.length ? 0 : blob.read_shift(2);
		var R = XLSRecordEnum[RecordType];
		if (file_depth == 0 && [
			9,
			521,
			1033,
			2057
		].indexOf(RecordType) == -1) break;
		if (R && R.f) {
			if (options.bookSheets) {
				if (last_RT === 133 && RecordType !== 133) break;
			}
			last_RT = RecordType;
			if (R.r === 2 || R.r == 12) {
				var rt = blob.read_shift(2);
				length -= 2;
				if (!opts.enc && rt !== RecordType && ((rt & 255) << 8 | rt >> 8) !== RecordType) throw new Error("rt mismatch: " + rt + "!=" + RecordType);
				if (R.r == 12) {
					blob.l += 10;
					length -= 10;
				}
			}
			var val = {};
			if (RecordType === 10) val = R.f(blob, length, opts);
			else val = slurp(RecordType, R, blob, length, opts);
			if (file_depth == 0 && [
				9,
				521,
				1033,
				2057
			].indexOf(last_RT) === -1) continue;
			switch (RecordType) {
				case 34:
					wb.opts.Date1904 = Workbook.WBProps.date1904 = val;
					break;
				case 134:
					wb.opts.WriteProtect = true;
					break;
				case 47:
					if (!opts.enc) blob.l = 0;
					opts.enc = val;
					if (!options.password) throw new Error("File is password-protected");
					if (val.valid == null) throw new Error("Encryption scheme unsupported");
					if (!val.valid) throw new Error("Password is incorrect");
					break;
				case 92:
					opts.lastuser = val;
					break;
				case 66:
					var cpval = Number(val);
					switch (cpval) {
						case 21010:
							cpval = 1200;
							break;
						case 32768:
							cpval = 1e4;
							break;
						case 32769: cpval = 1252;
					}
					set_cp(opts.codepage = cpval);
					seen_codepage = true;
					break;
				case 317:
					opts.rrtabid = val;
					break;
				case 25:
					opts.winlocked = val;
					break;
				case 439:
					wb.opts["RefreshAll"] = val;
					break;
				case 12:
					wb.opts["CalcCount"] = val;
					break;
				case 16:
					wb.opts["CalcDelta"] = val;
					break;
				case 17:
					wb.opts["CalcIter"] = val;
					break;
				case 13:
					wb.opts["CalcMode"] = val;
					break;
				case 14:
					wb.opts["CalcPrecision"] = val;
					break;
				case 95:
					wb.opts["CalcSaveRecalc"] = val;
					break;
				case 15:
					opts.CalcRefMode = val;
					break;
				case 2211:
					wb.opts.FullCalc = val;
					break;
				case 129:
					if (val.fDialog) out["!type"] = "dialog";
					if (!val.fBelow) (out["!outline"] || (out["!outline"] = {})).above = true;
					if (!val.fRight) (out["!outline"] || (out["!outline"] = {})).left = true;
					break;
				case 67:
				case 579:
				case 1091:
				case 224:
					XFs.push(val);
					break;
				case 49:
					Fonts.push(val);
					if (opts.biff >= 5 && Fonts.length == 4) Fonts.push(null);
					break;
				case 430:
					supbooks.push([val]);
					supbooks[supbooks.length - 1].XTI = [];
					break;
				case 35:
				case 547:
					supbooks[supbooks.length - 1].push(val);
					break;
				case 24:
				case 536:
					last_lbl = {
						Name: val.Name,
						Ref: stringify_formula(val.rgce, range, null, supbooks, opts)
					};
					if (val.itab > 0) last_lbl.Sheet = val.itab - 1;
					supbooks.names.push(last_lbl);
					if (!supbooks[0]) {
						supbooks[0] = [];
						supbooks[0].XTI = [];
					}
					supbooks[supbooks.length - 1].push(val);
					if (val.Name == "_xlnm._FilterDatabase" && val.itab > 0) {
						if (val.rgce && val.rgce[0] && val.rgce[0][0] && val.rgce[0][0][0] == "PtgArea3d") FilterDatabases[val.itab - 1] = { ref: encode_range(val.rgce[0][0][1][2]) };
					}
					break;
				case 22:
					opts.ExternCount = val;
					break;
				case 23:
					if (supbooks.length == 0) {
						supbooks[0] = [];
						supbooks[0].XTI = [];
					}
					supbooks[supbooks.length - 1].XTI = supbooks[supbooks.length - 1].XTI.concat(val);
					supbooks.XTI = supbooks.XTI.concat(val);
					break;
				case 2196:
					if (opts.biff < 8) break;
					if (last_lbl != null) last_lbl.Comment = val[1];
					break;
				case 18:
					out["!protect"] = val;
					break;
				case 19:
					if (val !== 0 && opts.WTF) console.error("Password verifier: " + val);
					break;
				case 133:
					Directory[opts.biff == 4 ? opts.snames.length : val.pos] = val;
					opts.snames.push(val.name);
					break;
				case 10:
					if (--file_depth ? !biff4w : biff4w) break;
					if (range.e) {
						if (range.e.r > 0 && range.e.c > 0) {
							range.e.r--;
							range.e.c--;
							out["!ref"] = encode_range(range);
							if (options.sheetRows && options.sheetRows <= range.e.r) {
								var tmpri = range.e.r;
								range.e.r = options.sheetRows - 1;
								out["!fullref"] = out["!ref"];
								out["!ref"] = encode_range(range);
								range.e.r = tmpri;
							}
							range.e.r++;
							range.e.c++;
						}
						if (merges.length > 0) out["!merges"] = merges;
						if (objects.length > 0) out["!objects"] = objects;
						if (colinfo.length > 0) out["!cols"] = colinfo;
						if (rowinfo.length > 0) out["!rows"] = rowinfo;
						finalize_sheet_visuals(out);
						Workbook.Sheets.push(wsprops);
					}
					if (cur_sheet === "") Preamble = out;
					else sheet_map_set(Sheets, cur_sheet, out);
					out = {};
					if (options.dense) out["!data"] = [];
					break;
				case 9:
				case 521:
				case 1033:
				case 2057:
					if (opts.biff === 8) opts.biff = {
						9: 2,
						521: 3,
						1033: 4
					}[RecordType] || {
						512: 2,
						768: 3,
						1024: 4,
						1280: 5,
						1536: 8,
						2: 2,
						7: 2
					}[val.BIFFVer] || 8;
					opts.biffguess = val.BIFFVer == 0;
					if (val.BIFFVer == 0 && val.dt == 4096) {
						opts.biff = 5;
						seen_codepage = true;
						set_cp(opts.codepage = 28591);
					}
					if (opts.biff == 4 && val.dt & 256) biff4w = true;
					if (opts.biff == 8 && val.BIFFVer == 0 && val.dt == 16) opts.biff = 2;
					if (file_depth++ && !biff4w) break;
					out = {};
					if (options.dense) out["!data"] = [];
					if (opts.biff < 8 && !seen_codepage) {
						seen_codepage = true;
						set_cp(opts.codepage = options.codepage || 1252);
					}
					if (opts.biff == 4 && biff4w) cur_sheet = (Directory[opts.snames.indexOf(cur_sheet) + 1] || { name: "" }).name;
					else if (opts.biff < 5 || val.BIFFVer == 0 && val.dt == 4096) {
						if (cur_sheet === "") cur_sheet = "Sheet1";
						range = {
							s: {
								r: 0,
								c: 0
							},
							e: {
								r: 0,
								c: 0
							}
						};
						var fakebs8 = {
							pos: blob.l - length,
							name: cur_sheet
						};
						Directory[fakebs8.pos] = fakebs8;
						opts.snames.push(cur_sheet);
					} else cur_sheet = (Directory[s] || { name: "" }).name;
					if (val.dt == 32) out["!type"] = "chart";
					if (val.dt == 64) out["!type"] = "macro";
					merges = [];
					objects = [];
					drawings = null;
					pending_shapes = [];
					reset_chart_state();
					opts.arrayf = arrayf = [];
					colinfo = [];
					rowinfo = [];
					seencol = false;
					wsprops = {
						Hidden: (Directory[s] || { hs: 0 }).hs,
						name: cur_sheet
					};
					break;
				case 515:
				case 3:
				case 2:
					if (out["!type"] == "chart") {
						if (options.dense ? (out["!data"][val.r] || [])[val.c] : out[encode_col(val.c) + encode_row(val.r)]) ++val.c;
					}
					temp_val = {
						ixfe: val.ixfe,
						XF: XFs[val.ixfe] || {},
						v: val.val,
						t: "n"
					};
					if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
					safe_format_xf(temp_val, options, wb.opts.Date1904);
					addcell({
						c: val.c,
						r: val.r
					}, temp_val, options);
					break;
				case 5:
				case 517:
					temp_val = {
						ixfe: val.ixfe,
						XF: XFs[val.ixfe],
						v: val.val,
						t: val.t
					};
					if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
					safe_format_xf(temp_val, options, wb.opts.Date1904);
					addcell({
						c: val.c,
						r: val.r
					}, temp_val, options);
					break;
				case 638:
					temp_val = {
						ixfe: val.ixfe,
						XF: XFs[val.ixfe],
						v: val.rknum,
						t: "n"
					};
					if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
					safe_format_xf(temp_val, options, wb.opts.Date1904);
					addcell({
						c: val.c,
						r: val.r
					}, temp_val, options);
					break;
				case 189:
					for (var j = val.c; j <= val.C; ++j) {
						var ixfe = val.rkrec[j - val.c][0];
						temp_val = {
							ixfe,
							XF: XFs[ixfe],
							v: val.rkrec[j - val.c][1],
							t: "n"
						};
						if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
						safe_format_xf(temp_val, options, wb.opts.Date1904);
						addcell({
							c: j,
							r: val.r
						}, temp_val, options);
					}
					break;
				case 6:
				case 518:
				case 1030:
					if (val.val == "String") {
						last_formula = val;
						break;
					}
					temp_val = make_cell(val.val, val.cell.ixfe, val.tt);
					temp_val.XF = XFs[temp_val.ixfe];
					if (options.cellFormula) {
						var _f = val.formula;
						if (_f && _f[0] && _f[0][0] && _f[0][0][0] == "PtgExp") {
							var _fr = _f[0][0][1][0], _fc = _f[0][0][1][1];
							var _fe = encode_cell({
								r: _fr,
								c: _fc
							});
							if (sharedf[_fe]) temp_val.f = "" + stringify_formula(val.formula, range, val.cell, supbooks, opts);
							else temp_val.F = ((options.dense ? (out["!data"][_fr] || [])[_fc] : out[_fe]) || {}).F;
						} else temp_val.f = "" + stringify_formula(val.formula, range, val.cell, supbooks, opts);
					}
					if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
					safe_format_xf(temp_val, options, wb.opts.Date1904);
					addcell(val.cell, temp_val, options);
					last_formula = val;
					break;
				case 7:
				case 519:
					if (last_formula) {
						last_formula.val = val;
						temp_val = make_cell(val, last_formula.cell.ixfe, "s");
						temp_val.XF = XFs[temp_val.ixfe];
						if (options.cellFormula) temp_val.f = "" + stringify_formula(last_formula.formula, range, last_formula.cell, supbooks, opts);
						if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
						safe_format_xf(temp_val, options, wb.opts.Date1904);
						addcell(last_formula.cell, temp_val, options);
						last_formula = null;
					} else throw new Error("String record expects Formula");
					break;
				case 33:
				case 545:
					arrayf.push(val);
					var _arraystart = encode_cell(val[0].s);
					cc = options.dense ? (out["!data"][val[0].s.r] || [])[val[0].s.c] : out[_arraystart];
					if (options.cellFormula && cc) {
						if (!last_formula) break;
						if (!_arraystart || !cc) break;
						cc.f = "" + stringify_formula(val[1], range, val[0], supbooks, opts);
						cc.F = encode_range(val[0]);
					}
					break;
				case 1212:
					if (!options.cellFormula) break;
					if (last_cell) {
						if (!last_formula) break;
						sharedf[encode_cell(last_formula.cell)] = val[0];
						cc = options.dense ? (out["!data"][last_formula.cell.r] || [])[last_formula.cell.c] : out[encode_cell(last_formula.cell)];
						(cc || {}).f = "" + stringify_formula(val[0], range, lastcell, supbooks, opts);
					}
					break;
				case 253:
					temp_val = make_cell(sst[val.isst].t, val.ixfe, "s");
					if (sst[val.isst].h) temp_val.h = sst[val.isst].h;
					temp_val.XF = XFs[temp_val.ixfe];
					if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
					safe_format_xf(temp_val, options, wb.opts.Date1904);
					addcell({
						c: val.c,
						r: val.r
					}, temp_val, options);
					break;
				case 513:
					if (options.sheetStubs) {
						temp_val = {
							ixfe: val.ixfe,
							XF: XFs[val.ixfe],
							t: "z"
						};
						if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
						safe_format_xf(temp_val, options, wb.opts.Date1904);
						addcell({
							c: val.c,
							r: val.r
						}, temp_val, options);
					}
					break;
				case 190:
					if (options.sheetStubs) for (var _j = val.c; _j <= val.C; ++_j) {
						var _ixfe = val.ixfe[_j - val.c];
						temp_val = {
							ixfe: _ixfe,
							XF: XFs[_ixfe],
							t: "z"
						};
						if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
						safe_format_xf(temp_val, options, wb.opts.Date1904);
						addcell({
							c: _j,
							r: val.r
						}, temp_val, options);
					}
					break;
				case 214:
				case 516:
				case 4:
					temp_val = make_cell(val.val, val.ixfe, "s");
					temp_val.XF = XFs[temp_val.ixfe];
					if (BIFF2Fmt > 0) temp_val.z = temp_val.XF && temp_val.XF.numFmtId && BIFF2FmtTable[temp_val.XF.numFmtId] || BIFF2FmtTable[temp_val.ixfe >> 8 & 63];
					safe_format_xf(temp_val, options, wb.opts.Date1904);
					addcell({
						c: val.c,
						r: val.r
					}, temp_val, options);
					break;
				case 0:
				case 512:
					if (file_depth === 1) range = val;
					break;
				case 252:
					sst = val;
					break;
				case 1054:
					if (opts.biff >= 3 && opts.biff <= 4) {
						BIFF2FmtTable[BIFF2Fmt++] = val[1];
						for (var b4idx = 0; b4idx < BIFF2Fmt + 163; ++b4idx) if (table_fmt[b4idx] == val[1]) break;
						if (b4idx >= 163) SSF__load(val[1], BIFF2Fmt + 163);
					} else SSF__load(val[1], val[0]);
					break;
				case 30:
					BIFF2FmtTable[BIFF2Fmt++] = val;
					for (var b2idx = 0; b2idx < BIFF2Fmt + 163; ++b2idx) if (table_fmt[b2idx] == val) break;
					if (b2idx >= 163) SSF__load(val, BIFF2Fmt + 163);
					break;
				case 229:
					merges = merges.concat(val);
					break;
				case 235:
					add_officeart(val);
					break;
				case 236:
					add_officeart(val);
					break;
				case 93:
					objects[val.cmo[0]] = opts.lastobj = val;
					if (pending_shapes.length) {
						val._shape = pending_shapes.shift();
						val._shape.object = val;
						if (val.cmo[1] == 5) ensure_drawings().charts.push({
							id: "xls-chart-object-" + val.cmo[0],
							objectId: val.cmo[0],
							biffType: "obj",
							anchor: val._shape.anchor,
							raw: val._shape.raw
						});
					}
					break;
				case 438:
					opts.lastobj.TxO = val;
					break;
				case 127:
					opts.lastobj.ImData = val;
					add_imdata(opts.lastobj);
					break;
				case 440:
					for (rngR = val[0].s.r; rngR <= val[0].e.r; ++rngR) for (rngC = val[0].s.c; rngC <= val[0].e.c; ++rngC) {
						cc = options.dense ? (out["!data"][rngR] || [])[rngC] : out[encode_cell({
							c: rngC,
							r: rngR
						})];
						if (cc) cc.l = val[1];
					}
					break;
				case 2048:
					for (rngR = val[0].s.r; rngR <= val[0].e.r; ++rngR) for (rngC = val[0].s.c; rngC <= val[0].e.c; ++rngC) {
						cc = options.dense ? (out["!data"][rngR] || [])[rngC] : out[encode_cell({
							c: rngC,
							r: rngR
						})];
						if (cc && cc.l) cc.l.Tooltip = val[1];
					}
					break;
				case 28:
					cc = options.dense ? (out["!data"][val[0].r] || [])[val[0].c] : out[encode_cell(val[0])];
					if (!cc) {
						if (options.dense) {
							if (!out["!data"][val[0].r]) out["!data"][val[0].r] = [];
							cc = out["!data"][val[0].r][val[0].c] = { t: "z" };
						} else cc = out[encode_cell(val[0])] = { t: "z" };
						range.e.r = Math.max(range.e.r, val[0].r);
						range.s.r = Math.min(range.s.r, val[0].r);
						range.e.c = Math.max(range.e.c, val[0].c);
						range.s.c = Math.min(range.s.c, val[0].c);
					}
					if (!cc.c) cc.c = [];
					if (opts.biff <= 5 && opts.biff >= 2) cmnt = {
						a: "SheetJ5",
						t: val[1]
					};
					else {
						var noteobj = objects[val[2]];
						cmnt = {
							a: val[1],
							t: noteobj.TxO.t
						};
						if (val[3] != null && !(val[3] & 2)) cc.c.hidden = true;
					}
					cc.c.push(cmnt);
					break;
				case 2173:
					update_xfext(XFs[val.ixfe], val.ext);
					style_cache = {};
					break;
				case 125:
					if (!opts.cellStyles) break;
					while (val.e >= val.s) {
						colinfo[val.e--] = {
							width: val.w / 256,
							level: val.level || 0,
							hidden: !!(val.flags & 1)
						};
						if (val.ixfe != null && XFs[val.ixfe]) colinfo[val.e + 1].s = resolve_xls_style(XFs[val.ixfe], val.ixfe);
						if (!seencol) {
							seencol = true;
							MDW = DEF_MDW;
						}
						process_col(colinfo[val.e + 1]);
					}
					break;
				case 520:
					var rowobj = {};
					if (val.level != null) {
						rowinfo[val.r] = rowobj;
						rowobj.level = val.level;
					}
					if (val.hidden) {
						rowinfo[val.r] = rowobj;
						rowobj.hidden = true;
					}
					if (opts.cellStyles && val.ixfe != null && val.ixfe != 4095 && XFs[val.ixfe]) {
						rowinfo[val.r] = rowobj;
						rowobj.s = resolve_xls_style(XFs[val.ixfe], val.ixfe);
					}
					if (val.hpt) {
						rowinfo[val.r] = rowobj;
						rowobj.hpt = val.hpt;
						rowobj.hpx = pt2px(val.hpt);
					}
					break;
				case 38:
				case 39:
				case 40:
				case 41:
					if (!out["!margins"]) default_margins(out["!margins"] = {});
					out["!margins"][{
						38: "left",
						39: "right",
						40: "top",
						41: "bottom"
					}[RecordType]] = val;
					break;
				case 161:
					if (!out["!margins"]) default_margins(out["!margins"] = {});
					out["!margins"].header = val.header;
					out["!margins"].footer = val.footer;
					break;
				case 574:
					if (val.RTL) Workbook.Views[0].RTL = true;
					break;
				case 146:
					palette = val;
					style_cache = {};
					break;
				case 2198:
					themes = val;
					style_cache = {};
					break;
				case 140:
					country = val;
					break;
				case 4098:
				case 4099:
				case 4109:
				case 4116:
				case 4117:
				case 4119:
				case 4120:
				case 4121:
				case 4122:
				case 4123:
				case 4125:
				case 4127:
				case 4128:
				case 4133:
				case 4149:
				case 4154:
				case 4158:
				case 4159:
				case 4161:
				case 4165:
				case 4177:
					push_chart_record(RecordType, val);
					break;
				case 442: if (!cur_sheet) Workbook.WBProps.CodeName = val || "ThisWorkbook";
				else wsprops.CodeName = val || wsprops.name;
			}
		} else {
			if (!R) console.error("Missing Info for XLS Record 0x" + RecordType.toString(16));
			blob.l += length;
		}
	}
	wb.SheetNames = keys(Directory).sort(function(a, b) {
		return Number(a) - Number(b);
	}).map(function(x) {
		return Directory[x].name;
	});
	if (!options.bookSheets) wb.Sheets = Sheets;
	if (!wb.SheetNames.length && Preamble["!ref"]) {
		wb.SheetNames.push("Sheet1");
		if (wb.Sheets) sheet_map_set(wb.Sheets, "Sheet1", Preamble);
	} else wb.Preamble = Preamble;
	if (wb.Sheets) FilterDatabases.forEach(function(r, i) {
		var ws = sheet_map_get(wb.Sheets, wb.SheetNames[i]);
		if (ws) ws["!autofilter"] = r;
	});
	wb.Strings = sst;
	wb.SSF = dup(table_fmt);
	if (opts.enc) wb.Encryption = opts.enc;
	if (themes) wb.Themes = themes;
	wb.Metadata = {};
	if (country !== void 0) wb.Metadata.Country = country;
	if (supbooks.names.length > 0) Workbook.Names = supbooks.names;
	wb.Workbook = Workbook;
	return wb;
}
var PSCLSID = {
	SI: "e0859ff2f94f6810ab9108002b27b3d9",
	DSI: "02d5cdd59c2e1b10939708002b2cf9ae",
	UDI: "05d5cdd59c2e1b10939708002b2cf9ae"
};
function parse_xls_props(cfb, props, o) {
	var DSI = CFB.find(cfb, "/!DocumentSummaryInformation");
	if (DSI && DSI.size > 0) try {
		var DocSummary = parse_PropertySetStream(DSI, DocSummaryPIDDSI, PSCLSID.DSI);
		for (var d in DocSummary) props[d] = DocSummary[d];
	} catch (e) {
		if (o.WTF) console.error(e && e.message || e);
	}
	var SI = CFB.find(cfb, "/!SummaryInformation");
	if (SI && SI.size > 0) try {
		var Summary = parse_PropertySetStream(SI, SummaryPIDSI, PSCLSID.SI);
		for (var s in Summary) if (props[s] == null) props[s] = Summary[s];
	} catch (e) {
		if (o.WTF) console.error(e && e.message || e);
	}
	if (props.HeadingPairs && props.TitlesOfParts) {
		load_props_pairs(props.HeadingPairs, props.TitlesOfParts, props, o);
		delete props.HeadingPairs;
		delete props.TitlesOfParts;
	}
}
function parse_xlscfb(cfb, options) {
	if (!options) options = {};
	fix_read_opts(options);
	reset_cp();
	if (options.codepage) set_ansi(options.codepage);
	var CompObj, WB;
	if (cfb.FullPaths) {
		if (CFB.find(cfb, "/encryption")) throw new Error("File is password-protected");
		CompObj = CFB.find(cfb, "!CompObj");
		WB = CFB.find(cfb, "/Workbook") || CFB.find(cfb, "/Book");
	} else {
		switch (options.type) {
			case "base64":
				cfb = s2a(Base64_decode(cfb));
				break;
			case "binary":
				cfb = s2a(cfb);
				break;
			case "buffer": break;
			case "array": if (!Array.isArray(cfb)) cfb = Array.prototype.slice.call(cfb);
		}
		prep_blob(cfb, 0);
		WB = { content: cfb };
	}
	var WorkbookP;
	var _data;
	if (CompObj) parse_compobj(CompObj);
	if (options.bookProps && !options.bookSheets) WorkbookP = {};
	else {
		var T = has_buf ? "buffer" : "array";
		if (WB && WB.content) WorkbookP = parse_workbook(WB.content, options);
		else if ((_data = CFB.find(cfb, "PerfectOffice_MAIN")) && _data.content) WorkbookP = WK_.to_workbook(_data.content, (options.type = T, options));
		else if ((_data = CFB.find(cfb, "NativeContent_MAIN")) && _data.content) WorkbookP = WK_.to_workbook(_data.content, (options.type = T, options));
		else if ((_data = CFB.find(cfb, "MN0")) && _data.content) throw new Error("Unsupported Works 4 for Mac file");
		else throw new Error("Cannot find Workbook stream");
		if (options.bookVBA && cfb.FullPaths && CFB.find(cfb, "/_VBA_PROJECT_CUR/VBA/dir")) WorkbookP.vbaraw = make_vba_xls(cfb);
	}
	var props = {};
	if (cfb.FullPaths) parse_xls_props(cfb, props, options);
	WorkbookP.Props = WorkbookP.Custprops = props;
	if (options.bookFiles) WorkbookP.cfb = cfb;
	return WorkbookP;
}
var XLSBRecordEnum = {
	0: { f: parse_BrtRowHdr },
	1: { f: parse_BrtCellBlank },
	2: { f: parse_BrtCellRk },
	3: { f: parse_BrtCellError },
	4: { f: parse_BrtCellBool },
	5: { f: parse_BrtCellReal },
	6: { f: parse_BrtCellSt },
	7: { f: parse_BrtCellIsst },
	8: { f: parse_BrtFmlaString },
	9: { f: parse_BrtFmlaNum },
	10: { f: parse_BrtFmlaBool },
	11: { f: parse_BrtFmlaError },
	12: { f: parse_BrtShortBlank },
	13: { f: parse_BrtShortRk },
	14: { f: parse_BrtShortError },
	15: { f: parse_BrtShortBool },
	16: { f: parse_BrtShortReal },
	17: { f: parse_BrtShortSt },
	18: { f: parse_BrtShortIsst },
	19: { f: parse_RichStr },
	20: {},
	21: {},
	22: {},
	23: {},
	24: {},
	25: {},
	26: {},
	27: {},
	28: {},
	29: {},
	30: {},
	31: {},
	32: {},
	33: {},
	34: {},
	35: { T: 1 },
	36: { T: -1 },
	37: { T: 1 },
	38: { T: -1 },
	39: { f: parse_BrtName },
	40: {},
	42: {},
	43: { f: parse_BrtFont },
	44: { f: parse_BrtFmt },
	45: { f: parse_BrtFill },
	46: { f: parse_BrtBorder },
	47: { f: parse_BrtXF },
	48: {},
	49: { f: parse_Int32LE },
	50: {},
	51: { f: parse_BrtMdb },
	52: { T: 1 },
	53: { T: -1 },
	54: { T: 1 },
	55: { T: -1 },
	56: { T: 1 },
	57: { T: -1 },
	58: {},
	59: {},
	60: { f: parse_ColInfo },
	62: { f: parse_BrtCellRString },
	63: { f: parse_BrtCalcChainItem$ },
	64: { f: parse_BrtDVal },
	65: {},
	66: {},
	67: {},
	68: {},
	69: {},
	70: {},
	128: {},
	129: { T: 1 },
	130: { T: -1 },
	131: {
		T: 1,
		f: parsenoop,
		p: 0
	},
	132: { T: -1 },
	133: { T: 1 },
	134: { T: -1 },
	135: { T: 1 },
	136: { T: -1 },
	137: {
		T: 1,
		f: parse_BrtBeginWsView
	},
	138: { T: -1 },
	139: { T: 1 },
	140: { T: -1 },
	141: { T: 1 },
	142: { T: -1 },
	143: { T: 1 },
	144: { T: -1 },
	145: { T: 1 },
	146: { T: -1 },
	147: { f: parse_BrtWsProp },
	148: {
		f: parse_BrtWsDim,
		p: 16
	},
	151: { f: parse_BrtPane },
	152: {},
	153: { f: parse_BrtWbProp },
	154: {},
	155: {},
	156: { f: parse_BrtBundleSh },
	157: {},
	158: {},
	159: {
		T: 1,
		f: parse_BrtBeginSst
	},
	160: { T: -1 },
	161: {
		T: 1,
		f: parse_UncheckedRfX
	},
	162: { T: -1 },
	163: { T: 1 },
	164: { T: -1 },
	165: { T: 1 },
	166: { T: -1 },
	167: {},
	168: {},
	169: {},
	170: {},
	171: {},
	172: { T: 1 },
	173: { T: -1 },
	174: {},
	175: {},
	176: { f: parse_BrtMergeCell },
	177: { T: 1 },
	178: { T: -1 },
	179: { T: 1 },
	180: { T: -1 },
	181: { T: 1 },
	182: { T: -1 },
	183: { T: 1 },
	184: { T: -1 },
	185: { T: 1 },
	186: { T: -1 },
	187: { T: 1 },
	188: { T: -1 },
	189: { T: 1 },
	190: { T: -1 },
	191: { T: 1 },
	192: { T: -1 },
	193: { T: 1 },
	194: { T: -1 },
	195: { T: 1 },
	196: { T: -1 },
	197: { T: 1 },
	198: { T: -1 },
	199: { T: 1 },
	200: { T: -1 },
	201: { T: 1 },
	202: { T: -1 },
	203: { T: 1 },
	204: { T: -1 },
	205: { T: 1 },
	206: { T: -1 },
	207: { T: 1 },
	208: { T: -1 },
	209: { T: 1 },
	210: { T: -1 },
	211: { T: 1 },
	212: { T: -1 },
	213: { T: 1 },
	214: { T: -1 },
	215: { T: 1 },
	216: { T: -1 },
	217: { T: 1 },
	218: { T: -1 },
	219: { T: 1 },
	220: { T: -1 },
	221: { T: 1 },
	222: { T: -1 },
	223: { T: 1 },
	224: { T: -1 },
	225: { T: 1 },
	226: { T: -1 },
	227: { T: 1 },
	228: { T: -1 },
	229: { T: 1 },
	230: { T: -1 },
	231: { T: 1 },
	232: { T: -1 },
	233: { T: 1 },
	234: { T: -1 },
	235: { T: 1 },
	236: { T: -1 },
	237: { T: 1 },
	238: { T: -1 },
	239: { T: 1 },
	240: { T: -1 },
	241: { T: 1 },
	242: { T: -1 },
	243: { T: 1 },
	244: { T: -1 },
	245: { T: 1 },
	246: { T: -1 },
	247: { T: 1 },
	248: { T: -1 },
	249: { T: 1 },
	250: { T: -1 },
	251: { T: 1 },
	252: { T: -1 },
	253: { T: 1 },
	254: { T: -1 },
	255: { T: 1 },
	256: { T: -1 },
	257: { T: 1 },
	258: { T: -1 },
	259: { T: 1 },
	260: { T: -1 },
	261: { T: 1 },
	262: { T: -1 },
	263: { T: 1 },
	264: { T: -1 },
	265: { T: 1 },
	266: { T: -1 },
	267: { T: 1 },
	268: { T: -1 },
	269: { T: 1 },
	270: { T: -1 },
	271: { T: 1 },
	272: { T: -1 },
	273: { T: 1 },
	274: { T: -1 },
	275: { T: 1 },
	276: { T: -1 },
	277: {},
	278: { T: 1 },
	279: { T: -1 },
	280: { T: 1 },
	281: { T: -1 },
	282: { T: 1 },
	283: { T: 1 },
	284: { T: -1 },
	285: { T: 1 },
	286: { T: -1 },
	287: { T: 1 },
	288: { T: -1 },
	289: { T: 1 },
	290: { T: -1 },
	291: { T: 1 },
	292: { T: -1 },
	293: { T: 1 },
	294: { T: -1 },
	295: { T: 1 },
	296: { T: -1 },
	297: { T: 1 },
	298: { T: -1 },
	299: { T: 1 },
	300: { T: -1 },
	301: { T: 1 },
	302: { T: -1 },
	303: { T: 1 },
	304: { T: -1 },
	305: { T: 1 },
	306: { T: -1 },
	307: { T: 1 },
	308: { T: -1 },
	309: { T: 1 },
	310: { T: -1 },
	311: { T: 1 },
	312: { T: -1 },
	313: { T: -1 },
	314: { T: 1 },
	315: { T: -1 },
	316: { T: 1 },
	317: { T: -1 },
	318: { T: 1 },
	319: { T: -1 },
	320: { T: 1 },
	321: { T: -1 },
	322: { T: 1 },
	323: { T: -1 },
	324: { T: 1 },
	325: { T: -1 },
	326: { T: 1 },
	327: { T: -1 },
	328: { T: 1 },
	329: { T: -1 },
	330: { T: 1 },
	331: { T: -1 },
	332: { T: 1 },
	333: { T: -1 },
	334: { T: 1 },
	335: { f: parse_BrtMdtinfo },
	336: { T: -1 },
	337: {
		f: parse_BrtBeginEsmdb,
		T: 1
	},
	338: { T: -1 },
	339: { T: 1 },
	340: { T: -1 },
	341: { T: 1 },
	342: { T: -1 },
	343: { T: 1 },
	344: { T: -1 },
	345: { T: 1 },
	346: { T: -1 },
	347: { T: 1 },
	348: { T: -1 },
	349: { T: 1 },
	350: { T: -1 },
	351: {},
	352: {},
	353: { T: 1 },
	354: { T: -1 },
	355: { f: parse_RelID },
	357: {},
	358: {},
	359: {},
	360: { T: 1 },
	361: {},
	362: { f: parse_ExternSheet },
	363: {},
	364: {},
	366: {},
	367: {},
	368: {},
	369: {},
	370: {},
	371: {},
	372: { T: 1 },
	373: { T: -1 },
	374: { T: 1 },
	375: { T: -1 },
	376: { T: 1 },
	377: { T: -1 },
	378: { T: 1 },
	379: { T: -1 },
	380: { T: 1 },
	381: { T: -1 },
	382: { T: 1 },
	383: { T: -1 },
	384: { T: 1 },
	385: { T: -1 },
	386: { T: 1 },
	387: { T: -1 },
	388: { T: 1 },
	389: { T: -1 },
	390: { T: 1 },
	391: { T: -1 },
	392: { T: 1 },
	393: { T: -1 },
	394: { T: 1 },
	395: { T: -1 },
	396: {},
	397: {},
	398: {},
	399: {},
	400: {},
	401: { T: 1 },
	403: {},
	404: {},
	405: {},
	406: {},
	407: {},
	408: {},
	409: {},
	410: {},
	411: {},
	412: {},
	413: {},
	414: {},
	415: {},
	416: {},
	417: {},
	418: {},
	419: {},
	420: {},
	421: {},
	422: { T: 1 },
	423: { T: 1 },
	424: { T: -1 },
	425: { T: -1 },
	426: { f: parse_BrtArrFmla },
	427: { f: parse_BrtShrFmla },
	428: {},
	429: { T: 1 },
	430: { T: -1 },
	431: { T: 1 },
	432: { T: -1 },
	433: { T: 1 },
	434: { T: -1 },
	435: { T: 1 },
	436: { T: -1 },
	437: { T: 1 },
	438: { T: -1 },
	439: { T: 1 },
	440: { T: -1 },
	441: { T: 1 },
	442: { T: -1 },
	443: { T: 1 },
	444: { T: -1 },
	445: { T: 1 },
	446: { T: -1 },
	447: { T: 1 },
	448: { T: -1 },
	449: { T: 1 },
	450: { T: -1 },
	451: { T: 1 },
	452: { T: -1 },
	453: { T: 1 },
	454: { T: -1 },
	455: { T: 1 },
	456: { T: -1 },
	457: { T: 1 },
	458: { T: -1 },
	459: { T: 1 },
	460: { T: -1 },
	461: { T: 1 },
	462: { T: -1 },
	463: { T: 1 },
	464: { T: -1 },
	465: { T: 1 },
	466: { T: -1 },
	467: { T: 1 },
	468: { T: -1 },
	469: { T: 1 },
	470: { T: -1 },
	471: {},
	472: {},
	473: { T: 1 },
	474: { T: -1 },
	475: {},
	476: { f: parse_BrtMargins },
	477: {},
	478: {},
	479: { T: 1 },
	480: { T: -1 },
	481: { T: 1 },
	482: { T: -1 },
	483: { T: 1 },
	484: { T: -1 },
	485: { f: parse_BrtWsFmtInfo },
	486: { T: 1 },
	487: { T: -1 },
	488: { T: 1 },
	489: { T: -1 },
	490: { T: 1 },
	491: { T: -1 },
	492: { T: 1 },
	493: { T: -1 },
	494: { f: parse_BrtHLink },
	495: { T: 1 },
	496: { T: -1 },
	497: { T: 1 },
	498: { T: -1 },
	499: {},
	500: { T: 1 },
	501: { T: -1 },
	502: { T: 1 },
	503: { T: -1 },
	504: {},
	505: { T: 1 },
	506: { T: -1 },
	507: {},
	508: { T: 1 },
	509: { T: -1 },
	510: { T: 1 },
	511: { T: -1 },
	512: {},
	513: {},
	514: { T: 1 },
	515: { T: -1 },
	516: { T: 1 },
	517: { T: -1 },
	518: { T: 1 },
	519: { T: -1 },
	520: { T: 1 },
	521: { T: -1 },
	522: {},
	523: {},
	524: {},
	525: {},
	526: {},
	527: {},
	528: { T: 1 },
	529: { T: -1 },
	530: { T: 1 },
	531: { T: -1 },
	532: { T: 1 },
	533: { T: -1 },
	534: {},
	535: {},
	536: {},
	537: {},
	538: { T: 1 },
	539: { T: -1 },
	540: { T: 1 },
	541: { T: -1 },
	542: { T: 1 },
	548: {},
	549: {},
	550: { f: parse_RelID },
	551: { f: parse_XLNullableWideString },
	552: {},
	553: {},
	554: { T: 1 },
	555: { T: -1 },
	556: { T: 1 },
	557: { T: -1 },
	558: { T: 1 },
	559: { T: -1 },
	560: { T: 1 },
	561: { T: -1 },
	562: {},
	564: {},
	565: { T: 1 },
	566: { T: -1 },
	569: { T: 1 },
	570: { T: -1 },
	572: {},
	573: { T: 1 },
	574: { T: -1 },
	577: {},
	578: {},
	579: {},
	580: {},
	581: {},
	582: {},
	583: {},
	584: {},
	585: {},
	586: {},
	587: {},
	588: { T: -1 },
	589: {},
	590: { T: 1 },
	591: { T: -1 },
	592: { T: 1 },
	593: { T: -1 },
	594: { T: 1 },
	595: { T: -1 },
	596: {},
	597: { T: 1 },
	598: { T: -1 },
	599: { T: 1 },
	600: { T: -1 },
	601: { T: 1 },
	602: { T: -1 },
	603: { T: 1 },
	604: { T: -1 },
	605: { T: 1 },
	606: { T: -1 },
	607: {},
	608: { T: 1 },
	609: { T: -1 },
	610: {},
	611: { T: 1 },
	612: { T: -1 },
	613: { T: 1 },
	614: { T: -1 },
	615: { T: 1 },
	616: { T: -1 },
	617: { T: 1 },
	618: { T: -1 },
	619: { T: 1 },
	620: { T: -1 },
	625: {},
	626: { T: 1 },
	627: { T: -1 },
	628: { T: 1 },
	629: { T: -1 },
	630: { T: 1 },
	631: { T: -1 },
	632: { f: parse_BrtCommentAuthor },
	633: { T: 1 },
	634: { T: -1 },
	635: {
		T: 1,
		f: parse_BrtBeginComment
	},
	636: { T: -1 },
	637: { f: parse_BrtCommentText },
	638: { T: 1 },
	639: {},
	640: { T: -1 },
	641: { T: 1 },
	642: { T: -1 },
	643: { T: 1 },
	644: {},
	645: { T: -1 },
	646: { T: 1 },
	648: { T: 1 },
	649: {},
	650: { T: -1 },
	651: { f: parse_BrtCsProp },
	652: {},
	653: { T: 1 },
	654: { T: -1 },
	655: { T: 1 },
	656: { T: -1 },
	657: { T: 1 },
	658: { T: -1 },
	659: {},
	660: { T: 1 },
	661: {},
	662: { T: -1 },
	663: {},
	664: { T: 1 },
	665: {},
	666: { T: -1 },
	667: {},
	668: {},
	669: {},
	671: { T: 1 },
	672: { T: -1 },
	673: { T: 1 },
	674: { T: -1 },
	675: {},
	676: {},
	677: {},
	678: {},
	679: {},
	680: {},
	681: {},
	1024: {},
	1025: {},
	1026: { T: 1 },
	1027: { T: -1 },
	1028: { T: 1 },
	1029: { T: -1 },
	1030: {},
	1031: { T: 1 },
	1032: { T: -1 },
	1033: { T: 1 },
	1034: { T: -1 },
	1035: {},
	1036: {},
	1037: {},
	1038: { T: 1 },
	1039: { T: -1 },
	1040: {},
	1041: { T: 1 },
	1042: { T: -1 },
	1043: {},
	1044: {},
	1045: {},
	1046: { T: 1 },
	1047: { T: -1 },
	1048: { T: 1 },
	1049: { T: -1 },
	1050: {},
	1051: { T: 1 },
	1052: { T: 1 },
	1053: { f: parse_BrtDVal14 },
	1054: { T: 1 },
	1055: {},
	1056: { T: 1 },
	1057: { T: -1 },
	1058: { T: 1 },
	1059: { T: -1 },
	1061: {},
	1062: { T: 1 },
	1063: { T: -1 },
	1064: { T: 1 },
	1065: { T: -1 },
	1066: { T: 1 },
	1067: { T: -1 },
	1068: { T: 1 },
	1069: { T: -1 },
	1070: { T: 1 },
	1071: { T: -1 },
	1072: { T: 1 },
	1073: { T: -1 },
	1075: { T: 1 },
	1076: { T: -1 },
	1077: { T: 1 },
	1078: { T: -1 },
	1079: { T: 1 },
	1080: { T: -1 },
	1081: { T: 1 },
	1082: { T: -1 },
	1083: { T: 1 },
	1084: { T: -1 },
	1085: {},
	1086: { T: 1 },
	1087: { T: -1 },
	1088: { T: 1 },
	1089: { T: -1 },
	1090: { T: 1 },
	1091: { T: -1 },
	1092: { T: 1 },
	1093: { T: -1 },
	1094: { T: 1 },
	1095: { T: -1 },
	1096: {},
	1097: { T: 1 },
	1098: {},
	1099: { T: -1 },
	1100: { T: 1 },
	1101: { T: -1 },
	1102: {},
	1103: {},
	1104: {},
	1105: {},
	1111: {},
	1112: {},
	1113: { T: 1 },
	1114: { T: -1 },
	1115: { T: 1 },
	1116: { T: -1 },
	1117: {},
	1118: { T: 1 },
	1119: { T: -1 },
	1120: { T: 1 },
	1121: { T: -1 },
	1122: { T: 1 },
	1123: { T: -1 },
	1124: { T: 1 },
	1125: { T: -1 },
	1126: {},
	1128: { T: 1 },
	1129: { T: -1 },
	1130: {},
	1131: { T: 1 },
	1132: { T: -1 },
	1133: { T: 1 },
	1134: { T: -1 },
	1135: { T: 1 },
	1136: { T: -1 },
	1137: { T: 1 },
	1138: { T: -1 },
	1139: { T: 1 },
	1140: { T: -1 },
	1141: {},
	1142: { T: 1 },
	1143: { T: -1 },
	1144: { T: 1 },
	1145: { T: -1 },
	1146: {},
	1147: { T: 1 },
	1148: { T: -1 },
	1149: { T: 1 },
	1150: { T: -1 },
	1152: { T: 1 },
	1153: { T: -1 },
	1154: { T: -1 },
	1155: { T: -1 },
	1156: { T: -1 },
	1157: { T: 1 },
	1158: { T: -1 },
	1159: { T: 1 },
	1160: { T: -1 },
	1161: { T: 1 },
	1162: { T: -1 },
	1163: { T: 1 },
	1164: { T: -1 },
	1165: { T: 1 },
	1166: { T: -1 },
	1167: { T: 1 },
	1168: { T: -1 },
	1169: { T: 1 },
	1170: { T: -1 },
	1171: {},
	1172: { T: 1 },
	1173: { T: -1 },
	1177: {},
	1178: { T: 1 },
	1180: {},
	1181: {},
	1182: {},
	2048: { T: 1 },
	2049: { T: -1 },
	2050: {},
	2051: { T: 1 },
	2052: { T: -1 },
	2053: {},
	2054: {},
	2055: { T: 1 },
	2056: { T: -1 },
	2057: { T: 1 },
	2058: { T: -1 },
	2060: {},
	2067: {},
	2068: { T: 1 },
	2069: { T: -1 },
	2070: {},
	2071: {},
	2072: { T: 1 },
	2073: { T: -1 },
	2075: {},
	2076: {},
	2077: { T: 1 },
	2078: { T: -1 },
	2079: {},
	2080: { T: 1 },
	2081: { T: -1 },
	2082: {},
	2083: { T: 1 },
	2084: { T: -1 },
	2085: { T: 1 },
	2086: { T: -1 },
	2087: { T: 1 },
	2088: { T: -1 },
	2089: { T: 1 },
	2090: { T: -1 },
	2091: {},
	2092: {},
	2093: { T: 1 },
	2094: { T: -1 },
	2095: {},
	2096: { T: 1 },
	2097: { T: -1 },
	2098: { T: 1 },
	2099: { T: -1 },
	2100: { T: 1 },
	2101: { T: -1 },
	2102: {},
	2103: { T: 1 },
	2104: { T: -1 },
	2105: {},
	2106: { T: 1 },
	2107: { T: -1 },
	2108: {},
	2109: { T: 1 },
	2110: { T: -1 },
	2111: { T: 1 },
	2112: { T: -1 },
	2113: { T: 1 },
	2114: { T: -1 },
	2115: {},
	2116: {},
	2117: {},
	2118: { T: 1 },
	2119: { T: -1 },
	2120: {},
	2121: { T: 1 },
	2122: { T: -1 },
	2123: { T: 1 },
	2124: { T: -1 },
	2125: {},
	2126: { T: 1 },
	2127: { T: -1 },
	2128: {},
	2129: { T: 1 },
	2130: { T: -1 },
	2131: { T: 1 },
	2132: { T: -1 },
	2133: { T: 1 },
	2134: {},
	2135: {},
	2136: {},
	2137: { T: 1 },
	2138: { T: -1 },
	2139: { T: 1 },
	2140: { T: -1 },
	2141: {},
	3072: {},
	3073: {},
	4096: { T: 1 },
	4097: { T: -1 },
	5002: { T: 1 },
	5003: { T: -1 },
	5081: { T: 1 },
	5082: { T: -1 },
	5083: {},
	5084: { T: 1 },
	5085: { T: -1 },
	5086: { T: 1 },
	5087: { T: -1 },
	5088: {},
	5089: {},
	5090: {},
	5092: { T: 1 },
	5093: { T: -1 },
	5094: {},
	5095: { T: 1 },
	5096: { T: -1 },
	5097: {},
	5099: {},
	5100: {},
	5101: {},
	5102: {},
	5103: {},
	5105: {},
	5108: {},
	5109: {},
	5110: {},
	5111: {},
	5112: {},
	5113: {},
	5114: {},
	5117: {},
	5127: {},
	5130: {},
	5131: {},
	5132: {},
	5134: {},
	5135: {},
	65535: { n: "" }
};
var XLSRecordEnum = {
	6: { f: parse_Formula },
	10: { f: parsenoop2 },
	12: { f: parseuint16 },
	13: { f: parseuint16 },
	14: { f: parsebool },
	15: { f: parsebool },
	16: { f: parse_Xnum },
	17: { f: parsebool },
	18: { f: parsebool },
	19: { f: parseuint16 },
	20: { f: parse_XLHeaderFooter },
	21: { f: parse_XLHeaderFooter },
	23: { f: parse_ExternSheet },
	24: { f: parse_Lbl },
	25: { f: parsebool },
	26: {},
	27: {},
	28: { f: parse_Note },
	29: {},
	34: { f: parsebool },
	35: { f: parse_ExternName },
	38: { f: parse_Xnum },
	39: { f: parse_Xnum },
	40: { f: parse_Xnum },
	41: { f: parse_Xnum },
	42: { f: parsebool },
	43: { f: parsebool },
	47: { f: parse_FilePass },
	49: { f: parse_Font },
	51: { f: parseuint16 },
	60: {},
	61: { f: parse_Window1 },
	64: { f: parsebool },
	65: { f: parse_Pane },
	66: { f: parseuint16 },
	77: {},
	80: {},
	81: {},
	82: {},
	85: { f: parseuint16 },
	89: {},
	90: {},
	91: {},
	92: { f: parse_WriteAccess },
	93: { f: parse_Obj },
	94: {},
	95: { f: parsebool },
	96: {},
	97: {},
	99: { f: parsebool },
	125: { f: parse_ColInfo },
	128: { f: parse_Guts },
	129: { f: parse_WsBool },
	130: { f: parseuint16 },
	131: { f: parsebool },
	132: { f: parsebool },
	133: { f: parse_BoundSheet8 },
	134: {},
	140: { f: parse_Country },
	141: { f: parseuint16 },
	144: {},
	146: { f: parse_Palette },
	151: {},
	152: {},
	153: {},
	154: {},
	155: {},
	156: { f: parseuint16 },
	157: {},
	158: {},
	160: { f: parse_Scl },
	161: { f: parse_Setup },
	174: {},
	175: {},
	176: {},
	177: {},
	178: {},
	180: {},
	181: {},
	182: {},
	184: {},
	185: {},
	189: { f: parse_MulRk },
	190: { f: parse_MulBlank },
	193: { f: parsenoop2 },
	197: {},
	198: {},
	199: {},
	200: {},
	201: {},
	202: { f: parsebool },
	203: {},
	204: {},
	205: {},
	206: {},
	207: {},
	208: {},
	209: {},
	210: {},
	211: {},
	213: {},
	215: {},
	216: {},
	217: {},
	218: { f: parseuint16 },
	220: {},
	221: { f: parsebool },
	222: {},
	224: { f: parse_XF },
	225: { f: parse_InterfaceHdr },
	226: { f: parsenoop2 },
	227: {},
	229: { f: parse_MergeCells },
	233: {},
	235: { f: parse_MsoDrawingGroup },
	236: { f: parse_MsoDrawing },
	237: {},
	239: {},
	240: {},
	241: {},
	242: {},
	244: {},
	245: {},
	246: {},
	247: {},
	248: {},
	249: {},
	251: {},
	252: { f: parse_SST },
	253: { f: parse_LabelSst },
	255: { f: parse_ExtSST },
	256: {},
	259: {},
	290: {},
	311: {},
	312: {},
	315: {},
	317: { f: parseuint16a },
	318: {},
	319: {},
	320: {},
	330: {},
	331: {},
	333: {},
	334: {},
	335: {},
	336: {},
	337: {},
	338: {},
	339: {},
	340: {},
	351: {},
	352: { f: parsebool },
	353: { f: parsenoop2 },
	401: {},
	402: {},
	403: {},
	404: {},
	405: {},
	406: {},
	407: {},
	408: {},
	425: {},
	426: {},
	427: {},
	428: {},
	429: {},
	430: { f: parse_SupBook },
	431: { f: parsebool },
	432: {},
	433: {},
	434: {},
	437: {},
	438: { f: parse_TxO },
	439: { f: parsebool },
	440: { f: parse_HLink },
	441: {},
	442: { f: parse_XLUnicodeString },
	443: {},
	444: { f: parseuint16 },
	445: {},
	446: {},
	448: { f: parsenoop2 },
	449: {
		f: parse_RecalcId,
		r: 2
	},
	450: { f: parsenoop2 },
	512: { f: parse_Dimensions },
	513: { f: parse_Blank },
	515: { f: parse_Number },
	516: { f: parse_Label },
	517: { f: parse_BoolErr },
	519: { f: parse_String },
	520: { f: parse_Row },
	523: {},
	545: { f: parse_Array },
	549: { f: parse_DefaultRowHeight },
	566: {},
	574: { f: parse_Window2 },
	638: { f: parse_RK },
	659: {},
	1048: {},
	1054: { f: parse_Format },
	1084: {},
	1212: { f: parse_ShrFmla },
	2048: { f: parse_HLinkTooltip },
	2049: {},
	2050: {},
	2051: {},
	2052: {},
	2053: {},
	2054: {},
	2055: {},
	2056: {},
	2057: { f: parse_BOF },
	2058: {},
	2059: {},
	2060: {},
	2061: {},
	2062: {},
	2063: {},
	2064: {},
	2066: {},
	2067: {},
	2128: {},
	2129: {},
	2130: {},
	2131: {},
	2132: {},
	2133: {},
	2134: {},
	2135: {},
	2136: {},
	2137: {},
	2138: {},
	2146: {},
	2147: { r: 12 },
	2148: {},
	2149: {},
	2150: {},
	2151: { f: parsenoop2 },
	2152: {},
	2154: {},
	2155: {},
	2156: {},
	2161: {},
	2162: {},
	2164: {},
	2165: {},
	2166: {},
	2167: {},
	2168: {},
	2169: {},
	2170: {},
	2171: {},
	2172: {
		f: parse_XFCRC,
		r: 12
	},
	2173: {
		f: parse_XFExt,
		r: 12
	},
	2174: {},
	2175: {},
	2180: {},
	2181: {},
	2182: {},
	2183: {},
	2184: {},
	2185: {},
	2186: {},
	2187: {},
	2188: {
		f: parsebool,
		r: 12
	},
	2189: {},
	2190: { r: 12 },
	2191: {},
	2192: {},
	2194: {},
	2195: {},
	2196: {
		f: parse_NameCmt,
		r: 12
	},
	2197: {},
	2198: {
		f: parse_Theme,
		r: 12
	},
	2199: {},
	2200: {},
	2201: {},
	2202: {
		f: parse_MTRSettings,
		r: 12
	},
	2203: { f: parsenoop2 },
	2204: {},
	2205: {},
	2206: {},
	2207: {},
	2211: { f: parse_ForceFullCalculation },
	2212: {},
	2213: {},
	2214: {},
	2215: {},
	4097: {},
	4098: { f: parse_BIFFChart },
	4099: { f: parse_BIFFChartSeries },
	4102: {},
	4103: {},
	4105: {},
	4106: {},
	4107: {},
	4108: {},
	4109: { f: parse_BIFFSeriesText },
	4116: {},
	4117: { f: parse_BIFFLegend },
	4118: {},
	4119: { f: parse_BIFFBar },
	4120: { f: parse_BIFFLine },
	4121: { f: parse_BIFFPie },
	4122: { f: parse_BIFFArea },
	4123: { f: parse_BIFFScatter },
	4124: {},
	4125: { f: parse_BIFFAxis },
	4126: {},
	4127: {},
	4128: {},
	4129: {},
	4130: {},
	4132: {},
	4133: { f: parse_BIFFText },
	4134: { f: parseuint16 },
	4135: {},
	4146: {},
	4147: {},
	4148: {},
	4149: {},
	4154: {},
	4156: {},
	4157: {},
	4158: { f: parse_BIFFRadar },
	4159: { f: parse_BIFFSurface },
	4160: {},
	4161: {},
	4163: {},
	4164: { f: parse_ShtProps },
	4165: {},
	4166: {},
	4168: {},
	4170: {},
	4171: {},
	4174: {},
	4175: {},
	4176: {},
	4177: { f: parse_BIFFBRAI },
	4187: {},
	4188: { f: parse_ClrtClient },
	4189: {},
	4191: {},
	4192: {},
	4193: {},
	4194: {},
	4195: {},
	4196: {},
	4197: {},
	4198: {},
	4199: {},
	4200: {},
	0: { f: parse_Dimensions },
	1: {},
	2: { f: parse_BIFF2INT },
	3: { f: parse_BIFF2NUM },
	4: { f: parse_BIFF2STR },
	5: { f: parse_BIFF2BOOLERR },
	7: { f: parse_BIFF2STRING },
	8: {},
	9: { f: parse_BOF },
	11: {},
	22: { f: parseuint16 },
	30: { f: parse_BIFF2Format },
	31: {},
	32: {},
	33: { f: parse_Array },
	36: {},
	37: { f: parse_DefaultRowHeight },
	50: { f: parse_BIFF2FONTXTRA },
	62: {},
	52: {},
	67: { f: parse_BIFF2XF },
	68: { f: parseuint16 },
	69: {},
	86: {},
	126: {},
	127: { f: parse_ImData },
	135: {},
	136: {},
	137: {},
	143: { f: parse_BIFF4SheetInfo },
	145: {},
	148: {},
	149: {},
	150: {},
	169: {},
	171: {},
	188: {},
	191: {},
	192: {},
	194: {},
	195: {},
	214: { f: parse_RString },
	223: {},
	234: {},
	354: {},
	421: {},
	518: { f: parse_Formula },
	521: { f: parse_BOF },
	536: { f: parse_Lbl },
	547: { f: parse_ExternName },
	561: {},
	579: { f: parse_BIFF3XF },
	1030: { f: parse_Formula },
	1033: { f: parse_BOF },
	1091: { f: parse_BIFF4XF },
	2157: {},
	2163: {},
	2177: {},
	2240: {},
	2241: {},
	2242: {},
	2243: {},
	2244: {},
	2245: {},
	2246: {},
	2247: {},
	2248: {},
	2249: {},
	2250: {},
	2251: {},
	2262: { r: 12 },
	101: {},
	102: {},
	105: {},
	106: {},
	107: {},
	109: {},
	112: {},
	114: {},
	29282: {}
};
function write_biff_rec(ba, type, payload, length) {
	var t = type;
	if (isNaN(t)) return;
	var len = length || (payload || []).length || 0;
	var o = ba.next(4);
	o.write_shift(2, t);
	o.write_shift(2, len);
	if (len > 0 && is_buf(payload)) ba.push(payload);
}
function html_to_sheet(str, _opts) {
	var opts = _opts || {};
	var dense = opts.dense != null ? opts.dense : DENSE;
	var ws = {};
	if (dense) ws["!data"] = [];
	str = str_remove_ng(str, "<!--", "-->");
	var mtch = str.match(/<table/i);
	if (!mtch) throw new Error("Invalid HTML: could not find <table>");
	var mtch2 = str.match(/<\/table/i);
	var i = mtch.index, j = mtch2 && mtch2.index || str.length;
	var rows = split_regex(str.slice(i, j), /(:?<tr[^<>]*>)/i, "<tr>");
	var R = -1, C = 0, RS = 0, CS = 0;
	var range = {
		s: {
			r: 1e7,
			c: 1e7
		},
		e: {
			r: 0,
			c: 0
		}
	};
	var merges = [];
	for (i = 0; i < rows.length; ++i) {
		var row = rows[i].trim();
		var hd = row.slice(0, 3).toLowerCase();
		if (hd == "<tr") {
			++R;
			if (opts.sheetRows && opts.sheetRows <= R) {
				--R;
				break;
			}
			C = 0;
			continue;
		}
		if (hd != "<td" && hd != "<th") continue;
		var cells = row.split(/<\/t[dh]>/i);
		for (j = 0; j < cells.length; ++j) {
			var cell = cells[j].trim();
			if (!cell.match(/<t[dh]/i)) continue;
			var m = cell, cc = 0;
			while (m.charAt(0) == "<" && (cc = m.indexOf(">")) > -1) m = m.slice(cc + 1);
			for (var midx = 0; midx < merges.length; ++midx) {
				var _merge = merges[midx];
				if (_merge.s.c == C && _merge.s.r < R && R <= _merge.e.r) {
					C = _merge.e.c + 1;
					midx = -1;
				}
			}
			var tag = parsexmltag(cell.slice(0, cell.indexOf(">")));
			CS = tag.colspan ? +tag.colspan : 1;
			if ((RS = +tag.rowspan) > 1 || CS > 1) merges.push({
				s: {
					r: R,
					c: C
				},
				e: {
					r: R + (RS || 1) - 1,
					c: C + CS - 1
				}
			});
			var _t = tag.t || tag["data-t"] || "";
			if (!m.length) {
				C += CS;
				continue;
			}
			m = htmldecode(m);
			if (range.s.r > R) range.s.r = R;
			if (range.e.r < R) range.e.r = R;
			if (range.s.c > C) range.s.c = C;
			if (range.e.c < C) range.e.c = C;
			if (!m.length) {
				C += CS;
				continue;
			}
			var o = {
				t: "s",
				v: m
			};
			if (opts.raw || !m.trim().length || _t == "s") {} else if (m === "TRUE") o = {
				t: "b",
				v: true
			};
			else if (m === "FALSE") o = {
				t: "b",
				v: false
			};
			else if (!isNaN(fuzzynum(m))) o = {
				t: "n",
				v: fuzzynum(m)
			};
			else if (!isNaN(fuzzydate(m).getDate())) {
				o = {
					t: "d",
					v: parseDate(m)
				};
				if (opts.UTC === false) o.v = utc_to_local(o.v);
				if (!opts.cellDates) o = {
					t: "n",
					v: datenum(o.v)
				};
				o.z = opts.dateNF || table_fmt[14];
			} else if (m.charCodeAt(0) == 35 && RBErr[m] != null) {
				o.t = "e";
				o.w = m;
				o.v = RBErr[m];
			}
			if (o.cellText !== false) o.w = m;
			if (dense) {
				if (!ws["!data"][R]) ws["!data"][R] = [];
				ws["!data"][R][C] = o;
			} else ws[encode_cell({
				r: R,
				c: C
			})] = o;
			C += CS;
		}
	}
	ws["!ref"] = encode_range(range);
	if (merges.length) ws["!merges"] = merges;
	return ws;
}
function css_color(color) {
	if (!color) return "";
	if (color.rgb && /^[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/.test(String(color.rgb))) return "#" + String(color.rgb).slice(-6);
	return "";
}
function css_font_family(name) {
	if (!name) return "";
	return "'" + css_string_escape(name, "'") + "'";
}
function html_attr_escape(value) {
	return String(value).replace(/[&<>"']/g, function(ch) {
		return ch == "&" ? "&amp;" : ch == "<" ? "&lt;" : ch == ">" ? "&gt;" : ch == "\"" ? "&quot;" : "&#39;";
	});
}
function html_writextag(tag, content, attrs) {
	var out = ["<", tag];
	if (attrs) keys(attrs).forEach(function(key) {
		out.push(" ", key, "=\"", html_attr_escape(attrs[key]), "\"");
	});
	if (content == null) {
		out.push("/>");
		return out.join("");
	}
	out.push(">", content, "</", tag, ">");
	return out.join("");
}
function safe_html_href(value) {
	var href = String(value == null ? "" : value).trim();
	if (!href || href.slice(0, 2) == "//") return null;
	var colon = href.indexOf(":"), prefix = colon == -1 ? "" : href.slice(0, colon), compact = "";
	for (var i = 0; i < prefix.length; ++i) if (prefix.charCodeAt(i) > 32 && prefix.charCodeAt(i) != 127) compact += prefix.charAt(i);
	if (colon != -1 && !/^(?:https?|mailto|tel)$/i.test(compact)) return null;
	return href;
}
function safe_html_image_src(value) {
	var src = String(value == null ? "" : value);
	return /^data:image\/[A-Za-z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+$/.test(src) ? src : null;
}
function sanitize_cell_html(value) {
	var html = String(value == null ? "" : value), out = [], pos = 0;
	while (pos < html.length) {
		var start = html.indexOf("<", pos);
		if (start == -1) {
			out.push(html.slice(pos));
			break;
		}
		out.push(html.slice(pos, start));
		var end = html.indexOf(">", start + 1);
		if (end == -1) {
			out.push("&lt;", html.slice(start + 1));
			break;
		}
		var raw = html.slice(start + 1, end).trim(), lower = raw.toLowerCase();
		if (/^(?:\/?(?:b|i|s|sup|sub)|br\s*\/?)$/.test(lower)) out.push("<", lower == "br" ? "br/" : lower, ">");
		else if (lower == "/span") out.push("</span>");
		else if (lower.slice(0, 12) == "span style=\"" && raw.charAt(raw.length - 1) == "\"") {
			var declarations = raw.slice(12, -1).split(";"), safe = [];
			declarations.forEach(function(decl) {
				var colon = decl.indexOf(":"), key = colon == -1 ? "" : decl.slice(0, colon).trim().toLowerCase(), val = colon == -1 ? "" : decl.slice(colon + 1).trim().toLowerCase();
				if (key == "text-decoration" && val == "underline") safe.push("text-decoration:underline");
				else if (key == "text-underline-style" && /^(?:single|double|single-accounting|double-accounting)$/.test(val)) safe.push("text-underline-style:" + val);
				else if (key == "font-size" && /^\d+(?:\.\d+)?pt$/.test(val)) safe.push("font-size:" + val);
				else if (key == "text-effect" && val == "outline") safe.push("text-effect:outline");
				else if (key == "text-shadow" && val == "auto") safe.push("text-shadow:auto");
			});
			out.push("<span style=\"", safe.join(";"), safe.length ? ";" : "", "\">");
		} else out.push(html_attr_escape(html.slice(start, end + 1)));
		pos = end + 1;
	}
	return out.join("");
}
function html_border_style(style) {
	switch (style) {
		case "dashDot":
		case "dashDotDot":
		case "dashed":
		case "mediumDashed": return "dashed";
		case "dotted":
		case "hair": return "dotted";
		case "double": return "double";
		case "none": return "none";
		default: return "solid";
	}
}
function html_border_width(style) {
	switch (style) {
		case "medium":
		case "mediumDashDot":
		case "mediumDashDotDot":
		case "mediumDashed": return "2px";
		case "thick": return "3px";
		case "hair": return "1px";
		default: return "1px";
	}
}
function add_html_border(css, side, border) {
	if (!border || !border.style || border.style == "none") return;
	var color = css_color(border.color) || "#000000";
	css.push("border-" + side + ":" + html_border_width(border.style) + " " + html_border_style(border.style) + " " + color);
}
function html_cell_style(cell, opts) {
	if (!opts || !opts.cellStyles || !cell || !cell.s) return "";
	var s = cell.s, css = [];
	var font = s.font || {};
	if (font.name) css.push("font-family:" + css_font_family(font.name));
	var fontSize = +font.sz;
	if (isFinite(fontSize) && fontSize > 0) css.push("font-size:" + Math.min(fontSize, 409) + "pt");
	if (font.bold) css.push("font-weight:bold");
	if (font.italic) css.push("font-style:italic");
	var deco = [];
	if (font.underline) deco.push("underline");
	if (font.strike) deco.push("line-through");
	if (deco.length) css.push("text-decoration:" + deco.join(" "));
	if (font.color && css_color(font.color)) css.push("color:" + css_color(font.color));
	var fill = s.fill || s;
	var fillColor = "";
	if (fill.patternType != "none" && fill.patternType != "gray125") fillColor = css_color(fill.fgColor) || css_color(fill.bgColor);
	if (fillColor) css.push("background-color:" + fillColor);
	var alignment = s.alignment || {};
	if (/^(?:left|right|center|justify|fill|distributed)$/.test(alignment.horizontal || "")) css.push("text-align:" + alignment.horizontal);
	var vertical = alignment.vertical == "center" ? "middle" : alignment.vertical;
	if (/^(?:top|middle|bottom|baseline)$/.test(vertical || "")) css.push("vertical-align:" + vertical);
	if (alignment.textRotation != null && alignment.textRotation !== 0) {
		var deg = alignment.textRotation == 255 ? 90 : alignment.textRotation > 90 ? 90 - alignment.textRotation : alignment.textRotation;
		css.push("transform:rotate(" + deg + "deg)");
		css.push("transform-origin:center");
	}
	var border = s.border || {};
	add_html_border(css, "left", border.left || border.start);
	add_html_border(css, "right", border.right || border.end);
	add_html_border(css, "top", border.top);
	add_html_border(css, "bottom", border.bottom);
	return css.join(";");
}
function html_cell_layout_style(cell, opts, C, CS, cols) {
	if (!opts || !cell) return "";
	var s = cell.s || {}, alignment = s.alignment || {}, css = [];
	if (opts.browserPixels || opts.autoFit) css.push("box-sizing:border-box;padding:0 2px;min-width:0");
	if (alignment.wrapText) css.push("white-space:pre-wrap;overflow-wrap:normal;word-break:normal");
	else {
		css.push("white-space:pre");
		if (alignment.shrinkToFit || opts.overflow == "clip" || opts.overflow == "hidden") css.push("overflow:hidden;text-overflow:clip");
		else css.push("overflow:visible");
	}
	if (alignment.shrinkToFit && cols && C != null) {
		var have = 0, span = CS || 1;
		for (var j = 0; j < span; ++j) have += html_col_width(cols[C + j]);
		var need = measure_cell_text_width(cell, s, opts);
		if (have > 0 && need > have) {
			var scale = Math.max(.25, Math.min(1, have / need));
			css.push("font-size:" + Math.max(1, style_font_size_pt(s) * scale) + "pt");
		}
	}
	return css.join(";");
}
function html_col_width(col) {
	return col2px(col);
}
function html_row_height(row) {
	if (!row) return 20;
	if (row.hpx != null) return row.hpx;
	if (row.hpt != null) return pt2px_browser(row.hpt);
	return 20;
}
function make_html_row(ws, r, R, o) {
	var M = ws["!merges"] || [];
	var oo = [];
	var sp = {};
	var dense = ws["!data"] != null;
	var row = (ws["!rows"] || [])[R];
	var cols = o && o._htmlCols || ws["!cols"] || [];
	for (var C = r.s.c; C <= r.e.c; ++C) {
		var RS = 0, CS = 0;
		for (var j = 0; j < M.length; ++j) {
			if (M[j].s.r > R || M[j].s.c > C) continue;
			if (M[j].e.r < R || M[j].e.c < C) continue;
			if (M[j].s.r < R || M[j].s.c < C) {
				RS = -1;
				break;
			}
			RS = M[j].e.r - M[j].s.r + 1;
			CS = M[j].e.c - M[j].s.c + 1;
			break;
		}
		if (RS < 0) continue;
		var coord = encode_col(C) + encode_row(R);
		var cell = dense ? (ws["!data"][R] || [])[C] : ws[coord];
		var stylecell = cell;
		if (cell && cell.t == "n" && cell.v != null && !isFinite(cell.v)) {
			if (isNaN(cell.v)) cell = {
				t: "e",
				v: 36,
				w: BErr[36]
			};
			else cell = {
				t: "e",
				v: 7,
				w: BErr[7]
			};
			stylecell = cell;
		}
		if (o.cellStyles) {
			var inherited = {};
			if (cols[C] && cols[C].s) extend_style_obj(inherited, cols[C].s);
			if (row && row.s) extend_style_obj(inherited, row.s);
			if (cell && cell.s) extend_style_obj(inherited, cell.s);
			inherited = resolve_table_cell_style(ws, R, C, inherited) || inherited;
			if (keys(inherited).length) {
				stylecell = cell ? dup(cell) : { t: "z" };
				stylecell.s = inherited;
			}
		}
		var w = cell && cell.v != null && (cell.h ? sanitize_cell_html(cell.h) : escapehtml(cell.w || (format_cell(cell), cell.w) || "")) || "";
		sp = {};
		if (RS > 1) sp.rowspan = RS;
		if (CS > 1) sp.colspan = CS;
		if (o.editable) w = "<span contenteditable=\"true\">" + w + "</span>";
		else if (cell) {
			sp["data-t"] = cell && cell.t || "z";
			if (cell.v != null) sp["data-v"] = cell.v instanceof Date ? cell.v.toISOString() : cell.v;
			if (cell.z != null) sp["data-z"] = cell.z;
			if (cell.f != null) sp["data-f"] = cell.f;
			var href = cell.l && safe_html_href(cell.l.Target);
			if (href) w = "<a href=\"" + html_attr_escape(href) + "\">" + w + "</a>";
		}
		var cstyle = html_cell_style(stylecell, o);
		var lstyle = html_cell_layout_style(stylecell, o, C, CS, cols);
		if (lstyle) cstyle = cstyle ? cstyle + ";" + lstyle : lstyle;
		if (cstyle) sp.style = cstyle;
		sp.id = (o.id || "sjs") + "-" + coord;
		oo.push(html_writextag("td", w, sp));
	}
	var rsp = {}, rstyle = [];
	if (row) {
		if (row.hidden) rstyle.push("display:none");
		if (o.browserPixels) rstyle.push("height:" + html_row_height(row) + "px");
	}
	if (rstyle.length) rsp.style = rstyle.join(";");
	return html_writextag("tr", oo.join(""), rsp);
}
var HTML_BEGIN = "<html><head><meta charset=\"utf-8\"/><title>SheetJS Table Export</title></head><body>";
var HTML_END = "</body></html>";
function html_to_workbook(str, opts) {
	var mtch = str_match_xml_ig(str, "table");
	if (!mtch || mtch.length == 0) throw new Error("Invalid HTML: could not find <table>");
	if (mtch.length == 1) {
		var w = sheet_to_workbook(html_to_sheet(mtch[0], opts), opts);
		w.bookType = "html";
		return w;
	}
	var wb = book_new();
	mtch.forEach(function(s, idx) {
		book_append_sheet(wb, html_to_sheet(s, opts), "Sheet" + (idx + 1));
	});
	wb.bookType = "html";
	return wb;
}
var HTML_EMU_PER_PIXEL = 9525;
function html_anchor_pos(ws, anchor, opts) {
	var out = {
		left: 0,
		top: 0,
		width: 480,
		height: 288
	};
	var cols = opts && opts._htmlCols || ws["!cols"] || [], rows = ws["!rows"] || [];
	var from = anchor && anchor.from || {
		col: 0,
		row: 0,
		colOff: 0,
		rowOff: 0
	};
	var to = anchor && anchor.to;
	for (var C = 0; C < (from.col || 0); ++C) out.left += html_col_width(cols[C]);
	for (var R = 0; R < (from.row || 0); ++R) out.top += html_row_height(rows[R]);
	out.left += (from.colOff || 0) / HTML_EMU_PER_PIXEL;
	out.top += (from.rowOff || 0) / HTML_EMU_PER_PIXEL;
	if (to) {
		var right = 0, bottom = 0;
		for (C = 0; C < (to.col || 0); ++C) right += html_col_width(cols[C]);
		for (R = 0; R < (to.row || 0); ++R) bottom += html_row_height(rows[R]);
		right += (to.colOff || 0) / HTML_EMU_PER_PIXEL;
		bottom += (to.rowOff || 0) / HTML_EMU_PER_PIXEL;
		out.width = Math.max(1, right - out.left);
		out.height = Math.max(1, bottom - out.top);
	} else if (anchor && anchor.ext) {
		if (anchor.ext.cx) out.width = anchor.ext.cx / HTML_EMU_PER_PIXEL;
		if (anchor.ext.cy) out.height = anchor.ext.cy / HTML_EMU_PER_PIXEL;
	}
	return out;
}
function html_abs_style(pos) {
	return "position:absolute;left:" + Math.round(pos.left) + "px;top:" + Math.round(pos.top) + "px;width:" + Math.round(pos.width) + "px;height:" + Math.round(pos.height) + "px";
}
function chart_series_values(ser) {
	if (!ser) return [];
	if (ser.val && ser.val.values) return ser.val.values;
	if (ser.yVal && ser.yVal.values) return ser.yVal.values;
	if (ser.data && ser.data.length) return ser.data;
	return [];
}
function chart_series_labels(ser) {
	if (!ser) return [];
	if (ser.cat && ser.cat.values) return ser.cat.values;
	if (ser.xVal && ser.xVal.values) return ser.xVal.values;
	return [];
}
function render_chart_svg(chart, width, height) {
	var model = chart && (chart.model || chart["!chart"] || chart);
	if (!model) return "";
	var series = model.series || [], type = (model.type || "").replace(/Chart$/, "");
	var w = Math.max(160, Math.round(width || 480)), h = Math.max(120, Math.round(height || 288));
	var title = model.title || chart.title || "";
	var colors = [
		"#4F81BD",
		"#C0504D",
		"#9BBB59",
		"#8064A2",
		"#4BACC6",
		"#F79646"
	];
	var out = ["<svg class=\"sjs-chart-svg\" xmlns=\"http://www.w3.org/2000/svg\" width=\"" + w + "\" height=\"" + h + "\" viewBox=\"0 0 " + w + " " + h + "\">"];
	out.push("<rect x=\"0\" y=\"0\" width=\"" + w + "\" height=\"" + h + "\" fill=\"#fff\" stroke=\"#d0d7de\"/>");
	if (title) out.push("<text x=\"" + w / 2 + "\" y=\"20\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"14\">" + escapehtml(title) + "</text>");
	var top = title ? 34 : 16, left = 42, right = 14, bottom = 28;
	var pw = w - left - right, ph = h - top - bottom;
	var all = [];
	series.forEach(function(ser) {
		chart_series_values(ser).forEach(function(v) {
			if (typeof v == "number" && isFinite(v)) all.push(v);
		});
	});
	var max = Math.max.apply(Math, all.concat([0])), min = Math.min.apply(Math, all.concat([0]));
	if (min > 0) min = 0;
	if (max == min) max = min + 1;
	out.push("<line x1=\"" + left + "\" y1=\"" + (top + ph) + "\" x2=\"" + (left + pw) + "\" y2=\"" + (top + ph) + "\" stroke=\"#444\"/>");
	out.push("<line x1=\"" + left + "\" y1=\"" + top + "\" x2=\"" + left + "\" y2=\"" + (top + ph) + "\" stroke=\"#444\"/>");
	if (type == "pie" || type == "doughnut") {
		var vals = chart_series_values(series[0] || {});
		var total = vals.reduce(function(a, b) {
			return a + (typeof b == "number" ? Math.max(0, b) : 0);
		}, 0) || 1;
		var cx = w / 2, cy = top + ph / 2, r = Math.max(10, Math.min(pw, ph) / 2 - 8), a0 = -Math.PI / 2;
		vals.forEach(function(v, i) {
			var a1 = a0 + Math.max(0, +v || 0) / total * Math.PI * 2;
			var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
			var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
			var large = a1 - a0 > Math.PI ? 1 : 0;
			out.push("<path d=\"M" + cx + "," + cy + " L" + x0 + "," + y0 + " A" + r + "," + r + " 0 " + large + ",1 " + x1 + "," + y1 + " Z\" fill=\"" + colors[i % colors.length] + "\"/>");
			a0 = a1;
		});
		if (type == "doughnut") out.push("<circle cx=\"" + cx + "\" cy=\"" + cy + "\" r=\"" + r * .45 + "\" fill=\"#fff\"/>");
		out.push("</svg>");
		return out.join("");
	}
	var count = 0;
	series.forEach(function(ser) {
		count = Math.max(count, chart_series_values(ser).length);
	});
	if (!count) {
		out.push("</svg>");
		return out.join("");
	}
	var xstep = pw / count;
	series.forEach(function(ser, si) {
		var vals = chart_series_values(ser), color = colors[si % colors.length];
		if (type == "line" || type == "scatter" || type == "area") {
			var pts = [];
			vals.forEach(function(v, i) {
				if (typeof v != "number" || !isFinite(v)) return;
				var x = left + xstep * (i + .5);
				var y = top + ph - (v - min) / (max - min) * ph;
				pts.push([x, y]);
			});
			if (type == "area" && pts.length) out.push("<polygon points=\"" + [[pts[0][0], top + ph]].concat(pts).concat([[pts[pts.length - 1][0], top + ph]]).map(function(p) {
				return p[0] + "," + p[1];
			}).join(" ") + "\" fill=\"" + color + "\" opacity=\"0.35\"/>");
			if (pts.length) out.push("<polyline points=\"" + pts.map(function(p) {
				return p[0] + "," + p[1];
			}).join(" ") + "\" fill=\"none\" stroke=\"" + color + "\" stroke-width=\"2\"/>");
			pts.forEach(function(p) {
				out.push("<circle cx=\"" + p[0] + "\" cy=\"" + p[1] + "\" r=\"2.5\" fill=\"" + color + "\"/>");
			});
		} else {
			var bw = Math.max(1, xstep / Math.max(series.length, 1) * .72);
			vals.forEach(function(v, i) {
				if (typeof v != "number" || !isFinite(v)) return;
				var x = left + xstep * i + (xstep - bw * series.length) / 2 + bw * si;
				var y = top + ph - (v - min) / (max - min) * ph;
				var y0 = top + ph - (0 - min) / (max - min) * ph;
				out.push("<rect x=\"" + x + "\" y=\"" + Math.min(y, y0) + "\" width=\"" + bw + "\" height=\"" + Math.max(1, Math.abs(y0 - y)) + "\" fill=\"" + color + "\"/>");
			});
		}
		if (ser.name) out.push("<text x=\"" + (left + 8) + "\" y=\"" + (top + 14 + si * 14) + "\" font-family=\"Arial\" font-size=\"11\" fill=\"" + color + "\">" + escapehtml(ser.name) + "</text>");
	});
	var labels = chart_series_labels(series[0] || {});
	labels.slice(0, Math.min(labels.length, count)).forEach(function(lbl, i) {
		if (i % Math.ceil(count / 8) != 0) return;
		out.push("<text x=\"" + (left + xstep * (i + .5)) + "\" y=\"" + (top + ph + 16) + "\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"10\">" + escapehtml(String(lbl)) + "</text>");
	});
	out.push("</svg>");
	return out.join("");
}
function render_html_drawings(ws, opts) {
	var out = [], drawings = ws["!drawings"] || {}, charts = ws["!charts"] || [];
	if (opts && opts.drawings && drawings.images) drawings.images.forEach(function(img) {
		if (!img || !img.dataURI) return;
		var src = safe_html_image_src(img.dataURI);
		if (!src) return;
		var pos = html_anchor_pos(ws, img.anchor, opts);
		out.push("<img class=\"sjs-drawing-image\" src=\"" + html_attr_escape(src) + "\" style=\"" + html_abs_style(pos) + "\"/>");
	});
	if (opts && opts.charts) charts.forEach(function(chart) {
		var pos = html_anchor_pos(ws, chart.anchor, opts);
		out.push("<div class=\"sjs-chart\" style=\"" + html_abs_style(pos) + "\">" + render_chart_svg(chart, pos.width, pos.height) + "</div>");
	});
	if (!out.length) return "";
	return "<div class=\"sjs-drawing-layer\" style=\"position:absolute;left:0;top:0;pointer-events:none\">" + out.join("") + "</div>";
}
function make_html_preamble(ws, R, o) {
	var out = [];
	var tattr = {}, tstyle = [];
	if (o && o.id) tattr.id = o.id;
	if (o && (o.browserPixels || o.autoFit)) tstyle.push("border-collapse:collapse;table-layout:fixed");
	if (tstyle.length) tattr.style = tstyle.join(";");
	var table = html_writextag("table", "", tattr).replace(/<\/table>$/, "");
	var cols = o && o._htmlCols || ws["!cols"];
	if (o && (o.browserPixels || o.autoFit) && cols) {
		out.push("<colgroup>");
		for (var C = R.s.c; C <= R.e.c; ++C) {
			var col = cols[C], style = [];
			style.push("width:" + html_col_width(col) + "px");
			if (col && col.hidden) style.push("display:none");
			out.push(html_writextag("col", null, { style: style.join(";") }));
		}
		out.push("</colgroup>");
	}
	return table + out.join("");
}
function sheet_to_html(ws, opts) {
	var o = {};
	if (opts) {
		for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
	}
	if (o.autoFit) {
		var af = { set: false };
		if (typeof o.autoFit == "object") {
			for (k in o.autoFit) if (Object.prototype.hasOwnProperty.call(o.autoFit, k)) af[k] = o.autoFit[k];
		}
		if (o.measureText && af.measureText == null) af.measureText = o.measureText;
		if (o.canvas && af.canvas == null) af.canvas = o.canvas;
		o._htmlCols = auto_fit_columns(ws, af);
		if (o.browserPixels == null) o.browserPixels = true;
	}
	var header = o.header != null ? o.header : HTML_BEGIN;
	var footer = o.footer != null ? o.footer : HTML_END;
	var out = [header];
	var r = decode_range(ws["!ref"] || "A1");
	var draw = o.charts && ws["!charts"] && ws["!charts"].length || o.drawings && ws["!drawings"];
	if (draw) out.push("<div class=\"sjs-sheet\" style=\"position:relative;display:inline-block\">");
	out.push(make_html_preamble(ws, r, o));
	if (ws["!ref"]) for (var R = r.s.r; R <= r.e.r; ++R) out.push(make_html_row(ws, r, R, o));
	if (draw) {
		out.push("</table>");
		out.push(render_html_drawings(ws, o));
		out.push("</div>");
		out.push(footer);
	} else out.push("</table>" + footer);
	return out.join("");
}
function sheet_add_dom(ws, table, _opts) {
	var opts = _opts || {};
	var dense = ws["!data"] != null;
	var or_R = 0, or_C = 0;
	if (opts.origin != null) if (typeof opts.origin == "number") or_R = opts.origin;
	else {
		var _origin = typeof opts.origin == "string" ? decode_cell(opts.origin) : opts.origin;
		or_R = _origin.r;
		or_C = _origin.c;
	}
	var range = {
		s: {
			r: 0,
			c: 0
		},
		e: {
			r: or_R,
			c: or_C
		}
	};
	if (ws["!ref"]) {
		var _range = decode_range(ws["!ref"]);
		range.s.r = Math.min(range.s.r, _range.s.r);
		range.s.c = Math.min(range.s.c, _range.s.c);
		range.e.r = Math.max(range.e.r, _range.e.r);
		range.e.c = Math.max(range.e.c, _range.e.c);
		if (or_R == -1) range.e.r = or_R = _range.e.r + 1;
	}
	var rows = table.rows;
	if (!rows) throw "Unsupported origin when " + table.tagName + " is not a TABLE";
	var sheetRows = Math.min(opts.sheetRows || 1e7, rows.length);
	var merges = [], midx = 0;
	var rowinfo = ws["!rows"] || (ws["!rows"] = []);
	var _R = 0, R = 0, _C = 0, C = 0, RS = 0, CS = 0;
	if (!ws["!cols"]) ws["!cols"] = [];
	for (; _R < rows.length && R < sheetRows; ++_R) {
		var row = rows[_R];
		if (is_dom_element_hidden(row)) {
			if (opts.display) continue;
			rowinfo[R] = { hidden: true };
		}
		var elts = row.cells;
		for (_C = C = 0; _C < elts.length; ++_C) {
			var elt = elts[_C];
			if (opts.display && is_dom_element_hidden(elt)) continue;
			var v = elt.hasAttribute("data-v") ? elt.getAttribute("data-v") : elt.hasAttribute("v") ? elt.getAttribute("v") : htmldecode(elt.innerHTML);
			var z = elt.getAttribute("data-z") || elt.getAttribute("z");
			var f = elt.hasAttribute("data-f") ? elt.getAttribute("data-f") : elt.hasAttribute("f") ? elt.getAttribute("f") : null;
			for (midx = 0; midx < merges.length; ++midx) {
				var m = merges[midx];
				if (m.s.c == C + or_C && m.s.r < R + or_R && R + or_R <= m.e.r) {
					C = m.e.c + 1 - or_C;
					midx = -1;
				}
			}
			CS = +elt.getAttribute("colspan") || 1;
			if ((RS = +elt.getAttribute("rowspan") || 1) > 1 || CS > 1) merges.push({
				s: {
					r: R + or_R,
					c: C + or_C
				},
				e: {
					r: R + or_R + (RS || 1) - 1,
					c: C + or_C + (CS || 1) - 1
				}
			});
			var o = {
				t: "s",
				v
			};
			var _t = elt.getAttribute("data-t") || elt.getAttribute("t") || "";
			if (v != null) {
				if (v.length == 0) o.t = _t || "z";
				else if (opts.raw || v.trim().length == 0 || _t == "s") {} else if (_t == "e" && BErr[+v]) o = {
					t: "e",
					v: +v,
					w: BErr[+v]
				};
				else if (v === "TRUE") o = {
					t: "b",
					v: true
				};
				else if (v === "FALSE") o = {
					t: "b",
					v: false
				};
				else if (!isNaN(fuzzynum(v))) o = {
					t: "n",
					v: fuzzynum(v)
				};
				else if (!isNaN(fuzzydate(v).getDate())) {
					o = {
						t: "d",
						v: parseDate(v)
					};
					if (opts.UTC) o.v = local_to_utc(o.v);
					if (!opts.cellDates) o = {
						t: "n",
						v: datenum(o.v)
					};
					o.z = opts.dateNF || table_fmt[14];
				} else if (v.charCodeAt(0) == 35 && RBErr[v] != null) o = {
					t: "e",
					v: RBErr[v],
					w: v
				};
			}
			if (o.z === void 0 && z != null) o.z = z;
			var l = "", Aelts = elt.getElementsByTagName("A");
			if (Aelts && Aelts.length) {
				for (var Aelti = 0; Aelti < Aelts.length; ++Aelti) if (Aelts[Aelti].hasAttribute("href")) {
					l = Aelts[Aelti].getAttribute("href");
					if (l.charAt(0) != "#") break;
				}
			}
			if (l && l.charAt(0) != "#" && l.slice(0, 11).toLowerCase() != "javascript:") o.l = { Target: l };
			if (f != null) o.f = f;
			if (dense) {
				if (!ws["!data"][R + or_R]) ws["!data"][R + or_R] = [];
				ws["!data"][R + or_R][C + or_C] = o;
			} else ws[encode_cell({
				c: C + or_C,
				r: R + or_R
			})] = o;
			if (range.e.c < C + or_C) range.e.c = C + or_C;
			C += CS;
		}
		++R;
	}
	if (merges.length) ws["!merges"] = (ws["!merges"] || []).concat(merges);
	range.e.r = Math.max(range.e.r, R - 1 + or_R);
	ws["!ref"] = encode_range(range);
	if (R >= sheetRows) ws["!fullref"] = encode_range((range.e.r = rows.length - _R + R - 1 + or_R, range));
	return ws;
}
function parse_dom_table(table, _opts) {
	var opts = _opts || {};
	var ws = {};
	if (opts.dense) ws["!data"] = [];
	return sheet_add_dom(ws, table, _opts);
}
function table_to_book(table, opts) {
	return sheet_to_workbook(parse_dom_table(table, opts), opts);
}
function is_dom_element_hidden(element) {
	var display = "";
	var get_computed_style = get_get_computed_style_function(element);
	if (get_computed_style) display = get_computed_style(element).getPropertyValue("display");
	if (!display) display = element.style && element.style.display;
	return display === "none";
}
function get_get_computed_style_function(element) {
	if (element.ownerDocument.defaultView && typeof element.ownerDocument.defaultView.getComputedStyle === "function") return element.ownerDocument.defaultView.getComputedStyle;
	if (typeof getComputedStyle === "function") return getComputedStyle;
	return null;
}
function parse_text_p(text) {
	return [unescapexml(strip_xml_tags(text.replace(/[\t\r\n]/g, " ").trim().replace(/ +/g, " ").replace(/<text:s\/>/g, " ").replace(/<text:s text:c="(\d+)"\/>/g, function($$, $1) {
		return Array(parseInt($1, 10) + 1).join(" ");
	}).replace(/<text:tab[^<>]*\/>/g, "	").replace(/<text:line-break\/>/g, "\n")))];
}
function parse_ods_styles(d, _opts, _nfm) {
	var number_format_map = _nfm || {};
	var str = xlml_normalize(d);
	xlmlregex.lastIndex = 0;
	str = remove_doctype(str_remove_ng(str, "<!--", "-->"));
	var Rn, NFtag, NF = "", tNF = "", y, etpos = 0, tidx = -1, payload = "";
	while (Rn = xlmlregex.exec(str)) switch (Rn[3] = Rn[3].replace(/_[\s\S]*$/, "")) {
		case "number-style":
		case "currency-style":
		case "percentage-style":
		case "date-style":
		case "time-style":
		case "text-style":
			if (Rn[1] === "/") {
				if (NFtag["truncate-on-overflow"] == "false") {
					if (NF.match(/h/)) NF = NF.replace(/h+/, "[$&]");
					else if (NF.match(/m/)) NF = NF.replace(/m+/, "[$&]");
					else if (NF.match(/s/)) NF = NF.replace(/s+/, "[$&]");
				}
				number_format_map[NFtag.name] = NF;
				NF = "";
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") {
				NF = "";
				NFtag = parsexmltag(Rn[0], false);
			}
			break;
		case "boolean-style":
			if (Rn[1] === "/") {
				number_format_map[NFtag.name] = "General";
				NF = "";
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") {
				NF = "";
				NFtag = parsexmltag(Rn[0], false);
			}
			break;
		case "boolean":
			NF += "General";
			break;
		case "text":
			if (Rn[1] === "/") {
				payload = str.slice(tidx, xlmlregex.lastIndex - Rn[0].length);
				if (payload == "%" && NFtag[0] == "<number:percentage-style") NF += "%";
				else NF += "\"" + payload.replace(/"/g, "\"\"") + "\"";
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") tidx = xlmlregex.lastIndex;
			break;
		case "day":
			y = parsexmltag(Rn[0], false);
			switch (y["style"]) {
				case "short":
					NF += "d";
					break;
				case "long":
					NF += "dd";
					break;
				default: NF += "dd";
			}
			break;
		case "day-of-week":
			y = parsexmltag(Rn[0], false);
			switch (y["style"]) {
				case "short":
					NF += "ddd";
					break;
				case "long":
					NF += "dddd";
					break;
				default: NF += "ddd";
			}
			break;
		case "era":
			y = parsexmltag(Rn[0], false);
			switch (y["style"]) {
				case "short":
					NF += "ee";
					break;
				case "long":
					NF += "eeee";
					break;
				default: NF += "eeee";
			}
			break;
		case "hours":
			y = parsexmltag(Rn[0], false);
			switch (y["style"]) {
				case "short":
					NF += "h";
					break;
				case "long":
					NF += "hh";
					break;
				default: NF += "hh";
			}
			break;
		case "minutes":
			y = parsexmltag(Rn[0], false);
			switch (y["style"]) {
				case "short":
					NF += "m";
					break;
				case "long":
					NF += "mm";
					break;
				default: NF += "mm";
			}
			break;
		case "month":
			y = parsexmltag(Rn[0], false);
			if (y["textual"]) NF += "mm";
			switch (y["style"]) {
				case "short":
					NF += "m";
					break;
				case "long":
					NF += "mm";
					break;
				default: NF += "m";
			}
			break;
		case "seconds":
			y = parsexmltag(Rn[0], false);
			switch (y["style"]) {
				case "short":
					NF += "s";
					break;
				case "long":
					NF += "ss";
					break;
				default: NF += "ss";
			}
			if (y["decimal-places"]) NF += "." + fill("0", +y["decimal-places"]);
			break;
		case "year":
			y = parsexmltag(Rn[0], false);
			switch (y["style"]) {
				case "short":
					NF += "yy";
					break;
				case "long":
					NF += "yyyy";
					break;
				default: NF += "yy";
			}
			break;
		case "am-pm":
			NF += "AM/PM";
			break;
		case "week-of-year":
		case "quarter":
			console.error("Excel does not support ODS format token " + Rn[3]);
			break;
		case "fill-character":
			if (Rn[1] === "/") {
				payload = str.slice(tidx, xlmlregex.lastIndex - Rn[0].length);
				NF += "\"" + payload.replace(/"/g, "\"\"") + "\"*";
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") tidx = xlmlregex.lastIndex;
			break;
		case "scientific-number":
			y = parsexmltag(Rn[0], false);
			NF += "0." + fill("0", +y["min-decimal-places"] || +y["decimal-places"] || 2) + fill("?", +y["decimal-places"] - +y["min-decimal-places"] || 0) + "E" + (parsexmlbool(y["forced-exponent-sign"]) ? "+" : "") + fill("0", +y["min-exponent-digits"] || 2);
			break;
		case "fraction":
			y = parsexmltag(Rn[0], false);
			if (!+y["min-integer-digits"]) NF += "#";
			else NF += fill("0", +y["min-integer-digits"]);
			NF += " ";
			NF += fill("?", +y["min-numerator-digits"] || 1);
			NF += "/";
			if (+y["denominator-value"]) NF += y["denominator-value"];
			else NF += fill("?", +y["min-denominator-digits"] || 1);
			break;
		case "currency-symbol":
			if (Rn[1] === "/") NF += "\"" + str.slice(tidx, xlmlregex.lastIndex - Rn[0].length).replace(/"/g, "\"\"") + "\"";
			else if (Rn[0].charAt(Rn[0].length - 2) !== "/") tidx = xlmlregex.lastIndex;
			else NF += "$";
			break;
		case "text-properties":
			y = parsexmltag(Rn[0], false);
			switch ((y["color"] || "").toLowerCase().replace("#", "")) {
				case "ff0000":
				case "red": NF = "[Red]" + NF;
			}
			break;
		case "text-content":
			NF += "@";
			break;
		case "map":
			y = parsexmltag(Rn[0], false);
			if (unescapexml(y["condition"]) == "value()>=0") NF = number_format_map[y["apply-style-name"]] + ";" + NF;
			else if (_opts && _opts.WTF) console.error("ODS number format may be incorrect: " + y["condition"]);
			break;
		case "number":
			if (Rn[1] === "/") break;
			y = parsexmltag(Rn[0], false);
			tNF = "";
			tNF += fill("0", +y["min-integer-digits"] || 1);
			if (parsexmlbool(y["grouping"])) tNF = commaify(fill("#", Math.max(0, 4 - tNF.length)) + tNF);
			if (+y["min-decimal-places"] || +y["decimal-places"]) tNF += ".";
			if (+y["min-decimal-places"]) tNF += fill("0", +y["min-decimal-places"] || 1);
			if (+y["decimal-places"] - (+y["min-decimal-places"] || 0)) tNF += fill("0", +y["decimal-places"] - (+y["min-decimal-places"] || 0));
			NF += tNF;
			break;
		case "embedded-text": if (Rn[1] === "/") if (etpos == 0) NF += "\"" + str.slice(tidx, xlmlregex.lastIndex - Rn[0].length).replace(/"/g, "\"\"") + "\"";
		else NF = NF.slice(0, etpos) + "\"" + str.slice(tidx, xlmlregex.lastIndex - Rn[0].length).replace(/"/g, "\"\"") + "\"" + NF.slice(etpos);
		else if (Rn[0].charAt(Rn[0].length - 2) !== "/") {
			tidx = xlmlregex.lastIndex;
			etpos = -+parsexmltag(Rn[0], false)["position"] || 0;
		}
	}
	return number_format_map;
}
function parse_content_xml(d, _opts, _nfm) {
	var opts = _opts || {};
	if (DENSE != null && opts.dense == null) opts.dense = DENSE;
	var str = xlml_normalize(d);
	var state = [], tmp;
	var tag;
	var nfidx, NF = "", pidx = 0;
	var sheetag;
	var rowtag;
	var Sheets = sheet_map_new(), SheetNames = [];
	var ws = {};
	if (opts.dense) ws["!data"] = [];
	var Rn, q;
	var ctag = { value: "" }, ctag2 = {};
	var textp = "", textpidx = 0, textptag, oldtextp = "", oldtextpidx = 0;
	var textR = [], oldtextR = [];
	var R = -1, C = -1, range = {
		s: {
			r: 1e6,
			c: 1e7
		},
		e: {
			r: 0,
			c: 0
		}
	};
	var row_ol = 0;
	var number_format_map = _nfm || {}, styles = {}, tstyles = {};
	var merges = [], mrange = {}, mR = 0, mC = 0;
	var rowinfo = [], rowpeat = 1, colpeat = 1;
	var arrayf = [];
	var WB = {
		Names: [],
		WBProps: {},
		Sheets: []
	};
	var atag = {};
	var _Ref = ["", ""];
	var comments = [], comment = {};
	var creator = "", creatoridx = 0;
	var isstub = false, intable = false;
	var i = 0;
	xlmlregex.lastIndex = 0;
	str = remove_doctype(str_remove_ng(str, "<!--", "-->"));
	while (Rn = xlmlregex.exec(str)) switch (Rn[3] = Rn[3].replace(/_[\s\S]*$/, "")) {
		case "table":
		case "工作表":
			if (Rn[1] === "/") {
				if (range.e.c >= range.s.c && range.e.r >= range.s.r) ws["!ref"] = encode_range(range);
				else ws["!ref"] = "A1:A1";
				if (opts.sheetRows > 0 && opts.sheetRows <= range.e.r) {
					ws["!fullref"] = ws["!ref"];
					range.e.r = opts.sheetRows - 1;
					ws["!ref"] = encode_range(range);
				}
				if (merges.length) ws["!merges"] = merges;
				if (rowinfo.length) ws["!rows"] = rowinfo;
				sheetag.name = sheetag["名称"] || sheetag.name;
				if (typeof JSON !== "undefined") JSON.stringify(sheetag);
				SheetNames.push(sheetag.name);
				sheet_map_set(Sheets, sheetag.name, ws);
				WB.Sheets.push({ Hidden: tstyles[sheetag["style-name"]] && tstyles[sheetag["style-name"]]["display"] ? parsexmlbool(tstyles[sheetag["style-name"]]["display"]) ? 0 : 1 : 0 });
				intable = false;
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") {
				sheetag = parsexmltag(Rn[0], false);
				R = C = -1;
				range.s.r = range.s.c = 1e7;
				range.e.r = range.e.c = 0;
				ws = {};
				if (opts.dense) ws["!data"] = [];
				merges = [];
				rowinfo = [];
				intable = true;
			}
			break;
		case "table-row-group":
			if (Rn[1] === "/") --row_ol;
			else ++row_ol;
			break;
		case "table-row":
		case "行":
			if (Rn[1] === "/") {
				R += rowpeat;
				rowpeat = 1;
				break;
			}
			rowtag = parsexmltag(Rn[0], false);
			if (rowtag["行号"]) R = rowtag["行号"] - 1;
			else if (R == -1) R = 0;
			rowpeat = +rowtag["number-rows-repeated"] || 1;
			if (rowpeat < 10) {
				for (i = 0; i < rowpeat; ++i) if (row_ol > 0) rowinfo[R + i] = { level: row_ol };
			}
			C = -1;
			break;
		case "covered-table-cell":
			if (Rn[1] !== "/") {
				++C;
				ctag = parsexmltag(Rn[0], false);
				colpeat = parseInt(ctag["number-columns-repeated"] || "1", 10) || 1;
				if (opts.sheetStubs) {
					while (colpeat-- > 0) {
						if (opts.dense) {
							if (!ws["!data"][R]) ws["!data"][R] = [];
							ws["!data"][R][C] = { t: "z" };
						} else ws[encode_cell({
							r: R,
							c: C
						})] = { t: "z" };
						++C;
					}
					--C;
				} else C += colpeat - 1;
			}
			textp = "";
			textR = [];
			break;
		case "table-cell":
		case "数据":
			if (Rn[0].charAt(Rn[0].length - 2) === "/") {
				++C;
				ctag = parsexmltag(Rn[0], false);
				colpeat = parseInt(ctag["number-columns-repeated"] || "1", 10) || 1;
				q = {
					t: "z",
					v: null
				};
				if (ctag.formula && opts.cellFormula != false) q.f = ods_to_csf_formula(unescapexml(ctag.formula));
				if (ctag["style-name"] && styles[ctag["style-name"]]) q.z = styles[ctag["style-name"]];
				if ((ctag["数据类型"] || ctag["value-type"]) == "string") {
					q.t = "s";
					q.v = unescapexml(ctag["string-value"] || "");
					if (opts.dense) {
						if (!ws["!data"][R]) ws["!data"][R] = [];
						ws["!data"][R][C] = q;
					} else ws[encode_col(C) + encode_row(R)] = q;
				}
				C += colpeat - 1;
			} else if (Rn[1] !== "/") {
				++C;
				textp = oldtextp = "";
				textpidx = oldtextpidx = 0;
				textR = [];
				oldtextR = [];
				colpeat = 1;
				var rptR = rowpeat ? R + rowpeat - 1 : R;
				if (C > range.e.c) range.e.c = C;
				if (C < range.s.c) range.s.c = C;
				if (R < range.s.r) range.s.r = R;
				if (rptR > range.e.r) range.e.r = rptR;
				ctag = parsexmltag(Rn[0], false);
				ctag2 = parsexmltagraw(Rn[0], true);
				comments = [];
				comment = {};
				q = {
					t: ctag["数据类型"] || ctag["value-type"],
					v: null
				};
				if (ctag["style-name"] && styles[ctag["style-name"]]) q.z = styles[ctag["style-name"]];
				if (opts.cellFormula) {
					if (ctag.formula) ctag.formula = unescapexml(ctag.formula);
					if (ctag["number-matrix-columns-spanned"] && ctag["number-matrix-rows-spanned"]) {
						mR = parseInt(ctag["number-matrix-rows-spanned"], 10) || 0;
						mC = parseInt(ctag["number-matrix-columns-spanned"], 10) || 0;
						mrange = {
							s: {
								r: R,
								c: C
							},
							e: {
								r: R + mR - 1,
								c: C + mC - 1
							}
						};
						q.F = encode_range(mrange);
						arrayf.push([mrange, q.F]);
					}
					if (ctag.formula) q.f = ods_to_csf_formula(ctag.formula);
					else for (i = 0; i < arrayf.length; ++i) if (R >= arrayf[i][0].s.r && R <= arrayf[i][0].e.r) {
						if (C >= arrayf[i][0].s.c && C <= arrayf[i][0].e.c) q.F = arrayf[i][1];
					}
				}
				if (ctag["number-columns-spanned"] || ctag["number-rows-spanned"]) {
					mR = parseInt(ctag["number-rows-spanned"] || "1", 10) || 1;
					mC = parseInt(ctag["number-columns-spanned"] || "1", 10) || 1;
					if (mR * mC > 1) {
						mrange = {
							s: {
								r: R,
								c: C
							},
							e: {
								r: R + mR - 1,
								c: C + mC - 1
							}
						};
						merges.push(mrange);
					}
				}
				if (ctag["number-columns-repeated"]) colpeat = parseInt(ctag["number-columns-repeated"], 10);
				switch (q.t) {
					case "boolean":
						q.t = "b";
						q.v = parsexmlbool(ctag["boolean-value"]) || +ctag["boolean-value"] >= 1;
						break;
					case "float":
						q.t = "n";
						q.v = parseFloat(ctag.value);
						if (opts.cellDates && q.z && fmt_is_date(q.z)) {
							q.v = numdate(q.v + (WB.WBProps.date1904 ? 1462 : 0));
							q.t = typeof q.v == "number" ? "n" : "d";
						}
						break;
					case "percentage":
						q.t = "n";
						q.v = parseFloat(ctag.value);
						break;
					case "currency":
						q.t = "n";
						q.v = parseFloat(ctag.value);
						break;
					case "date":
						q.t = "d";
						q.v = parseDate(ctag["date-value"], WB.WBProps.date1904);
						if (!opts.cellDates) {
							q.t = "n";
							q.v = datenum(q.v, WB.WBProps.date1904);
						}
						if (!q.z) q.z = "m/d/yy";
						break;
					case "time":
						q.t = "n";
						q.v = parse_isodur(ctag["time-value"]) / 86400;
						if (opts.cellDates) {
							q.v = numdate(q.v);
							q.t = typeof q.v == "number" ? "n" : "d";
						}
						if (!q.z) q.z = "HH:MM:SS";
						break;
					case "number":
						q.t = "n";
						q.v = parseFloat(ctag["数据数值"]);
						break;
					default: if (q.t === "string" || q.t === "text" || !q.t) {
						q.t = "s";
						if (ctag["string-value"] != null) {
							textp = unescapexml(ctag["string-value"]);
							textR = [];
						}
					} else throw new Error("Unsupported value type " + q.t);
				}
			} else {
				isstub = false;
				if (ctag2["calcext:value-type"] == "error" && RBErr[textp] != null) {
					q.t = "e";
					q.w = textp;
					q.v = RBErr[textp];
				}
				if (q.t === "s") {
					q.v = textp || "";
					if (textR.length) q.R = textR;
					isstub = textpidx == 0;
				}
				if (atag.Target) q.l = atag;
				if (comments.length > 0) {
					q.c = comments;
					comments = [];
				}
				if (textp && opts.cellText !== false) q.w = textp;
				if (isstub) {
					q.t = "z";
					delete q.v;
				}
				if (!isstub || opts.sheetStubs) {
					if (!(opts.sheetRows && opts.sheetRows <= R)) for (var rpt = 0; rpt < rowpeat; ++rpt) {
						colpeat = parseInt(ctag["number-columns-repeated"] || "1", 10);
						if (opts.dense) {
							if (!ws["!data"][R + rpt]) ws["!data"][R + rpt] = [];
							ws["!data"][R + rpt][C] = rpt == 0 ? q : dup(q);
							while (--colpeat > 0) ws["!data"][R + rpt][C + colpeat] = dup(q);
						} else {
							ws[encode_cell({
								r: R + rpt,
								c: C
							})] = q;
							while (--colpeat > 0) ws[encode_cell({
								r: R + rpt,
								c: C + colpeat
							})] = dup(q);
						}
						if (range.e.c <= C) range.e.c = C;
					}
				}
				colpeat = parseInt(ctag["number-columns-repeated"] || "1", 10);
				C += colpeat - 1;
				colpeat = 0;
				q = {};
				textp = "";
				textR = [];
			}
			atag = {};
			break;
		case "document":
		case "document-content":
		case "电子表格文档":
		case "spreadsheet":
		case "主体":
		case "scripts":
		case "styles":
		case "font-face-decls":
		case "master-styles":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw "Bad state: " + tmp;
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") state.push([Rn[3], true]);
			break;
		case "annotation":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw "Bad state: " + tmp;
				comment.t = textp;
				if (textR.length) comment.R = textR;
				comment.a = creator;
				comments.push(comment);
				textp = oldtextp;
				textpidx = oldtextpidx;
				textR = oldtextR;
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") {
				state.push([Rn[3], false]);
				var annotag = parsexmltag(Rn[0], true);
				if (!(annotag["display"] && parsexmlbool(annotag["display"]))) comments.hidden = true;
				oldtextp = textp;
				oldtextpidx = textpidx;
				oldtextR = textR;
				textp = "";
				textpidx = 0;
				textR = [];
			}
			creator = "";
			creatoridx = 0;
			break;
		case "creator":
			if (Rn[1] === "/") creator = str.slice(creatoridx, Rn.index);
			else creatoridx = Rn.index + Rn[0].length;
			break;
		case "meta":
		case "元数据":
		case "settings":
		case "config-item-set":
		case "config-item-map-indexed":
		case "config-item-map-entry":
		case "config-item-map-named":
		case "shapes":
		case "frame":
		case "text-box":
		case "image":
		case "data-pilot-tables":
		case "list-style":
		case "form":
		case "dde-links":
		case "event-listeners":
		case "chart":
			if (Rn[1] === "/") {
				if ((tmp = state.pop())[0] !== Rn[3]) throw "Bad state: " + tmp;
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") state.push([Rn[3], false]);
			textp = "";
			textpidx = 0;
			textR = [];
			break;
		case "scientific-number":
		case "currency-symbol":
		case "fill-character": break;
		case "text-style":
		case "boolean-style":
		case "number-style":
		case "currency-style":
		case "percentage-style":
		case "date-style":
		case "time-style":
			if (Rn[1] === "/") {
				var xlmlidx = xlmlregex.lastIndex;
				parse_ods_styles(str.slice(nfidx, xlmlregex.lastIndex), _opts, number_format_map);
				xlmlregex.lastIndex = xlmlidx;
			} else if (Rn[0].charAt(Rn[0].length - 2) !== "/") nfidx = xlmlregex.lastIndex - Rn[0].length;
			break;
		case "script": break;
		case "libraries": break;
		case "automatic-styles": break;
		case "default-style":
		case "page-layout": break;
		case "style":
			var styletag = parsexmltag(Rn[0], false);
			if (styletag["family"] == "table-cell" && number_format_map[styletag["data-style-name"]]) styles[styletag["name"]] = number_format_map[styletag["data-style-name"]];
			else if (styletag["family"] == "table") tstyles[styletag["name"]] = styletag;
			break;
		case "map": break;
		case "font-face": break;
		case "paragraph-properties": break;
		case "table-properties":
			var proptag = parsexmltag(Rn[0], false);
			if (styletag && styletag.family == "table") styletag.display = proptag.display;
			break;
		case "table-column-properties": break;
		case "table-row-properties": break;
		case "table-cell-properties": break;
		case "number": break;
		case "fraction": break;
		case "day":
		case "month":
		case "year":
		case "era":
		case "day-of-week":
		case "week-of-year":
		case "quarter":
		case "hours":
		case "minutes":
		case "seconds":
		case "am-pm": break;
		case "boolean": break;
		case "text":
			if (Rn[0].slice(-2) === "/>") break;
			else if (Rn[1] === "/") switch (state[state.length - 1][0]) {
				case "number-style":
				case "date-style":
				case "time-style":
					NF += str.slice(pidx, Rn.index);
					break;
			}
			else pidx = Rn.index + Rn[0].length;
			break;
		case "named-range":
			tag = parsexmltag(Rn[0], false);
			_Ref = ods_to_csf_3D(tag["cell-range-address"]);
			var nrange = {
				Name: tag.name,
				Ref: _Ref[0] + "!" + _Ref[1]
			};
			if (intable) nrange.Sheet = SheetNames.length;
			WB.Names.push(nrange);
			break;
		case "text-content": break;
		case "text-properties": break;
		case "embedded-text": break;
		case "body":
		case "电子表格": break;
		case "forms": break;
		case "table-column": break;
		case "table-header-rows": break;
		case "table-rows": break;
		case "table-column-group": break;
		case "table-header-columns": break;
		case "table-columns": break;
		case "null-date":
			tag = parsexmltag(Rn[0], false);
			switch (tag["date-value"]) {
				case "1904-01-01": WB.WBProps.date1904 = true;
			}
			break;
		case "graphic-properties": break;
		case "calculation-settings": break;
		case "named-expressions": break;
		case "label-range": break;
		case "label-ranges": break;
		case "named-expression": break;
		case "sort": break;
		case "sort-by": break;
		case "sort-groups": break;
		case "tab": break;
		case "line-break": break;
		case "span": break;
		case "p":
		case "文本串":
			if (["master-styles"].indexOf(state[state.length - 1][0]) > -1) break;
			if (Rn[1] === "/" && (!ctag || !ctag["string-value"])) {
				var ptp = parse_text_p(str.slice(textpidx, Rn.index), textptag);
				textp = (textp.length > 0 ? textp + "\n" : "") + ptp[0];
			} else if (Rn[0].slice(-2) == "/>") textp += "\n";
			else {
				textptag = parsexmltag(Rn[0], false);
				textpidx = Rn.index + Rn[0].length;
			}
			break;
		case "s": break;
		case "database-range":
			if (Rn[1] === "/") break;
			try {
				_Ref = ods_to_csf_3D(parsexmltag(Rn[0])["target-range-address"]);
				if (Object.prototype.hasOwnProperty.call(Sheets, _Ref[0]) && Sheets[_Ref[0]]) Sheets[_Ref[0]]["!autofilter"] = { ref: _Ref[1] };
			} catch (e) {}
			break;
		case "date": break;
		case "object": break;
		case "title":
		case "标题": break;
		case "desc": break;
		case "binary-data": break;
		case "table-source": break;
		case "scenario": break;
		case "iteration": break;
		case "content-validations": break;
		case "content-validation": break;
		case "help-message": break;
		case "error-message": break;
		case "database-ranges": break;
		case "filter": break;
		case "filter-and": break;
		case "filter-or": break;
		case "filter-condition": break;
		case "filter-set-item": break;
		case "list-level-style-bullet": break;
		case "list-level-style-number": break;
		case "list-level-properties": break;
		case "sender-firstname":
		case "sender-lastname":
		case "sender-initials":
		case "sender-title":
		case "sender-position":
		case "sender-email":
		case "sender-phone-private":
		case "sender-fax":
		case "sender-company":
		case "sender-phone-work":
		case "sender-street":
		case "sender-city":
		case "sender-postal-code":
		case "sender-country":
		case "sender-state-or-province":
		case "author-name":
		case "author-initials":
		case "chapter":
		case "file-name":
		case "template-name":
		case "sheet-name": break;
		case "event-listener": break;
		case "initial-creator":
		case "creation-date":
		case "print-date":
		case "generator":
		case "document-statistic":
		case "user-defined":
		case "editing-duration":
		case "editing-cycles": break;
		case "config-item": break;
		case "page-number": break;
		case "page-count": break;
		case "time": break;
		case "cell-range-source": break;
		case "detective": break;
		case "operation": break;
		case "highlighted-range": break;
		case "data-pilot-table":
		case "source-cell-range":
		case "source-service":
		case "data-pilot-field":
		case "data-pilot-level":
		case "data-pilot-subtotals":
		case "data-pilot-subtotal":
		case "data-pilot-members":
		case "data-pilot-member":
		case "data-pilot-display-info":
		case "data-pilot-sort-info":
		case "data-pilot-layout-info":
		case "data-pilot-field-reference":
		case "data-pilot-groups":
		case "data-pilot-group":
		case "data-pilot-group-member": break;
		case "rect": break;
		case "dde-connection-decls":
		case "dde-connection-decl":
		case "dde-link":
		case "dde-source": break;
		case "properties": break;
		case "property": break;
		case "a":
			if (Rn[1] !== "/") {
				atag = parsexmltag(Rn[0], false);
				if (!atag.href) break;
				atag.Target = unescapexml(atag.href);
				delete atag.href;
				if (atag.Target.charAt(0) == "#" && atag.Target.indexOf(".") > -1) {
					_Ref = ods_to_csf_3D(atag.Target.slice(1));
					atag.Target = "#" + _Ref[0] + "!" + _Ref[1];
				} else if (atag.Target.match(/^\.\.[\\\/]/)) atag.Target = atag.Target.slice(3);
				if (atag.title) {
					atag.Tooltip = unescapexml(atag.title);
					delete atag.title;
				}
			}
			break;
		case "table-protection": break;
		case "data-pilot-grand-total": break;
		case "office-document-common-attrs": break;
		default: switch (Rn[2]) {
			case "dc:":
			case "calcext:":
			case "loext:":
			case "ooo:":
			case "chartooo:":
			case "draw:":
			case "style:":
			case "chart:":
			case "form:":
			case "uof:":
			case "表:":
			case "字:": break;
			default: if (opts.WTF) throw new Error(Rn);
		}
	}
	var out = {
		Sheets,
		SheetNames,
		Workbook: WB
	};
	if (opts.bookSheets) delete out.Sheets;
	return out;
}
function parse_ods(zip, opts) {
	opts = opts || {};
	if (safegetzipfile(zip, "META-INF/manifest.xml")) parse_manifest(getzipdata(zip, "META-INF/manifest.xml"), opts);
	var styles = getzipstr(zip, "styles.xml");
	var Styles = styles && parse_ods_styles(utf8read(styles), opts);
	var content = getzipstr(zip, "content.xml");
	if (!content) throw new Error("Missing content.xml in ODS / UOF file");
	var wb = parse_content_xml(utf8read(content), opts, Styles);
	if (safegetzipfile(zip, "meta.xml")) wb.Props = parse_core_props(getzipdata(zip, "meta.xml"));
	wb.bookType = "ods";
	return wb;
}
function parse_fods(data, opts) {
	var wb = parse_content_xml(data, opts);
	wb.bookType = "fods";
	return wb;
}
/*! sheetjs (C) 2013-present SheetJS -- http://sheetjs.com */
var subarray = function() {
	try {
		if (typeof Uint8Array == "undefined") return "slice";
		if (typeof Uint8Array.prototype.subarray == "undefined") return "slice";
		if (typeof Buffer !== "undefined") {
			if (typeof Buffer.prototype.subarray == "undefined") return "slice";
			if ((typeof Buffer.from == "function" ? Buffer.from([72, 62]) : new Buffer([72, 62])) instanceof Uint8Array) return "subarray";
			return "slice";
		}
		return "subarray";
	} catch (e) {
		return "slice";
	}
}();
function u8_to_dataview(array) {
	return new DataView(array.buffer, array.byteOffset, array.byteLength);
}
function u8str(u8) {
	return typeof TextDecoder != "undefined" ? new TextDecoder().decode(u8) : utf8read(a2s(u8));
}
function u8concat(u8a) {
	var len = 0;
	for (var i = 0; i < u8a.length; ++i) len += u8a[i].length;
	var out = new Uint8Array(len);
	var off = 0;
	for (i = 0; i < u8a.length; ++i) {
		var u8 = u8a[i], L = u8.length;
		if (L < 250) for (var j = 0; j < L; ++j) out[off++] = u8[j];
		else {
			out.set(u8, off);
			off += L;
		}
	}
	return out;
}
function popcnt(x) {
	x -= x >> 1 & 1431655765;
	x = (x & 858993459) + (x >> 2 & 858993459);
	return (x + (x >> 4) & 252645135) * 16843009 >>> 24;
}
function readDecimal128LE(buf, offset) {
	var exp = (buf[offset + 15] & 127) << 7 | buf[offset + 14] >> 1;
	var mantissa = buf[offset + 14] & 1;
	for (var j = offset + 13; j >= offset; --j) mantissa = mantissa * 256 + buf[j];
	return (buf[offset + 15] & 128 ? -mantissa : mantissa) * Math.pow(10, exp - 6176);
}
function parse_varint49(buf, ptr) {
	var l = ptr.l;
	var usz = buf[l] & 127;
	varint: if (buf[l++] >= 128) {
		usz |= (buf[l] & 127) << 7;
		if (buf[l++] < 128) break varint;
		usz |= (buf[l] & 127) << 14;
		if (buf[l++] < 128) break varint;
		usz |= (buf[l] & 127) << 21;
		if (buf[l++] < 128) break varint;
		usz += (buf[l] & 127) * Math.pow(2, 28);
		++l;
		if (buf[l++] < 128) break varint;
		usz += (buf[l] & 127) * Math.pow(2, 35);
		++l;
		if (buf[l++] < 128) break varint;
		usz += (buf[l] & 127) * Math.pow(2, 42);
		++l;
		if (buf[l++] < 128) break varint;
	}
	ptr.l = l;
	return usz;
}
function varint_to_i32(buf) {
	var l = 0, i32 = buf[l] & 127;
	if (buf[l++] < 128) return i32;
	i32 |= (buf[l] & 127) << 7;
	if (buf[l++] < 128) return i32;
	i32 |= (buf[l] & 127) << 14;
	if (buf[l++] < 128) return i32;
	i32 |= (buf[l] & 127) << 21;
	if (buf[l++] < 128) return i32;
	i32 |= (buf[l] & 15) << 28;
	return i32;
}
function parse_shallow(buf) {
	var out = [], ptr = { l: 0 };
	while (ptr.l < buf.length) {
		var off = ptr.l;
		var num = parse_varint49(buf, ptr);
		var type = num & 7;
		num = num / 8 | 0;
		var data;
		var l = ptr.l;
		switch (type) {
			case 0:
				while (buf[l++] >= 128);
				data = buf[subarray](ptr.l, l);
				ptr.l = l;
				break;
			case 1:
				data = buf[subarray](l, l + 8);
				ptr.l = l + 8;
				break;
			case 2:
				var len = parse_varint49(buf, ptr);
				data = buf[subarray](ptr.l, ptr.l + len);
				ptr.l += len;
				break;
			case 5:
				data = buf[subarray](l, l + 4);
				ptr.l = l + 4;
				break;
			default: throw new Error("PB Type ".concat(type, " for Field ").concat(num, " at offset ").concat(off));
		}
		var v = {
			data,
			type
		};
		if (out[num] == null) out[num] = [];
		out[num].push(v);
	}
	return out;
}
function mappa(data, cb) {
	return (data == null ? void 0 : data.map(function(d) {
		return cb(d.data);
	})) || [];
}
function parse_iwa_file(buf) {
	var _a;
	var out = [], ptr = { l: 0 };
	while (ptr.l < buf.length) {
		var len = parse_varint49(buf, ptr);
		var ai = parse_shallow(buf[subarray](ptr.l, ptr.l + len));
		ptr.l += len;
		var res = {
			id: varint_to_i32(ai[1][0].data),
			messages: []
		};
		ai[2].forEach(function(b) {
			var mi = parse_shallow(b.data);
			var fl = varint_to_i32(mi[3][0].data);
			res.messages.push({
				meta: mi,
				data: buf[subarray](ptr.l, ptr.l + fl)
			});
			ptr.l += fl;
		});
		if ((_a = ai[3]) == null ? void 0 : _a[0]) res.merge = varint_to_i32(ai[3][0].data) >>> 0 > 0;
		out.push(res);
	}
	return out;
}
function parse_snappy_chunk(type, buf) {
	if (type != 0) throw new Error("Unexpected Snappy chunk type ".concat(type));
	var ptr = { l: 0 };
	var usz = parse_varint49(buf, ptr);
	var chunks = [];
	var l = ptr.l;
	while (l < buf.length) {
		var tag = buf[l] & 3;
		if (tag == 0) {
			var len = buf[l++] >> 2;
			if (len < 60) ++len;
			else {
				var c = len - 59;
				len = buf[l];
				if (c > 1) len |= buf[l + 1] << 8;
				if (c > 2) len |= buf[l + 2] << 16;
				if (c > 3) len |= buf[l + 3] << 24;
				len >>>= 0;
				len++;
				l += c;
			}
			chunks.push(buf[subarray](l, l + len));
			l += len;
			continue;
		} else {
			var offset = 0, length = 0;
			if (tag == 1) {
				length = (buf[l] >> 2 & 7) + 4;
				offset = (buf[l++] & 224) << 3;
				offset |= buf[l++];
			} else {
				length = (buf[l++] >> 2) + 1;
				if (tag == 2) {
					offset = buf[l] | buf[l + 1] << 8;
					l += 2;
				} else {
					offset = (buf[l] | buf[l + 1] << 8 | buf[l + 2] << 16 | buf[l + 3] << 24) >>> 0;
					l += 4;
				}
			}
			if (offset == 0) throw new Error("Invalid offset 0");
			var j = chunks.length - 1, off = offset;
			while (j >= 0 && off >= chunks[j].length) {
				off -= chunks[j].length;
				--j;
			}
			if (j < 0) if (off == 0) off = chunks[j = 0].length;
			else throw new Error("Invalid offset beyond length");
			if (length < off) chunks.push(chunks[j][subarray](chunks[j].length - off, chunks[j].length - off + length));
			else {
				if (off > 0) {
					chunks.push(chunks[j][subarray](chunks[j].length - off));
					length -= off;
				}
				++j;
				while (length >= chunks[j].length) {
					chunks.push(chunks[j]);
					length -= chunks[j].length;
					++j;
				}
				if (length) chunks.push(chunks[j][subarray](0, length));
			}
			if (chunks.length > 25) chunks = [u8concat(chunks)];
		}
	}
	var clen = 0;
	for (var u8i = 0; u8i < chunks.length; ++u8i) clen += chunks[u8i].length;
	if (clen != usz) throw new Error("Unexpected length: ".concat(clen, " != ").concat(usz));
	return chunks;
}
function decompress_iwa_file(buf) {
	if (Array.isArray(buf)) buf = new Uint8Array(buf);
	var out = [];
	var l = 0;
	while (l < buf.length) {
		var t = buf[l++];
		var len = buf[l] | buf[l + 1] << 8 | buf[l + 2] << 16;
		l += 3;
		out.push.apply(out, parse_snappy_chunk(t, buf[subarray](l, l + len)));
		l += len;
	}
	if (l !== buf.length) throw new Error("data is not a valid framed stream!");
	return out.length == 1 ? out[0] : u8concat(out);
}
var numbers_lut_new = function() {
	return {
		sst: [],
		rsst: [],
		ofmt: [],
		nfmt: [],
		fmla: [],
		ferr: [],
		cmnt: []
	};
};
function numbers_format_cell(cell, t, flags, ofmt, nfmt) {
	var _a, _b, _c, _d;
	var ctype = t & 255, ver = t >> 8;
	var fmt = (ver >= 5 ? nfmt : ofmt) || [];
	dur: if (flags & (ver > 4 ? 8 : 4) && cell.t == "n" && ctype == 7) {
		var dstyle = ((_a = fmt[7]) == null ? void 0 : _a[0]) ? varint_to_i32(fmt[7][0].data) : -1;
		if (dstyle == -1) break dur;
		var dmin = ((_b = fmt[15]) == null ? void 0 : _b[0]) ? varint_to_i32(fmt[15][0].data) : -1;
		var dmax = ((_c = fmt[16]) == null ? void 0 : _c[0]) ? varint_to_i32(fmt[16][0].data) : -1;
		var auto = ((_d = fmt[40]) == null ? void 0 : _d[0]) ? varint_to_i32(fmt[40][0].data) : -1;
		var d = cell.v, dd = d;
		autodur: if (auto) {
			if (d == 0) {
				dmin = dmax = 2;
				break autodur;
			}
			if (d >= 604800) dmin = 1;
			else if (d >= 86400) dmin = 2;
			else if (d >= 3600) dmin = 4;
			else if (d >= 60) dmin = 8;
			else if (d >= 1) dmin = 16;
			else dmin = 32;
			if (Math.floor(d) != d) dmax = 32;
			else if (d % 60) dmax = 16;
			else if (d % 3600) dmax = 8;
			else if (d % 86400) dmax = 4;
			else if (d % 604800) dmax = 2;
			if (dmax < dmin) dmax = dmin;
		}
		if (dmin == -1 || dmax == -1) break dur;
		var dstr = [], zstr = [];
		if (dmin == 1) {
			dd = d / 604800;
			if (dmax == 1) zstr.push("d\"d\"");
			else {
				dd |= 0;
				d -= 604800 * dd;
			}
			dstr.push(dd + (dstyle == 2 ? " week" + (dd == 1 ? "" : "s") : dstyle == 1 ? "w" : ""));
		}
		if (dmin <= 2 && dmax >= 2) {
			dd = d / 86400;
			if (dmax > 2) {
				dd |= 0;
				d -= 86400 * dd;
			}
			zstr.push("d\"d\"");
			dstr.push(dd + (dstyle == 2 ? " day" + (dd == 1 ? "" : "s") : dstyle == 1 ? "d" : ""));
		}
		if (dmin <= 4 && dmax >= 4) {
			dd = d / 3600;
			if (dmax > 4) {
				dd |= 0;
				d -= 3600 * dd;
			}
			zstr.push((dmin >= 4 ? "[h]" : "h") + "\"h\"");
			dstr.push(dd + (dstyle == 2 ? " hour" + (dd == 1 ? "" : "s") : dstyle == 1 ? "h" : ""));
		}
		if (dmin <= 8 && dmax >= 8) {
			dd = d / 60;
			if (dmax > 8) {
				dd |= 0;
				d -= 60 * dd;
			}
			zstr.push((dmin >= 8 ? "[m]" : "m") + "\"m\"");
			if (dstyle == 0) dstr.push((dmin == 8 && dmax == 8 || dd >= 10 ? "" : "0") + dd);
			else dstr.push(dd + (dstyle == 2 ? " minute" + (dd == 1 ? "" : "s") : dstyle == 1 ? "m" : ""));
		}
		if (dmin <= 16 && dmax >= 16) {
			dd = d;
			if (dmax > 16) {
				dd |= 0;
				d -= dd;
			}
			zstr.push((dmin >= 16 ? "[s]" : "s") + "\"s\"");
			if (dstyle == 0) dstr.push((dmax == 16 && dmin == 16 || dd >= 10 ? "" : "0") + dd);
			else dstr.push(dd + (dstyle == 2 ? " second" + (dd == 1 ? "" : "s") : dstyle == 1 ? "s" : ""));
		}
		if (dmax >= 32) {
			dd = Math.round(1e3 * d);
			if (dmin < 32) zstr.push(".000\"ms\"");
			if (dstyle == 0) dstr.push((dd >= 100 ? "" : dd >= 10 ? "0" : "00") + dd);
			else dstr.push(dd + (dstyle == 2 ? " millisecond" + (dd == 1 ? "" : "s") : dstyle == 1 ? "ms" : ""));
		}
		cell.w = dstr.join(dstyle == 0 ? ":" : " ");
		cell.z = zstr.join(dstyle == 0 ? "\":\"" : " ");
		if (dstyle == 0) cell.w = cell.w.replace(/:(\d\d\d)$/, ".$1");
	}
}
function parse_old_storage(buf, lut, v, opts) {
	var dv = u8_to_dataview(buf);
	var flags = dv.getUint32(4, true);
	var ridx = -1, sidx = -1, zidx = -1, ieee = NaN, dc = 0, dt = new Date(Date.UTC(2001, 0, 1));
	var doff = v > 1 ? 12 : 8;
	if (flags & 2) {
		zidx = dv.getUint32(doff, true);
		doff += 4;
	}
	doff += popcnt(flags & (v > 1 ? 3468 : 396)) * 4;
	if (flags & 512) {
		ridx = dv.getUint32(doff, true);
		doff += 4;
	}
	doff += popcnt(flags & (v > 1 ? 12288 : 4096)) * 4;
	if (flags & 16) {
		sidx = dv.getUint32(doff, true);
		doff += 4;
	}
	if (flags & 32) {
		ieee = dv.getFloat64(doff, true);
		doff += 8;
	}
	if (flags & 64) {
		dt.setTime(dt.getTime() + (dc = dv.getFloat64(doff, true)) * 1e3);
		doff += 8;
	}
	if (v > 1) {
		flags = dv.getUint32(8, true) >>> 16;
		if (flags & 255) {
			if (zidx == -1) zidx = dv.getUint32(doff, true);
			doff += 4;
		}
	}
	var ret;
	var t = buf[v >= 4 ? 1 : 2];
	switch (t) {
		case 0: return;
		case 2:
			ret = {
				t: "n",
				v: ieee
			};
			break;
		case 3:
			ret = {
				t: "s",
				v: lut.sst[sidx]
			};
			break;
		case 5:
			if (opts == null ? void 0 : opts.cellDates) ret = {
				t: "d",
				v: dt
			};
			else ret = {
				t: "n",
				v: dc / 86400 + 35430,
				z: table_fmt[14]
			};
			break;
		case 6:
			ret = {
				t: "b",
				v: ieee > 0
			};
			break;
		case 7:
			ret = {
				t: "n",
				v: ieee
			};
			break;
		case 8:
			ret = {
				t: "e",
				v: 0
			};
			break;
		case 9:
			if (ridx > -1) {
				var rts = lut.rsst[ridx];
				ret = {
					t: "s",
					v: rts.v
				};
				if (rts.l) ret.l = { Target: rts.l };
			} else throw new Error("Unsupported cell type ".concat(buf[subarray](0, 4)));
			break;
		default: throw new Error("Unsupported cell type ".concat(buf[subarray](0, 4)));
	}
	if (zidx > -1) numbers_format_cell(ret, t | v << 8, flags, lut.ofmt[zidx], lut.nfmt[zidx]);
	if (t == 7) ret.v /= 86400;
	return ret;
}
function parse_new_storage(buf, lut, opts) {
	var dv = u8_to_dataview(buf);
	dv.getUint32(4, true);
	var fields = dv.getUint32(8, true);
	var doff = 12, ridx = -1, sidx = -1, zidx = -1, d128 = NaN, ieee = NaN, dc = 0, dt = new Date(Date.UTC(2001, 0, 1));
	if (fields & 1) {
		d128 = readDecimal128LE(buf, doff);
		doff += 16;
	}
	if (fields & 2) {
		ieee = dv.getFloat64(doff, true);
		doff += 8;
	}
	if (fields & 4) {
		dt.setTime(dt.getTime() + (dc = dv.getFloat64(doff, true)) * 1e3);
		doff += 8;
	}
	if (fields & 8) {
		sidx = dv.getUint32(doff, true);
		doff += 4;
	}
	if (fields & 16) {
		ridx = dv.getUint32(doff, true);
		doff += 4;
	}
	doff += popcnt(fields & 480) * 4;
	if (fields & 512) {
		dv.getUint32(doff, true);
		doff += 4;
	}
	doff += popcnt(fields & 1024) * 4;
	if (fields & 2048) {
		dv.getUint32(doff, true);
		doff += 4;
	}
	var ret;
	var t = buf[1];
	switch (t) {
		case 0:
			ret = { t: "z" };
			break;
		case 2:
			ret = {
				t: "n",
				v: d128
			};
			break;
		case 3:
			ret = {
				t: "s",
				v: lut.sst[sidx]
			};
			break;
		case 5:
			if (opts == null ? void 0 : opts.cellDates) ret = {
				t: "d",
				v: dt
			};
			else ret = {
				t: "n",
				v: dc / 86400 + 35430,
				z: table_fmt[14]
			};
			break;
		case 6:
			ret = {
				t: "b",
				v: ieee > 0
			};
			break;
		case 7:
			ret = {
				t: "n",
				v: ieee
			};
			break;
		case 8:
			ret = {
				t: "e",
				v: 0
			};
			break;
		case 9:
			if (ridx > -1) {
				var rts = lut.rsst[ridx];
				ret = {
					t: "s",
					v: rts.v
				};
				if (rts.l) ret.l = { Target: rts.l };
			} else throw new Error("Unsupported cell type ".concat(buf[1], " : ").concat(fields & 31, " : ").concat(buf[subarray](0, 4)));
			break;
		case 10:
			ret = {
				t: "n",
				v: d128
			};
			break;
		default: throw new Error("Unsupported cell type ".concat(buf[1], " : ").concat(fields & 31, " : ").concat(buf[subarray](0, 4)));
	}
	doff += popcnt(fields & 4096) * 4;
	if (fields & 516096) {
		if (zidx == -1) zidx = dv.getUint32(doff, true);
		doff += 4;
	}
	if (fields & 524288) {
		var cmntidx = dv.getUint32(doff, true);
		doff += 4;
		if (lut.cmnt[cmntidx]) ret.c = iwa_to_s5s_comment(lut.cmnt[cmntidx]);
	}
	if (zidx > -1) numbers_format_cell(ret, t | 1280, fields >> 13, lut.ofmt[zidx], lut.nfmt[zidx]);
	if (t == 7) ret.v /= 86400;
	return ret;
}
function parse_cell_storage(buf, lut, opts) {
	switch (buf[0]) {
		case 0:
		case 1:
		case 2:
		case 3:
		case 4: return parse_old_storage(buf, lut, buf[0], opts);
		case 5: return parse_new_storage(buf, lut, opts);
		default: throw new Error("Unsupported payload version ".concat(buf[0]));
	}
}
function parse_TSP_Reference(buf) {
	return varint_to_i32(parse_shallow(buf)[1][0].data);
}
function parse_TST_TableDataList(M, root) {
	var pb = parse_shallow(root.data);
	var type = varint_to_i32(pb[1][0].data);
	var entries = pb[3];
	var data = [];
	(entries || []).forEach(function(entry) {
		var _a, _b;
		var le = parse_shallow(entry.data);
		if (!le[1]) return;
		var key = varint_to_i32(le[1][0].data) >>> 0;
		switch (type) {
			case 1:
				data[key] = u8str(le[3][0].data);
				break;
			case 8:
				var rt = M[parse_TSP_Reference(le[9][0].data)][0];
				var rtpref = M[parse_TSP_Reference(parse_shallow(rt.data)[1][0].data)][0];
				var mtype = varint_to_i32(rtpref.meta[1][0].data);
				if (mtype != 2001) throw new Error("2000 unexpected reference to ".concat(mtype));
				var tswpsa = parse_shallow(rtpref.data);
				var richtext = { v: tswpsa[3].map(function(x) {
					return u8str(x.data);
				}).join("") };
				data[key] = richtext;
				sfields: if ((_a = tswpsa == null ? void 0 : tswpsa[11]) == null ? void 0 : _a[0]) {
					var smartfields = (_b = parse_shallow(tswpsa[11][0].data)) == null ? void 0 : _b[1];
					if (!smartfields) break sfields;
					smartfields.forEach(function(sf) {
						var _a2, _b2, _c;
						var attr = parse_shallow(sf.data);
						if ((_a2 = attr[2]) == null ? void 0 : _a2[0]) {
							var obj = M[parse_TSP_Reference((_b2 = attr[2]) == null ? void 0 : _b2[0].data)][0];
							var objtype = varint_to_i32(obj.meta[1][0].data);
							switch (objtype) {
								case 2032:
									var hlink = parse_shallow(obj.data);
									if (((_c = hlink == null ? void 0 : hlink[2]) == null ? void 0 : _c[0]) && !richtext.l) richtext.l = u8str(hlink[2][0].data);
									break;
								case 2039: break;
								default: console.log("unrecognized ObjectAttribute type ".concat(objtype));
							}
						}
					});
				}
				break;
			case 2:
				data[key] = parse_shallow(le[6][0].data);
				break;
			case 3:
				data[key] = parse_shallow(le[5][0].data);
				break;
			case 10:
				var cs = M[parse_TSP_Reference(le[10][0].data)][0];
				data[key] = parse_TSD_CommentStorageArchive(M, cs.data);
				break;
			default: throw type;
		}
	});
	return data;
}
function parse_TST_TileRowInfo(u8, type) {
	var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
	var pb = parse_shallow(u8);
	var R = varint_to_i32(pb[1][0].data) >>> 0;
	var cnt = varint_to_i32(pb[2][0].data) >>> 0;
	var wide_offsets = ((_b = (_a = pb[8]) == null ? void 0 : _a[0]) == null ? void 0 : _b.data) && varint_to_i32(pb[8][0].data) > 0 || false;
	var used_storage_u8, used_storage;
	if (((_d = (_c = pb[7]) == null ? void 0 : _c[0]) == null ? void 0 : _d.data) && type != 0) {
		used_storage_u8 = (_f = (_e = pb[7]) == null ? void 0 : _e[0]) == null ? void 0 : _f.data;
		used_storage = (_h = (_g = pb[6]) == null ? void 0 : _g[0]) == null ? void 0 : _h.data;
	} else if (((_j = (_i = pb[4]) == null ? void 0 : _i[0]) == null ? void 0 : _j.data) && type != 1) {
		used_storage_u8 = (_l = (_k = pb[4]) == null ? void 0 : _k[0]) == null ? void 0 : _l.data;
		used_storage = (_n = (_m = pb[3]) == null ? void 0 : _m[0]) == null ? void 0 : _n.data;
	} else throw "NUMBERS Tile missing ".concat(type, " cell storage");
	var width = wide_offsets ? 4 : 1;
	var used_storage_offsets = u8_to_dataview(used_storage_u8);
	var offsets = [];
	for (var C = 0; C < used_storage_u8.length / 2; ++C) {
		var off = used_storage_offsets.getUint16(C * 2, true);
		if (off < 65535) offsets.push([C, off]);
	}
	if (offsets.length != cnt) throw "Expected ".concat(cnt, " cells, found ").concat(offsets.length);
	var cells = [];
	for (C = 0; C < offsets.length - 1; ++C) cells[offsets[C][0]] = used_storage[subarray](offsets[C][1] * width, offsets[C + 1][1] * width);
	if (offsets.length >= 1) cells[offsets[offsets.length - 1][0]] = used_storage[subarray](offsets[offsets.length - 1][1] * width);
	return {
		R,
		cells
	};
}
function parse_TST_Tile(M, root) {
	var _a;
	var pb = parse_shallow(root.data);
	var storage = -1;
	if ((_a = pb == null ? void 0 : pb[7]) == null ? void 0 : _a[0]) if (varint_to_i32(pb[7][0].data) >>> 0) storage = 1;
	else storage = 0;
	var ri = mappa(pb[5], function(u8) {
		return parse_TST_TileRowInfo(u8, storage);
	});
	return {
		nrows: varint_to_i32(pb[4][0].data) >>> 0,
		data: ri.reduce(function(acc, x) {
			if (!acc[x.R]) acc[x.R] = [];
			x.cells.forEach(function(cell, C) {
				if (acc[x.R][C]) throw new Error("Duplicate cell r=".concat(x.R, " c=").concat(C));
				acc[x.R][C] = cell;
			});
			return acc;
		}, [])
	};
}
function parse_TSD_CommentStorageArchive(M, data) {
	var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
	var out = {
		t: "",
		a: ""
	};
	var csp = parse_shallow(data);
	if ((_b = (_a = csp == null ? void 0 : csp[1]) == null ? void 0 : _a[0]) == null ? void 0 : _b.data) out.t = u8str((_d = (_c = csp == null ? void 0 : csp[1]) == null ? void 0 : _c[0]) == null ? void 0 : _d.data) || "";
	if ((_f = (_e = csp == null ? void 0 : csp[3]) == null ? void 0 : _e[0]) == null ? void 0 : _f.data) {
		var as = M[parse_TSP_Reference((_h = (_g = csp == null ? void 0 : csp[3]) == null ? void 0 : _g[0]) == null ? void 0 : _h.data)][0];
		var asp = parse_shallow(as.data);
		if ((_j = (_i = asp[1]) == null ? void 0 : _i[0]) == null ? void 0 : _j.data) out.a = u8str(asp[1][0].data);
	}
	if (csp == null ? void 0 : csp[4]) {
		out.replies = [];
		csp[4].forEach(function(pi) {
			var cs = M[parse_TSP_Reference(pi.data)][0];
			out.replies.push(parse_TSD_CommentStorageArchive(M, cs.data));
		});
	}
	return out;
}
function iwa_to_s5s_comment(iwa) {
	var out = [];
	out.push({
		t: iwa.t || "",
		a: iwa.a,
		T: iwa.replies && iwa.replies.length > 0
	});
	if (iwa.replies) iwa.replies.forEach(function(reply) {
		out.push({
			t: reply.t || "",
			a: reply.a,
			T: true
		});
	});
	return out;
}
function parse_TST_TableModelArchive(M, root, ws, opts) {
	var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
	var pb = parse_shallow(root.data);
	var range = {
		s: {
			r: 0,
			c: 0
		},
		e: {
			r: 0,
			c: 0
		}
	};
	range.e.r = (varint_to_i32(pb[6][0].data) >>> 0) - 1;
	if (range.e.r < 0) throw new Error("Invalid row varint ".concat(pb[6][0].data));
	range.e.c = (varint_to_i32(pb[7][0].data) >>> 0) - 1;
	if (range.e.c < 0) throw new Error("Invalid col varint ".concat(pb[7][0].data));
	ws["!ref"] = encode_range(range);
	var dense = ws["!data"] != null, dws = ws;
	var store = parse_shallow(pb[4][0].data);
	var lut = numbers_lut_new();
	if ((_a = store[4]) == null ? void 0 : _a[0]) lut.sst = parse_TST_TableDataList(M, M[parse_TSP_Reference(store[4][0].data)][0]);
	if ((_b = store[6]) == null ? void 0 : _b[0]) lut.fmla = parse_TST_TableDataList(M, M[parse_TSP_Reference(store[6][0].data)][0]);
	if ((_c = store[11]) == null ? void 0 : _c[0]) lut.ofmt = parse_TST_TableDataList(M, M[parse_TSP_Reference(store[11][0].data)][0]);
	if ((_d = store[12]) == null ? void 0 : _d[0]) lut.ferr = parse_TST_TableDataList(M, M[parse_TSP_Reference(store[12][0].data)][0]);
	if ((_e = store[17]) == null ? void 0 : _e[0]) lut.rsst = parse_TST_TableDataList(M, M[parse_TSP_Reference(store[17][0].data)][0]);
	if ((_f = store[19]) == null ? void 0 : _f[0]) lut.cmnt = parse_TST_TableDataList(M, M[parse_TSP_Reference(store[19][0].data)][0]);
	if ((_g = store[22]) == null ? void 0 : _g[0]) lut.nfmt = parse_TST_TableDataList(M, M[parse_TSP_Reference(store[22][0].data)][0]);
	var tile = parse_shallow(store[3][0].data);
	var _R = 0;
	if (!((_h = store[9]) == null ? void 0 : _h[0])) throw "NUMBERS file missing row tree";
	parse_shallow(store[9][0].data)[1].map(function(p) {
		return parse_shallow(p.data);
	}).forEach(function(kv) {
		_R = varint_to_i32(kv[1][0].data);
		var tidx = varint_to_i32(kv[2][0].data);
		var t = tile[1][tidx];
		if (!t) throw "NUMBERS missing tile " + tidx;
		var ref2 = M[parse_TSP_Reference(parse_shallow(t.data)[2][0].data)][0];
		var mtype2 = varint_to_i32(ref2.meta[1][0].data);
		if (mtype2 != 6002) throw new Error("6001 unexpected reference to ".concat(mtype2));
		var _tile = parse_TST_Tile(M, ref2);
		_tile.data.forEach(function(row, R) {
			row.forEach(function(buf, C) {
				var res = parse_cell_storage(buf, lut, opts);
				if (res) if (dense) {
					if (!dws["!data"][_R + R]) dws["!data"][_R + R] = [];
					dws["!data"][_R + R][C] = res;
				} else ws[encode_col(C) + encode_row(_R + R)] = res;
			});
		});
		_R += _tile.nrows;
	});
	if ((_i = store[13]) == null ? void 0 : _i[0]) {
		var ref = M[parse_TSP_Reference(store[13][0].data)][0];
		var mtype = varint_to_i32(ref.meta[1][0].data);
		if (mtype != 6144) throw new Error("Expected merge type 6144, found ".concat(mtype));
		ws["!merges"] = (_j = parse_shallow(ref.data)) == null ? void 0 : _j[1].map(function(pi) {
			var merge = parse_shallow(pi.data);
			var origin = u8_to_dataview(parse_shallow(merge[1][0].data)[1][0].data), size = u8_to_dataview(parse_shallow(merge[2][0].data)[1][0].data);
			return {
				s: {
					r: origin.getUint16(0, true),
					c: origin.getUint16(2, true)
				},
				e: {
					r: origin.getUint16(0, true) + size.getUint16(0, true) - 1,
					c: origin.getUint16(2, true) + size.getUint16(2, true) - 1
				}
			};
		});
	}
	if (!((_k = ws["!merges"]) == null ? void 0 : _k.length) && ((_l = pb[47]) == null ? void 0 : _l[0])) {
		var merge_owner = parse_shallow(pb[47][0].data);
		if ((_m = merge_owner[2]) == null ? void 0 : _m[0]) {
			var formula_store = parse_shallow(merge_owner[2][0].data);
			if ((_n = formula_store[3]) == null ? void 0 : _n[0]) ws["!merges"] = mappa(formula_store[3], function(u) {
				var _a2, _b2, _c2, _d2, _e2;
				var AST_node_array = parse_shallow(parse_shallow(parse_shallow(u)[2][0].data)[1][0].data);
				if (!((_a2 = AST_node_array[1]) == null ? void 0 : _a2[0])) return;
				var AST_node0 = parse_shallow(AST_node_array[1][0].data);
				if (varint_to_i32(AST_node0[1][0].data) != 67) return;
				var AST_colon_tract = parse_shallow(AST_node0[40][0].data);
				if (!((_b2 = AST_colon_tract[3]) == null ? void 0 : _b2[0]) || !((_c2 = AST_colon_tract[4]) == null ? void 0 : _c2[0])) return;
				var colrange = parse_shallow(AST_colon_tract[3][0].data);
				var rowrange = parse_shallow(AST_colon_tract[4][0].data);
				var c = varint_to_i32(colrange[1][0].data);
				var C = ((_d2 = colrange[2]) == null ? void 0 : _d2[0]) ? varint_to_i32(colrange[2][0].data) : c;
				var r = varint_to_i32(rowrange[1][0].data);
				var R = ((_e2 = rowrange[2]) == null ? void 0 : _e2[0]) ? varint_to_i32(rowrange[2][0].data) : r;
				return {
					s: {
						r,
						c
					},
					e: {
						r: R,
						c: C
					}
				};
			}).filter(function(x) {
				return x != null;
			});
		}
	}
}
function parse_TST_TableInfoArchive(M, root, opts) {
	var pb = parse_shallow(root.data);
	var out = { "!ref": "A1" };
	if (opts == null ? void 0 : opts.dense) out["!data"] = [];
	var tableref = M[parse_TSP_Reference(pb[2][0].data)];
	var mtype = varint_to_i32(tableref[0].meta[1][0].data);
	if (mtype != 6001) throw new Error("6000 unexpected reference to ".concat(mtype));
	parse_TST_TableModelArchive(M, tableref[0], out, opts);
	return out;
}
function parse_TN_SheetArchive(M, root, opts) {
	var _a;
	var pb = parse_shallow(root.data);
	var out = {
		name: ((_a = pb[1]) == null ? void 0 : _a[0]) ? u8str(pb[1][0].data) : "",
		sheets: []
	};
	mappa(pb[2], parse_TSP_Reference).forEach(function(off) {
		M[off].forEach(function(m) {
			if (varint_to_i32(m.meta[1][0].data) == 6e3) out.sheets.push(parse_TST_TableInfoArchive(M, m, opts));
		});
	});
	return out;
}
function parse_TN_DocumentArchive(M, root, opts) {
	var _a;
	var out = book_new();
	out.Workbook = { WBProps: { date1904: true } };
	var pb = parse_shallow(root.data);
	if ((_a = pb[2]) == null ? void 0 : _a[0]) throw new Error("Keynote presentations are not supported");
	mappa(pb[1], parse_TSP_Reference).forEach(function(off) {
		M[off].forEach(function(m) {
			if (varint_to_i32(m.meta[1][0].data) == 2) {
				var root2 = parse_TN_SheetArchive(M, m, opts);
				root2.sheets.forEach(function(sheet, idx) {
					book_append_sheet(out, sheet, idx == 0 ? root2.name : root2.name + "_" + idx, true);
				});
			}
		});
	});
	if (out.SheetNames.length == 0) throw new Error("Empty NUMBERS file");
	out.bookType = "numbers";
	return out;
}
function parse_numbers_iwa(cfb, opts) {
	var _a, _b, _c, _d, _e, _f, _g;
	var M = {}, indices = [];
	cfb.FullPaths.forEach(function(p) {
		if (p.match(/\.iwpv2/)) throw new Error("Unsupported password protection");
	});
	cfb.FileIndex.forEach(function(s) {
		if (!s.name.match(/\.iwa$/)) return;
		if (s.content[0] != 0) return;
		var o;
		try {
			o = decompress_iwa_file(s.content);
		} catch (e) {
			return console.log("?? " + s.content.length + " " + (e.message || e));
		}
		var packets;
		try {
			packets = parse_iwa_file(o);
		} catch (e) {
			return console.log("## " + (e.message || e));
		}
		packets.forEach(function(packet) {
			M[packet.id] = packet.messages;
			indices.push(packet.id);
		});
	});
	if (!indices.length) throw new Error("File has no messages");
	if (((_c = (_b = (_a = M == null ? void 0 : M[1]) == null ? void 0 : _a[0].meta) == null ? void 0 : _b[1]) == null ? void 0 : _c[0].data) && varint_to_i32(M[1][0].meta[1][0].data) == 1e4) throw new Error("Pages documents are not supported");
	var docroot = ((_g = (_f = (_e = (_d = M == null ? void 0 : M[1]) == null ? void 0 : _d[0]) == null ? void 0 : _e.meta) == null ? void 0 : _f[1]) == null ? void 0 : _g[0].data) && varint_to_i32(M[1][0].meta[1][0].data) == 1 && M[1][0];
	if (!docroot) indices.forEach(function(idx) {
		M[idx].forEach(function(iwam) {
			if (varint_to_i32(iwam.meta[1][0].data) >>> 0 == 1) if (!docroot) docroot = iwam;
			else throw new Error("Document has multiple roots");
		});
	});
	if (!docroot) throw new Error("Cannot find Document root");
	return parse_TN_DocumentArchive(M, docroot, opts);
}
function fix_opts_func(defaults) {
	return function fix_opts(opts) {
		for (var i = 0; i != defaults.length; ++i) {
			var d = defaults[i];
			if (opts[d[0]] === void 0) opts[d[0]] = d[1];
			if (d[2] === "n") opts[d[0]] = Number(opts[d[0]]);
		}
	};
}
function fix_read_opts(opts) {
	fix_opts_func([
		["cellNF", false],
		["cellHTML", true],
		["cellFormula", true],
		["cellStyles", false],
		["cellText", true],
		["cellDates", false],
		["sheetStubs", false],
		[
			"sheetRows",
			0,
			"n"
		],
		["bookDeps", false],
		["bookSheets", false],
		["bookProps", false],
		["bookFiles", false],
		["bookVBA", false],
		["password", ""],
		["WTF", false]
	])(opts);
}
function get_sheet_type(n) {
	if (RELS.WS.indexOf(n) > -1) return "sheet";
	if (RELS.CS && n == RELS.CS) return "chart";
	if (RELS.DS && n == RELS.DS) return "dialog";
	if (RELS.MS && n == RELS.MS) return "macro";
	return n && n.length ? n : "sheet";
}
function safe_parse_wbrels(wbrels, sheets) {
	if (!wbrels) return 0;
	try {
		wbrels = sheets.map(function pwbr(w) {
			if (!w.id) w.id = w.strRelID;
			return [
				w.name,
				wbrels["!id"][w.id].Target,
				get_sheet_type(wbrels["!id"][w.id].Type)
			];
		});
	} catch (e) {
		return null;
	}
	return !wbrels || wbrels.length === 0 ? null : wbrels;
}
function parse_sheet_legacy_drawing(sheet, type, zip, path, idx, opts, wb, comments) {
	if (!sheet || !sheet["!legdrawel"]) return;
	var draw = getzipstr(zip, resolve_path(sheet["!legdrawel"].Target, path), true);
	if (draw) parse_vml(utf8read(draw), sheet, comments || []);
}
function drawing_mime(path) {
	switch ((path || "").toLowerCase().replace(/.*\./, "")) {
		case "png": return "image/png";
		case "gif": return "image/gif";
		case "bmp": return "image/bmp";
		case "svg": return "image/svg+xml";
		case "jpg":
		case "jpeg": return "image/jpeg";
		case "tif":
		case "tiff": return "image/tiff";
		default: return "application/octet-stream";
	}
}
function parse_sheet_drawing(sheet, type, zip, path, idx, opts, wb) {
	if (!sheet || !sheet["!drawel"]) return;
	if (!opts || !opts.drawings && !opts.charts) return;
	var dfile = resolve_path(sheet["!drawel"].Target, path);
	var drelsp = get_rels_path(dfile);
	var draw = parse_drawing(getzipstr(zip, dfile, true), parse_rels(getzipstr(zip, drelsp, true), dfile));
	sheet["!drawings"] = draw;
	if (opts.drawings && draw.images && draw.images.length) draw.images.forEach(function(img) {
		if (!img || !img.target) return;
		var ipath = resolve_path(img.target, dfile);
		var ibin = getzipbin(zip, ipath, true);
		var contentType = drawing_mime(ipath);
		if (ibin) img.dataURI = "data:" + contentType + ";base64," + Base64_encode_arr(ibin);
		img.contentType = contentType;
		img.path = ipath;
	});
	if (opts.charts && draw.charts && draw.charts.length) {
		sheet["!charts"] = [];
		draw.charts.forEach(function(ch) {
			if (!ch || !ch.target) return;
			var chartp = resolve_path(ch.target, dfile);
			var crelsp = get_rels_path(chartp);
			var cws = parse_chart(getzipstr(zip, chartp, true), chartp, opts, parse_rels(getzipstr(zip, crelsp, true), chartp), wb, { "!type": "chart" });
			ch.model = cws && cws["!chart"];
			ch.data = cws;
			ch.path = chartp;
			sheet["!charts"].push(ch);
		});
	}
}
function safe_parse_sheet(zip, path, relsPath, sheet, idx, sheetRels, sheets, stype, opts, wb, themes, styles) {
	try {
		sheetRels[sheet] = parse_rels(getzipstr(zip, relsPath, true), path);
		var data = getzipdata(zip, path);
		var _ws;
		switch (stype) {
			case "sheet":
				_ws = parse_ws(data, path, idx, opts, sheetRels[sheet], wb, themes, styles);
				break;
			case "chart":
				_ws = parse_cs(data, path, idx, opts, sheetRels[sheet], wb, themes, styles);
				if (!_ws || !_ws["!drawel"] || !opts.drawings && !opts.charts) break;
				var dfile = resolve_path(_ws["!drawel"].Target, path);
				var drelsp = get_rels_path(dfile);
				var draw = parse_drawing(getzipstr(zip, dfile, true), parse_rels(getzipstr(zip, drelsp, true), dfile));
				_ws["!drawings"] = draw;
				if (!opts.charts || !draw.chart) break;
				var chartp = resolve_path(draw.chart, dfile);
				var crelsp = get_rels_path(chartp);
				_ws = parse_chart(getzipstr(zip, chartp, true), chartp, opts, parse_rels(getzipstr(zip, crelsp, true), chartp), wb, _ws);
				if (draw.charts && draw.charts.length) {
					draw.charts[0].model = _ws && _ws["!chart"];
					_ws["!charts"] = draw.charts;
				}
				break;
			case "macro":
				_ws = parse_ms(data, path, idx, opts, sheetRels[sheet], wb, themes, styles);
				break;
			case "dialog":
				_ws = parse_ds(data, path, idx, opts, sheetRels[sheet], wb, themes, styles);
				break;
			default: throw new Error("Unrecognized sheet type " + stype);
		}
		if (stype == "sheet") parse_sheet_tables(_ws, zip, path, sheetRels[sheet], opts, themes, styles);
		sheet_map_set(sheets, sheet, _ws);
		var comments = [], tcomments = [];
		if (sheetRels && sheetRels[sheet]) keys(sheetRels[sheet]).forEach(function(n) {
			var dfile = "";
			if (sheetRels[sheet][n].Type == RELS.CMNT) {
				dfile = resolve_path(sheetRels[sheet][n].Target, path);
				comments = parse_cmnt(getzipdata(zip, dfile, true), dfile, opts);
				if (!comments || !comments.length) return;
				sheet_insert_comments(_ws, comments, false);
			}
			if (sheetRels[sheet][n].Type == RELS.TCMNT) {
				dfile = resolve_path(sheetRels[sheet][n].Target, path);
				tcomments = tcomments.concat(parse_tcmnt_xml(getzipdata(zip, dfile, true), opts));
			}
		});
		if (tcomments && tcomments.length) sheet_insert_comments(_ws, tcomments, true, opts.people || []);
		if (stype == "sheet") parse_sheet_drawing(_ws, stype, zip, path, idx, opts, wb);
		parse_sheet_legacy_drawing(_ws, stype, zip, path, idx, opts, wb, comments);
	} catch (e) {
		if (opts.WTF || opts.validateMerges && e && /^E_MERGE_/.test(e.code)) throw e;
	}
}
function strip_front_slash(x) {
	return x.charAt(0) == "/" ? x.slice(1) : x;
}
function parse_zip(zip, opts) {
	make_ssf();
	opts = opts || {};
	fix_read_opts(opts);
	if (safegetzipfile(zip, "META-INF/manifest.xml")) return parse_ods(zip, opts);
	if (safegetzipfile(zip, "objectdata.xml")) return parse_ods(zip, opts);
	if (safegetzipfile(zip, "Index/Document.iwa")) {
		if (typeof Uint8Array == "undefined") throw new Error("NUMBERS file parsing requires Uint8Array support");
		if (typeof parse_numbers_iwa != "undefined") {
			if (zip.FileIndex) return parse_numbers_iwa(zip, opts);
			var _zip = CFB.utils.cfb_new();
			zipentries(zip).forEach(function(e) {
				zip_add_file(_zip, e, getzipbin(zip, e));
			});
			return parse_numbers_iwa(_zip, opts);
		}
		throw new Error("Unsupported NUMBERS file");
	}
	if (!safegetzipfile(zip, "[Content_Types].xml")) {
		if (safegetzipfile(zip, "index.xml.gz")) throw new Error("Unsupported NUMBERS 08 file");
		if (safegetzipfile(zip, "index.xml")) throw new Error("Unsupported NUMBERS 09 file");
		var index_zip = CFB.find(zip, "Index.zip");
		if (index_zip) {
			opts = dup(opts);
			delete opts.type;
			if (typeof index_zip.content == "string") opts.type = "binary";
			if (typeof Bun !== "undefined" && Buffer.isBuffer(index_zip.content)) return readSync(new Uint8Array(index_zip.content), opts);
			return readSync(index_zip.content, opts);
		}
		throw new Error("Unsupported ZIP file");
	}
	var entries = zipentries(zip);
	var dir = parse_ct(getzipstr(zip, "[Content_Types].xml"));
	var xlsb = false;
	var sheets, binname;
	if (dir.workbooks.length === 0) {
		binname = "xl/workbook.xml";
		if (getzipdata(zip, binname, true)) dir.workbooks.push(binname);
	}
	if (dir.workbooks.length === 0) {
		binname = "xl/workbook.bin";
		if (!getzipdata(zip, binname, true)) throw new Error("Could not find workbook");
		dir.workbooks.push(binname);
		xlsb = true;
	}
	if (dir.workbooks[0].slice(-3) == "bin") xlsb = true;
	var themes = {};
	var styles = {};
	if (!opts.bookSheets && !opts.bookProps) {
		strs = [];
		if (dir.sst) try {
			strs = parse_sst(getzipdata(zip, strip_front_slash(dir.sst)), dir.sst, opts);
		} catch (e) {
			if (opts.WTF) throw e;
		}
		if (opts.cellStyles && dir.themes.length) themes = parse_theme_xml(getzipstr(zip, dir.themes[0].replace(/^\//, ""), true) || "", opts);
		if (dir.style) styles = parse_sty(getzipdata(zip, strip_front_slash(dir.style)), dir.style, themes, opts);
	}
	dir.links.map(function(link) {
		try {
			var rels = parse_rels(getzipstr(zip, get_rels_path(strip_front_slash(link))), link);
			return parse_xlink(getzipdata(zip, strip_front_slash(link)), rels, link, opts);
		} catch (e) {}
	});
	var wb = parse_wb(getzipdata(zip, strip_front_slash(dir.workbooks[0])), dir.workbooks[0], opts);
	var props = {}, propdata = "";
	if (dir.coreprops.length) {
		propdata = getzipdata(zip, strip_front_slash(dir.coreprops[0]), true);
		if (propdata) props = parse_core_props(propdata);
		if (dir.extprops.length !== 0) {
			propdata = getzipdata(zip, strip_front_slash(dir.extprops[0]), true);
			if (propdata) parse_ext_props(propdata, props, opts);
		}
	}
	var custprops = {};
	if (!opts.bookSheets || opts.bookProps) {
		if (dir.custprops.length !== 0) {
			propdata = getzipstr(zip, strip_front_slash(dir.custprops[0]), true);
			if (propdata) custprops = parse_cust_props(propdata, opts);
		}
	}
	var out = {};
	if (opts.bookSheets || opts.bookProps) {
		if (wb.Sheets) sheets = wb.Sheets.map(function pluck(x) {
			return x.name;
		});
		else if (props.Worksheets && props.SheetNames.length > 0) sheets = props.SheetNames;
		if (opts.bookProps) {
			out.Props = props;
			out.Custprops = custprops;
		}
		if (opts.bookSheets && typeof sheets !== "undefined") out.SheetNames = sheets;
		if (opts.bookSheets ? out.SheetNames : opts.bookProps) return out;
	}
	sheets = sheet_map_new();
	var deps = {};
	if (opts.bookDeps && dir.calcchain) deps = parse_cc(getzipdata(zip, strip_front_slash(dir.calcchain)), dir.calcchain, opts);
	var i = 0;
	var sheetRels = {};
	var path, relsPath;
	var wbsheets = wb.Sheets;
	props.Worksheets = wbsheets.length;
	props.SheetNames = [];
	for (var j = 0; j != wbsheets.length; ++j) props.SheetNames[j] = wbsheets[j].name;
	var wbext = xlsb ? "bin" : "xml";
	var wbrelsi = dir.workbooks[0].lastIndexOf("/");
	var wbrelsfile = (dir.workbooks[0].slice(0, wbrelsi + 1) + "_rels/" + dir.workbooks[0].slice(wbrelsi + 1) + ".rels").replace(/^\//, "");
	if (!safegetzipfile(zip, wbrelsfile)) wbrelsfile = "xl/_rels/workbook." + wbext + ".rels";
	var wbrels = parse_rels(getzipstr(zip, wbrelsfile, true), wbrelsfile.replace(/_rels.*/, "s5s"));
	if ((dir.metadata || []).length >= 1) opts.xlmeta = parse_xlmeta(getzipdata(zip, strip_front_slash(dir.metadata[0])), dir.metadata[0], opts);
	if ((dir.people || []).length >= 1) opts.people = parse_people_xml(getzipdata(zip, strip_front_slash(dir.people[0])), opts);
	if (wbrels) wbrels = safe_parse_wbrels(wbrels, wb.Sheets);
	var nmode = getzipdata(zip, "xl/worksheets/sheet.xml", true) ? 1 : 0;
	wsloop: for (i = 0; i != props.Worksheets; ++i) {
		var stype = "sheet";
		if (wbrels && wbrels[i]) {
			path = "xl/" + wbrels[i][1].replace(/[\/]?xl\//, "");
			if (!safegetzipfile(zip, path)) path = wbrels[i][1];
			if (!safegetzipfile(zip, path)) path = wbrelsfile.replace(/_rels\/[\S\s]*$/, "") + wbrels[i][1];
			stype = wbrels[i][2];
		} else {
			path = "xl/worksheets/sheet" + (i + 1 - nmode) + "." + wbext;
			path = path.replace(/sheet0\./, "sheet.");
		}
		relsPath = path.replace(/^(.*)(\/)([^\/]*)$/, "$1/_rels/$3.rels");
		if (opts && opts.sheets != null) switch (typeof opts.sheets) {
			case "number":
				if (i != opts.sheets) continue wsloop;
				break;
			case "string":
				if (props.SheetNames[i].toLowerCase() != opts.sheets.toLowerCase()) continue wsloop;
				break;
			default: if (Array.isArray && Array.isArray(opts.sheets)) {
				var snjseen = false;
				for (var snj = 0; snj != opts.sheets.length; ++snj) {
					if (typeof opts.sheets[snj] == "number" && opts.sheets[snj] == i) snjseen = 1;
					if (typeof opts.sheets[snj] == "string" && opts.sheets[snj].toLowerCase() == props.SheetNames[i].toLowerCase()) snjseen = 1;
				}
				if (!snjseen) continue wsloop;
			}
		}
		safe_parse_sheet(zip, path, relsPath, props.SheetNames[i], i, sheetRels, sheets, stype, opts, wb, themes, styles);
	}
	out = {
		Directory: dir,
		Workbook: wb,
		Props: props,
		Custprops: custprops,
		Deps: deps,
		Sheets: sheets,
		SheetNames: props.SheetNames,
		Strings: strs,
		Styles: styles,
		Themes: themes,
		SSF: dup(table_fmt)
	};
	if (opts && opts.bookFiles) if (zip.files) {
		out.keys = entries;
		out.files = zip.files;
	} else {
		out.keys = [];
		out.files = {};
		zip.FullPaths.forEach(function(p, idx) {
			p = p.replace(/^Root Entry[\/]/, "");
			out.keys.push(p);
			out.files[p] = zip.FileIndex[idx];
		});
	}
	if (opts && opts.bookVBA) {
		if (dir.vba.length > 0) out.vbaraw = getzipdata(zip, strip_front_slash(dir.vba[0]), true);
		else if (dir.defaults && dir.defaults.bin === CT_VBA) out.vbaraw = getzipdata(zip, "xl/vbaProject.bin", true);
	}
	out.bookType = xlsb ? "xlsb" : "xlsx";
	return out;
}
function parse_xlsxcfb(cfb, _opts) {
	var opts = _opts || {};
	var f = "Workbook", data = CFB.find(cfb, f);
	try {
		f = "/!DataSpaces/Version";
		data = CFB.find(cfb, f);
		if (!data || !data.content) throw new Error("ECMA-376 Encrypted file missing " + f);
		parse_DataSpaceVersionInfo(data.content);
		f = "/!DataSpaces/DataSpaceMap";
		data = CFB.find(cfb, f);
		if (!data || !data.content) throw new Error("ECMA-376 Encrypted file missing " + f);
		var dsm = parse_DataSpaceMap(data.content);
		if (dsm.length !== 1 || dsm[0].comps.length !== 1 || dsm[0].comps[0].t !== 0 || dsm[0].name !== "StrongEncryptionDataSpace" || dsm[0].comps[0].v !== "EncryptedPackage") throw new Error("ECMA-376 Encrypted file bad " + f);
		f = "/!DataSpaces/DataSpaceInfo/StrongEncryptionDataSpace";
		data = CFB.find(cfb, f);
		if (!data || !data.content) throw new Error("ECMA-376 Encrypted file missing " + f);
		var seds = parse_DataSpaceDefinition(data.content);
		if (seds.length != 1 || seds[0] != "StrongEncryptionTransform") throw new Error("ECMA-376 Encrypted file bad " + f);
		f = "/!DataSpaces/TransformInfo/StrongEncryptionTransform/!Primary";
		data = CFB.find(cfb, f);
		if (!data || !data.content) throw new Error("ECMA-376 Encrypted file missing " + f);
		parse_Primary(data.content);
	} catch (e) {}
	f = "/EncryptionInfo";
	data = CFB.find(cfb, f);
	if (!data || !data.content) throw new Error("ECMA-376 Encrypted file missing " + f);
	var einfo = parse_EncryptionInfo(data.content);
	f = "/EncryptedPackage";
	data = CFB.find(cfb, f);
	if (!data || !data.content) throw new Error("ECMA-376 Encrypted file missing " + f);
	if (einfo[0] == 4 && typeof decrypt_agile !== "undefined") return decrypt_agile(einfo[1], data.content, opts.password || "", opts);
	if (einfo[0] == 2 && typeof decrypt_std76 !== "undefined") return decrypt_std76(einfo[1], data.content, opts.password || "", opts);
	throw new Error("File is password-protected");
}
function firstbyte(f, o) {
	var x = "";
	switch ((o || {}).type || "base64") {
		case "buffer": return [
			f[0],
			f[1],
			f[2],
			f[3],
			f[4],
			f[5],
			f[6],
			f[7]
		];
		case "base64":
			x = Base64_decode(f.slice(0, 12));
			break;
		case "binary":
			x = f;
			break;
		case "array": return [
			f[0],
			f[1],
			f[2],
			f[3],
			f[4],
			f[5],
			f[6],
			f[7]
		];
		default: throw new Error("Unrecognized type " + (o && o.type || "undefined"));
	}
	return [
		x.charCodeAt(0),
		x.charCodeAt(1),
		x.charCodeAt(2),
		x.charCodeAt(3),
		x.charCodeAt(4),
		x.charCodeAt(5),
		x.charCodeAt(6),
		x.charCodeAt(7)
	];
}
function read_cfb(cfb, opts) {
	if (CFB.find(cfb, "EncryptedPackage")) return parse_xlsxcfb(cfb, opts);
	return parse_xlscfb(cfb, opts);
}
function read_zip(data, opts) {
	var zip, d = data;
	var o = opts || {};
	if (!o.type) o.type = has_buf && Buffer.isBuffer(data) ? "buffer" : "base64";
	zip = zip_read(d, o);
	return parse_zip(zip, o);
}
function read_plaintext(data, o) {
	var i = 0;
	main: while (i < data.length) switch (data.charCodeAt(i)) {
		case 10:
		case 13:
		case 32:
			++i;
			break;
		case 60: return parse_xlml(data.slice(i), o);
		default: break main;
	}
	return PRN.to_workbook(data, o);
}
function read_plaintext_raw(data, o) {
	var str = "", bytes = firstbyte(data, o);
	switch (o.type) {
		case "base64":
			str = Base64_decode(data);
			break;
		case "binary":
			str = data;
			break;
		case "buffer":
			str = data.toString("binary");
			break;
		case "array":
			str = cc2str(data);
			break;
		default: throw new Error("Unrecognized type " + o.type);
	}
	if (bytes[0] == 239 && bytes[1] == 187 && bytes[2] == 191) str = utf8read(str);
	o.type = "binary";
	return read_plaintext(str, o);
}
function read_utf16(data, o) {
	var d = data;
	if (o.type == "base64") d = Base64_decode(d);
	if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) d = new Uint8Array(data);
	d = typeof $cptable !== "undefined" ? $cptable.utils.decode(1200, d.slice(2), "str") : has_buf && Buffer.isBuffer(data) ? data.slice(2).toString("utf16le") : typeof Uint8Array !== "undefined" && d instanceof Uint8Array ? typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le").decode(d.slice(2)) : utf16lereadu(d.slice(2)) : utf16leread(d.slice(2));
	o.type = "binary";
	return read_plaintext(d, o);
}
function bstrify(data) {
	return !data.match(/[^\x00-\x7F]/) ? data : utf8write(data);
}
function read_prn(data, d, o, str) {
	if (str) {
		o.type = "string";
		return PRN.to_workbook(data, o);
	}
	return PRN.to_workbook(d, o);
}
function readSync(data, opts) {
	reset_cp();
	var o = opts || {};
	if (o.codepage && typeof $cptable === "undefined") console.error("Codepage tables are not loaded.  Non-ASCII characters may not give expected results");
	if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) return readSync(new Uint8Array(data), (o = dup(o), o.type = "array", o));
	if (typeof Int8Array !== "undefined" && data instanceof Int8Array) return readSync(new Uint8Array(data.buffer, data.byteOffset, data.length), o);
	if (typeof Uint8Array !== "undefined" && data instanceof Uint8Array && !o.type) o.type = typeof Deno !== "undefined" ? "buffer" : "array";
	var d = data, n = [
		0,
		0,
		0,
		0
	], str = false;
	if (o.cellStyles) {
		o.cellNF = true;
		o.sheetStubs = true;
	}
	_ssfopts = {};
	if (o.dateNF) _ssfopts.dateNF = o.dateNF;
	if (!o.type) o.type = has_buf && Buffer.isBuffer(data) ? "buffer" : "base64";
	if (o.type == "file") {
		o.type = has_buf ? "buffer" : "binary";
		d = read_binary(data);
		if (typeof Uint8Array !== "undefined" && !has_buf) o.type = "array";
	}
	if (o.type == "string") {
		str = true;
		o.type = "binary";
		o.codepage = 65001;
		d = bstrify(data);
	}
	if (o.type == "array" && typeof Uint8Array !== "undefined" && data instanceof Uint8Array && typeof ArrayBuffer !== "undefined") {
		var vu = new Uint8Array(/* @__PURE__ */ new ArrayBuffer(3));
		vu.foo = "bar";
		if (!vu.foo) {
			o = dup(o);
			o.type = "array";
			return readSync(ab2a(d), o);
		}
	}
	switch ((n = firstbyte(d, o))[0]) {
		case 208:
			if (n[1] === 207 && n[2] === 17 && n[3] === 224 && n[4] === 161 && n[5] === 177 && n[6] === 26 && n[7] === 225) return read_cfb(CFB.read(d, o), o);
			break;
		case 9:
			if (n[1] <= 8) return parse_xlscfb(d, o);
			break;
		case 60: return parse_xlml(d, o);
		case 73:
			if (n[1] === 73 && n[2] === 42 && n[3] === 0) throw new Error("TIFF Image File is not a spreadsheet");
			if (n[1] === 68) return read_wb_ID(d, o);
			break;
		case 84:
			if (n[1] === 65 && n[2] === 66 && n[3] === 76) return read_wb_TABL(d, o);
			break;
		case 80: return n[1] === 75 && n[2] < 9 && n[3] < 9 ? read_zip(d, o) : read_prn(data, d, o, str);
		case 239: return n[3] === 60 ? parse_xlml(d, o) : read_prn(data, d, o, str);
		case 255:
			if (n[1] === 254) return read_utf16(d, o);
			else if (n[1] === 0 && n[2] === 2 && n[3] === 0) return WK_.to_workbook(d, o);
			break;
		case 0:
			if (n[1] === 0) {
				if (n[2] >= 2 && n[3] === 0) return WK_.to_workbook(d, o);
				if (n[2] === 0 && (n[3] === 8 || n[3] === 9)) return WK_.to_workbook(d, o);
			}
			break;
		case 3:
		case 131:
		case 139:
		case 140: return DBF.to_workbook(d, o);
		case 123:
			if (n[1] === 92 && n[2] === 114 && n[3] === 116) return rtf_to_workbook(d, o);
			break;
		case 10:
		case 13:
		case 32: return read_plaintext_raw(d, o);
		case 137:
			if (n[1] === 80 && n[2] === 78 && n[3] === 71) throw new Error("PNG Image File is not a spreadsheet");
			break;
		case 37:
			if (n[1] === 80 && n[2] === 68 && n[3] === 70) throw new Error("PDF File is not a spreadsheet");
			break;
		case 8:
			if (n[1] === 231) throw new Error("Unsupported Multiplan 1.x file!");
			break;
		case 12:
			if (n[1] === 236) throw new Error("Unsupported Multiplan 2.x file!");
			if (n[1] === 237) throw new Error("Unsupported Multiplan 3.x file!");
	}
	if (DBF_SUPPORTED_VERSIONS.indexOf(n[0]) > -1 && n[2] <= 12 && n[3] <= 31) return DBF.to_workbook(d, o);
	return read_prn(data, d, o, str);
}
function make_json_row(sheet, r, R, cols, header, hdr, o) {
	var rr = encode_row(R);
	var defval = o.defval, raw = o.raw || !Object.prototype.hasOwnProperty.call(o, "raw");
	var isempty = true, dense = sheet["!data"] != null;
	var row = header === 1 ? [] : {};
	if (header !== 1) if (Object.defineProperty) try {
		Object.defineProperty(row, "__rowNum__", {
			value: R,
			enumerable: false
		});
	} catch (e) {
		row.__rowNum__ = R;
	}
	else row.__rowNum__ = R;
	if (!dense || sheet["!data"][R]) for (var C = r.s.c; C <= r.e.c; ++C) {
		var val = dense ? (sheet["!data"][R] || [])[C] : sheet[cols[C] + rr];
		if (val == null || val.t === void 0) {
			if (defval === void 0) continue;
			if (hdr[C] != null) row[hdr[C]] = defval;
			continue;
		}
		var v = val.v;
		switch (val.t) {
			case "z":
				if (v == null) break;
				continue;
			case "e":
				v = v == 0 ? null : void 0;
				break;
			case "s":
			case "b": break;
			case "n":
				if (!val.z || !fmt_is_date(val.z)) break;
				v = numdate(v);
				if (typeof v == "number") break;
			case "d":
				if (!(o && (o.UTC || o.raw === false))) v = utc_to_local(new Date(v));
				break;
			default: throw new Error("unrecognized type " + val.t);
		}
		if (hdr[C] != null) {
			if (v == null) if (val.t == "e" && v === null) row[hdr[C]] = null;
			else if (defval !== void 0) row[hdr[C]] = defval;
			else if (raw && v === null) row[hdr[C]] = null;
			else continue;
			else row[hdr[C]] = (val.t === "n" && typeof o.rawNumbers === "boolean" ? o.rawNumbers : raw) ? v : format_cell(val, v, o);
			if (v != null) isempty = false;
		}
	}
	return {
		row,
		isempty
	};
}
function sheet_to_json(sheet, opts) {
	if (sheet == null || sheet["!ref"] == null) return [];
	var val = {
		t: "n",
		v: 0
	}, header = 0, offset = 1, hdr = [], v = 0, vv = "";
	var r = {
		s: {
			r: 0,
			c: 0
		},
		e: {
			r: 0,
			c: 0
		}
	};
	var o = opts || {};
	var range = o.range != null ? o.range : sheet["!ref"];
	if (o.header === 1) header = 1;
	else if (o.header === "A") header = 2;
	else if (Array.isArray(o.header)) header = 3;
	else if (o.header == null) header = 0;
	switch (typeof range) {
		case "string":
			r = safe_decode_range(range);
			break;
		case "number":
			r = safe_decode_range(sheet["!ref"]);
			r.s.r = range;
			break;
		default: r = range;
	}
	if (header > 0) offset = 0;
	var rr = encode_row(r.s.r);
	var cols = [];
	var out = [];
	var outi = 0, counter = 0;
	var dense = sheet["!data"] != null;
	var R = r.s.r, C = 0;
	var header_cnt = {};
	if (dense && !sheet["!data"][R]) sheet["!data"][R] = [];
	var colinfo = o.skipHidden && sheet["!cols"] || [];
	var rowinfo = o.skipHidden && sheet["!rows"] || [];
	for (C = r.s.c; C <= r.e.c; ++C) {
		if ((colinfo[C] || {}).hidden) continue;
		cols[C] = encode_col(C);
		val = dense ? sheet["!data"][R][C] : sheet[cols[C] + rr];
		switch (header) {
			case 1:
				hdr[C] = C - r.s.c;
				break;
			case 2:
				hdr[C] = cols[C];
				break;
			case 3:
				hdr[C] = o.header[C - r.s.c];
				break;
			default:
				if (val == null) val = {
					w: "__EMPTY",
					t: "s"
				};
				vv = v = format_cell(val, null, o);
				counter = header_cnt[v] || 0;
				if (!counter) header_cnt[v] = 1;
				else {
					do
						vv = v + "_" + counter++;
					while (header_cnt[vv]);
					header_cnt[v] = counter;
					header_cnt[vv] = 1;
				}
				hdr[C] = vv;
		}
	}
	for (R = r.s.r + offset; R <= r.e.r; ++R) {
		if ((rowinfo[R] || {}).hidden) continue;
		var row = make_json_row(sheet, r, R, cols, header, hdr, o);
		if (row.isempty === false || (header === 1 ? o.blankrows !== false : !!o.blankrows)) out[outi++] = row.row;
	}
	out.length = outi;
	return out;
}
var qreg = /"/g;
function make_csv_row(sheet, r, R, cols, fs, rs, FS, w, o) {
	var isempty = true;
	var row = [], txt = "", rr = encode_row(R);
	var dense = sheet["!data"] != null;
	var datarow = dense && sheet["!data"][R] || [];
	for (var C = r.s.c; C <= r.e.c; ++C) {
		if (!cols[C]) continue;
		var val = dense ? datarow[C] : sheet[cols[C] + rr];
		if (val == null) txt = "";
		else if (val.v != null) {
			isempty = false;
			txt = "" + (o.rawNumbers && val.t == "n" ? val.v : format_cell(val, null, o));
			for (var i = 0, cc = 0; i !== txt.length; ++i) if ((cc = txt.charCodeAt(i)) === fs || cc === rs || cc === 10 || cc === 13 || cc === 34 || o.forceQuotes) {
				txt = "\"" + txt.replace(qreg, "\"\"") + "\"";
				break;
			}
			if (txt == "ID" && w == 0 && row.length == 0) txt = "\"ID\"";
		} else if (val.f != null && !val.F) {
			isempty = false;
			txt = "=" + val.f;
			if (txt.indexOf(",") >= 0) txt = "\"" + txt.replace(qreg, "\"\"") + "\"";
		} else txt = "";
		row.push(txt);
	}
	if (o.strip) while (row[row.length - 1] === "") --row.length;
	if (o.blankrows === false && isempty) return null;
	return row.join(FS);
}
function sheet_to_csv(sheet, opts) {
	var out = [];
	var o = opts == null ? {} : opts;
	if (sheet == null || sheet["!ref"] == null) return "";
	var r = safe_decode_range(sheet["!ref"]);
	var FS = o.FS !== void 0 ? o.FS : ",", fs = FS.charCodeAt(0);
	var RS = o.RS !== void 0 ? o.RS : "\n", rs = RS.charCodeAt(0);
	var row = "", cols = [];
	var colinfo = o.skipHidden && sheet["!cols"] || [];
	var rowinfo = o.skipHidden && sheet["!rows"] || [];
	for (var C = r.s.c; C <= r.e.c; ++C) if (!(colinfo[C] || {}).hidden) cols[C] = encode_col(C);
	var w = 0;
	for (var R = r.s.r; R <= r.e.r; ++R) {
		if ((rowinfo[R] || {}).hidden) continue;
		row = make_csv_row(sheet, r, R, cols, fs, rs, FS, w, o);
		if (row == null) continue;
		if (row || o.blankrows !== false) out.push((w++ ? RS : "") + row);
	}
	return out.join("");
}
function sheet_to_txt(sheet, opts) {
	if (!opts) opts = {};
	opts.FS = "	";
	opts.RS = "\n";
	var s = sheet_to_csv(sheet, opts);
	if (typeof $cptable == "undefined" || opts.type == "string") return s;
	var o = $cptable.utils.encode(1200, s, "str");
	return String.fromCharCode(255) + String.fromCharCode(254) + o;
}
function sheet_to_formulae(sheet, opts) {
	var y = "", x, val = "";
	if (sheet == null || sheet["!ref"] == null) return [];
	var r = safe_decode_range(sheet["!ref"]), rr = "", cols = [], C;
	var cmds = [];
	var dense = sheet["!data"] != null;
	for (C = r.s.c; C <= r.e.c; ++C) cols[C] = encode_col(C);
	for (var R = r.s.r; R <= r.e.r; ++R) {
		rr = encode_row(R);
		for (C = r.s.c; C <= r.e.c; ++C) {
			y = cols[C] + rr;
			x = dense ? (sheet["!data"][R] || [])[C] : sheet[y];
			val = "";
			if (x === void 0) continue;
			else if (x.F != null) {
				y = x.F;
				if (!x.f) continue;
				val = x.f;
				if (y.indexOf(":") == -1) y = y + ":" + y;
			}
			if (x.f != null) val = x.f;
			else if (opts && opts.values === false) continue;
			else if (x.t == "z") continue;
			else if (x.t == "n" && x.v != null) val = "" + x.v;
			else if (x.t == "b") val = x.v ? "TRUE" : "FALSE";
			else if (x.w !== void 0) val = "'" + x.w;
			else if (x.v === void 0) continue;
			else if (x.t == "s") val = "'" + x.v;
			else val = "" + x.v;
			cmds[cmds.length] = y + "=" + val;
		}
	}
	return cmds;
}
function sheet_add_json(_ws, js, opts) {
	var o = opts || {};
	var dense = _ws ? _ws["!data"] != null : o.dense;
	if (DENSE != null && dense == null) dense = DENSE;
	var offset = +!o.skipHeader;
	var ws = _ws || {};
	if (!_ws && dense) ws["!data"] = [];
	var _R = 0, _C = 0;
	if (ws && o.origin != null) {
		if (typeof o.origin == "number") _R = o.origin;
		else {
			var _origin = typeof o.origin == "string" ? decode_cell(o.origin) : o.origin;
			_R = _origin.r;
			_C = _origin.c;
		}
		if (!isFinite(_R) || _R !== Math.floor(_R) || _R < -1 || !isFinite(_C) || _C !== Math.floor(_C) || _C < 0) throw new Error("Invalid origin");
	}
	var range = {
		s: {
			c: 0,
			r: 0
		},
		e: {
			c: _C,
			r: _R + js.length - 1 + offset
		}
	};
	if (ws["!ref"]) {
		var _range = safe_decode_range(ws["!ref"]);
		range.e.c = Math.max(range.e.c, _range.e.c);
		range.e.r = Math.max(range.e.r, _range.e.r);
		if (_R == -1) {
			_R = _range.e.r + 1;
			range.e.r = _R + js.length - 1 + offset;
		}
	} else if (_R == -1) {
		_R = 0;
		range.e.r = js.length - 1 + offset;
	}
	var hdr = o.header || [], C = 0;
	var ROW = [];
	js.forEach(function(JS, R) {
		if (dense && !ws["!data"][_R + R + offset]) ws["!data"][_R + R + offset] = [];
		if (dense) ROW = ws["!data"][_R + R + offset];
		keys(JS).forEach(function(k) {
			if ((C = hdr.indexOf(k)) == -1) hdr[C = hdr.length] = k;
			var v = JS[k];
			var t = "z";
			var z = "";
			var ref = dense ? "" : encode_col(_C + C) + encode_row(_R + R + offset);
			var cell = dense ? ROW[_C + C] : ws[ref];
			if (v && typeof v === "object" && !(v instanceof Date)) if (dense) ROW[_C + C] = v;
			else ws[ref] = v;
			else {
				if (typeof v == "number") t = "n";
				else if (typeof v == "boolean") t = "b";
				else if (typeof v == "string") t = "s";
				else if (v instanceof Date) {
					t = "d";
					if (!o.UTC) v = local_to_utc(v);
					if (!o.cellDates) {
						t = "n";
						v = datenum(v);
					}
					z = cell != null && cell.z && fmt_is_date(cell.z) ? cell.z : o.dateNF || table_fmt[14];
				} else if (v === null && o.nullError) {
					t = "e";
					v = 0;
				}
				if (!cell) if (!dense) ws[ref] = cell = {
					t,
					v
				};
				else ROW[_C + C] = cell = {
					t,
					v
				};
				else {
					cell.t = t;
					cell.v = v;
					delete cell.w;
					delete cell.R;
					if (z) cell.z = z;
				}
				if (z) cell.z = z;
			}
		});
	});
	range.e.c = Math.max(range.e.c, _C + hdr.length - 1);
	var __R = encode_row(_R);
	if (dense && !ws["!data"][_R]) ws["!data"][_R] = [];
	if (offset) for (C = 0; C < hdr.length; ++C) if (dense) ws["!data"][_R][C + _C] = {
		t: "s",
		v: hdr[C]
	};
	else ws[encode_col(C + _C) + __R] = {
		t: "s",
		v: hdr[C]
	};
	ws["!ref"] = encode_range(range);
	return ws;
}
function json_to_sheet(js, opts) {
	return sheet_add_json(null, js, opts);
}
function ws_get_cell_stub(ws, R, C) {
	if (typeof R == "string") {
		if (ws["!data"] != null) {
			var RC = decode_cell(R);
			if (!ws["!data"][RC.r]) ws["!data"][RC.r] = [];
			return ws["!data"][RC.r][RC.c] || (ws["!data"][RC.r][RC.c] = { t: "z" });
		}
		return ws[R] || (ws[R] = { t: "z" });
	}
	if (typeof R != "number") return ws_get_cell_stub(ws, encode_cell(R));
	return ws_get_cell_stub(ws, encode_col(C || 0) + encode_row(R));
}
function wb_sheet_idx(wb, sh) {
	if (typeof sh == "number") {
		if (sh >= 0 && wb.SheetNames.length > sh) return sh;
		throw new Error("Cannot find sheet # " + sh);
	} else if (typeof sh == "string") {
		var idx = wb.SheetNames.indexOf(sh);
		if (idx > -1) return idx;
		throw new Error("Cannot find sheet name |" + sh + "|");
	} else throw new Error("Cannot find sheet |" + sh + "|");
}
function book_new(ws, wsname) {
	var wb = {
		SheetNames: [],
		Sheets: sheet_map_new()
	};
	if (ws) book_append_sheet(wb, ws, wsname || "Sheet1");
	return wb;
}
function book_append_sheet(wb, ws, name, roll) {
	var i = 1;
	if (!name) {
		for (; i <= 65535; ++i, name = void 0) if (wb.SheetNames.indexOf(name = "Sheet" + i) == -1) break;
	}
	if (!name || wb.SheetNames.length >= 65535) throw new Error("Too many worksheets");
	if (roll && wb.SheetNames.indexOf(name) >= 0 && name.length < 32) {
		var m = name.match(/\d+$/);
		i = m && +m[0] || 0;
		var root = m && name.slice(0, m.index) || name;
		for (++i; i <= 65535; ++i) if (wb.SheetNames.indexOf(name = root + i) == -1) break;
	}
	check_ws_name(name);
	if (wb.SheetNames.indexOf(name) >= 0) throw new Error("Worksheet with name |" + name + "| already exists!");
	wb.SheetNames.push(name);
	sheet_map_set(wb.Sheets, name, ws);
	return name;
}
function book_set_sheet_visibility(wb, sh, vis) {
	if (!wb.Workbook) wb.Workbook = {};
	if (!wb.Workbook.Sheets) wb.Workbook.Sheets = [];
	var idx = wb_sheet_idx(wb, sh);
	if (!wb.Workbook.Sheets[idx]) wb.Workbook.Sheets[idx] = {};
	switch (vis) {
		case 0:
		case 1:
		case 2: break;
		default: throw new Error("Bad sheet visibility setting " + vis);
	}
	wb.Workbook.Sheets[idx].Hidden = vis;
}
function cell_set_number_format(cell, fmt) {
	cell.z = fmt;
	return cell;
}
function cell_set_hyperlink(cell, target, tooltip) {
	if (!target) delete cell.l;
	else {
		cell.l = { Target: target };
		if (tooltip) cell.l.Tooltip = tooltip;
	}
	return cell;
}
function cell_set_internal_link(cell, range, tooltip) {
	return cell_set_hyperlink(cell, "#" + range, tooltip);
}
function cell_add_comment(cell, text, author) {
	if (!cell.c) cell.c = [];
	cell.c.push({
		t: text,
		a: author || "SheetJS"
	});
}
function sheet_set_array_formula(ws, range, formula, dynamic) {
	var rng = typeof range != "string" ? range : safe_decode_range(range);
	var rngstr = typeof range == "string" ? range : encode_range(range);
	for (var R = rng.s.r; R <= rng.e.r; ++R) for (var C = rng.s.c; C <= rng.e.c; ++C) {
		var cell = ws_get_cell_stub(ws, R, C);
		cell.t = "n";
		cell.F = rngstr;
		delete cell.v;
		if (R == rng.s.r && C == rng.s.c) {
			cell.f = formula;
			if (dynamic) cell.D = true;
		}
	}
	var wsr = decode_range(ws["!ref"]);
	if (wsr.s.r > rng.s.r) wsr.s.r = rng.s.r;
	if (wsr.s.c > rng.s.c) wsr.s.c = rng.s.c;
	if (wsr.e.r < rng.e.r) wsr.e.r = rng.e.r;
	if (wsr.e.c < rng.e.c) wsr.e.c = rng.e.c;
	ws["!ref"] = encode_range(wsr);
	return ws;
}
var utils = {
	encode_col,
	encode_row,
	encode_cell,
	encode_range,
	decode_col,
	decode_row,
	split_cell,
	decode_cell,
	decode_range,
	format_cell,
	sheet_new,
	sheet_add_aoa,
	sheet_add_json,
	sheet_add_dom,
	aoa_to_sheet,
	json_to_sheet,
	table_to_sheet: parse_dom_table,
	table_to_book,
	sheet_to_csv,
	sheet_to_txt,
	sheet_to_json,
	sheet_to_html,
	sheet_to_formulae,
	sheet_to_row_object_array: sheet_to_json,
	validate_merges,
	measure_text_width,
	auto_fit_columns,
	autofit_columns: auto_fit_columns,
	resolve_table_cell_style,
	col_width_to_px: width2px,
	px_to_col_width: function(px) {
		return char2width(px2char(px));
	},
	row_height_to_px: pt2px_browser,
	px_to_row_height: px2pt_browser,
	sheet_get_cell: ws_get_cell_stub,
	book_new,
	book_append_sheet,
	book_set_sheet_visibility,
	cell_set_number_format,
	cell_set_hyperlink,
	cell_set_internal_link,
	cell_add_comment,
	sheet_set_array_formula,
	consts: {
		SHEET_VISIBLE: 0,
		SHEET_HIDDEN: 1,
		SHEET_VERY_HIDDEN: 2
	}
};
XLSX.version;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet/worker/sheetjs/color.js
var indexedColors = [
	"FF000000",
	"FFFFFFFF",
	"FFFF0000",
	"FF00FF00",
	"FF0000FF",
	"FFFFFF00",
	"FFFF00FF",
	"FF00FFFF",
	"FF000000",
	"FFFFFFFF",
	"FFFF0000",
	"FF00FF00",
	"FF0000FF",
	"FFFFFF00",
	"FFFF00FF",
	"FF00FFFF",
	"FF800000",
	"FF008000",
	"FF000080",
	"FF808000",
	"FF800080",
	"FF008080",
	"FFC0C0C0",
	"FF808080",
	"FF9999FF",
	"FF993366",
	"FFFFFFCC",
	"FFCCFFFF",
	"FF660066",
	"FFFF8080",
	"FF0066CC",
	"FFCCCCFF",
	"FF000080",
	"FFFF00FF",
	"FFFFFF00",
	"FF00FFFF",
	"FF800080",
	"FF800000",
	"FF008080",
	"FF0000FF",
	"FF00CCFF",
	"FFCCFFFF",
	"FFCCFFCC",
	"FFFFFF99",
	"FF99CCFF",
	"FFFF99CC",
	"FFCC99FF",
	"FFFFCC99",
	"FF3366FF",
	"FF33CCCC",
	"FF99CC00",
	"FFFFCC00",
	"FFFF9900",
	"FFFF6600",
	"FF666699",
	"FF969696",
	"FF003366",
	"FF339966",
	"FF003300",
	"FF333300",
	"FF993300",
	"FF993366",
	"FF333399",
	"FF333333"
];
var HLSMAX = 240;
var RGBMAX = 255;
function rgb2hls(r, g, b) {
	const maxc = Math.max(r, g, b);
	const minc = Math.min(r, g, b);
	const sumc = maxc + minc;
	const rangec = maxc - minc;
	const l = sumc / 2;
	let h, s;
	if (minc == maxc) return [
		0,
		l,
		0
	];
	if (l <= .5) s = rangec / sumc;
	else s = rangec / (2 - sumc);
	const rc = (maxc - r) / rangec;
	const gc = (maxc - g) / rangec;
	const bc = (maxc - b) / rangec;
	if (r == maxc) h = bc - gc;
	else if (g === maxc) h = 2 + rc - bc;
	else h = 4 + gc - rc;
	h = h / 6 % 1;
	return [
		h,
		l,
		s
	];
}
function rgb2MsHls(hex) {
	if (hex.length > 6) hex = hex.substring(2);
	const [h, l, s] = rgb2hls(parseInt(hex.slice(0, 2), 16) / RGBMAX, parseInt(hex.slice(2, 4), 16) / RGBMAX, parseInt(hex.slice(4, 6), 16) / RGBMAX);
	return [
		Math.round(h * HLSMAX),
		Math.round(l * HLSMAX),
		Math.round(s * HLSMAX)
	];
}
function msHls2Rgb(hue, lightness, saturation) {
	return tinycolor({
		h: hue / HLSMAX * 360,
		s: saturation / HLSMAX,
		l: lightness / HLSMAX
	}).toHex().toUpperCase();
}
function tintLuminance(tint, lum) {
	if (tint <= 0) return Math.round(lum * (1 + tint));
	return Math.round(lum * (1 - tint) + (HLSMAX - HLSMAX * (1 - tint)));
}
function getTintColor(hex, tint) {
	if (!hex) return hex;
	const [h, l, s] = rgb2MsHls(hex);
	return `FF${msHls2Rgb(h, tintLuminance(tint, l), s)}`;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet/worker/sheetjs/richText.js
var import_lib = require_lib();
var SPREADSHEETML_NAMESPACE = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
var MAX_RICH_TEXT_XML_LENGTH = 1e6;
var MAX_RICH_TEXT_RUNS = 1e4;
var SYMBOL_FONT_FAMILY = "\"Segoe UI Symbol\", \"Apple Symbols\", \"Noto Sans Symbols 2\", sans-serif";
var richTextCache = /* @__PURE__ */ new WeakMap();
var localName$1 = (node) => {
	const name = node.localName || node.nodeName;
	return name.split(":").pop() || name;
};
var childElements$1 = (node) => {
	if (!node) return [];
	return Array.from(node.childNodes).filter((child) => child.nodeType === 1);
};
var firstChild = (node, name) => {
	return childElements$1(node).find((child) => localName$1(child) === name);
};
var hasEnabledProperty = (element) => {
	if (!element) return false;
	const value = element.getAttribute("val");
	return value === null || ![
		"0",
		"false",
		"off",
		"none"
	].includes(value.toLowerCase());
};
var normalizeHexColor = (value) => {
	if (!value) return;
	const clean = value.replace(/^#/, "");
	if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(clean)) return;
	return `#${clean.length === 8 ? clean.slice(2) : clean}`;
};
var parseColor = (element) => {
	const rgb = normalizeHexColor((element === null || element === void 0 ? void 0 : element.getAttribute("rgb")) || null);
	if (rgb) return rgb;
	const indexedAttribute = element === null || element === void 0 ? void 0 : element.getAttribute("indexed");
	const indexed = indexedAttribute === null || indexedAttribute === void 0 || indexedAttribute === "" ? void 0 : Number(indexedAttribute);
	const indexedValue = Number.isInteger(indexed) ? indexedColors[indexed] : void 0;
	return indexedValue ? `#${indexedValue.slice(-6)}` : void 0;
};
var parseFontSize = (element) => {
	const value = Number(element === null || element === void 0 ? void 0 : element.getAttribute("val"));
	return Number.isFinite(value) && value > 0 ? value : void 0;
};
var normalizeSymbolText = (text, fontFamily) => {
	if ((fontFamily === null || fontFamily === void 0 ? void 0 : fontFamily.trim().toLowerCase()) !== "wingdings 2") return {
		text,
		fontFamily
	};
	let converted = false;
	return {
		text: Array.from(text, (character) => {
			if (character === "£") {
				converted = true;
				return "☐";
			}
			return character;
		}).join(""),
		fontFamily: converted ? SYMBOL_FONT_FAMILY : fontFamily
	};
};
var parseRun = (element) => {
	var _a, _b, _c;
	const properties = firstChild(element, "rPr");
	const rawText = ((_a = firstChild(element, "t")) === null || _a === void 0 ? void 0 : _a.textContent) || "";
	if (!rawText) return;
	const normalized = normalizeSymbolText(rawText, ((_b = firstChild(properties, "rFont")) === null || _b === void 0 ? void 0 : _b.getAttribute("val")) || void 0);
	const fontSize = parseFontSize(firstChild(properties, "sz"));
	const color = parseColor(firstChild(properties, "color"));
	const verticalAlign = (_c = firstChild(properties, "vertAlign")) === null || _c === void 0 ? void 0 : _c.getAttribute("val");
	return {
		text: normalized.text,
		...normalized.fontFamily ? { fontFamily: normalized.fontFamily } : {},
		...fontSize ? { fontSize } : {},
		...color ? { color } : {},
		...hasEnabledProperty(firstChild(properties, "b")) ? { bold: true } : {},
		...hasEnabledProperty(firstChild(properties, "i")) ? { italic: true } : {},
		...hasEnabledProperty(firstChild(properties, "u")) ? { underline: true } : {},
		...hasEnabledProperty(firstChild(properties, "strike")) ? { strike: true } : {},
		...verticalAlign === "superscript" ? { verticalAlign: "super" } : {},
		...verticalAlign === "subscript" ? { verticalAlign: "sub" } : {}
	};
};
var parseCellRichText = (cell) => {
	if (!cell) return;
	const cached = richTextCache.get(cell);
	if (cached !== void 0) return cached || void 0;
	const raw = cell.r;
	if (typeof raw !== "string" || !raw.includes("<r") || raw.length > MAX_RICH_TEXT_XML_LENGTH) {
		richTextCache.set(cell, null);
		return;
	}
	try {
		const root = new import_lib.DOMParser().parseFromString(`<si xmlns="${SPREADSHEETML_NAMESPACE}">${raw}</si>`, "application/xml").documentElement;
		if (!root || localName$1(root) === "parsererror") {
			richTextCache.set(cell, null);
			return;
		}
		const runElements = childElements$1(root).filter((child) => localName$1(child) === "r");
		if (runElements.length > MAX_RICH_TEXT_RUNS) {
			richTextCache.set(cell, null);
			return;
		}
		const runs = runElements.map(parseRun).filter((run) => !!run);
		const result = runs.length ? runs : void 0;
		richTextCache.set(cell, result || null);
		return result;
	} catch {
		richTextCache.set(cell, null);
		return;
	}
};
var richTextToPlainText = (runs) => {
	return (runs === null || runs === void 0 ? void 0 : runs.map((run) => run.text).join("")) || "";
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet/worker/sheetjs/SheetJsModel.js
var EXCEL_DEFAULT_COLUMN_WIDTH = 8.43;
var EXCEL_DEFAULT_ROW_HEIGHT_PT = 15;
var EXCEL_DEFAULT_TEXT_COLOR = "#202124";
var EMU_PER_PIXEL = 9525;
var DEFAULT_IMAGE_WIDTH = 480;
var DEFAULT_IMAGE_HEIGHT = 288;
var AUTO_FIT_MIN_WIDTH = 24;
var AUTO_FIT_PADDING = 8;
var AUTO_FIT_MAX_SAMPLE_CELLS = 1e5;
var AUTO_FIT_MAX_SAMPLE_WINDOWS = 8;
var AUTO_FIT_MAX_ROWS_PER_WINDOW = 128;
var createAutoFitSampleRanges = (totalRowCount, totalColCount) => {
	const totalRows = Math.max(totalRowCount, 1);
	const totalCols = Math.max(totalColCount, 1);
	const endColumn = totalCols - 1;
	if (totalRows * totalCols <= AUTO_FIT_MAX_SAMPLE_CELLS) return [{
		s: {
			r: 0,
			c: 0
		},
		e: {
			r: totalRows - 1,
			c: endColumn
		}
	}];
	const rowsPerWindow = Math.max(1, Math.min(AUTO_FIT_MAX_ROWS_PER_WINDOW, Math.floor(AUTO_FIT_MAX_SAMPLE_CELLS / totalCols / AUTO_FIT_MAX_SAMPLE_WINDOWS)));
	const maxStartRow = Math.max(totalRows - rowsPerWindow, 0);
	const maxWindowsWithinBudget = Math.max(1, Math.floor(AUTO_FIT_MAX_SAMPLE_CELLS / totalCols / rowsPerWindow));
	const windowCount = Math.min(AUTO_FIT_MAX_SAMPLE_WINDOWS, maxWindowsWithinBudget, Math.ceil(totalRows / rowsPerWindow));
	const starts = /* @__PURE__ */ new Set();
	for (let index = 0; index < windowCount; index += 1) {
		const startRow = windowCount === 1 ? 0 : Math.round(maxStartRow * index / (windowCount - 1));
		starts.add(startRow);
	}
	return Array.from(starts, (startRow) => ({
		s: {
			r: startRow,
			c: 0
		},
		e: {
			r: Math.min(startRow + rowsPerWindow - 1, totalRows - 1),
			c: endColumn
		}
	}));
};
var toFiniteNumber = (value) => {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
};
var getDefaultColumnWidth = () => {
	var _a;
	const converter = utils.col_width_to_px;
	const value = typeof converter === "function" ? converter(EXCEL_DEFAULT_COLUMN_WIDTH) : void 0;
	return Math.ceil((_a = toFiniteNumber(value)) !== null && _a !== void 0 ? _a : 64);
};
var getDefaultRowHeight = () => {
	var _a;
	const converter = utils.row_height_to_px;
	const value = typeof converter === "function" ? converter(EXCEL_DEFAULT_ROW_HEIGHT_PT) : void 0;
	return Math.ceil((_a = toFiniteNumber(value)) !== null && _a !== void 0 ? _a : 20);
};
var defaults = {
	rowHeight: getDefaultRowHeight(),
	colWidth: getDefaultColumnWidth()
};
var cellKey = (row, col) => {
	return `${row}-${col}`;
};
var formatCellValue = (cell) => {
	if (!cell) return "";
	const richText = parseCellRichText(cell);
	if (richText === null || richText === void 0 ? void 0 : richText.length) return richTextToPlainText(richText);
	if (cell.w !== void 0 && cell.w !== null) return `${cell.w}`;
	if (cell.v === void 0 || cell.v === null) return "";
	if (cell.t === "d" && cell.v instanceof Date) return cell.v.toLocaleDateString();
	return `${cell.v}`;
};
var getColumnPixelWidth = (column) => {
	if (!column) return;
	if (column.hidden) return 0;
	const wpx = toFiniteNumber(column.wpx);
	if (wpx !== void 0 && wpx >= 0) return Math.ceil(wpx);
	const width = toFiniteNumber(column.width);
	if (width === 0) return 0;
	if (width !== void 0 && width > 0) {
		const converter = utils.col_width_to_px;
		const converted = typeof converter === "function" ? toFiniteNumber(converter(width)) : void 0;
		if (converted !== void 0) return Math.ceil(converted);
		return Math.ceil(width * (column.MDW || 7));
	}
	const wch = toFiniteNumber(column.wch);
	if (wch === 0) return 0;
	if (wch !== void 0 && wch > 0) return Math.ceil(wch * (column.MDW || 7) + 5);
};
var getVectorSize = (sizes, index, fallback) => {
	var _a;
	if (typeof sizes === "number") return sizes;
	return (_a = sizes === null || sizes === void 0 ? void 0 : sizes[index]) !== null && _a !== void 0 ? _a : fallback;
};
var emuToPixels = (value) => {
	return (value || 0) / EMU_PER_PIXEL;
};
var hasColumnWidth = (column) => {
	var _a, _b, _c;
	if (!column) return false;
	if (column.hidden) return true;
	return ((_a = toFiniteNumber(column.wpx)) !== null && _a !== void 0 ? _a : -1) >= 0 || ((_b = toFiniteNumber(column.width)) !== null && _b !== void 0 ? _b : -1) >= 0 || ((_c = toFiniteNumber(column.wch)) !== null && _c !== void 0 ? _c : -1) >= 0;
};
var getRowPixelHeight = (rowMeta) => {
	if (!rowMeta) return;
	if (rowMeta.hidden) return 0;
	const hpx = toFiniteNumber(rowMeta.hpx);
	if (hpx !== void 0 && hpx >= 0) return Math.ceil(hpx);
	const hpt = toFiniteNumber(rowMeta.hpt);
	if (hpt !== void 0 && hpt >= 0) {
		const converter = utils.row_height_to_px;
		const converted = typeof converter === "function" ? toFiniteNumber(converter(hpt)) : void 0;
		return Math.ceil(converted !== null && converted !== void 0 ? converted : hpt * 96 / 72);
	}
};
var normalizeHorizontalAlign = (value) => {
	switch (`${value || ""}`) {
		case "left": return "Left";
		case "center":
		case "centerContinuous":
		case "distributed":
		case "justify": return "Center";
		case "right": return "Right";
		default: return;
	}
};
var normalizeVerticalAlign = (value) => {
	switch (`${value || ""}`) {
		case "top": return "Top";
		case "center":
		case "middle":
		case "distributed":
		case "justify": return "Middle";
		case "bottom": return "Bottom";
		default: return;
	}
};
var alignToClassName = (alignment) => {
	if (!alignment) return "";
	const classNames = [normalizeHorizontalAlign(alignment.horizontal), normalizeVerticalAlign(alignment.vertical)].filter(Boolean).map((value) => `ht${value}`);
	if (alignment.wrapText) classNames.push("htWrap");
	if (alignment.shrinkToFit) classNames.push("htShrink");
	return classNames.join(" ");
};
var normalizeColor = (color) => {
	if (!color) return;
	const tintedRgb = color.raw_rgb && typeof color.tint === "number" ? getTintColor(color.raw_rgb, color.tint) : void 0;
	const rgb = color.rgb || tintedRgb || color.raw_rgb;
	if (typeof rgb === "string" && rgb) {
		const clean = rgb.startsWith("#") ? rgb.slice(1) : rgb;
		return `#${clean.length > 6 ? clean.slice(-6) : clean}`;
	}
	const indexed = typeof color.indexed === "number" ? color.indexed : color.index;
	if (typeof indexed === "number") {
		const value = indexedColors[indexed];
		if (value) return `#${value.slice(-6)}`;
	}
};
var isAutomaticPaletteColor = (color) => {
	if (!color) return false;
	return (typeof color.indexed === "number" ? color.indexed : color.index) === 32767;
};
var normalizeFontColor = (color) => {
	if (isAutomaticPaletteColor(color)) return EXCEL_DEFAULT_TEXT_COLOR;
	return normalizeColor(color);
};
var borderWidthFromStyle = (borderStyle) => {
	switch (borderStyle) {
		case "hair": return "0.5px";
		case "medium":
		case "mediumDashed":
		case "mediumDashDot":
		case "mediumDashDotDot": return "2px";
		case "thick":
		case "double": return "3px";
		default: return "1px";
	}
};
var borderStyleToCss = (borderStyle) => {
	switch (borderStyle) {
		case "dashed":
		case "mediumDashed":
		case "dashDot":
		case "mediumDashDot":
		case "dashDotDot":
		case "mediumDashDotDot":
		case "slantDashDot": return "dashed";
		case "dotted": return "dotted";
		case "double": return "double";
		default: return "solid";
	}
};
var mergeStyle = (...styles) => {
	const result = {};
	styles.forEach((style) => {
		if (!style) return;
		Object.entries(style).forEach(([key, value]) => {
			if (value && typeof value === "object" && !Array.isArray(value)) {
				result[key] = {
					...result[key] && typeof result[key] === "object" ? result[key] : {},
					...value
				};
				return;
			}
			result[key] = value;
		});
	});
	return Object.keys(result).length ? result : void 0;
};
var resolveTableCellStyle = (worksheet, rowIndex, colIndex, baseStyle) => {
	const resolver = utils.resolve_table_cell_style;
	return typeof resolver === "function" ? resolver(worksheet, rowIndex, colIndex, baseStyle) : baseStyle;
};
var getCellStyle = (cellStyle) => {
	const style = {};
	const fill = (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.fill) || {};
	const fillColor = normalizeColor(fill.fgColor || (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.fgColor) || fill.bgColor || (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.bgColor));
	const patternType = fill.patternType || (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.patternType);
	if (fillColor && patternType !== "none") style.backgroundColor = fillColor;
	const font = (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.font) || {};
	const fontColor = normalizeFontColor(font.color || (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.color));
	if (fontColor) style.color = fontColor;
	if (font.italic || (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.italic)) style.fontStyle = "italic";
	if (font.bold || (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.bold)) style.fontWeight = "bold";
	const fontSize = font.sz || (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.sz);
	if (fontSize) style.fontSize = `${fontSize}px`;
	const fontName = font.name || (cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.name);
	if (fontName) style.fontFamily = fontName;
	const border = cellStyle === null || cellStyle === void 0 ? void 0 : cellStyle.border;
	if (border) [
		"top",
		"right",
		"bottom",
		"left"
	].forEach((side) => {
		const borderItem = border[side];
		if (!(borderItem === null || borderItem === void 0 ? void 0 : borderItem.style) || borderItem.style === "none") return;
		const prefix = `border${side.charAt(0).toUpperCase()}${side.slice(1)}`;
		style[`${prefix}Width`] = borderWidthFromStyle(borderItem.style);
		style[`${prefix}Style`] = borderStyleToCss(borderItem.style);
		style[`${prefix}Color`] = normalizeColor(borderItem.color) || "#000000";
	});
	return Object.keys(style).length ? style : void 0;
};
var fixMatrix = (data, colLen) => {
	for (const row of data) for (let index = 0; index < colLen; index += 1) if (row[index] === void 0 || row[index] === null) row[index] = "";
	return data;
};
var SheetJsModel = class SheetJsModel {
	static create(ws, options = {}) {
		return new SheetJsModel(ws, options);
	}
	constructor(ws, options) {
		this._ws = ws;
		this._startRow = Math.max(options.startRow || 0, 0);
		this._pageSize = Math.max(options.pageSize || 500, 1);
		this._totalRows = options.totalRows;
		this._totalCols = options.totalCols;
		this._charts = options.charts || [];
		this._cellImages = options.cellImages || [];
		this._cellImageKeys = new Set(this._cellImages.map((image) => cellKey(image.row, image.col)));
		const { "!ref": refs } = ws;
		this.range = utils.decode_range(refs || "A1");
	}
	get ws() {
		return this._ws;
	}
	get defaults() {
		return SheetJsModel.defaults;
	}
	get data() {
		var _a;
		return (_a = this._data) !== null && _a !== void 0 ? _a : this._data = this.getData();
	}
	get cell() {
		var _a;
		return (_a = this._cell) !== null && _a !== void 0 ? _a : this._cell = this.getCell();
	}
	get merge() {
		var _a;
		return (_a = this._merge) !== null && _a !== void 0 ? _a : this._merge = this.getMerge();
	}
	get columns() {
		var _a;
		return (_a = this._columns) !== null && _a !== void 0 ? _a : this._columns = this.getColumns();
	}
	get structure() {
		var _a;
		return (_a = this._structure) !== null && _a !== void 0 ? _a : this._structure = this.getStructure();
	}
	get rowHeights() {
		var _a;
		return (_a = this._rowHeights) !== null && _a !== void 0 ? _a : this._rowHeights = this.getRowHeights();
	}
	get colWidths() {
		var _a;
		return (_a = this._colWidths) !== null && _a !== void 0 ? _a : this._colWidths = this.getColWidths();
	}
	get meta() {
		var _a;
		return (_a = this._meta) !== null && _a !== void 0 ? _a : this._meta = {
			startRow: this.startRow,
			endRow: this.endRow,
			pageSize: this._pageSize,
			totalRows: this.totalRows,
			totalCols: this.totalCols
		};
	}
	get totalRows() {
		var _a;
		return (_a = this._totalRows) !== null && _a !== void 0 ? _a : this.range.e.r + 1;
	}
	get totalCols() {
		var _a;
		return (_a = this._totalCols) !== null && _a !== void 0 ? _a : this.range.e.c + 1;
	}
	get startRow() {
		return Math.min(this._startRow, Math.max(this.totalRows - 1, 0));
	}
	get endRow() {
		return Math.min(this.startRow + this._pageSize, this.totalRows);
	}
	get denseRows() {
		const worksheet = this.ws;
		if (Array.isArray(worksheet)) return worksheet;
		return Array.isArray(worksheet["!data"]) ? worksheet["!data"] : void 0;
	}
	getCellAt(row, col) {
		var _a;
		const rows = this.denseRows;
		if (rows) return (_a = rows[row]) === null || _a === void 0 ? void 0 : _a[col];
		return this.ws[utils.encode_cell({
			r: row,
			c: col
		})];
	}
	getAxisOffset(index, sizes, fallback) {
		let offset = 0;
		for (let current = 0; current < index; current += 1) offset += getVectorSize(sizes, current, fallback);
		return offset;
	}
	getMarkerLeft(marker) {
		if (!marker) return 0;
		return this.getAxisOffset(marker.col || 0, this.getColWidths(), this.defaults.colWidth) + emuToPixels(marker.colOff);
	}
	getMarkerTop(marker) {
		if (!marker) return 0;
		return this.getAxisOffset(marker.row || 0, this.getAllRowHeights(), this.defaults.rowHeight) + emuToPixels(marker.rowOff);
	}
	getImages() {
		const drawings = this.ws["!drawings"];
		const images = (drawings === null || drawings === void 0 ? void 0 : drawings.images) || [];
		if (!images.length && !this._cellImages.length) return;
		const drawingImages = images.flatMap((image, index) => {
			var _a, _b, _c, _d, _e;
			const anchor = image.anchor;
			if (!image.dataURI || !anchor) return [];
			const from = anchor.from;
			const left = from ? this.getMarkerLeft(from) : emuToPixels((_a = anchor.pos) === null || _a === void 0 ? void 0 : _a.x);
			const top = from ? this.getMarkerTop(from) : emuToPixels((_b = anchor.pos) === null || _b === void 0 ? void 0 : _b.y);
			const right = anchor.to ? this.getMarkerLeft(anchor.to) : left + emuToPixels((_c = anchor.ext) === null || _c === void 0 ? void 0 : _c.cx);
			const bottom = anchor.to ? this.getMarkerTop(anchor.to) : top + emuToPixels((_d = anchor.ext) === null || _d === void 0 ? void 0 : _d.cy);
			return [{
				id: image.id || ((_e = image.objectId) === null || _e === void 0 ? void 0 : _e.toString()) || image.target || `image-${index + 1}`,
				src: image.dataURI,
				contentType: image.contentType,
				left: Math.max(0, left),
				top: Math.max(0, top),
				width: Math.max(1, right > left ? right - left : DEFAULT_IMAGE_WIDTH),
				height: Math.max(1, bottom > top ? bottom - top : DEFAULT_IMAGE_HEIGHT),
				row: (from === null || from === void 0 ? void 0 : from.row) || 0,
				col: (from === null || from === void 0 ? void 0 : from.col) || 0
			}];
		});
		const cellImages = this._cellImages.flatMap((image) => {
			const width = getVectorSize(this.getColWidths(), image.col, this.defaults.colWidth);
			const height = getVectorSize(this.getAllRowHeights(), image.row, this.defaults.rowHeight);
			if (width <= 0 || height <= 0) return [];
			return [{
				...image,
				left: this.getAxisOffset(image.col, this.getColWidths(), this.defaults.colWidth),
				top: this.getAxisOffset(image.row, this.getAllRowHeights(), this.defaults.rowHeight),
				width,
				height
			}];
		});
		const result = [...drawingImages, ...cellImages];
		return result.length ? result : void 0;
	}
	getCharts() {
		const result = this._charts.map((chart) => {
			var _a, _b;
			const left = this.getMarkerLeft(chart.from);
			const top = this.getMarkerTop(chart.from);
			const right = chart.to ? this.getMarkerLeft(chart.to) : left + emuToPixels((_a = chart.ext) === null || _a === void 0 ? void 0 : _a.width);
			const bottom = chart.to ? this.getMarkerTop(chart.to) : top + emuToPixels((_b = chart.ext) === null || _b === void 0 ? void 0 : _b.height);
			return {
				id: chart.id,
				type: chart.type,
				title: chart.title,
				categoryAxisTitle: chart.categoryAxisTitle,
				valueAxisTitle: chart.valueAxisTitle,
				barDirection: chart.barDirection,
				grouping: chart.grouping,
				scatterStyle: chart.scatterStyle,
				legendPosition: chart.legendPosition,
				series: chart.series,
				left: Math.max(0, left),
				top: Math.max(0, top),
				width: Math.max(1, right > left ? right - left : DEFAULT_IMAGE_WIDTH),
				height: Math.max(1, bottom > top ? bottom - top : DEFAULT_IMAGE_HEIGHT),
				row: chart.from.row,
				col: chart.from.col
			};
		});
		return result.length ? result : void 0;
	}
	getAllMerge() {
		const { "!merges": merges = [] } = this.ws;
		return merges.map((merge) => {
			const { r: top, c: left } = merge.s;
			const { r: bottom, c: right } = merge.e;
			return {
				row: top,
				col: left,
				rowspan: bottom - top + 1,
				colspan: right - left + 1
			};
		});
	}
	getData() {
		const result = [];
		const rows = this.denseRows;
		for (let rowIndex = this.startRow; rowIndex < this.endRow; rowIndex += 1) {
			const row = rows === null || rows === void 0 ? void 0 : rows[rowIndex];
			const values = row ? row.slice(0, this.totalCols).map((cell, colIndex) => this._cellImageKeys.has(cellKey(rowIndex, colIndex)) ? "" : formatCellValue(cell)) : Array.from({ length: this.totalCols }, (_, colIndex) => this._cellImageKeys.has(cellKey(rowIndex, colIndex)) ? "" : formatCellValue(this.getCellAt(rowIndex, colIndex)));
			result.push(values);
		}
		return fixMatrix(result, this.totalCols);
	}
	getCell() {
		var _a, _b;
		const result = {};
		const { "!cols": cols = [], "!rows": rows = [] } = this.ws;
		for (let rowIndex = this.startRow; rowIndex < this.endRow; rowIndex += 1) for (let colIndex = 0; colIndex < this.totalCols; colIndex += 1) {
			const cell = this.getCellAt(rowIndex, colIndex);
			const inheritedStyle = mergeStyle((_a = cols[colIndex]) === null || _a === void 0 ? void 0 : _a.s, (_b = rows[rowIndex]) === null || _b === void 0 ? void 0 : _b.s, cell === null || cell === void 0 ? void 0 : cell.s);
			const rawStyle = resolveTableCellStyle(this.ws, rowIndex, colIndex, inheritedStyle);
			const className = alignToClassName(rawStyle === null || rawStyle === void 0 ? void 0 : rawStyle.alignment);
			const style = getCellStyle(rawStyle);
			const richText = parseCellRichText(cell);
			if (!className && !style && !(richText === null || richText === void 0 ? void 0 : richText.length)) continue;
			result[cellKey(rowIndex - this.startRow, colIndex)] = {
				...className ? { className } : {},
				style: style || {},
				...(richText === null || richText === void 0 ? void 0 : richText.length) ? { richText } : {}
			};
		}
		return result;
	}
	getMerge() {
		return this.getAllMerge().flatMap((merge) => {
			if (merge.row + merge.rowspan - 1 < this.startRow || merge.row >= this.endRow || merge.row < this.startRow) return [];
			return {
				...merge,
				row: merge.row - this.startRow
			};
		});
	}
	getRowHeights() {
		const { rowHeight } = this.defaults;
		const { "!rows": rows = [] } = this.ws;
		const heights = [];
		if (rows.length && this.endRow > this.startRow) for (let absoluteRow = this.startRow; absoluteRow < this.endRow; absoluteRow += 1) {
			const height = getRowPixelHeight(rows[absoluteRow]);
			if (height !== void 0) heights[absoluteRow - this.startRow] = height;
		}
		if (heights.length === 1) return heights[0];
		return heights.length ? heights : rowHeight;
	}
	getAllRowHeights() {
		const { "!rows": rows = [] } = this.ws;
		const heights = [];
		if (rows.length) for (let absoluteRow = 0; absoluteRow < this.totalRows; absoluteRow += 1) {
			const height = getRowPixelHeight(rows[absoluteRow]);
			if (height !== void 0) heights[absoluteRow] = height;
		}
		return heights.length ? heights : void 0;
	}
	getAutoFitColumns() {
		var _a, _b;
		const autoFitColumns = utils.auto_fit_columns || utils.autofit_columns;
		if (typeof autoFitColumns !== "function") return;
		try {
			const sampleRanges = this.getAutoFitSampleRanges();
			const fittedColumns = [];
			for (const range of sampleRanges) {
				const measuredColumns = autoFitColumns(this.ws, {
					range,
					set: false,
					skipHidden: true,
					includeMerged: false,
					minPx: AUTO_FIT_MIN_WIDTH,
					padding: AUTO_FIT_PADDING
				});
				for (let colIndex = 0; colIndex < this.totalCols; colIndex += 1) {
					const measured = measuredColumns === null || measuredColumns === void 0 ? void 0 : measuredColumns[colIndex];
					if (!measured) continue;
					const currentWidth = (_a = getColumnPixelWidth(fittedColumns[colIndex])) !== null && _a !== void 0 ? _a : -1;
					const measuredWidth = (_b = getColumnPixelWidth(measured)) !== null && _b !== void 0 ? _b : -1;
					if (!fittedColumns[colIndex] || measuredWidth > currentWidth) fittedColumns[colIndex] = measured;
				}
			}
			return fittedColumns.length ? fittedColumns : void 0;
		} catch (error) {
			console.warn("[file-viewer] Excel 自动列宽计算失败，已回退到原始列宽。", error);
			return;
		}
	}
	getAutoFitSampleRanges() {
		return createAutoFitSampleRanges(this.totalRows, this.totalCols);
	}
	get autoFitColumns() {
		if (this._autoFitColumns === void 0) this._autoFitColumns = this.getAutoFitColumns() || null;
		return this._autoFitColumns || void 0;
	}
	getColumnMeta(sourceCols, colIndex) {
		var _a;
		const sourceColumn = sourceCols[colIndex];
		if (hasColumnWidth(sourceColumn)) return sourceColumn;
		if (this.hasAnchoredObjects) return sourceColumn;
		return ((_a = this.autoFitColumns) === null || _a === void 0 ? void 0 : _a[colIndex]) || sourceColumn;
	}
	get hasAnchoredObjects() {
		var _a;
		const drawings = this.ws["!drawings"];
		return !!((_a = drawings === null || drawings === void 0 ? void 0 : drawings.images) === null || _a === void 0 ? void 0 : _a.length) || !!this._charts.length || !!this._cellImages.length;
	}
	getColWidths() {
		const { colWidth } = this.defaults;
		const { "!cols": sourceCols = [] } = this.ws;
		const widths = [];
		for (let colIndex = 0; colIndex < this.totalCols; colIndex += 1) {
			const width = getColumnPixelWidth(this.getColumnMeta(sourceCols, colIndex));
			if (width !== void 0) widths[colIndex] = width;
		}
		return widths.length ? widths : colWidth;
	}
	getColumns() {
		const { "!cols": sourceCols = [] } = this.ws;
		return Array.from({ length: this.totalCols }, (_, index) => {
			var _a;
			const column = this.getColumnMeta(sourceCols, index);
			return {
				key: index + 1,
				title: utils.encode_col(index),
				hidden: !!(column === null || column === void 0 ? void 0 : column.hidden),
				editor: false,
				className: alignToClassName((_a = column === null || column === void 0 ? void 0 : column.s) === null || _a === void 0 ? void 0 : _a.alignment),
				renderer: "styleRender"
			};
		});
	}
	getStructure() {
		return {
			merge: this.getAllMerge(),
			colWidths: this.getColWidths(),
			rowHeights: this.getAllRowHeights(),
			columns: this.getColumns(),
			images: this.getImages(),
			charts: this.getCharts()
		};
	}
	toObject(options = {}) {
		const { defaults, data, cell, merge, rowHeights, meta } = this;
		return {
			defaults,
			data,
			cell,
			merge,
			rowHeights,
			...options.includeLayout === false ? {} : {
				colWidths: this.colWidths,
				columns: this.columns
			},
			meta
		};
	}
};
SheetJsModel.defaults = defaults;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet/worker/sheetjs/chartParser.js
var import_jszip_min = /* @__PURE__ */ __toESM(require_jszip_min(), 1);
var CHART_RELATIONSHIP_SUFFIX = "/chart";
var DRAWING_RELATIONSHIP_SUFFIX = "/drawing";
var WORKSHEET_RELATIONSHIP_SUFFIX$1 = "/worksheet";
var EMUS_PER_CSS_PIXEL = 9525;
var CHART_TYPE_MAP = {
	areaChart: "area",
	area3DChart: "area",
	barChart: "bar",
	bar3DChart: "bar",
	doughnutChart: "doughnut",
	lineChart: "line",
	line3DChart: "line",
	pieChart: "pie",
	pie3DChart: "pie",
	radarChart: "radar",
	scatterChart: "scatter"
};
var LEGEND_POSITION_MAP = {
	b: "bottom",
	l: "left",
	r: "right",
	t: "top",
	tr: "top"
};
var SCHEME_COLORS = {
	accent1: "#4472c4",
	accent2: "#ed7d31",
	accent3: "#a5a5a5",
	accent4: "#ffc000",
	accent5: "#5b9bd5",
	accent6: "#70ad47",
	dk1: "#000000",
	dk2: "#44546a",
	lt1: "#ffffff",
	lt2: "#e7e6e6",
	tx1: "#000000",
	tx2: "#44546a"
};
var localName = (node) => {
	const name = node.localName || node.nodeName;
	return name.split(":").pop() || name;
};
var childElements = (node) => {
	if (!node) return [];
	return Array.from(node.childNodes).filter((child) => child.nodeType === 1);
};
var childrenByLocal = (node, name) => {
	return childElements(node).filter((child) => localName(child) === name);
};
var firstChildByLocal = (node, name) => {
	return childrenByLocal(node, name)[0];
};
var elementsByLocal = (node, name) => {
	const result = [];
	const visit = (current) => {
		childElements(current).forEach((child) => {
			if (localName(child) === name) result.push(child);
			visit(child);
		});
	};
	if (node) visit(node);
	return result;
};
var firstByLocal = (node, name) => {
	return elementsByLocal(node, name)[0];
};
var numericAttribute = (element, name = "val") => {
	const value = Number(element === null || element === void 0 ? void 0 : element.getAttribute(name));
	return Number.isFinite(value) ? value : 0;
};
var textContent$1 = (element) => {
	var _a;
	return ((_a = element === null || element === void 0 ? void 0 : element.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "";
};
var relationshipId = (element) => {
	if (!element) return "";
	return element.getAttribute("r:id") || element.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || "";
};
var resolvePartPath = (sourcePart, target) => {
	const sourceDirectory = sourcePart.includes("/") ? sourcePart.slice(0, sourcePart.lastIndexOf("/")) : "";
	const parts = (target.startsWith("/") ? target.slice(1) : `${sourceDirectory}/${target}`).split("/");
	const normalized = [];
	for (const part of parts) {
		if (!part || part === ".") continue;
		if (part === "..") {
			normalized.pop();
			continue;
		}
		normalized.push(part);
	}
	return normalized.join("/");
};
var relationshipPartPath = (sourcePart) => {
	const slash = sourcePart.lastIndexOf("/");
	const directory = slash >= 0 ? sourcePart.slice(0, slash) : "";
	const filename = slash >= 0 ? sourcePart.slice(slash + 1) : sourcePart;
	return `${directory ? `${directory}/` : ""}_rels/${filename}.rels`;
};
var parseXml = (xml) => {
	return new import_lib.DOMParser().parseFromString(xml.replace(/^[\uFEFF\s]+/, ""), "application/xml");
};
var loadXml = async (zip, path) => {
	const file = zip.file(path);
	if (!file) return null;
	return parseXml(await file.async("text"));
};
var loadRelationships = async (zip, sourcePart) => {
	const document = await loadXml(zip, relationshipPartPath(sourcePart));
	if (!document) return [];
	return elementsByLocal(document.documentElement, "Relationship").flatMap((element) => {
		const id = element.getAttribute("Id") || "";
		const target = element.getAttribute("Target") || "";
		const type = element.getAttribute("Type") || "";
		if (!id || !target || element.getAttribute("TargetMode") === "External") return [];
		return [{
			id,
			target: resolvePartPath(sourcePart, target),
			type
		}];
	});
};
var relationById = (relationships, id) => {
	return relationships.find((relationship) => relationship.id === id);
};
var parseMarker = (element) => {
	if (!element) return;
	return {
		row: Number(textContent$1(firstChildByLocal(element, "row"))) || 0,
		col: Number(textContent$1(firstChildByLocal(element, "col"))) || 0,
		rowOff: Number(textContent$1(firstChildByLocal(element, "rowOff"))) || 0,
		colOff: Number(textContent$1(firstChildByLocal(element, "colOff"))) || 0
	};
};
var columnIndex = (letters) => {
	let result = 0;
	for (const letter of letters.toUpperCase()) result = result * 26 + letter.charCodeAt(0) - 64;
	return result - 1;
};
var parseCellAddress = (address) => {
	const match = /^\$?([A-Z]{1,3})\$?(\d+)$/i.exec(address.trim());
	if (!match) return null;
	return {
		col: columnIndex(match[1]),
		row: Number(match[2]) - 1
	};
};
var encodeCellAddress = (row, col) => {
	let value = col + 1;
	let letters = "";
	while (value > 0) {
		const remainder = (value - 1) % 26;
		letters = String.fromCharCode(65 + remainder) + letters;
		value = Math.floor((value - 1) / 26);
	}
	return `${letters}${row + 1}`;
};
var getWorksheetCell = (worksheet, row, col) => {
	var _a, _b;
	return ((_b = (_a = worksheet["!data"]) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[col]) || worksheet[encodeCellAddress(row, col)];
};
var parseFormulaRange = (formula) => {
	const normalized = formula.trim().replace(/^=/, "");
	const separator = normalized.lastIndexOf("!");
	if (separator <= 0) return null;
	const sheetToken = normalized.slice(0, separator).trim();
	const rangeToken = normalized.slice(separator + 1).trim();
	if (!sheetToken || sheetToken.includes("[")) return null;
	const sheetName = sheetToken.startsWith("'") && sheetToken.endsWith("'") ? sheetToken.slice(1, -1).replace(/''/g, "'") : sheetToken;
	const [startToken, endToken = startToken] = rangeToken.split(":");
	const start = parseCellAddress(startToken);
	const end = parseCellAddress(endToken);
	if (!sheetName || !start || !end) return null;
	return {
		sheetName,
		start: {
			row: Math.min(start.row, end.row),
			col: Math.min(start.col, end.col)
		},
		end: {
			row: Math.max(start.row, end.row),
			col: Math.max(start.col, end.col)
		}
	};
};
var resolveFormulaValues = (formula, workbook, formatted) => {
	var _a;
	const range = parseFormulaRange(formula);
	const worksheet = range && ((_a = workbook === null || workbook === void 0 ? void 0 : workbook.Sheets) === null || _a === void 0 ? void 0 : _a[range.sheetName]);
	if (!range || !worksheet) return [];
	const values = [];
	for (let row = range.start.row; row <= range.end.row; row += 1) for (let col = range.start.col; col <= range.end.col; col += 1) {
		const cell = getWorksheetCell(worksheet, row, col);
		const value = formatted && (cell === null || cell === void 0 ? void 0 : cell.w) !== void 0 ? cell.w : cell === null || cell === void 0 ? void 0 : cell.v;
		values.push(value === void 0 || value === null ? "" : `${value}`);
	}
	return values;
};
var parsePointValues = (element, workbook, formatted = true) => {
	if (!element) return [];
	const cachedValues = elementsByLocal(element, "pt").map((point) => ({
		index: Number(point.getAttribute("idx")) || 0,
		value: textContent$1(firstChildByLocal(point, "v")) || textContent$1(firstByLocal(point, "v"))
	})).sort((left, right) => left.index - right.index).map((point) => point.value);
	if (cachedValues.length) return cachedValues;
	const formula = textContent$1(firstByLocal(element, "f"));
	return formula ? resolveFormulaValues(formula, workbook, formatted) : [];
};
var chartText = (element, workbook) => {
	if (!element) return "";
	const points = parsePointValues(element, workbook);
	if (points.length) return points.join(" ").trim();
	const richText = elementsByLocal(element, "t").map(textContent$1).filter(Boolean).join(" ").trim();
	if (richText) return richText;
	return textContent$1(firstByLocal(element, "v"));
};
var parseSeriesColor = (series) => {
	var _a, _b;
	const solidFill = firstByLocal(firstChildByLocal(series, "spPr"), "solidFill");
	const rgb = (_a = firstByLocal(solidFill, "srgbClr")) === null || _a === void 0 ? void 0 : _a.getAttribute("val");
	if (rgb && /^[0-9a-f]{6}$/i.test(rgb)) return `#${rgb}`;
	return SCHEME_COLORS[((_b = firstByLocal(solidFill, "schemeClr")) === null || _b === void 0 ? void 0 : _b.getAttribute("val")) || ""];
};
var parseSeriesLine = (series) => {
	var _a;
	const line = firstChildByLocal(firstChildByLocal(series, "spPr"), "ln");
	const widthEmus = Number(line === null || line === void 0 ? void 0 : line.getAttribute("w"));
	return {
		lineWidth: Number.isFinite(widthEmus) && widthEmus > 0 ? widthEmus / EMUS_PER_CSS_PIXEL : void 0,
		lineDash: ((_a = firstChildByLocal(line, "prstDash")) === null || _a === void 0 ? void 0 : _a.getAttribute("val")) || void 0,
		lineVisible: line ? !firstChildByLocal(line, "noFill") : void 0
	};
};
var parseSeriesMarker = (series) => {
	var _a, _b;
	const marker = firstChildByLocal(series, "marker");
	if (!marker) return;
	const symbol = ((_a = firstChildByLocal(marker, "symbol")) === null || _a === void 0 ? void 0 : _a.getAttribute("val")) || "auto";
	const sizeValue = Number((_b = firstChildByLocal(marker, "size")) === null || _b === void 0 ? void 0 : _b.getAttribute("val"));
	return {
		symbol,
		size: Number.isFinite(sizeValue) && sizeValue > 0 ? sizeValue : void 0
	};
};
var parseSeries = (chartNode, workbook) => {
	const chartType = CHART_TYPE_MAP[localName(chartNode)];
	const compactLineSeries = chartType === "line" || chartType === "area" || chartType === "scatter" || chartType === "radar";
	return childrenByLocal(chartNode, "ser").map((series, index) => {
		const tx = firstChildByLocal(series, "tx");
		const category = firstChildByLocal(series, "cat") || firstChildByLocal(series, "xVal");
		const value = firstChildByLocal(series, "val") || firstChildByLocal(series, "yVal");
		const categories = parsePointValues(category, workbook);
		const values = parsePointValues(value, workbook, false).map(Number).filter(Number.isFinite);
		const result = {
			name: chartText(tx, workbook) || `Series ${index + 1}`,
			categories: categories.length ? categories : values.map((_, valueIndex) => `${valueIndex + 1}`),
			values,
			color: parseSeriesColor(series),
			...parseSeriesLine(series),
			marker: parseSeriesMarker(series)
		};
		if (!compactLineSeries || values.length <= 4096) return result;
		const sourcePointIndexes = extremaPointIndexes(values, MAX_TRANSFERRED_LINE_CHART_POINTS);
		return {
			...result,
			categories: sourcePointIndexes.map((sourceIndex) => {
				var _a;
				return (_a = result.categories[sourceIndex]) !== null && _a !== void 0 ? _a : `${sourceIndex + 1}`;
			}),
			values: sourcePointIndexes.map((sourceIndex) => values[sourceIndex]),
			sourcePointCount: values.length,
			sourcePointIndexes
		};
	});
};
var parseChart = (document, workbook) => {
	var _a, _b, _c, _d;
	const root = document.documentElement;
	const chart = firstByLocal(root, "chart");
	const plotArea = firstChildByLocal(chart, "plotArea") || firstByLocal(chart, "plotArea");
	const chartEntry = childElements(plotArea).map((element) => ({
		element,
		type: CHART_TYPE_MAP[localName(element)]
	})).find((entry) => entry.type);
	if (!chartEntry) return null;
	const legend = firstChildByLocal(chart, "legend");
	const legendPositionValue = ((_a = firstChildByLocal(legend, "legendPos")) === null || _a === void 0 ? void 0 : _a.getAttribute("val")) || "";
	const categoryAxis = firstChildByLocal(plotArea, "catAx");
	const valueAxis = firstChildByLocal(plotArea, "valAx");
	const barDirection = ((_b = firstChildByLocal(chartEntry.element, "barDir")) === null || _b === void 0 ? void 0 : _b.getAttribute("val")) === "bar" ? "bar" : "column";
	return {
		type: chartEntry.type,
		title: chartText(firstChildByLocal(chart, "title"), workbook) || void 0,
		categoryAxisTitle: chartText(firstChildByLocal(categoryAxis, "title"), workbook) || void 0,
		valueAxisTitle: chartText(firstChildByLocal(valueAxis, "title"), workbook) || void 0,
		barDirection,
		grouping: ((_c = firstChildByLocal(chartEntry.element, "grouping")) === null || _c === void 0 ? void 0 : _c.getAttribute("val")) || void 0,
		scatterStyle: ((_d = firstChildByLocal(chartEntry.element, "scatterStyle")) === null || _d === void 0 ? void 0 : _d.getAttribute("val")) || void 0,
		legendPosition: legend ? LEGEND_POSITION_MAP[legendPositionValue] || "bottom" : void 0,
		series: parseSeries(chartEntry.element, workbook)
	};
};
var parseDrawingCharts = async (zip, drawingPart, workbook) => {
	const [document, relationships] = await Promise.all([loadXml(zip, drawingPart), loadRelationships(zip, drawingPart)]);
	if (!document) return [];
	const anchors = childElements(document.documentElement).filter((element) => localName(element).endsWith("Anchor"));
	return (await Promise.all(anchors.map(async (anchor, index) => {
		var _a;
		const chartReference = firstByLocal(anchor, "chart");
		const chartRelationship = relationById(relationships, relationshipId(chartReference));
		if (!(chartRelationship === null || chartRelationship === void 0 ? void 0 : chartRelationship.type.endsWith(CHART_RELATIONSHIP_SUFFIX))) return null;
		const chartDocument = await loadXml(zip, chartRelationship.target);
		const chart = chartDocument ? parseChart(chartDocument, workbook) : null;
		if (!chart || !chart.series.length || chart.series.every((series) => !series.values.length)) return null;
		const from = parseMarker(firstChildByLocal(anchor, "from")) || {
			row: 0,
			col: 0,
			rowOff: numericAttribute(firstChildByLocal(anchor, "pos"), "y"),
			colOff: numericAttribute(firstChildByLocal(anchor, "pos"), "x")
		};
		const to = parseMarker(firstChildByLocal(anchor, "to"));
		const extElement = firstChildByLocal(anchor, "ext");
		const name = (_a = firstByLocal(anchor, "cNvPr")) === null || _a === void 0 ? void 0 : _a.getAttribute("name");
		return {
			...chart,
			id: name || chartRelationship.target || `chart-${index + 1}`,
			from,
			to,
			ext: extElement ? {
				width: numericAttribute(extElement, "cx"),
				height: numericAttribute(extElement, "cy")
			} : void 0
		};
	}))).filter((chart) => chart !== null);
};
var parseSpreadsheetCharts = async (data, workbook) => {
	const zip = await import_jszip_min.default.loadAsync(data);
	const workbookPart = "xl/workbook.xml";
	const [workbookDocument, workbookRelationships] = await Promise.all([loadXml(zip, workbookPart), loadRelationships(zip, workbookPart)]);
	const result = {};
	if (!workbookDocument) return result;
	for (const sheet of elementsByLocal(workbookDocument.documentElement, "sheet")) {
		const name = sheet.getAttribute("name") || "";
		const worksheetRelationship = relationById(workbookRelationships, relationshipId(sheet));
		if (!name || !(worksheetRelationship === null || worksheetRelationship === void 0 ? void 0 : worksheetRelationship.type.endsWith(WORKSHEET_RELATIONSHIP_SUFFIX$1))) continue;
		const worksheetRelationships = await loadRelationships(zip, worksheetRelationship.target);
		const drawingParts = Array.from(new Set(worksheetRelationships.filter((relationship) => relationship.type.endsWith(DRAWING_RELATIONSHIP_SUFFIX)).map((relationship) => relationship.target)));
		const charts = (await Promise.all(drawingParts.map((part) => parseDrawingCharts(zip, part, workbook)))).flat();
		if (charts.length) result[name] = charts;
	}
	return result;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet/worker/sheetjs/textEncoding.js
var TEXT_SPREADSHEET_EXTENSIONS = /* @__PURE__ */ new Set(["csv", "tsv"]);
var TEXT_SPREADSHEET_MIME_TYPES = /* @__PURE__ */ new Set(["text/csv", "text/tab-separated-values"]);
var normalizeFileType = (value) => {
	return String(value || "").trim().toLowerCase().replace(/^\./, "").split(/[?#;]/, 1)[0];
};
var getFilenameExtension = (filename) => {
	const clean = String(filename || "").trim().toLowerCase().split(/[?#]/, 1)[0];
	const slash = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
	const dot = clean.lastIndexOf(".");
	return dot > slash ? clean.slice(dot + 1) : "";
};
var isTextSpreadsheetSource = ({ fileType, filename }) => {
	const normalizedType = normalizeFileType(fileType);
	if (normalizedType) return TEXT_SPREADSHEET_EXTENSIONS.has(normalizedType) || TEXT_SPREADSHEET_MIME_TYPES.has(normalizedType);
	return TEXT_SPREADSHEET_EXTENSIONS.has(getFilenameExtension(filename));
};
var decodeSpreadsheetText = (data, encoding = "auto") => decodeFileViewerTextBuffer(data, encoding);
var prepareSpreadsheetReadInput = (data, source = {}) => {
	if (!isTextSpreadsheetSource(source)) return {
		kind: "binary",
		data
	};
	const decoded = decodeSpreadsheetText(data, source.textEncoding);
	return {
		kind: "text",
		data: decoded.text,
		encoding: decoded.encoding
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet/worker/sheetjs/richDataParser.js
var WORKBOOK_PART = "xl/workbook.xml";
var CONTENT_TYPES_PART = "[Content_Types].xml";
var WORKSHEET_RELATIONSHIP_SUFFIX = "/worksheet";
var METADATA_RELATIONSHIP_SUFFIX = "/sheetmetadata";
var RICH_VALUE_RELATIONSHIP_SUFFIX = "/rdrichvalue";
var RICH_VALUE_STRUCTURE_RELATIONSHIP_SUFFIX = "/rdrichvaluestructure";
var RICH_VALUE_RELATION_LIST_SUFFIX = "/richvaluerel";
var WPS_CELL_IMAGE_RELATIONSHIP = "http://www.wps.cn/officeDocument/2017/relationships/cellimage";
var RICH_VALUE_METADATA_NAME = "XLRICHVALUE";
var LOCAL_IMAGE_STRUCTURE_TYPE = "_localImage";
var LOCAL_IMAGE_KEY_SUFFIX = "LocalImageIdentifier";
var textContent = (element) => {
	var _a;
	return ((_a = element === null || element === void 0 ? void 0 : element.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "";
};
var directChildrenByLocal = (node, name) => childElements(node).filter((child) => localName(child) === name);
var firstDescendantByLocal = (node, name) => elementsByLocal(node, name)[0];
var relationshipBySuffix = (relationships, suffix) => relationships.find((relationship) => relationship.type.toLowerCase().endsWith(suffix));
var parseContentTypes = (document) => {
	const defaults = /* @__PURE__ */ new Map();
	const overrides = /* @__PURE__ */ new Map();
	if (!document) return {
		defaults,
		overrides
	};
	elementsByLocal(document.documentElement, "Default").forEach((element) => {
		const extension = (element.getAttribute("Extension") || "").toLowerCase();
		const contentType = element.getAttribute("ContentType") || "";
		if (extension && contentType) defaults.set(extension, contentType);
	});
	elementsByLocal(document.documentElement, "Override").forEach((element) => {
		const partName = (element.getAttribute("PartName") || "").replace(/^\//, "");
		const contentType = element.getAttribute("ContentType") || "";
		if (partName && contentType) overrides.set(partName, contentType);
	});
	return {
		defaults,
		overrides
	};
};
var fallbackImageContentType = (path) => {
	var _a;
	switch (((_a = path.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "") {
		case "bmp": return "image/bmp";
		case "gif": return "image/gif";
		case "jpeg":
		case "jpg": return "image/jpeg";
		case "png": return "image/png";
		case "svg": return "image/svg+xml";
		case "webp": return "image/webp";
		default: return "";
	}
};
var getContentType = (path, contentTypes) => {
	var _a;
	const override = contentTypes.overrides.get(path);
	if (override) return override;
	const extension = ((_a = path.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
	return contentTypes.defaults.get(extension) || fallbackImageContentType(path);
};
var parseRichValueStructures = (document) => {
	if (!document) return [];
	return directChildrenByLocal(document.documentElement, "s").map((structure) => ({
		type: structure.getAttribute("t") || "",
		keys: directChildrenByLocal(structure, "k").map((key) => key.getAttribute("n") || "")
	}));
};
var parseRichValues = (document) => {
	if (!document) return [];
	return directChildrenByLocal(document.documentElement, "rv").map((richValue) => ({
		structureIndex: Number(richValue.getAttribute("s")),
		values: directChildrenByLocal(richValue, "v").map((value) => Number(textContent(value)))
	}));
};
var parseRichValueRelationshipIds = (document) => {
	if (!document) return [];
	return directChildrenByLocal(document.documentElement, "rel").map(relationshipId);
};
var parseMetadataRichValueIndexes = (document) => {
	if (!document) return [];
	const richValueMetadataType = directChildrenByLocal(firstDescendantByLocal(document.documentElement, "metadataTypes"), "metadataType").findIndex((metadataType) => metadataType.getAttribute("name") === RICH_VALUE_METADATA_NAME) + 1;
	if (richValueMetadataType <= 0) return [];
	const futureRichValueIndexes = directChildrenByLocal(elementsByLocal(document.documentElement, "futureMetadata").find((element) => element.getAttribute("name") === RICH_VALUE_METADATA_NAME), "bk").map((block) => {
		const richValueBlock = firstDescendantByLocal(block, "rvb");
		const value = Number(richValueBlock === null || richValueBlock === void 0 ? void 0 : richValueBlock.getAttribute("i"));
		return Number.isInteger(value) && value >= 0 ? value : void 0;
	});
	return directChildrenByLocal(firstDescendantByLocal(document.documentElement, "valueMetadata"), "bk").map((block) => {
		const reference = directChildrenByLocal(block, "rc").find((element) => Number(element.getAttribute("t")) === richValueMetadataType);
		const futureIndex = Number(reference === null || reference === void 0 ? void 0 : reference.getAttribute("v"));
		return Number.isInteger(futureIndex) && futureIndex >= 0 ? futureRichValueIndexes[futureIndex] : void 0;
	});
};
var attributeValue = (tag, name) => {
	var _a, _b;
	const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = tag.match(new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
	return (_b = (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : match === null || match === void 0 ? void 0 : match[2]) !== null && _b !== void 0 ? _b : "";
};
var parseWorksheetCellMetadata = (xml) => {
	const result = [];
	for (const match of xml.matchAll(/<(?:[A-Za-z_][\w.-]*:)?c\b[^>]*>/gi)) {
		const tag = match[0];
		const ref = attributeValue(tag, "r");
		const metadataText = attributeValue(tag, "vm");
		const metadataValue = Number(metadataText);
		if (!ref || !metadataText || !Number.isInteger(metadataValue) || metadataValue < 0) continue;
		result.push({
			ref,
			metadataIndex: metadataValue > 0 ? metadataValue - 1 : 0
		});
	}
	return result;
};
var decodeFormulaText = (value) => value.replace(/&quot;/gi, "\"").replace(/&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&");
var parseWorksheetDispImages = (xml) => {
	var _a, _b;
	const result = [];
	for (const match of xml.matchAll(/<(?:[A-Za-z_][\w.-]*:)?c\b[^>]*>[\s\S]*?<\/(?:[A-Za-z_][\w.-]*:)?c\s*>/gi)) {
		const cellXml = match[0];
		const ref = attributeValue(cellXml.slice(0, cellXml.indexOf(">") + 1), "r");
		const formulaMatch = cellXml.match(/<(?:[A-Za-z_][\w.-]*:)?f\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?f\s*>/i);
		const imageId = (_b = decodeFormulaText(((_a = formulaMatch === null || formulaMatch === void 0 ? void 0 : formulaMatch[1]) === null || _a === void 0 ? void 0 : _a.trim()) || "").match(/(?:_xlfn\.)?(?:_xlws\.)?DISPIMG\s*\(\s*["']([^"']+)["']/i)) === null || _b === void 0 ? void 0 : _b[1];
		if (ref && imageId) result.push({
			ref,
			imageId
		});
	}
	return result;
};
var embeddedRelationshipId = (element) => {
	if (!element) return "";
	return element.getAttribute("r:embed") || element.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "embed") || element.getAttribute("embed") || "";
};
var loadWpsCellImages = async (zip, relationship, contentTypes) => {
	const result = /* @__PURE__ */ new Map();
	if (!relationship) return result;
	const [document, relationships] = await Promise.all([loadXml(zip, relationship.target), loadRelationships(zip, relationship.target)]);
	if (!document) return result;
	await Promise.all(elementsByLocal(document.documentElement, "cellImage").map(async (cellImage) => {
		const nonVisualProperties = firstDescendantByLocal(cellImage, "cNvPr");
		const imageId = (nonVisualProperties === null || nonVisualProperties === void 0 ? void 0 : nonVisualProperties.getAttribute("name")) || "";
		const blip = firstDescendantByLocal(cellImage, "blip");
		const imageRelationship = relationById(relationships, embeddedRelationshipId(blip));
		if (!imageId || !imageRelationship) return;
		const contentType = getContentType(imageRelationship.target, contentTypes);
		const imageFile = zip.file(imageRelationship.target);
		if (!imageFile || !contentType.startsWith("image/")) return;
		result.set(imageId, {
			id: imageId,
			src: `data:${contentType};base64,${await imageFile.async("base64")}`,
			contentType
		});
	}));
	return result;
};
var loadRichValueImages = async (zip, structures, richValues, relationshipIds, relationships, contentTypes) => {
	const result = /* @__PURE__ */ new Map();
	await Promise.all(richValues.map(async (richValue, richValueIndex) => {
		const structure = structures[richValue.structureIndex];
		if (!structure || structure.type !== LOCAL_IMAGE_STRUCTURE_TYPE) return;
		const imageKeyIndex = structure.keys.findIndex((key) => key.endsWith(LOCAL_IMAGE_KEY_SUFFIX));
		const imageRelationshipIndex = richValue.values[imageKeyIndex];
		if (imageKeyIndex < 0 || !Number.isInteger(imageRelationshipIndex) || imageRelationshipIndex < 0) return;
		const imageRelationshipId = relationshipIds[imageRelationshipIndex];
		const imageRelationship = relationById(relationships, imageRelationshipId);
		if (!imageRelationship) return;
		const contentType = getContentType(imageRelationship.target, contentTypes);
		const imageFile = zip.file(imageRelationship.target);
		if (!imageFile || !contentType.startsWith("image/")) return;
		const base64 = await imageFile.async("base64");
		result.set(richValueIndex, {
			id: imageRelationship.id,
			src: `data:${contentType};base64,${base64}`,
			contentType
		});
	}));
	return result;
};
var parseSpreadsheetCellImages = async (data) => {
	const zip = await import_jszip_min.default.loadAsync(data);
	const [workbookDocument, workbookRelationships, contentTypesDocument] = await Promise.all([
		loadXml(zip, WORKBOOK_PART),
		loadRelationships(zip, WORKBOOK_PART),
		loadXml(zip, CONTENT_TYPES_PART)
	]);
	const result = {};
	if (!workbookDocument) return result;
	const metadataRelationship = relationshipBySuffix(workbookRelationships, METADATA_RELATIONSHIP_SUFFIX);
	const richValueRelationship = relationshipBySuffix(workbookRelationships, RICH_VALUE_RELATIONSHIP_SUFFIX);
	const richValueStructureRelationship = relationshipBySuffix(workbookRelationships, RICH_VALUE_STRUCTURE_RELATIONSHIP_SUFFIX);
	const richValueRelationListRelationship = relationshipBySuffix(workbookRelationships, RICH_VALUE_RELATION_LIST_SUFFIX);
	const contentTypes = parseContentTypes(contentTypesDocument);
	let metadataRichValueIndexes = [];
	let richValueImages = /* @__PURE__ */ new Map();
	if (metadataRelationship && richValueRelationship && richValueStructureRelationship && richValueRelationListRelationship) {
		const [metadataDocument, richValueDocument, richValueStructureDocument, richValueRelationListDocument, richValueRelationships] = await Promise.all([
			loadXml(zip, metadataRelationship.target),
			loadXml(zip, richValueRelationship.target),
			loadXml(zip, richValueStructureRelationship.target),
			loadXml(zip, richValueRelationListRelationship.target),
			loadRelationships(zip, richValueRelationListRelationship.target)
		]);
		metadataRichValueIndexes = parseMetadataRichValueIndexes(metadataDocument);
		richValueImages = await loadRichValueImages(zip, parseRichValueStructures(richValueStructureDocument), parseRichValues(richValueDocument), parseRichValueRelationshipIds(richValueRelationListDocument), richValueRelationships, contentTypes);
	}
	const wpsCellImages = await loadWpsCellImages(zip, workbookRelationships.find((relationship) => relationship.type.toLowerCase() === WPS_CELL_IMAGE_RELATIONSHIP.toLowerCase()), contentTypes);
	if (!richValueImages.size && !wpsCellImages.size) return result;
	for (const sheet of elementsByLocal(workbookDocument.documentElement, "sheet")) {
		const name = sheet.getAttribute("name") || "";
		const worksheetRelationship = relationById(workbookRelationships, relationshipId(sheet));
		const worksheetFile = (worksheetRelationship === null || worksheetRelationship === void 0 ? void 0 : worksheetRelationship.type.toLowerCase().endsWith(WORKSHEET_RELATIONSHIP_SUFFIX)) ? zip.file(worksheetRelationship.target) : null;
		if (!name || !worksheetFile) continue;
		const worksheetXml = await worksheetFile.async("text");
		const imagesByRef = /* @__PURE__ */ new Map();
		parseWorksheetCellMetadata(worksheetXml).forEach(({ ref, metadataIndex }) => {
			const richValueIndex = metadataRichValueIndexes[metadataIndex];
			const image = richValueIndex === void 0 ? void 0 : richValueImages.get(richValueIndex);
			if (image) imagesByRef.set(ref, image);
		});
		parseWorksheetDispImages(worksheetXml).forEach(({ ref, imageId }) => {
			const image = wpsCellImages.get(imageId);
			if (image && !imagesByRef.has(ref)) imagesByRef.set(ref, image);
		});
		const images = Array.from(imagesByRef).flatMap(([ref, image]) => {
			try {
				const cell = utils.decode_cell(ref);
				return [{
					...image,
					id: `cell-image-${ref}-${image.id}`,
					row: cell.r,
					col: cell.c
				}];
			} catch {
				return [];
			}
		});
		if (images.length) result[name] = images;
	}
	return result;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-spreadsheet@3.1.2/node_modules/@file-viewer/renderer-spreadsheet/dist/spreadsheet/worker/sheetjs/parser.js
var readOptions = {
	type: "array",
	dense: true,
	cellDates: true,
	cellStyles: true,
	browserPixels: true,
	drawings: true
};
var isMergeValidationError = (error) => error instanceof Error && typeof error.code === "string" && /^E_MERGE_/.test(error.code);
var sanitizeToleratedMerges = (workbook) => {
	for (const name of workbook.SheetNames || []) {
		const worksheet = workbook.Sheets[name];
		const merges = worksheet === null || worksheet === void 0 ? void 0 : worksheet["!merges"];
		const errors = worksheet === null || worksheet === void 0 ? void 0 : worksheet["!mergeErrors"];
		if (!worksheet || !(merges === null || merges === void 0 ? void 0 : merges.length) || !(errors === null || errors === void 0 ? void 0 : errors.length)) continue;
		let worksheetRange;
		try {
			worksheetRange = worksheet["!ref"] ? utils.decode_range(worksheet["!ref"]) : void 0;
		} catch {
			worksheetRange = void 0;
		}
		const errorsByIndex = /* @__PURE__ */ new Map();
		for (const error of errors) {
			const index = error.index;
			if (!Number.isInteger(index) || typeof index !== "number" || typeof error.code !== "string") continue;
			const codes = errorsByIndex.get(index) || /* @__PURE__ */ new Set();
			codes.add(error.code);
			errorsByIndex.set(index, codes);
		}
		worksheet["!merges"] = merges.flatMap((merge, index) => {
			var _a, _b, _c, _d;
			const codes = errorsByIndex.get(index);
			const startRow = Number((_a = merge.s) === null || _a === void 0 ? void 0 : _a.r);
			const startCol = Number((_b = merge.s) === null || _b === void 0 ? void 0 : _b.c);
			let endRow = Number((_c = merge.e) === null || _c === void 0 ? void 0 : _c.r);
			let endCol = Number((_d = merge.e) === null || _d === void 0 ? void 0 : _d.c);
			if (!Number.isInteger(startRow) || !Number.isInteger(startCol) || !Number.isInteger(endRow) || !Number.isInteger(endCol) || startRow < 0 || startCol < 0 || endRow < startRow || endCol < startCol || (codes === null || codes === void 0 ? void 0 : codes.has("E_MERGE_RANGE")) || (codes === null || codes === void 0 ? void 0 : codes.has("E_MERGE_DUP")) || (codes === null || codes === void 0 ? void 0 : codes.has("E_MERGE_OVERLAP"))) return [];
			if (codes === null || codes === void 0 ? void 0 : codes.has("E_MERGE_BOUNDS")) {
				if (!worksheetRange || startRow < worksheetRange.s.r || startCol < worksheetRange.s.c || startRow > worksheetRange.e.r || startCol > worksheetRange.e.c) return [];
				endRow = Math.min(endRow, worksheetRange.e.r);
				endCol = Math.min(endCol, worksheetRange.e.c);
			}
			return [{
				...merge,
				s: {
					...merge.s,
					r: startRow,
					c: startCol
				},
				e: {
					...merge.e,
					r: endRow,
					c: endCol
				}
			}];
		});
	}
};
var readPreparedWorkbook = (input, validateMerges) => input.kind === "text" ? readSync(input.data, {
	...readOptions,
	type: "string",
	validateMerges
}) : readSync(input.data, {
	...readOptions,
	validateMerges
});
var readWorkbookWithMergeRecovery = (input) => {
	try {
		return readPreparedWorkbook(input, true);
	} catch (error) {
		if (!isMergeValidationError(error)) throw error;
		const workbook = readPreparedWorkbook(input, false);
		sanitizeToleratedMerges(workbook);
		console.warn(`[file-viewer] Recovered a workbook with invalid merge metadata: ${error.message}`);
		return workbook;
	}
};
var createSpreadsheetParserContext = () => ({
	workbook: null,
	sheets: [],
	charts: {},
	cellImages: {}
});
var toErrorResponse = (error, payload = {}) => ({
	type: "parseError",
	payload: {
		...payload,
		message: error instanceof Error ? error.message : String(error)
	}
});
var getDrawingBounds = (worksheet) => {
	var _a;
	return (((_a = worksheet === null || worksheet === void 0 ? void 0 : worksheet["!drawings"]) === null || _a === void 0 ? void 0 : _a.images) || []).reduce((bounds, image) => {
		var _a, _b, _c, _d, _e, _f;
		const anchor = image.anchor;
		const row = Number((_b = (_a = anchor === null || anchor === void 0 ? void 0 : anchor.to) === null || _a === void 0 ? void 0 : _a.row) !== null && _b !== void 0 ? _b : (_c = anchor === null || anchor === void 0 ? void 0 : anchor.from) === null || _c === void 0 ? void 0 : _c.row);
		const col = Number((_e = (_d = anchor === null || anchor === void 0 ? void 0 : anchor.to) === null || _d === void 0 ? void 0 : _d.col) !== null && _e !== void 0 ? _e : (_f = anchor === null || anchor === void 0 ? void 0 : anchor.from) === null || _f === void 0 ? void 0 : _f.col);
		return {
			rowCount: Number.isFinite(row) ? Math.max(bounds.rowCount, row + 1) : bounds.rowCount,
			colCount: Number.isFinite(col) ? Math.max(bounds.colCount, col + 1) : bounds.colCount
		};
	}, {
		rowCount: 0,
		colCount: 0
	});
};
var getChartBounds = (charts) => {
	return (charts || []).reduce((bounds, chart) => {
		var _a, _b, _c, _d, _e, _f;
		const estimatedRows = ((_a = chart.ext) === null || _a === void 0 ? void 0 : _a.height) ? Math.ceil(chart.ext.height / 9525 / 20) : 0;
		const estimatedCols = ((_b = chart.ext) === null || _b === void 0 ? void 0 : _b.width) ? Math.ceil(chart.ext.width / 9525 / 64) : 0;
		const row = (_d = (_c = chart.to) === null || _c === void 0 ? void 0 : _c.row) !== null && _d !== void 0 ? _d : chart.from.row + estimatedRows;
		const col = (_f = (_e = chart.to) === null || _e === void 0 ? void 0 : _e.col) !== null && _f !== void 0 ? _f : chart.from.col + estimatedCols;
		return {
			rowCount: Math.max(bounds.rowCount, row + 1),
			colCount: Math.max(bounds.colCount, col + 1)
		};
	}, {
		rowCount: 0,
		colCount: 0
	});
};
var EMPTY_RANGE_ROW_LIMIT = 1e3;
var EMPTY_RANGE_COLUMN_LIMIT = 256;
var RANGE_ROW_SLACK = 256;
var RANGE_COLUMN_SLACK = 64;
var RANGE_GROWTH_FACTOR = 4;
var getCellBounds = (worksheet) => {
	const bounds = {
		rowCount: 0,
		colCount: 0
	};
	if (!worksheet) return bounds;
	const denseRows = Array.isArray(worksheet) ? worksheet : worksheet["!data"];
	if (Array.isArray(denseRows)) {
		for (const rowKey of Object.keys(denseRows)) {
			const rowIndex = Number(rowKey);
			const row = denseRows[rowIndex];
			if (!Number.isInteger(rowIndex) || rowIndex < 0 || !Array.isArray(row)) continue;
			for (const colKey of Object.keys(row)) {
				const colIndex = Number(colKey);
				if (!Number.isInteger(colIndex) || colIndex < 0 || row[colIndex] == null) continue;
				bounds.rowCount = Math.max(bounds.rowCount, rowIndex + 1);
				bounds.colCount = Math.max(bounds.colCount, colIndex + 1);
			}
		}
		return bounds;
	}
	for (const key of Object.keys(worksheet)) {
		if (key.startsWith("!") || !/^[A-Z]+[1-9][0-9]*$/i.test(key) || worksheet[key] == null) continue;
		try {
			const cell = utils.decode_cell(key);
			bounds.rowCount = Math.max(bounds.rowCount, cell.r + 1);
			bounds.colCount = Math.max(bounds.colCount, cell.c + 1);
		} catch {}
	}
	return bounds;
};
var getMergeBounds = (worksheet) => {
	return ((worksheet === null || worksheet === void 0 ? void 0 : worksheet["!merges"]) || []).reduce((bounds, merge) => {
		var _a, _b, _c, _d, _e, _f;
		const row = Number((_b = (_a = merge.e) === null || _a === void 0 ? void 0 : _a.row) !== null && _b !== void 0 ? _b : (_c = merge.e) === null || _c === void 0 ? void 0 : _c.r);
		const col = Number((_e = (_d = merge.e) === null || _d === void 0 ? void 0 : _d.col) !== null && _e !== void 0 ? _e : (_f = merge.e) === null || _f === void 0 ? void 0 : _f.c);
		return {
			rowCount: Number.isFinite(row) ? Math.max(bounds.rowCount, row + 1) : bounds.rowCount,
			colCount: Number.isFinite(col) ? Math.max(bounds.colCount, col + 1) : bounds.colCount
		};
	}, {
		rowCount: 0,
		colCount: 0
	});
};
var reconcileDeclaredRange = (declaredCount, observedCount, slack, emptyLimit) => {
	if (observedCount <= 0) return Math.min(Math.max(declaredCount, 1), emptyLimit);
	return declaredCount <= Math.max(observedCount + slack, observedCount * RANGE_GROWTH_FACTOR) ? Math.max(declaredCount, observedCount) : observedCount;
};
var getWorksheetDisplayBounds = (worksheet, charts) => {
	let declaredRowCount = 0;
	let declaredColCount = 0;
	const ref = worksheet === null || worksheet === void 0 ? void 0 : worksheet["!ref"];
	if (ref) try {
		const range = utils.decode_range(ref);
		declaredRowCount = range.e.r + 1;
		declaredColCount = range.e.c + 1;
	} catch {}
	const cellBounds = getCellBounds(worksheet);
	const mergeBounds = getMergeBounds(worksheet);
	const drawingBounds = getDrawingBounds(worksheet);
	const chartBounds = getChartBounds(charts);
	const observedRowCount = Math.max(cellBounds.rowCount, mergeBounds.rowCount, drawingBounds.rowCount, chartBounds.rowCount);
	const observedColCount = Math.max(cellBounds.colCount, mergeBounds.colCount, drawingBounds.colCount, chartBounds.colCount);
	const rowCount = reconcileDeclaredRange(declaredRowCount, observedRowCount, RANGE_ROW_SLACK, EMPTY_RANGE_ROW_LIMIT);
	const colCount = reconcileDeclaredRange(declaredColCount, observedColCount, RANGE_COLUMN_SLACK, EMPTY_RANGE_COLUMN_LIMIT);
	return {
		rowCount,
		colCount,
		declaredRowCount,
		declaredColCount,
		observedRowCount,
		observedColCount,
		trimmed: rowCount < declaredRowCount || colCount < declaredColCount
	};
};
var parseSheets = (context) => {
	var _a;
	const workbook = context.workbook;
	if (!(workbook === null || workbook === void 0 ? void 0 : workbook.SheetNames)) return [];
	const workbookSheets = ((_a = workbook.Workbook) === null || _a === void 0 ? void 0 : _a.Sheets) || [];
	context.sheets = workbook.SheetNames.reduce((result, name, sourceIndex) => {
		var _a;
		const worksheet = workbook.Sheets[name];
		const bounds = getWorksheetDisplayBounds(worksheet, context.charts[name]);
		if (!(worksheet === null || worksheet === void 0 ? void 0 : worksheet["!ref"]) && !bounds.observedRowCount && !bounds.observedColCount) return result;
		if (bounds.trimmed) console.warn(`[file-viewer] Ignored pathological worksheet dimensions for ${name}: ${bounds.declaredRowCount}x${bounds.declaredColCount} -> ${bounds.rowCount}x${bounds.colCount}.`);
		result.push({
			id: result.length,
			name,
			hidden: !!((_a = workbookSheets[sourceIndex]) === null || _a === void 0 ? void 0 : _a.Hidden),
			rowCount: bounds.rowCount,
			colCount: bounds.colCount
		});
		return result;
	}, []);
	return [{
		type: "sheets",
		payload: { sheets: context.sheets }
	}];
};
var parseSpreadsheetWorkbook = async (context, data, source = {}) => {
	try {
		context.workbook = readWorkbookWithMergeRecovery(prepareSpreadsheetReadInput(data, source));
		if ((data.byteLength >= 2 ? new DataView(data).getUint16(0, false) : 0) === 20555) {
			const [charts, cellImages] = await Promise.all([parseSpreadsheetCharts(data, context.workbook).catch((error) => {
				console.warn("[file-viewer] Spreadsheet chart parsing failed; continuing with cell content.", error);
				return {};
			}), parseSpreadsheetCellImages(data).catch((error) => {
				console.warn("[file-viewer] Spreadsheet cell image parsing failed; continuing with cell content.", error);
				return {};
			})]);
			context.charts = charts;
			context.cellImages = cellImages;
		} else {
			context.charts = {};
			context.cellImages = {};
		}
		return parseSheets(context);
	} catch (error) {
		return [toErrorResponse(error)];
	}
};
var parseSpreadsheetSheet = (context, payload = {}) => {
	var _a;
	const { sheet, startRow = 0, pageSize = 500, sessionId = 0 } = payload;
	try {
		const workbook = context.workbook;
		const sheetName = (_a = context.sheets.find((item) => item.id === sheet)) === null || _a === void 0 ? void 0 : _a.name;
		if (!(workbook === null || workbook === void 0 ? void 0 : workbook.Sheets) || !sheetName) return [];
		const worksheet = workbook.Sheets[sheetName];
		if (!worksheet) return [];
		const sheetMeta = context.sheets.find((item) => item.id === sheet);
		const sheetModel = SheetJsModel.create(worksheet, {
			startRow,
			pageSize,
			totalRows: sheetMeta === null || sheetMeta === void 0 ? void 0 : sheetMeta.rowCount,
			totalCols: sheetMeta === null || sheetMeta === void 0 ? void 0 : sheetMeta.colCount,
			charts: context.charts[sheetName],
			cellImages: context.cellImages[sheetName]
		});
		const windowData = sheetModel.toObject({ includeLayout: startRow === 0 });
		const structure = startRow === 0 ? sheetModel.structure : void 0;
		return [{
			type: "parseSheet",
			payload: {
				sessionId,
				sheet,
				sheetData: structure ? {
					...windowData,
					structure
				} : windowData
			}
		}];
	} catch (error) {
		return [toErrorResponse(error, {
			sessionId,
			startRow
		})];
	}
};
var escapeSearchRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var createSpreadsheetSearchRegExp = (query, options) => {
	const source = options.wholeWord ? `\\b${escapeSearchRegExp(query)}\\b` : escapeSearchRegExp(query);
	return new RegExp(source, options.caseSensitive ? "g" : "gi");
};
var visitWorksheetCells = (worksheet, visit) => {
	const candidate = worksheet;
	const rows = Array.isArray(worksheet) ? worksheet : candidate["!data"];
	if (rows) {
		for (const rowKey of Object.keys(rows)) {
			const row = rows[Number(rowKey)];
			const rowIndex = Number(rowKey);
			if (!Number.isInteger(rowIndex) || rowIndex < 0 || !Array.isArray(row)) continue;
			for (const colKey of Object.keys(row)) {
				const colIndex = Number(colKey);
				const cell = row[colIndex];
				if (!Number.isInteger(colIndex) || colIndex < 0 || !cell) continue;
				if (!visit(cell, rowIndex, colIndex)) return false;
			}
		}
		return true;
	}
	for (const key of Object.keys(worksheet)) {
		if (key.startsWith("!") || !/^[A-Z]+[1-9][0-9]*$/i.test(key)) continue;
		const cell = worksheet[key];
		if (!cell) continue;
		let position;
		try {
			position = utils.decode_cell(key);
		} catch {
			continue;
		}
		if (!visit(cell, position.r, position.c)) return false;
	}
	return true;
};
var searchSpreadsheetWorkbook = (context, query, options = {}) => {
	var _a;
	const normalizedQuery = query.replace(/\s+/g, " ").trim();
	if (!normalizedQuery || !((_a = context.workbook) === null || _a === void 0 ? void 0 : _a.Sheets)) return [];
	const maxMatches = Math.max(1, Math.floor(options.maxMatches || 1e3));
	const expression = createSpreadsheetSearchRegExp(normalizedQuery, options);
	const matches = [];
	for (const sheet of context.sheets) {
		const worksheet = context.workbook.Sheets[sheet.name];
		if (!worksheet) continue;
		if (!visitWorksheetCells(worksheet, (cell, row, col) => {
			const text = formatCellValue(cell);
			if (!text) return true;
			expression.lastIndex = 0;
			let match;
			while ((match = expression.exec(text)) && matches.length < maxMatches) {
				if (!match[0]) {
					expression.lastIndex += 1;
					continue;
				}
				matches.push({
					sheet: sheet.id,
					sheetName: sheet.name,
					row,
					col,
					text,
					matchText: match[0]
				});
			}
			return matches.length < maxMatches;
		}) || matches.length >= maxMatches) break;
	}
	return matches;
};
var handleSpreadsheetWorkerRequest = (context, request) => {
	var _a, _b, _c, _d, _e, _f, _g;
	switch (request.type) {
		case "parseWorkbook": return parseSpreadsheetWorkbook(context, (_a = request.payload) === null || _a === void 0 ? void 0 : _a.workbook, {
			fileType: (_b = request.payload) === null || _b === void 0 ? void 0 : _b.fileType,
			filename: (_c = request.payload) === null || _c === void 0 ? void 0 : _c.filename,
			textEncoding: (_d = request.payload) === null || _d === void 0 ? void 0 : _d.textEncoding
		});
		case "parseSheet": return parseSpreadsheetSheet(context, request.payload);
		case "searchWorkbook": return [{
			type: "searchWorkbook",
			payload: {
				requestId: (_e = request.payload) === null || _e === void 0 ? void 0 : _e.requestId,
				query: ((_f = request.payload) === null || _f === void 0 ? void 0 : _f.query) || "",
				matches: searchSpreadsheetWorkbook(context, ((_g = request.payload) === null || _g === void 0 ? void 0 : _g.query) || "", request.payload)
			}
		}];
		default: return [];
	}
};
//#endregion
export { createSpreadsheetParserContext, getWorksheetDisplayBounds, handleSpreadsheetWorkerRequest, parseSpreadsheetSheet, parseSpreadsheetWorkbook, searchSpreadsheetWorkbook };
