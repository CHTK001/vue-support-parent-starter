var createFileViewerZoomState = (patch = {}) => {
	var _a, _b, _c;
	const scale = Number.isFinite(patch.scale) && patch.scale ? Number(patch.scale) : 1;
	return {
		scale,
		label: patch.label || `${Math.round(scale * 100)}%`,
		canZoomIn: (_a = patch.canZoomIn) !== null && _a !== void 0 ? _a : false,
		canZoomOut: (_b = patch.canZoomOut) !== null && _b !== void 0 ? _b : false,
		canReset: (_c = patch.canReset) !== null && _c !== void 0 ? _c : false,
		minScale: patch.minScale,
		maxScale: patch.maxScale
	};
};
var normalizeFileViewerSearchOptions = (options) => {
	if (options === false) return { enabled: false };
	if (options === true || options === void 0) return {};
	return options;
};
var createEmptyFileViewerSearchState = (query = "") => ({
	query,
	total: 0,
	currentIndex: -1,
	current: null,
	matches: []
});
var normalizeFileViewerAiOptions = (options) => {
	if (options === false) return {
		enabled: false,
		collectText: false
	};
	if (options === true || options === void 0) return {};
	return options;
};
var buildFileViewerDocumentTextChunks = (anchors, options) => {
	var _a;
	const normalized = normalizeFileViewerAiOptions(options);
	if (normalized.enabled === false || normalized.collectText === false) return [];
	const chunkSize = Math.max(200, normalized.chunkSize || 1200);
	const overlap = Math.max(0, Math.min(chunkSize - 1, (_a = normalized.chunkOverlap) !== null && _a !== void 0 ? _a : 160));
	const maxTextLength = Math.max(0, normalized.maxTextLength || 0);
	const chunks = [];
	anchors.forEach((anchor) => {
		const source = maxTextLength ? anchor.text.slice(0, maxTextLength) : anchor.text;
		if (!source) return;
		if (source.length <= chunkSize) {
			chunks.push({
				id: `${anchor.id}-chunk-1`,
				text: source,
				anchor,
				startLine: anchor.line,
				endLine: anchor.line
			});
			return;
		}
		let offset = 0;
		let chunkIndex = 1;
		while (offset < source.length) {
			const text = source.slice(offset, offset + chunkSize);
			chunks.push({
				id: `${anchor.id}-chunk-${chunkIndex}`,
				text,
				anchor,
				startLine: anchor.line,
				endLine: anchor.line
			});
			if (offset + chunkSize >= source.length) break;
			offset += chunkSize - overlap;
			chunkIndex += 1;
		}
	});
	return chunks;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/features/document/dom/anchors.js
var DEFAULT_FILE_VIEWER_ANCHOR_SELECTOR = [
	"[data-viewer-anchor-id]",
	".pdfViewer .page",
	".docx-wrapper section",
	".docx p",
	".docx li",
	".docx table",
	".markdown-body h1",
	".markdown-body h2",
	".markdown-body h3",
	".markdown-body h4",
	".markdown-body h5",
	".markdown-body h6",
	".markdown-body p",
	".markdown-body li",
	".markdown-body pre",
	".markdown-body table",
	"article h1",
	"article h2",
	"article h3",
	"article h4",
	"article h5",
	"article h6",
	"article p",
	"article li",
	"article pre",
	"article table",
	"pre code",
	"p",
	"li",
	"tr",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"pre",
	"table"
].join(",");
var DEFAULT_FILE_VIEWER_ANCHOR_EXCLUDE_SELECTOR = [
	".viewer-actions",
	".viewer-watermark",
	".state-panel",
	".pdf-toolbar",
	".pdf-nav-pane",
	".flyfish-search-match"
].join(",");
var cssEscape = (value) => {
	if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
	return value.replace(/["\\]/g, "\\$&");
};
var trimText = (value, maxLength = 160) => {
	const normalized = value.replace(/\s+/g, " ").trim();
	return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
};
var isElementVisible = (element) => {
	const rect = element.getBoundingClientRect();
	return rect.width > 0 || rect.height > 0;
};
var shouldSkipAnchorElement = (element) => {
	return !!element.closest(DEFAULT_FILE_VIEWER_ANCHOR_EXCLUDE_SELECTOR);
};
var getPageNumber = (element) => {
	const pageElement = element.closest("[data-page-number], [data-page]");
	const rawPage = (pageElement === null || pageElement === void 0 ? void 0 : pageElement.dataset.pageNumber) || (pageElement === null || pageElement === void 0 ? void 0 : pageElement.dataset.page);
	const page = rawPage ? Number.parseInt(rawPage, 10) : NaN;
	return Number.isFinite(page) ? page : void 0;
};
var getAnchorType = (element) => {
	if (element.matches(".pdfViewer .page, [data-page-number], [data-page]")) return "page";
	if (element.matches("p, li, tr, pre, code")) return "line";
	return "block";
};
var isNestedInAcceptedElement = (element, acceptedElements) => {
	let parent = element.parentElement;
	while (parent) {
		if (acceptedElements.has(parent)) return true;
		parent = parent.parentElement;
	}
	return false;
};
var collectFileViewerDocumentAnchors = (root) => {
	if (!root) return [];
	const rootRect = root.getBoundingClientRect();
	const acceptedElements = /* @__PURE__ */ new Set();
	const anchors = [];
	Array.from(root.querySelectorAll(DEFAULT_FILE_VIEWER_ANCHOR_SELECTOR)).forEach((element) => {
		if (shouldSkipAnchorElement(element) || !isElementVisible(element)) return;
		const text = trimText(element.textContent || "", 1e3);
		if (!text) return;
		if (isNestedInAcceptedElement(element, acceptedElements) && !element.matches("p, li, tr, pre, code")) return;
		acceptedElements.add(element);
		const id = element.dataset.viewerAnchorId || `viewer-anchor-${anchors.length + 1}`;
		element.dataset.viewerAnchorId = id;
		element.dataset.viewerLine = String(anchors.length + 1);
		const rect = element.getBoundingClientRect();
		anchors.push({
			id,
			index: anchors.length,
			line: anchors.length + 1,
			type: getAnchorType(element),
			label: trimText(text, 96),
			text,
			page: getPageNumber(element),
			top: rect.top - rootRect.top + root.scrollTop,
			left: rect.left - rootRect.left + root.scrollLeft,
			width: rect.width,
			height: rect.height
		});
	});
	return anchors;
};
var findFileViewerAnchorForElement = (element, anchors, root) => {
	if (!element) return null;
	const anchorElement = element.closest("[data-viewer-anchor-id]");
	if (anchorElement === null || anchorElement === void 0 ? void 0 : anchorElement.dataset.viewerAnchorId) {
		const anchor = anchors.find((item) => item.id === anchorElement.dataset.viewerAnchorId);
		if (anchor) return anchor;
	}
	if (!root) return null;
	const rootRect = root.getBoundingClientRect();
	const top = element.getBoundingClientRect().top - rootRect.top + root.scrollTop;
	let fallback = null;
	for (const anchor of anchors) {
		if (anchor.top <= top + 1) {
			fallback = anchor;
			continue;
		}
		break;
	}
	return fallback;
};
var getCurrentFileViewerDocumentAnchor = (root, anchors) => {
	if (!root || !anchors.length) return null;
	const viewportMiddle = root.scrollTop + root.clientHeight * .42;
	let current = anchors[0];
	for (const anchor of anchors) {
		if (anchor.top <= viewportMiddle) {
			current = anchor;
			continue;
		}
		break;
	}
	return current;
};
var scrollToFileViewerDocumentAnchor = (root, anchor) => {
	if (!root || anchor === null || anchor === void 0) return false;
	const selector = typeof anchor === "object" ? `[data-viewer-anchor-id="${cssEscape(anchor.id)}"]` : typeof anchor === "number" ? `[data-viewer-line="${anchor}"]` : `[data-viewer-anchor-id="${cssEscape(anchor)}"]`;
	const target = root.querySelector(selector);
	if (target) {
		target.scrollIntoView({
			block: "center",
			inline: "nearest"
		});
		return true;
	}
	if (typeof anchor === "object") {
		root.scrollTo({
			top: Math.max(0, anchor.top - root.clientHeight * .18),
			left: Math.max(0, Math.min(anchor.left, root.scrollWidth - root.clientWidth)),
			behavior: "smooth"
		});
		return true;
	}
	return false;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/features/document/dom/providers.js
var searchProviderRegistry = /* @__PURE__ */ new WeakMap();
var zoomProviderRegistry = /* @__PURE__ */ new WeakMap();
var viewStateProviderRegistry = /* @__PURE__ */ new WeakMap();
var isProviderElement = (root) => {
	return !!root && root.nodeType === 1;
};
var queryProviderHosts = (root, selector) => {
	if (!(root === null || root === void 0 ? void 0 : root.querySelectorAll)) return [];
	const hosts = Array.from(root.querySelectorAll(selector));
	if (isProviderElement(root) && root.shadowRoot) hosts.push(...queryProviderHosts(root.shadowRoot, selector));
	const elements = Array.from(root.querySelectorAll("*"));
	for (const element of elements) if (element.shadowRoot) hosts.push(...queryProviderHosts(element.shadowRoot, selector));
	return hosts;
};
var registerFileViewerSearchProvider = (host, provider) => {
	searchProviderRegistry.set(host, provider);
	host.__flyfishViewerSearchProvider = provider;
};
var unregisterFileViewerSearchProvider = (host) => {
	if (!host) return;
	searchProviderRegistry.delete(host);
	delete host.__flyfishViewerSearchProvider;
};
var findFileViewerSearchProvider = (root) => {
	if (!root) return null;
	const direct = isProviderElement(root) ? searchProviderRegistry.get(root) || root.__flyfishViewerSearchProvider : null;
	if (direct) return direct;
	const host = queryProviderHosts(root, "[data-viewer-search-provider]")[0];
	return host ? searchProviderRegistry.get(host) || host.__flyfishViewerSearchProvider || null : null;
};
var registerFileViewerZoomProvider = (host, provider) => {
	zoomProviderRegistry.set(host, provider);
	host.dataset.viewerZoomProvider = host.dataset.viewerZoomProvider || "custom";
	host.__flyfishViewerZoomProvider = provider;
};
var unregisterFileViewerZoomProvider = (host) => {
	if (!host) return;
	zoomProviderRegistry.delete(host);
	delete host.dataset.viewerZoomProvider;
	delete host.__flyfishViewerZoomProvider;
};
var findFileViewerZoomProvider = (root) => {
	if (!root) return null;
	const direct = isProviderElement(root) ? zoomProviderRegistry.get(root) || root.__flyfishViewerZoomProvider : null;
	if (direct) return direct;
	const host = queryProviderHosts(root, "[data-viewer-zoom-provider]")[0];
	return host ? zoomProviderRegistry.get(host) || host.__flyfishViewerZoomProvider || null : null;
};
var registerFileViewerViewStateProvider = (host, provider) => {
	viewStateProviderRegistry.set(host, provider);
	host.dataset.viewerViewStateProvider = host.dataset.viewerViewStateProvider || "custom";
	host.__flyfishViewerViewStateProvider = provider;
};
var unregisterFileViewerViewStateProvider = (host) => {
	if (!host) return;
	viewStateProviderRegistry.delete(host);
	delete host.dataset.viewerViewStateProvider;
	delete host.__flyfishViewerViewStateProvider;
};
var findFileViewerViewStateProvider = (root) => {
	if (!root) return null;
	const direct = isProviderElement(root) ? viewStateProviderRegistry.get(root) || root.__flyfishViewerViewStateProvider : null;
	if (direct && (!isProviderElement(root) || root.dataset.viewerViewStateProvider !== "generic")) return direct;
	const hosts = queryProviderHosts(root, "[data-viewer-view-state-provider]");
	const customHost = hosts.find((host) => host.dataset.viewerViewStateProvider !== "generic");
	const genericHost = hosts.find((host) => host.dataset.viewerViewStateProvider === "generic");
	const host = customHost || genericHost;
	if (host) return viewStateProviderRegistry.get(host) || host.__flyfishViewerViewStateProvider || null;
	return direct || null;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/features/document/zoom.js
var cloneFileViewerZoomState = (state) => ({
	scale: state.scale,
	label: state.label,
	canZoomIn: state.canZoomIn,
	canZoomOut: state.canZoomOut,
	canReset: state.canReset,
	minScale: state.minScale,
	maxScale: state.maxScale
});
var applyFileViewerZoomState = (target, source) => {
	const normalized = createFileViewerZoomState(source || {});
	target.scale = normalized.scale;
	target.label = normalized.label;
	target.canZoomIn = normalized.canZoomIn;
	target.canZoomOut = normalized.canZoomOut;
	target.canReset = normalized.canReset;
	target.minScale = normalized.minScale;
	target.maxScale = normalized.maxScale;
	return target;
};
var createFileViewerZoomChangeState = (state) => {
	return cloneFileViewerZoomState(state);
};
var syncFileViewerZoomControllerState = (target, controller) => {
	return applyFileViewerZoomState(target, controller.state);
};
var refreshFileViewerZoomControllerProvider = (target, controller) => {
	const provider = controller.refreshProvider();
	syncFileViewerZoomControllerState(target, controller);
	return provider;
};
var observeFileViewerZoomController = (target, controller) => {
	controller.observe();
	return syncFileViewerZoomControllerState(target, controller);
};
var clearFileViewerZoomControllerProvider = (target, controller) => {
	controller.clearProvider();
	return syncFileViewerZoomControllerState(target, controller);
};
var destroyFileViewerZoomController = (target, controller) => {
	controller.destroy();
	return syncFileViewerZoomControllerState(target, controller);
};
var runFileViewerZoomControllerAction = async (target, action) => {
	applyFileViewerZoomState(target, await action());
	return createFileViewerZoomChangeState(target);
};
var createFileViewerZoomControllerActionHandlers = (target, controller) => {
	return {
		hasZoomProvider() {
			return !!refreshFileViewerZoomControllerProvider(target, controller);
		},
		refreshZoomProvider() {
			return refreshFileViewerZoomControllerProvider(target, controller);
		},
		startZoomObserver() {
			return observeFileViewerZoomController(target, controller);
		},
		stopZoomObserver() {
			return destroyFileViewerZoomController(target, controller);
		},
		clearZoomProvider() {
			return clearFileViewerZoomControllerProvider(target, controller);
		},
		getZoomState() {
			return createFileViewerZoomChangeState(target);
		},
		zoomIn() {
			return runFileViewerZoomControllerAction(target, () => controller.zoomIn());
		},
		zoomOut() {
			return runFileViewerZoomControllerAction(target, () => controller.zoomOut());
		},
		resetZoom() {
			return runFileViewerZoomControllerAction(target, () => controller.resetZoom());
		}
	};
};
var createFileViewerZoomChangeEmitter = () => {
	const listeners = /* @__PURE__ */ new Set();
	return {
		emit() {
			listeners.forEach((listener) => listener());
		},
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		clear() {
			listeners.clear();
		}
	};
};
var getMutationObserverConstructor = (root) => {
	var _a, _b;
	return ((_b = (_a = root === null || root === void 0 ? void 0 : root.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView) === null || _b === void 0 ? void 0 : _b.MutationObserver) || (typeof MutationObserver !== "undefined" ? MutationObserver : void 0);
};
var createFileViewerZoomController = ({ root, enabled, beforeZoom, onChange }) => {
	let provider = null;
	let unsubscribe = null;
	let observer = null;
	let runningAction = false;
	const state = createFileViewerZoomState();
	const notifyChange = () => {
		onChange === null || onChange === void 0 || onChange(cloneFileViewerZoomState(state));
	};
	const clearProvider = () => {
		unsubscribe === null || unsubscribe === void 0 || unsubscribe();
		unsubscribe = null;
		provider = null;
		applyFileViewerZoomState(state, null);
	};
	const syncProvider = () => {
		var _a, _b;
		if ((enabled === null || enabled === void 0 ? void 0 : enabled()) === false) {
			clearProvider();
			return null;
		}
		const nextProvider = findFileViewerZoomProvider(root());
		if (nextProvider !== provider) {
			unsubscribe === null || unsubscribe === void 0 || unsubscribe();
			provider = nextProvider;
			unsubscribe = ((_a = nextProvider === null || nextProvider === void 0 ? void 0 : nextProvider.subscribe) === null || _a === void 0 ? void 0 : _a.call(nextProvider, () => {
				applyFileViewerZoomState(state, nextProvider.getState());
				if (!runningAction) notifyChange();
			})) || null;
		}
		applyFileViewerZoomState(state, ((_b = nextProvider === null || nextProvider === void 0 ? void 0 : nextProvider.getState) === null || _b === void 0 ? void 0 : _b.call(nextProvider)) || null);
		return nextProvider;
	};
	const disconnectObserver = () => {
		observer === null || observer === void 0 || observer.disconnect();
		observer = null;
	};
	const runZoomAction = async (operation, action) => {
		const nextProvider = syncProvider();
		if (!nextProvider) return cloneFileViewerZoomState(state);
		if (beforeZoom && await beforeZoom(operation) === false) return cloneFileViewerZoomState(state);
		runningAction = true;
		try {
			const nextState = await action(nextProvider);
			applyFileViewerZoomState(state, nextState || nextProvider.getState());
			return cloneFileViewerZoomState(state);
		} finally {
			runningAction = false;
		}
	};
	return {
		get provider() {
			return provider;
		},
		state,
		hasProvider() {
			return !!syncProvider();
		},
		refreshProvider: syncProvider,
		observe() {
			disconnectObserver();
			const currentRoot = root();
			const MutationObserverCtor = getMutationObserverConstructor(currentRoot);
			if (!currentRoot || !MutationObserverCtor) {
				syncProvider();
				return;
			}
			observer = new MutationObserverCtor(() => {
				syncProvider();
			});
			observer.observe(currentRoot, {
				childList: true,
				subtree: true
			});
			syncProvider();
		},
		clearProvider,
		getState() {
			return cloneFileViewerZoomState(state);
		},
		zoomIn: () => runZoomAction("zoom-in", (nextProvider) => nextProvider.zoomIn()),
		zoomOut: () => runZoomAction("zoom-out", (nextProvider) => nextProvider.zoomOut()),
		resetZoom: () => runZoomAction("zoom-reset", (nextProvider) => nextProvider.resetZoom()),
		destroy() {
			disconnectObserver();
			clearProvider();
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/features/document/fit.js
var FILE_VIEWER_FIT_MODES = [
	"auto",
	"contain",
	"cover",
	"width",
	"height",
	"actual",
	"scale-down"
];
var FILE_VIEWER_FIT_RESIZE_MODES = [
	"until-interaction",
	"always",
	"initial"
];
var DEFAULT_FILE_VIEWER_FIT_RESIZE = "until-interaction";
var DEFAULT_FILE_VIEWER_FIT_PADDING = 0;
var MAX_FILE_VIEWER_FIT_RETRIES = 8;
var isRecord = (value) => {
	return !!value && typeof value === "object" && !Array.isArray(value);
};
var isFileViewerFitMode = (value) => {
	return typeof value === "string" && FILE_VIEWER_FIT_MODES.includes(value);
};
var isFileViewerFitResize = (value) => {
	return typeof value === "string" && FILE_VIEWER_FIT_RESIZE_MODES.includes(value);
};
var normalizePositiveNumber = (value) => {
	const nextValue = Number(value);
	return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : void 0;
};
var normalizePadding = (value) => {
	const nextValue = Number(value);
	return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : DEFAULT_FILE_VIEWER_FIT_PADDING;
};
var normalizeFileViewerFitOptions = (fit) => {
	if (fit === void 0 || fit === null || fit === false) return null;
	if (isFileViewerFitMode(fit)) return {
		mode: fit,
		resize: DEFAULT_FILE_VIEWER_FIT_RESIZE,
		padding: DEFAULT_FILE_VIEWER_FIT_PADDING
	};
	if (!isRecord(fit)) return null;
	const minScale = normalizePositiveNumber(fit.minScale);
	const rawMaxScale = normalizePositiveNumber(fit.maxScale);
	const maxScale = minScale !== void 0 && rawMaxScale !== void 0 && rawMaxScale < minScale ? minScale : rawMaxScale;
	return {
		mode: isFileViewerFitMode(fit.mode) ? fit.mode : "auto",
		resize: isFileViewerFitResize(fit.resize) ? fit.resize : DEFAULT_FILE_VIEWER_FIT_RESIZE,
		padding: normalizePadding(fit.padding),
		minScale,
		maxScale
	};
};
var clampScale = (scale, minScale, maxScale) => {
	let nextScale = scale;
	if (Number.isFinite(minScale)) nextScale = Math.max(Number(minScale), nextScale);
	if (Number.isFinite(maxScale)) nextScale = Math.min(Number(maxScale), nextScale);
	return nextScale;
};
var resolveFileViewerFitScale = ({ mode, viewportWidth, viewportHeight, contentWidth, contentHeight, minScale, maxScale }) => {
	if (viewportWidth <= 0 || viewportHeight <= 0 || contentWidth <= 0 || contentHeight <= 0) return;
	const widthScale = viewportWidth / contentWidth;
	const heightScale = viewportHeight / contentHeight;
	const containScale = Math.min(widthScale, heightScale);
	const coverScale = Math.max(widthScale, heightScale);
	const nextScale = (() => {
		switch (mode) {
			case "cover": return coverScale;
			case "width": return widthScale;
			case "height": return heightScale;
			case "actual": return 1;
			case "scale-down": return Math.min(1, containScale);
			default: return containScale;
		}
	})();
	if (!Number.isFinite(nextScale) || nextScale <= 0) return;
	return clampScale(nextScale, minScale, maxScale);
};
var hasFileViewerExplicitInitialViewState = (state) => {
	var _a, _b;
	if (!state) return false;
	const scale = Number((_a = state.scale) !== null && _a !== void 0 ? _a : (_b = state.zoom) === null || _b === void 0 ? void 0 : _b.scale);
	if (Number.isFinite(scale) && scale > 0) return true;
	if (Number.isFinite(state.page) || Number.isFinite(state.rotation)) return true;
	if (state.navigation && Object.keys(state.navigation).length > 0) return true;
	if (state.extra && Object.keys(state.extra).length > 0) return true;
	const scroll = state.scroll || {};
	return [
		"top",
		"left",
		"topRatio",
		"leftRatio"
	].some((key) => {
		const value = scroll[key];
		return Number.isFinite(value);
	});
};
var createNoopFitResult = (fit, reason, source = "viewer", provider = "none") => ({
	applied: false,
	mode: fit.mode,
	resize: fit.resize,
	source,
	reason,
	provider
});
var withProviderResult = (result, request, provider) => ({
	applied: !!(result === null || result === void 0 ? void 0 : result.applied),
	mode: (result === null || result === void 0 ? void 0 : result.mode) || request.mode,
	resize: (result === null || result === void 0 ? void 0 : result.resize) || request.resize,
	scale: result === null || result === void 0 ? void 0 : result.scale,
	source: (result === null || result === void 0 ? void 0 : result.source) || request.source,
	reason: result === null || result === void 0 ? void 0 : result.reason,
	provider: (result === null || result === void 0 ? void 0 : result.provider) || provider,
	state: result === null || result === void 0 ? void 0 : result.state
});
var isRetriableFitReason = (reason) => {
	return reason === "pending" || reason === "retry" || reason === "image-not-ready" || reason === "unmeasurable";
};
var readViewportSize = (root) => {
	var _a;
	const rect = (_a = root.getBoundingClientRect) === null || _a === void 0 ? void 0 : _a.call(root);
	return {
		width: Math.max(0, (rect === null || rect === void 0 ? void 0 : rect.width) || root.clientWidth || 0),
		height: Math.max(0, (rect === null || rect === void 0 ? void 0 : rect.height) || root.clientHeight || 0)
	};
};
var createFileViewerFitController = ({ root, enabled, getFit = () => void 0, onFit }) => {
	let resizeObserver = null;
	let resizeFrame = null;
	let retryTimer = null;
	let userInteracted = false;
	let retryCount = 0;
	const getWindow = () => {
		var _a;
		const currentRoot = root();
		return ((_a = currentRoot === null || currentRoot === void 0 ? void 0 : currentRoot.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView) || (typeof window !== "undefined" ? window : void 0);
	};
	const cancelFrame = () => {
		if (resizeFrame === null) return;
		const view = getWindow();
		if (view === null || view === void 0 ? void 0 : view.cancelAnimationFrame) view.cancelAnimationFrame(resizeFrame);
		resizeFrame = null;
	};
	const cancelRetry = () => {
		if (retryTimer) clearTimeout(retryTimer);
		retryTimer = null;
	};
	const resolveFit = (fit, reason) => {
		const configured = fit === void 0 ? getFit() : fit;
		if (configured !== void 0 && configured !== null) return normalizeFileViewerFitOptions(configured);
		return reason === "api" ? normalizeFileViewerFitOptions("auto") : null;
	};
	const scheduleRetry = (fit, source, reason) => {
		if (retryCount >= MAX_FILE_VIEWER_FIT_RETRIES) return;
		cancelRetry();
		retryCount += 1;
		retryTimer = setTimeout(() => {
			retryTimer = null;
			runFit(fit, {
				source,
				reason: reason === "api" ? "api" : "retry"
			});
		}, 32 * retryCount);
	};
	const runFit = async (fit, runOptions = {}) => {
		const source = runOptions.source || "api";
		const reason = runOptions.reason || "api";
		const normalized = resolveFit(fit, reason);
		if (!normalized) return {
			applied: false,
			mode: "auto",
			resize: DEFAULT_FILE_VIEWER_FIT_RESIZE,
			source,
			reason: "not-configured",
			provider: "none"
		};
		if ((enabled === null || enabled === void 0 ? void 0 : enabled()) === false) return createNoopFitResult(normalized, "disabled", source);
		const currentRoot = root();
		if (!currentRoot) {
			scheduleRetry(fit, source, reason);
			return createNoopFitResult(normalized, "no-root", source);
		}
		const viewport = readViewportSize(currentRoot);
		if (viewport.width <= 0 || viewport.height <= 0) {
			scheduleRetry(fit, source, reason);
			return createNoopFitResult(normalized, "zero-size", source);
		}
		const request = {
			...normalized,
			source,
			reason,
			viewportWidth: Math.max(0, viewport.width - normalized.padding * 2),
			viewportHeight: Math.max(0, viewport.height - normalized.padding * 2),
			container: currentRoot
		};
		const viewStateProvider = findFileViewerViewStateProvider(currentRoot);
		let lastProviderResult = null;
		if (viewStateProvider === null || viewStateProvider === void 0 ? void 0 : viewStateProvider.fit) {
			const result = withProviderResult(await viewStateProvider.fit(request), request, "view-state");
			if (result.applied) {
				retryCount = 0;
				onFit === null || onFit === void 0 || onFit(result);
				return result;
			}
			lastProviderResult = result;
		}
		const zoomProvider = findFileViewerZoomProvider(currentRoot);
		if (zoomProvider === null || zoomProvider === void 0 ? void 0 : zoomProvider.fit) {
			const result = withProviderResult(await zoomProvider.fit(request), request, "zoom");
			if (result.applied) {
				retryCount = 0;
				onFit === null || onFit === void 0 || onFit(result);
				return result;
			}
			lastProviderResult = result;
		}
		const noop = createNoopFitResult(normalized, viewStateProvider || zoomProvider ? "unsupported" : "no-provider", source);
		if (noop.reason === "no-provider" || isRetriableFitReason(lastProviderResult === null || lastProviderResult === void 0 ? void 0 : lastProviderResult.reason)) scheduleRetry(fit, source, reason);
		return noop;
	};
	const scheduleFit = (reason = "resize") => {
		const normalized = normalizeFileViewerFitOptions(getFit());
		if (!normalized || normalized.resize === "initial") return;
		if (normalized.resize === "until-interaction" && userInteracted) return;
		cancelFrame();
		const view = getWindow();
		const run = () => {
			resizeFrame = null;
			runFit(void 0, {
				source: "viewer",
				reason
			});
		};
		if (view === null || view === void 0 ? void 0 : view.requestAnimationFrame) {
			resizeFrame = view.requestAnimationFrame(run);
			return;
		}
		resizeFrame = setTimeout(run, 16);
	};
	const disconnectObserver = () => {
		cancelFrame();
		resizeObserver === null || resizeObserver === void 0 || resizeObserver.disconnect();
		resizeObserver = null;
	};
	return {
		normalize: normalizeFileViewerFitOptions,
		fit: async (fit, options) => {
			cancelRetry();
			userInteracted = false;
			return runFit(fit, {
				source: (options === null || options === void 0 ? void 0 : options.source) || "api",
				reason: (options === null || options === void 0 ? void 0 : options.reason) || "api"
			});
		},
		applyInitialFit: async (initialOptions = {}) => {
			cancelRetry();
			retryCount = 0;
			userInteracted = false;
			if (initialOptions.skip) return createNoopFitResult(normalizeFileViewerFitOptions(getFit()) || normalizeFileViewerFitOptions("auto"), "initial-view-state", "initial");
			return runFit(void 0, {
				source: "initial",
				reason: "initial"
			});
		},
		scheduleFit,
		observe() {
			var _a, _b;
			disconnectObserver();
			const currentRoot = root();
			const ResizeObserverCtor = ((_b = (_a = currentRoot === null || currentRoot === void 0 ? void 0 : currentRoot.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView) === null || _b === void 0 ? void 0 : _b.ResizeObserver) || (typeof ResizeObserver !== "undefined" ? ResizeObserver : void 0);
			if (!currentRoot || !ResizeObserverCtor) return;
			resizeObserver = new ResizeObserverCtor(() => scheduleFit("resize"));
			resizeObserver.observe(currentRoot);
		},
		markUserInteraction() {
			userInteracted = true;
			cancelRetry();
		},
		resetAutoFit() {
			userInteracted = false;
			retryCount = 0;
		},
		destroy() {
			disconnectObserver();
			cancelRetry();
			retryCount = 0;
		}
	};
};
//#endregion
export { createEmptyFileViewerSearchState as C, buildFileViewerDocumentTextChunks as S, normalizeFileViewerSearchOptions as T, unregisterFileViewerZoomProvider as _, applyFileViewerZoomState as a, getCurrentFileViewerDocumentAnchor as b, createFileViewerZoomControllerActionHandlers as c, findFileViewerZoomProvider as d, registerFileViewerSearchProvider as f, unregisterFileViewerViewStateProvider as g, unregisterFileViewerSearchProvider as h, resolveFileViewerFitScale as i, findFileViewerSearchProvider as l, registerFileViewerZoomProvider as m, hasFileViewerExplicitInitialViewState as n, createFileViewerZoomChangeEmitter as o, registerFileViewerViewStateProvider as p, normalizeFileViewerFitOptions as r, createFileViewerZoomController as s, createFileViewerFitController as t, findFileViewerViewStateProvider as u, collectFileViewerDocumentAnchors as v, createFileViewerZoomState as w, scrollToFileViewerDocumentAnchor as x, findFileViewerAnchorForElement as y };
