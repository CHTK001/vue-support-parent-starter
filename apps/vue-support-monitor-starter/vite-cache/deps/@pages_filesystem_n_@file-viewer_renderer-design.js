import { ot as DEFAULT_RENDERER_DEFINITIONS } from "./dist-B6GcL3C6.js";
import { n as dataRendererDefinition, r as renderFileViewerData } from "./dist-CJORWQK4.js";
import { t as require_saxes } from "./saxes-CW2LQgn1.js";
import { n as resolvePhotoshopParseLimits, t as DEFAULT_PHOTOSHOP_PARSE_LIMITS } from "./limits-Dq6NAslB.js";
import { n as inspectPhotoshopHeader, t as inspectPhotoshopContainer } from "./photoshopPreflight-BCgzeqIc.js";
import { n as inspectAdobeBrushLibrary, r as inspectAdobeCustomShapeLibrary, t as parseAdobeBrushResource } from "./adobeBrushResourceParser-BSK9wB_O.js";
import { t as parseAdobePresetResource } from "./adobePresetParser-CxOz2xgB.js";
import { n as parseInDesignExchange, r as resolveInDesignExchangeLimits, t as DEFAULT_INDESIGN_EXCHANGE_LIMITS } from "./indesignExchangeParser-BA2GVk5M.js";
import { t as require_lib } from "./lib-BZRU-hm4.js";
import { i as inspectEmbeddedRaster, n as readInDesignContainer, r as resolveInDesignContainerLimits, t as inspectInDesignContainer } from "./indesignContainer-BLAPnmU1.js";
import { n as resolvePostscriptSafetyLimits, t as DEFAULT_POSTSCRIPT_SAFETY_LIMITS } from "./postscriptLimits-DBMw6rBn.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/designResourceParser.js
var fail$1 = (message) => {
	throw new Error(`Adobe palette: ${message}`);
};
var BinaryReader = class {
	bytes;
	view;
	offset = 0;
	constructor(buffer) {
		this.bytes = new Uint8Array(buffer);
		this.view = new DataView(buffer);
	}
	ensure(length, label) {
		if (!Number.isSafeInteger(length) || length < 0 || this.offset + length > this.bytes.byteLength) fail$1(`${label} is truncated at byte ${this.offset}.`);
	}
	u16(label = "uint16") {
		this.ensure(2, label);
		const value = this.view.getUint16(this.offset, false);
		this.offset += 2;
		return value;
	}
	i16(label = "int16") {
		this.ensure(2, label);
		const value = this.view.getInt16(this.offset, false);
		this.offset += 2;
		return value;
	}
	u32(label = "uint32") {
		this.ensure(4, label);
		const value = this.view.getUint32(this.offset, false);
		this.offset += 4;
		return value;
	}
	f32(label = "float32") {
		this.ensure(4, label);
		const value = this.view.getFloat32(this.offset, false);
		this.offset += 4;
		if (!Number.isFinite(value)) fail$1(`${label} is not finite.`);
		return value;
	}
	ascii(length, label = "ASCII value") {
		this.ensure(length, label);
		const value = String.fromCharCode(...this.bytes.subarray(this.offset, this.offset + length));
		this.offset += length;
		return value;
	}
	skip(length, label = "section") {
		this.ensure(length, label);
		this.offset += length;
	}
};
var validateCodeUnits = (units, label) => {
	for (let index = 0; index < units.length; index += 1) {
		const value = units[index];
		if (value >= 55296 && value <= 56319) {
			const next = units[index + 1];
			if (next === void 0 || next < 56320 || next > 57343) fail$1(`${label} contains an unpaired UTF-16 high surrogate.`);
			index += 1;
		} else if (value >= 56320 && value <= 57343) fail$1(`${label} contains an unpaired UTF-16 low surrogate.`);
	}
};
var fromCodeUnits = (units) => {
	let value = "";
	for (let index = 0; index < units.length; index += 1024) value += String.fromCharCode(...units.slice(index, index + 1024));
	return value;
};
var readUtf16Be = (reader, codeUnits, limits, label, requireTerminator) => {
	if (!Number.isSafeInteger(codeUnits) || codeUnits < (requireTerminator ? 1 : 0)) fail$1(`${label} has an invalid length.`);
	if (codeUnits > limits.maxResourceNameCodeUnits) fail$1(`${label} exceeds the ${limits.maxResourceNameCodeUnits}-code-unit safety limit.`);
	reader.ensure(codeUnits * 2, label);
	const units = Array.from({ length: codeUnits }, () => reader.u16(label));
	if (requireTerminator) {
		if (units.at(-1) !== 0) fail$1(`${label} is missing its UTF-16 terminator.`);
		units.pop();
	} else if (units.at(-1) === 0) units.pop();
	validateCodeUnits(units, label);
	return fromCodeUnits(units);
};
var clamp01 = (value) => Math.min(1, Math.max(0, value));
var byte = (value) => Math.round(clamp01(value) * 255);
var toHex = (rgb) => `#${rgb.map((value) => byte(value).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
var hsvToRgb = (hue, saturation, value) => {
	const normalizedHue = (hue % 1 + 1) % 1;
	const chroma = clamp01(value) * clamp01(saturation);
	const sector = normalizedHue * 6;
	const secondary = chroma * (1 - Math.abs(sector % 2 - 1));
	const match = clamp01(value) - chroma;
	return (sector < 1 ? [
		chroma,
		secondary,
		0
	] : sector < 2 ? [
		secondary,
		chroma,
		0
	] : sector < 3 ? [
		0,
		chroma,
		secondary
	] : sector < 4 ? [
		0,
		secondary,
		chroma
	] : sector < 5 ? [
		secondary,
		0,
		chroma
	] : [
		chroma,
		0,
		secondary
	]).map((component) => clamp01(component + match));
};
var labToRgb = (lightness, a, b) => {
	const delta = 6 / 29;
	const inverse = (value) => value > delta ? value ** 3 : 3 * delta * delta * (value - 4 / 29);
	const fy = (lightness + 16) / 116;
	const fx = fy + a / 500;
	const fz = fy - b / 200;
	const d50X = .96422 * inverse(fx);
	const d50Y = inverse(fy);
	const d50Z = .82521 * inverse(fz);
	const x = .9555766 * d50X - .0230393 * d50Y + .0631636 * d50Z;
	const y = -.0282895 * d50X + 1.0099416 * d50Y + .0210077 * d50Z;
	const z = .0122982 * d50X - .020483 * d50Y + 1.3299098 * d50Z;
	return [
		3.2404542 * x - 1.5371385 * y - .4985314 * z,
		-.969266 * x + 1.8760108 * y + .041556 * z,
		.0556434 * x - .2040259 * y + 1.0572252 * z
	].map((component) => clamp01(component <= .0031308 ? 12.92 * component : 1.055 * component ** (1 / 2.4) - .055));
};
var normalizeColor = (id, name, groupPath, model, components, kind) => {
	let rgb;
	switch (model) {
		case "RGB":
			rgb = components.slice(0, 3).map(clamp01);
			break;
		case "HSB":
			rgb = hsvToRgb(components[0], components[1], components[2]);
			break;
		case "CMYK": {
			const [c, m, y, k] = components.map(clamp01);
			rgb = [
				(1 - c) * (1 - k),
				(1 - m) * (1 - k),
				(1 - y) * (1 - k)
			];
			break;
		}
		case "LAB":
			rgb = labToRgb(components[0], components[1], components[2]);
			break;
		case "Gray": rgb = [
			clamp01(components[0]),
			clamp01(components[0]),
			clamp01(components[0])
		];
	}
	return {
		id,
		name,
		groupPath,
		model,
		components,
		componentText: model === "LAB" ? `L ${components[0].toFixed(2)} · a ${components[1].toFixed(2)} · b ${components[2].toFixed(2)}` : model === "CMYK" ? `C ${Math.round(components[0] * 100)} · M ${Math.round(components[1] * 100)} · Y ${Math.round(components[2] * 100)} · K ${Math.round(components[3] * 100)}` : model === "HSB" ? `H ${Math.round(components[0] * 360)}° · S ${Math.round(components[1] * 100)} · B ${Math.round(components[2] * 100)}` : model === "Gray" ? `Gray ${Math.round(components[0] * 100)}%` : `R ${byte(components[0])} · G ${byte(components[1])} · B ${byte(components[2])}`,
		kind,
		rgb,
		hex: toHex(rgb)
	};
};
var assertRange = (value, minimum, maximum, label) => {
	if (value < minimum || value > maximum) fail$1(`${label} ${value} is outside ${minimum}…${maximum}.`);
	return value;
};
var signed16 = (value) => value > 32767 ? value - 65536 : value;
var parseAdobeSwatchExchange = (buffer, limits) => {
	if (buffer.byteLength > limits.maxFileBytes) fail$1(`source exceeds the ${limits.maxFileBytes}-byte safety limit.`);
	const reader = new BinaryReader(buffer);
	if (reader.ascii(4, "ASE signature") !== "ASEF") fail$1("invalid ASE signature.");
	const major = reader.u16("ASE major version");
	const minor = reader.u16("ASE minor version");
	if (major !== 1) fail$1(`unsupported ASE version ${major}.${minor}.`);
	const blockCount = reader.u32("ASE block count");
	if (blockCount > limits.maxResourceItems * 3) fail$1(`ASE block count exceeds the ${limits.maxResourceItems * 3}-block safety limit.`);
	const colors = [];
	const groupStack = [];
	const groups = /* @__PURE__ */ new Set();
	let unknownBlocks = 0;
	const kinds = [
		"global",
		"spot",
		"normal"
	];
	for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
		const blockType = reader.u16(`ASE block ${blockIndex} type`);
		const blockLength = reader.u32(`ASE block ${blockIndex} length`);
		reader.ensure(blockLength, `ASE block ${blockIndex}`);
		const blockEnd = reader.offset + blockLength;
		if (blockType === 49153) {
			const name = readUtf16Be(reader, reader.u16("ASE group name length"), limits, "ASE group name", true);
			if (reader.offset !== blockEnd) fail$1(`ASE group block ${blockIndex} has an invalid length.`);
			groupStack.push(name);
			groups.add(groupStack.join(" / "));
		} else if (blockType === 49154) {
			if (blockLength !== 0) fail$1(`ASE group-end block ${blockIndex} must be empty.`);
			if (!groupStack.length) fail$1(`ASE group-end block ${blockIndex} has no matching group start.`);
			groupStack.pop();
		} else if (blockType === 1) {
			if (colors.length >= limits.maxResourceItems) fail$1(`ASE color count exceeds the ${limits.maxResourceItems}-item safety limit.`);
			const name = readUtf16Be(reader, reader.u16("ASE color name length"), limits, "ASE color name", true);
			const mode = reader.ascii(4, "ASE color model");
			let model;
			let components;
			if (mode === "RGB ") {
				model = "RGB";
				components = [
					0,
					1,
					2
				].map((index) => assertRange(reader.f32(`ASE RGB component ${index}`), 0, 1, "ASE RGB component"));
			} else if (mode === "CMYK") {
				model = "CMYK";
				components = [
					0,
					1,
					2,
					3
				].map((index) => assertRange(reader.f32(`ASE CMYK component ${index}`), 0, 1, "ASE CMYK component"));
			} else if (mode === "Gray") {
				model = "Gray";
				components = [assertRange(reader.f32("ASE Gray component"), 0, 1, "ASE Gray component")];
			} else if (mode === "LAB ") {
				model = "LAB";
				components = [
					assertRange(reader.f32("ASE Lab L"), 0, 100, "ASE Lab L"),
					assertRange(reader.f32("ASE Lab a"), -160, 160, "ASE Lab a"),
					assertRange(reader.f32("ASE Lab b"), -160, 160, "ASE Lab b")
				];
			} else fail$1(`unsupported ASE color model ${JSON.stringify(mode)}.`);
			const colorKind = kinds[reader.u16("ASE color kind")];
			if (!colorKind) fail$1("ASE color kind is invalid.");
			if (reader.offset !== blockEnd) fail$1(`ASE color block ${blockIndex} has an invalid length.`);
			colors.push(normalizeColor(`ase-${colors.length}`, name || `Color ${colors.length + 1}`, [...groupStack], model, components, colorKind));
		} else {
			unknownBlocks += 1;
			reader.offset = blockEnd;
		}
	}
	if (groupStack.length) fail$1("ASE file ends before all color groups are closed.");
	return {
		format: "ase",
		version: `${major}.${minor}`,
		colors,
		groups: [...groups],
		unknownBlocks,
		trailingBytes: buffer.byteLength - reader.offset
	};
};
var parseAcoRecord = (reader, version, index, limits) => {
	const colorSpace = reader.u16(`ACO color ${index} color space`);
	const raw = [
		0,
		1,
		2,
		3
	].map((component) => reader.u16(`ACO color ${index} component ${component}`));
	let model;
	let components;
	switch (colorSpace) {
		case 0:
			model = "RGB";
			components = raw.slice(0, 3).map((value) => value / 65535);
			break;
		case 1:
			model = "HSB";
			components = raw.slice(0, 3).map((value) => value / 65535);
			break;
		case 2:
			model = "CMYK";
			components = raw.map((value) => 1 - value / 65535);
			break;
		case 7:
			model = "LAB";
			components = [
				assertRange(raw[0] / 100, 0, 100, "ACO Lab L"),
				signed16(raw[1]) / 100,
				signed16(raw[2]) / 100
			];
			assertRange(components[1], -160, 160, "ACO Lab a");
			assertRange(components[2], -160, 160, "ACO Lab b");
			break;
		case 8:
			model = "Gray";
			components = [assertRange(raw[0] / 1e4, 0, 1, "ACO Gray component")];
			break;
		default: fail$1(`unsupported ACO color space ${colorSpace}.`);
	}
	const name = version === 2 ? readUtf16Be(reader, reader.u32(`ACO color ${index} name length`), limits, `ACO color ${index} name`, false) : void 0;
	return {
		model,
		components,
		name
	};
};
var parseAdobeColorSwatch = (buffer, limits) => {
	if (buffer.byteLength > limits.maxFileBytes) fail$1(`source exceeds the ${limits.maxFileBytes}-byte safety limit.`);
	const reader = new BinaryReader(buffer);
	const sections = /* @__PURE__ */ new Map();
	while (buffer.byteLength - reader.offset >= 4) {
		const sectionOffset = reader.offset;
		const version = reader.u16("ACO version");
		if (version !== 1 && version !== 2) {
			reader.offset = sectionOffset;
			break;
		}
		const count = reader.u16(`ACO v${version} color count`);
		if (count > limits.maxResourceItems) fail$1(`ACO color count exceeds the ${limits.maxResourceItems}-item safety limit.`);
		const records = Array.from({ length: count }, (_, index) => parseAcoRecord(reader, version, index, limits));
		sections.set(version, records);
	}
	const selectedVersion = sections.has(2) ? 2 : sections.has(1) ? 1 : 0;
	if (!selectedVersion) fail$1("invalid ACO version or empty file.");
	const records = sections.get(selectedVersion);
	return {
		format: "aco",
		version: String(selectedVersion),
		colors: records.map((record, index) => normalizeColor(`aco-${index}`, record.name || `Color ${index + 1}`, [], record.model, record.components, "unspecified")),
		groups: [],
		unknownBlocks: 0,
		trailingBytes: buffer.byteLength - reader.offset
	};
};
var parseAdobePalette = (buffer, format, limits) => format === "ase" ? parseAdobeSwatchExchange(buffer, limits) : parseAdobeColorSwatch(buffer, limits);
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/idmlPreflight.js
var EOCD_SIGNATURE$1 = 101010256;
var CENTRAL_SIGNATURE = 33639248;
var LOCAL_SIGNATURE = 67324752;
var DATA_DESCRIPTOR_SIGNATURE$1 = 134695760;
var UTF8_FLAG = 2048;
var DATA_DESCRIPTOR_FLAG$1 = 8;
var ENCRYPTION_FLAGS = 8257;
var IDML_MIMETYPE = "application/vnd.adobe.indesign-idml-package";
var MAX_EOCD_SEARCH_BYTES = 65557;
var MAX_ENTRY_NAME_BYTES = 4096;
var IdmlPreflightError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "IdmlPreflightError";
	}
};
var fail = (code, message) => {
	throw new IdmlPreflightError(code, message);
};
var requireRange$1 = (offset, length, total, label) => {
	if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset > total || length > total - offset) fail("IDML_ZIP_RANGE", `${label} points outside the IDML package.`);
};
var addSize = (left, right, label) => {
	const result = left + right;
	if (!Number.isSafeInteger(result)) fail("IDML_ZIP_RANGE", `${label} exceeds JavaScript's safe integer range.`);
	return result;
};
var bytesEqual = (left, right) => {
	if (left.byteLength !== right.byteLength) return false;
	for (let index = 0; index < left.byteLength; index += 1) if (left[index] !== right[index]) return false;
	return true;
};
var decodeUtf8Path = (bytes) => {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		return fail("IDML_ZIP_PATH", "An IDML ZIP entry path is not valid UTF-8.");
	}
};
var decodeEntryPath = (bytes, flags) => {
	if (bytes.byteLength === 0 || bytes.byteLength > MAX_ENTRY_NAME_BYTES) fail("IDML_ZIP_PATH", "An IDML ZIP entry has an empty or oversized path.");
	if ((flags & UTF8_FLAG) === 0 && bytes.some((byte) => byte > 127)) fail("IDML_ZIP_PATH", "A non-UTF-8 IDML ZIP entry uses an ambiguous non-ASCII path.");
	const path = decodeUtf8Path(bytes);
	if (path.includes("\0") || path.includes("\\") || path.startsWith("/") || /^[A-Za-z]:/.test(path)) fail("IDML_ZIP_PATH", `Unsafe IDML ZIP entry path ${JSON.stringify(path)}.`);
	const directory = path.endsWith("/");
	const segments = path.split("/");
	if (directory) segments.pop();
	if (segments.length === 0 || segments.some((segment) => segment === "" || segment === "." || segment === "..")) fail("IDML_ZIP_PATH", `Unsafe IDML ZIP entry path ${JSON.stringify(path)}.`);
	return path;
};
var findEndOfCentralDirectory = (view) => {
	if (view.byteLength < 22) fail("IDML_ZIP_EOCD", "The IDML package is too short to contain a ZIP directory.");
	const first = Math.max(0, view.byteLength - MAX_EOCD_SEARCH_BYTES);
	for (let offset = view.byteLength - 22; offset >= first; offset -= 1) {
		if (view.getUint32(offset, true) !== EOCD_SIGNATURE$1) continue;
		const commentLength = view.getUint16(offset + 20, true);
		if (offset + 22 + commentLength === view.byteLength) return offset;
	}
	return fail("IDML_ZIP_EOCD", "The IDML ZIP end-of-central-directory record is missing or truncated.");
};
var inspectExtraFields$1 = (bytes, label) => {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let offset = 0;
	while (offset < bytes.byteLength) {
		requireRange$1(offset, 4, bytes.byteLength, `${label} extra-field header`);
		const id = view.getUint16(offset, true);
		const length = view.getUint16(offset + 2, true);
		requireRange$1(offset + 4, length, bytes.byteLength, `${label} extra field`);
		if (id === 1) fail("IDML_ZIP64_UNSUPPORTED", "ZIP64 IDML packages are not accepted by this bounded renderer.");
		if (id === 39169) fail("IDML_ZIP_ENCRYPTED", "Encrypted IDML ZIP entries are not supported.");
		offset += 4 + length;
	}
};
var compressionName = (method) => {
	if (method === 0) return "stored";
	if (method === 8) return "deflate";
	return fail("IDML_ZIP_COMPRESSION", `Unsupported IDML ZIP compression method ${method}.`);
};
var verifyLocalEntry = (bytes, view, centralDirectoryOffset, entry) => {
	requireRange$1(entry.localHeaderOffset, 30, centralDirectoryOffset, `Local header for ${entry.path}`);
	if (view.getUint32(entry.localHeaderOffset, true) !== LOCAL_SIGNATURE) fail("IDML_ZIP_LOCAL_HEADER", `The local header for ${JSON.stringify(entry.path)} is missing.`);
	const flags = view.getUint16(entry.localHeaderOffset + 6, true);
	const method = view.getUint16(entry.localHeaderOffset + 8, true);
	if (flags !== entry.flags || method !== entry.method) fail("IDML_ZIP_LOCAL_HEADER", `The local and central headers disagree for ${JSON.stringify(entry.path)}.`);
	const nameLength = view.getUint16(entry.localHeaderOffset + 26, true);
	const extraLength = view.getUint16(entry.localHeaderOffset + 28, true);
	const nameOffset = entry.localHeaderOffset + 30;
	requireRange$1(nameOffset, nameLength + extraLength, centralDirectoryOffset, `Local path for ${entry.path}`);
	if (!bytesEqual(bytes.subarray(nameOffset, nameOffset + nameLength), entry.rawName)) fail("IDML_ZIP_LOCAL_HEADER", `The local path does not match the central path for ${JSON.stringify(entry.path)}.`);
	inspectExtraFields$1(bytes.subarray(nameOffset + nameLength, nameOffset + nameLength + extraLength), `Local header for ${entry.path}`);
	const dataOffset = nameOffset + nameLength + extraLength;
	const dataEnd = addSize(dataOffset, entry.compressedSize, `Compressed payload for ${entry.path}`);
	requireRange$1(dataOffset, entry.compressedSize, centralDirectoryOffset, `Compressed payload for ${entry.path}`);
	let localEnd = dataEnd;
	if ((entry.flags & DATA_DESCRIPTOR_FLAG$1) !== 0) {
		requireRange$1(dataEnd, 12, centralDirectoryOffset, `Data descriptor for ${entry.path}`);
		const descriptorOffset = dataEnd + (view.getUint32(dataEnd, true) === DATA_DESCRIPTOR_SIGNATURE$1 ? 4 : 0);
		requireRange$1(descriptorOffset, 12, centralDirectoryOffset, `Data descriptor for ${entry.path}`);
		if (view.getUint32(descriptorOffset, true) !== entry.crc32 || view.getUint32(descriptorOffset + 4, true) !== entry.compressedSize || view.getUint32(descriptorOffset + 8, true) !== entry.uncompressedSize) fail("IDML_ZIP_DATA_DESCRIPTOR", `Invalid data descriptor for ${JSON.stringify(entry.path)}.`);
		localEnd = descriptorOffset + 12;
	} else if (view.getUint32(entry.localHeaderOffset + 14, true) !== entry.crc32 || view.getUint32(entry.localHeaderOffset + 18, true) !== entry.compressedSize || view.getUint32(entry.localHeaderOffset + 22, true) !== entry.uncompressedSize) fail("IDML_ZIP_LOCAL_HEADER", `The local sizes or CRC disagree for ${JSON.stringify(entry.path)}.`);
	return {
		dataOffset,
		localEnd
	};
};
var inspectIdmlZip = (source, limits) => {
	const bytes = source instanceof Uint8Array ? source : new Uint8Array(source);
	if (bytes.byteLength > limits.maxFileBytes) fail("IDML_FILE_LIMIT", `IDML source exceeds the ${limits.maxFileBytes}-byte safety limit.`);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const eocdOffset = findEndOfCentralDirectory(view);
	const diskNumber = view.getUint16(eocdOffset + 4, true);
	const centralDisk = view.getUint16(eocdOffset + 6, true);
	const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
	const entryCount = view.getUint16(eocdOffset + 10, true);
	const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
	const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
	if (diskNumber !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount) fail("IDML_ZIP_MULTIDISK", "Multi-disk IDML ZIP packages are not supported.");
	if (entryCount === 65535 || centralDirectorySize === 4294967295 || centralDirectoryOffset === 4294967295) fail("IDML_ZIP64_UNSUPPORTED", "ZIP64 IDML packages are not accepted by this bounded renderer.");
	if (entryCount === 0 || entryCount > limits.maxEntries) fail("IDML_ENTRY_LIMIT", `IDML ZIP entry count ${entryCount} is outside the configured safety limit.`);
	requireRange$1(centralDirectoryOffset, centralDirectorySize, eocdOffset, "IDML central directory");
	if (centralDirectoryOffset + centralDirectorySize !== eocdOffset) fail("IDML_ZIP_DIRECTORY", "The IDML central directory has an unsupported gap or trailing record.");
	const seenPaths = /* @__PURE__ */ new Set();
	const entries = [];
	let cursor = centralDirectoryOffset;
	let compressedBytes = 0;
	let uncompressedBytes = 0;
	for (let centralIndex = 0; centralIndex < entryCount; centralIndex += 1) {
		requireRange$1(cursor, 46, eocdOffset, `IDML central entry ${centralIndex}`);
		if (view.getUint32(cursor, true) !== CENTRAL_SIGNATURE) fail("IDML_ZIP_DIRECTORY", `IDML central entry ${centralIndex} has an invalid signature.`);
		const flags = view.getUint16(cursor + 8, true);
		const method = view.getUint16(cursor + 10, true);
		const crc32 = view.getUint32(cursor + 16, true);
		const compressedSize = view.getUint32(cursor + 20, true);
		const uncompressedSize = view.getUint32(cursor + 24, true);
		const nameLength = view.getUint16(cursor + 28, true);
		const extraLength = view.getUint16(cursor + 30, true);
		const commentLength = view.getUint16(cursor + 32, true);
		const diskStart = view.getUint16(cursor + 34, true);
		const localHeaderOffset = view.getUint32(cursor + 42, true);
		if ((flags & ENCRYPTION_FLAGS) !== 0) fail("IDML_ZIP_ENCRYPTED", "Encrypted IDML ZIP entries are not supported.");
		if (compressedSize === 4294967295 || uncompressedSize === 4294967295 || localHeaderOffset === 4294967295 || diskStart === 65535) fail("IDML_ZIP64_UNSUPPORTED", "ZIP64 IDML entries are not accepted by this bounded renderer.");
		if (diskStart !== 0) fail("IDML_ZIP_MULTIDISK", "An IDML entry points to another ZIP disk.");
		const compression = compressionName(method);
		if (compression === "stored" && compressedSize !== uncompressedSize) fail("IDML_ZIP_SIZE", "A stored IDML ZIP entry declares different compressed and uncompressed sizes.");
		if (compressedSize > limits.maxEntryCompressedBytes) fail("IDML_ENTRY_LIMIT", `An IDML ZIP entry exceeds the compressed-byte safety limit.`);
		if (uncompressedSize > limits.maxEntryUncompressedBytes) fail("IDML_ENTRY_LIMIT", `An IDML ZIP entry exceeds the uncompressed-byte safety limit.`);
		const ratio = uncompressedSize === 0 ? 1 : uncompressedSize / Math.max(1, compressedSize);
		if (ratio > limits.maxCompressionRatio) fail("IDML_ZIP_BOMB", `An IDML ZIP entry declares a ${ratio.toFixed(1)}:1 compression ratio.`);
		compressedBytes = addSize(compressedBytes, compressedSize, "IDML compressed byte total");
		uncompressedBytes = addSize(uncompressedBytes, uncompressedSize, "IDML uncompressed byte total");
		if (uncompressedBytes > limits.maxTotalUncompressedBytes) fail("IDML_ZIP_BOMB", "The IDML ZIP declared uncompressed total exceeds the configured safety limit.");
		const variableLength = nameLength + extraLength + commentLength;
		requireRange$1(cursor + 46, variableLength, eocdOffset, `IDML central entry ${centralIndex} metadata`);
		const rawName = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
		const path = decodeEntryPath(rawName, flags);
		if (seenPaths.has(path)) fail("IDML_ZIP_DUPLICATE", `Duplicate IDML ZIP entry ${JSON.stringify(path)}.`);
		seenPaths.add(path);
		inspectExtraFields$1(bytes.subarray(cursor + 46 + nameLength, cursor + 46 + nameLength + extraLength), `Central header for ${path}`);
		const centralEntry = {
			centralIndex,
			path,
			compression,
			compressedSize,
			uncompressedSize,
			localHeaderOffset,
			flags,
			method,
			crc32,
			rawName
		};
		const local = verifyLocalEntry(bytes, view, centralDirectoryOffset, centralEntry);
		entries.push({
			...centralEntry,
			...local
		});
		cursor += 46 + variableLength;
	}
	if (cursor !== eocdOffset) fail("IDML_ZIP_DIRECTORY", "The IDML central directory size does not match its entries.");
	const ranges = [...entries].sort((left, right) => left.localHeaderOffset - right.localHeaderOffset);
	for (let index = 1; index < ranges.length; index += 1) if (ranges[index - 1].localEnd > ranges[index].localHeaderOffset) fail("IDML_ZIP_OVERLAP", "IDML ZIP local entries overlap.");
	const mimetype = entries.find((entry) => entry.path === "mimetype");
	const designmap = entries.find((entry) => entry.path === "designmap.xml");
	if (!mimetype) return fail("IDML_REQUIRED_ENTRY", "IDML package must contain an exact-case mimetype entry.");
	if (!designmap) return fail("IDML_REQUIRED_ENTRY", "IDML package must contain an exact-case designmap.xml entry.");
	if (mimetype.localHeaderOffset !== 0 || mimetype.compression !== "stored") fail("IDML_MIMETYPE", "IDML mimetype must be the first local entry and must be stored.");
	const mimetypeBytes = bytes.subarray(mimetype.dataOffset, mimetype.dataOffset + mimetype.uncompressedSize);
	if (new TextDecoder().decode(mimetypeBytes) !== IDML_MIMETYPE) fail("IDML_MIMETYPE", "IDML mimetype entry has an unexpected value.");
	if (designmap.uncompressedSize === 0) fail("IDML_REQUIRED_ENTRY", "IDML designmap.xml must not be empty.");
	return {
		fileBytes: bytes.byteLength,
		entryCount,
		compressedBytes,
		uncompressedBytes,
		compressionRatio: uncompressedBytes === 0 ? 1 : uncompressedBytes / Math.max(1, compressedBytes),
		entries: entries.map((entry) => ({
			path: entry.path,
			compression: entry.compression,
			compressedSize: entry.compressedSize,
			uncompressedSize: entry.uncompressedSize,
			crc32: entry.crc32,
			localHeaderOffset: entry.localHeaderOffset,
			dataOffset: entry.dataOffset
		}))
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/xdZip.js
var import_saxes = require_saxes();
var import_lib = require_lib();
var DEFAULT_XD_ZIP_LIMITS = Object.freeze({
	maxFileBytes: 268435456,
	maxEntries: 4096,
	maxCentralDirectoryBytes: 8388608,
	maxEntryNameBytes: 1024,
	maxPathDepth: 24,
	maxEntryCompressedBytes: 67108864,
	maxEntryUncompressedBytes: 67108864,
	maxTotalUncompressedBytes: 536870912,
	maxCompressionRatio: 120
});
var EOCD_SIGNATURE = 101010256;
var CENTRAL_FILE_SIGNATURE = 33639248;
var LOCAL_FILE_SIGNATURE = 67324752;
var DATA_DESCRIPTOR_SIGNATURE = 134695760;
var DATA_DESCRIPTOR_FLAG = 8;
var ZIP64_EXTRA_ID = 1;
var AES_EXTRA_ID = 39169;
var EOCD_MIN_BYTES = 22;
var MAX_ZIP_COMMENT_BYTES = 65535;
var CENTRAL_FILE_FIXED_BYTES = 46;
var LOCAL_FILE_FIXED_BYTES = 30;
var positiveInteger$2 = (value, fallback) => {
	return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : fallback;
};
var resolveXdZipLimits = (overrides) => ({
	maxFileBytes: positiveInteger$2(overrides?.maxFileBytes, DEFAULT_XD_ZIP_LIMITS.maxFileBytes),
	maxEntries: positiveInteger$2(overrides?.maxEntries, DEFAULT_XD_ZIP_LIMITS.maxEntries),
	maxCentralDirectoryBytes: positiveInteger$2(overrides?.maxCentralDirectoryBytes, DEFAULT_XD_ZIP_LIMITS.maxCentralDirectoryBytes),
	maxEntryNameBytes: positiveInteger$2(overrides?.maxEntryNameBytes, DEFAULT_XD_ZIP_LIMITS.maxEntryNameBytes),
	maxPathDepth: positiveInteger$2(overrides?.maxPathDepth, DEFAULT_XD_ZIP_LIMITS.maxPathDepth),
	maxEntryCompressedBytes: positiveInteger$2(overrides?.maxEntryCompressedBytes, DEFAULT_XD_ZIP_LIMITS.maxEntryCompressedBytes),
	maxEntryUncompressedBytes: positiveInteger$2(overrides?.maxEntryUncompressedBytes, DEFAULT_XD_ZIP_LIMITS.maxEntryUncompressedBytes),
	maxTotalUncompressedBytes: positiveInteger$2(overrides?.maxTotalUncompressedBytes, DEFAULT_XD_ZIP_LIMITS.maxTotalUncompressedBytes),
	maxCompressionRatio: positiveInteger$2(overrides?.maxCompressionRatio, DEFAULT_XD_ZIP_LIMITS.maxCompressionRatio)
});
var requireRange = (offset, length, total, label) => {
	if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset > total - length) throw new Error(`${label} points outside the XD ZIP container.`);
};
var decodeEntryName = (bytes, utf8) => {
	if (!utf8 && bytes.some((byte) => byte < 32 || byte > 126)) throw new Error("XD ZIP entry names must be UTF-8 or printable ASCII.");
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		throw new Error("XD ZIP contains an invalid UTF-8 entry name.");
	}
};
var validateEntryName = (name, limits) => {
	if (!name || name.includes("\0")) throw new Error("XD ZIP contains an empty or NUL-containing entry name.");
	if (name.includes("\\")) throw new Error(`XD ZIP entry ${JSON.stringify(name)} uses unsafe backslash separators.`);
	if (name.startsWith("/") || /^[A-Za-z]:/.test(name)) throw new Error(`XD ZIP entry ${JSON.stringify(name)} is absolute.`);
	const directory = name.endsWith("/");
	const body = directory ? name.slice(0, -1) : name;
	const segments = body.split("/");
	if (!body || segments.length > limits.maxPathDepth || segments.some((segment) => !segment || segment === "." || segment === "..")) throw new Error(`XD ZIP entry ${JSON.stringify(name)} contains an unsafe path.`);
	return directory;
};
var findEocdOffset = (view) => {
	if (view.byteLength < EOCD_MIN_BYTES) throw new Error("XD file is too short to contain a ZIP directory.");
	const first = Math.max(0, view.byteLength - EOCD_MIN_BYTES - MAX_ZIP_COMMENT_BYTES);
	for (let offset = view.byteLength - EOCD_MIN_BYTES; offset >= first; offset -= 1) {
		if (view.getUint32(offset, true) !== EOCD_SIGNATURE) continue;
		const commentBytes = view.getUint16(offset + 20, true);
		if (offset + EOCD_MIN_BYTES + commentBytes === view.byteLength) return offset;
	}
	throw new Error("XD ZIP end-of-central-directory record was not found.");
};
var byteRangesEqual = (left, leftOffset, right, rightOffset, length) => {
	for (let index = 0; index < length; index += 1) if (left[leftOffset + index] !== right[rightOffset + index]) return false;
	return true;
};
var inspectExtraFields = (bytes, label) => {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let offset = 0;
	while (offset < bytes.byteLength) {
		requireRange(offset, 4, bytes.byteLength, `${label} extra-field header`);
		const id = view.getUint16(offset, true);
		const length = view.getUint16(offset + 2, true);
		requireRange(offset + 4, length, bytes.byteLength, `${label} extra field`);
		if (id === ZIP64_EXTRA_ID) throw new Error("ZIP64 XD entries are not supported by the bounded browser parser.");
		if (id === AES_EXTRA_ID) throw new Error("Encrypted XD ZIP entries are not supported.");
		offset += 4 + length;
	}
};
var inspectXdZipCentralDirectory = (buffer, overrides) => {
	const limits = resolveXdZipLimits(overrides);
	if (buffer.byteLength > limits.maxFileBytes) throw new Error(`XD ZIP is ${buffer.byteLength} bytes, exceeding the ${limits.maxFileBytes}-byte file limit.`);
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);
	const eocdOffset = findEocdOffset(view);
	const diskNumber = view.getUint16(eocdOffset + 4, true);
	const centralDirectoryDisk = view.getUint16(eocdOffset + 6, true);
	const diskEntryCount = view.getUint16(eocdOffset + 8, true);
	const entryCount = view.getUint16(eocdOffset + 10, true);
	const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
	const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
	if (diskNumber !== 0 || centralDirectoryDisk !== 0 || diskEntryCount !== entryCount) throw new Error("Multi-disk XD ZIP containers are not supported.");
	if (entryCount === 65535 || centralDirectorySize === 4294967295 || centralDirectoryOffset === 4294967295) throw new Error("ZIP64 XD containers are not supported by the bounded browser parser.");
	if (entryCount === 0 || entryCount > limits.maxEntries) throw new Error(`XD ZIP entry count ${entryCount} is outside the 1-${limits.maxEntries} safety range.`);
	if (centralDirectorySize > limits.maxCentralDirectoryBytes) throw new Error(`XD ZIP central directory exceeds ${limits.maxCentralDirectoryBytes} bytes.`);
	requireRange(centralDirectoryOffset, centralDirectorySize, eocdOffset, "XD ZIP central directory");
	if (centralDirectoryOffset + centralDirectorySize !== eocdOffset) throw new Error("XD ZIP central directory has an unsupported gap or trailing record.");
	const entries = [];
	const entryByName = /* @__PURE__ */ new Map();
	const canonicalNames = /* @__PURE__ */ new Set();
	const localOffsets = /* @__PURE__ */ new Set();
	const occupiedLocalRanges = [];
	let totalUncompressedBytes = 0;
	let offset = centralDirectoryOffset;
	for (let index = 0; index < entryCount; index += 1) {
		requireRange(offset, CENTRAL_FILE_FIXED_BYTES, eocdOffset, "XD ZIP central-directory entry");
		if (view.getUint32(offset, true) !== CENTRAL_FILE_SIGNATURE) throw new Error(`XD ZIP central-directory entry ${index + 1} has an invalid signature.`);
		const flags = view.getUint16(offset + 8, true);
		const method = view.getUint16(offset + 10, true);
		const crc32 = view.getUint32(offset + 16, true);
		const compressedSize = view.getUint32(offset + 20, true);
		const uncompressedSize = view.getUint32(offset + 24, true);
		const nameBytes = view.getUint16(offset + 28, true);
		const extraBytes = view.getUint16(offset + 30, true);
		const commentBytes = view.getUint16(offset + 32, true);
		const diskStart = view.getUint16(offset + 34, true);
		const localHeaderOffset = view.getUint32(offset + 42, true);
		const recordBytes = CENTRAL_FILE_FIXED_BYTES + nameBytes + extraBytes + commentBytes;
		requireRange(offset, recordBytes, eocdOffset, "XD ZIP central-directory record");
		if (nameBytes === 0 || nameBytes > limits.maxEntryNameBytes) throw new Error(`XD ZIP entry ${index + 1} has an invalid filename length.`);
		if (diskStart !== 0) throw new Error("XD ZIP entry starts on an unsupported secondary disk.");
		if ((flags & 1) !== 0) throw new Error("Encrypted XD ZIP entries are not supported.");
		if ((flags & -2063) !== 0) throw new Error(`XD ZIP entry ${index + 1} uses unsupported general-purpose flags 0x${flags.toString(16)}.`);
		if (method !== 0 && method !== 8) throw new Error(`XD ZIP entry ${index + 1} uses unsupported compression method ${method}.`);
		if (compressedSize === 4294967295 || uncompressedSize === 4294967295 || localHeaderOffset === 4294967295) throw new Error("ZIP64 XD entries are not supported by the bounded browser parser.");
		if (compressedSize > limits.maxEntryCompressedBytes || uncompressedSize > limits.maxEntryUncompressedBytes) throw new Error(`XD ZIP entry ${index + 1} exceeds the per-entry size limit.`);
		if (uncompressedSize > 0) {
			if (compressedSize === 0) throw new Error(`XD ZIP entry ${index + 1} has an impossible zero compressed size.`);
			if (uncompressedSize / compressedSize > limits.maxCompressionRatio) throw new Error(`XD ZIP entry ${index + 1} exceeds the ${limits.maxCompressionRatio}:1 compression-ratio limit.`);
		}
		totalUncompressedBytes += uncompressedSize;
		if (!Number.isSafeInteger(totalUncompressedBytes) || totalUncompressedBytes > limits.maxTotalUncompressedBytes) throw new Error(`XD ZIP expands beyond the ${limits.maxTotalUncompressedBytes}-byte aggregate limit.`);
		const centralNameOffset = offset + CENTRAL_FILE_FIXED_BYTES;
		inspectExtraFields(bytes.subarray(centralNameOffset + nameBytes, centralNameOffset + nameBytes + extraBytes), `XD ZIP central header for entry ${index + 1}`);
		const name = decodeEntryName(bytes.subarray(centralNameOffset, centralNameOffset + nameBytes), (flags & 2048) !== 0);
		const directory = validateEntryName(name, limits);
		const canonicalName = name.normalize("NFC").toLocaleLowerCase("en-US");
		if (canonicalNames.has(canonicalName)) throw new Error(`XD ZIP contains an ambiguous duplicate entry ${JSON.stringify(name)}.`);
		canonicalNames.add(canonicalName);
		if (localOffsets.has(localHeaderOffset)) throw new Error(`XD ZIP entries reuse local header offset ${localHeaderOffset}.`);
		localOffsets.add(localHeaderOffset);
		requireRange(localHeaderOffset, LOCAL_FILE_FIXED_BYTES, centralDirectoryOffset, `XD ZIP local header for ${name}`);
		if (view.getUint32(localHeaderOffset, true) !== LOCAL_FILE_SIGNATURE) throw new Error(`XD ZIP local header for ${JSON.stringify(name)} has an invalid signature.`);
		const localFlags = view.getUint16(localHeaderOffset + 6, true);
		const localMethod = view.getUint16(localHeaderOffset + 8, true);
		const localNameBytes = view.getUint16(localHeaderOffset + 26, true);
		const localExtraBytes = view.getUint16(localHeaderOffset + 28, true);
		if (localFlags !== flags || localMethod !== method || localNameBytes !== nameBytes) throw new Error(`XD ZIP local and central headers disagree for ${JSON.stringify(name)}.`);
		const localNameOffset = localHeaderOffset + LOCAL_FILE_FIXED_BYTES;
		requireRange(localNameOffset, localNameBytes + localExtraBytes, centralDirectoryOffset, `XD ZIP local metadata for ${name}`);
		if (!byteRangesEqual(bytes, localNameOffset, bytes, centralNameOffset, nameBytes)) throw new Error(`XD ZIP local and central filenames disagree for ${JSON.stringify(name)}.`);
		inspectExtraFields(bytes.subarray(localNameOffset + localNameBytes, localNameOffset + localNameBytes + localExtraBytes), `XD ZIP local header for ${name}`);
		if ((flags & DATA_DESCRIPTOR_FLAG) === 0) {
			const localCrc = view.getUint32(localHeaderOffset + 14, true);
			const localCompressedSize = view.getUint32(localHeaderOffset + 18, true);
			const localUncompressedSize = view.getUint32(localHeaderOffset + 22, true);
			if (localCrc !== crc32 || localCompressedSize !== compressedSize || localUncompressedSize !== uncompressedSize) throw new Error(`XD ZIP local sizes or CRC disagree for ${JSON.stringify(name)}.`);
		}
		const dataOffset = localNameOffset + localNameBytes + localExtraBytes;
		requireRange(dataOffset, compressedSize, centralDirectoryOffset, `XD ZIP compressed data for ${name}`);
		const dataEnd = dataOffset + compressedSize;
		let localEnd = dataEnd;
		if ((flags & DATA_DESCRIPTOR_FLAG) !== 0) {
			requireRange(dataEnd, 12, centralDirectoryOffset, `XD ZIP data descriptor for ${name}`);
			const descriptorOffset = dataEnd + (view.getUint32(dataEnd, true) === DATA_DESCRIPTOR_SIGNATURE ? 4 : 0);
			requireRange(descriptorOffset, 12, centralDirectoryOffset, `XD ZIP data descriptor for ${name}`);
			if (view.getUint32(descriptorOffset, true) !== crc32 || view.getUint32(descriptorOffset + 4, true) !== compressedSize || view.getUint32(descriptorOffset + 8, true) !== uncompressedSize) throw new Error(`XD ZIP data descriptor disagrees for ${JSON.stringify(name)}.`);
			localEnd = descriptorOffset + 12;
		}
		occupiedLocalRanges.push({
			start: localHeaderOffset,
			end: localEnd,
			name
		});
		const entry = {
			name,
			compressedSize,
			uncompressedSize,
			crc32,
			compressionMethod: method,
			flags,
			localHeaderOffset,
			dataOffset,
			directory
		};
		entries.push(entry);
		entryByName.set(name, entry);
		offset += recordBytes;
	}
	if (offset !== eocdOffset) throw new Error("XD ZIP central-directory size does not match its entries.");
	occupiedLocalRanges.sort((left, right) => left.start - right.start);
	for (let index = 1; index < occupiedLocalRanges.length; index += 1) {
		const previous = occupiedLocalRanges[index - 1];
		const current = occupiedLocalRanges[index];
		if (current.start < previous.end) throw new Error(`XD ZIP local records overlap: ${JSON.stringify(previous.name)} and ${JSON.stringify(current.name)}.`);
	}
	return {
		entries,
		entryByName,
		centralDirectoryOffset,
		centralDirectorySize,
		totalUncompressedBytes,
		fileBytes: buffer.byteLength
	};
};
var CRC32_TABLE = (() => {
	const table = /* @__PURE__ */ new Uint32Array(256);
	for (let index = 0; index < table.length; index += 1) {
		let value = index;
		for (let bit = 0; bit < 8; bit += 1) value = (value & 1) !== 0 ? 3988292384 ^ value >>> 1 : value >>> 1;
		table[index] = value >>> 0;
	}
	return table;
})();
var calculateXdZipCrc32 = (bytes) => {
	let value = 4294967295;
	for (const byte of bytes) value = CRC32_TABLE[(value ^ byte) & 255] ^ value >>> 8;
	return (value ^ 4294967295) >>> 0;
};
var inflateRawBounded = async (compressed, expectedBytes) => {
	if (typeof DecompressionStream === "undefined") throw new Error("This browser does not expose DecompressionStream for XD ZIP deflate entries.");
	let decompressor;
	try {
		decompressor = new DecompressionStream("deflate-raw");
	} catch {
		throw new Error("This browser does not support raw DEFLATE streams required by the XD ZIP entry.");
	}
	const reader = new Blob([compressed]).stream().pipeThrough(decompressor).getReader();
	const output = new Uint8Array(expectedBytes);
	let written = 0;
	try {
		for (;;) {
			const chunk = await reader.read();
			if (chunk.done) break;
			if (written + chunk.value.byteLength > expectedBytes) {
				await reader.cancel();
				throw new Error("XD ZIP entry inflated beyond its declared size.");
			}
			output.set(chunk.value, written);
			written += chunk.value.byteLength;
		}
	} finally {
		reader.releaseLock();
	}
	if (written !== expectedBytes) throw new Error(`XD ZIP entry inflated to ${written} bytes instead of its declared ${expectedBytes} bytes.`);
	return output;
};
var extractXdZipEntry = async (buffer, directory, entryName, maxOutputBytes) => {
	if (directory.fileBytes !== buffer.byteLength) throw new Error("XD ZIP directory belongs to a different buffer.");
	const entry = directory.entryByName.get(entryName);
	if (!entry || entry.directory) throw new Error(`XD ZIP entry ${JSON.stringify(entryName)} was not found.`);
	if (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes <= 0 || entry.uncompressedSize > maxOutputBytes) throw new Error(`XD ZIP entry ${JSON.stringify(entryName)} exceeds its extraction limit.`);
	const compressed = buffer.slice(entry.dataOffset, entry.dataOffset + entry.compressedSize);
	const output = entry.compressionMethod === 0 ? new Uint8Array(compressed) : await inflateRawBounded(compressed, entry.uncompressedSize);
	if (output.byteLength !== entry.uncompressedSize) throw new Error(`XD ZIP stored entry ${JSON.stringify(entryName)} has an inconsistent size.`);
	if (calculateXdZipCrc32(output) !== entry.crc32) throw new Error(`XD ZIP entry ${JSON.stringify(entryName)} failed CRC-32 validation.`);
	return output;
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/flaZip.js
var DEFAULT_FLA_ZIP_LIMITS = Object.freeze({
	...DEFAULT_XD_ZIP_LIMITS,
	maxFileBytes: 268435456,
	maxEntries: 8192,
	maxEntryUncompressedBytes: 100663296,
	maxTotalUncompressedBytes: 536870912,
	maxCompressionRatio: 120
});
var rewriteZipError = (error) => {
	if (!(error instanceof Error)) throw error;
	const replacement = new Error(error.message.replaceAll("XD ZIP", "FLA ZIP").replaceAll("XD file", "FLA file").replaceAll("XD containers", "FLA containers").replaceAll("XD entries", "FLA entries").replaceAll("XD entry", "FLA entry"));
	replacement.name = error.name;
	throw replacement;
};
var resolveFlaZipLimits = (overrides) => ({ ...resolveXdZipLimits({
	...DEFAULT_FLA_ZIP_LIMITS,
	...overrides
}) });
var inspectFlaZipCentralDirectory = (buffer, overrides) => {
	try {
		return inspectXdZipCentralDirectory(buffer, resolveFlaZipLimits(overrides));
	} catch (error) {
		return rewriteZipError(error);
	}
};
var extractFlaZipEntry = async (buffer, directory, entryName, maxOutputBytes) => {
	try {
		return await extractXdZipEntry(buffer, directory, entryName, maxOutputBytes);
	} catch (error) {
		return rewriteZipError(error);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/flaContainer.js
var XFL_NAMESPACE = "http://ns.adobe.com/xfl/2008/";
var XFL_MIME = "application/vnd.adobe.xfl";
var CFB_MAGIC = [
	208,
	207,
	17,
	224,
	161,
	177,
	26,
	225
];
var MAX_REPORTED_WARNINGS = 128;
var DEFAULT_FLA_CONTAINER_LIMITS = Object.freeze({
	...DEFAULT_FLA_ZIP_LIMITS,
	maxXmlFileBytes: 12582912,
	maxXmlTotalBytes: 50331648,
	maxXmlFiles: 512,
	maxXmlNodes: 25e4,
	maxXmlDepth: 128,
	maxXmlAttributes: 75e4,
	maxXmlTextBytes: 25165824,
	maxAttributeBytes: 2097152,
	maxXmlTotalNodes: 3e5,
	maxXmlTotalAttributes: 1e6,
	maxXmlTotalTextBytes: 33554432,
	maxXmlTotalAttributeBytes: 4194304,
	maxTimelines: 256,
	maxLayers: 2e4,
	maxFrames: 25e4,
	maxSymbols: 8192,
	maxReportedResources: 2048,
	maxPreviewElements: 1e4,
	maxPreviewPathCommands: 25e4,
	maxPreviewSvgBytes: 16777216,
	maxPreviewAssetBytes: 8388608,
	maxPreviewAssetTotalBytes: 33554432,
	maxPreviewDimension: 16384,
	maxPreviewPixels: 64e6,
	maxSymbolDepth: 24
});
/**
* Trusted hosts may raise the normal XML budgets, but they cannot disable the
* pre-DOM safety boundary with an arbitrarily large option value.
*/
var HARD_FLA_XML_LIMITS = Object.freeze({
	maxXmlFileBytes: 25165824,
	maxXmlTotalBytes: 100663296,
	maxXmlFiles: 1024,
	maxXmlNodes: 5e5,
	maxXmlDepth: 256,
	maxXmlAttributes: 1e6,
	maxXmlTextBytes: 25165824,
	maxAttributeBytes: 8388608,
	maxXmlTotalNodes: 5e5,
	maxXmlTotalAttributes: 15e5,
	maxXmlTotalTextBytes: 67108864,
	maxXmlTotalAttributeBytes: 8388608
});
var positiveInteger$1 = (value, fallback, hardMaximum = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(value) && Number(value) > 0 ? Math.min(Number(value), hardMaximum) : fallback;
var resolveFlaContainerLimits = (overrides) => ({
	...resolveFlaZipLimits(overrides),
	maxXmlFileBytes: positiveInteger$1(overrides?.maxXmlFileBytes, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlFileBytes, HARD_FLA_XML_LIMITS.maxXmlFileBytes),
	maxXmlTotalBytes: positiveInteger$1(overrides?.maxXmlTotalBytes, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlTotalBytes, HARD_FLA_XML_LIMITS.maxXmlTotalBytes),
	maxXmlFiles: positiveInteger$1(overrides?.maxXmlFiles, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlFiles, HARD_FLA_XML_LIMITS.maxXmlFiles),
	maxXmlNodes: positiveInteger$1(overrides?.maxXmlNodes, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlNodes, HARD_FLA_XML_LIMITS.maxXmlNodes),
	maxXmlDepth: positiveInteger$1(overrides?.maxXmlDepth, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlDepth, HARD_FLA_XML_LIMITS.maxXmlDepth),
	maxXmlAttributes: positiveInteger$1(overrides?.maxXmlAttributes, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlAttributes, HARD_FLA_XML_LIMITS.maxXmlAttributes),
	maxXmlTextBytes: positiveInteger$1(overrides?.maxXmlTextBytes, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlTextBytes, HARD_FLA_XML_LIMITS.maxXmlTextBytes),
	maxAttributeBytes: positiveInteger$1(overrides?.maxAttributeBytes, DEFAULT_FLA_CONTAINER_LIMITS.maxAttributeBytes, HARD_FLA_XML_LIMITS.maxAttributeBytes),
	maxXmlTotalNodes: positiveInteger$1(overrides?.maxXmlTotalNodes, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlTotalNodes, HARD_FLA_XML_LIMITS.maxXmlTotalNodes),
	maxXmlTotalAttributes: positiveInteger$1(overrides?.maxXmlTotalAttributes, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlTotalAttributes, HARD_FLA_XML_LIMITS.maxXmlTotalAttributes),
	maxXmlTotalTextBytes: positiveInteger$1(overrides?.maxXmlTotalTextBytes, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlTotalTextBytes, HARD_FLA_XML_LIMITS.maxXmlTotalTextBytes),
	maxXmlTotalAttributeBytes: positiveInteger$1(overrides?.maxXmlTotalAttributeBytes, DEFAULT_FLA_CONTAINER_LIMITS.maxXmlTotalAttributeBytes, HARD_FLA_XML_LIMITS.maxXmlTotalAttributeBytes),
	maxTimelines: positiveInteger$1(overrides?.maxTimelines, DEFAULT_FLA_CONTAINER_LIMITS.maxTimelines),
	maxLayers: positiveInteger$1(overrides?.maxLayers, DEFAULT_FLA_CONTAINER_LIMITS.maxLayers),
	maxFrames: positiveInteger$1(overrides?.maxFrames, DEFAULT_FLA_CONTAINER_LIMITS.maxFrames),
	maxSymbols: positiveInteger$1(overrides?.maxSymbols, DEFAULT_FLA_CONTAINER_LIMITS.maxSymbols),
	maxReportedResources: positiveInteger$1(overrides?.maxReportedResources, DEFAULT_FLA_CONTAINER_LIMITS.maxReportedResources),
	maxPreviewElements: positiveInteger$1(overrides?.maxPreviewElements, DEFAULT_FLA_CONTAINER_LIMITS.maxPreviewElements),
	maxPreviewPathCommands: positiveInteger$1(overrides?.maxPreviewPathCommands, DEFAULT_FLA_CONTAINER_LIMITS.maxPreviewPathCommands),
	maxPreviewSvgBytes: positiveInteger$1(overrides?.maxPreviewSvgBytes, DEFAULT_FLA_CONTAINER_LIMITS.maxPreviewSvgBytes),
	maxPreviewAssetBytes: positiveInteger$1(overrides?.maxPreviewAssetBytes, DEFAULT_FLA_CONTAINER_LIMITS.maxPreviewAssetBytes),
	maxPreviewAssetTotalBytes: positiveInteger$1(overrides?.maxPreviewAssetTotalBytes, DEFAULT_FLA_CONTAINER_LIMITS.maxPreviewAssetTotalBytes),
	maxPreviewDimension: positiveInteger$1(overrides?.maxPreviewDimension, DEFAULT_FLA_CONTAINER_LIMITS.maxPreviewDimension),
	maxPreviewPixels: positiveInteger$1(overrides?.maxPreviewPixels, DEFAULT_FLA_CONTAINER_LIMITS.maxPreviewPixels),
	maxSymbolDepth: positiveInteger$1(overrides?.maxSymbolDepth, DEFAULT_FLA_CONTAINER_LIMITS.maxSymbolDepth)
});
var localName = (node) => (node.localName || node.nodeName).split(":").pop().toLowerCase();
var elementChildren = (node, name) => Array.from(node.childNodes).filter((child) => child.nodeType === 1).filter((child) => !name || localName(child) === name);
var descendants = (node, name) => {
	const result = [];
	const stack = [...elementChildren(node)].reverse();
	while (stack.length > 0) {
		const current = stack.pop();
		if (localName(current) === name) result.push(current);
		const children = elementChildren(current);
		for (let index = children.length - 1; index >= 0; index -= 1) stack.push(children[index]);
	}
	return result;
};
var directContainerChildren = (node, containerName, childName) => {
	const container = elementChildren(node, containerName)[0];
	return container ? elementChildren(container, childName) : [];
};
var containerElements = (node, containerName) => {
	const container = elementChildren(node, containerName)[0];
	return container ? elementChildren(container) : [];
};
var boundedString = (value, fallback, max = 4096) => {
	const normalized = (value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
	return normalized ? normalized.slice(0, max) : fallback;
};
var finiteNumber = (value, fallback) => {
	if (value === null || value === void 0 || value.trim() === "") return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};
var nonNegativeInteger = (value) => {
	if (value === null || value === void 0 || value.trim() === "") return void 0;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : void 0;
};
var booleanAttribute = (value, fallback) => {
	if (value === null || value === "") return fallback;
	return value.toLowerCase() !== "false" && value !== "0";
};
var safeColor = (value, fallback) => {
	const normalized = (value || "").trim();
	return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized.toUpperCase() : fallback;
};
var escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
var appendWarning = (warnings, message) => {
	if (warnings.includes(message)) return;
	if (warnings.length < MAX_REPORTED_WARNINGS) warnings.push(message);
	else if (warnings.length === MAX_REPORTED_WARNINGS) warnings.push(`Additional FLA/XFL warnings were omitted after ${MAX_REPORTED_WARNINGS} distinct messages.`);
};
var isZip = (bytes) => bytes.byteLength >= 4 && bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4;
var isLegacyBinaryFla = (bytes) => bytes.byteLength >= CFB_MAGIC.length && CFB_MAGIC.every((byte, index) => bytes[index] === byte);
var decodeUtf8 = (bytes, label) => {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		throw new Error(`${label} is not valid UTF-8.`);
	}
};
var FlaXmlPreflightError = class extends Error {
	phase = "pre-dom";
	constructor(message) {
		super(message);
		this.name = "FlaXmlPreflightError";
	}
};
var failXmlPreflight = (message) => {
	throw new FlaXmlPreflightError(message);
};
var createXmlBudget = () => ({
	files: 0,
	bytes: 0,
	nodes: 0,
	attributes: 0,
	textBytes: 0,
	attributeBytes: 0
});
var utf8ByteLength = (value) => {
	let bytes = 0;
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code <= 127) bytes += 1;
		else if (code <= 2047) bytes += 2;
		else if (code >= 55296 && code <= 56319 && index + 1 < value.length) {
			const next = value.charCodeAt(index + 1);
			if (next >= 56320 && next <= 57343) {
				bytes += 4;
				index += 1;
			} else bytes += 3;
		} else bytes += 3;
	}
	return bytes;
};
var preflightXmlBeforeDom = (source, limits, label) => {
	let nodes = 1;
	let depth = 0;
	let maximumDepth = 0;
	let attributes = 0;
	let textBytes = 0;
	let attributeBytes = 0;
	const countNode = () => {
		nodes += 1;
		if (nodes > limits.maxXmlNodes) failXmlPreflight(`${label} exceeds the ${limits.maxXmlNodes}-node XML limit.`);
	};
	const countText = (text) => {
		countNode();
		textBytes += utf8ByteLength(text);
		if (textBytes > limits.maxXmlTextBytes) failXmlPreflight(`${label} exceeds the ${limits.maxXmlTextBytes}-byte XML text limit.`);
	};
	const parser = new import_saxes.SaxesParser({
		xmlns: false,
		position: false,
		fileName: label
	});
	parser.on("error", (error) => {
		throw error;
	});
	parser.on("doctype", () => failXmlPreflight(`${label} contains a forbidden DTD or ENTITY declaration.`));
	parser.on("processinginstruction", (instruction) => {
		if (instruction.target.toLowerCase() === "xml-stylesheet") failXmlPreflight(`${label} contains an external-capable XML stylesheet instruction.`);
		countNode();
	});
	parser.on("opentagstart", () => {
		countNode();
		depth += 1;
		maximumDepth = Math.max(maximumDepth, depth);
		if (depth > limits.maxXmlDepth) failXmlPreflight(`${label} exceeds the ${limits.maxXmlDepth}-level XML limit.`);
	});
	parser.on("attribute", (attribute) => {
		attributes += 1;
		if (attributes > limits.maxXmlAttributes) failXmlPreflight(`${label} exceeds the ${limits.maxXmlAttributes}-attribute XML limit.`);
		attributeBytes += utf8ByteLength(attribute.name) + utf8ByteLength(attribute.value);
		if (attributeBytes > limits.maxAttributeBytes) failXmlPreflight(`${label} exceeds the ${limits.maxAttributeBytes}-byte XML attribute limit.`);
	});
	parser.on("closetag", () => {
		depth = Math.max(0, depth - 1);
	});
	parser.on("text", countText);
	parser.on("cdata", countText);
	parser.on("comment", () => countNode());
	try {
		parser.write(source).close();
	} catch (error) {
		if (error instanceof FlaXmlPreflightError) throw error;
		throw new Error(`${label} is not well-formed XML: ${error instanceof Error ? error.message : String(error)}`);
	}
	return {
		nodes,
		maximumDepth,
		attributes,
		textBytes,
		attributeBytes
	};
};
var requireXmlEnvelopeCapacity = (budget, additionalBytes, limits, label) => {
	if (budget.files + 1 > limits.maxXmlFiles) failXmlPreflight(`${label} would exceed the aggregate ${limits.maxXmlFiles}-file XML limit.`);
	if (budget.bytes + additionalBytes > limits.maxXmlTotalBytes) failXmlPreflight(`${label} would exceed the aggregate ${limits.maxXmlTotalBytes}-byte XML source limit.`);
};
var commitXmlBudget = (budget, byteLength, preflight, limits, label) => {
	requireXmlEnvelopeCapacity(budget, byteLength, limits, label);
	const nextNodes = budget.nodes + preflight.nodes;
	const nextAttributes = budget.attributes + preflight.attributes;
	const nextTextBytes = budget.textBytes + preflight.textBytes;
	const nextAttributeBytes = budget.attributeBytes + preflight.attributeBytes;
	if (nextNodes > limits.maxXmlTotalNodes) failXmlPreflight(`${label} would exceed the aggregate ${limits.maxXmlTotalNodes}-node XML limit.`);
	if (nextAttributes > limits.maxXmlTotalAttributes) failXmlPreflight(`${label} would exceed the aggregate ${limits.maxXmlTotalAttributes}-attribute XML limit.`);
	if (nextTextBytes > limits.maxXmlTotalTextBytes) failXmlPreflight(`${label} would exceed the aggregate ${limits.maxXmlTotalTextBytes}-byte XML text limit.`);
	if (nextAttributeBytes > limits.maxXmlTotalAttributeBytes) failXmlPreflight(`${label} would exceed the aggregate ${limits.maxXmlTotalAttributeBytes}-byte XML attribute limit.`);
	budget.files += 1;
	budget.bytes += byteLength;
	budget.nodes = nextNodes;
	budget.attributes = nextAttributes;
	budget.textBytes = nextTextBytes;
	budget.attributeBytes = nextAttributeBytes;
};
var parseXmlBytes = (bytes, path, limits, xmlBudget) => {
	if (bytes.byteLength === 0 || bytes.byteLength > limits.maxXmlFileBytes) throw new Error(`${path} is outside the 1-${limits.maxXmlFileBytes} byte XML limit.`);
	const source = decodeUtf8(bytes, path);
	const preflight = preflightXmlBeforeDom(source, limits, path);
	commitXmlBudget(xmlBudget, bytes.byteLength, preflight, limits, path);
	let document;
	try {
		document = new import_lib.DOMParser({
			locator: false,
			onError: (level, message) => {
				throw new Error(`${level}: ${message}`);
			}
		}).parseFromString(source, "application/xml");
	} catch (error) {
		throw new Error(`${path} is not well-formed XML: ${error instanceof Error ? error.message : String(error)}`);
	}
	return {
		path,
		document,
		byteLength: bytes.byteLength,
		preflight
	};
};
var normalizedLibraryPath = (href) => {
	if (!href || href.includes("\0") || href.includes("\\") || href.startsWith("/") || /^[A-Za-z]:/.test(href)) return;
	const segments = href.split("/");
	if (segments.some((segment) => !segment || segment === "." || segment === "..")) return;
	return `LIBRARY/${segments.join("/")}`;
};
var findEntry = (directory, name) => directory.entryByName.get(name);
var extractTextEntry = async (buffer, directory, entry, limits, xmlBudget) => {
	requireXmlEnvelopeCapacity(xmlBudget, entry.uncompressedSize, limits, entry.name);
	return parseXmlBytes(await extractFlaZipEntry(buffer, directory, entry.name, limits.maxXmlFileBytes), entry.name, limits, xmlBudget);
};
var classifyResource = (path) => {
	const normalized = path.toLowerCase();
	if (normalized.endsWith(".xml") || normalized.endsWith(".xfl")) return "xml";
	if (/\.(?:png|jpe?g|gif|webp|bmp)$/.test(normalized)) return "image";
	if (/\.(?:mp3|wav|aac|m4a|flac)$/.test(normalized)) return "audio";
	if (/\.(?:mp4|m4v|mov|flv|webm)$/.test(normalized)) return "video";
	if (/\.(?:as|js|html?|css)$/.test(normalized)) return "script";
	if (normalized === "mimetype" || normalized.startsWith("meta-inf/")) return "metadata";
	return "binary";
};
var emptyElementCounts = () => ({
	shapes: 0,
	symbols: 0,
	bitmaps: 0,
	text: 0,
	groups: 0,
	other: 0
});
var addElementCount = (counts, name) => {
	if (name === "domshape" || name === "domrectangleobject" || name === "domovalobject") counts.shapes += 1;
	else if (name === "domsymbolinstance") counts.symbols += 1;
	else if (name === "dombitmapinstance") counts.bitmaps += 1;
	else if (name.includes("text")) counts.text += 1;
	else if (name === "domgroup") counts.groups += 1;
	else counts.other += 1;
};
var timelineElements = (root) => {
	if (localName(root) === "domdocument") return directContainerChildren(root, "timelines", "domtimeline");
	const timelineContainer = elementChildren(root, "timeline")[0];
	return timelineContainer ? elementChildren(timelineContainer, "domtimeline") : [];
};
var summarizeTimelines = (root, limits, counters) => {
	const timelines = timelineElements(root);
	const summaries = [];
	for (const timeline of timelines) {
		counters.timelines += 1;
		if (counters.timelines > limits.maxTimelines) throw new Error(`FLA/XFL contains more than ${limits.maxTimelines} timelines.`);
		const layers = directContainerChildren(timeline, "layers", "domlayer");
		const layerSummaries = [];
		let timelineFrameCount = 1;
		for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
			const layer = layers[layerIndex];
			counters.layers += 1;
			if (counters.layers > limits.maxLayers) throw new Error(`FLA/XFL contains more than ${limits.maxLayers} layers.`);
			const frames = directContainerChildren(layer, "frames", "domframe");
			counters.frames += frames.length;
			if (counters.frames > limits.maxFrames) throw new Error(`FLA/XFL contains more than ${limits.maxFrames} keyframes.`);
			const counts = emptyElementCounts();
			let layerFrameCount = 1;
			for (const frame of frames) {
				const index = nonNegativeInteger(frame.getAttribute("index")) ?? 0;
				const duration = Math.max(1, nonNegativeInteger(frame.getAttribute("duration")) ?? 1);
				layerFrameCount = Math.max(layerFrameCount, index + duration);
				for (const element of containerElements(frame, "elements")) addElementCount(counts, localName(element));
			}
			timelineFrameCount = Math.max(timelineFrameCount, layerFrameCount);
			const parentLayerIndex = nonNegativeInteger(layer.getAttribute("parentLayerIndex"));
			layerSummaries.push({
				index: layerIndex,
				name: boundedString(layer.getAttribute("name"), `Layer ${layerIndex + 1}`, 512),
				layerType: boundedString(layer.getAttribute("layerType"), "normal", 64).toLowerCase(),
				visible: booleanAttribute(layer.getAttribute("visible"), true),
				locked: booleanAttribute(layer.getAttribute("locked"), false),
				...parentLayerIndex === void 0 ? {} : { parentLayerIndex },
				frameCount: layerFrameCount,
				keyframeCount: frames.length,
				elements: counts
			});
		}
		summaries.push({
			index: summaries.length,
			name: boundedString(timeline.getAttribute("name"), `Timeline ${summaries.length + 1}`, 512),
			frameCount: timelineFrameCount,
			layers: layerSummaries
		});
	}
	return summaries;
};
var parseMatrix = (element) => {
	const container = elementChildren(element, "matrix")[0];
	const matrix = container ? elementChildren(container, "matrix")[0] : void 0;
	return {
		a: finiteNumber(matrix?.getAttribute("a"), 1),
		b: finiteNumber(matrix?.getAttribute("b"), 0),
		c: finiteNumber(matrix?.getAttribute("c"), 0),
		d: finiteNumber(matrix?.getAttribute("d"), 1),
		tx: finiteNumber(matrix?.getAttribute("tx"), 0),
		ty: finiteNumber(matrix?.getAttribute("ty"), 0)
	};
};
var matrixAttribute = (matrix) => `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.tx} ${matrix.ty})`;
var decodeEdgeCoordinate = (token) => {
	if (!token.startsWith("#")) {
		const parsed = Number(token);
		return Number.isFinite(parsed) ? parsed / 20 : void 0;
	}
	const [integerHex = "0", fractionHex = ""] = token.slice(1).split(".", 2);
	if (!/^[0-9a-f]+$/i.test(integerHex) || fractionHex && !/^[0-9a-f]+$/i.test(fractionHex)) return;
	let integer = Number.parseInt(integerHex, 16);
	if (!Number.isSafeInteger(integer)) return;
	if (integerHex.length >= 6) {
		const bits = integerHex.length * 4;
		const signThreshold = 2 ** (bits - 1);
		if (integer >= signThreshold) integer -= 2 ** bits;
	}
	const fraction = fractionHex ? Number.parseInt(fractionHex, 16) / 16 ** fractionHex.length : 0;
	return (integer < 0 ? integer - fraction : integer + fraction) / 20;
};
var edgeTokens = (source) => source.match(/[!|\[\/]|#[0-9a-f]+(?:\.[0-9a-f]+)?|[-+]?(?:\d+(?:\.\d*)?|\.\d+)/gi) || [];
var edgePath = (source, budget, limits) => {
	const tokens = edgeTokens(source);
	const parts = [];
	let index = 0;
	const coordinate = () => {
		const value = tokens[index++];
		return value === void 0 ? void 0 : decodeEdgeCoordinate(value);
	};
	while (index < tokens.length) {
		const command = tokens[index++];
		if (command === "/") {
			parts.push("Z");
			budget.pathCommands += 1;
		} else if (command === "!" || command === "|") {
			const x = coordinate();
			const y = coordinate();
			if (x === void 0 || y === void 0) return;
			parts.push(`${command === "!" ? "M" : "L"}${x} ${y}`);
			budget.pathCommands += 1;
		} else if (command === "[") {
			const cx = coordinate();
			const cy = coordinate();
			const x = coordinate();
			const y = coordinate();
			if (cx === void 0 || cy === void 0 || x === void 0 || y === void 0) return;
			parts.push(`Q${cx} ${cy} ${x} ${y}`);
			budget.pathCommands += 1;
		}
		if (budget.pathCommands > limits.maxPreviewPathCommands) throw new Error(`FLA first-frame preview exceeds ${limits.maxPreviewPathCommands} path commands.`);
	}
	return parts.length > 0 ? parts.join(" ") : void 0;
};
var shapeSvg = (element, budget, limits, warnings) => {
	const fills = /* @__PURE__ */ new Map();
	for (const fill of directContainerChildren(element, "fills", "fillstyle")) {
		const index = nonNegativeInteger(fill.getAttribute("index"));
		const solid = descendants(fill, "solidcolor")[0];
		if (index === void 0 || !solid) continue;
		fills.set(index, {
			color: safeColor(solid.getAttribute("color"), "#000000"),
			opacity: Math.min(1, Math.max(0, finiteNumber(solid.getAttribute("alpha"), 1)))
		});
	}
	const paths = [];
	for (const edge of directContainerChildren(element, "edges", "edge")) {
		const data = edgePath(edge.getAttribute("edges") || "", budget, limits);
		if (!data) {
			budget.unsupported += 1;
			continue;
		}
		const fillIndex = nonNegativeInteger(edge.getAttribute("fillStyle1")) ?? nonNegativeInteger(edge.getAttribute("fillStyle0"));
		const fill = fillIndex === void 0 ? void 0 : fills.get(fillIndex);
		paths.push(`<path d="${escapeXml(data)}" fill="${fill?.color || "none"}" fill-opacity="${fill?.opacity ?? 1}" fill-rule="evenodd"/>`);
		budget.elements += 1;
		if (budget.elements > limits.maxPreviewElements) throw new Error(`FLA first-frame preview exceeds ${limits.maxPreviewElements} elements.`);
	}
	if (paths.length === 0 && fills.size > 0) appendWarning(warnings, "A first-frame shape had no supported bounded edge path.");
	return paths.length > 0 ? `<g transform="${matrixAttribute(parseMatrix(element))}">${paths.join("")}</g>` : "";
};
var textSvg = (element, budget) => {
	const characters = descendants(element, "characters").map((node) => node.textContent || "").join("");
	if (!characters.trim()) return "";
	const attrs = descendants(element, "domtextattrs")[0];
	const size = Math.min(512, Math.max(1, finiteNumber(attrs?.getAttribute("size"), 16)));
	const color = safeColor(attrs?.getAttribute("fillColor"), "#111827");
	const matrix = parseMatrix(element);
	const left = finiteNumber(element.getAttribute("left"), 0);
	const top = finiteNumber(element.getAttribute("top"), 0);
	const font = boundedString(attrs?.getAttribute("face"), "sans-serif", 128).replace(/["'<>;]/g, "");
	budget.elements += 1;
	return `<text x="${left}" y="${top + size}" transform="${matrixAttribute(matrix)}" fill="${color}" font-size="${size}" font-family="${escapeXml(font)}">${escapeXml(characters.slice(0, 16384))}</text>`;
};
var bytesToBase64 = (bytes) => {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	let output = "";
	for (let index = 0; index < bytes.length; index += 3) {
		const first = bytes[index];
		const second = index + 1 < bytes.length ? bytes[index + 1] : 0;
		const third = index + 2 < bytes.length ? bytes[index + 2] : 0;
		output += alphabet[first >>> 2];
		output += alphabet[(first & 3) << 4 | second >>> 4];
		output += index + 1 < bytes.length ? alphabet[(second & 15) << 2 | third >>> 6] : "=";
		output += index + 2 < bytes.length ? alphabet[third & 63] : "=";
	}
	return output;
};
var bitmapSvg = (element, bitmaps, budget) => {
	const name = element.getAttribute("libraryItemName") || "";
	const bitmap = bitmaps.get(name);
	if (!bitmap) {
		budget.unsupported += 1;
		return "";
	}
	const matrix = parseMatrix(element);
	budget.elements += 1;
	return `<image width="${bitmap.width}" height="${bitmap.height}" transform="${matrixAttribute(matrix)}" href="${bitmap.dataUrl}"/>`;
};
var renderElement = (element, symbolRoots, bitmaps, budget, limits, warnings, symbolStack) => {
	if (budget.elements >= limits.maxPreviewElements) throw new Error(`FLA first-frame preview exceeds ${limits.maxPreviewElements} elements.`);
	const name = localName(element);
	if (name === "domshape") return shapeSvg(element, budget, limits, warnings);
	if (name.includes("text")) return textSvg(element, budget);
	if (name === "dombitmapinstance") return bitmapSvg(element, bitmaps, budget);
	if (name === "domsymbolinstance") {
		const symbolName = element.getAttribute("libraryItemName") || "";
		const symbolRoot = symbolRoots.get(symbolName);
		if (!symbolRoot || symbolStack.includes(symbolName) || symbolStack.length >= limits.maxSymbolDepth) {
			budget.unsupported += 1;
			return "";
		}
		const timeline = timelineElements(symbolRoot)[0];
		if (!timeline) {
			budget.unsupported += 1;
			return "";
		}
		const nested = renderTimelineFrame(timeline, symbolRoots, bitmaps, budget, limits, warnings, [...symbolStack, symbolName]);
		return nested ? `<g transform="${matrixAttribute(parseMatrix(element))}">${nested}</g>` : "";
	}
	if (name === "domgroup") {
		const nested = containerElements(element, "members").map((member) => renderElement(member, symbolRoots, bitmaps, budget, limits, warnings, symbolStack)).join("");
		return nested ? `<g transform="${matrixAttribute(parseMatrix(element))}">${nested}</g>` : "";
	}
	budget.unsupported += 1;
	return "";
};
var renderTimelineFrame = (timeline, symbolRoots, bitmaps, budget, limits, warnings, symbolStack = []) => {
	const layers = directContainerChildren(timeline, "layers", "domlayer");
	const output = [];
	for (let layerIndex = layers.length - 1; layerIndex >= 0; layerIndex -= 1) {
		const layer = layers[layerIndex];
		const layerType = (layer.getAttribute("layerType") || "normal").toLowerCase();
		if (!booleanAttribute(layer.getAttribute("visible"), true) || ["guide", "folder"].includes(layerType)) continue;
		if (layerType === "mask" || layerType === "masked") {
			appendWarning(warnings, "Mask-layer compositing is not reconstructed in the bounded first-frame preview.");
			budget.unsupported += 1;
			continue;
		}
		const frame = directContainerChildren(layer, "frames", "domframe").find((candidate) => {
			const index = nonNegativeInteger(candidate.getAttribute("index")) ?? 0;
			const duration = Math.max(1, nonNegativeInteger(candidate.getAttribute("duration")) ?? 1);
			return index <= 0 && index + duration > 0;
		});
		if (!frame) continue;
		const container = elementChildren(frame, "elements")[0];
		if (!container) continue;
		for (const element of elementChildren(container)) output.push(renderElement(element, symbolRoots, bitmaps, budget, limits, warnings, symbolStack));
	}
	return output.join("");
};
var rootNamespace = (root) => root.namespaceURI || root.getAttribute("xmlns") || "";
var requireXflRoot = (parsed, expectedRoot) => {
	const root = parsed.document.documentElement;
	if (!root || localName(root) !== expectedRoot) throw new Error(`${parsed.path} does not contain an XFL ${expectedRoot === "domdocument" ? "DOMDocument" : "DOMSymbolItem"} root.`);
	if (rootNamespace(root) !== XFL_NAMESPACE) throw new Error(`${parsed.path} does not declare the supported Adobe XFL 2008 namespace.`);
	return root;
};
var parseSymbols = async (buffer, directory, mainRoot, limits, xmlBudget, counters, warnings) => {
	const summaries = [];
	const roots = /* @__PURE__ */ new Map();
	if (!buffer || !directory) return {
		summaries,
		roots
	};
	const includes = directContainerChildren(mainRoot, "symbols", "include");
	if (includes.length > limits.maxSymbols) throw new Error(`FLA/XFL contains more than ${limits.maxSymbols} symbol references.`);
	for (const include of includes) {
		const href = include.getAttribute("href") || "";
		const path = normalizedLibraryPath(href);
		if (!path) {
			appendWarning(warnings, `Ignored unsafe XFL symbol path ${JSON.stringify(href)}.`);
			continue;
		}
		const entry = findEntry(directory, path);
		if (!entry || entry.directory) {
			appendWarning(warnings, `Referenced XFL symbol ${JSON.stringify(path)} is missing.`);
			continue;
		}
		const root = requireXflRoot(await extractTextEntry(buffer, directory, entry, limits, xmlBudget), "domsymbolitem");
		const name = boundedString(root.getAttribute("name"), href.replace(/\.xml$/i, ""), 1024);
		if (roots.has(name)) throw new Error(`FLA/XFL contains duplicate symbol name ${JSON.stringify(name)}.`);
		roots.set(name, root);
		const timelineSummary = summarizeTimelines(root, limits, counters)[0];
		summaries.push({
			name,
			href,
			symbolType: boundedString(root.getAttribute("symbolType"), "graphic", 64),
			timelineName: timelineSummary?.name || name,
			layerCount: timelineSummary?.layers.length || 0,
			frameCount: timelineSummary?.frameCount || 1
		});
	}
	return {
		summaries,
		roots
	};
};
var loadBitmapPreviews = async (buffer, directory, mainRoot, limits, warnings) => {
	const previews = /* @__PURE__ */ new Map();
	if (!buffer || !directory) return previews;
	const bitmapSources = /* @__PURE__ */ new Map();
	let totalBytes = 0;
	for (const item of descendants(mainRoot, "dombitmapitem")) {
		const name = item.getAttribute("name") || "";
		const path = normalizedLibraryPath(item.getAttribute("href") || "");
		if (!name || !path || !/\.(?:png|jpe?g)$/i.test(path)) continue;
		const previousPath = bitmapSources.get(name);
		if (previousPath) {
			if (previousPath !== path) throw new Error(`FLA/XFL contains duplicate bitmap library name ${JSON.stringify(name)}.`);
			continue;
		}
		bitmapSources.set(name, path);
		const entry = findEntry(directory, path);
		if (!entry || entry.directory) continue;
		if (entry.uncompressedSize > limits.maxPreviewAssetBytes) {
			appendWarning(warnings, `Skipped oversized bitmap resource ${JSON.stringify(path)}.`);
			continue;
		}
		totalBytes += entry.uncompressedSize;
		if (totalBytes > limits.maxPreviewAssetTotalBytes) {
			appendWarning(warnings, "Stopped loading bitmap previews at the aggregate first-frame asset limit.");
			break;
		}
		try {
			const bytes = await extractFlaZipEntry(buffer, directory, entry.name, limits.maxPreviewAssetBytes);
			const info = inspectEmbeddedRaster(bytes, void 0, {
				maxBytes: limits.maxPreviewAssetBytes,
				maxDimension: limits.maxPreviewDimension,
				maxPixels: limits.maxPreviewPixels
			});
			previews.set(name, {
				name,
				dataUrl: `data:${info.mimeType};base64,${bytesToBase64(bytes)}`,
				width: info.width,
				height: info.height
			});
		} catch (error) {
			appendWarning(warnings, `Skipped invalid bitmap ${JSON.stringify(path)}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return previews;
};
var buildDocumentPreview = async (format, container, main, limits, xmlBudget, warnings, buffer, directory) => {
	const root = requireXflRoot(main, "domdocument");
	const width = finiteNumber(root.getAttribute("width"), 550);
	const height = finiteNumber(root.getAttribute("height"), 400);
	if (width <= 0 || height <= 0 || width > limits.maxPreviewDimension || height > limits.maxPreviewDimension || width > Math.floor(limits.maxPreviewPixels / height)) throw new Error(`XFL stage dimensions ${width} x ${height} exceed the preview safety limit.`);
	const stage = {
		width,
		height,
		frameRate: Math.min(240, Math.max(.1, finiteNumber(root.getAttribute("frameRate"), 24))),
		backgroundColor: safeColor(root.getAttribute("backgroundColor"), "#FFFFFF"),
		currentTimeline: nonNegativeInteger(root.getAttribute("currentTimeline")) ?? 0
	};
	const counters = {
		timelines: 0,
		layers: 0,
		frames: 0
	};
	const timelines = summarizeTimelines(root, limits, counters);
	if (timelines.length === 0) throw new Error("XFL DOMDocument does not contain a timeline.");
	const symbols = await parseSymbols(buffer, directory, root, limits, xmlBudget, counters, warnings);
	const bitmaps = await loadBitmapPreviews(buffer, directory, root, limits, warnings);
	const timelineElementsList = timelineElements(root);
	const selectedTimeline = timelineElementsList[Math.min(stage.currentTimeline, timelineElementsList.length - 1)] || timelineElementsList[0];
	const previewBudget = {
		elements: 0,
		pathCommands: 0,
		unsupported: 0
	};
	const artwork = renderTimelineFrame(selectedTimeline, symbols.roots, bitmaps, previewBudget, limits, warnings);
	const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${stage.backgroundColor}"/>${artwork}</svg>`;
	if (new TextEncoder().encode(previewSvg).byteLength > limits.maxPreviewSvgBytes) throw new Error(`FLA first-frame SVG exceeds ${limits.maxPreviewSvgBytes} bytes.`);
	const resources = directory ? directory.entries.filter((entry) => !entry.directory).slice(0, limits.maxReportedResources).map((entry) => ({
		path: entry.name,
		byteLength: entry.uncompressedSize,
		kind: classifyResource(entry.name)
	})) : [];
	if (directory && directory.entries.filter((entry) => !entry.directory).length > limits.maxReportedResources) appendWarning(warnings, `Resource inventory was truncated to ${limits.maxReportedResources} entries.`);
	if (previewBudget.unsupported > 0) appendWarning(warnings, `${previewBudget.unsupported} first-frame element or effect was not reconstructed; timeline structure remains available.`);
	return {
		format,
		container,
		mimeType: XFL_MIME,
		name: boundedString(root.getAttribute("name"), format === "fla" ? "Animate document" : "XFL document", 512),
		xflVersion: boundedString(root.getAttribute("xflVersion"), "unknown", 64),
		creatorInfo: boundedString(root.getAttribute("creatorInfo"), "not declared", 512),
		entryCount: directory?.entries.length || 1,
		expandedBytes: directory?.totalUncompressedBytes || main.byteLength,
		stage,
		timelines,
		symbols: symbols.summaries,
		resources,
		previewSvg,
		previewElementCount: previewBudget.elements,
		unsupportedPreviewElements: previewBudget.unsupported,
		warnings
	};
};
var readFlaContainer = async (buffer, format = "fla", overrides) => {
	const limits = resolveFlaContainerLimits(overrides);
	if (buffer.byteLength === 0 || buffer.byteLength > limits.maxFileBytes) throw new Error(`FLA/XFL source is outside the 1-${limits.maxFileBytes} byte file limit.`);
	const bytes = new Uint8Array(buffer);
	if (isLegacyBinaryFla(bytes)) throw new Error("Legacy binary FLA (Flash CS4 and earlier) is intentionally not accepted. This renderer supports only modern compressed XFL-based FLA files.");
	if (!isZip(bytes)) {
		const source = decodeUtf8(bytes, "XFL source");
		if (/^PROXY-/i.test(source.trim())) throw new Error("This .xfl is only the marker of an uncompressed XFL folder. Select or package DOMDocument.xml together with its LIBRARY and asset folders; a single browser File object cannot read sibling files.");
		const xmlBudget = createXmlBudget();
		return buildDocumentPreview("xfl", "single-xml-xfl", parseXmlBytes(bytes, "XFL source", limits, xmlBudget), limits, xmlBudget, ["Single-file XML XFL has no sibling LIBRARY or media directory; external symbol and bitmap references cannot be resolved."]);
	}
	const directory = inspectFlaZipCentralDirectory(buffer, limits);
	const mainEntry = findEntry(directory, "DOMDocument.xml");
	if (!mainEntry || mainEntry.directory) throw new Error("Modern compressed FLA must contain a root DOMDocument.xml entry.");
	const warnings = [];
	const mimeEntry = findEntry(directory, "mimetype");
	if (mimeEntry && !mimeEntry.directory) {
		if (mimeEntry.localHeaderOffset !== 0 || mimeEntry.compressionMethod !== 0) throw new Error("FLA mimetype must be the first local ZIP entry and must be stored without compression.");
		const mime = decodeUtf8(await extractFlaZipEntry(buffer, directory, mimeEntry.name, 256), "FLA mimetype").trim();
		if (mime !== XFL_MIME) throw new Error(`FLA mimetype ${JSON.stringify(mime)} is not ${XFL_MIME}.`);
	} else appendWarning(warnings, "The compressed XFL package has no mimetype entry; DOMDocument.xml and its namespace supplied the format signature.");
	const xmlBudget = createXmlBudget();
	return buildDocumentPreview(format, "compressed-xfl", await extractTextEntry(buffer, directory, mainEntry, limits, xmlBudget), limits, xmlBudget, warnings, buffer, directory);
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/xdContainer.js
var DEFAULT_XD_CONTAINER_LIMITS = Object.freeze({
	...DEFAULT_XD_ZIP_LIMITS,
	maxManifestBytes: 2097152,
	maxStructureFileBytes: 8388608,
	maxStructureTotalBytes: 33554432,
	maxStructureFiles: 128,
	maxJsonNodes: 1e5,
	maxJsonDepth: 96,
	maxJsonStringBytes: 8388608,
	maxPreviewCandidates: 32,
	maxPreviewBytes: 25165824,
	maxPreviewTotalBytes: 67108864,
	maxPreviewDimension: 16384,
	maxPreviewPixels: 64e6,
	maxReportedResources: 512,
	maxReportedArtboards: 512
});
var positiveInteger = (value, fallback) => {
	return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : fallback;
};
var resolveXdContainerLimits = (overrides) => ({
	...resolveXdZipLimits(overrides),
	maxManifestBytes: positiveInteger(overrides?.maxManifestBytes, DEFAULT_XD_CONTAINER_LIMITS.maxManifestBytes),
	maxStructureFileBytes: positiveInteger(overrides?.maxStructureFileBytes, DEFAULT_XD_CONTAINER_LIMITS.maxStructureFileBytes),
	maxStructureTotalBytes: positiveInteger(overrides?.maxStructureTotalBytes, DEFAULT_XD_CONTAINER_LIMITS.maxStructureTotalBytes),
	maxStructureFiles: positiveInteger(overrides?.maxStructureFiles, DEFAULT_XD_CONTAINER_LIMITS.maxStructureFiles),
	maxJsonNodes: positiveInteger(overrides?.maxJsonNodes, DEFAULT_XD_CONTAINER_LIMITS.maxJsonNodes),
	maxJsonDepth: positiveInteger(overrides?.maxJsonDepth, DEFAULT_XD_CONTAINER_LIMITS.maxJsonDepth),
	maxJsonStringBytes: positiveInteger(overrides?.maxJsonStringBytes, DEFAULT_XD_CONTAINER_LIMITS.maxJsonStringBytes),
	maxPreviewCandidates: positiveInteger(overrides?.maxPreviewCandidates, DEFAULT_XD_CONTAINER_LIMITS.maxPreviewCandidates),
	maxPreviewBytes: positiveInteger(overrides?.maxPreviewBytes, DEFAULT_XD_CONTAINER_LIMITS.maxPreviewBytes),
	maxPreviewTotalBytes: positiveInteger(overrides?.maxPreviewTotalBytes, DEFAULT_XD_CONTAINER_LIMITS.maxPreviewTotalBytes),
	maxPreviewDimension: positiveInteger(overrides?.maxPreviewDimension, DEFAULT_XD_CONTAINER_LIMITS.maxPreviewDimension),
	maxPreviewPixels: positiveInteger(overrides?.maxPreviewPixels, DEFAULT_XD_CONTAINER_LIMITS.maxPreviewPixels),
	maxReportedResources: positiveInteger(overrides?.maxReportedResources, DEFAULT_XD_CONTAINER_LIMITS.maxReportedResources),
	maxReportedArtboards: positiveInteger(overrides?.maxReportedArtboards, DEFAULT_XD_CONTAINER_LIMITS.maxReportedArtboards)
});
var isRecord = (value) => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};
var asFiniteNumber = (value) => {
	const number = typeof value === "number" ? value : NaN;
	return Number.isFinite(number) ? number : void 0;
};
var validateJsonBudget = (root, limits, label) => {
	const stack = [{
		value: root,
		depth: 0
	}];
	let nodes = 0;
	let stringBytes = 0;
	while (stack.length > 0) {
		const current = stack.pop();
		nodes += 1;
		if (nodes > limits.maxJsonNodes) throw new Error(`${label} exceeds the ${limits.maxJsonNodes}-node JSON limit.`);
		if (current.depth > limits.maxJsonDepth) throw new Error(`${label} exceeds the ${limits.maxJsonDepth}-level JSON limit.`);
		if (typeof current.value === "string") {
			stringBytes += new TextEncoder().encode(current.value).byteLength;
			if (stringBytes > limits.maxJsonStringBytes) throw new Error(`${label} exceeds the ${limits.maxJsonStringBytes}-byte JSON string limit.`);
		} else if (Array.isArray(current.value)) for (const value of current.value) stack.push({
			value,
			depth: current.depth + 1
		});
		else if (isRecord(current.value)) for (const [key, value] of Object.entries(current.value)) {
			stringBytes += new TextEncoder().encode(key).byteLength;
			stack.push({
				value,
				depth: current.depth + 1
			});
		}
	}
};
var parseJsonBytes = (bytes, limits, label) => {
	let text;
	try {
		text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		throw new Error(`${label} is not valid UTF-8.`);
	}
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error(`${label} is not valid JSON.`);
	}
	validateJsonBudget(parsed, limits, label);
	return parsed;
};
var normalizeRelativePath = (path) => {
	if (!path || path.includes("\0") || path.includes("\\") || path.startsWith("/") || /^[A-Za-z]:/.test(path)) return;
	const segments = path.split("/").filter((segment, index, all) => index !== all.length - 1 || segment !== "");
	if (segments.length === 0 || segments.some((segment) => !segment || segment === "." || segment === "..")) return;
	return segments.join("/");
};
var joinManifestPath = (base, path) => {
	const normalized = normalizeRelativePath(path);
	if (!normalized) return;
	return base ? `${base}/${normalized}` : normalized;
};
var collectManifestReferences = (manifest, warnings) => {
	const references = [];
	const walk = (node, base, depth) => {
		if (depth > 96) return;
		let currentBase = base;
		if (typeof node.path === "string") {
			const resolved = joinManifestPath(base, node.path);
			if (!resolved) warnings.push(`Ignored unsafe XD manifest node path ${JSON.stringify(node.path)}.`);
			else currentBase = resolved;
		}
		if (Array.isArray(node.components)) for (const value of node.components) {
			if (!isRecord(value) || typeof value.path !== "string") continue;
			const resolved = joinManifestPath(currentBase, value.path);
			if (!resolved) {
				warnings.push(`Ignored unsafe XD manifest component path ${JSON.stringify(value.path)}.`);
				continue;
			}
			references.push({
				path: resolved,
				rel: typeof value.rel === "string" ? value.rel.toLowerCase() : "",
				type: typeof value.type === "string" ? value.type.toLowerCase() : "",
				width: asFiniteNumber(value.width),
				height: asFiniteNumber(value.height)
			});
		}
		if (Array.isArray(node.children)) {
			for (const child of node.children) if (isRecord(child)) walk(child, currentBase, depth + 1);
		}
	};
	walk(manifest, "", 0);
	return references;
};
var previewRelation = (rel) => {
	if (rel === "preview" || rel === "rendition" || rel === "thumbnail") return rel;
};
var inferImageMime = (path) => {
	const extension = path.split(".").pop()?.toLowerCase();
	return extension === "png" ? "image/png" : extension === "jpg" || extension === "jpeg" ? "image/jpeg" : "";
};
var collectPreviewCandidates = (directory, references, limits) => {
	const byPath = /* @__PURE__ */ new Map();
	for (const reference of references) {
		const relation = previewRelation(reference.rel);
		if (!relation || reference.type !== "image/png" && reference.type !== "image/jpeg") continue;
		const entry = directory.entryByName.get(reference.path);
		if (!entry || entry.directory || entry.uncompressedSize > limits.maxPreviewBytes) continue;
		byPath.set(reference.path, {
			...reference,
			relation
		});
	}
	for (const entry of directory.entries) {
		if (entry.directory || entry.uncompressedSize > limits.maxPreviewBytes || byPath.has(entry.name)) continue;
		if (entry.name !== "preview.png" && entry.name !== "thumbnail.png" && !/^renditions\/[A-Za-z0-9._/-]+\.(?:png|jpe?g)$/i.test(entry.name)) continue;
		const type = inferImageMime(entry.name);
		if (type) byPath.set(entry.name, {
			path: entry.name,
			rel: "",
			type,
			relation: "known-path"
		});
	}
	const relationRank = {
		preview: 4,
		rendition: 3,
		thumbnail: 2,
		"known-path": 1
	};
	return [...byPath.values()].sort((left, right) => {
		const leftArea = (left.width || 0) * (left.height || 0);
		return (right.width || 0) * (right.height || 0) - leftArea || relationRank[right.relation] - relationRank[left.relation] || left.path.localeCompare(right.path);
	}).slice(0, limits.maxPreviewCandidates);
};
var extractBestPreview = async (buffer, directory, candidates, limits, warnings) => {
	let selected;
	let extractedBytes = 0;
	for (const candidate of candidates) {
		const entry = directory.entryByName.get(candidate.path);
		if (!entry) continue;
		if (extractedBytes + entry.uncompressedSize > limits.maxPreviewTotalBytes) {
			warnings.push("Stopped reading XD preview candidates at the aggregate preview byte limit.");
			break;
		}
		extractedBytes += entry.uncompressedSize;
		try {
			const bytes = await extractXdZipEntry(buffer, directory, candidate.path, limits.maxPreviewBytes);
			const info = inspectEmbeddedRaster(bytes, candidate.type, {
				maxBytes: limits.maxPreviewBytes,
				maxDimension: limits.maxPreviewDimension,
				maxPixels: limits.maxPreviewPixels
			});
			const preview = {
				...info,
				path: candidate.path,
				relation: candidate.relation,
				bytes
			};
			const selectedArea = selected ? selected.width * selected.height : -1;
			if (info.width * info.height > selectedArea) selected = preview;
		} catch (error) {
			warnings.push(`Skipped XD preview ${JSON.stringify(candidate.path)}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return selected;
};
var STRUCTURE_PATH = /^artwork\/(?:pasteboard|artboard-[A-Za-z0-9_-]{1,128})\/graphics\/graphicContent\.agc$/;
var summarizeAgc = (path, entry, value) => {
	const record = isRecord(value) ? value : {};
	const roots = Array.isArray(record.children) ? record.children : [];
	const stack = [...roots];
	const topLevelLayers = roots.filter(isRecord).map((node) => typeof node.name === "string" && node.name.trim() || typeof node.type === "string" && node.type || "Unnamed").slice(0, 64);
	const typeCounts = {};
	let nodeCount = 0;
	while (stack.length > 0) {
		const node = stack.pop();
		if (!isRecord(node)) continue;
		nodeCount += 1;
		const type = typeof node.type === "string" && node.type ? node.type : "unknown";
		typeCounts[type] = (typeCounts[type] || 0) + 1;
		if (Array.isArray(node.children)) stack.push(...node.children);
	}
	return {
		path,
		byteLength: entry.uncompressedSize,
		nodeCount,
		topLevelLayers,
		typeCounts
	};
};
var resourceKind = (path) => {
	const extension = path.split(".").pop()?.toLowerCase() || "";
	if ([
		"png",
		"jpg",
		"jpeg",
		"gif",
		"webp"
	].includes(extension)) return "image";
	if (["agc", "json"].includes(extension)) return "structured-data";
	if ([
		"ttf",
		"otf",
		"woff",
		"woff2"
	].includes(extension)) return "font";
	return extension || "binary";
};
var extractArtboardMetadata = (value, limits) => {
	if (!isRecord(value) || !isRecord(value.artboards)) return [];
	const output = [];
	for (const [id, metadata] of Object.entries(value.artboards)) {
		if (id === "href" || !isRecord(metadata) || output.length >= limits.maxReportedArtboards) continue;
		output.push({
			id,
			name: typeof metadata.name === "string" && metadata.name.trim() ? metadata.name : id,
			width: asFiniteNumber(metadata.width),
			height: asFiniteNumber(metadata.height)
		});
	}
	return output;
};
var readXdContainer = async (buffer, overrides) => {
	const limits = resolveXdContainerLimits(overrides);
	const directory = inspectXdZipCentralDirectory(buffer, limits);
	const mimetypeEntry = directory.entryByName.get("mimetype");
	const manifestEntry = directory.entryByName.get("manifest");
	if (!mimetypeEntry || mimetypeEntry.directory || mimetypeEntry.uncompressedSize > 128) throw new Error("XD UCF container has no bounded root mimetype entry.");
	if (!manifestEntry || manifestEntry.directory || manifestEntry.uncompressedSize > limits.maxManifestBytes) throw new Error("XD UCF container has no bounded root manifest entry.");
	const mimetypeBytes = await extractXdZipEntry(buffer, directory, "mimetype", 128);
	const mimeType = new TextDecoder("utf-8", { fatal: true }).decode(mimetypeBytes).trim();
	if (mimeType !== "application/vnd.adobe.sparkler.project+dcxucf") throw new Error(`XD UCF container declares unexpected mimetype ${JSON.stringify(mimeType)}.`);
	const manifestValue = parseJsonBytes(await extractXdZipEntry(buffer, directory, "manifest", limits.maxManifestBytes), limits, "XD manifest");
	if (!isRecord(manifestValue)) throw new Error("XD manifest root must be a JSON object.");
	const warnings = [];
	const preview = await extractBestPreview(buffer, directory, collectPreviewCandidates(directory, collectManifestReferences(manifestValue, warnings), limits), limits, warnings);
	const structureEntries = directory.entries.filter((entry) => !entry.directory && (entry.name === "resources/graphics/graphicContent.agc" || STRUCTURE_PATH.test(entry.name)));
	if (structureEntries.length > limits.maxStructureFiles) warnings.push(`XD contains ${structureEntries.length} structure files; only the first ${limits.maxStructureFiles} are read.`);
	const selectedStructureEntries = structureEntries.slice(0, limits.maxStructureFiles);
	const structureFiles = [];
	const artboardMap = /* @__PURE__ */ new Map();
	let structureBytes = 0;
	for (const entry of selectedStructureEntries) {
		if (entry.uncompressedSize > limits.maxStructureFileBytes) {
			warnings.push(`Skipped oversized XD structure file ${JSON.stringify(entry.name)}.`);
			continue;
		}
		if (structureBytes + entry.uncompressedSize > limits.maxStructureTotalBytes) {
			warnings.push("Stopped reading XD structure files at the aggregate structure byte limit.");
			break;
		}
		structureBytes += entry.uncompressedSize;
		try {
			const parsed = parseJsonBytes(await extractXdZipEntry(buffer, directory, entry.name, limits.maxStructureFileBytes), limits, `XD structure ${entry.name}`);
			const summary = summarizeAgc(entry.name, entry, parsed);
			structureFiles.push(summary);
			if (entry.name === "resources/graphics/graphicContent.agc") for (const artboard of extractArtboardMetadata(parsed, limits)) {
				const current = artboardMap.get(artboard.id);
				artboardMap.set(artboard.id, {
					...current,
					...artboard
				});
			}
			else {
				const matchedId = /artwork\/artboard-([^/]+)\//.exec(entry.name)?.[1];
				if (matchedId) {
					const current = artboardMap.get(matchedId);
					artboardMap.set(matchedId, {
						id: matchedId,
						name: current?.name || summary.topLevelLayers[0] || matchedId,
						width: current?.width,
						height: current?.height,
						path: entry.name,
						nodeCount: summary.nodeCount,
						topLevelLayers: summary.topLevelLayers
					});
				}
			}
		} catch (error) {
			warnings.push(`Skipped XD structure ${JSON.stringify(entry.name)}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	const resources = directory.entries.filter((entry) => !entry.directory && entry.name.startsWith("resources/") && entry.name !== "resources/graphics/graphicContent.agc").slice(0, limits.maxReportedResources).map((entry) => ({
		path: entry.name,
		byteLength: entry.uncompressedSize,
		kind: resourceKind(entry.name)
	}));
	const resourceCount = directory.entries.filter((entry) => !entry.directory && entry.name.startsWith("resources/")).length;
	if (resourceCount > limits.maxReportedResources) warnings.push(`XD contains ${resourceCount} resource entries; ${limits.maxReportedResources} are listed.`);
	if (!preview) warnings.push("No valid embedded PNG/JPEG preview was found at a manifest or rendition path.");
	return {
		format: "xd",
		mimeType,
		name: typeof manifestValue.name === "string" && manifestValue.name.trim() ? manifestValue.name : "Adobe XD document",
		manifestVersion: String(manifestValue["manifest-format-version"] ?? manifestValue["uxdesign#version"] ?? "unknown"),
		entryCount: directory.entries.length,
		expandedBytes: directory.totalUncompressedBytes,
		preview,
		artboards: [...artboardMap.values()].slice(0, limits.maxReportedArtboards),
		resources,
		structureFiles,
		warnings
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/index.js
var definitions = [
	"photoshop-design",
	"illustrator-pdf-design",
	"postscript-design",
	"adobe-palette-design",
	"photoshop-resource-design",
	"indesign-idml-design",
	"indesign-exchange-design",
	"adobe-animate-xfl-design",
	"adobe-xd-design",
	"indesign-native-design"
].map((id) => DEFAULT_RENDERER_DEFINITIONS.find((definition) => definition.id === id));
if (definitions.some((definition) => !definition)) throw new Error("@file-viewer/renderer-design could not locate all shared Adobe design definitions.");
var designRendererDefinitions = definitions;
var enhancedDataFormats = new Set(designRendererDefinitions.flatMap((definition) => definition.enhancesRendererId === dataRendererDefinition.id ? [...definition.enhancesExtensions || []] : []));
var renderFileViewerDesign = (buffer, target, type, context) => import("./design-44MhdrI7.js").then(({ default: renderDesign }) => renderDesign(buffer, target, type, context));
/**
* Backwards-compatible dispatcher for callers that previously installed one
* combined data/design handler. The plugin itself now registers specialist
* owners so registry capabilities stay aligned with the selected handler.
*/
var renderFileViewerDesignOrData = (buffer, target, type, context) => enhancedDataFormats.has(String(type || "").toLowerCase()) ? renderFileViewerDesign(buffer, target, type, context) : renderFileViewerData(buffer, target, type, context);
var designRenderer = {
	id: "file-viewer-renderer-design",
	label: "Flyfish File Viewer Adobe design renderer",
	definitions: [dataRendererDefinition, ...designRendererDefinitions],
	handlers: [{
		rendererId: dataRendererDefinition.id,
		handler: renderFileViewerData
	}, ...designRendererDefinitions.map((definition) => ({
		rendererId: definition.id,
		handler: renderFileViewerDesign
	}))]
};
//#endregion
export { DEFAULT_FLA_CONTAINER_LIMITS, DEFAULT_INDESIGN_EXCHANGE_LIMITS, DEFAULT_PHOTOSHOP_PARSE_LIMITS, DEFAULT_POSTSCRIPT_SAFETY_LIMITS, designRenderer as default, designRenderer, designRendererDefinitions, inspectAdobeBrushLibrary, inspectAdobeCustomShapeLibrary, inspectIdmlZip, inspectInDesignContainer, inspectPhotoshopContainer, inspectPhotoshopHeader, parseAdobeBrushResource, parseAdobeColorSwatch, parseAdobePalette, parseAdobePresetResource, parseAdobeSwatchExchange, parseInDesignExchange, readFlaContainer, readInDesignContainer, readXdContainer, renderFileViewerDesign, renderFileViewerDesignOrData, resolveFlaContainerLimits, resolveInDesignContainerLimits, resolveInDesignExchangeLimits, resolvePhotoshopParseLimits, resolvePostscriptSafetyLimits, resolveXdContainerLimits };
