const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/photoshopParser-D2C-9aqk.js","assets/dist-Dkr0Qb6c.js","assets/rolldown-runtime-CEgmsyvS.js","assets/base64-js-DFqkKNNm.js","assets/limits-Dq6NAslB.js","assets/photoshopPreflight-BCgzeqIc.js"])))=>i.map(i=>d[i]);
import { Hs as unregisterFileViewerZoomProvider, Tu as resolveFileViewerDesignWorkerUrl, ho as createFileViewerTranslator, ts as createFileViewerZoomChangeEmitter, ud as __vitePreload, zs as registerFileViewerZoomProvider } from "./file-viewer-3d-ijA7B-Qe.js";
import { n as resolvePhotoshopParseLimits } from "./limits-Dq6NAslB.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/photoshopWorkerClient.js
var LocalPhotoshopRenderSession = class {
	options;
	session;
	constructor(options) {
		this.options = options;
	}
	async open(buffer) {
		this.session?.destroy();
		const { PhotoshopDocumentSession } = await __vitePreload(async () => {
			const { PhotoshopDocumentSession } = await import("./photoshopParser-D2C-9aqk.js");
			return { PhotoshopDocumentSession };
		}, __vite__mapDeps([0,1,2,3,4,5]));
		const opened = await PhotoshopDocumentSession.open(buffer, resolvePhotoshopParseLimits(this.options));
		this.session = opened.session;
		return opened.result;
	}
	renderLayer(layerId) {
		if (!this.session) throw new Error("Photoshop document is not open.");
		return this.session.renderLayer(layerId);
	}
	destroy() {
		this.session?.destroy();
		this.session = void 0;
	}
};
var WorkerPhotoshopRenderSession = class {
	options;
	worker;
	pending = /* @__PURE__ */ new Map();
	requestId = 0;
	destroyed = false;
	timeoutMs;
	constructor(options, documentBaseUrl) {
		this.options = options;
		const workerUrl = resolveFileViewerDesignWorkerUrl(options, documentBaseUrl);
		this.worker = new Worker(workerUrl, {
			type: "module",
			name: "file-viewer-photoshop"
		});
		this.timeoutMs = Math.max(1e3, options?.workerTimeoutMs ?? 6e4);
		this.worker.addEventListener("message", (event) => {
			const pending = this.pending.get(event.data.id);
			if (!pending) return;
			this.pending.delete(event.data.id);
			if (event.data.ok) pending.resolve(event.data);
			else {
				const error = new Error(event.data.error.message);
				error.name = event.data.error.name;
				pending.reject(error);
				if (event.data.error.fatal) this.terminate(error);
			}
		});
		this.worker.addEventListener("error", (event) => {
			this.terminate(new Error(event.message || "Photoshop Worker failed to load."));
		});
		this.worker.addEventListener("messageerror", () => {
			this.terminate(/* @__PURE__ */ new Error("Photoshop Worker returned a message that could not be decoded."));
		});
	}
	rejectAll(error) {
		for (const pending of this.pending.values()) pending.reject(error);
		this.pending.clear();
	}
	terminate(error) {
		if (this.destroyed) return;
		this.destroyed = true;
		this.worker.terminate();
		this.rejectAll(error);
	}
	request(request, transfer = []) {
		if (this.destroyed) return Promise.reject(/* @__PURE__ */ new Error("Photoshop Worker session was destroyed."));
		const id = ++this.requestId;
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				const error = /* @__PURE__ */ new Error(`Photoshop Worker exceeded ${this.timeoutMs}ms and was terminated.`);
				reject(error);
				this.terminate(error);
			}, this.timeoutMs);
			this.pending.set(id, {
				resolve: (response) => {
					clearTimeout(timer);
					resolve(response);
				},
				reject: (error) => {
					clearTimeout(timer);
					reject(error);
				}
			});
			try {
				this.worker.postMessage({
					id,
					...request
				}, transfer);
			} catch (error) {
				clearTimeout(timer);
				this.pending.delete(id);
				reject(error instanceof Error ? error : new Error(String(error)));
			}
		});
	}
	async open(buffer) {
		const limits = resolvePhotoshopParseLimits(this.options);
		if (buffer.byteLength > limits.maxFileBytes) throw new Error(`Photoshop source exceeds the ${limits.maxFileBytes}-byte safety limit.`);
		const transferable = buffer.slice(0);
		const response = await this.request({
			type: "open",
			buffer: transferable,
			limits
		}, [transferable]);
		if (!response.ok || response.type !== "open") {
			const error = /* @__PURE__ */ new Error("Invalid Photoshop Worker open response.");
			this.terminate(error);
			throw error;
		}
		return response.result;
	}
	async renderLayer(layerId) {
		const response = await this.request({
			type: "layer",
			layerId
		});
		if (!response.ok || response.type !== "layer") throw new Error("Invalid Photoshop Worker layer response.");
		return {
			width: response.width,
			height: response.height,
			rgba: response.rgba
		};
	}
	destroy() {
		this.terminate(/* @__PURE__ */ new Error("Photoshop Worker session was destroyed."));
	}
};
var createPhotoshopRenderSession = (options, documentBaseUrl) => {
	if (options?.useWorker === false) return new LocalPhotoshopRenderSession(options);
	if (typeof Worker !== "undefined") return new WorkerPhotoshopRenderSession(options, documentBaseUrl);
	throw new Error("Photoshop preview requires a module Worker. Set options.design.useWorker=false only if the host explicitly accepts main-thread parsing.");
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/photoshop.js
var photoshopStyle = `
.psd-viewer{display:grid;height:100%;min-height:460px;grid-template-rows:auto minmax(0,1fr);--psd-bg:#eef1f4;--psd-surface:#fff;--psd-border:rgba(15,23,42,.1);--psd-text:#132235;--psd-muted:#64748b;--psd-accent:#0f766e;background:var(--psd-bg);color:var(--psd-text);box-sizing:border-box}
.psd-toolbar{position:sticky;top:0;z-index:4;display:flex;min-height:52px;align-items:center;justify-content:space-between;gap:12px;padding:9px 14px;border-bottom:1px solid var(--psd-border);background:rgba(255,255,255,.92);backdrop-filter:blur(12px);box-sizing:border-box}
.psd-title{display:flex;min-width:0;flex-direction:column;gap:2px}.psd-title strong{overflow:hidden;font-size:14px;text-overflow:ellipsis;white-space:nowrap}.psd-title span{color:var(--psd-muted);font-size:11px;font-weight:700}
.psd-actions{display:flex;flex-shrink:0;align-items:center;gap:5px}.psd-actions button{height:32px;min-width:34px;padding:0 9px;border:1px solid rgba(100,116,139,.28);border-radius:7px;background:#fff;color:#132235;cursor:pointer;font-size:12px;font-weight:800}.psd-actions button:hover,.psd-actions button:focus-visible{border-color:rgba(15,118,110,.5);color:var(--psd-accent)}.psd-actions button:disabled{cursor:not-allowed;opacity:.45}.psd-actions span{min-width:48px;color:var(--psd-muted);font-size:12px;font-weight:800;text-align:center}
.psd-layout{position:relative;display:grid;min-height:0;grid-template-columns:280px minmax(0,1fr)}.psd-sidebar{min-height:0;overflow:auto;border-right:1px solid var(--psd-border);background:rgba(248,250,252,.9)}
.psd-sidebar-header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border-bottom:1px solid var(--psd-border);background:rgba(248,250,252,.96);font-size:12px;font-weight:800}.psd-layer-list{margin:0;padding:8px;list-style:none}
.psd-layer{display:grid;min-height:44px;grid-template-columns:auto minmax(0,1fr);gap:8px;align-items:center;margin:0 0 5px;padding:8px;border:1px solid transparent;border-radius:8px;background:#fff;box-sizing:border-box}.psd-layer:hover{border-color:rgba(15,118,110,.24)}.psd-layer[data-kind='group']{background:rgba(226,232,240,.72)}.psd-layer input{accent-color:var(--psd-accent)}.psd-layer label{min-width:0;cursor:pointer}.psd-layer input:disabled+label{cursor:default}.psd-layer strong{display:block;overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.psd-layer span{display:block;margin-top:3px;color:var(--psd-muted);font-size:10px}.psd-layer em{font-style:normal;color:var(--psd-accent)}
.psd-stage{position:relative;min-width:0;min-height:0;overflow:auto;padding:28px;cursor:grab;overscroll-behavior:contain;touch-action:none}.psd-stage[data-panning='true']{cursor:grabbing}.psd-stage-status{position:sticky;left:12px;bottom:12px;z-index:3;display:inline-flex;padding:5px 8px;border:1px solid var(--psd-border);border-radius:999px;background:rgba(255,255,255,.88);color:var(--psd-muted);font-size:10px;font-weight:800;backdrop-filter:blur(8px)}
.psd-canvas-wrap{position:relative;display:block;transform-origin:top left}.psd-canvas-shell{position:absolute;top:0;left:0;display:inline-block;padding:18px;border:1px solid var(--psd-border);border-radius:8px;background:linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%);background-color:#fff;background-position:0 0,0 10px,10px -10px,-10px 0;background-size:20px 20px;box-shadow:0 18px 48px rgba(15,23,42,.14);transform-origin:top left}.psd-canvas-shell canvas{display:block;max-width:none;background:transparent}.psd-empty{padding:20px;color:var(--psd-muted);font-weight:700}.psd-layer-toggle{display:none}
[data-viewer-theme='dark'] .psd-viewer{--psd-bg:#0d1117;--psd-surface:#161b22;--psd-border:rgba(139,148,158,.24);--psd-text:#e6edf3;--psd-muted:#8b949e}[data-viewer-theme='dark'] .psd-toolbar{background:rgba(13,17,23,.92)}[data-viewer-theme='dark'] .psd-sidebar,[data-viewer-theme='dark'] .psd-sidebar-header{background:rgba(22,27,34,.94)}[data-viewer-theme='dark'] .psd-layer,[data-viewer-theme='dark'] .psd-actions button{background:#161b22;color:#e6edf3}[data-viewer-theme='dark'] .psd-layer[data-kind='group']{background:#202a36}[data-viewer-theme='dark'] .psd-stage-status{background:rgba(22,27,34,.9)}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .psd-viewer{--psd-bg:#0d1117;--psd-surface:#161b22;--psd-border:rgba(139,148,158,.24);--psd-text:#e6edf3;--psd-muted:#8b949e}[data-viewer-theme='system'] .psd-toolbar{background:rgba(13,17,23,.92)}[data-viewer-theme='system'] .psd-sidebar,[data-viewer-theme='system'] .psd-sidebar-header{background:rgba(22,27,34,.94)}[data-viewer-theme='system'] .psd-layer,[data-viewer-theme='system'] .psd-actions button{background:#161b22;color:#e6edf3}[data-viewer-theme='system'] .psd-layer[data-kind='group']{background:#202a36}}
@media (max-width:760px){.psd-viewer{min-height:360px}.psd-toolbar{align-items:flex-start;padding:8px}.psd-title span{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.psd-actions{flex-wrap:wrap;justify-content:flex-end}.psd-actions button{height:30px;min-width:31px;padding:0 7px}.psd-actions .psd-wide-action:not(.psd-merged-action){display:none}.psd-layout{grid-template-columns:1fr}.psd-sidebar{position:absolute;inset:0 auto 0 0;z-index:5;width:min(82vw,320px);border-right:1px solid var(--psd-border);box-shadow:16px 0 40px rgba(15,23,42,.22);transform:translateX(-105%);transition:transform .2s ease}.psd-viewer[data-layers-open='true'] .psd-sidebar{transform:translateX(0)}.psd-layer-toggle{position:absolute;right:12px;bottom:calc(12px + var(--file-viewer-mobile-overlay-bottom,0px));z-index:6;display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 14px;border:1px solid var(--psd-border);border-radius:999px;background:rgba(255,255,255,.9);color:var(--psd-text);font-size:12px;font-weight:800;box-shadow:0 10px 28px rgba(15,23,42,.18);backdrop-filter:blur(10px)}.psd-stage{padding:14px}.psd-stage-status{bottom:calc(62px + var(--file-viewer-mobile-overlay-bottom,0px))}}
`;
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var createCanvasFromPixels = (documentRef, width, height, rgba) => {
	const canvas = documentRef.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ImageDataConstructor = documentRef.defaultView?.ImageData || ImageData;
	const pixels = rgba.buffer instanceof ArrayBuffer ? new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength) : new Uint8ClampedArray(rgba);
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Canvas 2D is unavailable for Photoshop pixel staging.");
	context.putImageData(new ImageDataConstructor(pixels, width, height), 0, 0);
	return canvas;
};
var compositeOperations = Object.freeze({
	normal: "source-over",
	norm: "source-over",
	pass: "source-over",
	dark: "darken",
	"mul ": "multiply",
	idiv: "color-burn",
	lite: "lighten",
	scrn: "screen",
	"div ": "color-dodge",
	lddg: "lighter",
	over: "overlay",
	sLit: "soft-light",
	hLit: "hard-light",
	diff: "difference",
	smud: "exclusion",
	"hue ": "hue",
	"sat ": "saturation",
	colr: "color",
	"lum ": "luminosity"
});
var clampZoom = (value) => Math.min(4, Math.max(.05, Number(value.toFixed(3))));
var sameSelection = (left, right) => {
	if (left.size !== right.size) return false;
	for (const value of left) if (!right.has(value)) return false;
	return true;
};
var childLayerIds = (layers, parentId) => {
	const prefix = `${parentId}.`;
	return layers.filter((layer) => layer.drawable && layer.id.startsWith(prefix)).map((layer) => layer.id);
};
var photoshopViewerSequence = 0;
async function renderPhotoshop(buffer, target, type, context) {
	const documentRef = target.ownerDocument || document;
	const t = createFileViewerTranslator(context?.options);
	const parseLimits = resolvePhotoshopParseLimits(context?.options?.design);
	let destroyed = false;
	let renderRevision = 0;
	if (context?.signal?.aborted) throw new DOMException("Photoshop rendering was aborted.", "AbortError");
	const session = createPhotoshopRenderSession(context?.options?.design, documentRef.baseURI);
	const abort = () => {
		destroyed = true;
		renderRevision += 1;
		session.destroy();
	};
	context?.signal?.addEventListener("abort", abort, { once: true });
	let opened;
	try {
		opened = await session.open(buffer);
	} catch (error) {
		session.destroy();
		context?.signal?.removeEventListener("abort", abort);
		throw error;
	}
	if (context?.signal?.aborted) {
		session.destroy();
		context.signal.removeEventListener("abort", abort);
		throw new DOMException("Photoshop rendering was aborted.", "AbortError");
	}
	const { header, layers } = opened;
	const detectedType = header.version === 2 ? "psb" : "psd";
	const declaredType = type.toLowerCase();
	const psdContainerAlias = detectedType === "psd" && (declaredType === "pdd" || declaredType === "psdt");
	if (declaredType !== detectedType && !psdContainerAlias) context?.options?.onDiagnostic?.({
		code: "photoshop-extension-signature-mismatch",
		level: "warning",
		message: `The .${declaredType} filename contains a ${detectedType.toUpperCase()} v${header.version} document; preview follows the file signature.`,
		detail: {
			declaredExtension: declaredType,
			detectedExtension: detectedType,
			version: header.version
		}
	});
	if (psdContainerAlias) context?.options?.onDiagnostic?.({
		code: "photoshop-psd-container-alias",
		level: "info",
		message: `The .${declaredType} file is rendered through its validated Photoshop PSD v1 container.`,
		detail: {
			declaredExtension: declaredType,
			detectedExtension: detectedType,
			version: header.version
		}
	});
	const parserExecution = context?.options?.design?.useWorker === false ? "main thread" : "Worker";
	const interactiveLayers = opened.layerInteraction === "basic";
	const storedCompositeStatus = opened.colorProfile === "embedded-unconverted" ? "Stored composite · embedded ICC not converted" : interactiveLayers ? "Stored composite · basic layers" : "Stored composite · layers read-only";
	const drawableLayers = layers.filter((layer) => layer.drawable);
	const originalVisible = new Set(drawableLayers.filter((layer) => !layer.hidden).map((layer) => layer.id));
	const selected = new Set(originalVisible);
	const layerCanvases = /* @__PURE__ */ new Map();
	let layerCacheBytes = 0;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	let zoom = 1;
	let layerRenderQueue = Promise.resolve();
	let userAdjustedZoom = false;
	const root = createElement(documentRef, "div", "psd-viewer");
	root.dataset.viewerZoomProvider = "photoshop";
	root.dataset.photoshopEngine = opened.engine;
	root.dataset.layerInteraction = opened.layerInteraction;
	root.dataset.colorProfile = opened.colorProfile;
	const style = createElement(documentRef, "style");
	style.textContent = photoshopStyle;
	const toolbar = createElement(documentRef, "div", "psd-toolbar");
	const title = createElement(documentRef, "div", "psd-title");
	title.append(createElement(documentRef, "strong", void 0, t("psd.title")), createElement(documentRef, "span", void 0, `${psdContainerAlias ? `${declaredType.toUpperCase()} · PSD v1` : detectedType.toUpperCase()} · ${header.width} × ${header.height} · ${layers.length} layers · ${opened.engine} ${parserExecution}`));
	const actions = createElement(documentRef, "div", "psd-actions");
	const zoomOut = createElement(documentRef, "button", void 0, "−");
	const zoomLabel = createElement(documentRef, "span", void 0, "100%");
	const zoomIn = createElement(documentRef, "button", void 0, "+");
	const fit = createElement(documentRef, "button", void 0, t("psd.action.fit"));
	const original = createElement(documentRef, "button", "psd-wide-action psd-merged-action", "Merged");
	const showAll = createElement(documentRef, "button", "psd-wide-action", t("psd.action.showAll"));
	const hideAll = createElement(documentRef, "button", "psd-wide-action", t("psd.action.hideAll"));
	[
		zoomOut,
		zoomIn,
		fit,
		original,
		showAll,
		hideAll
	].forEach((button) => {
		button.type = "button";
	});
	zoomOut.dataset.photoshopAction = "zoom-out";
	zoomIn.dataset.photoshopAction = "zoom-in";
	fit.dataset.photoshopAction = "fit";
	original.dataset.photoshopAction = "merged";
	showAll.dataset.photoshopAction = "show-all";
	hideAll.dataset.photoshopAction = "hide-all";
	zoomOut.setAttribute("aria-label", "Zoom out");
	zoomIn.setAttribute("aria-label", "Zoom in");
	original.title = "Restore the embedded merged composite";
	actions.append(zoomOut, zoomLabel, zoomIn, fit, original, showAll, hideAll);
	toolbar.append(title, actions);
	const layout = createElement(documentRef, "div", "psd-layout");
	const sidebar = createElement(documentRef, "aside", "psd-sidebar");
	const panelId = `file-viewer-photoshop-layers-${++photoshopViewerSequence}`;
	sidebar.id = panelId;
	sidebar.tabIndex = -1;
	const sidebarHeader = createElement(documentRef, "div", "psd-sidebar-header");
	sidebarHeader.append(createElement(documentRef, "span", void 0, t("psd.layers.title")), createElement(documentRef, "span", void 0, t("psd.layers.redrawable", { count: drawableLayers.length })));
	const list = createElement(documentRef, "ul", "psd-layer-list");
	sidebar.append(sidebarHeader, list);
	const stage = createElement(documentRef, "main", "psd-stage");
	const wrap = createElement(documentRef, "div", "psd-canvas-wrap");
	const shell = createElement(documentRef, "div", "psd-canvas-shell");
	const canvas = createElement(documentRef, "canvas");
	canvas.width = header.width;
	canvas.height = header.height;
	const status = createElement(documentRef, "span", "psd-stage-status", storedCompositeStatus);
	shell.appendChild(canvas);
	wrap.appendChild(shell);
	stage.append(wrap, status);
	const layerToggle = createElement(documentRef, "button", "psd-layer-toggle", t("psd.layers.title"));
	layerToggle.type = "button";
	layerToggle.dataset.photoshopAction = "toggle-layers";
	layerToggle.setAttribute("aria-controls", panelId);
	layerToggle.setAttribute("aria-expanded", "false");
	layout.append(sidebar, stage, layerToggle);
	root.append(toolbar, layout);
	target.replaceChildren(style, root);
	const compositeCanvas = createCanvasFromPixels(documentRef, header.width, header.height, opened.composite);
	opened.composite = /* @__PURE__ */ new Uint8ClampedArray(0);
	if (!interactiveLayers) session.destroy();
	const canvasContext = canvas.getContext("2d");
	if (!canvasContext) {
		session.destroy();
		throw new Error("Canvas 2D is unavailable for Photoshop preview.");
	}
	const drawMerged = () => {
		canvasContext.save();
		canvasContext.globalAlpha = 1;
		canvasContext.globalCompositeOperation = "source-over";
		canvasContext.clearRect(0, 0, canvas.width, canvas.height);
		canvasContext.drawImage(compositeCanvas, 0, 0);
		canvasContext.restore();
		status.textContent = storedCompositeStatus;
	};
	const disposeLayerCanvas = (entry) => {
		entry.discard = true;
		if (!entry.canvas) return;
		layerCacheBytes = Math.max(0, layerCacheBytes - entry.bytes);
		entry.bytes = 0;
		entry.canvas.width = 0;
		entry.canvas.height = 0;
		entry.canvas = void 0;
	};
	const trimLayerCache = () => {
		for (const [id, entry] of layerCanvases) {
			if (layerCacheBytes <= parseLimits.maxLayerCacheBytes) break;
			if (!entry.canvas) continue;
			layerCanvases.delete(id);
			disposeLayerCanvas(entry);
		}
	};
	const clearLayerCache = () => {
		for (const entry of layerCanvases.values()) disposeLayerCanvas(entry);
		layerCanvases.clear();
	};
	const getLayerCanvas = (layer) => {
		const cached = layerCanvases.get(layer.id);
		if (cached) {
			layerCanvases.delete(layer.id);
			layerCanvases.set(layer.id, cached);
			return cached.promise;
		}
		const entry = {
			bytes: 0,
			discard: false
		};
		entry.promise = session.renderLayer(layer.id).then((result) => {
			const canvas = createCanvasFromPixels(documentRef, result.width, result.height, result.rgba);
			if (destroyed || entry.discard) {
				canvas.width = 0;
				canvas.height = 0;
				return canvas;
			}
			entry.canvas = canvas;
			entry.bytes = result.width * result.height * 4;
			layerCacheBytes += entry.bytes;
			return canvas;
		}).catch((error) => {
			if (layerCanvases.get(layer.id) === entry) layerCanvases.delete(layer.id);
			disposeLayerCanvas(entry);
			throw error;
		});
		layerCanvases.set(layer.id, entry);
		return entry.promise;
	};
	const runSelection = async (revision, selection) => {
		if (destroyed || revision !== renderRevision) return;
		if (!interactiveLayers || sameSelection(selection, originalVisible)) {
			drawMerged();
			trimLayerCache();
			return;
		}
		const workCanvas = documentRef.createElement("canvas");
		workCanvas.width = header.width;
		workCanvas.height = header.height;
		const workContext = workCanvas.getContext("2d");
		if (!workContext) throw new Error("Canvas 2D is unavailable for Photoshop layer composition.");
		status.textContent = "Rendering selected layers…";
		try {
			const visible = drawableLayers.filter((layer) => selection.has(layer.id)).sort((left, right) => right.stackIndex - left.stackIndex);
			const unsupportedModes = /* @__PURE__ */ new Set();
			let clippingLayers = 0;
			for (const layer of visible) {
				if (destroyed || revision !== renderRevision) return;
				const layerCanvas = await getLayerCanvas(layer);
				if (destroyed || revision !== renderRevision) return;
				const operation = compositeOperations[layer.blendMode];
				if (!operation) unsupportedModes.add(layer.blendMode);
				if (layer.clipping) clippingLayers += 1;
				workContext.globalCompositeOperation = operation || "source-over";
				workContext.globalAlpha = 1;
				workContext.drawImage(layerCanvas, layer.left, layer.top);
				trimLayerCache();
			}
			if (destroyed || revision !== renderRevision) return;
			canvasContext.save();
			canvasContext.globalAlpha = 1;
			canvasContext.globalCompositeOperation = "source-over";
			canvasContext.clearRect(0, 0, canvas.width, canvas.height);
			canvasContext.drawImage(workCanvas, 0, 0);
			canvasContext.restore();
			status.textContent = "Interactive layer composite";
			if (unsupportedModes.size || clippingLayers) context?.options?.onDiagnostic?.({
				code: "photoshop-interactive-composite-limits",
				level: "warning",
				message: "Interactive layer composition used a browser blend fallback; the untouched merged view remains the fidelity reference.",
				detail: {
					unsupportedBlendModes: [...unsupportedModes],
					clippingLayers
				}
			});
		} finally {
			workCanvas.width = 0;
			workCanvas.height = 0;
			trimLayerCache();
		}
	};
	const drawSelection = () => {
		const revision = ++renderRevision;
		const selection = new Set(selected);
		const task = layerRenderQueue.catch(() => void 0).then(() => runSelection(revision, selection));
		layerRenderQueue = task;
		return task;
	};
	const checkboxes = /* @__PURE__ */ new Map();
	const reportLayerRenderError = (error) => {
		status.textContent = error instanceof Error ? error.message : String(error);
	};
	const renderSelectedLayers = () => {
		drawSelection().catch(reportLayerRenderError);
	};
	const syncCheckboxes = () => {
		layers.forEach((layer) => {
			const checkbox = checkboxes.get(layer.id);
			if (!checkbox) return;
			const ids = layer.drawable ? [layer.id] : childLayerIds(layers, layer.id);
			const selectedCount = ids.filter((id) => selected.has(id)).length;
			checkbox.checked = ids.length > 0 && selectedCount === ids.length;
			checkbox.indeterminate = selectedCount > 0 && selectedCount < ids.length;
		});
	};
	if (!layers.length) list.appendChild(createElement(documentRef, "li", "psd-empty", t("psd.layers.empty")));
	layers.forEach((layer, layerIndex) => {
		const item = createElement(documentRef, "li", "psd-layer");
		item.dataset.layerId = layer.id;
		item.dataset.layerName = layer.name;
		item.dataset.kind = layer.kind;
		item.style.paddingLeft = `${8 + layer.depth * 14}px`;
		const checkbox = createElement(documentRef, "input");
		checkbox.type = "checkbox";
		checkbox.id = `${panelId}-item-${layerIndex}`;
		checkbox.setAttribute("aria-label", `Show Photoshop layer ${layer.name}`);
		const affectedIds = layer.drawable ? [layer.id] : childLayerIds(layers, layer.id);
		checkbox.disabled = affectedIds.length === 0 || !interactiveLayers;
		checkbox.addEventListener("change", () => {
			affectedIds.forEach((id) => checkbox.checked ? selected.add(id) : selected.delete(id));
			syncCheckboxes();
			renderSelectedLayers();
		});
		checkboxes.set(layer.id, checkbox);
		const copy = createElement(documentRef, "label");
		copy.htmlFor = checkbox.id;
		const details = layer.kind === "group" ? `${childLayerIds(layers, layer.id).length} layers` : `${layer.left},${layer.top} · ${layer.width} × ${layer.height}`;
		copy.append(createElement(documentRef, "strong", void 0, layer.name), createElement(documentRef, "span", void 0, `${details}${layer.hidden ? ` · ${t("psd.layers.hidden")}` : ""}${layer.text ? " · text" : ""}`));
		item.append(checkbox, copy);
		list.appendChild(item);
	});
	syncCheckboxes();
	if (!interactiveLayers) {
		[showAll, hideAll].forEach((button) => {
			button.disabled = true;
		});
		context?.options?.onDiagnostic?.({
			code: "photoshop-layer-structure-only",
			level: "warning",
			message: "The stored Photoshop composite is shown at full fidelity; layer visibility is read-only because this document uses composition semantics outside the basic interactive subset.",
			detail: { limits: opened.layerInteractionLimits }
		});
	}
	if (opened.colorProfile === "embedded-unconverted") context?.options?.onDiagnostic?.({
		code: "photoshop-icc-profile-unconverted",
		level: "warning",
		message: "The Photoshop file embeds an ICC profile, but the current browser pixel path has not applied ICC color conversion. Geometry and stored pixels are preserved; color is not reference-verified.",
		detail: {
			engine: opened.engine,
			compositeCompression: opened.compositeCompression
		}
	});
	const setZoom = (next, source = "user") => {
		zoom = clampZoom(next);
		if (source === "user") userAdjustedZoom = true;
		shell.style.transform = `scale(${zoom})`;
		const padding = 38;
		wrap.style.width = `${Math.ceil((header.width + padding) * zoom)}px`;
		wrap.style.height = `${Math.ceil((header.height + padding) * zoom)}px`;
		zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
		zoomEmitter.emit();
		return getZoomState();
	};
	const fitToStage = () => {
		const availableWidth = Math.max(1, stage.clientWidth - 28 - 38);
		const availableHeight = Math.max(1, stage.clientHeight - 28 - 38);
		return setZoom(Math.min(1, availableWidth / header.width, availableHeight / header.height), "fit");
	};
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 4,
		canZoomOut: zoom > .05,
		canReset: true,
		minScale: .05,
		maxScale: 4
	});
	zoomOut.addEventListener("click", () => setZoom(zoom / 1.15));
	zoomIn.addEventListener("click", () => setZoom(zoom * 1.15));
	fit.addEventListener("click", () => {
		userAdjustedZoom = false;
		fitToStage();
	});
	original.addEventListener("click", () => {
		renderRevision += 1;
		selected.clear();
		originalVisible.forEach((id) => selected.add(id));
		syncCheckboxes();
		drawMerged();
		trimLayerCache();
	});
	showAll.addEventListener("click", () => {
		drawableLayers.forEach((layer) => selected.add(layer.id));
		syncCheckboxes();
		renderSelectedLayers();
	});
	hideAll.addEventListener("click", () => {
		selected.clear();
		syncCheckboxes();
		renderSelectedLayers();
	});
	const setLayerPanelOpen = (open, restoreToggleFocus = false) => {
		root.dataset.layersOpen = open ? "true" : "false";
		layerToggle.setAttribute("aria-expanded", String(open));
		if (open) sidebar.focus({ preventScroll: true });
		else if (restoreToggleFocus) layerToggle.focus({ preventScroll: true });
	};
	layerToggle.addEventListener("click", () => {
		setLayerPanelOpen(root.dataset.layersOpen !== "true");
	});
	const closeLayersOnEscape = (event) => {
		if (event.key !== "Escape" || root.dataset.layersOpen !== "true") return;
		event.preventDefault();
		setLayerPanelOpen(false, true);
	};
	documentRef.addEventListener("keydown", closeLayersOnEscape);
	const pointers = /* @__PURE__ */ new Map();
	let panPointerId;
	let panPointerX = 0;
	let panPointerY = 0;
	let panScrollLeft = 0;
	let panScrollTop = 0;
	let pinchDistance = 0;
	let pinchZoom = 1;
	let pinchContentX = 0;
	let pinchContentY = 0;
	const pointerPair = () => [...pointers.values()].slice(0, 2);
	const pairCenter = (pair) => ({
		x: (pair[0].x + pair[1].x) / 2,
		y: (pair[0].y + pair[1].y) / 2
	});
	const pairDistance = (pair) => Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
	const beginPan = (pointerId, point) => {
		panPointerId = pointerId;
		panPointerX = point.x;
		panPointerY = point.y;
		panScrollLeft = stage.scrollLeft;
		panScrollTop = stage.scrollTop;
	};
	const beginPinch = () => {
		const pair = pointerPair();
		if (pair.length < 2) return;
		const center = pairCenter(pair);
		const rect = stage.getBoundingClientRect();
		const contentOriginX = wrap.offsetLeft;
		const contentOriginY = wrap.offsetTop;
		pinchDistance = Math.max(1, pairDistance(pair));
		pinchZoom = zoom;
		pinchContentX = (stage.scrollLeft + center.x - rect.left - contentOriginX) / zoom;
		pinchContentY = (stage.scrollTop + center.y - rect.top - contentOriginY) / zoom;
		panPointerId = void 0;
	};
	stage.addEventListener("pointerdown", (event) => {
		const interactiveTarget = event.target instanceof Element && event.target.closest("button,input");
		if (event.button !== 0 || interactiveTarget) return;
		if (root.dataset.layersOpen === "true") setLayerPanelOpen(false);
		const point = {
			x: event.clientX,
			y: event.clientY
		};
		pointers.set(event.pointerId, point);
		stage.dataset.panning = "true";
		try {
			stage.setPointerCapture(event.pointerId);
		} catch {}
		if (pointers.size === 1) beginPan(event.pointerId, point);
		else if (pointers.size === 2) beginPinch();
		event.preventDefault();
	});
	stage.addEventListener("pointermove", (event) => {
		if (!pointers.has(event.pointerId)) return;
		pointers.set(event.pointerId, {
			x: event.clientX,
			y: event.clientY
		});
		if (pointers.size >= 2) {
			const pair = pointerPair();
			const center = pairCenter(pair);
			const rect = stage.getBoundingClientRect();
			setZoom(pinchZoom * pairDistance(pair) / pinchDistance);
			stage.scrollLeft = wrap.offsetLeft + pinchContentX * zoom - (center.x - rect.left);
			stage.scrollTop = wrap.offsetTop + pinchContentY * zoom - (center.y - rect.top);
		} else if (panPointerId === event.pointerId) {
			stage.scrollLeft = panScrollLeft - (event.clientX - panPointerX);
			stage.scrollTop = panScrollTop - (event.clientY - panPointerY);
		}
		event.preventDefault();
	});
	const stopPanning = (event) => {
		if (!pointers.delete(event.pointerId)) return;
		if (pointers.size >= 2) beginPinch();
		else if (pointers.size === 1) {
			const [remaining] = pointers.entries();
			beginPan(remaining[0], remaining[1]);
		} else {
			panPointerId = void 0;
			stage.dataset.panning = "false";
		}
	};
	stage.addEventListener("pointerup", stopPanning);
	stage.addEventListener("pointercancel", stopPanning);
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom * 1.15),
		zoomOut: () => setZoom(zoom / 1.15),
		resetZoom: fitToStage,
		setZoom,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	context?.registerThumbnailAdapter?.({
		captureSource: "rendered",
		getTarget: () => canvas
	});
	context?.registerExportAdapter?.({
		print: true,
		exportHtml: false,
		getPrintMaskPages: () => [shell]
	});
	drawMerged();
	const resizeObserver = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(() => {
		if (!destroyed && !userAdjustedZoom) fitToStage();
	});
	resizeObserver?.observe(stage);
	const initialFitFrame = documentRef.defaultView?.requestAnimationFrame(() => {
		if (!destroyed) fitToStage();
	});
	return {
		$el: root,
		unmount() {
			destroyed = true;
			renderRevision += 1;
			resizeObserver?.disconnect();
			if (initialFitFrame !== void 0) documentRef.defaultView?.cancelAnimationFrame(initialFitFrame);
			context?.signal?.removeEventListener("abort", abort);
			documentRef.removeEventListener("keydown", closeLayersOnEscape);
			context?.registerThumbnailAdapter?.(null);
			context?.registerExportAdapter?.(null);
			unregisterFileViewerZoomProvider(root);
			clearLayerCache();
			session.destroy();
			canvas.width = 0;
			canvas.height = 0;
			compositeCanvas.width = 0;
			compositeCanvas.height = 0;
			target.replaceChildren();
		}
	};
}
//#endregion
export { renderPhotoshop as default };
