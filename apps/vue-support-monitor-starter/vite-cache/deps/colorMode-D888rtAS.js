//#region ../../node_modules/.pnpm/@file-viewer+renderer-cad@3.1.2_three@0.185.1/node_modules/@file-viewer/renderer-cad/dist/colorMode.js
function normalizeFileViewerCadColorMode(value) {
	return value === "monochrome" ? "monochrome" : "source";
}
function resolveFileViewerCadMonochromeColor(value, fallback = "#000000") {
	if (typeof value === "string" && value.trim()) return value.trim();
	return fallback;
}
function resolveFileViewerCadCanvasOptions(options, mode) {
	return {
		background: mode === "monochrome" ? "#ffffff" : "#05070d",
		foreground: mode === "monochrome" ? resolveFileViewerCadMonochromeColor(options.monochromeColor) : "#f8fafc",
		contrastMode: "adaptive",
		minColorContrast: 2.4,
		showPageBounds: true,
		showUnsupportedMarkers: true,
		enableSpatialIndex: true,
		maxVisibleTextLabels: 2400,
		...options.canvasOptions
	};
}
function supportsCadViewerColorMode(value) {
	return Boolean(value && typeof value.setColorMode === "function");
}
function resolveCadViewerSourceDocument(viewer) {
	var _a, _b, _c;
	const candidate = viewer;
	return (_b = (_a = candidate === null || candidate === void 0 ? void 0 : candidate.getSourceDocument) === null || _a === void 0 ? void 0 : _a.call(candidate)) !== null && _b !== void 0 ? _b : (_c = candidate === null || candidate === void 0 ? void 0 : candidate.getDocument) === null || _c === void 0 ? void 0 : _c.call(candidate);
}
function applyCadViewerColorMode(viewer, mode, monochromeColor, options) {
	var _a, _b, _c;
	if (!supportsCadViewerColorMode(viewer)) return false;
	(_a = viewer.setColorMode) === null || _a === void 0 || _a.call(viewer, mode, monochromeColor);
	if (options) {
		const canvasOptions = resolveFileViewerCadCanvasOptions(options, mode);
		if (((_b = viewer.isNativeRendererActive) === null || _b === void 0 ? void 0 : _b.call(viewer)) && options.dwfBackground) canvasOptions.background = options.dwfBackground;
		(_c = viewer.setCanvasOptions) === null || _c === void 0 || _c.call(viewer, canvasOptions);
	}
	return true;
}
//#endregion
export { resolveFileViewerCadMonochromeColor as a, resolveFileViewerCadCanvasOptions as i, normalizeFileViewerCadColorMode as n, supportsCadViewerColorMode as o, resolveCadViewerSourceDocument as r, applyCadViewerColorMode as t };
