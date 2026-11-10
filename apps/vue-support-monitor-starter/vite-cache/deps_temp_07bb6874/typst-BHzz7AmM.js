import { at as readFileViewerText, dn as resolveFileViewerRuntimeAssetBaseUrl, hn as resolveFileViewerTypstRendererWasmUrl, mn as resolveFileViewerTypstFontAssetsUrl, pn as resolveFileViewerTypstCompilerWasmUrl } from "./dist-B6GcL3C6.js";
import { _ as unregisterFileViewerZoomProvider, m as registerFileViewerZoomProvider, o as createFileViewerZoomChangeEmitter } from "./fit-BmeG0j2O.js";
import { t as createFileViewerTranslator } from "./messages-C9eWaSMj.js";
import { r as formatCssPixels } from "./printLayout-Bjb07JZy.js";
import { n as sanitizeFileViewerSvgResources } from "./svgResources-k6X774NV.js";
import { c as loadFonts, d as withPackageRegistry, l as preloadFontAssets, s as disableDefaultFontAssets, t as CompileFormatEnum, u as withAccessModel } from "./compiler-B97WnSv9.js";
import { n as loadFontSync } from "./init-zZuBQJ8_.js";
import "./renderer-C8Pws4lx.js";
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
		const { createTypstCompiler } = await import("./compiler-D2iKTOPH.js");
		await this.prepareUse();
		const compiler = createTypstCompiler();
		await compiler.init(this.ccOptions);
		return compiler;
	}
	/** @internal */
	static async buildLocalFontResolver() {
		const { createTypstFontBuilder } = await import("./compiler-D2iKTOPH.js");
		await this.prepareUse();
		const fonts = createTypstFontBuilder();
		await fonts.init(this.ccOptions);
		return fonts;
	}
	/** @internal */
	static async buildGlobalCompiler() {
		const { createGlobalCompiler } = await import("./global-compiler-DOcrFzdh.js");
		const { createTypstCompiler } = await import("./compiler-D2iKTOPH.js");
		await this.prepareUse();
		return createGlobalCompiler(createTypstCompiler, this.ccOptions);
	}
	/** @internal */
	static async buildLocalRenderer() {
		const { createTypstRenderer } = await import("./renderer-JP_Xbouj.js");
		await this.prepareUse();
		const renderer = createTypstRenderer();
		await renderer.init(this.exOptions);
		return renderer;
	}
	/** @internal */
	static async buildGlobalRenderer() {
		const { createGlobalRenderer } = await import("./global-renderer-B2eCGYma.js");
		const { createTypstRenderer } = await import("./renderer-JP_Xbouj.js");
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
export { renderTypst as default };
