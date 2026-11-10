import { o as __toESM, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
import { At as DEFAULT_FILE_VIEWER_PPT_FONT_PATH, Ct as DEFAULT_FILE_VIEWER_MODEL_WASM_URL, Dt as DEFAULT_FILE_VIEWER_PDF_STANDARD_FONT_PATH, Et as DEFAULT_FILE_VIEWER_PDF_CMAP_PATH, Ft as DEFAULT_FILE_VIEWER_PRESENTATION_WORKER_PATH, H as registerFileViewerAutoRendererPreset, It as DEFAULT_FILE_VIEWER_SPREADSHEET_WORKER_PATH, Lt as DEFAULT_FILE_VIEWER_TYPST_COMPILER_WASM_URL, Mt as DEFAULT_FILE_VIEWER_PPT_RUNTIME_VERSION, Nt as DEFAULT_FILE_VIEWER_PPT_WASM_PATH, Ot as DEFAULT_FILE_VIEWER_PDF_WASM_PATH, Pt as DEFAULT_FILE_VIEWER_PPT_WORKER_PATH, Rt as DEFAULT_FILE_VIEWER_TYPST_FONT_ASSETS_URL, St as DEFAULT_FILE_VIEWER_MODEL_RUNTIME_URL, Tt as DEFAULT_FILE_VIEWER_PDF_CJK_FONT_FALLBACK_PATH, _t as DEFAULT_FILE_VIEWER_DATA_SQL_WASM_URL, bt as DEFAULT_FILE_VIEWER_DOCX_WORKER_PATH, ct as DEFAULT_FILE_VIEWER_ARCHIVE_WASM_PATH, dn as resolveFileViewerRuntimeAssetBaseUrl, dt as DEFAULT_FILE_VIEWER_CAD_RUNTIME_VERSION, ft as DEFAULT_FILE_VIEWER_CAD_WASM_PATH, gt as DEFAULT_FILE_VIEWER_CHM_WORKER_PATH, ht as DEFAULT_FILE_VIEWER_CHM_WASM_PATH, jt as DEFAULT_FILE_VIEWER_PPT_MODULE_PATH, kt as DEFAULT_FILE_VIEWER_PDF_WORKER_PATH, lt as DEFAULT_FILE_VIEWER_ARCHIVE_WORKER_PATH, mt as DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PATH, ot as DEFAULT_RENDERER_DEFINITIONS, pt as DEFAULT_FILE_VIEWER_CAD_WORKER_PATH, u as coreBrowserRendererHandlers, ut as DEFAULT_FILE_VIEWER_CAD_DWF_WASM_PATH, vt as DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION, wt as DEFAULT_FILE_VIEWER_MODEL_WORKER_URL, xt as DEFAULT_FILE_VIEWER_DRAWIO_VIEWER_SCRIPT_PATH, yt as DEFAULT_FILE_VIEWER_DOCX_WORKER_JSZIP_PATH, zt as DEFAULT_FILE_VIEWER_TYPST_RENDERER_WASM_URL } from "./dist-B6GcL3C6.js";
import { t as archiveRenderer } from "./dist-yKvPooJe.js";
import { t as cadRenderer } from "./dist-BjKfHaZt.js";
import { t as chmRenderer } from "./dist-IzfkmdKq.js";
import { t as dataRenderer } from "./dist-CJORWQK4.js";
import { n as enableFileViewerDrawioOfficialViewer } from "./optionalCapabilities-DZkZdw-4.js";
import { t as drawingRenderer } from "./dist-C5xrxvnJ.js";
import { t as ebookRenderer } from "./dist-BrNrmPJn.js";
import { t as edaRenderer } from "./dist-CxzWyVFu.js";
import { t as emailRenderer } from "./dist-DTgbzNHq.js";
import { t as geoRenderer } from "./dist-1EmPAF0A.js";
import { a as pdfRenderer, c as hangulRenderer, i as presentationRenderer, n as wordRenderer, o as ofdRenderer, r as spreadsheetRenderer, s as iworkRenderer, t as wordPerfectRenderer } from "./dist-DlCIr-2z.js";
import { t as imageRenderer } from "./dist-jPa7bOgR.js";
import { i as registerFileViewerMidiLoader, r as registerFileViewerHlsLoader } from "./optionalCapabilities-DoqPKHQV.js";
import { t as mediaRenderer } from "./dist-DBX6K-dU.js";
import { t as mindmapRenderer } from "./dist-CoVNr2vK.js";
import { t as modelRenderer } from "./dist-Bzcj3Qqc.js";
import { n as registerFileViewerPdfIdentityFontRepair } from "./optionalCapabilities-DJMg3iZE.js";
import { r as textRenderer } from "./dist-C2YORrcU.js";
import { a as registerFileViewerMermaidLoader, i as registerFileViewerDiffToHtml, o as registerFileViewerPakoLoader } from "./optionalCapabilities-DTmfuhAv.js";
import { n as typstRenderer } from "./dist-92RMUcs6.js";
import { n as registerFileViewerRtfLoader } from "./optionalCapabilities-nZLK8l89.js";
import { t as require_pako } from "./pako-zjLPraeO.js";
import { i as registerPptxChartLibraryLoader } from "./dist-BHkjd7xj2.js";
//#region ../../node_modules/.pnpm/tslib@1.14.1/node_modules/tslib/tslib.es6.js
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
var extendStatics = function(d, b) {
	extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
		d.__proto__ = b;
	} || function(d, b) {
		for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	};
	return extendStatics(d, b);
};
function __extends(d, b) {
	extendStatics(d, b);
	function __() {
		this.constructor = d;
	}
	d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function() {
	__assign = Object.assign || function __assign(t) {
		for (var s, i = 1, n = arguments.length; i < n; i++) {
			s = arguments[i];
			for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
		}
		return t;
	};
	return __assign.apply(this, arguments);
};
function __rest(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
}
function __awaiter(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
}
function __generator(thisArg, body) {
	var _ = {
		label: 0,
		sent: function() {
			if (t[0] & 1) throw t[1];
			return t[1];
		},
		trys: [],
		ops: []
	}, f, y, t, g;
	return g = {
		next: verb(0),
		"throw": verb(1),
		"return": verb(2)
	}, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
		return this;
	}), g;
	function verb(n) {
		return function(v) {
			return step([n, v]);
		};
	}
	function step(op) {
		if (f) throw new TypeError("Generator is already executing.");
		while (_) try {
			if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
			if (y = 0, t) op = [op[0] & 2, t.value];
			switch (op[0]) {
				case 0:
				case 1:
					t = op;
					break;
				case 4:
					_.label++;
					return {
						value: op[1],
						done: false
					};
				case 5:
					_.label++;
					y = op[1];
					op = [0];
					continue;
				case 7:
					op = _.ops.pop();
					_.trys.pop();
					continue;
				default:
					if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
						_ = 0;
						continue;
					}
					if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
						_.label = op[1];
						break;
					}
					if (op[0] === 6 && _.label < t[1]) {
						_.label = t[1];
						t = op;
						break;
					}
					if (t && _.label < t[2]) {
						_.label = t[2];
						_.ops.push(op);
						break;
					}
					if (t[2]) _.ops.pop();
					_.trys.pop();
					continue;
			}
			op = body.call(thisArg, _);
		} catch (e) {
			op = [6, e];
			y = 0;
		} finally {
			f = t = 0;
		}
		if (op[0] & 5) throw op[1];
		return {
			value: op[0] ? op[1] : void 0,
			done: true
		};
	}
}
function __spreadArrays() {
	for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
	for (var r = Array(s), k = 0, i = 0; i < il; i++) for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];
	return r;
}
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/base64.js
var chars$1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup$1 = /* @__PURE__ */ new Uint8Array(256);
for (var i$1 = 0; i$1 < chars$1.length; i$1++) lookup$1[chars$1.charCodeAt(i$1)] = i$1;
var encodeToBase64 = function(bytes) {
	var base64 = "";
	var len = bytes.length;
	for (var i = 0; i < len; i += 3) {
		base64 += chars$1[bytes[i] >> 2];
		base64 += chars$1[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
		base64 += chars$1[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
		base64 += chars$1[bytes[i + 2] & 63];
	}
	if (len % 3 === 2) base64 = base64.substring(0, base64.length - 1) + "=";
	else if (len % 3 === 1) base64 = base64.substring(0, base64.length - 2) + "==";
	return base64;
};
var decodeFromBase64$1 = function(base64) {
	var bufferLength = base64.length * .75;
	var len = base64.length;
	var i;
	var p = 0;
	var encoded1;
	var encoded2;
	var encoded3;
	var encoded4;
	if (base64[base64.length - 1] === "=") {
		bufferLength--;
		if (base64[base64.length - 2] === "=") bufferLength--;
	}
	var bytes = new Uint8Array(bufferLength);
	for (i = 0; i < len; i += 4) {
		encoded1 = lookup$1[base64.charCodeAt(i)];
		encoded2 = lookup$1[base64.charCodeAt(i + 1)];
		encoded3 = lookup$1[base64.charCodeAt(i + 2)];
		encoded4 = lookup$1[base64.charCodeAt(i + 3)];
		bytes[p++] = encoded1 << 2 | encoded2 >> 4;
		bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
		bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
	}
	return bytes;
};
var DATA_URI_PREFIX_REGEX = /^(data)?:?([\w\/\+]+)?;?(charset=[\w-]+|base64)?.*,/i;
/**
* If the `dataUri` input is a data URI, then the data URI prefix must not be
* longer than 100 characters, or this function will fail to decode it.
*
* @param dataUri a base64 data URI or plain base64 string
* @returns a Uint8Array containing the decoded input
*/
var decodeFromBase64DataUri = function(dataUri) {
	var trimmedUri = dataUri.trim();
	var res = trimmedUri.substring(0, 100).match(DATA_URI_PREFIX_REGEX);
	if (!res) return decodeFromBase64$1(trimmedUri);
	var fullMatch = res[0];
	return decodeFromBase64$1(trimmedUri.substring(fullMatch.length));
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/strings.js
var toCharCode = function(character) {
	return character.charCodeAt(0);
};
var toCodePoint = function(character) {
	return character.codePointAt(0);
};
var toHexStringOfMinLength = function(num, minLength) {
	return padStart$1(num.toString(16), minLength, "0").toUpperCase();
};
var toHexString = function(num) {
	return toHexStringOfMinLength(num, 2);
};
var charFromCode = function(code) {
	return String.fromCharCode(code);
};
var charFromHexCode = function(hex) {
	return charFromCode(parseInt(hex, 16));
};
var padStart$1 = function(value, length, padChar) {
	var padding = "";
	for (var idx = 0, len = length - value.length; idx < len; idx++) padding += padChar;
	return padding + value;
};
var copyStringIntoBuffer = function(str, buffer, offset) {
	var length = str.length;
	for (var idx = 0; idx < length; idx++) buffer[offset++] = str.charCodeAt(idx);
	return length;
};
var escapeRegExp = function(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
var cleanText = function(text) {
	return text.replace(/\t|\u0085|\u2028|\u2029/g, "    ").replace(/[\b\v]/g, "");
};
var escapedNewlineChars = [
	"\\n",
	"\\f",
	"\\r",
	"\\u000B"
];
var isNewlineChar = function(text) {
	return /^[\n\f\r\u000B]$/.test(text);
};
var lineSplit = function(text) {
	return text.split(/[\n\f\r\u000B]/);
};
var mergeLines = function(text) {
	return text.replace(/[\n\f\r\u000B]/g, " ");
};
var charAtIndex = function(text, index) {
	var cuFirst = text.charCodeAt(index);
	var cuSecond;
	var nextIndex = index + 1;
	var length = 1;
	if (cuFirst >= 55296 && cuFirst <= 56319 && text.length > nextIndex) {
		cuSecond = text.charCodeAt(nextIndex);
		if (cuSecond >= 56320 && cuSecond <= 57343) length = 2;
	}
	return [text.slice(index, index + length), length];
};
var charSplit = function(text) {
	var chars = [];
	for (var idx = 0, len = text.length; idx < len;) {
		var _a = charAtIndex(text, idx), c = _a[0], cLen = _a[1];
		chars.push(c);
		idx += cLen;
	}
	return chars;
};
var buildWordBreakRegex = function(wordBreaks) {
	var newlineCharUnion = escapedNewlineChars.join("|");
	var escapedRules = ["$"];
	for (var idx = 0, len = wordBreaks.length; idx < len; idx++) {
		var wordBreak = wordBreaks[idx];
		if (isNewlineChar(wordBreak)) throw new TypeError("`wordBreak` must not include " + newlineCharUnion);
		escapedRules.push(wordBreak === "" ? "." : escapeRegExp(wordBreak));
	}
	var breakRules = escapedRules.join("|");
	return new RegExp("(" + newlineCharUnion + ")|((.*?)(" + breakRules + "))", "gm");
};
var breakTextIntoLines = function(text, wordBreaks, maxWidth, computeWidthOfText) {
	var regex = buildWordBreakRegex(wordBreaks);
	var words = cleanText(text).match(regex);
	var currLine = "";
	var currWidth = 0;
	var lines = [];
	var pushCurrLine = function() {
		if (currLine !== "") lines.push(currLine);
		currLine = "";
		currWidth = 0;
	};
	for (var idx = 0, len = words.length; idx < len; idx++) {
		var word = words[idx];
		if (isNewlineChar(word)) pushCurrLine();
		else {
			var width = computeWidthOfText(word);
			if (currWidth + width > maxWidth) pushCurrLine();
			currLine += word;
			currWidth += width;
		}
	}
	pushCurrLine();
	return lines;
};
var dateRegex = /^D:(\d\d\d\d)(\d\d)?(\d\d)?(\d\d)?(\d\d)?(\d\d)?([+\-Z])?(\d\d)?'?(\d\d)?'?$/;
var parseDate = function(dateStr) {
	var match = dateStr.match(dateRegex);
	if (!match) return void 0;
	var year = match[1], _a = match[2], month = _a === void 0 ? "01" : _a, _b = match[3], day = _b === void 0 ? "01" : _b, _c = match[4], hours = _c === void 0 ? "00" : _c, _d = match[5], mins = _d === void 0 ? "00" : _d, _e = match[6], secs = _e === void 0 ? "00" : _e, _f = match[7], offsetSign = _f === void 0 ? "Z" : _f, _g = match[8], offsetHours = _g === void 0 ? "00" : _g, _h = match[9], offsetMins = _h === void 0 ? "00" : _h;
	var tzOffset = offsetSign === "Z" ? "Z" : "" + offsetSign + offsetHours + ":" + offsetMins;
	return /* @__PURE__ */ new Date(year + "-" + month + "-" + day + "T" + hours + ":" + mins + ":" + secs + tzOffset);
};
var findLastMatch = function(value, regex) {
	var _a;
	var position = 0;
	var lastMatch;
	while (position < value.length) {
		var match = value.substring(position).match(regex);
		if (!match) return {
			match: lastMatch,
			pos: position
		};
		lastMatch = match;
		position += ((_a = match.index) !== null && _a !== void 0 ? _a : 0) + match[0].length;
	}
	return {
		match: lastMatch,
		pos: position
	};
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/arrays.js
var last = function(array) {
	return array[array.length - 1];
};
var typedArrayFor = function(value) {
	if (value instanceof Uint8Array) return value;
	var length = value.length;
	var typedArray = new Uint8Array(length);
	for (var idx = 0; idx < length; idx++) typedArray[idx] = value.charCodeAt(idx);
	return typedArray;
};
var mergeIntoTypedArray = function() {
	var arrays = [];
	for (var _i = 0; _i < arguments.length; _i++) arrays[_i] = arguments[_i];
	var arrayCount = arrays.length;
	var typedArrays = [];
	for (var idx = 0; idx < arrayCount; idx++) {
		var element = arrays[idx];
		typedArrays[idx] = element instanceof Uint8Array ? element : typedArrayFor(element);
	}
	var totalSize = 0;
	for (var idx = 0; idx < arrayCount; idx++) totalSize += arrays[idx].length;
	var merged = new Uint8Array(totalSize);
	var offset = 0;
	for (var arrIdx = 0; arrIdx < arrayCount; arrIdx++) {
		var arr = typedArrays[arrIdx];
		for (var byteIdx = 0, arrLen = arr.length; byteIdx < arrLen; byteIdx++) merged[offset++] = arr[byteIdx];
	}
	return merged;
};
var mergeUint8Arrays = function(arrays) {
	var totalSize = 0;
	for (var idx = 0, len = arrays.length; idx < len; idx++) totalSize += arrays[idx].length;
	var mergedBuffer = new Uint8Array(totalSize);
	var offset = 0;
	for (var idx = 0, len = arrays.length; idx < len; idx++) {
		var array = arrays[idx];
		mergedBuffer.set(array, offset);
		offset += array.length;
	}
	return mergedBuffer;
};
var arrayAsString = function(array) {
	var str = "";
	for (var idx = 0, len = array.length; idx < len; idx++) str += charFromCode(array[idx]);
	return str;
};
var byAscendingId = function(a, b) {
	return a.id - b.id;
};
var sortedUniq = function(array, indexer) {
	var uniq = [];
	for (var idx = 0, len = array.length; idx < len; idx++) {
		var curr = array[idx];
		var prev = array[idx - 1];
		if (idx === 0 || indexer(curr) !== indexer(prev)) uniq.push(curr);
	}
	return uniq;
};
var reverseArray = function(array) {
	var arrayLen = array.length;
	for (var idx = 0, len = Math.floor(arrayLen / 2); idx < len; idx++) {
		var leftIdx = idx;
		var rightIdx = arrayLen - idx - 1;
		var temp = array[idx];
		array[leftIdx] = array[rightIdx];
		array[rightIdx] = temp;
	}
	return array;
};
var sum = function(array) {
	var total = 0;
	for (var idx = 0, len = array.length; idx < len; idx++) total += array[idx];
	return total;
};
var range = function(start, end) {
	var arr = new Array(end - start);
	for (var idx = 0, len = arr.length; idx < len; idx++) arr[idx] = start + idx;
	return arr;
};
var pluckIndices = function(arr, indices) {
	var plucked = new Array(indices.length);
	for (var idx = 0, len = indices.length; idx < len; idx++) plucked[idx] = arr[indices[idx]];
	return plucked;
};
var canBeConvertedToUint8Array = function(input) {
	return input instanceof Uint8Array || input instanceof ArrayBuffer || typeof input === "string";
};
var toUint8Array = function(input) {
	if (typeof input === "string") return decodeFromBase64DataUri(input);
	else if (input instanceof ArrayBuffer) return new Uint8Array(input);
	else if (input instanceof Uint8Array) return input;
	else throw new TypeError("`input` must be one of `string | ArrayBuffer | Uint8Array`");
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/async.js
/**
* Returns a Promise that resolves after at least one tick of the
* Macro Task Queue occurs.
*/
var waitForTick = function() {
	return new Promise(function(resolve) {
		setTimeout(function() {
			return resolve();
		}, 0);
	});
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/unicode.js
/**
* Encodes a string to UTF-16.
*
* @param input The string to be encoded.
* @param byteOrderMark Whether or not a byte order marker (BOM) should be added
*                      to the start of the encoding. (default `true`)
* @returns A Uint16Array containing the UTF-16 encoding of the input string.
*
* -----------------------------------------------------------------------------
*
* JavaScript strings are composed of Unicode code points. Code points are
* integers in the range 0 to 1,114,111 (0x10FFFF). When serializing a string,
* it must be encoded as a sequence of words. A word is typically 8, 16, or 32
* bytes in size. As such, Unicode defines three encoding forms: UTF-8, UTF-16,
* and UTF-32. These encoding forms are described in the Unicode standard [1].
* This function implements the UTF-16 encoding form.
*
* -----------------------------------------------------------------------------
*
* In UTF-16, each code point is mapped to one or two 16-bit integers. The
* UTF-16 mapping logic is as follows [2]:
*
* • If a code point is in the range U+0000..U+FFFF, then map the code point to
*   a 16-bit integer with the most significant byte first.
*
* • If a code point is in the range U+10000..U+10000, then map the code point
*   to two 16-bit integers. The first integer should contain the high surrogate
*   and the second integer should contain the low surrogate. Both surrogates
*   should be written with the most significant byte first.
*
* -----------------------------------------------------------------------------
*
* It is important to note, when iterating through the code points of a string
* in JavaScript, that if a character is encoded as a surrogate pair it will
* increase the string's length by 2 instead of 1 [4]. For example:
*
* ```
* > 'a'.length
* 1
* > '💩'.length
* 2
* > '語'.length
* 1
* > 'a💩語'.length
* 4
* ```
*
* The results of the above example are explained by the fact that the
* characters 'a' and '語' are not represented by surrogate pairs, but '💩' is.
*
* Because of this idiosyncrasy in JavaScript's string implementation and APIs,
* we must "jump" an extra index after encoding a character as a surrogate
* pair. In practice, this means we must increment the index of our for loop by
* 2 if we encode a surrogate pair, and 1 in all other cases.
*
* -----------------------------------------------------------------------------
*
* References:
*   - [1] https://www.unicode.org/versions/Unicode12.0.0/UnicodeStandard-12.0.pdf
*         3.9  Unicode Encoding Forms - UTF-8
*   - [2] http://www.herongyang.com/Unicode/UTF-16-UTF-16-Encoding.html
*   - [3] https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length#Description
*
*/
var utf16Encode = function(input, byteOrderMark) {
	if (byteOrderMark === void 0) byteOrderMark = true;
	var encoded = [];
	if (byteOrderMark) encoded.push(65279);
	for (var idx = 0, len = input.length; idx < len;) {
		var codePoint = input.codePointAt(idx);
		if (codePoint < 65536) {
			encoded.push(codePoint);
			idx += 1;
		} else if (codePoint < 1114112) {
			encoded.push(highSurrogate(codePoint), lowSurrogate(codePoint));
			idx += 2;
		} else throw new Error("Invalid code point: 0x" + toHexString(codePoint));
	}
	return new Uint16Array(encoded);
};
/**
* Returns `true` if the `codePoint` is within the
* Basic Multilingual Plane (BMP). Code points inside the BMP are not encoded
* with surrogate pairs.
* @param codePoint The code point to be evaluated.
*
* Reference: https://en.wikipedia.org/wiki/UTF-16#Description
*/
var isWithinBMP = function(codePoint) {
	return codePoint >= 0 && codePoint <= 65535;
};
/**
* Returns `true` if the given `codePoint` is valid and must be represented
* with a surrogate pair when encoded.
* @param codePoint The code point to be evaluated.
*
* Reference: https://en.wikipedia.org/wiki/UTF-16#Description
*/
var hasSurrogates = function(codePoint) {
	return codePoint >= 65536 && codePoint <= 1114111;
};
var highSurrogate = function(codePoint) {
	return Math.floor((codePoint - 65536) / 1024) + 55296;
};
var lowSurrogate = function(codePoint) {
	return (codePoint - 65536) % 1024 + 56320;
};
var ByteOrder;
(function(ByteOrder) {
	ByteOrder["BigEndian"] = "BigEndian";
	ByteOrder["LittleEndian"] = "LittleEndian";
})(ByteOrder || (ByteOrder = {}));
var REPLACEMENT = "�".codePointAt(0);
/**
* Decodes a Uint8Array of data to a string using UTF-16.
*
* Note that this function attempts to recover from erronous input by
* inserting the replacement character (�) to mark invalid code points
* and surrogate pairs.
*
* @param input A Uint8Array containing UTF-16 encoded data
* @param byteOrderMark Whether or not a byte order marker (BOM) should be read
*                      at the start of the encoding. (default `true`)
* @returns The decoded string.
*/
var utf16Decode = function(input, byteOrderMark) {
	if (byteOrderMark === void 0) byteOrderMark = true;
	if (input.length <= 1) return String.fromCodePoint(REPLACEMENT);
	var byteOrder = byteOrderMark ? readBOM(input) : ByteOrder.BigEndian;
	var idx = byteOrderMark ? 2 : 0;
	var codePoints = [];
	while (input.length - idx >= 2) {
		var first = decodeValues(input[idx++], input[idx++], byteOrder);
		if (isHighSurrogate(first)) if (input.length - idx < 2) codePoints.push(REPLACEMENT);
		else {
			var second = decodeValues(input[idx++], input[idx++], byteOrder);
			if (isLowSurrogate(second)) codePoints.push(first, second);
			else codePoints.push(REPLACEMENT);
		}
		else if (isLowSurrogate(first)) {
			idx += 2;
			codePoints.push(REPLACEMENT);
		} else codePoints.push(first);
	}
	if (idx < input.length) codePoints.push(REPLACEMENT);
	return String.fromCodePoint.apply(String, codePoints);
};
/**
* Returns `true` if the given `codePoint` is a high surrogate.
* @param codePoint The code point to be evaluated.
*
* Reference: https://en.wikipedia.org/wiki/UTF-16#Description
*/
var isHighSurrogate = function(codePoint) {
	return codePoint >= 55296 && codePoint <= 56319;
};
/**
* Returns `true` if the given `codePoint` is a low surrogate.
* @param codePoint The code point to be evaluated.
*
* Reference: https://en.wikipedia.org/wiki/UTF-16#Description
*/
var isLowSurrogate = function(codePoint) {
	return codePoint >= 56320 && codePoint <= 57343;
};
/**
* Decodes the given utf-16 values first and second using the specified
* byte order.
* @param first The first byte of the encoding.
* @param second The second byte of the encoding.
* @param byteOrder The byte order of the encoding.
* Reference: https://en.wikipedia.org/wiki/UTF-16#Examples
*/
var decodeValues = function(first, second, byteOrder) {
	if (byteOrder === ByteOrder.LittleEndian) return second << 8 | first;
	if (byteOrder === ByteOrder.BigEndian) return first << 8 | second;
	throw new Error("Invalid byteOrder: " + byteOrder);
};
/**
* Returns whether the given array contains a byte order mark for the
* UTF-16BE or UTF-16LE encoding. If it has neither, BigEndian is assumed.
*
* Reference: https://en.wikipedia.org/wiki/Byte_order_mark#UTF-16
*
* @param bytes The byte array to be evaluated.
*/
var readBOM = function(bytes) {
	return hasUtf16BigEndianBOM(bytes) ? ByteOrder.BigEndian : hasUtf16LittleEndianBOM(bytes) ? ByteOrder.LittleEndian : ByteOrder.BigEndian;
};
var hasUtf16BigEndianBOM = function(bytes) {
	return bytes[0] === 254 && bytes[1] === 255;
};
var hasUtf16LittleEndianBOM = function(bytes) {
	return bytes[0] === 255 && bytes[1] === 254;
};
var hasUtf16BOM = function(bytes) {
	return hasUtf16BigEndianBOM(bytes) || hasUtf16LittleEndianBOM(bytes);
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/numbers.js
/**
* Converts a number to its string representation in decimal. This function
* differs from simply converting a number to a string with `.toString()`
* because this function's output string will **not** contain exponential
* notation.
*
* Credit: https://stackoverflow.com/a/46545519
*/
var numberToString = function(num) {
	var numStr = String(num);
	if (Math.abs(num) < 1) {
		var e = parseInt(num.toString().split("e-")[1]);
		if (e) {
			var negative = num < 0;
			if (negative) num *= -1;
			num *= Math.pow(10, e - 1);
			numStr = "0." + new Array(e).join("0") + num.toString().substring(2);
			if (negative) numStr = "-" + numStr;
		}
	} else {
		var e = parseInt(num.toString().split("+")[1]);
		if (e > 20) {
			e -= 20;
			num /= Math.pow(10, e);
			numStr = num.toString() + new Array(e + 1).join("0");
		}
	}
	return numStr;
};
var sizeInBytes = function(n) {
	return Math.ceil(n.toString(2).length / 8);
};
/**
* Converts a number into its constituent bytes and returns them as
* a number[].
*
* Returns most significant byte as first element in array. It may be necessary
* to call .reverse() to get the bits in the desired order.
*
* Example:
*   bytesFor(0x02A41E) => [ 0b10, 0b10100100, 0b11110 ]
*
* Credit for algorithm: https://stackoverflow.com/a/1936865
*/
var bytesFor = function(n) {
	var bytes = new Uint8Array(sizeInBytes(n));
	for (var i = 1; i <= bytes.length; i++) bytes[i - 1] = n >> (bytes.length - i) * 8;
	return bytes;
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/errors.js
var error = function(msg) {
	throw new Error(msg);
};
//#endregion
//#region ../../node_modules/.pnpm/@pdf-lib+standard-fonts@1.0.0/node_modules/@pdf-lib/standard-fonts/es/utils.js
var import_pako = /* @__PURE__ */ __toESM(require_pako());
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var lookup = /* @__PURE__ */ new Uint8Array(256);
for (var i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
var decodeFromBase64 = function(base64) {
	var bufferLength = base64.length * .75;
	var len = base64.length;
	var i;
	var p = 0;
	var encoded1;
	var encoded2;
	var encoded3;
	var encoded4;
	if (base64[base64.length - 1] === "=") {
		bufferLength--;
		if (base64[base64.length - 2] === "=") bufferLength--;
	}
	var bytes = new Uint8Array(bufferLength);
	for (i = 0; i < len; i += 4) {
		encoded1 = lookup[base64.charCodeAt(i)];
		encoded2 = lookup[base64.charCodeAt(i + 1)];
		encoded3 = lookup[base64.charCodeAt(i + 2)];
		encoded4 = lookup[base64.charCodeAt(i + 3)];
		bytes[p++] = encoded1 << 2 | encoded2 >> 4;
		bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
		bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
	}
	return bytes;
};
var arrayToString = function(array) {
	var str = "";
	for (var i = 0; i < array.length; i++) str += String.fromCharCode(array[i]);
	return str;
};
var decompressJson = function(compressedJson) {
	return arrayToString(import_pako.default.inflate(decodeFromBase64(compressedJson)));
};
var padStart = function(value, length, padChar) {
	var padding = "";
	for (var idx = 0, len = length - value.length; idx < len; idx++) padding += padChar;
	return padding + value;
};
//#endregion
//#region ../../node_modules/.pnpm/@pdf-lib+standard-fonts@1.0.0/node_modules/@pdf-lib/standard-fonts/es/Font.js
var compressedJsonForFontName = {
	"Courier": "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",
	"Courier-Bold": "eJyFWdtyGjkQ/RVqnnar8Bb4lpg3jEnCxgEvGDtxKg9iphm01oyILrZxKv++mrGd3az6KC8UnNa0+nrUGr5lI11VVLtskF198FaU1Dns9w9OOkf7/ePDrJu90bWbiorCgpH2RpLZO9WqaCReqZ8lnReJqKTa/SwL8DXJctPs9Lxs4oSS+bAuVVjXC7/tG/lAxYV0+SYbOOOpm402wojckVlQ8+T4wVFdUDHXlaifrTs91Q/Z4PNeMLu7t3/U6746POm+7vW/dLNlWGuUrOlCW+mkrrPBXr/X+4/gciPz25qszQbhyeyKjG2XZb3ewR+9Xi/sMdVO5k+ebHemcaHzW/57p3/y+qQbPk967We//TxoP191hoVeUWexs44q25nUuTZbbYSj4o9OZ6hUZ97osZ05WTJ3AQ37jMOqQtblIt9QG7lWycKJuhCmeJGGhSOxffccyqPj/W728eXX4cFJNxvavAmRyQbH++HnGf34vdc/etXNFq54d50NXh+2X6/C137v+CnQH8gZmYdQfP6WXX8MCppQTYMlditCBL53/wfTQ65EFeNfvQ6erlQsqX21akJc1rGs0EoJE+NbMnlToZFAVEFkQ3iABW2uGH3CUK1ojUTgMWEbjfaWeUp5G6N5aCwRw5vddkOM98EVqRlPrBJ2E8OPZHSM6prJkrtnVrqNIWbtOjQrg8o7Zq2VDwxId5x3xMe0lpzBuVaa0WGpkkCkmgaON/3qBVODpaHQiIybXz3ZliTi3DO2D2PoNIZGMXQWQ+MYehNDb2PoXQxNYujPGHofQ+cx9CGGpjE0i6GLGPorhuYxtIihyxhaxtBVDF3H0McY+hRDNzG0CqfQLTmeNlZBBvr0+TnIKbmUuTS5Z1jUN6xtw8nBtEjLb7wxDOesmB5j+JfpIIYLmIZiWC6GZAz9HUMMvTItzESL6VqG9rZMKGOI4QaGXpjY+xi6i6H7GGKYdMeQPl9foBBW3GHark9Vo5OqgEd9oe+ZOPOnc3NcqmZgiUuomehYnt1xZ8daaSPZ8wBoyb0Jx3jOBLBtGyvbiRNOLXw0Sy+DpNKAAhpxq/gXYhD6NdMda6bwwyTH0kwhypI70p5wdhR7Gjia3JEhpvfDLCRKI7YcqYXJnxgv/g3vSthEhNNSEKIfCQByUkpurWQaNXjqNtqjSfHp0OdLOwSAG31E7h03uLRMvlbEtDPoq0rkhqvhlSFu40I7kfP9VoRLFrH+G7YLcypCQLkJ1delML5SwjPb6DIMmQxL54L1gyq+YIfMyKNNsQ4zHj8UnoMDdoZwfoMqkJxX7A6Cj3czWzLdqcC+GuGM9tCa4RobSp5J2gTnk0D5CVA0Pp1RAqn7hC0o5J3kqvkTsGyY6gwBHlqmHtqBh2x77UI9QimVS75PljgMAjXDEljn0QNjvMlZIAju/pF0NH95VcFshSgnB3Ug+LhMkwYoVKOAUS+T2kZIG2DVcYInLXDTQkKUYHelH6kuGcEcbPE26aRPNklKOEQpNcCQHPp6k4jc5UYbRtkM7T4HcVsAvADWLtEGnq/M9t2G9e2Aw8xEM1CCQ4QDWq28cnKrmDHTAwcvgYNh1HJSqEKumdvVDlPDFOwjU8UyTpZZ4tTBohzYUSMaRAmdggBNgKLmzVsYGLjXbyujb6lm70CGSmnB1PsWJHuSYhQfupq/ioxBTRngkEaRuQEP3ICIPb/kAq/Axo6ZUEaQFFSStxwa/eDpiARDND4kqhIE+BG1Btp7hjKCjh6UKYt2xk7MkmMJ8PCMlGNy5XiSdvc6wYjYtIp5pSGBRTo9Z45R6Asw4bQ8HgrYhEJmTFsk6pWvyPfJOj4HiXNGFFQJw1hOCVaYgChNUOGcA6tD0DZCMSdDczMBDa5TFVWDqWn5i/yB+BByqARcGhx6ziqXVD4Ii2TqZmnLi8AS3L8dGqRoBIzwkM0LmXNpOAOKTNKbKciPBvg8XdZJ6RDoHEKO5meuGdDzmOiQMTrt0d63SVfAIDBJtgIwwaUvN7ps8l1r7v0I5lKPRUEV+rcqfaHlDvJH4FSdVBVCjk8IiXp87Jv/Ib90s/dk6gshTfPv8Zfv/wDUfBK2",
	"Courier-Oblique": "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",
	"Courier-BoldOblique": "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",
	"Helvetica": "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",
	"Helvetica-Bold": "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",
	"Helvetica-Oblique": "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",
	"Helvetica-BoldOblique": "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",
	"Times-Roman": "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",
	"Times-Bold": "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",
	"Times-Italic": "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",
	"Times-BoldItalic": "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",
	"Symbol": "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",
	"ZapfDingbats": "eJxtmNtu20YQhl+F4FULyMGeD7pz3AY1ChtG7NpFA18w1NomIlECSRcxgrx7SVk7+wOdG8H5OJydf2Z2d5gf9cV+t0v9VK/r+6vXsXlOlbHe28paq229qj/t++m62aXZ4J/m8PRb1z9/baZxefK63Z6eXN5dVMvTCh83u277xr/6kLrnl2XNq7TpXnczuZyabdee98/b2VzM/x4/dd/T5qab2pd6PQ2vaVVfvDRD005puE3Lu7eH1HbN9hTjx4/77/X6y5lcnUmjVzHIVVDicVX/1W/SsO36dLMfu6nb9/X6TAoBD+5euvZbn8axXtuZ36dhPJrVQqgPQoh5hev91LWLkIv94W1Ygq9+aX+tZAx2tfz64284/sblN/rqfLP/mqrbt3FKu7G67Nv9cNgPzZQ2H6rz7bb6vLgZq89pTMO/M/xfEqturJpqSM/d7GJIm2oamk3aNcO3av80O5xh3yyKmm1193ZIT02bqovTKjP+MAf++7zsZvZ3276kYyWWXB0z99S18/PbafPHQ71W4fjn/fxnFO+ZvkrT0LVzTr78qB/+nk38bHM9exgP8zr1z9U7jt6840YW5uSJKcZOCaBBnKgm5mU8MVNYyMwWFvO7Ukagkmgg6sDWQ5yFFqjzUrLEaQ3BEmiwNsMSaZS0vgWfOkPHWQowNeTUc0kumnxZvsgPxlGai6VTGUqAVCTQ6QkWnc77DKEiLktSUBJKqHIQZ86d8gCpHYoiEzMsb1ubYy8vW50DChB5ZhGqrijD0EqUIeiaEHIfCg5Kpuu0ApiToaGPSY0uaQsyr65L2oKi1yFt1PLaQ3lzfXTgXodGoJYzglndSLDMPg1sTPJpQJHJigw0QrGERqD9YhyTOgONQDUyuF1zaxuokc/BW2ztXCMrGZ9WMW1oQZHIXWNBkSCfRZEL5BMUiZw6CzVSFCfUSGZFNjIldoKDkonTKQiJIGzWmFd3BizJJ9SINoLDriOfUCOZS+zg+KGD1qGiLNMLxtJD1/ns00ON6EzyUCM6vbxhoBKaqbG3DFQCNiL1iHccBPV0DHhQH/JW8EW90dkyFKGywCJU0WkVSvSGeiSUODWFFD0HYdPQVoiRgfPMA+/nnRgiAyNYSjpWNQcNSMrtFCUH4ZIRpSCWocFCSuhCEY6hoUClc0WC52BJlCYYLQdhN+hygRRRlo5BKRRLS6oihSqh+ZzzRGG1Mo4Iz1LoP0qsxDGFzk0JE42ji0jCPejomJKCuwil4m5CiRMEUMVSzVLDUstSx1Juc0oVWMpqY295qVltmtWmWW2a1aZZbZrVplltmtWmWW2G1WZYbYbVZlhthtVmWG2G1WZYbYbVZlhtltVmWW2W1WZZbZbVZlltltVmWW2W1QYjQCh7E2aAQHeGhCFgPoNoy8KNb2wxBhmGKBxoUZXlLGsLI6AsftEDHV0wIURVbANLcTKlGGBIKPOAxCmhePCKUwFzAmpDFRQvjA9R06Hq8TONvshgKDCuRAZTXigUxjxNFfKRo3CLhnIJBMFRvMZpqpNBMlQJzGT5WFQMVQI/AikPMIhEU1aDjqJvQwmjSHB05cC9jbYwc5UtAHNLhDw41ha+lEqF4JaH3gmB61SYcqInxTDmQK8v08vjqv4zDf1N0w3Lf4A8/vwPpfK11w=="
};
var FontNames;
(function(FontNames) {
	FontNames["Courier"] = "Courier";
	FontNames["CourierBold"] = "Courier-Bold";
	FontNames["CourierOblique"] = "Courier-Oblique";
	FontNames["CourierBoldOblique"] = "Courier-BoldOblique";
	FontNames["Helvetica"] = "Helvetica";
	FontNames["HelveticaBold"] = "Helvetica-Bold";
	FontNames["HelveticaOblique"] = "Helvetica-Oblique";
	FontNames["HelveticaBoldOblique"] = "Helvetica-BoldOblique";
	FontNames["TimesRoman"] = "Times-Roman";
	FontNames["TimesRomanBold"] = "Times-Bold";
	FontNames["TimesRomanItalic"] = "Times-Italic";
	FontNames["TimesRomanBoldItalic"] = "Times-BoldItalic";
	FontNames["Symbol"] = "Symbol";
	FontNames["ZapfDingbats"] = "ZapfDingbats";
})(FontNames || (FontNames = {}));
var fontCache = {};
var Font = function() {
	function Font() {
		var _this = this;
		this.getWidthOfGlyph = function(glyphName) {
			return _this.CharWidths[glyphName];
		};
		this.getXAxisKerningForPair = function(leftGlyphName, rightGlyphName) {
			return (_this.KernPairXAmounts[leftGlyphName] || {})[rightGlyphName];
		};
	}
	Font.load = function(fontName) {
		var cachedFont = fontCache[fontName];
		if (cachedFont) return cachedFont;
		var json = decompressJson(compressedJsonForFontName[fontName]);
		var font = Object.assign(new Font(), JSON.parse(json));
		font.CharWidths = font.CharMetrics.reduce(function(acc, metric) {
			acc[metric.N] = metric.WX;
			return acc;
		}, {});
		font.KernPairXAmounts = font.KernPairs.reduce(function(acc, _a) {
			var name1 = _a[0], name2 = _a[1], width = _a[2];
			if (!acc[name1]) acc[name1] = {};
			acc[name1][name2] = width;
			return acc;
		}, {});
		fontCache[fontName] = font;
		return font;
	};
	return Font;
}();
//#endregion
//#region ../../node_modules/.pnpm/@pdf-lib+standard-fonts@1.0.0/node_modules/@pdf-lib/standard-fonts/es/Encoding.js
var decompressedEncodings = decompressJson("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");
var allUnicodeMappings = JSON.parse(decompressedEncodings);
var Encoding = function() {
	function Encoding(name, unicodeMappings) {
		var _this = this;
		this.canEncodeUnicodeCodePoint = function(codePoint) {
			return codePoint in _this.unicodeMappings;
		};
		this.encodeUnicodeCodePoint = function(codePoint) {
			var mapped = _this.unicodeMappings[codePoint];
			if (!mapped) {
				var str = String.fromCharCode(codePoint);
				var hexCode = "0x" + padStart(codePoint.toString(16), 4, "0");
				var msg = _this.name + " cannot encode \"" + str + "\" (" + hexCode + ")";
				throw new Error(msg);
			}
			return {
				code: mapped[0],
				name: mapped[1]
			};
		};
		this.name = name;
		this.supportedCodePoints = Object.keys(unicodeMappings).map(Number).sort(function(a, b) {
			return a - b;
		});
		this.unicodeMappings = unicodeMappings;
	}
	return Encoding;
}();
var Encodings = {
	Symbol: new Encoding("Symbol", allUnicodeMappings.symbol),
	ZapfDingbats: new Encoding("ZapfDingbats", allUnicodeMappings.zapfdingbats),
	WinAnsi: new Encoding("WinAnsi", allUnicodeMappings.win1252)
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/objects.js
var values = function(obj) {
	return Object.keys(obj).map(function(k) {
		return obj[k];
	});
};
var StandardFontValues = values(FontNames);
var isStandardFont = function(input) {
	return StandardFontValues.includes(input);
};
var rectanglesAreEqual = function(a, b) {
	return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/validators.js
var backtick = function(val) {
	return "`" + val + "`";
};
var singleQuote = function(val) {
	return "'" + val + "'";
};
var formatValue = function(value) {
	var type = typeof value;
	if (type === "string") return singleQuote(value);
	else if (type === "undefined") return backtick(value);
	else return value;
};
var createValueErrorMsg = function(value, valueName, values) {
	var allowedValues = new Array(values.length);
	for (var idx = 0, len = values.length; idx < len; idx++) {
		var v = values[idx];
		allowedValues[idx] = formatValue(v);
	}
	var joinedValues = allowedValues.join(" or ");
	return backtick(valueName) + " must be one of " + joinedValues + ", but was actually " + formatValue(value);
};
var assertIsOneOf = function(value, valueName, allowedValues) {
	if (!Array.isArray(allowedValues)) allowedValues = values(allowedValues);
	for (var idx = 0, len = allowedValues.length; idx < len; idx++) if (value === allowedValues[idx]) return;
	throw new TypeError(createValueErrorMsg(value, valueName, allowedValues));
};
var assertIsOneOfOrUndefined = function(value, valueName, allowedValues) {
	if (!Array.isArray(allowedValues)) allowedValues = values(allowedValues);
	assertIsOneOf(value, valueName, allowedValues.concat(void 0));
};
var assertIsSubset = function(values$1, valueName, allowedValues) {
	if (!Array.isArray(allowedValues)) allowedValues = values(allowedValues);
	for (var idx = 0, len = values$1.length; idx < len; idx++) assertIsOneOf(values$1[idx], valueName, allowedValues);
};
var getType = function(val) {
	if (val === null) return "null";
	if (val === void 0) return "undefined";
	if (typeof val === "string") return "string";
	if (isNaN(val)) return "NaN";
	if (typeof val === "number") return "number";
	if (typeof val === "boolean") return "boolean";
	if (typeof val === "symbol") return "symbol";
	if (typeof val === "bigint") return "bigint";
	if (val.constructor && val.constructor.name) return val.constructor.name;
	if (val.name) return val.name;
	if (val.constructor) return String(val.constructor);
	return String(val);
};
var isType = function(value, type) {
	if (type === "null") return value === null;
	if (type === "undefined") return value === void 0;
	if (type === "string") return typeof value === "string";
	if (type === "number") return typeof value === "number" && !isNaN(value);
	if (type === "boolean") return typeof value === "boolean";
	if (type === "symbol") return typeof value === "symbol";
	if (type === "bigint") return typeof value === "bigint";
	if (type === Date) return value instanceof Date;
	if (type === Array) return value instanceof Array;
	if (type === Uint8Array) return value instanceof Uint8Array;
	if (type === ArrayBuffer) return value instanceof ArrayBuffer;
	if (type === Function) return value instanceof Function;
	return value instanceof type[0];
};
var createTypeErrorMsg = function(value, valueName, types) {
	var allowedTypes = new Array(types.length);
	for (var idx = 0, len = types.length; idx < len; idx++) {
		var type = types[idx];
		if (type === "null") allowedTypes[idx] = backtick("null");
		if (type === "undefined") allowedTypes[idx] = backtick("undefined");
		if (type === "string") allowedTypes[idx] = backtick("string");
		else if (type === "number") allowedTypes[idx] = backtick("number");
		else if (type === "boolean") allowedTypes[idx] = backtick("boolean");
		else if (type === "symbol") allowedTypes[idx] = backtick("symbol");
		else if (type === "bigint") allowedTypes[idx] = backtick("bigint");
		else if (type === Array) allowedTypes[idx] = backtick("Array");
		else if (type === Uint8Array) allowedTypes[idx] = backtick("Uint8Array");
		else if (type === ArrayBuffer) allowedTypes[idx] = backtick("ArrayBuffer");
		else allowedTypes[idx] = backtick(type[1]);
	}
	var joinedTypes = allowedTypes.join(" or ");
	return backtick(valueName) + " must be of type " + joinedTypes + ", but was actually of type " + backtick(getType(value));
};
var assertIs = function(value, valueName, types) {
	for (var idx = 0, len = types.length; idx < len; idx++) if (isType(value, types[idx])) return;
	throw new TypeError(createTypeErrorMsg(value, valueName, types));
};
var assertOrUndefined = function(value, valueName, types) {
	assertIs(value, valueName, types.concat("undefined"));
};
var assertEachIs = function(values, valueName, types) {
	for (var idx = 0, len = values.length; idx < len; idx++) assertIs(values[idx], valueName, types);
};
var assertRange = function(value, valueName, min, max) {
	assertIs(value, valueName, ["number"]);
	assertIs(min, "min", ["number"]);
	assertIs(max, "max", ["number"]);
	max = Math.max(min, max);
	if (value < min || value > max) throw new Error(backtick(valueName) + " must be at least " + min + " and at most " + max + ", but was actually " + value);
};
var assertRangeOrUndefined = function(value, valueName, min, max) {
	assertIs(value, valueName, ["number", "undefined"]);
	if (typeof value === "number") assertRange(value, valueName, min, max);
};
var assertMultiple = function(value, valueName, multiplier) {
	assertIs(value, valueName, ["number"]);
	if (value % multiplier !== 0) throw new Error(backtick(valueName) + " must be a multiple of " + multiplier + ", but was actually " + value);
};
var assertInteger = function(value, valueName) {
	if (!Number.isInteger(value)) throw new Error(backtick(valueName) + " must be an integer, but was actually " + value);
};
var assertPositive = function(value, valueName) {
	if (![1, 0].includes(Math.sign(value))) throw new Error(backtick(valueName) + " must be a positive number or 0, but was actually " + value);
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/pdfDocEncoding.js
var pdfDocEncodingToUnicode = /* @__PURE__ */ new Uint16Array(256);
for (var idx$2 = 0; idx$2 < 256; idx$2++) pdfDocEncodingToUnicode[idx$2] = idx$2;
pdfDocEncodingToUnicode[22] = toCharCode("");
pdfDocEncodingToUnicode[24] = toCharCode("˘");
pdfDocEncodingToUnicode[25] = toCharCode("ˇ");
pdfDocEncodingToUnicode[26] = toCharCode("ˆ");
pdfDocEncodingToUnicode[27] = toCharCode("˙");
pdfDocEncodingToUnicode[28] = toCharCode("˝");
pdfDocEncodingToUnicode[29] = toCharCode("˛");
pdfDocEncodingToUnicode[30] = toCharCode("˚");
pdfDocEncodingToUnicode[31] = toCharCode("˜");
pdfDocEncodingToUnicode[127] = toCharCode("�");
pdfDocEncodingToUnicode[128] = toCharCode("•");
pdfDocEncodingToUnicode[129] = toCharCode("†");
pdfDocEncodingToUnicode[130] = toCharCode("‡");
pdfDocEncodingToUnicode[131] = toCharCode("…");
pdfDocEncodingToUnicode[132] = toCharCode("—");
pdfDocEncodingToUnicode[133] = toCharCode("–");
pdfDocEncodingToUnicode[134] = toCharCode("ƒ");
pdfDocEncodingToUnicode[135] = toCharCode("⁄");
pdfDocEncodingToUnicode[136] = toCharCode("‹");
pdfDocEncodingToUnicode[137] = toCharCode("›");
pdfDocEncodingToUnicode[138] = toCharCode("−");
pdfDocEncodingToUnicode[139] = toCharCode("‰");
pdfDocEncodingToUnicode[140] = toCharCode("„");
pdfDocEncodingToUnicode[141] = toCharCode("“");
pdfDocEncodingToUnicode[142] = toCharCode("”");
pdfDocEncodingToUnicode[143] = toCharCode("‘");
pdfDocEncodingToUnicode[144] = toCharCode("’");
pdfDocEncodingToUnicode[145] = toCharCode("‚");
pdfDocEncodingToUnicode[146] = toCharCode("™");
pdfDocEncodingToUnicode[147] = toCharCode("ﬁ");
pdfDocEncodingToUnicode[148] = toCharCode("ﬂ");
pdfDocEncodingToUnicode[149] = toCharCode("Ł");
pdfDocEncodingToUnicode[150] = toCharCode("Œ");
pdfDocEncodingToUnicode[151] = toCharCode("Š");
pdfDocEncodingToUnicode[152] = toCharCode("Ÿ");
pdfDocEncodingToUnicode[153] = toCharCode("Ž");
pdfDocEncodingToUnicode[154] = toCharCode("ı");
pdfDocEncodingToUnicode[155] = toCharCode("ł");
pdfDocEncodingToUnicode[156] = toCharCode("œ");
pdfDocEncodingToUnicode[157] = toCharCode("š");
pdfDocEncodingToUnicode[158] = toCharCode("ž");
pdfDocEncodingToUnicode[159] = toCharCode("�");
pdfDocEncodingToUnicode[160] = toCharCode("€");
pdfDocEncodingToUnicode[173] = toCharCode("�");
/**
* Decode a byte array into a string using PDFDocEncoding.
*
* @param bytes a byte array (decimal representation) containing a string
*              encoded with PDFDocEncoding.
*/
var pdfDocEncodingDecode = function(bytes) {
	var codePoints = new Array(bytes.length);
	for (var idx = 0, len = bytes.length; idx < len; idx++) codePoints[idx] = pdfDocEncodingToUnicode[bytes[idx]];
	return String.fromCodePoint.apply(String, codePoints);
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/Cache.js
var Cache = function() {
	function Cache(populate) {
		this.populate = populate;
		this.value = void 0;
	}
	Cache.prototype.getValue = function() {
		return this.value;
	};
	Cache.prototype.access = function() {
		if (!this.value) this.value = this.populate();
		return this.value;
	};
	Cache.prototype.invalidate = function() {
		this.value = void 0;
	};
	Cache.populatedBy = function(populate) {
		return new Cache(populate);
	};
	return Cache;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/errors.js
var MethodNotImplementedError = function(_super) {
	__extends(MethodNotImplementedError, _super);
	function MethodNotImplementedError(className, methodName) {
		var _this = this;
		var msg = "Method " + className + "." + methodName + "() not implemented";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return MethodNotImplementedError;
}(Error);
var PrivateConstructorError = function(_super) {
	__extends(PrivateConstructorError, _super);
	function PrivateConstructorError(className) {
		var _this = this;
		var msg = "Cannot construct " + className + " - it has a private constructor";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return PrivateConstructorError;
}(Error);
var UnexpectedObjectTypeError = function(_super) {
	__extends(UnexpectedObjectTypeError, _super);
	function UnexpectedObjectTypeError(expected, actual) {
		var _this = this;
		var name = function(t) {
			var _a, _b;
			return (_a = t === null || t === void 0 ? void 0 : t.name) !== null && _a !== void 0 ? _a : (_b = t === null || t === void 0 ? void 0 : t.constructor) === null || _b === void 0 ? void 0 : _b.name;
		};
		var msg = "Expected instance of " + (Array.isArray(expected) ? expected.map(name) : [name(expected)]).join(" or ") + ", " + ("but got instance of " + (actual ? name(actual) : actual));
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return UnexpectedObjectTypeError;
}(Error);
var UnsupportedEncodingError = function(_super) {
	__extends(UnsupportedEncodingError, _super);
	function UnsupportedEncodingError(encoding) {
		var _this = this;
		var msg = encoding + " stream encoding not supported";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return UnsupportedEncodingError;
}(Error);
var ReparseError = function(_super) {
	__extends(ReparseError, _super);
	function ReparseError(className, methodName) {
		var _this = this;
		var msg = "Cannot call " + className + "." + methodName + "() more than once";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return ReparseError;
}(Error);
(function(_super) {
	__extends(MissingCatalogError, _super);
	function MissingCatalogError(ref) {
		var _this = this;
		var msg = "Missing catalog (ref=" + ref + ")";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return MissingCatalogError;
})(Error);
var MissingPageContentsEmbeddingError = function(_super) {
	__extends(MissingPageContentsEmbeddingError, _super);
	function MissingPageContentsEmbeddingError() {
		var _this = this;
		_this = _super.call(this, "Can't embed page with missing Contents") || this;
		return _this;
	}
	return MissingPageContentsEmbeddingError;
}(Error);
var UnrecognizedStreamTypeError = function(_super) {
	__extends(UnrecognizedStreamTypeError, _super);
	function UnrecognizedStreamTypeError(stream) {
		var _a, _b, _c;
		var _this = this;
		var msg = "Unrecognized stream type: " + ((_c = (_b = (_a = stream === null || stream === void 0 ? void 0 : stream.contructor) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : stream === null || stream === void 0 ? void 0 : stream.name) !== null && _c !== void 0 ? _c : stream);
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return UnrecognizedStreamTypeError;
}(Error);
var PageEmbeddingMismatchedContextError = function(_super) {
	__extends(PageEmbeddingMismatchedContextError, _super);
	function PageEmbeddingMismatchedContextError() {
		var _this = this;
		_this = _super.call(this, "Found mismatched contexts while embedding pages. All pages in the array passed to `PDFDocument.embedPages()` must be from the same document.") || this;
		return _this;
	}
	return PageEmbeddingMismatchedContextError;
}(Error);
var PDFArrayIsNotRectangleError = function(_super) {
	__extends(PDFArrayIsNotRectangleError, _super);
	function PDFArrayIsNotRectangleError(size) {
		var _this = this;
		var msg = "Attempted to convert PDFArray with " + size + " elements to rectangle, but must have exactly 4 elements.";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return PDFArrayIsNotRectangleError;
}(Error);
var InvalidPDFDateStringError = function(_super) {
	__extends(InvalidPDFDateStringError, _super);
	function InvalidPDFDateStringError(value) {
		var _this = this;
		var msg = "Attempted to convert \"" + value + "\" to a date, but it does not match the PDF date string format.";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return InvalidPDFDateStringError;
}(Error);
var InvalidTargetIndexError = function(_super) {
	__extends(InvalidTargetIndexError, _super);
	function InvalidTargetIndexError(targetIndex, Count) {
		var _this = this;
		var msg = "Invalid targetIndex specified: targetIndex=" + targetIndex + " must be less than Count=" + Count;
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return InvalidTargetIndexError;
}(Error);
var CorruptPageTreeError = function(_super) {
	__extends(CorruptPageTreeError, _super);
	function CorruptPageTreeError(targetIndex, operation) {
		var _this = this;
		var msg = "Failed to " + operation + " at targetIndex=" + targetIndex + " due to corrupt page tree: It is likely that one or more 'Count' entries are invalid";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return CorruptPageTreeError;
}(Error);
var IndexOutOfBoundsError = function(_super) {
	__extends(IndexOutOfBoundsError, _super);
	function IndexOutOfBoundsError(index, min, max) {
		var _this = this;
		var msg = "index should be at least " + min + " and at most " + max + ", but was actually " + index;
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return IndexOutOfBoundsError;
}(Error);
var InvalidAcroFieldValueError = function(_super) {
	__extends(InvalidAcroFieldValueError, _super);
	function InvalidAcroFieldValueError() {
		var _this = this;
		_this = _super.call(this, "Attempted to set invalid field value") || this;
		return _this;
	}
	return InvalidAcroFieldValueError;
}(Error);
var MultiSelectValueError = function(_super) {
	__extends(MultiSelectValueError, _super);
	function MultiSelectValueError() {
		var _this = this;
		_this = _super.call(this, "Attempted to select multiple values for single-select field") || this;
		return _this;
	}
	return MultiSelectValueError;
}(Error);
var MissingDAEntryError = function(_super) {
	__extends(MissingDAEntryError, _super);
	function MissingDAEntryError(fieldName) {
		var _this = this;
		var msg = "No /DA (default appearance) entry found for field: " + fieldName;
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return MissingDAEntryError;
}(Error);
var MissingTfOperatorError = function(_super) {
	__extends(MissingTfOperatorError, _super);
	function MissingTfOperatorError(fieldName) {
		var _this = this;
		var msg = "No Tf operator found for DA of field: " + fieldName;
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return MissingTfOperatorError;
}(Error);
var NumberParsingError = function(_super) {
	__extends(NumberParsingError, _super);
	function NumberParsingError(pos, value) {
		var _this = this;
		var msg = "Failed to parse number " + ("(line:" + pos.line + " col:" + pos.column + " offset=" + pos.offset + "): \"" + value + "\"");
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return NumberParsingError;
}(Error);
var PDFParsingError = function(_super) {
	__extends(PDFParsingError, _super);
	function PDFParsingError(pos, details) {
		var _this = this;
		var msg = "Failed to parse PDF document " + ("(line:" + pos.line + " col:" + pos.column + " offset=" + pos.offset + "): " + details);
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return PDFParsingError;
}(Error);
var NextByteAssertionError = function(_super) {
	__extends(NextByteAssertionError, _super);
	function NextByteAssertionError(pos, expectedByte, actualByte) {
		var _this = this;
		var msg = "Expected next byte to be " + expectedByte + " but it was actually " + actualByte;
		_this = _super.call(this, pos, msg) || this;
		return _this;
	}
	return NextByteAssertionError;
}(PDFParsingError);
var PDFObjectParsingError = function(_super) {
	__extends(PDFObjectParsingError, _super);
	function PDFObjectParsingError(pos, byte) {
		var _this = this;
		var msg = "Failed to parse PDF object starting with the following byte: " + byte;
		_this = _super.call(this, pos, msg) || this;
		return _this;
	}
	return PDFObjectParsingError;
}(PDFParsingError);
var PDFInvalidObjectParsingError = function(_super) {
	__extends(PDFInvalidObjectParsingError, _super);
	function PDFInvalidObjectParsingError(pos) {
		var _this = this;
		_this = _super.call(this, pos, "Failed to parse invalid PDF object") || this;
		return _this;
	}
	return PDFInvalidObjectParsingError;
}(PDFParsingError);
var PDFStreamParsingError = function(_super) {
	__extends(PDFStreamParsingError, _super);
	function PDFStreamParsingError(pos) {
		var _this = this;
		_this = _super.call(this, pos, "Failed to parse PDF stream") || this;
		return _this;
	}
	return PDFStreamParsingError;
}(PDFParsingError);
var UnbalancedParenthesisError = function(_super) {
	__extends(UnbalancedParenthesisError, _super);
	function UnbalancedParenthesisError(pos) {
		var _this = this;
		_this = _super.call(this, pos, "Failed to parse PDF literal string due to unbalanced parenthesis") || this;
		return _this;
	}
	return UnbalancedParenthesisError;
}(PDFParsingError);
var StalledParserError = function(_super) {
	__extends(StalledParserError, _super);
	function StalledParserError(pos) {
		var _this = this;
		_this = _super.call(this, pos, "Parser stalled") || this;
		return _this;
	}
	return StalledParserError;
}(PDFParsingError);
var MissingPDFHeaderError = function(_super) {
	__extends(MissingPDFHeaderError, _super);
	function MissingPDFHeaderError(pos) {
		var _this = this;
		_this = _super.call(this, pos, "No PDF header found") || this;
		return _this;
	}
	return MissingPDFHeaderError;
}(PDFParsingError);
var MissingKeywordError = function(_super) {
	__extends(MissingKeywordError, _super);
	function MissingKeywordError(pos, keyword) {
		var _this = this;
		var msg = "Did not find expected keyword '" + arrayAsString(keyword) + "'";
		_this = _super.call(this, pos, msg) || this;
		return _this;
	}
	return MissingKeywordError;
}(PDFParsingError);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/syntax/CharCodes.js
var CharCodes;
(function(CharCodes) {
	CharCodes[CharCodes["Null"] = 0] = "Null";
	CharCodes[CharCodes["Backspace"] = 8] = "Backspace";
	CharCodes[CharCodes["Tab"] = 9] = "Tab";
	CharCodes[CharCodes["Newline"] = 10] = "Newline";
	CharCodes[CharCodes["FormFeed"] = 12] = "FormFeed";
	CharCodes[CharCodes["CarriageReturn"] = 13] = "CarriageReturn";
	CharCodes[CharCodes["Space"] = 32] = "Space";
	CharCodes[CharCodes["ExclamationPoint"] = 33] = "ExclamationPoint";
	CharCodes[CharCodes["Hash"] = 35] = "Hash";
	CharCodes[CharCodes["Percent"] = 37] = "Percent";
	CharCodes[CharCodes["LeftParen"] = 40] = "LeftParen";
	CharCodes[CharCodes["RightParen"] = 41] = "RightParen";
	CharCodes[CharCodes["Plus"] = 43] = "Plus";
	CharCodes[CharCodes["Minus"] = 45] = "Minus";
	CharCodes[CharCodes["Dash"] = 45] = "Dash";
	CharCodes[CharCodes["Period"] = 46] = "Period";
	CharCodes[CharCodes["ForwardSlash"] = 47] = "ForwardSlash";
	CharCodes[CharCodes["Zero"] = 48] = "Zero";
	CharCodes[CharCodes["One"] = 49] = "One";
	CharCodes[CharCodes["Two"] = 50] = "Two";
	CharCodes[CharCodes["Three"] = 51] = "Three";
	CharCodes[CharCodes["Four"] = 52] = "Four";
	CharCodes[CharCodes["Five"] = 53] = "Five";
	CharCodes[CharCodes["Six"] = 54] = "Six";
	CharCodes[CharCodes["Seven"] = 55] = "Seven";
	CharCodes[CharCodes["Eight"] = 56] = "Eight";
	CharCodes[CharCodes["Nine"] = 57] = "Nine";
	CharCodes[CharCodes["LessThan"] = 60] = "LessThan";
	CharCodes[CharCodes["GreaterThan"] = 62] = "GreaterThan";
	CharCodes[CharCodes["A"] = 65] = "A";
	CharCodes[CharCodes["D"] = 68] = "D";
	CharCodes[CharCodes["E"] = 69] = "E";
	CharCodes[CharCodes["F"] = 70] = "F";
	CharCodes[CharCodes["O"] = 79] = "O";
	CharCodes[CharCodes["P"] = 80] = "P";
	CharCodes[CharCodes["R"] = 82] = "R";
	CharCodes[CharCodes["LeftSquareBracket"] = 91] = "LeftSquareBracket";
	CharCodes[CharCodes["BackSlash"] = 92] = "BackSlash";
	CharCodes[CharCodes["RightSquareBracket"] = 93] = "RightSquareBracket";
	CharCodes[CharCodes["a"] = 97] = "a";
	CharCodes[CharCodes["b"] = 98] = "b";
	CharCodes[CharCodes["d"] = 100] = "d";
	CharCodes[CharCodes["e"] = 101] = "e";
	CharCodes[CharCodes["f"] = 102] = "f";
	CharCodes[CharCodes["i"] = 105] = "i";
	CharCodes[CharCodes["j"] = 106] = "j";
	CharCodes[CharCodes["l"] = 108] = "l";
	CharCodes[CharCodes["m"] = 109] = "m";
	CharCodes[CharCodes["n"] = 110] = "n";
	CharCodes[CharCodes["o"] = 111] = "o";
	CharCodes[CharCodes["r"] = 114] = "r";
	CharCodes[CharCodes["s"] = 115] = "s";
	CharCodes[CharCodes["t"] = 116] = "t";
	CharCodes[CharCodes["u"] = 117] = "u";
	CharCodes[CharCodes["x"] = 120] = "x";
	CharCodes[CharCodes["LeftCurly"] = 123] = "LeftCurly";
	CharCodes[CharCodes["RightCurly"] = 125] = "RightCurly";
	CharCodes[CharCodes["Tilde"] = 126] = "Tilde";
})(CharCodes || (CharCodes = {}));
var CharCodes_default = CharCodes;
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/document/PDFHeader.js
var PDFHeader = function() {
	function PDFHeader(major, minor) {
		this.major = String(major);
		this.minor = String(minor);
	}
	PDFHeader.prototype.toString = function() {
		var bc = charFromCode(129);
		return "%PDF-" + this.major + "." + this.minor + "\n%" + bc + bc + bc + bc;
	};
	PDFHeader.prototype.sizeInBytes = function() {
		return 12 + this.major.length + this.minor.length;
	};
	PDFHeader.prototype.copyBytesInto = function(buffer, offset) {
		var initialOffset = offset;
		buffer[offset++] = CharCodes_default.Percent;
		buffer[offset++] = CharCodes_default.P;
		buffer[offset++] = CharCodes_default.D;
		buffer[offset++] = CharCodes_default.F;
		buffer[offset++] = CharCodes_default.Dash;
		offset += copyStringIntoBuffer(this.major, buffer, offset);
		buffer[offset++] = CharCodes_default.Period;
		offset += copyStringIntoBuffer(this.minor, buffer, offset);
		buffer[offset++] = CharCodes_default.Newline;
		buffer[offset++] = CharCodes_default.Percent;
		buffer[offset++] = 129;
		buffer[offset++] = 129;
		buffer[offset++] = 129;
		buffer[offset++] = 129;
		return offset - initialOffset;
	};
	PDFHeader.forVersion = function(major, minor) {
		return new PDFHeader(major, minor);
	};
	return PDFHeader;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFObject.js
var PDFObject = function() {
	function PDFObject() {}
	PDFObject.prototype.clone = function(_context) {
		throw new MethodNotImplementedError(this.constructor.name, "clone");
	};
	PDFObject.prototype.toString = function() {
		throw new MethodNotImplementedError(this.constructor.name, "toString");
	};
	PDFObject.prototype.sizeInBytes = function() {
		throw new MethodNotImplementedError(this.constructor.name, "sizeInBytes");
	};
	PDFObject.prototype.copyBytesInto = function(_buffer, _offset) {
		throw new MethodNotImplementedError(this.constructor.name, "copyBytesInto");
	};
	return PDFObject;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFNumber.js
var PDFNumber = function(_super) {
	__extends(PDFNumber, _super);
	function PDFNumber(value) {
		var _this = _super.call(this) || this;
		_this.numberValue = value;
		_this.stringValue = numberToString(value);
		return _this;
	}
	PDFNumber.prototype.asNumber = function() {
		return this.numberValue;
	};
	/** @deprecated in favor of [[PDFNumber.asNumber]] */
	PDFNumber.prototype.value = function() {
		return this.numberValue;
	};
	PDFNumber.prototype.clone = function() {
		return PDFNumber.of(this.numberValue);
	};
	PDFNumber.prototype.toString = function() {
		return this.stringValue;
	};
	PDFNumber.prototype.sizeInBytes = function() {
		return this.stringValue.length;
	};
	PDFNumber.prototype.copyBytesInto = function(buffer, offset) {
		offset += copyStringIntoBuffer(this.stringValue, buffer, offset);
		return this.stringValue.length;
	};
	PDFNumber.of = function(value) {
		return new PDFNumber(value);
	};
	return PDFNumber;
}(PDFObject);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFArray.js
var PDFArray = function(_super) {
	__extends(PDFArray, _super);
	function PDFArray(context) {
		var _this = _super.call(this) || this;
		_this.array = [];
		_this.context = context;
		return _this;
	}
	PDFArray.prototype.size = function() {
		return this.array.length;
	};
	PDFArray.prototype.push = function(object) {
		this.array.push(object);
	};
	PDFArray.prototype.insert = function(index, object) {
		this.array.splice(index, 0, object);
	};
	PDFArray.prototype.indexOf = function(object) {
		var index = this.array.indexOf(object);
		return index === -1 ? void 0 : index;
	};
	PDFArray.prototype.remove = function(index) {
		this.array.splice(index, 1);
	};
	PDFArray.prototype.set = function(idx, object) {
		this.array[idx] = object;
	};
	PDFArray.prototype.get = function(index) {
		return this.array[index];
	};
	PDFArray.prototype.lookupMaybe = function(index) {
		var _a;
		var types = [];
		for (var _i = 1; _i < arguments.length; _i++) types[_i - 1] = arguments[_i];
		return (_a = this.context).lookupMaybe.apply(_a, __spreadArrays([this.get(index)], types));
	};
	PDFArray.prototype.lookup = function(index) {
		var _a;
		var types = [];
		for (var _i = 1; _i < arguments.length; _i++) types[_i - 1] = arguments[_i];
		return (_a = this.context).lookup.apply(_a, __spreadArrays([this.get(index)], types));
	};
	PDFArray.prototype.asRectangle = function() {
		if (this.size() !== 4) throw new PDFArrayIsNotRectangleError(this.size());
		var lowerLeftX = this.lookup(0, PDFNumber).asNumber();
		var lowerLeftY = this.lookup(1, PDFNumber).asNumber();
		var upperRightX = this.lookup(2, PDFNumber).asNumber();
		var upperRightY = this.lookup(3, PDFNumber).asNumber();
		return {
			x: lowerLeftX,
			y: lowerLeftY,
			width: upperRightX - lowerLeftX,
			height: upperRightY - lowerLeftY
		};
	};
	PDFArray.prototype.asArray = function() {
		return this.array.slice();
	};
	PDFArray.prototype.clone = function(context) {
		var clone = PDFArray.withContext(context || this.context);
		for (var idx = 0, len = this.size(); idx < len; idx++) clone.push(this.array[idx]);
		return clone;
	};
	PDFArray.prototype.toString = function() {
		var arrayString = "[ ";
		for (var idx = 0, len = this.size(); idx < len; idx++) {
			arrayString += this.get(idx).toString();
			arrayString += " ";
		}
		arrayString += "]";
		return arrayString;
	};
	PDFArray.prototype.sizeInBytes = function() {
		var size = 3;
		for (var idx = 0, len = this.size(); idx < len; idx++) size += this.get(idx).sizeInBytes() + 1;
		return size;
	};
	PDFArray.prototype.copyBytesInto = function(buffer, offset) {
		var initialOffset = offset;
		buffer[offset++] = CharCodes_default.LeftSquareBracket;
		buffer[offset++] = CharCodes_default.Space;
		for (var idx = 0, len = this.size(); idx < len; idx++) {
			offset += this.get(idx).copyBytesInto(buffer, offset);
			buffer[offset++] = CharCodes_default.Space;
		}
		buffer[offset++] = CharCodes_default.RightSquareBracket;
		return offset - initialOffset;
	};
	PDFArray.prototype.scalePDFNumbers = function(x, y) {
		for (var idx = 0, len = this.size(); idx < len; idx++) {
			var el = this.lookup(idx);
			if (el instanceof PDFNumber) {
				var factor = idx % 2 === 0 ? x : y;
				this.set(idx, PDFNumber.of(el.asNumber() * factor));
			}
		}
	};
	PDFArray.withContext = function(context) {
		return new PDFArray(context);
	};
	return PDFArray;
}(PDFObject);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFBool.js
var ENFORCER$2 = {};
var PDFBool = function(_super) {
	__extends(PDFBool, _super);
	function PDFBool(enforcer, value) {
		var _this = this;
		if (enforcer !== ENFORCER$2) throw new PrivateConstructorError("PDFBool");
		_this = _super.call(this) || this;
		_this.value = value;
		return _this;
	}
	PDFBool.prototype.asBoolean = function() {
		return this.value;
	};
	PDFBool.prototype.clone = function() {
		return this;
	};
	PDFBool.prototype.toString = function() {
		return String(this.value);
	};
	PDFBool.prototype.sizeInBytes = function() {
		return this.value ? 4 : 5;
	};
	PDFBool.prototype.copyBytesInto = function(buffer, offset) {
		if (this.value) {
			buffer[offset++] = CharCodes_default.t;
			buffer[offset++] = CharCodes_default.r;
			buffer[offset++] = CharCodes_default.u;
			buffer[offset++] = CharCodes_default.e;
			return 4;
		} else {
			buffer[offset++] = CharCodes_default.f;
			buffer[offset++] = CharCodes_default.a;
			buffer[offset++] = CharCodes_default.l;
			buffer[offset++] = CharCodes_default.s;
			buffer[offset++] = CharCodes_default.e;
			return 5;
		}
	};
	PDFBool.True = new PDFBool(ENFORCER$2, true);
	PDFBool.False = new PDFBool(ENFORCER$2, false);
	return PDFBool;
}(PDFObject);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/syntax/Delimiters.js
var IsDelimiter = /* @__PURE__ */ new Uint8Array(256);
IsDelimiter[CharCodes_default.LeftParen] = 1;
IsDelimiter[CharCodes_default.RightParen] = 1;
IsDelimiter[CharCodes_default.LessThan] = 1;
IsDelimiter[CharCodes_default.GreaterThan] = 1;
IsDelimiter[CharCodes_default.LeftSquareBracket] = 1;
IsDelimiter[CharCodes_default.RightSquareBracket] = 1;
IsDelimiter[CharCodes_default.LeftCurly] = 1;
IsDelimiter[CharCodes_default.RightCurly] = 1;
IsDelimiter[CharCodes_default.ForwardSlash] = 1;
IsDelimiter[CharCodes_default.Percent] = 1;
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/syntax/Whitespace.js
var IsWhitespace = /* @__PURE__ */ new Uint8Array(256);
IsWhitespace[CharCodes_default.Null] = 1;
IsWhitespace[CharCodes_default.Tab] = 1;
IsWhitespace[CharCodes_default.Newline] = 1;
IsWhitespace[CharCodes_default.FormFeed] = 1;
IsWhitespace[CharCodes_default.CarriageReturn] = 1;
IsWhitespace[CharCodes_default.Space] = 1;
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/syntax/Irregular.js
var IsIrregular = /* @__PURE__ */ new Uint8Array(256);
for (var idx$1 = 0, len$1 = 256; idx$1 < len$1; idx$1++) IsIrregular[idx$1] = IsWhitespace[idx$1] || IsDelimiter[idx$1] ? 1 : 0;
IsIrregular[CharCodes_default.Hash] = 1;
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFName.js
var decodeName = function(name) {
	return name.replace(/#([\dABCDEF]{2})/g, function(_, hex) {
		return charFromHexCode(hex);
	});
};
var isRegularChar = function(charCode) {
	return charCode >= CharCodes_default.ExclamationPoint && charCode <= CharCodes_default.Tilde && !IsIrregular[charCode];
};
var ENFORCER$1 = {};
var pool$1 = /* @__PURE__ */ new Map();
var PDFName = function(_super) {
	__extends(PDFName, _super);
	function PDFName(enforcer, name) {
		var _this = this;
		if (enforcer !== ENFORCER$1) throw new PrivateConstructorError("PDFName");
		_this = _super.call(this) || this;
		var encodedName = "/";
		for (var idx = 0, len = name.length; idx < len; idx++) {
			var character = name[idx];
			var code = toCharCode(character);
			encodedName += isRegularChar(code) ? character : "#" + toHexString(code);
		}
		_this.encodedName = encodedName;
		return _this;
	}
	PDFName.prototype.asBytes = function() {
		var bytes = [];
		var hex = "";
		var escaped = false;
		var pushByte = function(byte) {
			if (byte !== void 0) bytes.push(byte);
			escaped = false;
		};
		for (var idx = 1, len = this.encodedName.length; idx < len; idx++) {
			var char = this.encodedName[idx];
			var byte = toCharCode(char);
			var nextChar = this.encodedName[idx + 1];
			if (!escaped) if (byte === CharCodes_default.Hash) escaped = true;
			else pushByte(byte);
			else if (byte >= CharCodes_default.Zero && byte <= CharCodes_default.Nine || byte >= CharCodes_default.a && byte <= CharCodes_default.f || byte >= CharCodes_default.A && byte <= CharCodes_default.F) {
				hex += char;
				if (hex.length === 2 || !(nextChar >= "0" && nextChar <= "9" || nextChar >= "a" && nextChar <= "f" || nextChar >= "A" && nextChar <= "F")) {
					pushByte(parseInt(hex, 16));
					hex = "";
				}
			} else pushByte(byte);
		}
		return new Uint8Array(bytes);
	};
	PDFName.prototype.decodeText = function() {
		var bytes = this.asBytes();
		return String.fromCharCode.apply(String, Array.from(bytes));
	};
	PDFName.prototype.asString = function() {
		return this.encodedName;
	};
	/** @deprecated in favor of [[PDFName.asString]] */
	PDFName.prototype.value = function() {
		return this.encodedName;
	};
	PDFName.prototype.clone = function() {
		return this;
	};
	PDFName.prototype.toString = function() {
		return this.encodedName;
	};
	PDFName.prototype.sizeInBytes = function() {
		return this.encodedName.length;
	};
	PDFName.prototype.copyBytesInto = function(buffer, offset) {
		offset += copyStringIntoBuffer(this.encodedName, buffer, offset);
		return this.encodedName.length;
	};
	PDFName.of = function(name) {
		var decodedValue = decodeName(name);
		var instance = pool$1.get(decodedValue);
		if (!instance) {
			instance = new PDFName(ENFORCER$1, decodedValue);
			pool$1.set(decodedValue, instance);
		}
		return instance;
	};
	PDFName.Length = PDFName.of("Length");
	PDFName.FlateDecode = PDFName.of("FlateDecode");
	PDFName.Resources = PDFName.of("Resources");
	PDFName.Font = PDFName.of("Font");
	PDFName.XObject = PDFName.of("XObject");
	PDFName.ExtGState = PDFName.of("ExtGState");
	PDFName.Contents = PDFName.of("Contents");
	PDFName.Type = PDFName.of("Type");
	PDFName.Parent = PDFName.of("Parent");
	PDFName.MediaBox = PDFName.of("MediaBox");
	PDFName.Page = PDFName.of("Page");
	PDFName.Annots = PDFName.of("Annots");
	PDFName.TrimBox = PDFName.of("TrimBox");
	PDFName.ArtBox = PDFName.of("ArtBox");
	PDFName.BleedBox = PDFName.of("BleedBox");
	PDFName.CropBox = PDFName.of("CropBox");
	PDFName.Rotate = PDFName.of("Rotate");
	PDFName.Title = PDFName.of("Title");
	PDFName.Author = PDFName.of("Author");
	PDFName.Subject = PDFName.of("Subject");
	PDFName.Creator = PDFName.of("Creator");
	PDFName.Keywords = PDFName.of("Keywords");
	PDFName.Producer = PDFName.of("Producer");
	PDFName.CreationDate = PDFName.of("CreationDate");
	PDFName.ModDate = PDFName.of("ModDate");
	return PDFName;
}(PDFObject);
var PDFNull_default = new (function(_super) {
	__extends(PDFNull, _super);
	function PDFNull() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFNull.prototype.asNull = function() {
		return null;
	};
	PDFNull.prototype.clone = function() {
		return this;
	};
	PDFNull.prototype.toString = function() {
		return "null";
	};
	PDFNull.prototype.sizeInBytes = function() {
		return 4;
	};
	PDFNull.prototype.copyBytesInto = function(buffer, offset) {
		buffer[offset++] = CharCodes_default.n;
		buffer[offset++] = CharCodes_default.u;
		buffer[offset++] = CharCodes_default.l;
		buffer[offset++] = CharCodes_default.l;
		return 4;
	};
	return PDFNull;
}(PDFObject))();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFDict.js
var PDFDict = function(_super) {
	__extends(PDFDict, _super);
	function PDFDict(map, context) {
		var _this = _super.call(this) || this;
		_this.dict = map;
		_this.context = context;
		return _this;
	}
	PDFDict.prototype.keys = function() {
		return Array.from(this.dict.keys());
	};
	PDFDict.prototype.values = function() {
		return Array.from(this.dict.values());
	};
	PDFDict.prototype.entries = function() {
		return Array.from(this.dict.entries());
	};
	PDFDict.prototype.set = function(key, value) {
		this.dict.set(key, value);
	};
	PDFDict.prototype.get = function(key, preservePDFNull) {
		if (preservePDFNull === void 0) preservePDFNull = false;
		var value = this.dict.get(key);
		if (value === PDFNull_default && !preservePDFNull) return void 0;
		return value;
	};
	PDFDict.prototype.has = function(key) {
		var value = this.dict.get(key);
		return value !== void 0 && value !== PDFNull_default;
	};
	PDFDict.prototype.lookupMaybe = function(key) {
		var _a;
		var types = [];
		for (var _i = 1; _i < arguments.length; _i++) types[_i - 1] = arguments[_i];
		var preservePDFNull = types.includes(PDFNull_default);
		var value = (_a = this.context).lookupMaybe.apply(_a, __spreadArrays([this.get(key, preservePDFNull)], types));
		if (value === PDFNull_default && !preservePDFNull) return void 0;
		return value;
	};
	PDFDict.prototype.lookup = function(key) {
		var _a;
		var types = [];
		for (var _i = 1; _i < arguments.length; _i++) types[_i - 1] = arguments[_i];
		var preservePDFNull = types.includes(PDFNull_default);
		var value = (_a = this.context).lookup.apply(_a, __spreadArrays([this.get(key, preservePDFNull)], types));
		if (value === PDFNull_default && !preservePDFNull) return void 0;
		return value;
	};
	PDFDict.prototype.delete = function(key) {
		return this.dict.delete(key);
	};
	PDFDict.prototype.asMap = function() {
		return new Map(this.dict);
	};
	/** Generate a random key that doesn't exist in current key set */
	PDFDict.prototype.uniqueKey = function(tag) {
		if (tag === void 0) tag = "";
		var existingKeys = this.keys();
		var key = PDFName.of(this.context.addRandomSuffix(tag, 10));
		while (existingKeys.includes(key)) key = PDFName.of(this.context.addRandomSuffix(tag, 10));
		return key;
	};
	PDFDict.prototype.clone = function(context) {
		var clone = PDFDict.withContext(context || this.context);
		var entries = this.entries();
		for (var idx = 0, len = entries.length; idx < len; idx++) {
			var _a = entries[idx], key = _a[0], value = _a[1];
			clone.set(key, value);
		}
		return clone;
	};
	PDFDict.prototype.toString = function() {
		var dictString = "<<\n";
		var entries = this.entries();
		for (var idx = 0, len = entries.length; idx < len; idx++) {
			var _a = entries[idx], key = _a[0], value = _a[1];
			dictString += key.toString() + " " + value.toString() + "\n";
		}
		dictString += ">>";
		return dictString;
	};
	PDFDict.prototype.sizeInBytes = function() {
		var size = 5;
		var entries = this.entries();
		for (var idx = 0, len = entries.length; idx < len; idx++) {
			var _a = entries[idx], key = _a[0], value = _a[1];
			size += key.sizeInBytes() + value.sizeInBytes() + 2;
		}
		return size;
	};
	PDFDict.prototype.copyBytesInto = function(buffer, offset) {
		var initialOffset = offset;
		buffer[offset++] = CharCodes_default.LessThan;
		buffer[offset++] = CharCodes_default.LessThan;
		buffer[offset++] = CharCodes_default.Newline;
		var entries = this.entries();
		for (var idx = 0, len = entries.length; idx < len; idx++) {
			var _a = entries[idx], key = _a[0], value = _a[1];
			offset += key.copyBytesInto(buffer, offset);
			buffer[offset++] = CharCodes_default.Space;
			offset += value.copyBytesInto(buffer, offset);
			buffer[offset++] = CharCodes_default.Newline;
		}
		buffer[offset++] = CharCodes_default.GreaterThan;
		buffer[offset++] = CharCodes_default.GreaterThan;
		return offset - initialOffset;
	};
	PDFDict.withContext = function(context) {
		return new PDFDict(/* @__PURE__ */ new Map(), context);
	};
	PDFDict.fromMapWithContext = function(map, context) {
		return new PDFDict(map, context);
	};
	return PDFDict;
}(PDFObject);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFStream.js
var PDFStream = function(_super) {
	__extends(PDFStream, _super);
	function PDFStream(dict) {
		var _this = _super.call(this) || this;
		_this.dict = dict;
		return _this;
	}
	PDFStream.prototype.clone = function(_context) {
		throw new MethodNotImplementedError(this.constructor.name, "clone");
	};
	PDFStream.prototype.getContentsString = function() {
		throw new MethodNotImplementedError(this.constructor.name, "getContentsString");
	};
	PDFStream.prototype.getContents = function() {
		throw new MethodNotImplementedError(this.constructor.name, "getContents");
	};
	PDFStream.prototype.getContentsSize = function() {
		throw new MethodNotImplementedError(this.constructor.name, "getContentsSize");
	};
	PDFStream.prototype.updateDict = function() {
		var contentsSize = this.getContentsSize();
		this.dict.set(PDFName.Length, PDFNumber.of(contentsSize));
	};
	PDFStream.prototype.sizeInBytes = function() {
		this.updateDict();
		return this.dict.sizeInBytes() + this.getContentsSize() + 18;
	};
	PDFStream.prototype.toString = function() {
		this.updateDict();
		var streamString = this.dict.toString();
		streamString += "\nstream\n";
		streamString += this.getContentsString();
		streamString += "\nendstream";
		return streamString;
	};
	PDFStream.prototype.copyBytesInto = function(buffer, offset) {
		this.updateDict();
		var initialOffset = offset;
		offset += this.dict.copyBytesInto(buffer, offset);
		buffer[offset++] = CharCodes_default.Newline;
		buffer[offset++] = CharCodes_default.s;
		buffer[offset++] = CharCodes_default.t;
		buffer[offset++] = CharCodes_default.r;
		buffer[offset++] = CharCodes_default.e;
		buffer[offset++] = CharCodes_default.a;
		buffer[offset++] = CharCodes_default.m;
		buffer[offset++] = CharCodes_default.Newline;
		var contents = this.getContents();
		for (var idx = 0, len = contents.length; idx < len; idx++) buffer[offset++] = contents[idx];
		buffer[offset++] = CharCodes_default.Newline;
		buffer[offset++] = CharCodes_default.e;
		buffer[offset++] = CharCodes_default.n;
		buffer[offset++] = CharCodes_default.d;
		buffer[offset++] = CharCodes_default.s;
		buffer[offset++] = CharCodes_default.t;
		buffer[offset++] = CharCodes_default.r;
		buffer[offset++] = CharCodes_default.e;
		buffer[offset++] = CharCodes_default.a;
		buffer[offset++] = CharCodes_default.m;
		return offset - initialOffset;
	};
	return PDFStream;
}(PDFObject);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFRawStream.js
var PDFRawStream = function(_super) {
	__extends(PDFRawStream, _super);
	function PDFRawStream(dict, contents) {
		var _this = _super.call(this, dict) || this;
		_this.contents = contents;
		return _this;
	}
	PDFRawStream.prototype.asUint8Array = function() {
		return this.contents.slice();
	};
	PDFRawStream.prototype.clone = function(context) {
		return PDFRawStream.of(this.dict.clone(context), this.contents.slice());
	};
	PDFRawStream.prototype.getContentsString = function() {
		return arrayAsString(this.contents);
	};
	PDFRawStream.prototype.getContents = function() {
		return this.contents;
	};
	PDFRawStream.prototype.getContentsSize = function() {
		return this.contents.length;
	};
	PDFRawStream.of = function(dict, contents) {
		return new PDFRawStream(dict, contents);
	};
	return PDFRawStream;
}(PDFStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFRef.js
var ENFORCER = {};
var pool = /* @__PURE__ */ new Map();
var PDFRef = function(_super) {
	__extends(PDFRef, _super);
	function PDFRef(enforcer, objectNumber, generationNumber) {
		var _this = this;
		if (enforcer !== ENFORCER) throw new PrivateConstructorError("PDFRef");
		_this = _super.call(this) || this;
		_this.objectNumber = objectNumber;
		_this.generationNumber = generationNumber;
		_this.tag = objectNumber + " " + generationNumber + " R";
		return _this;
	}
	PDFRef.prototype.clone = function() {
		return this;
	};
	PDFRef.prototype.toString = function() {
		return this.tag;
	};
	PDFRef.prototype.sizeInBytes = function() {
		return this.tag.length;
	};
	PDFRef.prototype.copyBytesInto = function(buffer, offset) {
		offset += copyStringIntoBuffer(this.tag, buffer, offset);
		return this.tag.length;
	};
	PDFRef.of = function(objectNumber, generationNumber) {
		if (generationNumber === void 0) generationNumber = 0;
		var tag = objectNumber + " " + generationNumber + " R";
		var instance = pool.get(tag);
		if (!instance) {
			instance = new PDFRef(ENFORCER, objectNumber, generationNumber);
			pool.set(tag, instance);
		}
		return instance;
	};
	return PDFRef;
}(PDFObject);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/operators/PDFOperator.js
var PDFOperator = function() {
	function PDFOperator(name, args) {
		this.name = name;
		this.args = args || [];
	}
	PDFOperator.prototype.clone = function(context) {
		var args = new Array(this.args.length);
		for (var idx = 0, len = args.length; idx < len; idx++) {
			var arg = this.args[idx];
			args[idx] = arg instanceof PDFObject ? arg.clone(context) : arg;
		}
		return PDFOperator.of(this.name, args);
	};
	PDFOperator.prototype.toString = function() {
		var value = "";
		for (var idx = 0, len = this.args.length; idx < len; idx++) value += String(this.args[idx]) + " ";
		value += this.name;
		return value;
	};
	PDFOperator.prototype.sizeInBytes = function() {
		var size = 0;
		for (var idx = 0, len = this.args.length; idx < len; idx++) {
			var arg = this.args[idx];
			size += (arg instanceof PDFObject ? arg.sizeInBytes() : arg.length) + 1;
		}
		size += this.name.length;
		return size;
	};
	PDFOperator.prototype.copyBytesInto = function(buffer, offset) {
		var initialOffset = offset;
		for (var idx = 0, len = this.args.length; idx < len; idx++) {
			var arg = this.args[idx];
			if (arg instanceof PDFObject) offset += arg.copyBytesInto(buffer, offset);
			else offset += copyStringIntoBuffer(arg, buffer, offset);
			buffer[offset++] = CharCodes_default.Space;
		}
		offset += copyStringIntoBuffer(this.name, buffer, offset);
		return offset - initialOffset;
	};
	PDFOperator.of = function(name, args) {
		return new PDFOperator(name, args);
	};
	return PDFOperator;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/operators/PDFOperatorNames.js
var PDFOperatorNames;
(function(PDFOperatorNames) {
	PDFOperatorNames["NonStrokingColor"] = "sc";
	PDFOperatorNames["NonStrokingColorN"] = "scn";
	PDFOperatorNames["NonStrokingColorRgb"] = "rg";
	PDFOperatorNames["NonStrokingColorGray"] = "g";
	PDFOperatorNames["NonStrokingColorCmyk"] = "k";
	PDFOperatorNames["NonStrokingColorspace"] = "cs";
	PDFOperatorNames["StrokingColor"] = "SC";
	PDFOperatorNames["StrokingColorN"] = "SCN";
	PDFOperatorNames["StrokingColorRgb"] = "RG";
	PDFOperatorNames["StrokingColorGray"] = "G";
	PDFOperatorNames["StrokingColorCmyk"] = "K";
	PDFOperatorNames["StrokingColorspace"] = "CS";
	PDFOperatorNames["BeginMarkedContentSequence"] = "BDC";
	PDFOperatorNames["BeginMarkedContent"] = "BMC";
	PDFOperatorNames["EndMarkedContent"] = "EMC";
	PDFOperatorNames["MarkedContentPointWithProps"] = "DP";
	PDFOperatorNames["MarkedContentPoint"] = "MP";
	PDFOperatorNames["DrawObject"] = "Do";
	PDFOperatorNames["ConcatTransformationMatrix"] = "cm";
	PDFOperatorNames["PopGraphicsState"] = "Q";
	PDFOperatorNames["PushGraphicsState"] = "q";
	PDFOperatorNames["SetFlatness"] = "i";
	PDFOperatorNames["SetGraphicsStateParams"] = "gs";
	PDFOperatorNames["SetLineCapStyle"] = "J";
	PDFOperatorNames["SetLineDashPattern"] = "d";
	PDFOperatorNames["SetLineJoinStyle"] = "j";
	PDFOperatorNames["SetLineMiterLimit"] = "M";
	PDFOperatorNames["SetLineWidth"] = "w";
	PDFOperatorNames["SetTextMatrix"] = "Tm";
	PDFOperatorNames["SetRenderingIntent"] = "ri";
	PDFOperatorNames["AppendRectangle"] = "re";
	PDFOperatorNames["BeginInlineImage"] = "BI";
	PDFOperatorNames["BeginInlineImageData"] = "ID";
	PDFOperatorNames["EndInlineImage"] = "EI";
	PDFOperatorNames["ClipEvenOdd"] = "W*";
	PDFOperatorNames["ClipNonZero"] = "W";
	PDFOperatorNames["CloseAndStroke"] = "s";
	PDFOperatorNames["CloseFillEvenOddAndStroke"] = "b*";
	PDFOperatorNames["CloseFillNonZeroAndStroke"] = "b";
	PDFOperatorNames["ClosePath"] = "h";
	PDFOperatorNames["AppendBezierCurve"] = "c";
	PDFOperatorNames["CurveToReplicateFinalPoint"] = "y";
	PDFOperatorNames["CurveToReplicateInitialPoint"] = "v";
	PDFOperatorNames["EndPath"] = "n";
	PDFOperatorNames["FillEvenOddAndStroke"] = "B*";
	PDFOperatorNames["FillEvenOdd"] = "f*";
	PDFOperatorNames["FillNonZeroAndStroke"] = "B";
	PDFOperatorNames["FillNonZero"] = "f";
	PDFOperatorNames["LegacyFillNonZero"] = "F";
	PDFOperatorNames["LineTo"] = "l";
	PDFOperatorNames["MoveTo"] = "m";
	PDFOperatorNames["ShadingFill"] = "sh";
	PDFOperatorNames["StrokePath"] = "S";
	PDFOperatorNames["BeginText"] = "BT";
	PDFOperatorNames["EndText"] = "ET";
	PDFOperatorNames["MoveText"] = "Td";
	PDFOperatorNames["MoveTextSetLeading"] = "TD";
	PDFOperatorNames["NextLine"] = "T*";
	PDFOperatorNames["SetCharacterSpacing"] = "Tc";
	PDFOperatorNames["SetFontAndSize"] = "Tf";
	PDFOperatorNames["SetTextHorizontalScaling"] = "Tz";
	PDFOperatorNames["SetTextLineHeight"] = "TL";
	PDFOperatorNames["SetTextRenderingMode"] = "Tr";
	PDFOperatorNames["SetTextRise"] = "Ts";
	PDFOperatorNames["SetWordSpacing"] = "Tw";
	PDFOperatorNames["ShowText"] = "Tj";
	PDFOperatorNames["ShowTextAdjusted"] = "TJ";
	PDFOperatorNames["ShowTextLine"] = "'";
	PDFOperatorNames["ShowTextLineAndSpace"] = "\"";
	PDFOperatorNames["Type3D0"] = "d0";
	PDFOperatorNames["Type3D1"] = "d1";
	PDFOperatorNames["BeginCompatibilitySection"] = "BX";
	PDFOperatorNames["EndCompatibilitySection"] = "EX";
})(PDFOperatorNames || (PDFOperatorNames = {}));
var PDFOperatorNames_default = PDFOperatorNames;
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/structures/PDFFlateStream.js
var PDFFlateStream = function(_super) {
	__extends(PDFFlateStream, _super);
	function PDFFlateStream(dict, encode) {
		var _this = _super.call(this, dict) || this;
		_this.computeContents = function() {
			var unencodedContents = _this.getUnencodedContents();
			return _this.encode ? import_pako.default.deflate(unencodedContents) : unencodedContents;
		};
		_this.encode = encode;
		if (encode) dict.set(PDFName.of("Filter"), PDFName.of("FlateDecode"));
		_this.contentsCache = Cache.populatedBy(_this.computeContents);
		return _this;
	}
	PDFFlateStream.prototype.getContents = function() {
		return this.contentsCache.access();
	};
	PDFFlateStream.prototype.getContentsSize = function() {
		return this.contentsCache.access().length;
	};
	PDFFlateStream.prototype.getUnencodedContents = function() {
		throw new MethodNotImplementedError(this.constructor.name, "getUnencodedContents");
	};
	return PDFFlateStream;
}(PDFStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/structures/PDFContentStream.js
var PDFContentStream = function(_super) {
	__extends(PDFContentStream, _super);
	function PDFContentStream(dict, operators, encode) {
		if (encode === void 0) encode = true;
		var _this = _super.call(this, dict, encode) || this;
		_this.operators = operators;
		return _this;
	}
	PDFContentStream.prototype.push = function() {
		var _a;
		var operators = [];
		for (var _i = 0; _i < arguments.length; _i++) operators[_i] = arguments[_i];
		(_a = this.operators).push.apply(_a, operators);
	};
	PDFContentStream.prototype.clone = function(context) {
		var operators = new Array(this.operators.length);
		for (var idx = 0, len = this.operators.length; idx < len; idx++) operators[idx] = this.operators[idx].clone(context);
		var _a = this, dict = _a.dict, encode = _a.encode;
		return PDFContentStream.of(dict.clone(context), operators, encode);
	};
	PDFContentStream.prototype.getContentsString = function() {
		var value = "";
		for (var idx = 0, len = this.operators.length; idx < len; idx++) value += this.operators[idx] + "\n";
		return value;
	};
	PDFContentStream.prototype.getUnencodedContents = function() {
		var buffer = new Uint8Array(this.getUnencodedContentsSize());
		var offset = 0;
		for (var idx = 0, len = this.operators.length; idx < len; idx++) {
			offset += this.operators[idx].copyBytesInto(buffer, offset);
			buffer[offset++] = CharCodes_default.Newline;
		}
		return buffer;
	};
	PDFContentStream.prototype.getUnencodedContentsSize = function() {
		var size = 0;
		for (var idx = 0, len = this.operators.length; idx < len; idx++) size += this.operators[idx].sizeInBytes() + 1;
		return size;
	};
	PDFContentStream.of = function(dict, operators, encode) {
		if (encode === void 0) encode = true;
		return new PDFContentStream(dict, operators, encode);
	};
	return PDFContentStream;
}(PDFFlateStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/rng.js
/**
* Generates a pseudo random number. Although it is not cryptographically secure
* and uniformly distributed, it is not a concern for the intended use-case,
* which is to generate distinct numbers.
*
* Credit: https://stackoverflow.com/a/19303725/10254049
*/
var SimpleRNG = function() {
	function SimpleRNG(seed) {
		this.seed = seed;
	}
	SimpleRNG.prototype.nextInt = function() {
		var x = Math.sin(this.seed++) * 1e4;
		return x - Math.floor(x);
	};
	SimpleRNG.withSeed = function(seed) {
		return new SimpleRNG(seed);
	};
	return SimpleRNG;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/PDFContext.js
var byAscendingObjectNumber = function(_a, _b) {
	var a = _a[0];
	var b = _b[0];
	return a.objectNumber - b.objectNumber;
};
var PDFContext = function() {
	function PDFContext() {
		this.largestObjectNumber = 0;
		this.header = PDFHeader.forVersion(1, 7);
		this.trailerInfo = {};
		this.indirectObjects = /* @__PURE__ */ new Map();
		this.rng = SimpleRNG.withSeed(1);
	}
	PDFContext.prototype.assign = function(ref, object) {
		this.indirectObjects.set(ref, object);
		if (ref.objectNumber > this.largestObjectNumber) this.largestObjectNumber = ref.objectNumber;
	};
	PDFContext.prototype.nextRef = function() {
		this.largestObjectNumber += 1;
		return PDFRef.of(this.largestObjectNumber);
	};
	PDFContext.prototype.register = function(object) {
		var ref = this.nextRef();
		this.assign(ref, object);
		return ref;
	};
	PDFContext.prototype.delete = function(ref) {
		return this.indirectObjects.delete(ref);
	};
	PDFContext.prototype.lookupMaybe = function(ref) {
		var types = [];
		for (var _i = 1; _i < arguments.length; _i++) types[_i - 1] = arguments[_i];
		var preservePDFNull = types.includes(PDFNull_default);
		var result = ref instanceof PDFRef ? this.indirectObjects.get(ref) : ref;
		if (!result || result === PDFNull_default && !preservePDFNull) return void 0;
		for (var idx = 0, len = types.length; idx < len; idx++) {
			var type = types[idx];
			if (type === PDFNull_default) {
				if (result === PDFNull_default) return result;
			} else if (result instanceof type) return result;
		}
		throw new UnexpectedObjectTypeError(types, result);
	};
	PDFContext.prototype.lookup = function(ref) {
		var types = [];
		for (var _i = 1; _i < arguments.length; _i++) types[_i - 1] = arguments[_i];
		var result = ref instanceof PDFRef ? this.indirectObjects.get(ref) : ref;
		if (types.length === 0) return result;
		for (var idx = 0, len = types.length; idx < len; idx++) {
			var type = types[idx];
			if (type === PDFNull_default) {
				if (result === PDFNull_default) return result;
			} else if (result instanceof type) return result;
		}
		throw new UnexpectedObjectTypeError(types, result);
	};
	PDFContext.prototype.getObjectRef = function(pdfObject) {
		var entries = Array.from(this.indirectObjects.entries());
		for (var idx = 0, len = entries.length; idx < len; idx++) {
			var _a = entries[idx], ref = _a[0];
			if (_a[1] === pdfObject) return ref;
		}
	};
	PDFContext.prototype.enumerateIndirectObjects = function() {
		return Array.from(this.indirectObjects.entries()).sort(byAscendingObjectNumber);
	};
	PDFContext.prototype.obj = function(literal) {
		if (literal instanceof PDFObject) return literal;
		else if (literal === null || literal === void 0) return PDFNull_default;
		else if (typeof literal === "string") return PDFName.of(literal);
		else if (typeof literal === "number") return PDFNumber.of(literal);
		else if (typeof literal === "boolean") return literal ? PDFBool.True : PDFBool.False;
		else if (Array.isArray(literal)) {
			var array = PDFArray.withContext(this);
			for (var idx = 0, len = literal.length; idx < len; idx++) array.push(this.obj(literal[idx]));
			return array;
		} else {
			var dict = PDFDict.withContext(this);
			var keys = Object.keys(literal);
			for (var idx = 0, len = keys.length; idx < len; idx++) {
				var key = keys[idx];
				var value = literal[key];
				if (value !== void 0) dict.set(PDFName.of(key), this.obj(value));
			}
			return dict;
		}
	};
	PDFContext.prototype.stream = function(contents, dict) {
		if (dict === void 0) dict = {};
		return PDFRawStream.of(this.obj(dict), typedArrayFor(contents));
	};
	PDFContext.prototype.flateStream = function(contents, dict) {
		if (dict === void 0) dict = {};
		return this.stream(import_pako.default.deflate(typedArrayFor(contents)), __assign(__assign({}, dict), { Filter: "FlateDecode" }));
	};
	PDFContext.prototype.contentStream = function(operators, dict) {
		if (dict === void 0) dict = {};
		return PDFContentStream.of(this.obj(dict), operators);
	};
	PDFContext.prototype.formXObject = function(operators, dict) {
		if (dict === void 0) dict = {};
		return this.contentStream(operators, __assign(__assign({
			BBox: this.obj([
				0,
				0,
				0,
				0
			]),
			Matrix: this.obj([
				1,
				0,
				0,
				1,
				0,
				0
			])
		}, dict), {
			Type: "XObject",
			Subtype: "Form"
		}));
	};
	PDFContext.prototype.getPushGraphicsStateContentStream = function() {
		if (this.pushGraphicsStateContentStreamRef) return this.pushGraphicsStateContentStreamRef;
		var dict = this.obj({});
		var op = PDFOperator.of(PDFOperatorNames_default.PushGraphicsState);
		var stream = PDFContentStream.of(dict, [op]);
		this.pushGraphicsStateContentStreamRef = this.register(stream);
		return this.pushGraphicsStateContentStreamRef;
	};
	PDFContext.prototype.getPopGraphicsStateContentStream = function() {
		if (this.popGraphicsStateContentStreamRef) return this.popGraphicsStateContentStreamRef;
		var dict = this.obj({});
		var op = PDFOperator.of(PDFOperatorNames_default.PopGraphicsState);
		var stream = PDFContentStream.of(dict, [op]);
		this.popGraphicsStateContentStreamRef = this.register(stream);
		return this.popGraphicsStateContentStreamRef;
	};
	PDFContext.prototype.addRandomSuffix = function(prefix, suffixLength) {
		if (suffixLength === void 0) suffixLength = 4;
		return prefix + "-" + Math.floor(this.rng.nextInt() * Math.pow(10, suffixLength));
	};
	PDFContext.create = function() {
		return new PDFContext();
	};
	return PDFContext;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/structures/PDFPageLeaf.js
var PDFPageLeaf = function(_super) {
	__extends(PDFPageLeaf, _super);
	function PDFPageLeaf(map, context, autoNormalizeCTM) {
		if (autoNormalizeCTM === void 0) autoNormalizeCTM = true;
		var _this = _super.call(this, map, context) || this;
		_this.normalized = false;
		_this.autoNormalizeCTM = autoNormalizeCTM;
		return _this;
	}
	PDFPageLeaf.prototype.clone = function(context) {
		var clone = PDFPageLeaf.fromMapWithContext(/* @__PURE__ */ new Map(), context || this.context, this.autoNormalizeCTM);
		var entries = this.entries();
		for (var idx = 0, len = entries.length; idx < len; idx++) {
			var _a = entries[idx], key = _a[0], value = _a[1];
			clone.set(key, value);
		}
		return clone;
	};
	PDFPageLeaf.prototype.Parent = function() {
		return this.lookupMaybe(PDFName.Parent, PDFDict);
	};
	PDFPageLeaf.prototype.Contents = function() {
		return this.lookup(PDFName.of("Contents"));
	};
	PDFPageLeaf.prototype.Annots = function() {
		return this.lookupMaybe(PDFName.Annots, PDFArray);
	};
	PDFPageLeaf.prototype.BleedBox = function() {
		return this.lookupMaybe(PDFName.BleedBox, PDFArray);
	};
	PDFPageLeaf.prototype.TrimBox = function() {
		return this.lookupMaybe(PDFName.TrimBox, PDFArray);
	};
	PDFPageLeaf.prototype.ArtBox = function() {
		return this.lookupMaybe(PDFName.ArtBox, PDFArray);
	};
	PDFPageLeaf.prototype.Resources = function() {
		var dictOrRef = this.getInheritableAttribute(PDFName.Resources);
		return this.context.lookupMaybe(dictOrRef, PDFDict);
	};
	PDFPageLeaf.prototype.MediaBox = function() {
		var arrayOrRef = this.getInheritableAttribute(PDFName.MediaBox);
		return this.context.lookup(arrayOrRef, PDFArray);
	};
	PDFPageLeaf.prototype.CropBox = function() {
		var arrayOrRef = this.getInheritableAttribute(PDFName.CropBox);
		return this.context.lookupMaybe(arrayOrRef, PDFArray);
	};
	PDFPageLeaf.prototype.Rotate = function() {
		var numberOrRef = this.getInheritableAttribute(PDFName.Rotate);
		return this.context.lookupMaybe(numberOrRef, PDFNumber);
	};
	PDFPageLeaf.prototype.getInheritableAttribute = function(name) {
		var attribute;
		this.ascend(function(node) {
			if (!attribute) attribute = node.get(name);
		});
		return attribute;
	};
	PDFPageLeaf.prototype.setParent = function(parentRef) {
		this.set(PDFName.Parent, parentRef);
	};
	PDFPageLeaf.prototype.addContentStream = function(contentStreamRef) {
		var Contents = this.normalizedEntries().Contents || this.context.obj([]);
		this.set(PDFName.Contents, Contents);
		Contents.push(contentStreamRef);
	};
	PDFPageLeaf.prototype.wrapContentStreams = function(startStream, endStream) {
		var Contents = this.Contents();
		if (Contents instanceof PDFArray) {
			Contents.insert(0, startStream);
			Contents.push(endStream);
			return true;
		}
		return false;
	};
	PDFPageLeaf.prototype.addAnnot = function(annotRef) {
		this.normalizedEntries().Annots.push(annotRef);
	};
	PDFPageLeaf.prototype.removeAnnot = function(annotRef) {
		var Annots = this.normalizedEntries().Annots;
		var index = Annots.indexOf(annotRef);
		if (index !== void 0) Annots.remove(index);
	};
	PDFPageLeaf.prototype.setFontDictionary = function(name, fontDictRef) {
		this.normalizedEntries().Font.set(name, fontDictRef);
	};
	PDFPageLeaf.prototype.newFontDictionaryKey = function(tag) {
		return this.normalizedEntries().Font.uniqueKey(tag);
	};
	PDFPageLeaf.prototype.newFontDictionary = function(tag, fontDictRef) {
		var key = this.newFontDictionaryKey(tag);
		this.setFontDictionary(key, fontDictRef);
		return key;
	};
	PDFPageLeaf.prototype.setXObject = function(name, xObjectRef) {
		this.normalizedEntries().XObject.set(name, xObjectRef);
	};
	PDFPageLeaf.prototype.newXObjectKey = function(tag) {
		return this.normalizedEntries().XObject.uniqueKey(tag);
	};
	PDFPageLeaf.prototype.newXObject = function(tag, xObjectRef) {
		var key = this.newXObjectKey(tag);
		this.setXObject(key, xObjectRef);
		return key;
	};
	PDFPageLeaf.prototype.setExtGState = function(name, extGStateRef) {
		this.normalizedEntries().ExtGState.set(name, extGStateRef);
	};
	PDFPageLeaf.prototype.newExtGStateKey = function(tag) {
		return this.normalizedEntries().ExtGState.uniqueKey(tag);
	};
	PDFPageLeaf.prototype.newExtGState = function(tag, extGStateRef) {
		var key = this.newExtGStateKey(tag);
		this.setExtGState(key, extGStateRef);
		return key;
	};
	PDFPageLeaf.prototype.ascend = function(visitor) {
		visitor(this);
		var Parent = this.Parent();
		if (Parent) Parent.ascend(visitor);
	};
	PDFPageLeaf.prototype.normalize = function() {
		if (this.normalized) return;
		var context = this.context;
		var contentsRef = this.get(PDFName.Contents);
		if (this.context.lookup(contentsRef) instanceof PDFStream) this.set(PDFName.Contents, context.obj([contentsRef]));
		if (this.autoNormalizeCTM) this.wrapContentStreams(this.context.getPushGraphicsStateContentStream(), this.context.getPopGraphicsStateContentStream());
		var dictOrRef = this.getInheritableAttribute(PDFName.Resources);
		var Resources = context.lookupMaybe(dictOrRef, PDFDict) || context.obj({});
		this.set(PDFName.Resources, Resources);
		var Font = Resources.lookupMaybe(PDFName.Font, PDFDict) || context.obj({});
		Resources.set(PDFName.Font, Font);
		var XObject = Resources.lookupMaybe(PDFName.XObject, PDFDict) || context.obj({});
		Resources.set(PDFName.XObject, XObject);
		var ExtGState = Resources.lookupMaybe(PDFName.ExtGState, PDFDict) || context.obj({});
		Resources.set(PDFName.ExtGState, ExtGState);
		var Annots = this.Annots() || context.obj([]);
		this.set(PDFName.Annots, Annots);
		this.normalized = true;
	};
	PDFPageLeaf.prototype.normalizedEntries = function() {
		this.normalize();
		var Annots = this.Annots();
		var Resources = this.Resources();
		return {
			Annots,
			Resources,
			Contents: this.Contents(),
			Font: Resources.lookup(PDFName.Font, PDFDict),
			XObject: Resources.lookup(PDFName.XObject, PDFDict),
			ExtGState: Resources.lookup(PDFName.ExtGState, PDFDict)
		};
	};
	PDFPageLeaf.InheritableEntries = [
		"Resources",
		"MediaBox",
		"CropBox",
		"Rotate"
	];
	PDFPageLeaf.withContextAndParent = function(context, parent) {
		var dict = /* @__PURE__ */ new Map();
		dict.set(PDFName.Type, PDFName.Page);
		dict.set(PDFName.Parent, parent);
		dict.set(PDFName.Resources, context.obj({}));
		dict.set(PDFName.MediaBox, context.obj([
			0,
			0,
			612,
			792
		]));
		return new PDFPageLeaf(dict, context, false);
	};
	PDFPageLeaf.fromMapWithContext = function(map, context, autoNormalizeCTM) {
		if (autoNormalizeCTM === void 0) autoNormalizeCTM = true;
		return new PDFPageLeaf(map, context, autoNormalizeCTM);
	};
	return PDFPageLeaf;
}(PDFDict);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/PDFObjectCopier.js
/**
* PDFObjectCopier copies PDFObjects from a src context to a dest context.
* The primary use case for this is to copy pages between PDFs.
*
* _Copying_ an object with a PDFObjectCopier is different from _cloning_ an
* object with its [[PDFObject.clone]] method:
*
* ```
*   const src: PDFContext = ...
*   const dest: PDFContext = ...
*   const originalObject: PDFObject = ...
*   const copiedObject = PDFObjectCopier.for(src, dest).copy(originalObject);
*   const clonedObject = originalObject.clone();
* ```
*
* Copying an object is equivalent to cloning it and then copying over any other
* objects that it references. Note that only dictionaries, arrays, and streams
* (or structures build from them) can contain indirect references to other
* objects. Copying a PDFObject that is not a dictionary, array, or stream is
* supported, but is equivalent to cloning it.
*/
var PDFObjectCopier = function() {
	function PDFObjectCopier(src, dest) {
		var _this = this;
		this.traversedObjects = /* @__PURE__ */ new Map();
		this.copy = function(object) {
			return object instanceof PDFPageLeaf ? _this.copyPDFPage(object) : object instanceof PDFDict ? _this.copyPDFDict(object) : object instanceof PDFArray ? _this.copyPDFArray(object) : object instanceof PDFStream ? _this.copyPDFStream(object) : object instanceof PDFRef ? _this.copyPDFIndirectObject(object) : object.clone();
		};
		this.copyPDFPage = function(originalPage) {
			var clonedPage = originalPage.clone();
			var InheritableEntries = PDFPageLeaf.InheritableEntries;
			for (var idx = 0, len = InheritableEntries.length; idx < len; idx++) {
				var key = PDFName.of(InheritableEntries[idx]);
				var value = clonedPage.getInheritableAttribute(key);
				if (!clonedPage.get(key) && value) clonedPage.set(key, value);
			}
			clonedPage.delete(PDFName.of("Parent"));
			return _this.copyPDFDict(clonedPage);
		};
		this.copyPDFDict = function(originalDict) {
			if (_this.traversedObjects.has(originalDict)) return _this.traversedObjects.get(originalDict);
			var clonedDict = originalDict.clone(_this.dest);
			_this.traversedObjects.set(originalDict, clonedDict);
			var entries = originalDict.entries();
			for (var idx = 0, len = entries.length; idx < len; idx++) {
				var _a = entries[idx], key = _a[0], value = _a[1];
				clonedDict.set(key, _this.copy(value));
			}
			return clonedDict;
		};
		this.copyPDFArray = function(originalArray) {
			if (_this.traversedObjects.has(originalArray)) return _this.traversedObjects.get(originalArray);
			var clonedArray = originalArray.clone(_this.dest);
			_this.traversedObjects.set(originalArray, clonedArray);
			for (var idx = 0, len = originalArray.size(); idx < len; idx++) {
				var value = originalArray.get(idx);
				clonedArray.set(idx, _this.copy(value));
			}
			return clonedArray;
		};
		this.copyPDFStream = function(originalStream) {
			if (_this.traversedObjects.has(originalStream)) return _this.traversedObjects.get(originalStream);
			var clonedStream = originalStream.clone(_this.dest);
			_this.traversedObjects.set(originalStream, clonedStream);
			var entries = originalStream.dict.entries();
			for (var idx = 0, len = entries.length; idx < len; idx++) {
				var _a = entries[idx], key = _a[0], value = _a[1];
				clonedStream.dict.set(key, _this.copy(value));
			}
			return clonedStream;
		};
		this.copyPDFIndirectObject = function(ref) {
			if (!_this.traversedObjects.has(ref)) {
				var newRef = _this.dest.nextRef();
				_this.traversedObjects.set(ref, newRef);
				var dereferencedValue = _this.src.lookup(ref);
				if (dereferencedValue) {
					var cloned = _this.copy(dereferencedValue);
					_this.dest.assign(newRef, cloned);
				}
			}
			return _this.traversedObjects.get(ref);
		};
		this.src = src;
		this.dest = dest;
	}
	PDFObjectCopier.for = function(src, dest) {
		return new PDFObjectCopier(src, dest);
	};
	return PDFObjectCopier;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/document/PDFCrossRefSection.js
/**
* Entries should be added using the [[addEntry]] and [[addDeletedEntry]]
* methods **in order of ascending object number**.
*/
var PDFCrossRefSection = function() {
	function PDFCrossRefSection(firstEntry) {
		this.subsections = firstEntry ? [[firstEntry]] : [];
		this.chunkIdx = 0;
		this.chunkLength = firstEntry ? 1 : 0;
	}
	PDFCrossRefSection.prototype.addEntry = function(ref, offset) {
		this.append({
			ref,
			offset,
			deleted: false
		});
	};
	PDFCrossRefSection.prototype.addDeletedEntry = function(ref, nextFreeObjectNumber) {
		this.append({
			ref,
			offset: nextFreeObjectNumber,
			deleted: true
		});
	};
	PDFCrossRefSection.prototype.toString = function() {
		var section = "xref\n";
		for (var rangeIdx = 0, rangeLen = this.subsections.length; rangeIdx < rangeLen; rangeIdx++) {
			var range = this.subsections[rangeIdx];
			section += range[0].ref.objectNumber + " " + range.length + "\n";
			for (var entryIdx = 0, entryLen = range.length; entryIdx < entryLen; entryIdx++) {
				var entry = range[entryIdx];
				section += padStart$1(String(entry.offset), 10, "0");
				section += " ";
				section += padStart$1(String(entry.ref.generationNumber), 5, "0");
				section += " ";
				section += entry.deleted ? "f" : "n";
				section += " \n";
			}
		}
		return section;
	};
	PDFCrossRefSection.prototype.sizeInBytes = function() {
		var size = 5;
		for (var idx = 0, len = this.subsections.length; idx < len; idx++) {
			var subsection = this.subsections[idx];
			var subsectionLength = subsection.length;
			var firstEntry = subsection[0];
			size += 2;
			size += String(firstEntry.ref.objectNumber).length;
			size += String(subsectionLength).length;
			size += 20 * subsectionLength;
		}
		return size;
	};
	PDFCrossRefSection.prototype.copyBytesInto = function(buffer, offset) {
		var initialOffset = offset;
		buffer[offset++] = CharCodes_default.x;
		buffer[offset++] = CharCodes_default.r;
		buffer[offset++] = CharCodes_default.e;
		buffer[offset++] = CharCodes_default.f;
		buffer[offset++] = CharCodes_default.Newline;
		offset += this.copySubsectionsIntoBuffer(this.subsections, buffer, offset);
		return offset - initialOffset;
	};
	PDFCrossRefSection.prototype.copySubsectionsIntoBuffer = function(subsections, buffer, offset) {
		var initialOffset = offset;
		var length = subsections.length;
		for (var idx = 0; idx < length; idx++) {
			var subsection = this.subsections[idx];
			var firstObjectNumber = String(subsection[0].ref.objectNumber);
			offset += copyStringIntoBuffer(firstObjectNumber, buffer, offset);
			buffer[offset++] = CharCodes_default.Space;
			var rangeLength = String(subsection.length);
			offset += copyStringIntoBuffer(rangeLength, buffer, offset);
			buffer[offset++] = CharCodes_default.Newline;
			offset += this.copyEntriesIntoBuffer(subsection, buffer, offset);
		}
		return offset - initialOffset;
	};
	PDFCrossRefSection.prototype.copyEntriesIntoBuffer = function(entries, buffer, offset) {
		var length = entries.length;
		for (var idx = 0; idx < length; idx++) {
			var entry = entries[idx];
			var entryOffset = padStart$1(String(entry.offset), 10, "0");
			offset += copyStringIntoBuffer(entryOffset, buffer, offset);
			buffer[offset++] = CharCodes_default.Space;
			var entryGen = padStart$1(String(entry.ref.generationNumber), 5, "0");
			offset += copyStringIntoBuffer(entryGen, buffer, offset);
			buffer[offset++] = CharCodes_default.Space;
			buffer[offset++] = entry.deleted ? CharCodes_default.f : CharCodes_default.n;
			buffer[offset++] = CharCodes_default.Space;
			buffer[offset++] = CharCodes_default.Newline;
		}
		return 20 * length;
	};
	PDFCrossRefSection.prototype.append = function(currEntry) {
		if (this.chunkLength === 0) {
			this.subsections.push([currEntry]);
			this.chunkIdx = 0;
			this.chunkLength = 1;
			return;
		}
		var chunk = this.subsections[this.chunkIdx];
		var prevEntry = chunk[this.chunkLength - 1];
		if (currEntry.ref.objectNumber - prevEntry.ref.objectNumber > 1) {
			this.subsections.push([currEntry]);
			this.chunkIdx += 1;
			this.chunkLength = 1;
		} else {
			chunk.push(currEntry);
			this.chunkLength += 1;
		}
	};
	PDFCrossRefSection.create = function() {
		return new PDFCrossRefSection({
			ref: PDFRef.of(0, 65535),
			offset: 0,
			deleted: true
		});
	};
	PDFCrossRefSection.createEmpty = function() {
		return new PDFCrossRefSection();
	};
	return PDFCrossRefSection;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/document/PDFTrailer.js
var PDFTrailer = function() {
	function PDFTrailer(lastXRefOffset) {
		this.lastXRefOffset = String(lastXRefOffset);
	}
	PDFTrailer.prototype.toString = function() {
		return "startxref\n" + this.lastXRefOffset + "\n%%EOF";
	};
	PDFTrailer.prototype.sizeInBytes = function() {
		return 16 + this.lastXRefOffset.length;
	};
	PDFTrailer.prototype.copyBytesInto = function(buffer, offset) {
		var initialOffset = offset;
		buffer[offset++] = CharCodes_default.s;
		buffer[offset++] = CharCodes_default.t;
		buffer[offset++] = CharCodes_default.a;
		buffer[offset++] = CharCodes_default.r;
		buffer[offset++] = CharCodes_default.t;
		buffer[offset++] = CharCodes_default.x;
		buffer[offset++] = CharCodes_default.r;
		buffer[offset++] = CharCodes_default.e;
		buffer[offset++] = CharCodes_default.f;
		buffer[offset++] = CharCodes_default.Newline;
		offset += copyStringIntoBuffer(this.lastXRefOffset, buffer, offset);
		buffer[offset++] = CharCodes_default.Newline;
		buffer[offset++] = CharCodes_default.Percent;
		buffer[offset++] = CharCodes_default.Percent;
		buffer[offset++] = CharCodes_default.E;
		buffer[offset++] = CharCodes_default.O;
		buffer[offset++] = CharCodes_default.F;
		return offset - initialOffset;
	};
	PDFTrailer.forLastCrossRefSectionOffset = function(offset) {
		return new PDFTrailer(offset);
	};
	return PDFTrailer;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/document/PDFTrailerDict.js
var PDFTrailerDict = function() {
	function PDFTrailerDict(dict) {
		this.dict = dict;
	}
	PDFTrailerDict.prototype.toString = function() {
		return "trailer\n" + this.dict.toString();
	};
	PDFTrailerDict.prototype.sizeInBytes = function() {
		return 8 + this.dict.sizeInBytes();
	};
	PDFTrailerDict.prototype.copyBytesInto = function(buffer, offset) {
		var initialOffset = offset;
		buffer[offset++] = CharCodes_default.t;
		buffer[offset++] = CharCodes_default.r;
		buffer[offset++] = CharCodes_default.a;
		buffer[offset++] = CharCodes_default.i;
		buffer[offset++] = CharCodes_default.l;
		buffer[offset++] = CharCodes_default.e;
		buffer[offset++] = CharCodes_default.r;
		buffer[offset++] = CharCodes_default.Newline;
		offset += this.dict.copyBytesInto(buffer, offset);
		return offset - initialOffset;
	};
	PDFTrailerDict.of = function(dict) {
		return new PDFTrailerDict(dict);
	};
	return PDFTrailerDict;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/structures/PDFObjectStream.js
var PDFObjectStream = function(_super) {
	__extends(PDFObjectStream, _super);
	function PDFObjectStream(context, objects, encode) {
		if (encode === void 0) encode = true;
		var _this = _super.call(this, context.obj({}), encode) || this;
		_this.objects = objects;
		_this.offsets = _this.computeObjectOffsets();
		_this.offsetsString = _this.computeOffsetsString();
		_this.dict.set(PDFName.of("Type"), PDFName.of("ObjStm"));
		_this.dict.set(PDFName.of("N"), PDFNumber.of(_this.objects.length));
		_this.dict.set(PDFName.of("First"), PDFNumber.of(_this.offsetsString.length));
		return _this;
	}
	PDFObjectStream.prototype.getObjectsCount = function() {
		return this.objects.length;
	};
	PDFObjectStream.prototype.clone = function(context) {
		return PDFObjectStream.withContextAndObjects(context || this.dict.context, this.objects.slice(), this.encode);
	};
	PDFObjectStream.prototype.getContentsString = function() {
		var value = this.offsetsString;
		for (var idx = 0, len = this.objects.length; idx < len; idx++) {
			var object = this.objects[idx][1];
			value += object + "\n";
		}
		return value;
	};
	PDFObjectStream.prototype.getUnencodedContents = function() {
		var buffer = new Uint8Array(this.getUnencodedContentsSize());
		var offset = copyStringIntoBuffer(this.offsetsString, buffer, 0);
		for (var idx = 0, len = this.objects.length; idx < len; idx++) {
			var object = this.objects[idx][1];
			offset += object.copyBytesInto(buffer, offset);
			buffer[offset++] = CharCodes_default.Newline;
		}
		return buffer;
	};
	PDFObjectStream.prototype.getUnencodedContentsSize = function() {
		return this.offsetsString.length + last(this.offsets)[1] + last(this.objects)[1].sizeInBytes() + 1;
	};
	PDFObjectStream.prototype.computeOffsetsString = function() {
		var offsetsString = "";
		for (var idx = 0, len = this.offsets.length; idx < len; idx++) {
			var _a = this.offsets[idx], objectNumber = _a[0], offset = _a[1];
			offsetsString += objectNumber + " " + offset + " ";
		}
		return offsetsString;
	};
	PDFObjectStream.prototype.computeObjectOffsets = function() {
		var offset = 0;
		var offsets = new Array(this.objects.length);
		for (var idx = 0, len = this.objects.length; idx < len; idx++) {
			var _a = this.objects[idx], ref = _a[0], object = _a[1];
			offsets[idx] = [ref.objectNumber, offset];
			offset += object.sizeInBytes() + 1;
		}
		return offsets;
	};
	PDFObjectStream.withContextAndObjects = function(context, objects, encode) {
		if (encode === void 0) encode = true;
		return new PDFObjectStream(context, objects, encode);
	};
	return PDFObjectStream;
}(PDFFlateStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/writers/PDFWriter.js
var PDFWriter = function() {
	function PDFWriter(context, objectsPerTick) {
		var _this = this;
		this.parsedObjects = 0;
		this.shouldWaitForTick = function(n) {
			_this.parsedObjects += n;
			return _this.parsedObjects % _this.objectsPerTick === 0;
		};
		this.context = context;
		this.objectsPerTick = objectsPerTick;
	}
	PDFWriter.prototype.serializeToBuffer = function() {
		return __awaiter(this, void 0, void 0, function() {
			var _a, size, header, indirectObjects, xref, trailerDict, trailer, offset, buffer, idx, len, _b, ref, object, objectNumber, generationNumber, n;
			return __generator(this, function(_c) {
				switch (_c.label) {
					case 0: return [4, this.computeBufferSize()];
					case 1:
						_a = _c.sent(), size = _a.size, header = _a.header, indirectObjects = _a.indirectObjects, xref = _a.xref, trailerDict = _a.trailerDict, trailer = _a.trailer;
						offset = 0;
						buffer = new Uint8Array(size);
						offset += header.copyBytesInto(buffer, offset);
						buffer[offset++] = CharCodes_default.Newline;
						buffer[offset++] = CharCodes_default.Newline;
						idx = 0, len = indirectObjects.length;
						_c.label = 2;
					case 2:
						if (!(idx < len)) return [3, 5];
						_b = indirectObjects[idx], ref = _b[0], object = _b[1];
						objectNumber = String(ref.objectNumber);
						offset += copyStringIntoBuffer(objectNumber, buffer, offset);
						buffer[offset++] = CharCodes_default.Space;
						generationNumber = String(ref.generationNumber);
						offset += copyStringIntoBuffer(generationNumber, buffer, offset);
						buffer[offset++] = CharCodes_default.Space;
						buffer[offset++] = CharCodes_default.o;
						buffer[offset++] = CharCodes_default.b;
						buffer[offset++] = CharCodes_default.j;
						buffer[offset++] = CharCodes_default.Newline;
						offset += object.copyBytesInto(buffer, offset);
						buffer[offset++] = CharCodes_default.Newline;
						buffer[offset++] = CharCodes_default.e;
						buffer[offset++] = CharCodes_default.n;
						buffer[offset++] = CharCodes_default.d;
						buffer[offset++] = CharCodes_default.o;
						buffer[offset++] = CharCodes_default.b;
						buffer[offset++] = CharCodes_default.j;
						buffer[offset++] = CharCodes_default.Newline;
						buffer[offset++] = CharCodes_default.Newline;
						n = object instanceof PDFObjectStream ? object.getObjectsCount() : 1;
						if (!this.shouldWaitForTick(n)) return [3, 4];
						return [4, waitForTick()];
					case 3:
						_c.sent();
						_c.label = 4;
					case 4:
						idx++;
						return [3, 2];
					case 5:
						if (xref) {
							offset += xref.copyBytesInto(buffer, offset);
							buffer[offset++] = CharCodes_default.Newline;
						}
						if (trailerDict) {
							offset += trailerDict.copyBytesInto(buffer, offset);
							buffer[offset++] = CharCodes_default.Newline;
							buffer[offset++] = CharCodes_default.Newline;
						}
						offset += trailer.copyBytesInto(buffer, offset);
						return [2, buffer];
				}
			});
		});
	};
	PDFWriter.prototype.computeIndirectObjectSize = function(_a) {
		var ref = _a[0], object = _a[1];
		return ref.sizeInBytes() + 3 + (object.sizeInBytes() + 9);
	};
	PDFWriter.prototype.createTrailerDict = function() {
		return this.context.obj({
			Size: this.context.largestObjectNumber + 1,
			Root: this.context.trailerInfo.Root,
			Encrypt: this.context.trailerInfo.Encrypt,
			Info: this.context.trailerInfo.Info,
			ID: this.context.trailerInfo.ID
		});
	};
	PDFWriter.prototype.computeBufferSize = function() {
		return __awaiter(this, void 0, void 0, function() {
			var header, size, xref, indirectObjects, idx, len, indirectObject, ref, xrefOffset, trailerDict, trailer;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						header = PDFHeader.forVersion(1, 7);
						size = header.sizeInBytes() + 2;
						xref = PDFCrossRefSection.create();
						indirectObjects = this.context.enumerateIndirectObjects();
						idx = 0, len = indirectObjects.length;
						_a.label = 1;
					case 1:
						if (!(idx < len)) return [3, 4];
						indirectObject = indirectObjects[idx];
						ref = indirectObject[0];
						xref.addEntry(ref, size);
						size += this.computeIndirectObjectSize(indirectObject);
						if (!this.shouldWaitForTick(1)) return [3, 3];
						return [4, waitForTick()];
					case 2:
						_a.sent();
						_a.label = 3;
					case 3:
						idx++;
						return [3, 1];
					case 4:
						xrefOffset = size;
						size += xref.sizeInBytes() + 1;
						trailerDict = PDFTrailerDict.of(this.createTrailerDict());
						size += trailerDict.sizeInBytes() + 2;
						trailer = PDFTrailer.forLastCrossRefSectionOffset(xrefOffset);
						size += trailer.sizeInBytes();
						return [2, {
							size,
							header,
							indirectObjects,
							xref,
							trailerDict,
							trailer
						}];
				}
			});
		});
	};
	PDFWriter.forContext = function(context, objectsPerTick) {
		return new PDFWriter(context, objectsPerTick);
	};
	return PDFWriter;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFInvalidObject.js
var PDFInvalidObject = function(_super) {
	__extends(PDFInvalidObject, _super);
	function PDFInvalidObject(data) {
		var _this = _super.call(this) || this;
		_this.data = data;
		return _this;
	}
	PDFInvalidObject.prototype.clone = function() {
		return PDFInvalidObject.of(this.data.slice());
	};
	PDFInvalidObject.prototype.toString = function() {
		return "PDFInvalidObject(" + this.data.length + " bytes)";
	};
	PDFInvalidObject.prototype.sizeInBytes = function() {
		return this.data.length;
	};
	PDFInvalidObject.prototype.copyBytesInto = function(buffer, offset) {
		var length = this.data.length;
		for (var idx = 0; idx < length; idx++) buffer[offset++] = this.data[idx];
		return length;
	};
	PDFInvalidObject.of = function(data) {
		return new PDFInvalidObject(data);
	};
	return PDFInvalidObject;
}(PDFObject);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/structures/PDFCrossRefStream.js
var EntryType;
(function(EntryType) {
	EntryType[EntryType["Deleted"] = 0] = "Deleted";
	EntryType[EntryType["Uncompressed"] = 1] = "Uncompressed";
	EntryType[EntryType["Compressed"] = 2] = "Compressed";
})(EntryType || (EntryType = {}));
/**
* Entries should be added using the [[addDeletedEntry]],
* [[addUncompressedEntry]], and [[addCompressedEntry]] methods
* **in order of ascending object number**.
*/
var PDFCrossRefStream = function(_super) {
	__extends(PDFCrossRefStream, _super);
	function PDFCrossRefStream(dict, entries, encode) {
		if (encode === void 0) encode = true;
		var _this = _super.call(this, dict, encode) || this;
		_this.computeIndex = function() {
			var subsections = [];
			var subsectionLength = 0;
			for (var idx = 0, len = _this.entries.length; idx < len; idx++) {
				var currEntry = _this.entries[idx];
				var prevEntry = _this.entries[idx - 1];
				if (idx === 0) subsections.push(currEntry.ref.objectNumber);
				else if (currEntry.ref.objectNumber - prevEntry.ref.objectNumber > 1) {
					subsections.push(subsectionLength);
					subsections.push(currEntry.ref.objectNumber);
					subsectionLength = 0;
				}
				subsectionLength += 1;
			}
			subsections.push(subsectionLength);
			return subsections;
		};
		_this.computeEntryTuples = function() {
			var entryTuples = new Array(_this.entries.length);
			for (var idx = 0, len = _this.entries.length; idx < len; idx++) {
				var entry = _this.entries[idx];
				if (entry.type === EntryType.Deleted) {
					var type = entry.type, nextFreeObjectNumber = entry.nextFreeObjectNumber, ref = entry.ref;
					entryTuples[idx] = [
						type,
						nextFreeObjectNumber,
						ref.generationNumber
					];
				}
				if (entry.type === EntryType.Uncompressed) {
					var type = entry.type, offset = entry.offset, ref = entry.ref;
					entryTuples[idx] = [
						type,
						offset,
						ref.generationNumber
					];
				}
				if (entry.type === EntryType.Compressed) {
					var type = entry.type, objectStreamRef = entry.objectStreamRef, index = entry.index;
					entryTuples[idx] = [
						type,
						objectStreamRef.objectNumber,
						index
					];
				}
			}
			return entryTuples;
		};
		_this.computeMaxEntryByteWidths = function() {
			var entryTuples = _this.entryTuplesCache.access();
			var widths = [
				0,
				0,
				0
			];
			for (var idx = 0, len = entryTuples.length; idx < len; idx++) {
				var _a = entryTuples[idx], first = _a[0], second = _a[1], third = _a[2];
				var firstSize = sizeInBytes(first);
				var secondSize = sizeInBytes(second);
				var thirdSize = sizeInBytes(third);
				if (firstSize > widths[0]) widths[0] = firstSize;
				if (secondSize > widths[1]) widths[1] = secondSize;
				if (thirdSize > widths[2]) widths[2] = thirdSize;
			}
			return widths;
		};
		_this.entries = entries || [];
		_this.entryTuplesCache = Cache.populatedBy(_this.computeEntryTuples);
		_this.maxByteWidthsCache = Cache.populatedBy(_this.computeMaxEntryByteWidths);
		_this.indexCache = Cache.populatedBy(_this.computeIndex);
		dict.set(PDFName.of("Type"), PDFName.of("XRef"));
		return _this;
	}
	PDFCrossRefStream.prototype.addDeletedEntry = function(ref, nextFreeObjectNumber) {
		var type = EntryType.Deleted;
		this.entries.push({
			type,
			ref,
			nextFreeObjectNumber
		});
		this.entryTuplesCache.invalidate();
		this.maxByteWidthsCache.invalidate();
		this.indexCache.invalidate();
		this.contentsCache.invalidate();
	};
	PDFCrossRefStream.prototype.addUncompressedEntry = function(ref, offset) {
		var type = EntryType.Uncompressed;
		this.entries.push({
			type,
			ref,
			offset
		});
		this.entryTuplesCache.invalidate();
		this.maxByteWidthsCache.invalidate();
		this.indexCache.invalidate();
		this.contentsCache.invalidate();
	};
	PDFCrossRefStream.prototype.addCompressedEntry = function(ref, objectStreamRef, index) {
		var type = EntryType.Compressed;
		this.entries.push({
			type,
			ref,
			objectStreamRef,
			index
		});
		this.entryTuplesCache.invalidate();
		this.maxByteWidthsCache.invalidate();
		this.indexCache.invalidate();
		this.contentsCache.invalidate();
	};
	PDFCrossRefStream.prototype.clone = function(context) {
		var _a = this, dict = _a.dict, entries = _a.entries, encode = _a.encode;
		return PDFCrossRefStream.of(dict.clone(context), entries.slice(), encode);
	};
	PDFCrossRefStream.prototype.getContentsString = function() {
		var entryTuples = this.entryTuplesCache.access();
		var byteWidths = this.maxByteWidthsCache.access();
		var value = "";
		for (var entryIdx = 0, entriesLen = entryTuples.length; entryIdx < entriesLen; entryIdx++) {
			var _a = entryTuples[entryIdx], first = _a[0], second = _a[1], third = _a[2];
			var firstBytes = reverseArray(bytesFor(first));
			var secondBytes = reverseArray(bytesFor(second));
			var thirdBytes = reverseArray(bytesFor(third));
			for (var idx = byteWidths[0] - 1; idx >= 0; idx--) value += (firstBytes[idx] || 0).toString(2);
			for (var idx = byteWidths[1] - 1; idx >= 0; idx--) value += (secondBytes[idx] || 0).toString(2);
			for (var idx = byteWidths[2] - 1; idx >= 0; idx--) value += (thirdBytes[idx] || 0).toString(2);
		}
		return value;
	};
	PDFCrossRefStream.prototype.getUnencodedContents = function() {
		var entryTuples = this.entryTuplesCache.access();
		var byteWidths = this.maxByteWidthsCache.access();
		var buffer = new Uint8Array(this.getUnencodedContentsSize());
		var offset = 0;
		for (var entryIdx = 0, entriesLen = entryTuples.length; entryIdx < entriesLen; entryIdx++) {
			var _a = entryTuples[entryIdx], first = _a[0], second = _a[1], third = _a[2];
			var firstBytes = reverseArray(bytesFor(first));
			var secondBytes = reverseArray(bytesFor(second));
			var thirdBytes = reverseArray(bytesFor(third));
			for (var idx = byteWidths[0] - 1; idx >= 0; idx--) buffer[offset++] = firstBytes[idx] || 0;
			for (var idx = byteWidths[1] - 1; idx >= 0; idx--) buffer[offset++] = secondBytes[idx] || 0;
			for (var idx = byteWidths[2] - 1; idx >= 0; idx--) buffer[offset++] = thirdBytes[idx] || 0;
		}
		return buffer;
	};
	PDFCrossRefStream.prototype.getUnencodedContentsSize = function() {
		return sum(this.maxByteWidthsCache.access()) * this.entries.length;
	};
	PDFCrossRefStream.prototype.updateDict = function() {
		_super.prototype.updateDict.call(this);
		var byteWidths = this.maxByteWidthsCache.access();
		var index = this.indexCache.access();
		var context = this.dict.context;
		this.dict.set(PDFName.of("W"), context.obj(byteWidths));
		this.dict.set(PDFName.of("Index"), context.obj(index));
	};
	PDFCrossRefStream.create = function(dict, encode) {
		if (encode === void 0) encode = true;
		var stream = new PDFCrossRefStream(dict, [], encode);
		stream.addDeletedEntry(PDFRef.of(0, 65535), 0);
		return stream;
	};
	PDFCrossRefStream.of = function(dict, entries, encode) {
		if (encode === void 0) encode = true;
		return new PDFCrossRefStream(dict, entries, encode);
	};
	return PDFCrossRefStream;
}(PDFFlateStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/writers/PDFStreamWriter.js
var PDFStreamWriter = function(_super) {
	__extends(PDFStreamWriter, _super);
	function PDFStreamWriter(context, objectsPerTick, encodeStreams, objectsPerStream) {
		var _this = _super.call(this, context, objectsPerTick) || this;
		_this.encodeStreams = encodeStreams;
		_this.objectsPerStream = objectsPerStream;
		return _this;
	}
	PDFStreamWriter.prototype.computeBufferSize = function() {
		return __awaiter(this, void 0, void 0, function() {
			var objectNumber, header, size, xrefStream, uncompressedObjects, compressedObjects, objectStreamRefs, indirectObjects, idx, len, indirectObject, ref, object, shouldNotCompress, chunk, objectStreamRef, idx, len, chunk, ref, objectStream, xrefStreamRef, xrefOffset, trailer;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						objectNumber = this.context.largestObjectNumber + 1;
						header = PDFHeader.forVersion(1, 7);
						size = header.sizeInBytes() + 2;
						xrefStream = PDFCrossRefStream.create(this.createTrailerDict(), this.encodeStreams);
						uncompressedObjects = [];
						compressedObjects = [];
						objectStreamRefs = [];
						indirectObjects = this.context.enumerateIndirectObjects();
						idx = 0, len = indirectObjects.length;
						_a.label = 1;
					case 1:
						if (!(idx < len)) return [3, 6];
						indirectObject = indirectObjects[idx];
						ref = indirectObject[0], object = indirectObject[1];
						shouldNotCompress = ref === this.context.trailerInfo.Encrypt || object instanceof PDFStream || object instanceof PDFInvalidObject || ref.generationNumber !== 0;
						if (!shouldNotCompress) return [3, 4];
						uncompressedObjects.push(indirectObject);
						xrefStream.addUncompressedEntry(ref, size);
						size += this.computeIndirectObjectSize(indirectObject);
						if (!this.shouldWaitForTick(1)) return [3, 3];
						return [4, waitForTick()];
					case 2:
						_a.sent();
						_a.label = 3;
					case 3: return [3, 5];
					case 4:
						chunk = last(compressedObjects);
						objectStreamRef = last(objectStreamRefs);
						if (!chunk || chunk.length % this.objectsPerStream === 0) {
							chunk = [];
							compressedObjects.push(chunk);
							objectStreamRef = PDFRef.of(objectNumber++);
							objectStreamRefs.push(objectStreamRef);
						}
						xrefStream.addCompressedEntry(ref, objectStreamRef, chunk.length);
						chunk.push(indirectObject);
						_a.label = 5;
					case 5:
						idx++;
						return [3, 1];
					case 6:
						idx = 0, len = compressedObjects.length;
						_a.label = 7;
					case 7:
						if (!(idx < len)) return [3, 10];
						chunk = compressedObjects[idx];
						ref = objectStreamRefs[idx];
						objectStream = PDFObjectStream.withContextAndObjects(this.context, chunk, this.encodeStreams);
						xrefStream.addUncompressedEntry(ref, size);
						size += this.computeIndirectObjectSize([ref, objectStream]);
						uncompressedObjects.push([ref, objectStream]);
						if (!this.shouldWaitForTick(chunk.length)) return [3, 9];
						return [4, waitForTick()];
					case 8:
						_a.sent();
						_a.label = 9;
					case 9:
						idx++;
						return [3, 7];
					case 10:
						xrefStreamRef = PDFRef.of(objectNumber++);
						xrefStream.dict.set(PDFName.of("Size"), PDFNumber.of(objectNumber));
						xrefStream.addUncompressedEntry(xrefStreamRef, size);
						xrefOffset = size;
						size += this.computeIndirectObjectSize([xrefStreamRef, xrefStream]);
						uncompressedObjects.push([xrefStreamRef, xrefStream]);
						trailer = PDFTrailer.forLastCrossRefSectionOffset(xrefOffset);
						size += trailer.sizeInBytes();
						return [2, {
							size,
							header,
							indirectObjects: uncompressedObjects,
							trailer
						}];
				}
			});
		});
	};
	PDFStreamWriter.forContext = function(context, objectsPerTick, encodeStreams, objectsPerStream) {
		if (encodeStreams === void 0) encodeStreams = true;
		if (objectsPerStream === void 0) objectsPerStream = 50;
		return new PDFStreamWriter(context, objectsPerTick, encodeStreams, objectsPerStream);
	};
	return PDFStreamWriter;
}(PDFWriter);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFHexString.js
var PDFHexString = function(_super) {
	__extends(PDFHexString, _super);
	function PDFHexString(value) {
		var _this = _super.call(this) || this;
		_this.value = value;
		return _this;
	}
	PDFHexString.prototype.asBytes = function() {
		var hex = this.value + (this.value.length % 2 === 1 ? "0" : "");
		var hexLength = hex.length;
		var bytes = new Uint8Array(hex.length / 2);
		var hexOffset = 0;
		var bytesOffset = 0;
		while (hexOffset < hexLength) {
			var byte = parseInt(hex.substring(hexOffset, hexOffset + 2), 16);
			bytes[bytesOffset] = byte;
			hexOffset += 2;
			bytesOffset += 1;
		}
		return bytes;
	};
	PDFHexString.prototype.decodeText = function() {
		var bytes = this.asBytes();
		if (hasUtf16BOM(bytes)) return utf16Decode(bytes);
		return pdfDocEncodingDecode(bytes);
	};
	PDFHexString.prototype.decodeDate = function() {
		var text = this.decodeText();
		var date = parseDate(text);
		if (!date) throw new InvalidPDFDateStringError(text);
		return date;
	};
	PDFHexString.prototype.asString = function() {
		return this.value;
	};
	PDFHexString.prototype.clone = function() {
		return PDFHexString.of(this.value);
	};
	PDFHexString.prototype.toString = function() {
		return "<" + this.value + ">";
	};
	PDFHexString.prototype.sizeInBytes = function() {
		return this.value.length + 2;
	};
	PDFHexString.prototype.copyBytesInto = function(buffer, offset) {
		buffer[offset++] = CharCodes_default.LessThan;
		offset += copyStringIntoBuffer(this.value, buffer, offset);
		buffer[offset++] = CharCodes_default.GreaterThan;
		return this.value.length + 2;
	};
	PDFHexString.of = function(value) {
		return new PDFHexString(value);
	};
	PDFHexString.fromText = function(value) {
		var encoded = utf16Encode(value);
		var hex = "";
		for (var idx = 0, len = encoded.length; idx < len; idx++) hex += toHexStringOfMinLength(encoded[idx], 4);
		return new PDFHexString(hex);
	};
	return PDFHexString;
}(PDFObject);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/StandardFontEmbedder.js
/**
* A note of thanks to the developers of https://github.com/foliojs/pdfkit, as
* this class borrows from:
*   https://github.com/foliojs/pdfkit/blob/f91bdd61c164a72ea06be1a43dc0a412afc3925f/lib/font/afm.coffee
*/
var StandardFontEmbedder = function() {
	function StandardFontEmbedder(fontName, customName) {
		this.encoding = fontName === FontNames.ZapfDingbats ? Encodings.ZapfDingbats : fontName === FontNames.Symbol ? Encodings.Symbol : Encodings.WinAnsi;
		this.font = Font.load(fontName);
		this.fontName = this.font.FontName;
		this.customName = customName;
	}
	/**
	* Encode the JavaScript string into this font. (JavaScript encodes strings in
	* Unicode, but standard fonts use either WinAnsi, ZapfDingbats, or Symbol
	* encodings)
	*/
	StandardFontEmbedder.prototype.encodeText = function(text) {
		var glyphs = this.encodeTextAsGlyphs(text);
		var hexCodes = new Array(glyphs.length);
		for (var idx = 0, len = glyphs.length; idx < len; idx++) hexCodes[idx] = toHexString(glyphs[idx].code);
		return PDFHexString.of(hexCodes.join(""));
	};
	StandardFontEmbedder.prototype.widthOfTextAtSize = function(text, size) {
		var glyphs = this.encodeTextAsGlyphs(text);
		var totalWidth = 0;
		for (var idx = 0, len = glyphs.length; idx < len; idx++) {
			var left = glyphs[idx].name;
			var right = (glyphs[idx + 1] || {}).name;
			var kernAmount = this.font.getXAxisKerningForPair(left, right) || 0;
			totalWidth += this.widthOfGlyph(left) + kernAmount;
		}
		var scale = size / 1e3;
		return totalWidth * scale;
	};
	StandardFontEmbedder.prototype.heightOfFontAtSize = function(size, options) {
		if (options === void 0) options = {};
		var _a = options.descender, descender = _a === void 0 ? true : _a;
		var _b = this.font, Ascender = _b.Ascender, Descender = _b.Descender, FontBBox = _b.FontBBox;
		var height = (Ascender || FontBBox[3]) - (Descender || FontBBox[1]);
		if (!descender) height += Descender || 0;
		return height / 1e3 * size;
	};
	StandardFontEmbedder.prototype.sizeOfFontAtHeight = function(height) {
		var _a = this.font, Ascender = _a.Ascender, Descender = _a.Descender, FontBBox = _a.FontBBox;
		var yTop = Ascender || FontBBox[3];
		var yBottom = Descender || FontBBox[1];
		return 1e3 * height / (yTop - yBottom);
	};
	StandardFontEmbedder.prototype.embedIntoContext = function(context, ref) {
		var fontDict = context.obj({
			Type: "Font",
			Subtype: "Type1",
			BaseFont: this.customName || this.fontName,
			Encoding: this.encoding === Encodings.WinAnsi ? "WinAnsiEncoding" : void 0
		});
		if (ref) {
			context.assign(ref, fontDict);
			return ref;
		} else return context.register(fontDict);
	};
	StandardFontEmbedder.prototype.widthOfGlyph = function(glyphName) {
		return this.font.getWidthOfGlyph(glyphName) || 250;
	};
	StandardFontEmbedder.prototype.encodeTextAsGlyphs = function(text) {
		var codePoints = Array.from(text);
		var glyphs = new Array(codePoints.length);
		for (var idx = 0, len = codePoints.length; idx < len; idx++) {
			var codePoint = toCodePoint(codePoints[idx]);
			glyphs[idx] = this.encoding.encodeUnicodeCodePoint(codePoint);
		}
		return glyphs;
	};
	StandardFontEmbedder.for = function(fontName, customName) {
		return new StandardFontEmbedder(fontName, customName);
	};
	return StandardFontEmbedder;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/CMap.js
/** `glyphs` should be an array of unique glyphs */
var createCmap = function(glyphs, glyphId) {
	var bfChars = new Array(glyphs.length);
	for (var idx = 0, len = glyphs.length; idx < len; idx++) {
		var glyph = glyphs[idx];
		var id = cmapHexFormat(cmapHexString(glyphId(glyph)));
		var unicode = cmapHexFormat.apply(void 0, glyph.codePoints.map(cmapCodePointFormat));
		bfChars[idx] = [id, unicode];
	}
	return fillCmapTemplate(bfChars);
};
var fillCmapTemplate = function(bfChars) {
	return "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo <<\n  /Registry (Adobe)\n  /Ordering (UCS)\n  /Supplement 0\n>> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000><ffff>\nendcodespacerange\n" + bfChars.length + " beginbfchar\n" + bfChars.map(function(_a) {
		var glyphId = _a[0], codePoint = _a[1];
		return glyphId + " " + codePoint;
	}).join("\n") + "\nendbfchar\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
};
var cmapHexFormat = function() {
	var values = [];
	for (var _i = 0; _i < arguments.length; _i++) values[_i] = arguments[_i];
	return "<" + values.join("") + ">";
};
var cmapHexString = function(value) {
	return toHexStringOfMinLength(value, 4);
};
var cmapCodePointFormat = function(codePoint) {
	if (isWithinBMP(codePoint)) return cmapHexString(codePoint);
	if (hasSurrogates(codePoint)) {
		var hs = highSurrogate(codePoint);
		var ls = lowSurrogate(codePoint);
		return "" + cmapHexString(hs) + cmapHexString(ls);
	}
	var msg = "0x" + toHexString(codePoint) + " is not a valid UTF-8 or UTF-16 codepoint.";
	throw new Error(msg);
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/FontFlags.js
var makeFontFlags = function(options) {
	var flags = 0;
	var flipBit = function(bit) {
		flags |= 1 << bit - 1;
	};
	if (options.fixedPitch) flipBit(1);
	if (options.serif) flipBit(2);
	if (options.symbolic) flipBit(3);
	if (options.script) flipBit(4);
	if (options.nonsymbolic) flipBit(6);
	if (options.italic) flipBit(7);
	if (options.allCap) flipBit(17);
	if (options.smallCap) flipBit(18);
	if (options.forceBold) flipBit(19);
	return flags;
};
var deriveFontFlags = function(font) {
	var familyClass = font["OS/2"] ? font["OS/2"].sFamilyClass : 0;
	return makeFontFlags({
		fixedPitch: font.post.isFixedPitch,
		serif: 1 <= familyClass && familyClass <= 7,
		symbolic: true,
		script: familyClass === 10,
		italic: font.head.macStyle.italic
	});
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/objects/PDFString.js
var PDFString = function(_super) {
	__extends(PDFString, _super);
	function PDFString(value) {
		var _this = _super.call(this) || this;
		_this.value = value;
		return _this;
	}
	PDFString.prototype.asBytes = function() {
		var bytes = [];
		var octal = "";
		var escaped = false;
		var pushByte = function(byte) {
			if (byte !== void 0) bytes.push(byte);
			escaped = false;
		};
		for (var idx = 0, len = this.value.length; idx < len; idx++) {
			var char = this.value[idx];
			var byte = toCharCode(char);
			var nextChar = this.value[idx + 1];
			if (!escaped) if (byte === CharCodes_default.BackSlash) escaped = true;
			else pushByte(byte);
			else if (byte === CharCodes_default.Newline) pushByte();
			else if (byte === CharCodes_default.CarriageReturn) pushByte();
			else if (byte === CharCodes_default.n) pushByte(CharCodes_default.Newline);
			else if (byte === CharCodes_default.r) pushByte(CharCodes_default.CarriageReturn);
			else if (byte === CharCodes_default.t) pushByte(CharCodes_default.Tab);
			else if (byte === CharCodes_default.b) pushByte(CharCodes_default.Backspace);
			else if (byte === CharCodes_default.f) pushByte(CharCodes_default.FormFeed);
			else if (byte === CharCodes_default.LeftParen) pushByte(CharCodes_default.LeftParen);
			else if (byte === CharCodes_default.RightParen) pushByte(CharCodes_default.RightParen);
			else if (byte === CharCodes_default.Backspace) pushByte(CharCodes_default.BackSlash);
			else if (byte >= CharCodes_default.Zero && byte <= CharCodes_default.Seven) {
				octal += char;
				if (octal.length === 3 || !(nextChar >= "0" && nextChar <= "7")) {
					pushByte(parseInt(octal, 8));
					octal = "";
				}
			} else pushByte(byte);
		}
		return new Uint8Array(bytes);
	};
	PDFString.prototype.decodeText = function() {
		var bytes = this.asBytes();
		if (hasUtf16BOM(bytes)) return utf16Decode(bytes);
		return pdfDocEncodingDecode(bytes);
	};
	PDFString.prototype.decodeDate = function() {
		var text = this.decodeText();
		var date = parseDate(text);
		if (!date) throw new InvalidPDFDateStringError(text);
		return date;
	};
	PDFString.prototype.asString = function() {
		return this.value;
	};
	PDFString.prototype.clone = function() {
		return PDFString.of(this.value);
	};
	PDFString.prototype.toString = function() {
		return "(" + this.value + ")";
	};
	PDFString.prototype.sizeInBytes = function() {
		return this.value.length + 2;
	};
	PDFString.prototype.copyBytesInto = function(buffer, offset) {
		buffer[offset++] = CharCodes_default.LeftParen;
		offset += copyStringIntoBuffer(this.value, buffer, offset);
		buffer[offset++] = CharCodes_default.RightParen;
		return this.value.length + 2;
	};
	PDFString.of = function(value) {
		return new PDFString(value);
	};
	PDFString.fromDate = function(date) {
		var year = padStart$1(String(date.getUTCFullYear()), 4, "0");
		var month = padStart$1(String(date.getUTCMonth() + 1), 2, "0");
		var day = padStart$1(String(date.getUTCDate()), 2, "0");
		var hours = padStart$1(String(date.getUTCHours()), 2, "0");
		var mins = padStart$1(String(date.getUTCMinutes()), 2, "0");
		var secs = padStart$1(String(date.getUTCSeconds()), 2, "0");
		return new PDFString("D:" + year + month + day + hours + mins + secs + "Z");
	};
	return PDFString;
}(PDFObject);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/CustomFontEmbedder.js
/**
* A note of thanks to the developers of https://github.com/foliojs/pdfkit, as
* this class borrows from:
*   https://github.com/devongovett/pdfkit/blob/e71edab0dd4657b5a767804ba86c94c58d01fbca/lib/image/jpeg.coffee
*/
var CustomFontEmbedder = function() {
	function CustomFontEmbedder(font, fontData, customName, fontFeatures) {
		var _this = this;
		this.allGlyphsInFontSortedById = function() {
			var glyphs = new Array(_this.font.characterSet.length);
			for (var idx = 0, len = glyphs.length; idx < len; idx++) {
				var codePoint = _this.font.characterSet[idx];
				glyphs[idx] = _this.font.glyphForCodePoint(codePoint);
			}
			return sortedUniq(glyphs.sort(byAscendingId), function(g) {
				return g.id;
			});
		};
		this.font = font;
		this.scale = 1e3 / this.font.unitsPerEm;
		this.fontData = fontData;
		this.fontName = this.font.postscriptName || "Font";
		this.customName = customName;
		this.fontFeatures = fontFeatures;
		this.baseFontName = "";
		this.glyphCache = Cache.populatedBy(this.allGlyphsInFontSortedById);
	}
	CustomFontEmbedder.for = function(fontkit, fontData, customName, fontFeatures) {
		return __awaiter(this, void 0, void 0, function() {
			var font;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0: return [4, fontkit.create(fontData)];
					case 1:
						font = _a.sent();
						return [2, new CustomFontEmbedder(font, fontData, customName, fontFeatures)];
				}
			});
		});
	};
	/**
	* Encode the JavaScript string into this font. (JavaScript encodes strings in
	* Unicode, but embedded fonts use their own custom encodings)
	*/
	CustomFontEmbedder.prototype.encodeText = function(text) {
		var glyphs = this.font.layout(text, this.fontFeatures).glyphs;
		var hexCodes = new Array(glyphs.length);
		for (var idx = 0, len = glyphs.length; idx < len; idx++) hexCodes[idx] = toHexStringOfMinLength(glyphs[idx].id, 4);
		return PDFHexString.of(hexCodes.join(""));
	};
	CustomFontEmbedder.prototype.widthOfTextAtSize = function(text, size) {
		var glyphs = this.font.layout(text, this.fontFeatures).glyphs;
		var totalWidth = 0;
		for (var idx = 0, len = glyphs.length; idx < len; idx++) totalWidth += glyphs[idx].advanceWidth * this.scale;
		var scale = size / 1e3;
		return totalWidth * scale;
	};
	CustomFontEmbedder.prototype.heightOfFontAtSize = function(size, options) {
		if (options === void 0) options = {};
		var _a = options.descender, descender = _a === void 0 ? true : _a;
		var _b = this.font, ascent = _b.ascent, descent = _b.descent, bbox = _b.bbox;
		var height = (ascent || bbox.maxY) * this.scale - (descent || bbox.minY) * this.scale;
		if (!descender) height -= Math.abs(descent) || 0;
		return height / 1e3 * size;
	};
	CustomFontEmbedder.prototype.sizeOfFontAtHeight = function(height) {
		var _a = this.font, ascent = _a.ascent, descent = _a.descent, bbox = _a.bbox;
		var yTop = (ascent || bbox.maxY) * this.scale;
		var yBottom = (descent || bbox.minY) * this.scale;
		return 1e3 * height / (yTop - yBottom);
	};
	CustomFontEmbedder.prototype.embedIntoContext = function(context, ref) {
		this.baseFontName = this.customName || context.addRandomSuffix(this.fontName);
		return this.embedFontDict(context, ref);
	};
	CustomFontEmbedder.prototype.embedFontDict = function(context, ref) {
		return __awaiter(this, void 0, void 0, function() {
			var cidFontDictRef, unicodeCMapRef, fontDict;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0: return [4, this.embedCIDFontDict(context)];
					case 1:
						cidFontDictRef = _a.sent();
						unicodeCMapRef = this.embedUnicodeCmap(context);
						fontDict = context.obj({
							Type: "Font",
							Subtype: "Type0",
							BaseFont: this.baseFontName,
							Encoding: "Identity-H",
							DescendantFonts: [cidFontDictRef],
							ToUnicode: unicodeCMapRef
						});
						if (ref) {
							context.assign(ref, fontDict);
							return [2, ref];
						} else return [2, context.register(fontDict)];
				}
			});
		});
	};
	CustomFontEmbedder.prototype.isCFF = function() {
		return this.font.cff;
	};
	CustomFontEmbedder.prototype.embedCIDFontDict = function(context) {
		return __awaiter(this, void 0, void 0, function() {
			var fontDescriptorRef, cidFontDict;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0: return [4, this.embedFontDescriptor(context)];
					case 1:
						fontDescriptorRef = _a.sent();
						cidFontDict = context.obj({
							Type: "Font",
							Subtype: this.isCFF() ? "CIDFontType0" : "CIDFontType2",
							CIDToGIDMap: "Identity",
							BaseFont: this.baseFontName,
							CIDSystemInfo: {
								Registry: PDFString.of("Adobe"),
								Ordering: PDFString.of("Identity"),
								Supplement: 0
							},
							FontDescriptor: fontDescriptorRef,
							W: this.computeWidths()
						});
						return [2, context.register(cidFontDict)];
				}
			});
		});
	};
	CustomFontEmbedder.prototype.embedFontDescriptor = function(context) {
		return __awaiter(this, void 0, void 0, function() {
			var fontStreamRef, scale, _a, italicAngle, ascent, descent, capHeight, xHeight, _b, minX, minY, maxX, maxY, fontDescriptor;
			var _c;
			return __generator(this, function(_d) {
				switch (_d.label) {
					case 0: return [4, this.embedFontStream(context)];
					case 1:
						fontStreamRef = _d.sent();
						scale = this.scale;
						_a = this.font, italicAngle = _a.italicAngle, ascent = _a.ascent, descent = _a.descent, capHeight = _a.capHeight, xHeight = _a.xHeight;
						_b = this.font.bbox, minX = _b.minX, minY = _b.minY, maxX = _b.maxX, maxY = _b.maxY;
						fontDescriptor = context.obj((_c = {
							Type: "FontDescriptor",
							FontName: this.baseFontName,
							Flags: deriveFontFlags(this.font),
							FontBBox: [
								minX * scale,
								minY * scale,
								maxX * scale,
								maxY * scale
							],
							ItalicAngle: italicAngle,
							Ascent: ascent * scale,
							Descent: descent * scale,
							CapHeight: (capHeight || ascent) * scale,
							XHeight: (xHeight || 0) * scale,
							StemV: 0
						}, _c[this.isCFF() ? "FontFile3" : "FontFile2"] = fontStreamRef, _c));
						return [2, context.register(fontDescriptor)];
				}
			});
		});
	};
	CustomFontEmbedder.prototype.serializeFont = function() {
		return __awaiter(this, void 0, void 0, function() {
			return __generator(this, function(_a) {
				return [2, this.fontData];
			});
		});
	};
	CustomFontEmbedder.prototype.embedFontStream = function(context) {
		return __awaiter(this, void 0, void 0, function() {
			var fontStream, _a, _b;
			return __generator(this, function(_c) {
				switch (_c.label) {
					case 0:
						_b = (_a = context).flateStream;
						return [4, this.serializeFont()];
					case 1:
						fontStream = _b.apply(_a, [_c.sent(), { Subtype: this.isCFF() ? "CIDFontType0C" : void 0 }]);
						return [2, context.register(fontStream)];
				}
			});
		});
	};
	CustomFontEmbedder.prototype.embedUnicodeCmap = function(context) {
		var cmap = createCmap(this.glyphCache.access(), this.glyphId.bind(this));
		var cmapStream = context.flateStream(cmap);
		return context.register(cmapStream);
	};
	CustomFontEmbedder.prototype.glyphId = function(glyph) {
		return glyph ? glyph.id : -1;
	};
	CustomFontEmbedder.prototype.computeWidths = function() {
		var glyphs = this.glyphCache.access();
		var widths = [];
		var currSection = [];
		for (var idx = 0, len = glyphs.length; idx < len; idx++) {
			var currGlyph = glyphs[idx];
			var prevGlyph = glyphs[idx - 1];
			var currGlyphId = this.glyphId(currGlyph);
			var prevGlyphId = this.glyphId(prevGlyph);
			if (idx === 0) widths.push(currGlyphId);
			else if (currGlyphId - prevGlyphId !== 1) {
				widths.push(currSection);
				widths.push(currGlyphId);
				currSection = [];
			}
			currSection.push(currGlyph.advanceWidth * this.scale);
		}
		widths.push(currSection);
		return widths;
	};
	return CustomFontEmbedder;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/CustomFontSubsetEmbedder.js
/**
* A note of thanks to the developers of https://github.com/foliojs/pdfkit, as
* this class borrows from:
*   https://github.com/devongovett/pdfkit/blob/e71edab0dd4657b5a767804ba86c94c58d01fbca/lib/image/jpeg.coffee
*/
var CustomFontSubsetEmbedder = function(_super) {
	__extends(CustomFontSubsetEmbedder, _super);
	function CustomFontSubsetEmbedder(font, fontData, customFontName, fontFeatures) {
		var _this = _super.call(this, font, fontData, customFontName, fontFeatures) || this;
		_this.subset = _this.font.createSubset();
		_this.glyphs = [];
		_this.glyphCache = Cache.populatedBy(function() {
			return _this.glyphs;
		});
		_this.glyphIdMap = /* @__PURE__ */ new Map();
		return _this;
	}
	CustomFontSubsetEmbedder.for = function(fontkit, fontData, customFontName, fontFeatures) {
		return __awaiter(this, void 0, void 0, function() {
			var font;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0: return [4, fontkit.create(fontData)];
					case 1:
						font = _a.sent();
						return [2, new CustomFontSubsetEmbedder(font, fontData, customFontName, fontFeatures)];
				}
			});
		});
	};
	CustomFontSubsetEmbedder.prototype.encodeText = function(text) {
		var glyphs = this.font.layout(text, this.fontFeatures).glyphs;
		var hexCodes = new Array(glyphs.length);
		for (var idx = 0, len = glyphs.length; idx < len; idx++) {
			var glyph = glyphs[idx];
			var subsetGlyphId = this.subset.includeGlyph(glyph);
			this.glyphs[subsetGlyphId - 1] = glyph;
			this.glyphIdMap.set(glyph.id, subsetGlyphId);
			hexCodes[idx] = toHexStringOfMinLength(subsetGlyphId, 4);
		}
		this.glyphCache.invalidate();
		return PDFHexString.of(hexCodes.join(""));
	};
	CustomFontSubsetEmbedder.prototype.isCFF = function() {
		return this.subset.cff;
	};
	CustomFontSubsetEmbedder.prototype.glyphId = function(glyph) {
		return glyph ? this.glyphIdMap.get(glyph.id) : -1;
	};
	CustomFontSubsetEmbedder.prototype.serializeFont = function() {
		var _this = this;
		return new Promise(function(resolve, reject) {
			var parts = [];
			_this.subset.encodeStream().on("data", function(bytes) {
				return parts.push(bytes);
			}).on("end", function() {
				return resolve(mergeUint8Arrays(parts));
			}).on("error", function(err) {
				return reject(err);
			});
		});
	};
	return CustomFontSubsetEmbedder;
}(CustomFontEmbedder);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/FileEmbedder.js
/**
* From the PDF-A3 specification, section **3.1. Requirements - General**.
* See:
* * https://www.pdfa.org/wp-content/uploads/2018/10/PDF20_AN002-AF.pdf
*/
var AFRelationship;
(function(AFRelationship) {
	AFRelationship["Source"] = "Source";
	AFRelationship["Data"] = "Data";
	AFRelationship["Alternative"] = "Alternative";
	AFRelationship["Supplement"] = "Supplement";
	AFRelationship["EncryptedPayload"] = "EncryptedPayload";
	AFRelationship["FormData"] = "EncryptedPayload";
	AFRelationship["Schema"] = "Schema";
	AFRelationship["Unspecified"] = "Unspecified";
})(AFRelationship || (AFRelationship = {}));
var FileEmbedder = function() {
	function FileEmbedder(fileData, fileName, options) {
		if (options === void 0) options = {};
		this.fileData = fileData;
		this.fileName = fileName;
		this.options = options;
	}
	FileEmbedder.for = function(bytes, fileName, options) {
		if (options === void 0) options = {};
		return new FileEmbedder(bytes, fileName, options);
	};
	FileEmbedder.prototype.embedIntoContext = function(context, ref) {
		return __awaiter(this, void 0, void 0, function() {
			var _a, mimeType, description, creationDate, modificationDate, afRelationship, embeddedFileStream, embeddedFileStreamRef, fileSpecDict;
			return __generator(this, function(_b) {
				_a = this.options, mimeType = _a.mimeType, description = _a.description, creationDate = _a.creationDate, modificationDate = _a.modificationDate, afRelationship = _a.afRelationship;
				embeddedFileStream = context.flateStream(this.fileData, {
					Type: "EmbeddedFile",
					Subtype: mimeType !== null && mimeType !== void 0 ? mimeType : void 0,
					Params: {
						Size: this.fileData.length,
						CreationDate: creationDate ? PDFString.fromDate(creationDate) : void 0,
						ModDate: modificationDate ? PDFString.fromDate(modificationDate) : void 0
					}
				});
				embeddedFileStreamRef = context.register(embeddedFileStream);
				fileSpecDict = context.obj({
					Type: "Filespec",
					F: PDFString.of(this.fileName),
					UF: PDFHexString.fromText(this.fileName),
					EF: { F: embeddedFileStreamRef },
					Desc: description ? PDFHexString.fromText(description) : void 0,
					AFRelationship: afRelationship !== null && afRelationship !== void 0 ? afRelationship : void 0
				});
				if (ref) {
					context.assign(ref, fileSpecDict);
					return [2, ref];
				} else return [2, context.register(fileSpecDict)];
			});
		});
	};
	return FileEmbedder;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/JpegEmbedder.js
var MARKERS = [
	65472,
	65473,
	65474,
	65475,
	65477,
	65478,
	65479,
	65480,
	65481,
	65482,
	65483,
	65484,
	65485,
	65486,
	65487
];
var ColorSpace;
(function(ColorSpace) {
	ColorSpace["DeviceGray"] = "DeviceGray";
	ColorSpace["DeviceRGB"] = "DeviceRGB";
	ColorSpace["DeviceCMYK"] = "DeviceCMYK";
})(ColorSpace || (ColorSpace = {}));
var ChannelToColorSpace = {
	1: ColorSpace.DeviceGray,
	3: ColorSpace.DeviceRGB,
	4: ColorSpace.DeviceCMYK
};
/**
* A note of thanks to the developers of https://github.com/foliojs/pdfkit, as
* this class borrows from:
*   https://github.com/foliojs/pdfkit/blob/a6af76467ce06bd6a2af4aa7271ccac9ff152a7d/lib/image/jpeg.js
*/
var JpegEmbedder = function() {
	function JpegEmbedder(imageData, bitsPerComponent, width, height, colorSpace) {
		this.imageData = imageData;
		this.bitsPerComponent = bitsPerComponent;
		this.width = width;
		this.height = height;
		this.colorSpace = colorSpace;
	}
	JpegEmbedder.for = function(imageData) {
		return __awaiter(this, void 0, void 0, function() {
			var dataView, soi, pos, marker, bitsPerComponent, height, width, channelByte, channelName, colorSpace;
			return __generator(this, function(_a) {
				dataView = new DataView(imageData.buffer);
				soi = dataView.getUint16(0);
				if (soi !== 65496) throw new Error("SOI not found in JPEG");
				pos = 2;
				while (pos < dataView.byteLength) {
					marker = dataView.getUint16(pos);
					pos += 2;
					if (MARKERS.includes(marker)) break;
					pos += dataView.getUint16(pos);
				}
				if (!MARKERS.includes(marker)) throw new Error("Invalid JPEG");
				pos += 2;
				bitsPerComponent = dataView.getUint8(pos++);
				height = dataView.getUint16(pos);
				pos += 2;
				width = dataView.getUint16(pos);
				pos += 2;
				channelByte = dataView.getUint8(pos++);
				channelName = ChannelToColorSpace[channelByte];
				if (!channelName) throw new Error("Unknown JPEG channel.");
				colorSpace = channelName;
				return [2, new JpegEmbedder(imageData, bitsPerComponent, width, height, colorSpace)];
			});
		});
	};
	JpegEmbedder.prototype.embedIntoContext = function(context, ref) {
		return __awaiter(this, void 0, void 0, function() {
			var xObject;
			return __generator(this, function(_a) {
				xObject = context.stream(this.imageData, {
					Type: "XObject",
					Subtype: "Image",
					BitsPerComponent: this.bitsPerComponent,
					Width: this.width,
					Height: this.height,
					ColorSpace: this.colorSpace,
					Filter: "DCTDecode",
					Decode: this.colorSpace === ColorSpace.DeviceCMYK ? [
						1,
						0,
						1,
						0,
						1,
						0,
						1,
						0
					] : void 0
				});
				if (ref) {
					context.assign(ref, xObject);
					return [2, ref];
				} else return [2, context.register(xObject)];
			});
		});
	};
	return JpegEmbedder;
}();
//#endregion
//#region ../../node_modules/.pnpm/@pdf-lib+upng@1.0.1/node_modules/@pdf-lib/upng/UPNG.js
var UPNG = {};
UPNG.toRGBA8 = function(out) {
	var w = out.width, h = out.height;
	if (out.tabs.acTL == null) return [UPNG.toRGBA8.decodeImage(out.data, w, h, out).buffer];
	var frms = [];
	if (out.frames[0].data == null) out.frames[0].data = out.data;
	var len = w * h * 4, img = new Uint8Array(len), empty = new Uint8Array(len), prev = new Uint8Array(len);
	for (var i = 0; i < out.frames.length; i++) {
		var frm = out.frames[i];
		var fx = frm.rect.x, fy = frm.rect.y, fw = frm.rect.width, fh = frm.rect.height;
		var fdata = UPNG.toRGBA8.decodeImage(frm.data, fw, fh, out);
		if (i != 0) for (var j = 0; j < len; j++) prev[j] = img[j];
		if (frm.blend == 0) UPNG._copyTile(fdata, fw, fh, img, w, h, fx, fy, 0);
		else if (frm.blend == 1) UPNG._copyTile(fdata, fw, fh, img, w, h, fx, fy, 1);
		frms.push(img.buffer.slice(0));
		if (frm.dispose == 0) {} else if (frm.dispose == 1) UPNG._copyTile(empty, fw, fh, img, w, h, fx, fy, 0);
		else if (frm.dispose == 2) for (var j = 0; j < len; j++) img[j] = prev[j];
	}
	return frms;
};
UPNG.toRGBA8.decodeImage = function(data, w, h, out) {
	var area = w * h, bpp = UPNG.decode._getBPP(out);
	var bpl = Math.ceil(w * bpp / 8);
	var bf = new Uint8Array(area * 4), bf32 = new Uint32Array(bf.buffer);
	var ctype = out.ctype, depth = out.depth;
	var rs = UPNG._bin.readUshort;
	if (ctype == 6) {
		var qarea = area << 2;
		if (depth == 8) for (var i = 0; i < qarea; i += 4) {
			bf[i] = data[i];
			bf[i + 1] = data[i + 1];
			bf[i + 2] = data[i + 2];
			bf[i + 3] = data[i + 3];
		}
		if (depth == 16) for (var i = 0; i < qarea; i++) bf[i] = data[i << 1];
	} else if (ctype == 2) {
		var ts = out.tabs["tRNS"];
		if (ts == null) {
			if (depth == 8) for (var i = 0; i < area; i++) {
				var ti = i * 3;
				bf32[i] = 255 << 24 | data[ti + 2] << 16 | data[ti + 1] << 8 | data[ti];
			}
			if (depth == 16) for (var i = 0; i < area; i++) {
				var ti = i * 6;
				bf32[i] = 255 << 24 | data[ti + 4] << 16 | data[ti + 2] << 8 | data[ti];
			}
		} else {
			var tr = ts[0], tg = ts[1], tb = ts[2];
			if (depth == 8) for (var i = 0; i < area; i++) {
				var qi = i << 2, ti = i * 3;
				bf32[i] = 255 << 24 | data[ti + 2] << 16 | data[ti + 1] << 8 | data[ti];
				if (data[ti] == tr && data[ti + 1] == tg && data[ti + 2] == tb) bf[qi + 3] = 0;
			}
			if (depth == 16) for (var i = 0; i < area; i++) {
				var qi = i << 2, ti = i * 6;
				bf32[i] = 255 << 24 | data[ti + 4] << 16 | data[ti + 2] << 8 | data[ti];
				if (rs(data, ti) == tr && rs(data, ti + 2) == tg && rs(data, ti + 4) == tb) bf[qi + 3] = 0;
			}
		}
	} else if (ctype == 3) {
		var p = out.tabs["PLTE"], ap = out.tabs["tRNS"], tl = ap ? ap.length : 0;
		if (depth == 1) for (var y = 0; y < h; y++) {
			var s0 = y * bpl, t0 = y * w;
			for (var i = 0; i < w; i++) {
				var qi = t0 + i << 2, j = data[s0 + (i >> 3)] >> 7 - ((i & 7) << 0) & 1, cj = 3 * j;
				bf[qi] = p[cj];
				bf[qi + 1] = p[cj + 1];
				bf[qi + 2] = p[cj + 2];
				bf[qi + 3] = j < tl ? ap[j] : 255;
			}
		}
		if (depth == 2) for (var y = 0; y < h; y++) {
			var s0 = y * bpl, t0 = y * w;
			for (var i = 0; i < w; i++) {
				var qi = t0 + i << 2, j = data[s0 + (i >> 2)] >> 6 - ((i & 3) << 1) & 3, cj = 3 * j;
				bf[qi] = p[cj];
				bf[qi + 1] = p[cj + 1];
				bf[qi + 2] = p[cj + 2];
				bf[qi + 3] = j < tl ? ap[j] : 255;
			}
		}
		if (depth == 4) for (var y = 0; y < h; y++) {
			var s0 = y * bpl, t0 = y * w;
			for (var i = 0; i < w; i++) {
				var qi = t0 + i << 2, j = data[s0 + (i >> 1)] >> 4 - ((i & 1) << 2) & 15, cj = 3 * j;
				bf[qi] = p[cj];
				bf[qi + 1] = p[cj + 1];
				bf[qi + 2] = p[cj + 2];
				bf[qi + 3] = j < tl ? ap[j] : 255;
			}
		}
		if (depth == 8) for (var i = 0; i < area; i++) {
			var qi = i << 2, j = data[i], cj = 3 * j;
			bf[qi] = p[cj];
			bf[qi + 1] = p[cj + 1];
			bf[qi + 2] = p[cj + 2];
			bf[qi + 3] = j < tl ? ap[j] : 255;
		}
	} else if (ctype == 4) {
		if (depth == 8) for (var i = 0; i < area; i++) {
			var qi = i << 2, di = i << 1, gr = data[di];
			bf[qi] = gr;
			bf[qi + 1] = gr;
			bf[qi + 2] = gr;
			bf[qi + 3] = data[di + 1];
		}
		if (depth == 16) for (var i = 0; i < area; i++) {
			var qi = i << 2, di = i << 2, gr = data[di];
			bf[qi] = gr;
			bf[qi + 1] = gr;
			bf[qi + 2] = gr;
			bf[qi + 3] = data[di + 2];
		}
	} else if (ctype == 0) {
		var tr = out.tabs["tRNS"] ? out.tabs["tRNS"] : -1;
		for (var y = 0; y < h; y++) {
			var off = y * bpl, to = y * w;
			if (depth == 1) for (var x = 0; x < w; x++) {
				var gr = 255 * (data[off + (x >>> 3)] >>> 7 - (x & 7) & 1), al = gr == tr * 255 ? 0 : 255;
				bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
			}
			else if (depth == 2) for (var x = 0; x < w; x++) {
				var gr = 85 * (data[off + (x >>> 2)] >>> 6 - ((x & 3) << 1) & 3), al = gr == tr * 85 ? 0 : 255;
				bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
			}
			else if (depth == 4) for (var x = 0; x < w; x++) {
				var gr = 17 * (data[off + (x >>> 1)] >>> 4 - ((x & 1) << 2) & 15), al = gr == tr * 17 ? 0 : 255;
				bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
			}
			else if (depth == 8) for (var x = 0; x < w; x++) {
				var gr = data[off + x], al = gr == tr ? 0 : 255;
				bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
			}
			else if (depth == 16) for (var x = 0; x < w; x++) {
				var gr = data[off + (x << 1)], al = rs(data, off + (x << i)) == tr ? 0 : 255;
				bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
			}
		}
	}
	return bf;
};
UPNG.decode = function(buff) {
	var data = new Uint8Array(buff), offset = 8, bin = UPNG._bin, rUs = bin.readUshort, rUi = bin.readUint;
	var out = {
		tabs: {},
		frames: []
	};
	var dd = new Uint8Array(data.length), doff = 0;
	var fd, foff = 0;
	var mgck = [
		137,
		80,
		78,
		71,
		13,
		10,
		26,
		10
	];
	for (var i = 0; i < 8; i++) if (data[i] != mgck[i]) throw "The input is not a PNG file!";
	while (offset < data.length) {
		var len = bin.readUint(data, offset);
		offset += 4;
		var type = bin.readASCII(data, offset, 4);
		offset += 4;
		if (type == "IHDR") UPNG.decode._IHDR(data, offset, out);
		else if (type == "IDAT") {
			for (var i = 0; i < len; i++) dd[doff + i] = data[offset + i];
			doff += len;
		} else if (type == "acTL") {
			out.tabs[type] = {
				num_frames: rUi(data, offset),
				num_plays: rUi(data, offset + 4)
			};
			fd = new Uint8Array(data.length);
		} else if (type == "fcTL") {
			if (foff != 0) {
				var fr = out.frames[out.frames.length - 1];
				fr.data = UPNG.decode._decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
				foff = 0;
			}
			var rct = {
				x: rUi(data, offset + 12),
				y: rUi(data, offset + 16),
				width: rUi(data, offset + 4),
				height: rUi(data, offset + 8)
			};
			var del = rUs(data, offset + 22);
			del = rUs(data, offset + 20) / (del == 0 ? 100 : del);
			var frm = {
				rect: rct,
				delay: Math.round(del * 1e3),
				dispose: data[offset + 24],
				blend: data[offset + 25]
			};
			out.frames.push(frm);
		} else if (type == "fdAT") {
			for (var i = 0; i < len - 4; i++) fd[foff + i] = data[offset + i + 4];
			foff += len - 4;
		} else if (type == "pHYs") out.tabs[type] = [
			bin.readUint(data, offset),
			bin.readUint(data, offset + 4),
			data[offset + 8]
		];
		else if (type == "cHRM") {
			out.tabs[type] = [];
			for (var i = 0; i < 8; i++) out.tabs[type].push(bin.readUint(data, offset + i * 4));
		} else if (type == "tEXt") {
			if (out.tabs[type] == null) out.tabs[type] = {};
			var nz = bin.nextZero(data, offset);
			var keyw = bin.readASCII(data, offset, nz - offset);
			var text = bin.readASCII(data, nz + 1, offset + len - nz - 1);
			out.tabs[type][keyw] = text;
		} else if (type == "iTXt") {
			if (out.tabs[type] == null) out.tabs[type] = {};
			var nz = 0, off = offset;
			nz = bin.nextZero(data, off);
			var keyw = bin.readASCII(data, off, nz - off);
			off = nz + 1;
			data[off];
			data[off + 1];
			off += 2;
			nz = bin.nextZero(data, off);
			bin.readASCII(data, off, nz - off);
			off = nz + 1;
			nz = bin.nextZero(data, off);
			bin.readUTF8(data, off, nz - off);
			off = nz + 1;
			var text = bin.readUTF8(data, off, len - (off - offset));
			out.tabs[type][keyw] = text;
		} else if (type == "PLTE") out.tabs[type] = bin.readBytes(data, offset, len);
		else if (type == "hIST") {
			var pl = out.tabs["PLTE"].length / 3;
			out.tabs[type] = [];
			for (var i = 0; i < pl; i++) out.tabs[type].push(rUs(data, offset + i * 2));
		} else if (type == "tRNS") {
			if (out.ctype == 3) out.tabs[type] = bin.readBytes(data, offset, len);
			else if (out.ctype == 0) out.tabs[type] = rUs(data, offset);
			else if (out.ctype == 2) out.tabs[type] = [
				rUs(data, offset),
				rUs(data, offset + 2),
				rUs(data, offset + 4)
			];
		} else if (type == "gAMA") out.tabs[type] = bin.readUint(data, offset) / 1e5;
		else if (type == "sRGB") out.tabs[type] = data[offset];
		else if (type == "bKGD") {
			if (out.ctype == 0 || out.ctype == 4) out.tabs[type] = [rUs(data, offset)];
			else if (out.ctype == 2 || out.ctype == 6) out.tabs[type] = [
				rUs(data, offset),
				rUs(data, offset + 2),
				rUs(data, offset + 4)
			];
			else if (out.ctype == 3) out.tabs[type] = data[offset];
		} else if (type == "IEND") break;
		offset += len;
		bin.readUint(data, offset);
		offset += 4;
	}
	if (foff != 0) {
		var fr = out.frames[out.frames.length - 1];
		fr.data = UPNG.decode._decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
		foff = 0;
	}
	out.data = UPNG.decode._decompress(out, dd, out.width, out.height);
	delete out.compress;
	delete out.interlace;
	delete out.filter;
	return out;
};
UPNG.decode._decompress = function(out, dd, w, h) {
	var bpp = UPNG.decode._getBPP(out), bpl = Math.ceil(w * bpp / 8), buff = new Uint8Array((bpl + 1 + out.interlace) * h);
	dd = UPNG.decode._inflate(dd, buff);
	if (out.interlace == 0) dd = UPNG.decode._filterZero(dd, out, 0, w, h);
	else if (out.interlace == 1) dd = UPNG.decode._readInterlace(dd, out);
	return dd;
};
UPNG.decode._inflate = function(data, buff) {
	return UPNG["inflateRaw"](new Uint8Array(data.buffer, 2, data.length - 6), buff);
};
UPNG.inflateRaw = function() {
	var H = {};
	H.H = {};
	H.H.N = function(N, W) {
		var R = Uint8Array, i = 0, m = 0, J = 0, h = 0, Q = 0, X = 0, u = 0, w = 0, d = 0, v, C;
		if (N[0] == 3 && N[1] == 0) return W ? W : new R(0);
		var V = H.H, n = V.b, A = V.e, l = V.R, M = V.n, I = V.A, e = V.Z, b = V.m, Z = W == null;
		if (Z) W = new R(N.length >>> 2 << 3);
		while (i == 0) {
			i = n(N, d, 1);
			m = n(N, d + 1, 2);
			d += 3;
			if (m == 0) {
				if ((d & 7) != 0) d += 8 - (d & 7);
				var D = (d >>> 3) + 4, q = N[D - 4] | N[D - 3] << 8;
				if (Z) W = H.H.W(W, w + q);
				W.set(new R(N.buffer, N.byteOffset + D, q), w);
				d = D + q << 3;
				w += q;
				continue;
			}
			if (Z) W = H.H.W(W, w + (1 << 17));
			if (m == 1) {
				v = b.J;
				C = b.h;
				X = 511;
				u = 31;
			}
			if (m == 2) {
				J = A(N, d, 5) + 257;
				h = A(N, d + 5, 5) + 1;
				Q = A(N, d + 10, 4) + 4;
				d += 14;
				var j = 1;
				for (var c = 0; c < 38; c += 2) {
					b.Q[c] = 0;
					b.Q[c + 1] = 0;
				}
				for (var c = 0; c < Q; c++) {
					var K = A(N, d + c * 3, 3);
					b.Q[(b.X[c] << 1) + 1] = K;
					if (K > j) j = K;
				}
				d += 3 * Q;
				M(b.Q, j);
				I(b.Q, j, b.u);
				v = b.w;
				C = b.d;
				d = l(b.u, (1 << j) - 1, J + h, N, d, b.v);
				var r = V.V(b.v, 0, J, b.C);
				X = (1 << r) - 1;
				var S = V.V(b.v, J, h, b.D);
				u = (1 << S) - 1;
				M(b.C, r);
				I(b.C, r, v);
				M(b.D, S);
				I(b.D, S, C);
			}
			while (!0) {
				var T = v[e(N, d) & X];
				d += T & 15;
				var p = T >>> 4;
				if (p >>> 8 == 0) W[w++] = p;
				else if (p == 256) break;
				else {
					var z = w + p - 254;
					if (p > 264) {
						var _ = b.q[p - 257];
						z = w + (_ >>> 3) + A(N, d, _ & 7);
						d += _ & 7;
					}
					var $ = C[e(N, d) & u];
					d += $ & 15;
					var s = $ >>> 4, Y = b.c[s], a = (Y >>> 4) + n(N, d, Y & 15);
					d += Y & 15;
					while (w < z) {
						W[w] = W[w++ - a];
						W[w] = W[w++ - a];
						W[w] = W[w++ - a];
						W[w] = W[w++ - a];
					}
					w = z;
				}
			}
		}
		return W.length == w ? W : W.slice(0, w);
	};
	H.H.W = function(N, W) {
		var R = N.length;
		if (W <= R) return N;
		var V = new Uint8Array(R << 1);
		V.set(N, 0);
		return V;
	};
	H.H.R = function(N, W, R, V, n, A) {
		var l = H.H.e, M = H.H.Z, I = 0;
		while (I < R) {
			var e = N[M(V, n) & W];
			n += e & 15;
			var b = e >>> 4;
			if (b <= 15) {
				A[I] = b;
				I++;
			} else {
				var Z = 0, m = 0;
				if (b == 16) {
					m = 3 + l(V, n, 2);
					n += 2;
					Z = A[I - 1];
				} else if (b == 17) {
					m = 3 + l(V, n, 3);
					n += 3;
				} else if (b == 18) {
					m = 11 + l(V, n, 7);
					n += 7;
				}
				var J = I + m;
				while (I < J) {
					A[I] = Z;
					I++;
				}
			}
		}
		return n;
	};
	H.H.V = function(N, W, R, V) {
		var n = 0, A = 0, l = V.length >>> 1;
		while (A < R) {
			var M = N[A + W];
			V[A << 1] = 0;
			V[(A << 1) + 1] = M;
			if (M > n) n = M;
			A++;
		}
		while (A < l) {
			V[A << 1] = 0;
			V[(A << 1) + 1] = 0;
			A++;
		}
		return n;
	};
	H.H.n = function(N, W) {
		var R = H.H.m, V = N.length, n, A, l, M, I, e = R.j;
		for (var M = 0; M <= W; M++) e[M] = 0;
		for (M = 1; M < V; M += 2) e[N[M]]++;
		var b = R.K;
		n = 0;
		e[0] = 0;
		for (A = 1; A <= W; A++) {
			n = n + e[A - 1] << 1;
			b[A] = n;
		}
		for (l = 0; l < V; l += 2) {
			I = N[l + 1];
			if (I != 0) {
				N[l] = b[I];
				b[I]++;
			}
		}
	};
	H.H.A = function(N, W, R) {
		var V = N.length, A = H.H.m.r;
		for (var l = 0; l < V; l += 2) if (N[l + 1] != 0) {
			var M = l >> 1, I = N[l + 1], e = M << 4 | I, b = W - I, Z = N[l] << b, m = Z + (1 << b);
			while (Z != m) {
				var J = A[Z] >>> 15 - W;
				R[J] = e;
				Z++;
			}
		}
	};
	H.H.l = function(N, W) {
		var R = H.H.m.r, V = 15 - W;
		for (var n = 0; n < N.length; n += 2) {
			var A = N[n] << W - N[n + 1];
			N[n] = R[A] >>> V;
		}
	};
	H.H.M = function(N, W, R) {
		R = R << (W & 7);
		var V = W >>> 3;
		N[V] |= R;
		N[V + 1] |= R >>> 8;
	};
	H.H.I = function(N, W, R) {
		R = R << (W & 7);
		var V = W >>> 3;
		N[V] |= R;
		N[V + 1] |= R >>> 8;
		N[V + 2] |= R >>> 16;
	};
	H.H.e = function(N, W, R) {
		return (N[W >>> 3] | N[(W >>> 3) + 1] << 8) >>> (W & 7) & (1 << R) - 1;
	};
	H.H.b = function(N, W, R) {
		return (N[W >>> 3] | N[(W >>> 3) + 1] << 8 | N[(W >>> 3) + 2] << 16) >>> (W & 7) & (1 << R) - 1;
	};
	H.H.Z = function(N, W) {
		return (N[W >>> 3] | N[(W >>> 3) + 1] << 8 | N[(W >>> 3) + 2] << 16) >>> (W & 7);
	};
	H.H.i = function(N, W) {
		return (N[W >>> 3] | N[(W >>> 3) + 1] << 8 | N[(W >>> 3) + 2] << 16 | N[(W >>> 3) + 3] << 24) >>> (W & 7);
	};
	H.H.m = function() {
		var N = Uint16Array, W = Uint32Array;
		return {
			K: new N(16),
			j: new N(16),
			X: [
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
			],
			S: [
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
				999,
				999,
				999
			],
			T: [
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
				0,
				0,
				0,
				0
			],
			q: new N(32),
			p: [
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
				65535,
				65535
			],
			z: [
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
				13,
				0,
				0
			],
			c: new W(32),
			J: new N(512),
			_: [],
			h: new N(32),
			$: [],
			w: new N(32768),
			C: [],
			v: [],
			d: new N(32768),
			D: [],
			u: new N(512),
			Q: [],
			r: new N(32768),
			s: new W(286),
			Y: new W(30),
			a: new W(19),
			t: new W(15e3),
			k: new N(65536),
			g: new N(32768)
		};
	}();
	(function() {
		var N = H.H.m, W = 32768;
		for (var R = 0; R < W; R++) {
			var V = R;
			V = (V & 2863311530) >>> 1 | (V & 1431655765) << 1;
			V = (V & 3435973836) >>> 2 | (V & 858993459) << 2;
			V = (V & 4042322160) >>> 4 | (V & 252645135) << 4;
			V = (V & 4278255360) >>> 8 | (V & 16711935) << 8;
			N.r[R] = (V >>> 16 | V << 16) >>> 17;
		}
		function n(A, l, M) {
			while (l-- != 0) A.push(0, M);
		}
		for (var R = 0; R < 32; R++) {
			N.q[R] = N.S[R] << 3 | N.T[R];
			N.c[R] = N.p[R] << 4 | N.z[R];
		}
		n(N._, 144, 8);
		n(N._, 112, 9);
		n(N._, 24, 7);
		n(N._, 8, 8);
		H.H.n(N._, 9);
		H.H.A(N._, 9, N.J);
		H.H.l(N._, 9);
		n(N.$, 32, 5);
		H.H.n(N.$, 5);
		H.H.A(N.$, 5, N.h);
		H.H.l(N.$, 5);
		n(N.Q, 19, 0);
		n(N.C, 286, 0);
		n(N.D, 30, 0);
		n(N.v, 320, 0);
	})();
	return H.H.N;
}();
UPNG.decode._readInterlace = function(data, out) {
	var w = out.width, h = out.height;
	var bpp = UPNG.decode._getBPP(out), cbpp = bpp >> 3, bpl = Math.ceil(w * bpp / 8);
	var img = new Uint8Array(h * bpl);
	var di = 0;
	var starting_row = [
		0,
		0,
		4,
		0,
		2,
		0,
		1
	];
	var starting_col = [
		0,
		4,
		0,
		2,
		0,
		1,
		0
	];
	var row_increment = [
		8,
		8,
		8,
		4,
		4,
		2,
		2
	];
	var col_increment = [
		8,
		8,
		4,
		4,
		2,
		2,
		1
	];
	var pass = 0;
	while (pass < 7) {
		var ri = row_increment[pass], ci = col_increment[pass];
		var sw = 0, sh = 0;
		var cr = starting_row[pass];
		while (cr < h) {
			cr += ri;
			sh++;
		}
		var cc = starting_col[pass];
		while (cc < w) {
			cc += ci;
			sw++;
		}
		var bpll = Math.ceil(sw * bpp / 8);
		UPNG.decode._filterZero(data, out, di, sw, sh);
		var y = 0, row = starting_row[pass];
		while (row < h) {
			var col = starting_col[pass];
			var cdi = di + y * bpll << 3;
			while (col < w) {
				if (bpp == 1) {
					var val = data[cdi >> 3];
					val = val >> 7 - (cdi & 7) & 1;
					img[row * bpl + (col >> 3)] |= val << 7 - ((col & 7) << 0);
				}
				if (bpp == 2) {
					var val = data[cdi >> 3];
					val = val >> 6 - (cdi & 7) & 3;
					img[row * bpl + (col >> 2)] |= val << 6 - ((col & 3) << 1);
				}
				if (bpp == 4) {
					var val = data[cdi >> 3];
					val = val >> 4 - (cdi & 7) & 15;
					img[row * bpl + (col >> 1)] |= val << 4 - ((col & 1) << 2);
				}
				if (bpp >= 8) {
					var ii = row * bpl + col * cbpp;
					for (var j = 0; j < cbpp; j++) img[ii + j] = data[(cdi >> 3) + j];
				}
				cdi += bpp;
				col += ci;
			}
			y++;
			row += ri;
		}
		if (sw * sh != 0) di += sh * (1 + bpll);
		pass = pass + 1;
	}
	return img;
};
UPNG.decode._getBPP = function(out) {
	return [
		1,
		null,
		3,
		1,
		2,
		null,
		4
	][out.ctype] * out.depth;
};
UPNG.decode._filterZero = function(data, out, off, w, h) {
	var bpp = UPNG.decode._getBPP(out), bpl = Math.ceil(w * bpp / 8), paeth = UPNG.decode._paeth;
	bpp = Math.ceil(bpp / 8);
	var i = 0, di = 1, type = data[off], x = 0;
	if (type > 1) data[off] = [
		0,
		0,
		1
	][type - 2];
	if (type == 3) for (x = bpp; x < bpl; x++) data[x + 1] = data[x + 1] + (data[x + 1 - bpp] >>> 1) & 255;
	for (var y = 0; y < h; y++) {
		i = off + y * bpl;
		di = i + y + 1;
		type = data[di - 1];
		x = 0;
		if (type == 0) for (; x < bpl; x++) data[i + x] = data[di + x];
		else if (type == 1) {
			for (; x < bpp; x++) data[i + x] = data[di + x];
			for (; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpp];
		} else if (type == 2) for (; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpl];
		else if (type == 3) {
			for (; x < bpp; x++) data[i + x] = data[di + x] + (data[i + x - bpl] >>> 1);
			for (; x < bpl; x++) data[i + x] = data[di + x] + (data[i + x - bpl] + data[i + x - bpp] >>> 1);
		} else {
			for (; x < bpp; x++) data[i + x] = data[di + x] + paeth(0, data[i + x - bpl], 0);
			for (; x < bpl; x++) data[i + x] = data[di + x] + paeth(data[i + x - bpp], data[i + x - bpl], data[i + x - bpp - bpl]);
		}
	}
	return data;
};
UPNG.decode._paeth = function(a, b, c) {
	var p = a + b - c, pa = p - a, pb = p - b, pc = p - c;
	if (pa * pa <= pb * pb && pa * pa <= pc * pc) return a;
	else if (pb * pb <= pc * pc) return b;
	return c;
};
UPNG.decode._IHDR = function(data, offset, out) {
	var bin = UPNG._bin;
	out.width = bin.readUint(data, offset);
	offset += 4;
	out.height = bin.readUint(data, offset);
	offset += 4;
	out.depth = data[offset];
	offset++;
	out.ctype = data[offset];
	offset++;
	out.compress = data[offset];
	offset++;
	out.filter = data[offset];
	offset++;
	out.interlace = data[offset];
	offset++;
};
UPNG._bin = {
	nextZero: function(data, p) {
		while (data[p] != 0) p++;
		return p;
	},
	readUshort: function(buff, p) {
		return buff[p] << 8 | buff[p + 1];
	},
	writeUshort: function(buff, p, n) {
		buff[p] = n >> 8 & 255;
		buff[p + 1] = n & 255;
	},
	readUint: function(buff, p) {
		return buff[p] * 16777216 + (buff[p + 1] << 16 | buff[p + 2] << 8 | buff[p + 3]);
	},
	writeUint: function(buff, p, n) {
		buff[p] = n >> 24 & 255;
		buff[p + 1] = n >> 16 & 255;
		buff[p + 2] = n >> 8 & 255;
		buff[p + 3] = n & 255;
	},
	readASCII: function(buff, p, l) {
		var s = "";
		for (var i = 0; i < l; i++) s += String.fromCharCode(buff[p + i]);
		return s;
	},
	writeASCII: function(data, p, s) {
		for (var i = 0; i < s.length; i++) data[p + i] = s.charCodeAt(i);
	},
	readBytes: function(buff, p, l) {
		var arr = [];
		for (var i = 0; i < l; i++) arr.push(buff[p + i]);
		return arr;
	},
	pad: function(n) {
		return n.length < 2 ? "0" + n : n;
	},
	readUTF8: function(buff, p, l) {
		var s = "", ns;
		for (var i = 0; i < l; i++) s += "%" + UPNG._bin.pad(buff[p + i].toString(16));
		try {
			ns = decodeURIComponent(s);
		} catch (e) {
			return UPNG._bin.readASCII(buff, p, l);
		}
		return ns;
	}
};
UPNG._copyTile = function(sb, sw, sh, tb, tw, th, xoff, yoff, mode) {
	var w = Math.min(sw, tw), h = Math.min(sh, th);
	var si = 0, ti = 0;
	for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
		if (xoff >= 0 && yoff >= 0) {
			si = y * sw + x << 2;
			ti = (yoff + y) * tw + xoff + x << 2;
		} else {
			si = (-yoff + y) * sw - xoff + x << 2;
			ti = y * tw + x << 2;
		}
		if (mode == 0) {
			tb[ti] = sb[si];
			tb[ti + 1] = sb[si + 1];
			tb[ti + 2] = sb[si + 2];
			tb[ti + 3] = sb[si + 3];
		} else if (mode == 1) {
			var fa = sb[si + 3] * (1 / 255), fr = sb[si] * fa, fg = sb[si + 1] * fa, fb = sb[si + 2] * fa;
			var ba = tb[ti + 3] * (1 / 255), br = tb[ti] * ba, bg = tb[ti + 1] * ba, bb = tb[ti + 2] * ba;
			var ifa = 1 - fa, oa = fa + ba * ifa, ioa = oa == 0 ? 0 : 1 / oa;
			tb[ti + 3] = 255 * oa;
			tb[ti + 0] = (fr + br * ifa) * ioa;
			tb[ti + 1] = (fg + bg * ifa) * ioa;
			tb[ti + 2] = (fb + bb * ifa) * ioa;
		} else if (mode == 2) {
			var fa = sb[si + 3], fr = sb[si], fg = sb[si + 1], fb = sb[si + 2];
			var ba = tb[ti + 3], br = tb[ti], bg = tb[ti + 1], bb = tb[ti + 2];
			if (fa == ba && fr == br && fg == bg && fb == bb) {
				tb[ti] = 0;
				tb[ti + 1] = 0;
				tb[ti + 2] = 0;
				tb[ti + 3] = 0;
			} else {
				tb[ti] = fr;
				tb[ti + 1] = fg;
				tb[ti + 2] = fb;
				tb[ti + 3] = fa;
			}
		} else if (mode == 3) {
			var fa = sb[si + 3], fr = sb[si], fg = sb[si + 1], fb = sb[si + 2];
			var ba = tb[ti + 3], br = tb[ti], bg = tb[ti + 1], bb = tb[ti + 2];
			if (fa == ba && fr == br && fg == bg && fb == bb) continue;
			if (fa < 220 && ba > 20) return false;
		}
	}
	return true;
};
UPNG.encode = function(bufs, w, h, ps, dels, tabs, forbidPlte) {
	if (ps == null) ps = 0;
	if (forbidPlte == null) forbidPlte = false;
	var nimg = UPNG.encode.compress(bufs, w, h, ps, [
		false,
		false,
		false,
		0,
		forbidPlte
	]);
	UPNG.encode.compressPNG(nimg, -1);
	return UPNG.encode._main(nimg, w, h, dels, tabs);
};
UPNG.encodeLL = function(bufs, w, h, cc, ac, depth, dels, tabs) {
	var nimg = {
		ctype: 0 + (cc == 1 ? 0 : 2) + (ac == 0 ? 0 : 4),
		depth,
		frames: []
	};
	var bipp = (cc + ac) * depth, bipl = bipp * w;
	for (var i = 0; i < bufs.length; i++) nimg.frames.push({
		rect: {
			x: 0,
			y: 0,
			width: w,
			height: h
		},
		img: new Uint8Array(bufs[i]),
		blend: 0,
		dispose: 1,
		bpp: Math.ceil(bipp / 8),
		bpl: Math.ceil(bipl / 8)
	});
	UPNG.encode.compressPNG(nimg, 0, true);
	return UPNG.encode._main(nimg, w, h, dels, tabs);
};
UPNG.encode._main = function(nimg, w, h, dels, tabs) {
	if (tabs == null) tabs = {};
	var crc = UPNG.crc.crc, wUi = UPNG._bin.writeUint, wUs = UPNG._bin.writeUshort, wAs = UPNG._bin.writeASCII;
	var offset = 8, anim = nimg.frames.length > 1, pltAlpha = false;
	var leng = 33 + (anim ? 20 : 0);
	if (tabs["sRGB"] != null) leng += 13;
	if (tabs["pHYs"] != null) leng += 21;
	if (nimg.ctype == 3) {
		var dl = nimg.plte.length;
		for (var i = 0; i < dl; i++) if (nimg.plte[i] >>> 24 != 255) pltAlpha = true;
		leng += 8 + dl * 3 + 4 + (pltAlpha ? 8 + dl * 1 + 4 : 0);
	}
	for (var j = 0; j < nimg.frames.length; j++) {
		var fr = nimg.frames[j];
		if (anim) leng += 38;
		leng += fr.cimg.length + 12;
		if (j != 0) leng += 4;
	}
	leng += 12;
	var data = new Uint8Array(leng);
	var wr = [
		137,
		80,
		78,
		71,
		13,
		10,
		26,
		10
	];
	for (var i = 0; i < 8; i++) data[i] = wr[i];
	wUi(data, offset, 13);
	offset += 4;
	wAs(data, offset, "IHDR");
	offset += 4;
	wUi(data, offset, w);
	offset += 4;
	wUi(data, offset, h);
	offset += 4;
	data[offset] = nimg.depth;
	offset++;
	data[offset] = nimg.ctype;
	offset++;
	data[offset] = 0;
	offset++;
	data[offset] = 0;
	offset++;
	data[offset] = 0;
	offset++;
	wUi(data, offset, crc(data, offset - 17, 17));
	offset += 4;
	if (tabs["sRGB"] != null) {
		wUi(data, offset, 1);
		offset += 4;
		wAs(data, offset, "sRGB");
		offset += 4;
		data[offset] = tabs["sRGB"];
		offset++;
		wUi(data, offset, crc(data, offset - 5, 5));
		offset += 4;
	}
	if (tabs["pHYs"] != null) {
		wUi(data, offset, 9);
		offset += 4;
		wAs(data, offset, "pHYs");
		offset += 4;
		wUi(data, offset, tabs["pHYs"][0]);
		offset += 4;
		wUi(data, offset, tabs["pHYs"][1]);
		offset += 4;
		data[offset] = tabs["pHYs"][2];
		offset++;
		wUi(data, offset, crc(data, offset - 13, 13));
		offset += 4;
	}
	if (anim) {
		wUi(data, offset, 8);
		offset += 4;
		wAs(data, offset, "acTL");
		offset += 4;
		wUi(data, offset, nimg.frames.length);
		offset += 4;
		wUi(data, offset, tabs["loop"] != null ? tabs["loop"] : 0);
		offset += 4;
		wUi(data, offset, crc(data, offset - 12, 12));
		offset += 4;
	}
	if (nimg.ctype == 3) {
		var dl = nimg.plte.length;
		wUi(data, offset, dl * 3);
		offset += 4;
		wAs(data, offset, "PLTE");
		offset += 4;
		for (var i = 0; i < dl; i++) {
			var ti = i * 3, c = nimg.plte[i], r = c & 255, g = c >>> 8 & 255, b = c >>> 16 & 255;
			data[offset + ti + 0] = r;
			data[offset + ti + 1] = g;
			data[offset + ti + 2] = b;
		}
		offset += dl * 3;
		wUi(data, offset, crc(data, offset - dl * 3 - 4, dl * 3 + 4));
		offset += 4;
		if (pltAlpha) {
			wUi(data, offset, dl);
			offset += 4;
			wAs(data, offset, "tRNS");
			offset += 4;
			for (var i = 0; i < dl; i++) data[offset + i] = nimg.plte[i] >>> 24 & 255;
			offset += dl;
			wUi(data, offset, crc(data, offset - dl - 4, dl + 4));
			offset += 4;
		}
	}
	var fi = 0;
	for (var j = 0; j < nimg.frames.length; j++) {
		var fr = nimg.frames[j];
		if (anim) {
			wUi(data, offset, 26);
			offset += 4;
			wAs(data, offset, "fcTL");
			offset += 4;
			wUi(data, offset, fi++);
			offset += 4;
			wUi(data, offset, fr.rect.width);
			offset += 4;
			wUi(data, offset, fr.rect.height);
			offset += 4;
			wUi(data, offset, fr.rect.x);
			offset += 4;
			wUi(data, offset, fr.rect.y);
			offset += 4;
			wUs(data, offset, dels[j]);
			offset += 2;
			wUs(data, offset, 1e3);
			offset += 2;
			data[offset] = fr.dispose;
			offset++;
			data[offset] = fr.blend;
			offset++;
			wUi(data, offset, crc(data, offset - 30, 30));
			offset += 4;
		}
		var imgd = fr.cimg, dl = imgd.length;
		wUi(data, offset, dl + (j == 0 ? 0 : 4));
		offset += 4;
		var ioff = offset;
		wAs(data, offset, j == 0 ? "IDAT" : "fdAT");
		offset += 4;
		if (j != 0) {
			wUi(data, offset, fi++);
			offset += 4;
		}
		data.set(imgd, offset);
		offset += dl;
		wUi(data, offset, crc(data, ioff, offset - ioff));
		offset += 4;
	}
	wUi(data, offset, 0);
	offset += 4;
	wAs(data, offset, "IEND");
	offset += 4;
	wUi(data, offset, crc(data, offset - 4, 4));
	offset += 4;
	return data.buffer;
};
UPNG.encode.compressPNG = function(out, filter, levelZero) {
	for (var i = 0; i < out.frames.length; i++) {
		var frm = out.frames[i];
		frm.rect.width;
		var nh = frm.rect.height;
		var fdata = new Uint8Array(nh * frm.bpl + nh);
		frm.cimg = UPNG.encode._filterZero(frm.img, nh, frm.bpp, frm.bpl, fdata, filter, levelZero);
	}
};
UPNG.encode.compress = function(bufs, w, h, ps, prms) {
	var onlyBlend = prms[0], evenCrd = prms[1], forbidPrev = prms[2], minBits = prms[3], forbidPlte = prms[4];
	var ctype = 6, depth = 8, alphaAnd = 255;
	for (var j = 0; j < bufs.length; j++) {
		var img = new Uint8Array(bufs[j]), ilen = img.length;
		for (var i = 0; i < ilen; i += 4) alphaAnd &= img[i + 3];
	}
	var gotAlpha = alphaAnd != 255;
	var frms = UPNG.encode.framize(bufs, w, h, onlyBlend, evenCrd, forbidPrev);
	var cmap = {}, plte = [], inds = [];
	if (ps != 0) {
		var nbufs = [];
		for (var i = 0; i < frms.length; i++) nbufs.push(frms[i].img.buffer);
		var abuf = UPNG.encode.concatRGBA(nbufs), qres = UPNG.quantize(abuf, ps);
		var cof = 0, bb = new Uint8Array(qres.abuf);
		for (var i = 0; i < frms.length; i++) {
			var ti = frms[i].img, bln = ti.length;
			inds.push(new Uint8Array(qres.inds.buffer, cof >> 2, bln >> 2));
			for (var j = 0; j < bln; j += 4) {
				ti[j] = bb[cof + j];
				ti[j + 1] = bb[cof + j + 1];
				ti[j + 2] = bb[cof + j + 2];
				ti[j + 3] = bb[cof + j + 3];
			}
			cof += bln;
		}
		for (var i = 0; i < qres.plte.length; i++) plte.push(qres.plte[i].est.rgba);
	} else for (var j = 0; j < frms.length; j++) {
		var frm = frms[j], img32 = new Uint32Array(frm.img.buffer), nw = frm.rect.width, ilen = img32.length;
		var ind = new Uint8Array(ilen);
		inds.push(ind);
		for (var i = 0; i < ilen; i++) {
			var c = img32[i];
			if (i != 0 && c == img32[i - 1]) ind[i] = ind[i - 1];
			else if (i > nw && c == img32[i - nw]) ind[i] = ind[i - nw];
			else {
				var cmc = cmap[c];
				if (cmc == null) {
					cmap[c] = cmc = plte.length;
					plte.push(c);
					if (plte.length >= 300) break;
				}
				ind[i] = cmc;
			}
		}
	}
	var cc = plte.length;
	if (cc <= 256 && forbidPlte == false) {
		if (cc <= 2) depth = 1;
		else if (cc <= 4) depth = 2;
		else if (cc <= 16) depth = 4;
		else depth = 8;
		depth = Math.max(depth, minBits);
	}
	for (var j = 0; j < frms.length; j++) {
		var frm = frms[j];
		frm.rect.x;
		frm.rect.y;
		var nw = frm.rect.width, nh = frm.rect.height, cimg = frm.img;
		new Uint32Array(cimg.buffer);
		var bpl = 4 * nw, bpp = 4;
		if (cc <= 256 && forbidPlte == false) {
			bpl = Math.ceil(depth * nw / 8);
			var nimg = new Uint8Array(bpl * nh);
			var inj = inds[j];
			for (var y = 0; y < nh; y++) {
				var i = y * bpl, ii = y * nw;
				if (depth == 8) for (var x = 0; x < nw; x++) nimg[i + x] = inj[ii + x];
				else if (depth == 4) for (var x = 0; x < nw; x++) nimg[i + (x >> 1)] |= inj[ii + x] << 4 - (x & 1) * 4;
				else if (depth == 2) for (var x = 0; x < nw; x++) nimg[i + (x >> 2)] |= inj[ii + x] << 6 - (x & 3) * 2;
				else if (depth == 1) for (var x = 0; x < nw; x++) nimg[i + (x >> 3)] |= inj[ii + x] << 7 - (x & 7) * 1;
			}
			cimg = nimg;
			ctype = 3;
			bpp = 1;
		} else if (gotAlpha == false && frms.length == 1) {
			var nimg = new Uint8Array(nw * nh * 3), area = nw * nh;
			for (var i = 0; i < area; i++) {
				var ti = i * 3, qi = i * 4;
				nimg[ti] = cimg[qi];
				nimg[ti + 1] = cimg[qi + 1];
				nimg[ti + 2] = cimg[qi + 2];
			}
			cimg = nimg;
			ctype = 2;
			bpp = 3;
			bpl = 3 * nw;
		}
		frm.img = cimg;
		frm.bpl = bpl;
		frm.bpp = bpp;
	}
	return {
		ctype,
		depth,
		plte,
		frames: frms
	};
};
UPNG.encode.framize = function(bufs, w, h, alwaysBlend, evenCrd, forbidPrev) {
	var frms = [];
	for (var j = 0; j < bufs.length; j++) {
		var cimg = new Uint8Array(bufs[j]), cimg32 = new Uint32Array(cimg.buffer);
		var nimg;
		var nx = 0, ny = 0, nw = w, nh = h, blend = alwaysBlend ? 1 : 0;
		if (j != 0) {
			var tlim = forbidPrev || alwaysBlend || j == 1 || frms[j - 2].dispose != 0 ? 1 : 2, tstp = 0, tarea = 1e9;
			for (var it = 0; it < tlim; it++) {
				var pimg = new Uint8Array(bufs[j - 1 - it]), p32 = new Uint32Array(bufs[j - 1 - it]);
				var mix = w, miy = h, max = -1, may = -1;
				for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
					var i = y * w + x;
					if (cimg32[i] != p32[i]) {
						if (x < mix) mix = x;
						if (x > max) max = x;
						if (y < miy) miy = y;
						if (y > may) may = y;
					}
				}
				if (max == -1) mix = miy = max = may = 0;
				if (evenCrd) {
					if ((mix & 1) == 1) mix--;
					if ((miy & 1) == 1) miy--;
				}
				var sarea = (max - mix + 1) * (may - miy + 1);
				if (sarea < tarea) {
					tarea = sarea;
					tstp = it;
					nx = mix;
					ny = miy;
					nw = max - mix + 1;
					nh = may - miy + 1;
				}
			}
			var pimg = new Uint8Array(bufs[j - 1 - tstp]);
			if (tstp == 1) frms[j - 1].dispose = 2;
			nimg = new Uint8Array(nw * nh * 4);
			UPNG._copyTile(pimg, w, h, nimg, nw, nh, -nx, -ny, 0);
			blend = UPNG._copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 3) ? 1 : 0;
			if (blend == 1) UPNG.encode._prepareDiff(cimg, w, h, nimg, {
				x: nx,
				y: ny,
				width: nw,
				height: nh
			});
			else UPNG._copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 0);
		} else nimg = cimg.slice(0);
		frms.push({
			rect: {
				x: nx,
				y: ny,
				width: nw,
				height: nh
			},
			img: nimg,
			blend,
			dispose: 0
		});
	}
	if (alwaysBlend) for (var j = 0; j < frms.length; j++) {
		var frm = frms[j];
		if (frm.blend == 1) continue;
		var r0 = frm.rect, r1 = frms[j - 1].rect;
		var miX = Math.min(r0.x, r1.x), miY = Math.min(r0.y, r1.y);
		var maX = Math.max(r0.x + r0.width, r1.x + r1.width), maY = Math.max(r0.y + r0.height, r1.y + r1.height);
		var r = {
			x: miX,
			y: miY,
			width: maX - miX,
			height: maY - miY
		};
		frms[j - 1].dispose = 1;
		if (j - 1 != 0) UPNG.encode._updateFrame(bufs, w, h, frms, j - 1, r, evenCrd);
		UPNG.encode._updateFrame(bufs, w, h, frms, j, r, evenCrd);
	}
	var area = 0;
	if (bufs.length != 1) for (var i = 0; i < frms.length; i++) {
		var frm = frms[i];
		area += frm.rect.width * frm.rect.height;
	}
	return frms;
};
UPNG.encode._updateFrame = function(bufs, w, h, frms, i, r, evenCrd) {
	var U8 = Uint8Array, U32 = Uint32Array;
	var pimg = new U8(bufs[i - 1]), pimg32 = new U32(bufs[i - 1]), nimg = i + 1 < bufs.length ? new U8(bufs[i + 1]) : null;
	var cimg = new U8(bufs[i]), cimg32 = new U32(cimg.buffer);
	var mix = w, miy = h, max = -1, may = -1;
	for (var y = 0; y < r.height; y++) for (var x = 0; x < r.width; x++) {
		var cx = r.x + x, cy = r.y + y;
		var j = cy * w + cx, cc = cimg32[j];
		if (cc == 0 || frms[i - 1].dispose == 0 && pimg32[j] == cc && (nimg == null || nimg[j * 4 + 3] != 0)) {} else {
			if (cx < mix) mix = cx;
			if (cx > max) max = cx;
			if (cy < miy) miy = cy;
			if (cy > may) may = cy;
		}
	}
	if (max == -1) mix = miy = max = may = 0;
	if (evenCrd) {
		if ((mix & 1) == 1) mix--;
		if ((miy & 1) == 1) miy--;
	}
	r = {
		x: mix,
		y: miy,
		width: max - mix + 1,
		height: may - miy + 1
	};
	var fr = frms[i];
	fr.rect = r;
	fr.blend = 1;
	fr.img = new Uint8Array(r.width * r.height * 4);
	if (frms[i - 1].dispose == 0) {
		UPNG._copyTile(pimg, w, h, fr.img, r.width, r.height, -r.x, -r.y, 0);
		UPNG.encode._prepareDiff(cimg, w, h, fr.img, r);
	} else UPNG._copyTile(cimg, w, h, fr.img, r.width, r.height, -r.x, -r.y, 0);
};
UPNG.encode._prepareDiff = function(cimg, w, h, nimg, rec) {
	UPNG._copyTile(cimg, w, h, nimg, rec.width, rec.height, -rec.x, -rec.y, 2);
};
UPNG.encode._filterZero = function(img, h, bpp, bpl, data, filter, levelZero) {
	var fls = [], ftry = [
		0,
		1,
		2,
		3,
		4
	];
	if (filter != -1) ftry = [filter];
	else if (h * bpl > 5e5 || bpp == 1) ftry = [0];
	var opts;
	if (levelZero) opts = { level: 0 };
	var CMPR = levelZero && UZIP != null ? UZIP : import_pako.default;
	for (var i = 0; i < ftry.length; i++) {
		for (var y = 0; y < h; y++) UPNG.encode._filterLine(data, img, y, bpl, bpp, ftry[i]);
		fls.push(CMPR["deflate"](data, opts));
	}
	var ti, tsize = 1e9;
	for (var i = 0; i < fls.length; i++) if (fls[i].length < tsize) {
		ti = i;
		tsize = fls[i].length;
	}
	return fls[ti];
};
UPNG.encode._filterLine = function(data, img, y, bpl, bpp, type) {
	var i = y * bpl, di = i + y, paeth = UPNG.decode._paeth;
	data[di] = type;
	di++;
	if (type == 0) if (bpl < 500) for (var x = 0; x < bpl; x++) data[di + x] = img[i + x];
	else data.set(new Uint8Array(img.buffer, i, bpl), di);
	else if (type == 1) {
		for (var x = 0; x < bpp; x++) data[di + x] = img[i + x];
		for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - img[i + x - bpp] + 256 & 255;
	} else if (y == 0) {
		for (var x = 0; x < bpp; x++) data[di + x] = img[i + x];
		if (type == 2) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x];
		if (type == 3) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - (img[i + x - bpp] >> 1) + 256 & 255;
		if (type == 4) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - paeth(img[i + x - bpp], 0, 0) + 256 & 255;
	} else {
		if (type == 2) for (var x = 0; x < bpl; x++) data[di + x] = img[i + x] + 256 - img[i + x - bpl] & 255;
		if (type == 3) {
			for (var x = 0; x < bpp; x++) data[di + x] = img[i + x] + 256 - (img[i + x - bpl] >> 1) & 255;
			for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] + 256 - (img[i + x - bpl] + img[i + x - bpp] >> 1) & 255;
		}
		if (type == 4) {
			for (var x = 0; x < bpp; x++) data[di + x] = img[i + x] + 256 - paeth(0, img[i + x - bpl], 0) & 255;
			for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] + 256 - paeth(img[i + x - bpp], img[i + x - bpl], img[i + x - bpp - bpl]) & 255;
		}
	}
};
UPNG.crc = {
	table: (function() {
		var tab = /* @__PURE__ */ new Uint32Array(256);
		for (var n = 0; n < 256; n++) {
			var c = n;
			for (var k = 0; k < 8; k++) if (c & 1) c = 3988292384 ^ c >>> 1;
			else c = c >>> 1;
			tab[n] = c;
		}
		return tab;
	})(),
	update: function(c, buf, off, len) {
		for (var i = 0; i < len; i++) c = UPNG.crc.table[(c ^ buf[off + i]) & 255] ^ c >>> 8;
		return c;
	},
	crc: function(b, o, l) {
		return UPNG.crc.update(4294967295, b, o, l) ^ 4294967295;
	}
};
UPNG.quantize = function(abuf, ps) {
	var oimg = new Uint8Array(abuf), nimg = oimg.slice(0), nimg32 = new Uint32Array(nimg.buffer);
	var KD = UPNG.quantize.getKDtree(nimg, ps);
	var root = KD[0], leafs = KD[1];
	UPNG.quantize.planeDst;
	var sb = oimg, tb = nimg32, len = sb.length;
	var inds = new Uint8Array(oimg.length >> 2);
	for (var i = 0; i < len; i += 4) {
		var r = sb[i] * (1 / 255), g = sb[i + 1] * (1 / 255), b = sb[i + 2] * (1 / 255), a = sb[i + 3] * (1 / 255);
		var nd = UPNG.quantize.getNearest(root, r, g, b, a);
		inds[i >> 2] = nd.ind;
		tb[i >> 2] = nd.est.rgba;
	}
	return {
		abuf: nimg.buffer,
		inds,
		plte: leafs
	};
};
UPNG.quantize.getKDtree = function(nimg, ps, err) {
	if (err == null) err = 1e-4;
	var nimg32 = new Uint32Array(nimg.buffer);
	var root = {
		i0: 0,
		i1: nimg.length,
		bst: null,
		est: null,
		tdst: 0,
		left: null,
		right: null
	};
	root.bst = UPNG.quantize.stats(nimg, root.i0, root.i1);
	root.est = UPNG.quantize.estats(root.bst);
	var leafs = [root];
	while (leafs.length < ps) {
		var maxL = 0, mi = 0;
		for (var i = 0; i < leafs.length; i++) if (leafs[i].est.L > maxL) {
			maxL = leafs[i].est.L;
			mi = i;
		}
		if (maxL < err) break;
		var node = leafs[mi];
		var s0 = UPNG.quantize.splitPixels(nimg, nimg32, node.i0, node.i1, node.est.e, node.est.eMq255);
		if (node.i0 >= s0 || node.i1 <= s0) {
			node.est.L = 0;
			continue;
		}
		var ln = {
			i0: node.i0,
			i1: s0,
			bst: null,
			est: null,
			tdst: 0,
			left: null,
			right: null
		};
		ln.bst = UPNG.quantize.stats(nimg, ln.i0, ln.i1);
		ln.est = UPNG.quantize.estats(ln.bst);
		var rn = {
			i0: s0,
			i1: node.i1,
			bst: null,
			est: null,
			tdst: 0,
			left: null,
			right: null
		};
		rn.bst = {
			R: [],
			m: [],
			N: node.bst.N - ln.bst.N
		};
		for (var i = 0; i < 16; i++) rn.bst.R[i] = node.bst.R[i] - ln.bst.R[i];
		for (var i = 0; i < 4; i++) rn.bst.m[i] = node.bst.m[i] - ln.bst.m[i];
		rn.est = UPNG.quantize.estats(rn.bst);
		node.left = ln;
		node.right = rn;
		leafs[mi] = ln;
		leafs.push(rn);
	}
	leafs.sort(function(a, b) {
		return b.bst.N - a.bst.N;
	});
	for (var i = 0; i < leafs.length; i++) leafs[i].ind = i;
	return [root, leafs];
};
UPNG.quantize.getNearest = function(nd, r, g, b, a) {
	if (nd.left == null) {
		nd.tdst = UPNG.quantize.dist(nd.est.q, r, g, b, a);
		return nd;
	}
	var planeDst = UPNG.quantize.planeDst(nd.est, r, g, b, a);
	var node0 = nd.left, node1 = nd.right;
	if (planeDst > 0) {
		node0 = nd.right;
		node1 = nd.left;
	}
	var ln = UPNG.quantize.getNearest(node0, r, g, b, a);
	if (ln.tdst <= planeDst * planeDst) return ln;
	var rn = UPNG.quantize.getNearest(node1, r, g, b, a);
	return rn.tdst < ln.tdst ? rn : ln;
};
UPNG.quantize.planeDst = function(est, r, g, b, a) {
	var e = est.e;
	return e[0] * r + e[1] * g + e[2] * b + e[3] * a - est.eMq;
};
UPNG.quantize.dist = function(q, r, g, b, a) {
	var d0 = r - q[0], d1 = g - q[1], d2 = b - q[2], d3 = a - q[3];
	return d0 * d0 + d1 * d1 + d2 * d2 + d3 * d3;
};
UPNG.quantize.splitPixels = function(nimg, nimg32, i0, i1, e, eMq) {
	var vecDot = UPNG.quantize.vecDot;
	i1 -= 4;
	while (i0 < i1) {
		while (vecDot(nimg, i0, e) <= eMq) i0 += 4;
		while (vecDot(nimg, i1, e) > eMq) i1 -= 4;
		if (i0 >= i1) break;
		var t = nimg32[i0 >> 2];
		nimg32[i0 >> 2] = nimg32[i1 >> 2];
		nimg32[i1 >> 2] = t;
		i0 += 4;
		i1 -= 4;
	}
	while (vecDot(nimg, i0, e) > eMq) i0 -= 4;
	return i0 + 4;
};
UPNG.quantize.vecDot = function(nimg, i, e) {
	return nimg[i] * e[0] + nimg[i + 1] * e[1] + nimg[i + 2] * e[2] + nimg[i + 3] * e[3];
};
UPNG.quantize.stats = function(nimg, i0, i1) {
	var R = [
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
	var m = [
		0,
		0,
		0,
		0
	];
	var N = i1 - i0 >> 2;
	for (var i = i0; i < i1; i += 4) {
		var r = nimg[i] * (1 / 255), g = nimg[i + 1] * (1 / 255), b = nimg[i + 2] * (1 / 255), a = nimg[i + 3] * (1 / 255);
		m[0] += r;
		m[1] += g;
		m[2] += b;
		m[3] += a;
		R[0] += r * r;
		R[1] += r * g;
		R[2] += r * b;
		R[3] += r * a;
		R[5] += g * g;
		R[6] += g * b;
		R[7] += g * a;
		R[10] += b * b;
		R[11] += b * a;
		R[15] += a * a;
	}
	R[4] = R[1];
	R[8] = R[2];
	R[9] = R[6];
	R[12] = R[3];
	R[13] = R[7];
	R[14] = R[11];
	return {
		R,
		m,
		N
	};
};
UPNG.quantize.estats = function(stats) {
	var R = stats.R, m = stats.m, N = stats.N;
	var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3], iN = N == 0 ? 0 : 1 / N;
	var Rj = [
		R[0] - m0 * m0 * iN,
		R[1] - m0 * m1 * iN,
		R[2] - m0 * m2 * iN,
		R[3] - m0 * m3 * iN,
		R[4] - m1 * m0 * iN,
		R[5] - m1 * m1 * iN,
		R[6] - m1 * m2 * iN,
		R[7] - m1 * m3 * iN,
		R[8] - m2 * m0 * iN,
		R[9] - m2 * m1 * iN,
		R[10] - m2 * m2 * iN,
		R[11] - m2 * m3 * iN,
		R[12] - m3 * m0 * iN,
		R[13] - m3 * m1 * iN,
		R[14] - m3 * m2 * iN,
		R[15] - m3 * m3 * iN
	];
	var A = Rj, M = UPNG.M4;
	var b = [
		.5,
		.5,
		.5,
		.5
	], mi = 0, tmi = 0;
	if (N != 0) for (var i = 0; i < 10; i++) {
		b = M.multVec(A, b);
		tmi = Math.sqrt(M.dot(b, b));
		b = M.sml(1 / tmi, b);
		if (Math.abs(tmi - mi) < 1e-9) break;
		mi = tmi;
	}
	var q = [
		m0 * iN,
		m1 * iN,
		m2 * iN,
		m3 * iN
	];
	var eMq255 = M.dot(M.sml(255, q), b);
	return {
		Cov: Rj,
		q,
		e: b,
		L: mi,
		eMq255,
		eMq: M.dot(b, q),
		rgba: (Math.round(255 * q[3]) << 24 | Math.round(255 * q[2]) << 16 | Math.round(255 * q[1]) << 8 | Math.round(255 * q[0]) << 0) >>> 0
	};
};
UPNG.M4 = {
	multVec: function(m, v) {
		return [
			m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3],
			m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3],
			m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3],
			m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3]
		];
	},
	dot: function(x, y) {
		return x[0] * y[0] + x[1] * y[1] + x[2] * y[2] + x[3] * y[3];
	},
	sml: function(a, y) {
		return [
			a * y[0],
			a * y[1],
			a * y[2],
			a * y[3]
		];
	}
};
UPNG.encode.concatRGBA = function(bufs) {
	var tlen = 0;
	for (var i = 0; i < bufs.length; i++) tlen += bufs[i].byteLength;
	var nimg = new Uint8Array(tlen), noff = 0;
	for (var i = 0; i < bufs.length; i++) {
		var img = new Uint8Array(bufs[i]), il = img.length;
		for (var j = 0; j < il; j += 4) {
			var r = img[j], g = img[j + 1], b = img[j + 2], a = img[j + 3];
			if (a == 0) r = g = b = 0;
			nimg[noff + j] = r;
			nimg[noff + j + 1] = g;
			nimg[noff + j + 2] = b;
			nimg[noff + j + 3] = a;
		}
		noff += il;
	}
	return nimg.buffer;
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/utils/png.js
var getImageType = function(ctype) {
	if (ctype === 0) return PngType.Greyscale;
	if (ctype === 2) return PngType.Truecolour;
	if (ctype === 3) return PngType.IndexedColour;
	if (ctype === 4) return PngType.GreyscaleWithAlpha;
	if (ctype === 6) return PngType.TruecolourWithAlpha;
	throw new Error("Unknown color type: " + ctype);
};
var splitAlphaChannel = function(rgbaChannel) {
	var pixelCount = Math.floor(rgbaChannel.length / 4);
	var rgbChannel = new Uint8Array(pixelCount * 3);
	var alphaChannel = new Uint8Array(pixelCount * 1);
	var rgbaOffset = 0;
	var rgbOffset = 0;
	var alphaOffset = 0;
	while (rgbaOffset < rgbaChannel.length) {
		rgbChannel[rgbOffset++] = rgbaChannel[rgbaOffset++];
		rgbChannel[rgbOffset++] = rgbaChannel[rgbaOffset++];
		rgbChannel[rgbOffset++] = rgbaChannel[rgbaOffset++];
		alphaChannel[alphaOffset++] = rgbaChannel[rgbaOffset++];
	}
	return {
		rgbChannel,
		alphaChannel
	};
};
var PngType;
(function(PngType) {
	PngType["Greyscale"] = "Greyscale";
	PngType["Truecolour"] = "Truecolour";
	PngType["IndexedColour"] = "IndexedColour";
	PngType["GreyscaleWithAlpha"] = "GreyscaleWithAlpha";
	PngType["TruecolourWithAlpha"] = "TruecolourWithAlpha";
})(PngType || (PngType = {}));
var PNG = function() {
	function PNG(pngData) {
		var upng = UPNG.decode(pngData);
		var frames = UPNG.toRGBA8(upng);
		if (frames.length > 1) throw new Error("Animated PNGs are not supported");
		var _a = splitAlphaChannel(new Uint8Array(frames[0])), rgbChannel = _a.rgbChannel, alphaChannel = _a.alphaChannel;
		this.rgbChannel = rgbChannel;
		if (alphaChannel.some(function(a) {
			return a < 255;
		})) this.alphaChannel = alphaChannel;
		this.type = getImageType(upng.ctype);
		this.width = upng.width;
		this.height = upng.height;
		this.bitsPerComponent = 8;
	}
	PNG.load = function(pngData) {
		return new PNG(pngData);
	};
	return PNG;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/PngEmbedder.js
/**
* A note of thanks to the developers of https://github.com/foliojs/pdfkit, as
* this class borrows from:
*   https://github.com/devongovett/pdfkit/blob/e71edab0dd4657b5a767804ba86c94c58d01fbca/lib/image/png.coffee
*/
var PngEmbedder = function() {
	function PngEmbedder(png) {
		this.image = png;
		this.bitsPerComponent = png.bitsPerComponent;
		this.width = png.width;
		this.height = png.height;
		this.colorSpace = "DeviceRGB";
	}
	PngEmbedder.for = function(imageData) {
		return __awaiter(this, void 0, void 0, function() {
			var png;
			return __generator(this, function(_a) {
				png = PNG.load(imageData);
				return [2, new PngEmbedder(png)];
			});
		});
	};
	PngEmbedder.prototype.embedIntoContext = function(context, ref) {
		return __awaiter(this, void 0, void 0, function() {
			var SMask, xObject;
			return __generator(this, function(_a) {
				SMask = this.embedAlphaChannel(context);
				xObject = context.flateStream(this.image.rgbChannel, {
					Type: "XObject",
					Subtype: "Image",
					BitsPerComponent: this.image.bitsPerComponent,
					Width: this.image.width,
					Height: this.image.height,
					ColorSpace: this.colorSpace,
					SMask
				});
				if (ref) {
					context.assign(ref, xObject);
					return [2, ref];
				} else return [2, context.register(xObject)];
			});
		});
	};
	PngEmbedder.prototype.embedAlphaChannel = function(context) {
		if (!this.image.alphaChannel) return void 0;
		var xObject = context.flateStream(this.image.alphaChannel, {
			Type: "XObject",
			Subtype: "Image",
			Height: this.image.height,
			Width: this.image.width,
			BitsPerComponent: this.image.bitsPerComponent,
			ColorSpace: "DeviceGray",
			Decode: [0, 1]
		});
		return context.register(xObject);
	};
	return PngEmbedder;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/streams/Stream.js
var Stream = function() {
	function Stream(buffer, start, length) {
		this.bytes = buffer;
		this.start = start || 0;
		this.pos = this.start;
		this.end = !!start && !!length ? start + length : this.bytes.length;
	}
	Object.defineProperty(Stream.prototype, "length", {
		get: function() {
			return this.end - this.start;
		},
		enumerable: false,
		configurable: true
	});
	Object.defineProperty(Stream.prototype, "isEmpty", {
		get: function() {
			return this.length === 0;
		},
		enumerable: false,
		configurable: true
	});
	Stream.prototype.getByte = function() {
		if (this.pos >= this.end) return -1;
		return this.bytes[this.pos++];
	};
	Stream.prototype.getUint16 = function() {
		var b0 = this.getByte();
		var b1 = this.getByte();
		if (b0 === -1 || b1 === -1) return -1;
		return (b0 << 8) + b1;
	};
	Stream.prototype.getInt32 = function() {
		var b0 = this.getByte();
		var b1 = this.getByte();
		var b2 = this.getByte();
		var b3 = this.getByte();
		return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
	};
	Stream.prototype.getBytes = function(length, forceClamped) {
		if (forceClamped === void 0) forceClamped = false;
		var bytes = this.bytes;
		var pos = this.pos;
		var strEnd = this.end;
		if (!length) {
			var subarray = bytes.subarray(pos, strEnd);
			return forceClamped ? new Uint8ClampedArray(subarray) : subarray;
		} else {
			var end = pos + length;
			if (end > strEnd) end = strEnd;
			this.pos = end;
			var subarray = bytes.subarray(pos, end);
			return forceClamped ? new Uint8ClampedArray(subarray) : subarray;
		}
	};
	Stream.prototype.peekByte = function() {
		var peekedByte = this.getByte();
		this.pos--;
		return peekedByte;
	};
	Stream.prototype.peekBytes = function(length, forceClamped) {
		if (forceClamped === void 0) forceClamped = false;
		var bytes = this.getBytes(length, forceClamped);
		this.pos -= bytes.length;
		return bytes;
	};
	Stream.prototype.skip = function(n) {
		if (!n) n = 1;
		this.pos += n;
	};
	Stream.prototype.reset = function() {
		this.pos = this.start;
	};
	Stream.prototype.moveStart = function() {
		this.start = this.pos;
	};
	Stream.prototype.makeSubStream = function(start, length) {
		return new Stream(this.bytes, start, length);
	};
	Stream.prototype.decode = function() {
		return this.bytes;
	};
	return Stream;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/streams/DecodeStream.js
var emptyBuffer = /* @__PURE__ */ new Uint8Array(0);
/**
* Super class for the decoding streams
*/
var DecodeStream = function() {
	function DecodeStream(maybeMinBufferLength) {
		this.pos = 0;
		this.bufferLength = 0;
		this.eof = false;
		this.buffer = emptyBuffer;
		this.minBufferLength = 512;
		if (maybeMinBufferLength) while (this.minBufferLength < maybeMinBufferLength) this.minBufferLength *= 2;
	}
	Object.defineProperty(DecodeStream.prototype, "isEmpty", {
		get: function() {
			while (!this.eof && this.bufferLength === 0) this.readBlock();
			return this.bufferLength === 0;
		},
		enumerable: false,
		configurable: true
	});
	DecodeStream.prototype.getByte = function() {
		var pos = this.pos;
		while (this.bufferLength <= pos) {
			if (this.eof) return -1;
			this.readBlock();
		}
		return this.buffer[this.pos++];
	};
	DecodeStream.prototype.getUint16 = function() {
		var b0 = this.getByte();
		var b1 = this.getByte();
		if (b0 === -1 || b1 === -1) return -1;
		return (b0 << 8) + b1;
	};
	DecodeStream.prototype.getInt32 = function() {
		var b0 = this.getByte();
		var b1 = this.getByte();
		var b2 = this.getByte();
		var b3 = this.getByte();
		return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
	};
	DecodeStream.prototype.getBytes = function(length, forceClamped) {
		if (forceClamped === void 0) forceClamped = false;
		var end;
		var pos = this.pos;
		if (length) {
			this.ensureBuffer(pos + length);
			end = pos + length;
			while (!this.eof && this.bufferLength < end) this.readBlock();
			var bufEnd = this.bufferLength;
			if (end > bufEnd) end = bufEnd;
		} else {
			while (!this.eof) this.readBlock();
			end = this.bufferLength;
		}
		this.pos = end;
		var subarray = this.buffer.subarray(pos, end);
		return forceClamped && !(subarray instanceof Uint8ClampedArray) ? new Uint8ClampedArray(subarray) : subarray;
	};
	DecodeStream.prototype.peekByte = function() {
		var peekedByte = this.getByte();
		this.pos--;
		return peekedByte;
	};
	DecodeStream.prototype.peekBytes = function(length, forceClamped) {
		if (forceClamped === void 0) forceClamped = false;
		var bytes = this.getBytes(length, forceClamped);
		this.pos -= bytes.length;
		return bytes;
	};
	DecodeStream.prototype.skip = function(n) {
		if (!n) n = 1;
		this.pos += n;
	};
	DecodeStream.prototype.reset = function() {
		this.pos = 0;
	};
	DecodeStream.prototype.makeSubStream = function(start, length) {
		var end = start + length;
		while (this.bufferLength <= end && !this.eof) this.readBlock();
		return new Stream(this.buffer, start, length);
	};
	DecodeStream.prototype.decode = function() {
		while (!this.eof) this.readBlock();
		return this.buffer.subarray(0, this.bufferLength);
	};
	DecodeStream.prototype.readBlock = function() {
		throw new MethodNotImplementedError(this.constructor.name, "readBlock");
	};
	DecodeStream.prototype.ensureBuffer = function(requested) {
		var buffer = this.buffer;
		if (requested <= buffer.byteLength) return buffer;
		var size = this.minBufferLength;
		while (size < requested) size *= 2;
		var buffer2 = new Uint8Array(size);
		buffer2.set(buffer);
		return this.buffer = buffer2;
	};
	return DecodeStream;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/streams/Ascii85Stream.js
var isSpace = function(ch) {
	return ch === 32 || ch === 9 || ch === 13 || ch === 10;
};
var Ascii85Stream = function(_super) {
	__extends(Ascii85Stream, _super);
	function Ascii85Stream(stream, maybeLength) {
		var _this = _super.call(this, maybeLength) || this;
		_this.stream = stream;
		_this.input = /* @__PURE__ */ new Uint8Array(5);
		if (maybeLength) maybeLength = .8 * maybeLength;
		return _this;
	}
	Ascii85Stream.prototype.readBlock = function() {
		var TILDA_CHAR = 126;
		var Z_LOWER_CHAR = 122;
		var EOF = -1;
		var stream = this.stream;
		var c = stream.getByte();
		while (isSpace(c)) c = stream.getByte();
		if (c === EOF || c === TILDA_CHAR) {
			this.eof = true;
			return;
		}
		var bufferLength = this.bufferLength;
		var buffer;
		var i;
		if (c === Z_LOWER_CHAR) {
			buffer = this.ensureBuffer(bufferLength + 4);
			for (i = 0; i < 4; ++i) buffer[bufferLength + i] = 0;
			this.bufferLength += 4;
		} else {
			var input = this.input;
			input[0] = c;
			for (i = 1; i < 5; ++i) {
				c = stream.getByte();
				while (isSpace(c)) c = stream.getByte();
				input[i] = c;
				if (c === EOF || c === TILDA_CHAR) break;
			}
			buffer = this.ensureBuffer(bufferLength + i - 1);
			this.bufferLength += i - 1;
			if (i < 5) {
				for (; i < 5; ++i) input[i] = 117;
				this.eof = true;
			}
			var t = 0;
			for (i = 0; i < 5; ++i) t = t * 85 + (input[i] - 33);
			for (i = 3; i >= 0; --i) {
				buffer[bufferLength + i] = t & 255;
				t >>= 8;
			}
		}
	};
	return Ascii85Stream;
}(DecodeStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/streams/AsciiHexStream.js
var AsciiHexStream = function(_super) {
	__extends(AsciiHexStream, _super);
	function AsciiHexStream(stream, maybeLength) {
		var _this = _super.call(this, maybeLength) || this;
		_this.stream = stream;
		_this.firstDigit = -1;
		if (maybeLength) maybeLength = .5 * maybeLength;
		return _this;
	}
	AsciiHexStream.prototype.readBlock = function() {
		var bytes = this.stream.getBytes(8e3);
		if (!bytes.length) {
			this.eof = true;
			return;
		}
		var maxDecodeLength = bytes.length + 1 >> 1;
		var buffer = this.ensureBuffer(this.bufferLength + maxDecodeLength);
		var bufferLength = this.bufferLength;
		var firstDigit = this.firstDigit;
		for (var i = 0, ii = bytes.length; i < ii; i++) {
			var ch = bytes[i];
			var digit = void 0;
			if (ch >= 48 && ch <= 57) digit = ch & 15;
			else if (ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102) digit = (ch & 15) + 9;
			else if (ch === 62) {
				this.eof = true;
				break;
			} else continue;
			if (firstDigit < 0) firstDigit = digit;
			else {
				buffer[bufferLength++] = firstDigit << 4 | digit;
				firstDigit = -1;
			}
		}
		if (firstDigit >= 0 && this.eof) {
			buffer[bufferLength++] = firstDigit << 4;
			firstDigit = -1;
		}
		this.firstDigit = firstDigit;
		this.bufferLength = bufferLength;
	};
	return AsciiHexStream;
}(DecodeStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/streams/FlateStream.js
var codeLenCodeMap = new Int32Array([
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
]);
var lengthDecode = new Int32Array([
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	65547,
	65549,
	65551,
	65553,
	131091,
	131095,
	131099,
	131103,
	196643,
	196651,
	196659,
	196667,
	262211,
	262227,
	262243,
	262259,
	327811,
	327843,
	327875,
	327907,
	258,
	258,
	258
]);
var distDecode = new Int32Array([
	1,
	2,
	3,
	4,
	65541,
	65543,
	131081,
	131085,
	196625,
	196633,
	262177,
	262193,
	327745,
	327777,
	393345,
	393409,
	459009,
	459137,
	524801,
	525057,
	590849,
	591361,
	657409,
	658433,
	724993,
	727041,
	794625,
	798721,
	868353,
	876545
]);
var fixedLitCodeTab = [new Int32Array([
	459008,
	524368,
	524304,
	524568,
	459024,
	524400,
	524336,
	590016,
	459016,
	524384,
	524320,
	589984,
	524288,
	524416,
	524352,
	590048,
	459012,
	524376,
	524312,
	589968,
	459028,
	524408,
	524344,
	590032,
	459020,
	524392,
	524328,
	59e4,
	524296,
	524424,
	524360,
	590064,
	459010,
	524372,
	524308,
	524572,
	459026,
	524404,
	524340,
	590024,
	459018,
	524388,
	524324,
	589992,
	524292,
	524420,
	524356,
	590056,
	459014,
	524380,
	524316,
	589976,
	459030,
	524412,
	524348,
	590040,
	459022,
	524396,
	524332,
	590008,
	524300,
	524428,
	524364,
	590072,
	459009,
	524370,
	524306,
	524570,
	459025,
	524402,
	524338,
	590020,
	459017,
	524386,
	524322,
	589988,
	524290,
	524418,
	524354,
	590052,
	459013,
	524378,
	524314,
	589972,
	459029,
	524410,
	524346,
	590036,
	459021,
	524394,
	524330,
	590004,
	524298,
	524426,
	524362,
	590068,
	459011,
	524374,
	524310,
	524574,
	459027,
	524406,
	524342,
	590028,
	459019,
	524390,
	524326,
	589996,
	524294,
	524422,
	524358,
	590060,
	459015,
	524382,
	524318,
	589980,
	459031,
	524414,
	524350,
	590044,
	459023,
	524398,
	524334,
	590012,
	524302,
	524430,
	524366,
	590076,
	459008,
	524369,
	524305,
	524569,
	459024,
	524401,
	524337,
	590018,
	459016,
	524385,
	524321,
	589986,
	524289,
	524417,
	524353,
	590050,
	459012,
	524377,
	524313,
	589970,
	459028,
	524409,
	524345,
	590034,
	459020,
	524393,
	524329,
	590002,
	524297,
	524425,
	524361,
	590066,
	459010,
	524373,
	524309,
	524573,
	459026,
	524405,
	524341,
	590026,
	459018,
	524389,
	524325,
	589994,
	524293,
	524421,
	524357,
	590058,
	459014,
	524381,
	524317,
	589978,
	459030,
	524413,
	524349,
	590042,
	459022,
	524397,
	524333,
	590010,
	524301,
	524429,
	524365,
	590074,
	459009,
	524371,
	524307,
	524571,
	459025,
	524403,
	524339,
	590022,
	459017,
	524387,
	524323,
	589990,
	524291,
	524419,
	524355,
	590054,
	459013,
	524379,
	524315,
	589974,
	459029,
	524411,
	524347,
	590038,
	459021,
	524395,
	524331,
	590006,
	524299,
	524427,
	524363,
	590070,
	459011,
	524375,
	524311,
	524575,
	459027,
	524407,
	524343,
	590030,
	459019,
	524391,
	524327,
	589998,
	524295,
	524423,
	524359,
	590062,
	459015,
	524383,
	524319,
	589982,
	459031,
	524415,
	524351,
	590046,
	459023,
	524399,
	524335,
	590014,
	524303,
	524431,
	524367,
	590078,
	459008,
	524368,
	524304,
	524568,
	459024,
	524400,
	524336,
	590017,
	459016,
	524384,
	524320,
	589985,
	524288,
	524416,
	524352,
	590049,
	459012,
	524376,
	524312,
	589969,
	459028,
	524408,
	524344,
	590033,
	459020,
	524392,
	524328,
	590001,
	524296,
	524424,
	524360,
	590065,
	459010,
	524372,
	524308,
	524572,
	459026,
	524404,
	524340,
	590025,
	459018,
	524388,
	524324,
	589993,
	524292,
	524420,
	524356,
	590057,
	459014,
	524380,
	524316,
	589977,
	459030,
	524412,
	524348,
	590041,
	459022,
	524396,
	524332,
	590009,
	524300,
	524428,
	524364,
	590073,
	459009,
	524370,
	524306,
	524570,
	459025,
	524402,
	524338,
	590021,
	459017,
	524386,
	524322,
	589989,
	524290,
	524418,
	524354,
	590053,
	459013,
	524378,
	524314,
	589973,
	459029,
	524410,
	524346,
	590037,
	459021,
	524394,
	524330,
	590005,
	524298,
	524426,
	524362,
	590069,
	459011,
	524374,
	524310,
	524574,
	459027,
	524406,
	524342,
	590029,
	459019,
	524390,
	524326,
	589997,
	524294,
	524422,
	524358,
	590061,
	459015,
	524382,
	524318,
	589981,
	459031,
	524414,
	524350,
	590045,
	459023,
	524398,
	524334,
	590013,
	524302,
	524430,
	524366,
	590077,
	459008,
	524369,
	524305,
	524569,
	459024,
	524401,
	524337,
	590019,
	459016,
	524385,
	524321,
	589987,
	524289,
	524417,
	524353,
	590051,
	459012,
	524377,
	524313,
	589971,
	459028,
	524409,
	524345,
	590035,
	459020,
	524393,
	524329,
	590003,
	524297,
	524425,
	524361,
	590067,
	459010,
	524373,
	524309,
	524573,
	459026,
	524405,
	524341,
	590027,
	459018,
	524389,
	524325,
	589995,
	524293,
	524421,
	524357,
	590059,
	459014,
	524381,
	524317,
	589979,
	459030,
	524413,
	524349,
	590043,
	459022,
	524397,
	524333,
	590011,
	524301,
	524429,
	524365,
	590075,
	459009,
	524371,
	524307,
	524571,
	459025,
	524403,
	524339,
	590023,
	459017,
	524387,
	524323,
	589991,
	524291,
	524419,
	524355,
	590055,
	459013,
	524379,
	524315,
	589975,
	459029,
	524411,
	524347,
	590039,
	459021,
	524395,
	524331,
	590007,
	524299,
	524427,
	524363,
	590071,
	459011,
	524375,
	524311,
	524575,
	459027,
	524407,
	524343,
	590031,
	459019,
	524391,
	524327,
	589999,
	524295,
	524423,
	524359,
	590063,
	459015,
	524383,
	524319,
	589983,
	459031,
	524415,
	524351,
	590047,
	459023,
	524399,
	524335,
	590015,
	524303,
	524431,
	524367,
	590079
]), 9];
var fixedDistCodeTab = [new Int32Array([
	327680,
	327696,
	327688,
	327704,
	327684,
	327700,
	327692,
	327708,
	327682,
	327698,
	327690,
	327706,
	327686,
	327702,
	327694,
	0,
	327681,
	327697,
	327689,
	327705,
	327685,
	327701,
	327693,
	327709,
	327683,
	327699,
	327691,
	327707,
	327687,
	327703,
	327695,
	0
]), 5];
var FlateStream = function(_super) {
	__extends(FlateStream, _super);
	function FlateStream(stream, maybeLength) {
		var _this = _super.call(this, maybeLength) || this;
		_this.stream = stream;
		var cmf = stream.getByte();
		var flg = stream.getByte();
		if (cmf === -1 || flg === -1) throw new Error("Invalid header in flate stream: " + cmf + ", " + flg);
		if ((cmf & 15) !== 8) throw new Error("Unknown compression method in flate stream: " + cmf + ", " + flg);
		if (((cmf << 8) + flg) % 31 !== 0) throw new Error("Bad FCHECK in flate stream: " + cmf + ", " + flg);
		if (flg & 32) throw new Error("FDICT bit set in flate stream: " + cmf + ", " + flg);
		_this.codeSize = 0;
		_this.codeBuf = 0;
		return _this;
	}
	FlateStream.prototype.readBlock = function() {
		var buffer;
		var len;
		var str = this.stream;
		var hdr = this.getBits(3);
		if (hdr & 1) this.eof = true;
		hdr >>= 1;
		if (hdr === 0) {
			var b = void 0;
			if ((b = str.getByte()) === -1) throw new Error("Bad block header in flate stream");
			var blockLen = b;
			if ((b = str.getByte()) === -1) throw new Error("Bad block header in flate stream");
			blockLen |= b << 8;
			if ((b = str.getByte()) === -1) throw new Error("Bad block header in flate stream");
			var check = b;
			if ((b = str.getByte()) === -1) throw new Error("Bad block header in flate stream");
			check |= b << 8;
			if (check !== (~blockLen & 65535) && (blockLen !== 0 || check !== 0)) throw new Error("Bad uncompressed block length in flate stream");
			this.codeBuf = 0;
			this.codeSize = 0;
			var bufferLength = this.bufferLength;
			buffer = this.ensureBuffer(bufferLength + blockLen);
			var end = bufferLength + blockLen;
			this.bufferLength = end;
			if (blockLen === 0) {
				if (str.peekByte() === -1) this.eof = true;
			} else for (var n = bufferLength; n < end; ++n) {
				if ((b = str.getByte()) === -1) {
					this.eof = true;
					break;
				}
				buffer[n] = b;
			}
			return;
		}
		var litCodeTable;
		var distCodeTable;
		if (hdr === 1) {
			litCodeTable = fixedLitCodeTab;
			distCodeTable = fixedDistCodeTab;
		} else if (hdr === 2) {
			var numLitCodes = this.getBits(5) + 257;
			var numDistCodes = this.getBits(5) + 1;
			var numCodeLenCodes = this.getBits(4) + 4;
			var codeLenCodeLengths = new Uint8Array(codeLenCodeMap.length);
			var i = void 0;
			for (i = 0; i < numCodeLenCodes; ++i) codeLenCodeLengths[codeLenCodeMap[i]] = this.getBits(3);
			var codeLenCodeTab = this.generateHuffmanTable(codeLenCodeLengths);
			len = 0;
			i = 0;
			var codes = numLitCodes + numDistCodes;
			var codeLengths = new Uint8Array(codes);
			var bitsLength = void 0;
			var bitsOffset = void 0;
			var what = void 0;
			while (i < codes) {
				var code = this.getCode(codeLenCodeTab);
				if (code === 16) {
					bitsLength = 2;
					bitsOffset = 3;
					what = len;
				} else if (code === 17) {
					bitsLength = 3;
					bitsOffset = 3;
					what = len = 0;
				} else if (code === 18) {
					bitsLength = 7;
					bitsOffset = 11;
					what = len = 0;
				} else {
					codeLengths[i++] = len = code;
					continue;
				}
				var repeatLength = this.getBits(bitsLength) + bitsOffset;
				while (repeatLength-- > 0) codeLengths[i++] = what;
			}
			litCodeTable = this.generateHuffmanTable(codeLengths.subarray(0, numLitCodes));
			distCodeTable = this.generateHuffmanTable(codeLengths.subarray(numLitCodes, codes));
		} else throw new Error("Unknown block type in flate stream");
		buffer = this.buffer;
		var limit = buffer ? buffer.length : 0;
		var pos = this.bufferLength;
		while (true) {
			var code1 = this.getCode(litCodeTable);
			if (code1 < 256) {
				if (pos + 1 >= limit) {
					buffer = this.ensureBuffer(pos + 1);
					limit = buffer.length;
				}
				buffer[pos++] = code1;
				continue;
			}
			if (code1 === 256) {
				this.bufferLength = pos;
				return;
			}
			code1 -= 257;
			code1 = lengthDecode[code1];
			var code2 = code1 >> 16;
			if (code2 > 0) code2 = this.getBits(code2);
			len = (code1 & 65535) + code2;
			code1 = this.getCode(distCodeTable);
			code1 = distDecode[code1];
			code2 = code1 >> 16;
			if (code2 > 0) code2 = this.getBits(code2);
			var dist = (code1 & 65535) + code2;
			if (pos + len >= limit) {
				buffer = this.ensureBuffer(pos + len);
				limit = buffer.length;
			}
			for (var k = 0; k < len; ++k, ++pos) buffer[pos] = buffer[pos - dist];
		}
	};
	FlateStream.prototype.getBits = function(bits) {
		var str = this.stream;
		var codeSize = this.codeSize;
		var codeBuf = this.codeBuf;
		var b;
		while (codeSize < bits) {
			if ((b = str.getByte()) === -1) throw new Error("Bad encoding in flate stream");
			codeBuf |= b << codeSize;
			codeSize += 8;
		}
		b = codeBuf & (1 << bits) - 1;
		this.codeBuf = codeBuf >> bits;
		this.codeSize = codeSize -= bits;
		return b;
	};
	FlateStream.prototype.getCode = function(table) {
		var str = this.stream;
		var codes = table[0];
		var maxLen = table[1];
		var codeSize = this.codeSize;
		var codeBuf = this.codeBuf;
		var b;
		while (codeSize < maxLen) {
			if ((b = str.getByte()) === -1) break;
			codeBuf |= b << codeSize;
			codeSize += 8;
		}
		var code = codes[codeBuf & (1 << maxLen) - 1];
		if (typeof codes === "number") console.log("FLATE:", code);
		var codeLen = code >> 16;
		var codeVal = code & 65535;
		if (codeLen < 1 || codeSize < codeLen) throw new Error("Bad encoding in flate stream");
		this.codeBuf = codeBuf >> codeLen;
		this.codeSize = codeSize - codeLen;
		return codeVal;
	};
	FlateStream.prototype.generateHuffmanTable = function(lengths) {
		var n = lengths.length;
		var maxLen = 0;
		var i;
		for (i = 0; i < n; ++i) if (lengths[i] > maxLen) maxLen = lengths[i];
		var size = 1 << maxLen;
		var codes = new Int32Array(size);
		for (var len = 1, code = 0, skip = 2; len <= maxLen; ++len, code <<= 1, skip <<= 1) for (var val = 0; val < n; ++val) if (lengths[val] === len) {
			var code2 = 0;
			var t = code;
			for (i = 0; i < len; ++i) {
				code2 = code2 << 1 | t & 1;
				t >>= 1;
			}
			for (i = code2; i < size; i += skip) codes[i] = len << 16 | val;
			++code;
		}
		return [codes, maxLen];
	};
	return FlateStream;
}(DecodeStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/streams/LZWStream.js
var LZWStream = function(_super) {
	__extends(LZWStream, _super);
	function LZWStream(stream, maybeLength, earlyChange) {
		var _this = _super.call(this, maybeLength) || this;
		_this.stream = stream;
		_this.cachedData = 0;
		_this.bitsCached = 0;
		var maxLzwDictionarySize = 4096;
		var lzwState = {
			earlyChange,
			codeLength: 9,
			nextCode: 258,
			dictionaryValues: new Uint8Array(maxLzwDictionarySize),
			dictionaryLengths: new Uint16Array(maxLzwDictionarySize),
			dictionaryPrevCodes: new Uint16Array(maxLzwDictionarySize),
			currentSequence: new Uint8Array(maxLzwDictionarySize),
			currentSequenceLength: 0
		};
		for (var i = 0; i < 256; ++i) {
			lzwState.dictionaryValues[i] = i;
			lzwState.dictionaryLengths[i] = 1;
		}
		_this.lzwState = lzwState;
		return _this;
	}
	LZWStream.prototype.readBlock = function() {
		var blockSize = 512;
		var estimatedDecodedSize = blockSize * 2;
		var decodedSizeDelta = blockSize;
		var i;
		var j;
		var q;
		var lzwState = this.lzwState;
		if (!lzwState) return;
		var earlyChange = lzwState.earlyChange;
		var nextCode = lzwState.nextCode;
		var dictionaryValues = lzwState.dictionaryValues;
		var dictionaryLengths = lzwState.dictionaryLengths;
		var dictionaryPrevCodes = lzwState.dictionaryPrevCodes;
		var codeLength = lzwState.codeLength;
		var prevCode = lzwState.prevCode;
		var currentSequence = lzwState.currentSequence;
		var currentSequenceLength = lzwState.currentSequenceLength;
		var decodedLength = 0;
		var currentBufferLength = this.bufferLength;
		var buffer = this.ensureBuffer(this.bufferLength + estimatedDecodedSize);
		for (i = 0; i < blockSize; i++) {
			var code = this.readBits(codeLength);
			var hasPrev = currentSequenceLength > 0;
			if (!code || code < 256) {
				currentSequence[0] = code;
				currentSequenceLength = 1;
			} else if (code >= 258) if (code < nextCode) {
				currentSequenceLength = dictionaryLengths[code];
				for (j = currentSequenceLength - 1, q = code; j >= 0; j--) {
					currentSequence[j] = dictionaryValues[q];
					q = dictionaryPrevCodes[q];
				}
			} else currentSequence[currentSequenceLength++] = currentSequence[0];
			else if (code === 256) {
				codeLength = 9;
				nextCode = 258;
				currentSequenceLength = 0;
				continue;
			} else {
				this.eof = true;
				delete this.lzwState;
				break;
			}
			if (hasPrev) {
				dictionaryPrevCodes[nextCode] = prevCode;
				dictionaryLengths[nextCode] = dictionaryLengths[prevCode] + 1;
				dictionaryValues[nextCode] = currentSequence[0];
				nextCode++;
				codeLength = nextCode + earlyChange & nextCode + earlyChange - 1 ? codeLength : Math.min(Math.log(nextCode + earlyChange) / .6931471805599453 + 1, 12) | 0;
			}
			prevCode = code;
			decodedLength += currentSequenceLength;
			if (estimatedDecodedSize < decodedLength) {
				do
					estimatedDecodedSize += decodedSizeDelta;
				while (estimatedDecodedSize < decodedLength);
				buffer = this.ensureBuffer(this.bufferLength + estimatedDecodedSize);
			}
			for (j = 0; j < currentSequenceLength; j++) buffer[currentBufferLength++] = currentSequence[j];
		}
		lzwState.nextCode = nextCode;
		lzwState.codeLength = codeLength;
		lzwState.prevCode = prevCode;
		lzwState.currentSequenceLength = currentSequenceLength;
		this.bufferLength = currentBufferLength;
	};
	LZWStream.prototype.readBits = function(n) {
		var bitsCached = this.bitsCached;
		var cachedData = this.cachedData;
		while (bitsCached < n) {
			var c = this.stream.getByte();
			if (c === -1) {
				this.eof = true;
				return null;
			}
			cachedData = cachedData << 8 | c;
			bitsCached += 8;
		}
		this.bitsCached = bitsCached -= n;
		this.cachedData = cachedData;
		return cachedData >>> bitsCached & (1 << n) - 1;
	};
	return LZWStream;
}(DecodeStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/streams/RunLengthStream.js
var RunLengthStream = function(_super) {
	__extends(RunLengthStream, _super);
	function RunLengthStream(stream, maybeLength) {
		var _this = _super.call(this, maybeLength) || this;
		_this.stream = stream;
		return _this;
	}
	RunLengthStream.prototype.readBlock = function() {
		var repeatHeader = this.stream.getBytes(2);
		if (!repeatHeader || repeatHeader.length < 2 || repeatHeader[0] === 128) {
			this.eof = true;
			return;
		}
		var buffer;
		var bufferLength = this.bufferLength;
		var n = repeatHeader[0];
		if (n < 128) {
			buffer = this.ensureBuffer(bufferLength + n + 1);
			buffer[bufferLength++] = repeatHeader[1];
			if (n > 0) {
				var source = this.stream.getBytes(n);
				buffer.set(source, bufferLength);
				bufferLength += n;
			}
		} else {
			n = 257 - n;
			var b = repeatHeader[1];
			buffer = this.ensureBuffer(bufferLength + n + 1);
			for (var i = 0; i < n; i++) buffer[bufferLength++] = b;
		}
		this.bufferLength = bufferLength;
	};
	return RunLengthStream;
}(DecodeStream);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/streams/decode.js
var decodeStream = function(stream, encoding, params) {
	if (encoding === PDFName.of("FlateDecode")) return new FlateStream(stream);
	if (encoding === PDFName.of("LZWDecode")) {
		var earlyChange = 1;
		if (params instanceof PDFDict) {
			var EarlyChange = params.lookup(PDFName.of("EarlyChange"));
			if (EarlyChange instanceof PDFNumber) earlyChange = EarlyChange.asNumber();
		}
		return new LZWStream(stream, void 0, earlyChange);
	}
	if (encoding === PDFName.of("ASCII85Decode")) return new Ascii85Stream(stream);
	if (encoding === PDFName.of("ASCIIHexDecode")) return new AsciiHexStream(stream);
	if (encoding === PDFName.of("RunLengthDecode")) return new RunLengthStream(stream);
	throw new UnsupportedEncodingError(encoding.asString());
};
var decodePDFRawStream = function(_a) {
	var dict = _a.dict, contents = _a.contents;
	var stream = new Stream(contents);
	var Filter = dict.lookup(PDFName.of("Filter"));
	var DecodeParms = dict.lookup(PDFName.of("DecodeParms"));
	if (Filter instanceof PDFName) stream = decodeStream(stream, Filter, DecodeParms);
	else if (Filter instanceof PDFArray) for (var idx = 0, len = Filter.size(); idx < len; idx++) stream = decodeStream(stream, Filter.lookup(idx, PDFName), DecodeParms && DecodeParms.lookupMaybe(idx, PDFDict));
	else if (!!Filter) throw new UnexpectedObjectTypeError([PDFName, PDFArray], Filter);
	return stream;
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/PDFPageEmbedder.js
var fullPageBoundingBox = function(page) {
	var mediaBox = page.MediaBox();
	return {
		left: 0,
		bottom: 0,
		right: mediaBox.lookup(2, PDFNumber).asNumber() - mediaBox.lookup(0, PDFNumber).asNumber(),
		top: mediaBox.lookup(3, PDFNumber).asNumber() - mediaBox.lookup(1, PDFNumber).asNumber()
	};
};
var boundingBoxAdjustedMatrix = function(bb) {
	return [
		1,
		0,
		0,
		1,
		-bb.left,
		-bb.bottom
	];
};
var PDFPageEmbedder = function() {
	function PDFPageEmbedder(page, boundingBox, transformationMatrix) {
		this.page = page;
		var bb = boundingBox !== null && boundingBox !== void 0 ? boundingBox : fullPageBoundingBox(page);
		this.width = bb.right - bb.left;
		this.height = bb.top - bb.bottom;
		this.boundingBox = bb;
		this.transformationMatrix = transformationMatrix !== null && transformationMatrix !== void 0 ? transformationMatrix : boundingBoxAdjustedMatrix(bb);
	}
	PDFPageEmbedder.for = function(page, boundingBox, transformationMatrix) {
		return __awaiter(this, void 0, void 0, function() {
			return __generator(this, function(_a) {
				return [2, new PDFPageEmbedder(page, boundingBox, transformationMatrix)];
			});
		});
	};
	PDFPageEmbedder.prototype.embedIntoContext = function(context, ref) {
		return __awaiter(this, void 0, void 0, function() {
			var _a, Contents, Resources, decodedContents, _b, left, bottom, right, top, xObject;
			return __generator(this, function(_c) {
				_a = this.page.normalizedEntries(), Contents = _a.Contents, Resources = _a.Resources;
				if (!Contents) throw new MissingPageContentsEmbeddingError();
				decodedContents = this.decodeContents(Contents);
				_b = this.boundingBox, left = _b.left, bottom = _b.bottom, right = _b.right, top = _b.top;
				xObject = context.flateStream(decodedContents, {
					Type: "XObject",
					Subtype: "Form",
					FormType: 1,
					BBox: [
						left,
						bottom,
						right,
						top
					],
					Matrix: this.transformationMatrix,
					Resources
				});
				if (ref) {
					context.assign(ref, xObject);
					return [2, ref];
				} else return [2, context.register(xObject)];
			});
		});
	};
	PDFPageEmbedder.prototype.decodeContents = function(contents) {
		var newline = Uint8Array.of(CharCodes_default.Newline);
		var decodedContents = [];
		for (var idx = 0, len = contents.size(); idx < len; idx++) {
			var stream = contents.lookup(idx, PDFStream);
			var content = void 0;
			if (stream instanceof PDFRawStream) content = decodePDFRawStream(stream).decode();
			else if (stream instanceof PDFContentStream) content = stream.getUnencodedContents();
			else throw new UnrecognizedStreamTypeError(stream);
			decodedContents.push(content, newline);
		}
		return mergeIntoTypedArray.apply(void 0, decodedContents);
	};
	return PDFPageEmbedder;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/interactive/ViewerPreferences.js
var asEnum = function(rawValue, enumType) {
	if (rawValue === void 0) return void 0;
	return enumType[rawValue];
};
var NonFullScreenPageMode;
(function(NonFullScreenPageMode) {
	/**
	* After exiting FullScreen mode, neither the document outline nor thumbnail
	* images should be visible.
	*/
	NonFullScreenPageMode["UseNone"] = "UseNone";
	/** After exiting FullScreen mode, the document outline should be visible. */
	NonFullScreenPageMode["UseOutlines"] = "UseOutlines";
	/** After exiting FullScreen mode, thumbnail images should be visible. */
	NonFullScreenPageMode["UseThumbs"] = "UseThumbs";
	/**
	* After exiting FullScreen mode, the optional content group panel should be
	* visible.
	*/
	NonFullScreenPageMode["UseOC"] = "UseOC";
})(NonFullScreenPageMode || (NonFullScreenPageMode = {}));
var ReadingDirection;
(function(ReadingDirection) {
	/** The predominant reading order is Left to Right. */
	ReadingDirection["L2R"] = "L2R";
	/**
	* The predominant reading order is Right to left (including vertical writing
	* systems, such as Chinese, Japanese and Korean).
	*/
	ReadingDirection["R2L"] = "R2L";
})(ReadingDirection || (ReadingDirection = {}));
var PrintScaling;
(function(PrintScaling) {
	/** No page scaling. */
	PrintScaling["None"] = "None";
	PrintScaling["AppDefault"] = "AppDefault";
})(PrintScaling || (PrintScaling = {}));
var Duplex;
(function(Duplex) {
	/** The PDF reader should print single-sided. */
	Duplex["Simplex"] = "Simplex";
	/**
	* The PDF reader should print double sided and flip on the short edge of the
	* sheet.
	*/
	Duplex["DuplexFlipShortEdge"] = "DuplexFlipShortEdge";
	/**
	* The PDF reader should print double sided and flip on the long edge of the
	* sheet.
	*/
	Duplex["DuplexFlipLongEdge"] = "DuplexFlipLongEdge";
})(Duplex || (Duplex = {}));
var ViewerPreferences = function() {
	/** @ignore */
	function ViewerPreferences(dict) {
		this.dict = dict;
	}
	ViewerPreferences.prototype.lookupBool = function(key) {
		var returnObj = this.dict.lookup(PDFName.of(key));
		if (returnObj instanceof PDFBool) return returnObj;
	};
	ViewerPreferences.prototype.lookupName = function(key) {
		var returnObj = this.dict.lookup(PDFName.of(key));
		if (returnObj instanceof PDFName) return returnObj;
	};
	/** @ignore */
	ViewerPreferences.prototype.HideToolbar = function() {
		return this.lookupBool("HideToolbar");
	};
	/** @ignore */
	ViewerPreferences.prototype.HideMenubar = function() {
		return this.lookupBool("HideMenubar");
	};
	/** @ignore */
	ViewerPreferences.prototype.HideWindowUI = function() {
		return this.lookupBool("HideWindowUI");
	};
	/** @ignore */
	ViewerPreferences.prototype.FitWindow = function() {
		return this.lookupBool("FitWindow");
	};
	/** @ignore */
	ViewerPreferences.prototype.CenterWindow = function() {
		return this.lookupBool("CenterWindow");
	};
	/** @ignore */
	ViewerPreferences.prototype.DisplayDocTitle = function() {
		return this.lookupBool("DisplayDocTitle");
	};
	/** @ignore */
	ViewerPreferences.prototype.NonFullScreenPageMode = function() {
		return this.lookupName("NonFullScreenPageMode");
	};
	/** @ignore */
	ViewerPreferences.prototype.Direction = function() {
		return this.lookupName("Direction");
	};
	/** @ignore */
	ViewerPreferences.prototype.PrintScaling = function() {
		return this.lookupName("PrintScaling");
	};
	/** @ignore */
	ViewerPreferences.prototype.Duplex = function() {
		return this.lookupName("Duplex");
	};
	/** @ignore */
	ViewerPreferences.prototype.PickTrayByPDFSize = function() {
		return this.lookupBool("PickTrayByPDFSize");
	};
	/** @ignore */
	ViewerPreferences.prototype.PrintPageRange = function() {
		var PrintPageRange = this.dict.lookup(PDFName.of("PrintPageRange"));
		if (PrintPageRange instanceof PDFArray) return PrintPageRange;
	};
	/** @ignore */
	ViewerPreferences.prototype.NumCopies = function() {
		var NumCopies = this.dict.lookup(PDFName.of("NumCopies"));
		if (NumCopies instanceof PDFNumber) return NumCopies;
	};
	/**
	* Returns `true` if PDF readers should hide the toolbar menus when displaying
	* this document.
	* @returns Whether or not toolbars should be hidden.
	*/
	ViewerPreferences.prototype.getHideToolbar = function() {
		var _a, _b;
		return (_b = (_a = this.HideToolbar()) === null || _a === void 0 ? void 0 : _a.asBoolean()) !== null && _b !== void 0 ? _b : false;
	};
	/**
	* Returns `true` if PDF readers should hide the menu bar when displaying this
	* document.
	* @returns Whether or not the menu bar should be hidden.
	*/
	ViewerPreferences.prototype.getHideMenubar = function() {
		var _a, _b;
		return (_b = (_a = this.HideMenubar()) === null || _a === void 0 ? void 0 : _a.asBoolean()) !== null && _b !== void 0 ? _b : false;
	};
	/**
	* Returns `true` if PDF readers should hide the user interface elements in
	* the document's window (such as scroll bars and navigation controls),
	* leaving only the document's contents displayed.
	* @returns Whether or not user interface elements should be hidden.
	*/
	ViewerPreferences.prototype.getHideWindowUI = function() {
		var _a, _b;
		return (_b = (_a = this.HideWindowUI()) === null || _a === void 0 ? void 0 : _a.asBoolean()) !== null && _b !== void 0 ? _b : false;
	};
	/**
	* Returns `true` if PDF readers should resize the document's window to fit
	* the size of the first displayed page.
	* @returns Whether or not the window should be resized to fit.
	*/
	ViewerPreferences.prototype.getFitWindow = function() {
		var _a, _b;
		return (_b = (_a = this.FitWindow()) === null || _a === void 0 ? void 0 : _a.asBoolean()) !== null && _b !== void 0 ? _b : false;
	};
	/**
	* Returns `true` if PDF readers should position the document's window in the
	* center of the screen.
	* @returns Whether or not to center the document window.
	*/
	ViewerPreferences.prototype.getCenterWindow = function() {
		var _a, _b;
		return (_b = (_a = this.CenterWindow()) === null || _a === void 0 ? void 0 : _a.asBoolean()) !== null && _b !== void 0 ? _b : false;
	};
	/**
	* Returns `true` if the window's title bar should display the document
	* `Title`, taken from the document metadata (see [[PDFDocument.getTitle]]).
	* Returns `false` if the title bar should instead display the filename of the
	* PDF file.
	* @returns Whether to display the document title.
	*/
	ViewerPreferences.prototype.getDisplayDocTitle = function() {
		var _a, _b;
		return (_b = (_a = this.DisplayDocTitle()) === null || _a === void 0 ? void 0 : _a.asBoolean()) !== null && _b !== void 0 ? _b : false;
	};
	/**
	* Returns the page mode, which tells the PDF reader how to display the
	* document after exiting full-screen mode.
	* @returns The page mode after exiting full-screen mode.
	*/
	ViewerPreferences.prototype.getNonFullScreenPageMode = function() {
		var _a, _b;
		return (_b = asEnum((_a = this.NonFullScreenPageMode()) === null || _a === void 0 ? void 0 : _a.decodeText(), NonFullScreenPageMode)) !== null && _b !== void 0 ? _b : NonFullScreenPageMode.UseNone;
	};
	/**
	* Returns the predominant reading order for text.
	* @returns The text reading order.
	*/
	ViewerPreferences.prototype.getReadingDirection = function() {
		var _a, _b;
		return (_b = asEnum((_a = this.Direction()) === null || _a === void 0 ? void 0 : _a.decodeText(), ReadingDirection)) !== null && _b !== void 0 ? _b : ReadingDirection.L2R;
	};
	/**
	* Returns the page scaling option that the PDF reader should select when the
	* print dialog is displayed.
	* @returns The page scaling option.
	*/
	ViewerPreferences.prototype.getPrintScaling = function() {
		var _a, _b;
		return (_b = asEnum((_a = this.PrintScaling()) === null || _a === void 0 ? void 0 : _a.decodeText(), PrintScaling)) !== null && _b !== void 0 ? _b : PrintScaling.AppDefault;
	};
	/**
	* Returns the paper handling option that should be used when printing the
	* file from the print dialog.
	* @returns The paper handling option.
	*/
	ViewerPreferences.prototype.getDuplex = function() {
		var _a;
		return asEnum((_a = this.Duplex()) === null || _a === void 0 ? void 0 : _a.decodeText(), Duplex);
	};
	/**
	* Returns `true` if the PDF page size should be used to select the input
	* paper tray.
	* @returns Whether or not the PDF page size should be used to select the
	*          input paper tray.
	*/
	ViewerPreferences.prototype.getPickTrayByPDFSize = function() {
		var _a;
		return (_a = this.PickTrayByPDFSize()) === null || _a === void 0 ? void 0 : _a.asBoolean();
	};
	/**
	* Returns an array of page number ranges, which are the values used to
	* initialize the print dialog box when the file is printed. Each range
	* specifies the first (`start`) and last (`end`) pages in a sub-range of
	* pages to be printed. The first page of the PDF file is denoted by 0.
	* For example:
	* ```js
	* const viewerPrefs = pdfDoc.catalog.getOrCreateViewerPreferences()
	* const includesPage3 = viewerPrefs
	*   .getPrintRanges()
	*   .some(pr => pr.start =< 2 && pr.end >= 2)
	* if (includesPage3) console.log('printRange includes page 3')
	* ```
	* @returns An array of objects, each with the properties `start` and `end`,
	*          denoting page indices. If not, specified an empty array is
	*          returned.
	*/
	ViewerPreferences.prototype.getPrintPageRange = function() {
		var rng = this.PrintPageRange();
		if (!rng) return [];
		var pageRanges = [];
		for (var i = 0; i < rng.size(); i += 2) {
			var start = rng.lookup(i, PDFNumber).asNumber();
			var end = rng.lookup(i + 1, PDFNumber).asNumber();
			pageRanges.push({
				start,
				end
			});
		}
		return pageRanges;
	};
	/**
	* Returns the number of copies to be printed when the print dialog is opened
	* for this document.
	* @returns The default number of copies to be printed.
	*/
	ViewerPreferences.prototype.getNumCopies = function() {
		var _a, _b;
		return (_b = (_a = this.NumCopies()) === null || _a === void 0 ? void 0 : _a.asNumber()) !== null && _b !== void 0 ? _b : 1;
	};
	/**
	* Choose whether the PDF reader's toolbars should be hidden while the
	* document is active.
	* @param hideToolbar `true` if the toolbar should be hidden.
	*/
	ViewerPreferences.prototype.setHideToolbar = function(hideToolbar) {
		var HideToolbar = this.dict.context.obj(hideToolbar);
		this.dict.set(PDFName.of("HideToolbar"), HideToolbar);
	};
	/**
	* Choose whether the PDF reader's menu bar should be hidden while the
	* document is active.
	* @param hideMenubar `true` if the menu bar should be hidden.
	*/
	ViewerPreferences.prototype.setHideMenubar = function(hideMenubar) {
		var HideMenubar = this.dict.context.obj(hideMenubar);
		this.dict.set(PDFName.of("HideMenubar"), HideMenubar);
	};
	/**
	* Choose whether the PDF reader should hide user interface elements in the
	* document's window (such as scroll bars and navigation controls), leaving
	* only the document's contents displayed.
	* @param hideWindowUI `true` if the user interface elements should be hidden.
	*/
	ViewerPreferences.prototype.setHideWindowUI = function(hideWindowUI) {
		var HideWindowUI = this.dict.context.obj(hideWindowUI);
		this.dict.set(PDFName.of("HideWindowUI"), HideWindowUI);
	};
	/**
	* Choose whether the PDF reader should resize the document's window to fit
	* the size of the first displayed page.
	* @param fitWindow `true` if the window should be resized.
	*/
	ViewerPreferences.prototype.setFitWindow = function(fitWindow) {
		var FitWindow = this.dict.context.obj(fitWindow);
		this.dict.set(PDFName.of("FitWindow"), FitWindow);
	};
	/**
	* Choose whether the PDF reader should position the document's window in the
	* center of the screen.
	* @param centerWindow `true` if the window should be centered.
	*/
	ViewerPreferences.prototype.setCenterWindow = function(centerWindow) {
		var CenterWindow = this.dict.context.obj(centerWindow);
		this.dict.set(PDFName.of("CenterWindow"), CenterWindow);
	};
	/**
	* Choose whether the window's title bar should display the document `Title`
	* taken from the document metadata (see [[PDFDocument.setTitle]]). If
	* `false`, the title bar should instead display the PDF filename.
	* @param displayTitle `true` if the document title should be displayed.
	*/
	ViewerPreferences.prototype.setDisplayDocTitle = function(displayTitle) {
		var DisplayDocTitle = this.dict.context.obj(displayTitle);
		this.dict.set(PDFName.of("DisplayDocTitle"), DisplayDocTitle);
	};
	/**
	* Choose how the PDF reader should display the document upon exiting
	* full-screen mode. This entry is meaningful only if the value of the
	* `PageMode` entry in the document's [[PDFCatalog]] is `FullScreen`.
	*
	* For example:
	* ```js
	* import { PDFDocument, NonFullScreenPageMode, PDFName } from 'pdf-lib'
	*
	* const pdfDoc = await PDFDocument.create()
	*
	* // Set the PageMode
	* pdfDoc.catalog.set(PDFName.of('PageMode'),PDFName.of('FullScreen'))
	*
	* // Set what happens when full-screen is closed
	* const viewerPrefs = pdfDoc.catalog.getOrCreateViewerPreferences()
	* viewerPrefs.setNonFullScreenPageMode(NonFullScreenPageMode.UseOutlines)
	* ```
	*
	* @param nonFullScreenPageMode How the document should be displayed upon
	*                              exiting full screen mode.
	*/
	ViewerPreferences.prototype.setNonFullScreenPageMode = function(nonFullScreenPageMode) {
		assertIsOneOf(nonFullScreenPageMode, "nonFullScreenPageMode", NonFullScreenPageMode);
		var mode = PDFName.of(nonFullScreenPageMode);
		this.dict.set(PDFName.of("NonFullScreenPageMode"), mode);
	};
	/**
	* Choose the predominant reading order for text.
	*
	* This entry has no direct effect on the document's contents or page
	* numbering, but may be used to determine the relative positioning of pages
	* when displayed side by side or printed n-up.
	*
	* For example:
	* ```js
	* import { PDFDocument, ReadingDirection } from 'pdf-lib'
	*
	* const pdfDoc = await PDFDocument.create()
	* const viewerPrefs = pdfDoc.catalog.getOrCreateViewerPreferences()
	* viewerPrefs.setReadingDirection(ReadingDirection.R2L)
	* ```
	*
	* @param readingDirection The reading order for text.
	*/
	ViewerPreferences.prototype.setReadingDirection = function(readingDirection) {
		assertIsOneOf(readingDirection, "readingDirection", ReadingDirection);
		var direction = PDFName.of(readingDirection);
		this.dict.set(PDFName.of("Direction"), direction);
	};
	/**
	* Choose the page scaling option that should be selected when a print dialog
	* is displayed for this document.
	*
	* For example:
	* ```js
	* import { PDFDocument, PrintScaling } from 'pdf-lib'
	*
	* const pdfDoc = await PDFDocument.create()
	* const viewerPrefs = pdfDoc.catalog.getOrCreateViewerPreferences()
	* viewerPrefs.setPrintScaling(PrintScaling.None)
	* ```
	*
	* @param printScaling The print scaling option.
	*/
	ViewerPreferences.prototype.setPrintScaling = function(printScaling) {
		assertIsOneOf(printScaling, "printScaling", PrintScaling);
		var scaling = PDFName.of(printScaling);
		this.dict.set(PDFName.of("PrintScaling"), scaling);
	};
	/**
	* Choose the paper handling option that should be selected by default in the
	* print dialog.
	*
	* For example:
	* ```js
	* import { PDFDocument, Duplex } from 'pdf-lib'
	*
	* const pdfDoc = await PDFDocument.create()
	* const viewerPrefs = pdfDoc.catalog.getOrCreateViewerPreferences()
	* viewerPrefs.setDuplex(Duplex.DuplexFlipShortEdge)
	* ```
	*
	* @param duplex The double or single sided printing option.
	*/
	ViewerPreferences.prototype.setDuplex = function(duplex) {
		assertIsOneOf(duplex, "duplex", Duplex);
		var dup = PDFName.of(duplex);
		this.dict.set(PDFName.of("Duplex"), dup);
	};
	/**
	* Choose whether the PDF document's page size should be used to select the
	* input paper tray when printing. This setting influences only the preset
	* values used to populate the print dialog presented by a PDF reader.
	*
	* If PickTrayByPDFSize is true, the check box in the print dialog associated
	* with input paper tray should be checked. This setting has no effect on
	* operating systems that do not provide the ability to pick the input tray
	* by size.
	*
	* @param pickTrayByPDFSize `true` if the document's page size should be used
	*                          to select the input paper tray.
	*/
	ViewerPreferences.prototype.setPickTrayByPDFSize = function(pickTrayByPDFSize) {
		var PickTrayByPDFSize = this.dict.context.obj(pickTrayByPDFSize);
		this.dict.set(PDFName.of("PickTrayByPDFSize"), PickTrayByPDFSize);
	};
	/**
	* Choose the page numbers used to initialize the print dialog box when the
	* file is printed. The first page of the PDF file is denoted by 0.
	*
	* For example:
	* ```js
	* import { PDFDocument } from 'pdf-lib'
	*
	* const pdfDoc = await PDFDocument.create()
	* const viewerPrefs = pdfDoc.catalog.getOrCreateViewerPreferences()
	*
	* // We can set the default print range to only the first page
	* viewerPrefs.setPrintPageRange({ start: 0, end: 0 })
	*
	* // Or we can supply noncontiguous ranges (e.g. pages 1, 3, and 5-7)
	* viewerPrefs.setPrintPageRange([
	*   { start: 0, end: 0 },
	*   { start: 2, end: 2 },
	*   { start: 4, end: 6 },
	* ])
	* ```
	*
	* @param printPageRange An object or array of objects, each with the
	*                       properties `start` and `end`, denoting a range of
	*                       page indices.
	*/
	ViewerPreferences.prototype.setPrintPageRange = function(printPageRange) {
		if (!Array.isArray(printPageRange)) printPageRange = [printPageRange];
		var flatRange = [];
		for (var idx = 0, len = printPageRange.length; idx < len; idx++) {
			flatRange.push(printPageRange[idx].start);
			flatRange.push(printPageRange[idx].end);
		}
		assertEachIs(flatRange, "printPageRange", ["number"]);
		var pageRanges = this.dict.context.obj(flatRange);
		this.dict.set(PDFName.of("PrintPageRange"), pageRanges);
	};
	/**
	* Choose the default number of copies to be printed when the print dialog is
	* opened for this file.
	* @param numCopies The default number of copies.
	*/
	ViewerPreferences.prototype.setNumCopies = function(numCopies) {
		assertRange(numCopies, "numCopies", 1, Number.MAX_VALUE);
		assertInteger(numCopies, "numCopies");
		var NumCopies = this.dict.context.obj(numCopies);
		this.dict.set(PDFName.of("NumCopies"), NumCopies);
	};
	/** @ignore */
	ViewerPreferences.fromDict = function(dict) {
		return new ViewerPreferences(dict);
	};
	/** @ignore */
	ViewerPreferences.create = function(context) {
		return new ViewerPreferences(context.obj({}));
	};
	return ViewerPreferences;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroField.js
var tfRegex$1 = /\/([^\0\t\n\f\r\ ]+)[\0\t\n\f\r\ ]*(\d*\.\d+|\d+)?[\0\t\n\f\r\ ]+Tf/;
var PDFAcroField = function() {
	function PDFAcroField(dict, ref) {
		this.dict = dict;
		this.ref = ref;
	}
	PDFAcroField.prototype.T = function() {
		return this.dict.lookupMaybe(PDFName.of("T"), PDFString, PDFHexString);
	};
	PDFAcroField.prototype.Ff = function() {
		var numberOrRef = this.getInheritableAttribute(PDFName.of("Ff"));
		return this.dict.context.lookupMaybe(numberOrRef, PDFNumber);
	};
	PDFAcroField.prototype.V = function() {
		var valueOrRef = this.getInheritableAttribute(PDFName.of("V"));
		return this.dict.context.lookup(valueOrRef);
	};
	PDFAcroField.prototype.Kids = function() {
		return this.dict.lookupMaybe(PDFName.of("Kids"), PDFArray);
	};
	PDFAcroField.prototype.DA = function() {
		var da = this.dict.lookup(PDFName.of("DA"));
		if (da instanceof PDFString || da instanceof PDFHexString) return da;
	};
	PDFAcroField.prototype.setKids = function(kids) {
		this.dict.set(PDFName.of("Kids"), this.dict.context.obj(kids));
	};
	PDFAcroField.prototype.getParent = function() {
		var parentRef = this.dict.get(PDFName.of("Parent"));
		if (parentRef instanceof PDFRef) return new PDFAcroField(this.dict.lookup(PDFName.of("Parent"), PDFDict), parentRef);
	};
	PDFAcroField.prototype.setParent = function(parent) {
		if (!parent) this.dict.delete(PDFName.of("Parent"));
		else this.dict.set(PDFName.of("Parent"), parent);
	};
	PDFAcroField.prototype.getFullyQualifiedName = function() {
		var parent = this.getParent();
		if (!parent) return this.getPartialName();
		return parent.getFullyQualifiedName() + "." + this.getPartialName();
	};
	PDFAcroField.prototype.getPartialName = function() {
		var _a;
		return (_a = this.T()) === null || _a === void 0 ? void 0 : _a.decodeText();
	};
	PDFAcroField.prototype.setPartialName = function(partialName) {
		if (!partialName) this.dict.delete(PDFName.of("T"));
		else this.dict.set(PDFName.of("T"), PDFHexString.fromText(partialName));
	};
	PDFAcroField.prototype.setDefaultAppearance = function(appearance) {
		this.dict.set(PDFName.of("DA"), PDFString.of(appearance));
	};
	PDFAcroField.prototype.getDefaultAppearance = function() {
		var DA = this.DA();
		if (DA instanceof PDFHexString) return DA.decodeText();
		return DA === null || DA === void 0 ? void 0 : DA.asString();
	};
	PDFAcroField.prototype.setFontSize = function(fontSize) {
		var _a;
		var name = (_a = this.getFullyQualifiedName()) !== null && _a !== void 0 ? _a : "";
		var da = this.getDefaultAppearance();
		if (!da) throw new MissingDAEntryError(name);
		var daMatch = findLastMatch(da, tfRegex$1);
		if (!daMatch.match) throw new MissingTfOperatorError(name);
		var daStart = da.slice(0, daMatch.pos - daMatch.match[0].length);
		var daEnd = daMatch.pos <= da.length ? da.slice(daMatch.pos) : "";
		var fontName = daMatch.match[1];
		var modifiedDa = daStart + " /" + fontName + " " + fontSize + " Tf " + daEnd;
		this.setDefaultAppearance(modifiedDa);
	};
	PDFAcroField.prototype.getFlags = function() {
		var _a, _b;
		return (_b = (_a = this.Ff()) === null || _a === void 0 ? void 0 : _a.asNumber()) !== null && _b !== void 0 ? _b : 0;
	};
	PDFAcroField.prototype.setFlags = function(flags) {
		this.dict.set(PDFName.of("Ff"), PDFNumber.of(flags));
	};
	PDFAcroField.prototype.hasFlag = function(flag) {
		return (this.getFlags() & flag) !== 0;
	};
	PDFAcroField.prototype.setFlag = function(flag) {
		var flags = this.getFlags();
		this.setFlags(flags | flag);
	};
	PDFAcroField.prototype.clearFlag = function(flag) {
		var flags = this.getFlags();
		this.setFlags(flags & ~flag);
	};
	PDFAcroField.prototype.setFlagTo = function(flag, enable) {
		if (enable) this.setFlag(flag);
		else this.clearFlag(flag);
	};
	PDFAcroField.prototype.getInheritableAttribute = function(name) {
		var attribute;
		this.ascend(function(node) {
			if (!attribute) attribute = node.dict.get(name);
		});
		return attribute;
	};
	PDFAcroField.prototype.ascend = function(visitor) {
		visitor(this);
		var parent = this.getParent();
		if (parent) parent.ascend(visitor);
	};
	return PDFAcroField;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/annotation/BorderStyle.js
var BorderStyle = function() {
	function BorderStyle(dict) {
		this.dict = dict;
	}
	BorderStyle.prototype.W = function() {
		var W = this.dict.lookup(PDFName.of("W"));
		if (W instanceof PDFNumber) return W;
	};
	BorderStyle.prototype.getWidth = function() {
		var _a, _b;
		return (_b = (_a = this.W()) === null || _a === void 0 ? void 0 : _a.asNumber()) !== null && _b !== void 0 ? _b : 1;
	};
	BorderStyle.prototype.setWidth = function(width) {
		var W = this.dict.context.obj(width);
		this.dict.set(PDFName.of("W"), W);
	};
	BorderStyle.fromDict = function(dict) {
		return new BorderStyle(dict);
	};
	return BorderStyle;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/annotation/PDFAnnotation.js
var PDFAnnotation = function() {
	function PDFAnnotation(dict) {
		this.dict = dict;
	}
	PDFAnnotation.prototype.Rect = function() {
		return this.dict.lookup(PDFName.of("Rect"), PDFArray);
	};
	PDFAnnotation.prototype.AP = function() {
		return this.dict.lookupMaybe(PDFName.of("AP"), PDFDict);
	};
	PDFAnnotation.prototype.F = function() {
		var numberOrRef = this.dict.lookup(PDFName.of("F"));
		return this.dict.context.lookupMaybe(numberOrRef, PDFNumber);
	};
	PDFAnnotation.prototype.getRectangle = function() {
		var _a;
		var Rect = this.Rect();
		return (_a = Rect === null || Rect === void 0 ? void 0 : Rect.asRectangle()) !== null && _a !== void 0 ? _a : {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		};
	};
	PDFAnnotation.prototype.setRectangle = function(rect) {
		var x = rect.x, y = rect.y, width = rect.width, height = rect.height;
		var Rect = this.dict.context.obj([
			x,
			y,
			x + width,
			y + height
		]);
		this.dict.set(PDFName.of("Rect"), Rect);
	};
	PDFAnnotation.prototype.getAppearanceState = function() {
		var AS = this.dict.lookup(PDFName.of("AS"));
		if (AS instanceof PDFName) return AS;
	};
	PDFAnnotation.prototype.setAppearanceState = function(state) {
		this.dict.set(PDFName.of("AS"), state);
	};
	PDFAnnotation.prototype.setAppearances = function(appearances) {
		this.dict.set(PDFName.of("AP"), appearances);
	};
	PDFAnnotation.prototype.ensureAP = function() {
		var AP = this.AP();
		if (!AP) {
			AP = this.dict.context.obj({});
			this.dict.set(PDFName.of("AP"), AP);
		}
		return AP;
	};
	PDFAnnotation.prototype.getNormalAppearance = function() {
		var N = this.ensureAP().get(PDFName.of("N"));
		if (N instanceof PDFRef || N instanceof PDFDict) return N;
		throw new Error("Unexpected N type: " + (N === null || N === void 0 ? void 0 : N.constructor.name));
	};
	/** @param appearance A PDFDict or PDFStream (direct or ref) */
	PDFAnnotation.prototype.setNormalAppearance = function(appearance) {
		this.ensureAP().set(PDFName.of("N"), appearance);
	};
	/** @param appearance A PDFDict or PDFStream (direct or ref) */
	PDFAnnotation.prototype.setRolloverAppearance = function(appearance) {
		this.ensureAP().set(PDFName.of("R"), appearance);
	};
	/** @param appearance A PDFDict or PDFStream (direct or ref) */
	PDFAnnotation.prototype.setDownAppearance = function(appearance) {
		this.ensureAP().set(PDFName.of("D"), appearance);
	};
	PDFAnnotation.prototype.removeRolloverAppearance = function() {
		var AP = this.AP();
		AP === null || AP === void 0 || AP.delete(PDFName.of("R"));
	};
	PDFAnnotation.prototype.removeDownAppearance = function() {
		var AP = this.AP();
		AP === null || AP === void 0 || AP.delete(PDFName.of("D"));
	};
	PDFAnnotation.prototype.getAppearances = function() {
		var AP = this.AP();
		if (!AP) return void 0;
		return {
			normal: AP.lookup(PDFName.of("N"), PDFDict, PDFStream),
			rollover: AP.lookupMaybe(PDFName.of("R"), PDFDict, PDFStream),
			down: AP.lookupMaybe(PDFName.of("D"), PDFDict, PDFStream)
		};
	};
	PDFAnnotation.prototype.getFlags = function() {
		var _a, _b;
		return (_b = (_a = this.F()) === null || _a === void 0 ? void 0 : _a.asNumber()) !== null && _b !== void 0 ? _b : 0;
	};
	PDFAnnotation.prototype.setFlags = function(flags) {
		this.dict.set(PDFName.of("F"), PDFNumber.of(flags));
	};
	PDFAnnotation.prototype.hasFlag = function(flag) {
		return (this.getFlags() & flag) !== 0;
	};
	PDFAnnotation.prototype.setFlag = function(flag) {
		var flags = this.getFlags();
		this.setFlags(flags | flag);
	};
	PDFAnnotation.prototype.clearFlag = function(flag) {
		var flags = this.getFlags();
		this.setFlags(flags & ~flag);
	};
	PDFAnnotation.prototype.setFlagTo = function(flag, enable) {
		if (enable) this.setFlag(flag);
		else this.clearFlag(flag);
	};
	PDFAnnotation.fromDict = function(dict) {
		return new PDFAnnotation(dict);
	};
	return PDFAnnotation;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/annotation/AppearanceCharacteristics.js
var AppearanceCharacteristics = function() {
	function AppearanceCharacteristics(dict) {
		this.dict = dict;
	}
	AppearanceCharacteristics.prototype.R = function() {
		var R = this.dict.lookup(PDFName.of("R"));
		if (R instanceof PDFNumber) return R;
	};
	AppearanceCharacteristics.prototype.BC = function() {
		var BC = this.dict.lookup(PDFName.of("BC"));
		if (BC instanceof PDFArray) return BC;
	};
	AppearanceCharacteristics.prototype.BG = function() {
		var BG = this.dict.lookup(PDFName.of("BG"));
		if (BG instanceof PDFArray) return BG;
	};
	AppearanceCharacteristics.prototype.CA = function() {
		var CA = this.dict.lookup(PDFName.of("CA"));
		if (CA instanceof PDFHexString || CA instanceof PDFString) return CA;
	};
	AppearanceCharacteristics.prototype.RC = function() {
		var RC = this.dict.lookup(PDFName.of("RC"));
		if (RC instanceof PDFHexString || RC instanceof PDFString) return RC;
	};
	AppearanceCharacteristics.prototype.AC = function() {
		var AC = this.dict.lookup(PDFName.of("AC"));
		if (AC instanceof PDFHexString || AC instanceof PDFString) return AC;
	};
	AppearanceCharacteristics.prototype.getRotation = function() {
		var _a;
		return (_a = this.R()) === null || _a === void 0 ? void 0 : _a.asNumber();
	};
	AppearanceCharacteristics.prototype.getBorderColor = function() {
		var BC = this.BC();
		if (!BC) return void 0;
		var components = [];
		for (var idx = 0, len = BC === null || BC === void 0 ? void 0 : BC.size(); idx < len; idx++) {
			var component = BC.get(idx);
			if (component instanceof PDFNumber) components.push(component.asNumber());
		}
		return components;
	};
	AppearanceCharacteristics.prototype.getBackgroundColor = function() {
		var BG = this.BG();
		if (!BG) return void 0;
		var components = [];
		for (var idx = 0, len = BG === null || BG === void 0 ? void 0 : BG.size(); idx < len; idx++) {
			var component = BG.get(idx);
			if (component instanceof PDFNumber) components.push(component.asNumber());
		}
		return components;
	};
	AppearanceCharacteristics.prototype.getCaptions = function() {
		var CA = this.CA();
		var RC = this.RC();
		var AC = this.AC();
		return {
			normal: CA === null || CA === void 0 ? void 0 : CA.decodeText(),
			rollover: RC === null || RC === void 0 ? void 0 : RC.decodeText(),
			down: AC === null || AC === void 0 ? void 0 : AC.decodeText()
		};
	};
	AppearanceCharacteristics.prototype.setRotation = function(rotation) {
		var R = this.dict.context.obj(rotation);
		this.dict.set(PDFName.of("R"), R);
	};
	AppearanceCharacteristics.prototype.setBorderColor = function(color) {
		var BC = this.dict.context.obj(color);
		this.dict.set(PDFName.of("BC"), BC);
	};
	AppearanceCharacteristics.prototype.setBackgroundColor = function(color) {
		var BG = this.dict.context.obj(color);
		this.dict.set(PDFName.of("BG"), BG);
	};
	AppearanceCharacteristics.prototype.setCaptions = function(captions) {
		var CA = PDFHexString.fromText(captions.normal);
		this.dict.set(PDFName.of("CA"), CA);
		if (captions.rollover) {
			var RC = PDFHexString.fromText(captions.rollover);
			this.dict.set(PDFName.of("RC"), RC);
		} else this.dict.delete(PDFName.of("RC"));
		if (captions.down) {
			var AC = PDFHexString.fromText(captions.down);
			this.dict.set(PDFName.of("AC"), AC);
		} else this.dict.delete(PDFName.of("AC"));
	};
	AppearanceCharacteristics.fromDict = function(dict) {
		return new AppearanceCharacteristics(dict);
	};
	return AppearanceCharacteristics;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/annotation/PDFWidgetAnnotation.js
var PDFWidgetAnnotation = function(_super) {
	__extends(PDFWidgetAnnotation, _super);
	function PDFWidgetAnnotation() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFWidgetAnnotation.prototype.MK = function() {
		var MK = this.dict.lookup(PDFName.of("MK"));
		if (MK instanceof PDFDict) return MK;
	};
	PDFWidgetAnnotation.prototype.BS = function() {
		var BS = this.dict.lookup(PDFName.of("BS"));
		if (BS instanceof PDFDict) return BS;
	};
	PDFWidgetAnnotation.prototype.DA = function() {
		var da = this.dict.lookup(PDFName.of("DA"));
		if (da instanceof PDFString || da instanceof PDFHexString) return da;
	};
	PDFWidgetAnnotation.prototype.P = function() {
		var P = this.dict.get(PDFName.of("P"));
		if (P instanceof PDFRef) return P;
	};
	PDFWidgetAnnotation.prototype.setP = function(page) {
		this.dict.set(PDFName.of("P"), page);
	};
	PDFWidgetAnnotation.prototype.setDefaultAppearance = function(appearance) {
		this.dict.set(PDFName.of("DA"), PDFString.of(appearance));
	};
	PDFWidgetAnnotation.prototype.getDefaultAppearance = function() {
		var DA = this.DA();
		if (DA instanceof PDFHexString) return DA.decodeText();
		return DA === null || DA === void 0 ? void 0 : DA.asString();
	};
	PDFWidgetAnnotation.prototype.getAppearanceCharacteristics = function() {
		var MK = this.MK();
		if (MK) return AppearanceCharacteristics.fromDict(MK);
	};
	PDFWidgetAnnotation.prototype.getOrCreateAppearanceCharacteristics = function() {
		var MK = this.MK();
		if (MK) return AppearanceCharacteristics.fromDict(MK);
		var ac = AppearanceCharacteristics.fromDict(this.dict.context.obj({}));
		this.dict.set(PDFName.of("MK"), ac.dict);
		return ac;
	};
	PDFWidgetAnnotation.prototype.getBorderStyle = function() {
		var BS = this.BS();
		if (BS) return BorderStyle.fromDict(BS);
	};
	PDFWidgetAnnotation.prototype.getOrCreateBorderStyle = function() {
		var BS = this.BS();
		if (BS) return BorderStyle.fromDict(BS);
		var bs = BorderStyle.fromDict(this.dict.context.obj({}));
		this.dict.set(PDFName.of("BS"), bs.dict);
		return bs;
	};
	PDFWidgetAnnotation.prototype.getOnValue = function() {
		var _a;
		var normal = (_a = this.getAppearances()) === null || _a === void 0 ? void 0 : _a.normal;
		if (normal instanceof PDFDict) {
			var keys = normal.keys();
			for (var idx = 0, len = keys.length; idx < len; idx++) {
				var key = keys[idx];
				if (key !== PDFName.of("Off")) return key;
			}
		}
	};
	PDFWidgetAnnotation.fromDict = function(dict) {
		return new PDFWidgetAnnotation(dict);
	};
	PDFWidgetAnnotation.create = function(context, parent) {
		return new PDFWidgetAnnotation(context.obj({
			Type: "Annot",
			Subtype: "Widget",
			Rect: [
				0,
				0,
				0,
				0
			],
			Parent: parent
		}));
	};
	return PDFWidgetAnnotation;
}(PDFAnnotation);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroTerminal.js
var PDFAcroTerminal = function(_super) {
	__extends(PDFAcroTerminal, _super);
	function PDFAcroTerminal() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroTerminal.prototype.FT = function() {
		var nameOrRef = this.getInheritableAttribute(PDFName.of("FT"));
		return this.dict.context.lookup(nameOrRef, PDFName);
	};
	PDFAcroTerminal.prototype.getWidgets = function() {
		var kidDicts = this.Kids();
		if (!kidDicts) return [PDFWidgetAnnotation.fromDict(this.dict)];
		var widgets = new Array(kidDicts.size());
		for (var idx = 0, len = kidDicts.size(); idx < len; idx++) {
			var dict = kidDicts.lookup(idx, PDFDict);
			widgets[idx] = PDFWidgetAnnotation.fromDict(dict);
		}
		return widgets;
	};
	PDFAcroTerminal.prototype.addWidget = function(ref) {
		this.normalizedEntries().Kids.push(ref);
	};
	PDFAcroTerminal.prototype.removeWidget = function(idx) {
		var kidDicts = this.Kids();
		if (!kidDicts) {
			if (idx !== 0) throw new IndexOutOfBoundsError(idx, 0, 0);
			this.setKids([]);
		} else {
			if (idx < 0 || idx > kidDicts.size()) throw new IndexOutOfBoundsError(idx, 0, kidDicts.size());
			kidDicts.remove(idx);
		}
	};
	PDFAcroTerminal.prototype.normalizedEntries = function() {
		var Kids = this.Kids();
		if (!Kids) {
			Kids = this.dict.context.obj([this.ref]);
			this.dict.set(PDFName.of("Kids"), Kids);
		}
		return { Kids };
	};
	PDFAcroTerminal.fromDict = function(dict, ref) {
		return new PDFAcroTerminal(dict, ref);
	};
	return PDFAcroTerminal;
}(PDFAcroField);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroButton.js
var PDFAcroButton = function(_super) {
	__extends(PDFAcroButton, _super);
	function PDFAcroButton() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroButton.prototype.Opt = function() {
		return this.dict.lookupMaybe(PDFName.of("Opt"), PDFString, PDFHexString, PDFArray);
	};
	PDFAcroButton.prototype.setOpt = function(opt) {
		this.dict.set(PDFName.of("Opt"), this.dict.context.obj(opt));
	};
	PDFAcroButton.prototype.getExportValues = function() {
		var opt = this.Opt();
		if (!opt) return void 0;
		if (opt instanceof PDFString || opt instanceof PDFHexString) return [opt];
		var values = [];
		for (var idx = 0, len = opt.size(); idx < len; idx++) {
			var value = opt.lookup(idx);
			if (value instanceof PDFString || value instanceof PDFHexString) values.push(value);
		}
		return values;
	};
	PDFAcroButton.prototype.removeExportValue = function(idx) {
		var opt = this.Opt();
		if (!opt) return;
		if (opt instanceof PDFString || opt instanceof PDFHexString) {
			if (idx !== 0) throw new IndexOutOfBoundsError(idx, 0, 0);
			this.setOpt([]);
		} else {
			if (idx < 0 || idx > opt.size()) throw new IndexOutOfBoundsError(idx, 0, opt.size());
			opt.remove(idx);
		}
	};
	PDFAcroButton.prototype.normalizeExportValues = function() {
		var _a, _b, _c, _d;
		var exportValues = (_a = this.getExportValues()) !== null && _a !== void 0 ? _a : [];
		var Opt = [];
		var widgets = this.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			var exportVal = (_b = exportValues[idx]) !== null && _b !== void 0 ? _b : PDFHexString.fromText((_d = (_c = widget.getOnValue()) === null || _c === void 0 ? void 0 : _c.decodeText()) !== null && _d !== void 0 ? _d : "");
			Opt.push(exportVal);
		}
		this.setOpt(Opt);
	};
	/**
	* Reuses existing opt if one exists with the same value (assuming
	* `useExistingIdx` is `true`). Returns index of existing (or new) opt.
	*/
	PDFAcroButton.prototype.addOpt = function(opt, useExistingOptIdx) {
		var _a;
		this.normalizeExportValues();
		var optText = opt.decodeText();
		var existingIdx;
		if (useExistingOptIdx) {
			var exportValues = (_a = this.getExportValues()) !== null && _a !== void 0 ? _a : [];
			for (var idx = 0, len = exportValues.length; idx < len; idx++) if (exportValues[idx].decodeText() === optText) existingIdx = idx;
		}
		var Opt = this.Opt();
		Opt.push(opt);
		return existingIdx !== null && existingIdx !== void 0 ? existingIdx : Opt.size() - 1;
	};
	PDFAcroButton.prototype.addWidgetWithOpt = function(widget, opt, useExistingOptIdx) {
		var optIdx = this.addOpt(opt, useExistingOptIdx);
		var apStateValue = PDFName.of(String(optIdx));
		this.addWidget(widget);
		return apStateValue;
	};
	return PDFAcroButton;
}(PDFAcroTerminal);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroCheckBox.js
var PDFAcroCheckBox = function(_super) {
	__extends(PDFAcroCheckBox, _super);
	function PDFAcroCheckBox() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroCheckBox.prototype.setValue = function(value) {
		var _a;
		if (value !== ((_a = this.getOnValue()) !== null && _a !== void 0 ? _a : PDFName.of("Yes")) && value !== PDFName.of("Off")) throw new InvalidAcroFieldValueError();
		this.dict.set(PDFName.of("V"), value);
		var widgets = this.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			var state = widget.getOnValue() === value ? value : PDFName.of("Off");
			widget.setAppearanceState(state);
		}
	};
	PDFAcroCheckBox.prototype.getValue = function() {
		var v = this.V();
		if (v instanceof PDFName) return v;
		return PDFName.of("Off");
	};
	PDFAcroCheckBox.prototype.getOnValue = function() {
		var widget = this.getWidgets()[0];
		return widget === null || widget === void 0 ? void 0 : widget.getOnValue();
	};
	PDFAcroCheckBox.fromDict = function(dict, ref) {
		return new PDFAcroCheckBox(dict, ref);
	};
	PDFAcroCheckBox.create = function(context) {
		var dict = context.obj({
			FT: "Btn",
			Kids: []
		});
		return new PDFAcroCheckBox(dict, context.register(dict));
	};
	return PDFAcroCheckBox;
}(PDFAcroButton);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/flags.js
var flag$1 = function(bitIndex) {
	return 1 << bitIndex;
};
/** From PDF spec table 221 */
var AcroFieldFlags;
(function(AcroFieldFlags) {
	/**
	* If set, the user may not change the value of the field. Any associated
	* widget annotations will not interact with the user; that is, they will not
	* respond to mouse clicks or change their appearance in response to mouse
	* motions. This flag is useful for fields whose values are computed or
	* imported from a database.
	*/
	AcroFieldFlags[AcroFieldFlags["ReadOnly"] = flag$1(0)] = "ReadOnly";
	/**
	* If set, the field shall have a value at the time it is exported by a
	* submit-form action (see 12.7.5.2, "Submit-Form Action").
	*/
	AcroFieldFlags[AcroFieldFlags["Required"] = flag$1(1)] = "Required";
	/**
	* If set, the field shall not be exported by a submit-form action
	* (see 12.7.5.2, "Submit-Form Action").
	*/
	AcroFieldFlags[AcroFieldFlags["NoExport"] = flag$1(2)] = "NoExport";
})(AcroFieldFlags || (AcroFieldFlags = {}));
/** From PDF spec table 226 */
var AcroButtonFlags;
(function(AcroButtonFlags) {
	/**
	* (Radio buttons only) If set, exactly one radio button shall be selected at
	* all times; selecting the currently selected button has no effect. If clear,
	* clicking the selected button deselects it, leaving no button selected.
	*/
	AcroButtonFlags[AcroButtonFlags["NoToggleToOff"] = flag$1(14)] = "NoToggleToOff";
	/**
	* If set, the field is a set of radio buttons; if clear, the field is a check
	* box. This flag may be set only if the Pushbutton flag is clear.
	*/
	AcroButtonFlags[AcroButtonFlags["Radio"] = flag$1(15)] = "Radio";
	/**
	* If set, the field is a pushbutton that does not retain a permanent value.
	*/
	AcroButtonFlags[AcroButtonFlags["PushButton"] = flag$1(16)] = "PushButton";
	/**
	* If set, a group of radio buttons within a radio button field that use the
	* same value for the on state will turn on and off in unison; that is if one
	* is checked, they are all checked. If clear, the buttons are mutually
	* exclusive (the same behavior as HTML radio buttons).
	*/
	AcroButtonFlags[AcroButtonFlags["RadiosInUnison"] = flag$1(25)] = "RadiosInUnison";
})(AcroButtonFlags || (AcroButtonFlags = {}));
/** From PDF spec table 228 */
var AcroTextFlags;
(function(AcroTextFlags) {
	/**
	* If set, the field may contain multiple lines of text; if clear, the field's
	* text shall be restricted to a single line.
	*/
	AcroTextFlags[AcroTextFlags["Multiline"] = flag$1(12)] = "Multiline";
	/**
	* If set, the field is intended for entering a secure password that should
	* not be echoed visibly to the screen. Characters typed from the keyboard
	* shall instead be echoed in some unreadable form, such as asterisks or
	* bullet characters.
	* > NOTE   To protect password confidentiality, readers should never store
	* >        the value of the text field in the PDF file if this flag is set.
	*/
	AcroTextFlags[AcroTextFlags["Password"] = flag$1(13)] = "Password";
	/**
	* If set, the text entered in the field represents the pathname of a file
	* whose contents shall be submitted as the value of the field.
	*/
	AcroTextFlags[AcroTextFlags["FileSelect"] = flag$1(20)] = "FileSelect";
	/**
	* If set, text entered in the field shall not be spell-checked.
	*/
	AcroTextFlags[AcroTextFlags["DoNotSpellCheck"] = flag$1(22)] = "DoNotSpellCheck";
	/**
	* If set, the field shall not scroll (horizontally for single-line fields,
	* vertically for multiple-line fields) to accommodate more text than fits
	* within its annotation rectangle. Once the field is full, no further text
	* shall be accepted for interactive form filling; for non-interactive form
	* filling, the filler should take care not to add more character than will
	* visibly fit in the defined area.
	*/
	AcroTextFlags[AcroTextFlags["DoNotScroll"] = flag$1(23)] = "DoNotScroll";
	/**
	* May be set only if the MaxLen entry is present in the text field dictionary
	* (see Table 229) and if the Multiline, Password, and FileSelect flags are
	* clear. If set, the field shall be automatically divided into as many
	* equally spaced positions, or combs, as the value of MaxLen, and the text
	* is laid out into those combs.
	*/
	AcroTextFlags[AcroTextFlags["Comb"] = flag$1(24)] = "Comb";
	/**
	* If set, the value of this field shall be a rich text string
	* (see 12.7.3.4, "Rich Text Strings"). If the field has a value, the RV
	* entry of the field dictionary (Table 222) shall specify the rich text
	* string.
	*/
	AcroTextFlags[AcroTextFlags["RichText"] = flag$1(25)] = "RichText";
})(AcroTextFlags || (AcroTextFlags = {}));
/** From PDF spec table 230 */
var AcroChoiceFlags;
(function(AcroChoiceFlags) {
	/**
	* If set, the field is a combo box; if clear, the field is a list box.
	*/
	AcroChoiceFlags[AcroChoiceFlags["Combo"] = flag$1(17)] = "Combo";
	/**
	* If set, the combo box shall include an editable text box as well as a
	* drop-down list; if clear, it shall include only a drop-down list. This
	* flag shall be used only if the Combo flag is set.
	*/
	AcroChoiceFlags[AcroChoiceFlags["Edit"] = flag$1(18)] = "Edit";
	/**
	* If set, the field's option items shall be sorted alphabetically. This flag
	* is intended for use by writers, not by readers. Conforming readers shall
	* display the options in the order in which they occur in the Opt array
	* (see Table 231).
	*/
	AcroChoiceFlags[AcroChoiceFlags["Sort"] = flag$1(19)] = "Sort";
	/**
	* If set, more than one of the field's option items may be selected
	* simultaneously; if clear, at most one item shall be selected.
	*/
	AcroChoiceFlags[AcroChoiceFlags["MultiSelect"] = flag$1(21)] = "MultiSelect";
	/**
	* If set, text entered in the field shall not be spell-checked. This flag
	* shall not be used unless the Combo and Edit flags are both set.
	*/
	AcroChoiceFlags[AcroChoiceFlags["DoNotSpellCheck"] = flag$1(22)] = "DoNotSpellCheck";
	/**
	* If set, the new value shall be committed as soon as a selection is made
	* (commonly with the pointing device). In this case, supplying a value for
	* a field involves three actions: selecting the field for fill-in,
	* selecting a choice for the fill-in value, and leaving that field, which
	* finalizes or "commits" the data choice and triggers any actions associated
	* with the entry or changing of this data. If this flag is on, then
	* processing does not wait for leaving the field action to occur, but
	* immediately proceeds to the third step.
	*
	* This option enables applications to perform an action once a selection is
	* made, without requiring the user to exit the field. If clear, the new
	* value is not committed until the user exits the field.
	*/
	AcroChoiceFlags[AcroChoiceFlags["CommitOnSelChange"] = flag$1(26)] = "CommitOnSelChange";
})(AcroChoiceFlags || (AcroChoiceFlags = {}));
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroChoice.js
var PDFAcroChoice = function(_super) {
	__extends(PDFAcroChoice, _super);
	function PDFAcroChoice() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroChoice.prototype.setValues = function(values) {
		if (this.hasFlag(AcroChoiceFlags.Combo) && !this.hasFlag(AcroChoiceFlags.Edit) && !this.valuesAreValid(values)) throw new InvalidAcroFieldValueError();
		if (values.length === 0) this.dict.delete(PDFName.of("V"));
		if (values.length === 1) this.dict.set(PDFName.of("V"), values[0]);
		if (values.length > 1) {
			if (!this.hasFlag(AcroChoiceFlags.MultiSelect)) throw new MultiSelectValueError();
			this.dict.set(PDFName.of("V"), this.dict.context.obj(values));
		}
		this.updateSelectedIndices(values);
	};
	PDFAcroChoice.prototype.valuesAreValid = function(values) {
		var options = this.getOptions();
		var _loop_1 = function(idx, len) {
			var val = values[idx].decodeText();
			if (!options.find(function(o) {
				return val === (o.display || o.value).decodeText();
			})) return { value: false };
		};
		for (var idx = 0, len = values.length; idx < len; idx++) {
			var state_1 = _loop_1(idx, len);
			if (typeof state_1 === "object") return state_1.value;
		}
		return true;
	};
	PDFAcroChoice.prototype.updateSelectedIndices = function(values) {
		if (values.length > 1) {
			var indices = new Array(values.length);
			var options = this.getOptions();
			var _loop_2 = function(idx, len) {
				var val = values[idx].decodeText();
				indices[idx] = options.findIndex(function(o) {
					return val === (o.display || o.value).decodeText();
				});
			};
			for (var idx = 0, len = values.length; idx < len; idx++) _loop_2(idx, len);
			this.dict.set(PDFName.of("I"), this.dict.context.obj(indices.sort()));
		} else this.dict.delete(PDFName.of("I"));
	};
	PDFAcroChoice.prototype.getValues = function() {
		var v = this.V();
		if (v instanceof PDFString || v instanceof PDFHexString) return [v];
		if (v instanceof PDFArray) {
			var values = [];
			for (var idx = 0, len = v.size(); idx < len; idx++) {
				var value = v.lookup(idx);
				if (value instanceof PDFString || value instanceof PDFHexString) values.push(value);
			}
			return values;
		}
		return [];
	};
	PDFAcroChoice.prototype.Opt = function() {
		return this.dict.lookupMaybe(PDFName.of("Opt"), PDFString, PDFHexString, PDFArray);
	};
	PDFAcroChoice.prototype.setOptions = function(options) {
		var newOpt = new Array(options.length);
		for (var idx = 0, len = options.length; idx < len; idx++) {
			var _a = options[idx], value = _a.value, display = _a.display;
			newOpt[idx] = this.dict.context.obj([value, display || value]);
		}
		this.dict.set(PDFName.of("Opt"), this.dict.context.obj(newOpt));
	};
	PDFAcroChoice.prototype.getOptions = function() {
		var Opt = this.Opt();
		if (Opt instanceof PDFString || Opt instanceof PDFHexString) return [{
			value: Opt,
			display: Opt
		}];
		if (Opt instanceof PDFArray) {
			var res = [];
			for (var idx = 0, len = Opt.size(); idx < len; idx++) {
				var item = Opt.lookup(idx);
				if (item instanceof PDFString || item instanceof PDFHexString) res.push({
					value: item,
					display: item
				});
				if (item instanceof PDFArray) {
					if (item.size() > 0) {
						var first = item.lookup(0, PDFString, PDFHexString);
						var second = item.lookupMaybe(1, PDFString, PDFHexString);
						res.push({
							value: first,
							display: second || first
						});
					}
				}
			}
			return res;
		}
		return [];
	};
	return PDFAcroChoice;
}(PDFAcroTerminal);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroComboBox.js
var PDFAcroComboBox = function(_super) {
	__extends(PDFAcroComboBox, _super);
	function PDFAcroComboBox() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroComboBox.fromDict = function(dict, ref) {
		return new PDFAcroComboBox(dict, ref);
	};
	PDFAcroComboBox.create = function(context) {
		var dict = context.obj({
			FT: "Ch",
			Ff: AcroChoiceFlags.Combo,
			Kids: []
		});
		return new PDFAcroComboBox(dict, context.register(dict));
	};
	return PDFAcroComboBox;
}(PDFAcroChoice);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroNonTerminal.js
var PDFAcroNonTerminal = function(_super) {
	__extends(PDFAcroNonTerminal, _super);
	function PDFAcroNonTerminal() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroNonTerminal.prototype.addField = function(field) {
		var Kids = this.normalizedEntries().Kids;
		Kids === null || Kids === void 0 || Kids.push(field);
	};
	PDFAcroNonTerminal.prototype.normalizedEntries = function() {
		var Kids = this.Kids();
		if (!Kids) {
			Kids = this.dict.context.obj([]);
			this.dict.set(PDFName.of("Kids"), Kids);
		}
		return { Kids };
	};
	PDFAcroNonTerminal.fromDict = function(dict, ref) {
		return new PDFAcroNonTerminal(dict, ref);
	};
	PDFAcroNonTerminal.create = function(context) {
		var dict = context.obj({});
		return new PDFAcroNonTerminal(dict, context.register(dict));
	};
	return PDFAcroNonTerminal;
}(PDFAcroField);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroSignature.js
var PDFAcroSignature = function(_super) {
	__extends(PDFAcroSignature, _super);
	function PDFAcroSignature() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroSignature.fromDict = function(dict, ref) {
		return new PDFAcroSignature(dict, ref);
	};
	return PDFAcroSignature;
}(PDFAcroTerminal);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroText.js
var PDFAcroText = function(_super) {
	__extends(PDFAcroText, _super);
	function PDFAcroText() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroText.prototype.MaxLen = function() {
		var maxLen = this.dict.lookup(PDFName.of("MaxLen"));
		if (maxLen instanceof PDFNumber) return maxLen;
	};
	PDFAcroText.prototype.Q = function() {
		var q = this.dict.lookup(PDFName.of("Q"));
		if (q instanceof PDFNumber) return q;
	};
	PDFAcroText.prototype.setMaxLength = function(maxLength) {
		this.dict.set(PDFName.of("MaxLen"), PDFNumber.of(maxLength));
	};
	PDFAcroText.prototype.removeMaxLength = function() {
		this.dict.delete(PDFName.of("MaxLen"));
	};
	PDFAcroText.prototype.getMaxLength = function() {
		var _a;
		return (_a = this.MaxLen()) === null || _a === void 0 ? void 0 : _a.asNumber();
	};
	PDFAcroText.prototype.setQuadding = function(quadding) {
		this.dict.set(PDFName.of("Q"), PDFNumber.of(quadding));
	};
	PDFAcroText.prototype.getQuadding = function() {
		var _a;
		return (_a = this.Q()) === null || _a === void 0 ? void 0 : _a.asNumber();
	};
	PDFAcroText.prototype.setValue = function(value) {
		this.dict.set(PDFName.of("V"), value);
	};
	PDFAcroText.prototype.removeValue = function() {
		this.dict.delete(PDFName.of("V"));
	};
	PDFAcroText.prototype.getValue = function() {
		var v = this.V();
		if (v instanceof PDFString || v instanceof PDFHexString) return v;
	};
	PDFAcroText.fromDict = function(dict, ref) {
		return new PDFAcroText(dict, ref);
	};
	PDFAcroText.create = function(context) {
		var dict = context.obj({
			FT: "Tx",
			Kids: []
		});
		return new PDFAcroText(dict, context.register(dict));
	};
	return PDFAcroText;
}(PDFAcroTerminal);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroPushButton.js
var PDFAcroPushButton = function(_super) {
	__extends(PDFAcroPushButton, _super);
	function PDFAcroPushButton() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroPushButton.fromDict = function(dict, ref) {
		return new PDFAcroPushButton(dict, ref);
	};
	PDFAcroPushButton.create = function(context) {
		var dict = context.obj({
			FT: "Btn",
			Ff: AcroButtonFlags.PushButton,
			Kids: []
		});
		return new PDFAcroPushButton(dict, context.register(dict));
	};
	return PDFAcroPushButton;
}(PDFAcroButton);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroRadioButton.js
var PDFAcroRadioButton = function(_super) {
	__extends(PDFAcroRadioButton, _super);
	function PDFAcroRadioButton() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroRadioButton.prototype.setValue = function(value) {
		if (!this.getOnValues().includes(value) && value !== PDFName.of("Off")) throw new InvalidAcroFieldValueError();
		this.dict.set(PDFName.of("V"), value);
		var widgets = this.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			var state = widget.getOnValue() === value ? value : PDFName.of("Off");
			widget.setAppearanceState(state);
		}
	};
	PDFAcroRadioButton.prototype.getValue = function() {
		var v = this.V();
		if (v instanceof PDFName) return v;
		return PDFName.of("Off");
	};
	PDFAcroRadioButton.prototype.getOnValues = function() {
		var widgets = this.getWidgets();
		var onValues = [];
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var onValue = widgets[idx].getOnValue();
			if (onValue) onValues.push(onValue);
		}
		return onValues;
	};
	PDFAcroRadioButton.fromDict = function(dict, ref) {
		return new PDFAcroRadioButton(dict, ref);
	};
	PDFAcroRadioButton.create = function(context) {
		var dict = context.obj({
			FT: "Btn",
			Ff: AcroButtonFlags.Radio,
			Kids: []
		});
		return new PDFAcroRadioButton(dict, context.register(dict));
	};
	return PDFAcroRadioButton;
}(PDFAcroButton);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroListBox.js
var PDFAcroListBox = function(_super) {
	__extends(PDFAcroListBox, _super);
	function PDFAcroListBox() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFAcroListBox.fromDict = function(dict, ref) {
		return new PDFAcroListBox(dict, ref);
	};
	PDFAcroListBox.create = function(context) {
		var dict = context.obj({
			FT: "Ch",
			Kids: []
		});
		return new PDFAcroListBox(dict, context.register(dict));
	};
	return PDFAcroListBox;
}(PDFAcroChoice);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/utils.js
var createPDFAcroFields = function(kidDicts) {
	if (!kidDicts) return [];
	var kids = [];
	for (var idx = 0, len = kidDicts.size(); idx < len; idx++) {
		var ref = kidDicts.get(idx);
		var dict = kidDicts.lookup(idx);
		if (ref instanceof PDFRef && dict instanceof PDFDict) kids.push([createPDFAcroField(dict, ref), ref]);
	}
	return kids;
};
var createPDFAcroField = function(dict, ref) {
	if (isNonTerminalAcroField(dict)) return PDFAcroNonTerminal.fromDict(dict, ref);
	return createPDFAcroTerminal(dict, ref);
};
var isNonTerminalAcroField = function(dict) {
	var kids = dict.lookup(PDFName.of("Kids"));
	if (kids instanceof PDFArray) for (var idx = 0, len = kids.size(); idx < len; idx++) {
		var kid = kids.lookup(idx);
		if (kid instanceof PDFDict && kid.has(PDFName.of("T"))) return true;
	}
	return false;
};
var createPDFAcroTerminal = function(dict, ref) {
	var ftNameOrRef = getInheritableAttribute(dict, PDFName.of("FT"));
	var type = dict.context.lookup(ftNameOrRef, PDFName);
	if (type === PDFName.of("Btn")) return createPDFAcroButton(dict, ref);
	if (type === PDFName.of("Ch")) return createPDFAcroChoice(dict, ref);
	if (type === PDFName.of("Tx")) return PDFAcroText.fromDict(dict, ref);
	if (type === PDFName.of("Sig")) return PDFAcroSignature.fromDict(dict, ref);
	return PDFAcroTerminal.fromDict(dict, ref);
};
var createPDFAcroButton = function(dict, ref) {
	var _a;
	var ffNumberOrRef = getInheritableAttribute(dict, PDFName.of("Ff"));
	var ffNumber = dict.context.lookupMaybe(ffNumberOrRef, PDFNumber);
	var flags = (_a = ffNumber === null || ffNumber === void 0 ? void 0 : ffNumber.asNumber()) !== null && _a !== void 0 ? _a : 0;
	if (flagIsSet(flags, AcroButtonFlags.PushButton)) return PDFAcroPushButton.fromDict(dict, ref);
	else if (flagIsSet(flags, AcroButtonFlags.Radio)) return PDFAcroRadioButton.fromDict(dict, ref);
	else return PDFAcroCheckBox.fromDict(dict, ref);
};
var createPDFAcroChoice = function(dict, ref) {
	var _a;
	var ffNumberOrRef = getInheritableAttribute(dict, PDFName.of("Ff"));
	var ffNumber = dict.context.lookupMaybe(ffNumberOrRef, PDFNumber);
	if (flagIsSet((_a = ffNumber === null || ffNumber === void 0 ? void 0 : ffNumber.asNumber()) !== null && _a !== void 0 ? _a : 0, AcroChoiceFlags.Combo)) return PDFAcroComboBox.fromDict(dict, ref);
	else return PDFAcroListBox.fromDict(dict, ref);
};
var flagIsSet = function(flags, flag) {
	return (flags & flag) !== 0;
};
var getInheritableAttribute = function(startNode, name) {
	var attribute;
	ascend(startNode, function(node) {
		if (!attribute) attribute = node.get(name);
	});
	return attribute;
};
var ascend = function(startNode, visitor) {
	visitor(startNode);
	var Parent = startNode.lookupMaybe(PDFName.of("Parent"), PDFDict);
	if (Parent) ascend(Parent, visitor);
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/acroform/PDFAcroForm.js
var PDFAcroForm = function() {
	function PDFAcroForm(dict) {
		this.dict = dict;
	}
	PDFAcroForm.prototype.Fields = function() {
		var fields = this.dict.lookup(PDFName.of("Fields"));
		if (fields instanceof PDFArray) return fields;
	};
	PDFAcroForm.prototype.getFields = function() {
		var Fields = this.normalizedEntries().Fields;
		var fields = new Array(Fields.size());
		for (var idx = 0, len = Fields.size(); idx < len; idx++) {
			var ref = Fields.get(idx);
			var dict = Fields.lookup(idx, PDFDict);
			fields[idx] = [createPDFAcroField(dict, ref), ref];
		}
		return fields;
	};
	PDFAcroForm.prototype.getAllFields = function() {
		var allFields = [];
		var pushFields = function(fields) {
			if (!fields) return;
			for (var idx = 0, len = fields.length; idx < len; idx++) {
				var field = fields[idx];
				allFields.push(field);
				var fieldModel = field[0];
				if (fieldModel instanceof PDFAcroNonTerminal) pushFields(createPDFAcroFields(fieldModel.Kids()));
			}
		};
		pushFields(this.getFields());
		return allFields;
	};
	PDFAcroForm.prototype.addField = function(field) {
		var Fields = this.normalizedEntries().Fields;
		Fields === null || Fields === void 0 || Fields.push(field);
	};
	PDFAcroForm.prototype.removeField = function(field) {
		var parent = field.getParent();
		var fields = parent === void 0 ? this.normalizedEntries().Fields : parent.Kids();
		var index = fields === null || fields === void 0 ? void 0 : fields.indexOf(field.ref);
		if (fields === void 0 || index === void 0) throw new Error("Tried to remove inexistent field " + field.getFullyQualifiedName());
		fields.remove(index);
		if (parent !== void 0 && fields.size() === 0) this.removeField(parent);
	};
	PDFAcroForm.prototype.normalizedEntries = function() {
		var Fields = this.Fields();
		if (!Fields) {
			Fields = this.dict.context.obj([]);
			this.dict.set(PDFName.of("Fields"), Fields);
		}
		return { Fields };
	};
	PDFAcroForm.fromDict = function(dict) {
		return new PDFAcroForm(dict);
	};
	PDFAcroForm.create = function(context) {
		return new PDFAcroForm(context.obj({ Fields: [] }));
	};
	return PDFAcroForm;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/structures/PDFCatalog.js
var PDFCatalog = function(_super) {
	__extends(PDFCatalog, _super);
	function PDFCatalog() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFCatalog.prototype.Pages = function() {
		return this.lookup(PDFName.of("Pages"), PDFDict);
	};
	PDFCatalog.prototype.AcroForm = function() {
		return this.lookupMaybe(PDFName.of("AcroForm"), PDFDict);
	};
	PDFCatalog.prototype.getAcroForm = function() {
		var dict = this.AcroForm();
		if (!dict) return void 0;
		return PDFAcroForm.fromDict(dict);
	};
	PDFCatalog.prototype.getOrCreateAcroForm = function() {
		var acroForm = this.getAcroForm();
		if (!acroForm) {
			acroForm = PDFAcroForm.create(this.context);
			var acroFormRef = this.context.register(acroForm.dict);
			this.set(PDFName.of("AcroForm"), acroFormRef);
		}
		return acroForm;
	};
	PDFCatalog.prototype.ViewerPreferences = function() {
		return this.lookupMaybe(PDFName.of("ViewerPreferences"), PDFDict);
	};
	PDFCatalog.prototype.getViewerPreferences = function() {
		var dict = this.ViewerPreferences();
		if (!dict) return void 0;
		return ViewerPreferences.fromDict(dict);
	};
	PDFCatalog.prototype.getOrCreateViewerPreferences = function() {
		var viewerPrefs = this.getViewerPreferences();
		if (!viewerPrefs) {
			viewerPrefs = ViewerPreferences.create(this.context);
			var viewerPrefsRef = this.context.register(viewerPrefs.dict);
			this.set(PDFName.of("ViewerPreferences"), viewerPrefsRef);
		}
		return viewerPrefs;
	};
	/**
	* Inserts the given ref as a leaf node of this catalog's page tree at the
	* specified index (zero-based). Also increments the `Count` of each node in
	* the page tree hierarchy to accomodate the new page.
	*
	* Returns the ref of the PDFPageTree node into which `leafRef` was inserted.
	*/
	PDFCatalog.prototype.insertLeafNode = function(leafRef, index) {
		var pagesRef = this.get(PDFName.of("Pages"));
		return this.Pages().insertLeafNode(leafRef, index) || pagesRef;
	};
	PDFCatalog.prototype.removeLeafNode = function(index) {
		this.Pages().removeLeafNode(index);
	};
	PDFCatalog.withContextAndPages = function(context, pages) {
		var dict = /* @__PURE__ */ new Map();
		dict.set(PDFName.of("Type"), PDFName.of("Catalog"));
		dict.set(PDFName.of("Pages"), pages);
		return new PDFCatalog(dict, context);
	};
	PDFCatalog.fromMapWithContext = function(map, context) {
		return new PDFCatalog(map, context);
	};
	return PDFCatalog;
}(PDFDict);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/structures/PDFPageTree.js
var PDFPageTree = function(_super) {
	__extends(PDFPageTree, _super);
	function PDFPageTree() {
		return _super !== null && _super.apply(this, arguments) || this;
	}
	PDFPageTree.prototype.Parent = function() {
		return this.lookup(PDFName.of("Parent"));
	};
	PDFPageTree.prototype.Kids = function() {
		return this.lookup(PDFName.of("Kids"), PDFArray);
	};
	PDFPageTree.prototype.Count = function() {
		return this.lookup(PDFName.of("Count"), PDFNumber);
	};
	PDFPageTree.prototype.pushTreeNode = function(treeRef) {
		this.Kids().push(treeRef);
	};
	PDFPageTree.prototype.pushLeafNode = function(leafRef) {
		var Kids = this.Kids();
		this.insertLeafKid(Kids.size(), leafRef);
	};
	/**
	* Inserts the given ref as a leaf node of this page tree at the specified
	* index (zero-based). Also increments the `Count` of each page tree in the
	* hierarchy to accomodate the new page.
	*
	* Returns the ref of the PDFPageTree node into which `leafRef` was inserted,
	* or `undefined` if it was inserted into the root node (the PDFPageTree upon
	* which the method was first called).
	*/
	PDFPageTree.prototype.insertLeafNode = function(leafRef, targetIndex) {
		var Kids = this.Kids();
		var Count = this.Count().asNumber();
		if (targetIndex > Count) throw new InvalidTargetIndexError(targetIndex, Count);
		var leafsRemainingUntilTarget = targetIndex;
		for (var idx = 0, len = Kids.size(); idx < len; idx++) {
			if (leafsRemainingUntilTarget === 0) {
				this.insertLeafKid(idx, leafRef);
				return;
			}
			var kidRef = Kids.get(idx);
			var kid = this.context.lookup(kidRef);
			if (kid instanceof PDFPageTree) if (kid.Count().asNumber() > leafsRemainingUntilTarget) return kid.insertLeafNode(leafRef, leafsRemainingUntilTarget) || kidRef;
			else leafsRemainingUntilTarget -= kid.Count().asNumber();
			if (kid instanceof PDFPageLeaf) leafsRemainingUntilTarget -= 1;
		}
		if (leafsRemainingUntilTarget === 0) {
			this.insertLeafKid(Kids.size(), leafRef);
			return;
		}
		throw new CorruptPageTreeError(targetIndex, "insertLeafNode");
	};
	/**
	* Removes the leaf node at the specified index (zero-based) from this page
	* tree. Also decrements the `Count` of each page tree in the hierarchy to
	* account for the removed page.
	*
	* If `prune` is true, then intermediate tree nodes will be removed from the
	* tree if they contain 0 children after the leaf node is removed.
	*/
	PDFPageTree.prototype.removeLeafNode = function(targetIndex, prune) {
		if (prune === void 0) prune = true;
		var Kids = this.Kids();
		var Count = this.Count().asNumber();
		if (targetIndex >= Count) throw new InvalidTargetIndexError(targetIndex, Count);
		var leafsRemainingUntilTarget = targetIndex;
		for (var idx = 0, len = Kids.size(); idx < len; idx++) {
			var kidRef = Kids.get(idx);
			var kid = this.context.lookup(kidRef);
			if (kid instanceof PDFPageTree) if (kid.Count().asNumber() > leafsRemainingUntilTarget) {
				kid.removeLeafNode(leafsRemainingUntilTarget, prune);
				if (prune && kid.Kids().size() === 0) Kids.remove(idx);
				return;
			} else leafsRemainingUntilTarget -= kid.Count().asNumber();
			if (kid instanceof PDFPageLeaf) if (leafsRemainingUntilTarget === 0) {
				this.removeKid(idx);
				return;
			} else leafsRemainingUntilTarget -= 1;
		}
		throw new CorruptPageTreeError(targetIndex, "removeLeafNode");
	};
	PDFPageTree.prototype.ascend = function(visitor) {
		visitor(this);
		var Parent = this.Parent();
		if (Parent) Parent.ascend(visitor);
	};
	/** Performs a Post-Order traversal of this page tree */
	PDFPageTree.prototype.traverse = function(visitor) {
		var Kids = this.Kids();
		for (var idx = 0, len = Kids.size(); idx < len; idx++) {
			var kidRef = Kids.get(idx);
			var kid = this.context.lookup(kidRef);
			if (kid instanceof PDFPageTree) kid.traverse(visitor);
			visitor(kid, kidRef);
		}
	};
	PDFPageTree.prototype.insertLeafKid = function(kidIdx, leafRef) {
		var Kids = this.Kids();
		this.ascend(function(node) {
			var newCount = node.Count().asNumber() + 1;
			node.set(PDFName.of("Count"), PDFNumber.of(newCount));
		});
		Kids.insert(kidIdx, leafRef);
	};
	PDFPageTree.prototype.removeKid = function(kidIdx) {
		var Kids = this.Kids();
		if (Kids.lookup(kidIdx) instanceof PDFPageLeaf) this.ascend(function(node) {
			var newCount = node.Count().asNumber() - 1;
			node.set(PDFName.of("Count"), PDFNumber.of(newCount));
		});
		Kids.remove(kidIdx);
	};
	PDFPageTree.withContext = function(context, parent) {
		var dict = /* @__PURE__ */ new Map();
		dict.set(PDFName.of("Type"), PDFName.of("Pages"));
		dict.set(PDFName.of("Kids"), context.obj([]));
		dict.set(PDFName.of("Count"), context.obj(0));
		if (parent) dict.set(PDFName.of("Parent"), parent);
		return new PDFPageTree(dict, context);
	};
	PDFPageTree.fromMapWithContext = function(map, context) {
		return new PDFPageTree(map, context);
	};
	return PDFPageTree;
}(PDFDict);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/syntax/Numeric.js
var IsDigit = /* @__PURE__ */ new Uint8Array(256);
IsDigit[CharCodes_default.Zero] = 1;
IsDigit[CharCodes_default.One] = 1;
IsDigit[CharCodes_default.Two] = 1;
IsDigit[CharCodes_default.Three] = 1;
IsDigit[CharCodes_default.Four] = 1;
IsDigit[CharCodes_default.Five] = 1;
IsDigit[CharCodes_default.Six] = 1;
IsDigit[CharCodes_default.Seven] = 1;
IsDigit[CharCodes_default.Eight] = 1;
IsDigit[CharCodes_default.Nine] = 1;
var IsNumericPrefix = /* @__PURE__ */ new Uint8Array(256);
IsNumericPrefix[CharCodes_default.Period] = 1;
IsNumericPrefix[CharCodes_default.Plus] = 1;
IsNumericPrefix[CharCodes_default.Minus] = 1;
var IsNumeric = /* @__PURE__ */ new Uint8Array(256);
for (var idx = 0, len = 256; idx < len; idx++) IsNumeric[idx] = IsDigit[idx] || IsNumericPrefix[idx] ? 1 : 0;
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/parser/BaseParser.js
var Newline$1 = CharCodes_default.Newline;
var CarriageReturn$1 = CharCodes_default.CarriageReturn;
var BaseParser = function() {
	function BaseParser(bytes, capNumbers) {
		if (capNumbers === void 0) capNumbers = false;
		this.bytes = bytes;
		this.capNumbers = capNumbers;
	}
	BaseParser.prototype.parseRawInt = function() {
		var value = "";
		while (!this.bytes.done()) {
			if (!IsDigit[this.bytes.peek()]) break;
			value += charFromCode(this.bytes.next());
		}
		var numberValue = Number(value);
		if (!value || !isFinite(numberValue)) throw new NumberParsingError(this.bytes.position(), value);
		return numberValue;
	};
	BaseParser.prototype.parseRawNumber = function() {
		var value = "";
		while (!this.bytes.done()) {
			var byte = this.bytes.peek();
			if (!IsNumeric[byte]) break;
			value += charFromCode(this.bytes.next());
			if (byte === CharCodes_default.Period) break;
		}
		while (!this.bytes.done()) {
			var byte = this.bytes.peek();
			if (!IsDigit[byte]) break;
			value += charFromCode(this.bytes.next());
		}
		var numberValue = Number(value);
		if (!value || !isFinite(numberValue)) throw new NumberParsingError(this.bytes.position(), value);
		if (numberValue > Number.MAX_SAFE_INTEGER) if (this.capNumbers) {
			var msg = "Parsed number that is too large for some PDF readers: " + value + ", using Number.MAX_SAFE_INTEGER instead.";
			console.warn(msg);
			return Number.MAX_SAFE_INTEGER;
		} else {
			var msg = "Parsed number that is too large for some PDF readers: " + value + ", not capping.";
			console.warn(msg);
		}
		return numberValue;
	};
	BaseParser.prototype.skipWhitespace = function() {
		while (!this.bytes.done() && IsWhitespace[this.bytes.peek()]) this.bytes.next();
	};
	BaseParser.prototype.skipLine = function() {
		while (!this.bytes.done()) {
			var byte = this.bytes.peek();
			if (byte === Newline$1 || byte === CarriageReturn$1) return;
			this.bytes.next();
		}
	};
	BaseParser.prototype.skipComment = function() {
		if (this.bytes.peek() !== CharCodes_default.Percent) return false;
		while (!this.bytes.done()) {
			var byte = this.bytes.peek();
			if (byte === Newline$1 || byte === CarriageReturn$1) return true;
			this.bytes.next();
		}
		return true;
	};
	BaseParser.prototype.skipWhitespaceAndComments = function() {
		this.skipWhitespace();
		while (this.skipComment()) this.skipWhitespace();
	};
	BaseParser.prototype.matchKeyword = function(keyword) {
		var initialOffset = this.bytes.offset();
		for (var idx = 0, len = keyword.length; idx < len; idx++) if (this.bytes.done() || this.bytes.next() !== keyword[idx]) {
			this.bytes.moveTo(initialOffset);
			return false;
		}
		return true;
	};
	return BaseParser;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/parser/ByteStream.js
var ByteStream = function() {
	function ByteStream(bytes) {
		this.idx = 0;
		this.line = 0;
		this.column = 0;
		this.bytes = bytes;
		this.length = this.bytes.length;
	}
	ByteStream.prototype.moveTo = function(offset) {
		this.idx = offset;
	};
	ByteStream.prototype.next = function() {
		var byte = this.bytes[this.idx++];
		if (byte === CharCodes_default.Newline) {
			this.line += 1;
			this.column = 0;
		} else this.column += 1;
		return byte;
	};
	ByteStream.prototype.assertNext = function(expected) {
		if (this.peek() !== expected) throw new NextByteAssertionError(this.position(), expected, this.peek());
		return this.next();
	};
	ByteStream.prototype.peek = function() {
		return this.bytes[this.idx];
	};
	ByteStream.prototype.peekAhead = function(steps) {
		return this.bytes[this.idx + steps];
	};
	ByteStream.prototype.peekAt = function(offset) {
		return this.bytes[offset];
	};
	ByteStream.prototype.done = function() {
		return this.idx >= this.length;
	};
	ByteStream.prototype.offset = function() {
		return this.idx;
	};
	ByteStream.prototype.slice = function(start, end) {
		return this.bytes.slice(start, end);
	};
	ByteStream.prototype.position = function() {
		return {
			line: this.line,
			column: this.column,
			offset: this.idx
		};
	};
	ByteStream.of = function(bytes) {
		return new ByteStream(bytes);
	};
	ByteStream.fromPDFRawStream = function(rawStream) {
		return ByteStream.of(decodePDFRawStream(rawStream).decode());
	};
	return ByteStream;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/syntax/Keywords.js
var Space = CharCodes_default.Space;
var CarriageReturn = CharCodes_default.CarriageReturn;
var Newline = CharCodes_default.Newline;
var stream = [
	CharCodes_default.s,
	CharCodes_default.t,
	CharCodes_default.r,
	CharCodes_default.e,
	CharCodes_default.a,
	CharCodes_default.m
];
var endstream = [
	CharCodes_default.e,
	CharCodes_default.n,
	CharCodes_default.d,
	CharCodes_default.s,
	CharCodes_default.t,
	CharCodes_default.r,
	CharCodes_default.e,
	CharCodes_default.a,
	CharCodes_default.m
];
var Keywords = {
	header: [
		CharCodes_default.Percent,
		CharCodes_default.P,
		CharCodes_default.D,
		CharCodes_default.F,
		CharCodes_default.Dash
	],
	eof: [
		CharCodes_default.Percent,
		CharCodes_default.Percent,
		CharCodes_default.E,
		CharCodes_default.O,
		CharCodes_default.F
	],
	obj: [
		CharCodes_default.o,
		CharCodes_default.b,
		CharCodes_default.j
	],
	endobj: [
		CharCodes_default.e,
		CharCodes_default.n,
		CharCodes_default.d,
		CharCodes_default.o,
		CharCodes_default.b,
		CharCodes_default.j
	],
	xref: [
		CharCodes_default.x,
		CharCodes_default.r,
		CharCodes_default.e,
		CharCodes_default.f
	],
	trailer: [
		CharCodes_default.t,
		CharCodes_default.r,
		CharCodes_default.a,
		CharCodes_default.i,
		CharCodes_default.l,
		CharCodes_default.e,
		CharCodes_default.r
	],
	startxref: [
		CharCodes_default.s,
		CharCodes_default.t,
		CharCodes_default.a,
		CharCodes_default.r,
		CharCodes_default.t,
		CharCodes_default.x,
		CharCodes_default.r,
		CharCodes_default.e,
		CharCodes_default.f
	],
	true: [
		CharCodes_default.t,
		CharCodes_default.r,
		CharCodes_default.u,
		CharCodes_default.e
	],
	false: [
		CharCodes_default.f,
		CharCodes_default.a,
		CharCodes_default.l,
		CharCodes_default.s,
		CharCodes_default.e
	],
	null: [
		CharCodes_default.n,
		CharCodes_default.u,
		CharCodes_default.l,
		CharCodes_default.l
	],
	stream,
	streamEOF1: __spreadArrays(stream, [
		Space,
		CarriageReturn,
		Newline
	]),
	streamEOF2: __spreadArrays(stream, [CarriageReturn, Newline]),
	streamEOF3: __spreadArrays(stream, [CarriageReturn]),
	streamEOF4: __spreadArrays(stream, [Newline]),
	endstream,
	EOF1endstream: __spreadArrays([CarriageReturn, Newline], endstream),
	EOF2endstream: __spreadArrays([CarriageReturn], endstream),
	EOF3endstream: __spreadArrays([Newline], endstream)
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/parser/PDFObjectParser.js
var PDFObjectParser = function(_super) {
	__extends(PDFObjectParser, _super);
	function PDFObjectParser(byteStream, context, capNumbers) {
		if (capNumbers === void 0) capNumbers = false;
		var _this = _super.call(this, byteStream, capNumbers) || this;
		_this.context = context;
		return _this;
	}
	PDFObjectParser.prototype.parseObject = function() {
		this.skipWhitespaceAndComments();
		if (this.matchKeyword(Keywords.true)) return PDFBool.True;
		if (this.matchKeyword(Keywords.false)) return PDFBool.False;
		if (this.matchKeyword(Keywords.null)) return PDFNull_default;
		var byte = this.bytes.peek();
		if (byte === CharCodes_default.LessThan && this.bytes.peekAhead(1) === CharCodes_default.LessThan) return this.parseDictOrStream();
		if (byte === CharCodes_default.LessThan) return this.parseHexString();
		if (byte === CharCodes_default.LeftParen) return this.parseString();
		if (byte === CharCodes_default.ForwardSlash) return this.parseName();
		if (byte === CharCodes_default.LeftSquareBracket) return this.parseArray();
		if (IsNumeric[byte]) return this.parseNumberOrRef();
		throw new PDFObjectParsingError(this.bytes.position(), byte);
	};
	PDFObjectParser.prototype.parseNumberOrRef = function() {
		var firstNum = this.parseRawNumber();
		this.skipWhitespaceAndComments();
		var lookaheadStart = this.bytes.offset();
		if (IsDigit[this.bytes.peek()]) {
			var secondNum = this.parseRawNumber();
			this.skipWhitespaceAndComments();
			if (this.bytes.peek() === CharCodes_default.R) {
				this.bytes.assertNext(CharCodes_default.R);
				return PDFRef.of(firstNum, secondNum);
			}
		}
		this.bytes.moveTo(lookaheadStart);
		return PDFNumber.of(firstNum);
	};
	PDFObjectParser.prototype.parseHexString = function() {
		var value = "";
		this.bytes.assertNext(CharCodes_default.LessThan);
		while (!this.bytes.done() && this.bytes.peek() !== CharCodes_default.GreaterThan) value += charFromCode(this.bytes.next());
		this.bytes.assertNext(CharCodes_default.GreaterThan);
		return PDFHexString.of(value);
	};
	PDFObjectParser.prototype.parseString = function() {
		var nestingLvl = 0;
		var isEscaped = false;
		var value = "";
		while (!this.bytes.done()) {
			var byte = this.bytes.next();
			value += charFromCode(byte);
			if (!isEscaped) {
				if (byte === CharCodes_default.LeftParen) nestingLvl += 1;
				if (byte === CharCodes_default.RightParen) nestingLvl -= 1;
			}
			if (byte === CharCodes_default.BackSlash) isEscaped = !isEscaped;
			else if (isEscaped) isEscaped = false;
			if (nestingLvl === 0) return PDFString.of(value.substring(1, value.length - 1));
		}
		throw new UnbalancedParenthesisError(this.bytes.position());
	};
	PDFObjectParser.prototype.parseName = function() {
		this.bytes.assertNext(CharCodes_default.ForwardSlash);
		var name = "";
		while (!this.bytes.done()) {
			var byte = this.bytes.peek();
			if (IsWhitespace[byte] || IsDelimiter[byte]) break;
			name += charFromCode(byte);
			this.bytes.next();
		}
		return PDFName.of(name);
	};
	PDFObjectParser.prototype.parseArray = function() {
		this.bytes.assertNext(CharCodes_default.LeftSquareBracket);
		this.skipWhitespaceAndComments();
		var pdfArray = PDFArray.withContext(this.context);
		while (this.bytes.peek() !== CharCodes_default.RightSquareBracket) {
			var element = this.parseObject();
			pdfArray.push(element);
			this.skipWhitespaceAndComments();
		}
		this.bytes.assertNext(CharCodes_default.RightSquareBracket);
		return pdfArray;
	};
	PDFObjectParser.prototype.parseDict = function() {
		this.bytes.assertNext(CharCodes_default.LessThan);
		this.bytes.assertNext(CharCodes_default.LessThan);
		this.skipWhitespaceAndComments();
		var dict = /* @__PURE__ */ new Map();
		while (!this.bytes.done() && this.bytes.peek() !== CharCodes_default.GreaterThan && this.bytes.peekAhead(1) !== CharCodes_default.GreaterThan) {
			var key = this.parseName();
			var value = this.parseObject();
			dict.set(key, value);
			this.skipWhitespaceAndComments();
		}
		this.skipWhitespaceAndComments();
		this.bytes.assertNext(CharCodes_default.GreaterThan);
		this.bytes.assertNext(CharCodes_default.GreaterThan);
		var Type = dict.get(PDFName.of("Type"));
		if (Type === PDFName.of("Catalog")) return PDFCatalog.fromMapWithContext(dict, this.context);
		else if (Type === PDFName.of("Pages")) return PDFPageTree.fromMapWithContext(dict, this.context);
		else if (Type === PDFName.of("Page")) return PDFPageLeaf.fromMapWithContext(dict, this.context);
		else return PDFDict.fromMapWithContext(dict, this.context);
	};
	PDFObjectParser.prototype.parseDictOrStream = function() {
		var startPos = this.bytes.position();
		var dict = this.parseDict();
		this.skipWhitespaceAndComments();
		if (!this.matchKeyword(Keywords.streamEOF1) && !this.matchKeyword(Keywords.streamEOF2) && !this.matchKeyword(Keywords.streamEOF3) && !this.matchKeyword(Keywords.streamEOF4) && !this.matchKeyword(Keywords.stream)) return dict;
		var start = this.bytes.offset();
		var end;
		var Length = dict.get(PDFName.of("Length"));
		if (Length instanceof PDFNumber) {
			end = start + Length.asNumber();
			this.bytes.moveTo(end);
			this.skipWhitespaceAndComments();
			if (!this.matchKeyword(Keywords.endstream)) {
				this.bytes.moveTo(start);
				end = this.findEndOfStreamFallback(startPos);
			}
		} else end = this.findEndOfStreamFallback(startPos);
		var contents = this.bytes.slice(start, end);
		return PDFRawStream.of(dict, contents);
	};
	PDFObjectParser.prototype.findEndOfStreamFallback = function(startPos) {
		var nestingLvl = 1;
		var end = this.bytes.offset();
		while (!this.bytes.done()) {
			end = this.bytes.offset();
			if (this.matchKeyword(Keywords.stream)) nestingLvl += 1;
			else if (this.matchKeyword(Keywords.EOF1endstream) || this.matchKeyword(Keywords.EOF2endstream) || this.matchKeyword(Keywords.EOF3endstream) || this.matchKeyword(Keywords.endstream)) nestingLvl -= 1;
			else this.bytes.next();
			if (nestingLvl === 0) break;
		}
		if (nestingLvl !== 0) throw new PDFStreamParsingError(startPos);
		return end;
	};
	PDFObjectParser.forBytes = function(bytes, context, capNumbers) {
		return new PDFObjectParser(ByteStream.of(bytes), context, capNumbers);
	};
	PDFObjectParser.forByteStream = function(byteStream, context, capNumbers) {
		if (capNumbers === void 0) capNumbers = false;
		return new PDFObjectParser(byteStream, context, capNumbers);
	};
	return PDFObjectParser;
}(BaseParser);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/parser/PDFObjectStreamParser.js
var PDFObjectStreamParser = function(_super) {
	__extends(PDFObjectStreamParser, _super);
	function PDFObjectStreamParser(rawStream, shouldWaitForTick) {
		var _this = _super.call(this, ByteStream.fromPDFRawStream(rawStream), rawStream.dict.context) || this;
		var dict = rawStream.dict;
		_this.alreadyParsed = false;
		_this.shouldWaitForTick = shouldWaitForTick || (function() {
			return false;
		});
		_this.firstOffset = dict.lookup(PDFName.of("First"), PDFNumber).asNumber();
		_this.objectCount = dict.lookup(PDFName.of("N"), PDFNumber).asNumber();
		return _this;
	}
	PDFObjectStreamParser.prototype.parseIntoContext = function() {
		return __awaiter(this, void 0, void 0, function() {
			var offsetsAndObjectNumbers, idx, len, _a, objectNumber, offset, object, ref;
			return __generator(this, function(_b) {
				switch (_b.label) {
					case 0:
						if (this.alreadyParsed) throw new ReparseError("PDFObjectStreamParser", "parseIntoContext");
						this.alreadyParsed = true;
						offsetsAndObjectNumbers = this.parseOffsetsAndObjectNumbers();
						idx = 0, len = offsetsAndObjectNumbers.length;
						_b.label = 1;
					case 1:
						if (!(idx < len)) return [3, 4];
						_a = offsetsAndObjectNumbers[idx], objectNumber = _a.objectNumber, offset = _a.offset;
						this.bytes.moveTo(this.firstOffset + offset);
						object = this.parseObject();
						ref = PDFRef.of(objectNumber, 0);
						this.context.assign(ref, object);
						if (!this.shouldWaitForTick()) return [3, 3];
						return [4, waitForTick()];
					case 2:
						_b.sent();
						_b.label = 3;
					case 3:
						idx++;
						return [3, 1];
					case 4: return [2];
				}
			});
		});
	};
	PDFObjectStreamParser.prototype.parseOffsetsAndObjectNumbers = function() {
		var offsetsAndObjectNumbers = [];
		for (var idx = 0, len = this.objectCount; idx < len; idx++) {
			this.skipWhitespaceAndComments();
			var objectNumber = this.parseRawInt();
			this.skipWhitespaceAndComments();
			var offset = this.parseRawInt();
			offsetsAndObjectNumbers.push({
				objectNumber,
				offset
			});
		}
		return offsetsAndObjectNumbers;
	};
	PDFObjectStreamParser.forStream = function(rawStream, shouldWaitForTick) {
		return new PDFObjectStreamParser(rawStream, shouldWaitForTick);
	};
	return PDFObjectStreamParser;
}(PDFObjectParser);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/parser/PDFXRefStreamParser.js
var PDFXRefStreamParser = function() {
	function PDFXRefStreamParser(rawStream) {
		this.alreadyParsed = false;
		this.dict = rawStream.dict;
		this.bytes = ByteStream.fromPDFRawStream(rawStream);
		this.context = this.dict.context;
		var Size = this.dict.lookup(PDFName.of("Size"), PDFNumber);
		var Index = this.dict.lookup(PDFName.of("Index"));
		if (Index instanceof PDFArray) {
			this.subsections = [];
			for (var idx = 0, len = Index.size(); idx < len; idx += 2) {
				var firstObjectNumber = Index.lookup(idx + 0, PDFNumber).asNumber();
				var length_1 = Index.lookup(idx + 1, PDFNumber).asNumber();
				this.subsections.push({
					firstObjectNumber,
					length: length_1
				});
			}
		} else this.subsections = [{
			firstObjectNumber: 0,
			length: Size.asNumber()
		}];
		var W = this.dict.lookup(PDFName.of("W"), PDFArray);
		this.byteWidths = [
			-1,
			-1,
			-1
		];
		for (var idx = 0, len = W.size(); idx < len; idx++) this.byteWidths[idx] = W.lookup(idx, PDFNumber).asNumber();
	}
	PDFXRefStreamParser.prototype.parseIntoContext = function() {
		if (this.alreadyParsed) throw new ReparseError("PDFXRefStreamParser", "parseIntoContext");
		this.alreadyParsed = true;
		this.context.trailerInfo = {
			Root: this.dict.get(PDFName.of("Root")),
			Encrypt: this.dict.get(PDFName.of("Encrypt")),
			Info: this.dict.get(PDFName.of("Info")),
			ID: this.dict.get(PDFName.of("ID"))
		};
		return this.parseEntries();
	};
	PDFXRefStreamParser.prototype.parseEntries = function() {
		var entries = [];
		var _a = this.byteWidths, typeFieldWidth = _a[0], offsetFieldWidth = _a[1], genFieldWidth = _a[2];
		for (var subsectionIdx = 0, subsectionLen = this.subsections.length; subsectionIdx < subsectionLen; subsectionIdx++) {
			var _b = this.subsections[subsectionIdx], firstObjectNumber = _b.firstObjectNumber, length_2 = _b.length;
			for (var objIdx = 0; objIdx < length_2; objIdx++) {
				var type = 0;
				for (var idx = 0, len = typeFieldWidth; idx < len; idx++) type = type << 8 | this.bytes.next();
				var offset = 0;
				for (var idx = 0, len = offsetFieldWidth; idx < len; idx++) offset = offset << 8 | this.bytes.next();
				var generationNumber = 0;
				for (var idx = 0, len = genFieldWidth; idx < len; idx++) generationNumber = generationNumber << 8 | this.bytes.next();
				if (typeFieldWidth === 0) type = 1;
				var objectNumber = firstObjectNumber + objIdx;
				var entry = {
					ref: PDFRef.of(objectNumber, generationNumber),
					offset,
					deleted: type === 0,
					inObjectStream: type === 2
				};
				entries.push(entry);
			}
		}
		return entries;
	};
	PDFXRefStreamParser.forStream = function(rawStream) {
		return new PDFXRefStreamParser(rawStream);
	};
	return PDFXRefStreamParser;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/parser/PDFParser.js
var PDFParser = function(_super) {
	__extends(PDFParser, _super);
	function PDFParser(pdfBytes, objectsPerTick, throwOnInvalidObject, capNumbers) {
		if (objectsPerTick === void 0) objectsPerTick = Infinity;
		if (throwOnInvalidObject === void 0) throwOnInvalidObject = false;
		if (capNumbers === void 0) capNumbers = false;
		var _this = _super.call(this, ByteStream.of(pdfBytes), PDFContext.create(), capNumbers) || this;
		_this.alreadyParsed = false;
		_this.parsedObjects = 0;
		_this.shouldWaitForTick = function() {
			_this.parsedObjects += 1;
			return _this.parsedObjects % _this.objectsPerTick === 0;
		};
		_this.objectsPerTick = objectsPerTick;
		_this.throwOnInvalidObject = throwOnInvalidObject;
		return _this;
	}
	PDFParser.prototype.parseDocument = function() {
		return __awaiter(this, void 0, void 0, function() {
			var prevOffset, offset;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (this.alreadyParsed) throw new ReparseError("PDFParser", "parseDocument");
						this.alreadyParsed = true;
						this.context.header = this.parseHeader();
						_a.label = 1;
					case 1:
						if (!!this.bytes.done()) return [3, 3];
						return [4, this.parseDocumentSection()];
					case 2:
						_a.sent();
						offset = this.bytes.offset();
						if (offset === prevOffset) throw new StalledParserError(this.bytes.position());
						prevOffset = offset;
						return [3, 1];
					case 3:
						this.maybeRecoverRoot();
						if (this.context.lookup(PDFRef.of(0))) {
							console.warn("Removing parsed object: 0 0 R");
							this.context.delete(PDFRef.of(0));
						}
						return [2, this.context];
				}
			});
		});
	};
	PDFParser.prototype.maybeRecoverRoot = function() {
		var isValidCatalog = function(obj) {
			return obj instanceof PDFDict && obj.lookup(PDFName.of("Type")) === PDFName.of("Catalog");
		};
		if (!isValidCatalog(this.context.lookup(this.context.trailerInfo.Root))) {
			var indirectObjects = this.context.enumerateIndirectObjects();
			for (var idx = 0, len = indirectObjects.length; idx < len; idx++) {
				var _a = indirectObjects[idx], ref = _a[0], object = _a[1];
				if (isValidCatalog(object)) this.context.trailerInfo.Root = ref;
			}
		}
	};
	PDFParser.prototype.parseHeader = function() {
		while (!this.bytes.done()) {
			if (this.matchKeyword(Keywords.header)) {
				var major = this.parseRawInt();
				this.bytes.assertNext(CharCodes_default.Period);
				var minor = this.parseRawInt();
				var header = PDFHeader.forVersion(major, minor);
				this.skipBinaryHeaderComment();
				return header;
			}
			this.bytes.next();
		}
		throw new MissingPDFHeaderError(this.bytes.position());
	};
	PDFParser.prototype.parseIndirectObjectHeader = function() {
		this.skipWhitespaceAndComments();
		var objectNumber = this.parseRawInt();
		this.skipWhitespaceAndComments();
		var generationNumber = this.parseRawInt();
		this.skipWhitespaceAndComments();
		if (!this.matchKeyword(Keywords.obj)) throw new MissingKeywordError(this.bytes.position(), Keywords.obj);
		return PDFRef.of(objectNumber, generationNumber);
	};
	PDFParser.prototype.matchIndirectObjectHeader = function() {
		var initialOffset = this.bytes.offset();
		try {
			this.parseIndirectObjectHeader();
			return true;
		} catch (e) {
			this.bytes.moveTo(initialOffset);
			return false;
		}
	};
	PDFParser.prototype.parseIndirectObject = function() {
		return __awaiter(this, void 0, void 0, function() {
			var ref, object;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						ref = this.parseIndirectObjectHeader();
						this.skipWhitespaceAndComments();
						object = this.parseObject();
						this.skipWhitespaceAndComments();
						this.matchKeyword(Keywords.endobj);
						if (!(object instanceof PDFRawStream && object.dict.lookup(PDFName.of("Type")) === PDFName.of("ObjStm"))) return [3, 2];
						return [4, PDFObjectStreamParser.forStream(object, this.shouldWaitForTick).parseIntoContext()];
					case 1:
						_a.sent();
						return [3, 3];
					case 2:
						if (object instanceof PDFRawStream && object.dict.lookup(PDFName.of("Type")) === PDFName.of("XRef")) PDFXRefStreamParser.forStream(object).parseIntoContext();
						else this.context.assign(ref, object);
						_a.label = 3;
					case 3: return [2, ref];
				}
			});
		});
	};
	PDFParser.prototype.tryToParseInvalidIndirectObject = function() {
		var startPos = this.bytes.position();
		var msg = "Trying to parse invalid object: " + JSON.stringify(startPos) + ")";
		if (this.throwOnInvalidObject) throw new Error(msg);
		console.warn(msg);
		var ref = this.parseIndirectObjectHeader();
		console.warn("Invalid object ref: " + ref);
		this.skipWhitespaceAndComments();
		var start = this.bytes.offset();
		var failed = true;
		while (!this.bytes.done()) {
			if (this.matchKeyword(Keywords.endobj)) failed = false;
			if (!failed) break;
			this.bytes.next();
		}
		if (failed) throw new PDFInvalidObjectParsingError(startPos);
		var end = this.bytes.offset() - Keywords.endobj.length;
		var object = PDFInvalidObject.of(this.bytes.slice(start, end));
		this.context.assign(ref, object);
		return ref;
	};
	PDFParser.prototype.parseIndirectObjects = function() {
		return __awaiter(this, void 0, void 0, function() {
			var initialOffset;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						this.skipWhitespaceAndComments();
						_a.label = 1;
					case 1:
						if (!(!this.bytes.done() && IsDigit[this.bytes.peek()])) return [3, 8];
						initialOffset = this.bytes.offset();
						_a.label = 2;
					case 2:
						_a.trys.push([
							2,
							4,
							,
							5
						]);
						return [4, this.parseIndirectObject()];
					case 3:
						_a.sent();
						return [3, 5];
					case 4:
						_a.sent();
						this.bytes.moveTo(initialOffset);
						this.tryToParseInvalidIndirectObject();
						return [3, 5];
					case 5:
						this.skipWhitespaceAndComments();
						this.skipJibberish();
						if (!this.shouldWaitForTick()) return [3, 7];
						return [4, waitForTick()];
					case 6:
						_a.sent();
						_a.label = 7;
					case 7: return [3, 1];
					case 8: return [2];
				}
			});
		});
	};
	PDFParser.prototype.maybeParseCrossRefSection = function() {
		this.skipWhitespaceAndComments();
		if (!this.matchKeyword(Keywords.xref)) return;
		this.skipWhitespaceAndComments();
		var objectNumber = -1;
		var xref = PDFCrossRefSection.createEmpty();
		while (!this.bytes.done() && IsDigit[this.bytes.peek()]) {
			var firstInt = this.parseRawInt();
			this.skipWhitespaceAndComments();
			var secondInt = this.parseRawInt();
			this.skipWhitespaceAndComments();
			var byte = this.bytes.peek();
			if (byte === CharCodes_default.n || byte === CharCodes_default.f) {
				var ref = PDFRef.of(objectNumber, secondInt);
				if (this.bytes.next() === CharCodes_default.n) xref.addEntry(ref, firstInt);
				else xref.addDeletedEntry(ref, firstInt);
				objectNumber += 1;
			} else objectNumber = firstInt;
			this.skipWhitespaceAndComments();
		}
		return xref;
	};
	PDFParser.prototype.maybeParseTrailerDict = function() {
		this.skipWhitespaceAndComments();
		if (!this.matchKeyword(Keywords.trailer)) return;
		this.skipWhitespaceAndComments();
		var dict = this.parseDict();
		var context = this.context;
		context.trailerInfo = {
			Root: dict.get(PDFName.of("Root")) || context.trailerInfo.Root,
			Encrypt: dict.get(PDFName.of("Encrypt")) || context.trailerInfo.Encrypt,
			Info: dict.get(PDFName.of("Info")) || context.trailerInfo.Info,
			ID: dict.get(PDFName.of("ID")) || context.trailerInfo.ID
		};
	};
	PDFParser.prototype.maybeParseTrailer = function() {
		this.skipWhitespaceAndComments();
		if (!this.matchKeyword(Keywords.startxref)) return;
		this.skipWhitespaceAndComments();
		var offset = this.parseRawInt();
		this.skipWhitespace();
		this.matchKeyword(Keywords.eof);
		this.skipWhitespaceAndComments();
		this.matchKeyword(Keywords.eof);
		this.skipWhitespaceAndComments();
		return PDFTrailer.forLastCrossRefSectionOffset(offset);
	};
	PDFParser.prototype.parseDocumentSection = function() {
		return __awaiter(this, void 0, void 0, function() {
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0: return [4, this.parseIndirectObjects()];
					case 1:
						_a.sent();
						this.maybeParseCrossRefSection();
						this.maybeParseTrailerDict();
						this.maybeParseTrailer();
						this.skipJibberish();
						return [2];
				}
			});
		});
	};
	/**
	* This operation is not necessary for valid PDF files. But some invalid PDFs
	* contain jibberish in between indirect objects. This method is designed to
	* skip past that jibberish, should it exist, until it reaches the next
	* indirect object header, an xref table section, or the file trailer.
	*/
	PDFParser.prototype.skipJibberish = function() {
		this.skipWhitespaceAndComments();
		while (!this.bytes.done()) {
			var initialOffset = this.bytes.offset();
			var byte = this.bytes.peek();
			if (byte >= CharCodes_default.Space && byte <= CharCodes_default.Tilde) {
				if (this.matchKeyword(Keywords.xref) || this.matchKeyword(Keywords.trailer) || this.matchKeyword(Keywords.startxref) || this.matchIndirectObjectHeader()) {
					this.bytes.moveTo(initialOffset);
					break;
				}
			}
			this.bytes.next();
		}
	};
	/**
	* Skips the binary comment following a PDF header. The specification
	* defines this binary comment (section 7.5.2 File Header) as a sequence of 4
	* or more bytes that are 128 or greater, and which are preceded by a "%".
	*
	* This would imply that to strip out this binary comment, we could check for
	* a sequence of bytes starting with "%", and remove all subsequent bytes that
	* are 128 or greater. This works for many documents that properly comply with
	* the spec. But in the wild, there are PDFs that omit the leading "%", and
	* include bytes that are less than 128 (e.g. 0 or 1). So in order to parse
	* these headers correctly, we just throw out all bytes leading up to the
	* first indirect object header.
	*/
	PDFParser.prototype.skipBinaryHeaderComment = function() {
		this.skipWhitespaceAndComments();
		try {
			var initialOffset = this.bytes.offset();
			this.parseIndirectObjectHeader();
			this.bytes.moveTo(initialOffset);
		} catch (e) {
			this.bytes.next();
			this.skipWhitespaceAndComments();
		}
	};
	PDFParser.forBytesWithOptions = function(pdfBytes, objectsPerTick, throwOnInvalidObject, capNumbers) {
		return new PDFParser(pdfBytes, objectsPerTick, throwOnInvalidObject, capNumbers);
	};
	return PDFParser;
}(PDFObjectParser);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/annotation/flags.js
var flag = function(bitIndex) {
	return 1 << bitIndex;
};
/** From PDF spec table 165 */
var AnnotationFlags;
(function(AnnotationFlags) {
	/**
	* If set, do not display the annotation if it does not belong to one of the
	* standard annotation types and no annotation handler is available. If clear,
	* display such an unknown annotation using an appearance stream specified by
	* its appearance dictionary, if any.
	*/
	AnnotationFlags[AnnotationFlags["Invisible"] = flag(0)] = "Invisible";
	/**
	* If set, do not display or print the annotation or allow it to interact with
	* the user, regardless of its annotation type or whether an annotation
	* handler is available.
	*
	* In cases where screen space is limited, the ability to hide and show
	* annotations selectively can be used in combination with appearance streams
	* to display auxiliary pop-up information similar in function to online help
	* systems.
	*/
	AnnotationFlags[AnnotationFlags["Hidden"] = flag(1)] = "Hidden";
	/**
	* If set, print the annotation when the page is printed. If clear, never
	* print the annotation, regardless of whether it is displayed on the screen.
	*
	* This can be useful for annotations representing interactive pushbuttons,
	* which would serve no meaningful purpose on the printed page.
	*/
	AnnotationFlags[AnnotationFlags["Print"] = flag(2)] = "Print";
	/**
	* If set, do not scale the annotation’s appearance to match the magnification
	* of the page. The location of the annotation on the page (defined by the
	* upper-left corner of its annotation rectangle) shall remain fixed,
	* regardless of the page magnification.
	*/
	AnnotationFlags[AnnotationFlags["NoZoom"] = flag(3)] = "NoZoom";
	/**
	* If set, do not rotate the annotation’s appearance to match the rotation of
	* the page. The upper-left corner of the annotation rectangle shall remain in
	* a fixed location on the page, regardless of the page rotation.
	*/
	AnnotationFlags[AnnotationFlags["NoRotate"] = flag(4)] = "NoRotate";
	/**
	* If set, do not display the annotation on the screen or allow it to interact
	* with the user. The annotation may be printed (depending on the setting of
	* the Print flag) but should be considered hidden for purposes of on-screen
	* display and user interaction.
	*/
	AnnotationFlags[AnnotationFlags["NoView"] = flag(5)] = "NoView";
	/**
	* If set, do not allow the annotation to interact with the user. The
	* annotation may be displayed or printed (depending on the settings of the
	* NoView and Print flags) but should not respond to mouse clicks or change
	* its appearance in response to mouse motions.
	*
	* This flag shall be ignored for widget annotations; its function is
	* subsumed by the ReadOnly flag of the associated form field.
	*/
	AnnotationFlags[AnnotationFlags["ReadOnly"] = flag(6)] = "ReadOnly";
	/**
	* If set, do not allow the annotation to be deleted or its properties
	* (including position and size) to be modified by the user. However, this
	* flag does not restrict changes to the annotation’s contents, such as the
	* value of a form field.
	*/
	AnnotationFlags[AnnotationFlags["Locked"] = flag(7)] = "Locked";
	/**
	* If set, invert the interpretation of the NoView flag for certain events.
	*
	* A typical use is to have an annotation that appears only when a mouse
	* cursor is held over it.
	*/
	AnnotationFlags[AnnotationFlags["ToggleNoView"] = flag(8)] = "ToggleNoView";
	/**
	* If set, do not allow the contents of the annotation to be modified by the
	* user. This flag does not restrict deletion of the annotation or changes to
	* other annotation properties, such as position and size.
	*/
	AnnotationFlags[AnnotationFlags["LockedContents"] = flag(9)] = "LockedContents";
})(AnnotationFlags || (AnnotationFlags = {}));
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/objects.js
var asPDFName = function(name) {
	return name instanceof PDFName ? name : PDFName.of(name);
};
var asPDFNumber = function(num) {
	return num instanceof PDFNumber ? num : PDFNumber.of(num);
};
var asNumber = function(num) {
	return num instanceof PDFNumber ? num.asNumber() : num;
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/rotations.js
var RotationTypes;
(function(RotationTypes) {
	RotationTypes["Degrees"] = "degrees";
	RotationTypes["Radians"] = "radians";
})(RotationTypes || (RotationTypes = {}));
var degrees = function(degreeAngle) {
	assertIs(degreeAngle, "degreeAngle", ["number"]);
	return {
		type: RotationTypes.Degrees,
		angle: degreeAngle
	};
};
var Radians = RotationTypes.Radians;
var Degrees = RotationTypes.Degrees;
var degreesToRadians = function(degree) {
	return degree * Math.PI / 180;
};
var radiansToDegrees = function(radian) {
	return radian * 180 / Math.PI;
};
var toRadians = function(rotation) {
	return rotation.type === Radians ? rotation.angle : rotation.type === Degrees ? degreesToRadians(rotation.angle) : error("Invalid rotation: " + JSON.stringify(rotation));
};
var toDegrees = function(rotation) {
	return rotation.type === Radians ? radiansToDegrees(rotation.angle) : rotation.type === Degrees ? rotation.angle : error("Invalid rotation: " + JSON.stringify(rotation));
};
var reduceRotation = function(degreeAngle) {
	if (degreeAngle === void 0) degreeAngle = 0;
	var quadrants = degreeAngle / 90 % 4;
	if (quadrants === 0) return 0;
	if (quadrants === 1) return 90;
	if (quadrants === 2) return 180;
	if (quadrants === 3) return 270;
	return 0;
};
var adjustDimsForRotation = function(dims, degreeAngle) {
	if (degreeAngle === void 0) degreeAngle = 0;
	var rotation = reduceRotation(degreeAngle);
	return rotation === 90 || rotation === 270 ? {
		width: dims.height,
		height: dims.width
	} : {
		width: dims.width,
		height: dims.height
	};
};
var rotateRectangle = function(rectangle, borderWidth, degreeAngle) {
	if (borderWidth === void 0) borderWidth = 0;
	if (degreeAngle === void 0) degreeAngle = 0;
	var x = rectangle.x, y = rectangle.y, w = rectangle.width, h = rectangle.height;
	var r = reduceRotation(degreeAngle);
	var b = borderWidth / 2;
	if (r === 0) return {
		x: x - b,
		y: y - b,
		width: w,
		height: h
	};
	else if (r === 90) return {
		x: x - h + b,
		y: y - b,
		width: h,
		height: w
	};
	else if (r === 180) return {
		x: x - w + b,
		y: y - h + b,
		width: w,
		height: h
	};
	else if (r === 270) return {
		x: x - b,
		y: y - w + b,
		width: h,
		height: w
	};
	else return {
		x: x - b,
		y: y - b,
		width: w,
		height: h
	};
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/operators.js
var clip = function() {
	return PDFOperator.of(PDFOperatorNames_default.ClipNonZero);
};
var cos = Math.cos;
var sin = Math.sin;
var tan = Math.tan;
var concatTransformationMatrix = function(a, b, c, d, e, f) {
	return PDFOperator.of(PDFOperatorNames_default.ConcatTransformationMatrix, [
		asPDFNumber(a),
		asPDFNumber(b),
		asPDFNumber(c),
		asPDFNumber(d),
		asPDFNumber(e),
		asPDFNumber(f)
	]);
};
var translate = function(xPos, yPos) {
	return concatTransformationMatrix(1, 0, 0, 1, xPos, yPos);
};
var scale = function(xPos, yPos) {
	return concatTransformationMatrix(xPos, 0, 0, yPos, 0, 0);
};
var rotateRadians = function(angle) {
	return concatTransformationMatrix(cos(asNumber(angle)), sin(asNumber(angle)), -sin(asNumber(angle)), cos(asNumber(angle)), 0, 0);
};
var rotateDegrees = function(angle) {
	return rotateRadians(degreesToRadians(asNumber(angle)));
};
var skewRadians = function(xSkewAngle, ySkewAngle) {
	return concatTransformationMatrix(1, tan(asNumber(xSkewAngle)), tan(asNumber(ySkewAngle)), 1, 0, 0);
};
var setDashPattern = function(dashArray, dashPhase) {
	return PDFOperator.of(PDFOperatorNames_default.SetLineDashPattern, ["[" + dashArray.map(asPDFNumber).join(" ") + "]", asPDFNumber(dashPhase)]);
};
var LineCapStyle;
(function(LineCapStyle) {
	LineCapStyle[LineCapStyle["Butt"] = 0] = "Butt";
	LineCapStyle[LineCapStyle["Round"] = 1] = "Round";
	LineCapStyle[LineCapStyle["Projecting"] = 2] = "Projecting";
})(LineCapStyle || (LineCapStyle = {}));
var setLineCap = function(style) {
	return PDFOperator.of(PDFOperatorNames_default.SetLineCapStyle, [asPDFNumber(style)]);
};
var LineJoinStyle;
(function(LineJoinStyle) {
	LineJoinStyle[LineJoinStyle["Miter"] = 0] = "Miter";
	LineJoinStyle[LineJoinStyle["Round"] = 1] = "Round";
	LineJoinStyle[LineJoinStyle["Bevel"] = 2] = "Bevel";
})(LineJoinStyle || (LineJoinStyle = {}));
var setGraphicsState = function(state) {
	return PDFOperator.of(PDFOperatorNames_default.SetGraphicsStateParams, [asPDFName(state)]);
};
var pushGraphicsState = function() {
	return PDFOperator.of(PDFOperatorNames_default.PushGraphicsState);
};
var popGraphicsState = function() {
	return PDFOperator.of(PDFOperatorNames_default.PopGraphicsState);
};
var setLineWidth = function(width) {
	return PDFOperator.of(PDFOperatorNames_default.SetLineWidth, [asPDFNumber(width)]);
};
var appendBezierCurve = function(x1, y1, x2, y2, x3, y3) {
	return PDFOperator.of(PDFOperatorNames_default.AppendBezierCurve, [
		asPDFNumber(x1),
		asPDFNumber(y1),
		asPDFNumber(x2),
		asPDFNumber(y2),
		asPDFNumber(x3),
		asPDFNumber(y3)
	]);
};
var appendQuadraticCurve = function(x1, y1, x2, y2) {
	return PDFOperator.of(PDFOperatorNames_default.CurveToReplicateInitialPoint, [
		asPDFNumber(x1),
		asPDFNumber(y1),
		asPDFNumber(x2),
		asPDFNumber(y2)
	]);
};
var closePath = function() {
	return PDFOperator.of(PDFOperatorNames_default.ClosePath);
};
var moveTo = function(xPos, yPos) {
	return PDFOperator.of(PDFOperatorNames_default.MoveTo, [asPDFNumber(xPos), asPDFNumber(yPos)]);
};
var lineTo = function(xPos, yPos) {
	return PDFOperator.of(PDFOperatorNames_default.LineTo, [asPDFNumber(xPos), asPDFNumber(yPos)]);
};
var stroke = function() {
	return PDFOperator.of(PDFOperatorNames_default.StrokePath);
};
var fill = function() {
	return PDFOperator.of(PDFOperatorNames_default.FillNonZero);
};
var fillAndStroke = function() {
	return PDFOperator.of(PDFOperatorNames_default.FillNonZeroAndStroke);
};
var endPath = function() {
	return PDFOperator.of(PDFOperatorNames_default.EndPath);
};
var nextLine = function() {
	return PDFOperator.of(PDFOperatorNames_default.NextLine);
};
var showText = function(text) {
	return PDFOperator.of(PDFOperatorNames_default.ShowText, [text]);
};
var beginText = function() {
	return PDFOperator.of(PDFOperatorNames_default.BeginText);
};
var endText = function() {
	return PDFOperator.of(PDFOperatorNames_default.EndText);
};
var setFontAndSize = function(name, size) {
	return PDFOperator.of(PDFOperatorNames_default.SetFontAndSize, [asPDFName(name), asPDFNumber(size)]);
};
var setLineHeight = function(lineHeight) {
	return PDFOperator.of(PDFOperatorNames_default.SetTextLineHeight, [asPDFNumber(lineHeight)]);
};
var TextRenderingMode;
(function(TextRenderingMode) {
	TextRenderingMode[TextRenderingMode["Fill"] = 0] = "Fill";
	TextRenderingMode[TextRenderingMode["Outline"] = 1] = "Outline";
	TextRenderingMode[TextRenderingMode["FillAndOutline"] = 2] = "FillAndOutline";
	TextRenderingMode[TextRenderingMode["Invisible"] = 3] = "Invisible";
	TextRenderingMode[TextRenderingMode["FillAndClip"] = 4] = "FillAndClip";
	TextRenderingMode[TextRenderingMode["OutlineAndClip"] = 5] = "OutlineAndClip";
	TextRenderingMode[TextRenderingMode["FillAndOutlineAndClip"] = 6] = "FillAndOutlineAndClip";
	TextRenderingMode[TextRenderingMode["Clip"] = 7] = "Clip";
})(TextRenderingMode || (TextRenderingMode = {}));
var setTextMatrix = function(a, b, c, d, e, f) {
	return PDFOperator.of(PDFOperatorNames_default.SetTextMatrix, [
		asPDFNumber(a),
		asPDFNumber(b),
		asPDFNumber(c),
		asPDFNumber(d),
		asPDFNumber(e),
		asPDFNumber(f)
	]);
};
var rotateAndSkewTextRadiansAndTranslate = function(rotationAngle, xSkewAngle, ySkewAngle, x, y) {
	return setTextMatrix(cos(asNumber(rotationAngle)), sin(asNumber(rotationAngle)) + tan(asNumber(xSkewAngle)), -sin(asNumber(rotationAngle)) + tan(asNumber(ySkewAngle)), cos(asNumber(rotationAngle)), x, y);
};
var drawObject = function(name) {
	return PDFOperator.of(PDFOperatorNames_default.DrawObject, [asPDFName(name)]);
};
var setFillingGrayscaleColor = function(gray) {
	return PDFOperator.of(PDFOperatorNames_default.NonStrokingColorGray, [asPDFNumber(gray)]);
};
var setStrokingGrayscaleColor = function(gray) {
	return PDFOperator.of(PDFOperatorNames_default.StrokingColorGray, [asPDFNumber(gray)]);
};
var setFillingRgbColor = function(red, green, blue) {
	return PDFOperator.of(PDFOperatorNames_default.NonStrokingColorRgb, [
		asPDFNumber(red),
		asPDFNumber(green),
		asPDFNumber(blue)
	]);
};
var setStrokingRgbColor = function(red, green, blue) {
	return PDFOperator.of(PDFOperatorNames_default.StrokingColorRgb, [
		asPDFNumber(red),
		asPDFNumber(green),
		asPDFNumber(blue)
	]);
};
var setFillingCmykColor = function(cyan, magenta, yellow, key) {
	return PDFOperator.of(PDFOperatorNames_default.NonStrokingColorCmyk, [
		asPDFNumber(cyan),
		asPDFNumber(magenta),
		asPDFNumber(yellow),
		asPDFNumber(key)
	]);
};
var setStrokingCmykColor = function(cyan, magenta, yellow, key) {
	return PDFOperator.of(PDFOperatorNames_default.StrokingColorCmyk, [
		asPDFNumber(cyan),
		asPDFNumber(magenta),
		asPDFNumber(yellow),
		asPDFNumber(key)
	]);
};
var beginMarkedContent = function(tag) {
	return PDFOperator.of(PDFOperatorNames_default.BeginMarkedContent, [asPDFName(tag)]);
};
var endMarkedContent = function() {
	return PDFOperator.of(PDFOperatorNames_default.EndMarkedContent);
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/colors.js
var ColorTypes;
(function(ColorTypes) {
	ColorTypes["Grayscale"] = "Grayscale";
	ColorTypes["RGB"] = "RGB";
	ColorTypes["CMYK"] = "CMYK";
})(ColorTypes || (ColorTypes = {}));
var grayscale = function(gray) {
	assertRange(gray, "gray", 0, 1);
	return {
		type: ColorTypes.Grayscale,
		gray
	};
};
var rgb = function(red, green, blue) {
	assertRange(red, "red", 0, 1);
	assertRange(green, "green", 0, 1);
	assertRange(blue, "blue", 0, 1);
	return {
		type: ColorTypes.RGB,
		red,
		green,
		blue
	};
};
var cmyk = function(cyan, magenta, yellow, key) {
	assertRange(cyan, "cyan", 0, 1);
	assertRange(magenta, "magenta", 0, 1);
	assertRange(yellow, "yellow", 0, 1);
	assertRange(key, "key", 0, 1);
	return {
		type: ColorTypes.CMYK,
		cyan,
		magenta,
		yellow,
		key
	};
};
var Grayscale = ColorTypes.Grayscale;
var RGB = ColorTypes.RGB;
var CMYK = ColorTypes.CMYK;
var setFillingColor = function(color) {
	return color.type === Grayscale ? setFillingGrayscaleColor(color.gray) : color.type === RGB ? setFillingRgbColor(color.red, color.green, color.blue) : color.type === CMYK ? setFillingCmykColor(color.cyan, color.magenta, color.yellow, color.key) : error("Invalid color: " + JSON.stringify(color));
};
var setStrokingColor = function(color) {
	return color.type === Grayscale ? setStrokingGrayscaleColor(color.gray) : color.type === RGB ? setStrokingRgbColor(color.red, color.green, color.blue) : color.type === CMYK ? setStrokingCmykColor(color.cyan, color.magenta, color.yellow, color.key) : error("Invalid color: " + JSON.stringify(color));
};
var componentsToColor = function(comps, scale) {
	if (scale === void 0) scale = 1;
	return (comps === null || comps === void 0 ? void 0 : comps.length) === 1 ? grayscale(comps[0] * scale) : (comps === null || comps === void 0 ? void 0 : comps.length) === 3 ? rgb(comps[0] * scale, comps[1] * scale, comps[2] * scale) : (comps === null || comps === void 0 ? void 0 : comps.length) === 4 ? cmyk(comps[0] * scale, comps[1] * scale, comps[2] * scale, comps[3] * scale) : void 0;
};
var colorToComponents = function(color) {
	return color.type === Grayscale ? [color.gray] : color.type === RGB ? [
		color.red,
		color.green,
		color.blue
	] : color.type === CMYK ? [
		color.cyan,
		color.magenta,
		color.yellow,
		color.key
	] : error("Invalid color: " + JSON.stringify(color));
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/svgPath.js
var cx = 0;
var cy = 0;
var px = 0;
var py = 0;
var sx = 0;
var sy = 0;
var parameters = /* @__PURE__ */ new Map([
	["A", 7],
	["a", 7],
	["C", 6],
	["c", 6],
	["H", 1],
	["h", 1],
	["L", 2],
	["l", 2],
	["M", 2],
	["m", 2],
	["Q", 4],
	["q", 4],
	["S", 4],
	["s", 4],
	["T", 2],
	["t", 2],
	["V", 1],
	["v", 1],
	["Z", 0],
	["z", 0]
]);
var parse$1 = function(path) {
	var cmd;
	var ret = [];
	var args = [];
	var curArg = "";
	var foundDecimal = false;
	var params = 0;
	for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
		var c = path_1[_i];
		if (parameters.has(c)) {
			params = parameters.get(c);
			if (cmd) {
				if (curArg.length > 0) args[args.length] = +curArg;
				ret[ret.length] = {
					cmd,
					args
				};
				args = [];
				curArg = "";
				foundDecimal = false;
			}
			cmd = c;
		} else if ([" ", ","].includes(c) || c === "-" && curArg.length > 0 && curArg[curArg.length - 1] !== "e" || c === "." && foundDecimal) {
			if (curArg.length === 0) continue;
			if (args.length === params) {
				ret[ret.length] = {
					cmd,
					args
				};
				args = [+curArg];
				if (cmd === "M") cmd = "L";
				if (cmd === "m") cmd = "l";
			} else args[args.length] = +curArg;
			foundDecimal = c === ".";
			curArg = ["-", "."].includes(c) ? c : "";
		} else {
			curArg += c;
			if (c === ".") foundDecimal = true;
		}
	}
	if (curArg.length > 0) if (args.length === params) {
		ret[ret.length] = {
			cmd,
			args
		};
		args = [+curArg];
		if (cmd === "M") cmd = "L";
		if (cmd === "m") cmd = "l";
	} else args[args.length] = +curArg;
	ret[ret.length] = {
		cmd,
		args
	};
	return ret;
};
var apply = function(commands) {
	cx = cy = px = py = sx = sy = 0;
	var cmds = [];
	for (var i = 0; i < commands.length; i++) {
		var c = commands[i];
		if (c.cmd && typeof runners[c.cmd] === "function") {
			var cmd = runners[c.cmd](c.args);
			if (Array.isArray(cmd)) cmds = cmds.concat(cmd);
			else cmds.push(cmd);
		}
	}
	return cmds;
};
var runners = {
	M: function(a) {
		cx = a[0];
		cy = a[1];
		px = py = null;
		sx = cx;
		sy = cy;
		return moveTo(cx, cy);
	},
	m: function(a) {
		cx += a[0];
		cy += a[1];
		px = py = null;
		sx = cx;
		sy = cy;
		return moveTo(cx, cy);
	},
	C: function(a) {
		cx = a[4];
		cy = a[5];
		px = a[2];
		py = a[3];
		return appendBezierCurve(a[0], a[1], a[2], a[3], a[4], a[5]);
	},
	c: function(a) {
		var cmd = appendBezierCurve(a[0] + cx, a[1] + cy, a[2] + cx, a[3] + cy, a[4] + cx, a[5] + cy);
		px = cx + a[2];
		py = cy + a[3];
		cx += a[4];
		cy += a[5];
		return cmd;
	},
	S: function(a) {
		if (px === null || py === null) {
			px = cx;
			py = cy;
		}
		var cmd = appendBezierCurve(cx - (px - cx), cy - (py - cy), a[0], a[1], a[2], a[3]);
		px = a[0];
		py = a[1];
		cx = a[2];
		cy = a[3];
		return cmd;
	},
	s: function(a) {
		if (px === null || py === null) {
			px = cx;
			py = cy;
		}
		var cmd = appendBezierCurve(cx - (px - cx), cy - (py - cy), cx + a[0], cy + a[1], cx + a[2], cy + a[3]);
		px = cx + a[0];
		py = cy + a[1];
		cx += a[2];
		cy += a[3];
		return cmd;
	},
	Q: function(a) {
		px = a[0];
		py = a[1];
		cx = a[2];
		cy = a[3];
		return appendQuadraticCurve(a[0], a[1], cx, cy);
	},
	q: function(a) {
		var cmd = appendQuadraticCurve(a[0] + cx, a[1] + cy, a[2] + cx, a[3] + cy);
		px = cx + a[0];
		py = cy + a[1];
		cx += a[2];
		cy += a[3];
		return cmd;
	},
	T: function(a) {
		if (px === null || py === null) {
			px = cx;
			py = cy;
		} else {
			px = cx - (px - cx);
			py = cy - (py - cy);
		}
		var cmd = appendQuadraticCurve(px, py, a[0], a[1]);
		px = cx - (px - cx);
		py = cy - (py - cy);
		cx = a[0];
		cy = a[1];
		return cmd;
	},
	t: function(a) {
		if (px === null || py === null) {
			px = cx;
			py = cy;
		} else {
			px = cx - (px - cx);
			py = cy - (py - cy);
		}
		var cmd = appendQuadraticCurve(px, py, cx + a[0], cy + a[1]);
		cx += a[0];
		cy += a[1];
		return cmd;
	},
	A: function(a) {
		var cmds = solveArc(cx, cy, a);
		cx = a[5];
		cy = a[6];
		return cmds;
	},
	a: function(a) {
		a[5] += cx;
		a[6] += cy;
		var cmds = solveArc(cx, cy, a);
		cx = a[5];
		cy = a[6];
		return cmds;
	},
	L: function(a) {
		cx = a[0];
		cy = a[1];
		px = py = null;
		return lineTo(cx, cy);
	},
	l: function(a) {
		cx += a[0];
		cy += a[1];
		px = py = null;
		return lineTo(cx, cy);
	},
	H: function(a) {
		cx = a[0];
		px = py = null;
		return lineTo(cx, cy);
	},
	h: function(a) {
		cx += a[0];
		px = py = null;
		return lineTo(cx, cy);
	},
	V: function(a) {
		cy = a[0];
		px = py = null;
		return lineTo(cx, cy);
	},
	v: function(a) {
		cy += a[0];
		px = py = null;
		return lineTo(cx, cy);
	},
	Z: function() {
		var cmd = closePath();
		cx = sx;
		cy = sy;
		return cmd;
	},
	z: function() {
		var cmd = closePath();
		cx = sx;
		cy = sy;
		return cmd;
	}
};
var solveArc = function(x, y, coords) {
	var rx = coords[0], ry = coords[1], rot = coords[2], large = coords[3], sweep = coords[4], ex = coords[5], ey = coords[6];
	var segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
	var cmds = [];
	for (var _i = 0, segs_1 = segs; _i < segs_1.length; _i++) {
		var seg = segs_1[_i];
		var bez = segmentToBezier.apply(void 0, seg);
		cmds.push(appendBezierCurve.apply(void 0, bez));
	}
	return cmds;
};
var arcToSegments = function(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
	var th = rotateX * (Math.PI / 180);
	var sinTh = Math.sin(th);
	var cosTh = Math.cos(th);
	rx = Math.abs(rx);
	ry = Math.abs(ry);
	px = cosTh * (ox - x) * .5 + sinTh * (oy - y) * .5;
	py = cosTh * (oy - y) * .5 - sinTh * (ox - x) * .5;
	var pl = px * px / (rx * rx) + py * py / (ry * ry);
	if (pl > 1) {
		pl = Math.sqrt(pl);
		rx *= pl;
		ry *= pl;
	}
	var a00 = cosTh / rx;
	var a01 = sinTh / rx;
	var a10 = -sinTh / ry;
	var a11 = cosTh / ry;
	var x0 = a00 * ox + a01 * oy;
	var y0 = a10 * ox + a11 * oy;
	var x1 = a00 * x + a01 * y;
	var y1 = a10 * x + a11 * y;
	var sfactorSq = 1 / ((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)) - .25;
	if (sfactorSq < 0) sfactorSq = 0;
	var sfactor = Math.sqrt(sfactorSq);
	if (sweep === large) sfactor = -sfactor;
	var xc = .5 * (x0 + x1) - sfactor * (y1 - y0);
	var yc = .5 * (y0 + y1) + sfactor * (x1 - x0);
	var th0 = Math.atan2(y0 - yc, x0 - xc);
	var thArc = Math.atan2(y1 - yc, x1 - xc) - th0;
	if (thArc < 0 && sweep === 1) thArc += 2 * Math.PI;
	else if (thArc > 0 && sweep === 0) thArc -= 2 * Math.PI;
	var segments = Math.ceil(Math.abs(thArc / (Math.PI * .5 + .001)));
	var result = [];
	for (var i = 0; i < segments; i++) {
		var th2 = th0 + i * thArc / segments;
		var th3 = th0 + (i + 1) * thArc / segments;
		result[i] = [
			xc,
			yc,
			th2,
			th3,
			rx,
			ry,
			sinTh,
			cosTh
		];
	}
	return result;
};
var segmentToBezier = function(cx1, cy1, th0, th1, rx, ry, sinTh, cosTh) {
	var a00 = cosTh * rx;
	var a01 = -sinTh * ry;
	var a10 = sinTh * rx;
	var a11 = cosTh * ry;
	var thHalf = .5 * (th1 - th0);
	var t = 8 / 3 * Math.sin(thHalf * .5) * Math.sin(thHalf * .5) / Math.sin(thHalf);
	var x1 = cx1 + Math.cos(th0) - t * Math.sin(th0);
	var y1 = cy1 + Math.sin(th0) + t * Math.cos(th0);
	var x3 = cx1 + Math.cos(th1);
	var y3 = cy1 + Math.sin(th1);
	var x2 = x3 + t * Math.sin(th1);
	var y2 = y3 - t * Math.cos(th1);
	return [
		a00 * x1 + a01 * y1,
		a10 * x1 + a11 * y1,
		a00 * x2 + a01 * y2,
		a10 * x2 + a11 * y2,
		a00 * x3 + a01 * y3,
		a10 * x3 + a11 * y3
	];
};
var svgPathToOperators = function(path) {
	return apply(parse$1(path));
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/operations.js
var drawLinesOfText = function(lines, options) {
	var operators = [
		pushGraphicsState(),
		options.graphicsState && setGraphicsState(options.graphicsState),
		beginText(),
		setFillingColor(options.color),
		setFontAndSize(options.font, options.size),
		setLineHeight(options.lineHeight),
		rotateAndSkewTextRadiansAndTranslate(toRadians(options.rotate), toRadians(options.xSkew), toRadians(options.ySkew), options.x, options.y)
	].filter(Boolean);
	for (var idx = 0, len = lines.length; idx < len; idx++) operators.push(showText(lines[idx]), nextLine());
	operators.push(endText(), popGraphicsState());
	return operators;
};
var drawImage = function(name, options) {
	return [
		pushGraphicsState(),
		options.graphicsState && setGraphicsState(options.graphicsState),
		translate(options.x, options.y),
		rotateRadians(toRadians(options.rotate)),
		scale(options.width, options.height),
		skewRadians(toRadians(options.xSkew), toRadians(options.ySkew)),
		drawObject(name),
		popGraphicsState()
	].filter(Boolean);
};
var drawPage = function(name, options) {
	return [
		pushGraphicsState(),
		options.graphicsState && setGraphicsState(options.graphicsState),
		translate(options.x, options.y),
		rotateRadians(toRadians(options.rotate)),
		scale(options.xScale, options.yScale),
		skewRadians(toRadians(options.xSkew), toRadians(options.ySkew)),
		drawObject(name),
		popGraphicsState()
	].filter(Boolean);
};
var drawLine = function(options) {
	var _a, _b;
	return [
		pushGraphicsState(),
		options.graphicsState && setGraphicsState(options.graphicsState),
		options.color && setStrokingColor(options.color),
		setLineWidth(options.thickness),
		setDashPattern((_a = options.dashArray) !== null && _a !== void 0 ? _a : [], (_b = options.dashPhase) !== null && _b !== void 0 ? _b : 0),
		moveTo(options.start.x, options.start.y),
		options.lineCap && setLineCap(options.lineCap),
		moveTo(options.start.x, options.start.y),
		lineTo(options.end.x, options.end.y),
		stroke(),
		popGraphicsState()
	].filter(Boolean);
};
var drawRectangle = function(options) {
	var _a, _b;
	return [
		pushGraphicsState(),
		options.graphicsState && setGraphicsState(options.graphicsState),
		options.color && setFillingColor(options.color),
		options.borderColor && setStrokingColor(options.borderColor),
		setLineWidth(options.borderWidth),
		options.borderLineCap && setLineCap(options.borderLineCap),
		setDashPattern((_a = options.borderDashArray) !== null && _a !== void 0 ? _a : [], (_b = options.borderDashPhase) !== null && _b !== void 0 ? _b : 0),
		translate(options.x, options.y),
		rotateRadians(toRadians(options.rotate)),
		skewRadians(toRadians(options.xSkew), toRadians(options.ySkew)),
		moveTo(0, 0),
		lineTo(0, options.height),
		lineTo(options.width, options.height),
		lineTo(options.width, 0),
		closePath(),
		options.color && options.borderWidth ? fillAndStroke() : options.color ? fill() : options.borderColor ? stroke() : closePath(),
		popGraphicsState()
	].filter(Boolean);
};
var KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);
/** @deprecated */
var drawEllipsePath = function(config) {
	var x = asNumber(config.x);
	var y = asNumber(config.y);
	var xScale = asNumber(config.xScale);
	var yScale = asNumber(config.yScale);
	x -= xScale;
	y -= yScale;
	var ox = xScale * KAPPA;
	var oy = yScale * KAPPA;
	var xe = x + xScale * 2;
	var ye = y + yScale * 2;
	var xm = x + xScale;
	var ym = y + yScale;
	return [
		pushGraphicsState(),
		moveTo(x, ym),
		appendBezierCurve(x, ym - oy, xm - ox, y, xm, y),
		appendBezierCurve(xm + ox, y, xe, ym - oy, xe, ym),
		appendBezierCurve(xe, ym + oy, xm + ox, ye, xm, ye),
		appendBezierCurve(xm - ox, ye, x, ym + oy, x, ym),
		popGraphicsState()
	];
};
var drawEllipseCurves = function(config) {
	var centerX = asNumber(config.x);
	var centerY = asNumber(config.y);
	var xScale = asNumber(config.xScale);
	var yScale = asNumber(config.yScale);
	var x = -xScale;
	var y = -yScale;
	var ox = xScale * KAPPA;
	var oy = yScale * KAPPA;
	var xe = x + xScale * 2;
	var ye = y + yScale * 2;
	var xm = x + xScale;
	var ym = y + yScale;
	return [
		translate(centerX, centerY),
		rotateRadians(toRadians(config.rotate)),
		moveTo(x, ym),
		appendBezierCurve(x, ym - oy, xm - ox, y, xm, y),
		appendBezierCurve(xm + ox, y, xe, ym - oy, xe, ym),
		appendBezierCurve(xe, ym + oy, xm + ox, ye, xm, ye),
		appendBezierCurve(xm - ox, ye, x, ym + oy, x, ym)
	];
};
var drawEllipse = function(options) {
	var _a, _b, _c;
	return __spreadArrays([
		pushGraphicsState(),
		options.graphicsState && setGraphicsState(options.graphicsState),
		options.color && setFillingColor(options.color),
		options.borderColor && setStrokingColor(options.borderColor),
		setLineWidth(options.borderWidth),
		options.borderLineCap && setLineCap(options.borderLineCap),
		setDashPattern((_a = options.borderDashArray) !== null && _a !== void 0 ? _a : [], (_b = options.borderDashPhase) !== null && _b !== void 0 ? _b : 0)
	], options.rotate === void 0 ? drawEllipsePath({
		x: options.x,
		y: options.y,
		xScale: options.xScale,
		yScale: options.yScale
	}) : drawEllipseCurves({
		x: options.x,
		y: options.y,
		xScale: options.xScale,
		yScale: options.yScale,
		rotate: (_c = options.rotate) !== null && _c !== void 0 ? _c : degrees(0)
	}), [options.color && options.borderWidth ? fillAndStroke() : options.color ? fill() : options.borderColor ? stroke() : closePath(), popGraphicsState()]).filter(Boolean);
};
var drawSvgPath = function(path, options) {
	var _a, _b, _c;
	return __spreadArrays([
		pushGraphicsState(),
		options.graphicsState && setGraphicsState(options.graphicsState),
		translate(options.x, options.y),
		rotateRadians(toRadians((_a = options.rotate) !== null && _a !== void 0 ? _a : degrees(0))),
		options.scale ? scale(options.scale, -options.scale) : scale(1, -1),
		options.color && setFillingColor(options.color),
		options.borderColor && setStrokingColor(options.borderColor),
		options.borderWidth && setLineWidth(options.borderWidth),
		options.borderLineCap && setLineCap(options.borderLineCap),
		setDashPattern((_b = options.borderDashArray) !== null && _b !== void 0 ? _b : [], (_c = options.borderDashPhase) !== null && _c !== void 0 ? _c : 0)
	], svgPathToOperators(path), [options.color && options.borderWidth ? fillAndStroke() : options.color ? fill() : options.borderColor ? stroke() : closePath(), popGraphicsState()]).filter(Boolean);
};
var drawCheckMark = function(options) {
	var size = asNumber(options.size);
	/*********************** Define Check Mark Points ***************************/
	var p2x = -.25;
	var p2y = -.49;
	var p3y = .475;
	var p3x = .69;
	var p1x = -.675;
	var p1y = -((p1x - p2x) * (p3x - p2x)) / (p3y - p2y) + p2y;
	return [
		pushGraphicsState(),
		options.color && setStrokingColor(options.color),
		setLineWidth(options.thickness),
		translate(options.x, options.y),
		moveTo(p1x * size, p1y * size),
		lineTo(p2x * size, p2y * size),
		lineTo(p3x * size, p3y * size),
		stroke(),
		popGraphicsState()
	].filter(Boolean);
};
var rotateInPlace = function(options) {
	return options.rotation === 0 ? [translate(0, 0), rotateDegrees(0)] : options.rotation === 90 ? [translate(options.width, 0), rotateDegrees(90)] : options.rotation === 180 ? [translate(options.width, options.height), rotateDegrees(180)] : options.rotation === 270 ? [translate(0, options.height), rotateDegrees(270)] : [];
};
var drawCheckBox = function(options) {
	var outline = drawRectangle({
		x: options.x,
		y: options.y,
		width: options.width,
		height: options.height,
		borderWidth: options.borderWidth,
		color: options.color,
		borderColor: options.borderColor,
		rotate: degrees(0),
		xSkew: degrees(0),
		ySkew: degrees(0)
	});
	if (!options.filled) return outline;
	var width = asNumber(options.width);
	var height = asNumber(options.height);
	var checkMarkSize = Math.min(width, height) / 2;
	var checkMark = drawCheckMark({
		x: width / 2,
		y: height / 2,
		size: checkMarkSize,
		thickness: options.thickness,
		color: options.markColor
	});
	return __spreadArrays([pushGraphicsState()], outline, checkMark, [popGraphicsState()]);
};
var drawRadioButton = function(options) {
	var width = asNumber(options.width);
	var height = asNumber(options.height);
	var outlineScale = Math.min(width, height) / 2;
	var outline = drawEllipse({
		x: options.x,
		y: options.y,
		xScale: outlineScale,
		yScale: outlineScale,
		color: options.color,
		borderColor: options.borderColor,
		borderWidth: options.borderWidth
	});
	if (!options.filled) return outline;
	var dot = drawEllipse({
		x: options.x,
		y: options.y,
		xScale: outlineScale * .45,
		yScale: outlineScale * .45,
		color: options.dotColor,
		borderColor: void 0,
		borderWidth: 0
	});
	return __spreadArrays([pushGraphicsState()], outline, dot, [popGraphicsState()]);
};
var drawButton = function(options) {
	var background = drawRectangle({
		x: asNumber(options.x),
		y: asNumber(options.y),
		width: asNumber(options.width),
		height: asNumber(options.height),
		borderWidth: options.borderWidth,
		color: options.color,
		borderColor: options.borderColor,
		rotate: degrees(0),
		xSkew: degrees(0),
		ySkew: degrees(0)
	});
	var lines = drawTextLines(options.textLines, {
		color: options.textColor,
		font: options.font,
		size: options.fontSize,
		rotate: degrees(0),
		xSkew: degrees(0),
		ySkew: degrees(0)
	});
	return __spreadArrays([pushGraphicsState()], background, lines, [popGraphicsState()]);
};
var drawTextLines = function(lines, options) {
	var operators = [
		beginText(),
		setFillingColor(options.color),
		setFontAndSize(options.font, options.size)
	];
	for (var idx = 0, len = lines.length; idx < len; idx++) {
		var _a = lines[idx], encoded = _a.encoded, x = _a.x, y = _a.y;
		operators.push(rotateAndSkewTextRadiansAndTranslate(toRadians(options.rotate), toRadians(options.xSkew), toRadians(options.ySkew), x, y), showText(encoded));
	}
	operators.push(endText());
	return operators;
};
var drawTextField = function(options) {
	var x = asNumber(options.x);
	var y = asNumber(options.y);
	var width = asNumber(options.width);
	var height = asNumber(options.height);
	var borderWidth = asNumber(options.borderWidth);
	var padding = asNumber(options.padding);
	var clipX = x + borderWidth / 2 + padding;
	var clipY = y + borderWidth / 2 + padding;
	var clipWidth = width - (borderWidth / 2 + padding) * 2;
	var clipHeight = height - (borderWidth / 2 + padding) * 2;
	var clippingArea = [
		moveTo(clipX, clipY),
		lineTo(clipX, clipY + clipHeight),
		lineTo(clipX + clipWidth, clipY + clipHeight),
		lineTo(clipX + clipWidth, clipY),
		closePath(),
		clip(),
		endPath()
	];
	var background = drawRectangle({
		x,
		y,
		width,
		height,
		borderWidth: options.borderWidth,
		color: options.color,
		borderColor: options.borderColor,
		rotate: degrees(0),
		xSkew: degrees(0),
		ySkew: degrees(0)
	});
	var lines = drawTextLines(options.textLines, {
		color: options.textColor,
		font: options.font,
		size: options.fontSize,
		rotate: degrees(0),
		xSkew: degrees(0),
		ySkew: degrees(0)
	});
	var markedContent = __spreadArrays([beginMarkedContent("Tx"), pushGraphicsState()], lines, [popGraphicsState(), endMarkedContent()]);
	return __spreadArrays([pushGraphicsState()], background, clippingArea, markedContent, [popGraphicsState()]);
};
var drawOptionList = function(options) {
	var x = asNumber(options.x);
	var y = asNumber(options.y);
	var width = asNumber(options.width);
	var height = asNumber(options.height);
	var lineHeight = asNumber(options.lineHeight);
	var borderWidth = asNumber(options.borderWidth);
	var padding = asNumber(options.padding);
	var clipX = x + borderWidth / 2 + padding;
	var clipY = y + borderWidth / 2 + padding;
	var clipWidth = width - (borderWidth / 2 + padding) * 2;
	var clipHeight = height - (borderWidth / 2 + padding) * 2;
	var clippingArea = [
		moveTo(clipX, clipY),
		lineTo(clipX, clipY + clipHeight),
		lineTo(clipX + clipWidth, clipY + clipHeight),
		lineTo(clipX + clipWidth, clipY),
		closePath(),
		clip(),
		endPath()
	];
	var background = drawRectangle({
		x,
		y,
		width,
		height,
		borderWidth: options.borderWidth,
		color: options.color,
		borderColor: options.borderColor,
		rotate: degrees(0),
		xSkew: degrees(0),
		ySkew: degrees(0)
	});
	var highlights = [];
	for (var idx = 0, len = options.selectedLines.length; idx < len; idx++) {
		var line = options.textLines[options.selectedLines[idx]];
		highlights.push.apply(highlights, drawRectangle({
			x: line.x - padding,
			y: line.y - (lineHeight - line.height) / 2,
			width: width - borderWidth,
			height: line.height + (lineHeight - line.height) / 2,
			borderWidth: 0,
			color: options.selectedColor,
			borderColor: void 0,
			rotate: degrees(0),
			xSkew: degrees(0),
			ySkew: degrees(0)
		}));
	}
	var lines = drawTextLines(options.textLines, {
		color: options.textColor,
		font: options.font,
		size: options.fontSize,
		rotate: degrees(0),
		xSkew: degrees(0),
		ySkew: degrees(0)
	});
	var markedContent = __spreadArrays([beginMarkedContent("Tx"), pushGraphicsState()], lines, [popGraphicsState(), endMarkedContent()]);
	return __spreadArrays([pushGraphicsState()], background, highlights, clippingArea, markedContent, [popGraphicsState()]);
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/errors.js
var EncryptedPDFError = function(_super) {
	__extends(EncryptedPDFError, _super);
	function EncryptedPDFError() {
		var _this = this;
		_this = _super.call(this, "Input document to `PDFDocument.load` is encrypted. You can use `PDFDocument.load(..., { ignoreEncryption: true })` if you wish to load the document anyways.") || this;
		return _this;
	}
	return EncryptedPDFError;
}(Error);
var FontkitNotRegisteredError = function(_super) {
	__extends(FontkitNotRegisteredError, _super);
	function FontkitNotRegisteredError() {
		var _this = this;
		_this = _super.call(this, "Input to `PDFDocument.embedFont` was a custom font, but no `fontkit` instance was found. You must register a `fontkit` instance with `PDFDocument.registerFontkit(...)` before embedding custom fonts.") || this;
		return _this;
	}
	return FontkitNotRegisteredError;
}(Error);
var ForeignPageError = function(_super) {
	__extends(ForeignPageError, _super);
	function ForeignPageError() {
		var _this = this;
		_this = _super.call(this, "A `page` passed to `PDFDocument.addPage` or `PDFDocument.insertPage` was from a different (foreign) PDF document. If you want to copy pages from one PDFDocument to another, you must use `PDFDocument.copyPages(...)` to copy the pages before adding or inserting them.") || this;
		return _this;
	}
	return ForeignPageError;
}(Error);
var RemovePageFromEmptyDocumentError = function(_super) {
	__extends(RemovePageFromEmptyDocumentError, _super);
	function RemovePageFromEmptyDocumentError() {
		var _this = this;
		_this = _super.call(this, "PDFDocument has no pages so `PDFDocument.removePage` cannot be called") || this;
		return _this;
	}
	return RemovePageFromEmptyDocumentError;
}(Error);
var NoSuchFieldError = function(_super) {
	__extends(NoSuchFieldError, _super);
	function NoSuchFieldError(name) {
		var _this = this;
		var msg = "PDFDocument has no form field with the name \"" + name + "\"";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return NoSuchFieldError;
}(Error);
var UnexpectedFieldTypeError = function(_super) {
	__extends(UnexpectedFieldTypeError, _super);
	function UnexpectedFieldTypeError(name, expected, actual) {
		var _a, _b;
		var _this = this;
		var expectedType = expected === null || expected === void 0 ? void 0 : expected.name;
		var actualType = (_b = (_a = actual === null || actual === void 0 ? void 0 : actual.constructor) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : actual;
		var msg = "Expected field \"" + name + "\" to be of type " + expectedType + ", " + ("but it is actually of type " + actualType);
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return UnexpectedFieldTypeError;
}(Error);
(function(_super) {
	__extends(MissingOnValueCheckError, _super);
	function MissingOnValueCheckError(onValue) {
		var _this = this;
		var msg = "Failed to select check box due to missing onValue: \"" + onValue + "\"";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return MissingOnValueCheckError;
})(Error);
var FieldAlreadyExistsError = function(_super) {
	__extends(FieldAlreadyExistsError, _super);
	function FieldAlreadyExistsError(name) {
		var _this = this;
		var msg = "A field already exists with the specified name: \"" + name + "\"";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return FieldAlreadyExistsError;
}(Error);
var InvalidFieldNamePartError = function(_super) {
	__extends(InvalidFieldNamePartError, _super);
	function InvalidFieldNamePartError(namePart) {
		var _this = this;
		var msg = "Field name contains invalid component: \"" + namePart + "\"";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return InvalidFieldNamePartError;
}(Error);
(function(_super) {
	__extends(FieldExistsAsNonTerminalError, _super);
	function FieldExistsAsNonTerminalError(name) {
		var _this = this;
		var msg = "A non-terminal field already exists with the specified name: \"" + name + "\"";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return FieldExistsAsNonTerminalError;
})(Error);
var RichTextFieldReadError = function(_super) {
	__extends(RichTextFieldReadError, _super);
	function RichTextFieldReadError(fieldName) {
		var _this = this;
		var msg = "Reading rich text fields is not supported: Attempted to read rich text field: " + fieldName;
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return RichTextFieldReadError;
}(Error);
var CombedTextLayoutError = function(_super) {
	__extends(CombedTextLayoutError, _super);
	function CombedTextLayoutError(lineLength, cellCount) {
		var _this = this;
		var msg = "Failed to layout combed text as lineLength=" + lineLength + " is greater than cellCount=" + cellCount;
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return CombedTextLayoutError;
}(Error);
var ExceededMaxLengthError = function(_super) {
	__extends(ExceededMaxLengthError, _super);
	function ExceededMaxLengthError(textLength, maxLength, name) {
		var _this = this;
		var msg = "Attempted to set text with length=" + textLength + " for TextField with maxLength=" + maxLength + " and name=" + name;
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return ExceededMaxLengthError;
}(Error);
var InvalidMaxLengthError = function(_super) {
	__extends(InvalidMaxLengthError, _super);
	function InvalidMaxLengthError(textLength, maxLength, name) {
		var _this = this;
		var msg = "Attempted to set maxLength=" + maxLength + ", which is less than " + textLength + ", the length of this field's current value (name=" + name + ")";
		_this = _super.call(this, msg) || this;
		return _this;
	}
	return InvalidMaxLengthError;
}(Error);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/text/alignment.js
var TextAlignment;
(function(TextAlignment) {
	TextAlignment[TextAlignment["Left"] = 0] = "Left";
	TextAlignment[TextAlignment["Center"] = 1] = "Center";
	TextAlignment[TextAlignment["Right"] = 2] = "Right";
})(TextAlignment || (TextAlignment = {}));
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/text/layout.js
var MIN_FONT_SIZE = 4;
var MAX_FONT_SIZE = 500;
var computeFontSize = function(lines, font, bounds, multiline) {
	if (multiline === void 0) multiline = false;
	var fontSize = MIN_FONT_SIZE;
	while (fontSize < MAX_FONT_SIZE) {
		var linesUsed = 0;
		for (var lineIdx = 0, lineLen = lines.length; lineIdx < lineLen; lineIdx++) {
			linesUsed += 1;
			var words = lines[lineIdx].split(" ");
			var spaceInLineRemaining = bounds.width;
			for (var idx = 0, len = words.length; idx < len; idx++) {
				var word = idx === len - 1 ? words[idx] : words[idx] + " ";
				var widthOfWord = font.widthOfTextAtSize(word, fontSize);
				spaceInLineRemaining -= widthOfWord;
				if (spaceInLineRemaining <= 0) {
					linesUsed += 1;
					spaceInLineRemaining = bounds.width - widthOfWord;
				}
			}
		}
		if (!multiline && linesUsed > lines.length) return fontSize - 1;
		var height = font.heightAtSize(fontSize);
		if ((height + height * .2) * linesUsed > Math.abs(bounds.height)) return fontSize - 1;
		fontSize += 1;
	}
	return fontSize;
};
var computeCombedFontSize = function(line, font, bounds, cellCount) {
	var cellWidth = bounds.width / cellCount;
	var cellHeight = bounds.height;
	var fontSize = MIN_FONT_SIZE;
	var chars = charSplit(line);
	while (fontSize < MAX_FONT_SIZE) {
		for (var idx = 0, len = chars.length; idx < len; idx++) {
			var c = chars[idx];
			if (font.widthOfTextAtSize(c, fontSize) > cellWidth * .75) return fontSize - 1;
		}
		if (font.heightAtSize(fontSize, { descender: false }) > cellHeight) return fontSize - 1;
		fontSize += 1;
	}
	return fontSize;
};
var lastIndexOfWhitespace = function(line) {
	for (var idx = line.length; idx > 0; idx--) if (/\s/.test(line[idx])) return idx;
};
var splitOutLines = function(input, maxWidth, font, fontSize) {
	var _a;
	var lastWhitespaceIdx = input.length;
	while (lastWhitespaceIdx > 0) {
		var line = input.substring(0, lastWhitespaceIdx);
		var encoded = font.encodeText(line);
		var width = font.widthOfTextAtSize(line, fontSize);
		if (width < maxWidth) return {
			line,
			encoded,
			width,
			remainder: input.substring(lastWhitespaceIdx) || void 0
		};
		lastWhitespaceIdx = (_a = lastIndexOfWhitespace(line)) !== null && _a !== void 0 ? _a : 0;
	}
	return {
		line: input,
		encoded: font.encodeText(input),
		width: font.widthOfTextAtSize(input, fontSize),
		remainder: void 0
	};
};
var layoutMultilineText = function(text, _a) {
	var alignment = _a.alignment, fontSize = _a.fontSize, font = _a.font, bounds = _a.bounds;
	var lines = lineSplit(cleanText(text));
	if (fontSize === void 0 || fontSize === 0) fontSize = computeFontSize(lines, font, bounds, true);
	var height = font.heightAtSize(fontSize);
	var lineHeight = height + height * .2;
	var textLines = [];
	var minX = bounds.x;
	var minY = bounds.y;
	var maxX = bounds.x + bounds.width;
	var maxY = bounds.y + bounds.height;
	var y = bounds.y + bounds.height;
	for (var idx = 0, len = lines.length; idx < len; idx++) {
		var prevRemainder = lines[idx];
		while (prevRemainder !== void 0) {
			var _b = splitOutLines(prevRemainder, bounds.width, font, fontSize), line = _b.line, encoded = _b.encoded, width = _b.width, remainder = _b.remainder;
			var x = alignment === TextAlignment.Left ? bounds.x : alignment === TextAlignment.Center ? bounds.x + bounds.width / 2 - width / 2 : alignment === TextAlignment.Right ? bounds.x + bounds.width - width : bounds.x;
			y -= lineHeight;
			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (x + width > maxX) maxX = x + width;
			if (y + height > maxY) maxY = y + height;
			textLines.push({
				text: line,
				encoded,
				width,
				height,
				x,
				y
			});
			prevRemainder = remainder === null || remainder === void 0 ? void 0 : remainder.trim();
		}
	}
	return {
		fontSize,
		lineHeight,
		lines: textLines,
		bounds: {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY
		}
	};
};
var layoutCombedText = function(text, _a) {
	var fontSize = _a.fontSize, font = _a.font, bounds = _a.bounds, cellCount = _a.cellCount;
	var line = mergeLines(cleanText(text));
	if (line.length > cellCount) throw new CombedTextLayoutError(line.length, cellCount);
	if (fontSize === void 0 || fontSize === 0) fontSize = computeCombedFontSize(line, font, bounds, cellCount);
	var cellWidth = bounds.width / cellCount;
	var height = font.heightAtSize(fontSize, { descender: false });
	var y = bounds.y + (bounds.height / 2 - height / 2);
	var cells = [];
	var minX = bounds.x;
	var minY = bounds.y;
	var maxX = bounds.x + bounds.width;
	var maxY = bounds.y + bounds.height;
	var cellOffset = 0;
	var charOffset = 0;
	while (cellOffset < cellCount) {
		var _b = charAtIndex(line, charOffset), char = _b[0], charLength = _b[1];
		var encoded = font.encodeText(char);
		var width = font.widthOfTextAtSize(char, fontSize);
		var x = bounds.x + (cellWidth * cellOffset + cellWidth / 2) - width / 2;
		if (x < minX) minX = x;
		if (y < minY) minY = y;
		if (x + width > maxX) maxX = x + width;
		if (y + height > maxY) maxY = y + height;
		cells.push({
			text: line,
			encoded,
			width,
			height,
			x,
			y
		});
		cellOffset += 1;
		charOffset += charLength;
	}
	return {
		fontSize,
		cells,
		bounds: {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY
		}
	};
};
var layoutSinglelineText = function(text, _a) {
	var alignment = _a.alignment, fontSize = _a.fontSize, font = _a.font, bounds = _a.bounds;
	var line = mergeLines(cleanText(text));
	if (fontSize === void 0 || fontSize === 0) fontSize = computeFontSize([line], font, bounds);
	var encoded = font.encodeText(line);
	var width = font.widthOfTextAtSize(line, fontSize);
	var height = font.heightAtSize(fontSize, { descender: false });
	var x = alignment === TextAlignment.Left ? bounds.x : alignment === TextAlignment.Center ? bounds.x + bounds.width / 2 - width / 2 : alignment === TextAlignment.Right ? bounds.x + bounds.width - width : bounds.x;
	var y = bounds.y + (bounds.height / 2 - height / 2);
	return {
		fontSize,
		line: {
			text: line,
			encoded,
			width,
			height,
			x,
			y
		},
		bounds: {
			x,
			y,
			width,
			height
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/appearances.js
/********************* Appearance Provider Functions **************************/
var normalizeAppearance = function(appearance) {
	if ("normal" in appearance) return appearance;
	return { normal: appearance };
};
var tfRegex = /\/([^\0\t\n\f\r\ ]+)[\0\t\n\f\r\ ]+(\d*\.\d+|\d+)[\0\t\n\f\r\ ]+Tf/;
var getDefaultFontSize = function(field) {
	var _a, _b;
	var daMatch = (_b = findLastMatch((_a = field.getDefaultAppearance()) !== null && _a !== void 0 ? _a : "", tfRegex).match) !== null && _b !== void 0 ? _b : [];
	var defaultFontSize = Number(daMatch[2]);
	return isFinite(defaultFontSize) ? defaultFontSize : void 0;
};
var colorRegex = /(\d*\.\d+|\d+)[\0\t\n\f\r\ ]*(\d*\.\d+|\d+)?[\0\t\n\f\r\ ]*(\d*\.\d+|\d+)?[\0\t\n\f\r\ ]*(\d*\.\d+|\d+)?[\0\t\n\f\r\ ]+(g|rg|k)/;
var getDefaultColor = function(field) {
	var _a;
	var daMatch = findLastMatch((_a = field.getDefaultAppearance()) !== null && _a !== void 0 ? _a : "", colorRegex).match;
	var _b = daMatch !== null && daMatch !== void 0 ? daMatch : [], c1 = _b[1], c2 = _b[2], c3 = _b[3], c4 = _b[4], colorSpace = _b[5];
	if (colorSpace === "g" && c1) return grayscale(Number(c1));
	if (colorSpace === "rg" && c1 && c2 && c3) return rgb(Number(c1), Number(c2), Number(c3));
	if (colorSpace === "k" && c1 && c2 && c3 && c4) return cmyk(Number(c1), Number(c2), Number(c3), Number(c4));
};
var updateDefaultAppearance = function(field, color, font, fontSize) {
	var _a;
	if (fontSize === void 0) fontSize = 0;
	var da = [setFillingColor(color).toString(), setFontAndSize((_a = font === null || font === void 0 ? void 0 : font.name) !== null && _a !== void 0 ? _a : "dummy__noop", fontSize).toString()].join("\n");
	field.setDefaultAppearance(da);
};
var defaultCheckBoxAppearanceProvider = function(checkBox, widget) {
	var _a, _b, _c;
	var widgetColor = getDefaultColor(widget);
	var fieldColor = getDefaultColor(checkBox.acroField);
	var rectangle = widget.getRectangle();
	var ap = widget.getAppearanceCharacteristics();
	var bs = widget.getBorderStyle();
	var borderWidth = (_a = bs === null || bs === void 0 ? void 0 : bs.getWidth()) !== null && _a !== void 0 ? _a : 0;
	var rotation = reduceRotation(ap === null || ap === void 0 ? void 0 : ap.getRotation());
	var _d = adjustDimsForRotation(rectangle, rotation), width = _d.width, height = _d.height;
	var rotate = rotateInPlace(__assign(__assign({}, rectangle), { rotation }));
	var black = rgb(0, 0, 0);
	var borderColor = (_b = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBorderColor())) !== null && _b !== void 0 ? _b : black;
	var normalBackgroundColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBackgroundColor());
	var downBackgroundColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBackgroundColor(), .8);
	var textColor = (_c = widgetColor !== null && widgetColor !== void 0 ? widgetColor : fieldColor) !== null && _c !== void 0 ? _c : black;
	if (widgetColor) updateDefaultAppearance(widget, textColor);
	else updateDefaultAppearance(checkBox.acroField, textColor);
	var options = {
		x: 0 + borderWidth / 2,
		y: 0 + borderWidth / 2,
		width: width - borderWidth,
		height: height - borderWidth,
		thickness: 1.5,
		borderWidth,
		borderColor,
		markColor: textColor
	};
	return {
		normal: {
			on: __spreadArrays(rotate, drawCheckBox(__assign(__assign({}, options), {
				color: normalBackgroundColor,
				filled: true
			}))),
			off: __spreadArrays(rotate, drawCheckBox(__assign(__assign({}, options), {
				color: normalBackgroundColor,
				filled: false
			})))
		},
		down: {
			on: __spreadArrays(rotate, drawCheckBox(__assign(__assign({}, options), {
				color: downBackgroundColor,
				filled: true
			}))),
			off: __spreadArrays(rotate, drawCheckBox(__assign(__assign({}, options), {
				color: downBackgroundColor,
				filled: false
			})))
		}
	};
};
var defaultRadioGroupAppearanceProvider = function(radioGroup, widget) {
	var _a, _b, _c;
	var widgetColor = getDefaultColor(widget);
	var fieldColor = getDefaultColor(radioGroup.acroField);
	var rectangle = widget.getRectangle();
	var ap = widget.getAppearanceCharacteristics();
	var bs = widget.getBorderStyle();
	var borderWidth = (_a = bs === null || bs === void 0 ? void 0 : bs.getWidth()) !== null && _a !== void 0 ? _a : 0;
	var rotation = reduceRotation(ap === null || ap === void 0 ? void 0 : ap.getRotation());
	var _d = adjustDimsForRotation(rectangle, rotation), width = _d.width, height = _d.height;
	var rotate = rotateInPlace(__assign(__assign({}, rectangle), { rotation }));
	var black = rgb(0, 0, 0);
	var borderColor = (_b = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBorderColor())) !== null && _b !== void 0 ? _b : black;
	var normalBackgroundColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBackgroundColor());
	var downBackgroundColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBackgroundColor(), .8);
	var textColor = (_c = widgetColor !== null && widgetColor !== void 0 ? widgetColor : fieldColor) !== null && _c !== void 0 ? _c : black;
	if (widgetColor) updateDefaultAppearance(widget, textColor);
	else updateDefaultAppearance(radioGroup.acroField, textColor);
	var options = {
		x: width / 2,
		y: height / 2,
		width: width - borderWidth,
		height: height - borderWidth,
		borderWidth,
		borderColor,
		dotColor: textColor
	};
	return {
		normal: {
			on: __spreadArrays(rotate, drawRadioButton(__assign(__assign({}, options), {
				color: normalBackgroundColor,
				filled: true
			}))),
			off: __spreadArrays(rotate, drawRadioButton(__assign(__assign({}, options), {
				color: normalBackgroundColor,
				filled: false
			})))
		},
		down: {
			on: __spreadArrays(rotate, drawRadioButton(__assign(__assign({}, options), {
				color: downBackgroundColor,
				filled: true
			}))),
			off: __spreadArrays(rotate, drawRadioButton(__assign(__assign({}, options), {
				color: downBackgroundColor,
				filled: false
			})))
		}
	};
};
var defaultButtonAppearanceProvider = function(button, widget, font) {
	var _a, _b, _c, _d, _e;
	var widgetColor = getDefaultColor(widget);
	var fieldColor = getDefaultColor(button.acroField);
	var widgetFontSize = getDefaultFontSize(widget);
	var fieldFontSize = getDefaultFontSize(button.acroField);
	var rectangle = widget.getRectangle();
	var ap = widget.getAppearanceCharacteristics();
	var bs = widget.getBorderStyle();
	var captions = ap === null || ap === void 0 ? void 0 : ap.getCaptions();
	var normalText = (_a = captions === null || captions === void 0 ? void 0 : captions.normal) !== null && _a !== void 0 ? _a : "";
	var downText = (_c = (_b = captions === null || captions === void 0 ? void 0 : captions.down) !== null && _b !== void 0 ? _b : normalText) !== null && _c !== void 0 ? _c : "";
	var borderWidth = (_d = bs === null || bs === void 0 ? void 0 : bs.getWidth()) !== null && _d !== void 0 ? _d : 0;
	var rotation = reduceRotation(ap === null || ap === void 0 ? void 0 : ap.getRotation());
	var _f = adjustDimsForRotation(rectangle, rotation), width = _f.width, height = _f.height;
	var rotate = rotateInPlace(__assign(__assign({}, rectangle), { rotation }));
	var black = rgb(0, 0, 0);
	var borderColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBorderColor());
	var normalBackgroundColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBackgroundColor());
	var downBackgroundColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBackgroundColor(), .8);
	var bounds = {
		x: borderWidth,
		y: borderWidth,
		width: width - borderWidth * 2,
		height: height - borderWidth * 2
	};
	var normalLayout = layoutSinglelineText(normalText, {
		alignment: TextAlignment.Center,
		fontSize: widgetFontSize !== null && widgetFontSize !== void 0 ? widgetFontSize : fieldFontSize,
		font,
		bounds
	});
	var downLayout = layoutSinglelineText(downText, {
		alignment: TextAlignment.Center,
		fontSize: widgetFontSize !== null && widgetFontSize !== void 0 ? widgetFontSize : fieldFontSize,
		font,
		bounds
	});
	var fontSize = Math.min(normalLayout.fontSize, downLayout.fontSize);
	var textColor = (_e = widgetColor !== null && widgetColor !== void 0 ? widgetColor : fieldColor) !== null && _e !== void 0 ? _e : black;
	if (widgetColor || widgetFontSize !== void 0) updateDefaultAppearance(widget, textColor, font, fontSize);
	else updateDefaultAppearance(button.acroField, textColor, font, fontSize);
	var options = {
		x: 0 + borderWidth / 2,
		y: 0 + borderWidth / 2,
		width: width - borderWidth,
		height: height - borderWidth,
		borderWidth,
		borderColor,
		textColor,
		font: font.name,
		fontSize
	};
	return {
		normal: __spreadArrays(rotate, drawButton(__assign(__assign({}, options), {
			color: normalBackgroundColor,
			textLines: [normalLayout.line]
		}))),
		down: __spreadArrays(rotate, drawButton(__assign(__assign({}, options), {
			color: downBackgroundColor,
			textLines: [downLayout.line]
		})))
	};
};
var defaultTextFieldAppearanceProvider = function(textField, widget, font) {
	var _a, _b, _c, _d;
	var widgetColor = getDefaultColor(widget);
	var fieldColor = getDefaultColor(textField.acroField);
	var widgetFontSize = getDefaultFontSize(widget);
	var fieldFontSize = getDefaultFontSize(textField.acroField);
	var rectangle = widget.getRectangle();
	var ap = widget.getAppearanceCharacteristics();
	var bs = widget.getBorderStyle();
	var text = (_a = textField.getText()) !== null && _a !== void 0 ? _a : "";
	var borderWidth = (_b = bs === null || bs === void 0 ? void 0 : bs.getWidth()) !== null && _b !== void 0 ? _b : 0;
	var rotation = reduceRotation(ap === null || ap === void 0 ? void 0 : ap.getRotation());
	var _e = adjustDimsForRotation(rectangle, rotation), width = _e.width, height = _e.height;
	var rotate = rotateInPlace(__assign(__assign({}, rectangle), { rotation }));
	var black = rgb(0, 0, 0);
	var borderColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBorderColor());
	var normalBackgroundColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBackgroundColor());
	var textLines;
	var fontSize;
	var padding = textField.isCombed() ? 0 : 1;
	var bounds = {
		x: borderWidth + padding,
		y: borderWidth + padding,
		width: width - (borderWidth + padding) * 2,
		height: height - (borderWidth + padding) * 2
	};
	if (textField.isMultiline()) {
		var layout = layoutMultilineText(text, {
			alignment: textField.getAlignment(),
			fontSize: widgetFontSize !== null && widgetFontSize !== void 0 ? widgetFontSize : fieldFontSize,
			font,
			bounds
		});
		textLines = layout.lines;
		fontSize = layout.fontSize;
	} else if (textField.isCombed()) {
		var layout = layoutCombedText(text, {
			fontSize: widgetFontSize !== null && widgetFontSize !== void 0 ? widgetFontSize : fieldFontSize,
			font,
			bounds,
			cellCount: (_c = textField.getMaxLength()) !== null && _c !== void 0 ? _c : 0
		});
		textLines = layout.cells;
		fontSize = layout.fontSize;
	} else {
		var layout = layoutSinglelineText(text, {
			alignment: textField.getAlignment(),
			fontSize: widgetFontSize !== null && widgetFontSize !== void 0 ? widgetFontSize : fieldFontSize,
			font,
			bounds
		});
		textLines = [layout.line];
		fontSize = layout.fontSize;
	}
	var textColor = (_d = widgetColor !== null && widgetColor !== void 0 ? widgetColor : fieldColor) !== null && _d !== void 0 ? _d : black;
	if (widgetColor || widgetFontSize !== void 0) updateDefaultAppearance(widget, textColor, font, fontSize);
	else updateDefaultAppearance(textField.acroField, textColor, font, fontSize);
	return __spreadArrays(rotate, drawTextField({
		x: 0 + borderWidth / 2,
		y: 0 + borderWidth / 2,
		width: width - borderWidth,
		height: height - borderWidth,
		borderWidth: borderWidth !== null && borderWidth !== void 0 ? borderWidth : 0,
		borderColor,
		textColor,
		font: font.name,
		fontSize,
		color: normalBackgroundColor,
		textLines,
		padding
	}));
};
var defaultDropdownAppearanceProvider = function(dropdown, widget, font) {
	var _a, _b, _c;
	var widgetColor = getDefaultColor(widget);
	var fieldColor = getDefaultColor(dropdown.acroField);
	var widgetFontSize = getDefaultFontSize(widget);
	var fieldFontSize = getDefaultFontSize(dropdown.acroField);
	var rectangle = widget.getRectangle();
	var ap = widget.getAppearanceCharacteristics();
	var bs = widget.getBorderStyle();
	var text = (_a = dropdown.getSelected()[0]) !== null && _a !== void 0 ? _a : "";
	var borderWidth = (_b = bs === null || bs === void 0 ? void 0 : bs.getWidth()) !== null && _b !== void 0 ? _b : 0;
	var rotation = reduceRotation(ap === null || ap === void 0 ? void 0 : ap.getRotation());
	var _d = adjustDimsForRotation(rectangle, rotation), width = _d.width, height = _d.height;
	var rotate = rotateInPlace(__assign(__assign({}, rectangle), { rotation }));
	var black = rgb(0, 0, 0);
	var borderColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBorderColor());
	var normalBackgroundColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBackgroundColor());
	var padding = 1;
	var bounds = {
		x: borderWidth + padding,
		y: borderWidth + padding,
		width: width - (borderWidth + padding) * 2,
		height: height - (borderWidth + padding) * 2
	};
	var _e = layoutSinglelineText(text, {
		alignment: TextAlignment.Left,
		fontSize: widgetFontSize !== null && widgetFontSize !== void 0 ? widgetFontSize : fieldFontSize,
		font,
		bounds
	}), line = _e.line, fontSize = _e.fontSize;
	var textColor = (_c = widgetColor !== null && widgetColor !== void 0 ? widgetColor : fieldColor) !== null && _c !== void 0 ? _c : black;
	if (widgetColor || widgetFontSize !== void 0) updateDefaultAppearance(widget, textColor, font, fontSize);
	else updateDefaultAppearance(dropdown.acroField, textColor, font, fontSize);
	return __spreadArrays(rotate, drawTextField({
		x: 0 + borderWidth / 2,
		y: 0 + borderWidth / 2,
		width: width - borderWidth,
		height: height - borderWidth,
		borderWidth: borderWidth !== null && borderWidth !== void 0 ? borderWidth : 0,
		borderColor,
		textColor,
		font: font.name,
		fontSize,
		color: normalBackgroundColor,
		textLines: [line],
		padding
	}));
};
var defaultOptionListAppearanceProvider = function(optionList, widget, font) {
	var _a, _b;
	var widgetColor = getDefaultColor(widget);
	var fieldColor = getDefaultColor(optionList.acroField);
	var widgetFontSize = getDefaultFontSize(widget);
	var fieldFontSize = getDefaultFontSize(optionList.acroField);
	var rectangle = widget.getRectangle();
	var ap = widget.getAppearanceCharacteristics();
	var bs = widget.getBorderStyle();
	var borderWidth = (_a = bs === null || bs === void 0 ? void 0 : bs.getWidth()) !== null && _a !== void 0 ? _a : 0;
	var rotation = reduceRotation(ap === null || ap === void 0 ? void 0 : ap.getRotation());
	var _c = adjustDimsForRotation(rectangle, rotation), width = _c.width, height = _c.height;
	var rotate = rotateInPlace(__assign(__assign({}, rectangle), { rotation }));
	var black = rgb(0, 0, 0);
	var borderColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBorderColor());
	var normalBackgroundColor = componentsToColor(ap === null || ap === void 0 ? void 0 : ap.getBackgroundColor());
	var options = optionList.getOptions();
	var selected = optionList.getSelected();
	if (optionList.isSorted()) options.sort();
	var text = "";
	for (var idx = 0, len = options.length; idx < len; idx++) {
		text += options[idx];
		if (idx < len - 1) text += "\n";
	}
	var padding = 1;
	var bounds = {
		x: borderWidth + padding,
		y: borderWidth + padding,
		width: width - (borderWidth + padding) * 2,
		height: height - (borderWidth + padding) * 2
	};
	var _d = layoutMultilineText(text, {
		alignment: TextAlignment.Left,
		fontSize: widgetFontSize !== null && widgetFontSize !== void 0 ? widgetFontSize : fieldFontSize,
		font,
		bounds
	}), lines = _d.lines, fontSize = _d.fontSize, lineHeight = _d.lineHeight;
	var selectedLines = [];
	for (var idx = 0, len = lines.length; idx < len; idx++) {
		var line = lines[idx];
		if (selected.includes(line.text)) selectedLines.push(idx);
	}
	var blue = rgb(153 / 255, 193 / 255, 218 / 255);
	var textColor = (_b = widgetColor !== null && widgetColor !== void 0 ? widgetColor : fieldColor) !== null && _b !== void 0 ? _b : black;
	if (widgetColor || widgetFontSize !== void 0) updateDefaultAppearance(widget, textColor, font, fontSize);
	else updateDefaultAppearance(optionList.acroField, textColor, font, fontSize);
	return __spreadArrays(rotate, drawOptionList({
		x: 0 + borderWidth / 2,
		y: 0 + borderWidth / 2,
		width: width - borderWidth,
		height: height - borderWidth,
		borderWidth: borderWidth !== null && borderWidth !== void 0 ? borderWidth : 0,
		borderColor,
		textColor,
		font: font.name,
		fontSize,
		color: normalBackgroundColor,
		textLines: lines,
		lineHeight,
		selectedColor: blue,
		selectedLines,
		padding
	}));
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/PDFEmbeddedPage.js
/**
* Represents a PDF page that has been embedded in a [[PDFDocument]].
*/
var PDFEmbeddedPage = function() {
	function PDFEmbeddedPage(ref, doc, embedder) {
		this.alreadyEmbedded = false;
		assertIs(ref, "ref", [[PDFRef, "PDFRef"]]);
		assertIs(doc, "doc", [[PDFDocument, "PDFDocument"]]);
		assertIs(embedder, "embedder", [[PDFPageEmbedder, "PDFPageEmbedder"]]);
		this.ref = ref;
		this.doc = doc;
		this.width = embedder.width;
		this.height = embedder.height;
		this.embedder = embedder;
	}
	/**
	* Compute the width and height of this page after being scaled by the
	* given `factor`. For example:
	* ```js
	* embeddedPage.width  // => 500
	* embeddedPage.height // => 250
	*
	* const scaled = embeddedPage.scale(0.5)
	* scaled.width  // => 250
	* scaled.height // => 125
	* ```
	* This operation is often useful before drawing a page with
	* [[PDFPage.drawPage]] to compute the `width` and `height` options.
	* @param factor The factor by which this page should be scaled.
	* @returns The width and height of the page after being scaled.
	*/
	PDFEmbeddedPage.prototype.scale = function(factor) {
		assertIs(factor, "factor", ["number"]);
		return {
			width: this.width * factor,
			height: this.height * factor
		};
	};
	/**
	* Get the width and height of this page. For example:
	* ```js
	* const { width, height } = embeddedPage.size()
	* ```
	* @returns The width and height of the page.
	*/
	PDFEmbeddedPage.prototype.size = function() {
		return this.scale(1);
	};
	/**
	* > **NOTE:** You probably don't need to call this method directly. The
	* > [[PDFDocument.save]] and [[PDFDocument.saveAsBase64]] methods will
	* > automatically ensure all embeddable pages get embedded.
	*
	* Embed this embeddable page in its document.
	*
	* @returns Resolves when the embedding is complete.
	*/
	PDFEmbeddedPage.prototype.embed = function() {
		return __awaiter(this, void 0, void 0, function() {
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!!this.alreadyEmbedded) return [3, 2];
						return [4, this.embedder.embedIntoContext(this.doc.context, this.ref)];
					case 1:
						_a.sent();
						this.alreadyEmbedded = true;
						_a.label = 2;
					case 2: return [2];
				}
			});
		});
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFDocument.embedPdf]] and
	* > [[PDFDocument.embedPage]] methods, which will create instances of
	* > [[PDFEmbeddedPage]] for you.
	*
	* Create an instance of [[PDFEmbeddedPage]] from an existing ref and embedder
	*
	* @param ref The unique reference for this embedded page.
	* @param doc The document to which the embedded page will belong.
	* @param embedder The embedder that will be used to embed the page.
	*/
	PDFEmbeddedPage.of = function(ref, doc, embedder) {
		return new PDFEmbeddedPage(ref, doc, embedder);
	};
	return PDFEmbeddedPage;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/PDFFont.js
/**
* Represents a font that has been embedded in a [[PDFDocument]].
*/
var PDFFont = function() {
	function PDFFont(ref, doc, embedder) {
		this.modified = true;
		assertIs(ref, "ref", [[PDFRef, "PDFRef"]]);
		assertIs(doc, "doc", [[PDFDocument, "PDFDocument"]]);
		assertIs(embedder, "embedder", [[CustomFontEmbedder, "CustomFontEmbedder"], [StandardFontEmbedder, "StandardFontEmbedder"]]);
		this.ref = ref;
		this.doc = doc;
		this.name = embedder.fontName;
		this.embedder = embedder;
	}
	/**
	* > **NOTE:** You probably don't need to call this method directly. The
	* > [[PDFPage.drawText]] method will automatically encode the text it is
	* > given.
	*
	* Encodes a string of text in this font.
	*
	* @param text The text to be encoded.
	* @returns The encoded text as a hex string.
	*/
	PDFFont.prototype.encodeText = function(text) {
		assertIs(text, "text", ["string"]);
		this.modified = true;
		return this.embedder.encodeText(text);
	};
	/**
	* Measure the width of a string of text drawn in this font at a given size.
	* For example:
	* ```js
	* const width = font.widthOfTextAtSize('Foo Bar Qux Baz', 36)
	* ```
	* @param text The string of text to be measured.
	* @param size The font size to be used for this measurement.
	* @returns The width of the string of text when drawn in this font at the
	*          given size.
	*/
	PDFFont.prototype.widthOfTextAtSize = function(text, size) {
		assertIs(text, "text", ["string"]);
		assertIs(size, "size", ["number"]);
		return this.embedder.widthOfTextAtSize(text, size);
	};
	/**
	* Measure the height of this font at a given size. For example:
	* ```js
	* const height = font.heightAtSize(24)
	* ```
	*
	* The `options.descender` value controls whether or not the font's
	* descender is included in the height calculation.
	*
	* @param size The font size to be used for this measurement.
	* @param options The options to be used when computing this measurement.
	* @returns The height of this font at the given size.
	*/
	PDFFont.prototype.heightAtSize = function(size, options) {
		var _a;
		assertIs(size, "size", ["number"]);
		assertOrUndefined(options === null || options === void 0 ? void 0 : options.descender, "options.descender", ["boolean"]);
		return this.embedder.heightOfFontAtSize(size, { descender: (_a = options === null || options === void 0 ? void 0 : options.descender) !== null && _a !== void 0 ? _a : true });
	};
	/**
	* Compute the font size at which this font is a given height. For example:
	* ```js
	* const fontSize = font.sizeAtHeight(12)
	* ```
	* @param height The height to be used for this calculation.
	* @returns The font size at which this font is the given height.
	*/
	PDFFont.prototype.sizeAtHeight = function(height) {
		assertIs(height, "height", ["number"]);
		return this.embedder.sizeOfFontAtHeight(height);
	};
	/**
	* Get the set of unicode code points that can be represented by this font.
	* @returns The set of unicode code points supported by this font.
	*/
	PDFFont.prototype.getCharacterSet = function() {
		if (this.embedder instanceof StandardFontEmbedder) return this.embedder.encoding.supportedCodePoints;
		else return this.embedder.font.characterSet;
	};
	/**
	* > **NOTE:** You probably don't need to call this method directly. The
	* > [[PDFDocument.save]] and [[PDFDocument.saveAsBase64]] methods will
	* > automatically ensure all fonts get embedded.
	*
	* Embed this font in its document.
	*
	* @returns Resolves when the embedding is complete.
	*/
	PDFFont.prototype.embed = function() {
		return __awaiter(this, void 0, void 0, function() {
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!this.modified) return [3, 2];
						return [4, this.embedder.embedIntoContext(this.doc.context, this.ref)];
					case 1:
						_a.sent();
						this.modified = false;
						_a.label = 2;
					case 2: return [2];
				}
			});
		});
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFDocument.embedFont]] and
	* > [[PDFDocument.embedStandardFont]] methods, which will create instances
	* > of [[PDFFont]] for you.
	*
	* Create an instance of [[PDFFont]] from an existing ref and embedder
	*
	* @param ref The unique reference for this font.
	* @param doc The document to which the font will belong.
	* @param embedder The embedder that will be used to embed the font.
	*/
	PDFFont.of = function(ref, doc, embedder) {
		return new PDFFont(ref, doc, embedder);
	};
	return PDFFont;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/PDFImage.js
/**
* Represents an image that has been embedded in a [[PDFDocument]].
*/
var PDFImage = function() {
	function PDFImage(ref, doc, embedder) {
		assertIs(ref, "ref", [[PDFRef, "PDFRef"]]);
		assertIs(doc, "doc", [[PDFDocument, "PDFDocument"]]);
		assertIs(embedder, "embedder", [[JpegEmbedder, "JpegEmbedder"], [PngEmbedder, "PngEmbedder"]]);
		this.ref = ref;
		this.doc = doc;
		this.width = embedder.width;
		this.height = embedder.height;
		this.embedder = embedder;
	}
	/**
	* Compute the width and height of this image after being scaled by the
	* given `factor`. For example:
	* ```js
	* image.width  // => 500
	* image.height // => 250
	*
	* const scaled = image.scale(0.5)
	* scaled.width  // => 250
	* scaled.height // => 125
	* ```
	* This operation is often useful before drawing an image with
	* [[PDFPage.drawImage]] to compute the `width` and `height` options.
	* @param factor The factor by which this image should be scaled.
	* @returns The width and height of the image after being scaled.
	*/
	PDFImage.prototype.scale = function(factor) {
		assertIs(factor, "factor", ["number"]);
		return {
			width: this.width * factor,
			height: this.height * factor
		};
	};
	/**
	* Get the width and height of this image after scaling it as large as
	* possible while maintaining its aspect ratio and not exceeding the
	* specified `width` and `height`. For example:
	* ```
	* image.width  // => 500
	* image.height // => 250
	*
	* const scaled = image.scaleToFit(750, 1000)
	* scaled.width  // => 750
	* scaled.height // => 375
	* ```
	* The `width` and `height` parameters can also be thought of as the width
	* and height of a box that the scaled image must fit within.
	* @param width The bounding box's width.
	* @param height The bounding box's height.
	* @returns The width and height of the image after being scaled.
	*/
	PDFImage.prototype.scaleToFit = function(width, height) {
		assertIs(width, "width", ["number"]);
		assertIs(height, "height", ["number"]);
		var imgWidthScale = width / this.width;
		var imgHeightScale = height / this.height;
		var scale = Math.min(imgWidthScale, imgHeightScale);
		return this.scale(scale);
	};
	/**
	* Get the width and height of this image. For example:
	* ```js
	* const { width, height } = image.size()
	* ```
	* @returns The width and height of the image.
	*/
	PDFImage.prototype.size = function() {
		return this.scale(1);
	};
	/**
	* > **NOTE:** You probably don't need to call this method directly. The
	* > [[PDFDocument.save]] and [[PDFDocument.saveAsBase64]] methods will
	* > automatically ensure all images get embedded.
	*
	* Embed this image in its document.
	*
	* @returns Resolves when the embedding is complete.
	*/
	PDFImage.prototype.embed = function() {
		return __awaiter(this, void 0, void 0, function() {
			var _a, doc, ref;
			return __generator(this, function(_b) {
				switch (_b.label) {
					case 0:
						if (!this.embedder) return [2];
						if (!this.embedTask) {
							_a = this, doc = _a.doc, ref = _a.ref;
							this.embedTask = this.embedder.embedIntoContext(doc.context, ref);
						}
						return [4, this.embedTask];
					case 1:
						_b.sent();
						this.embedder = void 0;
						return [2];
				}
			});
		});
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFDocument.embedPng]] and [[PDFDocument.embedJpg]]
	* > methods, which will create instances of [[PDFImage]] for you.
	*
	* Create an instance of [[PDFImage]] from an existing ref and embedder
	*
	* @param ref The unique reference for this image.
	* @param doc The document to which the image will belong.
	* @param embedder The embedder that will be used to embed the image.
	*/
	PDFImage.of = function(ref, doc, embedder) {
		return new PDFImage(ref, doc, embedder);
	};
	return PDFImage;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/image/alignment.js
var ImageAlignment;
(function(ImageAlignment) {
	ImageAlignment[ImageAlignment["Left"] = 0] = "Left";
	ImageAlignment[ImageAlignment["Center"] = 1] = "Center";
	ImageAlignment[ImageAlignment["Right"] = 2] = "Right";
})(ImageAlignment || (ImageAlignment = {}));
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/PDFField.js
var assertFieldAppearanceOptions = function(options) {
	assertOrUndefined(options === null || options === void 0 ? void 0 : options.x, "options.x", ["number"]);
	assertOrUndefined(options === null || options === void 0 ? void 0 : options.y, "options.y", ["number"]);
	assertOrUndefined(options === null || options === void 0 ? void 0 : options.width, "options.width", ["number"]);
	assertOrUndefined(options === null || options === void 0 ? void 0 : options.height, "options.height", ["number"]);
	assertOrUndefined(options === null || options === void 0 ? void 0 : options.textColor, "options.textColor", [[Object, "Color"]]);
	assertOrUndefined(options === null || options === void 0 ? void 0 : options.backgroundColor, "options.backgroundColor", [[Object, "Color"]]);
	assertOrUndefined(options === null || options === void 0 ? void 0 : options.borderColor, "options.borderColor", [[Object, "Color"]]);
	assertOrUndefined(options === null || options === void 0 ? void 0 : options.borderWidth, "options.borderWidth", ["number"]);
	assertOrUndefined(options === null || options === void 0 ? void 0 : options.rotate, "options.rotate", [[Object, "Rotation"]]);
};
/**
* Represents a field of a [[PDFForm]].
*
* This class is effectively abstract. All fields in a [[PDFForm]] will
* actually be an instance of a subclass of this class.
*
* Note that each field in a PDF is represented by a single field object.
* However, a given field object may be rendered at multiple locations within
* the document (across one or more pages). The rendering of a field is
* controlled by its widgets. Each widget causes its field to be displayed at a
* particular location in the document.
*
* Most of the time each field in a PDF has only a single widget, and thus is
* only rendered once. However, if a field is rendered multiple times, it will
* have multiple widgets - one for each location it is rendered.
*
* This abstraction of field objects and widgets is defined in the PDF
* specification and dictates how PDF files store fields and where they are
* to be rendered.
*/
var PDFField = function() {
	function PDFField(acroField, ref, doc) {
		assertIs(acroField, "acroField", [[PDFAcroTerminal, "PDFAcroTerminal"]]);
		assertIs(ref, "ref", [[PDFRef, "PDFRef"]]);
		assertIs(doc, "doc", [[PDFDocument, "PDFDocument"]]);
		this.acroField = acroField;
		this.ref = ref;
		this.doc = doc;
	}
	/**
	* Get the fully qualified name of this field. For example:
	* ```js
	* const fields = form.getFields()
	* fields.forEach(field => {
	*   const name = field.getName()
	*   console.log('Field name:', name)
	* })
	* ```
	* Note that PDF fields are structured as a tree. Each field is the
	* descendent of a series of ancestor nodes all the way up to the form node,
	* which is always the root of the tree. Each node in the tree (except for
	* the form node) has a partial name. Partial names can be composed of any
	* unicode characters except a period (`.`). The fully qualified name of a
	* field is composed of the partial names of all its ancestors joined
	* with periods. This means that splitting the fully qualified name on
	* periods and taking the last element of the resulting array will give you
	* the partial name of a specific field.
	* @returns The fully qualified name of this field.
	*/
	PDFField.prototype.getName = function() {
		var _a;
		return (_a = this.acroField.getFullyQualifiedName()) !== null && _a !== void 0 ? _a : "";
	};
	/**
	* Returns `true` if this field is read only. This means that PDF readers
	* will not allow users to interact with the field or change its value. See
	* [[PDFField.enableReadOnly]] and [[PDFField.disableReadOnly]].
	* For example:
	* ```js
	* const field = form.getField('some.field')
	* if (field.isReadOnly()) console.log('Read only is enabled')
	* ```
	* @returns Whether or not this is a read only field.
	*/
	PDFField.prototype.isReadOnly = function() {
		return this.acroField.hasFlag(AcroFieldFlags.ReadOnly);
	};
	/**
	* Prevent PDF readers from allowing users to interact with this field or
	* change its value. The field will not respond to mouse or keyboard input.
	* For example:
	* ```js
	* const field = form.getField('some.field')
	* field.enableReadOnly()
	* ```
	* Useful for fields whose values are computed, imported from a database, or
	* prefilled by software before being displayed to the user.
	*/
	PDFField.prototype.enableReadOnly = function() {
		this.acroField.setFlagTo(AcroFieldFlags.ReadOnly, true);
	};
	/**
	* Allow users to interact with this field and change its value in PDF
	* readers via mouse and keyboard input. For example:
	* ```js
	* const field = form.getField('some.field')
	* field.disableReadOnly()
	* ```
	*/
	PDFField.prototype.disableReadOnly = function() {
		this.acroField.setFlagTo(AcroFieldFlags.ReadOnly, false);
	};
	/**
	* Returns `true` if this field must have a value when the form is submitted.
	* See [[PDFField.enableRequired]] and [[PDFField.disableRequired]].
	* For example:
	* ```js
	* const field = form.getField('some.field')
	* if (field.isRequired()) console.log('Field is required')
	* ```
	* @returns Whether or not this field is required.
	*/
	PDFField.prototype.isRequired = function() {
		return this.acroField.hasFlag(AcroFieldFlags.Required);
	};
	/**
	* Require this field to have a value when the form is submitted.
	* For example:
	* ```js
	* const field = form.getField('some.field')
	* field.enableRequired()
	* ```
	*/
	PDFField.prototype.enableRequired = function() {
		this.acroField.setFlagTo(AcroFieldFlags.Required, true);
	};
	/**
	* Do not require this field to have a value when the form is submitted.
	* For example:
	* ```js
	* const field = form.getField('some.field')
	* field.disableRequired()
	* ```
	*/
	PDFField.prototype.disableRequired = function() {
		this.acroField.setFlagTo(AcroFieldFlags.Required, false);
	};
	/**
	* Returns `true` if this field's value should be exported when the form is
	* submitted. See [[PDFField.enableExporting]] and
	* [[PDFField.disableExporting]].
	* For example:
	* ```js
	* const field = form.getField('some.field')
	* if (field.isExported()) console.log('Exporting is enabled')
	* ```
	* @returns Whether or not this field's value should be exported.
	*/
	PDFField.prototype.isExported = function() {
		return !this.acroField.hasFlag(AcroFieldFlags.NoExport);
	};
	/**
	* Indicate that this field's value should be exported when the form is
	* submitted in a PDF reader. For example:
	* ```js
	* const field = form.getField('some.field')
	* field.enableExporting()
	* ```
	*/
	PDFField.prototype.enableExporting = function() {
		this.acroField.setFlagTo(AcroFieldFlags.NoExport, false);
	};
	/**
	* Indicate that this field's value should **not** be exported when the form
	* is submitted in a PDF reader. For example:
	* ```js
	* const field = form.getField('some.field')
	* field.disableExporting()
	* ```
	*/
	PDFField.prototype.disableExporting = function() {
		this.acroField.setFlagTo(AcroFieldFlags.NoExport, true);
	};
	/** @ignore */
	PDFField.prototype.needsAppearancesUpdate = function() {
		throw new MethodNotImplementedError(this.constructor.name, "needsAppearancesUpdate");
	};
	/** @ignore */
	PDFField.prototype.defaultUpdateAppearances = function(_font) {
		throw new MethodNotImplementedError(this.constructor.name, "defaultUpdateAppearances");
	};
	PDFField.prototype.markAsDirty = function() {
		this.doc.getForm().markFieldAsDirty(this.ref);
	};
	PDFField.prototype.markAsClean = function() {
		this.doc.getForm().markFieldAsClean(this.ref);
	};
	PDFField.prototype.isDirty = function() {
		return this.doc.getForm().fieldIsDirty(this.ref);
	};
	PDFField.prototype.createWidget = function(options) {
		var _a;
		var textColor = options.textColor;
		var backgroundColor = options.backgroundColor;
		var borderColor = options.borderColor;
		var borderWidth = options.borderWidth;
		var degreesAngle = toDegrees(options.rotate);
		var caption = options.caption;
		var x = options.x;
		var y = options.y;
		var width = options.width + borderWidth;
		var height = options.height + borderWidth;
		var hidden = Boolean(options.hidden);
		var pageRef = options.page;
		assertMultiple(degreesAngle, "degreesAngle", 90);
		var widget = PDFWidgetAnnotation.create(this.doc.context, this.ref);
		var rect = rotateRectangle({
			x,
			y,
			width,
			height
		}, borderWidth, degreesAngle);
		widget.setRectangle(rect);
		if (pageRef) widget.setP(pageRef);
		var ac = widget.getOrCreateAppearanceCharacteristics();
		if (backgroundColor) ac.setBackgroundColor(colorToComponents(backgroundColor));
		ac.setRotation(degreesAngle);
		if (caption) ac.setCaptions({ normal: caption });
		if (borderColor) ac.setBorderColor(colorToComponents(borderColor));
		var bs = widget.getOrCreateBorderStyle();
		if (borderWidth !== void 0) bs.setWidth(borderWidth);
		widget.setFlagTo(AnnotationFlags.Print, true);
		widget.setFlagTo(AnnotationFlags.Hidden, hidden);
		widget.setFlagTo(AnnotationFlags.Invisible, false);
		if (textColor) {
			var newDa = ((_a = this.acroField.getDefaultAppearance()) !== null && _a !== void 0 ? _a : "") + "\n" + setFillingColor(textColor).toString();
			this.acroField.setDefaultAppearance(newDa);
		}
		return widget;
	};
	PDFField.prototype.updateWidgetAppearanceWithFont = function(widget, font, _a) {
		var normal = _a.normal, rollover = _a.rollover, down = _a.down;
		this.updateWidgetAppearances(widget, {
			normal: this.createAppearanceStream(widget, normal, font),
			rollover: rollover && this.createAppearanceStream(widget, rollover, font),
			down: down && this.createAppearanceStream(widget, down, font)
		});
	};
	PDFField.prototype.updateOnOffWidgetAppearance = function(widget, onValue, _a) {
		var normal = _a.normal, rollover = _a.rollover, down = _a.down;
		this.updateWidgetAppearances(widget, {
			normal: this.createAppearanceDict(widget, normal, onValue),
			rollover: rollover && this.createAppearanceDict(widget, rollover, onValue),
			down: down && this.createAppearanceDict(widget, down, onValue)
		});
	};
	PDFField.prototype.updateWidgetAppearances = function(widget, _a) {
		var normal = _a.normal, rollover = _a.rollover, down = _a.down;
		widget.setNormalAppearance(normal);
		if (rollover) widget.setRolloverAppearance(rollover);
		else widget.removeRolloverAppearance();
		if (down) widget.setDownAppearance(down);
		else widget.removeDownAppearance();
	};
	PDFField.prototype.createAppearanceStream = function(widget, appearance, font) {
		var _a;
		var context = this.acroField.dict.context;
		var _b = widget.getRectangle(), width = _b.width, height = _b.height;
		var Resources = font && { Font: (_a = {}, _a[font.name] = font.ref, _a) };
		var stream = context.formXObject(appearance, {
			Resources,
			BBox: context.obj([
				0,
				0,
				width,
				height
			]),
			Matrix: context.obj([
				1,
				0,
				0,
				1,
				0,
				0
			])
		});
		return context.register(stream);
	};
	/**
	* Create a FormXObject of the supplied image and add it to context.
	* The FormXObject size is calculated based on the widget (including
	* the alignment).
	* @param widget The widget that should display the image.
	* @param alignment The alignment of the image.
	* @param image The image that should be displayed.
	* @returns The ref for the FormXObject that was added to the context.
	*/
	PDFField.prototype.createImageAppearanceStream = function(widget, image, alignment) {
		var _a;
		var _b;
		var context = this.acroField.dict.context;
		var rectangle = widget.getRectangle();
		var ap = widget.getAppearanceCharacteristics();
		var bs = widget.getBorderStyle();
		var borderWidth = (_b = bs === null || bs === void 0 ? void 0 : bs.getWidth()) !== null && _b !== void 0 ? _b : 0;
		var rotation = reduceRotation(ap === null || ap === void 0 ? void 0 : ap.getRotation());
		var rotate = rotateInPlace(__assign(__assign({}, rectangle), { rotation }));
		var adj = adjustDimsForRotation(rectangle, rotation);
		var imageDims = image.scaleToFit(adj.width - borderWidth * 2, adj.height - borderWidth * 2);
		var options = {
			x: borderWidth,
			y: borderWidth,
			width: imageDims.width,
			height: imageDims.height,
			rotate: degrees(0),
			xSkew: degrees(0),
			ySkew: degrees(0)
		};
		if (alignment === ImageAlignment.Center) {
			options.x += (adj.width - borderWidth * 2) / 2 - imageDims.width / 2;
			options.y += (adj.height - borderWidth * 2) / 2 - imageDims.height / 2;
		} else if (alignment === ImageAlignment.Right) {
			options.x = adj.width - borderWidth - imageDims.width;
			options.y = adj.height - borderWidth - imageDims.height;
		}
		var imageName = this.doc.context.addRandomSuffix("Image", 10);
		var appearance = __spreadArrays(rotate, drawImage(imageName, options));
		var Resources = { XObject: (_a = {}, _a[imageName] = image.ref, _a) };
		var stream = context.formXObject(appearance, {
			Resources,
			BBox: context.obj([
				0,
				0,
				rectangle.width,
				rectangle.height
			]),
			Matrix: context.obj([
				1,
				0,
				0,
				1,
				0,
				0
			])
		});
		return context.register(stream);
	};
	PDFField.prototype.createAppearanceDict = function(widget, appearance, onValue) {
		var context = this.acroField.dict.context;
		var onStreamRef = this.createAppearanceStream(widget, appearance.on);
		var offStreamRef = this.createAppearanceStream(widget, appearance.off);
		var appearanceDict = context.obj({});
		appearanceDict.set(onValue, onStreamRef);
		appearanceDict.set(PDFName.of("Off"), offStreamRef);
		return appearanceDict;
	};
	return PDFField;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/PDFCheckBox.js
/**
* Represents a check box field of a [[PDFForm]].
*
* [[PDFCheckBox]] fields are interactive boxes that users can click with their
* mouse. This type of [[PDFField]] has two states: `on` and `off`. The purpose
* of a check box is to enable users to select from one or more options, where
* each option is represented by a single check box. Check boxes are typically
* square in shape and display a check mark when they are in the `on` state.
*/
var PDFCheckBox = function(_super) {
	__extends(PDFCheckBox, _super);
	function PDFCheckBox(acroCheckBox, ref, doc) {
		var _this = _super.call(this, acroCheckBox, ref, doc) || this;
		assertIs(acroCheckBox, "acroCheckBox", [[PDFAcroCheckBox, "PDFAcroCheckBox"]]);
		_this.acroField = acroCheckBox;
		return _this;
	}
	/**
	* Mark this check box. This operation is analogous to a human user clicking
	* a check box to fill it in a PDF reader. This method will update the
	* underlying state of the check box field to indicate it has been selected.
	* PDF libraries and readers will be able to extract this value from the
	* saved document and determine that it was selected.
	*
	* For example:
	* ```js
	* const checkBox = form.getCheckBox('some.checkBox.field')
	* checkBox.check()
	* ```
	*
	* This method will mark this check box as dirty, causing its appearance
	* streams to be updated when either [[PDFDocument.save]] or
	* [[PDFForm.updateFieldAppearances]] is called. The updated appearance
	* streams will display a check mark inside the widgets of this check box
	* field.
	*/
	PDFCheckBox.prototype.check = function() {
		var _a;
		var onValue = (_a = this.acroField.getOnValue()) !== null && _a !== void 0 ? _a : PDFName.of("Yes");
		this.markAsDirty();
		this.acroField.setValue(onValue);
	};
	/**
	* Clears this check box. This operation is analogous to a human user clicking
	* a check box to unmark it in a PDF reader. This method will update the
	* underlying state of the check box field to indicate it has been deselected.
	* PDF libraries and readers will be able to extract this value from the
	* saved document and determine that it was not selected.
	*
	* For example:
	* ```js
	* const checkBox = form.getCheckBox('some.checkBox.field')
	* checkBox.uncheck()
	* ```
	*
	* This method will mark this check box as dirty. See [[PDFCheckBox.check]]
	* for more details about what this means.
	*/
	PDFCheckBox.prototype.uncheck = function() {
		this.markAsDirty();
		this.acroField.setValue(PDFName.of("Off"));
	};
	/**
	* Returns `true` if this check box is selected (either by a human user via
	* a PDF reader, or else programmatically via software). For example:
	* ```js
	* const checkBox = form.getCheckBox('some.checkBox.field')
	* if (checkBox.isChecked()) console.log('check box is selected')
	* ```
	* @returns Whether or not this check box is selected.
	*/
	PDFCheckBox.prototype.isChecked = function() {
		var onValue = this.acroField.getOnValue();
		return !!onValue && onValue === this.acroField.getValue();
	};
	/**
	* Show this check box on the specified page. For example:
	* ```js
	* const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const checkBox = form.createCheckBox('some.checkBox.field')
	*
	* checkBox.addToPage(page, {
	*   x: 50,
	*   y: 75,
	*   width: 25,
	*   height: 25,
	*   textColor: rgb(1, 0, 0),
	*   backgroundColor: rgb(0, 1, 0),
	*   borderColor: rgb(0, 0, 1),
	*   borderWidth: 2,
	*   rotate: degrees(90),
	* })
	* ```
	* This will create a new widget for this check box field.
	* @param page The page to which this check box widget should be added.
	* @param options The options to be used when adding this check box widget.
	*/
	PDFCheckBox.prototype.addToPage = function(page, options) {
		var _a, _b, _c, _d, _e, _f;
		assertIs(page, "page", [[PDFPage, "PDFPage"]]);
		assertFieldAppearanceOptions(options);
		if (!options) options = {};
		if (!("textColor" in options)) options.textColor = rgb(0, 0, 0);
		if (!("backgroundColor" in options)) options.backgroundColor = rgb(1, 1, 1);
		if (!("borderColor" in options)) options.borderColor = rgb(0, 0, 0);
		if (!("borderWidth" in options)) options.borderWidth = 1;
		var widget = this.createWidget({
			x: (_a = options.x) !== null && _a !== void 0 ? _a : 0,
			y: (_b = options.y) !== null && _b !== void 0 ? _b : 0,
			width: (_c = options.width) !== null && _c !== void 0 ? _c : 50,
			height: (_d = options.height) !== null && _d !== void 0 ? _d : 50,
			textColor: options.textColor,
			backgroundColor: options.backgroundColor,
			borderColor: options.borderColor,
			borderWidth: (_e = options.borderWidth) !== null && _e !== void 0 ? _e : 0,
			rotate: (_f = options.rotate) !== null && _f !== void 0 ? _f : degrees(0),
			hidden: options.hidden,
			page: page.ref
		});
		var widgetRef = this.doc.context.register(widget.dict);
		this.acroField.addWidget(widgetRef);
		widget.setAppearanceState(PDFName.of("Off"));
		this.updateWidgetAppearance(widget, PDFName.of("Yes"));
		page.node.addAnnot(widgetRef);
	};
	/**
	* Returns `true` if any of this check box's widgets do not have an
	* appearance stream for its current state. For example:
	* ```js
	* const checkBox = form.getCheckBox('some.checkBox.field')
	* if (checkBox.needsAppearancesUpdate()) console.log('Needs update')
	* ```
	* @returns Whether or not this check box needs an appearance update.
	*/
	PDFCheckBox.prototype.needsAppearancesUpdate = function() {
		var _a;
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			var state = widget.getAppearanceState();
			var normal = (_a = widget.getAppearances()) === null || _a === void 0 ? void 0 : _a.normal;
			if (!(normal instanceof PDFDict)) return true;
			if (state && !normal.has(state)) return true;
		}
		return false;
	};
	/**
	* Update the appearance streams for each of this check box's widgets using
	* the default appearance provider for check boxes. For example:
	* ```js
	* const checkBox = form.getCheckBox('some.checkBox.field')
	* checkBox.defaultUpdateAppearances()
	* ```
	*/
	PDFCheckBox.prototype.defaultUpdateAppearances = function() {
		this.updateAppearances();
	};
	/**
	* Update the appearance streams for each of this check box's widgets using
	* the given appearance provider. If no `provider` is passed, the default
	* appearance provider for check boxs will be used. For example:
	* ```js
	* const checkBox = form.getCheckBox('some.checkBox.field')
	* checkBox.updateAppearances((field, widget) => {
	*   ...
	*   return {
	*     normal: { on: drawCheckBox(...), off: drawCheckBox(...) },
	*     down: { on: drawCheckBox(...), off: drawCheckBox(...) },
	*   }
	* })
	* ```
	* @param provider Optionally, the appearance provider to be used for
	*                 generating the contents of the appearance streams.
	*/
	PDFCheckBox.prototype.updateAppearances = function(provider) {
		var _a;
		assertOrUndefined(provider, "provider", [Function]);
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			var onValue = (_a = widget.getOnValue()) !== null && _a !== void 0 ? _a : PDFName.of("Yes");
			if (!onValue) continue;
			this.updateWidgetAppearance(widget, onValue, provider);
		}
		this.markAsClean();
	};
	PDFCheckBox.prototype.updateWidgetAppearance = function(widget, onValue, provider) {
		var appearances = normalizeAppearance((provider !== null && provider !== void 0 ? provider : defaultCheckBoxAppearanceProvider)(this, widget));
		this.updateOnOffWidgetAppearance(widget, onValue, appearances);
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFForm.getCheckBox]] method, which will create an
	* > instance of [[PDFCheckBox]] for you.
	*
	* Create an instance of [[PDFCheckBox]] from an existing acroCheckBox and ref
	*
	* @param acroCheckBox The underlying `PDFAcroCheckBox` for this check box.
	* @param ref The unique reference for this check box.
	* @param doc The document to which this check box will belong.
	*/
	PDFCheckBox.of = function(acroCheckBox, ref, doc) {
		return new PDFCheckBox(acroCheckBox, ref, doc);
	};
	return PDFCheckBox;
}(PDFField);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/PDFDropdown.js
/**
* Represents a dropdown field of a [[PDFForm]].
*
* [[PDFDropdown]] fields are interactive text boxes that display a single
* element (the currently selected value). The purpose of a dropdown is to
* enable users to select a single option from a set of possible options. Users
* can click on a dropdown to view the full list of options it provides.
* Clicking on an option in the list will cause it to be selected and displayed
* in the dropdown's text box. Some dropdowns allow users to enter text
* directly into the box from their keyboard, rather than only being allowed to
* choose an option from the list (see [[PDFDropdown.isEditable]]).
*/
var PDFDropdown = function(_super) {
	__extends(PDFDropdown, _super);
	function PDFDropdown(acroComboBox, ref, doc) {
		var _this = _super.call(this, acroComboBox, ref, doc) || this;
		assertIs(acroComboBox, "acroComboBox", [[PDFAcroComboBox, "PDFAcroComboBox"]]);
		_this.acroField = acroComboBox;
		return _this;
	}
	/**
	* Get the list of available options for this dropdown. These options will be
	* displayed to users who click on this dropdown in a PDF reader.
	* For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* const options = dropdown.getOptions()
	* console.log('Dropdown options:', options)
	* ```
	* @returns The options for this dropdown.
	*/
	PDFDropdown.prototype.getOptions = function() {
		var rawOptions = this.acroField.getOptions();
		var options = new Array(rawOptions.length);
		for (var idx = 0, len = options.length; idx < len; idx++) {
			var _a = rawOptions[idx], display = _a.display, value = _a.value;
			options[idx] = (display !== null && display !== void 0 ? display : value).decodeText();
		}
		return options;
	};
	/**
	* Get the selected options for this dropdown. These are the values that were
	* selected by a human user via a PDF reader, or programatically via
	* software.
	* For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* const selections = dropdown.getSelected()
	* console.log('Dropdown selections:', selections)
	* ```
	* > **NOTE:** Note that PDF readers only display one selected option when
	* > rendering dropdowns. However, the PDF specification does allow for
	* > multiple values to be selected in a dropdown. As such, the `pdf-lib`
	* > API supports this. However, in most cases the array returned by this
	* > method will contain only a single element (or no elements).
	* @returns The selected options in this dropdown.
	*/
	PDFDropdown.prototype.getSelected = function() {
		var values = this.acroField.getValues();
		var selected = new Array(values.length);
		for (var idx = 0, len = values.length; idx < len; idx++) selected[idx] = values[idx].decodeText();
		return selected;
	};
	/**
	* Set the list of options that are available for this dropdown. These are
	* the values that will be available for users to select when they view this
	* dropdown in a PDF reader. Note that preexisting options for this dropdown
	* will be removed. Only the values passed as `options` will be available to
	* select.
	* For example:
	* ```js
	* const dropdown = form.getDropdown('planets.dropdown')
	* dropdown.setOptions(['Earth', 'Mars', 'Pluto', 'Venus'])
	* ```
	* @param options The options that should be available in this dropdown.
	*/
	PDFDropdown.prototype.setOptions = function(options) {
		assertIs(options, "options", [Array]);
		var optionObjects = new Array(options.length);
		for (var idx = 0, len = options.length; idx < len; idx++) optionObjects[idx] = { value: PDFHexString.fromText(options[idx]) };
		this.acroField.setOptions(optionObjects);
	};
	/**
	* Add to the list of options that are available for this dropdown. Users
	* will be able to select these values in a PDF reader. In addition to the
	* values passed as `options`, any preexisting options for this dropdown will
	* still be available for users to select.
	* For example:
	* ```js
	* const dropdown = form.getDropdown('rockets.dropdown')
	* dropdown.addOptions(['Saturn IV', 'Falcon Heavy'])
	* ```
	* @param options New options that should be available in this dropdown.
	*/
	PDFDropdown.prototype.addOptions = function(options) {
		assertIs(options, "options", ["string", Array]);
		var optionsArr = Array.isArray(options) ? options : [options];
		var existingOptions = this.acroField.getOptions();
		var newOptions = new Array(optionsArr.length);
		for (var idx = 0, len = optionsArr.length; idx < len; idx++) newOptions[idx] = { value: PDFHexString.fromText(optionsArr[idx]) };
		this.acroField.setOptions(existingOptions.concat(newOptions));
	};
	/**
	* Select one or more values for this dropdown. This operation is analogous
	* to a human user opening the dropdown in a PDF reader and clicking on a
	* value to select it. This method will update the underlying state of the
	* dropdown to indicate which values have been selected. PDF libraries and
	* readers will be able to extract these values from the saved document and
	* determine which values were selected.
	*
	* For example:
	* ```js
	* const dropdown = form.getDropdown('best.superhero.dropdown')
	* dropdown.select('One Punch Man')
	* ```
	*
	* This method will mark this dropdown as dirty, causing its appearance
	* streams to be updated when either [[PDFDocument.save]] or
	* [[PDFForm.updateFieldAppearances]] is called. The updated streams will
	* display the selected option inside the widgets of this dropdown.
	*
	* **IMPORTANT:** The default font used to update appearance streams is
	* [[StandardFonts.Helvetica]]. Note that this is a WinAnsi font. This means
	* that encoding errors will be thrown if the selected option for this field
	* contains characters outside the WinAnsi character set (the latin alphabet).
	*
	* Embedding a custom font and passing it to
	* [[PDFForm.updateFieldAppearances]] or [[PDFDropdown.updateAppearances]]
	* allows you to generate appearance streams with characters outside the
	* latin alphabet (assuming the custom font supports them).
	*
	* Selecting an option that does not exist in this dropdown's option list
	* (see [[PDFDropdown.getOptions]]) will enable editing on this dropdown
	* (see [[PDFDropdown.enableEditing]]).
	*
	* > **NOTE:** PDF readers only display one selected option when rendering
	* > dropdowns. However, the PDF specification does allow for multiple values
	* > to be selected in a dropdown. As such, the `pdf-lib` API supports this.
	* > However, it is not recommended to select more than one value with this
	* > method, as only one will be visible. [[PDFOptionList]] fields are better
	* > suited for displaying multiple selected values.
	*
	* @param options The options to be selected.
	* @param merge Whether or not existing selections should be preserved.
	*/
	PDFDropdown.prototype.select = function(options, merge) {
		if (merge === void 0) merge = false;
		assertIs(options, "options", ["string", Array]);
		assertIs(merge, "merge", ["boolean"]);
		var optionsArr = Array.isArray(options) ? options : [options];
		var validOptions = this.getOptions();
		if (optionsArr.find(function(option) {
			return !validOptions.includes(option);
		})) this.enableEditing();
		this.markAsDirty();
		if (optionsArr.length > 1 || optionsArr.length === 1 && merge) this.enableMultiselect();
		var values = new Array(optionsArr.length);
		for (var idx = 0, len = optionsArr.length; idx < len; idx++) values[idx] = PDFHexString.fromText(optionsArr[idx]);
		if (merge) {
			var existingValues = this.acroField.getValues();
			this.acroField.setValues(existingValues.concat(values));
		} else this.acroField.setValues(values);
	};
	/**
	* Clear all selected values for this dropdown. This operation is equivalent
	* to selecting an empty list. This method will update the underlying state
	* of the dropdown to indicate that no values have been selected.
	* For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.clear()
	* ```
	* This method will mark this text field as dirty. See [[PDFDropdown.select]]
	* for more details about what this means.
	*/
	PDFDropdown.prototype.clear = function() {
		this.markAsDirty();
		this.acroField.setValues([]);
	};
	/**
	* Set the font size for this field. Larger font sizes will result in larger
	* text being displayed when PDF readers render this dropdown. Font sizes may
	* be integer or floating point numbers. Supplying a negative font size will
	* cause this method to throw an error.
	*
	* For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.setFontSize(4)
	* dropdown.setFontSize(15.7)
	* ```
	*
	* > This method depends upon the existence of a default appearance
	* > (`/DA`) string. If this field does not have a default appearance string,
	* > or that string does not contain a font size (via the `Tf` operator),
	* > then this method will throw an error.
	*
	* @param fontSize The font size to be used when rendering text in this field.
	*/
	PDFDropdown.prototype.setFontSize = function(fontSize) {
		assertPositive(fontSize, "fontSize");
		this.acroField.setFontSize(fontSize);
		this.markAsDirty();
	};
	/**
	* Returns `true` if users are allowed to edit the selected value of this
	* dropdown directly and are not constrained by the list of available
	* options. See [[PDFDropdown.enableEditing]] and
	* [[PDFDropdown.disableEditing]]. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* if (dropdown.isEditable()) console.log('Editing is enabled')
	* ```
	* @returns Whether or not this dropdown is editable.
	*/
	PDFDropdown.prototype.isEditable = function() {
		return this.acroField.hasFlag(AcroChoiceFlags.Edit);
	};
	/**
	* Allow users to edit the selected value of this dropdown in PDF readers
	* with their keyboard. This means that the selected value of this dropdown
	* will not be constrained by the list of available options. However, if this
	* dropdown has any available options, users will still be allowed to select
	* from that list.
	* For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.enableEditing()
	* ```
	*/
	PDFDropdown.prototype.enableEditing = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.Edit, true);
	};
	/**
	* Do not allow users to edit the selected value of this dropdown in PDF
	* readers with their keyboard. This will constrain the selected value of
	* this dropdown to the list of available options. Users will only be able
	* to select an option from that list.
	* For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.disableEditing()
	* ```
	*/
	PDFDropdown.prototype.disableEditing = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.Edit, false);
	};
	/**
	* Returns `true` if the option list of this dropdown is always displayed
	* in alphabetical order, irrespective of the order in which the options
	* were added to the dropdown. See [[PDFDropdown.enableSorting]] and
	* [[PDFDropdown.disableSorting]]. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* if (dropdown.isSorted()) console.log('Sorting is enabled')
	* ```
	* @returns Whether or not this dropdown's options are sorted.
	*/
	PDFDropdown.prototype.isSorted = function() {
		return this.acroField.hasFlag(AcroChoiceFlags.Sort);
	};
	/**
	* Always display the option list of this dropdown in alphabetical order,
	* irrespective of the order in which the options were added to this dropdown.
	* For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.enableSorting()
	* ```
	*/
	PDFDropdown.prototype.enableSorting = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.Sort, true);
	};
	/**
	* Do not always display the option list of this dropdown in alphabetical
	* order. Instead, display the options in whichever order they were added
	* to the list. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.disableSorting()
	* ```
	*/
	PDFDropdown.prototype.disableSorting = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.Sort, false);
	};
	/**
	* Returns `true` if multiple options can be selected from this dropdown's
	* option list. See [[PDFDropdown.enableMultiselect]] and
	* [[PDFDropdown.disableMultiselect]]. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* if (dropdown.isMultiselect()) console.log('Multiselect is enabled')
	* ```
	* @returns Whether or not multiple options can be selected.
	*/
	PDFDropdown.prototype.isMultiselect = function() {
		return this.acroField.hasFlag(AcroChoiceFlags.MultiSelect);
	};
	/**
	* Allow users to select more than one option from this dropdown's option
	* list. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.enableMultiselect()
	* ```
	*/
	PDFDropdown.prototype.enableMultiselect = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.MultiSelect, true);
	};
	/**
	* Do not allow users to select more than one option from this dropdown's
	* option list. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.disableMultiselect()
	* ```
	*/
	PDFDropdown.prototype.disableMultiselect = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.MultiSelect, false);
	};
	/**
	* Returns `true` if the selected option should be spell checked by PDF
	* readers. Spell checking will only be performed if this dropdown allows
	* editing (see [[PDFDropdown.isEditable]]). See
	* [[PDFDropdown.enableSpellChecking]] and
	* [[PDFDropdown.disableSpellChecking]]. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* if (dropdown.isSpellChecked()) console.log('Spell checking is enabled')
	* ```
	* @returns Whether or not this dropdown can be spell checked.
	*/
	PDFDropdown.prototype.isSpellChecked = function() {
		return !this.acroField.hasFlag(AcroChoiceFlags.DoNotSpellCheck);
	};
	/**
	* Allow PDF readers to spell check the selected option of this dropdown.
	* For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.enableSpellChecking()
	* ```
	*/
	PDFDropdown.prototype.enableSpellChecking = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.DoNotSpellCheck, false);
	};
	/**
	* Do not allow PDF readers to spell check the selected option of this
	* dropdown. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.disableSpellChecking()
	* ```
	*/
	PDFDropdown.prototype.disableSpellChecking = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.DoNotSpellCheck, true);
	};
	/**
	* Returns `true` if the option selected by a user is stored, or "committed",
	* when the user clicks the option. The alternative is that the user's
	* selection is stored when the user leaves this dropdown field (by clicking
	* outside of it - on another field, for example). See
	* [[PDFDropdown.enableSelectOnClick]] and
	* [[PDFDropdown.disableSelectOnClick]]. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* if (dropdown.isSelectOnClick()) console.log('Select on click is enabled')
	* ```
	* @returns Whether or not options are selected immediately after they are
	*          clicked.
	*/
	PDFDropdown.prototype.isSelectOnClick = function() {
		return this.acroField.hasFlag(AcroChoiceFlags.CommitOnSelChange);
	};
	/**
	* Store the option selected by a user immediately after the user clicks the
	* option. Do not wait for the user to leave this dropdown field (by clicking
	* outside of it - on another field, for example). For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.enableSelectOnClick()
	* ```
	*/
	PDFDropdown.prototype.enableSelectOnClick = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.CommitOnSelChange, true);
	};
	/**
	* Wait to store the option selected by a user until they leave this dropdown
	* field (by clicking outside of it - on another field, for example).
	* For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.disableSelectOnClick()
	* ```
	*/
	PDFDropdown.prototype.disableSelectOnClick = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.CommitOnSelChange, false);
	};
	/**
	* Show this dropdown on the specified page. For example:
	* ```js
	* const ubuntuFont = await pdfDoc.embedFont(ubuntuFontBytes)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const dropdown = form.createDropdown('best.gundam')
	* dropdown.setOptions(['Exia', 'Dynames'])
	* dropdown.select('Exia')
	*
	* dropdown.addToPage(page, {
	*   x: 50,
	*   y: 75,
	*   width: 200,
	*   height: 100,
	*   textColor: rgb(1, 0, 0),
	*   backgroundColor: rgb(0, 1, 0),
	*   borderColor: rgb(0, 0, 1),
	*   borderWidth: 2,
	*   rotate: degrees(90),
	*   font: ubuntuFont,
	* })
	* ```
	* This will create a new widget for this dropdown field.
	* @param page The page to which this dropdown widget should be added.
	* @param options The options to be used when adding this dropdown widget.
	*/
	PDFDropdown.prototype.addToPage = function(page, options) {
		var _a, _b, _c, _d, _e, _f, _g;
		assertIs(page, "page", [[PDFPage, "PDFPage"]]);
		assertFieldAppearanceOptions(options);
		if (!options) options = {};
		if (!("textColor" in options)) options.textColor = rgb(0, 0, 0);
		if (!("backgroundColor" in options)) options.backgroundColor = rgb(1, 1, 1);
		if (!("borderColor" in options)) options.borderColor = rgb(0, 0, 0);
		if (!("borderWidth" in options)) options.borderWidth = 1;
		var widget = this.createWidget({
			x: (_a = options.x) !== null && _a !== void 0 ? _a : 0,
			y: (_b = options.y) !== null && _b !== void 0 ? _b : 0,
			width: (_c = options.width) !== null && _c !== void 0 ? _c : 200,
			height: (_d = options.height) !== null && _d !== void 0 ? _d : 50,
			textColor: options.textColor,
			backgroundColor: options.backgroundColor,
			borderColor: options.borderColor,
			borderWidth: (_e = options.borderWidth) !== null && _e !== void 0 ? _e : 0,
			rotate: (_f = options.rotate) !== null && _f !== void 0 ? _f : degrees(0),
			hidden: options.hidden,
			page: page.ref
		});
		var widgetRef = this.doc.context.register(widget.dict);
		this.acroField.addWidget(widgetRef);
		var font = (_g = options.font) !== null && _g !== void 0 ? _g : this.doc.getForm().getDefaultFont();
		this.updateWidgetAppearance(widget, font);
		page.node.addAnnot(widgetRef);
	};
	/**
	* Returns `true` if this dropdown has been marked as dirty, or if any of
	* this dropdown's widgets do not have an appearance stream. For example:
	* ```js
	* const dropdown = form.getDropdown('some.dropdown.field')
	* if (dropdown.needsAppearancesUpdate()) console.log('Needs update')
	* ```
	* @returns Whether or not this dropdown needs an appearance update.
	*/
	PDFDropdown.prototype.needsAppearancesUpdate = function() {
		var _a;
		if (this.isDirty()) return true;
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) if (!(((_a = widgets[idx].getAppearances()) === null || _a === void 0 ? void 0 : _a.normal) instanceof PDFStream)) return true;
		return false;
	};
	/**
	* Update the appearance streams for each of this dropdown's widgets using
	* the default appearance provider for dropdowns. For example:
	* ```js
	* const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.defaultUpdateAppearances(helvetica)
	* ```
	* @param font The font to be used for creating the appearance streams.
	*/
	PDFDropdown.prototype.defaultUpdateAppearances = function(font) {
		assertIs(font, "font", [[PDFFont, "PDFFont"]]);
		this.updateAppearances(font);
	};
	/**
	* Update the appearance streams for each of this dropdown's widgets using
	* the given appearance provider. If no `provider` is passed, the default
	* appearance provider for dropdowns will be used. For example:
	* ```js
	* const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const dropdown = form.getDropdown('some.dropdown.field')
	* dropdown.updateAppearances(helvetica, (field, widget, font) => {
	*   ...
	*   return drawTextField(...)
	* })
	* ```
	* @param font The font to be used for creating the appearance streams.
	* @param provider Optionally, the appearance provider to be used for
	*                 generating the contents of the appearance streams.
	*/
	PDFDropdown.prototype.updateAppearances = function(font, provider) {
		assertIs(font, "font", [[PDFFont, "PDFFont"]]);
		assertOrUndefined(provider, "provider", [Function]);
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			this.updateWidgetAppearance(widget, font, provider);
		}
		this.markAsClean();
	};
	PDFDropdown.prototype.updateWidgetAppearance = function(widget, font, provider) {
		var appearances = normalizeAppearance((provider !== null && provider !== void 0 ? provider : defaultDropdownAppearanceProvider)(this, widget, font));
		this.updateWidgetAppearanceWithFont(widget, font, appearances);
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFForm.getDropdown]] method, which will create an
	* > instance of [[PDFDropdown]] for you.
	*
	* Create an instance of [[PDFDropdown]] from an existing acroComboBox and ref
	*
	* @param acroComboBox The underlying `PDFAcroComboBox` for this dropdown.
	* @param ref The unique reference for this dropdown.
	* @param doc The document to which this dropdown will belong.
	*/
	PDFDropdown.of = function(acroComboBox, ref, doc) {
		return new PDFDropdown(acroComboBox, ref, doc);
	};
	return PDFDropdown;
}(PDFField);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/PDFOptionList.js
/**
* Represents an option list field of a [[PDFForm]].
*
* [[PDFOptionList]] fields are interactive lists of options. The purpose of an
* option list is to enable users to select one or more options from a set of
* possible options. Users are able to see the full set of options without
* first having to click on the field (though scrolling may be necessary).
* Clicking an option in the list will cause it to be selected and displayed
* with a highlighted background. Some option lists allow users to select
* more than one option (see [[PDFOptionList.isMultiselect]]).
*/
var PDFOptionList = function(_super) {
	__extends(PDFOptionList, _super);
	function PDFOptionList(acroListBox, ref, doc) {
		var _this = _super.call(this, acroListBox, ref, doc) || this;
		assertIs(acroListBox, "acroListBox", [[PDFAcroListBox, "PDFAcroListBox"]]);
		_this.acroField = acroListBox;
		return _this;
	}
	/**
	* Get the list of available options for this option list. These options will
	* be displayed to users who view this option list in a PDF reader.
	* For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* const options = optionList.getOptions()
	* console.log('Option List options:', options)
	* ```
	* @returns The options for this option list.
	*/
	PDFOptionList.prototype.getOptions = function() {
		var rawOptions = this.acroField.getOptions();
		var options = new Array(rawOptions.length);
		for (var idx = 0, len = options.length; idx < len; idx++) {
			var _a = rawOptions[idx], display = _a.display, value = _a.value;
			options[idx] = (display !== null && display !== void 0 ? display : value).decodeText();
		}
		return options;
	};
	/**
	* Get the selected options for this option list. These are the values that
	* were selected by a human user via a PDF reader, or programatically via
	* software.
	* For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* const selections = optionList.getSelected()
	* console.log('Option List selections:', selections)
	* ```
	* @returns The selected options for this option list.
	*/
	PDFOptionList.prototype.getSelected = function() {
		var values = this.acroField.getValues();
		var selected = new Array(values.length);
		for (var idx = 0, len = values.length; idx < len; idx++) selected[idx] = values[idx].decodeText();
		return selected;
	};
	/**
	* Set the list of options that are available for this option list. These are
	* the values that will be available for users to select when they view this
	* option list in a PDF reader. Note that preexisting options for this
	* option list will be removed. Only the values passed as `options` will be
	* available to select.
	*
	* For example:
	* ```js
	* const optionList = form.getOptionList('planets.optionList')
	* optionList.setOptions(['Earth', 'Mars', 'Pluto', 'Venus'])
	* ```
	*
	* This method will mark this option list as dirty, causing its appearance
	* streams to be updated when either [[PDFDocument.save]] or
	* [[PDFForm.updateFieldAppearances]] is called. The updated streams will
	* display the options this field contains inside the widgets of this text
	* field (with selected options highlighted).
	*
	* **IMPORTANT:** The default font used to update appearance streams is
	* [[StandardFonts.Helvetica]]. Note that this is a WinAnsi font. This means
	* that encoding errors will be thrown if this field contains any options
	* with characters outside the WinAnsi character set (the latin alphabet).
	*
	* Embedding a custom font and passing it to
	* [[PDFForm.updateFieldAppearances]] or [[PDFOptionList.updateAppearances]]
	* allows you to generate appearance streams with characters outside the
	* latin alphabet (assuming the custom font supports them).
	*
	* @param options The options that should be available in this option list.
	*/
	PDFOptionList.prototype.setOptions = function(options) {
		assertIs(options, "options", [Array]);
		this.markAsDirty();
		var optionObjects = new Array(options.length);
		for (var idx = 0, len = options.length; idx < len; idx++) optionObjects[idx] = { value: PDFHexString.fromText(options[idx]) };
		this.acroField.setOptions(optionObjects);
	};
	/**
	* Add to the list of options that are available for this option list. Users
	* will be able to select these values in a PDF reader. In addition to the
	* values passed as `options`, any preexisting options for this option list
	* will still be available for users to select.
	* For example:
	* ```js
	* const optionList = form.getOptionList('rockets.optionList')
	* optionList.addOptions(['Saturn IV', 'Falcon Heavy'])
	* ```
	* This method will mark this option list as dirty. See
	* [[PDFOptionList.setOptions]] for more details about what this means.
	* @param options New options that should be available in this option list.
	*/
	PDFOptionList.prototype.addOptions = function(options) {
		assertIs(options, "options", ["string", Array]);
		this.markAsDirty();
		var optionsArr = Array.isArray(options) ? options : [options];
		var existingOptions = this.acroField.getOptions();
		var newOptions = new Array(optionsArr.length);
		for (var idx = 0, len = optionsArr.length; idx < len; idx++) newOptions[idx] = { value: PDFHexString.fromText(optionsArr[idx]) };
		this.acroField.setOptions(existingOptions.concat(newOptions));
	};
	/**
	* Select one or more values for this option list. This operation is analogous
	* to a human user opening the option list in a PDF reader and clicking on one
	* or more values to select them. This method will update the underlying state
	* of the option list to indicate which values have been selected. PDF
	* libraries and readers will be able to extract these values from the saved
	* document and determine which values were selected.
	* For example:
	* ```js
	* const optionList = form.getOptionList('best.superheroes.optionList')
	* optionList.select(['One Punch Man', 'Iron Man'])
	* ```
	* This method will mark this option list as dirty. See
	* [[PDFOptionList.setOptions]] for more details about what this means.
	* @param options The options to be selected.
	* @param merge Whether or not existing selections should be preserved.
	*/
	PDFOptionList.prototype.select = function(options, merge) {
		if (merge === void 0) merge = false;
		assertIs(options, "options", ["string", Array]);
		assertIs(merge, "merge", ["boolean"]);
		var optionsArr = Array.isArray(options) ? options : [options];
		assertIsSubset(optionsArr, "option", this.getOptions());
		this.markAsDirty();
		if (optionsArr.length > 1 || optionsArr.length === 1 && merge) this.enableMultiselect();
		var values = new Array(optionsArr.length);
		for (var idx = 0, len = optionsArr.length; idx < len; idx++) values[idx] = PDFHexString.fromText(optionsArr[idx]);
		if (merge) {
			var existingValues = this.acroField.getValues();
			this.acroField.setValues(existingValues.concat(values));
		} else this.acroField.setValues(values);
	};
	/**
	* Clear all selected values for this option list. This operation is
	* equivalent to selecting an empty list. This method will update the
	* underlying state of the option list to indicate that no values have been
	* selected.
	* For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.clear()
	* ```
	* This method will mark this option list as dirty. See
	* [[PDFOptionList.setOptions]] for more details about what this means.
	*/
	PDFOptionList.prototype.clear = function() {
		this.markAsDirty();
		this.acroField.setValues([]);
	};
	/**
	* Set the font size for the text in this field. There needs to be a
	* default appearance string (DA) set with a font value specified
	* for this to work. For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.setFontSize(4);
	* ```
	* @param fontSize The font size to set the font to.
	*/
	/**
	* Set the font size for this field. Larger font sizes will result in larger
	* text being displayed when PDF readers render this option list. Font sizes
	* may be integer or floating point numbers. Supplying a negative font size
	* will cause this method to throw an error.
	*
	* For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.setFontSize(4)
	* optionList.setFontSize(15.7)
	* ```
	*
	* > This method depends upon the existence of a default appearance
	* > (`/DA`) string. If this field does not have a default appearance string,
	* > or that string does not contain a font size (via the `Tf` operator),
	* > then this method will throw an error.
	*
	* @param fontSize The font size to be used when rendering text in this field.
	*/
	PDFOptionList.prototype.setFontSize = function(fontSize) {
		assertPositive(fontSize, "fontSize");
		this.acroField.setFontSize(fontSize);
		this.markAsDirty();
	};
	/**
	* Returns `true` if the options of this option list are always displayed
	* in alphabetical order, irrespective of the order in which the options
	* were added to the option list. See [[PDFOptionList.enableSorting]] and
	* [[PDFOptionList.disableSorting]]. For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* if (optionList.isSorted()) console.log('Sorting is enabled')
	* ```
	* @returns Whether or not this option list is sorted.
	*/
	PDFOptionList.prototype.isSorted = function() {
		return this.acroField.hasFlag(AcroChoiceFlags.Sort);
	};
	/**
	* Always display the options of this option list in alphabetical order,
	* irrespective of the order in which the options were added to this option
	* list.
	* For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.enableSorting()
	* ```
	*/
	PDFOptionList.prototype.enableSorting = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.Sort, true);
	};
	/**
	* Do not always display the options of this option list in alphabetical
	* order. Instead, display the options in whichever order they were added
	* to this option list. For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.disableSorting()
	* ```
	*/
	PDFOptionList.prototype.disableSorting = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.Sort, false);
	};
	/**
	* Returns `true` if multiple options can be selected from this option list.
	* See [[PDFOptionList.enableMultiselect]] and
	* [[PDFOptionList.disableMultiselect]]. For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* if (optionList.isMultiselect()) console.log('Multiselect is enabled')
	* ```
	* @returns Whether or not multiple options can be selected.
	*/
	PDFOptionList.prototype.isMultiselect = function() {
		return this.acroField.hasFlag(AcroChoiceFlags.MultiSelect);
	};
	/**
	* Allow users to select more than one option from this option list.
	* For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.enableMultiselect()
	* ```
	*/
	PDFOptionList.prototype.enableMultiselect = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.MultiSelect, true);
	};
	/**
	* Do not allow users to select more than one option from this option list.
	* For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.disableMultiselect()
	* ```
	*/
	PDFOptionList.prototype.disableMultiselect = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.MultiSelect, false);
	};
	/**
	* Returns `true` if the option selected by a user is stored, or "committed",
	* when the user clicks the option. The alternative is that the user's
	* selection is stored when the user leaves this option list field (by
	* clicking outside of it - on another field, for example). See
	* [[PDFOptionList.enableSelectOnClick]] and
	* [[PDFOptionList.disableSelectOnClick]]. For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* if (optionList.isSelectOnClick()) console.log('Select on click is enabled')
	* ```
	* @returns Whether or not options are selected immediately after they are
	*          clicked.
	*/
	PDFOptionList.prototype.isSelectOnClick = function() {
		return this.acroField.hasFlag(AcroChoiceFlags.CommitOnSelChange);
	};
	/**
	* Store the option selected by a user immediately after the user clicks the
	* option. Do not wait for the user to leave this option list field (by
	* clicking outside of it - on another field, for example). For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.enableSelectOnClick()
	* ```
	*/
	PDFOptionList.prototype.enableSelectOnClick = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.CommitOnSelChange, true);
	};
	/**
	* Wait to store the option selected by a user until they leave this option
	* list field (by clicking outside of it - on another field, for example).
	* For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.disableSelectOnClick()
	* ```
	*/
	PDFOptionList.prototype.disableSelectOnClick = function() {
		this.acroField.setFlagTo(AcroChoiceFlags.CommitOnSelChange, false);
	};
	/**
	* Show this option list on the specified page. For example:
	* ```js
	* const ubuntuFont = await pdfDoc.embedFont(ubuntuFontBytes)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const optionList = form.createOptionList('best.gundams')
	* optionList.setOptions(['Exia', 'Dynames', 'Kyrios', 'Virtue'])
	* optionList.select(['Exia', 'Virtue'])
	*
	* optionList.addToPage(page, {
	*   x: 50,
	*   y: 75,
	*   width: 200,
	*   height: 100,
	*   textColor: rgb(1, 0, 0),
	*   backgroundColor: rgb(0, 1, 0),
	*   borderColor: rgb(0, 0, 1),
	*   borderWidth: 2,
	*   rotate: degrees(90),
	*   font: ubuntuFont,
	* })
	* ```
	* This will create a new widget for this option list field.
	* @param page The page to which this option list widget should be added.
	* @param options The options to be used when adding this option list widget.
	*/
	PDFOptionList.prototype.addToPage = function(page, options) {
		var _a, _b, _c, _d, _e, _f, _g;
		assertIs(page, "page", [[PDFPage, "PDFPage"]]);
		assertFieldAppearanceOptions(options);
		if (!options) options = {};
		if (!("textColor" in options)) options.textColor = rgb(0, 0, 0);
		if (!("backgroundColor" in options)) options.backgroundColor = rgb(1, 1, 1);
		if (!("borderColor" in options)) options.borderColor = rgb(0, 0, 0);
		if (!("borderWidth" in options)) options.borderWidth = 1;
		var widget = this.createWidget({
			x: (_a = options.x) !== null && _a !== void 0 ? _a : 0,
			y: (_b = options.y) !== null && _b !== void 0 ? _b : 0,
			width: (_c = options.width) !== null && _c !== void 0 ? _c : 200,
			height: (_d = options.height) !== null && _d !== void 0 ? _d : 100,
			textColor: options.textColor,
			backgroundColor: options.backgroundColor,
			borderColor: options.borderColor,
			borderWidth: (_e = options.borderWidth) !== null && _e !== void 0 ? _e : 0,
			rotate: (_f = options.rotate) !== null && _f !== void 0 ? _f : degrees(0),
			hidden: options.hidden,
			page: page.ref
		});
		var widgetRef = this.doc.context.register(widget.dict);
		this.acroField.addWidget(widgetRef);
		var font = (_g = options.font) !== null && _g !== void 0 ? _g : this.doc.getForm().getDefaultFont();
		this.updateWidgetAppearance(widget, font);
		page.node.addAnnot(widgetRef);
	};
	/**
	* Returns `true` if this option list has been marked as dirty, or if any of
	* this option list's widgets do not have an appearance stream. For example:
	* ```js
	* const optionList = form.getOptionList('some.optionList.field')
	* if (optionList.needsAppearancesUpdate()) console.log('Needs update')
	* ```
	* @returns Whether or not this option list needs an appearance update.
	*/
	PDFOptionList.prototype.needsAppearancesUpdate = function() {
		var _a;
		if (this.isDirty()) return true;
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) if (!(((_a = widgets[idx].getAppearances()) === null || _a === void 0 ? void 0 : _a.normal) instanceof PDFStream)) return true;
		return false;
	};
	/**
	* Update the appearance streams for each of this option list's widgets using
	* the default appearance provider for option lists. For example:
	* ```js
	* const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.defaultUpdateAppearances(helvetica)
	* ```
	* @param font The font to be used for creating the appearance streams.
	*/
	PDFOptionList.prototype.defaultUpdateAppearances = function(font) {
		assertIs(font, "font", [[PDFFont, "PDFFont"]]);
		this.updateAppearances(font);
	};
	/**
	* Update the appearance streams for each of this option list's widgets using
	* the given appearance provider. If no `provider` is passed, the default
	* appearance provider for option lists will be used. For example:
	* ```js
	* const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const optionList = form.getOptionList('some.optionList.field')
	* optionList.updateAppearances(helvetica, (field, widget, font) => {
	*   ...
	*   return drawOptionList(...)
	* })
	* ```
	* @param font The font to be used for creating the appearance streams.
	* @param provider Optionally, the appearance provider to be used for
	*                 generating the contents of the appearance streams.
	*/
	PDFOptionList.prototype.updateAppearances = function(font, provider) {
		assertIs(font, "font", [[PDFFont, "PDFFont"]]);
		assertOrUndefined(provider, "provider", [Function]);
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			this.updateWidgetAppearance(widget, font, provider);
		}
		this.markAsClean();
	};
	PDFOptionList.prototype.updateWidgetAppearance = function(widget, font, provider) {
		var appearances = normalizeAppearance((provider !== null && provider !== void 0 ? provider : defaultOptionListAppearanceProvider)(this, widget, font));
		this.updateWidgetAppearanceWithFont(widget, font, appearances);
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFForm.getOptionList]] method, which will create
	* > an instance of [[PDFOptionList]] for you.
	*
	* Create an instance of [[PDFOptionList]] from an existing acroListBox and
	* ref
	*
	* @param acroComboBox The underlying `PDFAcroListBox` for this option list.
	* @param ref The unique reference for this option list.
	* @param doc The document to which this option list will belong.
	*/
	PDFOptionList.of = function(acroListBox, ref, doc) {
		return new PDFOptionList(acroListBox, ref, doc);
	};
	return PDFOptionList;
}(PDFField);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/PDFRadioGroup.js
/**
* Represents a radio group field of a [[PDFForm]].
*
* [[PDFRadioGroup]] fields are collections of radio buttons. The purpose of a
* radio group is to enable users to select one option from a set of mutually
* exclusive choices. Each choice in a radio group is represented by a radio
* button. Radio buttons each have two states: `on` and `off`. At most one
* radio button in a group may be in the `on` state at any time. Users can
* click on a radio button to select it (and thereby automatically deselect any
* other radio button that might have already been selected). Some radio
* groups allow users to toggle a selected radio button `off` by clicking on
* it (see [[PDFRadioGroup.isOffToggleable]]).
*
* Note that some radio groups allow multiple radio buttons to be in the `on`
* state at the same type **if** they represent the same underlying value (see
* [[PDFRadioGroup.isMutuallyExclusive]]).
*/
var PDFRadioGroup = function(_super) {
	__extends(PDFRadioGroup, _super);
	function PDFRadioGroup(acroRadioButton, ref, doc) {
		var _this = _super.call(this, acroRadioButton, ref, doc) || this;
		assertIs(acroRadioButton, "acroRadioButton", [[PDFAcroRadioButton, "PDFAcroRadioButton"]]);
		_this.acroField = acroRadioButton;
		return _this;
	}
	/**
	* Get the list of available options for this radio group. Each option is
	* represented by a radio button. These radio buttons are displayed at
	* various locations in the document, potentially on different pages (though
	* typically they are stacked horizontally or vertically on the same page).
	* For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* const options = radioGroup.getOptions()
	* console.log('Radio Group options:', options)
	* ```
	* @returns The options for this radio group.
	*/
	PDFRadioGroup.prototype.getOptions = function() {
		var exportValues = this.acroField.getExportValues();
		if (exportValues) {
			var exportOptions = new Array(exportValues.length);
			for (var idx = 0, len = exportValues.length; idx < len; idx++) exportOptions[idx] = exportValues[idx].decodeText();
			return exportOptions;
		}
		var onValues = this.acroField.getOnValues();
		var onOptions = new Array(onValues.length);
		for (var idx = 0, len = onOptions.length; idx < len; idx++) onOptions[idx] = onValues[idx].decodeText();
		return onOptions;
	};
	/**
	* Get the selected option for this radio group. The selected option is
	* represented by the radio button in this group that is turned on. At most
	* one radio button in a group can be selected. If no buttons in this group
	* are selected, `undefined` is returned.
	* For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* const selected = radioGroup.getSelected()
	* console.log('Selected radio button:', selected)
	* ```
	* @returns The selected option for this radio group.
	*/
	PDFRadioGroup.prototype.getSelected = function() {
		var value = this.acroField.getValue();
		if (value === PDFName.of("Off")) return void 0;
		var exportValues = this.acroField.getExportValues();
		if (exportValues) {
			var onValues = this.acroField.getOnValues();
			for (var idx = 0, len = onValues.length; idx < len; idx++) if (onValues[idx] === value) return exportValues[idx].decodeText();
		}
		return value.decodeText();
	};
	/**
	* Select an option for this radio group. This operation is analogous to a
	* human user clicking one of the radio buttons in this group via a PDF
	* reader to toggle it on. This method will update the underlying state of
	* the radio group to indicate which option has been selected. PDF libraries
	* and readers will be able to extract this value from the saved document and
	* determine which option was selected.
	*
	* For example:
	* ```js
	* const radioGroup = form.getRadioGroup('best.superhero.radioGroup')
	* radioGroup.select('One Punch Man')
	* ```
	*
	* This method will mark this radio group as dirty, causing its appearance
	* streams to be updated when either [[PDFDocument.save]] or
	* [[PDFForm.updateFieldAppearances]] is called. The updated appearance
	* streams will display a dot inside the widget of this check box field
	* that represents the selected option.
	*
	* @param option The option to be selected.
	*/
	PDFRadioGroup.prototype.select = function(option) {
		assertIs(option, "option", ["string"]);
		assertIsOneOf(option, "option", this.getOptions());
		this.markAsDirty();
		var onValues = this.acroField.getOnValues();
		var exportValues = this.acroField.getExportValues();
		if (exportValues) {
			for (var idx = 0, len = exportValues.length; idx < len; idx++) if (exportValues[idx].decodeText() === option) this.acroField.setValue(onValues[idx]);
		} else for (var idx = 0, len = onValues.length; idx < len; idx++) {
			var value = onValues[idx];
			if (value.decodeText() === option) this.acroField.setValue(value);
		}
	};
	/**
	* Clear any selected option for this dropdown. This will result in all
	* radio buttons in this group being toggled off. This method will update
	* the underlying state of the dropdown to indicate that no radio buttons
	* have been selected.
	* For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* radioGroup.clear()
	* ```
	* This method will mark this radio group as dirty. See
	* [[PDFRadioGroup.select]] for more details about what this means.
	*/
	PDFRadioGroup.prototype.clear = function() {
		this.markAsDirty();
		this.acroField.setValue(PDFName.of("Off"));
	};
	/**
	* Returns `true` if users can click on radio buttons in this group to toggle
	* them off. The alternative is that once a user clicks on a radio button
	* to select it, the only way to deselect it is by selecting on another radio
	* button in the group. See [[PDFRadioGroup.enableOffToggling]] and
	* [[PDFRadioGroup.disableOffToggling]]. For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* if (radioGroup.isOffToggleable()) console.log('Off toggling is enabled')
	* ```
	*/
	PDFRadioGroup.prototype.isOffToggleable = function() {
		return !this.acroField.hasFlag(AcroButtonFlags.NoToggleToOff);
	};
	/**
	* Allow users to click on selected radio buttons in this group to toggle
	* them off. For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* radioGroup.enableOffToggling()
	* ```
	* > **NOTE:** This feature is documented in the PDF specification
	* > (Table 226). However, most PDF readers do not respect this option and
	* > prevent users from toggling radio buttons off even when it is enabled.
	* > At the time of this writing (9/6/2020) Mac's Preview software did
	* > respect the option. Adobe Acrobat, Foxit Reader, and Google Chrome did
	* > not.
	*/
	PDFRadioGroup.prototype.enableOffToggling = function() {
		this.acroField.setFlagTo(AcroButtonFlags.NoToggleToOff, false);
	};
	/**
	* Prevent users from clicking on selected radio buttons in this group to
	* toggle them off. Clicking on a selected radio button will have no effect.
	* The only way to deselect a selected radio button is to click on a
	* different radio button in the group. For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* radioGroup.disableOffToggling()
	* ```
	*/
	PDFRadioGroup.prototype.disableOffToggling = function() {
		this.acroField.setFlagTo(AcroButtonFlags.NoToggleToOff, true);
	};
	/**
	* Returns `true` if the radio buttons in this group are mutually exclusive.
	* This means that when the user selects a radio button, only that specific
	* button will be turned on. Even if other radio buttons in the group
	* represent the same value, they will not be enabled. The alternative to
	* this is that clicking a radio button will select that button along with
	* any other radio buttons in the group that share the same value. See
	* [[PDFRadioGroup.enableMutualExclusion]] and
	* [[PDFRadioGroup.disableMutualExclusion]].
	* For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* if (radioGroup.isMutuallyExclusive()) console.log('Mutual exclusion is enabled')
	* ```
	*/
	PDFRadioGroup.prototype.isMutuallyExclusive = function() {
		return !this.acroField.hasFlag(AcroButtonFlags.RadiosInUnison);
	};
	/**
	* When the user clicks a radio button in this group it will be selected. In
	* addition, any other radio buttons in this group that share the same
	* underlying value will also be selected. For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* radioGroup.enableMutualExclusion()
	* ```
	* Note that this option must be enabled prior to adding options to the
	* radio group. It does not currently apply retroactively to existing
	* radio buttons in the group.
	*/
	PDFRadioGroup.prototype.enableMutualExclusion = function() {
		this.acroField.setFlagTo(AcroButtonFlags.RadiosInUnison, false);
	};
	/**
	* When the user clicks a radio button in this group only it will be selected.
	* No other radio buttons in the group will be selected, even if they share
	* the same underlying value. For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* radioGroup.disableMutualExclusion()
	* ```
	* Note that this option must be disabled prior to adding options to the
	* radio group. It does not currently apply retroactively to existing
	* radio buttons in the group.
	*/
	PDFRadioGroup.prototype.disableMutualExclusion = function() {
		this.acroField.setFlagTo(AcroButtonFlags.RadiosInUnison, true);
	};
	/**
	* Add a new radio button to this group on the specified page. For example:
	* ```js
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const radioGroup = form.createRadioGroup('best.gundam')
	*
	* const options = {
	*   x: 50,
	*   width: 25,
	*   height: 25,
	*   textColor: rgb(1, 0, 0),
	*   backgroundColor: rgb(0, 1, 0),
	*   borderColor: rgb(0, 0, 1),
	*   borderWidth: 2,
	*   rotate: degrees(90),
	* }
	*
	* radioGroup.addOptionToPage('Exia', page, { ...options, y: 50 })
	* radioGroup.addOptionToPage('Dynames', page, { ...options, y: 110 })
	* ```
	* This will create a new radio button widget for this radio group field.
	* @param option The option that the radio button widget represents.
	* @param page The page to which the radio button widget should be added.
	* @param options The options to be used when adding the radio button widget.
	*/
	PDFRadioGroup.prototype.addOptionToPage = function(option, page, options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _j;
		assertIs(option, "option", ["string"]);
		assertIs(page, "page", [[PDFPage, "PDFPage"]]);
		assertFieldAppearanceOptions(options);
		var widget = this.createWidget({
			x: (_a = options === null || options === void 0 ? void 0 : options.x) !== null && _a !== void 0 ? _a : 0,
			y: (_b = options === null || options === void 0 ? void 0 : options.y) !== null && _b !== void 0 ? _b : 0,
			width: (_c = options === null || options === void 0 ? void 0 : options.width) !== null && _c !== void 0 ? _c : 50,
			height: (_d = options === null || options === void 0 ? void 0 : options.height) !== null && _d !== void 0 ? _d : 50,
			textColor: (_e = options === null || options === void 0 ? void 0 : options.textColor) !== null && _e !== void 0 ? _e : rgb(0, 0, 0),
			backgroundColor: (_f = options === null || options === void 0 ? void 0 : options.backgroundColor) !== null && _f !== void 0 ? _f : rgb(1, 1, 1),
			borderColor: (_g = options === null || options === void 0 ? void 0 : options.borderColor) !== null && _g !== void 0 ? _g : rgb(0, 0, 0),
			borderWidth: (_h = options === null || options === void 0 ? void 0 : options.borderWidth) !== null && _h !== void 0 ? _h : 1,
			rotate: (_j = options === null || options === void 0 ? void 0 : options.rotate) !== null && _j !== void 0 ? _j : degrees(0),
			hidden: options === null || options === void 0 ? void 0 : options.hidden,
			page: page.ref
		});
		var widgetRef = this.doc.context.register(widget.dict);
		var apStateValue = this.acroField.addWidgetWithOpt(widgetRef, PDFHexString.fromText(option), !this.isMutuallyExclusive());
		widget.setAppearanceState(PDFName.of("Off"));
		this.updateWidgetAppearance(widget, apStateValue);
		page.node.addAnnot(widgetRef);
	};
	/**
	* Returns `true` if any of this group's radio button widgets do not have an
	* appearance stream for their current state. For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* if (radioGroup.needsAppearancesUpdate()) console.log('Needs update')
	* ```
	* @returns Whether or not this radio group needs an appearance update.
	*/
	PDFRadioGroup.prototype.needsAppearancesUpdate = function() {
		var _a;
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			var state = widget.getAppearanceState();
			var normal = (_a = widget.getAppearances()) === null || _a === void 0 ? void 0 : _a.normal;
			if (!(normal instanceof PDFDict)) return true;
			if (state && !normal.has(state)) return true;
		}
		return false;
	};
	/**
	* Update the appearance streams for each of this group's radio button widgets
	* using the default appearance provider for radio groups. For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* radioGroup.defaultUpdateAppearances()
	* ```
	*/
	PDFRadioGroup.prototype.defaultUpdateAppearances = function() {
		this.updateAppearances();
	};
	/**
	* Update the appearance streams for each of this group's radio button widgets
	* using the given appearance provider. If no `provider` is passed, the
	* default appearance provider for radio groups will be used. For example:
	* ```js
	* const radioGroup = form.getRadioGroup('some.radioGroup.field')
	* radioGroup.updateAppearances((field, widget) => {
	*   ...
	*   return {
	*     normal: { on: drawRadioButton(...), off: drawRadioButton(...) },
	*     down: { on: drawRadioButton(...), off: drawRadioButton(...) },
	*   }
	* })
	* ```
	* @param provider Optionally, the appearance provider to be used for
	*                 generating the contents of the appearance streams.
	*/
	PDFRadioGroup.prototype.updateAppearances = function(provider) {
		assertOrUndefined(provider, "provider", [Function]);
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			var onValue = widget.getOnValue();
			if (!onValue) continue;
			this.updateWidgetAppearance(widget, onValue, provider);
		}
	};
	PDFRadioGroup.prototype.updateWidgetAppearance = function(widget, onValue, provider) {
		var appearances = normalizeAppearance((provider !== null && provider !== void 0 ? provider : defaultRadioGroupAppearanceProvider)(this, widget));
		this.updateOnOffWidgetAppearance(widget, onValue, appearances);
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFForm.getOptionList]] method, which will create an
	* > instance of [[PDFOptionList]] for you.
	*
	* Create an instance of [[PDFOptionList]] from an existing acroRadioButton
	* and ref
	*
	* @param acroRadioButton The underlying `PDFAcroRadioButton` for this
	*                        radio group.
	* @param ref The unique reference for this radio group.
	* @param doc The document to which this radio group will belong.
	*/
	PDFRadioGroup.of = function(acroRadioButton, ref, doc) {
		return new PDFRadioGroup(acroRadioButton, ref, doc);
	};
	return PDFRadioGroup;
}(PDFField);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/PDFSignature.js
/**
* Represents a signature field of a [[PDFForm]].
*
* [[PDFSignature]] fields are digital signatures. `pdf-lib` does not
* currently provide any specialized APIs for creating digital signatures or
* reading the contents of existing digital signatures.
*/
var PDFSignature = function(_super) {
	__extends(PDFSignature, _super);
	function PDFSignature(acroSignature, ref, doc) {
		var _this = _super.call(this, acroSignature, ref, doc) || this;
		assertIs(acroSignature, "acroSignature", [[PDFAcroSignature, "PDFAcroSignature"]]);
		_this.acroField = acroSignature;
		return _this;
	}
	PDFSignature.prototype.needsAppearancesUpdate = function() {
		return false;
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFForm.getSignature]] method, which will create an
	* > instance of [[PDFSignature]] for you.
	*
	* Create an instance of [[PDFSignature]] from an existing acroSignature and
	* ref
	*
	* @param acroSignature The underlying `PDFAcroSignature` for this signature.
	* @param ref The unique reference for this signature.
	* @param doc The document to which this signature will belong.
	*/
	PDFSignature.of = function(acroSignature, ref, doc) {
		return new PDFSignature(acroSignature, ref, doc);
	};
	return PDFSignature;
}(PDFField);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/PDFTextField.js
/**
* Represents a text field of a [[PDFForm]].
*
* [[PDFTextField]] fields are boxes that display text entered by the user. The
* purpose of a text field is to enable users to enter text or view text values
* in the document prefilled by software. Users can click on a text field and
* input text via their keyboard. Some text fields allow multiple lines of text
* to be entered (see [[PDFTextField.isMultiline]]).
*/
var PDFTextField = function(_super) {
	__extends(PDFTextField, _super);
	function PDFTextField(acroText, ref, doc) {
		var _this = _super.call(this, acroText, ref, doc) || this;
		assertIs(acroText, "acroText", [[PDFAcroText, "PDFAcroText"]]);
		_this.acroField = acroText;
		return _this;
	}
	/**
	* Get the text that this field contains. This text is visible to users who
	* view this field in a PDF reader.
	*
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* const text = textField.getText()
	* console.log('Text field contents:', text)
	* ```
	*
	* Note that if this text field contains no underlying value, `undefined`
	* will be returned. Text fields may also contain an underlying value that
	* is simply an empty string (`''`). This detail is largely irrelevant for
	* most applications. In general, you'll want to treat both cases the same
	* way and simply consider the text field to be empty. In either case, the
	* text field will appear empty to users when viewed in a PDF reader.
	*
	* An error will be thrown if this is a rich text field. `pdf-lib` does not
	* support reading rich text fields. Nor do most PDF readers and writers.
	* Rich text fields are based on XFA (XML Forms Architecture). Relatively few
	* PDFs use rich text fields or XFA. Unlike PDF itself, XFA is not an ISO
	* standard. XFA has been deprecated in PDF 2.0:
	* * https://en.wikipedia.org/wiki/XFA
	* * http://blog.pdfshareforms.com/pdf-2-0-release-bid-farewell-xfa-forms/
	*
	* @returns The text contained in this text field.
	*/
	PDFTextField.prototype.getText = function() {
		var value = this.acroField.getValue();
		if (!value && this.isRichFormatted()) throw new RichTextFieldReadError(this.getName());
		return value === null || value === void 0 ? void 0 : value.decodeText();
	};
	/**
	* Set the text for this field. This operation is analogous to a human user
	* clicking on the text field in a PDF reader and typing in text via their
	* keyboard. This method will update the underlying state of the text field
	* to indicate what text has been set. PDF libraries and readers will be able
	* to extract these values from the saved document and determine what text
	* was set.
	*
	* For example:
	* ```js
	* const textField = form.getTextField('best.superhero.text.field')
	* textField.setText('One Punch Man')
	* ```
	*
	* This method will mark this text field as dirty, causing its appearance
	* streams to be updated when either [[PDFDocument.save]] or
	* [[PDFForm.updateFieldAppearances]] is called. The updated streams will
	* display the text this field contains inside the widgets of this text
	* field.
	*
	* **IMPORTANT:** The default font used to update appearance streams is
	* [[StandardFonts.Helvetica]]. Note that this is a WinAnsi font. This means
	* that encoding errors will be thrown if this field contains text outside
	* the WinAnsi character set (the latin alphabet).
	*
	* Embedding a custom font and passing it to
	* [[PDFForm.updateFieldAppearances]] or [[PDFTextField.updateAppearances]]
	* allows you to generate appearance streams with characters outside the
	* latin alphabet (assuming the custom font supports them).
	*
	* If this is a rich text field, it will be converted to a standard text
	* field in order to set the text. `pdf-lib` does not support writing rich
	* text strings. Nor do most PDF readers and writers. See
	* [[PDFTextField.getText]] for more information about rich text fields and
	* their deprecation in PDF 2.0.
	*
	* @param text The text this field should contain.
	*/
	PDFTextField.prototype.setText = function(text) {
		assertOrUndefined(text, "text", ["string"]);
		var maxLength = this.getMaxLength();
		if (maxLength !== void 0 && text && text.length > maxLength) throw new ExceededMaxLengthError(text.length, maxLength, this.getName());
		this.markAsDirty();
		this.disableRichFormatting();
		if (text) this.acroField.setValue(PDFHexString.fromText(text));
		else this.acroField.removeValue();
	};
	/**
	* Get the alignment for this text field. This value represents the
	* justification of the text when it is displayed to the user in PDF readers.
	* There are three possible alignments: left, center, and right. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* const alignment = textField.getAlignment()
	* if (alignment === TextAlignment.Left) console.log('Text is left justified')
	* if (alignment === TextAlignment.Center) console.log('Text is centered')
	* if (alignment === TextAlignment.Right) console.log('Text is right justified')
	* ```
	* @returns The alignment of this text field.
	*/
	PDFTextField.prototype.getAlignment = function() {
		var quadding = this.acroField.getQuadding();
		return quadding === 0 ? TextAlignment.Left : quadding === 1 ? TextAlignment.Center : quadding === 2 ? TextAlignment.Right : TextAlignment.Left;
	};
	/**
	* Set the alignment for this text field. This will determine the
	* justification of the text when it is displayed to the user in PDF readers.
	* There are three possible alignments: left, center, and right. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	*
	* // Text will be left justified when displayed
	* textField.setAlignment(TextAlignment.Left)
	*
	* // Text will be centered when displayed
	* textField.setAlignment(TextAlignment.Center)
	*
	* // Text will be right justified when displayed
	* textField.setAlignment(TextAlignment.Right)
	* ```
	* This method will mark this text field as dirty. See
	* [[PDFTextField.setText]] for more details about what this means.
	* @param alignment The alignment for this text field.
	*/
	PDFTextField.prototype.setAlignment = function(alignment) {
		assertIsOneOf(alignment, "alignment", TextAlignment);
		this.markAsDirty();
		this.acroField.setQuadding(alignment);
	};
	/**
	* Get the maximum length of this field. This value represents the maximum
	* number of characters that can be typed into this field by the user. If
	* this field does not have a maximum length, `undefined` is returned.
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* const maxLength = textField.getMaxLength()
	* if (maxLength === undefined) console.log('No max length')
	* else console.log(`Max length is ${maxLength}`)
	* ```
	* @returns The maximum number of characters allowed in this field, or
	*          `undefined` if no limit exists.
	*/
	PDFTextField.prototype.getMaxLength = function() {
		return this.acroField.getMaxLength();
	};
	/**
	* Set the maximum length of this field. This limits the number of characters
	* that can be typed into this field by the user. This also limits the length
	* of the string that can be passed to [[PDFTextField.setText]]. This limit
	* can be removed by passing `undefined` as `maxLength`. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	*
	* // Allow between 0 and 5 characters to be entered
	* textField.setMaxLength(5)
	*
	* // Allow any number of characters to be entered
	* textField.setMaxLength(undefined)
	* ```
	* This method will mark this text field as dirty. See
	* [[PDFTextField.setText]] for more details about what this means.
	* @param maxLength The maximum number of characters allowed in this field, or
	*                  `undefined` to remove the limit.
	*/
	PDFTextField.prototype.setMaxLength = function(maxLength) {
		assertRangeOrUndefined(maxLength, "maxLength", 0, Number.MAX_SAFE_INTEGER);
		this.markAsDirty();
		if (maxLength === void 0) this.acroField.removeMaxLength();
		else {
			var text = this.getText();
			if (text && text.length > maxLength) throw new InvalidMaxLengthError(text.length, maxLength, this.getName());
			this.acroField.setMaxLength(maxLength);
		}
	};
	/**
	* Remove the maximum length for this text field. This allows any number of
	* characters to be typed into this field by the user. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.removeMaxLength()
	* ```
	* Calling this method is equivalent to passing `undefined` to
	* [[PDFTextField.setMaxLength]].
	*/
	PDFTextField.prototype.removeMaxLength = function() {
		this.markAsDirty();
		this.acroField.removeMaxLength();
	};
	/**
	* Display an image inside the bounds of this text field's widgets. For example:
	* ```js
	* const pngImage = await pdfDoc.embedPng(...)
	* const textField = form.getTextField('some.text.field')
	* textField.setImage(pngImage)
	* ```
	* This will update the appearances streams for each of this text field's widgets.
	* @param image The image that should be displayed.
	*/
	PDFTextField.prototype.setImage = function(image) {
		var fieldAlignment = this.getAlignment();
		var alignment = fieldAlignment === TextAlignment.Center ? ImageAlignment.Center : fieldAlignment === TextAlignment.Right ? ImageAlignment.Right : ImageAlignment.Left;
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			var streamRef = this.createImageAppearanceStream(widget, image, alignment);
			this.updateWidgetAppearances(widget, { normal: streamRef });
		}
		this.markAsClean();
	};
	/**
	* Set the font size for this field. Larger font sizes will result in larger
	* text being displayed when PDF readers render this text field. Font sizes
	* may be integer or floating point numbers. Supplying a negative font size
	* will cause this method to throw an error.
	*
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.setFontSize(4)
	* textField.setFontSize(15.7)
	* ```
	*
	* > This method depends upon the existence of a default appearance
	* > (`/DA`) string. If this field does not have a default appearance string,
	* > or that string does not contain a font size (via the `Tf` operator),
	* > then this method will throw an error.
	*
	* @param fontSize The font size to be used when rendering text in this field.
	*/
	PDFTextField.prototype.setFontSize = function(fontSize) {
		assertPositive(fontSize, "fontSize");
		this.acroField.setFontSize(fontSize);
		this.markAsDirty();
	};
	/**
	* Returns `true` if each line of text is shown on a new line when this
	* field is displayed in a PDF reader. The alternative is that all lines of
	* text are merged onto a single line when displayed. See
	* [[PDFTextField.enableMultiline]] and [[PDFTextField.disableMultiline]].
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* if (textField.isMultiline()) console.log('Multiline is enabled')
	* ```
	* @returns Whether or not this is a multiline text field.
	*/
	PDFTextField.prototype.isMultiline = function() {
		return this.acroField.hasFlag(AcroTextFlags.Multiline);
	};
	/**
	* Display each line of text on a new line when this field is displayed in a
	* PDF reader. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.enableMultiline()
	* ```
	* This method will mark this text field as dirty. See
	* [[PDFTextField.setText]] for more details about what this means.
	*/
	PDFTextField.prototype.enableMultiline = function() {
		this.markAsDirty();
		this.acroField.setFlagTo(AcroTextFlags.Multiline, true);
	};
	/**
	* Display each line of text on the same line when this field is displayed
	* in a PDF reader. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.disableMultiline()
	* ```
	* This method will mark this text field as dirty. See
	* [[PDFTextField.setText]] for more details about what this means.
	*/
	PDFTextField.prototype.disableMultiline = function() {
		this.markAsDirty();
		this.acroField.setFlagTo(AcroTextFlags.Multiline, false);
	};
	/**
	* Returns `true` if this is a password text field. This means that the field
	* is intended for storing a secure password. See
	* [[PDFTextField.enablePassword]] and [[PDFTextField.disablePassword]].
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* if (textField.isPassword()) console.log('Password is enabled')
	* ```
	* @returns Whether or not this is a password text field.
	*/
	PDFTextField.prototype.isPassword = function() {
		return this.acroField.hasFlag(AcroTextFlags.Password);
	};
	/**
	* Indicate that this text field is intended for storing a secure password.
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.enablePassword()
	* ```
	* Values entered into password text fields should not be displayed on the
	* screen by PDF readers. Most PDF readers will display the value as
	* asterisks or bullets. PDF readers should never store values entered by the
	* user into password text fields. Similarly, applications should not
	* write data to a password text field.
	*
	* **Please note that this method does not cause entered values to be
	* encrypted or secured in any way! It simply sets a flag that PDF software
	* and readers can access to determine the _purpose_ of this field.**
	*/
	PDFTextField.prototype.enablePassword = function() {
		this.acroField.setFlagTo(AcroTextFlags.Password, true);
	};
	/**
	* Indicate that this text field is **not** intended for storing a secure
	* password. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.disablePassword()
	* ```
	*/
	PDFTextField.prototype.disablePassword = function() {
		this.acroField.setFlagTo(AcroTextFlags.Password, false);
	};
	/**
	* Returns `true` if the contents of this text field represent a file path.
	* See [[PDFTextField.enableFileSelection]] and
	* [[PDFTextField.disableFileSelection]]. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* if (textField.isFileSelector()) console.log('Is a file selector')
	* ```
	* @returns Whether or not this field should contain file paths.
	*/
	PDFTextField.prototype.isFileSelector = function() {
		return this.acroField.hasFlag(AcroTextFlags.FileSelect);
	};
	/**
	* Indicate that this text field is intended to store a file path. The
	* contents of the file stored at that path should be submitted as the value
	* of the field. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.enableFileSelection()
	* ```
	*/
	PDFTextField.prototype.enableFileSelection = function() {
		this.acroField.setFlagTo(AcroTextFlags.FileSelect, true);
	};
	/**
	* Indicate that this text field is **not** intended to store a file path.
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.disableFileSelection()
	* ```
	*/
	PDFTextField.prototype.disableFileSelection = function() {
		this.acroField.setFlagTo(AcroTextFlags.FileSelect, false);
	};
	/**
	* Returns `true` if the text entered in this field should be spell checked
	* by PDF readers. See [[PDFTextField.enableSpellChecking]] and
	* [[PDFTextField.disableSpellChecking]]. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* if (textField.isSpellChecked()) console.log('Spell checking is enabled')
	* ```
	* @returns Whether or not this field should be spell checked.
	*/
	PDFTextField.prototype.isSpellChecked = function() {
		return !this.acroField.hasFlag(AcroTextFlags.DoNotSpellCheck);
	};
	/**
	* Allow PDF readers to spell check the text entered in this field.
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.enableSpellChecking()
	* ```
	*/
	PDFTextField.prototype.enableSpellChecking = function() {
		this.acroField.setFlagTo(AcroTextFlags.DoNotSpellCheck, false);
	};
	/**
	* Do not allow PDF readers to spell check the text entered in this field.
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.disableSpellChecking()
	* ```
	*/
	PDFTextField.prototype.disableSpellChecking = function() {
		this.acroField.setFlagTo(AcroTextFlags.DoNotSpellCheck, true);
	};
	/**
	* Returns `true` if PDF readers should allow the user to scroll the text
	* field when its contents do not fit within the field's view bounds. See
	* [[PDFTextField.enableScrolling]] and [[PDFTextField.disableScrolling]].
	* For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* if (textField.isScrollable()) console.log('Scrolling is enabled')
	* ```
	* @returns Whether or not the field is scrollable in PDF readers.
	*/
	PDFTextField.prototype.isScrollable = function() {
		return !this.acroField.hasFlag(AcroTextFlags.DoNotScroll);
	};
	/**
	* Allow PDF readers to present a scroll bar to the user when the contents
	* of this text field do not fit within its view bounds. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.enableScrolling()
	* ```
	* A horizontal scroll bar should be shown for singleline fields. A vertical
	* scroll bar should be shown for multiline fields.
	*/
	PDFTextField.prototype.enableScrolling = function() {
		this.acroField.setFlagTo(AcroTextFlags.DoNotScroll, false);
	};
	/**
	* Do not allow PDF readers to present a scroll bar to the user when the
	* contents of this text field do not fit within its view bounds. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.disableScrolling()
	* ```
	*/
	PDFTextField.prototype.disableScrolling = function() {
		this.acroField.setFlagTo(AcroTextFlags.DoNotScroll, true);
	};
	/**
	* Returns `true` if this is a combed text field. This means that the field
	* is split into `n` equal size cells with one character in each (where `n`
	* is equal to the max length of the text field). The result is that all
	* characters in this field are displayed an equal distance apart from one
	* another. See [[PDFTextField.enableCombing]] and
	* [[PDFTextField.disableCombing]]. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* if (textField.isCombed()) console.log('Combing is enabled')
	* ```
	* Note that in order for a text field to be combed, the following must be
	* true (in addition to enabling combing):
	* * It must not be a multiline field (see [[PDFTextField.isMultiline]])
	* * It must not be a password field (see [[PDFTextField.isPassword]])
	* * It must not be a file selector field (see [[PDFTextField.isFileSelector]])
	* * It must have a max length defined (see [[PDFTextField.setMaxLength]])
	* @returns Whether or not this field is combed.
	*/
	PDFTextField.prototype.isCombed = function() {
		return this.acroField.hasFlag(AcroTextFlags.Comb) && !this.isMultiline() && !this.isPassword() && !this.isFileSelector() && this.getMaxLength() !== void 0;
	};
	/**
	* Split this field into `n` equal size cells with one character in each
	* (where `n` is equal to the max length of the text field). This will cause
	* all characters in the field to be displayed an equal distance apart from
	* one another. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.enableCombing()
	* ```
	*
	* In addition to calling this method, text fields must have a max length
	* defined in order to be combed (see [[PDFTextField.setMaxLength]]).
	*
	* This method will also call the following three methods internally:
	* * [[PDFTextField.disableMultiline]]
	* * [[PDFTextField.disablePassword]]
	* * [[PDFTextField.disableFileSelection]]
	*
	* This method will mark this text field as dirty. See
	* [[PDFTextField.setText]] for more details about what this means.
	*/
	PDFTextField.prototype.enableCombing = function() {
		if (this.getMaxLength() === void 0) console.warn("PDFTextFields must have a max length in order to be combed");
		this.markAsDirty();
		this.disableMultiline();
		this.disablePassword();
		this.disableFileSelection();
		this.acroField.setFlagTo(AcroTextFlags.Comb, true);
	};
	/**
	* Turn off combing for this text field. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.disableCombing()
	* ```
	* See [[PDFTextField.isCombed]] and [[PDFTextField.enableCombing]] for more
	* information about what combing is.
	*
	* This method will mark this text field as dirty. See
	* [[PDFTextField.setText]] for more details about what this means.
	*/
	PDFTextField.prototype.disableCombing = function() {
		this.markAsDirty();
		this.acroField.setFlagTo(AcroTextFlags.Comb, false);
	};
	/**
	* Returns `true` if this text field contains rich text. See
	* [[PDFTextField.enableRichFormatting]] and
	* [[PDFTextField.disableRichFormatting]]. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* if (textField.isRichFormatted()) console.log('Rich formatting enabled')
	* ```
	* @returns Whether or not this field contains rich text.
	*/
	PDFTextField.prototype.isRichFormatted = function() {
		return this.acroField.hasFlag(AcroTextFlags.RichText);
	};
	/**
	* Indicate that this field contains XFA data - or rich text. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.enableRichFormatting()
	* ```
	* Note that `pdf-lib` does not support reading or writing rich text fields.
	* Nor do most PDF readers and writers. Rich text fields are based on XFA
	* (XML Forms Architecture). Relatively few PDFs use rich text fields or XFA.
	* Unlike PDF itself, XFA is not an ISO standard. XFA has been deprecated in
	* PDF 2.0:
	* * https://en.wikipedia.org/wiki/XFA
	* * http://blog.pdfshareforms.com/pdf-2-0-release-bid-farewell-xfa-forms/
	*/
	PDFTextField.prototype.enableRichFormatting = function() {
		this.acroField.setFlagTo(AcroTextFlags.RichText, true);
	};
	/**
	* Indicate that this is a standard text field that does not XFA data (rich
	* text). For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* textField.disableRichFormatting()
	* ```
	*/
	PDFTextField.prototype.disableRichFormatting = function() {
		this.acroField.setFlagTo(AcroTextFlags.RichText, false);
	};
	/**
	* Show this text field on the specified page. For example:
	* ```js
	* const ubuntuFont = await pdfDoc.embedFont(ubuntuFontBytes)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const textField = form.createTextField('best.gundam')
	* textField.setText('Exia')
	*
	* textField.addToPage(page, {
	*   x: 50,
	*   y: 75,
	*   width: 200,
	*   height: 100,
	*   textColor: rgb(1, 0, 0),
	*   backgroundColor: rgb(0, 1, 0),
	*   borderColor: rgb(0, 0, 1),
	*   borderWidth: 2,
	*   rotate: degrees(90),
	*   font: ubuntuFont,
	* })
	* ```
	* This will create a new widget for this text field.
	* @param page The page to which this text field widget should be added.
	* @param options The options to be used when adding this text field widget.
	*/
	PDFTextField.prototype.addToPage = function(page, options) {
		var _a, _b, _c, _d, _e, _f, _g;
		assertIs(page, "page", [[PDFPage, "PDFPage"]]);
		assertFieldAppearanceOptions(options);
		if (!options) options = {};
		if (!("textColor" in options)) options.textColor = rgb(0, 0, 0);
		if (!("backgroundColor" in options)) options.backgroundColor = rgb(1, 1, 1);
		if (!("borderColor" in options)) options.borderColor = rgb(0, 0, 0);
		if (!("borderWidth" in options)) options.borderWidth = 1;
		var widget = this.createWidget({
			x: (_a = options.x) !== null && _a !== void 0 ? _a : 0,
			y: (_b = options.y) !== null && _b !== void 0 ? _b : 0,
			width: (_c = options.width) !== null && _c !== void 0 ? _c : 200,
			height: (_d = options.height) !== null && _d !== void 0 ? _d : 50,
			textColor: options.textColor,
			backgroundColor: options.backgroundColor,
			borderColor: options.borderColor,
			borderWidth: (_e = options.borderWidth) !== null && _e !== void 0 ? _e : 0,
			rotate: (_f = options.rotate) !== null && _f !== void 0 ? _f : degrees(0),
			hidden: options.hidden,
			page: page.ref
		});
		var widgetRef = this.doc.context.register(widget.dict);
		this.acroField.addWidget(widgetRef);
		var font = (_g = options.font) !== null && _g !== void 0 ? _g : this.doc.getForm().getDefaultFont();
		this.updateWidgetAppearance(widget, font);
		page.node.addAnnot(widgetRef);
	};
	/**
	* Returns `true` if this text field has been marked as dirty, or if any of
	* this text field's widgets do not have an appearance stream. For example:
	* ```js
	* const textField = form.getTextField('some.text.field')
	* if (textField.needsAppearancesUpdate()) console.log('Needs update')
	* ```
	* @returns Whether or not this text field needs an appearance update.
	*/
	PDFTextField.prototype.needsAppearancesUpdate = function() {
		var _a;
		if (this.isDirty()) return true;
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) if (!(((_a = widgets[idx].getAppearances()) === null || _a === void 0 ? void 0 : _a.normal) instanceof PDFStream)) return true;
		return false;
	};
	/**
	* Update the appearance streams for each of this text field's widgets using
	* the default appearance provider for text fields. For example:
	* ```js
	* const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const textField = form.getTextField('some.text.field')
	* textField.defaultUpdateAppearances(helvetica)
	* ```
	* @param font The font to be used for creating the appearance streams.
	*/
	PDFTextField.prototype.defaultUpdateAppearances = function(font) {
		assertIs(font, "font", [[PDFFont, "PDFFont"]]);
		this.updateAppearances(font);
	};
	/**
	* Update the appearance streams for each of this text field's widgets using
	* the given appearance provider. If no `provider` is passed, the default
	* appearance provider for text fields will be used. For example:
	* ```js
	* const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const textField = form.getTextField('some.text.field')
	* textField.updateAppearances(helvetica, (field, widget, font) => {
	*   ...
	*   return drawTextField(...)
	* })
	* ```
	* @param font The font to be used for creating the appearance streams.
	* @param provider Optionally, the appearance provider to be used for
	*                 generating the contents of the appearance streams.
	*/
	PDFTextField.prototype.updateAppearances = function(font, provider) {
		assertIs(font, "font", [[PDFFont, "PDFFont"]]);
		assertOrUndefined(provider, "provider", [Function]);
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			this.updateWidgetAppearance(widget, font, provider);
		}
		this.markAsClean();
	};
	PDFTextField.prototype.updateWidgetAppearance = function(widget, font, provider) {
		var appearances = normalizeAppearance((provider !== null && provider !== void 0 ? provider : defaultTextFieldAppearanceProvider)(this, widget, font));
		this.updateWidgetAppearanceWithFont(widget, font, appearances);
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFForm.getTextField]] method, which will create an
	* > instance of [[PDFTextField]] for you.
	*
	* Create an instance of [[PDFTextField]] from an existing acroText and ref
	*
	* @param acroText The underlying `PDFAcroText` for this text field.
	* @param ref The unique reference for this text field.
	* @param doc The document to which this text field will belong.
	*/
	PDFTextField.of = function(acroText, ref, doc) {
		return new PDFTextField(acroText, ref, doc);
	};
	return PDFTextField;
}(PDFField);
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/StandardFonts.js
var StandardFonts;
(function(StandardFonts) {
	StandardFonts["Courier"] = "Courier";
	StandardFonts["CourierBold"] = "Courier-Bold";
	StandardFonts["CourierOblique"] = "Courier-Oblique";
	StandardFonts["CourierBoldOblique"] = "Courier-BoldOblique";
	StandardFonts["Helvetica"] = "Helvetica";
	StandardFonts["HelveticaBold"] = "Helvetica-Bold";
	StandardFonts["HelveticaOblique"] = "Helvetica-Oblique";
	StandardFonts["HelveticaBoldOblique"] = "Helvetica-BoldOblique";
	StandardFonts["TimesRoman"] = "Times-Roman";
	StandardFonts["TimesRomanBold"] = "Times-Bold";
	StandardFonts["TimesRomanItalic"] = "Times-Italic";
	StandardFonts["TimesRomanBoldItalic"] = "Times-BoldItalic";
	StandardFonts["Symbol"] = "Symbol";
	StandardFonts["ZapfDingbats"] = "ZapfDingbats";
})(StandardFonts || (StandardFonts = {}));
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/PDFForm.js
/**
* Represents the interactive form of a [[PDFDocument]].
*
* Interactive forms (sometimes called _AcroForms_) are collections of fields
* designed to gather information from a user. A PDF document may contains any
* number of fields that appear on various pages, all of which make up a single,
* global interactive form spanning the entire document. This means that
* instances of [[PDFDocument]] shall contain at most one [[PDFForm]].
*
* The fields of an interactive form are represented by [[PDFField]] instances.
*/
var PDFForm = function() {
	function PDFForm(acroForm, doc) {
		var _this = this;
		this.embedDefaultFont = function() {
			return _this.doc.embedStandardFont(StandardFonts.Helvetica);
		};
		assertIs(acroForm, "acroForm", [[PDFAcroForm, "PDFAcroForm"]]);
		assertIs(doc, "doc", [[PDFDocument, "PDFDocument"]]);
		this.acroForm = acroForm;
		this.doc = doc;
		this.dirtyFields = /* @__PURE__ */ new Set();
		this.defaultFontCache = Cache.populatedBy(this.embedDefaultFont);
	}
	/**
	* Returns `true` if this [[PDFForm]] has XFA data. Most PDFs with form
	* fields do not use XFA as it is not widely supported by PDF readers.
	*
	* > `pdf-lib` does not support creation, modification, or reading of XFA
	* > fields.
	*
	* For example:
	* ```js
	* const form = pdfDoc.getForm()
	* if (form.hasXFA()) console.log('PDF has XFA data')
	* ```
	* @returns Whether or not this form has XFA data.
	*/
	PDFForm.prototype.hasXFA = function() {
		return this.acroForm.dict.has(PDFName.of("XFA"));
	};
	/**
	* Disconnect the XFA data from this [[PDFForm]] (if any exists). This will
	* force readers to fallback to standard fields if the [[PDFDocument]]
	* contains any. For example:
	*
	* For example:
	* ```js
	* const form = pdfDoc.getForm()
	* form.deleteXFA()
	* ```
	*/
	PDFForm.prototype.deleteXFA = function() {
		this.acroForm.dict.delete(PDFName.of("XFA"));
	};
	/**
	* Get all fields contained in this [[PDFForm]]. For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const fields = form.getFields()
	* fields.forEach(field => {
	*   const type = field.constructor.name
	*   const name = field.getName()
	*   console.log(`${type}: ${name}`)
	* })
	* ```
	* @returns An array of all fields in this form.
	*/
	PDFForm.prototype.getFields = function() {
		var allFields = this.acroForm.getAllFields();
		var fields = [];
		for (var idx = 0, len = allFields.length; idx < len; idx++) {
			var _a = allFields[idx], acroField = _a[0], ref = _a[1];
			var field = convertToPDFField(acroField, ref, this.doc);
			if (field) fields.push(field);
		}
		return fields;
	};
	/**
	* Get the field in this [[PDFForm]] with the given name. For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const field = form.getFieldMaybe('Page1.Foo.Bar[0]')
	* if (field) console.log('Field exists!')
	* ```
	* @param name A fully qualified field name.
	* @returns The field with the specified name, if one exists.
	*/
	PDFForm.prototype.getFieldMaybe = function(name) {
		assertIs(name, "name", ["string"]);
		var fields = this.getFields();
		for (var idx = 0, len = fields.length; idx < len; idx++) {
			var field = fields[idx];
			if (field.getName() === name) return field;
		}
	};
	/**
	* Get the field in this [[PDFForm]] with the given name. For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const field = form.getField('Page1.Foo.Bar[0]')
	* ```
	* If no field exists with the provided name, an error will be thrown.
	* @param name A fully qualified field name.
	* @returns The field with the specified name.
	*/
	PDFForm.prototype.getField = function(name) {
		assertIs(name, "name", ["string"]);
		var field = this.getFieldMaybe(name);
		if (field) return field;
		throw new NoSuchFieldError(name);
	};
	/**
	* Get the button field in this [[PDFForm]] with the given name. For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const button = form.getButton('Page1.Foo.Button[0]')
	* ```
	* An error will be thrown if no field exists with the provided name, or if
	* the field exists but is not a button.
	* @param name A fully qualified button name.
	* @returns The button with the specified name.
	*/
	PDFForm.prototype.getButton = function(name) {
		assertIs(name, "name", ["string"]);
		var field = this.getField(name);
		if (field instanceof PDFButton) return field;
		throw new UnexpectedFieldTypeError(name, PDFButton, field);
	};
	/**
	* Get the check box field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const checkBox = form.getCheckBox('Page1.Foo.CheckBox[0]')
	* checkBox.check()
	* ```
	* An error will be thrown if no field exists with the provided name, or if
	* the field exists but is not a check box.
	* @param name A fully qualified check box name.
	* @returns The check box with the specified name.
	*/
	PDFForm.prototype.getCheckBox = function(name) {
		assertIs(name, "name", ["string"]);
		var field = this.getField(name);
		if (field instanceof PDFCheckBox) return field;
		throw new UnexpectedFieldTypeError(name, PDFCheckBox, field);
	};
	/**
	* Get the dropdown field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const dropdown = form.getDropdown('Page1.Foo.Dropdown[0]')
	* const options = dropdown.getOptions()
	* dropdown.select(options[0])
	* ```
	* An error will be thrown if no field exists with the provided name, or if
	* the field exists but is not a dropdown.
	* @param name A fully qualified dropdown name.
	* @returns The dropdown with the specified name.
	*/
	PDFForm.prototype.getDropdown = function(name) {
		assertIs(name, "name", ["string"]);
		var field = this.getField(name);
		if (field instanceof PDFDropdown) return field;
		throw new UnexpectedFieldTypeError(name, PDFDropdown, field);
	};
	/**
	* Get the option list field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const optionList = form.getOptionList('Page1.Foo.OptionList[0]')
	* const options = optionList.getOptions()
	* optionList.select(options[0])
	* ```
	* An error will be thrown if no field exists with the provided name, or if
	* the field exists but is not an option list.
	* @param name A fully qualified option list name.
	* @returns The option list with the specified name.
	*/
	PDFForm.prototype.getOptionList = function(name) {
		assertIs(name, "name", ["string"]);
		var field = this.getField(name);
		if (field instanceof PDFOptionList) return field;
		throw new UnexpectedFieldTypeError(name, PDFOptionList, field);
	};
	/**
	* Get the radio group field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const radioGroup = form.getRadioGroup('Page1.Foo.RadioGroup[0]')
	* const options = radioGroup.getOptions()
	* radioGroup.select(options[0])
	* ```
	* An error will be thrown if no field exists with the provided name, or if
	* the field exists but is not a radio group.
	* @param name A fully qualified radio group name.
	* @returns The radio group with the specified name.
	*/
	PDFForm.prototype.getRadioGroup = function(name) {
		assertIs(name, "name", ["string"]);
		var field = this.getField(name);
		if (field instanceof PDFRadioGroup) return field;
		throw new UnexpectedFieldTypeError(name, PDFRadioGroup, field);
	};
	/**
	* Get the signature field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const signature = form.getSignature('Page1.Foo.Signature[0]')
	* ```
	* An error will be thrown if no field exists with the provided name, or if
	* the field exists but is not a signature.
	* @param name A fully qualified signature name.
	* @returns The signature with the specified name.
	*/
	PDFForm.prototype.getSignature = function(name) {
		assertIs(name, "name", ["string"]);
		var field = this.getField(name);
		if (field instanceof PDFSignature) return field;
		throw new UnexpectedFieldTypeError(name, PDFSignature, field);
	};
	/**
	* Get the text field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const textField = form.getTextField('Page1.Foo.TextField[0]')
	* textField.setText('Are you designed to act or to be acted upon?')
	* ```
	* An error will be thrown if no field exists with the provided name, or if
	* the field exists but is not a text field.
	* @param name A fully qualified text field name.
	* @returns The text field with the specified name.
	*/
	PDFForm.prototype.getTextField = function(name) {
		assertIs(name, "name", ["string"]);
		var field = this.getField(name);
		if (field instanceof PDFTextField) return field;
		throw new UnexpectedFieldTypeError(name, PDFTextField, field);
	};
	/**
	* Create a new button field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const button = form.createButton('cool.new.button')
	*
	* button.addToPage('Do Stuff', font, page)
	* ```
	* An error will be thrown if a field already exists with the provided name.
	* @param name The fully qualified name for the new button.
	* @returns The new button field.
	*/
	PDFForm.prototype.createButton = function(name) {
		assertIs(name, "name", ["string"]);
		var nameParts = splitFieldName(name);
		var parent = this.findOrCreateNonTerminals(nameParts.nonTerminal);
		var button = PDFAcroPushButton.create(this.doc.context);
		button.setPartialName(nameParts.terminal);
		addFieldToParent(parent, [button, button.ref], nameParts.terminal);
		return PDFButton.of(button, button.ref, this.doc);
	};
	/**
	* Create a new check box field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const checkBox = form.createCheckBox('cool.new.checkBox')
	*
	* checkBox.addToPage(page)
	* ```
	* An error will be thrown if a field already exists with the provided name.
	* @param name The fully qualified name for the new check box.
	* @returns The new check box field.
	*/
	PDFForm.prototype.createCheckBox = function(name) {
		assertIs(name, "name", ["string"]);
		var nameParts = splitFieldName(name);
		var parent = this.findOrCreateNonTerminals(nameParts.nonTerminal);
		var checkBox = PDFAcroCheckBox.create(this.doc.context);
		checkBox.setPartialName(nameParts.terminal);
		addFieldToParent(parent, [checkBox, checkBox.ref], nameParts.terminal);
		return PDFCheckBox.of(checkBox, checkBox.ref, this.doc);
	};
	/**
	* Create a new dropdown field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const dropdown = form.createDropdown('cool.new.dropdown')
	*
	* dropdown.addToPage(font, page)
	* ```
	* An error will be thrown if a field already exists with the provided name.
	* @param name The fully qualified name for the new dropdown.
	* @returns The new dropdown field.
	*/
	PDFForm.prototype.createDropdown = function(name) {
		assertIs(name, "name", ["string"]);
		var nameParts = splitFieldName(name);
		var parent = this.findOrCreateNonTerminals(nameParts.nonTerminal);
		var comboBox = PDFAcroComboBox.create(this.doc.context);
		comboBox.setPartialName(nameParts.terminal);
		addFieldToParent(parent, [comboBox, comboBox.ref], nameParts.terminal);
		return PDFDropdown.of(comboBox, comboBox.ref, this.doc);
	};
	/**
	* Create a new option list field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const optionList = form.createOptionList('cool.new.optionList')
	*
	* optionList.addToPage(font, page)
	* ```
	* An error will be thrown if a field already exists with the provided name.
	* @param name The fully qualified name for the new option list.
	* @returns The new option list field.
	*/
	PDFForm.prototype.createOptionList = function(name) {
		assertIs(name, "name", ["string"]);
		var nameParts = splitFieldName(name);
		var parent = this.findOrCreateNonTerminals(nameParts.nonTerminal);
		var listBox = PDFAcroListBox.create(this.doc.context);
		listBox.setPartialName(nameParts.terminal);
		addFieldToParent(parent, [listBox, listBox.ref], nameParts.terminal);
		return PDFOptionList.of(listBox, listBox.ref, this.doc);
	};
	/**
	* Create a new radio group field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const radioGroup = form.createRadioGroup('cool.new.radioGroup')
	*
	* radioGroup.addOptionToPage('is-dog', page, { y: 0 })
	* radioGroup.addOptionToPage('is-cat', page, { y: 75 })
	* ```
	* An error will be thrown if a field already exists with the provided name.
	* @param name The fully qualified name for the new radio group.
	* @returns The new radio group field.
	*/
	PDFForm.prototype.createRadioGroup = function(name) {
		assertIs(name, "name", ["string"]);
		var nameParts = splitFieldName(name);
		var parent = this.findOrCreateNonTerminals(nameParts.nonTerminal);
		var radioButton = PDFAcroRadioButton.create(this.doc.context);
		radioButton.setPartialName(nameParts.terminal);
		addFieldToParent(parent, [radioButton, radioButton.ref], nameParts.terminal);
		return PDFRadioGroup.of(radioButton, radioButton.ref, this.doc);
	};
	/**
	* Create a new text field in this [[PDFForm]] with the given name.
	* For example:
	* ```js
	* const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const textField = form.createTextField('cool.new.textField')
	*
	* textField.addToPage(font, page)
	* ```
	* An error will be thrown if a field already exists with the provided name.
	* @param name The fully qualified name for the new radio group.
	* @returns The new radio group field.
	*/
	PDFForm.prototype.createTextField = function(name) {
		assertIs(name, "name", ["string"]);
		var nameParts = splitFieldName(name);
		var parent = this.findOrCreateNonTerminals(nameParts.nonTerminal);
		var text = PDFAcroText.create(this.doc.context);
		text.setPartialName(nameParts.terminal);
		addFieldToParent(parent, [text, text.ref], nameParts.terminal);
		return PDFTextField.of(text, text.ref, this.doc);
	};
	/**
	* Flatten all fields in this [[PDFForm]].
	*
	* Flattening a form field will take the current appearance for each of that
	* field's widgets and make them part of their page's content stream. All form
	* fields and annotations associated are then removed. Note that once a form
	* has been flattened its fields can no longer be accessed or edited.
	*
	* This operation is often used after filling form fields to ensure a
	* consistent appearance across different PDF readers and/or printers.
	* Another common use case is to copy a template document with form fields
	* into another document. In this scenario you would load the template
	* document, fill its fields, flatten it, and then copy its pages into the
	* recipient document - the filled fields will be copied over.
	*
	* For example:
	* ```js
	* const form = pdfDoc.getForm();
	* form.flatten();
	* ```
	*/
	PDFForm.prototype.flatten = function(options) {
		if (options === void 0) options = { updateFieldAppearances: true };
		if (options.updateFieldAppearances) this.updateFieldAppearances();
		var fields = this.getFields();
		for (var i = 0, lenFields = fields.length; i < lenFields; i++) {
			var field = fields[i];
			var widgets = field.acroField.getWidgets();
			for (var j = 0, lenWidgets = widgets.length; j < lenWidgets; j++) {
				var widget = widgets[j];
				var page = this.findWidgetPage(widget);
				var widgetRef = this.findWidgetAppearanceRef(field, widget);
				var xObjectKey = page.node.newXObject("FlatWidget", widgetRef);
				var rectangle = widget.getRectangle();
				var operators = __spreadArrays([pushGraphicsState(), translate(rectangle.x, rectangle.y)], rotateInPlace(__assign(__assign({}, rectangle), { rotation: 0 })), [drawObject(xObjectKey), popGraphicsState()]).filter(Boolean);
				page.pushOperators.apply(page, operators);
			}
			this.removeField(field);
		}
	};
	/**
	* Remove a field from this [[PDFForm]].
	*
	* For example:
	* ```js
	* const form = pdfDoc.getForm();
	* const ageField = form.getFields().find(x => x.getName() === 'Age');
	* form.removeField(ageField);
	* ```
	*/
	PDFForm.prototype.removeField = function(field) {
		var widgets = field.acroField.getWidgets();
		var pages = /* @__PURE__ */ new Set();
		for (var i = 0, len = widgets.length; i < len; i++) {
			var widget = widgets[i];
			var widgetRef = this.findWidgetAppearanceRef(field, widget);
			var page = this.findWidgetPage(widget);
			pages.add(page);
			page.node.removeAnnot(widgetRef);
		}
		pages.forEach(function(page) {
			return page.node.removeAnnot(field.ref);
		});
		this.acroForm.removeField(field.acroField);
		var fieldKids = field.acroField.normalizedEntries().Kids;
		var kidsCount = fieldKids.size();
		for (var childIndex = 0; childIndex < kidsCount; childIndex++) {
			var child = fieldKids.get(childIndex);
			if (child instanceof PDFRef) this.doc.context.delete(child);
		}
		this.doc.context.delete(field.ref);
	};
	/**
	* Update the appearance streams for all widgets of all fields in this
	* [[PDFForm]]. Appearance streams will only be created for a widget if it
	* does not have any existing appearance streams, or the field's value has
	* changed (e.g. by calling [[PDFTextField.setText]] or
	* [[PDFDropdown.select]]).
	*
	* For example:
	* ```js
	* const courier = await pdfDoc.embedFont(StandardFonts.Courier)
	* const form = pdfDoc.getForm()
	* form.updateFieldAppearances(courier)
	* ```
	*
	* **IMPORTANT:** The default value for the `font` parameter is
	* [[StandardFonts.Helvetica]]. Note that this is a WinAnsi font. This means
	* that encoding errors will be thrown if any fields contain text with
	* characters outside the WinAnsi character set (the latin alphabet).
	*
	* Embedding a custom font and passing that as the `font`
	* parameter allows you to generate appearance streams with non WinAnsi
	* characters (assuming your custom font supports them).
	*
	* > **NOTE:** The [[PDFDocument.save]] method will call this method to
	* > update appearances automatically if a form was accessed via the
	* > [[PDFDocument.getForm]] method prior to saving.
	*
	* @param font Optionally, the font to use when creating new appearances.
	*/
	PDFForm.prototype.updateFieldAppearances = function(font) {
		assertOrUndefined(font, "font", [[PDFFont, "PDFFont"]]);
		font = font !== null && font !== void 0 ? font : this.getDefaultFont();
		var fields = this.getFields();
		for (var idx = 0, len = fields.length; idx < len; idx++) {
			var field = fields[idx];
			if (field.needsAppearancesUpdate()) field.defaultUpdateAppearances(font);
		}
	};
	/**
	* Mark a field as dirty. This will cause its appearance streams to be
	* updated by [[PDFForm.updateFieldAppearances]].
	* ```js
	* const form = pdfDoc.getForm()
	* const field = form.getField('foo.bar')
	* form.markFieldAsDirty(field.ref)
	* ```
	* @param fieldRef The reference to the field that should be marked.
	*/
	PDFForm.prototype.markFieldAsDirty = function(fieldRef) {
		assertOrUndefined(fieldRef, "fieldRef", [[PDFRef, "PDFRef"]]);
		this.dirtyFields.add(fieldRef);
	};
	/**
	* Mark a field as dirty. This will cause its appearance streams to not be
	* updated by [[PDFForm.updateFieldAppearances]].
	* ```js
	* const form = pdfDoc.getForm()
	* const field = form.getField('foo.bar')
	* form.markFieldAsClean(field.ref)
	* ```
	* @param fieldRef The reference to the field that should be marked.
	*/
	PDFForm.prototype.markFieldAsClean = function(fieldRef) {
		assertOrUndefined(fieldRef, "fieldRef", [[PDFRef, "PDFRef"]]);
		this.dirtyFields.delete(fieldRef);
	};
	/**
	* Returns `true` is the specified field has been marked as dirty.
	* ```js
	* const form = pdfDoc.getForm()
	* const field = form.getField('foo.bar')
	* if (form.fieldIsDirty(field.ref)) console.log('Field is dirty')
	* ```
	* @param fieldRef The reference to the field that should be checked.
	* @returns Whether or not the specified field is dirty.
	*/
	PDFForm.prototype.fieldIsDirty = function(fieldRef) {
		assertOrUndefined(fieldRef, "fieldRef", [[PDFRef, "PDFRef"]]);
		return this.dirtyFields.has(fieldRef);
	};
	PDFForm.prototype.getDefaultFont = function() {
		return this.defaultFontCache.access();
	};
	PDFForm.prototype.findWidgetPage = function(widget) {
		var pageRef = widget.P();
		var page = this.doc.getPages().find(function(x) {
			return x.ref === pageRef;
		});
		if (page === void 0) {
			var widgetRef = this.doc.context.getObjectRef(widget.dict);
			if (widgetRef === void 0) throw new Error("Could not find PDFRef for PDFObject");
			page = this.doc.findPageForAnnotationRef(widgetRef);
			if (page === void 0) throw new Error("Could not find page for PDFRef " + widgetRef);
		}
		return page;
	};
	PDFForm.prototype.findWidgetAppearanceRef = function(field, widget) {
		var _a;
		var refOrDict = widget.getNormalAppearance();
		if (refOrDict instanceof PDFDict && (field instanceof PDFCheckBox || field instanceof PDFRadioGroup)) {
			var value = field.acroField.getValue();
			var ref = (_a = refOrDict.get(value)) !== null && _a !== void 0 ? _a : refOrDict.get(PDFName.of("Off"));
			if (ref instanceof PDFRef) refOrDict = ref;
		}
		if (!(refOrDict instanceof PDFRef)) {
			var name_1 = field.getName();
			throw new Error("Failed to extract appearance ref for: " + name_1);
		}
		return refOrDict;
	};
	PDFForm.prototype.findOrCreateNonTerminals = function(partialNames) {
		var nonTerminal = [this.acroForm];
		for (var idx = 0, len = partialNames.length; idx < len; idx++) {
			var namePart = partialNames[idx];
			if (!namePart) throw new InvalidFieldNamePartError(namePart);
			var parent_1 = nonTerminal[0], parentRef = nonTerminal[1];
			var res = this.findNonTerminal(namePart, parent_1);
			if (res) nonTerminal = res;
			else {
				var node = PDFAcroNonTerminal.create(this.doc.context);
				node.setPartialName(namePart);
				node.setParent(parentRef);
				var nodeRef = this.doc.context.register(node.dict);
				parent_1.addField(nodeRef);
				nonTerminal = [node, nodeRef];
			}
		}
		return nonTerminal;
	};
	PDFForm.prototype.findNonTerminal = function(partialName, parent) {
		var fields = parent instanceof PDFAcroForm ? this.acroForm.getFields() : createPDFAcroFields(parent.Kids());
		for (var idx = 0, len = fields.length; idx < len; idx++) {
			var _a = fields[idx], field = _a[0], ref = _a[1];
			if (field.getPartialName() === partialName) {
				if (field instanceof PDFAcroNonTerminal) return [field, ref];
				throw new FieldAlreadyExistsError(partialName);
			}
		}
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFDocument.getForm]] method, which will create an
	* > instance of [[PDFForm]] for you.
	*
	* Create an instance of [[PDFForm]] from an existing acroForm and embedder
	*
	* @param acroForm The underlying `PDFAcroForm` for this form.
	* @param doc The document to which the form will belong.
	*/
	PDFForm.of = function(acroForm, doc) {
		return new PDFForm(acroForm, doc);
	};
	return PDFForm;
}();
var convertToPDFField = function(field, ref, doc) {
	if (field instanceof PDFAcroPushButton) return PDFButton.of(field, ref, doc);
	if (field instanceof PDFAcroCheckBox) return PDFCheckBox.of(field, ref, doc);
	if (field instanceof PDFAcroComboBox) return PDFDropdown.of(field, ref, doc);
	if (field instanceof PDFAcroListBox) return PDFOptionList.of(field, ref, doc);
	if (field instanceof PDFAcroText) return PDFTextField.of(field, ref, doc);
	if (field instanceof PDFAcroRadioButton) return PDFRadioGroup.of(field, ref, doc);
	if (field instanceof PDFAcroSignature) return PDFSignature.of(field, ref, doc);
};
var splitFieldName = function(fullyQualifiedName) {
	if (fullyQualifiedName.length === 0) throw new Error("PDF field names must not be empty strings");
	var parts = fullyQualifiedName.split(".");
	for (var idx = 0, len = parts.length; idx < len; idx++) if (parts[idx] === "") throw new Error("Periods in PDF field names must be separated by at least one character: \"" + fullyQualifiedName + "\"");
	if (parts.length === 1) return {
		nonTerminal: [],
		terminal: parts[0]
	};
	return {
		nonTerminal: parts.slice(0, parts.length - 1),
		terminal: parts[parts.length - 1]
	};
};
var addFieldToParent = function(_a, _b, partialName) {
	var parent = _a[0], parentRef = _a[1];
	var field = _b[0], fieldRef = _b[1];
	var entries = parent.normalizedEntries();
	var fields = createPDFAcroFields("Kids" in entries ? entries.Kids : entries.Fields);
	for (var idx = 0, len = fields.length; idx < len; idx++) if (fields[idx][0].getPartialName() === partialName) throw new FieldAlreadyExistsError(partialName);
	parent.addField(fieldRef);
	field.setParent(parentRef);
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/sizes.js
var PageSizes = {
	"4A0": [4767.87, 6740.79],
	"2A0": [3370.39, 4767.87],
	A0: [2383.94, 3370.39],
	A1: [1683.78, 2383.94],
	A2: [1190.55, 1683.78],
	A3: [841.89, 1190.55],
	A4: [595.28, 841.89],
	A5: [419.53, 595.28],
	A6: [297.64, 419.53],
	A7: [209.76, 297.64],
	A8: [147.4, 209.76],
	A9: [104.88, 147.4],
	A10: [73.7, 104.88],
	B0: [2834.65, 4008.19],
	B1: [2004.09, 2834.65],
	B2: [1417.32, 2004.09],
	B3: [1000.63, 1417.32],
	B4: [708.66, 1000.63],
	B5: [498.9, 708.66],
	B6: [354.33, 498.9],
	B7: [249.45, 354.33],
	B8: [175.75, 249.45],
	B9: [124.72, 175.75],
	B10: [87.87, 124.72],
	C0: [2599.37, 3676.54],
	C1: [1836.85, 2599.37],
	C2: [1298.27, 1836.85],
	C3: [918.43, 1298.27],
	C4: [649.13, 918.43],
	C5: [459.21, 649.13],
	C6: [323.15, 459.21],
	C7: [229.61, 323.15],
	C8: [161.57, 229.61],
	C9: [113.39, 161.57],
	C10: [79.37, 113.39],
	RA0: [2437.8, 3458.27],
	RA1: [1729.13, 2437.8],
	RA2: [1218.9, 1729.13],
	RA3: [864.57, 1218.9],
	RA4: [609.45, 864.57],
	SRA0: [2551.18, 3628.35],
	SRA1: [1814.17, 2551.18],
	SRA2: [1275.59, 1814.17],
	SRA3: [907.09, 1275.59],
	SRA4: [637.8, 907.09],
	Executive: [521.86, 756],
	Folio: [612, 936],
	Legal: [612, 1008],
	Letter: [612, 792],
	Tabloid: [792, 1224]
};
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/PDFDocumentOptions.js
var ParseSpeeds;
(function(ParseSpeeds) {
	ParseSpeeds[ParseSpeeds["Fastest"] = Infinity] = "Fastest";
	ParseSpeeds[ParseSpeeds["Fast"] = 1500] = "Fast";
	ParseSpeeds[ParseSpeeds["Medium"] = 500] = "Medium";
	ParseSpeeds[ParseSpeeds["Slow"] = 100] = "Slow";
})(ParseSpeeds || (ParseSpeeds = {}));
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/PDFEmbeddedFile.js
/**
* Represents a file that has been embedded in a [[PDFDocument]].
*/
var PDFEmbeddedFile = function() {
	function PDFEmbeddedFile(ref, doc, embedder) {
		this.alreadyEmbedded = false;
		this.ref = ref;
		this.doc = doc;
		this.embedder = embedder;
	}
	/**
	* > **NOTE:** You probably don't need to call this method directly. The
	* > [[PDFDocument.save]] and [[PDFDocument.saveAsBase64]] methods will
	* > automatically ensure all embeddable files get embedded.
	*
	* Embed this embeddable file in its document.
	*
	* @returns Resolves when the embedding is complete.
	*/
	PDFEmbeddedFile.prototype.embed = function() {
		return __awaiter(this, void 0, void 0, function() {
			var ref, Names, EmbeddedFiles, EFNames, AF;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						if (!!this.alreadyEmbedded) return [3, 2];
						return [4, this.embedder.embedIntoContext(this.doc.context, this.ref)];
					case 1:
						ref = _a.sent();
						if (!this.doc.catalog.has(PDFName.of("Names"))) this.doc.catalog.set(PDFName.of("Names"), this.doc.context.obj({}));
						Names = this.doc.catalog.lookup(PDFName.of("Names"), PDFDict);
						if (!Names.has(PDFName.of("EmbeddedFiles"))) Names.set(PDFName.of("EmbeddedFiles"), this.doc.context.obj({}));
						EmbeddedFiles = Names.lookup(PDFName.of("EmbeddedFiles"), PDFDict);
						if (!EmbeddedFiles.has(PDFName.of("Names"))) EmbeddedFiles.set(PDFName.of("Names"), this.doc.context.obj([]));
						EFNames = EmbeddedFiles.lookup(PDFName.of("Names"), PDFArray);
						EFNames.push(PDFHexString.fromText(this.embedder.fileName));
						EFNames.push(ref);
						/**
						* The AF-Tag is needed to achieve PDF-A3 compliance for embedded files
						*
						* The following document outlines the uses cases of the associated files (AF) tag.
						* See:
						* https://www.pdfa.org/wp-content/uploads/2018/10/PDF20_AN002-AF.pdf
						*/
						if (!this.doc.catalog.has(PDFName.of("AF"))) this.doc.catalog.set(PDFName.of("AF"), this.doc.context.obj([]));
						AF = this.doc.catalog.lookup(PDFName.of("AF"), PDFArray);
						AF.push(ref);
						this.alreadyEmbedded = true;
						_a.label = 2;
					case 2: return [2];
				}
			});
		});
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFDocument.attach]] method, which will create
	* instances of [[PDFEmbeddedFile]] for you.
	*
	* Create an instance of [[PDFEmbeddedFile]] from an existing ref and embedder
	*
	* @param ref The unique reference for this file.
	* @param doc The document to which the file will belong.
	* @param embedder The embedder that will be used to embed the file.
	*/
	PDFEmbeddedFile.of = function(ref, doc, embedder) {
		return new PDFEmbeddedFile(ref, doc, embedder);
	};
	return PDFEmbeddedFile;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/PDFJavaScript.js
/**
* Represents JavaScript that has been embedded in a [[PDFDocument]].
*/
var PDFJavaScript = function() {
	function PDFJavaScript(ref, doc, embedder) {
		this.alreadyEmbedded = false;
		this.ref = ref;
		this.doc = doc;
		this.embedder = embedder;
	}
	/**
	* > **NOTE:** You probably don't need to call this method directly. The
	* > [[PDFDocument.save]] and [[PDFDocument.saveAsBase64]] methods will
	* > automatically ensure all JavaScripts get embedded.
	*
	* Embed this JavaScript in its document.
	*
	* @returns Resolves when the embedding is complete.
	*/
	PDFJavaScript.prototype.embed = function() {
		return __awaiter(this, void 0, void 0, function() {
			var _a, catalog, context, ref, Names, Javascript, JSNames;
			return __generator(this, function(_b) {
				switch (_b.label) {
					case 0:
						if (!!this.alreadyEmbedded) return [3, 2];
						_a = this.doc, catalog = _a.catalog, context = _a.context;
						return [4, this.embedder.embedIntoContext(this.doc.context, this.ref)];
					case 1:
						ref = _b.sent();
						if (!catalog.has(PDFName.of("Names"))) catalog.set(PDFName.of("Names"), context.obj({}));
						Names = catalog.lookup(PDFName.of("Names"), PDFDict);
						if (!Names.has(PDFName.of("JavaScript"))) Names.set(PDFName.of("JavaScript"), context.obj({}));
						Javascript = Names.lookup(PDFName.of("JavaScript"), PDFDict);
						if (!Javascript.has(PDFName.of("Names"))) Javascript.set(PDFName.of("Names"), context.obj([]));
						JSNames = Javascript.lookup(PDFName.of("Names"), PDFArray);
						JSNames.push(PDFHexString.fromText(this.embedder.scriptName));
						JSNames.push(ref);
						this.alreadyEmbedded = true;
						_b.label = 2;
					case 2: return [2];
				}
			});
		});
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFDocument.addJavaScript]] method, which will
	* create instances of [[PDFJavaScript]] for you.
	*
	* Create an instance of [[PDFJavaScript]] from an existing ref and script
	*
	* @param ref The unique reference for this script.
	* @param doc The document to which the script will belong.
	* @param embedder The embedder that will be used to embed the script.
	*/
	PDFJavaScript.of = function(ref, doc, embedder) {
		return new PDFJavaScript(ref, doc, embedder);
	};
	return PDFJavaScript;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/core/embedders/JavaScriptEmbedder.js
var JavaScriptEmbedder = function() {
	function JavaScriptEmbedder(script, scriptName) {
		this.script = script;
		this.scriptName = scriptName;
	}
	JavaScriptEmbedder.for = function(script, scriptName) {
		return new JavaScriptEmbedder(script, scriptName);
	};
	JavaScriptEmbedder.prototype.embedIntoContext = function(context, ref) {
		return __awaiter(this, void 0, void 0, function() {
			var jsActionDict;
			return __generator(this, function(_a) {
				jsActionDict = context.obj({
					Type: "Action",
					S: "JavaScript",
					JS: PDFHexString.fromText(this.script)
				});
				if (ref) {
					context.assign(ref, jsActionDict);
					return [2, ref];
				} else return [2, context.register(jsActionDict)];
			});
		});
	};
	return JavaScriptEmbedder;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/PDFDocument.js
/**
* Represents a PDF document.
*/
var PDFDocument = function() {
	function PDFDocument(context, ignoreEncryption, updateMetadata) {
		var _this = this;
		/** The default word breaks used in PDFPage.drawText */
		this.defaultWordBreaks = [" "];
		this.computePages = function() {
			var pages = [];
			_this.catalog.Pages().traverse(function(node, ref) {
				if (node instanceof PDFPageLeaf) {
					var page = _this.pageMap.get(node);
					if (!page) {
						page = PDFPage.of(node, ref, _this);
						_this.pageMap.set(node, page);
					}
					pages.push(page);
				}
			});
			return pages;
		};
		this.getOrCreateForm = function() {
			var acroForm = _this.catalog.getOrCreateAcroForm();
			return PDFForm.of(acroForm, _this);
		};
		assertIs(context, "context", [[PDFContext, "PDFContext"]]);
		assertIs(ignoreEncryption, "ignoreEncryption", ["boolean"]);
		this.context = context;
		this.catalog = context.lookup(context.trailerInfo.Root);
		this.isEncrypted = !!context.lookup(context.trailerInfo.Encrypt);
		this.pageCache = Cache.populatedBy(this.computePages);
		this.pageMap = /* @__PURE__ */ new Map();
		this.formCache = Cache.populatedBy(this.getOrCreateForm);
		this.fonts = [];
		this.images = [];
		this.embeddedPages = [];
		this.embeddedFiles = [];
		this.javaScripts = [];
		if (!ignoreEncryption && this.isEncrypted) throw new EncryptedPDFError();
		if (updateMetadata) this.updateInfoDict();
	}
	/**
	* Load an existing [[PDFDocument]]. The input data can be provided in
	* multiple formats:
	*
	* | Type          | Contents                                               |
	* | ------------- | ------------------------------------------------------ |
	* | `string`      | A base64 encoded string (or data URI) containing a PDF |
	* | `Uint8Array`  | The raw bytes of a PDF                                 |
	* | `ArrayBuffer` | The raw bytes of a PDF                                 |
	*
	* For example:
	* ```js
	* import { PDFDocument } from 'pdf-lib'
	*
	* // pdf=string
	* const base64 =
	*  'JVBERi0xLjcKJYGBgYEKCjUgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL0xlbm' +
	*  'd0aCAxMDQKPj4Kc3RyZWFtCniccwrhMlAAwaJ0Ln2P1Jyy1JLM5ERdc0MjCwUjE4WQNC4Q' +
	*  '6cNlCFZkqGCqYGSqEJLLZWNuYGZiZmbkYuZsZmlmZGRgZmluDCQNzc3NTM2NzdzMXMxMjQ' +
	*  'ztFEKyuEK0uFxDuAAOERdVCmVuZHN0cmVhbQplbmRvYmoKCjYgMCBvYmoKPDwKL0ZpbHRl' +
	*  'ciAvRmxhdGVEZWNvZGUKL1R5cGUgL09ialN0bQovTiA0Ci9GaXJzdCAyMAovTGVuZ3RoID' +
	*  'IxNQo+PgpzdHJlYW0KeJxVj9GqwjAMhu/zFHkBzTo3nCCCiiKIHPEICuJF3cKoSCu2E8/b' +
	*  '20wPIr1p8v9/8kVhgilmGfawX2CGaVrgcAi0/bsy0lrX7IGWpvJ4iJYEN3gEmrrGBlQwGs' +
	*  'HHO9VBX1wNrxAqMX87RBD5xpJuddqwd82tjAHxzV1U5LPgy52DKXWnr1Lheg+j/c/pzGVr' +
	*  'iqV0VlwZPXGPCJjElw/ybkwUmeoWgxesDXGhHJC/D/iikp1Av80ptKU0FdBEe25pPihAM1' +
	*  'u6ytgaaWfs2Hrz35CJT1+EWmAKZW5kc3RyZWFtCmVuZG9iagoKNyAwIG9iago8PAovU2l6' +
	*  'ZSA4Ci9Sb290IDIgMCBSCi9GaWx0ZXIgL0ZsYXRlRGVjb2RlCi9UeXBlIC9YUmVmCi9MZW' +
	*  '5ndGggMzgKL1cgWyAxIDIgMiBdCi9JbmRleCBbIDAgOCBdCj4+CnN0cmVhbQp4nBXEwREA' +
	*  'EBAEsCwz3vrvRmOOyyOoGhZdutHN2MT55fIAVocD+AplbmRzdHJlYW0KZW5kb2JqCgpzdG' +
	*  'FydHhyZWYKNTEwCiUlRU9G'
	*
	* const dataUri = 'data:application/pdf;base64,' + base64
	*
	* const pdfDoc1 = await PDFDocument.load(base64)
	* const pdfDoc2 = await PDFDocument.load(dataUri)
	*
	* // pdf=Uint8Array
	* import fs from 'fs'
	* const uint8Array = fs.readFileSync('with_update_sections.pdf')
	* const pdfDoc3 = await PDFDocument.load(uint8Array)
	*
	* // pdf=ArrayBuffer
	* const url = 'https://pdf-lib.js.org/assets/with_update_sections.pdf'
	* const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
	* const pdfDoc4 = await PDFDocument.load(arrayBuffer)
	*
	* ```
	*
	* @param pdf The input data containing a PDF document.
	* @param options The options to be used when loading the document.
	* @returns Resolves with a document loaded from the input.
	*/
	PDFDocument.load = function(pdf, options) {
		if (options === void 0) options = {};
		return __awaiter(this, void 0, void 0, function() {
			var _a, ignoreEncryption, _b, parseSpeed, _c, throwOnInvalidObject, _d, updateMetadata, _e, capNumbers, bytes, context;
			return __generator(this, function(_f) {
				switch (_f.label) {
					case 0:
						_a = options.ignoreEncryption, ignoreEncryption = _a === void 0 ? false : _a, _b = options.parseSpeed, parseSpeed = _b === void 0 ? ParseSpeeds.Slow : _b, _c = options.throwOnInvalidObject, throwOnInvalidObject = _c === void 0 ? false : _c, _d = options.updateMetadata, updateMetadata = _d === void 0 ? true : _d, _e = options.capNumbers, capNumbers = _e === void 0 ? false : _e;
						assertIs(pdf, "pdf", [
							"string",
							Uint8Array,
							ArrayBuffer
						]);
						assertIs(ignoreEncryption, "ignoreEncryption", ["boolean"]);
						assertIs(parseSpeed, "parseSpeed", ["number"]);
						assertIs(throwOnInvalidObject, "throwOnInvalidObject", ["boolean"]);
						bytes = toUint8Array(pdf);
						return [4, PDFParser.forBytesWithOptions(bytes, parseSpeed, throwOnInvalidObject, capNumbers).parseDocument()];
					case 1:
						context = _f.sent();
						return [2, new PDFDocument(context, ignoreEncryption, updateMetadata)];
				}
			});
		});
	};
	/**
	* Create a new [[PDFDocument]].
	* @returns Resolves with the newly created document.
	*/
	PDFDocument.create = function(options) {
		if (options === void 0) options = {};
		return __awaiter(this, void 0, void 0, function() {
			var _a, updateMetadata, context, pageTree, pageTreeRef, catalog;
			return __generator(this, function(_b) {
				_a = options.updateMetadata, updateMetadata = _a === void 0 ? true : _a;
				context = PDFContext.create();
				pageTree = PDFPageTree.withContext(context);
				pageTreeRef = context.register(pageTree);
				catalog = PDFCatalog.withContextAndPages(context, pageTreeRef);
				context.trailerInfo.Root = context.register(catalog);
				return [2, new PDFDocument(context, false, updateMetadata)];
			});
		});
	};
	/**
	* Register a fontkit instance. This must be done before custom fonts can
	* be embedded. See [here](https://github.com/Hopding/pdf-lib/tree/master#fontkit-installation)
	* for instructions on how to install and register a fontkit instance.
	*
	* > You do **not** need to call this method to embed standard fonts.
	*
	* For example:
	* ```js
	* import { PDFDocument } from 'pdf-lib'
	* import fontkit from '@pdf-lib/fontkit'
	*
	* const pdfDoc = await PDFDocument.create()
	* pdfDoc.registerFontkit(fontkit)
	* ```
	*
	* @param fontkit The fontkit instance to be registered.
	*/
	PDFDocument.prototype.registerFontkit = function(fontkit) {
		this.fontkit = fontkit;
	};
	/**
	* Get the [[PDFForm]] containing all interactive fields for this document.
	* For example:
	* ```js
	* const form = pdfDoc.getForm()
	* const fields = form.getFields()
	* fields.forEach(field => {
	*   const type = field.constructor.name
	*   const name = field.getName()
	*   console.log(`${type}: ${name}`)
	* })
	* ```
	* @returns The form for this document.
	*/
	PDFDocument.prototype.getForm = function() {
		var form = this.formCache.access();
		if (form.hasXFA()) {
			console.warn("Removing XFA form data as pdf-lib does not support reading or writing XFA");
			form.deleteXFA();
		}
		return form;
	};
	/**
	* Get this document's title metadata. The title appears in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* const title = pdfDoc.getTitle()
	* ```
	* @returns A string containing the title of this document, if it has one.
	*/
	PDFDocument.prototype.getTitle = function() {
		var title = this.getInfoDict().lookup(PDFName.Title);
		if (!title) return void 0;
		assertIsLiteralOrHexString(title);
		return title.decodeText();
	};
	/**
	* Get this document's author metadata. The author appears in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* const author = pdfDoc.getAuthor()
	* ```
	* @returns A string containing the author of this document, if it has one.
	*/
	PDFDocument.prototype.getAuthor = function() {
		var author = this.getInfoDict().lookup(PDFName.Author);
		if (!author) return void 0;
		assertIsLiteralOrHexString(author);
		return author.decodeText();
	};
	/**
	* Get this document's subject metadata. The subject appears in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* const subject = pdfDoc.getSubject()
	* ```
	* @returns A string containing the subject of this document, if it has one.
	*/
	PDFDocument.prototype.getSubject = function() {
		var subject = this.getInfoDict().lookup(PDFName.Subject);
		if (!subject) return void 0;
		assertIsLiteralOrHexString(subject);
		return subject.decodeText();
	};
	/**
	* Get this document's keywords metadata. The keywords appear in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* const keywords = pdfDoc.getKeywords()
	* ```
	* @returns A string containing the keywords of this document, if it has any.
	*/
	PDFDocument.prototype.getKeywords = function() {
		var keywords = this.getInfoDict().lookup(PDFName.Keywords);
		if (!keywords) return void 0;
		assertIsLiteralOrHexString(keywords);
		return keywords.decodeText();
	};
	/**
	* Get this document's creator metadata. The creator appears in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* const creator = pdfDoc.getCreator()
	* ```
	* @returns A string containing the creator of this document, if it has one.
	*/
	PDFDocument.prototype.getCreator = function() {
		var creator = this.getInfoDict().lookup(PDFName.Creator);
		if (!creator) return void 0;
		assertIsLiteralOrHexString(creator);
		return creator.decodeText();
	};
	/**
	* Get this document's producer metadata. The producer appears in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* const producer = pdfDoc.getProducer()
	* ```
	* @returns A string containing the producer of this document, if it has one.
	*/
	PDFDocument.prototype.getProducer = function() {
		var producer = this.getInfoDict().lookup(PDFName.Producer);
		if (!producer) return void 0;
		assertIsLiteralOrHexString(producer);
		return producer.decodeText();
	};
	/**
	* Get this document's creation date metadata. The creation date appears in
	* the "Document Properties" section of most PDF readers. For example:
	* ```js
	* const creationDate = pdfDoc.getCreationDate()
	* ```
	* @returns A Date containing the creation date of this document,
	*          if it has one.
	*/
	PDFDocument.prototype.getCreationDate = function() {
		var creationDate = this.getInfoDict().lookup(PDFName.CreationDate);
		if (!creationDate) return void 0;
		assertIsLiteralOrHexString(creationDate);
		return creationDate.decodeDate();
	};
	/**
	* Get this document's modification date metadata. The modification date
	* appears in the "Document Properties" section of most PDF readers.
	* For example:
	* ```js
	* const modification = pdfDoc.getModificationDate()
	* ```
	* @returns A Date containing the modification date of this document,
	*          if it has one.
	*/
	PDFDocument.prototype.getModificationDate = function() {
		var modificationDate = this.getInfoDict().lookup(PDFName.ModDate);
		if (!modificationDate) return void 0;
		assertIsLiteralOrHexString(modificationDate);
		return modificationDate.decodeDate();
	};
	/**
	* Set this document's title metadata. The title will appear in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* pdfDoc.setTitle('🥚 The Life of an Egg 🍳')
	* ```
	*
	* To display the title in the window's title bar, set the
	* `showInWindowTitleBar` option to `true` (works for _most_ PDF readers).
	* For example:
	* ```js
	* pdfDoc.setTitle('🥚 The Life of an Egg 🍳', { showInWindowTitleBar: true })
	* ```
	*
	* @param title The title of this document.
	* @param options The options to be used when setting the title.
	*/
	PDFDocument.prototype.setTitle = function(title, options) {
		assertIs(title, "title", ["string"]);
		var key = PDFName.of("Title");
		this.getInfoDict().set(key, PDFHexString.fromText(title));
		if (options === null || options === void 0 ? void 0 : options.showInWindowTitleBar) this.catalog.getOrCreateViewerPreferences().setDisplayDocTitle(true);
	};
	/**
	* Set this document's author metadata. The author will appear in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* pdfDoc.setAuthor('Humpty Dumpty')
	* ```
	* @param author The author of this document.
	*/
	PDFDocument.prototype.setAuthor = function(author) {
		assertIs(author, "author", ["string"]);
		var key = PDFName.of("Author");
		this.getInfoDict().set(key, PDFHexString.fromText(author));
	};
	/**
	* Set this document's subject metadata. The subject will appear in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* pdfDoc.setSubject('📘 An Epic Tale of Woe 📖')
	* ```
	* @param subject The subject of this document.
	*/
	PDFDocument.prototype.setSubject = function(subject) {
		assertIs(subject, "author", ["string"]);
		var key = PDFName.of("Subject");
		this.getInfoDict().set(key, PDFHexString.fromText(subject));
	};
	/**
	* Set this document's keyword metadata. These keywords will appear in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* pdfDoc.setKeywords(['eggs', 'wall', 'fall', 'king', 'horses', 'men'])
	* ```
	* @param keywords An array of keywords associated with this document.
	*/
	PDFDocument.prototype.setKeywords = function(keywords) {
		assertIs(keywords, "keywords", [Array]);
		var key = PDFName.of("Keywords");
		this.getInfoDict().set(key, PDFHexString.fromText(keywords.join(" ")));
	};
	/**
	* Set this document's creator metadata. The creator will appear in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* pdfDoc.setCreator('PDF App 9000 🤖')
	* ```
	* @param creator The creator of this document.
	*/
	PDFDocument.prototype.setCreator = function(creator) {
		assertIs(creator, "creator", ["string"]);
		var key = PDFName.of("Creator");
		this.getInfoDict().set(key, PDFHexString.fromText(creator));
	};
	/**
	* Set this document's producer metadata. The producer will appear in the
	* "Document Properties" section of most PDF readers. For example:
	* ```js
	* pdfDoc.setProducer('PDF App 9000 🤖')
	* ```
	* @param producer The producer of this document.
	*/
	PDFDocument.prototype.setProducer = function(producer) {
		assertIs(producer, "creator", ["string"]);
		var key = PDFName.of("Producer");
		this.getInfoDict().set(key, PDFHexString.fromText(producer));
	};
	/**
	* Set this document's language metadata. The language will appear in the
	* "Document Properties" section of some PDF readers. For example:
	* ```js
	* pdfDoc.setLanguage('en-us')
	* ```
	*
	* @param language An RFC 3066 _Language-Tag_ denoting the language of this
	*                 document, or an empty string if the language is unknown.
	*/
	PDFDocument.prototype.setLanguage = function(language) {
		assertIs(language, "language", ["string"]);
		var key = PDFName.of("Lang");
		this.catalog.set(key, PDFString.of(language));
	};
	/**
	* Set this document's creation date metadata. The creation date will appear
	* in the "Document Properties" section of most PDF readers. For example:
	* ```js
	* pdfDoc.setCreationDate(new Date())
	* ```
	* @param creationDate The date this document was created.
	*/
	PDFDocument.prototype.setCreationDate = function(creationDate) {
		assertIs(creationDate, "creationDate", [[Date, "Date"]]);
		var key = PDFName.of("CreationDate");
		this.getInfoDict().set(key, PDFString.fromDate(creationDate));
	};
	/**
	* Set this document's modification date metadata. The modification date will
	* appear in the "Document Properties" section of most PDF readers. For
	* example:
	* ```js
	* pdfDoc.setModificationDate(new Date())
	* ```
	* @param modificationDate The date this document was last modified.
	*/
	PDFDocument.prototype.setModificationDate = function(modificationDate) {
		assertIs(modificationDate, "modificationDate", [[Date, "Date"]]);
		var key = PDFName.of("ModDate");
		this.getInfoDict().set(key, PDFString.fromDate(modificationDate));
	};
	/**
	* Get the number of pages contained in this document. For example:
	* ```js
	* const totalPages = pdfDoc.getPageCount()
	* ```
	* @returns The number of pages in this document.
	*/
	PDFDocument.prototype.getPageCount = function() {
		if (this.pageCount === void 0) this.pageCount = this.getPages().length;
		return this.pageCount;
	};
	/**
	* Get an array of all the pages contained in this document. The pages are
	* stored in the array in the same order that they are rendered in the
	* document. For example:
	* ```js
	* const pages = pdfDoc.getPages()
	* pages[0]   // The first page of the document
	* pages[2]   // The third page of the document
	* pages[197] // The 198th page of the document
	* ```
	* @returns An array of all the pages contained in this document.
	*/
	PDFDocument.prototype.getPages = function() {
		return this.pageCache.access();
	};
	/**
	* Get the page rendered at a particular `index` of the document. For example:
	* ```js
	* pdfDoc.getPage(0)   // The first page of the document
	* pdfDoc.getPage(2)   // The third page of the document
	* pdfDoc.getPage(197) // The 198th page of the document
	* ```
	* @returns The [[PDFPage]] rendered at the given `index` of the document.
	*/
	PDFDocument.prototype.getPage = function(index) {
		var pages = this.getPages();
		assertRange(index, "index", 0, pages.length - 1);
		return pages[index];
	};
	/**
	* Get an array of indices for all the pages contained in this document. The
	* array will contain a range of integers from
	* `0..pdfDoc.getPageCount() - 1`. For example:
	* ```js
	* const pdfDoc = await PDFDocument.create()
	* pdfDoc.addPage()
	* pdfDoc.addPage()
	* pdfDoc.addPage()
	*
	* const indices = pdfDoc.getPageIndices()
	* indices // => [0, 1, 2]
	* ```
	* @returns An array of indices for all pages contained in this document.
	*/
	PDFDocument.prototype.getPageIndices = function() {
		return range(0, this.getPageCount());
	};
	/**
	* Remove the page at a given index from this document. For example:
	* ```js
	* pdfDoc.removePage(0)   // Remove the first page of the document
	* pdfDoc.removePage(2)   // Remove the third page of the document
	* pdfDoc.removePage(197) // Remove the 198th page of the document
	* ```
	* Once a page has been removed, it will no longer be rendered at that index
	* in the document.
	* @param index The index of the page to be removed.
	*/
	PDFDocument.prototype.removePage = function(index) {
		var pageCount = this.getPageCount();
		if (this.pageCount === 0) throw new RemovePageFromEmptyDocumentError();
		assertRange(index, "index", 0, pageCount - 1);
		this.catalog.removeLeafNode(index);
		this.pageCount = pageCount - 1;
	};
	/**
	* Add a page to the end of this document. This method accepts three
	* different value types for the `page` parameter:
	*
	* | Type               | Behavior                                                                            |
	* | ------------------ | ----------------------------------------------------------------------------------- |
	* | `undefined`        | Create a new page and add it to the end of this document                            |
	* | `[number, number]` | Create a new page with the given dimensions and add it to the end of this document  |
	* | `PDFPage`          | Add the existing page to the end of this document                                   |
	*
	* For example:
	* ```js
	* // page=undefined
	* const newPage = pdfDoc.addPage()
	*
	* // page=[number, number]
	* import { PageSizes } from 'pdf-lib'
	* const newPage1 = pdfDoc.addPage(PageSizes.A7)
	* const newPage2 = pdfDoc.addPage(PageSizes.Letter)
	* const newPage3 = pdfDoc.addPage([500, 750])
	*
	* // page=PDFPage
	* const pdfDoc1 = await PDFDocument.create()
	* const pdfDoc2 = await PDFDocument.load(...)
	* const [existingPage] = await pdfDoc1.copyPages(pdfDoc2, [0])
	* pdfDoc1.addPage(existingPage)
	* ```
	*
	* @param page Optionally, the desired dimensions or existing page.
	* @returns The newly created (or existing) page.
	*/
	PDFDocument.prototype.addPage = function(page) {
		assertIs(page, "page", [
			"undefined",
			[PDFPage, "PDFPage"],
			Array
		]);
		return this.insertPage(this.getPageCount(), page);
	};
	/**
	* Insert a page at a given index within this document. This method accepts
	* three different value types for the `page` parameter:
	*
	* | Type               | Behavior                                                                       |
	* | ------------------ | ------------------------------------------------------------------------------ |
	* | `undefined`        | Create a new page and insert it into this document                             |
	* | `[number, number]` | Create a new page with the given dimensions and insert it into this document   |
	* | `PDFPage`          | Insert the existing page into this document                                    |
	*
	* For example:
	* ```js
	* // page=undefined
	* const newPage = pdfDoc.insertPage(2)
	*
	* // page=[number, number]
	* import { PageSizes } from 'pdf-lib'
	* const newPage1 = pdfDoc.insertPage(2, PageSizes.A7)
	* const newPage2 = pdfDoc.insertPage(0, PageSizes.Letter)
	* const newPage3 = pdfDoc.insertPage(198, [500, 750])
	*
	* // page=PDFPage
	* const pdfDoc1 = await PDFDocument.create()
	* const pdfDoc2 = await PDFDocument.load(...)
	* const [existingPage] = await pdfDoc1.copyPages(pdfDoc2, [0])
	* pdfDoc1.insertPage(0, existingPage)
	* ```
	*
	* @param index The index at which the page should be inserted (zero-based).
	* @param page Optionally, the desired dimensions or existing page.
	* @returns The newly created (or existing) page.
	*/
	PDFDocument.prototype.insertPage = function(index, page) {
		var pageCount = this.getPageCount();
		assertRange(index, "index", 0, pageCount);
		assertIs(page, "page", [
			"undefined",
			[PDFPage, "PDFPage"],
			Array
		]);
		if (!page || Array.isArray(page)) {
			var dims = Array.isArray(page) ? page : PageSizes.A4;
			page = PDFPage.create(this);
			page.setSize.apply(page, dims);
		} else if (page.doc !== this) throw new ForeignPageError();
		var parentRef = this.catalog.insertLeafNode(page.ref, index);
		page.node.setParent(parentRef);
		this.pageMap.set(page.node, page);
		this.pageCache.invalidate();
		this.pageCount = pageCount + 1;
		return page;
	};
	/**
	* Copy pages from a source document into this document. Allows pages to be
	* copied between different [[PDFDocument]] instances. For example:
	* ```js
	* const pdfDoc = await PDFDocument.create()
	* const srcDoc = await PDFDocument.load(...)
	*
	* const copiedPages = await pdfDoc.copyPages(srcDoc, [0, 3, 89])
	* const [firstPage, fourthPage, ninetiethPage] = copiedPages;
	*
	* pdfDoc.addPage(fourthPage)
	* pdfDoc.insertPage(0, ninetiethPage)
	* pdfDoc.addPage(firstPage)
	* ```
	* @param srcDoc The document from which pages should be copied.
	* @param indices The indices of the pages that should be copied.
	* @returns Resolves with an array of pages copied into this document.
	*/
	PDFDocument.prototype.copyPages = function(srcDoc, indices) {
		return __awaiter(this, void 0, void 0, function() {
			var copier, srcPages, copiedPages, idx, len, srcPage, copiedPage, ref;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						assertIs(srcDoc, "srcDoc", [[PDFDocument, "PDFDocument"]]);
						assertIs(indices, "indices", [Array]);
						return [4, srcDoc.flush()];
					case 1:
						_a.sent();
						copier = PDFObjectCopier.for(srcDoc.context, this.context);
						srcPages = srcDoc.getPages();
						copiedPages = new Array(indices.length);
						for (idx = 0, len = indices.length; idx < len; idx++) {
							srcPage = srcPages[indices[idx]];
							copiedPage = copier.copy(srcPage.node);
							ref = this.context.register(copiedPage);
							copiedPages[idx] = PDFPage.of(copiedPage, ref, this);
						}
						return [2, copiedPages];
				}
			});
		});
	};
	/**
	* Get a copy of this document.
	*
	* For example:
	* ```js
	* const srcDoc = await PDFDocument.load(...)
	* const pdfDoc = await srcDoc.copy()
	* ```
	*
	* > **NOTE:**  This method won't copy all information over to the new
	* > document (acroforms, outlines, etc...).
	*
	* @returns Resolves with a copy this document.
	*/
	PDFDocument.prototype.copy = function() {
		return __awaiter(this, void 0, void 0, function() {
			var pdfCopy, contentPages, idx, len;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0: return [4, PDFDocument.create()];
					case 1:
						pdfCopy = _a.sent();
						return [4, pdfCopy.copyPages(this, this.getPageIndices())];
					case 2:
						contentPages = _a.sent();
						for (idx = 0, len = contentPages.length; idx < len; idx++) pdfCopy.addPage(contentPages[idx]);
						if (this.getAuthor() !== void 0) pdfCopy.setAuthor(this.getAuthor());
						if (this.getCreationDate() !== void 0) pdfCopy.setCreationDate(this.getCreationDate());
						if (this.getCreator() !== void 0) pdfCopy.setCreator(this.getCreator());
						if (this.getModificationDate() !== void 0) pdfCopy.setModificationDate(this.getModificationDate());
						if (this.getProducer() !== void 0) pdfCopy.setProducer(this.getProducer());
						if (this.getSubject() !== void 0) pdfCopy.setSubject(this.getSubject());
						if (this.getTitle() !== void 0) pdfCopy.setTitle(this.getTitle());
						pdfCopy.defaultWordBreaks = this.defaultWordBreaks;
						return [2, pdfCopy];
				}
			});
		});
	};
	/**
	* Add JavaScript to this document. The supplied `script` is executed when the
	* document is opened. The `script` can be used to perform some operation
	* when the document is opened (e.g. logging to the console), or it can be
	* used to define a function that can be referenced later in a JavaScript
	* action. For example:
	* ```js
	* // Show "Hello World!" in the console when the PDF is opened
	* pdfDoc.addJavaScript(
	*   'main',
	*   'console.show(); console.println("Hello World!");'
	* );
	*
	* // Define a function named "foo" that can be called in JavaScript Actions
	* pdfDoc.addJavaScript(
	*   'foo',
	*   'function foo() { return "foo"; }'
	* );
	* ```
	* See the [JavaScript for Acrobat API Reference](https://www.adobe.com/content/dam/acom/en/devnet/acrobat/pdfs/js_api_reference.pdf)
	* for details.
	* @param name The name of the script. Must be unique per document.
	* @param script The JavaScript to execute.
	*/
	PDFDocument.prototype.addJavaScript = function(name, script) {
		assertIs(name, "name", ["string"]);
		assertIs(script, "script", ["string"]);
		var embedder = JavaScriptEmbedder.for(script, name);
		var ref = this.context.nextRef();
		var javaScript = PDFJavaScript.of(ref, this, embedder);
		this.javaScripts.push(javaScript);
	};
	/**
	* Add an attachment to this document. Attachments are visible in the
	* "Attachments" panel of Adobe Acrobat and some other PDF readers. Any
	* type of file can be added as an attachment. This includes, but is not
	* limited to, `.png`, `.jpg`, `.pdf`, `.csv`, `.docx`, and `.xlsx` files.
	*
	* The input data can be provided in multiple formats:
	*
	* | Type          | Contents                                                       |
	* | ------------- | -------------------------------------------------------------- |
	* | `string`      | A base64 encoded string (or data URI) containing an attachment |
	* | `Uint8Array`  | The raw bytes of an attachment                                 |
	* | `ArrayBuffer` | The raw bytes of an attachment                                 |
	*
	* For example:
	* ```js
	* // attachment=string
	* await pdfDoc.attach('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...', 'cat_riding_unicorn.jpg', {
	*   mimeType: 'image/jpeg',
	*   description: 'Cool cat riding a unicorn! 🦄🐈🕶️',
	*   creationDate: new Date('2019/12/01'),
	*   modificationDate: new Date('2020/04/19'),
	* })
	* await pdfDoc.attach('data:image/jpeg;base64,/9j/4AAQ...', 'cat_riding_unicorn.jpg', {
	*   mimeType: 'image/jpeg',
	*   description: 'Cool cat riding a unicorn! 🦄🐈🕶️',
	*   creationDate: new Date('2019/12/01'),
	*   modificationDate: new Date('2020/04/19'),
	* })
	*
	* // attachment=Uint8Array
	* import fs from 'fs'
	* const uint8Array = fs.readFileSync('cat_riding_unicorn.jpg')
	* await pdfDoc.attach(uint8Array, 'cat_riding_unicorn.jpg', {
	*   mimeType: 'image/jpeg',
	*   description: 'Cool cat riding a unicorn! 🦄🐈🕶️',
	*   creationDate: new Date('2019/12/01'),
	*   modificationDate: new Date('2020/04/19'),
	* })
	*
	* // attachment=ArrayBuffer
	* const url = 'https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg'
	* const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
	* await pdfDoc.attach(arrayBuffer, 'cat_riding_unicorn.jpg', {
	*   mimeType: 'image/jpeg',
	*   description: 'Cool cat riding a unicorn! 🦄🐈🕶️',
	*   creationDate: new Date('2019/12/01'),
	*   modificationDate: new Date('2020/04/19'),
	* })
	* ```
	*
	* @param attachment The input data containing the file to be attached.
	* @param name The name of the file to be attached.
	* @returns Resolves when the attachment is complete.
	*/
	PDFDocument.prototype.attach = function(attachment, name, options) {
		if (options === void 0) options = {};
		return __awaiter(this, void 0, void 0, function() {
			var bytes, embedder, ref, embeddedFile;
			return __generator(this, function(_a) {
				assertIs(attachment, "attachment", [
					"string",
					Uint8Array,
					ArrayBuffer
				]);
				assertIs(name, "name", ["string"]);
				assertOrUndefined(options.mimeType, "mimeType", ["string"]);
				assertOrUndefined(options.description, "description", ["string"]);
				assertOrUndefined(options.creationDate, "options.creationDate", [Date]);
				assertOrUndefined(options.modificationDate, "options.modificationDate", [Date]);
				assertIsOneOfOrUndefined(options.afRelationship, "options.afRelationship", AFRelationship);
				bytes = toUint8Array(attachment);
				embedder = FileEmbedder.for(bytes, name, options);
				ref = this.context.nextRef();
				embeddedFile = PDFEmbeddedFile.of(ref, this, embedder);
				this.embeddedFiles.push(embeddedFile);
				return [2];
			});
		});
	};
	/**
	* Embed a font into this document. The input data can be provided in multiple
	* formats:
	*
	* | Type            | Contents                                                |
	* | --------------- | ------------------------------------------------------- |
	* | `StandardFonts` | One of the standard 14 fonts                            |
	* | `string`        | A base64 encoded string (or data URI) containing a font |
	* | `Uint8Array`    | The raw bytes of a font                                 |
	* | `ArrayBuffer`   | The raw bytes of a font                                 |
	*
	* For example:
	* ```js
	* // font=StandardFonts
	* import { StandardFonts } from 'pdf-lib'
	* const font1 = await pdfDoc.embedFont(StandardFonts.Helvetica)
	*
	* // font=string
	* const font2 = await pdfDoc.embedFont('AAEAAAAVAQAABABQRFNJRx/upe...')
	* const font3 = await pdfDoc.embedFont('data:font/opentype;base64,AAEAAA...')
	*
	* // font=Uint8Array
	* import fs from 'fs'
	* const font4 = await pdfDoc.embedFont(fs.readFileSync('Ubuntu-R.ttf'))
	*
	* // font=ArrayBuffer
	* const url = 'https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf'
	* const ubuntuBytes = await fetch(url).then(res => res.arrayBuffer())
	* const font5 = await pdfDoc.embedFont(ubuntuBytes)
	* ```
	* See also: [[registerFontkit]]
	* @param font The input data for a font.
	* @param options The options to be used when embedding the font.
	* @returns Resolves with the embedded font.
	*/
	PDFDocument.prototype.embedFont = function(font, options) {
		if (options === void 0) options = {};
		return __awaiter(this, void 0, void 0, function() {
			var _a, subset, customName, features, embedder, bytes, fontkit, _b, ref, pdfFont;
			return __generator(this, function(_c) {
				switch (_c.label) {
					case 0:
						_a = options.subset, subset = _a === void 0 ? false : _a, customName = options.customName, features = options.features;
						assertIs(font, "font", [
							"string",
							Uint8Array,
							ArrayBuffer
						]);
						assertIs(subset, "subset", ["boolean"]);
						if (!isStandardFont(font)) return [3, 1];
						embedder = StandardFontEmbedder.for(font, customName);
						return [3, 7];
					case 1:
						if (!canBeConvertedToUint8Array(font)) return [3, 6];
						bytes = toUint8Array(font);
						fontkit = this.assertFontkit();
						if (!subset) return [3, 3];
						return [4, CustomFontSubsetEmbedder.for(fontkit, bytes, customName, features)];
					case 2:
						_b = _c.sent();
						return [3, 5];
					case 3: return [4, CustomFontEmbedder.for(fontkit, bytes, customName, features)];
					case 4:
						_b = _c.sent();
						_c.label = 5;
					case 5:
						embedder = _b;
						return [3, 7];
					case 6: throw new TypeError("`font` must be one of `StandardFonts | string | Uint8Array | ArrayBuffer`");
					case 7:
						ref = this.context.nextRef();
						pdfFont = PDFFont.of(ref, this, embedder);
						this.fonts.push(pdfFont);
						return [2, pdfFont];
				}
			});
		});
	};
	/**
	* Embed a standard font into this document.
	* For example:
	* ```js
	* import { StandardFonts } from 'pdf-lib'
	* const helveticaFont = pdfDoc.embedFont(StandardFonts.Helvetica)
	* ```
	* @param font The standard font to be embedded.
	* @param customName The name to be used when embedding the font.
	* @returns The embedded font.
	*/
	PDFDocument.prototype.embedStandardFont = function(font, customName) {
		assertIs(font, "font", ["string"]);
		if (!isStandardFont(font)) throw new TypeError("`font` must be one of type `StandardFonts`");
		var embedder = StandardFontEmbedder.for(font, customName);
		var ref = this.context.nextRef();
		var pdfFont = PDFFont.of(ref, this, embedder);
		this.fonts.push(pdfFont);
		return pdfFont;
	};
	/**
	* Embed a JPEG image into this document. The input data can be provided in
	* multiple formats:
	*
	* | Type          | Contents                                                      |
	* | ------------- | ------------------------------------------------------------- |
	* | `string`      | A base64 encoded string (or data URI) containing a JPEG image |
	* | `Uint8Array`  | The raw bytes of a JPEG image                                 |
	* | `ArrayBuffer` | The raw bytes of a JPEG image                                 |
	*
	* For example:
	* ```js
	* // jpg=string
	* const image1 = await pdfDoc.embedJpg('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...')
	* const image2 = await pdfDoc.embedJpg('data:image/jpeg;base64,/9j/4AAQ...')
	*
	* // jpg=Uint8Array
	* import fs from 'fs'
	* const uint8Array = fs.readFileSync('cat_riding_unicorn.jpg')
	* const image3 = await pdfDoc.embedJpg(uint8Array)
	*
	* // jpg=ArrayBuffer
	* const url = 'https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg'
	* const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
	* const image4 = await pdfDoc.embedJpg(arrayBuffer)
	* ```
	*
	* @param jpg The input data for a JPEG image.
	* @returns Resolves with the embedded image.
	*/
	PDFDocument.prototype.embedJpg = function(jpg) {
		return __awaiter(this, void 0, void 0, function() {
			var bytes, embedder, ref, pdfImage;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						assertIs(jpg, "jpg", [
							"string",
							Uint8Array,
							ArrayBuffer
						]);
						bytes = toUint8Array(jpg);
						return [4, JpegEmbedder.for(bytes)];
					case 1:
						embedder = _a.sent();
						ref = this.context.nextRef();
						pdfImage = PDFImage.of(ref, this, embedder);
						this.images.push(pdfImage);
						return [2, pdfImage];
				}
			});
		});
	};
	/**
	* Embed a PNG image into this document. The input data can be provided in
	* multiple formats:
	*
	* | Type          | Contents                                                     |
	* | ------------- | ------------------------------------------------------------ |
	* | `string`      | A base64 encoded string (or data URI) containing a PNG image |
	* | `Uint8Array`  | The raw bytes of a PNG image                                 |
	* | `ArrayBuffer` | The raw bytes of a PNG image                                 |
	*
	* For example:
	* ```js
	* // png=string
	* const image1 = await pdfDoc.embedPng('iVBORw0KGgoAAAANSUhEUgAAAlgAAAF3...')
	* const image2 = await pdfDoc.embedPng('data:image/png;base64,iVBORw0KGg...')
	*
	* // png=Uint8Array
	* import fs from 'fs'
	* const uint8Array = fs.readFileSync('small_mario.png')
	* const image3 = await pdfDoc.embedPng(uint8Array)
	*
	* // png=ArrayBuffer
	* const url = 'https://pdf-lib.js.org/assets/small_mario.png'
	* const arrayBuffer = await fetch(url).then(res => res.arrayBuffer())
	* const image4 = await pdfDoc.embedPng(arrayBuffer)
	* ```
	*
	* @param png The input data for a PNG image.
	* @returns Resolves with the embedded image.
	*/
	PDFDocument.prototype.embedPng = function(png) {
		return __awaiter(this, void 0, void 0, function() {
			var bytes, embedder, ref, pdfImage;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						assertIs(png, "png", [
							"string",
							Uint8Array,
							ArrayBuffer
						]);
						bytes = toUint8Array(png);
						return [4, PngEmbedder.for(bytes)];
					case 1:
						embedder = _a.sent();
						ref = this.context.nextRef();
						pdfImage = PDFImage.of(ref, this, embedder);
						this.images.push(pdfImage);
						return [2, pdfImage];
				}
			});
		});
	};
	/**
	* Embed one or more PDF pages into this document.
	*
	* For example:
	* ```js
	* const pdfDoc = await PDFDocument.create()
	*
	* const sourcePdfUrl = 'https://pdf-lib.js.org/assets/with_large_page_count.pdf'
	* const sourcePdf = await fetch(sourcePdfUrl).then((res) => res.arrayBuffer())
	*
	* // Embed page 74 of `sourcePdf` into `pdfDoc`
	* const [embeddedPage] = await pdfDoc.embedPdf(sourcePdf, [73])
	* ```
	*
	* See [[PDFDocument.load]] for examples of the allowed input data formats.
	*
	* @param pdf The input data containing a PDF document.
	* @param indices The indices of the pages that should be embedded.
	* @returns Resolves with an array of the embedded pages.
	*/
	PDFDocument.prototype.embedPdf = function(pdf, indices) {
		if (indices === void 0) indices = [0];
		return __awaiter(this, void 0, void 0, function() {
			var srcDoc, _a, srcPages;
			return __generator(this, function(_b) {
				switch (_b.label) {
					case 0:
						assertIs(pdf, "pdf", [
							"string",
							Uint8Array,
							ArrayBuffer,
							[PDFDocument, "PDFDocument"]
						]);
						assertIs(indices, "indices", [Array]);
						if (!(pdf instanceof PDFDocument)) return [3, 1];
						_a = pdf;
						return [3, 3];
					case 1: return [4, PDFDocument.load(pdf)];
					case 2:
						_a = _b.sent();
						_b.label = 3;
					case 3:
						srcDoc = _a;
						srcPages = pluckIndices(srcDoc.getPages(), indices);
						return [2, this.embedPages(srcPages)];
				}
			});
		});
	};
	/**
	* Embed a single PDF page into this document.
	*
	* For example:
	* ```js
	* const pdfDoc = await PDFDocument.create()
	*
	* const sourcePdfUrl = 'https://pdf-lib.js.org/assets/with_large_page_count.pdf'
	* const sourceBuffer = await fetch(sourcePdfUrl).then((res) => res.arrayBuffer())
	* const sourcePdfDoc = await PDFDocument.load(sourceBuffer)
	* const sourcePdfPage = sourcePdfDoc.getPages()[73]
	*
	* const embeddedPage = await pdfDoc.embedPage(
	*   sourcePdfPage,
	*
	*   // Clip a section of the source page so that we only embed part of it
	*   { left: 100, right: 450, bottom: 330, top: 570 },
	*
	*   // Translate all drawings of the embedded page by (10, 200) units
	*   [1, 0, 0, 1, 10, 200],
	* )
	* ```
	*
	* @param page The page to be embedded.
	* @param boundingBox
	* Optionally, an area of the source page that should be embedded
	* (defaults to entire page).
	* @param transformationMatrix
	* Optionally, a transformation matrix that is always applied to the embedded
	* page anywhere it is drawn.
	* @returns Resolves with the embedded pdf page.
	*/
	PDFDocument.prototype.embedPage = function(page, boundingBox, transformationMatrix) {
		return __awaiter(this, void 0, void 0, function() {
			var embeddedPage;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						assertIs(page, "page", [[PDFPage, "PDFPage"]]);
						return [4, this.embedPages([page], [boundingBox], [transformationMatrix])];
					case 1:
						embeddedPage = _a.sent()[0];
						return [2, embeddedPage];
				}
			});
		});
	};
	/**
	* Embed one or more PDF pages into this document.
	*
	* For example:
	* ```js
	* const pdfDoc = await PDFDocument.create()
	*
	* const sourcePdfUrl = 'https://pdf-lib.js.org/assets/with_large_page_count.pdf'
	* const sourceBuffer = await fetch(sourcePdfUrl).then((res) => res.arrayBuffer())
	* const sourcePdfDoc = await PDFDocument.load(sourceBuffer)
	*
	* const page1 = sourcePdfDoc.getPages()[0]
	* const page2 = sourcePdfDoc.getPages()[52]
	* const page3 = sourcePdfDoc.getPages()[73]
	*
	* const embeddedPages = await pdfDoc.embedPages([page1, page2, page3])
	* ```
	*
	* @param page
	* The pages to be embedded (they must all share the same context).
	* @param boundingBoxes
	* Optionally, an array of clipping boundaries - one for each page
	* (defaults to entirety of each page).
	* @param transformationMatrices
	* Optionally, an array of transformation matrices - one for each page
	* (each page's transformation will apply anywhere it is drawn).
	* @returns Resolves with an array of the embedded pdf pages.
	*/
	PDFDocument.prototype.embedPages = function(pages, boundingBoxes, transformationMatrices) {
		if (boundingBoxes === void 0) boundingBoxes = [];
		if (transformationMatrices === void 0) transformationMatrices = [];
		return __awaiter(this, void 0, void 0, function() {
			var idx, len, currPage, nextPage, context, maybeCopyPage, embeddedPages, idx, len, page, box, matrix, embedder, ref;
			var _a;
			return __generator(this, function(_b) {
				switch (_b.label) {
					case 0:
						if (pages.length === 0) return [2, []];
						for (idx = 0, len = pages.length - 1; idx < len; idx++) {
							currPage = pages[idx];
							nextPage = pages[idx + 1];
							if (currPage.node.context !== nextPage.node.context) throw new PageEmbeddingMismatchedContextError();
						}
						context = pages[0].node.context;
						maybeCopyPage = context === this.context ? function(p) {
							return p;
						} : PDFObjectCopier.for(context, this.context).copy;
						embeddedPages = new Array(pages.length);
						idx = 0, len = pages.length;
						_b.label = 1;
					case 1:
						if (!(idx < len)) return [3, 4];
						page = maybeCopyPage(pages[idx].node);
						box = boundingBoxes[idx];
						matrix = transformationMatrices[idx];
						return [4, PDFPageEmbedder.for(page, box, matrix)];
					case 2:
						embedder = _b.sent();
						ref = this.context.nextRef();
						embeddedPages[idx] = PDFEmbeddedPage.of(ref, this, embedder);
						_b.label = 3;
					case 3:
						idx++;
						return [3, 1];
					case 4:
						(_a = this.embeddedPages).push.apply(_a, embeddedPages);
						return [2, embeddedPages];
				}
			});
		});
	};
	/**
	* > **NOTE:** You shouldn't need to call this method directly. The [[save]]
	* > and [[saveAsBase64]] methods will automatically ensure that all embedded
	* > assets are flushed before serializing the document.
	*
	* Flush all embedded fonts, PDF pages, and images to this document's
	* [[context]].
	*
	* @returns Resolves when the flush is complete.
	*/
	PDFDocument.prototype.flush = function() {
		return __awaiter(this, void 0, void 0, function() {
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0: return [4, this.embedAll(this.fonts)];
					case 1:
						_a.sent();
						return [4, this.embedAll(this.images)];
					case 2:
						_a.sent();
						return [4, this.embedAll(this.embeddedPages)];
					case 3:
						_a.sent();
						return [4, this.embedAll(this.embeddedFiles)];
					case 4:
						_a.sent();
						return [4, this.embedAll(this.javaScripts)];
					case 5:
						_a.sent();
						return [2];
				}
			});
		});
	};
	/**
	* Serialize this document to an array of bytes making up a PDF file.
	* For example:
	* ```js
	* const pdfBytes = await pdfDoc.save()
	* ```
	*
	* There are a number of things you can do with the serialized document,
	* depending on the JavaScript environment you're running in:
	* * Write it to a file in Node or React Native
	* * Download it as a Blob in the browser
	* * Render it in an `iframe`
	*
	* @param options The options to be used when saving the document.
	* @returns Resolves with the bytes of the serialized document.
	*/
	PDFDocument.prototype.save = function(options) {
		if (options === void 0) options = {};
		return __awaiter(this, void 0, void 0, function() {
			var _a, useObjectStreams, _b, addDefaultPage, _c, objectsPerTick, _d, updateFieldAppearances, form, Writer;
			return __generator(this, function(_e) {
				switch (_e.label) {
					case 0:
						_a = options.useObjectStreams, useObjectStreams = _a === void 0 ? true : _a, _b = options.addDefaultPage, addDefaultPage = _b === void 0 ? true : _b, _c = options.objectsPerTick, objectsPerTick = _c === void 0 ? 50 : _c, _d = options.updateFieldAppearances, updateFieldAppearances = _d === void 0 ? true : _d;
						assertIs(useObjectStreams, "useObjectStreams", ["boolean"]);
						assertIs(addDefaultPage, "addDefaultPage", ["boolean"]);
						assertIs(objectsPerTick, "objectsPerTick", ["number"]);
						assertIs(updateFieldAppearances, "updateFieldAppearances", ["boolean"]);
						if (addDefaultPage && this.getPageCount() === 0) this.addPage();
						if (updateFieldAppearances) {
							form = this.formCache.getValue();
							if (form) form.updateFieldAppearances();
						}
						return [4, this.flush()];
					case 1:
						_e.sent();
						Writer = useObjectStreams ? PDFStreamWriter : PDFWriter;
						return [2, Writer.forContext(this.context, objectsPerTick).serializeToBuffer()];
				}
			});
		});
	};
	/**
	* Serialize this document to a base64 encoded string or data URI making up a
	* PDF file. For example:
	* ```js
	* const base64String = await pdfDoc.saveAsBase64()
	* base64String // => 'JVBERi0xLjcKJYGBgYEKC...'
	*
	* const base64DataUri = await pdfDoc.saveAsBase64({ dataUri: true })
	* base64DataUri // => 'data:application/pdf;base64,JVBERi0xLjcKJYGBgYEKC...'
	* ```
	*
	* @param options The options to be used when saving the document.
	* @returns Resolves with a base64 encoded string or data URI of the
	*          serialized document.
	*/
	PDFDocument.prototype.saveAsBase64 = function(options) {
		if (options === void 0) options = {};
		return __awaiter(this, void 0, void 0, function() {
			var _a, dataUri, otherOptions, bytes, base64;
			return __generator(this, function(_b) {
				switch (_b.label) {
					case 0:
						_a = options.dataUri, dataUri = _a === void 0 ? false : _a, otherOptions = __rest(options, ["dataUri"]);
						assertIs(dataUri, "dataUri", ["boolean"]);
						return [4, this.save(otherOptions)];
					case 1:
						bytes = _b.sent();
						base64 = encodeToBase64(bytes);
						return [2, dataUri ? "data:application/pdf;base64," + base64 : base64];
				}
			});
		});
	};
	PDFDocument.prototype.findPageForAnnotationRef = function(ref) {
		var pages = this.getPages();
		for (var idx = 0, len = pages.length; idx < len; idx++) {
			var page = pages[idx];
			var annotations = page.node.Annots();
			if ((annotations === null || annotations === void 0 ? void 0 : annotations.indexOf(ref)) !== void 0) return page;
		}
	};
	PDFDocument.prototype.embedAll = function(embeddables) {
		return __awaiter(this, void 0, void 0, function() {
			var idx, len;
			return __generator(this, function(_a) {
				switch (_a.label) {
					case 0:
						idx = 0, len = embeddables.length;
						_a.label = 1;
					case 1:
						if (!(idx < len)) return [3, 4];
						return [4, embeddables[idx].embed()];
					case 2:
						_a.sent();
						_a.label = 3;
					case 3:
						idx++;
						return [3, 1];
					case 4: return [2];
				}
			});
		});
	};
	PDFDocument.prototype.updateInfoDict = function() {
		var pdfLib = "pdf-lib (https://github.com/Hopding/pdf-lib)";
		var now = /* @__PURE__ */ new Date();
		var info = this.getInfoDict();
		this.setProducer(pdfLib);
		this.setModificationDate(now);
		if (!info.get(PDFName.of("Creator"))) this.setCreator(pdfLib);
		if (!info.get(PDFName.of("CreationDate"))) this.setCreationDate(now);
	};
	PDFDocument.prototype.getInfoDict = function() {
		var existingInfo = this.context.lookup(this.context.trailerInfo.Info);
		if (existingInfo instanceof PDFDict) return existingInfo;
		var newInfo = this.context.obj({});
		this.context.trailerInfo.Info = this.context.register(newInfo);
		return newInfo;
	};
	PDFDocument.prototype.assertFontkit = function() {
		if (!this.fontkit) throw new FontkitNotRegisteredError();
		return this.fontkit;
	};
	return PDFDocument;
}();
function assertIsLiteralOrHexString(pdfObject) {
	if (!(pdfObject instanceof PDFHexString) && !(pdfObject instanceof PDFString)) throw new UnexpectedObjectTypeError([PDFHexString, PDFString], pdfObject);
}
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/PDFPageOptions.js
var BlendMode;
(function(BlendMode) {
	BlendMode["Normal"] = "Normal";
	BlendMode["Multiply"] = "Multiply";
	BlendMode["Screen"] = "Screen";
	BlendMode["Overlay"] = "Overlay";
	BlendMode["Darken"] = "Darken";
	BlendMode["Lighten"] = "Lighten";
	BlendMode["ColorDodge"] = "ColorDodge";
	BlendMode["ColorBurn"] = "ColorBurn";
	BlendMode["HardLight"] = "HardLight";
	BlendMode["SoftLight"] = "SoftLight";
	BlendMode["Difference"] = "Difference";
	BlendMode["Exclusion"] = "Exclusion";
})(BlendMode || (BlendMode = {}));
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/PDFPage.js
/**
* Represents a single page of a [[PDFDocument]].
*/
var PDFPage = function() {
	function PDFPage(leafNode, ref, doc) {
		this.fontSize = 24;
		this.fontColor = rgb(0, 0, 0);
		this.lineHeight = 24;
		this.x = 0;
		this.y = 0;
		assertIs(leafNode, "leafNode", [[PDFPageLeaf, "PDFPageLeaf"]]);
		assertIs(ref, "ref", [[PDFRef, "PDFRef"]]);
		assertIs(doc, "doc", [[PDFDocument, "PDFDocument"]]);
		this.node = leafNode;
		this.ref = ref;
		this.doc = doc;
	}
	/**
	* Rotate this page by a multiple of 90 degrees. For example:
	* ```js
	* import { degrees } from 'pdf-lib'
	*
	* page.setRotation(degrees(-90))
	* page.setRotation(degrees(0))
	* page.setRotation(degrees(90))
	* page.setRotation(degrees(180))
	* page.setRotation(degrees(270))
	* ```
	* @param angle The angle to rotate this page.
	*/
	PDFPage.prototype.setRotation = function(angle) {
		var degreesAngle = toDegrees(angle);
		assertMultiple(degreesAngle, "degreesAngle", 90);
		this.node.set(PDFName.of("Rotate"), this.doc.context.obj(degreesAngle));
	};
	/**
	* Get this page's rotation angle in degrees. For example:
	* ```js
	* const rotationAngle = page.getRotation().angle;
	* ```
	* @returns The rotation angle of the page in degrees (always a multiple of
	*          90 degrees).
	*/
	PDFPage.prototype.getRotation = function() {
		var Rotate = this.node.Rotate();
		return degrees(Rotate ? Rotate.asNumber() : 0);
	};
	/**
	* Resize this page by increasing or decreasing its width and height. For
	* example:
	* ```js
	* page.setSize(250, 500)
	* page.setSize(page.getWidth() + 50, page.getHeight() + 100)
	* page.setSize(page.getWidth() - 50, page.getHeight() - 100)
	* ```
	*
	* Note that the PDF specification does not allow for pages to have explicit
	* widths and heights. Instead it defines the "size" of a page in terms of
	* five rectangles: the MediaBox, CropBox, BleedBox, TrimBox, and ArtBox. As a
	* result, this method cannot directly change the width and height of a page.
	* Instead, it works by adjusting these five boxes.
	*
	* This method performs the following steps:
	*   1. Set width & height of MediaBox.
	*   2. Set width & height of CropBox, if it has same dimensions as MediaBox.
	*   3. Set width & height of BleedBox, if it has same dimensions as MediaBox.
	*   4. Set width & height of TrimBox, if it has same dimensions as MediaBox.
	*   5. Set width & height of ArtBox, if it has same dimensions as MediaBox.
	*
	* This approach works well for most PDF documents as all PDF pages must
	* have a MediaBox, but relatively few have a CropBox, BleedBox, TrimBox, or
	* ArtBox. And when they do have these additional boxes, they often have the
	* same dimensions as the MediaBox. However, if you find this method does not
	* work for your document, consider setting the boxes directly:
	*   * [[PDFPage.setMediaBox]]
	*   * [[PDFPage.setCropBox]]
	*   * [[PDFPage.setBleedBox]]
	*   * [[PDFPage.setTrimBox]]
	*   * [[PDFPage.setArtBox]]
	*
	* @param width The new width of the page.
	* @param height The new height of the page.
	*/
	PDFPage.prototype.setSize = function(width, height) {
		assertIs(width, "width", ["number"]);
		assertIs(height, "height", ["number"]);
		var mediaBox = this.getMediaBox();
		this.setMediaBox(mediaBox.x, mediaBox.y, width, height);
		var cropBox = this.getCropBox();
		var bleedBox = this.getBleedBox();
		var trimBox = this.getTrimBox();
		var artBox = this.getArtBox();
		var hasCropBox = this.node.CropBox();
		var hasBleedBox = this.node.BleedBox();
		var hasTrimBox = this.node.TrimBox();
		var hasArtBox = this.node.ArtBox();
		if (hasCropBox && rectanglesAreEqual(cropBox, mediaBox)) this.setCropBox(mediaBox.x, mediaBox.y, width, height);
		if (hasBleedBox && rectanglesAreEqual(bleedBox, mediaBox)) this.setBleedBox(mediaBox.x, mediaBox.y, width, height);
		if (hasTrimBox && rectanglesAreEqual(trimBox, mediaBox)) this.setTrimBox(mediaBox.x, mediaBox.y, width, height);
		if (hasArtBox && rectanglesAreEqual(artBox, mediaBox)) this.setArtBox(mediaBox.x, mediaBox.y, width, height);
	};
	/**
	* Resize this page by increasing or decreasing its width. For example:
	* ```js
	* page.setWidth(250)
	* page.setWidth(page.getWidth() + 50)
	* page.setWidth(page.getWidth() - 50)
	* ```
	*
	* This method uses [[PDFPage.setSize]] to set the page's width.
	*
	* @param width The new width of the page.
	*/
	PDFPage.prototype.setWidth = function(width) {
		assertIs(width, "width", ["number"]);
		this.setSize(width, this.getSize().height);
	};
	/**
	* Resize this page by increasing or decreasing its height. For example:
	* ```js
	* page.setHeight(500)
	* page.setHeight(page.getWidth() + 100)
	* page.setHeight(page.getWidth() - 100)
	* ```
	*
	* This method uses [[PDFPage.setSize]] to set the page's height.
	*
	* @param height The new height of the page.
	*/
	PDFPage.prototype.setHeight = function(height) {
		assertIs(height, "height", ["number"]);
		this.setSize(this.getSize().width, height);
	};
	/**
	* Set the MediaBox of this page. For example:
	* ```js
	* const mediaBox = page.getMediaBox()
	*
	* page.setMediaBox(0, 0, 250, 500)
	* page.setMediaBox(mediaBox.x, mediaBox.y, 50, 100)
	* page.setMediaBox(15, 5, mediaBox.width - 50, mediaBox.height - 100)
	* ```
	*
	* See [[PDFPage.getMediaBox]] for details about what the MediaBox represents.
	*
	* @param x The x coordinate of the lower left corner of the new MediaBox.
	* @param y The y coordinate of the lower left corner of the new MediaBox.
	* @param width The width of the new MediaBox.
	* @param height The height of the new MediaBox.
	*/
	PDFPage.prototype.setMediaBox = function(x, y, width, height) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		assertIs(width, "width", ["number"]);
		assertIs(height, "height", ["number"]);
		var mediaBox = this.doc.context.obj([
			x,
			y,
			x + width,
			y + height
		]);
		this.node.set(PDFName.MediaBox, mediaBox);
	};
	/**
	* Set the CropBox of this page. For example:
	* ```js
	* const cropBox = page.getCropBox()
	*
	* page.setCropBox(0, 0, 250, 500)
	* page.setCropBox(cropBox.x, cropBox.y, 50, 100)
	* page.setCropBox(15, 5, cropBox.width - 50, cropBox.height - 100)
	* ```
	*
	* See [[PDFPage.getCropBox]] for details about what the CropBox represents.
	*
	* @param x The x coordinate of the lower left corner of the new CropBox.
	* @param y The y coordinate of the lower left corner of the new CropBox.
	* @param width The width of the new CropBox.
	* @param height The height of the new CropBox.
	*/
	PDFPage.prototype.setCropBox = function(x, y, width, height) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		assertIs(width, "width", ["number"]);
		assertIs(height, "height", ["number"]);
		var cropBox = this.doc.context.obj([
			x,
			y,
			x + width,
			y + height
		]);
		this.node.set(PDFName.CropBox, cropBox);
	};
	/**
	* Set the BleedBox of this page. For example:
	* ```js
	* const bleedBox = page.getBleedBox()
	*
	* page.setBleedBox(0, 0, 250, 500)
	* page.setBleedBox(bleedBox.x, bleedBox.y, 50, 100)
	* page.setBleedBox(15, 5, bleedBox.width - 50, bleedBox.height - 100)
	* ```
	*
	* See [[PDFPage.getBleedBox]] for details about what the BleedBox represents.
	*
	* @param x The x coordinate of the lower left corner of the new BleedBox.
	* @param y The y coordinate of the lower left corner of the new BleedBox.
	* @param width The width of the new BleedBox.
	* @param height The height of the new BleedBox.
	*/
	PDFPage.prototype.setBleedBox = function(x, y, width, height) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		assertIs(width, "width", ["number"]);
		assertIs(height, "height", ["number"]);
		var bleedBox = this.doc.context.obj([
			x,
			y,
			x + width,
			y + height
		]);
		this.node.set(PDFName.BleedBox, bleedBox);
	};
	/**
	* Set the TrimBox of this page. For example:
	* ```js
	* const trimBox = page.getTrimBox()
	*
	* page.setTrimBox(0, 0, 250, 500)
	* page.setTrimBox(trimBox.x, trimBox.y, 50, 100)
	* page.setTrimBox(15, 5, trimBox.width - 50, trimBox.height - 100)
	* ```
	*
	* See [[PDFPage.getTrimBox]] for details about what the TrimBox represents.
	*
	* @param x The x coordinate of the lower left corner of the new TrimBox.
	* @param y The y coordinate of the lower left corner of the new TrimBox.
	* @param width The width of the new TrimBox.
	* @param height The height of the new TrimBox.
	*/
	PDFPage.prototype.setTrimBox = function(x, y, width, height) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		assertIs(width, "width", ["number"]);
		assertIs(height, "height", ["number"]);
		var trimBox = this.doc.context.obj([
			x,
			y,
			x + width,
			y + height
		]);
		this.node.set(PDFName.TrimBox, trimBox);
	};
	/**
	* Set the ArtBox of this page. For example:
	* ```js
	* const artBox = page.getArtBox()
	*
	* page.setArtBox(0, 0, 250, 500)
	* page.setArtBox(artBox.x, artBox.y, 50, 100)
	* page.setArtBox(15, 5, artBox.width - 50, artBox.height - 100)
	* ```
	*
	* See [[PDFPage.getArtBox]] for details about what the ArtBox represents.
	*
	* @param x The x coordinate of the lower left corner of the new ArtBox.
	* @param y The y coordinate of the lower left corner of the new ArtBox.
	* @param width The width of the new ArtBox.
	* @param height The height of the new ArtBox.
	*/
	PDFPage.prototype.setArtBox = function(x, y, width, height) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		assertIs(width, "width", ["number"]);
		assertIs(height, "height", ["number"]);
		var artBox = this.doc.context.obj([
			x,
			y,
			x + width,
			y + height
		]);
		this.node.set(PDFName.ArtBox, artBox);
	};
	/**
	* Get this page's width and height. For example:
	* ```js
	* const { width, height } = page.getSize()
	* ```
	*
	* This method uses [[PDFPage.getMediaBox]] to obtain the page's
	* width and height.
	*
	* @returns The width and height of the page.
	*/
	PDFPage.prototype.getSize = function() {
		var _a = this.getMediaBox();
		return {
			width: _a.width,
			height: _a.height
		};
	};
	/**
	* Get this page's width. For example:
	* ```js
	* const width = page.getWidth()
	* ```
	*
	* This method uses [[PDFPage.getSize]] to obtain the page's size.
	*
	* @returns The width of the page.
	*/
	PDFPage.prototype.getWidth = function() {
		return this.getSize().width;
	};
	/**
	* Get this page's height. For example:
	* ```js
	* const height = page.getHeight()
	* ```
	*
	* This method uses [[PDFPage.getSize]] to obtain the page's size.
	*
	* @returns The height of the page.
	*/
	PDFPage.prototype.getHeight = function() {
		return this.getSize().height;
	};
	/**
	* Get the rectangle defining this page's MediaBox. For example:
	* ```js
	* const { x, y, width, height } = page.getMediaBox()
	* ```
	*
	* The MediaBox of a page defines the boundaries of the physical medium on
	* which the page is to be displayed/printed. It may include extended area
	* surrounding the page content for bleed marks, printing marks, etc...
	* It may also include areas close to the edges of the medium that cannot be
	* marked because of physical limitations of the output device. Content
	* falling outside this boundary may safely be discarded without affecting
	* the meaning of the PDF file.
	*
	* @returns An object defining the lower left corner of the MediaBox and its
	*          width & height.
	*/
	PDFPage.prototype.getMediaBox = function() {
		return this.node.MediaBox().asRectangle();
	};
	/**
	* Get the rectangle defining this page's CropBox. For example:
	* ```js
	* const { x, y, width, height } = page.getCropBox()
	* ```
	*
	* The CropBox of a page defines the region to which the contents of the page
	* shall be clipped when displayed or printed. Unlike the other boxes, the
	* CropBox does not necessarily represent the physical page geometry. It
	* merely imposes clipping on the page contents.
	*
	* The CropBox's default value is the page's MediaBox.
	*
	* @returns An object defining the lower left corner of the CropBox and its
	*          width & height.
	*/
	PDFPage.prototype.getCropBox = function() {
		var _a;
		var cropBox = this.node.CropBox();
		return (_a = cropBox === null || cropBox === void 0 ? void 0 : cropBox.asRectangle()) !== null && _a !== void 0 ? _a : this.getMediaBox();
	};
	/**
	* Get the rectangle defining this page's BleedBox. For example:
	* ```js
	* const { x, y, width, height } = page.getBleedBox()
	* ```
	*
	* The BleedBox of a page defines the region to which the contents of the
	* page shall be clipped when output in a production environment. This may
	* include any extra bleed area needed to accommodate the physical
	* limitations of cutting, folding, and trimming equipment. The actual
	* printed page may include printing marks that fall outside the BleedBox.
	*
	* The BleedBox's default value is the page's CropBox.
	*
	* @returns An object defining the lower left corner of the BleedBox and its
	*          width & height.
	*/
	PDFPage.prototype.getBleedBox = function() {
		var _a;
		var bleedBox = this.node.BleedBox();
		return (_a = bleedBox === null || bleedBox === void 0 ? void 0 : bleedBox.asRectangle()) !== null && _a !== void 0 ? _a : this.getCropBox();
	};
	/**
	* Get the rectangle defining this page's TrimBox. For example:
	* ```js
	* const { x, y, width, height } = page.getTrimBox()
	* ```
	*
	* The TrimBox of a page defines the intended dimensions of the finished
	* page after trimming. It may be smaller than the MediaBox to allow for
	* production-related content, such as printing instructions, cut marks, or
	* color bars.
	*
	* The TrimBox's default value is the page's CropBox.
	*
	* @returns An object defining the lower left corner of the TrimBox and its
	*          width & height.
	*/
	PDFPage.prototype.getTrimBox = function() {
		var _a;
		var trimBox = this.node.TrimBox();
		return (_a = trimBox === null || trimBox === void 0 ? void 0 : trimBox.asRectangle()) !== null && _a !== void 0 ? _a : this.getCropBox();
	};
	/**
	* Get the rectangle defining this page's ArtBox. For example:
	* ```js
	* const { x, y, width, height } = page.getArtBox()
	* ```
	*
	* The ArtBox of a page defines the extent of the page's meaningful content
	* (including potential white space).
	*
	* The ArtBox's default value is the page's CropBox.
	*
	* @returns An object defining the lower left corner of the ArtBox and its
	*          width & height.
	*/
	PDFPage.prototype.getArtBox = function() {
		var _a;
		var artBox = this.node.ArtBox();
		return (_a = artBox === null || artBox === void 0 ? void 0 : artBox.asRectangle()) !== null && _a !== void 0 ? _a : this.getCropBox();
	};
	/**
	* Translate this page's content to a new location on the page. This operation
	* is often useful after resizing the page with [[setSize]]. For example:
	* ```js
	* // Add 50 units of whitespace to the top and right of the page
	* page.setSize(page.getWidth() + 50, page.getHeight() + 50)
	*
	* // Move the page's content from the lower-left corner of the page
	* // to the top-right corner.
	* page.translateContent(50, 50)
	*
	* // Now there are 50 units of whitespace to the left and bottom of the page
	* ```
	* See also: [[resetPosition]]
	* @param x The new position on the x-axis for this page's content.
	* @param y The new position on the y-axis for this page's content.
	*/
	PDFPage.prototype.translateContent = function(x, y) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		this.node.normalize();
		this.getContentStream();
		var start = this.createContentStream(pushGraphicsState(), translate(x, y));
		var startRef = this.doc.context.register(start);
		var end = this.createContentStream(popGraphicsState());
		var endRef = this.doc.context.register(end);
		this.node.wrapContentStreams(startRef, endRef);
	};
	/**
	* Scale the size, content, and annotations of a page.
	*
	* For example:
	* ```js
	* page.scale(0.5, 0.5);
	* ```
	*
	* @param x The factor by which the width for the page should be scaled
	*          (e.g. `0.5` is 50%).
	* @param y The factor by which the height for the page should be scaled
	*          (e.g. `2.0` is 200%).
	*/
	PDFPage.prototype.scale = function(x, y) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		this.setSize(this.getWidth() * x, this.getHeight() * y);
		this.scaleContent(x, y);
		this.scaleAnnotations(x, y);
	};
	/**
	* Scale the content of a page. This is useful after resizing an existing
	* page. This scales only the content, not the annotations.
	*
	* For example:
	* ```js
	* // Bisect the size of the page
	* page.setSize(page.getWidth() / 2, page.getHeight() / 2);
	*
	* // Scale the content of the page down by 50% in x and y
	* page.scaleContent(0.5, 0.5);
	* ```
	* See also: [[scaleAnnotations]]
	* @param x The factor by which the x-axis for the content should be scaled
	*          (e.g. `0.5` is 50%).
	* @param y The factor by which the y-axis for the content should be scaled
	*          (e.g. `2.0` is 200%).
	*/
	PDFPage.prototype.scaleContent = function(x, y) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		this.node.normalize();
		this.getContentStream();
		var start = this.createContentStream(pushGraphicsState(), scale(x, y));
		var startRef = this.doc.context.register(start);
		var end = this.createContentStream(popGraphicsState());
		var endRef = this.doc.context.register(end);
		this.node.wrapContentStreams(startRef, endRef);
	};
	/**
	* Scale the annotations of a page. This is useful if you want to scale a
	* page with comments or other annotations.
	* ```js
	* // Scale the content of the page down by 50% in x and y
	* page.scaleContent(0.5, 0.5);
	*
	* // Scale the content of the page down by 50% in x and y
	* page.scaleAnnotations(0.5, 0.5);
	* ```
	* See also: [[scaleContent]]
	* @param x The factor by which the x-axis for the annotations should be
	*          scaled (e.g. `0.5` is 50%).
	* @param y The factor by which the y-axis for the annotations should be
	*          scaled (e.g. `2.0` is 200%).
	*/
	PDFPage.prototype.scaleAnnotations = function(x, y) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		var annots = this.node.Annots();
		if (!annots) return;
		for (var idx = 0; idx < annots.size(); idx++) {
			var annot = annots.lookup(idx);
			if (annot instanceof PDFDict) this.scaleAnnot(annot, x, y);
		}
	};
	/**
	* Reset the x and y coordinates of this page to `(0, 0)`. This operation is
	* often useful after calling [[translateContent]]. For example:
	* ```js
	* // Shift the page's contents up and to the right by 50 units
	* page.translateContent(50, 50)
	*
	* // This text will shifted - it will be drawn at (50, 50)
	* page.drawText('I am shifted')
	*
	* // Move back to (0, 0)
	* page.resetPosition()
	*
	* // This text will not be shifted - it will be drawn at (0, 0)
	* page.drawText('I am not shifted')
	* ```
	*/
	PDFPage.prototype.resetPosition = function() {
		this.getContentStream(false);
		this.x = 0;
		this.y = 0;
	};
	/**
	* Choose a default font for this page. The default font will be used whenever
	* text is drawn on this page and no font is specified. For example:
	* ```js
	* import { StandardFonts } from 'pdf-lib'
	*
	* const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
	* const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const courierFont = await pdfDoc.embedFont(StandardFonts.Courier)
	*
	* const page = pdfDoc.addPage()
	*
	* page.setFont(helveticaFont)
	* page.drawText('I will be drawn in Helvetica')
	*
	* page.setFont(timesRomanFont)
	* page.drawText('I will be drawn in Courier', { font: courierFont })
	* ```
	* @param font The default font to be used when drawing text on this page.
	*/
	PDFPage.prototype.setFont = function(font) {
		assertIs(font, "font", [[PDFFont, "PDFFont"]]);
		this.font = font;
		this.fontKey = this.node.newFontDictionary(this.font.name, this.font.ref);
	};
	/**
	* Choose a default font size for this page. The default font size will be
	* used whenever text is drawn on this page and no font size is specified.
	* For example:
	* ```js
	* page.setFontSize(12)
	* page.drawText('I will be drawn in size 12')
	*
	* page.setFontSize(36)
	* page.drawText('I will be drawn in size 24', { fontSize: 24 })
	* ```
	* @param fontSize The default font size to be used when drawing text on this
	*                 page.
	*/
	PDFPage.prototype.setFontSize = function(fontSize) {
		assertIs(fontSize, "fontSize", ["number"]);
		this.fontSize = fontSize;
	};
	/**
	* Choose a default font color for this page. The default font color will be
	* used whenever text is drawn on this page and no font color is specified.
	* For example:
	* ```js
	* import { rgb, cmyk, grayscale } from 'pdf-lib'
	*
	* page.setFontColor(rgb(0.97, 0.02, 0.97))
	* page.drawText('I will be drawn in pink')
	*
	* page.setFontColor(cmyk(0.4, 0.7, 0.39, 0.15))
	* page.drawText('I will be drawn in gray', { color: grayscale(0.5) })
	* ```
	* @param fontColor The default font color to be used when drawing text on
	*                  this page.
	*/
	PDFPage.prototype.setFontColor = function(fontColor) {
		assertIs(fontColor, "fontColor", [[Object, "Color"]]);
		this.fontColor = fontColor;
	};
	/**
	* Choose a default line height for this page. The default line height will be
	* used whenever text is drawn on this page and no line height is specified.
	* For example:
	* ```js
	* page.setLineHeight(12);
	* page.drawText('These lines will be vertically \n separated by 12 units')
	*
	* page.setLineHeight(36);
	* page.drawText('These lines will be vertically \n separated by 24 units', {
	*   lineHeight: 24
	* })
	* ```
	* @param lineHeight The default line height to be used when drawing text on
	*                   this page.
	*/
	PDFPage.prototype.setLineHeight = function(lineHeight) {
		assertIs(lineHeight, "lineHeight", ["number"]);
		this.lineHeight = lineHeight;
	};
	/**
	* Get the default position of this page. For example:
	* ```js
	* const { x, y } = page.getPosition()
	* ```
	* @returns The default position of the page.
	*/
	PDFPage.prototype.getPosition = function() {
		return {
			x: this.x,
			y: this.y
		};
	};
	/**
	* Get the default x coordinate of this page. For example:
	* ```js
	* const x = page.getX()
	* ```
	* @returns The default x coordinate of the page.
	*/
	PDFPage.prototype.getX = function() {
		return this.x;
	};
	/**
	* Get the default y coordinate of this page. For example:
	* ```js
	* const y = page.getY()
	* ```
	* @returns The default y coordinate of the page.
	*/
	PDFPage.prototype.getY = function() {
		return this.y;
	};
	/**
	* Change the default position of this page. For example:
	* ```js
	* page.moveTo(0, 0)
	* page.drawText('I will be drawn at the origin')
	*
	* page.moveTo(0, 25)
	* page.drawText('I will be drawn 25 units up')
	*
	* page.moveTo(25, 25)
	* page.drawText('I will be drawn 25 units up and 25 units to the right')
	* ```
	* @param x The new default position on the x-axis for this page.
	* @param y The new default position on the y-axis for this page.
	*/
	PDFPage.prototype.moveTo = function(x, y) {
		assertIs(x, "x", ["number"]);
		assertIs(y, "y", ["number"]);
		this.x = x;
		this.y = y;
	};
	/**
	* Change the default position of this page to be further down the y-axis.
	* For example:
	* ```js
	* page.moveTo(50, 50)
	* page.drawText('I will be drawn at (50, 50)')
	*
	* page.moveDown(10)
	* page.drawText('I will be drawn at (50, 40)')
	* ```
	* @param yDecrease The amount by which the page's default position along the
	*                  y-axis should be decreased.
	*/
	PDFPage.prototype.moveDown = function(yDecrease) {
		assertIs(yDecrease, "yDecrease", ["number"]);
		this.y -= yDecrease;
	};
	/**
	* Change the default position of this page to be further up the y-axis.
	* For example:
	* ```js
	* page.moveTo(50, 50)
	* page.drawText('I will be drawn at (50, 50)')
	*
	* page.moveUp(10)
	* page.drawText('I will be drawn at (50, 60)')
	* ```
	* @param yIncrease The amount by which the page's default position along the
	*                  y-axis should be increased.
	*/
	PDFPage.prototype.moveUp = function(yIncrease) {
		assertIs(yIncrease, "yIncrease", ["number"]);
		this.y += yIncrease;
	};
	/**
	* Change the default position of this page to be further left on the x-axis.
	* For example:
	* ```js
	* page.moveTo(50, 50)
	* page.drawText('I will be drawn at (50, 50)')
	*
	* page.moveLeft(10)
	* page.drawText('I will be drawn at (40, 50)')
	* ```
	* @param xDecrease The amount by which the page's default position along the
	*                  x-axis should be decreased.
	*/
	PDFPage.prototype.moveLeft = function(xDecrease) {
		assertIs(xDecrease, "xDecrease", ["number"]);
		this.x -= xDecrease;
	};
	/**
	* Change the default position of this page to be further right on the y-axis.
	* For example:
	* ```js
	* page.moveTo(50, 50)
	* page.drawText('I will be drawn at (50, 50)')
	*
	* page.moveRight(10)
	* page.drawText('I will be drawn at (60, 50)')
	* ```
	* @param xIncrease The amount by which the page's default position along the
	*                  x-axis should be increased.
	*/
	PDFPage.prototype.moveRight = function(xIncrease) {
		assertIs(xIncrease, "xIncrease", ["number"]);
		this.x += xIncrease;
	};
	/**
	* Push one or more operators to the end of this page's current content
	* stream. For example:
	* ```js
	* import {
	*   pushGraphicsState,
	*   moveTo,
	*   lineTo,
	*   closePath,
	*   setFillingColor,
	*   rgb,
	*   fill,
	*   popGraphicsState,
	* } from 'pdf-lib'
	*
	* // Draw a green triangle in the lower-left corner of the page
	* page.pushOperators(
	*   pushGraphicsState(),
	*   moveTo(0, 0),
	*   lineTo(100, 0),
	*   lineTo(50, 100),
	*   closePath(),
	*   setFillingColor(rgb(0.0, 1.0, 0.0)),
	*   fill(),
	*   popGraphicsState(),
	* )
	* ```
	* @param operator The operators to be pushed.
	*/
	PDFPage.prototype.pushOperators = function() {
		var operator = [];
		for (var _i = 0; _i < arguments.length; _i++) operator[_i] = arguments[_i];
		assertEachIs(operator, "operator", [[PDFOperator, "PDFOperator"]]);
		var contentStream = this.getContentStream();
		contentStream.push.apply(contentStream, operator);
	};
	/**
	* Draw one or more lines of text on this page. For example:
	* ```js
	* import { StandardFonts, rgb } from 'pdf-lib'
	*
	* const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
	*
	* const page = pdfDoc.addPage()
	*
	* page.setFont(helveticaFont)
	*
	* page.moveTo(5, 200)
	* page.drawText('The Life of an Egg', { size: 36 })
	*
	* page.moveDown(36)
	* page.drawText('An Epic Tale of Woe', { size: 30 })
	*
	* page.drawText(
	*   `Humpty Dumpty sat on a wall \n` +
	*   `Humpty Dumpty had a great fall; \n` +
	*   `All the king's horses and all the king's men \n` +
	*   `Couldn't put Humpty together again. \n`,
	*   {
	*     x: 25,
	*     y: 100,
	*     font: timesRomanFont,
	*     size: 24,
	*     color: rgb(1, 0, 0),
	*     lineHeight: 24,
	*     opacity: 0.75,
	*   },
	* )
	* ```
	* @param text The text to be drawn.
	* @param options The options to be used when drawing the text.
	*/
	PDFPage.prototype.drawText = function(text, options) {
		var _a, _b, _c, _d, _e, _f, _g;
		if (options === void 0) options = {};
		assertIs(text, "text", ["string"]);
		assertOrUndefined(options.color, "options.color", [[Object, "Color"]]);
		assertRangeOrUndefined(options.opacity, "opacity.opacity", 0, 1);
		assertOrUndefined(options.font, "options.font", [[PDFFont, "PDFFont"]]);
		assertOrUndefined(options.size, "options.size", ["number"]);
		assertOrUndefined(options.rotate, "options.rotate", [[Object, "Rotation"]]);
		assertOrUndefined(options.xSkew, "options.xSkew", [[Object, "Rotation"]]);
		assertOrUndefined(options.ySkew, "options.ySkew", [[Object, "Rotation"]]);
		assertOrUndefined(options.x, "options.x", ["number"]);
		assertOrUndefined(options.y, "options.y", ["number"]);
		assertOrUndefined(options.lineHeight, "options.lineHeight", ["number"]);
		assertOrUndefined(options.maxWidth, "options.maxWidth", ["number"]);
		assertOrUndefined(options.wordBreaks, "options.wordBreaks", [Array]);
		assertIsOneOfOrUndefined(options.blendMode, "options.blendMode", BlendMode);
		var _h = this.setOrEmbedFont(options.font), oldFont = _h.oldFont, newFont = _h.newFont, newFontKey = _h.newFontKey;
		var fontSize = options.size || this.fontSize;
		var wordBreaks = options.wordBreaks || this.doc.defaultWordBreaks;
		var textWidth = function(t) {
			return newFont.widthOfTextAtSize(t, fontSize);
		};
		var lines = options.maxWidth === void 0 ? lineSplit(cleanText(text)) : breakTextIntoLines(text, wordBreaks, options.maxWidth, textWidth);
		var encodedLines = new Array(lines.length);
		for (var idx = 0, len = lines.length; idx < len; idx++) encodedLines[idx] = newFont.encodeText(lines[idx]);
		var graphicsStateKey = this.maybeEmbedGraphicsState({
			opacity: options.opacity,
			blendMode: options.blendMode
		});
		var contentStream = this.getContentStream();
		contentStream.push.apply(contentStream, drawLinesOfText(encodedLines, {
			color: (_a = options.color) !== null && _a !== void 0 ? _a : this.fontColor,
			font: newFontKey,
			size: fontSize,
			rotate: (_b = options.rotate) !== null && _b !== void 0 ? _b : degrees(0),
			xSkew: (_c = options.xSkew) !== null && _c !== void 0 ? _c : degrees(0),
			ySkew: (_d = options.ySkew) !== null && _d !== void 0 ? _d : degrees(0),
			x: (_e = options.x) !== null && _e !== void 0 ? _e : this.x,
			y: (_f = options.y) !== null && _f !== void 0 ? _f : this.y,
			lineHeight: (_g = options.lineHeight) !== null && _g !== void 0 ? _g : this.lineHeight,
			graphicsState: graphicsStateKey
		}));
		if (options.font) if (oldFont) this.setFont(oldFont);
		else this.resetFont();
	};
	/**
	* Draw an image on this page. For example:
	* ```js
	* import { degrees } from 'pdf-lib'
	*
	* const jpgUrl = 'https://pdf-lib.js.org/assets/cat_riding_unicorn.jpg'
	* const jpgImageBytes = await fetch(jpgUrl).then((res) => res.arrayBuffer())
	*
	* const jpgImage = await pdfDoc.embedJpg(jpgImageBytes)
	* const jpgDims = jpgImage.scale(0.5)
	*
	* const page = pdfDoc.addPage()
	*
	* page.drawImage(jpgImage, {
	*   x: 25,
	*   y: 25,
	*   width: jpgDims.width,
	*   height: jpgDims.height,
	*   rotate: degrees(30),
	*   opacity: 0.75,
	* })
	* ```
	* @param image The image to be drawn.
	* @param options The options to be used when drawing the image.
	*/
	PDFPage.prototype.drawImage = function(image, options) {
		var _a, _b, _c, _d, _e, _f, _g;
		if (options === void 0) options = {};
		assertIs(image, "image", [[PDFImage, "PDFImage"]]);
		assertOrUndefined(options.x, "options.x", ["number"]);
		assertOrUndefined(options.y, "options.y", ["number"]);
		assertOrUndefined(options.width, "options.width", ["number"]);
		assertOrUndefined(options.height, "options.height", ["number"]);
		assertOrUndefined(options.rotate, "options.rotate", [[Object, "Rotation"]]);
		assertOrUndefined(options.xSkew, "options.xSkew", [[Object, "Rotation"]]);
		assertOrUndefined(options.ySkew, "options.ySkew", [[Object, "Rotation"]]);
		assertRangeOrUndefined(options.opacity, "opacity.opacity", 0, 1);
		assertIsOneOfOrUndefined(options.blendMode, "options.blendMode", BlendMode);
		var xObjectKey = this.node.newXObject("Image", image.ref);
		var graphicsStateKey = this.maybeEmbedGraphicsState({
			opacity: options.opacity,
			blendMode: options.blendMode
		});
		var contentStream = this.getContentStream();
		contentStream.push.apply(contentStream, drawImage(xObjectKey, {
			x: (_a = options.x) !== null && _a !== void 0 ? _a : this.x,
			y: (_b = options.y) !== null && _b !== void 0 ? _b : this.y,
			width: (_c = options.width) !== null && _c !== void 0 ? _c : image.size().width,
			height: (_d = options.height) !== null && _d !== void 0 ? _d : image.size().height,
			rotate: (_e = options.rotate) !== null && _e !== void 0 ? _e : degrees(0),
			xSkew: (_f = options.xSkew) !== null && _f !== void 0 ? _f : degrees(0),
			ySkew: (_g = options.ySkew) !== null && _g !== void 0 ? _g : degrees(0),
			graphicsState: graphicsStateKey
		}));
	};
	/**
	* Draw an embedded PDF page on this page. For example:
	* ```js
	* import { degrees } from 'pdf-lib'
	*
	* const pdfDoc = await PDFDocument.create()
	* const page = pdfDoc.addPage()
	*
	* const sourcePdfUrl = 'https://pdf-lib.js.org/assets/with_large_page_count.pdf'
	* const sourcePdf = await fetch(sourcePdfUrl).then((res) => res.arrayBuffer())
	*
	* // Embed page 74 from the PDF
	* const [embeddedPage] = await pdfDoc.embedPdf(sourcePdf, 73)
	*
	* page.drawPage(embeddedPage, {
	*   x: 250,
	*   y: 200,
	*   xScale: 0.5,
	*   yScale: 0.5,
	*   rotate: degrees(30),
	*   opacity: 0.75,
	* })
	* ```
	*
	* The `options` argument accepts both `width`/`height` and `xScale`/`yScale`
	* as options. Since each of these options defines the size of the drawn page,
	* if both options are given, `width` and `height` take precedence and the
	* corresponding scale variants are ignored.
	*
	* @param embeddedPage The embedded page to be drawn.
	* @param options The options to be used when drawing the embedded page.
	*/
	PDFPage.prototype.drawPage = function(embeddedPage, options) {
		var _a, _b, _c, _d, _e;
		if (options === void 0) options = {};
		assertIs(embeddedPage, "embeddedPage", [[PDFEmbeddedPage, "PDFEmbeddedPage"]]);
		assertOrUndefined(options.x, "options.x", ["number"]);
		assertOrUndefined(options.y, "options.y", ["number"]);
		assertOrUndefined(options.xScale, "options.xScale", ["number"]);
		assertOrUndefined(options.yScale, "options.yScale", ["number"]);
		assertOrUndefined(options.width, "options.width", ["number"]);
		assertOrUndefined(options.height, "options.height", ["number"]);
		assertOrUndefined(options.rotate, "options.rotate", [[Object, "Rotation"]]);
		assertOrUndefined(options.xSkew, "options.xSkew", [[Object, "Rotation"]]);
		assertOrUndefined(options.ySkew, "options.ySkew", [[Object, "Rotation"]]);
		assertRangeOrUndefined(options.opacity, "opacity.opacity", 0, 1);
		assertIsOneOfOrUndefined(options.blendMode, "options.blendMode", BlendMode);
		var xObjectKey = this.node.newXObject("EmbeddedPdfPage", embeddedPage.ref);
		var graphicsStateKey = this.maybeEmbedGraphicsState({
			opacity: options.opacity,
			blendMode: options.blendMode
		});
		var xScale = options.width !== void 0 ? options.width / embeddedPage.width : options.xScale !== void 0 ? options.xScale : 1;
		var yScale = options.height !== void 0 ? options.height / embeddedPage.height : options.yScale !== void 0 ? options.yScale : 1;
		var contentStream = this.getContentStream();
		contentStream.push.apply(contentStream, drawPage(xObjectKey, {
			x: (_a = options.x) !== null && _a !== void 0 ? _a : this.x,
			y: (_b = options.y) !== null && _b !== void 0 ? _b : this.y,
			xScale,
			yScale,
			rotate: (_c = options.rotate) !== null && _c !== void 0 ? _c : degrees(0),
			xSkew: (_d = options.xSkew) !== null && _d !== void 0 ? _d : degrees(0),
			ySkew: (_e = options.ySkew) !== null && _e !== void 0 ? _e : degrees(0),
			graphicsState: graphicsStateKey
		}));
	};
	/**
	* Draw an SVG path on this page. For example:
	* ```js
	* import { rgb } from 'pdf-lib'
	*
	* const svgPath = 'M 0,20 L 100,160 Q 130,200 150,120 C 190,-40 200,200 300,150 L 400,90'
	*
	* // Draw path as black line
	* page.drawSvgPath(svgPath, { x: 25, y: 75 })
	*
	* // Change border style and opacity
	* page.drawSvgPath(svgPath, {
	*   x: 25,
	*   y: 275,
	*   borderColor: rgb(0.5, 0.5, 0.5),
	*   borderWidth: 2,
	*   borderOpacity: 0.75,
	* })
	*
	* // Set fill color and opacity
	* page.drawSvgPath(svgPath, {
	*   x: 25,
	*   y: 475,
	*   color: rgb(1.0, 0, 0),
	*   opacity: 0.75,
	* })
	*
	* // Draw 50% of original size
	* page.drawSvgPath(svgPath, {
	*   x: 25,
	*   y: 675,
	*   scale: 0.5,
	* })
	* ```
	* @param path The SVG path to be drawn.
	* @param options The options to be used when drawing the SVG path.
	*/
	PDFPage.prototype.drawSvgPath = function(path, options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _j;
		if (options === void 0) options = {};
		assertIs(path, "path", ["string"]);
		assertOrUndefined(options.x, "options.x", ["number"]);
		assertOrUndefined(options.y, "options.y", ["number"]);
		assertOrUndefined(options.scale, "options.scale", ["number"]);
		assertOrUndefined(options.rotate, "options.rotate", [[Object, "Rotation"]]);
		assertOrUndefined(options.borderWidth, "options.borderWidth", ["number"]);
		assertOrUndefined(options.color, "options.color", [[Object, "Color"]]);
		assertRangeOrUndefined(options.opacity, "opacity.opacity", 0, 1);
		assertOrUndefined(options.borderColor, "options.borderColor", [[Object, "Color"]]);
		assertOrUndefined(options.borderDashArray, "options.borderDashArray", [Array]);
		assertOrUndefined(options.borderDashPhase, "options.borderDashPhase", ["number"]);
		assertIsOneOfOrUndefined(options.borderLineCap, "options.borderLineCap", LineCapStyle);
		assertRangeOrUndefined(options.borderOpacity, "options.borderOpacity", 0, 1);
		assertIsOneOfOrUndefined(options.blendMode, "options.blendMode", BlendMode);
		var graphicsStateKey = this.maybeEmbedGraphicsState({
			opacity: options.opacity,
			borderOpacity: options.borderOpacity,
			blendMode: options.blendMode
		});
		if (!("color" in options) && !("borderColor" in options)) options.borderColor = rgb(0, 0, 0);
		var contentStream = this.getContentStream();
		contentStream.push.apply(contentStream, drawSvgPath(path, {
			x: (_a = options.x) !== null && _a !== void 0 ? _a : this.x,
			y: (_b = options.y) !== null && _b !== void 0 ? _b : this.y,
			scale: options.scale,
			rotate: (_c = options.rotate) !== null && _c !== void 0 ? _c : degrees(0),
			color: (_d = options.color) !== null && _d !== void 0 ? _d : void 0,
			borderColor: (_e = options.borderColor) !== null && _e !== void 0 ? _e : void 0,
			borderWidth: (_f = options.borderWidth) !== null && _f !== void 0 ? _f : 0,
			borderDashArray: (_g = options.borderDashArray) !== null && _g !== void 0 ? _g : void 0,
			borderDashPhase: (_h = options.borderDashPhase) !== null && _h !== void 0 ? _h : void 0,
			borderLineCap: (_j = options.borderLineCap) !== null && _j !== void 0 ? _j : void 0,
			graphicsState: graphicsStateKey
		}));
	};
	/**
	* Draw a line on this page. For example:
	* ```js
	* import { rgb } from 'pdf-lib'
	*
	* page.drawLine({
	*   start: { x: 25, y: 75 },
	*   end: { x: 125, y: 175 },
	*   thickness: 2,
	*   color: rgb(0.75, 0.2, 0.2),
	*   opacity: 0.75,
	* })
	* ```
	* @param options The options to be used when drawing the line.
	*/
	PDFPage.prototype.drawLine = function(options) {
		var _a, _b, _c, _d, _e;
		assertIs(options.start, "options.start", [[Object, "{ x: number, y: number }"]]);
		assertIs(options.end, "options.end", [[Object, "{ x: number, y: number }"]]);
		assertIs(options.start.x, "options.start.x", ["number"]);
		assertIs(options.start.y, "options.start.y", ["number"]);
		assertIs(options.end.x, "options.end.x", ["number"]);
		assertIs(options.end.y, "options.end.y", ["number"]);
		assertOrUndefined(options.thickness, "options.thickness", ["number"]);
		assertOrUndefined(options.color, "options.color", [[Object, "Color"]]);
		assertOrUndefined(options.dashArray, "options.dashArray", [Array]);
		assertOrUndefined(options.dashPhase, "options.dashPhase", ["number"]);
		assertIsOneOfOrUndefined(options.lineCap, "options.lineCap", LineCapStyle);
		assertRangeOrUndefined(options.opacity, "opacity.opacity", 0, 1);
		assertIsOneOfOrUndefined(options.blendMode, "options.blendMode", BlendMode);
		var graphicsStateKey = this.maybeEmbedGraphicsState({
			borderOpacity: options.opacity,
			blendMode: options.blendMode
		});
		if (!("color" in options)) options.color = rgb(0, 0, 0);
		var contentStream = this.getContentStream();
		contentStream.push.apply(contentStream, drawLine({
			start: options.start,
			end: options.end,
			thickness: (_a = options.thickness) !== null && _a !== void 0 ? _a : 1,
			color: (_b = options.color) !== null && _b !== void 0 ? _b : void 0,
			dashArray: (_c = options.dashArray) !== null && _c !== void 0 ? _c : void 0,
			dashPhase: (_d = options.dashPhase) !== null && _d !== void 0 ? _d : void 0,
			lineCap: (_e = options.lineCap) !== null && _e !== void 0 ? _e : void 0,
			graphicsState: graphicsStateKey
		}));
	};
	/**
	* Draw a rectangle on this page. For example:
	* ```js
	* import { degrees, grayscale, rgb } from 'pdf-lib'
	*
	* page.drawRectangle({
	*   x: 25,
	*   y: 75,
	*   width: 250,
	*   height: 75,
	*   rotate: degrees(-15),
	*   borderWidth: 5,
	*   borderColor: grayscale(0.5),
	*   color: rgb(0.75, 0.2, 0.2),
	*   opacity: 0.5,
	*   borderOpacity: 0.75,
	* })
	* ```
	* @param options The options to be used when drawing the rectangle.
	*/
	PDFPage.prototype.drawRectangle = function(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
		if (options === void 0) options = {};
		assertOrUndefined(options.x, "options.x", ["number"]);
		assertOrUndefined(options.y, "options.y", ["number"]);
		assertOrUndefined(options.width, "options.width", ["number"]);
		assertOrUndefined(options.height, "options.height", ["number"]);
		assertOrUndefined(options.rotate, "options.rotate", [[Object, "Rotation"]]);
		assertOrUndefined(options.xSkew, "options.xSkew", [[Object, "Rotation"]]);
		assertOrUndefined(options.ySkew, "options.ySkew", [[Object, "Rotation"]]);
		assertOrUndefined(options.borderWidth, "options.borderWidth", ["number"]);
		assertOrUndefined(options.color, "options.color", [[Object, "Color"]]);
		assertRangeOrUndefined(options.opacity, "opacity.opacity", 0, 1);
		assertOrUndefined(options.borderColor, "options.borderColor", [[Object, "Color"]]);
		assertOrUndefined(options.borderDashArray, "options.borderDashArray", [Array]);
		assertOrUndefined(options.borderDashPhase, "options.borderDashPhase", ["number"]);
		assertIsOneOfOrUndefined(options.borderLineCap, "options.borderLineCap", LineCapStyle);
		assertRangeOrUndefined(options.borderOpacity, "options.borderOpacity", 0, 1);
		assertIsOneOfOrUndefined(options.blendMode, "options.blendMode", BlendMode);
		var graphicsStateKey = this.maybeEmbedGraphicsState({
			opacity: options.opacity,
			borderOpacity: options.borderOpacity,
			blendMode: options.blendMode
		});
		if (!("color" in options) && !("borderColor" in options)) options.color = rgb(0, 0, 0);
		var contentStream = this.getContentStream();
		contentStream.push.apply(contentStream, drawRectangle({
			x: (_a = options.x) !== null && _a !== void 0 ? _a : this.x,
			y: (_b = options.y) !== null && _b !== void 0 ? _b : this.y,
			width: (_c = options.width) !== null && _c !== void 0 ? _c : 150,
			height: (_d = options.height) !== null && _d !== void 0 ? _d : 100,
			rotate: (_e = options.rotate) !== null && _e !== void 0 ? _e : degrees(0),
			xSkew: (_f = options.xSkew) !== null && _f !== void 0 ? _f : degrees(0),
			ySkew: (_g = options.ySkew) !== null && _g !== void 0 ? _g : degrees(0),
			borderWidth: (_h = options.borderWidth) !== null && _h !== void 0 ? _h : 0,
			color: (_j = options.color) !== null && _j !== void 0 ? _j : void 0,
			borderColor: (_k = options.borderColor) !== null && _k !== void 0 ? _k : void 0,
			borderDashArray: (_l = options.borderDashArray) !== null && _l !== void 0 ? _l : void 0,
			borderDashPhase: (_m = options.borderDashPhase) !== null && _m !== void 0 ? _m : void 0,
			graphicsState: graphicsStateKey,
			borderLineCap: (_o = options.borderLineCap) !== null && _o !== void 0 ? _o : void 0
		}));
	};
	/**
	* Draw a square on this page. For example:
	* ```js
	* import { degrees, grayscale, rgb } from 'pdf-lib'
	*
	* page.drawSquare({
	*   x: 25,
	*   y: 75,
	*   size: 100,
	*   rotate: degrees(-15),
	*   borderWidth: 5,
	*   borderColor: grayscale(0.5),
	*   color: rgb(0.75, 0.2, 0.2),
	*   opacity: 0.5,
	*   borderOpacity: 0.75,
	* })
	* ```
	* @param options The options to be used when drawing the square.
	*/
	PDFPage.prototype.drawSquare = function(options) {
		if (options === void 0) options = {};
		var size = options.size;
		assertOrUndefined(size, "size", ["number"]);
		this.drawRectangle(__assign(__assign({}, options), {
			width: size,
			height: size
		}));
	};
	/**
	* Draw an ellipse on this page. For example:
	* ```js
	* import { grayscale, rgb } from 'pdf-lib'
	*
	* page.drawEllipse({
	*   x: 200,
	*   y: 75,
	*   xScale: 100,
	*   yScale: 50,
	*   borderWidth: 5,
	*   borderColor: grayscale(0.5),
	*   color: rgb(0.75, 0.2, 0.2),
	*   opacity: 0.5,
	*   borderOpacity: 0.75,
	* })
	* ```
	* @param options The options to be used when drawing the ellipse.
	*/
	PDFPage.prototype.drawEllipse = function(options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
		if (options === void 0) options = {};
		assertOrUndefined(options.x, "options.x", ["number"]);
		assertOrUndefined(options.y, "options.y", ["number"]);
		assertOrUndefined(options.xScale, "options.xScale", ["number"]);
		assertOrUndefined(options.yScale, "options.yScale", ["number"]);
		assertOrUndefined(options.rotate, "options.rotate", [[Object, "Rotation"]]);
		assertOrUndefined(options.color, "options.color", [[Object, "Color"]]);
		assertRangeOrUndefined(options.opacity, "opacity.opacity", 0, 1);
		assertOrUndefined(options.borderColor, "options.borderColor", [[Object, "Color"]]);
		assertRangeOrUndefined(options.borderOpacity, "options.borderOpacity", 0, 1);
		assertOrUndefined(options.borderWidth, "options.borderWidth", ["number"]);
		assertOrUndefined(options.borderDashArray, "options.borderDashArray", [Array]);
		assertOrUndefined(options.borderDashPhase, "options.borderDashPhase", ["number"]);
		assertIsOneOfOrUndefined(options.borderLineCap, "options.borderLineCap", LineCapStyle);
		assertIsOneOfOrUndefined(options.blendMode, "options.blendMode", BlendMode);
		var graphicsStateKey = this.maybeEmbedGraphicsState({
			opacity: options.opacity,
			borderOpacity: options.borderOpacity,
			blendMode: options.blendMode
		});
		if (!("color" in options) && !("borderColor" in options)) options.color = rgb(0, 0, 0);
		var contentStream = this.getContentStream();
		contentStream.push.apply(contentStream, drawEllipse({
			x: (_a = options.x) !== null && _a !== void 0 ? _a : this.x,
			y: (_b = options.y) !== null && _b !== void 0 ? _b : this.y,
			xScale: (_c = options.xScale) !== null && _c !== void 0 ? _c : 100,
			yScale: (_d = options.yScale) !== null && _d !== void 0 ? _d : 100,
			rotate: (_e = options.rotate) !== null && _e !== void 0 ? _e : void 0,
			color: (_f = options.color) !== null && _f !== void 0 ? _f : void 0,
			borderColor: (_g = options.borderColor) !== null && _g !== void 0 ? _g : void 0,
			borderWidth: (_h = options.borderWidth) !== null && _h !== void 0 ? _h : 0,
			borderDashArray: (_j = options.borderDashArray) !== null && _j !== void 0 ? _j : void 0,
			borderDashPhase: (_k = options.borderDashPhase) !== null && _k !== void 0 ? _k : void 0,
			borderLineCap: (_l = options.borderLineCap) !== null && _l !== void 0 ? _l : void 0,
			graphicsState: graphicsStateKey
		}));
	};
	/**
	* Draw a circle on this page. For example:
	* ```js
	* import { grayscale, rgb } from 'pdf-lib'
	*
	* page.drawCircle({
	*   x: 200,
	*   y: 150,
	*   size: 100,
	*   borderWidth: 5,
	*   borderColor: grayscale(0.5),
	*   color: rgb(0.75, 0.2, 0.2),
	*   opacity: 0.5,
	*   borderOpacity: 0.75,
	* })
	* ```
	* @param options The options to be used when drawing the ellipse.
	*/
	PDFPage.prototype.drawCircle = function(options) {
		if (options === void 0) options = {};
		var _a = options.size, size = _a === void 0 ? 100 : _a;
		assertOrUndefined(size, "size", ["number"]);
		this.drawEllipse(__assign(__assign({}, options), {
			xScale: size,
			yScale: size
		}));
	};
	PDFPage.prototype.setOrEmbedFont = function(font) {
		var oldFont = this.font;
		var oldFontKey = this.fontKey;
		if (font) this.setFont(font);
		else this.getFont();
		return {
			oldFont,
			oldFontKey,
			newFont: this.font,
			newFontKey: this.fontKey
		};
	};
	PDFPage.prototype.getFont = function() {
		if (!this.font || !this.fontKey) {
			var font = this.doc.embedStandardFont(StandardFonts.Helvetica);
			this.setFont(font);
		}
		return [this.font, this.fontKey];
	};
	PDFPage.prototype.resetFont = function() {
		this.font = void 0;
		this.fontKey = void 0;
	};
	PDFPage.prototype.getContentStream = function(useExisting) {
		if (useExisting === void 0) useExisting = true;
		if (useExisting && this.contentStream) return this.contentStream;
		this.contentStream = this.createContentStream();
		this.contentStreamRef = this.doc.context.register(this.contentStream);
		this.node.addContentStream(this.contentStreamRef);
		return this.contentStream;
	};
	PDFPage.prototype.createContentStream = function() {
		var operators = [];
		for (var _i = 0; _i < arguments.length; _i++) operators[_i] = arguments[_i];
		var dict = this.doc.context.obj({});
		return PDFContentStream.of(dict, operators);
	};
	PDFPage.prototype.maybeEmbedGraphicsState = function(options) {
		var opacity = options.opacity, borderOpacity = options.borderOpacity, blendMode = options.blendMode;
		if (opacity === void 0 && borderOpacity === void 0 && blendMode === void 0) return;
		var graphicsState = this.doc.context.obj({
			Type: "ExtGState",
			ca: opacity,
			CA: borderOpacity,
			BM: blendMode
		});
		return this.node.newExtGState("GS", graphicsState);
	};
	PDFPage.prototype.scaleAnnot = function(annot, x, y) {
		var selectors = [
			"RD",
			"CL",
			"Vertices",
			"QuadPoints",
			"L",
			"Rect"
		];
		for (var idx = 0, len = selectors.length; idx < len; idx++) {
			var list = annot.lookup(PDFName.of(selectors[idx]));
			if (list instanceof PDFArray) list.scalePDFNumbers(x, y);
		}
		var inkLists = annot.lookup(PDFName.of("InkList"));
		if (inkLists instanceof PDFArray) for (var idx = 0, len = inkLists.size(); idx < len; idx++) {
			var arr = inkLists.lookup(idx);
			if (arr instanceof PDFArray) arr.scalePDFNumbers(x, y);
		}
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFDocument.addPage]] and [[PDFDocument.insertPage]]
	* > methods, which can create instances of [[PDFPage]] for you.
	*
	* Create an instance of [[PDFPage]] from an existing leaf node.
	*
	* @param leafNode The leaf node to be wrapped.
	* @param ref The unique reference for the page.
	* @param doc The document to which the page will belong.
	*/
	PDFPage.of = function(leafNode, ref, doc) {
		return new PDFPage(leafNode, ref, doc);
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFDocument.addPage]] and [[PDFDocument.insertPage]]
	* > methods, which can create instances of [[PDFPage]] for you.
	*
	* Create an instance of [[PDFPage]].
	*
	* @param doc The document to which the page will belong.
	*/
	PDFPage.create = function(doc) {
		assertIs(doc, "doc", [[PDFDocument, "PDFDocument"]]);
		var dummyRef = PDFRef.of(-1);
		var pageLeaf = PDFPageLeaf.withContextAndParent(doc.context, dummyRef);
		return new PDFPage(pageLeaf, doc.context.register(pageLeaf), doc);
	};
	return PDFPage;
}();
//#endregion
//#region ../../node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/form/PDFButton.js
/**
* Represents a button field of a [[PDFForm]].
*
* [[PDFButton]] fields are interactive controls that users can click with their
* mouse. This type of [[PDFField]] is not stateful. The purpose of a button
* is to perform an action when the user clicks on it, such as opening a print
* modal or resetting the form. Buttons are typically rectangular in shape and
* have a text label describing the action that they perform when clicked.
*/
var PDFButton = function(_super) {
	__extends(PDFButton, _super);
	function PDFButton(acroPushButton, ref, doc) {
		var _this = _super.call(this, acroPushButton, ref, doc) || this;
		assertIs(acroPushButton, "acroButton", [[PDFAcroPushButton, "PDFAcroPushButton"]]);
		_this.acroField = acroPushButton;
		return _this;
	}
	/**
	* Display an image inside the bounds of this button's widgets. For example:
	* ```js
	* const pngImage = await pdfDoc.embedPng(...)
	* const button = form.getButton('some.button.field')
	* button.setImage(pngImage, ImageAlignment.Center)
	* ```
	* This will update the appearances streams for each of this button's widgets.
	* @param image The image that should be displayed.
	* @param alignment The alignment of the image.
	*/
	PDFButton.prototype.setImage = function(image, alignment) {
		if (alignment === void 0) alignment = ImageAlignment.Center;
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			var streamRef = this.createImageAppearanceStream(widget, image, alignment);
			this.updateWidgetAppearances(widget, { normal: streamRef });
		}
		this.markAsClean();
	};
	/**
	* Set the font size for this field. Larger font sizes will result in larger
	* text being displayed when PDF readers render this button. Font sizes may
	* be integer or floating point numbers. Supplying a negative font size will
	* cause this method to throw an error.
	*
	* For example:
	* ```js
	* const button = form.getButton('some.button.field')
	* button.setFontSize(4)
	* button.setFontSize(15.7)
	* ```
	*
	* > This method depends upon the existence of a default appearance
	* > (`/DA`) string. If this field does not have a default appearance string,
	* > or that string does not contain a font size (via the `Tf` operator),
	* > then this method will throw an error.
	*
	* @param fontSize The font size to be used when rendering text in this field.
	*/
	PDFButton.prototype.setFontSize = function(fontSize) {
		assertPositive(fontSize, "fontSize");
		this.acroField.setFontSize(fontSize);
		this.markAsDirty();
	};
	/**
	* Show this button on the specified page with the given text. For example:
	* ```js
	* const ubuntuFont = await pdfDoc.embedFont(ubuntuFontBytes)
	* const page = pdfDoc.addPage()
	*
	* const form = pdfDoc.getForm()
	* const button = form.createButton('some.button.field')
	*
	* button.addToPage('Do Stuff', page, {
	*   x: 50,
	*   y: 75,
	*   width: 200,
	*   height: 100,
	*   textColor: rgb(1, 0, 0),
	*   backgroundColor: rgb(0, 1, 0),
	*   borderColor: rgb(0, 0, 1),
	*   borderWidth: 2,
	*   rotate: degrees(90),
	*   font: ubuntuFont,
	* })
	* ```
	* This will create a new widget for this button field.
	* @param text The text to be displayed for this button widget.
	* @param page The page to which this button widget should be added.
	* @param options The options to be used when adding this button widget.
	*/
	PDFButton.prototype.addToPage = function(text, page, options) {
		var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
		assertOrUndefined(text, "text", ["string"]);
		assertOrUndefined(page, "page", [[PDFPage, "PDFPage"]]);
		assertFieldAppearanceOptions(options);
		var widget = this.createWidget({
			x: ((_a = options === null || options === void 0 ? void 0 : options.x) !== null && _a !== void 0 ? _a : 0) - ((_b = options === null || options === void 0 ? void 0 : options.borderWidth) !== null && _b !== void 0 ? _b : 0) / 2,
			y: ((_c = options === null || options === void 0 ? void 0 : options.y) !== null && _c !== void 0 ? _c : 0) - ((_d = options === null || options === void 0 ? void 0 : options.borderWidth) !== null && _d !== void 0 ? _d : 0) / 2,
			width: (_e = options === null || options === void 0 ? void 0 : options.width) !== null && _e !== void 0 ? _e : 100,
			height: (_f = options === null || options === void 0 ? void 0 : options.height) !== null && _f !== void 0 ? _f : 50,
			textColor: (_g = options === null || options === void 0 ? void 0 : options.textColor) !== null && _g !== void 0 ? _g : rgb(0, 0, 0),
			backgroundColor: (_h = options === null || options === void 0 ? void 0 : options.backgroundColor) !== null && _h !== void 0 ? _h : rgb(.75, .75, .75),
			borderColor: options === null || options === void 0 ? void 0 : options.borderColor,
			borderWidth: (_j = options === null || options === void 0 ? void 0 : options.borderWidth) !== null && _j !== void 0 ? _j : 0,
			rotate: (_k = options === null || options === void 0 ? void 0 : options.rotate) !== null && _k !== void 0 ? _k : degrees(0),
			caption: text,
			hidden: options === null || options === void 0 ? void 0 : options.hidden,
			page: page.ref
		});
		var widgetRef = this.doc.context.register(widget.dict);
		this.acroField.addWidget(widgetRef);
		var font = (_l = options === null || options === void 0 ? void 0 : options.font) !== null && _l !== void 0 ? _l : this.doc.getForm().getDefaultFont();
		this.updateWidgetAppearance(widget, font);
		page.node.addAnnot(widgetRef);
	};
	/**
	* Returns `true` if this button has been marked as dirty, or if any of this
	* button's widgets do not have an appearance stream. For example:
	* ```js
	* const button = form.getButton('some.button.field')
	* if (button.needsAppearancesUpdate()) console.log('Needs update')
	* ```
	* @returns Whether or not this button needs an appearance update.
	*/
	PDFButton.prototype.needsAppearancesUpdate = function() {
		var _a;
		if (this.isDirty()) return true;
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) if (!(((_a = widgets[idx].getAppearances()) === null || _a === void 0 ? void 0 : _a.normal) instanceof PDFStream)) return true;
		return false;
	};
	/**
	* Update the appearance streams for each of this button's widgets using
	* the default appearance provider for buttons. For example:
	* ```js
	* const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const button = form.getButton('some.button.field')
	* button.defaultUpdateAppearances(helvetica)
	* ```
	* @param font The font to be used for creating the appearance streams.
	*/
	PDFButton.prototype.defaultUpdateAppearances = function(font) {
		assertIs(font, "font", [[PDFFont, "PDFFont"]]);
		this.updateAppearances(font);
	};
	/**
	* Update the appearance streams for each of this button's widgets using
	* the given appearance provider. If no `provider` is passed, the default
	* appearance provider for buttons will be used. For example:
	* ```js
	* const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
	* const button = form.getButton('some.button.field')
	* button.updateAppearances(helvetica, (field, widget, font) => {
	*   ...
	*   return {
	*     normal: drawButton(...),
	*     down: drawButton(...),
	*   }
	* })
	* ```
	* @param font The font to be used for creating the appearance streams.
	* @param provider Optionally, the appearance provider to be used for
	*                 generating the contents of the appearance streams.
	*/
	PDFButton.prototype.updateAppearances = function(font, provider) {
		assertIs(font, "font", [[PDFFont, "PDFFont"]]);
		assertOrUndefined(provider, "provider", [Function]);
		var widgets = this.acroField.getWidgets();
		for (var idx = 0, len = widgets.length; idx < len; idx++) {
			var widget = widgets[idx];
			this.updateWidgetAppearance(widget, font, provider);
		}
	};
	PDFButton.prototype.updateWidgetAppearance = function(widget, font, provider) {
		var appearances = normalizeAppearance((provider !== null && provider !== void 0 ? provider : defaultButtonAppearanceProvider)(this, widget, font));
		this.updateWidgetAppearanceWithFont(widget, font, appearances);
	};
	/**
	* > **NOTE:** You probably don't want to call this method directly. Instead,
	* > consider using the [[PDFForm.getButton]] method, which will create an
	* > instance of [[PDFButton]] for you.
	*
	* Create an instance of [[PDFButton]] from an existing acroPushButton and ref
	*
	* @param acroPushButton The underlying `PDFAcroPushButton` for this button.
	* @param ref The unique reference for this button.
	* @param doc The document to which this button will belong.
	*/
	PDFButton.of = function(acroPushButton, ref, doc) {
		return new PDFButton(acroPushButton, ref, doc);
	};
	return PDFButton;
}(PDFField);
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+capability-pdf-identity-repair@3.1.2/node_modules/@file-viewer/capability-pdf-identity-repair/dist/index.js
var MAX_PDF_IDENTITY_FONT_NAME_CHARACTERS = 1024;
var PDF_FONT_STYLE_NAMES = /* @__PURE__ */ new Set([
	"bold",
	"regular",
	"italic",
	"oblique",
	"medium",
	"semibold",
	"demibold",
	"light",
	"black",
	"thin"
]);
var isFontNameSeparator = (character) => character === "," || character === "_" || character === "-" || character.trim() === "";
var hasSubsetPrefix = (value) => {
	if (value.length < 7 || value[6] !== "+") return false;
	for (let index = 0; index < 6; index += 1) {
		const codePoint = value.charCodeAt(index) | 32;
		if (codePoint < 97 || codePoint > 122) return false;
	}
	return true;
};
var stripFontStyleSuffix = (value) => {
	let cursor = 0;
	while (cursor < value.length) {
		if (!isFontNameSeparator(value[cursor])) {
			cursor += 1;
			continue;
		}
		const separatorStart = cursor;
		while (cursor < value.length && isFontNameSeparator(value[cursor])) cursor += 1;
		const tokenStart = cursor;
		while (cursor < value.length && !isFontNameSeparator(value[cursor])) cursor += 1;
		const token = value.slice(tokenStart, cursor).toLowerCase();
		const style = token.endsWith("mt") ? token.slice(0, -2) : token;
		if (PDF_FONT_STYLE_NAMES.has(style)) return value.slice(0, separatorStart);
	}
	return value;
};
var normalizePdfIdentityFontFamily = (value) => {
	if (!value || value.length > MAX_PDF_IDENTITY_FONT_NAME_CHARACTERS) return "";
	const withoutStyle = stripFontStyleSuffix(hasSubsetPrefix(value) ? value.slice(7) : value);
	const normalizedCharacters = [];
	for (const character of withoutStyle.normalize("NFKC").toLowerCase()) if (!isFontNameSeparator(character)) normalizedCharacters.push(character);
	return normalizedCharacters.join("");
};
var MAX_REPAIR_SOURCE_BYTES = 67108864;
var MAX_TTF_TABLES = 256;
var MAX_CMAP_GLYPHS = 65535;
var MAX_CMAP_CODEPOINT_VISITS = 65536;
var MAX_DECODED_FONT_BYTES = 67108864;
var CMAP_BFCHAR_CHUNK_SIZE = 100;
var BASE_FONT = PDFName.of("BaseFont");
var CID_TO_GID_MAP = PDFName.of("CIDToGIDMap");
var DESCENDANT_FONTS = PDFName.of("DescendantFonts");
var ENCODING = PDFName.of("Encoding");
var FONT = PDFName.of("Font");
var FONT_DESCRIPTOR = PDFName.of("FontDescriptor");
var FONT_FAMILY = PDFName.of("FontFamily");
var FONT_FILE_2 = PDFName.of("FontFile2");
var LENGTH_1 = PDFName.of("Length1");
var RESOURCES = PDFName.of("Resources");
var SUBTYPE = PDFName.of("Subtype");
var TO_UNICODE = PDFName.of("ToUnicode");
var X_OBJECT = PDFName.of("XObject");
var CJK_FONT_FAMILY_ALIASES = {
	"微软雅黑": "microsoftyahei",
	"宋体": "simsun",
	"黑体": "simhei",
	"楷体": "kaiti",
	"仿宋": "fangsong"
};
var CJK_FONT_FAMILY_MARKERS = [
	"microsoftyahei",
	"simsun",
	"nsimsun",
	"simhei",
	"kaiti",
	"fangsong",
	"pingfang",
	"songti",
	"heiti",
	"hiragino",
	"notosanscjk",
	"sourcehansans",
	"sourcehanserif"
];
var readUint16 = (bytes, offset) => {
	if (offset < 0 || offset + 2 > bytes.length) throw new Error("Unexpected end of TrueType font data.");
	return bytes[offset] << 8 | bytes[offset + 1];
};
var readUint32 = (bytes, offset) => {
	if (offset < 0 || offset + 4 > bytes.length) throw new Error("Unexpected end of TrueType font data.");
	return bytes[offset] * 16777216 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3] >>> 0;
};
var readTag = (bytes, offset) => {
	if (offset < 0 || offset + 4 > bytes.length) return "";
	return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
};
var normalizeFontFamily = (value) => {
	const normalized = normalizePdfIdentityFontFamily(value);
	return CJK_FONT_FAMILY_ALIASES[normalized] || normalized;
};
var isCjkFontFamily = (family) => {
	const key = normalizeFontFamily(family);
	return CJK_FONT_FAMILY_MARKERS.some((marker) => key.includes(marker)) || /[\u3400-\u9fff]/.test(family);
};
var readFontName = (font) => {
	var _a;
	return ((_a = font.lookupMaybe(BASE_FONT, PDFName)) === null || _a === void 0 ? void 0 : _a.decodeText()) || "";
};
var readFontFamily = (descriptor) => {
	var _a;
	if (!descriptor) return "";
	return ((_a = descriptor.lookupMaybe(FONT_FAMILY, PDFString, PDFHexString)) === null || _a === void 0 ? void 0 : _a.decodeText()) || "";
};
var getDescendantFont = (font) => {
	var _a;
	return (_a = font.lookupMaybe(DESCENDANT_FONTS, PDFArray)) === null || _a === void 0 ? void 0 : _a.lookupMaybe(0, PDFDict);
};
var getEmbeddedTrueTypeFont = (descriptor) => {
	var _a;
	if (!descriptor) return;
	const fontFile = descriptor.get(FONT_FILE_2);
	if (!fontFile) return;
	const resolved = descriptor.context.lookup(fontFile);
	if (!(resolved instanceof PDFRawStream)) return;
	const declaredLength = (_a = resolved.dict.lookupMaybe(LENGTH_1, PDFNumber)) === null || _a === void 0 ? void 0 : _a.asNumber();
	if (typeof declaredLength !== "number" || !Number.isSafeInteger(declaredLength) || declaredLength < 1 || declaredLength > MAX_DECODED_FONT_BYTES || resolved.contents.byteLength > MAX_DECODED_FONT_BYTES) return;
	return resolved;
};
var createFontRecord = (font) => {
	var _a;
	const descendant = getDescendantFont(font);
	if (!descendant) return null;
	const encoding = (_a = font.lookupMaybe(ENCODING, PDFName)) === null || _a === void 0 ? void 0 : _a.decodeText();
	if (encoding !== "Identity-H" && encoding !== "Identity-V") return null;
	const descriptor = descendant.lookupMaybe(FONT_DESCRIPTOR, PDFDict);
	const baseFont = readFontName(font);
	const descriptorFamily = readFontFamily(descriptor);
	const cidToGidMapObject = descendant.get(CID_TO_GID_MAP);
	const cidToGidMap = cidToGidMapObject ? descendant.context.lookup(cidToGidMapObject) : void 0;
	return {
		font,
		descendant,
		familyKeys: new Set([baseFont, descriptorFamily].filter(Boolean).map(normalizeFontFamily).filter(Boolean)),
		baseFont,
		identityCidToGidMap: !cidToGidMap || cidToGidMap instanceof PDFName && cidToGidMap.decodeText() === "Identity",
		embeddedFont: getEmbeddedTrueTypeFont(descriptor)
	};
};
var collectFontRecords = (pdfDocument) => {
	const records = /* @__PURE__ */ new Map();
	const visitedResources = /* @__PURE__ */ new Set();
	const visitedXObjects = /* @__PURE__ */ new Set();
	const visitResources = (resources) => {
		var _a;
		if (!resources || visitedResources.has(resources)) return;
		visitedResources.add(resources);
		const fonts = resources.lookupMaybe(FONT, PDFDict);
		for (const fontObject of (fonts === null || fonts === void 0 ? void 0 : fonts.values()) || []) {
			const font = pdfDocument.context.lookup(fontObject);
			if (!(font instanceof PDFDict) || records.has(font)) continue;
			const record = createFontRecord(font);
			if (record) records.set(font, record);
		}
		const xObjects = resources.lookupMaybe(X_OBJECT, PDFDict);
		for (const xObjectRef of (xObjects === null || xObjects === void 0 ? void 0 : xObjects.values()) || []) {
			const xObject = pdfDocument.context.lookup(xObjectRef);
			if (!(xObject instanceof PDFRawStream) || visitedXObjects.has(xObject)) continue;
			visitedXObjects.add(xObject);
			if (((_a = xObject.dict.lookupMaybe(SUBTYPE, PDFName)) === null || _a === void 0 ? void 0 : _a.decodeText()) !== "Form") continue;
			visitResources(xObject.dict.lookupMaybe(RESOURCES, PDFDict));
		}
	};
	for (const page of pdfDocument.getPages()) visitResources(page.node.Resources());
	return [...records.values()];
};
var findCmapTable = (fontBytes) => {
	if (fontBytes.length < 12) throw new Error("Invalid TrueType font header.");
	const tableCount = readUint16(fontBytes, 4);
	if (tableCount < 1 || tableCount > MAX_TTF_TABLES) throw new Error(`Invalid TrueType table count: ${tableCount}.`);
	let cmapOffset = -1;
	for (let index = 0; index < tableCount; index += 1) {
		const entryOffset = 12 + index * 16;
		if (entryOffset + 16 > fontBytes.length) throw new Error("Invalid TrueType table directory.");
		if (readTag(fontBytes, entryOffset) === "cmap") {
			cmapOffset = readUint32(fontBytes, entryOffset + 8);
			break;
		}
	}
	if (cmapOffset < 0 || cmapOffset + 4 > fontBytes.length) throw new Error("TrueType font does not contain a readable cmap table.");
	const cmapCount = readUint16(fontBytes, cmapOffset + 2);
	const tables = [];
	for (let index = 0; index < cmapCount; index += 1) {
		const recordOffset = cmapOffset + 4 + index * 8;
		if (recordOffset + 8 > fontBytes.length) break;
		const offset = cmapOffset + readUint32(fontBytes, recordOffset + 4);
		if (offset + 2 > fontBytes.length) continue;
		const format = readUint16(fontBytes, offset);
		if (format === 4 || format === 12) tables.push({
			offset,
			format,
			platformId: readUint16(fontBytes, recordOffset),
			encodingId: readUint16(fontBytes, recordOffset + 2)
		});
	}
	const score = (table) => (table.format === 12 ? 100 : 0) + (table.platformId === 3 ? 20 : 0) + (table.platformId === 0 ? 10 : 0) + (table.encodingId === 10 ? 4 : 0) + (table.encodingId === 1 ? 2 : 0);
	const selected = tables.sort((left, right) => score(right) - score(left))[0];
	if (!selected) throw new Error("TrueType font does not contain a supported Unicode cmap.");
	return selected;
};
var setGlyphMapping = (map, glyphId, codePoint) => {
	if (glyphId > 0 && glyphId <= MAX_CMAP_GLYPHS && codePoint > 0 && codePoint <= 1114111 && !map.has(glyphId)) map.set(glyphId, codePoint);
};
var parseFormat12Cmap = (fontBytes, table, glyphToUnicode) => {
	const tableLength = readUint32(fontBytes, table.offset + 4);
	const tableEnd = table.offset + tableLength;
	const groupCount = readUint32(fontBytes, table.offset + 12);
	if (tableLength < 16 || tableEnd > fontBytes.length || table.offset + 16 + groupCount * 12 > tableEnd) throw new Error("Invalid TrueType cmap format 12 groups.");
	let visitedCodePoints = 0;
	for (let index = 0; index < groupCount; index += 1) {
		const offset = table.offset + 16 + index * 12;
		const startCodePoint = readUint32(fontBytes, offset);
		const endCodePoint = readUint32(fontBytes, offset + 4);
		const startGlyphId = readUint32(fontBytes, offset + 8);
		const length = Math.min(endCodePoint - startCodePoint + 1, MAX_CMAP_GLYPHS - startGlyphId + 1);
		if (!Number.isSafeInteger(length) || length < 1) continue;
		for (let innerIndex = 0; innerIndex < length; innerIndex += 1) {
			if (visitedCodePoints >= MAX_CMAP_CODEPOINT_VISITS) return;
			visitedCodePoints += 1;
			setGlyphMapping(glyphToUnicode, startGlyphId + innerIndex, startCodePoint + innerIndex);
		}
	}
};
var parseFormat4Cmap = (fontBytes, table, glyphToUnicode) => {
	const tableLength = readUint16(fontBytes, table.offset + 2);
	const tableEnd = table.offset + tableLength;
	const segmentCount = readUint16(fontBytes, table.offset + 6) / 2;
	const endCodesOffset = table.offset + 14;
	const startCodesOffset = endCodesOffset + segmentCount * 2 + 2;
	const deltasOffset = startCodesOffset + segmentCount * 2;
	const rangeOffsetsOffset = deltasOffset + segmentCount * 2;
	if (!Number.isInteger(segmentCount) || segmentCount < 1 || tableLength < 16 || tableEnd > fontBytes.length || rangeOffsetsOffset + segmentCount * 2 > tableEnd) throw new Error("Invalid TrueType cmap format 4 segments.");
	let visitedCodePoints = 0;
	for (let index = 0; index < segmentCount; index += 1) {
		const endCodePoint = readUint16(fontBytes, endCodesOffset + index * 2);
		const startCodePoint = readUint16(fontBytes, startCodesOffset + index * 2);
		const delta = readUint16(fontBytes, deltasOffset + index * 2);
		const rangeOffset = readUint16(fontBytes, rangeOffsetsOffset + index * 2);
		if (endCodePoint < startCodePoint) continue;
		for (let codePoint = startCodePoint; codePoint <= endCodePoint && codePoint !== 65535; codePoint += 1) {
			if (visitedCodePoints >= MAX_CMAP_CODEPOINT_VISITS) return;
			visitedCodePoints += 1;
			let glyphId = 0;
			if (rangeOffset === 0) glyphId = codePoint + delta & 65535;
			else {
				const glyphOffset = rangeOffsetsOffset + index * 2 + rangeOffset + (codePoint - startCodePoint) * 2;
				if (glyphOffset + 2 <= tableEnd) {
					glyphId = readUint16(fontBytes, glyphOffset);
					if (glyphId) glyphId = glyphId + delta & 65535;
				}
			}
			setGlyphMapping(glyphToUnicode, glyphId, codePoint);
		}
	}
};
var parseTrueTypeGlyphToUnicode = (fontBytes) => {
	const selected = findCmapTable(fontBytes);
	const glyphToUnicode = /* @__PURE__ */ new Map();
	if (selected.format === 12) parseFormat12Cmap(fontBytes, selected, glyphToUnicode);
	else parseFormat4Cmap(fontBytes, selected, glyphToUnicode);
	return glyphToUnicode;
};
var toHex = (value, minLength = 4) => value.toString(16).toUpperCase().padStart(minLength, "0");
var encodeUnicodeCodePoint = (codePoint) => {
	if (codePoint <= 65535) return toHex(codePoint);
	const offset = codePoint - 65536;
	const highSurrogate = 55296 + (offset >> 10);
	const lowSurrogate = 56320 + (offset & 1023);
	return `${toHex(highSurrogate)}${toHex(lowSurrogate)}`;
};
var createToUnicodeCmap = (glyphToUnicode) => {
	const entries = [...glyphToUnicode].filter(([glyphId, codePoint]) => glyphId > 0 && glyphId <= 65535 && codePoint > 0 && codePoint <= 1114111).sort(([left], [right]) => left - right);
	const sections = [];
	for (let index = 0; index < entries.length; index += CMAP_BFCHAR_CHUNK_SIZE) {
		const chunk = entries.slice(index, index + CMAP_BFCHAR_CHUNK_SIZE);
		sections.push([
			`${chunk.length} beginbfchar`,
			...chunk.map(([glyphId, codePoint]) => `<${toHex(glyphId)}> <${encodeUnicodeCodePoint(codePoint)}>`),
			"endbfchar"
		].join("\n"));
	}
	return [
		"/CIDInit /ProcSet findresource begin",
		"12 dict begin",
		"begincmap",
		"/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
		"/CMapName /Adobe-Identity-UCS def",
		"/CMapType 2 def",
		"1 begincodespacerange",
		"<0000> <FFFF>",
		"endcodespacerange",
		...sections,
		"endcmap",
		"CMapName currentdict /CMap defineresource pop",
		"end",
		"end"
	].join("\n");
};
var familiesOverlap = (left, right) => {
	for (const key of left) if (right.has(key)) return true;
	return false;
};
var repairMalformedIdentityCjkFonts = async (sourceBytes, candidateFamilies = []) => {
	if (!sourceBytes.byteLength || sourceBytes.byteLength > MAX_REPAIR_SOURCE_BYTES) return {
		bytes: sourceBytes,
		repairedFonts: 0,
		repairedFamilies: []
	};
	const candidateKeys = new Set(candidateFamilies.map(normalizeFontFamily).filter(Boolean));
	const pdfDocument = await PDFDocument.load(sourceBytes, { updateMetadata: false });
	const records = collectFontRecords(pdfDocument);
	const sourceMaps = /* @__PURE__ */ new Map();
	const getSourceMap = (record) => {
		const cached = sourceMaps.get(record);
		if (cached) return cached;
		if (!record.embeddedFont) return;
		const decoded = decodePDFRawStream(record.embeddedFont).decode();
		if (decoded.byteLength > MAX_DECODED_FONT_BYTES) throw new Error("Embedded TrueType font exceeds the Identity repair limit.");
		const glyphMap = parseTrueTypeGlyphToUnicode(decoded);
		sourceMaps.set(record, glyphMap);
		return glyphMap;
	};
	let repairedFonts = 0;
	const repairedFamilies = /* @__PURE__ */ new Set();
	for (const target of records) {
		if (target.font.has(TO_UNICODE) || target.embeddedFont || !target.identityCidToGidMap || ![...target.familyKeys].some((key) => isCjkFontFamily(key)) || candidateKeys.size > 0 && ![...target.familyKeys].some((key) => candidateKeys.has(key))) continue;
		let bestMap;
		for (const source of records) {
			if (!source.embeddedFont || !familiesOverlap(target.familyKeys, source.familyKeys)) continue;
			try {
				const sourceMap = getSourceMap(source);
				if (sourceMap && (!bestMap || sourceMap.size > bestMap.size)) bestMap = sourceMap;
			} catch {}
		}
		if (!bestMap || bestMap.size < 2) continue;
		const cmap = createToUnicodeCmap(bestMap);
		const cmapRef = pdfDocument.context.register(pdfDocument.context.flateStream(cmap));
		target.font.set(TO_UNICODE, cmapRef);
		repairedFonts += 1;
		repairedFamilies.add(target.baseFont || [...target.familyKeys][0] || "CJK font");
	}
	if (!repairedFonts) return {
		bytes: sourceBytes,
		repairedFonts: 0,
		repairedFamilies: []
	};
	return {
		bytes: await pdfDocument.save({ useObjectStreams: true }),
		repairedFonts,
		repairedFamilies: [...repairedFamilies]
	};
};
var enableFileViewerPdfIdentityFontRepair = () => {
	registerFileViewerPdfIdentityFontRepair(repairMalformedIdentityCjkFonts);
};
enableFileViewerPdfIdentityFontRepair();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+capability-pptx-charts@3.1.2/node_modules/@file-viewer/capability-pptx-charts/dist/index.js
var enableFileViewerPptxCharts = () => {
	registerPptxChartLibraryLoader(async () => ({
		billboard: await import("./billboard-BJoSZv5J.js"),
		d3Format: await import("./src-DJuDKioZ.js")
	}));
};
enableFileViewerPptxCharts();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+capability-mermaid@3.1.2/node_modules/@file-viewer/capability-mermaid/dist/index.js
var enableFileViewerMermaid = () => {
	registerFileViewerMermaidLoader(() => import("./mermaid.core-CLZ12Z87.js"));
};
enableFileViewerMermaid();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+capability-midi@3.1.2/node_modules/@file-viewer/capability-midi/dist/index.js
var enableFileViewerMidi = () => {
	registerFileViewerMidiLoader(() => import("./Midi-DylLMU-a.js").then((m) => /* @__PURE__ */ __toESM(m.default)));
};
enableFileViewerMidi();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+capability-rtf@3.1.2/node_modules/@file-viewer/capability-rtf/dist/index.js
var enableFileViewerRtf = () => {
	registerFileViewerRtfLoader(() => import("./RTFJS.bundle-B7bMetgZ.js").then((m) => /* @__PURE__ */ __toESM(m.default)));
};
enableFileViewerRtf();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+capability-streaming-media@3.1.2/node_modules/@file-viewer/capability-streaming-media/dist/index.js
var enableFileViewerStreamingMedia = () => {
	registerFileViewerHlsLoader(() => import("./hls-2PKV0mRV.js"));
};
enableFileViewerStreamingMedia();
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/types.js
var LineType;
(function(LineType) {
	LineType["INSERT"] = "insert";
	LineType["DELETE"] = "delete";
	LineType["CONTEXT"] = "context";
})(LineType || (LineType = {}));
var OutputFormatType = {
	LINE_BY_LINE: "line-by-line",
	SIDE_BY_SIDE: "side-by-side"
};
var LineMatchingType = {
	LINES: "lines",
	WORDS: "words",
	NONE: "none"
};
var DiffStyleType = {
	WORD: "word",
	CHAR: "char"
};
var ColorSchemeType;
(function(ColorSchemeType) {
	ColorSchemeType["AUTO"] = "auto";
	ColorSchemeType["DARK"] = "dark";
	ColorSchemeType["LIGHT"] = "light";
})(ColorSchemeType || (ColorSchemeType = {}));
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/utils.js
var regex = RegExp("[" + [
	"-",
	"[",
	"]",
	"/",
	"{",
	"}",
	"(",
	")",
	"*",
	"+",
	"?",
	".",
	"\\",
	"^",
	"$",
	"|"
].join("\\") + "]", "g");
function escapeForRegExp(str) {
	return str.replace(regex, "\\$&");
}
function unifyPath(path) {
	return path ? path.replace(/\\/g, "/") : path;
}
function hashCode(text) {
	let i, chr, len;
	let hash = 0;
	for (i = 0, len = text.length; i < len; i++) {
		chr = text.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0;
	}
	return hash;
}
function max(arr) {
	const length = arr.length;
	let max = -Infinity;
	for (let i = 0; i < length; i++) max = Math.max(max, arr[i]);
	return max;
}
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/diff-parser.js
function getExtension(filename, language) {
	const filenameParts = filename.split(".");
	return filenameParts.length > 1 ? filenameParts[filenameParts.length - 1] : language;
}
function startsWithAny(str, prefixes) {
	return prefixes.reduce((startsWith, prefix) => startsWith || str.startsWith(prefix), false);
}
var baseDiffFilenamePrefixes = [
	"a/",
	"b/",
	"i/",
	"w/",
	"c/",
	"o/"
];
function getFilename(line, linePrefix, extraPrefix) {
	const prefixes = extraPrefix !== void 0 ? [...baseDiffFilenamePrefixes, extraPrefix] : baseDiffFilenamePrefixes;
	const [, filename = ""] = (linePrefix ? new RegExp(`^${escapeForRegExp(linePrefix)} "?(.+?)"?$`) : /* @__PURE__ */ new RegExp("^\"?(.+?)\"?$")).exec(line) || [];
	const matchingPrefix = prefixes.find((p) => filename.indexOf(p) === 0);
	return (matchingPrefix ? filename.slice(matchingPrefix.length) : filename).replace(/\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)? [+-]\d{4}.*$/, "");
}
function getSrcFilename(line, srcPrefix) {
	return getFilename(line, "---", srcPrefix);
}
function getDstFilename(line, dstPrefix) {
	return getFilename(line, "+++", dstPrefix);
}
function parse(diffInput, config = {}) {
	const files = [];
	let currentFile = null;
	let currentBlock = null;
	let oldLine = null;
	let oldLine2 = null;
	let newLine = null;
	let possibleOldName = null;
	let possibleNewName = null;
	const oldFileNameHeader = "--- ";
	const newFileNameHeader = "+++ ";
	const hunkHeaderPrefix = "@@";
	const oldMode = /^old mode (\d{6})/;
	const newMode = /^new mode (\d{6})/;
	const deletedFileMode = /^deleted file mode (\d{6})/;
	const newFileMode = /^new file mode (\d{6})/;
	const copyFrom = /^copy from "?(.+)"?/;
	const copyTo = /^copy to "?(.+)"?/;
	const renameFrom = /^rename from "?(.+)"?/;
	const renameTo = /^rename to "?(.+)"?/;
	const similarityIndex = /^similarity index (\d+)%/;
	const dissimilarityIndex = /^dissimilarity index (\d+)%/;
	const index = /^index ([\da-z]+)\.\.([\da-z]+)\s*(\d{6})?/;
	const binaryFiles = /^Binary files (.*) and (.*) differ/;
	const binaryDiff = /^GIT binary patch/;
	const combinedIndex = /^index ([\da-z]+),([\da-z]+)\.\.([\da-z]+)/;
	const combinedMode = /^mode (\d{6}),(\d{6})\.\.(\d{6})/;
	const combinedNewFile = /^new file mode (\d{6})/;
	const combinedDeletedFile = /^deleted file mode (\d{6}),(\d{6})/;
	const diffLines = diffInput.replace(/\\ No newline at end of file/g, "").replace(/\r\n?/g, "\n").split("\n");
	function saveBlock() {
		if (currentBlock !== null && currentFile !== null) {
			currentFile.blocks.push(currentBlock);
			currentBlock = null;
		}
	}
	function saveFile() {
		if (currentFile !== null) {
			if (!currentFile.oldName && possibleOldName !== null) currentFile.oldName = possibleOldName;
			if (!currentFile.newName && possibleNewName !== null) currentFile.newName = possibleNewName;
			if (currentFile.newName) {
				files.push(currentFile);
				currentFile = null;
			}
		}
		possibleOldName = null;
		possibleNewName = null;
	}
	function startFile() {
		saveBlock();
		saveFile();
		currentFile = {
			blocks: [],
			deletedLines: 0,
			addedLines: 0
		};
	}
	function startBlock(line) {
		saveBlock();
		let values;
		if (currentFile !== null) if (values = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@.*/.exec(line)) {
			currentFile.isCombined = false;
			oldLine = parseInt(values[1], 10);
			newLine = parseInt(values[2], 10);
		} else if (values = /^@@@ -(\d+)(?:,\d+)? -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@@.*/.exec(line)) {
			currentFile.isCombined = true;
			oldLine = parseInt(values[1], 10);
			oldLine2 = parseInt(values[2], 10);
			newLine = parseInt(values[3], 10);
		} else {
			if (line.startsWith(hunkHeaderPrefix)) console.error("Failed to parse lines, starting in 0!");
			oldLine = 0;
			newLine = 0;
			currentFile.isCombined = false;
		}
		currentBlock = {
			lines: [],
			oldStartLine: oldLine,
			oldStartLine2: oldLine2,
			newStartLine: newLine,
			header: line
		};
	}
	function createLine(line) {
		if (currentFile === null || currentBlock === null || oldLine === null || newLine === null) return;
		const currentLine = { content: line };
		const addedPrefixes = currentFile.isCombined ? [
			"+ ",
			" +",
			"++"
		] : ["+"];
		const deletedPrefixes = currentFile.isCombined ? [
			"- ",
			" -",
			"--"
		] : ["-"];
		if (startsWithAny(line, addedPrefixes)) {
			currentFile.addedLines++;
			currentLine.type = LineType.INSERT;
			currentLine.oldNumber = void 0;
			currentLine.newNumber = newLine++;
		} else if (startsWithAny(line, deletedPrefixes)) {
			currentFile.deletedLines++;
			currentLine.type = LineType.DELETE;
			currentLine.oldNumber = oldLine++;
			currentLine.newNumber = void 0;
		} else {
			currentLine.type = LineType.CONTEXT;
			currentLine.oldNumber = oldLine++;
			currentLine.newNumber = newLine++;
		}
		currentBlock.lines.push(currentLine);
	}
	function existHunkHeader(line, lineIdx) {
		let idx = lineIdx;
		while (idx < diffLines.length - 3) {
			if (line.startsWith("diff")) return false;
			if (diffLines[idx].startsWith(oldFileNameHeader) && diffLines[idx + 1].startsWith(newFileNameHeader) && diffLines[idx + 2].startsWith(hunkHeaderPrefix)) return true;
			idx++;
		}
		return false;
	}
	diffLines.forEach((line, lineIndex) => {
		if (!line || line.startsWith("*")) return;
		let values;
		const prevLine = diffLines[lineIndex - 1];
		const nxtLine = diffLines[lineIndex + 1];
		const afterNxtLine = diffLines[lineIndex + 2];
		if (line.startsWith("diff --git") || line.startsWith("diff --combined")) {
			startFile();
			if (values = /^diff --git "?([a-ciow]\/.+)"? "?([a-ciow]\/.+)"?/.exec(line)) {
				possibleOldName = getFilename(values[1], void 0, config.dstPrefix);
				possibleNewName = getFilename(values[2], void 0, config.srcPrefix);
			}
			if (currentFile === null) throw new Error("Where is my file !!!");
			currentFile.isGitDiff = true;
			return;
		}
		if (line.startsWith("Binary files") && !(currentFile === null || currentFile === void 0 ? void 0 : currentFile.isGitDiff)) {
			startFile();
			if (values = /^Binary files "?([a-ciow]\/.+)"? and "?([a-ciow]\/.+)"? differ/.exec(line)) {
				possibleOldName = getFilename(values[1], void 0, config.dstPrefix);
				possibleNewName = getFilename(values[2], void 0, config.srcPrefix);
			}
			if (currentFile === null) throw new Error("Where is my file !!!");
			currentFile.isBinary = true;
			return;
		}
		if (!currentFile || !currentFile.isGitDiff && currentFile && line.startsWith(oldFileNameHeader) && nxtLine.startsWith(newFileNameHeader) && afterNxtLine.startsWith(hunkHeaderPrefix)) startFile();
		if (currentFile === null || currentFile === void 0 ? void 0 : currentFile.isTooBig) return;
		if (currentFile && (typeof config.diffMaxChanges === "number" && currentFile.addedLines + currentFile.deletedLines > config.diffMaxChanges || typeof config.diffMaxLineLength === "number" && line.length > config.diffMaxLineLength)) {
			currentFile.isTooBig = true;
			currentFile.addedLines = 0;
			currentFile.deletedLines = 0;
			currentFile.blocks = [];
			currentBlock = null;
			startBlock(typeof config.diffTooBigMessage === "function" ? config.diffTooBigMessage(files.length) : "Diff too big to be displayed");
			return;
		}
		if (line.startsWith(oldFileNameHeader) && nxtLine.startsWith(newFileNameHeader) || line.startsWith(newFileNameHeader) && prevLine.startsWith(oldFileNameHeader)) {
			if (currentFile && !currentFile.oldName && line.startsWith("--- ") && (values = getSrcFilename(line, config.srcPrefix))) {
				currentFile.oldName = values;
				currentFile.language = getExtension(currentFile.oldName, currentFile.language);
				return;
			}
			if (currentFile && !currentFile.newName && line.startsWith("+++ ") && (values = getDstFilename(line, config.dstPrefix))) {
				currentFile.newName = values;
				currentFile.language = getExtension(currentFile.newName, currentFile.language);
				return;
			}
		}
		if (currentFile && (line.startsWith(hunkHeaderPrefix) || currentFile.isGitDiff && currentFile.oldName && currentFile.newName && !currentBlock)) {
			startBlock(line);
			return;
		}
		if (currentBlock && (line.startsWith("+") || line.startsWith("-") || line.startsWith(" "))) {
			createLine(line);
			return;
		}
		const doesNotExistHunkHeader = !existHunkHeader(line, lineIndex);
		if (currentFile === null) throw new Error("Where is my file !!!");
		if (values = oldMode.exec(line)) currentFile.oldMode = values[1];
		else if (values = newMode.exec(line)) currentFile.newMode = values[1];
		else if (values = deletedFileMode.exec(line)) {
			currentFile.deletedFileMode = values[1];
			currentFile.isDeleted = true;
		} else if (values = newFileMode.exec(line)) {
			currentFile.newFileMode = values[1];
			currentFile.isNew = true;
		} else if (values = copyFrom.exec(line)) {
			if (doesNotExistHunkHeader) currentFile.oldName = values[1];
			currentFile.isCopy = true;
		} else if (values = copyTo.exec(line)) {
			if (doesNotExistHunkHeader) currentFile.newName = values[1];
			currentFile.isCopy = true;
		} else if (values = renameFrom.exec(line)) {
			if (doesNotExistHunkHeader) currentFile.oldName = values[1];
			currentFile.isRename = true;
		} else if (values = renameTo.exec(line)) {
			if (doesNotExistHunkHeader) currentFile.newName = values[1];
			currentFile.isRename = true;
		} else if (values = binaryFiles.exec(line)) {
			currentFile.isBinary = true;
			currentFile.oldName = getFilename(values[1], void 0, config.srcPrefix);
			currentFile.newName = getFilename(values[2], void 0, config.dstPrefix);
			startBlock("Binary file");
		} else if (binaryDiff.test(line)) {
			currentFile.isBinary = true;
			startBlock(line);
		} else if (values = similarityIndex.exec(line)) currentFile.unchangedPercentage = parseInt(values[1], 10);
		else if (values = dissimilarityIndex.exec(line)) currentFile.changedPercentage = parseInt(values[1], 10);
		else if (values = index.exec(line)) {
			currentFile.checksumBefore = values[1];
			currentFile.checksumAfter = values[2];
			if (values[3]) currentFile.mode = values[3];
		} else if (values = combinedIndex.exec(line)) {
			currentFile.checksumBefore = [values[2], values[3]];
			currentFile.checksumAfter = values[1];
		} else if (values = combinedMode.exec(line)) {
			currentFile.oldMode = [values[2], values[3]];
			currentFile.newMode = values[1];
		} else if (values = combinedNewFile.exec(line)) {
			currentFile.newFileMode = values[1];
			currentFile.isNew = true;
		} else if (values = combinedDeletedFile.exec(line)) {
			currentFile.deletedFileMode = values[1];
			currentFile.isDeleted = true;
		}
	});
	saveBlock();
	saveFile();
	return files;
}
//#endregion
//#region ../../node_modules/.pnpm/diff@8.0.4/node_modules/diff/libesm/diff/base.js
var Diff = class {
	diff(oldStr, newStr, options = {}) {
		let callback;
		if (typeof options === "function") {
			callback = options;
			options = {};
		} else if ("callback" in options) callback = options.callback;
		const oldString = this.castInput(oldStr, options);
		const newString = this.castInput(newStr, options);
		const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
		const newTokens = this.removeEmpty(this.tokenize(newString, options));
		return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
	}
	diffWithOptionsObj(oldTokens, newTokens, options, callback) {
		var _a;
		const done = (value) => {
			value = this.postProcess(value, options);
			if (callback) {
				setTimeout(function() {
					callback(value);
				}, 0);
				return;
			} else return value;
		};
		const newLen = newTokens.length, oldLen = oldTokens.length;
		let editLength = 1;
		let maxEditLength = newLen + oldLen;
		if (options.maxEditLength != null) maxEditLength = Math.min(maxEditLength, options.maxEditLength);
		const maxExecutionTime = (_a = options.timeout) !== null && _a !== void 0 ? _a : Infinity;
		const abortAfterTimestamp = Date.now() + maxExecutionTime;
		const bestPath = [{
			oldPos: -1,
			lastComponent: void 0
		}];
		let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
		if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
		let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
		const execEditLength = () => {
			for (let diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
				let basePath;
				const removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
				if (removePath) bestPath[diagonalPath - 1] = void 0;
				let canAdd = false;
				if (addPath) {
					const addPathNewPos = addPath.oldPos - diagonalPath;
					canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
				}
				const canRemove = removePath && removePath.oldPos + 1 < oldLen;
				if (!canAdd && !canRemove) {
					bestPath[diagonalPath] = void 0;
					continue;
				}
				if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) basePath = this.addToPath(addPath, true, false, 0, options);
				else basePath = this.addToPath(removePath, false, true, 1, options);
				newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
				if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
				else {
					bestPath[diagonalPath] = basePath;
					if (basePath.oldPos + 1 >= oldLen) maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
					if (newPos + 1 >= newLen) minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
				}
			}
			editLength++;
		};
		if (callback) (function exec() {
			setTimeout(function() {
				if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) return callback(void 0);
				if (!execEditLength()) exec();
			}, 0);
		})();
		else while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
			const ret = execEditLength();
			if (ret) return ret;
		}
	}
	addToPath(path, added, removed, oldPosInc, options) {
		const last = path.lastComponent;
		if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) return {
			oldPos: path.oldPos + oldPosInc,
			lastComponent: {
				count: last.count + 1,
				added,
				removed,
				previousComponent: last.previousComponent
			}
		};
		else return {
			oldPos: path.oldPos + oldPosInc,
			lastComponent: {
				count: 1,
				added,
				removed,
				previousComponent: last
			}
		};
	}
	extractCommon(basePath, newTokens, oldTokens, diagonalPath, options) {
		const newLen = newTokens.length, oldLen = oldTokens.length;
		let oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
		while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
			newPos++;
			oldPos++;
			commonCount++;
			if (options.oneChangePerToken) basePath.lastComponent = {
				count: 1,
				previousComponent: basePath.lastComponent,
				added: false,
				removed: false
			};
		}
		if (commonCount && !options.oneChangePerToken) basePath.lastComponent = {
			count: commonCount,
			previousComponent: basePath.lastComponent,
			added: false,
			removed: false
		};
		basePath.oldPos = oldPos;
		return newPos;
	}
	equals(left, right, options) {
		if (options.comparator) return options.comparator(left, right);
		else return left === right || !!options.ignoreCase && left.toLowerCase() === right.toLowerCase();
	}
	removeEmpty(array) {
		const ret = [];
		for (let i = 0; i < array.length; i++) if (array[i]) ret.push(array[i]);
		return ret;
	}
	castInput(value, options) {
		return value;
	}
	tokenize(value, options) {
		return Array.from(value);
	}
	join(chars) {
		return chars.join("");
	}
	postProcess(changeObjects, options) {
		return changeObjects;
	}
	get useLongestToken() {
		return false;
	}
	buildValues(lastComponent, newTokens, oldTokens) {
		const components = [];
		let nextComponent;
		while (lastComponent) {
			components.push(lastComponent);
			nextComponent = lastComponent.previousComponent;
			delete lastComponent.previousComponent;
			lastComponent = nextComponent;
		}
		components.reverse();
		const componentLen = components.length;
		let componentPos = 0, newPos = 0, oldPos = 0;
		for (; componentPos < componentLen; componentPos++) {
			const component = components[componentPos];
			if (!component.removed) {
				if (!component.added && this.useLongestToken) {
					let value = newTokens.slice(newPos, newPos + component.count);
					value = value.map(function(value, i) {
						const oldValue = oldTokens[oldPos + i];
						return oldValue.length > value.length ? oldValue : value;
					});
					component.value = this.join(value);
				} else component.value = this.join(newTokens.slice(newPos, newPos + component.count));
				newPos += component.count;
				if (!component.added) oldPos += component.count;
			} else {
				component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
				oldPos += component.count;
			}
		}
		return components;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/diff@8.0.4/node_modules/diff/libesm/diff/character.js
var CharacterDiff = class extends Diff {};
var characterDiff = new CharacterDiff();
function diffChars(oldStr, newStr, options) {
	return characterDiff.diff(oldStr, newStr, options);
}
//#endregion
//#region ../../node_modules/.pnpm/diff@8.0.4/node_modules/diff/libesm/util/string.js
function longestCommonPrefix(str1, str2) {
	let i;
	for (i = 0; i < str1.length && i < str2.length; i++) if (str1[i] != str2[i]) return str1.slice(0, i);
	return str1.slice(0, i);
}
function longestCommonSuffix(str1, str2) {
	let i;
	if (!str1 || !str2 || str1[str1.length - 1] != str2[str2.length - 1]) return "";
	for (i = 0; i < str1.length && i < str2.length; i++) if (str1[str1.length - (i + 1)] != str2[str2.length - (i + 1)]) return str1.slice(-i);
	return str1.slice(-i);
}
function replacePrefix(string, oldPrefix, newPrefix) {
	if (string.slice(0, oldPrefix.length) != oldPrefix) throw Error(`string ${JSON.stringify(string)} doesn't start with prefix ${JSON.stringify(oldPrefix)}; this is a bug`);
	return newPrefix + string.slice(oldPrefix.length);
}
function replaceSuffix(string, oldSuffix, newSuffix) {
	if (!oldSuffix) return string + newSuffix;
	if (string.slice(-oldSuffix.length) != oldSuffix) throw Error(`string ${JSON.stringify(string)} doesn't end with suffix ${JSON.stringify(oldSuffix)}; this is a bug`);
	return string.slice(0, -oldSuffix.length) + newSuffix;
}
function removePrefix(string, oldPrefix) {
	return replacePrefix(string, oldPrefix, "");
}
function removeSuffix(string, oldSuffix) {
	return replaceSuffix(string, oldSuffix, "");
}
function maximumOverlap(string1, string2) {
	return string2.slice(0, overlapCount(string1, string2));
}
function overlapCount(a, b) {
	let startA = 0;
	if (a.length > b.length) startA = a.length - b.length;
	let endB = b.length;
	if (a.length < b.length) endB = a.length;
	const map = Array(endB);
	let k = 0;
	map[0] = 0;
	for (let j = 1; j < endB; j++) {
		if (b[j] == b[k]) map[j] = map[k];
		else map[j] = k;
		while (k > 0 && b[j] != b[k]) k = map[k];
		if (b[j] == b[k]) k++;
	}
	k = 0;
	for (let i = startA; i < a.length; i++) {
		while (k > 0 && a[i] != b[k]) k = map[k];
		if (a[i] == b[k]) k++;
	}
	return k;
}
/**
* Split a string into segments using a word segmenter, merging consecutive
* segments if they are both whitespace segments. Whitespace segments can
* appear adjacent to one another for two reasons:
* - newlines always get their own segment
* - where a diacritic is attached to a whitespace character in the text, the
*   segment ends after the diacritic, so e.g. " \u0300 " becomes two segments.
* This function therefore runs the segmenter's .segment() method and then
* merges consecutive segments of whitespace into a single part.
*/
function segment(string, segmenter) {
	const parts = [];
	for (const segmentObj of Array.from(segmenter.segment(string))) {
		const segment = segmentObj.segment;
		if (parts.length && /\s/.test(parts[parts.length - 1]) && /\s/.test(segment)) parts[parts.length - 1] += segment;
		else parts.push(segment);
	}
	return parts;
}
function trailingWs(string, segmenter) {
	if (segmenter) return leadingAndTrailingWs(string, segmenter)[1];
	let i;
	for (i = string.length - 1; i >= 0; i--) if (!string[i].match(/\s/)) break;
	return string.substring(i + 1);
}
function leadingWs(string, segmenter) {
	if (segmenter) return leadingAndTrailingWs(string, segmenter)[0];
	const match = string.match(/^\s*/);
	return match ? match[0] : "";
}
function leadingAndTrailingWs(string, segmenter) {
	if (!segmenter) return [leadingWs(string), trailingWs(string)];
	if (segmenter.resolvedOptions().granularity != "word") throw new Error("The segmenter passed must have a granularity of \"word\"");
	const segments = segment(string, segmenter);
	const firstSeg = segments[0];
	const lastSeg = segments[segments.length - 1];
	return [/\s/.test(firstSeg) ? firstSeg : "", /\s/.test(lastSeg) ? lastSeg : ""];
}
//#endregion
//#region ../../node_modules/.pnpm/diff@8.0.4/node_modules/diff/libesm/diff/word.js
var extendedWordChars = "a-zA-Z0-9_\\u{AD}\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}";
var tokenizeIncludingWhitespace = new RegExp(`[${extendedWordChars}]+|\\s+|[^${extendedWordChars}]`, "ug");
var WordDiff = class extends Diff {
	equals(left, right, options) {
		if (options.ignoreCase) {
			left = left.toLowerCase();
			right = right.toLowerCase();
		}
		return left.trim() === right.trim();
	}
	tokenize(value, options = {}) {
		let parts;
		if (options.intlSegmenter) {
			const segmenter = options.intlSegmenter;
			if (segmenter.resolvedOptions().granularity != "word") throw new Error("The segmenter passed must have a granularity of \"word\"");
			parts = segment(value, segmenter);
		} else parts = value.match(tokenizeIncludingWhitespace) || [];
		const tokens = [];
		let prevPart = null;
		parts.forEach((part) => {
			if (/\s/.test(part)) if (prevPart == null) tokens.push(part);
			else tokens.push(tokens.pop() + part);
			else if (prevPart != null && /\s/.test(prevPart)) if (tokens[tokens.length - 1] == prevPart) tokens.push(tokens.pop() + part);
			else tokens.push(prevPart + part);
			else tokens.push(part);
			prevPart = part;
		});
		return tokens;
	}
	join(tokens) {
		return tokens.map((token, i) => {
			if (i == 0) return token;
			else return token.replace(/^\s+/, "");
		}).join("");
	}
	postProcess(changes, options) {
		if (!changes || options.oneChangePerToken) return changes;
		let lastKeep = null;
		let insertion = null;
		let deletion = null;
		changes.forEach((change) => {
			if (change.added) insertion = change;
			else if (change.removed) deletion = change;
			else {
				if (insertion || deletion) dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, change, options.intlSegmenter);
				lastKeep = change;
				insertion = null;
				deletion = null;
			}
		});
		if (insertion || deletion) dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, null, options.intlSegmenter);
		return changes;
	}
};
new WordDiff();
function dedupeWhitespaceInChangeObjects(startKeep, deletion, insertion, endKeep, segmenter) {
	if (deletion && insertion) {
		const [oldWsPrefix, oldWsSuffix] = leadingAndTrailingWs(deletion.value, segmenter);
		const [newWsPrefix, newWsSuffix] = leadingAndTrailingWs(insertion.value, segmenter);
		if (startKeep) {
			const commonWsPrefix = longestCommonPrefix(oldWsPrefix, newWsPrefix);
			startKeep.value = replaceSuffix(startKeep.value, newWsPrefix, commonWsPrefix);
			deletion.value = removePrefix(deletion.value, commonWsPrefix);
			insertion.value = removePrefix(insertion.value, commonWsPrefix);
		}
		if (endKeep) {
			const commonWsSuffix = longestCommonSuffix(oldWsSuffix, newWsSuffix);
			endKeep.value = replacePrefix(endKeep.value, newWsSuffix, commonWsSuffix);
			deletion.value = removeSuffix(deletion.value, commonWsSuffix);
			insertion.value = removeSuffix(insertion.value, commonWsSuffix);
		}
	} else if (insertion) {
		if (startKeep) {
			const ws = leadingWs(insertion.value, segmenter);
			insertion.value = insertion.value.substring(ws.length);
		}
		if (endKeep) {
			const ws = leadingWs(endKeep.value, segmenter);
			endKeep.value = endKeep.value.substring(ws.length);
		}
	} else if (startKeep && endKeep) {
		const newWsFull = leadingWs(endKeep.value, segmenter), [delWsStart, delWsEnd] = leadingAndTrailingWs(deletion.value, segmenter);
		const newWsStart = longestCommonPrefix(newWsFull, delWsStart);
		deletion.value = removePrefix(deletion.value, newWsStart);
		const newWsEnd = longestCommonSuffix(removePrefix(newWsFull, newWsStart), delWsEnd);
		deletion.value = removeSuffix(deletion.value, newWsEnd);
		endKeep.value = replacePrefix(endKeep.value, newWsFull, newWsEnd);
		startKeep.value = replaceSuffix(startKeep.value, newWsFull, newWsFull.slice(0, newWsFull.length - newWsEnd.length));
	} else if (endKeep) {
		const endKeepWsPrefix = leadingWs(endKeep.value, segmenter);
		const overlap = maximumOverlap(trailingWs(deletion.value, segmenter), endKeepWsPrefix);
		deletion.value = removeSuffix(deletion.value, overlap);
	} else if (startKeep) {
		const overlap = maximumOverlap(trailingWs(startKeep.value, segmenter), leadingWs(deletion.value, segmenter));
		deletion.value = removePrefix(deletion.value, overlap);
	}
}
var WordsWithSpaceDiff = class extends Diff {
	tokenize(value) {
		const regex = new RegExp(`(\\r?\\n)|[${extendedWordChars}]+|[^\\S\\n\\r]+|[^${extendedWordChars}]`, "ug");
		return value.match(regex) || [];
	}
};
var wordsWithSpaceDiff = new WordsWithSpaceDiff();
function diffWordsWithSpace(oldStr, newStr, options) {
	return wordsWithSpaceDiff.diff(oldStr, newStr, options);
}
//#endregion
//#region ../../node_modules/.pnpm/diff@8.0.4/node_modules/diff/libesm/diff/line.js
var LineDiff = class extends Diff {
	constructor() {
		super(...arguments);
		this.tokenize = tokenize;
	}
	equals(left, right, options) {
		if (options.ignoreWhitespace) {
			if (!options.newlineIsToken || !left.includes("\n")) left = left.trim();
			if (!options.newlineIsToken || !right.includes("\n")) right = right.trim();
		} else if (options.ignoreNewlineAtEof && !options.newlineIsToken) {
			if (left.endsWith("\n")) left = left.slice(0, -1);
			if (right.endsWith("\n")) right = right.slice(0, -1);
		}
		return super.equals(left, right, options);
	}
};
new LineDiff();
function tokenize(value, options) {
	if (options.stripTrailingCr) value = value.replace(/\r\n/g, "\n");
	const retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
	if (!linesAndNewlines[linesAndNewlines.length - 1]) linesAndNewlines.pop();
	for (let i = 0; i < linesAndNewlines.length; i++) {
		const line = linesAndNewlines[i];
		if (i % 2 && !options.newlineIsToken) retLines[retLines.length - 1] += line;
		else retLines.push(line);
	}
	return retLines;
}
//#endregion
//#region ../../node_modules/.pnpm/diff@8.0.4/node_modules/diff/libesm/diff/sentence.js
function isSentenceEndPunct(char) {
	return char == "." || char == "!" || char == "?";
}
var SentenceDiff = class extends Diff {
	tokenize(value) {
		var _a;
		const result = [];
		let tokenStartI = 0;
		for (let i = 0; i < value.length; i++) {
			if (i == value.length - 1) {
				result.push(value.slice(tokenStartI));
				break;
			}
			if (isSentenceEndPunct(value[i]) && value[i + 1].match(/\s/)) {
				result.push(value.slice(tokenStartI, i + 1));
				i = tokenStartI = i + 1;
				while ((_a = value[i + 1]) === null || _a === void 0 ? void 0 : _a.match(/\s/)) i++;
				result.push(value.slice(tokenStartI, i + 1));
				tokenStartI = i + 1;
			}
		}
		return result;
	}
};
new SentenceDiff();
//#endregion
//#region ../../node_modules/.pnpm/diff@8.0.4/node_modules/diff/libesm/diff/css.js
var CssDiff = class extends Diff {
	tokenize(value) {
		return value.split(/([{}:;,]|\s+)/);
	}
};
new CssDiff();
//#endregion
//#region ../../node_modules/.pnpm/diff@8.0.4/node_modules/diff/libesm/diff/json.js
var JsonDiff = class extends Diff {
	constructor() {
		super(...arguments);
		this.tokenize = tokenize;
	}
	get useLongestToken() {
		return true;
	}
	castInput(value, options) {
		const { undefinedReplacement, stringifyReplacer = (k, v) => typeof v === "undefined" ? undefinedReplacement : v } = options;
		return typeof value === "string" ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), null, "  ");
	}
	equals(left, right, options) {
		return super.equals(left.replace(/,([\r\n])/g, "$1"), right.replace(/,([\r\n])/g, "$1"), options);
	}
};
new JsonDiff();
function canonicalize(obj, stack, replacementStack, replacer, key) {
	stack = stack || [];
	replacementStack = replacementStack || [];
	if (replacer) obj = replacer(key === void 0 ? "" : key, obj);
	let i;
	for (i = 0; i < stack.length; i += 1) if (stack[i] === obj) return replacementStack[i];
	let canonicalizedObj;
	if ("[object Array]" === Object.prototype.toString.call(obj)) {
		stack.push(obj);
		canonicalizedObj = new Array(obj.length);
		replacementStack.push(canonicalizedObj);
		for (i = 0; i < obj.length; i += 1) canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, String(i));
		stack.pop();
		replacementStack.pop();
		return canonicalizedObj;
	}
	if (obj && obj.toJSON) obj = obj.toJSON();
	if (typeof obj === "object" && obj !== null) {
		stack.push(obj);
		canonicalizedObj = {};
		replacementStack.push(canonicalizedObj);
		const sortedKeys = [];
		let key;
		for (key in obj)
 /* istanbul ignore else */
		if (Object.prototype.hasOwnProperty.call(obj, key)) sortedKeys.push(key);
		sortedKeys.sort();
		for (i = 0; i < sortedKeys.length; i += 1) {
			key = sortedKeys[i];
			canonicalizedObj[key] = canonicalize(obj[key], stack, replacementStack, replacer, key);
		}
		stack.pop();
		replacementStack.pop();
	} else canonicalizedObj = obj;
	return canonicalizedObj;
}
//#endregion
//#region ../../node_modules/.pnpm/diff@8.0.4/node_modules/diff/libesm/diff/array.js
var ArrayDiff = class extends Diff {
	tokenize(value) {
		return value.slice();
	}
	join(value) {
		return value;
	}
	removeEmpty(value) {
		return value;
	}
};
new ArrayDiff();
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/rematch.js
function levenshtein(a, b) {
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;
	const matrix = [];
	let i;
	for (i = 0; i <= b.length; i++) matrix[i] = [i];
	let j;
	for (j = 0; j <= a.length; j++) matrix[0][j] = j;
	for (i = 1; i <= b.length; i++) for (j = 1; j <= a.length; j++) if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
	else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
	return matrix[b.length][a.length];
}
function newDistanceFn(str) {
	return (x, y) => {
		const xValue = str(x).trim();
		const yValue = str(y).trim();
		return levenshtein(xValue, yValue) / (xValue.length + yValue.length);
	};
}
function newMatcherFn(distance) {
	function findBestMatch(a, b, cache = /* @__PURE__ */ new Map()) {
		let bestMatchDist = Infinity;
		let bestMatch;
		for (let i = 0; i < a.length; ++i) for (let j = 0; j < b.length; ++j) {
			const cacheKey = JSON.stringify([a[i], b[j]]);
			let md;
			if (!(cache.has(cacheKey) && (md = cache.get(cacheKey)))) {
				md = distance(a[i], b[j]);
				cache.set(cacheKey, md);
			}
			if (md < bestMatchDist) {
				bestMatchDist = md;
				bestMatch = {
					indexA: i,
					indexB: j,
					score: bestMatchDist
				};
			}
		}
		return bestMatch;
	}
	function group(a, b, level = 0, cache = /* @__PURE__ */ new Map()) {
		const bm = findBestMatch(a, b, cache);
		if (!bm || a.length + b.length < 3) return [[a, b]];
		const a1 = a.slice(0, bm.indexA);
		const b1 = b.slice(0, bm.indexB);
		const aMatch = [a[bm.indexA]];
		const bMatch = [b[bm.indexB]];
		const tailA = bm.indexA + 1;
		const tailB = bm.indexB + 1;
		const a2 = a.slice(tailA);
		const b2 = b.slice(tailB);
		const group1 = group(a1, b1, level + 1, cache);
		const groupMatch = group(aMatch, bMatch, level + 1, cache);
		const group2 = group(a2, b2, level + 1, cache);
		let result = groupMatch;
		if (bm.indexA > 0 || bm.indexB > 0) result = group1.concat(result);
		if (a.length > tailA || b.length > tailB) result = result.concat(group2);
		return result;
	}
	return group;
}
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/render-utils.js
var CSSLineClass = {
	INSERTS: "d2h-ins",
	DELETES: "d2h-del",
	CONTEXT: "d2h-cntx",
	INFO: "d2h-info",
	INSERT_CHANGES: "d2h-ins d2h-change",
	DELETE_CHANGES: "d2h-del d2h-change"
};
var defaultRenderConfig = {
	matching: LineMatchingType.NONE,
	matchWordsThreshold: .25,
	maxLineLengthHighlight: 1e4,
	diffStyle: DiffStyleType.WORD,
	colorScheme: ColorSchemeType.LIGHT
};
var separator = "/";
var distance = newDistanceFn((change) => change.value);
var matcher = newMatcherFn(distance);
function isDevNullName(name) {
	return name.indexOf("dev/null") !== -1;
}
function removeInsElements(line) {
	return line.replace(/(<ins[^>]*>((.|\n)*?)<\/ins>)/g, "");
}
function removeDelElements(line) {
	return line.replace(/(<del[^>]*>((.|\n)*?)<\/del>)/g, "");
}
function toCSSClass(lineType) {
	switch (lineType) {
		case LineType.CONTEXT: return CSSLineClass.CONTEXT;
		case LineType.INSERT: return CSSLineClass.INSERTS;
		case LineType.DELETE: return CSSLineClass.DELETES;
	}
}
function colorSchemeToCss(colorScheme) {
	switch (colorScheme) {
		case ColorSchemeType.DARK: return "d2h-dark-color-scheme";
		case ColorSchemeType.AUTO: return "d2h-auto-color-scheme";
		case ColorSchemeType.LIGHT:
		default: return "d2h-light-color-scheme";
	}
}
function prefixLength(isCombined) {
	return isCombined ? 2 : 1;
}
function escapeForHtml(str) {
	return str.slice(0).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
}
function deconstructLine(line, isCombined, escape = true) {
	const indexToSplit = prefixLength(isCombined);
	return {
		prefix: line.substring(0, indexToSplit),
		content: escape ? escapeForHtml(line.substring(indexToSplit)) : line.substring(indexToSplit)
	};
}
function filenameDiff(file) {
	const oldFilename = unifyPath(file.oldName);
	const newFilename = unifyPath(file.newName);
	if (oldFilename !== newFilename && !isDevNullName(oldFilename) && !isDevNullName(newFilename)) {
		const prefixPaths = [];
		const suffixPaths = [];
		const oldFilenameParts = oldFilename.split(separator);
		const newFilenameParts = newFilename.split(separator);
		const oldFilenamePartsSize = oldFilenameParts.length;
		const newFilenamePartsSize = newFilenameParts.length;
		let i = 0;
		let j = oldFilenamePartsSize - 1;
		let k = newFilenamePartsSize - 1;
		while (i < j && i < k) if (oldFilenameParts[i] === newFilenameParts[i]) {
			prefixPaths.push(newFilenameParts[i]);
			i += 1;
		} else break;
		while (j > i && k > i) if (oldFilenameParts[j] === newFilenameParts[k]) {
			suffixPaths.unshift(newFilenameParts[k]);
			j -= 1;
			k -= 1;
		} else break;
		const finalPrefix = prefixPaths.join(separator);
		const finalSuffix = suffixPaths.join(separator);
		const oldRemainingPath = oldFilenameParts.slice(i, j + 1).join(separator);
		const newRemainingPath = newFilenameParts.slice(i, k + 1).join(separator);
		if (finalPrefix.length && finalSuffix.length) return finalPrefix + "/{" + oldRemainingPath + " → " + newRemainingPath + "}/" + finalSuffix;
		else if (finalPrefix.length) return finalPrefix + "/{" + oldRemainingPath + " → " + newRemainingPath + "}";
		else if (finalSuffix.length) return "{" + oldRemainingPath + " → " + newRemainingPath + "}/" + finalSuffix;
		return oldFilename + " → " + newFilename;
	} else if (!isDevNullName(newFilename)) return newFilename;
	else return oldFilename;
}
function getHtmlId(file) {
	return `d2h-${hashCode(filenameDiff(file)).toString().slice(-6)}`;
}
function getFileIcon(file) {
	let templateName = "file-changed";
	if (file.isRename) templateName = "file-renamed";
	else if (file.isCopy) templateName = "file-renamed";
	else if (file.isNew) templateName = "file-added";
	else if (file.isDeleted) templateName = "file-deleted";
	else if (file.newName !== file.oldName) templateName = "file-renamed";
	return templateName;
}
function diffHighlight(diffLine1, diffLine2, isCombined, config = {}) {
	const { matching, maxLineLengthHighlight, matchWordsThreshold, diffStyle } = Object.assign(Object.assign({}, defaultRenderConfig), config);
	const line1 = deconstructLine(diffLine1, isCombined, false);
	const line2 = deconstructLine(diffLine2, isCombined, false);
	if (line1.content.length > maxLineLengthHighlight || line2.content.length > maxLineLengthHighlight) return {
		oldLine: {
			prefix: line1.prefix,
			content: escapeForHtml(line1.content)
		},
		newLine: {
			prefix: line2.prefix,
			content: escapeForHtml(line2.content)
		}
	};
	const diff = diffStyle === "char" ? diffChars(line1.content, line2.content) : diffWordsWithSpace(line1.content, line2.content);
	const changedWords = [];
	if (diffStyle === "word" && matching === "words") {
		const removed = diff.filter((element) => element.removed);
		matcher(diff.filter((element) => element.added), removed).forEach((chunk) => {
			if (chunk[0].length === 1 && chunk[1].length === 1) {
				if (distance(chunk[0][0], chunk[1][0]) < matchWordsThreshold) {
					changedWords.push(chunk[0][0]);
					changedWords.push(chunk[1][0]);
				}
			}
		});
	}
	const highlightedLine = diff.reduce((highlightedLine, part) => {
		const elemType = part.added ? "ins" : part.removed ? "del" : null;
		const addClass = changedWords.indexOf(part) > -1 ? " class=\"d2h-change\"" : "";
		const escapedValue = escapeForHtml(part.value);
		return elemType !== null ? `${highlightedLine}<${elemType}${addClass}>${escapedValue}</${elemType}>` : `${highlightedLine}${escapedValue}`;
	}, "");
	return {
		oldLine: {
			prefix: line1.prefix,
			content: removeInsElements(highlightedLine)
		},
		newLine: {
			prefix: line2.prefix,
			content: removeDelElements(highlightedLine)
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/file-list-renderer.js
var baseTemplatesPath$2 = "file-summary";
var iconsBaseTemplatesPath$2 = "icon";
var defaultFileListRendererConfig = { colorScheme: defaultRenderConfig.colorScheme };
var FileListRenderer = class {
	constructor(hoganUtils, config = {}) {
		this.hoganUtils = hoganUtils;
		this.config = Object.assign(Object.assign({}, defaultFileListRendererConfig), config);
	}
	render(diffFiles) {
		const files = diffFiles.map((file) => this.hoganUtils.render(baseTemplatesPath$2, "line", {
			fileHtmlId: getHtmlId(file),
			oldName: file.oldName,
			newName: file.newName,
			fileName: filenameDiff(file),
			deletedLines: "-" + file.deletedLines,
			addedLines: "+" + file.addedLines
		}, { fileIcon: this.hoganUtils.template(iconsBaseTemplatesPath$2, getFileIcon(file)) })).join("\n");
		return this.hoganUtils.render(baseTemplatesPath$2, "wrapper", {
			colorScheme: colorSchemeToCss(this.config.colorScheme),
			filesNumber: diffFiles.length,
			files
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/line-by-line-renderer.js
var defaultLineByLineRendererConfig = Object.assign(Object.assign({}, defaultRenderConfig), {
	renderNothingWhenEmpty: false,
	matchingMaxComparisons: 2500,
	maxLineSizeInBlockForComparison: 200
});
var genericTemplatesPath$1 = "generic";
var baseTemplatesPath$1 = "line-by-line";
var iconsBaseTemplatesPath$1 = "icon";
var tagsBaseTemplatesPath$1 = "tag";
var LineByLineRenderer = class {
	constructor(hoganUtils, config = {}) {
		this.hoganUtils = hoganUtils;
		this.config = Object.assign(Object.assign({}, defaultLineByLineRendererConfig), config);
	}
	render(diffFiles) {
		const diffsHtml = diffFiles.map((file) => {
			let diffs;
			if (file.blocks.length) diffs = this.generateFileHtml(file);
			else diffs = this.generateEmptyDiff();
			return this.makeFileDiffHtml(file, diffs);
		}).join("\n");
		return this.hoganUtils.render(genericTemplatesPath$1, "wrapper", {
			colorScheme: colorSchemeToCss(this.config.colorScheme),
			content: diffsHtml
		});
	}
	makeFileDiffHtml(file, diffs) {
		if (this.config.renderNothingWhenEmpty && Array.isArray(file.blocks) && file.blocks.length === 0) return "";
		const fileDiffTemplate = this.hoganUtils.template(baseTemplatesPath$1, "file-diff");
		const filePathTemplate = this.hoganUtils.template(genericTemplatesPath$1, "file-path");
		const fileIconTemplate = this.hoganUtils.template(iconsBaseTemplatesPath$1, "file");
		const fileTagTemplate = this.hoganUtils.template(tagsBaseTemplatesPath$1, getFileIcon(file));
		return fileDiffTemplate.render({
			file,
			fileHtmlId: getHtmlId(file),
			diffs,
			filePath: filePathTemplate.render({ fileDiffName: filenameDiff(file) }, {
				fileIcon: fileIconTemplate,
				fileTag: fileTagTemplate
			})
		});
	}
	generateEmptyDiff() {
		return this.hoganUtils.render(genericTemplatesPath$1, "empty-diff", {
			contentClass: "d2h-code-line",
			CSSLineClass
		});
	}
	generateFileHtml(file) {
		const matcher = newMatcherFn(newDistanceFn((e) => deconstructLine(e.content, file.isCombined).content));
		return file.blocks.map((block) => {
			let lines = this.hoganUtils.render(genericTemplatesPath$1, "block-header", {
				CSSLineClass,
				blockHeader: file.isTooBig ? block.header : escapeForHtml(block.header),
				lineClass: "d2h-code-linenumber",
				contentClass: "d2h-code-line"
			});
			this.applyLineGroupping(block).forEach(([contextLines, oldLines, newLines]) => {
				if (oldLines.length && newLines.length && !contextLines.length) this.applyRematchMatching(oldLines, newLines, matcher).map(([oldLines, newLines]) => {
					const { left, right } = this.processChangedLines(file, file.isCombined, oldLines, newLines);
					lines += left;
					lines += right;
				});
				else if (contextLines.length) contextLines.forEach((line) => {
					const { prefix, content } = deconstructLine(line.content, file.isCombined);
					lines += this.generateSingleLineHtml(file, {
						type: CSSLineClass.CONTEXT,
						prefix,
						content,
						oldNumber: line.oldNumber,
						newNumber: line.newNumber
					});
				});
				else if (oldLines.length || newLines.length) {
					const { left, right } = this.processChangedLines(file, file.isCombined, oldLines, newLines);
					lines += left;
					lines += right;
				} else console.error("Unknown state reached while processing groups of lines", contextLines, oldLines, newLines);
			});
			return lines;
		}).join("\n");
	}
	applyLineGroupping(block) {
		const blockLinesGroups = [];
		let oldLines = [];
		let newLines = [];
		for (let i = 0; i < block.lines.length; i++) {
			const diffLine = block.lines[i];
			if (diffLine.type !== LineType.INSERT && newLines.length || diffLine.type === LineType.CONTEXT && oldLines.length > 0) {
				blockLinesGroups.push([
					[],
					oldLines,
					newLines
				]);
				oldLines = [];
				newLines = [];
			}
			if (diffLine.type === LineType.CONTEXT) blockLinesGroups.push([
				[diffLine],
				[],
				[]
			]);
			else if (diffLine.type === LineType.INSERT && oldLines.length === 0) blockLinesGroups.push([
				[],
				[],
				[diffLine]
			]);
			else if (diffLine.type === LineType.INSERT && oldLines.length > 0) newLines.push(diffLine);
			else if (diffLine.type === LineType.DELETE) oldLines.push(diffLine);
		}
		if (oldLines.length || newLines.length) {
			blockLinesGroups.push([
				[],
				oldLines,
				newLines
			]);
			oldLines = [];
			newLines = [];
		}
		return blockLinesGroups;
	}
	applyRematchMatching(oldLines, newLines, matcher) {
		const comparisons = oldLines.length * newLines.length;
		const maxLineSizeInBlock = max(oldLines.concat(newLines).map((elem) => elem.content.length));
		return comparisons < this.config.matchingMaxComparisons && maxLineSizeInBlock < this.config.maxLineSizeInBlockForComparison && (this.config.matching === "lines" || this.config.matching === "words") ? matcher(oldLines, newLines) : [[oldLines, newLines]];
	}
	processChangedLines(file, isCombined, oldLines, newLines) {
		const fileHtml = {
			right: "",
			left: ""
		};
		const maxLinesNumber = Math.max(oldLines.length, newLines.length);
		for (let i = 0; i < maxLinesNumber; i++) {
			const oldLine = oldLines[i];
			const newLine = newLines[i];
			const diff = oldLine !== void 0 && newLine !== void 0 ? diffHighlight(oldLine.content, newLine.content, isCombined, this.config) : void 0;
			const preparedOldLine = oldLine !== void 0 && oldLine.oldNumber !== void 0 ? Object.assign(Object.assign({}, diff !== void 0 ? {
				prefix: diff.oldLine.prefix,
				content: diff.oldLine.content,
				type: CSSLineClass.DELETE_CHANGES
			} : Object.assign(Object.assign({}, deconstructLine(oldLine.content, isCombined)), { type: toCSSClass(oldLine.type) })), {
				oldNumber: oldLine.oldNumber,
				newNumber: oldLine.newNumber
			}) : void 0;
			const preparedNewLine = newLine !== void 0 && newLine.newNumber !== void 0 ? Object.assign(Object.assign({}, diff !== void 0 ? {
				prefix: diff.newLine.prefix,
				content: diff.newLine.content,
				type: CSSLineClass.INSERT_CHANGES
			} : Object.assign(Object.assign({}, deconstructLine(newLine.content, isCombined)), { type: toCSSClass(newLine.type) })), {
				oldNumber: newLine.oldNumber,
				newNumber: newLine.newNumber
			}) : void 0;
			const { left, right } = this.generateLineHtml(file, preparedOldLine, preparedNewLine);
			fileHtml.left += left;
			fileHtml.right += right;
		}
		return fileHtml;
	}
	generateLineHtml(file, oldLine, newLine) {
		return {
			left: this.generateSingleLineHtml(file, oldLine),
			right: this.generateSingleLineHtml(file, newLine)
		};
	}
	generateSingleLineHtml(file, line) {
		if (line === void 0) return "";
		const lineNumberHtml = this.hoganUtils.render(baseTemplatesPath$1, "numbers", {
			oldNumber: line.oldNumber || "",
			newNumber: line.newNumber || ""
		});
		return this.hoganUtils.render(genericTemplatesPath$1, "line", {
			type: line.type,
			lineClass: "d2h-code-linenumber",
			contentClass: "d2h-code-line",
			prefix: line.prefix === " " ? "&nbsp;" : line.prefix,
			content: line.content,
			lineNumber: lineNumberHtml,
			line,
			file
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/side-by-side-renderer.js
var defaultSideBySideRendererConfig = Object.assign(Object.assign({}, defaultRenderConfig), {
	renderNothingWhenEmpty: false,
	matchingMaxComparisons: 2500,
	maxLineSizeInBlockForComparison: 200
});
var genericTemplatesPath = "generic";
var baseTemplatesPath = "side-by-side";
var iconsBaseTemplatesPath = "icon";
var tagsBaseTemplatesPath = "tag";
var SideBySideRenderer = class {
	constructor(hoganUtils, config = {}) {
		this.hoganUtils = hoganUtils;
		this.config = Object.assign(Object.assign({}, defaultSideBySideRendererConfig), config);
	}
	render(diffFiles) {
		const diffsHtml = diffFiles.map((file) => {
			let diffs;
			if (file.blocks.length) diffs = this.generateFileHtml(file);
			else diffs = this.generateEmptyDiff();
			return this.makeFileDiffHtml(file, diffs);
		}).join("\n");
		return this.hoganUtils.render(genericTemplatesPath, "wrapper", {
			colorScheme: colorSchemeToCss(this.config.colorScheme),
			content: diffsHtml
		});
	}
	makeFileDiffHtml(file, diffs) {
		if (this.config.renderNothingWhenEmpty && Array.isArray(file.blocks) && file.blocks.length === 0) return "";
		const fileDiffTemplate = this.hoganUtils.template(baseTemplatesPath, "file-diff");
		const filePathTemplate = this.hoganUtils.template(genericTemplatesPath, "file-path");
		const fileIconTemplate = this.hoganUtils.template(iconsBaseTemplatesPath, "file");
		const fileTagTemplate = this.hoganUtils.template(tagsBaseTemplatesPath, getFileIcon(file));
		return fileDiffTemplate.render({
			file,
			fileHtmlId: getHtmlId(file),
			diffs,
			filePath: filePathTemplate.render({ fileDiffName: filenameDiff(file) }, {
				fileIcon: fileIconTemplate,
				fileTag: fileTagTemplate
			})
		});
	}
	generateEmptyDiff() {
		return {
			right: "",
			left: this.hoganUtils.render(genericTemplatesPath, "empty-diff", {
				contentClass: "d2h-code-side-line",
				CSSLineClass
			})
		};
	}
	generateFileHtml(file) {
		const matcher = newMatcherFn(newDistanceFn((e) => deconstructLine(e.content, file.isCombined).content));
		return file.blocks.map((block) => {
			const fileHtml = {
				left: this.makeHeaderHtml(block.header, file),
				right: this.makeHeaderHtml("")
			};
			this.applyLineGroupping(block).forEach(([contextLines, oldLines, newLines]) => {
				if (oldLines.length && newLines.length && !contextLines.length) this.applyRematchMatching(oldLines, newLines, matcher).map(([oldLines, newLines]) => {
					const { left, right } = this.processChangedLines(file.isCombined, oldLines, newLines);
					fileHtml.left += left;
					fileHtml.right += right;
				});
				else if (contextLines.length) contextLines.forEach((line) => {
					const { prefix, content } = deconstructLine(line.content, file.isCombined);
					const { left, right } = this.generateLineHtml({
						type: CSSLineClass.CONTEXT,
						prefix,
						content,
						number: line.oldNumber
					}, {
						type: CSSLineClass.CONTEXT,
						prefix,
						content,
						number: line.newNumber
					});
					fileHtml.left += left;
					fileHtml.right += right;
				});
				else if (oldLines.length || newLines.length) {
					const { left, right } = this.processChangedLines(file.isCombined, oldLines, newLines);
					fileHtml.left += left;
					fileHtml.right += right;
				} else console.error("Unknown state reached while processing groups of lines", contextLines, oldLines, newLines);
			});
			return fileHtml;
		}).reduce((accomulated, html) => {
			return {
				left: accomulated.left + html.left,
				right: accomulated.right + html.right
			};
		}, {
			left: "",
			right: ""
		});
	}
	applyLineGroupping(block) {
		const blockLinesGroups = [];
		let oldLines = [];
		let newLines = [];
		for (let i = 0; i < block.lines.length; i++) {
			const diffLine = block.lines[i];
			if (diffLine.type !== LineType.INSERT && newLines.length || diffLine.type === LineType.CONTEXT && oldLines.length > 0) {
				blockLinesGroups.push([
					[],
					oldLines,
					newLines
				]);
				oldLines = [];
				newLines = [];
			}
			if (diffLine.type === LineType.CONTEXT) blockLinesGroups.push([
				[diffLine],
				[],
				[]
			]);
			else if (diffLine.type === LineType.INSERT && oldLines.length === 0) blockLinesGroups.push([
				[],
				[],
				[diffLine]
			]);
			else if (diffLine.type === LineType.INSERT && oldLines.length > 0) newLines.push(diffLine);
			else if (diffLine.type === LineType.DELETE) oldLines.push(diffLine);
		}
		if (oldLines.length || newLines.length) {
			blockLinesGroups.push([
				[],
				oldLines,
				newLines
			]);
			oldLines = [];
			newLines = [];
		}
		return blockLinesGroups;
	}
	applyRematchMatching(oldLines, newLines, matcher) {
		const comparisons = oldLines.length * newLines.length;
		const maxLineSizeInBlock = max(oldLines.concat(newLines).map((elem) => elem.content.length));
		return comparisons < this.config.matchingMaxComparisons && maxLineSizeInBlock < this.config.maxLineSizeInBlockForComparison && (this.config.matching === "lines" || this.config.matching === "words") ? matcher(oldLines, newLines) : [[oldLines, newLines]];
	}
	makeHeaderHtml(blockHeader, file) {
		return this.hoganUtils.render(genericTemplatesPath, "block-header", {
			CSSLineClass,
			blockHeader: (file === null || file === void 0 ? void 0 : file.isTooBig) ? blockHeader : escapeForHtml(blockHeader),
			lineClass: "d2h-code-side-linenumber",
			contentClass: "d2h-code-side-line"
		});
	}
	processChangedLines(isCombined, oldLines, newLines) {
		const fileHtml = {
			right: "",
			left: ""
		};
		const maxLinesNumber = Math.max(oldLines.length, newLines.length);
		for (let i = 0; i < maxLinesNumber; i++) {
			const oldLine = oldLines[i];
			const newLine = newLines[i];
			const diff = oldLine !== void 0 && newLine !== void 0 ? diffHighlight(oldLine.content, newLine.content, isCombined, this.config) : void 0;
			const preparedOldLine = oldLine !== void 0 && oldLine.oldNumber !== void 0 ? Object.assign(Object.assign({}, diff !== void 0 ? {
				prefix: diff.oldLine.prefix,
				content: diff.oldLine.content,
				type: CSSLineClass.DELETE_CHANGES
			} : Object.assign(Object.assign({}, deconstructLine(oldLine.content, isCombined)), { type: toCSSClass(oldLine.type) })), { number: oldLine.oldNumber }) : void 0;
			const preparedNewLine = newLine !== void 0 && newLine.newNumber !== void 0 ? Object.assign(Object.assign({}, diff !== void 0 ? {
				prefix: diff.newLine.prefix,
				content: diff.newLine.content,
				type: CSSLineClass.INSERT_CHANGES
			} : Object.assign(Object.assign({}, deconstructLine(newLine.content, isCombined)), { type: toCSSClass(newLine.type) })), { number: newLine.newNumber }) : void 0;
			const { left, right } = this.generateLineHtml(preparedOldLine, preparedNewLine);
			fileHtml.left += left;
			fileHtml.right += right;
		}
		return fileHtml;
	}
	generateLineHtml(oldLine, newLine) {
		return {
			left: this.generateSingleHtml(oldLine),
			right: this.generateSingleHtml(newLine)
		};
	}
	generateSingleHtml(line) {
		const lineClass = "d2h-code-side-linenumber";
		const contentClass = "d2h-code-side-line";
		return this.hoganUtils.render(genericTemplatesPath, "line", {
			type: (line === null || line === void 0 ? void 0 : line.type) || `${CSSLineClass.CONTEXT} d2h-emptyplaceholder`,
			lineClass: line !== void 0 ? lineClass : `${lineClass} d2h-code-side-emptyplaceholder`,
			contentClass: line !== void 0 ? contentClass : `${contentClass} d2h-code-side-emptyplaceholder`,
			prefix: (line === null || line === void 0 ? void 0 : line.prefix) === " " ? "&nbsp;" : line === null || line === void 0 ? void 0 : line.prefix,
			content: line === null || line === void 0 ? void 0 : line.content,
			lineNumber: line === null || line === void 0 ? void 0 : line.number
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@profoundlogic+hogan@3.0.4/node_modules/@profoundlogic/hogan/lib/compiler.js
var require_compiler = /* @__PURE__ */ __commonJSMin(((exports) => {
	(function(Hogan) {
		var rIsWhitespace = /\S/, rQuot = /\"/g, rNewline = /\n/g, rCr = /\r/g, rSlash = /\\/g, rLineSep = /\u2028/, rParagraphSep = /\u2029/;
		Hogan.tags = {
			"#": 1,
			"^": 2,
			"<": 3,
			"$": 4,
			"/": 5,
			"!": 6,
			">": 7,
			"=": 8,
			"_v": 9,
			"{": 10,
			"&": 11,
			"_t": 12
		};
		Hogan.scan = function scan(text, delimiters) {
			var len = text.length, IN_TEXT = 0, IN_TAG_TYPE = 1, IN_TAG = 2, state = IN_TEXT, tagType = null, tag = null, buf = "", tokens = [], seenTag = false, i = 0, lineStart = 0, otag = "{{", ctag = "}}";
			function addBuf() {
				if (buf.length > 0) {
					tokens.push({
						tag: "_t",
						text: new String(buf)
					});
					buf = "";
				}
			}
			function lineIsWhitespace() {
				var isAllWhitespace = true;
				for (var j = lineStart; j < tokens.length; j++) {
					isAllWhitespace = Hogan.tags[tokens[j].tag] < Hogan.tags["_v"] || tokens[j].tag == "_t" && tokens[j].text.match(rIsWhitespace) === null;
					if (!isAllWhitespace) return false;
				}
				return isAllWhitespace;
			}
			function filterLine(haveSeenTag, noNewLine) {
				addBuf();
				if (haveSeenTag && lineIsWhitespace()) {
					for (var j = lineStart, next; j < tokens.length; j++) if (tokens[j].text) {
						if ((next = tokens[j + 1]) && next.tag == ">") next.indent = tokens[j].text.toString();
						tokens.splice(j, 1);
					}
				} else if (!noNewLine) tokens.push({ tag: "\n" });
				seenTag = false;
				lineStart = tokens.length;
			}
			function changeDelimiters(text, index) {
				var close = "=" + ctag, closeIndex = text.indexOf(close, index), delimiters = trim(text.substring(text.indexOf("=", index) + 1, closeIndex)).split(" ");
				otag = delimiters[0];
				ctag = delimiters[delimiters.length - 1];
				return closeIndex + close.length - 1;
			}
			if (delimiters) {
				delimiters = delimiters.split(" ");
				otag = delimiters[0];
				ctag = delimiters[1];
			}
			for (i = 0; i < len; i++) if (state == IN_TEXT) if (tagChange(otag, text, i)) {
				--i;
				addBuf();
				state = IN_TAG_TYPE;
			} else if (text.charAt(i) == "\n") filterLine(seenTag);
			else buf += text.charAt(i);
			else if (state == IN_TAG_TYPE) {
				i += otag.length - 1;
				tag = Hogan.tags[text.charAt(i + 1)];
				tagType = tag ? text.charAt(i + 1) : "_v";
				if (tagType == "=") {
					i = changeDelimiters(text, i);
					state = IN_TEXT;
				} else {
					if (tag) i++;
					state = IN_TAG;
				}
				seenTag = i;
			} else if (tagChange(ctag, text, i)) {
				tokens.push({
					tag: tagType,
					n: trim(buf),
					otag,
					ctag,
					i: tagType == "/" ? seenTag - otag.length : i + ctag.length
				});
				buf = "";
				i += ctag.length - 1;
				state = IN_TEXT;
				if (tagType == "{") if (ctag == "}}") i++;
				else cleanTripleStache(tokens[tokens.length - 1]);
			} else buf += text.charAt(i);
			filterLine(seenTag, true);
			return tokens;
		};
		function cleanTripleStache(token) {
			if (token.n.substr(token.n.length - 1) === "}") token.n = token.n.substring(0, token.n.length - 1);
		}
		function trim(s) {
			if (s.trim) return s.trim();
			return s.replace(/^\s*|\s*$/g, "");
		}
		function tagChange(tag, text, index) {
			if (text.charAt(index) != tag.charAt(0)) return false;
			for (var i = 1, l = tag.length; i < l; i++) if (text.charAt(index + i) != tag.charAt(i)) return false;
			return true;
		}
		var allowedInSuper = {
			"_t": true,
			"\n": true,
			"$": true,
			"/": true
		};
		function buildTree(tokens, kind, stack, customTags) {
			var instructions = [], opener = null, tail = null, token = null;
			tail = stack[stack.length - 1];
			while (tokens.length > 0) {
				token = tokens.shift();
				if (tail && tail.tag == "<" && !(token.tag in allowedInSuper)) throw new Error("Illegal content in < super tag.");
				if (Hogan.tags[token.tag] <= Hogan.tags["$"] || isOpener(token, customTags)) {
					stack.push(token);
					token.nodes = buildTree(tokens, token.tag, stack, customTags);
				} else if (token.tag == "/") {
					if (stack.length === 0) throw new Error("Closing tag without opener: /" + token.n);
					opener = stack.pop();
					if (token.n != opener.n && !isCloser(token.n, opener.n, customTags)) throw new Error("Nesting error: " + opener.n + " vs. " + token.n);
					opener.end = token.i;
					return instructions;
				} else if (token.tag == "\n") token.last = tokens.length == 0 || tokens[0].tag == "\n";
				instructions.push(token);
			}
			if (stack.length > 0) throw new Error("missing closing tag: " + stack.pop().n);
			return instructions;
		}
		function isOpener(token, tags) {
			for (var i = 0, l = tags.length; i < l; i++) if (tags[i].o == token.n) {
				token.tag = "#";
				return true;
			}
		}
		function isCloser(close, open, tags) {
			for (var i = 0, l = tags.length; i < l; i++) if (tags[i].c == close && tags[i].o == open) return true;
		}
		function stringifySubstitutions(obj) {
			var items = [];
			for (var key in obj) items.push("\"" + esc(key) + "\": function(c,p,t,i) {" + obj[key] + "}");
			return "{ " + items.join(",") + " }";
		}
		function stringifyPartials(codeObj) {
			var partials = [];
			for (var key in codeObj.partials) partials.push("\"" + esc(key) + "\":{name:\"" + esc(codeObj.partials[key].name) + "\", " + stringifyPartials(codeObj.partials[key]) + "}");
			return "partials: {" + partials.join(",") + "}, subs: " + stringifySubstitutions(codeObj.subs);
		}
		Hogan.stringify = function(codeObj, text, options) {
			return "{code: function (c,p,i) { " + Hogan.wrapMain(codeObj.code) + " }," + stringifyPartials(codeObj) + "}";
		};
		var serialNo = 0;
		Hogan.generate = function(tree, text, options) {
			serialNo = 0;
			var context = {
				code: "",
				subs: {},
				partials: {}
			};
			Hogan.walk(tree, context);
			if (options.asString) return this.stringify(context, text, options);
			return this.makeTemplate(context, text, options);
		};
		Hogan.wrapMain = function(code) {
			return "var t=this;t.b(i=i||\"\");" + code + "return t.fl();";
		};
		Hogan.template = Hogan.Template;
		Hogan.makeTemplate = function(codeObj, text, options) {
			var template = this.makePartials(codeObj);
			template.code = new Function("c", "p", "i", this.wrapMain(codeObj.code));
			return new this.template(template, text, this, options);
		};
		Hogan.makePartials = function(codeObj) {
			var key, template = {
				subs: {},
				partials: codeObj.partials,
				name: codeObj.name
			};
			for (key in template.partials) template.partials[key] = this.makePartials(template.partials[key]);
			for (key in codeObj.subs) template.subs[key] = new Function("c", "p", "t", "i", codeObj.subs[key]);
			return template;
		};
		function esc(s) {
			return s.replace(rSlash, "\\\\").replace(rQuot, "\\\"").replace(rNewline, "\\n").replace(rCr, "\\r").replace(rLineSep, "\\u2028").replace(rParagraphSep, "\\u2029");
		}
		function chooseMethod(s) {
			return ~s.indexOf(".") ? "d" : "f";
		}
		function createPartial(node, context) {
			var sym = "<" + (context.prefix || "") + node.n + serialNo++;
			context.partials[sym] = {
				name: node.n,
				partials: {}
			};
			context.code += "t.b(t.rp(\"" + esc(sym) + "\",c,p,\"" + (node.indent || "") + "\"));";
			return sym;
		}
		Hogan.codegen = {
			"#": function(node, context) {
				context.code += "if(t.s(t." + chooseMethod(node.n) + "(\"" + esc(node.n) + "\",c,p,1),c,p,0," + node.i + "," + node.end + ",\"" + node.otag + " " + node.ctag + "\")){t.rs(c,p,function(c,p,t){";
				Hogan.walk(node.nodes, context);
				context.code += "});c.pop();}";
			},
			"^": function(node, context) {
				context.code += "if(!t.s(t." + chooseMethod(node.n) + "(\"" + esc(node.n) + "\",c,p,1),c,p,1,0,0,\"\")){";
				Hogan.walk(node.nodes, context);
				context.code += "};";
			},
			">": createPartial,
			"<": function(node, context) {
				var ctx = {
					partials: {},
					code: "",
					subs: {},
					inPartial: true
				};
				Hogan.walk(node.nodes, ctx);
				var template = context.partials[createPartial(node, context)];
				template.subs = ctx.subs;
				template.partials = ctx.partials;
			},
			"$": function(node, context) {
				var ctx = {
					subs: {},
					code: "",
					partials: context.partials,
					prefix: node.n
				};
				Hogan.walk(node.nodes, ctx);
				context.subs[node.n] = ctx.code;
				if (!context.inPartial) context.code += "t.sub(\"" + esc(node.n) + "\",c,p,i);";
			},
			"\n": function(node, context) {
				context.code += write("\"\\n\"" + (node.last ? "" : " + i"));
			},
			"_v": function(node, context) {
				context.code += "t.b(t.v(t." + chooseMethod(node.n) + "(\"" + esc(node.n) + "\",c,p,0)));";
			},
			"_t": function(node, context) {
				context.code += write("\"" + esc(node.text) + "\"");
			},
			"{": tripleStache,
			"&": tripleStache
		};
		function tripleStache(node, context) {
			context.code += "t.b(t.t(t." + chooseMethod(node.n) + "(\"" + esc(node.n) + "\",c,p,0)));";
		}
		function write(s) {
			return "t.b(" + s + ");";
		}
		Hogan.walk = function(nodelist, context) {
			var func;
			for (var i = 0, l = nodelist.length; i < l; i++) {
				func = Hogan.codegen[nodelist[i].tag];
				func && func(nodelist[i], context);
			}
			return context;
		};
		Hogan.parse = function(tokens, text, options) {
			options = options || {};
			return buildTree(tokens, "", [], options.sectionTags || []);
		};
		Hogan.cache = {};
		Hogan.cacheKey = function(text, options) {
			return [
				text,
				!!options.asString,
				!!options.disableLambda,
				options.delimiters,
				!!options.modelGet
			].join("||");
		};
		Hogan.compile = function(text, options) {
			options = options || {};
			var key = Hogan.cacheKey(text, options);
			var template = this.cache[key];
			if (template) {
				var partials = template.partials;
				for (var name in partials) delete partials[name].instance;
				return template;
			}
			template = this.generate(this.parse(this.scan(text, options.delimiters), text, options), text, options);
			return this.cache[key] = template;
		};
	})(typeof exports !== "undefined" ? exports : Hogan);
}));
//#endregion
//#region ../../node_modules/.pnpm/@profoundlogic+hogan@3.0.4/node_modules/@profoundlogic/hogan/lib/template.js
var require_template = /* @__PURE__ */ __commonJSMin(((exports) => {
	(function(Hogan) {
		Hogan.Template = function(codeObj, text, compiler, options) {
			codeObj = codeObj || {};
			this.r = codeObj.code || this.r;
			this.c = compiler;
			this.options = options || {};
			this.text = text || "";
			this.partials = codeObj.partials || {};
			this.subs = codeObj.subs || {};
			this.buf = "";
		};
		Hogan.Template.prototype = {
			r: function(context, partials, indent) {
				return "";
			},
			v: hoganEscape,
			t: coerceToString,
			render: function render(context, partials, indent) {
				return this.ri([context], partials || {}, indent);
			},
			ri: function(context, partials, indent) {
				return this.r(context, partials, indent);
			},
			ep: function(symbol, partials) {
				var partial = this.partials[symbol];
				var template = partials[partial.name];
				if (partial.instance && partial.base == template) return partial.instance;
				if (typeof template == "string") {
					if (!this.c) throw new Error("No compiler available.");
					template = this.c.compile(template, this.options);
				}
				if (!template) return null;
				this.partials[symbol].base = template;
				if (partial.subs) {
					if (!partials.stackText) partials.stackText = {};
					for (key in partial.subs) if (!partials.stackText[key]) partials.stackText[key] = this.activeSub !== void 0 && partials.stackText[this.activeSub] ? partials.stackText[this.activeSub] : this.text;
					template = createSpecializedPartial(template, partial.subs, partial.partials, this.stackSubs, this.stackPartials, partials.stackText);
				}
				this.partials[symbol].instance = template;
				return template;
			},
			rp: function(symbol, context, partials, indent) {
				var partial = this.ep(symbol, partials);
				if (!partial) return "";
				return partial.ri(context, partials, indent);
			},
			rs: function(context, partials, section) {
				var tail = context[context.length - 1];
				if (!isArray(tail)) {
					section(context, partials, this);
					return;
				}
				for (var i = 0; i < tail.length; i++) {
					context.push(tail[i]);
					section(context, partials, this);
					context.pop();
				}
			},
			s: function(val, ctx, partials, inverted, start, end, tags) {
				var pass;
				if (isArray(val) && val.length === 0) return false;
				if (typeof val == "function") val = this.ms(val, ctx, partials, inverted, start, end, tags);
				pass = !!val;
				if (!inverted && pass && ctx) ctx.push(typeof val == "object" ? val : ctx[ctx.length - 1]);
				return pass;
			},
			d: function(key, ctx, partials, returnFound) {
				var found, names = key.split("."), val = this.f(names[0], ctx, partials, returnFound), doModelGet = this.options.modelGet, cx = null;
				if (key === "." && isArray(ctx[ctx.length - 2])) val = ctx[ctx.length - 1];
				else for (var i = 1; i < names.length; i++) {
					found = findInScope(names[i], val, doModelGet);
					if (found !== void 0) {
						cx = val;
						val = found;
					} else val = "";
				}
				if (returnFound && !val) return false;
				if (!returnFound && typeof val == "function") {
					ctx.push(cx);
					val = this.mv(val, ctx, partials);
					ctx.pop();
				}
				return val;
			},
			f: function(key, ctx, partials, returnFound) {
				var val = false, v = null, found = false, doModelGet = this.options.modelGet;
				for (var i = ctx.length - 1; i >= 0; i--) {
					v = ctx[i];
					val = findInScope(key, v, doModelGet);
					if (val !== void 0) {
						found = true;
						break;
					}
				}
				if (!found) return returnFound ? false : "";
				if (!returnFound && typeof val == "function") val = this.mv(val, ctx, partials);
				return val;
			},
			ls: function(func, cx, ctx, partials, text, tags) {
				var oldTags = this.options.delimiters;
				this.options.delimiters = tags;
				this.b(this.ct(coerceToString(func.call(cx, text, ctx)), cx, partials));
				this.options.delimiters = oldTags;
				return false;
			},
			ct: function(text, cx, partials) {
				if (this.options.disableLambda) throw new Error("Lambda features disabled.");
				return this.c.compile(text, this.options).render(cx, partials);
			},
			b: function(s) {
				this.buf += s;
			},
			fl: function() {
				var r = this.buf;
				this.buf = "";
				return r;
			},
			ms: function(func, ctx, partials, inverted, start, end, tags) {
				var textSource, cx = ctx[ctx.length - 1], result = func.call(cx);
				if (typeof result == "function") if (inverted) return true;
				else {
					textSource = this.activeSub && this.subsText && this.subsText[this.activeSub] ? this.subsText[this.activeSub] : this.text;
					return this.ls(result, cx, ctx, partials, textSource.substring(start, end), tags);
				}
				return result;
			},
			mv: function(func, ctx, partials) {
				var cx = ctx[ctx.length - 1];
				var result = func.call(cx);
				if (typeof result == "function") return this.ct(coerceToString(result.call(cx)), cx, partials);
				return result;
			},
			sub: function(name, context, partials, indent) {
				var f = this.subs[name];
				if (f) {
					this.activeSub = name;
					f(context, partials, this, indent);
					this.activeSub = false;
				}
			}
		};
		function findInScope(key, scope, doModelGet) {
			var val;
			if (scope && typeof scope == "object") {
				if (scope[key] !== void 0) val = scope[key];
				else if (doModelGet && scope.get && typeof scope.get == "function") val = scope.get(key);
			}
			return val;
		}
		function createSpecializedPartial(instance, subs, partials, stackSubs, stackPartials, stackText) {
			function PartialTemplate() {}
			PartialTemplate.prototype = instance;
			function Substitutions() {}
			Substitutions.prototype = instance.subs;
			var key;
			var partial = new PartialTemplate();
			partial.subs = new Substitutions();
			partial.subsText = {};
			partial.buf = "";
			stackSubs = stackSubs || {};
			partial.stackSubs = stackSubs;
			partial.subsText = stackText;
			for (key in subs) if (!stackSubs[key]) stackSubs[key] = subs[key];
			for (key in stackSubs) partial.subs[key] = stackSubs[key];
			stackPartials = stackPartials || {};
			partial.stackPartials = stackPartials;
			for (key in partials) if (!stackPartials[key]) stackPartials[key] = partials[key];
			for (key in stackPartials) partial.partials[key] = stackPartials[key];
			return partial;
		}
		var rAmp = /&/g, rLt = /</g, rGt = />/g, rApos = /\'/g, rQuot = /\"/g, hChars = /[&<>\"\']/;
		function coerceToString(val) {
			return String(val === null || val === void 0 ? "" : val);
		}
		function hoganEscape(str) {
			str = coerceToString(str);
			return hChars.test(str) ? str.replace(rAmp, "&amp;").replace(rLt, "&lt;").replace(rGt, "&gt;").replace(rApos, "&#39;").replace(rQuot, "&quot;") : str;
		}
		var isArray = Array.isArray || function(a) {
			return Object.prototype.toString.call(a) === "[object Array]";
		};
	})(typeof exports !== "undefined" ? exports : {});
}));
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/diff2html-templates.js
var import_hogan = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Hogan = require_compiler();
	Hogan.Template = require_template().Template;
	Hogan.template = Hogan.Template;
	module.exports = Hogan;
})))());
var defaultTemplates = {};
defaultTemplates["file-summary-line"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<li class=\"d2h-file-list-line\">");
		t.b("\n" + i);
		t.b("    <span class=\"d2h-file-name-wrapper\">");
		t.b("\n" + i);
		t.b(t.rp("<fileIcon0", c, p, "      "));
		t.b("      <a href=\"#");
		t.b(t.v(t.f("fileHtmlId", c, p, 0)));
		t.b("\" class=\"d2h-file-name\">");
		t.b(t.v(t.f("fileName", c, p, 0)));
		t.b("</a>");
		t.b("\n" + i);
		t.b("      <span class=\"d2h-file-stats\">");
		t.b("\n" + i);
		t.b("          <span class=\"d2h-lines-added\">");
		t.b(t.v(t.f("addedLines", c, p, 0)));
		t.b("</span>");
		t.b("\n" + i);
		t.b("          <span class=\"d2h-lines-deleted\">");
		t.b(t.v(t.f("deletedLines", c, p, 0)));
		t.b("</span>");
		t.b("\n" + i);
		t.b("      </span>");
		t.b("\n" + i);
		t.b("    </span>");
		t.b("\n" + i);
		t.b("</li>");
		return t.fl();
	},
	partials: { "<fileIcon0": {
		name: "fileIcon",
		partials: {},
		subs: {}
	} },
	subs: {}
});
defaultTemplates["file-summary-wrapper"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<div class=\"d2h-file-list-wrapper ");
		t.b(t.v(t.f("colorScheme", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		t.b("    <div class=\"d2h-file-list-header\">");
		t.b("\n" + i);
		t.b("        <span class=\"d2h-file-list-title\">Files changed (");
		t.b(t.v(t.f("filesNumber", c, p, 0)));
		t.b(")</span>");
		t.b("\n" + i);
		t.b("        <a class=\"d2h-file-switch d2h-hide\">hide</a>");
		t.b("\n" + i);
		t.b("        <a class=\"d2h-file-switch d2h-show\">show</a>");
		t.b("\n" + i);
		t.b("    </div>");
		t.b("\n" + i);
		t.b("    <ol class=\"d2h-file-list\">");
		t.b("\n" + i);
		t.b("    ");
		t.b(t.t(t.f("files", c, p, 0)));
		t.b("\n" + i);
		t.b("    </ol>");
		t.b("\n" + i);
		t.b("</div>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["generic-block-header"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<tr>");
		t.b("\n" + i);
		t.b("    <td class=\"");
		t.b(t.v(t.f("lineClass", c, p, 0)));
		t.b(" ");
		t.b(t.v(t.d("CSSLineClass.INFO", c, p, 0)));
		t.b("\"></td>");
		t.b("\n" + i);
		t.b("    <td class=\"");
		t.b(t.v(t.d("CSSLineClass.INFO", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		t.b("        <div class=\"");
		t.b(t.v(t.f("contentClass", c, p, 0)));
		t.b("\">");
		if (t.s(t.f("blockHeader", c, p, 1), c, p, 0, 156, 173, "{{ }}")) {
			t.rs(c, p, function(c, p, t) {
				t.b(t.t(t.f("blockHeader", c, p, 0)));
			});
			c.pop();
		}
		if (!t.s(t.f("blockHeader", c, p, 1), c, p, 1, 0, 0, "")) t.b("&nbsp;");
		t.b("</div>");
		t.b("\n" + i);
		t.b("    </td>");
		t.b("\n" + i);
		t.b("</tr>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["generic-empty-diff"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<tr>");
		t.b("\n" + i);
		t.b("    <td class=\"");
		t.b(t.v(t.d("CSSLineClass.INFO", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		t.b("        <div class=\"");
		t.b(t.v(t.f("contentClass", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		t.b("            File without changes");
		t.b("\n" + i);
		t.b("        </div>");
		t.b("\n" + i);
		t.b("    </td>");
		t.b("\n" + i);
		t.b("</tr>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["generic-file-path"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<span class=\"d2h-file-name-wrapper\">");
		t.b("\n" + i);
		t.b(t.rp("<fileIcon0", c, p, "    "));
		t.b("    <span class=\"d2h-file-name\">");
		t.b(t.v(t.f("fileDiffName", c, p, 0)));
		t.b("</span>");
		t.b("\n" + i);
		t.b(t.rp("<fileTag1", c, p, "    "));
		t.b("</span>");
		t.b("\n" + i);
		t.b("<label class=\"d2h-file-collapse\">");
		t.b("\n" + i);
		t.b("    <input class=\"d2h-file-collapse-input\" type=\"checkbox\" name=\"viewed\" value=\"viewed\">");
		t.b("\n" + i);
		t.b("    Viewed");
		t.b("\n" + i);
		t.b("</label>");
		return t.fl();
	},
	partials: {
		"<fileIcon0": {
			name: "fileIcon",
			partials: {},
			subs: {}
		},
		"<fileTag1": {
			name: "fileTag",
			partials: {},
			subs: {}
		}
	},
	subs: {}
});
defaultTemplates["generic-line"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<tr>");
		t.b("\n" + i);
		t.b("    <td class=\"");
		t.b(t.v(t.f("lineClass", c, p, 0)));
		t.b(" ");
		t.b(t.v(t.f("type", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		t.b("      ");
		t.b(t.t(t.f("lineNumber", c, p, 0)));
		t.b("\n" + i);
		t.b("    </td>");
		t.b("\n" + i);
		t.b("    <td class=\"");
		t.b(t.v(t.f("type", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		t.b("        <div class=\"");
		t.b(t.v(t.f("contentClass", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		if (t.s(t.f("prefix", c, p, 1), c, p, 0, 162, 238, "{{ }}")) {
			t.rs(c, p, function(c, p, t) {
				t.b("            <span class=\"d2h-code-line-prefix\">");
				t.b(t.t(t.f("prefix", c, p, 0)));
				t.b("</span>");
				t.b("\n" + i);
			});
			c.pop();
		}
		if (!t.s(t.f("prefix", c, p, 1), c, p, 1, 0, 0, "")) {
			t.b("            <span class=\"d2h-code-line-prefix\">&nbsp;</span>");
			t.b("\n" + i);
		}
		if (t.s(t.f("content", c, p, 1), c, p, 0, 371, 445, "{{ }}")) {
			t.rs(c, p, function(c, p, t) {
				t.b("            <span class=\"d2h-code-line-ctn\">");
				t.b(t.t(t.f("content", c, p, 0)));
				t.b("</span>");
				t.b("\n" + i);
			});
			c.pop();
		}
		if (!t.s(t.f("content", c, p, 1), c, p, 1, 0, 0, "")) {
			t.b("            <span class=\"d2h-code-line-ctn\"><br></span>");
			t.b("\n" + i);
		}
		t.b("        </div>");
		t.b("\n" + i);
		t.b("    </td>");
		t.b("\n" + i);
		t.b("</tr>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["generic-wrapper"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<div class=\"d2h-wrapper ");
		t.b(t.v(t.f("colorScheme", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		t.b("    ");
		t.b(t.t(t.f("content", c, p, 0)));
		t.b("\n" + i);
		t.b("</div>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["icon-file-added"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<svg aria-hidden=\"true\" class=\"d2h-icon d2h-added\" height=\"16\" title=\"added\" version=\"1.1\" viewBox=\"0 0 14 16\"");
		t.b("\n" + i);
		t.b("     width=\"14\">");
		t.b("\n" + i);
		t.b("    <path d=\"M13 1H1C0.45 1 0 1.45 0 2v12c0 0.55 0.45 1 1 1h12c0.55 0 1-0.45 1-1V2c0-0.55-0.45-1-1-1z m0 13H1V2h12v12zM6 9H3V7h3V4h2v3h3v2H8v3H6V9z\"></path>");
		t.b("\n" + i);
		t.b("</svg>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["icon-file-changed"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<svg aria-hidden=\"true\" class=\"d2h-icon d2h-changed\" height=\"16\" title=\"modified\" version=\"1.1\"");
		t.b("\n" + i);
		t.b("     viewBox=\"0 0 14 16\" width=\"14\">");
		t.b("\n" + i);
		t.b("    <path d=\"M13 1H1C0.45 1 0 1.45 0 2v12c0 0.55 0.45 1 1 1h12c0.55 0 1-0.45 1-1V2c0-0.55-0.45-1-1-1z m0 13H1V2h12v12zM4 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z\"></path>");
		t.b("\n" + i);
		t.b("</svg>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["icon-file-deleted"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<svg aria-hidden=\"true\" class=\"d2h-icon d2h-deleted\" height=\"16\" title=\"removed\" version=\"1.1\"");
		t.b("\n" + i);
		t.b("     viewBox=\"0 0 14 16\" width=\"14\">");
		t.b("\n" + i);
		t.b("    <path d=\"M13 1H1C0.45 1 0 1.45 0 2v12c0 0.55 0.45 1 1 1h12c0.55 0 1-0.45 1-1V2c0-0.55-0.45-1-1-1z m0 13H1V2h12v12zM11 9H3V7h8v2z\"></path>");
		t.b("\n" + i);
		t.b("</svg>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["icon-file-renamed"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<svg aria-hidden=\"true\" class=\"d2h-icon d2h-moved\" height=\"16\" title=\"renamed\" version=\"1.1\"");
		t.b("\n" + i);
		t.b("     viewBox=\"0 0 14 16\" width=\"14\">");
		t.b("\n" + i);
		t.b("    <path d=\"M6 9H3V7h3V4l5 4-5 4V9z m8-7v12c0 0.55-0.45 1-1 1H1c-0.55 0-1-0.45-1-1V2c0-0.55 0.45-1 1-1h12c0.55 0 1 0.45 1 1z m-1 0H1v12h12V2z\"></path>");
		t.b("\n" + i);
		t.b("</svg>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["icon-file"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<svg aria-hidden=\"true\" class=\"d2h-icon\" height=\"16\" version=\"1.1\" viewBox=\"0 0 12 16\" width=\"12\">");
		t.b("\n" + i);
		t.b("    <path d=\"M6 5H2v-1h4v1zM2 8h7v-1H2v1z m0 2h7v-1H2v1z m0 2h7v-1H2v1z m10-7.5v9.5c0 0.55-0.45 1-1 1H1c-0.55 0-1-0.45-1-1V2c0-0.55 0.45-1 1-1h7.5l3.5 3.5z m-1 0.5L8 2H1v12h10V5z\"></path>");
		t.b("\n" + i);
		t.b("</svg>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["line-by-line-file-diff"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<div id=\"");
		t.b(t.v(t.f("fileHtmlId", c, p, 0)));
		t.b("\" class=\"d2h-file-wrapper\" data-lang=\"");
		t.b(t.v(t.d("file.language", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		t.b("    <div class=\"d2h-file-header\">");
		t.b("\n" + i);
		t.b("    ");
		t.b(t.t(t.f("filePath", c, p, 0)));
		t.b("\n" + i);
		t.b("    </div>");
		t.b("\n" + i);
		t.b("    <div class=\"d2h-file-diff\">");
		t.b("\n" + i);
		t.b("        <div class=\"d2h-code-wrapper\">");
		t.b("\n" + i);
		t.b("            <table class=\"d2h-diff-table\">");
		t.b("\n" + i);
		t.b("                <tbody class=\"d2h-diff-tbody\">");
		t.b("\n" + i);
		t.b("                ");
		t.b(t.t(t.f("diffs", c, p, 0)));
		t.b("\n" + i);
		t.b("                </tbody>");
		t.b("\n" + i);
		t.b("            </table>");
		t.b("\n" + i);
		t.b("        </div>");
		t.b("\n" + i);
		t.b("    </div>");
		t.b("\n" + i);
		t.b("</div>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["line-by-line-numbers"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<div class=\"line-num1\">");
		t.b(t.v(t.f("oldNumber", c, p, 0)));
		t.b("</div>");
		t.b("\n" + i);
		t.b("<div class=\"line-num2\">");
		t.b(t.v(t.f("newNumber", c, p, 0)));
		t.b("</div>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["side-by-side-file-diff"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<div id=\"");
		t.b(t.v(t.f("fileHtmlId", c, p, 0)));
		t.b("\" class=\"d2h-file-wrapper\" data-lang=\"");
		t.b(t.v(t.d("file.language", c, p, 0)));
		t.b("\">");
		t.b("\n" + i);
		t.b("    <div class=\"d2h-file-header\">");
		t.b("\n" + i);
		t.b("      ");
		t.b(t.t(t.f("filePath", c, p, 0)));
		t.b("\n" + i);
		t.b("    </div>");
		t.b("\n" + i);
		t.b("    <div class=\"d2h-files-diff\">");
		t.b("\n" + i);
		t.b("        <div class=\"d2h-file-side-diff\">");
		t.b("\n" + i);
		t.b("            <div class=\"d2h-code-wrapper\">");
		t.b("\n" + i);
		t.b("                <table class=\"d2h-diff-table\">");
		t.b("\n" + i);
		t.b("                    <tbody class=\"d2h-diff-tbody\">");
		t.b("\n" + i);
		t.b("                    ");
		t.b(t.t(t.d("diffs.left", c, p, 0)));
		t.b("\n" + i);
		t.b("                    </tbody>");
		t.b("\n" + i);
		t.b("                </table>");
		t.b("\n" + i);
		t.b("            </div>");
		t.b("\n" + i);
		t.b("        </div>");
		t.b("\n" + i);
		t.b("        <div class=\"d2h-file-side-diff\">");
		t.b("\n" + i);
		t.b("            <div class=\"d2h-code-wrapper\">");
		t.b("\n" + i);
		t.b("                <table class=\"d2h-diff-table\">");
		t.b("\n" + i);
		t.b("                    <tbody class=\"d2h-diff-tbody\">");
		t.b("\n" + i);
		t.b("                    ");
		t.b(t.t(t.d("diffs.right", c, p, 0)));
		t.b("\n" + i);
		t.b("                    </tbody>");
		t.b("\n" + i);
		t.b("                </table>");
		t.b("\n" + i);
		t.b("            </div>");
		t.b("\n" + i);
		t.b("        </div>");
		t.b("\n" + i);
		t.b("    </div>");
		t.b("\n" + i);
		t.b("</div>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["tag-file-added"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<span class=\"d2h-tag d2h-added d2h-added-tag\">ADDED</span>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["tag-file-changed"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<span class=\"d2h-tag d2h-changed d2h-changed-tag\">CHANGED</span>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["tag-file-deleted"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<span class=\"d2h-tag d2h-deleted d2h-deleted-tag\">DELETED</span>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
defaultTemplates["tag-file-renamed"] = new import_hogan.Template({
	code: function(c, p, i) {
		var t = this;
		t.b(i = i || "");
		t.b("<span class=\"d2h-tag d2h-moved d2h-moved-tag\">RENAMED</span>");
		return t.fl();
	},
	partials: {},
	subs: {}
});
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/hoganjs-utils.js
var HoganJsUtils = class {
	constructor({ compiledTemplates = {}, rawTemplates = {} }) {
		const compiledRawTemplates = Object.entries(rawTemplates).reduce((previousTemplates, [name, templateString]) => {
			const compiledTemplate = import_hogan.compile(templateString, { asString: false });
			return Object.assign(Object.assign({}, previousTemplates), { [name]: compiledTemplate });
		}, {});
		this.preCompiledTemplates = Object.assign(Object.assign(Object.assign({}, defaultTemplates), compiledTemplates), compiledRawTemplates);
	}
	static compile(templateString) {
		return import_hogan.compile(templateString, { asString: false });
	}
	render(namespace, view, params, partials, indent) {
		const templateKey = this.templateKey(namespace, view);
		try {
			return this.preCompiledTemplates[templateKey].render(params, partials, indent);
		} catch (_e) {
			throw new Error(`Could not find template to render '${templateKey}'`);
		}
	}
	template(namespace, view) {
		return this.preCompiledTemplates[this.templateKey(namespace, view)];
	}
	templateKey(namespace, view) {
		return `${namespace}-${view}`;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/diff2html@3.4.56/node_modules/diff2html/lib-esm/diff2html.js
var defaultDiff2HtmlConfig = Object.assign(Object.assign(Object.assign({}, defaultLineByLineRendererConfig), defaultSideBySideRendererConfig), {
	outputFormat: OutputFormatType.LINE_BY_LINE,
	drawFileList: true
});
function html(diffInput, configuration = {}) {
	const config = Object.assign(Object.assign({}, defaultDiff2HtmlConfig), configuration);
	const diffJson = typeof diffInput === "string" ? parse(diffInput, config) : diffInput;
	const hoganUtils = new HoganJsUtils(config);
	const { colorScheme } = config;
	const fileListRendererConfig = { colorScheme };
	return (config.drawFileList ? new FileListRenderer(hoganUtils, fileListRendererConfig).render(diffJson) : "") + (config.outputFormat === "side-by-side" ? new SideBySideRenderer(hoganUtils, config).render(diffJson) : new LineByLineRenderer(hoganUtils, config).render(diffJson));
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+capability-text-tools@3.1.2/node_modules/@file-viewer/capability-text-tools/dist/index.js
var enableFileViewerTextTools = () => {
	registerFileViewerDiffToHtml(html);
	registerFileViewerPakoLoader(() => import("./pako.esm-BTz7i8kY.js"));
};
enableFileViewerTextTools();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+capability-drawio-official@3.1.2_bpmn-js@18.31.0/node_modules/@file-viewer/capability-drawio-official/dist/index.js
enableFileViewerDrawioOfficialViewer();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+preset-all@3.1.2_bpmn-js@18.31.0_esbuild@0.28.1_geotiff@2.1.3_pdf-lib@1.17.1_three@0.185.1_web-ifc@0.0.78/node_modules/@file-viewer/preset-all/dist/fullAssets.js
var DEFAULT_FULL_ASSET_BASE_PATH = "file-viewer/";
var DEFAULT_FULL_ASSET_BASE_URL = "/file-viewer/";
var automaticAssetBaseUrl = Symbol("automatic-file-viewer-full-asset-base");
var configuredFullAssetBaseUrl = automaticAssetBaseUrl;
function normalizeFullAssetBaseUrl(baseUrl) {
	if (!baseUrl) return;
	const value = String(baseUrl).trim();
	if (!value) return;
	return value.endsWith("/") ? value : `${value}/`;
}
/**
* Resolves `file-viewer/` against the emitted application entry instead of the
* current SPA route. This keeps Vite/Webpack root and sub-path deployments on
* the same public asset contract.
*/
function resolveDefaultFullAssetBaseUrl(documentRef) {
	const activeDocument = documentRef !== null && documentRef !== void 0 ? documentRef : typeof document === "undefined" ? null : document;
	if (!activeDocument) return DEFAULT_FULL_ASSET_BASE_URL;
	try {
		return new URL(DEFAULT_FULL_ASSET_BASE_PATH, resolveFileViewerRuntimeAssetBaseUrl(activeDocument)).href;
	} catch {
		return DEFAULT_FULL_ASSET_BASE_URL;
	}
}
function joinFullAssetUrl(baseUrl, path) {
	return `${baseUrl}${path.replace(/^\/+/, "")}`;
}
function versionPptRuntimeAssetUrl(url) {
	return `${url}${url.includes("?") ? "&" : "?"}file-viewer-ppt=${encodeURIComponent(DEFAULT_FILE_VIEWER_PPT_RUNTIME_VERSION)}`;
}
function versionDocxRuntimeAssetUrl(url) {
	return `${url}${url.includes("?") ? "&" : "?"}file-viewer-docx=${encodeURIComponent(DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION)}`;
}
function versionCadRuntimeAssetUrl(url) {
	return `${url}${url.includes("?") ? "&" : "?"}file-viewer-cad=${encodeURIComponent(DEFAULT_FILE_VIEWER_CAD_RUNTIME_VERSION)}`;
}
function createFullAssetOptions(assetBaseUrl) {
	const baseUrl = normalizeFullAssetBaseUrl(assetBaseUrl);
	if (!baseUrl) return {};
	const assetUrl = (path) => joinFullAssetUrl(baseUrl, path);
	const docxAssetUrl = (path) => versionDocxRuntimeAssetUrl(assetUrl(path));
	const pptAssetUrl = (path) => versionPptRuntimeAssetUrl(assetUrl(path));
	return {
		archive: {
			workerUrl: assetUrl(DEFAULT_FILE_VIEWER_ARCHIVE_WORKER_PATH),
			wasmUrl: assetUrl(DEFAULT_FILE_VIEWER_ARCHIVE_WASM_PATH)
		},
		chm: {
			workerUrl: assetUrl(DEFAULT_FILE_VIEWER_CHM_WORKER_PATH),
			wasmModuleUrl: assetUrl(DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PATH),
			wasmUrl: assetUrl(DEFAULT_FILE_VIEWER_CHM_WASM_PATH)
		},
		cad: {
			wasmPath: assetUrl(DEFAULT_FILE_VIEWER_CAD_WASM_PATH),
			workerUrl: versionCadRuntimeAssetUrl(assetUrl(DEFAULT_FILE_VIEWER_CAD_WORKER_PATH)),
			dwfWasmUrl: versionCadRuntimeAssetUrl(assetUrl(DEFAULT_FILE_VIEWER_CAD_DWF_WASM_PATH))
		},
		data: { sqlWasmUrl: assetUrl(DEFAULT_FILE_VIEWER_DATA_SQL_WASM_URL) },
		docx: {
			workerUrl: docxAssetUrl(DEFAULT_FILE_VIEWER_DOCX_WORKER_PATH),
			workerJsZipUrl: docxAssetUrl(DEFAULT_FILE_VIEWER_DOCX_WORKER_JSZIP_PATH)
		},
		drawing: { viewerScriptUrl: assetUrl(DEFAULT_FILE_VIEWER_DRAWIO_VIEWER_SCRIPT_PATH) },
		model: {
			workerUrl: assetUrl(DEFAULT_FILE_VIEWER_MODEL_WORKER_URL),
			runtimeUrl: assetUrl(DEFAULT_FILE_VIEWER_MODEL_RUNTIME_URL),
			wasmUrl: assetUrl(DEFAULT_FILE_VIEWER_MODEL_WASM_URL)
		},
		pdf: {
			workerUrl: assetUrl(DEFAULT_FILE_VIEWER_PDF_WORKER_PATH),
			cMapUrl: assetUrl(DEFAULT_FILE_VIEWER_PDF_CMAP_PATH),
			wasmUrl: assetUrl(DEFAULT_FILE_VIEWER_PDF_WASM_PATH),
			standardFontDataUrl: assetUrl(DEFAULT_FILE_VIEWER_PDF_STANDARD_FONT_PATH),
			cjkFontFallbackPath: assetUrl(DEFAULT_FILE_VIEWER_PDF_CJK_FONT_FALLBACK_PATH)
		},
		presentation: {
			pptModuleUrl: pptAssetUrl(DEFAULT_FILE_VIEWER_PPT_MODULE_PATH),
			pptWorkerUrl: pptAssetUrl(DEFAULT_FILE_VIEWER_PPT_WORKER_PATH),
			pptWasmUrl: pptAssetUrl(DEFAULT_FILE_VIEWER_PPT_WASM_PATH),
			pptFontUrl: pptAssetUrl(DEFAULT_FILE_VIEWER_PPT_FONT_PATH),
			workerUrl: assetUrl(DEFAULT_FILE_VIEWER_PRESENTATION_WORKER_PATH)
		},
		spreadsheet: { workerUrl: assetUrl(DEFAULT_FILE_VIEWER_SPREADSHEET_WORKER_PATH) },
		typst: {
			compilerWasmUrl: assetUrl(DEFAULT_FILE_VIEWER_TYPST_COMPILER_WASM_URL),
			rendererWasmUrl: assetUrl(DEFAULT_FILE_VIEWER_TYPST_RENDERER_WASM_URL),
			fontAssetsUrl: assetUrl(DEFAULT_FILE_VIEWER_TYPST_FONT_ASSETS_URL)
		}
	};
}
function mergeNestedOptions(defaults, overrides) {
	if (!defaults) return overrides;
	if (!overrides) return defaults;
	const definedOverrides = Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== void 0));
	return {
		...defaults,
		...definedOverrides
	};
}
function getDefaultFullAssetBaseUrl() {
	return configuredFullAssetBaseUrl === automaticAssetBaseUrl ? resolveDefaultFullAssetBaseUrl() : configuredFullAssetBaseUrl;
}
function setDefaultFullAssetBaseUrl(assetBaseUrl) {
	configuredFullAssetBaseUrl = normalizeFullAssetBaseUrl(assetBaseUrl);
}
function resetDefaultFullAssetBaseUrl() {
	configuredFullAssetBaseUrl = automaticAssetBaseUrl;
}
function mergeFullAssetOptions(options = {}, assetBaseUrl = getDefaultFullAssetBaseUrl()) {
	var _a;
	const assetOptions = createFullAssetOptions(assetBaseUrl);
	const pdfDefaults = normalizeFullAssetBaseUrl((_a = options.pdf) === null || _a === void 0 ? void 0 : _a.assetBaseUrl) ? void 0 : assetOptions.pdf;
	return {
		...options,
		archive: mergeNestedOptions(assetOptions.archive, options.archive),
		chm: mergeNestedOptions(assetOptions.chm, options.chm),
		cad: mergeNestedOptions(assetOptions.cad, options.cad),
		data: mergeNestedOptions(assetOptions.data, options.data),
		docx: mergeNestedOptions(assetOptions.docx, options.docx),
		drawing: mergeNestedOptions(assetOptions.drawing, options.drawing),
		model: mergeNestedOptions(assetOptions.model, options.model),
		pdf: mergeNestedOptions(pdfDefaults, options.pdf),
		presentation: mergeNestedOptions(assetOptions.presentation, options.presentation),
		spreadsheet: mergeNestedOptions(assetOptions.spreadsheet, options.spreadsheet),
		typst: mergeNestedOptions(assetOptions.typst, options.typst)
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+preset-all@3.1.2_bpmn-js@18.31.0_esbuild@0.28.1_geotiff@2.1.3_pdf-lib@1.17.1_three@0.185.1_web-ifc@0.0.78/node_modules/@file-viewer/preset-all/dist/index.js
var allRendererHandlers = coreBrowserRendererHandlers;
var extractedRendererIds = [
	"adobe-palette-design",
	"adobe-xd-design",
	"apple-keynote",
	"apple-numbers",
	"apple-pages",
	"archive",
	"audio",
	"binary-inspector",
	"cad",
	"chm",
	"code",
	"data-asset",
	"drawing",
	"ebook-fb2",
	"eda",
	"email",
	"epub",
	"geo",
	"illustrator-pdf-design",
	"image",
	"indesign-idml-design",
	"indesign-native-design",
	"markdown",
	"mindmap",
	"model",
	"ofd",
	"office-hangul",
	"office-presentation",
	"office-presentation-binary",
	"office-word-binary",
	"office-word-openxml",
	"office-wordperfect",
	"open-document",
	"pdf",
	"photoshop-design",
	"photoshop-resource-design",
	"postscript-design",
	"spreadsheet-dbf",
	"spreadsheet-openxml",
	"typst",
	"umd",
	"video"
];
var fileViewerAllRendererPlugin = {
	id: "file-viewer-all-renderers",
	label: "Flyfish File Viewer all renderers",
	definitions: DEFAULT_RENDERER_DEFINITIONS.filter((definition) => !extractedRendererIds.includes(definition.id)),
	handlers: allRendererHandlers.filter((handler) => !extractedRendererIds.includes(handler.rendererId))
};
var allRenderers = {
	id: "file-viewer-preset-all",
	label: "Flyfish File Viewer full renderer preset",
	renderers: [
		wordRenderer,
		wordPerfectRenderer,
		hangulRenderer,
		iworkRenderer,
		pdfRenderer,
		ofdRenderer,
		presentationRenderer,
		spreadsheetRenderer,
		cadRenderer,
		typstRenderer,
		drawingRenderer,
		modelRenderer,
		archiveRenderer,
		chmRenderer,
		emailRenderer,
		ebookRenderer,
		textRenderer,
		imageRenderer,
		mediaRenderer,
		mindmapRenderer,
		geoRenderer,
		dataRenderer,
		edaRenderer,
		fileViewerAllRendererPlugin
	]
};
var fileViewerPresetAll = allRenderers;
registerFileViewerAutoRendererPreset(allRenderers, {
	id: "all",
	packageName: "@file-viewer/preset-all"
});
//#endregion
export { DEFAULT_FULL_ASSET_BASE_URL as a, mergeFullAssetOptions as c, resolveDefaultFullAssetBaseUrl as d, setDefaultFullAssetBaseUrl as f, DEFAULT_FULL_ASSET_BASE_PATH as i, normalizeFullAssetBaseUrl as l, fileViewerAllRendererPlugin as n, createFullAssetOptions as o, fileViewerPresetAll as r, getDefaultFullAssetBaseUrl as s, allRenderers as t, resetDefaultFullAssetBaseUrl as u };
