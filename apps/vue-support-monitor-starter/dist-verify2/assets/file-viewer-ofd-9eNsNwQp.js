import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { Hs as unregisterFileViewerZoomProvider, Ni as normalizeFileViewerErrorMessage, ho as createFileViewerTranslator, ts as createFileViewerZoomChangeEmitter, ud as __vitePreload, wc as DEFAULT_RENDERER_DEFINITIONS, zs as registerFileViewerZoomProvider } from "./file-viewer-3d-ijA7B-Qe.js";
import { a as require_lib } from "./file-viewer-mindmap-DFVq45rQ.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/dist/index.js
var ofdDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "ofd");
if (!ofdDefinition) throw new Error("@file-viewer/renderer-ofd could not locate the core OFD renderer definition.");
var ofdRendererDefinition = ofdDefinition;
var renderFileViewerOfd = (buffer, target, _type, context) => __vitePreload(async () => {
	const { default: renderOfd } = await import("./ofd-CNuQrsf4.js");
	return { default: renderOfd };
}, []).then(({ default: renderOfd }) => renderOfd(buffer, target, context));
var ofdRenderer = {
	id: "file-viewer-renderer-ofd",
	label: "Flyfish File Viewer OFD renderer",
	definitions: [ofdRendererDefinition],
	handlers: [{
		rendererId: ofdRendererDefinition.id,
		handler: renderFileViewerOfd
	}]
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/dist/ofd.js
var OFD_MIN_SCALE = .35;
var OFD_MAX_SCALE = 3;
var OFD_ZOOM_STEP = .1;
var ofdStyle = `
.ofd-viewer{position:relative;display:flex;box-sizing:border-box;min-height:100%;min-width:0;flex-direction:column;background:var(--file-viewer-render-surface-background,#e9edf2);color:#172033;font-family:Aptos,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif}
.ofd-viewer *{box-sizing:border-box}
.ofd-toolbar{position:sticky;top:0;z-index:4;display:flex;min-height:44px;align-items:center;justify-content:center;border-bottom:1px solid rgba(148,163,184,.32);background:rgba(255,255,255,.92);box-shadow:0 4px 14px rgba(15,23,42,.06);backdrop-filter:blur(10px)}
.ofd-toolbar-group{display:inline-flex;align-items:center;gap:8px;padding:5px 8px;border:1px solid #d7dee8;border-radius:9px;background:#fff;box-shadow:0 2px 8px rgba(15,23,42,.06)}
.ofd-page-button{display:inline-flex;width:30px;height:30px;align-items:center;justify-content:center;border:1px solid transparent;border-radius:7px;color:#334155;background:transparent;font:700 22px/1 Aptos,'Segoe UI',sans-serif;cursor:pointer}
.ofd-page-button:hover:not(:disabled){border-color:#b9d4f6;color:#1769d8;background:#edf5ff}
.ofd-page-button:focus-visible{outline:2px solid #408fff;outline-offset:1px}
.ofd-page-button:disabled{color:#a7b0bd;cursor:not-allowed}
.ofd-page-meter{display:inline-flex;min-width:92px;align-items:baseline;justify-content:center;gap:5px;color:#64748b;font-size:12px;white-space:nowrap}
.ofd-page-meter strong{color:#172033;font-size:13px}
.ofd-stage{position:relative;flex:1;min-width:0;min-height:0;padding:18px 0 28px;overflow:auto;scrollbar-gutter:stable}
.ofd-state{position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;background:rgba(246,248,250,.92);color:#64748b;font-size:14px}
.ofd-state[hidden]{display:none!important}
.ofd-state.error{color:#b42318}
.ofd-page-frame{position:relative;display:block;margin:0 auto 20px;overflow:visible}
.ofd-page{display:block;margin-left:auto!important;margin-right:auto!important;background:#fff!important;color:#111827!important;color-scheme:only light;forced-color-adjust:none;isolation:isolate;box-shadow:0 10px 26px rgba(15,23,42,.12);transition:none}
.ofd-page.ofd-page--zoom-ready{transition:transform .16s ease}
.ofd-page,.ofd-page *{color-scheme:only light;forced-color-adjust:none}
.ofd-page svg,.ofd-page canvas,.ofd-page img{filter:none!important;mix-blend-mode:normal!important}
[data-viewer-theme='dark'] .ofd-viewer{background:var(--file-viewer-render-surface-background,#172033);color:#e5eef8}
[data-viewer-theme='dark'] .ofd-state{background:rgba(15,23,42,.9);color:#cbd5e1}
[data-viewer-theme='dark'] .ofd-toolbar{border-color:rgba(100,116,139,.5);background:rgba(15,23,42,.9)}
[data-viewer-theme='dark'] .ofd-toolbar-group{border-color:#475569;background:#1e293b}
[data-viewer-theme='dark'] .ofd-page-button{color:#e2e8f0}
[data-viewer-theme='dark'] .ofd-page-button:hover:not(:disabled){border-color:#4d79ad;color:#93c5fd;background:#263b55}
[data-viewer-theme='dark'] .ofd-page-button:disabled{color:#64748b}
[data-viewer-theme='dark'] .ofd-page-meter{color:#94a3b8}
[data-viewer-theme='dark'] .ofd-page-meter strong{color:#f1f5f9}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .ofd-viewer{background:var(--file-viewer-render-surface-background,#172033);color:#e5eef8}[data-viewer-theme='system'] .ofd-state{background:rgba(15,23,42,.9);color:#cbd5e1}[data-viewer-theme='system'] .ofd-toolbar{border-color:rgba(100,116,139,.5);background:rgba(15,23,42,.9)}[data-viewer-theme='system'] .ofd-toolbar-group{border-color:#475569;background:#1e293b}[data-viewer-theme='system'] .ofd-page-button{color:#e2e8f0}[data-viewer-theme='system'] .ofd-page-button:hover:not(:disabled){border-color:#4d79ad;color:#93c5fd;background:#263b55}[data-viewer-theme='system'] .ofd-page-button:disabled{color:#64748b}[data-viewer-theme='system'] .ofd-page-meter{color:#94a3b8}[data-viewer-theme='system'] .ofd-page-meter strong{color:#f1f5f9}}
@media (prefers-reduced-motion:reduce){.ofd-page.ofd-page--zoom-ready{transition:none}}
@media print{.ofd-viewer{display:block;background:#fff!important}.ofd-toolbar{display:none!important}.ofd-stage{padding:0!important;overflow:visible!important}.ofd-page-frame{break-after:page;page-break-after:always;margin:0 auto!important}.ofd-page-frame:last-child{break-after:auto;page-break-after:auto}.ofd-page{box-shadow:none!important;transition:none!important}}
`;
var loadOfdModule = (() => {
	let modulePromise = null;
	return () => {
		modulePromise || (modulePromise = __vitePreload(() => import("./ofd-BImB4mZF.js"), []));
		return modulePromise;
	};
})();
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = ofdStyle;
	return style;
};
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var normalizeError = (reason, fallback, context) => {
	if (reason instanceof Error || typeof reason === "string") return normalizeFileViewerErrorMessage(reason, context === null || context === void 0 ? void 0 : context.options);
	try {
		return JSON.stringify(reason);
	} catch {
		return String(reason || fallback);
	}
};
var clampZoom = (value) => Math.min(OFD_MAX_SCALE, Math.max(OFD_MIN_SCALE, Number(value.toFixed(2))));
var waitForPaint = (view) => new Promise((resolve) => {
	if (view === null || view === void 0 ? void 0 : view.requestAnimationFrame) {
		view.requestAnimationFrame(() => resolve());
		return;
	}
	globalThis.setTimeout(resolve, 0);
});
var parseWithOfdJs = (ofd, buffer) => {
	return new Promise((resolve, reject) => {
		ofd.parseOfdDocument({
			ofd: buffer,
			success: (documents) => resolve(documents),
			fail: (reason) => reject(reason)
		});
	});
};
var appendPages = (documentRef, target, pages) => {
	const fragment = documentRef.createDocumentFragment();
	pages.forEach((page) => {
		const frame = documentRef.createElement("div");
		frame.className = "ofd-page-frame";
		page.classList.add("ofd-page");
		page.dataset.viewerThemeBoundary = "light";
		page.style.backgroundColor = "#fff";
		page.style.color = "#111827";
		page.style.colorScheme = "only light";
		frame.appendChild(page);
		fragment.appendChild(frame);
	});
	target.appendChild(fragment);
};
var replacePages = (documentRef, target, pages) => {
	const existingFrames = Array.from(target.children).filter((element) => {
		var _a;
		return element instanceof (((_a = target.ownerDocument.defaultView) === null || _a === void 0 ? void 0 : _a.HTMLElement) || HTMLElement) && element.classList.contains("ofd-page-frame");
	});
	if (!existingFrames.some((frame) => frame.querySelector(".fv-print-mask-canvas"))) {
		target.replaceChildren();
		appendPages(documentRef, target, pages);
		return true;
	}
	if (existingFrames.length !== pages.length) return false;
	pages.forEach((page, index) => {
		const frame = existingFrames[index];
		const previousPage = Array.from(frame.children).find((child) => child.classList.contains("ofd-page"));
		if (!frame || !previousPage) return;
		page.classList.add("ofd-page");
		page.dataset.viewerThemeBoundary = "light";
		page.style.backgroundColor = "#fff";
		page.style.color = "#111827";
		page.style.colorScheme = "only light";
		previousPage.replaceWith(page);
	});
	return true;
};
async function renderOfd$1(buffer, target, context) {
	var _a, _b;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const documentRef = target.ownerDocument || document;
	const targetWindow = documentRef.defaultView || (typeof window !== "undefined" ? window : null);
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	let disposed = false;
	let renderVersion = 0;
	let resizeObserver = null;
	let resizeTimer = 0;
	let lastRenderedWidth = 0;
	let state = "loading";
	let errorMessage = "";
	let zoom = 1;
	let currentPage = 1;
	let pageCount = 0;
	let scrollFrame = 0;
	let ofdDocumentPromise = null;
	const style = createStyle(documentRef);
	const viewer = createElement(documentRef, "div", "ofd-viewer");
	viewer.dataset.viewerZoomProvider = "ofd";
	const stateNode = createElement(documentRef, "div", "ofd-state", t("ofd.state.loading"));
	stateNode.setAttribute("aria-live", "polite");
	const toolbar = createElement(documentRef, "div", "ofd-toolbar");
	toolbar.setAttribute("role", "toolbar");
	toolbar.setAttribute("aria-label", t("ofd.toolbar.pageNavigation"));
	const pageGroup = createElement(documentRef, "div", "ofd-toolbar-group");
	const previousPageButton = createElement(documentRef, "button", "ofd-page-button", "‹");
	previousPageButton.type = "button";
	previousPageButton.title = t("ofd.toolbar.previousPage");
	previousPageButton.setAttribute("aria-label", t("ofd.toolbar.previousPage"));
	const pageMeter = createElement(documentRef, "span", "ofd-page-meter");
	pageMeter.setAttribute("aria-live", "polite");
	const pageMeterCurrent = createElement(documentRef, "strong", void 0, "1");
	const pageMeterTotal = createElement(documentRef, "span", void 0, "/ -");
	pageMeter.append(pageMeterCurrent, pageMeterTotal);
	const nextPageButton = createElement(documentRef, "button", "ofd-page-button", "›");
	nextPageButton.type = "button";
	nextPageButton.title = t("ofd.toolbar.nextPage");
	nextPageButton.setAttribute("aria-label", t("ofd.toolbar.nextPage"));
	pageGroup.append(previousPageButton, pageMeter, nextPageButton);
	toolbar.append(pageGroup);
	const stage = createElement(documentRef, "div", "ofd-stage");
	stage.tabIndex = 0;
	stage.setAttribute("aria-label", t("ofd.toolbar.documentPages"));
	viewer.append(toolbar, stateNode, stage);
	target.replaceChildren(style, viewer);
	const clearStage = () => {
		stage.replaceChildren();
	};
	const syncState = () => {
		stateNode.hidden = state === "ready";
		stateNode.classList.toggle("error", state === "error");
		stateNode.textContent = state === "error" ? errorMessage : t("ofd.state.loading");
	};
	const getPageFrames = () => Array.from(stage.querySelectorAll(".ofd-page-frame"));
	const syncPageNavigation = () => {
		pageCount = getPageFrames().length;
		currentPage = pageCount ? Math.min(pageCount, Math.max(1, currentPage)) : 0;
		pageMeterCurrent.textContent = pageCount ? String(currentPage) : "-";
		pageMeterTotal.textContent = `/ ${pageCount || "-"}`;
		pageMeter.setAttribute("aria-label", pageCount ? t("ofd.toolbar.pageStatus", {
			current: currentPage,
			total: pageCount
		}) : t("ofd.toolbar.noPages"));
		previousPageButton.disabled = currentPage <= 1;
		nextPageButton.disabled = currentPage <= 0 || currentPage >= pageCount;
	};
	const scrollToPage = (requestedPage, behavior = "smooth") => {
		const frames = getPageFrames();
		if (!frames.length) {
			currentPage = 0;
			syncPageNavigation();
			return false;
		}
		const nextPage = Math.min(frames.length, Math.max(1, Math.round(requestedPage)));
		currentPage = nextPage;
		syncPageNavigation();
		const frame = frames[nextPage - 1];
		if (typeof (frame === null || frame === void 0 ? void 0 : frame.scrollIntoView) === "function") frame.scrollIntoView({
			block: "start",
			inline: "nearest",
			behavior
		});
		return true;
	};
	const detectCurrentPage = () => {
		const frames = getPageFrames();
		if (!frames.length) {
			currentPage = 0;
			syncPageNavigation();
			return;
		}
		const viewportCenter = stage.getBoundingClientRect().top + stage.clientHeight / 2;
		let closestIndex = 0;
		let closestDistance = Number.POSITIVE_INFINITY;
		frames.forEach((frame, index) => {
			const rect = frame.getBoundingClientRect();
			const center = rect.top + rect.height / 2;
			const distance = Math.abs(center - viewportCenter);
			if (distance < closestDistance) {
				closestDistance = distance;
				closestIndex = index;
			}
		});
		const detectedPage = closestIndex + 1;
		if (detectedPage !== currentPage) {
			currentPage = detectedPage;
			syncPageNavigation();
		}
	};
	const scheduleCurrentPageDetection = () => {
		var _a;
		if (scrollFrame) return;
		const requestFrame = (_a = targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.requestAnimationFrame) === null || _a === void 0 ? void 0 : _a.bind(targetWindow);
		if (requestFrame) {
			scrollFrame = requestFrame(() => {
				scrollFrame = 0;
				detectCurrentPage();
			});
			return;
		}
		scrollFrame = (targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.setTimeout(() => {
			scrollFrame = 0;
			detectCurrentPage();
		}, 0)) || 0;
	};
	const getOfdDocument = async (ofd) => {
		ofdDocumentPromise || (ofdDocumentPromise = parseWithOfdJs(ofd, buffer).then((documents) => {
			const ofdDocument = documents[0];
			if (!ofdDocument) throw new Error(t("ofd.error.empty"));
			return ofdDocument;
		}));
		return ofdDocumentPromise;
	};
	const getRenderWidth = () => {
		const baseWidth = viewer.getBoundingClientRect().width || stage.getBoundingClientRect().width || 0;
		return Math.max(Math.floor(baseWidth - 48), 240);
	};
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < OFD_MAX_SCALE,
		canZoomOut: zoom > OFD_MIN_SCALE,
		canReset: zoom !== 1,
		minScale: OFD_MIN_SCALE,
		maxScale: OFD_MAX_SCALE
	});
	const syncPageZoom = (animate = false) => {
		const HTMLElementCtor = (targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.HTMLElement) || globalThis.HTMLElement;
		stage.querySelectorAll(".ofd-page-frame").forEach((frame) => {
			const page = frame.firstElementChild;
			if (!HTMLElementCtor || !(page instanceof HTMLElementCtor)) return;
			page.classList.toggle("ofd-page--zoom-ready", animate);
			page.style.position = "absolute";
			page.style.top = "0";
			page.style.left = "50%";
			page.style.transform = `translateX(-50%) scale(${zoom})`;
			page.style.transformOrigin = "top center";
			page.style.marginLeft = "0";
			page.style.marginRight = "0";
			const pageWidth = page.offsetWidth;
			const pageHeight = page.offsetHeight;
			if (!pageWidth || !pageHeight) return;
			frame.style.width = `${Math.ceil(pageWidth * zoom)}px`;
			frame.style.height = `${Math.ceil(pageHeight * zoom)}px`;
		});
	};
	const enablePageZoomTransitions = () => {
		stage.querySelectorAll(".ofd-page").forEach((page) => {
			page.getBoundingClientRect();
			page.classList.add("ofd-page--zoom-ready");
		});
	};
	const setZoom = (nextZoom) => {
		zoom = clampZoom(nextZoom);
		syncPageZoom(true);
		zoomEmitter.emit();
		return getZoomState();
	};
	registerFileViewerZoomProvider(viewer, {
		zoomIn: () => setZoom(zoom + OFD_ZOOM_STEP),
		zoomOut: () => setZoom(zoom - OFD_ZOOM_STEP),
		resetZoom: () => setZoom(1),
		setZoom,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	const renderWithOfdJs = async (width) => {
		const ofd = await loadOfdModule();
		const ofdDocument = await getOfdDocument(ofd);
		if (disposed) return [];
		return Promise.resolve(ofd.renderOfd(width, ofdDocument));
	};
	const render = async (options = {}) => {
		var _a, _b, _c;
		if (disposed) return;
		if ((_a = context === null || context === void 0 ? void 0 : context.signal) === null || _a === void 0 ? void 0 : _a.aborted) throw context.signal.reason || new DOMException("OFD rendering aborted.", "AbortError");
		const width = getRenderWidth();
		if (!options.force && state === "ready" && Math.abs(width - lastRenderedWidth) < 8) return;
		const version = ++renderVersion;
		if (options.showLoading || state !== "ready") {
			state = "loading";
			clearStage();
			syncState();
		}
		errorMessage = "";
		try {
			await waitForPaint(targetWindow);
			const pages = await renderWithOfdJs(width);
			if (disposed || version !== renderVersion) return;
			if ((_b = context === null || context === void 0 ? void 0 : context.signal) === null || _b === void 0 ? void 0 : _b.aborted) throw context.signal.reason || new DOMException("OFD rendering aborted.", "AbortError");
			if (!replacePages(documentRef, stage, pages)) return;
			lastRenderedWidth = width;
			await waitForPaint(targetWindow);
			syncPageZoom();
			enablePageZoomTransitions();
			syncPageNavigation();
			if (currentPage > 1) scrollToPage(currentPage, "auto");
			state = "ready";
			syncState();
			zoomEmitter.emit();
			(_c = context === null || context === void 0 ? void 0 : context.onProgressiveRender) === null || _c === void 0 || _c.call(context);
		} catch (reason) {
			if (disposed || version !== renderVersion) return;
			console.error(reason);
			state = "error";
			errorMessage = normalizeError(reason, t("ofd.error.parseFailed"), context) || t("ofd.error.parseFailed");
			syncState();
			if (options.rejectOnError) throw reason;
		}
	};
	const startResizeObserver = () => {
		if (!(targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.ResizeObserver) || resizeObserver) return;
		resizeObserver = new targetWindow.ResizeObserver(() => {
			targetWindow.clearTimeout(resizeTimer);
			resizeTimer = targetWindow.setTimeout(() => {
				render({ showLoading: false });
			}, 180);
		});
		resizeObserver.observe(viewer);
	};
	previousPageButton.addEventListener("click", () => {
		scrollToPage(currentPage - 1);
	});
	nextPageButton.addEventListener("click", () => {
		scrollToPage(currentPage + 1);
	});
	stage.addEventListener("scroll", scheduleCurrentPageDetection, { passive: true });
	stage.addEventListener("keydown", (event) => {
		if (event.key === "PageUp") {
			event.preventDefault();
			scrollToPage(currentPage - 1);
		} else if (event.key === "PageDown") {
			event.preventDefault();
			scrollToPage(currentPage + 1);
		} else if (event.key === "Home" && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			scrollToPage(1);
		} else if (event.key === "End" && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			scrollToPage(pageCount);
		}
	});
	try {
		await render({
			force: true,
			showLoading: true,
			rejectOnError: true
		});
		if (!disposed) startResizeObserver();
	} catch (error) {
		unregisterFileViewerZoomProvider(viewer);
		throw error;
	}
	(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, {
		beforeCapture: async ({ signal }) => {
			while (state === "loading" && !disposed) {
				if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw signal.reason;
				await new Promise((resolve) => {
					if (targetWindow) targetWindow.setTimeout(resolve, 16);
					else setTimeout(resolve, 16);
				});
			}
			if (state === "error") throw new Error(errorMessage || t("ofd.error.parseFailed"));
		},
		getTarget: () => stage.querySelector(".ofd-page-frame, .ofd-page") || stage
	});
	(_b = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _b === void 0 || _b.call(context, {
		print: true,
		exportHtml: true,
		includeDocumentStyles: true,
		getPrintMaskPages: () => Array.from(stage.querySelectorAll(".ofd-page-frame")),
		toHtml: () => {
			const clone = stage.cloneNode(true);
			clone.querySelectorAll(".ofd-page-frame").forEach((page, index) => {
				page.dataset.viewerPrintPageIndex = String(index);
			});
			return clone.outerHTML;
		}
	});
	return {
		$el: viewer,
		unmount() {
			var _a, _b;
			disposed = true;
			renderVersion += 1;
			targetWindow === null || targetWindow === void 0 || targetWindow.clearTimeout(resizeTimer);
			if (scrollFrame) if (targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.cancelAnimationFrame) targetWindow.cancelAnimationFrame(scrollFrame);
			else targetWindow === null || targetWindow === void 0 || targetWindow.clearTimeout(scrollFrame);
			scrollFrame = 0;
			resizeObserver === null || resizeObserver === void 0 || resizeObserver.disconnect();
			resizeObserver = null;
			unregisterFileViewerZoomProvider(viewer);
			clearStage();
			(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
			(_b = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _b === void 0 || _b.call(context, null);
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/ofd/ofd_util.js
var convertPathAbbreviatedDatatoPoint = (abbreviatedData) => {
	let array = abbreviatedData.split(" ");
	let pointList = [];
	let i = 0;
	while (i < array.length) {
		if (array[i] === "M" || array[i] === "S") {
			let point = {
				"type": "M",
				"x": parseFloat(array[i + 1]),
				"y": parseFloat(array[i + 2])
			};
			i = i + 3;
			pointList.push(point);
		}
		if (array[i] === "L") {
			let point = {
				"type": "L",
				"x": parseFloat(array[i + 1]),
				"y": parseFloat(array[i + 2])
			};
			i = i + 3;
			pointList.push(point);
		} else if (array[i] === "C") {
			pointList.push({
				"type": "C",
				"x": 0,
				"y": 0
			});
			i++;
		} else if (array[i] === "B") {
			let point = {
				"type": "B",
				"x1": parseFloat(array[i + 1]),
				"y1": parseFloat(array[i + 2]),
				"x2": parseFloat(array[i + 3]),
				"y2": parseFloat(array[i + 4]),
				"x3": parseFloat(array[i + 5]),
				"y3": parseFloat(array[i + 6])
			};
			i = i + 7;
			pointList.push(point);
		} else if (array[i] === "Q") {
			let point = {
				"type": "Q",
				"x1": parseFloat(array[i + 1]),
				"y1": parseFloat(array[i + 2]),
				"x2": parseFloat(array[i + 3]),
				"y2": parseFloat(array[i + 4])
			};
			i = i + 5;
			pointList.push(point);
		} else i++;
	}
	return pointList;
};
var calPathPoint = function(abbreviatedPoint) {
	let pointList = [];
	for (let i = 0; i < abbreviatedPoint.length; i++) {
		let point = abbreviatedPoint[i];
		if (point.type === "M" || point.type === "L" || point.type === "C") {
			let x = 0, y = 0;
			x = point.x;
			y = point.y;
			point.x = converterDpi(x);
			point.y = converterDpi(y);
			pointList.push(point);
		} else if (point.type === "B") {
			let x1 = point.x1, y1 = point.y1;
			let x2 = point.x2, y2 = point.y2;
			let x3 = point.x3, y3 = point.y3;
			let realPoint = {
				"type": "B",
				"x1": converterDpi(x1),
				"y1": converterDpi(y1),
				"x2": converterDpi(x2),
				"y2": converterDpi(y2),
				"x3": converterDpi(x3),
				"y3": converterDpi(y3)
			};
			pointList.push(realPoint);
		} else if (point.type === "Q") {
			let realPoint = {
				"type": "Q",
				"x1": converterDpi(point.x1),
				"y1": converterDpi(point.y1),
				"x2": converterDpi(point.x2),
				"y2": converterDpi(point.y2)
			};
			pointList.push(realPoint);
		}
	}
	return pointList;
};
var millimetersToPixel = function(mm, dpi) {
	return mm * dpi / 25.4;
};
var MaxScale = 10;
var Scale = MaxScale;
var setMaxPageScal = function(scale) {
	MaxScale = scale > 5 ? 5 : scale;
};
var setPageScal = function(scale) {
	Scale = scale > 1 ? scale : 1;
	Scale = Scale > MaxScale ? MaxScale : Scale;
};
var getPageScal = function() {
	return Scale;
};
var converterDpi = function(width) {
	return millimetersToPixel(width, Scale * 25.4);
};
var deltaFormatter = function(delta, maxValues = 1e5) {
	const tokens = String(delta ?? "").trim().split(/\s+/);
	const values = [];
	const limit = Math.max(0, Math.min(1e5, maxValues));
	for (let i = 0; i < tokens.length && values.length < limit; i++) {
		let count = 1;
		if (tokens[i] === "g") {
			count = Number(tokens[++i]);
			i++;
			if (!Number.isSafeInteger(count) || count < 0) break;
		}
		const value = Number(tokens[i]);
		if (!tokens[i] || !Number.isFinite(value)) break;
		count = Math.min(count, limit - values.length);
		for (let j = 0; j < count; j++) values.push(value);
	}
	return values;
};
var calTextPoint = function(textCodes) {
	const runs = [];
	for (const code of textCodes || []) {
		if (code == null) continue;
		const value = typeof code === "string" ? code : code["#text"];
		if (value == null || value === "") continue;
		const text = decodeOfdText(String(value));
		const count = Array.from(text).length;
		const finite = (value) => Number.isFinite(Number.parseFloat(value)) ? Number.parseFloat(value) : 0;
		const x = finite(code["@_X"]);
		const y = finite(code["@_Y"]);
		const positions = (start, delta) => {
			const list = [converterDpi(start)];
			for (const offset of deltaFormatter(delta, count - 1)) {
				start += offset;
				list.push(converterDpi(start));
			}
			return list;
		};
		runs.push({
			x: converterDpi(x),
			y: converterDpi(y),
			text,
			xPositions: positions(x, code["@_DeltaX"]),
			yPositions: positions(y, code["@_DeltaY"])
		});
	}
	return runs;
};
var replaceFirstSlash = function(str) {
	if (str) {
		if (str.indexOf("/") === 0) str = str.replace("/", "");
	}
	return str;
};
var getExtensionByPath = function(path) {
	if (!path && typeof path !== "string") return "";
	return path.substring(path.lastIndexOf(".") + 1);
};
var REGX_HTML_DECODE = /&\w+;|&#(x?[0-9a-fA-F]+);/g;
var HTML_DECODE = {
	"&lt;": "<",
	"&gt;": ">",
	"&amp;": "&",
	"&nbsp;": " ",
	"&quot;": "\"",
	"&copy;": "",
	"&apos;": "'"
};
var decodeHtml = function(s) {
	s = s != void 0 ? s : this.toString();
	return typeof s != "string" ? s : s.replace(REGX_HTML_DECODE, function($0, $1) {
		var c = HTML_DECODE[$0];
		if (c == void 0) if ($1) {
			const codePoint = /^x/i.test($1) ? parseInt($1.slice(1), 16) : parseInt($1, 10);
			c = Number.isFinite(codePoint) ? String.fromCodePoint(codePoint == 160 ? 32 : codePoint) : $0;
		} else c = $0;
		return c;
	});
};
var decodeOfdText = function(s) {
	s = decodeHtml(s);
	if (typeof s != "string") return s;
	return s.replace(/\\0x([0-9a-fA-F]{4,6})/g, function(_, hex) {
		const codePoint = parseInt(hex, 16);
		return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint == 160 ? 32 : codePoint) : _;
	});
};
var FONT_FAMILY = {
	"楷体": "楷体, KaiTi, Kai, simkai",
	"kaiti": "楷体, KaiTi, Kai, simkai",
	"Kai": "楷体, KaiTi, Kai",
	"simsun": "SimSun, simsun, Songti SC",
	"宋体": "SimSun, simsun, Songti SC",
	"黑体": "SimHei, STHeiti, simhei",
	"仿宋": "FangSong, STFangsong, simfang",
	"小标宋体": "sSun",
	"方正小标宋_gbk": "sSun",
	"仿宋_gb2312": "FangSong, STFangsong, simfang",
	"楷体_gb2312": "楷体, KaiTi, Kai, simkai",
	"couriernew": "Courier New",
	"courier new": "Courier New"
};
var getFontFamily = function(font) {
	if (typeof font !== "string" || !font.trim()) return "sans-serif";
	if (FONT_FAMILY[font.toLowerCase()]) font = FONT_FAMILY[font.toLowerCase()];
	for (let key of Object.keys(FONT_FAMILY)) if (font.toLowerCase().indexOf(key.toLowerCase()) != -1) return FONT_FAMILY[key];
	return font;
};
var parseStBox = function(obj) {
	if (obj) {
		let array = obj.split(" ");
		return {
			x: parseFloat(array[0]),
			y: parseFloat(array[1]),
			w: parseFloat(array[2]),
			h: parseFloat(array[3])
		};
	} else return null;
};
var parseCtm = function(ctm) {
	return ctm.split(" ");
};
var parseColor = function(color) {
	if (color) {
		if (color.indexOf("#") !== -1) {
			color = color.replace(/#/g, "");
			color = color.replace(/ /g, "");
			color = "#" + color.toString();
			return color;
		}
		let array = color.split(" ");
		return `rgb(${array[0]}, ${array[1]}, ${array[2]})`;
	} else return `rgb(0, 0, 0)`;
};
var converterBox = function(box) {
	return {
		x: converterDpi(box.x),
		y: converterDpi(box.y),
		w: converterDpi(box.w),
		h: converterDpi(box.h)
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/ofd/ofd_render.js
var calPageBox = function(screenWidth, document, page) {
	const area = page[Object.keys(page)[0]]["json"]["ofd:Area"];
	let box;
	if (area) {
		const physicalBox = area["ofd:PhysicalBox"];
		if (physicalBox) box = physicalBox;
		else {
			const applicationBox = area["ofd:ApplicationBox"];
			if (applicationBox) box = applicationBox;
			else {
				const contentBox = area["ofd:ContentBox"];
				if (contentBox) box = contentBox;
			}
		}
	} else {
		let documentArea = document["ofd:CommonData"]["ofd:PageArea"];
		const physicalBox = documentArea["ofd:PhysicalBox"];
		if (physicalBox) box = physicalBox;
		else {
			const applicationBox = documentArea["ofd:ApplicationBox"];
			if (applicationBox) box = applicationBox;
			else {
				const contentBox = documentArea["ofd:ContentBox"];
				if (contentBox) box = contentBox;
			}
		}
	}
	let array = box.split(" ");
	const scale = ((screenWidth - 10) / parseFloat(array[2])).toFixed(1);
	setMaxPageScal(scale);
	setPageScal(scale);
	box = parseStBox(box);
	box = converterBox(box);
	return box;
};
var calPageBoxScale = function(document, page) {
	const area = page[Object.keys(page)[0]]["json"]["ofd:Area"];
	let box;
	if (area) {
		const physicalBox = area["ofd:PhysicalBox"];
		if (physicalBox) box = physicalBox;
		else {
			const applicationBox = area["ofd:ApplicationBox"];
			if (applicationBox) box = applicationBox;
			else {
				const contentBox = area["ofd:ContentBox"];
				if (contentBox) box = contentBox;
			}
		}
	} else {
		let documentArea = document["ofd:CommonData"]["ofd:PageArea"];
		const physicalBox = documentArea["ofd:PhysicalBox"];
		if (physicalBox) box = physicalBox;
		else {
			const applicationBox = documentArea["ofd:ApplicationBox"];
			if (applicationBox) box = applicationBox;
			else {
				const contentBox = documentArea["ofd:ContentBox"];
				if (contentBox) box = contentBox;
			}
		}
	}
	box = parseStBox(box);
	box = converterBox(box);
	return box;
};
var resolveDrawParamStyle = function(drawParamResObj, drawParamId, base) {
	let fillColor = base?.fillColor ?? null;
	let strokeColor = base?.strokeColor ?? null;
	let lineWith = base?.lineWith;
	if (!drawParamId || !drawParamResObj || !drawParamResObj[drawParamId]) return {
		fillColor,
		strokeColor,
		lineWith
	};
	let drawParam = drawParamId;
	if (drawParamResObj[drawParam]["relative"]) {
		drawParam = drawParamResObj[drawParam]["relative"];
		if (drawParamResObj[drawParam] && drawParamResObj[drawParam]["FillColor"]) fillColor = parseColor(drawParamResObj[drawParam]["FillColor"]);
		if (drawParamResObj[drawParam] && drawParamResObj[drawParam]["StrokeColor"]) strokeColor = parseColor(drawParamResObj[drawParam]["StrokeColor"]);
		if (drawParamResObj[drawParam] && drawParamResObj[drawParam]["LineWidth"]) lineWith = converterDpi(drawParamResObj[drawParam]["LineWidth"]);
		drawParam = drawParamId;
	}
	if (drawParamResObj[drawParam]["FillColor"]) fillColor = parseColor(drawParamResObj[drawParam]["FillColor"]);
	if (drawParamResObj[drawParam]["StrokeColor"]) strokeColor = parseColor(drawParamResObj[drawParam]["StrokeColor"]);
	if (drawParamResObj[drawParam]["LineWidth"]) lineWith = converterDpi(drawParamResObj[drawParam]["LineWidth"]);
	return {
		fillColor,
		strokeColor,
		lineWith
	};
};
var renderLayerFromTemplate = function(tpls, template, pageDiv, fontResObj, drawParamResObj, multiMediaResObj) {
	let array = [];
	const layers = tpls[template["@_TemplateID"]]["json"]["ofd:Content"]["ofd:Layer"];
	array = array.concat(layers);
	for (let layer of array) if (layer) renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, layer, false);
};
var renderPage = function(pageDiv, page, tpls, fontResObj, drawParamResObj, multiMediaResObj) {
	const pageId = Object.keys(page)[0];
	const template = page[pageId]["json"]["ofd:Template"];
	if (Array.isArray(template)) template.forEach((item) => {
		/**
		* 此处只满足 ZOrder 相同的情况
		* 若 ZOrder 不同，可能需要根据 ZOrder 排序来渲染
		* 参考 http://www.dajs.gov.cn/attach/0/88a7620d9d3f4e13b2baa52ab3487854.pdf 第 18 页 ZOrder 的属性说明
		*/
		if (item) renderLayerFromTemplate(tpls, item, pageDiv, fontResObj, drawParamResObj, multiMediaResObj);
	});
	else if (template) renderLayerFromTemplate(tpls, template, pageDiv, fontResObj, drawParamResObj, multiMediaResObj);
	const contentLayers = page[pageId]?.json?.["ofd:Content"]?.["ofd:Layer"];
	let array = [];
	array = array.concat(contentLayers);
	for (let contentLayer of array) if (contentLayer) renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, contentLayer, false);
	if (page[pageId].stamp) {
		for (const stamp of page[pageId].stamp) if (stamp.type === "ofd") renderSealPage(pageDiv, stamp.obj.pages, stamp.obj.tpls, true, stamp.stamp.stampAnnot, stamp.obj.fontResObj, stamp.obj.drawParamResObj, stamp.obj.multiMediaResObj, stamp.stamp.sealObj.SES_Signature, stamp.stamp.signedInfo);
		else if (stamp.type === "png") {
			let sealBoundary = converterBox(stamp.obj.boundary);
			const oid = Array.isArray(stamp.stamp.stampAnnot) ? stamp.stamp.stampAnnot[0]["pfIndex"] : stamp.stamp.stampAnnot["pfIndex"];
			let element = renderImageOnDiv(pageDiv.style.width, pageDiv.style.height, stamp.obj.img, sealBoundary, stamp.obj.clip, true, stamp.stamp.sealObj.SES_Signature, stamp.stamp.signedInfo, oid);
			pageDiv.appendChild(element);
		}
	}
	if (page[pageId].annotation) for (const annotation of page[pageId].annotation) renderAnnotation(pageDiv, annotation, fontResObj, drawParamResObj, multiMediaResObj);
};
var renderAnnotation = function(pageDiv, annotation, fontResObj, drawParamResObj, multiMediaResObj) {
	let div = document.createElement("div");
	div.setAttribute("style", `overflow: hidden;z-index:${annotation["pfIndex"]};position:relative;`);
	let boundary = annotation["appearance"]?.["@_Boundary"];
	if (boundary) {
		let divBoundary = converterBox(parseStBox(boundary));
		div.setAttribute("style", `overflow: hidden;z-index:${annotation["pfIndex"]};position:absolute; left: ${divBoundary.x}px; top: ${divBoundary.y}px; width: ${divBoundary.w}px; height: ${divBoundary.h}px`);
	}
	const contentLayer = annotation["appearance"];
	renderLayer(div, fontResObj, drawParamResObj, multiMediaResObj, contentLayer, false);
	pageDiv.appendChild(div);
};
var renderSealPage = function(pageDiv, pages, tpls, isStampAnnot, stampAnnot, fontResObj, drawParamResObj, multiMediaResObj, SES_Signature, signedInfo) {
	for (const page of pages) {
		const pageId = Object.keys(page)[0];
		let stampAnnotBoundary = {
			x: 0,
			y: 0,
			w: 0,
			h: 0
		};
		if (isStampAnnot && stampAnnot) stampAnnotBoundary = stampAnnot.boundary;
		let divBoundary = converterBox(stampAnnotBoundary);
		let div = document.createElement("div");
		div.setAttribute("name", "seal_img_div");
		div.setAttribute("style", `cursor: pointer; overflow: hidden; position:absolute; left: ${divBoundary.x}px; top: ${divBoundary.y}px; width: ${divBoundary.w}px; height: ${divBoundary.h}px`);
		div.setAttribute("data-ses-signature", `${JSON.stringify(SES_Signature || {})}`);
		div.setAttribute("data-signed-info", `${JSON.stringify(signedInfo || {})}`);
		const template = page[pageId]["json"]["ofd:Template"];
		if (template) {
			const layers = tpls[template["@_TemplateID"]]["json"]["ofd:Content"]["ofd:Layer"];
			let array = [];
			array = array.concat(layers);
			for (let layer of array) if (layer) renderLayer(div, fontResObj, drawParamResObj, multiMediaResObj, layer, isStampAnnot);
		}
		const contentLayers = page[pageId]["json"]["ofd:Content"]["ofd:Layer"];
		let array = [];
		array = array.concat(contentLayers);
		for (let contentLayer of array) if (contentLayer) renderLayer(div, fontResObj, drawParamResObj, multiMediaResObj, contentLayer, isStampAnnot);
		pageDiv.appendChild(div);
	}
};
var renderLayer = function(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, layer, isStampAnnot) {
	const layerStyle = resolveDrawParamStyle(drawParamResObj, layer?.["@_DrawParam"], {
		fillColor: null,
		strokeColor: null,
		lineWith: converterDpi(.353)
	});
	let fillColor = layerStyle.fillColor;
	let strokeColor = layerStyle.strokeColor;
	let lineWith = layerStyle.lineWith;
	const imageObjects = layer?.["ofd:ImageObject"];
	let imageObjectArray = [];
	imageObjectArray = imageObjectArray.concat(imageObjects);
	for (const imageObject of imageObjectArray) if (imageObject) {
		let element = renderImageObject(pageDiv.style.width, pageDiv.style.height, multiMediaResObj, imageObject);
		pageDiv.appendChild(element);
	}
	const pathObjects = layer?.["ofd:PathObject"];
	let pathObjectArray = [];
	pathObjectArray = pathObjectArray.concat(pathObjects);
	for (const pathObject of pathObjectArray) if (pathObject) {
		let svg = renderPathObject(drawParamResObj, pathObject, fillColor, strokeColor, lineWith, isStampAnnot);
		pageDiv.appendChild(svg);
	}
	const textObjects = layer?.["ofd:TextObject"];
	let textObjectArray = [];
	textObjectArray = textObjectArray.concat(textObjects);
	for (const textObject of textObjectArray) if (textObject) {
		let svg = renderTextObject(drawParamResObj, fontResObj, textObject, fillColor, strokeColor);
		pageDiv.appendChild(svg);
	}
	const pageBlocks = layer?.["ofd:PageBlock"];
	let pageBlockArray = [];
	pageBlockArray = pageBlockArray.concat(pageBlocks);
	for (const pageBlock of pageBlockArray) if (pageBlock) renderLayer(pageDiv, fontResObj, drawParamResObj, multiMediaResObj, pageBlock, isStampAnnot);
};
var parseImageCtm = function(ctm) {
	if (!ctm) return null;
	const values = String(ctm).trim().split(/\s+/).map(Number);
	return values.length === 6 && values.every((value) => Number.isFinite(value)) ? values : null;
};
var resolveImageGeometry = function(imageObject) {
	const sourceBoundary = parseStBox(imageObject["@_Boundary"]);
	const boundary = converterBox(sourceBoundary);
	const ctmValues = parseImageCtm(imageObject["@_CTM"]);
	if (!ctmValues) return {
		boundary,
		matrix: null
	};
	const [a, b, c, d, e, f] = ctmValues;
	if (Math.abs(b) < 1e-6 && Math.abs(c) < 1e-6) return {
		boundary: converterBox({
			x: sourceBoundary.x + Math.min(e, e + a),
			y: sourceBoundary.y + Math.min(f, f + d),
			w: Math.abs(a),
			h: Math.abs(d)
		}),
		matrix: null
	};
	return {
		boundary,
		matrix: [
			a,
			b,
			c,
			d,
			sourceBoundary.x + e,
			sourceBoundary.y + f
		]
	};
};
var renderImageObject = function(pageWidth, pageHeight, multiMediaResObj, imageObject) {
	const { boundary, matrix } = resolveImageGeometry(imageObject);
	const resId = imageObject["@_ResourceID"];
	const imageResource = multiMediaResObj ? multiMediaResObj[resId] : null;
	if (!imageResource || typeof imageResource !== "object") return renderMissingImageObject(boundary, imageObject["pfIndex"]);
	if (imageResource.format === "gbig2") {
		const img = imageResource.img;
		const width = imageResource.width;
		const height = imageResource.height;
		return renderImageOnCanvas(img, width, height, boundary, imageObject["pfIndex"]);
	} else if (matrix) return renderImageWithMatrix(imageResource.img, matrix, imageObject["pfIndex"]);
	else return renderImageOnDiv(pageWidth, pageHeight, imageResource.img, boundary, false, false, null, null, imageObject["pfIndex"]);
};
var renderImageWithMatrix = function(imgSrc, ctmValues, oid) {
	const [a, b, c, d, e, f] = ctmValues;
	const unit = converterDpi(1);
	let img = document.createElement("img");
	img.src = imgSrc;
	img.setAttribute("width", `${unit}`);
	img.setAttribute("height", `${unit}`);
	img.setAttribute("style", `position:absolute;left:0;top:0;transform-origin:0 0;transform:matrix(${a}, ${b}, ${c}, ${d}, ${converterDpi(e)}, ${converterDpi(f)});z-index:${oid}`);
	return img;
};
var renderMissingImageObject = function(boundary, oid) {
	let div = document.createElement("div");
	div.setAttribute("style", `overflow: hidden; position: absolute; left: ${boundary.x}px; top: ${boundary.y}px; width: ${boundary.w}px; height: ${boundary.h}px;z-index: ${oid}`);
	return div;
};
var renderImageOnCanvas = function(img, imgWidth, imgHeight, boundary, oid) {
	const arr = new Uint8ClampedArray(4 * imgWidth * imgHeight);
	for (var i = 0; i < img.length; i++) {
		arr[4 * i] = img[i];
		arr[4 * i + 1] = img[i];
		arr[4 * i + 2] = img[i];
		arr[4 * i + 3] = 255;
	}
	let imageData = new ImageData(arr, imgWidth, imgHeight);
	let canvas = document.createElement("canvas");
	canvas.width = imgWidth;
	canvas.height = imgHeight;
	canvas.getContext("2d").putImageData(imageData, 0, 0);
	canvas.setAttribute("style", `left: ${boundary.x}px; top: ${boundary.y}px; width: ${boundary.w}px; height: ${boundary.h}px;z-index: ${oid}`);
	canvas.style.position = "absolute";
	return canvas;
};
var renderImageOnDiv = function(pageWidth, pageHeight, imgSrc, boundary, clip, isStampAnnot, SES_Signature, signedInfo, oid) {
	let div = document.createElement("div");
	if (isStampAnnot) {
		div.setAttribute("name", "seal_img_div");
		div.setAttribute("data-ses-signature", `${JSON.stringify(SES_Signature || {})}`);
		div.setAttribute("data-signed-info", `${JSON.stringify(signedInfo || {})}`);
	}
	let img = document.createElement("img");
	img.src = imgSrc;
	img.setAttribute("width", "100%");
	img.setAttribute("height", "100%");
	div.appendChild(img);
	let c = "";
	if (clip) {
		clip = converterBox(clip);
		c = `clip: rect(${clip.y}px, ${clip.w + clip.x}px, ${clip.h + clip.y}px, ${clip.x}px)`;
	}
	div.setAttribute("style", `cursor: pointer; overflow: hidden; position: absolute; left: ${boundary.x}px; top: ${boundary.y}px; width: ${boundary.w}px; height: ${boundary.h}px; ${c};z-index: ${oid}`);
	return div;
};
var renderTextObject = function(drawParamResObj, fontResObj, textObject, defaultFillColor, defaultStrokeColor) {
	let defaultFillOpacity = 1;
	let boundary = parseStBox(textObject["@_Boundary"]);
	boundary = converterBox(boundary);
	const ctm = textObject["@_CTM"];
	const hScale = textObject["@_HScale"];
	const font = textObject["@_Font"];
	const weight = textObject["@_Weight"];
	const size = converterDpi(parseFloat(textObject["@_Size"]));
	let array = [];
	array = array.concat(textObject["ofd:TextCode"]);
	const textCodePointList = calTextPoint(array);
	let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("version", "1.1");
	const objectStyle = resolveDrawParamStyle(drawParamResObj, textObject["@_DrawParam"], {
		fillColor: defaultFillColor,
		strokeColor: defaultStrokeColor
	});
	defaultFillColor = objectStyle.fillColor;
	defaultStrokeColor = objectStyle.strokeColor;
	const fillColor = textObject["ofd:FillColor"];
	if (fillColor) {
		defaultFillColor = parseColor(fillColor["@_Value"]);
		let alpha = fillColor["@_Alpha"];
		if (alpha) defaultFillOpacity = alpha > 1 ? alpha / 255 : alpha;
	}
	for (const textCodePoint of textCodePointList) if (textCodePoint && !isNaN(textCodePoint.x)) {
		let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
		text.setAttribute("x", textCodePoint.xPositions?.join(" ") || textCodePoint.x);
		text.setAttribute("y", textCodePoint.yPositions?.join(" ") || textCodePoint.y);
		text.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
		text.textContent = textCodePoint.text;
		if (ctm) {
			const ctms = parseCtm(ctm);
			text.setAttribute("transform", `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`);
		}
		if (hScale) text.setAttribute("transform", `matrix(${hScale}, 0, 0, 1, ${(1 - hScale) * textCodePoint.x}, 0)`);
		const textFillColor = defaultFillColor || defaultStrokeColor || "rgb(0, 0, 0)";
		text.setAttribute("fill", textFillColor);
		text.setAttribute("fill-opacity", defaultFillOpacity);
		text.setAttribute("style", `white-space:pre;font-weight: ${weight};font-size:${size}px;font-family: ${getFontFamily(fontResObj[font])};color:${textFillColor};`);
		svg.appendChild(text);
	}
	let width = boundary.w;
	let height = boundary.h;
	let left = boundary.x;
	let top = boundary.y;
	svg.setAttribute("style", `overflow:visible;position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px;z-index:${textObject["pfIndex"]}`);
	return svg;
};
var buildSvgPathData = function(points) {
	let d = "";
	for (const point of points) if (point.type === "M") d += `M${point.x} ${point.y} `;
	else if (point.type === "L") d += `L${point.x} ${point.y} `;
	else if (point.type === "Q") d += `Q${point.x1} ${point.y1} ${point.x2} ${point.y2} `;
	else if (point.type === "B") d += `C${point.x1} ${point.y1} ${point.x2} ${point.y2} ${point.x3} ${point.y3} `;
	else if (point.type === "C") d += `Z`;
	return d;
};
var appendClipAreaPath = function(clipPathEl, area) {
	const clipShape = area?.["ofd:Path"];
	const abbreviatedData = clipShape?.["ofd:AbbreviatedData"];
	if (!clipShape || !abbreviatedData) return;
	const clipPoints = calPathPoint(convertPathAbbreviatedDatatoPoint(abbreviatedData));
	const clipPathShape = document.createElementNS("http://www.w3.org/2000/svg", "path");
	clipPathShape.setAttribute("d", buildSvgPathData(clipPoints));
	const clipCtm = clipShape["@_CTM"];
	if (clipCtm) {
		const ctms = parseCtm(clipCtm);
		clipPathShape.setAttribute("transform", `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`);
	}
	clipPathEl.appendChild(clipPathShape);
};
var applyClips = function(svgRoot, contentEl, clips) {
	const clipList = clips?.["ofd:Clip"];
	if (!clipList) return contentEl;
	let clipArray = [];
	clipArray = clipArray.concat(clipList);
	let defs = null;
	let current = contentEl;
	let clipIndex = 0;
	for (const clip of clipArray) {
		const areas = clip?.["ofd:Area"];
		if (!clip || !areas) continue;
		if (!defs) {
			defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
			svgRoot.appendChild(defs);
		}
		const clipPathEl = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
		const clipId = `ofd-clip-${clipIndex++}-${Math.random().toString(36).slice(2, 8)}`;
		clipPathEl.setAttribute("id", clipId);
		let areaArray = [];
		areaArray = areaArray.concat(areas);
		for (const area of areaArray) if (area) appendClipAreaPath(clipPathEl, area);
		defs.appendChild(clipPathEl);
		const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
		group.setAttribute("clip-path", `url(#${clipId})`);
		group.appendChild(current);
		current = group;
	}
	return current;
};
var renderPathObject = function(drawParamResObj, pathObject, defaultFillColor, defaultStrokeColor, defaultLineWith, isStampAnnot) {
	let boundary = parseStBox(pathObject["@_Boundary"]);
	boundary = converterBox(boundary);
	let lineWidth = pathObject["@_LineWidth"];
	const abbreviatedData = pathObject["ofd:AbbreviatedData"];
	const points = calPathPoint(convertPathAbbreviatedDatatoPoint(abbreviatedData));
	const ctm = pathObject["@_CTM"];
	let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("version", "1.1");
	let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
	if (lineWidth) defaultLineWith = converterDpi(lineWidth);
	const drawParam = pathObject["@_DrawParam"];
	if (drawParam) {
		lineWidth = drawParamResObj[drawParam]?.LineWidth;
		if (lineWidth) defaultLineWith = converterDpi(lineWidth);
	}
	const objectStyle = resolveDrawParamStyle(drawParamResObj, drawParam, {
		fillColor: defaultFillColor,
		strokeColor: defaultStrokeColor
	});
	defaultFillColor = objectStyle.fillColor;
	defaultStrokeColor = objectStyle.strokeColor;
	if (ctm) {
		const ctms = parseCtm(ctm);
		path.setAttribute("transform", `matrix(${ctms[0]} ${ctms[1]} ${ctms[2]} ${ctms[3]} ${converterDpi(ctms[4])} ${converterDpi(ctms[5])})`);
	}
	let strokeStyle = "";
	const strokeColor = pathObject["ofd:StrokeColor"];
	if (strokeColor) defaultStrokeColor = parseColor(strokeColor["@_Value"]);
	let fillStyle = "fill: none;";
	const fillColor = pathObject["ofd:FillColor"];
	if (fillColor) defaultFillColor = parseColor(fillColor["@_Value"]);
	if (defaultLineWith > 0 && !defaultStrokeColor) {
		defaultStrokeColor = defaultFillColor;
		if (!defaultStrokeColor) defaultStrokeColor = "rgb(0, 0, 0)";
	}
	strokeStyle = `stroke:${defaultStrokeColor};stroke-width:${defaultLineWith}px;`;
	if (pathObject["@_Stroke"] == "false") strokeStyle = ``;
	if (pathObject["@_Fill"] != "false") fillStyle = `fill:${isStampAnnot ? "none" : defaultFillColor ? defaultFillColor : "none"};`;
	path.setAttribute("style", `${strokeStyle};${fillStyle}`);
	path.setAttribute("d", buildSvgPathData(points));
	svg.appendChild(applyClips(svg, path, pathObject["ofd:Clips"]));
	let width = isStampAnnot ? boundary.w : Math.ceil(boundary.w);
	let height = isStampAnnot ? boundary.h : Math.ceil(boundary.h);
	let left = boundary.x;
	let top = boundary.y;
	svg.setAttribute("style", `overflow:visible;position:absolute;width:${width}px;height:${height}px;left:${left}px;top:${top}px;z-index:${pathObject["pfIndex"]}`);
	return svg;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/ofd/pipeline.js
var _pipeline = async function(...funcs) {
	let value;
	for (let index = 0; index < funcs.length; index += 1) value = await funcs[index].call(this, value);
	return value;
};
var pipeline = _pipeline;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/jbig2/compatibility.js
var import_lib = /* @__PURE__ */ __toESM(require_lib(), 1);
if (!globalThis._pdfjsCompatibilityChecked) globalThis._pdfjsCompatibilityChecked = true;
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/jbig2/util.js
var VerbosityLevel = {
	ERRORS: 0,
	WARNINGS: 1,
	INFOS: 5
};
var verbosity = VerbosityLevel.WARNINGS;
function info(msg) {
	if (verbosity >= VerbosityLevel.INFOS) console.log(`Info: ${msg}`);
}
function unreachable(msg) {
	throw new Error(msg);
}
function shadow(obj, prop, value) {
	Object.defineProperty(obj, prop, {
		value,
		enumerable: true,
		configurable: true,
		writable: false
	});
	return value;
}
/**
* @type {any}
*/
var BaseException = (function BaseExceptionClosure() {
	function BaseException(message) {
		if (this.constructor === BaseException) unreachable("Cannot initialize BaseException.");
		this.message = message;
		this.name = this.constructor.name;
	}
	BaseException.prototype = /* @__PURE__ */ new Error();
	BaseException.constructor = BaseException;
	return BaseException;
})();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/jbig2/core_utils.js
function log2(x) {
	if (x <= 0) return 0;
	return Math.ceil(Math.log2(x));
}
function readInt8(data, offset) {
	return data[offset] << 24 >> 24;
}
function readUint16(data, offset) {
	return data[offset] << 8 | data[offset + 1];
}
function readUint32(data, offset) {
	return (data[offset] << 24 | data[offset + 1] << 16 | data[offset + 2] << 8 | data[offset + 3]) >>> 0;
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/jbig2/arithmetic_decoder.js
var QeTable = [
	{
		qe: 22017,
		nmps: 1,
		nlps: 1,
		switchFlag: 1
	},
	{
		qe: 13313,
		nmps: 2,
		nlps: 6,
		switchFlag: 0
	},
	{
		qe: 6145,
		nmps: 3,
		nlps: 9,
		switchFlag: 0
	},
	{
		qe: 2753,
		nmps: 4,
		nlps: 12,
		switchFlag: 0
	},
	{
		qe: 1313,
		nmps: 5,
		nlps: 29,
		switchFlag: 0
	},
	{
		qe: 545,
		nmps: 38,
		nlps: 33,
		switchFlag: 0
	},
	{
		qe: 22017,
		nmps: 7,
		nlps: 6,
		switchFlag: 1
	},
	{
		qe: 21505,
		nmps: 8,
		nlps: 14,
		switchFlag: 0
	},
	{
		qe: 18433,
		nmps: 9,
		nlps: 14,
		switchFlag: 0
	},
	{
		qe: 14337,
		nmps: 10,
		nlps: 14,
		switchFlag: 0
	},
	{
		qe: 12289,
		nmps: 11,
		nlps: 17,
		switchFlag: 0
	},
	{
		qe: 9217,
		nmps: 12,
		nlps: 18,
		switchFlag: 0
	},
	{
		qe: 7169,
		nmps: 13,
		nlps: 20,
		switchFlag: 0
	},
	{
		qe: 5633,
		nmps: 29,
		nlps: 21,
		switchFlag: 0
	},
	{
		qe: 22017,
		nmps: 15,
		nlps: 14,
		switchFlag: 1
	},
	{
		qe: 21505,
		nmps: 16,
		nlps: 14,
		switchFlag: 0
	},
	{
		qe: 20737,
		nmps: 17,
		nlps: 15,
		switchFlag: 0
	},
	{
		qe: 18433,
		nmps: 18,
		nlps: 16,
		switchFlag: 0
	},
	{
		qe: 14337,
		nmps: 19,
		nlps: 17,
		switchFlag: 0
	},
	{
		qe: 13313,
		nmps: 20,
		nlps: 18,
		switchFlag: 0
	},
	{
		qe: 12289,
		nmps: 21,
		nlps: 19,
		switchFlag: 0
	},
	{
		qe: 10241,
		nmps: 22,
		nlps: 19,
		switchFlag: 0
	},
	{
		qe: 9217,
		nmps: 23,
		nlps: 20,
		switchFlag: 0
	},
	{
		qe: 8705,
		nmps: 24,
		nlps: 21,
		switchFlag: 0
	},
	{
		qe: 7169,
		nmps: 25,
		nlps: 22,
		switchFlag: 0
	},
	{
		qe: 6145,
		nmps: 26,
		nlps: 23,
		switchFlag: 0
	},
	{
		qe: 5633,
		nmps: 27,
		nlps: 24,
		switchFlag: 0
	},
	{
		qe: 5121,
		nmps: 28,
		nlps: 25,
		switchFlag: 0
	},
	{
		qe: 4609,
		nmps: 29,
		nlps: 26,
		switchFlag: 0
	},
	{
		qe: 4353,
		nmps: 30,
		nlps: 27,
		switchFlag: 0
	},
	{
		qe: 2753,
		nmps: 31,
		nlps: 28,
		switchFlag: 0
	},
	{
		qe: 2497,
		nmps: 32,
		nlps: 29,
		switchFlag: 0
	},
	{
		qe: 2209,
		nmps: 33,
		nlps: 30,
		switchFlag: 0
	},
	{
		qe: 1313,
		nmps: 34,
		nlps: 31,
		switchFlag: 0
	},
	{
		qe: 1089,
		nmps: 35,
		nlps: 32,
		switchFlag: 0
	},
	{
		qe: 673,
		nmps: 36,
		nlps: 33,
		switchFlag: 0
	},
	{
		qe: 545,
		nmps: 37,
		nlps: 34,
		switchFlag: 0
	},
	{
		qe: 321,
		nmps: 38,
		nlps: 35,
		switchFlag: 0
	},
	{
		qe: 273,
		nmps: 39,
		nlps: 36,
		switchFlag: 0
	},
	{
		qe: 133,
		nmps: 40,
		nlps: 37,
		switchFlag: 0
	},
	{
		qe: 73,
		nmps: 41,
		nlps: 38,
		switchFlag: 0
	},
	{
		qe: 37,
		nmps: 42,
		nlps: 39,
		switchFlag: 0
	},
	{
		qe: 21,
		nmps: 43,
		nlps: 40,
		switchFlag: 0
	},
	{
		qe: 9,
		nmps: 44,
		nlps: 41,
		switchFlag: 0
	},
	{
		qe: 5,
		nmps: 45,
		nlps: 42,
		switchFlag: 0
	},
	{
		qe: 1,
		nmps: 45,
		nlps: 43,
		switchFlag: 0
	},
	{
		qe: 22017,
		nmps: 46,
		nlps: 46,
		switchFlag: 0
	}
];
/**
* This class implements the QM Coder decoding as defined in
*   JPEG 2000 Part I Final Committee Draft Version 1.0
*   Annex C.3 Arithmetic decoding procedure
* available at http://www.jpeg.org/public/fcd15444-1.pdf
*
* The arithmetic decoder is used in conjunction with context models to decode
* JPEG2000 and JBIG2 streams.
*/
var ArithmeticDecoder = class {
	constructor(data, start, end) {
		this.data = data;
		this.bp = start;
		this.dataEnd = end;
		this.chigh = data[start];
		this.clow = 0;
		this.byteIn();
		this.chigh = this.chigh << 7 & 65535 | this.clow >> 9 & 127;
		this.clow = this.clow << 7 & 65535;
		this.ct -= 7;
		this.a = 32768;
	}
	byteIn() {
		const data = this.data;
		let bp = this.bp;
		if (data[bp] === 255) if (data[bp + 1] > 143) {
			this.clow += 65280;
			this.ct = 8;
		} else {
			bp++;
			this.clow += data[bp] << 9;
			this.ct = 7;
			this.bp = bp;
		}
		else {
			bp++;
			this.clow += bp < this.dataEnd ? data[bp] << 8 : 65280;
			this.ct = 8;
			this.bp = bp;
		}
		if (this.clow > 65535) {
			this.chigh += this.clow >> 16;
			this.clow &= 65535;
		}
	}
	readBit(contexts, pos) {
		let cx_index = contexts[pos] >> 1, cx_mps = contexts[pos] & 1;
		const qeTableIcx = QeTable[cx_index];
		const qeIcx = qeTableIcx.qe;
		let d;
		let a = this.a - qeIcx;
		if (this.chigh < qeIcx) if (a < qeIcx) {
			a = qeIcx;
			d = cx_mps;
			cx_index = qeTableIcx.nmps;
		} else {
			a = qeIcx;
			d = 1 ^ cx_mps;
			if (qeTableIcx.switchFlag === 1) cx_mps = d;
			cx_index = qeTableIcx.nlps;
		}
		else {
			this.chigh -= qeIcx;
			if ((a & 32768) !== 0) {
				this.a = a;
				return cx_mps;
			}
			if (a < qeIcx) {
				d = 1 ^ cx_mps;
				if (qeTableIcx.switchFlag === 1) cx_mps = d;
				cx_index = qeTableIcx.nlps;
			} else {
				d = cx_mps;
				cx_index = qeTableIcx.nmps;
			}
		}
		do {
			if (this.ct === 0) this.byteIn();
			a <<= 1;
			this.chigh = this.chigh << 1 & 65535 | this.clow >> 15 & 1;
			this.clow = this.clow << 1 & 65535;
			this.ct--;
		} while ((a & 32768) === 0);
		this.a = a;
		contexts[pos] = cx_index << 1 | cx_mps;
		return d;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/jbig2/ccitt.js
/**
* @typedef {Object} CCITTFaxDecoderSource
* @property {function} next - Method that return one byte of data for decoding,
*   or -1 when EOF is reached.
*/
var CCITTFaxDecoder = (function CCITTFaxDecoder() {
	const ccittEOL = -2;
	const ccittEOF = -1;
	const twoDimPass = 0;
	const twoDimHoriz = 1;
	const twoDimVert0 = 2;
	const twoDimVertR1 = 3;
	const twoDimVertL1 = 4;
	const twoDimVertR2 = 5;
	const twoDimVertL2 = 6;
	const twoDimVertR3 = 7;
	const twoDimVertL3 = 8;
	const twoDimTable = [
		[-1, -1],
		[-1, -1],
		[7, twoDimVertL3],
		[7, twoDimVertR3],
		[6, twoDimVertL2],
		[6, twoDimVertL2],
		[6, twoDimVertR2],
		[6, twoDimVertR2],
		[4, twoDimPass],
		[4, twoDimPass],
		[4, twoDimPass],
		[4, twoDimPass],
		[4, twoDimPass],
		[4, twoDimPass],
		[4, twoDimPass],
		[4, twoDimPass],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimHoriz],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertL1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[3, twoDimVertR1],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0],
		[1, twoDimVert0]
	];
	const whiteTable1 = [
		[-1, -1],
		[12, ccittEOL],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[11, 1792],
		[11, 1792],
		[12, 1984],
		[12, 2048],
		[12, 2112],
		[12, 2176],
		[12, 2240],
		[12, 2304],
		[11, 1856],
		[11, 1856],
		[11, 1920],
		[11, 1920],
		[12, 2368],
		[12, 2432],
		[12, 2496],
		[12, 2560]
	];
	const whiteTable2 = [
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[8, 29],
		[8, 29],
		[8, 30],
		[8, 30],
		[8, 45],
		[8, 45],
		[8, 46],
		[8, 46],
		[7, 22],
		[7, 22],
		[7, 22],
		[7, 22],
		[7, 23],
		[7, 23],
		[7, 23],
		[7, 23],
		[8, 47],
		[8, 47],
		[8, 48],
		[8, 48],
		[6, 13],
		[6, 13],
		[6, 13],
		[6, 13],
		[6, 13],
		[6, 13],
		[6, 13],
		[6, 13],
		[7, 20],
		[7, 20],
		[7, 20],
		[7, 20],
		[8, 33],
		[8, 33],
		[8, 34],
		[8, 34],
		[8, 35],
		[8, 35],
		[8, 36],
		[8, 36],
		[8, 37],
		[8, 37],
		[8, 38],
		[8, 38],
		[7, 19],
		[7, 19],
		[7, 19],
		[7, 19],
		[8, 31],
		[8, 31],
		[8, 32],
		[8, 32],
		[6, 1],
		[6, 1],
		[6, 1],
		[6, 1],
		[6, 1],
		[6, 1],
		[6, 1],
		[6, 1],
		[6, 12],
		[6, 12],
		[6, 12],
		[6, 12],
		[6, 12],
		[6, 12],
		[6, 12],
		[6, 12],
		[8, 53],
		[8, 53],
		[8, 54],
		[8, 54],
		[7, 26],
		[7, 26],
		[7, 26],
		[7, 26],
		[8, 39],
		[8, 39],
		[8, 40],
		[8, 40],
		[8, 41],
		[8, 41],
		[8, 42],
		[8, 42],
		[8, 43],
		[8, 43],
		[8, 44],
		[8, 44],
		[7, 21],
		[7, 21],
		[7, 21],
		[7, 21],
		[7, 28],
		[7, 28],
		[7, 28],
		[7, 28],
		[8, 61],
		[8, 61],
		[8, 62],
		[8, 62],
		[8, 63],
		[8, 63],
		[8, 0],
		[8, 0],
		[8, 320],
		[8, 320],
		[8, 384],
		[8, 384],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 10],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[5, 11],
		[7, 27],
		[7, 27],
		[7, 27],
		[7, 27],
		[8, 59],
		[8, 59],
		[8, 60],
		[8, 60],
		[9, 1472],
		[9, 1536],
		[9, 1600],
		[9, 1728],
		[7, 18],
		[7, 18],
		[7, 18],
		[7, 18],
		[7, 24],
		[7, 24],
		[7, 24],
		[7, 24],
		[8, 49],
		[8, 49],
		[8, 50],
		[8, 50],
		[8, 51],
		[8, 51],
		[8, 52],
		[8, 52],
		[7, 25],
		[7, 25],
		[7, 25],
		[7, 25],
		[8, 55],
		[8, 55],
		[8, 56],
		[8, 56],
		[8, 57],
		[8, 57],
		[8, 58],
		[8, 58],
		[6, 192],
		[6, 192],
		[6, 192],
		[6, 192],
		[6, 192],
		[6, 192],
		[6, 192],
		[6, 192],
		[6, 1664],
		[6, 1664],
		[6, 1664],
		[6, 1664],
		[6, 1664],
		[6, 1664],
		[6, 1664],
		[6, 1664],
		[8, 448],
		[8, 448],
		[8, 512],
		[8, 512],
		[9, 704],
		[9, 768],
		[8, 640],
		[8, 640],
		[8, 576],
		[8, 576],
		[9, 832],
		[9, 896],
		[9, 960],
		[9, 1024],
		[9, 1088],
		[9, 1152],
		[9, 1216],
		[9, 1280],
		[9, 1344],
		[9, 1408],
		[7, 256],
		[7, 256],
		[7, 256],
		[7, 256],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 2],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[4, 3],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 128],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 8],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[5, 9],
		[6, 16],
		[6, 16],
		[6, 16],
		[6, 16],
		[6, 16],
		[6, 16],
		[6, 16],
		[6, 16],
		[6, 17],
		[6, 17],
		[6, 17],
		[6, 17],
		[6, 17],
		[6, 17],
		[6, 17],
		[6, 17],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 4],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[6, 14],
		[6, 14],
		[6, 14],
		[6, 14],
		[6, 14],
		[6, 14],
		[6, 14],
		[6, 14],
		[6, 15],
		[6, 15],
		[6, 15],
		[6, 15],
		[6, 15],
		[6, 15],
		[6, 15],
		[6, 15],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[5, 64],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7],
		[4, 7]
	];
	const blackTable1 = [
		[-1, -1],
		[-1, -1],
		[12, ccittEOL],
		[12, ccittEOL],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[11, 1792],
		[11, 1792],
		[11, 1792],
		[11, 1792],
		[12, 1984],
		[12, 1984],
		[12, 2048],
		[12, 2048],
		[12, 2112],
		[12, 2112],
		[12, 2176],
		[12, 2176],
		[12, 2240],
		[12, 2240],
		[12, 2304],
		[12, 2304],
		[11, 1856],
		[11, 1856],
		[11, 1856],
		[11, 1856],
		[11, 1920],
		[11, 1920],
		[11, 1920],
		[11, 1920],
		[12, 2368],
		[12, 2368],
		[12, 2432],
		[12, 2432],
		[12, 2496],
		[12, 2496],
		[12, 2560],
		[12, 2560],
		[10, 18],
		[10, 18],
		[10, 18],
		[10, 18],
		[10, 18],
		[10, 18],
		[10, 18],
		[10, 18],
		[12, 52],
		[12, 52],
		[13, 640],
		[13, 704],
		[13, 768],
		[13, 832],
		[12, 55],
		[12, 55],
		[12, 56],
		[12, 56],
		[13, 1280],
		[13, 1344],
		[13, 1408],
		[13, 1472],
		[12, 59],
		[12, 59],
		[12, 60],
		[12, 60],
		[13, 1536],
		[13, 1600],
		[11, 24],
		[11, 24],
		[11, 24],
		[11, 24],
		[11, 25],
		[11, 25],
		[11, 25],
		[11, 25],
		[13, 1664],
		[13, 1728],
		[12, 320],
		[12, 320],
		[12, 384],
		[12, 384],
		[12, 448],
		[12, 448],
		[13, 512],
		[13, 576],
		[12, 53],
		[12, 53],
		[12, 54],
		[12, 54],
		[13, 896],
		[13, 960],
		[13, 1024],
		[13, 1088],
		[13, 1152],
		[13, 1216],
		[10, 64],
		[10, 64],
		[10, 64],
		[10, 64],
		[10, 64],
		[10, 64],
		[10, 64],
		[10, 64]
	];
	const blackTable2 = [
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[8, 13],
		[11, 23],
		[11, 23],
		[12, 50],
		[12, 51],
		[12, 44],
		[12, 45],
		[12, 46],
		[12, 47],
		[12, 57],
		[12, 58],
		[12, 61],
		[12, 256],
		[10, 16],
		[10, 16],
		[10, 16],
		[10, 16],
		[10, 17],
		[10, 17],
		[10, 17],
		[10, 17],
		[12, 48],
		[12, 49],
		[12, 62],
		[12, 63],
		[12, 30],
		[12, 31],
		[12, 32],
		[12, 33],
		[12, 40],
		[12, 41],
		[11, 22],
		[11, 22],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[8, 14],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 10],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[7, 11],
		[9, 15],
		[9, 15],
		[9, 15],
		[9, 15],
		[9, 15],
		[9, 15],
		[9, 15],
		[9, 15],
		[12, 128],
		[12, 192],
		[12, 26],
		[12, 27],
		[12, 28],
		[12, 29],
		[11, 19],
		[11, 19],
		[11, 20],
		[11, 20],
		[12, 34],
		[12, 35],
		[12, 36],
		[12, 37],
		[12, 38],
		[12, 39],
		[11, 21],
		[11, 21],
		[12, 42],
		[12, 43],
		[10, 0],
		[10, 0],
		[10, 0],
		[10, 0],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12],
		[7, 12]
	];
	const blackTable3 = [
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[-1, -1],
		[6, 9],
		[6, 8],
		[5, 7],
		[5, 7],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 6],
		[4, 5],
		[4, 5],
		[4, 5],
		[4, 5],
		[3, 1],
		[3, 1],
		[3, 1],
		[3, 1],
		[3, 1],
		[3, 1],
		[3, 1],
		[3, 1],
		[3, 4],
		[3, 4],
		[3, 4],
		[3, 4],
		[3, 4],
		[3, 4],
		[3, 4],
		[3, 4],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 3],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2],
		[2, 2]
	];
	/**
	* @param {CCITTFaxDecoderSource} source - The data which should be decoded.
	* @param {Object} [options] - Decoding options.
	*/
	function CCITTFaxDecoder(source, options = {}) {
		if (!source || typeof source.next !== "function") throw new Error("CCITTFaxDecoder - invalid \"source\" parameter.");
		this.source = source;
		this.eof = false;
		this.encoding = options.K || 0;
		this.eoline = options.EndOfLine || false;
		this.byteAlign = options.EncodedByteAlign || false;
		this.columns = options.Columns || 1728;
		this.rows = options.Rows || 0;
		let eoblock = options.EndOfBlock;
		if (eoblock === null || eoblock === void 0) eoblock = true;
		this.eoblock = eoblock;
		this.black = options.BlackIs1 || false;
		this.codingLine = new Uint32Array(this.columns + 1);
		this.refLine = new Uint32Array(this.columns + 2);
		this.codingLine[0] = this.columns;
		this.codingPos = 0;
		this.row = 0;
		this.nextLine2D = this.encoding < 0;
		this.inputBits = 0;
		this.inputBuf = 0;
		this.outputBits = 0;
		this.rowsDone = false;
		let code1;
		while ((code1 = this._lookBits(12)) === 0) this._eatBits(1);
		if (code1 === 1) this._eatBits(12);
		if (this.encoding > 0) {
			this.nextLine2D = !this._lookBits(1);
			this._eatBits(1);
		}
	}
	CCITTFaxDecoder.prototype = {
		readNextChar() {
			if (this.eof) return -1;
			const refLine = this.refLine;
			const codingLine = this.codingLine;
			const columns = this.columns;
			let refPos, blackPixels, bits, i;
			if (this.outputBits === 0) {
				if (this.rowsDone) this.eof = true;
				if (this.eof) return -1;
				this.err = false;
				let code1, code2, code3;
				if (this.nextLine2D) {
					for (i = 0; codingLine[i] < columns; ++i) refLine[i] = codingLine[i];
					refLine[i++] = columns;
					refLine[i] = columns;
					codingLine[0] = 0;
					this.codingPos = 0;
					refPos = 0;
					blackPixels = 0;
					while (codingLine[this.codingPos] < columns) {
						code1 = this._getTwoDimCode();
						switch (code1) {
							case twoDimPass:
								this._addPixels(refLine[refPos + 1], blackPixels);
								if (refLine[refPos + 1] < columns) refPos += 2;
								break;
							case twoDimHoriz:
								code1 = code2 = 0;
								if (blackPixels) {
									do
										code1 += code3 = this._getBlackCode();
									while (code3 >= 64);
									do
										code2 += code3 = this._getWhiteCode();
									while (code3 >= 64);
								} else {
									do
										code1 += code3 = this._getWhiteCode();
									while (code3 >= 64);
									do
										code2 += code3 = this._getBlackCode();
									while (code3 >= 64);
								}
								this._addPixels(codingLine[this.codingPos] + code1, blackPixels);
								if (codingLine[this.codingPos] < columns) this._addPixels(codingLine[this.codingPos] + code2, blackPixels ^ 1);
								while (refLine[refPos] <= codingLine[this.codingPos] && refLine[refPos] < columns) refPos += 2;
								break;
							case twoDimVertR3:
								this._addPixels(refLine[refPos] + 3, blackPixels);
								blackPixels ^= 1;
								if (codingLine[this.codingPos] < columns) {
									++refPos;
									while (refLine[refPos] <= codingLine[this.codingPos] && refLine[refPos] < columns) refPos += 2;
								}
								break;
							case twoDimVertR2:
								this._addPixels(refLine[refPos] + 2, blackPixels);
								blackPixels ^= 1;
								if (codingLine[this.codingPos] < columns) {
									++refPos;
									while (refLine[refPos] <= codingLine[this.codingPos] && refLine[refPos] < columns) refPos += 2;
								}
								break;
							case twoDimVertR1:
								this._addPixels(refLine[refPos] + 1, blackPixels);
								blackPixels ^= 1;
								if (codingLine[this.codingPos] < columns) {
									++refPos;
									while (refLine[refPos] <= codingLine[this.codingPos] && refLine[refPos] < columns) refPos += 2;
								}
								break;
							case twoDimVert0:
								this._addPixels(refLine[refPos], blackPixels);
								blackPixels ^= 1;
								if (codingLine[this.codingPos] < columns) {
									++refPos;
									while (refLine[refPos] <= codingLine[this.codingPos] && refLine[refPos] < columns) refPos += 2;
								}
								break;
							case twoDimVertL3:
								this._addPixelsNeg(refLine[refPos] - 3, blackPixels);
								blackPixels ^= 1;
								if (codingLine[this.codingPos] < columns) {
									if (refPos > 0) --refPos;
									else ++refPos;
									while (refLine[refPos] <= codingLine[this.codingPos] && refLine[refPos] < columns) refPos += 2;
								}
								break;
							case twoDimVertL2:
								this._addPixelsNeg(refLine[refPos] - 2, blackPixels);
								blackPixels ^= 1;
								if (codingLine[this.codingPos] < columns) {
									if (refPos > 0) --refPos;
									else ++refPos;
									while (refLine[refPos] <= codingLine[this.codingPos] && refLine[refPos] < columns) refPos += 2;
								}
								break;
							case twoDimVertL1:
								this._addPixelsNeg(refLine[refPos] - 1, blackPixels);
								blackPixels ^= 1;
								if (codingLine[this.codingPos] < columns) {
									if (refPos > 0) --refPos;
									else ++refPos;
									while (refLine[refPos] <= codingLine[this.codingPos] && refLine[refPos] < columns) refPos += 2;
								}
								break;
							case ccittEOF:
								this._addPixels(columns, 0);
								this.eof = true;
								break;
							default:
								info("bad 2d code");
								this._addPixels(columns, 0);
								this.err = true;
						}
					}
				} else {
					codingLine[0] = 0;
					this.codingPos = 0;
					blackPixels = 0;
					while (codingLine[this.codingPos] < columns) {
						code1 = 0;
						if (blackPixels) do
							code1 += code3 = this._getBlackCode();
						while (code3 >= 64);
						else do
							code1 += code3 = this._getWhiteCode();
						while (code3 >= 64);
						this._addPixels(codingLine[this.codingPos] + code1, blackPixels);
						blackPixels ^= 1;
					}
				}
				let gotEOL = false;
				if (this.byteAlign) this.inputBits &= -8;
				if (!this.eoblock && this.row === this.rows - 1) this.rowsDone = true;
				else {
					code1 = this._lookBits(12);
					if (this.eoline) while (code1 !== ccittEOF && code1 !== 1) {
						this._eatBits(1);
						code1 = this._lookBits(12);
					}
					else while (code1 === 0) {
						this._eatBits(1);
						code1 = this._lookBits(12);
					}
					if (code1 === 1) {
						this._eatBits(12);
						gotEOL = true;
					} else if (code1 === ccittEOF) this.eof = true;
				}
				if (!this.eof && this.encoding > 0 && !this.rowsDone) {
					this.nextLine2D = !this._lookBits(1);
					this._eatBits(1);
				}
				if (this.eoblock && gotEOL && this.byteAlign) {
					code1 = this._lookBits(12);
					if (code1 === 1) {
						this._eatBits(12);
						if (this.encoding > 0) {
							this._lookBits(1);
							this._eatBits(1);
						}
						if (this.encoding >= 0) for (i = 0; i < 4; ++i) {
							code1 = this._lookBits(12);
							if (code1 !== 1) info("bad rtc code: " + code1);
							this._eatBits(12);
							if (this.encoding > 0) {
								this._lookBits(1);
								this._eatBits(1);
							}
						}
						this.eof = true;
					}
				} else if (this.err && this.eoline) {
					while (true) {
						code1 = this._lookBits(13);
						if (code1 === ccittEOF) {
							this.eof = true;
							return -1;
						}
						if (code1 >> 1 === 1) break;
						this._eatBits(1);
					}
					this._eatBits(12);
					if (this.encoding > 0) {
						this._eatBits(1);
						this.nextLine2D = !(code1 & 1);
					}
				}
				if (codingLine[0] > 0) this.outputBits = codingLine[this.codingPos = 0];
				else this.outputBits = codingLine[this.codingPos = 1];
				this.row++;
			}
			let c;
			if (this.outputBits >= 8) {
				c = this.codingPos & 1 ? 0 : 255;
				this.outputBits -= 8;
				if (this.outputBits === 0 && codingLine[this.codingPos] < columns) {
					this.codingPos++;
					this.outputBits = codingLine[this.codingPos] - codingLine[this.codingPos - 1];
				}
			} else {
				bits = 8;
				c = 0;
				do
					if (this.outputBits > bits) {
						c <<= bits;
						if (!(this.codingPos & 1)) c |= 255 >> 8 - bits;
						this.outputBits -= bits;
						bits = 0;
					} else {
						c <<= this.outputBits;
						if (!(this.codingPos & 1)) c |= 255 >> 8 - this.outputBits;
						bits -= this.outputBits;
						this.outputBits = 0;
						if (codingLine[this.codingPos] < columns) {
							this.codingPos++;
							this.outputBits = codingLine[this.codingPos] - codingLine[this.codingPos - 1];
						} else if (bits > 0) {
							c <<= bits;
							bits = 0;
						}
					}
				while (bits);
			}
			if (this.black) c ^= 255;
			return c;
		},
		/**
		* @private
		*/
		_addPixels(a1, blackPixels) {
			const codingLine = this.codingLine;
			let codingPos = this.codingPos;
			if (a1 > codingLine[codingPos]) {
				if (a1 > this.columns) {
					info("row is wrong length");
					this.err = true;
					a1 = this.columns;
				}
				if (codingPos & 1 ^ blackPixels) ++codingPos;
				codingLine[codingPos] = a1;
			}
			this.codingPos = codingPos;
		},
		/**
		* @private
		*/
		_addPixelsNeg(a1, blackPixels) {
			const codingLine = this.codingLine;
			let codingPos = this.codingPos;
			if (a1 > codingLine[codingPos]) {
				if (a1 > this.columns) {
					info("row is wrong length");
					this.err = true;
					a1 = this.columns;
				}
				if (codingPos & 1 ^ blackPixels) ++codingPos;
				codingLine[codingPos] = a1;
			} else if (a1 < codingLine[codingPos]) {
				if (a1 < 0) {
					info("invalid code");
					this.err = true;
					a1 = 0;
				}
				while (codingPos > 0 && a1 < codingLine[codingPos - 1]) --codingPos;
				codingLine[codingPos] = a1;
			}
			this.codingPos = codingPos;
		},
		/**
		* This function returns the code found from the table.
		* The start and end parameters set the boundaries for searching the table.
		* The limit parameter is optional. Function returns an array with three
		* values. The first array element indicates whether a valid code is being
		* returned. The second array element is the actual code. The third array
		* element indicates whether EOF was reached.
		* @private
		*/
		_findTableCode(start, end, table, limit) {
			const limitValue = limit || 0;
			for (let i = start; i <= end; ++i) {
				let code = this._lookBits(i);
				if (code === ccittEOF) return [
					true,
					1,
					false
				];
				if (i < end) code <<= end - i;
				if (!limitValue || code >= limitValue) {
					const p = table[code - limitValue];
					if (p[0] === i) {
						this._eatBits(i);
						return [
							true,
							p[1],
							true
						];
					}
				}
			}
			return [
				false,
				0,
				false
			];
		},
		/**
		* @private
		*/
		_getTwoDimCode() {
			let code = 0;
			let p;
			if (this.eoblock) {
				code = this._lookBits(7);
				p = twoDimTable[code];
				if (p && p[0] > 0) {
					this._eatBits(p[0]);
					return p[1];
				}
			} else {
				const result = this._findTableCode(1, 7, twoDimTable);
				if (result[0] && result[2]) return result[1];
			}
			info("Bad two dim code");
			return ccittEOF;
		},
		/**
		* @private
		*/
		_getWhiteCode() {
			let code = 0;
			let p;
			if (this.eoblock) {
				code = this._lookBits(12);
				if (code === ccittEOF) return 1;
				if (code >> 5 === 0) p = whiteTable1[code];
				else p = whiteTable2[code >> 3];
				if (p[0] > 0) {
					this._eatBits(p[0]);
					return p[1];
				}
			} else {
				let result = this._findTableCode(1, 9, whiteTable2);
				if (result[0]) return result[1];
				result = this._findTableCode(11, 12, whiteTable1);
				if (result[0]) return result[1];
			}
			info("bad white code");
			this._eatBits(1);
			return 1;
		},
		/**
		* @private
		*/
		_getBlackCode() {
			let code, p;
			if (this.eoblock) {
				code = this._lookBits(13);
				if (code === ccittEOF) return 1;
				if (code >> 7 === 0) p = blackTable1[code];
				else if (code >> 9 === 0 && code >> 7 !== 0) p = blackTable2[(code >> 1) - 64];
				else p = blackTable3[code >> 7];
				if (p[0] > 0) {
					this._eatBits(p[0]);
					return p[1];
				}
			} else {
				let result = this._findTableCode(2, 6, blackTable3);
				if (result[0]) return result[1];
				result = this._findTableCode(7, 12, blackTable2, 64);
				if (result[0]) return result[1];
				result = this._findTableCode(10, 13, blackTable1);
				if (result[0]) return result[1];
			}
			info("bad black code");
			this._eatBits(1);
			return 1;
		},
		/**
		* @private
		*/
		_lookBits(n) {
			let c;
			while (this.inputBits < n) {
				if ((c = this.source.next()) === -1) {
					if (this.inputBits === 0) return ccittEOF;
					return this.inputBuf << n - this.inputBits & 65535 >> 16 - n;
				}
				this.inputBuf = this.inputBuf << 8 | c;
				this.inputBits += 8;
			}
			return this.inputBuf >> this.inputBits - n & 65535 >> 16 - n;
		},
		/**
		* @private
		*/
		_eatBits(n) {
			if ((this.inputBits -= n) < 0) this.inputBits = 0;
		}
	};
	return CCITTFaxDecoder;
})();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/jbig2/jbig2.js
var Jbig2Error = class extends BaseException {
	constructor(msg) {
		super(`JBIG2 error: ${msg}`);
	}
};
var Jbig2Image = (function Jbig2ImageClosure() {
	function ContextCache() {}
	ContextCache.prototype = { getContexts(id) {
		if (id in this) return this[id];
		return this[id] = /* @__PURE__ */ new Int8Array(65536);
	} };
	function DecodingContext(data, start, end) {
		this.data = data;
		this.start = start;
		this.end = end;
	}
	DecodingContext.prototype = {
		get decoder() {
			var decoder = new ArithmeticDecoder(this.data, this.start, this.end);
			return shadow(this, "decoder", decoder);
		},
		get contextCache() {
			var cache = new ContextCache();
			return shadow(this, "contextCache", cache);
		}
	};
	function decodeInteger(contextCache, procedure, decoder) {
		var contexts = contextCache.getContexts(procedure);
		var prev = 1;
		function readBits(length) {
			var v = 0;
			for (var i = 0; i < length; i++) {
				var bit = decoder.readBit(contexts, prev);
				prev = prev < 256 ? prev << 1 | bit : (prev << 1 | bit) & 511 | 256;
				v = v << 1 | bit;
			}
			return v >>> 0;
		}
		var sign = readBits(1);
		var value = readBits(1) ? readBits(1) ? readBits(1) ? readBits(1) ? readBits(1) ? readBits(32) + 4436 : readBits(12) + 340 : readBits(8) + 84 : readBits(6) + 20 : readBits(4) + 4 : readBits(2);
		if (sign === 0) return value;
		else if (value > 0) return -value;
		return null;
	}
	function decodeIAID(contextCache, decoder, codeLength) {
		var contexts = contextCache.getContexts("IAID");
		var prev = 1;
		for (var i = 0; i < codeLength; i++) {
			var bit = decoder.readBit(contexts, prev);
			prev = prev << 1 | bit;
		}
		if (codeLength < 31) return prev & (1 << codeLength) - 1;
		return prev & 2147483647;
	}
	var SegmentTypes = [
		"SymbolDictionary",
		null,
		null,
		null,
		"IntermediateTextRegion",
		null,
		"ImmediateTextRegion",
		"ImmediateLosslessTextRegion",
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		"PatternDictionary",
		null,
		null,
		null,
		"IntermediateHalftoneRegion",
		null,
		"ImmediateHalftoneRegion",
		"ImmediateLosslessHalftoneRegion",
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		"IntermediateGenericRegion",
		null,
		"ImmediateGenericRegion",
		"ImmediateLosslessGenericRegion",
		"IntermediateGenericRefinementRegion",
		null,
		"ImmediateGenericRefinementRegion",
		"ImmediateLosslessGenericRefinementRegion",
		null,
		null,
		null,
		null,
		"PageInformation",
		"EndOfPage",
		"EndOfStripe",
		"EndOfFile",
		"Profiles",
		"Tables",
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		null,
		"Extension"
	];
	var CodingTemplates = [
		[
			{
				x: -1,
				y: -2
			},
			{
				x: 0,
				y: -2
			},
			{
				x: 1,
				y: -2
			},
			{
				x: -2,
				y: -1
			},
			{
				x: -1,
				y: -1
			},
			{
				x: 0,
				y: -1
			},
			{
				x: 1,
				y: -1
			},
			{
				x: 2,
				y: -1
			},
			{
				x: -4,
				y: 0
			},
			{
				x: -3,
				y: 0
			},
			{
				x: -2,
				y: 0
			},
			{
				x: -1,
				y: 0
			}
		],
		[
			{
				x: -1,
				y: -2
			},
			{
				x: 0,
				y: -2
			},
			{
				x: 1,
				y: -2
			},
			{
				x: 2,
				y: -2
			},
			{
				x: -2,
				y: -1
			},
			{
				x: -1,
				y: -1
			},
			{
				x: 0,
				y: -1
			},
			{
				x: 1,
				y: -1
			},
			{
				x: 2,
				y: -1
			},
			{
				x: -3,
				y: 0
			},
			{
				x: -2,
				y: 0
			},
			{
				x: -1,
				y: 0
			}
		],
		[
			{
				x: -1,
				y: -2
			},
			{
				x: 0,
				y: -2
			},
			{
				x: 1,
				y: -2
			},
			{
				x: -2,
				y: -1
			},
			{
				x: -1,
				y: -1
			},
			{
				x: 0,
				y: -1
			},
			{
				x: 1,
				y: -1
			},
			{
				x: -2,
				y: 0
			},
			{
				x: -1,
				y: 0
			}
		],
		[
			{
				x: -3,
				y: -1
			},
			{
				x: -2,
				y: -1
			},
			{
				x: -1,
				y: -1
			},
			{
				x: 0,
				y: -1
			},
			{
				x: 1,
				y: -1
			},
			{
				x: -4,
				y: 0
			},
			{
				x: -3,
				y: 0
			},
			{
				x: -2,
				y: 0
			},
			{
				x: -1,
				y: 0
			}
		]
	];
	var RefinementTemplates = [{
		coding: [
			{
				x: 0,
				y: -1
			},
			{
				x: 1,
				y: -1
			},
			{
				x: -1,
				y: 0
			}
		],
		reference: [
			{
				x: 0,
				y: -1
			},
			{
				x: 1,
				y: -1
			},
			{
				x: -1,
				y: 0
			},
			{
				x: 0,
				y: 0
			},
			{
				x: 1,
				y: 0
			},
			{
				x: -1,
				y: 1
			},
			{
				x: 0,
				y: 1
			},
			{
				x: 1,
				y: 1
			}
		]
	}, {
		coding: [
			{
				x: -1,
				y: -1
			},
			{
				x: 0,
				y: -1
			},
			{
				x: 1,
				y: -1
			},
			{
				x: -1,
				y: 0
			}
		],
		reference: [
			{
				x: 0,
				y: -1
			},
			{
				x: -1,
				y: 0
			},
			{
				x: 0,
				y: 0
			},
			{
				x: 1,
				y: 0
			},
			{
				x: 0,
				y: 1
			},
			{
				x: 1,
				y: 1
			}
		]
	}];
	var ReusedContexts = [
		39717,
		1941,
		229,
		405
	];
	var RefinementReusedContexts = [32, 8];
	function decodeBitmapTemplate0(width, height, decodingContext) {
		var decoder = decodingContext.decoder;
		var contexts = decodingContext.contextCache.getContexts("GB");
		var contextLabel, i, j, pixel, row, row1, row2, bitmap = [];
		var OLD_PIXEL_MASK = 31735;
		for (i = 0; i < height; i++) {
			row = bitmap[i] = new Uint8Array(width);
			row1 = i < 1 ? row : bitmap[i - 1];
			row2 = i < 2 ? row : bitmap[i - 2];
			contextLabel = row2[0] << 13 | row2[1] << 12 | row2[2] << 11 | row1[0] << 7 | row1[1] << 6 | row1[2] << 5 | row1[3] << 4;
			for (j = 0; j < width; j++) {
				row[j] = pixel = decoder.readBit(contexts, contextLabel);
				contextLabel = (contextLabel & OLD_PIXEL_MASK) << 1 | (j + 3 < width ? row2[j + 3] << 11 : 0) | (j + 4 < width ? row1[j + 4] << 4 : 0) | pixel;
			}
		}
		return bitmap;
	}
	function decodeBitmap(mmr, width, height, templateIndex, prediction, skip, at, decodingContext) {
		if (mmr) return decodeMMRBitmap(new Reader(decodingContext.data, decodingContext.start, decodingContext.end), width, height, false);
		if (templateIndex === 0 && !skip && !prediction && at.length === 4 && at[0].x === 3 && at[0].y === -1 && at[1].x === -3 && at[1].y === -1 && at[2].x === 2 && at[2].y === -2 && at[3].x === -2 && at[3].y === -2) return decodeBitmapTemplate0(width, height, decodingContext);
		var useskip = !!skip;
		var template = CodingTemplates[templateIndex].concat(at);
		template.sort(function(a, b) {
			return a.y - b.y || a.x - b.x;
		});
		var templateLength = template.length;
		var templateX = new Int8Array(templateLength);
		var templateY = new Int8Array(templateLength);
		var changingTemplateEntries = [];
		var reuseMask = 0, minX = 0, maxX = 0, minY = 0;
		var c, k;
		for (k = 0; k < templateLength; k++) {
			templateX[k] = template[k].x;
			templateY[k] = template[k].y;
			minX = Math.min(minX, template[k].x);
			maxX = Math.max(maxX, template[k].x);
			minY = Math.min(minY, template[k].y);
			if (k < templateLength - 1 && template[k].y === template[k + 1].y && template[k].x === template[k + 1].x - 1) reuseMask |= 1 << templateLength - 1 - k;
			else changingTemplateEntries.push(k);
		}
		var changingEntriesLength = changingTemplateEntries.length;
		var changingTemplateX = new Int8Array(changingEntriesLength);
		var changingTemplateY = new Int8Array(changingEntriesLength);
		var changingTemplateBit = new Uint16Array(changingEntriesLength);
		for (c = 0; c < changingEntriesLength; c++) {
			k = changingTemplateEntries[c];
			changingTemplateX[c] = template[k].x;
			changingTemplateY[c] = template[k].y;
			changingTemplateBit[c] = 1 << templateLength - 1 - k;
		}
		var sbb_left = -minX;
		var sbb_top = -minY;
		var sbb_right = width - maxX;
		var pseudoPixelContext = ReusedContexts[templateIndex];
		var row = new Uint8Array(width);
		var bitmap = [];
		var decoder = decodingContext.decoder;
		var contexts = decodingContext.contextCache.getContexts("GB");
		var ltp = 0, j, i0, j0, contextLabel = 0, bit, shift;
		for (var i = 0; i < height; i++) {
			if (prediction) {
				var sltp = decoder.readBit(contexts, pseudoPixelContext);
				ltp ^= sltp;
				if (ltp) {
					bitmap.push(row);
					continue;
				}
			}
			row = new Uint8Array(row);
			bitmap.push(row);
			for (j = 0; j < width; j++) {
				if (useskip && skip[i][j]) {
					row[j] = 0;
					continue;
				}
				if (j >= sbb_left && j < sbb_right && i >= sbb_top) {
					contextLabel = contextLabel << 1 & reuseMask;
					for (k = 0; k < changingEntriesLength; k++) {
						i0 = i + changingTemplateY[k];
						j0 = j + changingTemplateX[k];
						bit = bitmap[i0][j0];
						if (bit) {
							bit = changingTemplateBit[k];
							contextLabel |= bit;
						}
					}
				} else {
					contextLabel = 0;
					shift = templateLength - 1;
					for (k = 0; k < templateLength; k++, shift--) {
						j0 = j + templateX[k];
						if (j0 >= 0 && j0 < width) {
							i0 = i + templateY[k];
							if (i0 >= 0) {
								bit = bitmap[i0][j0];
								if (bit) contextLabel |= bit << shift;
							}
						}
					}
				}
				var pixel = decoder.readBit(contexts, contextLabel);
				row[j] = pixel;
			}
		}
		return bitmap;
	}
	function decodeRefinement(width, height, templateIndex, referenceBitmap, offsetX, offsetY, prediction, at, decodingContext) {
		var codingTemplate = RefinementTemplates[templateIndex].coding;
		if (templateIndex === 0) codingTemplate = codingTemplate.concat([at[0]]);
		var codingTemplateLength = codingTemplate.length;
		var codingTemplateX = new Int32Array(codingTemplateLength);
		var codingTemplateY = new Int32Array(codingTemplateLength);
		var k;
		for (k = 0; k < codingTemplateLength; k++) {
			codingTemplateX[k] = codingTemplate[k].x;
			codingTemplateY[k] = codingTemplate[k].y;
		}
		var referenceTemplate = RefinementTemplates[templateIndex].reference;
		if (templateIndex === 0) referenceTemplate = referenceTemplate.concat([at[1]]);
		var referenceTemplateLength = referenceTemplate.length;
		var referenceTemplateX = new Int32Array(referenceTemplateLength);
		var referenceTemplateY = new Int32Array(referenceTemplateLength);
		for (k = 0; k < referenceTemplateLength; k++) {
			referenceTemplateX[k] = referenceTemplate[k].x;
			referenceTemplateY[k] = referenceTemplate[k].y;
		}
		var referenceWidth = referenceBitmap[0].length;
		var referenceHeight = referenceBitmap.length;
		var pseudoPixelContext = RefinementReusedContexts[templateIndex];
		var bitmap = [];
		var decoder = decodingContext.decoder;
		var contexts = decodingContext.contextCache.getContexts("GR");
		var ltp = 0;
		for (var i = 0; i < height; i++) {
			if (prediction) {
				var sltp = decoder.readBit(contexts, pseudoPixelContext);
				ltp ^= sltp;
				if (ltp) throw new Jbig2Error("prediction is not supported");
			}
			var row = new Uint8Array(width);
			bitmap.push(row);
			for (var j = 0; j < width; j++) {
				var i0, j0;
				var contextLabel = 0;
				for (k = 0; k < codingTemplateLength; k++) {
					i0 = i + codingTemplateY[k];
					j0 = j + codingTemplateX[k];
					if (i0 < 0 || j0 < 0 || j0 >= width) contextLabel <<= 1;
					else contextLabel = contextLabel << 1 | bitmap[i0][j0];
				}
				for (k = 0; k < referenceTemplateLength; k++) {
					i0 = i + referenceTemplateY[k] - offsetY;
					j0 = j + referenceTemplateX[k] - offsetX;
					if (i0 < 0 || i0 >= referenceHeight || j0 < 0 || j0 >= referenceWidth) contextLabel <<= 1;
					else contextLabel = contextLabel << 1 | referenceBitmap[i0][j0];
				}
				var pixel = decoder.readBit(contexts, contextLabel);
				row[j] = pixel;
			}
		}
		return bitmap;
	}
	function decodeSymbolDictionary(huffman, refinement, symbols, numberOfNewSymbols, numberOfExportedSymbols, huffmanTables, templateIndex, at, refinementTemplateIndex, refinementAt, decodingContext, huffmanInput) {
		if (huffman && refinement) throw new Jbig2Error("symbol refinement with Huffman is not supported");
		var newSymbols = [];
		var currentHeight = 0;
		var symbolCodeLength = log2(symbols.length + numberOfNewSymbols);
		var decoder = decodingContext.decoder;
		var contextCache = decodingContext.contextCache;
		let tableB1, symbolWidths;
		if (huffman) {
			tableB1 = getStandardTable(1);
			symbolWidths = [];
			symbolCodeLength = Math.max(symbolCodeLength, 1);
		}
		while (newSymbols.length < numberOfNewSymbols) {
			var deltaHeight = huffman ? huffmanTables.tableDeltaHeight.decode(huffmanInput) : decodeInteger(contextCache, "IADH", decoder);
			currentHeight += deltaHeight;
			let currentWidth = 0, totalWidth = 0;
			const firstSymbol = huffman ? symbolWidths.length : 0;
			while (true) {
				var deltaWidth = huffman ? huffmanTables.tableDeltaWidth.decode(huffmanInput) : decodeInteger(contextCache, "IADW", decoder);
				if (deltaWidth === null) break;
				currentWidth += deltaWidth;
				totalWidth += currentWidth;
				var bitmap;
				if (refinement) {
					var numberOfInstances = decodeInteger(contextCache, "IAAI", decoder);
					if (numberOfInstances > 1) bitmap = decodeTextRegion(huffman, refinement, currentWidth, currentHeight, 0, numberOfInstances, 1, symbols.concat(newSymbols), symbolCodeLength, 0, 0, 1, 0, huffmanTables, refinementTemplateIndex, refinementAt, decodingContext, 0, huffmanInput);
					else {
						var symbolId = decodeIAID(contextCache, decoder, symbolCodeLength);
						var rdx = decodeInteger(contextCache, "IARDX", decoder);
						var rdy = decodeInteger(contextCache, "IARDY", decoder);
						var symbol = symbolId < symbols.length ? symbols[symbolId] : newSymbols[symbolId - symbols.length];
						bitmap = decodeRefinement(currentWidth, currentHeight, refinementTemplateIndex, symbol, rdx, rdy, false, refinementAt, decodingContext);
					}
					newSymbols.push(bitmap);
				} else if (huffman) symbolWidths.push(currentWidth);
				else {
					bitmap = decodeBitmap(false, currentWidth, currentHeight, templateIndex, false, null, at, decodingContext);
					newSymbols.push(bitmap);
				}
			}
			if (huffman && !refinement) {
				const bitmapSize = huffmanTables.tableBitmapSize.decode(huffmanInput);
				huffmanInput.byteAlign();
				let collectiveBitmap;
				if (bitmapSize === 0) collectiveBitmap = readUncompressedBitmap(huffmanInput, totalWidth, currentHeight);
				else {
					const originalEnd = huffmanInput.end;
					const bitmapEnd = huffmanInput.position + bitmapSize;
					huffmanInput.end = bitmapEnd;
					collectiveBitmap = decodeMMRBitmap(huffmanInput, totalWidth, currentHeight, false);
					huffmanInput.end = originalEnd;
					huffmanInput.position = bitmapEnd;
				}
				const numberOfSymbolsDecoded = symbolWidths.length;
				if (firstSymbol === numberOfSymbolsDecoded - 1) newSymbols.push(collectiveBitmap);
				else {
					let i, y, xMin = 0, xMax, bitmapWidth, symbolBitmap;
					for (i = firstSymbol; i < numberOfSymbolsDecoded; i++) {
						bitmapWidth = symbolWidths[i];
						xMax = xMin + bitmapWidth;
						symbolBitmap = [];
						for (y = 0; y < currentHeight; y++) symbolBitmap.push(collectiveBitmap[y].subarray(xMin, xMax));
						newSymbols.push(symbolBitmap);
						xMin = xMax;
					}
				}
			}
		}
		var exportedSymbols = [];
		var flags = [], currentFlag = false;
		var totalSymbolsLength = symbols.length + numberOfNewSymbols;
		while (flags.length < totalSymbolsLength) {
			var runLength = huffman ? tableB1.decode(huffmanInput) : decodeInteger(contextCache, "IAEX", decoder);
			while (runLength--) flags.push(currentFlag);
			currentFlag = !currentFlag;
		}
		for (var i = 0, ii = symbols.length; i < ii; i++) if (flags[i]) exportedSymbols.push(symbols[i]);
		for (var j = 0; j < numberOfNewSymbols; i++, j++) if (flags[i]) exportedSymbols.push(newSymbols[j]);
		return exportedSymbols;
	}
	function decodeTextRegion(huffman, refinement, width, height, defaultPixelValue, numberOfSymbolInstances, stripSize, inputSymbols, symbolCodeLength, transposed, dsOffset, referenceCorner, combinationOperator, huffmanTables, refinementTemplateIndex, refinementAt, decodingContext, logStripSize, huffmanInput) {
		if (huffman && refinement) throw new Jbig2Error("refinement with Huffman is not supported");
		var bitmap = [];
		var i, row;
		for (i = 0; i < height; i++) {
			row = new Uint8Array(width);
			if (defaultPixelValue) for (var j = 0; j < width; j++) row[j] = defaultPixelValue;
			bitmap.push(row);
		}
		var decoder = decodingContext.decoder;
		var contextCache = decodingContext.contextCache;
		var stripT = huffman ? -huffmanTables.tableDeltaT.decode(huffmanInput) : -decodeInteger(contextCache, "IADT", decoder);
		var firstS = 0;
		i = 0;
		while (i < numberOfSymbolInstances) {
			var deltaT = huffman ? huffmanTables.tableDeltaT.decode(huffmanInput) : decodeInteger(contextCache, "IADT", decoder);
			stripT += deltaT;
			var deltaFirstS = huffman ? huffmanTables.tableFirstS.decode(huffmanInput) : decodeInteger(contextCache, "IAFS", decoder);
			firstS += deltaFirstS;
			var currentS = firstS;
			do {
				let currentT = 0;
				if (stripSize > 1) currentT = huffman ? huffmanInput.readBits(logStripSize) : decodeInteger(contextCache, "IAIT", decoder);
				var t = stripSize * stripT + currentT;
				var symbolId = huffman ? huffmanTables.symbolIDTable.decode(huffmanInput) : decodeIAID(contextCache, decoder, symbolCodeLength);
				var applyRefinement = refinement && (huffman ? huffmanInput.readBit() : decodeInteger(contextCache, "IARI", decoder));
				var symbolBitmap = inputSymbols[symbolId];
				var symbolWidth = symbolBitmap[0].length;
				var symbolHeight = symbolBitmap.length;
				if (applyRefinement) {
					var rdw = decodeInteger(contextCache, "IARDW", decoder);
					var rdh = decodeInteger(contextCache, "IARDH", decoder);
					var rdx = decodeInteger(contextCache, "IARDX", decoder);
					var rdy = decodeInteger(contextCache, "IARDY", decoder);
					symbolWidth += rdw;
					symbolHeight += rdh;
					symbolBitmap = decodeRefinement(symbolWidth, symbolHeight, refinementTemplateIndex, symbolBitmap, (rdw >> 1) + rdx, (rdh >> 1) + rdy, false, refinementAt, decodingContext);
				}
				var offsetT = t - (referenceCorner & 1 ? 0 : symbolHeight - 1);
				var offsetS = currentS - (referenceCorner & 2 ? symbolWidth - 1 : 0);
				var s2, t2, symbolRow;
				if (transposed) {
					for (s2 = 0; s2 < symbolHeight; s2++) {
						row = bitmap[offsetS + s2];
						if (!row) continue;
						symbolRow = symbolBitmap[s2];
						var maxWidth = Math.min(width - offsetT, symbolWidth);
						switch (combinationOperator) {
							case 0:
								for (t2 = 0; t2 < maxWidth; t2++) row[offsetT + t2] |= symbolRow[t2];
								break;
							case 2:
								for (t2 = 0; t2 < maxWidth; t2++) row[offsetT + t2] ^= symbolRow[t2];
								break;
							default: throw new Jbig2Error(`operator ${combinationOperator} is not supported`);
						}
					}
					currentS += symbolHeight - 1;
				} else {
					for (t2 = 0; t2 < symbolHeight; t2++) {
						row = bitmap[offsetT + t2];
						if (!row) continue;
						symbolRow = symbolBitmap[t2];
						switch (combinationOperator) {
							case 0:
								for (s2 = 0; s2 < symbolWidth; s2++) row[offsetS + s2] |= symbolRow[s2];
								break;
							case 2:
								for (s2 = 0; s2 < symbolWidth; s2++) row[offsetS + s2] ^= symbolRow[s2];
								break;
							default: throw new Jbig2Error(`operator ${combinationOperator} is not supported`);
						}
					}
					currentS += symbolWidth - 1;
				}
				i++;
				var deltaS = huffman ? huffmanTables.tableDeltaS.decode(huffmanInput) : decodeInteger(contextCache, "IADS", decoder);
				if (deltaS === null) break;
				currentS += deltaS + dsOffset;
			} while (true);
		}
		return bitmap;
	}
	function decodePatternDictionary(mmr, patternWidth, patternHeight, maxPatternIndex, template, decodingContext) {
		const at = [];
		if (!mmr) {
			at.push({
				x: -patternWidth,
				y: 0
			});
			if (template === 0) {
				at.push({
					x: -3,
					y: -1
				});
				at.push({
					x: 2,
					y: -2
				});
				at.push({
					x: -2,
					y: -2
				});
			}
		}
		const collectiveBitmap = decodeBitmap(mmr, (maxPatternIndex + 1) * patternWidth, patternHeight, template, false, null, at, decodingContext);
		const patterns = [];
		for (let i = 0; i <= maxPatternIndex; i++) {
			const patternBitmap = [];
			const xMin = patternWidth * i;
			const xMax = xMin + patternWidth;
			for (let y = 0; y < patternHeight; y++) patternBitmap.push(collectiveBitmap[y].subarray(xMin, xMax));
			patterns.push(patternBitmap);
		}
		return patterns;
	}
	function decodeHalftoneRegion(mmr, patterns, template, regionWidth, regionHeight, defaultPixelValue, enableSkip, combinationOperator, gridWidth, gridHeight, gridOffsetX, gridOffsetY, gridVectorX, gridVectorY, decodingContext) {
		const skip = null;
		if (enableSkip) throw new Jbig2Error("skip is not supported");
		if (combinationOperator !== 0) throw new Jbig2Error("operator " + combinationOperator + " is not supported in halftone region");
		const regionBitmap = [];
		let i, j, row;
		for (i = 0; i < regionHeight; i++) {
			row = new Uint8Array(regionWidth);
			if (defaultPixelValue) for (j = 0; j < regionWidth; j++) row[j] = defaultPixelValue;
			regionBitmap.push(row);
		}
		const numberOfPatterns = patterns.length;
		const pattern0 = patterns[0];
		const patternWidth = pattern0[0].length, patternHeight = pattern0.length;
		const bitsPerValue = log2(numberOfPatterns);
		const at = [];
		if (!mmr) {
			at.push({
				x: template <= 1 ? 3 : 2,
				y: -1
			});
			if (template === 0) {
				at.push({
					x: -3,
					y: -1
				});
				at.push({
					x: 2,
					y: -2
				});
				at.push({
					x: -2,
					y: -2
				});
			}
		}
		const grayScaleBitPlanes = [];
		let mmrInput, bitmap;
		if (mmr) mmrInput = new Reader(decodingContext.data, decodingContext.start, decodingContext.end);
		for (i = bitsPerValue - 1; i >= 0; i--) {
			if (mmr) bitmap = decodeMMRBitmap(mmrInput, gridWidth, gridHeight, true);
			else bitmap = decodeBitmap(false, gridWidth, gridHeight, template, false, skip, at, decodingContext);
			grayScaleBitPlanes[i] = bitmap;
		}
		let mg, ng, bit, patternIndex, patternBitmap, x, y, patternRow, regionRow;
		for (mg = 0; mg < gridHeight; mg++) for (ng = 0; ng < gridWidth; ng++) {
			bit = 0;
			patternIndex = 0;
			for (j = bitsPerValue - 1; j >= 0; j--) {
				bit = grayScaleBitPlanes[j][mg][ng] ^ bit;
				patternIndex |= bit << j;
			}
			patternBitmap = patterns[patternIndex];
			x = gridOffsetX + mg * gridVectorY + ng * gridVectorX >> 8;
			y = gridOffsetY + mg * gridVectorX - ng * gridVectorY >> 8;
			if (x >= 0 && x + patternWidth <= regionWidth && y >= 0 && y + patternHeight <= regionHeight) for (i = 0; i < patternHeight; i++) {
				regionRow = regionBitmap[y + i];
				patternRow = patternBitmap[i];
				for (j = 0; j < patternWidth; j++) regionRow[x + j] |= patternRow[j];
			}
			else {
				let regionX, regionY;
				for (i = 0; i < patternHeight; i++) {
					regionY = y + i;
					if (regionY < 0 || regionY >= regionHeight) continue;
					regionRow = regionBitmap[regionY];
					patternRow = patternBitmap[i];
					for (j = 0; j < patternWidth; j++) {
						regionX = x + j;
						if (regionX >= 0 && regionX < regionWidth) regionRow[regionX] |= patternRow[j];
					}
				}
			}
		}
		return regionBitmap;
	}
	function readSegmentHeader(data, start) {
		var segmentHeader = {};
		segmentHeader.number = readUint32(data, start);
		var flags = data[start + 4];
		var segmentType = flags & 63;
		if (!SegmentTypes[segmentType]) throw new Jbig2Error("invalid segment type: " + segmentType);
		segmentHeader.type = segmentType;
		segmentHeader.typeName = SegmentTypes[segmentType];
		segmentHeader.deferredNonRetain = !!(flags & 128);
		var pageAssociationFieldSize = !!(flags & 64);
		var referredFlags = data[start + 5];
		var referredToCount = referredFlags >> 5 & 7;
		var retainBits = [referredFlags & 31];
		var position = start + 6;
		if (referredFlags === 7) {
			referredToCount = readUint32(data, position - 1) & 536870911;
			position += 3;
			var bytes = referredToCount + 7 >> 3;
			retainBits[0] = data[position++];
			while (--bytes > 0) retainBits.push(data[position++]);
		} else if (referredFlags === 5 || referredFlags === 6) throw new Jbig2Error("invalid referred-to flags");
		segmentHeader.retainBits = retainBits;
		let referredToSegmentNumberSize = 4;
		if (segmentHeader.number <= 256) referredToSegmentNumberSize = 1;
		else if (segmentHeader.number <= 65536) referredToSegmentNumberSize = 2;
		var referredTo = [];
		var i, ii;
		for (i = 0; i < referredToCount; i++) {
			let number;
			if (referredToSegmentNumberSize === 1) number = data[position];
			else if (referredToSegmentNumberSize === 2) number = readUint16(data, position);
			else number = readUint32(data, position);
			referredTo.push(number);
			position += referredToSegmentNumberSize;
		}
		segmentHeader.referredTo = referredTo;
		if (!pageAssociationFieldSize) segmentHeader.pageAssociation = data[position++];
		else {
			segmentHeader.pageAssociation = readUint32(data, position);
			position += 4;
		}
		segmentHeader.length = readUint32(data, position);
		position += 4;
		if (segmentHeader.length === 4294967295) if (segmentType === 38) {
			var genericRegionInfo = readRegionSegmentInformation(data, position);
			var genericRegionMmr = !!(data[position + RegionSegmentInformationFieldLength] & 1);
			var searchPatternLength = 6;
			var searchPattern = new Uint8Array(searchPatternLength);
			if (!genericRegionMmr) {
				searchPattern[0] = 255;
				searchPattern[1] = 172;
			}
			searchPattern[2] = genericRegionInfo.height >>> 24 & 255;
			searchPattern[3] = genericRegionInfo.height >> 16 & 255;
			searchPattern[4] = genericRegionInfo.height >> 8 & 255;
			searchPattern[5] = genericRegionInfo.height & 255;
			for (i = position, ii = data.length; i < ii; i++) {
				var j = 0;
				while (j < searchPatternLength && searchPattern[j] === data[i + j]) j++;
				if (j === searchPatternLength) {
					segmentHeader.length = i + searchPatternLength;
					break;
				}
			}
			if (segmentHeader.length === 4294967295) throw new Jbig2Error("segment end was not found");
		} else throw new Jbig2Error("invalid unknown segment length");
		segmentHeader.headerEnd = position;
		return segmentHeader;
	}
	function readSegments(header, data, start, end) {
		var segments = [];
		var position = start;
		while (position < end) {
			var segmentHeader = readSegmentHeader(data, position);
			position = segmentHeader.headerEnd;
			var segment = {
				header: segmentHeader,
				data
			};
			if (!header.randomAccess) {
				segment.start = position;
				position += segmentHeader.length;
				segment.end = position;
			}
			segments.push(segment);
			if (segmentHeader.type === 51) break;
		}
		if (header.randomAccess) for (var i = 0, ii = segments.length; i < ii; i++) {
			segments[i].start = position;
			position += segments[i].header.length;
			segments[i].end = position;
		}
		return segments;
	}
	function readRegionSegmentInformation(data, start) {
		return {
			width: readUint32(data, start),
			height: readUint32(data, start + 4),
			x: readUint32(data, start + 8),
			y: readUint32(data, start + 12),
			combinationOperator: data[start + 16] & 7
		};
	}
	var RegionSegmentInformationFieldLength = 17;
	function processSegment(segment, visitor) {
		var header = segment.header;
		var data = segment.data, position = segment.start, end = segment.end;
		var args, at, i, atLength;
		switch (header.type) {
			case 0:
				var dictionary = {};
				var dictionaryFlags = readUint16(data, position);
				dictionary.huffman = !!(dictionaryFlags & 1);
				dictionary.refinement = !!(dictionaryFlags & 2);
				dictionary.huffmanDHSelector = dictionaryFlags >> 2 & 3;
				dictionary.huffmanDWSelector = dictionaryFlags >> 4 & 3;
				dictionary.bitmapSizeSelector = dictionaryFlags >> 6 & 1;
				dictionary.aggregationInstancesSelector = dictionaryFlags >> 7 & 1;
				dictionary.bitmapCodingContextUsed = !!(dictionaryFlags & 256);
				dictionary.bitmapCodingContextRetained = !!(dictionaryFlags & 512);
				dictionary.template = dictionaryFlags >> 10 & 3;
				dictionary.refinementTemplate = dictionaryFlags >> 12 & 1;
				position += 2;
				if (!dictionary.huffman) {
					atLength = dictionary.template === 0 ? 4 : 1;
					at = [];
					for (i = 0; i < atLength; i++) {
						at.push({
							x: readInt8(data, position),
							y: readInt8(data, position + 1)
						});
						position += 2;
					}
					dictionary.at = at;
				}
				if (dictionary.refinement && !dictionary.refinementTemplate) {
					at = [];
					for (i = 0; i < 2; i++) {
						at.push({
							x: readInt8(data, position),
							y: readInt8(data, position + 1)
						});
						position += 2;
					}
					dictionary.refinementAt = at;
				}
				dictionary.numberOfExportedSymbols = readUint32(data, position);
				position += 4;
				dictionary.numberOfNewSymbols = readUint32(data, position);
				position += 4;
				args = [
					dictionary,
					header.number,
					header.referredTo,
					data,
					position,
					end
				];
				break;
			case 6:
			case 7:
				var textRegion = {};
				textRegion.info = readRegionSegmentInformation(data, position);
				position += RegionSegmentInformationFieldLength;
				var textRegionSegmentFlags = readUint16(data, position);
				position += 2;
				textRegion.huffman = !!(textRegionSegmentFlags & 1);
				textRegion.refinement = !!(textRegionSegmentFlags & 2);
				textRegion.logStripSize = textRegionSegmentFlags >> 2 & 3;
				textRegion.stripSize = 1 << textRegion.logStripSize;
				textRegion.referenceCorner = textRegionSegmentFlags >> 4 & 3;
				textRegion.transposed = !!(textRegionSegmentFlags & 64);
				textRegion.combinationOperator = textRegionSegmentFlags >> 7 & 3;
				textRegion.defaultPixelValue = textRegionSegmentFlags >> 9 & 1;
				textRegion.dsOffset = textRegionSegmentFlags << 17 >> 27;
				textRegion.refinementTemplate = textRegionSegmentFlags >> 15 & 1;
				if (textRegion.huffman) {
					var textRegionHuffmanFlags = readUint16(data, position);
					position += 2;
					textRegion.huffmanFS = textRegionHuffmanFlags & 3;
					textRegion.huffmanDS = textRegionHuffmanFlags >> 2 & 3;
					textRegion.huffmanDT = textRegionHuffmanFlags >> 4 & 3;
					textRegion.huffmanRefinementDW = textRegionHuffmanFlags >> 6 & 3;
					textRegion.huffmanRefinementDH = textRegionHuffmanFlags >> 8 & 3;
					textRegion.huffmanRefinementDX = textRegionHuffmanFlags >> 10 & 3;
					textRegion.huffmanRefinementDY = textRegionHuffmanFlags >> 12 & 3;
					textRegion.huffmanRefinementSizeSelector = !!(textRegionHuffmanFlags & 16384);
				}
				if (textRegion.refinement && !textRegion.refinementTemplate) {
					at = [];
					for (i = 0; i < 2; i++) {
						at.push({
							x: readInt8(data, position),
							y: readInt8(data, position + 1)
						});
						position += 2;
					}
					textRegion.refinementAt = at;
				}
				textRegion.numberOfSymbolInstances = readUint32(data, position);
				position += 4;
				args = [
					textRegion,
					header.referredTo,
					data,
					position,
					end
				];
				break;
			case 16:
				const patternDictionary = {};
				const patternDictionaryFlags = data[position++];
				patternDictionary.mmr = !!(patternDictionaryFlags & 1);
				patternDictionary.template = patternDictionaryFlags >> 1 & 3;
				patternDictionary.patternWidth = data[position++];
				patternDictionary.patternHeight = data[position++];
				patternDictionary.maxPatternIndex = readUint32(data, position);
				position += 4;
				args = [
					patternDictionary,
					header.number,
					data,
					position,
					end
				];
				break;
			case 22:
			case 23:
				const halftoneRegion = {};
				halftoneRegion.info = readRegionSegmentInformation(data, position);
				position += RegionSegmentInformationFieldLength;
				const halftoneRegionFlags = data[position++];
				halftoneRegion.mmr = !!(halftoneRegionFlags & 1);
				halftoneRegion.template = halftoneRegionFlags >> 1 & 3;
				halftoneRegion.enableSkip = !!(halftoneRegionFlags & 8);
				halftoneRegion.combinationOperator = halftoneRegionFlags >> 4 & 7;
				halftoneRegion.defaultPixelValue = halftoneRegionFlags >> 7 & 1;
				halftoneRegion.gridWidth = readUint32(data, position);
				position += 4;
				halftoneRegion.gridHeight = readUint32(data, position);
				position += 4;
				halftoneRegion.gridOffsetX = readUint32(data, position) & 4294967295;
				position += 4;
				halftoneRegion.gridOffsetY = readUint32(data, position) & 4294967295;
				position += 4;
				halftoneRegion.gridVectorX = readUint16(data, position);
				position += 2;
				halftoneRegion.gridVectorY = readUint16(data, position);
				position += 2;
				args = [
					halftoneRegion,
					header.referredTo,
					data,
					position,
					end
				];
				break;
			case 38:
			case 39:
				var genericRegion = {};
				genericRegion.info = readRegionSegmentInformation(data, position);
				position += RegionSegmentInformationFieldLength;
				var genericRegionSegmentFlags = data[position++];
				genericRegion.mmr = !!(genericRegionSegmentFlags & 1);
				genericRegion.template = genericRegionSegmentFlags >> 1 & 3;
				genericRegion.prediction = !!(genericRegionSegmentFlags & 8);
				if (!genericRegion.mmr) {
					atLength = genericRegion.template === 0 ? 4 : 1;
					at = [];
					for (i = 0; i < atLength; i++) {
						at.push({
							x: readInt8(data, position),
							y: readInt8(data, position + 1)
						});
						position += 2;
					}
					genericRegion.at = at;
				}
				args = [
					genericRegion,
					data,
					position,
					end
				];
				break;
			case 48:
				var pageInfo = {
					width: readUint32(data, position),
					height: readUint32(data, position + 4),
					resolutionX: readUint32(data, position + 8),
					resolutionY: readUint32(data, position + 12)
				};
				if (pageInfo.height === 4294967295) delete pageInfo.height;
				var pageSegmentFlags = data[position + 16];
				readUint16(data, position + 17);
				pageInfo.lossless = !!(pageSegmentFlags & 1);
				pageInfo.refinement = !!(pageSegmentFlags & 2);
				pageInfo.defaultPixelValue = pageSegmentFlags >> 2 & 1;
				pageInfo.combinationOperator = pageSegmentFlags >> 3 & 3;
				pageInfo.requiresBuffer = !!(pageSegmentFlags & 32);
				pageInfo.combinationOperatorOverride = !!(pageSegmentFlags & 64);
				args = [pageInfo];
				break;
			case 49: break;
			case 50: break;
			case 51: break;
			case 53:
				args = [
					header.number,
					data,
					position,
					end
				];
				break;
			case 62: break;
			default: throw new Jbig2Error(`segment type ${header.typeName}(${header.type}) is not implemented`);
		}
		var callbackName = "on" + header.typeName;
		if (callbackName in visitor) visitor[callbackName].apply(visitor, args);
	}
	function processSegments(segments, visitor) {
		for (var i = 0, ii = segments.length; i < ii; i++) processSegment(segments[i], visitor);
	}
	function parseJbig2Chunks(chunks) {
		var visitor = new SimpleSegmentVisitor();
		for (var i = 0, ii = chunks.length; i < ii; i++) {
			var chunk = chunks[i];
			processSegments(readSegments({}, chunk.data, chunk.start, chunk.end), visitor);
		}
		return visitor.buffer;
	}
	function parseJbig2(data) {
		const end = data.length;
		let position = 0;
		if (data[position] !== 151 || data[position + 1] !== 74 || data[position + 2] !== 66 || data[position + 3] !== 50 || data[position + 4] !== 13 || data[position + 5] !== 10 || data[position + 6] !== 26 || data[position + 7] !== 10) throw new Jbig2Error("parseJbig2 - invalid header.");
		const header = Object.create(null);
		position += 8;
		const flags = data[position++];
		header.randomAccess = !(flags & 1);
		if (!(flags & 2)) {
			header.numberOfPages = readUint32(data, position);
			position += 4;
		}
		const segments = readSegments(header, data, position, end);
		const visitor = new SimpleSegmentVisitor();
		processSegments(segments, visitor);
		const { width, height } = visitor.currentPageInfo;
		const bitPacked = visitor.buffer;
		const imgData = new Uint8ClampedArray(width * height);
		let q = 0, k = 0;
		for (let i = 0; i < height; i++) {
			let mask = 0, buffer;
			for (let j = 0; j < width; j++) {
				if (!mask) {
					mask = 128;
					buffer = bitPacked[k++];
				}
				imgData[q++] = buffer & mask ? 0 : 255;
				mask >>= 1;
			}
		}
		return {
			imgData,
			width,
			height
		};
	}
	function SimpleSegmentVisitor() {}
	SimpleSegmentVisitor.prototype = {
		onPageInformation: function SimpleSegmentVisitor_onPageInformation(info) {
			this.currentPageInfo = info;
			var rowSize = info.width + 7 >> 3;
			var buffer = new Uint8ClampedArray(rowSize * info.height);
			if (info.defaultPixelValue) for (var i = 0, ii = buffer.length; i < ii; i++) buffer[i] = 255;
			this.buffer = buffer;
		},
		drawBitmap: function SimpleSegmentVisitor_drawBitmap(regionInfo, bitmap) {
			var pageInfo = this.currentPageInfo;
			var width = regionInfo.width, height = regionInfo.height;
			var rowSize = pageInfo.width + 7 >> 3;
			var combinationOperator = pageInfo.combinationOperatorOverride ? regionInfo.combinationOperator : pageInfo.combinationOperator;
			var buffer = this.buffer;
			var mask0 = 128 >> (regionInfo.x & 7);
			var offset0 = regionInfo.y * rowSize + (regionInfo.x >> 3);
			var i, j, mask, offset;
			switch (combinationOperator) {
				case 0:
					for (i = 0; i < height; i++) {
						mask = mask0;
						offset = offset0;
						for (j = 0; j < width; j++) {
							if (bitmap[i][j]) buffer[offset] |= mask;
							mask >>= 1;
							if (!mask) {
								mask = 128;
								offset++;
							}
						}
						offset0 += rowSize;
					}
					break;
				case 2:
					for (i = 0; i < height; i++) {
						mask = mask0;
						offset = offset0;
						for (j = 0; j < width; j++) {
							if (bitmap[i][j]) buffer[offset] ^= mask;
							mask >>= 1;
							if (!mask) {
								mask = 128;
								offset++;
							}
						}
						offset0 += rowSize;
					}
					break;
				default: throw new Jbig2Error(`operator ${combinationOperator} is not supported`);
			}
		},
		onImmediateGenericRegion: function SimpleSegmentVisitor_onImmediateGenericRegion(region, data, start, end) {
			var regionInfo = region.info;
			var decodingContext = new DecodingContext(data, start, end);
			var bitmap = decodeBitmap(region.mmr, regionInfo.width, regionInfo.height, region.template, region.prediction, null, region.at, decodingContext);
			this.drawBitmap(regionInfo, bitmap);
		},
		onImmediateLosslessGenericRegion: function SimpleSegmentVisitor_onImmediateLosslessGenericRegion() {
			this.onImmediateGenericRegion.apply(this, arguments);
		},
		onSymbolDictionary: function SimpleSegmentVisitor_onSymbolDictionary(dictionary, currentSegment, referredSegments, data, start, end) {
			let huffmanTables, huffmanInput;
			if (dictionary.huffman) {
				huffmanTables = getSymbolDictionaryHuffmanTables(dictionary, referredSegments, this.customTables);
				huffmanInput = new Reader(data, start, end);
			}
			var symbols = this.symbols;
			if (!symbols) this.symbols = symbols = {};
			var inputSymbols = [];
			for (var i = 0, ii = referredSegments.length; i < ii; i++) {
				const referredSymbols = symbols[referredSegments[i]];
				if (referredSymbols) inputSymbols = inputSymbols.concat(referredSymbols);
			}
			var decodingContext = new DecodingContext(data, start, end);
			symbols[currentSegment] = decodeSymbolDictionary(dictionary.huffman, dictionary.refinement, inputSymbols, dictionary.numberOfNewSymbols, dictionary.numberOfExportedSymbols, huffmanTables, dictionary.template, dictionary.at, dictionary.refinementTemplate, dictionary.refinementAt, decodingContext, huffmanInput);
		},
		onImmediateTextRegion: function SimpleSegmentVisitor_onImmediateTextRegion(region, referredSegments, data, start, end) {
			var regionInfo = region.info;
			let huffmanTables, huffmanInput;
			var symbols = this.symbols;
			var inputSymbols = [];
			for (var i = 0, ii = referredSegments.length; i < ii; i++) {
				const referredSymbols = symbols[referredSegments[i]];
				if (referredSymbols) inputSymbols = inputSymbols.concat(referredSymbols);
			}
			var symbolCodeLength = log2(inputSymbols.length);
			if (region.huffman) {
				huffmanInput = new Reader(data, start, end);
				huffmanTables = getTextRegionHuffmanTables(region, referredSegments, this.customTables, inputSymbols.length, huffmanInput);
			}
			var decodingContext = new DecodingContext(data, start, end);
			var bitmap = decodeTextRegion(region.huffman, region.refinement, regionInfo.width, regionInfo.height, region.defaultPixelValue, region.numberOfSymbolInstances, region.stripSize, inputSymbols, symbolCodeLength, region.transposed, region.dsOffset, region.referenceCorner, region.combinationOperator, huffmanTables, region.refinementTemplate, region.refinementAt, decodingContext, region.logStripSize, huffmanInput);
			this.drawBitmap(regionInfo, bitmap);
		},
		onImmediateLosslessTextRegion: function SimpleSegmentVisitor_onImmediateLosslessTextRegion() {
			this.onImmediateTextRegion.apply(this, arguments);
		},
		onPatternDictionary(dictionary, currentSegment, data, start, end) {
			let patterns = this.patterns;
			if (!patterns) this.patterns = patterns = {};
			const decodingContext = new DecodingContext(data, start, end);
			patterns[currentSegment] = decodePatternDictionary(dictionary.mmr, dictionary.patternWidth, dictionary.patternHeight, dictionary.maxPatternIndex, dictionary.template, decodingContext);
		},
		onImmediateHalftoneRegion(region, referredSegments, data, start, end) {
			const patterns = this.patterns[referredSegments[0]];
			const regionInfo = region.info;
			const decodingContext = new DecodingContext(data, start, end);
			const bitmap = decodeHalftoneRegion(region.mmr, patterns, region.template, regionInfo.width, regionInfo.height, region.defaultPixelValue, region.enableSkip, region.combinationOperator, region.gridWidth, region.gridHeight, region.gridOffsetX, region.gridOffsetY, region.gridVectorX, region.gridVectorY, decodingContext);
			this.drawBitmap(regionInfo, bitmap);
		},
		onImmediateLosslessHalftoneRegion() {
			this.onImmediateHalftoneRegion.apply(this, arguments);
		},
		onTables(currentSegment, data, start, end) {
			let customTables = this.customTables;
			if (!customTables) this.customTables = customTables = {};
			customTables[currentSegment] = decodeTablesSegment(data, start, end);
		}
	};
	function HuffmanLine(lineData) {
		if (lineData.length === 2) {
			this.isOOB = true;
			this.rangeLow = 0;
			this.prefixLength = lineData[0];
			this.rangeLength = 0;
			this.prefixCode = lineData[1];
			this.isLowerRange = false;
		} else {
			this.isOOB = false;
			this.rangeLow = lineData[0];
			this.prefixLength = lineData[1];
			this.rangeLength = lineData[2];
			this.prefixCode = lineData[3];
			this.isLowerRange = lineData[4] === "lower";
		}
	}
	function HuffmanTreeNode(line) {
		this.children = [];
		if (line) {
			this.isLeaf = true;
			this.rangeLength = line.rangeLength;
			this.rangeLow = line.rangeLow;
			this.isLowerRange = line.isLowerRange;
			this.isOOB = line.isOOB;
		} else this.isLeaf = false;
	}
	HuffmanTreeNode.prototype = {
		buildTree(line, shift) {
			const bit = line.prefixCode >> shift & 1;
			if (shift <= 0) this.children[bit] = new HuffmanTreeNode(line);
			else {
				let node = this.children[bit];
				if (!node) this.children[bit] = node = new HuffmanTreeNode(null);
				node.buildTree(line, shift - 1);
			}
		},
		decodeNode(reader) {
			if (this.isLeaf) {
				if (this.isOOB) return null;
				const htOffset = reader.readBits(this.rangeLength);
				return this.rangeLow + (this.isLowerRange ? -htOffset : htOffset);
			}
			const node = this.children[reader.readBit()];
			if (!node) throw new Jbig2Error("invalid Huffman data");
			return node.decodeNode(reader);
		}
	};
	function HuffmanTable(lines, prefixCodesDone) {
		if (!prefixCodesDone) this.assignPrefixCodes(lines);
		this.rootNode = new HuffmanTreeNode(null);
		for (let i = 0, ii = lines.length; i < ii; i++) {
			const line = lines[i];
			if (line.prefixLength > 0) this.rootNode.buildTree(line, line.prefixLength - 1);
		}
	}
	HuffmanTable.prototype = {
		decode(reader) {
			return this.rootNode.decodeNode(reader);
		},
		assignPrefixCodes(lines) {
			const linesLength = lines.length;
			let prefixLengthMax = 0;
			for (let i = 0; i < linesLength; i++) prefixLengthMax = Math.max(prefixLengthMax, lines[i].prefixLength);
			const histogram = new Uint32Array(prefixLengthMax + 1);
			for (let i = 0; i < linesLength; i++) histogram[lines[i].prefixLength]++;
			let currentLength = 1, firstCode = 0, currentCode, currentTemp, line;
			histogram[0] = 0;
			while (currentLength <= prefixLengthMax) {
				firstCode = firstCode + histogram[currentLength - 1] << 1;
				currentCode = firstCode;
				currentTemp = 0;
				while (currentTemp < linesLength) {
					line = lines[currentTemp];
					if (line.prefixLength === currentLength) {
						line.prefixCode = currentCode;
						currentCode++;
					}
					currentTemp++;
				}
				currentLength++;
			}
		}
	};
	function decodeTablesSegment(data, start, end) {
		const flags = data[start];
		const lowestValue = readUint32(data, start + 1) & 4294967295;
		const highestValue = readUint32(data, start + 5) & 4294967295;
		const reader = new Reader(data, start + 9, end);
		const prefixSizeBits = (flags >> 1 & 7) + 1;
		const rangeSizeBits = (flags >> 4 & 7) + 1;
		const lines = [];
		let prefixLength, rangeLength, currentRangeLow = lowestValue;
		do {
			prefixLength = reader.readBits(prefixSizeBits);
			rangeLength = reader.readBits(rangeSizeBits);
			lines.push(new HuffmanLine([
				currentRangeLow,
				prefixLength,
				rangeLength,
				0
			]));
			currentRangeLow += 1 << rangeLength;
		} while (currentRangeLow < highestValue);
		prefixLength = reader.readBits(prefixSizeBits);
		lines.push(new HuffmanLine([
			lowestValue - 1,
			prefixLength,
			32,
			0,
			"lower"
		]));
		prefixLength = reader.readBits(prefixSizeBits);
		lines.push(new HuffmanLine([
			highestValue,
			prefixLength,
			32,
			0
		]));
		if (flags & 1) {
			prefixLength = reader.readBits(prefixSizeBits);
			lines.push(new HuffmanLine([prefixLength, 0]));
		}
		return new HuffmanTable(lines, false);
	}
	const standardTablesCache = {};
	function getStandardTable(number) {
		let table = standardTablesCache[number];
		if (table) return table;
		let lines;
		switch (number) {
			case 1:
				lines = [
					[
						0,
						1,
						4,
						0
					],
					[
						16,
						2,
						8,
						2
					],
					[
						272,
						3,
						16,
						6
					],
					[
						65808,
						3,
						32,
						7
					]
				];
				break;
			case 2:
				lines = [
					[
						0,
						1,
						0,
						0
					],
					[
						1,
						2,
						0,
						2
					],
					[
						2,
						3,
						0,
						6
					],
					[
						3,
						4,
						3,
						14
					],
					[
						11,
						5,
						6,
						30
					],
					[
						75,
						6,
						32,
						62
					],
					[6, 63]
				];
				break;
			case 3:
				lines = [
					[
						-256,
						8,
						8,
						254
					],
					[
						0,
						1,
						0,
						0
					],
					[
						1,
						2,
						0,
						2
					],
					[
						2,
						3,
						0,
						6
					],
					[
						3,
						4,
						3,
						14
					],
					[
						11,
						5,
						6,
						30
					],
					[
						-257,
						8,
						32,
						255,
						"lower"
					],
					[
						75,
						7,
						32,
						126
					],
					[6, 62]
				];
				break;
			case 4:
				lines = [
					[
						1,
						1,
						0,
						0
					],
					[
						2,
						2,
						0,
						2
					],
					[
						3,
						3,
						0,
						6
					],
					[
						4,
						4,
						3,
						14
					],
					[
						12,
						5,
						6,
						30
					],
					[
						76,
						5,
						32,
						31
					]
				];
				break;
			case 5:
				lines = [
					[
						-255,
						7,
						8,
						126
					],
					[
						1,
						1,
						0,
						0
					],
					[
						2,
						2,
						0,
						2
					],
					[
						3,
						3,
						0,
						6
					],
					[
						4,
						4,
						3,
						14
					],
					[
						12,
						5,
						6,
						30
					],
					[
						-256,
						7,
						32,
						127,
						"lower"
					],
					[
						76,
						6,
						32,
						62
					]
				];
				break;
			case 6:
				lines = [
					[
						-2048,
						5,
						10,
						28
					],
					[
						-1024,
						4,
						9,
						8
					],
					[
						-512,
						4,
						8,
						9
					],
					[
						-256,
						4,
						7,
						10
					],
					[
						-128,
						5,
						6,
						29
					],
					[
						-64,
						5,
						5,
						30
					],
					[
						-32,
						4,
						5,
						11
					],
					[
						0,
						2,
						7,
						0
					],
					[
						128,
						3,
						7,
						2
					],
					[
						256,
						3,
						8,
						3
					],
					[
						512,
						4,
						9,
						12
					],
					[
						1024,
						4,
						10,
						13
					],
					[
						-2049,
						6,
						32,
						62,
						"lower"
					],
					[
						2048,
						6,
						32,
						63
					]
				];
				break;
			case 7:
				lines = [
					[
						-1024,
						4,
						9,
						8
					],
					[
						-512,
						3,
						8,
						0
					],
					[
						-256,
						4,
						7,
						9
					],
					[
						-128,
						5,
						6,
						26
					],
					[
						-64,
						5,
						5,
						27
					],
					[
						-32,
						4,
						5,
						10
					],
					[
						0,
						4,
						5,
						11
					],
					[
						32,
						5,
						5,
						28
					],
					[
						64,
						5,
						6,
						29
					],
					[
						128,
						4,
						7,
						12
					],
					[
						256,
						3,
						8,
						1
					],
					[
						512,
						3,
						9,
						2
					],
					[
						1024,
						3,
						10,
						3
					],
					[
						-1025,
						5,
						32,
						30,
						"lower"
					],
					[
						2048,
						5,
						32,
						31
					]
				];
				break;
			case 8:
				lines = [
					[
						-15,
						8,
						3,
						252
					],
					[
						-7,
						9,
						1,
						508
					],
					[
						-5,
						8,
						1,
						253
					],
					[
						-3,
						9,
						0,
						509
					],
					[
						-2,
						7,
						0,
						124
					],
					[
						-1,
						4,
						0,
						10
					],
					[
						0,
						2,
						1,
						0
					],
					[
						2,
						5,
						0,
						26
					],
					[
						3,
						6,
						0,
						58
					],
					[
						4,
						3,
						4,
						4
					],
					[
						20,
						6,
						1,
						59
					],
					[
						22,
						4,
						4,
						11
					],
					[
						38,
						4,
						5,
						12
					],
					[
						70,
						5,
						6,
						27
					],
					[
						134,
						5,
						7,
						28
					],
					[
						262,
						6,
						7,
						60
					],
					[
						390,
						7,
						8,
						125
					],
					[
						646,
						6,
						10,
						61
					],
					[
						-16,
						9,
						32,
						510,
						"lower"
					],
					[
						1670,
						9,
						32,
						511
					],
					[2, 1]
				];
				break;
			case 9:
				lines = [
					[
						-31,
						8,
						4,
						252
					],
					[
						-15,
						9,
						2,
						508
					],
					[
						-11,
						8,
						2,
						253
					],
					[
						-7,
						9,
						1,
						509
					],
					[
						-5,
						7,
						1,
						124
					],
					[
						-3,
						4,
						1,
						10
					],
					[
						-1,
						3,
						1,
						2
					],
					[
						1,
						3,
						1,
						3
					],
					[
						3,
						5,
						1,
						26
					],
					[
						5,
						6,
						1,
						58
					],
					[
						7,
						3,
						5,
						4
					],
					[
						39,
						6,
						2,
						59
					],
					[
						43,
						4,
						5,
						11
					],
					[
						75,
						4,
						6,
						12
					],
					[
						139,
						5,
						7,
						27
					],
					[
						267,
						5,
						8,
						28
					],
					[
						523,
						6,
						8,
						60
					],
					[
						779,
						7,
						9,
						125
					],
					[
						1291,
						6,
						11,
						61
					],
					[
						-32,
						9,
						32,
						510,
						"lower"
					],
					[
						3339,
						9,
						32,
						511
					],
					[2, 0]
				];
				break;
			case 10:
				lines = [
					[
						-21,
						7,
						4,
						122
					],
					[
						-5,
						8,
						0,
						252
					],
					[
						-4,
						7,
						0,
						123
					],
					[
						-3,
						5,
						0,
						24
					],
					[
						-2,
						2,
						2,
						0
					],
					[
						2,
						5,
						0,
						25
					],
					[
						3,
						6,
						0,
						54
					],
					[
						4,
						7,
						0,
						124
					],
					[
						5,
						8,
						0,
						253
					],
					[
						6,
						2,
						6,
						1
					],
					[
						70,
						5,
						5,
						26
					],
					[
						102,
						6,
						5,
						55
					],
					[
						134,
						6,
						6,
						56
					],
					[
						198,
						6,
						7,
						57
					],
					[
						326,
						6,
						8,
						58
					],
					[
						582,
						6,
						9,
						59
					],
					[
						1094,
						6,
						10,
						60
					],
					[
						2118,
						7,
						11,
						125
					],
					[
						-22,
						8,
						32,
						254,
						"lower"
					],
					[
						4166,
						8,
						32,
						255
					],
					[2, 2]
				];
				break;
			case 11:
				lines = [
					[
						1,
						1,
						0,
						0
					],
					[
						2,
						2,
						1,
						2
					],
					[
						4,
						4,
						0,
						12
					],
					[
						5,
						4,
						1,
						13
					],
					[
						7,
						5,
						1,
						28
					],
					[
						9,
						5,
						2,
						29
					],
					[
						13,
						6,
						2,
						60
					],
					[
						17,
						7,
						2,
						122
					],
					[
						21,
						7,
						3,
						123
					],
					[
						29,
						7,
						4,
						124
					],
					[
						45,
						7,
						5,
						125
					],
					[
						77,
						7,
						6,
						126
					],
					[
						141,
						7,
						32,
						127
					]
				];
				break;
			case 12:
				lines = [
					[
						1,
						1,
						0,
						0
					],
					[
						2,
						2,
						0,
						2
					],
					[
						3,
						3,
						1,
						6
					],
					[
						5,
						5,
						0,
						28
					],
					[
						6,
						5,
						1,
						29
					],
					[
						8,
						6,
						1,
						60
					],
					[
						10,
						7,
						0,
						122
					],
					[
						11,
						7,
						1,
						123
					],
					[
						13,
						7,
						2,
						124
					],
					[
						17,
						7,
						3,
						125
					],
					[
						25,
						7,
						4,
						126
					],
					[
						41,
						8,
						5,
						254
					],
					[
						73,
						8,
						32,
						255
					]
				];
				break;
			case 13:
				lines = [
					[
						1,
						1,
						0,
						0
					],
					[
						2,
						3,
						0,
						4
					],
					[
						3,
						4,
						0,
						12
					],
					[
						4,
						5,
						0,
						28
					],
					[
						5,
						4,
						1,
						13
					],
					[
						7,
						3,
						3,
						5
					],
					[
						15,
						6,
						1,
						58
					],
					[
						17,
						6,
						2,
						59
					],
					[
						21,
						6,
						3,
						60
					],
					[
						29,
						6,
						4,
						61
					],
					[
						45,
						6,
						5,
						62
					],
					[
						77,
						7,
						6,
						126
					],
					[
						141,
						7,
						32,
						127
					]
				];
				break;
			case 14:
				lines = [
					[
						-2,
						3,
						0,
						4
					],
					[
						-1,
						3,
						0,
						5
					],
					[
						0,
						1,
						0,
						0
					],
					[
						1,
						3,
						0,
						6
					],
					[
						2,
						3,
						0,
						7
					]
				];
				break;
			case 15:
				lines = [
					[
						-24,
						7,
						4,
						124
					],
					[
						-8,
						6,
						2,
						60
					],
					[
						-4,
						5,
						1,
						28
					],
					[
						-2,
						4,
						0,
						12
					],
					[
						-1,
						3,
						0,
						4
					],
					[
						0,
						1,
						0,
						0
					],
					[
						1,
						3,
						0,
						5
					],
					[
						2,
						4,
						0,
						13
					],
					[
						3,
						5,
						1,
						29
					],
					[
						5,
						6,
						2,
						61
					],
					[
						9,
						7,
						4,
						125
					],
					[
						-25,
						7,
						32,
						126,
						"lower"
					],
					[
						25,
						7,
						32,
						127
					]
				];
				break;
			default: throw new Jbig2Error(`standard table B.${number} does not exist`);
		}
		for (let i = 0, ii = lines.length; i < ii; i++) lines[i] = new HuffmanLine(lines[i]);
		table = new HuffmanTable(lines, true);
		standardTablesCache[number] = table;
		return table;
	}
	function Reader(data, start, end) {
		this.data = data;
		this.start = start;
		this.end = end;
		this.position = start;
		this.shift = -1;
		this.currentByte = 0;
	}
	Reader.prototype = {
		readBit() {
			if (this.shift < 0) {
				if (this.position >= this.end) throw new Jbig2Error("end of data while reading bit");
				this.currentByte = this.data[this.position++];
				this.shift = 7;
			}
			const bit = this.currentByte >> this.shift & 1;
			this.shift--;
			return bit;
		},
		readBits(numBits) {
			let result = 0, i;
			for (i = numBits - 1; i >= 0; i--) result |= this.readBit() << i;
			return result;
		},
		byteAlign() {
			this.shift = -1;
		},
		next() {
			if (this.position >= this.end) return -1;
			return this.data[this.position++];
		}
	};
	function getCustomHuffmanTable(index, referredTo, customTables) {
		let currentIndex = 0;
		for (let i = 0, ii = referredTo.length; i < ii; i++) {
			const table = customTables[referredTo[i]];
			if (table) {
				if (index === currentIndex) return table;
				currentIndex++;
			}
		}
		throw new Jbig2Error("can't find custom Huffman table");
	}
	function getTextRegionHuffmanTables(textRegion, referredTo, customTables, numberOfSymbols, reader) {
		const codes = [];
		for (let i = 0; i <= 34; i++) {
			const codeLength = reader.readBits(4);
			codes.push(new HuffmanLine([
				i,
				codeLength,
				0,
				0
			]));
		}
		const runCodesTable = new HuffmanTable(codes, false);
		codes.length = 0;
		for (let i = 0; i < numberOfSymbols;) {
			const codeLength = runCodesTable.decode(reader);
			if (codeLength >= 32) {
				let repeatedLength, numberOfRepeats, j;
				switch (codeLength) {
					case 32:
						if (i === 0) throw new Jbig2Error("no previous value in symbol ID table");
						numberOfRepeats = reader.readBits(2) + 3;
						repeatedLength = codes[i - 1].prefixLength;
						break;
					case 33:
						numberOfRepeats = reader.readBits(3) + 3;
						repeatedLength = 0;
						break;
					case 34:
						numberOfRepeats = reader.readBits(7) + 11;
						repeatedLength = 0;
						break;
					default: throw new Jbig2Error("invalid code length in symbol ID table");
				}
				for (j = 0; j < numberOfRepeats; j++) {
					codes.push(new HuffmanLine([
						i,
						repeatedLength,
						0,
						0
					]));
					i++;
				}
			} else {
				codes.push(new HuffmanLine([
					i,
					codeLength,
					0,
					0
				]));
				i++;
			}
		}
		reader.byteAlign();
		const symbolIDTable = new HuffmanTable(codes, false);
		let customIndex = 0, tableFirstS, tableDeltaS, tableDeltaT;
		switch (textRegion.huffmanFS) {
			case 0:
			case 1:
				tableFirstS = getStandardTable(textRegion.huffmanFS + 6);
				break;
			case 3:
				tableFirstS = getCustomHuffmanTable(customIndex, referredTo, customTables);
				customIndex++;
				break;
			default: throw new Jbig2Error("invalid Huffman FS selector");
		}
		switch (textRegion.huffmanDS) {
			case 0:
			case 1:
			case 2:
				tableDeltaS = getStandardTable(textRegion.huffmanDS + 8);
				break;
			case 3:
				tableDeltaS = getCustomHuffmanTable(customIndex, referredTo, customTables);
				customIndex++;
				break;
			default: throw new Jbig2Error("invalid Huffman DS selector");
		}
		switch (textRegion.huffmanDT) {
			case 0:
			case 1:
			case 2:
				tableDeltaT = getStandardTable(textRegion.huffmanDT + 11);
				break;
			case 3:
				tableDeltaT = getCustomHuffmanTable(customIndex, referredTo, customTables);
				customIndex++;
				break;
			default: throw new Jbig2Error("invalid Huffman DT selector");
		}
		if (textRegion.refinement) throw new Jbig2Error("refinement with Huffman is not supported");
		return {
			symbolIDTable,
			tableFirstS,
			tableDeltaS,
			tableDeltaT
		};
	}
	function getSymbolDictionaryHuffmanTables(dictionary, referredTo, customTables) {
		let customIndex = 0, tableDeltaHeight, tableDeltaWidth;
		switch (dictionary.huffmanDHSelector) {
			case 0:
			case 1:
				tableDeltaHeight = getStandardTable(dictionary.huffmanDHSelector + 4);
				break;
			case 3:
				tableDeltaHeight = getCustomHuffmanTable(customIndex, referredTo, customTables);
				customIndex++;
				break;
			default: throw new Jbig2Error("invalid Huffman DH selector");
		}
		switch (dictionary.huffmanDWSelector) {
			case 0:
			case 1:
				tableDeltaWidth = getStandardTable(dictionary.huffmanDWSelector + 2);
				break;
			case 3:
				tableDeltaWidth = getCustomHuffmanTable(customIndex, referredTo, customTables);
				customIndex++;
				break;
			default: throw new Jbig2Error("invalid Huffman DW selector");
		}
		let tableBitmapSize, tableAggregateInstances;
		if (dictionary.bitmapSizeSelector) {
			tableBitmapSize = getCustomHuffmanTable(customIndex, referredTo, customTables);
			customIndex++;
		} else tableBitmapSize = getStandardTable(1);
		if (dictionary.aggregationInstancesSelector) tableAggregateInstances = getCustomHuffmanTable(customIndex, referredTo, customTables);
		else tableAggregateInstances = getStandardTable(1);
		return {
			tableDeltaHeight,
			tableDeltaWidth,
			tableBitmapSize,
			tableAggregateInstances
		};
	}
	function readUncompressedBitmap(reader, width, height) {
		const bitmap = [];
		for (let y = 0; y < height; y++) {
			const row = new Uint8Array(width);
			bitmap.push(row);
			for (let x = 0; x < width; x++) row[x] = reader.readBit();
			reader.byteAlign();
		}
		return bitmap;
	}
	function decodeMMRBitmap(input, width, height, endOfBlock) {
		const decoder = new CCITTFaxDecoder(input, {
			K: -1,
			Columns: width,
			Rows: height,
			BlackIs1: true,
			EndOfBlock: endOfBlock
		});
		const bitmap = [];
		let currentByte, eof = false;
		for (let y = 0; y < height; y++) {
			const row = new Uint8Array(width);
			bitmap.push(row);
			let shift = -1;
			for (let x = 0; x < width; x++) {
				if (shift < 0) {
					currentByte = decoder.readNextChar();
					if (currentByte === -1) {
						currentByte = 0;
						eof = true;
					}
					shift = 7;
				}
				row[x] = currentByte >> shift & 1;
				shift--;
			}
		}
		if (endOfBlock && !eof) {
			const lookForEOFLimit = 5;
			for (let i = 0; i < lookForEOFLimit; i++) if (decoder.readNextChar() === -1) break;
		}
		return bitmap;
	}
	function Jbig2Image() {}
	Jbig2Image.prototype = {
		parseChunks(chunks) {
			return parseJbig2Chunks(chunks);
		},
		parse(data) {
			const { imgData, width, height } = parseJbig2(data);
			this.width = width;
			this.height = height;
			return imgData;
		}
	};
	return Jbig2Image;
})();
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/lapo-asn1js/hex.js
var Hex = {};
var decoder$1;
var haveU8$1 = typeof Uint8Array == "function";
/**
* Decodes an hexadecimal value.
* @param {string|Array|Uint8Array} a - a string representing hexadecimal data, or an array representation of its charcodes
*/
Hex.decode = function(a) {
	var isString = typeof a == "string";
	var i;
	if (decoder$1 === void 0) {
		var hex = "0123456789ABCDEF", ignore = " \f\n\r	\xA0\u2028\u2029";
		decoder$1 = [];
		for (i = 0; i < 16; ++i) decoder$1[hex.charCodeAt(i)] = i;
		hex = hex.toLowerCase();
		for (i = 10; i < 16; ++i) decoder$1[hex.charCodeAt(i)] = i;
		for (i = 0; i < ignore.length; ++i) decoder$1[ignore.charCodeAt(i)] = -1;
	}
	var out = haveU8$1 ? new Uint8Array(a.length >> 1) : [], bits = 0, char_count = 0, len = 0;
	for (i = 0; i < a.length; ++i) {
		var c = isString ? a.charCodeAt(i) : a[i];
		c = decoder$1[c];
		if (c == -1) continue;
		if (c === void 0) throw "Illegal character at offset " + i;
		bits |= c;
		if (++char_count >= 2) {
			out[len++] = bits;
			bits = 0;
			char_count = 0;
		} else bits <<= 4;
	}
	if (char_count) throw "Hex encoding incomplete: 4 bits missing";
	if (haveU8$1 && out.length > len) out = out.subarray(0, len);
	return out;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/lapo-asn1js/base64.js
var Base64 = {};
var decoder;
var haveU8 = typeof Uint8Array == "function";
Base64.decode = function(a) {
	var isString = typeof a == "string";
	var i;
	if (decoder === void 0) {
		var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", ignore = "= \f\n\r	\xA0\u2028\u2029";
		decoder = [];
		for (i = 0; i < 64; ++i) decoder[b64.charCodeAt(i)] = i;
		for (i = 0; i < ignore.length; ++i) decoder[ignore.charCodeAt(i)] = -1;
		decoder["-".charCodeAt(0)] = decoder["+".charCodeAt(0)];
		decoder["_".charCodeAt(0)] = decoder["/".charCodeAt(0)];
	}
	var out = haveU8 ? new Uint8Array(a.length * 3 >> 2) : [];
	var bits = 0, char_count = 0, len = 0;
	for (i = 0; i < a.length; ++i) {
		var c = isString ? a.charCodeAt(i) : a[i];
		if (c == 61) break;
		c = decoder[c];
		if (c == -1) continue;
		if (c === void 0) throw "Illegal character at offset " + i;
		bits |= c;
		if (++char_count >= 4) {
			out[len++] = bits >> 16;
			out[len++] = bits >> 8 & 255;
			out[len++] = bits & 255;
			bits = 0;
			char_count = 0;
		} else bits <<= 6;
	}
	switch (char_count) {
		case 1: throw "Base64 encoding incomplete: at least 2 bits missing";
		case 2:
			out[len++] = bits >> 10;
			break;
		case 3:
			out[len++] = bits >> 16;
			out[len++] = bits >> 8 & 255;
	}
	if (haveU8 && out.length > len) out = out.subarray(0, len);
	return out;
};
Base64.pretty = function(str) {
	if (str.length % 4 > 0) str = (str + "===").slice(0, str.length + str.length % 4);
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	return str.replace(/(.{80})/g, "$1\n");
};
Base64.re = /-----BEGIN [^-]+-----([A-Za-z0-9+/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+/=\s]+)====/;
Base64.unarmor = function(a) {
	var m = Base64.re.exec(a);
	if (m) if (m[1]) a = m[1];
	else if (m[2]) a = m[2];
	else throw "RegExp out of sync";
	return Base64.decode(a);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/lapo-asn1js/int10.js
var max = 0x9184e72a000;
/**
* Arbitrary length base-10 value.
* @param {number} value - Optional initial value (will be 0 otherwise).
*/
function Int10(value) {
	this.buf = [+value || 0];
}
/**
* Multiply value by m and add c.
* @param {number} m - multiplier, must be < =256
* @param {number} c - value to add
*/
Int10.prototype.mulAdd = function(m, c) {
	var b = this.buf, l = b.length, i, t;
	for (i = 0; i < l; ++i) {
		t = b[i] * m + c;
		if (t < max) c = 0;
		else {
			c = 0 | t / max;
			t -= c * max;
		}
		b[i] = t;
	}
	if (c > 0) b[i] = c;
};
/**
* Subtract value.
* @param {number} c - value to subtract
*/
Int10.prototype.sub = function(c) {
	var b = this.buf, l = b.length, i, t;
	for (i = 0; i < l; ++i) {
		t = b[i] - c;
		if (t < 0) {
			t += max;
			c = 1;
		} else c = 0;
		b[i] = t;
	}
	while (b[b.length - 1] === 0) b.pop();
};
/**
* Convert to decimal string representation.
* @param {*} base - optional value, only value accepted is 10
*/
Int10.prototype.toString = function(base) {
	if ((base || 10) != 10) throw "only base 10 is supported";
	var b = this.buf, s = b[b.length - 1].toString();
	for (var i = b.length - 2; i >= 0; --i) s += (max + b[i]).toString().substring(1);
	return s;
};
/**
* Convert to Number value representation.
* Will probably overflow 2^53 and thus become approximate.
*/
Int10.prototype.valueOf = function() {
	var b = this.buf, v = 0;
	for (var i = b.length - 1; i >= 0; --i) v = v * max + b[i];
	return v;
};
/**
* Return value as a simple Number (if it is <= 10000000000000), or return this.
*/
Int10.prototype.simplify = function() {
	var b = this.buf;
	return b.length == 1 ? b[0] : this;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/lapo-asn1js/oids.js
var oids = {
	"0.2.262.1.10": {
		"d": "Telesec",
		"c": "Deutsche Telekom"
	},
	"0.2.262.1.10.0": {
		"d": "extension",
		"c": "Telesec"
	},
	"0.2.262.1.10.1": {
		"d": "mechanism",
		"c": "Telesec"
	},
	"0.2.262.1.10.1.0": {
		"d": "authentication",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.0.1": {
		"d": "passwordAuthentication",
		"c": "Telesec authentication"
	},
	"0.2.262.1.10.1.0.2": {
		"d": "protectedPasswordAuthentication",
		"c": "Telesec authentication"
	},
	"0.2.262.1.10.1.0.3": {
		"d": "oneWayX509Authentication",
		"c": "Telesec authentication"
	},
	"0.2.262.1.10.1.0.4": {
		"d": "twoWayX509Authentication",
		"c": "Telesec authentication"
	},
	"0.2.262.1.10.1.0.5": {
		"d": "threeWayX509Authentication",
		"c": "Telesec authentication"
	},
	"0.2.262.1.10.1.0.6": {
		"d": "oneWayISO9798Authentication",
		"c": "Telesec authentication"
	},
	"0.2.262.1.10.1.0.7": {
		"d": "twoWayISO9798Authentication",
		"c": "Telesec authentication"
	},
	"0.2.262.1.10.1.0.8": {
		"d": "telekomAuthentication",
		"c": "Telesec authentication"
	},
	"0.2.262.1.10.1.1": {
		"d": "signature",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.1.1": {
		"d": "md4WithRSAAndISO9697",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.1.2": {
		"d": "md4WithRSAAndTelesecSignatureStandard",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.1.3": {
		"d": "md5WithRSAAndISO9697",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.1.4": {
		"d": "md5WithRSAAndTelesecSignatureStandard",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.1.5": {
		"d": "ripemd160WithRSAAndTelekomSignatureStandard",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.1.9": {
		"d": "hbciRsaSignature",
		"c": "Telesec signature"
	},
	"0.2.262.1.10.1.2": {
		"d": "encryption",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.2.0": {
		"d": "none",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.1": {
		"d": "rsaTelesec",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.2": {
		"d": "des",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.2.1": {
		"d": "desECB",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.2.2": {
		"d": "desCBC",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.2.3": {
		"d": "desOFB",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.2.4": {
		"d": "desCFB8",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.2.5": {
		"d": "desCFB64",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.3": {
		"d": "des3",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.3.1": {
		"d": "des3ECB",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.3.2": {
		"d": "des3CBC",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.3.3": {
		"d": "des3OFB",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.3.4": {
		"d": "des3CFB8",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.3.5": {
		"d": "des3CFB64",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.4": {
		"d": "magenta",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.5": {
		"d": "idea",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.5.1": {
		"d": "ideaECB",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.5.2": {
		"d": "ideaCBC",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.5.3": {
		"d": "ideaOFB",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.5.4": {
		"d": "ideaCFB8",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.2.5.5": {
		"d": "ideaCFB64",
		"c": "Telesec encryption"
	},
	"0.2.262.1.10.1.3": {
		"d": "oneWayFunction",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.3.1": {
		"d": "md4",
		"c": "Telesec one-way function"
	},
	"0.2.262.1.10.1.3.2": {
		"d": "md5",
		"c": "Telesec one-way function"
	},
	"0.2.262.1.10.1.3.3": {
		"d": "sqModNX509",
		"c": "Telesec one-way function"
	},
	"0.2.262.1.10.1.3.4": {
		"d": "sqModNISO",
		"c": "Telesec one-way function"
	},
	"0.2.262.1.10.1.3.5": {
		"d": "ripemd128",
		"c": "Telesec one-way function"
	},
	"0.2.262.1.10.1.3.6": {
		"d": "hashUsingBlockCipher",
		"c": "Telesec one-way function"
	},
	"0.2.262.1.10.1.3.7": {
		"d": "mac",
		"c": "Telesec one-way function"
	},
	"0.2.262.1.10.1.3.8": {
		"d": "ripemd160",
		"c": "Telesec one-way function"
	},
	"0.2.262.1.10.1.4": {
		"d": "fecFunction",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.1.4.1": {
		"d": "reedSolomon",
		"c": "Telesec mechanism"
	},
	"0.2.262.1.10.2": {
		"d": "module",
		"c": "Telesec"
	},
	"0.2.262.1.10.2.0": {
		"d": "algorithms",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.1": {
		"d": "attributeTypes",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.2": {
		"d": "certificateTypes",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.3": {
		"d": "messageTypes",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.4": {
		"d": "plProtocol",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.5": {
		"d": "smeAndComponentsOfSme",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.6": {
		"d": "fec",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.7": {
		"d": "usefulDefinitions",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.8": {
		"d": "stefiles",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.9": {
		"d": "sadmib",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.10": {
		"d": "electronicOrder",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.11": {
		"d": "telesecTtpAsymmetricApplication",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.12": {
		"d": "telesecTtpBasisApplication",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.13": {
		"d": "telesecTtpMessages",
		"c": "Telesec module"
	},
	"0.2.262.1.10.2.14": {
		"d": "telesecTtpTimeStampApplication",
		"c": "Telesec module"
	},
	"0.2.262.1.10.3": {
		"d": "objectClass",
		"c": "Telesec"
	},
	"0.2.262.1.10.3.0": {
		"d": "telesecOtherName",
		"c": "Telesec object class"
	},
	"0.2.262.1.10.3.1": {
		"d": "directory",
		"c": "Telesec object class"
	},
	"0.2.262.1.10.3.2": {
		"d": "directoryType",
		"c": "Telesec object class"
	},
	"0.2.262.1.10.3.3": {
		"d": "directoryGroup",
		"c": "Telesec object class"
	},
	"0.2.262.1.10.3.4": {
		"d": "directoryUser",
		"c": "Telesec object class"
	},
	"0.2.262.1.10.3.5": {
		"d": "symmetricKeyEntry",
		"c": "Telesec object class"
	},
	"0.2.262.1.10.4": {
		"d": "package",
		"c": "Telesec"
	},
	"0.2.262.1.10.5": {
		"d": "parameter",
		"c": "Telesec"
	},
	"0.2.262.1.10.6": {
		"d": "nameBinding",
		"c": "Telesec"
	},
	"0.2.262.1.10.7": {
		"d": "attribute",
		"c": "Telesec"
	},
	"0.2.262.1.10.7.0": {
		"d": "applicationGroupIdentifier",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.1": {
		"d": "certificateType",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.2": {
		"d": "telesecCertificate",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.3": {
		"d": "certificateNumber",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.4": {
		"d": "certificateRevocationList",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.5": {
		"d": "creationDate",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.6": {
		"d": "issuer",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.7": {
		"d": "namingAuthority",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.8": {
		"d": "publicKeyDirectory",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.9": {
		"d": "securityDomain",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.10": {
		"d": "subject",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.11": {
		"d": "timeOfRevocation",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.12": {
		"d": "userGroupReference",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.13": {
		"d": "validity",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.14": {
		"d": "zert93",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.15": {
		"d": "securityMessEnv",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.16": {
		"d": "anonymizedPublicKeyDirectory",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.17": {
		"d": "telesecGivenName",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.18": {
		"d": "nameAdditions",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.19": {
		"d": "telesecPostalCode",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.20": {
		"d": "nameDistinguisher",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.21": {
		"d": "telesecCertificateList",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.22": {
		"d": "teletrustCertificateList",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.23": {
		"d": "x509CertificateList",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.24": {
		"d": "timeOfIssue",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.25": {
		"d": "physicalCardNumber",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.26": {
		"d": "fileType",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.27": {
		"d": "ctlFileIsArchive",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.28": {
		"d": "emailAddress",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.29": {
		"d": "certificateTemplateList",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.30": {
		"d": "directoryName",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.31": {
		"d": "directoryTypeName",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.32": {
		"d": "directoryGroupName",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.33": {
		"d": "directoryUserName",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.34": {
		"d": "revocationFlag",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.35": {
		"d": "symmetricKeyEntryName",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.36": {
		"d": "glNumber",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.37": {
		"d": "goNumber",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.38": {
		"d": "gKeyData",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.39": {
		"d": "zKeyData",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.40": {
		"d": "ktKeyData",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.41": {
		"d": "ktKeyNumber",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.51": {
		"d": "timeOfRevocationGen",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.7.52": {
		"d": "liabilityText",
		"c": "Telesec attribute"
	},
	"0.2.262.1.10.8": {
		"d": "attributeGroup",
		"c": "Telesec"
	},
	"0.2.262.1.10.9": {
		"d": "action",
		"c": "Telesec"
	},
	"0.2.262.1.10.10": {
		"d": "notification",
		"c": "Telesec"
	},
	"0.2.262.1.10.11": {
		"d": "snmp-mibs",
		"c": "Telesec"
	},
	"0.2.262.1.10.11.1": {
		"d": "securityApplication",
		"c": "Telesec SNMP MIBs"
	},
	"0.2.262.1.10.12": {
		"d": "certAndCrlExtensionDefinitions",
		"c": "Telesec"
	},
	"0.2.262.1.10.12.0": {
		"d": "liabilityLimitationFlag",
		"c": "Telesec cert/CRL extension"
	},
	"0.2.262.1.10.12.1": {
		"d": "telesecCertIdExt",
		"c": "Telesec cert/CRL extension"
	},
	"0.2.262.1.10.12.2": {
		"d": "Telesec policyIdentifier",
		"c": "Telesec cert/CRL extension"
	},
	"0.2.262.1.10.12.3": {
		"d": "telesecPolicyQualifierID",
		"c": "Telesec cert/CRL extension"
	},
	"0.2.262.1.10.12.4": {
		"d": "telesecCRLFilteredExt",
		"c": "Telesec cert/CRL extension"
	},
	"0.2.262.1.10.12.5": {
		"d": "telesecCRLFilterExt",
		"c": "Telesec cert/CRL extension"
	},
	"0.2.262.1.10.12.6": {
		"d": "telesecNamingAuthorityExt",
		"c": "Telesec cert/CRL extension"
	},
	"0.4.0.127.0.7": {
		"d": "bsi",
		"c": "BSI TR-03110/TR-03111"
	},
	"0.4.0.127.0.7.1": {
		"d": "bsiEcc",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1": {
		"d": "bsifieldType",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.1": {
		"d": "bsiPrimeField",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.2": {
		"d": "bsiCharacteristicTwoField",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.2.2": {
		"d": "bsiECTLVKeyFormat",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.2.2.1": {
		"d": "bsiECTLVPublicKey",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.2.3": {
		"d": "bsiCharacteristicTwoBasis",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.2.3.1": {
		"d": "bsiGnBasis",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.2.3.2": {
		"d": "bsiTpBasis",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.2.3.3": {
		"d": "bsiPpBasis",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.4.1": {
		"d": "bsiEcdsaSignatures",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.4.1.1": {
		"d": "bsiEcdsaWithSHA1",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.4.1.2": {
		"d": "bsiEcdsaWithSHA224",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.4.1.3": {
		"d": "bsiEcdsaWithSHA256",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.4.1.4": {
		"d": "bsiEcdsaWithSHA384",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.4.1.5": {
		"d": "bsiEcdsaWithSHA512",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.4.1.6": {
		"d": "bsiEcdsaWithRIPEMD160",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.1": {
		"d": "bsiEckaEgX963KDF",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.1.1": {
		"d": "bsiEckaEgX963KDFWithSHA1",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.1.2": {
		"d": "bsiEckaEgX963KDFWithSHA224",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.1.3": {
		"d": "bsiEckaEgX963KDFWithSHA256",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.1.4": {
		"d": "bsiEckaEgX963KDFWithSHA384",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.1.5": {
		"d": "bsiEckaEgX963KDFWithSHA512",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.1.6": {
		"d": "bsiEckaEgX963KDFWithRIPEMD160",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.2": {
		"d": "bsiEckaEgSessionKDF",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.2.1": {
		"d": "bsiEckaEgSessionKDFWith3DES",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.2.2": {
		"d": "bsiEckaEgSessionKDFWithAES128",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.2.3": {
		"d": "bsiEckaEgSessionKDFWithAES192",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.1.2.4": {
		"d": "bsiEckaEgSessionKDFWithAES256",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2": {
		"d": "bsiEckaDH",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.1": {
		"d": "bsiEckaDHX963KDF",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.1.1": {
		"d": "bsiEckaDHX963KDFWithSHA1",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.1.2": {
		"d": "bsiEckaDHX963KDFWithSHA224",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.1.3": {
		"d": "bsiEckaDHX963KDFWithSHA256",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.1.4": {
		"d": "bsiEckaDHX963KDFWithSHA384",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.1.5": {
		"d": "bsiEckaDHX963KDFWithSHA512",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.1.6": {
		"d": "bsiEckaDHX963KDFWithRIPEMD160",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.2": {
		"d": "bsiEckaDHSessionKDF",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.2.1": {
		"d": "bsiEckaDHSessionKDFWith3DES",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.2.2": {
		"d": "bsiEckaDHSessionKDFWithAES128",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.2.3": {
		"d": "bsiEckaDHSessionKDFWithAES192",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.1.5.2.2.4": {
		"d": "bsiEckaDHSessionKDFWithAES256",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.2": {
		"d": "bsiEcKeyType",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.2.1": {
		"d": "bsiEcPublicKey",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.5.1": {
		"d": "bsiKaeg",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.5.1.1": {
		"d": "bsiKaegWithX963KDF",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.1.5.1.2": {
		"d": "bsiKaegWith3DESKDF",
		"c": "BSI TR-03111"
	},
	"0.4.0.127.0.7.2.2.1": {
		"d": "bsiPK",
		"c": "BSI TR-03110. Formerly known as bsiCA, now moved to ...2.2.3.x"
	},
	"0.4.0.127.0.7.2.2.1.1": {
		"d": "bsiPK_DH",
		"c": "BSI TR-03110. Formerly known as bsiCA_DH, now moved to ...2.2.3.x"
	},
	"0.4.0.127.0.7.2.2.1.2": {
		"d": "bsiPK_ECDH",
		"c": "BSI TR-03110. Formerly known as bsiCA_ECDH, now moved to ...2.2.3.x"
	},
	"0.4.0.127.0.7.2.2.2": {
		"d": "bsiTA",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.1": {
		"d": "bsiTA_RSA",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.1.1": {
		"d": "bsiTA_RSAv1_5_SHA1",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.1.2": {
		"d": "bsiTA_RSAv1_5_SHA256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.1.3": {
		"d": "bsiTA_RSAPSS_SHA1",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.1.4": {
		"d": "bsiTA_RSAPSS_SHA256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.1.5": {
		"d": "bsiTA_RSAv1_5_SHA512",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.1.6": {
		"d": "bsiTA_RSAPSS_SHA512",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.2": {
		"d": "bsiTA_ECDSA",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.2.1": {
		"d": "bsiTA_ECDSA_SHA1",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.2.2": {
		"d": "bsiTA_ECDSA_SHA224",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.2.3": {
		"d": "bsiTA_ECDSA_SHA256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.2.4": {
		"d": "bsiTA_ECDSA_SHA384",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.2.2.5": {
		"d": "bsiTA_ECDSA_SHA512",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3": {
		"d": "bsiCA",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.1": {
		"d": "bsiCA_DH",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.1.1": {
		"d": "bsiCA_DH_3DES_CBC_CBC",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.1.2": {
		"d": "bsiCA_DH_AES_CBC_CMAC_128",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.1.3": {
		"d": "bsiCA_DH_AES_CBC_CMAC_192",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.1.4": {
		"d": "bsiCA_DH_AES_CBC_CMAC_256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.2": {
		"d": "bsiCA_ECDH",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.2.1": {
		"d": "bsiCA_ECDH_3DES_CBC_CBC",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.2.2": {
		"d": "bsiCA_ECDH_AES_CBC_CMAC_128",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.2.3": {
		"d": "bsiCA_ECDH_AES_CBC_CMAC_192",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.3.2.4": {
		"d": "bsiCA_ECDH_AES_CBC_CMAC_256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4": {
		"d": "bsiPACE",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.1": {
		"d": "bsiPACE_DH_GM",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.1.1": {
		"d": "bsiPACE_DH_GM_3DES_CBC_CBC",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.1.2": {
		"d": "bsiPACE_DH_GM_AES_CBC_CMAC_128",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.1.3": {
		"d": "bsiPACE_DH_GM_AES_CBC_CMAC_192",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.1.4": {
		"d": "bsiPACE_DH_GM_AES_CBC_CMAC_256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.2": {
		"d": "bsiPACE_ECDH_GM",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.2.1": {
		"d": "bsiPACE_ECDH_GM_3DES_CBC_CBC",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.2.2": {
		"d": "bsiPACE_ECDH_GM_AES_CBC_CMAC_128",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.2.3": {
		"d": "bsiPACE_ECDH_GM_AES_CBC_CMAC_192",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.2.4": {
		"d": "bsiPACE_ECDH_GM_AES_CBC_CMAC_256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.3": {
		"d": "bsiPACE_DH_IM",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.3.1": {
		"d": "bsiPACE_DH_IM_3DES_CBC_CBC",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.3.2": {
		"d": "bsiPACE_DH_IM_AES_CBC_CMAC_128",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.3.3": {
		"d": "bsiPACE_DH_IM_AES_CBC_CMAC_192",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.3.4": {
		"d": "bsiPACE_DH_IM_AES_CBC_CMAC_256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.4": {
		"d": "bsiPACE_ECDH_IM",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.4.1": {
		"d": "bsiPACE_ECDH_IM_3DES_CBC_CBC",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.4.2": {
		"d": "bsiPACE_ECDH_IM_AES_CBC_CMAC_128",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.4.3": {
		"d": "bsiPACE_ECDH_IM_AES_CBC_CMAC_192",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.4.4.4": {
		"d": "bsiPACE_ECDH_IM_AES_CBC_CMAC_256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5": {
		"d": "bsiRI",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.1": {
		"d": "bsiRI_DH",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.1.1": {
		"d": "bsiRI_DH_SHA1",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.1.2": {
		"d": "bsiRI_DH_SHA224",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.1.3": {
		"d": "bsiRI_DH_SHA256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.1.4": {
		"d": "bsiRI_DH_SHA384",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.1.5": {
		"d": "bsiRI_DH_SHA512",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.2": {
		"d": "bsiRI_ECDH",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.2.1": {
		"d": "bsiRI_ECDH_SHA1",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.2.2": {
		"d": "bsiRI_ECDH_SHA224",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.2.3": {
		"d": "bsiRI_ECDH_SHA256",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.2.4": {
		"d": "bsiRI_ECDH_SHA384",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.5.2.5": {
		"d": "bsiRI_ECDH_SHA512",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.6": {
		"d": "bsiCardInfo",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.7": {
		"d": "bsiEidSecurity",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.2.2.8": {
		"d": "bsiPT",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.2": {
		"d": "bsiEACRoles",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.2.1": {
		"d": "bsiEACRolesIS",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.2.2": {
		"d": "bsiEACRolesAT",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.2.3": {
		"d": "bsiEACRolesST",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.3": {
		"d": "bsiTAv2ce",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.3.1": {
		"d": "bsiTAv2ceDescription",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.3.1.1": {
		"d": "bsiTAv2ceDescriptionPlainText",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.3.1.2": {
		"d": "bsiTAv2ceDescriptionIA5String",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.3.1.3": {
		"d": "bsiTAv2ceDescriptionOctetString",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.3.2": {
		"d": "bsiTAv2ceTerminalSector",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.4": {
		"d": "bsiAuxData",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.4.1": {
		"d": "bsiAuxDataBirthday",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.4.2": {
		"d": "bsiAuxDataExpireDate",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.4.3": {
		"d": "bsiAuxDataCommunityID",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5": {
		"d": "bsiDefectList",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.1": {
		"d": "bsiDefectAuthDefect",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.1.1": {
		"d": "bsiDefectCertRevoked",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.1.2": {
		"d": "bsiDefectCertReplaced",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.1.3": {
		"d": "bsiDefectChipAuthKeyRevoked",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.1.4": {
		"d": "bsiDefectActiveAuthKeyRevoked",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.2": {
		"d": "bsiDefectEPassportDefect",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.2.1": {
		"d": "bsiDefectEPassportDGMalformed",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.2.2": {
		"d": "bsiDefectSODInvalid",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.3": {
		"d": "bsiDefectEIDDefect",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.3.1": {
		"d": "bsiDefectEIDDGMalformed",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.3.2": {
		"d": "bsiDefectEIDIntegrity",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.4": {
		"d": "bsiDefectDocumentDefect",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.4.1": {
		"d": "bsiDefectCardSecurityMalformed",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.4.2": {
		"d": "bsiDefectChipSecurityMalformed",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.5.4.3": {
		"d": "bsiDefectPowerDownReq",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.1.6": {
		"d": "bsiListContentDescription",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.2.1": {
		"d": "bsiSecurityObject",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.2.2": {
		"d": "bsiBlackList",
		"c": "BSI TR-03110"
	},
	"0.4.0.127.0.7.3.4.2.2": {
		"d": "bsiSignedUpdateDeviceAdmin",
		"c": "BSI TR-03109"
	},
	"0.4.0.127.0.7.4.1.1.1": {
		"d": "bsiCertReqMsgs",
		"c": "BSI TR-03109"
	},
	"0.4.0.127.0.7.4.1.1.2": {
		"d": "bsiCertReqMsgswithOuterSignature",
		"c": "BSI TR-03109"
	},
	"0.4.0.127.0.7.4.1.1.3": {
		"d": "bsiAuthorizedCertReqMsgs",
		"c": "BSI TR-03109"
	},
	"0.4.0.127.0.7.4.1.2.2": {
		"d": "bsiSignedRevReqs",
		"c": "BSI TR-03109"
	},
	"0.4.0.1862": {
		"d": "etsiQcsProfile",
		"c": "ETSI TS 101 862 qualified certificates"
	},
	"0.4.0.1862.1": {
		"d": "etsiQcs",
		"c": "ETSI TS 101 862 qualified certificates"
	},
	"0.4.0.1862.1.1": {
		"d": "etsiQcsCompliance",
		"c": "ETSI TS 101 862 qualified certificates"
	},
	"0.4.0.1862.1.2": {
		"d": "etsiQcsLimitValue",
		"c": "ETSI TS 101 862 qualified certificates"
	},
	"0.4.0.1862.1.3": {
		"d": "etsiQcsRetentionPeriod",
		"c": "ETSI TS 101 862 qualified certificates"
	},
	"0.4.0.1862.1.4": {
		"d": "etsiQcsQcSSCD",
		"c": "ETSI TS 101 862 qualified certificates"
	},
	"0.9.2342.19200300.100.1.1": {
		"d": "userID",
		"c": "Some oddball X.500 attribute collection"
	},
	"0.9.2342.19200300.100.1.3": {
		"d": "rfc822Mailbox",
		"c": "Some oddball X.500 attribute collection"
	},
	"0.9.2342.19200300.100.1.25": {
		"d": "domainComponent",
		"c": "Men are from Mars, this OID is from Pluto"
	},
	"1.0.10118.3.0.49": {
		"d": "ripemd160",
		"c": "ISO 10118-3 hash function"
	},
	"1.0.10118.3.0.50": {
		"d": "ripemd128",
		"c": "ISO 10118-3 hash function"
	},
	"1.0.10118.3.0.55": {
		"d": "whirlpool",
		"c": "ISO 10118-3 hash function"
	},
	"1.0.18033.2": {
		"d": "iso18033-2",
		"c": "ISO 18033-2"
	},
	"1.0.18033.2.2": {
		"d": "kem",
		"c": "ISO 18033-2 algorithms"
	},
	"1.0.18033.2.2.4": {
		"d": "kemRSA",
		"c": "ISO 18033-2 KEM algorithms"
	},
	"1.2.36.1.3.1.1.1": {
		"d": "qgpki",
		"c": "Queensland Government PKI"
	},
	"1.2.36.1.3.1.1.1.1": {
		"d": "qgpkiPolicies",
		"c": "QGPKI policies"
	},
	"1.2.36.1.3.1.1.1.1.1": {
		"d": "qgpkiMedIntermedCA",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.1.1": {
		"d": "qgpkiMedIntermedIndividual",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.1.2": {
		"d": "qgpkiMedIntermedDeviceControl",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.1.3": {
		"d": "qgpkiMedIntermedDevice",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.1.4": {
		"d": "qgpkiMedIntermedAuthorisedParty",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.1.5": {
		"d": "qgpkiMedIntermedDeviceSystem",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.2": {
		"d": "qgpkiMedIssuingCA",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.2.1": {
		"d": "qgpkiMedIssuingIndividual",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.2.2": {
		"d": "qgpkiMedIssuingDeviceControl",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.2.3": {
		"d": "qgpkiMedIssuingDevice",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.2.4": {
		"d": "qgpkiMedIssuingAuthorisedParty",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.2.5": {
		"d": "qgpkiMedIssuingClientAuth",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.2.6": {
		"d": "qgpkiMedIssuingServerAuth",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.2.7": {
		"d": "qgpkiMedIssuingDataProt",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.2.8": {
		"d": "qgpkiMedIssuingTokenAuth",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.3": {
		"d": "qgpkiBasicIntermedCA",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.3.1": {
		"d": "qgpkiBasicIntermedDeviceSystem",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.4": {
		"d": "qgpkiBasicIssuingCA",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.4.1": {
		"d": "qgpkiBasicIssuingClientAuth",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.4.2": {
		"d": "qgpkiBasicIssuingServerAuth",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.1.4.3": {
		"d": "qgpkiBasicIssuingDataSigning",
		"c": "QGPKI policy"
	},
	"1.2.36.1.3.1.1.1.2": {
		"d": "qgpkiAssuranceLevel",
		"c": "QGPKI assurance level"
	},
	"1.2.36.1.3.1.1.1.2.1": {
		"d": "qgpkiAssuranceRudimentary",
		"c": "QGPKI assurance level"
	},
	"1.2.36.1.3.1.1.1.2.2": {
		"d": "qgpkiAssuranceBasic",
		"c": "QGPKI assurance level"
	},
	"1.2.36.1.3.1.1.1.2.3": {
		"d": "qgpkiAssuranceMedium",
		"c": "QGPKI assurance level"
	},
	"1.2.36.1.3.1.1.1.2.4": {
		"d": "qgpkiAssuranceHigh",
		"c": "QGPKI assurance level"
	},
	"1.2.36.1.3.1.1.1.3": {
		"d": "qgpkiCertFunction",
		"c": "QGPKI policies"
	},
	"1.2.36.1.3.1.1.1.3.1": {
		"d": "qgpkiFunctionIndividual",
		"c": "QGPKI policies"
	},
	"1.2.36.1.3.1.1.1.3.2": {
		"d": "qgpkiFunctionDevice",
		"c": "QGPKI policies"
	},
	"1.2.36.1.3.1.1.1.3.3": {
		"d": "qgpkiFunctionAuthorisedParty",
		"c": "QGPKI policies"
	},
	"1.2.36.1.3.1.1.1.3.4": {
		"d": "qgpkiFunctionDeviceControl",
		"c": "QGPKI policies"
	},
	"1.2.36.1.3.1.2": {
		"d": "qpspki",
		"c": "Queensland Police PKI"
	},
	"1.2.36.1.3.1.2.1": {
		"d": "qpspkiPolicies",
		"c": "Queensland Police PKI"
	},
	"1.2.36.1.3.1.2.1.2": {
		"d": "qpspkiPolicyBasic",
		"c": "Queensland Police PKI"
	},
	"1.2.36.1.3.1.2.1.3": {
		"d": "qpspkiPolicyMedium",
		"c": "Queensland Police PKI"
	},
	"1.2.36.1.3.1.2.1.4": {
		"d": "qpspkiPolicyHigh",
		"c": "Queensland Police PKI"
	},
	"1.2.36.1.3.1.3.2": {
		"d": "qtmrpki",
		"c": "Queensland Transport PKI"
	},
	"1.2.36.1.3.1.3.2.1": {
		"d": "qtmrpkiPolicies",
		"c": "Queensland Transport PKI"
	},
	"1.2.36.1.3.1.3.2.2": {
		"d": "qtmrpkiPurpose",
		"c": "Queensland Transport PKI"
	},
	"1.2.36.1.3.1.3.2.2.1": {
		"d": "qtmrpkiIndividual",
		"c": "Queensland Transport PKI purpose"
	},
	"1.2.36.1.3.1.3.2.2.2": {
		"d": "qtmrpkiDeviceControl",
		"c": "Queensland Transport PKI purpose"
	},
	"1.2.36.1.3.1.3.2.2.3": {
		"d": "qtmrpkiDevice",
		"c": "Queensland Transport PKI purpose"
	},
	"1.2.36.1.3.1.3.2.2.4": {
		"d": "qtmrpkiAuthorisedParty",
		"c": "Queensland Transport PKI purpose"
	},
	"1.2.36.1.3.1.3.2.2.5": {
		"d": "qtmrpkiDeviceSystem",
		"c": "Queensland Transport PKI purpose"
	},
	"1.2.36.1.3.1.3.2.3": {
		"d": "qtmrpkiDevice",
		"c": "Queensland Transport PKI"
	},
	"1.2.36.1.3.1.3.2.3.1": {
		"d": "qtmrpkiDriverLicense",
		"c": "Queensland Transport PKI device"
	},
	"1.2.36.1.3.1.3.2.3.2": {
		"d": "qtmrpkiIndustryAuthority",
		"c": "Queensland Transport PKI device"
	},
	"1.2.36.1.3.1.3.2.3.3": {
		"d": "qtmrpkiMarineLicense",
		"c": "Queensland Transport PKI device"
	},
	"1.2.36.1.3.1.3.2.3.4": {
		"d": "qtmrpkiAdultProofOfAge",
		"c": "Queensland Transport PKI device"
	},
	"1.2.36.1.3.1.3.2.3.5": {
		"d": "qtmrpkiSam",
		"c": "Queensland Transport PKI device"
	},
	"1.2.36.1.3.1.3.2.4": {
		"d": "qtmrpkiAuthorisedParty",
		"c": "Queensland Transport PKI"
	},
	"1.2.36.1.3.1.3.2.4.1": {
		"d": "qtmrpkiTransportInspector",
		"c": "Queensland Transport PKI authorised party"
	},
	"1.2.36.1.3.1.3.2.4.2": {
		"d": "qtmrpkiPoliceOfficer",
		"c": "Queensland Transport PKI authorised party"
	},
	"1.2.36.1.3.1.3.2.4.3": {
		"d": "qtmrpkiSystem",
		"c": "Queensland Transport PKI authorised party"
	},
	"1.2.36.1.3.1.3.2.4.4": {
		"d": "qtmrpkiLiquorLicensingInspector",
		"c": "Queensland Transport PKI authorised party"
	},
	"1.2.36.1.3.1.3.2.4.5": {
		"d": "qtmrpkiMarineEnforcementOfficer",
		"c": "Queensland Transport PKI authorised party"
	},
	"1.2.36.1.333.1": {
		"d": "australianBusinessNumber",
		"c": "Australian Government corporate taxpayer ID"
	},
	"1.2.36.68980861.1.1.2": {
		"d": "signetPersonal",
		"c": "Signet CA"
	},
	"1.2.36.68980861.1.1.3": {
		"d": "signetBusiness",
		"c": "Signet CA"
	},
	"1.2.36.68980861.1.1.4": {
		"d": "signetLegal",
		"c": "Signet CA"
	},
	"1.2.36.68980861.1.1.10": {
		"d": "signetPilot",
		"c": "Signet CA"
	},
	"1.2.36.68980861.1.1.11": {
		"d": "signetIntraNet",
		"c": "Signet CA"
	},
	"1.2.36.68980861.1.1.20": {
		"d": "signetPolicy",
		"c": "Signet CA"
	},
	"1.2.36.75878867.1.100.1.1": {
		"d": "certificatesAustraliaPolicy",
		"c": "Certificates Australia CA"
	},
	"1.2.156.10197.1": {
		"d": "gmtCryptographicAlgorithm",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.100": {
		"d": "gmtBlockCipher",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.102": {
		"d": "sm1Cipher",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.103": {
		"d": "ssf33Cipher",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.104": {
		"d": "sm4Cipher",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.200": {
		"d": "gmtStreamCipher",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.201": {
		"d": "zucCipher",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.300": {
		"d": "gmtPublicKeyCryptography",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.301": {
		"d": "sm2ECC",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.301.1": {
		"d": "sm2-1DigitalSignature",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.301.2": {
		"d": "sm2-2KeyExchange",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.301.3": {
		"d": "sm2-3PublicKeyEncryption",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.302": {
		"d": "gmtSM9IBE",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.302.1": {
		"d": "sm9-1DigitalSignature",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.302.2": {
		"d": "sm9-2KeyExchange",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.302.3": {
		"d": "sm9-3PublicKeyEncryption",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.400": {
		"d": "gmtHashAlgorithm",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.401": {
		"d": "sm3Hash",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.401.1": {
		"d": "sm3HashWithoutKey",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.401.2": {
		"d": "sm3HashWithKey",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.500": {
		"d": "gmtDigestSigning",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.501": {
		"d": "sm2withSM3",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.1.504": {
		"d": "rsaWithSM3",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.4.3": {
		"d": "gmtCertificateAuthority",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6": {
		"d": "gmtStandardClass",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1": {
		"d": "gmtFoundationClass",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.1": {
		"d": "gmtAlgorithmClass",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.1.1": {
		"d": "zucStandard",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.1.2": {
		"d": "sm4Standard",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.1.3": {
		"d": "sm2Standard",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.1.4": {
		"d": "sm3Standard",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.2": {
		"d": "gmtIDClass",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.2.1": {
		"d": "gmtCryptoID",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.3": {
		"d": "gmtOperationModes",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.4": {
		"d": "gmtSecurityMechanism",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.4.1": {
		"d": "gmtSM2Specification",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.1.4.2": {
		"d": "gmtSM2CryptographicMessageSyntax",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.2": {
		"d": "gmtDeviceClass",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.3": {
		"d": "gmtServiceClass",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.4": {
		"d": "gmtInfrastructure",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.5": {
		"d": "gmtTestingClass",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.5.1": {
		"d": "gmtRandomTestingClass",
		"c": "China GM Standards Committee"
	},
	"1.2.156.10197.6.6": {
		"d": "gmtManagementClass",
		"c": "China GM Standards Committee"
	},
	"1.2.392.200011.61.1.1.1": {
		"d": "mitsubishiSecurityAlgorithm",
		"c": "Mitsubishi security algorithm"
	},
	"1.2.392.200011.61.1.1.1.1": {
		"d": "misty1-cbc",
		"c": "Mitsubishi security algorithm"
	},
	"1.2.410.200004.1": {
		"d": "kisaAlgorithm",
		"c": "KISA algorithm"
	},
	"1.2.410.200004.1.1": {
		"d": "kcdsa",
		"c": "Korean DSA"
	},
	"1.2.410.200004.1.2": {
		"d": "has160",
		"c": "Korean hash algorithm"
	},
	"1.2.410.200004.1.3": {
		"d": "seedECB",
		"c": "Korean SEED algorithm, ECB mode"
	},
	"1.2.410.200004.1.4": {
		"d": "seedCBC",
		"c": "Korean SEED algorithm, CBC mode"
	},
	"1.2.410.200004.1.5": {
		"d": "seedOFB",
		"c": "Korean SEED algorithm, OFB mode"
	},
	"1.2.410.200004.1.6": {
		"d": "seedCFB",
		"c": "Korean SEED algorithm, CFB mode"
	},
	"1.2.410.200004.1.7": {
		"d": "seedMAC",
		"c": "Korean SEED algorithm, MAC mode"
	},
	"1.2.410.200004.1.8": {
		"d": "kcdsaWithHAS160",
		"c": "Korean signature algorithm"
	},
	"1.2.410.200004.1.9": {
		"d": "kcdsaWithSHA1",
		"c": "Korean signature algorithm"
	},
	"1.2.410.200004.1.10": {
		"d": "pbeWithHAS160AndSEED-ECB",
		"c": "Korean SEED algorithm, PBE key derivation"
	},
	"1.2.410.200004.1.11": {
		"d": "pbeWithHAS160AndSEED-CBC",
		"c": "Korean SEED algorithm, PBE key derivation"
	},
	"1.2.410.200004.1.12": {
		"d": "pbeWithHAS160AndSEED-CFB",
		"c": "Korean SEED algorithm, PBE key derivation"
	},
	"1.2.410.200004.1.13": {
		"d": "pbeWithHAS160AndSEED-OFB",
		"c": "Korean SEED algorithm, PBE key derivation"
	},
	"1.2.410.200004.1.14": {
		"d": "pbeWithSHA1AndSEED-ECB",
		"c": "Korean SEED algorithm, PBE key derivation"
	},
	"1.2.410.200004.1.15": {
		"d": "pbeWithSHA1AndSEED-CBC",
		"c": "Korean SEED algorithm, PBE key derivation"
	},
	"1.2.410.200004.1.16": {
		"d": "pbeWithSHA1AndSEED-CFB",
		"c": "Korean SEED algorithm, PBE key derivation"
	},
	"1.2.410.200004.1.17": {
		"d": "pbeWithSHA1AndSEED-OFB",
		"c": "Korean SEED algorithm, PBE key derivation"
	},
	"1.2.410.200004.1.20": {
		"d": "rsaWithHAS160",
		"c": "Korean signature algorithm"
	},
	"1.2.410.200004.1.21": {
		"d": "kcdsa1",
		"c": "Korean DSA"
	},
	"1.2.410.200004.2": {
		"d": "npkiCP",
		"c": "KISA NPKI certificate policies"
	},
	"1.2.410.200004.2.1": {
		"d": "npkiSignaturePolicy",
		"c": "KISA NPKI certificate policies"
	},
	"1.2.410.200004.3": {
		"d": "npkiKP",
		"c": "KISA NPKI key usage"
	},
	"1.2.410.200004.4": {
		"d": "npkiAT",
		"c": "KISA NPKI attribute"
	},
	"1.2.410.200004.5": {
		"d": "npkiLCA",
		"c": "KISA NPKI licensed CA"
	},
	"1.2.410.200004.5.1": {
		"d": "npkiSignKorea",
		"c": "KISA NPKI licensed CA"
	},
	"1.2.410.200004.5.2": {
		"d": "npkiSignGate",
		"c": "KISA NPKI licensed CA"
	},
	"1.2.410.200004.5.3": {
		"d": "npkiNcaSign",
		"c": "KISA NPKI licensed CA"
	},
	"1.2.410.200004.6": {
		"d": "npkiON",
		"c": "KISA NPKI otherName"
	},
	"1.2.410.200004.7": {
		"d": "npkiAPP",
		"c": "KISA NPKI application"
	},
	"1.2.410.200004.7.1": {
		"d": "npkiSMIME",
		"c": "KISA NPKI application"
	},
	"1.2.410.200004.7.1.1": {
		"d": "npkiSMIMEAlgo",
		"c": "KISA NPKI application"
	},
	"1.2.410.200004.7.1.1.1": {
		"d": "npkiCmsSEEDWrap",
		"c": "KISA NPKI application"
	},
	"1.2.410.200004.10": {
		"d": "npki",
		"c": "KISA NPKI"
	},
	"1.2.410.200004.10.1": {
		"d": "npkiAttribute",
		"c": "KISA NPKI attribute"
	},
	"1.2.410.200004.10.1.1": {
		"d": "npkiIdentifyData",
		"c": "KISA NPKI attribute"
	},
	"1.2.410.200004.10.1.1.1": {
		"d": "npkiVID",
		"c": "KISA NPKI attribute"
	},
	"1.2.410.200004.10.1.1.2": {
		"d": "npkiEncryptedVID",
		"c": "KISA NPKI attribute"
	},
	"1.2.410.200004.10.1.1.3": {
		"d": "npkiRandomNum",
		"c": "KISA NPKI attribute"
	},
	"1.2.410.200004.10.1.1.4": {
		"d": "npkiVID",
		"c": "KISA NPKI attribute"
	},
	"1.2.410.200046.1.1": {
		"d": "aria1AlgorithmModes",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.1": {
		"d": "aria128-ecb",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.2": {
		"d": "aria128-cbc",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.3": {
		"d": "aria128-cfb",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.4": {
		"d": "aria128-ofb",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.5": {
		"d": "aria128-ctr",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.6": {
		"d": "aria192-ecb",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.7": {
		"d": "aria192-cbc",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.8": {
		"d": "aria192-cfb",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.9": {
		"d": "aria192-ofb",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.10": {
		"d": "aria192-ctr",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.11": {
		"d": "aria256-ecb",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.12": {
		"d": "aria256-cbc",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.13": {
		"d": "aria256-cfb",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.14": {
		"d": "aria256-ofb",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.15": {
		"d": "aria256-ctr",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.21": {
		"d": "aria128-cmac",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.22": {
		"d": "aria192-cmac",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.23": {
		"d": "aria256-cmac",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.31": {
		"d": "aria128-ocb2",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.32": {
		"d": "aria192-ocb2",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.33": {
		"d": "aria256-ocb2",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.34": {
		"d": "aria128-gcm",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.35": {
		"d": "aria192-gcm",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.36": {
		"d": "aria256-gcm",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.37": {
		"d": "aria128-ccm",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.38": {
		"d": "aria192-ccm",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.39": {
		"d": "aria256-ccm",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.40": {
		"d": "aria128-keywrap",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.41": {
		"d": "aria192-keywrap",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.42": {
		"d": "aria256-keywrap",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.43": {
		"d": "aria128-keywrapWithPad",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.44": {
		"d": "aria192-keywrapWithPad",
		"c": "ARIA algorithm modes"
	},
	"1.2.410.200046.1.1.45": {
		"d": "aria256-keywrapWithPad",
		"c": "ARIA algorithm modes"
	},
	"1.2.643.2.2.3": {
		"d": "gostSignature",
		"c": "GOST R 34.10-2001 + GOST R 34.11-94 signature"
	},
	"1.2.643.2.2.4": {
		"d": "gost94Signature",
		"c": "GOST R 34.10-94 + GOST R 34.11-94 signature. Obsoleted by GOST R 34.10-2001",
		"w": true
	},
	"1.2.643.2.2.19": {
		"d": "gostPublicKey",
		"c": "GOST R 34.10-2001 (ECC) public key"
	},
	"1.2.643.2.2.20": {
		"d": "gost94PublicKey",
		"c": "GOST R 34.10-94 public key. Obsoleted by GOST R 34.10-2001",
		"w": true
	},
	"1.2.643.2.2.21": {
		"d": "gostCipher",
		"c": "GOST 28147-89 (symmetric key block cipher)"
	},
	"1.2.643.2.2.31.0": {
		"d": "testCipherParams",
		"c": "Test params for GOST 28147-89"
	},
	"1.2.643.2.2.31.1": {
		"d": "cryptoProCipherA",
		"c": "CryptoPro params A (default, variant 'Verba-O') for GOST 28147-89"
	},
	"1.2.643.2.2.31.2": {
		"d": "cryptoProCipherB",
		"c": "CryptoPro params B (variant 1) for GOST 28147-89"
	},
	"1.2.643.2.2.31.3": {
		"d": "cryptoProCipherC",
		"c": "CryptoPro params C (variant 2) for GOST 28147-89"
	},
	"1.2.643.2.2.31.4": {
		"d": "cryptoProCipherD",
		"c": "CryptoPro params D (variant 3) for GOST 28147-89"
	},
	"1.2.643.2.2.31.5": {
		"d": "oscar11Cipher",
		"c": "Oscar-1.1 params for GOST 28147-89"
	},
	"1.2.643.2.2.31.6": {
		"d": "oscar10Cipher",
		"c": "Oscar-1.0 params for GOST 28147-89"
	},
	"1.2.643.2.2.31.7": {
		"d": "ric1Cipher",
		"c": "RIC-1 params for GOST 28147-89"
	},
	"1.2.643.2.2.31.12": {
		"d": "tc26CipherA",
		"c": "TC26 params 2 for GOST 28147-89"
	},
	"1.2.643.2.2.31.13": {
		"d": "tc26CipherB",
		"c": "TC26 params 1 for GOST 28147-89"
	},
	"1.2.643.2.2.31.14": {
		"d": "tc26CipherC",
		"c": "TC26 params 3 for GOST 28147-89"
	},
	"1.2.643.2.2.31.15": {
		"d": "tc26CipherD",
		"c": "TC26 params 4 for GOST 28147-89"
	},
	"1.2.643.2.2.31.16": {
		"d": "tc26CipherE",
		"c": "TC26 params 5 for GOST 28147-89"
	},
	"1.2.643.2.2.31.17": {
		"d": "tc26CipherF",
		"c": "TC26 params 6 for GOST 28147-89"
	},
	"1.2.643.7.1.2.5.1.1": {
		"d": "tc26CipherZ",
		"c": "TC26 params Z for GOST 28147-89"
	},
	"1.2.643.2.2.9": {
		"d": "gostDigest",
		"c": "GOST R 34.11-94 digest"
	},
	"1.2.643.2.2.30.0": {
		"d": "testDigestParams",
		"c": "Test params for GOST R 34.11-94"
	},
	"1.2.643.2.2.30.1": {
		"d": "cryptoProDigestA",
		"c": "CryptoPro digest params A (default, variant 'Verba-O') for GOST R 34.11-94"
	},
	"1.2.643.2.2.30.2": {
		"d": "cryptoProDigestB",
		"c": "CryptoPro digest params B (variant 1) for GOST R 34.11-94"
	},
	"1.2.643.2.2.30.3": {
		"d": "cryptoProDigestC",
		"c": "CryptoPro digest params C (variant 2) for GOST R 34.11-94"
	},
	"1.2.643.2.2.30.4": {
		"d": "cryptoProDigestD",
		"c": "CryptoPro digest params D (variant 3) for GOST R 34.11-94"
	},
	"1.2.643.2.2.32.2": {
		"d": "cryptoPro94SignA",
		"c": "CryptoPro sign params A (default, variant 'Verba-O') for GOST R 34.10-94"
	},
	"1.2.643.2.2.32.3": {
		"d": "cryptoPro94SignB",
		"c": "CryptoPro sign params B (variant 1) for GOST R 34.10-94"
	},
	"1.2.643.2.2.32.4": {
		"d": "cryptoPro94SignC",
		"c": "CryptoPro sign params C (variant 2) for GOST R 34.10-94"
	},
	"1.2.643.2.2.32.5": {
		"d": "cryptoPro94SignD",
		"c": "CryptoPro sign params D (variant 3) for GOST R 34.10-94"
	},
	"1.2.643.2.2.33.1": {
		"d": "cryptoPro94SignXA",
		"c": "CryptoPro sign params XA (variant 1) for GOST R 34.10-94"
	},
	"1.2.643.2.2.33.2": {
		"d": "cryptoPro94SignXB",
		"c": "CryptoPro sign params XB (variant 2) for GOST R 34.10-94"
	},
	"1.2.643.2.2.33.3": {
		"d": "cryptoPro94SignXC",
		"c": "CryptoPro sign params XC (variant 3) for GOST R 34.10-94"
	},
	"1.2.643.2.2.35.0": {
		"d": "testSignParams",
		"c": "Test elliptic curve for GOST R 34.10-2001"
	},
	"1.2.643.2.2.35.1": {
		"d": "cryptoProSignA",
		"c": "CryptoPro ell.curve A for GOST R 34.10-2001"
	},
	"1.2.643.2.2.35.2": {
		"d": "cryptoProSignB",
		"c": "CryptoPro ell.curve B for GOST R 34.10-2001"
	},
	"1.2.643.2.2.35.3": {
		"d": "cryptoProSignC",
		"c": "CryptoPro ell.curve C for GOST R 34.10-2001"
	},
	"1.2.643.2.2.36.0": {
		"d": "cryptoProSignXA",
		"c": "CryptoPro ell.curve XA for GOST R 34.10-2001"
	},
	"1.2.643.2.2.36.1": {
		"d": "cryptoProSignXB",
		"c": "CryptoPro ell.curve XB for GOST R 34.10-2001"
	},
	"1.2.643.7.1.2.1.1.1": {
		"d": "cryptoPro2012Sign256A",
		"c": "CryptoPro ell.curve A for GOST R 34.10-2012 256 bit"
	},
	"1.2.643.7.1.2.1.2.1": {
		"d": "cryptoPro2012Sign512A",
		"c": "CryptoPro ell.curve A (default) for GOST R 34.10-2012 512 bit"
	},
	"1.2.643.7.1.2.1.2.2": {
		"d": "cryptoPro2012Sign512B",
		"c": "CryptoPro ell.curve B for GOST R 34.10-2012 512 bit"
	},
	"1.2.643.7.1.2.1.2.3": {
		"d": "cryptoPro2012Sign512C",
		"c": "CryptoPro ell.curve C for GOST R 34.10-2012 512 bit"
	},
	"1.2.643.2.2.14.0": {
		"d": "nullMeshing",
		"c": "Do not mesh state of GOST 28147-89 cipher"
	},
	"1.2.643.2.2.14.1": {
		"d": "cryptoProMeshing",
		"c": "CryptoPro meshing of state of GOST 28147-89 cipher"
	},
	"1.2.643.2.2.10": {
		"d": "hmacGost",
		"c": "HMAC with GOST R 34.11-94"
	},
	"1.2.643.2.2.13.0": {
		"d": "gostWrap",
		"c": "Wrap key using GOST 28147-89 key"
	},
	"1.2.643.2.2.13.1": {
		"d": "cryptoProWrap",
		"c": "Wrap key using diversified GOST 28147-89 key"
	},
	"1.2.643.2.2.96": {
		"d": "cryptoProECDHWrap",
		"c": "Wrap key using ECC DH on GOST R 34.10-2001 keys (VKO)"
	},
	"1.2.643.7.1.1.1.1": {
		"d": "gost2012PublicKey256",
		"c": "GOST R 34.10-2012 256 bit public key"
	},
	"1.2.643.7.1.1.1.2": {
		"d": "gost2012PublicKey512",
		"c": "GOST R 34.10-2012 512 bit public key"
	},
	"1.2.643.7.1.1.2.2": {
		"d": "gost2012Digest256",
		"c": "GOST R 34.11-2012 256 bit digest"
	},
	"1.2.643.7.1.1.2.3": {
		"d": "gost2012Digest512",
		"c": "GOST R 34.11-2012 512 bit digest"
	},
	"1.2.643.7.1.1.3.2": {
		"d": "gost2012Signature256",
		"c": "GOST R 34.10-2012 256 bit signature"
	},
	"1.2.643.7.1.1.3.3": {
		"d": "gost2012Signature512",
		"c": "GOST R 34.10-2012 512 bit signature"
	},
	"1.2.643.7.1.1.6.1": {
		"d": "cryptoProECDH256",
		"c": "CryptoPro ECC DH algorithm for GOST R 34.10-2012 256 bit key"
	},
	"1.2.643.7.1.1.6.2": {
		"d": "cryptoProECDH512",
		"c": "CryptoPro ECC DH algorithm for GOST R 34.10-2012 512 bit key"
	},
	"1.2.752.34.1": {
		"d": "seis-cp",
		"c": "SEIS Project"
	},
	"1.2.752.34.1.1": {
		"d": "SEIS high-assurance policyIdentifier",
		"c": "SEIS Project certificate policies"
	},
	"1.2.752.34.1.2": {
		"d": "SEIS GAK policyIdentifier",
		"c": "SEIS Project certificate policies"
	},
	"1.2.752.34.2": {
		"d": "SEIS pe",
		"c": "SEIS Project"
	},
	"1.2.752.34.3": {
		"d": "SEIS at",
		"c": "SEIS Project"
	},
	"1.2.752.34.3.1": {
		"d": "SEIS at-personalIdentifier",
		"c": "SEIS Project attribute"
	},
	"1.2.840.10040.1": {
		"d": "module",
		"c": "ANSI X9.57"
	},
	"1.2.840.10040.1.1": {
		"d": "x9f1-cert-mgmt",
		"c": "ANSI X9.57 module"
	},
	"1.2.840.10040.2": {
		"d": "holdinstruction",
		"c": "ANSI X9.57"
	},
	"1.2.840.10040.2.1": {
		"d": "holdinstruction-none",
		"c": "ANSI X9.57 hold instruction"
	},
	"1.2.840.10040.2.2": {
		"d": "callissuer",
		"c": "ANSI X9.57 hold instruction"
	},
	"1.2.840.10040.2.3": {
		"d": "reject",
		"c": "ANSI X9.57 hold instruction"
	},
	"1.2.840.10040.2.4": {
		"d": "pickupToken",
		"c": "ANSI X9.57 hold instruction"
	},
	"1.2.840.10040.3": {
		"d": "attribute",
		"c": "ANSI X9.57"
	},
	"1.2.840.10040.3.1": {
		"d": "countersignature",
		"c": "ANSI X9.57 attribute"
	},
	"1.2.840.10040.3.2": {
		"d": "attribute-cert",
		"c": "ANSI X9.57 attribute"
	},
	"1.2.840.10040.4": {
		"d": "algorithm",
		"c": "ANSI X9.57"
	},
	"1.2.840.10040.4.1": {
		"d": "dsa",
		"c": "ANSI X9.57 algorithm"
	},
	"1.2.840.10040.4.2": {
		"d": "dsa-match",
		"c": "ANSI X9.57 algorithm"
	},
	"1.2.840.10040.4.3": {
		"d": "dsaWithSha1",
		"c": "ANSI X9.57 algorithm"
	},
	"1.2.840.10045.1": {
		"d": "fieldType",
		"c": "ANSI X9.62. This OID is also assigned as ecdsa-with-SHA1"
	},
	"1.2.840.10045.1.1": {
		"d": "prime-field",
		"c": "ANSI X9.62 field type"
	},
	"1.2.840.10045.1.2": {
		"d": "characteristic-two-field",
		"c": "ANSI X9.62 field type"
	},
	"1.2.840.10045.1.2.3": {
		"d": "characteristic-two-basis",
		"c": "ANSI X9.62 field type"
	},
	"1.2.840.10045.1.2.3.1": {
		"d": "onBasis",
		"c": "ANSI X9.62 field basis"
	},
	"1.2.840.10045.1.2.3.2": {
		"d": "tpBasis",
		"c": "ANSI X9.62 field basis"
	},
	"1.2.840.10045.1.2.3.3": {
		"d": "ppBasis",
		"c": "ANSI X9.62 field basis"
	},
	"1.2.840.10045.2": {
		"d": "publicKeyType",
		"c": "ANSI X9.62"
	},
	"1.2.840.10045.2.1": {
		"d": "ecPublicKey",
		"c": "ANSI X9.62 public key type"
	},
	"1.2.840.10045.3.0.1": {
		"d": "c2pnb163v1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.2": {
		"d": "c2pnb163v2",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.3": {
		"d": "c2pnb163v3",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.5": {
		"d": "c2tnb191v1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.6": {
		"d": "c2tnb191v2",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.7": {
		"d": "c2tnb191v3",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.10": {
		"d": "c2pnb208w1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.11": {
		"d": "c2tnb239v1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.12": {
		"d": "c2tnb239v2",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.13": {
		"d": "c2tnb239v3",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.16": {
		"d": "c2pnb272w1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.18": {
		"d": "c2tnb359v1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.19": {
		"d": "c2pnb368w1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.0.20": {
		"d": "c2tnb431r1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.1.1": {
		"d": "prime192v1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.1.2": {
		"d": "prime192v2",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.1.3": {
		"d": "prime192v3",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.1.4": {
		"d": "prime239v1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.1.5": {
		"d": "prime239v2",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.1.6": {
		"d": "prime239v3",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.3.1.7": {
		"d": "prime256v1",
		"c": "ANSI X9.62 named elliptic curve"
	},
	"1.2.840.10045.4.1": {
		"d": "ecdsaWithSHA1",
		"c": "ANSI X9.62 ECDSA algorithm with SHA1"
	},
	"1.2.840.10045.4.2": {
		"d": "ecdsaWithRecommended",
		"c": "ANSI X9.62 ECDSA algorithm with Recommended"
	},
	"1.2.840.10045.4.3": {
		"d": "ecdsaWithSpecified",
		"c": "ANSI X9.62 ECDSA algorithm with Specified"
	},
	"1.2.840.10045.4.3.1": {
		"d": "ecdsaWithSHA224",
		"c": "ANSI X9.62 ECDSA algorithm with SHA224"
	},
	"1.2.840.10045.4.3.2": {
		"d": "ecdsaWithSHA256",
		"c": "ANSI X9.62 ECDSA algorithm with SHA256"
	},
	"1.2.840.10045.4.3.3": {
		"d": "ecdsaWithSHA384",
		"c": "ANSI X9.62 ECDSA algorithm with SHA384"
	},
	"1.2.840.10045.4.3.4": {
		"d": "ecdsaWithSHA512",
		"c": "ANSI X9.62 ECDSA algorithm with SHA512"
	},
	"1.2.840.10046.1": {
		"d": "fieldType",
		"c": "ANSI X9.42"
	},
	"1.2.840.10046.1.1": {
		"d": "gf-prime",
		"c": "ANSI X9.42 field type"
	},
	"1.2.840.10046.2": {
		"d": "numberType",
		"c": "ANSI X9.42"
	},
	"1.2.840.10046.2.1": {
		"d": "dhPublicKey",
		"c": "ANSI X9.42 number type"
	},
	"1.2.840.10046.3": {
		"d": "scheme",
		"c": "ANSI X9.42"
	},
	"1.2.840.10046.3.1": {
		"d": "dhStatic",
		"c": "ANSI X9.42 scheme"
	},
	"1.2.840.10046.3.2": {
		"d": "dhEphem",
		"c": "ANSI X9.42 scheme"
	},
	"1.2.840.10046.3.3": {
		"d": "dhHybrid1",
		"c": "ANSI X9.42 scheme"
	},
	"1.2.840.10046.3.4": {
		"d": "dhHybrid2",
		"c": "ANSI X9.42 scheme"
	},
	"1.2.840.10046.3.5": {
		"d": "mqv2",
		"c": "ANSI X9.42 scheme"
	},
	"1.2.840.10046.3.6": {
		"d": "mqv1",
		"c": "ANSI X9.42 scheme"
	},
	"1.2.840.10065.2.2": {
		"d": "?",
		"c": "ASTM 31.20"
	},
	"1.2.840.10065.2.3": {
		"d": "healthcareLicense",
		"c": "ASTM 31.20"
	},
	"1.2.840.10065.2.3.1.1": {
		"d": "license?",
		"c": "ASTM 31.20 healthcare license type"
	},
	"1.2.840.10070": {
		"d": "iec62351",
		"c": "IEC 62351"
	},
	"1.2.840.10070.8": {
		"d": "iec62351_8",
		"c": "IEC 62351-8"
	},
	"1.2.840.10070.8.1": {
		"d": "iecUserRoles",
		"c": "IEC 62351-8"
	},
	"1.2.840.113533.7": {
		"d": "nsn",
		"c": ""
	},
	"1.2.840.113533.7.65": {
		"d": "nsn-ce",
		"c": ""
	},
	"1.2.840.113533.7.65.0": {
		"d": "entrustVersInfo",
		"c": "Nortel Secure Networks ce"
	},
	"1.2.840.113533.7.66": {
		"d": "nsn-alg",
		"c": ""
	},
	"1.2.840.113533.7.66.3": {
		"d": "cast3CBC",
		"c": "Nortel Secure Networks alg"
	},
	"1.2.840.113533.7.66.10": {
		"d": "cast5CBC",
		"c": "Nortel Secure Networks alg"
	},
	"1.2.840.113533.7.66.11": {
		"d": "cast5MAC",
		"c": "Nortel Secure Networks alg"
	},
	"1.2.840.113533.7.66.12": {
		"d": "pbeWithMD5AndCAST5-CBC",
		"c": "Nortel Secure Networks alg"
	},
	"1.2.840.113533.7.66.13": {
		"d": "passwordBasedMac",
		"c": "Nortel Secure Networks alg"
	},
	"1.2.840.113533.7.67": {
		"d": "nsn-oc",
		"c": ""
	},
	"1.2.840.113533.7.67.0": {
		"d": "entrustUser",
		"c": "Nortel Secure Networks oc"
	},
	"1.2.840.113533.7.68": {
		"d": "nsn-at",
		"c": ""
	},
	"1.2.840.113533.7.68.0": {
		"d": "entrustCAInfo",
		"c": "Nortel Secure Networks at"
	},
	"1.2.840.113533.7.68.10": {
		"d": "attributeCertificate",
		"c": "Nortel Secure Networks at"
	},
	"1.2.840.113549.1.1": {
		"d": "pkcs-1",
		"c": ""
	},
	"1.2.840.113549.1.1.1": {
		"d": "rsaEncryption",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.2": {
		"d": "md2WithRSAEncryption",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.3": {
		"d": "md4WithRSAEncryption",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.4": {
		"d": "md5WithRSAEncryption",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.5": {
		"d": "sha1WithRSAEncryption",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.7": {
		"d": "rsaOAEP",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.8": {
		"d": "pkcs1-MGF",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.9": {
		"d": "rsaOAEP-pSpecified",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.10": {
		"d": "rsaPSS",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.11": {
		"d": "sha256WithRSAEncryption",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.12": {
		"d": "sha384WithRSAEncryption",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.13": {
		"d": "sha512WithRSAEncryption",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.14": {
		"d": "sha224WithRSAEncryption",
		"c": "PKCS #1"
	},
	"1.2.840.113549.1.1.6": {
		"d": "rsaOAEPEncryptionSET",
		"c": "PKCS #1. This OID may also be assigned as ripemd160WithRSAEncryption"
	},
	"1.2.840.113549.1.2": {
		"d": "bsafeRsaEncr",
		"c": "Obsolete BSAFE OID",
		"w": true
	},
	"1.2.840.113549.1.3": {
		"d": "pkcs-3",
		"c": ""
	},
	"1.2.840.113549.1.3.1": {
		"d": "dhKeyAgreement",
		"c": "PKCS #3"
	},
	"1.2.840.113549.1.5": {
		"d": "pkcs-5",
		"c": ""
	},
	"1.2.840.113549.1.5.1": {
		"d": "pbeWithMD2AndDES-CBC",
		"c": "PKCS #5"
	},
	"1.2.840.113549.1.5.3": {
		"d": "pbeWithMD5AndDES-CBC",
		"c": "PKCS #5"
	},
	"1.2.840.113549.1.5.4": {
		"d": "pbeWithMD2AndRC2-CBC",
		"c": "PKCS #5"
	},
	"1.2.840.113549.1.5.6": {
		"d": "pbeWithMD5AndRC2-CBC",
		"c": "PKCS #5"
	},
	"1.2.840.113549.1.5.9": {
		"d": "pbeWithMD5AndXOR",
		"c": "PKCS #5, used in BSAFE only",
		"w": true
	},
	"1.2.840.113549.1.5.10": {
		"d": "pbeWithSHAAndDES-CBC",
		"c": "PKCS #5"
	},
	"1.2.840.113549.1.5.12": {
		"d": "pkcs5PBKDF2",
		"c": "PKCS #5 v2.0"
	},
	"1.2.840.113549.1.5.13": {
		"d": "pkcs5PBES2",
		"c": "PKCS #5 v2.0"
	},
	"1.2.840.113549.1.5.14": {
		"d": "pkcs5PBMAC1",
		"c": "PKCS #5 v2.0"
	},
	"1.2.840.113549.1.7": {
		"d": "pkcs-7",
		"c": ""
	},
	"1.2.840.113549.1.7.1": {
		"d": "data",
		"c": "PKCS #7"
	},
	"1.2.840.113549.1.7.2": {
		"d": "signedData",
		"c": "PKCS #7"
	},
	"1.2.840.113549.1.7.3": {
		"d": "envelopedData",
		"c": "PKCS #7"
	},
	"1.2.840.113549.1.7.4": {
		"d": "signedAndEnvelopedData",
		"c": "PKCS #7"
	},
	"1.2.840.113549.1.7.5": {
		"d": "digestedData",
		"c": "PKCS #7"
	},
	"1.2.840.113549.1.7.6": {
		"d": "encryptedData",
		"c": "PKCS #7"
	},
	"1.2.840.113549.1.7.7": {
		"d": "dataWithAttributes",
		"c": "PKCS #7 experimental",
		"w": true
	},
	"1.2.840.113549.1.7.8": {
		"d": "encryptedPrivateKeyInfo",
		"c": "PKCS #7 experimental",
		"w": true
	},
	"1.2.840.113549.1.9": {
		"d": "pkcs-9",
		"c": ""
	},
	"1.2.840.113549.1.9.1": {
		"d": "emailAddress",
		"c": "PKCS #9. Deprecated, use an altName extension instead"
	},
	"1.2.840.113549.1.9.2": {
		"d": "unstructuredName",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.3": {
		"d": "contentType",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.4": {
		"d": "messageDigest",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.5": {
		"d": "signingTime",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.6": {
		"d": "countersignature",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.7": {
		"d": "challengePassword",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.8": {
		"d": "unstructuredAddress",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.9": {
		"d": "extendedCertificateAttributes",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.10": {
		"d": "issuerAndSerialNumber",
		"c": "PKCS #9 experimental",
		"w": true
	},
	"1.2.840.113549.1.9.11": {
		"d": "passwordCheck",
		"c": "PKCS #9 experimental",
		"w": true
	},
	"1.2.840.113549.1.9.12": {
		"d": "publicKey",
		"c": "PKCS #9 experimental",
		"w": true
	},
	"1.2.840.113549.1.9.13": {
		"d": "signingDescription",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.14": {
		"d": "extensionRequest",
		"c": "PKCS #9 via CRMF"
	},
	"1.2.840.113549.1.9.15": {
		"d": "sMIMECapabilities",
		"c": "PKCS #9. This OID was formerly assigned as symmetricCapabilities, then reassigned as SMIMECapabilities, then renamed to the current name"
	},
	"1.2.840.113549.1.9.15.1": {
		"d": "preferSignedData",
		"c": "sMIMECapabilities"
	},
	"1.2.840.113549.1.9.15.2": {
		"d": "canNotDecryptAny",
		"c": "sMIMECapabilities"
	},
	"1.2.840.113549.1.9.15.3": {
		"d": "receiptRequest",
		"c": "sMIMECapabilities. Deprecated, use (1 2 840 113549 1 9 16 2 1) instead",
		"w": true
	},
	"1.2.840.113549.1.9.15.4": {
		"d": "receipt",
		"c": "sMIMECapabilities. Deprecated, use (1 2 840 113549 1 9 16 1 1) instead",
		"w": true
	},
	"1.2.840.113549.1.9.15.5": {
		"d": "contentHints",
		"c": "sMIMECapabilities. Deprecated, use (1 2 840 113549 1 9 16 2 4) instead",
		"w": true
	},
	"1.2.840.113549.1.9.15.6": {
		"d": "mlExpansionHistory",
		"c": "sMIMECapabilities. Deprecated, use (1 2 840 113549 1 9 16 2 3) instead",
		"w": true
	},
	"1.2.840.113549.1.9.16": {
		"d": "id-sMIME",
		"c": "PKCS #9"
	},
	"1.2.840.113549.1.9.16.0": {
		"d": "id-mod",
		"c": "id-sMIME"
	},
	"1.2.840.113549.1.9.16.0.1": {
		"d": "id-mod-cms",
		"c": "S/MIME Modules"
	},
	"1.2.840.113549.1.9.16.0.2": {
		"d": "id-mod-ess",
		"c": "S/MIME Modules"
	},
	"1.2.840.113549.1.9.16.0.3": {
		"d": "id-mod-oid",
		"c": "S/MIME Modules"
	},
	"1.2.840.113549.1.9.16.0.4": {
		"d": "id-mod-msg-v3",
		"c": "S/MIME Modules"
	},
	"1.2.840.113549.1.9.16.0.5": {
		"d": "id-mod-ets-eSignature-88",
		"c": "S/MIME Modules"
	},
	"1.2.840.113549.1.9.16.0.6": {
		"d": "id-mod-ets-eSignature-97",
		"c": "S/MIME Modules"
	},
	"1.2.840.113549.1.9.16.0.7": {
		"d": "id-mod-ets-eSigPolicy-88",
		"c": "S/MIME Modules"
	},
	"1.2.840.113549.1.9.16.0.8": {
		"d": "id-mod-ets-eSigPolicy-88",
		"c": "S/MIME Modules"
	},
	"1.2.840.113549.1.9.16.1": {
		"d": "contentType",
		"c": "S/MIME"
	},
	"1.2.840.113549.1.9.16.1.1": {
		"d": "receipt",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.2": {
		"d": "authData",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.3": {
		"d": "publishCert",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.4": {
		"d": "tSTInfo",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.5": {
		"d": "tDTInfo",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.6": {
		"d": "contentInfo",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.7": {
		"d": "dVCSRequestData",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.8": {
		"d": "dVCSResponseData",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.9": {
		"d": "compressedData",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.10": {
		"d": "scvpCertValRequest",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.11": {
		"d": "scvpCertValResponse",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.12": {
		"d": "scvpValPolRequest",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.13": {
		"d": "scvpValPolResponse",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.14": {
		"d": "attrCertEncAttrs",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.15": {
		"d": "tSReq",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.16": {
		"d": "firmwarePackage",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.17": {
		"d": "firmwareLoadReceipt",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.18": {
		"d": "firmwareLoadError",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.19": {
		"d": "contentCollection",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.20": {
		"d": "contentWithAttrs",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.21": {
		"d": "encKeyWithID",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.22": {
		"d": "encPEPSI",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.23": {
		"d": "authEnvelopedData",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.24": {
		"d": "routeOriginAttest",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.25": {
		"d": "symmetricKeyPackage",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.26": {
		"d": "rpkiManifest",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.27": {
		"d": "asciiTextWithCRLF",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.28": {
		"d": "xml",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.29": {
		"d": "pdf",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.30": {
		"d": "postscript",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.31": {
		"d": "timestampedData",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.32": {
		"d": "asAdjacencyAttest",
		"c": "S/MIME Content Types",
		"w": true
	},
	"1.2.840.113549.1.9.16.1.33": {
		"d": "rpkiTrustAnchor",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.1.34": {
		"d": "trustAnchorList",
		"c": "S/MIME Content Types"
	},
	"1.2.840.113549.1.9.16.2": {
		"d": "authenticatedAttributes",
		"c": "S/MIME"
	},
	"1.2.840.113549.1.9.16.2.1": {
		"d": "receiptRequest",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.2": {
		"d": "securityLabel",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.3": {
		"d": "mlExpandHistory",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.4": {
		"d": "contentHint",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.5": {
		"d": "msgSigDigest",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.6": {
		"d": "encapContentType",
		"c": "S/MIME Authenticated Attributes.  Obsolete",
		"w": true
	},
	"1.2.840.113549.1.9.16.2.7": {
		"d": "contentIdentifier",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.8": {
		"d": "macValue",
		"c": "S/MIME Authenticated Attributes.  Obsolete",
		"w": true
	},
	"1.2.840.113549.1.9.16.2.9": {
		"d": "equivalentLabels",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.10": {
		"d": "contentReference",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.11": {
		"d": "encrypKeyPref",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.12": {
		"d": "signingCertificate",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.13": {
		"d": "smimeEncryptCerts",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.14": {
		"d": "timeStampToken",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.15": {
		"d": "sigPolicyId",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.16": {
		"d": "commitmentType",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.17": {
		"d": "signerLocation",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.18": {
		"d": "signerAttr",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.19": {
		"d": "otherSigCert",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.20": {
		"d": "contentTimestamp",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.21": {
		"d": "certificateRefs",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.22": {
		"d": "revocationRefs",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.23": {
		"d": "certValues",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.24": {
		"d": "revocationValues",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.25": {
		"d": "escTimeStamp",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.26": {
		"d": "certCRLTimestamp",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.27": {
		"d": "archiveTimeStamp",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.28": {
		"d": "signatureType",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.29": {
		"d": "dvcsDvc",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.30": {
		"d": "cekReference",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.31": {
		"d": "maxCEKDecrypts",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.32": {
		"d": "kekDerivationAlg",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.33": {
		"d": "intendedRecipients",
		"c": "S/MIME Authenticated Attributes.  Obsolete",
		"w": true
	},
	"1.2.840.113549.1.9.16.2.34": {
		"d": "cmcUnsignedData",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.35": {
		"d": "fwPackageID",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.36": {
		"d": "fwTargetHardwareIDs",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.37": {
		"d": "fwDecryptKeyID",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.38": {
		"d": "fwImplCryptAlgs",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.39": {
		"d": "fwWrappedFirmwareKey",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.40": {
		"d": "fwCommunityIdentifiers",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.41": {
		"d": "fwPkgMessageDigest",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.42": {
		"d": "fwPackageInfo",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.43": {
		"d": "fwImplCompressAlgs",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.44": {
		"d": "etsAttrCertificateRefs",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.45": {
		"d": "etsAttrRevocationRefs",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.46": {
		"d": "binarySigningTime",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.47": {
		"d": "signingCertificateV2",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.48": {
		"d": "etsArchiveTimeStampV2",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.49": {
		"d": "erInternal",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.50": {
		"d": "erExternal",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.2.51": {
		"d": "multipleSignatures",
		"c": "S/MIME Authenticated Attributes"
	},
	"1.2.840.113549.1.9.16.3.1": {
		"d": "esDHwith3DES",
		"c": "S/MIME Algorithms. Obsolete",
		"w": true
	},
	"1.2.840.113549.1.9.16.3.2": {
		"d": "esDHwithRC2",
		"c": "S/MIME Algorithms. Obsolete",
		"w": true
	},
	"1.2.840.113549.1.9.16.3.3": {
		"d": "3desWrap",
		"c": "S/MIME Algorithms. Obsolete",
		"w": true
	},
	"1.2.840.113549.1.9.16.3.4": {
		"d": "rc2Wrap",
		"c": "S/MIME Algorithms. Obsolete",
		"w": true
	},
	"1.2.840.113549.1.9.16.3.5": {
		"d": "esDH",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.6": {
		"d": "cms3DESwrap",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.7": {
		"d": "cmsRC2wrap",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.8": {
		"d": "zlib",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.9": {
		"d": "pwriKEK",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.10": {
		"d": "ssDH",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.11": {
		"d": "hmacWith3DESwrap",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.12": {
		"d": "hmacWithAESwrap",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.13": {
		"d": "md5XorExperiment",
		"c": "S/MIME Algorithms.  Experimental",
		"w": true
	},
	"1.2.840.113549.1.9.16.3.14": {
		"d": "rsaKEM",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.15": {
		"d": "authEnc128",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.16": {
		"d": "authEnc256",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.17": {
		"d": "hssLmsHashSig",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.18": {
		"d": "chaCha20Poly1305",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.19": {
		"d": "ecdhHKDF-SHA256",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.20": {
		"d": "ecdhHKDF-SHA384",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.21": {
		"d": "ecdhHKDF-SHA512",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.22": {
		"d": "aesSIV-CMAC-256",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.23": {
		"d": "aesSIV-CMAC-384",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.24": {
		"d": "aesSIV-CMAC-512",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.25": {
		"d": "aesSIV-CMAC-wrap256",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.26": {
		"d": "aesSIV-CMAC-wrap384",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.27": {
		"d": "aesSIV-CMAC-wrap512",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.28": {
		"d": "hkdfWithSha256",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.29": {
		"d": "hkdfWithSha384",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.3.30": {
		"d": "hkdfWithSha512",
		"c": "S/MIME Algorithms"
	},
	"1.2.840.113549.1.9.16.4.1": {
		"d": "certDist-ldap",
		"c": "S/MIME Certificate Distribution"
	},
	"1.2.840.113549.1.9.16.5.1": {
		"d": "sigPolicyQualifier-spuri x",
		"c": "S/MIME Signature Policy Qualifiers"
	},
	"1.2.840.113549.1.9.16.5.2": {
		"d": "sigPolicyQualifier-spUserNotice",
		"c": "S/MIME Signature Policy Qualifiers"
	},
	"1.2.840.113549.1.9.16.6.1": {
		"d": "proofOfOrigin",
		"c": "S/MIME Commitment Type Identifiers"
	},
	"1.2.840.113549.1.9.16.6.2": {
		"d": "proofOfReceipt",
		"c": "S/MIME Commitment Type Identifiers"
	},
	"1.2.840.113549.1.9.16.6.3": {
		"d": "proofOfDelivery",
		"c": "S/MIME Commitment Type Identifiers"
	},
	"1.2.840.113549.1.9.16.6.4": {
		"d": "proofOfSender",
		"c": "S/MIME Commitment Type Identifiers"
	},
	"1.2.840.113549.1.9.16.6.5": {
		"d": "proofOfApproval",
		"c": "S/MIME Commitment Type Identifiers"
	},
	"1.2.840.113549.1.9.16.6.6": {
		"d": "proofOfCreation",
		"c": "S/MIME Commitment Type Identifiers"
	},
	"1.2.840.113549.1.9.16.8.1": {
		"d": "glUseKEK",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.2": {
		"d": "glDelete",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.3": {
		"d": "glAddMember",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.4": {
		"d": "glDeleteMember",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.5": {
		"d": "glRekey",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.6": {
		"d": "glAddOwner",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.7": {
		"d": "glRemoveOwner",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.8": {
		"d": "glkCompromise",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.9": {
		"d": "glkRefresh",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.10": {
		"d": "glFailInfo",
		"c": "S/MIME Symmetric Key Distribution Attributes.  Obsolete",
		"w": true
	},
	"1.2.840.113549.1.9.16.8.11": {
		"d": "glaQueryRequest",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.12": {
		"d": "glaQueryResponse",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.13": {
		"d": "glProvideCert",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.14": {
		"d": "glUpdateCert",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.8.15": {
		"d": "glKey",
		"c": "S/MIME Symmetric Key Distribution Attributes"
	},
	"1.2.840.113549.1.9.16.9": {
		"d": "signatureTypeIdentifier",
		"c": "S/MIME"
	},
	"1.2.840.113549.1.9.16.9.1": {
		"d": "originatorSig",
		"c": "S/MIME Signature Type Identifier"
	},
	"1.2.840.113549.1.9.16.9.2": {
		"d": "domainSig",
		"c": "S/MIME Signature Type Identifier"
	},
	"1.2.840.113549.1.9.16.9.3": {
		"d": "additionalAttributesSig",
		"c": "S/MIME Signature Type Identifier"
	},
	"1.2.840.113549.1.9.16.9.4": {
		"d": "reviewSig",
		"c": "S/MIME Signature Type Identifier"
	},
	"1.2.840.113549.1.9.16.11": {
		"d": "capabilities",
		"c": "S/MIME"
	},
	"1.2.840.113549.1.9.16.11.1": {
		"d": "preferBinaryInside",
		"c": "S/MIME Capability"
	},
	"1.2.840.113549.1.9.16.12": {
		"d": "pskcAttributes",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.1": {
		"d": "pskcManufacturer",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.2": {
		"d": "pskcSerialNo",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.3": {
		"d": "pskcModel",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.4": {
		"d": "pskcIssueno",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.5": {
		"d": "pskcDevicebinding",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.6": {
		"d": "pskcDevicestartdate",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.7": {
		"d": "pskcDeviceexpirydate",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.8": {
		"d": "pskcModuleid",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.9": {
		"d": "pskcKeyid",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.10": {
		"d": "pskcAlgorithm",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.11": {
		"d": "pskcIssuer",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.12": {
		"d": "pskcKeyprofileid",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.13": {
		"d": "pskcKeyreference",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.14": {
		"d": "pskcFriendlyname",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.15": {
		"d": "pskcAlgorithmparams",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.16": {
		"d": "pskcCounter",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.17": {
		"d": "pskcTime",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.18": {
		"d": "pskcTimeinterval",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.19": {
		"d": "pskcTimedrift",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.20": {
		"d": "pskcValuemac",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.21": {
		"d": "pskcKeystartdate",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.22": {
		"d": "pskcKeyexpirydate",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.23": {
		"d": "pskcNooftransactions",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.24": {
		"d": "pskcKeyusages",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.25": {
		"d": "pskcPinpolicy",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.26": {
		"d": "pskcDeviceuserid",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.16.12.27": {
		"d": "pskcKeyuserid",
		"c": "S/MIME Portable Symmetric Key Container Attributes"
	},
	"1.2.840.113549.1.9.20": {
		"d": "friendlyName (for PKCS #12)",
		"c": "PKCS #9 via PKCS #12"
	},
	"1.2.840.113549.1.9.21": {
		"d": "localKeyID (for PKCS #12)",
		"c": "PKCS #9 via PKCS #12"
	},
	"1.2.840.113549.1.9.22": {
		"d": "certTypes (for PKCS #12)",
		"c": "PKCS #9 via PKCS #12"
	},
	"1.2.840.113549.1.9.22.1": {
		"d": "x509Certificate (for PKCS #12)",
		"c": "PKCS #9 via PKCS #12"
	},
	"1.2.840.113549.1.9.22.2": {
		"d": "sdsiCertificate (for PKCS #12)",
		"c": "PKCS #9 via PKCS #12"
	},
	"1.2.840.113549.1.9.23": {
		"d": "crlTypes (for PKCS #12)",
		"c": "PKCS #9 via PKCS #12"
	},
	"1.2.840.113549.1.9.23.1": {
		"d": "x509Crl (for PKCS #12)",
		"c": "PKCS #9 via PKCS #12"
	},
	"1.2.840.113549.1.9.24": {
		"d": "pkcs9objectClass",
		"c": "PKCS #9/RFC 2985"
	},
	"1.2.840.113549.1.9.25": {
		"d": "pkcs9attributes",
		"c": "PKCS #9/RFC 2985"
	},
	"1.2.840.113549.1.9.25.1": {
		"d": "pkcs15Token",
		"c": "PKCS #9/RFC 2985 attribute"
	},
	"1.2.840.113549.1.9.25.2": {
		"d": "encryptedPrivateKeyInfo",
		"c": "PKCS #9/RFC 2985 attribute"
	},
	"1.2.840.113549.1.9.25.3": {
		"d": "randomNonce",
		"c": "PKCS #9/RFC 2985 attribute"
	},
	"1.2.840.113549.1.9.25.4": {
		"d": "sequenceNumber",
		"c": "PKCS #9/RFC 2985 attribute"
	},
	"1.2.840.113549.1.9.25.5": {
		"d": "pkcs7PDU",
		"c": "PKCS #9/RFC 2985 attribute"
	},
	"1.2.840.113549.1.9.26": {
		"d": "pkcs9syntax",
		"c": "PKCS #9/RFC 2985"
	},
	"1.2.840.113549.1.9.27": {
		"d": "pkcs9matchingRules",
		"c": "PKCS #9/RFC 2985"
	},
	"1.2.840.113549.1.9.52": {
		"d": "cmsAlgorithmProtection",
		"c": "RFC 6211"
	},
	"1.2.840.113549.1.12": {
		"d": "pkcs-12",
		"c": ""
	},
	"1.2.840.113549.1.12.1": {
		"d": "pkcs-12-PbeIds",
		"c": "This OID was formerly assigned as PKCS #12 modeID"
	},
	"1.2.840.113549.1.12.1.1": {
		"d": "pbeWithSHAAnd128BitRC4",
		"c": "PKCS #12 PbeIds. This OID was formerly assigned as pkcs-12-OfflineTransportMode"
	},
	"1.2.840.113549.1.12.1.2": {
		"d": "pbeWithSHAAnd40BitRC4",
		"c": "PKCS #12 PbeIds. This OID was formerly assigned as pkcs-12-OnlineTransportMode"
	},
	"1.2.840.113549.1.12.1.3": {
		"d": "pbeWithSHAAnd3-KeyTripleDES-CBC",
		"c": "PKCS #12 PbeIds"
	},
	"1.2.840.113549.1.12.1.4": {
		"d": "pbeWithSHAAnd2-KeyTripleDES-CBC",
		"c": "PKCS #12 PbeIds"
	},
	"1.2.840.113549.1.12.1.5": {
		"d": "pbeWithSHAAnd128BitRC2-CBC",
		"c": "PKCS #12 PbeIds"
	},
	"1.2.840.113549.1.12.1.6": {
		"d": "pbeWithSHAAnd40BitRC2-CBC",
		"c": "PKCS #12 PbeIds"
	},
	"1.2.840.113549.1.12.2": {
		"d": "pkcs-12-ESPVKID",
		"c": "Deprecated",
		"w": true
	},
	"1.2.840.113549.1.12.2.1": {
		"d": "pkcs-12-PKCS8KeyShrouding",
		"c": "PKCS #12 ESPVKID. Deprecated, use (1 2 840 113549 1 12 3 5) instead",
		"w": true
	},
	"1.2.840.113549.1.12.3": {
		"d": "pkcs-12-BagIds",
		"c": ""
	},
	"1.2.840.113549.1.12.3.1": {
		"d": "pkcs-12-keyBagId",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.3.2": {
		"d": "pkcs-12-certAndCRLBagId",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.3.3": {
		"d": "pkcs-12-secretBagId",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.3.4": {
		"d": "pkcs-12-safeContentsId",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.3.5": {
		"d": "pkcs-12-pkcs-8ShroudedKeyBagId",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.4": {
		"d": "pkcs-12-CertBagID",
		"c": "Deprecated",
		"w": true
	},
	"1.2.840.113549.1.12.4.1": {
		"d": "pkcs-12-X509CertCRLBagID",
		"c": "PKCS #12 CertBagID. This OID was formerly assigned as pkcs-12-X509CertCRLBag"
	},
	"1.2.840.113549.1.12.4.2": {
		"d": "pkcs-12-SDSICertBagID",
		"c": "PKCS #12 CertBagID. This OID was formerly assigned as pkcs-12-SDSICertBag"
	},
	"1.2.840.113549.1.12.5": {
		"d": "pkcs-12-OID",
		"c": "",
		"w": true
	},
	"1.2.840.113549.1.12.5.1": {
		"d": "pkcs-12-PBEID",
		"c": "PKCS #12 OID. Deprecated, use the partially compatible (1 2 840 113549 1 12 1) OIDs instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.1.1": {
		"d": "pkcs-12-PBEWithSha1And128BitRC4",
		"c": "PKCS #12 OID PBEID. Deprecated, use (1 2 840 113549 1 12 1 1) instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.1.2": {
		"d": "pkcs-12-PBEWithSha1And40BitRC4",
		"c": "PKCS #12 OID PBEID. Deprecated, use (1 2 840 113549 1 12 1 2) instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.1.3": {
		"d": "pkcs-12-PBEWithSha1AndTripleDESCBC",
		"c": "PKCS #12 OID PBEID. Deprecated, use the incompatible but similar (1 2 840 113549 1 12 1 3) or (1 2 840 113549 1 12 1 4) instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.1.4": {
		"d": "pkcs-12-PBEWithSha1And128BitRC2CBC",
		"c": "PKCS #12 OID PBEID. Deprecated, use (1 2 840 113549 1 12 1 5) instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.1.5": {
		"d": "pkcs-12-PBEWithSha1And40BitRC2CBC",
		"c": "PKCS #12 OID PBEID. Deprecated, use (1 2 840 113549 1 12 1 6) instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.1.6": {
		"d": "pkcs-12-PBEWithSha1AndRC4",
		"c": "PKCS #12 OID PBEID. Deprecated, use the incompatible but similar (1 2 840 113549 1 12 1 1) or (1 2 840 113549 1 12 1 2) instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.1.7": {
		"d": "pkcs-12-PBEWithSha1AndRC2CBC",
		"c": "PKCS #12 OID PBEID. Deprecated, use the incompatible but similar (1 2 840 113549 1 12 1 5) or (1 2 840 113549 1 12 1 6) instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.2": {
		"d": "pkcs-12-EnvelopingID",
		"c": "PKCS #12 OID. Deprecated, use the conventional PKCS #1 OIDs instead"
	},
	"1.2.840.113549.1.12.5.2.1": {
		"d": "pkcs-12-RSAEncryptionWith128BitRC4",
		"c": "PKCS #12 OID EnvelopingID. Deprecated, use the conventional PKCS #1 OIDs instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.2.2": {
		"d": "pkcs-12-RSAEncryptionWith40BitRC4",
		"c": "PKCS #12 OID EnvelopingID. Deprecated, use the conventional PKCS #1 OIDs instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.2.3": {
		"d": "pkcs-12-RSAEncryptionWithTripleDES",
		"c": "PKCS #12 OID EnvelopingID. Deprecated, use the conventional PKCS #1 OIDs instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.3": {
		"d": "pkcs-12-SignatureID",
		"c": "PKCS #12 OID EnvelopingID. Deprecated, use the conventional PKCS #1 OIDs instead",
		"w": true
	},
	"1.2.840.113549.1.12.5.3.1": {
		"d": "pkcs-12-RSASignatureWithSHA1Digest",
		"c": "PKCS #12 OID SignatureID. Deprecated, use the conventional PKCS #1 OIDs instead",
		"w": true
	},
	"1.2.840.113549.1.12.10": {
		"d": "pkcs-12Version1",
		"c": ""
	},
	"1.2.840.113549.1.12.10.1": {
		"d": "pkcs-12BadIds",
		"c": ""
	},
	"1.2.840.113549.1.12.10.1.1": {
		"d": "pkcs-12-keyBag",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.10.1.2": {
		"d": "pkcs-12-pkcs-8ShroudedKeyBag",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.10.1.3": {
		"d": "pkcs-12-certBag",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.10.1.4": {
		"d": "pkcs-12-crlBag",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.10.1.5": {
		"d": "pkcs-12-secretBag",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.12.10.1.6": {
		"d": "pkcs-12-safeContentsBag",
		"c": "PKCS #12 BagIds"
	},
	"1.2.840.113549.1.15.1": {
		"d": "pkcs15modules",
		"c": "PKCS #15"
	},
	"1.2.840.113549.1.15.2": {
		"d": "pkcs15attributes",
		"c": "PKCS #15"
	},
	"1.2.840.113549.1.15.3": {
		"d": "pkcs15contentType",
		"c": "PKCS #15"
	},
	"1.2.840.113549.1.15.3.1": {
		"d": "pkcs15content",
		"c": "PKCS #15 content type"
	},
	"1.2.840.113549.2": {
		"d": "digestAlgorithm",
		"c": ""
	},
	"1.2.840.113549.2.2": {
		"d": "md2",
		"c": "RSADSI digestAlgorithm"
	},
	"1.2.840.113549.2.4": {
		"d": "md4",
		"c": "RSADSI digestAlgorithm"
	},
	"1.2.840.113549.2.5": {
		"d": "md5",
		"c": "RSADSI digestAlgorithm"
	},
	"1.2.840.113549.2.7": {
		"d": "hmacWithSHA1",
		"c": "RSADSI digestAlgorithm"
	},
	"1.2.840.113549.2.8": {
		"d": "hmacWithSHA224",
		"c": "RSADSI digestAlgorithm"
	},
	"1.2.840.113549.2.9": {
		"d": "hmacWithSHA256",
		"c": "RSADSI digestAlgorithm"
	},
	"1.2.840.113549.2.10": {
		"d": "hmacWithSHA384",
		"c": "RSADSI digestAlgorithm"
	},
	"1.2.840.113549.2.11": {
		"d": "hmacWithSHA512",
		"c": "RSADSI digestAlgorithm"
	},
	"1.2.840.113549.3": {
		"d": "encryptionAlgorithm",
		"c": ""
	},
	"1.2.840.113549.3.2": {
		"d": "rc2CBC",
		"c": "RSADSI encryptionAlgorithm"
	},
	"1.2.840.113549.3.3": {
		"d": "rc2ECB",
		"c": "RSADSI encryptionAlgorithm"
	},
	"1.2.840.113549.3.4": {
		"d": "rc4",
		"c": "RSADSI encryptionAlgorithm"
	},
	"1.2.840.113549.3.5": {
		"d": "rc4WithMAC",
		"c": "RSADSI encryptionAlgorithm"
	},
	"1.2.840.113549.3.6": {
		"d": "desx-CBC",
		"c": "RSADSI encryptionAlgorithm"
	},
	"1.2.840.113549.3.7": {
		"d": "des-EDE3-CBC",
		"c": "RSADSI encryptionAlgorithm"
	},
	"1.2.840.113549.3.8": {
		"d": "rc5CBC",
		"c": "RSADSI encryptionAlgorithm"
	},
	"1.2.840.113549.3.9": {
		"d": "rc5-CBCPad",
		"c": "RSADSI encryptionAlgorithm"
	},
	"1.2.840.113549.3.10": {
		"d": "desCDMF",
		"c": "RSADSI encryptionAlgorithm. Formerly called CDMFCBCPad"
	},
	"1.2.840.114021.1.6.1": {
		"d": "Identrus unknown policyIdentifier",
		"c": "Identrus"
	},
	"1.2.840.114021.4.1": {
		"d": "identrusOCSP",
		"c": "Identrus"
	},
	"1.2.840.113556.1.2.241": {
		"d": "deliveryMechanism",
		"c": "Microsoft Exchange Server - attribute"
	},
	"1.2.840.113556.1.2.281": {
		"d": "ntSecurityDescriptor",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.3.0": {
		"d": "site-Addressing",
		"c": "Microsoft Exchange Server - object class"
	},
	"1.2.840.113556.1.3.13": {
		"d": "classSchema",
		"c": "Microsoft Exchange Server - object class"
	},
	"1.2.840.113556.1.3.14": {
		"d": "attributeSchema",
		"c": "Microsoft Exchange Server - object class"
	},
	"1.2.840.113556.1.3.17": {
		"d": "mailbox-Agent",
		"c": "Microsoft Exchange Server - object class"
	},
	"1.2.840.113556.1.3.22": {
		"d": "mailbox",
		"c": "Microsoft Exchange Server - object class"
	},
	"1.2.840.113556.1.3.23": {
		"d": "container",
		"c": "Microsoft Exchange Server - object class"
	},
	"1.2.840.113556.1.3.46": {
		"d": "mailRecipient",
		"c": "Microsoft Exchange Server - object class"
	},
	"1.2.840.113556.1.4.145": {
		"d": "revision",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1327": {
		"d": "pKIDefaultKeySpec",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1328": {
		"d": "pKIKeyUsage",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1329": {
		"d": "pKIMaxIssuingDepth",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1330": {
		"d": "pKICriticalExtensions",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1331": {
		"d": "pKIExpirationPeriod",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1332": {
		"d": "pKIOverlapPeriod",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1333": {
		"d": "pKIExtendedKeyUsage",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1334": {
		"d": "pKIDefaultCSPs",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1335": {
		"d": "pKIEnrollmentAccess",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1429": {
		"d": "msPKI-RA-Signature",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1430": {
		"d": "msPKI-Enrollment-Flag",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1431": {
		"d": "msPKI-Private-Key-Flag",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1432": {
		"d": "msPKI-Certificate-Name-Flag",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1433": {
		"d": "msPKI-Minimal-Key-Size",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1434": {
		"d": "msPKI-Template-Schema-Version",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1435": {
		"d": "msPKI-Template-Minor-Revision",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1436": {
		"d": "msPKI-Cert-Template-OID",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1437": {
		"d": "msPKI-Supersede-Templates",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1438": {
		"d": "msPKI-RA-Policies",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1439": {
		"d": "msPKI-Certificate-Policy",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1674": {
		"d": "msPKI-Certificate-Application-Policy",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.1.4.1675": {
		"d": "msPKI-RA-Application-Policies",
		"c": "Microsoft Cert Template - attribute"
	},
	"1.2.840.113556.4.3": {
		"d": "microsoftExcel",
		"c": "Microsoft"
	},
	"1.2.840.113556.4.4": {
		"d": "titledWithOID",
		"c": "Microsoft"
	},
	"1.2.840.113556.4.5": {
		"d": "microsoftPowerPoint",
		"c": "Microsoft"
	},
	"1.2.840.113583.1": {
		"d": "adobeAcrobat",
		"c": "Adobe Acrobat"
	},
	"1.2.840.113583.1.1": {
		"d": "acrobatSecurity",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.1": {
		"d": "pdfPassword",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.2": {
		"d": "pdfDefaultSigningCredential",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.3": {
		"d": "pdfDefaultEncryptionCredential",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.4": {
		"d": "pdfPasswordTimeout",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.5": {
		"d": "pdfAuthenticDocumentsTrust",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.6": {
		"d": "pdfDynamicContentTrust",
		"c": "Adobe Acrobat security",
		"w": true
	},
	"1.2.840.113583.1.1.7": {
		"d": "pdfUbiquityTrust",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.8": {
		"d": "pdfRevocationInfoArchival",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.9": {
		"d": "pdfX509Extension",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.9.1": {
		"d": "pdfTimeStamp",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.9.2": {
		"d": "pdfArchiveRevInfo",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.1.10": {
		"d": "pdfPPLKLiteCredential",
		"c": "Adobe Acrobat security"
	},
	"1.2.840.113583.1.2": {
		"d": "acrobatCPS",
		"c": "Adobe Acrobat CPS"
	},
	"1.2.840.113583.1.2.1": {
		"d": "pdfAuthenticDocumentsCPS",
		"c": "Adobe Acrobat CPS"
	},
	"1.2.840.113583.1.2.2": {
		"d": "pdfTestCPS",
		"c": "Adobe Acrobat CPS"
	},
	"1.2.840.113583.1.2.3": {
		"d": "pdfUbiquityCPS",
		"c": "Adobe Acrobat CPS"
	},
	"1.2.840.113583.1.2.4": {
		"d": "pdfAdhocCPS",
		"c": "Adobe Acrobat CPS"
	},
	"1.2.840.113583.1.7": {
		"d": "acrobatUbiquity",
		"c": "Adobe Acrobat ubiquity"
	},
	"1.2.840.113583.1.7.1": {
		"d": "pdfUbiquitySubRights",
		"c": "Adobe Acrobat ubiquity"
	},
	"1.2.840.113583.1.9": {
		"d": "acrobatExtension",
		"c": "Adobe Acrobat X.509 extension"
	},
	"1.2.840.113628.114.1.7": {
		"d": "adobePKCS7",
		"c": "Adobe"
	},
	"1.2.840.113635.100": {
		"d": "appleDataSecurity",
		"c": "Apple"
	},
	"1.2.840.113635.100.1": {
		"d": "appleTrustPolicy",
		"c": "Apple"
	},
	"1.2.840.113635.100.1.1": {
		"d": "appleISignTP",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.2": {
		"d": "appleX509Basic",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.3": {
		"d": "appleSSLPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.4": {
		"d": "appleLocalCertGenPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.5": {
		"d": "appleCSRGenPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.6": {
		"d": "appleCRLPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.7": {
		"d": "appleOCSPPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.8": {
		"d": "appleSMIMEPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.9": {
		"d": "appleEAPPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.10": {
		"d": "appleSWUpdateSigningPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.11": {
		"d": "appleIPSecPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.12": {
		"d": "appleIChatPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.13": {
		"d": "appleResourceSignPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.14": {
		"d": "applePKINITClientPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.15": {
		"d": "applePKINITServerPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.16": {
		"d": "appleCodeSigningPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.1.17": {
		"d": "applePackageSigningPolicy",
		"c": "Apple trust policy"
	},
	"1.2.840.113635.100.2": {
		"d": "appleSecurityAlgorithm",
		"c": "Apple"
	},
	"1.2.840.113635.100.2.1": {
		"d": "appleFEE",
		"c": "Apple security algorithm"
	},
	"1.2.840.113635.100.2.2": {
		"d": "appleASC",
		"c": "Apple security algorithm"
	},
	"1.2.840.113635.100.2.3": {
		"d": "appleFEE_MD5",
		"c": "Apple security algorithm"
	},
	"1.2.840.113635.100.2.4": {
		"d": "appleFEE_SHA1",
		"c": "Apple security algorithm"
	},
	"1.2.840.113635.100.2.5": {
		"d": "appleFEED",
		"c": "Apple security algorithm"
	},
	"1.2.840.113635.100.2.6": {
		"d": "appleFEEDEXP",
		"c": "Apple security algorithm"
	},
	"1.2.840.113635.100.2.7": {
		"d": "appleECDSA",
		"c": "Apple security algorithm"
	},
	"1.2.840.113635.100.3": {
		"d": "appleDotMacCertificate",
		"c": "Apple"
	},
	"1.2.840.113635.100.3.1": {
		"d": "appleDotMacCertificateRequest",
		"c": "Apple dotMac certificate"
	},
	"1.2.840.113635.100.3.2": {
		"d": "appleDotMacCertificateExtension",
		"c": "Apple dotMac certificate"
	},
	"1.2.840.113635.100.3.3": {
		"d": "appleDotMacCertificateRequestValues",
		"c": "Apple dotMac certificate"
	},
	"1.2.840.113635.100.4": {
		"d": "appleExtendedKeyUsage",
		"c": "Apple"
	},
	"1.2.840.113635.100.4.1": {
		"d": "appleCodeSigning",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.1.1": {
		"d": "appleCodeSigningDevelopment",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.1.2": {
		"d": "appleSoftwareUpdateSigning",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.1.3": {
		"d": "appleCodeSigningThirdParty",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.1.4": {
		"d": "appleResourceSigning",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.2": {
		"d": "appleIChatSigning",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.3": {
		"d": "appleIChatEncryption",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.4": {
		"d": "appleSystemIdentity",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.5": {
		"d": "appleCryptoEnv",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.5.1": {
		"d": "appleCryptoProductionEnv",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.5.2": {
		"d": "appleCryptoMaintenanceEnv",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.5.3": {
		"d": "appleCryptoTestEnv",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.5.4": {
		"d": "appleCryptoDevelopmentEnv",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.6": {
		"d": "appleCryptoQoS",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.6.1": {
		"d": "appleCryptoTier0QoS",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.6.2": {
		"d": "appleCryptoTier1QoS",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.6.3": {
		"d": "appleCryptoTier2QoS",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.4.6.4": {
		"d": "appleCryptoTier3QoS",
		"c": "Apple extended key usage"
	},
	"1.2.840.113635.100.5": {
		"d": "appleCertificatePolicies",
		"c": "Apple"
	},
	"1.2.840.113635.100.5.1": {
		"d": "appleCertificatePolicyID",
		"c": "Apple"
	},
	"1.2.840.113635.100.5.2": {
		"d": "appleDotMacCertificatePolicyID",
		"c": "Apple"
	},
	"1.2.840.113635.100.5.3": {
		"d": "appleADCCertificatePolicyID",
		"c": "Apple"
	},
	"1.2.840.113635.100.6": {
		"d": "appleCertificateExtensions",
		"c": "Apple"
	},
	"1.2.840.113635.100.6.1": {
		"d": "appleCertificateExtensionCodeSigning",
		"c": "Apple certificate extension"
	},
	"1.2.840.113635.100.6.1.1": {
		"d": "appleCertificateExtensionAppleSigning",
		"c": "Apple certificate extension"
	},
	"1.2.840.113635.100.6.1.2": {
		"d": "appleCertificateExtensionADCDeveloperSigning",
		"c": "Apple certificate extension"
	},
	"1.2.840.113635.100.6.1.3": {
		"d": "appleCertificateExtensionADCAppleSigning",
		"c": "Apple certificate extension"
	},
	"1.3.6.1.4.1.311.2.1.4": {
		"d": "spcIndirectDataContext",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.1.10": {
		"d": "spcAgencyInfo",
		"c": "Microsoft code signing. Also known as policyLink"
	},
	"1.3.6.1.4.1.311.2.1.11": {
		"d": "spcStatementType",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.1.12": {
		"d": "spcSpOpusInfo",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.1.14": {
		"d": "certReqExtensions",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.2.1.15": {
		"d": "spcPEImageData",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.1.18": {
		"d": "spcRawFileData",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.1.19": {
		"d": "spcStructuredStorageData",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.1.20": {
		"d": "spcJavaClassData (type 1)",
		"c": "Microsoft code signing. Formerly \"link extension\" aka \"glue extension\""
	},
	"1.3.6.1.4.1.311.2.1.21": {
		"d": "individualCodeSigning",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.2.1.22": {
		"d": "commercialCodeSigning",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.2.1.25": {
		"d": "spcLink (type 2)",
		"c": "Microsoft code signing. Also known as \"glue extension\""
	},
	"1.3.6.1.4.1.311.2.1.26": {
		"d": "spcMinimalCriteriaInfo",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.1.27": {
		"d": "spcFinancialCriteriaInfo",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.1.28": {
		"d": "spcLink (type 3)",
		"c": "Microsoft code signing.  Also known as \"glue extension\""
	},
	"1.3.6.1.4.1.311.2.1.29": {
		"d": "spcHashInfoObjID",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.1.30": {
		"d": "spcSipInfoObjID",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.2.2": {
		"d": "ctl",
		"c": "Microsoft CTL"
	},
	"1.3.6.1.4.1.311.2.2.1": {
		"d": "ctlTrustedCodesigningCAList",
		"c": "Microsoft CTL"
	},
	"1.3.6.1.4.1.311.2.2.2": {
		"d": "ctlTrustedClientAuthCAList",
		"c": "Microsoft CTL"
	},
	"1.3.6.1.4.1.311.2.2.3": {
		"d": "ctlTrustedServerAuthCAList",
		"c": "Microsoft CTL"
	},
	"1.3.6.1.4.1.311.3.2.1": {
		"d": "timestampRequest",
		"c": "Microsoft code signing"
	},
	"1.3.6.1.4.1.311.10.1": {
		"d": "certTrustList",
		"c": "Microsoft contentType"
	},
	"1.3.6.1.4.1.311.10.1.1": {
		"d": "sortedCtl",
		"c": "Microsoft contentType"
	},
	"1.3.6.1.4.1.311.10.2": {
		"d": "nextUpdateLocation",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.10.3.1": {
		"d": "certTrustListSigning",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.2": {
		"d": "timeStampSigning",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.3": {
		"d": "serverGatedCrypto",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.3.1": {
		"d": "serialized",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.10.3.4": {
		"d": "encryptedFileSystem",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.5": {
		"d": "whqlCrypto",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.6": {
		"d": "nt5Crypto",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.7": {
		"d": "oemWHQLCrypto",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.8": {
		"d": "embeddedNTCrypto",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.9": {
		"d": "rootListSigner",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.10": {
		"d": "qualifiedSubordination",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.11": {
		"d": "keyRecovery",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.12": {
		"d": "documentSigning",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.13": {
		"d": "lifetimeSigning",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.14": {
		"d": "mobileDeviceSoftware",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.15": {
		"d": "smartDisplay",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.16": {
		"d": "cspSignature",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.3.4.1": {
		"d": "efsRecovery",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.4.1": {
		"d": "yesnoTrustAttr",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.10.5.1": {
		"d": "drm",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.5.2": {
		"d": "drmIndividualization",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.6.1": {
		"d": "licenses",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.6.2": {
		"d": "licenseServer",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.10.7.1": {
		"d": "keyidRdn",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.10.8.1": {
		"d": "removeCertificate",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.10.9.1": {
		"d": "crossCertDistPoints",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.10.10.1": {
		"d": "cmcAddAttributes",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.10.11": {
		"d": "certPropIdPrefix",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.10.11.4": {
		"d": "certMd5HashPropId",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.10.11.20": {
		"d": "certKeyIdentifierPropId",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.10.11.28": {
		"d": "certIssuerSerialNumberMd5HashPropId",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.10.11.29": {
		"d": "certSubjectNameMd5HashPropId",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.10.12.1": {
		"d": "anyApplicationPolicy",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.12": {
		"d": "catalog",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.12.1.1": {
		"d": "catalogList",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.12.1.2": {
		"d": "catalogListMember",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.12.2.1": {
		"d": "catalogNameValueObjID",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.12.2.2": {
		"d": "catalogMemberInfoObjID",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.13.1": {
		"d": "renewalCertificate",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.13.2.1": {
		"d": "enrolmentNameValuePair",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.13.2.2": {
		"d": "enrolmentCSP",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.13.2.3": {
		"d": "osVersion",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.16.4": {
		"d": "microsoftRecipientInfo",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.17.1": {
		"d": "pkcs12KeyProviderNameAttr",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.17.2": {
		"d": "localMachineKeyset",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.17.3": {
		"d": "pkcs12ExtendedAttributes",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.20.1": {
		"d": "autoEnrollCtlUsage",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.20.2": {
		"d": "enrollCerttypeExtension",
		"c": "Microsoft CAPICOM certificate template, V1"
	},
	"1.3.6.1.4.1.311.20.2.1": {
		"d": "enrollmentAgent",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.20.2.2": {
		"d": "smartcardLogon",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.20.2.3": {
		"d": "universalPrincipalName",
		"c": "Microsoft UPN"
	},
	"1.3.6.1.4.1.311.20.3": {
		"d": "certManifold",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.1": {
		"d": "cAKeyCertIndexPair",
		"c": "Microsoft attribute.  Also known as certsrvCaVersion"
	},
	"1.3.6.1.4.1.311.21.2": {
		"d": "certSrvPreviousCertHash",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.3": {
		"d": "crlVirtualBase",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.4": {
		"d": "crlNextPublish",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.5": {
		"d": "caExchange",
		"c": "Microsoft extended key usage",
		"w": true
	},
	"1.3.6.1.4.1.311.21.6": {
		"d": "keyRecovery",
		"c": "Microsoft extended key usage",
		"w": true
	},
	"1.3.6.1.4.1.311.21.7": {
		"d": "certificateTemplate",
		"c": "Microsoft CAPICOM certificate template, V2"
	},
	"1.3.6.1.4.1.311.21.9": {
		"d": "rdnDummySigner",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.10": {
		"d": "applicationCertPolicies",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.11": {
		"d": "applicationPolicyMappings",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.12": {
		"d": "applicationPolicyConstraints",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.13": {
		"d": "archivedKey",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.21.14": {
		"d": "crlSelfCDP",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.15": {
		"d": "requireCertChainPolicy",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.16": {
		"d": "archivedKeyCertHash",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.17": {
		"d": "issuedCertHash",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.19": {
		"d": "dsEmailReplication",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.21.20": {
		"d": "requestClientInfo",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.21.21": {
		"d": "encryptedKeyHash",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.21.22": {
		"d": "certsrvCrossCaVersion",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.25.1": {
		"d": "ntdsReplication",
		"c": "Microsoft"
	},
	"1.3.6.1.4.1.311.31.1": {
		"d": "productUpdate",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.47.1.1": {
		"d": "systemHealth",
		"c": "Microsoft extended key usage"
	},
	"1.3.6.1.4.1.311.47.1.3": {
		"d": "systemHealthLoophole",
		"c": "Microsoft extended key usage"
	},
	"1.3.6.1.4.1.311.60.1.1": {
		"d": "rootProgramFlags",
		"c": "Microsoft policy attribute"
	},
	"1.3.6.1.4.1.311.61.1.1": {
		"d": "kernelModeCodeSigning",
		"c": "Microsoft enhanced key usage"
	},
	"1.3.6.1.4.1.311.60.2.1.1": {
		"d": "jurisdictionOfIncorporationL",
		"c": "Microsoft (???)"
	},
	"1.3.6.1.4.1.311.60.2.1.2": {
		"d": "jurisdictionOfIncorporationSP",
		"c": "Microsoft (???)"
	},
	"1.3.6.1.4.1.311.60.2.1.3": {
		"d": "jurisdictionOfIncorporationC",
		"c": "Microsoft (???)"
	},
	"1.3.6.1.4.1.311.88": {
		"d": "capiCom",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.88.1": {
		"d": "capiComVersion",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.88.2": {
		"d": "capiComAttribute",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.88.2.1": {
		"d": "capiComDocumentName",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.88.2.2": {
		"d": "capiComDocumentDescription",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.88.3": {
		"d": "capiComEncryptedData",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.311.88.3.1": {
		"d": "capiComEncryptedContent",
		"c": "Microsoft attribute"
	},
	"1.3.6.1.4.1.188.7.1.1": {
		"d": "ascom",
		"c": "Ascom Systech"
	},
	"1.3.6.1.4.1.188.7.1.1.1": {
		"d": "ideaECB",
		"c": "Ascom Systech"
	},
	"1.3.6.1.4.1.188.7.1.1.2": {
		"d": "ideaCBC",
		"c": "Ascom Systech"
	},
	"1.3.6.1.4.1.188.7.1.1.3": {
		"d": "ideaCFB",
		"c": "Ascom Systech"
	},
	"1.3.6.1.4.1.188.7.1.1.4": {
		"d": "ideaOFB",
		"c": "Ascom Systech"
	},
	"1.3.6.1.4.1.2428.10.1.1": {
		"d": "UNINETT policyIdentifier",
		"c": "UNINETT PCA"
	},
	"1.3.6.1.4.1.2712.10": {
		"d": "ICE-TEL policyIdentifier",
		"c": "ICE-TEL CA"
	},
	"1.3.6.1.4.1.2786.1.1.1": {
		"d": "ICE-TEL Italian policyIdentifier",
		"c": "ICE-TEL CA policy"
	},
	"1.3.6.1.4.1.3029.1.1.1": {
		"d": "blowfishECB",
		"c": "cryptlib encryption algorithm"
	},
	"1.3.6.1.4.1.3029.1.1.2": {
		"d": "blowfishCBC",
		"c": "cryptlib encryption algorithm"
	},
	"1.3.6.1.4.1.3029.1.1.3": {
		"d": "blowfishCFB",
		"c": "cryptlib encryption algorithm"
	},
	"1.3.6.1.4.1.3029.1.1.4": {
		"d": "blowfishOFB",
		"c": "cryptlib encryption algorithm"
	},
	"1.3.6.1.4.1.3029.1.2.1": {
		"d": "elgamal",
		"c": "cryptlib public-key algorithm"
	},
	"1.3.6.1.4.1.3029.1.2.1.1": {
		"d": "elgamalWithSHA-1",
		"c": "cryptlib public-key algorithm"
	},
	"1.3.6.1.4.1.3029.1.2.1.2": {
		"d": "elgamalWithRIPEMD-160",
		"c": "cryptlib public-key algorithm"
	},
	"1.3.6.1.4.1.3029.3.1.1": {
		"d": "cryptlibPresenceCheck",
		"c": "cryptlib attribute type"
	},
	"1.3.6.1.4.1.3029.3.1.2": {
		"d": "pkiBoot",
		"c": "cryptlib attribute type"
	},
	"1.3.6.1.4.1.3029.3.1.4": {
		"d": "crlExtReason",
		"c": "cryptlib attribute type"
	},
	"1.3.6.1.4.1.3029.3.1.5": {
		"d": "keyFeatures",
		"c": "cryptlib attribute type"
	},
	"1.3.6.1.4.1.3029.4.1": {
		"d": "cryptlibContent",
		"c": "cryptlib"
	},
	"1.3.6.1.4.1.3029.4.1.1": {
		"d": "cryptlibConfigData",
		"c": "cryptlib content type"
	},
	"1.3.6.1.4.1.3029.4.1.2": {
		"d": "cryptlibUserIndex",
		"c": "cryptlib content type"
	},
	"1.3.6.1.4.1.3029.4.1.3": {
		"d": "cryptlibUserInfo",
		"c": "cryptlib content type"
	},
	"1.3.6.1.4.1.3029.4.1.4": {
		"d": "rtcsRequest",
		"c": "cryptlib content type"
	},
	"1.3.6.1.4.1.3029.4.1.5": {
		"d": "rtcsResponse",
		"c": "cryptlib content type"
	},
	"1.3.6.1.4.1.3029.4.1.6": {
		"d": "rtcsResponseExt",
		"c": "cryptlib content type"
	},
	"1.3.6.1.4.1.3029.42.11172.1": {
		"d": "mpeg-1",
		"c": "cryptlib special MPEG-of-cat OID"
	},
	"1.3.6.1.4.1.3029.54.11940.54": {
		"d": "TSA policy \"Anything that arrives, we sign\"",
		"c": "cryptlib TSA policy"
	},
	"1.3.6.1.4.1.3029.88.89.90.90.89": {
		"d": "xYZZY policyIdentifier",
		"c": "cryptlib certificate policy"
	},
	"1.3.6.1.4.1.3401.8.1.1": {
		"d": "pgpExtension",
		"c": "PGP key information"
	},
	"1.3.6.1.4.1.3576.7": {
		"d": "eciaAscX12Edi",
		"c": "TMN EDI for Interactive Agents"
	},
	"1.3.6.1.4.1.3576.7.1": {
		"d": "plainEDImessage",
		"c": "TMN EDI for Interactive Agents"
	},
	"1.3.6.1.4.1.3576.7.2": {
		"d": "signedEDImessage",
		"c": "TMN EDI for Interactive Agents"
	},
	"1.3.6.1.4.1.3576.7.5": {
		"d": "integrityEDImessage",
		"c": "TMN EDI for Interactive Agents"
	},
	"1.3.6.1.4.1.3576.7.65": {
		"d": "iaReceiptMessage",
		"c": "TMN EDI for Interactive Agents"
	},
	"1.3.6.1.4.1.3576.7.97": {
		"d": "iaStatusMessage",
		"c": "TMN EDI for Interactive Agents"
	},
	"1.3.6.1.4.1.3576.8": {
		"d": "eciaEdifact",
		"c": "TMN EDI for Interactive Agents"
	},
	"1.3.6.1.4.1.3576.9": {
		"d": "eciaNonEdi",
		"c": "TMN EDI for Interactive Agents"
	},
	"1.3.6.1.4.1.4146": {
		"d": "Globalsign",
		"c": "Globalsign"
	},
	"1.3.6.1.4.1.4146.1": {
		"d": "globalsignPolicy",
		"c": "Globalsign"
	},
	"1.3.6.1.4.1.4146.1.10": {
		"d": "globalsignDVPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.20": {
		"d": "globalsignOVPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.30": {
		"d": "globalsignTSAPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.40": {
		"d": "globalsignClientCertPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.50": {
		"d": "globalsignCodeSignPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.60": {
		"d": "globalsignRootSignPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.70": {
		"d": "globalsignTrustedRootPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.80": {
		"d": "globalsignEDIClientPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.81": {
		"d": "globalsignEDIServerPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.90": {
		"d": "globalsignTPMRootPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.4146.1.95": {
		"d": "globalsignOCSPPolicy",
		"c": "Globalsign policy"
	},
	"1.3.6.1.4.1.5309.1": {
		"d": "edelWebPolicy",
		"c": "EdelWeb policy"
	},
	"1.3.6.1.4.1.5309.1.2": {
		"d": "edelWebCustomerPolicy",
		"c": "EdelWeb policy"
	},
	"1.3.6.1.4.1.5309.1.2.1": {
		"d": "edelWebClepsydrePolicy",
		"c": "EdelWeb policy"
	},
	"1.3.6.1.4.1.5309.1.2.2": {
		"d": "edelWebExperimentalTSAPolicy",
		"c": "EdelWeb policy"
	},
	"1.3.6.1.4.1.5309.1.2.3": {
		"d": "edelWebOpenEvidenceTSAPolicy",
		"c": "EdelWeb policy"
	},
	"1.3.6.1.4.1.5472": {
		"d": "timeproof",
		"c": "enterprise"
	},
	"1.3.6.1.4.1.5472.1": {
		"d": "tss",
		"c": "timeproof"
	},
	"1.3.6.1.4.1.5472.1.1": {
		"d": "tss80",
		"c": "timeproof TSS"
	},
	"1.3.6.1.4.1.5472.1.2": {
		"d": "tss380",
		"c": "timeproof TSS"
	},
	"1.3.6.1.4.1.5472.1.3": {
		"d": "tss400",
		"c": "timeproof TSS"
	},
	"1.3.6.1.4.1.5770.0.3": {
		"d": "secondaryPractices",
		"c": "MEDePass"
	},
	"1.3.6.1.4.1.5770.0.4": {
		"d": "physicianIdentifiers",
		"c": "MEDePass"
	},
	"1.3.6.1.4.1.6449.1.2.1.3.1": {
		"d": "comodoPolicy",
		"c": "Comodo CA"
	},
	"1.3.6.1.4.1.6449.1.2.2.15": {
		"d": "wotrustPolicy",
		"c": "WoTrust (Comodo) CA"
	},
	"1.3.6.1.4.1.6449.1.3.5.2": {
		"d": "comodoCertifiedDeliveryService",
		"c": "Comodo CA"
	},
	"1.3.6.1.4.1.6449.2.1.1": {
		"d": "comodoTimestampingPolicy",
		"c": "Comodo CA"
	},
	"1.3.6.1.4.1.8301.3.5.1": {
		"d": "validityModelChain",
		"c": "TU Darmstadt ValidityModel"
	},
	"1.3.6.1.4.1.8301.3.5.2": {
		"d": "validityModelShell",
		"c": "ValidityModel"
	},
	"1.3.6.1.4.1.8231.1": {
		"d": "rolUnicoNacional",
		"c": "Chilean Government national unique roll number"
	},
	"1.3.6.1.4.1.11591": {
		"d": "gnu",
		"c": "GNU Project (see http://www.gnupg.org/oids.html)"
	},
	"1.3.6.1.4.1.11591.1": {
		"d": "gnuRadius",
		"c": "GNU Radius"
	},
	"1.3.6.1.4.1.11591.3": {
		"d": "gnuRadar",
		"c": "GNU Radar"
	},
	"1.3.6.1.4.1.11591.4.11": {
		"d": "scrypt",
		"c": "GNU Generic Security Service"
	},
	"1.3.6.1.4.1.11591.12": {
		"d": "gnuDigestAlgorithm",
		"c": "GNU digest algorithm"
	},
	"1.3.6.1.4.1.11591.12.2": {
		"d": "tiger",
		"c": "GNU digest algorithm"
	},
	"1.3.6.1.4.1.11591.13": {
		"d": "gnuEncryptionAlgorithm",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2": {
		"d": "serpent",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.1": {
		"d": "serpent128_ECB",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.2": {
		"d": "serpent128_CBC",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.3": {
		"d": "serpent128_OFB",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.4": {
		"d": "serpent128_CFB",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.21": {
		"d": "serpent192_ECB",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.22": {
		"d": "serpent192_CBC",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.23": {
		"d": "serpent192_OFB",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.24": {
		"d": "serpent192_CFB",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.41": {
		"d": "serpent256_ECB",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.42": {
		"d": "serpent256_CBC",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.43": {
		"d": "serpent256_OFB",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.13.2.44": {
		"d": "serpent256_CFB",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.15.1": {
		"d": "curve25519",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.15.2": {
		"d": "curve448",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.15.3": {
		"d": "curve25519ph",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.11591.15.4": {
		"d": "curve448ph",
		"c": "GNU encryption algorithm"
	},
	"1.3.6.1.4.1.16334.509.1.1": {
		"d": "Northrop Grumman extKeyUsage?",
		"c": "Northrop Grumman extended key usage"
	},
	"1.3.6.1.4.1.16334.509.2.1": {
		"d": "ngcClass1",
		"c": "Northrop Grumman policy"
	},
	"1.3.6.1.4.1.16334.509.2.2": {
		"d": "ngcClass2",
		"c": "Northrop Grumman policy"
	},
	"1.3.6.1.4.1.16334.509.2.3": {
		"d": "ngcClass3",
		"c": "Northrop Grumman policy"
	},
	"1.3.6.1.4.1.23629.1.4.2.1.1": {
		"d": "safenetUsageLimit",
		"c": "SafeNet"
	},
	"1.3.6.1.4.1.23629.1.4.2.1.2": {
		"d": "safenetEndDate",
		"c": "SafeNet"
	},
	"1.3.6.1.4.1.23629.1.4.2.1.3": {
		"d": "safenetStartDate",
		"c": "SafeNet"
	},
	"1.3.6.1.4.1.23629.1.4.2.1.4": {
		"d": "safenetAdminCert",
		"c": "SafeNet"
	},
	"1.3.6.1.4.1.23629.1.4.2.2.1": {
		"d": "safenetKeyDigest",
		"c": "SafeNet"
	},
	"1.3.6.1.5.2.3.1": {
		"d": "authData",
		"c": "Kerberos"
	},
	"1.3.6.1.5.2.3.2": {
		"d": "dHKeyData",
		"c": "Kerberos"
	},
	"1.3.6.1.5.2.3.3": {
		"d": "rkeyData",
		"c": "Kerberos"
	},
	"1.3.6.1.5.2.3.4": {
		"d": "keyPurposeClientAuth",
		"c": "Kerberos"
	},
	"1.3.6.1.5.2.3.5": {
		"d": "keyPurposeKdc",
		"c": "Kerberos"
	},
	"1.3.6.1.5.2.3.6": {
		"d": "kdf",
		"c": "Kerberos"
	},
	"1.3.6.1.5.5.7": {
		"d": "pkix",
		"c": ""
	},
	"1.3.6.1.5.5.7.0.12": {
		"d": "attributeCert",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.1": {
		"d": "privateExtension",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.1.1": {
		"d": "authorityInfoAccess",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.2": {
		"d": "biometricInfo",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.3": {
		"d": "qcStatements",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.4": {
		"d": "acAuditIdentity",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.5": {
		"d": "acTargeting",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.6": {
		"d": "acAaControls",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.7": {
		"d": "ipAddrBlocks",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.8": {
		"d": "autonomousSysIds",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.9": {
		"d": "routerIdentifier",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.10": {
		"d": "acProxying",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.11": {
		"d": "subjectInfoAccess",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.12": {
		"d": "logoType",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.13": {
		"d": "wlanSSID",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.14": {
		"d": "proxyCertInfo",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.15": {
		"d": "acPolicies",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.16": {
		"d": "certificateWarranty",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.18": {
		"d": "cmsContentConstraints",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.19": {
		"d": "otherCerts",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.20": {
		"d": "wrappedApexContinKey",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.21": {
		"d": "clearanceConstraints",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.22": {
		"d": "skiSemantics",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.23": {
		"d": "noSecrecyAfforded",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.24": {
		"d": "tlsFeature",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.25": {
		"d": "manufacturerUsageDescription",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.26": {
		"d": "tnAuthList",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.27": {
		"d": "jwtClaimConstraints",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.28": {
		"d": "ipAddrBlocksV2",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.29": {
		"d": "autonomousSysIdsV2",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.30": {
		"d": "manufacturerUsageDescriptionSigner",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.1.31": {
		"d": "acmeIdentifier",
		"c": "PKIX private extension"
	},
	"1.3.6.1.5.5.7.2": {
		"d": "policyQualifierIds",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.2.1": {
		"d": "cps",
		"c": "PKIX policy qualifier"
	},
	"1.3.6.1.5.5.7.2.2": {
		"d": "unotice",
		"c": "PKIX policy qualifier"
	},
	"1.3.6.1.5.5.7.2.3": {
		"d": "textNotice",
		"c": "PKIX policy qualifier"
	},
	"1.3.6.1.5.5.7.3": {
		"d": "keyPurpose",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.3.1": {
		"d": "serverAuth",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.2": {
		"d": "clientAuth",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.3": {
		"d": "codeSigning",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.4": {
		"d": "emailProtection",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.5": {
		"d": "ipsecEndSystem",
		"c": "PKIX key purpose",
		"w": true
	},
	"1.3.6.1.5.5.7.3.6": {
		"d": "ipsecTunnel",
		"c": "PKIX key purpose",
		"w": true
	},
	"1.3.6.1.5.5.7.3.7": {
		"d": "ipsecUser",
		"c": "PKIX key purpose",
		"w": true
	},
	"1.3.6.1.5.5.7.3.8": {
		"d": "timeStamping",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.9": {
		"d": "ocspSigning",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.10": {
		"d": "dvcs",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.11": {
		"d": "sbgpCertAAServerAuth",
		"c": "PKIX key purpose",
		"w": true
	},
	"1.3.6.1.5.5.7.3.12": {
		"d": "scvpResponder",
		"c": "PKIX key purpose",
		"w": true
	},
	"1.3.6.1.5.5.7.3.13": {
		"d": "eapOverPPP",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.14": {
		"d": "eapOverLAN",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.15": {
		"d": "scvpServer",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.16": {
		"d": "scvpClient",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.17": {
		"d": "ipsecIKE",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.18": {
		"d": "capwapAC",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.19": {
		"d": "capwapWTP",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.20": {
		"d": "sipDomain",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.21": {
		"d": "secureShellClient",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.22": {
		"d": "secureShellServer",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.23": {
		"d": "sendRouter",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.24": {
		"d": "sendProxiedRouter",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.25": {
		"d": "sendOwner",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.26": {
		"d": "sendProxiedOwner",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.27": {
		"d": "cmcCA",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.28": {
		"d": "cmcRA",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.29": {
		"d": "cmcArchive",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.3.30": {
		"d": "bgpsecRouter",
		"c": "PKIX key purpose"
	},
	"1.3.6.1.5.5.7.4": {
		"d": "cmpInformationTypes",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.4.1": {
		"d": "caProtEncCert",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.2": {
		"d": "signKeyPairTypes",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.3": {
		"d": "encKeyPairTypes",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.4": {
		"d": "preferredSymmAlg",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.5": {
		"d": "caKeyUpdateInfo",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.6": {
		"d": "currentCRL",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.7": {
		"d": "unsupportedOIDs",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.10": {
		"d": "keyPairParamReq",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.11": {
		"d": "keyPairParamRep",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.12": {
		"d": "revPassphrase",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.13": {
		"d": "implicitConfirm",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.14": {
		"d": "confirmWaitTime",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.15": {
		"d": "origPKIMessage",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.4.16": {
		"d": "suppLangTags",
		"c": "PKIX CMP information"
	},
	"1.3.6.1.5.5.7.5": {
		"d": "crmfRegistration",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.5.1": {
		"d": "regCtrl",
		"c": "PKIX CRMF registration"
	},
	"1.3.6.1.5.5.7.5.1.1": {
		"d": "regToken",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.5.1.2": {
		"d": "authenticator",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.5.1.3": {
		"d": "pkiPublicationInfo",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.5.1.4": {
		"d": "pkiArchiveOptions",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.5.1.5": {
		"d": "oldCertID",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.5.1.6": {
		"d": "protocolEncrKey",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.5.1.7": {
		"d": "altCertTemplate",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.5.1.8": {
		"d": "wtlsTemplate",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.5.2": {
		"d": "utf8Pairs",
		"c": "PKIX CRMF registration"
	},
	"1.3.6.1.5.5.7.5.2.1": {
		"d": "utf8Pairs",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.5.2.2": {
		"d": "certReq",
		"c": "PKIX CRMF registration control"
	},
	"1.3.6.1.5.5.7.6": {
		"d": "algorithms",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.6.1": {
		"d": "des40",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.2": {
		"d": "noSignature",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.3": {
		"d": "dhSigHmacSha1",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.4": {
		"d": "dhPop",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.5": {
		"d": "dhPopSha224",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.6": {
		"d": "dhPopSha256",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.7": {
		"d": "dhPopSha384",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.8": {
		"d": "dhPopSha512",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.15": {
		"d": "dhPopStaticSha224HmacSha224",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.16": {
		"d": "dhPopStaticSha256HmacSha256",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.17": {
		"d": "dhPopStaticSha384HmacSha384",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.18": {
		"d": "dhPopStaticSha512HmacSha512",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.25": {
		"d": "ecdhPopStaticSha224HmacSha224",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.26": {
		"d": "ecdhPopStaticSha256HmacSha256",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.27": {
		"d": "ecdhPopStaticSha384HmacSha384",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.6.28": {
		"d": "ecdhPopStaticSha512HmacSha512",
		"c": "PKIX algorithm"
	},
	"1.3.6.1.5.5.7.7": {
		"d": "cmcControls",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.8": {
		"d": "otherNames",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.8.1": {
		"d": "personalData",
		"c": "PKIX other name"
	},
	"1.3.6.1.5.5.7.8.2": {
		"d": "userGroup",
		"c": "PKIX other name"
	},
	"1.3.6.1.5.5.7.8.5": {
		"d": "xmppAddr",
		"c": "PKIX other name"
	},
	"1.3.6.1.5.5.7.9": {
		"d": "personalData",
		"c": "PKIX qualified certificates"
	},
	"1.3.6.1.5.5.7.9.1": {
		"d": "dateOfBirth",
		"c": "PKIX personal data"
	},
	"1.3.6.1.5.5.7.9.2": {
		"d": "placeOfBirth",
		"c": "PKIX personal data"
	},
	"1.3.6.1.5.5.7.9.3": {
		"d": "gender",
		"c": "PKIX personal data"
	},
	"1.3.6.1.5.5.7.9.4": {
		"d": "countryOfCitizenship",
		"c": "PKIX personal data"
	},
	"1.3.6.1.5.5.7.9.5": {
		"d": "countryOfResidence",
		"c": "PKIX personal data"
	},
	"1.3.6.1.5.5.7.10": {
		"d": "attributeCertificate",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.10.1": {
		"d": "authenticationInfo",
		"c": "PKIX attribute certificate extension"
	},
	"1.3.6.1.5.5.7.10.2": {
		"d": "accessIdentity",
		"c": "PKIX attribute certificate extension"
	},
	"1.3.6.1.5.5.7.10.3": {
		"d": "chargingIdentity",
		"c": "PKIX attribute certificate extension"
	},
	"1.3.6.1.5.5.7.10.4": {
		"d": "group",
		"c": "PKIX attribute certificate extension"
	},
	"1.3.6.1.5.5.7.10.5": {
		"d": "role",
		"c": "PKIX attribute certificate extension"
	},
	"1.3.6.1.5.5.7.10.6": {
		"d": "wlanSSID",
		"c": "PKIX attribute-certificate extension"
	},
	"1.3.6.1.5.5.7.11": {
		"d": "personalData",
		"c": "PKIX qualified certificates"
	},
	"1.3.6.1.5.5.7.11.1": {
		"d": "pkixQCSyntax-v1",
		"c": "PKIX qualified certificates"
	},
	"1.3.6.1.5.5.7.14.2": {
		"d": "resourceCertificatePolicy",
		"c": "PKIX policies"
	},
	"1.3.6.1.5.5.7.20": {
		"d": "logo",
		"c": "PKIX qualified certificates"
	},
	"1.3.6.1.5.5.7.20.1": {
		"d": "logoLoyalty",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.20.2": {
		"d": "logoBackground",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.48.1": {
		"d": "ocsp",
		"c": "PKIX"
	},
	"1.3.6.1.5.5.7.48.1.1": {
		"d": "ocspBasic",
		"c": "OCSP"
	},
	"1.3.6.1.5.5.7.48.1.2": {
		"d": "ocspNonce",
		"c": "OCSP"
	},
	"1.3.6.1.5.5.7.48.1.3": {
		"d": "ocspCRL",
		"c": "OCSP"
	},
	"1.3.6.1.5.5.7.48.1.4": {
		"d": "ocspResponse",
		"c": "OCSP"
	},
	"1.3.6.1.5.5.7.48.1.5": {
		"d": "ocspNoCheck",
		"c": "OCSP"
	},
	"1.3.6.1.5.5.7.48.1.6": {
		"d": "ocspArchiveCutoff",
		"c": "OCSP"
	},
	"1.3.6.1.5.5.7.48.1.7": {
		"d": "ocspServiceLocator",
		"c": "OCSP"
	},
	"1.3.6.1.5.5.7.48.2": {
		"d": "caIssuers",
		"c": "PKIX subject/authority info access descriptor"
	},
	"1.3.6.1.5.5.7.48.3": {
		"d": "timeStamping",
		"c": "PKIX subject/authority info access descriptor"
	},
	"1.3.6.1.5.5.7.48.4": {
		"d": "dvcs",
		"c": "PKIX subject/authority info access descriptor"
	},
	"1.3.6.1.5.5.7.48.5": {
		"d": "caRepository",
		"c": "PKIX subject/authority info access descriptor"
	},
	"1.3.6.1.5.5.7.48.7": {
		"d": "signedObjectRepository",
		"c": "PKIX subject/authority info access descriptor"
	},
	"1.3.6.1.5.5.7.48.10": {
		"d": "rpkiManifest",
		"c": "PKIX subject/authority info access descriptor"
	},
	"1.3.6.1.5.5.7.48.11": {
		"d": "signedObject",
		"c": "PKIX subject/authority info access descriptor"
	},
	"1.3.6.1.5.5.8.1.1": {
		"d": "hmacMD5",
		"c": "ISAKMP HMAC algorithm"
	},
	"1.3.6.1.5.5.8.1.2": {
		"d": "hmacSHA",
		"c": "ISAKMP HMAC algorithm"
	},
	"1.3.6.1.5.5.8.1.3": {
		"d": "hmacTiger",
		"c": "ISAKMP HMAC algorithm"
	},
	"1.3.6.1.5.5.8.2.2": {
		"d": "iKEIntermediate",
		"c": "IKE ???"
	},
	"1.3.12.2.1011.7.1": {
		"d": "decEncryptionAlgorithm",
		"c": "DASS algorithm"
	},
	"1.3.12.2.1011.7.1.2": {
		"d": "decDEA",
		"c": "DASS encryption algorithm"
	},
	"1.3.12.2.1011.7.2": {
		"d": "decHashAlgorithm",
		"c": "DASS algorithm"
	},
	"1.3.12.2.1011.7.2.1": {
		"d": "decMD2",
		"c": "DASS hash algorithm"
	},
	"1.3.12.2.1011.7.2.2": {
		"d": "decMD4",
		"c": "DASS hash algorithm"
	},
	"1.3.12.2.1011.7.3": {
		"d": "decSignatureAlgorithm",
		"c": "DASS algorithm"
	},
	"1.3.12.2.1011.7.3.1": {
		"d": "decMD2withRSA",
		"c": "DASS signature algorithm"
	},
	"1.3.12.2.1011.7.3.2": {
		"d": "decMD4withRSA",
		"c": "DASS signature algorithm"
	},
	"1.3.12.2.1011.7.3.3": {
		"d": "decDEAMAC",
		"c": "DASS signature algorithm"
	},
	"1.3.14.2.26.5": {
		"d": "sha",
		"c": "Unsure about this OID"
	},
	"1.3.14.3.2.1.1": {
		"d": "rsa",
		"c": "X.509. Unsure about this OID"
	},
	"1.3.14.3.2.2": {
		"d": "md4WitRSA",
		"c": "Oddball OIW OID"
	},
	"1.3.14.3.2.3": {
		"d": "md5WithRSA",
		"c": "Oddball OIW OID"
	},
	"1.3.14.3.2.4": {
		"d": "md4WithRSAEncryption",
		"c": "Oddball OIW OID"
	},
	"1.3.14.3.2.2.1": {
		"d": "sqmod-N",
		"c": "X.509. Deprecated",
		"w": true
	},
	"1.3.14.3.2.3.1": {
		"d": "sqmod-NwithRSA",
		"c": "X.509. Deprecated",
		"w": true
	},
	"1.3.14.3.2.6": {
		"d": "desECB",
		"c": ""
	},
	"1.3.14.3.2.7": {
		"d": "desCBC",
		"c": ""
	},
	"1.3.14.3.2.8": {
		"d": "desOFB",
		"c": ""
	},
	"1.3.14.3.2.9": {
		"d": "desCFB",
		"c": ""
	},
	"1.3.14.3.2.10": {
		"d": "desMAC",
		"c": ""
	},
	"1.3.14.3.2.11": {
		"d": "rsaSignature",
		"c": "ISO 9796-2, also X9.31 Part 1"
	},
	"1.3.14.3.2.12": {
		"d": "dsa",
		"c": "OIW?, supposedly from an incomplete version of SDN.701 (doesn't match final SDN.701)",
		"w": true
	},
	"1.3.14.3.2.13": {
		"d": "dsaWithSHA",
		"c": "Oddball OIW OID.  Incorrectly used by JDK 1.1 in place of (1 3 14 3 2 27)",
		"w": true
	},
	"1.3.14.3.2.14": {
		"d": "mdc2WithRSASignature",
		"c": "Oddball OIW OID using 9796-2 padding rules"
	},
	"1.3.14.3.2.15": {
		"d": "shaWithRSASignature",
		"c": "Oddball OIW OID using 9796-2 padding rules"
	},
	"1.3.14.3.2.16": {
		"d": "dhWithCommonModulus",
		"c": "Oddball OIW OID. Deprecated, use a plain DH OID instead",
		"w": true
	},
	"1.3.14.3.2.17": {
		"d": "desEDE",
		"c": "Oddball OIW OID. Mode is ECB"
	},
	"1.3.14.3.2.18": {
		"d": "sha",
		"c": "Oddball OIW OID"
	},
	"1.3.14.3.2.19": {
		"d": "mdc-2",
		"c": "Oddball OIW OID, DES-based hash, planned for X9.31 Part 2"
	},
	"1.3.14.3.2.20": {
		"d": "dsaCommon",
		"c": "Oddball OIW OID.  Deprecated, use a plain DSA OID instead",
		"w": true
	},
	"1.3.14.3.2.21": {
		"d": "dsaCommonWithSHA",
		"c": "Oddball OIW OID.  Deprecated, use a plain dsaWithSHA OID instead",
		"w": true
	},
	"1.3.14.3.2.22": {
		"d": "rsaKeyTransport",
		"c": "Oddball OIW OID"
	},
	"1.3.14.3.2.23": {
		"d": "keyed-hash-seal",
		"c": "Oddball OIW OID"
	},
	"1.3.14.3.2.24": {
		"d": "md2WithRSASignature",
		"c": "Oddball OIW OID using 9796-2 padding rules"
	},
	"1.3.14.3.2.25": {
		"d": "md5WithRSASignature",
		"c": "Oddball OIW OID using 9796-2 padding rules"
	},
	"1.3.14.3.2.26": {
		"d": "sha1",
		"c": "OIW"
	},
	"1.3.14.3.2.27": {
		"d": "dsaWithSHA1",
		"c": "OIW. This OID may also be assigned as ripemd-160"
	},
	"1.3.14.3.2.28": {
		"d": "dsaWithCommonSHA1",
		"c": "OIW"
	},
	"1.3.14.3.2.29": {
		"d": "sha-1WithRSAEncryption",
		"c": "Oddball OIW OID"
	},
	"1.3.14.3.3.1": {
		"d": "simple-strong-auth-mechanism",
		"c": "Oddball OIW OID"
	},
	"1.3.14.7.2.1.1": {
		"d": "ElGamal",
		"c": "Unsure about this OID"
	},
	"1.3.14.7.2.3.1": {
		"d": "md2WithRSA",
		"c": "Unsure about this OID"
	},
	"1.3.14.7.2.3.2": {
		"d": "md2WithElGamal",
		"c": "Unsure about this OID"
	},
	"1.3.36.1": {
		"d": "document",
		"c": "Teletrust document"
	},
	"1.3.36.1.1": {
		"d": "finalVersion",
		"c": "Teletrust document"
	},
	"1.3.36.1.2": {
		"d": "draft",
		"c": "Teletrust document"
	},
	"1.3.36.2": {
		"d": "sio",
		"c": "Teletrust sio"
	},
	"1.3.36.2.1": {
		"d": "sedu",
		"c": "Teletrust sio"
	},
	"1.3.36.3": {
		"d": "algorithm",
		"c": "Teletrust algorithm"
	},
	"1.3.36.3.1": {
		"d": "encryptionAlgorithm",
		"c": "Teletrust algorithm"
	},
	"1.3.36.3.1.1": {
		"d": "des",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.1.1": {
		"d": "desECB_pad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.1.1.1": {
		"d": "desECB_ISOpad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.1.2.1": {
		"d": "desCBC_pad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.1.2.1.1": {
		"d": "desCBC_ISOpad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.3": {
		"d": "des_3",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.3.1.1": {
		"d": "des_3ECB_pad",
		"c": "Teletrust encryption algorithm. EDE triple DES"
	},
	"1.3.36.3.1.3.1.1.1": {
		"d": "des_3ECB_ISOpad",
		"c": "Teletrust encryption algorithm. EDE triple DES"
	},
	"1.3.36.3.1.3.2.1": {
		"d": "des_3CBC_pad",
		"c": "Teletrust encryption algorithm. EDE triple DES"
	},
	"1.3.36.3.1.3.2.1.1": {
		"d": "des_3CBC_ISOpad",
		"c": "Teletrust encryption algorithm. EDE triple DES"
	},
	"1.3.36.3.1.2": {
		"d": "idea",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.2.1": {
		"d": "ideaECB",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.2.1.1": {
		"d": "ideaECB_pad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.2.1.1.1": {
		"d": "ideaECB_ISOpad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.2.2": {
		"d": "ideaCBC",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.2.2.1": {
		"d": "ideaCBC_pad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.2.2.1.1": {
		"d": "ideaCBC_ISOpad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.2.3": {
		"d": "ideaOFB",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.2.4": {
		"d": "ideaCFB",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.4": {
		"d": "rsaEncryption",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.4.512.17": {
		"d": "rsaEncryptionWithlmod512expe17",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.5": {
		"d": "bsi-1",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.5.1": {
		"d": "bsi_1ECB_pad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.5.2": {
		"d": "bsi_1CBC_pad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.1.5.2.1": {
		"d": "bsi_1CBC_PEMpad",
		"c": "Teletrust encryption algorithm"
	},
	"1.3.36.3.2": {
		"d": "hashAlgorithm",
		"c": "Teletrust algorithm"
	},
	"1.3.36.3.2.1": {
		"d": "ripemd160",
		"c": "Teletrust hash algorithm"
	},
	"1.3.36.3.2.2": {
		"d": "ripemd128",
		"c": "Teletrust hash algorithm"
	},
	"1.3.36.3.2.3": {
		"d": "ripemd256",
		"c": "Teletrust hash algorithm"
	},
	"1.3.36.3.2.4": {
		"d": "mdc2singleLength",
		"c": "Teletrust hash algorithm"
	},
	"1.3.36.3.2.5": {
		"d": "mdc2doubleLength",
		"c": "Teletrust hash algorithm"
	},
	"1.3.36.3.3": {
		"d": "signatureAlgorithm",
		"c": "Teletrust algorithm"
	},
	"1.3.36.3.3.1": {
		"d": "rsaSignature",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.1.1": {
		"d": "rsaSignatureWithsha1",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.1.1.1024.11": {
		"d": "rsaSignatureWithsha1_l1024_l11",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.1.2": {
		"d": "rsaSignatureWithripemd160",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.1.2.1024.11": {
		"d": "rsaSignatureWithripemd160_l1024_l11",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.1.3": {
		"d": "rsaSignatureWithrimpemd128",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.1.4": {
		"d": "rsaSignatureWithrimpemd256",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.2": {
		"d": "ecsieSign",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.2.1": {
		"d": "ecsieSignWithsha1",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.2.2": {
		"d": "ecsieSignWithripemd160",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.2.3": {
		"d": "ecsieSignWithmd2",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.2.4": {
		"d": "ecsieSignWithmd5",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.3.3.2.8.1.1.1": {
		"d": "brainpoolP160r1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.2": {
		"d": "brainpoolP160t1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.3": {
		"d": "brainpoolP192r1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.4": {
		"d": "brainpoolP192t1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.5": {
		"d": "brainpoolP224r1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.6": {
		"d": "brainpoolP224t1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.7": {
		"d": "brainpoolP256r1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.8": {
		"d": "brainpoolP256t1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.9": {
		"d": "brainpoolP320r1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.10": {
		"d": "brainpoolP320t1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.11": {
		"d": "brainpoolP384r1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.12": {
		"d": "brainpoolP384t1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.13": {
		"d": "brainpoolP512r1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.3.2.8.1.1.14": {
		"d": "brainpoolP512t1",
		"c": "ECC Brainpool Standard Curves and Curve Generation"
	},
	"1.3.36.3.4": {
		"d": "signatureScheme",
		"c": "Teletrust algorithm"
	},
	"1.3.36.3.4.1": {
		"d": "sigS_ISO9796-1",
		"c": "Teletrust signature scheme"
	},
	"1.3.36.3.4.2": {
		"d": "sigS_ISO9796-2",
		"c": "Teletrust signature scheme"
	},
	"1.3.36.3.4.2.1": {
		"d": "sigS_ISO9796-2Withred",
		"c": "Teletrust signature scheme. Unsure what this is supposed to be"
	},
	"1.3.36.3.4.2.2": {
		"d": "sigS_ISO9796-2Withrsa",
		"c": "Teletrust signature scheme. Unsure what this is supposed to be"
	},
	"1.3.36.3.4.2.3": {
		"d": "sigS_ISO9796-2Withrnd",
		"c": "Teletrust signature scheme. 9796-2 with random number in padding field"
	},
	"1.3.36.4": {
		"d": "attribute",
		"c": "Teletrust attribute"
	},
	"1.3.36.5": {
		"d": "policy",
		"c": "Teletrust policy"
	},
	"1.3.36.6": {
		"d": "api",
		"c": "Teletrust API"
	},
	"1.3.36.6.1": {
		"d": "manufacturer-specific_api",
		"c": "Teletrust API"
	},
	"1.3.36.6.1.1": {
		"d": "utimaco-api",
		"c": "Teletrust API"
	},
	"1.3.36.6.2": {
		"d": "functionality-specific_api",
		"c": "Teletrust API"
	},
	"1.3.36.7": {
		"d": "keymgmnt",
		"c": "Teletrust key management"
	},
	"1.3.36.7.1": {
		"d": "keyagree",
		"c": "Teletrust key management"
	},
	"1.3.36.7.1.1": {
		"d": "bsiPKE",
		"c": "Teletrust key management"
	},
	"1.3.36.7.2": {
		"d": "keytrans",
		"c": "Teletrust key management"
	},
	"1.3.36.7.2.1": {
		"d": "encISO9796-2Withrsa",
		"c": "Teletrust key management. 9796-2 with key stored in hash field"
	},
	"1.3.36.8.1.1": {
		"d": "Teletrust SigGConform policyIdentifier",
		"c": "Teletrust policy"
	},
	"1.3.36.8.2.1": {
		"d": "directoryService",
		"c": "Teletrust extended key usage"
	},
	"1.3.36.8.3.1": {
		"d": "dateOfCertGen",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.2": {
		"d": "procuration",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.3": {
		"d": "admission",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.4": {
		"d": "monetaryLimit",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.5": {
		"d": "declarationOfMajority",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.6": {
		"d": "integratedCircuitCardSerialNumber",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.7": {
		"d": "pKReference",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.8": {
		"d": "restriction",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.9": {
		"d": "retrieveIfAllowed",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.10": {
		"d": "requestedCertificate",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.11": {
		"d": "namingAuthorities",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.11.1": {
		"d": "rechtWirtschaftSteuern",
		"c": "Teletrust naming authorities"
	},
	"1.3.36.8.3.11.1.1": {
		"d": "rechtsanwaeltin",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.2": {
		"d": "rechtsanwalt",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.3": {
		"d": "rechtsBeistand",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.4": {
		"d": "steuerBeraterin",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.5": {
		"d": "steuerBerater",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.6": {
		"d": "steuerBevollmaechtigte",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.7": {
		"d": "steuerBevollmaechtigter",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.8": {
		"d": "notarin",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.9": {
		"d": "notar",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.10": {
		"d": "notarVertreterin",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.11": {
		"d": "notarVertreter",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.12": {
		"d": "notariatsVerwalterin",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.13": {
		"d": "notariatsVerwalter",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.14": {
		"d": "wirtschaftsPrueferin",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.15": {
		"d": "wirtschaftsPruefer",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.16": {
		"d": "vereidigteBuchprueferin",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.17": {
		"d": "vereidigterBuchpruefer",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.18": {
		"d": "patentAnwaeltin",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.11.1.19": {
		"d": "patentAnwalt",
		"c": "Teletrust ProfessionInfo"
	},
	"1.3.36.8.3.12": {
		"d": "certInDirSince",
		"c": "Teletrust OCSP attribute (obsolete)",
		"w": true
	},
	"1.3.36.8.3.13": {
		"d": "certHash",
		"c": "Teletrust OCSP attribute"
	},
	"1.3.36.8.3.14": {
		"d": "nameAtBirth",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.3.15": {
		"d": "additionalInformation",
		"c": "Teletrust attribute"
	},
	"1.3.36.8.4.1": {
		"d": "personalData",
		"c": "Teletrust OtherName attribute"
	},
	"1.3.36.8.4.8": {
		"d": "restriction",
		"c": "Teletrust attribute certificate attribute"
	},
	"1.3.36.8.5.1.1.1": {
		"d": "rsaIndicateSHA1",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.8.5.1.1.2": {
		"d": "rsaIndicateRIPEMD160",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.8.5.1.1.3": {
		"d": "rsaWithSHA1",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.8.5.1.1.4": {
		"d": "rsaWithRIPEMD160",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.8.5.1.2.1": {
		"d": "dsaExtended",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.8.5.1.2.2": {
		"d": "dsaWithRIPEMD160",
		"c": "Teletrust signature algorithm"
	},
	"1.3.36.8.6.1": {
		"d": "cert",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.6.2": {
		"d": "certRef",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.6.3": {
		"d": "attrCert",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.6.4": {
		"d": "attrRef",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.6.5": {
		"d": "fileName",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.6.6": {
		"d": "storageTime",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.6.7": {
		"d": "fileSize",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.6.8": {
		"d": "location",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.6.9": {
		"d": "sigNumber",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.6.10": {
		"d": "autoGen",
		"c": "Teletrust signature attributes"
	},
	"1.3.36.8.7.1.1": {
		"d": "ptAdobeILL",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.2": {
		"d": "ptAmiPro",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.3": {
		"d": "ptAutoCAD",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.4": {
		"d": "ptBinary",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.5": {
		"d": "ptBMP",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.6": {
		"d": "ptCGM",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.7": {
		"d": "ptCorelCRT",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.8": {
		"d": "ptCorelDRW",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.9": {
		"d": "ptCorelEXC",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.10": {
		"d": "ptCorelPHT",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.11": {
		"d": "ptDraw",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.12": {
		"d": "ptDVI",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.13": {
		"d": "ptEPS",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.14": {
		"d": "ptExcel",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.15": {
		"d": "ptGEM",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.16": {
		"d": "ptGIF",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.17": {
		"d": "ptHPGL",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.18": {
		"d": "ptJPEG",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.19": {
		"d": "ptKodak",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.20": {
		"d": "ptLaTeX",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.21": {
		"d": "ptLotus",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.22": {
		"d": "ptLotusPIC",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.23": {
		"d": "ptMacPICT",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.24": {
		"d": "ptMacWord",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.25": {
		"d": "ptMSWfD",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.26": {
		"d": "ptMSWord",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.27": {
		"d": "ptMSWord2",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.28": {
		"d": "ptMSWord6",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.29": {
		"d": "ptMSWord8",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.30": {
		"d": "ptPDF",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.31": {
		"d": "ptPIF",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.32": {
		"d": "ptPostscript",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.33": {
		"d": "ptRTF",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.34": {
		"d": "ptSCITEX",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.35": {
		"d": "ptTAR",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.36": {
		"d": "ptTarga",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.37": {
		"d": "ptTeX",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.38": {
		"d": "ptText",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.39": {
		"d": "ptTIFF",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.40": {
		"d": "ptTIFF-FC",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.41": {
		"d": "ptUID",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.42": {
		"d": "ptUUEncode",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.43": {
		"d": "ptWMF",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.44": {
		"d": "ptWordPerfect",
		"c": "Teletrust presentation types"
	},
	"1.3.36.8.7.1.45": {
		"d": "ptWPGrph",
		"c": "Teletrust presentation types"
	},
	"1.3.101.1.4": {
		"d": "thawte-ce",
		"c": "Thawte"
	},
	"1.3.101.1.4.1": {
		"d": "strongExtranet",
		"c": "Thawte certificate extension"
	},
	"1.3.101.110": {
		"d": "curveX25519",
		"c": "ECDH 25519 key agreement algorithm"
	},
	"1.3.101.111": {
		"d": "curveX448",
		"c": "ECDH 448 key agreement algorithm"
	},
	"1.3.101.112": {
		"d": "curveEd25519",
		"c": "EdDSA 25519 signature algorithm"
	},
	"1.3.101.113": {
		"d": "curveEd448",
		"c": "EdDSA 448 signature algorithm"
	},
	"1.3.101.114": {
		"d": "curveEd25519ph",
		"c": "EdDSA 25519 pre-hash signature algorithm"
	},
	"1.3.101.115": {
		"d": "curveEd448ph",
		"c": "EdDSA 448 pre-hash signature algorithm"
	},
	"1.3.132.0.1": {
		"d": "sect163k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.2": {
		"d": "sect163r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.3": {
		"d": "sect239k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.4": {
		"d": "sect113r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.5": {
		"d": "sect113r2",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.6": {
		"d": "secp112r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.7": {
		"d": "secp112r2",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.8": {
		"d": "secp160r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.9": {
		"d": "secp160k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.10": {
		"d": "secp256k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.15": {
		"d": "sect163r2",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.16": {
		"d": "sect283k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.17": {
		"d": "sect283r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.22": {
		"d": "sect131r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.23": {
		"d": "sect131r2",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.24": {
		"d": "sect193r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.25": {
		"d": "sect193r2",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.26": {
		"d": "sect233k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.27": {
		"d": "sect233r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.28": {
		"d": "secp128r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.29": {
		"d": "secp128r2",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.30": {
		"d": "secp160r2",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.31": {
		"d": "secp192k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.32": {
		"d": "secp224k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.33": {
		"d": "secp224r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.34": {
		"d": "secp384r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.35": {
		"d": "secp521r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.36": {
		"d": "sect409k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.37": {
		"d": "sect409r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.38": {
		"d": "sect571k1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.0.39": {
		"d": "sect571r1",
		"c": "SECG (Certicom) named elliptic curve"
	},
	"1.3.132.1.11.1": {
		"d": "ecdhX963KDF-SHA256",
		"c": "SECG (Certicom) elliptic curve key agreement"
	},
	"1.3.132.1.11.2": {
		"d": "ecdhX963KDF-SHA384",
		"c": "SECG (Certicom) elliptic curve key agreement"
	},
	"1.3.132.1.11.3": {
		"d": "ecdhX963KDF-SHA512",
		"c": "SECG (Certicom) elliptic curve key agreement"
	},
	"1.3.133.16.840.9.44": {
		"d": "x944",
		"c": "X9.44"
	},
	"1.3.133.16.840.9.44.1": {
		"d": "x944Components",
		"c": "X9.44"
	},
	"1.3.133.16.840.9.44.1.1": {
		"d": "x944Kdf2",
		"c": "X9.44"
	},
	"1.3.133.16.840.9.44.1.2": {
		"d": "x944Kdf3",
		"c": "X9.44"
	},
	"1.3.133.16.840.9.84": {
		"d": "x984",
		"c": "X9.84"
	},
	"1.3.133.16.840.9.84.0": {
		"d": "x984Module",
		"c": "X9.84"
	},
	"1.3.133.16.840.9.84.0.1": {
		"d": "x984Biometrics",
		"c": "X9.84 Module"
	},
	"1.3.133.16.840.9.84.0.2": {
		"d": "x984CMS",
		"c": "X9.84 Module"
	},
	"1.3.133.16.840.9.84.0.3": {
		"d": "x984Identifiers",
		"c": "X9.84 Module"
	},
	"1.3.133.16.840.9.84.1": {
		"d": "x984Biometric",
		"c": "X9.84"
	},
	"1.3.133.16.840.9.84.1.0": {
		"d": "biometricUnknownType",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.1": {
		"d": "biometricBodyOdor",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.2": {
		"d": "biometricDNA",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.3": {
		"d": "biometricEarShape",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.4": {
		"d": "biometricFacialFeatures",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.5": {
		"d": "biometricFingerImage",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.6": {
		"d": "biometricFingerGeometry",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.7": {
		"d": "biometricHandGeometry",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.8": {
		"d": "biometricIrisFeatures",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.9": {
		"d": "biometricKeystrokeDynamics",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.10": {
		"d": "biometricPalm",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.11": {
		"d": "biometricRetina",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.12": {
		"d": "biometricSignature",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.13": {
		"d": "biometricSpeechPattern",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.14": {
		"d": "biometricThermalImage",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.15": {
		"d": "biometricVeinPattern",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.16": {
		"d": "biometricThermalFaceImage",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.17": {
		"d": "biometricThermalHandImage",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.18": {
		"d": "biometricLipMovement",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.1.19": {
		"d": "biometricGait",
		"c": "X9.84 Biometric"
	},
	"1.3.133.16.840.9.84.3": {
		"d": "x984MatchingMethod",
		"c": "X9.84"
	},
	"1.3.133.16.840.9.84.4": {
		"d": "x984FormatOwner",
		"c": "X9.84"
	},
	"1.3.133.16.840.9.84.4.0": {
		"d": "x984CbeffOwner",
		"c": "X9.84 Format Owner"
	},
	"1.3.133.16.840.9.84.4.1": {
		"d": "x984IbiaOwner",
		"c": "X9.84 Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.1": {
		"d": "ibiaOwnerSAFLINK",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.2": {
		"d": "ibiaOwnerBioscrypt",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.3": {
		"d": "ibiaOwnerVisionics",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.4": {
		"d": "ibiaOwnerInfineonTechnologiesAG",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.5": {
		"d": "ibiaOwnerIridianTechnologies",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.6": {
		"d": "ibiaOwnerVeridicom",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.7": {
		"d": "ibiaOwnerCyberSIGN",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.8": {
		"d": "ibiaOwnereCryp",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.9": {
		"d": "ibiaOwnerFingerprintCardsAB",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.10": {
		"d": "ibiaOwnerSecuGen",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.11": {
		"d": "ibiaOwnerPreciseBiometric",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.12": {
		"d": "ibiaOwnerIdentix",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.13": {
		"d": "ibiaOwnerDERMALOG",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.14": {
		"d": "ibiaOwnerLOGICO",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.15": {
		"d": "ibiaOwnerNIST",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.16": {
		"d": "ibiaOwnerA3Vision",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.17": {
		"d": "ibiaOwnerNEC",
		"c": "X9.84 IBIA Format Owner"
	},
	"1.3.133.16.840.9.84.4.1.18": {
		"d": "ibiaOwnerSTMicroelectronics",
		"c": "X9.84 IBIA Format Owner"
	},
	"2.5.4.0": {
		"d": "objectClass",
		"c": "X.520 DN component"
	},
	"2.5.4.1": {
		"d": "aliasedEntryName",
		"c": "X.520 DN component"
	},
	"2.5.4.2": {
		"d": "knowledgeInformation",
		"c": "X.520 DN component"
	},
	"2.5.4.3": {
		"d": "commonName",
		"c": "X.520 DN component"
	},
	"2.5.4.4": {
		"d": "surname",
		"c": "X.520 DN component"
	},
	"2.5.4.5": {
		"d": "serialNumber",
		"c": "X.520 DN component"
	},
	"2.5.4.6": {
		"d": "countryName",
		"c": "X.520 DN component"
	},
	"2.5.4.7": {
		"d": "localityName",
		"c": "X.520 DN component"
	},
	"2.5.4.7.1": {
		"d": "collectiveLocalityName",
		"c": "X.520 DN component"
	},
	"2.5.4.8": {
		"d": "stateOrProvinceName",
		"c": "X.520 DN component"
	},
	"2.5.4.8.1": {
		"d": "collectiveStateOrProvinceName",
		"c": "X.520 DN component"
	},
	"2.5.4.9": {
		"d": "streetAddress",
		"c": "X.520 DN component"
	},
	"2.5.4.9.1": {
		"d": "collectiveStreetAddress",
		"c": "X.520 DN component"
	},
	"2.5.4.10": {
		"d": "organizationName",
		"c": "X.520 DN component"
	},
	"2.5.4.10.1": {
		"d": "collectiveOrganizationName",
		"c": "X.520 DN component"
	},
	"2.5.4.11": {
		"d": "organizationalUnitName",
		"c": "X.520 DN component"
	},
	"2.5.4.11.1": {
		"d": "collectiveOrganizationalUnitName",
		"c": "X.520 DN component"
	},
	"2.5.4.12": {
		"d": "title",
		"c": "X.520 DN component"
	},
	"2.5.4.13": {
		"d": "description",
		"c": "X.520 DN component"
	},
	"2.5.4.14": {
		"d": "searchGuide",
		"c": "X.520 DN component"
	},
	"2.5.4.15": {
		"d": "businessCategory",
		"c": "X.520 DN component"
	},
	"2.5.4.16": {
		"d": "postalAddress",
		"c": "X.520 DN component"
	},
	"2.5.4.16.1": {
		"d": "collectivePostalAddress",
		"c": "X.520 DN component"
	},
	"2.5.4.17": {
		"d": "postalCode",
		"c": "X.520 DN component"
	},
	"2.5.4.17.1": {
		"d": "collectivePostalCode",
		"c": "X.520 DN component"
	},
	"2.5.4.18": {
		"d": "postOfficeBox",
		"c": "X.520 DN component"
	},
	"2.5.4.18.1": {
		"d": "collectivePostOfficeBox",
		"c": "X.520 DN component"
	},
	"2.5.4.19": {
		"d": "physicalDeliveryOfficeName",
		"c": "X.520 DN component"
	},
	"2.5.4.19.1": {
		"d": "collectivePhysicalDeliveryOfficeName",
		"c": "X.520 DN component"
	},
	"2.5.4.20": {
		"d": "telephoneNumber",
		"c": "X.520 DN component"
	},
	"2.5.4.20.1": {
		"d": "collectiveTelephoneNumber",
		"c": "X.520 DN component"
	},
	"2.5.4.21": {
		"d": "telexNumber",
		"c": "X.520 DN component"
	},
	"2.5.4.21.1": {
		"d": "collectiveTelexNumber",
		"c": "X.520 DN component"
	},
	"2.5.4.22": {
		"d": "teletexTerminalIdentifier",
		"c": "X.520 DN component"
	},
	"2.5.4.22.1": {
		"d": "collectiveTeletexTerminalIdentifier",
		"c": "X.520 DN component"
	},
	"2.5.4.23": {
		"d": "facsimileTelephoneNumber",
		"c": "X.520 DN component"
	},
	"2.5.4.23.1": {
		"d": "collectiveFacsimileTelephoneNumber",
		"c": "X.520 DN component"
	},
	"2.5.4.24": {
		"d": "x121Address",
		"c": "X.520 DN component"
	},
	"2.5.4.25": {
		"d": "internationalISDNNumber",
		"c": "X.520 DN component"
	},
	"2.5.4.25.1": {
		"d": "collectiveInternationalISDNNumber",
		"c": "X.520 DN component"
	},
	"2.5.4.26": {
		"d": "registeredAddress",
		"c": "X.520 DN component"
	},
	"2.5.4.27": {
		"d": "destinationIndicator",
		"c": "X.520 DN component"
	},
	"2.5.4.28": {
		"d": "preferredDeliveryMehtod",
		"c": "X.520 DN component"
	},
	"2.5.4.29": {
		"d": "presentationAddress",
		"c": "X.520 DN component"
	},
	"2.5.4.30": {
		"d": "supportedApplicationContext",
		"c": "X.520 DN component"
	},
	"2.5.4.31": {
		"d": "member",
		"c": "X.520 DN component"
	},
	"2.5.4.32": {
		"d": "owner",
		"c": "X.520 DN component"
	},
	"2.5.4.33": {
		"d": "roleOccupant",
		"c": "X.520 DN component"
	},
	"2.5.4.34": {
		"d": "seeAlso",
		"c": "X.520 DN component"
	},
	"2.5.4.35": {
		"d": "userPassword",
		"c": "X.520 DN component"
	},
	"2.5.4.36": {
		"d": "userCertificate",
		"c": "X.520 DN component"
	},
	"2.5.4.37": {
		"d": "caCertificate",
		"c": "X.520 DN component"
	},
	"2.5.4.38": {
		"d": "authorityRevocationList",
		"c": "X.520 DN component"
	},
	"2.5.4.39": {
		"d": "certificateRevocationList",
		"c": "X.520 DN component"
	},
	"2.5.4.40": {
		"d": "crossCertificatePair",
		"c": "X.520 DN component"
	},
	"2.5.4.41": {
		"d": "name",
		"c": "X.520 DN component"
	},
	"2.5.4.42": {
		"d": "givenName",
		"c": "X.520 DN component"
	},
	"2.5.4.43": {
		"d": "initials",
		"c": "X.520 DN component"
	},
	"2.5.4.44": {
		"d": "generationQualifier",
		"c": "X.520 DN component"
	},
	"2.5.4.45": {
		"d": "uniqueIdentifier",
		"c": "X.520 DN component"
	},
	"2.5.4.46": {
		"d": "dnQualifier",
		"c": "X.520 DN component"
	},
	"2.5.4.47": {
		"d": "enhancedSearchGuide",
		"c": "X.520 DN component"
	},
	"2.5.4.48": {
		"d": "protocolInformation",
		"c": "X.520 DN component"
	},
	"2.5.4.49": {
		"d": "distinguishedName",
		"c": "X.520 DN component"
	},
	"2.5.4.50": {
		"d": "uniqueMember",
		"c": "X.520 DN component"
	},
	"2.5.4.51": {
		"d": "houseIdentifier",
		"c": "X.520 DN component"
	},
	"2.5.4.52": {
		"d": "supportedAlgorithms",
		"c": "X.520 DN component"
	},
	"2.5.4.53": {
		"d": "deltaRevocationList",
		"c": "X.520 DN component"
	},
	"2.5.4.54": {
		"d": "dmdName",
		"c": "X.520 DN component"
	},
	"2.5.4.55": {
		"d": "clearance",
		"c": "X.520 DN component"
	},
	"2.5.4.56": {
		"d": "defaultDirQop",
		"c": "X.520 DN component"
	},
	"2.5.4.57": {
		"d": "attributeIntegrityInfo",
		"c": "X.520 DN component"
	},
	"2.5.4.58": {
		"d": "attributeCertificate",
		"c": "X.520 DN component"
	},
	"2.5.4.59": {
		"d": "attributeCertificateRevocationList",
		"c": "X.520 DN component"
	},
	"2.5.4.60": {
		"d": "confKeyInfo",
		"c": "X.520 DN component"
	},
	"2.5.4.61": {
		"d": "aACertificate",
		"c": "X.520 DN component"
	},
	"2.5.4.62": {
		"d": "attributeDescriptorCertificate",
		"c": "X.520 DN component"
	},
	"2.5.4.63": {
		"d": "attributeAuthorityRevocationList",
		"c": "X.520 DN component"
	},
	"2.5.4.64": {
		"d": "familyInformation",
		"c": "X.520 DN component"
	},
	"2.5.4.65": {
		"d": "pseudonym",
		"c": "X.520 DN component"
	},
	"2.5.4.66": {
		"d": "communicationsService",
		"c": "X.520 DN component"
	},
	"2.5.4.67": {
		"d": "communicationsNetwork",
		"c": "X.520 DN component"
	},
	"2.5.4.68": {
		"d": "certificationPracticeStmt",
		"c": "X.520 DN component"
	},
	"2.5.4.69": {
		"d": "certificatePolicy",
		"c": "X.520 DN component"
	},
	"2.5.4.70": {
		"d": "pkiPath",
		"c": "X.520 DN component"
	},
	"2.5.4.71": {
		"d": "privPolicy",
		"c": "X.520 DN component"
	},
	"2.5.4.72": {
		"d": "role",
		"c": "X.520 DN component"
	},
	"2.5.4.73": {
		"d": "delegationPath",
		"c": "X.520 DN component"
	},
	"2.5.4.74": {
		"d": "protPrivPolicy",
		"c": "X.520 DN component"
	},
	"2.5.4.75": {
		"d": "xMLPrivilegeInfo",
		"c": "X.520 DN component"
	},
	"2.5.4.76": {
		"d": "xmlPrivPolicy",
		"c": "X.520 DN component"
	},
	"2.5.4.82": {
		"d": "permission",
		"c": "X.520 DN component"
	},
	"2.5.6.0": {
		"d": "top",
		"c": "X.520 objectClass"
	},
	"2.5.6.1": {
		"d": "alias",
		"c": "X.520 objectClass"
	},
	"2.5.6.2": {
		"d": "country",
		"c": "X.520 objectClass"
	},
	"2.5.6.3": {
		"d": "locality",
		"c": "X.520 objectClass"
	},
	"2.5.6.4": {
		"d": "organization",
		"c": "X.520 objectClass"
	},
	"2.5.6.5": {
		"d": "organizationalUnit",
		"c": "X.520 objectClass"
	},
	"2.5.6.6": {
		"d": "person",
		"c": "X.520 objectClass"
	},
	"2.5.6.7": {
		"d": "organizationalPerson",
		"c": "X.520 objectClass"
	},
	"2.5.6.8": {
		"d": "organizationalRole",
		"c": "X.520 objectClass"
	},
	"2.5.6.9": {
		"d": "groupOfNames",
		"c": "X.520 objectClass"
	},
	"2.5.6.10": {
		"d": "residentialPerson",
		"c": "X.520 objectClass"
	},
	"2.5.6.11": {
		"d": "applicationProcess",
		"c": "X.520 objectClass"
	},
	"2.5.6.12": {
		"d": "applicationEntity",
		"c": "X.520 objectClass"
	},
	"2.5.6.13": {
		"d": "dSA",
		"c": "X.520 objectClass"
	},
	"2.5.6.14": {
		"d": "device",
		"c": "X.520 objectClass"
	},
	"2.5.6.15": {
		"d": "strongAuthenticationUser",
		"c": "X.520 objectClass"
	},
	"2.5.6.16": {
		"d": "certificateAuthority",
		"c": "X.520 objectClass"
	},
	"2.5.6.17": {
		"d": "groupOfUniqueNames",
		"c": "X.520 objectClass"
	},
	"2.5.6.21": {
		"d": "pkiUser",
		"c": "X.520 objectClass"
	},
	"2.5.6.22": {
		"d": "pkiCA",
		"c": "X.520 objectClass"
	},
	"2.5.8.1.1": {
		"d": "rsa",
		"c": "X.500 algorithms.  Ambiguous, since no padding rules specified",
		"w": true
	},
	"2.5.29.1": {
		"d": "authorityKeyIdentifier",
		"c": "X.509 extension.  Deprecated, use 2 5 29 35 instead",
		"w": true
	},
	"2.5.29.2": {
		"d": "keyAttributes",
		"c": "X.509 extension.  Obsolete, use keyUsage/extKeyUsage instead",
		"w": true
	},
	"2.5.29.3": {
		"d": "certificatePolicies",
		"c": "X.509 extension.  Deprecated, use 2 5 29 32 instead",
		"w": true
	},
	"2.5.29.4": {
		"d": "keyUsageRestriction",
		"c": "X.509 extension.  Obsolete, use keyUsage/extKeyUsage instead",
		"w": true
	},
	"2.5.29.5": {
		"d": "policyMapping",
		"c": "X.509 extension.  Deprecated, use 2 5 29 33 instead",
		"w": true
	},
	"2.5.29.6": {
		"d": "subtreesConstraint",
		"c": "X.509 extension.  Obsolete, use nameConstraints instead",
		"w": true
	},
	"2.5.29.7": {
		"d": "subjectAltName",
		"c": "X.509 extension.  Deprecated, use 2 5 29 17 instead",
		"w": true
	},
	"2.5.29.8": {
		"d": "issuerAltName",
		"c": "X.509 extension.  Deprecated, use 2 5 29 18 instead",
		"w": true
	},
	"2.5.29.9": {
		"d": "subjectDirectoryAttributes",
		"c": "X.509 extension"
	},
	"2.5.29.10": {
		"d": "basicConstraints",
		"c": "X.509 extension.  Deprecated, use 2 5 29 19 instead",
		"w": true
	},
	"2.5.29.11": {
		"d": "nameConstraints",
		"c": "X.509 extension.  Deprecated, use 2 5 29 30 instead",
		"w": true
	},
	"2.5.29.12": {
		"d": "policyConstraints",
		"c": "X.509 extension.  Deprecated, use 2 5 29 36 instead",
		"w": true
	},
	"2.5.29.13": {
		"d": "basicConstraints",
		"c": "X.509 extension.  Deprecated, use 2 5 29 19 instead",
		"w": true
	},
	"2.5.29.14": {
		"d": "subjectKeyIdentifier",
		"c": "X.509 extension"
	},
	"2.5.29.15": {
		"d": "keyUsage",
		"c": "X.509 extension"
	},
	"2.5.29.16": {
		"d": "privateKeyUsagePeriod",
		"c": "X.509 extension"
	},
	"2.5.29.17": {
		"d": "subjectAltName",
		"c": "X.509 extension"
	},
	"2.5.29.18": {
		"d": "issuerAltName",
		"c": "X.509 extension"
	},
	"2.5.29.19": {
		"d": "basicConstraints",
		"c": "X.509 extension"
	},
	"2.5.29.20": {
		"d": "cRLNumber",
		"c": "X.509 extension"
	},
	"2.5.29.21": {
		"d": "cRLReason",
		"c": "X.509 extension"
	},
	"2.5.29.22": {
		"d": "expirationDate",
		"c": "X.509 extension.  Deprecated, alternative OID uncertain",
		"w": true
	},
	"2.5.29.23": {
		"d": "instructionCode",
		"c": "X.509 extension"
	},
	"2.5.29.24": {
		"d": "invalidityDate",
		"c": "X.509 extension"
	},
	"2.5.29.25": {
		"d": "cRLDistributionPoints",
		"c": "X.509 extension.  Deprecated, use 2 5 29 31 instead",
		"w": true
	},
	"2.5.29.26": {
		"d": "issuingDistributionPoint",
		"c": "X.509 extension.  Deprecated, use 2 5 29 28 instead",
		"w": true
	},
	"2.5.29.27": {
		"d": "deltaCRLIndicator",
		"c": "X.509 extension"
	},
	"2.5.29.28": {
		"d": "issuingDistributionPoint",
		"c": "X.509 extension"
	},
	"2.5.29.29": {
		"d": "certificateIssuer",
		"c": "X.509 extension"
	},
	"2.5.29.30": {
		"d": "nameConstraints",
		"c": "X.509 extension"
	},
	"2.5.29.31": {
		"d": "cRLDistributionPoints",
		"c": "X.509 extension"
	},
	"2.5.29.32": {
		"d": "certificatePolicies",
		"c": "X.509 extension"
	},
	"2.5.29.32.0": {
		"d": "anyPolicy",
		"c": "X.509 certificate policy"
	},
	"2.5.29.33": {
		"d": "policyMappings",
		"c": "X.509 extension"
	},
	"2.5.29.34": {
		"d": "policyConstraints",
		"c": "X.509 extension.  Deprecated, use 2 5 29 36 instead",
		"w": true
	},
	"2.5.29.35": {
		"d": "authorityKeyIdentifier",
		"c": "X.509 extension"
	},
	"2.5.29.36": {
		"d": "policyConstraints",
		"c": "X.509 extension"
	},
	"2.5.29.37": {
		"d": "extKeyUsage",
		"c": "X.509 extension"
	},
	"2.5.29.37.0": {
		"d": "anyExtendedKeyUsage",
		"c": "X.509 extended key usage"
	},
	"2.5.29.38": {
		"d": "authorityAttributeIdentifier",
		"c": "X.509 extension"
	},
	"2.5.29.39": {
		"d": "roleSpecCertIdentifier",
		"c": "X.509 extension"
	},
	"2.5.29.40": {
		"d": "cRLStreamIdentifier",
		"c": "X.509 extension"
	},
	"2.5.29.41": {
		"d": "basicAttConstraints",
		"c": "X.509 extension"
	},
	"2.5.29.42": {
		"d": "delegatedNameConstraints",
		"c": "X.509 extension"
	},
	"2.5.29.43": {
		"d": "timeSpecification",
		"c": "X.509 extension"
	},
	"2.5.29.44": {
		"d": "cRLScope",
		"c": "X.509 extension"
	},
	"2.5.29.45": {
		"d": "statusReferrals",
		"c": "X.509 extension"
	},
	"2.5.29.46": {
		"d": "freshestCRL",
		"c": "X.509 extension"
	},
	"2.5.29.47": {
		"d": "orderedList",
		"c": "X.509 extension"
	},
	"2.5.29.48": {
		"d": "attributeDescriptor",
		"c": "X.509 extension"
	},
	"2.5.29.49": {
		"d": "userNotice",
		"c": "X.509 extension"
	},
	"2.5.29.50": {
		"d": "sOAIdentifier",
		"c": "X.509 extension"
	},
	"2.5.29.51": {
		"d": "baseUpdateTime",
		"c": "X.509 extension"
	},
	"2.5.29.52": {
		"d": "acceptableCertPolicies",
		"c": "X.509 extension"
	},
	"2.5.29.53": {
		"d": "deltaInfo",
		"c": "X.509 extension"
	},
	"2.5.29.54": {
		"d": "inhibitAnyPolicy",
		"c": "X.509 extension"
	},
	"2.5.29.55": {
		"d": "targetInformation",
		"c": "X.509 extension"
	},
	"2.5.29.56": {
		"d": "noRevAvail",
		"c": "X.509 extension"
	},
	"2.5.29.57": {
		"d": "acceptablePrivilegePolicies",
		"c": "X.509 extension"
	},
	"2.5.29.58": {
		"d": "toBeRevoked",
		"c": "X.509 extension"
	},
	"2.5.29.59": {
		"d": "revokedGroups",
		"c": "X.509 extension"
	},
	"2.5.29.60": {
		"d": "expiredCertsOnCRL",
		"c": "X.509 extension"
	},
	"2.5.29.61": {
		"d": "indirectIssuer",
		"c": "X.509 extension"
	},
	"2.5.29.62": {
		"d": "noAssertion",
		"c": "X.509 extension"
	},
	"2.5.29.63": {
		"d": "aAissuingDistributionPoint",
		"c": "X.509 extension"
	},
	"2.5.29.64": {
		"d": "issuedOnBehalfOf",
		"c": "X.509 extension"
	},
	"2.5.29.65": {
		"d": "singleUse",
		"c": "X.509 extension"
	},
	"2.5.29.66": {
		"d": "groupAC",
		"c": "X.509 extension"
	},
	"2.5.29.67": {
		"d": "allowedAttAss",
		"c": "X.509 extension"
	},
	"2.5.29.68": {
		"d": "attributeMappings",
		"c": "X.509 extension"
	},
	"2.5.29.69": {
		"d": "holderNameConstraints",
		"c": "X.509 extension"
	},
	"2.16.724.1.2.2.4.1": {
		"d": "personalDataInfo",
		"c": "Spanish Government PKI?"
	},
	"2.16.840.1.101.2.1.1.1": {
		"d": "sdnsSignatureAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.2": {
		"d": "fortezzaSignatureAlgorithm",
		"c": "SDN.700 INFOSEC algorithms.  Formerly known as mosaicSignatureAlgorithm, this OID is better known as dsaWithSHA-1."
	},
	"2.16.840.1.101.2.1.1.3": {
		"d": "sdnsConfidentialityAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.4": {
		"d": "fortezzaConfidentialityAlgorithm",
		"c": "SDN.700 INFOSEC algorithms.  Formerly known as mosaicConfidentialityAlgorithm"
	},
	"2.16.840.1.101.2.1.1.5": {
		"d": "sdnsIntegrityAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.6": {
		"d": "fortezzaIntegrityAlgorithm",
		"c": "SDN.700 INFOSEC algorithms.  Formerly known as mosaicIntegrityAlgorithm"
	},
	"2.16.840.1.101.2.1.1.7": {
		"d": "sdnsTokenProtectionAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.8": {
		"d": "fortezzaTokenProtectionAlgorithm",
		"c": "SDN.700 INFOSEC algorithms.  Formerly know as mosaicTokenProtectionAlgorithm"
	},
	"2.16.840.1.101.2.1.1.9": {
		"d": "sdnsKeyManagementAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.10": {
		"d": "fortezzaKeyManagementAlgorithm",
		"c": "SDN.700 INFOSEC algorithms.  Formerly known as mosaicKeyManagementAlgorithm"
	},
	"2.16.840.1.101.2.1.1.11": {
		"d": "sdnsKMandSigAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.12": {
		"d": "fortezzaKMandSigAlgorithm",
		"c": "SDN.700 INFOSEC algorithms.  Formerly known as mosaicKMandSigAlgorithm"
	},
	"2.16.840.1.101.2.1.1.13": {
		"d": "suiteASignatureAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.14": {
		"d": "suiteAConfidentialityAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.15": {
		"d": "suiteAIntegrityAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.16": {
		"d": "suiteATokenProtectionAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.17": {
		"d": "suiteAKeyManagementAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.18": {
		"d": "suiteAKMandSigAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.19": {
		"d": "fortezzaUpdatedSigAlgorithm",
		"c": "SDN.700 INFOSEC algorithms.  Formerly known as mosaicUpdatedSigAlgorithm"
	},
	"2.16.840.1.101.2.1.1.20": {
		"d": "fortezzaKMandUpdSigAlgorithms",
		"c": "SDN.700 INFOSEC algorithms.  Formerly known as mosaicKMandUpdSigAlgorithms"
	},
	"2.16.840.1.101.2.1.1.21": {
		"d": "fortezzaUpdatedIntegAlgorithm",
		"c": "SDN.700 INFOSEC algorithms.  Formerly known as mosaicUpdatedIntegAlgorithm"
	},
	"2.16.840.1.101.2.1.1.22": {
		"d": "keyExchangeAlgorithm",
		"c": "SDN.700 INFOSEC algorithms.  Formerly known as mosaicKeyEncryptionAlgorithm"
	},
	"2.16.840.1.101.2.1.1.23": {
		"d": "fortezzaWrap80Algorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.1.24": {
		"d": "kEAKeyEncryptionAlgorithm",
		"c": "SDN.700 INFOSEC algorithms"
	},
	"2.16.840.1.101.2.1.2.1": {
		"d": "rfc822MessageFormat",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.2": {
		"d": "emptyContent",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.3": {
		"d": "cspContentType",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.42": {
		"d": "mspRev3ContentType",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.48": {
		"d": "mspContentType",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.49": {
		"d": "mspRekeyAgentProtocol",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.50": {
		"d": "mspMMP",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.66": {
		"d": "mspRev3-1ContentType",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.72": {
		"d": "forwardedMSPMessageBodyPart",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.73": {
		"d": "mspForwardedMessageParameters",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.74": {
		"d": "forwardedCSPMsgBodyPart",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.75": {
		"d": "cspForwardedMessageParameters",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.76": {
		"d": "mspMMP2",
		"c": "SDN.700 INFOSEC format"
	},
	"2.16.840.1.101.2.1.2.78.2": {
		"d": "encryptedKeyPackage",
		"c": "SDN.700 INFOSEC format and RFC 6032"
	},
	"2.16.840.1.101.2.1.2.78.3": {
		"d": "keyPackageReceipt",
		"c": "SDN.700 INFOSEC format and RFC 7191"
	},
	"2.16.840.1.101.2.1.2.78.6": {
		"d": "keyPackageError",
		"c": "SDN.700 INFOSEC format and RFC 7191"
	},
	"2.16.840.1.101.2.1.3.1": {
		"d": "sdnsSecurityPolicy",
		"c": "SDN.700 INFOSEC policy"
	},
	"2.16.840.1.101.2.1.3.2": {
		"d": "sdnsPRBAC",
		"c": "SDN.700 INFOSEC policy"
	},
	"2.16.840.1.101.2.1.3.3": {
		"d": "mosaicPRBAC",
		"c": "SDN.700 INFOSEC policy"
	},
	"2.16.840.1.101.2.1.3.10": {
		"d": "siSecurityPolicy",
		"c": "SDN.700 INFOSEC policy"
	},
	"2.16.840.1.101.2.1.3.10.0": {
		"d": "siNASP",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.1": {
		"d": "siELCO",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.2": {
		"d": "siTK",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.3": {
		"d": "siDSAP",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.4": {
		"d": "siSSSS",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.5": {
		"d": "siDNASP",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.6": {
		"d": "siBYEMAN",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.7": {
		"d": "siREL-US",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.8": {
		"d": "siREL-AUS",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.9": {
		"d": "siREL-CAN",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.10": {
		"d": "siREL_UK",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.11": {
		"d": "siREL-NZ",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.10.12": {
		"d": "siGeneric",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.11": {
		"d": "genser",
		"c": "SDN.700 INFOSEC policy"
	},
	"2.16.840.1.101.2.1.3.11.0": {
		"d": "genserNations",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.11.1": {
		"d": "genserComsec",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.11.2": {
		"d": "genserAcquisition",
		"c": "SDN.700 INFOSEC policy (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.3.11.3": {
		"d": "genserSecurityCategories",
		"c": "SDN.700 INFOSEC policy"
	},
	"2.16.840.1.101.2.1.3.11.3.0": {
		"d": "genserTagSetName",
		"c": "SDN.700 INFOSEC GENSER policy"
	},
	"2.16.840.1.101.2.1.3.12": {
		"d": "defaultSecurityPolicy",
		"c": "SDN.700 INFOSEC policy"
	},
	"2.16.840.1.101.2.1.3.13": {
		"d": "capcoMarkings",
		"c": "SDN.700 INFOSEC policy"
	},
	"2.16.840.1.101.2.1.3.13.0": {
		"d": "capcoSecurityCategories",
		"c": "SDN.700 INFOSEC policy CAPCO markings"
	},
	"2.16.840.1.101.2.1.3.13.0.1": {
		"d": "capcoTagSetName1",
		"c": "SDN.700 INFOSEC policy CAPCO markings"
	},
	"2.16.840.1.101.2.1.3.13.0.2": {
		"d": "capcoTagSetName2",
		"c": "SDN.700 INFOSEC policy CAPCO markings"
	},
	"2.16.840.1.101.2.1.3.13.0.3": {
		"d": "capcoTagSetName3",
		"c": "SDN.700 INFOSEC policy CAPCO markings"
	},
	"2.16.840.1.101.2.1.3.13.0.4": {
		"d": "capcoTagSetName4",
		"c": "SDN.700 INFOSEC policy CAPCO markings"
	},
	"2.16.840.1.101.2.1.5.1": {
		"d": "sdnsKeyManagementCertificate",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.2": {
		"d": "sdnsUserSignatureCertificate",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.3": {
		"d": "sdnsKMandSigCertificate",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.4": {
		"d": "fortezzaKeyManagementCertificate",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.5": {
		"d": "fortezzaKMandSigCertificate",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.6": {
		"d": "fortezzaUserSignatureCertificate",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.7": {
		"d": "fortezzaCASignatureCertificate",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.8": {
		"d": "sdnsCASignatureCertificate",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.10": {
		"d": "auxiliaryVector",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.11": {
		"d": "mlReceiptPolicy",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.12": {
		"d": "mlMembership",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.13": {
		"d": "mlAdministrators",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.14": {
		"d": "alid",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.20": {
		"d": "janUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.21": {
		"d": "febUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.22": {
		"d": "marUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.23": {
		"d": "aprUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.24": {
		"d": "mayUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.25": {
		"d": "junUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.26": {
		"d": "julUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.27": {
		"d": "augUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.28": {
		"d": "sepUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.29": {
		"d": "octUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.30": {
		"d": "novUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.31": {
		"d": "decUKMs",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.40": {
		"d": "metaSDNSckl",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.41": {
		"d": "sdnsCKL",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.42": {
		"d": "metaSDNSsignatureCKL",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.43": {
		"d": "sdnsSignatureCKL",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.44": {
		"d": "sdnsCertificateRevocationList",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.45": {
		"d": "fortezzaCertificateRevocationList",
		"c": "SDN.700 INFOSEC attributes (superseded)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.46": {
		"d": "fortezzaCKL",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.47": {
		"d": "alExemptedAddressProcessor",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.48": {
		"d": "guard",
		"c": "SDN.700 INFOSEC attributes (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.49": {
		"d": "algorithmsSupported",
		"c": "SDN.700 INFOSEC attributes (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.50": {
		"d": "suiteAKeyManagementCertificate",
		"c": "SDN.700 INFOSEC attributes (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.51": {
		"d": "suiteAKMandSigCertificate",
		"c": "SDN.700 INFOSEC attributes (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.52": {
		"d": "suiteAUserSignatureCertificate",
		"c": "SDN.700 INFOSEC attributes (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.53": {
		"d": "prbacInfo",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.54": {
		"d": "prbacCAConstraints",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.55": {
		"d": "sigOrKMPrivileges",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.56": {
		"d": "commPrivileges",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.57": {
		"d": "labeledAttribute",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.58": {
		"d": "policyInformationFile",
		"c": "SDN.700 INFOSEC attributes (obsolete)",
		"w": true
	},
	"2.16.840.1.101.2.1.5.59": {
		"d": "secPolicyInformationFile",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.60": {
		"d": "cAClearanceConstraint",
		"c": "SDN.700 INFOSEC attributes"
	},
	"2.16.840.1.101.2.1.5.65": {
		"d": "keyPkgIdAndReceiptReq",
		"c": "SDN.700 INFOSEC attributes and RFC 7191"
	},
	"2.16.840.1.101.2.1.5.66": {
		"d": "contentDecryptKeyID",
		"c": "SDN.700 INFOSEC attributes and RFC 6032"
	},
	"2.16.840.1.101.2.1.5.70": {
		"d": "kpCrlPointers",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.5.71": {
		"d": "kpKeyProvinceV2",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.5.72": {
		"d": "kpManifest",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.7.1": {
		"d": "cspExtns",
		"c": "SDN.700 INFOSEC extensions"
	},
	"2.16.840.1.101.2.1.7.1.0": {
		"d": "cspCsExtn",
		"c": "SDN.700 INFOSEC extensions"
	},
	"2.16.840.1.101.2.1.8.1": {
		"d": "mISSISecurityCategories",
		"c": "SDN.700 INFOSEC security category"
	},
	"2.16.840.1.101.2.1.8.2": {
		"d": "standardSecurityLabelPrivileges",
		"c": "SDN.700 INFOSEC security category"
	},
	"2.16.840.1.101.2.1.8.3.1": {
		"d": "enumeratedPermissiveAttrs",
		"c": "SDN.700 INFOSEC security category from RFC 7906"
	},
	"2.16.840.1.101.2.1.8.3.3": {
		"d": "informativeAttrs",
		"c": "SDN.700 INFOSEC security category from RFC 7906"
	},
	"2.16.840.1.101.2.1.8.3.4": {
		"d": "enumeratedRestrictiveAttrs",
		"c": "SDN.700 INFOSEC security category from RFC 7906"
	},
	"2.16.840.1.101.2.1.10.1": {
		"d": "sigPrivileges",
		"c": "SDN.700 INFOSEC privileges"
	},
	"2.16.840.1.101.2.1.10.2": {
		"d": "kmPrivileges",
		"c": "SDN.700 INFOSEC privileges"
	},
	"2.16.840.1.101.2.1.10.3": {
		"d": "namedTagSetPrivilege",
		"c": "SDN.700 INFOSEC privileges"
	},
	"2.16.840.1.101.2.1.11.1": {
		"d": "ukDemo",
		"c": "SDN.700 INFOSEC certificate policy"
	},
	"2.16.840.1.101.2.1.11.2": {
		"d": "usDODClass2",
		"c": "SDN.700 INFOSEC certificate policy"
	},
	"2.16.840.1.101.2.1.11.3": {
		"d": "usMediumPilot",
		"c": "SDN.700 INFOSEC certificate policy"
	},
	"2.16.840.1.101.2.1.11.4": {
		"d": "usDODClass4",
		"c": "SDN.700 INFOSEC certificate policy"
	},
	"2.16.840.1.101.2.1.11.5": {
		"d": "usDODClass3",
		"c": "SDN.700 INFOSEC certificate policy"
	},
	"2.16.840.1.101.2.1.11.6": {
		"d": "usDODClass5",
		"c": "SDN.700 INFOSEC certificate policy"
	},
	"2.16.840.1.101.2.1.12.0": {
		"d": "testSecurityPolicy",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.1": {
		"d": "tsp1",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.1.0": {
		"d": "tsp1SecurityCategories",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.1.0.0": {
		"d": "tsp1TagSetZero",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.1.0.1": {
		"d": "tsp1TagSetOne",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.1.0.2": {
		"d": "tsp1TagSetTwo",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.2": {
		"d": "tsp2",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.2.0": {
		"d": "tsp2SecurityCategories",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.2.0.0": {
		"d": "tsp2TagSetZero",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.2.0.1": {
		"d": "tsp2TagSetOne",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.2.0.2": {
		"d": "tsp2TagSetTwo",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.3": {
		"d": "kafka",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.3.0": {
		"d": "kafkaSecurityCategories",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.3.0.1": {
		"d": "kafkaTagSetName1",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.3.0.2": {
		"d": "kafkaTagSetName2",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.0.3.0.3": {
		"d": "kafkaTagSetName3",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.12.1.1": {
		"d": "tcp1",
		"c": "SDN.700 INFOSEC test objects"
	},
	"2.16.840.1.101.2.1.13.1": {
		"d": "kmaKeyAlgorithm",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.3": {
		"d": "kmaTSECNomenclature",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.5": {
		"d": "kmaKeyDistPeriod",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.6": {
		"d": "kmaKeyValidityPeriod",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.7": {
		"d": "kmaKeyDuration",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.11": {
		"d": "kmaSplitID",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.12": {
		"d": "kmaKeyPkgType",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.13": {
		"d": "kmaKeyPurpose",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.14": {
		"d": "kmaKeyUse",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.15": {
		"d": "kmaTransportKey",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.16": {
		"d": "kmaKeyPkgReceiversV2",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.19": {
		"d": "kmaOtherCertFormats",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.20": {
		"d": "kmaUsefulCerts",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.21": {
		"d": "kmaKeyWrapAlgorithm",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.13.22": {
		"d": "kmaSigUsageV3",
		"c": "SDN.700 INFOSEC attributes and RFC 7906"
	},
	"2.16.840.1.101.2.1.16.0": {
		"d": "dn",
		"c": "SDN.700 INFOSEC attributes and RFC 7191"
	},
	"2.16.840.1.101.2.1.22": {
		"d": "errorCodes",
		"c": "RFC 7906 key attribute error codes"
	},
	"2.16.840.1.101.2.1.22.1": {
		"d": "missingKeyType",
		"c": "RFC 7906 key attribute error codes"
	},
	"2.16.840.1.101.2.1.22.2": {
		"d": "privacyMarkTooLong",
		"c": "RFC 7906 key attribute error codes"
	},
	"2.16.840.1.101.2.1.22.3": {
		"d": "unrecognizedSecurityPolicy",
		"c": "RFC 7906 key attribute error codes"
	},
	"2.16.840.1.101.3.1": {
		"d": "slabel",
		"c": "CSOR GAK",
		"w": true
	},
	"2.16.840.1.101.3.2": {
		"d": "pki",
		"c": "NIST",
		"w": true
	},
	"2.16.840.1.101.3.2.1": {
		"d": "NIST policyIdentifier",
		"c": "NIST policies",
		"w": true
	},
	"2.16.840.1.101.3.2.1.3.1": {
		"d": "fbcaRudimentaryPolicy",
		"c": "Federal Bridge CA Policy"
	},
	"2.16.840.1.101.3.2.1.3.2": {
		"d": "fbcaBasicPolicy",
		"c": "Federal Bridge CA Policy"
	},
	"2.16.840.1.101.3.2.1.3.3": {
		"d": "fbcaMediumPolicy",
		"c": "Federal Bridge CA Policy"
	},
	"2.16.840.1.101.3.2.1.3.4": {
		"d": "fbcaHighPolicy",
		"c": "Federal Bridge CA Policy"
	},
	"2.16.840.1.101.3.2.1.48.1": {
		"d": "nistTestPolicy1",
		"c": "NIST PKITS policies"
	},
	"2.16.840.1.101.3.2.1.48.2": {
		"d": "nistTestPolicy2",
		"c": "NIST PKITS policies"
	},
	"2.16.840.1.101.3.2.1.48.3": {
		"d": "nistTestPolicy3",
		"c": "NIST PKITS policies"
	},
	"2.16.840.1.101.3.2.1.48.4": {
		"d": "nistTestPolicy4",
		"c": "NIST PKITS policies"
	},
	"2.16.840.1.101.3.2.1.48.5": {
		"d": "nistTestPolicy5",
		"c": "NIST PKITS policies"
	},
	"2.16.840.1.101.3.2.1.48.6": {
		"d": "nistTestPolicy6",
		"c": "NIST PKITS policies"
	},
	"2.16.840.1.101.3.2.2": {
		"d": "gak",
		"c": "CSOR GAK extended key usage",
		"w": true
	},
	"2.16.840.1.101.3.2.2.1": {
		"d": "kRAKey",
		"c": "CSOR GAK extended key usage",
		"w": true
	},
	"2.16.840.1.101.3.2.3": {
		"d": "extensions",
		"c": "CSOR GAK extensions",
		"w": true
	},
	"2.16.840.1.101.3.2.3.1": {
		"d": "kRTechnique",
		"c": "CSOR GAK extensions",
		"w": true
	},
	"2.16.840.1.101.3.2.3.2": {
		"d": "kRecoveryCapable",
		"c": "CSOR GAK extensions",
		"w": true
	},
	"2.16.840.1.101.3.2.3.3": {
		"d": "kR",
		"c": "CSOR GAK extensions",
		"w": true
	},
	"2.16.840.1.101.3.2.4": {
		"d": "keyRecoverySchemes",
		"c": "CSOR GAK",
		"w": true
	},
	"2.16.840.1.101.3.2.5": {
		"d": "krapola",
		"c": "CSOR GAK",
		"w": true
	},
	"2.16.840.1.101.3.3": {
		"d": "arpa",
		"c": "CSOR GAK",
		"w": true
	},
	"2.16.840.1.101.3.4": {
		"d": "nistAlgorithm",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1": {
		"d": "aes",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.1": {
		"d": "aes128-ECB",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.2": {
		"d": "aes128-CBC",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.3": {
		"d": "aes128-OFB",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.4": {
		"d": "aes128-CFB",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.5": {
		"d": "aes128-wrap",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.6": {
		"d": "aes128-GCM",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.7": {
		"d": "aes128-CCM",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.8": {
		"d": "aes128-wrap-pad",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.21": {
		"d": "aes192-ECB",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.22": {
		"d": "aes192-CBC",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.23": {
		"d": "aes192-OFB",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.24": {
		"d": "aes192-CFB",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.25": {
		"d": "aes192-wrap",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.26": {
		"d": "aes192-GCM",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.27": {
		"d": "aes192-CCM",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.28": {
		"d": "aes192-wrap-pad",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.41": {
		"d": "aes256-ECB",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.42": {
		"d": "aes256-CBC",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.43": {
		"d": "aes256-OFB",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.44": {
		"d": "aes256-CFB",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.45": {
		"d": "aes256-wrap",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.46": {
		"d": "aes256-GCM",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.47": {
		"d": "aes256-CCM",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.1.48": {
		"d": "aes256-wrap-pad",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2": {
		"d": "hashAlgos",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.1": {
		"d": "sha-256",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.2": {
		"d": "sha-384",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.3": {
		"d": "sha-512",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.4": {
		"d": "sha-224",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.11": {
		"d": "shake128",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.12": {
		"d": "shake256",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.17": {
		"d": "shake128len",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.18": {
		"d": "shake256len",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.19": {
		"d": "kmacShake128",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.2.20": {
		"d": "kmacShake256",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.3.1": {
		"d": "dsaWithSha224",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.101.3.4.3.2": {
		"d": "dsaWithSha256",
		"c": "NIST Algorithm"
	},
	"2.16.840.1.113719.1.2.8": {
		"d": "novellAlgorithm",
		"c": "Novell"
	},
	"2.16.840.1.113719.1.2.8.22": {
		"d": "desCbcIV8",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.23": {
		"d": "desCbcPadIV8",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.24": {
		"d": "desEDE2CbcIV8",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.25": {
		"d": "desEDE2CbcPadIV8",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.26": {
		"d": "desEDE3CbcIV8",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.27": {
		"d": "desEDE3CbcPadIV8",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.28": {
		"d": "rc5CbcPad",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.29": {
		"d": "md2WithRSAEncryptionBSafe1",
		"c": "Novell signature algorithm"
	},
	"2.16.840.1.113719.1.2.8.30": {
		"d": "md5WithRSAEncryptionBSafe1",
		"c": "Novell signature algorithm"
	},
	"2.16.840.1.113719.1.2.8.31": {
		"d": "sha1WithRSAEncryptionBSafe1",
		"c": "Novell signature algorithm"
	},
	"2.16.840.1.113719.1.2.8.32": {
		"d": "lmDigest",
		"c": "Novell digest algorithm"
	},
	"2.16.840.1.113719.1.2.8.40": {
		"d": "md2",
		"c": "Novell digest algorithm"
	},
	"2.16.840.1.113719.1.2.8.50": {
		"d": "md5",
		"c": "Novell digest algorithm"
	},
	"2.16.840.1.113719.1.2.8.51": {
		"d": "ikeHmacWithSHA1-RSA",
		"c": "Novell signature algorithm"
	},
	"2.16.840.1.113719.1.2.8.52": {
		"d": "ikeHmacWithMD5-RSA",
		"c": "Novell signature algorithm"
	},
	"2.16.840.1.113719.1.2.8.69": {
		"d": "rc2CbcPad",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.82": {
		"d": "sha-1",
		"c": "Novell digest algorithm"
	},
	"2.16.840.1.113719.1.2.8.92": {
		"d": "rc2BSafe1Cbc",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.95": {
		"d": "md4",
		"c": "Novell digest algorithm"
	},
	"2.16.840.1.113719.1.2.8.130": {
		"d": "md4Packet",
		"c": "Novell keyed hash"
	},
	"2.16.840.1.113719.1.2.8.131": {
		"d": "rsaEncryptionBsafe1",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.132": {
		"d": "nwPassword",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.2.8.133": {
		"d": "novellObfuscate-1",
		"c": "Novell encryption algorithm"
	},
	"2.16.840.1.113719.1.9": {
		"d": "pki",
		"c": "Novell"
	},
	"2.16.840.1.113719.1.9.4": {
		"d": "pkiAttributeType",
		"c": "Novell PKI"
	},
	"2.16.840.1.113719.1.9.4.1": {
		"d": "securityAttributes",
		"c": "Novell PKI attribute type"
	},
	"2.16.840.1.113719.1.9.4.2": {
		"d": "relianceLimit",
		"c": "Novell PKI attribute type"
	},
	"2.16.840.1.113730.1": {
		"d": "cert-extension",
		"c": "Netscape"
	},
	"2.16.840.1.113730.1.1": {
		"d": "netscape-cert-type",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.2": {
		"d": "netscape-base-url",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.3": {
		"d": "netscape-revocation-url",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.4": {
		"d": "netscape-ca-revocation-url",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.7": {
		"d": "netscape-cert-renewal-url",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.8": {
		"d": "netscape-ca-policy-url",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.9": {
		"d": "HomePage-url",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.10": {
		"d": "EntityLogo",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.11": {
		"d": "UserPicture",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.12": {
		"d": "netscape-ssl-server-name",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.1.13": {
		"d": "netscape-comment",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.2": {
		"d": "data-type",
		"c": "Netscape"
	},
	"2.16.840.1.113730.2.1": {
		"d": "dataGIF",
		"c": "Netscape data type"
	},
	"2.16.840.1.113730.2.2": {
		"d": "dataJPEG",
		"c": "Netscape data type"
	},
	"2.16.840.1.113730.2.3": {
		"d": "dataURL",
		"c": "Netscape data type"
	},
	"2.16.840.1.113730.2.4": {
		"d": "dataHTML",
		"c": "Netscape data type"
	},
	"2.16.840.1.113730.2.5": {
		"d": "certSequence",
		"c": "Netscape data type"
	},
	"2.16.840.1.113730.2.6": {
		"d": "certURL",
		"c": "Netscape certificate extension"
	},
	"2.16.840.1.113730.3": {
		"d": "directory",
		"c": "Netscape"
	},
	"2.16.840.1.113730.3.1": {
		"d": "ldapDefinitions",
		"c": "Netscape directory"
	},
	"2.16.840.1.113730.3.1.1": {
		"d": "carLicense",
		"c": "Netscape LDAP definitions"
	},
	"2.16.840.1.113730.3.1.2": {
		"d": "departmentNumber",
		"c": "Netscape LDAP definitions"
	},
	"2.16.840.1.113730.3.1.3": {
		"d": "employeeNumber",
		"c": "Netscape LDAP definitions"
	},
	"2.16.840.1.113730.3.1.4": {
		"d": "employeeType",
		"c": "Netscape LDAP definitions"
	},
	"2.16.840.1.113730.3.1.216": {
		"d": "userPKCS12",
		"c": "Netscape LDAP definitions"
	},
	"2.16.840.1.113730.3.2.2": {
		"d": "inetOrgPerson",
		"c": "Netscape LDAP definitions"
	},
	"2.16.840.1.113730.4.1": {
		"d": "serverGatedCrypto",
		"c": "Netscape"
	},
	"2.16.840.1.113733.1.6.3": {
		"d": "verisignCZAG",
		"c": "Verisign extension"
	},
	"2.16.840.1.113733.1.6.6": {
		"d": "verisignInBox",
		"c": "Verisign extension"
	},
	"2.16.840.1.113733.1.6.11": {
		"d": "verisignOnsiteJurisdictionHash",
		"c": "Verisign extension"
	},
	"2.16.840.1.113733.1.6.13": {
		"d": "Unknown Verisign VPN extension",
		"c": "Verisign extension"
	},
	"2.16.840.1.113733.1.6.15": {
		"d": "verisignServerID",
		"c": "Verisign extension"
	},
	"2.16.840.1.113733.1.7.1.1": {
		"d": "verisignCertPolicies95Qualifier1",
		"c": "Verisign policy"
	},
	"2.16.840.1.113733.1.7.1.1.1": {
		"d": "verisignCPSv1notice",
		"c": "Verisign policy (obsolete)"
	},
	"2.16.840.1.113733.1.7.1.1.2": {
		"d": "verisignCPSv1nsi",
		"c": "Verisign policy (obsolete)"
	},
	"2.16.840.1.113733.1.8.1": {
		"d": "verisignISSStrongCrypto",
		"c": "Verisign"
	},
	"2.16.840.1.113733.1": {
		"d": "pki",
		"c": "Verisign extension"
	},
	"2.16.840.1.113733.1.9": {
		"d": "pkcs7Attribute",
		"c": "Verisign PKI extension"
	},
	"2.16.840.1.113733.1.9.2": {
		"d": "messageType",
		"c": "Verisign PKCS #7 attribute"
	},
	"2.16.840.1.113733.1.9.3": {
		"d": "pkiStatus",
		"c": "Verisign PKCS #7 attribute"
	},
	"2.16.840.1.113733.1.9.4": {
		"d": "failInfo",
		"c": "Verisign PKCS #7 attribute"
	},
	"2.16.840.1.113733.1.9.5": {
		"d": "senderNonce",
		"c": "Verisign PKCS #7 attribute"
	},
	"2.16.840.1.113733.1.9.6": {
		"d": "recipientNonce",
		"c": "Verisign PKCS #7 attribute"
	},
	"2.16.840.1.113733.1.9.7": {
		"d": "transID",
		"c": "Verisign PKCS #7 attribute"
	},
	"2.16.840.1.113733.1.9.8": {
		"d": "extensionReq",
		"c": "Verisign PKCS #7 attribute.  Use PKCS #9 extensionRequest instead",
		"w": true
	},
	"2.16.840.1.113741.2": {
		"d": "intelCDSA",
		"c": "Intel CDSA"
	},
	"2.16.840.1.114412.1": {
		"d": "digiCertNonEVCerts",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.1.1": {
		"d": "digiCertOVCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.1.2": {
		"d": "digiCertDVCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.1.11": {
		"d": "digiCertFederatedDeviceCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.1.3.0.1": {
		"d": "digiCertGlobalCAPolicy",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.1.3.0.2": {
		"d": "digiCertHighAssuranceEVCAPolicy",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.1.3.0.3": {
		"d": "digiCertGlobalRootCAPolicy",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.1.3.0.4": {
		"d": "digiCertAssuredIDRootCAPolicy",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.2": {
		"d": "digiCertEVCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.3": {
		"d": "digiCertObjectSigningCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.3.1": {
		"d": "digiCertCodeSigningCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.3.2": {
		"d": "digiCertEVCodeSigningCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.3.11": {
		"d": "digiCertKernelCodeSigningCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.3.21": {
		"d": "digiCertDocumentSigningCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4": {
		"d": "digiCertClientCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.1.1": {
		"d": "digiCertLevel1PersonalClientCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.1.2": {
		"d": "digiCertLevel1EnterpriseClientCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.2": {
		"d": "digiCertLevel2ClientCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.3.1": {
		"d": "digiCertLevel3USClientCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.3.2": {
		"d": "digiCertLevel3CBPClientCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.4.1": {
		"d": "digiCertLevel4USClientCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.4.2": {
		"d": "digiCertLevel4CBPClientCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.5.1": {
		"d": "digiCertPIVHardwareCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.5.2": {
		"d": "digiCertPIVCardAuthCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.2.4.5.3": {
		"d": "digiCertPIVContentSigningCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.4.31": {
		"d": "digiCertGridClassicCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.4.31.5": {
		"d": "digiCertGridIntegratedCert",
		"c": "Digicert CA policy"
	},
	"2.16.840.1.114412.31.4.31.1": {
		"d": "digiCertGridHostCert",
		"c": "Digicert CA policy"
	},
	"2.23.42.0": {
		"d": "contentType",
		"c": "SET"
	},
	"2.23.42.0.0": {
		"d": "panData",
		"c": "SET contentType"
	},
	"2.23.42.0.1": {
		"d": "panToken",
		"c": "SET contentType"
	},
	"2.23.42.0.2": {
		"d": "panOnly",
		"c": "SET contentType"
	},
	"2.23.42.1": {
		"d": "msgExt",
		"c": "SET"
	},
	"2.23.42.2": {
		"d": "field",
		"c": "SET"
	},
	"2.23.42.2.0": {
		"d": "fullName",
		"c": "SET field"
	},
	"2.23.42.2.1": {
		"d": "givenName",
		"c": "SET field"
	},
	"2.23.42.2.2": {
		"d": "familyName",
		"c": "SET field"
	},
	"2.23.42.2.3": {
		"d": "birthFamilyName",
		"c": "SET field"
	},
	"2.23.42.2.4": {
		"d": "placeName",
		"c": "SET field"
	},
	"2.23.42.2.5": {
		"d": "identificationNumber",
		"c": "SET field"
	},
	"2.23.42.2.6": {
		"d": "month",
		"c": "SET field"
	},
	"2.23.42.2.7": {
		"d": "date",
		"c": "SET field"
	},
	"2.23.42.2.8": {
		"d": "address",
		"c": "SET field"
	},
	"2.23.42.2.9": {
		"d": "telephone",
		"c": "SET field"
	},
	"2.23.42.2.10": {
		"d": "amount",
		"c": "SET field"
	},
	"2.23.42.2.11": {
		"d": "accountNumber",
		"c": "SET field"
	},
	"2.23.42.2.12": {
		"d": "passPhrase",
		"c": "SET field"
	},
	"2.23.42.3": {
		"d": "attribute",
		"c": "SET"
	},
	"2.23.42.3.0": {
		"d": "cert",
		"c": "SET attribute"
	},
	"2.23.42.3.0.0": {
		"d": "rootKeyThumb",
		"c": "SET cert attribute"
	},
	"2.23.42.3.0.1": {
		"d": "additionalPolicy",
		"c": "SET cert attribute"
	},
	"2.23.42.4": {
		"d": "algorithm",
		"c": "SET"
	},
	"2.23.42.5": {
		"d": "policy",
		"c": "SET"
	},
	"2.23.42.5.0": {
		"d": "root",
		"c": "SET policy"
	},
	"2.23.42.6": {
		"d": "module",
		"c": "SET"
	},
	"2.23.42.7": {
		"d": "certExt",
		"c": "SET"
	},
	"2.23.42.7.0": {
		"d": "hashedRootKey",
		"c": "SET cert extension"
	},
	"2.23.42.7.1": {
		"d": "certificateType",
		"c": "SET cert extension"
	},
	"2.23.42.7.2": {
		"d": "merchantData",
		"c": "SET cert extension"
	},
	"2.23.42.7.3": {
		"d": "cardCertRequired",
		"c": "SET cert extension"
	},
	"2.23.42.7.4": {
		"d": "tunneling",
		"c": "SET cert extension"
	},
	"2.23.42.7.5": {
		"d": "setExtensions",
		"c": "SET cert extension"
	},
	"2.23.42.7.6": {
		"d": "setQualifier",
		"c": "SET cert extension"
	},
	"2.23.42.8": {
		"d": "brand",
		"c": "SET"
	},
	"2.23.42.8.1": {
		"d": "IATA-ATA",
		"c": "SET brand"
	},
	"2.23.42.8.4": {
		"d": "VISA",
		"c": "SET brand"
	},
	"2.23.42.8.5": {
		"d": "MasterCard",
		"c": "SET brand"
	},
	"2.23.42.8.30": {
		"d": "Diners",
		"c": "SET brand"
	},
	"2.23.42.8.34": {
		"d": "AmericanExpress",
		"c": "SET brand"
	},
	"2.23.42.8.6011": {
		"d": "Novus",
		"c": "SET brand"
	},
	"2.23.42.9": {
		"d": "vendor",
		"c": "SET"
	},
	"2.23.42.9.0": {
		"d": "GlobeSet",
		"c": "SET vendor"
	},
	"2.23.42.9.1": {
		"d": "IBM",
		"c": "SET vendor"
	},
	"2.23.42.9.2": {
		"d": "CyberCash",
		"c": "SET vendor"
	},
	"2.23.42.9.3": {
		"d": "Terisa",
		"c": "SET vendor"
	},
	"2.23.42.9.4": {
		"d": "RSADSI",
		"c": "SET vendor"
	},
	"2.23.42.9.5": {
		"d": "VeriFone",
		"c": "SET vendor"
	},
	"2.23.42.9.6": {
		"d": "TrinTech",
		"c": "SET vendor"
	},
	"2.23.42.9.7": {
		"d": "BankGate",
		"c": "SET vendor"
	},
	"2.23.42.9.8": {
		"d": "GTE",
		"c": "SET vendor"
	},
	"2.23.42.9.9": {
		"d": "CompuSource",
		"c": "SET vendor"
	},
	"2.23.42.9.10": {
		"d": "Griffin",
		"c": "SET vendor"
	},
	"2.23.42.9.11": {
		"d": "Certicom",
		"c": "SET vendor"
	},
	"2.23.42.9.12": {
		"d": "OSS",
		"c": "SET vendor"
	},
	"2.23.42.9.13": {
		"d": "TenthMountain",
		"c": "SET vendor"
	},
	"2.23.42.9.14": {
		"d": "Antares",
		"c": "SET vendor"
	},
	"2.23.42.9.15": {
		"d": "ECC",
		"c": "SET vendor"
	},
	"2.23.42.9.16": {
		"d": "Maithean",
		"c": "SET vendor"
	},
	"2.23.42.9.17": {
		"d": "Netscape",
		"c": "SET vendor"
	},
	"2.23.42.9.18": {
		"d": "Verisign",
		"c": "SET vendor"
	},
	"2.23.42.9.19": {
		"d": "BlueMoney",
		"c": "SET vendor"
	},
	"2.23.42.9.20": {
		"d": "Lacerte",
		"c": "SET vendor"
	},
	"2.23.42.9.21": {
		"d": "Fujitsu",
		"c": "SET vendor"
	},
	"2.23.42.9.22": {
		"d": "eLab",
		"c": "SET vendor"
	},
	"2.23.42.9.23": {
		"d": "Entrust",
		"c": "SET vendor"
	},
	"2.23.42.9.24": {
		"d": "VIAnet",
		"c": "SET vendor"
	},
	"2.23.42.9.25": {
		"d": "III",
		"c": "SET vendor"
	},
	"2.23.42.9.26": {
		"d": "OpenMarket",
		"c": "SET vendor"
	},
	"2.23.42.9.27": {
		"d": "Lexem",
		"c": "SET vendor"
	},
	"2.23.42.9.28": {
		"d": "Intertrader",
		"c": "SET vendor"
	},
	"2.23.42.9.29": {
		"d": "Persimmon",
		"c": "SET vendor"
	},
	"2.23.42.9.30": {
		"d": "NABLE",
		"c": "SET vendor"
	},
	"2.23.42.9.31": {
		"d": "espace-net",
		"c": "SET vendor"
	},
	"2.23.42.9.32": {
		"d": "Hitachi",
		"c": "SET vendor"
	},
	"2.23.42.9.33": {
		"d": "Microsoft",
		"c": "SET vendor"
	},
	"2.23.42.9.34": {
		"d": "NEC",
		"c": "SET vendor"
	},
	"2.23.42.9.35": {
		"d": "Mitsubishi",
		"c": "SET vendor"
	},
	"2.23.42.9.36": {
		"d": "NCR",
		"c": "SET vendor"
	},
	"2.23.42.9.37": {
		"d": "e-COMM",
		"c": "SET vendor"
	},
	"2.23.42.9.38": {
		"d": "Gemplus",
		"c": "SET vendor"
	},
	"2.23.42.10": {
		"d": "national",
		"c": "SET"
	},
	"2.23.42.10.392": {
		"d": "Japan",
		"c": "SET national"
	},
	"2.23.43.1.4": {
		"d": "wTLS-ECC",
		"c": "WAP WTLS"
	},
	"2.23.43.1.4.1": {
		"d": "wTLS-ECC-curve1",
		"c": "WAP WTLS"
	},
	"2.23.43.1.4.6": {
		"d": "wTLS-ECC-curve6",
		"c": "WAP WTLS"
	},
	"2.23.43.1.4.8": {
		"d": "wTLS-ECC-curve8",
		"c": "WAP WTLS"
	},
	"2.23.43.1.4.9": {
		"d": "wTLS-ECC-curve9",
		"c": "WAP WTLS"
	},
	"2.23.133": {
		"d": "tCPA",
		"c": "TCPA"
	},
	"2.23.133.1": {
		"d": "tcpaSpecVersion",
		"c": "TCPA"
	},
	"2.23.133.2": {
		"d": "tcpaAttribute",
		"c": "TCPA"
	},
	"2.23.133.2.1": {
		"d": "tcpaTpmManufacturer",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.2": {
		"d": "tcpaTpmModel",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.3": {
		"d": "tcpaTpmVersion",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.4": {
		"d": "tcpaPlatformManufacturer",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.5": {
		"d": "tcpaPlatformModel",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.6": {
		"d": "tcpaPlatformVersion",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.7": {
		"d": "tcpaComponentManufacturer",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.8": {
		"d": "tcpaComponentModel",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.9": {
		"d": "tcpaComponentVersion",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.10": {
		"d": "tcpaSecurityQualities",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.11": {
		"d": "tcpaTpmProtectionProfile",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.12": {
		"d": "tcpaTpmSecurityTarget",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.13": {
		"d": "tcpaFoundationProtectionProfile",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.14": {
		"d": "tcpaFoundationSecurityTarget",
		"c": "TCPA Attribute"
	},
	"2.23.133.2.15": {
		"d": "tcpaTpmIdLabel",
		"c": "TCPA Attribute"
	},
	"2.23.133.3": {
		"d": "tcpaProtocol",
		"c": "TCPA"
	},
	"2.23.133.3.1": {
		"d": "tcpaPrttTpmIdProtocol",
		"c": "TCPA Protocol"
	},
	"2.23.134.1.4.2.1": {
		"d": "postSignumRootQCA",
		"c": "PostSignum CA"
	},
	"2.23.134.1.2.2.3": {
		"d": "postSignumPublicCA",
		"c": "PostSignum CA"
	},
	"2.23.134.1.2.1.8.210": {
		"d": "postSignumCommercialServerPolicy",
		"c": "PostSignum CA"
	},
	"2.23.136.1.1.1": {
		"d": "mRTDSignatureData",
		"c": "ICAO MRTD"
	},
	"2.54.1775.2": {
		"d": "hashedRootKey",
		"c": "SET.  Deprecated, use (2 23 42 7 0) instead",
		"w": true
	},
	"2.54.1775.3": {
		"d": "certificateType",
		"c": "SET.  Deprecated, use (2 23 42 7 0) instead",
		"w": true
	},
	"2.54.1775.4": {
		"d": "merchantData",
		"c": "SET.  Deprecated, use (2 23 42 7 0) instead",
		"w": true
	},
	"2.54.1775.5": {
		"d": "cardCertRequired",
		"c": "SET.  Deprecated, use (2 23 42 7 0) instead",
		"w": true
	},
	"2.54.1775.6": {
		"d": "tunneling",
		"c": "SET.  Deprecated, use (2 23 42 7 0) instead",
		"w": true
	},
	"2.54.1775.7": {
		"d": "setQualifier",
		"c": "SET.  Deprecated, use (2 23 42 7 0) instead",
		"w": true
	},
	"2.54.1775.99": {
		"d": "setData",
		"c": "SET.  Deprecated, use (2 23 42 7 0) instead",
		"w": true
	},
	"1.2.40.0.17.1.22": {
		"d": "A-Trust EV policy",
		"c": "A-Trust CA Root"
	},
	"1.3.6.1.4.1.34697.2.1": {
		"d": "AffirmTrust EV policy",
		"c": "AffirmTrust Commercial"
	},
	"1.3.6.1.4.1.34697.2.2": {
		"d": "AffirmTrust EV policy",
		"c": "AffirmTrust Networking"
	},
	"1.3.6.1.4.1.34697.2.3": {
		"d": "AffirmTrust EV policy",
		"c": "AffirmTrust Premium"
	},
	"1.3.6.1.4.1.34697.2.4": {
		"d": "AffirmTrust EV policy",
		"c": "AffirmTrust Premium ECC"
	},
	"2.16.578.1.26.1.3.3": {
		"d": "BuyPass EV policy",
		"c": "BuyPass Class 3 EV"
	},
	"1.3.6.1.4.1.17326.10.14.2.1.2": {
		"d": "Camerfirma EV policy",
		"c": "Camerfirma CA Root"
	},
	"1.3.6.1.4.1.17326.10.8.12.1.2": {
		"d": "Camerfirma EV policy",
		"c": "Camerfirma CA Root"
	},
	"1.3.6.1.4.1.22234.2.5.2.3.1": {
		"d": "CertPlus EV policy",
		"c": "CertPlus Class 2 Primary CA (formerly Keynectis)"
	},
	"1.3.6.1.4.1.6449.1.2.1.5.1": {
		"d": "Comodo EV policy",
		"c": "COMODO Certification Authority"
	},
	"1.3.6.1.4.1.6334.1.100.1": {
		"d": "Cybertrust EV policy",
		"c": "Cybertrust Global Root (now Verizon Business)"
	},
	"1.3.6.1.4.1.4788.2.202.1": {
		"d": "D-TRUST EV policy",
		"c": "D-TRUST Root Class 3 CA 2 EV 2009"
	},
	"2.16.840.1.114412.2.1": {
		"d": "DigiCert EV policy",
		"c": "DigiCert High Assurance EV Root CA"
	},
	"2.16.528.1.1001.1.1.1.12.6.1.1.1": {
		"d": "DigiNotar EV policy",
		"c": "DigiNotar Root CA"
	},
	"2.16.840.1.114028.10.1.2": {
		"d": "Entrust EV policy",
		"c": "Entrust Root Certification Authority"
	},
	"1.3.6.1.4.1.14370.1.6": {
		"d": "GeoTrust EV policy",
		"c": "GeoTrust Primary Certification Authority (formerly Equifax)"
	},
	"1.3.6.1.4.1.4146.1.1": {
		"d": "GlobalSign EV policy",
		"c": "GlobalSign"
	},
	"2.16.840.1.114413.1.7.23.3": {
		"d": "GoDaddy EV policy",
		"c": "GoDaddy Class 2 Certification Authority (formerly ValiCert)"
	},
	"1.3.6.1.4.1.14777.6.1.1": {
		"d": "Izenpe EV policy",
		"c": "Certificado de Servidor Seguro SSL EV"
	},
	"1.3.6.1.4.1.14777.6.1.2": {
		"d": "Izenpe EV policy",
		"c": "Certificado de Sede Electronica EV"
	},
	"1.3.6.1.4.1.782.1.2.1.8.1": {
		"d": "Network Solutions EV policy",
		"c": "Network Solutions Certificate Authority"
	},
	"1.3.6.1.4.1.8024.0.2.100.1.2": {
		"d": "QuoVadis EV policy",
		"c": "QuoVadis Root CA 2"
	},
	"1.2.392.200091.100.721.1": {
		"d": "Security Communication (SECOM) EV policy",
		"c": "Security Communication RootCA1"
	},
	"2.16.840.1.114414.1.7.23.3": {
		"d": "Starfield EV policy",
		"c": "Starfield Class 2 Certification Authority"
	},
	"1.3.6.1.4.1.23223.1.1.1": {
		"d": "StartCom EV policy",
		"c": "StartCom Certification Authority"
	},
	"2.16.756.1.89.1.2.1.1": {
		"d": "SwissSign EV policy",
		"c": "SwissSign Gold CA - G2"
	},
	"1.3.6.1.4.1.7879.13.24.1": {
		"d": "T-TeleSec EV policy",
		"c": "T-TeleSec GlobalRoot Class 3"
	},
	"2.16.840.1.113733.1.7.48.1": {
		"d": "Thawte EV policy",
		"c": "Thawte Premium Server CA"
	},
	"2.16.840.1.114404.1.1.2.4.1": {
		"d": "TrustWave EV policy",
		"c": "TrustWave CA, formerly SecureTrust, before that XRamp"
	},
	"1.3.6.1.4.1.40869.1.1.22.3": {
		"d": "TWCA EV policy",
		"c": "TWCA Root Certification Authority"
	},
	"2.16.840.1.113733.1.7.23.6": {
		"d": "VeriSign EV policy",
		"c": "VeriSign Class 3 Public Primary Certification Authority"
	},
	"2.16.840.1.114171.500.9": {
		"d": "Wells Fargo EV policy",
		"c": "Wells Fargo WellsSecure Public Root Certificate Authority"
	},
	"END": ""
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/lapo-asn1js/asn1.js
var ellipsis = "…";
var reTimeS = /^(\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
var reTimeL = /^(\d\d\d\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])(?:([0-5]\d)(?:([0-5]\d)(?:[.,](\d{1,3}))?)?)?(Z|[-+](?:[0]\d|1[0-2])([0-5]\d)?)?$/;
function stringCut(str, len) {
	if (str.length > len) str = str.substring(0, len) + ellipsis;
	return str;
}
function Stream(enc, pos) {
	if (enc instanceof Stream) {
		this.enc = enc.enc;
		this.pos = enc.pos;
	} else {
		this.enc = enc;
		this.pos = pos;
	}
}
Stream.prototype.get = function(pos) {
	if (pos === void 0) pos = this.pos++;
	if (pos >= this.enc.length) throw "Requesting byte offset " + pos + " on a stream of length " + this.enc.length;
	return typeof this.enc == "string" ? this.enc.charCodeAt(pos) : this.enc[pos];
};
Stream.prototype.hexDigits = "0123456789ABCDEF";
Stream.prototype.hexByte = function(b) {
	return this.hexDigits.charAt(b >> 4 & 15) + this.hexDigits.charAt(b & 15);
};
Stream.prototype.hexDump = function(start, end, raw) {
	var s = "";
	for (var i = start; i < end; ++i) {
		s += this.hexByte(this.get(i));
		if (raw !== true) switch (i & 15) {
			case 7:
				s += "  ";
				break;
			case 15:
				s += "\n";
				break;
			default: s += " ";
		}
	}
	return s;
};
var b64Safe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
Stream.prototype.b64Dump = function(start, end) {
	var extra = (end - start) % 3, s = "", i, c;
	for (i = start; i + 2 < end; i += 3) {
		c = this.get(i) << 16 | this.get(i + 1) << 8 | this.get(i + 2);
		s += b64Safe.charAt(c >> 18 & 63);
		s += b64Safe.charAt(c >> 12 & 63);
		s += b64Safe.charAt(c >> 6 & 63);
		s += b64Safe.charAt(c & 63);
	}
	if (extra > 0) {
		c = this.get(i) << 16;
		if (extra > 1) c |= this.get(i + 1) << 8;
		s += b64Safe.charAt(c >> 18 & 63);
		s += b64Safe.charAt(c >> 12 & 63);
		if (extra == 2) s += b64Safe.charAt(c >> 6 & 63);
	}
	return s;
};
Stream.prototype.isASCII = function(start, end) {
	for (var i = start; i < end; ++i) {
		var c = this.get(i);
		if (c < 32 || c > 176) return false;
	}
	return true;
};
Stream.prototype.parseStringISO = function(start, end) {
	var s = "";
	for (var i = start; i < end; ++i) s += String.fromCharCode(this.get(i));
	return s;
};
Stream.prototype.parseStringUTF = function(start, end) {
	function ex(c) {
		if (c < 128 || c >= 192) throw new Error("Invalid UTF-8 continuation byte: " + c);
		return c & 63;
	}
	function surrogate(cp) {
		if (cp < 65536) throw new Error("UTF-8 overlong encoding, codepoint encoded in 4 bytes: " + cp);
		cp -= 65536;
		return String.fromCharCode((cp >> 10) + 55296, (cp & 1023) + 56320);
	}
	var s = "";
	for (var i = start; i < end;) {
		var c = this.get(i++);
		if (c < 128) s += String.fromCharCode(c);
		else if (c < 192) throw new Error("Invalid UTF-8 starting byte: " + c);
		else if (c < 224) s += String.fromCharCode((c & 31) << 6 | ex(this.get(i++)));
		else if (c < 240) s += String.fromCharCode((c & 15) << 12 | ex(this.get(i++)) << 6 | ex(this.get(i++)));
		else if (c < 248) s += surrogate((c & 7) << 18 | ex(this.get(i++)) << 12 | ex(this.get(i++)) << 6 | ex(this.get(i++)));
		else throw new Error("Invalid UTF-8 starting byte (since 2003 it is restricted to 4 bytes): " + c);
	}
	return s;
};
Stream.prototype.parseStringBMP = function(start, end) {
	var str = "", hi, lo;
	for (var i = start; i < end;) {
		hi = this.get(i++);
		lo = this.get(i++);
		str += String.fromCharCode(hi << 8 | lo);
	}
	return str;
};
Stream.prototype.parseTime = function(start, end, shortYear) {
	var s = this.parseStringISO(start, end), m = (shortYear ? reTimeS : reTimeL).exec(s);
	if (!m) return "Unrecognized time: " + s;
	if (shortYear) {
		m[1] = +m[1];
		m[1] += m[1] < 70 ? 2e3 : 1900;
	}
	s = m[1] + "-" + m[2] + "-" + m[3] + " " + m[4];
	if (m[5]) {
		s += ":" + m[5];
		if (m[6]) {
			s += ":" + m[6];
			if (m[7]) s += "." + m[7];
		}
	}
	if (m[8]) {
		s += " UTC";
		if (m[8] != "Z") {
			s += m[8];
			if (m[9]) s += ":" + m[9];
		}
	}
	return s;
};
Stream.prototype.parseInteger = function(start, end) {
	var v = this.get(start), neg = v > 127, pad = neg ? 255 : 0, len, s = "";
	while (v == pad && ++start < end) v = this.get(start);
	len = end - start;
	if (len === 0) return neg ? "-1" : "0";
	if (len > 4) {
		s = v;
		len <<= 3;
		while (((s ^ pad) & 128) == 0) {
			s <<= 1;
			--len;
		}
		s = "(" + len + " bit)\n";
	}
	if (neg) v = v - 256;
	var n = new Int10(v);
	for (var i = start + 1; i < end; ++i) n.mulAdd(256, this.get(i));
	return s + n.toString();
};
Stream.prototype.parseBitString = function(start, end, maxLength) {
	var unusedBits = this.get(start);
	if (unusedBits > 7) throw "Invalid BitString with unusedBits=" + unusedBits;
	var lenBit = (end - start - 1 << 3) - unusedBits, s = "";
	for (var i = start + 1; i < end; ++i) {
		var b = this.get(i), skip = i == end - 1 ? unusedBits : 0;
		for (var j = 7; j >= skip; --j) s += b >> j & 1 ? "1" : "0";
		if (s.length > maxLength) s = stringCut(s, maxLength);
	}
	return {
		size: lenBit,
		str: s
	};
};
Stream.prototype.parseOctetString = function(start, end, maxLength) {
	var len = end - start, s;
	try {
		s = this.parseStringUTF(start, end);
		var v;
		for (i = 0; i < s.length; ++i) {
			v = s.charCodeAt(i);
			if (v < 32 && v != 9 && v != 10 && v != 13) throw new Error("Unprintable character at index " + i + " (code " + s.charCodeAt(i) + ")");
		}
		return {
			size: len,
			str: s
		};
	} catch (e) {}
	maxLength /= 2;
	if (len > maxLength) end = start + maxLength;
	s = "";
	for (var i = start; i < end; ++i) s += this.hexByte(this.get(i));
	if (len > maxLength) s += ellipsis;
	return {
		size: len,
		str: s
	};
};
Stream.prototype.parseOID = function(start, end, maxLength) {
	var s = "", n = new Int10(), bits = 0;
	for (var i = start; i < end; ++i) {
		var v = this.get(i);
		n.mulAdd(128, v & 127);
		bits += 7;
		if (!(v & 128)) {
			if (s === "") {
				n = n.simplify();
				if (n instanceof Int10) {
					n.sub(80);
					s = "2." + n.toString();
				} else {
					var m = n < 80 ? n < 40 ? 0 : 1 : 2;
					s = m + "." + (n - m * 40);
				}
			} else s += "." + n.toString();
			if (s.length > maxLength) return stringCut(s, maxLength);
			n = new Int10();
			bits = 0;
		}
	}
	if (bits > 0) s += ".incomplete";
	if (typeof oids === "object") {
		var oid = oids[s];
		if (oid) {
			if (oid.d) s += "\n" + oid.d;
			if (oid.c) s += "\n" + oid.c;
			if (oid.w) s += "\n(warning!)";
		}
	}
	return s;
};
function ASN1(stream, header, length, tag, tagLen, sub) {
	if (!(tag instanceof ASN1Tag)) throw "Invalid tag value.";
	this.stream = stream;
	this.header = header;
	this.length = length;
	this.tag = tag;
	this.tagLen = tagLen;
	this.sub = sub;
}
ASN1.prototype.typeName = function() {
	switch (this.tag.tagClass) {
		case 0:
			switch (this.tag.tagNumber) {
				case 0: return "EOC";
				case 1: return "BOOLEAN";
				case 2: return "INTEGER";
				case 3: return "BIT_STRING";
				case 4: return "OCTET_STRING";
				case 5: return "NULL";
				case 6: return "OBJECT_IDENTIFIER";
				case 7: return "ObjectDescriptor";
				case 8: return "EXTERNAL";
				case 9: return "REAL";
				case 10: return "ENUMERATED";
				case 11: return "EMBEDDED_PDV";
				case 12: return "UTF8String";
				case 16: return "SEQUENCE";
				case 17: return "SET";
				case 18: return "NumericString";
				case 19: return "PrintableString";
				case 20: return "TeletexString";
				case 21: return "VideotexString";
				case 22: return "IA5String";
				case 23: return "UTCTime";
				case 24: return "GeneralizedTime";
				case 25: return "GraphicString";
				case 26: return "VisibleString";
				case 27: return "GeneralString";
				case 28: return "UniversalString";
				case 30: return "BMPString";
			}
			return "Universal_" + this.tag.tagNumber.toString();
		case 1: return "Application_" + this.tag.tagNumber.toString();
		case 2: return "[" + this.tag.tagNumber.toString() + "]";
		case 3: return "Private_" + this.tag.tagNumber.toString();
	}
};
function recurse(el, parser, maxLength) {
	var differentTags = false;
	if (el.sub) el.sub.forEach(function(e1) {
		if (e1.tag.tagClass != el.tag.tagClass || e1.tag.tagNumber != el.tag.tagNumber) differentTags = true;
	});
	if (!el.sub || differentTags) return el.stream[parser](el.posContent(), el.posContent() + Math.abs(el.length), maxLength);
	var d = {
		size: 0,
		str: ""
	};
	el.sub.forEach(function(el) {
		var d1 = recurse(el, parser, maxLength - d.str.length);
		d.size += d1.size;
		d.str += d1.str;
	});
	return d;
}
/** A string preview of the content (intended for humans). */
ASN1.prototype.content = function(maxLength) {
	if (this.tag === void 0) return null;
	if (maxLength === void 0) maxLength = Infinity;
	var content = this.posContent(), len = Math.abs(this.length);
	if (!this.tag.isUniversal()) {
		if (this.sub !== null) return "(" + this.sub.length + " elem)";
		var d1 = this.stream.parseOctetString(content, content + len, maxLength);
		return "(" + d1.size + " byte)\n" + d1.str;
	}
	switch (this.tag.tagNumber) {
		case 1: return this.stream.get(content) === 0 ? "false" : "true";
		case 2: return this.stream.parseInteger(content, content + len);
		case 3:
			var d = recurse(this, "parseBitString", maxLength);
			return "(" + d.size + " bit)\n" + d.str;
		case 4:
			d = recurse(this, "parseOctetString", maxLength);
			return "(" + d.size + " byte)\n" + d.str;
		case 6: return this.stream.parseOID(content, content + len, maxLength);
		case 10: return this.stream.parseInteger(content, content + len);
		case 16:
		case 17: if (this.sub !== null) return "(" + this.sub.length + " elem)";
		else return "(no elem)";
		case 12: return stringCut(this.stream.parseStringUTF(content, content + len), maxLength);
		case 18:
		case 19:
		case 20:
		case 21:
		case 22:
		case 26:
		case 27: return stringCut(this.stream.parseStringISO(content, content + len), maxLength);
		case 30: return stringCut(this.stream.parseStringBMP(content, content + len), maxLength);
		case 23:
		case 24: return this.stream.parseTime(content, content + len, this.tag.tagNumber == 23);
	}
	return null;
};
ASN1.prototype.toString = function() {
	return this.typeName() + "@" + this.stream.pos + "[header:" + this.header + ",length:" + this.length + ",sub:" + (this.sub === null ? "null" : this.sub.length) + "]";
};
ASN1.prototype.toPrettyString = function(indent) {
	if (indent === void 0) indent = "";
	var s = indent + this.typeName() + " @" + this.stream.pos;
	if (this.length >= 0) s += "+";
	s += this.length;
	if (this.tag.tagConstructed) s += " (constructed)";
	else if (this.tag.isUniversal() && (this.tag.tagNumber == 3 || this.tag.tagNumber == 4) && this.sub !== null) s += " (encapsulates)";
	var content = this.content();
	if (content) s += ": " + content.replace(/\n/g, "|");
	s += "\n";
	if (this.sub !== null) {
		indent += "  ";
		for (var i = 0, max = this.sub.length; i < max; ++i) s += this.sub[i].toPrettyString(indent);
	}
	return s;
};
ASN1.prototype.posStart = function() {
	return this.stream.pos;
};
ASN1.prototype.posContent = function() {
	return this.stream.pos + this.header;
};
ASN1.prototype.posEnd = function() {
	return this.stream.pos + this.header + Math.abs(this.length);
};
/** Position of the length. */
ASN1.prototype.posLen = function() {
	return this.stream.pos + this.tagLen;
};
ASN1.prototype.toHexString = function() {
	return this.stream.hexDump(this.posStart(), this.posEnd(), true);
};
ASN1.prototype.toB64String = function() {
	return this.stream.b64Dump(this.posStart(), this.posEnd());
};
ASN1.decodeLength = function(stream) {
	var buf = stream.get(), len = buf & 127;
	if (len == buf) return len;
	if (len === 0) return null;
	if (len > 6) throw "Length over 48 bits not supported at position " + (stream.pos - 1);
	buf = 0;
	for (var i = 0; i < len; ++i) buf = buf * 256 + stream.get();
	return buf;
};
function ASN1Tag(stream) {
	var buf = stream.get();
	this.tagClass = buf >> 6;
	this.tagConstructed = (buf & 32) !== 0;
	this.tagNumber = buf & 31;
	if (this.tagNumber == 31) {
		var n = new Int10();
		do {
			buf = stream.get();
			n.mulAdd(128, buf & 127);
		} while (buf & 128);
		this.tagNumber = n.simplify();
	}
}
ASN1Tag.prototype.isUniversal = function() {
	return this.tagClass === 0;
};
ASN1Tag.prototype.isEOC = function() {
	return this.tagClass === 0 && this.tagNumber === 0;
};
ASN1.decode = function(stream, offset) {
	if (!(stream instanceof Stream)) stream = new Stream(stream, offset || 0);
	var streamStart = new Stream(stream), tag = new ASN1Tag(stream), tagLen = stream.pos - streamStart.pos, len = ASN1.decodeLength(stream), start = stream.pos, header = start - streamStart.pos, sub = null, getSub = function() {
		sub = [];
		if (len !== null) {
			var end = start + len;
			if (end > stream.enc.length) throw "Container at offset " + start + " has a length of " + len + ", which is past the end of the stream";
			while (stream.pos < end) sub[sub.length] = ASN1.decode(stream);
			if (stream.pos != end) throw "Content size is not correct for container at offset " + start;
		} else try {
			for (;;) {
				var s = ASN1.decode(stream);
				if (s.tag.isEOC()) break;
				sub[sub.length] = s;
			}
			len = start - stream.pos;
		} catch (e) {
			throw "Exception while decoding undefined length content at offset " + start + ": " + e;
		}
	};
	if (tag.tagConstructed) getSub();
	else if (tag.isUniversal() && (tag.tagNumber == 3 || tag.tagNumber == 4)) try {
		if (tag.tagNumber == 3) {
			if (stream.get() != 0) throw "BIT STRINGs with unused bits cannot encapsulate.";
		}
		getSub();
		for (var i = 0; i < sub.length; ++i) if (sub[i].tag.isEOC()) throw "EOC is not supposed to be actual content.";
	} catch (e) {
		sub = null;
	}
	if (sub === null) {
		if (len === null) throw "We can't skip over an invalid tag with undefined length at offset " + start;
		stream.pos = start + Math.abs(len);
	}
	return new ASN1(streamStart, header, len, tag, tagLen, sub);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/ofd/ses_signature_parser.js
var reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;
var unwrapDefault = (mod) => mod && typeof mod === "object" && "default" in mod ? mod.default : mod;
var HexApi = unwrapDefault(Hex);
var Base64Api = unwrapDefault(Base64);
var ASN1Api = unwrapDefault(ASN1);
var signedDataOids = /* @__PURE__ */ new Set(["1.2.840.113549.1.7.2", "1.2.156.10197.6.1.4.2.2"]);
var universal = (node, number) => node?.tag?.tagClass === 0 && node.tag.tagNumber === number;
var parseSignedData = function(node) {
	if (!universal(node?.sub?.[0], 6)) return null;
	const oidNode = node.sub[0];
	const start = oidNode.stream.pos + oidNode.header;
	const oid = oidNode.stream.parseOID(start, start + oidNode.length).split("\n", 1)[0];
	if (!signedDataOids.has(oid)) throw new Error("Unsupported signature ContentInfo type");
	const wrapper = node.sub[1];
	const signed = wrapper?.sub?.[0];
	if (!universal(node, 16) || node.sub.length !== 2 || wrapper?.tag?.tagClass !== 2 || wrapper.tag.tagNumber !== 0 || !wrapper.tag.tagConstructed || wrapper.sub.length !== 1 || !universal(signed, 16) || signed.sub.length < 4 || !universal(signed.sub[0], 2) || !universal(signed.sub[1], 17) || !universal(signed.sub[2], 16) || !universal(signed.sub[2]?.sub?.[0], 6) || !universal(signed.sub.at(-1), 17)) throw new Error("Malformed SignedData structure");
	return {
		type: "signed-data",
		verificationStatus: "not-verified",
		verifyRet: null,
		SES_Signature: {
			format: "signed-data",
			contentType: oid,
			displayOnly: true,
			verificationStatus: "not-verified"
		}
	};
};
var parseSesSignature = async function(zip, name, getEntry) {
	const entry = typeof getEntry === "function" ? getEntry(zip, name) : zip.files[name];
	if (!entry) return {};
	try {
		return decodeText(await entry.async("base64"));
	} catch (e) {
		console.warn("[ofd] parseSesSignature failed", name, e);
		return {};
	}
};
var decodeText = function(val) {
	try {
		return decode(reHex.test(val) ? HexApi.decode(val) : Base64Api.unarmor(val));
	} catch (e) {
		console.warn("[ofd] decode SES signature text failed", e);
		return {};
	}
};
var decode = function(der, offset) {
	offset = offset || 0;
	try {
		const root = ASN1Api.decode(der, offset);
		const signedData = parseSignedData(root);
		if (signedData) return signedData;
		const SES_Signature = decodeSES_Signature(root);
		const picture = SES_Signature?.toSign?.eseal?.esealInfo?.picture;
		if (!picture?.data?.byte?.length) return {};
		const type = (picture.type?.str || picture.type || "").toString().toLowerCase();
		return {
			ofdArray: picture.data.byte,
			type,
			SES_Signature: {
				realVersion: SES_Signature.realVersion,
				displayOnly: true,
				verificationStatus: "not-verified",
				pictureType: type,
				pictureWidth: picture.width,
				pictureHeight: picture.height,
				sealName: SES_Signature.toSign?.eseal?.esealInfo?.property?.name
			},
			verifyRet: null,
			verificationStatus: "not-verified"
		};
	} catch (e) {
		console.warn("[ofd] decode SES signature failed", e);
		return {};
	}
};
var decodeUTCTime = function(str) {
	str = String(str || "").replace("Unrecognized time: ", "");
	str = str.replace("Z", "");
	str = str.substr(0, 1) < "5" ? "20" + str : "19" + str;
	return str;
};
var parseStringUTF = function(node) {
	if (!node) return "";
	return node.stream.parseStringUTF(node.stream.pos + node.header, node.stream.pos + node.header + node.length);
};
var parseInteger = function(node) {
	if (!node) return;
	return node.stream.parseInteger(node.stream.pos + node.header, node.stream.pos + node.header + node.length);
};
var parseOctetBytes = function(node) {
	if (!node) return /* @__PURE__ */ new Uint8Array(0);
	return node.stream.enc.subarray(node.stream.pos + node.header, node.stream.pos + node.header + node.length);
};
var parseTimeNode = function(node, utc) {
	if (!node) return "";
	return decodeUTCTime(node.stream.parseTime(node.stream.pos + node.header, node.stream.pos + node.header + node.length, utc));
};
var decodeSES_Signature = function(asn1) {
	let SES_Signature;
	try {
		const createDate = parseTimeNode(asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[3]);
		const validStart = parseTimeNode(asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[4]);
		const validEnd = parseTimeNode(asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[5]);
		const pictureNode = asn1.sub[0]?.sub[1]?.sub[0]?.sub[3];
		SES_Signature = {
			realVersion: 1,
			toSign: { eseal: { esealInfo: {
				property: {
					name: parseStringUTF(asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[1]),
					createDate,
					validStart,
					validEnd
				},
				picture: {
					type: parseStringUTF(pictureNode?.sub[0]),
					data: { byte: parseOctetBytes(pictureNode?.sub[1]) },
					width: parseInteger(pictureNode?.sub[2]),
					height: parseInteger(pictureNode?.sub[3])
				}
			} } }
		};
	} catch (e) {
		try {
			const pictureNode = asn1.sub[0]?.sub[1]?.sub[0]?.sub[3];
			SES_Signature = {
				realVersion: 4,
				toSign: { eseal: { esealInfo: {
					property: {
						name: parseStringUTF(asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[1]),
						createDate: asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[4]?.stream.parseTime(asn1.sub[0].sub[1].sub[0].sub[2].sub[4].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[4].header, asn1.sub[0].sub[1].sub[0].sub[2].sub[4].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[4].header + asn1.sub[0].sub[1].sub[0].sub[2].sub[4].length),
						validStart: asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[5]?.stream.parseTime(asn1.sub[0].sub[1].sub[0].sub[2].sub[5].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[5].header, asn1.sub[0].sub[1].sub[0].sub[2].sub[5].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[5].header + asn1.sub[0].sub[1].sub[0].sub[2].sub[5].length),
						validEnd: asn1.sub[0]?.sub[1]?.sub[0]?.sub[2]?.sub[6]?.stream.parseTime(asn1.sub[0].sub[1].sub[0].sub[2].sub[6].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[6].header, asn1.sub[0].sub[1].sub[0].sub[2].sub[6].stream.pos + asn1.sub[0].sub[1].sub[0].sub[2].sub[6].header + asn1.sub[0].sub[1].sub[0].sub[2].sub[6].length)
					},
					picture: {
						type: parseStringUTF(pictureNode?.sub[0]),
						data: { byte: parseOctetBytes(pictureNode?.sub[1]) },
						width: parseInteger(pictureNode?.sub[2]),
						height: parseInteger(pictureNode?.sub[3])
					}
				} } }
			};
		} catch (inner) {
			console.warn("[ofd] unsupported SES signature structure", inner);
			SES_Signature = {};
		}
	}
	return SES_Signature;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/ofd/ofd_parser.js
var ensureBrowserGlobal = () => {
	if (!globalThis.global) globalThis.global = globalThis;
	globalThis.xmlParseFlag = 0;
};
var appendChildValue = function(target, key, value) {
	if (Object.prototype.hasOwnProperty.call(target, key)) {
		target[key] = Array.isArray(target[key]) ? target[key].concat(value) : [target[key], value];
		return;
	}
	target[key] = value;
};
var xmlElementName = function(element) {
	return element.namespaceURI === "http://www.ofdspec.org/2016" ? `ofd:${element.localName}` : element.nodeName;
};
var parseXmlElement = function(element, options, order) {
	const attrPrefix = options.attributeNamePrefix ?? "@_";
	const result = {};
	if (options.ignoreAttributes !== true) for (const attr of Array.from(element.attributes || [])) result[`${attrPrefix}${attr.name}`] = attr.value;
	const textParts = [];
	for (const child of Array.from(element.childNodes || [])) {
		if (child.nodeType === 1) {
			const pfIndex = order ? order.next++ : void 0;
			const parsedChild = parseXmlElement(child, options, order);
			if (parsedChild && typeof parsedChild === "object" && pfIndex !== void 0) parsedChild.pfIndex = pfIndex;
			appendChildValue(result, xmlElementName(child), parsedChild);
			continue;
		}
		if (child.nodeType === 3 || child.nodeType === 4) textParts.push(child.nodeValue || "");
	}
	const rawText = textParts.join("");
	const text = xmlElementName(element) === "ofd:TextCode" ? rawText : rawText.trim();
	if (text) {
		if (Object.keys(result).length === 0) return text;
		result["#text"] = text;
	}
	return result;
};
var normalizeXmlContent = function(xmlData) {
	return String(xmlData || "").replace(/^\uFEFF/, "").replace(/^\u00EF\u00BB\u00BF/, "");
};
var parseXmlToJson = function(xmlData, options = {}) {
	const DOMParserCtor = globalThis.DOMParser;
	if (typeof DOMParserCtor !== "function") throw new Error("OFD XML parser requires DOMParser in the current runtime");
	const document = new DOMParserCtor().parseFromString(normalizeXmlContent(xmlData), "application/xml");
	const parserError = document.getElementsByTagName("parsererror")[0];
	if (parserError) throw new Error(parserError.textContent || "OFD XML parse failed");
	const root = document.documentElement;
	if (!root) return {};
	return { [xmlElementName(root)]: parseXmlElement(root, options, { next: 0 }) };
};
var asArray = function(value) {
	if (!value) return [];
	return Array.isArray(value) ? value : [value];
};
var collectGroupedItems = function(groupOrGroups, childKey) {
	let items = [];
	for (const group of asArray(groupOrGroups)) if (group) items = items.concat(asArray(group[childKey]));
	return items;
};
var zipEntryMapCache = /* @__PURE__ */ new WeakMap();
var normalizeZipPath = function(value) {
	if (!value) return "";
	let normalized = String(value).replace(/\\/g, "/").trim();
	try {
		normalized = decodeURIComponent(normalized);
	} catch {}
	normalized = normalized.replace(/^\/+/, "").replace(/^\.\//, "").replace(/\/+/g, "/");
	const segments = [];
	for (const segment of normalized.split("/")) {
		if (!segment || segment === ".") continue;
		if (segment === "..") {
			segments.pop();
			continue;
		}
		segments.push(segment);
	}
	return segments.join("/");
};
var joinZipPath = function(...parts) {
	return normalizeZipPath(parts.filter(Boolean).join("/"));
};
var startsWithZipRoot = function(path, root) {
	const normalizedPath = normalizeZipPath(path).toLowerCase();
	const normalizedRoot = normalizeZipPath(root).toLowerCase();
	return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
};
var getZipEntry = function(zip, candidates) {
	const paths = asArray(candidates).map(normalizeZipPath).filter(Boolean);
	let lowerMap = zipEntryMapCache.get(zip);
	if (!lowerMap) {
		lowerMap = /* @__PURE__ */ new Map();
		for (const name of Object.keys(zip.files)) lowerMap.set(normalizeZipPath(name).toLowerCase(), zip.files[name]);
		zipEntryMapCache.set(zip, lowerMap);
	}
	for (const path of paths) {
		const entry = zip.files[path] || lowerMap.get(path.toLowerCase());
		if (entry) return entry;
	}
	return null;
};
var resolveDocumentPath = function(path, doc) {
	const normalizedPath = normalizeZipPath(path);
	if (!normalizedPath || !doc || /^[\\/]/.test(String(path).trim()) || startsWithZipRoot(normalizedPath, doc)) return normalizedPath;
	return joinZipPath(doc, path);
};
var resolveResourceCandidates = function(file, baseLoc, doc, resourcePath) {
	const mediaFile = normalizeZipPath(file);
	const base = normalizeZipPath(baseLoc);
	const rawFile = String(file || "").replace(/\\/g, "/").trim();
	const rawBase = String(baseLoc || "").replace(/\\/g, "/").trim();
	const resourceDirectory = normalizeZipPath(resourcePath).split("/").slice(0, -1).join("/");
	const resourceBase = rawBase.startsWith("/") ? normalizeZipPath(rawBase) : joinZipPath(resourceDirectory, rawBase);
	const declaredPath = rawFile.startsWith("/") ? mediaFile : joinZipPath(resourceBase, rawFile);
	const candidates = [mediaFile];
	if (base && !startsWithZipRoot(mediaFile, base)) candidates.push(joinZipPath(base, mediaFile));
	const docCandidates = [];
	for (const candidate of candidates) {
		docCandidates.push(candidate);
		if (candidate && !startsWithZipRoot(candidate, doc)) docCandidates.push(joinZipPath(doc, candidate));
	}
	return [...new Set([declaredPath, ...docCandidates].filter(Boolean))];
};
var getImageMime = function(format) {
	const normalized = format ? format.toLowerCase() : "";
	if (normalized === "jpg" || normalized === "jpeg") return "image/jpeg";
	if (normalized === "gif") return "image/gif";
	if (normalized === "bmp") return "image/bmp";
	if (normalized === "webp") return "image/webp";
	return "image/png";
};
var unzipOfd = function(file) {
	return new Promise((resolve, reject) => {
		import_lib.default.loadAsync(file).then(function(zip) {
			resolve(zip);
		}, function(e) {
			reject(e);
		});
	});
};
var getDocRoots = async function(zip) {
	const docbodys = (await getJsonFromXmlContent(zip, "OFD.xml"))["json"]["ofd:OFD"]["ofd:DocBody"];
	let array = [];
	array = array.concat(docbodys);
	return [zip, array];
};
var parseSingleDoc = async function([zip, array]) {
	let docs = [];
	for (let docbody of array) if (docbody) {
		let res = await doGetDocRoot(zip, docbody);
		res = await getDocument(res);
		res = await getDocumentRes(res);
		res = await getPublicRes(res);
		res = await getTemplatePage(res);
		res = await getPage(res);
		docs.push(res);
	}
	return docs;
};
var uint8ArrayToBase64 = function(bytes) {
	const chunkSize = 32768;
	let binary = "";
	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize);
		binary += String.fromCharCode.apply(null, chunk);
	}
	return btoa(binary);
};
var sealImageMime = function(type) {
	const normalized = String(type || "").toLowerCase();
	if (normalized === "jpg" || normalized === "jpeg") return "image/jpeg";
	if (normalized === "gif") return "image/gif";
	if (normalized === "bmp") return "image/bmp";
	return "image/png";
};
var doGetDocRoot = async function(zip, docbody) {
	let docRoot = docbody["ofd:DocRoot"];
	docRoot = normalizeZipPath(replaceFirstSlash(docRoot));
	const doc = docRoot.split("/").slice(0, -1).join("/");
	const signatures = docbody["ofd:Signatures"];
	const stampAnnot = await getSignature(zip, signatures, doc);
	let stampAnnotArray = {};
	for (const stamp of stampAnnot) if (stamp.sealObj && Object.keys(stamp.sealObj).length > 0) {
		if (stamp.sealObj.type === "ofd") try {
			const stampObjs = await getSealDocumentObj(stamp);
			let annotArray = [];
			annotArray = annotArray.concat(stamp.stampAnnot);
			for (const annot of annotArray) {
				if (!annot) continue;
				annot.boundary = parseStBox(annot["@_Boundary"]);
				annot.pageRef = annot["@_PageRef"];
				for (let stampObj of stampObjs) {
					if (!stampAnnotArray[annot["@_PageRef"]]) stampAnnotArray[annot["@_PageRef"]] = [];
					stampAnnotArray[annot["@_PageRef"]].push({
						type: "ofd",
						obj: stampObj,
						stamp: {
							...stamp,
							stampAnnot: annot
						}
					});
				}
			}
		} catch (e) {
			console.warn("[ofd] nested OFD seal parse failed", e);
		}
		else if (stamp.sealObj.ofdArray?.length) {
			let img = `data:${sealImageMime(stamp.sealObj.type)};base64,` + uint8ArrayToBase64(stamp.sealObj.ofdArray);
			let stampArray = [];
			stampArray = stampArray.concat(stamp.stampAnnot);
			for (const annot of stampArray) if (annot) {
				const stampObj = {
					img,
					pageId: annot["@_PageRef"],
					"boundary": parseStBox(annot["@_Boundary"]),
					"clip": parseStBox(annot["@_Clip"])
				};
				if (!stampAnnotArray[annot["@_PageRef"]]) stampAnnotArray[annot["@_PageRef"]] = [];
				stampAnnotArray[annot["@_PageRef"]].push({
					type: "png",
					obj: stampObj,
					stamp
				});
			}
		}
	}
	return [
		zip,
		doc,
		docRoot,
		stampAnnotArray
	];
};
var getDocument = async function([zip, doc, docRoot, stampAnnot]) {
	const documentObj = (await getJsonFromXmlContent(zip, docRoot))["json"]["ofd:Document"];
	let annotations = documentObj["ofd:Annotations"];
	let array = [];
	let annoBase;
	if (annotations) {
		if (annotations.indexOf("/") !== -1) annoBase = annotations.substring(0, annotations.indexOf("/"));
		if (annotations.indexOf(doc) === -1) annotations = `${doc}/${annotations}`;
		if (getZipEntry(zip, annotations)) {
			annotations = await getJsonFromXmlContent(zip, annotations);
			array = array.concat(annotations["json"]["ofd:Annotations"]["ofd:Page"]);
		}
	}
	return [
		zip,
		doc,
		documentObj,
		stampAnnot,
		await getAnnotations(annoBase, array, doc, zip)
	];
};
var getAnnotations = async function(annoBase, annotations, doc, zip) {
	let annotationObjs = {};
	for (let anno of annotations) {
		if (!anno) continue;
		const pageId = anno["@_PageID"];
		let fileLoc = anno["ofd:FileLoc"];
		if (!fileLoc) continue;
		fileLoc = normalizeZipPath(replaceFirstSlash(fileLoc));
		if (annoBase && fileLoc.indexOf(annoBase) === -1) fileLoc = `${annoBase}/${fileLoc}`;
		if (fileLoc.indexOf(doc) === -1) fileLoc = `${doc}/${fileLoc}`;
		if (getZipEntry(zip, fileLoc)) {
			const data = await getJsonFromXmlContent(zip, fileLoc);
			let array = [];
			array = array.concat(data["json"]["ofd:PageAnnot"]["ofd:Annot"]);
			if (!annotationObjs[pageId]) annotationObjs[pageId] = [];
			for (let annot of array) {
				if (!annot) continue;
				const type = annot["@_Type"];
				const visible = annot["@_Visible"] ? annot["@_Visible"] : true;
				let appearanceObj = {
					type,
					appearance: annot["ofd:Appearance"],
					visible
				};
				annotationObjs[pageId].push(appearanceObj);
			}
		}
	}
	return annotationObjs;
};
var getDocumentRes = async function([zip, doc, Document, stampAnnot, annotationObjs]) {
	let documentResPath = Document["ofd:CommonData"]["ofd:DocumentRes"];
	let fontResObj = {};
	let drawParamResObj = {};
	let multiMediaResObj = {};
	if (documentResPath) {
		documentResPath = resolveDocumentPath(documentResPath, doc);
		if (getZipEntry(zip, documentResPath)) {
			const documentResObj = (await getJsonFromXmlContent(zip, documentResPath))["json"]["ofd:Res"];
			fontResObj = await getFont(documentResObj);
			drawParamResObj = await getDrawParam(documentResObj);
			multiMediaResObj = await getMultiMediaRes(zip, documentResObj, doc, documentResPath);
		}
	}
	return [
		zip,
		doc,
		Document,
		stampAnnot,
		annotationObjs,
		fontResObj,
		drawParamResObj,
		multiMediaResObj
	];
};
var getPublicRes = async function([zip, doc, Document, stampAnnot, annotationObjs, fontResObj, drawParamResObj, multiMediaResObj]) {
	let publicResPath = Document["ofd:CommonData"]["ofd:PublicRes"];
	if (publicResPath) {
		publicResPath = resolveDocumentPath(publicResPath, doc);
		if (getZipEntry(zip, publicResPath)) {
			const publicResObj = (await getJsonFromXmlContent(zip, publicResPath))["json"]["ofd:Res"];
			let fontObj = await getFont(publicResObj);
			fontResObj = Object.assign(fontResObj, fontObj);
			let drawParamObj = await getDrawParam(publicResObj);
			drawParamResObj = Object.assign(drawParamResObj, drawParamObj);
			let multiMediaObj = await getMultiMediaRes(zip, publicResObj, doc, publicResPath);
			multiMediaResObj = Object.assign(multiMediaResObj, multiMediaObj);
		}
	}
	return [
		zip,
		doc,
		Document,
		stampAnnot,
		annotationObjs,
		fontResObj,
		drawParamResObj,
		multiMediaResObj
	];
};
var getTemplatePage = async function([zip, doc, Document, stampAnnot, annotationObjs, fontResObj, drawParamResObj, multiMediaResObj]) {
	let templatePages = Document["ofd:CommonData"]["ofd:TemplatePage"];
	let array = [];
	array = array.concat(templatePages);
	let tpls = {};
	for (const templatePage of array) if (templatePage) {
		let pageObj = await parsePage(zip, templatePage, doc);
		tpls[Object.keys(pageObj)[0]] = pageObj[Object.keys(pageObj)[0]];
	}
	return [
		zip,
		doc,
		Document,
		stampAnnot,
		annotationObjs,
		tpls,
		fontResObj,
		drawParamResObj,
		multiMediaResObj
	];
};
var getPage = async function([zip, doc, Document, stampAnnot, annotationObjs, tpls, fontResObj, drawParamResObj, multiMediaResObj]) {
	let pages = Document["ofd:Pages"]["ofd:Page"];
	let array = [];
	array = array.concat(pages);
	let res = [];
	for (const page of array) if (page) {
		let pageObj = await parsePage(zip, page, doc);
		const pageId = Object.keys(pageObj)[0];
		const currentPageStamp = stampAnnot[pageId];
		if (currentPageStamp) pageObj[pageId].stamp = currentPageStamp;
		const annotationObj = annotationObjs[pageId];
		if (annotationObj) pageObj[pageId].annotation = annotationObj;
		res.push(pageObj);
	}
	return {
		"doc": doc,
		"document": Document,
		"pages": res,
		"tpls": tpls,
		"stampAnnot": stampAnnot,
		fontResObj,
		drawParamResObj,
		multiMediaResObj
	};
};
var getFont = async function(res) {
	const fonts = res["ofd:Fonts"];
	let fontResObj = {};
	if (fonts) {
		let fontArray = collectGroupedItems(fonts, "ofd:Font");
		for (const font of fontArray) if (font) if (font["@_FamilyName"]) fontResObj[font["@_ID"]] = font["@_FamilyName"];
		else fontResObj[font["@_ID"]] = font["@_FontName"];
	}
	return fontResObj;
};
var getDrawParam = async function(res) {
	const drawParams = res["ofd:DrawParams"];
	let drawParamResObj = {};
	if (drawParams) {
		let array = collectGroupedItems(drawParams, "ofd:DrawParam");
		for (const item of array) if (item) drawParamResObj[item["@_ID"]] = {
			"LineWidth": item["@_LineWidth"],
			"FillColor": item["ofd:FillColor"] ? item["ofd:FillColor"]["@_Value"] : "",
			"StrokeColor": item["ofd:StrokeColor"] ? item["ofd:StrokeColor"]["@_Value"] : "",
			"relative": item["@_Relative"]
		};
	}
	return drawParamResObj;
};
var getMultiMediaRes = async function(zip, res, doc, resourcePath) {
	const multiMedias = res["ofd:MultiMedias"];
	let multiMediaResObj = {};
	if (multiMedias) {
		let array = collectGroupedItems(multiMedias, "ofd:MultiMedia");
		for (const item of array) if (item && item["ofd:MediaFile"]) {
			const candidates = resolveResourceCandidates(item["ofd:MediaFile"], res["@_BaseLoc"], doc, resourcePath);
			const file = getZipEntry(zip, candidates) ? candidates : null;
			if ((item["@_Type"] ? item["@_Type"].toLowerCase() : "") === "image") {
				const format = item["@_Format"];
				const ext = getExtensionByPath(candidates[0]);
				if (format && (format.toLowerCase() === "gbig2" || format.toLowerCase() === "jb2") || ext && (ext.toLowerCase() === "jb2" || ext.toLowerCase() === "gbig2")) {
					const jbig2 = await parseJbig2ImageFromZip(zip, candidates);
					if (jbig2) multiMediaResObj[item["@_ID"]] = jbig2;
				} else {
					const imageFormat = format || ext || "png";
					const img = await parseOtherImageFromZip(zip, candidates, getImageMime(imageFormat));
					if (img) multiMediaResObj[item["@_ID"]] = {
						img,
						"format": imageFormat.toLowerCase()
					};
				}
			} else multiMediaResObj[item["@_ID"]] = file ? file[0] : candidates[0];
		}
	}
	return multiMediaResObj;
};
var parsePage = async function(zip, obj, doc) {
	let pagePath = obj["@_BaseLoc"];
	pagePath = resolveDocumentPath(pagePath, doc);
	const data = await getJsonFromXmlContent(zip, pagePath);
	let pageObj = {};
	pageObj[obj["@_ID"]] = {
		"json": data["json"]["ofd:Page"],
		"xml": data["xml"]
	};
	return pageObj;
};
var getSignature = async function(zip, signatures, doc) {
	let stampAnnot = [];
	if (!signatures) return stampAnnot;
	try {
		let signaturesPath = normalizeZipPath(replaceFirstSlash(signatures));
		if (!startsWithZipRoot(signaturesPath, doc)) signaturesPath = joinZipPath(doc, signaturesPath);
		if (!getZipEntry(zip, signaturesPath)) return stampAnnot;
		let signature = (await getJsonFromXmlContent(zip, signaturesPath))["json"]["ofd:Signatures"]["ofd:Signature"];
		let signatureArray = [];
		signatureArray = signatureArray.concat(signature);
		for (const sign of signatureArray) {
			if (!sign) continue;
			try {
				let signatureLoc = normalizeZipPath(replaceFirstSlash(sign["@_BaseLoc"]));
				let signatureID = sign["@_ID"];
				if (signatureLoc && signatureLoc.indexOf("Signs") === -1 && !startsWithZipRoot(signatureLoc, doc)) signatureLoc = joinZipPath("Signs", signatureLoc);
				if (!startsWithZipRoot(signatureLoc, doc)) signatureLoc = joinZipPath(doc, signatureLoc);
				const parsed = await getSignatureData(zip, signatureLoc, signatureID);
				if (parsed) stampAnnot.push(parsed);
			} catch (e) {
				console.warn("[ofd] signature entry parse failed", sign?.["@_ID"], e);
			}
		}
	} catch (e) {
		console.warn("[ofd] signatures.xml parse failed", e);
	}
	return stampAnnot;
};
var getSignatureData = async function(zip, signature, signatureID) {
	const data = await getJsonFromXmlContent(zip, signature);
	let signedValue = data["json"]["ofd:Signature"]["ofd:SignedValue"];
	if (signedValue == null) return null;
	signedValue = normalizeZipPath(replaceFirstSlash(String(signedValue)));
	if (!getZipEntry(zip, signedValue)) signedValue = joinZipPath(signature.substring(0, signature.lastIndexOf("/")), signedValue);
	if (!getZipEntry(zip, signedValue)) {
		console.warn("[ofd] SignedValue not found", signedValue);
		return null;
	}
	let sealObj = await parseSesSignature(zip, signedValue, getZipEntry);
	if (!sealObj || !Object.keys(sealObj).length) return null;
	const signedInfoNode = data["json"]["ofd:Signature"]["ofd:SignedInfo"] || {};
	return {
		"stampAnnot": signedInfoNode["ofd:StampAnnot"],
		"sealObj": sealObj,
		"signedInfo": {
			"signatureID": signatureID,
			"VerifyRet": sealObj.verifyRet,
			"VerificationStatus": sealObj.verificationStatus || "not-verified",
			"Provider": signedInfoNode["ofd:Provider"],
			"SignatureMethod": signedInfoNode["ofd:SignatureMethod"],
			"SignatureDateTime": signedInfoNode["ofd:SignatureDateTime"]
		}
	};
};
var getSealDocumentObj = function(stampAnnot) {
	return new Promise((resolve, reject) => {
		pipeline.call(this, async () => await unzipOfd(stampAnnot.sealObj.ofdArray), getDocRoots, parseSingleDoc).then((res) => {
			resolve(res);
		}).catch((res) => {
			reject(res);
		});
	});
};
var getJsonFromXmlContent = async function(zip, xmlName) {
	const entry = getZipEntry(zip, xmlName);
	if (!entry) throw new Error(`OFD XML resource not found: ${normalizeZipPath(xmlName)}`);
	const content = await entry.async("string");
	ensureBrowserGlobal();
	try {
		return {
			xml: content,
			json: parseXmlToJson(content, {
				attributeNamePrefix: "@_",
				ignoreAttributes: false,
				parseNodeValue: false,
				trimValues: false
			})
		};
	} catch (error) {
		throw new Error(`OFD XML parse failed (${normalizeZipPath(xmlName)}): ${error.message}`);
	}
};
var parseJbig2ImageFromZip = async function(zip, name) {
	const entry = getZipEntry(zip, name);
	if (!entry) return null;
	const bytes = await entry.async("uint8array");
	const jbig2 = new Jbig2Image();
	return {
		img: jbig2.parse(bytes),
		width: jbig2.width,
		height: jbig2.height,
		format: "gbig2"
	};
};
var parseOtherImageFromZip = async function(zip, name, mime = "image/png") {
	return new Promise((resolve, reject) => {
		const entry = getZipEntry(zip, name);
		if (!entry) {
			resolve(null);
			return;
		}
		entry.async("base64").then(function(bytes) {
			resolve(`data:${mime};base64,` + bytes);
		}, function error(e) {
			reject(e);
		});
	});
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-ofd@3.1.2/node_modules/@file-viewer/renderer-ofd/vendor/dltech/ofd/ofd.js
var parseOfdDocument = function(options) {
	if (options.ofd instanceof File || options.ofd instanceof Blob || options.ofd instanceof ArrayBuffer) doParseOFD(options);
	else options.fail?.(/* @__PURE__ */ new Error("OFD 预览只接收 File、Blob 或 ArrayBuffer 数据"));
};
var doParseOFD = function(options) {
	pipeline.call(this, async () => await unzipOfd(options.ofd), getDocRoots, parseSingleDoc).then((res) => {
		if (options.success) options.success(res);
	}).catch((res) => {
		console.log(res);
		if (options.fail) options.fail(res);
	});
};
var renderOfd = function(screenWidth, ofd) {
	let divArray = [];
	if (!ofd) return divArray;
	for (const page of ofd.pages) {
		let box = calPageBox(screenWidth, ofd.document, page);
		const pageId = Object.keys(page)[0];
		let pageDiv = document.createElement("div");
		pageDiv.id = pageId;
		pageDiv.setAttribute("style", `margin-bottom: 20px;position: relative;width:${box.w}px;height:${box.h}px;background: white;overflow:hidden;`);
		renderPage(pageDiv, page, ofd.tpls, ofd.fontResObj, ofd.drawParamResObj, ofd.multiMediaResObj);
		divArray.push(pageDiv);
	}
	return divArray;
};
var renderOfdByScale = function(ofd) {
	let divArray = [];
	if (!ofd) return divArray;
	for (const page of ofd.pages) {
		let box = calPageBoxScale(ofd.document, page);
		const pageId = Object.keys(page)[0];
		let pageDiv = document.createElement("div");
		pageDiv.id = pageId;
		pageDiv.setAttribute("style", `margin-bottom: 20px;position: relative;width:${box.w}px;height:${box.h}px;background: white;overflow:hidden;`);
		renderPage(pageDiv, page, ofd.tpls, ofd.fontResObj, ofd.drawParamResObj, ofd.multiMediaResObj);
		divArray.push(pageDiv);
	}
	return divArray;
};
var digestCheck = function(options) {
	return options?.arr ? false : false;
};
var setPageScale = function(scale) {
	setPageScal(scale);
};
var getPageScale = function() {
	return getPageScal();
};
//#endregion
export { renderOfdByScale as a, calPageBoxScale as c, ofdRenderer as d, renderOfd as i, renderPage as l, getPageScale as n, setPageScale as o, parseOfdDocument as r, calPageBox as s, digestCheck as t, renderOfd$1 as u };
