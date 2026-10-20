const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/heic2any-C8XGHDl7.js","assets/rolldown-runtime-CEgmsyvS.js","assets/UTIF-YZFDUUoe.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/file-viewer-drawing-DeKTjxNF.js"])))=>i.map(i=>d[i]);
import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { Bo as createFileViewerViewStateChangeEmitter, Hs as unregisterFileViewerZoomProvider, Rs as registerFileViewerViewStateProvider, Vs as unregisterFileViewerViewStateProvider, Zo as resolveFileViewerFitScale, ho as createFileViewerTranslator, ts as createFileViewerZoomChangeEmitter, ud as __vitePreload, wc as DEFAULT_RENDERER_DEFINITIONS, zo as createFileViewerViewStateChange, zs as registerFileViewerZoomProvider } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-image@3.1.2/node_modules/@file-viewer/renderer-image/dist/image.js
var imageMimeMap = {
	avif: "image/avif",
	bmp: "image/bmp",
	gif: "image/gif",
	heic: "image/heic",
	heif: "image/heif",
	ico: "image/x-icon",
	jxl: "image/jxl",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	svg: "image/svg+xml",
	tif: "image/tiff",
	tiff: "image/tiff",
	webp: "image/webp"
};
var imageStyle = `
.image-viewer{position:relative;width:100%;height:100%;overflow:auto;background:var(--file-viewer-render-surface-background,#eef1f4);box-sizing:border-box}
.image-toolbar{position:sticky;top:12px;z-index:5;display:flex;align-items:center;gap:6px;width:max-content;height:42px;margin:12px 12px -54px auto;padding:5px 7px;border:1px solid rgba(148,163,184,.34);border-radius:10px;background:rgba(255,255,255,.92);box-shadow:0 10px 28px rgba(15,23,42,.14);backdrop-filter:blur(12px);box-sizing:border-box}
.image-toolbar button{display:grid;width:30px;height:30px;place-items:center;padding:0;border:1px solid transparent;border-radius:7px;background:transparent;color:#334155;font:600 19px/1 system-ui,sans-serif;cursor:pointer;box-sizing:border-box}
.image-toolbar button:hover{border-color:#bfd2ea;background:#edf5ff;color:#1769d8}
.image-toolbar button:focus-visible{outline:3px solid #60a5fa;outline-offset:1px}
.image-rotation-meter{min-width:38px;color:#64748b;font:700 12px/1 system-ui,sans-serif;text-align:center}
.image-stage{min-width:100%;min-height:100%;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
.image-frame{position:relative;flex:0 0 auto}
.image-stage img{position:absolute;top:50%;left:50%;display:block;width:auto;max-width:none;margin:0;border:0;box-shadow:0 18px 48px rgba(15,23,42,.16);background:#fff;cursor:zoom-in;transform:translate(-50%,-50%) rotate(var(--image-rotation,0deg));transform-origin:center center;transition:transform .18s ease}
.image-stage img:focus-visible{outline:3px solid #2563eb;outline-offset:4px}
.image-lightbox{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:40px;background:rgba(15,23,42,.9);box-sizing:border-box;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility 0s linear .18s}
.image-lightbox[data-open='true']{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}
.image-lightbox img{display:block;max-width:100%;max-height:100%;object-fit:contain;background:#fff;box-shadow:0 30px 80px rgba(0,0,0,.4);cursor:default;transform:rotate(var(--image-rotation,0deg)) scale(.985);transition:transform .18s ease}
.image-lightbox[data-open='true'] img{transform:rotate(var(--image-rotation,0deg)) scale(1)}
.image-lightbox button{position:absolute;top:16px;right:16px;display:grid;width:40px;height:40px;place-items:center;padding:0;border:1px solid rgba(255,255,255,.7);border-radius:999px;background:rgba(255,255,255,.96);color:#172033;font:400 27px/1 Arial,sans-serif;cursor:pointer;box-shadow:0 12px 28px rgba(0,0,0,.24);transition:background-color .14s ease,transform .14s ease}
.image-lightbox button:hover{background:#fff;transform:scale(1.04)}
.image-lightbox button:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}
[data-viewer-theme='dark'] .image-viewer{background:var(--file-viewer-render-surface-background,#101820)}
[data-viewer-theme='dark'] .image-toolbar{border-color:rgba(148,163,184,.28);background:rgba(17,24,39,.88)}
[data-viewer-theme='dark'] .image-toolbar button{color:#dbe5f2}
[data-viewer-theme='dark'] .image-rotation-meter{color:#b7c5d7}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .image-viewer{background:var(--file-viewer-render-surface-background,#101820)}}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .image-toolbar{border-color:rgba(148,163,184,.28);background:rgba(17,24,39,.88)}[data-viewer-theme='system'] .image-toolbar button{color:#dbe5f2}[data-viewer-theme='system'] .image-rotation-meter{color:#b7c5d7}}
@media (max-width:767px){.image-toolbar{top:8px;margin:8px 8px -50px auto}.image-stage{padding:12px}.image-lightbox{padding:16px}.image-lightbox button{top:12px;right:12px}}
@media (prefers-reduced-motion:reduce){.image-stage img,.image-lightbox,.image-lightbox img,.image-lightbox button{transition:none}}
`;
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = imageStyle;
	return style;
};
var getImageBlobType = (type) => {
	return imageMimeMap[(type || "").trim().toLowerCase()] || "image/*";
};
var readBlobDataUrl = async (blob) => {
	return await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (event) => {
			var _a;
			const result = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
			if (typeof result === "string") {
				resolve(result);
				return;
			}
			reject(/* @__PURE__ */ new Error("Unable to read image data URL."));
		};
		reader.onerror = () => reject(reader.error || /* @__PURE__ */ new Error("Unable to read image data URL."));
		reader.readAsDataURL(blob);
	});
};
var renderHeic = async (buffer, type) => {
	const { default: heic2any } = await __vitePreload(async () => {
		const { default: heic2any } = await import("./heic2any-C8XGHDl7.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1));
		return { default: heic2any };
	}, __vite__mapDeps([0,1]));
	const result = await heic2any({
		blob: new Blob([buffer], { type: getImageBlobType(type) }),
		toType: "image/png"
	});
	return readBlobDataUrl(Array.isArray(result) ? result[0] : result);
};
var resolveImageUrl = async (buffer, type) => {
	const normalizedType = (type || "").trim().toLowerCase();
	if (normalizedType === "heic" || normalizedType === "heif") return renderHeic(buffer, normalizedType);
	return readBlobDataUrl(new Blob([buffer], { type: getImageBlobType(normalizedType) }));
};
var hasTiffSignature = (buffer) => {
	if (buffer.byteLength < 4) return false;
	const bytes = new Uint8Array(buffer, 0, 4);
	return bytes[0] === 73 && bytes[1] === 73 && bytes[2] === 42 && bytes[3] === 0 || bytes[0] === 77 && bytes[1] === 77 && bytes[2] === 0 && bytes[3] === 42;
};
var waitForImageReady = async (image) => {
	if (image.complete) {
		if (image.naturalWidth > 0 && image.naturalHeight > 0) return;
		throw new Error("The browser could not decode this image format.");
	}
	await new Promise((resolve, reject) => {
		const cleanup = () => {
			image.removeEventListener("load", onLoad);
			image.removeEventListener("error", onError);
		};
		const onLoad = () => {
			cleanup();
			resolve();
		};
		const onError = () => {
			cleanup();
			reject(/* @__PURE__ */ new Error("The browser could not decode this image format."));
		};
		image.addEventListener("load", onLoad, { once: true });
		image.addEventListener("error", onError, { once: true });
	});
};
var roundImageScale = (value) => {
	return Number(value.toFixed(3));
};
var normalizeImageRotation = (rotation) => {
	return (Math.round(rotation / 90) * 90 % 360 + 360) % 360;
};
var resolveRotatedImageSize = (naturalWidth, naturalHeight, scale, rotation) => {
	const width = Math.max(1, Math.round(naturalWidth * scale));
	const height = Math.max(1, Math.round(naturalHeight * scale));
	const swapsAxes = normalizeImageRotation(rotation) % 180 !== 0;
	return {
		imageWidth: width,
		imageHeight: height,
		frameWidth: swapsAxes ? height : width,
		frameHeight: swapsAxes ? width : height
	};
};
var createLightbox$1 = (documentRef, src, t) => {
	const lightbox = documentRef.createElement("div");
	lightbox.className = "image-lightbox";
	lightbox.dataset.open = "false";
	lightbox.setAttribute("role", "dialog");
	lightbox.setAttribute("aria-modal", "true");
	lightbox.setAttribute("aria-hidden", "true");
	const image = documentRef.createElement("img");
	image.alt = t("image.lightbox.alt");
	image.src = src;
	const ownerWindow = documentRef.defaultView;
	let rotation = 0;
	const syncImageSize = () => {
		if (!image.naturalWidth || !image.naturalHeight) return;
		const style = ownerWindow === null || ownerWindow === void 0 ? void 0 : ownerWindow.getComputedStyle(lightbox);
		const horizontalPadding = Number.parseFloat((style === null || style === void 0 ? void 0 : style.paddingLeft) || "0") + Number.parseFloat((style === null || style === void 0 ? void 0 : style.paddingRight) || "0");
		const verticalPadding = Number.parseFloat((style === null || style === void 0 ? void 0 : style.paddingTop) || "0") + Number.parseFloat((style === null || style === void 0 ? void 0 : style.paddingBottom) || "0");
		const availableWidth = Math.max(1, lightbox.clientWidth - horizontalPadding);
		const availableHeight = Math.max(1, lightbox.clientHeight - verticalPadding);
		const swapsAxes = rotation % 180 !== 0;
		const visualWidth = swapsAxes ? image.naturalHeight : image.naturalWidth;
		const visualHeight = swapsAxes ? image.naturalWidth : image.naturalHeight;
		const scale = Math.min(1, availableWidth / visualWidth, availableHeight / visualHeight);
		image.style.width = `${Math.max(1, Math.round(image.naturalWidth * scale))}px`;
		image.style.height = `${Math.max(1, Math.round(image.naturalHeight * scale))}px`;
	};
	image.addEventListener("load", syncImageSize);
	ownerWindow === null || ownerWindow === void 0 || ownerWindow.addEventListener("resize", syncImageSize);
	const closeButton = documentRef.createElement("button");
	closeButton.type = "button";
	closeButton.setAttribute("aria-label", t("image.lightbox.close"));
	closeButton.textContent = "×";
	let previousFocus = null;
	const close = () => {
		if (lightbox.dataset.open !== "true") return;
		lightbox.dataset.open = "false";
		lightbox.setAttribute("aria-hidden", "true");
		if (previousFocus === null || previousFocus === void 0 ? void 0 : previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
		previousFocus = null;
	};
	const onKeyDown = (event) => {
		if (event.key === "Escape" && lightbox.dataset.open === "true") {
			event.preventDefault();
			close();
		}
	};
	closeButton.addEventListener("click", close);
	lightbox.addEventListener("click", (event) => {
		if (event.target === lightbox) close();
	});
	documentRef.addEventListener("keydown", onKeyDown);
	lightbox.append(image, closeButton);
	return {
		element: lightbox,
		setRotation(nextRotation) {
			rotation = normalizeImageRotation(nextRotation);
			lightbox.style.setProperty("--image-rotation", `${rotation}deg`);
			syncImageSize();
		},
		open(invoker) {
			previousFocus = invoker || (documentRef.activeElement instanceof HTMLElement ? documentRef.activeElement : null);
			lightbox.dataset.open = "true";
			lightbox.setAttribute("aria-hidden", "false");
			syncImageSize();
			closeButton.focus({ preventScroll: true });
		},
		destroy() {
			closeButton.removeEventListener("click", close);
			documentRef.removeEventListener("keydown", onKeyDown);
			image.removeEventListener("load", syncImageSize);
			ownerWindow === null || ownerWindow === void 0 || ownerWindow.removeEventListener("resize", syncImageSize);
			lightbox.remove();
		}
	};
};
async function renderImage(buffer, target, type, context) {
	var _a, _b, _c, _d;
	const normalizedType = (type || "").trim().toLowerCase();
	if ((normalizedType === "tif" || normalizedType === "tiff") && hasTiffSignature(buffer)) {
		const { renderTiff } = await __vitePreload(async () => {
			const { renderTiff } = await import("./tiff-rK_Uuu5g.js");
			return { renderTiff };
		}, []);
		return renderTiff(buffer, target, context);
	}
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const rotationEnabled = ((_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.image) === null || _b === void 0 ? void 0 : _b.rotation) !== false;
	const documentRef = target.ownerDocument || document;
	const src = await resolveImageUrl(buffer, type);
	let userZoom = 1;
	let fitScale = 1;
	let currentScale = 1;
	let currentRotation = 0;
	let viewportHeight = 0;
	let scrollStateFrame = 0;
	let destroyed = false;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	const viewStateEmitter = createFileViewerViewStateChangeEmitter();
	const root = documentRef.createElement("div");
	root.className = "image-viewer";
	root.dataset.viewerZoomProvider = "image";
	const toolbar = documentRef.createElement("div");
	toolbar.className = "image-toolbar";
	toolbar.setAttribute("role", "toolbar");
	toolbar.setAttribute("aria-label", t("image.toolbar.rotation"));
	const createRotateButton = (label, icon) => {
		const button = documentRef.createElement("button");
		button.type = "button";
		button.setAttribute("aria-label", label);
		button.title = label;
		button.textContent = icon;
		return button;
	};
	const rotateLeftButton = createRotateButton(t("image.toolbar.rotateLeft"), "↺");
	const rotationMeter = documentRef.createElement("span");
	rotationMeter.className = "image-rotation-meter";
	rotationMeter.setAttribute("aria-live", "polite");
	rotationMeter.textContent = "0°";
	const rotateRightButton = createRotateButton(t("image.toolbar.rotateRight"), "↻");
	toolbar.append(rotateLeftButton, rotationMeter, rotateRightButton);
	const stage = documentRef.createElement("div");
	stage.className = "image-stage";
	const frame = documentRef.createElement("div");
	frame.className = "image-frame";
	const image = documentRef.createElement("img");
	image.alt = t("image.alt");
	image.src = src;
	image.tabIndex = 0;
	image.setAttribute("role", "button");
	image.setAttribute("aria-haspopup", "dialog");
	(_c = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _c === void 0 || _c.call(context, {
		capture: () => normalizedType === "heic" || normalizedType === "heif" ? null : new Blob([buffer], { type: getImageBlobType(normalizedType) }),
		getTarget: () => image
	});
	frame.append(image);
	stage.append(frame);
	if (rotationEnabled) root.append(toolbar);
	root.append(stage);
	const lightbox = createLightbox$1(documentRef, src, t);
	const openLightbox = () => lightbox.open(image);
	const openLightboxFromKeyboard = (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			lightbox.open(image);
		}
	};
	image.addEventListener("click", openLightbox);
	image.addEventListener("keydown", openLightboxFromKeyboard);
	const getMinScale = () => Math.min(.1, fitScale || .1);
	const clampScale = (value) => {
		const minScale = getMinScale();
		return Math.min(5, Math.max(minScale, roundImageScale(value)));
	};
	const computeFitScale = () => {
		const naturalWidth = image.naturalWidth || 0;
		const naturalHeight = image.naturalHeight || 0;
		if (!naturalWidth || !naturalHeight) return 1;
		const availableWidth = Math.max((root.clientWidth || 0) - 48, 1);
		const availableHeight = Math.max((root.clientHeight || viewportHeight || 0) - 48, 1);
		const swapsAxes = currentRotation % 180 !== 0;
		const visualWidth = swapsAxes ? naturalHeight : naturalWidth;
		const visualHeight = swapsAxes ? naturalWidth : naturalHeight;
		return Math.min(1, availableWidth / visualWidth, availableHeight / visualHeight);
	};
	const applyImageZoom = () => {
		fitScale = computeFitScale();
		currentScale = clampScale(fitScale * userZoom);
		if (image.naturalWidth && image.naturalHeight) {
			const size = resolveRotatedImageSize(image.naturalWidth, image.naturalHeight, currentScale, currentRotation);
			image.style.width = `${size.imageWidth}px`;
			image.style.height = `${size.imageHeight}px`;
			frame.style.width = `${size.frameWidth}px`;
			frame.style.height = `${size.frameHeight}px`;
			image.style.setProperty("--image-rotation", `${currentRotation}deg`);
			return;
		}
		image.style.width = "auto";
		image.style.height = viewportHeight > 0 ? `${Math.max(1, Math.round(viewportHeight * userZoom))}px` : `${userZoom * 100}%`;
		frame.style.width = image.style.width;
		frame.style.height = image.style.height;
		image.style.setProperty("--image-rotation", `${currentRotation}deg`);
	};
	const updateViewportSize = () => {
		viewportHeight = root.clientHeight || 0;
		applyImageZoom();
		zoomEmitter.emit();
	};
	const resizeObserver = new ResizeObserver(updateViewportSize);
	resizeObserver.observe(root);
	image.addEventListener("load", updateViewportSize);
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
			top: root.scrollTop || 0,
			left: root.scrollLeft || 0,
			width: root.scrollWidth || 0,
			height: root.scrollHeight || 0,
			clientWidth: root.clientWidth || 0,
			clientHeight: root.clientHeight || 0,
			topRatio: maxTop > 0 ? (root.scrollTop || 0) / maxTop : 0,
			leftRatio: maxLeft > 0 ? (root.scrollLeft || 0) / maxLeft : 0
		};
	};
	const getImageViewState = () => ({
		renderer: "image",
		scale: currentScale,
		zoom: getZoomState(),
		rotation: currentRotation,
		scroll: readScrollState()
	});
	const emitViewStateChange = (action, source = "viewer") => {
		const state = getImageViewState();
		if (!destroyed) viewStateEmitter.emit(createFileViewerViewStateChange(state, {
			action,
			source
		}));
		return state;
	};
	const setZoom = (scale, action = "zoom-change", source = "api", notifyViewState = true) => {
		userZoom = clampScale(scale) / Math.max(fitScale, .001);
		applyImageZoom();
		zoomEmitter.emit();
		if (notifyViewState) emitViewStateChange(action, source);
		return getZoomState();
	};
	const applyImageRotation = (rotation, action = "rotation-change", source = "viewer", notifyViewState = true) => {
		if (!rotationEnabled) return getImageViewState();
		const normalized = normalizeImageRotation(rotation);
		if (normalized === currentRotation) return getImageViewState();
		currentRotation = normalized;
		rotationMeter.textContent = `${currentRotation}°`;
		lightbox.setRotation(currentRotation);
		applyImageZoom();
		zoomEmitter.emit();
		return notifyViewState ? emitViewStateChange(action, source) : getImageViewState();
	};
	const fitImage = (request) => {
		var _a, _b;
		const naturalWidth = image.naturalWidth || 0;
		const naturalHeight = image.naturalHeight || 0;
		if (!naturalWidth || !naturalHeight) return {
			applied: false,
			mode: request.mode,
			resize: request.resize,
			source: request.source,
			reason: "image-not-ready",
			provider: "zoom"
		};
		const mode = request.mode === "auto" ? "scale-down" : request.mode;
		const swapsAxes = currentRotation % 180 !== 0;
		const scale = resolveFileViewerFitScale({
			mode,
			viewportWidth: Math.max(1, request.viewportWidth || root.clientWidth || 0),
			viewportHeight: Math.max(1, request.viewportHeight || root.clientHeight || viewportHeight || 0),
			contentWidth: swapsAxes ? naturalHeight : naturalWidth,
			contentHeight: swapsAxes ? naturalWidth : naturalHeight,
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
		const state = setZoom(scale, "fit", request.source);
		return {
			applied: true,
			mode: request.mode,
			resize: request.resize,
			scale: state.scale,
			source: request.source,
			provider: "zoom"
		};
	};
	const restoreScrollState = (scroll) => {
		if (!scroll) return;
		const maxTop = Math.max(0, root.scrollHeight - root.clientHeight);
		const maxLeft = Math.max(0, root.scrollWidth - root.clientWidth);
		const top = Number.isFinite(scroll.top) ? Number(scroll.top) : Number.isFinite(scroll.topRatio) ? Number(scroll.topRatio) * maxTop : void 0;
		const left = Number.isFinite(scroll.left) ? Number(scroll.left) : Number.isFinite(scroll.leftRatio) ? Number(scroll.leftRatio) * maxLeft : void 0;
		if (top !== void 0) root.scrollTop = Math.min(Math.max(0, top), maxTop);
		if (left !== void 0) root.scrollLeft = Math.min(Math.max(0, left), maxLeft);
	};
	const applyImageViewState = async (state, options = {}) => {
		var _a, _b;
		const source = options.source || "api";
		const action = options.action || "restore";
		const nextRotation = Number(state.rotation);
		const nextScale = Number((_a = state.scale) !== null && _a !== void 0 ? _a : (_b = state.zoom) === null || _b === void 0 ? void 0 : _b.scale);
		if (Number.isFinite(nextRotation)) applyImageRotation(nextRotation, "rotation-change", source, false);
		if (Number.isFinite(nextScale)) setZoom(nextScale, "zoom-change", source, false);
		restoreScrollState(state.scroll);
		return options.notify === false ? getImageViewState() : emitViewStateChange(action, source);
	};
	const targetWindow = documentRef.defaultView;
	const scheduleScrollViewStateChange = () => {
		if (destroyed || scrollStateFrame) return;
		if (!(targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.requestAnimationFrame)) {
			emitViewStateChange("scroll", "viewer");
			return;
		}
		scrollStateFrame = targetWindow.requestAnimationFrame(() => {
			scrollStateFrame = 0;
			emitViewStateChange("scroll", "viewer");
		});
	};
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(currentScale + .15, "zoom-in", "api"),
		zoomOut: () => setZoom(currentScale - .15, "zoom-out", "api"),
		resetZoom: () => {
			userZoom = 1;
			applyImageZoom();
			zoomEmitter.emit();
			emitViewStateChange("zoom-reset", "api");
			return getZoomState();
		},
		setZoom,
		fit: fitImage,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	registerFileViewerViewStateProvider(root, {
		getState: getImageViewState,
		applyState: applyImageViewState,
		fit: fitImage,
		subscribe: viewStateEmitter.subscribe
	});
	const rotateLeft = () => {
		applyImageRotation(currentRotation - 90, "rotate-left", "user");
	};
	const rotateRight = () => {
		applyImageRotation(currentRotation + 90, "rotate-right", "user");
	};
	rotateLeftButton.addEventListener("click", rotateLeft);
	rotateRightButton.addEventListener("click", rotateRight);
	root.addEventListener("scroll", scheduleScrollViewStateChange, { passive: true });
	target.replaceChildren(createStyle(documentRef), root);
	(((_d = context === null || context === void 0 ? void 0 : context.surface) === null || _d === void 0 ? void 0 : _d.shadowRoot) || target).append(lightbox.element);
	updateViewportSize();
	const cleanup = () => {
		var _a;
		destroyed = true;
		(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, null);
		unregisterFileViewerViewStateProvider(root);
		unregisterFileViewerZoomProvider(root);
		if (scrollStateFrame && (targetWindow === null || targetWindow === void 0 ? void 0 : targetWindow.cancelAnimationFrame)) {
			targetWindow.cancelAnimationFrame(scrollStateFrame);
			scrollStateFrame = 0;
		}
		resizeObserver.disconnect();
		root.removeEventListener("scroll", scheduleScrollViewStateChange);
		rotateLeftButton.removeEventListener("click", rotateLeft);
		rotateRightButton.removeEventListener("click", rotateRight);
		image.removeEventListener("load", updateViewportSize);
		image.removeEventListener("click", openLightbox);
		image.removeEventListener("keydown", openLightboxFromKeyboard);
		lightbox.destroy();
		target.replaceChildren();
	};
	try {
		await waitForImageReady(image);
		updateViewportSize();
		targetWindow === null || targetWindow === void 0 || targetWindow.requestAnimationFrame(() => emitViewStateChange("init", "viewer"));
	} catch (error) {
		cleanup();
		throw error;
	}
	return {
		$el: target,
		unmount() {
			cleanup();
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-image@3.1.2/node_modules/@file-viewer/renderer-image/dist/index.js
var imageDefinition = DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === "image");
if (!imageDefinition) throw new Error("@file-viewer/renderer-image could not locate the core image renderer definition.");
var imageRendererDefinition = imageDefinition;
var renderFileViewerImage = (buffer, target, type, context) => __vitePreload(async () => {
	const { default: renderImage } = await import("./image-D6mIB_QN.js");
	return { default: renderImage };
}, []).then(({ default: renderImage }) => renderImage(buffer, target, type, context));
var imageRenderer = {
	id: "file-viewer-renderer-image",
	label: "Flyfish File Viewer image renderer",
	definitions: [imageRendererDefinition],
	handlers: [{
		rendererId: imageRendererDefinition.id,
		handler: renderFileViewerImage
	}]
};
//#endregion
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
	const imported = await __vitePreload(() => import("./UTIF-YZFDUUoe.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1)), __vite__mapDeps([2,1,3,4,5]));
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
export { imageRendererDefinition as a, normalizeImageRotation as c, imageRenderer as i, renderImage as l, renderTiffWithDecoder as n, renderFileViewerImage as o, validateTiffPageSafety as r, hasTiffSignature as s, renderTiff as t, resolveRotatedImageSize as u };
