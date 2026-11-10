//#region ../../node_modules/.pnpm/@file-viewer+renderer-binary@3.1.2/node_modules/@file-viewer/renderer-binary/dist/types.js
var DEFAULT_BINARY_INSPECTOR_LIMITS = Object.freeze({
	maxFileBytes: 16777216,
	maxParseMilliseconds: 5e3,
	maxStructureNodes: 512,
	maxStructureDepth: 16,
	maxStringBytes: 4096
});
var boundedInteger = (value, fallback, minimum, maximum) => {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	return Math.min(maximum, Math.max(minimum, Math.floor(value)));
};
var normalizeBinaryInspectorLimits = (options) => ({
	maxFileBytes: boundedInteger(options?.maxFileBytes, DEFAULT_BINARY_INSPECTOR_LIMITS.maxFileBytes, 1, 67108864),
	maxParseMilliseconds: boundedInteger(options?.maxParseMilliseconds, DEFAULT_BINARY_INSPECTOR_LIMITS.maxParseMilliseconds, 50, 3e4),
	maxStructureNodes: boundedInteger(options?.maxStructureNodes, DEFAULT_BINARY_INSPECTOR_LIMITS.maxStructureNodes, 1, 4096),
	maxStructureDepth: boundedInteger(options?.maxStructureDepth, DEFAULT_BINARY_INSPECTOR_LIMITS.maxStructureDepth, 1, 64),
	maxStringBytes: boundedInteger(options?.maxStringBytes, DEFAULT_BINARY_INSPECTOR_LIMITS.maxStringBytes, 1, 65536)
});
//#endregion
export { normalizeBinaryInspectorLimits as n, DEFAULT_BINARY_INSPECTOR_LIMITS as t };
