//#region ../../node_modules/.pnpm/@myriaddreamin+typst.ts@0.7.0_@myriaddreamin+typst-ts-renderer@0.7.0_@myriaddreamin+typst-ts-web-compiler@0.7.0/node_modules/@myriaddreamin/typst.ts/dist/esm/contrib/global-compiler.mjs
var globalCompiler = void 0;
var globalCompilerInitReady;
function createGlobalCompiler(creator, initOptions) {
	const compiler = globalCompiler || creator();
	if (globalCompilerInitReady !== void 0) return globalCompilerInitReady;
	return globalCompilerInitReady = (async () => {
		await compiler.init(initOptions);
		return globalCompiler = compiler;
	})();
}
//#endregion
export { createGlobalCompiler };
