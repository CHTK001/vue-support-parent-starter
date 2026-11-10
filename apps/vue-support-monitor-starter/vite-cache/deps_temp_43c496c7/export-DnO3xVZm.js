import { i as resolveFileViewerPrintStyle, n as prepareFileViewerRenderedContentForSnapshot, r as replaceFileViewerCanvasWithImages, t as inlineFileViewerBlobUrlsInHtml } from "./export-D49MPTci.js";
import { i as normalizeFileViewerPrintMaskOptions, n as applyFileViewerPagePrintMasksToHtml, r as buildFileViewerPrintMaskOverlayHtml, t as FILE_VIEWER_PRINT_MASK_STYLE } from "./printMask-7007Q9Is.js";
import { t as purify } from "./purify.es-CB-mAamt.js";
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/exportDocument.js
var escapeHtmlAttribute = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var EXPORT_SANITIZER_OPTIONS = {
	WHOLE_DOCUMENT: true,
	USE_PROFILES: {
		html: true,
		svg: true,
		svgFilters: true,
		mathMl: true
	},
	ADD_TAGS: ["use"],
	ADD_ATTR: [
		"target",
		"rel",
		"download"
	],
	FORBID_TAGS: [
		"script",
		"iframe",
		"object",
		"embed",
		"base",
		"form",
		"link"
	],
	FORBID_ATTR: ["srcdoc"]
};
var resolveExportDocument = (documentRef) => {
	return documentRef || globalThis.document || null;
};
var isCssIdentifierCharacter = (value) => /[A-Za-z0-9_-]/.test(value);
var decodeCssEscape = (value, slashIndex) => {
	let cursor = slashIndex + 1;
	const first = value[cursor] || "";
	if (!first) return {
		value: "",
		nextIndex: cursor
	};
	if (first === "\r" || first === "\n" || first === "\f") {
		if (first === "\r" && value[cursor + 1] === "\n") cursor += 1;
		return {
			value: "",
			nextIndex: cursor + 1
		};
	}
	let hexadecimal = "";
	while (cursor < value.length && hexadecimal.length < 6 && /[0-9a-f]/i.test(value[cursor] || "")) {
		hexadecimal += value[cursor];
		cursor += 1;
	}
	if (hexadecimal) {
		if (/\s/.test(value[cursor] || "")) cursor += 1;
		const codePoint = Number.parseInt(hexadecimal, 16);
		return {
			value: codePoint === 0 || codePoint > 1114111 ? "�" : String.fromCodePoint(codePoint),
			nextIndex: cursor
		};
	}
	return {
		value: first,
		nextIndex: cursor + 1
	};
};
/**
* Remove CSS comments and decode identifier escapes before looking for URL
* functions. CSS comments and escapes may otherwise split security-sensitive
* tokens such as `url` or `@import` while the browser still accepts them.
*/
var canonicalizeCssForSecurity = (css) => {
	let output = "";
	let quote = "";
	let cursor = 0;
	while (cursor < css.length) {
		const character = css[cursor] || "";
		if (quote) {
			output += character;
			if (character === "\\") {
				output += css[cursor + 1] || "";
				cursor += 2;
				continue;
			}
			if (character === quote) quote = "";
			cursor += 1;
			continue;
		}
		if (character === "/" && css[cursor + 1] === "*") {
			const commentEnd = css.indexOf("*/", cursor + 2);
			cursor = commentEnd < 0 ? css.length : commentEnd + 2;
			continue;
		}
		if (character === "\"" || character === "'") {
			quote = character;
			output += character;
			cursor += 1;
			continue;
		}
		if (character === "\\") {
			const decoded = decodeCssEscape(css, cursor);
			output += decoded.value;
			cursor = decoded.nextIndex;
			continue;
		}
		const codePoint = character.charCodeAt(0);
		output += codePoint < 32 && character !== "	" && character !== "\n" && character !== "\r" ? " " : character;
		cursor += 1;
	}
	return output;
};
var SAFE_CSS_DATA_URL_RE = /^data:(?:image\/(?:avif|bmp|gif|jpeg|png|webp|x-icon)|font\/(?:collection|otf|sfnt|ttf|woff2?)|application\/(?:font-sfnt|font-woff|vnd\.ms-fontobject|x-font-opentype|x-font-ttf|x-font-woff));/i;
var isSafeSvgCssDataUrl = (value) => {
	const match = /^data:image\/svg\+xml(?:;charset=[A-Za-z0-9._-]+)?,([\s\S]*)$/i.exec(value);
	if (!match || match[1].length > 1048576) return false;
	let svg;
	try {
		svg = decodeURIComponent(match[1]);
	} catch {
		return false;
	}
	if (!/^\s*<svg(?:\s|>)/i.test(svg)) return false;
	if (/<\/?(?:script|style|foreignObject|iframe|object|embed|form|link)\b/i.test(svg)) return false;
	if (/<!\s*(?:doctype|entity)\b/i.test(svg) || /\son[a-z0-9_-]+\s*=/i.test(svg)) return false;
	if (/@import\b/i.test(svg) || /url\s*\(\s*(?!["']?#)/i.test(svg)) return false;
	for (const resource of svg.matchAll(/\s(?:href|xlink:href|src)\s*=\s*(["'])([\s\S]*?)\1/gi)) {
		const target = normalizeResourceUrlForSvgData(resource[2] || "");
		if (!/^#[A-Za-z0-9_.:-]+$/.test(target) && !SAFE_CSS_DATA_URL_RE.test(target)) return false;
	}
	return true;
};
var stripUrlControlCharacters = (value) => {
	let normalized = "";
	for (const character of value) {
		const codePoint = character.charCodeAt(0);
		if (codePoint <= 32 || codePoint >= 127 && codePoint <= 159) continue;
		normalized += character;
	}
	return normalized.trim();
};
var normalizeResourceUrlForSvgData = stripUrlControlCharacters;
var SAFE_EXPORT_EMBEDDED_DATA_URL_RE = /^data:(?:image\/(?:avif|bmp|gif|jpeg|png|webp|x-icon)|audio\/[a-z0-9.+-]+|video\/[a-z0-9.+-]+|text\/vtt)(?:;[^,]*)?,/i;
var isSafeExportEmbeddedResourceUrl = (value) => {
	const normalized = stripUrlControlCharacters(value);
	if (!normalized) return false;
	if (normalized.startsWith("#")) return true;
	if (/^blob:/i.test(normalized)) return true;
	return SAFE_EXPORT_EMBEDDED_DATA_URL_RE.test(normalized);
};
var sanitizeExportEmbeddedResourceAttribute = (element, attributeName, options = {}) => {
	if (!element.hasAttribute(attributeName)) return;
	const normalized = stripUrlControlCharacters(element.getAttribute(attributeName) || "");
	if (options.fragmentOnly ? /^#[A-Za-z0-9_.:-]+$/.test(normalized) : isSafeExportEmbeddedResourceUrl(normalized)) element.setAttribute(attributeName, normalized);
	else element.removeAttribute(attributeName);
};
var normalizeCssUrl = (value) => {
	let normalized = value.trim();
	const quote = normalized[0];
	if ((quote === "\"" || quote === "'") && normalized[normalized.length - 1] === quote) normalized = normalized.slice(1, -1).trim();
	return stripUrlControlCharacters(normalized);
};
var isSafeCssUrl = (value) => {
	const normalized = normalizeCssUrl(value);
	if (!normalized) return false;
	if (normalized.startsWith("#")) return true;
	if (/^blob:/i.test(normalized)) return true;
	return SAFE_CSS_DATA_URL_RE.test(normalized) || isSafeSvgCssDataUrl(normalized);
};
var readCssUrlFunctionEnd = (css, start) => {
	let quote = "";
	for (let cursor = start; cursor < css.length; cursor += 1) {
		const character = css[cursor] || "";
		if (quote) {
			if (character === "\\") cursor += 1;
			else if (character === quote) quote = "";
			continue;
		}
		if (character === "\"" || character === "'") quote = character;
		else if (character === ")") return cursor;
	}
	return -1;
};
var inspectCssNetworkTokens = (css) => {
	let hasImport = false;
	let hasUrl = false;
	let quote = "";
	let cursor = 0;
	while (cursor < css.length) {
		const character = css[cursor] || "";
		if (quote) {
			if (character === "\\") {
				cursor += 2;
				continue;
			}
			if (character === quote) quote = "";
			cursor += 1;
			continue;
		}
		if (character === "/" && css[cursor + 1] === "*") {
			const commentEnd = css.indexOf("*/", cursor + 2);
			cursor = commentEnd < 0 ? css.length : commentEnd + 2;
			continue;
		}
		if (character === "\"" || character === "'") {
			quote = character;
			cursor += 1;
			continue;
		}
		if (character === "\\") {
			cursor += 2;
			continue;
		}
		if (character === "@" && css.slice(cursor + 1, cursor + 7).toLowerCase() === "import") {
			const boundary = css[cursor + 7] || "";
			if (!boundary || !isCssIdentifierCharacter(boundary)) hasImport = true;
		}
		if (css.slice(cursor, cursor + 3).toLowerCase() === "url" && !isCssIdentifierCharacter(css[cursor - 1] || "")) {
			let openParenthesis = cursor + 3;
			while (/\s/.test(css[openParenthesis] || "")) openParenthesis += 1;
			if (css[openParenthesis] === "(") hasUrl = true;
		}
		cursor += 1;
	}
	return {
		hasImport,
		hasUrl
	};
};
/**
* Keep ordinary CSS and local embedded resources, but remove every construct
* that can make an exported document initiate a new network request. Imported
* stylesheets fail closed; unsafe url() values become `none` so the rest of a
* declaration can still render.
*/
var sanitizeExportCss = (css) => {
	const canonicalTokens = inspectCssNetworkTokens(canonicalizeCssForSecurity(css));
	const originalTokens = inspectCssNetworkTokens(css);
	if (canonicalTokens.hasImport) return "";
	if (canonicalTokens.hasUrl && !originalTokens.hasUrl) return "";
	if (!originalTokens.hasUrl) return css;
	let output = "";
	let quote = "";
	let cursor = 0;
	while (cursor < css.length) {
		const character = css[cursor] || "";
		if (quote) {
			output += character;
			if (character === "\\") {
				output += css[cursor + 1] || "";
				cursor += 2;
				continue;
			}
			if (character === quote) quote = "";
			cursor += 1;
			continue;
		}
		if (character === "\"" || character === "'") {
			quote = character;
			output += character;
			cursor += 1;
			continue;
		}
		if (character === "/" && css[cursor + 1] === "*") {
			const commentEnd = css.indexOf("*/", cursor + 2);
			if (commentEnd < 0) {
				output += css.slice(cursor);
				break;
			}
			output += css.slice(cursor, commentEnd + 2);
			cursor = commentEnd + 2;
			continue;
		}
		if (character === "\\") {
			output += character;
			output += css[cursor + 1] || "";
			cursor += 2;
			continue;
		}
		if (css.slice(cursor, cursor + 3).toLowerCase() === "url" && !isCssIdentifierCharacter(css[cursor - 1] || "")) {
			let openParenthesis = cursor + 3;
			while (/\s/.test(css[openParenthesis] || "")) openParenthesis += 1;
			if (css[openParenthesis] === "(") {
				const closeParenthesis = readCssUrlFunctionEnd(css, openParenthesis + 1);
				if (closeParenthesis < 0) return "";
				const urlValue = css.slice(openParenthesis + 1, closeParenthesis);
				output += isSafeCssUrl(urlValue) ? css.slice(cursor, closeParenthesis + 1) : "none";
				cursor = closeParenthesis + 1;
				continue;
			}
		}
		output += character;
		cursor += 1;
	}
	return output;
};
var getExportPurifier = (documentRef) => {
	const windowRef = documentRef.defaultView;
	if (!windowRef) return null;
	const purifier = purify(windowRef);
	if (!purifier.isSupported) return null;
	purifier.addHook("afterSanitizeElements", (node) => {
		var _a;
		const element = node;
		if (((_a = element.localName) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== "style") return;
		const sanitizedCss = sanitizeExportCss(element.textContent || "");
		if (sanitizedCss) element.textContent = sanitizedCss;
		else element.remove();
	});
	purifier.addHook("afterSanitizeAttributes", (node) => {
		var _a;
		const element = node;
		const localName = (_a = element.localName) === null || _a === void 0 ? void 0 : _a.toLowerCase();
		if (localName === "a" && (element.getAttribute("target") || "").trim().toLowerCase() === "_blank") element.setAttribute("rel", "noopener noreferrer");
		if (localName === "a" || localName === "area") element.removeAttribute("ping");
		if (element.hasAttribute("srcset")) element.removeAttribute("srcset");
		if ([
			"img",
			"audio",
			"video",
			"source",
			"track",
			"input"
		].includes(localName || "")) sanitizeExportEmbeddedResourceAttribute(element, "src");
		if (localName === "video") sanitizeExportEmbeddedResourceAttribute(element, "poster");
		if (element.hasAttribute("background")) sanitizeExportEmbeddedResourceAttribute(element, "background");
		if (element.namespaceURI === "http://www.w3.org/2000/svg" && localName !== "a") {
			const fragmentOnly = localName === "use" || localName === "mpath";
			sanitizeExportEmbeddedResourceAttribute(element, "href", { fragmentOnly });
			sanitizeExportEmbeddedResourceAttribute(element, "xlink:href", { fragmentOnly });
		}
		if (element.hasAttribute("style")) {
			const sanitizedStyle = sanitizeExportCss(element.getAttribute("style") || "");
			if (sanitizedStyle) element.setAttribute("style", sanitizedStyle);
			else element.removeAttribute("style");
		}
	});
	return purifier;
};
var EXPORT_STATIC_META = ["<meta charset=\"utf-8\" />", "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />"].join("\n  ");
/**
* Sanitize the complete standalone export document before it is downloaded or
* mounted into a print window. This is deliberately enforced in core because
* third-party render adapters and watermark overrides are library inputs.
*/
var sanitizeFileViewerExportDocumentHtml = (html, documentRef) => {
	const currentDocument = resolveExportDocument(documentRef);
	const purifier = currentDocument ? getExportPurifier(currentDocument) : null;
	if (!purifier) return "<!doctype html>\n<html lang=\"en\"><head><meta charset=\"utf-8\" /></head><body></body></html>";
	return `<!doctype html>\n${String(purifier.sanitize(html, EXPORT_SANITIZER_OPTIONS)).replace("<head>", `<head>\n  ${EXPORT_STATIC_META}`)}`;
};
var createEmptyFileViewerExportDocumentRoot = (documentRef) => {
	const root = documentRef.createElement("html");
	root.lang = "en";
	const head = documentRef.createElement("head");
	const charset = documentRef.createElement("meta");
	charset.setAttribute("charset", "utf-8");
	head.append(charset);
	root.append(head, documentRef.createElement("body"));
	return root;
};
var ensureFileViewerExportDocumentMeta = (root) => {
	const head = root.querySelector(":scope > head");
	if (!head) return root;
	if (!head.querySelector("meta[charset]")) {
		const charset = root.ownerDocument.createElement("meta");
		charset.setAttribute("charset", "utf-8");
		head.prepend(charset);
	}
	if (!head.querySelector("meta[name=\"viewport\"]")) {
		const viewport = root.ownerDocument.createElement("meta");
		viewport.setAttribute("name", "viewport");
		viewport.setAttribute("content", "width=device-width,initial-scale=1");
		const charset = head.querySelector("meta[charset]");
		charset === null || charset === void 0 || charset.after(viewport);
	}
	return root;
};
/**
* Produce a sanitized, inert document tree for the print-window mount path.
* Returning DOM here avoids reinterpreting the sanitized string through a
* second HTML sink such as document.write or innerHTML.
*/
var sanitizeFileViewerExportDocumentDom = (html, documentRef) => {
	const currentDocument = resolveExportDocument(documentRef);
	if (!currentDocument) throw new Error("A browser document is required to build printable DOM.");
	const purifier = getExportPurifier(currentDocument);
	if (!purifier) return createEmptyFileViewerExportDocumentRoot(currentDocument);
	const sanitized = purifier.sanitize(html, {
		...EXPORT_SANITIZER_OPTIONS,
		RETURN_DOM: true
	});
	if (!sanitized || sanitized.nodeType !== 1 || sanitized.localName.toLowerCase() !== "html") return createEmptyFileViewerExportDocumentRoot(currentDocument);
	return ensureFileViewerExportDocumentMeta(sanitized);
};
var EXPORT_DOCUMENT_STYLE = `
  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; background: #f2f4f7; color: #172033; font-family: Aptos, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  body { padding: 24px; }
  .viewer-export-shell { position: relative; min-height: calc(100vh - 48px); overflow: visible; background: #f2f4f7; }
  .viewer-export-content { position: relative; z-index: 1; contain: none; width: 100%; min-height: 100%; overflow: visible; }
  .viewer-export-watermark { position: absolute; inset: 0; pointer-events: none; z-index: 20; background-repeat: repeat; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .viewer-export-content .file-render,
  .viewer-export-content .file-viewer,
  .viewer-export-content .viewer-stage,
  .viewer-export-content .content,
  .viewer-export-content .pdf-shell,
  .viewer-export-content .pdf-content,
  .viewer-export-content .pdf-viewport,
  .viewer-export-content .pdf-wrapper,
  .viewer-export-content .docx-fit-viewer,
  .viewer-export-content .docx-wrapper,
  .viewer-export-content .docx-canvas-wrapper,
  .viewer-export-content .msdoc-stage,
  .viewer-export-content .msdoc-paged-view,
  .viewer-export-content .code-viewer,
  .viewer-export-content .markdown-viewer,
  .viewer-export-content .email-shell,
  .viewer-export-content .archive-shell,
  .viewer-export-content .eda-shell,
  .viewer-export-content .ebook-shell,
  .viewer-export-content .umd-shell,
  .viewer-export-content .drawing-shell,
  .viewer-export-content .audio-shell,
  .viewer-export-content .cad-shell,
  .viewer-export-content .cad-body,
  .viewer-export-content .cad-canvas-wrap,
  .viewer-export-content .dwg-preview-frame {
    position: relative !important;
    inset: auto !important;
    contain: none !important;
    width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .viewer-export-content .docx-wrapper {
    display: block !important;
    padding: 0 !important;
    background: transparent !important;
  }
  .viewer-export-content .docx-canvas-wrapper {
    display: block !important;
    padding: 0 !important;
    background: transparent !important;
  }
  .viewer-export-content .docx-print-document {
    display: block !important;
    width: fit-content !important;
    max-width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    margin: 0 auto !important;
  }
  .viewer-export-content .docx-page-frame {
    position: relative !important;
    width: var(--viewer-print-page-width, fit-content) !important;
    height: var(--viewer-print-page-height, auto) !important;
    min-height: var(--viewer-print-page-height, 0) !important;
    max-width: 100% !important;
    margin: 0 auto 18px !important;
    overflow: hidden !important;
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: page;
    page-break-after: always;
  }
  .viewer-export-content .docx-canvas-sheet {
    position: relative !important;
    contain: none !important;
    width: var(--viewer-print-page-width, 794px) !important;
    height: var(--viewer-print-page-height, 1123px) !important;
    min-height: var(--viewer-print-page-height, 1123px) !important;
    max-width: 100% !important;
    margin: 0 auto 18px !important;
    overflow: hidden !important;
    box-shadow: none !important;
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: page;
    page-break-after: always;
  }
  .viewer-export-content .docx-canvas-sheet > img {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    object-fit: fill;
  }
  .viewer-export-content .msdoc-page {
    position: relative !important;
    width: var(--viewer-print-page-width, 794px) !important;
    min-height: var(--viewer-print-page-height, 1123px) !important;
    max-width: 100% !important;
    height: auto !important;
    margin: 0 auto 18px !important;
    overflow: visible !important;
    break-after: page;
    page-break-after: always;
  }
  .viewer-export-content .docx-page-frame:last-child,
  .viewer-export-content .docx-canvas-sheet:last-child,
  .viewer-export-content .msdoc-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  .viewer-export-content .docx-page-frame > section.docx {
    position: relative !important;
    top: auto !important;
    left: auto !important;
    width: var(--viewer-print-page-width, auto) !important;
    min-height: var(--viewer-print-page-height, auto) !important;
    max-width: none !important;
    margin: 0 auto !important;
    overflow: visible !important;
    transform: none !important;
    box-shadow: none !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .viewer-export-content .msdoc-stage {
    display: block !important;
    padding: 0 !important;
    background: transparent !important;
  }
  .viewer-export-content .msdoc-paged-view {
    display: block !important;
    gap: 0 !important;
    padding: 0 !important;
    background: transparent !important;
  }
  .viewer-export-content .msdoc-page > .msdoc-root {
    margin: 0 auto !important;
    box-shadow: none !important;
    overflow: visible !important;
  }
  .viewer-export-content .pdf-toolbar,
  .viewer-export-content .pdf-nav-pane,
  .viewer-export-content .viewer-actions,
  .viewer-export-content .code-toolbar,
  .viewer-export-content .umd-toolbar,
  .viewer-export-content .drawing-toolbar,
  .viewer-export-content .cad-toolbar {
    display: none !important;
  }
  .viewer-export-content .pdf-content,
  .viewer-export-content .pdf-shell--nav-hidden .pdf-content,
  .viewer-export-content .cad-body.without-layers {
    display: block !important;
    grid-template-columns: none !important;
  }
  .viewer-export-content .pdfViewer { padding: 0 !important; }
  .viewer-export-content .pdfViewer .page {
    margin: 0 auto 16px !important;
    border: 0 !important;
    box-shadow: none !important;
    break-after: page;
    page-break-after: always;
  }
  .viewer-export-content .pdfViewer .page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  .viewer-export-content .pdf-export-document {
    display: grid;
    justify-items: center;
    gap: 18px;
    padding: 4px 0;
  }
  .viewer-export-content .pdf-export-page {
    width: var(--viewer-print-page-width, auto);
    height: var(--viewer-print-page-height, auto);
    max-width: 100%;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: page;
    page-break-after: always;
  }
  .viewer-export-content .pdf-export-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  .viewer-export-content .pdf-export-page img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .viewer-export-content .pptx-wrapper {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    transform: none !important;
  }
  .viewer-export-content .pptx-wrapper .slide {
    margin: 0 auto 18px !important;
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: page;
    page-break-after: always;
    box-shadow: none !important;
  }
  .viewer-export-content .pptx-wrapper .slide:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  .viewer-export-content .ofd-stage {
    padding: 0 !important;
    overflow: visible !important;
  }
  .viewer-export-content .ofd-page,
  .viewer-export-content .drawing-svg,
  .viewer-export-content .cad-canvas-wrap,
  .viewer-export-content .dwg-preview-frame {
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: page;
    page-break-after: always;
    box-shadow: none !important;
  }
  .viewer-export-content .ofd-page:last-child,
  .viewer-export-content .drawing-svg:last-child,
  .viewer-export-content .cad-canvas-wrap:last-child,
  .viewer-export-content .dwg-preview-frame:last-child {
    break-after: auto;
    page-break-after: auto;
  }
  .viewer-export-content .code-area {
    overflow: visible !important;
    white-space: pre-wrap !important;
    word-break: break-word !important;
  }
  .viewer-export-content .umd-body,
  .viewer-export-content .umd-stage-wrap,
  .viewer-export-content .umd-stage {
    display: block !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .viewer-export-content .umd-toc {
    display: none !important;
  }
  img, canvas, svg, video { max-width: 100%; }
  @media print {
    @page { margin: 12mm; }
    html, body { min-height: auto; background: #ffffff; }
    body { padding: 0; }
    .viewer-export-shell,
    .viewer-export-content {
      min-height: 0;
      overflow: visible;
      background: #ffffff;
    }
    .viewer-export-content .pdf-export-document {
      display: block;
      padding: 0;
    }
    .viewer-export-content .pdf-export-page {
      width: var(--viewer-print-page-width, auto) !important;
      height: var(--viewer-print-page-height, auto) !important;
      max-width: none !important;
      margin: 0;
      overflow: hidden;
      box-shadow: none;
    }
    .viewer-export-content .docx-page-frame {
      width: var(--viewer-print-page-width, auto) !important;
      height: var(--viewer-print-page-height, auto) !important;
      min-height: var(--viewer-print-page-height, 0) !important;
      max-width: none !important;
      margin: 0 !important;
      overflow: hidden !important;
    }
    .viewer-export-content .docx-canvas-sheet {
      contain: none !important;
      width: var(--viewer-print-page-width, 794px) !important;
      height: var(--viewer-print-page-height, 1123px) !important;
      min-height: var(--viewer-print-page-height, 1123px) !important;
      max-width: none !important;
      margin: 0 !important;
      overflow: hidden !important;
      box-shadow: none !important;
    }
    .viewer-export-content .msdoc-page {
      width: var(--viewer-print-page-width, 794px) !important;
      min-height: var(--viewer-print-page-height, 1123px) !important;
      max-width: none !important;
      margin: 0 !important;
      overflow: visible !important;
    }
    .viewer-export-content .docx-page-frame > section.docx,
    .viewer-export-content .msdoc-page > .msdoc-root {
      width: var(--viewer-print-page-width, 100%) !important;
      max-width: none !important;
      border: 0 !important;
    }
    .viewer-export-content .pptx-wrapper .slide,
    .viewer-export-content .ofd-page,
    .viewer-export-content .drawing-svg,
    .viewer-export-content .cad-canvas-wrap,
    .viewer-export-content .dwg-preview-frame {
      box-shadow: none !important;
    }
  }
`;
var collectDocumentStyles = (documentRef) => {
	const currentDocument = resolveExportDocument(documentRef);
	if (!currentDocument) return "";
	return Array.from(currentDocument.querySelectorAll("style, link[rel=\"stylesheet\"]")).map((node) => {
		var _a;
		if (node.localName.toLowerCase() === "style") return `<style>${node.textContent || ""}</style>`;
		const link = node;
		try {
			const cssText = Array.from(((_a = link.sheet) === null || _a === void 0 ? void 0 : _a.cssRules) || []).map((rule) => rule.cssText).join("\n");
			return cssText ? `<style data-viewer-inlined-stylesheet>${cssText}</style>` : "";
		} catch {
			return "";
		}
	}).filter(Boolean).join("\n");
};
var buildExportDocumentMarkup = ({ contentHtml, includeDocumentStyles = true, printStyle = "", title, watermarkInlineStyle = "", mask = null, documentRef }) => {
	var _a, _b;
	const watermark = watermarkInlineStyle ? `<div class="viewer-export-watermark" style="${escapeHtmlAttribute(watermarkInlineStyle)}"></div>` : "";
	const normalizedMask = normalizeFileViewerPrintMaskOptions(mask);
	const globalMask = normalizedMask ? {
		...normalizedMask,
		regions: (_a = normalizedMask.regions) === null || _a === void 0 ? void 0 : _a.filter((region) => region.pageIndex === void 0),
		stamps: (_b = normalizedMask.stamps) === null || _b === void 0 ? void 0 : _b.filter((stamp) => stamp.pageIndex === void 0)
	} : null;
	const maskHtml = buildFileViewerPrintMaskOverlayHtml(globalMask);
	const maskedContentHtml = applyFileViewerPagePrintMasksToHtml(contentHtml, normalizedMask);
	const styles = includeDocumentStyles ? collectDocumentStyles(documentRef) : "";
	const printOverrideStyle = printStyle ? `<style data-viewer-print-style>${printStyle}</style>` : "";
	const maskStyle = normalizedMask ? `<style data-viewer-print-mask-style>${FILE_VIEWER_PRINT_MASK_STYLE}</style>` : "";
	return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtmlAttribute(title)}</title>
  ${styles}
  <style>${EXPORT_DOCUMENT_STYLE}</style>
  ${maskStyle}
</head>
<body>
  <main class="viewer-export-shell">
    <div class="viewer-export-content">${maskedContentHtml}</div>
    ${maskHtml}
    ${watermark}
  </main>
  ${printOverrideStyle}
</body>
</html>`;
};
var buildExportHtmlDocument = (options) => {
	return sanitizeFileViewerExportDocumentHtml(buildExportDocumentMarkup(options), options.documentRef);
};
var buildExportDomDocument = (options) => {
	return sanitizeFileViewerExportDocumentDom(buildExportDocumentMarkup(options), options.documentRef);
};
var resolveFileViewerRenderedDocumentOptions = async ({ source, mode = "export", title, adapter = null, watermarkInlineStyle = "", mask = null }) => {
	const exportOptions = {
		mode,
		title
	};
	const toHtml = adapter === null || adapter === void 0 ? void 0 : adapter.toHtml;
	const normalizedMask = normalizeFileViewerPrintMaskOptions(mask);
	if (toHtml) {
		await prepareFileViewerRenderedContentForSnapshot(source, adapter);
		const contentHtml = await inlineFileViewerBlobUrlsInHtml(await toHtml(exportOptions));
		const printStyle = await resolveFileViewerPrintStyle(adapter, exportOptions);
		return {
			contentHtml,
			includeDocumentStyles: adapter.includeDocumentStyles !== false,
			printStyle,
			title,
			watermarkInlineStyle,
			mask: normalizedMask,
			documentRef: source.ownerDocument
		};
	}
	await prepareFileViewerRenderedContentForSnapshot(source, adapter);
	const clone = source.cloneNode(true);
	clone.querySelectorAll(".viewer-watermark").forEach((node) => node.remove());
	replaceFileViewerCanvasWithImages(source, clone);
	const printStyle = await resolveFileViewerPrintStyle(adapter, exportOptions);
	return {
		contentHtml: await inlineFileViewerBlobUrlsInHtml(clone.innerHTML),
		printStyle,
		title,
		watermarkInlineStyle,
		mask: normalizedMask,
		documentRef: source.ownerDocument
	};
};
var buildFileViewerRenderedHtmlDocument = async (options) => {
	return buildExportHtmlDocument(await resolveFileViewerRenderedDocumentOptions(options));
};
var buildFileViewerRenderedDomDocument = async (options) => {
	return buildExportDomDocument(await resolveFileViewerRenderedDocumentOptions(options));
};
//#endregion
export { buildFileViewerRenderedDomDocument, buildFileViewerRenderedHtmlDocument };
