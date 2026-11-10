import { t as require_dist } from "./dist-Dkr0Qb6c.js";
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/adobeBrushPreflight.js
var import_dist = require_dist();
var Reader = class {
	view;
	offset = 0;
	constructor(buffer) {
		this.view = new DataView(buffer);
	}
	get length() {
		return this.view.byteLength;
	}
	ensure(length, end = this.length, label = "Adobe resource") {
		if (!Number.isSafeInteger(length) || length < 0 || this.offset + length > end || end > this.length) throw new Error(`${label} is truncated or has an invalid length.`);
	}
	u8(end, label) {
		this.ensure(1, end, label);
		return this.view.getUint8(this.offset++);
	}
	i16(end, label) {
		this.ensure(2, end, label);
		const value = this.view.getInt16(this.offset, false);
		this.offset += 2;
		return value;
	}
	u16(end, label) {
		this.ensure(2, end, label);
		const value = this.view.getUint16(this.offset, false);
		this.offset += 2;
		return value;
	}
	i32(end, label) {
		this.ensure(4, end, label);
		const value = this.view.getInt32(this.offset, false);
		this.offset += 4;
		return value;
	}
	u32(end, label) {
		this.ensure(4, end, label);
		const value = this.view.getUint32(this.offset, false);
		this.offset += 4;
		return value;
	}
	i32le(end, label) {
		this.ensure(4, end, label);
		const value = this.view.getInt32(this.offset, true);
		this.offset += 4;
		return value;
	}
	ascii(length, end, label) {
		this.ensure(length, end, label);
		let value = "";
		for (let index = 0; index < length; index += 1) value += String.fromCharCode(this.view.getUint8(this.offset++));
		return value;
	}
	skip(length, end, label) {
		this.ensure(length, end, label);
		this.offset += length;
	}
};
var align4 = (value) => {
	const aligned = value + 3 & -4;
	if (!Number.isSafeInteger(aligned) || aligned < value) throw new Error("Adobe resource alignment overflowed.");
	return aligned;
};
var multiply = (left, right, label) => {
	const value = left * right;
	if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} overflows the safe integer range.`);
	return value;
};
var assertSource = (buffer, limits, format) => {
	if (buffer.byteLength > limits.maxFileBytes) throw new Error(`${format.toUpperCase()} source exceeds the ${limits.maxFileBytes}-byte safety limit.`);
};
var consumeResourceItems = (count, limits, label) => {
	if (!Number.isSafeInteger(count) || count < 0 || count > limits.maxResourceItems) throw new Error(`${label} exceeds the ${limits.maxResourceItems}-item safety limit.`);
};
var consumeDescriptorItems = (budget, count, limits, label) => {
	consumeResourceItems(count, limits, label);
	budget.descriptorItems += count;
	const maximum = Math.min(1e6, limits.maxResourceItems * 64);
	if (budget.descriptorItems > maximum) throw new Error(`Adobe descriptor complexity exceeds the ${maximum}-record safety limit.`);
};
var consumePreview = (budget, pixels, decodedBytes, limits, label) => {
	if (pixels <= 0 || pixels > limits.maxResourcePreviewPixels) throw new Error(`${label} exceeds the ${limits.maxResourcePreviewPixels}-pixel preview limit.`);
	budget.previewPixels += pixels;
	budget.decodedBytes += decodedBytes;
	if (budget.previewPixels > limits.maxResourcePreviewPixels) throw new Error(`Adobe resource previews exceed the ${limits.maxResourcePreviewPixels}-pixel collection limit.`);
	if (budget.decodedBytes > limits.maxDecodedBytes) throw new Error(`Adobe resource decoding exceeds the ${limits.maxDecodedBytes}-byte safety limit.`);
};
var readUnicode = (reader, end, limits, label) => {
	const length = reader.u32(end, label);
	if (length > limits.maxResourceNameCodeUnits) throw new Error(`${label} exceeds the ${limits.maxResourceNameCodeUnits}-code-unit name limit.`);
	reader.skip(multiply(length, 2, `${label} length`), end, label);
};
var readPascal = (reader, end, limits, label) => {
	const length = reader.u8(end, label);
	if (length > limits.maxResourceNameCodeUnits) throw new Error(`${label} exceeds the ${limits.maxResourceNameCodeUnits}-code-unit name limit.`);
	reader.skip(length, end, label);
};
var readAsciiId = (reader, end, limits, label) => {
	const length = reader.i32(end, label);
	if (length < 0) throw new Error(`${label} has a negative string length.`);
	const actualLength = length || 4;
	if (actualLength > limits.maxResourceNameCodeUnits) throw new Error(`${label} exceeds the ${limits.maxResourceNameCodeUnits}-character identifier limit.`);
	reader.skip(actualLength, end, label);
};
var readClass = (reader, end, limits, label) => {
	readUnicode(reader, end, limits, `${label} name`);
	readAsciiId(reader, end, limits, `${label} class id`);
};
var readCount = (reader, end, budget, limits, label) => {
	const count = reader.i32(end, label);
	if (count < 0) throw new Error(`${label} has a negative item count.`);
	consumeDescriptorItems(budget, count, limits, label);
	return count;
};
var skipDescriptorValue = (reader, end, type, depth, budget, limits) => {
	if (depth > limits.maxNestingDepth) throw new Error(`Adobe descriptor nesting exceeds the ${limits.maxNestingDepth}-level safety limit.`);
	switch (type) {
		case "obj ": {
			const count = readCount(reader, end, budget, limits, "Adobe descriptor reference");
			for (let index = 0; index < count; index += 1) {
				const referenceType = reader.ascii(4, end, "Adobe descriptor reference type");
				if (referenceType === "prop") {
					readClass(reader, end, limits, "Adobe property reference");
					readAsciiId(reader, end, limits, "Adobe property key");
				} else if (referenceType === "Clss") readClass(reader, end, limits, "Adobe class reference");
				else if (referenceType === "Enmr") {
					readClass(reader, end, limits, "Adobe enum reference");
					readAsciiId(reader, end, limits, "Adobe enum type");
					readAsciiId(reader, end, limits, "Adobe enum value");
				} else if (referenceType === "rele") {
					readClass(reader, end, limits, "Adobe offset reference");
					reader.skip(4, end, "Adobe offset reference");
				} else if (referenceType === "Idnt" || referenceType === "indx") reader.skip(4, end, "Adobe integer reference");
				else if (referenceType === "name") {
					readClass(reader, end, limits, "Adobe name reference");
					readUnicode(reader, end, limits, "Adobe reference name");
				} else throw new Error(`Unsupported Adobe descriptor reference type ${JSON.stringify(referenceType)}.`);
			}
			return;
		}
		case "Objc":
		case "GlbO":
			skipDescriptorStructure(reader, end, depth + 1, budget, limits);
			return;
		case "VlLs": {
			const count = readCount(reader, end, budget, limits, "Adobe descriptor list");
			for (let index = 0; index < count; index += 1) skipDescriptorValue(reader, end, reader.ascii(4, end, "Adobe descriptor list type"), depth + 1, budget, limits);
			return;
		}
		case "doub":
			reader.skip(8, end, "Adobe double");
			return;
		case "UntF":
			reader.skip(12, end, "Adobe unit double");
			return;
		case "UnFl":
			reader.skip(8, end, "Adobe unit float");
			return;
		case "TEXT":
			readUnicode(reader, end, limits, "Adobe descriptor text");
			return;
		case "enum":
			readAsciiId(reader, end, limits, "Adobe enum type");
			readAsciiId(reader, end, limits, "Adobe enum value");
			return;
		case "long":
			reader.skip(4, end, "Adobe integer");
			return;
		case "comp":
			reader.skip(8, end, "Adobe large integer");
			return;
		case "bool":
			reader.skip(1, end, "Adobe boolean");
			return;
		case "type":
		case "GlbC":
			readClass(reader, end, limits, "Adobe descriptor class");
			return;
		case "alis":
		case "tdta": {
			const length = reader.i32(end, "Adobe descriptor data length");
			if (length < 0 || length > limits.maxDecodedBytes) throw new Error(`Adobe descriptor data exceeds the ${limits.maxDecodedBytes}-byte safety limit.`);
			reader.skip(length, end, "Adobe descriptor data");
			return;
		}
		case "ObAr": {
			reader.skip(4, end, "Adobe object-array version");
			readUnicode(reader, end, limits, "Adobe object-array name");
			readAsciiId(reader, end, limits, "Adobe object-array class");
			const count = readCount(reader, end, budget, limits, "Adobe object array");
			for (let index = 0; index < count; index += 1) {
				readAsciiId(reader, end, limits, "Adobe object-array item type");
				const valueType = reader.ascii(4, end, "Adobe object-array value type");
				if (valueType !== "UnFl") throw new Error(`Unsupported Adobe object-array value type ${JSON.stringify(valueType)}.`);
				reader.skip(4, end, "Adobe object-array units");
				const valueCount = readCount(reader, end, budget, limits, "Adobe object-array values");
				reader.skip(multiply(valueCount, 8, "Adobe object-array values"), end, "Adobe object-array values");
			}
			return;
		}
		case "Pth ": {
			const totalLength = reader.i32(end, "Adobe path length");
			if (totalLength < 0 || totalLength > limits.maxDecodedBytes) throw new Error("Adobe descriptor path length is invalid.");
			reader.skip(4, end, "Adobe path signature");
			const pathSize = reader.i32le(end, "Adobe path size");
			const characters = reader.i32le(end, "Adobe path character count");
			if (pathSize < 0 || characters < 0 || characters > limits.maxResourceNameCodeUnits) throw new Error("Adobe descriptor path exceeds its bounded string limits.");
			reader.skip(multiply(characters, 2, "Adobe path characters"), end, "Adobe descriptor path");
			return;
		}
		default: throw new Error(`Unsupported Adobe descriptor value type ${JSON.stringify(type)}.`);
	}
};
var skipDescriptorStructure = (reader, end, depth, budget, limits) => {
	if (depth > limits.maxNestingDepth) throw new Error(`Adobe descriptor nesting exceeds the ${limits.maxNestingDepth}-level safety limit.`);
	readClass(reader, end, limits, "Adobe descriptor");
	const count = reader.u32(end, "Adobe descriptor item count");
	consumeDescriptorItems(budget, count, limits, "Adobe descriptor item count");
	for (let index = 0; index < count; index += 1) {
		readAsciiId(reader, end, limits, "Adobe descriptor key");
		skipDescriptorValue(reader, end, reader.ascii(4, end, "Adobe descriptor value type"), depth + 1, budget, limits);
	}
};
var skipVersionedDescriptor = (reader, end, budget, limits) => {
	const version = reader.u32(end, "Adobe descriptor version");
	if (version !== 16) throw new Error(`Unsupported Adobe descriptor version ${version}.`);
	skipDescriptorStructure(reader, end, 0, budget, limits);
};
var inspectRleRows = (reader, end, width, height, label) => {
	const tableBytes = multiply(height, 2, `${label} row table`);
	reader.ensure(tableBytes, end, label);
	const rowLengths = Array.from({ length: height }, () => reader.u16(end, `${label} row length`));
	for (let row = 0; row < height; row += 1) {
		const rowEnd = reader.offset + rowLengths[row];
		if (rowEnd > end) throw new Error(`${label} compressed row ${row} is truncated.`);
		let decoded = 0;
		while (reader.offset < rowEnd) {
			const header = reader.u8(rowEnd, `${label} PackBits header`);
			if (header <= 127) {
				const count = header + 1;
				reader.skip(count, rowEnd, `${label} PackBits literal`);
				decoded += count;
			} else if (header >= 129) {
				reader.skip(1, rowEnd, `${label} PackBits repeat value`);
				decoded += 257 - header;
			}
			if (decoded > width) throw new Error(`${label} PackBits row ${row} expands beyond its declared width.`);
		}
		if (decoded !== width) throw new Error(`${label} PackBits row ${row} does not expand to its declared width.`);
	}
};
var inspectAbrSamples = (reader, end, minorVersion, budget, limits) => {
	let count = 0;
	while (reader.offset < end) {
		consumeResourceItems(++count, limits, "ABR sample count");
		const rawLength = reader.u32(end, "ABR sample length");
		const recordStart = reader.offset;
		const rawEnd = recordStart + rawLength;
		const paddedEnd = recordStart + align4(rawLength);
		if (rawEnd > end || paddedEnd > end) throw new Error("ABR sample record is truncated.");
		readPascal(reader, rawEnd, limits, "ABR sample id");
		reader.skip(minorVersion === 1 ? 10 : 264, rawEnd, "ABR sample header");
		const top = reader.i32(rawEnd, "ABR sample top");
		const left = reader.i32(rawEnd, "ABR sample left");
		const bottom = reader.i32(rawEnd, "ABR sample bottom");
		const width = reader.i32(rawEnd, "ABR sample right") - left;
		const height = bottom - top;
		if (width <= 0 || height <= 0 || width > limits.maxCanvasDimension || height > limits.maxCanvasDimension) throw new Error(`ABR sample dimensions exceed the ${limits.maxCanvasDimension}-pixel side limit.`);
		const pixels = multiply(width, height, "ABR sample pixels");
		const depth = reader.i16(rawEnd, "ABR sample depth");
		const compression = reader.u8(rawEnd, "ABR sample compression");
		if (depth !== 8 && depth !== 16) throw new Error(`Unsupported ABR sample depth ${depth}.`);
		if (compression !== 0 && compression !== 1) throw new Error(`Unsupported ABR sample compression ${compression}.`);
		if (depth === 16 && compression === 1) throw new Error("ABR 16-bit RLE samples are not supported by the decoding engine.");
		consumePreview(budget, pixels, pixels, limits, "ABR sample");
		if (compression === 0) reader.skip(multiply(pixels, depth / 8, "ABR raw sample bytes"), rawEnd, "ABR raw sample");
		else inspectRleRows(reader, rawEnd, width, height, "ABR sample");
		if (reader.offset > rawEnd) throw new Error("ABR sample payload exceeded its declared record boundary.");
		reader.offset = rawEnd;
		reader.offset = paddedEnd;
	}
	return count;
};
var inspectPatternRecord = (reader, sectionEnd, budget, limits) => {
	const rawLength = reader.u32(sectionEnd, "ABR pattern length");
	const end = reader.offset + align4(rawLength);
	if (end > sectionEnd) throw new Error("ABR pattern record is truncated.");
	if (reader.u32(end, "ABR pattern version") !== 1) throw new Error("Unsupported ABR pattern version.");
	const colorMode = reader.u32(end, "ABR pattern color mode");
	if (colorMode !== 1 && colorMode !== 2 && colorMode !== 3) throw new Error(`Unsupported ABR pattern color mode ${colorMode}.`);
	reader.skip(4, end, "ABR pattern origin");
	readUnicode(reader, end, limits, "ABR pattern name");
	readPascal(reader, end, limits, "ABR pattern id");
	if (colorMode === 2) reader.skip(772, end, "ABR indexed palette");
	if (reader.u32(end, "ABR pattern VMAL version") !== 3) throw new Error("Unsupported ABR pattern VMAL version.");
	reader.u32(end, "ABR pattern VMAL length");
	const top = reader.u32(end, "ABR pattern top");
	const left = reader.u32(end, "ABR pattern left");
	const bottom = reader.u32(end, "ABR pattern bottom");
	const right = reader.u32(end, "ABR pattern right");
	const channels = reader.u32(end, "ABR pattern channel count");
	if (bottom <= top || right <= left || channels > 16) throw new Error("ABR pattern bounds or channel count is invalid.");
	const width = right - left;
	const height = bottom - top;
	if (width > limits.maxCanvasDimension || height > limits.maxCanvasDimension) throw new Error(`ABR pattern dimensions exceed the ${limits.maxCanvasDimension}-pixel side limit.`);
	const pixels = multiply(width, height, "ABR pattern pixels");
	consumePreview(budget, pixels, multiply(pixels, 4, "ABR pattern RGBA bytes"), limits, "ABR pattern");
	for (let index = 0; index < channels + 2; index += 1) {
		if (!reader.u32(end, "ABR pattern channel presence")) continue;
		const length = reader.u32(end, "ABR pattern channel length");
		if (length < 23) throw new Error("ABR pattern channel length is invalid.");
		const channelEnd = reader.offset + length;
		if (channelEnd > end) throw new Error("ABR pattern channel is truncated.");
		const depth = reader.u32(channelEnd, "ABR pattern channel depth");
		const channelTop = reader.u32(channelEnd, "ABR pattern channel top");
		const channelLeft = reader.u32(channelEnd, "ABR pattern channel left");
		const channelBottom = reader.u32(channelEnd, "ABR pattern channel bottom");
		const channelRight = reader.u32(channelEnd, "ABR pattern channel right");
		const depth2 = reader.u16(channelEnd, "ABR pattern channel depth duplicate");
		const compression = reader.u8(channelEnd, "ABR pattern channel compression");
		if (depth !== 8 || depth2 !== 8 || compression !== 0 && compression !== 1) throw new Error("ABR pattern channel uses an unsupported depth or compression mode.");
		if (channelBottom < channelTop || channelRight < channelLeft || channelTop < top || channelLeft < left || channelBottom > bottom || channelRight > right) throw new Error("ABR pattern channel bounds are invalid.");
		const channelWidth = channelRight - channelLeft;
		const channelHeight = channelBottom - channelTop;
		const channelPixels = multiply(channelWidth, channelHeight, "ABR pattern channel pixels");
		if (compression === 0) {
			if (channelEnd - reader.offset !== channelPixels) throw new Error("ABR raw pattern channel length does not match its dimensions.");
			reader.skip(channelPixels, channelEnd, "ABR raw pattern channel");
		} else {
			inspectRleRows(reader, channelEnd, channelWidth, channelHeight, "ABR pattern channel");
			if (reader.offset !== channelEnd) throw new Error("ABR RLE pattern channel has trailing bytes.");
		}
	}
	reader.offset = end;
};
var inspectAdobeBrushLibrary = (buffer, limits) => {
	assertSource(buffer, limits, "ABR");
	const reader = new Reader(buffer);
	const major = reader.i16(void 0, "ABR version");
	if (major !== 6 && major !== 7 && major !== 9 && major !== 10) throw new Error(`Unsupported ABR version ${major}; the browser engine supports modern ABR versions 6, 7, 9, and 10.`);
	const minor = reader.i16(void 0, "ABR minor version");
	if (minor !== 1 && minor !== 2) throw new Error(`Unsupported ABR minor version ${minor}.`);
	const budget = {
		descriptorItems: 0,
		previewPixels: 0,
		decodedBytes: 0
	};
	let sections = 0;
	let samples = 0;
	let patterns = 0;
	while (reader.offset < reader.length) {
		consumeResourceItems(++sections, limits, "ABR section count");
		if (reader.ascii(4, void 0, "ABR section signature") !== "8BIM") throw new Error("Invalid ABR section signature.");
		const type = reader.ascii(4, void 0, "ABR section type");
		const rawLength = reader.u32(void 0, "ABR section length");
		const start = reader.offset;
		const end = start + rawLength;
		const paddedEnd = start + align4(rawLength);
		if (end > reader.length || paddedEnd > reader.length) throw new Error("ABR section is truncated.");
		if (type === "samp") samples += inspectAbrSamples(reader, end, minor, budget, limits);
		else if (type === "desc" || type === "phry") {
			skipVersionedDescriptor(reader, end, budget, limits);
			if (reader.offset !== end) throw new Error(`ABR ${type} descriptor does not consume its declared section.`);
		} else if (type === "patt") while (reader.offset < end) {
			consumeResourceItems(++patterns, limits, "ABR pattern count");
			inspectPatternRecord(reader, end, budget, limits);
		}
		else throw new Error(`Unsupported ABR section type ${JSON.stringify(type)}.`);
		if (reader.offset > end) throw new Error(`ABR ${type} section exceeded its declared boundary.`);
		reader.offset = paddedEnd;
	}
	consumeResourceItems(samples + patterns, limits, "ABR decoded resource count");
	return {
		format: "abr",
		majorVersion: major,
		minorVersion: minor,
		sections,
		samples,
		patterns,
		previewPixels: budget.previewPixels,
		decodedBytes: budget.decodedBytes
	};
};
var inspectAdobeCustomShapeLibrary = (buffer, limits) => {
	assertSource(buffer, limits, "CSH");
	const reader = new Reader(buffer);
	if (reader.ascii(4, void 0, "CSH signature") !== "cush") throw new Error("Invalid CSH signature.");
	const version = reader.u32(void 0, "CSH version");
	if (version !== 2) throw new Error(`Unsupported CSH version ${version}; version 2 is required.`);
	const shapes = reader.u32(void 0, "CSH shape count");
	consumeResourceItems(shapes, limits, "CSH shape count");
	let pathRecords = 0;
	let previewPixels = 0;
	const maximumPathRecords = Math.min(1e6, limits.maxResourceItems * 64);
	for (let shapeIndex = 0; shapeIndex < shapes; shapeIndex += 1) {
		readUnicode(reader, reader.length, limits, `CSH shape ${shapeIndex} name`);
		while (reader.offset % 4) reader.skip(1, reader.length, "CSH name padding");
		if (reader.u32(void 0, "CSH shape version") !== 1) throw new Error("Unsupported CSH shape record version.");
		const size = reader.u32(void 0, "CSH shape record length");
		const end = reader.offset + size;
		if (end > reader.length) throw new Error("CSH shape record is truncated.");
		readPascal(reader, end, limits, `CSH shape ${shapeIndex} id`);
		const top = reader.u32(end, "CSH shape top");
		const left = reader.u32(end, "CSH shape left");
		const bottom = reader.u32(end, "CSH shape bottom");
		const right = reader.u32(end, "CSH shape right");
		if (bottom <= top || right <= left) throw new Error("CSH shape bounds are invalid.");
		const width = right - left;
		const height = bottom - top;
		if (width > limits.maxCanvasDimension || height > limits.maxCanvasDimension) throw new Error(`CSH shape dimensions exceed the ${limits.maxCanvasDimension}-pixel side limit.`);
		const pixels = multiply(width, height, "CSH shape preview pixels");
		previewPixels += pixels;
		if (previewPixels > limits.maxResourcePreviewPixels) throw new Error(`CSH previews exceed the ${limits.maxResourcePreviewPixels}-pixel collection limit.`);
		if ((end - reader.offset) % 26 !== 0) throw new Error("CSH vector record section is not aligned to 26-byte path records.");
		let expectedKnots = 0;
		let actualKnots = 0;
		let hasPath = false;
		while (reader.offset < end) {
			pathRecords += 1;
			if (pathRecords > maximumPathRecords) throw new Error(`CSH path complexity exceeds the ${maximumPathRecords}-record safety limit.`);
			const selector = reader.u16(end, "CSH vector selector");
			if (selector === 0 || selector === 3) {
				if (hasPath && actualKnots !== expectedKnots) throw new Error("CSH path knot count does not match its declared count.");
				expectedKnots = reader.u16(end, "CSH path knot count");
				consumeResourceItems(expectedKnots, limits, "CSH path knot count");
				const operation = reader.i16(end, "CSH path boolean operation");
				if (operation < -1 || operation > 3) throw new Error("CSH path boolean operation is invalid.");
				reader.skip(20, end, "CSH path header");
				actualKnots = 0;
				hasPath = true;
			} else if (selector === 1 || selector === 2 || selector === 4 || selector === 5) {
				if (!hasPath) throw new Error("CSH knot appears before a path header.");
				reader.skip(24, end, "CSH Bezier knot");
				actualKnots += 1;
				if (actualKnots > expectedKnots) throw new Error("CSH path contains more knots than declared.");
			} else if (selector === 6 || selector === 7 || selector === 8) reader.skip(24, end, "CSH vector metadata record");
			else throw new Error(`Unsupported CSH vector selector ${selector}.`);
		}
		if (hasPath && actualKnots !== expectedKnots) throw new Error("CSH path knot count does not match its declared count.");
	}
	if (reader.offset !== reader.length) throw new Error("CSH file has trailing bytes outside its declared shapes.");
	return {
		format: "csh",
		version: 2,
		shapes,
		pathRecords,
		previewPixels
	};
};
//#endregion
//#region ../../node_modules/.pnpm/@file-viewer+renderer-design@3.1.2/node_modules/@file-viewer/renderer-design/dist/adobeBrushResourceParser.js
var finite = (value, label) => {
	if (!Number.isFinite(value)) throw new Error(`${label} is not finite.`);
	return value;
};
var boundedName = (value, limits, label) => {
	if (value.length > limits.maxResourceNameCodeUnits) throw new Error(`${label} exceeds the ${limits.maxResourceNameCodeUnits}-code-unit name limit.`);
	return value;
};
var summarizeShape = (shape, limits, label) => {
	const size = finite(shape.size, `${label} size`);
	const angle = finite(shape.angle, `${label} angle`);
	if (size < 0 || size > limits.maxCanvasDimension) throw new Error(`${label} size exceeds the ${limits.maxCanvasDimension}-pixel side limit.`);
	const summary = {
		type: shape.type,
		size,
		angle
	};
	if ("roundness" in shape) summary.roundness = finite(shape.roundness, `${label} roundness`);
	if ("hardness" in shape) summary.hardness = finite(shape.hardness, `${label} hardness`);
	if ("spacing" in shape) summary.spacing = finite(shape.spacing, `${label} spacing`);
	if (shape.type === "sampled") summary.sampledDataId = boundedName(shape.sampledData, limits, `${label} sampled-data id`);
	return summary;
};
var summarizeBrush = (brush, limits) => ({
	name: boundedName(brush.name, limits, "ABR brush name"),
	shape: summarizeShape(brush.shape, limits, `ABR brush ${JSON.stringify(brush.name)}`),
	hasDynamics: Boolean(brush.shapeDynamics || brush.scatter || brush.colorDynamics || brush.transfer || brush.brushPose),
	hasTexture: Boolean(brush.texture),
	hasDualBrush: Boolean(brush.dualBrush),
	...brush.toolOptions?.type ? { toolType: brush.toolOptions.type } : {}
});
var parseAbr = (buffer, limits) => {
	const preflight = inspectAdobeBrushLibrary(buffer, limits);
	const parsed = (0, import_dist.readAbr)(new Uint8Array(buffer), { logMissingFeatures: false });
	if (parsed.brushes.length + parsed.samples.length + parsed.patterns.length > limits.maxResourceItems) throw new Error(`ABR decoded resources exceed the ${limits.maxResourceItems}-item safety limit.`);
	let decodedBytes = 0;
	let previewPixels = 0;
	const samples = parsed.samples.map((sample, index) => {
		const { w: width, h: height, x, y } = sample.bounds;
		const pixels = width * height;
		if (!Number.isSafeInteger(pixels) || pixels <= 0 || sample.alpha.byteLength !== pixels) throw new Error(`ABR sample ${index} returned inconsistent decoded pixels.`);
		previewPixels += pixels;
		decodedBytes += sample.alpha.byteLength;
		return {
			id: boundedName(sample.id, limits, `ABR sample ${index} id`),
			x: finite(x, `ABR sample ${index} x`),
			y: finite(y, `ABR sample ${index} y`),
			width,
			height,
			alpha: sample.alpha
		};
	});
	const patterns = parsed.patterns.map((pattern, index) => {
		const { w: width, h: height, x, y } = pattern.bounds;
		const pixels = width * height;
		if (!Number.isSafeInteger(pixels) || pixels <= 0 || pattern.data.byteLength !== pixels * 4) throw new Error(`ABR pattern ${index} returned inconsistent decoded pixels.`);
		previewPixels += pixels;
		decodedBytes += pattern.data.byteLength;
		return {
			id: boundedName(pattern.id, limits, `ABR pattern ${index} id`),
			name: boundedName(pattern.name, limits, `ABR pattern ${index} name`),
			x: finite(x, `ABR pattern ${index} x`),
			y: finite(y, `ABR pattern ${index} y`),
			width,
			height,
			rgba: pattern.data
		};
	});
	if (previewPixels !== preflight.previewPixels || previewPixels > limits.maxResourcePreviewPixels) throw new Error("ABR decoded preview pixels do not match the bounded preflight result.");
	if (decodedBytes !== preflight.decodedBytes || decodedBytes > limits.maxDecodedBytes) throw new Error("ABR decoded byte count does not match the bounded preflight result.");
	return {
		format: "abr",
		version: `${preflight.majorVersion}.${preflight.minorVersion}`,
		engine: "ag-psd",
		fidelity: "decoded-tip-and-metadata-preview",
		brushes: parsed.brushes.map((brush) => summarizeBrush(brush, limits)),
		samples,
		patterns,
		limitations: ["The preview shows decoded tip alpha, embedded pattern pixels, and preset metadata; it does not simulate a painted stroke.", "Legacy ABR versions 1 and 2 and 16-bit RLE brush samples are rejected because the decoding engine does not implement them."]
	};
};
var number = (value) => {
	return Number((Math.abs(value) < 1e-9 ? 0 : value).toFixed(4)).toString();
};
var pathToSvg = (path, label) => {
	if (!path.knots.length) return {
		d: "",
		fillRule: path.fillRule,
		...path.operation ? { operation: path.operation } : {}
	};
	const points = path.knots.map((knot, index) => {
		if (knot.points.length !== 6 || knot.points.some((value) => !Number.isFinite(value))) throw new Error(`${label} knot ${index} has invalid Bezier coordinates.`);
		return knot.points;
	});
	const first = points[0];
	let d = `M ${number(first[2])} ${number(first[3])}`;
	for (let index = 1; index < points.length; index += 1) {
		const previous = points[index - 1];
		const current = points[index];
		d += ` C ${number(previous[4])} ${number(previous[5])} ${number(current[0])} ${number(current[1])} ${number(current[2])} ${number(current[3])}`;
	}
	if (!path.open) {
		const last = points.at(-1);
		d += ` C ${number(last[4])} ${number(last[5])} ${number(first[0])} ${number(first[1])} ${number(first[2])} ${number(first[3])} Z`;
	}
	return {
		d,
		fillRule: path.fillRule,
		...path.operation ? { operation: path.operation } : {}
	};
};
var parseCsh = (buffer, limits) => {
	const preflight = inspectAdobeCustomShapeLibrary(buffer, limits);
	const parsed = (0, import_dist.readCsh)(new Uint8Array(buffer));
	if (parsed.shapes.length !== preflight.shapes) throw new Error("CSH decoded shape count does not match its bounded preflight result.");
	let pathCount = 0;
	let knotCount = 0;
	const maximumRecords = Math.min(1e6, limits.maxResourceItems * 64);
	return {
		format: "csh",
		version: "2",
		engine: "ag-psd",
		fidelity: "vector-path-preview",
		shapes: parsed.shapes.map((shape, shapeIndex) => {
			if (!Number.isSafeInteger(shape.width) || !Number.isSafeInteger(shape.height) || shape.width <= 0 || shape.height <= 0) throw new Error(`CSH shape ${shapeIndex} has invalid dimensions.`);
			pathCount += shape.paths.length;
			const paths = shape.paths.map((path, pathIndex) => {
				knotCount += path.knots.length;
				return pathToSvg(path, `CSH shape ${shapeIndex} path ${pathIndex}`);
			});
			if (pathCount + knotCount > maximumRecords) throw new Error(`CSH decoded path complexity exceeds the ${maximumRecords}-record safety limit.`);
			return {
				id: boundedName(shape.id, limits, `CSH shape ${shapeIndex} id`),
				name: boundedName(shape.name, limits, `CSH shape ${shapeIndex} name`),
				width: shape.width,
				height: shape.height,
				paths,
				hasUnsupportedBooleanComposition: shape.paths.some((path) => path.operation && path.operation !== "combine")
			};
		}),
		limitations: ["Bezier geometry is preserved, but Photoshop exclude/subtract/intersect path operations are exposed as metadata rather than rasterized with Photoshop composition semantics.", "The preview does not include Photoshop tool presets, fills, strokes, or effects because CSH stores custom-shape paths rather than a styled document."]
	};
};
var parseAdobeBrushResource = (buffer, format, limits) => format === "abr" ? parseAbr(buffer, limits) : parseCsh(buffer, limits);
//#endregion
export { inspectAdobeBrushLibrary as n, inspectAdobeCustomShapeLibrary as r, parseAdobeBrushResource as t };
