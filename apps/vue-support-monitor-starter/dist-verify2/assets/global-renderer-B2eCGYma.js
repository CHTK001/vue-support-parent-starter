//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/contrib/global-renderer.mjs
var globalRenderer = void 0;
var globalRendererInitReady;
function createGlobalRenderer(creator, initOptions) {
	const renderer = globalRenderer || creator();
	if (globalRendererInitReady !== void 0) return globalRendererInitReady;
	return globalRendererInitReady = (async () => {
		await renderer.init(initOptions);
		return globalRenderer = renderer;
	})();
}
//#endregion
export { createGlobalRenderer };
