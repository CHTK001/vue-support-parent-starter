import { a as kObject, i as TypstDefaultParams, r as LazyWasmModule, t as buildComponent } from "./init-zZuBQJ8_.js";
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/render/canvas/view.mjs
/** @internal */
var RenderView = class {
	pageInfos;
	loadPageCount;
	imageScaleFactor;
	container;
	canvasList;
	textLayerList;
	commonList;
	textLayerParentList;
	semanticLayerList;
	constructor(pageInfos, container, options) {
		this.pageInfos = pageInfos;
		this.imageScaleFactor = options.pixelPerPt ?? TypstDefaultParams.PIXEL_PER_PT;
		container.innerHTML = "";
		container.style.width = "100%";
		this.container = container;
		this.canvasList = new Array(this.loadPageCount);
		this.textLayerList = new Array(this.loadPageCount);
		this.commonList = new Array(this.loadPageCount);
		this.textLayerParentList = new Array(this.loadPageCount);
		this.semanticLayerList = new Array(this.loadPageCount);
		const createOver = (i, pageAst, commonDiv) => {
			const width = Math.ceil(pageAst.width) * this.imageScaleFactor;
			const height = Math.ceil(pageAst.height) * this.imageScaleFactor;
			const canvas = this.canvasList[i] = document.createElement("canvas");
			const semanticLayer = this.semanticLayerList[i] = document.createElement("div");
			const textLayer = this.textLayerList[i] = document.createElement("div");
			const textLayerParent = this.textLayerParentList[i] = document.createElement("div");
			if (canvas.getContext("2d")) {
				const canvasDiv = document.createElement("div");
				canvas.width = width;
				canvas.height = height;
				canvasDiv.appendChild(canvas);
				commonDiv.appendChild(canvasDiv);
				canvasDiv.style.position = "absolute";
			}
			{
				textLayerParent.appendChild(textLayer);
				textLayerParent.className = "typst-html-semantics";
				const containerWidth = container.offsetWidth;
				const originalScale = containerWidth / pageAst.width;
				textLayerParent.style.width = `${containerWidth}px`;
				textLayerParent.style.height = `${pageAst.height * originalScale}px`;
				textLayerParent.style.setProperty("--data-text-width", `${originalScale}px`);
				textLayerParent.style.setProperty("--data-text-height", `${originalScale}px`);
				commonDiv.classList.add("typst-page");
				commonDiv.classList.add("canvas");
				commonDiv.style.width = `${containerWidth}px`;
				commonDiv.style.height = `${height * originalScale}px`;
				commonDiv.style.position = "relative";
				semanticLayer.appendChild(textLayerParent);
				commonDiv.appendChild(semanticLayer);
			}
		};
		for (let i = 0; i < this.pageInfos.length; i++) {
			const pageAst = this.pageInfos[i];
			let commonDiv = void 0;
			commonDiv = this.commonList[i] = document.createElement("div");
			container.appendChild(commonDiv);
			createOver(i, pageAst, commonDiv);
		}
	}
	resetLayout() {
		for (let i = 0; i < this.pageInfos.length; i++) {
			const pageAst = this.pageInfos[i];
			const width = Math.ceil(pageAst.width) * this.imageScaleFactor;
			const height = Math.ceil(pageAst.height) * this.imageScaleFactor;
			const canvasDiv = this.canvasList[i].parentElement;
			if (!canvasDiv) throw new Error(`canvasDiv is null for page ${i}, canvas list length ${this.canvasList.length}`);
			const commonDiv = this.commonList[i];
			const textLayerParent = this.textLayerParentList[i];
			const containerWidth = this.container.offsetWidth;
			const originalScale = containerWidth / width;
			textLayerParent.style.width = `${containerWidth}px`;
			textLayerParent.style.height = `${height * originalScale}px`;
			commonDiv.style.width = `${containerWidth}px`;
			commonDiv.style.height = `${height * originalScale}px`;
			const currentScale = this.container.offsetWidth / width;
			canvasDiv.style.transformOrigin = "0px 0px";
			canvasDiv.style.transform = `scale(${currentScale})`;
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/contrib/dom/typst-doc.mjs
var PreviewMode;
(function(PreviewMode) {
	PreviewMode[PreviewMode["Doc"] = 0] = "Doc";
	PreviewMode[PreviewMode["Slide"] = 1] = "Slide";
})(PreviewMode || (PreviewMode = {}));
var TypstDocumentContext = class TypstDocumentContext {
	hookedElem;
	kModule;
	opts;
	modes = [];
	partialRendering = true;
	renderMode = "svg";
	r = void 0;
	previewMode = PreviewMode.Doc;
	isContentPreview = false;
	isMixinOutline = false;
	backgroundColor = "black";
	pageColor = "white";
	pixelPerPt = 3;
	retrieveDOMState;
	isRendering = false;
	moduleInitialized = false;
	patchQueue = [];
	disposeList = [];
	canvasRenderCToken;
	currentRealScale = 1;
	currentScaleRatio = 1;
	vpTimeout = void 0;
	sampledRenderTime = 0;
	partialRenderPage = 0;
	outline = void 0;
	cursorPosition = void 0;
	cachedDOMState = {
		width: 0,
		height: 0,
		window: {
			innerWidth: 0,
			innerHeight: 0
		},
		boundingRect: {
			left: 0,
			top: 0,
			right: 0
		}
	};
	constructor(opts) {
		this.hookedElem = opts.hookedElem;
		this.kModule = opts.kModule;
		this.opts = opts || {};
		{
			const { renderMode, previewMode, isContentPreview, retrieveDOMState } = opts || {};
			this.partialRendering = false;
			this.renderMode = renderMode ?? this.renderMode;
			this.previewMode = previewMode ?? this.previewMode;
			this.isContentPreview = isContentPreview || false;
			this.retrieveDOMState = retrieveDOMState ?? (() => {
				return {
					width: this.hookedElem.offsetWidth,
					height: this.hookedElem.offsetHeight,
					window: {
						innerWidth: window.innerWidth,
						innerHeight: window.innerHeight
					},
					boundingRect: this.hookedElem.getBoundingClientRect()
				};
			});
			this.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--typst-preview-background-color");
		}
		this.hookedElem.classList.add("hide-scrollbar-x");
		this.hookedElem.parentElement?.classList.add("hide-scrollbar-x");
		if (this.previewMode === PreviewMode.Slide) {
			this.hookedElem.classList.add("hide-scrollbar-y");
			this.hookedElem.parentElement?.classList.add("hide-scrollbar-y");
		}
		this.installCtrlWheelHandler();
	}
	reset() {
		this.kModule.reset();
		this.moduleInitialized = false;
	}
	dispose() {
		const disposeList = this.disposeList;
		this.disposeList = [];
		disposeList.forEach((x) => x());
	}
	static derive(ctx, mode) {
		return [
			"rescale",
			"rerender",
			"postRender"
		].reduce((acc, x) => {
			acc[x] = ctx[`${x}$${mode}`].bind(ctx);
			console.assert(acc[x] !== void 0, `${x}$${mode} is undefined`);
			return acc;
		}, {});
	}
	registerMode(mode) {
		const facade = TypstDocumentContext.derive(this, mode);
		this.modes.push([mode, facade]);
		if (mode === this.renderMode) this.r = facade;
	}
	installCtrlWheelHandler() {
		const factors = [
			.1,
			.2,
			.3,
			.4,
			.5,
			.6,
			.7,
			.8,
			.9,
			1,
			1.1,
			1.3,
			1.5,
			1.7,
			1.9,
			2.1,
			2.4,
			2.7,
			3,
			3.3,
			3.7,
			4.1,
			4.6,
			5.1,
			5.7,
			6.3,
			7,
			7.7,
			8.5,
			9.4,
			10
		];
		const wheelEventHandler = (event) => {
			if (event.ctrlKey) {
				event.preventDefault();
				this.cachedDOMState = this.retrieveDOMState();
				if (window.onresize !== null) window.onresize = null;
				const prevScaleRatio = this.currentScaleRatio;
				if (event.deltaY < 0) if (this.currentScaleRatio >= factors.at(-1)) return;
				else this.currentScaleRatio = factors.filter((x) => x > this.currentScaleRatio).at(0);
				else if (event.deltaY > 0) if (this.currentScaleRatio <= factors.at(0)) return;
				else this.currentScaleRatio = factors.filter((x) => x < this.currentScaleRatio).at(-1);
				else return;
				const scrollFactor = this.currentScaleRatio / prevScaleRatio;
				const scrollX = event.pageX * (scrollFactor - 1);
				const scrollY = event.pageY * (scrollFactor - 1);
				if (Math.abs(this.currentScaleRatio - 1) < 1e-5) {
					this.hookedElem.classList.add("hide-scrollbar-x");
					this.hookedElem.parentElement?.classList.add("hide-scrollbar-x");
					if (this.previewMode === PreviewMode.Slide) {
						this.hookedElem.classList.add("hide-scrollbar-y");
						this.hookedElem.parentElement?.classList.add("hide-scrollbar-y");
					}
				} else {
					this.hookedElem.classList.remove("hide-scrollbar-x");
					this.hookedElem.parentElement?.classList.remove("hide-scrollbar-x");
					if (this.previewMode === PreviewMode.Slide) {
						this.hookedElem.classList.remove("hide-scrollbar-y");
						this.hookedElem.parentElement?.classList.remove("hide-scrollbar-y");
					}
				}
				const svg = this.hookedElem.firstElementChild;
				if (svg) {
					const scaleRatio = this.getSvgScaleRatio();
					const dataHeight = Number.parseFloat(svg.getAttribute("data-height"));
					const scaledHeight = Math.ceil(dataHeight * scaleRatio);
					this.hookedElem.style.height = `${scaledHeight * 2}px`;
				}
				window.scrollBy(scrollX, scrollY);
				this.addViewportChange();
				return false;
			}
		};
		if (this.renderMode !== "dom") if (typeof acquireVsCodeApi !== "undefined") {
			window.addEventListener("wheel", wheelEventHandler, { passive: false });
			this.disposeList.push(() => {
				window.removeEventListener("wheel", wheelEventHandler);
			});
		} else {
			document.body.addEventListener("wheel", wheelEventHandler, { passive: false });
			this.disposeList.push(() => {
				document.body.removeEventListener("wheel", wheelEventHandler);
			});
		}
	}
	getSvgScaleRatio() {
		const svg = this.hookedElem.firstElementChild;
		if (!svg) return 0;
		const container = this.cachedDOMState;
		const svgWidth = Number.parseFloat(svg.getAttribute("data-width") || svg.getAttribute("width") || "1");
		const svgHeight = Number.parseFloat(svg.getAttribute("data-height") || svg.getAttribute("height") || "1");
		this.currentRealScale = this.previewMode === PreviewMode.Slide ? Math.min(container.width / svgWidth, container.height / svgHeight) : container.width / svgWidth;
		return this.currentRealScale * this.currentScaleRatio;
	}
	processQueue(svgUpdateEvent) {
		const eventName = svgUpdateEvent[0];
		switch (eventName) {
			case "new":
			case "diff-v1":
				if (eventName === "new") this.reset();
				this.kModule.manipulateData({
					action: "merge",
					data: svgUpdateEvent[1]
				});
				this.moduleInitialized = true;
				return true;
			case "viewport-change":
				if (!this.moduleInitialized) {
					console.log("viewport-change before initialization");
					return false;
				}
				return true;
			default:
				console.log("svgUpdateEvent", svgUpdateEvent);
				return false;
		}
	}
	triggerUpdate() {
		if (this.isRendering) return;
		this.isRendering = true;
		const doUpdate = async () => {
			this.cachedDOMState = this.retrieveDOMState();
			if (this.patchQueue.length === 0) {
				this.isRendering = false;
				this.postprocessChanges();
				return;
			}
			try {
				let t0 = performance.now();
				const ctoken = this.canvasRenderCToken;
				if (ctoken) {
					await ctoken.cancel();
					await ctoken.wait();
					this.canvasRenderCToken = void 0;
					console.log("cancel canvas rendering");
				}
				let needRerender = false;
				while (this.patchQueue.length > 0) needRerender = this.processQueue(this.patchQueue.shift()) || needRerender;
				performance.now();
				if (needRerender) {
					this.r.rescale();
					await this.r.rerender();
					this.r.rescale();
				}
				let t2 = performance.now();
				this.sampledRenderTime = t2 - t0;
				requestAnimationFrame(doUpdate);
			} catch (e) {
				console.error(e);
				this.isRendering = false;
				this.postprocessChanges();
			}
		};
		requestAnimationFrame(doUpdate);
	}
	postprocessChanges() {
		this.r.postRender();
		if (this.previewMode === PreviewMode.Slide) document.querySelectorAll(".typst-page-number-indicator").forEach((x) => {
			x.textContent = `${this.kModule.retrievePagesInfo().length}`;
		});
	}
	addChangement(change) {
		if (change[0] === "new") this.patchQueue.splice(0, this.patchQueue.length);
		const pushChange = () => {
			this.vpTimeout = void 0;
			this.patchQueue.push(change);
			this.triggerUpdate();
		};
		if (this.vpTimeout !== void 0) clearTimeout(this.vpTimeout);
		if (change[0] === "viewport-change" && this.isRendering) this.vpTimeout = setTimeout(pushChange, this.sampledRenderTime || 100);
		else pushChange();
	}
	addViewportChange() {
		this.addChangement(["viewport-change", ""]);
	}
};
function provideDoc(Base) {
	return class TypstDocument {
		impl;
		kModule;
		constructor(options) {
			if (options.isContentPreview) options.renderMode = "canvas";
			this.kModule = options.kModule;
			this.impl = new Base(options);
			if (!this.impl.r) throw new Error(`mode is not supported, ${options?.renderMode}`);
			if (options.isContentPreview) {
				this.impl.partialRendering = true;
				this.impl.pixelPerPt = 1;
				this.impl.isMixinOutline = true;
			}
		}
		dispose() {
			this.impl.dispose();
		}
		reset() {
			this.impl.reset();
		}
		addChangement(change) {
			this.impl.addChangement(change);
		}
		addViewportChange() {
			this.impl.addViewportChange();
		}
		setPageColor(color) {
			this.impl.pageColor = color;
			this.addViewportChange();
		}
		setPartialRendering(partialRendering) {
			this.impl.partialRendering = partialRendering;
		}
		setCursor(page, x, y) {
			this.impl.cursorPosition = [
				page,
				x,
				y
			];
		}
		setPartialPageNumber(page) {
			if (page <= 0 || page > this.kModule.retrievePagesInfo().length) return false;
			this.impl.partialRenderPage = page - 1;
			this.addViewportChange();
			return true;
		}
		getPartialPageNumber() {
			return this.impl.partialRenderPage + 1;
		}
		setOutineData(outline) {
			this.impl.outline = outline;
			this.addViewportChange();
		}
	};
}
function composeDoc(Base, ...mixins) {
	return mixins.reduce((acc, mixin) => mixin(acc), Base);
}
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/contrib/dom/typst-cancel.mjs
var TypstCancellationToken = class {
	isCancellationRequested = false;
	_onCancelled;
	_onCancelledResolveResolved;
	constructor() {
		let resolveT = void 0;
		let resolveX = void 0;
		this._onCancelled = new Promise((resolve) => {
			resolveT = resolve;
			if (resolveX) resolveX(resolve);
		});
		this._onCancelledResolveResolved = new Promise((resolve) => {
			resolveX = resolve;
			if (resolveT) resolve(resolveT);
		});
	}
	async cancel() {
		await this._onCancelledResolveResolved;
		this.isCancellationRequested = true;
	}
	isCancelRequested() {
		return this.isCancellationRequested;
	}
	async consume() {
		(await this._onCancelledResolveResolved)();
	}
	wait() {
		return this._onCancelled;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/dom.mjs
var animationFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
var TrackMode;
(function(TrackMode) {
	TrackMode[TrackMode["Doc"] = 0] = "Doc";
	TrackMode[TrackMode["Pages"] = 1] = "Pages";
})(TrackMode || (TrackMode = {}));
var RepaintStage;
(function(RepaintStage) {
	RepaintStage[RepaintStage["Layout"] = 0] = "Layout";
	RepaintStage[RepaintStage["Svg"] = 1] = "Svg";
	RepaintStage[RepaintStage["Semantics"] = 2] = "Semantics";
	RepaintStage[RepaintStage["PrepareCanvas"] = 3] = "PrepareCanvas";
	RepaintStage[RepaintStage["Canvas"] = 4] = "Canvas";
})(RepaintStage || (RepaintStage = {}));
function provideDomDoc(Base) {
	return class DomDocument extends Base {
		tmpl = document.createElement("template");
		stub = this.createElement("<stub></stub>");
		plugin;
		docKernel;
		resourceHeader = void 0;
		pages = [];
		domScale = 1;
		track_mode = TrackMode.Doc;
		current_task = void 0;
		viewport;
		constructor(...args) {
			super(...args);
			this.registerMode("dom");
			this.disposeList.push(() => {
				this.dispose();
			});
			this.plugin = this.opts.renderer;
			if (this.opts.domScale !== void 0) {
				if (this.opts.domScale <= 0) throw new Error("domScale must be positive");
				this.domScale = this.opts.domScale;
			}
		}
		dispose() {
			for (const page of this.pages) page.dispose();
			if (this.docKernel) this.docKernel.free();
		}
		createElement(tmpl) {
			this.tmpl.innerHTML = tmpl;
			return this.tmpl.content.firstElementChild;
		}
		async mountDom(pixelPerPt) {
			if (this.docKernel) throw new Error("already mounted");
			this.hookedElem.innerHTML = `<svg class="typst-svg-resources" viewBox="0 0 0 0" width="0" height="0" style="opacity: 0; position: absolute;"></svg>`;
			this.resourceHeader = this.hookedElem.querySelector(".typst-svg-resources");
			this.docKernel = await this.plugin.renderer.mount_dom(this.kModule[kObject], this.hookedElem);
			this.docKernel.bind_functions({ populateGlyphs: (data) => {
				let content = this.createElement(data).firstElementChild;
				this.resourceHeader.append(content);
			} });
		}
		async cancelAnyway$dom() {
			if (this.current_task) {
				const task = this.current_task;
				this.current_task = void 0;
				await task.cancel();
			}
		}
		retrieveDOMPages() {
			return Array.from(this.hookedElem.querySelectorAll(".typst-dom-page"));
		}
		postRender$dom() {}
		rescale$dom() {}
		getDomViewport(cachedWindow, cachedBoundingRect) {
			const left = cachedBoundingRect.left;
			const top = -cachedBoundingRect.top;
			const right = cachedBoundingRect.right;
			const bottom = cachedWindow.innerHeight - cachedBoundingRect.top;
			const rect = {
				x: 0,
				y: top / this.domScale,
				width: Math.max(right - left, 0) / this.domScale,
				height: Math.max(bottom - top, 0) / this.domScale
			};
			if (rect.width <= 0 || rect.height <= 0) rect.x = rect.y = rect.width = rect.height = 0;
			return rect;
		}
		async rerender$dom() {
			const domState = this.retrieveDOMState();
			const { x, y, width, height } = this.getDomViewport(domState.window, domState.boundingRect);
			if (!await this.docKernel.relayout(x, y, width, height)) return;
			const cancel = new TypstCancellationToken();
			this.doRender$dom(cancel);
			this.current_task = cancel;
		}
		async doRender$dom(ctx) {
			const condOrExit = (needFrame, cb) => {
				if (needFrame && !ctx.isCancelRequested() && cb) return cb();
			};
			const pages = this.retrieveDOMPages().map((page) => {
				const { innerWidth, innerHeight } = window;
				const browserBBox = page.getBoundingClientRect();
				return {
					inWindow: !(browserBBox.left > innerWidth || browserBBox.right < 0 || browserBBox.top > innerHeight || browserBBox.bottom < 0),
					page
				};
			});
			const renderPage = async (i) => {
				await animationFrame();
				if (ctx.isCancelRequested()) return;
				const page = pages[i].page;
				const browserBBox = page.getBoundingClientRect();
				const v = this.getDomViewport(window, browserBBox);
				const needCalc = (stage) => this.docKernel.need_repaint(i, v.x, v.y, v.width, v.height, stage);
				const repaint = (stage) => this.docKernel.repaint(i, v.x, v.y, v.width, v.height, stage);
				const calc = (stage) => {
					if (ctx.isCancelRequested()) return;
					return condOrExit(needCalc(stage), () => repaint(stage));
				};
				await calc(RepaintStage.Layout);
				const wScale = (browserBBox.width ? Number.parseFloat(page.getAttribute("data-width")) / browserBBox.width : 1) * this.domScale;
				const hScale = (browserBBox.height ? Number.parseFloat(page.getAttribute("data-height")) / browserBBox.height : 1) * this.domScale;
				v.x *= wScale;
				v.y *= hScale;
				v.y -= 100;
				v.width *= wScale;
				v.height *= hScale;
				v.height += 200;
				await calc(RepaintStage.Svg);
				await calc(RepaintStage.Semantics);
				if (ctx.isCancelRequested()) return;
				if (needCalc(RepaintStage.PrepareCanvas)) {
					const calcCanvasAfterPreparing = async () => {
						await repaint(RepaintStage.PrepareCanvas);
						if (ctx.isCancelRequested()) return;
						return calc(RepaintStage.Canvas);
					};
					calcCanvasAfterPreparing();
				} else await calc(RepaintStage.Canvas);
			};
			const renderPages = async (inWindow) => {
				for (let idx = 0; idx < pages.length; ++idx) {
					if (ctx.isCancelRequested()) return;
					if (pages[idx].inWindow === inWindow) await renderPage(idx);
				}
			};
			this.cancelAnyway$dom();
			await renderPages(true);
			await renderPages(false);
			if (ctx.isCancelRequested()) return;
		}
	};
}
var TypstDomDocument = class extends provideDoc(composeDoc(TypstDocumentContext, provideDomDoc)) {};
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/renderer.mjs
/**
* The session of a Typst document.
* @property {string} backgroundColor - The background color of the Typst
* document.
* @property {number} pixelPerPt - The pixel per point scale up the image.
*
*/
var RenderSession = class {
	plugin;
	/**
	* @internal
	*/
	[kObject];
	/**
	* @internal
	*/
	constructor(plugin, o) {
		this.plugin = plugin;
		this[kObject] = o;
	}
	/**
	* @deprecated set in {@link RenderToCanvasOptions} instead
	*
	* Set the background color of the Typst document.
	* @param {string} t - The background color in format of `^#?[0-9a-f]{6}$`
	*
	* Note: Default to `#ffffff`.
	*
	* Note: Only available in canvas rendering mode.
	*/
	set backgroundColor(t) {
		if (t !== void 0) this[kObject].background_color = t;
	}
	/**
	* Get the background color of the Typst document.
	*
	* Note: Default to `#ffffff`.
	*
	* Note: Only available in canvas rendering mode.
	*/
	get backgroundColor() {
		return this[kObject].background_color;
	}
	/**
	* Set the pixel per point scale up the canvas panel.
	*
	* Note: Default to `3`.
	*
	* Note: Only available in canvas rendering mode.
	*/
	set pixelPerPt(t) {
		if (t !== void 0) this[kObject].pixel_per_pt = t;
	}
	/**
	* @deprecated set in {@link RenderToCanvasOptions} instead
	*
	* Get the pixel per point scale up the canvas panel.
	*
	* Note: Default to `3`.
	*
	* Note: Only available in canvas rendering mode.
	*/
	get pixelPerPt() {
		return this[kObject].pixel_per_pt;
	}
	/**
	* Reset state
	*/
	reset() {
		this.plugin.resetSession(this);
	}
	/**
	* @deprecated
	* use {@link docWidth} instead
	*/
	get doc_width() {
		return this[kObject].doc_width;
	}
	get docWidth() {
		return this[kObject].doc_width;
	}
	/**
	* @deprecated
	* use {@link docHeight} instead
	*/
	get doc_height() {
		return this[kObject].doc_height;
	}
	get docHeight() {
		return this[kObject].doc_height;
	}
	retrievePagesInfo() {
		const pages_info = this[kObject].pages_info;
		const pageInfos = [];
		const pageCount = pages_info.page_count;
		for (let i = 0; i < pageCount; i++) {
			const pageAst = pages_info.page(i);
			pageInfos.push({
				pageOffset: pageAst.page_off,
				width: pageAst.width_pt,
				height: pageAst.height_pt
			});
		}
		return pageInfos;
	}
	getSourceLoc(path) {
		return this[kObject].source_span(path);
	}
	/**
	* See {@link TypstRenderer#renderSvg} for more details.
	*/
	renderSvg(options) {
		return this.plugin.renderSvg({
			renderSession: this,
			...options
		});
	}
	/**
	* See {@link TypstRenderer#renderToSvg} for more details.
	*/
	renderToSvg(options) {
		return this.plugin.renderToSvg({
			renderSession: this,
			...options
		});
	}
	/**
	* See {@link TypstRenderer#renderCanvas} for more details.
	*/
	renderCanvas(options) {
		return this.plugin.renderCanvas({
			renderSession: this,
			...options
		});
	}
	/**
	* See {@link TypstRenderer#manipulateData} for more details.
	*/
	manipulateData(opts) {
		this.plugin.manipulateData({
			renderSession: this,
			...opts
		});
	}
	/**
	* See {@link TypstRenderer#renderSvgDiff} for more details.
	*/
	renderSvgDiff(opts) {
		return this.plugin.renderSvgDiff({
			renderSession: this,
			...opts
		});
	}
	/**
	* @deprecated
	* use {@link getSourceLoc} instead
	*/
	get_source_loc(path) {
		return this[kObject].source_span(path);
	}
	/**
	* @deprecated
	* use {@link renderSvgDiff} instead
	*/
	render_in_window(rect_lo_x, rect_lo_y, rect_hi_x, rect_hi_y) {
		return this[kObject].render_in_window(rect_lo_x, rect_lo_y, rect_hi_x, rect_hi_y);
	}
	/**
	* @deprecated
	* use {@link manipulateData} instead
	*/
	merge_delta(data) {
		this.plugin.manipulateData({
			renderSession: this,
			action: "merge",
			data
		});
	}
};
/**
* @internal
*/
var ManageStatus;
(function(ManageStatus) {
	ManageStatus[ManageStatus["Delete"] = 0] = "Delete";
	ManageStatus[ManageStatus["New"] = 1] = "New";
	ManageStatus[ManageStatus["Update"] = 2] = "Update";
})(ManageStatus || (ManageStatus = {}));
var TypstWorker = class {
	plugin;
	/**
	* @internal
	*/
	[kObject];
	/**
	* @internal
	*/
	constructor(plugin, o) {
		this.plugin = plugin;
		this[kObject] = o;
	}
	/**
	* See {@link TypstRenderer#manipulateData} for more details.
	*/
	manipulateData(action, data) {
		return this[kObject].manipulate_data(action, data);
	}
	/**
	* @internal
	*/
	managedCanvasElemList = /* @__PURE__ */ new Map();
	/**
	* @internal
	*/
	canvasCounter = Math.random();
	/**
	* You must submit all canvas in pages to ensure synchronization with the background worker
	*
	* See {@link TypstRenderer#renderCanvas} for more details.
	*/
	renderCanvas(canvasElemList) {
		const m = this.managedCanvasElemList;
		for (const [_, elem] of m) elem[0] = ManageStatus.Delete;
		for (const elem of canvasElemList) {
			const canvas = elem.canvas;
			let elemId = canvas.dataset.manageId;
			let action = ManageStatus.Update;
			if (!elemId) {
				elemId = this.canvasCounter.toFixed(5);
				this.canvasCounter += 1;
				canvas.dataset.manageId = elemId;
				action = ManageStatus.New;
			}
			let prev = m.get(elemId);
			if (prev && prev[0] !== ManageStatus.Delete) throw new Error("cannot update a canvas for two times in batch");
			m.set(elemId, [action, { ...elem }]);
		}
		const entries = Array.from(m.entries());
		const actions = new Uint8Array(entries.length);
		const elements = new Array(entries.length);
		const options = entries.map(([key, [action, elem]], index) => {
			if (!action) m.delete(key);
			actions[index] = action;
			elements[index] = elem.canvas;
			return this.plugin.canvasOptionsToRust(elem);
		});
		return this[kObject].render_canvas(actions, elements, options);
	}
	async retrievePagesInfo() {
		const pages_info = await this[kObject].get_pages_info();
		console.log(pages_info);
		const pageInfos = [];
		const pageCount = pages_info.page_count;
		for (let i = 0; i < pageCount; i++) {
			const pageAst = pages_info.page(i);
			pageInfos.push({
				pageOffset: pageAst.page_off,
				width: pageAst.width_pt,
				height: pageAst.height_pt
			});
		}
		return pageInfos;
	}
};
var gRendererModule = (module) => new LazyWasmModule(async (bin) => {
	return await module.default(bin);
});
/**
* create a Typst renderer.
* @returns {TypstRenderer} - The Typst renderer.
* @example
* ```typescript
* import { createTypstRenderer } from 'typst';
* const renderer = createTypstRenderer();
* await renderer.init();
* await renderer.render({
*   container: document.getElementById('container'),
*   artifactContent: '{ ... }',
* });
* ```
*/
function createTypstRenderer() {
	return new TypstRendererDriver();
}
var warnOnceCanvasSet = true;
/** @internal */
var TypstRendererDriver = class {
	renderer;
	rendererJs;
	constructor() {}
	async init(options) {
		this.rendererJs = await (options?.getWrapper?.() || import("./wasm-pack-shim-DEdA53wM.js"));
		const TypstRendererBuilder = this.rendererJs.TypstRendererBuilder;
		this.renderer = await buildComponent(options, gRendererModule(this.rendererJs), TypstRendererBuilder, {});
	}
	loadGlyphPack(_pack) {
		return Promise.resolve();
	}
	createOptionsToRust(options) {
		const rustOptions = new this.rendererJs.CreateSessionOptions();
		if (options.format !== void 0) rustOptions.format = options.format;
		if (options.artifactContent !== void 0) rustOptions.artifact_content = options.artifactContent;
		return rustOptions;
	}
	canvasOptionsToRust(options) {
		const rustOptions = new this.rendererJs.RenderPageImageOptions();
		if (options.pageOffset === void 0) throw new Error("pageOffset is required in reflexo v0.5.0");
		else rustOptions.page_off = options.pageOffset;
		if (options.cacheKey !== void 0) rustOptions.cache_key = options.cacheKey;
		if (options.backgroundColor !== void 0) rustOptions.background_color = options.backgroundColor;
		if (options.pixelPerPt !== void 0) rustOptions.pixel_per_pt = options.pixelPerPt;
		if (options.dataSelection !== void 0) {
			let encoded = 0;
			if (options.dataSelection.body) encoded |= 1;
			else if (options.canvas && warnOnceCanvasSet) {
				warnOnceCanvasSet = false;
				console.warn("dataSelection.body is not set but providing canvas for body");
			}
			if (options.dataSelection.text || options.dataSelection.annotation) console.error("dataSelection.text and dataSelection.annotation are deprecated");
			if (options.dataSelection.semantics) encoded |= 8;
			rustOptions.data_selection = encoded;
		}
		return rustOptions;
	}
	retrievePagesInfoFromSession(session) {
		return session.retrievePagesInfo();
	}
	/**
	* Render a Typst document to canvas.
	*/
	renderCanvas(options) {
		return this.withinOptionSession(options, async (sessionRef) => {
			return this.renderer.render_page_to_canvas(sessionRef[kObject], options.canvas || void 0, this.canvasOptionsToRust(options));
		});
	}
	async inAnimationFrame(fn) {
		return new Promise((resolve, reject) => {
			requestAnimationFrame(() => {
				try {
					resolve(fn());
				} catch (e) {
					reject(e);
				}
			});
		});
	}
	async renderDisplayLayer(session, canvasList, options) {
		const page_count = session[kObject].pages_info.page_count;
		const doRender = async (i, page_off) => {
			const ctx = canvasList[i].getContext("2d");
			if (!ctx) throw new Error("canvas context is null");
			return await this.renderCanvas({
				...options,
				canvas: ctx,
				renderSession: session,
				pageOffset: page_off
			});
		};
		const t = performance.now();
		const textContentList = await (async () => {
			const results = [];
			for (let i = 0; i < page_count; i++) results.push(await this.inAnimationFrame(() => doRender(i, i)));
			return results;
		})();
		const t2 = performance.now();
		console.log(`display layer used: render = ${(t2 - t).toFixed(1)}ms`);
		return textContentList;
	}
	renderTextLayer(layerList, textSourceList) {
		const t2 = performance.now();
		layerList.forEach((layer, i) => {
			layer.innerHTML = textSourceList[i].htmlSemantics[0];
		});
		const t3 = performance.now();
		console.log(`text layer used: render = ${(t3 - t2).toFixed(1)}ms`);
	}
	async render(options) {
		if ("format" in options) {
			if (options.format !== "vector") {
				if ([
					"serde_json",
					"js",
					"ir"
				].includes(options.format)) throw new Error(`deprecated format ${options.format}, please use vector format`);
			}
		}
		return this.renderToCanvas(options);
	}
	async renderDom(options) {
		if ("format" in options) {
			if (options.format !== "vector") {
				if ([
					"serde_json",
					"js",
					"ir"
				].includes(options.format)) throw new Error(`deprecated format ${options.format}, please use vector format`);
			}
		}
		return this.withinOptionSession(options, async (sessionRef) => {
			const t = new TypstDomDocument({
				...options,
				renderMode: "dom",
				hookedElem: options.container,
				kModule: sessionRef,
				renderer: this
			});
			await t.impl.mountDom(options.pixelPerPt);
			return t;
		});
	}
	async renderToCanvas(options) {
		let session;
		let renderPageResults;
		const mountContainer = options.container;
		mountContainer.style.visibility = "hidden";
		const doRenderDisplayLayer = async (canvasList, resetLayout) => {
			try {
				renderPageResults = await this.renderDisplayLayer(session, canvasList, options);
				resetLayout();
			} finally {
				mountContainer.style.visibility = "visible";
			}
		};
		return this.withinOptionSession(options, async (sessionRef) => {
			session = sessionRef;
			if (session[kObject].pages_info.page_count === 0) throw new Error(`No page found in session`);
			if (options.pixelPerPt !== void 0 && options.pixelPerPt <= 0) throw new Error("Invalid typst.RenderOptions.pixelPerPt, should be a positive number " + options.pixelPerPt);
			let backgroundColor = options.backgroundColor;
			if (backgroundColor !== void 0) {
				if (!/^#[0-9a-f]{6}$/.test(backgroundColor)) throw new Error("Invalid typst.backgroundColor color for matching ^#?[0-9a-f]{6}$ " + backgroundColor);
			}
			session.pixelPerPt = options.pixelPerPt ?? TypstDefaultParams.PIXEL_PER_PT;
			session.backgroundColor = backgroundColor ?? "#ffffff";
			const t = performance.now();
			const pageView = new RenderView(this.retrievePagesInfoFromSession(session), mountContainer, options);
			const t2 = performance.now();
			console.log(`layer used: retrieve = ${(t2 - t).toFixed(1)}ms`);
			await doRenderDisplayLayer(pageView.canvasList, () => pageView.resetLayout());
			this.renderTextLayer(pageView.textLayerList, renderPageResults);
		});
	}
	createModule(b) {
		return Promise.resolve(new RenderSession(this, this.renderer.create_session(b && this.createOptionsToRust({
			format: "vector",
			artifactContent: b
		}))));
	}
	async createWorkerV0(worker) {
		return new TypstWorker(this, await this.renderer.create_worker(worker));
	}
	workerBridge() {
		return this.renderer.create_worker_bridge();
	}
	renderSvg(options, container) {
		if (options instanceof RenderSession || container) throw new Error("removed api, please use renderToSvg({ renderSession, container }) instead");
		return this.withinOptionSession(options, async (sessionRef) => {
			let parts = void 0;
			if (options.data_selection) {
				parts = 0;
				if (options.data_selection.body) parts |= 1;
				if (options.data_selection.defs) parts |= 2;
				if (options.data_selection.css) parts |= 4;
				if (options.data_selection.js) parts |= 8;
			}
			return Promise.resolve(this.renderer.svg_data(sessionRef[kObject], parts));
		});
	}
	renderSvgDiff(options) {
		if (!options.window) return this.renderer.render_svg_diff(options.renderSession[kObject], 0, 0, 1e33, 1e33);
		return this.renderer.render_svg_diff(options.renderSession[kObject], options.window.lo.x, options.window.lo.y, options.window.hi.x, options.window.hi.y);
	}
	renderToSvg(options) {
		return this.withinOptionSession(options, async (sessionRef) => {
			return Promise.resolve(this.renderer.render_svg(sessionRef[kObject], options.container));
		});
	}
	getCustomV1(options) {
		return Promise.resolve(this.renderer.get_customs(options.renderSession[kObject]));
	}
	resetSession(session) {
		return this.renderer.reset(session[kObject]);
	}
	manipulateData(opts) {
		return this.renderer.manipulate_data(opts.renderSession[kObject], opts.action ?? "reset", opts.data);
	}
	withinOptionSession(options, fn) {
		function isRenderByContentOption(options) {
			return "artifactContent" in options;
		}
		if ("renderSession" in options) return fn(options.renderSession);
		if (isRenderByContentOption(options)) return this.runWithSession(options, fn);
		throw new Error("Invalid render options, should be one of RenderByContentOptions|RenderBySessionOptions");
	}
	async runWithSession(arg1, arg2) {
		let options = arg1;
		let fn = arg2;
		if (!arg2) {
			options = void 0;
			fn = arg1;
		}
		const session = this.renderer.create_session(options && this.createOptionsToRust(options));
		try {
			const res = await fn(new RenderSession(this, session));
			session.free();
			return res;
		} catch (e) {
			session.free();
			throw e;
		}
	}
};
//#endregion
export { createTypstRenderer as i, TypstRendererDriver as n, TypstWorker as r, RenderSession as t };
