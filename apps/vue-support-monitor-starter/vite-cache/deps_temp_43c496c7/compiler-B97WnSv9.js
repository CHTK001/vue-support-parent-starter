import { a as kObject, r as LazyWasmModule, t as buildComponent } from "./init-zZuBQJ8_.js";
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
		this.fontBuilderJs = await (options?.getWrapper?.() || import("./wasm-pack-shim-yoeYwWJ3.js"));
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
		this.compilerJs = await (options?.getWrapper?.() || import("./wasm-pack-shim-yoeYwWJ3.js"));
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
export { createTypstCompiler as a, loadFonts as c, withPackageRegistry as d, TypstWorld as i, preloadFontAssets as l, IncrementalServer as n, createTypstFontBuilder as o, TypstFontBuilderDriver as r, disableDefaultFontAssets as s, CompileFormatEnum as t, withAccessModel as u };
