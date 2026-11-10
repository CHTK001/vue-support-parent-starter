import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import "./dist-B6GcL3C6.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { t as getFileViewerRtfLoader } from "./optionalCapabilities-nZLK8l89.js";
import { a as sanitizeMsDocLinkHref, n as sanitizeFileViewerDocumentMarkup } from "./viewer-BUKi8qXw.js";
import { t as require_jszip_min } from "./jszip.min-eM67_wVy.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/sanitizeRtf.js
var compactUrl = (value) => value.trim().replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
var schemeOf = (value) => {
	var _a, _b;
	return (_b = (_a = compactUrl(value).match(/^([a-z][a-z0-9+.-]*):/i)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.toLowerCase();
};
var normalizeRtfBookmarkHref = (value) => {
	const match = String(value !== null && value !== void 0 ? value : "").trim().match(/^\\l\s+(?:"([^"]+)"|([^\s"]+))\s*$/i);
	if (!match) return null;
	const bookmark = (match[1] || match[2] || "").trim();
	return /^[A-Za-z_][A-Za-z0-9_]{0,39}$/.test(bookmark) ? `#${bookmark}` : null;
};
/**
* Canonicalizes an RTF field hyperlink through the same policy used by DOC.
* Word's `HYPERLINK \\l "bookmark"` field syntax is converted to a fragment
* before external navigation is considered, so bookmarks remain available
* even when the default external-link policy is `block`.
*/
var sanitizeFileViewerRtfHyperlink = (value, policy = "block") => {
	const bookmarkHref = normalizeRtfBookmarkHref(value);
	return sanitizeMsDocLinkHref(bookmarkHref || value, policy);
};
var sanitizeResourceUrl = (value, policy = "block") => {
	const compact = compactUrl(value);
	if (compact.startsWith("#")) return compact;
	if (/^data:image\/(?:png|gif|jpe?g|webp);base64,/i.test(compact)) return compact;
	const scheme = schemeOf(compact);
	if (scheme === "blob") return compact;
	if (policy !== "allow") return null;
	if (scheme === "http" || scheme === "https") return compact;
	if (!scheme && !compact.startsWith("//") && !compact.includes("\\")) return compact;
	return null;
};
var decodeCssEscapes = (value) => value.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\\([0-9a-f]{1,6})\s?/gi, (_match, digits) => {
	const codePoint = Number.parseInt(digits, 16);
	return codePoint > 0 && codePoint <= 1114111 ? String.fromCodePoint(codePoint) : "";
}).replace(/\\([^\r\n\f])/g, "$1");
var safeStyle = (value) => !/(?:expression\s*\(|(?:url|src|image|image-set|cross-fade)\s*\(|@import|behavior\s*:|-moz-binding)/i.test(decodeCssEscapes(value));
var isResourceHrefElement = (node) => ["image", "use"].includes(node.localName.toLowerCase());
var createFileViewerRtfHyperlinkContainer = (documentRef, create, hyperlink, policy = "block") => {
	const href = sanitizeFileViewerRtfHyperlink(hyperlink.url(), policy);
	if (!href) {
		const span = documentRef.createElement("span");
		span.dataset.fileViewerBlockedLink = "true";
		span.setAttribute("aria-disabled", "true");
		return {
			element: span,
			content: span
		};
	}
	const anchor = create();
	anchor.setAttribute("href", href);
	if ((anchor.getAttribute("target") || "").toLowerCase() === "_blank") anchor.setAttribute("rel", "noopener noreferrer");
	return {
		element: anchor,
		content: anchor
	};
};
var fallbackFragment = (documentRef, text) => {
	const fragment = documentRef.createDocumentFragment();
	fragment.append(documentRef.createTextNode(text));
	return fragment;
};
var sanitizeFileViewerRtfMarkup = (documentRef, markup, fallbackText, options = {}) => {
	const fallback = () => {
		return fallbackFragment(documentRef, fallbackText);
	};
	const windowRef = documentRef.defaultView;
	if (!windowRef) return fallback();
	const fragment = sanitizeFileViewerDocumentMarkup(markup, windowRef, {
		RETURN_DOM_FRAGMENT: true,
		USE_PROFILES: {
			html: true,
			svg: true,
			svgFilters: true
		},
		ADD_ATTR: ["target"],
		FORBID_TAGS: [
			"base",
			"embed",
			"foreignObject",
			"form",
			"iframe",
			"object",
			"script",
			"style",
			"template"
		],
		FORBID_ATTR: [
			"action",
			"formaction",
			"srcdoc"
		]
	});
	if ((fragment === null || fragment === void 0 ? void 0 : fragment.nodeType) !== 11) return fallback();
	fragment.querySelectorAll("*").forEach((node) => {
		var _a, _b, _c;
		for (const attribute of Array.from(node.attributes)) if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
		else if (attribute.name.toLowerCase() === "style" && !safeStyle(attribute.value)) node.removeAttribute(attribute.name);
		else if (/^(?:href|xlink:href)$/i.test(attribute.name)) {
			const href = isResourceHrefElement(node) ? sanitizeResourceUrl(attribute.value, (_a = options.externalResourcePolicy) !== null && _a !== void 0 ? _a : "block") : sanitizeFileViewerRtfHyperlink(attribute.value, (_b = options.externalLinkPolicy) !== null && _b !== void 0 ? _b : "block");
			if (href) node.setAttribute(attribute.name, href);
			else node.removeAttribute(attribute.name);
		} else if (/^src$/i.test(attribute.name)) {
			const source = sanitizeResourceUrl(attribute.value, (_c = options.externalResourcePolicy) !== null && _c !== void 0 ? _c : "block");
			if (source) node.setAttribute(attribute.name, source);
			else node.removeAttribute(attribute.name);
		} else if (/^(?:background|poster|srcset)$/i.test(attribute.name)) node.removeAttribute(attribute.name);
		else if (/^ping$/i.test(attribute.name)) node.removeAttribute(attribute.name);
		if (node instanceof windowRef.HTMLAnchorElement) {
			if ((node.getAttribute("href") || "").startsWith("#")) node.removeAttribute("target");
			else if ((node.getAttribute("target") || "").toLowerCase() === "_blank") node.setAttribute("rel", "noopener noreferrer");
		}
	});
	return fragment;
};
var sanitizeFileViewerRtfElement = (documentRef, element, options = {}) => sanitizeFileViewerRtfMarkup(documentRef, element.outerHTML, element.textContent || "", options);
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/openDocument.js
var import_jszip_min = /* @__PURE__ */ __toESM(require_jszip_min(), 1);
var openDocumentStyle = `
.odf-viewer{min-height:100%;padding:28px;overflow:auto;background:var(--file-viewer-render-surface-background,#dfe5eb);box-sizing:border-box}
.odf-shell{width:min(100%,980px);margin:0 auto}
.odf-page{min-height:360px;margin:0 auto 18px;padding:42px 48px;border-radius:4px;background:#fff;box-shadow:0 16px 38px rgba(15,23,42,.12);color:#1f2937;box-sizing:border-box}
.odf-page p{margin:0 0 12px;font-size:15px;line-height:1.85;white-space:pre-wrap}
.flyfish-rtf-viewer{min-height:100%;padding:28px;overflow:auto;background:var(--file-viewer-render-surface-background,#dfe5eb);color:#1f2937;box-sizing:border-box}
.flyfish-rtf-paper{width:min(100%,900px);min-height:980px;margin:0 auto;padding:54px 62px;background:#fff;box-shadow:0 16px 38px rgba(15,23,42,.12);line-height:1.75;box-sizing:border-box}.flyfish-rtf-paper p{margin:0 0 12px}
[data-viewer-theme='dark'] .odf-viewer,[data-viewer-theme='dark'] .flyfish-rtf-viewer{color-scheme:dark;background:var(--file-viewer-render-surface-background,#0d1117);color:#e6edf3}
[data-viewer-theme='dark'] .odf-page,[data-viewer-theme='dark'] .flyfish-rtf-paper{border:1px solid rgba(139,148,158,.24);background:#161b22;color:#e6edf3;box-shadow:0 18px 44px rgba(0,0,0,.34)}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .odf-viewer,[data-viewer-theme='system'] .flyfish-rtf-viewer{color-scheme:dark;background:var(--file-viewer-render-surface-background,#0d1117);color:#e6edf3}[data-viewer-theme='system'] .odf-page,[data-viewer-theme='system'] .flyfish-rtf-paper{border:1px solid rgba(139,148,158,.24);background:#161b22;color:#e6edf3;box-shadow:0 18px 44px rgba(0,0,0,.34)}}
@media (max-width:720px){.odf-viewer,.flyfish-rtf-viewer{padding:14px}.odf-page{padding:28px 24px}.flyfish-rtf-paper{padding:36px 28px}}
`;
var createStyle = (documentRef = document) => {
	const style = documentRef.createElement("style");
	style.textContent = openDocumentStyle;
	return style;
};
var appendText = (parent, tag, text, className) => {
	const element = document.createElement(tag);
	if (className) element.className = className;
	element.textContent = text;
	parent.appendChild(element);
	return element;
};
var nodeText = (node) => {
	return (node.textContent || "").replace(/\s+/g, " ").trim();
};
var parseOdf = async (buffer, type, t) => {
	var _a;
	const content = await ((_a = (await import_jszip_min.default.loadAsync(buffer)).file("content.xml")) === null || _a === void 0 ? void 0 : _a.async("text"));
	if (!content) throw new Error(t("word.error.missingOdfContent"));
	const doc = new DOMParser().parseFromString(content, "application/xml");
	if (doc.querySelector("parsererror")) throw new Error(t("word.error.odfXmlParseFailed"));
	if (type === "odp") return Array.from(doc.getElementsByTagName("draw:page")).map((slide) => {
		return { blocks: Array.from(slide.getElementsByTagName("text:p")).map(nodeText).filter(Boolean) };
	});
	return [{ blocks: [...Array.from(doc.getElementsByTagName("text:h")).map(nodeText), ...Array.from(doc.getElementsByTagName("text:p")).map(nodeText)].filter(Boolean) }];
};
var renderOdfPages = (pages) => {
	const root = document.createElement("div");
	root.className = "odf-viewer";
	const shell = document.createElement("section");
	shell.className = "odf-shell";
	pages.forEach((page) => {
		const article = document.createElement("article");
		article.className = "odf-page";
		page.blocks.forEach((block) => appendText(article, "p", block));
		shell.appendChild(article);
	});
	root.appendChild(shell);
	return root;
};
var resolveRtfJs = async () => {
	const loadRtf = getFileViewerRtfLoader();
	if (!loadRtf) throw new Error("RTF support is opt-in. Run `npx file-viewer-cli add rtf --write`, then `npx file-viewer-cli install --yes`.");
	const rtfModule = await loadRtf();
	return rtfModule.RTFJS || rtfModule.default || rtfModule;
};
var renderRtf = async (buffer, target, context) => {
	var _a, _b, _c, _d, _e, _f, _g, _h;
	const RTFJS = await resolveRtfJs();
	const documentRef = target.ownerDocument || document;
	const externalLinkPolicy = (_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.docx) === null || _b === void 0 ? void 0 : _b.externalLinkPolicy) !== null && _c !== void 0 ? _c : "block";
	const externalResourcePolicy = (_f = (_e = (_d = context === null || context === void 0 ? void 0 : context.options) === null || _d === void 0 ? void 0 : _d.docx) === null || _e === void 0 ? void 0 : _e.externalResourcePolicy) !== null && _f !== void 0 ? _f : "block";
	(_g = RTFJS.loggingEnabled) === null || _g === void 0 || _g.call(RTFJS, false);
	const elements = await new RTFJS.Document(buffer, { onHyperlink: (create, hyperlink) => createFileViewerRtfHyperlinkContainer(documentRef, create, hyperlink, externalLinkPolicy) }).render();
	const stage = documentRef.createElement("div");
	stage.className = "flyfish-rtf-viewer";
	const paper = documentRef.createElement("article");
	paper.className = "flyfish-rtf-paper";
	elements.forEach((element) => paper.append(sanitizeFileViewerRtfElement(documentRef, element, {
		externalLinkPolicy,
		externalResourcePolicy
	})));
	stage.appendChild(paper);
	target.replaceChildren(createStyle(documentRef), stage);
	(_h = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _h === void 0 || _h.call(context, { getTarget: () => paper });
	return {
		$el: target,
		unmount() {
			var _a;
			(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, null);
			target.replaceChildren();
		}
	};
};
async function renderOpenDocument(buffer, target, type, context) {
	var _a;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const normalizedType = (type || "odt").toLowerCase();
	if (normalizedType === "rtf") return renderRtf(buffer, target, context);
	const pages = await parseOdf(buffer, normalizedType, t);
	target.replaceChildren(createStyle(), renderOdfPages(pages));
	(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, { getTarget: () => target.querySelector(".odf-page") || target });
	return {
		$el: target,
		unmount() {
			var _a;
			(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, null);
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderOpenDocument as default };
