import { $i as formatCssPixels, Bu as resolveFileViewerRuntimeAssetBaseUrl, Hs as unregisterFileViewerZoomProvider, Hu as resolveFileViewerTypstCompilerWasmUrl, Uu as resolveFileViewerTypstFontAssetsUrl, Wu as resolveFileViewerTypstRendererWasmUrl, Xi as sanitizeFileViewerSvgResources, fc as readFileViewerText, ho as createFileViewerTranslator, ts as createFileViewerZoomChangeEmitter, ud as __vitePreload, zs as registerFileViewerZoomProvider } from "./file-viewer-3d-ijA7B-Qe.js";
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/options.init.mjs
/** @internal */
var _textFonts = [
	"DejaVuSansMono-Bold.ttf",
	"DejaVuSansMono-BoldOblique.ttf",
	"DejaVuSansMono-Oblique.ttf",
	"DejaVuSansMono.ttf",
	"LibertinusSerif-Bold.otf",
	"LibertinusSerif-BoldItalic.otf",
	"LibertinusSerif-Italic.otf",
	"LibertinusSerif-Regular.otf",
	"LibertinusSerif-Semibold.otf",
	"LibertinusSerif-SemiboldItalic.otf",
	"NewCM10-Bold.otf",
	"NewCM10-BoldItalic.otf",
	"NewCM10-Italic.otf",
	"NewCM10-Regular.otf",
	"NewCMMath-Bold.otf",
	"NewCMMath-Book.otf",
	"NewCMMath-Regular.otf"
];
/** @internal */
var _cjkFonts = [
	"InriaSerif-Bold.ttf",
	"InriaSerif-BoldItalic.ttf",
	"InriaSerif-Italic.ttf",
	"InriaSerif-Regular.ttf",
	"Roboto-Regular.ttf",
	"NotoSerifCJKsc-Regular.otf"
];
/** @internal */
var _emojiFonts = ["TwitterColorEmoji.ttf", "NotoColorEmoji-Regular-COLR.subset.ttf"];
/**
* disable default font assets
*/
function disableDefaultFontAssets() {
	return loadFonts([], { assets: false });
}
/**
* preload font assets
*/
function preloadFontAssets(options) {
	return loadFonts([], options);
}
function _resolveAssets(options) {
	const fonts = [];
	if (options && options?.assets !== false && options?.assets?.length && options?.assets?.length > 0) {
		let defaultPrefix = {
			text: "https://cdn.jsdelivr.net/gh/typst/typst-assets@v0.13.1/files/fonts/",
			_: "https://cdn.jsdelivr.net/gh/typst/typst-dev-assets@v0.13.1/files/fonts/"
		};
		let assetUrlPrefix = options.assetUrlPrefix ?? defaultPrefix;
		if (typeof assetUrlPrefix === "string") assetUrlPrefix = { _: assetUrlPrefix };
		else assetUrlPrefix = {
			...defaultPrefix,
			...assetUrlPrefix
		};
		for (const key of Object.keys(assetUrlPrefix)) {
			const u = assetUrlPrefix[key];
			if (u[u.length - 1] !== "/") assetUrlPrefix[key] = u + "/";
		}
		const prefix = (asset, f) => f.map((font) => (assetUrlPrefix[asset] || assetUrlPrefix["_"]) + font);
		for (const asset of options.assets) switch (asset) {
			case "text":
				fonts.push(...prefix(asset, _textFonts));
				break;
			case "cjk":
				fonts.push(...prefix(asset, _cjkFonts));
				break;
			case "emoji": fonts.push(...prefix(asset, _emojiFonts));
		}
	}
	return fonts;
}
/**
* load fonts
*
* @param fonts - url path to font files
* @returns {BeforeBuildFn}
* @example
* ```ts
* // preLoad fonts from remote url (because finto info is not provided)
* import { init, loadFonts } from 'typst';
* init({
*   beforeBuild: [
*     loadFonts([
*      'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2', // remote url
*      'dist/fonts/Roboto-Regular.ttf', // relative to the root of the website
*     ]),
*   ],
* });
* ```
* @example
* ```ts
* // lazily Load fonts from remote url. The font information is obtained by `getFontInfo`
* import { init, loadFonts } from 'typst';
* init({
*   beforeBuild: [
*     loadFonts([
*      {
*        info: [...]
*        url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2';
*      }
*     ]),
*   ],
* });
* ```
*/
function loadFonts(userFonts, options) {
	const assetFonts = _resolveAssets(options);
	const loader = async (_, { ref, builder }) => {
		if (options?.fetcher) ref.setFetcher(options.fetcher);
		await ref.loadFonts(builder, [...userFonts, ...assetFonts]);
	};
	loader._preloadRemoteFontOptions = options;
	loader._kind = "fontLoader";
	return loader;
}
/**
* (compile only) set pacoage registry
*
* @param accessModel: when compiling, the pacoage registry is used to access the
* data of files
* @returns {BeforeBuildFn}
*/
function withPackageRegistry(packageRegistry) {
	return async (_, { builder }) => {
		return new Promise((resolve) => {
			builder.set_package_registry(packageRegistry, function(spec) {
				return packageRegistry.resolve(spec, this);
			});
			resolve();
		});
	};
}
/**
* (compile only) set access model
*
* @param accessModel: when compiling, the access model is used to access the
* data of files
* @returns {BeforeBuildFn}
*/
function withAccessModel(accessModel) {
	return async (_, ctx) => {
		if (ctx.alreadySetAccessModel) throw new Error(`already set some assess model before: ${ctx.alreadySetAccessModel.constructor?.name}(${ctx.alreadySetAccessModel})`);
		ctx.alreadySetAccessModel = accessModel;
		return new Promise((resolve) => {
			ctx.builder.set_access_model(accessModel, (path) => {
				const lastModified = accessModel.getMTime(path);
				if (lastModified) return lastModified.getTime();
				return 0;
			}, (path) => {
				return accessModel.isFile(path) || false;
			}, (path) => {
				return accessModel.getRealPath(path) || path;
			}, (path) => {
				return accessModel.readAll(path);
			});
			resolve();
		});
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/internal.types.mjs
var kObject = Symbol.for("reflexo-obj");
var TypstDefaultParams;
(function(TypstDefaultParams) {
	TypstDefaultParams[TypstDefaultParams["PIXEL_PER_PT"] = 3] = "PIXEL_PER_PT";
})(TypstDefaultParams || (TypstDefaultParams = {}));
//#endregion
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
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/wasm.mjs
/**
* @internal
*/
var once = (fn) => {
	let called = false;
	let res;
	return () => {
		if (called) return res;
		called = true;
		return res = fn();
	};
};
/** @internal */
var LazyWasmModule = class {
	wasmBin;
	initOnce;
	constructor(initFn) {
		if (typeof initFn !== "function") throw new Error("initFn is not a function");
		this.initOnce = once(async () => {
			await initFn(this.wasmBin);
		});
	}
	async init(module) {
		this.wasmBin = module;
		await this.initOnce();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/init.mjs
var ComponentBuilder = class {
	loadedFonts = /* @__PURE__ */ new Set();
	fetcher = fetch;
	setFetcher(fetcher) {
		this.fetcher = fetcher;
	}
	async loadFonts(builder, fonts) {
		const escapeImport = new Function("m", "return import(m)");
		const fetcher = this.fetcher ||= await (async function() {
			const { fetchBuilder, FileSystemCache } = await escapeImport("node-fetch-cache");
			const cache = new FileSystemCache({ cacheDirectory: ".cache/typst/fonts" });
			const cachedFetcher = fetchBuilder.withCache(cache);
			return function(input, init) {
				const timeout = setTimeout(() => {
					console.warn("font fetching is stucking:", input);
				}, 15e3);
				return cachedFetcher(input, init).finally(() => {
					clearTimeout(timeout);
				});
			};
		})();
		const fontsToLoad = fonts.filter((font) => {
			if (font instanceof Uint8Array || typeof font === "object" && "info" in font) return true;
			if (this.loadedFonts.has(font)) return false;
			this.loadedFonts.add(font);
			return true;
		});
		const fontLists = await Promise.all(fontsToLoad.map(async (font) => {
			if (font instanceof Uint8Array) {
				await builder.add_raw_font(font);
				return;
			}
			if (typeof font === "object" && "info" in font) {
				await builder.add_lazy_font(font, "blob" in font ? font.blob : loadFontSync(font));
				return;
			}
			return new Uint8Array(await (await fetcher(font)).arrayBuffer());
		}));
		for (const font of fontLists) {
			if (!font) continue;
			await builder.add_raw_font(font);
		}
	}
	async build(options, builder, hooks) {
		const buildCtx = {
			ref: this,
			builder,
			hooks
		};
		for (const fn of options?.beforeBuild ?? []) await fn(void 0, buildCtx);
		if (hooks.latelyBuild) hooks.latelyBuild(buildCtx);
		return await builder.build();
	}
};
/** @internal */
async function buildComponent(options, gModule, Builder, hooks) {
	await gModule.init(options?.getModule?.());
	return await new ComponentBuilder().build(options, new Builder(), hooks);
}
/**
* Loads a font by a lazy font synchronously, which is required by the compiler.
* @param font
*/
function loadFontSync(font) {
	return () => {
		const xhr = new XMLHttpRequest();
		xhr.overrideMimeType("text/plain; charset=x-user-defined");
		xhr.open("GET", font.url, false);
		xhr.send(null);
		if (xhr.status === 200 && (xhr.response instanceof String || typeof xhr.response === "string")) return Uint8Array.from(xhr.response, (c) => c.charCodeAt(0));
		return /* @__PURE__ */ new Uint8Array();
	};
}
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
		this.rendererJs = await (options?.getWrapper?.() || __vitePreload(() => import("./wasm-pack-shim-DEdA53wM.js"), []));
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
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/fs/memory.mjs
var MemoryAccessModel = class {
	mTimes = /* @__PURE__ */ new Map();
	mData = /* @__PURE__ */ new Map();
	constructor() {}
	reset() {
		this.mTimes.clear();
		this.mData.clear();
	}
	insertFile(path, data, mtime) {
		this.mTimes.set(path, mtime);
		this.mData.set(path, data);
	}
	removeFile(path) {
		this.mTimes.delete(path);
		this.mData.delete(path);
	}
	getMTime(path) {
		if (!path.startsWith("/@memory/")) return;
		if (this.mTimes.has(path)) return this.mTimes.get(path);
	}
	isFile() {
		return true;
	}
	getRealPath(path) {
		return path;
	}
	readAll(path) {
		if (!path.startsWith("/@memory/")) return;
		if (this.mData.has(path)) return this.mData.get(path);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/fs/package.mjs
var FetchPackageRegistry = class {
	am;
	cache = /* @__PURE__ */ new Map();
	constructor(am) {
		this.am = am;
	}
	resolvePath(path) {
		return `https://packages.typst.org/preview/${path.name}-${path.version}.tar.gz`;
	}
	pullPackageData(path) {
		const request = new XMLHttpRequest();
		request.overrideMimeType("text/plain; charset=x-user-defined");
		request.open("GET", this.resolvePath(path), false);
		request.send(null);
		if (request.status === 200 && (request.response instanceof String || typeof request.response === "string")) return Uint8Array.from(request.response, (c) => c.charCodeAt(0));
	}
	resolve(spec, context) {
		if (spec.namespace !== "preview") return;
		const path = this.resolvePath(spec);
		if (this.cache.has(path)) return this.cache.get(path)();
		const data = this.pullPackageData(spec);
		if (!data) return;
		const previewDir = `/@memory/fetch/packages/${spec.namespace}/${spec.name}/${spec.version}`;
		const entries = [];
		context.untar(data, (path, data, mtime) => {
			entries.push([
				previewDir + "/" + path,
				data,
				new Date(mtime)
			]);
		});
		const cacheClosure = () => {
			for (const [path, data, mtime] of entries) this.am.insertFile(path, data, mtime);
			return previewDir;
		};
		this.cache.set(path, cacheClosure);
		return cacheClosure();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/compiler.mjs
/**
* Available formats for compiling the document.
*/
var CompileFormatEnum;
(function(CompileFormatEnum) {
	CompileFormatEnum[CompileFormatEnum["vector"] = 0] = "vector";
	CompileFormatEnum[CompileFormatEnum["pdf"] = 1] = "pdf";
	CompileFormatEnum[CompileFormatEnum["_dummy"] = 2] = "_dummy";
})(CompileFormatEnum || (CompileFormatEnum = {}));
var IncrementalServer = class {
	/**
	* @internal
	*/
	[kObject];
	/**
	* @internal
	*/
	constructor(s) {
		this[kObject] = s;
	}
	/**
	* Reset the incremental server to the initial state.
	*/
	reset() {
		this[kObject].reset();
	}
	/**
	* Return current result.
	*/
	current() {
		return this[kObject].current();
	}
	/**
	* Also attach the debug info to the result.
	*/
	setAttachDebugInfo(enable) {
		this[kObject].set_attach_debug_info(enable);
	}
};
var TypstFontResolverCons;
TypstFontResolverCons || (TypstFontResolverCons = {});
/**
* create a Typst font builder.
* @returns {TypstFontBuilder} - The Typst font builder.
* @example
* ```typescript
* import { createTypstFontBuilder } from 'typst';
* const fb = createTypstFontBuilder();
* await fb.init();
* await fb.addFontData(new Uint8Array(await fetch('font.ttf').then(r => r.arrayBuffer())));
* await fb.build();
* ```
*/
function createTypstFontBuilder() {
	return new TypstFontBuilderDriver();
}
var TypstWorld = class {
	[kObject];
	constructor(world) {
		this[kObject] = world;
	}
	/**
	* Compile the paged document.
	*
	* @param {DiagnosticsFormat} format - The format of the diagnostics.
	* @returns {Promise<{ diagnostics?: DiagnosticsData[DiagnosticsFormat][] }>} - The result of the compilation.
	*/
	compile(opts) {
		return this[kObject].compile(0, getDiagnosticsArg(opts?.diagnostics));
	}
	/**
	* Compile the paged document.
	*
	* @param {DiagnosticsFormat} format - The format of the diagnostics.
	* @returns {Promise<{ diagnostics?: DiagnosticsData[DiagnosticsFormat][] }>} - The result of the compilation.
	*/
	compileHtml(opts) {
		return this[kObject].compile(1, getDiagnosticsArg(opts?.diagnostics));
	}
	/**
	* Runs query on the paged document.
	*/
	async query(options) {
		return JSON.parse(this[kObject].query(0, options.selector, options.field));
	}
	/**
	* Get the title of the paged document.
	* Throw error if the world didn't compile the paged document.
	*
	* @returns {string | undefined} - The title of the paged document.
	*/
	title() {
		return this[kObject].title(0);
	}
	/**
	* Export the paged document as vector format.
	*
	* @returns {Uint8Array | undefined} - The title of the paged document.
	*/
	vector(opts) {
		return this[kObject].get_artifact(0, getDiagnosticsArg(opts?.diagnostics)) || {};
	}
	/**
	* Export the paged document to PDF.
	*
	* @returns {Uint8Array | undefined} - The title of the paged document.
	*/
	pdf(opts) {
		return this[kObject].get_artifact(1, getDiagnosticsArg(opts?.diagnostics)) || {};
	}
};
var gCompilerModule = (module) => new LazyWasmModule(async (bin) => {
	return await module.default(bin);
});
/**
* create a Typst compiler.
* @returns {TypstCompiler} - The Typst compiler.
* @example
* ```typescript
* import { createTypstCompiler } from 'typst';
* const compiler = createTypstCompiler();
* await compiler.init();
* compiler.addSource('/main.typ', 'Hello, typst!');
* await compiler.compile({ mainFilePath: '/main.typ' });
* ```
*/
function createTypstCompiler() {
	return new TypstCompilerDriver();
}
var TypstFontBuilderDriver = class {
	fontBuilderJs;
	fontBuilder;
	async init(options) {
		this.fontBuilderJs = await (options?.getWrapper?.() || __vitePreload(() => import("./wasm-pack-shim-yoeYwWJ3.js"), []));
		await gCompilerModule(this.fontBuilderJs).init(options?.getModule?.());
		this.fontBuilder = new this.fontBuilderJs.TypstFontResolverBuilder();
	}
	async getFontInfo(font_buffer) {
		return this.fontBuilder.get_font_info(font_buffer);
	}
	async addFontData(font_buffer) {
		this.fontBuilder.add_raw_font(font_buffer);
	}
	async addLazyFont(info, blob) {
		return this.fontBuilder.add_lazy_font(info, blob);
	}
	async build(cb) {
		const fonts = await this.fontBuilder.build();
		const result = await cb(fonts);
		fonts.free();
		return result;
	}
};
var TypstCompilerDriver = class TypstCompilerDriver {
	compiler;
	compilerJs;
	static defaultAssets = ["text"];
	constructor() {}
	async init(options) {
		this.compilerJs = await (options?.getWrapper?.() || __vitePreload(() => import("./wasm-pack-shim-yoeYwWJ3.js"), []));
		const TypstCompilerBuilder = this.compilerJs.TypstCompilerBuilder;
		const compilerOptions = { ...options || {} };
		const beforeBuild = compilerOptions.beforeBuild ??= [];
		const hasPreloadRemoteFonts = beforeBuild.some((fn) => fn._preloadRemoteFontOptions !== void 0);
		const hasSpecifiedAssets = beforeBuild.some((fn) => fn._preloadRemoteFontOptions?.assets !== void 0);
		const hasDisableAssets = beforeBuild.some((fn) => fn._preloadRemoteFontOptions?.assets === false);
		if (!hasPreloadRemoteFonts || !hasSpecifiedAssets && !hasDisableAssets) beforeBuild.push(loadFonts([], { assets: TypstCompilerDriver.defaultAssets }));
		if (!beforeBuild.some((fn) => fn._kind === "fontLoader")) throw new Error("TypstCompiler: no font loader found, please use font loaders, e.g. loadFonts or preloadSystemFonts");
		this.compiler = await buildComponent(options, gCompilerModule(this.compilerJs), TypstCompilerBuilder, {});
	}
	setFonts(fonts) {
		this.compiler.set_fonts(fonts);
	}
	compile(options) {
		return new Promise((resolve) => {
			const world = this.compiler.snapshot(options.root, options.mainFilePath, convertInputs(options.inputs));
			if ("incrementalServer" in options) {
				resolve(world.incr_compile(options.incrementalServer[kObject], getDiagnosticsArg(options.diagnostics)));
				return;
			}
			resolve(world.get_artifact(options.format || CompileFormatEnum.vector, getDiagnosticsArg(options.diagnostics)));
		});
	}
	async runWithWorld(options, cb) {
		const world = this.compiler.snapshot(options.root, options.mainFilePath, convertInputs(options.inputs));
		let result = await cb(new TypstWorld(world));
		world.free();
		return result;
	}
	query(options) {
		return this.runWithWorld(options, async (world) => {
			return JSON.parse(await world.query(options));
		});
	}
	getSemanticTokenLegend() {
		return new Promise((resolve) => {
			resolve(this.compiler.get_semantic_token_legend());
		});
	}
	getSemanticTokens(opts) {
		return new Promise((resolve) => {
			this.compiler.reset();
			resolve(this.compiler.get_semantic_tokens(opts.offsetEncoding || "utf-16", opts.mainFilePath, opts.resultId));
		});
	}
	async withIncrementalServer(f) {
		const srv = new IncrementalServer(this.compiler.create_incr_server());
		try {
			return await f(srv);
		} finally {
			srv[kObject].free();
		}
	}
	async getAst(mainFilePath) {
		return this.compiler.get_ast(mainFilePath);
	}
	async reset() {
		await new Promise((resolve) => {
			this.compiler.reset();
			resolve(void 0);
		});
	}
	addSource(path, source) {
		if (arguments.length > 2) throw new Error("use of addSource(path, source, isMain) is deprecated, please use addSource(path, source) instead");
		this.compiler.add_source(path, source);
	}
	mapShadow(path, content) {
		this.compiler.map_shadow(path, content);
	}
	unmapShadow(path) {
		this.compiler.unmap_shadow(path);
	}
	resetShadow() {
		this.compiler.reset_shadow();
	}
	renderPageToCanvas() {
		throw new Error("Please use the api TypstRenderer.renderToCanvas in v0.4.0");
	}
};
createTypstCompiler._impl = TypstCompilerDriver;
function convertInputs(inputs) {
	return inputs ? Object.entries(inputs) : void 0;
}
function getDiagnosticsArg(diagnostics) {
	switch (diagnostics) {
		case "none": return 1;
		case "unix": return 2;
		default: return 3;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/utils.mjs
/** @internal */
function randstr(prefix) {
	return Math.random().toString(36).replace("0.", prefix || "");
}
//#endregion
//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs
var isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;
/**
* Convenient util class for compiling documents, which is a wrapper of the
* {@link TypstCompiler} and {@link TypstRenderer}.
*
* Note: the interface of this class is less stable than {@link TypstCompiler}
* and {@link TypstRenderer}.
*
* @example
* Use the *global shared* compiler instance:
*
* ```typescript
* import { $typst } from '@myriaddreamin/typst.ts';
* ```
*
* Note: if you want to compile multiple documents, you should create a new
* instance for each compilation work or maintain the shared state on the
* utility instance `$typst` carefully, because the compilation process will
* change the state of that.
*
* @example
* Create an instance of utility:
*
* ```typescript
* const $typst = new TypstSnippet({
*   // optional renderer instance
*   renderer: enableRendering ?? (() => {
*     return createGlobalRenderer(createTypstRenderer,
*       undefined, initOptions);
*   }),
*   compiler() => {
*     return createGlobalCompiler(createTypstCompiler,
*       initOptions);
*   }
* });
* ```
*/
var TypstSnippet = class TypstSnippet {
	/** @internal */
	mainFilePath;
	/** @internal */
	cc;
	/** @internal */
	fr;
	/** @internal */
	ex;
	/**
	* Create a new instance of {@link TypstSnippet}.
	* @param cc the compiler instance, see {@link PromiseJust} and {@link TypstCompiler}.
	* @param ex the renderer instance, see {@link PromiseJust} and {@link TypstRenderer}.
	*
	* @example
	*
	* Passes a global shared compiler instance that get initialized lazily:
	* ```typescript
	* const $typst = new TypstSnippet(() => {
	*  return createGlobalCompiler(createTypstCompiler, initOptions);
	* });
	*
	*/
	constructor(options) {
		this.cc = options?.compiler || TypstSnippet.buildLocalCompiler;
		this.fr = options?.fontResolver || TypstSnippet.buildLocalFontResolver;
		this.ex = options?.renderer || TypstSnippet.buildLocalRenderer;
		this.mainFilePath = "/main.typ";
		this.providers = [];
	}
	/**
	* Set lazy initialized compiler instance for the utility instance.
	* @param cc the compiler instance, see {@link PromiseJust} and {@link TypstCompiler}.
	*/
	setCompiler(cc) {
		this.cc = cc;
	}
	async getFontResolver() {
		return typeof this.fr === "function" ? this.fr = await this.fr() : this.fr;
	}
	/**
	* Get an initialized compiler instance from the utility instance.
	*/
	async getCompiler() {
		return typeof this.cc === "function" ? this.cc = await this.cc() : this.cc;
	}
	async getCompilerReset() {
		const compiler = await this.getCompiler();
		await compiler.reset();
		return compiler;
	}
	/**
	* Set lazy initialized renderer instance for the utility instance.
	* @param ex the renderer instance, see {@link PromiseJust} and {@link TypstRenderer}.
	*/
	setRenderer(ex) {
		this.ex = ex;
	}
	/**
	* Get an initialized renderer instance from the utility instance.
	*/
	async getRenderer() {
		return typeof this.ex === "function" ? this.ex = await this.ex() : this.ex;
	}
	providers;
	/**
	* add providers for bullding the compiler or renderer component.
	*/
	use(...providers) {
		if (!this.providers) throw new Error("already prepare uses for instances");
		this.providers.push(...providers);
	}
	/**
	* todo: add docs
	*/
	static preloadFontFromUrl(fontUrl) {
		return TypstSnippet.preloadFonts([fontUrl]);
	}
	/**
	* todo: add docs
	*/
	static preloadFontData(fontData) {
		return TypstSnippet.preloadFonts([fontData]);
	}
	/**
	* todo: add docs
	*/
	static preloadFonts(userFonts) {
		return {
			key: "access-model",
			forRoles: ["compiler"],
			provides: [loadFonts(userFonts)]
		};
	}
	/**
	* don't load any default font assets.
	* todo: add docs
	*/
	static disableDefaultFontAssets() {
		return {
			key: "access-model",
			forRoles: ["compiler"],
			provides: [disableDefaultFontAssets()]
		};
	}
	/**
	* todo: add docs
	*/
	static preloadFontAssets(options) {
		return {
			key: "access-model",
			forRoles: ["compiler"],
			provides: [preloadFontAssets(options)]
		};
	}
	/**
	* Set accessl model for the compiler instance
	* @example
	*
	* use memory access model
	*
	* ```typescript
	* const m = new MemoryAccessModel();
	* $typst.use(TypstSnippet.withAccessModel(m));
	* ```
	*/
	static withAccessModel(accessModel) {
		return {
			key: "access-model",
			forRoles: ["compiler"],
			provides: [withAccessModel(accessModel)]
		};
	}
	/**
	* Set package registry for the compiler instance
	* @example
	*
	* use a customized package registry
	*
	* ```typescript
	* const n = new NodeFetchPackageRegistry();
	* $typst.use(TypstSnippet.withPackageRegistry(n));
	* ```
	*/
	static withPackageRegistry(registry) {
		return {
			key: "package-registry",
			forRoles: ["compiler"],
			provides: [withPackageRegistry(registry)]
		};
	}
	/**
	* Retrieve an access model to store the data of fetched files.
	* Provide a PackageRegistry instance for the compiler instance.
	*
	* @example
	*
	* use default (memory) access model
	*
	* ```typescript
	* $typst.use(await TypstSnippet.fetchPackageRegistry());
	* ```
	*
	* @example
	*
	* use external access model
	*
	* ```typescript
	* const m = new MemoryAccessModel();
	* $typst.use(TypstSnippet.withAccessModel(m), await TypstSnippet.fetchPackageRegistry(m));
	* ```
	*/
	static fetchPackageRegistry(accessModel) {
		const m = accessModel || new MemoryAccessModel();
		return {
			key: "package-registry$fetch",
			forRoles: ["compiler"],
			provides: [...accessModel ? [] : [withAccessModel(m)], withPackageRegistry(new FetchPackageRegistry(m))]
		};
	}
	/**
	* Retrieve a fetcher for fetching package data.
	* Provide a PackageRegistry instance for the compiler instance.
	* @example
	*
	* use a customized fetcher
	*
	* ```typescript
	* import request from 'sync-request-curl';
	* const m = new MemoryAccessModel();
	* $typst.use(TypstSnippet.withAccessModel(m), await TypstSnippet.fetchPackageBy(m, (_, httpUrl) => {
	*   const response = request('GET', this.resolvePath(path), {
	*     insecure: true,
	*   });
	*
	*   if (response.statusCode === 200) {
	*     return response.getBody(undefined);
	*   }
	*   return undefined;
	* }));
	* ```
	*/
	static fetchPackageBy(accessModel, fetcher) {
		class HttpPackageRegistry extends FetchPackageRegistry {
			pullPackageData(path) {
				return fetcher(path, this.resolvePath(path));
			}
		}
		return {
			key: "package-registry$lambda",
			forRoles: ["compiler"],
			provides: [withPackageRegistry(new HttpPackageRegistry(accessModel))]
		};
	}
	/** @internal */
	ccOptions;
	/**
	* Set compiler init options for initializing global instance {@link $typst}.
	* See {@link InitOptions}.
	*/
	setCompilerInitOptions(options) {
		this.requireIsUninitialized("compiler", this.cc);
		this.ccOptions = options;
	}
	/** @internal */
	exOptions;
	/**
	* Set renderer init options for initializing global instance {@link $typst}.
	* See {@link InitOptions}.
	*/
	setRendererInitOptions(options) {
		this.requireIsUninitialized("renderer", this.ex);
		this.exOptions = options;
	}
	/**
	* Set shared main file path.
	*/
	setMainFilePath(path) {
		this.mainFilePath = path;
	}
	/**
	* Get shared main file path.
	*/
	getMainFilePath() {
		return this.mainFilePath;
	}
	removeTmp(opts) {
		if (opts.mainFilePath.startsWith("/tmp/")) return this.unmapShadow(opts.mainFilePath);
		return Promise.resolve();
	}
	/**
	* Adds a font to the compiler.
	*
	* @example
	*
	* ```typescript
	* const fonts = await fetch('fontInfo.json').then(res => res.json());
	* $typst.addFonts(fonts.map(font => $typst.loadFont(font.url)));
	* ```
	*
	* @param fontInfos the font infos to add.
	*/
	async setFonts(fontInfos) {
		const fb = await this.getFontResolver();
		for (const font of fontInfos) await fb.addLazyFont(font, "blob" in font ? font.blob : loadFontSync(font), font);
		const compiler = await this.getCompiler();
		await fb.build(async (fonts) => compiler.setFonts(fonts));
	}
	/**
	* Add a source file to the compiler.
	* See {@link TypstCompiler#addSource}.
	*/
	async addSource(path, content) {
		(await this.getCompiler()).addSource(path, content);
	}
	/**
	* Reset the shadow files.
	* Note: this function is independent to the {@link reset} function.
	* See {@link TypstCompiler#resetShadow}.
	*/
	async resetShadow() {
		(await this.getCompiler()).resetShadow();
	}
	/**
	* Add a shadow file to the compiler.
	* See {@link TypstCompiler#mapShadow}.
	*/
	async mapShadow(path, content) {
		(await this.getCompiler()).mapShadow(path, content);
	}
	/**
	* Remove a shadow file from the compiler.
	* See {@link TypstCompiler#unmapShadow}.
	*/
	async unmapShadow(path) {
		(await this.getCompiler()).unmapShadow(path);
	}
	/**
	* Compile the document to vector (IR) format.
	* See {@link SweetCompileOptions}.
	*/
	async vector(o) {
		const opts = await this.getCompileOptions(o);
		return (await this.getCompilerReset()).compile(opts).then((res) => res.result).finally(() => this.removeTmp(opts));
	}
	/**
	* Compile the document to PDF format.
	* See {@link SweetCompileOptions}.
	*/
	async pdf(o) {
		const opts = await this.getCompileOptions(o);
		opts.format = CompileFormatEnum.pdf;
		return (await this.getCompilerReset()).compile(opts).then((res) => res.result).finally(() => this.removeTmp(opts));
	}
	/**
	* Compile the document to SVG format.
	* See {@link SweetRenderOptions} and {@link RenderSvgOptions}.
	*/
	async svg(o) {
		return this.transientRender(o, (renderer, renderSession) => renderer.renderSvg({
			...o,
			renderSession
		}));
	}
	/**
	* Compile the document to canvas operations.
	* See {@link SweetRenderOptions} and {@link RenderToCanvasOptions}.
	*/
	async canvas(container, o) {
		return this.transientRender(o, (renderer, renderSession) => renderer.renderToCanvas({
			container,
			...o,
			renderSession
		}));
	}
	/**
	* Get semantic tokens for the document.
	*/
	async query(o) {
		const opts = await this.getCompileOptions(o);
		return (await this.getCompilerReset()).query({
			...o,
			...opts
		}).finally(() => this.removeTmp(opts));
	}
	/**
	* Get token legend for semantic tokens.
	*/
	async getSemanticTokenLegend() {
		return (await this.getCompilerReset()).getSemanticTokenLegend();
	}
	/**
	* Get semantic tokens for the document.
	* See {@link SweetCompileOptions}.
	* See {@link TypstCompiler#getSemanticTokens}.
	*/
	async getSemanticTokens(o) {
		const opts = await this.getCompileOptions(o);
		return (await this.getCompilerReset()).getSemanticTokens({
			mainFilePath: opts.mainFilePath,
			resultId: o.resultId
		}).finally(() => this.removeTmp(opts));
	}
	async getCompileOptions(opts) {
		if (opts === void 0) return {
			mainFilePath: this.mainFilePath,
			diagnostics: "none"
		};
		else if (typeof opts === "string") throw new Error(`please specify opts as {mainContent: '...'} or {mainFilePath: '...'}`);
		else if ("mainFilePath" in opts) return {
			...opts,
			diagnostics: "none"
		};
		else {
			const destFile = `/tmp/${randstr()}.typ`;
			await this.addSource(destFile, opts.mainContent);
			return {
				mainFilePath: destFile,
				inputs: opts.inputs,
				diagnostics: "none"
			};
		}
	}
	async getVector(o) {
		if (o && "vectorData" in o) return o.vectorData;
		const opts = await this.getCompileOptions(o);
		return (await this.getCompiler()).compile(opts).then((res) => res.result).finally(() => this.removeTmp(opts));
	}
	async transientRender(opts, f) {
		const rr = await this.getRenderer();
		if (!rr) throw new Error("does not provide renderer instance");
		const data = await this.getVector(opts);
		return await rr.runWithSession(async (session) => {
			rr.manipulateData({
				renderSession: session,
				action: "reset",
				data
			});
			return f(rr, session);
		});
	}
	prepareUseOnce = void 0;
	async prepareUse() {
		if (this.prepareUseOnce) return this.prepareUseOnce;
		return this.prepareUseOnce = this.doPrepareUse();
	}
	async doPrepareUse() {
		if (!this.providers) return;
		const providers = await Promise.all(this.providers.map((p) => typeof p === "function" ? p() : p));
		this.providers = [];
		if ($typst == this && !providers.some((p) => p.key.includes("package-registry") || p.key.includes("access-model"))) if (isNode) {
			const escapeImport = new Function("m", "return import(m)");
			try {
				const m = new MemoryAccessModel();
				const { default: request } = await escapeImport("sync-request");
				$typst.use(TypstSnippet.withAccessModel(m), TypstSnippet.fetchPackageBy(m, (_, path) => {
					const response = request("GET", path);
					if (response.statusCode === 200) return response.getBody(void 0);
				}));
			} catch (e) {}
		} else $typst.use(TypstSnippet.fetchPackageRegistry());
		const providers2 = await Promise.all(this.providers.map((p) => typeof p === "function" ? p() : p));
		const ccOptions = this.ccOptions ||= {};
		const ccBeforeBuild = ccOptions.beforeBuild ||= [];
		const exOptions = this.exOptions ||= {};
		const exBeforeBuild = exOptions.beforeBuild ||= [];
		for (const provider of [...providers, ...providers2]) {
			if (provider.forRoles.includes("compiler")) {
				this.requireIsUninitialized("compiler", this.cc);
				ccBeforeBuild.push(...provider.provides);
			}
			if (provider.forRoles.includes("renderer")) {
				this.requireIsUninitialized("renderer", this.ex);
				exBeforeBuild.push(...provider.provides);
			}
		}
		this.providers = void 0;
	}
	requireIsUninitialized(role, c, e) {
		if (c && typeof c !== "function") throw new Error(`${role} has been initialized: ${c}`);
	}
	/** @internal */
	static async buildLocalCompiler() {
		const { createTypstCompiler } = await __vitePreload(async () => {
			const { createTypstCompiler } = await import("./compiler-TCf7G1Tc.js");
			return { createTypstCompiler };
		}, []);
		await this.prepareUse();
		const compiler = createTypstCompiler();
		await compiler.init(this.ccOptions);
		return compiler;
	}
	/** @internal */
	static async buildLocalFontResolver() {
		const { createTypstFontBuilder } = await __vitePreload(async () => {
			const { createTypstFontBuilder } = await import("./compiler-TCf7G1Tc.js");
			return { createTypstFontBuilder };
		}, []);
		await this.prepareUse();
		const fonts = createTypstFontBuilder();
		await fonts.init(this.ccOptions);
		return fonts;
	}
	/** @internal */
	static async buildGlobalCompiler() {
		const { createGlobalCompiler } = await __vitePreload(async () => {
			const { createGlobalCompiler } = await import("./global-compiler-DOcrFzdh.js");
			return { createGlobalCompiler };
		}, []);
		const { createTypstCompiler } = await __vitePreload(async () => {
			const { createTypstCompiler } = await import("./compiler-TCf7G1Tc.js");
			return { createTypstCompiler };
		}, []);
		await this.prepareUse();
		return createGlobalCompiler(createTypstCompiler, this.ccOptions);
	}
	/** @internal */
	static async buildLocalRenderer() {
		const { createTypstRenderer } = await __vitePreload(async () => {
			const { createTypstRenderer } = await import("./renderer-Dwgfo1Dv.js");
			return { createTypstRenderer };
		}, []);
		await this.prepareUse();
		const renderer = createTypstRenderer();
		await renderer.init(this.exOptions);
		return renderer;
	}
	/** @internal */
	static async buildGlobalRenderer() {
		const { createGlobalRenderer } = await __vitePreload(async () => {
			const { createGlobalRenderer } = await import("./global-renderer-B2eCGYma.js");
			return { createGlobalRenderer };
		}, []);
		const { createTypstRenderer } = await __vitePreload(async () => {
			const { createTypstRenderer } = await import("./renderer-Dwgfo1Dv.js");
			return { createTypstRenderer };
		}, []);
		await this.prepareUse();
		return createGlobalRenderer(createTypstRenderer, this.exOptions);
	}
};
/**
* The lazy initialized global shared instance of {@link TypstSnippet}. See
* {@link TypstSnippet} for more details.
*/
var $typst = new TypstSnippet({
	compiler: TypstSnippet.buildGlobalCompiler,
	renderer: TypstSnippet.buildGlobalRenderer
});
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-typst@3.1.2/node_modules/@file-viewer/renderer-typst/dist/sanitize.js
var URL_ATTRIBUTES = /* @__PURE__ */ new Set([
	"href",
	"xlink:href",
	"src",
	"poster",
	"action",
	"formaction"
]);
var SAFE_RELATIVE_URL_ASCII = /* @__PURE__ */ new Set(`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._~!$&'()*+,;=@%/?#-`);
var stripUrlControlCharacters = (value) => {
	let normalized = "";
	for (const character of value) {
		const code = character.charCodeAt(0);
		if (code > 32 && (code < 127 || code > 159)) normalized += character;
	}
	return normalized;
};
var normalizeTypstResourceUrl = (value) => {
	const normalized = stripUrlControlCharacters(value).trim();
	if (!normalized) return null;
	if (/^#[A-Za-z0-9_.:-]+$/.test(normalized)) return normalized;
	if (/^data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(normalized)) return normalized;
	if (/^blob:[A-Za-z0-9.+-]+:\/\/[^\s]+$/i.test(normalized)) return normalized;
	if (!normalized.includes(":") && !normalized.includes("\\") && !normalized.startsWith("//") && Array.from(normalized).every((character) => character.charCodeAt(0) > 127 || SAFE_RELATIVE_URL_ASCII.has(character))) return normalized;
	return null;
};
var hasOnlySafeCssUrls = (value) => {
	const normalized = stripUrlControlCharacters(value);
	if (normalized.includes("\\") || normalized.includes("/*") || /(?:expression|image(?:-set)?|paint|var)\s*\(|@import|(?:^|[^-])behavior\s*:|-moz-binding/i.test(normalized)) return false;
	let cursor = 0;
	while (cursor < normalized.length) {
		const match = /url\s*\(/gi;
		match.lastIndex = cursor;
		if (!match.exec(normalized)) return true;
		const close = normalized.indexOf(")", match.lastIndex);
		if (close < 0) return false;
		if (!normalizeTypstResourceUrl(normalized.slice(match.lastIndex, close).trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2"))) return false;
		cursor = close + 1;
	}
	return true;
};
var sanitizeTypstSvgDocument = (root) => {
	root.querySelectorAll("script,iframe,object,embed,form").forEach((node) => node.remove());
	root.querySelectorAll("*").forEach((element) => {
		for (const attribute of Array.from(element.attributes)) {
			const name = attribute.name.toLowerCase();
			if (name.startsWith("on") || name === "srcdoc") {
				element.removeAttribute(attribute.name);
				continue;
			}
			if (URL_ATTRIBUTES.has(name)) {
				const normalizedUrl = normalizeTypstResourceUrl(attribute.value);
				if (!normalizedUrl) {
					element.removeAttribute(attribute.name);
					continue;
				}
				attribute.value = normalizedUrl;
			}
			if ((name === "style" || /url\s*\(/i.test(attribute.value)) && !hasOnlySafeCssUrls(attribute.value)) element.removeAttribute(attribute.name);
		}
	});
	root.querySelectorAll("style").forEach((style) => {
		if (!hasOnlySafeCssUrls(style.textContent || "")) style.remove();
	});
	sanitizeFileViewerSvgResources(root);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-typst@3.1.2/node_modules/@file-viewer/renderer-typst/dist/typst.js
var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
var TYPST_TRUSTED_TYPES_POLICY_NAME = "file-viewer-typst-svg";
var typstTrustedTypesPolicies = /* @__PURE__ */ new WeakMap();
var assertTypstSvgIsSafeForInertParsing = (value) => {
	if (/<!\s*(?:doctype|entity)\b|<\?|<\s*\/?\s*(?:script|iframe|object|embed|form|base|link|meta)\b|\s(?:on[a-z0-9_-]+|srcdoc)\s*=/i.test(value)) throw new TypeError("Typst SVG contains executable markup and was rejected before parsing.");
	return value;
};
var createTypstSvgParserInput = (value, documentRef) => {
	const windowRef = (documentRef === null || documentRef === void 0 ? void 0 : documentRef.defaultView) || (typeof window !== "undefined" ? window : null);
	const trustedTypes = windowRef === null || windowRef === void 0 ? void 0 : windowRef.trustedTypes;
	if (!trustedTypes) return value;
	let policy = typstTrustedTypesPolicies.get(trustedTypes);
	if (!policy) try {
		policy = trustedTypes.createPolicy(TYPST_TRUSTED_TYPES_POLICY_NAME, { createHTML: assertTypstSvgIsSafeForInertParsing });
		typstTrustedTypesPolicies.set(trustedTypes, policy);
	} catch (error) {
		const detail = error instanceof Error ? ` ${error.message}` : "";
		const policyError = /* @__PURE__ */ new Error(`Trusted Types must allow the ${TYPST_TRUSTED_TYPES_POLICY_NAME} policy for Typst SVG parsing.${detail}`);
		policyError.cause = error;
		throw policyError;
	}
	return policy.createHTML(value);
};
var typstStyle = `
.typst-viewer{min-height:100%;overflow:auto;background:var(--file-viewer-render-surface-background,#eef1f4);color:#172033}
.typst-toolbar{position:sticky;top:0;z-index:2;display:flex;min-height:52px;align-items:center;justify-content:space-between;gap:16px;padding:10px 18px;border-bottom:1px solid rgba(120,134,155,.18);background:rgba(248,250,252,.92);backdrop-filter:blur(16px)}
.typst-toolbar div{min-width:0}
.typst-toolbar strong,.typst-toolbar span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.typst-toolbar strong{color:#172033;font-size:14px;font-weight:800}
.typst-toolbar span,.typst-toolbar em{color:#6a778b;font-size:12px;font-style:normal;font-weight:700}
.typst-pages{display:flex;min-height:calc(100% - 52px);flex-direction:column;align-items:center;gap:22px;box-sizing:border-box;padding:28px 16px 44px}
.typst-page-shell{max-width:100%;overflow:hidden;border:1px solid rgba(20,35,53,.1);background:#fff;box-shadow:0 18px 44px rgba(15,23,42,.14)}
.typst-page-content svg{display:block;width:100%;height:auto}
.typst-loading,.typst-error{width:min(520px,calc(100% - 32px));box-sizing:border-box;margin:80px auto;padding:26px;border:1px solid rgba(120,134,155,.18);border-radius:14px;background:#fff;box-shadow:0 18px 44px rgba(15,23,42,.12)}
.typst-loading{display:grid;justify-items:center;gap:10px;text-align:center}
.typst-loading span{width:34px;height:34px;border:3px solid rgba(46,130,94,.18);border-top-color:#239661;border-radius:999px;animation:typst-spin .8s linear infinite}
.typst-loading strong,.typst-error strong{color:#172033;font-size:16px}
.typst-loading p{margin:0;color:#6a778b;font-size:13px}
.typst-error{color:#9f1d1d}
.typst-error pre{max-height:360px;margin:14px 0 0;overflow:auto;border-radius:10px;background:#fff1f2;color:#9f1d1d;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono',monospace;font-size:12px;line-height:1.7;padding:14px;white-space:pre-wrap}
[data-viewer-theme='dark'] .typst-viewer{background:var(--file-viewer-render-surface-background,#101820);color:#e6edf3}
[data-viewer-theme='dark'] .typst-toolbar{border-bottom-color:rgba(139,148,158,.22);background:rgba(15,23,42,.9)}
[data-viewer-theme='dark'] .typst-toolbar strong{color:#f8fafc}
[data-viewer-theme='dark'] .typst-toolbar span,[data-viewer-theme='dark'] .typst-toolbar em{color:#9aa7b8}
[data-viewer-theme='dark'] .typst-page-shell{border-color:rgba(139,148,158,.26);box-shadow:0 24px 56px rgba(0,0,0,.38)}
[data-viewer-theme='dark'] .typst-loading,[data-viewer-theme='dark'] .typst-error{border-color:rgba(139,148,158,.22);background:#151b23;box-shadow:0 24px 56px rgba(0,0,0,.32)}
[data-viewer-theme='dark'] .typst-loading strong,[data-viewer-theme='dark'] .typst-error strong{color:#f8fafc}
@keyframes typst-spin{to{transform:rotate(360deg)}}
@media (max-width:767px){.typst-toolbar{align-items:flex-start;flex-direction:column;gap:4px}.typst-pages{gap:16px;padding:16px 10px 28px}}
@media (prefers-color-scheme:dark){[data-viewer-theme='system'] .typst-viewer{background:var(--file-viewer-render-surface-background,#101820);color:#e6edf3}[data-viewer-theme='system'] .typst-toolbar{border-bottom-color:rgba(139,148,158,.22);background:rgba(15,23,42,.9)}[data-viewer-theme='system'] .typst-toolbar strong{color:#f8fafc}[data-viewer-theme='system'] .typst-toolbar span,[data-viewer-theme='system'] .typst-toolbar em{color:#9aa7b8}[data-viewer-theme='system'] .typst-page-shell{border-color:rgba(139,148,158,.26);box-shadow:0 24px 56px rgba(0,0,0,.38)}[data-viewer-theme='system'] .typst-loading,[data-viewer-theme='system'] .typst-error{border-color:rgba(139,148,158,.22);background:#151b23;box-shadow:0 24px 56px rgba(0,0,0,.32)}[data-viewer-theme='system'] .typst-loading strong,[data-viewer-theme='system'] .typst-error strong{color:#f8fafc}}
`;
var typstEngineConfigKey = "";
var DEFAULT_TYPST_RENDER_TIMEOUT_MS = 18e4;
var TypstRenderTimeoutError = class extends Error {
	constructor(timeoutMs, message) {
		super(message || `Typst WASM / font loading or compilation exceeded ${Math.round(timeoutMs / 1e3)} seconds`);
		this.name = "TypstRenderTimeoutError";
	}
};
var createStyle = (documentRef) => {
	const style = documentRef.createElement("style");
	style.textContent = typstStyle;
	return style;
};
var createElement = (documentRef, tagName, className, text) => {
	const element = documentRef.createElement(tagName);
	if (className) element.className = className;
	if (text !== void 0) element.textContent = text;
	return element;
};
var getWindowOverride = (key) => {
	if (typeof window === "undefined") return;
	return window[key];
};
var configureTypstEngine = (compilerWasmUrl, rendererWasmUrl, fontAssetsUrl) => {
	const normalizedFontAssetsUrl = fontAssetsUrl.endsWith("/") ? fontAssetsUrl : `${fontAssetsUrl}/`;
	const configKey = `${compilerWasmUrl}\n${rendererWasmUrl}\n${normalizedFontAssetsUrl}`;
	if (typstEngineConfigKey === configKey) return;
	$typst.use(TypstSnippet.withAccessModel(new MemoryAccessModel()), TypstSnippet.preloadFontAssets({
		assets: ["text"],
		assetUrlPrefix: {
			text: normalizedFontAssetsUrl,
			_: normalizedFontAssetsUrl
		}
	}));
	$typst.setCompilerInitOptions({ getModule: () => compilerWasmUrl });
	$typst.setRendererInitOptions({ getModule: () => rendererWasmUrl });
	typstEngineConfigKey = configKey;
};
var pushUniqueTypstCandidate = (candidates, candidate) => {
	if (candidates.some((item) => item.compilerWasmUrl === candidate.compilerWasmUrl && item.fontAssetsUrl === candidate.fontAssetsUrl && item.rendererWasmUrl === candidate.rendererWasmUrl)) return;
	candidates.push(candidate);
};
var resolveTypstEngineCandidates = (context, documentBaseUrl) => {
	var _a;
	const typstOptions = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.typst;
	const compilerOverride = getWindowOverride("__FLYFISH_TYPST_COMPILER_WASM_URL__");
	const fontAssetsOverride = getWindowOverride("__FLYFISH_TYPST_FONT_ASSETS_URL__");
	const rendererOverride = getWindowOverride("__FLYFISH_TYPST_RENDERER_WASM_URL__");
	const compilerWasmUrl = resolveFileViewerTypstCompilerWasmUrl(typstOptions, [compilerOverride], documentBaseUrl);
	const fontAssetsUrl = resolveFileViewerTypstFontAssetsUrl(typstOptions, [fontAssetsOverride], documentBaseUrl);
	const rendererWasmUrl = resolveFileViewerTypstRendererWasmUrl(typstOptions, [rendererOverride], documentBaseUrl);
	const hasConfiguredAsset = Boolean((typstOptions === null || typstOptions === void 0 ? void 0 : typstOptions.compilerWasmUrl) || (typstOptions === null || typstOptions === void 0 ? void 0 : typstOptions.fontAssetsUrl) || (typstOptions === null || typstOptions === void 0 ? void 0 : typstOptions.rendererWasmUrl) || compilerOverride || fontAssetsOverride || rendererOverride);
	const candidates = [];
	pushUniqueTypstCandidate(candidates, {
		compilerWasmUrl,
		fontAssetsUrl,
		rendererWasmUrl,
		source: hasConfiguredAsset ? "configured" : "local",
		preflight: !hasConfiguredAsset
	});
	return candidates;
};
var isHttpUrl = (url) => /^https?:\/\//i.test(url);
var isKnownMissingWasmUrl = async (url) => {
	if (typeof fetch !== "function" || !isHttpUrl(url)) return false;
	try {
		const response = await fetch(url, {
			cache: "force-cache",
			method: "HEAD"
		});
		return response.status === 404 || response.status === 410;
	} catch {
		return false;
	}
};
var resolveKnownMissingTypstAsset = async (candidate) => {
	if (await isKnownMissingWasmUrl(candidate.compilerWasmUrl)) return `Typst compiler WASM missing: ${candidate.compilerWasmUrl}`;
	if (await isKnownMissingWasmUrl(candidate.rendererWasmUrl)) return `Typst renderer WASM missing: ${candidate.rendererWasmUrl}`;
	return "";
};
var isTypstAssetLoadError = (error) => {
	if (Array.isArray(error)) return false;
	const message = error instanceof Error ? error.message : String(error);
	return /wasm|webassembly|fetch|module|instantiate|compile|network|404|410/i.test(message);
};
var escapeAttribute = (value) => {
	return value.replace(/[&<>"']/g, (char) => {
		return {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;",
			"'": "&#39;"
		}[char] || char;
	});
};
var readNumberAttribute = (element, name) => {
	const value = Number.parseFloat(element.getAttribute(name) || "");
	return Number.isFinite(value) && value > 0 ? value : 0;
};
var serializeNode = (node) => {
	return new XMLSerializer().serializeToString(node);
};
var parseTypstSvgPages = (svgText, svgParseFailedMessage, documentRef) => {
	var _a;
	const documentSvg = new (((_a = documentRef === null || documentRef === void 0 ? void 0 : documentRef.defaultView) === null || _a === void 0 ? void 0 : _a.DOMParser) || DOMParser)().parseFromString(createTypstSvgParserInput(svgText, documentRef), "image/svg+xml");
	const parseError = documentSvg.querySelector("parsererror");
	if (parseError) throw new Error(parseError.textContent || svgParseFailedMessage);
	sanitizeTypstSvgDocument(documentSvg);
	const root = documentSvg.documentElement;
	if (root.namespaceURI !== SVG_NAMESPACE || root.localName.toLowerCase() !== "svg") throw new Error(svgParseFailedMessage);
	const sharedNodes = Array.from(root.children).filter((child) => ["style", "defs"].includes(child.tagName.toLowerCase())).map((child) => child.cloneNode(true));
	const pageGroups = Array.from(root.querySelectorAll("g.typst-page"));
	const fallbackWidth = readNumberAttribute(root, "data-width") || readNumberAttribute(root, "width") || 596;
	const fallbackHeight = readNumberAttribute(root, "data-height") || readNumberAttribute(root, "height") || 842;
	if (!pageGroups.length) return [{
		index: 1,
		width: fallbackWidth,
		height: fallbackHeight,
		svg: serializeNode(root),
		svgNode: root
	}];
	return pageGroups.map((group, index) => {
		const pageWidth = readNumberAttribute(group, "data-page-width") || fallbackWidth;
		const pageHeight = readNumberAttribute(group, "data-page-height") || fallbackHeight;
		const pageClone = group.cloneNode(true);
		pageClone.setAttribute("transform", "translate(0, 0)");
		const pageSvg = documentSvg.createElementNS(SVG_NAMESPACE, "svg");
		pageSvg.setAttribute("style", "overflow:visible;");
		pageSvg.setAttribute("class", "typst-doc");
		pageSvg.setAttribute("viewBox", `0 0 ${pageWidth} ${pageHeight}`);
		pageSvg.setAttribute("width", String(pageWidth));
		pageSvg.setAttribute("height", String(pageHeight));
		pageSvg.setAttribute("data-width", String(pageWidth));
		pageSvg.setAttribute("data-height", String(pageHeight));
		pageSvg.setAttributeNS(XMLNS_NAMESPACE, "xmlns:xlink", "http://www.w3.org/1999/xlink");
		pageSvg.setAttributeNS(XMLNS_NAMESPACE, "xmlns:h5", "http://www.w3.org/1999/xhtml");
		pageSvg.append(...sharedNodes.map((node) => node.cloneNode(true)), pageClone);
		sanitizeTypstSvgDocument(pageSvg);
		return {
			index: index + 1,
			width: pageWidth,
			height: pageHeight,
			svg: serializeNode(pageSvg),
			svgNode: pageSvg
		};
	});
};
var importTypstSvgPageNode = (documentRef, page) => {
	return documentRef.importNode(page.svgNode, true);
};
var formatTypstError = (error) => {
	if (Array.isArray(error)) return error.map((item) => {
		if (item && typeof item === "object" && "message" in item) return `${"severity" in item ? String(item.severity) : "Error"}: ${String(item.message)}`;
		return String(item);
	}).join("\n");
	if (error instanceof Error) return error.message;
	return String(error);
};
var formatTypstRuntimeError = (error, t) => {
	const message = formatTypstError(error);
	if (error instanceof TypstRenderTimeoutError) return [message, t("typst.error.timeoutHint")].join("\n\n");
	if (isTypstAssetLoadError(error)) return [message, t("typst.error.assetHint")].join("\n\n");
	return message;
};
var clampZoom = (value) => {
	return Math.min(3, Math.max(.3, Number(value.toFixed(2))));
};
var normalizeRenderTimeoutMs = (timeoutMs) => {
	if (!Number.isFinite(timeoutMs) || timeoutMs === void 0) return DEFAULT_TYPST_RENDER_TIMEOUT_MS;
	return Math.max(0, timeoutMs);
};
var withRenderTimeout = async (promise, timeoutMs, timeoutMessage) => {
	if (timeoutMs <= 0) return promise;
	let timeoutId;
	const timeoutPromise = new Promise((_, reject) => {
		timeoutId = setTimeout(() => reject(new TypstRenderTimeoutError(timeoutMs, timeoutMessage)), timeoutMs);
	});
	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timeoutId) clearTimeout(timeoutId);
	}
};
var buildExportStyles = () => `
  <style>
    .typst-export-document {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      margin: 0;
      padding: 24px;
      background: #eef1f4;
    }
    .typst-export-page {
      box-sizing: border-box;
      flex: 0 0 auto;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
    }
    .typst-export-page svg {
      display: block;
      width: 100%;
      height: auto;
    }
  </style>
`;
var buildExportHtml = (pages, filename) => {
	return `${buildExportStyles()}<main class="typst-export-document" aria-label="${escapeAttribute(filename || "Typst document")}">${pages.map((page) => {
		const width = formatCssPixels(page.width);
		const height = formatCssPixels(page.height);
		return `<section class="typst-export-page viewer-print-page" style="--viewer-print-page-width:${width};--viewer-print-page-height:${height};width:${width};height:${height};" aria-label="Page ${page.index}">${page.svg}</section>`;
	}).join("")}</main>`;
};
var buildPrintStyle = (pages) => {
	const firstPage = pages[0];
	const width = firstPage ? formatCssPixels(firstPage.width) : "596px";
	return `
    @page { size: ${width} ${firstPage ? formatCssPixels(firstPage.height) : "842px"}; margin: 0; }
    @media print {
      html,
      body {
        width: ${width};
        min-width: ${width};
        margin: 0 !important;
        background: #ffffff !important;
      }
      .typst-export-document {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .typst-export-page {
        display: block !important;
        margin: 0 !important;
        border: 0 !important;
        box-shadow: none !important;
        break-after: page;
        page-break-after: always;
      }
      .typst-export-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }
      .typst-export-page svg {
        width: 100% !important;
        height: auto !important;
      }
    }
  `;
};
var buildExportAdapter = (pages, filename) => {
	if (!pages.length) return null;
	return {
		includeDocumentStyles: false,
		print: true,
		exportHtml: true,
		printStyle: () => buildPrintStyle(pages),
		toHtml: () => buildExportHtml(pages, filename)
	};
};
var getPageSummary = (pages, t) => {
	if (!pages.length) return t("typst.pageSummary.empty");
	const firstPage = pages[0];
	return t("typst.pageSummary.ready", {
		count: pages.length,
		width: Math.round(firstPage.width),
		height: Math.round(firstPage.height)
	});
};
async function renderTypst(buffer, target, _type, context) {
	var _a;
	const t = createFileViewerTranslator(context === null || context === void 0 ? void 0 : context.options);
	const source = await readFileViewerText(buffer);
	const documentRef = target.ownerDocument || document;
	const zoomEmitter = createFileViewerZoomChangeEmitter();
	let state = "loading";
	let pages = [];
	let errorMessage = "";
	let zoom = 1;
	let renderToken = 0;
	let disposed = false;
	const pageShells = /* @__PURE__ */ new Map();
	const root = createElement(documentRef, "div", "typst-viewer");
	root.dataset.viewerZoomProvider = "typst";
	const toolbar = createElement(documentRef, "header", "typst-toolbar");
	const titleGroup = createElement(documentRef, "div");
	const title = createElement(documentRef, "strong", void 0, (context === null || context === void 0 ? void 0 : context.filename) || "Typst document");
	const summary = createElement(documentRef, "span", void 0, t("typst.summaryRenderer"));
	const status = createElement(documentRef, "em", void 0, t("typst.status.compiling"));
	const body = createElement(documentRef, "div");
	titleGroup.append(title, summary);
	toolbar.append(titleGroup, status);
	root.append(toolbar, body);
	target.replaceChildren(createStyle(documentRef), root);
	const getZoomState = () => ({
		scale: zoom,
		label: `${Math.round(zoom * 100)}%`,
		canZoomIn: zoom < 3,
		canZoomOut: zoom > .3,
		canReset: zoom !== 1,
		minScale: .3,
		maxScale: 3
	});
	const applyPageZoom = () => {
		pages.forEach((page) => {
			const shell = pageShells.get(page.index);
			if (!shell) return;
			shell.style.width = `${page.width * zoom}px`;
			shell.style.maxWidth = "100%";
			shell.style.height = "auto";
		});
	};
	const setZoom = (scale) => {
		zoom = clampZoom(scale);
		applyPageZoom();
		zoomEmitter.emit();
		return getZoomState();
	};
	registerFileViewerZoomProvider(root, {
		zoomIn: () => setZoom(zoom + .1),
		zoomOut: () => setZoom(zoom - .1),
		resetZoom: () => setZoom(1),
		setZoom,
		getState: getZoomState,
		subscribe: zoomEmitter.subscribe
	});
	const registerExportAdapter = () => {
		var _a;
		(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, buildExportAdapter(pages, context.filename));
	};
	const renderLoading = () => {
		const loading = createElement(documentRef, "div", "typst-loading");
		loading.setAttribute("role", "status");
		loading.append(createElement(documentRef, "span"), createElement(documentRef, "strong", void 0, t("typst.loading.title")), createElement(documentRef, "p", void 0, t("typst.loading.hint")));
		body.replaceChildren(loading);
	};
	const renderError = () => {
		const error = createElement(documentRef, "div", "typst-error");
		error.append(createElement(documentRef, "strong", void 0, t("typst.error.title")), createElement(documentRef, "pre", void 0, errorMessage));
		body.replaceChildren(error);
	};
	const renderPages = () => {
		pageShells.clear();
		const pagesRoot = createElement(documentRef, "main", "typst-pages");
		pagesRoot.setAttribute("aria-label", "Typst preview pages");
		pages.forEach((page) => {
			const shell = createElement(documentRef, "section", "typst-page-shell");
			shell.setAttribute("aria-label", `Page ${page.index}`);
			const content = createElement(documentRef, "div", "typst-page-content");
			content.replaceChildren(importTypstSvgPageNode(documentRef, page));
			shell.append(content);
			pageShells.set(page.index, shell);
			pagesRoot.append(shell);
		});
		body.replaceChildren(pagesRoot);
		applyPageZoom();
	};
	const syncUi = () => {
		summary.textContent = state === "ready" ? getPageSummary(pages, t) : t("typst.summaryRenderer");
		status.textContent = state === "loading" ? t("typst.status.compiling") : state === "error" ? t("typst.status.failed") : t("typst.status.rendered");
		if (state === "loading") renderLoading();
		else if (state === "error") renderError();
		else renderPages();
	};
	const renderTypstSvg = async () => {
		var _a, _b;
		const candidates = resolveTypstEngineCandidates(context, resolveFileViewerRuntimeAssetBaseUrl(documentRef));
		const timeoutMs = normalizeRenderTimeoutMs((_b = (_a = context === null || context === void 0 ? void 0 : context.options) === null || _a === void 0 ? void 0 : _a.typst) === null || _b === void 0 ? void 0 : _b.renderTimeoutMs);
		let lastError;
		for (const candidate of candidates) {
			const missingAsset = candidate.preflight ? await resolveKnownMissingTypstAsset(candidate) : "";
			if (missingAsset) {
				lastError = new Error(missingAsset);
				continue;
			}
			try {
				configureTypstEngine(candidate.compilerWasmUrl, candidate.rendererWasmUrl, candidate.fontAssetsUrl);
				return await withRenderTimeout($typst.svg({
					mainContent: source,
					data_selection: {
						body: true,
						defs: true,
						css: true,
						js: false
					}
				}), timeoutMs, t("typst.error.timeout", { seconds: Math.round(timeoutMs / 1e3) }));
			} catch (error) {
				lastError = error;
				if (error instanceof TypstRenderTimeoutError || !isTypstAssetLoadError(error)) throw error;
			}
		}
		throw lastError instanceof Error ? lastError : new Error(t("typst.error.wasmLoadFailed"));
	};
	const render = async () => {
		var _a, _b;
		const token = ++renderToken;
		state = "loading";
		errorMessage = "";
		pages = [];
		(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
		syncUi();
		try {
			const svg = await renderTypstSvg();
			if (disposed || token !== renderToken) return;
			pages = parseTypstSvgPages(svg, t("typst.error.svgParseFailed"), documentRef);
			state = "ready";
			syncUi();
			registerExportAdapter();
			(_b = context === null || context === void 0 ? void 0 : context.onProgressiveRender) === null || _b === void 0 || _b.call(context);
		} catch (error) {
			if (disposed || token !== renderToken) return;
			errorMessage = formatTypstRuntimeError(error, t);
			state = "error";
			syncUi();
		}
	};
	render();
	(_a = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _a === void 0 || _a.call(context, {
		beforeCapture: async ({ signal }) => {
			while (state === "loading" && !disposed) {
				if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw signal.reason;
				await new Promise((resolve) => {
					const view = documentRef.defaultView;
					if (view) view.setTimeout(resolve, 16);
					else setTimeout(resolve, 16);
				});
			}
			if (state === "error") throw new Error(errorMessage || t("typst.error.title"));
		},
		capture: async ({ width, height, background, signal }) => {
			const firstPage = pages[0];
			if (!firstPage) return null;
			const canvasHost = documentRef.createElement("div");
			const pixelPerPt = Math.max(.5, Math.min(width / Math.max(firstPage.width, 1), height / Math.max(firstPage.height, 1)));
			await $typst.canvas(canvasHost, {
				mainContent: source,
				pixelPerPt,
				backgroundColor: background
			});
			if (signal === null || signal === void 0 ? void 0 : signal.aborted) throw signal.reason;
			const canvas = canvasHost.querySelector("canvas");
			if (!canvas) return null;
			return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
		},
		getTarget: () => pageShells.get(1) || body.querySelector(".typst-page-shell") || body
	});
	return {
		$el: target,
		unmount() {
			var _a, _b;
			disposed = true;
			renderToken += 1;
			unregisterFileViewerZoomProvider(root);
			(_a = context === null || context === void 0 ? void 0 : context.registerExportAdapter) === null || _a === void 0 || _a.call(context, null);
			(_b = context === null || context === void 0 ? void 0 : context.registerThumbnailAdapter) === null || _b === void 0 || _b.call(context, null);
			target.replaceChildren();
		}
	};
}
//#endregion
export { IncrementalServer as a, createTypstCompiler as c, TypstRendererDriver as d, TypstWorker as f, CompileFormatEnum as i, createTypstFontBuilder as l, parseTypstSvgPages as n, TypstFontBuilderDriver as o, createTypstRenderer as p, renderTypst as r, TypstWorld as s, importTypstSvgPageNode as t, RenderSession as u };
