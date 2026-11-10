//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/limits.js
var DEFAULT_PHOTOSHOP_PARSE_LIMITS = Object.freeze({
	maxFileBytes: 134217728,
	maxCanvasPixels: 16e6,
	maxCanvasDimension: 16384,
	maxLayers: 2e3,
	maxNestingDepth: 64,
	maxLayerPixels: 16e6,
	maxDecodedBytes: 134217728,
	maxLayerCacheBytes: 67108864,
	maxResourceItems: 4096,
	maxResourceNameCodeUnits: 4096,
	maxResourcePreviewPixels: 16e6
});
var positiveInteger = (value, fallback) => {
	return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : fallback;
};
var resolvePhotoshopParseLimits = (options) => ({
	maxFileBytes: positiveInteger(options?.maxFileBytes, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxFileBytes),
	maxCanvasPixels: positiveInteger(options?.maxCanvasPixels, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxCanvasPixels),
	maxCanvasDimension: positiveInteger(options?.maxCanvasDimension, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxCanvasDimension),
	maxLayers: positiveInteger(options?.maxLayers, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxLayers),
	maxNestingDepth: positiveInteger(options?.maxNestingDepth, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxNestingDepth),
	maxLayerPixels: positiveInteger(options?.maxLayerPixels, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxLayerPixels),
	maxDecodedBytes: positiveInteger(options?.maxDecodedBytes, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxDecodedBytes),
	maxLayerCacheBytes: positiveInteger(options?.maxLayerCacheBytes, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxLayerCacheBytes),
	maxResourceItems: positiveInteger(options?.maxResourceItems, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxResourceItems),
	maxResourceNameCodeUnits: positiveInteger(options?.maxResourceNameCodeUnits, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxResourceNameCodeUnits),
	maxResourcePreviewPixels: positiveInteger(options?.maxResourcePreviewPixels, DEFAULT_PHOTOSHOP_PARSE_LIMITS.maxResourcePreviewPixels)
});
//#endregion
export { resolvePhotoshopParseLimits as n, DEFAULT_PHOTOSHOP_PARSE_LIMITS as t };
