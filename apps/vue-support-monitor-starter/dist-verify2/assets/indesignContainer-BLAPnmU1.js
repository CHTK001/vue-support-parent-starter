//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/xdImage.js
var requireImageBounds = (bytes, width, height, limits) => {
	if (bytes.byteLength === 0 || bytes.byteLength > limits.maxBytes) throw new Error(`Embedded preview is outside the 1-${limits.maxBytes} byte safety range.`);
	if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0 || width > limits.maxDimension || height > limits.maxDimension || width > Math.floor(limits.maxPixels / height)) throw new Error(`Embedded preview dimensions ${width} x ${height} exceed the raster safety limit.`);
};
var isPng = (bytes) => {
	const signature = [
		137,
		80,
		78,
		71,
		13,
		10,
		26,
		10
	];
	return bytes.byteLength >= signature.length && signature.every((byte, index) => bytes[index] === byte);
};
var inspectPng = (bytes, limits) => {
	if (bytes.byteLength < 45) throw new Error("Embedded PNG preview is truncated.");
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let offset = 8;
	let width = 0;
	let height = 0;
	let sawIdat = false;
	let sawIend = false;
	while (offset < bytes.byteLength) {
		if (offset > bytes.byteLength - 12) throw new Error("Embedded PNG chunk header is truncated.");
		const length = view.getUint32(offset, false);
		if (length > bytes.byteLength - offset - 12) throw new Error("Embedded PNG chunk exceeds the preview bytes.");
		const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
		if (offset === 8) {
			if (type !== "IHDR" || length !== 13) throw new Error("Embedded PNG does not begin with a valid IHDR chunk.");
			width = view.getUint32(offset + 8, false);
			height = view.getUint32(offset + 12, false);
			const bitDepth = bytes[offset + 16];
			if (!{
				0: [
					1,
					2,
					4,
					8,
					16
				],
				2: [8, 16],
				3: [
					1,
					2,
					4,
					8
				],
				4: [8, 16],
				6: [8, 16]
			}[bytes[offset + 17]]?.includes(bitDepth) || bytes[offset + 18] !== 0 || bytes[offset + 19] !== 0 || bytes[offset + 20] !== 0 && bytes[offset + 20] !== 1) throw new Error("Embedded PNG uses an invalid IHDR encoding.");
		} else if (/^[A-Z]/.test(type) && ![
			"PLTE",
			"IDAT",
			"IEND"
		].includes(type)) throw new Error(`Embedded PNG uses unknown critical chunk ${JSON.stringify(type)}.`);
		if (type === "IDAT") sawIdat = true;
		if (type === "IEND") {
			if (length !== 0 || !sawIdat) throw new Error("Embedded PNG has an invalid IEND or no IDAT data.");
			sawIend = true;
			offset += 12;
			break;
		}
		offset += 12 + length;
	}
	if (!sawIend || offset !== bytes.byteLength) throw new Error("Embedded PNG has no terminal IEND or contains trailing bytes.");
	requireImageBounds(bytes, width, height, limits);
	return {
		mimeType: "image/png",
		width,
		height,
		byteLength: bytes.byteLength
	};
};
var SOF_MARKERS = /* @__PURE__ */ new Set([
	192,
	193,
	194,
	195,
	197,
	198,
	199,
	201,
	202,
	203,
	205,
	206,
	207
]);
var inspectJpeg = (bytes, limits) => {
	if (bytes.byteLength < 12 || bytes[0] !== 255 || bytes[1] !== 216) throw new Error("Embedded JPEG preview has an invalid SOI marker.");
	if (bytes[bytes.byteLength - 2] !== 255 || bytes[bytes.byteLength - 1] !== 217) throw new Error("Embedded JPEG preview has no terminal EOI marker or contains trailing bytes.");
	let offset = 2;
	let width = 0;
	let height = 0;
	while (offset < bytes.byteLength - 2) {
		if (bytes[offset] !== 255) throw new Error("Embedded JPEG marker stream is malformed.");
		while (offset < bytes.byteLength && bytes[offset] === 255) offset += 1;
		if (offset >= bytes.byteLength) throw new Error("Embedded JPEG marker is truncated.");
		const marker = bytes[offset];
		offset += 1;
		if (marker === 217) break;
		if (marker === 218) {
			if (width === 0 || height === 0) throw new Error("Embedded JPEG reached scan data before a supported SOF marker.");
			break;
		}
		if (marker === 1 || marker >= 208 && marker <= 215) continue;
		if (offset > bytes.byteLength - 2) throw new Error("Embedded JPEG segment length is truncated.");
		const length = bytes[offset] << 8 | bytes[offset + 1];
		if (length < 2 || offset > bytes.byteLength - length) throw new Error("Embedded JPEG segment exceeds the preview bytes.");
		if (SOF_MARKERS.has(marker)) {
			if (length < 8) throw new Error("Embedded JPEG SOF segment is truncated.");
			height = bytes[offset + 3] << 8 | bytes[offset + 4];
			width = bytes[offset + 5] << 8 | bytes[offset + 6];
		}
		offset += length;
	}
	if (width === 0 || height === 0) throw new Error("Embedded JPEG contains no supported frame header.");
	requireImageBounds(bytes, width, height, limits);
	return {
		mimeType: "image/jpeg",
		width,
		height,
		byteLength: bytes.byteLength
	};
};
var inspectEmbeddedRaster = (bytes, expectedMimeType, limits) => {
	const info = isPng(bytes) ? inspectPng(bytes, limits) : inspectJpeg(bytes, limits);
	if (expectedMimeType && expectedMimeType.toLowerCase() !== info.mimeType) throw new Error(`Embedded preview declares ${expectedMimeType} but contains ${info.mimeType}.`);
	return info;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/indesignContainer.js
var DEFAULT_INDESIGN_CONTAINER_LIMITS = Object.freeze({
	maxFileBytes: 268435456,
	maxDatabasePages: 65536,
	maxContiguousObjects: 8192,
	maxObjectBytes: 67108864,
	maxXmpBytes: 12582912,
	maxPreviewCandidates: 64,
	maxPreviewBytes: 25165824,
	maxPreviewDimension: 16384,
	maxPreviewPixels: 64e6
});
var MASTER_PAGE_BYTES = 4096;
var MASTER_PAGE_GUID = Uint8Array.from([
	6,
	6,
	237,
	245,
	216,
	29,
	70,
	229,
	189,
	49,
	239,
	231,
	254,
	116,
	183,
	29
]);
var OBJECT_HEADER_GUID = Uint8Array.from([
	222,
	57,
	57,
	121,
	81,
	136,
	75,
	108,
	142,
	99,
	238,
	248,
	174,
	224,
	221,
	56
]);
var OBJECT_TRAILER_GUID = Uint8Array.from([
	253,
	206,
	219,
	112,
	247,
	134,
	75,
	79,
	164,
	211,
	199,
	40,
	179,
	65,
	113,
	6
]);
var DOCUMENT_ASCII = "DOCUMENT";
var XPACKET_ID = "W5M0MpCehiHzreSzNTczkc9d";
var XMP_GRAPHICS_IMAGE_NAMESPACE = "http://ns.adobe.com/xap/1.0/g/img/";
var RDF_NAMESPACE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var positiveInteger = (value, fallback) => {
	return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : fallback;
};
var resolveInDesignContainerLimits = (overrides) => ({
	maxFileBytes: positiveInteger(overrides?.maxFileBytes, DEFAULT_INDESIGN_CONTAINER_LIMITS.maxFileBytes),
	maxDatabasePages: positiveInteger(overrides?.maxDatabasePages, DEFAULT_INDESIGN_CONTAINER_LIMITS.maxDatabasePages),
	maxContiguousObjects: positiveInteger(overrides?.maxContiguousObjects, DEFAULT_INDESIGN_CONTAINER_LIMITS.maxContiguousObjects),
	maxObjectBytes: positiveInteger(overrides?.maxObjectBytes, DEFAULT_INDESIGN_CONTAINER_LIMITS.maxObjectBytes),
	maxXmpBytes: positiveInteger(overrides?.maxXmpBytes, DEFAULT_INDESIGN_CONTAINER_LIMITS.maxXmpBytes),
	maxPreviewCandidates: positiveInteger(overrides?.maxPreviewCandidates, DEFAULT_INDESIGN_CONTAINER_LIMITS.maxPreviewCandidates),
	maxPreviewBytes: positiveInteger(overrides?.maxPreviewBytes, DEFAULT_INDESIGN_CONTAINER_LIMITS.maxPreviewBytes),
	maxPreviewDimension: positiveInteger(overrides?.maxPreviewDimension, DEFAULT_INDESIGN_CONTAINER_LIMITS.maxPreviewDimension),
	maxPreviewPixels: positiveInteger(overrides?.maxPreviewPixels, DEFAULT_INDESIGN_CONTAINER_LIMITS.maxPreviewPixels)
});
var bytesEqual = (bytes, offset, expected) => {
	if (offset < 0 || offset > bytes.byteLength - expected.byteLength) return false;
	for (let index = 0; index < expected.byteLength; index += 1) if (bytes[offset + index] !== expected[index]) return false;
	return true;
};
var asciiAt = (bytes, offset, value) => {
	if (offset < 0 || offset > bytes.byteLength - value.length) return false;
	for (let index = 0; index < value.length; index += 1) if (bytes[offset + index] !== value.charCodeAt(index)) return false;
	return true;
};
var requireRange = (offset, length, total, label) => {
	if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset > total - length) throw new Error(`${label} points outside the InDesign container.`);
};
var readSequence = (view, offset) => {
	const low = view.getUint32(offset, true);
	const high = view.getUint32(offset + 4, true);
	return BigInt(high) << 32n | BigInt(low);
};
var inspectMasterPage = (bytes, view, offset, label) => {
	requireRange(offset, MASTER_PAGE_BYTES, bytes.byteLength, label);
	if (!bytesEqual(bytes, offset, MASTER_PAGE_GUID) || !asciiAt(bytes, offset + 16, DOCUMENT_ASCII)) throw new Error(`${label} has an invalid InDesign DOCUMENT signature.`);
	return {
		streamByteOrderByte: bytes[offset + 24],
		sequence: readSequence(view, offset + 264),
		databasePages: view.getUint32(offset + 280, true)
	};
};
var inspectInDesignContainer = (buffer, kind = "indd", overrides) => {
	const limits = resolveInDesignContainerLimits(overrides);
	if (buffer.byteLength > limits.maxFileBytes) throw new Error(`InDesign file is ${buffer.byteLength} bytes, exceeding the ${limits.maxFileBytes}-byte limit.`);
	if (buffer.byteLength < MASTER_PAGE_BYTES * 2) throw new Error("InDesign file does not contain both master pages.");
	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);
	if (!bytesEqual(bytes, 0, MASTER_PAGE_GUID) && asciiAt(bytes, 92, DOCUMENT_ASCII)) throw new Error("Legacy InDesign 1.x DOCUMENT container recognized; the GUID/master-page reader supports InDesign 2 and later.");
	const first = inspectMasterPage(bytes, view, 0, "InDesign master page 1");
	const second = inspectMasterPage(bytes, view, MASTER_PAGE_BYTES, "InDesign master page 2");
	const activeMasterPage = second.sequence > first.sequence ? 2 : 1;
	const active = activeMasterPage === 2 ? second : first;
	if (active.streamByteOrderByte !== 1 && active.streamByteOrderByte !== 2) throw new Error(`InDesign active master page declares invalid stream byte order ${active.streamByteOrderByte}.`);
	if (active.databasePages < 2 || active.databasePages > limits.maxDatabasePages) throw new Error(`InDesign database page count ${active.databasePages} is outside the safety range.`);
	const contiguousObjectOffset = active.databasePages * MASTER_PAGE_BYTES;
	if (!Number.isSafeInteger(contiguousObjectOffset) || contiguousObjectOffset > buffer.byteLength) throw new Error("InDesign database page count points beyond the file.");
	const littleEndian = active.streamByteOrderByte === 1;
	return {
		kind,
		formatVersion: view.getUint32((activeMasterPage - 1) * MASTER_PAGE_BYTES + 29, littleEndian),
		streamByteOrder: littleEndian ? "little-endian" : "big-endian",
		activeMasterPage,
		activeSequence: active.sequence.toString(),
		databasePages: active.databasePages,
		contiguousObjectOffset,
		fileBytes: buffer.byteLength
	};
};
var isZeroPadding = (bytes, offset) => {
	const end = Math.min(bytes.byteLength, offset + 32);
	if (end === offset) return true;
	for (let index = offset; index < end; index += 1) if (bytes[index] !== 0) return false;
	return true;
};
var decodeXmpPacket = (bytes) => {
	let text;
	try {
		text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return;
	}
	if (!new RegExp(`^<\\?xpacket begin=(["'])\\uFEFF\\1 id=(["'])${XPACKET_ID}\\2`).test(text) || !/<\?xpacket end=(["'])[rw]\1\s*\?>\s*$/.test(text)) return;
	return text;
};
var escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var collectNamespaces = (xmp) => {
	const namespaces = /* @__PURE__ */ new Map();
	for (const match of xmp.matchAll(/xmlns:([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(["'])([^"']+)\2/g)) namespaces.set(match[1], match[3]);
	return namespaces;
};
var extractElementText = (xml, prefix, localName) => {
	const qualifiedName = `${escapeRegExp(prefix)}:${escapeRegExp(localName)}`;
	return new RegExp(`<${qualifiedName}\\b[^>]*>([\\s\\S]*?)<\\/${qualifiedName}\\s*>`, "i").exec(xml)?.[1]?.trim();
};
var decodeBase64Bounded = (value, maxBytes) => {
	const xmlWhitespaceDecoded = value.replace(/&#(?:x0*(?:9|a|d|20)|0*(?:9|10|13|32));/gi, " ");
	if (xmlWhitespaceDecoded.includes("&")) return;
	const compact = xmlWhitespaceDecoded.replace(/[\t\n\r ]+/g, "");
	if (compact.length === 0 || compact.length > Math.ceil(maxBytes / 3) * 4 + 4 || compact.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact)) return;
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	const padding = compact.endsWith("==") ? 2 : compact.endsWith("=") ? 1 : 0;
	const decodedLength = compact.length / 4 * 3 - padding;
	if (decodedLength <= 0 || decodedLength > maxBytes) return;
	const output = new Uint8Array(decodedLength);
	let written = 0;
	for (let offset = 0; offset < compact.length; offset += 4) {
		const a = alphabet.indexOf(compact[offset]);
		const b = alphabet.indexOf(compact[offset + 1]);
		const c = compact[offset + 2] === "=" ? 0 : alphabet.indexOf(compact[offset + 2]);
		const d = compact[offset + 3] === "=" ? 0 : alphabet.indexOf(compact[offset + 3]);
		const packed = a << 18 | b << 12 | c << 6 | d;
		if (written < decodedLength) output[written++] = packed >>> 16 & 255;
		if (written < decodedLength) output[written++] = packed >>> 8 & 255;
		if (written < decodedLength) output[written++] = packed & 255;
	}
	return output;
};
var extractXmpPreviews = (xmp, limits, warnings) => {
	const namespaces = collectNamespaces(xmp);
	const imagePrefix = [...namespaces.entries()].find(([, uri]) => uri === XMP_GRAPHICS_IMAGE_NAMESPACE)?.[0];
	const rdfPrefix = [...namespaces.entries()].find(([, uri]) => uri === RDF_NAMESPACE)?.[0];
	if (!imagePrefix || !rdfPrefix) return;
	const liPattern = new RegExp(`<${escapeRegExp(rdfPrefix)}:li\\b[^>]*>[\\s\\S]*?<\\/${escapeRegExp(rdfPrefix)}:li\\s*>`, "gi");
	let selected;
	let candidates = 0;
	for (const match of xmp.matchAll(liPattern)) {
		if (candidates >= limits.maxPreviewCandidates) {
			warnings.push(`Stopped reading XMP thumbnails at the ${limits.maxPreviewCandidates}-candidate limit.`);
			break;
		}
		const imageText = extractElementText(match[0], imagePrefix, "image");
		if (!imageText) continue;
		candidates += 1;
		const declaredFormat = extractElementText(match[0], imagePrefix, "format");
		const expectedMime = declaredFormat?.toLowerCase() === "png" ? "image/png" : declaredFormat?.toLowerCase() === "jpeg" || declaredFormat?.toLowerCase() === "jpg" ? "image/jpeg" : void 0;
		if (!expectedMime) {
			warnings.push(`Skipped XMP thumbnail with unsupported declared format ${JSON.stringify(declaredFormat || "missing")}.`);
			continue;
		}
		const bytes = decodeBase64Bounded(imageText, limits.maxPreviewBytes);
		if (!bytes) {
			warnings.push("Skipped an invalid or oversized XMP thumbnail payload.");
			continue;
		}
		try {
			const info = inspectEmbeddedRaster(bytes, expectedMime, {
				maxBytes: limits.maxPreviewBytes,
				maxDimension: limits.maxPreviewDimension,
				maxPixels: limits.maxPreviewPixels
			});
			const declaredWidth = Number(extractElementText(match[0], imagePrefix, "width"));
			const declaredHeight = Number(extractElementText(match[0], imagePrefix, "height"));
			if (Number.isFinite(declaredWidth) && declaredWidth > 0 && declaredWidth !== info.width || Number.isFinite(declaredHeight) && declaredHeight > 0 && declaredHeight !== info.height) warnings.push("An XMP thumbnail declared dimensions that did not match its raster header; the raster header was used.");
			if (!selected || info.width * info.height > selected.width * selected.height) selected = {
				...info,
				source: "xmp-thumbnail",
				bytes,
				declaredFormat
			};
		} catch (error) {
			warnings.push(`Skipped malformed XMP thumbnail: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return selected;
};
var readInDesignContainer = (buffer, kind = "indd", overrides) => {
	const limits = resolveInDesignContainerLimits(overrides);
	const header = inspectInDesignContainer(buffer, kind, limits);
	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);
	const streamLittleEndian = header.streamByteOrder === "little-endian";
	const warnings = [];
	let offset = header.contiguousObjectOffset;
	let contiguousObjectCount = 0;
	let xmpPacketCount = 0;
	let selectedXmp;
	let unsupportedReason;
	while (offset < bytes.byteLength) {
		if (isZeroPadding(bytes, offset)) break;
		if (bytes.byteLength - offset < 32) {
			unsupportedReason = `InDesign contiguous data at offset ${offset} has a truncated object header.`;
			break;
		}
		if (!bytesEqual(bytes, offset, OBJECT_HEADER_GUID)) {
			unsupportedReason = `InDesign contiguous data at offset ${offset} is not a supported object header.`;
			break;
		}
		contiguousObjectCount += 1;
		if (contiguousObjectCount > limits.maxContiguousObjects) throw new Error(`InDesign exceeds the ${limits.maxContiguousObjects}-object contiguous-stream limit.`);
		const objectBytes = view.getUint32(offset + 24, true);
		if (objectBytes > limits.maxObjectBytes) throw new Error(`InDesign contiguous object ${contiguousObjectCount} exceeds ${limits.maxObjectBytes} bytes.`);
		const dataOffset = offset + 32;
		const trailerOffset = dataOffset + objectBytes;
		requireRange(dataOffset, objectBytes + 32, bytes.byteLength, `InDesign contiguous object ${contiguousObjectCount}`);
		if (!bytesEqual(bytes, trailerOffset, OBJECT_TRAILER_GUID)) {
			unsupportedReason = `InDesign contiguous object ${contiguousObjectCount} has an invalid trailer.`;
			break;
		}
		for (let index = 0; index < 8; index += 1) if (bytes[offset + 16 + index] !== bytes[trailerOffset + 16 + index]) {
			unsupportedReason = `InDesign contiguous object ${contiguousObjectCount} header/trailer identity does not match.`;
			break;
		}
		if (unsupportedReason) break;
		if (objectBytes > 56) {
			const declaredXmpBytes = view.getUint32(dataOffset, streamLittleEndian);
			if (declaredXmpBytes > limits.maxXmpBytes) warnings.push(`Ignored an InDesign XMP candidate larger than ${limits.maxXmpBytes} bytes.`);
			else if (declaredXmpBytes > 0 && declaredXmpBytes <= objectBytes - 4) {
				const xmp = decodeXmpPacket(bytes.subarray(dataOffset + 4, dataOffset + 4 + declaredXmpBytes));
				if (xmp) {
					xmpPacketCount += 1;
					selectedXmp = xmp;
				}
			}
		}
		offset = trailerOffset + 32;
	}
	const preview = selectedXmp ? extractXmpPreviews(selectedXmp, limits, warnings) : void 0;
	if (selectedXmp && !preview) warnings.push("The verified InDesign XMP object contains no valid bounded JPEG/PNG thumbnail.");
	if (!selectedXmp) warnings.push("No XMP packet was found through the declared database-page and contiguous-object structure; binary image signatures were not scanned.");
	return {
		format: kind,
		status: unsupportedReason ? "unsupported-structure" : preview ? "preview" : selectedXmp ? "metadata-only" : "structure-only",
		header,
		contiguousObjectCount,
		xmpPacketCount,
		xmp: selectedXmp,
		preview,
		unsupportedReason,
		warnings
	};
};
//#endregion
export { inspectEmbeddedRaster as i, readInDesignContainer as n, resolveInDesignContainerLimits as r, inspectInDesignContainer as t };
