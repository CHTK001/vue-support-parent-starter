//#region ../../node_modules/.pnpm/@file-viewer+core@3.1.2/node_modules/@file-viewer/core/dist/features/printMaskLoader.js
/**
* Lazily opens the print-mask designer.
* Kept as a dynamic import so the designer stays out of the main core graph,
* while remaining reachable through the primary `@file-viewer/core` entry
* (no consumer alias / subpath setup required).
*/
var openFileViewerPrintMaskDesignerAsync = async (options) => {
	const { openFileViewerPrintMaskDesigner } = await import("./print-mask-DYlQQB2d.js");
	return openFileViewerPrintMaskDesigner(options);
};
//#endregion
export { openFileViewerPrintMaskDesignerAsync as t };
