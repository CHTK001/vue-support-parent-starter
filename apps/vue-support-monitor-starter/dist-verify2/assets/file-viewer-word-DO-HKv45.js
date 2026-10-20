const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/docx-preview-D5ZvH0cB.js","assets/rolldown-runtime-CEgmsyvS.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/file-viewer-drawing-DeKTjxNF.js"])))=>i.map(i=>d[i]);
import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { $i as formatCssPixels, Bu as resolveFileViewerRuntimeAssetBaseUrl, Du as resolveFileViewerDocxWorkerUrl, Eu as resolveFileViewerDocxWorkerJsZipUrl, Hs as unregisterFileViewerZoomProvider, Jc as DEFAULT_FILE_VIEWER_DOCX_RUNTIME_VERSION, Qi as buildPrintPageStyle, Zi as applyPrintPageSize, Zo as resolveFileViewerFitScale, Zu as replaceFileViewerCanvasWithImages, ea as getElementPrintPageSize, gn as normalizeFileViewerTheme, ho as createFileViewerTranslator, nd as waitForFileViewerNextPaint, ts as createFileViewerZoomChangeEmitter, ud as __vitePreload, zs as registerFileViewerZoomProvider } from "./file-viewer-3d-ijA7B-Qe.js";
import { a as require_lib } from "./file-viewer-mindmap-DFVq45rQ.js";
import { C as createFileViewerRtfHyperlinkContainer, D as defaultMsDocCss, E as sanitizeMsDocHtml, O as getFileViewerRtfLoader, T as parseMsDocToHtml, w as sanitizeFileViewerRtfElement } from "./file-viewer-preset-all-CExGzNo-.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/openDocument.js
var import_lib = /* @__PURE__ */ __toESM(require_lib(), 1);
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
	const content = await ((_a = (await import_lib.default.loadAsync(buffer)).file("content.xml")) === null || _a === void 0 ? void 0 : _a.async("text"));
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
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/wordDoc.js
var PAGE_BREAK_MARKER = "<span class=\"msdoc-page-break\"></span>";
var EMPTY_PAGE_HTML = "<p class=\"msdoc-paragraph\"><br></p>";
var MSDOC_PAGE_SIZE = {
	width: 794,
	height: 1123
};
var MSDOC_MIN_SCALE = .24;
var MSDOC_MAX_SCALE = 3;
var MSDOC_ZOOM_STEP = .15;
var WORD_PAGE_CSS = `
.msdoc-stage{
  box-sizing:border-box;
  min-height:100%;
  padding:32px 24px 48px;
  background:var(--file-viewer-render-surface-background,#ececec);
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:24px;
}
.msdoc-page{
  width:min(100%,794px);
  box-sizing:border-box;
}
.msdoc-page > .msdoc-root{
  box-sizing:border-box;
  width:100%;
  max-width:none;
  min-height:1123px;
  padding:clamp(24px,7%,96px) clamp(20px,6%,88px);
  background:#fff;
  border:1px solid #d9d9d9;
  box-shadow:0 1px 3px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.12);
  overflow-wrap:anywhere;
}
/* 表格不能沿用正文的 anywhere 断词，否则旧 DOC 的列宽和单元格内容会被过度压缩。 */
.msdoc-page .msdoc-table{
  display:table;
  width:auto;
  max-width:100%;
  table-layout:auto!important;
  border-collapse:collapse;
  border-spacing:0;
}
.msdoc-page .msdoc-table tbody,
.msdoc-page .msdoc-table tr{
  width:auto;
}
.msdoc-page .msdoc-cell{
  min-width:1.5em;
  padding:4px 6px;
  vertical-align:top;
  word-break:normal;
  overflow-wrap:normal;
  white-space:normal;
}
.msdoc-page .msdoc-cell .msdoc-paragraph{
  margin:0 0 4px;
  word-break:normal;
  overflow-wrap:break-word;
}
.msdoc-page .msdoc-cell .msdoc-paragraph:last-child{
  margin-bottom:0;
}
.msdoc-page .msdoc-cell span{
  white-space:normal!important;
}
.msdoc-page .msdoc-page-break{
  display:none;
}
[data-viewer-theme='dark'] .msdoc-stage{
  background:var(--file-viewer-render-surface-background,#111827);
}
[data-viewer-theme='dark'] .msdoc-page > .msdoc-root{
  color-scheme:dark;
  background:#161b22;
  border-color:rgba(139,148,158,.24);
  color:#e6edf3;
  box-shadow:0 18px 44px rgba(0,0,0,.36);
}
[data-viewer-theme='dark'] .msdoc-page > .msdoc-root span[style*='color:#000000']{
  color:#e6edf3!important;
}
[data-viewer-theme='dark'] .msdoc-page .msdoc-link{
  color:#58a6ff;
}
[data-viewer-theme='dark'] .msdoc-page .msdoc-attachment{
  border-color:rgba(139,148,158,.3);
  background:#21262d;
  color:#58a6ff;
}
@media (prefers-color-scheme:dark){
  [data-viewer-theme='system'] .msdoc-stage{
    background:var(--file-viewer-render-surface-background,#111827);
  }
  [data-viewer-theme='system'] .msdoc-page > .msdoc-root{
    color-scheme:dark;
    background:#161b22;
    border-color:rgba(139,148,158,.24);
    color:#e6edf3;
    box-shadow:0 18px 44px rgba(0,0,0,.36);
  }
  [data-viewer-theme='system'] .msdoc-page > .msdoc-root span[style*='color:#000000']{
    color:#e6edf3!important;
  }
  [data-viewer-theme='system'] .msdoc-page .msdoc-link{
    color:#58a6ff;
  }
  [data-viewer-theme='system'] .msdoc-page .msdoc-attachment{
    border-color:rgba(139,148,158,.3);
    background:#21262d;
    color:#58a6ff;
  }
}
@media (max-width: 860px){
  .msdoc-stage{
    padding:16px 12px 24px;
    gap:16px;
  }
  .msdoc-page{
    width:100%;
  }
  .msdoc-page > .msdoc-root{
    min-height:auto;
    padding:24px 20px;
    box-shadow:none;
  }
}
`;
var MSDOC_ZOOM_CSS = `
.msdoc-zoom-viewer{
  box-sizing:border-box;
  height:100%;
  overflow:auto;
  background:var(--file-viewer-render-surface-background,#ececec);
}
[data-viewer-theme='dark'] .msdoc-zoom-viewer{
  background:var(--file-viewer-render-surface-background,#111827);
}
@media (prefers-color-scheme:dark){
  [data-viewer-theme='system'] .msdoc-zoom-viewer{
    background:var(--file-viewer-render-surface-background,#111827);
  }
}
.msdoc-zoom-viewer .msdoc-stage{
  min-width:max-content;
}
.msdoc-zoom-viewer .msdoc-page{
  position:relative;
  max-width:none;
  overflow:visible;
}
.msdoc-zoom-viewer .msdoc-page > .msdoc-root{
  position:absolute;
  top:0;
  left:50%;
  width:${MSDOC_PAGE_SIZE.width}px;
  max-width:none;
  margin:0;
  transform-origin:top center;
}
`;
var getTargetWindow$1 = (target) => {
	return target.ownerDocument.defaultView;
};
function injectPageBreakMarkers(html) {
	return html.replace(/<(p|table|section)([^>]*?)style="([^"]*?\bbreak-before\s*:\s*page;?[^"]*?)"([^>]*)>/gi, (match) => `${PAGE_BREAK_MARKER}${match}`);
}
function wrapAsWordPages(html) {
	return `<div class="msdoc-stage">${injectPageBreakMarkers(html).split(PAGE_BREAK_MARKER).map((page) => `<section class="msdoc-page"><div class="msdoc-root">${page || EMPTY_PAGE_HTML}</div></section>`).join("")}</div>`;
}
function prepareMsDocCloneForExport(target) {
	const clone = target.cloneNode(true);
	clone.classList.remove("msdoc-zoom-viewer");
	clone.querySelectorAll("style[data-msdoc-zoom]").forEach((style) => style.remove());
	clone.querySelectorAll(".msdoc-stage, .msdoc-page, .msdoc-root").forEach((node) => {
		node.style.height = "auto";
		node.style.maxHeight = "none";
		node.style.overflow = "visible";
		node.style.transform = "none";
	});
	clone.querySelectorAll(".msdoc-page").forEach((page, index) => {
		page.dataset.viewerPrintPageIndex = String(index);
		applyPrintPageSize(page, MSDOC_PAGE_SIZE, { heightMode: "min" });
		page.style.position = "relative";
		page.style.width = formatCssPixels(MSDOC_PAGE_SIZE.width);
		page.style.maxWidth = "none";
		page.style.margin = "0 auto 18px";
		const root = page.querySelector(".msdoc-root");
		if (!root) return;
		root.style.position = "relative";
		root.style.top = "auto";
		root.style.left = "auto";
		root.style.width = formatCssPixels(MSDOC_PAGE_SIZE.width);
		root.style.maxWidth = "none";
		root.style.minHeight = formatCssPixels(MSDOC_PAGE_SIZE.height);
		root.style.height = "auto";
		root.style.transform = "none";
		root.style.transformOrigin = "top left";
		root.style.boxShadow = "none";
		root.style.border = "0";
		root.style.overflow = "visible";
	});
	return clone.innerHTML;
}
function buildMsDocPrintStyle() {
	return buildPrintPageStyle({
		selector: ".viewer-export-content .msdoc-page",
		width: MSDOC_PAGE_SIZE.width,
		height: MSDOC_PAGE_SIZE.height,
		heightMode: "min"
	});
}
function makeMsDocResponsive(target) {
	const pages = Array.from(target.querySelectorAll(".msdoc-page"));
	if (!pages.length) return () => {};
	target.classList.add("msdoc-zoom-viewer");
	const view = getTargetWindow$1(target);
	const ResizeObserverCtor = view === null || view === void 0 ? void 0 : view.ResizeObserver;
	const style = target.ownerDocument.createElement("style");
	style.dataset.msdocZoom = "true";
	style.textContent = MSDOC_ZOOM_CSS;
	target.prepend(style);
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	let resizeFrame = 0;
	let userZoom = 1;
	let currentScale = 1;
	let currentFitScale = 1;
	const clampScale = (scale) => {
		return Math.min(MSDOC_MAX_SCALE, Math.max(MSDOC_MIN_SCALE, Number(scale.toFixed(2))));
	};
	const applyResponsiveLayout = () => {
		let firstScale = currentScale;
		let firstFitScale = currentFitScale;
		let measured = false;
		pages.forEach((page) => {
			const root = page.querySelector(".msdoc-root");
			if (!root) return;
			const rootWidth = root.offsetWidth || MSDOC_PAGE_SIZE.width;
			const rootHeight = Math.max(root.scrollHeight, root.offsetHeight, MSDOC_PAGE_SIZE.height);
			const availableWidth = Math.max(target.clientWidth - 48, 120);
			const fitScale = Math.min(1, Math.max(MSDOC_MIN_SCALE, availableWidth / rootWidth));
			const scale = clampScale(fitScale * userZoom);
			if (!measured) {
				firstScale = scale;
				firstFitScale = fitScale;
				measured = true;
			}
			root.style.transform = `translateX(-50%) scale(${scale})`;
			page.style.width = `${Math.ceil(Math.max(rootWidth * scale, 120))}px`;
			page.style.height = `${Math.ceil(rootHeight * scale)}px`;
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
		canZoomIn: currentScale < MSDOC_MAX_SCALE,
		canZoomOut: currentScale > MSDOC_MIN_SCALE,
		canReset: userZoom !== 1,
		minScale: MSDOC_MIN_SCALE,
		maxScale: MSDOC_MAX_SCALE
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
		var _a;
		const root = (_a = pages[0]) === null || _a === void 0 ? void 0 : _a.querySelector(".msdoc-root");
		return {
			width: (root === null || root === void 0 ? void 0 : root.offsetWidth) || MSDOC_PAGE_SIZE.width,
			height: MSDOC_PAGE_SIZE.height
		};
	};
	const fitDoc = (request) => {
		var _a, _b;
		const pageSize = readFitPageSize();
		const mode = request.mode === "auto" ? "width" : request.mode;
		const scale = resolveFileViewerFitScale({
			mode,
			viewportWidth: Math.max(1, request.viewportWidth || target.clientWidth || 0),
			viewportHeight: Math.max(1, request.viewportHeight || target.clientHeight || 0),
			contentWidth: pageSize.width,
			contentHeight: pageSize.height,
			currentScale,
			minScale: (_a = request.minScale) !== null && _a !== void 0 ? _a : MSDOC_MIN_SCALE,
			maxScale: (_b = request.maxScale) !== null && _b !== void 0 ? _b : MSDOC_MAX_SCALE
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
	target.dataset.viewerZoomProvider = "doc";
	registerFileViewerZoomProvider(target, {
		zoomIn: () => setUserZoom((currentScale + MSDOC_ZOOM_STEP) / Math.max(currentFitScale, .01)),
		zoomOut: () => setUserZoom((currentScale - MSDOC_ZOOM_STEP) / Math.max(currentFitScale, .01)),
		resetZoom: () => setUserZoom(1),
		setZoom: setAbsoluteScale,
		fit: fitDoc,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	const observer = ResizeObserverCtor ? new ResizeObserverCtor(resize) : null;
	observer === null || observer === void 0 || observer.observe(target);
	pages.forEach((page) => {
		const root = page.querySelector(".msdoc-root");
		if (root) observer === null || observer === void 0 || observer.observe(root);
	});
	applyResponsiveLayout();
	return () => {
		view === null || view === void 0 || view.cancelAnimationFrame(resizeFrame);
		observer === null || observer === void 0 || observer.disconnect();
		unregisterFileViewerZoomProvider(target);
		style.remove();
		target.classList.remove("msdoc-zoom-viewer");
	};
}
/**
* 渲染 doc 文件
*/
async function render(buffer, target, context) {
	var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
	const rendered = await parseMsDocToHtml(buffer, { renderOptions: {
		reviewMode: (_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.docx) === null || _b === void 0 ? void 0 : _b.reviewMode) !== null && _c !== void 0 ? _c : "all",
		css: `${defaultMsDocCss()}\n${WORD_PAGE_CSS}`,
		externalLinkPolicy: (_f = (_e = (_d = context === null || context === void 0 ? void 0 : context.options) === null || _d === void 0 ? void 0 : _d.docx) === null || _e === void 0 ? void 0 : _e.externalLinkPolicy) !== null && _f !== void 0 ? _f : "block",
		externalResourcePolicy: (_j = (_h = (_g = context === null || context === void 0 ? void 0 : context.options) === null || _g === void 0 ? void 0 : _g.docx) === null || _h === void 0 ? void 0 : _h.externalResourcePolicy) !== null && _j !== void 0 ? _j : "block"
	} });
	const targetWindow = target.ownerDocument.defaultView;
	if (!targetWindow) throw new Error("The DOC target must belong to a browser document");
	const style = target.ownerDocument.createElement("style");
	style.dataset.msdoc = "";
	style.textContent = rendered.css;
	const content = target.ownerDocument.createElement("div");
	content.append(sanitizeMsDocHtml(wrapAsWordPages(rendered.html), targetWindow));
	target.replaceChildren(style, ...Array.from(content.childNodes));
	const disposeResponsive = makeMsDocResponsive(target);
	(_k = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _k === void 0 || _k.call(context, {
		includeDocumentStyles: false,
		getPrintMaskPages: () => Array.from(target.querySelectorAll(".msdoc-page")),
		printStyle: buildMsDocPrintStyle,
		toHtml: () => prepareMsDocCloneForExport(target)
	});
	(_l = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _l === void 0 || _l.call(context, { getTarget: () => target.querySelector(".msdoc-page") || target });
	return {
		$el: target,
		unmount() {
			var _a, _b;
			(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
			(_b = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _b === void 0 || _b.call(context, null);
			disposeResponsive();
			target.replaceChildren();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/docxAnchors.js
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
			if (!this.module) this.module = __vitePreload(() => import("./docx-preview-D5ZvH0cB.js"), __vite__mapDeps([0,1,2,3,4]));
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
		const archive = await import_lib.default.loadAsync(buffer);
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
//#region ../../node_modules/.pnpm/@file-viewer+renderer-word@3.1.2/node_modules/@file-viewer/renderer-word/dist/wordMl.js
var WORDML = "http://schemas.microsoft.com/office/word/2003/wordml";
var WORD = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
var REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
var PACKAGE_REL = "http://schemas.openxmlformats.org/package/2006/relationships";
var CONTENT_TYPES = "http://schemas.openxmlformats.org/package/2006/content-types";
var AUX = "http://schemas.microsoft.com/office/word/2003/auxHint";
var VML = "urn:schemas-microsoft-com:vml";
var XMLNS = "http://www.w3.org/2000/xmlns/";
var aliases = {
	"h-ansi": "hAnsi",
	fareast: "eastAsia",
	"b-cs": "bCs",
	"i-cs": "iCs",
	"sz-cs": "szCs",
	"lang-cs": "lang",
	"panose-1": "panose1",
	"line-rule": "lineRule",
	"line-pitch": "linePitch",
	"char-space": "charSpace",
	"hanging-chars": "hangingChars",
	"first-line": "firstLine",
	"first-line-chars": "firstLineChars",
	"left-chars": "leftChars",
	"right-chars": "rightChars"
};
function decodeWordMlBytes(buffer) {
	const bytes = new Uint8Array(buffer);
	const utf16le = bytes[0] === 255 && bytes[1] === 254 || bytes[0] === 60 && bytes[1] === 0;
	const utf16be = bytes[0] === 254 && bytes[1] === 255 || bytes[0] === 0 && bytes[1] === 60;
	return new TextDecoder(utf16le ? "utf-16le" : utf16be ? "utf-16be" : "utf-8").decode(bytes);
}
/**
* Adapt the single-file Word 2003 XML container to the existing OOXML renderer.
* This is structural conversion, not HTML insertion or remote conversion. Body,
* styles, table properties, section geometry and VML remain renderer-owned.
* Inline headers/footers become package parts; only embedded image data is read.
*/
async function convertWordMlToDocx(buffer, target) {
	var _a, _b, _c, _d;
	const source = decodeWordMlBytes(buffer);
	if (/<!DOCTYPE\b|<!ENTITY\b/i.test(source)) throw new Error("Word 2003 XML must not contain a DTD or entity declarations.");
	const view = target.ownerDocument.defaultView;
	const Parser = (_a = view === null || view === void 0 ? void 0 : view.DOMParser) !== null && _a !== void 0 ? _a : globalThis.DOMParser;
	const Serializer = (_b = view === null || view === void 0 ? void 0 : view.XMLSerializer) !== null && _b !== void 0 ? _b : globalThis.XMLSerializer;
	const input = new Parser().parseFromString(source, "application/xml");
	if (input.getElementsByTagName("parsererror").length || input.documentElement.localName !== "wordDocument" || input.documentElement.namespaceURI !== WORDML) throw new Error("Invalid Word 2003 XML document.");
	const body = Array.from(input.documentElement.children).find((element) => element.namespaceURI === WORDML && element.localName === "body");
	if (!body) throw new Error("Word 2003 XML document has no body.");
	const zip = new import_lib.default();
	const serializer = new Serializer();
	const overrides = [];
	const images = /* @__PURE__ */ new Map();
	for (const binary of Array.from(input.getElementsByTagNameNS(WORDML, "binData"))) {
		const name = binary.getAttributeNS(WORDML, "name") || "";
		if (images.has(name)) continue;
		const extension = (_c = /\.(png|jpe?g|gif|bmp|tiff?|emf|wmf)$/i.exec(name)) === null || _c === void 0 ? void 0 : _c[1].toLowerCase();
		const bytes = ((_d = binary.textContent) === null || _d === void 0 ? void 0 : _d.replace(/\s/g, "")) || "";
		if (name && extension && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(bytes) && bytes) {
			const path = `media/image${images.size + 1}.${extension}`;
			images.set(name, {
				path,
				bytes
			});
			zip.file(`word/${path}`, bytes, { base64: true });
		}
	}
	const createDocument = (name) => {
		const doc = input.implementation.createDocument(WORD, `w:${name}`, null);
		doc.documentElement.setAttributeNS(XMLNS, "xmlns:r", REL);
		return doc;
	};
	const serialize = (document) => `<?xml version="1.0" encoding="UTF-8"?>${serializer.serializeToString(document)}`;
	const relationships = /* @__PURE__ */ new Map();
	function relate(part, type, destination) {
		let doc = relationships.get(part);
		if (!doc) {
			doc = input.implementation.createDocument(PACKAGE_REL, "Relationships", null);
			relationships.set(part, doc);
		}
		const id = `rId${doc.documentElement.children.length + 1}`;
		const item = doc.createElementNS(PACKAGE_REL, "Relationship");
		item.setAttribute("Id", id);
		item.setAttribute("Type", `${REL}/${type}`);
		item.setAttribute("Target", destination);
		doc.documentElement.appendChild(item);
		return id;
	}
	let headerNumber = 0;
	let footerNumber = 0;
	function appendConverted(node, parent, part, depth = 0) {
		if (depth > 256) throw new Error("Word 2003 XML nesting is too deep.");
		const output = parent.ownerDocument;
		if (node.nodeType === 3 || node.nodeType === 4) {
			parent.appendChild(output.createTextNode(node.textContent || ""));
			return;
		}
		if (node.nodeType !== 1) return;
		const element = node;
		const isWord = element.namespaceURI === WORDML;
		if (isWord && element.localName === "binData") return;
		if (element.namespaceURI === AUX) {
			for (const child of Array.from(element.childNodes)) appendConverted(child, parent, part, depth + 1);
			return;
		}
		if (isWord && (element.localName === "hdr" || element.localName === "ftr") && parent.localName === "sectPr") {
			const header = element.localName === "hdr";
			const partName = `${header ? "header" : "footer"}${header ? ++headerNumber : ++footerNumber}.xml`;
			const document = createDocument(header ? "hdr" : "ftr");
			for (const child of Array.from(element.childNodes)) appendConverted(child, document.documentElement, partName, depth + 1);
			zip.file(`word/${partName}`, serialize(document));
			overrides.push([`/word/${partName}`, `application/vnd.openxmlformats-officedocument.wordprocessingml.${header ? "header" : "footer"}+xml`]);
			const reference = output.createElementNS(WORD, `w:${header ? "header" : "footer"}Reference`);
			const type = element.getAttributeNS(WORDML, "type");
			reference.setAttributeNS(WORD, "w:type", type === "first" || type === "even" ? type : "default");
			reference.setAttributeNS(REL, "r:id", relate(part, header ? "header" : "footer", partName));
			parent.appendChild(reference);
			return;
		}
		const namespace = isWord ? WORD : element.namespaceURI;
		const localName = isWord ? aliases[element.localName] || element.localName : element.localName;
		const name = isWord ? `w:${localName}` : element.nodeName;
		const converted = output.createElementNS(namespace, name);
		for (const attribute of Array.from(element.attributes)) {
			if (attribute.namespaceURI === XMLNS) continue;
			if (namespace === VML && (localName === "imagedata" || localName === "fill") && (attribute.localName === "src" || attribute.localName === "href")) continue;
			const wordAttribute = attribute.namespaceURI === WORDML;
			const key = wordAttribute ? aliases[attribute.localName] || attribute.localName : attribute.localName;
			let value = attribute.value;
			if (wordAttribute && key === "hint" && value === "fareast") value = "eastAsia";
			if (isWord && localName === "fldChar" && wordAttribute && key === "fldCharType" && value === "start") value = "begin";
			converted.setAttributeNS(wordAttribute ? WORD : attribute.namespaceURI, wordAttribute ? `w:${key}` : attribute.name, value);
		}
		if (namespace === VML && (localName === "imagedata" || localName === "fill")) {
			const image = images.get(element.getAttribute("src") || "");
			if (image) converted.setAttributeNS(REL, "r:id", relate(part, "image", image.path));
		}
		parent.appendChild(converted);
		for (const child of Array.from(element.childNodes)) appendConverted(child, converted, part, depth + 1);
	}
	const document = createDocument("document");
	const outputBody = document.createElementNS(WORD, "w:body");
	document.documentElement.appendChild(outputBody);
	for (const child of Array.from(body.childNodes)) appendConverted(child, outputBody, "document.xml");
	for (const section of Array.from(outputBody.children)) {
		if (section.localName !== "sectPr" || section === outputBody.lastElementChild) continue;
		let paragraph = section.previousElementSibling;
		if (!paragraph || paragraph.localName !== "p") {
			paragraph = document.createElementNS(WORD, "w:p");
			outputBody.insertBefore(paragraph, section);
		}
		let properties = Array.from(paragraph.children).find((child) => child.localName === "pPr");
		if (!properties) {
			properties = document.createElementNS(WORD, "w:pPr");
			paragraph.insertBefore(properties, paragraph.firstChild);
		}
		properties.appendChild(section);
	}
	zip.file("word/document.xml", serialize(document));
	overrides.push(["/word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"]);
	for (const [sourceName, rootName, path, type] of [
		[
			"styles",
			"styles",
			"styles.xml",
			"styles"
		],
		[
			"fonts",
			"fonts",
			"fontTable.xml",
			"fontTable"
		],
		[
			"docPr",
			"settings",
			"settings.xml",
			"settings"
		]
	]) {
		const element = Array.from(input.documentElement.children).find((child) => child.namespaceURI === WORDML && child.localName === sourceName);
		if (!element) continue;
		const part = createDocument(rootName);
		for (const child of Array.from(element.childNodes)) appendConverted(child, part.documentElement, path);
		zip.file(`word/${path}`, serialize(part));
		relate("document.xml", type, path);
		overrides.push([`/word/${path}`, `application/vnd.openxmlformats-officedocument.wordprocessingml.${type}+xml`]);
	}
	for (const [part, relations] of relationships) zip.file(`word/_rels/${part}.rels`, serialize(relations));
	const rootRelations = input.implementation.createDocument(PACKAGE_REL, "Relationships", null);
	const office = rootRelations.createElementNS(PACKAGE_REL, "Relationship");
	for (const [name, value] of [
		["Id", "rId1"],
		["Type", `${REL}/officeDocument`],
		["Target", "word/document.xml"]
	]) office.setAttribute(name, value);
	rootRelations.documentElement.appendChild(office);
	zip.file("_rels/.rels", serialize(rootRelations));
	const types = input.implementation.createDocument(CONTENT_TYPES, "Types", null);
	for (const [extension, mime] of [
		["rels", "application/vnd.openxmlformats-package.relationships+xml"],
		["xml", "application/xml"],
		...Object.entries({
			png: "image/png",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			gif: "image/gif",
			bmp: "image/bmp",
			tif: "image/tiff",
			tiff: "image/tiff",
			emf: "image/x-emf",
			wmf: "image/x-wmf"
		})
	]) {
		const entry = types.createElementNS(CONTENT_TYPES, "Default");
		entry.setAttribute("Extension", extension);
		entry.setAttribute("ContentType", mime);
		types.documentElement.appendChild(entry);
	}
	for (const [path, mime] of overrides) {
		const entry = types.createElementNS(CONTENT_TYPES, "Override");
		entry.setAttribute("PartName", path);
		entry.setAttribute("ContentType", mime);
		types.documentElement.appendChild(entry);
	}
	zip.file("[Content_Types].xml", serialize(types));
	return zip.generateAsync({ type: "arraybuffer" });
}
//#endregion
export { createDocxOptions as a, resolveDocxPageBackgroundImage as c, renderOpenDocument as d, applyDocxPageBackgroundImage as i, wordDocx_default as l, decodeWordMlBytes as n, isMissingDocxHeaderFooterRootError as o, applyDocxExternalLinkPolicy as r, renderDocxWithHeaderFooterFallback as s, convertWordMlToDocx as t, render as u };
