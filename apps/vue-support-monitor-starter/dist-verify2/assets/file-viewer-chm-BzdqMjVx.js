import { Bc as DEFAULT_FILE_VIEWER_CHM_WASM_PATH, Hc as DEFAULT_FILE_VIEWER_CHM_WORKER_PATH, Rc as DEFAULT_FILE_VIEWER_CHM_WASM_MODULE_PATH, Su as resolveFileViewerChmWorkerUrl, bu as resolveFileViewerChmWasmModuleUrl, ud as __vitePreload, wc as DEFAULT_RENDERER_DEFINITIONS, xu as resolveFileViewerChmWasmUrl } from "./file-viewer-3d-ijA7B-Qe.js";
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
//#region ../../node_modules/.pnpm/@file-viewer+renderer-chm@3.1.2/node_modules/@file-viewer/renderer-chm/dist/style.js
var chmViewerStyle = `
.chm-viewer{position:relative;width:100%;height:100%;min-height:480px;display:flex;flex-direction:column;overflow:hidden;background:#edf2f6;color:#182233;font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-sizing:border-box}
.chm-viewer *{box-sizing:border-box}
.chm-header{min-height:62px;display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid rgba(24,34,51,.1);background:rgba(255,255,255,.94)}
.chm-sidebar-toggle{display:none;width:36px;height:36px;border:0;border-radius:10px;background:#e8f3ee;color:#08785c;font:inherit;font-size:19px;cursor:pointer}
.chm-heading{min-width:0;flex:1}.chm-heading h2{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:17px;line-height:1.35}.chm-heading p{margin:2px 0 0;color:#667085;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chm-badges{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}.chm-badge{padding:4px 8px;border-radius:999px;background:#e8f3ee;color:#08785c;font-size:11px;font-weight:750}.chm-badge.is-muted{background:#eef1f4;color:#596579}
.chm-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(230px,300px) minmax(0,1fr)}
.chm-sidebar{min-height:0;display:flex;flex-direction:column;border-right:1px solid rgba(24,34,51,.1);background:#f8fafb}
.chm-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:8px;border-bottom:1px solid rgba(24,34,51,.08)}
.chm-tab{height:34px;border:0;border-radius:8px;background:transparent;color:#647084;font:inherit;font-size:12px;font-weight:750;cursor:pointer}.chm-tab:hover{background:#eef3f5}.chm-tab.is-active{background:#fff;color:#08785c;box-shadow:0 1px 5px rgba(24,34,51,.12)}
.chm-sidebar-panels{flex:1;min-height:0;position:relative}.chm-panel{position:absolute;inset:0;overflow:auto;padding:8px}.chm-panel[hidden]{display:none}
.chm-navigation,.chm-navigation ul{margin:0;padding:0;list-style:none}.chm-navigation ul{padding-left:14px;border-left:1px solid rgba(24,34,51,.09)}
.chm-nav-button,.chm-search-result{width:100%;display:block;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.chm-nav-button{min-height:32px;padding:6px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chm-nav-button:hover,.chm-nav-button.is-active{background:#e7f3ee;color:#08785c}.chm-nav-label{min-height:28px;padding:5px 8px;color:#526073;font-weight:650}
.chm-panel-note{margin:10px;padding:9px 10px;border-radius:8px;background:#fff6df;color:#845a00;font-size:12px}
.chm-search-box{position:sticky;top:-8px;z-index:1;padding:8px 2px;background:#f8fafb}.chm-search-box input{width:100%;height:36px;padding:0 11px;border:1px solid rgba(24,34,51,.16);border-radius:9px;background:#fff;color:inherit;font:inherit;outline:none}.chm-search-box input:focus{border-color:#0a8b68;box-shadow:0 0 0 3px rgba(10,139,104,.12)}
.chm-search-meta{margin:7px 4px;color:#6b7688;font-size:11px}.chm-search-results{display:flex;flex-direction:column;gap:5px}.chm-search-result{padding:9px;background:#fff;border:1px solid rgba(24,34,51,.08)}.chm-search-result:hover{border-color:rgba(10,139,104,.35);box-shadow:0 5px 16px rgba(24,34,51,.07)}.chm-search-result strong,.chm-search-result span{display:block}.chm-search-result strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chm-search-result span{margin-top:3px;color:#677386;font-size:11px;line-height:1.4}.chm-search-result mark{background:#fff1a6;color:inherit}
.chm-topic{min-width:0;min-height:0;display:flex;flex-direction:column;background:#dfe5ea}.chm-topic-bar{min-height:42px;display:flex;align-items:center;gap:8px;padding:7px 12px;background:rgba(255,255,255,.88);border-bottom:1px solid rgba(24,34,51,.08)}.chm-topic-bar strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chm-topic-path{margin-left:auto;max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#6b7688;font-size:11px}
.chm-topic-frame{display:block;flex:1;min-height:0;width:100%;border:0;background:#fff}
.chm-state{position:absolute;inset:62px 0 0;z-index:6;display:flex;align-items:center;justify-content:center;gap:12px;background:rgba(237,242,246,.88);backdrop-filter:blur(2px)}.chm-state[hidden]{display:none}.chm-spinner{width:32px;height:32px;border:3px solid rgba(8,120,92,.16);border-top-color:#08785c;border-radius:999px;animation:chm-spin .85s linear infinite}.chm-state p{margin:0;color:#435168;font-weight:650}
.chm-error{position:absolute;inset:82px 18px auto;z-index:8;width:min(560px,calc(100% - 36px));margin:auto;padding:16px;border:1px solid rgba(190,91,0,.22);border-radius:14px;background:#fff8e9;color:#743f00;box-shadow:0 18px 48px rgba(24,34,51,.18)}.chm-error[hidden]{display:none}.chm-error strong{display:block;font-size:15px}.chm-error p{margin:6px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}
@keyframes chm-spin{to{transform:rotate(360deg)}}
[data-viewer-theme=dark] .chm-viewer{background:#111827;color:#e6edf6}[data-viewer-theme=dark] .chm-header,[data-viewer-theme=dark] .chm-topic-bar{background:#151d2b;border-color:rgba(148,163,184,.18)}[data-viewer-theme=dark] .chm-heading p,[data-viewer-theme=dark] .chm-topic-path{color:#94a3b8}[data-viewer-theme=dark] .chm-sidebar,[data-viewer-theme=dark] .chm-search-box{background:#121a27;border-color:rgba(148,163,184,.18)}[data-viewer-theme=dark] .chm-tab.is-active,[data-viewer-theme=dark] .chm-search-result,[data-viewer-theme=dark] .chm-search-box input{background:#1c2635;color:#e6edf6}[data-viewer-theme=dark] .chm-topic{background:#0b1019}[data-viewer-theme=dark] .chm-state{background:rgba(17,24,39,.88);color:#dbe5f1}
@media(prefers-color-scheme:dark){[data-viewer-theme=system] .chm-viewer{background:#111827;color:#e6edf6}[data-viewer-theme=system] .chm-header,[data-viewer-theme=system] .chm-topic-bar{background:#151d2b;border-color:rgba(148,163,184,.18)}[data-viewer-theme=system] .chm-heading p,[data-viewer-theme=system] .chm-topic-path{color:#94a3b8}[data-viewer-theme=system] .chm-sidebar,[data-viewer-theme=system] .chm-search-box{background:#121a27;border-color:rgba(148,163,184,.18)}[data-viewer-theme=system] .chm-tab.is-active,[data-viewer-theme=system] .chm-search-result,[data-viewer-theme=system] .chm-search-box input{background:#1c2635;color:#e6edf6}[data-viewer-theme=system] .chm-topic{background:#0b1019}[data-viewer-theme=system] .chm-state{background:rgba(17,24,39,.88);color:#dbe5f1}}
@media(max-width:760px){.chm-sidebar-toggle{display:inline-flex;align-items:center;justify-content:center}.chm-body{grid-template-columns:1fr}.chm-sidebar{position:absolute;z-index:5;top:62px;bottom:0;left:0;width:min(88vw,310px);box-shadow:16px 0 36px rgba(24,34,51,.18);transform:translateX(-105%);transition:transform .2s ease}.chm-viewer.is-sidebar-open .chm-sidebar{transform:translateX(0)}.chm-badges .chm-badge.is-muted{display:none}.chm-topic-path{display:none}}
`;
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
//#region ../../node_modules/.pnpm/@file-viewer+renderer-chm@3.1.2/node_modules/@file-viewer/renderer-chm/dist/chm.js
var MAX_RENDERED_NAVIGATION_ITEMS = 12e3;
var MAX_LOADED_RESOURCE_PATHS = 4096;
var HTML_EXTENSIONS = /* @__PURE__ */ new Set([
	"htm",
	"html",
	"xhtml",
	"shtml"
]);
var messages = {
	"zh-CN": {
		contents: "目录",
		index: "索引",
		search: "搜索",
		searchPlaceholder: "搜索主题和正文",
		loading: "正在打开 CHM…",
		wasm: "正在加载本地 WASM…",
		directory: "正在读取 CHM 目录…",
		manifest: "正在构建帮助目录…",
		searching: "正在搜索…",
		noContents: "没有可显示的目录。",
		noIndex: "没有可显示的关键词索引。",
		searchHint: "输入至少两个字符搜索当前 CHM。",
		noResults: "没有找到匹配内容。",
		truncated: "结果已按安全与性能上限截断。",
		error: "CHM 预览失败",
		topics: "个主题",
		ready: "离线安全预览",
		binaryToc: "二进制目录",
		fullText: "全文索引",
		menu: "目录",
		opening: "正在打开主题…",
		unavailable: "没有找到可打开的主题。"
	},
	"en-US": {
		contents: "Contents",
		index: "Index",
		search: "Search",
		searchPlaceholder: "Search topics and text",
		loading: "Opening CHM…",
		wasm: "Loading local WASM…",
		directory: "Reading the CHM directory…",
		manifest: "Building help navigation…",
		searching: "Searching…",
		noContents: "No table of contents is available.",
		noIndex: "No keyword index is available.",
		searchHint: "Enter at least two characters to search this CHM.",
		noResults: "No matching content was found.",
		truncated: "Results were truncated at the configured safety limit.",
		error: "CHM preview failed",
		topics: "topics",
		ready: "Safe offline preview",
		binaryToc: "Binary TOC",
		fullText: "Full-text index",
		menu: "Menu",
		opening: "Opening topic…",
		unavailable: "No readable topic was found."
	}
};
var resolveLocale = (context) => {
	var _a;
	const configured = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.locale;
	return (configured && configured !== "auto" ? configured : typeof navigator === "undefined" ? "en-US" : navigator.language).toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
};
var createElement = (tag, className, text) => {
	const element = document.createElement(tag);
	if (className) element.className = className;
	if (text != null) element.textContent = text;
	return element;
};
var extensionOf = (path) => {
	const filename = path.split("/").pop() || "";
	const index = filename.lastIndexOf(".");
	return index >= 0 ? filename.slice(index + 1).toLowerCase() : "";
};
var mimeTypeForPath = (path) => {
	return {
		css: "text/css;charset=utf-8",
		gif: "image/gif",
		jpeg: "image/jpeg",
		jpg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
		avif: "image/avif",
		bmp: "image/bmp",
		ico: "image/x-icon",
		svg: "image/svg+xml",
		mp3: "audio/mpeg",
		wav: "audio/wav",
		ogg: "audio/ogg",
		mp4: "video/mp4",
		webm: "video/webm",
		woff: "font/woff",
		woff2: "font/woff2",
		ttf: "font/ttf",
		otf: "font/otf"
	}[extensionOf(path)] || "application/octet-stream";
};
var sanitizeEmbeddedSvgCss = (value) => sanitizeChmCss(value, "/", 0).css;
var sanitizeSvg = (source) => {
	assertChmSvgSourceSafety(source);
	const document = new DOMParser().parseFromString(source, "image/svg+xml");
	if (document.querySelector("parsererror")) return "";
	document.querySelectorAll("script,foreignObject,iframe,object,embed").forEach((element) => element.remove());
	document.querySelectorAll("style").forEach((style) => {
		style.textContent = sanitizeEmbeddedSvgCss(style.textContent || "");
	});
	document.querySelectorAll("*").forEach((element) => {
		for (const attribute of Array.from(element.attributes)) {
			const name = attribute.name.toLowerCase();
			const value = attribute.value.trim();
			if (name.startsWith("on")) {
				element.removeAttribute(attribute.name);
				continue;
			}
			if ((name === "href" || name === "xlink:href") && !value.startsWith("#") && !/^data:image\/(?:avif|bmp|gif|jpeg|png|webp);/i.test(value)) {
				element.removeAttribute(attribute.name);
				continue;
			}
			if (name !== "href" && name !== "xlink:href" && /(?:url\s*\(|@import\b|expression\s*\(|behavior\s*:|-moz-binding|\\|\/\*)/i.test(value)) element.setAttribute(attribute.name, sanitizeEmbeddedSvgCss(value));
		}
	});
	return new XMLSerializer().serializeToString(document.documentElement);
};
var INTERNAL_CSS_RESOURCE_PATTERN = /url\("chm-internal:([^"]+)"\)/g;
var loadResourceMap = async (paths, loadResource, ancestry, maxResourcePaths = MAX_CHM_CSS_RESOURCE_PATHS) => {
	const uniquePaths = Array.from(new Set(paths)).slice(0, maxResourcePaths);
	const replacements = /* @__PURE__ */ new Map();
	let cursor = 0;
	const runners = Array.from({ length: Math.min(8, uniquePaths.length) }, async () => {
		while (cursor < uniquePaths.length) {
			const path = uniquePaths[cursor++];
			const normalized = normalizeChmPath(path);
			const url = normalized && normalized !== "/" ? await loadResource(normalized, ancestry) : null;
			if (normalized) replacements.set(normalized.toLocaleLowerCase(), url || "");
		}
	});
	await Promise.all(runners);
	return replacements;
};
var replaceInternalCssResourceUrls = (css, replacements) => css.replace(INTERNAL_CSS_RESOURCE_PATTERN, (_match, encoded) => {
	let path = "";
	try {
		path = decodeURIComponent(encoded);
	} catch {
		return "url(\"\")";
	}
	const normalized = normalizeChmPath(path);
	return `url("${normalized ? replacements.get(normalized.toLocaleLowerCase()) || "" : ""}")`;
});
var replaceCssResourceUrls = async (css, resourcePaths, loadResource, ancestry) => replaceInternalCssResourceUrls(css, await loadResourceMap(resourcePaths, loadResource, ancestry));
var flatNavigation = (nodes) => {
	const output = [];
	const stack = nodes.slice().reverse().map((node) => ({
		node,
		depth: 0
	}));
	while (stack.length && output.length < MAX_RENDERED_NAVIGATION_ITEMS) {
		const current = stack.pop();
		if (!current) continue;
		output.push(current);
		for (let index = current.node.children.length - 1; index >= 0; index -= 1) stack.push({
			node: current.node.children[index],
			depth: current.depth + 1
		});
	}
	return output;
};
var highlightSnippet = (target, text, query) => {
	const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
	if (index < 0) {
		target.textContent = text;
		return;
	}
	target.append(document.createTextNode(text.slice(0, index)), createElement("mark", void 0, text.slice(index, index + query.length)), document.createTextNode(text.slice(index + query.length)));
};
async function renderChm(buffer, target, _type, context) {
	var _a, _b, _c, _d;
	const locale = resolveLocale(context);
	const t = (key) => messages[locale][key];
	const options = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.chm;
	const abortController = new AbortController();
	const objectUrls = /* @__PURE__ */ new Set();
	const resourceUrls = /* @__PURE__ */ new Map();
	const listeners = [];
	let client;
	let destroyed = false;
	let manifest;
	let entries = [];
	let entryLookup = /* @__PURE__ */ new Map();
	let currentHtml = "";
	let topicGeneration = 0;
	let searchGeneration = 0;
	let searchTimer;
	const style = createElement("style");
	style.textContent = chmViewerStyle;
	const root = createElement("section", "chm-viewer");
	root.dataset.chmReady = "false";
	const theme = ((_b = context === null || context === void 0 ? void 0 : context.options) === null || _b === void 0 ? void 0 : _b.theme) || "light";
	target.dataset.viewerTheme = theme;
	const header = createElement("header", "chm-header");
	const sidebarToggle = createElement("button", "chm-sidebar-toggle", "☰");
	sidebarToggle.type = "button";
	sidebarToggle.title = t("menu");
	sidebarToggle.setAttribute("aria-label", t("menu"));
	const heading = createElement("div", "chm-heading");
	const title = createElement("h2", void 0, (context === null || context === void 0 ? void 0 : context.filename) || "CHM");
	const subtitle = createElement("p", void 0, t("loading"));
	heading.append(title, subtitle);
	const badges = createElement("div", "chm-badges");
	header.append(sidebarToggle, heading, badges);
	const body = createElement("div", "chm-body");
	const sidebar = createElement("aside", "chm-sidebar");
	const tabs = createElement("div", "chm-tabs");
	const panels = createElement("div", "chm-sidebar-panels");
	const contentsPanel = createElement("section", "chm-panel");
	contentsPanel.dataset.chmPanel = "contents";
	const indexPanel = createElement("section", "chm-panel");
	indexPanel.dataset.chmPanel = "index";
	indexPanel.hidden = true;
	const searchPanel = createElement("section", "chm-panel chm-search");
	searchPanel.dataset.chmPanel = "search";
	searchPanel.hidden = true;
	const searchBox = createElement("div", "chm-search-box");
	const searchInput = createElement("input");
	searchInput.type = "search";
	searchInput.placeholder = t("searchPlaceholder");
	searchInput.setAttribute("aria-label", t("search"));
	const searchMeta = createElement("div", "chm-search-meta", t("searchHint"));
	const searchResults = createElement("div", "chm-search-results");
	searchBox.append(searchInput);
	searchPanel.append(searchBox, searchMeta, searchResults);
	panels.append(contentsPanel, indexPanel, searchPanel);
	sidebar.append(tabs, panels);
	const topic = createElement("main", "chm-topic");
	const topicBar = createElement("div", "chm-topic-bar");
	const topicTitle = createElement("strong", void 0, t("loading"));
	const topicPath = createElement("span", "chm-topic-path");
	topicBar.append(topicTitle, topicPath);
	const frame = createElement("iframe", "chm-topic-frame");
	frame.setAttribute("sandbox", "allow-same-origin");
	frame.setAttribute("referrerpolicy", "no-referrer");
	frame.title = (context === null || context === void 0 ? void 0 : context.filename) || "CHM topic";
	topic.append(topicBar, frame);
	body.append(sidebar, topic);
	const state = createElement("div", "chm-state");
	const spinner = createElement("span", "chm-spinner");
	const stateText = createElement("p", void 0, t("loading"));
	state.append(spinner, stateText);
	const errorPanel = createElement("div", "chm-error");
	errorPanel.hidden = true;
	errorPanel.append(createElement("strong", void 0, t("error")), createElement("p"));
	root.append(header, body, state);
	target.replaceChildren(style, root);
	const listen = (node, type, handler) => {
		node.addEventListener(type, handler);
		listeners.push(() => node.removeEventListener(type, handler));
	};
	const showState = (text, visible = true) => {
		stateText.textContent = text;
		state.hidden = !visible;
	};
	const showError = (error) => {
		showState("", false);
		const paragraph = errorPanel.querySelector("p");
		if (paragraph) paragraph.textContent = error instanceof Error ? error.message : String(error);
		errorPanel.hidden = false;
		if (!errorPanel.isConnected) root.append(errorPanel);
	};
	const onProgress = (progress) => {
		if (root.dataset.chmReady === "true") {
			if (progress.phase === "search") searchMeta.textContent = t("searching");
			return;
		}
		if (progress.phase === "wasm") showState(t("wasm"));
		else if (progress.phase === "directory") showState(t("directory"));
		else if (progress.phase === "manifest") showState(t("manifest"));
	};
	const resolveEntryPath = (path) => {
		const normalized = normalizeChmPath(path);
		if (!normalized) return null;
		return entryLookup.get(normalized.toLocaleLowerCase()) || null;
	};
	const loadResource = async (path, ancestry = /* @__PURE__ */ new Set()) => {
		const actualPath = resolveEntryPath(path);
		if (!actualPath || !client || destroyed) return null;
		const key = actualPath.toLocaleLowerCase();
		if (ancestry.has(key)) return null;
		const cached = resourceUrls.get(key);
		if (cached) return cached;
		if (resourceUrls.size >= MAX_LOADED_RESOURCE_PATHS) return null;
		const promise = (async () => {
			try {
				const bytes = await (client === null || client === void 0 ? void 0 : client.read(actualPath, abortController.signal));
				if (!bytes || bytes.byteLength > ((client === null || client === void 0 ? void 0 : client.options.maxEntryBytes) || 0)) return null;
				const extension = extensionOf(actualPath);
				let blob;
				if (extension === "css") {
					if (ancestry.size > 0) return null;
					if (bytes.byteLength > 4194304) return null;
					const nextAncestry = new Set(ancestry);
					nextAncestry.add(key);
					const sanitizedCss = sanitizeChmCss(decodeChmText(bytes, manifest === null || manifest === void 0 ? void 0 : manifest.encoding), actualPath);
					const css = await replaceCssResourceUrls(sanitizedCss.css, sanitizedCss.resourcePaths, loadResource, nextAncestry);
					blob = new Blob([css], { type: "text/css;charset=utf-8" });
				} else if (extension === "svg") {
					if (bytes.byteLength > 8388608) return null;
					const svg = sanitizeSvg(decodeChmText(bytes, "utf-8"));
					if (!svg) return null;
					blob = new Blob([svg], { type: "image/svg+xml" });
				} else {
					const copy = new Uint8Array(bytes.byteLength);
					copy.set(bytes);
					blob = new Blob([copy.buffer], { type: mimeTypeForPath(actualPath) });
				}
				const url = URL.createObjectURL(blob);
				objectUrls.add(url);
				return url;
			} catch {
				return null;
			}
		})();
		resourceUrls.set(key, promise);
		return promise;
	};
	const hydrateTopic = async (html, basePath) => {
		const sanitized = sanitizeChmHtmlDocument(html, basePath, false);
		const { document } = sanitized;
		const replacements = await loadResourceMap(sanitized.resourcePaths, loadResource, /* @__PURE__ */ new Set(), MAX_CHM_TOPIC_RESOURCE_PATHS);
		for (const attribute of [
			"src",
			"poster",
			"href",
			"xlink-href",
			"background",
			"lowsrc",
			"dynsrc"
		]) document.querySelectorAll(`[data-chm-resource-${attribute}]`).forEach((element) => {
			const dataAttribute = `data-chm-resource-${attribute}`;
			const path = normalizeChmPath(element.getAttribute(dataAttribute) || "");
			const url = path ? replacements.get(path.toLocaleLowerCase()) : "";
			element.removeAttribute(dataAttribute);
			if (!url) return;
			if (attribute === "xlink-href") element.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
			else element.setAttribute(attribute, url);
		});
		for (const style of Array.from(document.querySelectorAll("style"))) style.textContent = replaceInternalCssResourceUrls(style.textContent || "", replacements);
		for (const element of Array.from(document.querySelectorAll("[style]"))) element.setAttribute("style", replaceInternalCssResourceUrls(element.getAttribute("style") || "", replacements));
		return {
			html: `<!doctype html>${document.documentElement.outerHTML}`,
			title: sanitized.title
		};
	};
	const syncActiveNavigation = (path) => {
		root.querySelectorAll("[data-chm-path].is-active").forEach((element) => element.classList.remove("is-active"));
		const folded = path.toLocaleLowerCase();
		root.querySelectorAll("[data-chm-path]").forEach((element) => {
			if ((element.dataset.chmPath || "").toLocaleLowerCase() === folded) element.classList.add("is-active");
		});
	};
	const scrollToFragment = (fragment) => {
		if (!fragment) return;
		const document = frame.contentDocument;
		const target = (document === null || document === void 0 ? void 0 : document.getElementById(fragment)) || (document === null || document === void 0 ? void 0 : document.getElementsByName(fragment)[0]);
		target === null || target === void 0 || target.scrollIntoView({ block: "start" });
	};
	const openTopic = async (path, fragment) => {
		var _a, _b;
		const generation = ++topicGeneration;
		const actualPath = resolveEntryPath(path);
		if (!actualPath || !client) throw new Error(`CHM_ENTRY_NOT_FOUND: ${path}`);
		showState(t("opening"));
		try {
			const bytes = await client.read(actualPath, abortController.signal);
			if (bytes.byteLength > client.options.maxHtmlBytes) throw new Error(`CHM_LIMIT_EXCEEDED: topic ${actualPath} is too large to render safely.`);
			const hydrated = await hydrateTopic(decodeChmText(bytes, manifest === null || manifest === void 0 ? void 0 : manifest.encoding), actualPath);
			if (destroyed || generation !== topicGeneration) return;
			currentHtml = hydrated.html;
			const canonicalPath = normalizeChmPath(actualPath) || actualPath;
			topicTitle.textContent = hydrated.title || ((_a = manifest === null || manifest === void 0 ? void 0 : manifest.topics.find((item) => {
				var _a;
				return ((_a = normalizeChmPath(item.path)) === null || _a === void 0 ? void 0 : _a.toLocaleLowerCase()) === canonicalPath.toLocaleLowerCase();
			})) === null || _a === void 0 ? void 0 : _a.title) || actualPath;
			topicPath.textContent = canonicalPath;
			frame.srcdoc = hydrated.html;
			frame.onload = () => {
				if (destroyed || generation !== topicGeneration) return;
				const frameDocument = frame.contentDocument;
				if (frameDocument) frameDocument.addEventListener("click", (event) => {
					const eventTarget = event.target;
					const anchor = eventTarget instanceof Element ? eventTarget.closest("a[data-chm-link-kind],area[data-chm-link-kind]") : null;
					if (!anchor) return;
					event.preventDefault();
					const kind = anchor.dataset.chmLinkKind;
					const nextPath = anchor.dataset.chmPath;
					const nextFragment = anchor.dataset.chmFragment;
					if (kind === "fragment") scrollToFragment(nextFragment);
					else if (kind === "internal" && nextPath) openTopic(nextPath, nextFragment).catch(showError);
				});
				scrollToFragment(fragment);
			};
			syncActiveNavigation(canonicalPath);
			root.classList.remove("is-sidebar-open");
			errorPanel.remove();
			errorPanel.hidden = true;
			showState("", false);
			(_b = context === null || context === void 0 ? void 0 : context.onProgressiveRender) === null || _b === void 0 || _b.call(context);
		} catch (error) {
			if (generation === topicGeneration && !destroyed) showError(error);
			throw error;
		}
	};
	const appendNavigation = (panel, nodes, emptyText) => {
		panel.replaceChildren();
		const flattened = flatNavigation(nodes);
		if (!flattened.length) {
			panel.append(createElement("p", "chm-panel-note", emptyText));
			return;
		}
		const list = createElement("ul", "chm-navigation");
		const parentByDepth = /* @__PURE__ */ new Map([[0, list]]);
		for (const { node, depth } of flattened) {
			const parent = parentByDepth.get(depth) || list;
			const item = createElement("li");
			const normalizedPath = node.path ? normalizeChmPath(node.path) : null;
			const label = normalizedPath ? createElement("button", "chm-nav-button", node.title || normalizedPath) : createElement("div", "chm-nav-label", node.title);
			if (label instanceof HTMLButtonElement && normalizedPath) {
				label.type = "button";
				label.dataset.chmPath = normalizedPath;
			}
			item.append(label);
			if (node.children.length) {
				const children = createElement("ul");
				item.append(children);
				parentByDepth.set(depth + 1, children);
			} else parentByDepth.delete(depth + 1);
			parent.append(item);
		}
		panel.append(list);
		if (flattened.length >= MAX_RENDERED_NAVIGATION_ITEMS) panel.append(createElement("p", "chm-panel-note", t("truncated")));
	};
	const selectTab = (name) => {
		tabs.querySelectorAll(".chm-tab").forEach((button) => button.classList.toggle("is-active", button.dataset.chmTab === name));
		panels.querySelectorAll(".chm-panel").forEach((panel) => {
			panel.hidden = panel.dataset.chmPanel !== name;
		});
		if (name === "search") searchInput.focus();
	};
	[
		"contents",
		"index",
		"search"
	].forEach((name, index) => {
		const button = createElement("button", `chm-tab${index === 0 ? " is-active" : ""}`, t(name));
		button.type = "button";
		button.dataset.chmTab = name;
		button.setAttribute("aria-label", t(name));
		tabs.append(button);
	});
	const renderSearchHits = (hits, query, truncated) => {
		searchResults.replaceChildren();
		if (!hits.length) {
			searchMeta.textContent = t("noResults");
			return;
		}
		searchMeta.textContent = truncated ? `${hits.length} · ${t("truncated")}` : String(hits.length);
		for (const hit of hits) {
			const button = createElement("button", "chm-search-result");
			button.type = "button";
			button.dataset.chmSearchResult = "true";
			button.dataset.chmPath = hit.path;
			const heading = createElement("strong");
			highlightSnippet(heading, hit.title, query);
			const snippet = createElement("span");
			highlightSnippet(snippet, hit.snippet || hit.path, query);
			button.append(heading, snippet);
			searchResults.append(button);
		}
	};
	const runSearch = async () => {
		const query = searchInput.value.trim();
		const generation = ++searchGeneration;
		if (query.length < 2 || !client) {
			searchResults.replaceChildren();
			searchMeta.textContent = t("searchHint");
			return;
		}
		searchMeta.textContent = t("searching");
		try {
			const result = await client.search(query, abortController.signal);
			if (!destroyed && generation === searchGeneration) renderSearchHits(result.hits, query, result.truncated);
		} catch (error) {
			if (!destroyed && generation === searchGeneration) searchMeta.textContent = error instanceof Error ? error.message : String(error);
		}
	};
	listen(sidebarToggle, "click", () => root.classList.toggle("is-sidebar-open"));
	listen(tabs, "click", (event) => {
		const button = event.target instanceof Element ? event.target.closest("[data-chm-tab]") : null;
		const name = button === null || button === void 0 ? void 0 : button.dataset.chmTab;
		if (name === "contents" || name === "index" || name === "search") selectTab(name);
	});
	listen(panels, "click", (event) => {
		const button = event.target instanceof Element ? event.target.closest("[data-chm-path]") : null;
		if (button === null || button === void 0 ? void 0 : button.dataset.chmPath) openTopic(button.dataset.chmPath).catch(() => void 0);
	});
	listen(searchInput, "input", () => {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => void runSearch(), 350);
	});
	const destroy = () => {
		var _a;
		if (destroyed) return;
		destroyed = true;
		topicGeneration += 1;
		searchGeneration += 1;
		if (searchTimer) clearTimeout(searchTimer);
		abortController.abort();
		frame.onload = null;
		listeners.splice(0).forEach((dispose) => dispose());
		client === null || client === void 0 || client.destroy();
		client = void 0;
		for (const url of objectUrls) URL.revokeObjectURL(url);
		objectUrls.clear();
		resourceUrls.clear();
		(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
		root.remove();
		style.remove();
	};
	const abortFromContext = () => destroy();
	(_c = context === null || context === void 0 ? void 0 : context.signal) === null || _c === void 0 || _c.addEventListener("abort", abortFromContext, { once: true });
	listeners.push(() => {
		var _a;
		return (_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.removeEventListener("abort", abortFromContext);
	});
	(_d = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _d === void 0 || _d.call(context, {
		print: true,
		exportHtml: true,
		includeDocumentStyles: true,
		toHtml: () => currentHtml || root.outerHTML,
		printStyle: ".chm-sidebar,.chm-header,.chm-topic-bar{display:none!important}.chm-topic-frame{height:auto!important}"
	});
	try {
		client = new ChmWorkerClient(options, onProgress);
		const result = await client.open(buffer, abortController.signal);
		if (destroyed) return {
			$el: root,
			destroy
		};
		manifest = result.manifest;
		entries = result.entries;
		entryLookup = new Map(entries.flatMap((entry) => {
			const normalized = normalizeChmPath(entry.path);
			return normalized ? [[normalized.toLocaleLowerCase(), entry.path]] : [];
		}));
		title.textContent = manifest.title || (context === null || context === void 0 ? void 0 : context.filename) || "CHM";
		subtitle.textContent = `${manifest.topics.length} ${t("topics")}`;
		badges.replaceChildren(createElement("span", "chm-badge", t("ready")));
		if (manifest.hasBinaryToc) badges.append(createElement("span", "chm-badge is-muted", t("binaryToc")));
		if (manifest.hasFullTextIndex) badges.append(createElement("span", "chm-badge is-muted", t("fullText")));
		const fallbackContents = manifest.topics.map((item) => ({
			title: item.title,
			path: item.path,
			children: []
		}));
		appendNavigation(contentsPanel, manifest.contents.length ? manifest.contents : fallbackContents, t("noContents"));
		appendNavigation(indexPanel, manifest.index, t("noIndex"));
		const homePath = [
			manifest.homePath,
			...manifest.topics.map((item) => item.path),
			...entries.filter((entry) => HTML_EXTENSIONS.has(extensionOf(entry.path))).map((entry) => entry.path)
		].find((candidate) => Boolean(candidate && resolveEntryPath(candidate)));
		if (!homePath) throw new Error(`CHM_NO_TOPIC: ${t("unavailable")}`);
		await openTopic(homePath);
		if (destroyed) return {
			$el: root,
			destroy
		};
		root.dataset.chmReady = "true";
		errorPanel.remove();
		errorPanel.hidden = true;
		root.dispatchEvent(new CustomEvent("file-viewer:chm-ready", {
			bubbles: true,
			composed: true,
			detail: {
				title: manifest.title,
				homePath: normalizeChmPath(homePath),
				topicCount: manifest.topics.length
			}
		}));
	} catch (error) {
		if (!destroyed) showError(error);
	}
	return {
		$el: root,
		destroy
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-chm@3.1.2/node_modules/@file-viewer/renderer-chm/dist/index.js
var definition = DEFAULT_RENDERER_DEFINITIONS.find((item) => item.id === "chm");
if (!definition) throw new Error("@file-viewer/renderer-chm could not locate the shared CHM definition.");
var chmRendererDefinition = definition;
var renderFileViewerChm = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderChm } = await import("./chm-DfMFEIf8.js");
	return { default: renderChm };
}, []).then(({ default: renderChm }) => renderChm(buffer, target, type, context));
var chmRenderer = {
	id: "file-viewer-renderer-chm",
	label: "Flyfish File Viewer CHM renderer",
	definitions: [chmRendererDefinition],
	handlers: [{
		rendererId: chmRendererDefinition.id,
		handler: renderFileViewerChm
	}]
};
//#endregion
export { sanitizeChmHtmlDocument as _, ChmWorkerClient as a, DEFAULT_CHM_WORKER_PATH as c, normalizeChmManifest as d, resolveChmOptions as f, resolveChmReference as g, normalizeChmPath as h, renderChm as i, DEFAULT_CHM_OPTIONS as l, decodeChmText as m, chmRendererDefinition as n, DEFAULT_CHM_WASM_MODULE_PATH as o, CHM_INTERNAL_RESOURCE_SCHEME as p, renderFileViewerChm as r, DEFAULT_CHM_WASM_PATH as s, chmRenderer as t, normalizeChmEntries as u };
