import { Jt as resolveFileViewerChmWorkerUrl, Kt as resolveFileViewerChmWasmModuleUrl, gt as DEFAULT_FILE_VIEWER_CHM_WORKER_PATH, ht as DEFAULT_FILE_VIEWER_CHM_WASM_PATH, mt as DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PATH, qt as resolveFileViewerChmWasmUrl } from "./dist-B6GcL3C6.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-chm@3.1.2/node_modules/@file-viewer/renderer-chm/dist/security.js
var CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
var MAX_CHM_PATH_LENGTH = 4096;
var ABSOLUTE_SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;
var EXTERNAL_SCHEMES = /* @__PURE__ */ new Set([
	"http",
	"https",
	"mailto",
	"tel"
]);
var BLOCKED_SCHEMES = /* @__PURE__ */ new Set([
	"about",
	"blob",
	"file",
	"ftp",
	"javascript",
	"resource",
	"shell",
	"vbscript"
]);
var MAX_CHM_HTML_TEXT_LENGTH = 16777216;
var MAX_CHM_HTML_MARKUP_TOKENS = 1e5;
var MAX_CHM_SVG_TEXT_LENGTH = 8388608;
var MAX_CHM_SVG_MARKUP_TOKENS = 5e4;
var MAX_CHM_CSS_TEXT_LENGTH = 4194304;
var createStringBuilder = (maxLength = Number.POSITIVE_INFINITY) => {
	const chunks = [];
	let buffer = "";
	let length = 0;
	const append = (value) => {
		if (!value || length >= maxLength) return;
		const remaining = maxLength - length;
		const next = value.length > remaining ? value.slice(0, remaining) : value;
		length += next.length;
		if (buffer.length + next.length <= 16384) {
			buffer += next;
			return;
		}
		if (buffer) chunks.push(buffer);
		if (next.length > 16384) {
			chunks.push(next);
			buffer = "";
		} else buffer = next;
	};
	return {
		append,
		get length() {
			return length;
		},
		finish: () => {
			if (buffer) chunks.push(buffer);
			return chunks.join("");
		}
	};
};
var assertChmMarkupBudget = (source, maxLength, maxTokens, kind) => {
	if (source.length > maxLength) throw new Error(`CHM_LIMIT_EXCEEDED: ${kind} text exceeds ${maxLength} characters.`);
	let tokens = 0;
	let tagTokens = 0;
	let inTag = false;
	let inTagToken = false;
	let quote = "";
	const maxTagTokens = maxTokens * 3;
	for (let index = 0; index < source.length; index += 1) {
		const character = source[index];
		if (!quote && character === "<") {
			tokens += 1;
			if (tokens > maxTokens) throw new Error(`CHM_LIMIT_EXCEEDED: ${kind} markup exceeds ${maxTokens} tokens.`);
			if (!inTag) {
				inTag = true;
				inTagToken = false;
			}
			continue;
		}
		if (!inTag) continue;
		if (quote) {
			if (character === quote) quote = "";
			continue;
		}
		if (character === "\"" || character === "'") {
			quote = character;
			continue;
		}
		if (character === ">") {
			inTag = false;
			inTagToken = false;
			continue;
		}
		if (isAsciiWhitespace(character)) {
			inTagToken = false;
			continue;
		}
		if (!inTagToken) {
			inTagToken = true;
			tagTokens += 1;
			if (tagTokens > maxTagTokens) throw new Error(`CHM_LIMIT_EXCEEDED: ${kind} markup exceeds ${maxTagTokens} tag fields.`);
		}
	}
};
var assertChmSvgSourceSafety = (source) => {
	assertChmMarkupBudget(source, MAX_CHM_SVG_TEXT_LENGTH, MAX_CHM_SVG_MARKUP_TOKENS, "SVG");
	for (let index = 0; index + 2 < source.length; index += 1) {
		if (source[index] !== "<" || source[index + 1] !== "!") continue;
		let cursor = index + 2;
		while (isAsciiWhitespace(source[cursor])) cursor += 1;
		let end = cursor;
		while (end < source.length) {
			const code = source.charCodeAt(end);
			if (!(code >= 65 && code <= 90 || code >= 97 && code <= 122)) break;
			end += 1;
		}
		const keyword = source.slice(cursor, end).toLowerCase();
		if (keyword === "doctype" || keyword === "entity") throw new Error(`CHM_SECURITY_BLOCKED: SVG ${keyword.toUpperCase()} declarations are disabled.`);
	}
};
var safeDecodeURIComponent = (value) => {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
};
var normalizeChmPath = (input) => {
	if (typeof input !== "string" || CONTROL_CHARACTER_PATTERN.test(input)) return null;
	const trimmed = input.trim();
	if (!trimmed || trimmed.length > MAX_CHM_PATH_LENGTH) return null;
	const decoded = safeDecodeURIComponent(trimmed);
	if (/^(?:[a-z]:[\\/]|[\\/]{2})/i.test(decoded)) return null;
	const source = decoded.replace(/\\/g, "/");
	const segments = [];
	for (const segment of source.split("/")) {
		if (!segment || segment === ".") continue;
		if (segment === "..") {
			if (!segments.length) return null;
			segments.pop();
			continue;
		}
		if (CONTROL_CHARACTER_PATTERN.test(segment)) return null;
		segments.push(segment);
	}
	return `/${segments.join("/")}`;
};
var splitReference = (value) => {
	const hashIndex = value.indexOf("#");
	const fragment = hashIndex >= 0 ? safeDecodeURIComponent(value.slice(hashIndex + 1)) : "";
	const withoutFragment = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
	const queryIndex = withoutFragment.indexOf("?");
	return {
		path: queryIndex >= 0 ? withoutFragment.slice(0, queryIndex) : withoutFragment,
		fragment
	};
};
var unwrapCompiledHelpUrl = (value) => {
	const delimiter = value.indexOf("::");
	return delimiter >= 0 ? value.slice(delimiter + 2) : "";
};
var resolveChmReference = (basePath, rawUrl) => {
	if (typeof rawUrl !== "string") return { kind: "blocked" };
	let value = rawUrl.trim();
	if (!value || CONTROL_CHARACTER_PATTERN.test(value)) return { kind: "blocked" };
	if (value.startsWith("#")) return {
		kind: "fragment",
		fragment: safeDecodeURIComponent(value.slice(1))
	};
	if (value.startsWith("//")) return {
		kind: "external",
		url: value
	};
	const schemeMatch = value.match(ABSOLUTE_SCHEME_PATTERN);
	if (schemeMatch) {
		const scheme = schemeMatch[1].toLowerCase();
		if (scheme === "ms-its" || scheme === "mk" || scheme === "its") {
			value = unwrapCompiledHelpUrl(value);
			if (!value) return { kind: "blocked" };
		} else if (scheme === "data") return /^data:image\/(?:avif|bmp|gif|jpeg|png|webp);/i.test(value) ? {
			kind: "data",
			url: value
		} : { kind: "blocked" };
		else if (EXTERNAL_SCHEMES.has(scheme)) return {
			kind: "external",
			url: value
		};
		else if (BLOCKED_SCHEMES.has(scheme) || scheme) return { kind: "blocked" };
	}
	const { path: rawPath, fragment } = splitReference(value);
	if (!rawPath && fragment) return {
		kind: "fragment",
		fragment
	};
	const normalizedBase = normalizeChmPath(basePath) || "/";
	const baseDirectory = normalizedBase.includes("/") ? normalizedBase.slice(0, normalizedBase.lastIndexOf("/") + 1) : "";
	const path = normalizeChmPath(rawPath.startsWith("/") ? rawPath : `${baseDirectory}${rawPath}`);
	if (path == null || path === "/") return { kind: "blocked" };
	return {
		kind: "internal",
		path,
		fragment: fragment || void 0
	};
};
var normalizeEncoding = (value) => {
	const normalized = (value || "").trim().toLowerCase().replace(/_/g, "-");
	if (!normalized) return "";
	if (normalized === "utf8") return "utf-8";
	if (normalized === "gbk" || normalized === "cp936") return "gb18030";
	if (normalized === "big5-hkscs") return "big5";
	if (normalized === "shift-jis" || normalized === "sjis" || normalized === "cp932") return "shift_jis";
	if (normalized === "euc-kr" || normalized === "cp949") return "euc-kr";
	if (/^windows-?\d+$/.test(normalized)) return normalized.replace(/^windows-?/, "windows-");
	if (/^cp\d+$/.test(normalized)) return normalized.replace(/^cp/, "windows-");
	return normalized;
};
var sniffHtmlEncoding = (bytes) => {
	var _a;
	const prefix = bytes.subarray(0, Math.min(bytes.byteLength, 8192));
	let ascii = "";
	for (let index = 0; index < prefix.byteLength; index += 1) {
		const value = prefix[index];
		ascii += value >= 32 && value <= 126 ? String.fromCharCode(value) : " ";
	}
	let position = 0;
	while (position < ascii.length) {
		const open = ascii.indexOf("<", position);
		if (open < 0) break;
		if (ascii.startsWith("<!--", open)) {
			const end = ascii.indexOf("-->", open + 4);
			position = end < 0 ? ascii.length : end + 3;
			continue;
		}
		let cursor = open + 1;
		const nameStart = cursor;
		while (isHtmlNameCharacter(ascii[cursor])) cursor += 1;
		const name = ascii.slice(nameStart, cursor).toLowerCase();
		const end = scanHtmlTagEnd(ascii, cursor);
		position = name === "script" || name === "style" ? skipHtmlRawTextElement(ascii, end, name) : end;
		if (name !== "meta") continue;
		const attributes = /* @__PURE__ */ new Map();
		while (cursor < end && ascii[cursor] !== ">") {
			if (!isHtmlNameCharacter(ascii[cursor])) {
				cursor += 1;
				continue;
			}
			const start = cursor;
			while (isHtmlNameCharacter(ascii[cursor])) cursor += 1;
			const attribute = ascii.slice(start, cursor).toLowerCase();
			while (isAsciiWhitespace(ascii[cursor])) cursor += 1;
			if (ascii[cursor] !== "=") continue;
			cursor += 1;
			while (isAsciiWhitespace(ascii[cursor])) cursor += 1;
			const quote = ascii[cursor] === "\"" || ascii[cursor] === "'" ? ascii[cursor++] : "";
			const valueStart = cursor;
			if (quote) while (cursor < end && ascii[cursor] !== quote) cursor += 1;
			else while (cursor < end && !isAsciiWhitespace(ascii[cursor]) && ascii[cursor] !== ">") cursor += 1;
			if (!attributes.has(attribute)) attributes.set(attribute, ascii.slice(valueStart, cursor));
			if (quote && ascii[cursor] === quote) cursor += 1;
		}
		let encoding = attributes.get("charset");
		if (!encoding) for (const parameter of (attributes.get("content") || "").split(";")) {
			const equals = parameter.indexOf("=");
			if (equals >= 0 && parameter.slice(0, equals).trim().toLowerCase() === "charset") {
				encoding = parameter.slice(equals + 1);
				break;
			}
		}
		const token = (_a = encoding === null || encoding === void 0 ? void 0 : encoding.trim().match(/^[^\s"'/>;]+/)) === null || _a === void 0 ? void 0 : _a[0];
		if (token) return normalizeEncoding(token);
	}
	return "";
};
var decodeWith = (bytes, encoding) => {
	try {
		return new TextDecoder(encoding, { fatal: false }).decode(bytes);
	} catch {
		return "";
	}
};
var decodeChmText = (bytes, fallbackEncoding = "windows-1252") => {
	if (bytes.byteLength >= 3 && bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191) return decodeWith(bytes.subarray(3), "utf-8");
	if (bytes.byteLength >= 2 && bytes[0] === 255 && bytes[1] === 254) return decodeWith(bytes.subarray(2), "utf-16le");
	if (bytes.byteLength >= 2 && bytes[0] === 254 && bytes[1] === 255) {
		const swapped = new Uint8Array(bytes.byteLength - 2);
		for (let index = 2; index + 1 < bytes.byteLength; index += 2) {
			swapped[index - 2] = bytes[index + 1];
			swapped[index - 1] = bytes[index];
		}
		return decodeWith(swapped, "utf-16le");
	}
	const candidates = [
		sniffHtmlEncoding(bytes),
		normalizeEncoding(fallbackEncoding),
		"utf-8",
		"windows-1252"
	];
	for (const encoding of candidates) {
		if (!encoding) continue;
		const decoded = decodeWith(bytes, encoding);
		if (decoded) return decoded.replace(/^\ufeff/, "");
	}
	return "";
};
var isAsciiWhitespace = (character) => character === " " || character === "	" || character === "\n" || character === "\f" || character === "\r";
var isHtmlNameCharacter = (character) => {
	if (!character) return false;
	const code = character.charCodeAt(0);
	return code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || character === ":" || character === "_" || character === "-";
};
var startsWithAsciiCaseInsensitive = (source, index, expected) => {
	if (index + expected.length > source.length) return false;
	for (let offset = 0; offset < expected.length; offset += 1) {
		const actual = source.charCodeAt(index + offset);
		const wanted = expected.charCodeAt(offset);
		if ((actual >= 65 && actual <= 90 ? actual + 32 : actual) !== wanted) return false;
	}
	return true;
};
var scanHtmlTagEnd = (source, start) => {
	let index = start;
	let quote = "";
	while (index < source.length) {
		const character = source[index];
		if (quote) {
			if (character === quote) quote = "";
		} else if (character === "\"" || character === "'") quote = character;
		else if (character === ">") return index + 1;
		index += 1;
	}
	return source.length;
};
var skipHtmlRawTextElement = (source, start, name) => {
	let index = start;
	while (index < source.length) {
		if (source[index] === "<" && source[index + 1] === "/" && startsWithAsciiCaseInsensitive(source, index + 2, name) && !isHtmlNameCharacter(source[index + 2 + name.length])) return scanHtmlTagEnd(source, index + 2 + name.length);
		index += 1;
	}
	return source.length;
};
var INTERNAL_RESOURCE_SCHEME = "chm-internal:";
var MAX_CHM_TOPIC_RESOURCE_PATHS = 2048;
var MAX_CHM_CSS_RESOURCE_PATHS = 1024;
var isHexDigit = (character) => {
	if (!character) return false;
	const code = character.charCodeAt(0);
	return code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102;
};
var isCssIdentifierCharacter = (character) => {
	if (!character) return false;
	const code = character.charCodeAt(0);
	return code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || character === "_" || character === "-";
};
var normalizeCssSyntax = (css) => {
	const output = createStringBuilder();
	let index = 0;
	let spanStart = 0;
	while (index < css.length) {
		if (css[index] === "/" && css[index + 1] === "*") {
			output.append(css.slice(spanStart, index));
			const end = css.indexOf("*/", index + 2);
			if (end < 0) {
				index = css.length;
				spanStart = index;
				break;
			}
			index = end + 2;
			spanStart = index;
			continue;
		}
		if (css[index] !== "\\") {
			index += 1;
			continue;
		}
		output.append(css.slice(spanStart, index));
		const next = css[index + 1];
		if (next === "\n" || next === "\f") {
			index += 2;
			spanStart = index;
			continue;
		}
		if (next === "\r") {
			index += css[index + 2] === "\n" ? 3 : 2;
			spanStart = index;
			continue;
		}
		let cursor = index + 1;
		while (cursor < css.length && cursor < index + 7 && isHexDigit(css[cursor])) cursor += 1;
		if (cursor > index + 1) {
			const hex = css.slice(index + 1, cursor);
			const codePoint = Number.parseInt(hex, 16);
			if (css[cursor] === "\r" && css[cursor + 1] === "\n") cursor += 2;
			else if (/[\t\n\f\r ]/.test(css[cursor] || "")) cursor += 1;
			const decoded = codePoint > 0 && codePoint <= 1114111 ? String.fromCodePoint(codePoint) : "�";
			if (/^["'();\\]$/.test(decoded)) output.append(`\\${hex} `);
			else output.append(decoded);
			index = cursor;
			spanStart = index;
			continue;
		}
		if (next) {
			if (/^["'();\\]$/.test(next)) output.append(`\\${next}`);
			else output.append(next);
			index += 2;
		} else index += 1;
		spanStart = index;
	}
	output.append(css.slice(spanStart));
	return output.finish();
};
var stripCssImports = (css) => {
	const output = createStringBuilder();
	let index = 0;
	let spanStart = 0;
	while (index < css.length) {
		if (!(css[index] === "@" && css.slice(index, index + 7).toLowerCase() === "@import" && !isCssIdentifierCharacter(css[index + 7]))) {
			index += 1;
			continue;
		}
		output.append(css.slice(spanStart, index));
		index += 7;
		let quote = "";
		let parenthesisDepth = 0;
		while (index < css.length) {
			const character = css[index];
			if (character === "\\") {
				index = Math.min(css.length, index + 2);
				continue;
			}
			if (quote) {
				if (character === quote) quote = "";
			} else if (character === "\"" || character === "'") quote = character;
			else if (character === "(") parenthesisDepth += 1;
			else if (character === ")" && parenthesisDepth > 0) parenthesisDepth -= 1;
			else if (character === ";" && parenthesisDepth === 0) {
				index += 1;
				break;
			}
			index += 1;
		}
		spanStart = index;
	}
	output.append(css.slice(spanStart));
	return output.finish();
};
var matchCssFunction = (css, index, name) => {
	if (isCssIdentifierCharacter(css[index - 1]) || css.slice(index, index + name.length).toLowerCase() !== name) return -1;
	let cursor = index + name.length;
	if (isCssIdentifierCharacter(css[cursor])) return -1;
	while (/[\t\n\f\r ]/.test(css[cursor] || "")) cursor += 1;
	return css[cursor] === "(" ? cursor : -1;
};
var readCssFunction = (css, openParenthesis) => {
	let cursor = openParenthesis + 1;
	let depth = 1;
	let quote = "";
	while (cursor < css.length) {
		const character = css[cursor];
		if (character === "\\") {
			cursor = Math.min(css.length, cursor + 2);
			continue;
		}
		if (quote) {
			if (character === quote) quote = "";
		} else if (character === "\"" || character === "'") quote = character;
		else if (character === "(") depth += 1;
		else if (character === ")") {
			depth -= 1;
			if (depth === 0) return {
				body: css.slice(openParenthesis + 1, cursor),
				end: cursor + 1
			};
		}
		cursor += 1;
	}
	return {
		body: css.slice(openParenthesis + 1),
		end: css.length
	};
};
var matchDangerousDeclaration = (css, index) => {
	if (isCssIdentifierCharacter(css[index - 1])) return -1;
	for (const name of ["behavior", "-moz-binding"]) {
		if (css.slice(index, index + name.length).toLowerCase() !== name) continue;
		let cursor = index + name.length;
		if (isCssIdentifierCharacter(css[cursor])) continue;
		while (/[\t\n\f\r ]/.test(css[cursor] || "")) cursor += 1;
		if (css[cursor] === ":") return cursor + 1;
	}
	return -1;
};
var skipCssDeclarationValue = (css, start) => {
	let cursor = start;
	let depth = 0;
	let quote = "";
	while (cursor < css.length) {
		const character = css[cursor];
		if (character === "\\") {
			cursor = Math.min(css.length, cursor + 2);
			continue;
		}
		if (quote) {
			if (character === quote) quote = "";
		} else if (character === "\"" || character === "'") quote = character;
		else if (character === "(") depth += 1;
		else if (character === ")" && depth > 0) depth -= 1;
		else if (depth === 0 && (character === ";" || character === "}")) return character === ";" ? cursor + 1 : cursor;
		cursor += 1;
	}
	return cursor;
};
var recordResourcePath = (resources, path, maxResourcePaths) => {
	if (resources.has(path)) return true;
	if (resources.size >= maxResourcePaths) return false;
	resources.add(path);
	return true;
};
var sanitizeCss = (css, basePath, resources, maxResourcePaths) => {
	if (css.length > 4194304) return "";
	const source = stripCssImports(normalizeCssSyntax(css));
	const output = createStringBuilder();
	let index = 0;
	let spanStart = 0;
	while (index < source.length) {
		const character = source[index];
		if (character === "\"" || character === "'") {
			index += 1;
			while (index < source.length) if (source[index] === "\\") index = Math.min(source.length, index + 2);
			else if (source[index++] === character) break;
			else index += 0;
			continue;
		}
		const declarationStart = matchDangerousDeclaration(source, index);
		if (declarationStart >= 0) {
			output.append(source.slice(spanStart, index));
			index = skipCssDeclarationValue(source, declarationStart);
			spanStart = index;
			continue;
		}
		const expressionStart = matchCssFunction(source, index, "expression");
		if (expressionStart >= 0) {
			output.append(source.slice(spanStart, index));
			index = readCssFunction(source, expressionStart).end;
			spanStart = index;
			continue;
		}
		const urlStart = matchCssFunction(source, index, "url");
		if (urlStart >= 0) {
			output.append(source.slice(spanStart, index));
			const parsed = readCssFunction(source, urlStart);
			let raw = parsed.body.trim();
			if (raw.startsWith("\"") && raw.endsWith("\"") || raw.startsWith("'") && raw.endsWith("'")) raw = raw.slice(1, -1).trim();
			const resolved = resolveChmReference(basePath, raw);
			if (resolved.kind === "data" && resolved.url) output.append(`url("${resolved.url.replace(/"/g, "%22")}")`);
			else if (resolved.kind === "fragment" && resolved.fragment && /^[\w:.-]+$/.test(resolved.fragment)) output.append(`url("#${resolved.fragment}")`);
			else if (resolved.kind === "internal" && resolved.path && recordResourcePath(resources, resolved.path, maxResourcePaths)) output.append(`url("${INTERNAL_RESOURCE_SCHEME}${encodeURIComponent(resolved.path)}")`);
			else output.append("url(\"\")");
			index = parsed.end;
			spanStart = index;
			continue;
		}
		index += 1;
	}
	output.append(source.slice(spanStart));
	return output.finish();
};
var sanitizeEmbeddedCssAttribute = (value, basePath) => sanitizeCss(value, basePath, /* @__PURE__ */ new Set(), 0);
var sanitizeChmCss = (css, basePath, maxResourcePaths = MAX_CHM_CSS_RESOURCE_PATHS) => {
	const resources = /* @__PURE__ */ new Set();
	return {
		css: sanitizeCss(css, basePath, resources, maxResourcePaths),
		resourcePaths: Array.from(resources)
	};
};
var RESOURCE_ATTRIBUTES = [
	["img", "src"],
	["source", "src"],
	["audio", "src"],
	["video", "src"],
	["video", "poster"],
	["track", "src"],
	["input", "src"],
	["img", "lowsrc"],
	["img", "dynsrc"],
	["body", "background"],
	["table", "background"],
	["td", "background"],
	["th", "background"],
	["image", "href"],
	["image", "xlink:href"],
	["use", "href"],
	["use", "xlink:href"],
	["feImage", "href"],
	["feImage", "xlink:href"]
];
var removeUnsafeElements = (document) => {
	document.querySelectorAll("script,object,embed,applet,iframe,frame,frameset,form,input,button,textarea,select,option,base,noscript,template,foreignObject,animate,animateMotion,set").forEach((element) => element.remove());
	document.querySelectorAll("meta[http-equiv]").forEach((element) => element.remove());
};
var sanitizeChmHtmlDocument = (html, basePath, serialize = true) => {
	if (typeof DOMParser === "undefined") throw new Error("CHM_SECURITY_DOM_UNAVAILABLE: DOMParser is required to sanitize CHM topics.");
	assertChmMarkupBudget(html, MAX_CHM_HTML_TEXT_LENGTH, MAX_CHM_HTML_MARKUP_TOKENS, "HTML");
	const document = new DOMParser().parseFromString(html, "text/html");
	const resources = /* @__PURE__ */ new Set();
	removeUnsafeElements(document);
	document.querySelectorAll("*").forEach((element) => {
		for (const attribute of Array.from(element.attributes)) {
			const name = attribute.name.toLowerCase();
			if (name.startsWith("on") || name === "srcdoc" || name === "ping" || name === "formaction") element.removeAttribute(attribute.name);
		}
		const inlineStyle = element.getAttribute("style");
		if (inlineStyle) element.setAttribute("style", sanitizeCss(inlineStyle, basePath, resources, MAX_CHM_TOPIC_RESOURCE_PATHS));
		for (const attribute of Array.from(element.attributes)) {
			if (attribute.name.toLowerCase() === "style") continue;
			if (/(?:url\s*\(|@import\b|expression\s*\(|behavior\s*:|-moz-binding|\\|\/\*)/i.test(attribute.value)) element.setAttribute(attribute.name, sanitizeEmbeddedCssAttribute(attribute.value, basePath));
		}
	});
	document.querySelectorAll("style").forEach((style) => {
		style.textContent = sanitizeCss(style.textContent || "", basePath, resources, MAX_CHM_TOPIC_RESOURCE_PATHS);
	});
	document.querySelectorAll("a,area").forEach((element) => {
		const hasXlink = element.hasAttribute("xlink:href") || element.hasAttributeNS("http://www.w3.org/1999/xlink", "href");
		if (!element.hasAttribute("href") && !hasXlink) return;
		const resolved = resolveChmReference(basePath, element.getAttribute("href") || element.getAttribute("xlink:href") || element.getAttributeNS("http://www.w3.org/1999/xlink", "href") || "");
		element.removeAttribute("href");
		element.removeAttribute("xlink:href");
		element.removeAttributeNS("http://www.w3.org/1999/xlink", "href");
		element.setAttribute("data-chm-link-kind", resolved.kind);
		if (resolved.path) element.setAttribute("data-chm-path", resolved.path);
		if (resolved.fragment) element.setAttribute("data-chm-fragment", resolved.fragment);
		if (resolved.kind === "internal" || resolved.kind === "fragment") element.setAttribute("href", "#");
		else {
			element.setAttribute("aria-disabled", "true");
			element.setAttribute("title", "External and active links are disabled in CHM preview.");
		}
	});
	document.querySelectorAll("link[href]").forEach((element) => {
		const relation = (element.getAttribute("rel") || "").toLowerCase().split(/\s+/);
		const resolved = resolveChmReference(basePath, element.getAttribute("href") || "");
		element.removeAttribute("href");
		if (!relation.includes("stylesheet") || resolved.kind !== "internal" || !resolved.path) {
			element.remove();
			return;
		}
		if (!recordResourcePath(resources, resolved.path, 2048)) {
			element.remove();
			return;
		}
		element.setAttribute("data-chm-resource-href", resolved.path);
	});
	for (const [selector, attribute] of RESOURCE_ATTRIBUTES) document.querySelectorAll(`${selector}[${attribute.replace(":", "\\:")}]`).forEach((element) => {
		const resolved = resolveChmReference(basePath, element.getAttribute(attribute) || "");
		element.removeAttribute(attribute);
		if (resolved.kind === "fragment" && resolved.fragment) element.setAttribute(attribute, `#${resolved.fragment}`);
		else if (resolved.kind === "data" && resolved.url) element.setAttribute(attribute, resolved.url);
		else if (resolved.kind === "internal" && resolved.path && recordResourcePath(resources, resolved.path, 2048)) element.setAttribute(`data-chm-resource-${attribute.replace(":", "-")}`, resolved.path);
	});
	document.querySelectorAll("[srcset]").forEach((element) => element.removeAttribute("srcset"));
	const csp = document.createElement("meta");
	csp.setAttribute("http-equiv", "Content-Security-Policy");
	csp.setAttribute("content", [
		"default-src 'none'",
		"script-src 'none'",
		"style-src 'unsafe-inline' blob:",
		"img-src data: blob:",
		"font-src data: blob:",
		"media-src data: blob:",
		"connect-src 'none'",
		"object-src 'none'",
		"frame-src 'none'",
		"worker-src 'none'",
		"base-uri 'none'",
		"form-action 'none'"
	].join("; "));
	document.head.prepend(csp);
	const viewerStyle = document.createElement("style");
	viewerStyle.textContent = [
		":root{color-scheme:light dark}",
		"html,body{min-height:100%;margin:0}",
		"body{padding:24px;box-sizing:border-box;background:#fff;color:#172033;font:16px/1.65 system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;overflow-wrap:anywhere}",
		"img,video,svg,table{max-width:100%}",
		"pre{white-space:pre-wrap}",
		"a[aria-disabled=true]{color:inherit;text-decoration:line-through;cursor:not-allowed}",
		"@media(prefers-color-scheme:dark){body{background:#111827;color:#e5eef8}a{color:#7dd3fc}}"
	].join("");
	document.head.append(viewerStyle);
	return {
		document,
		html: serialize ? `<!doctype html>${document.documentElement.outerHTML}` : "",
		title: document.title || "",
		resourcePaths: Array.from(resources)
	};
};
var CHM_INTERNAL_RESOURCE_SCHEME = INTERNAL_RESOURCE_SCHEME;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-chm@3.1.2/node_modules/@file-viewer/renderer-chm/dist/model.js
var DEFAULT_CHM_OPTIONS = Object.freeze({
	workerTimeoutMs: 6e4,
	maxArchiveBytes: 335544320,
	maxEntries: 5e4,
	maxEntryBytes: 33554432,
	maxTotalDecompressedBytes: 536870912,
	maxHtmlBytes: 16777216,
	maxSearchTopics: 1e4,
	maxSearchResults: 200
});
var MIB = 1048576;
var CHM_HARD_LIMITS = Object.freeze({
	maxArchiveBytes: 1024 * MIB,
	maxEntries: 25e4,
	maxEntryBytes: 512 * MIB,
	maxTotalDecompressedBytes: 8192 * MIB,
	maxHtmlBytes: 64 * MIB
});
var finiteLimit = (value, fallback, minimum, maximum = Number.MAX_SAFE_INTEGER) => {
	if (!Number.isFinite(value) || value == null) return fallback;
	return Math.min(maximum, Math.max(minimum, Math.floor(value)));
};
var resolveChmOptions = (options) => ({
	workerTimeoutMs: finiteLimit(options === null || options === void 0 ? void 0 : options.workerTimeoutMs, DEFAULT_CHM_OPTIONS.workerTimeoutMs, 1e3),
	maxArchiveBytes: finiteLimit(options === null || options === void 0 ? void 0 : options.maxArchiveBytes, DEFAULT_CHM_OPTIONS.maxArchiveBytes, 1, CHM_HARD_LIMITS.maxArchiveBytes),
	maxEntries: finiteLimit(options === null || options === void 0 ? void 0 : options.maxEntries, DEFAULT_CHM_OPTIONS.maxEntries, 1, CHM_HARD_LIMITS.maxEntries),
	maxEntryBytes: finiteLimit(options === null || options === void 0 ? void 0 : options.maxEntryBytes, DEFAULT_CHM_OPTIONS.maxEntryBytes, 1, CHM_HARD_LIMITS.maxEntryBytes),
	maxTotalDecompressedBytes: finiteLimit(options === null || options === void 0 ? void 0 : options.maxTotalDecompressedBytes, DEFAULT_CHM_OPTIONS.maxTotalDecompressedBytes, 1, CHM_HARD_LIMITS.maxTotalDecompressedBytes),
	maxHtmlBytes: finiteLimit(options === null || options === void 0 ? void 0 : options.maxHtmlBytes, DEFAULT_CHM_OPTIONS.maxHtmlBytes, 1, CHM_HARD_LIMITS.maxHtmlBytes),
	maxSearchTopics: finiteLimit(options === null || options === void 0 ? void 0 : options.maxSearchTopics, DEFAULT_CHM_OPTIONS.maxSearchTopics, 1),
	maxSearchResults: finiteLimit(options === null || options === void 0 ? void 0 : options.maxSearchResults, DEFAULT_CHM_OPTIONS.maxSearchResults, 1)
});
var stringValue = (value) => typeof value === "string" ? value : "";
var numberValue = (value) => typeof value === "number" && Number.isFinite(value) ? value : void 0;
var booleanValue = (value) => value === true;
var normalizeTopic = (value) => {
	var _a;
	if (!value || typeof value !== "object") return null;
	const source = value;
	const path = stringValue(source.path || source.local || source.url);
	if (!path) return null;
	return {
		title: stringValue(source.title || source.name) || path,
		path,
		contextId: numberValue((_a = source.contextId) !== null && _a !== void 0 ? _a : source.context_id)
	};
};
var normalizeNavigationNodes = (value) => {
	if (!Array.isArray(value)) return [];
	const roots = [];
	const queue = [];
	for (let index = value.length - 1; index >= 0; index -= 1) queue.push({
		source: value[index],
		target: roots
	});
	while (queue.length) {
		const current = queue.pop();
		if (!(current === null || current === void 0 ? void 0 : current.source) || typeof current.source !== "object") continue;
		const source = current.source;
		const children = [];
		const node = {
			title: stringValue(source.title || source.name || source.keyword) || stringValue(source.path || source.local),
			path: stringValue(source.path || source.local || source.url) || void 0,
			keyword: stringValue(source.keyword) || void 0,
			children
		};
		current.target.push(node);
		const aliases = Array.isArray(source.locals) ? source.locals.filter((item) => typeof item === "string" && Boolean(item)) : [];
		if (!node.path && aliases.length) node.path = aliases[0];
		for (let index = node.path ? 1 : 0; index < aliases.length; index += 1) children.push({
			title: `${node.title} · ${index + 1}`,
			path: aliases[index],
			children: []
		});
		const sourceChildren = Array.isArray(source.children) ? source.children : [];
		for (let index = sourceChildren.length - 1; index >= 0; index -= 1) queue.push({
			source: sourceChildren[index],
			target: children
		});
	}
	return roots;
};
var normalizeChmManifest = (value) => {
	var _a, _b, _c, _d, _e, _f;
	const source = value && typeof value === "object" ? value : {};
	const topics = Array.isArray(source.topics) ? source.topics.map(normalizeTopic).filter((topic) => Boolean(topic)) : [];
	return {
		title: stringValue(source.title),
		homePath: stringValue((_a = source.homePath) !== null && _a !== void 0 ? _a : source.home_path),
		encoding: stringValue(source.encoding) || "windows-1252",
		language: stringValue(source.language) || void 0,
		topics,
		contents: normalizeNavigationNodes((_b = source.contents) !== null && _b !== void 0 ? _b : source.toc),
		index: normalizeNavigationNodes((_c = source.index) !== null && _c !== void 0 ? _c : source.keywords),
		hasBinaryToc: booleanValue((_d = source.hasBinaryToc) !== null && _d !== void 0 ? _d : source.has_binary_toc),
		hasBinaryIndex: booleanValue((_e = source.hasBinaryIndex) !== null && _e !== void 0 ? _e : source.has_binary_index),
		hasFullTextIndex: booleanValue((_f = source.hasFullTextIndex) !== null && _f !== void 0 ? _f : source.has_full_text_index) || Boolean(source.fullTextIndex && typeof source.fullTextIndex === "object" && source.fullTextIndex.available)
	};
};
var normalizeChmEntries = (value) => {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item) => {
		var _a, _b, _c, _d;
		if (!item || typeof item !== "object") return [];
		const source = item;
		const path = stringValue(source.path || source.name);
		if (!path) return [];
		return [{
			path,
			size: (_d = numberValue((_c = (_b = (_a = source.size) !== null && _a !== void 0 ? _a : source.length) !== null && _b !== void 0 ? _b : source.byteLength) !== null && _c !== void 0 ? _c : source.byte_length)) !== null && _d !== void 0 ? _d : 0,
			section: numberValue(source.section)
		}];
	});
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-chm@3.1.2/node_modules/@file-viewer/renderer-chm/dist/workerClient.js
var DEFAULT_CHM_WORKER_PATH = DEFAULT_FILE_VIEWER_CHM_WORKER_PATH;
var DEFAULT_CHM_WASM_MODULE_PATH = DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PATH;
var DEFAULT_CHM_WASM_PATH = DEFAULT_FILE_VIEWER_CHM_WASM_PATH;
var makeWorkerError = (response) => {
	const error = new Error(response.error.message || "CHM Worker failed.");
	error.name = response.error.name || "Error";
	if (response.error.code) Object.defineProperty(error, "code", { value: response.error.code });
	return error;
};
var ChmWorkerClient = class {
	constructor(options, onProgress) {
		this.pending = /* @__PURE__ */ new Map();
		this.requestId = 0;
		this.destroyed = false;
		this.handleMessage = (event) => {
			var _a;
			const response = event.data;
			if (response.type === "progress") {
				(_a = this.onProgress) === null || _a === void 0 || _a.call(this, {
					phase: response.phase,
					current: response.current,
					total: response.total
				});
				return;
			}
			const pending = this.pending.get(response.id);
			if (!pending) return;
			this.pending.delete(response.id);
			clearTimeout(pending.timer);
			if (!response.ok) {
				pending.reject(makeWorkerError(response));
				return;
			}
			if (response.type !== pending.expectedType) {
				pending.reject(/* @__PURE__ */ new Error(`CHM_WORKER_PROTOCOL: expected ${pending.expectedType}, received ${response.type}.`));
				return;
			}
			pending.resolve(response);
		};
		this.handleError = (event) => {
			this.fail(new Error(event.message || "CHM Worker failed to load."));
		};
		this.handleMessageError = () => {
			this.fail(/* @__PURE__ */ new Error("CHM_WORKER_PROTOCOL: the browser could not deserialize a Worker response."));
		};
		if (typeof Worker === "undefined") throw new Error("CHM_WORKER_UNAVAILABLE: this browser does not support Web Workers.");
		this.options = resolveChmOptions(options);
		const documentBaseUrl = typeof document === "undefined" ? void 0 : document.baseURI;
		this.moduleUrl = resolveFileViewerChmWasmModuleUrl(options, documentBaseUrl);
		this.wasmUrl = resolveFileViewerChmWasmUrl(options, documentBaseUrl);
		this.onProgress = onProgress;
		const workerUrl = resolveFileViewerChmWorkerUrl(options, documentBaseUrl);
		this.worker = new Worker(workerUrl, {
			type: "module",
			name: "file-viewer-chm"
		});
		this.worker.addEventListener("message", this.handleMessage);
		this.worker.addEventListener("error", this.handleError);
		this.worker.addEventListener("messageerror", this.handleMessageError);
	}
	rejectAll(error) {
		for (const pending of this.pending.values()) {
			clearTimeout(pending.timer);
			pending.reject(error);
		}
		this.pending.clear();
	}
	fail(error) {
		if (this.destroyed) return;
		this.destroyed = true;
		this.rejectAll(error);
		this.worker.removeEventListener("message", this.handleMessage);
		this.worker.removeEventListener("error", this.handleError);
		this.worker.removeEventListener("messageerror", this.handleMessageError);
		this.worker.terminate();
	}
	request(request, expectedType, transfer = [], signal) {
		if (this.destroyed) return Promise.reject(/* @__PURE__ */ new Error("CHM_WORKER_CLOSED: the CHM session has been destroyed."));
		if (signal === null || signal === void 0 ? void 0 : signal.aborted) return Promise.reject(new DOMException("CHM operation was aborted.", "AbortError"));
		const id = ++this.requestId;
		return new Promise((resolve, reject) => {
			const onAbort = () => {
				const pending = this.pending.get(id);
				if (!pending) return;
				this.pending.delete(id);
				clearTimeout(pending.timer);
				reject(new DOMException("CHM operation was aborted.", "AbortError"));
			};
			const timer = setTimeout(() => {
				this.pending.delete(id);
				signal === null || signal === void 0 || signal.removeEventListener("abort", onAbort);
				const error = /* @__PURE__ */ new Error(`CHM_WORKER_TIMEOUT: ${expectedType} exceeded ${this.options.workerTimeoutMs}ms.`);
				reject(error);
				this.fail(error);
			}, this.options.workerTimeoutMs);
			this.pending.set(id, {
				expectedType,
				timer,
				resolve: (response) => {
					signal === null || signal === void 0 || signal.removeEventListener("abort", onAbort);
					resolve(response);
				},
				reject: (error) => {
					signal === null || signal === void 0 || signal.removeEventListener("abort", onAbort);
					reject(error);
				}
			});
			signal === null || signal === void 0 || signal.addEventListener("abort", onAbort, { once: true });
			this.worker.postMessage({
				...request,
				id
			}, transfer);
		});
	}
	async open(buffer, signal) {
		if (buffer.byteLength > this.options.maxArchiveBytes) {
			const error = /* @__PURE__ */ new Error(`CHM_LIMIT_EXCEEDED: source is ${buffer.byteLength} bytes; limit is ${this.options.maxArchiveBytes}.`);
			Object.defineProperty(error, "code", { value: "CHM_LIMIT_EXCEEDED" });
			throw error;
		}
		const copy = buffer.slice(0);
		const response = await this.request({
			type: "open",
			buffer: copy,
			moduleUrl: this.moduleUrl,
			wasmUrl: this.wasmUrl,
			limits: {
				maxArchiveBytes: this.options.maxArchiveBytes,
				maxFileBytes: this.options.maxArchiveBytes,
				maxEntries: this.options.maxEntries,
				maxEntryBytes: this.options.maxEntryBytes,
				maxTotalDecompressedBytes: this.options.maxTotalDecompressedBytes,
				maxTotalDeclaredBytes: this.options.maxTotalDecompressedBytes,
				maxMetadataBytes: this.options.maxHtmlBytes,
				maxSitemapNodes: this.options.maxEntries,
				maxSitemapDepth: 256
			}
		}, "open", [copy], signal);
		return {
			manifest: response.manifest,
			entries: response.entries
		};
	}
	async read(path, signal) {
		return (await this.request({
			type: "read",
			path
		}, "read", [], signal)).data;
	}
	async search(query, signal) {
		const response = await this.request({
			type: "search",
			query,
			limit: this.options.maxSearchResults,
			maxTopics: this.options.maxSearchTopics
		}, "search", [], signal);
		return {
			hits: response.hits,
			inspected: response.inspected,
			truncated: response.truncated
		};
	}
	destroy() {
		this.fail(new DOMException("CHM session was destroyed.", "AbortError"));
	}
};
//#endregion
export { resolveChmReference as _, DEFAULT_CHM_OPTIONS as a, resolveChmOptions as c, MAX_CHM_CSS_TEXT_LENGTH as d, MAX_CHM_SVG_TEXT_LENGTH as f, normalizeChmPath as g, decodeChmText as h, DEFAULT_CHM_WORKER_PATH as i, CHM_INTERNAL_RESOURCE_SCHEME as l, assertChmSvgSourceSafety as m, DEFAULT_CHM_WASM_MODULE_PATH as n, normalizeChmEntries as o, MAX_CHM_TOPIC_RESOURCE_PATHS as p, DEFAULT_CHM_WASM_PATH as r, normalizeChmManifest as s, ChmWorkerClient as t, MAX_CHM_CSS_RESOURCE_PATHS as u, sanitizeChmCss as v, sanitizeChmHtmlDocument as y };
