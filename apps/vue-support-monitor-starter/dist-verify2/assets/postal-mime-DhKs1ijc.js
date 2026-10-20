//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/decode-strings.js
var textEncoder = new TextEncoder();
var base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64Lookup = /* @__PURE__ */ new Uint8Array(256);
for (let i = 0; i < 64; i++) base64Lookup[base64Chars.charCodeAt(i)] = i;
function decodeBase64(base64) {
	let len = base64.length;
	while (len > 0 && base64.charAt(len - 1) === "=") len--;
	if (len % 4 === 1) len--;
	const remainder = len % 4;
	const bufferLength = Math.floor(len / 4) * 3 + (remainder ? remainder - 1 : 0);
	const arrayBuffer = new ArrayBuffer(bufferLength);
	const bytes = new Uint8Array(arrayBuffer);
	let p = 0;
	for (let i = 0; i < len; i += 4) {
		let encoded1 = base64Lookup[base64.charCodeAt(i)];
		let encoded2 = base64Lookup[base64.charCodeAt(i + 1)];
		let encoded3 = base64Lookup[base64.charCodeAt(i + 2)];
		let encoded4 = base64Lookup[base64.charCodeAt(i + 3)];
		bytes[p++] = encoded1 << 2 | encoded2 >> 4;
		if (p < bufferLength) bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
		if (p < bufferLength) bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
	}
	return arrayBuffer;
}
var charsetAliases = /* @__PURE__ */ new Map([
	["iso88598i", "iso-8859-8"],
	["iso88598e", "iso-8859-8"],
	["shiftjis", "shift_jis"],
	["windows31j", "shift_jis"],
	["mskanji", "shift_jis"],
	["eucjp", "euc-jp"],
	["iso2022jp", "iso-2022-jp"],
	["iso2022jp1", "iso-2022-jp"],
	["iso2022jp2", "iso-2022-jp"],
	["junet", "iso-2022-jp"],
	["euckr", "euc-kr"],
	["uhc", "euc-kr"],
	["tis620", "windows-874"]
]);
var codePageAliases = /* @__PURE__ */ new Map([
	["932", "shift_jis"],
	["936", "gbk"],
	["949", "euc-kr"],
	["950", "big5"],
	["874", "windows-874"],
	["51932", "euc-jp"],
	["50220", "iso-2022-jp"],
	["50221", "iso-2022-jp"],
	["50222", "iso-2022-jp"]
]);
var codePagePattern = /^(?:cp|windows|ms|ibm)(\d+)$/;
function normalizeCharset(charset) {
	return charset.replace(/^(?:x-ms-|x-|cs)/, "").replace(/[\s._-]+/g, "");
}
var ENCODING_LABELS = new Set([
	"unicode-1-1-utf-8 unicode11utf8 unicode20utf8 utf-8 utf8 x-unicode20utf8",
	"866 cp866 csibm866 ibm866",
	"csisolatin2 iso-8859-2 iso-ir-101 iso8859-2 iso88592 iso_8859-2 iso_8859-2:1987 l2 latin2",
	"csisolatin3 iso-8859-3 iso-ir-109 iso8859-3 iso88593 iso_8859-3 iso_8859-3:1988 l3 latin3",
	"csisolatin4 iso-8859-4 iso-ir-110 iso8859-4 iso88594 iso_8859-4 iso_8859-4:1988 l4 latin4",
	"csisolatincyrillic cyrillic iso-8859-5 iso-ir-144 iso8859-5 iso88595 iso_8859-5 iso_8859-5:1988",
	"arabic asmo-708 csiso88596e csiso88596i csisolatinarabic ecma-114 iso-8859-6 iso-8859-6-e",
	"iso-8859-6-i iso-ir-127 iso8859-6 iso88596 iso_8859-6 iso_8859-6:1987",
	"csisolatingreek ecma-118 elot_928 greek greek8 iso-8859-7 iso-ir-126 iso8859-7 iso88597 iso_8859-7",
	"iso_8859-7:1987 sun_eu_greek",
	"csiso88598e csisolatinhebrew hebrew iso-8859-8 iso-8859-8-e iso-ir-138 iso8859-8 iso88598 iso_8859-8",
	"iso_8859-8:1988 visual",
	"csiso88598i iso-8859-8-i logical",
	"csisolatin6 iso-8859-10 iso-ir-157 iso8859-10 iso885910 l6 latin6",
	"iso-8859-13 iso8859-13 iso885913",
	"iso-8859-14 iso8859-14 iso885914",
	"csisolatin9 iso-8859-15 iso8859-15 iso885915 iso_8859-15 l9",
	"iso-8859-16",
	"cskoi8r koi koi8 koi8-r koi8_r",
	"koi8-ru koi8-u",
	"csmacintosh mac macintosh x-mac-roman",
	"dos-874 iso-8859-11 iso8859-11 iso885911 tis-620 windows-874",
	"cp1250 windows-1250 x-cp1250",
	"cp1251 windows-1251 x-cp1251",
	"ansi_x3.4-1968 ascii cp1252 cp819 csisolatin1 ibm819 iso-8859-1 iso-ir-100 iso8859-1 iso88591",
	"iso_8859-1 iso_8859-1:1987 l1 latin1 us-ascii windows-1252 x-cp1252",
	"cp1253 windows-1253 x-cp1253",
	"cp1254 csisolatin5 iso-8859-9 iso-ir-148 iso8859-9 iso88599 iso_8859-9 iso_8859-9:1989 l5 latin5",
	"windows-1254 x-cp1254",
	"cp1255 windows-1255 x-cp1255",
	"cp1256 windows-1256 x-cp1256",
	"cp1257 windows-1257 x-cp1257",
	"cp1258 windows-1258 x-cp1258",
	"x-mac-cyrillic x-mac-ukrainian",
	"chinese csgb2312 csiso58gb231280 gb2312 gb_2312 gb_2312-80 gbk iso-ir-58 x-gbk",
	"gb18030",
	"big5 big5-hkscs cn-big5 csbig5 x-x-big5",
	"cseucpkdfmtjapanese euc-jp x-euc-jp",
	"csiso2022jp iso-2022-jp",
	"csshiftjis ms932 ms_kanji shift-jis shift_jis sjis windows-31j x-sjis",
	"cseuckr csksc56011987 euc-kr iso-ir-149 korean ks_c_5601-1987 ks_c_5601-1989 ksc5601 ksc_5601",
	"windows-949",
	"csiso2022kr hz-gb-2312 iso-2022-cn iso-2022-cn-ext iso-2022-kr replacement",
	"unicodefffe utf-16be",
	"csunicode iso-10646-ucs-2 ucs-2 unicode unicodefeff utf-16 utf-16le",
	"x-user-defined"
].join(" ").split(" "));
var decoders = /* @__PURE__ */ new Map();
function tryDecoder(charset) {
	if (!ENCODING_LABELS.has(charset)) return null;
	if (!decoders.has(charset)) {
		let decoder = null;
		try {
			decoder = new TextDecoder(charset);
		} catch (err) {}
		decoders.set(charset, decoder);
	}
	return decoders.get(charset);
}
function getDecoder(charset) {
	charset = (charset || "utf8").trim().toLowerCase();
	const decoder = tryDecoder(charset);
	if (decoder) return decoder;
	const normalized = normalizeCharset(charset);
	const codePage = normalized.match(codePagePattern);
	return tryDecoder(codePage && codePageAliases.get(codePage[1]) || charsetAliases.get(normalized) || normalized) || tryDecoder("windows-1252");
}
/**
* Converts a Blob into an ArrayBuffer
* @param {Blob} blob Blob to convert
* @returns {ArrayBuffer} Converted value
*/
async function blobToArrayBuffer(blob) {
	if ("arrayBuffer" in blob) return await blob.arrayBuffer();
	const fr = new FileReader();
	return new Promise((resolve, reject) => {
		fr.onload = function(e) {
			resolve(e.target.result);
		};
		fr.onerror = function(e) {
			reject(fr.error);
		};
		fr.readAsArrayBuffer(blob);
	});
}
/**
* Numeric value of an ASCII hex digit
*
* @param {Number} c Byte to read
* @return {Number} Value 0-15, or -1 if the byte is not a hex digit
*/
function hexNibble(c) {
	if (c >= 48 && c <= 57) return c - 48;
	if (c >= 97 && c <= 102) return c - 97 + 10;
	if (c >= 65 && c <= 70) return c - 65 + 10;
	return -1;
}
/**
* Decode a complete mime word encoded string
*
* @param {String} str Mime word encoded string
* @return {String} Decoded unicode string
*/
function decodeWord(charset, encoding, str) {
	let splitPos = charset.indexOf("*");
	if (splitPos >= 0) charset = charset.substr(0, splitPos);
	encoding = encoding.toUpperCase();
	let byteStr;
	if (encoding === "Q") {
		str = str.replace(/=\s+([0-9a-fA-F])/g, "=$1").replace(/[_\s]/g, " ");
		let buf = textEncoder.encode(str);
		let encodedBytes = [];
		for (let i = 0, len = buf.length; i < len; i++) {
			let c = buf[i];
			if (i <= len - 2 && c === 61) {
				let high = hexNibble(buf[i + 1]);
				let low = hexNibble(buf[i + 2]);
				if (high >= 0 && low >= 0) {
					encodedBytes.push(high << 4 | low);
					i += 2;
					continue;
				}
			}
			encodedBytes.push(c);
		}
		byteStr = new ArrayBuffer(encodedBytes.length);
		let dataView = new DataView(byteStr);
		for (let i = 0, len = encodedBytes.length; i < len; i++) dataView.setUint8(i, encodedBytes[i]);
	} else if (encoding === "B") byteStr = decodeBase64(str.replace(/[^a-zA-Z0-9\+\/=]+/g, ""));
	else byteStr = textEncoder.encode(str);
	return getDecoder(charset).decode(byteStr);
}
var ENCODED_WORD_PATTERN = "=\\?([^?\\s]+)\\?([QqBb])\\?([^?]*)\\?=";
var ENCODED_WORD_REGEX = new RegExp(ENCODED_WORD_PATTERN, "g");
var WORD_SEPARATOR_REGEX = /^[ \t\r\n]+$/;
var ENCODED_WORDS_ONLY_REGEX = new RegExp(`^(?:${ENCODED_WORD_PATTERN}\\s*)+$`);
/**
* Checks whether a string is nothing but RFC 2047 encoded words. Kept next to the grammar
* it depends on, so the pattern has a single definition.
*
* @param {String} str String to check
* @return {Boolean} true if the string holds encoded words and nothing else
*/
function isEncodedWordsOnly(str) {
	return ENCODED_WORDS_ONLY_REGEX.test(str);
}
/**
* Splits a string into encoded words and the literal text around them.
*
* Working on a token list rather than marking joinable words with an in band sentinel
* means the input can not contain the marker, which previously let a sender delete text
* from a subject or a display name by writing the marker into the header themselves.
*
* @param {String} str String to split
* @return {Array} Array of `{text}` and `{charset, encoding, encodedText}` tokens
*/
function splitEncodedWords(str) {
	const tokens = [];
	ENCODED_WORD_REGEX.lastIndex = 0;
	let pos = 0;
	let match;
	while (match = ENCODED_WORD_REGEX.exec(str)) {
		if (match.index > pos) tokens.push({ text: str.substring(pos, match.index) });
		tokens.push({
			charset: match[1],
			encoding: match[2],
			encodedText: match[3]
		});
		pos = match.index + match[0].length;
	}
	if (pos < str.length) tokens.push({ text: str.substring(pos) });
	return tokens;
}
/**
* Checks if two adjacent encoded words may be decoded as a single unit. A multi byte
* character is often split across two words, so the bytes have to be concatenated before
* they are decoded. Base64 additionally needs the left chunk to end on a group boundary,
* otherwise the concatenation shifts every byte that follows.
*/
function canJoinWords(left, right) {
	const encoding = left.encoding.toUpperCase();
	if (left.charset !== right.charset || encoding !== right.encoding.toUpperCase()) return false;
	if (encoding === "B") return left.encodedText.length % 4 === 0 && !/=$/.test(left.encodedText);
	return true;
}
/**
* Decodes a token list into a string, optionally merging adjacent encoded words.
*
* @param {Array} tokens Tokens from splitEncodedWords
* @param {Boolean} joinWords Whether adjacent encoded words may be decoded as one unit
* @return {String} Decoded string
*/
function renderTokens(tokens, joinWords) {
	let result = "";
	let pending = null;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token.text !== void 0) {
			const nextToken = tokens[i + 1];
			if (pending && nextToken && nextToken.text === void 0 && WORD_SEPARATOR_REGEX.test(token.text)) continue;
			if (pending) {
				result += decodeWord(pending.charset, pending.encoding, pending.encodedText);
				pending = null;
			}
			result += token.text;
			continue;
		}
		if (pending && joinWords && canJoinWords(pending, token)) {
			pending.encodedText += token.encodedText;
			continue;
		}
		if (pending) result += decodeWord(pending.charset, pending.encoding, pending.encodedText);
		pending = {
			charset: token.charset,
			encoding: token.encoding,
			encodedText: token.encodedText
		};
	}
	if (pending) result += decodeWord(pending.charset, pending.encoding, pending.encodedText);
	return result;
}
function decodeWords(str) {
	const tokens = splitEncodedWords((str || "").toString());
	const result = renderTokens(tokens, true);
	return result.indexOf("�") < 0 ? result : renderTokens(tokens, false);
}
function decodeURIComponentWithCharset(encodedStr, charset) {
	charset = charset || "utf-8";
	let encodedBytes = [];
	for (let i = 0; i < encodedStr.length; i++) {
		let c = encodedStr.charAt(i);
		if (c === "%" && /^[a-f0-9]{2}/i.test(encodedStr.substr(i + 1, 2))) {
			let byte = encodedStr.substr(i + 1, 2);
			i += 2;
			encodedBytes.push(parseInt(byte, 16));
		} else if (c.charCodeAt(0) > 126) {
			c = textEncoder.encode(c);
			for (let j = 0; j < c.length; j++) encodedBytes.push(c[j]);
		} else encodedBytes.push(c.charCodeAt(0));
	}
	const byteStr = new ArrayBuffer(encodedBytes.length);
	const dataView = new DataView(byteStr);
	for (let i = 0, len = encodedBytes.length; i < len; i++) dataView.setUint8(i, encodedBytes[i]);
	return getDecoder(charset).decode(byteStr);
}
function decodeParameterValueContinuations(header) {
	let paramKeys = /* @__PURE__ */ new Map();
	Object.keys(header.params).forEach((key) => {
		let match = key.match(/\*((\d+)\*?)?$/);
		if (!match) return;
		let actualKey = key.substr(0, match.index).toLowerCase();
		let nr = Number(match[2]) || 0;
		let paramVal;
		if (!paramKeys.has(actualKey)) {
			paramVal = {
				charset: false,
				values: []
			};
			paramKeys.set(actualKey, paramVal);
		} else paramVal = paramKeys.get(actualKey);
		let value = header.params[key];
		let encoded = match[0].charAt(match[0].length - 1) === "*";
		if (nr === 0 && encoded && (match = value.match(/^([^']*)'[^']*'(.*)$/))) {
			paramVal.charset = match[1] || "utf-8";
			value = match[2];
		}
		paramVal.values.push({
			nr,
			value,
			encoded
		});
		delete header.params[key];
	});
	paramKeys.forEach((paramVal, key) => {
		let result = "";
		let pending = "";
		for (let part of paramVal.values.sort((a, b) => a.nr - b.nr)) {
			if (part.encoded) {
				pending += part.value;
				continue;
			}
			if (pending) {
				result += decodeURIComponentWithCharset(pending, paramVal.charset);
				pending = "";
			}
			result += part.value;
		}
		if (pending) result += decodeURIComponentWithCharset(pending, paramVal.charset);
		header.params[key] = result;
	});
}
//#endregion
//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/pass-through-decoder.js
var PassThroughDecoder = class {
	constructor() {
		this.chunks = [];
	}
	update(line) {
		this.chunks.push(line);
		this.chunks.push("\n");
	}
	finalize() {
		return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
	}
};
//#endregion
//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/base64-decoder.js
var Base64Decoder = class {
	constructor(opts) {
		opts = opts || {};
		this.decoder = opts.decoder || new TextDecoder();
		this.maxChunkSize = 102400;
		this.chunks = [];
		this.remainder = "";
	}
	pushChunk(base64Str) {
		if (base64Str.length) this.chunks.push(decodeBase64(base64Str));
	}
	flushRemainder() {
		this.pushChunk(this.remainder);
		this.remainder = "";
	}
	update(buffer) {
		const units = this.decoder.decode(buffer).replace(/[^a-zA-Z0-9+/=]+/g, "").split(/=+/);
		for (let i = 0; i < units.length; i++) {
			this.remainder += units[i];
			if (i < units.length - 1) this.flushRemainder();
		}
		if (this.remainder.length >= this.maxChunkSize) {
			const alignedLength = Math.floor(this.remainder.length / 4) * 4;
			this.pushChunk(this.remainder.substring(0, alignedLength));
			this.remainder = this.remainder.substring(alignedLength);
		}
	}
	finalize() {
		this.flushRemainder();
		return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
	}
};
//#endregion
//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/qp-decoder.js
var CHR_EQUALS = 61;
var CHR_LF = 10;
var QPDecoder = class {
	constructor() {
		this.maxChunkSize = 102400;
		this.buffer = new Uint8Array(this.maxChunkSize);
		this.bufferPos = 0;
		this.chunks = [];
	}
	writeByte(byte) {
		if (this.bufferPos >= this.buffer.length) this.flushBuffer();
		this.buffer[this.bufferPos++] = byte;
	}
	writeBytes(line, start, end) {
		while (start < end) {
			if (this.bufferPos >= this.buffer.length) this.flushBuffer();
			const count = Math.min(end - start, this.buffer.length - this.bufferPos);
			this.buffer.set(line.subarray(start, start + count), this.bufferPos);
			this.bufferPos += count;
			start += count;
		}
	}
	flushBuffer() {
		if (this.bufferPos) {
			this.chunks.push(this.buffer.slice(0, this.bufferPos));
			this.bufferPos = 0;
		}
	}
	update(line) {
		let len = line.length;
		const softBreak = len > 0 && line[len - 1] === CHR_EQUALS;
		if (softBreak) len--;
		let literalStart = 0;
		for (let i = 0; i < len; i++) {
			if (line[i] !== CHR_EQUALS || i + 2 >= len) continue;
			const high = hexNibble(line[i + 1]);
			const low = hexNibble(line[i + 2]);
			if (high < 0 || low < 0) continue;
			this.writeBytes(line, literalStart, i);
			this.writeByte(high << 4 | low);
			i += 2;
			literalStart = i + 1;
		}
		this.writeBytes(line, literalStart, len);
		if (!softBreak) this.writeByte(CHR_LF);
	}
	finalize() {
		this.flushBuffer();
		return blobToArrayBuffer(new Blob(this.chunks, { type: "application/octet-stream" }));
	}
};
//#endregion
//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/mime-node.js
var headerDecoder = new TextDecoder("utf-8", { ignoreBOM: true });
var isWsp = (c) => c === 32 || c === 9;
var trimWsp = (str) => {
	let start = 0;
	let end = str.length;
	while (start < end && isWsp(str.charCodeAt(start))) start++;
	while (end > start && isWsp(str.charCodeAt(end - 1))) end--;
	return str.slice(start, end);
};
var CONTENT_HEADERS = /* @__PURE__ */ new Set([
	"content-type",
	"content-transfer-encoding",
	"content-disposition",
	"content-id",
	"content-description"
]);
var MimeNode = class {
	constructor(options) {
		this.options = options || {};
		this.postalMime = this.options.postalMime;
		this.childNodes = [];
		this.finalizedChildCount = 0;
		if (this.options.parentNode) {
			this.parentNode = this.options.parentNode;
			this.depth = this.parentNode.depth + 1;
			if (this.depth > this.options.maxNestingDepth) throw new Error(`Maximum MIME nesting depth of ${this.options.maxNestingDepth} levels exceeded`);
			this.options.parentNode.childNodes.push(this);
		} else this.depth = 0;
		this.state = "header";
		this.headerLines = [];
		const defaultContentType = (this.options.parentMultipartType || null) === "digest" ? "message/rfc822" : "text/plain";
		this.contentType = { value: defaultContentType };
		this.contentTransferEncoding = { value: "8bit" };
		this.contentDisposition = { value: "" };
		this.headers = [];
		this.contentDecoder = false;
	}
	setupContentDecoder(transferEncoding) {
		if (/base64/i.test(transferEncoding)) this.contentDecoder = new Base64Decoder();
		else if (/quoted-printable/i.test(transferEncoding)) this.contentDecoder = new QPDecoder();
		else this.contentDecoder = new PassThroughDecoder();
	}
	async finalize() {
		if (this.state === "finished") return;
		if (this.state === "header") this.processHeaders();
		let boundaries = this.postalMime.boundaries;
		for (let i = boundaries.length - 1; i >= 0; i--) if (boundaries[i].node === this) {
			boundaries.splice(i, 1);
			break;
		}
		await this.finalizeChildNodes();
		this.content = this.contentDecoder ? await this.contentDecoder.finalize() : null;
		this.contentDecoder = false;
		this.state = "finished";
	}
	async finalizeChildNodes() {
		while (this.finalizedChildCount < this.childNodes.length) await this.childNodes[this.finalizedChildCount++].finalize();
	}
	stripComments(str) {
		let result = "";
		let depth = 0;
		let escaped = false;
		let inQuote = false;
		let commentStart = -1;
		let inParameterValue = false;
		let endsWithWsp = false;
		const append = (c) => {
			result += c;
			endsWithWsp = c === " " || c === "	";
		};
		const opensComment = () => !inParameterValue || !result.length || endsWithWsp;
		for (let i = 0; i < str.length; i++) {
			const chr = str.charAt(i);
			if (escaped) {
				if (depth === 0) append(chr);
				escaped = false;
				continue;
			}
			if (chr === "\\") {
				escaped = true;
				if (depth === 0) append(chr);
				continue;
			}
			if (chr === "\"" && depth === 0) {
				inQuote = !inQuote;
				append(chr);
				continue;
			}
			if (!inQuote) {
				if (chr === "(" && opensComment()) {
					if (depth === 0) commentStart = i;
					depth++;
					continue;
				}
				if (chr === ")" && depth > 0) {
					depth--;
					continue;
				}
				if (depth === 0) {
					if (chr === "=") inParameterValue = true;
					else if (chr === ";") inParameterValue = false;
				}
			}
			if (depth === 0) append(chr);
		}
		if (depth === 0) return result;
		return str.indexOf(";", commentStart) < 0 ? result : str;
	}
	parseStructuredHeader(str) {
		str = this.stripComments(str);
		let response = {
			value: false,
			params: {}
		};
		let key = false;
		let value = "";
		let stage = "value";
		let pendingSpace = "";
		let quoteClosed = false;
		let quote = false;
		let escaped = false;
		let chr;
		const addChr = (c) => {
			if (value.length) value += pendingSpace;
			pendingSpace = "";
			value += c;
		};
		const takeValue = () => {
			const result = value;
			value = "";
			pendingSpace = "";
			quoteClosed = false;
			return result;
		};
		const storeParam = (name, result) => {
			if (!Object.prototype.hasOwnProperty.call(response.params, name)) response.params[name] = result;
		};
		const storeValue = () => {
			const result = takeValue();
			if (key === false) response.value = result;
			else storeParam(key, result);
		};
		const storeEmptyKey = () => {
			const name = takeValue().trim();
			if (name) storeParam(name.toLowerCase(), "");
		};
		for (let i = 0, len = str.length; i < len; i++) {
			chr = str.charAt(i);
			switch (stage) {
				case "key":
					if (chr === "=") {
						key = takeValue().trim().toLowerCase();
						stage = "value";
						break;
					}
					if (chr === ";") {
						storeEmptyKey();
						break;
					}
					value += chr;
					break;
				case "value":
					if (escaped) addChr(chr);
					else if (quote && chr === "\\") {
						escaped = true;
						continue;
					} else if (quote && chr === quote) {
						quote = false;
						quoteClosed = true;
					} else if (!quote && chr === "\"") {
						quote = chr;
						if (value.length) value += pendingSpace;
						pendingSpace = "";
					} else if (!quote && chr === ";") {
						storeValue();
						stage = "key";
					} else if (!quote && (chr === " " || chr === "	")) pendingSpace += chr;
					else if (!quoteClosed) addChr(chr);
					escaped = false;
			}
		}
		if (stage === "value") storeValue();
		else storeEmptyKey();
		if (response.value) response.value = response.value.toLowerCase();
		decodeParameterValueContinuations(response);
		return response;
	}
	decodeFlowedText(str, delSp) {
		const parts = [];
		let lineStart = 0;
		let lineLength = 0;
		const lines = str.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];
			if (line.charAt(0) === " ") line = line.slice(1);
			if (i) {
				const last = parts.length ? parts[parts.length - 1] : "";
				const isSignature = lineLength === 3 && parts.slice(lineStart).join("") === "-- ";
				if (last.endsWith(" ") && !isSignature) {
					if (delSp) {
						if (last.length > 1) parts[parts.length - 1] = last.slice(0, -1);
						else parts.pop();
						lineLength--;
					}
				} else {
					parts.push("\n");
					lineStart = parts.length;
					lineLength = 0;
				}
			}
			if (line) {
				parts.push(line);
				lineLength += line.length;
			}
		}
		return parts.join("");
	}
	getTextContent() {
		if (!this.content) return "";
		let str = getDecoder(this.contentType.parsed.params.charset).decode(this.content);
		if (/^flowed$/i.test(this.contentType.parsed.params.format)) str = this.decodeFlowedText(str, /^yes$/i.test(this.contentType.parsed.params.delsp));
		return str;
	}
	processHeaders() {
		let foldedLines = [];
		for (let line of this.headerLines) if (foldedLines.length && /^[ \t]/.test(line)) foldedLines[foldedLines.length - 1].push(line);
		else foldedLines.push([line]);
		this.rawHeaderLines = [];
		let seenContentHeaders = /* @__PURE__ */ new Set();
		for (let parts of foldedLines) {
			let rawLine = parts.join("\n");
			let sep = rawLine.indexOf(":");
			let rawKey = trimWsp(sep < 0 ? rawLine : rawLine.substr(0, sep));
			this.rawHeaderLines.push({
				key: rawKey.toLowerCase(),
				line: rawLine
			});
			let unfoldedLine = parts.join("");
			sep = unfoldedLine.indexOf(":");
			let key = trimWsp(sep < 0 ? unfoldedLine : unfoldedLine.substr(0, sep));
			let value = sep < 0 ? "" : trimWsp(unfoldedLine.substr(sep + 1).replace(/[\r\n]+/g, " "));
			this.headers.push({
				key: key.toLowerCase(),
				originalKey: key,
				value
			});
			const lowerKey = key.toLowerCase();
			if (CONTENT_HEADERS.has(lowerKey) && !seenContentHeaders.has(lowerKey)) {
				seenContentHeaders.add(lowerKey);
				switch (lowerKey) {
					case "content-type":
						this.contentType = {
							value,
							parsed: {}
						};
						break;
					case "content-transfer-encoding":
						this.contentTransferEncoding = {
							value,
							parsed: {}
						};
						break;
					case "content-disposition":
						this.contentDisposition = {
							value,
							parsed: {}
						};
						break;
					case "content-id":
						this.contentId = value;
						break;
					case "content-description": this.contentDescription = value;
				}
			}
		}
		this.contentType.parsed = this.parseStructuredHeader(this.contentType.value);
		this.contentType.multipart = /^multipart\//i.test(this.contentType.parsed.value) ? this.contentType.parsed.value.substr(this.contentType.parsed.value.indexOf("/") + 1) : false;
		if (this.contentType.multipart && this.contentType.parsed.params.boundary) this.postalMime.boundaries.push({
			value: textEncoder.encode(this.contentType.parsed.params.boundary),
			node: this
		});
		this.contentDisposition.parsed = this.parseStructuredHeader(this.contentDisposition.value);
		this.contentTransferEncoding.encoding = (this.stripComments(this.contentTransferEncoding.value).toLowerCase().match(/[\w-]+/) || [""])[0];
		this.setupContentDecoder(this.contentTransferEncoding.encoding);
	}
	feed(line) {
		switch (this.state) {
			case "header":
				if (!line.length) {
					this.state = "body";
					return this.processHeaders();
				}
				this.postalMime.headerSize += line.length;
				if (this.postalMime.headerSize > this.options.maxHeadersSize) throw /* @__PURE__ */ new Error(`Maximum header size of ${this.options.maxHeadersSize} bytes exceeded`);
				this.headerLines.push(headerDecoder.decode(line));
				break;
			case "body": this.contentDecoder.update(line);
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/html-entities.js
var htmlEntities = {
	"&AElig": "Æ",
	"&AElig;": "Æ",
	"&AMP": "&",
	"&AMP;": "&",
	"&Aacute": "Á",
	"&Aacute;": "Á",
	"&Abreve;": "Ă",
	"&Acirc": "Â",
	"&Acirc;": "Â",
	"&Acy;": "А",
	"&Afr;": "𝔄",
	"&Agrave": "À",
	"&Agrave;": "À",
	"&Alpha;": "Α",
	"&Amacr;": "Ā",
	"&And;": "⩓",
	"&Aogon;": "Ą",
	"&Aopf;": "𝔸",
	"&ApplyFunction;": "⁡",
	"&Aring": "Å",
	"&Aring;": "Å",
	"&Ascr;": "𝒜",
	"&Assign;": "≔",
	"&Atilde": "Ã",
	"&Atilde;": "Ã",
	"&Auml": "Ä",
	"&Auml;": "Ä",
	"&Backslash;": "∖",
	"&Barv;": "⫧",
	"&Barwed;": "⌆",
	"&Bcy;": "Б",
	"&Because;": "∵",
	"&Bernoullis;": "ℬ",
	"&Beta;": "Β",
	"&Bfr;": "𝔅",
	"&Bopf;": "𝔹",
	"&Breve;": "˘",
	"&Bscr;": "ℬ",
	"&Bumpeq;": "≎",
	"&CHcy;": "Ч",
	"&COPY": "©",
	"&COPY;": "©",
	"&Cacute;": "Ć",
	"&Cap;": "⋒",
	"&CapitalDifferentialD;": "ⅅ",
	"&Cayleys;": "ℭ",
	"&Ccaron;": "Č",
	"&Ccedil": "Ç",
	"&Ccedil;": "Ç",
	"&Ccirc;": "Ĉ",
	"&Cconint;": "∰",
	"&Cdot;": "Ċ",
	"&Cedilla;": "¸",
	"&CenterDot;": "·",
	"&Cfr;": "ℭ",
	"&Chi;": "Χ",
	"&CircleDot;": "⊙",
	"&CircleMinus;": "⊖",
	"&CirclePlus;": "⊕",
	"&CircleTimes;": "⊗",
	"&ClockwiseContourIntegral;": "∲",
	"&CloseCurlyDoubleQuote;": "”",
	"&CloseCurlyQuote;": "’",
	"&Colon;": "∷",
	"&Colone;": "⩴",
	"&Congruent;": "≡",
	"&Conint;": "∯",
	"&ContourIntegral;": "∮",
	"&Copf;": "ℂ",
	"&Coproduct;": "∐",
	"&CounterClockwiseContourIntegral;": "∳",
	"&Cross;": "⨯",
	"&Cscr;": "𝒞",
	"&Cup;": "⋓",
	"&CupCap;": "≍",
	"&DD;": "ⅅ",
	"&DDotrahd;": "⤑",
	"&DJcy;": "Ђ",
	"&DScy;": "Ѕ",
	"&DZcy;": "Џ",
	"&Dagger;": "‡",
	"&Darr;": "↡",
	"&Dashv;": "⫤",
	"&Dcaron;": "Ď",
	"&Dcy;": "Д",
	"&Del;": "∇",
	"&Delta;": "Δ",
	"&Dfr;": "𝔇",
	"&DiacriticalAcute;": "´",
	"&DiacriticalDot;": "˙",
	"&DiacriticalDoubleAcute;": "˝",
	"&DiacriticalGrave;": "`",
	"&DiacriticalTilde;": "˜",
	"&Diamond;": "⋄",
	"&DifferentialD;": "ⅆ",
	"&Dopf;": "𝔻",
	"&Dot;": "¨",
	"&DotDot;": "⃜",
	"&DotEqual;": "≐",
	"&DoubleContourIntegral;": "∯",
	"&DoubleDot;": "¨",
	"&DoubleDownArrow;": "⇓",
	"&DoubleLeftArrow;": "⇐",
	"&DoubleLeftRightArrow;": "⇔",
	"&DoubleLeftTee;": "⫤",
	"&DoubleLongLeftArrow;": "⟸",
	"&DoubleLongLeftRightArrow;": "⟺",
	"&DoubleLongRightArrow;": "⟹",
	"&DoubleRightArrow;": "⇒",
	"&DoubleRightTee;": "⊨",
	"&DoubleUpArrow;": "⇑",
	"&DoubleUpDownArrow;": "⇕",
	"&DoubleVerticalBar;": "∥",
	"&DownArrow;": "↓",
	"&DownArrowBar;": "⤓",
	"&DownArrowUpArrow;": "⇵",
	"&DownBreve;": "̑",
	"&DownLeftRightVector;": "⥐",
	"&DownLeftTeeVector;": "⥞",
	"&DownLeftVector;": "↽",
	"&DownLeftVectorBar;": "⥖",
	"&DownRightTeeVector;": "⥟",
	"&DownRightVector;": "⇁",
	"&DownRightVectorBar;": "⥗",
	"&DownTee;": "⊤",
	"&DownTeeArrow;": "↧",
	"&Downarrow;": "⇓",
	"&Dscr;": "𝒟",
	"&Dstrok;": "Đ",
	"&ENG;": "Ŋ",
	"&ETH": "Ð",
	"&ETH;": "Ð",
	"&Eacute": "É",
	"&Eacute;": "É",
	"&Ecaron;": "Ě",
	"&Ecirc": "Ê",
	"&Ecirc;": "Ê",
	"&Ecy;": "Э",
	"&Edot;": "Ė",
	"&Efr;": "𝔈",
	"&Egrave": "È",
	"&Egrave;": "È",
	"&Element;": "∈",
	"&Emacr;": "Ē",
	"&EmptySmallSquare;": "◻",
	"&EmptyVerySmallSquare;": "▫",
	"&Eogon;": "Ę",
	"&Eopf;": "𝔼",
	"&Epsilon;": "Ε",
	"&Equal;": "⩵",
	"&EqualTilde;": "≂",
	"&Equilibrium;": "⇌",
	"&Escr;": "ℰ",
	"&Esim;": "⩳",
	"&Eta;": "Η",
	"&Euml": "Ë",
	"&Euml;": "Ë",
	"&Exists;": "∃",
	"&ExponentialE;": "ⅇ",
	"&Fcy;": "Ф",
	"&Ffr;": "𝔉",
	"&FilledSmallSquare;": "◼",
	"&FilledVerySmallSquare;": "▪",
	"&Fopf;": "𝔽",
	"&ForAll;": "∀",
	"&Fouriertrf;": "ℱ",
	"&Fscr;": "ℱ",
	"&GJcy;": "Ѓ",
	"&GT": ">",
	"&GT;": ">",
	"&Gamma;": "Γ",
	"&Gammad;": "Ϝ",
	"&Gbreve;": "Ğ",
	"&Gcedil;": "Ģ",
	"&Gcirc;": "Ĝ",
	"&Gcy;": "Г",
	"&Gdot;": "Ġ",
	"&Gfr;": "𝔊",
	"&Gg;": "⋙",
	"&Gopf;": "𝔾",
	"&GreaterEqual;": "≥",
	"&GreaterEqualLess;": "⋛",
	"&GreaterFullEqual;": "≧",
	"&GreaterGreater;": "⪢",
	"&GreaterLess;": "≷",
	"&GreaterSlantEqual;": "⩾",
	"&GreaterTilde;": "≳",
	"&Gscr;": "𝒢",
	"&Gt;": "≫",
	"&HARDcy;": "Ъ",
	"&Hacek;": "ˇ",
	"&Hat;": "^",
	"&Hcirc;": "Ĥ",
	"&Hfr;": "ℌ",
	"&HilbertSpace;": "ℋ",
	"&Hopf;": "ℍ",
	"&HorizontalLine;": "─",
	"&Hscr;": "ℋ",
	"&Hstrok;": "Ħ",
	"&HumpDownHump;": "≎",
	"&HumpEqual;": "≏",
	"&IEcy;": "Е",
	"&IJlig;": "Ĳ",
	"&IOcy;": "Ё",
	"&Iacute": "Í",
	"&Iacute;": "Í",
	"&Icirc": "Î",
	"&Icirc;": "Î",
	"&Icy;": "И",
	"&Idot;": "İ",
	"&Ifr;": "ℑ",
	"&Igrave": "Ì",
	"&Igrave;": "Ì",
	"&Im;": "ℑ",
	"&Imacr;": "Ī",
	"&ImaginaryI;": "ⅈ",
	"&Implies;": "⇒",
	"&Int;": "∬",
	"&Integral;": "∫",
	"&Intersection;": "⋂",
	"&InvisibleComma;": "⁣",
	"&InvisibleTimes;": "⁢",
	"&Iogon;": "Į",
	"&Iopf;": "𝕀",
	"&Iota;": "Ι",
	"&Iscr;": "ℐ",
	"&Itilde;": "Ĩ",
	"&Iukcy;": "І",
	"&Iuml": "Ï",
	"&Iuml;": "Ï",
	"&Jcirc;": "Ĵ",
	"&Jcy;": "Й",
	"&Jfr;": "𝔍",
	"&Jopf;": "𝕁",
	"&Jscr;": "𝒥",
	"&Jsercy;": "Ј",
	"&Jukcy;": "Є",
	"&KHcy;": "Х",
	"&KJcy;": "Ќ",
	"&Kappa;": "Κ",
	"&Kcedil;": "Ķ",
	"&Kcy;": "К",
	"&Kfr;": "𝔎",
	"&Kopf;": "𝕂",
	"&Kscr;": "𝒦",
	"&LJcy;": "Љ",
	"&LT": "<",
	"&LT;": "<",
	"&Lacute;": "Ĺ",
	"&Lambda;": "Λ",
	"&Lang;": "⟪",
	"&Laplacetrf;": "ℒ",
	"&Larr;": "↞",
	"&Lcaron;": "Ľ",
	"&Lcedil;": "Ļ",
	"&Lcy;": "Л",
	"&LeftAngleBracket;": "⟨",
	"&LeftArrow;": "←",
	"&LeftArrowBar;": "⇤",
	"&LeftArrowRightArrow;": "⇆",
	"&LeftCeiling;": "⌈",
	"&LeftDoubleBracket;": "⟦",
	"&LeftDownTeeVector;": "⥡",
	"&LeftDownVector;": "⇃",
	"&LeftDownVectorBar;": "⥙",
	"&LeftFloor;": "⌊",
	"&LeftRightArrow;": "↔",
	"&LeftRightVector;": "⥎",
	"&LeftTee;": "⊣",
	"&LeftTeeArrow;": "↤",
	"&LeftTeeVector;": "⥚",
	"&LeftTriangle;": "⊲",
	"&LeftTriangleBar;": "⧏",
	"&LeftTriangleEqual;": "⊴",
	"&LeftUpDownVector;": "⥑",
	"&LeftUpTeeVector;": "⥠",
	"&LeftUpVector;": "↿",
	"&LeftUpVectorBar;": "⥘",
	"&LeftVector;": "↼",
	"&LeftVectorBar;": "⥒",
	"&Leftarrow;": "⇐",
	"&Leftrightarrow;": "⇔",
	"&LessEqualGreater;": "⋚",
	"&LessFullEqual;": "≦",
	"&LessGreater;": "≶",
	"&LessLess;": "⪡",
	"&LessSlantEqual;": "⩽",
	"&LessTilde;": "≲",
	"&Lfr;": "𝔏",
	"&Ll;": "⋘",
	"&Lleftarrow;": "⇚",
	"&Lmidot;": "Ŀ",
	"&LongLeftArrow;": "⟵",
	"&LongLeftRightArrow;": "⟷",
	"&LongRightArrow;": "⟶",
	"&Longleftarrow;": "⟸",
	"&Longleftrightarrow;": "⟺",
	"&Longrightarrow;": "⟹",
	"&Lopf;": "𝕃",
	"&LowerLeftArrow;": "↙",
	"&LowerRightArrow;": "↘",
	"&Lscr;": "ℒ",
	"&Lsh;": "↰",
	"&Lstrok;": "Ł",
	"&Lt;": "≪",
	"&Map;": "⤅",
	"&Mcy;": "М",
	"&MediumSpace;": " ",
	"&Mellintrf;": "ℳ",
	"&Mfr;": "𝔐",
	"&MinusPlus;": "∓",
	"&Mopf;": "𝕄",
	"&Mscr;": "ℳ",
	"&Mu;": "Μ",
	"&NJcy;": "Њ",
	"&Nacute;": "Ń",
	"&Ncaron;": "Ň",
	"&Ncedil;": "Ņ",
	"&Ncy;": "Н",
	"&NegativeMediumSpace;": "​",
	"&NegativeThickSpace;": "​",
	"&NegativeThinSpace;": "​",
	"&NegativeVeryThinSpace;": "​",
	"&NestedGreaterGreater;": "≫",
	"&NestedLessLess;": "≪",
	"&NewLine;": "\n",
	"&Nfr;": "𝔑",
	"&NoBreak;": "⁠",
	"&NonBreakingSpace;": "\xA0",
	"&Nopf;": "ℕ",
	"&Not;": "⫬",
	"&NotCongruent;": "≢",
	"&NotCupCap;": "≭",
	"&NotDoubleVerticalBar;": "∦",
	"&NotElement;": "∉",
	"&NotEqual;": "≠",
	"&NotEqualTilde;": "≂̸",
	"&NotExists;": "∄",
	"&NotGreater;": "≯",
	"&NotGreaterEqual;": "≱",
	"&NotGreaterFullEqual;": "≧̸",
	"&NotGreaterGreater;": "≫̸",
	"&NotGreaterLess;": "≹",
	"&NotGreaterSlantEqual;": "⩾̸",
	"&NotGreaterTilde;": "≵",
	"&NotHumpDownHump;": "≎̸",
	"&NotHumpEqual;": "≏̸",
	"&NotLeftTriangle;": "⋪",
	"&NotLeftTriangleBar;": "⧏̸",
	"&NotLeftTriangleEqual;": "⋬",
	"&NotLess;": "≮",
	"&NotLessEqual;": "≰",
	"&NotLessGreater;": "≸",
	"&NotLessLess;": "≪̸",
	"&NotLessSlantEqual;": "⩽̸",
	"&NotLessTilde;": "≴",
	"&NotNestedGreaterGreater;": "⪢̸",
	"&NotNestedLessLess;": "⪡̸",
	"&NotPrecedes;": "⊀",
	"&NotPrecedesEqual;": "⪯̸",
	"&NotPrecedesSlantEqual;": "⋠",
	"&NotReverseElement;": "∌",
	"&NotRightTriangle;": "⋫",
	"&NotRightTriangleBar;": "⧐̸",
	"&NotRightTriangleEqual;": "⋭",
	"&NotSquareSubset;": "⊏̸",
	"&NotSquareSubsetEqual;": "⋢",
	"&NotSquareSuperset;": "⊐̸",
	"&NotSquareSupersetEqual;": "⋣",
	"&NotSubset;": "⊂⃒",
	"&NotSubsetEqual;": "⊈",
	"&NotSucceeds;": "⊁",
	"&NotSucceedsEqual;": "⪰̸",
	"&NotSucceedsSlantEqual;": "⋡",
	"&NotSucceedsTilde;": "≿̸",
	"&NotSuperset;": "⊃⃒",
	"&NotSupersetEqual;": "⊉",
	"&NotTilde;": "≁",
	"&NotTildeEqual;": "≄",
	"&NotTildeFullEqual;": "≇",
	"&NotTildeTilde;": "≉",
	"&NotVerticalBar;": "∤",
	"&Nscr;": "𝒩",
	"&Ntilde": "Ñ",
	"&Ntilde;": "Ñ",
	"&Nu;": "Ν",
	"&OElig;": "Œ",
	"&Oacute": "Ó",
	"&Oacute;": "Ó",
	"&Ocirc": "Ô",
	"&Ocirc;": "Ô",
	"&Ocy;": "О",
	"&Odblac;": "Ő",
	"&Ofr;": "𝔒",
	"&Ograve": "Ò",
	"&Ograve;": "Ò",
	"&Omacr;": "Ō",
	"&Omega;": "Ω",
	"&Omicron;": "Ο",
	"&Oopf;": "𝕆",
	"&OpenCurlyDoubleQuote;": "“",
	"&OpenCurlyQuote;": "‘",
	"&Or;": "⩔",
	"&Oscr;": "𝒪",
	"&Oslash": "Ø",
	"&Oslash;": "Ø",
	"&Otilde": "Õ",
	"&Otilde;": "Õ",
	"&Otimes;": "⨷",
	"&Ouml": "Ö",
	"&Ouml;": "Ö",
	"&OverBar;": "‾",
	"&OverBrace;": "⏞",
	"&OverBracket;": "⎴",
	"&OverParenthesis;": "⏜",
	"&PartialD;": "∂",
	"&Pcy;": "П",
	"&Pfr;": "𝔓",
	"&Phi;": "Φ",
	"&Pi;": "Π",
	"&PlusMinus;": "±",
	"&Poincareplane;": "ℌ",
	"&Popf;": "ℙ",
	"&Pr;": "⪻",
	"&Precedes;": "≺",
	"&PrecedesEqual;": "⪯",
	"&PrecedesSlantEqual;": "≼",
	"&PrecedesTilde;": "≾",
	"&Prime;": "″",
	"&Product;": "∏",
	"&Proportion;": "∷",
	"&Proportional;": "∝",
	"&Pscr;": "𝒫",
	"&Psi;": "Ψ",
	"&QUOT": "\"",
	"&QUOT;": "\"",
	"&Qfr;": "𝔔",
	"&Qopf;": "ℚ",
	"&Qscr;": "𝒬",
	"&RBarr;": "⤐",
	"&REG": "®",
	"&REG;": "®",
	"&Racute;": "Ŕ",
	"&Rang;": "⟫",
	"&Rarr;": "↠",
	"&Rarrtl;": "⤖",
	"&Rcaron;": "Ř",
	"&Rcedil;": "Ŗ",
	"&Rcy;": "Р",
	"&Re;": "ℜ",
	"&ReverseElement;": "∋",
	"&ReverseEquilibrium;": "⇋",
	"&ReverseUpEquilibrium;": "⥯",
	"&Rfr;": "ℜ",
	"&Rho;": "Ρ",
	"&RightAngleBracket;": "⟩",
	"&RightArrow;": "→",
	"&RightArrowBar;": "⇥",
	"&RightArrowLeftArrow;": "⇄",
	"&RightCeiling;": "⌉",
	"&RightDoubleBracket;": "⟧",
	"&RightDownTeeVector;": "⥝",
	"&RightDownVector;": "⇂",
	"&RightDownVectorBar;": "⥕",
	"&RightFloor;": "⌋",
	"&RightTee;": "⊢",
	"&RightTeeArrow;": "↦",
	"&RightTeeVector;": "⥛",
	"&RightTriangle;": "⊳",
	"&RightTriangleBar;": "⧐",
	"&RightTriangleEqual;": "⊵",
	"&RightUpDownVector;": "⥏",
	"&RightUpTeeVector;": "⥜",
	"&RightUpVector;": "↾",
	"&RightUpVectorBar;": "⥔",
	"&RightVector;": "⇀",
	"&RightVectorBar;": "⥓",
	"&Rightarrow;": "⇒",
	"&Ropf;": "ℝ",
	"&RoundImplies;": "⥰",
	"&Rrightarrow;": "⇛",
	"&Rscr;": "ℛ",
	"&Rsh;": "↱",
	"&RuleDelayed;": "⧴",
	"&SHCHcy;": "Щ",
	"&SHcy;": "Ш",
	"&SOFTcy;": "Ь",
	"&Sacute;": "Ś",
	"&Sc;": "⪼",
	"&Scaron;": "Š",
	"&Scedil;": "Ş",
	"&Scirc;": "Ŝ",
	"&Scy;": "С",
	"&Sfr;": "𝔖",
	"&ShortDownArrow;": "↓",
	"&ShortLeftArrow;": "←",
	"&ShortRightArrow;": "→",
	"&ShortUpArrow;": "↑",
	"&Sigma;": "Σ",
	"&SmallCircle;": "∘",
	"&Sopf;": "𝕊",
	"&Sqrt;": "√",
	"&Square;": "□",
	"&SquareIntersection;": "⊓",
	"&SquareSubset;": "⊏",
	"&SquareSubsetEqual;": "⊑",
	"&SquareSuperset;": "⊐",
	"&SquareSupersetEqual;": "⊒",
	"&SquareUnion;": "⊔",
	"&Sscr;": "𝒮",
	"&Star;": "⋆",
	"&Sub;": "⋐",
	"&Subset;": "⋐",
	"&SubsetEqual;": "⊆",
	"&Succeeds;": "≻",
	"&SucceedsEqual;": "⪰",
	"&SucceedsSlantEqual;": "≽",
	"&SucceedsTilde;": "≿",
	"&SuchThat;": "∋",
	"&Sum;": "∑",
	"&Sup;": "⋑",
	"&Superset;": "⊃",
	"&SupersetEqual;": "⊇",
	"&Supset;": "⋑",
	"&THORN": "Þ",
	"&THORN;": "Þ",
	"&TRADE;": "™",
	"&TSHcy;": "Ћ",
	"&TScy;": "Ц",
	"&Tab;": "	",
	"&Tau;": "Τ",
	"&Tcaron;": "Ť",
	"&Tcedil;": "Ţ",
	"&Tcy;": "Т",
	"&Tfr;": "𝔗",
	"&Therefore;": "∴",
	"&Theta;": "Θ",
	"&ThickSpace;": "  ",
	"&ThinSpace;": " ",
	"&Tilde;": "∼",
	"&TildeEqual;": "≃",
	"&TildeFullEqual;": "≅",
	"&TildeTilde;": "≈",
	"&Topf;": "𝕋",
	"&TripleDot;": "⃛",
	"&Tscr;": "𝒯",
	"&Tstrok;": "Ŧ",
	"&Uacute": "Ú",
	"&Uacute;": "Ú",
	"&Uarr;": "↟",
	"&Uarrocir;": "⥉",
	"&Ubrcy;": "Ў",
	"&Ubreve;": "Ŭ",
	"&Ucirc": "Û",
	"&Ucirc;": "Û",
	"&Ucy;": "У",
	"&Udblac;": "Ű",
	"&Ufr;": "𝔘",
	"&Ugrave": "Ù",
	"&Ugrave;": "Ù",
	"&Umacr;": "Ū",
	"&UnderBar;": "_",
	"&UnderBrace;": "⏟",
	"&UnderBracket;": "⎵",
	"&UnderParenthesis;": "⏝",
	"&Union;": "⋃",
	"&UnionPlus;": "⊎",
	"&Uogon;": "Ų",
	"&Uopf;": "𝕌",
	"&UpArrow;": "↑",
	"&UpArrowBar;": "⤒",
	"&UpArrowDownArrow;": "⇅",
	"&UpDownArrow;": "↕",
	"&UpEquilibrium;": "⥮",
	"&UpTee;": "⊥",
	"&UpTeeArrow;": "↥",
	"&Uparrow;": "⇑",
	"&Updownarrow;": "⇕",
	"&UpperLeftArrow;": "↖",
	"&UpperRightArrow;": "↗",
	"&Upsi;": "ϒ",
	"&Upsilon;": "Υ",
	"&Uring;": "Ů",
	"&Uscr;": "𝒰",
	"&Utilde;": "Ũ",
	"&Uuml": "Ü",
	"&Uuml;": "Ü",
	"&VDash;": "⊫",
	"&Vbar;": "⫫",
	"&Vcy;": "В",
	"&Vdash;": "⊩",
	"&Vdashl;": "⫦",
	"&Vee;": "⋁",
	"&Verbar;": "‖",
	"&Vert;": "‖",
	"&VerticalBar;": "∣",
	"&VerticalLine;": "|",
	"&VerticalSeparator;": "❘",
	"&VerticalTilde;": "≀",
	"&VeryThinSpace;": " ",
	"&Vfr;": "𝔙",
	"&Vopf;": "𝕍",
	"&Vscr;": "𝒱",
	"&Vvdash;": "⊪",
	"&Wcirc;": "Ŵ",
	"&Wedge;": "⋀",
	"&Wfr;": "𝔚",
	"&Wopf;": "𝕎",
	"&Wscr;": "𝒲",
	"&Xfr;": "𝔛",
	"&Xi;": "Ξ",
	"&Xopf;": "𝕏",
	"&Xscr;": "𝒳",
	"&YAcy;": "Я",
	"&YIcy;": "Ї",
	"&YUcy;": "Ю",
	"&Yacute": "Ý",
	"&Yacute;": "Ý",
	"&Ycirc;": "Ŷ",
	"&Ycy;": "Ы",
	"&Yfr;": "𝔜",
	"&Yopf;": "𝕐",
	"&Yscr;": "𝒴",
	"&Yuml;": "Ÿ",
	"&ZHcy;": "Ж",
	"&Zacute;": "Ź",
	"&Zcaron;": "Ž",
	"&Zcy;": "З",
	"&Zdot;": "Ż",
	"&ZeroWidthSpace;": "​",
	"&Zeta;": "Ζ",
	"&Zfr;": "ℨ",
	"&Zopf;": "ℤ",
	"&Zscr;": "𝒵",
	"&aacute": "á",
	"&aacute;": "á",
	"&abreve;": "ă",
	"&ac;": "∾",
	"&acE;": "∾̳",
	"&acd;": "∿",
	"&acirc": "â",
	"&acirc;": "â",
	"&acute": "´",
	"&acute;": "´",
	"&acy;": "а",
	"&aelig": "æ",
	"&aelig;": "æ",
	"&af;": "⁡",
	"&afr;": "𝔞",
	"&agrave": "à",
	"&agrave;": "à",
	"&alefsym;": "ℵ",
	"&aleph;": "ℵ",
	"&alpha;": "α",
	"&amacr;": "ā",
	"&amalg;": "⨿",
	"&amp": "&",
	"&amp;": "&",
	"&and;": "∧",
	"&andand;": "⩕",
	"&andd;": "⩜",
	"&andslope;": "⩘",
	"&andv;": "⩚",
	"&ang;": "∠",
	"&ange;": "⦤",
	"&angle;": "∠",
	"&angmsd;": "∡",
	"&angmsdaa;": "⦨",
	"&angmsdab;": "⦩",
	"&angmsdac;": "⦪",
	"&angmsdad;": "⦫",
	"&angmsdae;": "⦬",
	"&angmsdaf;": "⦭",
	"&angmsdag;": "⦮",
	"&angmsdah;": "⦯",
	"&angrt;": "∟",
	"&angrtvb;": "⊾",
	"&angrtvbd;": "⦝",
	"&angsph;": "∢",
	"&angst;": "Å",
	"&angzarr;": "⍼",
	"&aogon;": "ą",
	"&aopf;": "𝕒",
	"&ap;": "≈",
	"&apE;": "⩰",
	"&apacir;": "⩯",
	"&ape;": "≊",
	"&apid;": "≋",
	"&apos;": "'",
	"&approx;": "≈",
	"&approxeq;": "≊",
	"&aring": "å",
	"&aring;": "å",
	"&ascr;": "𝒶",
	"&ast;": "*",
	"&asymp;": "≈",
	"&asympeq;": "≍",
	"&atilde": "ã",
	"&atilde;": "ã",
	"&auml": "ä",
	"&auml;": "ä",
	"&awconint;": "∳",
	"&awint;": "⨑",
	"&bNot;": "⫭",
	"&backcong;": "≌",
	"&backepsilon;": "϶",
	"&backprime;": "‵",
	"&backsim;": "∽",
	"&backsimeq;": "⋍",
	"&barvee;": "⊽",
	"&barwed;": "⌅",
	"&barwedge;": "⌅",
	"&bbrk;": "⎵",
	"&bbrktbrk;": "⎶",
	"&bcong;": "≌",
	"&bcy;": "б",
	"&bdquo;": "„",
	"&becaus;": "∵",
	"&because;": "∵",
	"&bemptyv;": "⦰",
	"&bepsi;": "϶",
	"&bernou;": "ℬ",
	"&beta;": "β",
	"&beth;": "ℶ",
	"&between;": "≬",
	"&bfr;": "𝔟",
	"&bigcap;": "⋂",
	"&bigcirc;": "◯",
	"&bigcup;": "⋃",
	"&bigodot;": "⨀",
	"&bigoplus;": "⨁",
	"&bigotimes;": "⨂",
	"&bigsqcup;": "⨆",
	"&bigstar;": "★",
	"&bigtriangledown;": "▽",
	"&bigtriangleup;": "△",
	"&biguplus;": "⨄",
	"&bigvee;": "⋁",
	"&bigwedge;": "⋀",
	"&bkarow;": "⤍",
	"&blacklozenge;": "⧫",
	"&blacksquare;": "▪",
	"&blacktriangle;": "▴",
	"&blacktriangledown;": "▾",
	"&blacktriangleleft;": "◂",
	"&blacktriangleright;": "▸",
	"&blank;": "␣",
	"&blk12;": "▒",
	"&blk14;": "░",
	"&blk34;": "▓",
	"&block;": "█",
	"&bne;": "=⃥",
	"&bnequiv;": "≡⃥",
	"&bnot;": "⌐",
	"&bopf;": "𝕓",
	"&bot;": "⊥",
	"&bottom;": "⊥",
	"&bowtie;": "⋈",
	"&boxDL;": "╗",
	"&boxDR;": "╔",
	"&boxDl;": "╖",
	"&boxDr;": "╓",
	"&boxH;": "═",
	"&boxHD;": "╦",
	"&boxHU;": "╩",
	"&boxHd;": "╤",
	"&boxHu;": "╧",
	"&boxUL;": "╝",
	"&boxUR;": "╚",
	"&boxUl;": "╜",
	"&boxUr;": "╙",
	"&boxV;": "║",
	"&boxVH;": "╬",
	"&boxVL;": "╣",
	"&boxVR;": "╠",
	"&boxVh;": "╫",
	"&boxVl;": "╢",
	"&boxVr;": "╟",
	"&boxbox;": "⧉",
	"&boxdL;": "╕",
	"&boxdR;": "╒",
	"&boxdl;": "┐",
	"&boxdr;": "┌",
	"&boxh;": "─",
	"&boxhD;": "╥",
	"&boxhU;": "╨",
	"&boxhd;": "┬",
	"&boxhu;": "┴",
	"&boxminus;": "⊟",
	"&boxplus;": "⊞",
	"&boxtimes;": "⊠",
	"&boxuL;": "╛",
	"&boxuR;": "╘",
	"&boxul;": "┘",
	"&boxur;": "└",
	"&boxv;": "│",
	"&boxvH;": "╪",
	"&boxvL;": "╡",
	"&boxvR;": "╞",
	"&boxvh;": "┼",
	"&boxvl;": "┤",
	"&boxvr;": "├",
	"&bprime;": "‵",
	"&breve;": "˘",
	"&brvbar": "¦",
	"&brvbar;": "¦",
	"&bscr;": "𝒷",
	"&bsemi;": "⁏",
	"&bsim;": "∽",
	"&bsime;": "⋍",
	"&bsol;": "\\",
	"&bsolb;": "⧅",
	"&bsolhsub;": "⟈",
	"&bull;": "•",
	"&bullet;": "•",
	"&bump;": "≎",
	"&bumpE;": "⪮",
	"&bumpe;": "≏",
	"&bumpeq;": "≏",
	"&cacute;": "ć",
	"&cap;": "∩",
	"&capand;": "⩄",
	"&capbrcup;": "⩉",
	"&capcap;": "⩋",
	"&capcup;": "⩇",
	"&capdot;": "⩀",
	"&caps;": "∩︀",
	"&caret;": "⁁",
	"&caron;": "ˇ",
	"&ccaps;": "⩍",
	"&ccaron;": "č",
	"&ccedil": "ç",
	"&ccedil;": "ç",
	"&ccirc;": "ĉ",
	"&ccups;": "⩌",
	"&ccupssm;": "⩐",
	"&cdot;": "ċ",
	"&cedil": "¸",
	"&cedil;": "¸",
	"&cemptyv;": "⦲",
	"&cent": "¢",
	"&cent;": "¢",
	"&centerdot;": "·",
	"&cfr;": "𝔠",
	"&chcy;": "ч",
	"&check;": "✓",
	"&checkmark;": "✓",
	"&chi;": "χ",
	"&cir;": "○",
	"&cirE;": "⧃",
	"&circ;": "ˆ",
	"&circeq;": "≗",
	"&circlearrowleft;": "↺",
	"&circlearrowright;": "↻",
	"&circledR;": "®",
	"&circledS;": "Ⓢ",
	"&circledast;": "⊛",
	"&circledcirc;": "⊚",
	"&circleddash;": "⊝",
	"&cire;": "≗",
	"&cirfnint;": "⨐",
	"&cirmid;": "⫯",
	"&cirscir;": "⧂",
	"&clubs;": "♣",
	"&clubsuit;": "♣",
	"&colon;": ":",
	"&colone;": "≔",
	"&coloneq;": "≔",
	"&comma;": ",",
	"&commat;": "@",
	"&comp;": "∁",
	"&compfn;": "∘",
	"&complement;": "∁",
	"&complexes;": "ℂ",
	"&cong;": "≅",
	"&congdot;": "⩭",
	"&conint;": "∮",
	"&copf;": "𝕔",
	"&coprod;": "∐",
	"&copy": "©",
	"&copy;": "©",
	"&copysr;": "℗",
	"&crarr;": "↵",
	"&cross;": "✗",
	"&cscr;": "𝒸",
	"&csub;": "⫏",
	"&csube;": "⫑",
	"&csup;": "⫐",
	"&csupe;": "⫒",
	"&ctdot;": "⋯",
	"&cudarrl;": "⤸",
	"&cudarrr;": "⤵",
	"&cuepr;": "⋞",
	"&cuesc;": "⋟",
	"&cularr;": "↶",
	"&cularrp;": "⤽",
	"&cup;": "∪",
	"&cupbrcap;": "⩈",
	"&cupcap;": "⩆",
	"&cupcup;": "⩊",
	"&cupdot;": "⊍",
	"&cupor;": "⩅",
	"&cups;": "∪︀",
	"&curarr;": "↷",
	"&curarrm;": "⤼",
	"&curlyeqprec;": "⋞",
	"&curlyeqsucc;": "⋟",
	"&curlyvee;": "⋎",
	"&curlywedge;": "⋏",
	"&curren": "¤",
	"&curren;": "¤",
	"&curvearrowleft;": "↶",
	"&curvearrowright;": "↷",
	"&cuvee;": "⋎",
	"&cuwed;": "⋏",
	"&cwconint;": "∲",
	"&cwint;": "∱",
	"&cylcty;": "⌭",
	"&dArr;": "⇓",
	"&dHar;": "⥥",
	"&dagger;": "†",
	"&daleth;": "ℸ",
	"&darr;": "↓",
	"&dash;": "‐",
	"&dashv;": "⊣",
	"&dbkarow;": "⤏",
	"&dblac;": "˝",
	"&dcaron;": "ď",
	"&dcy;": "д",
	"&dd;": "ⅆ",
	"&ddagger;": "‡",
	"&ddarr;": "⇊",
	"&ddotseq;": "⩷",
	"&deg": "°",
	"&deg;": "°",
	"&delta;": "δ",
	"&demptyv;": "⦱",
	"&dfisht;": "⥿",
	"&dfr;": "𝔡",
	"&dharl;": "⇃",
	"&dharr;": "⇂",
	"&diam;": "⋄",
	"&diamond;": "⋄",
	"&diamondsuit;": "♦",
	"&diams;": "♦",
	"&die;": "¨",
	"&digamma;": "ϝ",
	"&disin;": "⋲",
	"&div;": "÷",
	"&divide": "÷",
	"&divide;": "÷",
	"&divideontimes;": "⋇",
	"&divonx;": "⋇",
	"&djcy;": "ђ",
	"&dlcorn;": "⌞",
	"&dlcrop;": "⌍",
	"&dollar;": "$",
	"&dopf;": "𝕕",
	"&dot;": "˙",
	"&doteq;": "≐",
	"&doteqdot;": "≑",
	"&dotminus;": "∸",
	"&dotplus;": "∔",
	"&dotsquare;": "⊡",
	"&doublebarwedge;": "⌆",
	"&downarrow;": "↓",
	"&downdownarrows;": "⇊",
	"&downharpoonleft;": "⇃",
	"&downharpoonright;": "⇂",
	"&drbkarow;": "⤐",
	"&drcorn;": "⌟",
	"&drcrop;": "⌌",
	"&dscr;": "𝒹",
	"&dscy;": "ѕ",
	"&dsol;": "⧶",
	"&dstrok;": "đ",
	"&dtdot;": "⋱",
	"&dtri;": "▿",
	"&dtrif;": "▾",
	"&duarr;": "⇵",
	"&duhar;": "⥯",
	"&dwangle;": "⦦",
	"&dzcy;": "џ",
	"&dzigrarr;": "⟿",
	"&eDDot;": "⩷",
	"&eDot;": "≑",
	"&eacute": "é",
	"&eacute;": "é",
	"&easter;": "⩮",
	"&ecaron;": "ě",
	"&ecir;": "≖",
	"&ecirc": "ê",
	"&ecirc;": "ê",
	"&ecolon;": "≕",
	"&ecy;": "э",
	"&edot;": "ė",
	"&ee;": "ⅇ",
	"&efDot;": "≒",
	"&efr;": "𝔢",
	"&eg;": "⪚",
	"&egrave": "è",
	"&egrave;": "è",
	"&egs;": "⪖",
	"&egsdot;": "⪘",
	"&el;": "⪙",
	"&elinters;": "⏧",
	"&ell;": "ℓ",
	"&els;": "⪕",
	"&elsdot;": "⪗",
	"&emacr;": "ē",
	"&empty;": "∅",
	"&emptyset;": "∅",
	"&emptyv;": "∅",
	"&emsp13;": " ",
	"&emsp14;": " ",
	"&emsp;": " ",
	"&eng;": "ŋ",
	"&ensp;": " ",
	"&eogon;": "ę",
	"&eopf;": "𝕖",
	"&epar;": "⋕",
	"&eparsl;": "⧣",
	"&eplus;": "⩱",
	"&epsi;": "ε",
	"&epsilon;": "ε",
	"&epsiv;": "ϵ",
	"&eqcirc;": "≖",
	"&eqcolon;": "≕",
	"&eqsim;": "≂",
	"&eqslantgtr;": "⪖",
	"&eqslantless;": "⪕",
	"&equals;": "=",
	"&equest;": "≟",
	"&equiv;": "≡",
	"&equivDD;": "⩸",
	"&eqvparsl;": "⧥",
	"&erDot;": "≓",
	"&erarr;": "⥱",
	"&escr;": "ℯ",
	"&esdot;": "≐",
	"&esim;": "≂",
	"&eta;": "η",
	"&eth": "ð",
	"&eth;": "ð",
	"&euml": "ë",
	"&euml;": "ë",
	"&euro;": "€",
	"&excl;": "!",
	"&exist;": "∃",
	"&expectation;": "ℰ",
	"&exponentiale;": "ⅇ",
	"&fallingdotseq;": "≒",
	"&fcy;": "ф",
	"&female;": "♀",
	"&ffilig;": "ﬃ",
	"&fflig;": "ﬀ",
	"&ffllig;": "ﬄ",
	"&ffr;": "𝔣",
	"&filig;": "ﬁ",
	"&fjlig;": "fj",
	"&flat;": "♭",
	"&fllig;": "ﬂ",
	"&fltns;": "▱",
	"&fnof;": "ƒ",
	"&fopf;": "𝕗",
	"&forall;": "∀",
	"&fork;": "⋔",
	"&forkv;": "⫙",
	"&fpartint;": "⨍",
	"&frac12": "½",
	"&frac12;": "½",
	"&frac13;": "⅓",
	"&frac14": "¼",
	"&frac14;": "¼",
	"&frac15;": "⅕",
	"&frac16;": "⅙",
	"&frac18;": "⅛",
	"&frac23;": "⅔",
	"&frac25;": "⅖",
	"&frac34": "¾",
	"&frac34;": "¾",
	"&frac35;": "⅗",
	"&frac38;": "⅜",
	"&frac45;": "⅘",
	"&frac56;": "⅚",
	"&frac58;": "⅝",
	"&frac78;": "⅞",
	"&frasl;": "⁄",
	"&frown;": "⌢",
	"&fscr;": "𝒻",
	"&gE;": "≧",
	"&gEl;": "⪌",
	"&gacute;": "ǵ",
	"&gamma;": "γ",
	"&gammad;": "ϝ",
	"&gap;": "⪆",
	"&gbreve;": "ğ",
	"&gcirc;": "ĝ",
	"&gcy;": "г",
	"&gdot;": "ġ",
	"&ge;": "≥",
	"&gel;": "⋛",
	"&geq;": "≥",
	"&geqq;": "≧",
	"&geqslant;": "⩾",
	"&ges;": "⩾",
	"&gescc;": "⪩",
	"&gesdot;": "⪀",
	"&gesdoto;": "⪂",
	"&gesdotol;": "⪄",
	"&gesl;": "⋛︀",
	"&gesles;": "⪔",
	"&gfr;": "𝔤",
	"&gg;": "≫",
	"&ggg;": "⋙",
	"&gimel;": "ℷ",
	"&gjcy;": "ѓ",
	"&gl;": "≷",
	"&glE;": "⪒",
	"&gla;": "⪥",
	"&glj;": "⪤",
	"&gnE;": "≩",
	"&gnap;": "⪊",
	"&gnapprox;": "⪊",
	"&gne;": "⪈",
	"&gneq;": "⪈",
	"&gneqq;": "≩",
	"&gnsim;": "⋧",
	"&gopf;": "𝕘",
	"&grave;": "`",
	"&gscr;": "ℊ",
	"&gsim;": "≳",
	"&gsime;": "⪎",
	"&gsiml;": "⪐",
	"&gt": ">",
	"&gt;": ">",
	"&gtcc;": "⪧",
	"&gtcir;": "⩺",
	"&gtdot;": "⋗",
	"&gtlPar;": "⦕",
	"&gtquest;": "⩼",
	"&gtrapprox;": "⪆",
	"&gtrarr;": "⥸",
	"&gtrdot;": "⋗",
	"&gtreqless;": "⋛",
	"&gtreqqless;": "⪌",
	"&gtrless;": "≷",
	"&gtrsim;": "≳",
	"&gvertneqq;": "≩︀",
	"&gvnE;": "≩︀",
	"&hArr;": "⇔",
	"&hairsp;": " ",
	"&half;": "½",
	"&hamilt;": "ℋ",
	"&hardcy;": "ъ",
	"&harr;": "↔",
	"&harrcir;": "⥈",
	"&harrw;": "↭",
	"&hbar;": "ℏ",
	"&hcirc;": "ĥ",
	"&hearts;": "♥",
	"&heartsuit;": "♥",
	"&hellip;": "…",
	"&hercon;": "⊹",
	"&hfr;": "𝔥",
	"&hksearow;": "⤥",
	"&hkswarow;": "⤦",
	"&hoarr;": "⇿",
	"&homtht;": "∻",
	"&hookleftarrow;": "↩",
	"&hookrightarrow;": "↪",
	"&hopf;": "𝕙",
	"&horbar;": "―",
	"&hscr;": "𝒽",
	"&hslash;": "ℏ",
	"&hstrok;": "ħ",
	"&hybull;": "⁃",
	"&hyphen;": "‐",
	"&iacute": "í",
	"&iacute;": "í",
	"&ic;": "⁣",
	"&icirc": "î",
	"&icirc;": "î",
	"&icy;": "и",
	"&iecy;": "е",
	"&iexcl": "¡",
	"&iexcl;": "¡",
	"&iff;": "⇔",
	"&ifr;": "𝔦",
	"&igrave": "ì",
	"&igrave;": "ì",
	"&ii;": "ⅈ",
	"&iiiint;": "⨌",
	"&iiint;": "∭",
	"&iinfin;": "⧜",
	"&iiota;": "℩",
	"&ijlig;": "ĳ",
	"&imacr;": "ī",
	"&image;": "ℑ",
	"&imagline;": "ℐ",
	"&imagpart;": "ℑ",
	"&imath;": "ı",
	"&imof;": "⊷",
	"&imped;": "Ƶ",
	"&in;": "∈",
	"&incare;": "℅",
	"&infin;": "∞",
	"&infintie;": "⧝",
	"&inodot;": "ı",
	"&int;": "∫",
	"&intcal;": "⊺",
	"&integers;": "ℤ",
	"&intercal;": "⊺",
	"&intlarhk;": "⨗",
	"&intprod;": "⨼",
	"&iocy;": "ё",
	"&iogon;": "į",
	"&iopf;": "𝕚",
	"&iota;": "ι",
	"&iprod;": "⨼",
	"&iquest": "¿",
	"&iquest;": "¿",
	"&iscr;": "𝒾",
	"&isin;": "∈",
	"&isinE;": "⋹",
	"&isindot;": "⋵",
	"&isins;": "⋴",
	"&isinsv;": "⋳",
	"&isinv;": "∈",
	"&it;": "⁢",
	"&itilde;": "ĩ",
	"&iukcy;": "і",
	"&iuml": "ï",
	"&iuml;": "ï",
	"&jcirc;": "ĵ",
	"&jcy;": "й",
	"&jfr;": "𝔧",
	"&jmath;": "ȷ",
	"&jopf;": "𝕛",
	"&jscr;": "𝒿",
	"&jsercy;": "ј",
	"&jukcy;": "є",
	"&kappa;": "κ",
	"&kappav;": "ϰ",
	"&kcedil;": "ķ",
	"&kcy;": "к",
	"&kfr;": "𝔨",
	"&kgreen;": "ĸ",
	"&khcy;": "х",
	"&kjcy;": "ќ",
	"&kopf;": "𝕜",
	"&kscr;": "𝓀",
	"&lAarr;": "⇚",
	"&lArr;": "⇐",
	"&lAtail;": "⤛",
	"&lBarr;": "⤎",
	"&lE;": "≦",
	"&lEg;": "⪋",
	"&lHar;": "⥢",
	"&lacute;": "ĺ",
	"&laemptyv;": "⦴",
	"&lagran;": "ℒ",
	"&lambda;": "λ",
	"&lang;": "⟨",
	"&langd;": "⦑",
	"&langle;": "⟨",
	"&lap;": "⪅",
	"&laquo": "«",
	"&laquo;": "«",
	"&larr;": "←",
	"&larrb;": "⇤",
	"&larrbfs;": "⤟",
	"&larrfs;": "⤝",
	"&larrhk;": "↩",
	"&larrlp;": "↫",
	"&larrpl;": "⤹",
	"&larrsim;": "⥳",
	"&larrtl;": "↢",
	"&lat;": "⪫",
	"&latail;": "⤙",
	"&late;": "⪭",
	"&lates;": "⪭︀",
	"&lbarr;": "⤌",
	"&lbbrk;": "❲",
	"&lbrace;": "{",
	"&lbrack;": "[",
	"&lbrke;": "⦋",
	"&lbrksld;": "⦏",
	"&lbrkslu;": "⦍",
	"&lcaron;": "ľ",
	"&lcedil;": "ļ",
	"&lceil;": "⌈",
	"&lcub;": "{",
	"&lcy;": "л",
	"&ldca;": "⤶",
	"&ldquo;": "“",
	"&ldquor;": "„",
	"&ldrdhar;": "⥧",
	"&ldrushar;": "⥋",
	"&ldsh;": "↲",
	"&le;": "≤",
	"&leftarrow;": "←",
	"&leftarrowtail;": "↢",
	"&leftharpoondown;": "↽",
	"&leftharpoonup;": "↼",
	"&leftleftarrows;": "⇇",
	"&leftrightarrow;": "↔",
	"&leftrightarrows;": "⇆",
	"&leftrightharpoons;": "⇋",
	"&leftrightsquigarrow;": "↭",
	"&leftthreetimes;": "⋋",
	"&leg;": "⋚",
	"&leq;": "≤",
	"&leqq;": "≦",
	"&leqslant;": "⩽",
	"&les;": "⩽",
	"&lescc;": "⪨",
	"&lesdot;": "⩿",
	"&lesdoto;": "⪁",
	"&lesdotor;": "⪃",
	"&lesg;": "⋚︀",
	"&lesges;": "⪓",
	"&lessapprox;": "⪅",
	"&lessdot;": "⋖",
	"&lesseqgtr;": "⋚",
	"&lesseqqgtr;": "⪋",
	"&lessgtr;": "≶",
	"&lesssim;": "≲",
	"&lfisht;": "⥼",
	"&lfloor;": "⌊",
	"&lfr;": "𝔩",
	"&lg;": "≶",
	"&lgE;": "⪑",
	"&lhard;": "↽",
	"&lharu;": "↼",
	"&lharul;": "⥪",
	"&lhblk;": "▄",
	"&ljcy;": "љ",
	"&ll;": "≪",
	"&llarr;": "⇇",
	"&llcorner;": "⌞",
	"&llhard;": "⥫",
	"&lltri;": "◺",
	"&lmidot;": "ŀ",
	"&lmoust;": "⎰",
	"&lmoustache;": "⎰",
	"&lnE;": "≨",
	"&lnap;": "⪉",
	"&lnapprox;": "⪉",
	"&lne;": "⪇",
	"&lneq;": "⪇",
	"&lneqq;": "≨",
	"&lnsim;": "⋦",
	"&loang;": "⟬",
	"&loarr;": "⇽",
	"&lobrk;": "⟦",
	"&longleftarrow;": "⟵",
	"&longleftrightarrow;": "⟷",
	"&longmapsto;": "⟼",
	"&longrightarrow;": "⟶",
	"&looparrowleft;": "↫",
	"&looparrowright;": "↬",
	"&lopar;": "⦅",
	"&lopf;": "𝕝",
	"&loplus;": "⨭",
	"&lotimes;": "⨴",
	"&lowast;": "∗",
	"&lowbar;": "_",
	"&loz;": "◊",
	"&lozenge;": "◊",
	"&lozf;": "⧫",
	"&lpar;": "(",
	"&lparlt;": "⦓",
	"&lrarr;": "⇆",
	"&lrcorner;": "⌟",
	"&lrhar;": "⇋",
	"&lrhard;": "⥭",
	"&lrm;": "‎",
	"&lrtri;": "⊿",
	"&lsaquo;": "‹",
	"&lscr;": "𝓁",
	"&lsh;": "↰",
	"&lsim;": "≲",
	"&lsime;": "⪍",
	"&lsimg;": "⪏",
	"&lsqb;": "[",
	"&lsquo;": "‘",
	"&lsquor;": "‚",
	"&lstrok;": "ł",
	"&lt": "<",
	"&lt;": "<",
	"&ltcc;": "⪦",
	"&ltcir;": "⩹",
	"&ltdot;": "⋖",
	"&lthree;": "⋋",
	"&ltimes;": "⋉",
	"&ltlarr;": "⥶",
	"&ltquest;": "⩻",
	"&ltrPar;": "⦖",
	"&ltri;": "◃",
	"&ltrie;": "⊴",
	"&ltrif;": "◂",
	"&lurdshar;": "⥊",
	"&luruhar;": "⥦",
	"&lvertneqq;": "≨︀",
	"&lvnE;": "≨︀",
	"&mDDot;": "∺",
	"&macr": "¯",
	"&macr;": "¯",
	"&male;": "♂",
	"&malt;": "✠",
	"&maltese;": "✠",
	"&map;": "↦",
	"&mapsto;": "↦",
	"&mapstodown;": "↧",
	"&mapstoleft;": "↤",
	"&mapstoup;": "↥",
	"&marker;": "▮",
	"&mcomma;": "⨩",
	"&mcy;": "м",
	"&mdash;": "—",
	"&measuredangle;": "∡",
	"&mfr;": "𝔪",
	"&mho;": "℧",
	"&micro": "µ",
	"&micro;": "µ",
	"&mid;": "∣",
	"&midast;": "*",
	"&midcir;": "⫰",
	"&middot": "·",
	"&middot;": "·",
	"&minus;": "−",
	"&minusb;": "⊟",
	"&minusd;": "∸",
	"&minusdu;": "⨪",
	"&mlcp;": "⫛",
	"&mldr;": "…",
	"&mnplus;": "∓",
	"&models;": "⊧",
	"&mopf;": "𝕞",
	"&mp;": "∓",
	"&mscr;": "𝓂",
	"&mstpos;": "∾",
	"&mu;": "μ",
	"&multimap;": "⊸",
	"&mumap;": "⊸",
	"&nGg;": "⋙̸",
	"&nGt;": "≫⃒",
	"&nGtv;": "≫̸",
	"&nLeftarrow;": "⇍",
	"&nLeftrightarrow;": "⇎",
	"&nLl;": "⋘̸",
	"&nLt;": "≪⃒",
	"&nLtv;": "≪̸",
	"&nRightarrow;": "⇏",
	"&nVDash;": "⊯",
	"&nVdash;": "⊮",
	"&nabla;": "∇",
	"&nacute;": "ń",
	"&nang;": "∠⃒",
	"&nap;": "≉",
	"&napE;": "⩰̸",
	"&napid;": "≋̸",
	"&napos;": "ŉ",
	"&napprox;": "≉",
	"&natur;": "♮",
	"&natural;": "♮",
	"&naturals;": "ℕ",
	"&nbsp": "\xA0",
	"&nbsp;": "\xA0",
	"&nbump;": "≎̸",
	"&nbumpe;": "≏̸",
	"&ncap;": "⩃",
	"&ncaron;": "ň",
	"&ncedil;": "ņ",
	"&ncong;": "≇",
	"&ncongdot;": "⩭̸",
	"&ncup;": "⩂",
	"&ncy;": "н",
	"&ndash;": "–",
	"&ne;": "≠",
	"&neArr;": "⇗",
	"&nearhk;": "⤤",
	"&nearr;": "↗",
	"&nearrow;": "↗",
	"&nedot;": "≐̸",
	"&nequiv;": "≢",
	"&nesear;": "⤨",
	"&nesim;": "≂̸",
	"&nexist;": "∄",
	"&nexists;": "∄",
	"&nfr;": "𝔫",
	"&ngE;": "≧̸",
	"&nge;": "≱",
	"&ngeq;": "≱",
	"&ngeqq;": "≧̸",
	"&ngeqslant;": "⩾̸",
	"&nges;": "⩾̸",
	"&ngsim;": "≵",
	"&ngt;": "≯",
	"&ngtr;": "≯",
	"&nhArr;": "⇎",
	"&nharr;": "↮",
	"&nhpar;": "⫲",
	"&ni;": "∋",
	"&nis;": "⋼",
	"&nisd;": "⋺",
	"&niv;": "∋",
	"&njcy;": "њ",
	"&nlArr;": "⇍",
	"&nlE;": "≦̸",
	"&nlarr;": "↚",
	"&nldr;": "‥",
	"&nle;": "≰",
	"&nleftarrow;": "↚",
	"&nleftrightarrow;": "↮",
	"&nleq;": "≰",
	"&nleqq;": "≦̸",
	"&nleqslant;": "⩽̸",
	"&nles;": "⩽̸",
	"&nless;": "≮",
	"&nlsim;": "≴",
	"&nlt;": "≮",
	"&nltri;": "⋪",
	"&nltrie;": "⋬",
	"&nmid;": "∤",
	"&nopf;": "𝕟",
	"&not": "¬",
	"&not;": "¬",
	"&notin;": "∉",
	"&notinE;": "⋹̸",
	"&notindot;": "⋵̸",
	"&notinva;": "∉",
	"&notinvb;": "⋷",
	"&notinvc;": "⋶",
	"&notni;": "∌",
	"&notniva;": "∌",
	"&notnivb;": "⋾",
	"&notnivc;": "⋽",
	"&npar;": "∦",
	"&nparallel;": "∦",
	"&nparsl;": "⫽⃥",
	"&npart;": "∂̸",
	"&npolint;": "⨔",
	"&npr;": "⊀",
	"&nprcue;": "⋠",
	"&npre;": "⪯̸",
	"&nprec;": "⊀",
	"&npreceq;": "⪯̸",
	"&nrArr;": "⇏",
	"&nrarr;": "↛",
	"&nrarrc;": "⤳̸",
	"&nrarrw;": "↝̸",
	"&nrightarrow;": "↛",
	"&nrtri;": "⋫",
	"&nrtrie;": "⋭",
	"&nsc;": "⊁",
	"&nsccue;": "⋡",
	"&nsce;": "⪰̸",
	"&nscr;": "𝓃",
	"&nshortmid;": "∤",
	"&nshortparallel;": "∦",
	"&nsim;": "≁",
	"&nsime;": "≄",
	"&nsimeq;": "≄",
	"&nsmid;": "∤",
	"&nspar;": "∦",
	"&nsqsube;": "⋢",
	"&nsqsupe;": "⋣",
	"&nsub;": "⊄",
	"&nsubE;": "⫅̸",
	"&nsube;": "⊈",
	"&nsubset;": "⊂⃒",
	"&nsubseteq;": "⊈",
	"&nsubseteqq;": "⫅̸",
	"&nsucc;": "⊁",
	"&nsucceq;": "⪰̸",
	"&nsup;": "⊅",
	"&nsupE;": "⫆̸",
	"&nsupe;": "⊉",
	"&nsupset;": "⊃⃒",
	"&nsupseteq;": "⊉",
	"&nsupseteqq;": "⫆̸",
	"&ntgl;": "≹",
	"&ntilde": "ñ",
	"&ntilde;": "ñ",
	"&ntlg;": "≸",
	"&ntriangleleft;": "⋪",
	"&ntrianglelefteq;": "⋬",
	"&ntriangleright;": "⋫",
	"&ntrianglerighteq;": "⋭",
	"&nu;": "ν",
	"&num;": "#",
	"&numero;": "№",
	"&numsp;": " ",
	"&nvDash;": "⊭",
	"&nvHarr;": "⤄",
	"&nvap;": "≍⃒",
	"&nvdash;": "⊬",
	"&nvge;": "≥⃒",
	"&nvgt;": ">⃒",
	"&nvinfin;": "⧞",
	"&nvlArr;": "⤂",
	"&nvle;": "≤⃒",
	"&nvlt;": "<⃒",
	"&nvltrie;": "⊴⃒",
	"&nvrArr;": "⤃",
	"&nvrtrie;": "⊵⃒",
	"&nvsim;": "∼⃒",
	"&nwArr;": "⇖",
	"&nwarhk;": "⤣",
	"&nwarr;": "↖",
	"&nwarrow;": "↖",
	"&nwnear;": "⤧",
	"&oS;": "Ⓢ",
	"&oacute": "ó",
	"&oacute;": "ó",
	"&oast;": "⊛",
	"&ocir;": "⊚",
	"&ocirc": "ô",
	"&ocirc;": "ô",
	"&ocy;": "о",
	"&odash;": "⊝",
	"&odblac;": "ő",
	"&odiv;": "⨸",
	"&odot;": "⊙",
	"&odsold;": "⦼",
	"&oelig;": "œ",
	"&ofcir;": "⦿",
	"&ofr;": "𝔬",
	"&ogon;": "˛",
	"&ograve": "ò",
	"&ograve;": "ò",
	"&ogt;": "⧁",
	"&ohbar;": "⦵",
	"&ohm;": "Ω",
	"&oint;": "∮",
	"&olarr;": "↺",
	"&olcir;": "⦾",
	"&olcross;": "⦻",
	"&oline;": "‾",
	"&olt;": "⧀",
	"&omacr;": "ō",
	"&omega;": "ω",
	"&omicron;": "ο",
	"&omid;": "⦶",
	"&ominus;": "⊖",
	"&oopf;": "𝕠",
	"&opar;": "⦷",
	"&operp;": "⦹",
	"&oplus;": "⊕",
	"&or;": "∨",
	"&orarr;": "↻",
	"&ord;": "⩝",
	"&order;": "ℴ",
	"&orderof;": "ℴ",
	"&ordf": "ª",
	"&ordf;": "ª",
	"&ordm": "º",
	"&ordm;": "º",
	"&origof;": "⊶",
	"&oror;": "⩖",
	"&orslope;": "⩗",
	"&orv;": "⩛",
	"&oscr;": "ℴ",
	"&oslash": "ø",
	"&oslash;": "ø",
	"&osol;": "⊘",
	"&otilde": "õ",
	"&otilde;": "õ",
	"&otimes;": "⊗",
	"&otimesas;": "⨶",
	"&ouml": "ö",
	"&ouml;": "ö",
	"&ovbar;": "⌽",
	"&par;": "∥",
	"&para": "¶",
	"&para;": "¶",
	"&parallel;": "∥",
	"&parsim;": "⫳",
	"&parsl;": "⫽",
	"&part;": "∂",
	"&pcy;": "п",
	"&percnt;": "%",
	"&period;": ".",
	"&permil;": "‰",
	"&perp;": "⊥",
	"&pertenk;": "‱",
	"&pfr;": "𝔭",
	"&phi;": "φ",
	"&phiv;": "ϕ",
	"&phmmat;": "ℳ",
	"&phone;": "☎",
	"&pi;": "π",
	"&pitchfork;": "⋔",
	"&piv;": "ϖ",
	"&planck;": "ℏ",
	"&planckh;": "ℎ",
	"&plankv;": "ℏ",
	"&plus;": "+",
	"&plusacir;": "⨣",
	"&plusb;": "⊞",
	"&pluscir;": "⨢",
	"&plusdo;": "∔",
	"&plusdu;": "⨥",
	"&pluse;": "⩲",
	"&plusmn": "±",
	"&plusmn;": "±",
	"&plussim;": "⨦",
	"&plustwo;": "⨧",
	"&pm;": "±",
	"&pointint;": "⨕",
	"&popf;": "𝕡",
	"&pound": "£",
	"&pound;": "£",
	"&pr;": "≺",
	"&prE;": "⪳",
	"&prap;": "⪷",
	"&prcue;": "≼",
	"&pre;": "⪯",
	"&prec;": "≺",
	"&precapprox;": "⪷",
	"&preccurlyeq;": "≼",
	"&preceq;": "⪯",
	"&precnapprox;": "⪹",
	"&precneqq;": "⪵",
	"&precnsim;": "⋨",
	"&precsim;": "≾",
	"&prime;": "′",
	"&primes;": "ℙ",
	"&prnE;": "⪵",
	"&prnap;": "⪹",
	"&prnsim;": "⋨",
	"&prod;": "∏",
	"&profalar;": "⌮",
	"&profline;": "⌒",
	"&profsurf;": "⌓",
	"&prop;": "∝",
	"&propto;": "∝",
	"&prsim;": "≾",
	"&prurel;": "⊰",
	"&pscr;": "𝓅",
	"&psi;": "ψ",
	"&puncsp;": " ",
	"&qfr;": "𝔮",
	"&qint;": "⨌",
	"&qopf;": "𝕢",
	"&qprime;": "⁗",
	"&qscr;": "𝓆",
	"&quaternions;": "ℍ",
	"&quatint;": "⨖",
	"&quest;": "?",
	"&questeq;": "≟",
	"&quot": "\"",
	"&quot;": "\"",
	"&rAarr;": "⇛",
	"&rArr;": "⇒",
	"&rAtail;": "⤜",
	"&rBarr;": "⤏",
	"&rHar;": "⥤",
	"&race;": "∽̱",
	"&racute;": "ŕ",
	"&radic;": "√",
	"&raemptyv;": "⦳",
	"&rang;": "⟩",
	"&rangd;": "⦒",
	"&range;": "⦥",
	"&rangle;": "⟩",
	"&raquo": "»",
	"&raquo;": "»",
	"&rarr;": "→",
	"&rarrap;": "⥵",
	"&rarrb;": "⇥",
	"&rarrbfs;": "⤠",
	"&rarrc;": "⤳",
	"&rarrfs;": "⤞",
	"&rarrhk;": "↪",
	"&rarrlp;": "↬",
	"&rarrpl;": "⥅",
	"&rarrsim;": "⥴",
	"&rarrtl;": "↣",
	"&rarrw;": "↝",
	"&ratail;": "⤚",
	"&ratio;": "∶",
	"&rationals;": "ℚ",
	"&rbarr;": "⤍",
	"&rbbrk;": "❳",
	"&rbrace;": "}",
	"&rbrack;": "]",
	"&rbrke;": "⦌",
	"&rbrksld;": "⦎",
	"&rbrkslu;": "⦐",
	"&rcaron;": "ř",
	"&rcedil;": "ŗ",
	"&rceil;": "⌉",
	"&rcub;": "}",
	"&rcy;": "р",
	"&rdca;": "⤷",
	"&rdldhar;": "⥩",
	"&rdquo;": "”",
	"&rdquor;": "”",
	"&rdsh;": "↳",
	"&real;": "ℜ",
	"&realine;": "ℛ",
	"&realpart;": "ℜ",
	"&reals;": "ℝ",
	"&rect;": "▭",
	"&reg": "®",
	"&reg;": "®",
	"&rfisht;": "⥽",
	"&rfloor;": "⌋",
	"&rfr;": "𝔯",
	"&rhard;": "⇁",
	"&rharu;": "⇀",
	"&rharul;": "⥬",
	"&rho;": "ρ",
	"&rhov;": "ϱ",
	"&rightarrow;": "→",
	"&rightarrowtail;": "↣",
	"&rightharpoondown;": "⇁",
	"&rightharpoonup;": "⇀",
	"&rightleftarrows;": "⇄",
	"&rightleftharpoons;": "⇌",
	"&rightrightarrows;": "⇉",
	"&rightsquigarrow;": "↝",
	"&rightthreetimes;": "⋌",
	"&ring;": "˚",
	"&risingdotseq;": "≓",
	"&rlarr;": "⇄",
	"&rlhar;": "⇌",
	"&rlm;": "‏",
	"&rmoust;": "⎱",
	"&rmoustache;": "⎱",
	"&rnmid;": "⫮",
	"&roang;": "⟭",
	"&roarr;": "⇾",
	"&robrk;": "⟧",
	"&ropar;": "⦆",
	"&ropf;": "𝕣",
	"&roplus;": "⨮",
	"&rotimes;": "⨵",
	"&rpar;": ")",
	"&rpargt;": "⦔",
	"&rppolint;": "⨒",
	"&rrarr;": "⇉",
	"&rsaquo;": "›",
	"&rscr;": "𝓇",
	"&rsh;": "↱",
	"&rsqb;": "]",
	"&rsquo;": "’",
	"&rsquor;": "’",
	"&rthree;": "⋌",
	"&rtimes;": "⋊",
	"&rtri;": "▹",
	"&rtrie;": "⊵",
	"&rtrif;": "▸",
	"&rtriltri;": "⧎",
	"&ruluhar;": "⥨",
	"&rx;": "℞",
	"&sacute;": "ś",
	"&sbquo;": "‚",
	"&sc;": "≻",
	"&scE;": "⪴",
	"&scap;": "⪸",
	"&scaron;": "š",
	"&sccue;": "≽",
	"&sce;": "⪰",
	"&scedil;": "ş",
	"&scirc;": "ŝ",
	"&scnE;": "⪶",
	"&scnap;": "⪺",
	"&scnsim;": "⋩",
	"&scpolint;": "⨓",
	"&scsim;": "≿",
	"&scy;": "с",
	"&sdot;": "⋅",
	"&sdotb;": "⊡",
	"&sdote;": "⩦",
	"&seArr;": "⇘",
	"&searhk;": "⤥",
	"&searr;": "↘",
	"&searrow;": "↘",
	"&sect": "§",
	"&sect;": "§",
	"&semi;": ";",
	"&seswar;": "⤩",
	"&setminus;": "∖",
	"&setmn;": "∖",
	"&sext;": "✶",
	"&sfr;": "𝔰",
	"&sfrown;": "⌢",
	"&sharp;": "♯",
	"&shchcy;": "щ",
	"&shcy;": "ш",
	"&shortmid;": "∣",
	"&shortparallel;": "∥",
	"&shy": "­",
	"&shy;": "­",
	"&sigma;": "σ",
	"&sigmaf;": "ς",
	"&sigmav;": "ς",
	"&sim;": "∼",
	"&simdot;": "⩪",
	"&sime;": "≃",
	"&simeq;": "≃",
	"&simg;": "⪞",
	"&simgE;": "⪠",
	"&siml;": "⪝",
	"&simlE;": "⪟",
	"&simne;": "≆",
	"&simplus;": "⨤",
	"&simrarr;": "⥲",
	"&slarr;": "←",
	"&smallsetminus;": "∖",
	"&smashp;": "⨳",
	"&smeparsl;": "⧤",
	"&smid;": "∣",
	"&smile;": "⌣",
	"&smt;": "⪪",
	"&smte;": "⪬",
	"&smtes;": "⪬︀",
	"&softcy;": "ь",
	"&sol;": "/",
	"&solb;": "⧄",
	"&solbar;": "⌿",
	"&sopf;": "𝕤",
	"&spades;": "♠",
	"&spadesuit;": "♠",
	"&spar;": "∥",
	"&sqcap;": "⊓",
	"&sqcaps;": "⊓︀",
	"&sqcup;": "⊔",
	"&sqcups;": "⊔︀",
	"&sqsub;": "⊏",
	"&sqsube;": "⊑",
	"&sqsubset;": "⊏",
	"&sqsubseteq;": "⊑",
	"&sqsup;": "⊐",
	"&sqsupe;": "⊒",
	"&sqsupset;": "⊐",
	"&sqsupseteq;": "⊒",
	"&squ;": "□",
	"&square;": "□",
	"&squarf;": "▪",
	"&squf;": "▪",
	"&srarr;": "→",
	"&sscr;": "𝓈",
	"&ssetmn;": "∖",
	"&ssmile;": "⌣",
	"&sstarf;": "⋆",
	"&star;": "☆",
	"&starf;": "★",
	"&straightepsilon;": "ϵ",
	"&straightphi;": "ϕ",
	"&strns;": "¯",
	"&sub;": "⊂",
	"&subE;": "⫅",
	"&subdot;": "⪽",
	"&sube;": "⊆",
	"&subedot;": "⫃",
	"&submult;": "⫁",
	"&subnE;": "⫋",
	"&subne;": "⊊",
	"&subplus;": "⪿",
	"&subrarr;": "⥹",
	"&subset;": "⊂",
	"&subseteq;": "⊆",
	"&subseteqq;": "⫅",
	"&subsetneq;": "⊊",
	"&subsetneqq;": "⫋",
	"&subsim;": "⫇",
	"&subsub;": "⫕",
	"&subsup;": "⫓",
	"&succ;": "≻",
	"&succapprox;": "⪸",
	"&succcurlyeq;": "≽",
	"&succeq;": "⪰",
	"&succnapprox;": "⪺",
	"&succneqq;": "⪶",
	"&succnsim;": "⋩",
	"&succsim;": "≿",
	"&sum;": "∑",
	"&sung;": "♪",
	"&sup1": "¹",
	"&sup1;": "¹",
	"&sup2": "²",
	"&sup2;": "²",
	"&sup3": "³",
	"&sup3;": "³",
	"&sup;": "⊃",
	"&supE;": "⫆",
	"&supdot;": "⪾",
	"&supdsub;": "⫘",
	"&supe;": "⊇",
	"&supedot;": "⫄",
	"&suphsol;": "⟉",
	"&suphsub;": "⫗",
	"&suplarr;": "⥻",
	"&supmult;": "⫂",
	"&supnE;": "⫌",
	"&supne;": "⊋",
	"&supplus;": "⫀",
	"&supset;": "⊃",
	"&supseteq;": "⊇",
	"&supseteqq;": "⫆",
	"&supsetneq;": "⊋",
	"&supsetneqq;": "⫌",
	"&supsim;": "⫈",
	"&supsub;": "⫔",
	"&supsup;": "⫖",
	"&swArr;": "⇙",
	"&swarhk;": "⤦",
	"&swarr;": "↙",
	"&swarrow;": "↙",
	"&swnwar;": "⤪",
	"&szlig": "ß",
	"&szlig;": "ß",
	"&target;": "⌖",
	"&tau;": "τ",
	"&tbrk;": "⎴",
	"&tcaron;": "ť",
	"&tcedil;": "ţ",
	"&tcy;": "т",
	"&tdot;": "⃛",
	"&telrec;": "⌕",
	"&tfr;": "𝔱",
	"&there4;": "∴",
	"&therefore;": "∴",
	"&theta;": "θ",
	"&thetasym;": "ϑ",
	"&thetav;": "ϑ",
	"&thickapprox;": "≈",
	"&thicksim;": "∼",
	"&thinsp;": " ",
	"&thkap;": "≈",
	"&thksim;": "∼",
	"&thorn": "þ",
	"&thorn;": "þ",
	"&tilde;": "˜",
	"&times": "×",
	"&times;": "×",
	"&timesb;": "⊠",
	"&timesbar;": "⨱",
	"&timesd;": "⨰",
	"&tint;": "∭",
	"&toea;": "⤨",
	"&top;": "⊤",
	"&topbot;": "⌶",
	"&topcir;": "⫱",
	"&topf;": "𝕥",
	"&topfork;": "⫚",
	"&tosa;": "⤩",
	"&tprime;": "‴",
	"&trade;": "™",
	"&triangle;": "▵",
	"&triangledown;": "▿",
	"&triangleleft;": "◃",
	"&trianglelefteq;": "⊴",
	"&triangleq;": "≜",
	"&triangleright;": "▹",
	"&trianglerighteq;": "⊵",
	"&tridot;": "◬",
	"&trie;": "≜",
	"&triminus;": "⨺",
	"&triplus;": "⨹",
	"&trisb;": "⧍",
	"&tritime;": "⨻",
	"&trpezium;": "⏢",
	"&tscr;": "𝓉",
	"&tscy;": "ц",
	"&tshcy;": "ћ",
	"&tstrok;": "ŧ",
	"&twixt;": "≬",
	"&twoheadleftarrow;": "↞",
	"&twoheadrightarrow;": "↠",
	"&uArr;": "⇑",
	"&uHar;": "⥣",
	"&uacute": "ú",
	"&uacute;": "ú",
	"&uarr;": "↑",
	"&ubrcy;": "ў",
	"&ubreve;": "ŭ",
	"&ucirc": "û",
	"&ucirc;": "û",
	"&ucy;": "у",
	"&udarr;": "⇅",
	"&udblac;": "ű",
	"&udhar;": "⥮",
	"&ufisht;": "⥾",
	"&ufr;": "𝔲",
	"&ugrave": "ù",
	"&ugrave;": "ù",
	"&uharl;": "↿",
	"&uharr;": "↾",
	"&uhblk;": "▀",
	"&ulcorn;": "⌜",
	"&ulcorner;": "⌜",
	"&ulcrop;": "⌏",
	"&ultri;": "◸",
	"&umacr;": "ū",
	"&uml": "¨",
	"&uml;": "¨",
	"&uogon;": "ų",
	"&uopf;": "𝕦",
	"&uparrow;": "↑",
	"&updownarrow;": "↕",
	"&upharpoonleft;": "↿",
	"&upharpoonright;": "↾",
	"&uplus;": "⊎",
	"&upsi;": "υ",
	"&upsih;": "ϒ",
	"&upsilon;": "υ",
	"&upuparrows;": "⇈",
	"&urcorn;": "⌝",
	"&urcorner;": "⌝",
	"&urcrop;": "⌎",
	"&uring;": "ů",
	"&urtri;": "◹",
	"&uscr;": "𝓊",
	"&utdot;": "⋰",
	"&utilde;": "ũ",
	"&utri;": "▵",
	"&utrif;": "▴",
	"&uuarr;": "⇈",
	"&uuml": "ü",
	"&uuml;": "ü",
	"&uwangle;": "⦧",
	"&vArr;": "⇕",
	"&vBar;": "⫨",
	"&vBarv;": "⫩",
	"&vDash;": "⊨",
	"&vangrt;": "⦜",
	"&varepsilon;": "ϵ",
	"&varkappa;": "ϰ",
	"&varnothing;": "∅",
	"&varphi;": "ϕ",
	"&varpi;": "ϖ",
	"&varpropto;": "∝",
	"&varr;": "↕",
	"&varrho;": "ϱ",
	"&varsigma;": "ς",
	"&varsubsetneq;": "⊊︀",
	"&varsubsetneqq;": "⫋︀",
	"&varsupsetneq;": "⊋︀",
	"&varsupsetneqq;": "⫌︀",
	"&vartheta;": "ϑ",
	"&vartriangleleft;": "⊲",
	"&vartriangleright;": "⊳",
	"&vcy;": "в",
	"&vdash;": "⊢",
	"&vee;": "∨",
	"&veebar;": "⊻",
	"&veeeq;": "≚",
	"&vellip;": "⋮",
	"&verbar;": "|",
	"&vert;": "|",
	"&vfr;": "𝔳",
	"&vltri;": "⊲",
	"&vnsub;": "⊂⃒",
	"&vnsup;": "⊃⃒",
	"&vopf;": "𝕧",
	"&vprop;": "∝",
	"&vrtri;": "⊳",
	"&vscr;": "𝓋",
	"&vsubnE;": "⫋︀",
	"&vsubne;": "⊊︀",
	"&vsupnE;": "⫌︀",
	"&vsupne;": "⊋︀",
	"&vzigzag;": "⦚",
	"&wcirc;": "ŵ",
	"&wedbar;": "⩟",
	"&wedge;": "∧",
	"&wedgeq;": "≙",
	"&weierp;": "℘",
	"&wfr;": "𝔴",
	"&wopf;": "𝕨",
	"&wp;": "℘",
	"&wr;": "≀",
	"&wreath;": "≀",
	"&wscr;": "𝓌",
	"&xcap;": "⋂",
	"&xcirc;": "◯",
	"&xcup;": "⋃",
	"&xdtri;": "▽",
	"&xfr;": "𝔵",
	"&xhArr;": "⟺",
	"&xharr;": "⟷",
	"&xi;": "ξ",
	"&xlArr;": "⟸",
	"&xlarr;": "⟵",
	"&xmap;": "⟼",
	"&xnis;": "⋻",
	"&xodot;": "⨀",
	"&xopf;": "𝕩",
	"&xoplus;": "⨁",
	"&xotime;": "⨂",
	"&xrArr;": "⟹",
	"&xrarr;": "⟶",
	"&xscr;": "𝓍",
	"&xsqcup;": "⨆",
	"&xuplus;": "⨄",
	"&xutri;": "△",
	"&xvee;": "⋁",
	"&xwedge;": "⋀",
	"&yacute": "ý",
	"&yacute;": "ý",
	"&yacy;": "я",
	"&ycirc;": "ŷ",
	"&ycy;": "ы",
	"&yen": "¥",
	"&yen;": "¥",
	"&yfr;": "𝔶",
	"&yicy;": "ї",
	"&yopf;": "𝕪",
	"&yscr;": "𝓎",
	"&yucy;": "ю",
	"&yuml": "ÿ",
	"&yuml;": "ÿ",
	"&zacute;": "ź",
	"&zcaron;": "ž",
	"&zcy;": "з",
	"&zdot;": "ż",
	"&zeetrf;": "ℨ",
	"&zeta;": "ζ",
	"&zfr;": "𝔷",
	"&zhcy;": "ж",
	"&zigrarr;": "⇝",
	"&zopf;": "𝕫",
	"&zscr;": "𝓏",
	"&zwj;": "‍",
	"&zwnj;": "‌"
};
//#endregion
//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/text-format.js
function decodeHTMLEntities(str) {
	return str.replace(/&(#\d+|#x[a-f0-9]+|[a-z]+\d*);?/gi, (match, entity) => {
		if (typeof htmlEntities[match] === "string") return htmlEntities[match];
		if (entity.charAt(0) !== "#" || match.charAt(match.length - 1) !== ";") return match;
		let codePoint;
		if (entity.charAt(1) === "x") codePoint = parseInt(entity.substr(2), 16);
		else codePoint = parseInt(entity.substr(1), 10);
		let output = "";
		if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) return "�";
		if (codePoint > 65535) {
			codePoint -= 65536;
			output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
			codePoint = 56320 | codePoint & 1023;
		}
		output += String.fromCharCode(codePoint);
		return output;
	});
}
function escapeHtml(str) {
	return str.trim().replace(/[<>"'?&]/g, (c) => {
		let hex = c.charCodeAt(0).toString(16);
		if (hex.length < 2) hex = "0" + hex;
		return "&#x" + hex.toUpperCase() + ";";
	});
}
function textToHtml(str) {
	return "<div>" + escapeHtml(str).replace(/\n/g, "<br />") + "</div>";
}
var LINE_TERMINATOR = /[\n\r\u2028\u2029]/g;
function lastLineTerminator(str) {
	return Math.max(str.lastIndexOf("\n"), str.lastIndexOf("\r"), str.lastIndexOf("\u2028"), str.lastIndexOf("\u2029"));
}
/**
* Returns a function that finds the next match of a global regex at or after a position.
*
* Callers only ever ask about positions that move forward, so a match stays the answer
* until a position passes it, and no match stays the answer for good. That way every part
* of the string is scanned once, however many times it is asked about.
*
* @param {String} str String to search
* @param {RegExp} regex Global regex to look for
* @return {Function} `pos => match` of the next match, or null if there is none
*/
function createFinder(str, regex) {
	let searchedFrom = Infinity;
	let found = null;
	return (pos) => {
		if (pos < searchedFrom || found && pos > found.index) {
			regex.lastIndex = pos;
			found = regex.exec(str);
			searchedFrom = pos;
		}
		return found;
	};
}
/**
* `str.replace(pattern, replacement)` for a pattern shaped like `<tag\b[^>]*>`.
*
* Such a pattern only fails at a candidate that has no `>` after it, so the text after
* the last `>` can never match and is where every rescan happened. Leaving it out keeps
* the native replace, and its speed, for everything else.
*
* @param {String} str String to process
* @param {RegExp} pattern Global regex that ends on the first `>` after its start
* @param {String} replacement Replacement text
* @return {String} Processed string
*/
function replaceClosedTags(str, pattern, replacement) {
	const end = str.lastIndexOf(">") + 1;
	return str.slice(0, end).replace(pattern, replacement) + str.slice(end);
}
/**
* `str.replace(pattern, replacement)` for a tag pattern that may fail even when a `>`
* follows, like `<a\b[^>]*href...>`, or that runs on past its `>`.
*
* A candidate with no `>` after it ends the search, since no later candidate can close
* either. A candidate that does not match skips every other candidate before the same
* `>`, since those see the same tag body and fail the same way.
*
* @param {String} str String to process
* @param {RegExp} prefix Global regex for the start of a candidate, which can not contain `>`
* @param {RegExp} pattern The whole pattern as a sticky regex
* @param {Function} replacement Function given the match and its groups
* @return {String} Processed string
*/
function replaceTags(str, prefix, pattern, replacement) {
	const parts = [];
	let copied = 0;
	let searchFrom = 0;
	while (true) {
		prefix.lastIndex = searchFrom;
		const candidate = prefix.exec(str);
		if (!candidate) break;
		const start = candidate.index;
		pattern.lastIndex = start;
		const match = pattern.exec(str);
		if (!match) {
			const gt = str.indexOf(">", start);
			if (gt < 0) break;
			searchFrom = gt + 1;
			continue;
		}
		parts.push(str.slice(copied, start), replacement(...match));
		copied = searchFrom = start + match[0].length;
	}
	parts.push(str.slice(copied));
	return parts.join("");
}
/**
* `str.replace(pattern, replacement)` for a pattern like `<!--.*?-->` or
* `<script\b[^>]*>.*?<\/script\b[^>]*>`, ie. an opener and a closer, either of which may
* continue with `[^>]*>`, and a lazy `.*?` between them. The engine rescans to the end of
* the line for every opener that is not closed.
*
* @param {String} str String to process
* @param {RegExp} open Global regex for the opener
* @param {Boolean} openToGt Whether the opener continues with `[^>]*>`
* @param {RegExp} close Global regex for the closer
* @param {Boolean} closeToGt Whether the closer continues with `[^>]*>`
* @param {String} replacement Replacement text
* @return {String} Processed string
*/
function replaceBlocks(str, open, openToGt, close, closeToGt, replacement) {
	const nextGt = createFinder(str, />/g);
	const nextClose = createFinder(str, close);
	const nextLineEnd = createFinder(str, LINE_TERMINATOR);
	const parts = [];
	let copied = 0;
	let searchFrom = 0;
	while (true) {
		open.lastIndex = searchFrom;
		const opener = open.exec(str);
		if (!opener) break;
		const start = opener.index;
		searchFrom = start + 1;
		let from = start + opener[0].length;
		if (openToGt) {
			const gt = nextGt(from);
			if (!gt) break;
			from = gt.index + 1;
		}
		const closer = nextClose(from);
		if (!closer) break;
		const lineEnd = nextLineEnd(from);
		if (lineEnd && lineEnd.index < closer.index) continue;
		let end = closer.index + closer[0].length;
		if (closeToGt) {
			const gt = nextGt(end);
			if (!gt) break;
			end = gt.index + 1;
		}
		parts.push(str.slice(copied, start), replacement);
		copied = searchFrom = end;
	}
	parts.push(str.slice(copied));
	return parts.join("");
}
/**
* `str.replace(pattern, '')` for `^.*<tag\b[^>]*>`, ie. drops everything up to and
* including the last such tag on the first line.
*
* @param {String} str String to process
* @param {RegExp} prefix Global regex for the start of the tag, which can not contain `>`
* @return {String} Processed string
*/
function stripThroughLastTag(str, prefix) {
	const lineEnd = str.search(LINE_TERMINATOR);
	const limit = Math.min(lineEnd < 0 ? str.length : lineEnd, str.lastIndexOf(">"));
	let last = -1;
	prefix.lastIndex = 0;
	let match;
	while ((match = prefix.exec(str)) && match.index < limit) last = match.index;
	return last < 0 ? str : str.slice(str.indexOf(">", last) + 1);
}
/**
* `str.replace(pattern, '')` for `<tag\b[^>]*>.*$`, ie. drops the first such tag whose
* `>` is on the last line, and everything after it.
*
* @param {String} str String to process
* @param {RegExp} prefix Global regex for the start of the tag, which can not contain `>`
* @return {String} Processed string
*/
function stripFromFirstTag(str, prefix) {
	const lineEnd = lastLineTerminator(str);
	prefix.lastIndex = lineEnd < 0 ? 0 : str.lastIndexOf(">", lineEnd) + 1;
	const match = prefix.exec(str);
	return match && match.index < str.lastIndexOf(">") ? str.slice(0, match.index) : str;
}
function htmlToText(str) {
	str = str.replace(/\r?\n/g, "");
	str = replaceBlocks(str, /<!--/g, false, /-->/g, false, " ");
	str = replaceClosedTags(str, /<br\b[^>]*>/gi, "\n");
	str = replaceClosedTags(str, /<\/?(p|div|table|tr|td|th)\b[^>]*>/gi, "\n\n");
	str = replaceBlocks(str, /<script\b/gi, true, /<\/script\b/gi, true, " ");
	str = stripThroughLastTag(str, /<body\b/gi);
	str = stripThroughLastTag(str, /<\/head\b/gi);
	str = stripThroughLastTag(str, /<!doctype\b/gi);
	str = stripFromFirstTag(str, /<\/body\b/gi);
	str = stripFromFirstTag(str, /<\/html\b/gi);
	str = replaceTags(str, /<a\b/gi, /<a\b[^>]*href\s*=\s*["']?([^\s"']+)[^>]*>/iy, (match, href) => ` (${href}) `);
	str = replaceClosedTags(str, /<\/?(span|em|i|strong|b|u|a)\b[^>]*>/gi, "");
	str = replaceTags(str, /<li\b/gi, /<li\b[^>]*>[\n\u0001\s]*/iy, () => "* ");
	str = replaceClosedTags(str, /<hr\b[^>]*>/g, "\n-------------\n");
	str = replaceClosedTags(str, /<[^>]*>/g, " ");
	str = str.replace(/\u0001/g, "\n").replace(/[ \t]+/g, " ").replace(/^\s+$/gm, "").replace(/\n\n+/g, "\n\n").replace(/^\n+/, "\n").replace(/\n+$/, "\n");
	str = decodeHTMLEntities(str);
	return str;
}
function formatDate(date) {
	if (typeof Intl === "undefined") return date;
	const parsed = new Date(date);
	if (isNaN(parsed.getTime())) return date;
	return new Intl.DateTimeFormat("default", {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
		hour12: false
	}).format(parsed);
}
function formatTextAddress(address) {
	return [].concat(address.name || []).concat(address.name ? `<${address.address}>` : address.address).join(" ");
}
function formatTextAddresses(addresses) {
	let parts = [];
	let processAddress = (address, partCounter) => {
		if (partCounter) parts.push(", ");
		if (address.group) {
			let groupStart = `${address.name}:`;
			let groupEnd = `;`;
			parts.push(groupStart);
			address.group.forEach(processAddress);
			parts.push(groupEnd);
		} else parts.push(formatTextAddress(address));
	};
	addresses.forEach(processAddress);
	return parts.join("");
}
function formatHtmlAddress(address) {
	return `<a href="mailto:${escapeHtml(address.address)}" class="postal-email-address">${escapeHtml(address.name || `<${address.address}>`)}</a>`;
}
function formatHtmlAddresses(addresses) {
	let parts = [];
	let processAddress = (address, partCounter) => {
		if (partCounter) parts.push("<span class=\"postal-email-address-separator\">, </span>");
		if (address.group) {
			let groupStart = `<span class="postal-email-address-group">${escapeHtml(address.name)}:</span>`;
			let groupEnd = `<span class="postal-email-address-group">;</span>`;
			parts.push(groupStart);
			address.group.forEach(processAddress);
			parts.push(groupEnd);
		} else parts.push(formatHtmlAddress(address));
	};
	addresses.forEach(processAddress);
	return parts.join(" ");
}
function foldLines(str, lineLength, afterSpace) {
	str = (str || "").toString();
	lineLength = lineLength || 76;
	let pos = 0, len = str.length, result = "", line, match;
	while (pos < len) {
		line = str.substr(pos, lineLength);
		if (line.length < lineLength) {
			result += line;
			break;
		}
		if (match = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
			line = match[0];
			result += line;
			pos += line.length;
			continue;
		} else if ((match = line.match(/(\s+)[^\s]*$/)) && match[0].length - (afterSpace ? (match[1] || "").length : 0) < line.length) line = line.substr(0, line.length - (match[0].length - (afterSpace ? (match[1] || "").length : 0)));
		else if (match = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) line = line + match[0].substr(0, match[0].length - (!afterSpace ? (match[1] || "").length : 0));
		result += line;
		pos += line.length;
		if (pos < len) result += "\r\n";
	}
	return result;
}
function formatTextHeader(message) {
	let rows = [];
	if (message.from) rows.push({
		key: "From",
		val: formatTextAddresses([message.from])
	});
	if (message.subject) rows.push({
		key: "Subject",
		val: message.subject
	});
	if (message.date) rows.push({
		key: "Date",
		val: formatDate(message.date)
	});
	if (message.to && message.to.length) rows.push({
		key: "To",
		val: formatTextAddresses(message.to)
	});
	if (message.cc && message.cc.length) rows.push({
		key: "Cc",
		val: formatTextAddresses(message.cc)
	});
	if (message.bcc && message.bcc.length) rows.push({
		key: "Bcc",
		val: formatTextAddresses(message.bcc)
	});
	let maxKeyLength = rows.map((r) => r.key.length).reduce((acc, cur) => {
		return cur > acc ? cur : acc;
	}, 0);
	rows = rows.flatMap((row) => {
		let sepLen = maxKeyLength - row.key.length;
		let prefix = `${row.key}: ${" ".repeat(sepLen)}`;
		let emptyPrefix = `${" ".repeat(row.key.length + 1)} ${" ".repeat(sepLen)}`;
		return foldLines(row.val, 80, true).split(/\r?\n/).map((line) => line.trim()).map((line, i) => `${i ? emptyPrefix : prefix}${line}`);
	});
	let maxLineLength = rows.map((r) => r.length).reduce((acc, cur) => {
		return cur > acc ? cur : acc;
	}, 0);
	let lineMarker = "-".repeat(maxLineLength);
	return `
${lineMarker}
${rows.join("\n")}
${lineMarker}
`;
}
function formatHtmlHeader(message) {
	let rows = [];
	if (message.from) rows.push(`<div class="postal-email-header-key">From</div><div class="postal-email-header-value">${formatHtmlAddresses([message.from])}</div>`);
	if (message.subject) rows.push(`<div class="postal-email-header-key">Subject</div><div class="postal-email-header-value postal-email-header-subject">${escapeHtml(message.subject)}</div>`);
	if (message.date) rows.push(`<div class="postal-email-header-key">Date</div><div class="postal-email-header-value postal-email-header-date" data-date="${escapeHtml(message.date)}">${escapeHtml(formatDate(message.date))}</div>`);
	if (message.to && message.to.length) rows.push(`<div class="postal-email-header-key">To</div><div class="postal-email-header-value">${formatHtmlAddresses(message.to)}</div>`);
	if (message.cc && message.cc.length) rows.push(`<div class="postal-email-header-key">Cc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.cc)}</div>`);
	if (message.bcc && message.bcc.length) rows.push(`<div class="postal-email-header-key">Bcc</div><div class="postal-email-header-value">${formatHtmlAddresses(message.bcc)}</div>`);
	return `<div class="postal-email-header">${rows.length ? "<div class=\"postal-email-header-row\">" : ""}${rows.join("</div>\n<div class=\"postal-email-header-row\">")}${rows.length ? "</div>" : ""}</div>`;
}
//#endregion
//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/address-parser.js
var WORD_CHAR_REGEX = /\w/;
var NON_SPACE_TOKEN_REGEX = /[^\s]+/g;
/**
* Finds the first address looking token in a run of text.
*
* This replaces a `\s*\b[^@\s]+@[^\s]+\b\s*` scan over the whole string, which backtracks
* quadratically: the leading `\s*` makes every position inside a whitespace run a viable
* start, and `[^@\s]+` then gives back one character at a time looking for an '@'. A
* single header well inside the default size limit could hold a core busy for minutes.
*
* Scanning whitespace delimited tokens instead is linear and keeps the word boundary
* semantics of the regex: the local part has to open on a word character and the domain
* has to end on one.
*
* @param {String} text Text to search
* @return {Object|null} `{index, length, value}` of the address, or null if there is none
*/
function findAddressInText(text) {
	NON_SPACE_TOKEN_REGEX.lastIndex = 0;
	let match;
	while (match = NON_SPACE_TOKEN_REGEX.exec(text)) {
		const token = match[0];
		const at = token.indexOf("@");
		let start = 0;
		while (start < at && !WORD_CHAR_REGEX.test(token.charAt(start))) start++;
		if (start >= at) continue;
		let end = token.length;
		while (end > at + 1 && !WORD_CHAR_REGEX.test(token.charAt(end - 1))) end--;
		if (end <= at + 1) continue;
		return {
			index: match.index + start,
			length: end - start,
			value: token.substring(start, end)
		};
	}
	return null;
}
/**
* Checks whether text holds an angle bracket address, ie. `<` and `>` around a run
* without other angle brackets that has an '@' with at least one character on each side.
*
* Same answer as `/<[^<>]+@[^<>]+>/.test(text)`, which backtracks quadratically on a `<`
* followed by a long run of '@' and no closing `>`.
*
* @param {String} text Text to check
* @return {Boolean} true if an angle bracket address is present
*/
function hasAngleAddress(text) {
	let start = -1;
	let at = -1;
	for (let i = 0; i < text.length; i++) {
		const chr = text.charAt(i);
		if (chr === "<") {
			start = i + 1;
			at = -1;
		} else if (chr === ">") {
			if (at >= 0 && at < i - 1) return true;
			start = -1;
			at = -1;
		} else if (chr === "@" && start >= 0 && at < 0 && i > start) at = i;
	}
	return false;
}
/**
* Converts tokens for a single address into an address object
*
* @param {Array} tokens Tokens object
* @param {Number} depth Current recursion depth for nested group protection
* @return {Object} Address object
*/
function _handleAddress(tokens, depth) {
	let isGroup = false;
	let state = "text";
	let address;
	let addresses = [];
	let data = {
		address: [],
		comment: [],
		group: [],
		text: [],
		textWasQuoted: []
	};
	let i;
	let len;
	let insideQuotes = false;
	for (i = 0, len = tokens.length; i < len; i++) {
		let token = tokens[i];
		let prevToken = i ? tokens[i - 1] : null;
		if (token.type === "operator") switch (token.value) {
			case "<":
				state = "address";
				insideQuotes = false;
				break;
			case "(":
				state = "comment";
				insideQuotes = false;
				break;
			case ":":
				state = "group";
				isGroup = true;
				insideQuotes = false;
				break;
			case "\"":
				insideQuotes = !insideQuotes;
				state = "text";
				break;
			default:
				state = "text";
				insideQuotes = false;
		}
		else if (token.value) {
			if (state === "address") token.value = token.value.replace(/^[^<]*<\s*/, "");
			if (prevToken && prevToken.noBreak && data[state].length) {
				data[state][data[state].length - 1] += token.value;
				if (state === "text" && insideQuotes) data.textWasQuoted[data.textWasQuoted.length - 1] = true;
			} else {
				data[state].push(token.value);
				if (state === "text") data.textWasQuoted.push(insideQuotes);
			}
		}
	}
	if (!data.text.length && data.comment.length) {
		data.text = data.comment;
		data.comment = [];
	}
	if (isGroup) {
		data.text = data.text.join(" ");
		let groupMembers = [];
		if (data.group.length) addressParser(data.group.join(","), { _depth: depth + 1 }).forEach((member) => {
			if (member.group) for (const nestedMember of member.group) groupMembers.push(nestedMember);
			else groupMembers.push(member);
		});
		addresses.push({
			name: decodeWords(data.text || address && address.name),
			group: groupMembers
		});
	} else {
		if (!data.address.length && data.text.length) {
			for (i = data.text.length - 1; i >= 0; i--) if (!data.textWasQuoted[i] && data.text[i].match(/^[^@\s]+@[^@\s]+$/)) {
				data.address = data.text.splice(i, 1);
				data.textWasQuoted.splice(i, 1);
				break;
			}
			if (!data.address.length) {
				for (i = data.text.length - 1; i >= 0; i--) if (!data.textWasQuoted[i]) {
					const found = findAddressInText(data.text[i]);
					if (found) {
						data.address = [found.value];
						data.text[i] = (data.text[i].substring(0, found.index).trimEnd() + " " + data.text[i].substring(found.index + found.length).trimStart()).trim();
						break;
					}
					data.text[i] = data.text[i].trim();
				}
			}
		}
		if (!data.text.length && data.comment.length) {
			data.text = data.comment;
			data.comment = [];
		}
		if (data.address.length > 1) data.text = data.text.concat(data.address.splice(1));
		data.text = data.text.join(" ");
		data.address = data.address.join(" ");
		if (!data.address && isEncodedWordsOnly(data.text.trim())) {
			const decodedText = decodeWords(data.text);
			if (hasAngleAddress(decodedText)) {
				const parsedSubAddresses = addressParser(decodedText);
				if (parsedSubAddresses && parsedSubAddresses.length) return parsedSubAddresses;
			}
			return [{
				address: "",
				name: decodedText
			}];
		}
		address = {
			address: data.address || data.text || "",
			name: decodeWords(data.text || data.address || "")
		};
		if (address.address === address.name) if ((address.address || "").match(/@/)) address.name = "";
		else address.address = "";
		addresses.push(address);
	}
	return addresses;
}
/**
* Creates a Tokenizer object for tokenizing address field strings
*
* @constructor
* @param {String} str Address field string
*/
var Tokenizer = class {
	constructor(str) {
		this.str = (str || "").toString();
		this.operatorCurrent = "";
		this.operatorExpecting = "";
		this.node = null;
		this.escaped = false;
		this.list = [];
		/**
		* Operator tokens and which tokens are expected to end the sequence
		*/
		this.operators = {
			"\"": "\"",
			"(": ")",
			"<": ">",
			",": "",
			":": ";",
			";": ""
		};
	}
	/**
	* Tokenizes the original input string
	*
	* @return {Array} An array of operator|text tokens
	*/
	tokenize() {
		let list = [];
		for (let i = 0, len = this.str.length; i < len; i++) {
			let chr = this.str.charAt(i);
			let nextChr = i < len - 1 ? this.str.charAt(i + 1) : null;
			this.checkChar(chr, nextChr);
		}
		this.list.forEach((node) => {
			node.value = (node.value || "").toString().trim();
			if (node.value) list.push(node);
		});
		return list;
	}
	/**
	* Checks if a character is an operator or text and acts accordingly
	*
	* @param {String} chr Character from the address field
	*/
	checkChar(chr, nextChr) {
		if (this.escaped) {} else if (chr === this.operatorExpecting) {
			this.node = {
				type: "operator",
				value: chr
			};
			if (nextChr && ![
				" ",
				"	",
				"\r",
				"\n",
				",",
				";"
			].includes(nextChr)) this.node.noBreak = true;
			this.list.push(this.node);
			this.node = null;
			this.operatorExpecting = "";
			this.escaped = false;
			return;
		} else if (!this.operatorExpecting && chr in this.operators) {
			this.node = {
				type: "operator",
				value: chr
			};
			this.list.push(this.node);
			this.node = null;
			this.operatorExpecting = this.operators[chr];
			this.escaped = false;
			return;
		} else if (this.operatorExpecting === "\"" && chr === "\\") {
			this.escaped = true;
			return;
		}
		if (!this.node) {
			this.node = {
				type: "text",
				value: ""
			};
			this.list.push(this.node);
		}
		if (chr === "\n") chr = " ";
		if (chr.charCodeAt(0) >= 33 || [" ", "	"].includes(chr)) this.node.value += chr;
		this.escaped = false;
	}
};
/**
* Maximum recursion depth for parsing nested groups.
* RFC 5322 doesn't allow nested groups, so this is a safeguard against
* malicious input that could cause stack overflow.
*/
var MAX_NESTED_GROUP_DEPTH = 50;
/**
* Parses structured e-mail addresses from an address field
*
* Example:
*
*    'Name <address@domain>'
*
* will be converted to
*
*     [{name: 'Name', address: 'address@domain'}]
*
* @param {String} str Address field
* @param {Object} options Optional options object
* @param {Number} options._depth Internal recursion depth counter (do not set manually)
* @return {Array} An array of address objects
*/
function addressParser(str, options) {
	options = options || {};
	let depth = options._depth || 0;
	if (depth > MAX_NESTED_GROUP_DEPTH) return [];
	let tokens = new Tokenizer(str).tokenize();
	let addresses = [];
	let address = [];
	const parsedAddresses = [];
	tokens.forEach((token) => {
		if (token.type === "operator" && (token.value === "," || token.value === ";")) {
			if (address.length) addresses.push(address);
			address = [];
		} else address.push(token);
	});
	if (address.length) addresses.push(address);
	for (const tokens of addresses) for (const address of _handleAddress(tokens, depth)) parsedAddresses.push(address);
	if (options.flatten) {
		let addresses = [];
		let walkAddressList = (list) => {
			list.forEach((address) => {
				if (address.group) return walkAddressList(address.group);
				else addresses.push(address);
			});
		};
		walkAddressList(parsedAddresses);
		return addresses;
	}
	return parsedAddresses;
}
//#endregion
//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/base64-encoder.js
function base64ArrayBuffer(arrayBuffer) {
	var base64 = "";
	var encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var bytes = new Uint8Array(arrayBuffer);
	var byteLength = bytes.byteLength;
	var byteRemainder = byteLength % 3;
	var mainLength = byteLength - byteRemainder;
	var a, b, c, d;
	var chunk;
	for (var i = 0; i < mainLength; i = i + 3) {
		chunk = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
		a = (chunk & 16515072) >> 18;
		b = (chunk & 258048) >> 12;
		c = (chunk & 4032) >> 6;
		d = chunk & 63;
		base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
	}
	if (byteRemainder == 1) {
		chunk = bytes[mainLength];
		a = (chunk & 252) >> 2;
		b = (chunk & 3) << 4;
		base64 += encodings[a] + encodings[b] + "==";
	} else if (byteRemainder == 2) {
		chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
		a = (chunk & 64512) >> 10;
		b = (chunk & 1008) >> 4;
		c = (chunk & 15) << 2;
		base64 += encodings[a] + encodings[b] + encodings[c] + "=";
	}
	return base64;
}
//#endregion
//#region ../../node_modules/.pnpm/postal-mime@3.0.1/node_modules/postal-mime/src/postal-mime.js
var MAX_NESTING_DEPTH = 256;
var MAX_HEADERS_SIZE = 2097152;
var MAX_RFC822_NESTING_DEPTH = 10;
function toCamelCase(key) {
	return key.replace(/-(.)/g, (o, c) => c.toUpperCase());
}
function parseLimitOption(value, defaultValue, name) {
	if (value === void 0 || value === null) return defaultValue;
	if (typeof value !== "number" || !Number.isInteger(value) || value < 0) throw new TypeError(`${name} must be a non-negative integer`);
	return value;
}
var PostalMime = class PostalMime {
	static async parse(buf, options) {
		return new PostalMime(options).parse(buf);
	}
	constructor(options, rfc822NestingDepth = 0) {
		this.options = options || {};
		this.mimeOptions = {
			maxNestingDepth: parseLimitOption(this.options.maxNestingDepth, MAX_NESTING_DEPTH, "maxNestingDepth"),
			maxHeadersSize: parseLimitOption(this.options.maxHeadersSize, MAX_HEADERS_SIZE, "maxHeadersSize")
		};
		this.maxRfc822NestingDepth = parseLimitOption(this.options.maxRfc822NestingDepth, MAX_RFC822_NESTING_DEPTH, "maxRfc822NestingDepth");
		this.rfc822NestingDepth = rfc822NestingDepth;
		this.root = this.currentNode = new MimeNode({
			postalMime: this,
			...this.mimeOptions
		});
		this.boundaries = [];
		this.headerSize = 0;
		this.textContent = {};
		this.attachments = [];
		this.attachmentEncoding = (this.options.attachmentEncoding || "").toString().replace(/[-_\s]/g, "").trim().toLowerCase() || "arraybuffer";
		this.started = false;
	}
	async finalize() {
		await this.root.finalize();
	}
	async processLine(line, isFinal) {
		let boundaries = this.boundaries;
		if (boundaries.length && line.length > 2 && line[0] === 45 && line[1] === 45) for (let i = boundaries.length - 1; i >= 0; i--) {
			let boundary = boundaries[i];
			if (line.length < boundary.value.length + 2) continue;
			let boundaryMatches = true;
			for (let j = 0; j < boundary.value.length; j++) if (line[j + 2] !== boundary.value[j]) {
				boundaryMatches = false;
				break;
			}
			if (!boundaryMatches) continue;
			let boundaryEnd = boundary.value.length + 2;
			let isTerminator = false;
			if (line.length >= boundary.value.length + 4 && line[boundary.value.length + 2] === 45 && line[boundary.value.length + 3] === 45) {
				isTerminator = true;
				boundaryEnd = boundary.value.length + 4;
			}
			let hasValidTrailing = true;
			for (let j = boundaryEnd; j < line.length; j++) if (line[j] !== 32 && line[j] !== 9) {
				hasValidTrailing = false;
				break;
			}
			if (!hasValidTrailing) continue;
			if (isTerminator) {
				await boundary.node.finalize();
				this.currentNode = boundary.node.parentNode || this.root;
			} else {
				await boundary.node.finalizeChildNodes();
				this.currentNode = new MimeNode({
					postalMime: this,
					parentNode: boundary.node,
					parentMultipartType: boundary.node.contentType.multipart,
					...this.mimeOptions
				});
			}
			if (isFinal) return this.finalize();
			return;
		}
		this.currentNode.feed(line);
		if (isFinal) return this.finalize();
	}
	readLine() {
		let startPos = this.readPos;
		let endPos = this.readPos;
		while (this.readPos < this.av.length) {
			const c = this.av[this.readPos++];
			if (c !== 13 && c !== 10) endPos = this.readPos;
			if (c === 10) return {
				bytes: new Uint8Array(this.buf, startPos, endPos - startPos),
				done: this.readPos >= this.av.length
			};
		}
		return {
			bytes: new Uint8Array(this.buf, startPos, endPos - startPos),
			done: this.readPos >= this.av.length
		};
	}
	async processNodeTree() {
		let textContent = {};
		let textTypes = /* @__PURE__ */ new Set();
		let textMap = this.textMap = /* @__PURE__ */ new Map();
		let forceRfc822Attachments = this.forceRfc822Attachments();
		let walk = async (node, alternative, related) => {
			alternative = alternative || false;
			related = related || false;
			if (!node.contentType.multipart) {
				const inlineRfc822 = this.isInlineMessageRfc822(node) && !forceRfc822Attachments;
				const rfc822DepthExceeded = inlineRfc822 && this.rfc822NestingDepth >= this.maxRfc822NestingDepth;
				if (inlineRfc822 && !rfc822DepthExceeded) {
					const subParser = new PostalMime({
						...this.mimeOptions,
						maxRfc822NestingDepth: this.maxRfc822NestingDepth,
						attachmentEncoding: "arraybuffer"
					}, this.rfc822NestingDepth + 1);
					node.subMessage = await subParser.parse(node.content);
					if (!textMap.has(node)) textMap.set(node, {});
					let textEntry = textMap.get(node);
					if (node.subMessage.text || !node.subMessage.html) {
						textEntry.plain = textEntry.plain || [];
						textEntry.plain.push({
							type: "subMessage",
							value: node.subMessage
						});
						textTypes.add("plain");
					}
					if (node.subMessage.html) {
						textEntry.html = textEntry.html || [];
						textEntry.html.push({
							type: "subMessage",
							value: node.subMessage
						});
						textTypes.add("html");
					}
					if (subParser.textMap) subParser.textMap.forEach((subTextEntry, subTextNode) => {
						textMap.set(subTextNode, subTextEntry);
					});
					for (let attachment of node.subMessage.attachments || []) this.attachments.push(attachment);
				} else if (this.isInlineTextNode(node)) {
					let textType = node.contentType.parsed.value.substr(node.contentType.parsed.value.indexOf("/") + 1);
					let selectorNode = alternative || node;
					if (!textMap.has(selectorNode)) textMap.set(selectorNode, {});
					let textEntry = textMap.get(selectorNode);
					textEntry[textType] = textEntry[textType] || [];
					textEntry[textType].push({
						type: "text",
						value: node.getTextContent()
					});
					textTypes.add(textType);
				} else if (node.content) {
					const filename = node.contentDisposition?.parsed?.params?.filename || node.contentType.parsed.params.name || null;
					const attachment = {
						filename: filename ? decodeWords(filename) : null,
						mimeType: node.contentType.parsed.value,
						disposition: node.contentDisposition?.parsed?.value || null
					};
					if (related && node.contentId && !rfc822DepthExceeded) attachment.related = true;
					if (rfc822DepthExceeded) attachment.rfc822DepthExceeded = true;
					if (node.contentDescription) attachment.description = decodeWords(node.contentDescription);
					if (node.contentId) attachment.contentId = node.contentId;
					switch (node.contentType.parsed.value) {
						case "text/calendar":
						case "application/ics": {
							if (node.contentType.parsed.params.method) attachment.method = node.contentType.parsed.params.method.toString().toUpperCase().trim();
							const decodedText = node.getTextContent().replace(/\r?\n/g, "\n");
							let end = decodedText.length;
							while (end > 0 && decodedText.charCodeAt(end - 1) === 10) end--;
							attachment.content = textEncoder.encode(decodedText.slice(0, end) + "\n");
							break;
						}
						default: attachment.content = node.content;
					}
					this.attachments.push(attachment);
				}
			} else if (node.contentType.multipart === "alternative") alternative = node;
			else if (node.contentType.multipart === "related") related = node;
			for (let childNode of node.childNodes) await walk(childNode, alternative, related);
		};
		await walk(this.root, false, false);
		textMap.forEach((mapEntry) => {
			textTypes.forEach((textType) => {
				if (!textContent[textType]) textContent[textType] = [];
				if (mapEntry[textType]) mapEntry[textType].forEach((textEntry) => {
					switch (textEntry.type) {
						case "text":
							textContent[textType].push(textEntry.value);
							break;
						case "subMessage": switch (textType) {
							case "html":
								textContent[textType].push(formatHtmlHeader(textEntry.value));
								break;
							case "plain": textContent[textType].push(formatTextHeader(textEntry.value));
						}
					}
				});
				else {
					let alternativeType;
					switch (textType) {
						case "html":
							alternativeType = "plain";
							break;
						case "plain": alternativeType = "html";
					}
					(mapEntry[alternativeType] || []).forEach((textEntry) => {
						switch (textEntry.type) {
							case "text":
								switch (textType) {
									case "html":
										textContent[textType].push(textToHtml(textEntry.value));
										break;
									case "plain": textContent[textType].push(htmlToText(textEntry.value));
								}
								break;
							case "subMessage": switch (textType) {
								case "html":
									textContent[textType].push(formatHtmlHeader(textEntry.value));
									break;
								case "plain": textContent[textType].push(formatTextHeader(textEntry.value));
							}
						}
					});
				}
			});
		});
		Object.keys(textContent).forEach((textType) => {
			textContent[textType] = textContent[textType].join("\n");
		});
		this.textContent = textContent;
	}
	isInlineTextNode(node) {
		if (node.contentDisposition?.parsed?.value === "attachment") return false;
		switch (node.contentType.parsed?.value) {
			case "text/html":
			case "text/plain": return true;
			default: return false;
		}
	}
	isInlineMessageRfc822(node) {
		if (node.contentType.parsed?.value !== "message/rfc822") return false;
		return (node.contentDisposition?.parsed?.value || (this.options.rfc822Attachments ? "attachment" : "inline")) === "inline";
	}
	forceRfc822Attachments() {
		if (this.options.forceRfc822Attachments) return true;
		let forceRfc822Attachments = false;
		let walk = (node) => {
			if (!node.contentType.multipart) {
				if (node.contentType.parsed && ["message/delivery-status", "message/feedback-report"].includes(node.contentType.parsed.value)) forceRfc822Attachments = true;
			}
			for (let childNode of node.childNodes) walk(childNode);
		};
		walk(this.root);
		return forceRfc822Attachments;
	}
	async resolveStream(stream) {
		let chunkLen = 0;
		let chunks = [];
		const reader = stream.getReader();
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
			chunkLen += value.length;
		}
		const result = new Uint8Array(chunkLen);
		let chunkPointer = 0;
		for (let chunk of chunks) {
			result.set(chunk, chunkPointer);
			chunkPointer += chunk.length;
		}
		return result;
	}
	async parse(buf) {
		if (this.started) throw new Error("Can not reuse parser, create a new PostalMime object");
		this.started = true;
		if (buf && typeof buf.getReader === "function") buf = await this.resolveStream(buf);
		buf = buf || /* @__PURE__ */ new ArrayBuffer(0);
		if (typeof buf === "string") buf = textEncoder.encode(buf);
		if (buf instanceof Blob || Object.prototype.toString.call(buf) === "[object Blob]") buf = await blobToArrayBuffer(buf);
		if (ArrayBuffer.isView(buf)) buf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		this.buf = buf;
		this.av = new Uint8Array(buf);
		this.readPos = 0;
		while (this.readPos < this.av.length) {
			const line = this.readLine();
			await this.processLine(line.bytes, line.done);
		}
		await this.processNodeTree();
		const message = { headers: this.root.headers.map((entry) => ({
			key: entry.key,
			originalKey: entry.originalKey,
			value: entry.value
		})) };
		for (const key of ["from", "sender"]) {
			const addressHeader = this.root.headers.find((line) => line.key === key);
			if (addressHeader && addressHeader.value) {
				const addresses = addressParser(addressHeader.value);
				if (addresses && addresses.length) message[key] = addresses[0];
			}
		}
		for (const key of ["delivered-to", "return-path"]) {
			const addressHeader = this.root.headers.find((line) => line.key === key);
			if (addressHeader && addressHeader.value) {
				const addresses = addressParser(addressHeader.value);
				if (addresses && addresses.length && addresses[0].address) {
					const camelKey = toCamelCase(key);
					message[camelKey] = addresses[0].address;
				}
			}
		}
		for (const key of [
			"to",
			"cc",
			"bcc",
			"reply-to"
		]) {
			const addresses = [];
			for (const entry of this.root.headers) if (entry.key === key && entry.value) for (const address of addressParser(entry.value)) addresses.push(address);
			if (addresses.length) {
				const camelKey = toCamelCase(key);
				message[camelKey] = addresses;
			}
		}
		for (const key of [
			"subject",
			"message-id",
			"in-reply-to",
			"references"
		]) {
			const header = this.root.headers.find((line) => line.key === key);
			if (header && header.value) {
				const camelKey = toCamelCase(key);
				message[camelKey] = decodeWords(header.value);
			}
		}
		let dateHeader = this.root.headers.find((line) => line.key === "date");
		if (dateHeader) {
			let date = new Date(dateHeader.value);
			if (date.toString() === "Invalid Date") date = dateHeader.value;
			else date = date.toISOString();
			message.date = date;
		}
		if (this.textContent?.html) message.html = this.textContent.html;
		if (this.textContent?.plain) message.text = this.textContent.plain;
		message.attachments = this.attachments;
		message.headerLines = (this.root.rawHeaderLines || []).slice();
		switch (this.attachmentEncoding) {
			case "arraybuffer": break;
			case "base64":
				for (let attachment of message.attachments || []) if (attachment?.content) {
					attachment.content = base64ArrayBuffer(attachment.content);
					attachment.encoding = "base64";
				}
				break;
			case "utf8":
				let attachmentDecoder = new TextDecoder("utf8");
				for (let attachment of message.attachments || []) if (attachment?.content) {
					attachment.content = attachmentDecoder.decode(attachment.content);
					attachment.encoding = "utf8";
				}
				break;
			default: throw new Error("Unknown attachment encoding");
		}
		return message;
	}
};
//#endregion
export { PostalMime as default };
