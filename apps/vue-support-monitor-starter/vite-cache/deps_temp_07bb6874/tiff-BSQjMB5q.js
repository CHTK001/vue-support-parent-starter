import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { $ as createFileViewerViewStateChangeEmitter, Q as createFileViewerViewStateChange } from "./dist-B6GcL3C6.js";
import { _ as unregisterFileViewerZoomProvider, g as unregisterFileViewerViewStateProvider, i as resolveFileViewerFitScale, m as registerFileViewerZoomProvider, o as createFileViewerZoomChangeEmitter, p as registerFileViewerViewStateProvider } from "./fit-BmeG0j2O.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-image@3.1.2/node_modules/@file-viewer/renderer-image/dist/tiff.js
var MAX_TIFF_SOURCE_BYTES = 33554432;
var MAX_TIFF_PAGES = 64;
var MAX_TIFF_DIMENSION = 16384;
var MAX_TIFF_PAGE_PIXELS = 32e6;
var MAX_TIFF_TOTAL_PIXELS = 128e6;
var PAGE_GAP = 24;
var tiffStyle = `
.image-viewer.tiff-viewer{position:relative;width:100%;height:100%;overflow:auto;background:var(--file-viewer-render-surface-background,#eef1f4);box-sizing:border-box}
.tiff-toolbar{position:sticky;top:12px;z-index:5;display:flex;align-items:center;gap:6px;width:max-content;height:42px;margin:12px 12px -54px auto;padding:5px 7px;border:1px solid rgba(148,163,184,.34);border-radius:10px;background:rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(15,23,42,.14);backdrop-filter:blur(12px);box-sizing:border-box}
.tiff-toolbar button{display:grid;width:30px;height:30px;place-items:center;padding:0;border:1px solid transparent;border-radius:7px;background:transparent;color:#334155;font:600 19px/1 system-ui,sans-serif;cursor:pointer;box-sizing:border-box}
.tiff-toolbar button:hover{border-color:#bfd2ea;background:#edf5ff;color:#1769d8}
.tiff-toolbar button:focus-visible{outline:3px solid #60a5fa;outline-offset:1px}
.tiff-page-meter,.tiff-rotation-meter{min-width:38px;color:#64748b;font:700 12px/1 system-ui,sans-serif;text-align:center}
.tiff-page-meter{min-width:52px;padding-right:6px;border-right:1px solid rgba(148,163,184,.35)}
.tiff-stage{min-width:100%;display:flex;flex-direction:column;align-items:center;gap:${PAGE_GAP}px;padding:70px 24px 24px;box-sizing:border-box}
.tiff-frame{position:relative;flex:0 0 auto;background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.16)}
.tiff-frame img{position:absolute;top:50%;left:50%;display:block;width:auto;max-width:none;margin:0;border:0;background:#fff;cursor:zoom-in;transform:translate(-50%,-50%) rotate(var(--image-rotation,0deg));transform-origin:center center;transition:transform .18s ease}
.tiff-frame img:focus-visible{outline:3px solid #2563eb;outline-offset:4px}
.tiff-lightbox{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:40px;background:rgba(15,23,42,.9);box-sizing:border-box;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility 0s linear .18s}
.tiff-lightbox[data-open='true']{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}
.tiff-lightbox img{display:block;max-width:100%;max-height:100%;object-fit:contain;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.4);transform:rotate(var(--image-rotation,0deg)) scale(.985);transition:transform .18s ease}
.tiff-lightbox[data-open='true'] img{transform:rotate(var(--image-rotation,0deg)) scale(1)}
.tiff-lightbox button{position:absolute;top:16px;right:16px;display:grid;width:40px;height:40px;place-items:center;padding:0;border:1px solid rgba(255,255,255,.7);border-radius:999px;background:rgba(255,255,255,.96);color:#172033;font:400 27px/1 Arial,sans-serif;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,.24)}
.tiff-lightbox button:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}
[data-viewer-theme='dark'] .tiff-viewer{background:var(--file-viewer-render-surface-background,#101820)}
[data-viewer-theme='dark'] .tiff-toolbar{border-color:rgba(148,163,184,.28);background:rgba(17,24,39,.88)}
[data-viewer-theme='dark'] .tiff-toolbar button{color:#dbe5f2}
[data-viewer-theme='dark'] .tiff-page-meter,[data-viewer-theme='dark'] .tiff-rotation-meter{color:#b7c5d7}
@media (max-width:767px){.tiff-toolbar{top:8px;margin:8px 8px -50px auto}.tiff-stage{padding:62px 12px 12px;gap:12px}.tiff-lightbox{padding:16px}.tiff-lightbox button{top:12px;right:12px}}
@media (prefers-reduced-motion:reduce){.tiff-frame img,.tiff-lightbox,.tiff-lightbox img{transition:none}}
`;
var normalizeRotation = (rotation) => (Math.round(rotation / 90) * 90 % 360 + 360) % 360;
var getDimension = (ifd, tag, fallback) => {
	const tagged = ifd[tag];
	const value = Array.isArray(tagged) ? tagged[0] : tagged;
	const resolved = Number(value !== null && value !== void 0 ? value : ifd[fallback]);
	return Number.isFinite(resolved) ? resolved : 0;
};
var assertPageDimensions = (width, height, pageNumber) => {
	if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || width > MAX_TIFF_DIMENSION || height > MAX_TIFF_DIMENSION || width * height > MAX_TIFF_PAGE_PIXELS) throw new Error(`TIFF page ${pageNumber} exceeds the image safety limit.`);
};
var validateTiffPageSafety = (ifds) => {
	if (!ifds.length) throw new Error("TIFF does not contain a decodable page.");
	if (ifds.length > MAX_TIFF_PAGES) throw new Error(`TIFF contains more than ${MAX_TIFF_PAGES} pages.`);
	let totalPixels = 0;
	for (let index = 0; index < ifds.length; index += 1) {
		const width = getDimension(ifds[index], "t256", "width");
		const height = getDimension(ifds[index], "t257", "height");
		assertPageDimensions(width, height, index + 1);
		totalPixels += width * height;
		if (totalPixels > MAX_TIFF_TOTAL_PIXELS) throw new Error("TIFF cumulative decoded pixels exceed the image safety limit.");
	}
	return ifds.length;
};
var canvasToPng = async (documentRef, rgba, width, height) => {
	const canvas = documentRef.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D is unavailable for TIFF conversion.");
	const imageData = context.createImageData(width, height);
	imageData.data.set(rgba);
	context.putImageData(imageData, 0, 0);
	const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
	canvas.width = 1;
	canvas.height = 1;
	if (!blob) throw new Error("Unable to encode the TIFF page as PNG.");
	return blob;
};
var waitForImage = async (image) => {
	if (image.complete && image.naturalWidth > 0) return;
	await new Promise((resolve, reject) => {
		image.addEventListener("load", () => resolve(), { once: true });
		image.addEventListener("error", () => reject(/* @__PURE__ */ new Error("Unable to display the decoded TIFF page.")), { once: true });
	});
};
var nextPaint = async (windowRef) => {
	if (!(windowRef === null || windowRef === void 0 ? void 0 : windowRef.requestAnimationFrame)) return;
	await new Promise((resolve) => windowRef.requestAnimationFrame(() => resolve()));
};
var createLightbox = (documentRef, t) => {
	const element = documentRef.createElement("div");
	element.className = "tiff-lightbox";
	element.dataset.open = "false";
	element.setAttribute("role", "dialog");
	element.setAttribute("aria-modal", "true");
	element.setAttribute("aria-hidden", "true");
	const image = documentRef.createElement("img");
	image.alt = t("image.lightbox.alt");
	const closeButton = documentRef.createElement("button");
	closeButton.type = "button";
	closeButton.setAttribute("aria-label", t("image.lightbox.close"));
	closeButton.textContent = "×";
	let previousFocus = null;
	const close = () => {
		if (element.dataset.open !== "true") return;
		element.dataset.open = "false";
		element.setAttribute("aria-hidden", "true");
		previousFocus === null || previousFocus === void 0 || previousFocus.focus({ preventScroll: true });
		previousFocus = null;
	};
	const onKeyDown = (event) => {
		if (event.key === "Escape") {
			event.preventDefault();
			close();
		}
	};
	closeButton.addEventListener("click", close);
	element.addEventListener("click", (event) => {
		if (event.target === element) close();
	});
	documentRef.addEventListener("keydown", onKeyDown);
	element.append(image, closeButton);
	return {
		element,
		open(page, rotation) {
			previousFocus = page.image;
			image.src = page.objectUrl;
			image.style.setProperty("--image-rotation", `${normalizeRotation(rotation)}deg`);
			element.dataset.open = "true";
			element.setAttribute("aria-hidden", "false");
			closeButton.focus({ preventScroll: true });
		},
		setRotation(rotation) {
			image.style.setProperty("--image-rotation", `${normalizeRotation(rotation)}deg`);
		},
		destroy() {
			closeButton.removeEventListener("click", close);
			documentRef.removeEventListener("keydown", onKeyDown);
			element.remove();
		}
	};
};
var assertTiffSourceSafety = (buffer) => {
	if (buffer.byteLength <= 0 || buffer.byteLength > MAX_TIFF_SOURCE_BYTES) throw new Error("TIFF source exceeds the image safety limit.");
};
async function renderTiff(buffer, target, context) {
	assertTiffSourceSafety(buffer);
	const imported = await import("./UTIF-MmHp7JBK.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
	return renderTiffWithDecoder(buffer, target, imported.default || imported, context);
}
async function renderTiffWithDecoder(buffer, target, utif, context) {
	var _a, _b, _c, _d;
	assertTiffSourceSafety(buffer);
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const rotationEnabled = ((_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.image) === null || _b === void 0 ? void 0 : _b.rotation) !== false;
	const documentRef = target.ownerDocument || document;
	const windowRef = documentRef.defaultView;
	const urlApi = (windowRef === null || windowRef === void 0 ? void 0 : windowRef.URL) || URL;
	const ifds = utif.decode(buffer);
	const pageCount = validateTiffPageSafety(ifds);
	let destroyed = false;
	let currentRotation = 0;
	let fitScale = 1;
	let userZoom = 1;
	let currentScale = 1;
	let currentPage = 1;
	let scrollFrame = 0;
	const pages = [];
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const viewStateEmitter = createFileViewerViewStateChangeEmitter();
	const style = documentRef.createElement("style");
	style.textContent = tiffStyle;
	const root = documentRef.createElement("div");
	root.className = "image-viewer tiff-viewer";
	root.dataset.viewerZoomProvider = "image";
	root.dataset.tiffPageCount = String(pageCount);
	const toolbar = documentRef.createElement("div");
	toolbar.className = "tiff-toolbar";
	toolbar.setAttribute("role", "toolbar");
	toolbar.setAttribute("aria-label", t("image.toolbar.rotation"));
	const pageMeter = documentRef.createElement("span");
	pageMeter.className = "tiff-page-meter";
	pageMeter.setAttribute("aria-live", "polite");
	pageMeter.textContent = `1 / ${pageCount}`;
	const createButton = (label, icon) => {
		const button = documentRef.createElement("button");
		button.type = "button";
		button.title = label;
		button.setAttribute("aria-label", label);
		button.textContent = icon;
		return button;
	};
	const rotateLeftButton = createButton(t("image.toolbar.rotateLeft"), "↺");
	const rotationMeter = documentRef.createElement("span");
	rotationMeter.className = "tiff-rotation-meter";
	rotationMeter.textContent = "0°";
	const rotateRightButton = createButton(t("image.toolbar.rotateRight"), "↻");
	toolbar.append(pageMeter);
	if (rotationEnabled) toolbar.append(rotateLeftButton, rotationMeter, rotateRightButton);
	else {
		toolbar.removeAttribute("role");
		toolbar.removeAttribute("aria-label");
		pageMeter.style.borderRight = "none";
		pageMeter.style.paddingRight = "0";
	}
	const stage = documentRef.createElement("div");
	stage.className = "tiff-stage";
	root.append(toolbar, stage);
	const lightbox = createLightbox(documentRef, t);
	target.replaceChildren(style, root);
	(((_c = context === null || context === void 0 ? void 0 : context.surface) === null || _c === void 0 ? void 0 : _c.shadowRoot) || target).append(lightbox.element);
	const pageExtents = () => pages.map((page) => currentRotation % 180 === 0 ? {
		width: page.width,
		height: page.height
	} : {
		width: page.height,
		height: page.width
	});
	const contentSize = () => {
		const extents = pageExtents();
		return {
			width: Math.max(1, ...extents.map((item) => item.width)),
			height: Math.max(1, extents.reduce((sum, item) => sum + item.height, 0) + PAGE_GAP * Math.max(0, extents.length - 1))
		};
	};
	const getMinScale = () => Math.min(.1, fitScale || .1);
	const clampScale = (value) => Math.min(5, Math.max(getMinScale(), Number(value.toFixed(3))));
	const computeFitScale = () => {
		const size = contentSize();
		return Math.min(1, Math.max(1, root.clientWidth - 48) / size.width);
	};
	const applyLayout = () => {
		fitScale = computeFitScale();
		currentScale = clampScale(fitScale * userZoom);
		pages.forEach((page) => {
			const swapsAxes = currentRotation % 180 !== 0;
			const imageWidth = Math.max(1, Math.round(page.width * currentScale));
			const imageHeight = Math.max(1, Math.round(page.height * currentScale));
			page.image.style.width = `${imageWidth}px`;
			page.image.style.height = `${imageHeight}px`;
			page.image.style.setProperty("--image-rotation", `${currentRotation}deg`);
			page.frame.style.width = `${swapsAxes ? imageHeight : imageWidth}px`;
			page.frame.style.height = `${swapsAxes ? imageWidth : imageHeight}px`;
		});
	};
	const getZoomState = () => ({
		scale: currentScale,
		label: `${Math.round(currentScale * 100)}%`,
		canZoomIn: currentScale < 5,
		canZoomOut: currentScale > getMinScale(),
		canReset: Math.abs(userZoom - 1) > .001,
		minScale: getMinScale(),
		maxScale: 5
	});
	const readScrollState = () => {
		const maxTop = Math.max(0, root.scrollHeight - root.clientHeight);
		const maxLeft = Math.max(0, root.scrollWidth - root.clientWidth);
		return {
			top: root.scrollTop,
			left: root.scrollLeft,
			width: root.scrollWidth,
			height: root.scrollHeight,
			clientWidth: root.clientWidth,
			clientHeight: root.clientHeight,
			topRatio: maxTop ? root.scrollTop / maxTop : 0,
			leftRatio: maxLeft ? root.scrollLeft / maxLeft : 0
		};
	};
	const getViewState = () => ({
		renderer: "image",
		page: currentPage,
		scale: currentScale,
		zoom: getZoomState(),
		rotation: currentRotation,
		scroll: readScrollState()
	});
	const emitViewState = (action, source = "viewer") => {
		const state = getViewState();
		if (!destroyed) viewStateEmitter.emit(createFileViewerViewStateChange(state, {
			action,
			source
		}));
		return state;
	};
	const setZoom = (scale, action = "zoom-change", source = "api", notify = true) => {
		userZoom = clampScale(scale) / Math.max(fitScale, .001);
		applyLayout();
		zoomEmitter.emit();
		if (notify) emitViewState(action, source);
		return getZoomState();
	};
	const applyRotation = (rotation, action, source, notify = true) => {
		if (!rotationEnabled) return getViewState();
		currentRotation = normalizeRotation(rotation);
		rotationMeter.textContent = `${currentRotation}°`;
		lightbox.setRotation(currentRotation);
		applyLayout();
		zoomEmitter.emit();
		return notify ? emitViewState(action, source) : getViewState();
	};
	const fit = (request) => {
		var _a, _b;
		if (!pages.length) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "image-not-ready",
			provider: "zoom"
		};
		const size = contentSize();
		const mode = request.mode === "auto" ? "width" : request.mode;
		const scale = resolveFileViewerFitScale({
			mode,
			viewportWidth: Math.max(1, request.viewportWidth || root.clientWidth),
			viewportHeight: Math.max(1, request.viewportHeight || root.clientHeight),
			contentWidth: size.width,
			contentHeight: size.height,
			currentScale,
			minScale: (_a = request.minScale) !== null && _a !== void 0 ? _a : getMinScale(),
			maxScale: (_b = request.maxScale) !== null && _b !== void 0 ? _b : 5
		});
		if (!scale) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "unmeasurable",
			provider: "zoom"
		};
		setZoom(scale, "fit", request.source);
		return {
			applied: true,
			mode: request.mode,
			resize: request.resize,
			scale: currentScale,
			source: request.source,
			provider: "zoom"
		};
	};
	const updateCurrentPage = () => {
		if (!pages.length) return;
		const viewportCenter = root.getBoundingClientRect().top + root.clientHeight / 2;
		let bestIndex = 0;
		let bestDistance = Number.POSITIVE_INFINITY;
		pages.forEach((page, index) => {
			const rect = page.frame.getBoundingClientRect();
			const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
			if (distance < bestDistance) {
				bestDistance = distance;
				bestIndex = index;
			}
		});
		const nextPage = bestIndex + 1;
		if (nextPage !== currentPage) {
			currentPage = nextPage;
			pageMeter.textContent = `${currentPage} / ${pageCount}`;
		}
	};
	const onScroll = () => {
		if (scrollFrame || destroyed) return;
		scrollFrame = (windowRef === null || windowRef === void 0 ? void 0 : windowRef.requestAnimationFrame(() => {
			scrollFrame = 0;
			updateCurrentPage();
			emitViewState("scroll", "viewer");
		})) || 0;
	};
	const resizeObserver = new ResizeObserver(() => {
		applyLayout();
		updateCurrentPage();
		zoomEmitter.emit();
	});
	resizeObserver.observe(root);
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(currentScale + .15, "zoom-in", "api"),
		zoomOut: () => setZoom(currentScale - .15, "zoom-out", "api"),
		resetZoom: () => {
			userZoom = 1;
			applyLayout();
			zoomEmitter.emit();
			emitViewState("zoom-reset", "api");
			return getZoomState();
		},
		setZoom,
		fit,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	registerFileViewerViewStateProvider(root, {
		getState: getViewState,
		fit,
		subscribe: viewStateEmitter.subscribe,
		async applyState(state, options = {}) {
			var _a, _b, _c;
			const source = options.source || "api";
			if (Number.isFinite(Number(state.rotation))) applyRotation(Number(state.rotation), "rotation-change", source, false);
			const scale = Number((_a = state.scale) !== null && _a !== void 0 ? _a : (_b = state.zoom) === null || _b === void 0 ? void 0 : _b.scale);
			if (Number.isFinite(scale)) setZoom(scale, "zoom-change", source, false);
			const page = Math.min(pages.length, Math.max(1, Math.round(Number(state.page) || 1)));
			(_c = pages[page - 1]) === null || _c === void 0 || _c.frame.scrollIntoView({
				block: "center",
				inline: "center"
			});
			currentPage = page;
			pageMeter.textContent = `${currentPage} / ${pageCount}`;
			return options.notify === false ? getViewState() : emitViewState(options.action || "restore", source);
		}
	});
	const rotateLeft = () => applyRotation(currentRotation - 90, "rotate-left", "user");
	const rotateRight = () => applyRotation(currentRotation + 90, "rotate-right", "user");
	rotateLeftButton.addEventListener("click", rotateLeft);
	rotateRightButton.addEventListener("click", rotateRight);
	root.addEventListener("scroll", onScroll, { passive: true });
	const cleanup = () => {
		var _a;
		if (destroyed) return;
		destroyed = true;
		(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, null);
		unregisterFileViewerViewStateProvider(root);
		unregisterFileViewerZoomProvider(root);
		resizeObserver.disconnect();
		if (scrollFrame && (windowRef === null || windowRef === void 0 ? void 0 : windowRef.cancelAnimationFrame)) windowRef.cancelAnimationFrame(scrollFrame);
		root.removeEventListener("scroll", onScroll);
		rotateLeftButton.removeEventListener("click", rotateLeft);
		rotateRightButton.removeEventListener("click", rotateRight);
		lightbox.destroy();
		pages.forEach((page) => urlApi.revokeObjectURL(page.objectUrl));
		pages.length = 0;
		target.replaceChildren();
	};
	try {
		for (let index = 0; index < pageCount; index += 1) {
			const ifd = ifds[index];
			utif.decodeImage(buffer, ifd);
			const width = getDimension(ifd, "t256", "width");
			const height = getDimension(ifd, "t257", "height");
			assertPageDimensions(width, height, index + 1);
			let rgba = utif.toRGBA8(ifd);
			if (rgba.byteLength !== width * height * 4) throw new Error(`TIFF page ${index + 1} returned an unexpected pixel buffer.`);
			const blob = await canvasToPng(documentRef, rgba, width, height);
			rgba = null;
			for (const key of [
				"data",
				"rgba",
				"pixels"
			]) if (key in ifd) delete ifd[key];
			const objectUrl = urlApi.createObjectURL(blob);
			const frame = documentRef.createElement("div");
			frame.className = "tiff-frame";
			frame.dataset.pageNumber = String(index + 1);
			const image = documentRef.createElement("img");
			image.src = objectUrl;
			image.alt = `${t("image.alt")} ${index + 1}`;
			image.tabIndex = 0;
			image.setAttribute("role", "button");
			image.setAttribute("aria-haspopup", "dialog");
			frame.append(image);
			stage.append(frame);
			const page = {
				blob,
				frame,
				image,
				objectUrl,
				width,
				height
			};
			pages.push(page);
			const open = () => lightbox.open(page, currentRotation);
			image.addEventListener("dblclick", open);
			image.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					open();
				}
			});
			await waitForImage(image);
			if (index === 0) (_d = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _d === void 0 || _d.call(context, {
				capture: () => page.blob,
				getTarget: () => page.image
			});
			applyLayout();
			await nextPaint(windowRef);
		}
		ifds.length = 0;
		updateCurrentPage();
		windowRef === null || windowRef === void 0 || windowRef.requestAnimationFrame(() => emitViewState("init", "viewer"));
	} catch (error) {
		cleanup();
		throw error;
	}
	return {
		$el: target,
		unmount: cleanup
	};
}
//#endregion
export { renderTiff };
