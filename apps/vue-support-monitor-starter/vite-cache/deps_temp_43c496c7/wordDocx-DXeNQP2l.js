import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { $t as resolveFileViewerDocxWorkerUrl, Qt as resolveFileViewerDocxWorkerJsZipUrl, dn as resolveFileViewerRuntimeAssetBaseUrl, r as normalizeFileViewerTheme, vt as DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION } from "./dist-B6GcL3C6.js";
import { _ as unregisterFileViewerZoomProvider, i as resolveFileViewerFitScale, m as registerFileViewerZoomProvider, o as createFileViewerZoomChangeEmitter } from "./fit-BmeG0j2O.js";
import { c as waitForFileViewerNextPaint, r as replaceFileViewerCanvasWithImages } from "./export-D49MPTci.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { i as getElementPrintPageSize, n as buildPrintPageStyle, r as formatCssPixels, t as applyPrintPageSize } from "./printLayout-Bjb07JZy.js";
import { t as require_jszip_min } from "./jszip.min-eM67_wVy.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/docxAnchors.js
var import_jszip_min = /* @__PURE__ */ __toESM(require_jszip_min(), 1);
var authoredLeft = /* @__PURE__ */ new WeakMap();
var number = (value) => Number.parseFloat(value) || 0;
/**
* A paragraph-relative vertical anchor makes that paragraph an absolute-position
* containing block. Its horizontal axis can still be relative to the column or
* page margins: paragraph indentation must not be added to that authored offset.
* Keep the engine's original CSS length and correct only the containing-block
* origin. Recompute after fitting/resizing; never accumulate pixel corrections.
*/
function correctDocxMixedAnchorOrigins(section) {
	var _a;
	const view = section.ownerDocument.defaultView;
	if (!view) return;
	const pageRect = section.getBoundingClientRect();
	const pageStyle = view.getComputedStyle(section);
	const pageWidth = number(pageStyle.width) + (pageStyle.boxSizing === "border-box" ? 0 : number(pageStyle.paddingLeft) + number(pageStyle.paddingRight) + number(pageStyle.borderLeftWidth) + number(pageStyle.borderRightWidth));
	const scale = pageWidth ? pageRect.width / pageWidth : 0;
	if (!Number.isFinite(scale) || scale <= 0) return;
	for (const anchor of section.querySelectorAll("[data-docx-anchor-horizontal=\"column\"], [data-docx-anchor-horizontal=\"margin\"]")) {
		const paragraph = anchor.closest("[data-docx-anchor-context=\"paragraph\"]");
		if (!paragraph || anchor.offsetParent !== paragraph || view.getComputedStyle(anchor).position !== "absolute" || !anchor.style.left) continue;
		if (paragraph.closest("td, th")) continue;
		const root = anchor.dataset.docxAnchorHorizontal === "margin" ? section : paragraph.closest("article, header, footer");
		if (!root || !section.contains(root) && root !== section) continue;
		const rootStyle = view.getComputedStyle(root);
		let origin = root.getBoundingClientRect().left + (number(rootStyle.borderLeftWidth) + number(rootStyle.paddingLeft)) * scale;
		const paragraphStyle = view.getComputedStyle(paragraph);
		const paragraphRect = paragraph.getBoundingClientRect();
		if (root !== section) {
			const count = number(rootStyle.columnCount);
			const width = number(rootStyle.columnWidth);
			if (count > 1 || width > 0) {
				const gap = rootStyle.columnGap === "normal" ? number(rootStyle.fontSize) : number(rootStyle.columnGap);
				const contentWidth = root.clientWidth - number(rootStyle.paddingLeft) - number(rootStyle.paddingRight);
				const columns = count > 0 ? count : Math.max(1, Math.floor((contentWidth + gap) / (width + gap)));
				const stride = (contentWidth + gap) / columns;
				if (stride > 0) {
					const unindentedLeft = (paragraphRect.left - origin) / scale - number(paragraphStyle.marginLeft);
					origin += Math.round(unindentedLeft / stride) * stride * scale;
				}
			}
		}
		const containingOrigin = paragraphRect.left + number(paragraphStyle.borderLeftWidth) * scale;
		const correction = (origin - containingOrigin) / scale;
		if (!Number.isFinite(correction)) continue;
		const left = (_a = authoredLeft.get(anchor)) !== null && _a !== void 0 ? _a : anchor.style.left;
		authoredLeft.set(anchor, left);
		anchor.style.left = Math.abs(correction) < .01 ? left : `calc(${left} + ${correction.toFixed(4)}px)`;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/wordDocx.js
var DOCX_DEFAULT_PAGE_SIZE = {
	width: 794,
	height: 1123
};
var DOCX_WORKER_UNSAFE_PROTOCOLS = /* @__PURE__ */ new Set([
	"file:",
	"about:",
	"data:"
]);
var DOCX_MIN_SCALE = .24;
var DOCX_MAX_SCALE = 3;
var DOCX_ZOOM_STEP = .15;
var ZIP_SIGNATURE_PK = 20555;
var WORDPROCESSINGML_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
var OFFICE_RELATIONSHIP_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
var PACKAGE_RELATIONSHIP_NAMESPACE = "http://schemas.openxmlformats.org/package/2006/relationships";
var VML_NAMESPACE = "urn:schemas-microsoft-com:vml";
var DOCX_DOCUMENT_PART = "word/document.xml";
var DOCX_DOCUMENT_RELATIONSHIPS_PART = "word/_rels/document.xml.rels";
var DOCX_PAGE_BACKGROUND_CLASS = "docx-page-background";
var DOCX_BACKGROUND_MIME_TYPES = {
	bmp: "image/bmp",
	gif: "image/gif",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	png: "image/png",
	svg: "image/svg+xml",
	tif: "image/tiff",
	tiff: "image/tiff",
	webp: "image/webp"
};
var resolveDocxLibrary = (module) => {
	const library = typeof module.renderAsync === "function" ? module : module.default;
	if (!library || typeof library.renderAsync !== "function") throw new TypeError("@file-viewer/docx did not expose a compatible renderAsync function.");
	return library;
};
var loadLibrary = (() => {
	const loader = {
		module: null,
		async load() {
			if (!this.module) this.module = import("./docx-preview-CEpM8Q6z.js");
			return this.module;
		}
	};
	return async () => {
		return resolveDocxLibrary(await loader.load());
	};
})();
var isMissingDocxHeaderFooterRootError = (error) => {
	if (!(error instanceof Error)) return false;
	return /(?:undefined|null).*children|children.*(?:undefined|null)/i.test(error.message) && /renderHeaderFooter/i.test(error.stack || "");
};
/**
* Some malformed or partially generated DOCX files reference a header/footer
* part whose parsed root is missing. @file-viewer/docx 0.3.21 skips that part;
* this retry keeps older installed engines usable while the dependency update
* rolls through lockfiles and private registries.
*/
var renderDocxWithHeaderFooterFallback = async (render, buffer, target, options) => {
	try {
		await render(buffer, target, void 0, options);
		return false;
	} catch (error) {
		if (!isMissingDocxHeaderFooterRootError(error)) throw error;
		target.replaceChildren();
		await render(buffer, target, void 0, {
			...options,
			renderHeaders: false,
			renderFooters: false
		});
		return true;
	}
};
/**
* DOCX / DOCM / DOTX / DOTM are OOXML packages, so a valid file must start
* with a ZIP signature. This catches common enterprise download failures where
* an object-storage XML error page is saved with a `.docx` extension.
*/
var assertValidDocxPackage = (buffer, context) => {
	if ((buffer.byteLength >= 4 ? new DataView(buffer).getUint16(0, false) : 0) === ZIP_SIGNATURE_PK) return;
	throw new Error(createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options)("word.error.invalidDocx"));
};
var getTargetWindow = (target) => {
	return target.ownerDocument.defaultView;
};
var createTargetXmlParser = (target) => {
	var _a, _b;
	return new ((_b = (_a = getTargetWindow(target)) === null || _a === void 0 ? void 0 : _a.DOMParser) !== null && _b !== void 0 ? _b : globalThis.DOMParser)();
};
var getTargetProtocol = (target) => {
	var _a, _b, _c;
	const candidates = [
		target.ownerDocument.URL,
		(_b = (_a = getTargetWindow(target)) === null || _a === void 0 ? void 0 : _a.location) === null || _b === void 0 ? void 0 : _b.href,
		(_c = globalThis.location) === null || _c === void 0 ? void 0 : _c.href
	].filter(Boolean);
	for (const candidate of candidates) try {
		return new URL(candidate).protocol;
	} catch {}
	return "";
};
var getElementsByLocalName = (root, namespace, localName) => {
	const namespaced = Array.from(root.getElementsByTagNameNS(namespace, localName));
	if (namespaced.length) return namespaced;
	return Array.from(root.getElementsByTagName("*")).filter((element) => element.localName === localName);
};
var parseDocxXml = (source, parser) => {
	const xml = parser.parseFromString(source, "application/xml");
	return getElementsByLocalName(xml, "http://www.mozilla.org/newlayout/xml/parsererror.xml", "parsererror").length ? null : xml;
};
var resolvePackagePartPath = (basePart, relationshipTarget) => {
	const segments = relationshipTarget.startsWith("/") ? [] : basePart.split("/").slice(0, -1);
	relationshipTarget.replace(/^\/+/, "").split("/").forEach((segment) => {
		if (!segment || segment === ".") return;
		if (segment === "..") {
			segments.pop();
			return;
		}
		segments.push(segment);
	});
	return segments.join("/");
};
var resolveDocxImageMimeType = (partName) => {
	var _a;
	return DOCX_BACKGROUND_MIME_TYPES[((_a = partName.split(".").pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || ""];
};
/**
* WPS and Word can store a page background as a document-level VML fill. The
* DOCX engine intentionally ignores that legacy drawing node, so resolve only
* its package-local image relationship here and leave all body layout to it.
*/
var resolveDocxPageBackgroundImage = async (buffer, createXmlParser = () => new DOMParser()) => {
	try {
		const archive = await import_jszip_min.default.loadAsync(buffer);
		const documentEntry = archive.file(DOCX_DOCUMENT_PART);
		const relationshipsEntry = archive.file(DOCX_DOCUMENT_RELATIONSHIPS_PART);
		if (!documentEntry || !relationshipsEntry) return;
		const parser = createXmlParser();
		const documentXml = parseDocxXml(await documentEntry.async("string"), parser);
		const relationshipsXml = parseDocxXml(await relationshipsEntry.async("string"), parser);
		if (!documentXml || !relationshipsXml) return;
		const background = getElementsByLocalName(documentXml, WORDPROCESSINGML_NAMESPACE, "background")[0];
		const fill = background && getElementsByLocalName(background, VML_NAMESPACE, "fill")[0];
		const relationshipId = (fill === null || fill === void 0 ? void 0 : fill.getAttributeNS(OFFICE_RELATIONSHIP_NAMESPACE, "id")) || (fill === null || fill === void 0 ? void 0 : fill.getAttribute("r:id"));
		if (!relationshipId) return;
		const relationship = getElementsByLocalName(relationshipsXml, PACKAGE_RELATIONSHIP_NAMESPACE, "Relationship").find((candidate) => candidate.getAttribute("Id") === relationshipId);
		const target = relationship === null || relationship === void 0 ? void 0 : relationship.getAttribute("Target");
		if (!target || (relationship === null || relationship === void 0 ? void 0 : relationship.getAttribute("TargetMode")) === "External") return;
		const partName = resolvePackagePartPath(DOCX_DOCUMENT_PART, target);
		const mimeType = resolveDocxImageMimeType(partName);
		const imageEntry = archive.file(partName) || archive.file(decodeURIComponent(partName));
		if (!mimeType || !imageEntry) return;
		return `data:${mimeType};base64,${await imageEntry.async("base64")}`;
	} catch {
		return;
	}
};
var applyDocxPageBackgroundImage = (target, imageUrl) => {
	if (!imageUrl) return 0;
	let applied = 0;
	target.querySelectorAll("section.docx").forEach((page) => {
		const existing = Array.from(page.children).find((child) => child.classList.contains(DOCX_PAGE_BACKGROUND_CLASS));
		const background = existing || target.ownerDocument.createElement("div");
		background.className = DOCX_PAGE_BACKGROUND_CLASS;
		background.setAttribute("aria-hidden", "true");
		background.style.backgroundImage = `url("${imageUrl}")`;
		if (!existing) page.prepend(background);
		applied += 1;
	});
	return applied;
};
var shouldUseDocxWorker = (target, docxOptions) => {
	var _a, _b;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.worker) === false) return false;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.worker) === true) return true;
	const WorkerCtor = (_b = (_a = getTargetWindow(target)) === null || _a === void 0 ? void 0 : _a.Worker) !== null && _b !== void 0 ? _b : globalThis.Worker;
	return Boolean(WorkerCtor && (docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.workerUrl) && !DOCX_WORKER_UNSAFE_PROTOCOLS.has(getTargetProtocol(target)));
};
var prefersDarkColorScheme = (target) => {
	var _a;
	const view = getTargetWindow(target);
	const matchMedia = (_a = view === null || view === void 0 ? void 0 : view.matchMedia) !== null && _a !== void 0 ? _a : globalThis.matchMedia;
	return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
};
var resolveDocxDarkMode = (target, context, docxOptions) => {
	var _a;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.darkMode) !== void 0) return docxOptions.darkMode;
	const theme = normalizeFileViewerTheme((_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.theme);
	if (theme === "dark") return true;
	if (theme === "light") return false;
	return prefersDarkColorScheme(target);
};
var appendDocxVendorAssetVersion = (url, explicitUrl) => {
	if (!url || explicitUrl) return url;
	if (/[?&]file-viewer-docx=[^&#]*/.test(url)) return url.replace(/([?&])file-viewer-docx=[^&#]*/, `$1file-viewer-docx=${DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION}`);
	return `${url}${url.includes("?") ? "&" : "?"}file-viewer-docx=${DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION}`;
};
var applyDocxExternalLinkPolicy = (target, policy) => {
	if (policy === "allow") return 0;
	let blocked = 0;
	target.querySelectorAll("a[href]").forEach((anchor) => {
		const href = anchor.getAttribute("href");
		if (!href || href.startsWith("#")) return;
		if (!anchor.hasAttribute("data-docx-external-href")) anchor.setAttribute("data-docx-external-href", href);
		anchor.removeAttribute("href");
		anchor.setAttribute("aria-disabled", "true");
		blocked += 1;
	});
	return blocked;
};
var createDocxOptions = (target, context, notifyProgressiveRender) => {
	var _a, _b, _c, _d, _e;
	const docxOptions = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.docx;
	const documentBaseUrl = resolveFileViewerRuntimeAssetBaseUrl(target.ownerDocument);
	const useWorker = shouldUseDocxWorker(target, docxOptions);
	const usePagedLayout = (docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.visualPagination) === true;
	const darkMode = resolveDocxDarkMode(target, context, docxOptions);
	const progress = (event) => {
		if (event.phase === "render" || event.phase === "layout" || event.phase === "done") notifyProgressiveRender();
	};
	const externalLinkPolicy = (_b = docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.externalLinkPolicy) !== null && _b !== void 0 ? _b : "block";
	const externalResourcePolicy = (_c = docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.externalResourcePolicy) !== null && _c !== void 0 ? _c : "block";
	const options = {
		useWorker,
		reviewMode: (_d = docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.reviewMode) !== null && _d !== void 0 ? _d : "all",
		breakPages: true,
		fixedPageHeight: usePagedLayout,
		ignoreLastRenderedPageBreak: (_e = docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.ignoreLastRenderedPageBreak) !== null && _e !== void 0 ? _e : !usePagedLayout,
		externalLinkPolicy,
		externalResourcePolicy,
		darkMode,
		progress: (event) => {
			if (event.phase === "render" || event.phase === "layout" || event.phase === "done") applyDocxExternalLinkPolicy(target, externalLinkPolicy);
			progress(event);
		}
	};
	if (useWorker) {
		options.workerUrl = appendDocxVendorAssetVersion(resolveFileViewerDocxWorkerUrl(docxOptions, documentBaseUrl), !!(docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.workerUrl));
		options.workerJsZipUrl = appendDocxVendorAssetVersion(resolveFileViewerDocxWorkerJsZipUrl(docxOptions, documentBaseUrl), !!(docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.workerJsZipUrl));
	}
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.workerTimeout) !== void 0) options.workerTimeout = docxOptions.workerTimeout;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.renderPageBatchSize) !== void 0) options.renderPageBatchSize = docxOptions.renderPageBatchSize;
	else if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.progressive) === false) options.renderPageBatchSize = Number.MAX_SAFE_INTEGER;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.renderYieldEveryMs) !== void 0) options.renderYieldEveryMs = docxOptions.renderYieldEveryMs;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.strictWordCompatibility) !== void 0) options.strictWordCompatibility = docxOptions.strictWordCompatibility;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.paginationTolerance) !== void 0) options.paginationTolerance = docxOptions.paginationTolerance;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.maxDynamicPaginationPasses) !== void 0) options.maxDynamicPaginationPasses = docxOptions.maxDynamicPaginationPasses;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.awaitLayout) !== void 0) options.awaitLayout = docxOptions.awaitLayout;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.preserveComplexFieldResults) !== void 0) options.preserveComplexFieldResults = docxOptions.preserveComplexFieldResults;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.updatePageReferences) !== void 0) options.updatePageReferences = docxOptions.updatePageReferences;
	if ((docxOptions === null || docxOptions === void 0 ? void 0 : docxOptions.hideWebHiddenContent) !== void 0) options.hideWebHiddenContent = docxOptions.hideWebHiddenContent;
	return options;
};
var isTargetHTMLElement = (value, target) => {
	var _a;
	const HTMLElementCtor = (_a = getTargetWindow(target)) === null || _a === void 0 ? void 0 : _a.HTMLElement;
	return HTMLElementCtor ? value instanceof HTMLElementCtor : value instanceof HTMLElement;
};
var DOCX_RESPONSIVE_CSS = `
/* This component has no review balloon rail, so keep all-markup deletions readable inline. */
.docx-fit-viewer [data-docx-review-enabled="true"][data-docx-review-mode="all"] del[data-docx-change-kind]{display:inline!important;width:auto!important;max-width:none!important;height:auto!important;overflow:visible!important;line-height:inherit!important;color:var(--docx-review-color,#c2410c);text-decoration:line-through;text-decoration-color:var(--docx-review-color,#c2410c)}
.docx-fit-viewer {
  box-sizing: border-box;
  height: 100%;
  overflow: auto;
  background: var(--file-viewer-render-surface-background, #ececec);
  color-scheme: light;
}
.docx-fit-viewer[data-docx-dark-mode='true'] {
  background: var(--file-viewer-render-surface-background, #242424);
  color-scheme: dark;
}
.docx-fit-viewer .docx-wrapper {
  box-sizing: border-box;
  min-width: 0 !important;
  width: 100% !important;
  padding: 24px 14px 40px !important;
  background: var(--file-viewer-render-surface-background, #e7e9ec) !important;
}
.docx-fit-viewer[data-docx-dark-mode='true'] .docx-wrapper {
  background: var(--file-viewer-render-surface-background, #242424) !important;
}
.docx-fit-viewer .docx-page-frame {
  position: relative;
  width: 100%;
  min-width: 0;
  margin: 0 auto 24px;
  overflow: visible;
}
.docx-fit-viewer .docx-flow-frame {
  position: relative;
  width: 100%;
  min-width: 0;
  margin: 0 auto 28px;
  overflow: visible;
}
.docx-fit-viewer .docx-page-frame > section.docx,
.docx-fit-viewer .docx-flow-frame > section.docx {
  position: absolute;
  top: 0;
  left: 50%;
  margin: 0 !important;
  background: #ffffff !important;
  box-shadow: 0 2px 14px rgba(25, 35, 48, 0.18);
  box-sizing: border-box;
  overflow: hidden;
  transform-origin: top center;
}
.docx-fit-viewer .docx-page-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
.docx-fit-viewer[data-docx-dark-mode='true'] .docx-page-frame > section.docx,
.docx-fit-viewer[data-docx-dark-mode='true'] .docx-flow-frame > section.docx {
  background: rgb(51, 51, 51) !important;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  outline: 1px solid rgba(255, 255, 255, 0.15);
  outline-offset: -1px;
}
.docx-fit-viewer .docx-flow-frame > section.docx {
  height: auto !important;
  min-height: var(--docx-page-height, auto) !important;
  overflow: visible !important;
}
.docx-fit-viewer .docx-page-frame > section.docx > article,
.docx-fit-viewer .docx-flow-frame > section.docx > article {
  position: relative;
  z-index: 1;
}
`;
function installResponsiveStyle(target) {
	const style = target.ownerDocument.createElement("style");
	style.textContent = DOCX_RESPONSIVE_CSS;
	target.prepend(style);
	return style;
}
function wrapDocxSections(target, pagedLayout) {
	const wrapper = target.querySelector(".docx-wrapper");
	if (!wrapper) return [];
	return Array.from(wrapper.children).flatMap((child) => {
		if (!isTargetHTMLElement(child, target) || !child.matches("section.docx")) return [];
		const frame = target.ownerDocument.createElement("div");
		frame.className = pagedLayout ? "docx-page-frame" : "docx-flow-frame";
		child.before(frame);
		frame.appendChild(child);
		return [frame];
	});
}
function makeDocxResponsive(target, context) {
	var _a, _b;
	target.classList.add("docx-fit-viewer");
	const style = installResponsiveStyle(target);
	const pagedLayout = ((_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.docx) === null || _b === void 0 ? void 0 : _b.visualPagination) === true;
	const frames = wrapDocxSections(target, pagedLayout);
	const view = getTargetWindow(target);
	const ResizeObserverCtor = view === null || view === void 0 ? void 0 : view.ResizeObserver;
	let resizeFrame = 0;
	let userZoom = 1;
	let currentScale = 1;
	let currentFitScale = 1;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const clampScale = (scale) => {
		return Math.min(DOCX_MAX_SCALE, Math.max(DOCX_MIN_SCALE, Number(scale.toFixed(2))));
	};
	const applyResponsiveLayout = () => {
		let firstScale = currentScale;
		let firstFitScale = currentFitScale;
		let measured = false;
		frames.forEach((frame) => {
			const page = frame.firstElementChild;
			if (!isTargetHTMLElement(page, target)) return;
			page.style.transform = "translateX(-50%)";
			correctDocxMixedAnchorOrigins(page);
			const pageWidth = page.offsetWidth;
			const contentHeight = pagedLayout ? page.offsetHeight : Math.max(page.scrollHeight, page.offsetHeight);
			if (!pageWidth || !contentHeight) return;
			const availableWidth = Math.max(target.clientWidth - 28, 120);
			const fitScale = Math.min(1, Math.max(DOCX_MIN_SCALE, availableWidth / pageWidth));
			const scale = clampScale(fitScale * userZoom);
			if (!measured) {
				firstScale = scale;
				firstFitScale = fitScale;
				measured = true;
			}
			page.style.transform = `translateX(-50%) scale(${scale})`;
			frame.style.width = `${Math.ceil(Math.max(pageWidth * scale, target.clientWidth - 28, 120))}px`;
			frame.style.maxWidth = "none";
			frame.style.height = `${Math.ceil(contentHeight * scale)}px`;
		});
		if (!measured) return;
		currentScale = firstScale;
		currentFitScale = firstFitScale;
		zoomEmitter.emit();
	};
	const resize = () => {
		if (!view) {
			applyResponsiveLayout();
			return;
		}
		view.cancelAnimationFrame(resizeFrame);
		resizeFrame = view.requestAnimationFrame(() => {
			applyResponsiveLayout();
		});
	};
	const getZoomState = () => ({
		scale: currentScale,
		label: `${Math.round(currentScale * 100)}%`,
		canZoomIn: currentScale < DOCX_MAX_SCALE,
		canZoomOut: currentScale > DOCX_MIN_SCALE,
		canReset: userZoom !== 1,
		minScale: DOCX_MIN_SCALE,
		maxScale: DOCX_MAX_SCALE
	});
	const setUserZoom = (nextZoom) => {
		userZoom = Math.min(6, Math.max(.2, Number(nextZoom.toFixed(2))));
		view === null || view === void 0 || view.cancelAnimationFrame(resizeFrame);
		applyResponsiveLayout();
		return getZoomState();
	};
	const setAbsoluteScale = (scale) => {
		return setUserZoom(scale / Math.max(currentFitScale, .01));
	};
	const readFitPageSize = () => {
		for (const frame of frames) {
			const page = getDocxPageElement(frame);
			if (!page) continue;
			const pageSize = getElementPrintPageSize(page, DOCX_DEFAULT_PAGE_SIZE);
			return {
				width: page.offsetWidth || pageSize.width || DOCX_DEFAULT_PAGE_SIZE.width,
				height: isDocxFlowFrame(frame) ? DOCX_DEFAULT_PAGE_SIZE.height : page.offsetHeight || pageSize.height || DOCX_DEFAULT_PAGE_SIZE.height
			};
		}
		return null;
	};
	const fitDocx = (request) => {
		var _a, _b;
		const pageSize = readFitPageSize();
		if (!pageSize) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "unmeasurable",
			provider: "zoom"
		};
		const mode = request.mode === "auto" ? "width" : request.mode;
		const scale = resolveFileViewerFitScale({
			mode,
			viewportWidth: Math.max(1, request.viewportWidth || target.clientWidth || 0),
			viewportHeight: Math.max(1, request.viewportHeight || target.clientHeight || 0),
			contentWidth: pageSize.width,
			contentHeight: pageSize.height,
			currentScale,
			minScale: (_a = request.minScale) !== null && _a !== void 0 ? _a : DOCX_MIN_SCALE,
			maxScale: (_b = request.maxScale) !== null && _b !== void 0 ? _b : DOCX_MAX_SCALE
		});
		if (!scale) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "unmeasurable",
			provider: "zoom"
		};
		const state = setAbsoluteScale(scale);
		return {
			applied: true,
			mode: request.mode,
			resize: request.resize,
			scale: state.scale,
			source: request.source,
			provider: "zoom"
		};
	};
	target.dataset.viewerZoomProvider = "docx";
	registerFileViewerZoomProvider(target, {
		zoomIn: () => setUserZoom((currentScale + DOCX_ZOOM_STEP) / Math.max(currentFitScale, .01)),
		zoomOut: () => setUserZoom((currentScale - DOCX_ZOOM_STEP) / Math.max(currentFitScale, .01)),
		resetZoom: () => setUserZoom(1),
		setZoom: setAbsoluteScale,
		fit: fitDocx,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	const observer = ResizeObserverCtor ? new ResizeObserverCtor(resize) : null;
	observer === null || observer === void 0 || observer.observe(target);
	frames.forEach((frame) => {
		const page = getDocxPageElement(frame);
		if (page) observer === null || observer === void 0 || observer.observe(page);
	});
	applyResponsiveLayout();
	return () => {
		view === null || view === void 0 || view.cancelAnimationFrame(resizeFrame);
		observer === null || observer === void 0 || observer.disconnect();
		unregisterFileViewerZoomProvider(target);
		style.remove();
		target.classList.remove("docx-fit-viewer");
	};
}
function getDocxPageElement(frame) {
	var _a;
	const page = frame.firstElementChild;
	const HTMLElementCtor = (_a = frame.ownerDocument.defaultView) === null || _a === void 0 ? void 0 : _a.HTMLElement;
	return HTMLElementCtor && page instanceof HTMLElementCtor ? page : null;
}
function isDocxFlowFrame(frame) {
	return !!(frame === null || frame === void 0 ? void 0 : frame.classList.contains("docx-flow-frame"));
}
function isDocxCanvasSheet(frame) {
	return !!(frame === null || frame === void 0 ? void 0 : frame.classList.contains("docx-canvas-sheet"));
}
function getDocxFramePrintSize(frame) {
	const page = frame ? getDocxPageElement(frame) : null;
	if (!page) return DOCX_DEFAULT_PAGE_SIZE;
	const size = getElementPrintPageSize(page, DOCX_DEFAULT_PAGE_SIZE);
	if (!isDocxFlowFrame(frame)) return size;
	return {
		width: size.width,
		height: Math.max(page.scrollHeight || 0, page.offsetHeight || 0, DOCX_DEFAULT_PAGE_SIZE.height)
	};
}
function normalizeDocxPageForPrint(frame, pageSize) {
	var _a;
	if (isDocxCanvasSheet(frame)) {
		applyPrintPageSize(frame, pageSize);
		(_a = frame.dataset).viewerPrintPageIndex || (_a.viewerPrintPageIndex = "0");
		frame.classList.remove("docx-canvas-sheet-pending", "docx-canvas-sheet-virtualized");
		frame.style.position = "relative";
		frame.style.contain = "none";
		frame.style.margin = "0 auto 18px";
		frame.style.boxShadow = "none";
		return;
	}
	const flowLayout = isDocxFlowFrame(frame);
	const pageWidth = formatCssPixels(pageSize.width);
	const pageHeight = formatCssPixels(pageSize.height);
	applyPrintPageSize(frame, pageSize, { heightMode: flowLayout ? "min" : "fixed" });
	frame.style.margin = "0 auto 18px";
	const page = getDocxPageElement(frame);
	if (!page) return;
	page.style.position = "relative";
	page.style.top = "auto";
	page.style.left = "auto";
	page.style.width = pageWidth;
	page.style.maxWidth = "none";
	page.style.minHeight = flowLayout ? "0" : pageHeight;
	page.style.height = flowLayout ? "auto" : pageHeight;
	page.style.margin = "0 auto";
	page.style.transform = "none";
	page.style.transformOrigin = "top left";
	page.style.overflow = flowLayout ? "visible" : "hidden";
	page.style.boxShadow = "none";
}
function buildDocxPrintStyle(target) {
	const firstFrame = target.querySelector(".docx-page-frame, .docx-flow-frame, .docx-canvas-sheet");
	const pageSize = getDocxFramePrintSize(firstFrame || void 0);
	const selector = isDocxCanvasSheet(firstFrame || void 0) ? ".viewer-export-content .docx-canvas-sheet" : (firstFrame === null || firstFrame === void 0 ? void 0 : firstFrame.classList.contains("docx-flow-frame")) ? ".viewer-export-content .docx-flow-frame" : ".viewer-export-content .docx-page-frame";
	return buildPrintPageStyle({
		selector,
		width: pageSize.width,
		height: (firstFrame === null || firstFrame === void 0 ? void 0 : firstFrame.classList.contains("docx-flow-frame")) ? DOCX_DEFAULT_PAGE_SIZE.height : pageSize.height,
		heightMode: (firstFrame === null || firstFrame === void 0 ? void 0 : firstFrame.classList.contains("docx-flow-frame")) ? "min" : "fixed"
	});
}
async function prepareDocxCloneForExport(target) {
	const view = getTargetWindow(target);
	const usesVirtualCanvas = !!target.querySelector(".docx-canvas-sheet");
	const materializeAllPages = view === null || view === void 0 ? void 0 : view.__docxCanvasMaterializeAllPages;
	let materializedForSnapshot = false;
	if (usesVirtualCanvas && typeof materializeAllPages === "function") {
		await materializeAllPages.call(view, "file-viewer-print-snapshot");
		await waitForFileViewerNextPaint(view);
		materializedForSnapshot = true;
	}
	try {
		const selector = ".docx-page-frame, .docx-flow-frame, .docx-canvas-sheet";
		const liveFrames = Array.from(target.querySelectorAll(selector));
		const clone = target.cloneNode(true);
		replaceFileViewerCanvasWithImages(target, clone);
		const printDocument = target.ownerDocument.createElement("div");
		printDocument.className = "docx-print-document";
		const scopedStyles = Array.from(clone.querySelectorAll("style")).filter((style) => {
			var _a;
			return !((_a = style.textContent) === null || _a === void 0 ? void 0 : _a.includes(".docx-fit-viewer"));
		}).map((style) => style.outerHTML).join("");
		clone.querySelectorAll(selector).forEach((frame, index) => {
			frame.dataset.viewerPrintPageIndex = String(index);
			normalizeDocxPageForPrint(frame, getDocxFramePrintSize(liveFrames[index]));
			printDocument.appendChild(frame.cloneNode(true));
		});
		return printDocument.childElementCount ? `${scopedStyles}${printDocument.outerHTML}` : clone.innerHTML;
	} finally {
		if (materializedForSnapshot && view) {
			const afterPrint = target.ownerDocument.createEvent("Event");
			afterPrint.initEvent("afterprint", false, false);
			view.dispatchEvent(afterPrint);
		}
	}
}
/**
* 渲染docx文件
*/
async function wordDocx_default(buffer, target, context) {
	var _a, _b;
	assertValidDocxPackage(buffer, context);
	target.replaceChildren();
	let hasNotifiedProgressiveRender = false;
	const notifyProgressiveRender = () => {
		var _a;
		if (hasNotifiedProgressiveRender) return;
		hasNotifiedProgressiveRender = true;
		(_a = context === null || context === void 0 ? void 0 : context.onProgressiveRender) === null || _a === void 0 || _a.call(context);
	};
	const docxOptions = createDocxOptions(target, context, notifyProgressiveRender);
	const [{ defaultOptions, renderAsync }, pageBackgroundImage] = await Promise.all([loadLibrary(), resolveDocxPageBackgroundImage(buffer, () => createTargetXmlParser(target))]);
	target.dataset.docxWorker = docxOptions.useWorker ? "self" : "false";
	target.dataset.docxDarkMode = docxOptions.darkMode ? "true" : "false";
	const usedHeaderFooterFallback = await renderDocxWithHeaderFooterFallback(renderAsync, buffer, target, {
		...defaultOptions,
		...docxOptions
	});
	applyDocxExternalLinkPolicy(target, docxOptions.externalLinkPolicy);
	target.dataset.docxHeaderFooterFallback = usedHeaderFooterFallback ? "true" : "false";
	target.dataset.docxPageBackground = applyDocxPageBackgroundImage(target, pageBackgroundImage) > 0 ? "true" : "false";
	notifyProgressiveRender();
	const disposeResponsive = makeDocxResponsive(target, context);
	(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, {
		includeDocumentStyles: false,
		getPrintMaskPages: () => Array.from(target.querySelectorAll(".docx-page-frame, .docx-flow-frame, .docx-canvas-sheet")),
		beforeSnapshot: () => {
			const view = getTargetWindow(target);
			if (view) view.dispatchEvent(new view.Event("resize"));
		},
		printStyle: () => buildDocxPrintStyle(target),
		toHtml: () => prepareDocxCloneForExport(target)
	});
	(_b = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _b === void 0 || _b.call(context, { getTarget: () => target.querySelector(".docx-page-frame, .docx-flow-frame, .docx-canvas-sheet") || target });
	return {
		$el: target,
		unmount() {
			var _a, _b;
			(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
			(_b = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _b === void 0 || _b.call(context, null);
			disposeResponsive();
			delete target.dataset.docxWorker;
			delete target.dataset.docxDarkMode;
			delete target.dataset.docxHeaderFooterFallback;
			delete target.dataset.docxPageBackground;
			target.replaceChildren();
		}
	};
}
//#endregion
export { applyDocxExternalLinkPolicy, applyDocxPageBackgroundImage, createDocxOptions, wordDocx_default as default, isMissingDocxHeaderFooterRootError, renderDocxWithHeaderFooterFallback, resolveDocxPageBackgroundImage };
