const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/mermaid.core-qPSFJ2wt.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/pointer-CUzP0kn2.js","assets/chunk-75Z2AOVW-tyQLi-d5.js","assets/step-DeDTPBUO.js","assets/math-CcXhgIHE.js","assets/chunk-Y2CYZVJY-Cs0fowS7.js","assets/src-D5h6GpYO.js","assets/dayjs.min-DeZMAZuH.js","assets/src-Df4bFYz8.js","assets/value-H8gKMGY5.js","assets/timer-d7k6Rryl.js","assets/chunk-DU6HZSFF-BqXTkcmT.js","assets/dist-C0hIIK8s.js","assets/chunk-CLGD4ZFX-CX7aaA01.js","assets/chunk-PWAF6VOD-DlaxcI0_.js","assets/chunk-GMAD6QVW-NrdKpsdr.js","assets/chunk-P2QGCYS3-CGIfvHGB.js","assets/chunk-4HAMMTFA-8UXdNhWm.js","assets/rough.esm-WPr-dXTc.js","assets/chunk-GVQU2GXP-B0jUHEmz.js","assets/chunk-OSK3NFVY-wfHBCTgC.js","assets/line-BSBxwLdy.js","assets/path-D481hj-_.js","assets/array-75Ih5Qg4.js","assets/chunk-L3NEJ4N5-Bbe9fDCw.js","assets/chunk-TLUHSLCS-Bs7PSxTK.js","assets/chunk-2E4U76K2-CnEhYQ5R.js","assets/graphlib-mRnWl-Q6.js","assets/_baseGet-DmmfCxUg.js","assets/isObject-CBh4bHyD.js","assets/_baseFlatten-D6objHuc.js","assets/_arrayPush-DAsStFRE.js","assets/_Uint8Array-Cf2dnQh6.js","assets/union-CKG0-ouI.js","assets/_baseIteratee-0zvAcVIj.js","assets/get-cR0zxN0m.js","assets/_baseIsEqual-4zTScXwg.js","assets/hasIn-COufhDdn.js","assets/isArrayLikeObject-CeWRLNuC.js","assets/_arrayEach-OvAge8dJ.js","assets/isEmpty-DZzpJqft.js","assets/_baseEach-CPGfeQSN.js","assets/isUndefined-DfHYomSZ.js","assets/chunk-LNGE3PJU-BsTR6CDk.js","assets/browser-index-Dx12-06F.js","assets/rough.esm-9EhZJatK.js"])))=>i.map(i=>d[i]);
import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { Bu as resolveFileViewerRuntimeAssetBaseUrl, Hs as unregisterFileViewerZoomProvider, Ji as assertFileViewerMermaidSourceHasNoExternalResources, Ou as resolveFileViewerDrawioViewerScriptUrl, Xi as sanitizeFileViewerSvgResources, fc as readFileViewerText, ho as createFileViewerTranslator, ts as createFileViewerZoomChangeEmitter, ud as __vitePreload, wc as DEFAULT_RENDERER_DEFINITIONS, zs as registerFileViewerZoomProvider } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/dompurify@3.4.15/node_modules/dompurify/dist/purify.es.mjs
/*! @license DOMPurify 3.4.15 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.15/LICENSE */
function _arrayLikeToArray(r, a) {
	(null == a || a > r.length) && (a = r.length);
	for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
	return n;
}
function _arrayWithHoles(r) {
	if (Array.isArray(r)) return r;
}
function _iterableToArrayLimit(r, l) {
	var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
	if (null != t) {
		var e, n, i, u, a = [], f = true, o = false;
		try {
			if (i = (t = t.call(r)).next, 0 === l);
			else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
		} catch (r) {
			o = true, n = r;
		} finally {
			try {
				if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
			} finally {
				if (o) throw n;
			}
		}
		return a;
	}
}
function _nonIterableRest() {
	throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
	return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _unsupportedIterableToArray(r, a) {
	if (r) {
		if ("string" == typeof r) return _arrayLikeToArray(r, a);
		var t = {}.toString.call(r).slice(8, -1);
		return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
	}
}
var entries = Object.entries;
var setPrototypeOf = Object.setPrototypeOf;
var isFrozen = Object.isFrozen;
var getPrototypeOf = Object.getPrototypeOf;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
var freeze = Object.freeze;
var seal = Object.seal;
var create = Object.create;
var _ref = typeof Reflect !== "undefined" && Reflect;
var apply = _ref.apply;
var construct = _ref.construct;
if (!freeze) freeze = function freeze(x) {
	return x;
};
if (!seal) seal = function seal(x) {
	return x;
};
if (!apply) apply = function apply(func, thisArg) {
	for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
	return func.apply(thisArg, args);
};
if (!construct) construct = function construct(Func) {
	for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) args[_key2 - 1] = arguments[_key2];
	return new Func(...args);
};
var arrayForEach = unapply(Array.prototype.forEach);
var arrayLastIndexOf = unapply(Array.prototype.lastIndexOf);
var arrayPop = unapply(Array.prototype.pop);
var arrayPush = unapply(Array.prototype.push);
var arraySplice = unapply(Array.prototype.splice);
var arrayIsArray = Array.isArray;
var stringToLowerCase = unapply(String.prototype.toLowerCase);
var stringToString = unapply(String.prototype.toString);
var stringMatch = unapply(String.prototype.match);
var stringReplace = unapply(String.prototype.replace);
var stringIndexOf = unapply(String.prototype.indexOf);
var stringTrim = unapply(String.prototype.trim);
var numberToString = unapply(Number.prototype.toString);
var booleanToString = unapply(Boolean.prototype.toString);
var bigintToString = typeof BigInt === "undefined" ? null : unapply(BigInt.prototype.toString);
var symbolToString = typeof Symbol === "undefined" ? null : unapply(Symbol.prototype.toString);
var objectHasOwnProperty = unapply(Object.prototype.hasOwnProperty);
var objectToString = unapply(Object.prototype.toString);
var regExpTest = unapply(RegExp.prototype.test);
var typeErrorCreate = unconstruct(TypeError);
/**
* Creates a new function that calls the given function with a specified thisArg and arguments.
*
* @param func - The function to be wrapped and called.
* @returns A new function that calls the given function with a specified thisArg and arguments.
*/
function unapply(func) {
	return function(thisArg) {
		if (thisArg instanceof RegExp) thisArg.lastIndex = 0;
		for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) args[_key3 - 1] = arguments[_key3];
		return apply(func, thisArg, args);
	};
}
/**
* Creates a new function that constructs an instance of the given constructor function with the provided arguments.
*
* @param func - The constructor function to be wrapped and called.
* @returns A new function that constructs an instance of the given constructor function with the provided arguments.
*/
function unconstruct(Func) {
	return function() {
		for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) args[_key4] = arguments[_key4];
		return construct(Func, args);
	};
}
/**
* Add properties to a lookup table
*
* @param set - The set to which elements will be added.
* @param array - The array containing elements to be added to the set.
* @param transformCaseFunc - An optional function to transform the case of each element before adding to the set.
* @returns The modified set with added elements.
*/
function addToSet(set, array) {
	let transformCaseFunc = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : stringToLowerCase;
	if (setPrototypeOf) setPrototypeOf(set, null);
	if (!arrayIsArray(array)) return set;
	let l = array.length;
	while (l--) {
		let element = array[l];
		if (typeof element === "string") {
			const lcElement = transformCaseFunc(element);
			if (lcElement !== element) {
				if (!isFrozen(array)) array[l] = lcElement;
				element = lcElement;
			}
		}
		set[element] = true;
	}
	return set;
}
/**
* Clean up an array to harden against CSPP
*
* @param array - The array to be cleaned.
* @returns The cleaned version of the array
*/
function cleanArray(array) {
	for (let index = 0; index < array.length; index++) if (!objectHasOwnProperty(array, index)) array[index] = null;
	return array;
}
/**
* Shallow clone an object
*
* @param object - The object to be cloned.
* @returns A new object that copies the original.
*/
function clone(object) {
	const newObject = create(null);
	for (const _ref2 of entries(object)) {
		var _ref3 = _slicedToArray(_ref2, 2);
		const property = _ref3[0];
		const value = _ref3[1];
		if (objectHasOwnProperty(object, property)) if (arrayIsArray(value)) newObject[property] = cleanArray(value);
		else if (value && typeof value === "object" && value.constructor === Object) newObject[property] = clone(value);
		else newObject[property] = value;
	}
	return newObject;
}
/**
* Convert non-node values into strings without depending on direct property access.
*
* @param value - The value to stringify.
* @returns A string representation of the provided value.
*/
function stringifyValue(value) {
	switch (typeof value) {
		case "string": return value;
		case "number": return numberToString(value);
		case "boolean": return booleanToString(value);
		case "bigint": return bigintToString ? bigintToString(value) : "0";
		case "symbol": return symbolToString ? symbolToString(value) : "Symbol()";
		case "undefined": return objectToString(value);
		case "function":
		case "object": {
			if (value === null) return objectToString(value);
			const valueAsRecord = value;
			const valueToString = lookupGetter(valueAsRecord, "toString");
			if (typeof valueToString === "function") {
				const stringified = valueToString(valueAsRecord);
				return typeof stringified === "string" ? stringified : objectToString(stringified);
			}
			return objectToString(value);
		}
		default: return objectToString(value);
	}
}
/**
* This method automatically checks if the prop is function or getter and behaves accordingly.
*
* @param object - The object to look up the getter function in its prototype chain.
* @param prop - The property name for which to find the getter function.
* @returns The getter function found in the prototype chain or a fallback function.
*/
function lookupGetter(object, prop) {
	while (object !== null) {
		const desc = getOwnPropertyDescriptor(object, prop);
		if (desc) {
			if (desc.get) return unapply(desc.get);
			if (typeof desc.value === "function") return unapply(desc.value);
		}
		object = getPrototypeOf(object);
	}
	function fallbackValue() {
		return null;
	}
	return fallbackValue;
}
function isRegex(value) {
	try {
		regExpTest(value, "");
		return true;
	} catch (_unused) {
		return false;
	}
}
var html$1 = freeze([
	"a",
	"abbr",
	"acronym",
	"address",
	"area",
	"article",
	"aside",
	"audio",
	"b",
	"bdi",
	"bdo",
	"big",
	"blink",
	"blockquote",
	"body",
	"br",
	"button",
	"canvas",
	"caption",
	"center",
	"cite",
	"code",
	"col",
	"colgroup",
	"content",
	"data",
	"datalist",
	"dd",
	"decorator",
	"del",
	"details",
	"dfn",
	"dialog",
	"dir",
	"div",
	"dl",
	"dt",
	"element",
	"em",
	"fieldset",
	"figcaption",
	"figure",
	"font",
	"footer",
	"form",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hgroup",
	"hr",
	"html",
	"i",
	"img",
	"input",
	"ins",
	"kbd",
	"label",
	"legend",
	"li",
	"main",
	"map",
	"mark",
	"marquee",
	"menu",
	"menuitem",
	"meter",
	"nav",
	"nobr",
	"ol",
	"optgroup",
	"option",
	"output",
	"p",
	"picture",
	"pre",
	"progress",
	"q",
	"rp",
	"rt",
	"ruby",
	"s",
	"samp",
	"search",
	"section",
	"select",
	"shadow",
	"slot",
	"small",
	"source",
	"spacer",
	"span",
	"strike",
	"strong",
	"style",
	"sub",
	"summary",
	"sup",
	"table",
	"tbody",
	"td",
	"template",
	"textarea",
	"tfoot",
	"th",
	"thead",
	"time",
	"tr",
	"track",
	"tt",
	"u",
	"ul",
	"var",
	"video",
	"wbr"
]);
var svg$1 = freeze([
	"svg",
	"a",
	"altglyph",
	"altglyphdef",
	"altglyphitem",
	"animatecolor",
	"animatemotion",
	"animatetransform",
	"circle",
	"clippath",
	"defs",
	"desc",
	"ellipse",
	"enterkeyhint",
	"exportparts",
	"filter",
	"font",
	"g",
	"glyph",
	"glyphref",
	"hkern",
	"image",
	"inputmode",
	"line",
	"lineargradient",
	"marker",
	"mask",
	"metadata",
	"mpath",
	"part",
	"path",
	"pattern",
	"polygon",
	"polyline",
	"radialgradient",
	"rect",
	"stop",
	"style",
	"switch",
	"symbol",
	"text",
	"textpath",
	"title",
	"tref",
	"tspan",
	"view",
	"vkern"
]);
var svgFilters = freeze([
	"feBlend",
	"feColorMatrix",
	"feComponentTransfer",
	"feComposite",
	"feConvolveMatrix",
	"feDiffuseLighting",
	"feDisplacementMap",
	"feDistantLight",
	"feDropShadow",
	"feFlood",
	"feFuncA",
	"feFuncB",
	"feFuncG",
	"feFuncR",
	"feGaussianBlur",
	"feImage",
	"feMerge",
	"feMergeNode",
	"feMorphology",
	"feOffset",
	"fePointLight",
	"feSpecularLighting",
	"feSpotLight",
	"feTile",
	"feTurbulence"
]);
var svgDisallowed = freeze([
	"animate",
	"color-profile",
	"cursor",
	"discard",
	"font-face",
	"font-face-format",
	"font-face-name",
	"font-face-src",
	"font-face-uri",
	"foreignobject",
	"hatch",
	"hatchpath",
	"mesh",
	"meshgradient",
	"meshpatch",
	"meshrow",
	"missing-glyph",
	"script",
	"set",
	"solidcolor",
	"unknown",
	"use"
]);
var mathMl$1 = freeze([
	"math",
	"menclose",
	"merror",
	"mfenced",
	"mfrac",
	"mglyph",
	"mi",
	"mlabeledtr",
	"mmultiscripts",
	"mn",
	"mo",
	"mover",
	"mpadded",
	"mphantom",
	"mroot",
	"mrow",
	"ms",
	"mspace",
	"msqrt",
	"mstyle",
	"msub",
	"msup",
	"msubsup",
	"mtable",
	"mtd",
	"mtext",
	"mtr",
	"munder",
	"munderover",
	"mprescripts"
]);
var mathMlDisallowed = freeze([
	"maction",
	"maligngroup",
	"malignmark",
	"mlongdiv",
	"mscarries",
	"mscarry",
	"msgroup",
	"mstack",
	"msline",
	"msrow",
	"semantics",
	"annotation",
	"annotation-xml",
	"mprescripts",
	"none"
]);
var text = freeze(["#text"]);
var html = freeze([
	"accept",
	"action",
	"align",
	"alt",
	"autocapitalize",
	"autocomplete",
	"autopictureinpicture",
	"autoplay",
	"background",
	"bgcolor",
	"border",
	"capture",
	"cellpadding",
	"cellspacing",
	"checked",
	"cite",
	"class",
	"clear",
	"color",
	"cols",
	"colspan",
	"command",
	"commandfor",
	"controls",
	"controlslist",
	"coords",
	"crossorigin",
	"datetime",
	"decoding",
	"default",
	"dir",
	"disabled",
	"disablepictureinpicture",
	"disableremoteplayback",
	"download",
	"draggable",
	"enctype",
	"enterkeyhint",
	"exportparts",
	"face",
	"for",
	"headers",
	"height",
	"hidden",
	"high",
	"href",
	"hreflang",
	"id",
	"inert",
	"inputmode",
	"integrity",
	"ismap",
	"kind",
	"label",
	"lang",
	"list",
	"loading",
	"loop",
	"low",
	"max",
	"maxlength",
	"media",
	"method",
	"min",
	"minlength",
	"multiple",
	"muted",
	"name",
	"nonce",
	"noshade",
	"novalidate",
	"nowrap",
	"open",
	"optimum",
	"part",
	"pattern",
	"placeholder",
	"playsinline",
	"popover",
	"popovertarget",
	"popovertargetaction",
	"poster",
	"preload",
	"pubdate",
	"radiogroup",
	"readonly",
	"rel",
	"required",
	"rev",
	"reversed",
	"role",
	"rows",
	"rowspan",
	"spellcheck",
	"scope",
	"selected",
	"shape",
	"size",
	"sizes",
	"slot",
	"span",
	"srclang",
	"start",
	"src",
	"srcset",
	"step",
	"style",
	"summary",
	"tabindex",
	"title",
	"translate",
	"type",
	"usemap",
	"valign",
	"value",
	"width",
	"wrap",
	"xmlns"
]);
var svg = freeze([
	"accent-height",
	"accumulate",
	"additive",
	"alignment-baseline",
	"amplitude",
	"ascent",
	"attributename",
	"attributetype",
	"azimuth",
	"basefrequency",
	"baseline-shift",
	"begin",
	"bias",
	"by",
	"class",
	"clip",
	"clippathunits",
	"clip-path",
	"clip-rule",
	"color",
	"color-interpolation",
	"color-interpolation-filters",
	"color-profile",
	"color-rendering",
	"cx",
	"cy",
	"d",
	"dx",
	"dy",
	"diffuseconstant",
	"direction",
	"display",
	"divisor",
	"dominant-baseline",
	"dur",
	"edgemode",
	"elevation",
	"end",
	"exponent",
	"fill",
	"fill-opacity",
	"fill-rule",
	"filter",
	"filterunits",
	"flood-color",
	"flood-opacity",
	"font-family",
	"font-size",
	"font-size-adjust",
	"font-stretch",
	"font-style",
	"font-variant",
	"font-weight",
	"fx",
	"fy",
	"g1",
	"g2",
	"glyph-name",
	"glyphref",
	"gradientunits",
	"gradienttransform",
	"height",
	"href",
	"id",
	"image-rendering",
	"in",
	"in2",
	"intercept",
	"k",
	"k1",
	"k2",
	"k3",
	"k4",
	"kerning",
	"keypoints",
	"keysplines",
	"keytimes",
	"lang",
	"lengthadjust",
	"letter-spacing",
	"kernelmatrix",
	"kernelunitlength",
	"lighting-color",
	"local",
	"marker-end",
	"marker-mid",
	"marker-start",
	"markerheight",
	"markerunits",
	"markerwidth",
	"maskcontentunits",
	"maskunits",
	"max",
	"mask",
	"mask-type",
	"media",
	"method",
	"mode",
	"min",
	"name",
	"numoctaves",
	"offset",
	"operator",
	"opacity",
	"order",
	"orient",
	"orientation",
	"origin",
	"overflow",
	"paint-order",
	"path",
	"pathlength",
	"patterncontentunits",
	"patterntransform",
	"patternunits",
	"pointer-events",
	"points",
	"preservealpha",
	"preserveaspectratio",
	"primitiveunits",
	"r",
	"rx",
	"ry",
	"radius",
	"refx",
	"refy",
	"repeatcount",
	"repeatdur",
	"restart",
	"result",
	"rotate",
	"scale",
	"seed",
	"shape-rendering",
	"slope",
	"specularconstant",
	"specularexponent",
	"spreadmethod",
	"startoffset",
	"stddeviation",
	"stitchtiles",
	"stop-color",
	"stop-opacity",
	"stroke-dasharray",
	"stroke-dashoffset",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-miterlimit",
	"stroke-opacity",
	"stroke",
	"stroke-width",
	"style",
	"surfacescale",
	"systemlanguage",
	"tabindex",
	"tablevalues",
	"targetx",
	"targety",
	"transform",
	"transform-origin",
	"text-anchor",
	"text-decoration",
	"text-orientation",
	"text-rendering",
	"textlength",
	"type",
	"u1",
	"u2",
	"unicode",
	"values",
	"vector-effect",
	"viewbox",
	"visibility",
	"version",
	"vert-adv-y",
	"vert-origin-x",
	"vert-origin-y",
	"width",
	"word-spacing",
	"wrap",
	"writing-mode",
	"xchannelselector",
	"ychannelselector",
	"x",
	"x1",
	"x2",
	"xmlns",
	"y",
	"y1",
	"y2",
	"z",
	"zoomandpan"
]);
var mathMl = freeze([
	"accent",
	"accentunder",
	"align",
	"bevelled",
	"close",
	"columnalign",
	"columnlines",
	"columnspacing",
	"columnspan",
	"denomalign",
	"depth",
	"dir",
	"display",
	"displaystyle",
	"encoding",
	"fence",
	"frame",
	"height",
	"href",
	"id",
	"largeop",
	"length",
	"linethickness",
	"lquote",
	"lspace",
	"mathbackground",
	"mathcolor",
	"mathsize",
	"mathvariant",
	"maxsize",
	"minsize",
	"movablelimits",
	"notation",
	"numalign",
	"open",
	"rowalign",
	"rowlines",
	"rowspacing",
	"rowspan",
	"rspace",
	"rquote",
	"scriptlevel",
	"scriptminsize",
	"scriptsizemultiplier",
	"selection",
	"separator",
	"separators",
	"stretchy",
	"subscriptshift",
	"supscriptshift",
	"symmetric",
	"voffset",
	"width",
	"xmlns"
]);
var xml = freeze([
	"xlink:href",
	"xml:id",
	"xlink:title",
	"xml:space",
	"xmlns:xlink"
]);
var MUSTACHE_EXPR = seal(/{{[\w\W]*|^[\w\W]*}}/g);
var ERB_EXPR = seal(/<%[\w\W]*|^[\w\W]*%>/g);
var TMPLIT_EXPR = seal(/\${[\w\W]*/g);
var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]+$/);
var ARIA_ATTR = seal(/^aria-[\-\w]+$/);
var IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i);
var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
var ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g);
var DOCTYPE_NAME = seal(/^html$/i);
var CUSTOM_ELEMENT = seal(/^[a-z][.\w]*(-[.\w]+)+$/i);
var ELEMENT_MARKUP_PROBE = seal(/<[/\w!]/g);
var COMMENT_MARKUP_PROBE = seal(/<[/\w]/g);
var FALLBACK_TAG_CLOSE = seal(/<\/no(script|embed|frames)/i);
var SELF_CLOSING_TAG = seal(/\/>/i);
var NODE_TYPE = {
	element: 1,
	attribute: 2,
	text: 3,
	cdataSection: 4,
	entityReference: 5,
	entityNode: 6,
	processingInstruction: 7,
	comment: 8,
	document: 9,
	documentType: 10,
	documentFragment: 11,
	notation: 12
};
var LITERAL_TEXT_ELEMENT_NAMES = [
	"style",
	"script",
	"xmp",
	"iframe",
	"noembed",
	"noframes",
	"plaintext",
	"noscript"
];
var LITERAL_TEXT_ELEMENTS = freeze(addToSet({}, LITERAL_TEXT_ELEMENT_NAMES));
var LITERAL_TEXT_CLOSE = function() {
	const map = {};
	arrayForEach(LITERAL_TEXT_ELEMENT_NAMES, (name) => {
		map[name] = seal(new RegExp("</" + name + "(?=[\\t\\n\\f\\r />])", "i"));
	});
	return freeze(map);
}();
var getGlobal = function getGlobal() {
	return typeof window === "undefined" ? null : window;
};
/**
* Creates a no-op policy for internal use only.
* Don't export this function outside this module!
* @param trustedTypes The policy factory.
* @param purifyHostElement The Script element used to load DOMPurify (to determine policy name suffix).
* @return The policy created (or null, if Trusted Types
* are not supported or creating the policy failed).
*/
var _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, purifyHostElement) {
	if (typeof trustedTypes !== "object" || typeof trustedTypes.createPolicy !== "function") return null;
	let suffix = null;
	const ATTR_NAME = "data-tt-policy-suffix";
	if (purifyHostElement && purifyHostElement.hasAttribute(ATTR_NAME)) suffix = purifyHostElement.getAttribute(ATTR_NAME);
	const policyName = "dompurify" + (suffix ? "#" + suffix : "");
	try {
		return trustedTypes.createPolicy(policyName, {
			createHTML(html) {
				return html;
			},
			createScriptURL(scriptUrl) {
				return scriptUrl;
			}
		});
	} catch (_) {
		console.warn("TrustedTypes policy " + policyName + " could not be created.");
		return null;
	}
};
var _createHooksMap = function _createHooksMap() {
	return {
		afterSanitizeAttributes: [],
		afterSanitizeElements: [],
		afterSanitizeShadowDOM: [],
		beforeSanitizeAttributes: [],
		beforeSanitizeElements: [],
		beforeSanitizeShadowDOM: [],
		uponSanitizeAttribute: [],
		uponSanitizeElement: [],
		uponSanitizeShadowNode: []
	};
};
/**
* Resolve a set-valued configuration option: a fresh set built from
* cfg[key] when it is an own array property (seeded with a clone of
* options.base when given, case-normalized via options.transform),
* the fallback set otherwise.
*
* @param cfg the cloned, prototype-free configuration object
* @param key the configuration property to read
* @param fallback the set to use when the option is absent or not an array
* @param options transform and optional base set to merge into
* @returns the resolved set
*/
var _resolveSetOption = function _resolveSetOption(cfg, key, fallback, options) {
	return objectHasOwnProperty(cfg, key) && arrayIsArray(cfg[key]) ? addToSet(options.base ? clone(options.base) : {}, cfg[key], options.transform) : fallback;
};
/**
* Resolve an object-valued configuration option: a prototype-free clone
* of cfg[key] when it is an own, truthy object property, else a fresh
* fallback built by makeFallback (fresh on every parse, so a previous
* parse can never leak state into the next one).
*
* @param cfg the cloned, prototype-free configuration object
* @param key the configuration property to read
* @param makeFallback builds the fallback value when the option is absent
* @returns the resolved object
*/
var _resolveObjectOption = function _resolveObjectOption(cfg, key, makeFallback) {
	const value = objectHasOwnProperty(cfg, key) ? cfg[key] : void 0;
	return value && typeof value === "object" ? clone(value) : makeFallback();
};
function createDOMPurify() {
	let window = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getGlobal();
	const DOMPurify = (root) => createDOMPurify(root);
	DOMPurify.version = "3.4.15";
	DOMPurify.removed = [];
	if (!window || !window.document || window.document.nodeType !== NODE_TYPE.document || !window.Element) {
		DOMPurify.isSupported = false;
		return DOMPurify;
	}
	let document = window.document;
	const originalDocument = document;
	const currentScript = originalDocument.currentScript;
	window.DocumentFragment;
	const HTMLTemplateElement = window.HTMLTemplateElement, Node = window.Node, Element = window.Element, NodeFilter = window.NodeFilter;
	window.NamedNodeMap === void 0 && (window.NamedNodeMap || window.MozNamedAttrMap);
	window.HTMLFormElement;
	const DOMParser = window.DOMParser, trustedTypes = window.trustedTypes;
	const ElementPrototype = Element.prototype;
	const cloneNode = lookupGetter(ElementPrototype, "cloneNode");
	const remove = lookupGetter(ElementPrototype, "remove");
	const removeAttributeNode = lookupGetter(ElementPrototype, "removeAttributeNode");
	const getNextSibling = lookupGetter(ElementPrototype, "nextSibling");
	const getChildNodes = lookupGetter(ElementPrototype, "childNodes");
	const getParentNode = lookupGetter(ElementPrototype, "parentNode");
	const getShadowRoot = lookupGetter(ElementPrototype, "shadowRoot");
	const getAttributes = lookupGetter(ElementPrototype, "attributes");
	const getNodeType = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeType") : null;
	const getNodeName = Node && Node.prototype ? lookupGetter(Node.prototype, "nodeName") : null;
	const getOwnerDocument = Node && Node.prototype ? lookupGetter(Node.prototype, "ownerDocument") : null;
	const _readNodeType = function _readNodeType(node) {
		return getNodeType ? getNodeType(node) : node.nodeType;
	};
	const _readNodeName = function _readNodeName(node) {
		return getNodeName ? getNodeName(node) : node.nodeName;
	};
	if (typeof HTMLTemplateElement === "function") {
		const template = document.createElement("template");
		if (template.content && template.content.ownerDocument) document = template.content.ownerDocument;
	}
	let trustedTypesPolicy;
	let emptyHTML = "";
	let defaultTrustedTypesPolicy;
	let defaultTrustedTypesPolicyResolved = false;
	let IN_TRUSTED_TYPES_POLICY = 0;
	const _assertNotInTrustedTypesPolicy = function _assertNotInTrustedTypesPolicy() {
		if (IN_TRUSTED_TYPES_POLICY > 0) throw typeErrorCreate("A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the \"DOMPurify and Trusted Types\" section of the README.");
	};
	const _createTrustedHTML = function _createTrustedHTML(html) {
		_assertNotInTrustedTypesPolicy();
		IN_TRUSTED_TYPES_POLICY++;
		try {
			return trustedTypesPolicy.createHTML(html);
		} finally {
			IN_TRUSTED_TYPES_POLICY--;
		}
	};
	const _createTrustedScriptURL = function _createTrustedScriptURL(scriptUrl) {
		_assertNotInTrustedTypesPolicy();
		IN_TRUSTED_TYPES_POLICY++;
		try {
			return trustedTypesPolicy.createScriptURL(scriptUrl);
		} finally {
			IN_TRUSTED_TYPES_POLICY--;
		}
	};
	const _getDefaultTrustedTypesPolicy = function _getDefaultTrustedTypesPolicy() {
		if (!defaultTrustedTypesPolicyResolved) {
			defaultTrustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, currentScript);
			defaultTrustedTypesPolicyResolved = true;
		}
		return defaultTrustedTypesPolicy;
	};
	const _document = document, implementation = _document.implementation, createNodeIterator = _document.createNodeIterator, createDocumentFragment = _document.createDocumentFragment, getElementsByTagName = _document.getElementsByTagName;
	const importNode = originalDocument.importNode;
	let hooks = _createHooksMap();
	/**
	* Expose whether this browser supports running the full DOMPurify.
	*/
	DOMPurify.isSupported = typeof entries === "function" && typeof getParentNode === "function" && implementation && implementation.createHTMLDocument !== void 0;
	const MUSTACHE_EXPR$1 = MUSTACHE_EXPR, ERB_EXPR$1 = ERB_EXPR, TMPLIT_EXPR$1 = TMPLIT_EXPR, DATA_ATTR$1 = DATA_ATTR, ARIA_ATTR$1 = ARIA_ATTR, IS_SCRIPT_OR_DATA$1 = IS_SCRIPT_OR_DATA, ATTR_WHITESPACE$1 = ATTR_WHITESPACE, CUSTOM_ELEMENT$1 = CUSTOM_ELEMENT;
	let IS_ALLOWED_URI$1 = IS_ALLOWED_URI;
	/**
	* We consider the elements and attributes below to be safe. Ideally
	* don't add any new ones but feel free to remove unwanted ones.
	*/
	let ALLOWED_TAGS = null;
	const DEFAULT_ALLOWED_TAGS = addToSet({}, [
		...html$1,
		...svg$1,
		...svgFilters,
		...mathMl$1,
		...text
	]);
	let ALLOWED_ATTR = null;
	const DEFAULT_ALLOWED_ATTR = addToSet({}, [
		...html,
		...svg,
		...mathMl,
		...xml
	]);
	let CUSTOM_ELEMENT_HANDLING = Object.seal(create(null, {
		tagNameCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		},
		attributeNameCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		},
		allowCustomizedBuiltInElements: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: false
		}
	}));
	let FORBID_TAGS = null;
	let FORBID_ATTR = null;
	const EXTRA_ELEMENT_HANDLING = Object.seal(create(null, {
		tagCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		},
		attributeCheck: {
			writable: true,
			configurable: false,
			enumerable: true,
			value: null
		}
	}));
	let ALLOW_ARIA_ATTR = true;
	let ALLOW_DATA_ATTR = true;
	let ALLOW_UNKNOWN_PROTOCOLS = false;
	let ALLOW_SELF_CLOSE_IN_ATTR = true;
	let SAFE_FOR_TEMPLATES = false;
	let SAFE_FOR_XML = true;
	let WHOLE_DOCUMENT = false;
	let SET_CONFIG = false;
	let SET_CONFIG_ALLOWED_TAGS = null;
	let SET_CONFIG_ALLOWED_ATTR = null;
	let FORCE_BODY = false;
	let RETURN_DOM = false;
	let RETURN_DOM_FRAGMENT = false;
	let RETURN_TRUSTED_TYPE = false;
	let SANITIZE_DOM = true;
	let SANITIZE_NAMED_PROPS = false;
	const SANITIZE_NAMED_PROPS_PREFIX = "user-content-";
	let KEEP_CONTENT = true;
	let IN_PLACE = false;
	let USE_PROFILES = {};
	let FORBID_CONTENTS = null;
	const DEFAULT_FORBID_CONTENTS = addToSet({}, [
		"annotation-xml",
		"audio",
		"colgroup",
		"desc",
		"foreignobject",
		"head",
		"iframe",
		"math",
		"mi",
		"mn",
		"mo",
		"ms",
		"mtext",
		"noembed",
		"noframes",
		"noscript",
		"plaintext",
		"script",
		"selectedcontent",
		"style",
		"svg",
		"template",
		"thead",
		"title",
		"video",
		"xmp"
	]);
	let DATA_URI_TAGS = null;
	const DEFAULT_DATA_URI_TAGS = addToSet({}, [
		"audio",
		"video",
		"img",
		"source",
		"image",
		"track"
	]);
	let URI_SAFE_ATTRIBUTES = null;
	const DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, [
		"alt",
		"class",
		"for",
		"id",
		"label",
		"name",
		"pattern",
		"placeholder",
		"role",
		"summary",
		"title",
		"value",
		"style",
		"xmlns"
	]);
	const MATHML_NAMESPACE = "http://www.w3.org/1998/Math/MathML";
	const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
	const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
	let NAMESPACE = HTML_NAMESPACE;
	let IS_EMPTY_INPUT = false;
	let ALLOWED_NAMESPACES = null;
	const DEFAULT_ALLOWED_NAMESPACES = addToSet({}, [
		MATHML_NAMESPACE,
		SVG_NAMESPACE,
		HTML_NAMESPACE
	], stringToString);
	const DEFAULT_MATHML_TEXT_INTEGRATION_POINTS = freeze([
		"mi",
		"mo",
		"mn",
		"ms",
		"mtext"
	]);
	let MATHML_TEXT_INTEGRATION_POINTS = addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS);
	const DEFAULT_HTML_INTEGRATION_POINTS = freeze(["annotation-xml"]);
	let HTML_INTEGRATION_POINTS = addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS);
	const COMMON_SVG_AND_HTML_ELEMENTS = addToSet({}, [
		"title",
		"style",
		"font",
		"a",
		"script"
	]);
	let PARSER_MEDIA_TYPE = null;
	const SUPPORTED_PARSER_MEDIA_TYPES = ["application/xhtml+xml", "text/html"];
	const DEFAULT_PARSER_MEDIA_TYPE = "text/html";
	let transformCaseFunc = null;
	let CONFIG = null;
	const formElement = document.createElement("form");
	const isRegexOrFunction = function isRegexOrFunction(testValue) {
		return testValue instanceof RegExp || testValue instanceof Function;
	};
	/**
	* _parseConfig
	*
	* @param cfg optional config literal
	*/
	const _parseConfig = function _parseConfig() {
		let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		if (CONFIG && CONFIG === cfg) return;
		if (!cfg || typeof cfg !== "object") cfg = {};
		cfg = clone(cfg);
		PARSER_MEDIA_TYPE = SUPPORTED_PARSER_MEDIA_TYPES.indexOf(cfg.PARSER_MEDIA_TYPE) === -1 ? DEFAULT_PARSER_MEDIA_TYPE : cfg.PARSER_MEDIA_TYPE;
		transformCaseFunc = PARSER_MEDIA_TYPE === "application/xhtml+xml" ? stringToString : stringToLowerCase;
		ALLOWED_TAGS = _resolveSetOption(cfg, "ALLOWED_TAGS", DEFAULT_ALLOWED_TAGS, { transform: transformCaseFunc });
		ALLOWED_ATTR = _resolveSetOption(cfg, "ALLOWED_ATTR", DEFAULT_ALLOWED_ATTR, { transform: transformCaseFunc });
		ALLOWED_NAMESPACES = _resolveSetOption(cfg, "ALLOWED_NAMESPACES", DEFAULT_ALLOWED_NAMESPACES, { transform: stringToString });
		URI_SAFE_ATTRIBUTES = _resolveSetOption(cfg, "ADD_URI_SAFE_ATTR", DEFAULT_URI_SAFE_ATTRIBUTES, {
			transform: transformCaseFunc,
			base: DEFAULT_URI_SAFE_ATTRIBUTES
		});
		DATA_URI_TAGS = _resolveSetOption(cfg, "ADD_DATA_URI_TAGS", DEFAULT_DATA_URI_TAGS, {
			transform: transformCaseFunc,
			base: DEFAULT_DATA_URI_TAGS
		});
		FORBID_CONTENTS = _resolveSetOption(cfg, "FORBID_CONTENTS", DEFAULT_FORBID_CONTENTS, { transform: transformCaseFunc });
		FORBID_TAGS = _resolveSetOption(cfg, "FORBID_TAGS", clone({}), { transform: transformCaseFunc });
		FORBID_ATTR = _resolveSetOption(cfg, "FORBID_ATTR", clone({}), { transform: transformCaseFunc });
		USE_PROFILES = objectHasOwnProperty(cfg, "USE_PROFILES") ? cfg.USE_PROFILES && typeof cfg.USE_PROFILES === "object" ? clone(cfg.USE_PROFILES) : cfg.USE_PROFILES : false;
		ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false;
		ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false;
		ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false;
		ALLOW_SELF_CLOSE_IN_ATTR = cfg.ALLOW_SELF_CLOSE_IN_ATTR !== false;
		SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false;
		SAFE_FOR_XML = cfg.SAFE_FOR_XML !== false;
		WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false;
		RETURN_DOM = cfg.RETURN_DOM || false;
		RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false;
		RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false;
		FORCE_BODY = cfg.FORCE_BODY || false;
		SANITIZE_DOM = cfg.SANITIZE_DOM !== false;
		SANITIZE_NAMED_PROPS = cfg.SANITIZE_NAMED_PROPS || false;
		KEEP_CONTENT = cfg.KEEP_CONTENT !== false;
		IN_PLACE = cfg.IN_PLACE || false;
		IS_ALLOWED_URI$1 = isRegex(cfg.ALLOWED_URI_REGEXP) ? cfg.ALLOWED_URI_REGEXP : IS_ALLOWED_URI;
		NAMESPACE = typeof cfg.NAMESPACE === "string" ? cfg.NAMESPACE : HTML_NAMESPACE;
		MATHML_TEXT_INTEGRATION_POINTS = _resolveObjectOption(cfg, "MATHML_TEXT_INTEGRATION_POINTS", () => addToSet({}, DEFAULT_MATHML_TEXT_INTEGRATION_POINTS));
		HTML_INTEGRATION_POINTS = _resolveObjectOption(cfg, "HTML_INTEGRATION_POINTS", () => addToSet({}, DEFAULT_HTML_INTEGRATION_POINTS));
		const customElementHandling = _resolveObjectOption(cfg, "CUSTOM_ELEMENT_HANDLING", () => create(null));
		CUSTOM_ELEMENT_HANDLING = create(null);
		if (objectHasOwnProperty(customElementHandling, "tagNameCheck") && isRegexOrFunction(customElementHandling.tagNameCheck)) CUSTOM_ELEMENT_HANDLING.tagNameCheck = customElementHandling.tagNameCheck;
		if (objectHasOwnProperty(customElementHandling, "attributeNameCheck") && isRegexOrFunction(customElementHandling.attributeNameCheck)) CUSTOM_ELEMENT_HANDLING.attributeNameCheck = customElementHandling.attributeNameCheck;
		if (objectHasOwnProperty(customElementHandling, "allowCustomizedBuiltInElements") && typeof customElementHandling.allowCustomizedBuiltInElements === "boolean") CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements = customElementHandling.allowCustomizedBuiltInElements;
		seal(CUSTOM_ELEMENT_HANDLING);
		if (SAFE_FOR_TEMPLATES) ALLOW_DATA_ATTR = false;
		if (RETURN_DOM_FRAGMENT) RETURN_DOM = true;
		if (USE_PROFILES) {
			ALLOWED_TAGS = addToSet({}, text);
			ALLOWED_ATTR = create(null);
			if (USE_PROFILES.html === true) {
				addToSet(ALLOWED_TAGS, html$1);
				addToSet(ALLOWED_ATTR, html);
			}
			if (USE_PROFILES.svg === true) {
				addToSet(ALLOWED_TAGS, svg$1);
				addToSet(ALLOWED_ATTR, svg);
				addToSet(ALLOWED_ATTR, xml);
			}
			if (USE_PROFILES.svgFilters === true) {
				addToSet(ALLOWED_TAGS, svgFilters);
				addToSet(ALLOWED_ATTR, svg);
				addToSet(ALLOWED_ATTR, xml);
			}
			if (USE_PROFILES.mathMl === true) {
				addToSet(ALLOWED_TAGS, mathMl$1);
				addToSet(ALLOWED_ATTR, mathMl);
				addToSet(ALLOWED_ATTR, xml);
			}
		}
		EXTRA_ELEMENT_HANDLING.tagCheck = null;
		EXTRA_ELEMENT_HANDLING.attributeCheck = null;
		if (objectHasOwnProperty(cfg, "ADD_TAGS")) {
			if (typeof cfg.ADD_TAGS === "function") EXTRA_ELEMENT_HANDLING.tagCheck = cfg.ADD_TAGS;
			else if (arrayIsArray(cfg.ADD_TAGS)) {
				if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) ALLOWED_TAGS = clone(ALLOWED_TAGS);
				addToSet(ALLOWED_TAGS, cfg.ADD_TAGS, transformCaseFunc);
			}
		}
		if (objectHasOwnProperty(cfg, "ADD_ATTR")) {
			if (typeof cfg.ADD_ATTR === "function") EXTRA_ELEMENT_HANDLING.attributeCheck = cfg.ADD_ATTR;
			else if (arrayIsArray(cfg.ADD_ATTR)) {
				if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) ALLOWED_ATTR = clone(ALLOWED_ATTR);
				addToSet(ALLOWED_ATTR, cfg.ADD_ATTR, transformCaseFunc);
			}
		}
		if (objectHasOwnProperty(cfg, "ADD_FORBID_CONTENTS") && arrayIsArray(cfg.ADD_FORBID_CONTENTS)) {
			if (FORBID_CONTENTS === DEFAULT_FORBID_CONTENTS) FORBID_CONTENTS = clone(FORBID_CONTENTS);
			addToSet(FORBID_CONTENTS, cfg.ADD_FORBID_CONTENTS, transformCaseFunc);
		}
		if (KEEP_CONTENT) ALLOWED_TAGS["#text"] = true;
		if (WHOLE_DOCUMENT) addToSet(ALLOWED_TAGS, [
			"html",
			"head",
			"body"
		]);
		if (ALLOWED_TAGS.table) {
			addToSet(ALLOWED_TAGS, ["tbody"]);
			delete FORBID_TAGS.tbody;
		}
		if (cfg.TRUSTED_TYPES_POLICY) {
			if (typeof cfg.TRUSTED_TYPES_POLICY.createHTML !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createHTML\" hook.");
			if (typeof cfg.TRUSTED_TYPES_POLICY.createScriptURL !== "function") throw typeErrorCreate("TRUSTED_TYPES_POLICY configuration option must provide a \"createScriptURL\" hook.");
			const previousTrustedTypesPolicy = trustedTypesPolicy;
			trustedTypesPolicy = cfg.TRUSTED_TYPES_POLICY;
			try {
				emptyHTML = _createTrustedHTML("");
			} catch (error) {
				trustedTypesPolicy = previousTrustedTypesPolicy;
				throw error;
			}
		} else if (cfg.TRUSTED_TYPES_POLICY === null) {
			trustedTypesPolicy = void 0;
			emptyHTML = "";
		} else {
			if (trustedTypesPolicy === void 0) trustedTypesPolicy = _getDefaultTrustedTypesPolicy();
			if (trustedTypesPolicy && typeof emptyHTML === "string") emptyHTML = _createTrustedHTML("");
		}
		if (freeze) freeze(cfg);
		CONFIG = cfg;
	};
	const ALL_SVG_TAGS = addToSet({}, [
		...svg$1,
		...svgFilters,
		...svgDisallowed
	]);
	const ALL_MATHML_TAGS = addToSet({}, [...mathMl$1, ...mathMlDisallowed]);
	/**
	* Namespace rules for an element in the SVG namespace.
	*
	* @param tagName the element's lowercase tag name
	* @param parent the (possibly simulated) parent node
	* @param parentTagName the parent's lowercase tag name
	* @returns true if a spec-compliant parser could produce this element
	*/
	const _checkSvgNamespace = function _checkSvgNamespace(tagName, parent, parentTagName) {
		if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "svg";
		if (parent.namespaceURI === MATHML_NAMESPACE) return tagName === "svg" && (parentTagName === "annotation-xml" || MATHML_TEXT_INTEGRATION_POINTS[parentTagName]);
		return Boolean(ALL_SVG_TAGS[tagName]);
	};
	/**
	* Namespace rules for an element in the MathML namespace.
	*
	* @param tagName the element's lowercase tag name
	* @param parent the (possibly simulated) parent node
	* @param parentTagName the parent's lowercase tag name
	* @returns true if a spec-compliant parser could produce this element
	*/
	const _checkMathMlNamespace = function _checkMathMlNamespace(tagName, parent, parentTagName) {
		if (parent.namespaceURI === HTML_NAMESPACE) return tagName === "math";
		if (parent.namespaceURI === SVG_NAMESPACE) return tagName === "math" && HTML_INTEGRATION_POINTS[parentTagName];
		return Boolean(ALL_MATHML_TAGS[tagName]);
	};
	/**
	* Namespace rules for an element in the HTML namespace.
	*
	* @param tagName the element's lowercase tag name
	* @param parent the (possibly simulated) parent node
	* @param parentTagName the parent's lowercase tag name
	* @returns true if a spec-compliant parser could produce this element
	*/
	const _checkHtmlNamespace = function _checkHtmlNamespace(tagName, parent, parentTagName) {
		if (parent.namespaceURI === SVG_NAMESPACE && !HTML_INTEGRATION_POINTS[parentTagName]) return false;
		if (parent.namespaceURI === MATHML_NAMESPACE && !MATHML_TEXT_INTEGRATION_POINTS[parentTagName]) return false;
		return !ALL_MATHML_TAGS[tagName] && (COMMON_SVG_AND_HTML_ELEMENTS[tagName] || !ALL_SVG_TAGS[tagName]);
	};
	/**
	* @param element a DOM element whose namespace is being checked
	* @returns Return false if the element has a
	*  namespace that a spec-compliant parser would never
	*  return. Return true otherwise.
	*/
	const _checkValidNamespace = function _checkValidNamespace(element) {
		let parent = getParentNode(element);
		if (!parent || !parent.tagName) parent = {
			namespaceURI: NAMESPACE,
			tagName: "template"
		};
		const tagName = stringToLowerCase(element.tagName);
		const parentTagName = stringToLowerCase(parent.tagName);
		if (!ALLOWED_NAMESPACES[element.namespaceURI]) return false;
		if (element.namespaceURI === SVG_NAMESPACE) return _checkSvgNamespace(tagName, parent, parentTagName);
		if (element.namespaceURI === MATHML_NAMESPACE) return _checkMathMlNamespace(tagName, parent, parentTagName);
		if (element.namespaceURI === HTML_NAMESPACE) return _checkHtmlNamespace(tagName, parent, parentTagName);
		if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && ALLOWED_NAMESPACES[element.namespaceURI]) return true;
		return false;
	};
	/**
	* _forceRemove
	*
	* @param node a DOM node
	*/
	const _forceRemove = function _forceRemove(node) {
		arrayPush(DOMPurify.removed, { element: node });
		try {
			getParentNode(node).removeChild(node);
		} catch (_) {
			remove(node);
			if (!getParentNode(node)) throw typeErrorCreate("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place");
		}
	};
	/**
	* _stripAttributeNode
	*
	* Remove a single Attr node case/namespace-exactly on an attribute-teardown
	* path. Name-based removeAttribute() ASCII-lowercases its lookup key for an
	* HTML element in an HTML document and so silently misses a case-preserved
	* handler (e.g. `ONERROR` off an XML/XHTML import) - the same defect
	* _removeAttribute() was fixed for, which a name-based call would reintroduce
	* on these IN_PLACE teardown paths. Unlike _removeAttribute this does not
	* record into DOMPurify.removed: the neutralize passes intentionally do not
	* book-keep. A clobbered/detached node falls back to best-effort name-based
	* removal.
	*
	* @param element the element to strip the attribute from
	* @param attribute the Attr node to remove
	* @param name the attribute's name, for the fallback path
	*/
	const _stripAttributeNode = function _stripAttributeNode(element, attribute, name) {
		try {
			removeAttributeNode(element, attribute);
		} catch (_) {
			try {
				element.removeAttribute(name);
			} catch (_) {}
		}
	};
	/**
	* _neutralizeRoot
	*
	* Fail-closed teardown of an in-place root after the sanitize walk aborts
	* (campaign-3 F2). An internal throw mid-walk — e.g. a page-registered
	* custom element's reaction detaches a node so `_forceRemove`'s deliberate
	* parentless guard throws, or any other re-entrant engine mutation — would
	* otherwise leave the caller's *live* tree half-sanitized, with everything
	* after the abort point still carrying its handlers. There is no safe way
	* to resume the walk (the tree mutated under us), so we strip the root bare:
	* remove every child and every attribute, then let the caller's catch see
	* the original error. Clobber-safe (cached `remove`/`childNodes`/`attributes`
	* getters; the root was already clobber-pre-flighted at the IN_PLACE entry).
	*
	* @param root the in-place root to empty
	*/
	const _neutralizeRoot = function _neutralizeRoot(root) {
		_neutralizeSubtree(root);
		const childNodes = getChildNodes(root);
		if (childNodes) {
			const snapshot = [];
			arrayForEach(childNodes, (child) => {
				arrayPush(snapshot, child);
			});
			arrayForEach(snapshot, (child) => {
				try {
					remove(child);
				} catch (_) {}
			});
		}
		const attributes = getAttributes(root);
		if (attributes) for (let i = attributes.length - 1; i >= 0; --i) {
			const attribute = attributes[i];
			const name = attribute && attribute.name;
			if (typeof name === "string") _stripAttributeNode(root, attribute, name);
		}
	};
	/**
	* _removeAttribute
	*
	* Name-based getAttributeNode()/removeAttribute() ASCII-lowercase their
	* lookup key for HTML elements in an HTML document, so they silently miss an
	* attribute whose stored qualified name still contains uppercase ASCII
	* letters. That happens when the node came from a case-preserving source
	* (an XML/XHTML document imported via importNode(), or createAttributeNS()),
	* where e.g. `ONERROR` survives the walk: the policy check lowercases to
	* `onerror` and rejects it, but `removeAttribute('ONERROR')` looks up
	* `onerror` and finds nothing. Remove the exact Attr node instead, which is
	* case- and namespace-exact, and fall back to name-based removal only when
	* the caller could not supply the node.
	*
	* @param name an Attribute name
	* @param element a DOM node
	* @param attr the exact Attr node to remove, when the caller has it
	*/
	const _removeAttribute = function _removeAttribute(name, element, attr) {
		if (!attr) try {
			attr = element.getAttributeNode(name);
		} catch (_) {
			attr = null;
		}
		arrayPush(DOMPurify.removed, {
			attribute: attr || null,
			from: element
		});
		try {
			if (attr) removeAttributeNode(element, attr);
			else element.removeAttribute(name);
		} catch (_) {
			try {
				element.removeAttribute(name);
			} catch (_) {}
		}
		if (name === "is") if (RETURN_DOM || RETURN_DOM_FRAGMENT) try {
			_forceRemove(element);
		} catch (_) {}
		else try {
			element.setAttribute(name, "");
		} catch (_) {}
	};
	/**
	* _stripDisallowedAttributes
	*
	* Removes every attribute the active configuration does not allow from a
	* single element, using the same allowlist as the main attribute pass (so
	* `on*` handlers go, but no `/^on/` blocklist is introduced). Used only to
	* neutralise nodes that are being discarded from an in-place tree.
	*
	* @param element the element to strip
	*/
	const _stripDisallowedAttributes = function _stripDisallowedAttributes(element) {
		const attributes = getAttributes(element);
		if (!attributes) return;
		for (let i = attributes.length - 1; i >= 0; --i) {
			const attribute = attributes[i];
			const name = attribute && attribute.name;
			if (typeof name !== "string" || ALLOWED_ATTR[transformCaseFunc(name)]) continue;
			_stripAttributeNode(element, attribute, name);
		}
	};
	/**
	* _neutralizeSubtree
	*
	* Completes the audit-5 F1 fix across every removal path. The KEEP_CONTENT
	* move-hoist neutralises only disallowed-tag removals; clobber, mXSS-canary,
	* namespace, comment, processing-instruction and KEEP_CONTENT:false removals
	* all drop their subtree wholesale via `_forceRemove`. On the IN_PLACE path
	* those dropped nodes are detached from the caller's LIVE tree but a
	* handler-bearing original among them (an `<img onerror>`/`<video>` that was
	* loading) keeps its queued resource event, which fires in page scope after
	* sanitize returns. This walks a removed subtree and strips every attribute
	* the active configuration does not allow — so `on*` handlers are cancelled
	* through the SAME allowlist that governs kept nodes, not a separate `/^on/`
	* blocklist. Run synchronously before sanitize returns, i.e. before any
	* queued event can fire. Hook-free by design: these nodes leave the output,
	* so firing attribute hooks for them would be surprising. Clobber-safe reads;
	* a doomed clobbered node may shadow `removeAttribute` (its own attributes are
	* irrelevant — it is discarded — while its non-clobbered descendants, e.g.
	* the `<img>`, are reached and scrubbed).
	*
	* @param root the root of a removed subtree to neutralise
	*/
	const _neutralizeSubtree = function _neutralizeSubtree(root) {
		const stack = [root];
		while (stack.length > 0) {
			const node = stack.pop();
			if (_readNodeType(node) === NODE_TYPE.element) _stripDisallowedAttributes(node);
			const childNodes = getChildNodes(node);
			if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push(childNodes[i]);
		}
	};
	/**
	* _neutralizePatchLinkage
	*
	* IN_PLACE entry pre-pass (declarative-partial-updates / streaming
	* hardening, https://github.com/WICG/declarative-partial-updates).
	*
	* The main walk strips patch linkage (`for`/`patchsrc`) and removes range
	* markers (PIs / markup comments) node-by-node, in document order, AS it
	* reaches each node. On a live in-place root that leaves a window: from the
	* moment the root is connected until the walk arrives at a given node, that
	* node's linkage is live. A patch applied on connection/stream can fire as
	* a microtask during the walk and inject or teleport an unsanitized DOM
	* range into a region the iterator has already passed and will not revisit,
	* so the post-return "tree is sanitized" contract is violated. Sweep the
	* whole tree once up front and sever every linkage before the walk begins,
	* closing that window.
	*
	* This CANNOT undo a patch that already fired before sanitize ran — that is
	* the irreducible "do not IN_PLACE a live-connected attacker tree" caveat —
	* but it closes everything from sanitize-start onward. Gated on SAFE_FOR_XML
	* to group with the rest of the declarative-partial-updates handling and
	* stay overridable, consistent with the codebase.
	*
	* Clobber-safe traversal (cached childNodes getter); per-node try/catch so a
	* clobbered root cannot defeat the sweep of its non-clobbered descendants.
	*
	* NOTE (pending real-Chrome confirmation, see test/declarative-patch-probe
	* .html Q1): this mirrors the existing policy of keeping `for` on
	* <label>/<output>. If the shipping feature can drive a patch through a
	* surviving `for`-on-label/output + `id` pair, this pre-pass and the
	* attribute check at _isBasicCustomElement's caller must additionally drop
	* that pair on the IN_PLACE path. Left as-is until the taxonomy is verified.
	*
	* @param root the in-place root to sweep
	*/
	/**
	* Central policy for declarative-partial-updates patch-linkage attributes,
	* shared by the _neutralizePatchLinkage pre-pass and _isValidAttribute so
	* the two sites cannot drift: `patchsrc` always links, `for` links
	* everywhere except on <label>/<output>, and the whole policy is gated on
	* SAFE_FOR_XML (see the rationale block in _isValidAttribute).
	*
	* @param lcName the transformCaseFunc'd attribute name
	* @param lcTag the transformCaseFunc'd tag name of the carrying element
	* @return true if the attribute is patch linkage and must be dropped
	*/
	const _isPatchLinkageAttribute = function _isPatchLinkageAttribute(lcName, lcTag) {
		if (!SAFE_FOR_XML) return false;
		if (lcName === "patchsrc") return true;
		return lcName === "for" && lcTag !== "label" && lcTag !== "output";
	};
	const _neutralizePatchLinkage = function _neutralizePatchLinkage(root) {
		if (!SAFE_FOR_XML) return;
		const stack = [root];
		while (stack.length > 0) {
			const node = stack.pop();
			const nodeType = _readNodeType(node);
			if (nodeType === NODE_TYPE.processingInstruction || nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, node.data)) {
				try {
					remove(node);
				} catch (_) {}
				continue;
			}
			if (nodeType === NODE_TYPE.element) {
				const element = node;
				const lcTag = transformCaseFunc(_readNodeName(node));
				try {
					if (element.hasAttribute && element.hasAttribute("patchsrc")) element.removeAttribute("patchsrc");
					if (element.hasAttribute && element.hasAttribute("for") && _isPatchLinkageAttribute("for", lcTag)) element.removeAttribute("for");
				} catch (_) {}
			}
			const childNodes = getChildNodes(node);
			if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push(childNodes[i]);
		}
	};
	/**
	* _initDocument
	*
	* @param dirty - a string of dirty markup
	* @return a DOM, filled with the dirty markup
	*/
	const _initDocument = function _initDocument(dirty) {
		let doc = null;
		let leadingWhitespace = null;
		if (FORCE_BODY) dirty = "<remove></remove>" + dirty;
		else {
			const matches = stringMatch(dirty, /^[\r\n\t ]+/);
			leadingWhitespace = matches && matches[0];
		}
		if (PARSER_MEDIA_TYPE === "application/xhtml+xml" && NAMESPACE === HTML_NAMESPACE) dirty = "<html xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>" + dirty + "</body></html>";
		const dirtyPayload = trustedTypesPolicy ? _createTrustedHTML(dirty) : dirty;
		if (NAMESPACE === HTML_NAMESPACE) try {
			doc = new DOMParser().parseFromString(dirtyPayload, PARSER_MEDIA_TYPE);
		} catch (_) {}
		if (!doc || !doc.documentElement) {
			doc = implementation.createDocument(NAMESPACE, "template", null);
			try {
				doc.documentElement.innerHTML = IS_EMPTY_INPUT ? emptyHTML : dirtyPayload;
			} catch (_) {}
		}
		const body = doc.body || doc.documentElement;
		if (dirty && leadingWhitespace) body.insertBefore(document.createTextNode(leadingWhitespace), body.childNodes[0] || null);
		if (NAMESPACE === HTML_NAMESPACE) return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? "html" : "body")[0];
		return WHOLE_DOCUMENT ? doc.documentElement : body;
	};
	/**
	* Creates a NodeIterator object that you can use to traverse filtered lists of nodes or elements in a document.
	*
	* @param root The root element or node to start traversing on.
	* @return The created NodeIterator
	*/
	const _createNodeIterator = function _createNodeIterator(root) {
		const doc = getOwnerDocument ? getOwnerDocument(root) : root.ownerDocument;
		return createNodeIterator.call(doc || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_PROCESSING_INSTRUCTION | NodeFilter.SHOW_CDATA_SECTION, null);
	};
	/**
	* Replace template expression syntax (mustache, ERB, template
	* literal) with a space; shared by all SAFE_FOR_TEMPLATES scrub
	* sites. Order matters: mustache, then ERB, then template literal.
	*
	* @param value the string to scrub
	* @returns the scrubbed string
	*/
	const _stripTemplateExpressions = function _stripTemplateExpressions(value) {
		value = stringReplace(value, MUSTACHE_EXPR$1, " ");
		value = stringReplace(value, ERB_EXPR$1, " ");
		value = stringReplace(value, TMPLIT_EXPR$1, " ");
		return value;
	};
	/**
	* Strip template-engine expressions ({{...}}, ${...}, <%...%>) from the
	* character data of an element subtree. Used as the final safety net for
	* SAFE_FOR_TEMPLATES on every DOM-returning code path so that expressions
	* which only form after text-node normalization (e.g. fragments split across
	* stripped elements) cannot survive into a template-evaluating framework.
	*
	* Walks text/comment/CDATA/processing-instruction nodes and mutates `.data`
	* in place rather than round-tripping through innerHTML. This preserves
	* descendant node references (important for IN_PLACE callers), avoids a
	* serialize/reparse cycle, and reads literal character data — which means
	* `<%...%>` in text content matches the ERB regex against its real bytes
	* instead of the HTML-entity-escaped form innerHTML would produce.
	*
	* Attribute values are not visited here; SAFE_FOR_TEMPLATES handling for
	* attributes is performed during the per-node `_sanitizeAttributes` pass.
	*
	* @param node The root element whose character data should be scrubbed.
	*/
	const _scrubTemplateExpressions2 = function _scrubTemplateExpressions(node) {
		var _node$querySelectorAl;
		node.normalize();
		const doc = getOwnerDocument ? getOwnerDocument(node) : node.ownerDocument;
		const walker = createNodeIterator.call(doc || node, node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_CDATA_SECTION | NodeFilter.SHOW_PROCESSING_INSTRUCTION, null);
		let currentNode = walker.nextNode();
		while (currentNode) {
			currentNode.data = _stripTemplateExpressions(currentNode.data);
			currentNode = walker.nextNode();
		}
		const templates = (_node$querySelectorAl = node.querySelectorAll) === null || _node$querySelectorAl === void 0 ? void 0 : _node$querySelectorAl.call(node, "template");
		if (templates) arrayForEach(templates, (tmpl) => {
			if (_isDocumentFragment(tmpl.content)) _scrubTemplateExpressions2(tmpl.content);
		});
	};
	/**
	* _isClobbered
	*
	* Detect DOM-clobbering on HTMLFormElement nodes. Form is the only HTML
	* interface with [LegacyOverrideBuiltIns]; a descendant element with a
	* `name` attribute matching a prototype property shadows that property
	* on direct reads. We use this check at the IN_PLACE entry-point and
	* during attribute sanitization to refuse clobbered forms.
	*
	* @param element element to check for clobbering attacks
	* @return true if clobbered, false if safe
	*/
	const _isClobbered = function _isClobbered(element) {
		const realTagName = getNodeName ? getNodeName(element) : null;
		if (typeof realTagName !== "string") return false;
		if (transformCaseFunc(realTagName) !== "form") return false;
		return typeof element.nodeName !== "string" || typeof element.textContent !== "string" || typeof element.removeChild !== "function" || element.attributes !== getAttributes(element) || typeof element.removeAttribute !== "function" || typeof element.removeAttributeNode !== "function" || typeof element.getAttributeNode !== "function" || typeof element.setAttribute !== "function" || typeof element.namespaceURI !== "string" || typeof element.insertBefore !== "function" || typeof element.hasChildNodes !== "function" || element.nodeType !== getNodeType(element) || element.childNodes !== getChildNodes(element);
	};
	/**
	* Checks whether the given value is a DocumentFragment from any realm.
	*
	* The realm-independent replacement reads `nodeType` through the cached
	* Node.prototype getter and compares to the DOCUMENT_FRAGMENT_NODE
	* constant (11). nodeType is a numeric value resolved from the node's
	* internal slot, identical across realms for the same kind of node.
	*
	* @param value object to check
	* @return true if value is a DocumentFragment-shaped node from any realm
	*/
	const _isDocumentFragment = function _isDocumentFragment(value) {
		if (!getNodeType || typeof value !== "object" || value === null) return false;
		try {
			return getNodeType(value) === NODE_TYPE.documentFragment;
		} catch (_) {
			return false;
		}
	};
	/**
	* Checks whether the given object is a DOM node, including nodes that
	* originate from a different window/realm (e.g. an iframe's
	* contentDocument). The previous `value instanceof Node` check was
	* realm-bound: nodes from a different window failed it, causing
	* sanitize() to silently stringify them and reset IN_PLACE to false,
	* returning the original node unsanitized. See GHSA-4w3q-35jp-p934.
	*
	* @param value object to check whether it's a DOM node
	* @return true if value is a DOM node from any realm
	*/
	const _isNode = function _isNode(value) {
		if (!getNodeType || typeof value !== "object" || value === null) return false;
		try {
			return typeof getNodeType(value) === "number";
		} catch (_) {
			return false;
		}
	};
	function _executeHooks(hooks, currentNode, data) {
		if (hooks.length === 0) return;
		arrayForEach(hooks, (hook) => {
			hook.call(DOMPurify, currentNode, data, CONFIG);
		});
	}
	/**
	* Structural-threat checks that condemn a node regardless of the
	* allowlists: mXSS via namespace confusion, risky CSS construction,
	* processing instructions, markup-bearing comments. Pure predicate;
	* the caller removes. Check order is load-bearing.
	*
	* @param currentNode the node to inspect
	* @param tagName the node's transformCaseFunc'd tag name
	* @return true if the node must be removed
	*/
	const _isUnsafeNode = function _isUnsafeNode(currentNode, tagName) {
		if (SAFE_FOR_XML && currentNode.hasChildNodes() && !_isNode(currentNode.firstElementChild) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.textContent) && regExpTest(ELEMENT_MARKUP_PROBE, currentNode.innerHTML)) return true;
		if (SAFE_FOR_XML && currentNode.namespaceURI === HTML_NAMESPACE && LITERAL_TEXT_ELEMENTS[tagName] && (_isNode(currentNode.firstElementChild) || typeof currentNode.textContent === "string" && regExpTest(LITERAL_TEXT_CLOSE[tagName], currentNode.textContent))) return true;
		if (currentNode.nodeType === NODE_TYPE.processingInstruction) return true;
		if (SAFE_FOR_XML && currentNode.nodeType === NODE_TYPE.comment && regExpTest(COMMENT_MARKUP_PROBE, currentNode.data)) return true;
		return false;
	};
	/**
	* Evaluate a CUSTOM_ELEMENT_HANDLING check (a RegExp or a predicate
	* function, per the validation in _parseConfig) against a name.
	* Additional arguments are forwarded to predicate functions - the
	* attributeNameCheck predicate receives the tag name as its second
	* argument. A null/absent check never matches.
	*
	* @param check the configured tagNameCheck / attributeNameCheck value
	* @param name the name to test
	* @param args extra arguments forwarded to a predicate function
	* @return true if the check matches the name
	*/
	const _matchesNameCheck = function _matchesNameCheck(check, name) {
		if (check instanceof RegExp) return regExpTest(check, name);
		if (check instanceof Function) {
			for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) args[_key - 2] = arguments[_key];
			return Boolean(check(name, ...args));
		}
		return false;
	};
	/**
	* Handle a node whose tag is forbidden or not allowlisted: keep
	* allowed custom elements (false return exits _sanitizeElements
	* early - the namespace and fallback-tag removal checks are
	* intentionally skipped for kept custom elements), else hoist
	* content per KEEP_CONTENT and remove.
	*
	* A kept custom element is the ONLY case in which this function
	* returns false, so the caller uses that return value to run the
	* afterSanitizeElements hook on the kept element and keep the
	* element-hook lifecycle consistent with normal allowlisted
	* elements (GHSA-c2j3-45gr-mqc4).
	*
	* @param currentNode the disallowed node
	* @param tagName the node's transformCaseFunc'd tag name
	* @return true if the node was removed, false if kept
	*/
	const _sanitizeDisallowedNode = function _sanitizeDisallowedNode(currentNode, tagName, root) {
		if (!FORBID_TAGS[tagName] && _isBasicCustomElement(tagName) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, tagName)) return false;
		if (KEEP_CONTENT && !FORBID_CONTENTS[tagName]) {
			const parentNode = getParentNode(currentNode);
			const childNodes = getChildNodes(currentNode);
			if (childNodes && parentNode) {
				const childCount = childNodes.length;
				for (let i = childCount - 1; i >= 0; --i) {
					const hoisted = currentNode === root ? cloneNode(childNodes[i], true) : childNodes[i];
					parentNode.insertBefore(hoisted, getNextSibling(currentNode));
				}
			}
		}
		_forceRemove(currentNode);
		return true;
	};
	/**
	* Fork a hook-mutable allowlist off its shared binding the first time a
	* (possibly lazily-installed) uponSanitize* hook is about to see it, so the
	* hook cannot widen the per-instance default or the setConfig binding by
	* reference and leak past the call. Returns the set unchanged once it is
	* already call-local, so repeated calls across elements are idempotent.
	*
	* @param hookList the uponSanitize* hook array for this event
	* @param set the current ALLOWED_TAGS / ALLOWED_ATTR binding
	* @param defaultSet the per-instance DEFAULT_ALLOWED_* constant
	* @param setConfigSet the captured setConfig() binding, or null
	* @return a call-local clone if a hook is present and set is still shared,
	*   else set unchanged
	*/
	const _forkSharedAllowlist = function _forkSharedAllowlist(hookList, set, defaultSet, setConfigSet) {
		if (hookList.length === 0) return set;
		return set === defaultSet || set === setConfigSet ? clone(set) : set;
	};
	/**
	* Shared guard for a node that a hook has detached from the walk tree,
	* used after each element-hook site in _sanitizeElements. Detaching is a
	* long-standing user pattern (issue #469; draw.io-style foreignObject
	* filtering). Per the cached, unclobberable parentNode getter the node is
	* genuinely out of the tree, so it can reach neither the serialized
	* output nor an IN_PLACE live tree; treat it as removed and stop
	* processing it. Without this guard, the unsafe-node / namespace checks
	* would call _forceRemove on a parentless node and hit the REPORT-3
	* fail-closed throw — which exists for nodes DOMPurify wants gone but
	* *cannot* detach (clobbered / parentless roots), the opposite of a node
	* that is already safely gone. The walk root is exempt: a detached
	* IN_PLACE root is legitimate input and must still be fully sanitized,
	* and a kill-decision on it must keep hitting the REPORT-3 throw.
	*
	* Nodes detached by hooks stay the hook's responsibility for placement:
	* they are not recorded in DOMPurify.removed, so the post-walk IN_PLACE
	* pass (which iterates DOMPurify.removed) does not reach them. But a
	* hook-detached subtree can still hold a queued resource-event handler -
	* e.g. an <img onload> that began loading when the caller built the live
	* tree - which fires in page scope after sanitize returns even though the
	* handler never reached the returned tree. That is the audit-5 F1 hazard,
	* and the documented node.remove() hook pattern walks straight into it.
	* So on the IN_PLACE path we neutralize the detached subtree inline,
	* stripping its non-allow-listed attributes before returning, exactly as
	* the post-walk pass does for _forceRemove'd subtrees.
	*
	* @param currentNode the node a hook may have detached
	* @param root the current walk root
	* @return true if the node is detached and now handled, false otherwise
	*/
	const _handleHookDetachedNode = function _handleHookDetachedNode(currentNode, root) {
		if (currentNode === root || getParentNode(currentNode) !== null) return false;
		if (IN_PLACE) _neutralizeSubtree(currentNode);
		return true;
	};
	/**
	* _sanitizeElements
	*
	* @protect nodeName
	* @protect textContent
	* @protect removeChild
	* @param currentNode to check for permission to exist
	* @return true if node was killed, false if left alive
	*/
	const _sanitizeElements = function _sanitizeElements(currentNode, root) {
		_executeHooks(hooks.beforeSanitizeElements, currentNode, null);
		if (_handleHookDetachedNode(currentNode, root)) return true;
		if (_isClobbered(currentNode)) {
			_forceRemove(currentNode);
			return true;
		}
		const tagName = transformCaseFunc(_readNodeName(currentNode));
		ALLOWED_TAGS = _forkSharedAllowlist(hooks.uponSanitizeElement, ALLOWED_TAGS, DEFAULT_ALLOWED_TAGS, SET_CONFIG_ALLOWED_TAGS);
		_executeHooks(hooks.uponSanitizeElement, currentNode, {
			tagName,
			allowedTags: ALLOWED_TAGS
		});
		if (_handleHookDetachedNode(currentNode, root)) return true;
		if (_isUnsafeNode(currentNode, tagName)) {
			_forceRemove(currentNode);
			return true;
		}
		if (FORBID_TAGS[tagName] || !(EXTRA_ELEMENT_HANDLING.tagCheck instanceof Function && EXTRA_ELEMENT_HANDLING.tagCheck(tagName)) && !ALLOWED_TAGS[tagName]) {
			const removed = _sanitizeDisallowedNode(currentNode, tagName, root);
			if (removed === false) _executeHooks(hooks.afterSanitizeElements, currentNode, null);
			return removed;
		}
		if (_readNodeType(currentNode) === NODE_TYPE.element && !_checkValidNamespace(currentNode)) {
			_forceRemove(currentNode);
			return true;
		}
		if ((tagName === "noscript" || tagName === "noembed" || tagName === "noframes") && regExpTest(FALLBACK_TAG_CLOSE, currentNode.innerHTML)) {
			_forceRemove(currentNode);
			return true;
		}
		if (SAFE_FOR_TEMPLATES && currentNode.nodeType === NODE_TYPE.text) {
			const content = _stripTemplateExpressions(currentNode.textContent);
			if (currentNode.textContent !== content) {
				arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
				currentNode.textContent = content;
			}
		}
		_executeHooks(hooks.afterSanitizeElements, currentNode, null);
		return false;
	};
	/**
	* _isValidAttribute
	*
	* @param lcTag Lowercase tag name of containing element.
	* @param lcName Lowercase attribute name.
	* @param value Attribute value.
	* @return Returns true if `value` is valid, otherwise false.
	*/
	const _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
		if (FORBID_ATTR[lcName]) return false;
		if (_isPatchLinkageAttribute(lcName, lcTag)) return false;
		if (SANITIZE_DOM && (lcName === "id" || lcName === "name") && (value in document || value in formElement)) return false;
		const nameIsPermitted = ALLOWED_ATTR[lcName] || EXTRA_ELEMENT_HANDLING.attributeCheck instanceof Function && EXTRA_ELEMENT_HANDLING.attributeCheck(lcName, lcTag);
		if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$1, lcName)) return true;
		if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$1, lcName)) return true;
		if (!nameIsPermitted) return _isBasicCustomElement(lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, lcTag) && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.attributeNameCheck, lcName, lcTag) || lcName === "is" && CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements && _matchesNameCheck(CUSTOM_ELEMENT_HANDLING.tagNameCheck, value);
		if (URI_SAFE_ATTRIBUTES[lcName]) return true;
		if (regExpTest(IS_ALLOWED_URI$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) return true;
		if ((lcName === "src" || lcName === "xlink:href" || lcName === "href") && lcTag !== "script" && stringIndexOf(value, "data:") === 0 && DATA_URI_TAGS[lcTag]) return true;
		if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$1, stringReplace(value, ATTR_WHITESPACE$1, ""))) return true;
		return !value;
	};
	const RESERVED_CUSTOM_ELEMENT_NAMES = addToSet({}, [
		"annotation-xml",
		"color-profile",
		"font-face",
		"font-face-format",
		"font-face-name",
		"font-face-src",
		"font-face-uri",
		"missing-glyph"
	]);
	/**
	* _isBasicCustomElement
	* checks if at least one dash is included in tagName, and it's not the first char
	* for more sophisticated checking see https://github.com/sindresorhus/validate-element-name
	*
	* @param tagName name of the tag of the node to sanitize
	* @returns Returns true if the tag name meets the basic criteria for a custom element, otherwise false.
	*/
	const _isBasicCustomElement = function _isBasicCustomElement(tagName) {
		return !RESERVED_CUSTOM_ELEMENT_NAMES[stringToLowerCase(tagName)] && regExpTest(CUSTOM_ELEMENT$1, tagName);
	};
	/**
	* Wrap an attribute value in the matching Trusted Types object when
	* the active policy requires it. Namespaced attributes pass through
	* unchanged (no TT support yet, see
	* https://bugs.chromium.org/p/chromium/issues/detail?id=1305293).
	*
	* @param lcTag lowercase tag name of the containing element
	* @param lcName lowercase attribute name
	* @param namespaceURI the attribute's namespace, if any
	* @param value the attribute value to wrap
	* @return the value, wrapped when Trusted Types demand it
	*/
	const _applyTrustedTypesToAttribute = function _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value) {
		if (trustedTypesPolicy && typeof trustedTypes === "object" && typeof trustedTypes.getAttributeType === "function" && !namespaceURI) switch (trustedTypes.getAttributeType(lcTag, lcName)) {
			case "TrustedHTML": return _createTrustedHTML(value);
			case "TrustedScriptURL": return _createTrustedScriptURL(value);
		}
		return value;
	};
	/**
	* Write a modified attribute value back onto the element. On
	* success, re-probe for clobbering introduced by the new value and
	* remove the element when found; otherwise, when this writeback is the
	* recreate half of the SANITIZE_NAMED_PROPS remove-and-recreate, pop the
	* removal entry that path recorded so it does not show as removed. On
	* failure, remove the attribute instead.
	*
	* Returns true only on a clean write (the value was set and the new value
	* introduced no clobbering). The caller uses that, together with its own
	* knowledge of whether this attribute pushed a DOMPurify.removed record, to
	* decide whether to pop that record. The pop must happen ONLY for the
	* named-prop remove-and-recreate; popping on any other value change (trim,
	* template scrubbing, Trusted Types) would consume an unrelated _forceRemove
	* subtree-cleanup record and let that detached subtree keep a live event
	* handler through the IN_PLACE neutralization pass (SO-001).
	*
	* @param currentNode the element carrying the attribute
	* @param name the attribute name as present on the element
	* @param namespaceURI the attribute's namespace, if any
	* @param value the new attribute value
	* @return true if the value was written without introducing clobbering
	*/
	const _setAttributeValue = function _setAttributeValue(currentNode, name, namespaceURI, value) {
		try {
			if (namespaceURI) currentNode.setAttributeNS(namespaceURI, name, value);
			else currentNode.setAttribute(name, value);
			if (_isClobbered(currentNode)) {
				_forceRemove(currentNode);
				return false;
			}
			return true;
		} catch (_) {
			_removeAttribute(name, currentNode);
			return false;
		}
	};
	/**
	* _sanitizeAttributes
	*
	* @protect attributes
	* @protect nodeName
	* @protect removeAttribute
	* @protect setAttribute
	*
	* @param currentNode to sanitize
	*/
	const _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
		_executeHooks(hooks.beforeSanitizeAttributes, currentNode, null);
		const attributes = currentNode.attributes;
		if (!attributes || _isClobbered(currentNode)) return;
		ALLOWED_ATTR = _forkSharedAllowlist(hooks.uponSanitizeAttribute, ALLOWED_ATTR, DEFAULT_ALLOWED_ATTR, SET_CONFIG_ALLOWED_ATTR);
		const hookEvent = {
			attrName: "",
			attrValue: "",
			keepAttr: true,
			allowedAttributes: ALLOWED_ATTR,
			forceKeepAttr: void 0
		};
		let l = attributes.length;
		const lcTag = transformCaseFunc(currentNode.nodeName);
		while (l--) {
			const attr = attributes[l];
			const name = attr.name, namespaceURI = attr.namespaceURI, attrValue = attr.value;
			const lcName = transformCaseFunc(name);
			const initValue = attrValue;
			let value = name === "value" ? initValue : stringTrim(initValue);
			let recreatedNamedProp = false;
			hookEvent.attrName = lcName;
			hookEvent.attrValue = value;
			hookEvent.keepAttr = true;
			hookEvent.forceKeepAttr = void 0;
			_executeHooks(hooks.uponSanitizeAttribute, currentNode, hookEvent);
			value = hookEvent.attrValue;
			if (SANITIZE_NAMED_PROPS && (lcName === "id" || lcName === "name") && stringIndexOf(value, SANITIZE_NAMED_PROPS_PREFIX) !== 0) {
				_removeAttribute(name, currentNode, attr);
				value = SANITIZE_NAMED_PROPS_PREFIX + value;
				recreatedNamedProp = true;
			}
			if (SAFE_FOR_XML && regExpTest(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, value)) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			if (lcName === "attributename" && stringMatch(value, "href")) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			if (hookEvent.forceKeepAttr) continue;
			if (!hookEvent.keepAttr) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			if (!ALLOW_SELF_CLOSE_IN_ATTR && regExpTest(SELF_CLOSING_TAG, value)) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			if (SAFE_FOR_TEMPLATES) value = _stripTemplateExpressions(value);
			if (!_isValidAttribute(lcTag, lcName, value)) {
				_removeAttribute(name, currentNode, attr);
				continue;
			}
			value = _applyTrustedTypesToAttribute(lcTag, lcName, namespaceURI, value);
			if (value !== initValue) {
				if (_setAttributeValue(currentNode, name, namespaceURI, value) && recreatedNamedProp) arrayPop(DOMPurify.removed);
			}
		}
		_executeHooks(hooks.afterSanitizeAttributes, currentNode, null);
	};
	/**
	* _sanitizeShadowDOM
	*
	* @param fragment to iterate over recursively
	*/
	const _sanitizeShadowDOM2 = function _sanitizeShadowDOM(fragment) {
		let shadowNode = null;
		const shadowIterator = _createNodeIterator(fragment);
		_executeHooks(hooks.beforeSanitizeShadowDOM, fragment, null);
		while (shadowNode = shadowIterator.nextNode()) {
			_executeHooks(hooks.uponSanitizeShadowNode, shadowNode, null);
			_sanitizeElements(shadowNode, fragment);
			_sanitizeAttributes(shadowNode);
			if (_isDocumentFragment(shadowNode.content)) _sanitizeShadowDOM2(shadowNode.content);
			if (_readNodeType(shadowNode) === NODE_TYPE.element) {
				const innerSr = getShadowRoot(shadowNode);
				if (_isDocumentFragment(innerSr)) {
					_sanitizeAttachedShadowRoots(innerSr);
					_sanitizeShadowDOM2(innerSr);
				}
			}
		}
		_executeHooks(hooks.afterSanitizeShadowDOM, fragment, null);
	};
	/**
	* _sanitizeAttachedShadowRoots
	*
	* Walks `root` and feeds every attached shadow root we encounter into
	* the existing _sanitizeShadowDOM pipeline. The default node iterator
	* does not descend into shadow trees, so nodes inside an attached
	* shadow root would otherwise be skipped entirely.
	*
	* Two real input paths put attached shadow roots in front of us:
	*   1. IN_PLACE on a DOM node that already has shadow roots attached.
	*   2. DOM-node input where importNode(dirty, true) deep-clones the
	*      shadow root because it was created with `clonable: true`.
	*
	* This pass runs once, up front, so the main iteration loop (and the
	* existing _sanitizeShadowDOM template-content recursion) stay
	* untouched — string-input paths are not affected.
	*
	* @param root the subtree root to walk for attached shadow roots
	*/
	const _sanitizeAttachedShadowRoots = function _sanitizeAttachedShadowRoots(root) {
		const stack = [{
			node: root,
			shadow: null
		}];
		while (stack.length > 0) {
			const item = stack.pop();
			if (item.shadow) {
				_sanitizeShadowDOM2(item.shadow);
				continue;
			}
			const node = item.node;
			const isElement = _readNodeType(node) === NODE_TYPE.element;
			const childNodes = getChildNodes(node);
			if (childNodes) for (let i = childNodes.length - 1; i >= 0; --i) stack.push({
				node: childNodes[i],
				shadow: null
			});
			if (isElement) {
				const rootName = getNodeName ? getNodeName(node) : null;
				if (typeof rootName === "string" && transformCaseFunc(rootName) === "template") {
					const content = node.content;
					if (_isDocumentFragment(content)) stack.push({
						node: content,
						shadow: null
					});
				}
			}
			if (isElement) {
				const sr = getShadowRoot(node);
				if (_isDocumentFragment(sr)) stack.push({
					node: null,
					shadow: sr
				}, {
					node: sr,
					shadow: null
				});
			}
		}
	};
	DOMPurify.sanitize = function(dirty) {
		let cfg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		let body = null;
		let importedNode = null;
		let currentNode = null;
		let returnNode = null;
		IS_EMPTY_INPUT = !dirty;
		if (IS_EMPTY_INPUT) dirty = "<!-->";
		if (typeof dirty !== "string" && !_isNode(dirty)) {
			dirty = stringifyValue(dirty);
			if (typeof dirty !== "string") throw typeErrorCreate("dirty is not a string, aborting");
		}
		if (!DOMPurify.isSupported) return dirty;
		if (SET_CONFIG) {
			ALLOWED_TAGS = SET_CONFIG_ALLOWED_TAGS;
			ALLOWED_ATTR = SET_CONFIG_ALLOWED_ATTR;
		} else _parseConfig(cfg);
		if (hooks.uponSanitizeElement.length > 0 || hooks.uponSanitizeAttribute.length > 0) ALLOWED_TAGS = clone(ALLOWED_TAGS);
		if (hooks.uponSanitizeAttribute.length > 0) ALLOWED_ATTR = clone(ALLOWED_ATTR);
		DOMPurify.removed = [];
		const inPlace = IN_PLACE && typeof dirty !== "string" && _isNode(dirty);
		if (inPlace) {
			_neutralizePatchLinkage(dirty);
			const nn = _readNodeName(dirty);
			if (typeof nn === "string") {
				const tagName = transformCaseFunc(nn);
				if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
					_neutralizeRoot(dirty);
					throw typeErrorCreate("root node is forbidden and cannot be sanitized in-place");
				}
			}
			if (_isClobbered(dirty)) {
				_neutralizeRoot(dirty);
				throw typeErrorCreate("root node is clobbered and cannot be sanitized in-place");
			}
			try {
				_sanitizeAttachedShadowRoots(dirty);
			} catch (error) {
				_neutralizeRoot(dirty);
				throw error;
			}
		} else if (_isNode(dirty)) {
			body = _initDocument("<!---->");
			importedNode = body.ownerDocument.importNode(dirty, true);
			if (importedNode.nodeType === NODE_TYPE.element && importedNode.nodeName === "BODY") body = importedNode;
			else if (importedNode.nodeName === "HTML") body = importedNode;
			else body.appendChild(importedNode);
			_sanitizeAttachedShadowRoots(body);
		} else {
			if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && dirty.indexOf("<") === -1) return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(dirty) : dirty;
			body = _initDocument(dirty);
			if (!body) return RETURN_DOM ? null : RETURN_TRUSTED_TYPE ? emptyHTML : "";
		}
		if (body && FORCE_BODY) _forceRemove(body.firstChild);
		const walkRoot = inPlace ? dirty : body;
		try {
			const nodeIterator = _createNodeIterator(walkRoot);
			while (currentNode = nodeIterator.nextNode()) {
				_sanitizeElements(currentNode, walkRoot);
				_sanitizeAttributes(currentNode);
				if (_isDocumentFragment(currentNode.content)) _sanitizeShadowDOM2(currentNode.content);
			}
		} catch (error) {
			if (inPlace) {
				_neutralizeRoot(dirty);
				arrayForEach(DOMPurify.removed, (entry) => {
					if (entry.element) _neutralizeSubtree(entry.element);
				});
			}
			throw error;
		}
		if (inPlace) {
			arrayForEach(DOMPurify.removed, (entry) => {
				if (entry.element) _neutralizeSubtree(entry.element);
			});
			if (SAFE_FOR_TEMPLATES) _scrubTemplateExpressions2(dirty);
			return dirty;
		}
		if (RETURN_DOM) {
			if (SAFE_FOR_TEMPLATES) _scrubTemplateExpressions2(body);
			if (RETURN_DOM_FRAGMENT) {
				returnNode = createDocumentFragment.call(body.ownerDocument);
				while (body.firstChild) returnNode.appendChild(body.firstChild);
			} else returnNode = body;
			if (ALLOWED_ATTR.shadowroot || ALLOWED_ATTR.shadowrootmode) returnNode = importNode.call(originalDocument, returnNode, true);
			return returnNode;
		}
		let serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;
		if (WHOLE_DOCUMENT && ALLOWED_TAGS["!doctype"] && body.ownerDocument && body.ownerDocument.doctype && body.ownerDocument.doctype.name && regExpTest(DOCTYPE_NAME, body.ownerDocument.doctype.name)) serializedHTML = "<!DOCTYPE " + body.ownerDocument.doctype.name + ">\n" + serializedHTML;
		if (SAFE_FOR_TEMPLATES) serializedHTML = _stripTemplateExpressions(serializedHTML);
		return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? _createTrustedHTML(serializedHTML) : serializedHTML;
	};
	DOMPurify.setConfig = function() {
		let cfg = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		_parseConfig(cfg);
		SET_CONFIG = true;
		SET_CONFIG_ALLOWED_TAGS = ALLOWED_TAGS;
		SET_CONFIG_ALLOWED_ATTR = ALLOWED_ATTR;
	};
	DOMPurify.clearConfig = function() {
		CONFIG = null;
		SET_CONFIG = false;
		SET_CONFIG_ALLOWED_TAGS = null;
		SET_CONFIG_ALLOWED_ATTR = null;
		trustedTypesPolicy = defaultTrustedTypesPolicy;
		emptyHTML = "";
	};
	DOMPurify.isValidAttribute = function(tag, attr, value) {
		if (!CONFIG) _parseConfig({});
		const lcTag = transformCaseFunc(tag);
		const lcName = transformCaseFunc(attr);
		return _isValidAttribute(lcTag, lcName, value);
	};
	DOMPurify.addHook = function(entryPoint, hookFunction) {
		if (typeof hookFunction !== "function") return;
		if (!objectHasOwnProperty(hooks, entryPoint)) return;
		arrayPush(hooks[entryPoint], hookFunction);
	};
	DOMPurify.removeHook = function(entryPoint, hookFunction) {
		if (!objectHasOwnProperty(hooks, entryPoint)) return;
		if (hookFunction !== void 0) {
			const index = arrayLastIndexOf(hooks[entryPoint], hookFunction);
			return index === -1 ? void 0 : arraySplice(hooks[entryPoint], index, 1)[0];
		}
		return arrayPop(hooks[entryPoint]);
	};
	DOMPurify.removeHooks = function(entryPoint) {
		if (!objectHasOwnProperty(hooks, entryPoint)) return;
		hooks[entryPoint] = [];
	};
	DOMPurify.removeAllHooks = function() {
		hooks = _createHooksMap();
	};
	return DOMPurify;
}
var purify = createDOMPurify();
//#endregion
//#region ../../node_modules/.pnpm/@panzoom+panzoom@4.6.2/node_modules/@panzoom/panzoom/dist/panzoom.es.js
/**
* Panzoom 4.6.2 for panning and zooming elements using CSS transforms
* Copyright Timmy Willison and other contributors
* https://github.com/timmywil/panzoom/blob/main/MIT-License.txt
*/
if (typeof window !== "undefined") {
	if (window.NodeList && !NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;
	if (typeof window.CustomEvent !== "function") window.CustomEvent = function CustomEvent(event, params) {
		params = params || {
			bubbles: false,
			cancelable: false,
			detail: null
		};
		var evt = document.createEvent("CustomEvent");
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	};
}
var isIE = typeof document !== "undefined" && !!document.documentMode;
/**
* Lazy creation of a CSS style declaration
*/
var divStyle;
function createStyle$1() {
	if (divStyle) return divStyle;
	return divStyle = document.createElement("div").style;
}
/**
* Proper prefixing for cross-browser compatibility
*/
var prefixes = [
	"webkit",
	"moz",
	"ms"
];
var prefixCache = {};
function getPrefixedName(name) {
	if (prefixCache[name]) return prefixCache[name];
	const divStyle = createStyle$1();
	if (name in divStyle) return prefixCache[name] = name;
	const capName = name[0].toUpperCase() + name.slice(1);
	let i = prefixes.length;
	while (i--) {
		const prefixedName = `${prefixes[i]}${capName}`;
		if (prefixedName in divStyle) return prefixCache[name] = prefixedName;
	}
}
/**
* Gets a style value expected to be a number
*/
function getCSSNum(name, style) {
	return parseFloat(style[getPrefixedName(name)]) || 0;
}
function getBoxStyle(elem, name, style = window.getComputedStyle(elem)) {
	const suffix = name === "border" ? "Width" : "";
	return {
		left: getCSSNum(`${name}Left${suffix}`, style),
		right: getCSSNum(`${name}Right${suffix}`, style),
		top: getCSSNum(`${name}Top${suffix}`, style),
		bottom: getCSSNum(`${name}Bottom${suffix}`, style)
	};
}
/**
* Set a style using the properly prefixed name
*/
function setStyle(elem, name, value) {
	elem.style[getPrefixedName(name)] = value;
}
/**
* Constructs the transition from panzoom options
* and takes care of prefixing the transition and transform
*/
function setTransition(elem, options) {
	setStyle(elem, "transition", `${getPrefixedName("transform")} ${options.duration}ms ${options.easing}`);
}
/**
* Set the transform using the proper prefix
*
* Override the transform setter.
* This is exposed mostly so the user could
* set other parts of a transform
* aside from scale and translate.
* Default is defined in src/css.ts.
*
* ```js
* // This example always sets a rotation
* // when setting the scale and translation
* const panzoom = Panzoom(elem, {
*   setTransform: (elem, { scale, x, y }) => {
*     panzoom.setStyle('transform', `rotate(0.5turn) scale(${scale}) translate(${x}px, ${y}px)`)
*   }
* })
* ```
*/
function setTransform(elem, { x, y, scale, isSVG }, _options) {
	setStyle(elem, "transform", `scale(${scale}) translate(${x}px, ${y}px)`);
	if (isSVG && isIE) {
		const matrixValue = window.getComputedStyle(elem).getPropertyValue("transform");
		elem.setAttribute("transform", matrixValue);
	}
}
/**
* Dimensions used in containment and focal point zooming
*/
function getDimensions(elem) {
	let parent = elem.parentNode;
	if (!parent || parent.nodeType !== 1) parent = document.documentElement;
	const style = window.getComputedStyle(elem);
	const parentStyle = window.getComputedStyle(parent);
	const rectElem = elem.getBoundingClientRect();
	const rectParent = parent.getBoundingClientRect();
	return {
		elem: {
			style,
			width: rectElem.width,
			height: rectElem.height,
			top: rectElem.top,
			bottom: rectElem.bottom,
			left: rectElem.left,
			right: rectElem.right,
			margin: getBoxStyle(elem, "margin", style),
			border: getBoxStyle(elem, "border", style)
		},
		parent: {
			style: parentStyle,
			width: rectParent.width,
			height: rectParent.height,
			top: rectParent.top,
			bottom: rectParent.bottom,
			left: rectParent.left,
			right: rectParent.right,
			padding: getBoxStyle(parent, "padding", parentStyle),
			border: getBoxStyle(parent, "border", parentStyle)
		}
	};
}
var events = {
	down: "mousedown",
	move: "mousemove",
	up: "mouseup mouseleave"
};
if (typeof window !== "undefined") {
	if (typeof window.PointerEvent === "function") events = {
		down: "pointerdown",
		move: "pointermove",
		up: "pointerup pointerleave pointercancel"
	};
	else if (typeof window.TouchEvent === "function") events = {
		down: "touchstart",
		move: "touchmove",
		up: "touchend touchcancel"
	};
}
function onPointer(event, elem, handler, eventOpts) {
	events[event].split(" ").forEach((name) => {
		elem.addEventListener(name, handler, eventOpts);
	});
}
function destroyPointer(event, elem, handler) {
	events[event].split(" ").forEach((name) => {
		elem.removeEventListener(name, handler);
	});
}
/**
* Utilites for working with multiple pointer events
*/
function findEventIndex(pointers, event) {
	let i = pointers.length;
	while (i--) if (pointers[i].pointerId === event.pointerId) return i;
	return -1;
}
function addPointer(pointers, event) {
	let i;
	if (event.touches) {
		i = 0;
		for (const touch of event.touches) {
			touch.pointerId = i++;
			addPointer(pointers, touch);
		}
		return;
	}
	i = findEventIndex(pointers, event);
	if (i > -1) pointers.splice(i, 1);
	pointers.push(event);
}
function removePointer(pointers, event) {
	if (event.touches) {
		while (pointers.length) pointers.pop();
		return;
	}
	const i = findEventIndex(pointers, event);
	if (i > -1) pointers.splice(i, 1);
}
/**
* Calculates a center point between
* the given pointer events, for panning
* with multiple pointers.
*/
function getMiddle(pointers) {
	pointers = pointers.slice(0);
	let event1 = pointers.pop();
	let event2;
	while (event2 = pointers.pop()) event1 = {
		clientX: (event2.clientX - event1.clientX) / 2 + event1.clientX,
		clientY: (event2.clientY - event1.clientY) / 2 + event1.clientY
	};
	return event1;
}
/**
* Calculates the distance between two points
* for pinch zooming.
* Limits to the first 2
*/
function getDistance(pointers) {
	if (pointers.length < 2) return 0;
	const event1 = pointers[0];
	const event2 = pointers[1];
	return Math.sqrt(Math.pow(Math.abs(event2.clientX - event1.clientX), 2) + Math.pow(Math.abs(event2.clientY - event1.clientY), 2));
}
/**
* Determine if an element is attached to the DOM
* Panzoom requires this so events work properly
*/
function isAttached(node) {
	let currentNode = node;
	while (currentNode && currentNode.parentNode) {
		if (currentNode.parentNode === document) return true;
		currentNode = currentNode.parentNode instanceof ShadowRoot ? currentNode.parentNode.host : currentNode.parentNode;
	}
	return false;
}
function getClass(elem) {
	return (elem.getAttribute("class") || "").trim();
}
function hasClass(elem, className) {
	return elem.nodeType === 1 && ` ${getClass(elem)} `.indexOf(` ${className} `) > -1;
}
function isExcluded(elem, options) {
	for (let cur = elem; cur != null; cur = cur.parentNode) if (hasClass(cur, options.excludeClass) || options.exclude.indexOf(cur) > -1) return true;
	return false;
}
/**
* Determine if an element is SVG by checking the namespace
* Exception: the <svg> element itself should be treated like HTML
*/
var rsvg = /^http:[\w\.\/]+svg$/;
function isSVGElement(elem) {
	return rsvg.test(elem.namespaceURI) && elem.nodeName.toLowerCase() !== "svg";
}
function shallowClone(obj) {
	const clone = {};
	for (const key in obj) if (obj.hasOwnProperty(key)) clone[key] = obj[key];
	return clone;
}
/**
* Panzoom for panning and zooming elements using CSS transforms
* https://github.com/timmywil/panzoom
*
* Copyright Timmy Willison and other contributors
* Released under the MIT license
* https://github.com/timmywil/panzoom/blob/main/MIT-License.txt
*
*/
var defaultOptions = {
	animate: false,
	canvas: false,
	cursor: "move",
	disablePan: false,
	disableZoom: false,
	disableXAxis: false,
	disableYAxis: false,
	duration: 200,
	easing: "ease-in-out",
	exclude: [],
	excludeClass: "panzoom-exclude",
	handleStartEvent: (e) => {
		e.preventDefault();
		e.stopPropagation();
	},
	maxScale: 4,
	minScale: .125,
	overflow: "hidden",
	panOnlyWhenZoomed: false,
	pinchAndPan: false,
	relative: false,
	setTransform,
	startX: 0,
	startY: 0,
	startScale: 1,
	step: .3,
	touchAction: "none"
};
function Panzoom(elem, options) {
	if (!elem) throw new Error("Panzoom requires an element as an argument");
	if (elem.nodeType !== 1) throw new Error("Panzoom requires an element with a nodeType of 1");
	if (!isAttached(elem)) throw new Error("Panzoom should be called on elements that have been attached to the DOM");
	options = {
		...defaultOptions,
		...options
	};
	const isSVG = isSVGElement(elem);
	const parent = elem.parentNode;
	parent.style.overflow = options.overflow;
	parent.style.userSelect = "none";
	parent.style.touchAction = options.touchAction;
	(options.canvas ? parent : elem).style.cursor = options.cursor;
	elem.style.userSelect = "none";
	elem.style.touchAction = options.touchAction;
	setStyle(elem, "transformOrigin", typeof options.origin === "string" ? options.origin : isSVG ? "0 0" : "50% 50%");
	function resetStyle() {
		parent.style.overflow = "";
		parent.style.userSelect = "";
		parent.style.touchAction = "";
		parent.style.cursor = "";
		elem.style.cursor = "";
		elem.style.userSelect = "";
		elem.style.touchAction = "";
		setStyle(elem, "transformOrigin", "");
	}
	function setOptions(opts = {}) {
		for (const key in opts) if (opts.hasOwnProperty(key)) options[key] = opts[key];
		if (opts.hasOwnProperty("cursor") || opts.hasOwnProperty("canvas")) {
			parent.style.cursor = elem.style.cursor = "";
			(options.canvas ? parent : elem).style.cursor = options.cursor;
		}
		if (opts.hasOwnProperty("overflow")) parent.style.overflow = opts.overflow;
		if (opts.hasOwnProperty("touchAction")) {
			parent.style.touchAction = opts.touchAction;
			elem.style.touchAction = opts.touchAction;
		}
	}
	let x = 0;
	let y = 0;
	let scale = 1;
	let isPanning = false;
	zoom(options.startScale, {
		animate: false,
		force: true
	});
	setTimeout(() => {
		pan(options.startX, options.startY, {
			animate: false,
			force: true
		});
	});
	function trigger(eventName, detail, opts) {
		if (opts.silent) return;
		const event = new CustomEvent(eventName, { detail });
		elem.dispatchEvent(event);
	}
	function setTransformWithEvent(eventName, opts, originalEvent) {
		const value = {
			x,
			y,
			scale,
			isSVG,
			originalEvent
		};
		requestAnimationFrame(() => {
			if (typeof opts.animate === "boolean") if (opts.animate) setTransition(elem, opts);
			else setStyle(elem, "transition", "none");
			opts.setTransform(elem, value, opts);
			trigger(eventName, value, opts);
			trigger("panzoomchange", value, opts);
		});
		return value;
	}
	function constrainXY(toX, toY, toScale, panOptions) {
		const opts = {
			...options,
			...panOptions
		};
		const result = {
			x,
			y,
			opts
		};
		if (!panOptions?.force && (opts.disablePan || opts.panOnlyWhenZoomed && scale === opts.startScale)) return result;
		toX = parseFloat(toX);
		toY = parseFloat(toY);
		if (!opts.disableXAxis) result.x = (opts.relative ? x : 0) + toX;
		if (!opts.disableYAxis) result.y = (opts.relative ? y : 0) + toY;
		if (opts.contain) {
			const dims = getDimensions(elem);
			const realWidth = dims.elem.width / scale;
			const realHeight = dims.elem.height / scale;
			const scaledWidth = realWidth * toScale;
			const scaledHeight = realHeight * toScale;
			const diffHorizontal = (scaledWidth - realWidth) / 2;
			const diffVertical = (scaledHeight - realHeight) / 2;
			if (opts.contain === "inside") {
				const minX = (-dims.elem.margin.left - dims.parent.padding.left + diffHorizontal) / toScale;
				const maxX = (dims.parent.width - scaledWidth - dims.parent.padding.left - dims.elem.margin.left - dims.parent.border.left - dims.parent.border.right + diffHorizontal) / toScale;
				result.x = Math.max(Math.min(result.x, maxX), minX);
				const minY = (-dims.elem.margin.top - dims.parent.padding.top + diffVertical) / toScale;
				const maxY = (dims.parent.height - scaledHeight - dims.parent.padding.top - dims.elem.margin.top - dims.parent.border.top - dims.parent.border.bottom + diffVertical) / toScale;
				result.y = Math.max(Math.min(result.y, maxY), minY);
			} else if (opts.contain === "outside") {
				const minX = (-(scaledWidth - dims.parent.width) - dims.parent.padding.left - dims.parent.border.left - dims.parent.border.right + diffHorizontal) / toScale;
				const maxX = (diffHorizontal - dims.parent.padding.left) / toScale;
				result.x = Math.max(Math.min(result.x, maxX), minX);
				const minY = (-(scaledHeight - dims.parent.height) - dims.parent.padding.top - dims.parent.border.top - dims.parent.border.bottom + diffVertical) / toScale;
				const maxY = (diffVertical - dims.parent.padding.top) / toScale;
				result.y = Math.max(Math.min(result.y, maxY), minY);
			}
		}
		if (opts.roundPixels) {
			result.x = Math.round(result.x);
			result.y = Math.round(result.y);
		}
		return result;
	}
	function constrainScale(toScale, zoomOptions) {
		const opts = {
			...options,
			...zoomOptions
		};
		const result = {
			scale,
			opts
		};
		if (!zoomOptions?.force && opts.disableZoom) return result;
		let minScale = options.minScale;
		let maxScale = options.maxScale;
		if (opts.contain) {
			const dims = getDimensions(elem);
			const elemWidth = dims.elem.width / scale;
			const elemHeight = dims.elem.height / scale;
			if (elemWidth > 1 && elemHeight > 1) {
				const parentWidth = dims.parent.width - dims.parent.border.left - dims.parent.border.right;
				const parentHeight = dims.parent.height - dims.parent.border.top - dims.parent.border.bottom;
				const elemScaledWidth = parentWidth / elemWidth;
				const elemScaledHeight = parentHeight / elemHeight;
				if (options.contain === "inside") maxScale = Math.min(maxScale, elemScaledWidth, elemScaledHeight);
				else if (options.contain === "outside") minScale = Math.max(minScale, elemScaledWidth, elemScaledHeight);
			}
		}
		result.scale = Math.min(Math.max(toScale, minScale), maxScale);
		return result;
	}
	function pan(toX, toY, panOptions, originalEvent) {
		const result = constrainXY(toX, toY, scale, panOptions);
		if (x !== result.x || y !== result.y) {
			x = result.x;
			y = result.y;
			return setTransformWithEvent("panzoompan", result.opts, originalEvent);
		}
		return {
			x,
			y,
			scale,
			isSVG,
			originalEvent
		};
	}
	function zoom(toScale, zoomOptions, originalEvent) {
		const result = constrainScale(toScale, zoomOptions);
		const opts = result.opts;
		if (!zoomOptions?.force && opts.disableZoom) return;
		toScale = result.scale;
		let toX = x;
		let toY = y;
		if (opts.focal) {
			const focal = opts.focal;
			toX = (focal.x / toScale - focal.x / scale + x * toScale) / toScale;
			toY = (focal.y / toScale - focal.y / scale + y * toScale) / toScale;
		}
		const panResult = constrainXY(toX, toY, toScale, {
			relative: false,
			force: true
		});
		x = panResult.x;
		y = panResult.y;
		scale = toScale;
		return setTransformWithEvent("panzoomzoom", opts, originalEvent);
	}
	function zoomInOut(isIn, zoomOptions) {
		const opts = {
			...options,
			animate: true,
			...zoomOptions
		};
		return zoom(scale * Math.exp((isIn ? 1 : -1) * opts.step), opts);
	}
	function zoomIn(zoomOptions) {
		return zoomInOut(true, zoomOptions);
	}
	function zoomOut(zoomOptions) {
		return zoomInOut(false, zoomOptions);
	}
	function zoomToPoint(toScale, point, zoomOptions, originalEvent) {
		const dims = getDimensions(elem);
		const effectiveArea = {
			width: dims.parent.width - dims.parent.padding.left - dims.parent.padding.right - dims.parent.border.left - dims.parent.border.right,
			height: dims.parent.height - dims.parent.padding.top - dims.parent.padding.bottom - dims.parent.border.top - dims.parent.border.bottom
		};
		let clientX = point.clientX - dims.parent.left - dims.parent.padding.left - dims.parent.border.left - dims.elem.margin.left;
		let clientY = point.clientY - dims.parent.top - dims.parent.padding.top - dims.parent.border.top - dims.elem.margin.top;
		if (!isSVG) {
			clientX -= dims.elem.width / scale / 2;
			clientY -= dims.elem.height / scale / 2;
		}
		const focal = {
			x: clientX / effectiveArea.width * (effectiveArea.width * toScale),
			y: clientY / effectiveArea.height * (effectiveArea.height * toScale)
		};
		return zoom(toScale, {
			...zoomOptions,
			animate: false,
			focal
		}, originalEvent);
	}
	function zoomWithWheel(event, zoomOptions) {
		event.preventDefault();
		const opts = {
			...options,
			...zoomOptions,
			animate: false
		};
		const wheel = (event.deltaY === 0 && event.deltaX ? event.deltaX : event.deltaY) < 0 ? 1 : -1;
		const toScale = constrainScale(scale * Math.exp(wheel * opts.step / 3), opts).scale;
		return zoomToPoint(toScale, event, opts, event);
	}
	function reset(resetOptions) {
		const opts = {
			...options,
			animate: true,
			force: true,
			...resetOptions
		};
		scale = constrainScale(opts.startScale, opts).scale;
		const panResult = constrainXY(opts.startX, opts.startY, scale, opts);
		x = panResult.x;
		y = panResult.y;
		return setTransformWithEvent("panzoomreset", opts);
	}
	let origX;
	let origY;
	let startClientX;
	let startClientY;
	let startScale;
	let startDistance;
	const pointers = [];
	function handleDown(event) {
		if (isExcluded(event.target, options)) return;
		addPointer(pointers, event);
		isPanning = true;
		options.handleStartEvent(event);
		origX = x;
		origY = y;
		trigger("panzoomstart", {
			x,
			y,
			scale,
			isSVG,
			originalEvent: event
		}, options);
		const point = getMiddle(pointers);
		startClientX = point.clientX;
		startClientY = point.clientY;
		startScale = scale;
		startDistance = getDistance(pointers);
	}
	function handleMove(event) {
		if (!isPanning || origX === void 0 || origY === void 0 || startClientX === void 0 || startClientY === void 0) return;
		addPointer(pointers, event);
		const current = getMiddle(pointers);
		const hasMultiple = pointers.length > 1;
		let toScale = scale;
		if (hasMultiple) {
			if (startDistance === 0) startDistance = getDistance(pointers);
			toScale = constrainScale((getDistance(pointers) - startDistance) * options.step / 80 + startScale).scale;
			zoomToPoint(toScale, current, { animate: false }, event);
		}
		if (!hasMultiple || options.pinchAndPan) pan(origX + (current.clientX - startClientX) / toScale, origY + (current.clientY - startClientY) / toScale, { animate: false }, event);
	}
	function handleUp(event) {
		if (pointers.length === 1) trigger("panzoomend", {
			x,
			y,
			scale,
			isSVG,
			originalEvent: event
		}, options);
		removePointer(pointers, event);
		if (!isPanning) return;
		isPanning = false;
		origX = origY = startClientX = startClientY = void 0;
	}
	let bound = false;
	function bind() {
		if (bound) return;
		bound = true;
		onPointer("down", options.canvas ? parent : elem, handleDown);
		onPointer("move", document, handleMove, { passive: true });
		onPointer("up", document, handleUp, { passive: true });
	}
	function destroy() {
		bound = false;
		destroyPointer("down", options.canvas ? parent : elem, handleDown);
		destroyPointer("move", document, handleMove);
		destroyPointer("up", document, handleUp);
	}
	if (!options.noBind) bind();
	return {
		bind,
		destroy,
		eventNames: events,
		getPan: () => ({
			x,
			y
		}),
		getScale: () => scale,
		getOptions: () => shallowClone(options),
		handleDown,
		handleMove,
		handleUp,
		pan,
		reset,
		resetStyle,
		setOptions,
		setStyle: (name, value) => setStyle(elem, name, value),
		zoom,
		zoomIn,
		zoomOut,
		zoomToPoint,
		zoomWithWheel
	};
}
Panzoom.defaultOptions = defaultOptions;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-drawing@3.1.2_bpmn-js@18.31.0/node_modules/@file-viewer/renderer-drawing/dist/sanitize.js
var purifierByDocument = /* @__PURE__ */ new WeakMap();
var getPurifier = (documentRef) => {
	const cached = purifierByDocument.get(documentRef);
	if (cached) return cached;
	const windowRef = documentRef.defaultView;
	if (!windowRef) return null;
	const purifier = purify(windowRef);
	if (!purifier.isSupported) return null;
	purifierByDocument.set(documentRef, purifier);
	return purifier;
};
var sanitizeDrawingSvg = (documentRef, svg, invalidMessage = "Unable to parse SVG safely.") => {
	const purifier = getPurifier(documentRef);
	if (!purifier) throw new Error(invalidMessage);
	const fragment = purifier.sanitize(svg, {
		RETURN_DOM_FRAGMENT: true,
		USE_PROFILES: {
			svg: true,
			svgFilters: true
		},
		FORBID_TAGS: [
			"script",
			"iframe",
			"object",
			"embed",
			"form",
			"foreignObject"
		],
		FORBID_ATTR: ["srcdoc"]
	});
	sanitizeFileViewerSvgResources(fragment);
	const root = fragment.querySelector("svg");
	if (!root) throw new Error(invalidMessage);
	return documentRef.importNode(root, true);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-drawing@3.1.2_bpmn-js@18.31.0/node_modules/@file-viewer/renderer-drawing/dist/diagram.js
var getOwnerWindow = (documentRef) => {
	return documentRef.defaultView || (typeof window !== "undefined" ? window : void 0);
};
var isDarkTheme = (documentRef, theme) => {
	if (theme === "dark") return true;
	if (theme === "light") return false;
	return Boolean(getOwnerWindow(documentRef)?.matchMedia?.("(prefers-color-scheme: dark)").matches);
};
var createElement$1 = (documentRef, tagName, className) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	return element;
};
var normalizePlantumlServer = (documentRef, value) => {
	const base = value;
	const normalized = base.endsWith("/") ? base : `${base}/`;
	try {
		return new URL(normalized, documentRef.baseURI).href;
	} catch {
		return normalized;
	}
};
var renderMermaidSvg = async (documentRef, text, theme, t) => {
	assertFileViewerMermaidSourceHasNoExternalResources(text);
	const mermaid = (await __vitePreload(() => import("./mermaid.core-qPSFJ2wt.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45]))).default;
	const id = `file-viewer-mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		htmlLabels: false,
		theme: isDarkTheme(documentRef, theme) ? "dark" : "default"
	});
	return sanitizeDrawingSvg(documentRef, (await mermaid.render(id, text)).svg, t("drawing.error.svgParseFailed"));
};
var appendSvgText = (documentRef, parent, text, x, dy, weight = "500") => {
	const line = documentRef.createElementNS("http://www.w3.org/2000/svg", "tspan");
	line.setAttribute("x", String(x));
	line.setAttribute("dy", dy);
	line.setAttribute("font-weight", weight);
	line.textContent = text;
	parent.appendChild(line);
};
var renderPlantumlFallbackSvg = (documentRef, text, message) => {
	const width = 1100;
	const height = 720;
	const svg = documentRef.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
	svg.setAttribute("width", String(width));
	svg.setAttribute("height", String(height));
	const background = documentRef.createElementNS("http://www.w3.org/2000/svg", "rect");
	background.setAttribute("width", "100%");
	background.setAttribute("height", "100%");
	background.setAttribute("rx", "28");
	background.setAttribute("fill", "#f8fbff");
	svg.appendChild(background);
	const panel = documentRef.createElementNS("http://www.w3.org/2000/svg", "rect");
	panel.setAttribute("x", "42");
	panel.setAttribute("y", "42");
	panel.setAttribute("width", String(1016));
	panel.setAttribute("height", String(636));
	panel.setAttribute("rx", "22");
	panel.setAttribute("fill", "#ffffff");
	panel.setAttribute("stroke", "#cbd5e1");
	svg.appendChild(panel);
	const title = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
	title.setAttribute("x", "74");
	title.setAttribute("y", "92");
	title.setAttribute("fill", "#0f766e");
	title.setAttribute("font-family", "Inter, Arial, sans-serif");
	title.setAttribute("font-size", "24");
	title.setAttribute("font-weight", "800");
	title.textContent = "PlantUML source preview";
	svg.appendChild(title);
	const note = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
	note.setAttribute("x", "74");
	note.setAttribute("y", "128");
	note.setAttribute("fill", "#64748b");
	note.setAttribute("font-family", "Inter, Arial, sans-serif");
	note.setAttribute("font-size", "15");
	note.textContent = message;
	svg.appendChild(note);
	const source = documentRef.createElementNS("http://www.w3.org/2000/svg", "text");
	source.setAttribute("x", "74");
	source.setAttribute("y", "172");
	source.setAttribute("fill", "#172033");
	source.setAttribute("font-family", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace");
	source.setAttribute("font-size", "16");
	source.setAttribute("xml:space", "preserve");
	const lines = text.replace(/\r\n?/g, "\n").split("\n").slice(0, 26);
	lines.forEach((line, index) => {
		appendSvgText(documentRef, source, line.slice(0, 110), 74, index === 0 ? "0" : "24", /^\s*@/.test(line) ? "800" : "500");
	});
	if (lines.length < text.split("\n").length) appendSvgText(documentRef, source, "... truncated for preview ...", 74, "24", "700");
	svg.appendChild(source);
	return svg;
};
var renderPlantumlSvg = async (documentRef, text, options, t) => {
	if (!options?.plantumlServerUrl) return renderPlantumlFallbackSvg(documentRef, text, "Offline mode is active. Configure options.drawing.plantumlServerUrl for server-rendered PlantUML SVG.");
	const { encode } = await __vitePreload(async () => {
		const { encode } = await import("./browser-index-Dx12-06F.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
		return { encode };
	}, __vite__mapDeps([46,2]));
	const url = `${normalizePlantumlServer(documentRef, options.plantumlServerUrl)}${encode(text)}`;
	const ownerWindow = getOwnerWindow(documentRef);
	const controller = new AbortController();
	const timeout = ownerWindow?.setTimeout(() => controller.abort(), Math.max(1e3, options?.plantumlTimeoutMs || 8e3));
	try {
		const response = await fetch(url, { signal: controller.signal });
		if (!response.ok) throw new Error(t("drawing.error.plantumlRenderFailed", { status: response.status }));
		return sanitizeDrawingSvg(documentRef, await response.text(), t("drawing.error.svgParseFailed"));
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") throw error;
		return renderPlantumlFallbackSvg(documentRef, text, "Configure options.drawing.plantumlServerUrl for full PlantUML SVG rendering.");
	} finally {
		if (timeout !== void 0) ownerWindow?.clearTimeout(timeout);
	}
};
var applySvgDefaults = (svg, kind) => {
	svg.classList.add("drawing-svg", "drawing-diagram-svg");
	svg.setAttribute("role", "img");
	svg.setAttribute("aria-label", `${kind} diagram preview`);
	if (!svg.getAttribute("width") && svg.viewBox.baseVal.width) svg.setAttribute("width", String(Math.ceil(svg.viewBox.baseVal.width)));
	if (!svg.getAttribute("height") && svg.viewBox.baseVal.height) svg.setAttribute("height", String(Math.ceil(svg.viewBox.baseVal.height)));
};
var renderDiagram = async ({ documentRef, text, target, kind, options, theme, viewerOptions }) => {
	const t = createFileViewerTranslator(viewerOptions);
	const shell = createElement$1(documentRef, "div", "drawing-diagram-shell");
	const panTarget = createElement$1(documentRef, "div", "drawing-diagram-pan");
	shell.appendChild(panTarget);
	target.replaceChildren(shell);
	const svg = kind === "mermaid" ? await renderMermaidSvg(documentRef, text, theme, t) : await renderPlantumlSvg(documentRef, text, options, t);
	applySvgDefaults(svg, kind);
	panTarget.replaceChildren(svg);
	const panzoom = Panzoom(panTarget, {
		minScale: .4,
		maxScale: 4,
		contain: "outside",
		canvas: true
	});
	const wheelTarget = shell.parentElement || shell;
	const handleWheel = (event) => {
		if (!event.ctrlKey && !event.metaKey) return;
		event.preventDefault();
		panzoom.zoomWithWheel(event);
	};
	wheelTarget.addEventListener("wheel", handleWheel, { passive: false });
	return {
		setZoom(scale) {
			panzoom.zoom(scale, { animate: true });
		},
		reset() {
			panzoom.reset({ animate: true });
		},
		getScale() {
			return panzoom.getScale();
		},
		destroy() {
			wheelTarget.removeEventListener("wheel", handleWheel);
			panzoom.destroy();
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-drawing@3.1.2_bpmn-js@18.31.0/node_modules/@file-viewer/renderer-drawing/dist/optionalCapabilities.js
var drawioOfficialViewerEnabled = false;
var enableFileViewerDrawioOfficialViewer = () => {
	drawioOfficialViewerEnabled = true;
};
var disableFileViewerDrawioOfficialViewer = () => {
	drawioOfficialViewerEnabled = false;
};
var isFileViewerDrawioOfficialViewerEnabled = () => drawioOfficialViewerEnabled;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-drawing@3.1.2_bpmn-js@18.31.0/node_modules/@file-viewer/renderer-drawing/dist/drawing.js
var SVG_NS = "http://www.w3.org/2000/svg";
var EXCALIDRAW_OFFICIAL_TIMEOUT = 6e3;
var DRAWIO_OFFICIAL_TIMEOUT = 6e3;
var drawingStyle = `
.drawing-viewer{display:flex;height:100%;min-height:360px;flex-direction:column;background:#edf2f7;color:#172033}
.drawing-toolbar{position:sticky;top:0;z-index:2;display:flex;min-height:46px;align-items:center;justify-content:space-between;gap:16px;padding:8px 14px;border-bottom:1px solid rgba(148,163,184,.35);background:rgba(248,250,252,.92);backdrop-filter:blur(12px)}
.drawing-title{display:flex;min-width:0;align-items:center;gap:10px}
.drawing-title span{display:inline-flex;height:24px;align-items:center;justify-content:center;border-radius:6px;padding:0 8px;background:#0f766e;color:#fff;font-size:11px;font-weight:800;letter-spacing:0}
.drawing-title strong{overflow:hidden;color:#172033;font-size:13px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}
.drawing-actions{display:flex;flex-shrink:0;align-items:center;gap:6px}
.drawing-actions button{min-width:32px;height:28px;border:1px solid rgba(100,116,139,.28);border-radius:6px;background:#fff;color:#0f172a;cursor:pointer;font-size:12px;font-weight:800}
.drawing-actions button:hover{border-color:rgba(15,118,110,.5);color:#0f766e}
.drawing-actions span{min-width:48px;color:#64748b;font-size:12px;font-weight:800;text-align:center}
.drawing-stage{position:relative;min-height:0;flex:1;overflow:hidden}
.drawing-scroll{height:100%;overflow:auto;padding:22px}
.drawing-canvas{width:100%;min-height:420px;transition:transform .18s ease,zoom .18s ease}
.drawing-canvas .drawing-svg,.drawing-canvas svg{display:block;max-width:100%;height:auto;margin:0 auto;border-radius:10px;background:#fff;box-shadow:0 18px 42px rgba(15,23,42,.12)}
.drawing-canvas .drawing-mxgraph{display:block;width:100%;min-height:420px;overflow:hidden;border:0;border-radius:10px;background:#fff;box-shadow:0 18px 42px rgba(15,23,42,.12)}
.drawing-diagram-shell{display:flex;min-height:100%;align-items:center;justify-content:center;overflow:hidden;border-radius:10px;background:linear-gradient(135deg,#f8fafc,#eef6f4);box-shadow:0 18px 42px rgba(15,23,42,.12)}
.drawing-diagram-pan{display:inline-flex;min-width:240px;min-height:180px;align-items:center;justify-content:center;padding:32px;cursor:grab;touch-action:none}
.drawing-diagram-pan:active{cursor:grabbing}
.drawing-diagram-pan .drawing-diagram-svg{margin:0;box-shadow:none}
[data-viewer-theme='dark'] .drawing-diagram-shell{background:linear-gradient(135deg,#111827,#0f172a)}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .drawing-diagram-shell{background:linear-gradient(135deg,#111827,#0f172a)}}
.drawing-state{position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;padding:24px;color:#64748b;font-size:14px;font-weight:700;text-align:center}
.drawing-state[hidden]{display:none!important}
.drawing-state.error{color:#b42318}
@media (max-width:720px){.drawing-toolbar{align-items:flex-start;flex-direction:column}.drawing-actions{width:100%;justify-content:space-between}.drawing-scroll{padding:12px}}
`;
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = drawingStyle;
	return style;
};
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var createSvgElement = (documentRef, tagName) => {
	return documentRef.createElementNS(SVG_NS, tagName);
};
var normalizeDrawingType = (type) => {
	const normalized = type?.toLowerCase();
	if (normalized === "excalidraw") return "excalidraw";
	if (normalized === "mermaid" || normalized === "mmd") return "mermaid";
	if (normalized === "plantuml" || normalized === "puml") return "plantuml";
	return "drawio";
};
var formatDrawingLabel = (type) => {
	const normalized = (type || "drawio").toLowerCase();
	return normalized === "dio" ? "DRAWIO" : normalized.toUpperCase();
};
var clampZoom = (value) => {
	return Math.min(3, Math.max(.5, Number(value.toFixed(2))));
};
var toNumber = (value, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};
var isTransparent = (color) => {
	return !color || color === "transparent" || color === "rgba(0, 0, 0, 0)";
};
var resolveDrawingViewerScriptUrl = (options, documentRef) => {
	return resolveFileViewerDrawioViewerScriptUrl(options, documentRef ? resolveFileViewerRuntimeAssetBaseUrl(documentRef) : void 0);
};
var resolveDirectoryUrl = (url) => {
	try {
		return new URL(".", url).href;
	} catch {
		const slashIndex = url.lastIndexOf("/");
		return slashIndex >= 0 ? url.slice(0, slashIndex + 1) : "";
	}
};
var escapeHtmlAttribute = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var createDrawioSandboxNonce = (ownerWindow) => {
	const bytes = /* @__PURE__ */ new Uint8Array(18);
	ownerWindow.crypto.getRandomValues(bytes);
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};
var resolveSafeDrawioViewerScript = (documentRef, scriptUrl) => {
	const resolved = new URL(scriptUrl, documentRef.baseURI);
	const documentUrl = new URL(documentRef.baseURI);
	if (!/^https?:$/.test(resolved.protocol) || resolved.origin !== documentUrl.origin) throw new Error("The diagrams.net viewer script must use a same-origin HTTP(S) URL.");
	return resolved;
};
var buildDrawioSandboxDocument = (xml, scriptUrl, nonce, channel) => {
	const baseUrl = resolveDirectoryUrl(scriptUrl.href);
	const assetRoot = baseUrl.replace(/\/$/, "");
	const runtimeConfig = {
		PROXY_URL: `${baseUrl}proxy`,
		STYLE_PATH: `${baseUrl}styles`,
		SHAPES_PATH: `${baseUrl}shapes`,
		STENCIL_PATH: `${baseUrl}stencils`,
		DRAW_MATH_URL: `${baseUrl}math4/es5`,
		GRAPH_IMAGE_PATH: `${baseUrl}img`,
		mxImageBasePath: `${baseUrl}mxgraph/images`,
		mxBasePath: `${baseUrl}mxgraph/`,
		mxLoadStylesheets: false,
		DRAWIO_BASE_URL: assetRoot,
		DRAWIO_LIGHTBOX_URL: assetRoot,
		DRAWIO_SERVER_URL: baseUrl,
		DRAWIO_VIEWER_URL: scriptUrl.href,
		DRAWIO_LOG_URL: "",
		EXPORT_URL: `${baseUrl}export`,
		PLANT_URL: `${baseUrl}plant`,
		VSS_CONVERT_URL: `${baseUrl}VsdConverter/api/converter`,
		DRAWIO_GITLAB_URL: baseUrl,
		DRAWIO_GITHUB_URL: baseUrl,
		DRAWIO_GITHUB_API_URL: baseUrl,
		RT_WEBSOCKET_URL: `${baseUrl}rt`,
		NOTIFICATIONS_URL: `${baseUrl}notifications`
	};
	const graphConfig = {
		xml,
		toolbar: "zoom layers lightbox",
		nav: true,
		resize: true,
		"auto-fit": true,
		"auto-crop": true,
		"auto-origin": true,
		"allow-zoom-in": true,
		"allow-zoom-out": true,
		border: 16,
		highlight: "#0f766e"
	};
	const csp = [
		"default-src 'none'",
		`script-src 'nonce-${nonce}' ${baseUrl}`,
		`style-src 'unsafe-inline' ${baseUrl}`,
		`img-src data: blob: ${baseUrl}`,
		`font-src data: ${baseUrl}`,
		"media-src data: blob:",
		"connect-src 'none'",
		"object-src 'none'",
		"base-uri 'none'",
		"form-action 'none'"
	].join("; ");
	const bootstrap = `
    Object.assign(window, ${JSON.stringify(runtimeConfig)});
    window.__fileViewerDrawioSentinel = 0;
    window.onDrawioViewerLoad = function () {
      try {
        GraphViewer.createViewerForElement(document.getElementById('graph'));
        parent.postMessage({ fileViewerDrawio: ${JSON.stringify(channel)}, ok: true }, '*');
      } catch (error) {
        parent.postMessage({ fileViewerDrawio: ${JSON.stringify(channel)}, ok: false, message: String(error && error.message || error) }, '*');
      }
    };
  `;
	return `<!doctype html>
<html><head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${escapeHtmlAttribute(csp)}">
  <meta name="referrer" content="no-referrer">
  <style>html,body{margin:0;min-height:100%;background:#fff}#graph{max-width:100%;min-height:420px;border:1px solid transparent}</style>
  <script nonce="${nonce}">${bootstrap}<\/script>
</head><body>
  <div id="graph" class="mxgraph" data-mxgraph="${escapeHtmlAttribute(JSON.stringify(graphConfig))}"></div>
  <script src="${escapeHtmlAttribute(scriptUrl.href)}"><\/script>
</body></html>`;
};
var runWithTimeout = async (task, timeout, message) => {
	let timer;
	try {
		return await Promise.race([task, new Promise((_, reject) => {
			timer = setTimeout(() => reject(new Error(message)), timeout);
		})]);
	} finally {
		if (timer) clearTimeout(timer);
	}
};
var markRendered = (target, mode) => {
	if (target.dataset.drawingRendered) return false;
	target.dataset.drawingRendered = mode;
	return true;
};
var appendRenderedSvg = (target, svg, mode) => {
	if (!markRendered(target, mode)) return;
	svg.classList.add("drawing-svg");
	target.appendChild(svg);
};
var importOptionalExcalidraw = async () => {
	return new Function("specifier", "return import(specifier)")("@excalidraw/excalidraw");
};
var isMissingOptionalExcalidraw = (error) => {
	const message = error instanceof Error ? error.message : String(error);
	return message.includes("@excalidraw/excalidraw") && /(?:resolve|find|module|specifier)/i.test(message);
};
var suppressExcalidrawWorkerWarning = () => {
	const originalError = console.error;
	const patchedError = (...args) => {
		const message = args.map((arg) => String(arg)).join(" ");
		if (message.includes("Failed to use workers for subsetting") || message.includes("Failed to fetch font family")) return;
		originalError(...args);
	};
	console.error = patchedError;
	return () => {
		if (console.error === patchedError) console.error = originalError;
	};
};
var getElementPoints = (element) => {
	if (Array.isArray(element.points) && element.points.length) return element.points.map((point) => [toNumber(element.x) + toNumber(point[0]), toNumber(element.y) + toNumber(point[1])]);
	return [[toNumber(element.x), toNumber(element.y)], [toNumber(element.x) + toNumber(element.width), toNumber(element.y) + toNumber(element.height)]];
};
var getElementBounds = (element) => {
	const points = getElementPoints(element);
	const xs = points.map((point) => point[0]);
	const ys = points.map((point) => point[1]);
	if (!Array.isArray(element.points)) {
		xs.push(toNumber(element.x) + toNumber(element.width));
		ys.push(toNumber(element.y) + toNumber(element.height));
	}
	return {
		minX: Math.min(...xs),
		minY: Math.min(...ys),
		maxX: Math.max(...xs),
		maxY: Math.max(...ys)
	};
};
var getSceneBounds = (elements) => {
	const initial = {
		minX: Number.POSITIVE_INFINITY,
		minY: Number.POSITIVE_INFINITY,
		maxX: Number.NEGATIVE_INFINITY,
		maxY: Number.NEGATIVE_INFINITY
	};
	const bounds = elements.reduce((scene, element) => {
		const elementBounds = getElementBounds(element);
		return {
			minX: Math.min(scene.minX, elementBounds.minX),
			minY: Math.min(scene.minY, elementBounds.minY),
			maxX: Math.max(scene.maxX, elementBounds.maxX),
			maxY: Math.max(scene.maxY, elementBounds.maxY)
		};
	}, initial);
	if (!Number.isFinite(bounds.minX)) return {
		minX: 0,
		minY: 0,
		maxX: 800,
		maxY: 480
	};
	return bounds;
};
var getRoughOptions = (element) => {
	const fill = isTransparent(element.backgroundColor) ? void 0 : element.backgroundColor;
	return {
		stroke: element.strokeColor || "#1e1e1e",
		strokeWidth: Math.max(1, toNumber(element.strokeWidth, 1)),
		roughness: Math.max(0, toNumber(element.roughness, 1)),
		fill,
		fillStyle: element.fillStyle || "hachure",
		seed: toNumber(element.seed, 1),
		strokeLineDash: element.strokeStyle === "dashed" ? [10, 8] : element.strokeStyle === "dotted" ? [2, 6] : void 0
	};
};
var appendWithOpacity = (group, element, node) => {
	const opacity = toNumber(element.opacity, 100) / 100;
	if (opacity < 1) node.setAttribute("opacity", String(opacity));
	group.appendChild(node);
};
var createElementGroup = (documentRef, element) => {
	const group = createSvgElement(documentRef, "g");
	const angle = toNumber(element.angle);
	if (angle) {
		const cx = toNumber(element.x) + toNumber(element.width) / 2;
		const cy = toNumber(element.y) + toNumber(element.height) / 2;
		group.setAttribute("transform", `rotate(${angle * 180 / Math.PI} ${cx} ${cy})`);
	}
	return group;
};
var renderTextFallback = (documentRef, group, element) => {
	const text = String(element.text || "");
	if (!text.trim()) return;
	const textNode = createSvgElement(documentRef, "text");
	const fontSize = Math.max(8, toNumber(element.fontSize, 20));
	const lineHeight = fontSize * 1.25;
	const lines = text.split(/\r?\n/);
	const familyMap = {
		1: "Virgil, Segoe Print, Comic Sans MS, sans-serif",
		2: "Helvetica, Arial, sans-serif",
		3: "Cascadia Mono, Menlo, Consolas, monospace"
	};
	textNode.setAttribute("x", String(toNumber(element.x)));
	textNode.setAttribute("y", String(toNumber(element.y) + fontSize));
	textNode.setAttribute("fill", element.strokeColor || "#1e1e1e");
	textNode.setAttribute("font-size", String(fontSize));
	textNode.setAttribute("font-family", familyMap[toNumber(element.fontFamily, 1)] || familyMap[1]);
	textNode.setAttribute("font-weight", String(element.fontWeight || 400));
	textNode.setAttribute("text-anchor", element.textAlign === "center" ? "middle" : element.textAlign === "right" ? "end" : "start");
	if (element.textAlign === "center") textNode.setAttribute("x", String(toNumber(element.x) + toNumber(element.width) / 2));
	else if (element.textAlign === "right") textNode.setAttribute("x", String(toNumber(element.x) + toNumber(element.width)));
	lines.forEach((line, index) => {
		const lineNode = createSvgElement(documentRef, "tspan");
		lineNode.setAttribute("x", textNode.getAttribute("x") || String(toNumber(element.x)));
		lineNode.setAttribute("dy", index === 0 ? "0" : String(lineHeight));
		lineNode.textContent = line;
		textNode.appendChild(lineNode);
	});
	appendWithOpacity(group, element, textNode);
};
var appendArrowHead = (documentRef, group, element, points) => {
	if (!(element.endArrowhead || element.startArrowhead) || points.length < 2) return;
	const end = points[points.length - 1];
	const before = points[points.length - 2];
	const angle = Math.atan2(end[1] - before[1], end[0] - before[0]);
	const size = Math.max(10, toNumber(element.strokeWidth, 1) * 7);
	const left = [end[0] - size * Math.cos(angle - Math.PI / 7), end[1] - size * Math.sin(angle - Math.PI / 7)];
	const right = [end[0] - size * Math.cos(angle + Math.PI / 7), end[1] - size * Math.sin(angle + Math.PI / 7)];
	const arrow = createSvgElement(documentRef, "polygon");
	arrow.setAttribute("points", `${end.join(",")} ${left.join(",")} ${right.join(",")}`);
	arrow.setAttribute("fill", element.strokeColor || "#1e1e1e");
	arrow.setAttribute("stroke", element.strokeColor || "#1e1e1e");
	appendWithOpacity(group, element, arrow);
};
var renderRoughFallback = async (documentRef, payload, elements, target) => {
	const { default: rough } = await __vitePreload(async () => {
		const { default: rough } = await import("./rough.esm-9EhZJatK.js");
		return { default: rough };
	}, __vite__mapDeps([47,20]));
	const bounds = getSceneBounds(elements);
	const padding = 80;
	const width = Math.max(320, bounds.maxX - bounds.minX + 160);
	const height = Math.max(220, bounds.maxY - bounds.minY + 160);
	const svg = createSvgElement(documentRef, "svg");
	const root = createSvgElement(documentRef, "g");
	const rc = rough.svg(svg);
	svg.setAttribute("viewBox", `${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}`);
	svg.setAttribute("width", String(width));
	svg.setAttribute("height", String(height));
	svg.setAttribute("role", "img");
	svg.setAttribute("aria-label", "Excalidraw rough.js preview");
	const background = createSvgElement(documentRef, "rect");
	background.setAttribute("x", String(bounds.minX - padding));
	background.setAttribute("y", String(bounds.minY - padding));
	background.setAttribute("width", String(width));
	background.setAttribute("height", String(height));
	background.setAttribute("fill", payload.appState?.viewBackgroundColor || "#ffffff");
	svg.appendChild(background);
	svg.appendChild(root);
	elements.forEach((element) => {
		const group = createElementGroup(documentRef, element);
		const options = getRoughOptions(element);
		const x = toNumber(element.x);
		const y = toNumber(element.y);
		const width = toNumber(element.width);
		const height = toNumber(element.height);
		if (element.type === "text") renderTextFallback(documentRef, group, element);
		else if (element.type === "rectangle") appendWithOpacity(group, element, rc.rectangle(x, y, width, height, options));
		else if (element.type === "diamond") appendWithOpacity(group, element, rc.polygon([
			[x + width / 2, y],
			[x + width, y + height / 2],
			[x + width / 2, y + height],
			[x, y + height / 2]
		], options));
		else if (element.type === "ellipse") appendWithOpacity(group, element, rc.ellipse(x + width / 2, y + height / 2, Math.abs(width), Math.abs(height), options));
		else if (element.type === "line" || element.type === "arrow" || element.type === "freedraw") {
			const points = getElementPoints(element);
			appendWithOpacity(group, element, rc.linearPath(points, options));
			if (element.type === "arrow") appendArrowHead(documentRef, group, element, points);
		}
		if (group.childNodes.length) root.appendChild(group);
	});
	appendRenderedSvg(target, svg, "rough");
};
var renderOfficialExcalidraw = async (payload, elements, target) => {
	const restoreConsole = suppressExcalidrawWorkerWarning();
	const restoreTimer = setTimeout(restoreConsole, 7e3);
	const { exportToSvg, restore } = await importOptionalExcalidraw();
	try {
		const restored = restore({
			elements,
			appState: payload.appState || {},
			files: payload.files || {}
		}, null, null, {
			repairBindings: true,
			refreshDimensions: true
		});
		appendRenderedSvg(target, await exportToSvg({
			elements: restored.elements.filter((element) => !element.isDeleted),
			appState: {
				...restored.appState,
				exportBackground: true,
				viewBackgroundColor: restored.appState.viewBackgroundColor || "#ffffff"
			},
			files: restored.files || {}
		}), "official");
	} finally {
		clearTimeout(restoreTimer);
		setTimeout(restoreConsole, 3e3);
	}
};
var renderExcalidraw = async (documentRef, text, target, t) => {
	const payload = JSON.parse(text);
	const elements = Array.isArray(payload.elements) ? payload.elements.filter((element) => !element.isDeleted) : [];
	if (!elements.length) throw new Error(t("drawing.error.excalidrawEmpty"));
	try {
		await runWithTimeout(renderOfficialExcalidraw(payload, elements, target), EXCALIDRAW_OFFICIAL_TIMEOUT, t("drawing.error.excalidrawTimeout"));
	} catch (error) {
		if (!isMissingOptionalExcalidraw(error)) console.warn(error);
		await renderRoughFallback(documentRef, payload, elements, target);
	}
};
var getDirectChild = (parent, tagName) => {
	return Array.from(parent.children).find((child) => child.localName === tagName) || null;
};
var parseDrawioStyle = (style) => {
	const entries = /* @__PURE__ */ new Map();
	for (const item of (style || "").split(";")) {
		if (!item) continue;
		const [key, ...rest] = item.split("=");
		entries.set(key, rest.join("=") || "1");
	}
	return entries;
};
var getDrawioStyleValue = (style, key, fallback) => {
	const value = style.get(key);
	return value && value !== "none" ? value : fallback;
};
var parseDrawioGeometry = (cell) => {
	const geometry = getDirectChild(cell, "mxGeometry");
	if (!geometry) return null;
	return {
		x: toNumber(geometry.getAttribute("x")),
		y: toNumber(geometry.getAttribute("y")),
		width: Math.max(1, toNumber(geometry.getAttribute("width"), 80)),
		height: Math.max(1, toNumber(geometry.getAttribute("height"), 40)),
		points: Array.from(geometry.querySelectorAll("mxPoint")).map((point) => ({
			x: toNumber(point.getAttribute("x")),
			y: toNumber(point.getAttribute("y"))
		}))
	};
};
var decodeDrawioEntities = (documentRef, value) => {
	const Parser = documentRef.defaultView?.DOMParser || globalThis.DOMParser;
	if (!Parser) return value;
	return new Parser().parseFromString(value.replace(/</g, "&lt;"), "text/html").documentElement.textContent || "";
};
var stripDrawioMarkup = (value) => {
	let output = "";
	let cursor = 0;
	while (cursor < value.length) {
		if (value[cursor] !== "<") {
			output += value[cursor];
			cursor += 1;
			continue;
		}
		let quote = "";
		let end = cursor + 1;
		for (; end < value.length; end += 1) {
			const character = value[end];
			if (quote) {
				if (character === quote) quote = "";
				continue;
			}
			if (character === "\"" || character === "'") {
				quote = character;
				continue;
			}
			if (character === ">") break;
		}
		if (end >= value.length) {
			output += "<";
			cursor += 1;
			continue;
		}
		const tag = value.slice(cursor + 1, end).trim().toLowerCase();
		if (/^\/?br(?:\s|\/|$)/.test(tag)) output += "\n";
		cursor = end + 1;
	}
	return output;
};
var normalizeDrawioText = (documentRef, value) => {
	if (!value) return "";
	return stripDrawioMarkup(decodeDrawioEntities(documentRef, value)).replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
};
var DRAWIO_FORBIDDEN_ELEMENTS = /* @__PURE__ */ new Set([
	"script",
	"style",
	"foreignobject",
	"iframe",
	"object",
	"embed",
	"form",
	"link"
]);
var DRAWIO_RESOURCE_ATTRIBUTES = /* @__PURE__ */ new Set([
	"href",
	"xlink:href",
	"url",
	"link",
	"image",
	"icon",
	"src",
	"srcset"
]);
var isControlCharacter = (character) => {
	const codePoint = character.charCodeAt(0);
	return codePoint <= 31 || codePoint >= 127 && codePoint <= 159;
};
var stripControlCharacters = (value, replacement = "") => {
	let normalized = "";
	for (const character of value) normalized += isControlCharacter(character) ? replacement : character;
	return normalized;
};
var containsDrawioActiveResource = (value) => {
	const canonical = stripControlCharacters(value).replace(/\s+/g, "").toLowerCase();
	return /(?:javascript|vbscript|data|file|blob|https?):|(?:^|[=("'])\/\/|\\\\/.test(canonical);
};
var sanitizeOfficialDrawioStyle = (value) => {
	const safeEntries = [];
	for (const [rawKey, rawValue] of parseDrawioStyle(value)) {
		const key = rawKey.trim();
		const styleValue = rawValue.trim();
		if (!/^[A-Za-z][A-Za-z0-9_.-]*$/.test(key)) continue;
		if (/(?:html|image|icon|link|href|url)/i.test(key)) continue;
		if (containsDrawioActiveResource(styleValue)) continue;
		if ([...styleValue].some(isControlCharacter) || /[<>"'`\\]/.test(styleValue) || /url\s*\(/i.test(styleValue)) continue;
		safeEntries.push(`${key}=${styleValue}`);
	}
	safeEntries.push("html=0");
	return `${safeEntries.join(";")};`;
};
var sanitizeOfficialDrawioText = (documentRef, value) => {
	return normalizeDrawioText(documentRef, value).replace(/[<>&"'`]/g, " ").split("").map((character) => isControlCharacter(character) ? " " : character).join("").replace(/\s+/g, " ").trim();
};
/**
* diagrams.net is a large third-party runtime. Its same-document renderer may
* interpret cell labels and style resource keys as HTML or URLs, so sanitize
* the direct mxGraphModel before it reaches that runtime. Compressed/opaque
* models fail closed here and use the inert fallback instead.
*/
var sanitizeOfficialDrawioXml = (documentRef, value, invalidMessage = "This Draw.io file has no safely renderable mxGraphModel.") => {
	if (/<!\s*(?:doctype|entity)\b/i.test(value)) throw new Error(invalidMessage);
	const Parser = documentRef.defaultView?.DOMParser || globalThis.DOMParser;
	const Serializer = documentRef.defaultView?.XMLSerializer || globalThis.XMLSerializer;
	if (!Parser || !Serializer) throw new Error(invalidMessage);
	const parsed = new Parser().parseFromString(value, "application/xml");
	if (parsed.querySelector("parsererror") || !parsed.querySelector("mxGraphModel")) throw new Error(invalidMessage);
	for (const element of Array.from(parsed.querySelectorAll("*"))) {
		const localName = element.localName.toLowerCase();
		if (DRAWIO_FORBIDDEN_ELEMENTS.has(localName)) {
			element.remove();
			continue;
		}
		for (const attribute of Array.from(element.attributes)) {
			const name = attribute.name.toLowerCase();
			if (name.startsWith("on") || DRAWIO_RESOURCE_ATTRIBUTES.has(name)) {
				element.removeAttribute(attribute.name);
				continue;
			}
			if (name === "style") {
				element.setAttribute(attribute.name, sanitizeOfficialDrawioStyle(attribute.value));
				continue;
			}
			if (name === "value" || name === "label" || name === "tooltip" || name === "title") {
				element.setAttribute(attribute.name, sanitizeOfficialDrawioText(documentRef, attribute.value));
				continue;
			}
			if (containsDrawioActiveResource(attribute.value)) {
				element.removeAttribute(attribute.name);
				continue;
			}
			const normalized = stripControlCharacters(attribute.value).replace(/[<>&"'`]/g, "").trim();
			element.setAttribute(attribute.name, normalized);
		}
	}
	return new Serializer().serializeToString(parsed);
};
var appendDrawioWrappedText = (documentRef, svg, text, x, y, width, height, fontSize, fill) => {
	if (!text) return;
	const textNode = createSvgElement(documentRef, "text");
	const maxChars = Math.max(4, Math.floor(width / Math.max(7, fontSize * .55)));
	const words = text.includes(" ") ? text.split(/\s+/) : text.match(new RegExp(`.{1,${maxChars}}`, "g")) || [text];
	const lines = [];
	let current = "";
	for (const word of words) {
		const next = current ? `${current} ${word}` : word;
		if (next.length > maxChars && current) {
			lines.push(current);
			current = word;
		} else current = next;
	}
	if (current) lines.push(current);
	const lineHeight = fontSize * 1.24;
	const totalHeight = lineHeight * lines.length;
	textNode.setAttribute("x", String(x + width / 2));
	textNode.setAttribute("y", String(y + height / 2 - totalHeight / 2 + fontSize));
	textNode.setAttribute("fill", fill);
	textNode.setAttribute("font-size", String(fontSize));
	textNode.setAttribute("font-family", "Inter, Segoe UI, Arial, sans-serif");
	textNode.setAttribute("font-weight", "600");
	textNode.setAttribute("text-anchor", "middle");
	textNode.setAttribute("pointer-events", "none");
	lines.slice(0, 5).forEach((line, index) => {
		const lineNode = createSvgElement(documentRef, "tspan");
		lineNode.setAttribute("x", String(x + width / 2));
		lineNode.setAttribute("dy", index === 0 ? "0" : String(lineHeight));
		lineNode.textContent = line;
		textNode.appendChild(lineNode);
	});
	svg.appendChild(textNode);
};
var renderDrawioFallback = (documentRef, text, target, t) => {
	const parsed = new DOMParser().parseFromString(text, "text/xml");
	const parseError = parsed.querySelector("parsererror");
	if (parseError) throw new Error(t("drawing.error.drawioParseFailed", { message: parseError.textContent || "invalid xml" }));
	const firstDiagram = parsed.querySelector("diagram");
	const graphModel = firstDiagram?.querySelector("mxGraphModel") || parsed.querySelector("mxGraphModel");
	if (!graphModel) throw new Error(t("drawing.error.drawioNoModel"));
	const cells = Array.from(graphModel.querySelectorAll("mxCell"));
	const vertices = cells.filter((cell) => cell.getAttribute("vertex") === "1" && cell.getAttribute("connectable") !== "0").map((cell) => ({
		cell,
		id: cell.getAttribute("id") || "",
		geometry: parseDrawioGeometry(cell),
		style: parseDrawioStyle(cell.getAttribute("style")),
		text: normalizeDrawioText(documentRef, cell.getAttribute("value"))
	})).filter((item) => item.id && item.geometry);
	if (!vertices.length) throw new Error(t("drawing.error.drawioNoElements"));
	const vertexById = new Map(vertices.map((vertex) => [vertex.id, vertex]));
	const allX = vertices.flatMap((vertex) => [vertex.geometry.x, vertex.geometry.x + vertex.geometry.width]);
	const allY = vertices.flatMap((vertex) => [vertex.geometry.y, vertex.geometry.y + vertex.geometry.height]);
	const edgePoints = [];
	const edges = cells.filter((cell) => cell.getAttribute("edge") === "1");
	for (const edge of edges) {
		const source = vertexById.get(edge.getAttribute("source") || "");
		const targetVertex = vertexById.get(edge.getAttribute("target") || "");
		const geometry = parseDrawioGeometry(edge);
		if (source?.geometry) edgePoints.push({
			x: source.geometry.x + source.geometry.width / 2,
			y: source.geometry.y + source.geometry.height / 2
		});
		geometry?.points.forEach((point) => edgePoints.push(point));
		if (targetVertex?.geometry) edgePoints.push({
			x: targetVertex.geometry.x + targetVertex.geometry.width / 2,
			y: targetVertex.geometry.y + targetVertex.geometry.height / 2
		});
	}
	allX.push(...edgePoints.map((point) => point.x));
	allY.push(...edgePoints.map((point) => point.y));
	const padding = 96;
	const minX = Math.min(...allX) - padding;
	const minY = Math.min(...allY) - padding;
	const width = Math.max(480, Math.max(...allX) - Math.min(...allX) + 192);
	const height = Math.max(320, Math.max(...allY) - Math.min(...allY) + 192);
	const svg = createSvgElement(documentRef, "svg");
	svg.setAttribute("viewBox", `${minX} ${minY} ${width} ${height}`);
	svg.setAttribute("width", String(Math.ceil(width)));
	svg.setAttribute("height", String(Math.ceil(height)));
	svg.setAttribute("role", "img");
	svg.setAttribute("aria-label", firstDiagram?.getAttribute("name") || "Draw.io local SVG preview");
	const defs = createSvgElement(documentRef, "defs");
	const marker = createSvgElement(documentRef, "marker");
	marker.setAttribute("id", "drawio-arrow");
	marker.setAttribute("viewBox", "0 0 10 10");
	marker.setAttribute("refX", "9");
	marker.setAttribute("refY", "5");
	marker.setAttribute("markerWidth", "7");
	marker.setAttribute("markerHeight", "7");
	marker.setAttribute("orient", "auto-start-reverse");
	const arrow = createSvgElement(documentRef, "path");
	arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
	arrow.setAttribute("fill", "#64748b");
	marker.appendChild(arrow);
	defs.appendChild(marker);
	svg.appendChild(defs);
	const background = createSvgElement(documentRef, "rect");
	background.setAttribute("x", String(minX));
	background.setAttribute("y", String(minY));
	background.setAttribute("width", String(width));
	background.setAttribute("height", String(height));
	background.setAttribute("fill", "#ffffff");
	svg.appendChild(background);
	for (const edge of edges) {
		const source = vertexById.get(edge.getAttribute("source") || "");
		const targetVertex = vertexById.get(edge.getAttribute("target") || "");
		if (!source?.geometry || !targetVertex?.geometry) continue;
		const style = parseDrawioStyle(edge.getAttribute("style"));
		const stroke = getDrawioStyleValue(style, "strokeColor", "#64748b");
		const points = [
			{
				x: source.geometry.x + source.geometry.width / 2,
				y: source.geometry.y + source.geometry.height / 2
			},
			...parseDrawioGeometry(edge)?.points || [],
			{
				x: targetVertex.geometry.x + targetVertex.geometry.width / 2,
				y: targetVertex.geometry.y + targetVertex.geometry.height / 2
			}
		];
		const polyline = createSvgElement(documentRef, "polyline");
		polyline.setAttribute("points", points.map((point) => `${point.x},${point.y}`).join(" "));
		polyline.setAttribute("fill", "none");
		polyline.setAttribute("stroke", stroke);
		polyline.setAttribute("stroke-width", "2");
		if (style.get("dashed") === "1") polyline.setAttribute("stroke-dasharray", "8 7");
		if (style.get("endArrow") !== "none") polyline.setAttribute("marker-end", "url(#drawio-arrow)");
		svg.appendChild(polyline);
	}
	for (const vertex of vertices) {
		const geometry = vertex.geometry;
		const fill = getDrawioStyleValue(vertex.style, "fillColor", "#f8fafc");
		const stroke = getDrawioStyleValue(vertex.style, "strokeColor", "#64748b");
		const fontSize = Math.max(10, toNumber(vertex.style.get("fontSize"), 14));
		const shape = vertex.style.has("ellipse") ? "ellipse" : vertex.style.get("shape") === "rhombus" ? "diamond" : "rect";
		if (shape === "ellipse") {
			const ellipse = createSvgElement(documentRef, "ellipse");
			ellipse.setAttribute("cx", String(geometry.x + geometry.width / 2));
			ellipse.setAttribute("cy", String(geometry.y + geometry.height / 2));
			ellipse.setAttribute("rx", String(geometry.width / 2));
			ellipse.setAttribute("ry", String(geometry.height / 2));
			ellipse.setAttribute("fill", fill);
			ellipse.setAttribute("stroke", stroke);
			ellipse.setAttribute("stroke-width", "2");
			svg.appendChild(ellipse);
		} else if (shape === "diamond") {
			const diamond = createSvgElement(documentRef, "polygon");
			diamond.setAttribute("points", [
				`${geometry.x + geometry.width / 2},${geometry.y}`,
				`${geometry.x + geometry.width},${geometry.y + geometry.height / 2}`,
				`${geometry.x + geometry.width / 2},${geometry.y + geometry.height}`,
				`${geometry.x},${geometry.y + geometry.height / 2}`
			].join(" "));
			diamond.setAttribute("fill", fill);
			diamond.setAttribute("stroke", stroke);
			diamond.setAttribute("stroke-width", "2");
			svg.appendChild(diamond);
		} else {
			const rect = createSvgElement(documentRef, "rect");
			rect.setAttribute("x", String(geometry.x));
			rect.setAttribute("y", String(geometry.y));
			rect.setAttribute("width", String(geometry.width));
			rect.setAttribute("height", String(geometry.height));
			rect.setAttribute("rx", vertex.style.get("rounded") === "1" ? "10" : "2");
			rect.setAttribute("fill", fill);
			rect.setAttribute("stroke", stroke);
			rect.setAttribute("stroke-width", "2");
			svg.appendChild(rect);
		}
		appendDrawioWrappedText(documentRef, svg, vertex.text, geometry.x, geometry.y, geometry.width, geometry.height, fontSize, getDrawioStyleValue(vertex.style, "fontColor", "#172033"));
	}
	appendRenderedSvg(target, svg, "rough");
};
var renderOfficialDrawio = async (documentRef, text, target, scriptUrl, t) => {
	const ownerWindow = documentRef.defaultView || (typeof window !== "undefined" ? window : void 0);
	if (!ownerWindow) throw new Error(t("drawing.error.viewerInitFailed"));
	const resolvedScriptUrl = resolveSafeDrawioViewerScript(documentRef, scriptUrl);
	const sanitizedText = sanitizeOfficialDrawioXml(documentRef, text, t("drawing.error.drawioNoModel"));
	const nonce = createDrawioSandboxNonce(ownerWindow);
	const channel = `file-viewer-drawio-${nonce}`;
	const frame = createElement(documentRef, "iframe", "drawing-mxgraph");
	frame.title = "diagrams.net preview";
	frame.referrerPolicy = "no-referrer";
	frame.sandbox.add("allow-scripts");
	frame.srcdoc = buildDrawioSandboxDocument(sanitizedText, resolvedScriptUrl, nonce, channel);
	await new Promise((resolve, reject) => {
		const timer = setTimeout(() => fail(t("drawing.error.drawioTimeout")), DRAWIO_OFFICIAL_TIMEOUT);
		const cleanup = () => {
			ownerWindow.removeEventListener("message", onMessage);
			clearTimeout(timer);
		};
		const fail = (message) => {
			cleanup();
			reject(new Error(message));
		};
		const onMessage = (event) => {
			if (event.source !== frame.contentWindow || event.data?.fileViewerDrawio !== channel) return;
			if (event.data?.ok === true) {
				cleanup();
				resolve();
			} else fail(event.data?.message || t("drawing.error.viewerInitFailed"));
		};
		ownerWindow.addEventListener("message", onMessage);
		frame.addEventListener("error", () => fail(t("drawing.error.viewerLoadFailed")), { once: true });
		target.appendChild(frame);
	});
	markRendered(target, "official");
};
var renderDrawio = async (documentRef, text, target, options, t) => {
	if (!(options?.preferOfficial ?? isFileViewerDrawioOfficialViewerEnabled())) {
		renderDrawioFallback(documentRef, text, target, t);
		return;
	}
	const scriptUrl = resolveDrawingViewerScriptUrl(options, documentRef);
	try {
		await renderOfficialDrawio(documentRef, text, target, scriptUrl, t);
	} catch (error) {
		console.warn(error);
		delete target.dataset.drawingRendered;
		target.replaceChildren();
		renderDrawioFallback(documentRef, text, target, t);
	}
};
async function renderDrawing(buffer, target, type = "drawio", context) {
	const documentRef = target.ownerDocument || document;
	const kind = normalizeDrawingType(type);
	const t = createFileViewerTranslator(context?.options);
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	let status = "loading";
	let errorMessage = "";
	let zoom = 1;
	let disposed = false;
	let diagramController = null;
	const root = createElement(documentRef, "div", "drawing-viewer");
	root.dataset.viewerZoomProvider = "drawing";
	const toolbar = createElement(documentRef, "div", "drawing-toolbar");
	const title = createElement(documentRef, "div", "drawing-title");
	title.append(createElement(documentRef, "span", void 0, formatDrawingLabel(type)), createElement(documentRef, "strong", void 0, kind === "excalidraw" ? t("drawing.title.excalidraw") : kind === "mermaid" ? t("drawing.title.mermaid") : kind === "plantuml" ? t("drawing.title.plantuml") : t("drawing.title.drawio")));
	const actions = createElement(documentRef, "div", "drawing-actions");
	const zoomOutButton = createElement(documentRef, "button", void 0, "-");
	const zoomLabel = createElement(documentRef, "span");
	const zoomInButton = createElement(documentRef, "button", void 0, "+");
	const resetButton = createElement(documentRef, "button", void 0, t("drawing.toolbar.fit"));
	[
		zoomOutButton,
		zoomInButton,
		resetButton
	].forEach((button) => {
		button.type = "button";
	});
	zoomOutButton.title = t("drawing.toolbar.zoomOut");
	zoomInButton.title = t("drawing.toolbar.zoomIn");
	resetButton.title = t("drawing.toolbar.fitWidth");
	actions.append(zoomOutButton, zoomLabel, zoomInButton, resetButton);
	toolbar.append(title, actions);
	const stageWrapper = createElement(documentRef, "div", "drawing-stage");
	const state = createElement(documentRef, "div", "drawing-state");
	const scroll = createElement(documentRef, "div", "drawing-scroll");
	const canvas = createElement(documentRef, "div", "drawing-canvas");
	scroll.append(canvas);
	stageWrapper.append(state, scroll);
	root.append(toolbar, stageWrapper);
	target.replaceChildren(createStyle(documentRef), root);
	const clearStage = () => {
		diagramController?.destroy();
		diagramController = null;
		delete canvas.dataset.drawingRendered;
		canvas.replaceChildren();
	};
	const getDrawingZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 3,
		canZoomOut: zoom > .5,
		canReset: zoom !== 1,
		minScale: .5,
		maxScale: 3
	});
	const applyZoom = () => {
		if (diagramController) {
			diagramController.setZoom(zoom);
			zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
			return;
		}
		if (kind === "excalidraw") {
			canvas.style.transform = `scale(${zoom})`;
			canvas.style.transformOrigin = "top center";
			canvas.style.zoom = "";
		} else {
			canvas.style.transform = "";
			canvas.style.transformOrigin = "";
			canvas.style.zoom = String(zoom);
		}
		zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
	};
	const setZoom = (scale) => {
		zoom = clampZoom(scale);
		applyZoom();
		zoomEmitter.emit();
		return getDrawingZoomState();
	};
	const syncUi = () => {
		state.hidden = status === "ready";
		state.classList.toggle("error", status === "error");
		state.textContent = status === "error" ? errorMessage : t("drawing.state.loading");
		applyZoom();
	};
	const loadDrawing = async () => {
		status = "loading";
		errorMessage = "";
		zoom = 1;
		clearStage();
		syncUi();
		try {
			const text = await readFileViewerText(buffer);
			if (disposed) return;
			if (kind === "excalidraw") await renderExcalidraw(documentRef, text, canvas, t);
			else if (kind === "mermaid" || kind === "plantuml") {
				const { renderDiagram } = await __vitePreload(async () => {
					const { renderDiagram } = await import("./diagram-BDejMHkI.js");
					return { renderDiagram };
				}, []);
				diagramController = await renderDiagram({
					documentRef,
					text,
					target: canvas,
					kind,
					options: context?.options?.drawing,
					theme: context?.options?.theme,
					viewerOptions: context?.options
				});
			} else await renderDrawio(documentRef, text, canvas, context?.options?.drawing, t);
			if (disposed) return;
			status = "ready";
			syncUi();
		} catch (error) {
			if (disposed) return;
			console.error(error);
			errorMessage = error instanceof Error ? error.message : String(error);
			status = "error";
			syncUi();
		}
	};
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .15),
		zoomOut: () => setZoom(zoom - .15),
		resetZoom: () => setZoom(1),
		setZoom,
		getState: getDrawingZoomState,
		subscribe: zoomEmitter.subscribe
	});
	zoomOutButton.addEventListener("click", () => setZoom(zoom - .15));
	zoomInButton.addEventListener("click", () => setZoom(zoom + .15));
	resetButton.addEventListener("click", () => setZoom(1));
	syncUi();
	loadDrawing();
	return {
		$el: root,
		unmount() {
			disposed = true;
			diagramController?.destroy();
			unregisterFileViewerZoomProvider(root);
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-drawing@3.1.2_bpmn-js@18.31.0/node_modules/@file-viewer/renderer-drawing/dist/index.js
var drawingDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "drawing");
if (!drawingDefinition) throw new Error("@file-viewer/renderer-drawing could not locate the core drawing renderer definition.");
var drawingRendererDefinition = drawingDefinition;
var renderFileViewerDrawing = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderDrawing } = await import("./drawing-CKM4LRvC.js");
	return { default: renderDrawing };
}, []).then(({ default: renderDrawing }) => renderDrawing(buffer, target, type, context));
var drawingRenderer = {
	id: "file-viewer-renderer-drawing",
	label: "Flyfish File Viewer drawing renderer",
	definitions: [drawingRendererDefinition],
	handlers: [{
		rendererId: drawingRendererDefinition.id,
		handler: renderFileViewerDrawing
	}]
};
//#endregion
export { renderDrawing as a, enableFileViewerDrawioOfficialViewer as c, Panzoom as d, purify as f, normalizeDrawioText as i, isFileViewerDrawioOfficialViewerEnabled as l, drawingRendererDefinition as n, sanitizeOfficialDrawioXml as o, renderFileViewerDrawing as r, disableFileViewerDrawioOfficialViewer as s, drawingRenderer as t, renderDiagram as u };
