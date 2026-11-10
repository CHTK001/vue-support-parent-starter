//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/internal.types.mjs
var kObject = Symbol.for("reflexo-obj");
var TypstDefaultParams;
(function(TypstDefaultParams) {
	TypstDefaultParams[TypstDefaultParams["PIXEL_PER_PT"] = 3] = "PIXEL_PER_PT";
})(TypstDefaultParams || (TypstDefaultParams = {}));
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
export { kObject as a, TypstDefaultParams as i, loadFontSync as n, LazyWasmModule as r, buildComponent as t };
