import { n as resolvePhotoshopParseLimits } from "./limits-Dq6NAslB.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/photoshopHeader.js
var PSD_SIGNATURE = "8BPS";
var multiplyPhotoshopDimensions = (left, right, label) => {
	const result = left * right;
	if (!Number.isSafeInteger(result)) throw new Error(`${label} exceeds the safe integer range.`);
	return result;
};
var inspectPhotoshopHeader = (buffer, inputLimits) => {
	const limits = resolvePhotoshopParseLimits(inputLimits);
	if (buffer.byteLength < 26) throw new Error("Photoshop file is shorter than the 26-byte header.");
	if (buffer.byteLength > limits.maxFileBytes) throw new Error(`Photoshop file exceeds the ${limits.maxFileBytes}-byte safety limit.`);
	const bytes = new Uint8Array(buffer, 0, 26);
	if (String.fromCharCode(...bytes.subarray(0, 4)) !== PSD_SIGNATURE) throw new Error("Photoshop signature 8BPS was not found.");
	const view = new DataView(buffer, 0, 26);
	const version = view.getUint16(4, false);
	if (version !== 1 && version !== 2) throw new Error(`Unsupported Photoshop version ${version}.`);
	for (let index = 6; index < 12; index += 1) if (bytes[index] !== 0) throw new Error("Photoshop reserved header bytes must be zero.");
	const channels = view.getUint16(12, false);
	const height = view.getUint32(14, false);
	const width = view.getUint32(18, false);
	const depth = view.getUint16(22, false);
	const colorMode = view.getUint16(24, false);
	if (channels < 1 || channels > 56) throw new Error(`Invalid Photoshop channel count ${channels}.`);
	const specMaxDimension = version === 1 ? 3e4 : 3e5;
	if (width < 1 || height < 1 || width > specMaxDimension || height > specMaxDimension) throw new Error(`Invalid Photoshop canvas ${width} x ${height}.`);
	if (width > limits.maxCanvasDimension || height > limits.maxCanvasDimension) throw new Error(`Photoshop canvas ${width} x ${height} exceeds the ${limits.maxCanvasDimension}-pixel browser dimension limit.`);
	if (multiplyPhotoshopDimensions(width, height, "Photoshop canvas area") > limits.maxCanvasPixels) throw new Error(`Photoshop canvas exceeds the ${limits.maxCanvasPixels}-pixel safety limit.`);
	if (depth !== 8 || ![1, 3].includes(colorMode)) throw new Error(`Photoshop ${depth}-bit color mode ${colorMode} is structure-readable but cannot be rendered safely by the current pixel engines; only 8-bit grayscale and RGB are enabled.`);
	return {
		version,
		channels,
		width,
		height,
		depth,
		colorMode
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/photoshopPreflight.js
var requireRange = (offset, length, total, label) => {
	if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > total) throw new Error(`${label} points outside the Photoshop file.`);
};
var readUint64 = (view, offset, label) => {
	requireRange(offset, 8, view.byteLength, label);
	const upper = view.getUint32(offset, false);
	const lower = view.getUint32(offset + 4, false);
	if (upper >= 2097152) throw new Error(`${label} exceeds JavaScript's safe integer range.`);
	return upper * 4294967296 + lower;
};
var skipUint32Section = (view, offset, label) => {
	requireRange(offset, 4, view.byteLength, `${label} length`);
	const length = view.getUint32(offset, false);
	requireRange(offset + 4, length, view.byteLength, label);
	return {
		start: offset + 4,
		end: offset + 4 + length
	};
};
var inspectImageResources = (view, start, end) => {
	let offset = start;
	let iccProfilePresent = false;
	while (offset < end) {
		requireRange(offset, 7, end, "Photoshop image resource header");
		const signature = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
		if (signature !== "8BIM" && signature !== "MeSa") throw new Error(`Invalid Photoshop image resource signature ${JSON.stringify(signature)}.`);
		const resourceId = view.getUint16(offset + 4, false);
		const paddedNameBytes = 1 + view.getUint8(offset + 6) + 1 & -2;
		const sizeOffset = offset + 6 + paddedNameBytes;
		requireRange(sizeOffset, 4, end, "Photoshop image resource size");
		const dataLength = view.getUint32(sizeOffset, false);
		const paddedDataLength = dataLength + 1 & -2;
		const next = sizeOffset + 4 + paddedDataLength;
		requireRange(sizeOffset + 4, paddedDataLength, end, "Photoshop image resource data");
		if (resourceId === 1039 && dataLength > 0) iccProfilePresent = true;
		offset = next;
	}
	if (offset !== end) throw new Error("Photoshop image resources are not aligned to their declared boundary.");
	return iccProfilePresent;
};
var inspectPhotoshopContainer = (buffer, header) => {
	const view = new DataView(buffer);
	let offset = 26;
	offset = skipUint32Section(view, offset, "Photoshop color mode data").end;
	const imageResources = skipUint32Section(view, offset, "Photoshop image resources");
	const iccProfilePresent = inspectImageResources(view, imageResources.start, imageResources.end);
	offset = imageResources.end;
	const lengthBytes = header.version === 1 ? 4 : 8;
	requireRange(offset, lengthBytes, view.byteLength, "Photoshop layer and mask length");
	const layerAndMaskLength = header.version === 1 ? view.getUint32(offset, false) : readUint64(view, offset, "Photoshop layer and mask length");
	offset += lengthBytes;
	const layerAndMaskStart = offset;
	requireRange(offset, layerAndMaskLength, view.byteLength, "Photoshop layer and mask data");
	let signedLayerCount = null;
	if (layerAndMaskLength > 0) {
		requireRange(layerAndMaskStart, lengthBytes, layerAndMaskStart + layerAndMaskLength, "Photoshop layer info length");
		const layerInfoLength = header.version === 1 ? view.getUint32(layerAndMaskStart, false) : readUint64(view, layerAndMaskStart, "Photoshop layer info length");
		if (layerInfoLength > layerAndMaskLength - lengthBytes) throw new Error("Photoshop layer info exceeds its layer and mask section.");
		if (layerInfoLength > 0) {
			const layerInfoStart = layerAndMaskStart + lengthBytes;
			requireRange(layerInfoStart, 2, layerInfoStart + layerInfoLength, "Photoshop signed layer count");
			signedLayerCount = view.getInt16(layerInfoStart, false);
		}
	}
	offset += layerAndMaskLength;
	requireRange(offset, 2, view.byteLength, "Photoshop composite compression");
	const compression = view.getUint16(offset, false);
	if (compression < 0 || compression > 3) throw new Error(`Invalid Photoshop composite compression method ${compression}.`);
	return {
		compositeCompression: compression,
		compositeDataOffset: offset + 2,
		iccProfilePresent,
		signedLayerCount,
		mergedTransparencyPresent: signedLayerCount != null && signedLayerCount < 0
	};
};
//#endregion
export { inspectPhotoshopHeader as n, multiplyPhotoshopDimensions as r, inspectPhotoshopContainer as t };
