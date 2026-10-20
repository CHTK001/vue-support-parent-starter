//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/postscriptLimits.js
var DEFAULT_POSTSCRIPT_SAFETY_LIMITS = Object.freeze({
	maxFileBytes: 33554432,
	maxPages: 100,
	maxSourceDimension: 1e5,
	maxCanvasDimension: 8192,
	maxRenderedPixels: 16777216,
	maxVmBytes: 268435456,
	minDpi: 36,
	maxDpi: 300,
	workerTimeoutMs: 3e4
});
var finiteInteger = (value, fallback, min, max) => {
	const number = Number(value);
	if (!Number.isFinite(number)) return fallback;
	return Math.min(max, Math.max(min, Math.floor(number)));
};
var resolvePostscriptSafetyLimits = (value = {}) => {
	const minDpi = finiteInteger(value.minDpi, DEFAULT_POSTSCRIPT_SAFETY_LIMITS.minDpi, 18, 300);
	const maxDpi = Math.max(minDpi, finiteInteger(value.maxDpi, DEFAULT_POSTSCRIPT_SAFETY_LIMITS.maxDpi, 36, 600));
	return {
		maxFileBytes: finiteInteger(value.maxFileBytes, DEFAULT_POSTSCRIPT_SAFETY_LIMITS.maxFileBytes, 1, 67108864),
		maxPages: finiteInteger(value.maxPages, DEFAULT_POSTSCRIPT_SAFETY_LIMITS.maxPages, 1, 500),
		maxSourceDimension: finiteInteger(value.maxSourceDimension, DEFAULT_POSTSCRIPT_SAFETY_LIMITS.maxSourceDimension, 1, 1e6),
		maxCanvasDimension: finiteInteger(value.maxCanvasDimension, DEFAULT_POSTSCRIPT_SAFETY_LIMITS.maxCanvasDimension, 1, 16384),
		maxRenderedPixels: finiteInteger(value.maxRenderedPixels, DEFAULT_POSTSCRIPT_SAFETY_LIMITS.maxRenderedPixels, 1, 67108864),
		maxVmBytes: finiteInteger(value.maxVmBytes, DEFAULT_POSTSCRIPT_SAFETY_LIMITS.maxVmBytes, 16777216, 536870912),
		minDpi,
		maxDpi,
		workerTimeoutMs: finiteInteger(value.workerTimeoutMs, DEFAULT_POSTSCRIPT_SAFETY_LIMITS.workerTimeoutMs, 1e3, 12e4)
	};
};
//#endregion
export { resolvePostscriptSafetyLimits as n, DEFAULT_POSTSCRIPT_SAFETY_LIMITS as t };
